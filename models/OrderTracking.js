const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const Order = require('./Order');

const OrderTracking = sequelize.define('OrderTracking', {
    tracking_id: {
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
    tracking_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    carrier: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'order_trackings',
    timestamps: false,
});

module.exports = OrderTracking;
