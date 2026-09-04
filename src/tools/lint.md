Run the appropriate linter/checker for a file. Auto-detects based on file extension and project config.
Without 'full', runs a fast node --check (JS/TS syntax only, catches parse errors in milliseconds).
With 'full', runs the language-aware cascade: tsc –noEmit (TS); ruff (Python); cargo check (Rust); go vet (Go). JS/JSX files fall back to node --check; TS uses tsc --noEmit (requires tsconfig.json).
Use the fast default after every write/edit; use 'full' before declaring a task complete.

Returns the check result: `Syntax OK: <path>` / `Syntax error in <path>: <message>` (or the language checker's output — `✓ no issues` or the failure text).

Parameters:
- path: File to check (default: most recently modified file)
- full: Run the full language-aware cascade instead of just node --check (default false)
