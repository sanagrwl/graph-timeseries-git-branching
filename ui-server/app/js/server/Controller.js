const EventRepository = require('./EventRepository');
const GraphRepository = require('./GraphRepository');
const StateRepository = require('./StateRepository');

const AddCategoryEvent = require('../events/AddCategoryEvent');
const RemoveCategoryEvent = require('../events/RemoveCategoryEvent');
const RemoveProductEvent = require('../events/RemoveProductEvent');

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
        const e = new RemoveProductEvent(branch, productId)
        GraphRepository.deleteProduct(e)
        .then((_) => EventRepository.addEvent(e))
        .then(() => {
            callback()
        })
    }

    static createCategory(branch, categoryId, name, callback) {
        const e = new AddCategoryEvent(branch, categoryId, name);
        GraphRepository.createCategory(e)
        .then((_) => StateRepository.processEvent(e))
        .then((_) => EventRepository.addEvent(e))
        .then(() => {
            callback({})
        })
    }

    static deleteCategory(branch, categoryId, callback) {
        const e = new RemoveCategoryEvent(branch, categoryId);
        GraphRepository.deleteCategory(e)
        .then((_) => EventRepository.addEvent(e))
        .then(() => {
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

    static getEvents(branch, callback) {
        const eventsPromise = EventRepository.getEvents(branch);
        
        const masterEventsPromise = GraphRepository.getDataBranch(branch)
            .then((b) => {
                if (b.name === branch) {
                    return new Promise((res, rej) => res([]));
                } else {
                    return EventRepository.getEventsBefore('master', b.from);
                }            
            });

        Promise.all([eventsPromise, masterEventsPromise]).then(function(values) {
            callback({
                branch: values[0] || [],
                master: values[1]
            })
        });
    }

    static applyLiveChanges(branch, callback) {
        return GraphRepository.createStagingBranch(`staging-${branch}`, branch)
        .then(callback);
    }

    //event {_id: "5c66d9e79dd0f7cba165d2ba", 
        // name: "RemoveCategoryEvent", 
        // created_at: 1550244327265, 
        // branch: "master", 
        // categoryId: "2"}
    static applyEvent(branch, event, callback) {
        console.log("applyingEvent", branch, JSON.stringify(event));

        Controller.validateBranchData(branch, event);

        const branchTreePromise = GraphRepository.getCategoryTree(event.branch, event.categoryId);
        const masterTreePromise = GraphRepository.getCategoryTree("master", event.categoryId);

        Promise.all([branchTreePromise, masterTreePromise]).then(function(values) {
            if (Controller.array_diff(values[0], values[1]).length > 0) {
                callback ({
                    message: `Master Ids: ${values[1]}, Branch Ids: ${values[0]}`,
                    error: {
                        master: values[1],
                        branch: values[0]
                    }
                })
            } else {
                callback({
                    message: "no structural difference"
                })
            }
        });
    }

    static validateBranchData(branch, event) {
        if (branch !== event.branch && branch === 'master') {
            throw Error (`
            Branch is not a draft one. 
            Supplied branches: [${branch}], event branch: [${event.branch}]
            `);
        }
    }

    static array_diff (a1, a2) {

        var a = [], diff = [];
    
        for (var i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }
    
        for (var i = 0; i < a2.length; i++) {
            if (a[a2[i]]) {
                delete a[a2[i]];
            } else {
                a[a2[i]] = true;
            }
        }
    
        for (var k in a) {
            diff.push(k);
        }
    
        return diff;
    }


}


module.exports = Controller;
