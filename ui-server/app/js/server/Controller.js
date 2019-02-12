const EventRepository = require('./EventRepository');

class Controller {
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

    static getCategories(branch, callback) {
        EventRepository.getCategories(branch).then((categories) => {
            callback(categories)
        })
    }

    static getSubCategories(branch, categoryId, callback) {
        EventRepository.getSubCategories(branch, categoryId).then((categories) => {
            callback(categories)
        })
    }

    static createCategory(branch, categoryId, name, callback) {
        EventRepository.createCategory(branch, categoryId, name).then(() => {
            callback({})
        })
    }

    static getBranches(callback) {
        EventRepository.getBranches().then((result) => {
            callback(result)
        })
    }

    static createBranch(branchName, callback) {
        EventRepository.createBranch(branchName).then((result) => {
            callback({})
        })
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
