/**
 * mount-settings-segments-models.mjs — 设置面 **models 段出口族**（R7 · 桌面功能对位批；「先拆后改」：自
 * `renderer/mount-settings-segments.mjs` 拆出 —— 300 行层拆分）：consult 行族（增 ∕ 删 ∕ effort 行内改 ∕
 * 两 picker）与 advisor 行（provider ∕ model 两 picker + 存），共八出口。
 *
 * 写径 = `settings:agent` `{ patch }`（**consult → `agent.consultModels` 整数组回写**；advisor → 两键）——
 * 本族零新通道；写后复读经读数供给族 `loadAgent`（`models` 块单源）。
 * 接线沿 `createSegmentExits` 注入先例：`createModelsExits(deps)` ——
 * `deps = { ask, store, setSettings, report, clearReport, reads }`；返回 `{ handlers }`（并回
 * `mount-settings-exits.mjs` 单一 handlers 表）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：失败 ⇒ **零乐观写** + 段级失败面（scope = `models`）；
 * 端侧形判不齐 ⇒ **零发送**（`console.error` 零静默）；effort 归一沿 VSC `settings-state.js` `effortPayloadValue`
 * （「—」〔空值〕/ `none` / 空 ⇒ `null`）。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 非空串归一：非串 / 空串 ⇒ `null`（禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)

/** models 段出口族工厂（`deps.reads.loadAgent` = 写后复读口）。 */
export function createModelsExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, reads } = deps
  const { loadAgent } = reads ?? {}

  /** models 段切片局部写（引用不变 ⇒ 零通知 —— 同值写零重绘）。 */
  const setModelsSlice = (patch) => {
    const held = store.get().settings?.models ?? {}
    setSettings({ models: { ...held, ...patch } })
  }

  /** consult 池写出口（整数组回写 —— 值形 = `{ provider, model, effort }` 三键；成功 ⇒ 复读 models 段）。 */
  async function writeConsult(next) {
    const receipt = await ask("settings:agent", { patch: { "agent.consultModels": next } })
    if (receipt.ok !== true) {
      report("models", receipt, "settings:agent")
      return false
    }
    clearReport()
    await loadAgent()
    return true
  }

  /** consult 行现值（models 切片 —— 写前基线；effort 非串 ⇒ `null`）。 */
  const consultRows = () => listOf(store.get().settings?.models?.consult).map((row) => ({
    provider: row.provider,
    model: row.model,
    effort: typeof row.effort === "string" ? row.effort : null,
  }))

  /** 增行出口：picker 两值齐 ∧ 行未满 ⇒ 追加（effort 初值 = `null` ⇒ 「—」）；成功 ⇒ 清 picker。 */
  async function consultAdd() {
    const picker = store.get().settings?.models?.picker ?? {}
    const provider = typeof picker.provider === "string" ? picker.provider : ""
    const model = str(picker.model)
    const rows = consultRows()
    if (provider === "" || model === null || rows.length >= 5) {
      console.error("[renderer] settings:agent skipped: consult add requires provider+model under the 5-entry cap")
      return
    }
    const ok = await writeConsult([...rows, { provider, model, effort: null }])
    if (ok) setModelsSlice({ picker: { provider: "", rows: [], model: null } })
  }

  /** 移除行出口：按两键定位（表外项 ⇒ 零变化 ⇒ 零发送）。 */
  async function consultRemove(row) {
    const rows = consultRows()
    const next = rows.filter((r) => !(r.provider === row?.provider && r.model === row?.model))
    if (next.length === rows.length) {
      console.error("[renderer] settings:agent skipped: consult row not found")
      return
    }
    await writeConsult(next)
  }

  /** effort 行内改出口（VSC `effortPayloadValue` 同归一：「—」〔空值〕/ `none` / 空 ⇒ `null`，余字面）：
   *  归一后同现值 ⇒ 零发送。 */
  async function consultEffort(row, value) {
    const raw = typeof value === "string" ? value.trim() : ""
    const normalized = raw === "" || raw === "—" || raw === "none" ? null : raw
    const rows = consultRows()
    const held = rows.find((r) => r.provider === row?.provider && r.model === row?.model)
    if (held === undefined) {
      console.error("[renderer] settings:agent skipped: consult row not found")
      return
    }
    if (held.effort === normalized) return
    await writeConsult(rows.map((r) => (r === held ? { ...r, effort: normalized } : r)))
  }

  /** 增行 provider 换出口：换值 ⇒ 清旧候选 + 现取该渠道模型面（`model:list`——候选面单源既有通道）。 */
  async function consultPickProvider(provider) {
    const name = typeof provider === "string" ? provider : ""
    setModelsSlice({ picker: { provider: name, rows: [], model: null } })
    if (name === "") return
    const receipt = await ask("model:list", { provider: name })
    if (receipt.ok !== true) {
      report("models", receipt, "model:list")
      setModelsSlice({ picker: { provider: name, rows: [], model: null } })
      return
    }
    clearReport()
    setModelsSlice({ picker: { provider: name, rows: listOf(receipt.models), model: null } })
  }

  /** 增行 model 换出口（空值 ⇒ 清）。 */
  function consultPickModel(model) {
    const held = store.get().settings?.models?.picker ?? { provider: "", rows: [] }
    setModelsSlice({ picker: { provider: held.provider ?? "", rows: listOf(held.rows), model: str(typeof model === "string" ? model : "") } })
  }

  /** advisor provider 换出口（空 ⇒ 回 `Inherit` 态；非空 ⇒ 现取该渠道模型面）。 */
  async function advisorPickProvider(provider) {
    const name = typeof provider === "string" ? provider : ""
    setModelsSlice({ advisorPicker: { provider: name, rows: [], model: null } })
    if (name === "") return
    const receipt = await ask("model:list", { provider: name })
    if (receipt.ok !== true) {
      report("models", receipt, "model:list")
      setModelsSlice({ advisorPicker: { provider: name, rows: [], model: null } })
      return
    }
    clearReport()
    setModelsSlice({ advisorPicker: { provider: name, rows: listOf(receipt.models), model: null } })
  }

  /** advisor model 换出口（空值 ⇒ 清）。 */
  function advisorPickModel(model) {
    const held = store.get().settings?.models?.advisorPicker ?? { provider: "", rows: [] }
    setModelsSlice({ advisorPicker: { provider: held.provider ?? "", rows: listOf(held.rows), model: str(typeof model === "string" ? model : "") } })
  }

  /** advisor 存出口：空 provider ⇒ 两键清 `null`（回 `Inherit` —— 核读面 `cfg.provider` 假值即回落主渠道）；
   *  provider + model ⇒ 两键落值；形不齐 ⇒ **零发送**（`console.error` 零静默）。 */
  async function advisorSave() {
    const picker = store.get().settings?.models?.advisorPicker ?? {}
    const provider = typeof picker.provider === "string" ? picker.provider : ""
    const model = str(picker.model)
    let patch
    if (provider === "") patch = { "agent.advisor.provider": null, "agent.advisor.model": null }
    else if (model !== null) patch = { "agent.advisor.provider": provider, "agent.advisor.model": model }
    else {
      console.error("[renderer] settings:agent skipped: advisor save requires a model for the picked provider")
      return
    }
    const receipt = await ask("settings:agent", { patch })
    if (receipt.ok !== true) {
      report("models", receipt, "settings:agent")
      return
    }
    clearReport()
    await loadAgent()
  }

  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域）。 */
  const handlers = {
    onConsultPickProvider: (provider) => void consultPickProvider(provider),
    onConsultPickModel: (model) => consultPickModel(model),
    onConsultAdd: () => void consultAdd(),
    onConsultRemove: (row) => void consultRemove(row),
    onConsultEffort: (row, value) => void consultEffort(row, value),
    onAdvisorPickProvider: (provider) => void advisorPickProvider(provider),
    onAdvisorPickModel: (model) => advisorPickModel(model),
    onAdvisorSave: () => void advisorSave(),
  }

  return { handlers }
}
