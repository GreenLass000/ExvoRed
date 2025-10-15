# Catalog–SEM Relationship API Contract

## Overview
API for managing many-to-many relationships between catalogs and SEMs.

## Base URL
`/api/catalog-sems`

## Authentication
None (development). All endpoints are publicly accessible.

## Endpoints

### GET /api/catalog-sems
List all catalog–SEM relations.

Response 200:
```json
[
  { "catalog_id": 1, "sem_id": 10 }
]
```

### GET /api/catalog-sems/catalog/:catalogId
List SEM relations for a specific catalog.

Response 200:
```json
[
  { "catalog_id": 1, "sem_id": 10 },
  { "catalog_id": 1, "sem_id": 11 }
]
```

### POST /api/catalog-sems
Create a relation between a catalog and a SEM.

Request Body:
```json
{ "catalog_id": 1, "sem_id": 10 }
```

Response 201:
```json
{ "catalog_id": 1, "sem_id": 10 }
```

### DELETE /api/catalog-sems/:catalogId/:semId
Delete a specific relation.

Response 200:
```json
{ "message": "Catalog-sem relationship deleted successfully" }
```

## Notes
- This resource is a pure junction table; no additional metadata is stored.

## Error Handling
- 404 Not Found: when trying to delete a non-existing relation
- 500 Internal Server Error: unexpected failures

