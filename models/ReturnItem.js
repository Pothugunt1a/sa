const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const Order = require('./Order');

const ReturnItem = sequelize.define('ReturnItem', {
    return_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'order_id',
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
    reason: {
        type: DataTypes.TEXT,
    },
    return_status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    initiated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'returns',
    timestamps: false,
});

module.exports = ReturnItem;
