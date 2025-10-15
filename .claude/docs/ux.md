# ExvoRed UX Documentation

**Last Updated:** 2025-10-15
**Application Version:** 1.0
**Target Users:** Researchers, curators, and archivists managing votive offerings (exvotos)

---

## Table of Contents

1. [User Interface Overview](#user-interface-overview)
2. [Information Architecture](#information-architecture)
3. [Excel-like Table Interface](#excel-like-table-interface)
4. [Advanced Search System](#advanced-search-system)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Modal and Form Behavior](#modal-and-form-behavior)
7. [Detail Pages](#detail-pages)
8. [Image Viewer](#image-viewer)
9. [Rich Text Editing](#rich-text-editing)
10. [Date Input System](#date-input-system)
11. [Dropdown Enhancements](#dropdown-enhancements)
12. [Data Entry Workflows](#data-entry-workflows)
13. [UI Copy Strings](#ui-copy-strings)
14. [Accessibility Considerations](#accessibility-considerations)
15. [Responsive Design](#responsive-design)

---

## User Interface Overview

### Application Layout

The ExvoRed application follows a consistent layout pattern across all pages:

**Header Navigation (Sticky)**
- Fixed to top of viewport with dark slate background (`bg-slate-800`)
- Application title "ExvoRed" on left
- Horizontal navigation menu on right with 7 main sections:
  - Exvotos (Votive offerings)
  - SEM (Lugares) - Sanctuaries/Shrines/Museums
  - Catálogos (Catalogs)
  - Divinidades (Divinities)
  - Personajes (Characters)
  - Milagros (Miracles)
  - Atajos (Keyboard shortcuts reference)

**Main Content Area**
- White background with padding
- Consistent max-width containers for readability
- Breadcrumb-style navigation on detail pages ("← Volver a la lista")

**Visual Hierarchy**
- Page titles: 3xl font, bold, dark slate
- Section headings: xl-2xl font, semibold, slate-700
- Data labels: sm font, medium weight, slate-500
- Data values: base font, slate-900

### Navigation Patterns

**Primary Navigation:** Top horizontal menu
- Active page highlighted with blue background
- Inactive links: light gray text with hover state

**Secondary Navigation:**
- Table row clicks → Detail pages
- Breadcrumb links on detail pages
- Related entity links (clickable SEM names, catalog references)

**Workflow:** Browse table → Inspect details → Edit/Create → Save → Return to list

---

## Information Architecture

### Entity Relationship Overview

```
Exvotos (Votive Offerings)
├── Associated with: Divinities (planned relationship)
├── References: SEMs (3 types - offering, conservation, origin)
├── Linked to: Catalogs (many-to-many via catalog_exvoto)
├── Contains: Multiple images (one-to-many via exvoto_image)
├── Attributes: Characters, Miracles

SEMs (Sanctuaries/Shrines/Museums)
├── Linked to: Divinities (many-to-many via divinity_sem)
├── Linked to: Catalogs (many-to-many via catalog_sem)
├── Referenced by: Exvotos (as offering/conservation locations)
├── Images: Planned (sem_image table)

Catalogs
├── Linked to: Exvotos (many-to-many)
├── Linked to: SEMs (many-to-many)
├── Contains: Publication metadata, descriptions

Divinities
├── Linked to: SEMs (many-to-many)
├── Will link to: Exvotos (planned foreign key)
├── Images: Planned (divinity_image table)

Characters & Miracles
└── Simple catalogs referenced by Exvotos
```

### Page Hierarchy

**List Pages** (Primary level)
- `/exvotos` - Exvotos table
- `/sems` - SEMs table
- `/catalog` - Catalogs table
- `/divinities` - Divinities table
- `/characters` - Characters table
- `/miracles` - Miracles table
- `/atajos` - Keyboard shortcuts reference

**Detail Pages** (Secondary level)
- `/exvotos/:id` - Single exvoto details
- `/sems/:id` - Single SEM details
- `/catalog/:id` - Single catalog details
- (Note: Divinities, Characters, Miracles currently lack detail pages)

### Exvoto Detail Page Sections (Current)

1. **Detalles del Milagro** (Miracle Details)
   - Fecha (Date)
   - Época (25-year epoch)
   - Milagro (Miracle type)
   - Lugar del Milagro (Miracle location)
   - Provincia (Province)

2. **Ubicación** (Location)
   - Lugar de Ofrenda (Offering SEM)
   - Lugar de Origen del Milagro (Origin SEM - currently broken)
   - Lugar de Conservación (Conservation SEM)

3. **Personas Involucradas** (People Involved)
   - Beneficiado (Benefited person)
   - Oferente (Offerer)
   - Género del Oferente (Offerer gender)
   - Relación Oferente-Beneficiado (Relationship)
   - Profesión (Profession)
   - Estatus Social (Social status)

4. **Descripción del Exvoto** (Exvoto Description)
   - Personajes representados (Characters depicted)
   - Material
   - Dimensiones (Dimensions)
   - Estado de Conservación (Conservation status)

5. **Textos y Notas** (Texts and Notes)
   - Transcripción (Transcription - with italic serif formatting)
   - Información Adicional (Additional info)
   - Uso de Mayúsculas (Capitalization usage)
   - Forma del Texto (Text form)

6. **Imagen** (Image - sidebar)
   - Main image preview
   - Thumbnail navigation for multiple images
   - Enlarge and delete buttons

### Exvoto Detail Page Sections (Planned Reorganization)

1. **Ubicación** (Location)
   - Lugar de ofrenda (Offering SEM)
   - Lugar de conservación (Conservation SEM)
   - Provincia (Province)

2. **Detalles del Milagro** (Miracle Details)
   - Date in YEAR/MONTH/DAY format (with X for unknown values)
   - Miracle type

3. **Personas involucradas** (People Involved)
   - Personajes representados (Characters depicted) - **moved here**
   - Lugar de origen devoto/a (Devotee's origin) - **moved from Location**
   - [Existing person fields]

4. **Descripción del Exvoto** (Exvoto Description)
   - Material → Estado → Forma del texto → Uso de mayúsculas
   - **Remove** "Personajes representados" (moved to section 3)

5. **Transcripción** (Transcription)
   - [Rich text field with formatting]

6. **Información Adicional** (Additional Information)
   - [Rich text field]

7. **Referencias** (References - NEW)
   - Links to catalogs
   - Free-text bibliographic references

---

## Excel-like Table Interface

### Navigation System

**Cell Navigation** (via `useExcelKeyboard.ts` and `useExcelMode.ts`)

| Action | Keyboard Shortcut | Description |
|--------|------------------|-------------|
| Move selection | `↑` `↓` `←` `→` | Navigate between cells in table |
| First/last column | `Ctrl+←` / `Ctrl+→` | Jump to edge columns in current row |
| Horizontal navigation | `Tab` / `Shift+Tab` | Move to next/previous cell |
| First/last column in row | `Home` / `End` | Jump to row boundaries |
| First/last cell in table | `Ctrl+Home` / `Ctrl+End` | Jump to table boundaries |
| Page navigation | `PageUp` / `PageDown` | Scroll by 10 rows |

**Current Implementation:** Arrow keys work for basic navigation within tables.

**Planned Enhancement:** Row numbering column (Excel-style 1, 2, 3...) fixed during horizontal scrolling.

### Column Management

**Column Operations** (via `useExcelMode.ts`)
- **Reordering:** Drag column headers to reorder (implementation in DataTable)
- **Resizing:** Drag column borders to adjust width (minimum 50px)
- **Hide/Show:** Toggle column visibility via column panel (`Ctrl+F`)
- **Reset:** `Ctrl+R` restores default column configuration

**Column Settings Persistence:**
- Settings stored in component state
- Properties per column: `visible`, `width`, `order`, `sortDirection`, `color`, `locked`
- Actions column always locked (cannot be hidden or reordered)

**Horizontal Scrolling:**
- Tables use `overflow-x-auto` for wide content
- Fixed headers stay visible during vertical scroll (`sticky top-0`)
- Planned: Row numbers column remains fixed during horizontal scroll

### Sorting

**Current State:**
- Default alphabetical sorting on first text-like column (excluding actions)
- Sorting algorithm uses accent-insensitive normalization
- Sorts by display value when `getDisplayValue` function exists (e.g., foreign keys show names)

**Planned Enhancement:**
- Clickable column headers with sort indicators (▲▼)
- Three-state toggle: ascending → descending → no sort
- Visual indicator for active sort column
- Server-side sorting for large datasets (optional optimization)

### Row Selection

**Current:**
- `Shift+Space` - Toggle row selection
- `Ctrl+A` - Select all visible rows
- Selected rows tracked in `selectedRows` Set

**Planned:**
- Row selection checkboxes in fixed left column
- Multi-row operations (copy, delete, bulk edit)
- Visual highlighting of selected rows

### Cell Customization

**Planned Features:**
- Background color customization per cell
- Color picker UI with accessibility validation (contrast checking)
- Persistent cell color storage (user-specific or record-specific)

---

## Advanced Search System

### Search Functionality

**Component:** `SearchBar.tsx`

**Features:**
- **Real-time filtering:** Results update as user types
- **Accent normalization:** "México" matches "Mexico" and vice versa
- **Cross-table searching:** Searches related entity names (e.g., SEM names in exvoto tables)
- **Result counter:** "X de Y" format showing current match and total
- **Navigation:** Prev/Next buttons to cycle through matches
- **Highlighting:** Yellow background on matching text in tables

**Search Algorithm:**
```
1. Normalize search query (lowercase + remove accents)
2. For each row:
   a. Search direct field values
   b. Search display values from getDisplayValue functions
   c. Extract text from React nodes if needed
3. Count total matches across all cells
4. Return filtered data + match count
```

**Current Limitations:**
- Shows only filtered rows (not full context of each match)
- Cannot see sentence/paragraph containing match
- No highlighting style options (only yellow background)

### Planned Improvements

**Full Context Display**
- Show complete sentences containing search terms
- Underline matched text within context (Word-style)
- Display snippet preview with "..." for long content
- Pagination for large result sets

**Enhanced Highlighting**
- Underline option in addition to background color
- Configurable highlight colors
- Preserve formatting in rich text fields

**Search Options**
- Case-sensitive toggle
- Whole word matching
- Regular expression support
- Field-specific search (limit to certain columns)

### Integration with Excel Mode

**Current:**
- Search results passed to `DataTable` via `searchQuery` prop
- `highlightText` utility applies yellow background to matches
- Search can trigger cell selection via `selectCell` method

**Planned:**
- Navigate directly to cell containing match
- Highlight active search result differently from other matches
- Show match index indicator on selected cell ("Match 3 of 15")

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Context | Status |
|----------|--------|---------|--------|
| `n` | Create new record | All list pages | ✅ Implemented |
| `Ctrl+F` | Open filters/columns panel | Table pages | ✅ Implemented |
| `Ctrl+R` | Reset column configuration | Table pages | ✅ Implemented |
| `Ctrl+A` | Select all rows | Table pages | ✅ Implemented |
| `Ctrl+C` | Copy cell content | Table pages | 🔄 Planned |
| `Ctrl+V` | Paste content | Table pages | 🔄 Planned |
| `Ctrl+P` | Print | Detail pages | ✅ Implemented |
| `Ctrl+S` | Export data | Table pages | 🔄 Planned |
| `Esc` | Close modal/dialog/clear selection | All pages | ✅ Implemented |

### Quick Navigation Shortcuts

Available on keyboard shortcuts page (`/atajos`) for fast navigation:

| Key | Destination | String ID |
|-----|-------------|-----------|
| `s` | SEMs page | `nav_quick_sems` |
| `c` | Catalogs page | `nav_quick_catalogs` |
| `v` | Exvotos page | `nav_quick_exvotos` |
| `d` | Divinities page | `nav_quick_divinities` |
| `p` | Characters page | `nav_quick_characters` |
| `m` | Miracles page | `nav_quick_miracles` |

### Cell/Row Actions

| Shortcut | Action | Context | Status | Notes |
|----------|--------|---------|--------|-------|
| `e` | Edit cell/field | Table rows | ⚠️ Inconsistent | Opens read-only mode in SEMs, Catalogs, Divinities |
| `i` | Inspect/view details | Table rows | ⚠️ Partially working | Keyboard shortcuts break after navigation |
| `Shift+E` | Edit entire row | Detail pages | ✅ Working | Navigates to list page with edit mode |
| `p` | Print | Detail pages | ✅ Working | Triggers browser print dialog |
| `Enter` | View cell content | Table cells | ✅ Working | Shows full content in modal (planned) |
| `Shift+Space` | Select/deselect row | Table rows | ✅ Working | - |

### Planned Keyboard Enhancements

**Arrow Navigation Between Records** (Detail Pages)
- `←` / `→` - Navigate to previous/next record in filtered list
- Maintain sort/filter context from table view
- Visual indicators for navigation availability (first/last record)
- Boundary handling (disable at first/last record)

**Copy/Paste Operations** (Tables)
- `Ctrl+C` - Copy selected cell content to clipboard
- `Ctrl+V` - Paste into selected cell
- Multi-cell selection support (planned)
- Clipboard API integration with browser permission handling

**New Tab Navigation**
- `Ctrl+i` or `Cmd+i` - Open inspect/detail view in new tab
- Right-click context menu option
- Avoid browser popup blockers

**Form Navigation**
- Arrow keys (`↑` `↓` `←` `→`) navigate between form fields in modals
- Conflict resolution for dropdowns and text areas
- Focus management between inputs

### Known Issues

**Issue 1: Keyboard Shortcuts Break After Navigation**
- **Trigger:** Using "i" key to inspect record
- **Symptom:** Most shortcuts stop working except `Shift+E`
- **Cause:** Focus management and event handler cleanup issues
- **Impact:** High - breaks keyboard-driven workflow
- **Fix Required:** Refactor keyboard event handlers for consistency

**Issue 2: "e" Key Opens Read-Only Mode**
- **Affected Pages:** SEMs, Catalogs, Divinities
- **Expected:** Should open edit mode
- **Actual:** Opens view/inspect mode instead
- **Working Correctly:** Exvotos page only
- **Fix Required:** Standardize edit behavior across all entity pages

---

## Modal and Form Behavior

### Current Modal Implementation

**Component:** `Modal.tsx`

**Features:**
- Overlay with 60% opacity black background
- Click outside to close
- `Esc` key to close (document-level listener)
- Fixed max-width (`max-w-4xl`)
- Max height 90vh with internal scrolling
- Sticky header with close button

**Aria Attributes:**
- `role="dialog"`
- `aria-modal="true"`
- `aria-label="Cerrar modal"` on close button

### Critical Issue: Data Loss on Modal Close

**Problem:**
When creating a new exvoto, SEM, catalog, etc., clicking outside the modal or pressing `Esc` causes all entered data to be lost without confirmation.

**User Impact:**
- High frustration for users with extensive data entry
- Wasted effort and time
- Risk of accidental closures

**Planned Solutions:**

**Option 1: Confirmation Dialog**
```
User clicks outside modal with unsaved data
  ↓
Show confirmation: "¿Tiene cambios sin guardar. ¿Desea cerrarlos?"
  ↓
Options: [Cancelar] [Guardar] [Descartar]
```

**Option 2: Auto-save to localStorage**
```
User types in form
  ↓
Debounced save to localStorage (every 2 seconds)
  ↓
On modal reopen, restore draft data
  ↓
Provide "Restore draft" option
```

**Option 3: Disable Outside Click for Forms**
- Remove outside-click-to-close behavior for create/edit modals
- Require explicit Save or Cancel button click
- Keep `Esc` key with confirmation if unsaved changes exist

**Recommended Approach:** Combination of Option 1 + Option 2
- Detect form changes (dirty state tracking)
- Show confirmation dialog when attempting to close with unsaved data
- Optionally persist drafts to localStorage for recovery

### Form Validation States

**Current:**
- Basic HTML5 validation (required fields)
- Date format validation via `type="date"` inputs

**Planned:**
- Real-time validation with inline error messages
- Field-level validation on blur
- Form-level validation before submit
- Clear error state indicators (red borders, error icons)
- Accessibility: ARIA error announcements for screen readers

---

## Detail Pages

### View Mode vs Edit Mode

**Current Implementation:**

**View Mode (Default):**
- Read-only display of all fields
- Empty fields hidden (Issue: Users cannot see complete data structure)
- Related entity names shown as clickable links
- `Shift+E` to switch to edit mode (navigates to list page with edit parameter)
- No inline editing

**Edit Mode:**
- Opens in list page with modal
- Form with all editable fields
- Save/Cancel buttons
- Validation before submit

**Issues:**
1. Empty fields disappear in view mode (confusing data structure)
2. No inline editing - must navigate away to edit
3. Edit mode in separate modal breaks context

### Planned Improvements

**Enhanced View Mode:**
- Show all fields including empty ones with "(vacío)" or "-" placeholder
- Clear visual distinction between populated and empty fields
- Tooltips with field descriptions
- Rich text formatting preserved in display

**Inline Editing:**
- Double-click field to enable edit mode for that field
- `e` key on focused field enters edit mode
- Save on blur or `Enter` key
- Cancel on `Esc` key
- Visual indicator for editable fields (subtle hover effect)

**Record Navigation:**
- Previous/Next buttons in header
- Arrow key navigation (`←` `→`) between records
- Maintain filter/sort context from list view
- Breadcrumb shows "Record 3 of 15"

**Behavior Change: Double-Click**
- **Current:** Double-click cell opens view mode (detail page)
- **Planned:** Double-click cell opens edit mode directly
- **Rationale:** Faster data modification workflow

---

## Image Viewer

### Current Implementation

**Exvoto Images:**
- Main image field (blob stored in `exvoto` table)
- Multiple additional images (one-to-many via `exvoto_image` table)
- Thumbnail navigation when multiple images exist
- Click to zoom in modal
- Delete button for active image
- Images displayed as base64 data URLs

**Image Display:**
- Preview size: 320px height (`h-80`), object-contain
- Zoom modal: max 75vh height, centered
- Thumbnails: 64px square (`h-16 w-16`), object-cover
- Active thumbnail highlighted with blue ring

**Current Limitations:**
- No zoom controls (mouse wheel, pinch)
- No download option
- No captions or metadata
- Cannot open in new tab
- Limited navigation between images
- No slideshow mode

### Planned Enhancements

**Enhanced Image Viewer Features:**

1. **New Tab Option**
   - `Ctrl+Click` or `Cmd+Click` on image opens in new tab
   - Right-click context menu "Abrir imagen en nueva pestaña"
   - Dedicated full-screen image page route

2. **Zoom and Pan**
   - Mouse wheel to zoom in/out
   - Click-and-drag to pan when zoomed
   - Zoom percentage indicator (50%, 100%, 200%)
   - Fit-to-screen and actual-size buttons
   - Pinch-to-zoom support on touch devices

3. **Download**
   - "Descargar" button with file naming convention
   - Default filename: `{exvoto_id}_{image_index}.jpg`
   - Option to download all images as ZIP

4. **Navigation Between Images**
   - Arrow keys or on-screen buttons
   - Keyboard shortcuts: `←` / `→` to navigate
   - Image counter: "Imagen 2 de 5"
   - Slideshow mode with auto-advance timer

5. **Image Metadata/Captions**
   - Caption field in `exvoto_image` table (schema change required)
   - Editable captions in management UI
   - Display caption below image in viewer
   - Source/provenance information field

**Image Management UI:**
- Drag-and-drop upload
- Reorder images (set primary image)
- Bulk upload multiple images
- Progress indicators for uploads
- Image compression/optimization on upload
- Format support: JPG, PNG, WebP, GIF

**Schema Changes Required:**
```
exvoto_image table:
  - Add: caption (text, nullable)
  - Add: source (text, nullable)
  - Add: order_index (integer, default 0)

sem_image table (new):
  - id (integer, primary key)
  - sem_id (integer, foreign key)
  - image (blob)
  - caption (text, nullable)
  - source (text, nullable)
  - order_index (integer)

divinity_image table (new):
  - id (integer, primary key)
  - divinity_id (integer, foreign key)
  - image (blob)
  - caption (text, nullable)
  - source (text, nullable)
  - order_index (integer)
```

---

## Rich Text Editing

### Requirements

**Fields Requiring Rich Text:**
- Exvoto: Transcripción (with superscript support)
- Exvoto: Información Adicional
- Exvoto: Forma de texto
- Catalog: Descripción (renamed from "Descripción de la ubicación")

**Required Formatting Options:**
- Paragraphs (line breaks)
- **Bold**
- *Italic*
- <u>Underline</u>
- Text alignment (left, center, right, justify)
- Superscript (specifically for Transcripción field)
- Subscript (optional, for completeness)

**Display Requirements:**
- Formatting preserved in view mode (detail pages)
- Formatting visible in table cell tooltips/floating boxes
- HTML rendering with proper sanitization (XSS prevention)

### Planned Implementation

**Library Selection Criteria:**
- React compatibility
- TypeScript support
- Accessibility features (ARIA, keyboard navigation)
- Reasonable bundle size
- Active maintenance

**Candidate Libraries:**
1. **TipTap** (Recommended)
   - Modern, extensible, well-documented
   - Built on ProseMirror
   - Excellent accessibility support
   - Granular feature control

2. **Lexical** (Facebook)
   - Performant, framework-agnostic core
   - Growing ecosystem
   - Strong accessibility focus

3. **Draft.js** (Facebook)
   - Mature, stable
   - More complex API
   - Larger bundle size

**Recommended Choice:** TipTap for balance of features, size, and developer experience.

**Editor Configuration:**
```jsx
<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar={[
    'bold', 'italic', 'underline',
    'align-left', 'align-center', 'align-right', 'align-justify',
    'superscript', 'subscript',
    'clear-formatting'
  ]}
  placeholder="Escribir aquí..."
  aria-label="Editor de texto enriquecido"
/>
```

**Storage Format:**
- Store as HTML in database (text column)
- Sanitize on server-side before storage (prevent XSS)
- Sanitize on client-side before rendering

**Floating Box Enhancement:**
- Render rich text HTML in tooltips/popovers
- Preserve formatting for readability
- Larger preview boxes for long formatted content
- Scroll if content exceeds max height

**Transcription Field Special Features:**
- Prominent superscript button in toolbar
- Keyboard shortcut for superscript (e.g., `Ctrl+Shift+P`)
- Preview pane showing formatted output
- Font selection: serif style for traditional appearance

---

## Date Input System

### Current Implementation

**Field Type:** `<input type="date">`

**Issues:**
1. Browser-dependent appearance (inconsistent UX)
2. Cannot represent partial dates (unknown month or day)
3. No support for flexible historical dates
4. Difficult keyboard entry (varies by browser)

**Known Bug:** Date discrepancy between table and detail view (timezone/UTC conversion issue)
- Table shows one date
- Detail page shows previous day
- Cause: Inconsistent ISO format handling and timezone interpretation

### Planned Manual Date Entry System

**Format:** `YEAR-MONTH-DAY` (e.g., `1787-05-23`)

**Special Feature: Unknown Value Support**
- Use `X` for unknown month or day
- Examples:
  - `1787-X-23` (unknown month, known day)
  - `1787-05-X` (known month, unknown day)
  - `1787-X-X` (only year known)

**Input Field UI:**
```
┌─────────────────────────────────────┐
│ [1787-05-23___________________]     │
│ Formato: YYYY-MM-DD (use X si des-  │
│ conoce mes o día)                   │
└─────────────────────────────────────┘
```

**Validation Rules:**
1. Year must be 4 digits (1000-2999)
2. Month must be 01-12 or X
3. Day must be 01-31 or X (considering month/year context)
4. Separators must be hyphens
5. Accept partial formats during typing

**Error Messages:**

| Error Condition | Message |
|----------------|---------|
| Invalid year | `error_date_invalid_year` |
| Invalid month | `error_date_invalid_month` |
| Invalid day | `error_date_invalid_day` |
| Invalid format | `error_date_invalid_format` |
| Day exceeds month max | `error_date_day_exceeds_month` |

**Helper Features:**
- Real-time format hints as user types
- Auto-insertion of hyphens (like phone number inputs)
- Datepicker calendar popup (optional assistance)
- Quick buttons for common patterns ("Solo año", "Año y mes")

**Storage:**
- Store as text in SQLite (already text format)
- No conversion needed
- Query support for partial dates (year-only searches, etc.)

**Display:**
- Full date: "23 de mayo de 1787"
- Partial (unknown month): "1787 (mes desconocido)"
- Year only: "1787"
- Localized formatting options

---

## Dropdown Enhancements

### Current Implementation

**Dropdowns Used For:**
- SEM selection in exvoto forms (3 dropdowns: offering, conservation, origin)
- Catalog selection
- Divinity selection (planned)
- Character selection
- Miracle selection
- Gender selection (enum)
- Province selection (enum or text)

**Current Issues:**
1. No alphabetical sorting (items appear in DB insert order)
2. No search/filter functionality
3. Difficult to find items in long lists (50+ SEMs)
4. No keyboard navigation beyond first letter jump

### Planned Improvements

**Alphabetical Sorting:**
- Client-side sort by display name
- Case-insensitive, accent-insensitive collation
- Locale-aware sorting (Spanish alphabetical order)
- Optional: Sort by usage frequency (most-used items first)

**Mini-Search Feature:**
- Search input at top of dropdown
- Filter options as user types
- Accent-insensitive matching
- Highlight matched text in options
- Keyboard navigation through filtered results

**Recommended Component:**
- **react-select** or **Headless UI Combobox**
- Features needed:
  - Searchable
  - Keyboard accessible
  - Virtualization for long lists (performance)
  - Multi-select support (for many-to-many relationships)
  - Custom option rendering

**Example UI:**
```
┌─────────────────────────────────────┐
│ Select SEM                        ▼ │
├─────────────────────────────────────┤
│ [🔍 Buscar...___________________]   │
├─────────────────────────────────────┤
│ ☑ Santuario de Guadalupe (México)  │
│ ☐ Iglesia de San Juan (Sevilla)    │
│ ☐ Ermita de la Virgen (Granada)    │
│ ...                                 │
└─────────────────────────────────────┘
```

**Keyboard Navigation:**
- `↑` / `↓` - Navigate options
- `Enter` - Select highlighted option
- `Esc` - Close dropdown
- Type to search
- `Tab` - Move to next field

**Multi-Select Support:**
- Checkboxes for each option
- Selected items displayed as tags/chips
- "Clear all" and "Select all" options
- Limit selections (optional max count)

**Create New Option:**
- "+Crear nuevo" button at bottom of dropdown
- Opens inline creation form or modal
- Newly created item automatically selected
- Refresh dropdown list with new item

---

## Data Entry Workflows

### Creating Related Entities from Forms

**Current Limitation:**
When creating an exvoto, user must navigate away to create new SEM, Character, or Miracle if it doesn't exist in dropdown.

**Planned Enhancement:**
Inline creation of related entities directly from parent form.

**Example: Creating Character from Exvoto Form**
```
User flow:
1. User opens "Crear Exvoto" modal
2. Selects "Personajes representados" dropdown
3. Clicks "+Crear nuevo personaje" button in dropdown
4. Inline modal opens (modal-within-modal)
5. User fills character name and details
6. Clicks "Guardar" on character form
7. Character is created via API
8. Character dropdown refreshes with new item
9. New character automatically selected
10. User continues with exvoto form
```

**UI Pattern:**
```
Personajes representados ▼
  ┌──────────────────────────────────┐
  │ [🔍 Buscar personaje...]         │
  │ ─────────────────────────────────│
  │ Campesino                        │
  │ Niño enfermo                     │
  │ Soldado                          │
  │ ─────────────────────────────────│
  │ [+ Crear nuevo personaje]        │
  └──────────────────────────────────┘
          ↓ (click)
  ┌──────────────────────────────────┐
  │ Crear Personaje            [✕]   │
  ├──────────────────────────────────┤
  │ Nombre: [________________]       │
  │ Descripción: [____________       │
  │              ____________]       │
  │                                  │
  │     [Cancelar]  [Guardar]        │
  └──────────────────────────────────┘
```

**Technical Considerations:**
- Z-index management for nested modals
- Focus trap for nested modal (accessibility)
- Escape key behavior (close which modal?)
- Form state preservation when nesting

**Applicable To:**
- Characters (from exvoto form)
- Miracles (from exvoto form)
- SEMs (from exvoto form)
- Exvotos (from SEM detail page - planned)

### Bidirectional Entity Creation

**Current:** Exvotos can create SEMs, but SEMs cannot create Exvotos

**Planned:**
- SEM detail page: "Crear nuevo exvoto" button
- Pre-populate SEM fields (offering or conservation SEM)
- Same inline creation pattern
- Show list of linked exvotos on SEM detail page

### Copy/Duplicate Row Functionality

**Use Case:**
User is cataloging multiple similar exvotos (e.g., from same collection, same divinity, similar date range).

**Workflow:**
```
1. Select row(s) in table (checkboxes)
2. Click "Copiar fila(s)" button or Ctrl+D
3. Duplicate creation modal opens
4. Form pre-filled with source data
5. Excluded fields: ID, unique identifiers (internal_id)
6. User modifies as needed
7. Save creates new record(s)
```

**UI Elements:**
- Row selection checkboxes in first column
- "Copiar selección" button in toolbar (enabled when rows selected)
- Clear indication of which fields are copied
- Option to bulk edit copied fields before saving

**Field Copy Rules:**
| Field Type | Copy Behavior |
|------------|---------------|
| Primary key (id) | Never copy |
| Unique identifier (internal_id) | Never copy |
| Dates | Copy, but highlight for review |
| Foreign keys | Copy |
| Text fields | Copy |
| Images | Optionally copy (user choice) |

---

## UI Copy Strings

### Navigation and Global Actions

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Header nav: Exvotos | `nav_exvotos` | Exvotos | Main navigation link |
| Header nav: SEMs | `nav_sems` | SEM (Lugares) | Main navigation link |
| Header nav: Catalogs | `nav_catalogs` | Catálogos | Main navigation link |
| Header nav: Divinities | `nav_divinities` | Divinidades | Main navigation link |
| Header nav: Characters | `nav_characters` | Personajes | Main navigation link |
| Header nav: Miracles | `nav_miracles` | Milagros | Main navigation link |
| Header nav: Shortcuts | `nav_shortcuts` | Atajos | Keyboard shortcuts reference page |
| App title | `app_title` | ExvoRed | Application name in header |
| Back to list | `btn_back_to_list` | ← Volver a la lista | Breadcrumb on detail pages |

### Table Interface

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Search placeholder | `search_placeholder` | Buscar... | Search input placeholder |
| Search no results | `search_no_results` | Sin resultados | When search returns no matches |
| Search result counter | `search_result_counter` | {current} de {total} | "3 de 15" format |
| Previous result button | `btn_prev_result` | Resultado anterior | Search navigation tooltip |
| Next result button | `btn_next_result` | Siguiente resultado | Search navigation tooltip |
| Clear search | `btn_clear_search` | [X icon] | Button to clear search query |
| Column panel toggle | `btn_toggle_columns` | Columnas | Show/hide column panel |
| Reset columns | `btn_reset_columns` | Restablecer columnas | Reset to default configuration |
| Select all rows | `btn_select_all` | Seleccionar todo | Ctrl+A action label |

### Actions and Buttons

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| View details button | `btn_view_details` | Ver detalles | Table row action |
| Edit button | `btn_edit` | Editar | Table row / detail page action |
| Delete button | `btn_delete` | [Trash icon] | Table row action |
| Save button | `btn_save` | Guardar | Form submit button |
| Cancel button | `btn_cancel` | Cancelar | Form cancel button |
| Create new | `btn_create_new` | Crear nuevo | Opens create modal |
| Enlarge image | `btn_enlarge_image` | Ampliar | Image viewer |
| Delete image | `btn_delete_image` | Eliminar imagen | Image management |
| Download image | `btn_download_image` | Descargar | Image viewer (planned) |
| Print | `btn_print` | Imprimir | Detail page print action |
| Export | `btn_export` | Exportar | Table export action (planned) |

### Form Fields (Exvotos)

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Internal ID | `field_internal_id` | ID Interno | Exvoto identifier |
| Date | `field_date` | Fecha | Miracle date |
| Epoch | `field_epoch` | Época (25 años) | 25-year epoch interval |
| Miracle | `field_miracle` | Milagro | Miracle type |
| Miracle place | `field_miracle_place` | Lugar del Milagro | Location where miracle occurred |
| Province | `field_province` | Provincia | Geographic province |
| Offering SEM | `field_offering_sem` | Lugar de Ofrenda | Where exvoto was offered |
| Conservation SEM | `field_conservation_sem` | Lugar de Conservación | Where exvoto is stored |
| Origin place | `field_origin_place` | Lugar de Origen | Devotee's origin (text field) |
| Benefited name | `field_benefited_name` | Beneficiado | Person who received miracle |
| Offerer name | `field_offerer_name` | Oferente | Person who offered exvoto |
| Offerer gender | `field_offerer_gender` | Género del Oferente | Male/Female/Both/Unknown |
| Offerer relation | `field_offerer_relation` | Relación Oferente-Beneficiado | Relationship between parties |
| Profession | `field_profession` | Profesión | Offerer's profession |
| Social status | `field_social_status` | Estatus Social | Social class |
| Characters | `field_characters` | Personajes representados | Characters depicted in exvoto |
| Material | `field_material` | Material | Physical material |
| Dimensions | `field_dimensions` | Dimensiones | Size measurements |
| Conservation status | `field_conservation_status` | Estado de Conservación | Physical condition |
| Transcription | `field_transcription` | Transcripción | Text transcription |
| Additional info | `field_additional_info` | Información Adicional | Extra notes |
| Text case | `field_text_case` | Uso de Mayúsculas | Capitalization usage |
| Text form | `field_text_form` | Forma del Texto | Text structure |
| Virgin or saint | `field_virgin_saint` | Virgen/Santo | Divinity honored |

### Form Fields (SEMs)

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| SEM name | `field_sem_name` | Nombre | Sanctuary/shrine name |
| SEM type | `field_sem_type` | Tipo | Sanctuary/Museum/Shrine |
| Location | `field_sem_location` | Ubicación | Physical address |
| Province | `field_sem_province` | Provincia | Geographic province |
| Description | `field_sem_description` | Descripción | SEM description |
| Status | `field_sem_status` | Estado | Active/Disappeared (planned) |

### Form Fields (Catalogs)

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Catalog title | `field_catalog_title` | Título | Publication title |
| Author | `field_catalog_author` | Autor | Publication author |
| Year | `field_catalog_year` | Año | Publication year |
| Number of exvotos | `field_catalog_exvoto_count` | Nº de Exvotos | Count field |
| Description | `field_catalog_description` | Descripción | Rich text description |
| Related SEMs | `field_catalog_related_sems` | SEM incluidos en el catálogo | Multi-select SEM picker |
| Provinces | `field_catalog_provinces` | Provincias | Auto-populated from SEMs |

### Status and Confirmation Messages

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Loading | `msg_loading` | Cargando... | Data fetch in progress |
| Saving | `msg_saving` | Guardando... | Save operation in progress |
| Saved | `msg_saved` | Guardado | Save successful |
| Error saving | `msg_error_saving` | Error al guardar | Save failed |
| Delete confirmation | `confirm_delete` | ¿Estás seguro de que deseas eliminar este elemento? | Delete confirmation dialog |
| Unsaved changes | `confirm_unsaved_changes` | Tiene cambios sin guardar. ¿Desea cerrar? | Modal close warning (planned) |
| No data | `msg_no_data` | No hay datos para mostrar | Empty state |
| Not found | `msg_not_found` | No se encontró el {entity} | Entity not found error |
| Loading error | `msg_loading_error` | Error al cargar los detalles | Fetch error |

### Accessibility Labels

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Close modal | `aria_close_modal` | Cerrar modal | Close button aria-label |
| Search input | `aria_search` | Buscar en tabla | Search field aria-label |
| Rich text editor | `aria_rich_editor` | Editor de texto enriquecido | Editor aria-label |
| Image preview | `aria_image_preview` | Vista previa de imagen | Image alt text pattern |
| Column sort | `aria_sort_column` | Ordenar por {column} | Sort button aria-label |

### Keyboard Shortcut Labels

| Component/Location | String ID | English Copy | Context/Notes |
|-------------------|-----------|--------------|---------------|
| Shortcuts page title | `shortcuts_page_title` | Atajos de Teclado | Page heading |
| Shortcuts page subtitle | `shortcuts_page_subtitle` | Consulta todos los atajos disponibles en la aplicación | Page description |
| Global shortcuts section | `shortcuts_section_global` | Atajos globales por página | Section heading |
| Table navigation section | `shortcuts_section_table_nav` | Navegación en tablas tipo Excel | Section heading |
| Cell actions section | `shortcuts_section_cell_actions` | Acciones en celdas y registros | Section heading |
| Global actions section | `shortcuts_section_global_actions` | Acciones globales | Section heading |
| Quick nav section | `shortcuts_section_quick_nav` | Navegación rápida entre secciones | Section heading |
| Shortcuts note | `shortcuts_note` | Nota: algunos atajos se desactivan si hay un modal abierto o si estás escribiendo en un campo de texto | Disclaimer notice |

---

## Accessibility Considerations

### Keyboard Navigation

**Focus Management:**
- Visible focus indicators on all interactive elements (blue outline)
- Logical tab order through forms and tables
- Focus trap within modals (cannot tab outside)
- Return focus to trigger element when closing modal

**Skip Links:**
- "Skip to main content" link (currently not implemented)
- Should appear at top of page for screen reader users

**Keyboard Shortcuts:**
- All major actions accessible via keyboard
- Shortcuts documented in `/atajos` page
- Shortcuts disabled when typing in input fields
- No single-key shortcuts that conflict with browser/screen reader functions

### ARIA Attributes and Roles

**Current Implementation:**

| Element | ARIA Attributes | Purpose |
|---------|----------------|---------|
| Modal | `role="dialog"`, `aria-modal="true"` | Identify modal dialogs |
| Close button | `aria-label="Cerrar modal"` | Screen reader label |
| Table | (none currently) | Should add `role="table"` |
| Search input | (none currently) | Should add `aria-label="Buscar"` |

**Required Additions:**

| Element | Required ARIA | Purpose |
|---------|--------------|---------|
| Tables | `role="table"`, `aria-label="Tabla de {entity}"` | Identify data tables |
| Column headers | `scope="col"` | Associate headers with columns |
| Row headers | `scope="row"` | Associate headers with rows |
| Search results | `aria-live="polite"`, `aria-atomic="true"` | Announce search result count |
| Form errors | `aria-invalid="true"`, `aria-describedby="{error-id}"` | Associate errors with fields |
| Rich text editor | `role="textbox"`, `aria-multiline="true"` | Identify editable region |
| Dropdowns | `role="combobox"`, `aria-expanded`, `aria-controls` | Accessible select pattern |

### Screen Reader Support

**Announcements Needed:**

1. **Search Results:** "15 resultados encontrados para '{query}'"
2. **Navigation:** "Mostrando resultado 3 de 15"
3. **Save Status:** "Guardado exitosamente" / "Error al guardar"
4. **Loading States:** "Cargando datos..."
5. **Form Validation:** "Campo requerido: {field name}"

**Implementation:**
```jsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```

**Table Navigation Announcements:**
- Current cell position: "Fila 3, Columna 'Nombre'"
- Sort state: "Columna 'Fecha' ordenada ascendente"
- Filter state: "Filtro aplicado: provincia = Sevilla"

### Color and Visual Accessibility

**Contrast Requirements:**
- Text on background: Minimum 4.5:1 (AA standard)
- Large text (18pt+): Minimum 3:1
- Interactive elements: Minimum 3:1 against background

**Current Palette (Tailwind):**
- Primary text: `slate-900` (#0f172a) on white = 19.36:1 ✅
- Secondary text: `slate-700` (#334155) on white = 11.71:1 ✅
- Disabled text: `slate-400` (#94a3b8) on white = 3.26:1 ⚠️
- Links: `blue-600` (#2563eb) on white = 8.59:1 ✅
- Error text: `red-600` (#dc2626) on white = 5.93:1 ✅

**Search Highlight:**
- Current: Yellow background (#FFFF00) with dark text
- Contrast check needed for accessibility
- Consider alternative highlight colors or text color adjustment

**Cell Color Customization:**
- Planned feature requires contrast validation
- Prevent users from selecting inaccessible color combinations
- Provide color picker with built-in contrast checker
- Suggest accessible alternatives when contrast insufficient

**Visual Indicators Beyond Color:**
- Error states: Red text + icon (not color alone)
- Success states: Green text + checkmark
- Required fields: Asterisk (*) + color
- Sort direction: Arrow icon + color
- Selected rows: Checkbox + background color

### Form Accessibility

**Labels:**
- All inputs have associated `<label>` elements
- Labels use `for` attribute matching input `id`
- Placeholder text is supplementary, not replacement for label

**Error Messaging:**
```jsx
<div>
  <label htmlFor="fecha">Fecha *</label>
  <input
    id="fecha"
    type="text"
    aria-invalid={hasError}
    aria-describedby={hasError ? "fecha-error" : undefined}
  />
  {hasError && (
    <div id="fecha-error" role="alert">
      Formato inválido. Use YYYY-MM-DD
    </div>
  )}
</div>
```

**Required Fields:**
- Visual indicator: Asterisk (*) after label
- Aria attribute: `aria-required="true"`
- Validation: Clear error messages on submit

---

## Responsive Design

### Current Implementation

**Breakpoints (Tailwind):**
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up
- `2xl:` - 1536px and up

**Layout Adaptations:**

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|-------------------|
| Header nav | Stacked (planned) | Horizontal wrap | Full horizontal menu |
| Data tables | Horizontal scroll | Horizontal scroll | Full width visible |
| Detail page | Single column | Single column | 2-column (details + image) |
| Search bar | Full width | Full width + controls | Inline with controls |
| Modals | 95vw width | 90vw width | max-w-4xl |
| Column panel | Full screen overlay | Sidebar | Sidebar |

**Mobile Considerations:**

1. **Table Scrolling:**
   - Currently: Horizontal scroll on narrow screens
   - Issue: Difficult to navigate wide tables on mobile
   - Planned: Responsive card view toggle for mobile

2. **Keyboard Shortcuts:**
   - Not applicable on touch devices
   - Should hide keyboard shortcut indicators on mobile
   - Touch gestures as alternative (swipe to navigate, long-press to edit)

3. **Form Inputs:**
   - Date inputs: Native date picker on mobile (type="date")
   - Dropdowns: Native select on mobile for better UX
   - Rich text editor: Simplified toolbar on small screens

4. **Image Viewer:**
   - Pinch-to-zoom support
   - Swipe to navigate between images
   - Full-screen mode

**Responsive Images:**
```jsx
// Srcset for different screen densities
<img
  src="image.jpg"
  srcSet="image-1x.jpg 1x, image-2x.jpg 2x"
  alt="Exvoto"
/>
```

**Touch Targets:**
- Minimum 44x44px for touch (WCAG 2.1 AAA)
- Spacing between interactive elements (at least 8px)
- Larger buttons on mobile (increased padding)

### Planned Mobile Optimizations

**Responsive Table View:**
- Toggle between table and card view
- Card view shows priority fields only
- Tap card to expand full details
- Swipe cards horizontally for quick browsing

**Mobile Navigation:**
- Hamburger menu for main navigation
- Bottom navigation bar for quick actions
- Floating action button for "Create new"

**Gesture Support:**
- Swipe left/right to navigate between records (detail pages)
- Pull-to-refresh for table data
- Long-press on row for context menu (edit, delete, copy)
- Pinch-to-zoom on images

---

## Notes

### Design System Consistency

**Typography Scale:**
- Page titles: `text-3xl` (30px)
- Section headings: `text-xl` to `text-2xl` (20-24px)
- Body text: `text-base` (16px)
- Small text: `text-sm` (14px)
- Tiny text: `text-xs` (12px)

**Spacing Scale:**
- Component gaps: `space-y-4` to `space-y-8` (16-32px)
- Section padding: `p-6` to `p-8` (24-32px)
- Modal padding: `p-4` header, `p-6` content

**Color Semantics:**
- Primary action: Blue (`blue-600`, `blue-500`)
- Destructive action: Red (`red-600`)
- Secondary action: Slate (`slate-200`, `slate-300`)
- Success: Green (to be defined consistently)
- Warning: Yellow (to be defined)

### Component Reusability

**Reusable Patterns:**
- `DetailField` component for consistent field display
- `Modal` component for all dialogs
- `SearchBar` component across all list pages
- `DataTable` component for all entity tables
- `EpochSelector` for date range selection

**Component Library Gaps:**
- No consistent button component (inline styles vary)
- No form field wrapper component
- No loading spinner component
- No toast/notification system

### Future UX Enhancements

**Priority Order:**
1. Fix keyboard shortcut consistency issues
2. Prevent data loss in modals (unsaved changes warning)
3. Implement inline editing on detail pages
4. Add rich text editor for long-form fields
5. Enhance image viewer with zoom and download
6. Add manual date entry with partial date support
7. Implement searchable dropdowns
8. Add row numbering and copy functionality
9. Enable CSV/Excel export
10. Implement advanced filtering system

**User Research Needs:**
- Validate proposed double-click behavior change
- Test inline entity creation workflows
- Assess need for mobile card view vs. table scrolling
- Gather feedback on rich text editor feature set
- Determine priority fields for mobile card view

---

**Document Version:** 1.0
**Contributors:** UX Writer Agent
**Status:** Initial comprehensive documentation based on codebase analysis and planning documents
