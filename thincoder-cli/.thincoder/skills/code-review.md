# code-review — systematic code review

## When to Use
When the user asks to review code, before committing, or after completing a feature.

## Review Checklist

### Correctness
- [ ] Does every line do exactly what it claims?
- [ ] Are edge cases handled? (null, empty, boundary values, error paths)
- [ ] Are async operations properly awaited?
- [ ] Is error handling present and meaningful (not silent catch-all)?

### Safety
- [ ] No hardcoded secrets, tokens, or keys
- [ ] File paths are validated (no path traversal)
- [ ] User input is sanitized where needed
- [ ] SQL/command injection vectors are closed

### Design
- [ ] Functions are small and do one thing
- [ ] No duplicated logic (DRY)
- [ ] Naming is clear and consistent with project conventions
- [ ] Dependencies flow in one direction (no circular imports)

### Performance
- [ ] No N+1 queries or unnecessary loops
- [ ] Large files are streamed, not buffered entirely
- [ ] Expensive operations are cached where appropriate

### Testing
- [ ] New behavior has corresponding tests
- [ ] Tests cover happy path AND error paths
- [ ] Existing tests still pass

### Documentation
- [ ] Public APIs have JSDoc/docstrings
- [ ] Complex logic has explanatory comments (why, not what)
- [ ] README/CHANGELOG updated if user-facing

## Delivery
- List findings by severity: 🔴 critical, 🟡 warning, 🔵 suggestion
- Each finding: file:line, what's wrong, suggested fix
- Summarize at the end: X critical, Y warnings, Z suggestions
