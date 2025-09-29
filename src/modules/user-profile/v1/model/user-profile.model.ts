import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { MediaEntity } from '../../../media/v1/model/media.model.js';

type PreferredFood = {
    meats: string[] | null;
    carbs: string[] | null;
    fruits: string[] | null;
    vegetables: string[] | null;
    dairy: string[] | null;
    legumes: string[] | null;
    others: string[] | null;
} | null;

type TrainingPreferences = {
    teamSport: string[] | null;
    individualSports: string[] | null;
    combatSports: string[] | null;
    strengthAndFitness: string[] | null;
    waterSports: string[] | null;
    outdoorAndExtreme: string[] | null;
    winterSports: string[] | null;
    other: string[] | null;
} | null;

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
    declare preferredFood: PreferredFood;
    declare training: TrainingPreferences;
    declare inbodyImageId: string | null;
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
        preferredFood: { type: DataTypes.JSONB }, // e.g. { meats: ["Chicken"], carbs: ["Rice"], ... }
        training: { type: DataTypes.JSONB }, // e.g. { teamSport: ["Football"], ... }
        inbodyImageId: { type: DataTypes.UUID, allowNull: true },
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

// Media relation for inbody image
UserProfileEntity.belongsTo(MediaEntity, { foreignKey: 'inbodyImageId', as: 'inbodyImage' });
MediaEntity.hasMany(UserProfileEntity, { foreignKey: 'inbodyImageId', as: 'userProfiles' });