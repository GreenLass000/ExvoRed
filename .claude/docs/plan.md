# ExvoRed Development Plan

## Scope Summary

This plan encompasses critical bug fixes, feature enhancements, and UX improvements for the ExvoRed votive offerings catalog application. The primary objectives are:

- **Fix critical functionality gaps** (deletion operations, keyboard shortcuts, data persistence)
- **Enhance user experience** with improved search, navigation, and editing workflows
- **Complete entity relationships** (Divinities ↔ SEMs ↔ Exvotos ↔ Catalogs)
- **Implement rich text editing** for long-form content fields
- **Improve image management** across all entities

**Critical Dependencies:**
- Rich text editor library selection (e.g., TipTap, Lexical)
- Modal/dialog refactoring for consistent UX patterns
- Database schema updates for new relationships and fields

**Expected Outcomes:**
- Elimination of data loss scenarios
- Complete CRUD operations for all entities
- Streamlined keyboard-driven workflows
- Enhanced data discoverability through improved search and navigation

---

## High Priority

### `fix-delete-operations` - Fix Missing Delete Functionality
**Priority**: High

**Description**: Users cannot delete rows from tables, and cannot delete or edit Miracles (milagros) or Characters (personajes). This is a critical gap in CRUD operations that blocks data management workflows.

**Cross-Impact**:
- **API**: Verify DELETE endpoints exist and are properly wired for all entities (miracles, characters, all main tables)
- **Data**: No schema changes required
- **UX**: Add delete confirmation dialogs; ensure delete buttons/actions are visible and functional in tables and detail pages
- **Tests**: Add integration tests for delete operations across all entities
- **Risk**: Data loss if delete confirmations are not implemented; need to handle foreign key constraints properly

---

### `prevent-data-loss-on-modal-close` - Prevent Data Loss When Clicking Outside Modal
**Priority**: High

**Description**: When adding a new exvoto, SEM, catalog, etc., clicking outside the modal without saving causes all entered data to be lost. This is a critical UX flaw causing user frustration and wasted effort.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Implement unsaved changes detection; show confirmation dialog before closing modal; optionally persist draft data to localStorage
- **Tests**: Add E2E tests for modal close scenarios with unsaved data
- **Risk**: Must balance between preventing data loss and not annoying users with excessive confirmations

---

### `fix-keyboard-shortcuts-consistency` - Fix Keyboard Shortcuts Across All Entities
**Priority**: High

**Description**: The "e" key opens read-only mode in SEMs, Catalogs, and Divinities (only works correctly in Exvotos). After using "Inspect (i)", most keyboard shortcuts stop working except Shift+E. This breaks keyboard-driven workflows.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Fix keyboard event handlers to work consistently across all entity pages; ensure focus management after navigation maintains shortcut functionality
- **Tests**: Add keyboard interaction tests for all entity pages; test shortcut persistence after navigation
- **Risk**: May require refactoring of routing/focus management; could have subtle bugs across different browsers

---

### `fix-exvoto-date-discrepancy` - Fix Date Display Discrepancy Between Table and Detail View
**Priority**: High

**Description**: Dates shown in the exvotos table differ from those in the detail page (detail page shows one day earlier). This is likely a timezone/UTC conversion bug causing data integrity confusion.

**Cross-Impact**:
- **API**: Review date serialization/deserialization; ensure consistent ISO format handling
- **Data**: No schema changes (SQLite text dates should remain ISO format)
- **UX**: Ensure all date displays use consistent formatting logic
- **Tests**: Add unit tests for date conversion utilities; integration tests comparing table vs. detail dates
- **Risk**: May affect existing data if dates were stored incorrectly; need migration plan if schema interpretation changes

---

### `fix-catalog-fields-not-saving` - Fix Catalog Fields Not Persisting
**Priority**: High

**Description**: Several catalog fields fail to save: "Nº de Exvotos" (number of exvotos), "Lugares relacionados" (related places). Additionally, "Lugares relacionados" should be renamed to "SEM incluidos en el catálogo" and properly linked to the SEM table.

**Cross-Impact**:
- **API**: Debug save endpoints for catalogs; fix field mapping issues; implement proper SEM relationship handling
- **Data**: May require schema update to clarify SEM↔Catalog relationship via `catalog_sem` junction table
- **UX**: Update form labels; ensure all fields appear in forms and are properly bound
- **Tests**: Add tests for catalog creation/update with all fields populated
- **Risk**: May reveal deeper issues with form validation or ORM mapping

