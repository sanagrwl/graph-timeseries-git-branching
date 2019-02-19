const Category = require('../models/Category');
const Product = require('../models/Product');

const neo4j = require('neo4j-driver').v1;
const uri = 'bolt://localhost';
const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', '1234'));
const session = driver.session();

const endOfTime = new Date(2037, 12, 31).getTime();
const now = () => new Date().getTime();

class GraphRepository {

    static getDataBranch(branch) {
        const command  = `
        match (:branch {name: '${branch}'})-[:staging]->(sb:branch)
        return sb
        `;

        return GraphRepository.execCommand("getStagingBranch", command, (result) => {
            if (result.records.length == 0) {
                return {name: branch};
            } else {
                const stagingBranch = result.records[0].get(0).properties;
                stagingBranch.from = parseInt(stagingBranch.from.toString())
                stagingBranch.to = parseInt(stagingBranch.to.toString())
            
                return stagingBranch;
            }            
        });
    }

    static getCategories(branch) {
        const command = (branchName) => { 
            return `
                MATCH (start:start {id: 'start'})-[u:update]->(c:category),
                (b:branch {name: '${branchName}'})
                where b.name in ['master', '${branchName}'] 
                    and ((u.branch = '${branchName}') or (u.branch = 'master' and u.from < b.from and u.to > b.from))
                WITH b, c, u AS rels ORDER BY u.from DESC 
                WITH b, c,HEAD(COLLECT(rels)) as latestRel
                where latestRel.to = ${endOfTime} or (latestRel.to > b.from and latestRel.branch <> '${branchName}')
                return c
            `;
        }

        return GraphRepository.getDataBranch(branch)
        .then((b) => {
            return GraphRepository.execCommand("getCategories", command(b.name), (result) => {
                const categories = result.records.map((record) => {
                    const category_id = record.get(0).properties.id
                    const name = `Category ${category_id}`
                    return new Category(null, category_id, name)
                });
    
                return categories;
            });
        })
        
    }

    static getSubCategories(branch, parentId) {
        const command = (b) => {
            return `
                MATCH (:category {id: '${parentId}'})-[u:update]->(sc:category),
                (b:branch {name: '${b.name}'})
                where ((u.branch = '${b.name}') or (u.branch = 'master' and u.from < b.from and u.to > b.from))
                WITH b, sc, u AS rels ORDER BY u.from DESC 
                WITH b, sc,HEAD(COLLECT(rels)) as latestRel
                where latestRel.to = ${endOfTime} or (latestRel.to > b.from and latestRel.branch = 'master')
                return sc
            `;
        };

        return GraphRepository.getDataBranch(branch)
        .then((b) => {
            return GraphRepository.execCommand("getSubCategories", command(b), (result) => {
                const categories = result.records.map((record) => {
                    const cat_id = record.get(0).properties.id
                    const name = `Category ${cat_id}`
                    return new Category(parentId, cat_id, name)
                });
    
                return categories;
            })
        })
    }

    static createCategory(event) {
        const branch   = event.branch;
        const categoryId = event.categoryId;

        const command = `
        match (sn:start {id: 'start'}) 
        with sn
        create (c:category {id: '${categoryId}'}) 
        create (sn)-[:update {branch:'${branch}', from: ${now()}, to: ${endOfTime}}]->(c) 
        `;

        return GraphRepository.execCommand("createCategory", command);
    }

    static getProducts(branch, categoryId) {
        const command = (b) => {
            return `
            MATCH (branch:branch {name:"${b.name}"})-[u:update]->(rn:relation_node)<-[:rs]-(c:category {id: '${categoryId}'}) 
            WITH rn, u.from AS ufrom, u.type AS utype ORDER BY rn.id, u.from DESC 
            WITH rn,HEAD(COLLECT(utype)) AS lastut 
            WHERE lastut="ADD" 
            MATCH (c)-[:rs]->(rn)-[:re]->(p:product) 
            RETURN p
            `;
        }

        return GraphRepository.getDataBranch(branch)
        .then((b) => {
            return GraphRepository.execCommand('getProducts', command(b), (result) => {
            const products = result.records.map((record) => {
                const product_id = record.get(0).properties.id
                const name = `Product ${product_id}`
                return new Product(product_id, name)
            });

            return products;
            });
        });
    }

