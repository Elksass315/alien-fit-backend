import jwt from 'jsonwebtoken';
import { UserEntity } from '../modules/user/v1/entity/user.entity.js';
import { UserSessionEntity } from '../modules/user-session/v1/entity/user-session.entity.js';
import { env } from '../config/env.js';
import { UUIDV4 } from 'sequelize';



export interface IAuthToken {
    token: string;
    expiresAt: Date;
}

export const generateAuthToken = function (this: UserEntity, sessionId: string): IAuthToken {
    const expiresIn = 15 * 60 * 60; // 15 minutes in seconds
    const token = jwt.sign(
        { _id: this.id, role: this.role, sessionId },
        env.JWT_PRIVATE_KEY,
        { expiresIn }
    );

    return {
        token,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
};

export const generateRefreshToken = async function (this: UserEntity, sessionId: string): Promise<string> {
    const expiresInDays = 7;
    const refreshToken = jwt.sign(
        { _id: this.id, tokenId: UUIDV4, sessionId },
        env.REFRESH_TOKEN_PRIVATE_KEY,
        { expiresIn: `${expiresInDays}d` }
    );

    await UserSessionEntity.update(
        { refreshToken, expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) },
        { where: { id: sessionId } }
    );

    return refreshToken;
};