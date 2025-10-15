# Catalogs API Contract

## Overview
API for managing catalogs and publications linked to exvotos and SEMs.

## Base URL
`/api/catalogs`

## Authentication
None (development). All endpoints are publicly accessible.

## Endpoints

### GET /api/catalogs
List all catalogs.

Response 200:
```json
[
  {
    "id": 1,
    "title": "Catálogo X",
    "reference": "Ref-001",
    "author": "Autor",
    "publication_year": 1999,
    "publication_place": "Madrid",
    "catalog_location": "Archivo ...",
    "exvoto_count": 50,
    "location_description": null,
    "oldest_exvoto_date": "1650-01-01",
    "newest_exvoto_date": "1879-12-31",
    "other_exvotos": null,
    "numero_exvotos": 50,
    "comments": null,
    "updated_at": "2025-09-01T10:00:00.000Z"
  }
]
```

### GET /api/catalogs/:id
Fetch a single catalog by ID.

Response 200: Same shape as list item above.

404 Not Found:
```json
{ "error": "Catalog not found" }
```

### POST /api/catalogs
Create a catalog.

Request Body (partial fields allowed):
```json
{
  "title": "Catálogo X",
  "reference": "Ref-001",
  "author": "Autor",
  "publication_year": 1999,
  "publication_place": "Madrid",
  "catalog_location": "Archivo ...",
  "exvoto_count": 50,
  "location_description": null,
  "oldest_exvoto_date": "1650-01-01",
  "newest_exvoto_date": "1879-12-31",
  "other_exvotos": null,
  "numero_exvotos": 50,
  "comments": null
}
```

Response 201: Created catalog.

### PUT /api/catalogs/:id
Update a catalog (partial update supported).

Response 200: Updated catalog.

404 Not Found / 400 Bad Request as applicable.

### DELETE /api/catalogs/:id
Delete a catalog.

Response 200:
```json
{ "message": "Catalog deleted successfully" }
```

## Notes
- For SEM associations, see `/api/catalog-sems` endpoints.
- `updated_at` is managed server-side when mutations happen.

## Error Handling
- 400 Bad Request: validation errors (when applicable)
- 404 Not Found: missing resource
- 500 Internal Server Error: unexpected failures

