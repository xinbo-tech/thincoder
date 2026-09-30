/**
 * chat-digest-seat.mjs — 对话流消化行族**构树件 + 座次 ∕ 位次面**出档（归位批 · #738 —— 台账 #738 拆分预案执行：
 * `views/chat-digest.mjs` 贴 300 层，位次面（位次四件 ∥ 对位算法）续拆；构树件（行集 ∥ 行文）与
 * **行集同步 `syncRound`** 随迁 —— 落位建元素与行集同步同族（位次落位须建元素），本档单向无环）。
 * 编年：structure-split-2 批 · 台账 #651（自 `views/chat-chrome.mjs` 逐字迁出）；流内落位批 · 台账 #706
 * （当轮元素 · 流内就地）；留档批 · 台账 #719（位次面）；归位批 · 台账 #738（行集随 `status`；修复轮：
 * 位次面窗守卫：窗下界 = 首枚已标块 ∥ 未标块不作锚 ∥ 无合格锚 ⇒ 尾组锚——行恒居原位零漂）；
 * **三端消化面统一批 · #747**（行族形态收正 = 对位 VSC 实形）：**无轮容器**——行元素 = 流内并列兄弟
 * （逐行直挂、不做每轮包裹元素；`chat-status.js:72-89`）∥ 标签行**恒在**（终态不撤；`chat-status.js:79`）
 * ∥ **cap 行 = 尾追形**（cap 帧到达即随流尾追；`chat-status.js:97-105`）∥ 行族**逐轮累积**（零摘除）；
 * 行族身份面 = **`_digestRid`**（运行期轮——轮序标）/ **`_digestAt`**（重建轮——记录位次）；**座次**`seat`
 * （= 起跑水位 —— 起跑帧当刻流末〔= 起跑时已有块数〕）住**轮记录**（归档块入模锚 ∥ 行族落位锚两读面）。
 * 导出面：构树 `digestRows`（单轮行集 —— 行序 = 标签行 → 计数行 → cap 行）+ 行集同步 `syncRound`（按行族对位 —— 标签行恒在
 * 就地换文 ∥ `n > 0` 计数行 ∥ cap 行）+ 位次面四件 `adoptDigestRounds`（建树径采纳）· `shownDigestRounds`
 * （在区轮集单源）· `pendingDigestSeats`（缺位轮集）· `seatDigestRounds`（帧尾 ④′ 位次落位）+ 对位件 `roundAt`
 * ∥ `roundSeat` ∥ `roundRid` ∥ `nodeAt` ∥ `nodeRid` ∥ `buildRows`；**座次面（帧尾 ④′ 落位）住 `views/chat-digest.mjs`**
 * （`seatLiveRounds`——运行期轮行族居其座次；两档分工：本档记标 ∥ 并档落位）。
 * 落位 = **流内就地**；**重建 ∕ 回填 = 按记录位次复列**（留档批 · #719 —— 轮位次 `at` = 起跑记录全局 `idx`；
 * 在场面 = 记录位次落于已渲染块区 —— 随窗；单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）。
 * 记账标（帧层记账 ∥ 行族身份面）：行元素 `_digestRid`（运行期轮轮序标）∥ `_digestAt`（重建轮位次标）；
 * 轮记录 `seat`（座次水位——#747）∥ `rid`（轮序标）∥ `boundary`（边界——归档落位锚；`ev:susp` 收帧清）。
 * 依赖单向：本档 → `../dom.mjs` ∥ `../i18n.mjs`；`views/chat-digest.mjs` → 本档（引调；反向零 import ⇒ 无环）。
 * 单源 = `thincoder-vscode/webview/chat-status.js:69-122`（词面 ∕ 状态分档 ∕ 行序 ∥ 零删除）。
 */
import { build, text } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 计数读数归一（`n` / `ms` 非数 ⇒ 0 —— 沿归约面 `countOf` 同判；零抛）。 */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 起跑标签行文（两档 —— 单源 = 核字典 `digest.*`：`tier === "ask"` ⇒ `digest.turnLabelAsk` 携 `from` / `msg`；
 *  余 ⇒ `digest.turnLabel`；缺参回落 `?` / `…` —— 沿 VSC `chat-status.js:74-78` 同式；终态不换词）。 */
function digestLabel(round) {
  return round.tier === "ask"
    ? t("digest.turnLabelAsk", { from: round.from ?? "?", msg: round.msg ?? "…" })
    : t("digest.turnLabel")
}

/** 计数行文（起跑态 —— 核字典 `digest.start`；`n` = 起跑 pending 数）。 */
function digestCount(round) {
  return t("digest.start", { n: countOf(round.n) })
}

/** 计数行文（状态分档 —— 单源）：起跑 ∕ cap ⇒ `digest.start`；`end` ⇒ `digest.done` 携 `n` ∕ `seconds`
 *  ∥ `digest.aborted` 携 `seconds`（`ok === false`）—— 沿 VSC `chat-status.js:112-120` 同判。 */
function countRowText(round) {
  if (round.status !== "end") return digestCount(round)
  const seconds = (countOf(round.ms) / 1000).toFixed(1)
  return round.ok === false ? t("digest.aborted", { seconds }) : t("digest.done", { n: countOf(round.n), seconds })
}

/** 计数行 class（状态分档）：`end` 两态（失败 ⇒ `digest-failed` ∕ 完成 ⇒ `digest-done`）；起跑 ∕ cap ⇒ 基类。 */
function countRowClass(round) {
  if (round.status !== "end") return "digest-status"
  return round.ok === false ? "digest-status digest-failed" : "digest-status digest-done"
}

/** 撞帽行文（两档 —— 核字典 `digest.capStop` ∕ `digest.capAuto` 直取，零新键；`turns` 缺 ⇒ `?`）—— 对位 VSC `:99-102`。 */
function capText(cap) {
  return cap.mode === "stop" ? t("digest.capStop", { turns: cap.turns ?? "?" }) : t("digest.capAuto")
}

/** cap 行 class（单源：`mode === "stop"` ⇒ 并 `.digest-cap-stop`）。 */
function capRowClass(cap) {
  return cap.mode === "stop" ? "digest-cap digest-cap-stop" : "digest-cap"
}

/** 起跑标签行（**恒在** —— 终态不撤；行序首位；对位 VSC `chat-status.js:79`）。 */
function digestLabelRow(round) {
  return { tag: "div", props: { class: "chat-digest digest-turn", "data-digest": "", "data-digest-label": "" }, children: [digestLabel(round)] }
}

/** 计数行（**在场 ⟺ `n > 0`** —— 文 ∕ class 单源；`n = 0` 轮零此行——幻影行禁出）。 */
function digestCountRow(round) {
  return { tag: "div", props: { class: `chat-digest ${countRowClass(round)}`, "data-digest": "", "data-digest-count": "" }, children: [countRowText(round)] }
}

/** cap 行（#541 —— **尾追形**：cap 帧到达即随流尾追〔挂于本轮元素族末位〕；锚 `data-digest-cap`）。 */
function digestCapRow(cap) {
  return { tag: "div", props: { class: `chat-digest ${capRowClass(cap)}`, "data-digest": "", "data-digest-cap": "" }, children: [capText(cap)] }
}

/** 单轮行集（行序 = 起跑标签行 → `n > 0` 计数行 → cap 行）——**行元素 = 流内并列兄弟**（无轮容器：
 *  逐行直挂、不做每轮包裹元素；对位 VSC `chat-status.js:72-89` 逐行 `appendChild`）。标签行恒在；
 *  `n = 0` 轮零计数行；cap 行在场 ⟺ 轮 `cap` 在场（跨 `end` 存续 —— #541）。 */
export function digestRows(round) {
  const rows = [digestLabelRow(round)]
  if (countOf(round.n) > 0) rows.push(digestCountRow(round))
  if (round.cap != null) rows.push(digestCapRow(round.cap))
  return rows
}

// ─── 身份面（位次 ∥ 座次 ∥ 轮序 —— 行族对位读面）────────────────────────────

/** 轮位次（起跑记录全局 `idx` —— 页读折叠所携；运行期轮 ∥ 形不合 ⇒ `null`）。 */
export function roundAt(round) {
  return typeof round?.at === "number" && Number.isFinite(round.at) ? round.at : null
}

/** 轮座次（**起跑水位** = 起跑帧当刻流末〔= 起跑时已有块数〕—— 归约面 `onDigest` 写下；形不合 ⇒ `null`）。
 *  两读面 = 归档块入模锚（`renderer/subagent-reduce.mjs`）∥ 行族落位锚（`views/chat-digest.mjs` `seatLiveRounds`）。 */
export function roundSeat(round) {
  return typeof round?.seat === "number" && Number.isFinite(round.seat) ? round.seat : null
}

