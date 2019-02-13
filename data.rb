def category_data(cat_id)
    time_in_millis = cat_id
    "#{cat_id},Category-#{cat_id},master,#{time_in_millis}\n"
end

def create_categories(total_categories)
    File.open($categories_file, 'w') do |file|
        (1..total_categories).to_a.each do |cat_id|
            file.write(category_data(cat_id))
        end
    end    
end

def relationship_data(parent_id, sub_cat_id)
    time_in_millis = sub_cat_id
    "#{parent_id},#{sub_cat_id},master,#{time_in_millis}\n"
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
    last_id = parent_ids.max
    last_id
end

def create_category_relationships(top_categories_count, sub_categories_per_category, category_levels)
    parent_cat_id = 1
    File.open($categories_relations_file, 'w') do |file|
        top_level_ids = (1..top_categories_count).to_a.map do |counter|
            puts "#{counter}.Creating tree for category id #{parent_cat_id}"
            last_cat_id = create_parent_tree(parent_cat_id, sub_categories_per_category, category_levels, file)
            parent_cat_id = last_cat_id + 1
            parent_cat_id
        end.concat([1])

        top_level_ids
    end
end

def create_top_level_category_relationships(parent_ids)
    File.open($top_categories_relations_file, 'w') do |file|
        parent_ids.each do |top_level_cat_id|
            file.write("#{top_level_cat_id},master,#{top_level_cat_id}\n")
        end
    end
end

def create_all_relationships(top_categories_count, sub_categories_per_category, category_levels)
    top_level_ids = create_category_relationships(top_categories_count, sub_categories_per_category, category_levels)
    create_top_level_category_relationships(top_level_ids)
end


$categories_file = "categories.csv"
$categories_relations_file = "categories-relations.csv"
$top_categories_relations_file = "top-categories-relations.csv"

top_categories_count = 10
sub_categories_per_category = 3
category_levels = 5

total_categories_under_one_root = (0...category_levels).reduce(0) {|r, v| r + sub_categories_per_category ** v} 
total_categories = top_categories_count * total_categories_under_one_root

create_categories(total_categories)
create_all_relationships(top_categories_count, sub_categories_per_category, category_levels)
puts "Total Categories: #{total_categories}"



# create relationships
# File.open("toomanycategoryrelationships.csv", 'w') do |file|
#     sub_cat_count = 3
#     parent_cat_id = 1
#     (1..10).to_a.map do |counter|
#         last_cat_id = create_parent_tree(parent_cat_id, sub_cat_count, file).max
#         parent_cat_id = last_cat_id + 1
#         parent_cat_id
#     end.concat([1]).each do |top_level_cat_id|
#         write_relationship("start", top_level_cat_id, file)
#     end
# end
