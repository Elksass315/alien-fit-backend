import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostCommentEntity extends Model {
    declare id: string;
    declare postId: string;
    declare userId: string;
    declare parentId?: string | null;
    declare content: string;
    declare likesCount: number;
    declare repliesCount: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostCommentEntity.init(
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
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        parentId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        likesCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        repliesCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'PostComment',
        tableName: 'post_comments',
        timestamps: true,
        indexes: [
            {
                fields: ['postId'],
            },
            {
                fields: ['parentId'],
            },
        ],
    }
);
