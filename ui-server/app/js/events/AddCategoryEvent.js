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
        // this.catalog.addCategory(new Category(this.categoryId, this.categoryName));
    }
}

module.exports = AddCategoryEvent;
