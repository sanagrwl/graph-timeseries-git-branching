MATCH (n) DETACH DELETE n;

create (s:start {id: "start"});
CREATE CONSTRAINT ON (start:start) ASSERT start.id IS UNIQUE;

create (b:branch {name: 'master', from: 0, to: 2148530400000});

LOAD CSV FROM "file:///categories.csv" AS line
create (c:category {id: line[0]})
create (s:state {name: line[1]})
create (c)-[r:has_state {branch: line[2], from: toInt(line[3])}]->(s);

LOAD CSV FROM "file:///categories-relations.csv" AS line
match (a:category), (b:category), (branch:branch)
where a.id = line[0] and b.id = line[1] and branch.name = 'master'
create (rn:relation_node {id: (line[0] + '-' + line[1])})
create (a)-[:rs]->(rn)-[:re]->(b)
create (branch)-[:update {type: 'ADD', from: toInt(line[3])}]->(rn);

LOAD CSV FROM "file:///top-categories-relations.csv" AS line
match (a:start {id: "start"}), (b:category), (branch:branch {name: 'master'})
where b.id = line[0]
create (rn:relation_node {id: (a.id + '-' + b.id)})
create (a)-[:rs]->(rn)-[:re]->(b)
create (branch)-[:update {type: 'ADD', from: toInt(line[2])}]->(rn);

// Queries
MATCH (a:category)-[:rs]->(:relation_node)-[:re]->(b:category)
RETURN a.id AS FROM,b.id AS To ORDER BY FROM,To

// create a top level category
match (branch:branch {name: 'master'}), (sn:start {id: 'start'})
create (c:category {id: "test1"})
create (s:state {name: "test 1"})
create (c)-[r:has_state {branch: 'master', from: 1300}]->(s)
create (rn:relation_node {id: (sn.id + "-" + "test1")})
create (sn)-[:rs]->(rn)-[:re]->(c)
create (branch)-[:update {type: 'ADD', from: 1300}]->(rn);

// get top level categories - deprecated
match (start:start)-[:rs]->(rn:relation_node)-[:re]->(c:category) return start,rn,c

// delete a category

MATCH (branch:branch {name:"master"})-[:update]->(rn:relation_node)-[:rs|re]-(c:category {id:"test1"})
WITH branch, COLLECT(DISTINCT rn) AS rns
FOREACH ( relation_node IN rns |
 CREATE (branch)-[:update {type:"REMOVE", from: 1310}]->(relation_node)
)

// get latest updates for top level category
MATCH (branch:branch {name:"master"})-[u:update]->(rn:relation_node)<-[:rs]-(start:start {id: 'start'})
WITH rn, u.from AS ufrom, u.type AS utype ORDER BY rn.id, u.from DESC
WITH rn,HEAD(COLLECT(utype)) AS lastut
WHERE lastut="ADD"
MATCH (start)-[:rs]->(rn)-[:re]->(c:category)
RETURN start,c,rn
