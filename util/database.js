const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = callback => {
  MongoClient.connect(
    `mongodb+srv://zuzze:${process.env.MONGODB_PASSWORD}@cluster0.atyng.mongodb.net/shop?retryWrites=true&w=majority`,
    { useUnifiedTopology: true }
  )
    .then(client => {
      console.log("connected!");
      _db = client.db();
      callback();
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};

// as database is needed in multiple files, it is a a good idea to export it just once here
const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found!";
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

/*const MongoClient = require("mongodb").MongoClient;
const uri =
  "mongodb+srv://zuzze:<password>@cluster0.atyng.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});*/
