/**
 * chat-digest.mjs — 对话流消化行族**帧面**出档（structure-split-2 批 · 台账 #651 —— 自 `renderer/views/chat-chrome.mjs`
 * 三段逐字迁出；流内落位批 · 台账 #706 改**当轮元素 · 流内就地**；留档批 · 台账 #719 增**位次面**；归位批 ·
 * 台账 #738 行集随 `status` + 换代末位重锚，构树件 ∥ 行集同步 ∥ 位次面随拆出档 `views/chat-digest-seat.mjs`；
 * **三端消化面统一批 · 台账 #747**（对位 VSC ∥ CLI 实形重写）：**无轮容器**（行元素 = 流内并列兄弟）∥ 行族
 * **逐轮累积**（零摘除）∥ 标签行**恒在**（终态不撤）∥ **座次**入模（归档块入其消费轮座次位 ——
 * `renderer/subagent-reduce.mjs`）∥ 归档落位 = **边界物形**（边界 = 本轮标签行：`ev:digest start` 设 ∥
 * `ev:susp` 收帧清；`digestBoundaryOf` 块序守卫链退场——边界行取面 = 本档 `boundaryRowOf`）。
 * 导出面：帧尾态刷 `syncDigest`（**逐轮累积同步 ∥ 行族对位**）· 在场判据 `digestPresent` ∥ 边界行取面
 * `boundaryRowOf`（归档落位锚——唯边界物）· 首屏清点 `clearDigest`（运行期痕四清之四 —— 引调面
 * `renderer/page-read.mjs`）；**位次 ∥ 座次面 ∥ 构树件再出口**（旧 import 面零改：`views/chat-tree.mjs` ∥
 * `views/chat.mjs` ∥ `views/chat-chrome.mjs`）。
 * 落位 = **流内就地**；**重建 ∕ 回填 = 按记录位次复列**（留档批 · #719 —— 轮位次 `at` = 起跑记录全局 `idx`；
 * 在场面 = 记录位次落于已渲染块区 —— 随窗；单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）。
 * **座次面**（#747 —— 座次位 `seat` = 起跑水位）：`seatLiveRounds`（帧尾 ④′ 落位）住本档；座次标 ∥ 位次标 ∥
 * 行集同步 `syncRound` 住 `views/chat-digest-seat.mjs`（再出口保名）。
 * 依赖单向：宿主三档 ∥ 页读 `renderer/page-read.mjs` → 本档；本档 → `views/chat-digest-seat.mjs`
 *（引调面；反向零 import ⇒ 无环）。
 */
// 行族身份面 ∥ 行集同步 ∥ 位次 ∥ 座次（拆出面 —— `views/chat-digest-seat.mjs`）。
import { buildRows, familyKeyOf, nodeFamilyKey, nodeRid, roundAt, roundEndAt, roundRid, roundSeat, syncRound, shownDigestRounds } from "./chat-digest-seat.mjs"
// 位次 ∥ 座次面 ∥ 构树件再出口（旧 import 面零改 —— 拆分随批；`views/chat-chrome.mjs` 亦再出口 `digestPresent`）。
export {
  adoptDigestRounds, buildRows, digestRows, nodeAt, nodeRid, pendingDigestSeats, roundAt, roundEndAt, roundRid, roundSeat,
  seatDigestRounds, shownDigestRounds, syncRound,
} from "./chat-digest-seat.mjs"

/** 在场判据（**轮集非空** —— 逐轮累积：在一轮在档即在场；空 ∕ 非数组 ⇒ 不在场）。
 *  构树 ∥ 帧刷两门同引 —— 判据单源。 */
export function digestPresent(rounds) {
  return Array.isArray(rounds) && rounds.length > 0
}

/** 块位次读面（记录全局 `idx`；缺 ∥ 非数 ⇒ `null`）。 */
function idxOf(block) {
  return typeof block?.at === "number" && Number.isFinite(block.at) ? block.at : null
}

/** 消费轮配对（#747 —— **复列镜式单源**）：`block`（`subagent` 记录）的消费轮 = 记录落于其 [start, end]
 *  之后（`endAt ≤ 位次`）且其间**无非 `subagent` 块记录**者（= 消化回收落点——活流 `atBoundary` 面的记录镜式）；
 *  取**末**合格轮（后到者胜）；无合格轮 ⇒ `null`（不配对 —— 原位即记录位次）。两径同引：页读块序重排
 *  （`renderer/page-read.mjs` —— 模型序）∥ 重建构树出序（`renderer/views/chat-tree.mjs` —— 文档序）。 */
export function consumedRoundOf(block, blocks, rounds) {
  const at = idxOf(block)
  if (at === null) return null
  const list = Array.isArray(blocks) ? blocks : []
  let hit = null
  for (const round of rounds) {
    const rat = roundAt(round)
    const rend = roundEndAt(round)
    if (rat === null || rend === null || rat > at || rend > at) continue
    const blocked = list.some((other) => other !== block && other?.kind !== "subagent" && (idxOf(other) ?? Infinity) > rend && (idxOf(other) ?? Infinity) < at)
    if (!blocked) hit = round
  }
  return hit
}

/** 帧尾态刷（幂等 · **逐轮累积同步**——零摘除）：在区轮集逐轮取行族（`_digestRid` ∥ `_digestAt` 对位 ——
 *  行族身份面），族内行就地刷文 ∕ class（`syncRound`：标签行恒在就地换文 ∥ 计数行 ∥ cap 行尾追补建）；
 *  行族缺 ⇒ **运行期轮**于流末建行（座次落户归帧尾 ④′ `seatLiveRounds`）；**重建轮** ⇒ 不于此插入
 *  （帧尾 ④′ `seatDigestRounds` 按记录位次复列）∥ 随窗（低于窗下界者零插入 —— 零信息零动作）。
 *  单源 = `docs/desktop/design/RENDERER.md` §1.1 归约面条 ∕ 流内消化行族条 ∕ 帧尾态刷条 ∥「留档记录」条。 */
export function syncDigest(root, model, anchor = null) {
  if (!root || typeof root.querySelector !== "function") return
  const families = new Map()
  if (typeof root.querySelectorAll === "function") {
    for (const node of root.querySelectorAll("[data-digest]")) {
      const key = nodeFamilyKey(node)
      if (key === null) continue
      const rows = families.get(key)
      if (rows === undefined) families.set(key, [node])
      else rows.push(node)
    }
  }
  for (const round of shownDigestRounds(model)) {
    const key = familyKeyOf(round)
    if (key === null) continue
    const family = families.get(key) ?? []
    if (family.length === 0) {
      if (roundAt(round) !== null) continue // 重建轮：落位归帧尾 ④′（位次复列——零插入非位次锚处）
      for (const row of buildRows(round)) {
        if (typeof root.insertBefore === "function") root.insertBefore(row, anchor)
        else root.append(row)
      }
      continue
    }
    syncRound(root, family, round, anchor)
  }
}

// ─── 座次面（#747 —— 运行期轮行族居其座次：帧尾 ④′ 步落位；落点单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）──

/** 运行期轮行串（**自标签行起 —— 相邻同轮行**；cap 行尾追 ⇒ 非相邻者不入串——搬移只动族本体；
 *  行族缺 ⇒ `null`）。 */
function liveRun(root, round) {
  const rid = roundRid(round)
  const rows = [...root.querySelectorAll("[data-digest]")].filter((node) => nodeRid(node) === rid)
  if (rows.length === 0) return null
  const head = rows.find((node) => typeof node.getAttribute === "function" && node.getAttribute("data-digest-label") !== null) ?? rows[0]
  const run = [head]
  for (let node = head.nextElementSibling; node !== null; node = node.nextElementSibling) {
    if (nodeRid(node) !== rid) break
    run.push(node)
  }
  return run
}

/** 障碍判据（就位面）：块节点 ∥ 尾组 ∥ 卡 ∥ 药丸 —— 行族就位判据只许行间杂（**他族行不计障**：行序 = 座次序，
 *  同座次 ∥ 无座次段者按出生序——零块面不误搬）。 */
function isObstacle(node) {
  if (typeof node?.getAttribute !== "function") return false
  return node.getAttribute("data-block-kind") !== null
    || node.getAttribute("data-timer") !== null || node.getAttribute("data-stopped") !== null
    || node.getAttribute("data-ledger") !== null || node.getAttribute("data-card") !== null
    || node.getAttribute("data-pill") !== null
}

/** 座次锚（行族插点——**本族行零障面**：座次段后首个非本族节点）：有本座次段（块 `_blockSeat === seat` ——
 *  归档块入模标随节点）⇒ 段后首个非本族节点（无 ⇒ `null`）；无座次段 ⇒ 首枚「模型位次 ≥ 座次」块节点
 *  （`hidden` 折算可见序）∥ 越界 ⇒ `null`；`null` 由调用面依次回退（座次更大轮行族首 → 尾组锚）。 */
function seatTarget(root, nodes, hidden, seat, rid) {
  let last = null
  for (const node of nodes) if (node._blockSeat === seat) last = node
  if (last !== null) {
    for (let node = last.nextSibling; node !== null; node = node.nextSibling) {
      if (node.nodeType === 1 && nodeRid(node) === rid) continue // 本族行已在位 ⇒ 越过
      return node
    }
    return null
  }
  const index = seat - hidden
  if (index >= 0 && index < nodes.length) return nodes[index]
  return null
}

