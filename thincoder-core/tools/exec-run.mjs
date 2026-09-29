/**
 * tools/exec-run.mjs — 可中断执行器注入缝（CORE-UNIFICATION §2.13.4——#61 / #63 / #96 同源缺口）。
 *
 * 缺口（本档存在的原因）：核内 linter / verify 的检查器执行直调 `execFileSync` / `spawnSync`
 * （CLI 语义——同步阻塞，signal 不可达）；宿主端以可中断执行器（spawn + abort / timeout 树杀，
 * Stop 可停）跑同类命令。端侧接核后若不换执行面，会丢失可中断执行 ⇒ 本模块 = 那一跳：
 * 核内**执行面单点** `runCommand`。
 *
 * 默认径 = CLI 语义（**零行为变**）：`execFileSync` + utf8 + timeout + stdio ignore/pipe/pipe
 * （与各调用点落地前的实参逐字等价）。端侧 `configureExecRun({ run })` 覆盖 ⇒ 可中断执行器；
 * **缺省不覆盖**。核内**零端名分支**（契约 5——本档只认 `run` 函数名）。
 *
 * 契约（注入实现）：
 *   · `run(cmd, args, opts) → Promise<string> | string`——成功给 stdout；
 *   · 失败以 Error reject——`.stdout` / `.stderr` / `.code` 与 `execFileSync` 错误同形
 *     （端侧现形 = 宿主 `runInterruptible`）；
 *   · `opts = { cwd?, timeout?, signal?, env? }`——**默认径忽略 signal**（execFileSync 不可中断，
 *     与现行 CLI 行为逐字同）；`env` 缺省（undefined）不设 = 继承（逐字零变），给定则透传
 *     （Electron 宿主旗标径 = TOOLS.md §6.18）；注入径自决（如 abort ⇒ 树杀）。
 *
 * **可中断执行器上提（R3 · 桌面功能对位批 · #523②）**：`runInterruptible` 自端侧现形
 * （`thincoder-vscode/src/tools/shared.mjs`）**纯搬**落核（零语义改 —— KD-T2）；两端改指核件
 * （VSC `configureExecRun({ run: runInterruptible })` 同轮改指；桌面 `src/main/exec-run.mjs` 消费）。
 * 树杀 = 本仓 `tools/process-tree.mjs` 单源（`killProcessTree` —— 转口，零第二实现）。
 */
import { execFileSync, spawn } from "node:child_process"
import { killProcessTree } from "./process-tree.mjs"

let injected = null

/** 覆盖执行面（**端装配层**调用；核内不调用——缺省不覆盖）。传 null / 非对象 / 非函数 ⇒ 撤销。 */
export function configureExecRun(impl) {
  injected = impl && typeof impl === "object" && typeof impl.run === "function" ? impl : null
}

/** 撤销注入（测试与端装配生命周期用——缺省态 = execFileSync 默认径）。 */
export function resetExecRun() { injected = null }

/** 默认径（CLI 语义——utf8 + timeout + stdio ignore/pipe/pipe；cwd ∕ env 未给则不设）。 */
function defaultRun(cmd, args, opts) {
  const options = { encoding: "utf8", timeout: opts.timeout, stdio: ["ignore", "pipe", "pipe"] }
  if (opts.cwd !== undefined) options.cwd = opts.cwd
  if (opts.env !== undefined) options.env = opts.env
  return execFileSync(cmd, args, options)
}

/** 核内执行面单点——linter / verify 的命令执行全部经此（注入 ⇒ 端侧执行器接管）。 */
export async function runCommand(cmd, args, opts = {}) {
  if (injected) return await injected.run(cmd, args, opts)
  return defaultRun(cmd, args, opts)
}

/**
 * 可中断执行器（**上提件** —— 端侧 `configureExecRun` 供值；原住 `thincoder-vscode/src/tools/shared.mjs`，
 * 逐字搬运 —— R3 · #523②）：`spawn`（非 `execSync` —— 同步执行阻塞事件循环：长 lint ∕ verify 期间
 * Stop 点击连“送达”都做不到）跑命令，abort ∕ timeout ⇒ 整树杀（本档 `killProcessTree` 单源）。
 *
 * 成功 → resolve stdout 串（与 `execFileSync` 调用点兼容）。
 * 非零退出 ∕ spawn 失败 ∕ 超时 ∕ 中止 → reject 携 `.stdout` / `.stderr` / `.code`（同 `execFileSync` 错误形）。
 */
export function runInterruptible(cmd, args, opts = {}) {
  const { cwd, timeout, signal, env } = opts
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(cmd, args, {
        cwd, env: env ?? process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
        // First-line abort guard: Node kills the direct child on signal abort.
        ...(signal ? { signal } : {}),
      })
    } catch (e) {
      reject(e)
      return
    }
    let stdout = "", stderr = "", settled = false, timer = null, kickTimer = null, mode = null

    const KICK_MS = 3000
    const finish = (err, out) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (kickTimer) clearTimeout(kickTimer)
      signal?.removeEventListener("abort", onAbort)
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      } else {
        resolve(out)
      }
    }
    // Kill the whole tree on abort/timeout — grandchildren (npm test's children)
    // must die too, or they keep the stdout/stderr pipes and "close" never fires.
    const killTree = () => { try { killProcessTree(child) } catch { /* already gone */ } }
    // Kick-clockback: settle even if "close" never arrives (a grandchild that
    // mocks kill signal, or a wedged pipe). Prevents a hang + leaked pipes.
    const armKick = (err) => {
      if (kickTimer) return
      kickTimer = setTimeout(() => finish(err), KICK_MS)
    }

    const onAbort = () => {
      if (mode) return
      mode = "abort"
      const e = new Error("aborted by user (Stop)")
      e.name = "AbortError"
      killTree()
      armKick(e)
    }

    if (timeout) {
      timer = setTimeout(() => {
        if (mode) return
        mode = "timeout"
        const e = new Error(`timed out after ${timeout}ms`)
        e.name = "TimeoutError"
        killTree()
        armKick(e)
      }, timeout)
    }

    child.stdout?.on("data", (d) => { stdout += d })
    child.stderr?.on("data", (d) => { stderr += d })
    child.on("error", (e) => { if (e.name === "AbortError") return; finish(e) })
    child.on("close", (code) => {
      if (mode === "abort") { const e = new Error("aborted by user (Stop)"); e.name = "AbortError"; return finish(e) }
      if (mode === "timeout") { const e = new Error(`timed out after ${timeout}ms`); e.name = "TimeoutError"; return finish(e) }
      if (code === 0) finish(null, stdout)
      else {
        const e = new Error(`command failed with exit code ${code}`)
        e.code = code
        finish(e)
      }
    })

    if (signal) {
      if (signal.aborted) { onAbort(); return }
      signal.addEventListener("abort", onAbort, { once: true })
    }
  })
}
