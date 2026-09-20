/**
 * session-store.mjs — 人读线记录存储：磁盘为准 + 内存窗口（TUI-OOM-ROOTCAUSE 批）。
 * 机制契约全文 = docs/core/design/SESSION.md §6.14（D2 单一权威源）；本文件 = 实现。
 * 形态：`{slot 文件路径}.d/` + `meta.json` + `seg-000001.jsonl`（行 = slimForDisplay 后的
 * 消息 JSON——与槽 JSON `history` 元素逐字节同形；投影零转换，§6.14）。
 * 依赖：零项目内依赖（仅 `node:`）——路径由 `slotFile` 传入；session.mjs / session-slots.mjs /
 * session-guard.mjs 单向引本模块。窗口驱逐在 pushReal（context.mjs）、追加单点同 pushReal。
 * 段 IO 原语与条目形态（`slimForDisplay` 等）拆住 `session-segments.mjs`（越 500 硬限的
 * 职责拆分——本档 re-export 全部公开名，调用面零改）。
 */

import {
  appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync,
  renameSync, rmSync, truncateSync, unlinkSync, writeFileSync, writeSync,
} from "node:fs"
import { basename, dirname, join } from "node:path"
import {
  RECORD_SEG_MESSAGES, recordDirOf, segName, listSegments, readSegmentLines, tryParse,
  isLegacyTransient, slimForDisplay, shouldAppend, isRealUserMsg, _storeStats,
} from "./session-segments.mjs"

// 公开名 re-export（调用面零改——§6.14 接口面）
export {
  RECORD_SEG_MESSAGES, RECORD_DIR_SUFFIX, recordDirOf, isLegacyTransient, slimForDisplay, _storeStats,
} from "./session-segments.mjs"

/** 内存窗口（条数——与首屏 INITIAL_HISTORY_MESSAGES 同值——单一概念，§6.14）。 */
export const RECORD_WINDOW_MESSAGES = 200

const META_NAME = "meta.json"

class RecordStore {
  constructor(slotFile) {
    this.slotFile = slotFile
    this.dir = recordDirOf(slotFile)
    this.agent = null
    this.identity = null      // meta.identity（会话身份锚 = sessionStart）
    this.degraded = false     // 追加失败即停（§6.14 D-R4①）
    this.memTotal = 0         // pushReal 计数（含未落盘条——缺口 = memTotal − total，D-R4②）
    this._segCount = this._lastSegN = this._lastSegLines = 0 // 末段段号（= 段文件数）+ 行数
    this._metaReady = false
    this._lastSegCache = null // { n, lines }——bind 期复用（恢复只读末段：不重复读同一段）
    this._partialSeg = 0      // 带未写完半行的段号（崩溃现场——首写前先补行终止符，防粘连）
    this._counts = { turnCount: 0, firstMessage: "" }
    this._sawRealUser = false
    this._firstUser = undefined // undefined = 未扫；null = 无（首扫一次并缓存）
  }

  /** 绑定对账（§6.14）：**先验身份、后比计数**。返回 this。 */
  bind(agent, identity, baseHistory) {
    this.agent = agent
    const base = (Array.isArray(baseHistory) ? baseHistory : []).filter(shouldAppend)
    const site = identity ?? null
    let meta = this._readMeta()
    this._scan()
    const hasSidecar = meta !== null || this._segCount > 0
    if (hasSidecar) {
      this.identity = meta?.identity ?? null
      const bothEmpty = !this.identity && !site
      const same = !!(this.identity && site && this.identity === site)
      if (!bothEmpty && !same) {
        // 陈旧/孤儿 sidecar——不得采纳（槽号回收/轮转/改名/对端占用同槽的跨会话污染面）：
        // 改名 `.stale-<epochms>` 保留现场，按现场重建（§6.14 ②③）——身份回到现场身份
        // （否则空 base 路径不重物化时，新建 sidecar 会把旧会话身份写进 meta——内审 #1）。
        this._quarantine()
        this.identity = site
        meta = null
      }
    } else {
      this.identity = site // 无 sidecar：创建时写入现场身份（可 null——待固化）
    }
    const storeTotal = this.total()
    if (meta?.degraded === true || storeTotal < base.length) {
      // ② 计数对账——以 JSON 为准重建（降级标记 / JSON 更长：VSC 追加、sidecar 缺失、首次迁移）
      this.identity = site
      this._materialize(base)
    } else {
      // 以段为准（崩溃后未保存消息可见）——计数 = JSON 全量 + JSON 之后的已落盘尾部
      this._countOver(base)
      if (storeTotal > base.length) this._countOver(this._range(base.length, storeTotal))
    }
    this.memTotal = this.total()
    return this
  }

