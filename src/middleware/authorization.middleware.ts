import passport from 'passport';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HttpResponseError } from '../utils/appError.js';
import { UserEntity } from '../modules/user/v1/entity/user.entity.js';
import { UserSessionEntity } from '../modules/user-session/v1/entity/user-session.entity.js';
import { UserService } from '../modules/user/v1/user.service.js';


declare module 'express' {
    interface Request {
        user?: UserEntity;
        userSession?: UserSessionEntity;
    }
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('jwt-access', { session: false }, async (err, user: UserEntity, userSession: UserSessionEntity) => {
        try {
            if (err || !user) {
                throw new HttpResponseError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
            }

            const existingUser = await UserService.getUserById(user.id);
            if (!existingUser) {
                throw new HttpResponseError(StatusCodes.UNAUTHORIZED, 'User not found');
            }

            const session = await UserSessionEntity.findOne({ where: { id: userSession.id } });
            if (!session) {
                throw new HttpResponseError(StatusCodes.UNAUTHORIZED, 'Session not found');
            }

            req.user = existingUser;
            req.userSession = session;
            next();
        } catch (error) {
            next(error);
        }
    })(req, res, next);
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role as string)) {
            throw new HttpResponseError(
                StatusCodes.FORBIDDEN,
                'You do not have permission to perform this action'
            );
        }
        next();
    };
};