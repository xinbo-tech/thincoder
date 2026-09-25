/**
 * crash-reports.mjs — 崩溃捕获与取证（docs/cli/design/CRASH-REPORTS.md——F1/F2 为 R25 与
 * TUI-STDERR-CAPTURE 存量迁移；F3 近堆上限堆快照 = TUI-OOM-FORENSICS 批新增）。
 *
 * 能力（与设计逐项对应）：
 * - prepareCrashReporting()（F-R25b + F3①）：入口最前调用——mkdir 预建 ~/.thincoder/crash-reports/
 *   + process.report 代码内启用（reportOnFatalError + directory）——V8 OOM/原生 fatal
 *   自动写 report.*.json。实现批实测（2026-09-07）：目录缺失时 Node 对 fatal 静默不写
 *   报告——预建是必要动作而非"零成本保险"。
 *   F3①：同点武装近堆上限堆快照（v8.setHeapSnapshotNearHeapLimit——对象级证据，回答
 *   "谁在持内存"；全路径单源，默认开、THINCODER_HEAP_SNAPSHOT 可关——F3②）。
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
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
// F3① 命名空间 import：API 缺失（旧 Node）降级为调用期异常并被武装 try 吞掉——不做 import 期硬失败
import * as v8 from "node:v8"
import { configDir } from "@thincoder/core/config.mjs"

/** F3② 关值集合（trim + 大小写不敏感）；其余取值（未设 / 空串 / 未知串）默认开——fail-open 向取证。 */
const HEAP_SNAPSHOT_OFF_VALUES = new Set(["0", "false", "off", "no"])

/** crash-reports 运行时目录（~/.thincoder/crash-reports——非仓内——写时自清理）。 */
export function crashReportsDir() {
  return join(configDir, "crash-reports")
}

/** 记录文件模式（评审 #8 定死）：crash-*.json = 自写（F-R25a）；report.*.json = Node
 *  fatal（默认命名 report.YYYYMMDD.HHMMSS.<pid>.<seq>.json——2026-09-07 实现批实测）。
 *  purge 另含 tui-stderr-*.log（TUI-STDERR-CAPTURE F-2——30 天同族淘汰）与
 *  Heap.*.heapsnapshot（CRASH-REPORTS F3③——快照 GB 级、TUI 落点须自动兜底）——但
 *  recentCrashHint 两类均不计（N3）：tui-stderr 每次 TUI 启动都生成（正常退出也留档）、
 *  快照非「异常终止」证据类——计入即正常会话误报。 */
/** 记录类判定单源（`isCrashRecordName` 与 `recordFacts` 共用——防两处正则漂移）：自写 / Node fatal / 其余。 */
function recordClassOf(name) {
  if (/^crash-.+\.json$/.test(name)) return "self"
  if (/^report\..+\.json$/.test(name)) return "native"
  return null
}
function isCrashRecordName(name) {
  return recordClassOf(name) !== null
}
function isPurgeRecordName(name) {
  return isCrashRecordName(name) || /^tui-stderr-.+\.log$/.test(name) || /^Heap\..+\.heapsnapshot$/.test(name)
}

/** >30 天淘汰（评审 #6）——写时自清理；搭车点 = 写 / 入口 mkdir / 启动扫描（复审 #4）。 */
function purgeOldCrashReports(dir) {
  const cutoff = Date.now() - 30 * 24 * 3_600_000
  let names
  try { names = readdirSync(dir) } catch { return } // 目录不存在/不可读 → 无事可做
  for (const name of names) {
    if (!isPurgeRecordName(name)) continue
    try {
      if (statSync(join(dir, name)).mtimeMs < cutoff) unlinkSync(join(dir, name))
    } catch { /* 单个文件失败不影响其余 */ }
  }
}

/** F3② 武装判定（单点——包装器不判 env，防两处判定漂移）：关值集合命中 → 不武装；其余 → 武装。 */
function heapSnapshotEnabled(env) {
  return !HEAP_SNAPSHOT_OFF_VALUES.has(String(env?.THINCODER_HEAP_SNAPSHOT ?? "").trim().toLowerCase())
}

