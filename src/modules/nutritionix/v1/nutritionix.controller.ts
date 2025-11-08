import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import nutritionixService from './nutritionix.service.js';

/**
 * Natural Language for Nutrients Controller
 * POST /api/v1/nutritionix/nutrients
 */
export async function getNaturalNutrientsController(req: Request, res: Response): Promise<void> {
    const { query, timezone, consumed_at } = req.body;

    const data = await nutritionixService.getNaturalNutrients(query, timezone, consumed_at);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

/**
 * Natural Language for Exercise Controller
 * POST /api/v1/nutritionix/exercise
 */
export async function getNaturalExerciseController(req: Request, res: Response): Promise<void> {
    const { query, gender, weight_kg, height_cm, age } = req.body;

    const data = await nutritionixService.getNaturalExercise(query, gender, weight_kg, height_cm, age);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

/**
 * Instant Search Controller
 * GET /api/v1/nutritionix/search/instant
 */
export async function searchInstantController(req: Request, res: Response): Promise<void> {
    const { query, common, branded, detailed, self } = req.query;

    const data = await nutritionixService.searchInstant(
        query as string,
        common === 'true',
        branded === 'true',
        detailed === 'true',
        self === 'true'
    );

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}

/**
 * Search Item Controller
 * GET /api/v1/nutritionix/search/item
 */
export async function searchItemController(req: Request, res: Response): Promise<void> {
    const { nix_item_id, upc } = req.query;

    const data = await nutritionixService.searchItem(nix_item_id as string, upc as string);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data,
    });
}