  _readMeta() {
    try {
      const p = join(this.dir, META_NAME)
      if (!existsSync(p)) return null
      const m = JSON.parse(readFileSync(p, "utf8"))
      return m && typeof m === "object" ? m : null
    } catch { return null }
  }

  _writeMeta() {
    const meta = { v: 1, segSize: RECORD_SEG_MESSAGES, identity: this.identity ?? null }
    if (this.degraded) meta.degraded = true
    try {
      mkdirSync(this.dir, { recursive: true })
      const tmp = join(this.dir, META_NAME) + ".tmp"
      writeFileSync(tmp, JSON.stringify(meta), "utf8")
      renameSync(tmp, join(this.dir, META_NAME))
    } catch {
      try { writeFileSync(join(this.dir, META_NAME), JSON.stringify(meta), "utf8") } catch { /* 尽力面 */ }
    }
  }

  /** meta 同步（身份补写 / 降级置位时重写——小文件原子写）。 */
  syncMeta() {
    try { this._writeMeta(); this._metaReady = true } catch { /* 尽力面 */ }
  }

  /** 陈旧/孤儿现场保留：目录改名 `.stale-<epochms>`（与 .bak/.corrupted 同族）后按现场重建。 */
  _quarantine() {
    const dst = `${this.dir}.stale-${Date.now()}`
    try {
      renameSync(this.dir, dst)
      console.error(`[session] stale record store preserved as ${basename(dst)} (identity ${this.identity ?? "null"} ≠ session)`)
    } catch { /* 改名失败（占用）——仍按现场重建（materialize 覆盖） */ }
    this._resetState()
    this.identity = null // 隔离后不再持有旧身份（新 sidecar 待写现场身份——bind 内随即置回 site）
    this.degraded = false
  }

  /** 定位态 + 计数态归零（改名/重建/扫描共用；counts=false 保留计数——扫描路径）。 */
  _resetState(counts = true) {
    this._segCount = this._lastSegN = this._lastSegLines = 0
    this._metaReady = false
    this._lastSegCache = null
    this._partialSeg = 0
    if (!counts) return
    this._counts = { turnCount: 0, firstMessage: "" }
    this._sawRealUser = false
    this._firstUser = undefined
  }

  /** 目录扫描：段数 + 末段行数（半行 = 末段最后一行解析失败 → 视为未写完、忽略）。 */
  _scan() {
    const segs = listSegments(this.dir)
    this._resetState(false)
    if (segs.length === 0) return
    this._segCount = this._lastSegN = segs[segs.length - 1]
    const lines = readSegmentLines(join(this.dir, segName(this._lastSegN)))
    const complete = lines.length > 0 && tryParse(lines[lines.length - 1]) === undefined ? lines.length - 1 : lines.length
    this._lastSegLines = complete
    // 末尾半行（崩溃现场）：记段号——下一次追加先补行终止符（不自动修复内容，仅不粘连新记录）
    this._partialSeg = lines.length > complete ? this._lastSegN : 0
    this._lastSegCache = { n: this._lastSegN, lines: lines.slice(0, complete) }
  }

  /** 末段缓存取段（bind 期不重复读同一段）。 */
  _segmentLines(n) {
    if (this._lastSegCache && this._lastSegCache.n === n) return this._lastSegCache.lines
    return readSegmentLines(join(this.dir, segName(n)))
  }

