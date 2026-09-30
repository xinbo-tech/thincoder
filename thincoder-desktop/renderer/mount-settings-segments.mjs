/**
 * mount-settings-segments.mjs — 设置面**段出口族（env ∕ 工具与服务 ∕ MCP）**（R7 · 桌面功能对位批；
 * 「先拆后改」：自 `renderer/mount-settings-exits.mjs` 拆出 —— 300 行层拆分 + 新段出口落点）：env（proxy ∕
 * shell ∕ TestProxy）· 工具与服务（embedding ∕ websearch 两 key · 索引构建）· MCP（增删 + **编辑 ∕ 重连**〔B10 W3
 * S8 ∕ S9〕+ 工具清单 ∕ 探活展开），共**十八**出口；**models 族八出口另档** = `mount-settings-segments-models.mjs`
 * （两档同经本装配面合并）。
 *
 * 接线沿 `createExits` 注入先例：`createSegmentExits(deps)` ——
 * `deps = { ask, store, setSettings, report, clearReport, reads, slot, formOf }`；返回 `{ handlers }`
 * （并回 `mount-settings-exits.mjs` 单一 handlers 表）。
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：出站失败 ⇒ **零乐观写**（不摘项、不改段读数）；
 * 写成功 ⇒ 清失败串 + 复读本段（单源 = 读数供给族 `mount-settings-reads.mjs`）；端侧形判不齐 ⇒ **零发送**
 * （`console.error` 零静默）。基线判据（VSC 同律）：屏值 = 现值 ⇒ **零发送**（幂等门）。
 * **#679 草稿失效声明（四径落三）**：MCP 增 ∕ 改 · tools 钥存（+ 删钥）· env shell 三成功径在**复位写前**声明（`invalidateDrafts(scope)` 注入 —— 作用域取值面 = 视图档 `[data-draft-scope]`；失败径零声明）。
 * **B10 W2 · S6**：两密钥键行删除 ∕ MCP 行移除 ⇒ **不可复得类删除前置确认**（`settings-confirm.mjs`；
 * 驳回 ⇒ 零写；确认 ⇒ 既有删除径 —— 本档两出口换形为「确认门 + 执行径」两层）。
 * **B10 W3 · S8 ∕ S9**：MCP 表单结构化（名 + 类型 select + 三型字段组 —— JSON textarea 退场）——新增
 * ∕ 编辑同表单两态（`form.editing`）；形不齐 ⇒ 零发送 + 段级失败面；重连出口落展开面回执（`reconnect` 类）。
 * 纪律：零 `node:` ∕ 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */
import { confirmSecretDelete } from "./settings-confirm.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")
/** 自定义哨兵（与 `views/settings-sections-env.mjs` 同值 —— 切换输入意图，非写意图）。 */
const CUSTOM_SENTINEL = "__custom__"

/** 键值串解析（`k=v, k2=v2` —— value 可含空格；`k=`（空值）删该项；零项 ⇒ `null`）。源 = VSC
 *  `settings-tools.js:356-369` `parseHeadersLike` 同判（MCP 表单 env ∕ headers 两用）。 */
function parseKv(input) {
  const out = {}
  for (const pair of String(input).split(",")) {
    const eq = pair.indexOf("=")
    if (eq <= 0) continue
    const key = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!key) continue
    if (value) out[key] = value
    else delete out[key]
  }
  return Object.keys(out).length > 0 ? out : null
}

/** MCP 表单 → 载荷 config（S8 结构化；三型字段组 —— VSC `settings-tools.js:112-141` 同判）：
 *  形不齐（该型关键字段空）⇒ `null`（调用面零发送 + 失败面 —— 与 VSC「空输入回落旧值」有意分家：
 *  结构化表单下空 = 用户意图，拒比吞；本裁记录 = 批次档 §5）。 */
function mcpConfigFrom(data, type) {
  if (type === "http" || type === "ws") {
    const url = String(data.get(type === "ws" ? "wsUrl" : "url") ?? "").trim()
    if (url === "") return null
    const token = String(data.get("token") ?? "").trim()
    const headers = parseKv(String(data.get("headers") ?? ""))
    return { [type === "ws" ? "wsUrl" : "url"]: url, ...(token === "" ? {} : { token }), ...(headers === null ? {} : { headers }) }
  }
  const command = String(data.get("command") ?? "").trim()
  if (command === "") return null
  const argsRaw = String(data.get("args") ?? "").trim()
  const env = parseKv(String(data.get("env") ?? ""))
  return { command, args: argsRaw ? argsRaw.split(/\s+/).map((s) => s.trim()).filter(Boolean) : [], ...(env === null ? {} : { env }) }
}

