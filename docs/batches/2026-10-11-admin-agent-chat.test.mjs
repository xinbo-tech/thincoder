/**
 * 2026-10-11-admin-agent-chat.test.mjs — thincoder-server 批内单测件（`admin-agent-chat` 批 · **后台舱**——聊天式驱动 ∥ 四端点 ∥
 * v14 存储 ∥ 审计十三型；名随批档 · 住 `docs/batches/` · 随批留存 · 与本批另两件（`…-tools` ∥ `…-ui`）同批）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-11-admin-agent-chat.test.mjs`
 *
 * 射程（判据源 = 批档 §2.4 ∥ `docs/server/design/agent/ADMIN-AGENT.md` §7/§8/§11 ∥ `gateway/API.md` §2.8 ∥ `store/STORE.md` v14 段）：
 *   ① 四端点判权三态（`user` ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ ② 流帧逐帧序（`delta`… ∥ `call` ∥ `result` ∥ `end(succeeded)`——假模型 ∥ 假工具）
 *   ∥ ③ 会话落库与重放（逐行在场 ∥ notice 回放滤除 ∥ 工具结果截断口径）∥ ④ 在途门（`running` ⇒ 400 人话）
 *   ∥ ⑤ 重启收尾（`running` ⇒ `idle` + notice + `chat_stop` 行）∥ ⑥ v14 三径（空库直落 14 ∥ v13 升后 14 ∥ 幂等 + 两表/索引/CHECK）
 *   ∥ ⑦ `agent_event` 型可写（写一行 ⇒ 读出 ⇒ 零抛）∥ ⑧ 异常终态落库（模型错误 ∥ 预算超限 ∥ 空回合——部分文本如实落库 ∥ 零文本零 assistant 行）
 *   ∥ ⑨ B48 断连（回合照跑到终态——落库不依赖连接）∥ ⑩ E40（404 ∥ 400 空 content ∥ 400 模型不可用）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const DB = await load("thincoder-server/src/store/db.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const CHAT = await load("thincoder-server/src/agent/chat.mjs")
const CHAT_ROUTES = await load("thincoder-server/src/agent/chat-routes.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const AUDIT = await load("thincoder-server/src/accounts/audit.mjs")

const PASSWORD = "password-123"
const MODEL = "fake/fake-model"
const tempRoot = mkdtempSync(join(tmpdir(), "tc-chat-"))

// ── 假件：假模型出口 ∥ 假工具面 ────────────────────────────────────────────────

/** 假模型：脚本回合（`{ deltas?, content?, toolCalls?, gate?, throws? }`——`deltas` 经 `onToken` 逐段上流；用尽 ⇒ 恒用末回合）。 */
function scriptedChat(turns) {
  const state = { i: 0, calls: [] }
  const chat = async ({ messages, tools, onToken }) => {
    state.calls.push({ messages: JSON.parse(JSON.stringify(messages)), tools })
    const turn = turns[Math.min(state.i, turns.length - 1)]
    state.i += 1
    const spec = typeof turn === "function" ? await turn({ messages, tools, onToken }) : turn
    if (spec?.deltas) for (const piece of spec.deltas) onToken?.(piece)
    if (spec?.gate) await spec.gate
    if (spec?.throws) throw spec.throws instanceof Error ? spec.throws : new Error(String(spec.throws))
    return { content: spec?.content ?? "", toolCalls: spec?.toolCalls ?? [] }
  }
  return { chat, state }
}

/** 假工具面（§11 注入缝——`{ schemas, invoke }`；缺省恒 ok）。 */
function fakeTools({ invoke = async () => ({ ok: true, summary: "已办" }) } = {}) {
  const calls = []
  return {
    names: ["members"],
    schemas: [{ type: "function", function: { name: "members", parameters: { type: "object", properties: { op: { type: "string" } }, required: ["op"] } } }],
    calls,
    invoke: async (name, args) => {
      calls.push({ name, args })
      return invoke(name, args)
    },
  }
}

const turnCall = (name, args, { content = "", deltas = null } = {}) => ({
  content,
  deltas: deltas ?? (content === "" ? [] : [content]),
  toolCalls: [{ id: `call-${name}`, name, arguments: JSON.stringify(args) }],
})

// ── 进程内应用（网关 + 账号面 + 会话面）────────────────────────────────────────

async function call(base, method, path, { body, cookie } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON（NDJSON 流/空体）——以 text 判 */
  }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}

/** 读 NDJSON 帧流（流线逐行 ⇒ 帧数组）。 */
async function readFrames(response) {
  const frames = []
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let index = buffer.indexOf("\n")
    while (index >= 0) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (line !== "") frames.push(JSON.parse(line))
      index = buffer.indexOf("\n")
    }
  }
  if (buffer.trim() !== "") frames.push(JSON.parse(buffer.trim()))
  return frames
}

