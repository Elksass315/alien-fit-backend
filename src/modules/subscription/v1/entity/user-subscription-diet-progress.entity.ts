import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { UserSubscriptionCycleEntity } from './user-subscription-cycle.entity.js';
import { UserSubscriptionDayEntity } from './user-subscription-day.entity.js';
import { UserSubscriptionDietItemEntity } from './user-subscription-diet-item.entity.js';

export class UserSubscriptionDietProgressEntity extends Model {
    declare id: string;
    declare userId: string;
    declare cycleId: string;
    declare dayId: string;
    declare dietItemId: string;
    declare completedAt: Date;
    declare notes: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionDietProgressEntity.init(
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
        cycleId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        dayId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        dietItemId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionDietProgress',
        tableName: 'user_subscription_diet_progress',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'dietItemId'],
            },
            {
                fields: ['cycleId'],
            },
            {
                fields: ['dayId'],
            },
        ],
    }
);

UserSubscriptionDietProgressEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserSubscriptionDietProgressEntity.belongsTo(UserSubscriptionCycleEntity, { foreignKey: 'cycleId', as: 'cycle' });
UserSubscriptionDietProgressEntity.belongsTo(UserSubscriptionDayEntity, { foreignKey: 'dayId', as: 'day' });
UserSubscriptionDietProgressEntity.belongsTo(UserSubscriptionDietItemEntity, { foreignKey: 'dietItemId', as: 'dietItem' });

UserEntity.hasMany(UserSubscriptionDietProgressEntity, { foreignKey: 'userId', as: 'dietProgress', onDelete: 'CASCADE', hooks: true });
UserSubscriptionCycleEntity.hasMany(UserSubscriptionDietProgressEntity, { foreignKey: 'cycleId', as: 'dietProgressEntries', onDelete: 'CASCADE', hooks: true });
UserSubscriptionDayEntity.hasMany(UserSubscriptionDietProgressEntity, { foreignKey: 'dayId', as: 'dietProgressEntries', onDelete: 'CASCADE', hooks: true });
UserSubscriptionDietItemEntity.hasMany(UserSubscriptionDietProgressEntity, { foreignKey: 'dietItemId', as: 'progressEntries', onDelete: 'CASCADE', hooks: true });
