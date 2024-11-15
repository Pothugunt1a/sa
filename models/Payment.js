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
    required: true,
    default: 'card'
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
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
  payment_date: Date,
  is_donation: {
    type: Boolean,
    default: true
  },
  event_name: String,
  event_date: String,
  event_venue: String,
  event_time: String
}, {
  timestamps: true // This will add created_at and updated_at fields
});

// Add a virtual getter for _id to ensure it's always available
PaymentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON output
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', PaymentSchema);
