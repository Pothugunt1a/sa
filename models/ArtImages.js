const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const Art = require('./Art');

const ArtImages = sequelize.define('ArtImages', {
    image_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    art_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Art,
            key: 'art_id',
        },
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'art_images',
    timestamps: false,
});

module.exports = ArtImages;
