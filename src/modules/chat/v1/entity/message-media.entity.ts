import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class MessageMediaEntity extends Model {
    declare id: string;
    declare messageId: string;
    declare mediaId: string;
    declare sortOrder: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

MessageMediaEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        messageId: {
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
        modelName: 'MessageMedia',
        tableName: 'message_media',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['messageId', 'mediaId'],
            },
        ],
    }
);
