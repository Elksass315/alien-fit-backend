import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticateAccessToken } from '../utils/auth.utils.js';
import { Roles } from '../constants/roles.js';
import { ChatService } from '../modules/chat/v1/chat.service.js';
import { PresenceService } from '../modules/chat/v1/presence.service.js';
import { MessageEntity, SenderRole } from '../modules/chat/v1/entity/message.entity.js';
import { HttpResponseError } from '../utils/appError.js';
import { UserService } from '../modules/user/v1/user.service.js';

const TRAINERS_ROOM = 'trainers';
const HEARTBEAT_EVENT = 'heartbeat';
const SEND_MESSAGE_EVENT = 'chat:send';
const MESSAGE_EVENT = 'chat:message';
const USER_ROOM_PREFIX = 'chat:';
const CALL_OFFER_EVENT = 'call:offer';
const CALL_ANSWER_EVENT = 'call:answer';
const CALL_ICE_CANDIDATE_EVENT = 'call:ice-candidate';
const CALL_END_EVENT = 'call:end';

interface CallSession {
    userId: string;
    initiatorId: string;
    initiatorSocketId: string;
    startedAt: Date;
    status: 'ringing' | 'active';
    trainerId?: string;
    trainerSocketId?: string;
}

type CallTerminator = 'user' | 'trainer' | 'system';

declare module 'socket.io' {
    interface SocketData {
        userId: string;
        role: string;
    }
}

const connectionCounters = new Map<string, number>();
const activeCallSessions = new Map<string, CallSession>();