  _countOver(msgs) {
    for (const m of msgs) this._countLine(m)
  }

  /** 以 JSON 为准重建整个 sidecar（rm 目录 → 重新物化——§6.14 规则 2）。 */
  _materialize(base) {
    try { rmSync(this.dir, { recursive: true, force: true }) } catch { /* 尽力面 */ }
    this._resetState()
    this.degraded = false
    this.memTotal = 0
    if (base.length === 0) return // 两者皆空 → 新目录懒创建（首 append 建目录/写 meta）
    mkdirSync(this.dir, { recursive: true })
    this._writeMeta()
    this._metaReady = true
    const buf = []
    for (const m of base) {
      this._countLine(m)
      buf.push(JSON.stringify(slimForDisplay(m)))
      if (buf.length >= RECORD_SEG_MESSAGES) this._flushSeg(buf)
    }
    this._flushSeg(buf)
    this.memTotal = this.total()
  }

  /** 段落盘（物化路径——整段一次写出）。 */
  _flushSeg(lines) {
    if (lines.length === 0) return
    const n = this._lastSegN + 1
    writeFileSync(join(this.dir, segName(n)), lines.join("\n") + "\n", "utf8")
    this._lastSegN = n
    this._lastSegLines = lines.length
    this._segCount = n
    this._lastSegCache = null
    _storeStats.segmentWrites++
    lines.length = 0
  }

  /** 已落盘条数：(段数−1) × segSize + 末段行数（末段空文件按 0 行计）。 */
  total() {
    if (this._segCount <= 0) return 0
    return (this._segCount - 1) * RECORD_SEG_MESSAGES + this._lastSegLines
  }

  /** 绝对区间 [lo, hi) 的连续切片（逐段读——只触碰覆盖区间段）。 */
  _range(lo, hi) {
    const out = []
    const total = this.total()
    if (hi <= lo || total <= 0) return out
    const firstSeg = Math.floor(lo / RECORD_SEG_MESSAGES) + 1
    const lastSeg = Math.floor((hi - 1) / RECORD_SEG_MESSAGES) + 1
    for (let s = firstSeg; s <= lastSeg; s++) {
      const lines = this._segmentLines(s)
      const segBase = (s - 1) * RECORD_SEG_MESSAGES
      for (let k = 0; k < lines.length; k++) {
        const idx = segBase + k
        if (idx < lo || idx >= hi || idx >= total) continue
        const msg = tryParse(lines[k])
        if (msg !== undefined) out.push(msg)
      }
    }
    return out
  }

  /** 尾部 n 条（恢复窗口：只读末段及其前置段）。 */
  tail(n) {
    const total = this.total()
    return this._range(Math.max(0, total - n), total)
  }

  /** 区间取页 + ±1 页沿（§6.14——页沿上下文供渲染层跨页回合标签/工具结果配对）。 */
  page(start, end, { margin = 1 } = {}) {
    const total = this.total()
    const lo = Math.max(0, start - margin)
    const hi = Math.min(total, end + margin)
    return { messages: this._range(lo, hi), base: lo }
  }

  /** 方向流式迭代（read_history 用——'newest' 自尾向前 / 'oldest' 自首向后）。 */
  *iterate(direction = "newest") {
    const total = this.total()
    if (total <= 0) return
    const segs = []
    for (let s = 1; s <= this._segCount; s++) segs.push(s)
    const order = direction === "oldest" ? segs : [...segs].reverse()
    for (const s of order) {
      const lines = this._segmentLines(s)
      const segBase = (s - 1) * RECORD_SEG_MESSAGES
      for (let k = 0; k < lines.length; k++) {
        const idx = direction === "oldest" ? segBase + k : segBase + (lines.length - 1 - k)
        if (idx >= total) continue // 半行（末段未写完）不计
        const msg = tryParse(lines[idx - segBase])
        if (msg !== undefined) yield msg
      }
    }
  }

