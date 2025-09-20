import { HttpResponseError } from '../../../utils/appError.js';
import { StatusCodes } from 'http-status-codes';
import { UserProfileEntity } from './model/user-profile.model.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';
import { UserService } from '../../user/v1/user.service.js';

export class UserProfileService {
  static async getUserProfile(userId: string | number): Promise<UserProfileEntity> {
    const profile = await UserProfileEntity.findOne({ where: { userId } });
    if (!profile) {
      throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User profile not found');
    }
    return profile;
  }

  static async createOrUpdateUserProfile(userId: string | number, profileData: Partial<UserProfileEntity>): Promise<{ profile: UserProfileEntity, isProfileComplete: boolean }> {
    // Check if user exists
    await UserService.getUserById(userId);

    // Check if profile exists
    let profile = await UserProfileEntity.findOne({ where: { userId } });
    
    if (profile) {
      // Update existing profile
      await profile.update(profileData);
    } else {
      // Create new profile
      profile = await UserProfileEntity.create({
        userId,
        ...profileData
      });
    }

    // Check if profile is complete
    const isProfileComplete = this.checkProfileCompletion(profile);
    
    // Update user's isProfileComplete status if needed
    await UserEntity.update(
      { isProfileComplete },
      { where: { id: userId } }
    );

    return { profile, isProfileComplete };
  }

  static async deleteUserProfile(userId: string | number): Promise<UserProfileEntity> {
    const profile = await UserProfileEntity.findOne({ where: { userId } });
    if (!profile) {
      throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User profile not found');
    }
    
    await profile.destroy();
    
    // Update user's isProfileComplete status
    await UserEntity.update(
      { isProfileComplete: false },
      { where: { id: userId } }
    );
    
    return profile;
  }

  private static checkProfileCompletion(profile: UserProfileEntity): boolean {
    // Check if all required fields are filled
    return !!(
      profile.goal &&
      profile.activityLevel &&
      profile.bodyFat &&
      profile.intolerances &&
      profile.diseases &&
      profile.meats &&
      profile.carbs &&
      profile.fruits
    );
  }
}