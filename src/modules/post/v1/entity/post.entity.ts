import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostEntity extends Model {
    declare id: string;
    declare userId: string;
    declare text?: string | null;
    declare likesCount: number;
    declare commentsCount: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostEntity.init(
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
        text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        likesCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        commentsCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'Post',
        tableName: 'posts',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
            },
            {
                fields: ['createdAt'],
            },
        ],
    }
);
