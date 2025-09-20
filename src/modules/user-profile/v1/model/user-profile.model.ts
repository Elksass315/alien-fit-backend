import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';

export class UserProfileEntity extends Model {
    declare id: string;
    declare userId: number;

    declare goal: string | null;
    declare activityLevel: string | null;
    declare bodyFat: string | null;
    declare intolerances: string[] | null;
    declare diseases: string[] | null;

    declare meats: string[] | null;
    declare carbs: string[] | null;
    declare fruits: string[] | null;
}

UserProfileEntity.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false, unique: true },

        goal: { type: DataTypes.STRING },
        activityLevel: { type: DataTypes.STRING },
        bodyFat: { type: DataTypes.STRING },

        intolerances: { type: DataTypes.JSONB }, // e.g. ["Gluten", "Fish", "Fruit"]
        diseases: { type: DataTypes.JSONB },     // e.g. ["Respiratory Issues"]

        meats: { type: DataTypes.JSONB },        // ["Chicken", "Beef"]
        carbs: { type: DataTypes.JSONB },
        fruits: { type: DataTypes.JSONB },
    },
    {
        sequelize,
        modelName: 'UserProfile',
        tableName: 'user_profiles',
        timestamps: true,
    }
);

// Relations
UserEntity.hasOne(UserProfileEntity, { foreignKey: 'userId', as: 'profile' });
UserProfileEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });