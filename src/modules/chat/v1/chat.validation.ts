import Joi from 'joi';
import { JoiCustomValidateObjectId } from '../../../utils/joi-custom-validate-object-id.js';

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(50).optional(),
});

export const sendUserMessageSchema = Joi.object({
    content: Joi.string().trim().min(1).max(4000).required().messages({
        'string.base': 'Message content must be a string',
        'string.empty': 'Message content cannot be empty',
        'string.min': 'Message content must be at least 1 character',
        'string.max': 'Message content cannot exceed 4000 characters',
        'any.required': 'Message content is required'
    })
});

export const trainerMessageParamsSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID'),
});

export const trainerSendMessageSchema = sendUserMessageSchema;

export const trainerSendMessageWithParamsSchema = trainerMessageParamsSchema.concat(sendUserMessageSchema);

export const trainerGetMessagesSchema = trainerMessageParamsSchema.concat(paginationSchema);
