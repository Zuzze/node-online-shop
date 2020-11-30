const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const mongoConnect = callback => {
  MongoClient.connect(
    "mongodb+srv://zuzze:node@cluster0.atyng.mongodb.net/<dbname>?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  )
    .then(res => {
      console.log("connected!");
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports = mongoConnect;

/*const MongoClient = require("mongodb").MongoClient;
const uri =
  "mongodb+srv://zuzze:<password>@cluster0.atyng.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});*/
