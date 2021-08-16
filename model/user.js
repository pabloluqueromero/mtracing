var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  address: { type: String, required: true },
  birthDate: { type: Date, required: true },    
  shoppingCart: { type: Schema.Types.ObjectId, ref: 'ShoppingCart' },
  orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],

});

module.exports = mongoose.model('User', schema);

