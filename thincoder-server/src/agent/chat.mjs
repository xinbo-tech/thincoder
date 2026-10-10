/**
 * chat.mjs — 聊天式驱动（`agent/ADMIN-AGENT.md` §11 ∥ KD-SV-88/89；admin-agent-chat 批——台账 #1254）：
 * 会话装配（系统简报 + 历史重放）∥ 回合环（预算 ∥ 工具循环——与任务式同一环语义）∥ 帧流编解码（`delta`/`call`/`result`/`end`）
 * ∥ 逐条落库（库两表——v14）∥ 终态收尾（成功 ∥ 模型错误 ∥ 预算超限 ∥ 空回合）∥ 重启收尾（`running` ⇒ `idle` + notice）。
 *
 * 回合语义（§11）：用户发一条 ⇒ 环跑到**自然结束**（模型无工具调用 = 成功——与任务式的 `report` 终态不同源故本档自持环体；
 * 预算常量/模型出口装配与 `run.mjs` **同源复用**——`DEFAULT_MAX_CALLS`/`DEFAULT_MAX_DURATION_MS`/`loadCoreChat`）。终止四形：
 * ① 自然结束（`succeeded`）∥ ② 预算超限 `budget` ∥ ③ 模型出口抛错 `model_error` ∥ ④ 空回合 `empty_turn`——②③④ ⇒ notice 行 + `chat_stop` 审计 + `end` 帧 `failed`。
 * ②③ 下已生成文本 ⇒ `assistant` 行如实落库（部分文本——回放逐字一致；与 notice 行各自一行）；零文本 ⇒ 零 `assistant` 行。
 *
 * 口径：**执行不依赖连接**（断连照跑到终态——落库单源；`emit` 写失败即吞，回合不受影响）；消息逐条增量落库（KD-SV-89）；
 * 审计 = `agent_event`（`chat_call` 逐调用 ∥ `chat_stop` 异常收尾——KD-SV-91；`chat_start` 归 `chat-routes.mjs`）；
 * 秘密零入库（工具入参 `apiKey` 等敏感键 ⇒ 摘要掩蔽后入帧/入库/入审计）；工具结果 = 模型可见形（截断 ≤4000 字——回放逐字一致）。
 * 注入缝（§11——批内件依托）：模型出口 ∥ 工具面 = **模块级 setter + 参数覆盖**（默认 `null` ⇒ 回落真件，生产行为不变）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { findMemberById } from "../accounts/members.mjs"
import { HttpError } from "../gateway/errors.mjs"
import { createChatTools } from "./chat-tools.mjs"
import { DEFAULT_MAX_CALLS, DEFAULT_MAX_DURATION_MS, loadCoreChat } from "./run.mjs"
import { maskSecrets } from "./tools.mjs"

/** 会话状态（库 CHECK 两值——v14 段）。 */
export const CHAT_STATUSES = Object.freeze(["idle", "running"])
/** 消息角色（库 CHECK 四值——v14 段；notice = 回放滤除的收尾行）。 */
export const CHAT_ROLES = Object.freeze(["user", "assistant", "tool", "notice"])
/** notice `data.reason` 枚举（**四值定稿**——重启收尾 ∥ 预算超限 ∥ 模型错误 ∥ 空回合；父侧 2026-10-11 裁）。 */
export const CHAT_NOTICE_REASONS = Object.freeze(["restart", "budget", "model_error", "empty_turn"])

/** 工具结果落库上限（模型可见形——KD-SV-89/§11「≤4000 字：回放逐字一致」）。 */
export const CHAT_TOOL_CONTENT_MAX = 4000
/** `call` 帧 `args` 摘要上限（字符串；掩蔽后截断——§11/`gateway/API.md` §2.8）。 */
export const CHAT_CALL_ARGS_MAX = 500
/** `result` 帧摘要上限（掩蔽后——同上）。 */
export const CHAT_RESULT_SUMMARY_MAX = 300
/** 会话列表 `excerpt` 上限（首条用户消息截断——`gateway/API.md` §2.8）。 */
export const CHAT_EXCERPT_MAX = 40

/** 系统简报（§11——管理面用途句 + 行动纪律句；提示词级，非机制门）。 */
export const CHAT_SYSTEM_BRIEF = [
  "你是 ThinCoder server 的管理面 agent（聊天式驱动）。用途 = 运维/管理：托管接入 ∥ 机队（节点/容器）∥ 成员与 provider 管理 ∥ 审查排障——非开发用途。",
  "你可以调用管理面工具（members ∥ providers ∥ models ∥ usage ∥ audit ∥ runners ∥ docker）直接读写 server 管理面；工具结果 = `{ ok, … }`（`ok:false` 时看 message 自行纠正或改路线）。",
  "",
  "# 行动纪律",
  "- 先查后动：先取读数（list ∥ summary ∥ 详情），再动作；不确定 ⇒ 问用户。",
  "- 结果用逐句人话；读数引用工具返回的原值。",
  "- 破坏性动作（删节点 ∥ 吊销凭据 ∥ 重置密码 ∥ 删 provider ∥ 停模型）先说明将做什么、再执行。",
  "- 报错说清停在哪一步与原因；不臆测、不编造读数。",
].join("\n")

/** 回合终态文案（②③④——人话；`content` 面；notice 行同落）。 */
export function noticeTextOf(reason, detail = null) {
  if (reason === "restart") return "server 重启——本轮中断（如实收尾）"
  if (reason === "budget") return detail ?? "预算超限——本轮已停"
  if (reason === "model_error") return detail ? `模型调用失败：${detail}` : "模型调用失败——本轮中断"
  if (reason === "empty_turn") return "模型空回合（无文本无工具调用）——本轮无输出"
  return String(detail ?? reason)
}

// ── 注入缝（§11——模块级；默认 null ⇒ 回落真件）───────────────────────────────
let injectedChat = null
let injectedTools = null

/** 模块级注入（批内件：假模型出口 ∥ 假工具面）；README = 默认 null（生产行为不变）。 */
export function setChatTestDeps({ chat = null, tools = null } = {}) {
  injectedChat = chat
  injectedTools = tools
}

/** 当前注入面（诊断/收尾复位用）。 */
export function getChatTestDeps() {
  return { chat: injectedChat, tools: injectedTools }
}

// ── 库面（会话 ∥ 消息序——v14 两表；读时读，无后台常驻）───────────────────────

function parseJson(text, fallback = null) {
  try {
    const value = JSON.parse(text ?? "")
    return value === null || typeof value !== "object" ? fallback : value
  } catch {
    return fallback
  }
}

/** 会话行 or 404（`not_found`）。 */
export function chatRowOr404(db, id) {
  const row = db.prepare("SELECT * FROM agent_chats WHERE id = ?").get(Number(id))
  if (!row) throw new HttpError("not_found", `会话不存在：${String(id)}`)
  return row
}

/** 会话读数（§2.8 行形——`excerpt` = 首条用户消息截断 ≤40 字；无消息 ⇒ 空串）。 */
export function chatView(db, row) {
  const first = db.prepare("SELECT content FROM agent_chat_messages WHERE chat_id = ? AND role = 'user' ORDER BY seq LIMIT 1").get(row.id)
  const content = typeof first?.content === "string" ? first.content : ""
  return {
    id: row.id,
    model: row.model,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    excerpt: content.length > CHAT_EXCERPT_MAX ? content.slice(0, CHAT_EXCERPT_MAX) : content,
  }
}

/** 会话列表（倒序——新在前）。 */
export function listChats(db, { limit = 100 } = {}) {
  const rows = db.prepare("SELECT * FROM agent_chats ORDER BY id DESC LIMIT ?").all(Number(limit))
  return { chats: rows.map((row) => chatView(db, row)) }
}

