# create categories
File.open("toomanycategories.csv", 'w') do |file|
    (1..1210).to_a.each do |number|
        file.write("#{number},Category-#{number},master,#{number}\n")
    end
end

# def create_sub_cats(parent_id, sub_cat_count, level, file) do
#     offset=sub_cat_count**(level-2);
#     (0...sub_cat_count).to_a.each do |increment|
#         file.write("#{parent_id},#{parent_id+offset+increment},master,#{parent_id+offset+increment}\n")
#     end
# end

def create_relationships(parent_id, sub_cat_count, offset, file)
    (1..sub_cat_count).to_a.map do |c|
        sub_cat_id = parent_id + c + offset
        file.write("#{parent_id},#{sub_cat_id},master,#{sub_cat_id}\n")
        sub_cat_id
    end
end

def create_parent_tree(parent_id, sub_cat_count, file)
    level_2_cat_ids = create_relationships(parent_id, sub_cat_count, 0, file)
    
    offset = level_2_cat_ids.length - 1
    level_3_cat_ids = level_2_cat_ids.map do |level_2_cat_id|
        r = create_relationships(level_2_cat_id, sub_cat_count, offset, file)
        offset =  offset + r.length
        r
    end.flatten

    offset = level_3_cat_ids.length - 1
    level_4_cat_ids = level_3_cat_ids.map do |level_3_cat_id|
        r = create_relationships(level_3_cat_id, sub_cat_count, level_3_cat_ids.length - 1, file)
        offset =  offset + r.length
        r
    end.flatten

    offset =  offset + level_3_cat_ids.length - 1
    level_4_cat_ids.map do |level_4_cat_id|
        r = create_relationships(level_4_cat_id, sub_cat_count, level_4_cat_ids.length - 1, file)
        offset = offset + r.length
        r
    end.flatten
end

File.open("toomanycategoryrelationships.csv", 'w') do |file|
    sub_cat_count = 3
    parent_cat_id = 1
    (1..10).to_a.each do |_|
        last_cat_id = create_parent_tree(parent_cat_id, sub_cat_count, file).max
        parent_cat_id = last_cat_id + 1
    end
end
