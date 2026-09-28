/**
 * session-slot-scan.mjs — 会话槽盘面扫描（SESSION.md §6.22 · SESSION-LIST-DISK 批 · 2026-09-28）。
 *
 * 条目集单源 = 盘面实读（判据句 1）：sessions 根下 `^<hash>\.json\.(\d+)$` 的**普通文件**——
 * 逐条出槽号 N；manifest `m.slots` 不参与条目集（既不筛也不补），只作判据句 2 取数链的
 * **摘要缓存**（叠加源）。后缀闭集（`.manifest` / `.manifest.<端名>` / `.tmp` / `.corrupted` /
 * `.unreadable` / `.bak-<ts>` / `.d` 目录 / `.stale-<ts>` / 遗留单档 `<hash>.json`）由
 * 「数字槽号全锚 + 普通文件」两个判据一并排除——零伪槽号、零目录误收。
 *
 * 取数链（判据句 2 · 免费先行）：① 摘要快路（摘要在场且 **`ts`（摘要落盘时刻）≥ 文件 mtime** ⇒
 * 整条由摘要供给、**槽文件零字节读**——设计档 §6.22 判据句 2 快路比较口径**已收正为 `ts` 单源**；
 * `updatedAt`（会话逻辑时，取于写槽文件之前）恒早于 mtime ⇒ 按之快路生产永不命中）② 小档全读
 * （`size ≤ SCAN_FULL_MAX` = 256 KiB ⇒ JSON 全解析、全字段）③ 大档早键截读（读头 `min(size,
 * SCAN_HEAD_BYTES)` = 64 KiB——**结构感知扫描**：键值边界由结构定界、小值解码走 `JSON.parse`
 * 切片，零正则、零整档物化；遇顶层键 `history` 即停，其后的键不读）④ stat 兜底（`updatedAt` =
 * mtime）。字段优先级 = **盘面实读值 > 摘要值（任意新鲜度）> 缺省**（`""` / `null` / mtime）；单次
 * 调用槽文件读 ≤ `SCAN_BUDGET_BYTES`（4 MiB）——预算按 mtime 降序耗用（最上面 = 用户最可能看
 * 的行），越预算条目退 ④。计数两字段**不可得 = `null`**（真 0 与未知可分——§6.25 判据句 4）。
 *
 * 降级阶梯（判据句 3 · 入列不筛）：坏 JSON / 半写 / `version > 2` / 异 cwd 内容档一律入列
 * （存在性 ≠ 可读性）——内容面不可用 ⇒ 该档退摘要 ∪ 缺省、日期退 mtime；点开走既有失败面。
 *
 * 静态环（与 session-slots.mjs ↔ session-slots-manifest.mjs 同形）：本档引 `sessionPath`
 * （前缀 / 目录单源——先短哈希迁移、后枚举）与 `extractSlotMeta`（② 全读面摘要单源）；两侧只在
 * 函数体内运行时使用（模块求值期零顶层调用 ⇒ 环安全）。`SCAN_*` 三常量单源住本档。
 */
import { closeSync, openSync, readSync, readFileSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, join } from "node:path"
// 环 import：见头注（前缀 = `sessionPath` 的 basename——与 `slotPath` 同源）。
import { sessionPath } from "./session-slots.mjs"
// ② 全读面摘要单源（计数 / 首条真实用户消息 / 字段缺省口径——与槽摘要写面同函数）。
import { extractSlotMeta } from "./session-slots-manifest.mjs"
// 「真实用户消息」谓词单源（人读线窗口 / 槽摘要 / ③ 早键截读三面同判据）。
import { isRealUserMsg } from "./history-window.mjs"

/** ② 小档全读上界（判据句 2）。 */
export const SCAN_FULL_MAX = 256 * 1024
/** ③ 大档早键截读窗口（判据句 2）。 */
export const SCAN_HEAD_BYTES = 64 * 1024
/** 单次扫描的槽文件读预算（判据句 2——按 mtime 降序耗用，越预算退 ④）。 */
export const SCAN_BUDGET_BYTES = 4 * 1024 * 1024

