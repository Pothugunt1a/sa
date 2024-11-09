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
    enum: ['pending', 'completed', 'failed', 'refunded']
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
    default: false
  },
  event_name: String,
  event_date: String,
  event_venue: String,
  event_time: String,
  stripe_data: {
    client_secret: String,
    receipt_email: String,
    receipt_url: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  _id: true
});

PaymentSchema.index({ stripe_payment_intent_id: 1 }, { unique: true });

PaymentSchema.pre('save', function(next) {
  if (this.payment_id) {
    delete this.payment_id;
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
