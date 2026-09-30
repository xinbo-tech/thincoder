/**
 * chat-digest.mjs — 对话流**消化行族**出档（structure-split-2 批 · 台账 #651 —— 自 `renderer/views/chat-chrome.mjs`
 * 三段逐字迁出：原 `:30-88` ∥ `:162-217` ∥ `:309-315`；流内落位批 · 台账 #706 改**逐轮元素 · 流内就地**；
 * 留档批 · 台账 #719 增**位次面**）。
 * 导出面：构树 `digestRoundNode`（单轮元素 —— 行集 = 起跑标签行 + `n > 0` 计数行 + cap 行）· 在场判据 `digestPresent`
 * ∥ 帧尾态刷 `syncDigest`（**位次对位 ∥ 随窗**）∥ 界锚 `digestBoundaryOf`（末轮元素 —— 唯经块序守卫）· 首屏清点 `clearDigest`
 * （运行期痕四清之四 —— 引调面 `renderer/page-read.mjs`）∥ **位次面四件**：`adoptDigestRounds`（建树径采纳）·
 * `shownDigestRounds`（在区轮集单源）· `pendingDigestSeats`（缺位轮集）· `seatDigestRounds`（帧尾 ④′ 落位）。
 * 落位 = **流内就地**；**重建 ∕ 回填 = 按记录位次复列**（留档批 · #719 —— 轮位次 `at` = 起跑记录全局 `idx`；在场面 = 记录位次落于已渲染块区 —— 随窗；
 * 单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）。记账标：块节点 `_blockAt` ∥ 轮元素 `_digestAt`（帧层记账零新 DOM 属性；宿主同点写下）。
 * 依赖单向：宿主三档 ∥ 页读 `renderer/page-read.mjs` → 本档；单源 = `thincoder-vscode/webview/chat-status.js:69-122`（词面 ∕ 状态分档）。
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

/** 起跑标签行（逐轮头 —— 行文单源 `digestLabel`；同轮行序首位）。 */
function digestLabelRow(round) {
  return { tag: "div", props: { class: "digest-turn", "data-digest-label": "" }, children: [digestLabel(round)] }
}

/** 计数行（**在场 ⟺ `n > 0`** —— 文 ∕ class 单源；`n = 0` 轮零此行——幻影行禁出）。 */
function digestCountRow(round) {
  return { tag: "div", props: { class: countRowClass(round), "data-digest-count": "" }, children: [countRowText(round)] }
}

/** 单轮行集（行序 = 起跑标签行 → `n > 0` 计数行 → 轮尾 cap 行（在场 ⟺ 轮 `cap` 在场））。 */
function digestRows(round) {
  const rows = [digestLabelRow(round)]
  if (countOf(round.n) > 0) rows.push(digestCountRow(round))
  if (round.cap != null) rows.push(digestCapRow(round.cap))
  return rows
}

/** 单轮元素（**逐轮一元素** —— `div.chat-digest[data-digest]`；非块节点：零 `data-block-id` ⇒ 不占块序 /
 *  不动 `data-blocks` 不变式）：行集 = 本轮三行（单源 = `thincoder-vscode/webview/chat-status.js:69-122`）。 */
export function digestRoundNode(round) {
  return { tag: "div", props: { class: "chat-digest", "data-digest": "" }, children: digestRows(round) }
}

/** 在场判据（**轮集非空** —— 含全终态轮「留存」；空 ∕ 非数组 ⇒ 不在场）。构树 ∥ 帧刷两门同引 —— 判据单源。 */
export function digestPresent(rounds) {
  return Array.isArray(rounds) && rounds.length > 0
}

// ─── 位次面（留档批 · #719 —— 记录位次 ∥ 在区判据 ∥ 落位两径）────────────────────

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
function nodeAt(node) {
  return typeof node?._digestAt === "number" && Number.isFinite(node._digestAt) ? node._digestAt : null
}

/** 建轮元素（**唯一构造点** —— 建元素即记标：位次标 = 帧层记账零新 DOM 属性）。 */
function buildRound(round) {
  const node = build(digestRoundNode(round))
  node._digestAt = roundAt(round)
  return node
}

