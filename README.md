

categories.csv: contains 4 columns (supplied id, category name, branch, time of creation). This just specifies what categories were created at what branch at what time.
category-relations.csv: contains 4 columns (from category id, to category id, branch, time of creation) 
Docker
```
docker run --publish=7474:7474 --publish=7687:7687 --volume=$HOME/work/neo4j/data:/data --volume=/path/to/csv/folder:/var/lib/neo4j/import neo4j
```

```
Cypher commands for loading data and further scenarios are in cypher file
```


