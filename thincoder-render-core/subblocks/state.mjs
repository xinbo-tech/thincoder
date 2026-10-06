/**
 * state.mjs — 子代理块态机（核化 `webview/activity.js` 的**迁移判据**——判定表 §3 行 4「拆」；
 * 设计 §5「状态机族」`subBlocksReduce(list, patch)`——出生 / 终态折叠 / 归档三迁 + 全族补迁）。
 * **零 DOM 零宿主**（平 node 直测——核包用例「态机层」）。
 *
 * 拆面 = 出生（ensureBlock——**内容 chunk 出生闸**：`ensureSubBlock`）/ 新代接管（takeoverBlock）/
 * 冻结（freezeBlock）/ 归档（archiveBlock）四迁判据 + 终态补桩表 + 旧代回收吞守卫 + 排队信息 /
 * 逐轮帧 / 审批态写点。**判据族**（键文法 / 身份键集 / 终态 kind / 补桩表 / 补桩前置）住
 * `channel.mjs`——本档只住迁移面（档位纪律）。
 * 留端 = 出生位（活动区 `#subagent-activity` 区尾 append）/ 归档入流（`#messages` 边界插或尾追）/
 * DOM 属性效果（class 翻转 / `open=false` / ⏹ 移除）/ 痕迹（端观测面——桌面接线已兑现（2026-10-06 · #978——见下「痕迹钩分面」终句）；
 * VSC = `activity-diag.js`）/ 2s 定时刷新（`refreshLiveHeaders`）/ 端复位面（VSC `resetActivity` ∕ 桌面 `resetSubBlocks`）。
 *
 * 模型（`list` 元素——端持有；DOM 块由端按 `key` 映射）：
 *   { key, label, role, id, model, startedAt, pool, syncLive, turn, maxTurns, status, stateWord,
 *     doneAt, frozen, error, note, queued, queueInfo, awaitingDigest, approval, oldReclaimPending }
 * 端维护事实（经 deps 访问器注入）：`connectedOf(model)`（DOM 在连 ⇒ 非 tombstone；缺省视为在连）·
 * `regionOf(model)`（`"activity"` = 驻活动区——仅 `subBlocksFreezeAll` 读）。
 *
 * 效果表（有序——端逐条执行；无 DOM 动作的丢弃 / 正收据只走 `deps.trace`，不入表）：
 *   `{type:"born", key}`        建块 + 出生位 append（新模型已在 list）
 *   `{type:"takeover", key}`   建新块改绑键（旧块若在 awaitingDigest，归档动作 = 前一条 archive 效果）
 *   `{type:"fold", key, kind}`  终态折叠：class sub-live→sub-frozen + `open=false` + ⏹ 移除 + 刷新
 *   `{type:"awaiting", key}`    settled 驻留：`awaitingDigest=true`（态词 `sub.awaitingDigest`）+ 刷新
 *   `{type:"archive", key, atBoundary, clearAwaiting}` 归档入流：`atBoundary` 真 ⇒ 边界前插入（`S._digestBoundary` 由端判在连），否则尾追；`clearAwaiting` 真 ⇒ 端清尾后刷新
 *   `{type:"remove", key}`      queued 取消：端移除块 + 簿记删除（模型已出 list）
 *   `{type:"refresh", key}`     仅头词 / 态词重刷
 *
 * 执行序约定：端须**按序逐条**执行效果，且 `key → DOM` 于**该条执行时**解析（接管路径的
 * archive 指旧块、紧随的 takeover 建新块——先归档后改绑，与源档 `archiveBlock(old)` → `set` 同序）。
 *
 * 端接线注意（R2b / R3b）：`subBlocksReduce` / `ensureSubBlock` / `subBlocksFreezeAll` 的墓碑与
 * 归档面读 `deps.connectedOf` / `deps.regionOf`——**VSC（DOM 面）须注入**（DOM 事实在端）；
 * 桌面（无 DOM）可不注入（模型无 `connected` / `region` 字段 ⇒ 缺省视为在连 / 非区驻）。
 *
 * 痕迹钩分面（once / always——源档 `traceSub` vs `traceSubOnce`，成文于此）：`reassert-hit` /
 * `drop-tombstone` 走**去重版**（`traceSubOnce`）；`birth` / `takeover` / `drop-frozen` /
 * `drop-unknown-role` / `late-terminal-stub` 走 `traceSub`。内容面 chunk 丢弃痕在端
 * （`renderSubagentChunk` 调用侧）——同为去重版（源档 `streaming.js:251-252`）。**桌面接线（#608①② · 2026-09-29）——痕迹 = 端观测面——桌面无上行面 ⇒ 不接（给由）——已兑现（2026-10-06 · #978）**：`subagent-reduce.mjs` deps 收 `trace`（`:189-194`——丢径零静默；原「deps 仅 `{ now }`」括注随兑现退场）。
 */

