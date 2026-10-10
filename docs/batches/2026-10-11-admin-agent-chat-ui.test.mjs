/**
 * 2026-10-11-admin-agent-chat-ui.test.mjs — thincoder-server 批内单测件（控制台面·对话页——admin-agent-chat 批；判据源 =
 * `webui/WEBUI.md` §2.10 ∥ §2.2 ∥ §2.3④ ∥ §5 行数预算 ∥ §6 本批行；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-11-admin-agent-chat-ui.test.mjs`
 *
 * 射程（腿 ↔ 设计轴对照在括号）：
 *   ① 纯函数（NDJSON 行切分 ∥ 帧解析 ∥ 参数摘要两形 ∥ notice 四形（精确值）∥ 工具参数索引）
 *   ② 会话条（加载/空/失败三态 + 重试 ∥ 活动态 ∥ 在途徽标 ∥ 摘要空值「—」）
 *   ③ 新会话弹窗（模型下拉 `deriveModels` 同源 ∥ 缺省 = 最近一次所用 ∥ 无模型门 ∥ 提交 ⇒ 建会话 ⇒ 选中）
 *   ④ 对话区四形（用户 ∥ 助手 ∥ 工具行（失败红标 + 参数摘要回填）∥ notice）+ 空态
 *   ⑤ 输入区（空值不提交 ∥ 在途禁用 + 运行中指示）
 *   ⑥ 流读取（假流桩：分块跨帧 ∥ delta 追加 ∥ call/result 工具行 ∥ end ⇒ 重读详情——取数序列逐条）
 *   ⑦ 断连（读流中止——零未押异常，部分文本留场）∥ 离页（挂载点断开 ⇒ reader.cancel）∥ 流前错误（信封 ⇒ 就地人话 + 草稿还原）
 *   ⑧ i18n 两表（本批 33 键逐键在场 ∥ 占位符对位 ∥ en 零 CJK ∥ 基键集双向相等 ∥ 键数终值）
 *   ⑨ 审计面（`agent_event` 型接 ∥ 详情 `summary` 支 ∥ 枚举外原值兜底）
 *   ⑩ 静态面（档目 +1 ∥ nav 管理 9 ∥ app 接线 ∥ 非壳页 ∥ 行数/行宽 ∥ 零外链 ∥ t 字面量闭合 ∥ 类名双向闭合 ∥ AC-19 canon）
 *   ⑪ 键消费闭包（本批键零死键）
 *   ⑫ 流归属（流中切会话 ⇒ 丢帧不串台 ∥ `end` 不重读换视图 —— 评审轮 must-fix 的回归腿）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const [{ ZH }, { EN }, CHAT, MODELS, NAV, AUDIT] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("views-chat.mjs"), load("views-models.mjs"), load("nav.mjs"), load("views-audit.mjs"),
])
const VIEW_SRC = readPublic("views-chat.mjs")
const AUDIT_SRC = readPublic("views-audit.mjs")
const CSS = readPublic("style.css")

/** 本批新增键（31 `admin.chat.*` + 1 nav〔shell 部件〕+ 1 `audit.type.agent_event`〔system 部件〕——§2.2 键族登记；两表逐键同步）。 */
const NEW_KEYS = [
  "admin.chat.title", "admin.chat.newChat", "admin.chat.newChatHint", "admin.chat.create", "admin.chat.modelLabel",
  "admin.chat.modelPick", "admin.chat.noModels", "admin.chat.modelRequired", "admin.chat.chatsTitle", "admin.chat.chatsEmpty",
  "admin.chat.listFailed", "admin.chat.detailFailed", "admin.chat.retry", "admin.chat.statusRunning", "admin.chat.noChatSelected",
  "admin.chat.threadEmpty", "admin.chat.running", "admin.chat.reread", "admin.chat.toolCall", "admin.chat.toolResult",
  "admin.chat.toolCalling", "admin.chat.toolFailed", "admin.chat.inputPh", "admin.chat.send", "admin.chat.messageRequired",
  "admin.chat.inputHint", "admin.chat.noticeInterrupted", "admin.chat.noticeBudget", "admin.chat.noticeModelError",
  "admin.chat.noticeEmpty", "admin.chat.streamBroken",
  "nav.page.admin.chat", "audit.type.agent_event",
]
/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/([^:])\/\/.*$/gm, "$1")

// ── 桩 DOM（`h` 同 app 语义近似；`modal.mjs` 壳面近形：showModal/close/classList/remove）───────────

function makeNode(tag) {
  const classes = new Set()
  return {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, textContent: "", className: "", value: "", hidden: false, disabled: false, scrollTop: 0, scrollHeight: 0,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    append(...items) {
      for (const item of items.flat(Infinity)) {
        if (item === null || item === undefined || item === false) continue
        if (typeof item === "object") item.parent = this
        this.children.push(item)
      }
    },
    replaceChildren(...items) { this.children = []; this.append(...items) },
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { this.attrs[name] = String(value) },
    remove() {
      if (this.parent !== null) this.parent.children = this.parent.children.filter((child) => child !== this)
      this.parent = null
    },
    focus() {},
    fire(type, event = {}) {
      const target = { preventDefault() {}, ...event }
      return Promise.all((this.listeners[type] ?? []).map((fn) => fn(target)))
    },
    showModal() { this.open = true },
    close() { this.open = false; for (const fn of this.listeners.close ?? []) fn({}) },
  }
}

