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
    }

    static applyLiveChanges() {
        return new Promise((resolve, reject) => {
            const payload = {
                method: 'put',
                headers: defaultHeaders()
            };

            fetch(url + '/applyLiveChanges', payload).then(function (response) {
                return response.json();
            }).then(function () {
                resolve({});
            });
        });
    }

    static applyEvent(event) {
        // {_id: "5c66d9e79dd0f7cba165d2ba", 
        // name: "RemoveCategoryEvent", 
        // created_at: 1550244327265, 
        // branch: "master", 
        // categoryId: "2"}
        return new Promise((resolve, reject) => {
            const payload = {
                method: 'put',
                headers: defaultHeaders(),
                body: JSON.stringify({event: event})
            };

            fetch(url + '/events/apply', payload).then(function (response) {
                return response.json();
            }).then(function (body) {
                resolve(body);
            });
        });
    }
}

module.exports = BranchAPI;
