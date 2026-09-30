/**
 * chat-digest.mjs — 对话流消化行族**帧面**出档（structure-split-2 批 · 台账 #651 —— 自 `renderer/views/chat-chrome.mjs`
 * 三段逐字迁出：原 `:30-88` ∥ `:162-217` ∥ `:309-315`；流内落位批 · 台账 #706 改**当轮元素 · 流内就地**；留档批 ·
 * 台账 #719 增**位次面**；归位批 · 台账 #738 行集随 `status`（终态非 ask 标签行退场）+ **换代末位重锚**，构树件 ∥
 * 行集同步 ∥ 位次面随拆出档 `views/chat-digest-seat.mjs`——贴 300 层拆分预案执行〔新档名实施批定〕）。
 * 导出面（本档原生）：帧尾态刷 `syncDigest`（**位次对位 ∥ 随窗 ∥ 换代末位重锚**）· 在场判据 `digestPresent`
 * ∥ 界锚 `digestBoundaryOf`（末轮元素 —— 唯经块序守卫）· 首屏清点 `clearDigest`（运行期痕四清之四 —— 引调面
 * `renderer/page-read.mjs`）；**位次四件 ∥ 构树件再出口**（旧 import 面零改：`views/chat-tree.mjs` ∥ `views/chat.mjs`
 * ∥ `views/chat-chrome.mjs`）。
 * 落位 = **流内就地**；**重建 ∕ 回填 = 按记录位次复列**（留档批 · #719 —— 轮位次 `at` = 起跑记录全局 `idx`；
 * 在场面 = 记录位次落于已渲染块区 —— 随窗；单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）。
 * 依赖单向：宿主三档 ∥ 页读 `renderer/page-read.mjs` → 本档；本档 → `views/chat-digest-seat.mjs`
 *（引调面五件；反向零 import ⇒ 无环）。
 */
// 拆出面引调（位次面 ∥ 构树件 ∥ 行集同步 —— `views/chat-digest-seat.mjs`）。
import { buildRound, nodeAt, roundAt, shownDigestRounds, syncRound } from "./chat-digest-seat.mjs"
// 位次四件 ∥ 构树件再出口（旧 import 面零改 —— 拆分随批；`views/chat-chrome.mjs` 亦再出口 `digestRoundNode` ∥ `digestPresent`）。
export { adoptDigestRounds, digestRoundNode, pendingDigestSeats, roundAt, seatDigestRounds, shownDigestRounds } from "./chat-digest-seat.mjs"

/** 在场判据（**轮集非空** —— 只留当轮：在场 ≤ 1（终态轮留存至下一轮 `start` 全替）；空 ∕ 非数组 ⇒ 不在场）。
 *  构树 ∥ 帧刷两门同引 —— 判据单源。 */
export function digestPresent(rounds) {
  return Array.isArray(rounds) && rounds.length > 0
}

/** 帧尾态刷（幂等 · **位次对位**）：① 位次轮按 `at` 对位（唯一）；② 运行期段按文档序对位（**保尾去首**，沿既有口径）；
 *  ③ 无对位元素 ⇒ 摘（含**随窗**：位次越出已渲染块区者 —— 头部淘汰 ⇒ 同拍摘越位痕）；对位者 ⇒ **按轮元素**原位刷行集
 *  （`syncRound` —— 标签行可增删）。
 *  **换代重锚**（归位批 · #738）：元素所表轮跨 `status` → `start` 跃迁（= 新轮起跑）⇒ 移至流末插点（`anchor`）——
 *  复用径亦须末位重锚，新轮行族落位唯一〔恒居流末，与「出现 = 流末插」同序〕。
 *  缺元素：运行期轮 ⇒ 流末插（`anchor`）；**位次轮 ⇒ 不于此插入**（帧尾 ④′ 步 `seatDigestRounds` 落位 —— 块挂载后按记录位次复列；回填径 ∥ 自愈径同源）。
 *  单源 = `docs/desktop/design/RENDERER.md` §1.1 归约面条 ∕ 帧尾态刷条 ∕「留档记录」条。 */
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
    // 换代重锚（复用径 · 归位批 · #738 —— 新轮起跑 ⇒ 行族落位唯一〔恒居流末〕）：status 标跨迁 `start` 即换代。
    if (pair.round.status === "start" && pair.node._digestStatus !== "start") {
      if (typeof root.insertBefore === "function") root.insertBefore(pair.node, anchor)
      else root.append(pair.node)
    }
    syncRound(pair.node, pair.round)
    pair.node._digestStatus = pair.round.status
  }
  for (let index = 0; index < rounds.length; index += 1) {
    if (seated[index] || roundAt(rounds[index]) !== null) continue
    const fresh = buildRound(rounds[index])
    if (typeof root.insertBefore === "function") root.insertBefore(fresh, anchor)
    else root.append(fresh)
  }
}

/** 首屏页读清点（**运行期痕四清之四** —— 引调面 `renderer/page-read.mjs` 首屏门）：末轮未结（`status !== "end"`）
 *  ⇒ **保末轮**（活态——「窗存续 · 切回即见」）；余整清（只留当轮 —— 归位批 · #738）；**全终态 ⇒ 键删**（记录折叠随后
 *  按记录位次复列最新一条 —— 留档批 · #719）；null ∕ 非载体 ∕ 无轮 ∕ 原样保留 ⇒ **原引用**（零写）。 */
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

/** 归档块界锚（尾位**连续消化行族首元素**（当轮元素 —— 在场 ≤ 1；沿族回溯口径不动）—— 文档序）——**唯经块序守卫**：
 *  末节点为消化行元素且即块序尾位（其后无 `[data-block-kind]` 块节点，文档序）⇒ 返回尾位连续族之首（归档块前插族前）；
 *  守卫不过（其后有块 ∥ 无轮 ∥ 元素缺）⇒ `fallback`（挂载点逐枚现读 —— 调用面给常规块插入点）。两径皆落块序尾位 ⇒
 *  不变式（DOM ≡ `visible`）与对齐步零改（单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条 ∕
 *  `docs/desktop/design/PROJECT.md` §2 KD-33）。
 *  **时点 = 消化起跑窗**（归位批 · #738 —— 归档块挂入早于本轮行族渲染 ∥ 守卫前插两径皆落其消费行族之前）。
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
