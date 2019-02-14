class RemoveCategoryEvent {
    constructor(categoryId) {
        this.categoryId = categoryId;
        this.name = 'RemoveCategoryEvent';

        this.created_at = new Date().getTime();    
    }

    process() {
        
    }
}

module.exports = RemoveCategoryEvent;
