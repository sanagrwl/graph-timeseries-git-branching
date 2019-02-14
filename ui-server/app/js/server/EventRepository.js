const Client = require('./DocumentStoreClient');
const eventCollection = "events";

class EventRepository {
    
    static addCategoryEvent(event) {
        const eventData = JSON.parse(JSON.stringify(event));
        return Client.insert(eventCollection, [eventData]);    
    }

    static processEvent(event) {
        switch (event.name) {
            case 'AddCategoryEvent':
                return EventRepository.addCategoryEvent(event);
            default:
                return new Promise((resolve, reject) => { resolve(event); });
        }
    }

    static getEvents(branch) {
        return Client.get(eventCollection, {branch: branch})
    }
}

module.exports = EventRepository;
