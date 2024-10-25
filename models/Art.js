const mongoose = require('mongoose');

const ArtSchema = new mongoose.Schema({
    art_id: {
        type: Number,
        required: true,
        unique: true
    },
    artist_id: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    upload_date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
    },
    categoryid: {
        type: Number,
    },
    catalog_id: {
        type: Number,
    },
}, {
    timestamps: false
});

module.exports = mongoose.model('Art', ArtSchema);