function seedProvider(db, { name = "fake", models = ["fake-model"] } = {}) {
  const now = new Date().toISOString()
  db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, created_at, updated_at) VALUES (?,?,?,?,?,?)").run(
    name,
    "http://127.0.0.1:9/v1",
    "sk-test",
    JSON.stringify(models),
    now,
    now,
  )
}

async function startChatApp({ turns = [], tools = fakeTools(), db: existingDb = null, dir = null, budget = null, withProvider = true, model = MODEL } = {}) {
  const baseDir = dir ?? mkdtempSync(join(tempRoot, "app-"))
  const db = existingDb ?? DB.openDatabase(":memory:")
  if (!existingDb) {
    await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
    await MEMBERS.createMember(db, { username: "user", role: "user", password: PASSWORD })
  }
  if (!existingDb && withProvider) seedProvider(db)
  const config = CONFIG.validateConfig({ host: "127.0.0.1", db: join(baseDir, "gateway.db") })
  const routes = SERVER.createRouteTable()
  const scripted = scriptedChat(turns)
  CHAT_ROUTES.registerChatRoutes(routes, {
    db,
    log: null,
    deps: { chat: scripted.chat, tools, config, ...(budget ? { budget } : {}) },
  })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = async (username) => {
    const res = await call(base, "POST", "/api/login", { body: { username, password: PASSWORD } })
    const line = res.setCookies.find((item) => item.startsWith(`${SESSION.SESSION_COOKIE}=`)) ?? null
    return line ? line.split(";")[0] : null
  }
  const app = {
    db,
    base,
    dir: baseDir,
    model,
    scripted,
    tools,
    adminCookie: await login("admin"),
    userCookie: await login("user"),
    chats: () => db.prepare("SELECT * FROM agent_chats ORDER BY id").all(),
    messages: (chatId) => db.prepare("SELECT * FROM agent_chat_messages WHERE chat_id = ? ORDER BY seq").all(Number(chatId)),
    agentEvents: (kind = null) =>
      db
        .prepare("SELECT * FROM audit_events WHERE type = 'agent_event' ORDER BY id")
        .all()
        .filter((row) => kind === null || JSON.parse(row.detail ?? "{}").kind === kind),
    createChat: async (model = app.model) => {
      const res = await call(base, "POST", "/api/admin/agent/chats", { cookie: app.adminCookie, body: { model } })
      assert.equal(res.status, 200, `建会话应 200——实读 ${res.status}：${res.text}`)
      return res.json.chat
    },
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    },
  }
  return app
}

/** 发一条并读全流（NDJSON）。 */
async function sendMessage(app, chatId, content, { cookie = null, signal = null } = {}) {
  const res = await fetch(`${app.base}/api/admin/agent/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookie ?? app.adminCookie },
    body: JSON.stringify({ content }),
    ...(signal ? { signal } : {}),
  })
  if (res.status !== 200) return { status: res.status, frames: null, text: await res.text() }
  const frames = await readFrames(res)
  return { status: res.status, frames }
}

/** 等条件成立（轮询——上限 2s）。 */
async function waitFor(fn, { timeoutMs = 2000, stepMs = 20 } = {}) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = fn()
    if (value) return value
    if (Date.now() > deadline) throw new Error("waitFor 超时")
    await new Promise((resolve) => setTimeout(resolve, stepMs))
  }
}

// ── ① 判权三态（四端点）────────────────────────────────────────────────────────

test("判权三态：无会话 ⇒ 401 ∥ user ⇒ 403 ∥ admin 200（四端点同族——requireAdmin）", async () => {
  const app = await startChatApp({ turns: [{ content: "在" }] })
  try {
    for (const [method, path] of [
      ["POST", "/api/admin/agent/chats"],
      ["GET", "/api/admin/agent/chats"],
      ["GET", "/api/admin/agent/chats/1"],
      ["POST", "/api/admin/agent/chats/1/messages"],
    ]) {
      const anon = await call(app.base, method, path, { body: method === "POST" ? { model: app.model, content: "x" } : undefined })
      assert.equal(anon.status, 401, `${method} ${path} 无会话应 401——实读 ${anon.status}`)
      const asUser = await call(app.base, method, path, { cookie: app.userCookie, body: method === "POST" ? { model: app.model, content: "x" } : undefined })
      assert.equal(asUser.status, 403, `${method} ${path} user 应 403——实读 ${asUser.status}`)
    }
    const asAdmin = await call(app.base, "GET", "/api/admin/agent/chats", { cookie: app.adminCookie })
    assert.equal(asAdmin.status, 200)
  } finally {
    await app.close()
  }
})

// ── ②⑩ 建会话 ∥ 列表 ∥ 详情 ∥ E40 错误面 ──────────────────────────────────────

test("建会话 ∥ 列表（倒序 + excerpt）∥ 详情 ∥ E40（404 ∥ 400 空 content ∥ 400 模型不可用）", async () => {
  const app = await startChatApp({ turns: [{ content: "你好" }] })
  try {
    const bad = await call(app.base, "POST", "/api/admin/agent/chats", { cookie: app.adminCookie, body: { model: "nope/none" } })
    assert.equal(bad.status, 400)
    assert.match(bad.json.error.message, /模型不可用/)
    assert.equal(app.chats().length, 0, "模型不可用 ⇒ 库零变")

    const chat = await app.createChat()
    assert.equal(chat.model, app.model)
    assert.equal(chat.status, "idle")
    const auditStart = app.agentEvents("chat_start")
    assert.equal(auditStart.length, 1)
    assert.equal(auditStart[0].actor_name, "admin")
    assert.equal(auditStart[0].detail && JSON.parse(auditStart[0].detail).chatId, chat.id)
    assert.equal(auditStart[0].target_name, `chat:${chat.id}`)

    const detail404 = await call(app.base, "GET", "/api/admin/agent/chats/9999", { cookie: app.adminCookie })
    assert.equal(detail404.status, 404)

    const empty = await call(app.base, "POST", `/api/admin/agent/chats/${chat.id}/messages`, { cookie: app.adminCookie, body: { content: "   " } })
    assert.equal(empty.status, 400)
    assert.equal(empty.json.error.code, "invalid_request_error")

    await sendMessage(app, chat.id, "第一条用户消息——这是很长的一句话用来验证 excerpt 的截断口径")
    const list = await call(app.base, "GET", "/api/admin/agent/chats", { cookie: app.adminCookie })
    assert.equal(list.status, 200)
    assert.equal(list.json.chats.length, 1)
    assert.equal(list.json.chats[0].id, chat.id)
    assert.equal(list.json.chats[0].excerpt.length <= CHAT.CHAT_EXCERPT_MAX, true, "excerpt ≤40 字")
    assert.equal(list.json.chats[0].excerpt, "第一条用户消息——这是很长的一句话用来验证 excerpt 的截断口径".slice(0, CHAT.CHAT_EXCERPT_MAX))

    const detail = await call(app.base, "GET", `/api/admin/agent/chats/${chat.id}`, { cookie: app.adminCookie })
    assert.equal(detail.status, 200)
    assert.equal(detail.json.chat.id, chat.id)
    assert.deepEqual(detail.json.messages.map((row) => row.role), ["user", "assistant"])
    assert.equal(detail.json.messages[1].content, "你好")
  } finally {
    await app.close()
  }
})
// ── ③④ N54/N55 帧序 ∥ 落库 ∥ 重放 ─────────────────────────────────────────────

test("N54：帧序 = delta… ∥ call ∥ result ∥ end(succeeded)；逐行落库；逐调用一条 chat_call（args = 字符串）", async () => {
  const tools = fakeTools({ invoke: async () => ({ ok: true, summary: "成员 2 人", members: [{ id: 1, name: "admin" }] }) })
  const app = await startChatApp({
    tools,
    turns: [
      turnCall("members", { op: "list" }, { content: "先查成员", deltas: ["先查", "成员"] }),
      { content: "查完了：2 人", deltas: ["查完了：", "2 人"] },
    ],
  })
  try {
    const chat = await app.createChat()
    const { status, frames } = await sendMessage(app, chat.id, "看下成员")
    assert.equal(status, 200)
    assert.deepEqual(frames.map((frame) => frame.type), ["delta", "delta", "call", "result", "delta", "delta", "end"])
    assert.deepEqual(frames.filter((frame) => frame.type === "delta").map((frame) => frame.text), ["先查", "成员", "查完了：", "2 人"])
    const call = frames[2]
    assert.equal(call.name, "members")
    assert.equal(typeof call.args, "string", "`call` 帧 `args` = **字符串**（§11 钉死）")
    assert.equal(call.args, '{"op":"list"}')
    const result = frames[3]
    assert.equal(result.ok, true)
    assert.equal(result.id, call.id)
    assert.equal(result.summary, "成员 2 人")
    assert.deepEqual(frames[6], { type: "end", status: "succeeded" })

    // 落库（逐行在场：user ∥ assistant（含 toolCalls）∥ tool ∥ assistant）
    const rows = app.messages(chat.id)
    assert.deepEqual(rows.map((row) => row.role), ["user", "assistant", "tool", "assistant"])
    assert.equal(rows[0].content, "看下成员")
    const assistantCall = JSON.parse(rows[1].data_json).toolCalls[0]
    assert.equal(assistantCall.name, "members")
    assert.equal(assistantCall.args, '{"op":"list"}')
    assert.equal(rows[2].content, JSON.stringify({ ok: true, summary: "成员 2 人", members: [{ id: 1, name: "admin" }] }))
    const toolData = JSON.parse(rows[2].data_json)
    assert.equal(toolData.toolCallId, call.id)
    assert.equal(toolData.name, "members")
    assert.equal(toolData.ok, true)
    assert.equal(rows[3].content, "查完了：2 人")

    // 审计：chat_start + 逐调用一条 chat_call
    assert.equal(app.agentEvents("chat_start").length, 1)
    const calls = app.agentEvents("chat_call")
    assert.equal(calls.length, 1, "每工具调用一条 chat_call")
    const detail = JSON.parse(calls[0].detail)
    assert.equal(detail.tool, "members")
    assert.equal(detail.call, '{"op":"list"}')
    assert.equal(detail.resultCode, 0)
    assert.equal(detail.summary, "成员 2 人")
    assert.equal(app.chats()[0].status, "idle", "回合终结 ⇒ 回 idle")
  } finally {
    await app.close()
  }
})

test("N55：连发两轮——历史重放逐行（notice 滤除 ∥ 前轮全量入上下文）；状态回 idle", async () => {
  const app = await startChatApp({
    turns: [
      turnCall("members", { op: "list" }, { content: "查一下" }),
      { content: "第一轮答", deltas: ["第一轮答"] },
      { content: "第二轮答", deltas: ["第二轮答"] },
    ],
  })
  try {
    const chat = await app.createChat()
    await sendMessage(app, chat.id, "第一问")
    await waitFor(() => app.chats()[0].status === "idle")
    await sendMessage(app, chat.id, "第二问")
    const second = app.scripted.state.calls[2].messages // 第三回合调用（第二轮里模型的第一跳）
    assert.deepEqual(second.map((row) => row.role), ["system", "user", "assistant", "tool", "assistant", "user"])
    assert.equal(second[1].content, "第一问")
    assert.equal(second[2].tool_calls[0].function.name, "members")
    assert.equal(second[2].tool_calls[0].function.arguments, '{"op":"list"}')
    assert.match(second[3].content, /已办/)
    assert.equal(second[4].content, "第一轮答")
    assert.equal(second[5].content, "第二问")
    assert.ok(second.every((row) => row.role !== "notice"), "notice 滤除（不入模型上下文）")
    assert.deepEqual(app.messages(chat.id).map((row) => row.role), ["user", "assistant", "tool", "assistant", "user", "assistant"])
    assert.equal(app.chats()[0].status, "idle")
  } finally {
    await app.close()
  }
})

test("③工具结果截断口径：超长结果 ⇒ 落库截断 ≤4000 且回放逐字（同一字符串入上下文）", async () => {
  const payload = { ok: true, summary: "大结果", blob: "x".repeat(6000) }
  const tools = fakeTools({ invoke: async () => payload })
  const app = await startChatApp({
    tools,
    turns: [turnCall("members", { op: "list" }), { content: "收到", deltas: ["收到"] }],
  })
  try {
    const chat = await app.createChat()
    await sendMessage(app, chat.id, "拿大结果")
    await waitFor(() => app.chats()[0].status === "idle")
    const toolRow = app.messages(chat.id).find((row) => row.role === "tool")
    assert.ok(toolRow.content.length <= 4000 + 64, `落库 ≤4000 字（实 ${toolRow.content.length}）`)
    assert.ok(toolRow.content.startsWith('{"ok":true,"summary":"大结果"'))
    await sendMessage(app, chat.id, "再来")
    const replay = app.scripted.state.calls[2].messages.find((row) => row.role === "tool")
    assert.equal(replay.content, toolRow.content, "回放逐字一致（同一截断形）")
  } finally {
    await app.close()
  }
})

test("④在途门：`running` 期间再发 ⇒ 400 人话（回合照跑）；跨会话并发不设限", async () => {
  let release = null
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const app = await startChatApp({ turns: [{ content: "慢答", deltas: ["慢答"], gate }] })
  try {
    const chat = await app.createChat()
    const inflight = sendMessage(app, chat.id, "在跑")
    await waitFor(() => app.chats()[0].status === "running")
    const blocked = await call(app.base, "POST", `/api/admin/agent/chats/${chat.id}/messages`, { cookie: app.adminCookie, body: { content: "插队" } })
    assert.equal(blocked.status, 400)
    assert.match(blocked.json.error.message, /本会话正在执行/)
    release()
    const first = await inflight
    assert.equal(first.frames.at(-1).status, "succeeded")
  } finally {
    await app.close()
  }
})

test("⑨B48 断连：客户端中途断流 ⇒ 回合照跑到终态（落库/审计零缺行）", async () => {
  const app = await startChatApp({
    turns: [turnCall("members", { op: "list" }), { content: "收尾答", deltas: ["收尾答"] }],
  })
  try {
    const chat = await app.createChat()
    const controller = new AbortController()
    const res = await fetch(`${app.base}/api/admin/agent/chats/${chat.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: app.adminCookie },
      body: JSON.stringify({ content: "断连测试" }),
      signal: controller.signal,
    })
    assert.equal(res.status, 200)
    await res.body.getReader().read() // 读一帧即断
    controller.abort()
    await waitFor(() => app.chats()[0].status === "idle", { timeoutMs: 3000 })
    const rows = app.messages(chat.id)
    assert.deepEqual(rows.map((row) => row.role), ["user", "assistant", "tool", "assistant"], "断连不影响落库（执行不依赖连接）")
    assert.equal(app.agentEvents("chat_call").length, 1, "审计零缺行")
  } finally {
    await app.close()
  }
})

