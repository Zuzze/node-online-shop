# :green_heart: Node.js Online Store

This repository includes a full-stack online store template built with node.js to understand better how logic of frontend frameworks work under the hood and how to use node.js as backend with local, SQL and NoSQL databases. The project uses pure node.js with **ejs** templating engine. This approach was the popular way to build websites before REST APIs decoupled frontend and backend into separate independent entities and frontend frameworks like Vue/Angular/React took over. The main idea is to use **MVC** approach:

- _controllers_ represent the logic of node app in js; they connect views and models, include database actions, and render views
- _views_ are what user sees, written in HTML and templating engine language (ejs, handlebars, pug etc)
- _models_ data representation (classes/schemas)

## Storing data

This repository shows 3 different ways to build backend with node.js

1. using local `json` file via file system `fs`
2. using SQL database (`MySQL` & `Sequelize`)
3. using noSQL database (`MongoDB` & `Mongoose`)

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

**See full documentation in Wiki pages of this repository**
