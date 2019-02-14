const Catalog = require('../models/Catalog');
const Product = require('../models/Product');
const Category = require('../models/Category');
const defaultHeaders = require('../defaultHeaders');

class CategoryAPI {
    static getCategories() {

        return new Promise((resolve, reject) => {
            fetch(url + '/categories', {headers: defaultHeaders()}).then(function (response) {
                return response.json();
            }).then(function (object) {
                const categories = object.map((o) => new Category(o.parentId, o.id, o.name));
                resolve(categories);
            });
        });
    }

    static getSubCategories(categoryId) {
        return new Promise((resolve, reject) => {
            const payload = {
                headers: defaultHeaders(),
            };

            fetch(url + '/categories/' + categoryId, payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                const categories = object.map((o) => new Category(o.parentId, o.id, o.name));
                resolve(categories);
            });
        });
    }

    static getProducts(categoryId) {
        return new Promise((resolve, reject) => {
            const payload = {
                headers: defaultHeaders(),
            };

            fetch(url + '/categories/' + categoryId + "/products", payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                const products = object.map((o) => new Product(o.id, o.name));
                resolve(products);
            });
        });
    }


    static createCategory(categoryId, name) {
        return new Promise((resolve, reject) => {
            const payload = {
                method: 'post',
                headers: defaultHeaders(),
                body: JSON.stringify({id: categoryId, name: name})
            };

            fetch(url + '/categories', payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                resolve();
            });
        });
    }

    static deleteProduct(productId) {
        return new Promise((resolve, reject) => {
            const payload = {
                method: 'delete',
                headers: defaultHeaders()
            };

            fetch(url + '/products/' + productId, payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                resolve();
            });
        });
    }

    static deleteCategory(categoryId) {
        return new Promise((resolve, reject) => {
            const payload = {
                method: 'delete',
                headers: defaultHeaders()
            };

            fetch(url + '/categories/' + categoryId, payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                resolve();
            });
        });
    }

}

module.exports = CategoryAPI;
