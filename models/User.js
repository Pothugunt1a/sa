const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const UserSchema = new mongoose.Schema({
    //user_id: {
        //type: Number,
        //required: true,
        //unique: true,
        //autoIncrement: true // Ensure this is handled correctly in your application logic
    //},
    Username: {
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
    registration_date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
    verification_token: {
        type: String,
    },
});

UserSchema.plugin(AutoIncrement, { inc_field: 'user_id' });

module.exports = mongoose.model('User', UserSchema);
