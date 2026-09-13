Edit a file using content-hash addressing instead of string matching. More reliable than edit when whitespace or encoding varies — hashes are computed from exact line bytes on disk.

Parameters:
- path (required): File path
- old_hashes (required): Array of SHA256 hashes (12-char hex) identifying lines to replace. Read the file with hashes=true first to obtain these hashes. For a single line, pass [hash]; for a contiguous block, pass [hash1, hash2, ...] in order.
- new_content (required): Replacement text (multi-line ok, \n separated)

Notes:
- The hash of each line is computed as SHA256(line_content).slice(0, 12) — the same algorithm used by read(hashes=true)
- Hashes are position-independent: they identify lines by content, not by line number (which changes after edits)
- If the hash sequence isn't found, the error will include the current file's hashes so you can retry with corrected values
- Prefer this over edit when: 1) the file may have mixed whitespace/encoding, 2) you want to edit a block of lines with a single call
- Replacement text replaces the lines identified by the hashes — content not present in new_content is deleted. For a new line after a known line, use insert_after. For a single simple string swap, use edit.
- use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed
