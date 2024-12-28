const { MongoClient } = require('mongodb');
const fs = require('fs');
const readline = require('readline');

const uri = 'mongodb://localhost:27017';
const dbName = 'imageDB';
const collectionName = 'shops';

async function streamImport() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const fileStream = fs.createReadStream('motabhai.json');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const doc = JSON.parse(line);
      await collection.insertOne(doc);
    }

    console.log('Data import completed.');
  } catch (error) {
    console.error('Error during streaming:', error);
  } finally {
    await client.close();
  }
}

streamImport();
