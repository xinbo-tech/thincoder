/**
 * chat-digest.mjs — 对话流**消化行族**出档（structure-split-2 批 · 台账 #651 —— 自 `renderer/views/chat-chrome.mjs`
 * 三段逐字迁出：原 `:30-88` ∥ `:162-217` ∥ `:309-315`；流内落位批 · 台账 #706 改**逐轮元素 · 流内就地**）。
 * 导出面**五名**：构树 `digestRoundNode`（**单轮元素** —— `[data-digest]` 选择符语义 = **元素集**；行集 =
 * 起跑标签行 + `n > 0` 计数行 + cap 行〔轮尾〕）· 在场判据 `digestPresent`（**轮集非空**；两件经宿主再出口保名
 * —— `renderer/views/chat.mjs` 十名 import 面零改）· 帧尾态刷 `syncDigest`（**逐轮元素文档序配对** —— 原位刷 ∕
 * 追加 = 流末新元素 ∕ 收缩 = 保尾去首）∥ 界锚 `digestBoundaryOf`（末轮元素 —— **唯经块序守卫**；宿主再出口、
 * 尾段挂载面引调）· 首屏清点 `clearDigest`（**运行期痕四清之四** —— 引调面 `renderer/page-read.mjs`）。
 * 落位 = **流内就地**（`start` 帧落流末、随流滚动 —— 轮行留发生位置；插入点纪律单源 =
 * `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。
 * 依赖单向：宿主 `renderer/views/chat-chrome.mjs` ∥ 页读 `renderer/page-read.mjs` → 本档（本档零反向 import ⇒ 无环）。
 * 单源 = `thincoder-vscode/webview/chat-status.js:69-122`（词面 ∕ 状态分档 ∕ **每轮独立元素**）；族内序 =
 * `docs/desktop/design/RENDERER.md` §1.1。
 */
import { build, text } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 计数读数归一（`n` / `ms` 非数 ⇒ 0 —— 沿归约面 `countOf` 同判；零抛）。 */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** 起跑标签行文（两档 —— 单源 = 核字典 `digest.*`：`tier === "ask"` ⇒ `digest.turnLabelAsk` 携 `from` / `msg`〔核 `upstreamAskLabelVars`〕；
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

/** 计数行文（状态分档 —— 单源）：起跑 ∕ cap ⇒ `digest.start`（cap 未终结 —— 终态句待 `end`）；
 *  `end` ⇒ `digest.done`（携 `n` ∕ `seconds`）∥ `digest.aborted`（携 `seconds`，`ok === false`）——
 *  沿 VSC `chat-status.js:112-120` 同判。 */
function countRowText(round) {
  if (round.status !== "end") return digestCount(round)
  const seconds = (countOf(round.ms) / 1000).toFixed(1)
  return round.ok === false ? t("digest.aborted", { seconds }) : t("digest.done", { n: countOf(round.n), seconds })
}

/** 计数行 class（状态分档）：`end` 两态（失败 ⇒ `digest-failed` ∕ 完成 ⇒ `digest-done`——底色对位住 `chat.css`）；
 *  起跑 ∕ cap ⇒ 基类（`digest-status`）。 */
function countRowClass(round) {
  if (round.status !== "end") return "digest-status"
  return round.ok === false ? "digest-status digest-failed" : "digest-status digest-done"
}

/** 撞帽行文（两档 —— 核字典 `digest.capStop` ∕ `digest.capAuto` 经 `t()` 投影直取，**零新键**；`turns` 缺 ⇒ `?`；
 *  `mode` 归一住归约面 `renderer/events-wake.mjs`）——逐字对位 VSC `chat-status.js:99-102`。 */
function capText(cap) {
  return cap.mode === "stop" ? t("digest.capStop", { turns: cap.turns ?? "?" }) : t("digest.capAuto")
}

/** cap 行 class（单源：`mode === "stop"` ⇒ 并 `.digest-cap-stop`——沿 VSC `chat-status.js:98-99` 同判）。 */
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

/** 计数行（**在场 ⟺ `n > 0`** —— 文 ∕ class 单源 `countRowText` ∕ `countRowClass`；`n = 0` 轮零此行——幻影行禁出）。 */
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
 *  不动 `data-blocks` 不变式）：行集 = 本轮三行（`digestRows`——起跑标签行 + `n > 0` 计数行 + cap 行；轮内结构
 *  ∕ 词面 ∕ 分档零改 —— 单源 = `thincoder-vscode/webview/chat-status.js:69-122`）。 */
