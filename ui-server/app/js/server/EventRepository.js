const AddCatalogEvent = require('../events/AddCatalogEvent');
const AddCategoryEvent = require('../events/AddCategoryEvent');
const AddProductEvent = require('../events/AddProductEvent');
const RemoveCategoryEvent = require('../events/RemoveCategoryEvent');
const RemoveProductEvent = require('../events/RemoveProductEvent');
const SetProductAttributeEvent = require('../events/SetProductAttributeEvent');
const AddBranchEvent = require('../events/AddBranchEvent');
const Category = require('../models/Category');

const neo4j = require('neo4j-driver').v1;

const uri = 'bolt://localhost';

const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', '1234'));
const session = driver.session();

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

    static getCategories(branch) {
        const command = `match (a:category)-[:has_state {branch: '${branch}'}]->(s:state) 
        where not (a)<-[:contains]-(:category) 
        return a.id as category_id , s as state`;

        return new Promise((resolve, reject) => {
            session.run(command).then(result => {
                let catalog = null;
                const events = result.records.map((record) => {
                    const category_id = record.get(0)
                    const name = record.get(1).properties.name
                    return new Category(category_id, name)
                });

                resolve(events);
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
