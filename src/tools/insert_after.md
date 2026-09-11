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
- **Read-before-insert guard**: if the file was modified by any write tool (write/edit/insert_after/hashline_edit/apply_patch/delete) since your last `read`, this tool REFUSES with an error — line numbers may be stale. Read the file again, then retry. This prevents after_line from silently landing at a drifted position.
- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed
