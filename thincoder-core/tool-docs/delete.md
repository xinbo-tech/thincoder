Delete a file, or an empty directory. Use when the agent created a temporary or junk file or empty directory that should be cleaned up, or when the user explicitly asks to delete something.
Refuses to delete git-tracked files as a safety measure — tracked files should be edited or removed via bash with explicit user confirmation.

**Route to delete instead of bash:** `del file` / `rm file` → delete (single files); an empty directory → delete (empty directories only). Non-empty directories have no delete path — stop and report to the user instead of hand-rolling a recursive shell delete.

Parameters:
- path (required): File or empty-directory path, relative to cwd or absolute
- force: Allow deleting git-tracked files (default false)

Notes:
- Untracked or non-git files are deleted immediately
- Tracked files require force=true (user must confirm separately)
- Directories: empty ones only — a non-empty directory is refused (a natural fuse; nothing recursive is ever removed); delete nested empty trees bottom-up
- Symbolic links are removed as links — the link itself is deleted, never followed (its target is untouched)
- Returns `Deleted <path>` (or `Error: ...` on failure / tracked / non-empty refusal).
