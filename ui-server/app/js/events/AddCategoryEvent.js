const Category = require('../models/Category');

class AddCategoryEvent {
    constructor(branch, categoryId, categoryName) {
        this.name = 'AddCategoryEvent';
        this.categoryId = categoryId;
        this.branch = branch;
        this.properties = {
            categoryName: categoryName
        }
    }

    process() {
        // this.catalog.addCategory(new Category(this.categoryId, this.categoryName));
    }
}

module.exports = AddCategoryEvent;
