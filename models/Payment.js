const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const PaymentSchema = new mongoose.Schema({
    //payment_id: {
        //type: Number,
        //required: true,
        //unique: true,
        //autoIncrement: true // Ensure this is handled correctly in your application logic
    //},
    order_id: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    payment_method: {
        type: String,
        required: true,
    },
    payment_status: {
        type: String,
        required: true,
    },
    transaction_id: {
        type: String,
    },
    payment_date: {
        type: Date,
        default: Date.now,
    },
    email: {
        type: String,
        required: true,
    },
    full_name: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    is_donation: {
        type: Boolean,
        default: false,
    },
    event_name: String,
    event_date: String,
    event_venue: String,
    event_time: String,
    stripe_payment_intent_id: {
        type: String,
        required: true,
    },
});

PaymentSchema.plugin(AutoIncrement, { inc_field: 'payment_id' });

module.exports = mongoose.model('Payment', PaymentSchema);
