/**
 * verify.mjs — verifyTool
 *
 * Pre-completion verification GATE (VERIFY-REDESIGN.md alignment for the VS Code
 * agent). Generic, language/framework/project-agnostic: it does NOT run the
 * project's tests, does not parse which test covers which module, and never
 * blocks on its own check output. The MODEL declares its verification state and
 * verify mechanically gates on that declaration:
 *
 *   - verification.status "passed"              → 放行 (pass)
 *   - verification.status "failed"              → 打回 (_verifyPassed=false)
 *   - verification.status "skipped" + summary   → 放行 (must carry a reason)
 *   - verification.status "skipped" w/o summary → 打回 (空跳过不允许 — would let a
 *     change pass with no verification)
 *   - no / invalid verification declaration     → 打回 (must declare)
 *
 * A rejected report lists the changed files and points the model at the
 * project's AGENTS.md so IT decides (from the natural-language description there)
 * what verification applies to this change. Verification is never executed here.
 *
 * Retained mechanical extras (informational, never a gate):
 *   - doc-only fast path — all changed files are docs → nothing to run, pass
 *     (an explicit "failed" declaration is still respected)
 *   - optional syntax hint — node --check on changed .js/.mjs files, soft only
 *   - VS Code editor diagnostics — surfaced as advisory text for changed files
 *   - git-diff changed-file report, task list + self-review checklist
 */
import { resolvePath, runInterruptible } from "../tools/shared.mjs"
import * as vscode from "vscode"
import { existsSync } from "node:fs"
import { isDocPath, loadConventions } from "@thincoder/core/conventions.mjs"

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

// ─── Doc-only detection (VERIFY-REDESIGN D-V5: 保留 doc-only 快路径) ─────────
// Classification comes from the single authority (@thincoder/core/conventions.mjs): a doc
// extension that does NOT live inside a declared code segment (default: `src` —
// incl. prompts/*.md, at ANY depth). The former local DOC_FILE copy plus the
// anchored findProjectRoot/isUnderSrc walk are deleted with it (VP-10 — the local
// copy also missed nested layouts, and a project whose layout differs can now
// declare its code paths in .thincoder/conventions.json).

/** Doc-only change = non-empty list where EVERY file is a doc AND outside any
 *  declared code segment (src/** incl. prompts/*.md is product code). */
function isDocOnlyChange(files, cwd) {
  const conv = loadConventions(cwd)
  return files.length > 0 && files.every((f) => isDocPath(f, conv))
}

// ─── Verification gate (VERIFY-REDESIGN D-V1 / D-V2) ────────────────────────

/** Normalize the self-reported verification declaration. */
function normalizeVerification(verification) {
  const v = verification && typeof verification === "object" ? verification : null
  const status = typeof v?.status === "string" ? v.status : ""
  const summary = typeof v?.summary === "string" ? v.summary.trim() : ""
  const command = typeof v?.command === "string" ? v.command.trim() : ""
  return { status, summary, command }
}

/** Mechanical gate — decision follows the declared status only. */
function gateDecision(v) {
  if (v.status === "passed") return { pass: true, reason: "" }
  if (v.status === "failed") return { pass: false, reason: "failed" }
  if (v.status === "skipped") return v.summary ? { pass: true, reason: "" } : { pass: false, reason: "skipped-no-summary" }
  return { pass: false, reason: "missing" }
}

/** Advisory node --check syntax hint (D-V5 — soft, informational, never a gate).
 *  Shared by the pass path and rejection reports: a REJECTED change also surfaces
 *  syntax issues on its changed .js/.mjs (G11 — CLI parity, where the hint runs on
 *  the code path before the gate decision). Returns [] when nothing applies. */
async function syntaxHintLines(files, ctx) {
  const jsFiles = files.filter((f) => /\.(m?js)$/i.test(f) && existsSync(resolvePath(f, ctx.cwd)))
  if (jsFiles.length === 0) return []
  const lines = ["", "Syntax check (advisory — informational only, not a gate):"]
  for (const f of jsFiles) {
    const abs = resolvePath(f, ctx.cwd)
    try {
      await runInterruptible(process.execPath, ["--check", abs], { cwd: ctx.cwd, timeout: 10000, signal: ctx.signal })
      lines.push(`  ✓ ${f}: syntax OK`)
    } catch (e) {
      if (e.name === "AbortError") throw e // propagate Stop
      lines.push(`  ✗ ${f}: syntax issue found (${(e.stderr || e.message).slice(0, 200)})`)
    }
  }
  return lines
}

