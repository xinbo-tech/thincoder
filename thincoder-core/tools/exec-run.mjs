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
 *   · `opts = { cwd?, timeout?, signal? }`——**默认径忽略 signal**（execFileSync 不可中断，
 *     与现行 CLI 行为逐字同）；注入径自决（如 abort ⇒ 树杀）。
 */
import { execFileSync } from "node:child_process"

let injected = null

/** 覆盖执行面（**端装配层**调用；核内不调用——缺省不覆盖）。传 null / 非对象 / 非函数 ⇒ 撤销。 */
export function configureExecRun(impl) {
  injected = impl && typeof impl === "object" && typeof impl.run === "function" ? impl : null
}

/** 撤销注入（测试与端装配生命周期用——缺省态 = execFileSync 默认径）。 */
export function resetExecRun() { injected = null }

/** 默认径（CLI 语义——utf8 + timeout + stdio ignore/pipe/pipe；cwd 未给则不设）。 */
function defaultRun(cmd, args, opts) {
  const options = { encoding: "utf8", timeout: opts.timeout, stdio: ["ignore", "pipe", "pipe"] }
  if (opts.cwd !== undefined) options.cwd = opts.cwd
  return execFileSync(cmd, args, options)
}

/** 核内执行面单点——linter / verify 的命令执行全部经此（注入 ⇒ 端侧执行器接管）。 */
export async function runCommand(cmd, args, opts = {}) {
  if (injected) return await injected.run(cmd, args, opts)
  return defaultRun(cmd, args, opts)
}
