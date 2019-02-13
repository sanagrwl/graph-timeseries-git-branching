const Catalog = require('../models/Catalog');
const Product = require('../models/Product');
const Category = require('../models/Category');
const selectedBranchName = require('../selectedBranch');

class CategoryAPI {
    static defaultHeaders() {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        const branchName = selectedBranchName();
        if (!!branchName) {
            headers.append("X-Branch", selectedBranchName());
        }

        return headers;

    }
    static getCategories() {

        return new Promise((resolve, reject) => {
            fetch(url + '/categories', {headers: CategoryAPI.defaultHeaders()}).then(function (response) {
                return response.json();
            }).then(function (object) {
                const categories = object.map((o) => new Category(o.id, o.name));
                resolve(categories);
            });
        });
    }

    static getSubCategories(categoryId) {
        return new Promise((resolve, reject) => {
            const payload = {
                headers: CategoryAPI.defaultHeaders(),
            };

            fetch(url + '/categories/' + categoryId, payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                const categories = object.map((o) => new Category(o.id, o.name));
                resolve(categories);
            });
        });
    }

    static getProducts(categoryId) {
        return new Promise((resolve, reject) => {
            const payload = {
                headers: CategoryAPI.defaultHeaders(),
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
                headers: CategoryAPI.defaultHeaders(),
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
                headers: CategoryAPI.defaultHeaders()
            };

            console.log(payload);

            fetch(url + '/products/' + productId, payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                resolve();
            });
        });
    }

}

module.exports = CategoryAPI;
