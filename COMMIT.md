# 🚀 Cursor Agent Commit & Push Guide (Main Branch Only)

This document defines **best practices** for Cursor (or any AI agent) when working in this repo.  
The goal is to ensure **every code change is properly staged, committed, and pushed to `main`**.

---

## 🔹 Golden Rules

1. **Never delete sensitive files**:
   - `.env`, API keys, secrets, database files, or configs.
   - If changes are needed, comment them or mock them instead.

2. **Always stage only intentional changes**:
   - Use `git add .` to include all modifications **only after validating they belong to the feature**.
   - Never commit system files like `.DS_Store`, `Thumbs.db`, or local logs.

3. **Always commit after a change is made**:
   - Each commit should have a **clear message**.
   - Format:
     ```
     [Tag] Short Description
     ```
   - Examples:
     ```
     BM1.7 IMPROVED UI
     chore: remove unused imports
     fix: corrected verse translation bug
     ```

4. **Always push directly to `main`**:
   - No feature branches for standard changes.
   - After every commit, push to `main`.

---

## 🔹 Standard Commit Flow

Every time a feature or file is added/updated:

```bash
# 1. Sync with remote first
git checkout main
git pull origin main

# 2. Stage all changes
git add .

# 3. Commit with a descriptive message
git commit -m "BMx.x <FEATURE SUMMARY>"

# 4. Push to remote main
git push origin main