/** Rejection guidance — lists the changed files + points at AGENTS.md (D-V3).
 *  Also surfaces the advisory node --check hint on changed .js/.mjs (G11). */
async function rejectionReport(files, dec, v, ctx) {
  const reasonText = {
    missing:
      "verify was called without a declared verification state. Declare it via the verification parameter — {status:\"passed\"} | {status:\"failed\"} | {status:\"skipped\", summary:\"<why no verification applies>\"}.",
    failed:
      "You declared verification as failed — the change is not verified. Fix the underlying issues and run the applicable verification again before re-declaring.",
    "skipped-no-summary":
      "You declared verification as skipped but gave no reason. An empty skip is not allowed — it would let a change pass with no verification. Provide a summary explaining why no verification applies to this change.",
  }[dec.reason] ?? "A valid verification state must be declared."

  const lines = [
    "\n✗ NOT VERIFIED — verify rejected the change.",
    "",
    reasonText,
    "",
  ]
  if (files.length > 0) {
    lines.push("Changed files:")
    for (const f of files) lines.push(`  ${f}`)
    lines.push("")
  }
  const hint = await syntaxHintLines(files, ctx)
  if (hint.length) lines.push(...hint)
  lines.push("How to proceed: read the project's AGENTS.md — it declares how this project is verified (which tests/checks to run, or that verification is a manual review with no automated tests). Run whatever verification applies to THIS change yourself, then call verify again declaring the result.")
  return lines.join("\n")
}

