const mongoose = require('mongoose');

const UserRoleSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true,
        ref: 'User'
    },
    role_id: {
        type: Number,
        required: true,
        ref: 'Role'
    }
}, {
    timestamps: false
});

// Create a compound index for user_id and role_id
UserRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

module.exports = mongoose.model('UserRole', UserRoleSchema);
