import { repairHistory, listWorkDir } from "../agent.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import { execSync, spawn, spawnSync } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"

/**
 * Source module → test file mapping. Heuristic: the FIRST path component
 * after src/ determines the module. Map it to the test file that imports from it.
 * Modules without dedicated tests map to null.
 */
const MODULE_TO_TEST = {
  tools: "test/tools.test.mjs",
  "agent-tools": "test/tools.test.mjs",
  agent: "test/agent.test.mjs",
  memory: "test/memory.test.mjs",
  tui: "test/tui.test.mjs",
  provider: "test/integration-provider.mjs",
  config: "test/integration-provider.mjs",
  skills: "test/tools.test.mjs",
  distill: "test/tools.test.mjs",
  markdown: "test/agent.test.mjs",
  advisor: "test/advisor.test.mjs",
  mcp: null,
  prompts: null,
  context: null,
  session: null,
}

/**
 * Extract module name from a source path.
 * "src/tools/bash.mjs" → "tools", "src/agent.mjs" → "agent", "src/agent/helpers.mjs" → "agent"
 */
function moduleName(srcPath) {
  const rel = srcPath.replace(/^src[/\\]/, "")
  const firstSlash = rel.search(/[/\\]/)
  if (firstSlash === -1) return rel.replace(/\.mjs$/, "")
  return rel.slice(0, firstSlash)
}

/**
 * verify tool: pre-completion self-check. When called:
 * 0. Doc-only fast path — all changed files are docs (docs/, *.md, LICENSE…):
 *    short report, no syntax checks, no tests.
 * 1. git diff --stat — changed file list
 * 2. node --check — syntax check all changed .mjs/.js files
 * 3. Related tests — run test files that cover the changed modules (default)
 * 4. npm test — run ALL project tests (only when full=true)
 * 5. task list + self-review checklist
 * Default runs syntax checks + related tests; full=true runs the entire test suite.
 * Agent must not say "done" before verify passes. Fix-verify loop at most MAX_VERIFY_RETRIES rounds.
 */
