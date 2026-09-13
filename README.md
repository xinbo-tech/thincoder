# ThinCoder — merged repository

Single git repository hosting both ThinCoder products. Each product keeps its own package root,
its own release chain and its own documentation tree; they share no runtime code path.

## Layout

| Path | What it is | Release chain |
|---|---|---|
| `thincoder-cli/` | ThinCoder CLI (npm package `thincoder`) | npm `publish` — gate = lint → test:full → test:integration |
| `thincoder-vscode/` | ThinCoder VS Code extension (vsix `thincoder-vscode`) | Marketplace / Open VSX — gate = lint + doc:check → test:full → test:integration |
| `.github/workflows/test.yml` | CI: one job per product (repo-root workflow) | GitHub Actions |
| `.gitattributes` · `.gitignore` | repository-root settings shared by both products | — |

`thincoder-cli/` is the original CLI repository relocated one level down. `thincoder-vscode/` was merged in
together with its git history through `git subtree add --prefix=thincoder-vscode`.

## Running a product's gates

Every command runs inside the product directory — all paths are product-relative.

```bash
cd thincoder-cli && npm install && npm test && npm run lint
cd thincoder-cli && npm run test:full && npm run test:integration
cd thincoder-vscode && npm install && npm run lint && npm run doc:check
cd thincoder-vscode && npm test && npm run test:full && npm run test:integration
```

Entry points: `thincoder-cli/AGENTS.md` · `thincoder-cli/docs/README.md` (CLI) and `thincoder-vscode/AGENTS.md` ·
`thincoder-vscode/docs/README.md` (extension).

## History notes

- The CLI tree's history is the repository history — the relocation was a pure rename, so `git log` /
  `git blame` follow CLI files across it unchanged.
- Extension history is joined through a subtree graft. Per-path traversal needs merge-aware `--follow`:
  `git log --follow -m -- thincoder-vscode/package.json` (plain `git log --follow` returns nothing across a
  subtree graft). `git blame` crosses the graft without extra flags.
- Release tags belong to the CLI line; the extension repository keeps its own tags at its original remote,
  so the two tag sets never collide here.

## Project docs

Project-level documents — the cross-product layer (ledger · board requirements/design · batch records) — live under
`docs/`. See `docs/README.md` for the map and the **staged migration policy**: new project-level documents go there
from now on; existing ones stay where they are as **references** and migrate when their surface is next touched.
Per-product docs remain in each product tree (`thincoder-cli/docs/` · `thincoder-vscode/docs/`).

## Merge record

Requirements, design and batch record for the layout change (phase 1 · TWO-REPO-MERGE) still live in the CLI tree as
references pending migration:
`thincoder-cli/docs/requirements/TWO-REPO-MERGE.md` · `thincoder-cli/docs/design/TWO-REPO-MERGE.md` ·
`thincoder-cli/docs/batches/2026-09-13-TWO-REPO-MERGE.md`.

## Project ledger

The merged repository keeps a single project ledger at the repository root — the two per-product ledgers
were retired in the 2026-09-13 single-ledger consolidation:

| Path | What it holds |
|---|---|
| `docs/TODO.md` | open items — requirement pool (user requirement points) + tech backlog (design debt / review findings) |
| `docs/TODO-archive.md` | closed items (resolved / withdrawn), moved out of the live file |

