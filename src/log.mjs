/**
 * log.mjs — 诊断事件日志（docs/design/LOGGING.md 权威规格）。
 * 双端同构：thincoder/src/log.mjs 与 thincoder-vscode/src/log.mjs 同一实现语义
 * （共享 ~/.thincoder/logs/、同格式、同事件面——F-L6）。
 *
 * 常驻骨架日志：回合/LLM/工具/子代理/挂起的关键事件——每行一个 JSON 事件，按天轮转
 * （agent-YYYY-MM-DD.log），保留 1 天——用户零手动维护（F-L3/NF-L4）。问题发生时
 * 直接 tail/grep 定位断点（根治"临时插桩再删"循环）。
 *
 * 纪律（实现侧逐条落实）：
 * - fire-and-forget：logEvent 失败静默降级（NF-L1）——主流程零影响。进程内首次写失败
 *   即置死（_dead），当日不再尝试（磁盘满/权限错不逐事件空转）。
 * - 单事件行 <512 字符（NF-L2）：head（LLM ≤300 / 工具 ≤200）、err ≤200 由调用方截断，
 *   本模块对任意字符串字段做上限兜底（head 300 / err 200 / 其余 120）+ 超长时丢可选字段。
 * - 敏感字段零落盘（NF-L3/§2.4，2026-09-03 评审 refinement #7 匹配语义定稿）：
 *   ① 字段名精确匹配黑名单（apiKey/designToken/password/secret/token，大小写不敏感；
 *      另加防御性名称 authorization/proxy/proxyUri——防凭据型 URL/头字段泄漏——§2.5）
 *      → 整个字段丢弃；
 *   ② 内容只扫密钥形态（sk-xxx / Bearer xxx / key=… 等）→ 截断到形态之前
 *      ——宁可丢信息不漏密钥。
 *   工具事件不记 args；URL 不入事件（llm/tool 事件从不携带 URL；err 文本经形态扫描）。
 * - 摘要截断（B 方案，2026-09-03 用户裁定）：截断处带 "…" 标记（截后仍 ≤上限）。
 * - 测试隔离：node --test 进程（NODE_TEST_CONTEXT）默认不写盘——防测试事件污染真实
 *   诊断日志（两端测试套件都会跑真实 agent 管线）；显式设置 THINCODER_LOG_DIR 强制
 *   写入该目录（log.test.mjs 用它隔离临时目录——refinement #6）。
 * - 轮转清理（refinement #3——长驻进程覆盖）：非仅启动时——每进程每日**首次写事件**
 *   时顺带清理 >1 天的 agent-*.log（extension host 可长驻数月，启动清理覆盖不到）。
 * - seq：每进程单调计数器。双端同写一个文件时 seq 会各自重复——定位同文件时序以
 *   ts 为准，seq 仅进程内参照（refinement #8）。
 */

import { appendFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/** 单行长度硬上限（NF-L2） */
export const MAX_LINE = 512
/** 字段名精确黑名单（NF-L3/§2.4——2026-09-03 评审 refinement #7：与 §2.4 词表一致含 token） */
const BLACKLIST_FIELDS = new Set(["apikey", "designtoken", "password", "secret", "token", "authorization", "proxyuri", "proxy"])
/** 内容密钥形态扫描（大小写不敏感）——命中即截断到形态前 */
const SECRET_FORM = /(\bsk-[A-Za-z0-9_-]{6,}|\bBearer\s+[A-Za-z0-9._~+/=-]{6,}|\b(?:api[_-]?key|key|token|secret|password|pwd|passwd)\s*[=:]\s*['"]?[A-Za-z0-9._~+/=-]{6,})/i
/** 字符串字段长度兜底：head ≤300 / err ≤200 / 其余 ≤120 */
const FIELD_CAPS = { head: 300, err: 200 }

let _seq = 0
let _dead = false // 进程内写失败即死（NF-L1 静默降级——不逐事件重复空转）
let _cleanupDate = null // 本进程已执行过清理的日期（每日首次写时清一次）

/** 日志目录：THINCODER_LOG_DIR（测试隔离/override）> ~/.thincoder/logs（与 sessions/ 同域） */
export function logsDir() {
  return process.env.THINCODER_LOG_DIR ?? join(homedir(), ".thincoder", "logs")
}

/** 今日日志文件路径（agent-YYYY-MM-DD.log） */
export function todayLogPath(now = new Date()) {
  const ymd = now.toISOString().slice(0, 10)
  return join(logsDir(), `agent-${ymd}.log`)
}

/** 写门（测试隔离）：test runner 进程（NODE_TEST_CONTEXT）默认跳过——除显式
 *  THINCODER_LOG_DIR override（log.test.mjs 隔离临时目录——refinement #6）。 */
function writeEnabled() {
  if (_dead) return false
  if (process.env.NODE_TEST_CONTEXT && !process.env.THINCODER_LOG_DIR) return false
  return true
}

/** 清理 >1 天的 agent-*.log（NF-L4——refinement #3：机会式，非仅启动时）。
 *  保留窗口（2026-09-03 code review #1 修正）：以文件名日期的**当日结束**为龄基准——
 *  今天+昨天的文件保留（任何事件至少留存 24h、最多 48h），早于昨天的删除。
 *  无法按名解析日期的 agent-*.log 按 mtime 兜底（>1 天未写的删除）。
 *  导出供测试直呼（T-L7/T-L7b）。静默：任何失败都不影响主流程。 */
export const LOG_RETENTION_MS = 24 * 60 * 60 * 1000
export function cleanupOldLogs(now = new Date()) {
  const dir = logsDir()
  if (!existsSync(dir)) return
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return
  }
  for (const name of names) {
    if (!name.startsWith("agent-") || !name.endsWith(".log")) continue
    const m = name.match(/^agent-(\d{4}-\d{2}-\d{2})\.log$/)
    const ts = m ? Date.parse(m[1] + "T00:00:00Z") : NaN
    // 文件名日期 → 龄以该日结束（ts+24h）计：事件在删除时至少已留存 24h
    const ageMs = Number.isFinite(ts) ? now - (ts + LOG_RETENTION_MS) : (tryStatAge(dir, name, now) ?? Infinity)
    if (ageMs > LOG_RETENTION_MS) {
      try { rmSync(join(dir, name), { force: true }) } catch { /* 静默 */ }
    }
  }
}

function tryStatAge(dir, name, now) {
  try {
    return now - statSync(join(dir, name)).mtimeMs
  } catch {
    return null
  }
}

/**
 * 写入一条事件（fire-and-forget）。fields 内所有字符串都经黑名单/截断处理。
 * 事件行结构：{"ts":ISO,"ev":kind,"seq":N,...fields}——单行 JSON <512 字符。
 */
export function logEvent(kind, fields = {}) {
  if (!writeEnabled()) return
  const now = new Date()
  // 机会式轮转清理：每进程每日首次写事件时执行一次（refinement #3——长驻进程覆盖）
  const ymd = now.toISOString().slice(0, 10)
  if (_cleanupDate !== ymd) {
    _cleanupDate = ymd
    cleanupOldLogs(now)
  }
  const entry = { ts: now.toISOString(), ev: kind, seq: ++_seq }
  for (const [k, v] of Object.entries(fields ?? {})) {
    if (v === undefined || v === null) continue
    // ① 字段名精确黑名单 → 丢弃（token 族永不落盘）
    if (BLACKLIST_FIELDS.has(String(k).toLowerCase())) continue
    if (typeof v === "string") entry[k] = sanitizeString(k, v)
    else if (typeof v === "number" || typeof v === "boolean") entry[k] = v
  }
  let line = JSON.stringify(entry)
  // ② 防御性收尾（NF-L2）：字段上限后仍超长 → 丢可选字段（保留 ts/ev/seq）直至 <512
  while (line.length > MAX_LINE && Object.keys(entry).length > 3) {
    for (const k of Object.keys(entry)) {
      if (k !== "ts" && k !== "ev" && k !== "seq") { delete entry[k]; break }
    }
    line = JSON.stringify(entry)
  }
  try {
    const dir = logsDir()
    mkdirSync(dir, { recursive: true })
    appendFileSync(join(dir, `agent-${ymd}.log`), line + "\n", "utf8")
  } catch {
    _dead = true // NF-L1：写失败静默降级——主流程零影响
  }
}

/** 内容级净化：密钥形态截断到形态前（②）；超长截断 + "…" 标记。 */
export function sanitizeString(key, value) {
  let s = String(value)
  // 密钥形态 → 截断到形态前（宁可丢信息不漏密钥——§2.4）
  const hit = s.match(SECRET_FORM)
  if (hit) s = s.slice(0, hit.index)
  const cap = FIELD_CAPS[key] ?? 120
  if (s.length > cap) s = s.slice(0, cap - 1) + "…"
  return s
}

/** 错误文本提取：message + cause 链首条、压成单行、≤max（默认 200——NF-L2/§2.2） */
export function errText(err, max = 200) {
  let msg = err?.message ?? String(err ?? "")
  if (!msg && err?.cause) msg = String(err.cause)
  if (err?.cause?.message && !/^LLM API error/.test(msg)) msg += ` (${err.cause.message})`
  msg = msg.replace(/\s*\n\s*/g, " ").trim()
  if (msg.length > max) msg = msg.slice(0, max - 1) + "…"
  return msg
}

/** 错误 kind 分类（llm:error 字段）：timeout（网关超时/超时信号）/ abort（用户中止）/
 *  error（其余——API/网络/未分类）。signal 为请求中止信号（chat 调用点直传）。 */
export function classifyErr(err, signal) {
  const msg = String(err?.message ?? "").toLowerCase() + " " + String(err?.cause?.message ?? "").toLowerCase()
  if (/timeout|timed ?out|etimedout|time limit exceeded/i.test(msg)) return "timeout"
  if (err?.name === "AbortError" || signal?.aborted) {
    return signal?.reason?.name === "TimeoutError" ? "timeout" : "abort"
  }
  return "error"
}

/** 文本头截取：前 max 字符、单行化（JSON 单行约束）、截断带 "…" 标记。
 *  paragraph=true（llm:done 响应头）：取首段（首个空行前）——B 方案"首段文本"语义。 */
export function headText(text, max, { paragraph = false } = {}) {
  let s = String(text ?? "")
  if (paragraph) {
    const p = s.split(/\n\s*\n/, 1)[0]
    if (p.length < s.length) s = p
  }
  s = s.replace(/\s*\n+\s*/g, " ").trim()
  if (s.length > max) s = s.slice(0, max - 1) + "…"
  return s
}
