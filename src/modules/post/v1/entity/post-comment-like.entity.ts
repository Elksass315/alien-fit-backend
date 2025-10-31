import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostCommentLikeEntity extends Model {
    declare id: string;
    declare commentId: string;
    declare userId: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostCommentLikeEntity.init(
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
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'PostCommentLike',
        tableName: 'post_comment_likes',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['commentId', 'userId'],
            },
        ],
    }
);
