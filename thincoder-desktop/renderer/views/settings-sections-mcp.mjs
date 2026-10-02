/**
 * settings-sections-mcp.mjs — 设置面 MCP 段体（R7 · 桌面功能对位批 · 批档 §2 R7 #6；**先拆后改**：段体自立 ——
 * 自 `renderer/views/settings-sections.mjs` 命名面出档，本档 = 单一 owner，原档 re-export ⇒ 分派面零改）。
 *
 * 面形（源 = VSC `settings-tools.js` MCP 卡（`:165-263`）+ 「R7 增」两钮〔`Tools` ∕ `Test`〕+ **B10 W3 编辑 ∕
 * 重连两面**〔S8 ∕ S9；VSC `:184` ∕ `:186` ∕ `:225-229`〕）：
 *  ① **行** = 名 + 形词（表外原样）+ 摘要（主侧出口——不含密钥面）+ 五控件（`Tools` 展开 ∕ `Edit` 编辑 ∕
 *     `Test` 探活 ∕ `Reconnect` 重连 ∕ 移除 —— VSC 同行序）；
 *  ② **展开面**（按服务器名 —— `data-mcp-detail-for`）：`Tools` 径 = 逐工具三键行（名 ∕ 描述 ∕ params——
 *     空 params 零段节点）；`Test` ∕ `Reconnect` 径 = 回执一行（`✓ OK — ${count} tools, ${latency}ms` ∕
 *     `✓ Reconnected — ${count} tools`）；各径失败面（连接 ∕ 探活错误串经 `deps.reasonWord` 直传；
 *     探期词 = 「加载中…」∕「测试中…」∕「重连中…」）；
 *  ③ **表单**（S8 结构化）= 名（**编辑态只读**——名 = 不变量）+ 类型 `select`（`stdio` ∕ `http` ∕ `ws`）+
 *     三型字段组（按 `section.form.type` 条件渲染；字段集 = VSC `settings-tools.js:60-80` 同族：stdio ⇒
 *     command ∕ args ∕ env · http ⇒ url ∕ token ∕ headers · ws ⇒ wsUrl ∕ token ∕ headers）+ 存 ∕ 消两钮；
 *     `form = null` ⇒ 新增态（空表单）；编辑态 = `form.editing` 非空（**预填 = 行 `config` 现值**
 *     —— `mcp:list` 回执 S8 增键；`config` 缺 / 形不合 ⇒ 空表，零假造）。
 * 三态：`loading` 期零表单（载入中不落半形）；`details` 缺该项 ⇒ 零展开面（禁假造）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`（诚实非死控）；
 * 零 `node:` ∕ 零裸包。
 * **#604 增**：表单字段组（`fieldNode` 可编辑态）携 `data-draft` —— 总闸捕获域；类型 `select` ＝写触发
 * 控件（改即写切片）⇒ 不入域（负向锁面 —— 批档 §2.2 判据 M-604b ∕ M-604c）。
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

/** `env` ∕ `headers` 对象 → 单行输入串（`k=v, k2=v2` —— 与提交端解析互逆；非对象 ⇒ 空串，零假造）。 */
function kvToInput(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return ""
  return Object.entries(value).map(([k, v]) => `${k}=${v}`).join(", ")
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

/** MCP 表单（S8 结构化 —— 名 + 类型 + 三型字段组 + 存 ∕ 消；`form` 缺 ⇒ 新增态空表单）。
 *  编辑态：名只读（不变量）+ 现值直取行 `config` 预填；类型切换 = 出口写切片致重挂（`onMcpFormType`），
 *  未落盘输入经 `form.draft` 快照回填（切换不丢手 —— 沿 S2 `draft` 先例）。
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
      ...fieldNode("settings.mcp.headers", "headers", valueOf("headers", kvToInput(cfg.headers))),
    ]
    : type === "ws"
      ? [
        ...fieldNode("settings.mcp.wsUrl", "wsUrl", valueOf("wsUrl", textOf(cfg.wsUrl))),
        ...fieldNode("settings.mcp.token", "token", valueOf("token", textOf(cfg.token))),
        ...fieldNode("settings.mcp.headers", "headers", valueOf("headers", kvToInput(cfg.headers))),
      ]
      : [
        ...fieldNode("settings.mcp.command", "command", valueOf("command", textOf(cfg.command))),
        ...fieldNode("settings.mcp.args", "args", valueOf("args", Array.isArray(cfg.args) ? cfg.args.join(" ") : "")),
        ...fieldNode("settings.mcp.env", "env", valueOf("env", kvToInput(cfg.env))),
      ]
  const submit = editing === null
    ? { action: "settings:addMcp", word: t("settings.mcp.add"), handler: handlers?.onAddMcp }
    : { action: "settings:updateMcp", word: t("settings.save"), handler: handlers?.onUpdateMcp }
  const buttons = [
    { tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": submit.action }, typeof submit.handler === "function" ? submit.handler : undefined), children: [submit.word] },
  ]
  if (editing !== null) {
    const onCancel = typeof handlers?.onMcpCancel === "function" ? handlers.onMcpCancel : undefined
    buttons.push({ tag: "button", props: wire({ class: "settings-submit", type: "button", "data-action": "settings:mcpCancel" }, onCancel), children: [t("settings.cancel")] })
  }
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

/** MCP 段体：行（+ 各行展开面）+ 表单（`loading` 期零表单 —— 载入中不落半形）。 */
export function mcpBody(section, handlers, deps = {}) {
  const details = section?.details !== null && typeof section?.details === "object" ? section.details : {}
  const rows = section.servers.flatMap((row) => [mcpRowNode(row, handlers), mcpDetailNode(row.name, details[row.name] ?? null, deps)])
  return [...rows, section.state === "loading" ? null : mcpFormNode(section, handlers)]
}
