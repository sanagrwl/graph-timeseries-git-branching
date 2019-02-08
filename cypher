

MATCH (n) DETACH DELETE n;

LOAD CSV FROM "file:///categories.csv" AS line
create (c:category {id: line[0]})
create (s:state {name: line[1]})
create (c)-[r:has_state {branch: line[2], from: toInt(line[3]), to: 1000}]->(s);

LOAD CSV FROM "file:///category-relations.csv" AS line
match (a:category), (b:category)
where a.id = line[0] and b.id = line[1]
create (a)-[r:contains {branch: line[2], from: toInt(line[3]), to: 1000}]->(b);

****** branch was created at T6 ******
//// user added a leaf category at T7 on master
//// user added a leaf category at T7 on branch

//// whats in master
match (a:category)-[r:has_state {branch: 'master', to: 1000}]->(as:state) return a,r,as

//// whats in branch
match (a:category)-[r:has_state {branch: 'master'}]->(as:state) where r.from <=6 and r.to > 6
Optional match (a)-[rb:contains {branch: 'branch'}]->(bc:category)
Optional match (bc)-[bcr:has_state {branch: 'branch'}]->(bs:state)
return a,as,bc,bs


***** user renamed catgory "keyless entry" to "Smart Keyless Entry" at time T8 on master *******
create (s:state {name: 'Smart Keyless Entry'})
with s
match (a:category {id: '5'})-[r:has_state]->(as:state) where r.to = 1000 and r.branch = 'master'
merge (a)-[:has_state {branch: 'master', from: 8, to: 1000}]-> (s)
set r.to = 8

//// see what category looks like, one relationship is expired, one is current
match (a:category {id: '5'})-[r:has_state {branch: 'master'}]->(as:state) return a,r,as

//// see only latest changes even though expired relationship exists
match (a:category {id: '5'})-[r:has_state {branch: 'master', to: 1000}]->(as:state) return a,r,as

//// branch view at T8
match (a:category)-[ar:has_state {branch: 'master'}]->(as:state) where ar.from <=6 and ar.to > 6
Optional match (b:category)-[br:has_state {branch: 'branch'}]->(bs:state) where br.from > 6 and br.to = 1000
Optional match (a)-[rb:contains {branch: 'branch'}]->(bc:category)
return a,as,b,bs,bc

//// master view at T8


***** user adds new parent category on branch at time t9 ******
create (c:category {id: '9'})
with c
create (s:state {name: 'Plastics'})
merge (c)-[r:has_state {branch: 'branch', from: 9, to: 1000}]->(s)

//// branch view
match (a:category)-[ar:has_state {branch: 'master'}]->(as:state) where ar.from <=6 and ar.to > 6
Optional match (b:category)-[br:has_state {branch: 'branch'}]->(bs:state) where br.from > 6 and br.to = 1000
Optional match (a)-[rb:contains {branch: 'branch'}]->(bc:category)
return a,as,b,bs,bc

//// master view
match (a:category)-[r:has_state {branch: 'master', to: 1000}]->(as:state) where r.to = 1000 return a,r,as


