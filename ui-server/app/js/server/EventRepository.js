const Client = require('./DocumentStoreClient');
const eventCollection = "events";

class EventRepository {
    
    static addEvent(event) {
        const eventData = JSON.parse(JSON.stringify(event));
        return Client.insert(eventCollection, [eventData]);    
    }

    static getEvents(branch) {
        return Client.get(eventCollection, {branch: branch})
    }

    static getEventsBefore(branch, beforeTime) {
        return Client.get(eventCollection, {branch: branch, created_at: {$lt: beforeTime}})
    }
}

module.exports = EventRepository;
