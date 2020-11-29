# Node.js Online Store

This repository includes an online store template built with node.js to understand better how logic of frontend frameworks work under the hood and how to use node.js as backend with SQL ans NoSQL databases. The project uses pure node.js with ejs templating engine. Note that in production, it could be more meaningful to use actual frontend framework (e.g. React, Angular, Vue).

## Dynamic routing

- HTML `form` _action_ to pass (optionally hidden) input data and move from a page to another

```
<form action="/cart" method="post">
    <button class="btn" type="submit">Add to Cart</button>
    <input type="hidden" name="productId" value="<%= product.id %>">
</form>
```

- Dynamic routing with dynamic paths using `/:id`

```
router.get('/edit-product/:productId', adminController.getEditProduct);
```

- Using dynamic ids and query params in urls:

```
<a href="/admin/edit-product/<%= product.id %>?edit=true">Click</a>
```

## Storing data

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

### 3. NoSQL Database

- `Collections` (table replacements) have no relations, instead parts of data that is needed is duplicated
- Structure does not have to be same for all unlike SQL (**_schemaless_**)
- As there is no need to fetch multiple relational, can be faster than SQL
- Horizontal scaling possible, easier to scale than SQL
- Great performance for mass read/write requests

## Admin Features

- Add product
- Edit product
- Delete product

## Client Features

- View products and product details
- Add product to cart
- Remove product from cart
