const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  shopId: { type: String, required: true, ref: "Shop" }, // Reference to Shop _id
  base64: String,
  rgb: String,
  category: String,
  size: String,
  price: String
});

const Image= mongoose.model("Image",imageSchema)

module.exports=Image