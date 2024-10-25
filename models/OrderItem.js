const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const Order = require('./Order');

const OrderItem = sequelize.define('OrderItem', {
    order_item_id: {
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
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
}, {
    tableName: 'order_items',
    timestamps: false,
});

module.exports = OrderItem;
