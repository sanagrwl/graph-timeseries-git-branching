def time_in_millis
    Time.now.to_i * 1000
end

def category_data(cat_id)
    "#{cat_id},Category-#{cat_id},master,#{time_in_millis()}\n"
end

def create_categories(total_categories)
    File.open($categories_file, 'w') do |file|
        (1..total_categories).to_a.each do |cat_id|
            file.write(category_data(cat_id))
        end
    end    
end

def relationship_data(parent_id, sub_cat_id)
    "#{parent_id},#{sub_cat_id},master,#{time_in_millis()}\n"
end

def create_relationships(parent_id, sub_cat_count, offset, file)
    (1..sub_cat_count).to_a.map do |c|
        sub_cat_id = parent_id + c + offset
        file.write(relationship_data(parent_id, sub_cat_id))
        sub_cat_id
    end
end

def create_sub_relationships(parent_ids, sub_cat_count, file)
    offset = parent_ids.length - 1
    parent_ids.map do |parent_id|
        r = create_relationships(parent_id, sub_cat_count, offset, file)
        offset =  offset - 1 + r.length
        r
    end.flatten
end

def create_parent_tree(parent_cat_id, sub_categories_per_category, category_levels, file)
    parent_ids = [parent_cat_id]
    (1...category_levels).to_a.each do |level_number|
        parent_ids = create_sub_relationships(parent_ids, sub_categories_per_category, file)
    end
    parent_ids
end

def create_category_relationships(top_categories_count, sub_categories_per_category, category_levels)
    parent_cat_id = 1
    leaf_cat_ids = []
    File.open($categories_relations_file, 'w') do |file|
        top_level_ids = (1..top_categories_count).to_a.map do |counter|
            puts "#{counter}.Creating tree for category id #{parent_cat_id}"
            leaf_ids = create_parent_tree(parent_cat_id, sub_categories_per_category, category_levels, file)
            leaf_cat_ids.concat(leaf_ids)
            parent_cat_id = leaf_ids.max + 1
            parent_cat_id
        end.concat([1])

        {top_ids: top_level_ids, leaf_ids: leaf_cat_ids}
    end
end

def create_top_level_category_relationships(parent_ids)
    File.open($top_categories_relations_file, 'w') do |file|
        parent_ids.each do |top_level_cat_id|
            file.write("#{top_level_cat_id},master,#{time_in_millis()}\n")
        end
    end
end

def create_all_categories_relationships(top_categories_count, sub_categories_per_category, category_levels)
    result = create_category_relationships(top_categories_count, sub_categories_per_category, category_levels)
    create_top_level_category_relationships(result[:top_ids])
    result
end

def create_products(leaf_cat_ids, products_per_leaf_category)
    number_of_products = leaf_cat_ids.length * products_per_leaf_category
    product_ids = (1..number_of_products).to_a

    File.open($products_file, 'w') do |file|
        product_ids.each do |product_id|
            file.write("#{product_id},master,#{time_in_millis()}\n")
        end
    end

    File.open($products_relations_file, 'w') do |file|
        cat_product_groups = product_ids.each_slice(products_per_leaf_category).to_a
        leaf_cat_ids.each_with_index do |cat_id, index|
            cat_product_groups[index].each do |product_id|
                file.write("#{cat_id},#{product_id},master,#{time_in_millis()}\n")
            end            
        end
    end

    number_of_products
end

$categories_file = "categories.csv"
$categories_relations_file = "categories-relations.csv"
$top_categories_relations_file = "top-categories-relations.csv"
$products_file = "products.csv"
$products_relations_file = "products-relations.csv"

top_categories_count = 30
sub_categories_per_category = 4
category_levels = 5
products_per_leaf_category = 250

total_categories_under_one_root = (0...category_levels).reduce(0) {|r, v| r + sub_categories_per_category ** v} 
total_categories = top_categories_count * total_categories_under_one_root

create_categories(total_categories)
result = create_all_categories_relationships(top_categories_count, sub_categories_per_category, category_levels)

total_products = create_products(result[:leaf_ids],products_per_leaf_category)

puts "total categories = #{total_categories}"
puts "total products = #{products_per_leaf_category * total_categories}"

def bold(message)
    "\e[1m#{message}\e[0m"
end

puts <<-HEREDOC

#{bold("Total Categories created:")} #{total_categories}
#{bold("Total Products created:")} #{total_products}

#{bold("Start Neo4j:")}

docker run --publish=7474:7474 --publish=7687:7687 --volume=$HOME/work/neo4j/data:/data --volume=/path/to/csv/folder:/var/lib/neo4j/import neo4j

#{bold("First Time:")}

Neo4j browser: http://localhost:7474/
#{bold("Change password")} to #{bold("1234")}

#{bold("Load Database from Neo4j Browser (ensure multiline is selected in settings:")}

MATCH (n) DETACH DELETE n;

CREATE CONSTRAINT ON (start:start) ASSERT start.id IS UNIQUE;
CREATE CONSTRAINT ON (branch:branch) ASSERT branch.name IS UNIQUE;
CREATE CONSTRAINT ON (branch:staging_branch) ASSERT branch.name IS UNIQUE;
CREATE CONSTRAINT ON (rn:relation_node) ASSERT rn.id IS UNIQUE;
CREATE CONSTRAINT ON (c:category) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT ON (p:product) ASSERT p.id IS UNIQUE;

create (s:start {id: "start"});
create (b:branch {name: 'master', from: 0, to: 2148530400000});

USING PERIODIC COMMIT 1000
LOAD CSV FROM "file:///#{$categories_file}" AS line
create (c:category {id: line[0]});

USING PERIODIC COMMIT 1000
LOAD CSV FROM "file:///#{$categories_relations_file}" AS line
match (a:category), (b:category)
where a.id = line[0] and b.id = line[1]
create (a)-[:update {type: 'ADD', branch: 'master', from: toInt(line[3])}]->(b);

USING PERIODIC COMMIT 1000
LOAD CSV FROM "file:///#{$top_categories_relations_file}" AS line
match (a:start {id: "start"}), (b:category)
where b.id = line[0]
create (a)-[:update {type: 'ADD', branch: 'master', from: toInt(line[2])}]->(b);

USING PERIODIC COMMIT 1000
LOAD CSV FROM "file:///#{$products_file}" AS line
create (p:product {id: line[0]});

USING PERIODIC COMMIT 1000
LOAD CSV FROM "file:///#{$products_relations_file}" AS line
match (a:category), (b:product)
where a.id = line[0] and b.id = line[1]
create (a)-[:update {type: 'ADD', branch: 'master', from: toInt(line[3])}]->(b);


#{bold("Start app:")} (inside ui-server directory)
#{bold("Frontend")}: npm run server
#{bold("Server")}: node app/server.js

HEREDOC