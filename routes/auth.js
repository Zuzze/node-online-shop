const express = require("express");
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

// server-side validation for sent email and password
// add validator middleware as second argument in router.post()
router.post(
  "/login",
  [
    // 1) check that email is valid
    // normalize email sanitizes for example uppercase to lowercase
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    // 2) check that password is valid
    // trim sanitizer removes whitespace
    body(
      "password",
      "Password has to be at least 4 characters and contain only characters and numbers."
    )
      .isLength({ min: 4 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin
);

router.post("/logout", authController.postLogout);

// add validator middleware as second argument in router.post()
router.post(
  "/signup",
  [
    // 1) check that email is valid
    // normalizeEmail() is validatejs sanitazer that removes whitespace, puts all to lowercase etc
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        // async db action
        console.log("looking for user email: " + value);
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error("This email already exists");
        }
      })
      .normalizeEmail(),

    // 2) check password format
    body(
      "password",
      "Please enter a password with only numbers and text and at least 4 characters."
    )
      .isLength({ min: 4 })
      .isAlphanumeric()
      .trim(),
    // 3) check that passwords match
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        // check that password and confirm passwords are equal
        // previous checks (length, alphanumeric...) are also still used
        if (value !== req.body.password) {
          throw new Error("Passwords have to match");
        }
        return true;
      })
  ],
  authController.postSignup
);

router.get("/reset", authController.getResetPassword);

router.post("/reset", authController.postResetPassword);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
