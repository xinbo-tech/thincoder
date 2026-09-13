/**
 * trace-store.mjs — §18.6 完整轨迹存档（AGENT-LOOP.md §18.6 D-TR1..TR8 权威规格）。
 *
 * 完整请求-响应轨迹落盘：每次 chat() 调用一个 JSONL 文件到
 * ~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl。采集点唯一 = core.mjs
 * chat() 导出出口（所有模型调用——主回合/消化轮/compress/distill/advisor/子代理/
 * auto-think/consult——都经该函数）——续写/重试在出口已合并（reasoning 全量）。
 *
 * 纪律（与 log.mjs 同源惯例）：
 * - 真 fire-and-forget（F-TR3——模型调用路径零额外阻塞）：seq 同步预留（原子号位），
 *   写盘异步（node:fs/promises——不 await）；落盘失败静默降级（不抛错、不阻塞
 *   chat() 返回）。recordChatTrace 返回落盘 promise——仅供测试/显式消费方 await。
 * - 测试隔离：node --test 进程（NODE_TEST_CONTEXT）默认不写盘——防测试事件污染真实
 *   轨迹目录（既有测试跑真实 agent 管线会产生数百次 chat 调用）；显式设置
 *   THINCODER_TRACES_DIR 强制写入该目录（traces.test.mjs 用它隔离临时目录——
 *   与 log.mjs 的 THINCODER_LOG_DIR 同惯例）。
 * - 脱敏（D-TR2）：复用 log.mjs 字段名黑名单（apikey/designtoken/password/secret/
 *   token/authorization/proxyuri/proxy）+ SECRET_FORM 形态扫描（redactSecret）——对
 *   messages/content/reasoning/toolCalls/error 全字段应用；不发明新遮蔽模式。
 *   **单遍序列化（TUI-OOM-ROOTCAUSE——§23.3.2：修正轮 #2 使「不截断」表述作废）**：
 *   脱敏内联进输出缓冲（不再构造复制图 + 二次全量字符串）——字段名/次序与既有
 *   `JSON.stringify` 形态同构（T-TR1 等价断言）。
 * - 容量有界（N-TR1 修订）：单消息字符串超 `TRACE_MESSAGE_MAX_CHARS` 截断（头 16K +
 *   中段标记 + 尾 48K）；序列化总长超 `TRACE_RECORD_MAX_CHARS` → `messages` 降级为
 *   stub 串（其余字段保留）；在途写盘份数 ≤ `TRACE_PENDING_MAX`（超限丢弃并计数——
 *   尽力面，可观测）。目录按日组织（YYYY-MM-DD），可按日/会话过滤；保留期清理见
 *   `cleanupTraces`（D-TR8）。
 * - seq = 当日目录内最大已有 seq + 1（D-TR3——跨会话/进程重启不覆写既有旧轨迹——
 *   18.6.1 评审 #3）；**进程内 seqCache（§23.3.2——消除逐调用同步扫目录）**：首次
 *   readdirSync 后进程内递增预留，目录被清理（retention）后取下界重扫一次（防御）。
 *   多进程语义（修正轮 #10——登记）：同 cwd 多实例各自进程内缓存——seq 可撞、同
 *   sessionKey 记录并入同名文件（append 不覆写）；**可容忍**（本机 traces = 诊断面、
 *   默认 OFF、撞号不损坏数据）；不做跨进程协调/落盘校验。
 * - 日期分日按本地时区（D-TR3——2026-09-04 fix round1：初版 toISOString()=UTC——
 *   本地 00:00-08:00 的调用会落进前一日目录——改本地日期字符串 YYYY-MM-DD——T-TR12）。
 * - isContinuation（D-TR1——2026-09-04 fix round1）：续写/重试链标记——true = 该调用
 *   是续写链的一环（core.mjs 续写递归传出 logCtx.isContinuation）；新调用 false。
 *   记录不输出 round 字段（全设计无 round 定义——删——不发明无来源字段）。
 */