export function digestRoundNode(round) {
  return { tag: "div", props: { class: "chat-digest", "data-digest": "" }, children: digestRows(round) }
}

/** 在场判据（**轮集非空** —— 含全终态轮「留存」；空 ∕ 非数组 ⇒ 不在场）。两门（构树 `renderer/views/chat.mjs` ∕
 *  帧尾本档 `syncDigest`）同引 —— 判据单源。 */
export function digestPresent(rounds) {
  return Array.isArray(rounds) && rounds.length > 0
}

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
 *  （文 ∕ class 随 `countRowText` ∕ `countRowClass` 单源）；cap 行在场 ⟺ 轮 `cap` 在场（轮尾，文 ∕ class 单源）；
 *  缺行 ⇒ 原位补（cap 行补于计数行后 ∕ 无计数行则标签行后）；余行 ⇒ 摘除。 */
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

/** 逐轮元素文档序配对（**旧元素身份零动** —— 同态零写）：三段 —— ① 收缩（元素多于轮）⇒ **保尾去首**
 *  （前余元素摘除 —— 存活元素 = 文档序末 N 枚，**末元素原位存续**；原保首映射在就地落位下会把末轮数据画在
 *  首元素位）；② 重合段 ⇒ 逐枚原位刷（元素内标签行定位，`syncRound`）；③ 追加（轮多于元素）⇒ **流末插新元素**
 *  （插点 = `anchor` —— 与常规新块同锚面：轮行之下、随流滚动）。 */
function syncRounds(root, nodes, rounds, anchor) {
  const drop = Math.max(0, nodes.length - rounds.length)
  for (const node of nodes.slice(0, drop)) node.remove()
  const live = nodes.slice(drop)
  for (let index = 0; index < live.length; index += 1) {
    const label = typeof live[index].querySelector === "function" ? live[index].querySelector("[data-digest-label]") : null
    if (label !== null && label !== undefined) syncRound(label, rounds[index])
  }
  for (let index = live.length; index < rounds.length; index += 1) {
    const fresh = build(digestRoundNode(rounds[index]))
    if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
    else root.append(fresh)
  }
}

/** 帧尾态刷（幂等 · **逐轮元素文档序配对**）：在场判据 = `digestPresent`（**轮集非空**——含全终态轮：终态留存，
 *  不摘）；缺席 ∧ 轮集在场 ⇒ 按轮集构树（**幂等自愈** —— 含终态构树）；轮集空 ⇒ 全摘；`anchor` = 流末插点
 *  （新轮元素插点 —— 与常规新块同锚面；宿主 `syncChrome` 引调）。单源 =
 *  `docs/desktop/design/RENDERER.md` §1.1 事件归约面条 / 帧尾态刷条。 */
export function syncDigest(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const slice = model?.digest ?? null
  const nodes = typeof root.querySelectorAll === "function" ? [...root.querySelectorAll("[data-digest]")] : []
  if (!digestPresent(slice)) {
    for (const node of nodes) node.remove()
    return
  }
  syncRounds(root, nodes, slice, anchor)
}

/** 首屏页读清点（**运行期痕四清之四** —— 引调面 `renderer/page-read.mjs` 首屏门，与三清同门同判据）：
 *  末轮未结（`status !== "end"`）⇒ **保末轮**（活态——「窗存续 · 切回即见」）；余整清；**全终态 ⇒ 键删**
 *  （存量痕——切回即失，对位 VSC 视图清除）；null ∕ 非载体 ∕ 无轮 ∕ 原样保留 ⇒ **原引用**（零写）。 */
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
 *  `[data-block-kind]` 块节点，文档序）⇒ 返回**尾位连续族之首**（归档块前插族前——居整族之上）；守卫不过（其后有块 ∥ 无轮 ∥ 元素缺）
 *  ⇒ `fallback`（**挂载点逐枚现读**——调用面给常规块插入点 `blockAnchor(root)`；本档零反向 import ⇒ 回落面由
 *  调用面现读传入）。两径皆落块序尾位 ⇒ `docs/desktop/design/RENDERER.md` §2 不变式（DOM ≡ `visible`）与对齐步
 *  零改（单源 = 同档 §1.1 插入点纪律条 ∕ `docs/desktop/design/PROJECT.md` §2 KD-33）。
 *  **收正（轻通道轮一 · 收尾期补笔 7 · 用户 2026-09-30「固化到消化轮的前面」）**：原锚 = 仅末元素（多轮累积时
 *  归档块落于最后一条之前、其余全在其上 = 观感“末尾”）；现锚 = 尾位族首 ⇒ 归档块居整族之前。守卫结构与不变式零改。 */
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
