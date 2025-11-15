import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserSubscriptionCycleEntity } from './user-subscription-cycle.entity.js';

export class UserSubscriptionDayEntity extends Model {
    declare id: string;
    declare cycleId: string;
    declare weekIndex: number;
    declare dayIndex: number;
    declare plannedDate: Date | null;
    declare isRestDay: boolean;
    declare notes: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionDayEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        cycleId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        weekIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dayIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        plannedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        isRestDay: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionDay',
        tableName: 'user_subscription_days',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['cycleId', 'weekIndex', 'dayIndex'],
            },
            {
                fields: ['cycleId'],
            },
        ],
    }
);

UserSubscriptionDayEntity.belongsTo(UserSubscriptionCycleEntity, { foreignKey: 'cycleId', as: 'cycle' });
UserSubscriptionCycleEntity.hasMany(UserSubscriptionDayEntity, { foreignKey: 'cycleId', as: 'days', onDelete: 'CASCADE', hooks: true });
