const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ArtistSchema = new mongoose.Schema({
    artist_id: {
        type: Number,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, {
    timestamps: true
});

// Hash password before saving
ArtistSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

// Generate JWT token
ArtistSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this.artist_id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Compare password
ArtistSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Artist', ArtistSchema);
