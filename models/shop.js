const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  visits: { type: Number, default: 1 },
  visitsHistory: [{
    date: { type: Date, required: true },
    visits: { type: Number, required: true }
  }]
});


const Shop = mongoose.model('Shop', shopSchema);
module.exports = Shop;