/** 观测计数（测试缝——`_storeStats` / `_releaseStats` 同惯例）：读放大上界的断言语料。
 *  `bytes` = 本进程槽文件读累计字节；`reads` = 逐次读 `{ slot, bytes, window }`（window =
 *  `"full"` ② / `"head"` ③）；`fastPath` = ① 命中次数。生产零消费。 */
export const _scanStats = { calls: 0, bytes: 0, fastPath: 0, reads: [] }
/** 测试缝复位（跨用例隔离——`_resetSessionsDirForTest` 同惯例）。 */
export function _resetScanStats() {
  _scanStats.calls = 0; _scanStats.bytes = 0; _scanStats.fastPath = 0; _scanStats.reads.length = 0
}

const SLOT_SUFFIX = /^\d+$/
const HEAD_KEYS = new Set(["title", "activeProvider", "activeModel", "createdBy", "cwd", "updatedAt", "version"])
const isNum = (v) => typeof v === "number" && Number.isFinite(v)
const isStr = (v) => typeof v === "string"
const isWs = (c) => c === " " || c === "\n" || c === "\r" || c === "\t"

/** JSON 切片解码（结构定界的**小值**：键 / 短串 / 数字）；不可解析 ⇒ `undefined`。 */
function parseSlice(text, start, end) { try { return JSON.parse(text.slice(start, end)) } catch { return undefined } }

/** JSON 字符串跳过（不建值——大串零分配）。返回闭引号后一位置；窗截断 ⇒ `null`。 */
function skipJsonString(text, i) {
  const n = text.length
  let j = i + 1
  while (j < n) {
    const c = text[j]
    if (c === "\\") { j += 2; continue }
    if (c === '"') return j + 1
    j++
  }
  return null
}

/** 结构化跳过任意 JSON 值（对象 / 数组按深度配对，字符串走 `skipJsonString`）。窗截断 ⇒ `null`。 */
function skipJsonValue(text, i) {
  const n = text.length
  const c = text[i]
  if (c === '"') return skipJsonString(text, i)
  if (c === "{" || c === "[") {
    let depth = 0
    let j = i
    while (j < n) {
      const ch = text[j]
      if (ch === '"') {
        const end = skipJsonString(text, j)
        if (end === null) return null
        j = end
        continue
      }
      if (ch === "{" || ch === "[") depth++
      else if (ch === "}" || ch === "]") {
        depth--
        if (depth === 0) return j + 1
      }
      j++
    }
    return null
  }
  let j = i
  while (j < n && !isWs(text[j]) && text[j] !== "," && text[j] !== "}" && text[j] !== "]") j++
  return j === i ? null : j
}

/** ③ 供给面：窗内首个真实用户消息（谓词单源 = history-window.mjs）。`i` = `history` 数组起点。
 *  逐条结构定界 + `JSON.parse` 切片（谓词拿整条对象）；窗截断 ⇒ 停（已得部分照给）。 */
function firstUserMessage(text, i) {
  const n = text.length
  if (text[i] !== "[") return null
  let j = i + 1
  while (j < n) {
    const c = text[j]
    if (isWs(c) || c === ",") { j++; continue }
    if (c !== "{") return null // 数组尾 / 非对象条 ⇒ 不再走（保守）
    const end = skipJsonValue(text, j)
    if (end === null) return null
    const m = parseSlice(text, j, end)
    if (isRealUserMsg(m)) return m.content.slice(0, 80)
    j = end
  }
  return null
}

/** ③ 早键截读（判据句 2）：自首字节走 JSON **顶层键**——供给面键取值、遇 `history` 置
 *  `historySeen` 并取首条真实用户消息后**即停**（其后的键不读）。窗口截断 / 结构不符 ⇒ 已得
 *  部分照给（缺键由摘要补位）；值跳过一律结构定界（非正则）。 */
