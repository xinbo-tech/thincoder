Edit a file by exact string replacement. old_string must match exactly once unless replace_all is set.

**Routing — pick the right edit tool:**
- Precise line-targeted change → `hashline_edit` (hash-based, immune to whitespace/encoding drift — preferred)
- One exact-string swap → this tool
- Add a function/block after a known line → `insert_after`
- Same change across multiple files or many spots → `apply_patch`
- Rewrite an entire file → `write`
- Rename a symbol project-wide → `lsp` or `grep` first to map every caller

**Batch multiple edits into ONE call via the `edits` array** (preferred over N single edit calls): multiple changes to the SAME file go into one `edits` array (entries are applied serially, each based on the previous one's result); independent changes across MULTIPLE files also go into the same `edits` array — one call, atomic (any failure writes nothing). A batched call is one permission ask, one undo unit, and one turn instead of N.

Parameters:
- path (required): File path
- old_string (required): Exact text to find and replace
- new_string (required): Replacement text
- replace_all: Replace all occurrences instead of just one (default false)
- edits: Array of {path, old_string, new_string, replace_all?} entries — batch form; mutually exclusive with path/old_string/new_string

Notes:
- Prefer this over write for targeted edits — it's safer and keeps changes targeted
- If old_string matches zero times: error. If it matches multiple times without replace_all: error — add more surrounding context to make it unique
- Never fabricate the old_string — copy it verbatim from the actual file using read first
