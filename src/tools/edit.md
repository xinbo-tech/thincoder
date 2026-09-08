Edit a file as a patch — targeted by content or by line number. Two targeting forms (mutually exclusive — use one): ① line-based: `line: N` replaces that single line, `startLine: N, endLine: M` replaces the inclusive 1-based line range — no old_string needed when you know the line number; give new_string to replace, or OMIT new_string to delete the line/range; ② content-based: old_string is the current content of the region to change (must match exactly once); new_string is the desired result of that region. old_string matching is tolerant: exact match first, then a unique whitespace-only variant, then fuzzy match (unique window with ≥90% of lines identical after trimming, tab→space indent and quote normalization — ASCII single, curly single/double and backtick quotes all unify to straight double quotes). Lines shared by old/new are kept; lines only in new_string take their position relative to the shared lines (LCS order); lines only in old_string are deleted — a replacement never leaves old lines behind (zero overlap → old lines are replaced by new_string, not kept). A unique single-line old_string paired with a single-line new_string replaces that exact line in place (line count unchanged). To add a new line without removing anything use insert_after. replace_all keeps literal replacement of every occurrence — the diff rules do not apply.

**Routing — pick the right edit tool:**
- Delete a line/range by number → omit new_string: edit with `line: N` / `startLine: N, endLine: M`
- Line numbers fresh (just read) → `line`/`startLine`/`endLine` targeting — precise, no content copy needed
- Line numbers may have drifted / content has whitespace-encoding noise → `hashline_edit` (content-hash addressing — position-independent)
- Add a line/entry after a known line → insert_after
- Same change across multiple files → apply_patch
- Rewrite an entire file → write
- Rename a symbol project-wide → `lsp` or `grep` first to map every caller

**Batch multiple edits into ONE call via the `edits` array** (preferred over N single edit calls): multiple changes to the SAME file go into one `edits` array (entries are applied serially, each based on the previous one's result); independent changes across MULTIPLE files also go into the same `edits` array — one call, atomic (any failure writes nothing). A batched call is one permission ask, one undo unit, and one turn instead of N. A top-level path may accompany the array — entries without their own path inherit it (entry paths override).

Parameters:
- path: File path (single form: required; with the edits array: optional — the default for entries without their own path)
- old_string: Current content of the region to change (must match exactly once — tolerant matching: exact → whitespace-only variant → fuzzy ≥90% line-equal). Mutually exclusive with line/startLine/endLine — required unless line targeting is used
- new_string: Desired result of the region — diffed against old_string (shared lines kept; old-only lines deleted — a replacement never leaves old lines behind). Content-based edits: required — an explicit empty string is an error (protects against forgetting it). Line-based edits (line/startLine/endLine): give it to replace the line/range, or OMIT it to delete — an explicit empty string is NOT deletion (error — omit instead)
- line: 1-based line number — replace that single line with new_string, or OMIT new_string to DELETE it (mutually exclusive with old_string and startLine/endLine)
- startLine / endLine: 1-based inclusive line range to replace with new_string (given together; mutually exclusive with old_string) — OMIT new_string to DELETE the range
- replace_all: Replace all occurrences instead of just one (default false; content-based targeting only)
- edits: Array of {path?, old_string?, new_string?, line?, startLine?, endLine?, replace_all?} entries — batch form; mutually exclusive with top-level old_string/new_string/line/startLine/endLine — a top-level path is allowed and applies to entries without their own path

Notes:
- Prefer this over write for targeted edits — it's safer and keeps changes targeted
- If old_string matches zero times (even fuzzy): error. If it matches multiple times without replace_all: error — add more surrounding context to make it unique
- Content-based edits: new_string empty is an explicit error (protects against forgetting it).
- Line-based edits: OMIT new_string to delete the line/range — deleting by number is an explicit, bounded intent.
- Returns `Edited <path>: replaced N occurrence(s)` (delete-mode: `Deleted line N of <path>` / `Deleted lines N-M of <path>`) + git diff + syntax-check note + context block (L..-L..).
- Never fabricate the old_string — copy it verbatim from the actual file using read first
- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed
