class RemoveProductEvent {
    constructor(productId) {
        this.name = 'RemoveProductEvent';
        this.created_at = new Date().getTime();

        this.productId = productId;
    }

    process() {

    }
}

module.exports = RemoveProductEvent;
