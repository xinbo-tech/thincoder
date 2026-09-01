Apply a unified diff to one or more files, atomically: if any hunk fails to apply, nothing is written.

**Use it for whole-file and multi-file changes:** creating MULTIPLE new files at once (`--- /dev/null` header per file), whole-file replacement, and cross-file refactors — one unified-diff call covers the whole change. A batched call is one permission ask and one turn instead of N separate calls.

Parameters:
- patch (required): Unified diff text. One `--- a/path` / `+++ b/path` header pair per file, then `@@ -old,count +new,count @@` hunks. Use `--- /dev/null` to create a new file.

Notes:
- Use this for multi-file changes (e.g. rename an interface + update all callers) — one call, all-or-nothing
- Hunks are located by their context/removed lines, not line numbers — but the context must match the file EXACTLY. Read the files first and generate the patch from actual content
- If a hunk's context matches multiple locations it is rejected — add more surrounding context lines
- Deleting files is not supported — use the delete tool
- For single-file edits, edit is simpler; for full rewrites, write is simpler