export const verifyTool = {
  name: "verify",
  description:
    "Run a pre-completion self-check. By default runs syntax checks on changed files AND any test files related to the changed modules, shows git diff and task list, and displays a self-review checklist. Set full=true to run the project's full test suite (npm test) instead of just related tests. Call this BEFORE declaring any coding task complete — do not say 'done' until verify passes.",
  parameters: {
    type: "object",
    properties: {
      full: { type: "boolean", description: "Run the full test suite (npm test) instead of just related tests. Default false — use sparingly, per the testing discipline rules." },
      workdir: { type: "string", description: "Optional: run verify in this subdirectory (relative to cwd or absolute) — for monorepos" },
      filter: { type: "string", description: "Optional: limit the test run to matching test names (node --test-name-pattern / npm test -- --test-name-pattern)" },
    },
  },
  readonly: true,
  outputPanel: true, // stream test output to a panel instead of inline
  async execute(args, ctx) {
    const cwd = ctx.agent.cwd
    // workdir only relocates WHERE tests (and package.json) live — changed-file
    // resolution (git diff) stays anchored to the project root.
    const testCwd = args.workdir ? resolve(cwd, args.workdir) : cwd
    const lines = []
    lines.push("=== VERIFICATION REPORT ===")
    lines.push("")

    // 1. Git diff — find changed files
    let changedFiles = []
    try {
      const diff = execSync("git diff --stat", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })
      if (diff.trim()) {
        lines.push("Changed files (git diff --stat):")
        lines.push(diff.trim())
        // extract changed file paths
        const nameOnly = execSync("git diff --name-only", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 })
        changedFiles = nameOnly.trim().split("\n").filter(Boolean)
      } else {
        lines.push("Changed files: (none — no uncommitted changes)")
      }
    } catch {
      lines.push("Changed files: (not a git repo or git unavailable)")
    }

    // 1b. Doc-only fast path: every changed file is documentation (docs/, *.md,
    // LICENSE…) — syntax checks and tests are meaningless for doc changes, and
    // the task list/self-review checklist add nothing either. Mirrors the
    // advisor's doc-only review skip ("No issues found — documentation-only
    // changes, code review skipped."). src/** (incl. prompts/*.md) is product
    // code — excluded from the fast path, consistent with isProductCode.
    // Empty list (no changes / git unavailable) intentionally falls through
    // to the normal path below.
    if (changedFiles.length > 0 && changedFiles.every((f) => !/^src[\\/]/.test(f) && isDocFile(f))) {
      lines.push("")
      lines.push("Documentation-only changes — skipping syntax checks and tests.")
      ctx.agent._verifyPassed = true
      return lines.join("\n")
    }

    // 2. Syntax check: run node --check on all changed .mjs/.js files (skip deleted files)
    let syntaxFailed = false
    const jsFiles = changedFiles.filter((f) => /\.(m?js)$/i.test(f))
    if (jsFiles.length > 0) {
      lines.push("")
      lines.push("Syntax check (node --check):")
      for (const f of jsFiles) {
        const abs = join(cwd, f)
        if (!existsSync(abs)) continue // skip deleted files
        try {
          const result = spawnSync("node", ["--check", abs], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10000 })
          if (result.status !== 0) throw result
          lines.push(`  ✓ ${f}`)
        } catch (e) {
          syntaxFailed = true
          const errOutput = (e.stderr || e.stdout || e.message || "").toString()
          const errMsg = errOutput.split("\n").slice(0, 3).join("\n")
          lines.push(`  ✗ ${f}  — syntax error`)
          lines.push(`    ${errMsg.replace(/\n/g, "\n    ")}`)
        }
      }
      if (!syntaxFailed) lines.push("  All syntax checks passed.")
    }

    // 3. Identify related test files for changed source modules
    const srcFiles = changedFiles.filter((f) => /^src[/\\].+\.mjs$/i.test(f) && existsSync(join(cwd, f)))
    const modules = [...new Set(srcFiles.map(moduleName))]
    const relatedTests = [...new Set(modules.map((m) => MODULE_TO_TEST[m]).filter(Boolean))]

    // 4. Run tests
    const pkgPath = join(testCwd, "package.json")
    const hasTestScript = existsSync(pkgPath) && (() => { try { return !!JSON.parse(readFileSync(pkgPath, "utf8")).scripts?.test } catch { return false } })()

    if (args.full) {
      // Full mode: run the entire test suite
      if (hasTestScript) {
        lines.push("")
        lines.push("Tests (full suite):")
        const result = await runTestSuite(testCwd, ctx, args.filter)
        if (result.passed) {
          lines.push("✓ All tests passed.")
          ctx.agent._verifyPassed = !syntaxFailed
        } else {
          lines.push("✗ Tests FAILED. Review the output above, fix the issues, then run verify again.")
          ctx.agent._verifyPassed = false
        }
      } else {
        lines.push("")
        lines.push("Tests: no test script in package.json — skipped.")
        ctx.agent._verifyPassed = !syntaxFailed
      }
    } else if (relatedTests.length > 0) {
      // Default mode: run only related test files
      lines.push("")
      lines.push(`Related tests (${relatedTests.length} file(s) for modules: ${modules.join(", ")}):`)
      let anyTestFailed = false
      for (const testFile of relatedTests) {
        const abs = join(cwd, testFile)
        if (!existsSync(abs)) {
          lines.push(`  ? ${testFile} — file not found, skipping`)
          continue
        }
        try {
          const result = await runTestFile(cwd, testFile, ctx, args.filter)
          if (result.passed) {
            lines.push(`  ✓ ${testFile}`)
          } else {
            anyTestFailed = true
            lines.push(`  ✗ ${testFile} — FAILED`)
            lines.push(`    ${result.tail.replace(/\n/g, "\n    ")}`)
          }
        } catch (e) {
          anyTestFailed = true
          lines.push(`  ✗ ${testFile} — error: ${e.message}`)
        }
      }
      if (anyTestFailed) {
        lines.push("")
        lines.push("✗ Related tests FAILED. Review the output above, fix the issues, then run verify again.")
        ctx.agent._verifyPassed = false
      } else {
        lines.push("  All related tests passed.")
        ctx.agent._verifyPassed = !syntaxFailed
      }
    } else {
      // No related tests found for the changed modules
      const uncovered = modules.filter((m) => MODULE_TO_TEST[m] === null)
      const untested = modules.filter((m) => !(m in MODULE_TO_TEST))
      lines.push("")
      if (uncovered.length > 0) {
        lines.push(`Related tests: NONE for module(s) ${uncovered.join(", ")} — these modules have no dedicated test file.`)
        lines.push("ACTION REQUIRED: write a test that covers the change you just made.")
        lines.push("Do NOT proceed to 'done' — a test file is required before this change is complete.")
      } else if (untested.length > 0) {
        lines.push(`Related tests: NONE for module(s) ${untested.join(", ")} — unknown module, no test mapping exists.`)
        lines.push("ACTION REQUIRED: determine which test file covers this code and add it to MODULE_TO_TEST, or write a new test.")
      } else if (srcFiles.length === 0) {
        lines.push("Related tests: no source .mjs files changed — nothing to test.")
        ctx.agent._verifyPassed = !syntaxFailed
      } else {
        lines.push("Related tests: none matched. Run verify with full=true to run the full suite.")
        ctx.agent._verifyPassed = !syntaxFailed
      }
    }

    // Show full-suite hint when not run
    if (!args.full && hasTestScript) {
      lines.push("")
      lines.push("Note: full test suite not run. Use verify full=true to run ALL tests before committing.")
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
    lines.push("- [ ] Did I run the project's tests and do they pass?")
    lines.push("- [ ] Did I read every file I changed to catch leftover debug code or stale comments?")
    lines.push("- [ ] Do comments and docstrings match what the code actually does?")
    lines.push("- [ ] Did I remove placeholder code, TODO stubs, or commented-out experiment blocks?")
    lines.push("- [ ] If I used a subagent, did I verify its report against the actual files it touched?")
    lines.push("- [ ] Are all task items genuinely done (not just marked done to finish early)?")

    return lines.join("\n")
  },
}

