import Joi from 'joi';

export const naturalNutrientsSchema = Joi.object({
    query: Joi.string().required().min(1).messages({
        'string.empty': 'Query cannot be empty',
        'any.required': 'Query is required',
    }),
    timezone: Joi.string().optional(),
    consumed_at: Joi.string().isoDate().optional(),
});

export const naturalExerciseSchema = Joi.object({
    query: Joi.string().required().min(1).messages({
        'string.empty': 'Query cannot be empty',
        'any.required': 'Query is required',
    }),
    gender: Joi.string().valid('male', 'female').optional(),
    weight_kg: Joi.number().positive().optional(),
    height_cm: Joi.number().positive().optional(),
    age: Joi.number().integer().positive().optional(),
});

export const searchInstantSchema = Joi.object({
    query: Joi.string().required().min(3).messages({
        'string.empty': 'Query cannot be empty',
        'any.required': 'Query is required',
        'string.min': 'Query must be at least 3 characters',
    }),
    common: Joi.boolean().optional(),
    branded: Joi.boolean().optional(),
    detailed: Joi.boolean().optional(),
    self: Joi.boolean().optional(),
});

export const searchItemSchema = Joi.object({
    nix_item_id: Joi.string().optional(),
    upc: Joi.string().optional(),
}).or('nix_item_id', 'upc').messages({
    'object.missing': 'Either nix_item_id or upc is required',
});
