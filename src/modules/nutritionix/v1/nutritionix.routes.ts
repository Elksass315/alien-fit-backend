import express from 'express';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import { auth } from '../../../middleware/authorization.middleware.js';
import {
    getNaturalNutrientsController,
    getNaturalExerciseController,
    searchInstantController,
    searchItemController,
} from './nutritionix.controller.js';
import {
    naturalNutrientsSchema,
    naturalExerciseSchema,
    searchInstantSchema,
    searchItemSchema,
} from './nutritionix.validation.js';

export const nutritionixRouterV1 = express.Router();

// All routes require authentication
nutritionixRouterV1.use(auth);

// Natural Language for Nutrients - POST /api/v1/nutritionix/nutrients
nutritionixRouterV1.post(
    '/nutrients',
    validateRequest(naturalNutrientsSchema),
    getNaturalNutrientsController
);

// Natural Language for Exercise - POST /api/v1/nutritionix/exercise
nutritionixRouterV1.post(
    '/exercise',
    validateRequest(naturalExerciseSchema),
    getNaturalExerciseController
);

// Instant Search - GET /api/v1/nutritionix/search/instant
nutritionixRouterV1.get(
    '/search/instant',
    validateRequest(searchInstantSchema),
    searchInstantController
);

// Search Item - GET /api/v1/nutritionix/search/item
nutritionixRouterV1.get(
    '/search/item',
    validateRequest(searchItemSchema),
    searchItemController
);