/**
 * F-R25b：入口最前调用（一切重活前——缩编程期窗口）——预建目录 + process.report 启用。
 * 任何失败不阻断启动（尽力面——record 路径自带降级）。返回目录路径。
 * F3①：同点武装近堆上限堆快照（默认开——全路径单源；环境开关见 heapSnapshotEnabled）。
 * @param {object} [opts] 注入缝（默认参数保 bin 入口调用点零改）
 * @param {string} [opts.dir] 目录注入（测试用——同时服务 mkdir / report / purge / 返回）
 * @param {object} [opts.env] env 注入（测试用）——仅服务 F3② 判定
 * @param {(n: number) => void} [opts.armHeapSnapshot] 武装实现注入（测试用）——默认真实 node:v8 API
 */
export function prepareCrashReporting({ dir = crashReportsDir(), env = process.env, armHeapSnapshot = v8.setHeapSnapshotNearHeapLimit } = {}) {
  try {
    mkdirSync(dir, { recursive: true })
    // 代码内启用：shebang 入口无法携带启动参数（env 单参数限制 + execArgv 仅子进程——评审 #1）
    process.report.directory = dir
    process.report.reportOnFatalError = true
  } catch { /* mkdir/启用失败不阻断启动——尽力面 */ }
  // F3① 武装（独立 try——失败不阻断启动、不影响上方 F1 既有步骤；尽力面静默）
  if (heapSnapshotEnabled(env)) {
    try { armHeapSnapshot(1) } catch { /* 武装失败不阻断——N1 */ }
  }
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
 * 提示行事实段（台账 #212 · 用户裁 B）：从选中记录读回 `uptime` / `cwd` 两段——段序固定 =
 * uptime 段（` · 运行 <u>s`，一位小数）在前 / cwd 段（` · cwd <c>`）在后。
 * 字段源按记录类分：自写记录（`crash-*.json`）取顶部 `uptime` / `cwd`；Node fatal 报告
 * （`report.*.json`）取 `header.cwd`——Node 报告无 uptime 字段（2026-09-25 实测），该段略去。
 * 退化（尽力面 · N1）：读档 / 解析失败、记录类不明、字段缺 / 型不符（`uptime` 非有限非负数 ·
 * `cwd` 非非空字符串）⇒ 对应段略去；两段皆缺 ⇒ 空串（基础形）。不抛、不阻断启动。
 */
function recordFacts(file, name) {
  const cls = recordClassOf(name)
  if (cls === null) return "" // 记录类不明 ⇒ 零事实
  let rec
  try { rec = JSON.parse(readFileSync(file, "utf8")) } catch { return "" }
  if (rec === null || typeof rec !== "object") return ""
  let facts = ""
  if (cls === "self" && typeof rec.uptime === "number" && Number.isFinite(rec.uptime) && rec.uptime >= 0) {
    facts += ` · 运行 ${rec.uptime.toFixed(1)}s`
  }
  const cwd = cls === "native" ? rec.header?.cwd : rec.cwd
  if (typeof cwd === "string" && cwd !== "") facts += ` · cwd ${cwd}`
  return facts
}

/**
 * F-R25c：启动扫描——crash-reports 24h 窗内是否有记录（两类模式——mtime 判定）。
 * @param {object} [opts] 可选 { dir }——目录注入（测试用）；默认 crashReportsDir()
 * @returns {string|null} 提示文本（含最新记录完整路径 + 事实段——#212）；无匹配 → null（负例——不提示）
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
        best = { path: join(dir, name), name, mtimeMs: st.mtimeMs }
      }
    } catch { /* 单文件 stat 失败跳过 */ }
  }
  if (!best) return null
  return `上次运行异常终止（记录：${best.path}${recordFacts(best.path, best.name)}）`
}
