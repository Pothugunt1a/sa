const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    artist_id: {
        type: Number,
        ref: 'Artist',
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'past'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

EventSchema.plugin(AutoIncrement, { inc_field: 'event_id' });

module.exports = mongoose.model('Event', EventSchema); 
