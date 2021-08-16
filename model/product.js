var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = Schema({
  title: {type: String, required: true },
  image: {type:  String, required: true },
  description: {type:  String, required: true },
  price: {type:  Number, required: true },
  colours: {type:  [String],required:false}
});

module.exports = mongoose.model('Product', schema);