/**
 * Run a single test file with node --test, no maxBuffer limit.
 * Returns { passed: boolean, tail: string } — the last few lines of output.
 */
function runTestFile(cwd, testPath, ctx, filter) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", filter ? ["--test", "--test-name-pattern", filter, testPath] : ["--test", testPath], {
      cwd, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => {
      const s = d.toString()
      stdout += s
      ctx.callbacks?.onToolOutput?.("verify", s)
    })
    child.stderr.on("data", (d) => {
      const s = d.toString()
      stderr += s
      ctx.callbacks?.onToolOutput?.("verify", s)
    })
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error(`Test ${testPath} timed out after 120s`))
    }, 120000)
    child.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      const output = (stdout + stderr).trim()
      const tail = output.split("\n").slice(-8).join("\n")
      resolve({ passed: code === 0, tail })
    })
  })
}

/**
 * Run npm test via spawn, no maxBuffer limit.
 * Test output is streamed through ctx.callbacks.onToolOutput (TUI can display progress in real time).
 * Returns { passed: boolean, tail: string }.
 */
function runTestSuite(cwd, ctx, filter) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", filter ? ["test", "--", `--test-name-pattern=${filter}`] : ["test"], {
      cwd, shell: true, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => {
      const s = d.toString()
      stdout += s
      ctx.callbacks?.onToolOutput?.("verify", s)
    })
    child.stderr.on("data", (d) => {
      const s = d.toString()
      stderr += s
      ctx.callbacks?.onToolOutput?.("verify", s)
    })
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      const err = new Error("Tests timed out after 120s")
      err.stdout = stdout
      err.stderr = stderr
      reject(err)
    }, 120000)
    child.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      const output = (stdout + stderr).trim()
      const tail = output.split("\n").slice(-8).join("\n")
      resolve({ passed: code === 0, tail })
    })
  })
}

