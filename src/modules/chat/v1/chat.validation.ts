import Joi from 'joi';
import { JoiCustomValidateObjectId } from '../../../utils/joi-custom-validate-object-id.js';

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(50).optional(),
});

const mediaIdsSchema = Joi.array().items(uuidSchema).max(10);

const messageContentSchema = Joi.object({
    content: Joi.string().allow('', null).max(4000),
    mediaIds: mediaIdsSchema,
}).custom((value, helpers) => {
    const hasContent = typeof value.content === 'string' && value.content.trim().length > 0;
    const hasMedia = Array.isArray(value.mediaIds) && value.mediaIds.length > 0;
    if (!hasContent && !hasMedia) {
        return helpers.error('any.custom');
    }
    return value;
}).messages({
    'any.custom': 'Message must include content or media',
});

export const sendUserMessageSchema = messageContentSchema;

export const trainerMessageParamsSchema = Joi.object({
    userId: JoiCustomValidateObjectId('User ID'),
});

export const trainerSendMessageSchema = messageContentSchema;

export const trainerSendMessageWithParamsSchema = trainerMessageParamsSchema.concat(messageContentSchema);

export const trainerGetMessagesSchema = trainerMessageParamsSchema.concat(paginationSchema);
