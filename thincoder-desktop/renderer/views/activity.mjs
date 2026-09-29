/**
 * activity.mjs — 本会话**右列 = 子 agent 面板**（D20 · `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2 ·
 * 「本批注（对齐第二批 · 六件）」项 3 / 5 · `docs/desktop/design/PROJECT.md` §2 KD-26 · `docs/desktop/design/RENDERER.md`
 * §1.1「池面挂载（键控差分）」条）：**薄挂载编排**（`mountPool` —— 三径 ∕ 头 ∕ 两族 ∕ 弃容器两径）。纯构树族
 * （`poolModel` ∕ `poolTree` ∕ 节点族）出档 `renderer/views/pool-tree.mjs`（让位修复批预案落形——沿「纯构树 ∕
 * 薄挂载」两层分家）；族内六件 + 帧尾复核扫出档 `renderer/views/pool-subagents.mjs`（R5 先拆后改 ∕ 让位修复批）。
 * 宿主 = 骨架 `.pool-body[data-slot="pool"]` **自身**（根描述符 props 复制到宿主 · `data-slot` 保留 ⇒ 槽位零改）。
 *   ① **子 agent 族 = 核件直消费**（「对齐第二批」项 3 —— `renderSubBlock` / `refreshBlock` / `renderSubagentChunk` /
 *      `renderSubDesc`）：块面 = VSC 同件（`details.advisor-block.sub-block` + 头行 + 状态词 + 内容 tail-3 + 展开 +
 *      ⏹）—— 桌面自建五段行块面**退场**；**容器常驻**（跨帧同一 —— 同 key 元素复用：内容追加 / 折叠态 / ⏹ 全走
 *      核函数，**不重建**；**键域 = 本会话**（会话变更 ⇒ 弃容器重建 —— 禁沿用旧会话行账；「键域与换代」判据）；
 *      壳（三态 / 头 / 折叠与待审批 / 队列两族）**照帧刷**）；表项 `region: "flow"`（归档墓碑）
 *      **不入族**（池内退场 —— 项 5 归档入流；退场块随 `renderer/views/chat-subagent.mjs` 在流内留形）；
 *   ② 键域 = **本会话**：族 / 读数 / 折叠态皆出 `state` 现态（块表 = `subBlocks[activeSession]`；渲染面**零推导 /
 *      零复制**）；三径 / 弃容器两径语义见 `mountPool` 档注。
 * **R10（子代理面板 ∕ live 面 ⇒ VSC 对齐 · 2026-09-28）挂载面四点**：
 *   ① **空态退场**（E2 —— `none` ∕ `empty` 两态一致：**零子节点**；VSC `#subagent-activity:empty{display:none}`
 *      的**内容面同形**（区域盒 = 常驻右列卡 —— 骨架差异在册）—— 原 `empty` 词表提示面退场；`data-state` 三态锚保留）；
 *   ② **生命期**（E4 —— 终态折叠含 `settled`（`awaitingDigest`）**同折**：VSC fold 效果无 awaiting 分支，驻留态词
 *      `sub.awaitingDigest` 由核 `refreshBlock` 落头行）；
 *   ③ **出生计数贴**（E6 / U-2 —— `renderer/views/activity-new.mjs`：块出生点判据「跟底 ⇒ 区钉底；未跟底 ⇒ 计数」
 *      + 帧面重挂复原；会话切换 ∕ 空态退场 ⇒ 清账）；
 *   ④ **封顶自滚**（E1 —— 封顶 = 列高（布局骨架差异在册：VSC 横带 32vh）；自滚 = 宿主 `overflow: auto` +
 *      `overscroll-behavior: contain`（`renderer/pool.css` 该条注））。核件消费面（`subblocks/*`）零改。
 * **让位修复批（2026-09-29 · 台账 #603 · KD-47）**：`mountPool` **三径** = ① `none` ∕ `empty` ⇒ `clear` + 零节点 ·
 *  ② 壳缺位（首挂 ∕ 换代后）⇒ 建树全挂 · ③ **壳在位 ∧ `pool` ⇒ 原位领用**（头 ∕ 审批 ∕ 队列族原位重建；子 agent
 *  族祖先链零摘离 ∕ 零移动——块内容区 ∕ 池自身滚动位保真）；尾接**帧尾复核扫**（`applySubBlockFollow`）。
 */
