/**
 * settings-sections-mcp.mjs — 设置面 MCP 段体（R7 · 桌面功能对位批 · 批档 §2 R7 #6；**先拆后改**：段体自立 ——
 * 自 `renderer/views/settings-sections.mjs` 命名面出档，本档 = 单一 owner，原档 re-export ⇒ 分派面零改）。
 *
 * 面形（源 = VSC `settings-tools.js` MCP 卡 + 「R7 增」两钮〔`Tools` ∕ `Test`〕+ **B10 W3 编辑 ∕
 * 重连两面**〔S8 ∕ S9〕+ **#1036 kv 行式输入**）：
 *  ① **行** = 名 + 形词（表外原样）+ 摘要（主侧出口——不含密钥面）+ 五控件（`Tools` 展开 ∕ `Edit` 编辑 ∕
 *     `Test` 探活 ∕ `Reconnect` 重连 ∕ 移除 —— VSC 同行序）；
 *  ② **展开面**（按服务器名 —— `data-mcp-detail-for`）：`Tools` 径 = 逐工具三键行（名 ∕ 描述 ∕ params——
 *     空 params 零段节点）；`Test` ∕ `Reconnect` 径 = 回执一行（`✓ OK — ${count} tools, ${latency}ms` ∕
 *     `✓ Reconnected — ${count} tools`）；各径失败面（连接 ∕ 探活错误串经 `deps.reasonWord` 直传；
 *     探期词 = 「加载中…」∕「测试中…」∕「重连中…」）；
 *  ③ **表单**（S8 结构化）= 名（**编辑态只读**——名 = 不变量）+ 类型 `select`（`stdio` ∥ `http` ∥ `ws`）+
 *     三型字段组（按 `section.form.type` 条件渲染；字段集 = VSC 同族：stdio ⇒ command ∕ args ∥ **env 行集** ·
 *     http ⇒ url ∥ token ∥ **headers 行集** · ws ⇒ wsUrl ∥ token ∥ **headers 行集**）+ 存 ∕ 消两钮；
 *     `form = null` ⇒ 新增态（空表单）；编辑态 = `form.editing` 非空（**预填 = 行 `config` 现值**
 *     —— `mcp:list` 回执 S8 增键；`config` 缺 / 形不合 ⇒ 空表，零假造）；
 *     **#1036**：env ∥ headers = **行式键值编辑器**（每行 = 键格 + 值格 + ✕，行集下「添加行」；
 *     **零项 ⇒ 零行**；行态 = `form.kv`（`{ env ∥ headers ∥ wsHeaders: [{ t, k, v }] }`——令牌单调递增永不复用
 *     ⇒ 草稿闸按 `id` 定位不复灌残值）；行件 = `.settings-field-row` + 两 `.settings-field` + `.settings-row-action`
 *     ✕（零新 CSS）；机制单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-76** ∥ §2.17）。
 * 三态：`loading` 期零表单（载入中不落半形）；`details` 缺该项 ⇒ 零展开面（禁假造）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`（诚实非死控）；
 * 零 `node:` ∕ 零裸包。
 * **#604 增**：表单字段组（`fieldNode` 可编辑态 ∥ kv 行两格）携 `data-draft` —— 总闸捕获域；类型 `select` ＝写触发
 * 控件（改即写切片）⇒ 不入域（负向锁面 —— 批档 §2.2 判据 M-604b ∕ M-604c）。
 * **添加入口弹窗统一批（2026-10-07 · 台账 #1054 · KD-77 ①）**：段体不再常驻表单（`mcpBody` = 行族 + 添加入口钮
 * （新键 `settings.mcpAdd`；锚 `settings:mcpAddOpen`——加载态恒在场）；表单改由弹窗体分支渲出
 * （`mcpFormBody`——`sectionBody("mcpForm")` 消费，零第二份）；新增态补取消钮（词 `settings.cancel`——两态同名钮）。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** MCP 行：名 + 形词（表外原样）+ 摘要（主侧出口——不含密钥面；**D37**：`data-mcp-summary` = 中段伸缩省略点）
 *  + Tools ∕ Edit ∕ Test ∕ Reconnect 四钮 + 移除控件。 */
