import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostMediaEntity extends Model {
    declare id: string;
    declare postId: string;
    declare mediaId: string;
    declare sortOrder: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostMediaEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        postId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        mediaId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'PostMedia',
        tableName: 'post_media',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['postId', 'mediaId'],
            },
        ],
    }
);
