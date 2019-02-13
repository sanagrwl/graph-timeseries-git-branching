const AddCatalogEvent = require('../events/AddCatalogEvent');
const AddCategoryEvent = require('../events/AddCategoryEvent');
const AddProductEvent = require('../events/AddProductEvent');
const RemoveCategoryEvent = require('../events/RemoveCategoryEvent');
const RemoveProductEvent = require('../events/RemoveProductEvent');
const SetProductAttributeEvent = require('../events/SetProductAttributeEvent');
const AddBranchEvent = require('../events/AddBranchEvent');
const Category = require('../models/Category');
const Product = require('../models/Product');

const neo4j = require('neo4j-driver').v1;

const uri = 'bolt://localhost';

const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', '1234'));
const session = driver.session();

const endOfTime = new Date(2037, 12, 31).getTime();

const now = () => new Date().getTime();

class EventRepository {
    static serializeEvent(event) {
        const cloneEvent = JSON.parse(JSON.stringify(event));
        delete cloneEvent.catalog;

        return JSON.stringify(cloneEvent).replace(/\"([^(\")"]+)\":/g, "$1:");
    }

    static addEvent(event, parentId) {
        let promise;
        if (parentId) {
            promise = EventRepository.appendEvent(event, parentId);
        } else {
            promise = EventRepository.createAddCatalogEvent(event);
        }

        return new Promise((resolve, reject) => {
            promise.then(result => {
                const eventId = result.records[0].get(0).identity.low;

                resolve(eventId);
            });
        });
    }

    static appendEvent(event, parentId) {
        const serializedEvent = EventRepository.serializeEvent(event);
        const command = `MATCH (parent:Event) where ID(parent) = ${parentId}
CREATE (parent)-[r:APPEND {parentId: ${parentId}}]->(e:Event ${serializedEvent}) RETURN e`;

        return session.run(command);
    }

    static createAddCatalogEvent(event) {
        const serializedEvent = EventRepository.serializeEvent(event);
        const command = `CREATE (e:Event ${serializedEvent}) RETURN e`;

        return session.run(command);
    }

    static isMaster(branch) {
        return branch === 'master';
    }

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
                    return new Category(category_id, name)
                });

                resolve(categories);
            });
        });
    }

    static getSubCategories(branch, categoryId) {
        const command = `
        MATCH (branch:branch {name:'${branch}'})-[u:update]->(rn:relation_node)<-[:rs]-(c:category {id: '${categoryId}'})
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
                    return new Category(cat_id, name)
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

    static endOfTime() {
        return new Date(2037, 12, 31).getTime()
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

    static getChainOfEvents(eventId) {
        const command = `MATCH (x:Event)-[:APPEND*0..]->(e:Event) where ID(e) = ${eventId}
RETURN x order by id(x)`;
        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                let catalog = null;
                const events = result.records.map((record) => {
                    const event = EventRepository.deserializeEvent(record.get(0).properties, catalog);
                    catalog = event.catalog;

                    return event;
                });

                resolve(events);
            });
        });
    }

    static getEventsForCatalog(catalogId) {
        const command = `MATCH (root:Event { catalogId: "${catalogId}" })-[r:APPEND*0..]->(x:Event)
RETURN x,LAST(r)`;
        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const events = result.records.map((record) => {
                    const event = record.get(0).properties;

                    event.id = record.get(0).identity.low;
                    if (record.get(1) && record.get(1).properties.parentId) {
                        event.parentId = record.get(1).properties.parentId.low;
                    }

                    return event;
                });

                resolve(events);
            });
        });
    }

    static deserializeEvent(object, catalog) {
        switch (object.name) {
            case 'AddCatalogEvent':
                return new AddCatalogEvent(object.catalogId, object.catalogName);
            case 'AddCategoryEvent':
                return new AddCategoryEvent(catalog, object.categoryId, object.categoryName);
            case 'AddProductEvent':
                return new AddProductEvent(catalog, object.productId, object.productName, object.productPrice,
                    object.productVisible, object.productColor, object.productCategory);
            case 'SetProductAttributeEvent':
                return new SetProductAttributeEvent(catalog, object.productId, object.key, object.value);
            case 'RemoveProductEvent':
                return new RemoveProductEvent(catalog, object.productId);
            case 'RemoveCategoryEvent':
                return new RemoveCategoryEvent(catalog, object.categoryId);
            case 'AddBranchEvent':
                return new AddBranchEvent(catalog, object.branchName);
        }
    }

    static deleteEvent(eventId) {
        const command = `MATCH path=(e:Event)-[r:APPEND*0..]->(x:Event) where ID(e) = ${eventId} 
        With e, last(relationships(path)) as r 
        OPTIONAL MATCH (p:Event)-[rp:APPEND]->(e:Event) DELETE rp,r,e RETURN p`;

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const record = result.records[0];

                if (record && record.get(0)) {
                    const event = record.get(0).properties;

                    event.id = record.get(0).identity.low;
                    resolve(event);
                } else {
                    resolve(null);
                }
            });
        });
    }

    static getEventsforMerge(eventId, eventFromId) {
        const command = `MATCH (e1:Event)<-[:APPEND*0..]-(x:Event)-[:APPEND*0..]->(e2:Event)
        MATCH (x)-[:APPEND*0..]->(e:Event)-[:APPEND*0..]->(e2) where ID(e1) = ${eventId} 
        and ID(e2) =${eventFromId} and ID(e) <> ID(x)
        return e`;

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                const events = result.records.map((record) => record.get(0).properties);

                resolve(events);
            });
        });
    }
}

module.exports = EventRepository;
