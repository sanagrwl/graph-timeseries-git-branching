const Category = require('../models/Category');

class AddBranchEvent {
    constructor(branchName) {    
        this.name = 'AddBranchEvent';
        this.created_at = new Date().getTime();
        this.branchName = branchName;
    }

    process() {

    }
}

module.exports = AddBranchEvent;
