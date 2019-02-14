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
        .then((_) => StateRepository.processEvent(e))
        .then((_) => EventRepository.processEvent(e))
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

    static getEvents(branch, callback) {
        return EventRepository.getEvents(branch).then(callback);
    }
}


module.exports = Controller;
