const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const Store = require('./Store');

const StoreInventory = sequelize.define('StoreInventory', {
    store_inventory_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    store_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Store,
            key: 'store_id',
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
    stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'store_inventories',
    timestamps: false,
});

module.exports = StoreInventory;