/** 消息读数（§2.8 行形；`data` = 附加形解码；序 = `seq` 升序）。 */
export function messageView(row) {
  return {
    seq: row.seq,
    role: row.role,
    content: row.content,
    data: parseJson(row.data_json, null),
    createdAt: row.created_at,
  }
}

/** 消息全量（seq 升序）。 */
export function listMessages(db, chatId) {
  return db.prepare("SELECT * FROM agent_chat_messages WHERE chat_id = ? ORDER BY seq").all(Number(chatId))
}

/** 会话详情（`{ chat, messages }`——不存在 ⇒ null）。 */
export function getChatDetail(db, id) {
  const row = db.prepare("SELECT * FROM agent_chats WHERE id = ?").get(Number(id))
  if (!row) return null
  return { chat: chatView(db, row), messages: listMessages(db, row.id).map(messageView) }
}

/** 建会话（`model` 合法性归路由面——KD-SV-87 同判）：出 = 会话行。 */
export function createChat(db, { model, createdBy = null, now = Date.now } = {}) {
  const ts = new Date(now()).toISOString()
  const info = db.prepare("INSERT INTO agent_chats (model, status, created_by, created_at, updated_at) VALUES (?, 'idle', ?, ?, ?)").run(String(model), createdBy, ts, ts)
  return db.prepare("SELECT * FROM agent_chats WHERE id = ?").get(Number(info.lastInsertRowid))
}

/** 追加一条消息（`seq` = 会话内自增——逐条增量落库）。出 = 行。 */
export function appendMessage(db, chatId, { role, content = "", data = null, now = Date.now } = {}) {
  if (!CHAT_ROLES.includes(role)) throw new Error(`消息角色非法：${String(role)}（${CHAT_ROLES.join(" ∥ ")}）`)
  const ts = new Date(now()).toISOString()
  const info = db
    .prepare(
      `INSERT INTO agent_chat_messages (chat_id, seq, role, content, data_json, created_at)
       VALUES (?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM agent_chat_messages WHERE chat_id = ?), ?, ?, ?, ?)`,
    )
    .run(Number(chatId), Number(chatId), role, String(content ?? ""), data === null ? null : JSON.stringify(data), ts)
  db.prepare("UPDATE agent_chats SET updated_at = ? WHERE id = ?").run(ts, Number(chatId))
  return db.prepare("SELECT * FROM agent_chat_messages WHERE id = ?").get(Number(info.lastInsertRowid))
}

// ── 在途门（`running` ⇒ 400 人话——单文单源：路由预检 ∥ 置位两处同用）────────

/** 在途门报文（§11/E40——单文单源）。 */
export const CHAT_BUSY_MESSAGE = "本会话正在执行——等它结束"

/** 在途门 + 置在途（**同步段**——检查与置位无 await 间点，单写者下无竞态）：`running` ⇒ 400 人话。 */
export function claimChatTurn(db, id, { now = Date.now } = {}) {
  const row = chatRowOr404(db, id)
  assertChatIdle(row)
  db.prepare("UPDATE agent_chats SET status = 'running', updated_at = ? WHERE id = ?").run(new Date(now()).toISOString(), row.id)
  return db.prepare("SELECT * FROM agent_chats WHERE id = ?").get(row.id)
}

/** 在途门只读预检（报文与置位同一个——路由按 §2.8 行序先检在途再校模型）。 */
export function assertChatIdle(row) {
  if (row.status === "running") throw new HttpError("invalid_request_error", CHAT_BUSY_MESSAGE)
  return row
}

/** 收尾（回合终结 ⇒ `idle`；`updated_at` 随动）。 */
export function settleChatIdle(db, id, { now = Date.now } = {}) {
  db.prepare("UPDATE agent_chats SET status = 'idle', updated_at = ? WHERE id = ?").run(new Date(now()).toISOString(), Number(id))
}

/**
 * 重启收尾（§11 ∥ KD-SV-86——装配期执行，无端点）：在途 `running` ⇒ `idle` + notice 行（`restart`）+ `chat_stop` 审计；
 * 已落库消息零动。出 = 收尾会话数。
 */
