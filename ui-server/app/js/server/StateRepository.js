const Client = require('./DocumentStoreClient');

const categoryCollection = "categories"

class StateRepository {
    static addCategory(event) {
        const eventData = JSON.parse(JSON.stringify(event));
        delete eventData.name
        return Client.insert(categoryCollection, [eventData]);
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
