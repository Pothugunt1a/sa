const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const Artist = require('./Artist');

const Catalog = sequelize.define('Catalog', {
    catalog_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    artist_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Artist,
            key: 'artist_id',
        },
    },
    description: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'catalogs',
    timestamps: false,
});

module.exports = Catalog;
