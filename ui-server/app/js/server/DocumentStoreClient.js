const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const dbName = 'spike';
const url = `mongodb://localhost:27017/${dbName}`;

const client = new MongoClient(url);

client.connect(function(err) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    client.close();
});

class DocumentStoreClient {
    static withCollection(collName, cb) {
        return new Promise((resolve, reject) => {
            client.connect(function(err) {
                assert.equal(null, err);
              
                const db = client.db(dbName);
                const collection = db.collection(collName);
                cb(collection, resolve)
            });
        })
    }

    static insert(collName, documents) {
        return DocumentStoreClient.withCollection(collName, (coll, resolve) => {
            coll.insertMany(documents, (err, result) => {
                assert.equal(err, null);
                assert.equal(documents.length, result.result.n);
                assert.equal(documents.length, result.ops.length);
                console.log(`Inserted ${documents.length} document(s) into the [${collName}] collection`);
                resolve(result);
              });
        });
    }

    static get(collName, query) {   
        return DocumentStoreClient.withCollection(collName, (coll, resolve) => {
            console.log(`Querying Collection ${collName} - ${JSON.stringify(query)}`);
            coll.find(query).toArray(function(err, docs) {
                resolve(docs || [])
            });
        })
      }
}
module.exports = DocumentStoreClient;
