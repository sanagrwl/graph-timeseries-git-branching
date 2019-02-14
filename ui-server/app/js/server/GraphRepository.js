const Category = require('../models/Category');
const Product = require('../models/Product');

const neo4j = require('neo4j-driver').v1;
const uri = 'bolt://localhost';
const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', '1234'));
const session = driver.session();

const endOfTime = new Date(2037, 12, 31).getTime();
const now = () => new Date().getTime();

class GraphRepository {

    static getCategories(branch) {
        console.log(`branch ${branch}`)
        const command = `
        MATCH (branch:branch {name:'${branch}'})-[u:update]->(rn:relation_node)<-[:rs]-(start:start {id: 'start'}) 
        WITH rn, u.from AS ufrom, u.type AS utype ORDER BY rn.id, u.from DESC 
        WITH rn,HEAD(COLLECT(utype)) AS lastut 
        WHERE lastut="ADD" 
        MATCH (start)-[:rs]->(rn)-[:re]->(c:category) 
        RETURN c
        `;

        console.log(command);

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const categories = result.records.map((record) => {
                    const category_id = record.get(0).properties.id
                    const name = `Category ${category_id}`
                    return new Category(null, category_id, name)
                });

                resolve(categories);
            });
        });
    }

    static getSubCategories(branch, parentId) {
        const command = `
        MATCH (branch:branch {name:'${branch}'})-[u:update]->(rn:relation_node)<-[:rs]-(c:category {id: '${parentId}'})
        WITH rn, u.from AS ufrom, u.type AS utype ORDER BY rn.id, u.from DESC
        WITH rn,HEAD(COLLECT(utype)) AS lastut
        WHERE lastut="ADD"
        MATCH (rn)-[:re]->(c:category)
        RETURN c
        `;

        console.log("getSubCategories", command);

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const categories = result.records.map((record) => {
                    const cat_id = record.get(0).properties.id
                    const name = `Category ${cat_id}`
                    return new Category(parentId, cat_id, name)
                });

                resolve(categories);
            });
        });
    }

    static createCategory(branch, categoryId, name) {
        console.log(`createCategory: ${branch}`);

        const from = new Date().getTime();
        const command = `
        match (branch:branch {name: '${branch}'}), (sn:start {id: 'start'}) 
        create (c:category {id: '${categoryId}'}) 
        create (rn:relation_node {id: (sn.id + "-" + '${categoryId}')}) 
        create (sn)-[:rs]->(rn)-[:re]->(c) 
        create (branch)-[:update {type: 'ADD', from: ${from}}]->(rn)
        `;

        console.log(command)

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                resolve(result)
            });
        });
    }

    static getProducts(branch, categoryId) {
        const command = `
        MATCH (branch:branch {name:"${branch}"})-[u:update]->(rn:relation_node)<-[:rs]-(c:category {id: '${categoryId}'}) 
        WITH rn, u.from AS ufrom, u.type AS utype ORDER BY rn.id, u.from DESC 
        WITH rn,HEAD(COLLECT(utype)) AS lastut 
        WHERE lastut="ADD" 
        MATCH (c)-[:rs]->(rn)-[:re]->(p:product) 
        RETURN p
        `;

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const products = result.records.map((record) => {
                    const product_id = record.get(0).properties.id
                    const name = `Product ${product_id}`
                    return new Product(product_id, name)
                });

                resolve(products);
            });
        });

        console.log(`getProducts `, command)
    }

    static deleteProduct(branch, productId) {
        const command = `
        MATCH (branch:branch {name:"${branch}"})-[:update]->(rn:relation_node)-[:re]->(c:product {id:"${productId}"}) 
        WITH branch, COLLECT(DISTINCT rn) AS rns 
        FOREACH ( relation_node IN rns | 
            CREATE (branch)-[:update {type:"REMOVE", from: ${now()}}]->(relation_node)
        )
        `;

        console.log('deleteProduct', command);

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                resolve({});
            });
        });
    }

    static deleteCategory(branch, categoryId) {
        const command = `
        MATCH (branch:branch {name:"${branch}"})-[:update]->(rn:relation_node)-[:rs|re]-(c:category {id:"${categoryId}"})
            WITH branch, COLLECT(DISTINCT rn) AS rns
        FOREACH ( relation_node IN rns |
            CREATE (branch)-[:update {type:"REMOVE", from: ${now()}}]->(relation_node)
        )
        `;

        console.log('deleteCategory', command);

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                resolve();
            });
        });
    }

    static createBranch(branch) {
        const command = `
        create (branch:branch {name: '${branch}', from: ${now()}, to: ${endOfTime}}) 
        with branch 
        MATCH (:branch {name:"master"})-[u:update]->(rn:relation_node) 
        WITH branch, rn, u.from AS ufrom, u.type AS utype ORDER BY rn.id, u.from DESC 
        WITH branch, rn,HEAD(COLLECT(utype)) AS lastut 
        WHERE lastut="ADD" 
        WITH branch, rn, COLLECT(DISTINCT rn) as rns 
        FOREACH (relation_node IN rns | 
            CREATE (branch)-[:update {type:"ADD", from: ${now()}}]->(relation_node) 
        )
        `;

        console.log(`createBranch `, command)
        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                resolve(result)
            });
        });
    }

    static getBranches() {
        const command = `match (b:branch) return b`;
        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const branches = result.records.map((record) => {
                    return {name: record.get(0).properties.name}
                });

                resolve(branches)
            });
        });
    }
}

module.exports = GraphRepository;  