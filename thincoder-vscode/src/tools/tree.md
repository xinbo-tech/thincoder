Generate a directory tree of the codebase (default depth 3). Skips dotfiles, .git/node_modules/dist/build/bin/obj and other build/vendor dirs, and binary files. Use to quickly see which modules exist and where files live.

**Route to tree instead of bash:**
- `tree` / `find .` / `dir /s` → tree

Parameters:
- path: Root directory (default cwd)
- depth: Tree depth (default 3, max 6). Directories are listed before files, both sorted.

Notes:
- Capped at 200 entries.
- Directories end with `/`; tree-drawing uses `├──`/`└──`/`│`.
- Use depth for a shallow overview; use `ls` for one directory, `glob` for a specific file pattern.
- Returns the directory text tree — directories first (`dir/`), files after, both sorted, capped at 200 entries.