    static deleteProduct(removeProductEvent) {
        const branch = removeProductEvent.branch;
        const productId = removeProductEvent.productId;

        const command = `
        MATCH (branch:branch {name:"${branch}"})-[:update]->(rn:relation_node)-[:re]->(c:product {id:"${productId}"}) 
        WITH branch, COLLECT(DISTINCT rn) AS rns 
        FOREACH ( relation_node IN rns | 
            CREATE (branch)-[:update {type:"REMOVE", from: ${now()}}]->(relation_node)
        )
        `;

        return GraphRepository.execCommand('deleteProduct', command);
    }

    static deleteCategory(removeCategoryEvent) {
        const branch = removeCategoryEvent.branch;
        const categoryId = removeCategoryEvent.categoryId;

        const command = `
        match (c:category {id:"${categoryId}"}),
(c)<-[u:update {branch: 'master'}]-(mn),
(branch:branch {name: '${branch}'})
optional match (c)<-[bu:update {branch: '${branch}'}]-(bn)
        where (u.from < branch.from and u.to > branch.from) or bu.to = ${endOfTime}
        with c,bu,mn
 FOREACH(ignoreMe IN CASE WHEN (bu is not null) THEN [1] ELSE [] END |
	        set bu.to = ${now()}
		)
	  FOREACH(ignoreMe IN CASE WHEN (bu is null) THEN [1] ELSE [] END |
		        create (c)<-[rel:update {branch: '${branch}', from: ${now()}, to: ${now()}}]-(mn)
        )
                `;

        return GraphRepository.execCommand('deleteCategory', command);
    }

    static createBranch(branch) {
        const command = `
        create (branch:branch {name: '${branch}', from: ${now()}, to: ${endOfTime}}) 
        return branch
        `;

        return GraphRepository.execCommand('createBranch', command);
    }

    static associateStagingBranch(stagingBranchName, branch) {
        const command = `
        match (b:branch {name: '${branch}'}), (sb:branch {name: '${stagingBranchName}'})
        create (b)-[:staging]->(sb)
        `;

        return GraphRepository.execCommand("associateStagingBranch", command);
    }

    static createStagingBranch(stagingBranchName, branch) {
        return GraphRepository.createBranch(stagingBranchName).then(() => {
            return GraphRepository.associateStagingBranch(stagingBranchName, branch);
        });
    }

    static getBranches() {
        const command = `match (b:branch) where not (b)<-[:staging]-(:branch) return b`;
        return GraphRepository.execCommand("getBranches", command, (result) => {
            const branches = result.records.map((record) => {
                return {name: record.get(0).properties.name}
            });

            return branches;
        })
    }

    static getCategoryTree(branch, categoryId, beforeTime) {
        const t = beforeTime || endOfTime;
        const command = `
        match (:start)-[*]->(rn)-[*]->(:category {id: '${categoryId}'}),
        (rn)<-[u:update]-(:branch {name: '${branch}'})
        Where u.from < ${t}
        WITH rn, u.type AS utype ORDER BY rn.id, u.from DESC
        with rn, head(collect(utype)) as last_update
        where last_update = 'ADD'
        match p = (:start)-[*]->(rn)-[*]->(:category {id: '${categoryId}'})
        with distinct nodes(p) as nodes
        unwind filter(n IN nodes WHERE x(labels(n)) = "category") as n
        return n.id`;

        return GraphRepository.execCommand("getCategoryTree", command, (result) => {
            const ids = result.records.map((record) => {
                return record.get(0);
            });

            console.log(ids);
            return ids;
        })
    }

    static execCommand(logId, command, cb) {
        const identity = (result) => result;

        return new Promise((resolve, reject) => {
            const callback = cb || identity;
            console.log(logId, command)
            session.run(command).then(result => {                
                resolve(callback(result))
            });
        });
    }
}

module.exports = GraphRepository;  


// {_id: "5c6b41fc1ed1f6e7f2bc6991", name: "RemoveCategoryEvent", created_at: 1550533115750, branch: "master", categoryId: "8106"}branch: "master"categoryId: "8106"created_at: 1550533115750name: "RemoveCategoryEvent"_id: "5c6b41fc1ed1f6e7f2bc6991"__proto__: Object

// match p = (s:start)-[u:update* {branch: 'master'}]->(c:category {id: '8106'})
// with nodes(p) as nodes, relationships(p) as rels
// unwind filter(u IN rels WHERE u.from <= 1550533115750 and u.to > 1550533115750) as updates
// return distinct nodes

// delete is not working