/** 轮序标（运行期轮唯一标 —— 行族身份面；重建轮 ∥ 形不合 ⇒ `null`）。 */
export function roundRid(round) {
  return typeof round?.rid === "number" && Number.isFinite(round.rid) ? round.rid : null
}

/** 轮终态位次（重建轮 —— 终态记录全局 `idx`；消费轮配对读面 = `views/chat-tree.mjs`；运行期轮 ∥ 形不合 ⇒ `null`）。 */
export function roundEndAt(round) {
  return typeof round?.endAt === "number" && Number.isFinite(round.endAt) ? round.endAt : null
}

/** 行元素位次读面（`_digestAt` —— 重建轮；运行期行 ⇒ `null`）。 */
export function nodeAt(node) {
  return typeof node?._digestAt === "number" && Number.isFinite(node._digestAt) ? node._digestAt : null
}

/** 行元素轮序读面（`_digestRid` —— 运行期轮；重建行 ⇒ `null`）。 */
export function nodeRid(node) {
  return typeof node?._digestRid === "number" && Number.isFinite(node._digestRid) ? node._digestRid : null
}

/** 行族身份键（行 ∥ 轮同式）：位次轮 ⇒ `at:<n>` ∥ 运行期轮 ⇒ `rid:<n>` ∥ 无形 ⇒ `null`。 */
export function familyKeyOf(round) {
  const at = roundAt(round)
  if (at !== null) return `at:${at}`
  const rid = roundRid(round)
  return rid === null ? null : `rid:${rid}`
}

/** 行元素身份键（同式 —— 两标互斥）。 */
export function nodeFamilyKey(node) {
  const at = nodeAt(node)
  if (at !== null) return `at:${at}`
  const rid = nodeRid(node)
  return rid === null ? null : `rid:${rid}`
}

/** 已渲染块区下界 = **首枚已标块**位次（修复轮 · #738）——原「首块位次」在长会话窗（首块未标：
 *  运行期块）下读空 ⇒ 出窗折叠轮不被过滤而落位流首（真机 #738）；未标块位次未知 ⇒ 不作下界读面。
 *  零已标块 ⇒ `null`（下界未知 —— 零信息零动作）。 */
function floorOf(model) {
  const blocks = Array.isArray(model?.blocks) ? model.blocks : []
  for (const block of blocks) {
    if (typeof block?.at === "number" && Number.isFinite(block.at)) return block.at
  }
  return null
}

/** 在区轮集（**记录位次复列单源** —— 构树 ∥ 采纳 ∥ 帧刷 ∥ 落位四径同引）：位次轮 ⇒ 位次落于已渲染块区
 *  （`at ≥ 下界`——随窗；下界 = 首枚已标块位次，修复轮 · #738）；运行期轮（无位次）⇒ 恒在场；下界未知 ⇒
 *  位次轮不退场（零信息零动作）。 */
export function shownDigestRounds(model) {
  const rounds = Array.isArray(model?.digest) ? model.digest : []
  const floor = floorOf(model)
  return rounds.filter((round) => {
    const at = roundAt(round)
    return at === null || floor === null || at >= floor
  })
}

/** 建行（**唯一构造点** —— 建元素即记标：位次 ∥ 轮序 = 帧层记账零新 DOM 属性）。 */
export function buildRows(round) {
  const at = roundAt(round)
  const rid = at === null ? roundRid(round) : null
  return digestRows(round).map((row) => {
    const node = build(row)
    node._digestAt = at
    node._digestRid = rid
    return node
  })
}

/** 建树径采纳（`renderer/views/chat.mjs` `mountChat` 引调）：树按模型序产出**行元素**（每轮一至三行）⇒
 *  文档序 ↔ 在区轮集逐轮按下行数记标（缺位 ∕ 多余 ⇒ 不硬塞 —— 帧刷随后对位；两标 = 对位判据面）。 */
export function adoptDigestRounds(root, model) {
  if (!root || typeof root.querySelectorAll !== "function") return
  const nodes = [...root.querySelectorAll("[data-digest]")]
  let cursor = 0
  for (const round of shownDigestRounds(model)) {
    const rows = digestRows(round)
    for (let index = 0; index < rows.length; index += 1) {
      const node = nodes[cursor]
      cursor += 1
      if (node === undefined) return
      node._digestAt = roundAt(round)
      node._digestRid = roundAt(round) === null ? roundRid(round) : null
    }
  }
}

