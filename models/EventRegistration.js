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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema); 