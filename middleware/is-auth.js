// Typical middleware to protect routes
// You can use this middleware in /routes by chaining the middleware to arguments
// e.g. `router.post('/add-product', isAuth, adminController.postAddProduct);`
// if user is logged in, continue to next request, otherwise stay on loogin page
module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
};
