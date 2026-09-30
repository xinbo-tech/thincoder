/**
 * mount-settings-segments-providers.mjs — 设置面**渠道段出口族（S1 ∕ S2 ∕ S5）**（B10 W2 · 按族续拆出档：
 * 自 `renderer/mount-settings-exits.mjs` 拆出 —— 该档越 300 ⇒ 渠道面写出口独立成档，装配面**合并回单
 * 一 `handlers` 表**对视图零改；沿 `mount-settings-segments.mjs`（env ∕ 工具 ∕ MCP）∥
 * `mount-settings-segments-models.mjs`（models）同族先例）。
 *
 * 出口（六件）：钥行编辑态两件（开 ∕ 消）· 设 ∕ 改钥 · 删钥（确认门经 `settings-confirm.mjs`）·
 * 渠级代理开关 · 「拉取模型」（暂存值直探）。
 * **桌面残余三轮 · 波 C（#615②）**：改钥失败径 ⇒ 键入值落 `providers.keyDraft`（重挂后行内输入按名回填 —— 失败不丢键入）；
 * 复位四点 = 成功 ∕ 取消（本档两件）＋ 开面 ∕ 关面（`mount-settings-exits.mjs`）；读面种子消费 = `views/settings-sections.mjs` `keyControls`。
 * **#652**：成功径在复位写前声明该行草稿失效（`invalidateDrafts(scope)` 注入 —— 作用域 = 输入件自携 `data-draft-scope`；
 * 失败径零声明：种子 ∕ 草稿两路皆保真）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；
 * 写成功 ⇒ 清失败串 + 复读本段（`loadProviders` —— 单一 owner = 读数供给族）。
 * S2 面纪律：探针载荷 = **表单暂存值**（不落盘）；探果写切片 ⇒ 树重挂 ⇒ 表单现值以 `draft` 快照回填
 * （未落盘输入不丢）；探不通**零阻断保存**。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */
import { confirmSecretDelete } from "./settings-confirm.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/**
 * 渠道面出口族工厂。`deps = { ask, store, setSettings, report, clearReport, loadProviders, slot, formOf,
 * onProvidersChanged }`（`loadProviders` = 读数供给族本段复读口，已绑定 `{ models: false }`；`formOf` =
 * 表单自取 —— 单一 owner 住 `mount-settings-exits.mjs`，经注入零副本）；返回 `{ handlers }`（并回单一
 * `handlers` 表）。
 */
