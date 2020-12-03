const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// _id will be added automatically, not here
const productsSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    require: true
  },
  imageUrl: {
    type: String,
    require: true
  }
});
module.exports = mongoose.model("Product", productsSchema);