function mcpRowNode(row, handlers) {
  const onRemove = typeof handlers?.onRemoveMcp === "function" ? () => handlers.onRemoveMcp(row.name) : undefined
  const onTools = typeof handlers?.onMcpTools === "function" ? () => handlers.onMcpTools(row.name) : undefined
  const onEdit = typeof handlers?.onMcpEdit === "function" ? () => handlers.onMcpEdit(row.name) : undefined
  const onTest = typeof handlers?.onMcpTest === "function" ? () => handlers.onMcpTest(row.name) : undefined
  const onReconnect = typeof handlers?.onMcpReconnect === "function" ? () => handlers.onMcpReconnect(row.name) : undefined
  const kind = row.kind === "url" || row.kind === "command" ? t(`settings.mcp.kind.${row.kind}`) : String(row.kind ?? "")
  const button = (action, word, aria, handler) => ({
    tag: "button",
    props: wire({ class: "settings-row-action", type: "button", "data-action": action, "data-name": row.name, "aria-label": aria }, handler),
    children: [word],
  })
  return {
    tag: "div",
    props: { class: "settings-row", "data-mcp": row.name, "data-kind": row.kind ?? undefined },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [row.name] },
      { tag: "span", props: { class: "settings-row-value" }, children: [kind] },
      { tag: "span", props: { class: "settings-row-value", "data-mcp-summary": "" }, children: [String(row.summary ?? "")] },
      button("settings:mcpTools", t("settings.mcp.tools"), t("settings.mcp.tools"), onTools),
      button("settings:mcpEdit", t("settings.mcp.edit"), t("settings.mcp.edit"), onEdit),
      button("settings:mcpTest", t("settings.mcp.test"), t("settings.mcp.test"), onTest),
      button("settings:mcpReconnect", t("settings.mcp.reconnect"), t("settings.mcp.reconnect"), onReconnect),
      button("settings:removeMcp", t("settings.mcp.remove", { name: row.name }), t("settings.mcp.remove", { name: row.name }), onRemove),
    ],
  }
}

/** MCP 展开面（R7 —— `mcp:tools` 回执落点 + S9 重连回执）：逐工具行（名 + 描述 + params）∕ 探活回执 ∕
 *  重连回执 ∕ 失败面（连接错误串经 `deps.reasonWord` 直传）—— `detail` 缺 ⇒ 零节点。
 *  **D37**：工具行 = 竖排三段 + 展开面缩进 24px（VSC `.mcp-tool-row` 同形——样式面住 `renderer/settings.css`）。 */
function mcpDetailNode(name, detail, deps) {
  if (detail === null || typeof detail !== "object") return null
  const rows = listOf(detail.tools).map((tool) => ({
    tag: "div",
    props: { class: "settings-row", "data-mcp-tool": String(tool?.name ?? "") },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [String(tool?.name ?? "")] },
      { tag: "span", props: { class: "settings-row-value" }, children: [String(tool?.description ?? "")] },
      typeof tool?.params === "string" && tool.params !== ""
        ? { tag: "span", props: { class: "settings-row-value", "data-mcp-params": "" }, children: [t("settings.mcp.params", { names: tool.params })] }
        : null,
    ],
  }))
  const loadingWord = detail.kind === "test" ? "settings.mcp.testing" : detail.kind === "reconnect" ? "settings.mcp.reconnecting" : "settings.mcp.loading"
  const word = detail.state === "loading"
    ? t(loadingWord)
    : detail.state === "fail"
      ? (deps.reasonWord(detail.reason) ?? "")
      : detail.kind === "test"
        ? t("settings.mcp.testOk", { count: Number.isFinite(detail.probe?.toolCount) ? detail.probe.toolCount : 0, latency: Number.isFinite(detail.probe?.latencyMs) ? detail.probe.latencyMs : 0 })
        : detail.kind === "reconnect"
          ? t("settings.mcp.reconnectOk", { count: Number.isFinite(detail.tools) ? detail.tools : 0 })
          : null
  const children = word !== null
    ? [{ tag: "div", props: { class: "settings-row-value", "data-mcp-detail": detail.kind }, children: [word] }]
    : (rows.length > 0 ? rows : [{ tag: "div", props: { class: "settings-row-value", "data-mcp-detail": detail.kind }, children: [t("settings.mcp.noTools")] }])
  return { tag: "div", props: { class: "settings-mcp-detail", "data-mcp-detail-for": name }, children }
}

/** 表单字段行（标签 + 文本输入；`name` 属性 = FormData 载荷键）。
 *  `data-draft` = **草稿申报标记**（#604 总闸捕获域 —— 键取 `id` = `mcp-<name>`）；
 *  `readOnly` 态（编辑态名）＝模型镜像（非草稿）⇒ 不申报（入域会掩蔽编辑目标切换）。 */
function fieldNode(labelKey, name, value, readOnly = false) {
  return [
    { tag: "label", props: { class: "settings-field-label", for: `mcp-${name}` }, children: [t(labelKey)] },
    {
      tag: "input",
      props: {
        class: "settings-field", id: `mcp-${name}`, name, type: "text",
        value: typeof value === "string" ? value : "",
        ...(readOnly ? { readOnly: true } : { "data-draft": "" }),
      },
    },
  ]
}

/** 行式键值行集归一（`form.kv[group]` → `[{ t, k, v }]`；缺 ∥ 形不合项剔除——零假造）。 */
function kvRowsOf(value) {
  return listOf(value)
    .filter((row) => row !== null && typeof row === "object" && Number.isInteger(row.t))
    .map((row) => ({ t: row.t, k: typeof row.k === "string" ? row.k : "", v: typeof row.v === "string" ? row.v : "" }))
}

/** 行式键值单行（`.settings-field-row` + 键格 ∥ 值格 + ✕）：`name` = `<group>-k` ∥ `<group>-v`（FormData 配对键——
 *  按 DOM 序逐位配对）；`id` = `mcp-<group>-<k|v>-<t>`（令牌永不复用 ⇒ 草稿闸按 `id` 定位不复灌残值）；
 *  两格携 `data-draft`（#604 捕获 ∥ 复填保输入）；✕ 携令牌（`onMcpKvRemove(group, t)`）。 */
function kvRowNode(group, row, onRemove) {
  return {
    tag: "div",
    props: { class: "settings-field-row", "data-kv-row": group, "data-kv-token": String(row.t) },
    children: [
      {
        tag: "input",
        props: {
          class: "settings-field", type: "text", id: `mcp-${group}-k-${row.t}`, name: `${group}-k`,
          value: row.k, placeholder: t("settings.mcp.kvKey"), "data-kv-part": "k", "data-draft": "",
        },
      },
      {
        tag: "input",
        props: {
          class: "settings-field", type: "text", id: `mcp-${group}-v-${row.t}`, name: `${group}-v`, style: "flex: 2",
          value: row.v, placeholder: t("settings.mcp.kvValue"), "data-kv-part": "v", "data-draft": "",
        },
      },
      {
        tag: "button",
        props: wire({
          class: "settings-row-action", type: "button", "data-action": "settings:mcpKvRemove",
          "data-kv-token": String(row.t), "aria-label": t("settings.mcp.kvRemove"),
        }, onRemove === undefined ? undefined : () => onRemove(row.t)),
        children: ["✕"],
      },
    ],
  }
}

/** 行式键值组（标签 + 行集 + `[+ 添加行]` 钮）：零项 ⇒ 零行（零假造）；缺 handlers ⇒ 两控件 `disabled`（诚实非死控）。 */
function kvFieldNodes(group, labelKey, rows, handlers) {
  const onAdd = typeof handlers?.onMcpKvAdd === "function" ? () => handlers.onMcpKvAdd(group) : undefined
  const onRemove = typeof handlers?.onMcpKvRemove === "function" ? (token) => handlers.onMcpKvRemove(group, token) : undefined
  return [
    { tag: "label", props: { class: "settings-field-label" }, children: [t(labelKey)] },
    ...rows.map((row) => kvRowNode(group, row, onRemove)),
    {
      tag: "button",
      props: wire({ class: "settings-submit", type: "button", "data-action": "settings:mcpKvAdd", "data-kv-group": group }, onAdd),
      children: [t("settings.mcp.kvAdd")],
    },
  ]
}

/** MCP 表单（S8 结构化 —— 名 + 类型 + 三型字段组 + 存 ∕ 消；`form` 缺 ⇒ 新增态空表单）。
 *  编辑态：名只读（不变量）+ 现值直取行 `config` 预填；类型切换 = 出口写切片致重挂（`onMcpFormType`），
 *  未落盘输入经 `form.draft` 快照回填（切换不丢手 —— 沿 S2 `draft` 先例）；行值单源 = `form.kv`（#1036）。
 *  **KD-77 ①**：表单弹窗体（`mcpFormBody`）单件 —— 新增 ∥ 编辑两态同框（标题逐态归树面）；取消钮两态同名。
 *  `data-draft-scope` = 表单身份面（#604 总闸作用域键：新增 ∕ 改名各一骨 —— 身份换 ⇒ 旧草稿不复填）。 */