---

### `link-exvotos-divinities` - Link Exvotos with Divinities Table
**Priority**: High

**Description**: Create a relationship between exvotos and divinities so users can associate which divinity (Virgin/Saint) each votive offering was dedicated to.

**Cross-Impact**:
- **API**: Add `divinity_id` foreign key to exvotos table; update CRUD endpoints to handle divinity relationship
- **Data**: **Schema change required** - add `divinity_id` field to `exvoto` table; create migration
- **UX**: Add divinity selector in exvoto forms; display divinity name in exvoto tables and detail pages
- **Tests**: Test exvoto creation/editing with divinity selection; test filtering by divinity
- **Risk**: Existing exvotos will have null divinity_id initially; need to handle nullable relationship gracefully

---

### `link-sems-divinities` - Complete SEM↔Divinity Relationship
**Priority**: High

**Description**: The `divinity_sem` junction table exists in schema but is not fully implemented in the UI. Users need to associate multiple divinities with each SEM and view this data.

**Cross-Impact**:
- **API**: Implement endpoints for managing `divinity_sem` relationships (add/remove associations)
- **Data**: Junction table exists; no schema changes needed (verify indexes for performance)
- **UX**: Add multi-select divinity picker in SEM detail pages; display list of associated divinities
- **Tests**: Test adding/removing divinity associations; test that SEMs can have multiple divinities
- **Risk**: Need to handle many-to-many relationship properly in UI; consider performance if SEMs have many divinities

---

### `fix-oldest-modified-filter` - Fix "Oldest Modified" Filter Not Working
**Priority**: High

**Description**: The "más antiguo (modif.)" (oldest modified) filter in exvotos table does not work correctly, making it difficult to find records that haven't been updated recently.

**Cross-Impact**:
- **API**: Debug sorting logic for `updated_at` field; ensure timestamps are being updated properly on modifications
- **Data**: Verify `updated_at` field exists and is maintained via triggers or ORM hooks
- **UX**: Fix filter/sort UI to properly apply oldest-first sorting
- **Tests**: Add tests for all sorting options (newest/oldest by creation and modification)
- **Risk**: If `updated_at` wasn't being maintained, historical data may be inaccurate

---

## Medium Priority

### `improve-search-context-display` - Improve Search with Full Context Display
**Priority**: Medium

**Description**: Current search shows limited context. Users want to see the complete list of search results with the searched term **underlined within the sentence** (Word-style highlighting), allowing them to understand the context of each match.

**Cross-Impact**:
- **API**: No changes required (search already works)
- **Data**: No schema changes
- **UX**: Enhance `SearchBar.tsx` and `highlightText.tsx` to show full sentences/context; implement text underlining (in addition to or instead of yellow background); consider pagination for large result sets
- **Tests**: Add visual regression tests for search highlighting
- **Risk**: Performance concerns if displaying hundreds of full-context results simultaneously

---

### `open-inspect-in-new-tab` - Allow Inspect (i) to Open in New Tab
**Priority**: Medium

**Description**: When pressing "i" to inspect a record or image, give users the option to open the detail view in a new browser tab instead of navigating in the current tab. This allows referencing multiple records simultaneously.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Modify "i" keyboard handler to check for modifier keys (Ctrl/Cmd+i for new tab); alternatively add right-click context menu; update KeybindsPage documentation
- **Tests**: Test keyboard navigation with modifiers; ensure deep links work correctly
- **Risk**: Browser popup blockers may interfere; need fallback UX

---

### `arrow-navigation-between-records` - Navigate Between Record Detail Pages with Arrows
**Priority**: Medium

**Description**: When viewing a detail page (exvoto, SEM, etc.), allow users to navigate to the previous/next record using arrow keys, similar to browsing a photo gallery.

**Cross-Impact**:
- **API**: May need endpoint to fetch previous/next record IDs efficiently (or client-side using cached list)
- **Data**: No schema changes
- **UX**: Implement prev/next navigation in detail pages; maintain current sort/filter context from table view; add visual indicators (buttons + keyboard hints)
- **Tests**: Test navigation with different sorting orders; test boundary conditions (first/last record)
- **Risk**: Complex state management to maintain filter/sort context across navigation; performance if fetching records individually

---

### `add-row-numbering` - Add Excel-Style Row Numbering
**Priority**: Medium

