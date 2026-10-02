/**
 * pool-subagents.mjs — 池面**子 agent 族**键控差分族（纯 DOM 执行面；R5 · 桌面功能对位批「先拆后改」：
 * `renderer/views/activity.mjs` 届盘 338 行越 300 顾问线，按在册拆点「`subElementOf` … `bindFamilyLabel`」
 * 落形 —— 结构拆分零语义）。本档 = 族内六件（元素构造 ∕ 行重放 ∕ 冻结着装 ∕ 同键更新 ∕ 出生 ∕ 键控差分）；
 * 容器标签刷（`bindFamilyLabel`）与挂载编排（`mountPool` / 三态 / 头 / 两族）留主档；纯构树族（含三族共用
 * `familyLabel`）居 `renderer/views/pool-tree.mjs`（让位修复批预案出档）—— 本档对二者零依赖。
 * **R5（子 agent 面 · 态机三面随动 + 块头注记）**：注记呈现 = **核件直出**（`refreshBlock` ⇒ `headerText`
 * 读 `meta.note` —— 端零文案）；本档随态机三面 —— 复位（模型零块 ⇒ 主档弃容器 ⇒ 下次出生全新建元素）·
 * 退出兜底（归档后模型 `frozen` ⇒ `foldIfFrozen` 着装）· 出生闸（新块 ⇒ `createSubBlock` 出生）。
 * 依赖单向：本档 → 核件（`/rc/subblocks/block.mjs` `renderSubagentChunk` ∕ `renderSubBlock` ∕ `renderSubDesc` ∕
 * `initBlockFollow` ∕ `maybeScrollBlock`；`/rc/subblocks/activity-view.mjs` `refreshBlock`）· `./activity-new.mjs`
 * （出生点判据总口）· `./chat-subagent.mjs`（`withThawedSubMeta` —— 冻结穿闸单源）；主档反向引本档两导出（`syncSubBlocks` / `applySubBlockFollow`）—— **无环**。
 * **#518 块内容区跟滚（四点接线 · 核原语直消费）**：① 出生 ∕ 接管（`subElementOf` 尾 `initBlockFollow`）·
 * ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉
 * （`updateSubBlock` `replaceWith` 后）——余三点 = `maybeScrollBlock` 应用（让位旗标为假 ⇒ 零写）。
 * **让位修复批（2026-09-29 · #603）**：应用点契约（追加后 ∕ 挂载后 ∕ 帧尾复核——单源 = 核档 KD-RC-8）之**帧尾
 * 复核**落本档新导出 `applySubBlockFollow`（族级逐块 `maybeScrollBlock`——任何位面被抹 ⇒ 下一帧自愈），
 * 调用点 = 主档 `mountPool` 尾（`syncSubBlocks` 之后）。
 * 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { renderSubagentChunk, renderSubBlock, renderSubDesc, initBlockFollow, maybeScrollBlock } from "/rc/subblocks/block.mjs"
import { refreshBlock } from "/rc/subblocks/activity-view.mjs"
import { notePoolBirth } from "./activity-new.mjs"
import { withThawedSubMeta } from "./chat-subagent.mjs"

/** 核件块元素（新代 / 首见）：块壳（`renderSubBlock` —— 含 data 面 + toggle + 首刷）⇒ 内容行重放
 *  （`entry.rows` 逐条 `renderSubagentChunk` —— 重挂重放单源）⇒ 冻结着装 ⇒ 末刷（挂 DOM 后补 —— 首见径 `createSubBlock` ∕ 接管径 `updateSubBlock` 同序）。 */
function subElementOf(entry) {
  const element = renderSubBlock(entry)
  element._rowsDone = 0
  replayRows(element, entry)
  foldIfFrozen(element, entry)
  initBlockFollow(element) // ① 出生 ∕ 接管共用点：内容区跟滚监听（核原语——VSC `buildBlockEl` 同点）
  return element
}

/** 内容行增量重放（`_rowsDone` 记账 —— 同 frames 内只追加新行；`rows` 缺 / 非数组 ⇒ 零动作）。 */
function replayRows(element, entry) {
  const rows = Array.isArray(entry?.rows) ? entry.rows : []
  const pending = rows.slice(element._rowsDone ?? 0)
  if (pending.length > 0) {
    // 冻结块重放（重建 / 会话切回两径 —— 历史面，非运行态增量）：单源过闸（`withThawedSubMeta` —— 毕还原本相）
    withThawedSubMeta(element, entry, () => { for (const row of pending) renderSubagentChunk(element, row) })
    maybeScrollBlock(element) // ② 内容增量 ⇒ 跟滚应用（让位旗标为假 ⇒ 零写；折叠 ∕ 未挂 = 核原语 no-op）
  }
  element._rowsDone = rows.length
}