export const verifyTool = {
  name: "verify",
  readonly: true,
  description:
    "Pre-completion verification gate. You declare your verification state (whether you already ran the project's verification and its result); verify mechanically gates on it and reports the changed files.\n" +
    "Parameters:\n" +
    "- verification (required): { status: \"passed\" | \"failed\" | \"skipped\", command?: \"the command you ran\", summary?: \"reason / result\" } — passed releases; failed is rejected; skipped is released only with a non-empty summary giving the reason (no empty skips). verify does NOT run your project's tests — read the project's AGENTS.md for the declared verification approach and run it yourself before declaring.\n" +
    "- workdir: Optional — run verify in this subdirectory (relative to cwd or absolute); changed-file resolution (_touchedFiles ∪ git diff) anchors here first (for monorepos)",
  parameters: {
    type: "object",
    properties: {
      verification: {
        type: "object",
        description: "Your self-reported verification state. Required to gate.",
        properties: {
          status: { type: "string", enum: ["passed", "failed", "skipped"] },
          command: { type: "string", description: "The verification command you ran (self-reported evidence — verify does not execute it)" },
          summary: { type: "string", description: "Reason for skipping, or short result summary" },
        },
        required: ["status"],
      },
      workdir: { type: "string", description: "Optional — run verify in this subdirectory (relative to cwd or absolute); changed-file resolution anchors here first (for monorepos)" },
    },
  },
  async execute(args, ctx) {
    const { workdir } = args
    const v = normalizeVerification(args.verification)
    const dec = gateDecision(v)

    const testCwd = workdir ? resolvePath(workdir, ctx.cwd) : ctx.cwd
    // Changed-file resolution: _touchedFiles ∪ git diff. workdir only relocates
    // where git (and changed-file resolution) runs.
    const { files, gitOk } = await resolveChangedFiles(ctx, testCwd)

    const lines = ["=== VERIFICATION REPORT ==="]
    if (!gitOk) lines.push("Changed files: (git unavailable — located via _touchedFiles)")
    if (files.length === 0) {
      // Nothing to verify — pass. Still respect an explicit failed declaration
      // (D-V2 uniformity, mirroring the doc-only fast path).
      if (dec.reason === "failed") {
        ctx.agent._verifiedThisRun = true
        ctx.agent._verifyPassed = false
        return await rejectionReport(files, dec, v, ctx)
      }
      lines.push("(no files modified — nothing to verify)")
      ctx.agent._verifiedThisRun = true
      ctx.agent._verifyPassed = true
      return lines.join("\n")
    }
    lines.push("Changed files:")
    for (const f of files) lines.push(`  ${f}`)

    // Doc-only fast path (D-V5): nothing to run for doc edits. Only an explicit
    // "failed" declaration is respected — otherwise pass without requiring a
    // declaration (there is genuinely nothing to verify on a doc change).
    if (isDocOnlyChange(files, ctx.cwd)) {
      if (dec.reason === "failed") {
        ctx.agent._verifiedThisRun = true
        ctx.agent._verifyPassed = false
        return await rejectionReport(files, dec, v, ctx)
      }
      lines.push("")
      lines.push("Documentation-only changes — no verification required for doc edits.")
      ctx.agent._verifiedThisRun = true
      ctx.agent._verifyPassed = true
      return lines.join("\n")
    }

    // Code change: rejected unless a valid pass/skip-with-reason is declared.
    if (!dec.pass) {
      ctx.agent._verifiedThisRun = true
      ctx.agent._verifyPassed = false
      return await rejectionReport(files, dec, v, ctx)
    }

    // ── Optional, non-gating mechanical hints (D-V5 — 不进门禁) ──
    // node --check soft syntax hint for changed .js/.mjs files (shared helper —
    // the same hint is surfaced in rejection reports too, G11).
    const hint = await syntaxHintLines(files, ctx)
    if (hint.length) lines.push(...hint)

    // VS Code editor diagnostics — advisory surface for changed files.
    const diagByFile = new Map()
    for (const [uri, diags] of vscode.languages.getDiagnostics()) {
      if (diags.length > 0) diagByFile.set(changedFileKey(uri.fsPath.replace(/\\/g, "/")), diags)
    }
    let advisoryDiag = 0
    for (const f of files) {
      const abs = resolvePath(f, ctx.cwd)
      const diags = diagByFile.get(changedFileKey(abs.replace(/\\/g, "/")))
      if (!diags?.length) continue
      const errors = diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Error)
      const warnings = diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Warning)
      if (!errors.length && !warnings.length) continue
      advisoryDiag += errors.length + warnings.length
      lines.push(`\nEditor diagnostics (advisory — informational only, not a gate):`)
      lines.push(`── ${f} (${errors.length} errors, ${warnings.length} warnings) ──`)
      for (const d of [...errors, ...warnings].slice(0, 15)) {
        const sev = d.severity === vscode.DiagnosticSeverity.Error ? "E" : "W"
        const line = d.range.start.line + 1
        const col = d.range.start.character + 1
        lines.push(`  ${sev} ${line}:${col}  ${d.message}${d.source ? ` [${d.source}]` : ""}`)
      }
    }
    if (advisoryDiag === 0 && files.some((f) => /\.(m?js|cjs|ts|tsx|mts|cts|rs|go|py)$/i.test(f))) {
      lines.push("\nEditor diagnostics: none for the changed code files.")
    }

    // ── Verdict — decision follows the declared status ──
    lines.push("")
    if (v.status === "passed") {
      lines.push("✓ Verification passed — you declared this change verified.")
    } else {
      lines.push(`✓ Verification skipped with reason: ${v.summary}`)
    }
    if (v.command) lines.push(`  Command: ${v.command}`)
    ctx.agent._verifiedThisRun = true
    ctx.agent._verifyPassed = true

    // Task list + self-review checklist (D-V5 — 保留 task/checklist 通用收尾).
    const tasks = ctx.agent._tasks ?? []
    lines.push("")
    if (tasks.length === 0) {
      lines.push("Task list: (no tasks tracked)")
    } else {
      const done = tasks.filter((t) => t.status === "done").length
      const open = tasks.filter((t) => t.status !== "done")
      lines.push(`Task list: ${done}/${tasks.length} done`)
      for (const t of tasks) {
        lines.push(`  ${t.status === "done" ? "✓" : t.status === "in_progress" ? "▶" : "○"} [${t.status}] ${t.title}`)
      }
      if (open.length > 0) lines.push(`  WARNING: ${open.length} task(s) still open — complete them or explain why they can be left undone.`)
    }
    lines.push("")
    lines.push("Self-review checklist:")
    lines.push("- [ ] Did I run the project's declared verification (per AGENTS.md) and did it pass?")
    lines.push("- [ ] Did I read every file I changed to catch leftover debug code or stale comments?")
    lines.push("- [ ] Do comments and docstrings match what the code actually does?")

    return lines.join("\n")
  },
}