const stubDocument = () => ({ body: makeNode("body"), createElement: (tag) => makeNode(tag), getElementById: () => null })

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点。 */
function fH(tag, props = {}, ...children) {
  const node = makeNode(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = String(value)
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child)
  }
  return node
}

function fFindAll(root, pred, out = []) {
  if (root !== null && typeof root === "object" && root.tag !== undefined) {
    if (pred(root)) out.push(root)
    for (const child of root.children ?? []) fFindAll(child, pred, out)
  }
  return out
}
const fFind = (root, pred) => fFindAll(root, pred)[0] ?? null
const byText = (root, text) => fFind(root, (node) => node.textContent === text)
const textOf = (node) => (typeof node === "string" ? node : [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" "))
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const optionsOf = (select) => fFindAll(select, (node) => node.tag === "option")

/** 桩 ctx（api 路由表 `"METHOD path"` ⇒ handler；全调用入共享 `log`——与假 fetch 同序）。 */
function fCtx(routes = {}, log = []) {
  return {
    h: fH,
    dataShell: (mount, { head, area }) => mount.append(head, area),
    api: async (path, { method = "GET", body } = {}) => {
      log.push(`api ${method} ${path}`)
      const handler = routes[`${method} ${path}`] ?? routes[`${method} ${path.split("?")[0]}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    fmtTs: (ts) => `ts:${ts}`,
    table: (headers, rows, { foot = false } = {}) => fH("div", { class: "table-wrap" },
      fH("table", {},
        fH("thead", {}, fH("tr", {}, ...headers.map((label) => fH("th", { text: label })))),
        fH("tbody", {}, ...rows.map((cells) => fH("tr", {}, ...cells.map((cell) => fH("td", {}, ...(Array.isArray(cell) ? cell : [cell])))))),
        ...(foot ? [fH("tfoot", {}, fH("tr", {}, fH("td", { colspan: String(headers.length), text: ZH["common.rowCount"].replace("{count}", String(rows.length)) })))] : []))), // 表格（dom.mjs `table` 同形近似——审计页面）
    flash: (message) => log.push(`flash ${message}`),
    fail: (error) => log.push(`fail ${String(error?.message ?? error)}`),
  }
}

/** 假流（NDJSON 分块 ⇒ response）：`chunks` = 字符串块数组 ∥ `failAt` = 第 N 次 read 抛错（断连桩）。 */
function fStreamResponse(chunks, { failAt = -1 } = {}) {
  let index = 0
  let reads = 0
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    body: {
      getReader: () => ({
        async read() {
          if (failAt >= 0 && reads === failAt) throw new Error("socket closed")
          reads += 1
          if (index >= chunks.length) return { done: true, value: undefined }
          return { done: false, value: new TextEncoder().encode(chunks[index++]) }
        },
        async cancel() { reads += 1 },
      }),
    },
  }
}

/** 确定性失败（映射面人话——服务端信封形）。 */
const failEnvelope = (status, code, message) => () => ({
  ok: false, status, json: async () => ({ error: { code, message } }),
})

const fChatRow = (over = {}) => ({ id: 1, model: "p1/m-1", status: "idle", createdAt: 1700000000000, updatedAt: 1700000000000, excerpt: "你好", ...over })
const PROVIDERS = [{ id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: ["m-1", "m-2"] }]
const MODEL_IDS = MODELS.deriveModels(PROVIDERS).map((row) => row.id)

/** 页面渲染夹具（桩 DOM + 假 fetch——fetch 调用与 api 调用同入 `log`）。 */
async function fMount({ routes = {}, chats = [fChatRow()], chunks = [], fetchImpl = null } = {}) {
  globalThis.document = stubDocument()
  const log = []
  const ctx = fCtx({ "GET /api/admin/agent/chats": () => ({ chats }), ...routes }, log)
  globalThis.fetch = async (url, init) => {
    log.push(`fetch ${init.method} ${url}`)
    if (fetchImpl !== null) return fetchImpl(url, init)
    return fStreamResponse(chunks)
  }
  const mount = makeNode("section")
  await CHAT.renderChat(ctx, mount)
  return { ctx, log, mount }
}

const threadOf = (mount) => fFind(mount, (node) => node.className === "chat-thread")
const noteOf = (mount) => fFindAll(mount, (node) => node.tag === "p" && node.className === "hint error").at(-1) ?? null
const sendBtnOf = (mount) => byText(mount, ZH["admin.chat.send"])

// ── ① 纯函数（流帧面）────────────────────────────────────────────────────────

test("① 纯函数：行切分（跨块/残行）∥ 帧解析（坏行 null）∥ 参数摘要两形 ∥ notice 四形 ∥ 工具参数索引", () => {
  assert.deepEqual(CHAT.splitLines('{"type":"delta"}\n{"type":"ca', 'll"}\n'), { lines: ['{"type":"delta"}', '{"type":"call"}'], rest: "" }, "跨块行切分（残行归位）")
  assert.deepEqual(CHAT.splitLines("", '{"a":1}\n{"b"'), { lines: ["{\"a\":1}"], rest: '{"b"' }, "末帧无换行 ⇒ 残行留待再切")
  assert.deepEqual(CHAT.parseFrame('{"type":"delta","text":"x"}'), { type: "delta", text: "x" }, "帧解析")
  assert.deepEqual([CHAT.parseFrame("junk"), CHAT.parseFrame("[1]"), CHAT.parseFrame('{"text":"x"}')], [null, null, null], "坏行/非对象/无 type ⇒ null（跳过——零未押异常）")
  assert.deepEqual([CHAT.argsText('{"op":"list"}'), CHAT.argsText({ op: "list" }), CHAT.argsText(null)], ['{"op":"list"}', '{"op":"list"}', ""], "参数摘要两形兼容")
  assert.deepEqual(
    [CHAT.noticeText({ content: "x", data: { reason: "restart" } }), CHAT.noticeText({ content: "x", data: { reason: "budget" } }),
      CHAT.noticeText({ content: "x", data: { reason: "model_error" } }), CHAT.noticeText({ content: "x", data: { reason: "empty_turn" } }),
      CHAT.noticeText({ content: "服务端人话句", data: { reason: "model_error_v2" } }), CHAT.noticeText({ content: "人话句", data: {} }),
      CHAT.noticeText({ content: "" })],
    [ZH["admin.chat.noticeInterrupted"], ZH["admin.chat.noticeBudget"], ZH["admin.chat.noticeModelError"], ZH["admin.chat.noticeEmpty"],
      "服务端人话句", "人话句", "—"],
    "notice 四形精确值命中（`restart`/`budget`/`model_error`/`empty_turn`）+ 近似值不当命中（`model_error_v2` ⇒ 原文）+ 无 reason/空值兜底")
  const index = CHAT.toolArgsIndex([{ role: "assistant", data: { toolCalls: [{ id: "t1", name: "members", args: { op: "list" } }, { id: "t2", name: "audit", args: '{"limit":5}' }] } }])
  assert.deepEqual([index.get("t1"), index.get("t2")], ['{"op":"list"}', '{"limit":5}'], "工具参数索引（对象 ⇒ JSON 串 ∥ 字符串原样）")
})

// ── ② 会话条（三态 ∥ 活动态 ∥ 在途徽标）──────────────────────────────────────

test("② 会话条：加载态 ∥ 空态 ∥ 失败态 + 重试 ∥ 活动态 ∥ 在途徽标 ∥ 摘要空值「—」", async () => {
  // 加载态（列表读挂起——DOM 已建，提示在场）
  globalThis.document = stubDocument()
  const hanging = makeNode("section")
  const pending = CHAT.renderChat(fCtx({ "GET /api/admin/agent/chats": () => new Promise(() => {}) }, []), hanging)
  assert.ok(byText(hanging, ZH["common.loading"]) !== null, "加载态提示（读时读——未落地前）")
  assert.ok(byText(hanging, ZH["admin.chat.newChat"]) !== null, "新会话钮恒在场")
  assert.ok(byText(hanging, ZH["admin.chat.noChatSelected"]) !== null, "未选中会话 ⇒ 对话区空态")
  void pending
  // 空态
  const empty = await fMount({ chats: [] })
  assert.ok(fFind(empty.mount, (node) => node.textContent === ZH["admin.chat.chatsEmpty"]) !== null, "空态（零会话）")
  // 有会话：活动态 + 在途徽标 + 摘要空值
  const rows = [fChatRow({ id: 1, excerpt: "你好" }), fChatRow({ id: 2, status: "running", excerpt: "" })]
  const list = await fMount({ chats: rows, routes: { "GET /api/admin/agent/chats/1": () => ({ chat: rows[0], messages: [] }) } })
  const buttons = fFindAll(list.mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))
  assert.equal(buttons.length, 2, "两行会话")
  assert.equal(buttons[1].className.includes("active"), false, "未选中 ⇒ 零活动态")
  assert.ok(byText(buttons[1], ZH["admin.chat.statusRunning"]) !== null, "在途徽标（status=running）")
  assert.ok(textOf(buttons[1]).includes("—"), "摘要空值 ⇒ 「—」")
  assert.deepEqual(list.log, ["api GET /api/admin/agent/chats"], "进页只取列表（详情随选中）")
  await buttons[0].fire("click")
  await tick()
  assert.ok(fFindAll(list.mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].className.includes("active"), "选中 ⇒ 活动态")
  assert.deepEqual(list.log, ["api GET /api/admin/agent/chats", "api GET /api/admin/agent/chats/1"], "选中 ⇒ 取详情（读时读）")
  // 失败态 + 重试（重试 ⇒ 再读一次）
  const bad = await fMount({ routes: { "GET /api/admin/agent/chats": () => { throw Object.assign(new Error("boom"), { status: 500, code: "internal_error" }) } } })
  assert.ok(fFindAll(bad.mount, (node) => node.className === "hint error").map(textOf).join(" | ").includes(ZH["admin.chat.listFailed"]), "失败 ⇒ 就地错态")
  assert.ok(bad.log.some((entry) => entry.startsWith("fail ")), "fail 收口")
  await byText(bad.mount, ZH["admin.chat.retry"]).fire("click")
  await tick()
  assert.equal(bad.log.filter((entry) => entry === "api GET /api/admin/agent/chats").length, 2, "重试 ⇒ 再读一次")
  delete globalThis.document
})

// ── ③ 新会话弹窗（模型下拉 ∥ 缺省 ∥ 提交门）──────────────────────────────────

test("③ 新会话弹窗：模型下拉 `deriveModels` 同源 ∥ 缺省 = 最近一次所用 ∥ 无模型门 ∥ 提交 ⇒ 建会话 ⇒ 选中", async () => {
  const routes = {
    "GET /api/admin/providers": () => ({ providers: PROVIDERS }),
    "POST /api/admin/agent/chats": (body) => ({ chat: fChatRow({ id: 9, model: body.model, excerpt: "" }) }),
    "GET /api/admin/agent/chats/9": () => ({ chat: fChatRow({ id: 9, model: "p1/m-2" }), messages: [] }),
  }
  const { log, mount } = await fMount({ routes })
  await byText(mount, ZH["admin.chat.newChat"]).fire("click")
  const dialog = fFind(globalThis.document.body, (node) => node.tag === "dialog")
  assert.ok(dialog !== null && dialog.open === true, "弹窗开启（modal.mjs 基座）")
  assert.ok(fFind(dialog, (node) => node.textContent === ZH["admin.chat.newChatHint"]) !== null, "换模型提示（会话内不换模型）")
  await tick()
  const select = fFind(dialog, (node) => node.tag === "select")
  assert.deepEqual(optionsOf(select).map((option) => option.value), ["", ...MODEL_IDS], "模型下拉 = provider 展平（含占位项）")
  assert.equal(select.value, "p1/m-1", "缺省 = 最近一条会话所用模型（KD-SV-87 同口径）")
  // 提交 ⇒ POST ⇒ 列表刷新 + 选中新会话
  await fFind(dialog, (node) => node.tag === "form").fire("submit")
  await tick()
  assert.deepEqual(log, [
    "api GET /api/admin/agent/chats", "api GET /api/admin/providers",
    "api POST /api/admin/agent/chats", "api GET /api/admin/agent/chats", "api GET /api/admin/agent/chats/9",
  ], "提交体（所选中 model）⇒ 建会话 ⇒ 选中（列表刷新 + 详情）")
  assert.equal(log.includes("api POST /api/admin/agent/chats"), true, "POST 在册")
  // 无模型门（providers 空 ⇒ 空选 + 就地必填；零 POST）
  const emptyModels = await fMount({ routes: { "GET /api/admin/providers": () => ({ providers: [] }) } })
  await byText(emptyModels.mount, ZH["admin.chat.newChat"]).fire("click")
  const dialog2 = fFind(globalThis.document.body, (node) => node.tag === "dialog")
  await tick()
  assert.deepEqual(optionsOf(fFind(dialog2, (node) => node.tag === "select")).map((option) => option.textContent), [ZH["admin.chat.noModels"]], "无模型 ⇒ 提示项")
  await fFind(dialog2, (node) => node.tag === "form").fire("submit")
  await tick()
  assert.equal(noteOf(dialog2).textContent, ZH["admin.chat.modelRequired"], "提交门（空选不提交）")
  assert.equal(emptyModels.log.some((entry) => entry.startsWith("api POST")), false, "被拒 ⇒ 零 POST")
  assert.equal(dialog2.open, true, "被拒 ⇒ 留窗（草稿不丢）")
  delete globalThis.document
})

// ── ④ 对话区四形（渲染 ∥ 参数摘要回填 ∥ 失败红标）─────────────────────────────

test("④ 对话区：四形渲染（用户/助手/工具行/notice）∥ 参数摘要自 `toolCalls` 回填 ∥ 失败红标 ∥ 线程空态", async () => {
  const messages = [
    { seq: 1, role: "user", content: "看看成员", data: null },
    { seq: 2, role: "assistant", content: "", data: { toolCalls: [{ id: "t1", name: "members", args: { op: "list" } }] } },
    { seq: 3, role: "tool", content: "", data: { toolCallId: "t1", name: "members", ok: false, summary: "参数缺 username" } },
    { seq: 4, role: "assistant", content: "成员共 3 人", data: null },
    { seq: 5, role: "notice", content: "空回合，本轮结束", data: { reason: "empty_turn" } },
  ]
  const chat = fChatRow({ id: 1, model: "p1/m-1" })
  const { mount } = await fMount({ chats: [chat], routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages }) } })
  await fFindAll(mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  const thread = threadOf(mount)
  const user = fFind(thread, (node) => node.className === "chat-msg user")
  const assistants = fFindAll(thread, (node) => node.className === "chat-msg assistant")
  const tool = fFind(thread, (node) => node.className === "chat-msg tool")
  const notice = fFind(thread, (node) => node.className === "chat-msg notice")
  assert.equal(textOf(user), "看看成员", "用户气泡")
  assert.deepEqual(assistants.map((node) => textOf(node)), ["成员共 3 人"], "助手文本（空文本行 ⇒ 零节点）")
  assert.equal(tool !== null, true, "工具行在册")
  assert.ok(textOf(tool).includes(`{"op":"list"}`), "参数摘要自 assistant.toolCalls 回填")
  assert.ok(textOf(tool).includes("参数缺 username"), "结果摘要")
  assert.equal(tool.classList.contains("failed"), true, "失败红标（行类）")
  assert.ok(byText(tool, ZH["admin.chat.toolFailed"]) !== null, "失败徽标")
  assert.equal(notice.textContent, ZH["admin.chat.noticeEmpty"], "notice 灰条（四形键映射——精确值判）")
  assert.ok(fFind(mount, (node) => node.textContent === String(chat.model)) !== null, "对话区题 = 会话模型")
  // 线程空态（选中但零消息）
  const emptyThread = await fMount({ routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages: [] }) } })
  await fFindAll(emptyThread.mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  assert.ok(fFind(threadOf(emptyThread.mount), (node) => node.textContent === ZH["admin.chat.threadEmpty"]) !== null, "线程空态")
  delete globalThis.document
})

// ── ⑤ 输入区（空值不提交 ∥ 在途禁用）─────────────────────────────────────────

test("⑤ 输入区：空值不提交（就地必填）∥ 在途禁用 + 运行中指示 ∥ 终态复位", async () => {
  let release = null
  const gate = new Promise((resolve) => { release = resolve })
  const chat = fChatRow({ id: 1 })
  const fetchImpl = async () => { await gate; return fStreamResponse(['{"type":"end","status":"succeeded"}\n']) }
  const { log, mount } = await fMount({ chats: [chat], routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages: [] }) }, fetchImpl })
  await fFindAll(mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  const form = fFind(mount, (node) => node.tag === "form")
  const input = fFind(form, (node) => node.tag === "textarea")
  const send = sendBtnOf(mount)
  const running = fFind(mount, (node) => node.textContent === ZH["admin.chat.running"])
  assert.equal(input.attrs.placeholder, ZH["admin.chat.inputPh"], "输入区占位（键单源）")
  // 空值不提交
  await form.fire("submit")
  assert.equal(noteOf(mount).textContent, ZH["admin.chat.messageRequired"], "空值 ⇒ 就地必填提示")
  assert.equal(log.some((entry) => entry.startsWith("fetch")), false, "空值 ⇒ 零请求")
  // 非空 ⇒ 在途禁用 + 运行中指示
  input.value = "  跑一轮  "
  const submitted = form.fire("submit")
  await tick()
  assert.deepEqual([send.disabled, running.hidden], [true, false], "在途 ⇒ 发送钮禁用 + 运行中指示")
  assert.equal(input.value, "", "提交即清草稿")
  release()
  await submitted
  await tick()
  assert.equal(send.disabled, false, "终态 ⇒ 复位（可再发）")
  assert.equal(running.hidden, true, "终态 ⇒ 运行中指示退场")
  delete globalThis.document
})

// ── ⑥ 流读取（分块跨帧 ∥ 帧序 ∥ end ⇒ 重读——取数序列逐条）─────────────────────

test("⑥ 流读取：分块跨帧无损 ∥ delta 追加 ∥ call/result 工具行 ∥ end ⇒ 重读详情（读时单源）", async () => {
  const chat = fChatRow({ id: 1 })
  const stored = [
    { seq: 1, role: "user", content: "你好" },
    { seq: 2, role: "assistant", content: "你好——已落库", data: { toolCalls: [{ id: "t1", name: "members", args: "{\"op\":\"list\"}" }] } },
    { seq: 3, role: "tool", content: "", data: { toolCallId: "t1", name: "members", ok: false, summary: "缺 username" } },
    { seq: 4, role: "notice", content: "预算超限", data: { reason: "budget" } },
  ]
  const chunks = [
    '{"type":"delta","text":"你',
    '好"}\n{"type":"call","id":"t1","name":"members","args":"{\\"op\\":\\"list\\"}"}\n',
    '{"type":"result","id":"t1","ok":false,"summary":"缺 username"}\n{"type":"end","status":"failed","reason":"预算超限"}\n',
  ]
  const { log, mount } = await fMount({
    chats: [chat],
    routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages: log.includes("fetch POST /api/admin/agent/chats/1/messages") ? stored : [] }) },
    chunks,
  })
  await fFindAll(mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  const form = fFind(mount, (node) => node.tag === "form")
  fFind(form, (node) => node.tag === "textarea").value = "你好"
  await form.fire("submit")
  await tick()
  const thread = threadOf(mount)
  assert.equal(textOf(fFind(thread, (node) => node.className === "chat-msg assistant")), "你好——已落库", "end ⇒ 重读替代流式视图（读时单源）")
  const tool = fFind(thread, (node) => node.className === "chat-msg tool")
  assert.ok(textOf(tool).includes("缺 username") && tool.classList.contains("failed"), "工具行（失败红标）自存储回读重建")
  assert.equal(fFind(thread, (node) => node.className === "chat-msg notice").textContent, ZH["admin.chat.noticeBudget"], "notice 行自存储回读（三形键）")
  assert.deepEqual(log, [
    "api GET /api/admin/agent/chats",
    "api GET /api/admin/agent/chats/1",
    "fetch POST /api/admin/agent/chats/1/messages",
    "api GET /api/admin/agent/chats/1",
  ], "取数序列逐条（列表 ⇒ 详情 ⇒ 流 POST ⇒ end 后重读）")
  delete globalThis.document
})

// ── ⑦ 断连 ∥ 流前错误 ───────────────────────────────────────────────────────

test("⑦ 断连（读流中止——零未押异常，部分文本留场，草稿不还原）∥ 离页（挂载点断开 ⇒ reader.cancel ∥ 不触发重读）∥ 流前错误（信封 ⇒ 就地人话 + 草稿还原）", async () => {
  const chat = fChatRow({ id: 1 })
  // 断连：首块含半帧 + delta，第二次 read 抛错 ⇒ 残帧不落地、无异常、就地人话
  const main = await fMount({
    chats: [chat], routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages: [] }) },
    fetchImpl: async () => fStreamResponse(['{"type":"delta","text":"前半"}\n{"type":"delta","text":"残', '半"}\n'], { failAt: 1 }),
  })
  await fFindAll(main.mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  const form = fFind(main.mount, (node) => node.tag === "form")
  const input = fFind(form, (node) => node.tag === "textarea")
  input.value = "hi"
  await form.fire("submit")
  await tick()
  assert.equal(noteOf(main.mount).textContent, ZH["admin.chat.streamBroken"], "断连 ⇒ 就地人话（零未押异常）")
  assert.equal(textOf(threadOf(main.mount)), "前半", "已收帧留场；残帧不落地")
  assert.equal(main.log.at(-1), "fetch POST /api/admin/agent/chats/1/messages", "断连无 end ⇒ 不触发重读")
  assert.equal(sendBtnOf(main.mount).disabled, false, "断连 ⇒ 输入区复位（回合照跑——可重读）")
  assert.equal(input.value, "", "断连 ⇒ 草稿不还原（落库已起——重发 = 双发）")
  // 离页（路由卸载——挂载点断开）：流中 ⇒ reader.cancel ∥ 零重读
  let gate = null
  const parked = new Promise((resolve) => { gate = resolve })
  const state = { reads: 0, cancelled: false }
  const leave = await fMount({
    chats: [chat], routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages: [] }) },
    fetchImpl: async () => ({
      ok: true, status: 200, json: async () => ({}), state,
      body: { getReader: () => ({
        async read() {
          state.reads += 1
          if (state.reads === 1) return { done: false, value: new TextEncoder().encode('{"type":"delta","text":"a"}\n') }
          await parked // 二读挂起（离页时刻可控）
          return { done: false, value: new TextEncoder().encode('{"type":"delta","text":"b"}\n') }
        },
        async cancel() { state.cancelled = true; gate() },
      }) },
    }),
  })
  await fFindAll(leave.mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  const leaveForm = fFind(leave.mount, (node) => node.tag === "form")
  fFind(leaveForm, (node) => node.tag === "textarea").value = "hi"
  const inFlight = leaveForm.fire("submit")
  await tick()
  leave.mount.isConnected = false // 路由切换（app.mjs `replaceChildren` ⇒ 旧挂载点卸载）
  gate()
  await inFlight
  await tick()
  assert.equal(state.cancelled, true, "离页 ⇒ 读流中止（reader.cancel）")
  assert.equal(leave.log.at(-1), "fetch POST /api/admin/agent/chats/1/messages", "离页 ⇒ 不触发重读")
  // 流前错误（400 信封——在途再发）
  const pre = await fMount({
    chats: [chat], routes: { "GET /api/admin/agent/chats/1": () => ({ chat, messages: [] }) },
    fetchImpl: failEnvelope(400, "invalid_request_error", "本会话正在执行——等它结束"),
  })
  await fFindAll(pre.mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))[0].fire("click")
  await tick()
  const form2 = fFind(pre.mount, (node) => node.tag === "form")
  const input2 = fFind(form2, (node) => node.tag === "textarea")
  input2.value = "hi"
  await form2.fire("submit")
  await tick()
  assert.equal(noteOf(pre.mount).textContent, ZH["err.invalid_request_error"].replace("{detail}", "本会话正在执行——等它结束"), "流前错误 ⇒ 映射人话（服务端原文随句）")
  assert.equal(input2.value, "hi", "流前错误 ⇒ 草稿还原（零副作用——重试不需重打）")
  delete globalThis.document
})

// ── ⑧ i18n 两表（§2.2——键族 ∥ 占位符 ∥ en 零 CJK ∥ 键集 ∥ 键数）────────────────

test("⑧ i18n：本批 33 键逐键在场 ∥ 占位符对位 ∥ en 零 CJK ∥ 基键集双向相等 ∥ 键数终值 555 ∥ 560", () => {
  for (const key of NEW_KEYS) {
    for (const [lang, table] of [["zh", ZH], ["en", EN]]) {
      assert.ok(typeof table[key] === "string" && table[key].trim() !== "", `${lang} 表缺键：${key}`)
    }
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不对位：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 值含 CJK：${key}`)
  }
  assert.equal(NEW_KEYS.length, 33, "本批键数（31 admin.chat + 1 nav + 1 audit 型键）")
  const SELF_NAMES = new Set(["lang.zh", "lang.en"])
  const base = (table) => new Set(Object.keys(table).filter((key) => !SELF_NAMES.has(key)).map((key) => key.replace(/\.one$/, "")))
  const zhBase = base(ZH)
  const enBase = base(EN)
  assert.deepEqual([...zhBase].filter((key) => !enBase.has(key)), [], "仅 zh 键（自称名族除外）")
  assert.deepEqual([...enBase].filter((key) => !zhBase.has(key)), [], "仅 en 键（`.one` 变体族除外）")
  assert.equal(ZH["nav.page.admin.chat"], "对话", "nav 键（zh）")
  assert.equal(EN["nav.page.admin.chat"], "Chat", "nav 键（en）")
  assert.deepEqual([Object.keys(ZH).length, Object.keys(EN).length], [555, 560], "键数终值（2026-10-11 两批后）")
})