export function createProviderExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, loadProviders, slot, formOf, onProvidersChanged, invalidateDrafts } = deps

  /** 渠道段切片局部写（引用不变 ⇒ 零通知 —— 同值写零重绘；沿段族 `setEnvSlice` 先例）。 */
  const setProvidersSlice = (patch) => {
    const held = store.get().settings?.providers ?? {}
    setSettings({ providers: { ...held, ...patch } })
  }

  /** 钥行编辑态开（S1）：行内换形（钥输入 + 存 ∕ 消）——行面判据单源 = 视图 `deps.edit`。 */
  const openKeyEdit = (name) => setProvidersSlice({ edit: typeof name === "string" && name !== "" ? name : null })
  /** 钥行编辑态消（S1 ∕ 取消）：回静止态（**零发送** —— 取消非写意图）；#615②：失败草稿随取消清（取消 = 弃输入）。
   *  **#652**：同拍声明该行草稿失效（弃输入 = 草稿作废 —— 在途窗内复开亦不复活；作用域自输入件自携）。 */
  const cancelKeyEdit = () => {
    const input = typeof document?.querySelector === "function" ? document.querySelector(`${slot} [data-provider-key-input]`) : null
    invalidateDrafts?.(typeof input?.getAttribute === "function" ? input.getAttribute("data-draft-scope") : null)
    setProvidersSlice({ edit: null, keyDraft: null })
  }

  /** 设 ∕ 改钥出口（S1）：读行内输入现值 ⇒ `provider:setKey`（写后复读行面）；空值 ⇒ **零发送**（零静默）。
   *  **#615②**：失败径 ⇒ 段级失败面 + `providers.keyDraft` 落键入值（重挂后同点回填 —— 失败不丢键入）。
   *  读面 = 无参选择器：行内编辑态单例（`edit` 单名）⇒ 在场输入唯一（免名字插值进选择器）。 */
  async function saveProviderKey(name) {
    const input = typeof document?.querySelector === "function" ? document.querySelector(`${slot} [data-provider-key-input]`) : null
    const value = typeof input?.value === "string" ? input.value.trim() : ""
    if (value === "") {
      console.error(`[renderer] provider:setKey skipped: empty key for ${name}`)
      return
    }
    const receipt = await ask("provider:setKey", { name, key: value })
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:setKey")
      setProvidersSlice({ keyDraft: { name, value } }) // #615②：失败草稿种子（成功 ∕ 取消 ∕ 开 ∕ 关面四复位）
      return
    }
    // #652 写成功径：该行草稿一次性作废（作用域 = 输入件自携 `data-draft-scope` —— 单源在视图档；失败径零声明）。
    invalidateDrafts?.(typeof input.getAttribute === "function" ? input.getAttribute("data-draft-scope") : null)
    clearReport()
    setProvidersSlice({ edit: null, keyDraft: null })
    await loadProviders()
    onProvidersChanged?.() // 渠面变（钥）⇒ 输入区候选面随动（沿 `provider:save` 先例）
  }

  /** 删钥**执行径**（确认面「是」⇒ 本径）：成功 ⇒ 复读行面（`hasKey:false` ∕ `maskedKey:null` 随动）。 */
  async function runDeleteProviderKey(name) {
    const receipt = await ask("provider:delKey", { name })
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:delKey")
      return
    }
    clearReport()
    setProvidersSlice({ edit: null })
    await loadProviders()
    onProvidersChanged?.()
  }

  /** 删钥出口（S1 × S6）：密钥原文不可复得 ⇒ **前置确认弹层**（驳回 ⇒ 零写；确认 ⇒ 既有删除径）。 */
  function deleteProviderKey(name) {
    confirmSecretDelete(() => { void runDeleteProviderKey(name) })
  }

  /** 渠级代理开关出口（S5）：布尔直发（主侧 `true` 写 ∕ `false` 删键）；失败 ⇒ 段级失败面
   *  （**零乐观写** —— 复选值随读档面回退）。 */
  async function setProviderProxy(name, value) {
    const receipt = await ask("provider:setProxy", { name, proxy: value === true })
    if (receipt.ok !== true) {
      report("providers", receipt, "provider:setProxy")
      return
    }
    clearReport()
    await loadProviders()
    onProvidersChanged?.() // 代理位影响探针链路 ⇒ 候选面同拍刷新
  }

  /**
   * 「拉取模型」出口（S2）：读表单暂存值（DOM 直读 —— **不落盘**）⇒ `provider:models`；探期 ∕ 两态落
   * `providers.probe`，**同批写 `providers.draft`**（表单现值快照 —— 探果写切片 ⇒ 树重挂 ⇒ 未落盘输入
   * 由回填救回）。`baseURL` 空 ⇒ 本地前置拒（`base-url-required` 词面，零发送 —— 沿 VSC `_paFetchModels`）；
   * 探不通 ⇒ 失败词驻状态行，**保存径零阻断**。
   */
  async function fetchModels(event) {
    const form = typeof formOf === "function" ? formOf(event) : null
    if (form === null) return
    const data = new FormData(form)
    const draft = {
      name: String(data.get("name") ?? ""),
      baseURL: String(data.get("baseURL") ?? ""),
      model: String(data.get("model") ?? ""),
      format: String(data.get("format") ?? ""),
      key: String(data.get("key") ?? ""),
    }
    if (draft.baseURL.trim() === "") {
      console.error("[renderer] provider:models skipped: baseURL is required")
      setProvidersSlice({ probe: { state: "fail", models: [], reason: "base-url-required" }, draft })
      return
    }
    setProvidersSlice({ probe: { state: "running", models: [], reason: null }, draft })
    const receipt = await ask("provider:models", { baseURL: draft.baseURL, apiKey: draft.key, format: draft.format })
    const probe = receipt.ok === true
      ? { state: "ok", models: listOf(receipt.models), reason: null }
      : { state: "fail", models: [], reason: reasonOf(receipt) }
    setProvidersSlice({ probe, draft })
  }

  /** 出口族表（锚名逐字 = 视图 `data-action` 同域）。 */
  const handlers = {
    onProviderKeyEdit: (name) => openKeyEdit(name),
    onProviderKeyCancel: () => cancelKeyEdit(),
    onProviderKeySave: (name) => void saveProviderKey(name),
    onProviderKeyDelete: (name) => deleteProviderKey(name),
    onSetProxy: (name, value) => void setProviderProxy(name, value),
    onFetchModels: (event) => void fetchModels(event),
  }

  return { handlers }
}
