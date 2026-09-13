import { C } from "./ansi.mjs"

/** MCP.md §5 v2（D-1）：edit/add 统一字段 picker 表单机制。
 *  fieldPicker 循环：picker 列字段行（label + 当前值打码）+ `✓ Save & test` 末行；
 *  选中字段 → askQuestion 只输入该字段新值——空=不变、`-`=删除可选字段、`k=`=删除
 *  header/env 项、required 字段拒绝 `-`（不许删空）→ 回 picker（已改值保留——T18b
 *  中间 Esc 回 picker 不丢）；选 `✓ Save & test` → 必填校验（add 含 name 重复检查）
 *  → 调用方走 F2 预览+探活确认环；探活失败回同一 picker（AC2——独立 retry 路径废除）。
 *  本文件为 v1 cmd-mcp.mjs 的 mergeKeyValuePairs/maskToken 迁移落点（逗号分隔 kv 解析
 *  并入 mergeKeyValuePairs——v2 的 headers/env 输入统一按"键值对合并/删除"语义处理，
 *  原 parseHeaders 整段替换语义不再需要）；拆分前置——cmd-mcp.mjs 499 行压 500 硬限，评审 #1）。 */

/** F3 评审 #3 清除语义（T12）：`k=`（空 value）= 从 merged 中删除该项；`k=v` = 设置。
 *  返回更新后的对象（无项时 null——调用方据此 delete 字段）。 */
function mergeKeyValuePairs(merged, input) {
  for (const pair of String(input).split(",")) {
    const eq = pair.indexOf("=")
    if (eq > 0) {
      const key = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
      if (!key) continue
      if (value) merged[key] = value
      else delete merged[key]
    }
  }
  return Object.keys(merged).length > 0 ? merged : null
}

/** F2（评审 #6）：预览 token 遮蔽——len > 12 显示前 4 字符 + "…"，否则全遮。 */
export function maskToken(token) {
  const t = String(token ?? "")
  if (!t) return ""
  return t.length > 12 ? `${t.slice(0, 4)}…` : "•".repeat(t.length)
}

/** edit 工作副本——headers/env/args 嵌套独立；fieldPicker 原地改副本，取消/失败不
 *  污染原配置（零副作用）。 */
export function cloneEntry(srv) {
  return {
    ...srv,
    headers: srv.headers ? { ...srv.headers } : undefined,
    env: srv.env ? { ...srv.env } : undefined,
    args: srv.args ? [...srv.args] : undefined,
  }
}

const FIELD_LABELS = {
  name: "Name",
  url: "HTTP URL",
  wsUrl: "WebSocket URL",
  token: "Token",
  headers: "Headers",
  command: "Command",
  args: "Args",
  env: "Env",
}

/** F3/F3b：字段行顺序——add 含 name（可编辑、`(required)` 标注）；edit 无 name 行
 *  （name 不可改）。HTTP: url/token/headers；WS: wsUrl/token/headers；stdio:
 *  command/args/env。 */
function fieldsFor(transport, mode) {
  const base = transport === "ws" ? ["wsUrl", "token", "headers"]
    : transport === "stdio" ? ["command", "args", "env"]
    : ["url", "token", "headers"]
  return mode === "add" ? ["name", ...base] : base
}

/** 必填字段（F3b 校验口径）：name + transport 的端点/命令字段。 */
function requiredFieldsFor(transport) {
  return transport === "ws" ? ["name", "wsUrl"]
    : transport === "stdio" ? ["name", "command"]
    : ["name", "url"]
}

/** edit 模式的 transport 由 entry 推导（AI 生成的 entry 同理——url/wsUrl/command 判定）。 */
function deriveTransport(entry) {
  return entry.wsUrl ? "ws" : entry.url ? "http" : "stdio"
}

/** 单行显示值截断——picker 行宽控制（URL/command 可能很长）。 */
function shortVal(value, max = 32) {
  const v = String(value ?? "")
  return v.length > max ? `${v.slice(0, max - 1)}…` : v
}

/** F3 字段行显示：label 右侧打码/摘要（`Name (required)`、`Token d90c26bb…`、
 *  `Headers 2 items`）。必填空 → (required)（add 初始标注——F3b）；可选空 → (none)。 */
function fieldDisplay(entry, field, { add, required }) {
  const v = entry[field]
  if (field === "headers" || field === "env") return `${Object.keys(v ?? {}).length} items`
  if (field === "args") return (v ?? []).length ? shortVal(v.join(" ")) : "(none)"
  if (field === "token") return v ? maskToken(v) : "(none)"
  // name/url/wsUrl/command：端点与命令非机密——截断显示
  if (v) return shortVal(v)
  return add && required ? "(required)" : "(none)"
}

