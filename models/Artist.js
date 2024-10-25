const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
    artist_id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
    },
}, {
    timestamps: false
});

module.exports = mongoose.model('Artist', ArtistSchema);
