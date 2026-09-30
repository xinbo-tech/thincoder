/**
 * chat-digest-seat.mjs — 对话流消化行族**构树件 + 位次面**出档（归位批 · #738 —— 台账 #738 拆分预案执行：
 * `views/chat-digest.mjs` 贴 300 层，位次面（位次四件 ∥ 对位算法）续拆；构树件（行集 ∥ 轮元素 ∥ 行文）与
 * **行集同步 `syncRound`** 随迁 —— 落位建元素与行集同步同族（位次落位须建元素），本档单向无环）。
 * 编年：structure-split-2 批 · 台账 #651（自 `views/chat-chrome.mjs` 逐字迁出）；流内落位批 · 台账 #706
 * （当轮元素 · 流内就地）；留档批 · 台账 #719（位次面）；归位批 · 台账 #738（行集随 `status`：终态非 ask
 * 标签行退场；ask 档终态保留）。
 * 导出面：构树 `digestRoundNode`（单轮元素 —— 行集随 `status`）+ 行集同步 `syncRound`（按轮元素定位行族 ——
 * 标签行可增删）∥ 位次面四件 `adoptDigestRounds`（建树径采纳）· `shownDigestRounds`（在区轮集单源）·
 * `pendingDigestSeats`（缺位轮集）· `seatDigestRounds`（帧尾 ④′ 落位）+ 对位件 `roundAt` ∥ `nodeAt` ∥ `buildRound`。
 * 落位 = **流内就地**；**重建 ∕ 回填 = 按记录位次复列**（留档批 · #719 —— 轮位次 `at` = 起跑记录全局 `idx`；
 * 在场面 = 记录位次落于已渲染块区 —— 随窗；单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）。
 * 记账标：轮元素 `_digestAt`（所属轮位次）∥ `_digestStatus`（已表轮 `status` —— 换代重锚判据；帧层记账零新 DOM 属性）。
 * 依赖单向：本档 → `../dom.mjs` ∥ `../i18n.mjs`；`views/chat-digest.mjs` → 本档（引调；反向零 import ⇒ 无环）。
 * 单源 = `thincoder-vscode/webview/chat-status.js:69-122`（词面 ∕ 状态分档）。
 */
import { build, text } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 计数读数归一（`n` / `ms` 非数 ⇒ 0 —— 沿归约面 `countOf` 同判；零抛）。 */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 起跑标签行文（两档 —— 单源 = 核字典 `digest.*`：`tier === "ask"` ⇒ `digest.turnLabelAsk` 携 `from` / `msg`；
 *  余 ⇒ `digest.turnLabel`；缺参回落 `?` / `…` —— 沿 VSC `chat-status.js:74-78` 同式）。 */
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

/** cap 行（#541 —— 轮尾；锚 `data-digest-cap`）。 */
function digestCapRow(cap) {
  return { tag: "div", props: { class: capRowClass(cap), "data-digest-cap": "" }, children: [capText(cap)] }
}

/** 起跑标签行（逐轮头 —— 行文单源 `digestLabel`；行序首位）。 */
function digestLabelRow(round) {
  return { tag: "div", props: { class: "digest-turn", "data-digest-label": "" }, children: [digestLabel(round)] }
}

/** 计数行（**在场 ⟺ `n > 0`** —— 文 ∕ class 单源；`n = 0` 轮零此行——幻影行禁出）。 */
function digestCountRow(round) {
  return { tag: "div", props: { class: countRowClass(round), "data-digest-count": "" }, children: [countRowText(round)] }
}

/** 单轮行集（行序 = 起跑标签行 → `n > 0` 计数行 → 轮尾 cap 行）——**行集随 `status`**（归位批 · #738）：起跑标签行
 *  **终态非 ask 档退场**（消「digesting 悬挂」—— 用户 2026-09-30 18:53 字面），**ask 档终态保留**（给由 = 行文
 *  `digest.turnLabelAsk` 携 `from` ∕ `msg` —— 本轮独有信息；终态不换词）；`n = 0` 轮零计数行；cap 行在场 ⟺ 轮
 *  `cap` 在场（跨 `end` 存续 —— #541）。 */
function digestRows(round) {
  const rows = []
  if (round.status !== "end" || round.tier === "ask") rows.push(digestLabelRow(round))
  if (countOf(round.n) > 0) rows.push(digestCountRow(round))
  if (round.cap != null) rows.push(digestCapRow(round.cap))
  return rows
}

/** 单轮元素（**当轮元素**（在场 ≤ 1）—— `div.chat-digest[data-digest]`；非块节点：零 `data-block-id` ⇒ 不占块序 /
 *  不动 `data-blocks` 不变式）：行集 = 本轮行集（单源 = `thincoder-vscode/webview/chat-status.js:69-122`；
 *  本端收正差 = 单轮在场 ∥ 终态标签行退场）。 */
export function digestRoundNode(round) {
  return { tag: "div", props: { class: "chat-digest", "data-digest": "" }, children: digestRows(round) }
}

// ─── 位次面（留档批 · #719 —— 记录位次 ∥ 在区判据 ∥ 落位两径）────────────

/** 轮位次（起跑记录全局 `idx` —— 页读折叠所携；运行期轮 ∥ 形不合 ⇒ `null`）。 */
export function roundAt(round) {
  return typeof round?.at === "number" && Number.isFinite(round.at) ? round.at : null
}

/** 已渲染块区下界（首块位次 —— 块序 = 位次前缀 + 运行期尾段 ⇒ 首块位次 = 全区下界；无位次块 ⇒ `null`）。 */
function floorOf(model) {
  const blocks = Array.isArray(model?.blocks) ? model.blocks : []
  const first = blocks.length > 0 ? blocks[0] : null
  return typeof first?.at === "number" && Number.isFinite(first.at) ? first.at : null
}

/** 在区轮集（**记录位次复列单源** —— 构树 ∥ 采纳 ∥ 帧刷 ∥ 落位四径同引）：位次轮 ⇒ 位次落于已渲染块区
 *  （`at ≥ 下界`——随窗）；运行期轮（无位次）⇒ 恒在场；下界未知 ⇒ 位次轮不退场（零信息零动作）。 */
export function shownDigestRounds(model) {
  const rounds = Array.isArray(model?.digest) ? model.digest : []
  const floor = floorOf(model)
  return rounds.filter((round) => {
    const at = roundAt(round)
    return at === null || floor === null || at >= floor
  })
}

/** 元素记账标读面（`_digestAt` = 所属轮位次；运行期元素 ⇒ `null`）。 */
export function nodeAt(node) {
  return typeof node?._digestAt === "number" && Number.isFinite(node._digestAt) ? node._digestAt : null
}

/** 建轮元素（**唯一构造点** —— 建元素即记标：位次标 ∥ 已表 status 标 = 帧层记账零新 DOM 属性）。 */
export function buildRound(round) {
  const node = build(digestRoundNode(round))
  node._digestAt = roundAt(round)
  node._digestStatus = round.status
  return node
}

/** 建树径采纳（`renderer/views/chat.mjs` `mountChat` 引调）：树按模型序产出轮元素 ⇒ 文档序 ↔ 在区轮集
 *  逐位写下位次 ∥ status 两标（缺位 ∕ 多余 ⇒ 不硬塞 —— 帧刷随后对位；status 标 = 换代重锚判据面）。 */
export function adoptDigestRounds(root, model) {
  if (!root || typeof root.querySelectorAll !== "function") return
  const nodes = [...root.querySelectorAll("[data-digest]")]
  const rounds = shownDigestRounds(model)
  const count = Math.min(nodes.length, rounds.length)
  for (let index = 0; index < count; index += 1) {
    nodes[index]._digestAt = roundAt(rounds[index])
    nodes[index]._digestStatus = rounds[index].status
  }
}

/** 缺位轮集（在区位次轮 —— 已挂元素记账标缺该位次 ⇒ 待落位；帧尾读数预判 ∥ 落位两径**同判据**）。 */
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

/** 位次锚（文档序首枚「位次更大的块节点」∥ 首位运行期块 —— 位次轮恒居运行期尾段之前 —— ∥ 无 ⇒ `null`）；
 *  节点位次读面 = `_blockAt`（帧层记账 —— 宿主建块两径写下）。 */
function positionAnchor(root, at) {
  for (const node of root.querySelectorAll("[data-block-kind]")) {
    const bat = typeof node._blockAt === "number" && Number.isFinite(node._blockAt) ? node._blockAt : null
    if (bat === null || bat > at) return node
  }
  return null
}

/** 帧尾落位（④′ 步 —— **块挂载后**）：在区缺位轮按记录位次插入（插点 = 位次锚 ∥ 尾组锚 `anchor`）；
 *  返回落位数（= `pendingDigestSeats(...).length` —— 两径同判据）。 */
export function seatDigestRounds(root, model, anchor = null) {
  if (!root || typeof root.querySelectorAll !== "function") return 0
  let seated = 0
  for (const round of pendingDigestSeats(root, model)) {
    const node = buildRound(round)
    const target = positionAnchor(root, roundAt(round)) ?? anchor
    if (typeof root.insertBefore === "function") root.insertBefore(node, target)
    else root.append(node)
    seated += 1
  }
  return seated
}

// ─── 行集同步（按轮元素定位行族 —— 标签行可增删；归位批 · #738）────────────

/** 单轮元素行集同步（**按轮元素定位行族** —— 标签行可增删）：行序 = [起跑标签行?][n > 0 计数行?][cap 行?]；
 *  逐行等价 ⇒ 零写（帧刷幂等）；标签行在场 ⟺ `status !== "end" ∨ tier === "ask"`（终态非 ask ⇒ 原位摘除；再起跑 ⇒ 原位补建）。 */
export function syncRound(node, round) {
  const find = (name) => (typeof node.querySelector === "function" ? node.querySelector(`[data-digest-${name}]`) : null)
  const label = find("label")
  if (round.status !== "end" || round.tier === "ask") {
    if (label === null) node.insertBefore(build(digestLabelRow(round)), node.firstChild)
    else if (label.textContent !== digestLabel(round)) text(label, digestLabel(round))
  } else if (label !== null) label.remove()
  let countRow = find("count")
  if (countOf(round.n) > 0) {
    if (countRow === null) {
      const head = find("label")
      node.insertBefore(build(digestCountRow(round)), head !== null ? head.nextSibling : node.firstChild)
    } else {
      if (countRow.textContent !== countRowText(round)) text(countRow, countRowText(round))
      if (countRow.getAttribute("class") !== countRowClass(round)) countRow.setAttribute("class", countRowClass(round))
    }
  } else if (countRow !== null) {
    countRow.remove()
    countRow = null
  }
  const capRow = find("cap")
  if (round.cap == null) {
    if (capRow !== null) capRow.remove()
    return
  }
  if (capRow === null) {
    const tail = countRow ?? find("label")
    node.insertBefore(build(digestCapRow(round.cap)), tail !== null ? tail.nextSibling : node.firstChild)
    return
  }
  if (capRow.textContent !== capText(round.cap)) text(capRow, capText(round.cap))
  if (capRow.getAttribute("class") !== capRowClass(round.cap)) capRow.setAttribute("class", capRowClass(round.cap))
}
