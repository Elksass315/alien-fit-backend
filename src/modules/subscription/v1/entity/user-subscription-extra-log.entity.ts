import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { UserSubscriptionEntity } from './user-subscription.entity.js';
import { UserSubscriptionCycleEntity } from './user-subscription-cycle.entity.js';
import { UserSubscriptionDayEntity } from './user-subscription-day.entity.js';
import { ExtraLogType, ExtraLogTypeValue } from '../subscription.enums.js';

export class UserSubscriptionExtraLogEntity extends Model {
    declare id: string;
    declare userId: string;
    declare subscriptionId: string;
    declare cycleId: string | null;
    declare dayId: string | null;
    declare type: ExtraLogTypeValue;
    declare payload: Record<string, unknown> | null;
    declare loggedAt: Date;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionExtraLogEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        subscriptionId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        cycleId: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
        },
        dayId: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(ExtraLogType)),
            allowNull: false,
        },
        payload: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
        loggedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionExtraLog',
        tableName: 'user_subscription_extra_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
            },
            {
                fields: ['subscriptionId'],
            },
            {
                fields: ['cycleId'],
            },
            {
                fields: ['type'],
            },
        ],
    }
);

UserSubscriptionExtraLogEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserSubscriptionExtraLogEntity.belongsTo(UserSubscriptionEntity, { foreignKey: 'subscriptionId', as: 'subscription' });
UserSubscriptionExtraLogEntity.belongsTo(UserSubscriptionCycleEntity, { foreignKey: 'cycleId', as: 'cycle' });
UserSubscriptionExtraLogEntity.belongsTo(UserSubscriptionDayEntity, { foreignKey: 'dayId', as: 'day' });

UserEntity.hasMany(UserSubscriptionExtraLogEntity, { foreignKey: 'userId', as: 'subscriptionExtraLogs', onDelete: 'CASCADE', hooks: true });
UserSubscriptionEntity.hasMany(UserSubscriptionExtraLogEntity, { foreignKey: 'subscriptionId', as: 'extraLogs', onDelete: 'CASCADE', hooks: true });
UserSubscriptionCycleEntity.hasMany(UserSubscriptionExtraLogEntity, { foreignKey: 'cycleId', as: 'extraLogs', onDelete: 'SET NULL', hooks: true });
UserSubscriptionDayEntity.hasMany(UserSubscriptionExtraLogEntity, { foreignKey: 'dayId', as: 'extraLogs', onDelete: 'SET NULL', hooks: true });
