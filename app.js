// this file contains NodeSQL config code for Mongoose version of MongoDB
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const errorController = require("./controllers/error");
const mongoose = require("mongoose");
const User = require("./models/user");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findById("5fc4f851cd590617d8083baf")
    .then(user => {
      console.log("USER", user);
      req.user = new User(user.name, user.email, user.cart, user._id);
      next();
    })
    .catch(err => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);
mongoose
  .connect(
    `mongodb+srv://zuzze:${process.env.MONGODB_PASSWORD}@cluster0.atyng.mongodb.net/shop?retryWrites=true&w=majority`
  )
  .then(app.listen(3000))
  .catch(err => console.log(err));
