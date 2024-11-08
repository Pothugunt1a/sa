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
  currency: {
    type: String,
    default: 'usd'
  },
  payment_method: {
    type: String,
    required: true
  },
  payment_method_types: [{
    type: String
  }],
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'canceled', 'refunded']
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
  // Additional Stripe-specific fields
  stripe_data: {
    client_secret: String,
    description: String,
    receipt_email: String,
    receipt_url: String,
    refunded: {
      type: Boolean,
      default: false
    },
    refund_status: String,
    refund_reason: String,
    last_payment_error: String,
    payment_method_details: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