// 判据族（parseChannel / findBlockNames / terminalKindOf / terminalStubKind / stubAllowed）住
// `channel.mjs`（档位纪律：本档只住迁移面）；迁移面内部用之。
import { parseChannel, findBlockNames, terminalKindOf, terminalStubKind, stubAllowed } from "./channel.mjs"

/** 冻结迁移判据（逐字承 `freezeBlock:197-210` 的 meta 面——class / open / ⏹ 移除 = 端 fold 效果）。 */
function freezeMeta(meta, kind, now, note) {
  meta.status = kind === "stopped" ? "cancelled" : kind === "error" ? "error" : "done"
  meta.frozen = true
  meta.doneAt = meta.doneAt ?? now()
  meta.approval = null // §18 C-8：终态清审批态（头词不悬空）
  if (note != null) meta.note = String(note)
}

/** 在连判据读取（缺省 = 模型字段约定 `connected !== false`；R2b 的 VSC 侧须注入
 *  `connectedOf`——DOM 面墓碑 / 存活事实在端，模型字段不自动随动）。 */
const connOf = (deps) => deps.connectedOf ?? ((b) => b.connected !== false)

/** 建块模型（逐字承 `buildBlock:75-96` 的 meta 基座——label 取频道解析；不入 list/不发效果）。 */
function buildModel(key, deps) {
  const ch = parseChannel(key)
  return {
    key: ch.channel, label: ch.label, role: ch.role, id: ch.id, model: ch.model,
    startedAt: (deps.now ?? Date.now)(), pool: null,
    turn: null, maxTurns: 0, status: "running", stateWord: null,
    doneAt: null, frozen: false, error: null, queued: false,
    queueInfo: null, awaitingDigest: false,
    // X6/X11：块头注记（`— <note>`——turn-cap / stopped-by-user / interrupted 共用**单一载体**，
    // 禁第二注记字段）；X10：sync 可中止事实（⏹ 门控支基底——与 async `pool` 并列）。
    note: null, syncLive: false,
    // §18 C-8（child permission gate）：child ask 审批态（tool 名 ≤40 or null；块头 ⏸ + 态词）
    approval: null,
  }
}

/**
 * 块态机主入口：把一条状态 patch 应用到模型列表。
 *
 * `patch` 形态 = `applySubagentStatus` 全族（`status` ∈ queued / started / turn / cancelled /
 * done / settled / error / answered / terminated / failed）+ 审批态（`status:"approval"`,
 * `tool`）。`deps = { connectedOf?, now?, trace? }`——`trace(name, key)` = 痕迹钩（端绑
 * `activity-diag` 的 `traceSub` / `traceSubOnce`；name ∈ birth / takeover / reassert-hit /
 * drop-tombstone / drop-frozen / drop-unknown-role / late-terminal-stub）。
 * 返回 `{ list, effects }`（list 原地；effects 有序）。
 */
export function subBlocksReduce(list, patch, deps = {}) {
  const m = patch ?? {}
  const effects = []
  const now = deps.now ?? Date.now
  const connected = connOf(deps)
  const trace = deps.trace ?? (() => {})
  const refresh = (b) => effects.push({ type: "refresh", key: b.key })
  const archive = (b, atBoundary = false) => {
    const clearAwaiting = b.awaitingDigest === true
    if (clearAwaiting) b.awaitingDigest = false
    effects.push({ type: "archive", key: b.key, atBoundary, clearAwaiting })
  }
  const names = (p) => findBlockNames(list, p.role, p.id, p.model, p.sessionId)

  /** 出生闸（§5.3——出生事件 = queued / started；不限角色族、不限 pool）：无条目 ⇒ 新建
   *  （`birth` 痕）；已冻结 ⇒ 接管建新代（`takeover` 痕）；live ⇒ 复用（`reassert-hit` 正收据）；
   *  tombstone ⇒ 丢弃 + `drop-tombstone` 痕。role / id 非法 ⇒ null（不可建）。 */
  const enterBlock = (p) => {
    if (p?.role == null || p?.id == null) return null
    const key = `sub:${p.role}#${p.id}`
    const ch = parseChannel(key)
    if (ch.role == null || ch.id == null) return null
    const existing = list.find((b) => b.key === key)
    if (!existing) {
      const block = buildModel(key, deps)
      list.push(block)
      effects.push({ type: "born", key })
      trace("birth", key)
      return block
    }
    if (existing.frozen) return takeoverBlock(key)
    if (connected(existing) === false) { trace("drop-tombstone", key); return null }
    trace("reassert-hit", key)
    return existing
  }

  /** 新代接管（§5.1.4 第 5 条）：旧 awaitingDigest 块（回收在途）即时归档（§14 C-5③）+
   *  新块 `oldReclaimPending` 吞守卫（其后该键首条 `done` 视为旧代回收吞掉）。 */
  const takeoverBlock = (key) => {
    const oldIdx = list.findIndex((b) => b.key === key)
    const old = oldIdx >= 0 ? list[oldIdx] : null
    const reclaimPending = old?.awaitingDigest === true
    if (reclaimPending) archive(old, false) // 旧 awaitingDigest 块即时归档（§14 C-5③）——先归档后改绑
    const block = buildModel(key, deps)
    if (reclaimPending) block.oldReclaimPending = true
    if (oldIdx >= 0) list.splice(oldIdx, 1, block)
    else list.push(block)
    effects.push({ type: "takeover", key })
    deps.onChannelReset?.(key) // 生命周期边界：丢弃 / 命中面重新计首条（端 clearSubTraceChannel）
    trace("takeover", key)
    return block
  }

  if (m.status === "queued") {
    const block = enterBlock(m) // 出生闸（§5.3——`queued` 亦出生事件）
    if (!block) return { list, effects } // 不可建（role/id 非法）/ tombstone——丢弃
    block.status = "queued"
    block.queued = true
    // C-11②/#118：排队信息入**块级活态载体**（`queueInfo`——两条刷新路径共读，无回落通道）——
    // `kind` 判词（slot ⇒ 槽满词 / 否则 reason 原文）/ `reason` 文本 / `position` / `waiting` 对位字段。
    block.queueInfo = { kind: m.kind ?? null, position: m.position ?? null, waiting: m.waiting ?? null, reason: m.reason ?? null }
    refresh(block)
    return { list, effects }
  }

  if (m.status === "turn") {
    // C-11③ 逐轮进展帧（onAgentTurn → status:"turn"）：区头 turn N/M 实时
    for (const name of names(m)) {
      const block = list.find((b) => b.key === name)
      if (!block) continue
      // ⑦ 非出生面禁静默（§5.3）：冻结 / 墓碑键吞掉的 turn 帧 ⇒ 丢弃 + 痕（状态面逐条）。
      if (block.frozen) { trace("drop-frozen", name); continue }
      if (connected(block) === false) { trace("drop-tombstone", name); continue }
      if (m.turn != null) block.turn = m.turn
      if (m.maxTurns != null) block.maxTurns = m.maxTurns
      refresh(block)
    }
    return { list, effects }
  }

  if (m.status === "started") {
    // 出生面 = 存活闸（§5.3）：出生事件即建块 / 接管，不限角色族 / `pool`。
    enterBlock(m)
    for (const name of names(m)) {
      const block = list.find((b) => b.key === name)
      // 冻结块不收 started——不半复活（与终态分支同形）
      if (!block || block.frozen) continue
      block.status = "running"
      block.stateWord = null // stateWord 写点③：queued 头残留等待标注清掉（转 running——由 chunk 状态词接管）
      block.queued = false
      block.queueInfo = null // C-11②：started 后清排队信息
      // pool 标记语义: async 池条目 started 携 pool:true；同步 spawn 不带 → false。
      block.pool = m.pool === true
      // X10（§2.10.5 #4）：sync 可中止事实（宿主只读核 registry 判定——载荷缺省/false ⇒ 零门控支）。
      block.syncLive = m.syncLive === true
      if (m.startedAt) block.startedAt = m.startedAt
      if (m.model) block.model = m.model
      if (m.maxTurns != null) block.maxTurns = m.maxTurns
      if (m.turn != null) block.turn = m.turn
      refresh(block)
    }
    return { list, effects }
  }

  if (m.status === "approval") {
    // §18 C-8（child permission gate）：tool 非空 = 等待审批 / null = 清态；无块 child 不因审批
    // 事件出生（绝不建块）；冻结 / 未知 ⇒ 丢弃（幂等守卫同族）。
    if (m.role == null || m.id == null) return { list, effects }
    for (const name of names(m)) {
      const block = list.find((b) => b.key === name)
      if (!block || block.frozen) continue
      block.approval = m.tool ? String(m.tool).slice(0, 40) : null
      refresh(block)
    }
    return { list, effects }
  }

  if (m.status === "cancelled" && m.was === "queued") {
    // §20 D-SD3b: queued 取消（从未启动——无冻结）→ 等待块头移除（不冻结）。
    for (const name of names(m)) {
      const block = list.find((b) => b.key === name)
      if (block && !block.frozen && block.status === "queued") {
        list.splice(list.indexOf(block), 1)
        effects.push({ type: "remove", key: name })
      }
    }
    return { list, effects }
  }

  // Terminal statuses → 原地折叠（终态集合闭合——settled 视同 done 但驻留待回收）。
  const kind = terminalKindOf(m.status)
  if (kind === null) return { list, effects }

  // 旧代回收吞守卫（C-5③）：该键首条 done = 旧代回收（新块 live/awaiting 均不触）→ 吞。
  if (m.status === "done") {
    for (const name of names(m)) {
      const block = list.find((b) => b.key === name)
      if (block?.oldReclaimPending) {
        block.oldReclaimPending = false
        return { list, effects }
      }
    }
  }

  let hasEntry = false
  for (const name of names(m)) {
    const block = list.find((b) => b.key === name)
    if (!block) continue
    if (connected(block) === false) continue // live tombstone ⇒ 条目不可用、走补桩（F-A2 判据扩）
    hasEntry = true // 有可用条目者不受补桩表影响
    if (block.frozen) {
      // 消化回收（C-1③/C-3①）：awaitingDigest 收 done → 归档（轮边界前）；其余终态 ⇒ 丢弃 + 痕（⑦）
      if (m.status === "done" && block.awaitingDigest) archive(block, true)
      else trace("drop-frozen", name)
      continue
    }
    if (kind === "error" && m.error) block.error = m.error
    // X6（§2.2）：注记入块级活态载体（与 X11 共用——两条刷新路径共读，无回落通道）。
    if (m.note != null) block.note = String(m.note)
    if (m.maxTurns != null) block.maxTurns = m.maxTurns
    if (m.turn != null) block.turn = m.turn
    freezeMeta(block, kind, now)
    effects.push({ type: "fold", key: name, kind })
    if (m.status === "settled") {
      block.awaitingDigest = true // C-2：驻留待回收（头词加 awaiting 态词）
      effects.push({ type: "awaiting", key: name })
    } else {
      archive(block, false) // C-3 ②：即时归档（尾追）
    }
  }
  // 终态补块（never-born / tombstone 终态防御——§5.3「终态必现」）：无可用块条目 → 按表补桩；
  // 前置不满足 → no-op + `drop-unknown-role`（answered / queued-cancel 为表内不补行——不补痕）。
  if (!hasEntry) {
    const stubKind = terminalStubKind(m)
    if (stubKind === null) return { list, effects }
    if (!stubAllowed(m)) {
      trace("drop-unknown-role", m.role == null || m.id == null ? "(unidentified)" : `sub:${m.role}#${m.id}`)
      return { list, effects }
    }
    const key = `sub:${m.role}#${m.id}`
    const block = buildModel(key, deps)
    if (stubKind === "error" && m.error) block.error = m.error
    if (m.note != null) block.note = String(m.note)
    if (m.maxTurns != null) block.maxTurns = m.maxTurns
    if (m.turn != null) block.turn = m.turn
    // 入册同出生路径（后续消息走幂等守卫）；tombstone 条目就地顶替（源档 Map.set 同语义——绝不同键两条）
    const existingIdx = list.findIndex((b) => b.key === key)
    if (existingIdx >= 0) list.splice(existingIdx, 1, block)
    else list.push(block)
    effects.push({ type: "born", key })
    freezeMeta(block, stubKind, now)
    effects.push({ type: "fold", key, kind: stubKind })
    archive(block, false) // 补桩 = 折叠 + 立即归档（§14 C-5②）
    trace("late-terminal-stub", key)
  }
  return { list, effects }
}

/**
 * 会话退出 freeze 兜底（逐字承 `activity.js:430-436` `freezeLiveBlocks`——suspension
 * active:false + freeze:true）：区全体归档——live → 折叠；awaitingDigest / 已在流者按
 * `regionOf` 判（驻活动区 ⇒ 归档；已在流者不动）。`deps.interrupted` 真 ⇒ 未冻结块补
 * `— interrupted` 注记（X11——与 X6 同载体）；已冻结（含 awaitingDigest）块不回头改写。
 */
export function subBlocksFreezeAll(list, deps = {}) {
  const effects = []
  const now = deps.now ?? Date.now
  const regionOf = deps.regionOf ?? ((b) => b.region)
  for (const block of [...(list ?? [])]) {
    if (!block) continue
    if (!block.frozen) {
      freezeMeta(block, "done", now, deps.interrupted === true ? "interrupted" : undefined)
      effects.push({ type: "fold", key: block.key, kind: "done" })
    }
    if (regionOf(block) === "activity") {
      const clearAwaiting = block.awaitingDigest === true
      if (clearAwaiting) block.awaitingDigest = false
      effects.push({ type: "archive", key: block.key, atBoundary: false, clearAwaiting })
    }
  }
  return { list, effects }
}

/**
 * 出生闸（**内容 chunk 出生路径**——逐字承 `activity.js:146-158` `ensureBlock`）：无键 ⇒ 建块
 * （`birth` 痕 + `born` 效果）；已终态（frozen）或墓碑（在连假）⇒ `{ block: null }`（幂等守卫
 * ——迟来内容绝不复活重建）；live ⇒ 复用（不重挂 / 不刷新）。
 * **与 `subBlocksReduce` 出生闸（`enterBlock`）判据不同**：后者对冻结键走**接管**（新代），
 * 本闸对冻结键返 null（内容面迟到 chunk 不得半复活）——源档同形（`ensureBlock:151` vs
 * `enterBlock:170`）。本闸也是**唯一**能建 `sub:consult <model> #<id>` 形态键的出生路径。
 * 返回 `{ block, effects }`（`block` null = 丢弃；`effects` 含 `born`）。
 */
export function ensureSubBlock(list, key, deps = {}) {
  const effects = []
  const existing = list.find((b) => b.key === key)
  if (existing) {
    if (existing.frozen || connOf(deps)(existing) === false) return { block: null, effects }
    return { block: existing, effects }
  }
  const block = buildModel(key, deps)
  list.push(block)
  effects.push({ type: "born", key })
  ;(deps.trace ?? (() => {}))("birth", key)
  return { block, effects }
}
