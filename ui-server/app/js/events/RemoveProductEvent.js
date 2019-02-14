class RemoveProductEvent {
    constructor(branch, productId) {
        this.name = 'RemoveProductEvent';
        this.created_at = new Date().getTime();

        this.branch = branch;
        this.productId = productId;
    }

    process() {

    }
}

module.exports = RemoveProductEvent;
