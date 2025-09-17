import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../../../../database/db-config.js";
import { UserEntity } from '../../../user/v1/entity/user.entity.js';


// ---------- Model ----------
export class UserSessionEntity extends Model {
    declare id: number;
    declare userId: number;
    declare refreshToken?: string;
    declare fcmToken?: string;
    declare expiresAt?: Date;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

// ---------- Init ----------
UserSessionEntity.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users', // Use model name string to avoid circular dependency
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            unique: true, // uncomment if needed
        },
        fcmToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'UserSession',
        tableName: 'user_sessions',
        timestamps: true,
    }
);