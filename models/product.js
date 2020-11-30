const Cart = require("./cart");

// local
const fs = require("fs");
const path = require("path");

// MySQL
const mySqlDb = require("../util/database");

// Helpers for saving to local JSON File
/* const p = path.join(
  path.dirname(process.mainModule.filename),
  "data",
  "products.json"
);

const getProductsFromFile = cb => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};*/

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

  // ===== Functions for saving in local JSON file ====
  /* save() {
    getProductsFromFile(products => {
      if (this.id) {
        const existingProductIndex = products.findIndex(
          prod => prod.id === this.id
        );
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex] = this;
        fs.writeFile(p, JSON.stringify(updatedProducts), err => {
          console.log(err);
        });
      } else {
        this.id = Math.random().toString();
        products.push(this);
        fs.writeFile(p, JSON.stringify(products), err => {
          console.log(err);
        });
      }
    });
  }

  static deleteById(id) {
    getProductsFromFile(products => {
      const product = products.find(prod => prod.id === id);
      const updatedProducts = products.filter(prod => prod.id !== id);
      fs.writeFile(p, JSON.stringify(updatedProducts), err => {
        if (!err) {
          Cart.deleteProduct(id, product.price);
        }
      });
    });
  }

  static fetchAll(cb) {
    getProductsFromFile(cb);
  }

  static findById(id, cb) {
    getProductsFromFile(products => {
      const product = products.find(p => p.id === id);
      cb(product);
    });
  }*/
};