  /** 首条真实 user 消息（标题回退——首扫一次并缓存；生成器惰性：命中即停，不扫后续段）。 */
  firstUserMessage() {
    if (this._firstUser !== undefined) return this._firstUser
    this._firstUser = null
    for (const m of this.iterate("oldest")) {
      if (isRealUserMsg(m)) { this._firstUser = m; break }
    }
    return this._firstUser
  }

  /** 槽摘要计数（manifest digest——不物化 history）：{total, userReal, firstMessage}。 */
  counters() {
    return { total: this.total(), userReal: this._counts.turnCount, firstMessage: this._counts.firstMessage }
  }

  /** 追加一条真实消息（§6.14 单点 = pushReal；同步；独立 try/catch——失败置 degraded + 停写）。 */
  append(msg) {
    if (!shouldAppend(msg)) return false
    this.memTotal++
    if (this.degraded) return false
    try {
      this._writeLine(msg)
      return true
    } catch (e) {
      this.degraded = true
      console.error(`[session] record store append failed (${e.message}) — writing stopped`)
      return false
    }
  }

  /** 半行现场修复（写路径，代码评审 #1）：截掉末尾未写完的半行——恢复「物理行序 = 逻辑
   *  序」不变式（读侧按计数索引；半行占位会使后续记录的物理位置与计数错位）。半行对应
   *  的消息从未被确认（崩溃中止的写入）——丢弃即读侧「视为未写完、忽略」的落盘面。 */
  _dropPartialTail() {
    if (!this._partialSeg || this._partialSeg !== this._lastSegN) return
    this._partialSeg = 0
    this._lastSegCache = null
    try {
      const p = join(this.dir, segName(this._lastSegN))
      const buf = readFileSync(p)
      truncateSync(p, buf.lastIndexOf(0x0a) + 1) // −1（无完整行）→ 截为 0
    } catch { /* 尽力面：截断失败仍按读侧半行容错跳过 */ }
  }

  /** 单条落盘（成功路径——失败向上抛，由 append/catchUp 统一处置）。 */
  _writeLine(msg) {
    mkdirSync(this.dir, { recursive: true })
    this._dropPartialTail() // 先清末尾半行（若在）——防新记录与半行错位/粘连
    // 身份固化：创建时为空 → 现场身份补写（只在跃迁时重写 meta——逐条追加不重复写）
    const hadIdentity = this.identity != null
    if (!hadIdentity && this.agent?._sessionStart) this.identity = this.agent._sessionStart
    if (!this._metaReady || (!hadIdentity && this.identity != null)) {
      this._writeMeta()
      this._metaReady = true
    }
    if (this._lastSegN === 0) {
      this._lastSegN = 1
      this._lastSegLines = 0
      this._segCount = 1
    } else if (this._lastSegLines >= RECORD_SEG_MESSAGES) {
      this._lastSegN++ // 轮转：末段满 segSize → 下一次追加新建下一段
      this._lastSegLines = 0
      this._segCount = this._lastSegN
    }
    appendFileSync(join(this.dir, segName(this._lastSegN)), JSON.stringify(slimForDisplay(msg)) + "\n", "utf8")
    _storeStats.appendedEntries++
    this._lastSegLines++
    this._lastSegCache = null
    this._countLine(msg)
  }

  _countLine(m) {
    if (!isRealUserMsg(m)) return
    this._counts.turnCount++
    if (!this._sawRealUser) {
      this._sawRealUser = true
      this._counts.firstMessage = String(m.content).slice(0, 80)
    }
  }

  /** D-R4② 追赶重试（保存时点）：缺口 ⊆ 窗口 → 重试追加；窗口已滑过缺口 → 不补写（不写洞）。 */
  catchUp() {
    if (!this.degraded) return true
    _storeStats.catchUpRetries++
    const gap = this.memTotal - this.total()
    if (gap <= 0) { this.degraded = false; return true }
    const win = (this.agent?._fullHistory ?? []).filter(shouldAppend)
    if (gap > win.length) return false // 缺口已滑出窗口——保持降级（不写洞）
    const missing = win.slice(win.length - gap)
    try {
      for (const m of missing) this._writeLine(m)
    } catch (e) {
      console.error(`[session] record store catch-up failed: ${e.message}`)
      return false
    }
    this.degraded = false
    return true
  }

