import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserSubscriptionDayEntity } from './user-subscription-day.entity.js';

export class UserSubscriptionTrainingItemEntity extends Model {
    declare id: string;
    declare dayId: string;
    declare order: number;
    declare title: string;
    declare videoUrl: string | null;
    declare description: string | null;
    declare durationMinutes: number | null;
    declare repeatCount: number | null;
    declare isSuperset: boolean;
    declare supersetKey: string | null;
    declare restSeconds: number | null;
    declare metadata: Record<string, unknown> | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionTrainingItemEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        dayId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        videoUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        durationMinutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        repeatCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        isSuperset: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        supersetKey: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        restSeconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionTrainingItem',
        tableName: 'user_subscription_training_items',
        timestamps: true,
        indexes: [
            {
                fields: ['dayId'],
            },
            {
                fields: ['supersetKey'],
            },
        ],
    }
);

UserSubscriptionTrainingItemEntity.belongsTo(UserSubscriptionDayEntity, { foreignKey: 'dayId', as: 'day' });
UserSubscriptionDayEntity.hasMany(UserSubscriptionTrainingItemEntity, { foreignKey: 'dayId', as: 'trainingItems', onDelete: 'CASCADE', hooks: true });
