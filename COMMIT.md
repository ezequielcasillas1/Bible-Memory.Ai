# 🚀 Cursor Agent Commit & Push Guide

This document defines **best practices** for Cursor (or any AI agent) when working in this repo.  
The goal is to ensure **every code change is properly staged, committed, and pushed**.

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
     Example:
     ```
     BM1.6 IMPROVED SYNTAX LAB PART 1
     chore: remove accidental embedded repo path
     fix: corrected verse translation bug
     ```

4. **Push to remote every time**:
   - After committing, **always push to `main`** (or the active branch).

---

## 🔹 Standard Commit Flow

Every time a feature or file is added/updated:

```bash
# 1. Sync with remote first
git pull origin main --allow-unrelated-histories

# 2. Stage changes
git add .

# 3. Commit with descriptive message
git commit -m "BMx.x <FEATURE SUMMARY>"

# 4. Push to remote
git push origin main
