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
  },
  userId: {
    type: Schema.Types.ObjectId,
    // Relations in mongoose: refer to User model by using same string as in models/user.js
    ref: "User"
  }
});
module.exports = mongoose.model("Product", productsSchema);