function scanHeadKeys(text) {
  const out = {}
  const n = text.length
  let i = 0
  while (i < n && isWs(text[i])) i++
  if (text[i] !== "{") return out
  i++
  while (i < n) {
    while (i < n && isWs(text[i])) i++
    const c = text[i]
    if (c === "}" || c === undefined) break
    if (c === ",") { i++; continue }
    if (c !== '"') break
    const keyEnd = skipJsonString(text, i)
    if (keyEnd === null) break
    const key = parseSlice(text, i, keyEnd)
    if (!isStr(key)) break
    i = keyEnd
    while (i < n && isWs(text[i])) i++
    if (text[i] !== ":") break
    i++
    while (i < n && isWs(text[i])) i++
    if (key === "history") {
      out.historySeen = text[i] === "[" // 数组起点 = ③ 面「history 数组」判据（② 面 = Array.isArray）
      const first = firstUserMessage(text, i)
      if (first !== null) out.firstMessage = first
      break // 判据：遇 history 即停（其后的键不读——大数组不跳跃、不物化）
    }
    const valEnd = skipJsonValue(text, i)
    if (valEnd === null) break // 窗截断 ⇒ 停（已得键照给）
    if (HEAD_KEYS.has(key)) {
      const v = parseSlice(text, i, valEnd)
      if (isStr(v) || isNum(v)) out[key] = v
    }
    i = valEnd
  }
  return out
}

/** 内容面可用性（判据句 3 降级阶梯）：`history` **数组**已见（② = `Array.isArray` · ③ = 值以 `[`
 *  起）∧ version ∈ {1,2} ∧ cwd 一致（缺键 = 本档）。坏 JSON / 半写 / `version > 2` / 异 cwd ⇒
 *  内容面不可用（该档退摘要 ∪ 缺省、日期退 mtime）。 */
function contentUsable(version, fileCwd, hasHistory, cwd) {
  if (!hasHistory) return false
  if (version !== 1 && version !== 2) return false
  return !(isStr(fileCwd) && fileCwd.toLowerCase() !== cwd.toLowerCase())
}

/** ② 小档全读：JSON 全解析 ⇒ 全字段（② 供给面含计数两字段）。 */
function fullDisk(text, cwd) {
  let data
  try { data = JSON.parse(text) } catch { return null }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  if (!contentUsable(data.version, data.cwd, Array.isArray(data.history), cwd)) return null
  const meta = extractSlotMeta(data.history, data.activeProvider, data.updatedAt, isStr(data.title) ? data.title : "")
  if (isNum(data.updatedAt)) meta.updatedAt = data.updatedAt
  else delete meta.updatedAt // 缺键 ⇒ 退摘要 / mtime（缺省链；extractSlotMeta 的 now() 兜底在此不适用）
  if (data.activeModel) meta.activeModel = data.activeModel
  if (data.createdBy) meta.createdBy = data.createdBy
  return meta
}

/** ③ 头窗供给面 → 盘面元数据（门不过 ⇒ `null`；`historySeen` 是内部标记，不入供给面）。 */
function headDisk(head, cwd) {
  if (!contentUsable(head.version, head.cwd, head.historySeen === true, cwd)) return null
  delete head.version
  delete head.cwd
  delete head.historySeen
  return head
}

/** 盘面枚举（判据句 1）：普通文件 + 数字槽号全锚；目录不存在 / 不可读 ⇒ `[]`。
 *  `sessionPath` 先行 = 短哈希迁移随该调用先行（先迁移、后枚举）。 */
function enumerateSlots(cwd) {
  const base = sessionPath(cwd)
  const dir = dirname(base)
  const prefix = `${basename(base)}.`
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return [] }
  const found = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.startsWith(prefix)) continue
    const suffix = e.name.slice(prefix.length)
    if (!SLOT_SUFFIX.test(suffix)) continue
    const path = join(dir, e.name)
    try {
      const st = statSync(path)
      found.push({ slot: Number(suffix), path, size: st.size, mtime: st.mtimeMs })
    } catch { /* 枚举与 stat 之间被删 / 不可达 ⇒ 视同不在盘 */ }
  }
  return found
}

/** ③ 头窗读（只读 `min(size, SCAN_HEAD_BYTES)` 字节——大档绝不整档读）。 */
function readHeadText(path) {
  const fd = openSync(path, "r")
  try {
    const buf = Buffer.allocUnsafe(SCAN_HEAD_BYTES)
    const size = readSync(fd, buf, 0, SCAN_HEAD_BYTES, 0)
    return buf.subarray(0, size).toString("utf8")
  } finally {
    try { closeSync(fd) } catch { /* 关闭失败不影响读结果 */ }
  }
}

