const { DataTypes } = require('sequelize');
const sequelize = require('../schema');
const User = require('./User');
const SubscriptionPlan = require('./SubscriptionPlan');

const UserSubscription = sequelize.define('UserSubscription', {
    subscription_id: {
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
    plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SubscriptionPlan,
            key: 'plan_id',
        },
    },
    start_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    end_date: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'user_subscriptions',
    timestamps: false,
});

module.exports = UserSubscription;
