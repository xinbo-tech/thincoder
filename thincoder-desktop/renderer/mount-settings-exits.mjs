/**
 * mount-settings-exits.mjs — 设置面出口族 + 写路辅助（「桌面处理流 · VSC 对齐」批 R8 · 自
 * `renderer/mount-settings.mjs` 拆出 —— 300 行层拆分，零语义变化）：**本档直辖出口**（提交 ∕ 校验 ∕ 移除 ∕
 * 采用模型 ∕ 档位 ∕ 语言 ∕ 开合 ＋ Esc 关闭绑定）+ **四族出口工厂装配**（段 ∕ models ∕ 渠道 ∕ agent ——
 * 本档装配合并，单一 `handlers` 表对外零改）。
 * **R7（桌面功能对位批）先拆后改**：MCP 增删 ∕ 索引构建三出口 + 新增段出口（env ∕ 两 key ∕ models ∕ MCP
 * 展开面）共**二十一**出口随族迁出（env ∕ 工具 ∕ MCP **十三** = `renderer/mount-settings-segments.mjs`；models 八 =
 * `renderer/mount-settings-segments-models.mjs`）；`formOf` 经 `deps` 回注段族（单一 owner ⇒ 零副本）。
 *
 * 接线沿 `mount-onboarding.mjs` 注入先例：`createExits(deps)` —— `deps = { ask, store, setSettings, report, clearReport, occupies, reads, slot, paintSettings }`
 * （窄桥 ∕ 值面 ∕ 失败面 ∕ 读数供给 ∕ 槽锚 ∕ 重绘归装配面）；返回 `{ handlers, openSettings, closeSettings }`（`handlers` = 视图 `data-action` 同域出口表）。
 * **B10 W2**：渠道面六出口（S1 钥编辑两件 + 设 ∕ 改钥 + 删钥 · S5 代理开关 · S2 拉取模型）随族拆出
 * `renderer/mount-settings-segments-providers.mjs`（按族续拆；本档装配合并，单一 `handlers` 表对外零改）；
 * 本档增：渠移除 ∕ 删钥删除门（S6 —— `settings-confirm.mjs`）+ 开 ∕ 关面面态复位（`edit` ∕ `probe` ∕ `draft`）。
 * **B10 W3**：agent 段五出口（`agentPatch` ∕ `saveAgent` ∕ `namedOut` ∕ `applyNamedField` ∕ `toggleGuard`
 * —— S10 ∕ S11 ∕ S14b）随族拆出 `renderer/mount-settings-segments-agent.mjs`（拆分债注③预案落形：本批
 * agent 面三触点原拆点；本档装配合并，单一 `handlers` 表对外零改）；开 ∕ 关面面态复位同拍扩 MCP 表单态
 * （`form` —— S8 编辑态不跨面驻留）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；畸形 JSON ⇒ **零发送**；
 * 写成功 ⇒ 清失败串 + 重读本段。**#652**：写成功径（渠道两形提交 ∕ 钥存）在复位写前声明草稿失效（`invalidateDrafts(scope)`
 * 注入 —— 作用域取值面 = 视图档 `[data-draft-scope]` 自携；失败径零声明 —— 草稿保真）。**P14 出值规范化**（数值 ⇒ `Number(v)`〔空 / 非数 ⇒ 零发送〕· 布尔 ⇒ `.checked` · 串 ⇒ 原串；无效值 ⇒ 控件回退现值）· **P15 具名控件即改即存**（单键 patch 直发 —— 写路随 W3 迁 `mount-settings-segments-agent.mjs`）· **F-Esc 关面板**（Esc ⇒ 既有 `closeSettings` 出口，单一实现 —— 绑定宿主 = `document`）。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */
import { initDict } from "./i18n.mjs"
import { configuredFlag, patchSettings } from "./store.mjs"
import { presetValue } from "./mount-onboarding.mjs"
import { createSegmentExits } from "./mount-settings-segments.mjs"
import { createModelsExits } from "./mount-settings-segments-models.mjs"
import { createProviderExits } from "./mount-settings-segments-providers.mjs"
import { createAgentExits } from "./mount-settings-segments-agent.mjs"
import { closeSettingsConfirm, confirmSecretDelete } from "./settings-confirm.mjs"

/** 表单自取：提交控件 `type="button"`（handlers 直传 ⇒ 监听器 = 本函数，收 **Event**）⇒ `closest("form")`。 */
function formOf(event) {
  const target = event?.currentTarget ?? event?.target ?? null
  if (target === null || typeof target.closest !== "function") return null
  return target.closest("form")
}

/** 列表归一：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/**
 * 出口族工厂。`deps.reads = { loadProviders, loadAgent, loadMcp }`（读数供给族注入）；`deps.paintSettings`
 * = 装配面重绘口（无效数值回退现值用）；`deps.slot` = 设置槽锚（表单现选自读 ∕ 泛化兜底行作用域）。
 */
