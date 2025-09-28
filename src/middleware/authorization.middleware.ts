import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HttpResponseError } from '../utils/appError.js';
import { UserEntity } from '../modules/user/v1/entity/user.entity.js';
import { UserSessionEntity } from '../modules/user-session/v1/entity/user-session.entity.js';
import { UserService } from '../modules/user/v1/user.service.js';
import { authenticateAccessToken } from '../utils/auth.utils.js';


declare module 'express' {
    interface Request {
        user?: UserEntity;
        userSession?: UserSessionEntity;
    }
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        try {
            const token = extractAccessToken(req);
            const { user, session } = await authenticateAccessToken(token);
            req.user = user;
            req.userSession = session;
            next();
        } catch (error) {
            next(error);
        }
    })();
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

function extractAccessToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return undefined;
}