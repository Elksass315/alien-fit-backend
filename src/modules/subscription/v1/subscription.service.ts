import { Transaction } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import { sequelize } from '../../../database/db-config.js';
import { HttpResponseError } from '../../../utils/appError.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';
import { UserSubscriptionEntity } from './entity/user-subscription.entity.js';
import { UserSubscriptionCycleEntity } from './entity/user-subscription-cycle.entity.js';
import { UserSubscriptionDayEntity } from './entity/user-subscription-day.entity.js';
import { UserSubscriptionTrainingItemEntity } from './entity/user-subscription-training-item.entity.js';
import { UserSubscriptionDietItemEntity } from './entity/user-subscription-diet-item.entity.js';
import { UserSubscriptionTrainingProgressEntity } from './entity/user-subscription-training-progress.entity.js';
import { UserSubscriptionDietProgressEntity } from './entity/user-subscription-diet-progress.entity.js';
import { UserSubscriptionDayProgressEntity } from './entity/user-subscription-day-progress.entity.js';
import { UserSubscriptionExtraLogEntity } from './entity/user-subscription-extra-log.entity.js';
import { UserSubscriptionPlanRequestEntity } from './entity/user-subscription-plan-request.entity.js';
import {
    ExtraLogType,
    ExtraLogTypeValue,
    MealTypeValue,
    PlanRequestStatus,
    PlanRequestStatusValue,
    SubscriptionCycleStatus,
    SubscriptionCycleStatusValue,
    SubscriptionStatus,
} from './subscription.enums.js';

interface ActivateSubscriptionPayload {
    startDate?: Date | string;
    cycleLengthWeeks?: number;
    notes?: string | null;
}

interface RenewSubscriptionPayload extends ActivateSubscriptionPayload { }

interface TrainingItemInput {
    title: string;
    videoUrl?: string | null;
    description?: string | null;
    durationMinutes?: number | null;
    repeatCount?: number | null;
    isSuperset?: boolean;
    supersetKey?: string | null;
    restSeconds?: number | null;
    metadata?: Record<string, unknown> | null;
}

interface TrainingDayInput {
    dayOfWeek: number;
    isRestDay?: boolean;
    notes?: string | null;
    items?: TrainingItemInput[];
}

interface DietItemInput {
    mealType: MealTypeValue;
    foodName: string;
    quantity?: string | null;
    unit?: string | null;
    notes?: string | null;
    calories?: number | null;
    order?: number | null;
}

interface DietDayInput {
    dayOfWeek: number;
    notes?: string | null;
    meals?: DietItemInput[];
}

interface UpsertPlanPayload {
    training?: {
        days: TrainingDayInput[];
    };
    diet?: {
        days: DietDayInput[];
    };
}

interface CompleteTrainingPayload {
    notes?: string | null;
}

interface CompleteDietPayload {
    notes?: string | null;
}

interface ExtraLogPayload {
    type: ExtraLogTypeValue;
    payload?: Record<string, unknown> | null;
    cycleId?: string | null;
    dayId?: string | null;
    loggedAt?: Date | string;
}

interface PlanUpdateRequestPayload {
    notes?: string | null;
}

interface ResolvePlanRequestPayload {
    status: PlanRequestStatusValue;
    notes?: string | null;
}

interface PlanRequestListOptions {
    status?: PlanRequestStatusValue;
    page?: number;
    limit?: number;
}

type DayPlanPayload = {
    cycleId: string;
    weekIndex: number;
    dayIndex: number;
    plannedDate: Date;
    isRestDay: boolean;
    notes: string | null;
};