  /** 降级置位（追赶失败——投影照 store 前缀 + meta.degraded 标记 + stderr 一行诊断）。 */
  markDegraded() {
    this.degraded = true
    console.error("[session] record store degraded — projection written from the stored prefix; unflushed messages beyond the window are unrecoverable")
    this.syncMeta()
  }
}

/** 绑定记录存储到 agent（`agent._recordStore`）+ 身份核验/对账 + 窗口置位（§6.14）。 */
export function bindRecordStore(agent, { slotFile, identity = null, baseHistory = [] } = {}) {
  const store = new RecordStore(slotFile)
  store.bind(agent, identity, baseHistory)
  agent._recordStore = store
  agent._historyWindow = RECORD_WINDOW_MESSAGES
  return store
}

/** 解绑（模式 F / /new 重置——内存窗口随之关闭，人读线回到全量数组语义）。 */
export function unbindRecordStore(agent) {
  agent._recordStore = null
  agent._historyWindow = null
}

/** 删槽联动（deleteSlot / 冷前缀清理调用）。 */
export function unlinkRecordStore(slotFile) {
  try { rmSync(recordDirOf(slotFile), { recursive: true, force: true }) } catch { /* 尽力面 */ }
}

/**
 * 槽 JSON 投影（流式拼接——§6.14 表 3 候选 1）：`history` = 各段原文拼接（峰值 O(单段)）；
 * 原子写（.tmp + rename——与 writeSessionFile 同族）。降级态先追赶（D-R4②）。
 */
export function saveProjectedSlot(agent, p, fields, contextHistory) {
  const store = agent?._recordStore
  if (!store) return false
  store.catchUp()
  if (store.degraded) {
    store.markDegraded()
  } else {
    if (store.identity == null && agent._sessionStart) store.identity = agent._sessionStart // 身份固化（规则 3）
    store.syncMeta()
  }
  mkdirSync(dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  const fd = openSync(tmp, "w")
  const w = (s) => writeSync(fd, s)
  try {
    w("{")
    let first = true
    for (const [k, v] of Object.entries(fields)) {
      const encoded = v === undefined ? undefined : JSON.stringify(v)
      if (encoded === undefined) continue // JSON.stringify 语义：undefined 字段省略（不产非法 JSON）
      if (!first) w(",")
      first = false
      w(JSON.stringify(k) + ":" + encoded)
    }
    if (!first) w(",")
    w(`${JSON.stringify("history")}:[`)
    let wrote = false
    for (let s = 1; s <= store._segCount; s++) {
      let lines
      try { lines = readSegmentLines(join(store.dir, segName(s))) } catch { lines = [] }
      for (const line of lines) {
        // 半行容忍（§6.14——读路径逐行容错）：崩溃在 append 中途留下的末尾半行/损坏行
        // 不得拼进投影——否则槽 JSON 变成非法 JSON（下次 loadSlotFile 整体读不出）。
        if (line === "" || tryParse(line) === undefined) continue
        if (wrote) w(",")
        wrote = true
        w(line)
      }
    }
    w("]")
    w("," + JSON.stringify("contextHistory") + ":" + JSON.stringify(contextHistory ?? []))
    w("}")
  } finally {
    try { closeSync(fd) } catch { /* ignore */ }
  }
  try {
    renameSync(tmp, p)
  } catch {
    try { unlinkSync(p) } catch { /* missing is fine */ }
    try {
      renameSync(tmp, p)
      try { unlinkSync(tmp) } catch { /* ignore */ }
    } catch {
      writeFileSync(p, readFileSync(tmp, "utf8"), "utf8")
    }
  }
  return true
}
