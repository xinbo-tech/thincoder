Write content to a file. Creates parent directories; overwrites existing file.

Parameters:
- path (required): File path, relative to cwd or absolute
- content (required): Full content to write

Notes:
- write replaces the WHOLE file — read it first and confirm you intend to rewrite it entirely; for a small change use edit / insert_after.
- Returns `Wrote N chars to <path>` + git diff + syntax-check note.
- This overwrites the entire file — use `edit` for targeted changes
- The file is atomic: it either writes completely or fails
