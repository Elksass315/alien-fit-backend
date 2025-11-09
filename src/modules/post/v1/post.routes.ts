import express from 'express';
import { auth, authorizeRoles, optionalAuth } from '../../../middleware/authorization.middleware.js';
import { validateRequest } from '../../../middleware/validation.middleware.js';
import { Roles } from '../../../constants/roles.js';
import * as controllers from './post.controller.js';
import * as validation from './post.validation.js';

export const postRouterV1 = express.Router();

postRouterV1.get('/user/:userId', optionalAuth, validateRequest(validation.getUserPostsSchema), controllers.getUserPostsController);

postRouterV1.post('/', auth, validateRequest(validation.createPostSchema), controllers.createPostController);
postRouterV1.get('/me', auth, validateRequest(validation.getMyPostsSchema), controllers.getMyPostsController);
postRouterV1.get('/feed', auth, validateRequest(validation.feedSchema), controllers.getFeedController);
postRouterV1.get('/search', auth, validateRequest(validation.searchPostsSchema), controllers.searchPostsController);

postRouterV1.put('/:postId', auth, validateRequest(validation.updatePostSchema), controllers.updatePostController);
postRouterV1.delete('/:postId', auth, validateRequest(validation.postIdParamSchema), controllers.deletePostController);

postRouterV1.post('/:postId/report', auth, validateRequest(validation.reportPostSchema), controllers.reportPostController);

postRouterV1.post('/:postId/like', auth, validateRequest(validation.togglePostLikeSchema), controllers.togglePostLikeController);
postRouterV1.get('/:postId/likes', auth, validateRequest(validation.listPostLikesSchema), controllers.getPostLikesController);

postRouterV1.post('/:postId/save', auth, validateRequest(validation.toggleSavePostSchema), controllers.toggleSavePostController);
postRouterV1.get('/saved', auth, validateRequest(validation.getSavedPostsSchema), controllers.getSavedPostsController);

postRouterV1.post('/:postId/comments', auth, validateRequest(validation.createCommentSchema), controllers.createCommentController);
postRouterV1.post('/:postId/comments/:commentId/reply', auth, validateRequest(validation.createReplySchema), controllers.createCommentReplyController);
postRouterV1.get('/:postId/comments', auth, validateRequest(validation.listCommentsSchema), controllers.listCommentsController);

postRouterV1.put('/comments/:commentId', auth, validateRequest(validation.updateCommentSchema), controllers.updateCommentController);
postRouterV1.delete('/comments/:commentId', auth, validateRequest(validation.commentIdParamSchema), controllers.deleteCommentController);

postRouterV1.post('/comments/:commentId/like', auth, validateRequest(validation.toggleCommentLikeSchema), controllers.toggleCommentLikeController);
postRouterV1.post('/comments/:commentId/report', auth, validateRequest(validation.reportCommentSchema), controllers.reportCommentController);

postRouterV1.get('/:postId', optionalAuth, validateRequest(validation.postIdParamSchema), controllers.getPostController);

