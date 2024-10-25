const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    //await mongoose.connect(process.env.MONGODB_URI, {
    //  useNewUrlParser: true,
    //  useUnifiedTopology: true,
    //});
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB Atlas connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
