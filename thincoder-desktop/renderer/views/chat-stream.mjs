/**
 * chat-stream.mjs — 对话流**结算面**（`docs/desktop/design/RENDERER.md` §1.1「流面结算步」条 ∥ §2 有界渲染窗口）：
 * `blockKey` = 块键单源（`block.id ?? String(index)` —— 落锚 / 缝合键 / toggle 键三处同源）；
 * `flowStep` = 结算纯件（平 node 直测 · 零 DOM / 零 `node:`）—— 每帧以**账**（上帧 DOM 所覆盖块列 + 隐藏数）对
 * 本帧模型窗做**整数结算** ⇒ `{ drop, build, refresh, head }`（**无逐位配对判定 ∥ 无全或无判决** —— 每项各自
 * 留 ∥ 摘 ∥ 造 ∥ 刷，结算必达）。
 * 账项 = `{ node, block }`（帧层记账）；`ops` = 作业单（写口单点 = `thincoder-desktop/renderer/store.mjs`
 * `withFlowOp`）；造项出口 `{ index, block, before }` —— `index` = **窗位**、`before` = 其后首账项（缺 ⇒ 尾插点
 * `blockAnchor`）；`head` = 头段（保持段之前者：**越位摘 + 前插** —— 帧尾读数区间内），其余三段 = 尾段（先于读数）。
 */

/** 块键单源：有 `id` 用 `id`（字符串化 —— 落锚与缝合键同域），否则用位置。 */
export function blockKey(block, index) {
  return block?.id ?? String(index)
}

/** 流面结算步（纯件）：**项位次 = 账位 + 作业回放**（`prepend{count}` ⇒ 全体 +count ∥ `insert{index}` ⇒ 位次
 *  ≥ index 者 +1 ∥ `cut{index}` ⇒ 命中项摘除 ∥ 其后 −1 —— 纯加减）；**留判 = 落于目标窗**
 *  `[model.hidden, model.hidden + model.blocks.length)`。**摘 = 按数**（头段越位项）∥ **造 = 给没有节点的内容造
 *  节点**（窗位缺账项者 —— 头段**前插** ∥ 尾段**追加** ∥ 中洞**就位**）∥ **刷 = 就地**（留位且块对象变者）。
 *  `build`（整置 —— 页回执首屏 ∥ 换会话 ∥ 关页）⇒ 账整清 + 窗位全造（无保持段 ⇒ 全走头段口径；帧出口实以
 *  构造径 `mountChat` 承接 —— 此形只作纯件契约）。 */
export function flowStep({ account = null, model = null, ops = [] } = {}) {
  const list = Array.isArray(account?.mounted) ? account.mounted : []
  const blocks = Array.isArray(model?.blocks) ? model.blocks : []
  const start = Number.isFinite(model?.hidden) ? model.hidden : 0
  const end = start + blocks.length
  const plan = { drop: [], build: [], refresh: [], head: { drop: [], build: [] } }
  // 账位 + 作业回放（序即到达序；位次随位置序同升 —— 回放只作整体平移 ∥ 单位摘除）
  const base = Number.isFinite(account?.hidden) ? account.hidden : 0
  const entries = list.map((entry, index) => ({ entry, at: base + index, held: true }))
  for (const op of Array.isArray(ops) ? ops : []) {
    const kind = op?.kind
    if (kind === "build") {
      for (const item of entries) plan.head.drop.push(item.entry)
      for (let pos = start; pos < end; pos += 1) plan.head.build.push({ index: pos - start, block: blocks[pos - start], before: null })
      return plan
    }
    if (kind === "prepend") {
      const count = Number.isFinite(op.count) ? Math.max(0, Math.floor(op.count)) : 0
      for (const item of entries) item.at += count
    } else if (kind === "insert" && Number.isFinite(op.index)) {
      for (const item of entries) if (item.at >= op.index) item.at += 1
    } else if (kind === "cut" && Number.isFinite(op.index)) {
      for (const item of entries) {
        if (!item.held) continue
        if (item.at === op.index) item.held = false // 命中 ⇒ 摘（局部先行回声退流）
        else if (item.at > op.index) item.at -= 1
      }
    }
  }
  const kept = []
  for (const item of entries) {
    if (!item.held || item.at >= end) plan.drop.push(item.entry) // 退流摘 ∥ 尾侧越位（尾段步）
    else if (item.at < start) plan.head.drop.push(item.entry) // 头段越位（按数摘）
    else kept.push(item)
  }
  const covered = new Set(kept.map((item) => item.at))
  const first = kept.length > 0 ? kept[0].at : null
  for (let pos = start; pos < end; pos += 1) {
    if (covered.has(pos)) continue
    const after = kept.find((item) => item.at > pos)
    const spot = { index: pos - start, block: blocks[pos - start], before: after === undefined ? null : after.entry }
    if (first !== null && pos < first) plan.head.build.push(spot) // 保持段之前者 ⇒ 头段前插
    else plan.build.push(spot) // 尾段追加 ∥ 中洞就位
  }
  for (const item of kept) {
    const block = blocks[item.at - start]
    if (item.entry.block !== block) plan.refresh.push({ index: item.at - start, block, entry: item.entry })
  }
  return plan
}
