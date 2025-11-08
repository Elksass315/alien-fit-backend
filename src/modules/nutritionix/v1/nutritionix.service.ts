import axios from 'axios';
import { env } from '../../../config/env.js';
import { HttpResponseError } from '../../../utils/appError.js';

const NUTRITIONIX_BASE_URL = 'https://trackapi.nutritionix.com';

interface NutritionixHeaders {
    'Content-Type': string;
    'x-app-id': string;
    'x-app-key': string;
    [key: string]: string;
}

class NutritionixService {
    private headers: NutritionixHeaders;

    constructor() {
        this.headers = {
            'Content-Type': 'application/json',
            'x-app-id': env.NUTRITIONIX_APP_ID,
            'x-app-key': env.NUTRITIONIX_APP_KEY,
        };
    }

    /**
     * Natural Language for Nutrients
     * Parse natural language requests like "1 cup flour, 1 pinch of salt, and 1 cup butter"
     * POST /v2/natural/nutrients
     */
    async getNaturalNutrients(query: string, timezone?: string, consumed_at?: string) {
        try {
            const response = await axios.post(
                `${NUTRITIONIX_BASE_URL}/v2/natural/nutrients`,
                {
                    query,
                    timezone,
                    consumed_at,
                },
                {
                    headers: this.headers,
                }
            );

            return response.data;
        } catch (error: any) {
            console.log(error);
            if (error.response) {
                throw new HttpResponseError(
                    error.response.status,
                    error.response.data?.message || 'Failed to fetch nutrients data'
                );
            }
            throw new HttpResponseError(500, 'Failed to connect to Nutritionix API');
        }
    }

    /**
     * Natural Language for Exercise
     * Parse requests like "30 minutes yoga" and calculate the calories burned
     * POST /v2/natural/exercise
     */
    async getNaturalExercise(
        query: string,
        gender?: 'male' | 'female',
        weight_kg?: number,
        height_cm?: number,
        age?: number
    ) {
        try {
            const response = await axios.post(
                `${NUTRITIONIX_BASE_URL}/v2/natural/exercise`,
                {
                    query,
                    gender,
                    weight_kg,
                    height_cm,
                    age,
                },
                {
                    headers: this.headers,
                }
            );

            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new HttpResponseError(
                    error.response.status,
                    error.response.data?.message || 'Failed to fetch exercise data'
                );
            }
            throw new HttpResponseError(500, 'Failed to connect to Nutritionix API');
        }
    }

    /**
     * Instant Endpoint
     * Provides fast results for autocomplete text box interfaces
     * GET /v2/search/instant
     */
    async searchInstant(
        query: string,
        common?: boolean,
        branded?: boolean,
        detailed?: boolean,
        self?: boolean
    ) {
        try {
            const params: any = { query };
            if (common !== undefined) params.common = common;
            if (branded !== undefined) params.branded = branded;
            if (detailed !== undefined) params.detailed = detailed;
            if (self !== undefined) params.self = self;

            const response = await axios.get(`${NUTRITIONIX_BASE_URL}/v2/search/instant`, {
                headers: this.headers,
                params,
            });

            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new HttpResponseError(
                    error.response.status,
                    error.response.data?.message || 'Failed to search foods'
                );
            }
            throw new HttpResponseError(500, 'Failed to connect to Nutritionix API');
        }
    }

    /**
     * Search-Item Endpoint
     * Powers UPC Lookup or get nutrition information for any branded food item
     * GET /v2/search/item
     */
    async searchItem(nix_item_id?: string, upc?: string) {
        try {
            if (!nix_item_id && !upc) {
                throw new HttpResponseError(400, 'Either nix_item_id or upc is required');
            }

            const params: any = {};
            if (nix_item_id) params.nix_item_id = nix_item_id;
            if (upc) params.upc = upc;

            const response = await axios.get(`${NUTRITIONIX_BASE_URL}/v2/search/item`, {
                headers: this.headers,
                params,
            });

            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new HttpResponseError(
                    error.response.status,
                    error.response.data?.message || 'Failed to fetch item data'
                );
            }
            throw new HttpResponseError(500, 'Failed to connect to Nutritionix API');
        }
    }
}

export default new NutritionixService();
