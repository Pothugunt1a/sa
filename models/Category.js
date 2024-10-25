const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  category_id: {
    type: Number,
    required: true,
    unique: true
  },
  catalog_id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Category', CategorySchema);