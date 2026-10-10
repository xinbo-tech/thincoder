/**
 * run.mjs — 管理面 agent 环装配（agent/ADMIN-AGENT.md §2/§5 ∥ §6 预算；runner-admin-console 批——台账 #1237）：
 * 任务执行的 agent 环 —— 核装载（`@thincoder/core` provider 客户端——KD-SV-78/82）∥ provider 注入（任务提交时选择的模型）
 * ∥ 工具注册（`tools.mjs` 五件）∥ 预算（缺省 20 分钟 ∥ 60 调用——超限停 + 报告）∥ 审计 sink（每调用一条——工具层落）
 * ∥ **无人值守裁剪**（§5：不弹审批/问询、不依赖 TTY、工具不自锁 stdin；记忆/台账/子代理/浏览器族不挂载）。
 *
 * 环语义：`messages`（system 简报 + user 任务）+ 模型 ⇒ 工具调用（逐条执行——结果结构化回灌）⇒ ⋯ ⇒ `report` 终态（成功/失败以 report.ok 为准）。
 * 模型出口 = provider 注册表现有渠道（server 自持 key——与网关同信任域）：`loadCoreChat()` 动载核 provider 客户端；
 * 批内件/agent 假件经 `chat` 注入口替身（缺省 = 核——生产行为不变）。进度 = 读时轮询（无后台常驻——KD-SV-86）。
 */
import { modelEntriesOf } from "../gateway/providers.mjs"

/** 预算缺省（§2——父侧提议：时长 20 分钟 ∥ 工具调用 60 次；超限 ⇒ 停 + 报告）。 */
export const DEFAULT_MAX_CALLS = 60
export const DEFAULT_MAX_DURATION_MS = 20 * 60 * 1000

/** 无人值守裁剪面（§5——保留核 agent 环/工具协议/provider/审计挂钩；下列族不挂载）。 */
export const TRIMMED_FACES = Object.freeze(["approval", "tty", "memory", "ledger", "subagent", "browser", "mcp"])

/** 核装载（KD-SV-78）：动载 `@thincoder/core` provider 客户端（`chat(provider, { messages, tools })`）。
 *  部署前提 = `@thincoder/core` 依赖声明（`package.json`——钉版本）；本仓开发面经注入口替身零依赖。 */
export async function loadCoreChat() {
  const mod = await import("@thincoder/core/provider/index.mjs")
  return mod.chat
}

/** provider 注册表（库单源——读时构建；与网关同源件）：出 = `{ refs, resolve(ref) }`（`refs` = 对外标识集）。 */
export function providerModelRefs(entries = []) {
  const refs = []
  for (const entry of entries) {
    for (const { name, alias } of modelEntriesOf(entry.models)) refs.push(alias ?? `${entry.name}/${name}`)
  }
  return refs
}

/** 模型出口装配（§5）：任务所选 `ref` ⇒ `{ baseURL, apiKey, model }`（核 provider 形）+ 核 `chat` 绑定。
 *  取件 = 库单源 `providers` 行（`env:` 引用经注册表解析——缺位 ⇒ 抛（任务失败面，非静默））。 */
export async function buildModelExit({ db, ref, chatImpl = null, env = process.env } = {}) {
  const { createProviderRegistry, listProviderEntries } = await import("../gateway/providers.mjs")
  const registry = createProviderRegistry(listProviderEntries(db), { env })
  const hit = registry.dispatch(ref)
  if (hit.miss) throw new Error(`模型不可用：${String(ref)}（注册表未命中——提交时选择面已校验，此处为复检）`)
  const provider = hit.provider
  const chat = chatImpl ?? (await loadCoreChat())
  return async ({ messages, tools }) => chat({ baseURL: provider.baseURL, apiKey: provider.apiKey, model: hit.model, name: provider.name }, { messages, tools })
}

/** 回合内工具调用归一（核 `{ id, name, arguments }` ∥ OpenAI `{ id, function:{ name, arguments } }` 两形）。 */
function normalizeToolCalls(toolCalls = []) {
  return (Array.isArray(toolCalls) ? toolCalls : []).map((call, index) => ({
    id: call?.id || `call_${index + 1}`,
    name: call?.name ?? call?.function?.name ?? "",
    arguments: typeof call?.arguments === "string" ? call.arguments : typeof call?.function?.arguments === "string" ? call.function.arguments : "{}",
  }))
}