/** 字段装配（判据句 2 优先级）：盘面实读值 > 摘要值（任意新鲜度）> 缺省（`""` / `null` / mtime）；计数两字段
 *  **不可得 = `null`**（非 `0`——真 0 与「不知道」可分；§6.25 判据句 4 / D-SE62）。`disk` = ②/③ 盘面供给面；
 *  `digest` = manifest 摘要；`dateFromStat` = 日期取 stat mtime（判据句 2 ④ 与判据句 3 降级档）。 */
function mergeFields(disk, digest, mtime, tsBase, dateFromStat) {
  const d = disk ?? {}
  const g = digest ?? {}
  const num = (a, b, fallback) => isNum(a) ? a : (isNum(b) ? b : fallback)
  const str = (a, b, fallback) => isStr(a) ? a : (isStr(b) ? b : fallback)
  const meta = {
    ts: tsBase,
    messageCount: num(d.messageCount, g.messageCount, null),
    turnCount: num(d.turnCount, g.turnCount, null),
    firstMessage: str(d.firstMessage, g.firstMessage, ""),
    activeProvider: str(d.activeProvider, g.activeProvider, ""),
    updatedAt: dateFromStat ? mtime : num(d.updatedAt, g.updatedAt, mtime),
    title: str(d.title, g.title, ""),
    createdBy: str(d.createdBy, g.createdBy, ""),
  }
  const model = str(d.activeModel, g.activeModel, null)
  if (model !== null) meta.activeModel = model
  return meta
}

/** 行时间标基准：摘要 `ts` > 数字形旧条目值 > mtime（判据句 2 缺省链）。 */
function tsBaseOf(entry, mtime) {
  if (isNum(entry?.ts)) return entry.ts
  if (isNum(entry)) return entry
  return mtime
}

/** 单档取数（判据句 2 四级的装配点）：返回 `{ meta, spent }`——`spent` = 本次占用的预算字节。 */
function readSlot(f, entry, budget, cwd) {
  const mtime = f.mtime
  const digest = entry && typeof entry === "object" ? entry : null
  const tsBase = tsBaseOf(entry, mtime)
  // ① 摘要快路：摘要在场且 `ts`（摘要落盘时刻）≥ 文件 mtime ⇒ 整条由摘要供给、槽文件零字节读
  if (digest && isNum(digest.ts) && digest.ts >= mtime) {
    _scanStats.fastPath++
    return { meta: mergeFields(null, digest, mtime, tsBase, false), spent: 0 }
  }
  // ②/③：预算内读盘；越预算 / 读失败 / 内容不可用 ⇒ 盘面缺位（日期退 mtime——判据句 2 ④ / 判据句 3）
  const full = f.size <= SCAN_FULL_MAX
  const cost = full ? f.size : SCAN_HEAD_BYTES
  if (cost > budget) return { meta: mergeFields(null, digest, mtime, tsBase, true), spent: 0 }
  let disk = null
  try {
    const text = full ? readFileSync(f.path, "utf8") : readHeadText(f.path)
    _scanStats.bytes += cost
    _scanStats.reads.push({ slot: f.slot, bytes: cost, window: full ? "full" : "head" })
    disk = full ? fullDisk(text, cwd) : headDisk(scanHeadKeys(text), cwd)
  } catch { /* 并发删除 / EPERM ⇒ 盘面缺位 */ }
  return { meta: mergeFields(disk, digest, mtime, tsBase, disk === null), spent: cost }
}

/** 扫描本 cwd 的槽文件并装配每档元数据（判据句 1 + 2）：返回 `[{ slot, meta, mtime }]`（序 = 枚举序——
 *  行序归调用面投影；`mtime` = 文件 mtime，判定链 / 核实面新鲜度判据入参）。`digests` = manifest `m.slots`。 */
export function scanSlotMetas(cwd, digests = {}) {
  _scanStats.calls++
  const found = enumerateSlots(cwd)
  found.sort((a, b) => b.mtime - a.mtime) // 预算耗用序 = mtime 降序
  let budget = SCAN_BUDGET_BYTES
  const out = []
  for (const f of found) {
    const { meta, spent } = readSlot(f, digests[f.slot], budget, cwd)
    budget -= spent
    out.push({ slot: f.slot, meta, mtime: f.mtime })
  }
  return out
}
