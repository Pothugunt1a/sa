const mongoose = require('mongoose');
//ART RElation 
const ItemSchema = new mongoose.Schema({
  item_id: {
    type: Number,
    required: true,
    unique: true
  },
  category_id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  description: String,
  image_url: String
});

module.exports = mongoose.model('Item', ItemSchema);