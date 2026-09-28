/**
 * mount-settings-segments.mjs — 设置面**段出口族（env ∕ 工具与服务 ∕ MCP）**（R7 · 桌面功能对位批；
 * 「先拆后改」：自 `renderer/mount-settings-exits.mjs` 拆出 —— 300 行层拆分 + 新段出口落点）：env（proxy ∕
 * shell ∕ TestProxy）· 工具与服务（embedding ∕ websearch 两 key · 索引构建）· MCP（增删 + 工具清单 ∕ 探活展开），
 * 共**十三**出口；**models 族八出口另档** = `mount-settings-segments-models.mjs`（两档同经本装配面合并）。
 *
 * 接线沿 `createExits` 注入先例：`createSegmentExits(deps)` ——
 * `deps = { ask, store, setSettings, report, clearReport, reads, slot, formOf }`；返回 `{ handlers }`
 * （并回 `mount-settings-exits.mjs` 单一 handlers 表）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；
 * 写成功 ⇒ 清失败串 + 复读本段（单源 = 读数供给族 `mount-settings-reads.mjs`）；端侧形判不齐 ⇒ **零发送**
 * （`console.error` 零静默）。基线判据（VSC 同律）：屏值 = 现值 ⇒ **零发送**（幂等门）。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")
/** 自定义哨兵（与 `views/settings-sections-env.mjs` 同值 —— 切换输入意图，非写意图）。 */
const CUSTOM_SENTINEL = "__custom__"

/**
 * 段出口族工厂。`deps.reads = { loadEnv, loadTools, loadMcp, loadAgent }`（读数供给族注入 —— 写后复读）；
 * `deps.slot` = 设置槽锚（key 输入现读作用域）；`deps.formOf` = 表单自取（`mount-settings-exits.mjs` 共用点）。
 */