import { build, clear } from "../dom.mjs"
import { clearActivityNew, syncActivityNew, maybePinPool } from "./activity-new.mjs"
// 子 agent 族键控差分（R5 先拆后改出档）+ 帧尾复核扫（让位修复批——应用点契约「帧尾复核」）。
import { syncSubBlocks, applySubBlockFollow } from "./pool-subagents.mjs"
// 纯构树族（让位修复批预案出档——「纯构树 ∕ 薄挂载」两层分家）：模型 ∕ 树 ∕ 节点族居该档，本档只引编排所需件。
import { poolModel, poolTree, headNode, familyNode, approvalItemNode, queueItemNode, subFamilyNode, familyLabel } from "./pool-tree.mjs"
// 兼容面（结构拆分零语义——原取件路径保名：批次归档件 ∕ 只读读件仍可解析；定义单源 = `./pool-tree.mjs`）。
export { poolModel, poolTree } from "./pool-tree.mjs"

// ─── 子 agent 族（容器账 · 本档编排）─────────────────────────────────
// 族内六件（元素构造 ∕ 行重放 ∕ 冻结着装 ∕ 同键更新 ∕ 出生 ∕ 键控差分）+ 帧尾复核扫 = `./pool-subagents.mjs`；
// 纯构树族（模型 ∕ 树 ∕ 节点族）= `./pool-tree.mjs`；本档留：容器标签刷 + 挂载编排（三径 ∕ 头 / 两族 / 弃容器）。

/** 常驻族容器标签刷（语言切 ⇒ 词面随动；容器身份与项元素零扰 —— 原位换标签）。 */
function bindFamilyLabel(family) {
  const label = family.querySelector(".pool-family-label")
  const next = build(familyLabel("pool.family.subagents"))
  if (label !== null && label !== undefined) label.replaceWith(next)
  else family.prepend(next)
}

/** 壳原位领用（③ 径 · 让位修复批 KD-47 ∕ `docs/desktop/design/RENDERER.md` §1.1）：头 ∕ 审批族 ∕ 队列族
 *  **原位重建**（节点内零滚动件——重建零损失）；**子 agent 族容器及其项元素零摘离 ∕ 零移动**（祖先链
 *  host → `[data-pool-body]` → family → block → `.advisor-content` 跨帧不动 ⇒ 块内容区 ∕ 池自身滚动位保真）。
 *  **位置对账**：族序固定（审批 → 子 agent → 队列）——审批 ∕ 队列节点在族容器两侧原位增删；折叠态 ⇒ 三族
 *  摘离（族容器存 `_poolSub`——用户手势触发，复位可接受 · 登记）；展开 ⇒ 复用重插（队列族之前）。 */
function adoptPool(root, body, model, handlers, live) {
  const head = root.querySelector("[data-pool-head]")
  if (head !== null && head !== undefined) head.replaceWith(build(headNode(model, handlers)))
  const prevApprovals = body.querySelector('[data-family="approvals"]')
  const approvals = model.collapsed ? null : familyNode("approvals", "pool.family.approvals", model.approvals, (item) => approvalItemNode(item, handlers))
  if (approvals !== null) {
    const next = build(approvals)
    if (prevApprovals !== null && prevApprovals !== undefined) prevApprovals.replaceWith(next)
    else body.insertBefore(next, body.firstChild)
  } else if (prevApprovals !== null && prevApprovals !== undefined) prevApprovals.remove()
  const prevQueue = body.querySelector('[data-family="queue"]')
  const queue = model.collapsed ? null : familyNode("queue", "pool.family.queue", model.queue, queueItemNode)
  if (queue !== null) {
    const next = build(queue)
    if (prevQueue !== null && prevQueue !== undefined) prevQueue.replaceWith(next)
    else body.appendChild(next)
  } else if (prevQueue !== null && prevQueue !== undefined) prevQueue.remove()
  // 子 agent 族容器：在位 ⇒ 零移动（链稳定）；折叠 ⇒ 摘离存账；缺位 ∕ 展开 ⇒ 重插（族缺 ⇒ 建壳——出生径）
  const family = live ?? build(subFamilyNode(model))
  const mounted = body.querySelector('[data-family="subagents"]')
  if (model.collapsed) {
    if (mounted !== null && mounted !== undefined) mounted.remove()
  } else if (mounted !== family) {
    if (mounted !== null && mounted !== undefined) mounted.remove()
    const q = body.querySelector('[data-family="queue"]')
    if (q !== null && q !== undefined) body.insertBefore(family, q)
    else body.appendChild(family)
  }
  root._poolSub = family
  root._poolSubSession = model.key
  bindFamilyLabel(family)
  syncSubBlocks(root, family, model)
  applySubBlockFollow(family) // 帧尾复核（让位修复批 · KD-RC-8 应用点③——任何位面被抹 ⇒ 下一帧自愈）
  syncActivityNew(root) // 计数贴帧面复原（R10 E6 —— 头原位换新后按计数重挂；`N = 0` ⇒ 零动作）
}