function parseArgs(text) {
  try {
    const value = JSON.parse(text === "" ? "{}" : text)
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {}
  } catch {
    return null
  }
}

/**
 * 跑一个任务（§2）：`brief` = 系统简报（目标 ∥ 主机 ∥ 验收 ∥ 预算 ∥ 边界）∥ `userMessage` = 任务文本 ∥ `tools` = `tools.mjs` 产物
 * ∥ `chat({ messages, tools })` = 模型出口（注入口径）∥ `onEvent` = 观测（`text` ∥ `call` ∥ `budget` ∥ `terminal`——步骤日志/审计挂点）。
 * 出 = `{ status: "succeeded"|"failed", reason, calls, durationMs, terminal }`（预算超限 ⇒ `failed` + reason 含「预算超限」）。
 */
export async function runAgentTask({ brief, userMessage, tools, chat, maxCalls = DEFAULT_MAX_CALLS, maxDurationMs = DEFAULT_MAX_DURATION_MS, now = Date.now, onEvent = null } = {}) {
  if (typeof chat !== "function") throw new Error("runAgentTask：缺模型出口（chat——注入口径）")
  if (!tools || typeof tools.invoke !== "function") throw new Error("runAgentTask：缺工具面（tools.mjs 产物）")
  const messages = [
    { role: "system", content: String(brief ?? "") },
    { role: "user", content: String(userMessage ?? "") },
  ]
  const started = now()
  let calls = 0
  const finish = (status, reason, terminal = null) => ({ status, reason, calls, durationMs: now() - started, terminal })

  for (;;) {
    const elapsed = now() - started
    if (elapsed > maxDurationMs) {
      const reason = `预算超限（时长 ${Math.round(elapsed / 1000)}s > 上限 ${Math.round(maxDurationMs / 1000)}s）——停 + 报告`
      onEvent?.({ type: "budget", reason })
      return finish("failed", reason)
    }
    if (calls >= maxCalls) {
      const reason = `预算超限（工具调用 ${calls} ≥ 上限 ${maxCalls} 次）——停 + 报告`
      onEvent?.({ type: "budget", reason })
      return finish("failed", reason)
    }
    let turn
    try {
      turn = await chat({ messages, tools: tools.schemas })
    } catch (e) {
      const reason = `模型调用失败：${e?.message ?? e}`
      onEvent?.({ type: "error", reason })
      return finish("failed", reason)
    }
    const content = typeof turn?.content === "string" ? turn.content : ""
    const toolCalls = normalizeToolCalls(turn?.toolCalls)
    if (content.trim() !== "") onEvent?.({ type: "text", text: content })
    if (toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content,
        tool_calls: toolCalls.map((call) => ({ id: call.id, type: "function", function: { name: call.name, arguments: call.arguments } })),
      })
    } else {
      messages.push({ role: "assistant", content })
      const reason = content.trim() !== "" ? "模型未给出终态报告（report）即结束——停 + 报告" : "模型空回合（无工具调用/无文本）——停 + 报告"
      onEvent?.({ type: "error", reason })
      return finish("failed", reason)
    }
    for (const call of toolCalls) {
      if (calls >= maxCalls) {
        const reason = `预算超限（工具调用 ${calls} ≥ 上限 ${maxCalls} 次）——停 + 报告`
        onEvent?.({ type: "budget", reason })
        return finish("failed", reason)
      }
      calls += 1
      const args = parseArgs(call.arguments)
      const result = args === null ? { ok: false, error: "工具入参非 JSON 对象" } : await tools.invoke(call.name, args)
      onEvent?.({ type: "call", name: call.name, args: args ?? {}, result })
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) })
      if (call.name === "report") {
        const terminal = tools.terminal?.() ?? { ok: result.ok === true, summary: "", step: null, readings: null }
        const status = terminal.ok ? "succeeded" : "failed"
        const reason = terminal.summary || (terminal.ok ? "已完成" : "失败（未给原因）")
        onEvent?.({ type: "terminal", terminal })
        return finish(status, reason, terminal)
      }
    }
  }
}
