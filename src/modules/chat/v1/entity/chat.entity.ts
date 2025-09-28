import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';

export class ChatEntity extends Model {
    declare id: string;
    declare userId: string;
    declare lastMessageAt?: Date;
    declare lastMessagePreview?: string | null;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

ChatEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        lastMessageAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        lastMessagePreview: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Chat',
        tableName: 'chats',
        timestamps: true,
    }
);
