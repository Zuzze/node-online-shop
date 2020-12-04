// this file contains NodeSQL config code for Mongoose version of MongoDB
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const errorController = require("./controllers/error");
const User = require("./models/user");

const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const MONGODB_URI = `mongodb+srv://zuzze:${process.env.MONGODB_PASSWORD}@cluster0.atyng.mongodb.net/shop?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
});

const dotenv = require("dotenv");
dotenv.config();
app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

/*app.use((req, res, next) => {
  User.findById("5fca14de5ff78764184ebc36")
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});*/

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    // create new user when connection created if there are no users
    // findOne() returns first user in the array on default
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: "Zuzze",
          email: "test@test.com",
          cart: {
            items: []
          }
        });
        user.save();
      }
      app.listen(3000);
    });
  })
  .catch(err => console.log(err));
