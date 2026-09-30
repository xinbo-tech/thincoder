Edit a file as a patch — targeted by content or by line number. Two targeting forms (mutually exclusive — use one): ① line-based: `line: N` replaces that single line, `startLine: N, endLine: M` replaces the inclusive 1-based line range — no old_string needed when you know the line number; give new_string to replace, or OMIT new_string to delete the line/range; ② content-based: old_string is the current content of the region to change (must match exactly once); new_string is the desired result of that region. old_string matching is tolerant: exact match first, then a unique whitespace-only variant, then fuzzy match (unique window with ≥90% of lines identical after trimming, tab→space indent and quote normalization — ASCII single, curly single/double and backtick quotes all unify to straight double quotes). Lines shared by old/new are kept; lines only in new_string take their position relative to the shared lines (LCS order); lines only in old_string are deleted — a replacement never leaves old lines behind (zero overlap → old lines are replaced by new_string, not kept). A unique single-line old_string paired with a single-line new_string replaces that exact line in place (line count unchanged). To add a new line without removing anything use insert_after. replace_all applies to content-based edits only: literal replacement of every occurrence — the diff rules do not apply.

**Routing — pick the right edit tool:**
- Delete a line/range by number → omit new_string: edit with `line: N` / `startLine: N, endLine: M`
- Line numbers fresh (just read) → `line`/`startLine`/`endLine` targeting — precise, no content copy needed
- Line numbers may have drifted / content has whitespace-encoding noise → `hashline_edit` (content-hash addressing — position-independent)
- Add a line/entry after a known line → insert_after
- Same change across multiple files → apply_patch
- Rewrite an entire file → write
- Rename a symbol project-wide → `lsp` or `grep` first to map every caller

**Batch multiple changes into ONE call via the `edits` array** (preferred over N single edit calls) — same file or across files; atomic: any failure writes nothing. One permission ask, one undo unit, and one turn instead of N. Per-entry shape and targeting are in the schema.

Notes:
- Prefer this over write for targeted edits — it's safer and keeps changes targeted
- If old_string matches zero times (even fuzzy): error. If it matches multiple times without replace_all: error — add more surrounding context to make it unique
- Returns `Edited <path>: replaced N occurrence(s)` (delete-mode: `Deleted line N of <path>` / `Deleted lines N-M of <path>`) + git diff + syntax-check note + context block (L..-L..).
- Never fabricate the old_string — copy it verbatim from the actual file using read first
- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed
