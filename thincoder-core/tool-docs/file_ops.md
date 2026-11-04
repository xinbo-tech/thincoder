Move, copy, or rename a file/directory.

**Route to file_ops instead of bash:**
- `mv a b` → file_ops action=move
- `cp a b` / `copy` → file_ops action=copy
- `ren a b` / `rename a b` → file_ops action=rename

Parameters:
- action (required): move | copy | rename
- source (required): source path, relative to cwd or absolute
- dest (required): destination path

Notes:
- Paths resolve relative to cwd — no directory restriction (same boundary as bash; the approval gate is the guard).
- `dest` is overwritten if it already exists. `copy` is recursive for directories.
- To create a directory, use `write` (creates parent dirs) or `bash mkdir`.
- Returns `Moved|Copied|Renamed <source> -> <dest>` or `Error: ...` (same-path and missing-path errors).

**`ledger`** — the in-flight ledger row this call serves: `"#N"` or `"N"`. In engineering mode the parent agent must pass it — a call that does not say which row it serves is refused.