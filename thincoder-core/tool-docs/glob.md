Find files by glob pattern. Returns matching paths (relative to the search path), sorted, capped at 1000. Use this to discover file structure; use grep to search file contents.

Parameters:
- pattern (required): Glob pattern — supports `**` (recursive), `**/`, `*` (within a segment), `?` (single char), `[..]` character classes, and `{a,b}` brace expansion (e.g. `**/*.{js,txt}` matches .js and .txt files at any depth). Space-separated multiple patterns with a leading `!` are EXCLUSIONS — `**/*.js !test/**` matches .js files except those under test/. Pattern matching is relative to `path`. A pattern containing a literal space is fine on its own (spaces only separate patterns when a `!` exclusion is present). An expression splits ONLY before `!`-exclusion tokens — to match several extensions in one include, use a `{a,b}` group (e.g. `**/*.{js,md}`); adjacent space-separated includes are not a supported form.
- path: Directory to search in (default cwd)

Notes:
- Invalid glob syntax is an EXPLICIT error — never a silent no-match. Unsupported extglob dialects (`?(x)`/`@(a|b)`/`+(x)`) and malformed braces (empty `{}`, unclosed `{`, nested `{a,{b,c}}`) return `glob error: ...` — use `{a,b}` or a space-separated `!exclude` pattern instead.
- Skips node_modules, .git, dist, build, .turbo, coverage
- Results capped at 1000 matches
- Prefer patterns with a literal anchor (extension or subdirectory) over bare wildcards
