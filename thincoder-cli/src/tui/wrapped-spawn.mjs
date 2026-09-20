/** wrapped-spawn.mjs — TUI-STDERR-CAPTURE F-1/F-3：包装父
 * spawn 子（自身 bin）tee stderr → 终端 + crash-reports/tui-stderr-<ts>-<pid>.log（外部终止/
 * native abort——fd 2 进程内不可改——诊断唯一默认捕获路）。子死 → 日志收尾 → 同码退（null 映射
 * code??(signal?1:0)——评审 #1）；spawn error → 注日志 + exit 1（评审 #5——不挂死）。 */
import { appendFileSync, mkdirSync, writeFileSync, readFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { crashReportsDir } from "../crash-reports.mjs"
import { RECOVERY_SEQUENCE, writeLoadingLine } from "./tui-lifecycle.mjs"

// F-3 信号语义（raw mode 既有 key-handler 双按语义——Ctrl+C = stdin 字节不产生信号 → 子正常退 → 父收
// exit 同码退）：父忽略 SIGINT/SIGTERM——tee 不被打断。2026-09-09 实测：Windows process.kill(SIGINT)
// = 硬杀 ≠ 控制台 Ctrl+C 事件（handler 不触发）——信号面测试走 mock（真控制台端到端留发布前手动 QA）。
export const ignoreSignal = () => {} // no-op 单一引用——父信号 + stderr-error 监听共用——测试可精确复原
export function spawnTuiWrapped({ dir = crashReportsDir(), script = fileURLToPath(new URL("../../bin/thincoder.mjs", import.meta.url)), spawnImpl = spawn, exitImpl = (code) => process.exit(code), writeImpl = (s) => process.stdout.write(s) } = {}) {
  // ① mkdir 前置（评审 #2——prepareCrashReporting 只在子内跑——首启目录缺失会静默不包装）+ 开日志
  //（文件头元信息行：时间/pid/argv——F-2——0600 append）——失败 → false：不包装直接跑现逻辑（尽力面）
  let logPath = null
  try {
    mkdirSync(dir, { recursive: true })
    logPath = `${dir}/tui-stderr-${Date.now()}-${process.pid}.log`
    writeFileSync(logPath, `# tui-stderr ${new Date().toISOString()} pid=${process.pid} argv=${JSON.stringify(process.argv)}\n`, { flag: "a", mode: 0o600 })
  } catch { return false }
  // ①⸸ 启动加载行（spawn 前——回车后立刻可见 ✗ 冷启动期非黑）：复用 tui-lifecycle.writeLoadingLine（修正轮 F-A ✗ 父段副本删）
  let v = ""
  try { v = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version } catch { /* 尽力面——读失败 → 无版本尾 */ }
  writeLoadingLine(writeImpl, v)
  process.on("SIGINT", ignoreSignal); process.on("SIGTERM", ignoreSignal) // 父忽略信号（F-3）——tee 不被打断
  process.stderr.on("error", ignoreSignal) // 父 stderr 异步 EPIPE（终端/管道已关）→ 不炸父——tee 继续
  const note = (s) => { try { appendFileSync(logPath, s) } catch { /* 落盘尽力面——不阻断 tee */ } }
  let exitCode = null, exitSignal = null, settled = false
  const finish = (code) => { if (!settled) { settled = true; exitImpl(code) } }
  // TUI-OOM-ROOTCAUSE（CRASH-REPORTS.md §9.3）：子异常退出（V8 fatal——不走 JS 钩子）→
  // 包装父补发恢复序列（唯一存活方；序列单一来源 = tui-lifecycle.RECOVERY_SEQUENCE）。
  // 守卫落点 = exit/close 处置内（**不在共享 finish**——spawn error 路径经 error→finish(1)，
  // 字面挂 finish 会在子未启动时补发 clearScreen 序列，违 F5③）；按 exitCode/exitSignal
  // 判定（code !== 0 || signal != null）；异常退出零动作；正常退出（code 0）零干预；
  // 每进程恰一次（recovered 守卫，exit/close 双路 + 30s 兜底路径同守）；写失败不阻断收尾。
  let recovered = false
  const recoverTerminal = (code, signal) => {
    if (recovered) return
    if (!(code !== 0 || signal != null)) return
    recovered = true
    try { writeImpl(RECOVERY_SEQUENCE) } catch { /* 尽力面：终端已关/管道已断——不阻断收尾 */ }
  }
  // F3③（CRASH-REPORTS）：近堆上限快照落点定向——--diagnostic-dir 为 Node 选项，须在脚本路径前；
  // 无条件注入（gate 单点在 crash-reports.mjs——包装器不判 env）；未触发快照时零副作用。
  const child = spawnImpl(process.execPath, [`--diagnostic-dir=${dir}`, script, ...process.argv.slice(2)], {
    stdio: ["inherit", "inherit", "pipe"], // 子 stderr pipe → tee；stdin/stdout 继承（TTY 原样）
    env: { ...process.env, THINCODER_TUI_WRAPPED: "1" }, // env 门——子内判定不包装——纯现逻辑（红线）
    windowsHide: false,
  })
  child.stderr.on("data", (chunk) => { try { process.stderr.write(chunk) } catch { /* 终端已关——日志仍落 */ } note(chunk) }) // ② tee 双写：终端实时 + 日志
  child.on("exit", (code, signal) => { exitCode = code; exitSignal = signal; recoverTerminal(code, signal); setTimeout(() => { recoverTerminal(exitCode, exitSignal); finish(exitCode ?? (exitSignal ? 1 : 0)) }, 30_000).unref() }) // ③ exit 记码；异常退出→补发恢复；兜底 30s 强退
  child.on("close", () => { recoverTerminal(exitCode, exitSignal); finish(exitCode ?? (exitSignal ? 1 : 0)) }) // ④ close = stderr 尾数据全收（AC-2）→ 同码退
  child.on("error", (err) => { note(`# spawn error: ${err.message}\n`); finish(1) }) // ⑤ spawn 失败不发 exit 只发 error（零序列动作——F5③）
  return true
}