function mcpFormNode(section, handlers) {
  const form = section?.form !== null && typeof section?.form === "object" ? section.form : null
  const editing = form !== null && typeof form.editing === "string" && form.editing !== "" ? form.editing : null
  const type = form !== null && (form.type === "http" || form.type === "ws") ? form.type : "stdio"
  const row = editing === null ? undefined : listOf(section?.servers).find((item) => item?.name === editing)
  const cfg = row?.config !== null && typeof row?.config === "object" && !Array.isArray(row.config) ? row.config : {}
  const draft = form !== null && form.draft !== null && typeof form.draft === "object" && !Array.isArray(form.draft) ? form.draft : null
  const valueOf = (name, fallback) => (draft !== null && typeof draft[name] === "string" ? draft[name] : fallback)
  const textOf = (value) => (typeof value === "string" ? value : "")
  const kv = form !== null && form.kv !== null && typeof form.kv === "object" && !Array.isArray(form.kv) ? form.kv : null
  const kvRows = (group) => (kv === null ? [] : kvRowsOf(kv[group]))
  const onType = typeof handlers?.onMcpFormType === "function" ? (event) => handlers.onMcpFormType(String(event?.target?.value ?? "")) : undefined
  const typeSelect = {
    tag: "select",
    props: onType === undefined
      ? { class: "settings-field", id: "mcp-type", name: "type", value: type, disabled: true }
      : { class: "settings-field", id: "mcp-type", name: "type", value: type, onChange: onType },
    children: ["stdio", "http", "ws"].map((value) => ({
      tag: "option",
      props: value === type ? { value, selected: true } : { value },
      children: [value],
    })),
  }
  const group = type === "http"
    ? [
      ...fieldNode("settings.mcp.url", "url", valueOf("url", textOf(cfg.url))),
      ...fieldNode("settings.mcp.token", "token", valueOf("token", textOf(cfg.token))),
      ...kvFieldNodes("headers", "settings.mcp.headers", kvRows("headers"), handlers),
    ]
    : type === "ws"
      ? [
        ...fieldNode("settings.mcp.wsUrl", "wsUrl", valueOf("wsUrl", textOf(cfg.wsUrl))),
        ...fieldNode("settings.mcp.token", "token", valueOf("token", textOf(cfg.token))),
        ...kvFieldNodes("wsHeaders", "settings.mcp.headers", kvRows("wsHeaders"), handlers),
      ]
      : [
        ...fieldNode("settings.mcp.command", "command", valueOf("command", textOf(cfg.command))),
        ...fieldNode("settings.mcp.args", "args", valueOf("args", Array.isArray(cfg.args) ? cfg.args.join(" ") : "")),
        ...kvFieldNodes("env", "settings.mcp.env", kvRows("env"), handlers),
      ]
  const submit = editing === null
    ? { action: "settings:addMcp", word: t("settings.mcp.add"), handler: handlers?.onAddMcp }
    : { action: "settings:updateMcp", word: t("settings.save"), handler: handlers?.onUpdateMcp }
  // 取消钮 = 两态同名（KD-77 ①——新增态补钮；出口 = 关弹窗，切片复位随关）；缺 handler ⇒ `wire` 落 `disabled`。
  const onCancel = typeof handlers?.onMcpCancel === "function" ? handlers.onMcpCancel : undefined
  const buttons = [
    { tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": submit.action }, typeof submit.handler === "function" ? submit.handler : undefined), children: [submit.word] },
    { tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": "settings:mcpCancel" }, onCancel), children: [t("settings.cancel")] },
  ]
  return {
    tag: "form",
    props: { class: "settings-form", "data-form": "mcp", "data-mcp-form": editing === null ? "add" : "edit", "data-draft-scope": editing === null ? "add" : `edit:${editing}` },
    children: [
      ...fieldNode("settings.mcp.nameLabel", "name", editing !== null ? editing : valueOf("name", ""), editing !== null),
      { tag: "label", props: { class: "settings-field-label", for: "mcp-type" }, children: [t("settings.mcp.type")] },
      typeSelect,
      ...group,
      ...buttons,
    ],
  }
}

/** 添加入口钮（KD-77 ①）：锚 `settings:mcpAddOpen` + 词 `settings.mcpAdd`（值逐字同 VSC）；缺 handler ⇒ `wire` 落 `disabled`。 */
function mcpAddButton(handlers) {
  const onAdd = typeof handlers?.onMcpAddOpen === "function" ? () => handlers.onMcpAddOpen() : undefined
  return {
    tag: "button",
    props: wire({ class: "settings-submit", type: "button", "data-action": "settings:mcpAddOpen" }, onAdd),
    children: [t("settings.mcpAdd")],
  }
}

/** MCP 段体（KD-77 ①）：行（+ 各行展开面）+ 添加入口钮（**恒在场** —— 读链不遮入口，沿 `providersBody` 先例）；
 *  原常驻表单退场 ⇒ 弹窗体分支（`mcpFormBody`）渲出。 */
export function mcpBody(section, handlers, deps = {}) {
  const details = section?.details !== null && typeof section?.details === "object" ? section.details : {}
  const rows = section.servers.flatMap((row) => [mcpRowNode(row, handlers), mcpDetailNode(row.name, details[row.name] ?? null, deps)])
  return [...rows, mcpAddButton(handlers)]
}

/** MCP 表单弹窗体（KD-77 ① —— `sectionBody("mcpForm")` 消费，零第二份）：载入中零表单（沿段体旧闸 ——
 *  载入中不落半形）；`loading` 外 = 表单唯内容面（名 ∥ 类型 ∥ 三型字段组 ∥ 存 ∥ 取消）。 */
export function mcpFormBody(section, handlers) {
  return section?.state === "loading" ? [] : [mcpFormNode(section, handlers)]
}
