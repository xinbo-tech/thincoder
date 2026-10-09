import { C } from "./ansi.mjs"
// #58（hygiene-sweep 批）∥ #1046：headers/env 行集现值 ∥ 问句脱敏判据 = 核 settings 同源单点（不再各自为政）。
import { isSensitiveKey } from "@thincoder/core/agent-tools/settings.mjs"

/** MCP.md §5 v2（D-1）：edit/add 统一字段 picker 表单机制。
 *  fieldPicker 循环：picker 列字段行（label + 当前值打码）+ `✓ Save & test` 末行；
 *  选中字段 → askQuestion 只输入该字段新值——空=不变、`-`=删除可选字段、required 字段
 *  拒绝 `-`（不许删空）→ 回 picker（已改值保留——T18b 中间 Esc 回 picker 不丢）；
 *  选 `✓ Save & test` → 必填校验（add 含 name 重复检查）→ 调用方走 F2 预览+探活确认环；
 *  探活失败回同一 picker（AC2——独立 retry 路径废除）。
 *  **headers / env = 逐对行集编辑**（#1046 行集化 · 2026-10-10，口径单源 = docs/core/design/MCP.md
 *  §6.5）：选中该字段 ⇒ 行集选择器（每行 = 一对 `k=<值/掩码>`——敏感值掩码沿 `isSensitiveKey`
 *  单源；末两行 `＋ Add row` ∥ `← Back`）→ 选某对问值 ∥ `＋ Add row` 问 `key=value`；提交四判据
 *  同 GUI 两端行格（trim ∥ 空键/空值行不提交 ∥ 重复键后行胜 ∥ 全空 ⇒ 字段删除）；值 = 字面——
 *  串式半语法（comma-split ∥ 引号剥离 ∥ `-` 整串清空）退场。本文件亦为 v1 cmd-mcp.mjs 的
 *  maskToken 迁移落点（拆分前置——cmd-mcp.mjs 499 行压 500 硬限，评审 #1）。 */

/** 行集字段面字（提示语 / 拒收文案共用；`title` = 行级词，`field` = 字段词）。 */
const PAIR_LABELS = {
  headers: { title: "Header", field: "Headers" },
  env: { title: "Env var", field: "Env" },
}

/** #1046 行集编辑（headers/env——逐对；终端原生载体 = 既有 `showPicker` + `askQuestion`，零新组件类）。
 *  语义沿 GUI 两端行格编辑器四判据（口径单源 = `docs/core/design/MCP.md` §6.5）：trim ∥ 空键/空值
 *  行不提交（拒 + 提示）∥ 重复键后行胜 ∥ 全空 ⇒ 字段删除；值 = 字面（零引号剥离 ∥ 零逗号切分——
 *  逗号/等号/引号/空格原样）。Esc ∥ `← Back` ⇒ 回字段 picker（已改值不丢——T18b 同径）。 */
async function editPairs(ctx, entry, field, title) {
  const { showPicker, askQuestion, pushLine } = ctx
  const words = PAIR_LABELS[field]
  for (;;) {
    const sel = await showPicker(`${title} · ${words.field}`, [
      ...Object.entries(entry[field] ?? {}).map(([k, v]) => ({
        type: "item",
        text: `${k}=${isSensitiveKey(k) ? "••••" : String(v)}`, // 敏感键值位脱敏（核 settings 同源谓词）
        action: `row:${k}`,
      })),
      { type: "item", text: "＋ Add row", action: "add" },
      { type: "item", text: "← Back", action: "back" },
    ])
    if (!sel || sel.action === "back") return
    if (sel.action === "add") {
      const raw = ((await askQuestion(`${words.title} entry (key=value):`)) ?? "").trim()
      const eq = raw.indexOf("=")
      if (eq === -1) { pushLine(`[mcp] ${words.title} entry needs key=value — not added`, C.error); continue }
      const key = raw.slice(0, eq).trim()
      const value = raw.slice(eq + 1).trim()
      if (!key) { pushLine(`[mcp] ${words.title} key is empty — not added`, C.error); continue }
      if (!value) { pushLine(`[mcp] ${words.title} value is empty — not added`, C.error); continue }
      entry[field] = { ...(entry[field] ?? {}), [key]: value } // 重复键 = 后行胜（同键赋值 ⇒ 原位覆盖）
      continue
    }
    const key = sel.action.slice("row:".length)
    const shown = isSensitiveKey(key) ? "••••" : String(entry[field]?.[key] ?? "")
    const input = ((await askQuestion(`${words.title} "${key}" (current: ${shown}; '-' removes; empty keeps):`)) ?? "").trim()
    if (input === "-") {
      const next = { ...entry[field] }
      delete next[key]
      if (Object.keys(next).length > 0) entry[field] = next
      else delete entry[field] // 全删 ⇒ 字段删除（沿 GUI「全空 ⇒ 字段删除」）
    } else if (input) {
      entry[field] = { ...entry[field], [key]: input } // 值 = 字面（引号不剥——串式半语法退场）
    }
  }
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

/** 字段输入提示 `(current: …)`——token 打码（maskToken）、args 空格串接；空值 → "none"。
 *  headers/env 不入本径（行集编辑——现值列示 ∥ 脱敏在 `editPairs` 行集面）。 */
function currentText(entry, field) {
  const v = entry[field]
  if (field === "token") return v ? maskToken(v) : "none"
  if (field === "args") return (v ?? []).length ? v.join(" ") : "none"
  return String(v ?? "") || "none"
}

const PROMPT_BASES = {
  name: "Server name",
  url: "HTTP URL",
  wsUrl: "WebSocket URL",
  token: "Auth token (Bearer, optional; '-' clears, empty keeps)",
  command: "Command",
  args: "Arguments (space-separated; '-' clears, empty keeps)",
}

function fieldPrompt(entry, field) {
  return `${PROMPT_BASES[field]} (current: ${currentText(entry, field)}):`
}

/** 字段输入应用（UI 决策 #3）：空=不变；`-`=删除可选字段（token/args）；required 字段
 *  （name/url/wsUrl/command）拒绝 `-`——必填不许删空。headers/env 不入本径（行集编辑——
 *  `editPairs`：空=不变 ∥ `-`=删该行）。返回错误文案（调用方 pushLine）或 null。 */
function applyFieldInput(entry, field, input, required) {
  if (required) {
    if (input === "-") return `${FIELD_LABELS[field]} is required — cannot be cleared`
    if (input) entry[field] = input
    return null
  }
  if (field === "token") {
    if (input === "-") delete entry.token
    else if (input) entry.token = input
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
    if (field === "headers" || field === "env") {
      await editPairs(ctx, entry, field, title) // #1046：行集编辑（Esc ∥ `← Back` 回本 picker）
      continue
    }
    const raw = ((await askQuestion(fieldPrompt(entry, field))) ?? "").trim()
    const err = applyFieldInput(entry, field, raw, required.includes(field))
    if (err) pushLine(`[mcp] ${err}`, C.error)
    // 循环回 picker——已改值保留（T18b：中间 Esc 回 picker 不丢）
  }
}
