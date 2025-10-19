import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ChatService } from './chat.service.js';
import { PresenceService } from './presence.service.js';
import { Roles } from '../../../constants/roles.js';
import { MessageEntity, SenderRole } from './entity/message.entity.js';
import { HttpResponseError } from '../../../utils/appError.js';
import { UserService } from '../../user/v1/user.service.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';

export async function getMyChatController(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id.toString();
    const chat = await ChatService.getOrCreateUserChat(userId);
    const presence = await PresenceService.getPresence(userId);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            chat: {
                id: chat.id,
                lastMessageAt: chat.lastMessageAt,
                lastMessagePreview: chat.lastMessagePreview,
            },
            presence,
        },
    });
}

export async function getMyMessagesController(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id.toString();
    const { page = 1, limit = 50 } = req.query;
    const messages = await ChatService.getMessagesForUser(userId, {
        page: 1,
        limit: 1_000_000,
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: messages.map((message) => mapMessageForUserViewer(message, userId)),
    });
}

export async function sendMessageAsUserController(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id.toString();
    const content = req.body.content as string;

    const { message } = await ChatService.sendMessage({
        userId,
        senderId: userId,
        senderRole: Roles.USER as SenderRole,
        content,
    });

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: mapMessageForUserViewer(message, userId),
    });
}

export async function listChatsController(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 50 } = req.query;
    const result = await ChatService.listUserChats({
        page: Number(page),
        limit: Number(limit),
    });

    const presences = await Promise.all(result.chats.map((chat) => PresenceService.getPresence(chat.userId)));

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result.chats.map((chat, index) => ({
            id: chat.id,
            user: mapChatUser(chat.get('user')),
            lastMessageAt: chat.lastMessageAt,
            lastMessagePreview: chat.lastMessagePreview,
            presence: presences[index],
        })),
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
}

export async function getMessagesForUserController(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;

    await UserService.getUserById(targetUserId);

    const messages = await ChatService.getMessagesForUser(targetUserId, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: messages.map((message) => mapMessageForTrainerViewer(message)),
    });
}

export async function sendMessageAsTrainerController(req: Request, res: Response): Promise<void> {
    const sender = req.user!;
    if (![Roles.TRAINER, Roles.ADMIN].includes(sender.role as string)) {
        throw new HttpResponseError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action');
    }

    const userId = req.params.userId;
    const content = req.body.content as string;

    const senderRole = sender.role as SenderRole;
    const { message } = await ChatService.sendMessage({
        userId,
        senderId: sender.id.toString(),
        senderRole,
        content,
    });

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: mapMessageForTrainerViewer(message),
    });
}

export async function getOnlineUsersCountController(req: Request, res: Response): Promise<void> {
    const count = await PresenceService.countOnlineUsers();
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: { onlineUsers: count },
    });
}

export async function getUserPresenceController(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    await UserService.getUserById(userId);
    const presence = await PresenceService.getPresence(userId);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: presence,
    });
}

function mapMessageForUserViewer(message: MessageEntity, viewerId: string) {
    const senderType = message.senderRole === Roles.USER ? 'user' : 'trainer';
    const isMine = message.senderId === viewerId;

    return {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        senderType,
        isMine,
    };
}

function mapMessageForTrainerViewer(message: MessageEntity) {
    return {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        senderRole: message.senderRole,
        content: message.content,
        createdAt: message.createdAt,
    };
}

function mapChatUser(user: unknown) {
    const typedUser = user as UserEntity | undefined;
    if (!typedUser) {
        return null;
    }

    return {
        id: typedUser.id,
        name: typedUser.name,
        provider: typedUser.provider,
    };
}
