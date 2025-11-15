import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserSubscriptionDayEntity } from './user-subscription-day.entity.js';
import { MealType, MealTypeValue } from '../subscription.enums.js';

export class UserSubscriptionDietItemEntity extends Model {
    declare id: string;
    declare dayId: string;
    declare mealType: MealTypeValue;
    declare foodName: string;
    declare quantity: string | null;
    declare unit: string | null;
    declare notes: string | null;
    declare calories: number | null;
    declare order: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

UserSubscriptionDietItemEntity.init(
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
        mealType: {
            type: DataTypes.ENUM(...Object.values(MealType)),
            allowNull: false,
        },
        foodName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        calories: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'UserSubscriptionDietItem',
        tableName: 'user_subscription_diet_items',
        timestamps: true,
        indexes: [
            {
                fields: ['dayId'],
            },
            {
                fields: ['mealType'],
            },
        ],
    }
);

UserSubscriptionDietItemEntity.belongsTo(UserSubscriptionDayEntity, { foreignKey: 'dayId', as: 'day' });
UserSubscriptionDayEntity.hasMany(UserSubscriptionDietItemEntity, { foreignKey: 'dayId', as: 'dietItems', onDelete: 'CASCADE', hooks: true });
