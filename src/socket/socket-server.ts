import { Server as HTTPServer } from 'http';
import type { IncomingMessage } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticateAccessToken } from '../utils/auth.utils.js';
import { Roles } from '../constants/roles.js';
import { ChatService } from '../modules/chat/v1/chat.service.js';
import { PresenceService } from '../modules/chat/v1/presence.service.js';
import { MessageEntity, SenderRole } from '../modules/chat/v1/entity/message.entity.js';
import { HttpResponseError } from '../utils/appError.js';

const TRAINERS_ROOM = 'trainers';
const HEARTBEAT_EVENT = 'heartbeat';
const SEND_MESSAGE_EVENT = 'chat:send';
const MESSAGE_EVENT = 'chat:message';
const USER_ROOM_PREFIX = 'chat:';

declare module 'socket.io' {
    interface SocketData {
        userId: string;
        role: string;
    }
}

const connectionCounters = new Map<string, number>();

export function initializeSocketServer(server: HTTPServer) {
    const io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            console.log('Socket handshake headers:', socket.handshake.headers);
            const token = extractToken(socket);
            const { user } = await authenticateAccessToken(token);
            socket.data.userId = user.id.toString();
            socket.data.role = user.role;
            console.log(`Socket connected: userId=${socket.data.userId}, role=${socket.data.role}`);
            next();
        } catch (error) {
            console.log('Socket authentication error:', error);
            next(error as Error);
        }
    });

    io.engine.on('connection_error', (err) => {
        const engineError = err as {
            code?: string;
            message: string;
            context?: unknown;
            req?: IncomingMessage;
        };
        const requestInfo = engineError.req
            ? {
                url: engineError.req.url,
                origin: engineError.req.headers.origin,
                userAgent: engineError.req.headers['user-agent'],
                remoteAddress: engineError.req.socket?.remoteAddress,
            }
            : undefined;
        console.error('Socket engine connection error', {
            code: engineError.code,
            message: engineError.message,
            context: engineError.context,
            request: requestInfo,
        });
    });

    io.on('connection', async (socket) => {
        const { userId, role } = socket.data;
        registerConnection(userId);

        if (role === Roles.USER) {
            socket.join(getUserRoom(userId));
        } else if (role === Roles.TRAINER || role === Roles.ADMIN) {
            socket.join(TRAINERS_ROOM);
        }

        await PresenceService.heartbeat(userId);

        socket.on(HEARTBEAT_EVENT, async () => {
            await PresenceService.heartbeat(userId);
        });

        socket.on(SEND_MESSAGE_EVENT, async (payload, callback) => {
            try {
                const { content, userId: targetUserId } = payload as { content?: string; userId?: string };
                const resolvedUserId = role === Roles.USER ? userId : targetUserId;

                if (!resolvedUserId) {
                    throw new HttpResponseError(400, 'Target userId is required');
                }

                const senderRole = (role === Roles.USER ? Roles.USER : role) as SenderRole;
                const { message } = await ChatService.sendMessage({
                    userId: resolvedUserId,
                    senderId: userId,
                    senderRole: senderRole,
                    content: content ?? '',
                });

                await PresenceService.heartbeat(userId);

                io.to(getUserRoom(resolvedUserId)).emit(MESSAGE_EVENT, mapMessageForUser(resolvedUserId, message));
                io.to(TRAINERS_ROOM).emit(MESSAGE_EVENT, mapMessageForTrainer(message));

                callback?.({ status: 'ok' });
            } catch (error) {
                if (callback) {
                    callback({ status: 'error', message: (error as Error).message });
                }
            }
        });

        socket.on('disconnect', async () => {
            if (deregisterConnection(userId)) {
                await PresenceService.markOffline(userId);
            }
        });
    });

    return io;
}

function extractToken(socket: Socket): string | undefined {
    const { authorization } = socket.handshake.headers;
    const headerToken = normalizeToken(typeof authorization === 'string' ? authorization : undefined);
    if (headerToken) {
        return headerToken;
    }

    const authToken = typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : undefined;
    const normalizedAuthToken = normalizeToken(authToken);
    if (normalizedAuthToken) {
        return normalizedAuthToken;
    }

    const queryToken = typeof socket.handshake.query?.token === 'string'
        ? socket.handshake.query.token as string
        : undefined;

    return normalizeToken(queryToken);
}

function normalizeToken(token?: string): string | undefined {
    if (!token) {
        return undefined;
    }

    const trimmed = token.trim();
    if (!trimmed) {
        return undefined;
    }

    if (/^Bearer\s+/i.test(trimmed)) {
        return trimmed.replace(/^Bearer\s+/i, '').trim();
    }

    return trimmed;
}

function getUserRoom(userId: string): string {
    return `${USER_ROOM_PREFIX}${userId}`;
}

function mapMessageForUser(viewerId: string, message: MessageEntity) {
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

function mapMessageForTrainer(message: MessageEntity) {
    return {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        senderRole: message.senderRole,
        content: message.content,
        createdAt: message.createdAt,
    };
}

function registerConnection(userId: string) {
    const count = connectionCounters.get(userId) ?? 0;
    connectionCounters.set(userId, count + 1);
}

function deregisterConnection(userId: string): boolean {
    const count = connectionCounters.get(userId) ?? 0;
    if (count <= 1) {
        connectionCounters.delete(userId);
        return true;
    }
    connectionCounters.set(userId, count - 1);
    return false;
}