export function resumeRunningChats(db, { now = Date.now } = {}) {
  const rows = db.prepare("SELECT * FROM agent_chats WHERE status = 'running' ORDER BY id").all()
  for (const row of rows) {
    settleChatIdle(db, row.id, { now })
    appendMessage(db, row.id, { role: "notice", content: noticeTextOf("restart"), data: { reason: "restart" }, now })
    recordAudit(db, {
      type: "agent_event",
      actor: actorNameOf(db, row.created_by),
      actorId: row.created_by ?? null,
      target: `chat:${row.id}`,
      detail: { kind: "chat_stop", chatId: row.id, reason: "restart", summary: noticeTextOf("restart") },
      ts: now(),
    })
  }
  return rows.length
}

/** 行为人名快照（会话发起 admin——`agent_event` actor 口径 = 名快照 ∥ 缺 ⇒ "admin"）。 */
function actorNameOf(db, memberId) {
  if (memberId === null || memberId === undefined) return "admin"
  return findMemberById(db, Number(memberId))?.name ?? "admin"
}

// ── 重放与编解码 ─────────────────────────────────────────────────────────────

/** 历史重放（§11/KD-SV-89）：库行 ⇒ 模型消息数组（**notice 滤除**；assistant 携 `tool_calls`；tool 携 `tool_call_id`）。 */
export function replayMessages(rows = []) {
  const messages = []
  for (const row of rows) {
    if (row.role === "user") {
      messages.push({ role: "user", content: row.content })
      continue
    }
    if (row.role === "assistant") {
      const data = parseJson(row.data_json, null)
      const calls = Array.isArray(data?.toolCalls) ? data.toolCalls : []
      if (calls.length > 0) {
        messages.push({
          role: "assistant",
          content: row.content,
          tool_calls: calls.map((call) => ({
            id: call.id,
            type: "function",
            function: { name: call.name, arguments: typeof call.args === "string" ? call.args : JSON.stringify(call.args ?? {}) },
          })),
        })
      } else {
        messages.push({ role: "assistant", content: row.content })
      }
      continue
    }
    if (row.role === "tool") {
      const data = parseJson(row.data_json, null)
      messages.push({ role: "tool", tool_call_id: data?.toolCallId ?? "", content: row.content })
    }
    // notice ⇒ 滤除（收尾行不入模型上下文——§11）
  }
  return messages
}

/** 回合装配（系统简报 + 历史重放 + 本轮消息——§11）。 */
export function buildTurnMessages(rows = []) {
  return [{ role: "system", content: CHAT_SYSTEM_BRIEF }, ...replayMessages(rows)]
}

/** 回合内工具调用归一（核 `{ id, name, arguments }` ∥ OpenAI `{ id, function:{ name, arguments } }` 两形——同任务面口径）。 */
export function normalizeToolCalls(toolCalls = []) {
  return (Array.isArray(toolCalls) ? toolCalls : []).map((call, index) => ({
    id: call?.id || `call_${index + 1}`,
    name: call?.name ?? call?.function?.name ?? "",
    arguments: typeof call?.arguments === "string" ? call.arguments : typeof call?.function?.arguments === "string" ? call.function.arguments : "{}",
  }))
}

