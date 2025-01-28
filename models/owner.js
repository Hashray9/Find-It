const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name:{type: String, required: true},
  email: { type: String, required: true,unique: true },
  password:{type: String, required: true},
  shopId:{type: String, required:true}
});

const Owner = mongoose.model('Owner', ownerSchema);
module.exports = Owner;
