import express from 'express';
import { Roles } from '../../../constants/roles.js';
import { auth, authorizeRoles } from '../../../middleware/authorization.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import {
    activateSubscriptionController,
    completeDietItemController,
    completeTrainingItemController,
    createPlanUpdateRequestController,
    getMySubscriptionController,
    getSubscriptionForUserController,
    listPlanUpdateRequestsController,
    logExtraActivityController,
    renewSubscriptionController,
    resolvePlanUpdateRequestController,
    upsertCyclePlanController,
} from './subscription.controller.js';
import {
    activateSubscriptionSchema,
    completeDietItemSchema,
    completeTrainingItemSchema,
    createPlanUpdateRequestSchema,
    extraLogSchema,
    getSubscriptionForUserSchema,
    listPlanUpdateRequestsSchema,
    renewSubscriptionSchema,
    resolvePlanUpdateRequestSchema,
    upsertCyclePlanSchema,
} from './subscription.validation.js';

export const subscriptionRouterV1 = express.Router();

subscriptionRouterV1.use(auth);

subscriptionRouterV1.get('/me', getMySubscriptionController);
subscriptionRouterV1.post(
    '/me/training/:trainingItemId/complete',
    validateRequest(completeTrainingItemSchema),
    completeTrainingItemController
);
subscriptionRouterV1.post(
    '/me/diet/:dietItemId/complete',
    validateRequest(completeDietItemSchema),
    completeDietItemController
);
subscriptionRouterV1.post('/me/extra-log', validateRequest(extraLogSchema), logExtraActivityController);
subscriptionRouterV1.post(
    '/me/plan-update-request',
    validateRequest(createPlanUpdateRequestSchema),
    createPlanUpdateRequestController
);

subscriptionRouterV1.use(authorizeRoles(Roles.ADMIN));

subscriptionRouterV1.get(
    '/plan-requests',
    validateRequest(listPlanUpdateRequestsSchema),
    listPlanUpdateRequestsController
);
subscriptionRouterV1.post(
    '/plan-requests/:requestId/resolve',
    validateRequest(resolvePlanUpdateRequestSchema),
    resolvePlanUpdateRequestController
);
subscriptionRouterV1.post(
    '/:userId/activate',
    validateRequest(activateSubscriptionSchema),
    activateSubscriptionController
);
subscriptionRouterV1.post(
    '/:userId/renew',
    validateRequest(renewSubscriptionSchema),
    renewSubscriptionController
);
subscriptionRouterV1.put(
    '/:userId/cycles/:cycleId/plan',
    validateRequest(upsertCyclePlanSchema),
    upsertCyclePlanController
);
subscriptionRouterV1.get(
    '/:userId',
    validateRequest(getSubscriptionForUserSchema),
    getSubscriptionForUserController
);