/** 工具入参解析（非 JSON 对象 ⇒ null——调用侧落工具级错误，回合不停）。 */
export function parseToolArgs(text) {
  try {
    const value = JSON.parse(text === "" ? "{}" : text)
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

/** 敏感键名（入参摘要掩蔽——秘密零入帧/库/审计；provider 密钥面 ⟮apiKey⟯ 为主）。 */
const SENSITIVE_KEYS = Object.freeze(["apikey", "secret", "password", "sudosecret", "token", "authorization", "newpassword", "oldpassword"])

/** 入参掩蔽（深拷——敏感键值 ⇒ `"***"`；键名大小写无关）。 */
export function maskArgs(value) {
  if (Array.isArray(value)) return value.map((item) => maskArgs(item))
  if (value === null || typeof value !== "object") return value
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEYS.includes(String(key).toLowerCase()) ? "***" : maskArgs(item)
  }
  return out
}

// ── 截断口径（上限含注记——总长不越设计上限：`args` ≤500 ∥ 摘要 ≤300 ∥ 工具结果 ≤4000）────────

/** 尾注截断（`max` = 含注记总长上限——设计句「截断 ≤N 字」字面成立）。 */
export function capText(text, max, note = "…（截断）") {
  const value = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  if (value.length <= max) return value
  const room = Math.max(0, max - note.length)
  return `${value.slice(0, room)}${note}`
}

/** 工具结果落库截断（模型可见形——KD-SV-89/§11「≤4000 字：回放逐字一致」）。 */
export function capToolContent(text) {
  const value = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  return capText(value, CHAT_TOOL_CONTENT_MAX, `…（截断——实长 ${value.length}）`)
}

/** `call` 帧 `args` = **字符串**摘要（JSON 序列化 ⇒ 掩蔽后截断 ≤500 字——恒为字符串，非对象；§11）。 */
export function argsTextOf(rawArguments) {
  const parsed = parseToolArgs(rawArguments)
  const source = parsed === null ? String(rawArguments ?? "") : JSON.stringify(maskArgs(parsed))
  return capText(maskSecrets(source, []), CHAT_CALL_ARGS_MAX)
}

/** 敏感值集（本轮工具入参中的敏感键值——下游文本一并掩蔽；沿任务面 `maskSecrets(text, secrets)` 口径）。 */
export function secretValuesOf(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) secretValuesOf(item, out)
    return out
  }
  if (value === null || typeof value !== "object") return out
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.includes(String(key).toLowerCase())) {
      if (typeof item === "string" && item.length >= 4) out.push(item) // 短值不掩（会误伤普通文本——沿任务面 maskSecrets 门）
      continue
    }
    secretValuesOf(item, out)
  }
  return out
}

/** 工具结果摘要（`result` 帧 ∥ tool 行 `data.summary`——掩蔽后截断 ≤300 字）。 */
export function summaryOfResult(result, secrets = []) {
  const base = typeof result?.summary === "string" && result.summary !== "" ? result.summary : typeof result?.message === "string" ? result.message : JSON.stringify(result ?? null)
  return capSummary(base, secrets)
}

/** 摘要口径（掩蔽 + 截断 ≤300 字——`result` 帧 ∥ tool 行 ∥ notice/`chat_stop` 三面同源）。 */
export function capSummary(text, secrets = []) {
  const raw = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  return capText(maskSecrets(raw, secrets), CHAT_RESULT_SUMMARY_MAX)
}

/** 模型出口装配（§5/§11——与任务面同源：库单源 `providers` ⇒ 核 provider 客户端；**透传 `onToken`** ⇒ `delta` 帧增量）。 */
export async function buildChatExit({ db, ref, chatImpl = null, env = process.env } = {}) {
  const { createProviderRegistry, listProviderEntries } = await import("../gateway/providers.mjs")
  const registry = createProviderRegistry(listProviderEntries(db), { env })
  const hit = registry.dispatch(ref)
  if (hit.miss) throw new Error(`模型不可用：${String(ref)}（注册表未命中——建会话时已校验，此处为复检）`)
  const chat = chatImpl ?? (await loadCoreChat())
  return async ({ messages, tools, onToken }) =>
    chat({ baseURL: hit.provider.baseURL, apiKey: hit.provider.apiKey, model: hit.model, name: hit.provider.name }, { messages, tools, onToken })
}

/**
 * 跑一个回合（§11——调用前须 `claimChatTurn` 置在途）：`content` = 本轮用户消息 ∥ `emit` = 帧出口（`{ type, … }` 对象；
 * 断连写失败不反噬回合）∥ `deps` = 注入面（`chat` ∥ `tools` ∥ `runtime` ∥ `config` ∥ `env` ∥ `fetchImpl` ∥ `guard` ∥ `budget`）。
 * 出 = `{ status, reason, calls, durationMs }`。落库/审计全在本函数内（执行不依赖连接——单源）。
 */