**Description**: Tables should display row numbers like Excel (1, 2, 3...) in a fixed first column to help users reference specific rows and understand dataset size at a glance.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Update `DataTable.tsx` to include row number column; ensure it stays fixed during horizontal scrolling; update column management to exclude row numbers from hide/show
- **Tests**: Visual tests for row numbering with scrolling and sorting
- **Risk**: None significant; purely visual enhancement

---

### `improve-floating-boxes-readability` - Improve Floating Cell Preview Boxes
**Priority**: Medium

**Description**: Current floating boxes (tooltips/popovers for long cell content) are hard to read. Users want larger boxes that display more text at once for better readability.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Redesign tooltip/popover components to be larger; consider modal-style previews for very long content; ensure responsive behavior doesn't cover important UI
- **Tests**: Visual regression tests for various content lengths
- **Risk**: Large tooltips may obstruct other content; need good positioning logic

---

### `copy-paste-keyboard-support` - Enable Ctrl+C / Ctrl+V in Cells
**Priority**: Medium

**Description**: Allow standard keyboard shortcuts (Ctrl+C, Ctrl+V) to copy and paste content within table cells, improving data entry efficiency especially for repetitive data.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Extend `useExcelKeyboard.ts` to handle clipboard operations; ensure compatibility with existing keyboard navigation; handle multi-cell selection if implementing copy-entire-row feature
- **Tests**: Test copy/paste with different cell types (text, numbers, dates); test cross-browser clipboard API compatibility
- **Risk**: Browser clipboard API permissions vary; may need fallback for older browsers

---

### `copy-entire-rows` - Enable Copying Entire Rows for Duplication
**Priority**: Medium

**Description**: Allow users to select and copy entire rows to duplicate records with similar data, reducing repetitive data entry for batches of similar exvotos or other entities.

**Cross-Impact**:
- **API**: No changes required (uses existing create endpoints)
- **Data**: No schema changes
- **UX**: Add row selection checkboxes; implement "Copy Row" action; create new record form pre-filled with copied data (excluding ID and unique fields)
- **Tests**: Test row copying with validation; ensure IDs are not duplicated; test with related entities
- **Risk**: Complex validation needed to determine which fields should/shouldn't be copied; potential for accidental data duplication

---

### `double-click-edit-mode` - Double-Click Cell Opens Edit Mode (Not View Mode)
**Priority**: Medium

**Description**: Currently double-clicking a cell opens view/read mode. This should open edit mode directly for faster data modification.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Change double-click handler in `DataTable.tsx` to trigger edit mode; ensure single-click and "e" key still work as expected; update KeybindsPage documentation
- **Tests**: Test double-click behavior across all entity tables
- **Risk**: May conflict with existing click handling; need to ensure accessibility for keyboard-only users

---

### `keyboard-navigation-new-records` - Arrow Key Navigation When Creating Records
**Priority**: Medium

**Description**: When creating new records in modal forms, allow arrow keys (↑ ↓ ← →) to navigate between form fields, consistent with Excel-like navigation in tables.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Extend `useExcelKeyboard.ts` or create similar hook for forms; handle focus management between inputs; ensure doesn't conflict with dropdowns/multi-line text areas
- **Tests**: Test arrow navigation in create/edit forms across all entities
- **Risk**: Arrow keys have default behavior in some inputs (text navigation, dropdown selection); need careful conflict resolution

---

### `add-exvoto-references-field` - Add References Field to Exvotos
**Priority**: Medium

**Description**: Add a new "Referencias" (References) field to exvotos for bibliographic citations, with links to the Catalogs table. Clicking a catalog reference should navigate to that catalog's detail page.

**Cross-Impact**:
- **API**: Add `references` text field to exvoto endpoints; leverage existing `catalog_exvoto` junction table for linkage
- **Data**: **Schema change required** - add `references` text field to `exvoto` table; ensure `catalog_exvoto` junction properly supports this use case
- **UX**: Add references input in exvoto forms; implement catalog linking UI (searchable dropdown or tags); add clickable catalog links in detail view
- **Tests**: Test reference field creation/editing; test catalog link navigation
- **Risk**: May overlap with existing `catalog_exvoto` relationship; need clear UX distinction between linked catalogs and free-text references

---

### `reorder-exvoto-columns` - Reorder Exvoto Table Columns
**Priority**: Medium

