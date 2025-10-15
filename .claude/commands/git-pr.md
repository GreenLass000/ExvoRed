---
description: "Stage, commit, push and open a PR. Uses gh CLI if available."
---

Stage all changes, create a conventional commit, push branch, and open a pull request.

1. Run `git status` and `git diff` to review changes
2. Stage all changes with `git add -A`
3. If there are staged changes:
   - Create commit using Conventional Commits format (e.g., `feat: add exvoto search feature`)
   - Infer commit message from changes or ask user if unclear
   - Add co-author footer: `Co-Authored-By: Claude <noreply@anthropic.com>`
4. Push current branch: `git push -u origin <current-branch>`
5. Create pull request:
   - If `gh` CLI is available: use `gh pr create --fill` with title and body
   - Otherwise: provide instructions for creating PR manually
6. Output the PR URL or creation command

Constraints:
- Do not modify any code files
- All commit messages and PR descriptions in English
- Follow Conventional Commits specification (feat, fix, docs, refactor, etc.)
