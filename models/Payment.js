const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    default: () => 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  },
  registration_id: {
    type: String,
    ref: 'EventRegistration'
  },
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
  full_name: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
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
}, {
  timestamps: true
});

// Add index for registration_id
PaymentSchema.index({ registration_id: 1 });

// Add method to find payment by registration ID
PaymentSchema.statics.findByRegistrationId = function(registrationId) {
  return this.findOne({ registration_id: registrationId });
};

// Add a pre-save hook to ensure payment_id is never null
PaymentSchema.pre('save', function(next) {
  if (!this.payment_id) {
    this.payment_id = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});
module.exports = mongoose.model('Payment', PaymentSchema);
