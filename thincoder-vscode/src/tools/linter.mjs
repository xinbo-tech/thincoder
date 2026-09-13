/**
 * linter.mjs — language-aware lint tool (replaces the weaker syntax_check)
 * Ported from CLI thincoder/src/tools/linter.mjs (DESC file-read replaced with inline description).
 * Fast path: node --check. Full path: language-aware cascade (tsc --noEmit for TS/TSX — requires tsconfig.json;
 * ruff/cargo/go for the other languages; JS/JSX falls back to node --check — eslint removed
 * 2026-09-02, TOOLS.md §10.2 zero-dependency).
 */

import { DESC, runInterruptible } from "./shared.mjs"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { resolvePath } from "./shared.mjs"

export const lintTool = {
  name: "lint",
  description: DESC("lint"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "File to check (default: most recently modified file)" },
      full: { type: "boolean", description: "Run the full language-aware cascade instead of just node --check (default false)" },
    },
    required: [],
  },
  readonly: true,
  async execute(args, ctx) {
    const abs = args.path
      ? resolvePath(args.path, ctx.cwd)
      : (ctx.agent?._touchedFiles?.at(-1) ? resolvePath(ctx.agent._touchedFiles.at(-1), ctx.cwd) : null)
    if (!abs) return "lint: no file specified and no recently modified file to check"

    if (!args.full) {
      return nodeCheckResult(abs, ctx.signal)
    }

    const ext = abs.split(".").pop()?.toLowerCase()
    const checkers = LANG_CHECKERS[ext]
    if (!checkers) return nodeCheckResult(abs, ctx.signal)

    for (const checker of checkers) {
      const result = await checker(abs, { cwd: ctx.cwd, signal: ctx.signal })
      if (result !== null) return result
    }
    return `lint: no linter available for ${abs}. Install one?`
  },
}

async function nodeCheckResult(abs, signal) {
  if (!/\.(?:m?js|cjs|m?ts|cts|jsx|tsx)$/.test(abs)) {
    return `lint (check): only JS/TS-family files supported for fast syntax check; use full=true for other languages. Path: ${abs}`
  }
  try {
    await runInterruptible(process.execPath, ["--check", abs], { cwd: undefined, timeout: 10000, signal })
    return `Syntax OK: ${abs}`
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || "").trim()
    return `Syntax error in ${abs}:\n${msg || "(unknown)"}`
  }
}

// ─── Full-check cascade checkers ──────────────────────

// Resolve npx's JS entry so we can spawn it via the current Node binary (avoids shell:true and
// Windows .cmd spawn EINVAL). npx-cli.js lives next to npm-cli.js in the global npm install.
const NPX_CLI = join(process.execPath.replace(/[\\/][^\\/]+$/, ""), "node_modules", "npm", "bin", "npx-cli.js")
const npxArgs = (args) => [NPX_CLI, ...args]

async function tscCheck(file, { cwd, signal }) {
  if (!existsSync(join(cwd, "tsconfig.json"))) return null
  if (!/\.(ts|tsx|mts|cts)$/.test(file)) return null
  try {
    await runInterruptible(process.execPath, npxArgs(["tsc", "--noEmit", "--pretty", "false"]), { cwd, timeout: 60000, signal })
    return "✓ tsc: no type errors"
  } catch (e) {
    const stdout = (e.stdout || "").trim()
    if (stdout) return stdout
    return `✗ tsc: ${(e.stderr || e.message).slice(0, 500)}`
  }
}

async function ruffCheck(file, { cwd, signal }) {
  if (!/\.py$/.test(file)) return null
  try {
    await runInterruptible("ruff", ["check", "--output-format", "concise", file], { cwd, timeout: 30000, signal })
    return "✓ ruff: no issues"
  } catch (e) {
    if (e.code === "ENOENT") return "lint: ruff not installed. Run: pip install ruff"
    const stdout = (e.stdout || "").trim()
    if (stdout) return stdout
    return `✗ ruff: ${(e.stderr || e.message).slice(0, 500)}`
  }
}

async function cargoCheck(file, { cwd, signal }) {
  if (!/\.rs$/.test(file)) return null
  if (!existsSync(join(cwd, "Cargo.toml"))) return null
  const fname = file.split(/[\\/]/).pop()
  try {
    const out = await runInterruptible("cargo", ["check", "--message-format", "short"], { cwd, timeout: 120000, signal })
    const errors = out.split("\n").filter((l) => l.includes(fname))
    return errors.length > 0 ? errors.join("\n") : "✓ cargo check: no errors"
  } catch (e) {
    const combined = ((e.stdout || "") + "\n" + (e.stderr || "")).trim()
    const errors = combined.split("\n").filter((l) => l.includes(fname) || l.startsWith("error"))
    return errors.length > 0 ? errors.join("\n") : `✗ cargo check failed:\n${combined.slice(0, 1000)}`
  }
}

async function goVet(file, { cwd, signal }) {
  if (!/\.go$/.test(file)) return null
  try {
    await runInterruptible("go", ["vet", file], { cwd, timeout: 60000, signal })
    return "✓ go vet: no issues"
  } catch (e) {
    return `✗ go vet: ${(e.stderr || e.message).slice(0, 500)}`
  }
}

const LANG_CHECKERS = {
  ts:  [tscCheck],
  tsx: [tscCheck],
  mts: [tscCheck],
  cts: [tscCheck],
  py:  [ruffCheck],
  rs:  [cargoCheck],
  go:  [goVet],
}
