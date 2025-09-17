import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';


export class MediaEntity extends Model {
    declare id: number;
    declare key: string;
    declare url: string;
    declare originalName?: string;
    declare contentType: string;
    declare mediaType: string;
    declare size?: number;
    declare thumbnails?: { small?: string; medium?: string; large?: string };
    declare metadata?: object;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

MediaEntity.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        contentType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video', 'document'),
            allowNull: false,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        thumbnails: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Media',
        tableName: 'media',
        timestamps: true,
        defaultScope: {
            attributes: {
                exclude: ['key'],
            },
        },
    }
);
