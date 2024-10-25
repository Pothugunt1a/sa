const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const User = require('./User');

const Order = sequelize.define('Order', {
    order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id',
        },
    },
    total_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    shipping_address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    billing_address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    shipping_method: {
        type: DataTypes.STRING,
    },
    payment_method: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'orders',
    timestamps: false,
});

module.exports = Order;
