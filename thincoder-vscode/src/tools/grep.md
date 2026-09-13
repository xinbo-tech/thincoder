Search file contents with a regex. Returns matching lines as path:line: content.

**Route to grep instead of bash:** `findstr /c:"pat" file` / `grep -rn pat .` → grep. Searching file contents is a read — never shell out for it.

Parameters:
- pattern (required): JavaScript regular expression, or a literal string when literal=true
- path: Directory or file to search (default cwd)
- glob: Only search files matching this glob — supports `**`, `*`, `?`, `[..]`, `{a,b}` braces and space-separated exclusion (`"**/*.js !test/**"` = .js files outside test/); e.g. '*.mjs'
- ignoreCase: Case-insensitive match (default false)
- literal: Literal string match — no regex interpretation (default false; use for strings with `. \` etc.)

Notes:
- Skips node_modules, .git, dist, build, .turbo, coverage
- Results capped at 200 matches
- Binary/unreadable files are silently skipped
- Use this to find usages, definitions, patterns; use glob to find files by name
