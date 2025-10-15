---
description: "Apply changes by reading ./.claude/docs/INDEX.md. Creates a feature branch."
---

Read `./.claude/docs/INDEX.md` and referenced documents, then apply the described changes in a new branch.

1. Determine branch name: `feat/docs-applied-<YYYYMMDD>` (use current date unless user specified one)
2. Create and checkout new feature branch using git
3. Launch the docs-driven-changer agent using the Task tool to:
   - Implement code changes according to documentation (API, data model, UX, tests)
   - Add/adjust tests based on acceptance-criteria.md
   - Update CHANGELOG.md with a summary of changes
4. Provide a summary of files changed and any remaining TODOs

Constraints:
- Never modify .env, .git/, or lockfiles unless strictly required
- If documentation is ambiguous, add TODO: or FIXME: comments
- All commit messages and code comments must be in English
- Keep changes minimal and test-driven
