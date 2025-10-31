import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class PostLikeEntity extends Model {
    declare id: string;
    declare postId: string;
    declare userId: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

PostLikeEntity.init(
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
    },
    {
        sequelize,
        modelName: 'PostLike',
        tableName: 'post_likes',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['postId', 'userId'],
            },
        ],
    }
);
