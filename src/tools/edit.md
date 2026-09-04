Edit a file as a patch. old_string is the current content of the region to change (must match exactly once); new_string is the desired result of that region. Lines shared by both are kept; lines only in new_string take their position relative to the shared lines (LCS order) — when no line overlaps, new_string is inserted after old_string (old content stays) — except a unique single-line old_string paired with a single-line new_string: that exact line is replaced in place (line count unchanged); for a multi-line replacement, include a shared context line — for adding a new line use insert_after: a unique single-line old/new pair replaces the line in place; multi-line zero-overlap pairs still insert per the diff rules above. replace_all keeps literal replacement of every occurrence — the insert rule does not apply.

**Routing — pick the right edit tool:**
- Precise line-targeted change → `hashline_edit` (hash-based, immune to whitespace/encoding drift — preferred)
- Add a line/entry after a known line → insert_after — includes checklist items and doc lines.
- Same change across multiple files or many spots → `apply_patch`
- Rewrite an entire file → `write`
- Rename a symbol project-wide → `lsp` or `grep` first to map every caller

**Batch multiple edits into ONE call via the `edits` array** (preferred over N single edit calls): multiple changes to the SAME file go into one `edits` array (entries are applied serially, each based on the previous one's result); independent changes across MULTIPLE files also go into the same `edits` array — one call, atomic (any failure writes nothing). A batched call is one permission ask, one undo unit, and one turn instead of N. A top-level path may accompany the array — entries without their own path inherit it (entry paths override).

Parameters:
- path: File path (single form: required; with the edits array: optional — the default for entries without their own path)
- old_string (required): Current content of the region to change (must match exactly once)
- new_string (required): Desired result of the region — diffed against old_string (shared lines kept; zero overlap → new_string inserted after old_string — a unique single-line old/new pair replaces the line in place)
- replace_all: Replace all occurrences instead of just one (default false)
- edits: Array of {path?, old_string, new_string, replace_all?} entries — batch form; mutually exclusive with top-level old_string/new_string — a top-level path is allowed and applies to entries without their own path

Notes:
- Prefer this over write for targeted edits — it's safer and keeps changes targeted
- If old_string matches zero times: error. If it matches multiple times without replace_all: error — add more surrounding context to make it unique
- new_string empty (deletion) is an explicit error — keep the context lines you want to preserve in both old_string and new_string
- Returns `Edited <path>: replaced N occurrence(s)` + git diff + syntax-check note + context block (L..-L..).
- Never fabricate the old_string — copy it verbatim from the actual file using read first
- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed
