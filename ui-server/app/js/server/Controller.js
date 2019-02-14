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
        GraphRepository.getDataBranch(branch)
        .then((b) => {
            if (b.name === branch) {
                return EventRepository.getEvents(branch).then(callback);
            } else {
                return EventRepository.getEventsBefore('master', b.from).then(callback);
            }            
        })
        
    }

    static applyLiveChanges(branch, callback) {
        return GraphRepository.createStagingBranch(`staging-${branch}`, branch)

        .then(callback);
    }
}


module.exports = Controller;
