// Pure MySQL approach without Sequelize
const Cart = require("./cart");
const mySqlDb = require("../util/database");

module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    // --- MySQL ---
    // To avoid SQL injection, check that data is safe by using '?' syntax that injects data only if the query is safe
    mySqlDb.execute(
      "INSERT INTO products (title, price, imageURL, description) VALUES (?,?,?,?)"
    ),
      [this.title, this.price, this.imageUrl, this.description];
  }

  static deleteById(id) {}

  static fetchAll() {
    mySqlDb
      .execute("SELECT * FROM products WHERE products.id = ?", [id])
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findById(id, cb) {
    mySqlDb
      .execute("SELECT * FROM products")
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
      });
  }
};
