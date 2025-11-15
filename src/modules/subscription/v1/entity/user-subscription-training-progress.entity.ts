import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { UserSubscriptionCycleEntity } from './user-subscription-cycle.entity.js';
import { UserSubscriptionDayEntity } from './user-subscription-day.entity.js';
import { UserSubscriptionTrainingItemEntity } from './user-subscription-training-item.entity.js';

export class UserSubscriptionTrainingProgressEntity extends Model {
    declare id: string;
    declare userId: string;
    declare cycleId: string;
    declare dayId: string;
    declare trainingItemId: string;
    declare completedAt: Date;
    declare notes: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionTrainingProgressEntity.init(
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
        trainingItemId: {
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
        modelName: 'UserSubscriptionTrainingProgress',
        tableName: 'user_subscription_training_progress',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'trainingItemId'],
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

UserSubscriptionTrainingProgressEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserSubscriptionTrainingProgressEntity.belongsTo(UserSubscriptionCycleEntity, { foreignKey: 'cycleId', as: 'cycle' });
UserSubscriptionTrainingProgressEntity.belongsTo(UserSubscriptionDayEntity, { foreignKey: 'dayId', as: 'day' });
UserSubscriptionTrainingProgressEntity.belongsTo(UserSubscriptionTrainingItemEntity, { foreignKey: 'trainingItemId', as: 'trainingItem' });

UserEntity.hasMany(UserSubscriptionTrainingProgressEntity, { foreignKey: 'userId', as: 'trainingProgress', onDelete: 'CASCADE', hooks: true });
UserSubscriptionCycleEntity.hasMany(UserSubscriptionTrainingProgressEntity, { foreignKey: 'cycleId', as: 'trainingProgressEntries', onDelete: 'CASCADE', hooks: true });
UserSubscriptionDayEntity.hasMany(UserSubscriptionTrainingProgressEntity, { foreignKey: 'dayId', as: 'trainingProgressEntries', onDelete: 'CASCADE', hooks: true });
UserSubscriptionTrainingItemEntity.hasMany(UserSubscriptionTrainingProgressEntity, { foreignKey: 'trainingItemId', as: 'progressEntries', onDelete: 'CASCADE', hooks: true });
