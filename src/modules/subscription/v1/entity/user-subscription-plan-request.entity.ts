import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { PlanRequestStatus, PlanRequestStatusValue } from '../subscription.enums.js';

export class UserSubscriptionPlanRequestEntity extends Model {
    declare id: string;
    declare userId: string;
    declare status: PlanRequestStatusValue;
    declare requestedAt: Date;
    declare handledAt: Date | null;
    declare handledById: string | null;
    declare notes: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionPlanRequestEntity.init(
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
        status: {
            type: DataTypes.ENUM(...Object.values(PlanRequestStatus)),
            allowNull: false,
            defaultValue: PlanRequestStatus.PENDING,
        },
        requestedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        handledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        handledById: {
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
        modelName: 'UserSubscriptionPlanRequest',
        tableName: 'user_subscription_plan_requests',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

UserSubscriptionPlanRequestEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserEntity.hasMany(UserSubscriptionPlanRequestEntity, { foreignKey: 'userId', as: 'subscriptionPlanRequests', onDelete: 'CASCADE', hooks: true });
