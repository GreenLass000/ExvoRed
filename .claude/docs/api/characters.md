# Characters API Contract

## Overview
API for managing unique characters referenced by exvotos.

## Base URL
`/api/characters`

## Authentication
None (development). All endpoints are publicly accessible.

## Endpoints

### GET /api/characters
List all characters.

Response 200:
```json
[
  { "id": 1, "name": "Paciente", "updated_at": "2025-09-01T10:00:00.000Z" }
]
```

### GET /api/characters/:id
Fetch a character by ID.

Response 200:
```json
{ "id": 1, "name": "Paciente", "updated_at": "2025-09-01T10:00:00.000Z" }
```

404 Not Found:
```json
{ "error": "Character not found" }
```

### POST /api/characters
Create a character.

Request Body:
```json
{ "name": "Paciente" }
```

Response 201: Created character.

### PUT /api/characters/:id
Update a character.

Request Body:
```json
{ "name": "Devoto" }
```

Response 200: Updated character.

### DELETE /api/characters/:id
Delete a character.

Response 200:
```json
{ "message": "Character deleted successfully" }
```

## Notes
- `name` is required for create/update.
- `updated_at` is managed server-side when mutations happen.

## Error Handling
- 400 Bad Request: missing name on create/update
- 404 Not Found: resource not found
- 500 Internal Server Error: unexpected failures

