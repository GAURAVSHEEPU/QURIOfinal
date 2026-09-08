# Rollback Strategy

## Overview
To maintain stability during rapid 3-day hackathon iteration, the project uses a lightweight, Git-based rollback strategy.

## Pre-Change Checkpoint
Before implementing any major module or phase:
```bash
git status
git add .
git commit -m "checkpoint: completed [Phase/Feature Name]"
```

## Post-Change Verification
After implementing changes:
```bash
git status
git diff
```
Run `docs/TEST_CHECKLIST.md` verification commands.

## Rollback Procedure
If a code change introduces errors, breaks tests, or fails verification:

1. **Identify Scope:** Use `git status` and `git diff` to view altered files.
2. **Revert Affected Files / Commits:**
   - Revert uncommitted file edits:
     ```bash
     git checkout -- <file_path>
     ```
   - Revert specific commit:
     ```bash
     git revert <commit_hash>
     ```
   - Hard reset to recent stable checkpoint (if necessary):
     ```bash
     git reset --hard HEAD
     ```
3. **Re-verify System:** Rerun test checklist commands from [`docs/TEST_CHECKLIST.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/TEST_CHECKLIST.md) to ensure clean working state.