export function createSegmentExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, reads, slot, formOf } = deps
  const { loadEnv, loadTools, loadMcp, loadAgent } = reads ?? {}

  /** 段切片局部写（引用不变 ⇒ 零通知 —— 同值写零重绘）。 */
  const setEnvSlice = (patch) => {
    const held = store.get().settings?.env ?? {}
    setSettings({ env: { ...held, ...patch } })
  }
  const setToolsSlice = (patch) => {
    const held = store.get().settings?.tools ?? {}
    setSettings({ tools: { ...held, ...patch } })
  }
  const setMcpSlice = (patch) => {
    const held = store.get().settings?.mcp ?? {}
    setSettings({ mcp: { ...held, ...patch } })
  }

  /* ── env 族（`settings:env`：proxy ∕ shell ∕ TestProxy）────────────────────────────────── */

  /** env 写出口（单次 patch；成功 ⇒ 清失败串 + 复读）：失败 ⇒ 段级失败面（**零乐观写**）。 */
  async function saveEnv(patch) {
    const receipt = await ask("settings:env", { patch })
    if (receipt.ok !== true) {
      report("env", receipt, "settings:env")
      return
    }
    clearReport()
    await loadEnv()
  }

  /** proxy 单字段出口（VSC 同律基线门：屏值 = 现值 ⇒ 零发送；payload 只含本次被编辑字段）。 */
  function proxyField(field, value) {
    const held = store.get().settings?.env?.proxy ?? {}
    const current = field === "uri" ? (typeof held.uri === "string" ? held.uri : "") : held[field] === true
    if (value === current) return
    void saveEnv({ proxy: { [field]: value } })
  }

  /** shell `select` 出口（VSC 同门）：哨兵 ⇒ 零动作（切换输入意图）；值 = 系统默认（空）∥ 候选值。 */
  function shellSelect(value) {
    if (value === CUSTOM_SENTINEL) return
    const held = store.get().settings?.env?.shell?.current ?? null
    const target = value === "" ? null : value
    if (target === held) return
    void saveEnv({ shell: value })
  }

  /** shell 自定义路径出口（VSC 路径册 #3）：空值 = 未完成输入 ⇒ **零发送**；同现值 ⇒ 零发送。 */
  function shellCustom(value) {
    const trimmed = typeof value === "string" ? value.trim() : ""
    if (trimmed === "") return
    if (trimmed === (store.get().settings?.env?.shell?.current ?? null)) return
    void saveEnv({ shell: trimmed })
  }

  /** TestProxy 出口（`{ testProxy: { uri } }` —— 主侧转口 `providers.mjs` `testProxy`）：探期 `running`
   *  词面 + 回执两态落段切片（读数面恒显 —— 零静默）。 */
  async function testProxy() {
    const uri = store.get().settings?.env?.proxy?.uri ?? ""
    setEnvSlice({ test: { state: "running", status: null, error: null } })
    const receipt = await ask("settings:env", { testProxy: { uri } })
    setEnvSlice({
      test: {
        state: receipt.ok === true ? "ok" : "fail",
        status: Number.isFinite(receipt.status) ? receipt.status : null,
        error: typeof receipt.error === "string" && receipt.error !== "" ? receipt.error : null,
      },
    })
  }

  /* ── 工具与服务族（`settings:tools` 两 key + `index:build`）────────────────────────────── */

  /** 密钥行存出口（编辑态输入现值 ⇒ 写）：空值 ⇒ **零发送**（清键归删除出口）。 */
  async function keySave(kind) {
    const input = typeof document?.querySelector === "function" ? document.querySelector(`${slot} [data-key-input="${kind}"]`) : null
    const value = typeof input?.value === "string" ? input.value.trim() : ""
    if (value === "") {
      console.error(`[renderer] settings:tools skipped: empty key for ${kind}`)
      return
    }
    const receipt = await ask("settings:tools", { patch: { [kind]: { apiKey: value } } })
    if (receipt.ok !== true) {
      report("tools", receipt, "settings:tools")
      return
    }
    clearReport()
    setToolsSlice({ edit: null })
    await loadTools()
  }

  /** 密钥行删除出口（清键语义 = 空串 patch —— 主侧摘键）。 */
  async function keyDelete(kind) {
    const receipt = await ask("settings:tools", { patch: { [kind]: { apiKey: "" } } })
    if (receipt.ok !== true) {
      report("tools", receipt, "settings:tools")
      return
    }
    clearReport()
    setToolsSlice({ edit: null })
    await loadTools()
  }

  /** 索引构建出口（`index:build` —— R2 落，R7 随族迁本档）：构建期段面置 `building`（钮禁用 + 「构建中…」
   *  —— VSC 钮同拍禁用同律）；**成败皆复读状态**（VSC `buildIndex` 尾 `pushIndexStatus` 同律 —— 部分成功径
   *  也随真值刷新计数）；失败径 ⇒ **复读后**落段级失败面（失败串不被复读清位）；**零乐观写**。 */
  async function buildIndex() {
    setToolsSlice({ state: "ready", building: true })
    const receipt = await ask("index:build")
    await loadTools()
    if (receipt.ok !== true) {
      report("tools", receipt, "index:build")
      return
    }
    clearReport()
  }
  /* ── MCP 族（增 ∕ 删 —— R7 随族迁本档；工具清单 ∕ 探活展开 R7 增）──────────────────────── */

  /** MCP 新增出口：`config` **JSON 解析归提交端** —— 解析失败 / 空名 ⇒ **零发送** + 段级失败面。 */
  async function addMcp(event) {
    const form = typeof formOf === "function" ? formOf(event) : null
    if (form === null) return
    const data = new FormData(form)
    const name = String(data.get("name") ?? "")
    const raw = String(data.get("config") ?? "")
    if (name === "") {
      console.error("[renderer] mcp:save: empty name")
      report("mcp", { reason: "invalid-shape" }, "mcp:save")
      return
    }
    let config = null
    try {
      config = JSON.parse(raw)
    } catch (error) {
      console.error("[renderer] mcp:save: config is not JSON:", error?.message ?? error)
      report("mcp", { reason: "invalid-shape" }, "mcp:save")
      return
    }
    const receipt = await ask("mcp:save", { name, config })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:save")
      return
    }
    clearReport()
    await loadMcp()
  }

  /** MCP 移除出口：失败 ⇒ 零乐观摘项。 */
  async function removeMcp(name) {
    const receipt = await ask("mcp:remove", { name })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:remove")
      return
    }
    clearReport()
    await loadMcp()
  }

  /** MCP 展开面写（按服务器名落 `details` 切片 —— 复读不清展开面）。 */
  function setMcpDetail(name, detail) {
    const held = store.get().settings?.mcp?.details ?? {}
    setMcpSlice({ details: { ...held, [String(name)]: detail } })
  }

  /** MCP 工具清单出口（`mcp:tools` `{ name }`）：连期 `loading` 词面 ⇒ 逐工具行 ∥ 失败串直传（展开面承载）。 */
  async function mcpTools(name) {
    setMcpDetail(name, { kind: "tools", state: "loading", tools: [], probe: null, reason: null })
    const receipt = await ask("mcp:tools", { name })
    if (receipt.ok !== true) {
      console.error(`[renderer] mcp:tools failed: ${reasonOf(receipt)}`)
      setMcpDetail(name, { kind: "tools", state: "fail", tools: [], probe: null, reason: reasonOf(receipt) })
      return
    }
    setMcpDetail(name, { kind: "tools", state: "ready", tools: listOf(receipt.tools), probe: null, reason: null })
  }

  /** MCP 探活出口（`mcp:tools` `{ name, test: true }`）：回执 `{ toolCount, latencyMs }` ⇒ 一行词面。 */
  async function mcpTest(name) {
    setMcpDetail(name, { kind: "test", state: "loading", tools: [], probe: null, reason: null })
    const receipt = await ask("mcp:tools", { name, test: true })
    if (receipt.ok !== true) {
      console.error(`[renderer] mcp:tools(test) failed: ${reasonOf(receipt)}`)
      setMcpDetail(name, { kind: "test", state: "fail", tools: [], probe: null, reason: reasonOf(receipt) })
      return
    }
    setMcpDetail(name, { kind: "test", state: "ready", tools: [], probe: { toolCount: receipt.toolCount ?? null, latencyMs: receipt.latencyMs ?? null }, reason: null })
  }

  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域；models 族八项经 `mount-settings-segments-models.mjs` 另表）。 */
  const handlers = {
    onProxyField: (field, value) => proxyField(field, value),
    onShellSelect: (value) => shellSelect(value),
    onShellCustom: (value) => shellCustom(value),
    onTestProxy: () => void testProxy(),
    onKeyEdit: (kind) => setToolsSlice({ edit: kind }),
    onKeyCancel: () => setToolsSlice({ edit: null }),
    onKeySave: (kind) => void keySave(kind),
    onKeyDelete: (kind) => void keyDelete(kind),
    onBuildIndex: () => void buildIndex(),
    onAddMcp: (event) => void addMcp(event),
    onRemoveMcp: (name) => void removeMcp(name),
    onMcpTools: (name) => void mcpTools(name),
    onMcpTest: (name) => void mcpTest(name),
  }

  return { handlers }
}