/** 冻结着装（终态折叠 —— 核 fold 效果逐值同形：`sub-live ⇒ sub-frozen` + 折叠 + ⏹ 移除）。R10 E4：
 *  `settled`（`awaitingDigest`）与其余终态**同折**（VSC `activity.js:80-86` fold 效果无 awaiting 分支 ——
 *  等待消化态词 `sub.awaitingDigest` 由核 `refreshBlock` 照常落头行）。幂等（已着装重复调用零新写）。 */
function foldIfFrozen(element, entry) {
  if (entry?.frozen !== true) return
  element.classList.remove("sub-live")
  element.classList.add("sub-frozen")
  element.open = false
  element.querySelector(".sub-stop-btn")?.remove()
}

/** 同 key 元素更新（**不重建**）：新代接管（核 `takeover` —— 同键新代：前态已冻结 ∧ 新态未冻结）⇒ 换新元素
 *  （**挂载后末刷** —— ⏹ 门控读 `isConnected`，与首见径 `createSubBlock` 同序）；其余（内容追加 / 状态迁移 /
 *  终态折叠）⇒ 就地核函数更新（内容追加 / 折叠态 / ⏹ 全走核函数）。 */
function updateSubBlock(element, entry) {
  const known = element._subMeta
  if (known === entry) return
  if (known?.frozen === true && entry?.frozen !== true) {
    const next = subElementOf(entry)
    element.replaceWith(next)
    maybeScrollBlock(next) // ④ 接管径补钉（新元素默认跟底——旧块让位旗标不随迁）
    // 挂载后末刷（换元素径 —— 核首刷发生在挂载前，`isConnected` 门控未过；与首见径同序）
    refreshBlock(next)
    return
  }
  element._subMeta = entry
  replayRows(element, entry)
  foldIfFrozen(element, entry)
  refreshBlock(element)
}

/** 新块出生（族尾 append）：说明行（**挂载根级旗标** `root._subDescShown` —— #630 对齐 VSC `webview/state.js:42` `_subDescShown` 面板级判据；插 `.advisor-content` 之前 ∕ 元素形零改）；
 *  出生点判据（R10 E6 —— VSC `activity.js:60-63` 同点：跟底 ⇒ 区钉底；未跟底 ⇒ 计数贴 +1）；
 *  挂 DOM 后重刷（⏹ 门控读 `isConnected` —— 核首刷发生在挂载前）。 */
function createSubBlock(root, family, entry) {
  const element = subElementOf(entry)
  // #630：判据 = 挂载根级旗标（一次置位不重置 —— root 跨会话 ∕ 跨族重建恒在；app 重载 ⇒ 新 root 归零
  // = VSC webview 重载同判）；旧「族内零块 ∧ 无 `.sub-desc`」DOM 探针退场（族换代可跨会话重插）。
  if (root !== null && root !== undefined && root._subDescShown !== true) {
    root._subDescShown = true
    element.insertBefore(renderSubDesc(), element.querySelector(".advisor-content"))
  }
  family.append(element)
  maybeScrollBlock(element) // ③ 挂载补钉（重挂重放场景——挂载前写无效）
  notePoolBirth(root)
  refreshBlock(element)
  return element
}

/** 键控差分（项 3）：同 key ⇒ 复用元素就地更新；新 key ⇒ 尾追出生；出表（归档墓碑过滤后缺席 / 取消）⇒ 摘除。
 *  块表序 = 插入序 ∧ 新增恒在尾 ⇒ DOM 序 ≡ 模型序（不重排）。**空族守卫（#660 · KD-47 ⑤）**：族缺 / 非元素
 *  ⇒ 零动作（同 `applySubBlockFollow` 形——调用面空族支已断，本守卫为防御面）。 */
export function syncSubBlocks(root, family, model) {
  if (!family || typeof family.querySelectorAll !== "function") return
  const items = [...family.querySelectorAll(".sub-block")]
  const byKey = new Map()
  for (const element of items) {
    const key = element.getAttribute("data-subname") ?? ""
    if (key !== "" && !byKey.has(key)) byKey.set(key, element)
  }
  const wanted = new Set()
  for (const entry of model.blocks) {
    const key = typeof entry?.key === "string" ? entry.key : ""
    if (key === "" || wanted.has(key)) continue
    wanted.add(key)
    const element = byKey.get(key)
    if (element === undefined) createSubBlock(root, family, entry)
    else updateSubBlock(element, entry)
  }
  for (const element of items) {
    if (!wanted.has(element.getAttribute("data-subname") ?? "")) element.remove()
  }
}

/** 帧尾复核扫（让位修复批 · KD-RC-8 应用点清单「帧尾复核」——族级逐 `.sub-block` 应用核 `maybeScrollBlock`）：
 *  旗标真者复钉（任何位面被抹 ⇒ 下一帧自愈）；旗标假者零写（不夺阅读位）。**只扫池族**——归档流内块 = 冻结静态，
 *  不扫 ∕ 不写；族缺 ∕ 非元素 ⇒ 零动作（幂等）。 */
export function applySubBlockFollow(family) {
  if (!family || typeof family.querySelectorAll !== "function") return
  for (const element of family.querySelectorAll(".sub-block")) maybeScrollBlock(element)
}

