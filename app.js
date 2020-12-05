// this file contains NodeSQL config code for Mongoose version of MongoDB

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const errorController = require("./controllers/error");
const User = require("./models/user");
const flash = require("connect-flash");

// db config
const mongoose = require("mongoose");

// Session config via mongodb
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

// CSRF protection
const csrf = require("csurf");

// .env config
const dotenv = require("dotenv");
dotenv.config();

// App config starts
const MONGODB_URI = `mongodb+srv://zuzze:${process.env.MONGODB_PASSWORD}@cluster0.atyng.mongodb.net/shop?retryWrites=true&w=majority`;
const app = express();

// this helps to keep track of active sessions on server-side
// this could be stored in any DB, we will use Mongo, as it is already configured
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
});

const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Using Session cookies
// this will add connect.sid cookie by express-session that stays alive between requests but not between different users until browser is closed
app.use(
  session({
    secret: "my secret",
    // saves only if sth is changed
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

// detect if user is logged in
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

// Access local variables on each view that is rendered
// CSRF token will change on each render
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.error(err);
  });
