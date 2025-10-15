# Acceptance Criteria: ExvoRed

## Overview
This document defines acceptance criteria for prioritized features and fixes derived from the backlog (TODO.md), plan.md, and slugs.json. Criteria are written in Gherkin style with test matrices and non-functional requirements. All criteria are implementation-agnostic and testable.

---

## Gherkin Scenarios

### Feature: Fix Missing Delete Functionality (fix-delete-operations)

Feature: Delete records across all entities
  As an authenticated user (dev mode, no auth)
  I want to delete records with confirmation dialogs
  So that I can remove unwanted data safely

Scenario: Delete a Character from list view
  Given I am on the Characters page with at least one character present
  When I click "Eliminar" on a character and confirm the dialog
  Then the character is removed from the list
  And a success message is shown

Scenario: Cancel deletion of a Miracle from list view
  Given I am on the Miracles page with at least one miracle present
  When I click "Eliminar" on a miracle and cancel the dialog
  Then the miracle remains in the list
  And no changes are persisted

Scenario: Attempt to delete a Divinity that is referenced
  Given a Divinity is referenced by one or more Exvotos or SEMs
  When I attempt to delete that Divinity
  Then I see a clear error explaining it cannot be deleted due to references
  And the record remains intact

Scenario: Delete an Exvoto from its detail page
  Given I am on an Exvoto detail page
  When I click the delete action and confirm
  Then I am redirected to the Exvotos list
  And the deleted item no longer appears

---

### Feature: Prevent Data Loss When Closing Modals (prevent-data-loss-on-modal-close)

Feature: Prevent accidental data loss in creation/edit modals
  As a user creating or editing records in a modal
  I want protection against accidental closing
  So that I do not lose unsaved input

Scenario: Click outside modal with unsaved changes
  Given a creation modal contains unsaved input
  When I click outside the modal
  Then a confirmation dialog warns about unsaved changes
  And closing proceeds only if I confirm

Scenario: Press Escape with unsaved changes
  Given a creation modal contains unsaved input
  When I press the Escape key
  Then a confirmation dialog warns about unsaved changes
  And closing proceeds only if I confirm

Scenario: Restore draft after accidental close (optional localStorage)
  Given I previously entered data into a creation modal and dismissed it without saving
  When I reopen the same creation modal within the same session
  Then I am prompted to restore the draft
  And the form is prefilled if I accept

---

### Feature: Keyboard Shortcuts Consistency (fix-keyboard-shortcuts-consistency)

Feature: Uniform keyboard shortcuts across entity pages
  As a keyboard-driven user
  I want consistent shortcuts across pages
  So that I can work efficiently

Scenario: "e" key enters edit mode on SEMs, Catalogs, Divinities
  Given I am focused on a data row in any entity list (SEMs, Catalogs, Divinities)
  When I press the "e" key
  Then the edit mode opens for that row

Scenario: Shortcuts remain active after Inspect navigation
  Given I use the "i" key to open a detail page from a list
  When I return to the list via back navigation
  Then all shortcuts (e, i, Shift+E, arrows) remain functional

Scenario: Ignore shortcuts when typing in inputs
  Given focus is inside an input, textarea, or editable element
  When I press shortcut keys
  Then no navigation or edit shortcuts trigger

---

### Feature: Fix Date Discrepancy (fix-exvoto-date-discrepancy)

Feature: Consistent date display across table and detail
  As a user viewing Exvoto dates
  I want identical dates in all views
  So that I trust the data

Scenario: Same date string in list and detail
  Given an Exvoto has date "1787-10-01"
  When I compare the list row and the detail page
  Then both display exactly "1787-10-01"
  And no timezone shifts are applied

Scenario: Create and then view date consistently
  Given I create an Exvoto with date "1700-01-15"
  When I save and view it in list and detail
  Then both display "1700-01-15" consistently

---

### Feature: Catalog Fields Persist (fix-catalog-fields-not-saving)

Feature: Persist all catalog fields and SEM relations

Scenario: Save numeric fields like exvoto counts
  Given I enter values for "exvoto_count" and "numero_exvotos"
  When I save the Catalog
  Then reloading shows the same values persisted

Scenario: Link SEMs via junction table
  Given I add SEM associations to a Catalog
  When I save and reload the Catalog
  Then associated SEMs appear in the Catalog detail

---

### Feature: Link Exvotos with Divinities (link-exvotos-divinities)

Feature: Exvotos reference Divinities via foreign key

Scenario: Select divinity in Exvoto form
  Given there are existing Divinities
  When I create/edit an Exvoto and select a Divinity
  Then saving persists the association
  And the Exvoto detail displays the Divinity name

Scenario: Prevent deletion of linked Divinity
  Given a Divinity is linked to one or more Exvotos
  When I try to delete that Divinity
  Then I receive an error explaining it is in use

---

### Feature: Complete SEM↔Divinity Relationship (link-sems-divinities)

Feature: Manage many-to-many SEM–Divinity associations

Scenario: Add multiple Divinities to a SEM
  Given I am on a SEM detail page
  When I add multiple Divinities via a multi-select
  Then the SEM detail lists those Divinities

Scenario: Remove a Divinity from a SEM
  Given a SEM has multiple Divinities associated
  When I remove one association
  Then the removed Divinity no longer appears in the SEM list

---

### Feature: Fix "Oldest Modified" Filter (fix-oldest-modified-filter)

Feature: Reliable sorting by modification timestamp

Scenario: Sort by oldest modified
  Given multiple records with varying updated_at timestamps
  When I sort by oldest modified
  Then records appear from oldest to newest by updated_at

Scenario: Toggle between newest and oldest consistently
  Given a current sort by newest modified
  When I toggle to oldest modified and back
  Then order updates correctly each time

---

