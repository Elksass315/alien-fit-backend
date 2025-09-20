import Joi from 'joi';
import { JoiCustomValidateObjectId } from '../../../utils/joi-custom-validate-object-id.js';

export const userProfileSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', true),

    goal: Joi.string().allow(null).optional().messages({
        'string.base': 'Goal must be a string',
    }),

    activityLevel: Joi.string().allow(null).optional().messages({
        'string.base': 'Activity level must be a string',
    }),

    bodyFat: Joi.string().allow(null).optional().messages({
        'string.base': 'Body fat must be a string',
    }),

    intolerances: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Intolerances must be an array of strings',
    }),

    diseases: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Diseases must be an array of strings',
    }),

    meats: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Meats must be an array of strings',
    }),

    carbs: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Carbs must be an array of strings',
    }),

    fruits: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Fruits must be an array of strings',
    }),
});

export const createUpdateUserProfileSchema = userProfileSchema;

export const getUserProfileSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', true),
});