/** 就位判据（`last` 之后至 `target` 之间无障碍——target 为 `null` ⇒ 达文档尾为就位）。 */
function placedBefore(last, target) {
  for (let node = last.nextSibling; node !== null; node = node.nextSibling) {
    if (node === target) return true
    if (node.nodeType === 1 && isObstacle(node)) return false
  }
  return target === null || target === undefined
}

/** 座次待动数（帧尾**读数裁剪预判** —— 读数前算；**保守门**）：行族在而将搬 ⇒ 计其行数；**行族未建**
 *  （帧尾 ③ 将建、④′ 归座）而座次落于块列中段 ⇒ 计 1（仅作 `moves === 0` 读数门用——宁多勿漏）；
 *  实动面以 `seatLiveRounds` 为准（两径同判据：`liveSeatPlan`）。 */
export function pendingLiveSeats(root, model, anchor = null) {
  return liveSeatPlan(root, model, anchor).pending
}

/** 座次落位（#747 —— 帧尾 ④′ 步 · **块挂载后**）：运行期轮行族（标签行 + `n > 0` 计数行，cap 行随邻）居其
 *  座次——座次段之后首障之前；已就位 ⇒ 零动作（零 DOM 写）；返回搬移行数。 */
export function seatLiveRounds(root, model, anchor = null) {
  let moved = 0
  for (const { run, target } of liveSeatPlan(root, model, anchor).steps) {
    for (const row of run) root.insertBefore(row, target)
    moved += run.length
  }
  return moved
}

/** 座次落位计划（**干跑 ∥ 实动同判据单源**）：`steps` = 需搬者（`{ run, target }`）；`pending` = 保守待动数。 */
function liveSeatPlan(root, model, anchor) {
  if (!root || typeof root.querySelectorAll !== "function") return { steps: [], pending: 0 }
  const rounds = shownDigestRounds(model).filter((round) => roundAt(round) === null && roundRid(round) !== null)
  if (rounds.length === 0) return { steps: [], pending: 0 }
  const nodes = [...root.querySelectorAll("[data-block-kind]")]
  const hidden = Number.isFinite(model?.hidden) ? Math.max(0, model.hidden) : 0
  /** 回退锚（无座次段 ∥ 座次越尾）：座次更大轮行族首（行序 = 座次序——无块面退化）∥ 无 ⇒ `null`。 */
  const laterHead = (seat) => {
    for (const round of rounds) {
      if ((roundSeat(round) ?? 0) <= seat) continue
      const run = liveRun(root, round)
      if (run !== null) return run[0]
    }
    return null
  }
  const steps = []
  let pending = 0
  for (const round of rounds) {
    const seat = roundSeat(round) ?? 0
    const run = liveRun(root, round)
    if (run === null) {
      if (seat < hidden + nodes.length) pending += 1 // 行族未建而座次在中段 ⇒ 建后须归座（保守计）
      continue
    }
    const target = seatTarget(root, nodes, hidden, seat, roundRid(round)) ?? laterHead(seat) ?? anchor ?? null
    if (placedBefore(run[run.length - 1], target)) continue
    steps.push({ run, target })
    pending += run.length
  }
  return { steps, pending }
}

/** 边界行取面（#747 —— **唯边界物**）：边界 = `ev:digest start` 设 ∥ `ev:susp` 收帧清（归约面置标 ——
 *  `renderer/events-wake.mjs` `onDigest` ∕ `onSusp`）；取**末轮**（带边界标者）的本轮标签行（`_digestRid`
 *  对位 —— 本轮首元素，对位 VSC `chat-status.js:92`）；未设 ∥ 行缺 ⇒ `null`（调用面回落常规块插入点 ——
 *  迟来 `done` ∕ 边界失效退化，对位 VSC `activity.js:108`）。 */
export function boundaryRowOf(root, model) {
  if (!root || typeof root.querySelectorAll !== "function") return null
  const rounds = Array.isArray(model?.digest) ? model.digest : []
  const last = rounds[rounds.length - 1]
  if (last?.boundary !== true) return null
  const key = familyKeyOf(last)
  if (key === null) return null
  for (const node of root.querySelectorAll("[data-digest-label]")) {
    if (nodeFamilyKey(node) === key) return node
  }
  return null
}

/** 首屏页读清点（**运行期痕四清之四** —— 引调面 `renderer/page-read.mjs` 首屏门）：末轮未结（`status !== "end"`）
 *  ⇒ **保末轮**（活态——「窗存续 · 切回即见」）；余整清（清点口径 = **未结末轮保**；重建随后按记录复列页内
 *  全量完整轮 —— 留档批 · #719）；null ∕ 非载体 ∕ 无轮 ∕ 原样保留 ⇒ **原引用**（零写）。 */
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
