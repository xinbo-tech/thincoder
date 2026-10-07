/**
 * mount-settings-segments-mcp.mjs — 设置面 **MCP 段出口族**（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036；
 * 「先拆后改」：自 `renderer/mount-settings-segments.mjs` 拆出 —— 越 300 在册预案「MCP 族再出一档」兑现）：
 * MCP 增 ∕ 改 · 编辑 · 类型切换 · 移除 · 工具清单 · 探活 · 重连 + **kv 行加 ∕ 删两出口**，共**十一**出口。
 * 接线沿三先例：`createMcpExits(deps)`（`deps = { ask, store, setSettings, report, clearReport, reads, formOf,
 * invalidateDrafts }`）⇒ `{ handlers }` 并回 `mount-settings-exits.mjs` 单一 handlers 表（装配即合并，对外零改）。
 * 机制与判据单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-76** ∥ §2.17（行令牌态 × 加删两出口 × 类型切换 × 提交
 * 四判据 × `readMcpForm` 不采行件）；现读面 = **文档序末位 MCP 表单**（页体 ∥ 组弹窗体——弹窗体挂 `body` 尾）；随族迁来的 S6 ∕ S8 ∕ S9 与 #679 语义零改（单源 = 迁出前版本 + IPC.md §2）。
 * 纪律：零 `node:` ∕ 零裸包 · 端侧失败零静默（`console.error`）· 逐通道回执形单源 = IPC.md §2。
 */