// ── ⑨ 审计面（`agent_event` 型接 ∥ 详情 summary 支）──────────────────────────

test("⑨ 审计面：`agent_event` 型接（下拉 + 表）∥ 详情 `summary` 支 ∥ 枚举外型原值兜底", async () => {
  const events = [
    { ts: 1700000000000, type: "agent_event", actor: "admin", target: "chat:1", detail: { kind: "chat_call", chatId: 1, tool: "members", summary: "members list ⇒ ok（3 项）" } },
    { ts: 1700000001000, type: "sandbox_event", actor: "admin", target: "", detail: { kind: "container_start" } },
  ]
  globalThis.document = stubDocument()
  const log = []
  const ctx = fCtx({ "GET /api/audit": () => ({ events }) }, log)
  const mount = makeNode("section")
  await AUDIT.renderAudit(ctx, mount)
  const select = fFind(mount, (node) => node.tag === "select")
  assert.ok(optionsOf(select).some((option) => option.value === "agent_event" && option.textContent === ZH["audit.type.agent_event"]), "型面下拉接 agent_event")
  const cells = fFindAll(mount, (node) => node.tag === "td").map((cell) => textOf(cell))
  assert.ok(cells.includes(ZH["audit.type.agent_event"]), "表内类型文案（表键）")
  assert.ok(cells.includes("members list ⇒ ok（3 项）"), "详情 summary 支（原句渲染）")
  assert.ok(cells.includes("sandbox_event"), "枚举外型 ⇒ 原值兜底（零遗漏）")
  assert.ok(AUDIT_SRC.includes("agent_event") && AUDIT_SRC.includes("detail.summary"), "型枚举 + summary 支在档（结构面）")
  delete globalThis.document
})

