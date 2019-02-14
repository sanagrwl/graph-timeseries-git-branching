const Category = require('../models/Category');

class AddCategoryEvent {
    constructor(branch, categoryId, categoryName) {
        this.name = 'AddCategoryEvent';
        this.created_at = new Date().getTime();

        this.categoryId = categoryId;
        this.branch = branch;
        this.categoryName = categoryName;
    }

    process() {
        
    }
}

module.exports = AddCategoryEvent;
