const Branch = require('../models/Branch');
const defaultHeaders = require('../defaultHeaders');

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

    static getEvents() {
        return new Promise((resolve, reject) => {
            fetch(url + '/events', {headers: defaultHeaders()}).then(function (response) {
                return response.json();
            }).then(function (events) {
                // const events = object.map((o) => new Branch(o.name));
                resolve(events);
            });
        });
    };
}

module.exports = BranchAPI;
