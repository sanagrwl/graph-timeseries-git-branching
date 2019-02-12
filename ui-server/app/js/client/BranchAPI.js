const Branch = require('../models/Branch');

class BranchAPI {
    static getBranches() {
        return new Promise((resolve, reject) => {
            fetch(url + '/branches').then(function (response) {
                return response.json();
            }).then(function (object) {
                const branches = object.map((o) => new Branch(o.name));
                resolve(branches);
            });
        });
    }

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