// ── ⑩ 静态面（档目 ∥ nav ∥ app 接线 ∥ 非壳页 ∥ 行数/行宽 ∥ 零外链 ∥ 键/类闭合 ∥ canon）─────

test("⑩ 静态面：档目 36 ∥ 37 ∥ nav 管理 9（对话位次 2）∥ app 接线 ∥ 非壳页 ∥ 行数/行宽/零外链 ∥ 键/类闭合 ∥ AC-19 canon", () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [37, 36], "档目 37 ∥ 36（2026-10-11 两批 + 拆分层后）")
  assert.ok(names.includes("views-chat.mjs"), "新档在册")
  // nav（管理 9 ∥ 「对话」第 2 位——总览后）
  const admin = NAV.NAV_GROUPS.find((group) => group.key === "admin")
  assert.equal(admin.items.length, 9, "管理 9（对话 +1）")
  assert.deepEqual(admin.items[1], { key: "chat", labelKey: "nav.page.admin.chat", path: "/admin/chat" }, "对话 = 管理组第 2 位（labelKey 单源）")
  assert.deepEqual(NAV.resolveRoute("/admin/chat", "admin"), { path: "/admin/chat" }, "admin 面可达")
  assert.equal(NAV.resolveRoute("/admin/chat", "user").denied, true, "user ⇒ 页面级 denied（判权仍在服务端）")
  assert.deepEqual(NAV.ROUTE_ALIASES, { "/me": "/me/keys", "/admin": "/admin/overview", "/admin/proxy": "/admin/system" }, "旧链别名零动")
  // app.mjs 接线（import + PAGES 行）+ 非壳页
  const appSrc = readPublic("app.mjs")
  assert.ok(appSrc.includes('import { renderChat } from "./views-chat.mjs"'), "app 导入面")
  assert.ok(appSrc.includes('"/admin/chat": renderChat'), "app PAGES 行")
  const shell = appSrc.match(/const SHELL_PAGES = new Set\(\[([^\]]*)\]\)/)[1]
  assert.deepEqual(shell.split(",").map((entry) => entry.trim()).filter(Boolean), ['"/admin/members"', '"/admin/providers"', '"/admin/models"', '"/admin/audit"', '"/me/usage"'], "SHELL_PAGES 五路径不动（对话页非壳——§2.10）")
  // 行数/行宽/零外链/零 CJK（软线 500）
  const lines = VIEW_SRC.split("\n").length
  assert.ok(lines <= 500, `views-chat.mjs 越 500 软线（硬限 800）：${lines}`)
  assert.ok(Math.max(...VIEW_SRC.split("\n").map((line) => line.length)) <= 300, "行宽 ≤300")
  assert.deepEqual([/https?:\/\//.test(VIEW_SRC), VIEW_SRC.includes("@import")], [false, false], "零外链（KD-SV-9）")
  assert.equal(CJK.test(stripComments(VIEW_SRC)), false, "档面代码段零 CJK（文案全入两表）")
  // `t` 字面量闭合（两表）
  for (const match of stripComments(VIEW_SRC).matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) {
    assert.ok(match[1] in ZH && match[1] in EN, `t 字面量悬空：${match[1]}`)
  }
  // 类名双向闭合（AC-19 canon 同口径——档面字面类 ⊆ 样式类；新类双向在场）
  const cssClasses = new Set([...CSS.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((match) => match[1]))
  const used = new Set()
  for (const match of VIEW_SRC.matchAll(/\bclass(?:Name)?\s*[:=]\s*([^\n;]*?)(?=\s*\bclass(?:Name)?\s*[:=]|[;\n]|$)/g)) {
    const window = match[1].replace(/\$\{[^}]*\}/g, " ").split("//")[0].split("}")[0].split(/,\s*[A-Za-z_$][\w$]*\s*:/)[0]
    for (const literal of window.matchAll(/["'`]([^"'`]*)["'`]/g)) for (const token of literal[1].split(/\s+/)) if (token) used.add(token)
  }
  for (const match of VIEW_SRC.matchAll(/classList\.(?:add|remove)\(([^)]*)\)/g)) {
    for (const literal of match[1].matchAll(/["'`]([^"'`]*)["'`]/g)) for (const token of literal[1].split(/\s+/)) if (token) used.add(token) // 类名直添面（`classList.add("failed")` 类）
  }
  // （启发式注：上面两条提取优先把模板占位置空再取字面量——本批类名全为字面量故完整；后续批若改拼接类名需同步加固）
  for (const token of used) assert.ok(cssClasses.has(token), `档面类无样式规则：${token}`)
  for (const token of ["chat-list", "chat-row", "chat-thread", "chat-msg", "user", "assistant", "notice", "tool", "failed", "chat-tool-arrow", "chat-form", "active"]) {
    assert.ok(used.has(token) && cssClasses.has(token), `本批新类双向闭合：${token}`)
  }
  // `:root` 38 ∥ 悬停七条不破（本批零新变量/悬停——AC-19 canon）
  const cssClean = stripComments(CSS)
  assert.equal([...cssClean.match(/:root\s*\{[^{}]*\}/)[0].matchAll(/(--[\w-]+)\s*:/g)].length, 38, ":root 38（零新增）")
  assert.equal([...cssClean.matchAll(/:hover/g)].length, 7, "悬停七条（零新增）")
})

// ── ⑪ 收尾：`t` 键族闭包（本批键全被消费）────────────────────────────────────

test("⑪ 键消费闭包：`admin.chat.*` 键族在档面被消费（零死键）∥ notice 四形经映射表消费", () => {
  const source = stripComments(VIEW_SRC)
  const consumed = new Set([
    ...[...source.matchAll(/\bt\(\s*"([^"]+)"/g)].map((match) => match[1]),
    ...[...source.matchAll(/"([a-zA-Z][\w]*(?:\.[\w]+)+)"/g)].map((match) => match[1]), // 全字符串字面量（键可作映射表值——如 NOTICE_KEYS）
  ])
  const deadKeys = NEW_KEYS.filter((key) => key.startsWith("admin.chat.") && !consumed.has(key))
  assert.deepEqual(deadKeys, [], "admin.chat.* 零死键（逐键有消费点）")
  for (const key of ["admin.chat.noticeInterrupted", "admin.chat.noticeBudget", "admin.chat.noticeModelError", "admin.chat.noticeEmpty"]) {
    assert.ok(consumed.has(key), `notice 四形消费：${key}`)
  }
})

// ── ⑫ 流归属（流中切会话 ⇒ 丢帧不串台 ∥ `end` 不重读换视图——评审轮 must-fix 的回归腿）────────

test("⑫ 流归属：流中切到别会话 ⇒ 直播帧不串台 ∥ `end` 不重读（视图仍 = 当前选中会话）", async () => {
  const chatA = fChatRow({ id: 1, model: "p1/m-1" })
  const chatB = fChatRow({ id: 2, model: "p1/m-2", excerpt: "乙会话" })
  const storedB = [{ seq: 1, role: "user", content: "乙会话首条" }, { seq: 2, role: "assistant", content: "乙会话回复" }]
  let gate = null
  const parked = new Promise((resolve) => { gate = resolve })
  let step = 0
  const { log, mount } = await fMount({
    chats: [chatA, chatB],
    routes: { "GET /api/admin/agent/chats/1": () => ({ chat: chatA, messages: [] }), "GET /api/admin/agent/chats/2": () => ({ chat: chatB, messages: storedB }) },
    fetchImpl: async () => ({
      ok: true, status: 200, json: async () => ({}),
      body: { getReader: () => ({
        async read() {
          step += 1
          if (step === 1) return { done: false, value: new TextEncoder().encode('{"type":"delta","text":"LIVE-A"}\n') }
          if (step === 2) { await parked; return { done: false, value: new TextEncoder().encode('{"type":"delta","text":"LIVE-B"}\n{"type":"end","status":"succeeded"}\n') } }
          return { done: true, value: undefined }
        },
        async cancel() {},
      }) },
    }),
  })
  const rows = () => fFindAll(mount, (node) => node.tag === "button" && node.className.startsWith("chat-row"))
  await rows()[0].fire("click") // 选中 A
  await tick()
  const form = fFind(mount, (node) => node.tag === "form")
  fFind(form, (node) => node.tag === "textarea").value = "hi"
  const inFlight = form.fire("submit")
  await tick()
  assert.ok(textOf(threadOf(mount)).includes("LIVE-A"), "A 在途：本会话直播帧落地")
  await rows()[1].fire("click") // 流中切到 B
  await tick()
  gate()
  await inFlight
  await tick()
  assert.equal(textOf(threadOf(mount)).includes("LIVE-B"), false, "切走后 ⇒ A 的后续帧不落 B 面（不串台）")
  assert.ok(textOf(threadOf(mount)).includes("乙会话回复"), "B 面 = B 的存储内容")
  assert.ok(fFind(mount, (node) => node.textContent === String(chatB.model)) !== null, "对话区题仍 = B（`end` 未把视图换成 A）")
  assert.equal(log.filter((entry) => entry === "api GET /api/admin/agent/chats/1").length, 1, "`end` ⇒ 切走后不重读 A（只余选中那次）")
  assert.deepEqual(log, [
    "api GET /api/admin/agent/chats", "api GET /api/admin/agent/chats/1", "fetch POST /api/admin/agent/chats/1/messages", "api GET /api/admin/agent/chats/2",
  ], "取数序列：切会话后零额外读（不换视图）")
  delete globalThis.document
})
