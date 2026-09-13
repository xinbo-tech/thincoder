LSP code intelligence: go to definition, find references, hover info, document symbols, diagnostics. Use this to understand code structure without grep-guessing function locations or type shapes. Find files with glob / repo_outline — use lsp for definition / references / diagnostics

Parameters:
- subcommand (required): LSP operation — "definition" | "references" | "hover" | "symbols" | "diagnostics"
- uri (required): Target file path (relative to project root)
- line: 1-based line number (for definition/references/hover)
- character: 1-based character offset (for definition/references/hover)

Notes:
- Returns the requested LSP result: definition location, references, hover info, document symbols, or diagnostics — or an error message.
