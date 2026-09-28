/**
 * settings-sections-mcp.mjs — 设置面 MCP 段体（R7 · 桌面功能对位批 · 批档 §2 R7 #6；**先拆后改**：段体自立 ——
 * 自 `renderer/views/settings-sections.mjs` 命名面出档，本档 = 单一 owner，原档 re-export ⇒ 分派面零改）。
 *
 * 面形（源 = VSC `settings-tools.js` MCP 卡（`:165-263`）+ 「R7 增」两钮〔`Tools` ∕ `Test`〕）：
 *  ① **行** = 名 + 形词（表外原样）+ 摘要（主侧出口——不含密钥面）+ 三控件（`Tools` 展开 ∕ `Test` 探活 ∕ 移除）；
 *  ② **展开面**（按服务器名 —— `data-mcp-detail-for`）：`Tools` 径 = 逐工具三键行（名 ∕ 描述 ∕ params——
 *     空 params 零段节点）；`Test` 径 = 探活回执一行（`✓ OK — ${count} tools, ${latency}ms`）；两径各两失败面
 *     （连接 ∕ 探活错误串经 `deps.reasonWord` 直传；探期 = 「加载中…」∕「测试中…」两词）；
 *  ③ **表单** = 名 + 配置 JSON（`name` 属性 = 载荷键；JSON 解析归提交端 —— 解析失败零发送）。
 * 三态：`loading` 期零表单（载入中不落半形）；`details` 缺该项 ⇒ 零展开面（禁假造）。
 * 纪律：零 DOM（描述符树）；文案一律经 `t()`；缺 handlers ⇒ `wire` 落 `disabled: true`（诚实非死控）；
 * 零 `node:` ∕ 零裸包。
 */
import { t } from "../i18n.mjs"
import { wire } from "./chat-tool.mjs"

/** 列表切片：缺 / 非数组 ⇒ 空表（零节点 —— 禁假数据）。 */
const listOf = (value) => (Array.isArray(value) ? value : [])

/** MCP 行：名 + 形词（表外原样）+ 摘要（主侧出口——不含密钥面）+ Tools ∕ Test 两钮（R7）+ 移除控件。 */
function mcpRowNode(row, handlers) {
  const onRemove = typeof handlers?.onRemoveMcp === "function" ? () => handlers.onRemoveMcp(row.name) : undefined
  const onTools = typeof handlers?.onMcpTools === "function" ? () => handlers.onMcpTools(row.name) : undefined
  const onTest = typeof handlers?.onMcpTest === "function" ? () => handlers.onMcpTest(row.name) : undefined
  const kind = row.kind === "url" || row.kind === "command" ? t(`settings.mcp.kind.${row.kind}`) : String(row.kind ?? "")
  return {
    tag: "div",
    props: { class: "settings-row", "data-mcp": row.name, "data-kind": row.kind ?? undefined },
    children: [
      { tag: "span", props: { class: "settings-row-name" }, children: [row.name] },
      { tag: "span", props: { class: "settings-row-value" }, children: [kind] },
      { tag: "span", props: { class: "settings-row-value" }, children: [String(row.summary ?? "")] },
      {
        tag: "button",
        props: wire({
          class: "settings-row-action",
          type: "button",
          "data-action": "settings:mcpTools",
          "data-name": row.name,
          "aria-label": t("settings.mcp.tools"),
        }, onTools),
        children: [t("settings.mcp.tools")],
      },
      {
        tag: "button",
        props: wire({
          class: "settings-row-action",
          type: "button",
          "data-action": "settings:mcpTest",
          "data-name": row.name,
          "aria-label": t("settings.mcp.test"),
        }, onTest),
        children: [t("settings.mcp.test")],
      },
      {
        tag: "button",
        props: wire({
          class: "settings-row-action",
          type: "button",
          "data-action": "settings:removeMcp",
          "data-name": row.name,
          "aria-label": t("settings.mcp.remove", { name: row.name }),
        }, onRemove),
        children: [t("settings.mcp.remove", { name: row.name })],
      },
    ],
  }
}

/** MCP 展开面（R7 —— `mcp:tools` 回执落点）：逐工具行（名 + 描述 + params）∕ 探活回执 ∕
 *  两失败面（连接错误串经 `deps.reasonWord` 直传）—— `detail` 缺 ⇒ 零节点。 */
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
  const word = detail.state === "loading"
    ? t(detail.kind === "test" ? "settings.mcp.testing" : "settings.mcp.loading")
    : detail.state === "fail"
      ? (deps.reasonWord(detail.reason) ?? "")
      : detail.kind === "test"
        ? t("settings.mcp.testOk", { count: Number.isFinite(detail.probe?.toolCount) ? detail.probe.toolCount : 0, latency: Number.isFinite(detail.probe?.latencyMs) ? detail.probe.latencyMs : 0 })
        : null
  const children = word !== null
    ? [{ tag: "div", props: { class: "settings-row-value", "data-mcp-detail": detail.kind }, children: [word] }]
    : (rows.length > 0 ? rows : [{ tag: "div", props: { class: "settings-row-value", "data-mcp-detail": detail.kind }, children: [t("settings.mcp.noTools")] }])
  return { tag: "div", props: { class: "settings-mcp-detail", "data-mcp-detail-for": name }, children }
}

/** MCP 表单：名 + 配置 JSON（`name` 属性 = 载荷键；JSON 解析归提交端 —— 解析失败零发送）。 */
function mcpFormNode(handlers) {
  return {
    tag: "form",
    props: { class: "settings-form", "data-form": "mcp" },
    children: [
      { tag: "label", props: { class: "settings-field-label", for: "mcp-name" }, children: [t("settings.mcp.nameLabel")] },
      { tag: "input", props: { class: "settings-field", id: "mcp-name", name: "name", type: "text" } },
      { tag: "label", props: { class: "settings-field-label", for: "mcp-config" }, children: [t("settings.mcp.configLabel")] },
      { tag: "textarea", props: { class: "settings-field", id: "mcp-config", name: "config", rows: "3" }, children: [] },
      {
        tag: "button",
        props: wire(
          { class: "settings-submit", type: "button", "data-action": "settings:addMcp" },
          typeof handlers?.onAddMcp === "function" ? handlers.onAddMcp : undefined,
        ),
        children: [t("settings.mcp.add")],
      },
    ],
  }
}

/** MCP 段体：行（+ 各行展开面）+ 表单（`loading` 期零表单 —— 载入中不落半形）。 */
export function mcpBody(section, handlers, deps = {}) {
  const details = section?.details !== null && typeof section?.details === "object" ? section.details : {}
  const rows = section.servers.flatMap((row) => [mcpRowNode(row, handlers), mcpDetailNode(row.name, details[row.name] ?? null, deps)])
  return [...rows, section.state === "loading" ? null : mcpFormNode(handlers)]
}