export function createExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, occupies, slot, paintSettings, onProvidersChanged, invalidateDrafts } = deps
  const { loadProviders, loadAgent, loadMcp, loadEnv, loadTools } = deps.reads ?? {}

  /** 渠道表单提交（两形同一路）：载荷按形直取（表内 `name` = 载荷键）—— 空名 ⇒ 端侧形判 `invalid-shape` 零发送。 */
  async function submitChannel(event) {
    const form = formOf(event)
    if (form === null) return
    const data = new FormData(form)
    const shape = String(data.get("shape") ?? "")
    const name = String(data.get("name") ?? "")
    const key = String(data.get("key") ?? "")
    if (name === "") {
      console.error("[renderer] provider:save: empty name")
      report("providers", { reason: "invalid-shape" }, "provider:save")
      return
    }
    const payload = shape === "custom"
      ? { name, shape, baseURL: String(data.get("baseURL") ?? ""), model: String(data.get("model") ?? ""), format: String(data.get("format") ?? ""), active: data.get("active") !== null, ...(key === "" ? {} : { key }) }
      : { name, shape: "preset", preset: name, active: data.get("active") !== null, ...(key === "" ? {} : { key }) }
    const receipt = await ask("provider:save", payload)
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:save")
      return
    }
    // #652 写成功径：该表单草稿一次性作废（作用域 = 表单自携 `data-draft-scope` —— 单源在视图档；失败径零声明）。
    invalidateDrafts?.(typeof form.getAttribute === "function" ? form.getAttribute("data-draft-scope") : null)
    clearReport()
    setSettings({ verify: null })
    await loadProviders()
    onProvidersChanged?.() // 全渠扇出批 · #3：provider 写成功 ⇒ 输入区候选面强制刷新（渠道集已变 —— 首启向导同路）
  }

  /** 校验出口（`provider:verify`）：`name` 缺（向导步 1）⇒ 自读表单现选；探不通**仍可保存**（只出读数，不拦写）。 */
  async function verifyChannel(name) {
    const target = typeof name === "string" && name !== "" ? name : presetValue(slot)
    if (target === null) {
      console.error("[renderer] provider:verify: no channel selected")
      report("providers", { reason: "invalid-shape" }, "provider:verify")
      return
    }
    setSettings({ verify: null })
    const receipt = await ask("provider:verify", { name: target })
    if (receipt.ok === true) {
      clearReport()
      setSettings({ verify: { kind: "ok", count: listOf(receipt.models).length, reason: null } })
      return
    }
    setSettings({ verify: { kind: "fail", count: null, reason: reasonOf(receipt) } })
  }

  /** 渠道移除**执行径**（确认面「是」⇒ 本径；S6 前 = 直删）：失败（含激活渠道保护）⇒ 核文案直传
   *  ⇒ **零乐观摘项**（列表不动 + 失败面）。 */
  async function runRemoveProvider(name) {
    const receipt = await ask("provider:remove", { name })
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:remove")
      return
    }
    clearReport()
    setSettings({ verify: null })
    await loadProviders()
    onProvidersChanged?.() // 全渠扇出批 · #3：同上（删除至无渠 ⇒ #6 零推送边界）
  }

  /** 渠道移除出口（S6：**不可复得类删除前置确认** —— 条目连带其 `apiKey` 原文消失；驳回 ⇒ 零写）。 */
  function removeProvider(name) {
    confirmSecretDelete(() => { void runRemoveProvider(name) })
  }

  /** 模型采用出口：写 `defaultModel` 复合串（键面与形态判归核 —— `settings:agent` 写通道）⇒ 写后回读两段。 */
  async function useModel(provider, name) {
    if (typeof provider !== "string" || provider === "" || typeof name !== "string" || name === "") return
    const composite = `${provider}:${name}`
    const receipt = await ask("settings:agent", { patch: { defaultModel: composite } })
    if (receipt.ok !== true) {
      report("model", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ defaultModel: composite, agent: { state: "ready", fields: listOf(receipt.fields) } })
    await loadProviders()
  }

  /** 档位出口（`settings:agent` 写 · 意图级 `{ tier }`；`level` 非串 ⇒ **零发送**）：失败 ⇒ 段级失败面（**零乐观写** ——
   *  控件值随读档面重绘回退回执前值）；成功 ⇒ 重取行面现值（候选面保留）。 */
  async function setTier(provider, model, level) {
    if (typeof level !== "string") return
    const receipt = await ask("settings:agent", { tier: { provider, model, level } })
    if (receipt.ok !== true) {
      report("model", receipt, "settings:agent")
      return
    }
    clearReport()
    setSettings({ agent: { state: "ready", fields: listOf(receipt.fields) } })
    await loadProviders({ models: false })
  }

  /** 段出口族（env ∕ 工具与服务 ∕ MCP **十八**项 + models 八项 —— 合 **26**）随 R7 ∕ W3 迁 `mount-settings-segments.mjs` ∕
   *  `mount-settings-segments-models.mjs`（段出口族工厂 —— 共享项注入，本档零副本）；`formOf` 回注
   *  （单一 owner 在本档）；**#679**：`invalidateDrafts` 随注入（段族三径声明 —— MCP 增 ∕ 改 · tools 钥存 ∕ 删钥 · env shell）。 */
  const segments = createSegmentExits({
    ask, store, setSettings, report, clearReport, reads: deps.reads ?? {}, slot, formOf, invalidateDrafts,
  })
  const modelSegments = createModelsExits({ ask, store, setSettings, report, clearReport, reads: deps.reads ?? {} })
  /** 渠道面出口族（S1 ∕ S2 ∕ S5 —— 随本批按族拆出 `mount-settings-segments-providers.mjs`：
   *  本档装配即合并，单一 `handlers` 表对外零改；`loadProviders` 绑定 `{ models: false }` —— 渠行面
   *  复读不重探模型面（候选面随动另路 = `onProvidersChanged`））。 */
  const providerSegments = createProviderExits({
    ask, store, setSettings, report, clearReport, onProvidersChanged, slot, formOf, invalidateDrafts,
    loadProviders: () => loadProviders({ models: false }),
  })
  /** agent 段出口族（S10 ∕ S11 ∕ S14b —— 随本批按族拆出 `mount-settings-segments-agent.mjs`：本档装配
   *  即合并，单一 `handlers` 表对外零改）。 */
  const agentSegments = createAgentExits({ ask, store, setSettings, report, clearReport, slot, paintSettings })

  /** 语言出口（`config:write` 键白名单仅 `locale`）：成功回带 `{ locale, dict, configured }` ⇒ 词表重刷 + 向导闸随新档态（**一次写**）。 */
  async function toggleLang(target) {
    const receipt = await ask("config:write", { patch: { locale: target } })
    if (receipt.ok !== true) {
      report("panel", receipt, "config:write")
      return
    }
    clearReport()
    const locale = initDict(receipt)
    store.set({ ...patchSettings(store.get(), { configured: configuredFlag(receipt.configured), notice: null }), locale })
  }

  /** 设置面开（**两入口**：信息行 ∕ 输入区控件行第 7 钮 —— 后者经句柄面转口 `renderer/mount-composer.mjs`）：开 + 失败串清位 ⇒ 七段读数随动（段态 `none` → `loading` → `ready`）。
   *  S1 ∕ S2：渠道段面态复位（钥编辑态 ∕ 探果 ∕ 暂存值 ∕ 失败草稿〔#615②〕——**钥暂存不跨面驻留**）；S8：MCP 编辑态复位（`form`）。 */
  function openSettings() {
    const providers = store.get().settings?.providers ?? {}
    const mcp = store.get().settings?.mcp ?? {}
    setSettings({ open: true, notice: null, providers: { ...providers, edit: null, probe: null, draft: null, keyDraft: null }, mcp: { ...mcp, form: null } })
    void loadProviders()
    void loadAgent()
    void loadMcp()
    void loadEnv()
    void loadTools()
  }

  /** 设置面关（退场 = 零子节点 —— 订阅面重绘清容器）：同清确认弹层（S6 —— 弹层挂 `document.body`，
   *  不在容器内 ⇒ 关面须显式清；先例 = VSC `closeSettings` 同清）+ 渠道段面态复位（S1 ∕ S2 —— 含失败草稿 `keyDraft`〔#615②〕）+ MCP 编辑态复位（S8）。 */
  function closeSettings() {
    closeSettingsConfirm()
    const providers = store.get().settings?.providers ?? {}
    const mcp = store.get().settings?.mcp ?? {}
    setSettings({ open: false, notice: null, providers: { ...providers, edit: null, probe: null, draft: null, keyDraft: null }, mcp: { ...mcp, form: null } })
  }

  /** 设置面出口族（锚名逐字 = 视图 `data-action` 同域；具名控件面 = 单键同路；段族 **26** 项经 `segments` ∕
   *  `modelSegments` ∕ `agentSegments` 合并 + 渠道面 **6** 项经 `providerSegments` 合并 —— 四档出口族工厂）。 */
  const handlers = {
    ...segments.handlers,
    ...modelSegments.handlers,
    ...providerSegments.handlers,
    ...agentSegments.handlers,
    onToggleLang: (target) => void toggleLang(target),
    onCloseSettings: () => closeSettings(),
    onSubmit: (event) => void submitChannel(event),
    onVerify: (name) => void verifyChannel(name),
    onRemoveProvider: (name) => void removeProvider(name),
    onUseModel: (provider, name) => void useModel(provider, name),
    onTier: (provider, model, level) => void setTier(provider, model, level),
  }

  /** Esc 关闭（F-Esc —— 一律经既有 `closeSettings` 出口，单一实现；向导态不在本项）：**绑定宿主 = `document`**（面板为窗口级覆盖层
   *  ⇒ 绑面板节点收不到本键）；闸取**现刻**态（开 ∧ 非向导占槽）；宿主无 `addEventListener` 面 ⇒ 零绑定。 */
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("keydown", (event) => {
      if (event?.key !== "Escape") return
      const state = store.get()
      if (state?.settings?.open !== true || occupies(state)) return
      closeSettings()
    })
  }

  return { handlers, openSettings, closeSettings }
}
