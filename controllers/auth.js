const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

exports.getLogin = (req, res, next) => {
  // req.flash(key) pulls flash messages from flash package so that <% errorMessage %> can be used in the view directly
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message
  });
};

/** Tries to log in user */
exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // find user by email
  try {
    const user = await User.findOne({ email: email });

    // Email not found from database
    if (!user) {
      // in app.js flash package has been provided
      // req.flash(key, message)
      req.flash("error", "Invalid email.");
      return res.redirect("/login");
    }

    // PASSWORD ENCRYPTION
    // compare hashed password by ussing bcryptjs' compare()
    try {
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (isPasswordCorrect) {
        // Successful login
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save(err => {
          console.log(err);
          res.redirect("/");
        });
      }
      // Incorrect email
      req.flash("error", "Invalid password.");
      res.redirect("/login");
    } catch (err) {
      console.log(err);
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
  }
};

/** Create new user */
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash("error", "Email exists already.");
        return res.redirect("/signup");
      }
      // PASSWORD ENCRYPTION
      // remember to encyprt ie.hash passwords so that they are not exposed to employees or third parties
      // second argument = how many rounds of hashing is used, currently used value 12
      // passwords cannot be decrypted
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          // it is recommended too execute redirect before as email is asynchronus and cna be blocking all future actions
          res.redirect("/login");
          return transporter.sendMail({
            to: email,
            from: "zuzzetech@gmail.com",
            subject: "Welcome",
            html: "<h1>Thank you for joining <3 </h1>"
          });
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};
