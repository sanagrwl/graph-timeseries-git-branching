const EventRepository = require('./EventRepository');
const GraphRepository = require('./GraphRepository');
const StateRepository = require('./StateRepository');

const AddCategoryEvent = require('../events/AddCategoryEvent');

class Controller {
    static getCategories(branch, callback) {
        GraphRepository.getCategories(branch).then((categories) => {
            callback(categories)
        })
    }

    static getSubCategories(branch, categoryId, callback) {
        GraphRepository.getSubCategories(branch, categoryId).then((categories) => {
            callback(categories)
        })
    }

    static getProducts(branch, categoryId, callback) {
        GraphRepository.getProducts(branch, categoryId).then((products) => {
            callback(products)
        })
    }

    static deleteProduct(branch, productId, callback) {
        GraphRepository.deleteProduct(branch, productId).then(() => {
            callback()
        })
    }

    static createCategory(branch, categoryId, name, callback) {
        const e = new AddCategoryEvent(branch, categoryId, name);
        GraphRepository.createCategory(e)
        .then(StateRepository.processEvent)
        .then(() => {
            callback({})
        })
    }

    static deleteCategory(branch, categoryId, callback) {
        GraphRepository.deleteCategory(branch, categoryId).then(() => {
            callback({})
        })
    }

    static getBranches(callback) {
        GraphRepository.getBranches().then((result) => {
            callback(result)
        })
    }

    static createBranch(branchName, callback) {
        GraphRepository.createBranch(branchName).then((result) => {
            callback({})
        })
    }


    static insertEvents(eventObjects, parentId, callback) {
        if (eventObjects.length > 0) {
            const event = EventRepository.deserializeEvent(eventObjects.shift());
            EventRepository.addEvent(event, parentId).then((eventId) => {
                Controller.insertEvents(eventObjects, eventId, callback)
            }).catch((e) => callback(e));
        } else {
            Controller.getCatalog(parentId).then((catalog) => {
                callback(catalog);
            })
        }
    }

    

    static getCatalog(eventId) {
        return EventRepository.getCatalog(eventId);
    }

    static getEvents(catalogId) {
        return EventRepository.getEventsForCatalog(catalogId);
    }

    static deleteEvent(eventId) {
        return new Promise((resolve, reject) => {
            EventRepository.deleteEvent(eventId).then((event) => {
                if (event) {
                    Controller.getCatalog(event.id).then((catalog) => {
                        resolve(catalog);
                    }).catch((e)=> reject(e));
                } else {
                    resolve({});
                }
            });
        });
    }

    static mergeEvents(eventId, eventFromId, callback) {
        return new Promise((resolve, reject) => {
            EventRepository.getEventsforMerge(eventId, eventFromId).then((events) => {
                Controller.insertEvents(events, eventId, resolve);
            });
        });
    }
}


module.exports = Controller;
