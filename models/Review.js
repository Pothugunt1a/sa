const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const User = require('./User');

const Review = sequelize.define('Review', {
    review_id: {
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
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    review_text: {
        type: DataTypes.TEXT,
    },
    review_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'reviews',
    timestamps: false,
});

module.exports = Review;
