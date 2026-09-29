/**
 * mount-settings-segments-agent.mjs — 设置面 **agent 段出口族**（B10 W3 · S10 ∕ S11 ∕ S14b；「先拆后改」：
 * 自 `renderer/mount-settings-exits.mjs` 拆出 —— 本批 agent 面三触点落点 + 300 行层拆预案落形，批档 §2.7
 * 拆分债注③「各按族续拆出档（档名实施批定）」）：agent 段泛化兜底变更集（`agentPatch`）· 段提交（`saveAgent`）·
 * 具名控件出值（`namedOut`）与写路（`applyNamedField`）· guard 开关槽写（`toggleGuard`），共**五**出口。
 *
 * 写径 = `settings:agent` `{ patch }`（具名单键即改即存 ∕ 泛化行只发变更路径）；guard 开关**另径** =
 * `session:flags` 槽面（S14b —— slot 权威键不经通用保存，见主侧 `SLOT_AUTHORITY_PATHS` 拒写）。
 * 接线沿 `createSegmentExits` 注入先例：`createAgentExits(deps)` ——
 * `deps = { ask, store, setSettings, report, clearReport, slot, paintSettings }`；返回 `{ handlers }`
 * （并回 `mount-settings-exits.mjs` 单一 handlers 表）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**；无效值 ⇒ 控件回退现值；
 * 写成功 ⇒ 清失败串 + 回执 `fields` 就地刷新。**P14 出值规范化**（数值 ⇒ `Number(v)`〔空 / 非数 ⇒ 零发送〕·
 * 布尔 ⇒ `.checked` · 串 ⇒ 原串；无效值 ⇒ 控件回退现值）· **P15 具名控件即改即存**（单键 patch 直发）。
 * **B10 W3**：`model` ∕ `effort` 两新型空选 ⇒ `null`（**显式清除** —— 主侧删键：S10 槽清空 ∕ S11 中性档）。
 * 纪律：零 `node:` ∕ 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */
import { applyFlags } from "./events-flags.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** agent 段现态读数表（路径 → 值原样；缺 / 非数组 ⇒ 空表）。 */
function currentFields(state) {
  const current = new Map()
  for (const field of listOf(state?.settings?.agent?.fields)) if (typeof field?.path === "string" && field.path !== "") current.set(field.path, field.value)
  return current
}

/** 行出值（P14）：`checkbox` ⇒ `.checked`；`number` ⇒ `Number(v)`；余 ⇒ 原串。**无效数值（空 / 非数）⇒ `undefined`**
 *  —— 父侧裁定（2026-09-28）：真删键经 `settings:agent` 不可达（契约 = `docs/desktop/design/IPC.md` §2「档位控件注」：`patch` 表达不了删键）
 *  ⇒ 落「**零发送**（不写盘 · 零乐观改 · 控件回退现值）」；消解路 = 主侧写链 + 核清除形扩族（另批）。**数值 0 照发**（核类型表只校 `typeof`）。
 *  **B10 W3 消解**：主侧写链已落显式清除面（值 = `null` ⇒ 删键）；本径数值行仍沿零发送（选择器型另走 `namedOut`）。 */
function rowValue(input) {
  if (input?.type === "checkbox") return input.checked === true
  const raw = typeof input.value === "string" ? input.value : ""
  if (input?.type !== "number") return raw
  const value = Number(raw)
  return raw.trim() === "" || !Number.isFinite(value) ? undefined : value
}

/**
 * agent 段出口族工厂。`deps.paintSettings` = 装配面重绘口（无效数值回退现值用）；`deps.slot` = 设置槽锚。
 */
