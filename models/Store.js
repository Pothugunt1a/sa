const { DataTypes } = require('sequelize');
const sequelize = require('../schema');

const Store = sequelize.define('Store', {
    store_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    store_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'stores',
    timestamps: false,
});

module.exports = Store;
