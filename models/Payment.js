const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  stripe_payment_intent_id: {
    type: String,
    required: true,
    unique: true
  },
  order_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed']
  },
  email: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  address1: {
    type: String,
    required: true
  },
  address2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  transaction_id: String,
  payment_date: {
    type: Date,
    default: Date.now
  },
  is_donation: {
    type: Boolean,
    default: false
  },
  event_name: String,
  event_date: String,
  event_venue: String,
  event_time: String
});

module.exports = mongoose.model('Payment', PaymentSchema);
