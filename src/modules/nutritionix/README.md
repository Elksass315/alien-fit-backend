# Nutritionix API Module

This module integrates the Nutritionix API v2 into your application, providing access to nutrition and exercise data through four main endpoints.

## API Endpoints

All endpoints require authentication (Bearer token).

### 1. Natural Language for Nutrients
**POST** `/api/v1/nutritionix/nutrients`

Parse natural language food descriptions and get detailed nutrient information.

**Request Body:**
```json
{
  "query": "1 cup flour, 1 pinch of salt, and 1 cup butter",
  "timezone": "US/Eastern",  // Optional
  "consumed_at": "2023-09-22T18:24:59+00:00"  // Optional
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/nutritionix/nutrients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"query": "2 eggs and 1 slice of toast"}'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "foods": [
      {
        "food_name": "eggs",
        "serving_qty": 2,
        "serving_unit": "large",
        "nf_calories": 143,
        "nf_total_fat": 9.51,
        "nf_protein": 12.56,
        // ... more nutrient data
      }
    ]
  }
}
```

---

### 2. Natural Language for Exercise
**POST** `/api/v1/nutritionix/exercise`

Parse exercise descriptions and calculate calories burned.

**Request Body:**
```json
{
  "query": "ran 3 miles and did 30 minutes of yoga",
  "gender": "male",        // Optional: "male" or "female"
  "weight_kg": 70,         // Optional
  "height_cm": 175,        // Optional
  "age": 30                // Optional
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/nutritionix/exercise \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "30 minutes yoga",
    "gender": "female",
    "weight_kg": 65,
    "age": 28
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "exercises": [
      {
        "name": "yoga",
        "duration_min": 30,
        "nf_calories": 144,
        "photo": {
          "thumb": "https://...",
          "highres": "https://..."
        }
      }
    ]
  }
}
```

---

### 3. Instant Search
**GET** `/api/v1/nutritionix/search/instant`

Fast autocomplete search for foods (both common and branded).

**Query Parameters:**
- `query` (required, min 3 characters): Search term
- `common` (optional): Include common foods (true/false)
- `branded` (optional): Include branded foods (true/false)
- `detailed` (optional): Include detailed nutrient fields (true/false)
- `self` (optional): Include user-created foods (true/false)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/nutritionix/search/instant?query=hamburger" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "common": [
      {
        "food_name": "hamburger",
        "serving_unit": "sandwich",
        "tag_id": "608",
        "photo": {
          "thumb": "https://..."
        }
      }
    ],
    "branded": [
      {
        "food_name": "Hamburger",
        "brand_name": "McDonald's",
        "nf_calories": 250,
        "nix_item_id": "...",
        "photo": {
          "thumb": "https://..."
        }
      }
    ]
  }
}
```

---

### 4. Search Item
**GET** `/api/v1/nutritionix/search/item`

Get detailed nutrition information for a specific branded food item by UPC or item ID.

**Query Parameters:**
- `nix_item_id` (optional): Nutritionix item ID from instant search
- `upc` (optional): UPC barcode number

**Note:** Either `nix_item_id` or `upc` is required (at least one).

**Example Request by UPC:**
```bash
curl -X GET "http://localhost:3000/api/v1/nutritionix/search/item?upc=49000000450" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example Request by Item ID:**
```bash
curl -X GET "http://localhost:3000/api/v1/nutritionix/search/item?nix_item_id=51d2fae7cc9bff111580d8d8" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "foods": [
      {
        "food_name": "Diet Cola",
        "brand_name": "Coke",
        "serving_qty": 1,
        "serving_unit": "bottle",
        "nf_calories": 0,
        "nf_total_fat": 0,
        "nf_protein": 0,
        // ... full nutrient breakdown
        "upc": "49000000450"
      }
    ]
  }
}
```

---

## Setup

### 1. Environment Variables

Add your Nutritionix API credentials to `.env`:

```env
NUTRITIONIX_APP_ID=your_app_id_here
NUTRITIONIX_APP_KEY=your_app_key_here
```

### 2. Get API Credentials

Sign up for a free API key at [Nutritionix API](https://www.nutritionix.com/business/api)

---

## Usage Examples

### Example 1: Track a Meal
```javascript
// POST /api/v1/nutritionix/nutrients
{
  "query": "grilled chicken breast 6 oz with 1 cup steamed broccoli and 1/2 cup brown rice"
}
```

### Example 2: Log a Workout
```javascript
// POST /api/v1/nutritionix/exercise
{
  "query": "ran 5k and did 20 pushups",
  "gender": "male",
  "weight_kg": 75,
  "age": 30
}
```

### Example 3: Food Search with Autocomplete
```javascript
// GET /api/v1/nutritionix/search/instant?query=app
// Returns: apple, apple pie, apple juice, etc.
```

### Example 4: Scan Barcode
```javascript
// GET /api/v1/nutritionix/search/item?upc=012000161155
// Returns full nutrition info for that UPC product
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "message": "Error description",
  "statusCode": 400,
  "status": "fail"
}
```

Common error codes:
- `400`: Bad request (missing or invalid parameters)
- `401`: Unauthorized (missing or invalid auth token)
- `404`: Not found (item/food not found)
- `422`: Validation error
- `500`: Internal server error

---

## Features

✅ All 4 Nutritionix API endpoints integrated
✅ Full TypeScript support
✅ Request validation with Joi
✅ Authentication required
✅ Error handling
✅ Detailed API documentation

---

## API Documentation

For more details on the Nutritionix API, visit:
- [Nutritionix API Guide](https://docx.syndigo.com/developers/docs/nutritionix-api-guide)
- [Natural Language for Nutrients](https://docx.syndigo.com/developers/docs/natural-language-for-nutrients)
- [Natural Language for Exercise](https://docx.syndigo.com/developers/docs/natural-language-for-exercise)
- [Instant Endpoint](https://docx.syndigo.com/developers/docs/instant-endpoint)
- [Search Item Endpoint](https://docx.syndigo.com/developers/docs/search-item-endpoint)

---

## Module Structure

```
src/modules/nutritionix/v1/
├── nutritionix.controller.ts    # Request handlers
├── nutritionix.routes.ts        # Route definitions
├── nutritionix.service.ts       # Nutritionix API integration
└── nutritionix.validation.ts    # Request validation schemas
```
