import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../../database/db-config.js';
import { Roles } from '../../../../constants/roles.js';

const SenderRoles = [Roles.USER, Roles.TRAINER, Roles.ADMIN] as const;
export type SenderRole = typeof SenderRoles[number];

export class MessageEntity extends Model {
    declare id: string;
    declare chatId: string;
    declare senderId: string;
    declare senderRole: SenderRole;
    declare content: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

MessageEntity.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        chatId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        senderRole: {
            type: DataTypes.ENUM(...SenderRoles),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
        timestamps: true,
    }
);
