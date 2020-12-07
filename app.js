// this file contains NodeSQL config code for Mongoose version of MongoDB

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const errorController = require("./controllers/error");
const User = require("./models/user");
const flash = require("connect-flash");
const multer = require("multer");

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

// --- CREATE SERVER ---
const app = express(); // create express server

// --- SETUP SESSION LOGIC ---
// this helps to keep track of active sessions on server-side
// this could be stored in any DB, we will use Mongo, as it is already used elsewhere in app (via mongoose)
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
});

// --- CSRF ---
const csrfProtection = csrf();

// --- FILE HANDLING ---
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  }
});
// define accepted image types
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    console.log("IMAGE TYPE: accepted");
    cb(null, true);
  } else {
    console.log("IMAGE TYPE: not valid");
    cb(null, false);
  }
};

// --- CONFIG STRUCTURE ---
// templating engine, views folder source
app.set("view engine", "ejs");
app.set("views", "views");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false })); // handle API respnse body parsing
// "image" is the name of input field in view
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
// this will add connect.sid cookie by express-session that stays alive between requests
// but not between different users until browser is closed
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

// --- SETUP GLOBAL ACCESS TO VARIABLES ---
// Access local variables on each view that is rendered
// CSRF token will change on each render
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAdmin =
    req.session.isLoggedIn && req.session.user.isAdmin ? true : false;
  res.locals.email = req.session.isLoggedIn
    ? req.session.user.email.toString()
    : "";
  // console.log("GLOBAL VAR:", res.locals);
  next();
});

// --- INITIAL AUTHENTICATION ---
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

// --- ROUTES ---
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500", errorController.get500);
app.use(errorController.get404);

// --- CENTRAL ERROR HANDLING MIDDLEWARE ---
// error handling middleware from express takes 4 arguments
// it is triggered on next(error) inside async requests
app.use((error, req, res, next) => {
  console.error("Error catched by global middleware:");
  // console.log(req.session);
  console.log(error);
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session ? req.session.isLoggedIn : false
  });
});

// --- CONNECTION TO DB ---
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.error(err);
  });
