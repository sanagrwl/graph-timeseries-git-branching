const Category = require('../models/Category');

class AddBranchEvent {
    constructor(branchName) {    
        this.name = 'AddBranchEvent';
        this.properties = {
            branchName: branchName
        }
    }

    process() {

    }
}

module.exports = AddBranchEvent;
