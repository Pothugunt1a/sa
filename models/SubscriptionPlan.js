const { DataTypes } = require('sequelize');
const sequelize = require('../schema');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    plan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    plan_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    features: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'subscription_plans',
    timestamps: false,
});

module.exports = SubscriptionPlan;
