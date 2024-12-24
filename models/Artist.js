const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ArtistSchema = new mongoose.Schema({
    artist_id: {
        type: Number,
        unique: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required']
    },
    city: {
        type: String,
        required: [true, 'City is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    country: {
        type: String,
        required: [true, 'Country is required']
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    bio: String,
    profileImage: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String
}, {
    timestamps: true
});

// Add auto-increment plugin for artist_id
ArtistSchema.plugin(AutoIncrement, { inc_field: 'artist_id' });

// Hash password before saving
ArtistSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Generate JWT token
ArtistSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Compare password
ArtistSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
ArtistSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    return resetToken;
};

module.exports = mongoose.model('Artist', ArtistSchema);
