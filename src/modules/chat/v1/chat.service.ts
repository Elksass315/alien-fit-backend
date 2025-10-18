import { FindAndCountOptions } from 'sequelize';
import { ChatEntity } from './entity/chat.entity.js';
import { MessageEntity, MessageType, SenderRole } from './entity/message.entity.js';
import './entity/associate-models.js';
import { UserService } from '../../user/v1/user.service.js';
import { HttpResponseError } from '../../../utils/appError.js';
import { StatusCodes } from 'http-status-codes';
import { Roles } from '../../../constants/roles.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';

interface PaginationOptions {
    page?: number;
    limit?: number;
}

export interface SendMessagePayload {
    userId: string;
    senderId: string;
    senderRole: SenderRole;
    content: string;
    messageType?: MessageType;
}

const DEFAULT_PAGE_SIZE = 50;

export class ChatService {
    static async getOrCreateUserChat(userId: string): Promise<ChatEntity> {
        const [chat] = await ChatEntity.findOrCreate({
            where: { userId },
            defaults: {
                userId,
            }
        });
        return chat;
    }

    static async sendMessage(payload: SendMessagePayload): Promise<{ chat: ChatEntity; message: MessageEntity; }> {
        const trimmedContent = payload.content?.trim();
        if (!trimmedContent) {
            throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Message content is required');
        }

        if (payload.senderRole === Roles.TRAINER || payload.senderRole === Roles.ADMIN) {
            await UserService.getUserById(payload.userId);
        }

        const chat = await this.getOrCreateUserChat(payload.userId);

        const messageType: MessageType = payload.messageType ?? 'text';

        const message = await MessageEntity.create({
            chatId: chat.id,
            senderId: payload.senderId,
            senderRole: payload.senderRole,
            messageType,
            content: trimmedContent,
        });

        await chat.update({
            lastMessageAt: message.createdAt,
            lastMessagePreview: trimmedContent.substring(0, 280),
        });

        return { chat, message };
    }

    static async getMessagesForUser(userId: string, options: PaginationOptions = {}): Promise<MessageEntity[]> {
        const chat = await this.getOrCreateUserChat(userId);
        return this.getMessagesForChat(chat.id, options);
    }

    static async getMessagesForChat(chatId: string, options: PaginationOptions = {}): Promise<MessageEntity[]> {
        const { page = 1, limit = DEFAULT_PAGE_SIZE } = options;
        return MessageEntity.findAll({
            where: { chatId },
            order: [['createdAt', 'ASC']],
            limit,
            offset: (page - 1) * limit,
        });
    }

    static async listUserChats(options: PaginationOptions = {}) {
        const { page = 1, limit = DEFAULT_PAGE_SIZE } = options;

        const findOptions: FindAndCountOptions = {
            limit,
            offset: (page - 1) * limit,
            order: [
                ['lastMessageAt', 'DESC'],
                ['createdAt', 'DESC'],
            ],
            include: [{
                model: UserEntity,
                as: 'user',
                attributes: ['id', 'name', 'provider', 'role'],
            }],
        };

        const { rows, count } = await ChatEntity.findAndCountAll(findOptions);

        return {
            chats: rows,
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit) || 1,
        };
    }
}
