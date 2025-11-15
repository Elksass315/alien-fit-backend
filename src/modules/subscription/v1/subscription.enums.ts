export const SubscriptionStatus = {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    PAUSED: 'PAUSED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED'
} as const;

export type SubscriptionStatusValue = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export const SubscriptionCycleStatus = {
    ACTIVE: 'ACTIVE',
    UPCOMING: 'UPCOMING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
} as const;

export type SubscriptionCycleStatusValue = typeof SubscriptionCycleStatus[keyof typeof SubscriptionCycleStatus];

export const MealType = {
    BREAKFAST: 'BREAKFAST',
    LUNCH: 'LUNCH',
    DINNER: 'DINNER',
    SNACK: 'SNACK',
    PRE_WORKOUT: 'PRE_WORKOUT',
    POST_WORKOUT: 'POST_WORKOUT'
} as const;

export type MealTypeValue = typeof MealType[keyof typeof MealType];

export const ExtraLogType = {
    TRAINING: 'TRAINING',
    FOOD: 'FOOD',
    WATER: 'WATER'
} as const;

export type ExtraLogTypeValue = typeof ExtraLogType[keyof typeof ExtraLogType];

export const PlanRequestStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    DECLINED: 'DECLINED'
} as const;

export type PlanRequestStatusValue = typeof PlanRequestStatus[keyof typeof PlanRequestStatus];
