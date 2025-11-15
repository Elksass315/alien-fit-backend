import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { UserSubscriptionCycleEntity } from './user-subscription-cycle.entity.js';
import { UserSubscriptionDayEntity } from './user-subscription-day.entity.js';

export class UserSubscriptionDayProgressEntity extends Model {
    declare id: string;
    declare userId: string;
    declare cycleId: string;
    declare dayId: string;
    declare trainingCompleted: boolean;
    declare dietCompleted: boolean;
    declare completedAt: Date | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionDayProgressEntity.init(
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
        trainingCompleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        dietCompleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionDayProgress',
        tableName: 'user_subscription_day_progress',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'dayId'],
            },
            {
                fields: ['cycleId'],
            },
        ],
    }
);

UserSubscriptionDayProgressEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserSubscriptionDayProgressEntity.belongsTo(UserSubscriptionCycleEntity, { foreignKey: 'cycleId', as: 'cycle' });
UserSubscriptionDayProgressEntity.belongsTo(UserSubscriptionDayEntity, { foreignKey: 'dayId', as: 'day' });

UserEntity.hasMany(UserSubscriptionDayProgressEntity, { foreignKey: 'userId', as: 'subscriptionDayProgress', onDelete: 'CASCADE', hooks: true });
UserSubscriptionCycleEntity.hasMany(UserSubscriptionDayProgressEntity, { foreignKey: 'cycleId', as: 'dayProgressEntries', onDelete: 'CASCADE', hooks: true });
UserSubscriptionDayEntity.hasMany(UserSubscriptionDayProgressEntity, { foreignKey: 'dayId', as: 'progressEntries', onDelete: 'CASCADE', hooks: true });
