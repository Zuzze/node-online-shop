const bcrypt = require("bcryptjs");
// node js includes crypto library
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");
const User = require("../models/user");

// email
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
    errorMessage: message,
    oldInput: {
      email: "",
      password: ""
    },
    validationErrors: []
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
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};

/** Tries to log in user */
exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  // check errors checked by express-validator in /routes/auth
  if (!errors.isEmpty()) {
    console.log("LOGIN ERRORS", errors.array());
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  // find user by email
  try {
    const user = await User.findOne({ email: email });

    // Email not found from database
    if (!user) {
      // in app.js flash package has been provided
      // req.flash(key, message)
      // req.flash("error", "No user found with this email.");
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "No user found with this email.",
        oldInput: {
          email: email,
          password: password
        },
        // simulate validator format by adding "param"
        validationErrors: [{ param: "email" }]
      });
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
      // Incorrect password
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "This password is invalid.",
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: [{ param: "password" }]
      });
    } catch (err) {
      console.log(err);
      res.redirect("/login");
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

function sendWelcomeEmail(email) {
  transporter.sendMail({
    to: email,
    from: "zuzzetech@gmail.com",
    subject: "Welcome",
    html: "<h1>Thank you for joining <3 </h1>"
  });
}

async function createNewUser(email, password, res, next) {
  try {
    // remember to encyprt ie.hash passwords so that they are not exposed to employees or third parties
    // second argument = how many rounds of hashing is used, currently used value 12
    // passwords cannot be decrypted
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      cart: { items: [] }
    });
    const result = await user.save();
    // it is recommended too execute redirect before as
    // email is asynchronus and cna be blocking all future actions
    res.redirect("/login");
    sendWelcomeEmail(email);
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

/** Create new user */
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // check validation
  const errors = validationResult(req);
  // validate errors checked via express-validator and sent  as part of request in /routes/auth.js
  if (!errors.isEmpty()) {
    console.log("SIGNUP ERRORS", errors.array());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  createNewUser(email, password, res, next);
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getResetPassword = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset-password", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message
  });
};

exports.postResetPassword = (req, res, next) => {
  // generate random token by using nodejs's own crypto mdule
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");

    // find user from database and save temporary token there
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash("error", "No account with given email found.");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        // 1h = 36000000 ms
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect("/");
        transporter.sendMail({
          to: req.body.email,
          from: "zuzzetech@gmail.com",
          subject: "Password reset",
          html: `
              <p>Reset your password</p>
              <p>Reset your password by clicking <a href="${process.env.BASE_URL}/reset/${token}">this link</a>.</p>
            `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

/** renders page where user can set new password */
exports.getNewPassword = (req, res, next) => {
  // get token from /reset/:token dynamic url path
  const token = req.params.token;
  // mongoose has special operation called gt = greater than
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = async (req, res, next) => {
  // this information comes from view's <form>
  // userId and token are hidden fields not visible for the user
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId
    });
    resetUser = user;
    // remember to hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;

    const result = await resetUser.save();
    res.redirect("/login");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
