Insert a line of text after a specific line in a file. Safer than `edit` for adding new content — no need to copy surrounding context for exact string matching.

Parameters:
- path (required): File path
- content (required): Text to insert (will be placed as a new line after the target line)
- after_line: Line number to insert after (1-based). Preferred when you know the exact line number from `read`.
- after_regex: JavaScript regex to find the line to insert after. Must match exactly one line; if it matches multiple, the tool errors and shows the matching line numbers.

Notes:
- Either after_line or after_regex is required; if both are given, after_line wins.
- Use this instead of edit when you're adding a new line — a checklist item, a doc heading, a line of prose, a function, an import, or a block — no need to fabricate surrounding context for exact matching.
- The inserted content becomes its own line; it's equivalent to `lines.splice(targetLine, 0, content)`.
- Returns a diff of the change.
- **Read-before-insert guard**: `after_line` is judged against the last write to that file — a line at or above that write's write point is allowed; inside or below it, or when the file was written after it without updating that anchor, the call is refused with the path, the drift and two ways on (re-read, or address the region without line numbers).
- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed

**`ledger`** — the in-flight ledger row this call serves: `"#N"` or `"N"`. In engineering mode the parent agent must pass it — a call that does not say which row it serves is refused.
