import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserSubscriptionEntity } from './user-subscription.entity.js';
import { SubscriptionCycleStatus, SubscriptionCycleStatusValue } from '../subscription.enums.js';

export class UserSubscriptionCycleEntity extends Model {
    declare id: string;
    declare subscriptionId: string;
    declare cycleNumber: number;
    declare status: SubscriptionCycleStatusValue;
    declare startsAt: Date;
    declare endsAt: Date;
    declare profileUpdatedAt: Date | null;
    declare profileUpdateDueAt: Date | null;
    declare renewedById: string | null;
    declare notes: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionCycleEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        subscriptionId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        cycleNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(SubscriptionCycleStatus)),
            allowNull: false,
            defaultValue: SubscriptionCycleStatus.ACTIVE,
        },
        startsAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endsAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        profileUpdatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        profileUpdateDueAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        renewedById: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionCycle',
        tableName: 'user_subscription_cycles',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['subscriptionId', 'cycleNumber'],
            },
            {
                fields: ['subscriptionId', 'status'],
            },
        ],
    }
);

UserSubscriptionCycleEntity.belongsTo(UserSubscriptionEntity, { foreignKey: 'subscriptionId', as: 'subscription' });
UserSubscriptionEntity.hasMany(UserSubscriptionCycleEntity, { foreignKey: 'subscriptionId', as: 'cycles', onDelete: 'CASCADE', hooks: true });
