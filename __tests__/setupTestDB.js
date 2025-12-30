const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

module.exports.connect = async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongo.getUri();
  process.env.SESSION_SECRET = 'testsecret';
  process.env.MAPBOX_TOKEN = 'testtoken';
  await mongoose.connect(process.env.MONGO_URL);
};

module.exports.close = async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
};