/**
 * 段出口族工厂。`deps.reads = { loadEnv, loadTools, loadMcp, loadAgent }`（读数供给族注入 —— 写后复读）；
 * `deps.slot` = 设置槽锚（key 输入现读作用域）；`deps.formOf` = 表单自取（`mount-settings-exits.mjs` 共用点）。
 */
export function createSegmentExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, reads, slot, formOf, invalidateDrafts } = deps
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

  /** env 写出口（单次 patch；成功 ⇒ 清失败串 + 复读）：失败 ⇒ 段级失败面（**零乐观写**）。
   *  **#679**：shell 写成功 ⇒ 该表单草稿一次性作废（作用域 = 视图档 `[data-draft-scope]` 值 `env:shell`；
   *  proxy 写无草稿面 ⇒ 零声明 —— 取 patch 键判，失败径零声明）。 */
  async function saveEnv(patch) {
    const receipt = await ask("settings:env", { patch })
    if (receipt.ok !== true) {
      report("env", receipt, "settings:env")
      return
    }
    if (patch?.shell !== undefined) invalidateDrafts?.("env:shell")
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
    invalidateDrafts?.(`tools:${kind}`) // #679 成功径：该行草稿一次性作废（值形与视图档 `[data-draft-scope]` 同模板 `tools:<kind>`）
    clearReport()
    setToolsSlice({ edit: null })
    await loadTools()
  }

  /** 密钥行删除**执行径**（清键语义 = 空串 patch —— 主侧摘键；确认面「是」⇒ 本径）。 */
  async function runKeyDelete(kind) {
    const receipt = await ask("settings:tools", { patch: { [kind]: { apiKey: "" } } })
    if (receipt.ok !== true) {
      report("tools", receipt, "settings:tools")
      return
    }
    invalidateDrafts?.(`tools:${kind}`) // #679 同族随修（删钥成功）—— 静止态输入件离场，值形同 `keySave`
    clearReport()
    setToolsSlice({ edit: null })
    await loadTools()
  }

  /** 密钥行删除出口（S6：密钥原文不可复得 ⇒ 前置确认；驳回 ⇒ 零写）。 */
  function keyDelete(kind) {
    confirmSecretDelete(() => { void runKeyDelete(kind) })
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
  /* ── MCP 族（增 ∕ 删 —— R7 随族迁本档；工具清单 ∕ 探活展开 R7 增；结构化表单 ∕ 编辑 ∕ 重连 W3 增）── */

  /** MCP 新增出口（S8 结构化）：`name` + 三型结构化 config（解析归本端 —— 形不齐 ⇒ **零发送** + 段级失败面）。 */
  async function addMcp(event) {
    const form = typeof formOf === "function" ? formOf(event) : null
    if (form === null) return
    const data = new FormData(form)
    const name = String(data.get("name") ?? "").trim()
    const config = mcpConfigFrom(data, data.get("type"))
    if (name === "" || config === null) {
      console.error("[renderer] mcp:save skipped: incomplete structured form")
      report("mcp", { reason: "invalid-shape" }, "mcp:save")
      return
    }
    const receipt = await ask("mcp:save", { name, config })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:save")
      return
    }
    invalidateDrafts?.(typeof form.getAttribute === "function" ? form.getAttribute("data-draft-scope") : null) // #679 成功径：该表单草稿一次性作废（作用域自表单携）
    clearReport()
    setMcpSlice({ form: null })
    await loadMcp()
  }

  /** MCP 编辑出口（S8）：开编辑态（`form.editing` = 名 ⇒ 行 `config` 预填 + 名只读；类型按条目形预置）。 */
  function editMcp(name) {
    const row = listOf(store.get().settings?.mcp?.servers).find((item) => item?.name === name)
    if (row === undefined) {
      console.error(`[renderer] mcp:edit unknown server: ${String(name)}`)
      return
    }
    const cfg = row.config !== null && typeof row.config === "object" ? row.config : {}
    const type = typeof cfg.wsUrl === "string" && cfg.wsUrl !== "" ? "ws" : typeof cfg.url === "string" && cfg.url !== "" ? "http" : "stdio"
    setMcpSlice({ form: { editing: name, type } })
  }

  /** MCP 取消出口（S8）：回新增态（清编辑态 —— 表单字段随重挂回空）。 */
  function cancelMcp() {
    setMcpSlice({ form: null })
  }

  /** 表单现态自读（S8：类型切换 = 重挂 ⇒ 未落盘输入经 `draft` 快照带回 —— 沿 S2 `draft` 先例）：
   *  作用域 = 设置槽内 MCP 表单的 `input[name]` 集；宿主无 DOM 面 ⇒ `null`（零快照）。 */
  function readMcpForm() {
    if (typeof document?.querySelector !== "function") return null
    const scope = document.querySelector(slot)
    const form = scope !== null && typeof scope?.querySelector === "function" ? scope.querySelector('[data-form="mcp"]') : null
    if (form === null || typeof form.querySelectorAll !== "function") return null
    const draft = {}
    for (const node of form.querySelectorAll("input")) {
      const name = typeof node?.getAttribute === "function" ? node.getAttribute("name") : null
      if (typeof name === "string" && name !== "" && typeof node.value === "string") draft[name] = node.value
    }
    return Object.keys(draft).length > 0 ? draft : null
  }

  /** MCP 类型切换出口（S8）：写切片致重挂 —— 三型字段组随切；未落盘输入随 `draft` 快照带回（切换不丢手）。 */
  function mcpFormType(type) {
    const held = store.get().settings?.mcp?.form ?? {}
    const editing = typeof held?.editing === "string" && held.editing !== "" ? held.editing : null
    const draft = readMcpForm()
    setMcpSlice({ form: { editing, type: type === "http" || type === "ws" ? type : "stdio", ...(draft === null ? {} : { draft }) } })
  }

  /** MCP 更新出口（S8 编辑面）：名 = 表单现值（只读不变量）；走 `mcp:update`（原位替换 ∕ 仅落盘径）。 */
  async function updateMcp(event) {
    const form = typeof formOf === "function" ? formOf(event) : null
    if (form === null) return
    const data = new FormData(form)
    const name = String(data.get("name") ?? "").trim()
    const config = mcpConfigFrom(data, data.get("type"))
    if (name === "" || config === null) {
      console.error("[renderer] mcp:update skipped: incomplete structured form")
      report("mcp", { reason: "invalid-shape" }, "mcp:update")
      return
    }
    const receipt = await ask("mcp:update", { name, config })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:update")
      return
    }
    invalidateDrafts?.(typeof form.getAttribute === "function" ? form.getAttribute("data-draft-scope") : null) // #679 成功径：该表单草稿一次性作废（作用域自表单携）
    clearReport()
    setMcpSlice({ form: null })
    await loadMcp()
  }

  /** MCP 移除**执行径**（确认面「是」⇒ 本径）：失败 ⇒ 零乐观摘项。 */
  async function runRemoveMcp(name) {
    const receipt = await ask("mcp:remove", { name })
    if (receipt.ok !== true) {
      report("mcp", receipt, "mcp:remove")
      return
    }
    clearReport()
    await loadMcp()
  }

  /** MCP 移除出口（S6：服务器配置不可复得 ⇒ 前置确认；驳回 ⇒ 零写）。 */
  function removeMcp(name) {
    confirmSecretDelete(() => { void runRemoveMcp(name) })
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

  /** MCP 重连出口（S9）：连期 `reconnecting` 词面 ⇒ 回执两态（成功 ⇒ 计数行 + 行面复读；失败 ⇒ 失败句子面）。 */
  async function mcpReconnect(name) {
    setMcpDetail(name, { kind: "reconnect", state: "loading", tools: null, probe: null, reason: null })
    const receipt = await ask("mcp:reconnect", { name })
    if (receipt.ok !== true) {
      console.error(`[renderer] mcp:reconnect failed: ${reasonOf(receipt)}`)
      setMcpDetail(name, { kind: "reconnect", state: "fail", tools: null, probe: null, reason: reasonOf(receipt) })
      return
    }
    setMcpDetail(name, { kind: "reconnect", state: "ready", tools: Number.isFinite(receipt.tools) ? receipt.tools : null, probe: null, reason: null })
    await loadMcp()
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
    onUpdateMcp: (event) => void updateMcp(event),
    onMcpEdit: (name) => editMcp(name),
    onMcpCancel: () => cancelMcp(),
    onMcpFormType: (type) => mcpFormType(type),
    onRemoveMcp: (name) => void removeMcp(name),
    onMcpTools: (name) => void mcpTools(name),
    onMcpTest: (name) => void mcpTest(name),
    onMcpReconnect: (name) => void mcpReconnect(name),
  }

  return { handlers }
}
