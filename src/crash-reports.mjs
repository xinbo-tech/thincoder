/**
 * crash-reports.mjs — R25（docs/design/ARCHITECTURE.md §R25——F-R25a/b/c）CLI 异常终止
 * 捕获与留痕机制。
 *
 * 三类能力（与设计逐项对应）：
 * - prepareCrashReporting()（F-R25b）：入口最前调用——mkdir 预建 ~/.thincoder/crash-reports/
 *   + process.report 代码内启用（reportOnFatalError + directory）——V8 OOM/原生 fatal
 *   自动写 report.*.json。实现批实测（2026-09-07）：目录缺失时 Node 对 fatal 静默不写
 *   报告——预建是必要动作而非"零成本保险"。
 * - writeCrashRecord()（F-R25a）：JS 异常钩子同步落盘 crash-{ts}-{pid}.json（ts = epoch ms
 *   UTC + pid——跨进程同 ms 防覆盖——复审 #3）——权限 0600（config.json 先例）。
 * - recentCrashHint()（F-R25c）：启动扫描 24h 窗内记录（两类文件模式定死——评审 #8：
 *   crash-*.json 自写 + report.*.json Node fatal——mtime 判定）→ 返回提示文本或 null
 *   （无匹配不提示——负例）。
 *
 * 保留策略（评审 #6 + 复审 #4）：>30 天淘汰——写时自清理（tool-results 先例『落盘目录
 * 写时自清理』段同动机——Windows 磁盘清理不覆盖 ~/.thincoder）——清理搭车点 = F-R25a 写 +
 * F-R25b 入口 mkdir + F-R25c 启动扫描（纯 fatal 序列 JS 不运行——下个进程入口 mkdir 时
 * 清理）。
 *
 * 纪律：全部同步 API（崩溃路径无异步）；调用方按执行序列各步独立 try/catch（复审 #2——
 * 写失败/恢复失败不阻断后续步——exit 非 0 恒达）。
 */
import { chmodSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { configDir } from "./config.mjs"

/** crash-reports 运行时目录（~/.thincoder/crash-reports——非仓内——写时自清理）。 */
export function crashReportsDir() {
  return join(configDir, "crash-reports")
}

/** 记录文件模式（评审 #8 定死）：crash-*.json = 自写（F-R25a）；report.*.json = Node
 *  fatal（默认命名 report.YYYYMMDD.HHMMSS.<pid>.<seq>.json——2026-09-07 实现批实测）。 */
function isCrashRecordName(name) {
  return /^crash-.+\.json$/.test(name) || /^report\..+\.json$/.test(name)
}

/** >30 天淘汰（评审 #6）——写时自清理；搭车点 = 写 / 入口 mkdir / 启动扫描（复审 #4）。 */
function purgeOldCrashReports(dir) {
  const cutoff = Date.now() - 30 * 24 * 3_600_000
  let names
  try { names = readdirSync(dir) } catch { return } // 目录不存在/不可读 → 无事可做
  for (const name of names) {
    if (!isCrashRecordName(name)) continue
    try {
      if (statSync(join(dir, name)).mtimeMs < cutoff) unlinkSync(join(dir, name))
    } catch { /* 单个文件失败不影响其余 */ }
  }
}

/**
 * F-R25b：入口最前调用（一切重活前——缩编程期窗口）——预建目录 + process.report 启用。
 * 任何失败不阻断启动（尽力面——record 路径自带降级）。返回目录路径。
 */
export function prepareCrashReporting() {
  const dir = crashReportsDir()
  try {
    mkdirSync(dir, { recursive: true })
    // 代码内启用：shebang 入口无法携带启动参数（env 单参数限制 + execArgv 仅子进程——评审 #1）
    process.report.directory = dir
    process.report.reportOnFatalError = true
  } catch { /* mkdir/启用失败不阻断启动——尽力面 */ }
  purgeOldCrashReports(dir) // F-R25b 入口 mkdir 搭车清理（复审 #4——纯 fatal 序列也触发）
  return dir
}

/**
 * F-R25a：JS 异常钩子同步写诊断记录（内容：时间/类型/错误消息+堆栈/uptime/argv/cwd/
 * 内存/node+版本——设计字段集）。
 * @param {string} type uncaughtException | unhandledRejection
 * @param {*} error 原始 error（unhandledRejection 可 reject 任意值——非 Error 兜底 String）
 * @returns {string|null} 记录完整路径；写失败 → null（不抛——调用方步隔离——复审 #2）
 */
export function writeCrashRecord({ type, error }) {
  const dir = crashReportsDir()
  try {
    const record = {
      time: new Date().toISOString(),
      type,
      message: error?.message ?? String(error),
      stack: typeof error?.stack === "string" ? error.stack : null,
      uptime: process.uptime(),
      argv: process.argv,
      cwd: process.cwd(),
      memoryUsage: process.memoryUsage(),
      node: process.version,
    }
    // ts = epoch ms UTC + pid——跨进程同 ms 防覆盖（复审 #3）
    const file = join(dir, `crash-${Date.now()}-${process.pid}.json`)
    writeFileSync(file, JSON.stringify(record, null, 2) + "\n", { encoding: "utf8", mode: 0o600 })
    try { chmodSync(file, 0o600) } catch { /* Windows chmod 尽力而为——config.json 先例 */ }
    purgeOldCrashReports(dir) // F-R25a 写时搭车清理（评审 #6）
    return file
  } catch {
    return null // 写失败不阻断后续步
  }
}

/**
 * F-R25c：启动扫描——crash-reports 24h 窗内是否有记录（两类模式——mtime 判定）。
 * @param {object} [opts] 可选 { dir }——目录注入（测试用）；默认 crashReportsDir()
 * @returns {string|null} 提示文本（含最新记录完整路径）；无匹配 → null（负例——不提示）
 */
export function recentCrashHint({ dir = crashReportsDir() } = {}) {
  purgeOldCrashReports(dir) // F-R25c 启动扫描搭车清理（复审 #4）
  if (!existsSync(dir)) return null
  const cutoff = Date.now() - 24 * 3_600_000
  let best = null // 窗内 mtime 最新记录
  let names
  try { names = readdirSync(dir) } catch { return null } // 目录不可读 → 静默无提示
  for (const name of names) {
    if (!isCrashRecordName(name)) continue
    try {
      const st = statSync(join(dir, name))
      if (st.mtimeMs >= cutoff && (!best || st.mtimeMs > best.mtimeMs)) {
        best = { path: join(dir, name), mtimeMs: st.mtimeMs }
      }
    } catch { /* 单文件 stat 失败跳过 */ }
  }
  if (!best) return null
  return `上次运行异常终止（记录：${best.path}）`
}