export function createAgentExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, slot, paintSettings } = deps

  /** agent 段变更集（**泛化兜底行面**）：DOM `[data-field]` 可写行 × 现态读数 diff ⇒ 只发变更路径；无变更 ∨ 无效数值行 ⇒ 零发送；作用域 = 设置槽（收到槽内即不误取）。 */
  function agentPatch(state) {
    if (typeof document.querySelector !== "function") return { patch: null, skipped: 0 }
    const scope = document.querySelector(slot)
    if (scope === null || typeof scope.querySelectorAll !== "function") return { patch: null, skipped: 0 }
    const current = currentFields(state)
    const patch = {}
    let changed = false, skipped = 0
    for (const row of scope.querySelectorAll("[data-field]")) {
      if (row.getAttribute("data-readonly") !== null) continue // 只读行（敏感 / 非标量）不参与变更集（真 DOM / 假面同径）
      const path = row.getAttribute("data-field")
      const input = row.querySelector("input")
      if (typeof path !== "string" || path === "" || input === null) continue
      const value = rowValue(input)
      if (value === undefined) { console.error(`[renderer] settings:agent skipped: invalid value for ${path}`); skipped += 1; continue }
      const held = current.get(path)
      if (Object.is(value, held) || String(value) === String(held)) continue
      patch[path] = value
      changed = true
    }
    return { patch: changed ? patch : null, skipped }
  }

  /** agent 段提交（`settings:agent` 写）：只发变更路径；无变更 / 无可写行 ⇒ **零发送**。 */
  async function saveAgent() {
    const { patch, skipped } = agentPatch(store.get())
    if (patch === null) { if (skipped > 0) paintSettings(); return } // 无效行在场 ⇒ 回退现值（与具名径同形 —— 裁定句三）
    const receipt = await ask("settings:agent", { patch })
    if (receipt.ok !== true) {
      report("agent", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ agent: { state: "ready", fields: listOf(receipt.fields) } })
  }

  /** 具名控件出值（P14 × P15 单键）：`boolean` ⇒ `.checked`；数值 ⇒ `Number(v)`（× `scale` —— 分钟面回毫秒）；
   *  `model` ∕ `effort` 两新型（B10 W3）⇒ 串原样、**空选 ⇒ `null`**（显式清除 —— 主侧删键：S10 槽清空 ∕
   *  S11 中性档）；余 ⇒ 原串；无效数值（同 `rowValue`）/ 目标缺位 ⇒ `undefined`（调用面零发送）。 */
  function namedOut(entry, event) {
    const target = event?.target ?? event?.currentTarget ?? null
    if (target === null) return undefined
    if (entry.kind === "boolean") return target.checked === true
    if (entry.kind === "model" || entry.kind === "effort") {
      const raw = typeof target.value === "string" ? target.value : ""
      return raw === "" ? null : raw
    }
    const raw = typeof target.value === "string" ? target.value : ""
    if (entry.kind !== "number") return raw
    const value = Number(raw)
    if (raw.trim() === "" || !Number.isFinite(value)) return undefined
    return entry.scale === undefined ? value : Math.round(value * entry.scale)
  }

  /** 具名控件写路（P15 即改即存 —— 单键 patch 直发，含显式清除 `null`）：回执 ⇒ `fields` 就地刷新（核已回读）；
   *  失败 ⇒ 段级失败面（**零乐观写**）；无效出值 ⇒ **零发送**。 */
  async function applyNamedField(entry, event) {
    const value = namedOut(entry, event)
    if (value === undefined) {
      console.error(`[renderer] settings:agent skipped: invalid value for ${entry.path}`)
      paintSettings()
      return
    }
    const receipt = await ask("settings:agent", { patch: { [entry.path]: value } })
    if (receipt.ok !== true) {
      report("agent", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ agent: { state: "ready", fields: listOf(receipt.fields) } })
  }

  /** guard 开关出口（S14b）：`session:flags` 槽面写（四模式位面之一 —— 活动会话键现读；无会话 ⇒ 零发送）；
   *  成功径回执携 `flags` 活值 ⇒ `applyFlags` 切片写（与页读 / 出站两径同点）；agent 不在场 ⇒ 回执无 `flags`
   *  键 ⇒ 以「已确认写入值 ∪ 切片既持值」合并落切片（其余三布尔不丢 —— 待下次页读归位槽投影）。 */
  async function toggleGuard(event) {
    const target = event?.target ?? event?.currentTarget ?? null
    if (target === null) return
    const key = typeof store.get()?.activeSession === "string" && store.get().activeSession !== "" ? store.get().activeSession : null
    if (key === null) {
      console.error("[renderer] session:flags skipped: no active session")
      return
    }
    const value = target.checked === true
    const receipt = await ask("session:flags", { key, patch: { advisorGuard: value } })
    if (receipt.ok !== true) {
      report("agent", receipt, "session:flags")
      return
    }
    clearReport()
    const held = store.get()?.sessionFlags?.[key]
    const flags = receipt.flags !== undefined
      ? receipt.flags
      : { ...(held !== null && typeof held === "object" ? held : {}), advisorGuard: value }
    store.set(applyFlags(store.get(), key, flags))
  }

  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域）：具名控件面（含 S10 ∕ S11 两新型）+ 泛化保存键 +
   *  guard 槽开关（S14b）。 */
  const handlers = {
    onSaveAgent: () => void saveAgent(),
    onNamedField: (entry, event) => void applyNamedField(entry, event),
    onToggleGuard: (event) => void toggleGuard(event),
  }

  return { handlers }
}
