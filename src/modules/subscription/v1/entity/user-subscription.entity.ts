import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { SubscriptionStatus, SubscriptionStatusValue } from '../subscription.enums.js';

export class UserSubscriptionEntity extends Model {
    declare id: string;
    declare userId: string;
    declare status: SubscriptionStatusValue;
    declare cycleLengthWeeks: number;
    declare currentCycleNumber: number;
    declare currentCycleStartsAt: Date | null;
    declare currentCycleEndsAt: Date | null;
    declare nextRenewalAt: Date | null;
    declare lastRenewedAt: Date | null;
    declare activatedById: string | null;
    declare renewedById: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
            allowNull: false,
            defaultValue: SubscriptionStatus.PENDING,
        },
        cycleLengthWeeks: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 4,
        },
        currentCycleNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        currentCycleStartsAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        currentCycleEndsAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        nextRenewalAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        lastRenewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        activatedById: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
        },
        renewedById: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscription',
        tableName: 'user_subscriptions',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

UserSubscriptionEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserEntity.hasOne(UserSubscriptionEntity, { foreignKey: 'userId', as: 'subscription', onDelete: 'CASCADE', hooks: true });
