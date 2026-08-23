List directory contents with type, size, and modification time. Directories listed first. Use to see what a directory contains (glob only matches files).

**Route to ls instead of bash:** `dir /b` / `ls` / `dir` → ls. Listing a directory is a read — never shell out for it.

Parameters:
- path: Directory path (default cwd)
- filter: Only list entries matching this glob (e.g. '*.mjs', '*test*') — a wildcard filter, not a full listing

Notes:
- Shows first 500 entries
- Directories are suffixed with `/` and listed before files
- Use this for a quick overview; use glob when you have a specific file pattern in mind