export async function runChatTurn({ db, chatId, content, emit = null, deps = {}, now = Date.now, log = null } = {}) {
  const chat = chatRowOr404(db, chatId)
  const budget = { maxCalls: deps.budget?.maxCalls ?? DEFAULT_MAX_CALLS, maxDurationMs: deps.budget?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS }
  const emitFrame = (frame) => {
    try {
      emit?.(frame)
    } catch (e) {
      log?.warn("chat_stream_write_failed", { chatId: chat.id, message: e?.message ?? String(e) }) // 断连照跑（落库单源）
    }
  }
  const actor = actorNameOf(db, chat.created_by)
  const auditChatCall = ({ tool, call, resultCode, summary }) =>
    recordAudit(db, {
      type: "agent_event",
      actor,
      actorId: chat.created_by ?? null,
      target: `chat:${chat.id}`,
      detail: { kind: "chat_call", chatId: chat.id, tool, call, resultCode, summary },
      ts: now(),
    })
  const auditChatStop = (reason, summary) =>
    recordAudit(db, {
      type: "agent_event",
      actor,
      actorId: chat.created_by ?? null,
      target: `chat:${chat.id}`,
      detail: { kind: "chat_stop", chatId: chat.id, reason, summary },
      ts: now(),
    })

  try {
    appendMessage(db, chat.id, { role: "user", content, now }) // 逐条增量落库（本轮消息先落——断连亦留痕）
    const messages = buildTurnMessages(listMessages(db, chat.id))
    const tools = deps.tools ?? injectedTools ?? createChatTools({
      db,
      runtime: deps.runtime ?? null,
      config: deps.config ?? {},
      env: deps.env ?? process.env,
      fetchImpl: deps.fetchImpl ?? fetch,
      ...(deps.discoverFetchImpl ? { discoverFetchImpl: deps.discoverFetchImpl } : {}),
      guard: deps.guard ?? null,
      log,
    })

    const started = now()
    let calls = 0
    const turnSecrets = [] // 本轮已见敏感值（工具入参）——下游文本（结果/摘要/notice）一并掩蔽

    /** 异常收尾（②③④——notice 行 + `chat_stop` 审计 + `end` 帧 `failed`）：部分文本 ⇒ `assistant` 行如实落库。 */
    const closeFailed = (reason, detail, partialText = "") => {
      if (typeof partialText === "string" && partialText.trim() !== "") {
        appendMessage(db, chat.id, { role: "assistant", content: partialText, now })
      }
      const text = capSummary(noticeTextOf(reason, detail), turnSecrets) // 摘要口径（≤300 字 + 掩蔽）——notice 行 ∥ `chat_stop` 审计 ∥ `end` 帧三面同源
      appendMessage(db, chat.id, { role: "notice", content: text, data: { reason }, now })
      auditChatStop(reason, text)
      emitFrame({ type: "end", status: "failed", reason: text })
      return { status: "failed", reason: text, calls, durationMs: now() - started }
    }

    // 模型出口装配（§5）：注册表缺位/引用缺位 ⇒ 按「模型错误」收尾（四终态不外溢第三形）
    let modelExit
    try {
      modelExit = deps.chat ?? injectedChat ?? (await buildChatExit({ db, ref: chat.model, env: deps.env ?? process.env }))
    } catch (e) {
      return closeFailed("model_error", e?.message ?? String(e), "")
    }

    for (;;) {
      const elapsed = now() - started
      if (elapsed > budget.maxDurationMs) {
        return closeFailed("budget", `预算超限（时长 ${Math.round(elapsed / 1000)}s > 上限 ${Math.round(budget.maxDurationMs / 1000)}s）——停`)
      }
      if (calls >= budget.maxCalls) {
        return closeFailed("budget", `预算超限（工具调用 ${calls} ≥ 上限 ${budget.maxCalls} 次）——停`)
      }
      let turn
      let streamed = ""
      try {
        turn = await modelExit({
          messages,
          tools: tools.schemas,
          onToken: (token) => {
            if (typeof token !== "string" || token === "") return
            streamed += token
            emitFrame({ type: "delta", text: token })
          },
        })
      } catch (e) {
        return closeFailed("model_error", e?.message ?? String(e), streamed)
      }
      const text = typeof turn?.content === "string" && turn.content !== "" ? turn.content : streamed // 已生成文本优先（流式增量兜底——如实落库）
      const toolCalls = normalizeToolCalls(turn?.toolCalls)
      if (toolCalls.length === 0) {
        if (text.trim() === "") return closeFailed("empty_turn", null, "")
        appendMessage(db, chat.id, { role: "assistant", content: text, now })
        messages.push({ role: "assistant", content: text })
        emitFrame({ type: "end", status: "succeeded" })
        return { status: "succeeded", reason: null, calls, durationMs: now() - started }
      }
      // 有工具调用：assistant 行（文本 + `toolCalls` 摘要——回放据以重建消息数组）
      const pending = toolCalls.map((call) => ({ ...call, args: argsTextOf(call.arguments) }))
      appendMessage(db, chat.id, {
        role: "assistant",
        content: text,
        data: { toolCalls: pending.map((call) => ({ id: call.id, name: call.name, args: call.args })) },
        now,
      })
      messages.push({
        role: "assistant",
        content: text,
        tool_calls: pending.map((call) => ({ id: call.id, type: "function", function: { name: call.name, arguments: call.args } })),
      })
      for (let index = 0; index < pending.length; index++) {
        const call = pending[index]
        const overBudget = calls >= budget.maxCalls || now() - started > budget.maxDurationMs
        if (overBudget) {
          // 预算在调用途中触发：未执行调用逐条落「未执行」结果（消息序一致——回放不缺 tool 行）
          for (const rest of pending.slice(index)) {
            const unrun = { ok: false, message: "预算超限——未执行（回合已停）" }
            const unrunText = JSON.stringify(unrun)
            appendMessage(db, chat.id, { role: "tool", content: unrunText, data: { toolCallId: rest.id, name: rest.name, ok: false, summary: unrun.message }, now })
            messages.push({ role: "tool", tool_call_id: rest.id, content: unrunText })
          }
          const detail = calls >= budget.maxCalls
            ? `预算超限（工具调用 ${calls} ≥ 上限 ${budget.maxCalls} 次）——停`
            : `预算超限（时长 ${Math.round((now() - started) / 1000)}s > 上限 ${Math.round(budget.maxDurationMs / 1000)}s）——停`
          return closeFailed("budget", detail, "")
        }
        calls += 1
        emitFrame({ type: "call", id: call.id, name: call.name, args: call.args })
        const args = parseToolArgs(call.arguments)
        const secrets = args === null ? [] : secretValuesOf(args)
        turnSecrets.push(...secrets)
        const result = args === null ? { ok: false, message: "工具入参非 JSON 对象" } : await tools.invoke(call.name, args)
        const summary = summaryOfResult(result, secrets)
        emitFrame({ type: "result", id: call.id, ok: result?.ok === true, summary })
        const resultText = maskSecrets(JSON.stringify(result ?? null), secrets)
        const trimmed = capToolContent(resultText) // 模型可见形（≤4000 字含注记——回放逐字一致）
        appendMessage(db, chat.id, { role: "tool", content: trimmed, data: { toolCallId: call.id, name: call.name, ok: result?.ok === true, summary }, now })
        messages.push({ role: "tool", tool_call_id: call.id, content: trimmed })
        auditChatCall({ tool: call.name, call: capText(maskSecrets(call.args, secrets), CHAT_CALL_ARGS_MAX), resultCode: result?.ok === true ? 0 : -1, summary }) // 逐调用一行（读动作同落——KD-SV-91）
      }
    }
  } finally {
    settleChatIdle(db, chat.id, { now })
  }
}
