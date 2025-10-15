# Divinities API Contract

## Overview
API for managing divinities (Virgins and Saints) and their descriptive fields.

## Base URL
`/api/divinities`

## Authentication
None (development). All endpoints are publicly accessible.

## Endpoints

### GET /api/divinities
List all divinities.

Response 200:
```json
[
  {
    "id": 1,
    "name": "Virgen del ...",
    "attributes": "Atributos",
    "history": "Historia",
    "representation": "Representación",
    "representation_image": null,
    "comments": null,
    "updated_at": "2025-09-01T10:00:00.000Z"
  }
]
```

### GET /api/divinities/:id
Fetch a divinity by ID.

Response 200: Same shape as list item above.

404 Not Found:
```json
{ "error": "Divinity not found" }
```

### POST /api/divinities
Create a divinity.

Request Body (partial fields allowed; `name` required):
```json
{
  "name": "Virgen del ...",
  "attributes": "",
  "history": "",
  "representation": "",
  "representation_image": null,
  "comments": ""
}
```

Response 201: Created divinity.

### PUT /api/divinities/:id
Update a divinity (partial update supported).

Response 200: Updated divinity.

### DELETE /api/divinities/:id
Delete a divinity.

Response 200:
```json
{ "message": "Divinity deleted successfully" }
```

## Notes
- `representation_image` is a binary blob in DB; server returns Data URL to frontend when applicable.
- `updated_at` is managed server-side when mutations happen.

## Error Handling
- 400 Bad Request: validation errors (when applicable)
- 404 Not Found: missing resource
- 500 Internal Server Error: unexpected failures

