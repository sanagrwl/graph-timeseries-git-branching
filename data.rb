# create categories
File.open("toomanycategories.csv", 'w') do |file|
    (1..1210).to_a.each do |number|
        file.write("#{number},Category-#{number},master,#{number}\n")
    end
end

def create_relationships(parent_id, sub_cat_count, offset, file)
    (1..sub_cat_count).to_a.map do |c|
        sub_cat_id = parent_id + c + offset
        file.write("#{parent_id},#{sub_cat_id},master,#{sub_cat_id}\n")
        sub_cat_id
    end
end

def create_sub_relationships(parent_ids, sub_cat_count, file)
    offset = parent_ids.length - 1
    parent_ids.map do |sub_cat_id|
        r = create_relationships(sub_cat_id, sub_cat_count, offset, file)
        offset =  offset - 1 + r.length
        r
    end.flatten
end

def create_parent_tree(parent_id, sub_cat_count, file)
    level_2_cat_ids = create_sub_relationships([parent_id], sub_cat_count, file)
    level_3_cat_ids = create_sub_relationships(level_2_cat_ids, sub_cat_count, file)
    level_4_cat_ids = create_sub_relationships(level_3_cat_ids, sub_cat_count, file)
    level_5_cat_ids = create_sub_relationships(level_4_cat_ids, sub_cat_count, file)
    level_5_cat_ids
end

# create relationships
File.open("toomanycategoryrelationships.csv", 'w') do |file|
    sub_cat_count = 3
    parent_cat_id = 1
    (1..10).to_a.each do |counter|
        last_cat_id = create_parent_tree(parent_cat_id, sub_cat_count, file).max
        parent_cat_id = last_cat_id + 1
    end
end