/** 薄挂载（帧面 · **键控差分**）：壳（三态 / 头读数 / 折叠）与待审批 / 队列族照帧刷；子 agent 族容器**常驻**
 *  （`root._poolSub` —— 跨帧同一，项元素按 key 复用，不重建）。**键域 = 本会话**（`root._poolSubSession` ——
 *  会话变更 ⇒ 弃旧容器令族重建，禁沿用旧会话行账）。**三径**（让位修复批 · KD-47）：① `none` ∕ `empty` ⇒ `clear`
 *  + 零节点；② 壳缺位（首挂 ∕ 换代后 ∕ 零块帧【R5 弃账】）⇒ 建树全挂；③ 壳在位 ∧ `pool` ⇒ 原位领用（`adoptPool`
 *  —— 链稳定 ⇒ 位面保真；族缺 ⇒ 建壳——出生径）。**空态退场**（R10 E2 —— `none` ∕ `empty` ⇒ 零子节点 + 计数贴
 *  清账）。容器缺位 ⇒ 空转；回值 = 模型（调用面零分支）。 */
export function mountPool(root, state, handlers = {}) {
  const model = poolModel(state)
  if (!root || typeof root.setAttribute !== "function") return model
  root.setAttribute("data-pool", "")
  root.setAttribute("data-state", model.state)
  // 会话换代（「键域与换代」判据）：容器账 = 会话内 —— 会话变更（含退至 none）⇒ 弃旧容器（族重建；
  // 同键跨会话重现不承旧行账 / 旧 `.sub-desc` 判据）；R10 E6：计数贴同清（VSC `resetActivity` 同点）+ pin
  // 旗标复位（跟随缺省 —— 桌面宿主跨会话存活，VSC 区为会话内；chassis 适配，见 `activity-new.mjs` 档头）
  if (root._poolSubSession !== undefined && root._poolSubSession !== model.key) {
    clearActivityNew(root)
    root._poolPin = true
  }
  if ((root._poolSub ?? null) !== null && root._poolSubSession !== model.key) {
    root._poolSub = null
    root._poolSubSession = null
  }
  // R5（#522① 随动）：模型零块 ⇒ 族容器弃账 —— 零块帧不产族壳（`subFamilyNode` 缺席）⇒ 容器 DOM 必陈旧
  //（复位 ∕ 全归档同判 ⇒ 下次出生重挂全新建元素）；计数贴随零块清（VSC `resetActivity` 同点清账）。
  if (model.blocks.length === 0) {
    root._poolSub = null
    root._poolSubSession = null
    clearActivityNew(root)
  }
  if (model.state === "none" || model.state === "empty") {
    clear(root)
    clearActivityNew(root)
    return model
  }
  // ③ 壳在位（body 在树 ∧ 同会话 ∧ 族在场）⇒ 原位领用；否则 ② 建树全挂（首挂 ∕ 换代后 ∕ 无壳态——既有路径）
  const body = root.querySelector('[data-pool-body]')
  const adopt = body !== null && body !== undefined && model.blocks.length > 0 && root._poolSubSession === model.key
  if (adopt) {
    adoptPool(root, body, model, handlers, root._poolSub ?? null)
  } else {
    const live = root._poolSub ?? null
    // 先摘 —— 常驻容器不入 clear 射程（子树存活）
    if (live !== null && typeof live.remove === "function") live.remove()
    const tree = build(poolTree(model, handlers))
    clear(root)
    for (const child of [...tree.childNodes]) root.append(child)
    syncActivityNew(root) // 计数贴帧面复原（R10 E6 —— `clear` 摘钮后按计数重挂；`N = 0` ⇒ 零动作）
    root._poolSubSession = model.key // 换代账随池面在场即落（无块族帧同记 —— 会话切换清账判据不倚块族）
    const shell = root.querySelector('[data-family="subagents"]')
    if (shell !== null && shell !== undefined) {
      const family = live ?? shell
      if (family !== shell) shell.replaceWith(family)
      root._poolSub = family
      root._poolSubSession = model.key
      bindFamilyLabel(family)
      syncSubBlocks(root, family, model)
      applySubBlockFollow(family) // 帧尾复核（让位修复批 · KD-RC-8 应用点③——任何位面被抹 ⇒ 下一帧自愈）
    }
  }
  // #518 池区帧尾钉底（R10 E6 帧尾径补齐）：跟底 ⇒ 写 `scrollTop`（VSC `streaming.js:32` `frameEnd` 对位）；
  // 未跟底 ⇒ 零写（不夺阅读位）。
  maybePinPool(root)
  return model
}