**Description**: Adjust column order in exvoto table: move "Imagen" (Image) column to the end, and move "Lugar de origen" (Place of origin) between "Estatus social" (Social status) and "Milagro" (Miracle).

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Update default column order in `ExvotoPage.tsx`; ensure user column reordering persists to localStorage
- **Tests**: Visual tests for column order
- **Risk**: None significant; users with saved column preferences may need to reset

---

### `fix-exvoto-cell-display-ids` - Display Names Instead of IDs in Exvoto View Mode
**Priority**: Medium

**Description**: In exvoto view mode, some cells show numeric IDs instead of human-readable text for SEM ofrenda (offering SEM), SEM conservación (conservation SEM), and Imagen (Image). These should display names and be clickable to navigate to the related SEM detail page in a new tab.

**Cross-Impact**:
- **API**: Ensure API responses include related entity names (use joins or separate lookups)
- **Data**: No schema changes (relationships already exist)
- **UX**: Update display logic to show names; make SEM cells clickable links; ensure new tab behavior
- **Tests**: Test related entity display and navigation across all exvotos
- **Risk**: Performance impact if not using proper joins; need efficient data loading

---

### `add-miracles-characters-from-exvoto-form` - Create Miracles/Characters Directly from Exvoto Form
**Priority**: Medium

**Description**: When creating/editing an exvoto, allow users to add new miracles and characters directly from the form (instead of having to navigate away to create them first).

**Cross-Impact**:
- **API**: No changes required (create endpoints exist)
- **Data**: No schema changes
- **UX**: Add "Create New" buttons/dialogs within miracle and character dropdowns in exvoto form; implement inline creation modals
- **Tests**: Test inline creation flow; ensure newly created items appear in dropdown immediately
- **Risk**: Modal-within-modal complexity; need clean UX to avoid confusion

---

### `alphabetical-searchable-sem-dropdowns` - Make SEM Dropdowns Alphabetical and Searchable
**Priority**: Medium

**Description**: In exvoto forms (and elsewhere), SEM dropdown options should be sorted alphabetically and include a search/filter feature to quickly find SEMs in long lists.

**Cross-Impact**:
- **API**: Optionally add search parameter to SEM list endpoint for server-side filtering
- **Data**: No schema changes
- **UX**: Implement searchable select component (consider using library like react-select); ensure alphabetical sorting
- **Tests**: Test search functionality with large SEM lists; test keyboard navigation in searchable dropdown
- **Risk**: Library choice may affect bundle size; need accessible implementation

---

### `manual-date-entry-with-partial-dates` - Enable Manual Date Entry with Unknown Month/Day Support
**Priority**: Medium

**Description**: Date fields should allow manual text entry in `YEAR-MONTH-DAY` format with support for unknown values (e.g., `1787-X-01` for unknown month). This replaces `<input type="date">` with text input + validation.

**Cross-Impact**:
- **API**: Update date validation to accept "X" as placeholder; ensure database stores these partial dates correctly
- **Data**: No schema changes (SQLite text dates already support this)
- **UX**: Replace date inputs with text inputs; add format hint/placeholder; implement validation with helpful error messages
- **Tests**: Test date parsing with various formats; test validation error messages; test storage and retrieval of partial dates
- **Risk**: User input validation complexity; need clear documentation of expected format

---

### `add-exvoto-gender-options` - Update Exvoto Gender Field Options
**Priority**: Medium

**Description**: Modify gender field in exvotos: add "Ambos" (Both) and "Desconocido" (Unknown) options; remove "Otro" (Other).

**Cross-Impact**:
- **API**: Update gender enum/validation to match new options
- **Data**: **Schema change required** - update gender field constraints/enum; migrate existing "Otro" records to "Desconocido" or require manual review
- **UX**: Update gender dropdown in forms; ensure backward compatibility during migration
- **Tests**: Test form validation with new options; test migration of existing records
- **Risk**: Existing "Otro" records need migration strategy; consult with users before migrating data

---

### `reorganize-exvoto-detail-sections` - Reorganize Exvoto Detail Page Sections
**Priority**: Medium

**Description**: Restructure exvoto detail page into clearer sections:

1. **Ubicación** (Location): Lugar de ofrenda + Lugar de conservación + Provincia
2. **Detalles del Milagro** (Miracle Details): Date (YEAR/MONTH/DAY format), Miracle type
3. **Personas involucradas** (People Involved): Add "Personajes representados" and "Lugar de origen devoto/a" (moved from Location)
4. **Descripción del Exvoto** (Exvoto Description): Material → Estado → Forma del texto → Uso de mayúsculas (remove "Personajes representados")
5. **Transcripción** (Transcription)
6. **Información Adicional** (Additional Information)
7. **Referencias** (References - new): Links to catalogs + free text

**Cross-Impact**:
- **API**: No changes required (data model stays same, just display reorganization)
- **Data**: No schema changes (see `add-exvoto-references-field` for Referencias)
- **UX**: Refactor exvoto detail page layout; ensure all fields remain editable; update form validation
- **Tests**: Visual regression tests; ensure all fields still save correctly
- **Risk**: None significant; purely UI reorganization

---

### `show-empty-fields-in-view-mode` - Display Empty Fields in View Mode
**Priority**: Medium

**Description**: When viewing a record (exvoto, SEM, etc.) in read-only mode, empty fields currently disappear. They should remain visible as explicitly empty to show the complete data structure.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Update detail page view mode to show all fields with "(empty)" or "-" placeholder for null/empty values
- **Tests**: Visual tests for view mode with various combinations of empty fields
- **Risk**: None significant; improves data transparency

---

### `add-sem-create-exvoto` - Allow Creating Exvotos from SEM Detail Page
**Priority**: Medium

**Description**: Currently, exvotos can create new SEMs from their forms, but the reverse is not possible. SEM detail pages should allow creating new exvotos conserved/offered at that SEM, similar to the bidirectional relationship pattern.

**Cross-Impact**:
- **API**: No changes required (exvoto create endpoint exists)
- **Data**: No schema changes
- **UX**: Add "Create New Exvoto" button in SEM detail page; pre-populate SEM fields in the new exvoto form
- **Tests**: Test exvoto creation from SEM page; ensure SEM relationships are correctly set
- **Risk**: None significant; implements expected bidirectional workflow

---

### `show-linked-exvotos-in-sem` - Display List of Linked Exvotos in SEM Detail
**Priority**: Medium

**Description**: SEM detail pages should show a list of all exvotos offered at or conserved at that SEM, allowing users to explore the collection associated with each sanctuary.

**Cross-Impact**:
- **API**: Add query to fetch exvotos by `offering_sem_id` or `conservation_sem_id`; consider pagination for SEMs with many exvotos
- **Data**: No schema changes (relationships exist)
- **UX**: Add exvoto list section to SEM detail page; implement filtering/sorting; make list items clickable to navigate to exvoto details
- **Tests**: Test exvoto list with various SEM sizes; test filtering and navigation
- **Risk**: Performance if SEMs have hundreds of exvotos; need pagination and efficient queries

---

### `add-sem-images` - Enable Image Uploads for SEMs
**Priority**: Medium

**Description**: SEMs should support image uploads (similar to exvotos and divinities) to document the physical location, architecture, or artistic elements of sanctuaries.

**Cross-Impact**:
- **API**: Create `sem_image` table and endpoints (similar to `exvoto_image`)
- **Data**: **Schema change required** - create `sem_image` table with foreign key to `sem`, blob storage for images
- **UX**: Add image upload component to SEM detail pages; display image gallery; reuse exvoto image management UI patterns
- **Tests**: Test image upload, display, and deletion; test multiple images per SEM
- **Risk**: Storage considerations for potentially large images; need image compression/optimization

---

### `catalog-remove-publication-place` - Replace Publication Place with Related Places in Catalogs
**Priority**: Medium

**Description**: Remove "Lugar de publicación" (Publication place) field from catalogs. Replace with "Lugares relacionados" (Related places) as a free-text field to allow more flexible geographic documentation.

**Cross-Impact**:
- **API**: Remove `publication_place` field handling; add `related_places` text field
- **Data**: **Schema change required** - remove `publication_place` column, add `related_places` text column; migrate existing data if needed
- **UX**: Update catalog forms to replace publication place input with related places textarea
- **Tests**: Test field migration; ensure no data loss during migration
- **Risk**: Need to preserve existing publication place data by migrating to related places or archiving

---

### `catalog-rename-description-field` - Rename and Enhance Catalog Description Field
**Priority**: Medium

**Description**: Rename "Descripción de la ubicación" (Location description) to simply "Descripción" (Description) and make it a rich text field supporting formatting (bold, italic, etc.). Formatting should be visible in both edit mode and floating preview boxes.

