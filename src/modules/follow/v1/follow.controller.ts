import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FollowService } from './follow.service.js';

export async function toggleFollowController(req: Request, res: Response) {
    const { userId } = req.params;
    const result = await FollowService.toggleFollow(req.user!, userId);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
    });
}

export async function listFollowersController(req: Request, res: Response) {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const data = await FollowService.listFollowers(userId, req.user ?? null, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

export async function listFollowingController(req: Request, res: Response) {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const data = await FollowService.listFollowing(userId, req.user ?? null, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}
