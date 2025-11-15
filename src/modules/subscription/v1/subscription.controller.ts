import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserEntity } from '../../user/v1/entity/user.entity.js';
import { SubscriptionService } from './subscription.service.js';
import type {
    ActivateSubscriptionPayload,
    CompleteDietPayload,
    CompleteTrainingPayload,
    ExtraLogPayload,
    PlanRequestListOptions,
    PlanUpdateRequestPayload,
    RenewSubscriptionPayload,
    ResolvePlanRequestPayload,
    UpsertPlanPayload,
} from './subscription.service.js';

export async function activateSubscriptionController(req: Request, res: Response) {
    const adminId = (req.user as UserEntity).id.toString();
    const { userId } = req.params;
    const payload = req.body as ActivateSubscriptionPayload;
    const snapshot = await SubscriptionService.activateSubscription(adminId, userId, payload);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function renewSubscriptionController(req: Request, res: Response) {
    const adminId = (req.user as UserEntity).id.toString();
    const { userId } = req.params;
    const payload = req.body as RenewSubscriptionPayload;
    const snapshot = await SubscriptionService.renewSubscription(adminId, userId, payload);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function upsertCyclePlanController(req: Request, res: Response) {
    const adminId = (req.user as UserEntity).id.toString();
    const { userId, cycleId } = req.params;
    const payload = req.body as UpsertPlanPayload;
    const snapshot = await SubscriptionService.upsertCyclePlan(adminId, userId, cycleId, payload);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function getSubscriptionForUserController(req: Request, res: Response) {
    const { userId } = req.params;
    const snapshot = await SubscriptionService.getSubscriptionSnapshotForUser(userId);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function getMySubscriptionController(req: Request, res: Response) {
    const userId = (req.user as UserEntity).id.toString();
    const snapshot = await SubscriptionService.getSubscriptionSnapshotForUser(userId);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function completeTrainingItemController(req: Request, res: Response) {
    const userId = (req.user as UserEntity).id.toString();
    const { trainingItemId } = req.params;
    const payload = req.body as CompleteTrainingPayload;
    const snapshot = await SubscriptionService.completeTrainingItem(userId, trainingItemId, payload);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function completeDietItemController(req: Request, res: Response) {
    const userId = (req.user as UserEntity).id.toString();
    const { dietItemId } = req.params;
    const payload = req.body as CompleteDietPayload;
    const snapshot = await SubscriptionService.completeDietItem(userId, dietItemId, payload);
    res.status(StatusCodes.OK).json({ status: 'success', data: snapshot });
}

export async function logExtraActivityController(req: Request, res: Response) {
    const userId = (req.user as UserEntity).id.toString();
    const payload = req.body as ExtraLogPayload;
    const entry = await SubscriptionService.logExtraActivity(userId, payload);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: entry });
}

export async function createPlanUpdateRequestController(req: Request, res: Response) {
    const userId = (req.user as UserEntity).id.toString();
    const payload = req.body as PlanUpdateRequestPayload;
    const entry = await SubscriptionService.createPlanUpdateRequest(userId, payload);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: entry });
}

export async function resolvePlanUpdateRequestController(req: Request, res: Response) {
    const adminId = (req.user as UserEntity).id.toString();
    const { requestId } = req.params;
    const payload = req.body as ResolvePlanRequestPayload;
    const entry = await SubscriptionService.resolvePlanUpdateRequest(adminId, requestId, payload);
    res.status(StatusCodes.OK).json({ status: 'success', data: entry });
}

export async function listPlanUpdateRequestsController(req: Request, res: Response) {
    const options = {
        status: req.query.status as PlanRequestListOptions['status'],
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
    } satisfies PlanRequestListOptions;

    const result = await SubscriptionService.listPlanUpdateRequests(options);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
}