/** picker 行集：字段行（action `field:<name>`）+ 末行 `✓ Save & test`（action "save"）。
 *  label 补齐对齐（最小 10 列——F3 示例形态 `Token     d90c26bb…`）。 */
function formEntries(entry, transport, mode) {
  const fields = fieldsFor(transport, mode)
  const required = requiredFieldsFor(transport)
  const pad = Math.max(10, Math.max(...fields.map((f) => FIELD_LABELS[f].length)) + 1)
  return [
    ...fields.map((f) => ({
      type: "item",
      text: `${FIELD_LABELS[f].padEnd(pad)} ${fieldDisplay(entry, f, { add: mode === "add", required: required.includes(f) })}`,
      action: `field:${f}`,
    })),
    { type: "item", text: "✓ Save & test", action: "save" },
  ]
}

/** 字段输入提示 `(current: …)`——token 打码（maskToken）、headers/env 列键值对、
 *  args 空格串接；空值 → "none"。 */
function currentText(entry, field) {
  const v = entry[field]
  if (field === "token") return v ? maskToken(v) : "none"
  if (field === "headers" || field === "env") {
    const pairs = Object.entries(v ?? {}).map(([k, val]) => `${k}=${val}`)
    return pairs.length ? pairs.join(", ") : "none"
  }
  if (field === "args") return (v ?? []).length ? v.join(" ") : "none"
  return String(v ?? "") || "none"
}

const PROMPT_BASES = {
  name: "Server name",
  url: "HTTP URL",
  wsUrl: "WebSocket URL",
  token: "Auth token (Bearer, optional; '-' clears, empty keeps)",
  headers: "Headers (key=value, comma-separated; key= removes; empty keeps; '-' clears all)",
  command: "Command",
  args: "Arguments (space-separated; '-' clears, empty keeps)",
  env: "Environment variables (key=value, comma-separated; key= removes; empty keeps; '-' clears all)",
}

function fieldPrompt(entry, field) {
  return `${PROMPT_BASES[field]} (current: ${currentText(entry, field)}):`
}

/** 字段输入应用（UI 决策 #3）：空=不变；`-`=删除可选字段（token/headers/env/args）；
 *  `k=`=删 header/env 项；required 字段（name/url/wsUrl/command）拒绝 `-`——必填不许删空。
 *  返回错误文案（调用方 pushLine）或 null。 */
function applyFieldInput(entry, field, input, required) {
  if (required) {
    if (input === "-") return `${FIELD_LABELS[field]} is required — cannot be cleared`
    if (input) entry[field] = input
    return null
  }
  if (field === "token") {
    if (input === "-") delete entry.token
    else if (input) entry.token = input
  } else if (field === "headers" || field === "env") {
    if (input === "-") delete entry[field]
    else if (input) {
      const updated = mergeKeyValuePairs(entry[field] ? { ...entry[field] } : {}, input)
      if (updated) entry[field] = updated
      else delete entry[field]
    }
  } else if (field === "args") {
    if (input === "-") delete entry.args
    else if (input) entry.args = input.split(/\s+/)
  }
  return null
}

/** D-1 表单循环（F3/F3b——一处实现两处复用；F2 字段级重试 = 复用同一 picker）。
 *  entry 为工作副本：已改值在循环间保留（Esc/空输入不丢——T18b）。
 *  返回 { action: "save" | "cancel", entry }；cancel = picker 层 Esc（放弃整个表单）。 */
export async function fieldPicker(ctx, { title, mode, entry, transport, existingNames = [] }) {
  const { showPicker, askQuestion, pushLine } = ctx
  const tr = transport ?? deriveTransport(entry)
  const required = requiredFieldsFor(tr)
  for (;;) {
    const sel = await showPicker(title, formEntries(entry, tr, mode))
    if (!sel) return { action: "cancel", entry }
    if (sel.action === "save") {
      // F3b：Save 校验必填非空——未满足提示并留在 picker（不落盘）
      const missing = fieldsFor(tr, mode).filter((f) => required.includes(f) && !String(entry[f] ?? "").trim())
      if (missing.length) {
        pushLine(`[mcp] Missing required: ${missing.map((f) => FIELD_LABELS[f]).join(", ")} — fill before saving`, C.error)
        continue
      }
      if (mode === "add" && entry.name && existingNames.includes(entry.name)) {
        pushLine(`[mcp] "${entry.name}" already exists`, C.error)
        continue
      }
      return { action: "save", entry }
    }
    const field = sel.action.slice("field:".length)
    const raw = ((await askQuestion(fieldPrompt(entry, field))) ?? "").trim()
    const err = applyFieldInput(entry, field, raw, required.includes(field))
    if (err) pushLine(`[mcp] ${err}`, C.error)
    // 循环回 picker——已改值保留（T18b：中间 Esc 回 picker 不丢）
  }
}
