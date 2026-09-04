/**
 * verify.mjs — verifyTool
 * Run a pre-completion self-check: syntax checks + VSCode diagnostics on changed files,
 * optionally the full test suite.
 */
import { resolvePath, runInterruptible } from "../tools/shared.mjs"
import * as vscode from "vscode"
import { existsSync } from "node:fs"
import { join } from "node:path"

/**
 * §18.12 D-VR1 path normalization — mirrors the §20.5 file-domain handling:
 * resolved to an absolute path with forward slashes; dedup uses the win32
 * lowercase comparison key (changedFileKey) so "D:/x/src/a.mjs" and
 * "d:\\x\\SRC\\a.mjs" count as the same file.
 */
function normalizeChangedPath(p, base) {
  return resolvePath(p, base).replace(/\\/g, "/")
}

/** Win32 comparison key: case-insensitive drives/folders (same file). */
function changedFileKey(p) {
  return process.platform === "win32" ? p.toLowerCase() : p
}

/**
 * Changed-file resolution (§18.12 D-VR1): _touchedFiles (per-run bookkeeping —
 * absolute paths, recorded for top-level and subagent tool writes) ∪ git diff
 * fallback. git diff is tried at testCwd (workdir-resolved) first, then at
 * ctx.cwd; first success wins. git diff output is repo-root-relative, so
 * relative paths resolve against the actual git root (rev-parse
 * --show-toplevel) per D-VR1. Union deduped by the canonical key (absolute +
 * forward slashes + win32 lowercase). Returns { files, gitOk } — files in
 * normalized absolute form; gitOk false when every git attempt failed.
 */
