Read a text file. Returns numbered lines. Use offset/limit to page large files.

**Route to read instead of bash:** `cat file` / `type file` / `node -e "fs.readFileSync(...)"` → read. Reading a file is a read — never shell out for it.

**Routing:**
- Don't know which file? → `repo_outline` / `code_search` / `glob` first
- Know the symbol but not the location? → `code_search` or `lsp definition`
- Know the file but not the lines? → `grep` to find line numbers, then read that range with offset/limit
- Reading an image? → `read_image` instead

Parameters:
- path (required): File path, relative to cwd or absolute (alias: filePath)
- offset: 1-based line number to start reading from
- limit: Max lines to return (default 2000)
- hashes: Include SHA256 content hashes per line (for hashline_edit). Set true before using hashline_edit.

Notes:
- Always prefer this over `cat` or shell-based reading — it caps output and avoids large dumps
- Use offset for pagination when the file is large
- When you plan to edit the file, set hashes=true to get line hashes for hashline_edit — hash-based editing avoids whitespace/encoding matching failures