/** 建树径采纳（`renderer/views/chat.mjs` `mountChat` 引调）：树按模型序产出轮元素 ⇒ 文档序 ↔ 在区轮集
 *  逐位写下位次标（缺位 ∕ 多余 ⇒ 不硬塞 —— 帧刷随后对位）。 */
export function adoptDigestRounds(root, model) {
  if (!root || typeof root.querySelectorAll !== "function") return
  const nodes = [...root.querySelectorAll("[data-digest]")]
  const rounds = shownDigestRounds(model)
  const count = Math.min(nodes.length, rounds.length)
  for (let index = 0; index < count; index += 1) nodes[index]._digestAt = roundAt(rounds[index])
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

// ─── 帧尾态刷（位次对位 ∥ 随窗）────────────────────────────────────────────

/** 本轮行集定位（自标签行起 —— 至下一轮标签行 ∕ 元素尾；行序 = [label, (count), (cap)]）。 */
function rowsOfLabel(label) {
  const rows = []
  for (let node = label.nextSibling; node !== null; node = node.nextSibling) {
    if (typeof node.getAttribute !== "function" || node.getAttribute("data-digest-label") !== null) break
    rows.push(node)
  }
  return rows
}

/** 单轮原位同步（**逐行等价 ⇒ 零写** —— 帧刷幂等）：标签行文随 `digestLabel` 单源；计数行在场 ⟺ `n > 0`
 *  （文 ∕ class 单源）；cap 行在场 ⟺ 轮 `cap` 在场（轮尾）；缺行 ⇒ 原位补；余行 ⇒ 摘除。 */
function syncRound(label, round) {
  if (label.textContent !== digestLabel(round)) text(label, digestLabel(round))
  const rows = rowsOfLabel(label)
  let countRow = rows.find((row) => row.getAttribute("data-digest-count") !== null) ?? null
  const capRow = rows.find((row) => row.getAttribute("data-digest-cap") !== null) ?? null
  if (countOf(round.n) > 0) {
    if (countRow === null) {
      countRow = build(digestCountRow(round))
      label.parentNode.insertBefore(countRow, label.nextSibling)
    } else {
      if (countRow.textContent !== countRowText(round)) text(countRow, countRowText(round))
      if (countRow.getAttribute("class") !== countRowClass(round)) countRow.setAttribute("class", countRowClass(round))
    }
  } else if (countRow !== null) {
    countRow.remove()
    countRow = null
  }
  if (round.cap == null) {
    if (capRow !== null) capRow.remove()
    return
  }
  if (capRow === null) {
    const tail = countRow ?? label
    tail.parentNode.insertBefore(build(digestCapRow(round.cap)), tail.nextSibling)
    return
  }
  if (capRow.textContent !== capText(round.cap)) text(capRow, capText(round.cap))
  if (capRow.getAttribute("class") !== capRowClass(round.cap)) capRow.setAttribute("class", capRowClass(round.cap))
}

/** 帧尾态刷（幂等 · **位次对位**）：① 位次轮按 `at` 对位（唯一）；② 运行期段按文档序对位（**保尾去首**，沿既有口径）；
 * ③ 无对位元素 ⇒ 摘（含**随窗**：位次越出已渲染块区者 —— 头部淘汰 ⇒ 同拍摘越位痕）；对位者 ⇒ 逐轮原位刷；
 * 缺元素：运行期轮 ⇒ 流末插（`anchor`）；**位次轮 ⇒ 不于此插入**（帧尾 ④′ 步 `seatDigestRounds` 落位 —— 块挂载后按记录位次复列；回填径 ∥ 自愈径同源）。
 * 单源 = `docs/desktop/design/RENDERER.md` §1.1 归约面条 ∕ 帧尾态刷条 ∕「留档记录」条。 */
export function syncDigest(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const rounds = shownDigestRounds(model)
  const nodes = typeof root.querySelectorAll === "function" ? [...root.querySelectorAll("[data-digest]")] : []
  const pairs = []
  const ghosts = []
  const seated = new Array(rounds.length).fill(false)
  const indexOfAt = new Map()
  rounds.forEach((round, index) => {
    const at = roundAt(round)
    if (at !== null && !indexOfAt.has(at)) indexOfAt.set(at, index)
  })
  const liveNodes = []
  for (const node of nodes) {
    const at = nodeAt(node)
    if (at === null) { liveNodes.push(node); continue }
    const index = indexOfAt.get(at)
    if (index === undefined || seated[index]) { ghosts.push(node); continue }
    seated[index] = true
    pairs.push({ node, round: rounds[index] })
  }
  const liveIndex = rounds.map((_round, index) => index).filter((index) => !seated[index] && roundAt(rounds[index]) === null)
  const drop = Math.max(0, liveNodes.length - liveIndex.length)
  for (const node of liveNodes.slice(0, drop)) ghosts.push(node)
  const kept = liveNodes.slice(drop)
  for (let index = 0; index < kept.length; index += 1) {
    seated[liveIndex[index]] = true
    pairs.push({ node: kept[index], round: rounds[liveIndex[index]] })
  }
  for (const node of ghosts) node.remove()
  for (const pair of pairs) {
    const label = typeof pair.node.querySelector === "function" ? pair.node.querySelector("[data-digest-label]") : null
    if (label !== null && label !== undefined) syncRound(label, pair.round)
  }
  for (let index = 0; index < rounds.length; index += 1) {
    if (seated[index] || roundAt(rounds[index]) !== null) continue
    const fresh = buildRound(rounds[index])
    if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
    else root.append(fresh)
  }
}

/** 首屏页读清点（**运行期痕四清之四** —— 引调面 `renderer/page-read.mjs` 首屏门）：末轮未结（`status !== "end"`）
 *  ⇒ **保末轮**（活态——「窗存续 · 切回即见」）；余整清；**全终态 ⇒ 键删**（记录折叠随后按记录位次复列 ——
 *  留档批 · #719）；null ∕ 非载体 ∕ 无轮 ∕ 原样保留 ⇒ **原引用**（零写）。 */
export function clearDigest(table, key) {
  if (table === null || typeof table !== "object") return table
  const rounds = table[key]
  if (!Array.isArray(rounds) || rounds.length === 0) return table
  const keep = rounds[rounds.length - 1].status === "end" ? [] : [rounds[rounds.length - 1]]
  if (keep.length === rounds.length) return table
  const next = { ...table }
  if (keep.length === 0) delete next[key]
  else next[key] = keep
  return next
}

/** 归档块界锚（尾位**连续消化行族首元素** —— 文档序）——**唯经块序守卫**：末节点为消化行元素且即块序尾位（其后无
 *  `[data-block-kind]` 块节点，文档序）⇒ 返回尾位连续族之首（归档块前插族前）；守卫不过（其后有块 ∥ 无轮 ∥ 元素缺）
 *  ⇒ `fallback`（挂载点逐枚现读 —— 调用面给常规块插入点）。两径皆落块序尾位 ⇒ 不变式（DOM ≡ `visible`）与对齐步零改
 *  （单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条 ∕ `docs/desktop/design/PROJECT.md` §2 KD-33）。
 *  **收正（轻通道轮一 · 补笔 7 · 用户 2026-09-30「固化到消化轮的前面」）**：原锚 = 仅末元素（多轮累积观感“末尾”）⇒ 现锚 = 尾位族首（归档块居整族之前）；守卫结构与不变式零改。 */
export function digestBoundaryOf(root, fallback = null) {
  if (typeof root?.querySelectorAll !== "function") return fallback
  const nodes = [...root.querySelectorAll("[data-digest], [data-block-kind]")]
  const tail = nodes[nodes.length - 1]
  if (tail === undefined || tail.getAttribute("data-digest") === null) return fallback
  let anchor = tail
  for (let prev = anchor.previousElementSibling; prev != null && typeof prev.getAttribute === "function" && prev.getAttribute("data-digest") !== null; prev = anchor.previousElementSibling) {
    anchor = prev
  }
  return anchor
}
