class RemoveCategoryEvent {
    constructor(branch, categoryId) {
        this.name = 'RemoveCategoryEvent';
        this.created_at = new Date().getTime();

        this.branch = branch;
        this.categoryId = categoryId;    
    }

    process() {
        
    }
}

module.exports = RemoveCategoryEvent;
