import Joi from 'joi';
import { JoiCustomValidateObjectId } from '../../../utils/joi-custom-validate-object-id.js';
import { ExtraLogType, MealType, PlanRequestStatus } from './subscription.enums.js';

const activateOrRenewBody = {
    startDate: Joi.date().iso().optional().messages({
        'date.base': 'startDate must be a valid ISO date',
        'date.format': 'startDate must be a valid ISO date',
    }),
    cycleLengthWeeks: Joi.number().integer().min(1).max(12).optional().messages({
        'number.base': 'cycleLengthWeeks must be a number',
        'number.integer': 'cycleLengthWeeks must be an integer',
        'number.min': 'cycleLengthWeeks must be at least 1',
        'number.max': 'cycleLengthWeeks cannot exceed 12',
    }),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'notes must be a string',
    }),
};

const trainingItemSchema = Joi.object({
    title: Joi.string().trim().min(1).max(255).required().messages({
        'string.base': 'training.items.title must be a string',
        'string.empty': 'training.items.title cannot be empty',
        'string.min': 'training.items.title must be at least 1 character',
        'string.max': 'training.items.title cannot exceed 255 characters',
        'any.required': 'training.items.title is required',
    }),
    videoUrl: Joi.string().uri().allow(null, '').optional().messages({
        'string.uri': 'training.items.videoUrl must be a valid URL',
    }),
    description: Joi.string().allow(null, '').optional().messages({
        'string.base': 'training.items.description must be a string',
    }),
    durationMinutes: Joi.number().integer().min(1).max(600).allow(null).optional().messages({
        'number.base': 'training.items.durationMinutes must be a number',
        'number.integer': 'training.items.durationMinutes must be an integer',
        'number.min': 'training.items.durationMinutes must be at least 1',
        'number.max': 'training.items.durationMinutes cannot exceed 600',
    }),
    repeatCount: Joi.number().integer().min(1).max(100).allow(null).optional().messages({
        'number.base': 'training.items.repeatCount must be a number',
        'number.integer': 'training.items.repeatCount must be an integer',
        'number.min': 'training.items.repeatCount must be at least 1',
        'number.max': 'training.items.repeatCount cannot exceed 100',
    }),
    isSuperset: Joi.boolean().optional().messages({
        'boolean.base': 'training.items.isSuperset must be a boolean',
    }),
    supersetKey: Joi.string().trim().max(50).allow(null, '').optional().messages({
        'string.base': 'training.items.supersetKey must be a string',
        'string.max': 'training.items.supersetKey cannot exceed 50 characters',
    }),
    restSeconds: Joi.number().integer().min(0).max(600).allow(null).optional().messages({
        'number.base': 'training.items.restSeconds must be a number',
        'number.integer': 'training.items.restSeconds must be an integer',
        'number.min': 'training.items.restSeconds cannot be negative',
        'number.max': 'training.items.restSeconds cannot exceed 600',
    }),
    metadata: Joi.object().unknown(true).allow(null).optional(),
}).unknown(false);

const trainingDaySchema = Joi.object({
    dayOfWeek: Joi.number().integer().min(1).max(7).required().messages({
        'number.base': 'training.days.dayOfWeek must be a number',
        'number.integer': 'training.days.dayOfWeek must be an integer',
        'number.min': 'training.days.dayOfWeek must be between 1 and 7',
        'number.max': 'training.days.dayOfWeek must be between 1 and 7',
        'any.required': 'training.days.dayOfWeek is required',
    }),
    isRestDay: Joi.boolean().optional().messages({
        'boolean.base': 'training.days.isRestDay must be a boolean',
    }),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'training.days.notes must be a string',
    }),
    items: Joi.array().items(trainingItemSchema).optional().messages({
        'array.base': 'training.days.items must be an array',
    }),
}).unknown(false);

const dietItemSchema = Joi.object({
    mealType: Joi.string().valid(...Object.values(MealType)).required().messages({
        'any.only': `diet.days.meals.mealType must be one of ${Object.values(MealType).join(', ')}`,
        'any.required': 'diet.days.meals.mealType is required',
    }),
    foodName: Joi.string().trim().min(1).max(255).required().messages({
        'string.base': 'diet.days.meals.foodName must be a string',
        'string.empty': 'diet.days.meals.foodName cannot be empty',
        'string.min': 'diet.days.meals.foodName must be at least 1 character',
        'string.max': 'diet.days.meals.foodName cannot exceed 255 characters',
        'any.required': 'diet.days.meals.foodName is required',
    }),
    quantity: Joi.string().trim().max(255).allow(null, '').optional().messages({
        'string.base': 'diet.days.meals.quantity must be a string',
        'string.max': 'diet.days.meals.quantity cannot exceed 255 characters',
    }),
    unit: Joi.string().trim().max(50).allow(null, '').optional().messages({
        'string.base': 'diet.days.meals.unit must be a string',
        'string.max': 'diet.days.meals.unit cannot exceed 50 characters',
    }),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'diet.days.meals.notes must be a string',
    }),
    calories: Joi.number().integer().min(0).max(5000).allow(null).optional().messages({
        'number.base': 'diet.days.meals.calories must be a number',
        'number.integer': 'diet.days.meals.calories must be an integer',
        'number.min': 'diet.days.meals.calories cannot be negative',
        'number.max': 'diet.days.meals.calories cannot exceed 5000',
    }),
    order: Joi.number().integer().min(0).max(100).allow(null).optional().messages({
        'number.base': 'diet.days.meals.order must be a number',
        'number.integer': 'diet.days.meals.order must be an integer',
        'number.min': 'diet.days.meals.order cannot be negative',
        'number.max': 'diet.days.meals.order cannot exceed 100',
    }),
}).unknown(false);

