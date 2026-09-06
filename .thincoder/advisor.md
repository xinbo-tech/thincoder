Review the code changes, focusing on:
1. Correctness: logic errors, edge cases, off-by-one, incomplete modifications
2. Security: unhandled exceptions, null references, resource leaks, race conditions
3. Consistency: alignment with existing project patterns and conventions
4. Completeness: missing callers, imports, or follow-up changes
5. Maintainability: vague naming, missing comments, overly complex logic

File size rule:
- .mjs or .js files exceeding 300 lines — flag as advisory (🟡): suggest splitting into smaller modules.
- .mjs or .js files exceeding 500 lines — flag as critical (🔴): must be split before merge.
