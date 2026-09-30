/**
 * mount-settings-reads.mjs — 设置面七段读数供给族（「桌面处理流 · VSC 对齐」批 R8 · 自
 * `renderer/mount-settings.mjs` 拆出 —— 300 行层拆分，零语义变化；R2（桌面功能对位批）增 `loadIndex`
 * ——工具与服务段；**R7（桌面功能对位批）**：`loadIndex` ⇒ **`loadTools`**（段三族：两 key 行经
 * `settings:tools` + 索引面经 `index:status`——单入口两请求）+ 增 `loadEnv`（`settings:env` 读面）+
 * `loadAgent` 同拍落 **models 段切片**〔`settings:agent` 回执 `models` 块〕）：渠道段 ∕ 模型段 ∕ agent 段 ∕
 * MCP 段 ∕ env 段 ∕ 工具与服务段 ∕ models 段读数 + 激活渠道投影。
 *
 * 接线沿 `mount-onboarding.mjs` 注入先例：`createReads(deps)` —— `deps = { ask, store, setSettings, report }`
 * （窄桥 ∕ 值面写入 ∕ 失败面归装配面，单一 owner —— 本档零副本、零 `store.mjs` 反向）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：值面全经 store 纯动作落值（`patchSettings` → `store.set`）；
 * 写后回读；失败面零静默（核错误串直传，表内码出词归视图 `reasonWord`）；`options.models` 假 ⇒ **保留同渠道候选面**
 * （只刷行面 `effort` 现值 —— 档位写后刷新用，零候选清空）；无激活渠道 ⇒ 段归 `none` 且**零请求**（禁假造候选）。
 * R7 两读数要点：`loadTools` 段态判据仍以**索引面**为准（R2 口径不动——`indexOk` 假 ⇒ 段归 `none`），
 * 两 key 面色随行渲染（各自失败另落 `report`）；`loadEnv` 的 `test` 结果 = 瞬时读数（复读保留原值）。
 * **#671 读面并持**：`loadProviders` 三写皆**并持现切片** —— 草稿四切片 `edit` ∕ `keyDraft` ∕ `probe` ∕ `draft` **读面零复位**
 * （复位权仅在出口族显式点：开 ∕ 关面 · 取消 · 钥存 ∕ 删钥成功；`state` ∕ `presets` ∕ 名单照刷）。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 非空串归一：非串 / 空串 ⇒ `null`（禁假造）。 */
const str = (value) => (typeof value === "string" && value !== "" ? value : null)
/** picker 切片归一（缺 ⇒ 三键空形 —— 禁假造）。 */
const pickerOf = (value) => ({
  provider: typeof value?.provider === "string" ? value.provider : "",
  rows: listOf(value?.rows),
  model: str(value?.model),
})

/** 激活渠道读数（`provider:list` 投影）：激活名 + 该行 `model` ⇒ 复合串；缺 ⇒ 两者 `null`（**未知不造串**）。 */
function activeModel(receipt) {
  const name = typeof receipt.active === "string" && receipt.active !== "" ? receipt.active : null
  if (name === null) return { provider: null, current: null }
  const row = listOf(receipt.providers).find((p) => p?.name === name)
  const model = typeof row?.model === "string" && row.model !== "" ? row.model : null
  return { provider: name, current: model === null ? null : `${name}:${model}` }
}

/**
 * 读数供给族：`deps = { ask, store, setSettings, report }`（单一 owner 住装配面 —— 本档零副本）。
 * 返回 `{ loadProviders, loadModels, loadAgent, loadMcp, loadEnv, loadTools }`（向导族经装配面注入取
 * `loadModels` —— 见向导接线族）。
 */
