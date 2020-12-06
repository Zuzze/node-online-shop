const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 3;

async function renderPaginatedProducts(
  req,
  res,
  next,
  viewPath,
  urlPath,
  pageTitle
) {
  // if url query param is not returning number, go to page 1
  // unary plus operator (+) attempts to convert it into a number, if it isn't already.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unary_plus
  const page = +req.query.page || 1;

  try {
    const totalNumberOfProducts = await Product.find().countDocuments();
    // mongoose skip(n) skips first n items
    // mongoose limit(n) returns max n items
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render(viewPath, {
      prods: products,
      pageTitle: pageTitle,
      path: urlPath,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalNumberOfProducts,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalNumberOfProducts / ITEMS_PER_PAGE)
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

exports.getIndex = async (req, res, next) => {
  return renderPaginatedProducts(req, res, next, "shop/index", "Shop", "/");
};

exports.getProducts = async (req, res, next) => {
  return renderPaginatedProducts(
    req,
    res,
    next,
    "shop/product-list",
    "All Products",
    "/products"
  );
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  // findById() from mongoose
  try {
    const product = await Product.findById(prodId);

    res.render("shop/product-detail", {
      product: product,
      pageTitle: product.title,
      path: "/products"
    });
  } catch {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

/** returns cart with product details */
exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.items.productId").execPopulate();
    const products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "Your Cart",
      products: products
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCart = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    const product = await Product.findById(prodId);
    const result = await req.user.addToCart(product);
    console.log(result);
    res.redirect("/cart");
  } catch {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCartDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  try {
    await req.user.removeFromCart(prodId);
    res.redirect("/cart");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.items.productId").execPopulate();

    // in mongoose obj has metadata _doc and with spread operator you can pull out all data in product using it
    const products = user.cart.items.map(i => {
      return { quantity: i.quantity, product: { ...i.productId._doc } };
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products: products
    });
    await order.save();
    await req.user.clearCart();
    res.redirect("/orders");
  } catch {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ "user.userId": req.user._id });
    res.render("shop/orders", {
      path: "/orders",
      pageTitle: "Your Orders",
      orders: orders
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

/** Generated PDF invoice and saves it into /data/invoices */
function saveInvoicePDF(order, orderId, res) {
  const invoiceName = "invoice-" + orderId + ".pdf";
  const invoicePath = path.join("data", "invoices", invoiceName);

  // create new PDF
  const pdfDoc = new PDFDocument();
  // this will open the file in browser
  res.setHeader("Content-Type", "application/pdf");
  // set file name that user sees
  res.setHeader(
    "Content-Disposition",
    'inline; filename="' + invoiceName + '"'
  );
  // use more efficient stream instead of writeFile()
  // create PDF to given path
  pdfDoc.pipe(fs.createWriteStream(invoicePath));
  pdfDoc.pipe(res);

  // PDF Content
  pdfDoc.fontSize(26).text("Invoice");
  pdfDoc.text("-----------------------");
  let totalPrice = 0;
  order.products.forEach(prod => {
    totalPrice += prod.quantity * prod.product.price;
    pdfDoc
      .fontSize(14)
      .text(`${prod.product.title} - ${prod.quantity} x $${prod.product.price}`)
      .moveDown();
    /*pdfDoc
      .image(prod.product.imageUrl, {
        fit: [100, 100],
        align: "center",
        valign: "center"
      })
      .moveDown();*/
  });

  pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

  // Finish PDF
  pdfDoc.end();
}

exports.getInvoice = async (req, res, next) => {
  const orderId = req.params.orderId;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new Error("No order found."));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error("Unauthorized"));
    }

    // generate invoice and save it to /data/invoices
    saveInvoicePDF(order, orderId, res);

    // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader(
    //     'Content-Disposition',
    //     'inline; filename="' + invoiceName + '"'
    //   );
    //   res.send(data);
    // });
    // const file = fs.createReadStream(invoicePath);

    // file.pipe(res);
  } catch (err) {
    next(err);
  }
};

exports.getCheckout = async (req, res, next) => {
  console.log("getting checkout page...");
  let products;
  let total = 0;
  // populate full product data, not just prodId
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      console.log("creating stripe session...");
      // MUST user Math.round() or otherwise the payment view won't appear
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map(p => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: Math.round(p.productId.price * 100),
            currency: "usd",
            quantity: p.quantity
          };
        }),
        // protocol = http/https
        // host = localhost:3000 or actual url
        // note: in real apps, you should use webhooks so users cannot fake orders by entering success url directly
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel"
      });
    })
    .then(session => {
      console.log("stripe session successfully created", session);
      // session is session from Stripe
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