// ── ⑧ 异常终态（模型错误 ∥ 预算超限 ∥ 空回合）─────────────────────────────────

test("⑧模型错误：end failed + notice(model_error) + chat_stop；部分文本如实落库", async () => {
  const app = await startChatApp({
    turns: [
      {
        deltas: ["写了一半"],
        throws: new Error("上游 500"),
      },
    ],
  })
  try {
    const chat = await app.createChat()
    const { frames } = await sendMessage(app, chat.id, "会炸的")
    const end = frames.at(-1)
    assert.equal(end.type, "end")
    assert.equal(end.status, "failed")
    assert.match(end.reason, /模型调用失败/)
    const rows = app.messages(chat.id)
    assert.deepEqual(rows.map((row) => row.role), ["user", "assistant", "notice"], "部分文本 ⇒ assistant 行如实落库（notice 行独立）")
    assert.equal(rows[1].content, "写了一半")
    assert.equal(JSON.parse(rows[2].data_json).reason, "model_error")
    const stops = app.agentEvents("chat_stop")
    assert.equal(stops.length, 1)
    assert.equal(JSON.parse(stops[0].detail).reason, "model_error")
    assert.equal(app.chats()[0].status, "idle")
  } finally {
    await app.close()
  }
})

test("⑧空回合：零文本零调用 ⇒ end failed + notice(empty_turn)；零 assistant 行", async () => {
  const app = await startChatApp({ turns: [{ content: "", toolCalls: [] }] })
  try {
    const chat = await app.createChat()
    const { frames } = await sendMessage(app, chat.id, "空回合")
    assert.equal(frames.at(-1).status, "failed")
    const rows = app.messages(chat.id)
    assert.deepEqual(rows.map((row) => row.role), ["user", "notice"], "零文本 ⇒ 零 assistant 行")
    assert.equal(JSON.parse(rows[1].data_json).reason, "empty_turn")
    assert.equal(app.agentEvents("chat_stop").length, 1)
  } finally {
    await app.close()
  }
})

test("⑧预算超限：恒调工具 ⇒ end failed + notice(budget) + chat_stop；调用数 = 上限", async () => {
  const tools = fakeTools({ invoke: async () => ({ ok: true, summary: "再来" }) })
  const app = await startChatApp({ tools, turns: [turnCall("members", { op: "list" })], budget: { maxCalls: 2, maxDurationMs: 60000 } })
  try {
    const chat = await app.createChat()
    const { frames } = await sendMessage(app, chat.id, "跑到超限")
    const end = frames.at(-1)
    assert.equal(end.status, "failed")
    assert.match(end.reason, /预算超限/)
    const rows = app.messages(chat.id)
    assert.equal(JSON.parse(rows.at(-1).data_json).reason, "budget")
    assert.equal(app.agentEvents("chat_call").length, 2, "调用数 = 上限（逐调用一行）")
    assert.equal(app.agentEvents("chat_stop").length, 1)
    assert.equal(app.chats()[0].status, "idle")
  } finally {
    await app.close()
  }
})

// ── ⑤ 重启收尾 ────────────────────────────────────────────────────────────────

test("⑤重启收尾：`running` ⇒ `idle` + notice(restart) + chat_stop 行（装配期钩）；已落库消息零动", async () => {
  const app = await startChatApp({ turns: [{ content: "答" }] })
  try {
    const chat = await app.createChat()
    await sendMessage(app, chat.id, "重启前")
    const before = app.messages(chat.id).length
    app.db.prepare("UPDATE agent_chats SET status = 'running' WHERE id = ?").run(chat.id)
    const recovered = CHAT.resumeRunningChats(app.db)
    assert.equal(recovered, 1)
    assert.equal(app.chats()[0].status, "idle")
    const rows = app.messages(chat.id)
    assert.equal(rows.length, before + 1, "只加 notice 行（既有消息零动）")
    assert.equal(JSON.parse(rows.at(-1).data_json).reason, "restart")
    const stops = app.agentEvents("chat_stop")
    assert.equal(stops.length, 1)
    assert.equal(JSON.parse(stops[0].detail).reason, "restart")

    // 装配期钩：带 running 会话再注册一次 ⇒ 自动收尾（无端点）
    app.db.prepare("UPDATE agent_chats SET status = 'running' WHERE id = ?").run(chat.id)
    const routes = SERVER.createRouteTable()
    CHAT_ROUTES.registerChatRoutes(routes, { db: app.db, log: null })
    assert.equal(app.chats()[0].status, "idle")
    assert.equal(app.agentEvents("chat_stop").length, 2, "装配期钩再收一次")
  } finally {
    await app.close()
  }
})

test("⑧模型出口缺位（注册表未命中——直调驱动）：end failed + notice(model_error) + chat_stop（四终态不外溢）", async () => {
  const app = await startChatApp({ turns: [{ content: "不该到" }] })
  try {
    const chat = CHAT.createChat(app.db, { model: "ghost/none", createdBy: null }) // 绕过建会话校验（模拟注册表后撤）
    const frames = []
    const result = await CHAT.runChatTurn({ db: app.db, chatId: chat.id, content: "试试", emit: (frame) => frames.push(frame) })
    assert.equal(result.status, "failed")
    assert.equal(frames.at(-1).type, "end")
    assert.equal(frames.at(-1).status, "failed")
    const rows = app.messages(chat.id)
    assert.deepEqual(rows.map((row) => row.role), ["user", "notice"])
    assert.equal(JSON.parse(rows[1].data_json).reason, "model_error")
    assert.equal(app.agentEvents("chat_stop").length, 1)
    assert.equal(app.chats().find((item) => item.id === chat.id).status, "idle")
  } finally {
    await app.close()
  }
})

test("⑨掩蔽：敏感入参 ⇒ 帧/落库/审计摘要全 `***`（含工具结果回显同值）；尾注截断不越上限", async () => {
  const PLAIN = "sk-live-abcdef1234"
  const tools = fakeTools({ invoke: async (name, args) => ({ ok: true, summary: `已用 ${args.apiKey} 试过`, echoed: args.apiKey }) })
  const app = await startChatApp({
    tools,
    turns: [turnCall("providers", { op: "add", name: "lab", baseURL: "https://lab.example/v1", apiKey: PLAIN }), { content: "收到", deltas: ["收到"] }],
  })
  try {
    const chat = await app.createChat()
    const { frames } = await sendMessage(app, chat.id, "加个 provider")
    const callFrame = frames.find((frame) => frame.type === "call")
    assert.equal(typeof callFrame.args, "string")
    assert.equal(callFrame.args.includes(PLAIN), false, "`call` 帧 args 零明文")
    assert.match(callFrame.args, /"apiKey":"\*\*\*"/)
    const result = frames.find((frame) => frame.type === "result")
    assert.equal(result.summary.includes(PLAIN), false, "`result` 摘要零明文（含工具回显同值）")
    assert.match(result.summary, /\*\*\*/)
    const detail = await call(app.base, "GET", `/api/admin/agent/chats/${chat.id}`, { cookie: app.adminCookie })
    const body = JSON.stringify(detail.json)
    assert.equal(body.includes(PLAIN), false, "会话详情（含落库行）零明文")
    const toolRow = app.messages(chat.id).find((row) => row.role === "tool")
    assert.equal(toolRow.content.includes(PLAIN), false, "工具结果落库 = 掩蔽后")
    const auditCall = app.agentEvents("chat_call")[0]
    assert.equal(auditCall.detail.includes(PLAIN), false, "审计 detail 零明文")

    // 尾注截断（上限含注记——`args` ≤500 ∥ 摘要 ≤300 ∥ 工具结果 ≤4000）
    const long = CHAT.argsTextOf(JSON.stringify({ op: "list", q: "x".repeat(900) }))
    assert.ok(long.length <= CHAT.CHAT_CALL_ARGS_MAX, `args 截断 ≤500（实 ${long.length}）`)
    assert.ok(CHAT.capSummary("y".repeat(500)).length <= CHAT.CHAT_RESULT_SUMMARY_MAX)
    assert.ok(CHAT.capToolContent(`{"blob":"${"z".repeat(6000)}"}`).length <= CHAT.CHAT_TOOL_CONTENT_MAX)
  } finally {
    await app.close()
  }
})