import { confirmSecretDelete } from "./settings-confirm.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])
/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")
/** 行令牌序（表单内单调递增 · **永不复用** —— 草稿闸按 `id` 定位，复用会把残值灌进新行）。 */
let kvTokenSeq = 0
const nextKvToken = () => { kvTokenSeq += 1; return kvTokenSeq }
/** 键值对象 → 行集（`Object.entries` 序 = 插入序；缺 ∥ 形不合 ⇒ 零行 —— 零假造）。 */
function kvRowsFrom(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return []
  return Object.entries(value).map(([k, v]) => ({ t: nextKvToken(), k: String(k), v: String(v) }))
}
/** 条目 config → 三组行令牌态（http ∥ ws 两组同源自条目 `headers` —— 与视图两处 label 同键同判）。 */
function kvStateFrom(cfg) {
  return { env: kvRowsFrom(cfg?.env), headers: kvRowsFrom(cfg?.headers), wsHeaders: kvRowsFrom(cfg?.headers) }
}
/** 组行集归一（切片形 → `{ t, k, v }` 三键；形不合项剔除）。 */
function kvRowsOf(value) {
  return listOf(value)
    .filter((row) => row !== null && typeof row === "object" && Number.isInteger(row.t))
    .map((row) => ({ t: row.t, k: typeof row.k === "string" ? row.k : "", v: typeof row.v === "string" ? row.v : "" }))
}
/** 类型 → 行组（stdio ⇒ `env` ∥ http ⇒ `headers` ∥ ws ⇒ `wsHeaders`）。 */
const groupOfType = (type) => (type === "http" ? "headers" : type === "ws" ? "wsHeaders" : "env")
/** 行件配对（DOM 序逐位）：键 ∥ 值 trim；空键行 ∥ 空值行不提交；重复键后行胜；零项 ⇒ `null`（键缺席 = 清空）。 */
function kvFromForm(data, group) {
  const keys = data.getAll(`${group}-k`)
  const values = data.getAll(`${group}-v`)
  const out = {}
  const count = Math.min(keys.length, values.length)
  for (let i = 0; i < count; i += 1) {
    const key = String(keys[i] ?? "").trim()
    const value = String(values[i] ?? "").trim()
    if (key === "" || value === "") continue
    out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}

/** MCP 表单 → 载荷 config（S8 结构化）：形不齐（该型关键字段空）⇒ `null`（零发送 + 失败面——与 VSC「空输入回落旧值」有意分家：结构化表单下空 = 用户意图，拒比吞）。 */
function mcpConfigFrom(data, type) {
  if (type === "http" || type === "ws") {
    const url = String(data.get(type === "ws" ? "wsUrl" : "url") ?? "").trim()
    if (url === "") return null
    const token = String(data.get("token") ?? "").trim()
    const headers = kvFromForm(data, type === "ws" ? "wsHeaders" : "headers")
    return { [type === "ws" ? "wsUrl" : "url"]: url, ...(token === "" ? {} : { token }), ...(headers === null ? {} : { headers }) }
  }
  const command = String(data.get("command") ?? "").trim()
  if (command === "") return null
  const argsRaw = String(data.get("args") ?? "").trim()
  const env = kvFromForm(data, "env")
  return { command, args: argsRaw ? argsRaw.split(/\s+/).map((s) => s.trim()).filter(Boolean) : [], ...(env === null ? {} : { env }) }
}

/** MCP 段出口族工厂（`deps.reads.loadMcp` = 写后复读口；`deps.formOf` = 表单自取，主档共用点回注）。 */
export function createMcpExits(deps = {}) {
  const { ask, store, setSettings, report, clearReport, reads, formOf, invalidateDrafts } = deps
  const { loadMcp } = reads ?? {}

  /** MCP 段切片局部写（引用不变 ⇒ 零通知 —— 同值写零重绘）。 */
  const setMcpSlice = (patch) => {
    const held = store.get().settings?.mcp ?? {}
    setSettings({ mcp: { ...held, ...patch } })
  }
  /** 表单行令牌态归一（`form.kv` 缺 ∥ 形不合 ⇒ 三组空表）。 */
  const kvOf = (form) => {
    const kv = form !== null && typeof form === "object" && form.kv !== null && typeof form.kv === "object" ? form.kv : {}
    return { env: kvRowsOf(kv.env), headers: kvRowsOf(kv.headers), wsHeaders: kvRowsOf(kv.wsHeaders) }
  }
  /** MCP 表单现读面（**宿主无关**）：设置页体 ∥ 组弹窗体（`settings-modal.mjs` 卡挂 `body` 尾 ⇒ 文档序末位即交互面；
   *  菜单「组弹窗」径页闭 ⇒ 槽内零表单——末位 = 弹窗体）。无 DOM 面 ⇒ `null`（退化式）。 */
  function mcpFormNode() {
    if (typeof document?.querySelectorAll !== "function") return null
    const forms = document.querySelectorAll('[data-form="mcp"]')
    const form = forms.length > 0 ? forms[forms.length - 1] : null
    return form !== null && typeof form.querySelectorAll === "function" ? form : null
  }
  /** 行集自读（本组行件 —— DOM 序）：无表单面 ⇒ `null`（退化式 —— 同 `readMcpForm`）。 */
  function readKvRows(group) {
    const form = mcpFormNode()
    if (form === null) return null
    const rows = []
    for (const node of form.querySelectorAll(`[data-kv-row="${group}"]`)) {
      const key = typeof node?.querySelector === "function" ? node.querySelector('[data-kv-part="k"]') : null
      const value = typeof node?.querySelector === "function" ? node.querySelector('[data-kv-part="v"]') : null
      const raw = typeof node?.getAttribute === "function" ? node.getAttribute("data-kv-token") : null
      const token = raw === null || raw === "" ? NaN : Number(raw)
      rows.push({ t: Number.isInteger(token) ? token : nextKvToken(), k: String(key?.value ?? ""), v: String(value?.value ?? "") })
    }
    return rows
  }
  /** 行态写前基（保留 `editing ∥ type ∥ draft`；缺 `type` ⇒ 按组回填 —— 防新增态表单丢型）。 */
  function kvBase(form, group) {
    const held = form !== null && typeof form === "object" ? form : {}
    const type = held.type === "http" || held.type === "ws" ? held.type : group === "env" ? "stdio" : group === "wsHeaders" ? "ws" : "http"
    return { ...held, type }
  }
  /** 当前组行集同步（写前自读 —— 无 DOM ⇒ 切片原样；随 `form.type` 取组）。 */
  function syncKv(form) {
    const current = kvOf(form)
    const group = groupOfType(form?.type)
    const rows = readKvRows(group)
    return rows === null ? current : { ...current, [group]: rows }
  }
  /** kv 行加出口（S8 行式键值）：自读本组行集 ⇒ 尾附一空行 ⇒ 写切片致重挂（#604 两闸捕获 ∥ 复填保输入）。 */
  function kvAdd(group) {
    const form = store.get().settings?.mcp?.form ?? null
    const rows = readKvRows(group)
    if (rows === null) {
      console.error(`[renderer] mcp:kv skipped: no DOM rows for ${String(group)}`)
      return
    }
    setMcpSlice({ form: { ...kvBase(form, group), kv: { ...kvOf(form), [group]: [...rows, { t: nextKvToken(), k: "", v: "" }] } } })
  }
  /** kv 行删出口（按令牌定点摘行）：自读本组行集；表外令牌 ⇒ 零变化 ⇒ 零写（零静默）。 */
  function kvRemove(group, token) {
    const form = store.get().settings?.mcp?.form ?? null
    const rows = readKvRows(group)
    if (rows === null) {
      console.error(`[renderer] mcp:kv skipped: no DOM rows for ${String(group)}`)
      return
    }
    const next = rows.filter((row) => row.t !== token)
    if (next.length === rows.length) {
      console.error(`[renderer] mcp:kv skipped: unknown row token ${String(token)}`)
      return
    }
    setMcpSlice({ form: { ...kvBase(form, group), kv: { ...kvOf(form), [group]: next } } })
  }
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

  /** MCP 编辑出口（S8）：开编辑态（`form.editing` = 名 ⇒ 行 `config` 预填 + 名只读；类型按条目形预置）；行令牌态 =
   *  条目 `config` 三组生成（令牌取新号，永不复用）。 */
  function editMcp(name) {
    const row = listOf(store.get().settings?.mcp?.servers).find((item) => item?.name === name)
    if (row === undefined) {
      console.error(`[renderer] mcp:edit unknown server: ${String(name)}`)
      return
    }
    const cfg = row.config !== null && typeof row.config === "object" ? row.config : {}
    const type = typeof cfg.wsUrl === "string" && cfg.wsUrl !== "" ? "ws" : typeof cfg.url === "string" && cfg.url !== "" ? "http" : "stdio"
    setMcpSlice({ form: { editing: name, type, kv: kvStateFrom(cfg) } })
  }
  /** MCP 取消出口（S8）：回新增态（清编辑态 —— 表单字段随重挂回空）。 */
  function cancelMcp() {
    setMcpSlice({ form: null })
  }

  /** 表单现态自读（S8：类型切换 = 重挂 ⇒ 未落盘输入经 `draft` 快照带回 —— 沿 S2 先例）：`input[name]` 集（**kv 行件不采** —— 行值归令牌态；重复 `name` 单值槽会塌缩）；无表单面 ⇒ `null`。 */
  function readMcpForm() {
    const form = mcpFormNode()
    if (form === null) return null
    const draft = {}
    for (const node of form.querySelectorAll("input")) {
      if (typeof node?.hasAttribute === "function" && node.hasAttribute("data-kv-part")) continue
      const name = typeof node?.getAttribute === "function" ? node.getAttribute("name") : null
      if (typeof name === "string" && name !== "" && typeof node.value === "string") draft[name] = node.value
    }
    return Object.keys(draft).length > 0 ? draft : null
  }

  /** MCP 类型切换出口（S8）：写切片致重挂 —— 三型组随切；未落盘输入随 `draft` 带回；**行值捕获 = 与加删出口同一「自读 DOM 行集」面**（同拍同步 —— 不采 `draft` 快照）。 */
  function mcpFormType(type) {
    const held = store.get().settings?.mcp?.form ?? {}
    const editing = typeof held?.editing === "string" && held.editing !== "" ? held.editing : null
    const draft = readMcpForm()
    const kv = syncKv(held)
    setMcpSlice({ form: { editing, type: type === "http" || type === "ws" ? type : "stdio", kv, ...(draft === null ? {} : { draft }) } })
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

  /** 段出口族表（锚名逐字 = 视图 `data-action` 同域）。 */
  const handlers = {
    onAddMcp: (event) => void addMcp(event),
    onUpdateMcp: (event) => void updateMcp(event),
    onMcpEdit: (name) => editMcp(name),
    onMcpCancel: () => cancelMcp(),
    onMcpFormType: (type) => mcpFormType(type),
    onMcpKvAdd: (group) => kvAdd(group),
    onMcpKvRemove: (group, token) => kvRemove(group, token),
    onRemoveMcp: (name) => void removeMcp(name),
    onMcpTools: (name) => void mcpTools(name),
    onMcpTest: (name) => void mcpTest(name),
    onMcpReconnect: (name) => void mcpReconnect(name),
  }

  return { handlers }
}
