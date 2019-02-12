

MATCH (n) DETACH DELETE n;

create (s:start {id: "start"});
CREATE CONSTRAINT ON (start:start) ASSERT start.id IS UNIQUE;

create (b:branch {name: 'master', from: 0, to: 2148530400000});

LOAD CSV FROM "file:///toomanycategories.csv" AS line
create (c:category {id: line[0]})
create (s:state {name: line[1]})
create (c)-[r:has_state {branch: line[2], from: toInt(line[3]), to: 2148530400000}]->(s);

LOAD CSV FROM "file:///toomanycategoryrelationships.csv" AS line
match (a:category), (b:category)
where a.id = line[0] and b.id = line[1]
create (a)-[r:contains {branch: line[2], from: toInt(line[3]), to: 2148530400000}]->(b);

LOAD CSV FROM "file:///startCategoryRelationships.csv" AS line
match (a:start {id: "start"}), (b:category)
where b.id = line[0]
create (a)-[r:contains {branch: line[1], from: toInt(line[2]), to: 2148530400000}]->(b);

***** user created a branch at time 

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
create (c:category {id: 'foobar'})
with c
create (s:state {name: 'hello world'})
merge (c)-[r:has_state {branch: 'test', from: 1500, to: 2148530400000}]->(s)

//// branch view
match (a:category)-[ar:has_state {branch: 'master'}]->(as:state) where ar.from <=6 and ar.to > 6
Optional match (b:category)-[br:has_state {branch: 'branch'}]->(bs:state) where br.from > 6 and br.to = 1000
Optional match (a)-[rb:contains {branch: 'branch'}]->(bc:category)
return a,as,b,bs,bc

//// master view
match (a:category)-[r:has_state {branch: 'master', to: 1000}]->(as:state) where r.to = 1000 return a,r,as


**** user deletes category 4 (door hardware) in master at time t10 ******
match (n:category {id: '4'})-[r:contains* {branch: 'master', to: 1000}]->(:category)-[rsc:has_state {branch: 'master', to: 1000}]->(:state),
(n)-[rs:has_state {branch: 'master', to: 1000}]->(:state),
(n)<-[incr:contains {branch: 'master', to: 1000}]-(:category)
unwind r as rentry
with  rsc, rs, incr, rentry
set rsc.to = 10, rs.to = 10, incr.to = 10, rentry.to = 10

//// branch view
match (a:category)-[ar:has_state {branch: 'master'}]->(as:state) where ar.from <=6 and ar.to > 6
Optional match (b:category)-[br:has_state {branch: 'branch'}]->(bs:state) where br.from > 6 and br.to = 1000
Optional match (a)-[rb:contains {branch: 'branch'}]->(bc:category)
return a,as,b,bs,bc

//// master view
match (a:category)-[r:has_state {branch: 'master', to: 1000}]->(as:state) where r.to = 1000 return a,r,as





create (s:start {id: 'start'})
with s
create (c:foo {id: 'c1'})
merge (s)-[r:top {branch: 'master', from: 1, to: 2148530400000}]->(c);

match (s:start {id: 'start'})
with s
create (c:foo {id: 'c2'})
merge (s)-[r:top {branch: 'master', from: 2, to: 2148530400000}]->(c);

match (s:start {id: 'start'})
with s
create (c:foo {id: 'c3'})
merge (s)-[r:top {branch: 'master', from: 3, to: 2148530400000}]->(c);

--- some branch created and new node created as root node

match (s:start {id: 'start'})
with s
create (c:foo {id: 'branch c3'})
merge (s)-[r:top {branch: 'sandeep', from: 4, to: 2148530400000}]->(c);

---- make c3 as subchild on branch
match (s:foo {id: 'branch c3'})
with s
match (c:foo {id: 'c3'})
merge (s)-[r:top {branch: 'sandeep', from: 5, to: 2148530400000}]->(c);

match (s:start {id: 'start'})
with s
match (c:foo {id: 'c3'})
merge (s)-[r:top {branch: 'sandeep', from: 5, to: 5}]->(c);


MATCH (:start)-[:top {branch: 'master'}]->(f:foo)
RETURN f as foo
UNION
MATCH (:start)-[:top {branch: 'sandeep'}]->(f:foo)
RETURN f as foo

match (s:start)-[t:top]->(mc:foo) where t.branch in ["master", "sandeep"]
with  mc, t order by t.from desc

return t, mc




match (s:start)-[t:top]->(mc:foo) where t.branch in ["master", "sandeep"]
with s, mc, t order by t.from desc
with s, mc, head(collect(t)) as latest
where latest.from <= branch.from latest.to > branch.from
return s, mc, latest