async function resolveChangedFiles(ctx, testCwd) {
  const touchedFiles = (ctx.agent._touchedFiles ?? []).map((p) => normalizeChangedPath(p, ctx.cwd))
  let gitOk = false
  let gitFiles = []
  for (const gitCwd of new Set([testCwd, ctx.cwd])) {
    try {
      const root = (await runInterruptible("git", ["rev-parse", "--show-toplevel"], { cwd: gitCwd, timeout: 5000, signal: ctx.signal })).trim()
      const nameOnly = await runInterruptible("git", ["diff", "--name-only"], { cwd: gitCwd, timeout: 5000, signal: ctx.signal })
      gitOk = true
      gitFiles = nameOnly.split("\n").filter(Boolean).map((p) => normalizeChangedPath(p, root))
      break
    } catch (e) {
      if (e.name === "AbortError") throw e // propagate Stop — do not swallow as a git failure
      // git unavailable here — try the next cwd in the chain
    }
  }
  // Union, deduped by comparison key (win32 case-insensitive).
  const seen = new Set()
  const files = [...touchedFiles, ...gitFiles].filter((p) => {
    const k = changedFileKey(p)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { files, gitOk }
}

export const verifyTool = {
  name: "verify",
  readonly: true,
  description:
    "Run a pre-completion self-check. Runs syntax checks and reads editor diagnostics on changed files.\n" +
    "Parameters:\n" +
    "- full: Also run the full test suite (default false)\n" +
    "- workdir: Optional — run verify in this subdirectory (relative to cwd or absolute); tests and changed-file resolution (_touchedFiles ∪ git diff) anchor here first (for monorepos)\n" +
    "- filter: Optional — limit the test run to matching test names (node --test-name-pattern)",
  parameters: {
    type: "object",
    properties: {
      full: { type: "boolean", description: "Run full test suite" },
      workdir: { type: "string", description: "Optional — run verify in this subdirectory (relative to cwd or absolute); tests and changed-file resolution (_touchedFiles ∪ git diff) anchor here first (for monorepos)" },
      filter: { type: "string", description: "Optional — limit the test run to matching test names (node --test-name-pattern)" },
    },
  },
  async execute({ full, workdir, filter }, ctx) {
    const testCwd = workdir ? resolvePath(workdir, ctx.cwd) : ctx.cwd
    // Changed-file resolution (§18.12 D-VR3): _touchedFiles (per-run bookkeeping,
    // absolute paths) ∪ git diff fallback — git is tried at testCwd
    // (workdir-resolved) first, then at ctx.cwd; first success wins.
    // workdir only relocates where git/tests (and package.json) live.
    const { files, gitOk } = await resolveChangedFiles(ctx, testCwd)
    if (files.length === 0) return "(no files modified — nothing to verify)"

    let anyFailure = false
    const results = []
    if (!gitOk) results.push("Changed files: (git unavailable — located via _touchedFiles)")

    // 1. Syntax check (node --check) for JS files — interruptible (Stop kills it)
    for (const f of files) {
      if (/\.(m?js|cjs)$/i.test(f)) {
        try {
          const abs = resolvePath(f, ctx.cwd)
          if (!existsSync(abs)) continue // skip deleted files (git diff lists them; CLI parity)
          await runInterruptible(process.execPath, ["--check", abs], { cwd: ctx.cwd, timeout: 10000, signal: ctx.signal })
          results.push(`✓ ${f}: syntax OK`)
        } catch (e) {
          if (e.name === "AbortError") throw e  // propagate Stop — do not swallow as a syntax failure
          anyFailure = true
          results.push(`✗ ${f}: ${(e.stderr || e.message).slice(0, 200)}`)
        }
      } else {
        results.push(`- ${f}: not a JS file, skipped syntax check`)
      }
    }

    // 2. VSCode diagnostics (LSP — eslint, tsc, rust-analyzer, etc.)
    // §18.12: the changed-file union is normalized (absolute + forward slashes
    // + win32 lowercase key) — diagByFile is keyed in the same domain, so
    // native-separator fsPath entries still match the union entries.
    const allDiags = vscode.languages.getDiagnostics()
    const diagByFile = new Map()
    for (const [uri, diags] of allDiags) {
      if (diags.length > 0) diagByFile.set(changedFileKey(uri.fsPath.replace(/\\/g, "/")), diags)
    }

    let diagCount = 0
    for (const f of files) {
      const abs = resolvePath(f, ctx.cwd)
      const diags = diagByFile.get(changedFileKey(abs.replace(/\\/g, "/")))
      if (!diags || diags.length === 0) continue

      const errors = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error)
      const warnings = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Warning)
      if (errors.length === 0 && warnings.length === 0) continue

      if (errors.length > 0) anyFailure = true
      diagCount += errors.length + warnings.length

      results.push(`\n── ${f} (${errors.length} errors, ${warnings.length} warnings) ──`)
      const show = [...errors, ...warnings].slice(0, 15)
      for (const d of show) {
        const sev = d.severity === vscode.DiagnosticSeverity.Error ? "E" : "W"
        const line = d.range.start.line + 1
        const col = d.range.start.character + 1
        const src = d.source ? ` [${d.source}]` : ""
        results.push(`  ${sev} ${line}:${col}  ${d.message}${src}`)
      }
      const remaining = (errors.length + warnings.length) - show.length
      if (remaining > 0) results.push(`  ... ${remaining} more`)
    }
    if (diagCount === 0 && files.some(f => /\.(m?js|cjs|ts|tsx|mts|cts|rs|go|py)$/i.test(f))) {
      results.push("\n✓ diagnostics: no errors or warnings")
    }

    // 3. Test suite (full mode) — interruptible (Stop kills npm test)
    if (full) {
      try {
        // npm-cli.js via the current Node binary (avoids Windows npm.cmd spawn EINVAL;
        // same pattern as linter's NPX_CLI). execSync froze the host event loop and a
        // Stop click could not even be DELIVERED until the command finished.
        const npmCli = join(process.execPath.replace(/[\\/][^\\/]+$/, ""), "node_modules", "npm", "bin", "npm-cli.js")
        const testResult = await runInterruptible(process.execPath, [npmCli, "test", ...(filter ? ["--", `--test-name-pattern=${filter}`] : [])], { cwd: testCwd, timeout: 60000, signal: ctx.signal })
        results.push(`\n=== Test suite ===\n${testResult.slice(0, 3000)}`)
      } catch (e) {
        if (e.name === "AbortError") throw e  // propagate Stop
        anyFailure = true
        results.push(`\n=== Test suite FAILED ===\n${(e.stdout || e.stderr || e.message).slice(0, 2000)}`)
      }
    }

    ctx.agent._verifiedThisRun = true
    ctx.agent._verifyPassed = !anyFailure
    return results.join("\n")
  },
}