export function initializeSocketServer(server: HTTPServer) {
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
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
                    senderRole,
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

        // --- WebRTC signaling bridge ---
        // We maintain a per-user CallSession so that a single trainer/admin can pick up
        // an incoming WebRTC call. All offers/answers/ICE are funneled through Socket.IO.
        socket.on(CALL_OFFER_EVENT, async (payload, callback) => {
            try {
                if (role !== Roles.USER) {
                    throw new HttpResponseError(403, 'Only users can start calls');
                }

                const { offer } = payload as { offer?: unknown };
                if (!offer) {
                    throw new HttpResponseError(400, 'WebRTC SDP offer is required');
                }

                if (activeCallSessions.has(userId)) {
                    throw new HttpResponseError(409, 'A call is already in progress for this user');
                }

                const caller = await UserService.getUserById(userId);

                activeCallSessions.set(userId, {
                    userId,
                    initiatorId: userId,
                    initiatorSocketId: socket.id,
                    startedAt: new Date(),
                    status: 'ringing',
                });

                await recordCallHistoryMessage({
                    userId,
                    senderId: userId,
                    senderRole: Roles.USER as SenderRole,
                    content: 'Outgoing call',
                });

                await PresenceService.heartbeat(userId);

                io.to(TRAINERS_ROOM).emit(CALL_OFFER_EVENT, {
                    userId,
                    offer,
                    caller: {
                        id: userId,
                        name: caller.name,
                        provider: caller.provider,
                        role: Roles.USER,
                    },
                });

                callback?.({ status: 'ok' });
            } catch (error) {
                callback?.({ status: 'error', message: (error as Error).message });
            }
        });

        socket.on(CALL_ANSWER_EVENT, async (payload, callback) => {
            try {
                if (![Roles.TRAINER, Roles.ADMIN].includes(role)) {
                    throw new HttpResponseError(403, 'Only trainers or admins can answer calls');
                }

                const { userId: targetUserId, answer } = payload as { userId?: string; answer?: unknown };
                if (!targetUserId) {
                    throw new HttpResponseError(400, 'Target userId is required');
                }
                if (!answer) {
                    throw new HttpResponseError(400, 'WebRTC SDP answer is required');
                }

                const session = activeCallSessions.get(targetUserId);
                if (!session) {
                    throw new HttpResponseError(404, 'No pending call for this user');
                }
                if (session.status === 'active') {
                    throw new HttpResponseError(409, 'This call has already been answered');
                }

                session.status = 'active';
                session.trainerId = userId;
                session.trainerSocketId = socket.id;

                await recordCallHistoryMessage({
                    userId: targetUserId,
                    senderId: userId,
                    senderRole: role as SenderRole,
                    content: 'Incoming call answered',
                });

                await PresenceService.heartbeat(userId);

                io.to(getUserRoom(targetUserId)).emit(CALL_ANSWER_EVENT, {
                    answer,
                    trainer: {
                        label: 'trainer',
                    },
                });

                callback?.({ status: 'ok' });
            } catch (error) {
                callback?.({ status: 'error', message: (error as Error).message });
            }
        });

        socket.on(CALL_ICE_CANDIDATE_EVENT, (payload, callback) => {
            try {
                const { candidate, userId: targetUserId } = payload as { candidate?: unknown; userId?: string };
                if (!candidate) {
                    throw new HttpResponseError(400, 'ICE candidate is required');
                }

                if (role === Roles.USER) {
                    const session = activeCallSessions.get(userId);
                    if (!session || !session.trainerSocketId) {
                        throw new HttpResponseError(404, 'No trainer is connected to this call yet');
                    }
                    io.to(session.trainerSocketId).emit(CALL_ICE_CANDIDATE_EVENT, {
                        userId,
                        candidate,
                    });
                } else if ([Roles.TRAINER, Roles.ADMIN].includes(role)) {
                    if (!targetUserId) {
                        throw new HttpResponseError(400, 'Target userId is required');
                    }

                    const session = activeCallSessions.get(targetUserId);
                    if (!session || session.trainerSocketId !== socket.id) {
                        throw new HttpResponseError(403, 'You are not attached to this call');
                    }

                    io.to(session.initiatorSocketId).emit(CALL_ICE_CANDIDATE_EVENT, {
                        candidate,
                    });
                } else {
                    throw new HttpResponseError(403, 'Unsupported role for ICE exchange');
                }

                callback?.({ status: 'ok' });
            } catch (error) {
                callback?.({ status: 'error', message: (error as Error).message });
            }
        });

        socket.on(CALL_END_EVENT, async (payload, callback) => {
            try {
                const { reason, userId: targetUserId } = payload as { reason?: string; userId?: string };

                if (role === Roles.USER) {
                    const ended = await finalizeCallSession(userId, {
                        actorId: userId,
                        actorRole: Roles.USER as SenderRole,
                        endedBy: 'user',
                        reason,
                        refreshPresence: true,
                    });

                    callback?.({ status: ended ? 'ok' : 'noop' });
                } else if ([Roles.TRAINER, Roles.ADMIN].includes(role)) {
                    if (!targetUserId) {
                        throw new HttpResponseError(400, 'Target userId is required');
                    }

                    const session = activeCallSessions.get(targetUserId);
                    if (session && session.trainerSocketId && session.trainerSocketId !== socket.id) {
                        throw new HttpResponseError(403, 'You are not attached to this call');
                    }

                    const ended = await finalizeCallSession(targetUserId, {
                        actorId: userId,
                        actorRole: role as SenderRole,
                        endedBy: 'trainer',
                        reason,
                        refreshPresence: true,
                    });

                    callback?.({ status: ended ? 'ok' : 'noop' });
                } else {
                    throw new HttpResponseError(403, 'Unsupported role for ending calls');
                }
            } catch (error) {
                callback?.({ status: 'error', message: (error as Error).message });
            }
        });

        socket.on('disconnect', async () => {
            if (deregisterConnection(userId)) {
                await PresenceService.markOffline(userId);
            }

            if (role === Roles.USER) {
                const session = activeCallSessions.get(userId);
                if (session && session.initiatorSocketId === socket.id) {
                    await finalizeCallSession(userId, {
                        actorId: userId,
                        actorRole: Roles.USER as SenderRole,
                        endedBy: 'user',
                        reason: 'disconnect',
                        refreshPresence: false,
                    });
                }
            } else if (role === Roles.TRAINER || role === Roles.ADMIN) {
                const session = findCallSessionByTrainerSocketId(socket.id);
                if (session) {
                    await finalizeCallSession(session.userId, {
                        actorId: userId,
                        actorRole: role as SenderRole,
                        endedBy: 'trainer',
                        reason: 'disconnect',
                        refreshPresence: false,
                    });
                }
            }
        });
    });

    // Persist each call lifecycle step as a chat message so WhatsApp-style history
    // appears inline with the rest of the conversation.
    async function recordCallHistoryMessage(params: { userId: string; senderId: string; senderRole: SenderRole; content: string; }) {
        const { message } = await ChatService.sendMessage({
            userId: params.userId,
            senderId: params.senderId,
            senderRole: params.senderRole,
            content: params.content,
            messageType: 'call',
        });

        io.to(getUserRoom(params.userId)).emit(MESSAGE_EVENT, mapMessageForUser(params.userId, message));
        io.to(TRAINERS_ROOM).emit(MESSAGE_EVENT, mapMessageForTrainer(message));

        return message;
    }

    async function finalizeCallSession(userId: string, options: { actorId: string; actorRole: SenderRole; endedBy: CallTerminator; reason?: string; refreshPresence?: boolean; }): Promise<boolean> {
        const session = activeCallSessions.get(userId);
        if (!session) {
            return false;
        }

        activeCallSessions.delete(userId);
        const content = session.status === 'active' ? 'Call ended' : 'Missed call';

        await recordCallHistoryMessage({
            userId,
            senderId: options.actorId,
            senderRole: options.actorRole,
            content,
        });

        if (options.refreshPresence) {
            await PresenceService.heartbeat(options.actorId);
        }

        const payload = {
            userId,
            endedBy: options.endedBy,
            reason: options.reason,
        };

        io.to(getUserRoom(userId)).emit(CALL_END_EVENT, payload);

        if (session.trainerSocketId) {
            io.to(session.trainerSocketId).emit(CALL_END_EVENT, payload);
        } else {
            io.to(TRAINERS_ROOM).emit(CALL_END_EVENT, payload);
        }

        return true;
    }

    function findCallSessionByTrainerSocketId(socketId: string): CallSession | undefined {
        for (const session of activeCallSessions.values()) {
            if (session.trainerSocketId === socketId) {
                return session;
            }
        }
        return undefined;
    }

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
        messageType: message.messageType,
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
        messageType: message.messageType,
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
