# Changelog

## Unreleased
- Docs-driven changes applied per `.claude/commands/apply-from-docs.md` and `.claude/docs/INDEX.md` (high‑priority items):
  - Prevent data loss on modal close: added confirmation when closing modals with unsaved changes (all create/edit modals).
  - Keyboard shortcuts: pressing `e` now opens inline edit on SEMs, Catalogs, and Divinities tables.
  - Delete operations: added visible delete actions with confirmation on Characters and Miracles lists; added delete buttons on SEMs, Catalogs, and Divinities tables; added delete on Exvoto detail page.
  - Date handling: switched Exvoto/Catalog date inputs to manual text entry; Exvoto detail view now shows date string as stored (no timezone shift).
  - Gender options: updated Exvoto gender choices to include "Ambos" and "Desconocido" and removed "Otro".
- Backend: Block deletion of Divinities referenced by SEMs (returns 409 with clear message).
- Services: Added `updateCharacter`, `deleteCharacter`, `updateMiracle`, and `deleteMiracle` in `src/services/api.ts`.

Notes:
- Minimal, targeted changes aligned with docs. No env or lockfiles modified.
