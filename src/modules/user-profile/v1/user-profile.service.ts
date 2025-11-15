import { HttpResponseError } from '../../../utils/appError.js';
import { StatusCodes } from 'http-status-codes';
import { UserProfileEntity } from './model/user-profile.model.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';
import { UserService } from '../../user/v1/user.service.js';
import { MediaEntity } from '../../media/v1/model/media.model.js';
import { UserSubscriptionEntity } from '../../subscription/v1/entity/user-subscription.entity.js';
import { UserSubscriptionCycleEntity } from '../../subscription/v1/entity/user-subscription-cycle.entity.js';
import { SubscriptionCycleStatus } from '../../subscription/v1/subscription.enums.js';

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
    const user = await UserService.getUserById(userId);

    // Check if profile exists
    let profile = await UserProfileEntity.findOne({ where: { userId } });

    if (profileData.inbodyImageId !== null) {
      const media = await MediaEntity.findByPk(profileData.inbodyImageId);
      if (!media) {
        throw new HttpResponseError(StatusCodes.BAD_REQUEST, "inbodyImageId not found")
      }
    }

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
    const isProfileComplete = true

    // Update user's isProfileComplete status if needed
    const now = new Date();
    const nextDue = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    await UserEntity.update(
      {
        isProfileComplete,
        lastProfileUpdateAt: now,
        profileUpdateDueAt: user.isSubscribed ? nextDue : null,
      },
      { where: { id: userId } }
    );

    if (user.isSubscribed) {
      await recordSubscriptionProfileUpdate(userId.toString(), now, nextDue);
    }

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
}

async function recordSubscriptionProfileUpdate(userId: string, updatedAt: Date, nextDueAt: Date) {
  const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
  if (!subscription) {
    return;
  }

  const activeCycle = await UserSubscriptionCycleEntity.findOne({
    where: { subscriptionId: subscription.id, status: SubscriptionCycleStatus.ACTIVE },
    order: [['cycleNumber', 'DESC']],
  });

  if (!activeCycle) {
    return;
  }

  await Promise.all([
    activeCycle.update({ profileUpdatedAt: updatedAt, profileUpdateDueAt: nextDueAt }),
    subscription.update({ nextRenewalAt: activeCycle.endsAt }),
  ]);
}