export function createReads(deps = {}) {
  const { ask, store, setSettings, report } = deps

  /** 渠道段读数（`provider:list`：预置表 + 已配行 + 激活渠道三项直取）⇒ 模型段随动（激活渠道候选面）。
   *  `options.models` 假 ⇒ **保留同渠道候选面**（只刷行面 `effort` 现值 —— 档位写后刷新用，零候选清空）。 */
  async function loadProviders(options = {}) {
    setSettings({ providers: { ...store.get().settings?.providers, state: "loading" } })
    const receipt = await ask("provider:list")
    if (receipt.ok !== true) {
      setSettings({ providers: { ...store.get().settings?.providers, state: "none", presets: [], providers: [] } }) // #671 失败写并持现切片
      report("providers", receipt, "provider:list")
      return null
    }
    const { provider, current } = activeModel(receipt)
    const held = store.get().settings?.model ?? {}
    const kept = options.models === false && held.provider === provider
    // #671 ready 写并持现切片（草稿四切片读面零复位 —— 同失败径）；`presets` ∕ 名单两键照刷。
    setSettings({
      notice: null,
      defaultModel: current,
      providers: { ...store.get().settings?.providers, state: "ready", presets: listOf(receipt.presets), providers: listOf(receipt.providers) },
      model: { state: held.state ?? "none", provider, current, models: kept ? listOf(held.models) : [] },
    })
    if (!kept) await loadModels(provider)
    return provider
  }

  /** 模型段候选面（`model:list`）：无激活渠道 ⇒ 段归 `none` 且**零请求**（禁假造候选）。 */
  async function loadModels(provider) {
    const held = store.get().settings?.model ?? {}
    if (typeof provider !== "string" || provider === "") {
      setSettings({ model: { state: "none", provider: null, current: held.current ?? null, models: [] } })
      return
    }
    setSettings({ model: { state: "loading", provider, current: held.current ?? null, models: [] } })
    const receipt = await ask("model:list", { provider })
    const current = store.get().settings?.model?.current ?? null
    if (receipt.ok !== true) {
      setSettings({ model: { state: "none", provider, current, models: [] } })
      report("model", receipt, "model:list")
      return
    }
    setSettings({ notice: null, model: { state: "ready", provider, current, models: listOf(receipt.models) } })
  }

  /** agent 段读数（`settings:agent` 读 = `{}`）：`fields` 直落（值 + 敏感只读判据归视图/核）；
   *  **R7 同拍落 models 段切片**（回执 `models` 块：consult 行族 + advisor 两键）——首读（段态非 `ready`）
   *  初始化两 picker（advisor picker 现值预填 = 已存两键，行面待按需取）；后续复读**保留 picker 用户态**。 */
  async function loadAgent() {
    setSettings({ agent: { ...store.get().settings?.agent, state: "loading" } })
    const receipt = await ask("settings:agent", {})
    if (receipt.ok !== true) {
      setSettings({ agent: { state: "none", fields: [] } })
      report("agent", receipt, "settings:agent")
      return
    }
    const held = store.get().settings?.models ?? {}
    const block = receipt.models !== null && typeof receipt.models === "object" ? receipt.models : null
    const advisor = block?.advisor !== null && typeof block?.advisor === "object" ? block.advisor : {}
    const firstLoad = held.state !== "ready"
    setSettings({
      notice: null,
      agent: { state: "ready", fields: listOf(receipt.fields) },
      models: {
        ...held,
        state: block === null ? (held.state ?? "none") : "ready",
        consult: block === null ? listOf(held.consult) : listOf(block.consult),
        advisor: { provider: str(advisor.provider), model: str(advisor.model) },
        picker: pickerOf(held.picker),
        advisorPicker: firstLoad
          ? { provider: str(advisor.provider) ?? "", rows: [], model: str(advisor.model) }
          : pickerOf(held.advisorPicker),
      },
    })
  }

  /** MCP 段读数（`mcp:list`：只列已配，不连接）；展开面切片（`details`）随段态保留（复读不清展开面）。 */
  async function loadMcp() {
    setSettings({ mcp: { ...store.get().settings?.mcp, state: "loading" } })
    const receipt = await ask("mcp:list")
    if (receipt.ok !== true) {
      setSettings({ mcp: { state: "none", servers: [], details: {} } })
      report("mcp", receipt, "mcp:list")
      return
    }
    const held = store.get().settings?.mcp ?? {}
    setSettings({ notice: null, mcp: { state: "ready", servers: listOf(receipt.servers), details: held.details ?? {} } })
  }

  /** env 段读数（`settings:env` 读 = `{}` —— R7）：`proxy` / `shell` 两键直落；`test` 结果 = 瞬时读数
   *  （复读保留原值）。回执两载体皆缺 ⇒ 段归 `none` + 失败面（**零静默**）。 */
  async function loadEnv() {
    const held = store.get().settings?.env ?? {}
    setSettings({ env: { ...held, state: "loading" } })
    const receipt = await ask("settings:env")
    const proxy = receipt.proxy !== null && typeof receipt.proxy === "object" ? receipt.proxy : null
    const shell = receipt.shell !== null && typeof receipt.shell === "object" ? receipt.shell : null
    if (receipt.ok !== true || proxy === null || shell === null) {
      const reason = receipt.ok !== true ? receipt : { reason: "invalid-shape" }
      setSettings({ env: { state: "none", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: held.test ?? null } })
      report("env", reason, "settings:env")
      return
    }
    setSettings({
      notice: null,
      env: {
        state: "ready",
        proxy: { uri: typeof proxy.uri === "string" ? proxy.uri : "", web: proxy.web !== false, model: proxy.model === true },
        shell: { current: str(shell.current), candidates: listOf(shell.candidates) },
        test: held.test ?? null,
      },
    })
  }

  /** 工具与服务段读数（R7：`settings:tools` 两键 + `index:status` 索引面两请求并取）：段态判据仍以
   *  索引面为准（R2 口径不动 —— `indexOk` 假 ⇒ 段归 `none`）；两 key 面色随行落（各自失败另落 `report`）。 */
  async function loadTools() {
    const held = store.get().settings?.tools ?? {}
    setSettings({ tools: { ...held, state: "loading" } })
    const [keys, index] = await Promise.all([ask("settings:tools"), ask("index:status")])
    const keysOk = keys.ok === true
    const indexOk = index.ok === true && index.status !== null && typeof index.status === "object"
    setSettings({
      tools: {
        state: indexOk ? "ready" : "none",
        status: indexOk ? index.status : null,
        building: false,
        // 键面读数缺位（读失败）⇒ `keys: null`（两 key 行零节点 —— 零假造，同索引行判据）；成功 ⇒ 两键在场判据。
        keys: keysOk
          ? { embedding: { hasKey: keys.embedding?.hasKey === true }, websearch: { hasKey: keys.websearch?.hasKey === true } }
          : null,
        edit: null,
      },
    })
    if (!indexOk) report("tools", index.ok === true ? { reason: "invalid-shape" } : index, "index:status")
    if (!keysOk) report("tools", keys, "settings:tools")
    if (indexOk && keysOk) clearNotice()
  }

  /** 段级失败串清位（本档成功径局部用 —— 归属单一 owner 仍在装配面；本档只清**本族**写成的串）。 */
  function clearNotice() {
    const state = store.get()
    if (state.settings?.notice !== null && state.settings?.notice !== undefined) setSettings({ notice: null })
  }

  return { loadProviders, loadModels, loadAgent, loadMcp, loadEnv, loadTools }
}
