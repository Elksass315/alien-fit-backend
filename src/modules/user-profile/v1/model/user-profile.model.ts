import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';

export class UserProfileEntity extends Model {
    declare id: string;
    declare userId: number;

    declare whatDoYouWantToAchieve: string | null;
    declare goal: string | null;
    declare activityLevel: string | null;
    declare bodyFat: string | null;
    declare trainingSite: string | null;
    declare preferredWorkoutTime: Record<string, string> | null;
    declare tools: string[] | null;
    declare injuries: string[] | null;
    declare diseases: string[] | null;
    declare workOutBefore: boolean | null;
    declare typesOfExercises: string[] | null;
    declare useSupplements: boolean | null;
    declare intolerances: string[] | null;
    declare meats: string[] | null;
    declare carbs: string[] | null;
    declare fruits: string[] | null;
    declare vegetables: string[] | null;
    declare dairy: string[] | null;
    declare legumes: string[] | null;
    declare others: string[] | null;
}

UserProfileEntity.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        userId: { type: DataTypes.UUID, allowNull: false, unique: true },

        whatDoYouWantToAchieve: { type: DataTypes.STRING },
        goal: { type: DataTypes.STRING },
        activityLevel: { type: DataTypes.STRING },
        bodyFat: { type: DataTypes.STRING },
        trainingSite: { type: DataTypes.STRING },
        preferredWorkoutTime: { type: DataTypes.JSONB }, // e.g. { "Monday": "8:00 AM", ... }
        tools: { type: DataTypes.JSONB },          // e.g. ["Dumbbells", "Kettlebell"]

        injuries: { type: DataTypes.JSONB },      // e.g. ["Knee", "Back"]
        diseases: { type: DataTypes.JSONB },     // e.g. ["Respiratory Issues"]
        workOutBefore: { type: DataTypes.BOOLEAN }, // e.g. true
        typesOfExercises: { type: DataTypes.JSONB }, // e.g. ["Cardio", "Strength Training"]
        useSupplements: { type: DataTypes.BOOLEAN }, // e.g. false

        intolerances: { type: DataTypes.JSONB }, // e.g. ["Gluten", "Fish", "Fruit"]
        meats: { type: DataTypes.JSONB },        // ["Chicken", "Beef"]
        carbs: { type: DataTypes.JSONB },
        fruits: { type: DataTypes.JSONB },
        vegetables: { type: DataTypes.JSONB },
        dairy: { type: DataTypes.JSONB },
        legumes: { type: DataTypes.JSONB },
        others: { type: DataTypes.JSONB },
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