const dietDaySchema = Joi.object({
    dayOfWeek: Joi.number().integer().min(1).max(7).required().messages({
        'number.base': 'diet.days.dayOfWeek must be a number',
        'number.integer': 'diet.days.dayOfWeek must be an integer',
        'number.min': 'diet.days.dayOfWeek must be between 1 and 7',
        'number.max': 'diet.days.dayOfWeek must be between 1 and 7',
        'any.required': 'diet.days.dayOfWeek is required',
    }),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'diet.days.notes must be a string',
    }),
    meals: Joi.array().items(dietItemSchema).optional().messages({
        'array.base': 'diet.days.meals must be an array',
    }),
}).unknown(false);

export const activateSubscriptionSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', false),
    ...activateOrRenewBody,
}).unknown(false);

export const renewSubscriptionSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', false),
    ...activateOrRenewBody,
}).unknown(false);

export const upsertCyclePlanSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', false),
    cycleId: JoiCustomValidateObjectId('Cycle ID', false),
    training: Joi.object({
        days: Joi.array().items(trainingDaySchema).optional().messages({
            'array.base': 'training.days must be an array',
        }),
    })
        .optional()
        .messages({
            'object.base': 'training must be an object',
        }),
    diet: Joi.object({
        days: Joi.array().items(dietDaySchema).optional().messages({
            'array.base': 'diet.days must be an array',
        }),
    })
        .optional()
        .messages({
            'object.base': 'diet must be an object',
        }),
}).unknown(false);

export const getSubscriptionForUserSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID', false),
}).unknown(false);

export const completeTrainingItemSchema = Joi.object({
    trainingItemId: JoiCustomValidateObjectId('trainingItemId', false),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'notes must be a string',
    }),
}).unknown(false);

export const completeDietItemSchema = Joi.object({
    dietItemId: JoiCustomValidateObjectId('dietItemId', false),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'notes must be a string',
    }),
}).unknown(false);

export const extraLogSchema = Joi.object({
    type: Joi.string().valid(...Object.values(ExtraLogType)).required().messages({
        'any.only': `type must be one of ${Object.values(ExtraLogType).join(', ')}`,
        'any.required': 'type is required',
    }),
    payload: Joi.object().unknown(true).allow(null).optional(),
    cycleId: JoiCustomValidateObjectId('cycleId', true),
    dayId: JoiCustomValidateObjectId('dayId', true),
    loggedAt: Joi.date().iso().optional().messages({
        'date.base': 'loggedAt must be a valid ISO date',
    }),
}).unknown(false);

export const createPlanUpdateRequestSchema = Joi.object({
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'notes must be a string',
    }),
}).unknown(false);

export const resolvePlanUpdateRequestSchema = Joi.object({
    requestId: JoiCustomValidateObjectId('requestId', false),
    status: Joi.string()
        .valid(PlanRequestStatus.APPROVED, PlanRequestStatus.DECLINED)
        .required()
        .messages({
            'any.only': `status must be either ${PlanRequestStatus.APPROVED} or ${PlanRequestStatus.DECLINED}`,
            'any.required': 'status is required',
        }),
    notes: Joi.string().allow(null, '').optional().messages({
        'string.base': 'notes must be a string',
    }),
}).unknown(false);

export const listPlanUpdateRequestsSchema = Joi.object({
    status: Joi.string().valid(...Object.values(PlanRequestStatus)).optional().messages({
        'any.only': `status must be one of ${Object.values(PlanRequestStatus).join(', ')}`,
    }),
    page: Joi.number().integer().min(1).optional().messages({
        'number.base': 'page must be a number',
        'number.integer': 'page must be an integer',
        'number.min': 'page must be at least 1',
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
        'number.base': 'limit must be a number',
        'number.integer': 'limit must be an integer',
        'number.min': 'limit must be at least 1',
        'number.max': 'limit cannot exceed 100',
    }),
}).unknown(false);
