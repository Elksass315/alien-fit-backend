import { StatusCodes } from 'http-status-codes';
import { HttpResponseError } from '../../../utils/appError.js';
import { UserSessionEntity } from './entity/user-session.entity.js';
import './entity/associate-models.js'


export class UserSessionService {
    static async updateFCMToken(sessionId: string, fcmToken: string): Promise<void> {
        const session = await UserSessionEntity.findByPk(sessionId);
        if (!session) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User session not found');
        }
        session.fcmToken = fcmToken;
        await session.save();
    }
}
