import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostViewEntity extends Model {
    declare id: string;
    declare postId: string;
    declare userId: string;
    declare lastViewedAt: Date;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostViewEntity.init(
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
        lastViewedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'PostView',
        tableName: 'post_views',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['postId', 'userId'],
            },
            {
                fields: ['userId', 'lastViewedAt'],
            },
        ],
    }
);
