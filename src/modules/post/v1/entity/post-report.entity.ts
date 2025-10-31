import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export enum PostReportStatus {
    PENDING = 'pending',
    REVIEWED = 'reviewed',
    DISMISSED = 'dismissed',
}

export class PostReportEntity extends Model {
    declare id: string;
    declare postId: string;
    declare userId: string;
    declare reason?: string | null;
    declare status: PostReportStatus;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostReportEntity.init(
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
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(PostReportStatus)),
            allowNull: false,
            defaultValue: PostReportStatus.PENDING,
        },
    },
    {
        sequelize,
        modelName: 'PostReport',
        tableName: 'post_reports',
        timestamps: true,
        indexes: [
            {
                fields: ['postId'],
            },
            {
                unique: true,
                fields: ['postId', 'userId'],
            },
        ],
    }
);
