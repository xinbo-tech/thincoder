/**
 * chat-digest-rows.mjs — 对话流消化行族**单档**（桌面消化痕拆批 · 2026-10-01 · 台账 #765 拆后最小形；
 * **自然形收正批 · 2026-10-01 · 台账 #768 收正**：行 = 流内事件 · **出即留**；**回填落位批 · 2026-10-04**（台账 #910）：
 * 复入窗 ⇒ **整置径**（删档 + 新写——记录序重放；位次轮缺行随整置落其记录位次——零位置机具：零寻位 ∥ 零搬移 ∥ 零算术））。
 * 形态（对位两端实形；单源 = `docs/desktop/design/RENDERER.md` §1.1「流内消化行族」条）：消化行 = **流内普通项** ——
 * 行元素 = 流内并列兄弟（无轮容器 ∥ 不占块序 ∥ 不计 `data-blocks`）；每轮 1–5 枚（起跑标签行 ∥ `n > 0` 计数行 ∥ cap 行 ∥ 终态行 ∥ 残余行）。
 * 生命周期（自然形 —— **零清理机器**）：
 *   ① **到达序出生**——行族生于**当刻流末**（帧尾入流步 `renderer/views/chat.mjs` `settleFrame` 步①：先于同帧尾段挂载
 *      ——同帧批内新到流项按到达序：行族先 ∥ 补发块后）；
 *   ② **行出生即定型**——**零就地换文**（`end` ⇒ **追加终态行**（锚 `data-digest-end`——词键 `digest.done` ∕
 *      `digest.aborted` 直取）；**不动**原 digesting 行——计数行恒起跑文 `digest.start` ∥ 标签行恒在）；
 *   ③ **零摘除**——旧轮行留置原位（不改 ∥ 不删 ∥ 不退场）；行随流自然上浮（离开视野 = 滚动，非删除）。
 * 复列 = **记录序重放**（恢复序 ≡ 记录序）：轮于其记录位次复列（**全量——未结轮照现**）∥ 运行期轮 = 流末 —— 归构树面
 * `renderer/views/chat-tree.mjs`（重挂 ∥ 首屏 ∥ **回填整置**（回填落位批 · 2026-10-04——删档 + 新写） = 树面重建；行族随树逐位采纳 —— 零采纳步）。
 * 导出面：构树 `digestRows` · 帧刷 `syncDigest` · 位次读面 `roundAt`（记录面字段）·
 * 首屏清点 `clearDigest`（运行期痕五清之四 —— 引调面 `renderer/page-read.mjs`）。
 * 依赖单向：`renderer/views/chat.mjs` ∥ `renderer/views/chat-chrome.mjs` ∥ `renderer/views/chat-tree.mjs` ∥
 * `renderer/page-read.mjs` → 本档（引调）；本档 → `../dom.mjs` ∥ `../i18n.mjs`（反向零 import ⇒ 无环）。
 */
import { build } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 计数读数归一（`n` / `ms` 非数 ⇒ 0 —— 沿归约面 `countOf` 同判；零抛）。 */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 起跑标签行文（两档 —— 单源 = 核字典 `digest.*`：`tier === "ask"` ⇒ `digest.turnLabelAsk` 携 `from` / `msg`；
 *  余 ⇒ `digest.turnLabel`；缺参回落 `?` / `…` —— 沿 VSC `chat-status.js:74-78` 同式；行出生即定型 ∥ 标签行恒在）。 */
function digestLabel(round) {
  return round.tier === "ask"
    ? t("digest.turnLabelAsk", { from: round.from ?? "?", msg: round.msg ?? "…" })
    : t("digest.turnLabel")
}

/** 计数行文（**起跑文恒在** —— 核字典 `digest.start`；`n` = 起跑 pending 数；终态不换文——终态另起新行）。 */
function digestCount(round) {
  return t("digest.start", { n: countOf(round.n) })
}

/** 终态行文（状态分档 —— 单源）：`ok === false` ⇒ `digest.aborted` 携 `seconds`；余 ⇒ `digest.done` 携 `n` ∕
 *  `seconds`（`seconds` = `ms` ∕ 1000 一位小数 —— 沿 VSC `chat-status.js:112-120` 同判）。 */
function endRowText(round) {
  const seconds = (countOf(round.ms) / 1000).toFixed(1)
  return round.ok === false ? t("digest.aborted", { seconds }) : t("digest.done", { n: countOf(round.n), seconds })
}

