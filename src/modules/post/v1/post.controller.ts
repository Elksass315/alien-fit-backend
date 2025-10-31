import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PostService, PostCommentService } from './post.service.js';

export async function createPostController(req: Request, res: Response) {
    const post = await PostService.createPost(req.user!, req.body);
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: { post },
    });
}

export async function getMyPostsController(req: Request, res: Response) {
    const { page, limit } = req.query;
    const data = await PostService.getMyPosts(req.user!, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function getUserPostsController(req: Request, res: Response) {
    const { page, limit } = req.query;
    const { userId } = req.params;

    const data = await PostService.getPostsByUser(userId, req.user!, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function getFeedController(req: Request, res: Response) {
    const { page, limit } = req.query;
    const data = await PostService.getFeed(req.user!, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function updatePostController(req: Request, res: Response) {
    const { postId } = req.params;
    const post = await PostService.updatePost(postId, req.user!, req.body);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: { post },
    });
}

export async function deletePostController(req: Request, res: Response) {
    const { postId } = req.params;
    const result = await PostService.deletePost(postId, req.user!);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
    });
}

export async function reportPostController(req: Request, res: Response) {
    const { postId } = req.params;
    const report = await PostService.reportPost(postId, req.user!, req.body.reason ?? req.query.reason as string);
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: { report },
    });
}

export async function togglePostLikeController(req: Request, res: Response) {
    const { postId } = req.params;
    const result = await PostService.toggleLike(postId, req.user!);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
    });
}

export async function getPostLikesController(req: Request, res: Response) {
    const { postId } = req.params;
    const { page, limit } = req.query;
    const data = await PostService.getPostLikes(postId, req.user!, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function toggleSavePostController(req: Request, res: Response) {
    const { postId } = req.params;
    const result = await PostService.toggleSave(postId, req.user!);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
    });
}

export async function getSavedPostsController(req: Request, res: Response) {
    const { page, limit } = req.query;
    const data = await PostService.getSavedPosts(req.user!, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function createCommentController(req: Request, res: Response) {
    const { postId } = req.params;
    const { content } = req.body;
    const comment = await PostCommentService.createComment(postId, req.user!, content);
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: { comment },
    });
}

export async function createCommentReplyController(req: Request, res: Response) {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const reply = await PostCommentService.createReply(postId, commentId, req.user!, content);
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: { comment: reply },
    });
}

export async function listCommentsController(req: Request, res: Response) {
    const { postId } = req.params;
    const { page, limit } = req.query;
    const data = await PostCommentService.listComments(postId, req.user!, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function updateCommentController(req: Request, res: Response) {
    const { commentId } = req.params;
    const { content } = req.body;
    const comment = await PostCommentService.updateComment(commentId, req.user!, content);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: { comment },
    });
}

export async function deleteCommentController(req: Request, res: Response) {
    const { commentId } = req.params;
    const result = await PostCommentService.deleteComment(commentId, req.user!);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
    });
}

export async function toggleCommentLikeController(req: Request, res: Response) {
    const { commentId } = req.params;
    const result = await PostCommentService.toggleLike(commentId, req.user!);
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
    });
}

export async function reportCommentController(req: Request, res: Response) {
    const { commentId } = req.params;
    const report = await PostCommentService.reportComment(commentId, req.user!, req.body.reason ?? req.query.reason as string);
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: { report },
    });
}