test("E41 第二腿：工具级错误 ⇒ `result` 帧 `ok:false` + 回合不停（模型可自纠）", async () => {
  const tools = fakeTools({ invoke: async () => ({ ok: false, message: "username 必填" }) })
  const app = await startChatApp({
    tools,
    turns: [turnCall("members", { op: "create" }), { content: "我补上用户名再来", deltas: ["我补上用户名再来"] }],
  })
  try {
    const chat = await app.createChat()
    const { frames } = await sendMessage(app, chat.id, "建个成员")
    const result = frames.find((frame) => frame.type === "result")
    assert.equal(result.ok, false)
    assert.equal(result.summary, "username 必填")
    assert.equal(frames.at(-1).type, "end")
    assert.equal(frames.at(-1).status, "succeeded", "工具级错误 ⇒ 回合不停（模型自纠后自然结束）")
    const toolRow = app.messages(chat.id).find((row) => row.role === "tool")
    assert.equal(JSON.parse(toolRow.data_json).ok, false)
    assert.equal(app.agentEvents("chat_call")[0].detail.includes('"resultCode":-1'), true, "调用行结果码 = -1")
    assert.equal(app.agentEvents("chat_stop").length, 0, "正常回合终 = 零附加行（KD-SV-91）")
  } finally {
    await app.close()
  }
})

test("notice 回放滤除：异常轮后接成功轮——上下文无 notice 行；成功轮零 `chat_stop` 附加行", async () => {
  const app = await startChatApp({
    turns: [{ deltas: ["半句"], throws: new Error("上游炸了") }, { content: "续上", deltas: ["续上"] }],
  })
  try {
    const chat = await app.createChat()
    await sendMessage(app, chat.id, "第一轮炸")
    await waitFor(() => app.chats()[0].status === "idle")
    assert.deepEqual(app.messages(chat.id).map((row) => row.role), ["user", "assistant", "notice"])
    await sendMessage(app, chat.id, "第二轮好")
    const second = app.scripted.state.calls[1].messages
    assert.ok(second.some((row) => row.role === "assistant" && row.content === "半句"), "部分文本照常入上下文")
    assert.equal(second.some((row) => row.role === "notice"), false, "notice 行滤除（不入模型上下文）")
    assert.equal(app.agentEvents("chat_stop").length, 1, "只有第一轮异常落 chat_stop；成功轮零附加行")
    assert.deepEqual(app.messages(chat.id).map((row) => row.role), ["user", "assistant", "notice", "user", "assistant"])
  } finally {
    await app.close()
  }
})

test("在途门先行（§2.8 行序）：`running` + 模型已撤 ⇒ 回「本会话正在执行——等它结束」（非「模型不可用」）", async () => {
  const app = await startChatApp({ turns: [{ content: "不该到" }] })
  try {
    const chat = CHAT.createChat(app.db, { model: "ghost/none", createdBy: null }) // 模型不在注册表
    CHAT.claimChatTurn(app.db, chat.id, { now: () => Date.now() }) // 手工置在途
    const res = await call(app.base, "POST", `/api/admin/agent/chats/${chat.id}/messages`, { cookie: app.adminCookie, body: { content: "再发" } })
    assert.equal(res.status, 400)
    assert.match(res.json.error.message, /本会话正在执行——等它结束/, "在途门先行于模型校（两者皆 400——报文分先后）")
  } finally {
    await app.close()
  }
})

// ── ⑥⑦ 存储 v14（三径 ∥ 两表/索引/CHECK ∥ agent_event 可写）────────────────────

test("⑥v14 空库直落 14：两表列面在场 ∥ (chat_id,seq) 索引在场 ∥ role/status CHECK 放行与越值拒", async () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.equal(DB.readVersion(db), 14, "空库直落 14")
    assert.equal(DB.SCHEMA_VERSION, 14)
    const chatCols = db.prepare("SELECT name FROM pragma_table_info('agent_chats') ORDER BY cid").all().map((row) => row.name)
    assert.deepEqual(chatCols, ["id", "model", "status", "created_by", "created_at", "updated_at"])
    const msgCols = db.prepare("SELECT name FROM pragma_table_info('agent_chat_messages') ORDER BY cid").all().map((row) => row.name)
    assert.deepEqual(msgCols, ["id", "chat_id", "seq", "role", "content", "data_json", "created_at"])
    const indexes = db.prepare("SELECT name FROM pragma_index_list('agent_chat_messages')").all().map((row) => row.name)
    assert.ok(indexes.includes("idx_agent_chat_messages"), `(chat_id, seq) 索引在场——实读 ${indexes.join(",")}`)
    const idxCols = db.prepare("SELECT name FROM pragma_index_info('idx_agent_chat_messages') ORDER BY seqno").all().map((row) => row.name)
    assert.deepEqual(idxCols, ["chat_id", "seq"])

    const chat = CHAT.createChat(db, { model: MODEL, createdBy: null })
    assert.equal(chat.status, "idle")
    CHAT.appendMessage(db, chat.id, { role: "user", content: "hi" })
    assert.equal(CHAT.listMessages(db, chat.id).length, 1)
    assert.throws(() => CHAT.appendMessage(db, chat.id, { role: "system", content: "x" }), /消息角色非法/)
    assert.throws(() => db.prepare("UPDATE agent_chats SET status = 'busy' WHERE id = ?").run(chat.id), /CHECK/)
    assert.throws(() => db.prepare("INSERT INTO agent_chat_messages (chat_id, seq, role, content, created_at) VALUES (?,?,?,?,?)").run(chat.id, 9, "system", "x", "now"), /CHECK/)
  } finally {
    db.close()
  }
})

