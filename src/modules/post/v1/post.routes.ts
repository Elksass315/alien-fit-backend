import express from 'express';
import { auth, authorizeRoles } from '../../../middleware/authorization.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import { Roles } from '../../../constants/roles.js';
import * as controllers from './post.controller.js';
import * as validation from './post.validation.js';

export const postRouterV1 = express.Router();

postRouterV1.use(auth);

postRouterV1.post('/', validateRequest(validation.createPostSchema), controllers.createPostController);
postRouterV1.get('/me', validateRequest(validation.getMyPostsSchema), controllers.getMyPostsController);
postRouterV1.get('/user/:userId', validateRequest(validation.getUserPostsSchema), controllers.getUserPostsController);
postRouterV1.get('/feed', validateRequest(validation.feedSchema), controllers.getFeedController);

postRouterV1.put('/:postId', validateRequest(validation.updatePostSchema), controllers.updatePostController);
postRouterV1.delete('/:postId', validateRequest(validation.postIdParamSchema), controllers.deletePostController);

postRouterV1.post('/:postId/report', validateRequest(validation.reportPostSchema), controllers.reportPostController);

postRouterV1.post('/:postId/like', validateRequest(validation.togglePostLikeSchema), controllers.togglePostLikeController);
postRouterV1.get('/:postId/likes', validateRequest(validation.listPostLikesSchema), controllers.getPostLikesController);

postRouterV1.post('/:postId/save', validateRequest(validation.toggleSavePostSchema), controllers.toggleSavePostController);
postRouterV1.get('/saved', validateRequest(validation.getSavedPostsSchema), controllers.getSavedPostsController);

postRouterV1.post('/:postId/comments', validateRequest(validation.createCommentSchema), controllers.createCommentController);
postRouterV1.post('/:postId/comments/:commentId/reply', validateRequest(validation.createReplySchema), controllers.createCommentReplyController);
postRouterV1.get('/:postId/comments', validateRequest(validation.listCommentsSchema), controllers.listCommentsController);

postRouterV1.put('/comments/:commentId', validateRequest(validation.updateCommentSchema), controllers.updateCommentController);
postRouterV1.delete('/comments/:commentId', validateRequest(validation.commentIdParamSchema), controllers.deleteCommentController);

postRouterV1.post('/comments/:commentId/like', validateRequest(validation.toggleCommentLikeSchema), controllers.toggleCommentLikeController);
postRouterV1.post('/comments/:commentId/report', validateRequest(validation.reportCommentSchema), controllers.reportCommentController);

postRouterV1.use(authorizeRoles(Roles.ADMIN));
// Admin endpoints for moderation can be added here
