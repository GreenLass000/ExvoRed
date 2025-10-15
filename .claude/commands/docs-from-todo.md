---
description: "Generate English documentation from TODO.md using specialized agents."
---

**Documentation only. No code changes.** Read `TODO.md` at repo root and produce a full documentation set under `./.claude/docs/` with an entry-point `INDEX.md`.

Steps:
1. Launch docs-analyzer agent (Task tool) to analyze TODO.md and create plan.md
2. Launch architecture-writer agent to update architecture.md
3. Launch api-contract-writer agent for each feature to create API documentation
4. Launch data-modeler agent to update data-model.md
5. Launch ux-writer agent to update ux.md
6. Launch acceptance-criteria-writer agent to create acceptance-criteria.md
7. Launch adr-writer agent for key architectural decisions
8. Launch docs-indexer agent to generate/update INDEX.md

Constraints:
- All outputs must be in English
- If information is missing, write explicit TODOs
- Do not modify any source code files
- Summarize created/updated documentation paths at the end
