const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
  registration_id: {
    type: String,
    required: true,
    unique: true,
    default: () => 'REG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  },
  event_id: {
    type: Number,
    required: true
  },
  event_name: {
    type: String,
    required: true
  },
  event_date: {
    type: String,
    required: true
  },
  event_venue: {
    type: String,
    required: true
  },
  event_time: {
    type: String,
    required: true
  },
  first_name: {
    type: String,
    required: true
  },
  middle_name: String,
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  contact: {
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
  zipcode: {
    type: String,
    required: true
  },
  registration_date: {
    type: Date,
    default: Date.now
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'free', 'failed'],
    default: 'pending'
  },
  payment_amount: {
    type: Number,
    default: 0
  },
  payment_id: {
    type: String,
    ref: 'Payment'
  }
}, {
  timestamps: true
});

// Add index for better query performance
EventRegistrationSchema.index({ registration_id: 1 }, { unique: true });
EventRegistrationSchema.index({ email: 1 });

// Pre-save middleware to ensure registration_id is set
EventRegistrationSchema.pre('save', function(next) {
  if (!this.registration_id) {
    this.registration_id = 'REG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

// Add method to find registration by payment ID
EventRegistrationSchema.statics.findByPaymentId = function(paymentId) {
  return this.findOne({ payment_id: paymentId });
};

// Add method to update payment status
EventRegistrationSchema.methods.updatePaymentStatus = async function(status, paymentId) {
  this.payment_status = status;
  if (paymentId) {
    this.payment_id = paymentId;
  }
  return this.save();
};

// Add logging for debugging
EventRegistrationSchema.post('save', function(doc) {
  console.log('Registration saved:', {
    registration_id: doc.registration_id,
    event_name: doc.event_name,
    payment_status: doc.payment_status,
    payment_id: doc.payment_id
  });
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema); 
