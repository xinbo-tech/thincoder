/** wrapped-spawn.mjs — TUI-STDERR-CAPTURE F-1/F-3：包装父
 * spawn 子（自身 bin）tee stderr → 终端 + crash-reports/tui-stderr-<ts>-<pid>.log（外部终止/
 * native abort——fd 2 进程内不可改——诊断唯一默认捕获路）。子死 → 日志收尾 → 同码退（null 映射
 * code??(signal?1:0)——评审 #1）；spawn error → 注日志 + exit 1（评审 #5——不挂死）。 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { crashReportsDir } from "../crash-reports.mjs"

// F-3 信号语义（raw mode 既有 key-handler 双按语义——Ctrl+C = stdin 字节不产生信号 → 子正常退 → 父收
// exit 同码退）：父忽略 SIGINT/SIGTERM——tee 不被打断。2026-09-09 实测：Windows process.kill(SIGINT)
// = 硬杀 ≠ 控制台 Ctrl+C 事件（handler 不触发）——信号面测试走 mock（真控制台端到端留发布前手动 QA）。
export const ignoreSignal = () => {} // no-op 单一引用——父信号 + stderr-error 监听共用——测试可精确复原
export function spawnTuiWrapped({ dir = crashReportsDir(), script = fileURLToPath(new URL("../../bin/thincoder.mjs", import.meta.url)), spawnImpl = spawn, exitImpl = (code) => process.exit(code) } = {}) {
  // ① mkdir 前置（评审 #2——prepareCrashReporting 只在子内跑——首启目录缺失会静默不包装）+ 开日志
  //（文件头元信息行：时间/pid/argv——F-2——0600 append）——失败 → false：不包装直接跑现逻辑（尽力面）
  let logPath = null
  try {
    mkdirSync(dir, { recursive: true })
    logPath = `${dir}/tui-stderr-${Date.now()}-${process.pid}.log`
    writeFileSync(logPath, `# tui-stderr ${new Date().toISOString()} pid=${process.pid} argv=${JSON.stringify(process.argv)}\n`, { flag: "a", mode: 0o600 })
  } catch { return false }
  process.on("SIGINT", ignoreSignal); process.on("SIGTERM", ignoreSignal) // 父忽略信号（F-3）——tee 不被打断
  process.stderr.on("error", ignoreSignal) // 父 stderr 异步 EPIPE（终端/管道已关）→ 不炸父——tee 继续
  const note = (s) => { try { appendFileSync(logPath, s) } catch { /* 落盘尽力面——不阻断 tee */ } }
  let exitCode = null, exitSignal = null, settled = false
  const finish = (code) => { if (!settled) { settled = true; exitImpl(code) } }
  const child = spawnImpl(process.execPath, [script, ...process.argv.slice(2)], {
    stdio: ["inherit", "inherit", "pipe"], // 子 stderr pipe → tee；stdin/stdout 继承（TTY 原样）
    env: { ...process.env, THINCODER_TUI_WRAPPED: "1" }, // env 门——子内判定不包装——纯现逻辑（红线）
    windowsHide: false,
  })
  child.stderr.on("data", (chunk) => { try { process.stderr.write(chunk) } catch { /* 终端已关——日志仍落 */ } note(chunk) }) // ② tee 双写：终端实时 + 日志
  child.on("exit", (code, signal) => { exitCode = code; exitSignal = signal; setTimeout(() => finish(exitCode ?? (exitSignal ? 1 : 0)), 30_000).unref() }) // ③ exit 记码；兜底 30s 强退
  child.on("close", () => finish(exitCode ?? (exitSignal ? 1 : 0))) // ④ close = stderr 尾数据全收（AC-2）→ 同码退
  child.on("error", (err) => { note(`# spawn error: ${err.message}\n`); finish(1) }) // ⑤ spawn 失败不发 exit 只发 error
  return true
}