test("⑥⑦v13 库升后 14：存量审计行逐值保形 + 两索引在场 + `agent_event` 型可写（写一行 ⇒ 读出 ⇒ 零抛）", async () => {
  const file = join(mkdtempSync(join(tempRoot, "mig-")), "gateway.db")
  const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 13) })
  const legacyAudit = AUDIT.recordAudit(legacy, { type: "sandbox_event", actor: "admin", actorId: null, target: "node-1", detail: { kind: "runner_add" }, ts: 1700000000000 })
  legacy.close()
  assert.equal(legacyAudit > 0, true)

  const db = DB.openDatabase(file)
  try {
    assert.equal(DB.readVersion(db), 14, "v13 库升后读数 14")
    const row = db.prepare("SELECT * FROM audit_events WHERE id = ?").get(legacyAudit)
    assert.deepEqual(
      { ts: row.ts, type: row.type, actor_name: row.actor_name, target_name: row.target_name, detail: row.detail },
      { ts: 1700000000000, type: "sandbox_event", actor_name: "admin", target_name: "node-1", detail: JSON.stringify({ kind: "runner_add" }) },
      "存量审计行逐值保形",
    )
    const indexes = db.prepare("SELECT name FROM pragma_index_list('audit_events')").all().map((item) => item.name).sort()
    assert.deepEqual(indexes, ["idx_audit_ts", "idx_audit_type_ts"], "两索引在场")
    assert.ok(db.prepare("SELECT name FROM pragma_table_info('agent_chat_messages')").all().length > 0, "两表在场")

    // 型面：十三型（CHECK 放行 agent_event；越值拒）
    const id = AUDIT.recordAudit(db, { type: "agent_event", actor: "admin", actorId: 1, target: "chat:1", detail: { kind: "chat_start", chatId: 1 }, ts: 1700000001000 })
    assert.ok(id > legacyAudit)
    const found = AUDIT.queryAudit(db, { type: "agent_event" })
    assert.equal(found.length, 1)
    assert.equal(found[0].detail.kind, "chat_start")
    assert.equal(AUDIT.AUDIT_TYPES.length, 13, "型面 = 十三型（事件目录）")
    assert.throws(() => AUDIT.recordAudit(db, { type: "bogus_event", actor: "admin" }), /审计类型非法/)
    assert.throws(() => db.prepare("INSERT INTO audit_events (ts, type, actor_id, actor_name, target_id, target_name, detail) VALUES (?,?,?,?,?,?,?)").run(1, "bogus_event", null, "x", null, "", "{}"), /CHECK/)
    // 幂等（再开零变）
    db.close()
    const again = DB.openDatabase(file)
    try {
      assert.equal(DB.readVersion(again), 14, "v14 段幂等（再开零变）")
      assert.equal(again.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n, 2, "行数不变")
    } finally {
      again.close()
    }
  } finally {
    try {
      db.close()
    } catch {
      /* 已关（幂等腿内先关） */
    }
  }
})

test("①管理面四端点经 bin 注册面在位（源码断言：import + 注册行）", () => {
  const bin = readFileSync(join(ROOT, "thincoder-server/bin/thincoder-server.mjs"), "utf8")
  assert.match(bin, /registerChatRoutes/)
  assert.match(bin, /agent\/chat-routes\.mjs/)
  const pkg = JSON.parse(readFileSync(join(ROOT, "thincoder-server/package.json"), "utf8"))
  const chain = [...pkg.scripts.prepublishOnly.matchAll(/docs\/batches\/[\w.-]+\.test\.mjs/g)].map((m) => m[0])
  assert.ok(chain.includes("docs/batches/2026-10-11-admin-agent-chat.test.mjs"), "本件入链")
  assert.ok(chain.includes("docs/batches/2026-10-11-admin-agent-chat-tools.test.mjs"), "工具面件入链")
  assert.ok(chain.includes("docs/batches/2026-10-11-admin-agent-chat-ui.test.mjs"), "控制台账件入链")
})
