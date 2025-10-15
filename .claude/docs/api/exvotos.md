# Exvotos API Contract

## Overview

The Exvotos API manages votive offerings (exvotos) - religious offerings made in gratitude for miracles. This API provides full CRUD operations for exvotos and supports multiple image management per exvoto.

Exvotos are the core entity of the ExvoRed application, containing detailed information about the offering, the miracle, the people involved, and physical characteristics of the votive offering.

## Base URL

`/api/exvotos`

## Authentication

Not currently implemented. All endpoints are publicly accessible.

---

## Endpoints

### GET /api/exvotos

List all exvotos.

**Query Parameters:**
- None currently implemented
- Planned: `search` (string, optional) - Search term for filtering results
- Planned: `filter` (string, optional) - Filter criteria (by province, epoch, SEM, etc.)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "internal_id": "EX-001",
    "offering_sem_id": 5,
    "lugar_origen": "Sevilla",
    "conservation_sem_id": 5,
    "province": "Sevilla",
    "virgin_or_saint": "Virgen de los Reyes",
    "exvoto_date": "1787-03-15",
    "epoch": "1776-1800",
    "benefited_name": "Juan García",
    "offerer_name": "María García",
    "offerer_gender": "Mujer",
    "offerer_relation": "Madre",
    "characters": "Hombre enfermo, mujer orante",
    "profession": "Labrador",
    "social_status": "Popular",
    "miracle": "Curación de enfermedad",
    "miracle_place": "Casa del enfermo",
    "material": "Óleo sobre lienzo",
    "dimensions": "45x60 cm",
    "text_case": "Mayúsculas",
    "text_form": "Prosa",
    "extra_info": "Buen estado de conservación",
    "transcription": "MILAGRO QVE HIZO N.S. DE LOS REYES...",
    "conservation_status": "Bueno",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "updated_at": "2025-10-15T10:30:00.000Z"
  }
]
```

**Error Responses:**
- `500 Internal Server Error`: Database error or server failure

**Notes:**
- Images are returned as base64-encoded data URLs
- `lugar_origen` is a text field, not a foreign key reference
- `offering_sem_id` and `conservation_sem_id` are foreign keys to the `sem` table
- Dates are stored as ISO strings (YYYY-MM-DD)
- `epoch` represents 25-year intervals (e.g., "1551-1575", "1776-1800")

---

### GET /api/exvotos/:id

Get a single exvoto by ID.

**URL Parameters:**
- `id` (integer, required): Exvoto ID

**Response:** `200 OK`

```json
{
  "id": 1,
  "internal_id": "EX-001",
  "offering_sem_id": 5,
  "lugar_origen": "Sevilla",
  "conservation_sem_id": 5,
  "province": "Sevilla",
  "virgin_or_saint": "Virgen de los Reyes",
  "exvoto_date": "1787-03-15",
  "epoch": "1776-1800",
  "benefited_name": "Juan García",
  "offerer_name": "María García",
  "offerer_gender": "Mujer",
  "offerer_relation": "Madre",
  "characters": "Hombre enfermo, mujer orante",
  "profession": "Labrador",
  "social_status": "Popular",
  "miracle": "Curación de enfermedad",
  "miracle_place": "Casa del enfermo",
  "material": "Óleo sobre lienzo",
  "dimensions": "45x60 cm",
  "text_case": "Mayúsculas",
  "text_form": "Prosa",
  "extra_info": "Buen estado de conservación",
  "transcription": "MILAGRO QVE HIZO N.S. DE LOS REYES...",
  "conservation_status": "Bueno",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "updated_at": "2025-10-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Exvoto with specified ID does not exist
- `500 Internal Server Error`: Database error or server failure

---

### POST /api/exvotos

Create a new exvoto.

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "internal_id": "EX-002",
  "offering_sem_id": 3,
  "lugar_origen": "Granada",
  "conservation_sem_id": 3,
  "province": "Granada",
  "virgin_or_saint": "Virgen de las Angustias",
  "exvoto_date": "1802-06-20",
  "epoch": "1801-1825",
  "benefited_name": "Pedro López",
  "offerer_name": "Ana López",
  "offerer_gender": "Mujer",
  "offerer_relation": "Esposa",
  "characters": "Hombre caído, mujer orante",
  "profession": "Comerciante",
  "social_status": "Burguesía",
  "miracle": "Salvación de accidente",
  "miracle_place": "Camino real",
  "material": "Óleo sobre tabla",
  "dimensions": "50x70 cm",
  "text_case": "Minúsculas",
  "text_form": "Verso",
  "extra_info": "Restaurado en 1990",
  "transcription": "Milagro que hizo Nuestra Señora...",
  "conservation_status": "Restaurado",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Validation Rules:**
- All fields are optional except for the automatic fields (`id`, `updated_at`)
- `internal_id`: String, max 20 characters
- `offering_sem_id`, `conservation_sem_id`: Integer, must reference existing SEM
- `lugar_origen`: String, max 200 characters
- `province`: String, max 50 characters
- `virgin_or_saint`: String, max 100 characters
- `exvoto_date`: String, ISO date format (YYYY-MM-DD) or partial dates with "X" (e.g., "1787-X-01")
- `epoch`: String, max 25 characters, 25-year interval format (e.g., "1776-1800")
- `benefited_name`, `offerer_name`: String, max 100 characters
- `offerer_gender`: String, max 10 characters (values: "Hombre", "Mujer", "Ambos", "Desconocido")
- `offerer_relation`: String, max 100 characters
- `characters`: String, max 200 characters
- `profession`, `social_status`: String, max 100 characters
- `miracle`: String, max 50 characters
- `miracle_place`: String, max 200 characters
- `material`: String, max 100 characters
- `dimensions`: String, max 50 characters
- `text_case`, `text_form`: String, max 20 characters
- `extra_info`: String, max 500 characters
- `transcription`: Text (unlimited length)
- `conservation_status`: String, max 100 characters
- `image`: String (base64 data URL) or Buffer, accepts JPG, JPEG, PNG formats only
- Images must be base64-encoded or data URLs (e.g., "data:image/jpeg;base64,...")
- Maximum payload size: 10MB (configured in Express server)

**Response:** `201 Created`

```json
{
  "id": 2,
  "internal_id": "EX-002",
  "offering_sem_id": 3,
  "lugar_origen": "Granada",
  "conservation_sem_id": 3,
  "province": "Granada",
  "virgin_or_saint": "Virgen de las Angustias",
  "exvoto_date": "1802-06-20",
  "epoch": "1801-1825",
  "benefited_name": "Pedro López",
  "offerer_name": "Ana López",
  "offerer_gender": "Mujer",
  "offerer_relation": "Esposa",
  "characters": "Hombre caído, mujer orante",
  "profession": "Comerciante",
  "social_status": "Burguesía",
  "miracle": "Salvación de accidente",
  "miracle_place": "Camino real",
  "material": "Óleo sobre tabla",
  "dimensions": "50x70 cm",
  "text_case": "Minúsculas",
  "text_form": "Verso",
  "extra_info": "Restaurado en 1990",
  "transcription": "Milagro que hizo Nuestra Señora...",
  "conservation_status": "Restaurado",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "updated_at": "2025-10-15T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid image format (only JPG, JPEG, PNG allowed)
  ```json
  {
    "error": "Solo se permiten imágenes JPG, JPEG o PNG."
  }
  ```
- `500 Internal Server Error`: Database error or server failure

---

### PUT /api/exvotos/:id

Update an existing exvoto.

**URL Parameters:**
- `id` (integer, required): Exvoto ID

**Headers:**
- `Content-Type: application/json`

**Request Body:**

Same structure as POST. All fields are optional - only include fields you want to update.

```json
{
  "exvoto_date": "1802-06-21",
  "conservation_status": "Restaurado y enmarcado",
  "extra_info": "Restaurado en 1990. Nueva restauración en 2023."
}
```

**Validation Rules:**
- Same as POST endpoint
- Partial updates are supported (only send fields that need updating)
- `updated_at` is automatically set to current timestamp

**Response:** `200 OK`

Returns the complete updated exvoto object.

```json
{
  "id": 2,
  "internal_id": "EX-002",
  "offering_sem_id": 3,
  "lugar_origen": "Granada",
  "conservation_sem_id": 3,
  "province": "Granada",
  "virgin_or_saint": "Virgen de las Angustias",
  "exvoto_date": "1802-06-21",
  "epoch": "1801-1825",
  "benefited_name": "Pedro López",
  "offerer_name": "Ana López",
  "offerer_gender": "Mujer",
  "offerer_relation": "Esposa",
  "characters": "Hombre caído, mujer orante",
  "profession": "Comerciante",
  "social_status": "Burguesía",
  "miracle": "Salvación de accidente",
  "miracle_place": "Camino real",
  "material": "Óleo sobre tabla",
  "dimensions": "50x70 cm",
  "text_case": "Minúsculas",
  "text_form": "Verso",
  "extra_info": "Restaurado en 1990. Nueva restauración en 2023.",
  "transcription": "Milagro que hizo Nuestra Señora...",
  "conservation_status": "Restaurado y enmarcado",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "updated_at": "2025-10-15T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid image format (only JPG, JPEG, PNG allowed)
- `404 Not Found`: Exvoto with specified ID does not exist
- `500 Internal Server Error`: Database error or server failure

---

### DELETE /api/exvotos/:id

Delete an exvoto.

**URL Parameters:**
- `id` (integer, required): Exvoto ID

**Response:** `200 OK`

```json
{
  "message": "Exvoto deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Exvoto with specified ID does not exist
- `409 Conflict`: Exvoto cannot be deleted due to foreign key constraints (if referenced by other tables)
- `500 Internal Server Error`: Database error or server failure

**Notes:**
- Deleting an exvoto will also delete associated images in the `exvoto_image` table (if cascade is configured)
- Consider implementing soft deletes instead of hard deletes for data preservation

---

### POST /api/exvotos/:id/images

Add one or more additional images to an exvoto.

**URL Parameters:**
- `id` (integer, required): Exvoto ID

**Headers:**
- `Content-Type: application/json`

**Request Body:**

```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUh..."
  ],
  "captions": [
    "Vista frontal del exvoto",
    "Detalle de la inscripción"
  ]
}
```

**Validation Rules:**
- `images`: Array of strings (required, non-empty), base64 data URLs
- `captions`: Array of strings (optional), one caption per image (can be null)
- Each image must be JPG, JPEG, or PNG format
- Images are validated using binary header detection
- Maximum payload size: 10MB (configured in Express server)

**Response:** `201 Created`

```json
[
  {
    "id": 10,
    "exvoto_id": 1,
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "caption": "Vista frontal del exvoto",
    "updated_at": "2025-10-15T13:00:00.000Z"
  },
  {
    "id": 11,
    "exvoto_id": 1,
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
    "caption": "Detalle de la inscripción",
    "updated_at": "2025-10-15T13:00:00.000Z"
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid request format or image format
  ```json
  {
    "error": "images must be a non-empty array"
  }
  ```
  ```json
  {
    "error": "Solo se permiten imágenes JPG, JPEG o PNG."
  }
  ```
- `500 Internal Server Error`: Database error or server failure

---

### GET /api/exvotos/:id/images

Get all additional images for an exvoto.

**URL Parameters:**
- `id` (integer, required): Exvoto ID

**Response:** `200 OK`

```json
[
  {
    "id": 10,
    "exvoto_id": 1,
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "caption": "Vista frontal del exvoto",
    "updated_at": "2025-10-15T13:00:00.000Z"
  },
  {
    "id": 11,
    "exvoto_id": 1,
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
    "caption": "Detalle de la inscripción",
    "updated_at": "2025-10-15T13:00:00.000Z"
  }
]
```

**Error Responses:**
- `500 Internal Server Error`: Database error or server failure

**Notes:**
- Returns an empty array if the exvoto has no additional images
- Images are returned as base64-encoded data URLs

---

### DELETE /api/exvotos/:id/images/:imageId

Delete a specific additional image from an exvoto.

**URL Parameters:**
- `id` (integer, required): Exvoto ID
- `imageId` (integer, required): Image ID

**Response:** `200 OK`

```json
{
  "message": "Image deleted"
}
```

**Error Responses:**
- `404 Not Found`: Image with specified ID does not exist or does not belong to the specified exvoto
- `500 Internal Server Error`: Database error or server failure

---

## Data Models

### Exvoto (TypeScript Interface)

```typescript
interface Exvoto {
  id: number;
  internal_id: string | null;
  offering_sem_id: number | null;
  lugar_origen: string | null;
  conservation_sem_id: number | null;
  province: string | null;
  virgin_or_saint: string | null;
  exvoto_date: string | null; // ISO date format (YYYY-MM-DD)
  epoch: string | null; // 25-year interval (e.g., "1776-1800")
  benefited_name: string | null;
  offerer_name: string | null;
  offerer_gender: string | null;
  offerer_relation: string | null;
  characters: string | null;
  profession: string | null;
  social_status: string | null;
  miracle: string | null;
  miracle_place: string | null;
  material: string | null;
  dimensions: string | null;
  text_case: string | null;
  text_form: string | null;
  extra_info: string | null;
  transcription: string | null;
  conservation_status: string | null;
  image: string | null; // Base64 data URL
  updated_at: string; // ISO timestamp
}

interface ExvotoImage {
  id: number;
  exvoto_id: number;
  image: string; // Base64 data URL
  caption: string | null;
  updated_at: string; // ISO timestamp
}
```

---

## Relationships

**Foreign Keys:**
- `offering_sem_id` → `sem.id` (where the exvoto was offered)
- `conservation_sem_id` → `sem.id` (where the exvoto is currently conserved)

**One-to-Many:**
- An exvoto can have multiple images via `exvoto_image` table

**Many-to-Many:**
- Exvotos can be linked to multiple catalogs via `catalog_exvoto` junction table (managed separately)

---

## Planned Changes

### High Priority

1. **Link Exvotos with Divinities Table** (`link-exvotos-divinities`)
   - Add `divinity_id` foreign key to exvotos table
   - Schema change required: Add `divinity_id` field to `exvoto` table
   - Update CRUD endpoints to handle divinity relationship
   - Existing exvotos will have null `divinity_id` initially

2. **Add References Field** (`add-exvoto-references-field`)
   - Add `references` text field to exvotos for bibliographic citations
   - Schema change required: Add `references` text field to `exvoto` table
   - Link references to Catalogs table (leverage existing `catalog_exvoto` junction)
   - Implement catalog linking UI with clickable references

3. **Fix Date Display Discrepancy** (`fix-exvoto-date-discrepancy`)
   - Review date serialization/deserialization for timezone consistency
   - Ensure consistent ISO format handling across table and detail views

### Medium Priority

4. **Reorder Column Display** (`reorder-exvoto-columns`)
   - No API changes required (frontend-only adjustment)

5. **Display Names Instead of IDs** (`fix-exvoto-cell-display-ids`)
   - Enhance API responses to include related entity names (use joins)
   - Return SEM names alongside IDs for `offering_sem_id` and `conservation_sem_id`
   - Consider adding query parameter for expanded/nested responses

6. **Update Gender Field Options** (`add-exvoto-gender-options`)
   - Schema change: Update gender field enum/constraints
   - Add "Ambos" (Both) and "Desconocido" (Unknown) options
   - Remove "Otro" (Other) option
   - Migration required for existing "Otro" records

7. **Reorganize Detail Page Sections** (`reorganize-exvoto-detail-sections`)
   - No API changes required (frontend-only layout reorganization)

8. **Manual Date Entry with Partial Dates** (`manual-date-entry-with-partial-dates`)
   - Update date validation to accept "X" as placeholder for unknown month/day
   - Format: YYYY-MM-DD with X allowed (e.g., "1787-X-01", "1787-03-X", "1787-X-X")
   - SQLite text dates already support this format

---

## Notes

### Image Handling

- Images are stored as BLOBs in SQLite
- API returns images as base64-encoded data URLs for frontend consumption
- Image format detection is performed using binary header inspection
- Supported formats: JPG, JPEG, PNG only
- MIME type detection:
  - JPEG: Header starts with `0xFF 0xD8 0xFF`
  - PNG: Header starts with `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
  - WebP: Detected but not currently allowed
  - GIF: Detected but not currently allowed

### Date Handling

- Dates are stored as text in ISO format (YYYY-MM-DD)
- Timezone-agnostic storage (no time component)
- Future support for partial dates with "X" placeholder (e.g., "1787-X-01")
- Manual text input is used instead of `<input type="date">` for flexibility

### Epoch System

- Exvotos use 25-year intervals for epoch categorization
- Format: "YYYY-YYYY" (e.g., "1551-1575", "1776-1800")
- Auto-calculated from `exvoto_date` using frontend utilities
- Covers centuries XIII through XXI

### Performance Considerations

- No pagination currently implemented for GET /api/exvotos
- Large result sets may cause performance issues
- Consider implementing:
  - Pagination with `limit` and `offset` parameters
  - Server-side filtering and sorting
  - Field selection to reduce payload size (especially for images)

### Error Handling

- All endpoints return JSON error responses
- Error messages are in Spanish to match application language
- Consider implementing structured error codes for easier client-side handling

### Backward Compatibility

When implementing planned schema changes:
- Ensure migrations handle nullable fields appropriately
- Maintain existing API response structure
- Add new fields as optional to avoid breaking existing clients
- Document breaking changes with migration guides
