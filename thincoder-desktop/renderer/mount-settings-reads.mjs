/**
 * mount-settings-reads.mjs — 设置面五段读数供给族（「桌面处理流 · VSC 对齐」批 R8 · 自
 * `renderer/mount-settings.mjs` 拆出 —— 300 行层拆分，零语义变化；R2（桌面功能对位批）增 `loadIndex`
 * ——工具与服务段）：渠道段 ∕ 模型段 ∕ agent 段 ∕ MCP 段 ∕ 索引段读数 + 激活渠道投影。
 *
 * 接线沿 `mount-onboarding.mjs` 注入先例：`createReads(deps)` —— `deps = { ask, store, setSettings, report }`
 * （窄桥 ∕ 值面写入 ∕ 失败面归装配面，单一 owner —— 本档零副本、零 `store.mjs` 反向）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：值面全经 store 纯动作落值（`patchSettings` → `store.set`）；
 * 写后回读；失败面零静默（核错误串直传，表内码出词归视图 `reasonWord`）；`options.models` 假 ⇒ **保留同渠道候选面**
 * （只刷行面 `effort` 现值 —— 档位写后刷新用，零候选清空）；无激活渠道 ⇒ 段归 `none` 且**零请求**（禁假造候选）。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

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
 * 返回 `{ loadProviders, loadModels, loadAgent, loadMcp, loadIndex }`（向导族经装配面注入取 `loadModels` —— 见向导接线族）。
 */
export function createReads(deps = {}) {
  const { ask, store, setSettings, report } = deps

  /** 渠道段读数（`provider:list`：预置表 + 已配行 + 激活渠道三项直取）⇒ 模型段随动（激活渠道候选面）。
   *  `options.models` 假 ⇒ **保留同渠道候选面**（只刷行面 `effort` 现值 —— 档位写后刷新用，零候选清空）。 */
  async function loadProviders(options = {}) {
    setSettings({ providers: { ...store.get().settings?.providers, state: "loading" } })
    const receipt = await ask("provider:list")
    if (receipt.ok !== true) {
      setSettings({ providers: { state: "none", presets: [], providers: [] } })
      report("providers", receipt, "provider:list")
      return null
    }
    const { provider, current } = activeModel(receipt)
    const held = store.get().settings?.model ?? {}
    const kept = options.models === false && held.provider === provider
    setSettings({
      notice: null,
      defaultModel: current,
      providers: { state: "ready", presets: listOf(receipt.presets), providers: listOf(receipt.providers) },
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

  /** agent 段读数（`settings:agent` 读 = `{}`）：`fields` 直落（值 + 敏感只读判据归视图/核）。 */
  async function loadAgent() {
    setSettings({ agent: { ...store.get().settings?.agent, state: "loading" } })
    const receipt = await ask("settings:agent", {})
    if (receipt.ok !== true) {
      setSettings({ agent: { state: "none", fields: [] } })
      report("agent", receipt, "settings:agent")
      return
    }
    setSettings({ notice: null, agent: { state: "ready", fields: listOf(receipt.fields) } })
  }

  /** MCP 段读数（`mcp:list`：只列已配，不连接）。 */
  async function loadMcp() {
    setSettings({ mcp: { ...store.get().settings?.mcp, state: "loading" } })
    const receipt = await ask("mcp:list")
    if (receipt.ok !== true) {
      setSettings({ mcp: { state: "none", servers: [] } })
      report("mcp", receipt, "mcp:list")
      return
    }
    setSettings({ notice: null, mcp: { state: "ready", servers: listOf(receipt.servers) } })
  }

  /** 工具与服务段读数（`index:status` —— R2 · 桌面功能对位批）：回执 `status` 直落（无本项目 ⇒ 主侧零
   *  计数）；回执无 `status` 载体 ⇒ 段归 `none` + 失败面（**零静默** —— 不回退「无 key」假态）。 */
  async function loadIndex() {
    setSettings({ tools: { ...(store.get().settings?.tools ?? {}), state: "loading" } })
    const receipt = await ask("index:status")
    if (receipt.ok !== true) {
      setSettings({ tools: { state: "none", status: null, building: false } })
      report("tools", receipt, "index:status")
      return
    }
    const status = receipt.status !== null && typeof receipt.status === "object" ? receipt.status : null
    if (status === null) {
      setSettings({ tools: { state: "none", status: null, building: false } })
      report("tools", { reason: "invalid-shape" }, "index:status")
      return
    }
    setSettings({ notice: null, tools: { state: "ready", status, building: false } })
  }

  return { loadProviders, loadModels, loadAgent, loadMcp, loadIndex }
}