**Cross-Impact**:
- **API**: Update field name; ensure rich text content is stored as HTML or markdown
- **Data**: **Schema change required** - rename column from `location_description` to `description` (or use existing `description` field if present)
- **UX**: Implement rich text editor component; update floating boxes to render HTML/markdown; ensure consistent formatting display
- **Tests**: Test rich text editing and rendering; test formatting preservation across save/load cycles
- **Risk**: Requires rich text editor library selection; HTML storage may require sanitization for XSS prevention

---

### `catalog-remove-duplicate-exvoto-count` - Remove Duplicate Exvoto Count Fields
**Priority**: Medium

**Description**: Catalogs currently show two fields: "Nº de Exvotos" and "Nº Total Exvotos" (both for counting exvotos). Remove the duplication and keep a single, clear field.

**Cross-Impact**:
- **API**: Consolidate to single exvoto count field in schema and endpoints
- **Data**: **Schema change required** - remove duplicate column; migrate data to single field
- **UX**: Update forms to show single exvoto count field; clarify field label if needed
- **Tests**: Test data migration; ensure count field saves correctly
- **Risk**: Need to determine which field is "correct" if values differ; may require data cleanup

---

### `catalog-fix-sem-relationship` - Fix SEM Relationship in Catalogs
**Priority**: Medium

**Description**: The "Lugares relacionados" (now "SEM incluidos en el catálogo" - SEMs included in catalog) field is not properly linked to the SEM table via the `catalog_sem` junction table. Fix the relationship to allow multi-select SEM association.

**Cross-Impact**:
- **API**: Implement proper `catalog_sem` junction table handling; add endpoints to add/remove SEM associations
- **Data**: Junction table exists; verify data integrity and indexes
- **UX**: Replace text field with multi-select SEM picker; display linked SEMs in catalog detail page
- **Tests**: Test SEM association/disassociation; test many-to-many relationship integrity
- **Risk**: Migration complexity if existing free-text data needs to be matched to SEM records

---

### `catalog-auto-populate-provinces` - Auto-Populate Provinces in Catalogs
**Priority**: Medium

**Description**: Catalogs should automatically show the provinces covered based on associated SEMs or exvotos, reducing manual data entry and ensuring accuracy.

**Cross-Impact**:
- **API**: Implement logic to aggregate provinces from linked SEMs/exvotos; expose via catalog detail endpoint
- **Data**: No schema changes (computed field based on relationships)
- **UX**: Display province list in catalog detail; optionally allow manual override if catalog scope differs from linked entities
- **Tests**: Test province aggregation with various catalog configurations; test performance with large datasets
- **Risk**: Complex aggregation logic; performance concerns for catalogs with many linked entities

---

### `divinity-add-sem-list` - Display SEM Worship List in Divinity Table
**Priority**: Medium

**Description**: The divinities table should show which SEMs (sanctuaries) worship each divinity. Since a divinity can be worshipped at multiple SEMs, this will be a list or count displayed in the table.

**Cross-Impact**:
- **API**: Update divinity list endpoint to include associated SEM data (via `divinity_sem` junction table)
- **Data**: No schema changes (junction table exists)
- **UX**: Add SEM list/count column to divinities table; make SEMs clickable to navigate to SEM details; handle long SEM lists gracefully (truncate with expand option)
- **Tests**: Test SEM association display; test navigation from divinity table to SEM details
- **Risk**: Performance if fetching all SEM names for each divinity in table view; consider showing count only in table and full list in detail page

---

### `divinity-allow-multiple-images` - Enable Multiple Image Uploads for Divinities
**Priority**: Medium

**Description**: Divinities do not currently allow JPG uploads and should support multiple images (similar to exvotos). This allows documenting different representations, historical images, and iconographic variations.

**Cross-Impact**:
- **API**: Create `divinity_image` table and endpoints (similar to `exvoto_image` and `sem_image`)
- **Data**: **Schema change required** - create `divinity_image` table with foreign key to `divinity`, blob storage for images
- **UX**: Add image upload component to divinity detail pages; support JPG, PNG, and other common formats; display image gallery
- **Tests**: Test image upload with various formats (JPG, PNG, etc.); test multiple images per divinity
- **Risk**: Storage considerations; need consistent image management UX across all entities

---

