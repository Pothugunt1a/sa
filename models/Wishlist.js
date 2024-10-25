const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const User = require('./User');

const Wishlist = sequelize.define('Wishlist', {
    wishlist_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id',
        },
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // Assuming 'item_id' references an 'Art' or similar table
        references: {
            model: 'arts',
            key: 'art_id',
        },
    },
    added_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'wishlists',
    timestamps: false,
});

module.exports = Wishlist;
