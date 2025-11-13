import { redis } from '../../../config/redis.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';

const ONLINE_KEY_PREFIX = 'presence:online:';
const LAST_SEEN_KEY_PREFIX = 'presence:last-seen:';
const HEARTBEAT_TTL_SECONDS = 60;

export interface PresenceSnapshot {
    online: boolean;
    lastSeen: Date | null;
}

export const PresenceService = {
    async heartbeat(userId: string): Promise<void> {
        const now = new Date();
        const isoNow = now.toISOString();
        await Promise.all([
            redis.set(`${ONLINE_KEY_PREFIX}${userId}`, '1', 'EX', HEARTBEAT_TTL_SECONDS),
            redis.set(`${LAST_SEEN_KEY_PREFIX}${userId}`, isoNow),
            UserEntity.update({ isOnline: true, lastSeen: now }, { where: { id: userId } })
        ]);
    },

    async markOffline(userId: string): Promise<void> {
        const now = new Date();
        const isoNow = now.toISOString();
        await Promise.all([
            redis.del(`${ONLINE_KEY_PREFIX}${userId}`),
            redis.set(`${LAST_SEEN_KEY_PREFIX}${userId}`, isoNow),
            UserEntity.update({ isOnline: false, lastSeen: now }, { where: { id: userId } })
        ]);
    },

    async isOnline(userId: string): Promise<boolean> {
        const result = await redis.exists(`${ONLINE_KEY_PREFIX}${userId}`);
        return result === 1;
    },

    async getLastSeen(userId: string): Promise<Date | null> {
        const value = await redis.get(`${LAST_SEEN_KEY_PREFIX}${userId}`);
        return value ? new Date(value) : null;
    },

    async getPresence(userId: string): Promise<PresenceSnapshot> {
        const [online, lastSeen] = await Promise.all([
            this.isOnline(userId),
            this.getLastSeen(userId)
        ]);
        return { online, lastSeen };
    },

    async countOnlineUsers(): Promise<number> {
        let cursor = '0';
        let total = 0;
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${ONLINE_KEY_PREFIX}*`, 'COUNT', 1000);
            total += keys.length;
            cursor = nextCursor;
        } while (cursor !== '0');
        return total;
    }
};
