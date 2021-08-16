var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = Schema({
  number: Number,
  date: Date,
  address: String,
  cardOwner: String,
  cardNumber: Number,
  subtotal: Number,
  total: Number,
  tax: Number,
  items: {
    type: [
      {
        title: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product' }
      }]
  }
});

module.exports = mongoose.model('Order', schema);

