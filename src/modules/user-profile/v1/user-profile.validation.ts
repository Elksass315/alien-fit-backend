import Joi from 'joi';
import { JoiCustomValidateObjectId } from '../../../utils/joi-custom-validate-object-id.js';


export const userProfileSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', true),

    whatDoYouWantToAchieve: Joi.string().allow(null).optional().messages({
        'string.base': 'What do you want to achieve must be a string',
    }),
    goal: Joi.string().allow(null).optional().messages({
        'string.base': 'Goal must be a string',
    }),
    activityLevel: Joi.string().allow(null).optional().messages({
        'string.base': 'Activity level must be a string',
    }),
    bodyFat: Joi.string().allow(null).optional().messages({
        'string.base': 'Body fat must be a string',
    }),
    trainingSite: Joi.string().allow(null).optional().messages({
        'string.base': 'Training site must be a string',
    }),
    preferredWorkoutTime: Joi.object().pattern(Joi.string(), Joi.string()).allow(null).optional().messages({
        'object.base': 'Preferred workout time must be an object',
    }),
    tools: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Tools must be an array of strings',
    }),
    injuries: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Injuries must be an array of strings',
    }),
    diseases: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Diseases must be an array of strings',
    }),
    workOutBefore: Joi.boolean().allow(null).optional().messages({
        'boolean.base': 'workOutBefore must be a boolean',
    }),
    typesOfExercises: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Types of exercises must be an array of strings',
    }),
    useSupplements: Joi.boolean().allow(null).optional().messages({
        'boolean.base': 'useSupplements must be a boolean',
    }),
    intolerances: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Intolerances must be an array of strings',
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
    vegetables: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Vegetables must be an array of strings',
    }),
    dairy: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Dairy must be an array of strings',
    }),
    legumes: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Legumes must be an array of strings',
    }),
    others: Joi.array().items(Joi.string()).allow(null).optional().messages({
        'array.base': 'Others must be an array of strings',
    }),
});

export const createUpdateUserProfileSchema = userProfileSchema;

export const getUserProfileSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', true),
});