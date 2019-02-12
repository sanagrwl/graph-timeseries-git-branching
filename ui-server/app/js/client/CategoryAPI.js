const Catalog = require('../models/Catalog');
const Product = require('../models/Product');
const Category = require('../models/Category');
const selectedBranchName = require('../selectedBranch');

class CategoryAPI {
    static getCategories() {
        const myHeaders = new Headers();
        myHeaders.append("X-Branch", selectedBranchName());

        return new Promise((resolve, reject) => {
            fetch(url + '/categories', {headers: myHeaders}).then(function (response) {
                return response.json();
            }).then(function (object) {
                const categories = object.map((o) => new Category(o.id, o.name));
                resolve(categories);
            });
        });
    }

    static getSubCategories(categoryId) {
        return new Promise((resolve, reject) => {
            fetch(url + '/categories/' + categoryId).then(function (response) {
                return response.json();
            }).then(function (object) {
                const categories = object.map((o) => new Category(o.id, o.name));
                resolve(categories);
            });
        });
    }

    static createCategory(categoryId, name) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        return new Promise((resolve, reject) => {
            const payload = {
                method: 'post',
                headers: myHeaders,
                body: JSON.stringify({id: categoryId, name: name})
            };

            fetch(url + '/categories', payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                resolve();
            });
        });
    }

}

module.exports = CategoryAPI;
