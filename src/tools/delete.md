Delete a file. Use when the agent created a temporary or junk file that should be cleaned up, or when the user explicitly asks to delete something. Refuses to delete git-tracked files as a safety measure — tracked files should be edited or removed via bash with explicit user confirmation.

**Route to delete instead of bash:** `del file` / `rm file` → delete (single files). Use bash `rm -rf` only for directories (delete is single-file).

Parameters:
- path (required): File path, relative to cwd or absolute
- force: Allow deleting git-tracked files (default false)

Notes:
- Untracked or non-git files are deleted immediately
- Tracked files require force=true (user must confirm separately)
- Directories must be removed with bash (rm -rf)
