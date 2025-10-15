# ExvoRed Data Model Documentation

**Version:** 1.0
**Last Updated:** 2025-10-15
**Database:** SQLite with Drizzle ORM
**Schema Source of Truth:** `/api/db/schema.ts`

---

## Table of Contents

1. [Entity Overview](#entity-overview)
2. [Core Entities](#core-entities)
3. [Junction Tables](#junction-tables)
4. [Relationships](#relationships)
5. [Special Cases and Design Patterns](#special-cases-and-design-patterns)
6. [Indexes and Performance](#indexes-and-performance)
7. [Planned Schema Changes](#planned-schema-changes)
8. [Migration Strategy](#migration-strategy)
9. [Data Validation Rules](#data-validation-rules)

---

## Entity Overview

The ExvoRed database manages a comprehensive catalog of **exvotos** (votive offerings) with supporting entities for locations, publications, divinities, and taxonomies.

### Core Entity Tables

| Table | Purpose | Record Count Context |
|-------|---------|---------------------|
| **exvoto** | Main entity: votive offerings with complete metadata | Primary dataset (hundreds to thousands) |
| **sem** | Sanctuaries, shrines, and museums (physical locations) | 50-200 locations |
| **catalog** | Publications and catalogs documenting exvotos | 20-100 publications |
| **divinity** | Divinities (Virgins and Saints) with attributes | 50-150 divinities |
| **character** | Unique catalog of personas represented in exvotos | 20-50 character types |
| **miracle** | Unique catalog of miracle types | 15-30 miracle types |
| **exvoto_image** | Multiple images per exvoto (one-to-many) | Variable (0-10 per exvoto) |

### Junction Tables (Many-to-Many)

| Table | Relationship | Purpose |
|-------|-------------|---------|
| **catalog_exvoto** | catalog ↔ exvoto | Links catalogs to documented exvotos |
| **catalog_sem** | catalog ↔ sem | Links catalogs to SEMs they document |
| **divinity_sem** | divinity ↔ sem | Links divinities to SEMs where they're worshipped |

---

## Core Entities

### exvoto (Votive Offerings)

**Purpose:** Central entity representing individual votive offerings made in gratitude for miracles. Contains complete descriptive, historical, and provenance metadata.

**Table Name:** `exvoto`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `internal_id` | text(20) | nullable | Institution-specific identifier (may duplicate across different SEMs) |
| `offering_sem_id` | integer | nullable, FK → sem.id | SEM where exvoto was offered |
| `lugar_origen` | text(200) | nullable | Place of origin (stored as free text, **not** a foreign key) |
| `conservation_sem_id` | integer | nullable, FK → sem.id | SEM where exvoto is currently conserved |
| `province` | text(50) | nullable | Geographic province |
| `virgin_or_saint` | text(100) | nullable | Name of divinity (currently free text; **planned FK** to divinity table) |
| `exvoto_date` | text | nullable | Date in ISO format (YYYY-MM-DD); allows partial dates with "X" placeholders |
| `epoch` | text(25) | nullable | Auto-calculated 25-year interval (e.g., "1551-1575") |
| `benefited_name` | text(100) | nullable | Name of person who received the miracle |
| `offerer_name` | text(100) | nullable | Name of person who offered the exvoto |
| `offerer_gender` | text(10) | nullable | Gender of offerer (enum: currently flexible; **planned update** to specific values) |
| `offerer_relation` | text(100) | nullable | Relationship between offerer and beneficiary |
| `characters` | text(200) | nullable | Characters represented in the image (currently free text; relates to character table) |
| `profession` | text(100) | nullable | Profession of offerer or beneficiary |
| `social_status` | text(100) | nullable | Social status of offerer or beneficiary |
| `miracle` | text(50) | nullable | Type of miracle (currently free text; relates to miracle table) |
| `miracle_place` | text(200) | nullable | Place where miracle occurred (not necessarily a SEM) |
| `material` | text(100) | nullable | Physical material of exvoto (e.g., oil on canvas, tin) |
| `dimensions` | text(50) | nullable | Physical dimensions (flexible format) |
| `text_case` | text(20) | nullable | Text capitalization pattern (uppercase, lowercase, mixed) |
| `text_form` | text(20) | nullable | Text form (manuscript, printed, engraved) |
| `extra_info` | text(500) | nullable | Additional relevant information (**planned rich text** support) |
| `transcription` | text | nullable | Full text transcription (**planned rich text** with superscript support) |
| `conservation_status` | text(100) | nullable | Current conservation state (good, deteriorated, restored, etc.) |
| `image` | blob | nullable | Primary cover image (stored as binary blob) |
| `updated_at` | text | nullable | ISO timestamp of last modification |

**Note on lugar_origen vs. origin_sem_id:** The MER diagram references `origin_sem_id` as a foreign key, but the implemented schema uses `lugar_origen` as a free-text field per project requirements. This accommodates cases where the origin place is not a cataloged SEM.

#### Relationships

- **offering_sem** (many-to-one): `exvoto.offering_sem_id` → `sem.id`
- **conservation_sem** (many-to-one): `exvoto.conservation_sem_id` → `sem.id`
- **images** (one-to-many): `exvoto.id` ← `exvoto_image.exvoto_id`
- **catalogs** (many-to-many via catalog_exvoto): `exvoto.id` ↔ `catalog_exvoto` ↔ `catalog.id`

---

### sem (Sanctuaries / Shrines / Museums)

**Purpose:** Physical locations that house, conserve, or receive exvotos. SEMs are central hubs in the data model, linking to exvotos, catalogs, and divinities.

**Table Name:** `sem`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `name` | text(100) | nullable | Official name of sanctuary/shrine/museum |
| `region` | text(100) | nullable | Geographic region (e.g., "Andalucía") |
| `province` | text(100) | nullable | Province (e.g., "Jaén") |
| `town` | text(100) | nullable | Town or municipality |
| `associated_divinity` | text(100) | nullable | Primary divinity associated with SEM (free text; **planned link** via divinity_sem) |
| `festivity` | text(100) | nullable | Principal religious festivity |
| `pictorial_exvoto_count` | integer | nullable | Count of pictorial exvotos held |
| `oldest_exvoto_date` | text | nullable | Date of oldest exvoto (ISO format: YYYY-MM-DD) |
| `newest_exvoto_date` | text | nullable | Date of newest exvoto (ISO format: YYYY-MM-DD) |
| `other_exvotos` | text | nullable | Description of non-pictorial exvotos (crutches, wax figures, etc.) |
| `numero_exvotos` | integer | nullable | Total number of exvotos |
| `comments` | text | nullable | Additional observations |
| `references` | text | nullable | Bibliographic references |
| `contact` | text | nullable | Contact information (curator, institution) |
| `updated_at` | text | nullable | ISO timestamp of last modification |

#### Relationships

- **offering_exvotos** (one-to-many): `sem.id` ← `exvoto.offering_sem_id`
- **conservation_exvotos** (one-to-many): `sem.id` ← `exvoto.conservation_sem_id`
- **catalogs** (many-to-many via catalog_sem): `sem.id` ↔ `catalog_sem` ↔ `catalog.id`
- **divinities** (many-to-many via divinity_sem): `sem.id` ↔ `divinity_sem` ↔ `divinity.id`

---

### catalog (Publications and Catalogs)

**Purpose:** Bibliographic records of publications, academic works, or archival catalogs that document exvotos and SEMs.

**Table Name:** `catalog`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `title` | text(200) | nullable | Full title of publication |
| `reference` | text(200) | nullable | Bibliographic reference code or citation |
| `author` | text(100) | nullable | Author(s) |
| `publication_year` | integer | nullable | Year of publication |
| `publication_place` | text(100) | nullable | Place of publication (**planned removal**; see schema changes) |
| `catalog_location` | text | nullable | Physical location (library, archive) or online URL |
| `exvoto_count` | integer | nullable | Number of exvotos documented (**duplicate field**; see schema changes) |
| `location_description` | text | nullable | Geographic or institutional context (**planned rename** to `description` with rich text) |
| `oldest_exvoto_date` | text | nullable | Date of oldest documented exvoto (ISO format) |
| `newest_exvoto_date` | text | nullable | Date of newest documented exvoto (ISO format) |
| `other_exvotos` | text | nullable | Other forms of exvotos mentioned |
| `numero_exvotos` | integer | nullable | Total number of exvotos (**duplicate**; consolidation planned) |
| `comments` | text | nullable | Additional notes |
| `updated_at` | text | nullable | ISO timestamp of last modification |

#### Relationships

- **exvotos** (many-to-many via catalog_exvoto): `catalog.id` ↔ `catalog_exvoto` ↔ `exvoto.id`
- **sems** (many-to-many via catalog_sem): `catalog.id` ↔ `catalog_sem` ↔ `sem.id`

---

### divinity (Divinities)

**Purpose:** Catalog of divinities (Virgins and Saints) with iconographic, historical, and attributional information.

**Table Name:** `divinity`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `name` | text(150) | NOT NULL | Full name of divinity (e.g., "Virgen de los Remedios") |
| `attributes` | text | nullable | Attributes, specialties, or domains (healing, protection, etc.) |
| `history` | text | nullable | Historical background and legend |
| `representation` | text | nullable | Description of typical iconographic representation |
| `representation_image` | blob | nullable | Image showing typical representation (**planned expansion** to multiple images) |
| `comments` | text | nullable | Additional notes |
| `updated_at` | text | nullable | ISO timestamp of last modification |

#### Relationships

- **sems** (many-to-many via divinity_sem): `divinity.id` ↔ `divinity_sem` ↔ `sem.id`
- **exvotos** (one-to-many): **PLANNED** - `divinity.id` ← `exvoto.divinity_id` (foreign key to be added)

---

### character (Character Catalog)

**Purpose:** Controlled vocabulary of personas/characters represented in exvotos (e.g., "Virgen María", "San José", "Ángel").

**Table Name:** `character`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `name` | text | NOT NULL | Character name |
| `updated_at` | text | nullable | ISO timestamp of last modification |

**Note:** Currently lacks full CRUD UI support (high priority fix in plan.md).

---

### miracle (Miracle Type Catalog)

**Purpose:** Controlled vocabulary of miracle types (e.g., "Curación", "Protección de accidente", "Resurrección").

**Table Name:** `miracle`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `name` | text | NOT NULL | Miracle type name |
| `updated_at` | text | nullable | ISO timestamp of last modification |

**Note:** Currently lacks full CRUD UI support (high priority fix in plan.md).

---

### exvoto_image (Exvoto Images)

**Purpose:** Supports multiple images per exvoto (detailed views, inscriptions, conservation photos).

**Table Name:** `exvoto_image`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PRIMARY KEY, AUTO_INCREMENT, NOT NULL | Internal database ID |
| `exvoto_id` | integer | NOT NULL, FK → exvoto.id | Parent exvoto |
| `image` | blob | NOT NULL | Image binary data |
| `caption` | text | nullable | Image caption (source, provenance, detail description) |
| `updated_at` | text | nullable | ISO timestamp of last modification |

#### Relationships

- **exvoto** (many-to-one): `exvoto_image.exvoto_id` → `exvoto.id`

---

## Junction Tables

Junction tables implement many-to-many relationships without additional attributes (pure join tables).

### catalog_exvoto

**Purpose:** Links catalogs to the exvotos they document.

**Table Name:** `catalog_exvoto`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `catalog_id` | integer | NOT NULL, FK → catalog.id | Parent catalog |
| `exvoto_id` | integer | NOT NULL, FK → exvoto.id | Documented exvoto |

**Composite Primary Key:** `(catalog_id, exvoto_id)` (implied by usage pattern)

#### Relationships

- **catalog** (many-to-one): `catalog_exvoto.catalog_id` → `catalog.id`
- **exvoto** (many-to-one): `catalog_exvoto.exvoto_id` → `exvoto.id`

---

### catalog_sem

**Purpose:** Links catalogs to SEMs they document or reference.

**Table Name:** `catalog_sem`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `catalog_id` | integer | NOT NULL, FK → catalog.id | Parent catalog |
| `sem_id` | integer | NOT NULL, FK → sem.id | Documented SEM |

**Composite Primary Key:** `(catalog_id, sem_id)` (implied by usage pattern)

**Note:** Currently not fully implemented in UI; planned fix to enable multi-select SEM association in catalog forms.

#### Relationships

- **catalog** (many-to-one): `catalog_sem.catalog_id` → `catalog.id`
- **sem** (many-to-one): `catalog_sem.sem_id` → `sem.id`

---

### divinity_sem

**Purpose:** Links divinities to SEMs where they are worshipped or venerated.

**Table Name:** `divinity_sem`

#### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `divinity_id` | integer | NOT NULL, FK → divinity.id | Divinity |
| `sem_id` | integer | NOT NULL, FK → sem.id | SEM |

**Composite Primary Key:** `(divinity_id, sem_id)` (implied by usage pattern)

**Note:** Schema exists but UI implementation incomplete; high priority to complete relationship management.

#### Relationships

- **divinity** (many-to-one): `divinity_sem.divinity_id` → `divinity.id`
- **sem** (many-to-one): `divinity_sem.sem_id` → `sem.id`

---

## Relationships

### Relationship Summary Diagram

```
                  ┌────────────┐
                  │  divinity  │
                  └─────┬──────┘
                        │
                        │ (many-to-many via divinity_sem)
                        │
           ┌────────────┼─────────────┐
           │                          │
    ┌──────▼──────┐            ┌─────▼─────┐
    │ divinity_sem│            │    sem    │
    └─────────────┘            └─────┬─────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
               ┌──────▼────┐   ┌────▼────┐   ┌─────▼──────┐
               │catalog_sem│   │ exvoto  │   │  exvoto    │
               └───────────┘   │(offering│   │(conservation│
                      │        │ _sem_id)│   │ _sem_id)   │
                      │        └────┬────┘   └─────┬──────┘
              ┌───────▼────┐        │              │
              │  catalog   │        │              │
              └───────┬────┘        │              │
                      │             │              │
              ┌───────▼─────────┐   │              │
              │ catalog_exvoto  ◄───┘              │
              └─────────────────┘                  │
                                                   │
                                        ┌──────────▼──────┐
                                        │  exvoto_image   │
                                        └─────────────────┘
```

### Cardinality Reference

| Parent Entity | Relationship Type | Child Entity | Foreign Key | Notes |
|---------------|------------------|--------------|-------------|-------|
| **sem** | one-to-many | exvoto | exvoto.offering_sem_id | Where exvoto was offered |
| **sem** | one-to-many | exvoto | exvoto.conservation_sem_id | Where exvoto is conserved |
| **exvoto** | one-to-many | exvoto_image | exvoto_image.exvoto_id | Multiple images per exvoto |
| **catalog** | many-to-many | exvoto | via catalog_exvoto | Catalogs document exvotos |
| **catalog** | many-to-many | sem | via catalog_sem | Catalogs document SEMs |
| **divinity** | many-to-many | sem | via divinity_sem | Divinities worshipped at SEMs |
| **divinity** | one-to-many | exvoto | **PLANNED** exvoto.divinity_id | Link exvotos to specific divinities |

### Special Foreign Key Handling

**Nullable Foreign Keys:**
- All foreign key columns in `exvoto` table are nullable to accommodate incomplete records or exvotos with unknown provenance.
- Junction table foreign keys are NOT NULL (referential integrity required).

**No Cascading Deletes:**
- Foreign key constraints do not cascade deletes by default.
- Deletion of parent records (SEM, catalog, divinity) must be handled at application level to check for dependent records.

---

## Special Cases and Design Patterns

### 1. Three SEM References in Exvoto

The `exvoto` table has **three distinct SEM-related fields**, each serving a different purpose:

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `offering_sem_id` | FK → sem.id | Where exvoto was offered/deposited | Sanctuary of Virgen de los Remedios |
| `conservation_sem_id` | FK → sem.id | Current conservation location | Museo Provincial de Jaén |
| `lugar_origen` | text(200) | Origin place (free text, NOT FK) | "Valdepeñas de Jaén" (may not be a SEM) |

**Design Rationale:**
- `lugar_origen` is free text because origin places are often small towns without formal SEM entries.
- `offering_sem_id` and `conservation_sem_id` may differ if exvotos have been moved to museums or relocated.

**MER.dbml Discrepancy:**
- MER diagram shows `origin_sem_id` as a foreign key, but implemented schema uses `lugar_origen` as text per requirements.

---

### 2. Epoch Calculation (25-Year Intervals)

Exvotos are categorized into **25-year epochs** spanning from the 13th to 21st centuries.

**Epoch Field:** `exvoto.epoch` (text, 25 chars max)

**Format:** `"YYYY-YYYY"` (e.g., `"1551-1575"`, `"1776-1800"`)

**Auto-Calculation:**
- Frontend utility: `/src/utils/epochUtils.ts`
- Calculated based on `exvoto_date` field
- Century-based selector (`EpochSelector.tsx`) displays intervals grouped by century

**Example Intervals:**
| Century | Intervals |
|---------|-----------|
| XVI (16th) | 1501-1525, 1526-1550, 1551-1575, 1576-1600 |
| XVIII (18th) | 1701-1725, 1726-1750, 1751-1775, 1776-1800 |

**Use Case:** Enables chronological analysis and filtering by historical period.

---

### 3. Date Handling and Partial Dates

**Storage Format:** ISO 8601 text (YYYY-MM-DD)

**SQLite Date Type:** SQLite stores dates as text; the application validates and formats dates.

**Partial Date Support (Planned):**
- Allow `"X"` as placeholder for unknown month or day
- Examples: `"1787-X-01"` (unknown month), `"1650-05-X"` (unknown day)
- Frontend validation planned to accept this format

**Date Input Requirements:**
- **Current:** HTML `<input type="date">` (browser native picker)
- **Planned Change:** Manual text entry with flexible validation to support partial dates

**Date Discrepancy Issue:**
- Known bug: dates displayed in table view differ by one day from detail view (timezone/UTC conversion bug).
- High priority fix planned (see plan.md).

---

### 4. Image Storage Architecture

**Backend Storage:** Binary blobs in SQLite

**Frontend Representation:** Base64 data URLs

**Image Entities:**
- `exvoto.image` (blob) - Primary cover image
- `exvoto_image.image` (blob) - Multiple additional images per exvoto
- `divinity.representation_image` (blob) - Single image per divinity (**planned expansion** to multiple)

**Planned Expansion:**
- `sem_image` table (not yet implemented) - Multiple images per SEM
- `divinity_image` table (not yet implemented) - Multiple images per divinity, JPG support

**Image Utilities:** `/src/utils/images.ts`

**JSON Payload Limit:** 10MB (configured in Express server to support base64 uploads)

**Note:** Large image collections may require optimization (compression, lazy loading, CDN).

---

### 5. Free Text vs. Controlled Vocabulary

Several fields use **free text** where controlled vocabularies exist but are not enforced via foreign keys:

| Exvoto Field | Type | Related Table | Current Relationship | Planned Change |
|--------------|------|---------------|---------------------|----------------|
| `virgin_or_saint` | text(100) | divinity | None (free text) | Add `divinity_id` FK |
| `miracle` | text(50) | miracle | None (free text) | Consider FK or keep flexible |
| `characters` | text(200) | character | None (free text) | Consider FK or keep flexible |

**Design Rationale:**
- Free text offers flexibility for unique/historical variations.
- Controlled vocabularies (miracle, character tables) serve as reference catalogs for data entry suggestions.
- Strict FK enforcement may be added in future migrations based on data quality and user needs.

---

### 6. Duplicate Count Fields in Catalog

**Issue:** Catalog table has two exvoto count fields:
- `exvoto_count` (integer)
- `numero_exvotos` (integer)

**Planned Resolution:**
- Consolidate to single field (`numero_exvotos` preferred for consistency with SEM table naming).
- Data migration to merge values (choose max if they differ, or flag for manual review).

---

## Indexes and Performance

### Current Index Strategy

**Primary Keys:** Auto-indexed by SQLite on all `id` columns.

**Foreign Key Indexes:** Drizzle ORM does not automatically create indexes on foreign key columns in SQLite. Manual indexes should be added for performance.

### Recommended Indexes (To Be Implemented)

#### High Priority (Frequent Query Patterns)

```sql
-- Exvoto foreign keys (join performance)
CREATE INDEX idx_exvoto_offering_sem ON exvoto(offering_sem_id);
CREATE INDEX idx_exvoto_conservation_sem ON exvoto(conservation_sem_id);

-- Exvoto image lookups
CREATE INDEX idx_exvoto_image_exvoto_id ON exvoto_image(exvoto_id);

-- Junction table lookups (many-to-many queries)
CREATE INDEX idx_catalog_exvoto_catalog ON catalog_exvoto(catalog_id);
CREATE INDEX idx_catalog_exvoto_exvoto ON catalog_exvoto(exvoto_id);

CREATE INDEX idx_catalog_sem_catalog ON catalog_sem(catalog_id);
CREATE INDEX idx_catalog_sem_sem ON catalog_sem(sem_id);

CREATE INDEX idx_divinity_sem_divinity ON divinity_sem(divinity_id);
CREATE INDEX idx_divinity_sem_sem ON divinity_sem(sem_id);
```

#### Medium Priority (Filter/Sort Operations)

```sql
-- Date range queries
CREATE INDEX idx_exvoto_date ON exvoto(exvoto_date);
CREATE INDEX idx_exvoto_epoch ON exvoto(epoch);

-- Geographic filters
CREATE INDEX idx_exvoto_province ON exvoto(province);
CREATE INDEX idx_sem_province ON sem(province);

-- Last modified sorting
CREATE INDEX idx_exvoto_updated_at ON exvoto(updated_at);
CREATE INDEX idx_sem_updated_at ON sem(updated_at);
CREATE INDEX idx_catalog_updated_at ON catalog(updated_at);
```

#### Low Priority (Full-Text Search)

SQLite full-text search (FTS5) is not currently implemented but may be beneficial for:
- `exvoto.transcription` (large text field)
- `exvoto.extra_info`
- `catalog.comments`
- `divinity.history`

**Implementation Note:** FTS5 requires creating virtual tables and synchronization triggers.

---

## Planned Schema Changes

The following schema modifications are documented in `/home/marcos/Documentos/Programming/JavaScript/ExvoRed/.claude/docs/plan.md`. This section provides migration-ready pseudo-SQL and impact analysis.

### 1. Add `divinity_id` Foreign Key to Exvoto

**Priority:** High
**Plan Reference:** `link-exvotos-divinities`

**Purpose:** Replace free-text `virgin_or_saint` field with proper foreign key relationship to `divinity` table.

**Migration Steps:**

```sql
Step 1: Add nullable divinity_id column to exvoto table
  ALTER TABLE exvoto ADD COLUMN divinity_id INTEGER;

Step 2: Create index on divinity_id for join performance
  CREATE INDEX idx_exvoto_divinity ON exvoto(divinity_id);

Step 3: (Optional) Attempt to match existing virgin_or_saint text to divinity.name
  -- This requires manual data cleanup or fuzzy matching script
  -- UPDATE exvoto SET divinity_id = (SELECT id FROM divinity WHERE name = exvoto.virgin_or_saint LIMIT 1);

Step 4: Update Drizzle schema (api/db/schema.ts)
  -- Add field: divinity_id: integer('divinity_id')
  -- Add relation: divinity: one(divinity, { fields: [exvoto.divinity_id], references: [divinity.id] })

Step 5: Update frontend types (src/types.ts)
  -- Add field: divinity_id: number | null;
```

**Impact:**
- Existing exvotos will have `null` divinity_id initially.
- UI must handle both `virgin_or_saint` (legacy) and `divinity_id` (new) during transition.
- Consider deprecating `virgin_or_saint` after migration completes.

---

### 2. Add `references` Field to Exvoto

**Priority:** Medium
**Plan Reference:** `add-exvoto-references-field`

**Purpose:** Support bibliographic citations with links to catalogs.

**Migration Steps:**

```sql
Step 1: Add references text field to exvoto table
  ALTER TABLE exvoto ADD COLUMN references TEXT;

Step 2: Update Drizzle schema (api/db/schema.ts)
  -- Add field: references: text('references')

Step 3: Update frontend types (src/types.ts)
  -- Add field: references: string | null;
```

**Design Note:** This field coexists with `catalog_exvoto` junction table. Intended use:
- `references` = Free-text bibliographic citations (flexible format)
- `catalog_exvoto` = Structured links to specific catalog records in database

**UI Pattern:** Display `references` as rich text with clickable catalog links generated from junction table relationships.

---

### 3. Update `offerer_gender` Enum Values

**Priority:** Medium
**Plan Reference:** `add-exvoto-gender-options`

**Purpose:** Refine gender options to match research needs.

**Current Values (flexible text):**
- "Masculino" (Male)
- "Femenino" (Female)
- "Otro" (Other)

**New Values:**
- "Masculino" (Male)
- "Femenino" (Female)
- "Ambos" (Both)
- "Desconocido" (Unknown)
- ~~"Otro"~~ (removed)

**Migration Steps:**

```sql
Step 1: Update existing "Otro" values to "Desconocido"
  UPDATE exvoto SET offerer_gender = 'Desconocido' WHERE offerer_gender = 'Otro';

Step 2: (Optional) Add CHECK constraint for enum validation
  -- SQLite does not enforce CHECK constraints strictly, but Drizzle can validate at application level
  -- ALTER TABLE exvoto ADD CONSTRAINT check_gender CHECK (offerer_gender IN ('Masculino', 'Femenino', 'Ambos', 'Desconocido'));

Step 3: Update frontend validation and dropdowns
  -- Ensure forms only offer new values
```

**Impact:**
- Manual review recommended for "Otro" records to determine if "Ambos" or "Desconocido" is more appropriate.

---

### 4. Create `sem_image` Table

**Priority:** Medium
**Plan Reference:** `add-sem-images`

**Purpose:** Support multiple image uploads per SEM (architecture, location, artwork).

**Migration Steps:**

```sql
Step 1: Create sem_image table
  CREATE TABLE sem_image (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    sem_id INTEGER NOT NULL,
    image BLOB NOT NULL,
    caption TEXT,
    updated_at TEXT,
    FOREIGN KEY (sem_id) REFERENCES sem(id)
  );

Step 2: Create index on sem_id
  CREATE INDEX idx_sem_image_sem_id ON sem_image(sem_id);

Step 3: Update Drizzle schema (api/db/schema.ts)
  -- Define table: export const semImage = sqliteTable('sem_image', { ... });
  -- Add relation to sem: images: many(semImage)

Step 4: Update frontend types (src/types.ts)
  -- Add interface: export interface SemImage { id: number; sem_id: number; image: string; caption: string | null; updated_at?: string | null; }
```

**UI Pattern:** Reuse `exvoto_image` management UI patterns for consistency.

---

### 5. Create `divinity_image` Table

**Priority:** Medium
**Plan Reference:** `divinity-allow-multiple-images`

**Purpose:** Replace single `representation_image` blob with multiple images supporting various formats (JPG, PNG).

**Migration Steps:**

```sql
Step 1: Create divinity_image table
  CREATE TABLE divinity_image (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    divinity_id INTEGER NOT NULL,
    image BLOB NOT NULL,
    caption TEXT,
    updated_at TEXT,
    FOREIGN KEY (divinity_id) REFERENCES divinity(id)
  );

Step 2: Create index on divinity_id
  CREATE INDEX idx_divinity_image_divinity_id ON divinity_image(divinity_id);

Step 3: Migrate existing representation_image data
  -- For each divinity with non-null representation_image:
  INSERT INTO divinity_image (divinity_id, image, caption)
    SELECT id, representation_image, 'Migrated from representation_image'
    FROM divinity WHERE representation_image IS NOT NULL;

Step 4: (Optional) Drop representation_image column from divinity table
  -- SQLite does not support DROP COLUMN directly; requires table recreation
  -- Defer until migration is confirmed successful

Step 5: Update Drizzle schema (api/db/schema.ts)
  -- Define table: export const divinityImage = sqliteTable('divinity_image', { ... });
  -- Add relation to divinity: images: many(divinityImage)

Step 6: Update frontend types (src/types.ts)
  -- Add interface: export interface DivinityImage { id: number; divinity_id: number; image: string; caption: string | null; updated_at?: string | null; }
```

**Impact:**
- Breaking change for divinity image display logic.
- UI must transition from single image to gallery view.

---

### 6. Consolidate Catalog Exvoto Count Fields

**Priority:** Medium
**Plan Reference:** `catalog-remove-duplicate-exvoto-count`

**Purpose:** Remove duplication between `exvoto_count` and `numero_exvotos`.

**Migration Steps:**

```sql
Step 1: Audit existing data to identify discrepancies
  -- SELECT id, title, exvoto_count, numero_exvotos FROM catalog WHERE exvoto_count != numero_exvotos OR (exvoto_count IS NULL AND numero_exvotos IS NOT NULL) OR (exvoto_count IS NOT NULL AND numero_exvotos IS NULL);

Step 2: Consolidate values into numero_exvotos
  UPDATE catalog SET numero_exvotos = COALESCE(numero_exvotos, exvoto_count);

Step 3: Drop exvoto_count column
  -- SQLite requires table recreation to drop column
  -- Create new table without exvoto_count, copy data, rename

Step 4: Update Drizzle schema (api/db/schema.ts)
  -- Remove field: exvoto_count

Step 5: Update frontend types and forms (src/types.ts)
  -- Remove field: exvoto_count
```

**Impact:**
- Forms and API endpoints must be updated to reference only `numero_exvotos`.

---

### 7. Rename and Modify Catalog Fields

**Priority:** Medium
**Plan References:** `catalog-rename-description-field`, `catalog-remove-publication-place`

**Changes:**
- **Remove:** `publication_place` field
- **Rename:** `location_description` → `description`
- **Enhance:** `description` to support rich text (HTML storage)

**Migration Steps:**

```sql
Step 1: Add new description field (temporarily alongside location_description)
  ALTER TABLE catalog ADD COLUMN description TEXT;

Step 2: Migrate location_description data to description
  UPDATE catalog SET description = location_description;

Step 3: (Optional) Preserve publication_place data by appending to comments
  UPDATE catalog SET comments = COALESCE(comments || '\n\n', '') || 'Publication Place: ' || publication_place WHERE publication_place IS NOT NULL;

Step 4: Drop old columns (requires table recreation in SQLite)
  -- Create new table without location_description and publication_place
  -- Copy data, rename table

Step 5: Update Drizzle schema (api/db/schema.ts)
  -- Remove: publication_place, location_description
  -- Add: description: text('description')

Step 6: Update frontend types (src/types.ts)
  -- Remove: publication_place, location_description
  -- Add: description: string | null
```

**Impact:**
- Rich text editor integration required for `description` field.
- HTML sanitization needed for XSS prevention.

---

### 8. Fix `catalog_sem` Relationship UI

**Priority:** Medium
**Plan Reference:** `catalog-fix-sem-relationship`

**Purpose:** Enable proper many-to-many SEM association in catalog forms (junction table exists but UI incomplete).

**Migration Steps:**

```sql
-- No schema changes required; junction table exists

Step 1: Verify catalog_sem junction table has proper indexes
  CREATE INDEX IF NOT EXISTS idx_catalog_sem_catalog ON catalog_sem(catalog_id);
  CREATE INDEX IF NOT EXISTS idx_catalog_sem_sem ON catalog_sem(sem_id);

Step 2: Implement API endpoints for junction table management
  -- POST /api/catalogs/:id/sems (add SEM association)
  -- DELETE /api/catalogs/:id/sems/:semId (remove SEM association)

Step 3: Update frontend to use multi-select SEM picker
  -- Replace free-text field with searchable multi-select component
```

**Impact:**
- Existing free-text SEM references may need manual migration to structured associations.

---

## Migration Strategy

### General Principles

1. **Schema Source of Truth:** All migrations start with updates to `/api/db/schema.ts`.

2. **Two-Phase Migrations for Breaking Changes:**
   - **Phase 1:** Add new columns/tables alongside old ones; maintain backward compatibility.
   - **Phase 2:** After data migration and UI updates, remove deprecated columns.

3. **Data Preservation:**
   - Never drop columns without backing up or migrating data.
   - Use `COALESCE()` and `UPDATE` statements to consolidate or transform data.
   - Archive old data in comments fields if unsure about deletion.

4. **Testing Requirements:**
   - Test migrations on development database copy before production.
   - Verify referential integrity after foreign key additions.
   - Ensure UI still functions with both old and new schema during transition.

5. **Drizzle ORM Workflow:**
   - **Development:** Use `npm run db:push` for rapid schema iteration (no migration files).
   - **Production:** Use `npm run db:generate` + `npm run db:migrate` for versioned migrations.

6. **Rollback Plan:**
   - Maintain database backups before each migration.
   - Document reverse migration steps for critical changes.

---

### Example Migration: Adding divinity_id to Exvoto

**Context:** High-priority change to link exvotos to divinities table.

**Step-by-Step Execution:**

```bash
# 1. Update Drizzle schema
# Edit api/db/schema.ts to add:
#   divinity_id: integer('divinity_id')
# Add relation in exvotoRelations:
#   divinity: one(divinity, { fields: [exvoto.divinity_id], references: [divinity.id] })

# 2. Generate migration (production workflow)
npm run db:generate
# This creates a new file in api/db/migrations/ with ALTER TABLE statement

# 3. Review generated migration SQL
# Open the newest file in api/db/migrations/
# Verify it contains: ALTER TABLE exvoto ADD COLUMN divinity_id INTEGER;

# 4. Apply migration
npm run db:migrate

# 5. Create index manually (Drizzle may not auto-generate index)
# Open Drizzle Studio: npm run db:studio
# Execute SQL: CREATE INDEX idx_exvoto_divinity ON exvoto(divinity_id);

# 6. (Optional) Attempt data migration to populate divinity_id
# Run script to match virgin_or_saint text to divinity.name
# Example:
# UPDATE exvoto SET divinity_id = (
#   SELECT id FROM divinity WHERE LOWER(name) = LOWER(exvoto.virgin_or_saint) LIMIT 1
# ) WHERE virgin_or_saint IS NOT NULL;

# 7. Update frontend types
# Edit src/types.ts to add: divinity_id: number | null;

# 8. Update UI components
# Modify exvoto forms to include divinity dropdown
# Update detail pages to display linked divinity name

# 9. Test thoroughly
# Create new exvoto with divinity selection
# Edit existing exvoto to add divinity
# Verify foreign key constraints (try deleting a divinity referenced by exvotos)
```

---

## Data Validation Rules

### Required Fields

**Non-Nullable Fields (Database-Level):**
- All `id` primary key columns (auto-generated)
- `divinity.name`
- `character.name`
- `miracle.name`
- `exvoto_image.exvoto_id`
- `exvoto_image.image`

**Application-Level Required Fields (Nullable in DB, but enforced in forms):**
- `exvoto.internal_id` (recommended for institutional tracking)
- `sem.name` (must have a name to be useful)
- `catalog.title` (must have a title to be useful)

### Field Length Constraints

| Field | Max Length | Validation Rule |
|-------|------------|-----------------|
| `exvoto.internal_id` | 20 chars | Alphanumeric + hyphen/underscore |
| `exvoto.epoch` | 25 chars | Format: "YYYY-YYYY" (e.g., "1551-1575") |
| `exvoto.province` | 50 chars | Free text (consider controlled vocabulary) |
| `sem.name` | 100 chars | Free text |
| `catalog.title` | 200 chars | Free text |
| `divinity.name` | 150 chars | Free text (may contain full liturgical titles) |

### Date Format Validation

**Standard Format:** `YYYY-MM-DD` (ISO 8601)

**Validation Regex (Standard):**
```regex
^\d{4}-\d{2}-\d{2}$
```

**Planned Partial Date Format:** `YYYY-[MM|X]-[DD|X]`

**Validation Regex (Partial Dates):**
```regex
^\d{4}-(0[1-9]|1[0-2]|X)-(0[1-9]|[12][0-9]|3[01]|X)$
```

**Examples:**
- Valid: `"1787-05-12"`, `"1650-X-01"`, `"1702-08-X"`
- Invalid: `"1787-13-01"` (month > 12), `"1787-05-32"` (day > 31)

### Epoch Validation

**Format:** `"YYYY-YYYY"` where intervals are exactly 25 years.

**Validation Logic:**
1. Parse start and end year
2. Verify `end_year - start_year == 24` (inclusive 25-year span)
3. Verify years fall within valid range (1200-2100)

**Auto-Calculation:** Epoch is typically calculated from `exvoto_date`, not manually entered.

### Image Validation

**Blob Storage:**
- Maximum size: 10MB (enforced by Express JSON payload limit)
- Formats: Any binary data accepted by SQLite blob type

**Base64 Frontend:**
- Validate data URL format: `data:image/[type];base64,[data]`
- Supported types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Recommended Frontend Validation:**
```javascript
function validateImageDataURL(dataURL) {
  const pattern = /^data:image\/(jpeg|png|gif|webp);base64,/;
  if (!pattern.test(dataURL)) {
    throw new Error('Invalid image format. Must be JPEG, PNG, GIF, or WebP.');
  }

  const sizeInBytes = (dataURL.length * 3) / 4; // Rough base64 size estimate
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (sizeInBytes > maxSizeInBytes) {
    throw new Error('Image size exceeds 10MB limit.');
  }
}
```

### Foreign Key Validation

**Referential Integrity:**
- Foreign key values must exist in referenced table or be `NULL`.
- Application-level validation recommended before INSERT/UPDATE (SQLite foreign key constraints must be explicitly enabled).

**Example API Validation:**
```javascript
// Before creating exvoto with offering_sem_id
if (offering_sem_id !== null) {
  const sem = await db.select().from(sem).where(eq(sem.id, offering_sem_id)).get();
  if (!sem) {
    throw new Error('Invalid offering_sem_id: SEM does not exist.');
  }
}
```

### Text Normalization

**Search and Matching:**
- Remove accents/diacritics for search (e.g., "José" matches "Jose")
- Case-insensitive matching
- Trim whitespace

**Utility Example (already implemented in `/src/utils/highlightText.tsx`):**
```javascript
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}
```

### Gender Enum Validation

**After Planned Migration (see Schema Changes #3):**

**Valid Values:**
- `"Masculino"`
- `"Femenino"`
- `"Ambos"`
- `"Desconocido"`
- `null` (field is nullable)

**Frontend Validation:**
```javascript
const validGenders = ['Masculino', 'Femenino', 'Ambos', 'Desconocido'];
if (offerer_gender !== null && !validGenders.includes(offerer_gender)) {
  throw new Error('Invalid gender value.');
}
```

---

## Summary

This data model documentation provides:

1. **Complete field definitions** for all 9 entity tables (exvoto, sem, catalog, divinity, character, miracle, exvoto_image, catalog_exvoto, catalog_sem, divinity_sem)

2. **Relationship mappings** with cardinality, foreign keys, and junction table structures

3. **Special design patterns** including:
   - Three distinct SEM references in exvoto (offering, conservation, origin)
   - 25-year epoch interval system
   - Flexible date handling with planned partial date support
   - Image storage architecture (blob backend, base64 frontend)

4. **Index recommendations** for query performance optimization (currently not fully implemented)

5. **8 planned schema changes** with detailed migration steps:
   - Add `divinity_id` FK to exvoto (high priority)
   - Add `references` field to exvoto (medium priority)
   - Update `offerer_gender` enum (medium priority)
   - Create `sem_image` table (medium priority)
   - Create `divinity_image` table (medium priority)
   - Consolidate catalog exvoto count fields (medium priority)
   - Rename and enhance catalog fields (medium priority)
   - Fix `catalog_sem` relationship UI (medium priority)

6. **Migration strategy** with two-phase approach, data preservation principles, and Drizzle ORM workflow

7. **Validation rules** covering:
   - Required fields and nullability
   - Length constraints
   - Date format validation (current and planned partial dates)
   - Epoch validation
   - Image size and format validation
   - Foreign key referential integrity
   - Text normalization for search
   - Enum value validation

**Next Steps for Implementation:**

1. **Immediate (High Priority):**
   - Add indexes on foreign key columns for performance
   - Implement `divinity_id` FK migration to link exvotos with divinities
   - Fix date display discrepancy between table and detail views

2. **Short-Term (Medium Priority):**
   - Complete `divinity_sem` and `catalog_sem` UI implementation
   - Add `references` field to exvoto
   - Create `sem_image` and `divinity_image` tables
   - Update gender enum values

3. **Long-Term (Low Priority):**
   - Implement rich text support for long-form text fields
   - Add full-text search (FTS5) for transcriptions and descriptions
   - Consider controlled vocabulary enforcement for miracle and character fields

**Maintenance Notes:**
- Update this documentation whenever schema changes are implemented
- Keep MER.dbml diagram synchronized with actual schema (currently has discrepancies)
- Monitor query performance and add indexes as needed based on actual usage patterns
- Review and update validation rules as data entry patterns evolve
