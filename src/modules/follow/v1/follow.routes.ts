import express from 'express';
import { auth, optionalAuth } from '../../../middleware/authorization.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import {
    toggleFollowController,
    listFollowersController,
    listFollowingController,
} from './follow.controller.js';
import {
    toggleFollowSchema,
    listFollowersSchema,
    listFollowingSchema,
} from './follow.validation.js';

export const followRouterV1 = express.Router();

followRouterV1.post(
    '/:userId/toggle',
    auth,
    validateRequest(toggleFollowSchema),
    toggleFollowController,
);

followRouterV1.get(
    '/:userId/followers',
    optionalAuth,
    validateRequest(listFollowersSchema),
    listFollowersController,
);

followRouterV1.get(
    '/:userId/following',
    optionalAuth,
    validateRequest(listFollowingSchema),
    listFollowingController,
);
