const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const RoleSchema = new mongoose.Schema({
   // role_id: {
        //type: Number,
        //required: true,
        //unique: true,
        //autoIncrement: true // Ensure this is handled correctly in your application logic
    //},
    role_name: {
        type: String,
        required: true,
    }
}, {
    timestamps: false
});

RoleSchema.plugin(AutoIncrement, { inc_field: 'role_id' });

module.exports = mongoose.model('Role', RoleSchema);
