# :green_heart: Node.js Online Store

This repository includes a full-stack online store template built with node.js to understand better how logic of frontend frameworks work under the hood and how to use node.js as backend with local, SQL and NoSQL databases. The project uses pure node.js with **ejs** templating engine. This approach was the popular way to build websites before REST APIs decoupled frontend and backend into separate independent entities and frontend frameworks like Vue/Angular/React took over. The main idea is to use **MVC** approach:

- _controllers_ represent the logic of node app in js; they connect views and models, include database actions, and render views
- _views_ are what user sees, written in HTML and templating engine language (ejs, handlebars, pug etc)
- _models_ data representation (classes/schemas)

## Dynamic routing

- HTML `form` _action_ to pass (optionally hidden) input data and move from a page to another

```
<form action="/cart" method="post">
    <button class="btn" type="submit">Add to Cart</button>
    <input type="hidden" name="productId" value="<%= product.id %>">
</form>
```

- Dynamic paths `/:id`

```
router.get('/edit-product/:productId', adminController.getEditProduct);
```

- URL Query params `?edit=true`:

```
<a href="/admin/edit-product/<%= product.id %>?edit=true">Click</a>
```

## Storing data

This repository shows 3 different ways to build backend with node.js

1. using local `json` file via file system `fs`
2. using SQL database (`MySQL` & `Sequelize`)
3. using noSQL database (`MongoDB` & `Mongoose`)

### 1. File System

Storing data locally in JSON files (slower and less scalable than using databases)

```
const fs = require('fs');

fs.readFile(path, (err, fileContent) => {
    JSON.parse(fileContent)
}

fs.writeFile(path, JSON.stringify(cart), err => {
    console.log(err);
});
```

### 2. SQL (Structured Query Language) Database

- Data `tables` that have **_relations_** ( => relational database):
  a) one-to-one relation
  b) one-to-many relation
  c) many-to-many relation
- Structure has to fit (uses **_schemas_**), each row has all fields (columns) defined in table
- Horizontal scaling (buying more servers) can be difficult
- Limitations for read/write queries per second
- Used via SQL queries, e.g.

```
SELECT * FROM USERS WHERE age > 30
```

#### Option 1: write queries as Strings with MySQL

`utils/database.js`

```
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  // these you will set in MySQL workbench
  database: "node-complete",
  password: "test"
});

module.exports = pool.promise();
```

Avoid SQL injection by using '?' in `models/product.js`

```
const mySqlDb = require("../util/database");

 mySqlDb.execute(
      "INSERT INTO products (title, price, imageURL, description) VALUES (?,?,?,?)"
    ),
      [this.title, this.price, this.imageUrl, this.description];
```

#### Option 2: Use Sequelize (3rd party package)

Sequelize is an object-relational mapping library that simplifies working with SQL queries in JavaScript generating the queries on your behalf. Instead of strings queries, it uses objects to define what to do.

```
const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Product = sequelize.define('product', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  title: Sequelize.STRING,
  price: {
    type: Sequelize.DOUBLE,
    allowNull: false
  },
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  }
});
```

You will access data with specified `Product.findAll()` and `Product.findByPk()` methods

You can define relations (associations) with Sequelize like this:

```
sequelize.sync();
product.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });
```

User middleware defined in `app.js` gives access to User model anywhere in the app via `req.user` (e.g. `req.user.getCart().then(...).catch(...)`)

### 3. NoSQL Database

- `Collections` (table replacements) have no relations, instead parts of data that is needed is duplicated
- Structure does not have to be same for all unlike SQL (**_schemaless_**)
- As there is no need to fetch multiple relational, can be faster than SQL
- Horizontal scaling possible, easier to scale than SQL
- Great performance for mass read/write requests
- one of the most common NoSQL databases is `MongoDB` that uses fast BSON data format on the background (converted from js obj automatically)

#### Option 1: Use pure mongoDB

app.js

```
const mongoConnect = require("./util/database");
...
mongoConnect(() => {
  app.listen(3000);
});

```

utils/database.js

```
    "mongodb+srv://zuzze:<password>@cluster0.atyng.mongodb.net/<dbname>?retryWrites=true&w=majority",
    { useUnifiedTopology: true }
  )
    .then(res => {
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
```

##### MongoDB operations

- Create one: `db.collection("products").insertOne({...})`
- Create many: `db.collection("products").insertMany([...])`
- Read one: `db.collection("products").find({_id: new mongodb.ObjectId(prodId) }).next()` or `db.collection("users").findOne({ _id: new ObjectId(userId) })`
- Read all: `db.collection("products").find().toArray()`
- Update one: `db.collection("products").updateOne({ _id: this._id }, { $set: this });`
- Delete one: `db.collection("products").deleteOne({ _id: new mongodb.ObjectId(prodId)})`

#### Use MongoDB with Mongoose

Mongoose is Object-Document Mapping (ODM) library for MongoDB, similar what Sequelize is for MySQL. It simplifies the mongoDB syntax.

```
npm install --save mongoose
```

##### Connection to Database with mongoose

no need for database.js anymore, just add this into `app.js`

```
const mongoose = require('mongoose')
```

##### Mongoose operations

- Create:

```
const product = new Product({
    title,
    price,
    description,
    imageUrl
  });

  product.save()
```

- Read one: `Product.findById(id)`
- Read all: `Product.find()`
- Delete one: `Product.findByIdAndRemove(prodId)`
- Fill in all user object data based on id (mixing collections): `Product.find().populate('userId')`
- Select only certain fields (title, price) / exclude certain fields (\_id) `Product.find().select('title price -_id')`
- Relations in mongoose: `req.user.populate("cart.items.productId").execPopulate()`

## :cookie: Cookies

Cookies are tool to save data on client-side (in browser)

- Pro: Cookies can be used to share data globally without exposing global data to users.
- Con: You can manipulate cookies inside browser so sensitive data should not be stored in cookies but works for analytics tracking etc

```
res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age: 1000')

req.get('Cookie')
```

### Sessions

Sessions are tool to save data on server-side. Use sessions for sharing data across requests scoping data for a specific user without exposing data for other users

```
npm install --save express-session
npm install --save connect-mongodb-session
```

## App Features

### Admin Features

- Add product
- Edit product
- Delete product

### Client Features

- View products and product details
- Add product to cart
- Remove product from cart
- Make order
- View orders
