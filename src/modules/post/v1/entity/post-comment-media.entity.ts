import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostCommentMediaEntity extends Model {
    declare id: string;
    declare commentId: string;
    declare mediaId: string;
    declare sortOrder: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostCommentMediaEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        commentId: {
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
        modelName: 'PostCommentMedia',
        tableName: 'post_comment_media',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['commentId', 'mediaId'],
            },
        ],
    }
);