import { readdirSync, existsSync } from "node:fs"
import { appendFile, mkdir, readdir, stat, unlink, rmdir } from "node:fs/promises"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { configDir } from "../config.mjs"
import { redactSecret, errText, classifyErr } from "../log.mjs"
import { normalizeCwd } from "../session-slots.mjs"
import { capText } from "../text-budget.mjs"

/** 轨迹根目录：THINCODER_TRACES_DIR（测试隔离/override——同 THINCODER_LOG_DIR
 *  惯例）> ~/.thincoder/traces（configDir——D-TR3——与 sessions/ 同域）。 */
export function tracesRoot() {
  return process.env.THINCODER_TRACES_DIR ?? join(configDir, "traces")
}

/** 写门（测试隔离）：test runner 进程（NODE_TEST_CONTEXT）默认跳过——除显式
 *  THINCODER_TRACES_DIR override（traces.test.mjs 隔离临时目录）。 */
function writeEnabled() {
  if (process.env.NODE_TEST_CONTEXT && !process.env.THINCODER_TRACES_DIR) return false
  return true
}

/** sessionKey = sha1(normalizeCwd(cwd))[:12]（D-TR3——与 session-slots sessionPath
 *  同算法同 cwd 归一——两端 hash 一致）。 */
export function traceSessionKey(cwd) {
  return createHash("sha1").update(normalizeCwd(cwd)).digest("hex").slice(0, 12)
}

/** 本地时区日期字符串 YYYY-MM-DD（D-TR3——2026-09-04 fix round1：初版
 *  toISOString()=UTC 日期——本地 00:00-08:00 落前一日目录；本地日期才是用户视角的
 *  "今天"——T-TR12）。recordChatTrace 与测试读取 helpers 共用同一实现——不双写。 */
export function localDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Test hooks（_rateHooks 同惯例——rate.mjs）：now/readdir/exists/mkdir/append 注入缝
 *  （T-TR5 计数 readdirSync；T-TR4 慢写替身；T-TR12 注入本地日 ≠ UTC 日的时刻）。
 *  生产永远走真实实现。 */
export const _traceHooks = {
  now: () => new Date(),
  readdir: (dir) => readdirSync(dir),
  exists: (p) => existsSync(p),
  mkdir: (dir) => mkdir(dir, { recursive: true }),
  append: (path, text) => appendFile(path, text, "utf8"),
}

/** 当日轨迹目录（D-TR3：traces/YYYY-MM-DD——分日组织——N-TR1）。 */
export function tracesDirFor(dateStr) {
  return join(tracesRoot(), dateStr)
}

// ─── 额度常量（§23.3.2——编译期常量，不新增配置项 D-TR4）─────────────────────

/** 单消息字符串额度（消息内容/推理/工具参数串）——超限：头 16K + 中段标记 + 尾 48K。 */
export const TRACE_MESSAGE_MAX_CHARS = 65_536
/** 单记录总长额度——超限：`messages` 字段整体降级为 stub 串（元数据保留）。 */
export const TRACE_RECORD_MAX_CHARS = 4_000_000
/** 在途写盘份数上限（超限丢弃本记录 + 计数——不阻塞模型调用路径）。 */
export const TRACE_PENDING_MAX = 8

/** 内容额度标记（逐字——进测试断言；同族工具预览形态）。 */
const MSG_MARKER = "… [trace truncated: N chars omitted] …"
const HEAD_CHARS = 16_384
const TAIL_CHARS = 49_152

/** 受额度约束的字段名（消息内容/推理/工具参数串——§23.3.2 字面集）。 */
const CAPPED_KEYS = new Set(["content", "reasoning", "reasoning_content", "reasoningContent", "arguments"])

// ─── 在途计数（§23.3.2 表 4 候选 1：待写计数上限 8 + 超限丢弃计数）────────────

let _pendingWrites = 0
let _droppedRecords = 0
let _saturationNotified = false

