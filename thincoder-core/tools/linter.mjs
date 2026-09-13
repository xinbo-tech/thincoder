import { DESC, resolveInCwd } from "./shared.mjs"
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"

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
      ? resolveInCwd(ctx, args.path)
      : (ctx.agent?._touchedFiles?.at(-1) || null)
    if (!abs) return "lint: no file specified and no recently modified file to check"

    if (!args.full) {
      // Fast path: node --check only
      return nodeCheckResult(abs)
    }

    // Full cascade: language-aware (tsc → node --check, ruff, cargo, go vet —
    // third-party linter cascade removed 2026-09-02, TOOLS.md §10.2: zero-dependency lint)
    const ext = abs.split(".").pop()?.toLowerCase()
    const checkers = LANG_CHECKERS[ext]
    if (!checkers) return nodeCheckResult(abs) // fall back to node --check

    for (const checker of checkers) {
      const result = await checker(abs, { cwd: ctx.cwd, existsSync, execFileSync, join, relative })
      if (result !== null) return result
    }
    return `lint: no linter available for ${abs}. Install one?`
  },
}

function nodeCheckResult(abs) {
  if (!/\.(?:m?js|cjs|m?ts|cts|jsx|tsx)$/.test(abs)) {
    return `lint (check): only JS/TS-family files supported for fast syntax check; use full=true for other languages. Path: ${abs}`
  }
  try {
    execFileSync(process.execPath, ["--check", abs], {
      encoding: "utf8", timeout: 10000, stdio: ["ignore", "pipe", "pipe"],
    })
    return `Syntax OK: ${abs}`
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || "").trim()
    return `Syntax error in ${abs}:\n${msg || "(unknown)"}`
  }
}

// ─── Full-check cascade checkers (third-party linter branch removed 2026-09-02, TOOLS.md §10.2) ──────

async function tscCheck(file, { cwd, existsSync, execFileSync, join }) {
  if (!existsSync(join(cwd, "tsconfig.json"))) return null
  if (!/\.(ts|tsx|mts|cts)$/.test(file)) return null
  try {
    execFileSync("npx", ["tsc", "--noEmit", "--pretty", "false"], {
      cwd, encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "pipe"],
    })
    return "✓ tsc: no type errors"
  } catch (e) {
    const stdout = (e.stdout || "").trim()
    if (stdout) return stdout
    return `✗ tsc: ${(e.stderr || e.message).slice(0, 500)}`
  }
}

async function ruffCheck(file, { cwd, execFileSync }) {
  if (!/\.py$/.test(file)) return null
  try {
    execFileSync("ruff", ["check", "--output-format", "concise", file], {
      cwd, encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"],
    })
    return "✓ ruff: no issues"
  } catch (e) {
    if (e.code === "ENOENT") return "lint: ruff not installed. Run: pip install ruff"
    const stdout = (e.stdout || "").trim()
    if (stdout) return stdout
    return `✗ ruff: ${(e.stderr || e.message).slice(0, 500)}`
  }
}

async function cargoCheck(file, { cwd, existsSync, execFileSync, join }) {
  if (!/\.rs$/.test(file)) return null
  if (!existsSync(join(cwd, "Cargo.toml"))) return null
  const fname = file.split(/[\\/]/).pop()
  try {
    const out = execFileSync("cargo", ["check", "--message-format", "short"], {
      cwd, encoding: "utf8", timeout: 120000, stdio: ["ignore", "pipe", "pipe"],
    })
    const errors = out.split("\n").filter(l => l.includes(fname))
    return errors.length > 0 ? errors.join("\n") : "✓ cargo check: no errors"
  } catch (e) {
    const combined = ((e.stdout || "") + "\n" + (e.stderr || "")).trim()
    const errors = combined.split("\n").filter(l => l.includes(fname) || l.startsWith("error"))
    return errors.length > 0 ? errors.join("\n") : `✗ cargo check failed:\n${combined.slice(0, 1000)}`
  }
}

async function goVet(file, { cwd, execFileSync }) {
  if (!/\.go$/.test(file)) return null
  try {
    execFileSync("go", ["vet", file], {
      cwd, encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "pipe"],
    })
    return "✓ go vet: no issues"
  } catch (e) {
    return `✗ go vet: ${(e.stderr || e.message).slice(0, 500)}`
  }
}

const LANG_CHECKERS = {
  // js/mjs/cjs/jsx fall back to node --check (no entry — third-party linter cascade removed 2026-09-02, TOOLS.md §10.2)
  ts:  [tscCheck],
  tsx: [tscCheck],
  mts: [tscCheck],
  cts: [tscCheck],
  py:  [ruffCheck],
  rs:  [cargoCheck],
  go:  [goVet],
}
