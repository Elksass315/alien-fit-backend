import 'express-async-errors';
import express from 'express';
import qs from 'qs';
import i18n from './i18n/i18n-config.js';
import { corsConfig } from './config/cors.js';
import { rateLimiter } from './config/rate-limiter.js';
import helmet from 'helmet';

import { homeRouter } from './modules/home/v1/home.routes.js';
import { constantRouter } from './modules/constant/constant.routes.js';
import { userRouterV1 } from './modules/user/v1/user.routes.js';
import { authRouterV1 } from './modules/auth/v1/auth.routes.js';
import { userSessionRouterV1 } from './modules/user-session/v1/user.routes.js';
import { mediaRouterV1 } from './modules/media/v1/media.routes.js';
import { userProfileRouterV1 } from './modules/user-profile/v1/user-profile.routes.js';

import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';

export function initializeApp(app: express.Application) {
    app.use(i18n.init);
    app.set('trust proxy', 1);
    app.set('query parser', (str: string) => qs.parse(str));
    app.use(rateLimiter);
    app.use(corsConfig);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet());

    // app.use(sanitize()); // TODO: FIX IT____IT THROW ERROR WHEN IT SANITIZE REQUEST

    app.use(express.static('public'));

    app.use('/', homeRouter);
    app.use('/api/constant', constantRouter);
    app.use('/api/v1/users', userRouterV1);
    app.use('/api/v1/auth', authRouterV1);
    app.use('/api/v1/user-session', userSessionRouterV1);
    app.use('/api/v1/media', mediaRouterV1);
    app.use('/api/v1/user-profile', userProfileRouterV1);

    app.use(notFoundMiddleware);
    app.use(errorMiddleware);
}
