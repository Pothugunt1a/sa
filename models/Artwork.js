const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ArtworkSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    price: {
        type: Number,
        required: true,
    },
    imageUrl: String,
    status: {
        type: String,
        enum: ['active', 'sold', 'archived'],
        default: 'active'
    },
    artist_id: {
        type: Number,
        required: true,
        ref: 'Artist'
    }
}, {
    timestamps: true
});

ArtworkSchema.plugin(AutoIncrement, { inc_field: 'id' });

module.exports = mongoose.model('Artwork', ArtworkSchema); 
