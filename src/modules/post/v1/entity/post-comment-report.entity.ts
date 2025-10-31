import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export enum PostCommentReportStatus {
    PENDING = 'pending',
    REVIEWED = 'reviewed',
    DISMISSED = 'dismissed',
}

export class PostCommentReportEntity extends Model {
    declare id: string;
    declare commentId: string;
    declare userId: string;
    declare reason?: string | null;
    declare status: PostCommentReportStatus;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostCommentReportEntity.init(
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
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(PostCommentReportStatus)),
            allowNull: false,
            defaultValue: PostCommentReportStatus.PENDING,
        },
    },
    {
        sequelize,
        modelName: 'PostCommentReport',
        tableName: 'post_comment_reports',
        timestamps: true,
        indexes: [
            {
                fields: ['commentId'],
            },
            {
                unique: true,
                fields: ['commentId', 'userId'],
            },
        ],
    }
);
