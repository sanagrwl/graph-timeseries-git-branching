const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const dbName = 'spike';
const url = `mongodb://localhost:27017`;

const client = new MongoClient(url);

client.connect(function(err) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
});

class DocumentStoreClient {
    static withCollection(collName, cb) {
        client.connect(function(err) {
            assert.equal(null, err);
          
            const db = client.db(dbName);
            const collection = db.collection(collName);
    
            try{
                return cb(collection);
            } catch (err) {
                console.log(err);
                client.close();
            }
        });
    }

    static insert(collName, documents) {
        return DocumentStoreClient.withCollection(collName, (coll) => {
            return coll.insertMany(documents, (err, result) => {
                assert.equal(err, null);
                assert.equal(documents.length, result.result.n);
                assert.equal(documents.length, result.ops.length);
                console.log(`Inserted ${documents.length} document(s) into the collection`);
                return result;
              });
        });
    }
}
module.exports = DocumentStoreClient;
