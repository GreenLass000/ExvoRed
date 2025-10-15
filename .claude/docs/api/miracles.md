# Miracles API Contract

## Overview
API for managing unique miracle types referenced by exvotos.

## Base URL
`/api/miracles`

## Authentication
None (development). All endpoints are publicly accessible.

## Endpoints

### GET /api/miracles
List all miracles.

Response 200:
```json
[
  { "id": 1, "name": "Curación", "updated_at": "2025-09-01T10:00:00.000Z" }
]
```

### GET /api/miracles/:id
Fetch a miracle by ID.

Response 200:
```json
{ "id": 1, "name": "Curación", "updated_at": "2025-09-01T10:00:00.000Z" }
```

404 Not Found:
```json
{ "error": "Miracle not found" }
```

### POST /api/miracles
Create a miracle.

Request Body:
```json
{ "name": "Curación" }
```

Response 201: Created miracle.

### PUT /api/miracles/:id
Update a miracle.

Request Body:
```json
{ "name": "Protección" }
```

Response 200: Updated miracle.

### DELETE /api/miracles/:id
Delete a miracle.

Response 200:
```json
{ "message": "Miracle deleted successfully" }
```

## Notes
- `name` is required for create/update.
- `updated_at` is managed server-side when mutations happen.

## Error Handling
- 400 Bad Request: missing name on create/update
- 404 Not Found: resource not found
- 500 Internal Server Error: unexpected failures

