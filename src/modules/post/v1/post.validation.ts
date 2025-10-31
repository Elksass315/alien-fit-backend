import Joi from 'joi';

const uuidSchema = Joi.string().guid({ version: ['uuidv4'] });

export const paginationQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

export const createPostSchema = Joi.object({
    text: Joi.string().min(1).max(5000),
    mediaIds: Joi.array().items(uuidSchema).max(10),
});

export const updatePostSchema = Joi.object({
    postId: uuidSchema.required(),
    text: Joi.string().allow('', null).max(5000),
    mediaIds: Joi.array().items(uuidSchema).max(10),
});

export const postIdParamSchema = Joi.object({
    postId: uuidSchema.required(),
});

export const getMyPostsSchema = paginationQuerySchema;

export const getUserPostsSchema = paginationQuerySchema.keys({
    userId: uuidSchema.required(),
});

export const feedSchema = paginationQuerySchema;

export const reportPostSchema = Joi.object({
    postId: uuidSchema.required(),
    reason: Joi.string().min(1).max(1000).required(),
});

export const togglePostLikeSchema = Joi.object({
    postId: uuidSchema.required(),
});

export const listPostLikesSchema = paginationQuerySchema.keys({
    postId: uuidSchema.required(),
});

export const toggleSavePostSchema = Joi.object({
    postId: uuidSchema.required(),
});

export const getSavedPostsSchema = paginationQuerySchema;

export const createCommentSchema = Joi.object({
    postId: uuidSchema.required(),
    content: Joi.string().trim().min(1).max(2000).required(),
});

export const createReplySchema = Joi.object({
    postId: uuidSchema.required(),
    commentId: uuidSchema.required(),
    content: Joi.string().trim().min(1).max(2000).required(),
});

export const listCommentsSchema = paginationQuerySchema.keys({
    postId: uuidSchema.required(),
});

export const commentIdParamSchema = Joi.object({
    commentId: uuidSchema.required(),
});

export const updateCommentSchema = Joi.object({
    commentId: uuidSchema.required(),
    content: Joi.string().trim().min(1).max(2000).required(),
});

export const reportCommentSchema = Joi.object({
    commentId: uuidSchema.required(),
    reason: Joi.string().allow('', null).max(1000),
});

export const toggleCommentLikeSchema = Joi.object({
    commentId: uuidSchema.required(),
});