### `divinity-fix-keyboard-shortcuts` - Fix Divinity Keyboard Shortcuts (e, i)
**Priority**: Medium

**Description**: In the Divinities page, the "e" key opens read-only mode instead of edit mode, and the "i" key does not open detail view. This is part of the broader keyboard shortcut consistency issue.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Fix keyboard handlers in `DivinitiesPage.tsx`; ensure consistency with other entity pages
- **Tests**: Test "e" and "i" keyboard shortcuts in Divinities page
- **Risk**: Covered under `fix-keyboard-shortcuts-consistency`; included here for completeness

---

## Low Priority

### `rich-text-editor-for-long-fields` - Implement Rich Text Editing for Long-Form Fields
**Priority**: Low

**Description**: Text fields in exvotos (Información adicional, Forma de texto, Transcripción) and catalogs (Descripción) should support rich text formatting: paragraphs, bold, underline, italic, justification. The Transcripción field specifically needs superscript support for transcription conventions.

**Cross-Impact**:
- **API**: Ensure endpoints accept and store HTML or markdown content; implement sanitization for XSS prevention
- **Data**: No schema changes (text fields already exist; just change content format)
- **UX**: Integrate rich text editor library (TipTap, Lexical, or similar); implement toolbar with formatting controls; add superscript button for Transcripción field; ensure formatting displays correctly in view mode and floating boxes
- **Tests**: Test rich text editing and rendering; test HTML/markdown storage and retrieval; test XSS prevention
- **Risk**: Library selection impacts bundle size and accessibility; HTML storage requires careful sanitization; user training may be needed

---

### `enhanced-image-viewer` - Implement Enhanced Image Viewer
**Priority**: Low

**Description**: Images (in exvotos, SEMs, divinities) should open in a new tab with enhanced viewing capabilities:
- Enlarge in new tab or modal
- Download option
- Mouse wheel zoom
- Navigation between multiple images (if entity has multiple)
- Add notes/captions to images (source, provenance, etc.)

**Cross-Impact**:
- **API**: Add caption/notes fields to `exvoto_image`, `sem_image`, `divinity_image` tables
- **Data**: **Schema change required** - add `caption` text field to all image tables
- **UX**: Implement image viewer modal or page with zoom, pan, download, and navigation controls; add caption input in image upload/management UI; consider using library (e.g., react-image-lightbox)
- **Tests**: Test image viewer functionality across all image types; test zoom, navigation, and download
- **Risk**: Library choice affects bundle size; need accessibility considerations for image viewer

---

### `table-sorting-headers` - Add Sortable Column Headers
**Priority**: Low

**Description**: Table column headers should be clickable to sort ascending/descending, improving data exploration and analysis capabilities.

**Cross-Impact**:
- **API**: Optionally add server-side sorting parameters for large datasets
- **Data**: No schema changes
- **UX**: Add sort indicators (▲▼) to table headers; implement client-side sorting logic; maintain sort state in URL/localStorage
- **Tests**: Test sorting across different column types (text, number, date); test sort persistence
- **Risk**: Performance for large datasets if sorting client-side; may need server-side sorting pagination

---

### `csv-excel-export` - Implement CSV/Excel Export
**Priority**: Low

**Description**: Allow users to export table data to CSV or Excel format for external analysis, reporting, or backup purposes.

**Cross-Impact**:
- **API**: Optionally add export endpoints that generate files server-side
- **Data**: No schema changes
- **UX**: Add export button to table toolbars; implement client-side CSV generation (or server-side for complex exports); handle large datasets with streaming or pagination
- **Tests**: Test export with various table sizes; test special characters and encoding; test Excel compatibility
- **Risk**: Large exports may cause browser memory issues; need to handle encoding properly (UTF-8 with BOM for Excel)

---

### `cell-overflow-truncation` - Handle Cell Text Overflow with Truncation
**Priority**: Low

**Description**: Long text in table cells should be truncated with ellipsis (...) and show full content in a modal when pressing Enter or clicking.

**Cross-Impact**:
- **API**: No changes required
- **Data**: No schema changes
- **UX**: Implement CSS truncation for cells; add modal for full content display; bind to Enter key and click events
- **Tests**: Test truncation with various text lengths; test modal display
- **Risk**: Related to `improve-floating-boxes-readability`; need consistent UX between tooltips and modals

---

### `cell-color-customization` - Enable Cell Background Color Customization
**Priority**: Low

