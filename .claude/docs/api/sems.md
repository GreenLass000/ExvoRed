# SEMs API Contract

## Overview
API for managing Sanctuaries/Ermitas/Museums (SEMs). Provides CRUD endpoints for SEM records.

## Base URL
`/api/sems`

## Authentication
None (development). All endpoints are publicly accessible.

## Endpoints

### GET /api/sems
Returns a list of SEMs.

Response 200:
```json
[
  {
    "id": 1,
    "name": "Virgen de ...",
    "region": "Andalucía",
    "province": "Sevilla",
    "town": "Écija",
    "associated_divinity": "Virgen X",
    "festivity": "15-08",
    "pictorial_exvoto_count": 12,
    "oldest_exvoto_date": "1650-01-01",
    "newest_exvoto_date": "1879-12-31",
    "other_exvotos": null,
    "numero_exvotos": 12,
    "comments": null,
    "references": null,
    "contact": null,
    "updated_at": "2025-09-01T10:00:00.000Z"
  }
]
```

### GET /api/sems/:id
Fetch a single SEM by ID.

Response 200: Same shape as list item above.

404 Not Found:
```json
{ "error": "SEM not found" }
```

### POST /api/sems
Create a SEM.

Request Body:
```json
{
  "name": "Virgen de ...",
  "region": "Andalucía",
  "province": "Sevilla",
  "town": "Écija",
  "associated_divinity": "Virgen X",
  "festivity": "15-08",
  "pictorial_exvoto_count": 12,
  "oldest_exvoto_date": "1650-01-01",
  "newest_exvoto_date": "1879-12-31",
  "other_exvotos": null,
  "numero_exvotos": 12,
  "comments": null,
  "references": null,
  "contact": null
}
```

Response 201: Created SEM (with `id` and possibly `updated_at`).

### PUT /api/sems/:id
Update a SEM. Body supports partial fields; only provided fields are updated.

Response 200: Updated SEM.

404 Not Found / 400 Bad Request as applicable.

### DELETE /api/sems/:id
Delete a SEM.

Response 200:
```json
{ "message": "SEM deleted successfully" }
```

## Notes
- Dates are ISO strings (YYYY-MM-DD). Manual entry is expected in the UI.
- `updated_at` is managed server-side when mutations happen.

## Error Handling
- 400 Bad Request: validation errors (when applicable)
- 404 Not Found: missing resource
- 500 Internal Server Error: unexpected failures