/** 终态行 class（状态分档）：失败 ⇒ 并 `.digest-failed` ∕ 完成 ⇒ 并 `.digest-done`（复用状态行底色两态）。 */
function endRowClass(round) {
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

/** 起跑标签行（**恒在** —— 行序首位；对位 VSC `chat-status.js:79`）。 */
function digestLabelRow(round) {
  return { tag: "div", props: { class: "chat-digest digest-turn", "data-digest": "", "data-digest-label": "" }, children: [digestLabel(round)] }
}

/** 计数行（**在场 ⟺ `n > 0`** —— 文 ∕ class 单源；`n = 0` 轮零此行——幻影行禁出；文恒起跑文）。 */
function digestCountRow(round) {
  return { tag: "div", props: { class: "chat-digest digest-status", "data-digest": "", "data-digest-count": "" }, children: [digestCount(round)] }
}

/** cap 行（#541 —— **尾追形**：cap 帧到达即随流尾追；锚 `data-digest-cap`）。 */
function digestCapRow(cap) {
  return { tag: "div", props: { class: `chat-digest ${capRowClass(cap)}`, "data-digest": "", "data-digest-cap": "" }, children: [capText(cap)] }
}

/** 终态行（**自然形收正批 · 2026-10-01 —— `end` ⇒ 追加一条新行**；锚 `data-digest-end`——`renderer/views/chat-tree.mjs`
 *  重建径同出本行（族内紧邻）；原 digesting 行不动 —— 零就地换文）。 */
function digestEndRow(round) {
  return { tag: "div", props: { class: `chat-digest ${endRowClass(round)}`, "data-digest": "", "data-digest-end": "" }, children: [endRowText(round)] }
}

/** 残余行文（**消化账务批 · 2026-10-05 · 台账 #930**——单源 = 核字典 `digest.residue` 直取；
 *  `n` = 本轮未销账条数）。 */
function residueText(round) {
  return t("digest.residue", { n: countOf(round.unsettled) })
}

/** 残余行（**终态行之后再落一行** —— `end` 且携 `unsettled > 0` ⇒ 追加；锚 `data-digest-residue`；
 *  `= 0` ⇒ 零行（零噪音）；机制 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31）。 */
function digestResidueRow(round) {
  return { tag: "div", props: { class: "chat-digest digest-status", "data-digest": "", "data-digest-residue": "" }, children: [residueText(round)] }
}

/** 单轮行集（行序 = 起跑标签行 → `n > 0` 计数行 → cap 行 → `n > 0` 终态行 → `unsettled > 0` 残余行）——**行元素 = 流内并列兄弟**（无轮容器：
 *  逐行直挂、不做每轮包裹元素；对位 VSC `chat-status.js:72-89` 逐行 `appendChild`）。行集随轮态**只增不减**：
 *  起跑帧出 [标签行]（`n > 0` 携计数行）∥ cap 帧增 cap 行 ∥ `end` 帧**增终态行**（**`n = 0` 守句**：零计数行 ∥ 零终态行——
 *  禁幻影行；三端同守）＋ 携 `unsettled > 0` 时增残余行（消化账务批 · 2026-10-05）；未结轮照出已有行（零终态行）——行不改 ∥ 不删。末轮归属过滤（活流侧优先）住并入点
 *  `renderer/page-read.mjs` `withFoldedDigest`；清点 `clearDigest` 维持现行「未结末轮保」。 */
export function digestRows(round) {
  const rows = [digestLabelRow(round)]
  if (countOf(round.n) > 0) rows.push(digestCountRow(round))
  if (round.cap != null) rows.push(digestCapRow(round.cap))
  if (round.status === "end" && countOf(round.n) > 0) {
    rows.push(digestEndRow(round))
    if (countOf(round.unsettled) > 0) rows.push(digestResidueRow(round)) // 残余行：终态行之后再落一行（= 0 ⇒ 零行）
  }
  return rows
}

/** 轮位次（起跑记录全局 `idx` —— 页读折叠所携；运行期轮 ∥ 形不合 ⇒ `null`）。 */
export function roundAt(round) {
  return typeof round?.at === "number" && Number.isFinite(round.at) ? round.at : null
}

/** 行型名（行家族五型 —— 锚名闭集；描述符 ∥ 已建节点两形同判）。 */
const ROW_MARKS = ["label", "count", "cap", "end", "residue"]
function rowTypeOf(face) {
  if (face === null || face === undefined) return null
  const read = (name) => (typeof face.getAttribute === "function" ? face.getAttribute(name) : face.props?.[name])
  for (const name of ROW_MARKS) if (read(`data-digest-${name}`) != null) return name
  return null
}

/** 在册行（文档序 —— `[data-digest]`）。 */
function listRows(root) {
  return typeof root.querySelectorAll === "function" ? [...root.querySelectorAll("[data-digest]")] : []
}

/** 组切分（**标签行 = 每轮首行** —— 行族唯追加 ⇒ 组序 = 轮序；零新记账面）。 */
function groupsOf(rows) {
  const groups = []
  for (const row of rows) {
    if (rowTypeOf(row) === "label" || groups.length === 0) groups.push([])
    groups[groups.length - 1].push(row)
  }
  return groups
}

/** 活流段（**运行期轮 = 尾段** —— 模型面恒序：折叠轮居前 ∥ 现轮集随后；位次轮携 `at` ∥ 运行期轮零位置面）。 */
function liveSegment(rounds) {
  let start = rounds.length
  while (start > 0 && roundAt(rounds[start - 1]) === null) start -= 1
  return rounds.slice(start)
}

/** 追一行（**唯追加** —— 插于 `ref` 之前；`ref` 缺 ⇒ 末位）：行标 `_digestRound` = 其轮对象（帧层记账 ——
 *  引用即身份；随重建元素淘汰 ⇒ 零陈旧面）。 */
function addRow(root, round, row, ref) {
  const fresh = build(row)
  if (typeof root.insertBefore === "function") root.insertBefore(fresh, ref)
  else root.append(fresh)
  fresh._digestRound = round
  return fresh
}

/** 出生（活流轮）：整组行于当刻流末按行序建（`start` ⇒ 标签行 + `n > 0` 计数行；`cap` ∕ `end` 帧 ⇒ 同笔补齐）。 */
function birthRound(root, round, ref) {
  return digestRows(round).map((row) => addRow(root, round, row, ref))
}

/** 行集补齐（**唯追加** —— 缺而应在者补建；在场者零写 ∥ 零换文）：期望序 = `digestRows`（标签行 → 计数行? →
 *  cap 行? → 终态行?）；补建插点 = 本组内首个「期望序更后」的在场行之前 ∥ 无 ⇒ `ref`（当刻流末锚）。
 *  返回 = 补齐后行集（在场 + 补建 —— 行账续记面）。 */
function fillRound(root, round, group, ref) {
  const want = digestRows(round)
  const live = group.map((node) => ({ node, at: want.findIndex((row) => rowTypeOf(row) === rowTypeOf(node)) }))
  const born = []
  want.forEach((row, index) => {
    if (live.some((item) => item.at === index)) return
    born.push(addRow(root, round, row, live.find((item) => item.at > index)?.node ?? ref))
  })
  return [...group, ...born]
}

/** 末轮行账读面（帧层，root）：`{ live, rows }` —— `rows` = 末轮行节点（上一帧所记）；`live` = 活流轮数水位
 *  （轮对象随 `cap` ∕ `end` 更新 ⇒ 引用不可作轮身份——水位判「同轮」∥「新轮」）；行离树（重建清树）⇒ 账失效。 */
function accountOf(root) {
  const rows = root._digestRows?.rows
  const live = root._digestRows?.live
  if (!Array.isArray(rows) || !Number.isFinite(live)) return null
  const held = rows.filter((node) => node.parentNode !== null)
  return held.length === 0 ? null : { live, rows: held }
}

/** 末轮行账落记（帧层记账单点写）。 */
function remember(root, live, rows) {
  root._digestRows = { live, rows }
}

/** 窗下界（**首枚已标块位次** —— 沿构树面 `renderer/views/chat-tree.mjs` 同判据；块序列零位次 ⇒ `null` —— 下界
 *  未知 ⇒ 全数在区）。窗判据两处同判（构树面 ∥ 本档 `syncRoundRows` 区滤）——判据形 = `at ≥` 下界。 */
function floorOf(blocks) {
  const found = (Array.isArray(blocks) ? blocks : []).find((block) => typeof block?.at === "number" && Number.isFinite(block.at))
  return found?.at ?? null
}

/** 在区判据（位次轮 `at ≥` 窗下界；运行期轮 ∥ 下界未知 ⇒ 在区 —— 沿构树面窗口 filter 同式）。 */
function inZone(round, floor) {
  const at = roundAt(round)
  return at === null || floor === null || at >= floor
}

/** 行携位次（行标 `_digestRound` 之位次 —— **记录位次读面**；缺标 ∥ 运行期轮 ⇒ `null`）。 */
function rowAtOf(node) {
  return roundAt(node?._digestRound)
}

/** 末轮行账三支（帧层 —— **既有三支判据 ∥ 建行面零改**）：同轮续记（就地补齐）∥ 活流新轮（边界轮收梢 + 活流段尾
 *  逐轮出生）∥ 结构采纳（首见 ∥ 重建后 ∥ 轮集收缩 —— 末组 = 末轮行）。 */
function syncRoundRows(root, rounds, floor, anchor) {
  const lives = liveSegment(rounds)
  const last = rounds[rounds.length - 1]
  const account = accountOf(root)
  if (account !== null && lives.length === account.live) {
    for (const node of account.rows) node._digestRound = last // 行账（帧层记账 —— 同轮续记）
    remember(root, lives.length, fillRound(root, last, account.rows, anchor)) // 同轮：就地补齐（零重建）
    return
  }
  if (account !== null && lives.length > account.live) {
    // 新轮（活流轮数增）：**先补水位边界轮**（同批合帧：边界轮收梢（`cap` ∕ `end`）与起跑帧同批到达——行空补建），
    // 再逐轮出生尾部新轮（活流段尾 —— 当刻流末；多轮同批 ⇒ 按轮序）
    const boundary = lives[account.live - 1]
    if (boundary !== undefined) {
      for (const node of account.rows) node._digestRound = boundary
      fillRound(root, boundary, account.rows, anchor)
    }
    let rows = null
    for (const round of lives.slice(account.live)) rows = birthRound(root, round, anchor)
    if (rows !== null) {
      remember(root, lives.length, rows)
      return
    }
  }
  // 结构采纳（首见 ∥ 重建后 ∥ 轮集收缩）：末组 = 末轮行（自然组域——树面同源 —— 零重建；他轮组不入本判据；
  // 无组 ⇒ 零复列——窗口即窗口 ∥ 位次轮**出窗**不建行（缺行随整置落其记录位次——回填落位批 · 2026-10-04））
  const groups = groupsOf(listRows(root))
  const lastAt = roundAt(last)
  // 自然组域 = 非「全组行标位次皆 ≠ 末轮位次」者（已采纳他轮组出域 —— 不冒「末轮行」位 ∥ 零重标）
  const natural = groups.filter((list) => !list.every((node) => rowAtOf(node) !== null && rowAtOf(node) !== lastAt))
  const group = natural[natural.length - 1] ?? null
  if (group === null) {
    // 无组：运行期轮 ⇒ **全数出生**（树上无本键行——DOM 无轮可复列）；零运行期轮（位次轮）⇒ 零复列——窗口即窗口（缺行随整置落其记录位次——回填落位批）
    const rows = lives.flatMap((round) => birthRound(root, round, anchor))
    remember(root, lives.length, rows)
    return
  }
  // 全组标务补全（树面同源档：组序 = 在区轮序 —— 零标组逐组就轮标；判据面 = `at`——行标随建随记 ∥ 零重标）
  const zone = rounds.filter((round) => inZone(round, floor))
  if (account === null && groups.length === zone.length) {
    groups.forEach((list, index) => {
      if (list.every((node) => node._digestRound === undefined)) for (const node of list) node._digestRound = zone[index]
    })
  }
  for (const node of group) node._digestRound = last
  remember(root, lives.length, fillRound(root, last, group, anchor))
}

/** 帧刷（幂等 · **唯追加** —— 行出即留：零就地换文 ∥ 零摘除 ∥ 零搬移）：
 *  模型轮集非数组 ∥ 零轮（非 live 面）⇒ **零动作**（禁对 `none` 帧摘除）；
 *  **末轮行账三支**（同轮续记 ∥ 活流新轮 ∥ 结构采纳 —— 判据 ∥ 建行面见 `syncRoundRows`）。
 *  两处同引 —— 入流步（`renderer/views/chat.mjs` `settleFrame` 步①，先于尾段挂载：同帧批内到达序）∥
 *  帧尾态刷（`renderer/views/chat-chrome.mjs` `syncChrome`；出生已在步①落定 ⇒ 此拍就地零写）。
 *  重挂 ∥ 首屏 ∥ **回填整置径**（回填落位批 · 2026-10-04） = `mountChat` + 同帧帧尾态刷**配对**（`renderer/app.mjs` `paintChat`；配对 = 不变量——结构采纳的成立前提）。 */
export function syncDigest(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const rounds = Array.isArray(model?.digest) ? model.digest : null
  if (rounds === null || rounds.length === 0) return // 非 live 面 ∥ 零轮 ⇒ 零动作（零摘除）
  const floor = floorOf(model?.blocks)
  syncRoundRows(root, rounds, floor, anchor) // 末轮行账三支（判据 ∥ 建行面零改）
}

/** 首屏页读清点（**运行期痕五清之四** —— 引调面 `renderer/page-read.mjs` 首屏门）：末轮未结（`status !== "end"`）
 *  ⇒ **保末轮**（活态——「窗存续 · 切回即见」）；余整清（清点口径 = **未结末轮保**——维持现行；归属过滤住并入点
 *  `withFoldedDigest`）；余轮内容随首屏记录复列**全量（未结轮照现）**承接（留档批 · #719 ∥ 自然形收正批 · 2026-10-01 ∥
 *  消化重放口径批 · 2026-10-01）；null ∕ 非载体 ∕ 无轮 ∕ 原样保留 ⇒ **原引用**（零写）。 */
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