**Description**: Allow users to customize cell background colors in tables for visual categorization, highlighting important records, or status indication.

**Cross-Impact**:
- **API**: Add metadata storage for cell colors (could be user-specific or record-specific)
- **Data**: **Schema change required** - add color metadata table or JSON column for user preferences
- **UX**: Add color picker UI for cells; persist color choices; ensure color choices are accessible (sufficient contrast)
- **Tests**: Test color persistence; test accessibility with various color combinations
- **Risk**: Accessibility concerns with user-chosen colors; need validation to ensure sufficient contrast

---

### `advanced-filtering-by-province-epoch` - Implement Advanced Filtering
**Priority**: Low

**Description**: Add advanced filtering capabilities to tables: filter by province, epoch (25-year intervals), SEM, divinity, and other key fields to support research workflows.

**Cross-Impact**:
- **API**: Add filter parameters to list endpoints; optimize queries for filtered results
- **Data**: Ensure indexes exist for commonly filtered fields (province, epoch, SEMs)
- **UX**: Implement filter panel or dropdown UI; support multiple simultaneous filters; show active filter indicators; persist filter state
- **Tests**: Test filtering with various combinations; test filter performance with large datasets
- **Risk**: Complex query building; performance concerns for complex multi-field filters

---

### `disappearance-status-for-sems` - Add "Desaparecido" Status for SEMs
**Priority**: Low

**Description**: Add a "Desaparecido" (Disappeared/Destroyed) status option for SEMs to document sanctuaries that no longer exist but are historically significant.

**Cross-Impact**:
- **API**: Add `status` field to SEM endpoints with enum values (e.g., "active", "disappeared")
- **Data**: **Schema change required** - add `status` column to `sem` table with default "active"
- **UX**: Add status selector in SEM forms; visually distinguish disappeared SEMs in lists (grayed out, special icon); filter options to show/hide disappeared SEMs
- **Tests**: Test status field creation and filtering; ensure disappeared SEMs can still be referenced from exvotos
- **Risk**: Need to handle historical references to disappeared SEMs carefully in UI

---

### `linked-catalog-references` - Implement Linked Catalog References
**Priority**: Low

**Description**: Create a system for managing bibliographic references that link to specific catalogs in the database, allowing for structured citation management and cross-referencing.

**Cross-Impact**:
- **API**: Leverage `catalog_exvoto` junction table; potentially add citation metadata fields
- **Data**: May require additional fields for page numbers, specific references within catalogs
- **UX**: Implement reference management UI in exvoto forms; display formatted citations in detail view; make catalog references clickable
- **Tests**: Test reference creation and linking; test citation display formatting
- **Risk**: Overlaps with `add-exvoto-references-field`; need clear data model for free-text vs. structured references

---

### `mini-search-in-dropdowns` - Add Search Functionality to Dropdown Selects
**Priority**: Low

**Description**: All dropdown selects (SEMs, catalogs, divinities, miracles, characters) should include mini-search functionality to quickly filter long lists.

**Cross-Impact**:
- **API**: Optionally add search parameters to list endpoints for server-side filtering
- **Data**: No schema changes
- **UX**: Replace standard selects with searchable select components (e.g., react-select); ensure keyboard accessibility; maintain alphabetical sorting
- **Tests**: Test search with various input patterns; test keyboard navigation in searchable dropdowns
- **Risk**: Covered under `alphabetical-searchable-sem-dropdowns` for SEMs; this extends to all dropdowns

---

## Summary

**Total Items**: 50 planned changes

**Priority Breakdown**:
- **High Priority**: 9 items (critical bugs, blocking functionality)
- **Medium Priority**: 26 items (important features, significant UX improvements)
- **Low Priority**: 15 items (enhancements, nice-to-haves)

**Schema Changes Required**: ~15 items require database migrations

**Key Risk Areas**:
- Rich text editor library selection and implementation
- Image storage and management architecture
- Keyboard shortcut consistency and focus management
- Data migration for field renames and type changes
- Performance optimization for large datasets with complex relationships

**Recommended Approach**:
1. **Phase 1**: Fix all High Priority bugs to stabilize core functionality
2. **Phase 2**: Complete entity relationships (Divinities↔SEMs, Exvotos↔Divinities)
3. **Phase 3**: Implement rich text editing and enhanced image management
4. **Phase 4**: Add advanced features (filtering, export, keyboard enhancements)