// 进程内 seq 缓存（§23.3.2：dir → 已见/已预留 max——首次 readdirSync 后递增预留；
// 目录被清理（retention）后取下界重扫一次（防御））。
const _seqCache = new Map()

/** 在途/丢弃观测（测试缝——T-TR4）。 */
export function _traceStoreStats() {
  return { pending: _pendingWrites, dropped: _droppedRecords }
}

/** 测试缝：清进程内状态（seqCache + 在途/丢弃计数）。 */
export function _resetTraceStateForTest() {
  _seqCache.clear()
  _pendingWrites = 0
  _droppedRecords = 0
  _saturationNotified = false
}

function scanMaxSeq(dir) {
  if (!_traceHooks.exists(dir)) return 0
  let names
  try { names = _traceHooks.readdir(dir) } catch { return 0 }
  let max = 0
  for (const name of names) {
    const m = name.match(/-(\d+)\.jsonl$/)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

/** seq = max(当日目录最大已有 seq, 进程内已预留) + 1（D-TR3——跨会话/进程重启
 *  不覆写——T-TR8/T-TR10；同步预留 = 异步写盘启动前的原子号位分配）。
 *  §23.3.2：seqCache 进程内递增——不逐调用 readdirSync（目录被清理/缺失 → 重扫一次）。 */
export function nextTraceSeq(dateStr) {
  const dir = tracesDirFor(dateStr)
  let max = _seqCache.get(dir)
  if (max === undefined || !_traceHooks.exists(dir)) {
    // 首次调用（或目录被 retention 清理/缺失）——重扫磁盘取真实下界（防御：清除后重号安全）
    const disk = scanMaxSeq(dir)
    max = Math.max(disk, max ?? 0)
  }
  const seq = max + 1
  _seqCache.set(dir, seq)
  return seq
}

/** 开关（D-TR6）：traces.enabled 缺省 on（默认全采集）；logCtx.traces === false
 *  显式关闭（调用点读取 agent.config.traces.enabled——D-TR6）。 */
export function tracesEnabled(logCtx) {
  return logCtx?.traces !== false
}

// ─── 单遍序列化（§23.3.2 D-TR1——脱敏内联、零复制图、字段名/次序同构）────────

const OMIT = Symbol("omit") // JSON.stringify 语义：对象属性省略（数组元素 → null）

function scalarJson(key, v) {
  if (typeof v === "string") {
    // 额度（§23.3.2）+ 脱敏（D-TR2）单点：先限长（标记随附）再遮蔽形态扫描——
    // 输出与既有 redactValue(key, s) 串值路径逐字同形（除外显式截断标记）。
    if (v.length > TRACE_MESSAGE_MAX_CHARS && CAPPED_KEYS.has(key)) {
      return JSON.stringify(redactSecret(key, capText(v, { max: TRACE_MESSAGE_MAX_CHARS, keepHead: HEAD_CHARS, keepTail: TAIL_CHARS, marker: MSG_MARKER })))
    }
    return JSON.stringify(redactSecret(key, v))
  }
  if (v === null) return "null"
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null" // JSON.stringify(NaN/±Infinity) === "null"
  if (typeof v === "boolean") return v ? "true" : "false"
  return undefined // undefined/function/symbol/bigint → 省略（JSON.stringify 同语义）
}

function writeValue(out, key, v) {
  const s = scalarJson(key, v)
  if (s !== undefined) { out.push(s); return true }
  if (Array.isArray(v)) {
    out.push("[")
    for (let i = 0; i < v.length; i++) {
      if (i) out.push(",")
      if (!writeValue(out, key, v[i])) out.push("null") // 数组元素不可省略
    }
    out.push("]")
    return true
  }
  if (v && typeof v === "object") {
    if (typeof v.toJSON === "function") { // Date/宿主对象：保持 JSON.stringify 等价
      const js = JSON.stringify(v)
      out.push(js === undefined ? "null" : js)
      return true
    }
    out.push("{")
    let first = true
    for (const [k, val] of Object.entries(v)) {
      const omit = val === undefined || typeof val === "function" || typeof val === "symbol" || typeof val === "bigint"
      if (omit) continue
      if (!first) out.push(",")
      first = false
      out.push(JSON.stringify(k), ":")
      writeValue(out, k, val)
    }
    out.push("}")
    return true
  }
  return false // OMIT
}

/**
 * 收集一次 chat 调用轨迹（D-TR1 字段集）——fire-and-forget（F-TR3）。
 * 由 core.mjs chat() 导出出口调用（唯一采集点——N-TR2）；签名零参数膨胀——
 * 数据全部来自调用方已传入的 opts（logCtx 元数据——D-TR4）+ provider + result/error。
 *
 * @param {Object} provider chat() 的 provider 参数（provider/model 字段来源）
 * @param {Object} opts chat() 原始 opts —— messages（输入）与 logCtx（元数据：
 *   role/depth/kind/session/cwd/stage/turn/traces——调用点增补，D-TR4）
 * @param {Object|null} result chatImpl 返回值（成功路径——content/reasoning/
 *   toolCalls/usage/finishReason；N-TR3：出口汇总——续写/重试后全量）
 * @param {Error|null} error chat() 抛出的错误（失败路径——D-TR5：error（errText
 *   截断 + 类别）+ finishReason:null——失败轨迹恰是分析纠结点最有效的材料）
 */
export function recordChatTrace(provider, opts = {}, result = null, error = null) {
  if (!writeEnabled()) return
  const logCtx = opts.logCtx ?? {}
  if (!tracesEnabled(logCtx)) return
  // §23.3.2 在途上界（表 4 候选 1）：饱和即丢弃本记录（尽力面——丢弃可观测），
  // 首次饱和打一行 stderr（每饱和段一次；排空后复位）。
  if (_pendingWrites >= TRACE_PENDING_MAX) {
    _droppedRecords++
    if (!_saturationNotified) {
      _saturationNotified = true
      console.error(`[trace] pending write queue full — ${_droppedRecords} record(s) dropped`)
    }
    return
  }
  // cwd/session 经 logCtx 增补（调用点传 agent.cwd / agent._sessionStart——
  // D-TR3 的 cwdHash/命名与 D-TR1 的 session 字段所需）；无 agent 作用域的调用点
  // 回退 process.cwd()——CLI 会话即工作区。该类点开关状态：distill 已含
  // traces 开关（D-TR6 fix round1）；auto-think 已闭环（D-TS12——chat 调用点
  // logCtx 全字段补传：traces/session/cwd/role/depth/kind——无残留点）。
  const cwd = logCtx.cwd ?? process.cwd()
  // D-TR3（fix round1）：分日按本地时区（_traceHooks.now——T-TR12 注入点）；
  // ts 与 dateStr 同源（同一时刻）——记录时间戳与目录日不撕裂。
  const now = _traceHooks.now()
  const dateStr = localDateStr(now)
  const seq = nextTraceSeq(dateStr)
  const sessionKey = traceSessionKey(cwd)

  // 单遍序列化：头段字段 + messages（独立缓冲——记录级额度降级用）+ 尾段字段。
  const parts = ["{"]
  let first = true
  const put = (k, v) => {
    if (!first) parts.push(",")
    first = false
    parts.push(JSON.stringify(k), ":")
    writeValue(parts, k, v)
  }
  put("ts", now.toISOString())
  put("session", logCtx.session ?? null)
  put("cwdHash", createHash("sha1").update(normalizeCwd(cwd)).digest("hex"))
  put("role", logCtx.role ?? null)
  put("depth", logCtx.depth ?? null)
  put("turn", logCtx.turn ?? null)
  put("provider", provider?.name ?? provider?.model ?? "unknown")
  put("model", provider?.model ?? "")
  put("stage", logCtx.stage ?? null)
  put("kind", logCtx.kind ?? null)
  // D-TR1（fix round1）：续写/重试链标记——true = 该调用是续写链的一环
  // （core.mjs 续写递归传出）；新调用缺省 false——round 字段已删（无来源）。
  put("isContinuation", logCtx.isContinuation === true)
  const msgAt = parts.length
  const msgParts = []
  writeValue(msgParts, "messages", opts.messages ?? [])
  put("content", result?.content ?? null)
  put("reasoning", result?.reasoning ?? null)
  put("toolCalls", result?.toolCalls ?? null)
  put("usage", result?.usage ?? null)
  put("finishReason", result?.finishReason ?? null)
  if (error != null) {
    // D-TR5：错误路径轨迹——error（errText 截断 + 类别）+ finishReason:null
    put("error", {
      err: redactSecret("err", errText(error, 500)),
      kind: classifyErr(error, opts.signal),
    })
  }
  const headStr = parts.slice(0, msgAt).join("")
  const tailStr = parts.slice(msgAt).join("")
  const msgStr = msgParts.join("")
  const msgsArr = Array.isArray(opts.messages) ? opts.messages : []
  const record = (() => {
    const total = headStr.length + msgStr.length + tailStr.length + 1
    if (total > TRACE_RECORD_MAX_CHARS) {
      // 单记录额度（§23.3.2）：messages 整体降级 stub——元数据字段保留、标记含计数
      const stub = `[trace record truncated for size: ${total} chars / ${msgsArr.length} messages]`
      return `${headStr},${JSON.stringify("messages")}:${JSON.stringify(stub)}${tailStr}}`
    }
    return `${headStr},${JSON.stringify("messages")}:${msgStr}${tailStr}}`
  })()

  // 真 fire-and-forget（F-TR3——模型调用路径零额外阻塞）：seq 已在上面同步预留
  // （原子号位——写盘在途并发不撞号）；写盘异步（不 await——chat() 出口立即返回）。
  // 返回值 = 落盘 promise（测试 await 用；chat() 不消费——fire-and-forget 语义）。
  _pendingWrites++
  return (async () => {
    try {
      const dir = tracesDirFor(dateStr)
      await _traceHooks.mkdir(dir) // D-TR3：写前建目录（与 sessions/tool-results 同惯例）
      await _traceHooks.append(join(dir, `${sessionKey}-${seq}.jsonl`), record + "\n")
    } catch {
      // F-TR3：落盘失败静默降级——不抛错、不阻塞 chat() 返回
    } finally {
      _pendingWrites--
      if (_pendingWrites === 0) _saturationNotified = false // 排空 → 下个饱和段可再报一次
    }
  })()
}

/**
 * D-TR10（2026-09-05 用户裁定——发布隐私 + 磁盘卫生）：启动清理——删除 traces 根下
 * mtime 超过保留期的轨迹文件（保留期 = config.traces.retentionHours，默认 24h）；
 * 删空的日期目录（YYYY-MM-DD）。目录里非 .jsonl 文件不碰。CLI 启动点 fire-and-forget
 * 调用（不 await——不阻塞启动——失败静默——与轨迹写盘同纪律）。返回删除文件数。
 */
export async function cleanupTraces({ dir = tracesRoot(), retentionHours = 24 } = {}) {
  const cutoff = Date.now() - retentionHours * 3_600_000
  let days
  try { days = await readdir(dir) } catch { return 0 } // 目录不存在/不可读 → 无事可做
  let removed = 0
  for (const day of days) {
    const dayDir = join(dir, day)
    try { if (!(await stat(dayDir)).isDirectory()) continue } catch { continue }
    let names
    try { names = await readdir(dayDir) } catch { continue }
    for (const n of names) {
      if (!n.endsWith(".jsonl")) continue
      try {
        if ((await stat(join(dayDir, n))).mtimeMs < cutoff) { await unlink(join(dayDir, n)); removed++ }
      } catch { /* 单个文件失败不影响其余 */ }
    }
    try { if ((await readdir(dayDir)).length === 0) await rmdir(dayDir) } catch {}
  }
  return removed
}
