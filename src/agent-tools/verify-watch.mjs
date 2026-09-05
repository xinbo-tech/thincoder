/**
 * verify-watch.mjs — verify 的子进程 watchdog 族（2026-09-05 module-split：verify.mjs
 * 532 > 500 硬限——npmCmd/killProcessTree/runWatch/runTestFile/runTestSuite verbatim
 * 迁入，语义零变；verify.mjs import 回 runTestFile/runTestSuite——source-anchor 测试
 * 若断言 verify.mjs 源码则同步改指（见 test/verify-domain.test.mjs 未动 = 无源锚）。
 * runWatch 为 tools/execute.mjs runNode 同构镜像（kill-tree + kickTimer settle-on-close）。
 */

import { execFileSync, spawn } from "node:child_process"

// npm is a .cmd on Windows — spawn it by its script name so we can pass args as an
// array (no shell). POSIX needs the bare "npm".
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"

/**
 * Platform-aware process tree kill — mirror of system.mjs killProcessTree. Reaching
 * grandchildren matters here because npm test (and a node --test that itself spawns
 * children) holds the stdout/stderr pipes; killing only the direct child leaves a
 * grandchild alive on the pipes, so "close" never fires and the verify promise hangs.
 */
function killProcessTree(child) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch {}
  } else {
    try { process.kill(-child.pid, "SIGKILL") } catch {}
    try { child.kill("SIGKILL") } catch {}
  }
}

const TEST_TIMEOUT_MS = 120_000
const KICK_MS = 3_000

/**
 * Shared child-process watchdog for verify's test runs. Spawns a command, streams
 * stdout/stderr, and enforces timeout + signal abort with a SIGKILL + kickTimer
 * fallback (mirror of tools/execute.mjs runNode):
 *  - timeout / user abort → killProcessTree (reaches grandchildren so pipes close),
 *    then arm a 3s kickTimer — settling only on "close" (or the kick) avoids racing
 *    the caller while the child still holds the cwd, and avoids a hang when a
 *    grandchild keeps the pipe open.
 *  - `label` is used only in the timeout error text.
 *  - AbortError from the `signal` option is let through (close must follow — the
 *    settle branch reports the abort, not a startup failure).
 * Returns { passed, tail } — resolved on "close" / rejected on timeout|error|abort.
 */
function runWatch({ command, args, cwd, ctx, label }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" },
      // 2026-09-05（advisor 🟡#3）：POSIX detached → 子进程成为组首——killProcessTree 的
      // -pid 组杀才真实可达孙进程（否则 ESRCH 静默吞——只杀直接子进程——孤儿测试进程持
      // 管道 → close 不触发 → 拖到 3s kick，且孤儿继续后台运行）
      detached: process.platform !== "win32",
      ...(ctx.signal ? { signal: ctx.signal } : {}),
    })
    let stdout = ""
    let stderr = ""
    let settled = false
    let mode = null
    let timer = null
    let kickTimer = null
    const done = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(kickTimer)
      if (ctx.signal) ctx.signal.removeEventListener("abort", onAbort)
      value instanceof Error ? reject(value) : resolve(value)
    }
    const armKick = () => {
      kickTimer = setTimeout(() => {
        if (mode === "abort") {
          // User Stop — resolve as a failed run, NOT a thrown error (so the tool
          // returns normally and dispatch's signal.aborted check lets this through).
          done({ passed: false, tail: "(stopped)" })
        } else {
          const err = new Error(`Test ${label} timed out after ${TEST_TIMEOUT_MS}ms`)
          err.stdout = stdout
          err.stderr = stderr
          done(err)
        }
      }, KICK_MS)
    }
    const killTree = () => { try { killProcessTree(child) } catch { /* already gone */ } }
    const onAbort = () => { if (mode) return; mode = "abort"; killTree(); armKick() }

    timer = setTimeout(() => { if (!mode) { mode = "timeout"; killTree(); armKick() } }, TEST_TIMEOUT_MS)

    if (ctx.signal) {
      if (ctx.signal.aborted) onAbort()
      else ctx.signal.addEventListener("abort", onAbort, { once: true })
    }

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
    child.on("error", (e) => {
      if (e.name === "AbortError") return
      done(e)
    })
    child.on("close", (code) => {
      if (mode === "abort") return done({ passed: false, tail: "(stopped)" })
      if (mode === "timeout") {
        const err = new Error(`Test ${label} timed out after ${TEST_TIMEOUT_MS}ms`)
        err.stdout = stdout
        err.stderr = stderr
        return done(err)
      }
      const output = (stdout + stderr).trim()
      const tail = output.split("\n").slice(-8).join("\n")
      done({ passed: code === 0, tail })
    })
  })
}

/** Run a single test file with node --test — no shell, no injection (args array). */
export function runTestFile(cwd, testPath, ctx, filter) {
  return runWatch({
    command: "node",
    args: ["--test", ...(filter ? ["--test-name-pattern", filter] : []), testPath],
    cwd,
    ctx,
    label: testPath,
  })
}

/** Run the full test suite via npm test. npmCmd (npm.cmd on Windows) + args array —
 *  NO shell:true, so a model-supplied filter cannot inject a shell command. */
export function runTestSuite(cwd, ctx, filter) {
  return runWatch({
    command: npmCmd,
    args: ["test", "--", ...(filter ? ["--test-name-pattern", filter] : [])],
    cwd,
    ctx,
    label: "the full npm test suite",
  })
}