### Feature: Improve Search Context Display (improve-search-context-display)

Feature: Show full sentence context with underline highlighting

Scenario: Display underlined matches within full context
  Given I search for a keyword present in long text fields
  When results are displayed
  Then matched terms are underlined within the sentence context
  And the result counter shows "X of Y"

Scenario: Navigate between matches
  Given multiple matches exist
  When I click next/previous
  Then focus and highlight move to the corresponding match

---

### Feature: Inspect in New Tab (open-inspect-in-new-tab)

Feature: Open detail in new tab via modifier

Scenario: Open detail in new tab via keyboard modifier
  Given I am focused on a row in a list
  When I press Ctrl/Cmd + i
  Then the detail opens in a new browser tab

Scenario: Open image preview in new tab
  Given I am viewing image thumbnails
  When I select the option to open in a new tab
  Then the larger image opens in a separate tab

---

### Feature: Arrow Navigation Between Records (arrow-navigation-between-records)

Feature: Navigate detail pages with arrow keys

Scenario: Navigate to next and previous records
  Given I am on a detail page with a known ordered list
  When I press the right arrow
  Then the next record detail loads
  And pressing the left arrow loads the previous record

Scenario: Boundary conditions
  Given I am on the first record
  When I press the left arrow
  Then no navigation occurs and a subtle hint indicates the boundary

---

### Feature: Manual Date Entry with Partial Dates (manual-date-entry-with-partial-dates)

Feature: Accept manual date entry with unknown parts

Scenario: Accept "X" placeholders for unknown month/day
  Given I enter a date as "1787-X-01" or "1787-X-X"
  When I save the record
  Then the value is accepted and persisted as entered

Scenario: Validate format while allowing placeholders
  Given I enter an invalid date like "1787-13-40"
  When I attempt to save
  Then I receive a clear validation error

---

### Feature: Alphabetical & Searchable SEM Dropdowns (alphabetical-searchable-sem-dropdowns)

Feature: Sorted and searchable selects for SEM fields

Scenario: SEM list sorted alphabetically
  Given I open a SEM selection dropdown
  When the list renders
  Then items are sorted A→Z by name

Scenario: Search within dropdown
  Given the SEM list is long
  When I type into the dropdown search
  Then the options filter to match my input

---

### Feature: Show Empty Fields in View Mode (show-empty-fields-in-view-mode)

Feature: Always display empty fields explicitly

Scenario: Empty fields display with placeholder
  Given a detail page with null/empty values
  When I view the page in read-only mode
  Then each field displays an explicit empty placeholder (e.g., "—")

---

### Feature: Add References Field to Exvotos (add-exvoto-references-field)

Feature: References field and Catalog linking

Scenario: Add free-text references and link to Catalogs
  Given I edit an Exvoto
  When I add reference text and link to one or more Catalogs
  Then the detail view shows clickable Catalog links

Scenario: Navigate to Catalog from reference link
  Given a Catalog is linked in references
  When I click the Catalog link
  Then I navigate to that Catalog’s detail page

---

## Test Matrix

### Unit Tests
| Component/Function | Test Case | Assertion |
|-------------------|-----------|----------|
| epochUtils.ts | Date → epoch mapping | Correct 25-year interval label returned |
| highlightText.tsx | Underline highlighting | Only matched substrings wrapped; preserves original text |
| useExcelKeyboard.ts | Shortcut gating | Shortcuts ignored when focused in inputs |
| images utils | Data URL normalization | Valid data URL generated for given image buffer |

### Integration Tests
| Integration Point | Test Case | Assertion |
|------------------|-----------|----------|
| DELETE endpoints (all entities) | Delete existing record | 200 OK and record no longer listed |
| DELETE divinity (referenced) | Attempt delete | 4xx with clear error; record still exists |
| Catalog save | Save all fields | Reload returns identical values |
| SEM↔Divinity M2M | Add/remove associations | Lists reflect adds/removes |
| Search | Query long-text fields | Underline and correct match count |

### End-to-End Tests
| User Flow | Test Case | Assertion |
|-----------|-----------|----------|
| Create → Cancel modal | Click outside/Esc with unsaved input | Confirmation appears; no data loss without confirm |
| Inspect in new tab | Ctrl/Cmd+i on list row | Detail opens in new tab, original tab unchanged |
| Detail arrow nav | Left/Right navigation | Previous/next record loads, boundary handled |
| Manual date entry | Enter "1787-X-01" | Value accepted and displayed consistently |

## Non-Functional Requirements

### Performance
- Search results update within 200 ms for datasets up to 10,000 records on a typical dev machine.
- List pages render within 500 ms after navigation for datasets up to 5,000 records.

### Accessibility
- All interactive elements reachable via keyboard (Tab/Shift+Tab, arrow keys where applicable).
- Focus is visible and managed when opening modals and after closing/returning from detail pages.
- Buttons and links have accessible names; confirmation dialogs are screen-reader readable.

### Usability
- Confirmation dialogs clearly state consequences (e.g., delete permanence, unsaved changes loss).
- Empty fields show a neutral placeholder (e.g., "—") to avoid disappearing content.

### Data Integrity
- Deleting referenced entities is blocked with informative messaging.
- Manual dates preserve input format (including "X" placeholders) without unintended transformation.

## Edge Cases & Error Handling
- Network failure on delete shows non-blocking error and leaves record intact.
- Attempting to navigate past first/last record in detail view shows boundary feedback without errors.
- Dropdown search is resilient to accent/diacritic variations.

## Dependencies & Assumptions
- No authentication flows; all endpoints publicly accessible in development.
- SQLite stores dates as text; UI handles manual entry and placeholder characters as specified.
- Feature availability and labels follow the latest versions of architecture.md, data-model.md, and ux.md.
