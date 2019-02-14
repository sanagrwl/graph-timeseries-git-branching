const Client = require('./DocumentStoreClient');

const categoryCollection = "categories"

class StateRepository {
    static addCategory(event) {
        return new Promise((resolve, reject) => {
            const eventData = JSON.parse(JSON.stringify(event));
            const result = Client.insert(categoryCollection, [eventData]);
            console.log(result);
            resolve(event);
        });
    }
    static processEvent(event) {
        switch (event.name) {
            case 'AddCategoryEvent':
                return StateRepository.addCategory(event);
            default:
                return new Promise((resolve, reject) => { resolve(event); });
        }
    }
}

module.exports = StateRepository;