type SubscriptionSnapshot = {
    subscription: any;
    activeCycle: any | null;
    progressSummary: {
        totalTrainingItems: number;
        completedTrainingItems: number;
        totalDietItems: number;
        completedDietItems: number;
        totalDays: number;
        completedDays: number;
    };
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class SubscriptionService {
    static async activateSubscription(adminId: string, userId: string, payload: ActivateSubscriptionPayload = {}) {
        const user = await UserEntity.findByPk(userId);
        if (!user) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User not found');
        }

        const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
        if (Number.isNaN(startDate.getTime())) {
            throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid subscription start date');
        }

        const cycleLengthWeeks = payload.cycleLengthWeeks && payload.cycleLengthWeeks > 0 ? payload.cycleLengthWeeks : 4;

        const transaction = await sequelize.transaction();
        try {
            let subscription = await UserSubscriptionEntity.findOne({ where: { userId }, transaction, lock: Transaction.LOCK.UPDATE });

            if (subscription && subscription.status === SubscriptionStatus.ACTIVE) {
                throw new HttpResponseError(StatusCodes.CONFLICT, 'Subscription is already active');
            }

            if (!subscription) {
                subscription = await UserSubscriptionEntity.create(
                    {
                        userId,
                        status: SubscriptionStatus.PENDING,
                        cycleLengthWeeks,
                    },
                    { transaction }
                );
            }

            await UserSubscriptionCycleEntity.update(
                { status: SubscriptionCycleStatus.COMPLETED },
                { where: { subscriptionId: subscription.id, status: SubscriptionCycleStatus.ACTIVE }, transaction }
            );

            const cycleNumber = subscription.currentCycleNumber + 1;
            const endDate = addDays(startDate, cycleLengthWeeks * 7);

            const cycle = await UserSubscriptionCycleEntity.create(
                {
                    subscriptionId: subscription.id,
                    cycleNumber,
                    status: SubscriptionCycleStatus.ACTIVE,
                    startsAt: startDate,
                    endsAt: endDate,
                    profileUpdateDueAt: startDate,
                    notes: payload.notes ?? null,
                    renewedById: adminId,
                },
                { transaction }
            );

            await subscription.update(
                {
                    status: SubscriptionStatus.ACTIVE,
                    cycleLengthWeeks,
                    currentCycleNumber: cycleNumber,
                    currentCycleStartsAt: startDate,
                    currentCycleEndsAt: endDate,
                    nextRenewalAt: endDate,
                    lastRenewedAt: new Date(),
                    activatedById: adminId,
                    renewedById: adminId,
                },
                { transaction }
            );

            await UserSubscriptionPlanRequestEntity.update(
                {
                    status: PlanRequestStatus.APPROVED,
                    handledAt: new Date(),
                    handledById: adminId,
                },
                {
                    where: { userId, status: PlanRequestStatus.PENDING },
                    transaction,
                }
            );

            await user.update(
                {
                    isSubscribed: true,
                    profileUpdateDueAt: startDate,
                },
                { transaction }
            );

            await transaction.commit();
            return this.getSubscriptionSnapshotForUser(userId, cycle.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async renewSubscription(adminId: string, userId: string, payload: RenewSubscriptionPayload = {}) {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Subscription not found');
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Subscription is not active');
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Subscription is not active');
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Subscription is not active');
        }

        const currentCycle = await UserSubscriptionCycleEntity.findOne({
            where: { subscriptionId: subscription.id, status: SubscriptionCycleStatus.ACTIVE },
            order: [['cycleNumber', 'DESC']],
        });

        if (!currentCycle) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Active cycle not found for renewal');
        }

        const defaultStart = addDays(currentCycle.endsAt, 1);
        const startDate = payload.startDate ? new Date(payload.startDate) : defaultStart;
        if (Number.isNaN(startDate.getTime())) {
            throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid renewal start date');
        }

        const cycleLengthWeeks = payload.cycleLengthWeeks && payload.cycleLengthWeeks > 0 ? payload.cycleLengthWeeks : subscription.cycleLengthWeeks;
        const endDate = addDays(startDate, cycleLengthWeeks * 7);

        const transaction = await sequelize.transaction();
        try {
            await currentCycle.update({ status: SubscriptionCycleStatus.COMPLETED }, { transaction });

            const nextCycleNumber = currentCycle.cycleNumber + 1;
            const newCycle = await UserSubscriptionCycleEntity.create(
                {
                    subscriptionId: subscription.id,
                    cycleNumber: nextCycleNumber,
                    status: SubscriptionCycleStatus.ACTIVE,
                    startsAt: startDate,
                    endsAt: endDate,
                    profileUpdateDueAt: startDate,
                    notes: payload.notes ?? null,
                    renewedById: adminId,
                },
                { transaction }
            );

            await subscription.update(
                {
                    cycleLengthWeeks,
                    currentCycleNumber: nextCycleNumber,
                    currentCycleStartsAt: startDate,
                    currentCycleEndsAt: endDate,
                    nextRenewalAt: endDate,
                    lastRenewedAt: new Date(),
                    renewedById: adminId,
                },
                { transaction }
            );

            await UserSubscriptionPlanRequestEntity.update(
                {
                    status: PlanRequestStatus.APPROVED,
                    handledAt: new Date(),
                    handledById: adminId,
                },
                {
                    where: { userId, status: PlanRequestStatus.PENDING },
                    transaction,
                }
            );

            await UserEntity.update(
                {
                    isSubscribed: true,
                    profileUpdateDueAt: startDate,
                },
                { where: { id: userId }, transaction }
            );

            await transaction.commit();
            return this.getSubscriptionSnapshotForUser(userId, newCycle.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async upsertCyclePlan(adminId: string, userId: string, cycleId: string, payload: UpsertPlanPayload) {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Subscription not found');
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Subscription is not active');
        }

        const cycle = await UserSubscriptionCycleEntity.findByPk(cycleId);
        if (!cycle || cycle.subscriptionId !== subscription.id) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Subscription cycle not found');
        }

        const transaction = await sequelize.transaction();
        try {
            await UserSubscriptionDayEntity.destroy({ where: { cycleId: cycle.id }, transaction });

            const trainingTemplate = buildTrainingTemplateMap(payload.training?.days ?? []);
            const dietTemplate = buildDietTemplateMap(payload.diet?.days ?? []);

            const daysPayload: DayPlanPayload[] = [];
            const cycleLengthWeeks = subscription.cycleLengthWeeks;

            for (let weekIndex = 0; weekIndex < cycleLengthWeeks; weekIndex += 1) {
                for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
                    const dayKey = dayIndex + 1;
                    const trainingDay = trainingTemplate.get(dayKey) ?? null;
                    const dietDay = dietTemplate.get(dayKey) ?? null;
                    const isRestDay = Boolean(trainingDay?.isRestDay) || (trainingDay?.items?.length ?? 0) === 0;
                    const notes = trainingDay?.notes ?? dietDay?.notes ?? null;
                    const plannedDate = addDays(cycle.startsAt, weekIndex * 7 + dayIndex);
                    daysPayload.push({
                        cycleId: cycle.id,
                        weekIndex,
                        dayIndex,
                        plannedDate,
                        isRestDay,
                        notes,
                    });
                }
            }

            const createdDays = await UserSubscriptionDayEntity.bulkCreate(daysPayload, {
                transaction,
                returning: true,
            });

            const dayLookup = new Map<string, UserSubscriptionDayEntity>();
            for (const day of createdDays) {
                dayLookup.set(`${day.weekIndex}-${day.dayIndex}`, day);
            }

            const trainingItemsPayload: any[] = [];
            const dietItemsPayload: any[] = [];

            for (let weekIndex = 0; weekIndex < cycleLengthWeeks; weekIndex += 1) {
                for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
                    const templateIndex = dayIndex + 1;
                    const day = dayLookup.get(`${weekIndex}-${dayIndex}`);
                    if (!day) continue;

                    const trainingDay = trainingTemplate.get(templateIndex) ?? null;
                    const dayItems = trainingDay?.items ?? [];
                    dayItems.forEach((item, order) => {
                        trainingItemsPayload.push({
                            dayId: day.id,
                            order,
                            title: item.title,
                            videoUrl: item.videoUrl ?? null,
                            description: item.description ?? null,
                            durationMinutes: item.durationMinutes ?? null,
                            repeatCount: item.repeatCount ?? null,
                            isSuperset: Boolean(item.isSuperset),
                            supersetKey: item.supersetKey ?? null,
                            restSeconds: item.restSeconds ?? null,
                            metadata: item.metadata ?? null,
                        });
                    });

                    const dietDay = dietTemplate.get(templateIndex) ?? null;
                    const dayMeals = dietDay?.meals ?? [];
                    dayMeals.forEach((meal, order) => {
                        dietItemsPayload.push({
                            dayId: day.id,
                            mealType: meal.mealType,
                            foodName: meal.foodName,
                            quantity: meal.quantity ?? null,
                            unit: meal.unit ?? null,
                            notes: meal.notes ?? null,
                            calories: meal.calories ?? null,
                            order: meal.order ?? order,
                        });
                    });
                }
            }

            if (trainingItemsPayload.length) {
                await UserSubscriptionTrainingItemEntity.bulkCreate(trainingItemsPayload, { transaction });
            }
            if (dietItemsPayload.length) {
                await UserSubscriptionDietItemEntity.bulkCreate(dietItemsPayload, { transaction });
            }

            await transaction.commit();
            return this.getSubscriptionSnapshotForUser(userId, cycleId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getSubscriptionSnapshotForUser(userId: string, focusCycleId?: string | null): Promise<SubscriptionSnapshot | null> {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            return null;
        }

        const cycleWhere: any = { subscriptionId: subscription.id };
        if (focusCycleId) {
            cycleWhere.id = focusCycleId;
        } else {
            cycleWhere.status = SubscriptionCycleStatus.ACTIVE;
        }

        const cycle = await UserSubscriptionCycleEntity.findOne({
            where: cycleWhere,
            order: [['cycleNumber', 'DESC']],
            include: [
                {
                    model: UserSubscriptionDayEntity,
                    as: 'days',
                    include: [
                        { model: UserSubscriptionTrainingItemEntity, as: 'trainingItems' },
                        { model: UserSubscriptionDietItemEntity, as: 'dietItems' },
                        { model: UserSubscriptionDayProgressEntity, as: 'progressEntries' },
                    ],
                },
                { model: UserSubscriptionTrainingProgressEntity, as: 'trainingProgressEntries' },
                { model: UserSubscriptionDietProgressEntity, as: 'dietProgressEntries' },
            ],
        });

        const subscriptionJson = subscription.get({ plain: true });
        const snapshot: SubscriptionSnapshot = {
            subscription: subscriptionJson,
            activeCycle: null,
            progressSummary: {
                totalTrainingItems: 0,
                completedTrainingItems: 0,
                totalDietItems: 0,
                completedDietItems: 0,
                totalDays: 0,
                completedDays: 0,
            },
        };

        if (!cycle) {
            return snapshot;
        }

        const cycleJson = cycle.get({ plain: true }) as any;

        const trainingProgressMap = new Map<string, any>();
        (cycleJson.trainingProgressEntries ?? []).forEach((entry) => {
            trainingProgressMap.set(entry.trainingItemId, entry);
        });

        const dietProgressMap = new Map<string, any>();
        (cycleJson.dietProgressEntries ?? []).forEach((entry) => {
            dietProgressMap.set(entry.dietItemId, entry);
        });

        const dayProgressMap = new Map<string, any>();
        (cycleJson.days ?? []).forEach((day) => {
            (day.progressEntries ?? []).forEach((entry) => {
                dayProgressMap.set(entry.dayId, entry);
            });
        });

        const weeks: any[] = [];

        const daysSorted = (cycleJson.days ?? []).sort((a, b) => {
            if (a.weekIndex === b.weekIndex) {
                return a.dayIndex - b.dayIndex;
            }
            return a.weekIndex - b.weekIndex;
        });

        for (let weekIndex = 0; weekIndex < subscription.cycleLengthWeeks; weekIndex += 1) {
            const weekDays = daysSorted.filter((day) => day.weekIndex === weekIndex);
            const formattedDays = weekDays.map((day) => {
                const progress = dayProgressMap.get(day.id) ?? null;
                const trainingItems = (day.trainingItems ?? []).map((item) => {
                    const progressEntry = trainingProgressMap.get(item.id) ?? null;
                    if (progressEntry) {
                        snapshot.progressSummary.completedTrainingItems += 1;
                    }
                    snapshot.progressSummary.totalTrainingItems += 1;
                    return {
                        id: item.id,
                        order: item.order,
                        title: item.title,
                        videoUrl: item.videoUrl,
                        description: item.description,
                        durationMinutes: item.durationMinutes,
                        repeatCount: item.repeatCount,
                        isSuperset: item.isSuperset,
                        supersetKey: item.supersetKey,
                        restSeconds: item.restSeconds,
                        metadata: item.metadata,
                        completedAt: progressEntry?.completedAt ?? null,
                        notes: progressEntry?.notes ?? null,
                    };
                });

                const dietItems = (day.dietItems ?? []).map((item) => {
                    const progressEntry = dietProgressMap.get(item.id) ?? null;
                    if (progressEntry) {
                        snapshot.progressSummary.completedDietItems += 1;
                    }
                    snapshot.progressSummary.totalDietItems += 1;
                    return {
                        id: item.id,
                        mealType: item.mealType,
                        foodName: item.foodName,
                        quantity: item.quantity,
                        unit: item.unit,
                        notes: item.notes,
                        calories: item.calories,
                        order: item.order,
                        completedAt: progressEntry?.completedAt ?? null,
                        progressNotes: progressEntry?.notes ?? null,
                    };
                });

                snapshot.progressSummary.totalDays += 1;
                const isDayCompleted = progress?.trainingCompleted && progress?.dietCompleted;
                if (isDayCompleted) {
                    snapshot.progressSummary.completedDays += 1;
                }

                return {
                    id: day.id,
                    weekIndex: day.weekIndex,
                    dayIndex: day.dayIndex,
                    plannedDate: day.plannedDate,
                    isRestDay: day.isRestDay,
                    notes: day.notes,
                    progress: progress
                        ? {
                            trainingCompleted: progress.trainingCompleted,
                            dietCompleted: progress.dietCompleted,
                            completedAt: progress.completedAt,
                        }
                        : {
                            trainingCompleted: false,
                            dietCompleted: false,
                            completedAt: null,
                        },
                    trainingItems,
                    dietItems,
                };
            });

            if (formattedDays.length) {
                const weekStartDate = formattedDays[0].plannedDate ?? addDays(cycle.startsAt, weekIndex * 7);
                weeks.push({
                    index: weekIndex,
                    startDate: weekStartDate,
                    days: formattedDays,
                });
            }
        }

        delete cycleJson.trainingProgressEntries;
        delete cycleJson.dietProgressEntries;

        snapshot.activeCycle = {
            ...cycleJson,
            weeks,
        };

        return snapshot;
    }

    static async completeTrainingItem(userId: string, trainingItemId: string, payload: CompleteTrainingPayload = {}) {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Subscription not found');
        }

        const trainingItem = await UserSubscriptionTrainingItemEntity.findByPk(trainingItemId);

        if (!trainingItem) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Training item not found');
        }

        const day = await UserSubscriptionDayEntity.findByPk(trainingItem.dayId);
        if (!day) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Training day not found');
        }

        const cycle = await UserSubscriptionCycleEntity.findByPk(day.cycleId);

        if (!cycle || cycle.subscriptionId !== subscription.id) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'Training item does not belong to the user');
        }

        if (cycle.status !== SubscriptionCycleStatus.ACTIVE) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Cannot update training item for inactive cycle');
        }

        const transaction = await sequelize.transaction();
        try {
            const [progress, created] = await UserSubscriptionTrainingProgressEntity.findOrCreate({
                where: { userId, trainingItemId },
                defaults: {
                    cycleId: cycle.id,
                    dayId: day.id,
                    completedAt: new Date(),
                    notes: payload.notes ?? null,
                },
                transaction,
            });

            if (!created) {
                await progress.update(
                    {
                        completedAt: new Date(),
                        notes: payload.notes ?? null,
                    },
                    { transaction }
                );
            }

            await this.refreshDayProgress(userId, cycle.id, day.id, transaction);

            await transaction.commit();
            return this.getSubscriptionSnapshotForUser(userId, cycle.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async completeDietItem(userId: string, dietItemId: string, payload: CompleteDietPayload = {}) {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Subscription not found');
        }

        const dietItem = await UserSubscriptionDietItemEntity.findByPk(dietItemId);

        if (!dietItem) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Diet item not found');
        }

        const day = await UserSubscriptionDayEntity.findByPk(dietItem.dayId);
        if (!day) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Diet day not found');
        }

        const cycle = await UserSubscriptionCycleEntity.findByPk(day.cycleId);

        if (!cycle || cycle.subscriptionId !== subscription.id) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'Diet item does not belong to the user');
        }

        if (cycle.status !== SubscriptionCycleStatus.ACTIVE) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Cannot update diet item for inactive cycle');
        }

        const transaction = await sequelize.transaction();
        try {
            const [progress, created] = await UserSubscriptionDietProgressEntity.findOrCreate({
                where: { userId, dietItemId },
                defaults: {
                    cycleId: cycle.id,
                    dayId: day.id,
                    completedAt: new Date(),
                    notes: payload.notes ?? null,
                },
                transaction,
            });

            if (!created) {
                await progress.update(
                    {
                        completedAt: new Date(),
                        notes: payload.notes ?? null,
                    },
                    { transaction }
                );
            }

            await this.refreshDayProgress(userId, cycle.id, day.id, transaction);

            await transaction.commit();
            return this.getSubscriptionSnapshotForUser(userId, cycle.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async logExtraActivity(userId: string, payload: ExtraLogPayload) {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Subscription not found');
        }

        let cycleId: string | null = payload.cycleId ?? null;
        let dayId: string | null = payload.dayId ?? null;

        if (dayId) {
            const day = await UserSubscriptionDayEntity.findByPk(dayId);
            if (!day) {
                throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid day reference');
            }
            const cycle = await UserSubscriptionCycleEntity.findByPk(day.cycleId);
            if (!cycle || cycle.subscriptionId !== subscription.id) {
                throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid day reference');
            }
            cycleId = cycle.id;
        } else if (cycleId) {
            const cycle = await UserSubscriptionCycleEntity.findByPk(cycleId);
            if (!cycle || cycle.subscriptionId !== subscription.id) {
                throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid cycle reference');
            }
        } else {
            const activeCycle = await UserSubscriptionCycleEntity.findOne({
                where: { subscriptionId: subscription.id, status: SubscriptionCycleStatus.ACTIVE },
                order: [['cycleNumber', 'DESC']],
            });
            cycleId = activeCycle?.id ?? null;
        }

        const loggedAt = payload.loggedAt ? new Date(payload.loggedAt) : new Date();
        if (Number.isNaN(loggedAt.getTime())) {
            throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid log date');
        }

        const entry = await UserSubscriptionExtraLogEntity.create({
            userId,
            subscriptionId: subscription.id,
            cycleId,
            dayId,
            type: payload.type,
            payload: payload.payload ?? null,
            loggedAt,
        });

        return entry.get({ plain: true });
    }

    static async recordProfileUpdate(userId: string, updatedAt: Date, nextDueAt: Date) {
        const subscription = await UserSubscriptionEntity.findOne({ where: { userId } });
        if (!subscription) {
            return;
        }

        const activeCycle = await UserSubscriptionCycleEntity.findOne({
            where: { subscriptionId: subscription.id, status: SubscriptionCycleStatus.ACTIVE },
            order: [['cycleNumber', 'DESC']],
        });

        if (!activeCycle) {
            await UserSubscriptionEntity.update(
                { nextRenewalAt: nextDueAt },
                { where: { id: subscription.id } }
            );
            return;
        }

        await Promise.all([
            activeCycle.update({ profileUpdatedAt: updatedAt, profileUpdateDueAt: nextDueAt }),
            subscription.update({ nextRenewalAt: activeCycle.endsAt }),
        ]);
    }

    static async createPlanUpdateRequest(userId: string, payload: PlanUpdateRequestPayload = {}) {
        const activePending = await UserSubscriptionPlanRequestEntity.findOne({
            where: {
                userId,
                status: PlanRequestStatus.PENDING,
            },
        });

        if (activePending) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'There is already a pending plan update request');
        }

        const entry = await UserSubscriptionPlanRequestEntity.create({
            userId,
            status: PlanRequestStatus.PENDING,
            notes: payload.notes ?? null,
        });

        return entry.get({ plain: true });
    }

    static async resolvePlanUpdateRequest(adminId: string, requestId: string, payload: ResolvePlanRequestPayload) {
        const request = await UserSubscriptionPlanRequestEntity.findByPk(requestId);
        if (!request) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Plan update request not found');
        }

        if (request.status !== PlanRequestStatus.PENDING) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'Request was already handled');
        }

        if (payload.status !== PlanRequestStatus.APPROVED && payload.status !== PlanRequestStatus.DECLINED) {
            throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'Invalid request status transition');
        }

        await request.update({
            status: payload.status,
            handledAt: new Date(),
            handledById: adminId,
            notes: payload.notes ?? request.notes ?? null,
        });

        return request.get({ plain: true });
    }

    static async listPlanUpdateRequests(options: PlanRequestListOptions = {}) {
        const page = options.page && options.page > 0 ? options.page : 1;
        const limit = options.limit && options.limit > 0 ? options.limit : 20;
        const offset = (page - 1) * limit;

        const where: any = {};
        if (options.status) {
            where.status = options.status;
        }

        const { rows, count } = await UserSubscriptionPlanRequestEntity.findAndCountAll({
            where,
            include: [{ model: UserEntity, as: 'user' }],
            order: [['requestedAt', 'DESC']],
            offset,
            limit,
        });

        return {
            items: rows.map((row) => row.get({ plain: true })),
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit) || 1,
        };
    }

    private static async refreshDayProgress(userId: string, cycleId: string, dayId: string, transaction?: Transaction) {
        const [trainingCount, completedTrainingCount] = await Promise.all([
            UserSubscriptionTrainingItemEntity.count({ where: { dayId }, transaction }),
            UserSubscriptionTrainingProgressEntity.count({ where: { dayId, userId }, transaction }),
        ]);

        const [dietCount, completedDietCount] = await Promise.all([
            UserSubscriptionDietItemEntity.count({ where: { dayId }, transaction }),
            UserSubscriptionDietProgressEntity.count({ where: { dayId, userId }, transaction }),
        ]);

        const trainingCompleted = trainingCount === 0 || completedTrainingCount >= trainingCount;
        const dietCompleted = dietCount === 0 || completedDietCount >= dietCount;
        const completedAt = trainingCompleted && dietCompleted ? new Date() : null;

        const [progress] = await UserSubscriptionDayProgressEntity.findOrCreate({
            where: { userId, dayId },
            defaults: {
                cycleId,
                trainingCompleted,
                dietCompleted,
                completedAt,
            },
            transaction,
        });

        if (progress.trainingCompleted !== trainingCompleted || progress.dietCompleted !== dietCompleted || progress.completedAt !== completedAt) {
            await progress.update({ trainingCompleted, dietCompleted, completedAt }, { transaction });
        }
    }
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_IN_MS);
}

function buildTrainingTemplateMap(days: TrainingDayInput[]): Map<number, TrainingDayInput> {
    const map = new Map<number, TrainingDayInput>();
    days.forEach((day) => {
        if (day.dayOfWeek < 1 || day.dayOfWeek > 7) {
            return;
        }
        map.set(day.dayOfWeek, day);
    });
    return map;
}

export type {
    ActivateSubscriptionPayload,
    RenewSubscriptionPayload,
    TrainingItemInput,
    TrainingDayInput,
    DietItemInput,
    DietDayInput,
    UpsertPlanPayload,
    CompleteTrainingPayload,
    CompleteDietPayload,
    ExtraLogPayload,
    PlanUpdateRequestPayload,
    ResolvePlanRequestPayload,
    PlanRequestListOptions,
    SubscriptionSnapshot,
};

function buildDietTemplateMap(days: DietDayInput[]): Map<number, DietDayInput> {
    const map = new Map<number, DietDayInput>();
    days.forEach((day) => {
        if (day.dayOfWeek < 1 || day.dayOfWeek > 7) {
            return;
        }
        map.set(day.dayOfWeek, day);
    });
    return map;
}
