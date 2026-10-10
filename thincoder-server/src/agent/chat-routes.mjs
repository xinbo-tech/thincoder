/**
 * chat-routes.mjs — 管理面 agent 会话面四端点（`gateway/API.md` §2.8 ∥ `agent/ADMIN-AGENT.md` §11；admin-agent-chat 批——台账 #1254）：
 * 建会话 ∥ 会话列表（倒序）∥ 会话详情（消息全量）∥ 发一条（NDJSON 帧流）。
 *
 * 契约（§2.8）：端点族 = `/api/admin/agent/*`；判权 = `requireAdmin` 全族（`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401）；错误形 = §3 全码沿用（**零新码**）；
 * 在途门（`running` ⇒ 400 人话）∥ 不存在 ⇒ 404 ∥ `content` 空/非字符串 ⇒ 400 ∥ 模型不可用 ⇒ 400（**流未起——信封形**）。
 * 流形：`application/x-ndjson`（每行一帧 `delta`/`call`/`result`/`end`；`Cache-Control: no-store`）；**流中失败 = `end` 帧**（headers 已发——不再走信封）。
 * 重启恢复（`running` ⇒ `idle` + notice + `chat_stop` 审计）= **装配期执行**（无端点——本注册行内跑；KD-SV-86 如实收尾）。
 * 审计写（`agent_event`——KD-SV-91）：`chat_start`（会话创建）∥ 重启 `chat_stop` 在本档；逐调用 `chat_call` 与异常 `chat_stop` 在 `chat.mjs`。
 * 注入口径（批内件替身）：`deps`（`chat` 假模型出口 ∥ `tools` 假工具面 ∥ `runtime`/`config`/`env`/`fetchImpl`/`guard` 工具面装配上下 ∥ `budget`）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { requireAdmin } from "../accounts/session.mjs"
import { HttpError, sendJson } from "../gateway/errors.mjs"
import { listProviderEntries } from "../gateway/providers.mjs"
import { readJsonBody } from "../gateway/server.mjs"
import { assertChatIdle, chatRowOr404, claimChatTurn, createChat, getChatDetail, listChats, resumeRunningChats, runChatTurn } from "./chat.mjs"
import { providerModelRefs } from "./run.mjs"

/** 模型可用性判（KD-SV-87 同判——建会话与发消息两处同门）：不合 ⇒ 抛（调用侧转 400 信封；消息人话）。 */
export function assertChatModelAvailable(db, model) {
  const refs = new Set(providerModelRefs(listProviderEntries(db)))
  if (refs.size === 0) throw new Error("无可用模型（provider 注册表为空）——先在服务模型页配置 provider")
  if (!refs.has(model)) throw new Error(`模型不可用：${model}（不在注册表——先在服务模型页配置）`)
}

/**
 * 注册会话面四端点（§2.8）：装配期先跑**重启恢复钩**（`running` ⇒ `idle` + notice + 审计——KD-SV-86）。
 * 出 = 无（端点行即注册面）；`deps` 透传 `runChatTurn`（注入面——见档头）。
 */
export function registerChatRoutes(routes, { db, log = null, deps = {}, now = Date.now } = {}) {
  if (!db) throw new Error("registerChatRoutes：缺少 db（openDatabase 产物）")

  // 重启恢复（§11——装配期；无端点；已落库消息零动）
  const recovered = resumeRunningChats(db, { now })
  if (recovered > 0) log?.info("chat_restart_recovered", { chats: recovered })

  routes.add("POST", "/api/admin/agent/chats", async (req, res) => {
    const { member: admin } = requireAdmin(db, req)
    const body = await readJsonBody(req)
    const model = typeof body?.model === "string" ? body.model.trim() : ""
    if (model === "") throw new HttpError("invalid_request_error", "model 必填（建会话时选择——下拉源 = 服务模型页开放清单）")
    try {
      assertChatModelAvailable(db, model)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 400（KD-SV-87 同判——库零变）
    }
    const row = createChat(db, { model, createdBy: admin.id, now })
    recordAudit(db, {
      type: "agent_event",
      actor: admin.name,
      actorId: admin.id,
      target: `chat:${row.id}`,
      detail: { kind: "chat_start", chatId: row.id },
      ts: now(),
    })
    sendJson(res, 200, { chat: { id: row.id, model: row.model, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at } })
  })

  routes.add("GET", "/api/admin/agent/chats", (req, res) => {
    requireAdmin(db, req)
    sendJson(res, 200, listChats(db)) // 倒序（新在前；行携 excerpt）
  })

  routes.add("GET", "/api/admin/agent/chats/:id", (req, res, ctx) => {
    requireAdmin(db, req)
    const detail = getChatDetail(db, ctx.params.id)
    if (!detail) throw new HttpError("not_found", `会话不存在：${ctx.params.id}`)
    sendJson(res, 200, detail)
  })

  routes.add("POST", "/api/admin/agent/chats/:id/messages", async (req, res, ctx) => {
    requireAdmin(db, req)
    const row = chatRowOr404(db, ctx.params.id) // 不存在 ⇒ 404（信封）
    const body = await readJsonBody(req)
    const content = typeof body?.content === "string" ? body.content : ""
    if (content.trim() === "") throw new HttpError("invalid_request_error", "content 必填（本轮消息文本）")
    assertChatIdle(row) // 在途门只读预检（§2.8 行序：在途先行于模型校——报文与置位同一个）
    try {
      assertChatModelAvailable(db, row.model)
    } catch (e) {
      throw new HttpError("invalid_request_error", e.message) // 模型不可用 ⇒ 400（流未起——信封形）
    }
    claimChatTurn(db, row.id, { now }) // 置在途（同步段——零竞态）

    // 流起（此后 errors 走 `end` 帧——headers 已发）
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    })
    res.on("error", () => {}) // 断连不炸（回合照跑——执行不依赖连接）
    const emit = (frame) => {
      if (res.writableEnded || res.destroyed) return
      res.write(`${JSON.stringify(frame)}\n`)
    }
    try {
      await runChatTurn({ db, chatId: row.id, content, emit, deps, now, log })
    } catch (e) {
      log?.error("chat_turn_failed", { chatId: row.id, message: e?.message ?? String(e) })
      emit({ type: "end", status: "failed", reason: `回合异常：${e?.message ?? e}` })
    } finally {
      if (!res.writableEnded && !res.destroyed) res.end()
    }
  })
}
