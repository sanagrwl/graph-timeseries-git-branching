const Catalog = require('../models/Catalog');
const Product = require('../models/Product');
const Category = require('../models/Category');

class BranchAPI {
    static createBranch(name) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        return new Promise((resolve, reject) => {
            const payload = {
                method: 'post',
                headers: myHeaders,
                body: JSON.stringify({name: name})
            };

            fetch(url + '/branches', payload).then(function (response) {
                return response.json();
            }).then(function (object) {
                resolve(null);
            });
        });
    }
}

module.exports = BranchAPI;