// ─── 位次面（留档批 · #719 —— 记录位次 ∥ 在区判据 ∥ 落位两径）────────────

/** 缺位轮集（在区位次轮 —— 已挂行元素记账标缺该位次 ⇒ 待落位；帧尾读数预判 ∥ 落位两径**同判据**；
 *  低于窗下界者已由 `shownDigestRounds` 滤除（零插入）。 */
export function pendingDigestSeats(root, model) {
  if (!root || typeof root.querySelectorAll !== "function") return []
  const marked = new Set()
  for (const node of root.querySelectorAll("[data-digest]")) {
    const at = nodeAt(node)
    if (at !== null) marked.add(at)
  }
  return shownDigestRounds(model).filter((round) => {
    const at = roundAt(round)
    return at !== null && !marked.has(at)
  })
}

/** 位次锚（文档序首枚「位次更大的**已标**块节点」）——修复轮 · #738：**未标块不作锚**（运行期块位次
 *  未知——不落其前；原「未标 ⇒ 位次 +∞」在长会话窗把座位漂到中段）；无合格锚 ⇒ `null`（调用面回落尾组锚）。
 *  节点位次读面 = `_blockAt`（帧层记账 —— 宿主建块两径写下）。 */
function positionAnchor(root, at) {
  for (const node of root.querySelectorAll("[data-block-kind]")) {
    const bat = typeof node._blockAt === "number" && Number.isFinite(node._blockAt) ? node._blockAt : null
    if (bat === null) continue
    if (bat > at) return node
  }
  return null
}

/** 帧尾落位（④′ 步 —— **块挂载后**）：在区缺位轮按记录位次插入**行元素**（插点 = 位次锚 ∥ 无合格锚 ⇒ 尾组锚
 *  `anchor`——与「`start` 帧落流末」同序；修复轮 · #738）；返回落位数（= `pendingDigestSeats(...).length`
 *  —— 两径同判据）。 */
export function seatDigestRounds(root, model, anchor = null) {
  if (!root || typeof root.querySelectorAll !== "function") return 0
  let seated = 0
  for (const round of pendingDigestSeats(root, model)) {
    const target = positionAnchor(root, roundAt(round)) ?? anchor
    for (const row of buildRows(round)) {
      if (typeof root.insertBefore === "function") root.insertBefore(row, target)
      else root.append(row)
    }
    seated += 1
  }
  return seated
}

// ─── 行集同步（按行族对位 —— 标签行恒在；#747）────────────────────────────────

/** 行集同步（**按行族对位**）：标签行**恒在 ⇒ 就地换文**（终态不撤——对位 VSC `chat-status.js:110-121`
 *  唯计数元素原地换文）；`n > 0` 计数行就地刷文 ∕ class，族内缺 ⇒ 标签行后就位补建；cap 行在场 ⇒ 就地刷，
 *  缺 ∧ 轮携 `cap` ⇒ 于**流末**（`anchor`）尾追补建（#541）。逐行等价 ⇒ 零写（帧刷幂等）。 */
export function syncRound(root, family, round, anchor = null) {
  const find = (name) => family.find((node) => typeof node.getAttribute === "function" && node.getAttribute(`data-digest-${name}`) !== null) ?? null
  const label = find("label")
  if (label !== null && label.textContent !== digestLabel(round)) text(label, digestLabel(round))
  const count = find("count")
  if (countOf(round.n) > 0) {
    if (count === null) {
      const fresh = build(digestCountRow(round))
      if (label !== null && typeof root?.insertBefore === "function") root.insertBefore(fresh, label.nextSibling)
      else root?.append?.(fresh)
    } else {
      if (count.textContent !== countRowText(round)) text(count, countRowText(round))
      const want = `chat-digest ${countRowClass(round)}`
      if (count.getAttribute("class") !== want) count.setAttribute("class", want)
    }
  }
  const cap = find("cap")
  if (round.cap == null) return
  if (cap === null) {
    const fresh = build(digestCapRow(round.cap))
    if (typeof root?.insertBefore === "function") root.insertBefore(fresh, anchor)
    else root?.append?.(fresh)
    return
  }
  if (cap.textContent !== capText(round.cap)) text(cap, capText(round.cap))
  const want = `chat-digest ${capRowClass(round.cap)}`
  if (cap.getAttribute("class") !== want) cap.setAttribute("class", want)
}
