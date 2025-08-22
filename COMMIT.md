🚀 Cursor Agent Commit & Push Guide (UI Branch)

This repo uses a dedicated branch for UI work:
👉 bm/ui-improvement

Cursor AI must always commit and push changes to this branch, never directly to main.

---

🔹 Workflow Rules

1. Always work in bm/ui-improvement branch:
   git checkout bm/ui-improvement || git checkout -b bm/ui-improvement

2. Stage all changes after modifications:
   git add -A

3. Commit with a clear message:
   Format: BMx.x <Description>
   Example: BM1.7 IMPROVED UI
   git commit -m "BM1.7 IMPROVED UI"

4. Push to GitHub:
   git push origin bm/ui-improvement

5. Never push directly to main:
   - main stays clean.
   - All work goes into bm/ui-improvement.
   - When ready, open a Pull Request into main.

---

🔹 Commit Etiquette

- UI Updates: BM1.7 IMPROVED UI
- Bug Fixes: fix: corrected button alignment
- Chores/Cleanup: chore: removed unused imports
- Docs: docs: updated cursor-agent-commit-guide.md

---

🔹 Example Full Flow (for Cursor)

git checkout bm/ui-improvement || git checkout -b bm/ui-improvement
git add -A
git commit -m "BM1.7 IMPROVED UI"
git push origin bm/ui-improvement

---

🔹 Notes for Cursor

- Always create a commit after changes.
- Always push to bm/ui-improvement.
- Never touch main directly.
- If git push fails, run:
  git pull origin bm/ui-improvement
  git push origin bm/ui-improvement
