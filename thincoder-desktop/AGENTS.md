# AGENTS.md — ThinCoder Desktop Guide

## Project Overview

Electron desktop shell for the ThinCoder AI coding agent: a main process (`src/main/`), a sandboxed preload bridge (`src/preload/preload.cjs`), and a zero-build renderer (`renderer/`) served over the privileged `app://desktop/` scheme. Shared mechanisms live in the core package `@thincoder/core`; shared UI pieces live in `@thincoder/render-core` (the same source the VS Code webview consumes).

Zero third-party runtime dependencies beyond the two in-repo packages above. ESM `.mjs` throughout, no build/bundling step.

## Commands

```bash
npm start          # launch the desktop instance (electron .)
npm test           # test suite (test/run.mjs — explicit manifest, see test/files.mjs)
npm run package    # electron-builder packaging (electron-builder.yml lands with the packaging batch)
```

## Key Conventions

- **Isolation triple**: `contextIsolation: true` / `sandbox: true` / `nodeIntegration: false`; the renderer reaches the main process only through the preload channel whitelist (`src/preload/preload.cjs` `CHANNELS` — single source of truth, the main process registers from it).
- **Renderer static closure**: renderer files import zero `node:` modules and zero bare packages; core UI pieces come in via same-origin absolute paths under `/rc/` (the `@thincoder/render-core` package served by the `app://` protocol handler).
- **Session / config persistence is shared with the CLI and VS Code** — same on-disk formats under `~/.thincoder/`; the desktop keeps no storage of its own.
- **Fail loud, never silent**: read/write failures are logged and surfaced (`console.error` + a visible face where one exists); no swallowed errors, no fake success receipts.
- **Design docs** live at `../docs/desktop/design/` (SHELL / IPC / UI / PROJECT) and `../docs/desktop/requirements/`; the render-core sharing contract is at `../docs/render-core/design/RENDER-CORE.md`.
- **Commit messages**: `type: summary` (feat/fix/release/docs), single English line.
