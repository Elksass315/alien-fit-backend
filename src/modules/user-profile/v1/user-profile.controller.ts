import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { UserProfileService } from './user-profile.service.js';

export async function getUserProfileController(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId || req.user.id;
  const profile = await UserProfileService.getUserProfile(userId);
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: { profile }
  });
}

export async function createOrUpdateUserProfileController(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId || req.user.id;
  const { profile, isProfileComplete } = await UserProfileService.createOrUpdateUserProfile(userId, req.body);
  
  res.status(StatusCodes.CREATED).json({
    status: 'success',
    data: { 
      profile,
      isProfileComplete
    }
  });
}

export async function deleteUserProfileController(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId || req.user.id;
  const profile = await UserProfileService.deleteUserProfile(userId);
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: { profile }
  });
}