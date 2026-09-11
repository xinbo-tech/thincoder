/**
 * verify.mjs — verify tool: generic pre-completion verification gate (VERIFY-REDESIGN.md).
 * Verify is language/framework/project agnostic: it does NOT hardcode any project's
 * module→test mapping, does NOT auto-run any test/verification command, and does NOT
 * require a test for every change. The model DECLARES its verification status via the
 * `verification` argument (whether it already ran the project's verification and the
 * result); verify makes a mechanical gate decision on that declaration. Which
 * verification to run is described in natural language in each project's AGENTS.md —
 * verify never parses or executes it. Retained mechanical checks: doc-only fast path,
 * an advisory (non-gating) node --check hint, git diff report, and — on the code
 * path (doc-only changes return early) — the task list and self-review checklist.
 */

import { isCodePath, isDocPath, loadConventions } from "../conventions.mjs"
import { execSync, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

/**
 * §18.12 D-VR1 path normalization — mirrors the §20.5 file-domain handling:
 * resolved to an absolute path with forward slashes; dedup uses the win32
 * lowercase comparison key (changedFileKey) so "D:/x/src/a.mjs" and
 * "d:\\x\SRC\a.mjs" count as the same file.
 */
function normalizeChangedPath(p, base) {
  return resolve(base, p).replace(/\\/g, "/")
}

/** Win32 comparison key: case-insensitive drives/folders (same file). */
function changedFileKey(p) {
  return process.platform === "win32" ? p.toLowerCase() : p
}

/**
 * D-V3 block guidance — a block message must not just say "not verified": it lists
 * the changed code files and points to the project's AGENTS.md natural-language
 * description of how to verify, so the model knows what to run/add.
 */
function appendBlockGuidance(lines, codeFiles) {
  lines.push("")
  lines.push("Changed code file(s):")
  for (const f of codeFiles) lines.push(`  ${f}`)
  lines.push("")
  lines.push("verify does not run commands for you — decide and run the project's verification yourself.")
  lines.push("Reference the verification approach declared in the project's AGENTS.md (natural language, e.g. \"tests run with npm test\" / \"no automated tests — rely on manual review\") to decide what to run, then call verify again declaring the outcome via verification.status.")
}

/**
 * verify tool: generic pre-completion verification gate. Flow:
 * 0. Doc-only fast path — all changed files are docs: short report, no verification needed.
 * 1. git diff --stat — changed file list (_touchedFiles ∪ git diff)
 * 2. Advisory syntax hint (D-V5) — node --check changed .js/.mjs when node exists; SOFT, not gating.
 * 3. Verification gate (D-V1/D-V2) — requires the model to DECLARE verification.status:
 *    passed → allowed; failed → blocked; skipped → allowed but needs a summary reason.
 * 4. Task list + self-review checklist.
 * Agent must not say "done" before verify passes.
 */
export const verifyTool = {
  name: "verify",
  description:
    "Generic pre-completion verification gate — language/framework/project agnostic. verify does NOT run any test/verification command for you and does NOT require a test per change. You DECLARE your verification status via the verification argument: { status: 'passed' | 'failed' | 'skipped', command?, summary? }. 'passed' → allowed; 'failed' → blocked (cannot claim done); 'skipped' → allowed but requires a summary reason. Whether/how to verify is described in natural language in the project's AGENTS.md and is decided + executed by you — verify only mechanically gates on your declaration. Also reports changed files (git diff), an advisory node --check hint on changed .js/.mjs (not gating), the task list, and a self-review checklist. Call this BEFORE declaring a coding task complete — do not say 'done' until verify passes.",
  parameters: {
    type: "object",
    properties: {
      verification: {
        type: "object",
        description: "The model's declaration of whether it already ran the project's verification and its outcome. verify does not execute the command — it is self-reported evidence.",
        properties: {
          status: { type: "string", enum: ["passed", "failed", "skipped"], description: "The verification outcome you declare: 'passed' → allowed; 'failed' → blocked; 'skipped' → allowed but requires a summary reason." },
          command: { type: "string", description: "Optional: the verification command you ran (self-reported — verify does not execute it)." },
          summary: { type: "string", description: "Optional: summary/result of the verification. Required when status='skipped' — a concrete reason (e.g. \"project has no automated tests — verified by manual review\")." },
        },
        required: ["status"],
      },
      workdir: { type: "string", description: "Optional: run verify in this subdirectory (relative to cwd or absolute) — for monorepos" },
    },
  },
  readonly: true,
  async execute(args, ctx) {
    const cwd = ctx.agent.cwd
    // Changed-file resolution (§18.12 D-VR3): _touchedFiles (per-run bookkeeping,
    // absolute paths) ∪ git diff fallback — git is tried at testCwd
    // (workdir-resolved) first, then at ctx.agent.cwd; first success wins.
    // git-diff paths are repo-root-relative — resolved against the discovered
    // git root, then normalized (absolute, forward slashes, win32 key).
    const testCwd = args.workdir ? resolve(cwd, args.workdir) : cwd
    const lines = []
    lines.push("=== VERIFICATION REPORT ===")
    lines.push("")

    // 1. Changed files — _touchedFiles ∪ git diff (§18.12 D-VR1)
    let gitOk = false
    let gitStat = ""
    let gitFiles = []
    for (const gitCwd of new Set([testCwd, cwd])) {
      try {
        // Anchor the repo root FIRST (also proves git works here) — diff paths
        // are repo-root-relative, so both diff calls run at the root.
        const gitRoot = execSync("git rev-parse --show-toplevel", { cwd: gitCwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).trim() || gitCwd
        const diff = execSync("git diff --stat", { cwd: gitRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })
        const nameOnly = execSync("git diff --name-only", { cwd: gitRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })
        gitOk = true
        gitStat = diff.trim()
        gitFiles = nameOnly.trim().split("\n").filter(Boolean).map((p) => normalizeChangedPath(p, gitRoot))
        break
      } catch { /* git unavailable here — try the next cwd in the chain */ }
    }
    if (gitOk && gitStat) {
      lines.push("Changed files (git diff --stat):")
      lines.push(gitStat)
    } else if (gitOk) {
      lines.push("Changed files: (none — no uncommitted changes)")
    } else {
      lines.push("Changed files: (not a git repo or git unavailable)")
    }
    // _touchedFiles: files written by the tools this run — captured regardless
    // of git state (§18.12 F-VR1: subagent cwd ≠ git root must still locate).
    const touchedFiles = (ctx.agent._touchedFiles ?? []).map((p) => normalizeChangedPath(p, cwd))
    const gitKeys = new Set(gitFiles.map(changedFileKey))
    const touchedOnly = touchedFiles.filter((p) => !gitKeys.has(changedFileKey(p)))
    if (touchedOnly.length > 0) {
      lines.push("")
      lines.push("Changed files (this run — _touchedFiles):")
      for (const f of touchedOnly) lines.push(`  ${f}`)
    }
    // Union, deduped by comparison key (win32 case-insensitive).
    const changedKeys = new Set()
    const changedFiles = [...touchedFiles, ...gitFiles].filter((p) => {
      const k = changedFileKey(p)
      if (changedKeys.has(k)) return false
      changedKeys.add(k)
      return true
    })

    // D-V11 G10 (doc-only/empty change set must not swallow an explicit failed):
    // an explicit verification.status='failed' is ALWAYS respected — never
    // overridden to pass by the doc-only fast path or the no-code-changed path
    // below (D-V5 exception, review #6). Aligns CLI with VS Code (T-V8). Lists
    // the changed files + points at AGENTS.md (D-V3 guidance).
    if (args.verification?.status === "failed") {
      lines.push("")
      lines.push("VERIFY BLOCKED: you declared verification failed (verification.status = 'failed').")
      lines.push("Do not say 'done' while verification fails — fix the issue, re-run the project's verification, then call verify again declaring the outcome.")
      lines.push("")
      lines.push("Changed file(s):")
      for (const f of changedFiles) lines.push(`  ${f}`)
      lines.push("")
      lines.push("verify does not run commands for you — decide and run the project's verification yourself.")
      lines.push("Reference the verification approach declared in the project's AGENTS.md (natural language, e.g. \"tests run with npm test\" / \"no automated tests — rely on manual review\") to decide what to run, then call verify again declaring the outcome via verification.status.")
      ctx.agent._verifyPassed = false
      return lines.join("\n")
    }

    // 1b. Doc-only fast path: every changed file is documentation (docs/, *.md,
    // LICENSE…) — syntax checks and a verification declaration are meaningless
    // for doc changes, and the task list/self-review checklist add nothing either.
    // Paths inside a declared code segment (default: src — incl. prompts/*.md) are
    // product code — excluded from the fast path, consistent with the design gate.
    // The project's own layout is declarable (.thincoder/conventions.json).
    // Empty list (no changes / git unavailable)
    // intentionally falls through to the normal path below.
    const conv = loadConventions(cwd)
    if (changedFiles.length > 0 && changedFiles.every((f) => isDocPath(f, conv))) {
      lines.push("")
      lines.push("Documentation-only changes — skipping syntax checks and tests.")
      ctx.agent._verifyPassed = true
      return lines.join("\n")
    }

    // Code files needing verification: anything the shared classifier calls product
    // code (D-V1 — these require a verification declaration). Temp scratch files are
    // neither code nor docs and fall out of this list (a throwaway diagnostic script
    // is not a code change — no declaration is demanded for it).
    const codeFiles = changedFiles.filter((f) => isCodePath(f, conv))

    // 2. Advisory syntax hint (D-V5) — node --check on changed .js/.mjs when node
    // exists. SOFT hint only — it does NOT gate done (no language-specific
    // enforcement; a non-JS project or a missing node simply skips silently).
    const jsFiles = codeFiles.filter((f) => /\.(m?js)$/i.test(f) && existsSync(f))
    if (jsFiles.length > 0) {
      lines.push("")
      lines.push("Advisory syntax hint (node --check — does not gate):")
      for (const f of jsFiles) {
        try {
          const result = spawnSync("node", ["--check", f], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10000 })
          if (result.status !== 0) throw result
          lines.push(`  ✓ ${f}`)
        } catch (e) {
          const errOutput = (e.stderr || e.stdout || e.message || "").toString()
          const errMsg = errOutput.split("\n").slice(0, 3).join("\n")
          lines.push(`  ⚠ ${f}  — node --check flagged it`)
          lines.push(`    ${errMsg.replace(/\n/g, "\n    ")}`)
        }
      }
    }

    // 3. Verification gate (D-V1/D-V2): the model declares its verification status.
    if (codeFiles.length === 0) {
      // No code changed (empty change set / only temp/non-code files) — nothing to verify.
      lines.push("")
      lines.push("No code files changed — nothing to verify.")
      ctx.agent._verifyPassed = true
    } else {
      const v = args.verification ?? {}
      const status = v?.status
      if (!status) {
        lines.push("")
        lines.push("VERIFY BLOCKED: no verification status was declared.")
        lines.push("These code changes must be verified before you say 'done' — declare whether you ran the project's verification and its result.")
        appendBlockGuidance(lines, codeFiles)
        ctx.agent._verifyPassed = false
      } else if (status === "passed") {
        lines.push("")
        lines.push("Verification declared passed.")
        if (v.command) lines.push(`  command: ${v.command}`)
        if (v.summary) lines.push(`  summary: ${v.summary}`)
        ctx.agent._verifyPassed = true
      } else if (status === "skipped") {
        const reason = (v.summary ?? "").trim()
        if (reason) {
          lines.push("")
          lines.push(`Verification skipped with reason: ${reason}`)
          ctx.agent._verifyPassed = true
        } else {
          lines.push("")
          lines.push("VERIFY BLOCKED: verification skipped with no summary reason — an empty skip is not allowed.")
          lines.push("Give a concrete reason in verification.summary (e.g. \"project has no automated tests — verified by manual review\"), or run the project's verification and declare its result.")
          appendBlockGuidance(lines, codeFiles)
          ctx.agent._verifyPassed = false
        }
      } else {
        // Unknown status value — defensive (schema enum normally rejects it first).
        lines.push("")
        lines.push(`VERIFY BLOCKED: unknown verification.status ${JSON.stringify(status)} — use 'passed' | 'failed' | 'skipped'.`)
        appendBlockGuidance(lines, codeFiles)
        ctx.agent._verifyPassed = false
      }
    }

    // 4. Task list
    lines.push("")
    if (ctx.agent.tasks.length === 0) {
      lines.push("Task list: (no tasks tracked)")
    } else {
      const done = ctx.agent.tasks.filter((t) => t.status === "done").length
      const total = ctx.agent.tasks.length
      const open = ctx.agent.tasks.filter((t) => t.status !== "done")
      lines.push(`Task list: ${done}/${total} done`)
      for (const t of ctx.agent.tasks) {
        const mark = t.status === "done" ? "✓" : t.status === "in_progress" ? "▶" : "○"
        lines.push(`  ${mark} [${t.status}] ${t.title}`)
      }
      if (open.length > 0) {
        lines.push("")
        lines.push(`WARNING: ${open.length} task(s) still open. Complete them or explain why they can be left undone.`)
      }
    }

    // 5. Checklist
    lines.push("")
    lines.push("Self-review checklist:")
    lines.push("- [ ] Did I run the project's verification (per its AGENTS.md) and does it pass, or did I declare a concrete skip reason?")
    lines.push("- [ ] Did I read every file I changed to catch leftover debug code or stale comments?")
    lines.push("- [ ] Do comments and docstrings match what the code actually does?")
    lines.push("- [ ] Did I remove placeholder code, TODO stubs, or commented-out experiment blocks?")
    lines.push("- [ ] If I used a subagent, did I verify its report against the actual files it touched?")
    lines.push("- [ ] Are all task items genuinely done (not just marked done to finish early)?")

    return lines.join("\n")
  },
}
