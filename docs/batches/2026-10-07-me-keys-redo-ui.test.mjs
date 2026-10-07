/**
 * 2026-10-07-me-keys-redo-ui.test.mjs — thincoder-server 批内单测件（me-keys 批 · B 轮（前端面）——UI 腿；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存；服务端腿 = `-me-keys-redo.test.mjs`（A 轮——两件同批）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-me-keys-redo-ui.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §2.3⑥ ∥ §6 AC-25 续 ∥ §2.2 键族）：
 *   ① 页形（桩 DOM 直渲 `renderMeKeys`）：六列表头逐键在场 ∥ 行映射（名称/提示形/签发时间/最后使用/近 30 天/吊销）
 *      ∥ 「从未使用」分支 ∥ 空态引导分支 ∥ 页面零 `window.confirm`（档面扫描）
 *   ② 双弹窗（`modal.mjs` 真件直驱）：签发（名称输入 ∥ trim ∥ 空名 ⇒ null ∥ 成功 ⇒ 关窗 + 页级秘密区回显 + 表刷新
 *      ∥ 失败 ⇒ 窗内状态行）∥ 吊销（名 + 提示形 + 后果文案 ∥ 提交含 keyId ∥ 成功 ⇒ 关窗 + 表刷新 + flash「已吊销」）
 *   ③ 复制三路（`showSecret` 复制钮——真 `app.mjs` 直载）：① `navigator.clipboard` ⇒ ② 选中 + `execCommand`
 *      ⇒ ③ 保持选中 + 手动提示（flash 面）
 *   ④ 接入卡同源复用：`accessCard(ctx, variant)`——admin 面行（措辞/行 = 现行零改）∥ 成员面四键措辞 ∥ 素材同源
 *      （baseURL/四端/curl）∥ `views-me` 用成员变体 ∥ `views-system` 走 admin 变体
 *   ⑤ 静态面：新 25 键两表在场 ∥ 死键 2 枚零残留 ∥ 改值 4 键列内形 ∥ 基键集双向相等 ∥ 占位符一致 ∥ en 零 CJK
 *      ∥ 「提示形」零残留（本页文案与新键值）∥ 类名零残留（`key-list`/`key-item`/`key-meta`——样式与档面两向）
 *      ∥ 行悬停声明 = 2 条 ∥ 档目 19 ∥ 20 不变 ∥ key 页不入壳五页钉表
 *
 * 桩说明：页面档经桩浏览器全局直载（`app.mjs` 顶层触 `document`——先桩后 import）；`ctx` = 桩面（h/table 取真件
 * `app.mjs` 导出）；无网络、无真 DOM——零碰真库/生产数据。
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

/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
/** 自称名族（仅 zh 表载体——切换器固定取 zh 表）。 */
const SELF_NAMES = ["lang.zh", "lang.en"]
/** 本批新 25 键（§2.2 键族登记——两表逐键同步：表六列 6 ∥ 签发流 8 ∥ 吊销流 4 ∥ 接入卡 4 ∥ 复制钮 3）。 */
const NEW_KEYS = [
  "me.keys.colName", "me.keys.colKey", "me.keys.colCreated", "me.keys.colLastUsed", "me.keys.colWindow", "me.keys.colActions",
  "me.keys.issue", "me.keys.issueTitle", "me.keys.nameLabel", "me.keys.namePh", "me.keys.nameHint", "me.keys.issueHint", "me.keys.issueSubmit", "me.keys.capHint",
  "me.keys.revokeTitle", "me.keys.revokeConsequence", "me.keys.revokeSubmit", "me.keys.revoked",
  "me.keys.accessTitle", "me.keys.accessHint", "me.keys.accessKeyRow", "me.keys.accessKeyValue",
  "common.copy", "common.copied", "common.copyManual",
]
/** 死键 2 枚（轮换按钮下架——零消费者删净；端点保留 = API 兼容不变量）。 */
const DEAD_KEYS = ["me.keys.rotate", "me.keys.rotateConfirm"]
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

// ── 桩浏览器全局（先于页面档 import——`app.mjs` 顶层 `document.getElementById` + `boot()` 副作用在桩内静默）──

class FakeNode {}
/** 桩节点（`app.mjs` `h` 语义所需面：children/classList/listeners/属性/焦点/`<dialog>` 两法）。 */
function makeNode(tag) {
  const classes = new Set()
  const node = new FakeNode()
  Object.assign(node, { tag, children: [], listeners: {}, attrs: {}, parent: null, open: false, focused: false, checked: false, disabled: false, hidden: false, textContent: "", className: "", value: "" })
  node.classList = { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) }
  node.append = (...items) => {
    for (const item of items.flat(Infinity)) {
      if (item === null || item === undefined || item === false) continue
      if (typeof item === "object") item.parent = node
      node.children.push(item)
    }
  }
  node.replaceChildren = (...items) => { node.children = []; node.append(...items) }
  node.addEventListener = (type, fn) => { (node.listeners[type] ??= []).push(fn) }
  node.setAttribute = (name, value) => { node.attrs[name] = String(value) }
  node.remove = () => { if (node.parent !== null) node.parent.children = node.parent.children.filter((child) => child !== node); node.parent = null }
  node.focus = () => { node.focused = true }
  node.fire = (type, event = {}) => Promise.all((node.listeners[type] ?? []).map((fn) => fn({ preventDefault() {}, ...event })))
  node.showModal = () => { node.open = true }
  node.close = () => { node.open = false; for (const fn of node.listeners.close ?? []) fn({}) }
  return node
}

const flashNode = makeNode("p") // `getElementById("flash")` 稳定节点（复制手动提示断言面）
const selection = { ranges: [], removeAllRanges() { this.ranges = [] }, addRange(range) { this.ranges.push(range) } }
const doc = {
  title: "", documentElement: {}, body: makeNode("body"),
  createElement: (tag) => makeNode(tag),
  createTextNode: (text) => { const node = makeNode("#text"); node.textContent = String(text); return node },
  getElementById: (id) => ({ app: makeNode("main"), nav: makeNode("aside"), flash: flashNode }[id] ?? null),
  createRange: () => ({ target: null, selectNodeContents(node) { this.target = node } }),
  execCommand: () => false,
}
globalThis.Node = FakeNode
globalThis.document = doc
globalThis.location = { hash: "", origin: "http://console.test" }
globalThis.window = { addEventListener() {}, getSelection: () => selection }
const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator")
Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true, writable: true }) // 复制三路需可写槽

const APP = await load("app.mjs") // h/table/showSecret 真件
const ME = await load("views-me.mjs")
const SYS = await load("views-system.mjs")
const { ZH } = await load("i18n-zh.mjs")
const { EN } = await load("i18n-en.mjs")

// ── 共用助手 ────────────────────────────────────────────────────────────────

function findAll(root, pred, out = []) {
  if (root !== null && typeof root === "object") {
    if (pred(root)) out.push(root)
    for (const child of root.children ?? []) findAll(child, pred, out)
  }
  return out
}
const textOf = (node) => (typeof node === "string" ? node : [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" "))
const btnByText = (root, text) => findAll(root, (node) => node.tag === "button" && node.textContent === text)[0]
const cellsOf = (row) => row.children.filter((cell) => cell.tag === "td")
const realSetTimeout = globalThis.setTimeout // 真定时器引用（计时器捕获面用——`globalThis.setTimeout` 可被局部桩换）
const tick = () => new Promise((resolve) => realSetTimeout(resolve, 0))
const last = (list) => list.at(-1)

/** 桩 me 页 ctx：`state.member.keys` = `keysRef()`（刷新后随动）∥ api 路由表（`"METHOD path"` ⇒ handler——抛 = 失败径）∥ 全调用入 calls。 */
function meCtx(keysRef, routes) {
  const calls = []
  const ctx = {
    h: APP.h,
    table: APP.table,
    state: { get member() { return { keys: keysRef() } } },
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    refresh: async () => { calls.push(["refresh"]); return ctx.state.member },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
    fmtTs: (ts) => `T(${ts})`,
    showSecret: APP.showSecret,
  }
  return { ctx, calls }
}
const httpError = (status, code, message) => Object.assign(new Error(message), { status, code })

const NEVER = { id: 1, name: "笔记本", hint: "sk-tc-ab…cd", createdAt: "2026-10-06T08:00:00.000Z", lastUsedAt: null, windowTokens: 0 }
const USED = { id: 2, name: "台式机", hint: "sk-tc-ef…gh", createdAt: "2026-10-06T09:00:00.000Z", lastUsedAt: "2026-10-07T02:00:00.000Z", windowTokens: 7 }
const ISSUED = { id: 3, name: "第三次", hint: "sk-tc-ij…kl", createdAt: "2026-10-07T03:00:00.000Z", lastUsedAt: null, windowTokens: 0 }

// ── ① 页形（§2.3⑥——六列表 ∥ 行映射 ∥ 空态 ∥ 零 confirm）────────────────────

test("① 页形：六列表头逐键在场 ∥ 行映射（含未使用/近 30 天）∥ 空态分支 ∥ 页面零 window.confirm", () => {
  const { ctx } = meCtx(() => [NEVER, USED], {})
  const mount = makeNode("section")
  ME.renderMeKeys(ctx, mount)
  assert.equal(findAll(mount, (node) => node.tag === "h2")[0].textContent, ZH["me.keys.title"])
  assert.ok(btnByText(mount, ZH["me.keys.issue"]), "页首「签发新 API Key」钮在册")
  const headers = findAll(mount, (node) => node.tag === "th").map((node) => node.textContent)
  assert.deepEqual(headers.slice(0, 6), [
    ZH["me.keys.colName"], ZH["me.keys.colKey"], ZH["me.keys.colCreated"], ZH["me.keys.colLastUsed"], ZH["me.keys.colWindow"], ZH["me.keys.colActions"],
  ], "六列表头逐键在场（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作）")
  const rows = findAll(mount, (node) => node.tag === "tr" && node.parent?.tag === "tbody")
  assert.deepEqual(cellsOf(rows[0]).map(textOf), [
    NEVER.name, NEVER.hint, `T(${NEVER.createdAt})`, ZH["me.keys.neverUsed"], fill(ZH["me.keys.windowTokens"], { tokens: 0 }), ZH["admin.members.revoke"],
  ], "行 1（从未使用——空值 ⇒ neverUsed 文案）")
  assert.deepEqual(cellsOf(rows[1]).map(textOf), [
    USED.name, USED.hint, `T(${USED.createdAt})`, `T(${USED.lastUsedAt})`, fill(ZH["me.keys.windowTokens"], { tokens: 7 }), ZH["admin.members.revoke"],
  ], "行 2（真值时间 ∥ 近 30 天 = tokens 列内形）")
  const revokeBtn = btnByText(rows[0], ZH["admin.members.revoke"])
  assert.equal(revokeBtn.className, "tiny danger", "行内吊销钮 = tiny danger")
  // 空态分支：`.hint` 引导（「签发新 API Key」指引）——无 key 表（仅接入卡表）
  const { ctx: emptyCtx } = meCtx(() => [], {})
  const emptyMount = makeNode("section")
  ME.renderMeKeys(emptyCtx, emptyMount)
  assert.ok(findAll(emptyMount, (node) => node.className === "hint").some((node) => node.textContent === ZH["me.keys.empty"]), "空态引导在册")
  assert.deepEqual(findAll(emptyMount, (node) => node.tag === "th").map((node) => node.textContent), [ZH["col.item"], ZH["col.value"]], "空态 = 无 key 表（仅接入卡表）")
  // 零原生 confirm（档面扫描——注释剔除后零 confirm 调用）
  const meCode = readPublic("views-me.mjs").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  assert.equal(/confirm\s*\(/.test(meCode), false, "页面零 window.confirm（档面扫描）")
  assert.ok(/openModal\s*\(/.test(meCode), "两弹窗 = openModal 调用")
  assert.ok(meCode.includes(`t("me.keys.lastUsed"`), "改值键列内形 = 键消费（非孤儿——§2.2 键族登记）")
})

// ── ② 签发弹窗（名称可空 ∥ 成功 ⇒ 关窗 + 秘密区回显 + 表刷新 ∥ 失败 ⇒ 窗内状态行）──

test("② 签发弹窗：名称 trim ∥ 空名 ⇒ null ∥ 成功 ⇒ 关窗 + 页级秘密区回显 + 表刷新 ∥ 失败 ⇒ 窗内状态行", async () => {
  let keys = [NEVER]
  const issueResult = { id: ISSUED.id, name: ISSUED.name, hint: ISSUED.hint, plain: "sk-tc-PLAIN-NEW" }
  const { ctx, calls } = meCtx(() => keys, {
    "POST /api/me/keys/issue": () => { keys = [NEVER, ISSUED]; return issueResult },
  })
  const mount = makeNode("section")
  ME.renderMeKeys(ctx, mount)
  await btnByText(mount, ZH["me.keys.issue"]).fire("click")
  const dialog = last(doc.body.children)
  assert.ok(dialog.open, "弹窗开（showModal）")
  assert.equal(findAll(dialog, (node) => node.tag === "h3")[0].textContent, ZH["me.keys.issueTitle"])
  const input = findAll(dialog, (node) => node.tag === "input")[0]
  assert.deepEqual([input.attrs.placeholder, input.focused], [ZH["me.keys.namePh"], true], "名称输入在册（placeholder ∥ 焦点入窗）")
  const dialogText = textOf(dialog)
  for (const key of ["me.keys.nameLabel", "me.keys.nameHint", "me.keys.issueHint", "me.keys.capHint"]) assert.ok(dialogText.includes(ZH[key]), `弹窗体缺：${key}`)
  // 携名（trim——服务端再归一）
  input.value = "  笔记本2  "
  await btnByText(dialog, ZH["me.keys.issueSubmit"]).fire("click")
  assert.deepEqual(last(calls.filter(([method]) => method === "POST")), ["POST", "/api/me/keys/issue", { name: "笔记本2" }])
  assert.equal(dialog.open, false, "成功 ⇒ 关窗")
  const secret = findAll(mount, (node) => node.className === "secret")[0]
  assert.deepEqual([secret.hidden, textOf(secret).includes("sk-tc-PLAIN-NEW")], [false, true], "页级秘密区回显明文（仅一次）")
  assert.ok(calls.some(([kind]) => kind === "refresh"), "表刷新（/api/me）")
  assert.equal(findAll(mount, (node) => node.tag === "tr" && node.parent?.tag === "tbody").length, 4, "表刷新后 = 两 key 行 + 接入卡两行")
  // 空名（全空白）⇒ null（服务端默认名）
  await btnByText(mount, ZH["me.keys.issue"]).fire("click")
  const dialog2 = last(doc.body.children)
  findAll(dialog2, (node) => node.tag === "input")[0].value = "   "
  await btnByText(dialog2, ZH["me.keys.issueSubmit"]).fire("click")
  assert.deepEqual(last(calls.filter(([method]) => method === "POST")), ["POST", "/api/me/keys/issue", { name: null }], "全空白 ⇒ null（留空 = 自动命名）")
  // 失败（400）⇒ 窗内状态行（弹窗留驻——不关窗）
  const failure = httpError(400, "invalid_request_error", "名称超长（≤ 40 字符；实长 41）")
  const { ctx: failCtx, calls: failCalls } = meCtx(() => [NEVER], { "POST /api/me/keys/issue": () => { throw failure } })
  const failMount = makeNode("section")
  ME.renderMeKeys(failCtx, failMount)
  await btnByText(failMount, ZH["me.keys.issue"]).fire("click")
  const failDialog = last(doc.body.children)
  await btnByText(failDialog, ZH["me.keys.issueSubmit"]).fire("click")
  const status = findAll(failDialog, (node) => node.className === "hint error")[0]
  assert.deepEqual([failDialog.open, status.hidden, status.textContent], [true, false, fill(ZH["err.invalid_request_error"], { detail: failure.message })], "失败 ⇒ 窗内状态行（弹窗留驻）")
  assert.ok(!failCalls.some(([kind]) => kind === "fail"), "失败不落窗外面（弹窗定则）")
})

// ── ② 吊销弹窗（后果文案 ∥ keyId 提交 ∥ 成功 ⇒ 关窗 + 表刷新 + flash）───────

test("② 吊销弹窗：名 + 提示形 + 后果文案 ∥ 提交含 keyId ∥ 成功 ⇒ 关窗 + 表刷新 + flash「已吊销」∥ 失败 ⇒ 窗内状态行", async () => {
  let keys = [NEVER, USED]
  const { ctx, calls } = meCtx(() => keys, {
    [`POST /api/me/keys/${NEVER.id}/revoke`]: () => { keys = [USED]; return { ok: true, id: NEVER.id, status: "revoked" } },
  })
  const mount = makeNode("section")
  ME.renderMeKeys(ctx, mount)
  const rows = findAll(mount, (node) => node.tag === "tr" && node.parent?.tag === "tbody")
  await btnByText(rows[0], ZH["admin.members.revoke"]).fire("click")
  const dialog = last(doc.body.children)
  assert.equal(findAll(dialog, (node) => node.tag === "h3")[0].textContent, ZH["me.keys.revokeTitle"])
  const dialogText = textOf(dialog)
  assert.ok(dialogText.includes(NEVER.name) && dialogText.includes(NEVER.hint), "体 = API Key 名 + 提示形")
  assert.ok(dialogText.includes(ZH["me.keys.revokeConsequence"]), "后果文案键引用在场")
  await btnByText(dialog, ZH["me.keys.revokeSubmit"]).fire("click")
  assert.deepEqual(last(calls.filter(([method]) => method === "POST")), ["POST", `/api/me/keys/${NEVER.id}/revoke`, null], "提交路径含 keyId")
  assert.deepEqual([dialog.open, last(calls.filter(([kind]) => kind === "flash"))], [false, ["flash", ZH["me.keys.revoked"]]], "成功 ⇒ 关窗 + flash「已吊销」")
  assert.equal(findAll(mount, (node) => node.tag === "tr" && node.parent?.tag === "tbody").length, 3, "表刷新（行离列）")
  // 失败 ⇒ 窗内状态行（吊销钮留驻）
  const failure = httpError(404, "not_found", "key 不存在：1")
  const { ctx: failCtx } = meCtx(() => [NEVER], { [`POST /api/me/keys/${NEVER.id}/revoke`]: () => { throw failure } })
  const failMount = makeNode("section")
  ME.renderMeKeys(failCtx, failMount)
  await btnByText(findAll(failMount, (node) => node.tag === "tr" && node.parent?.tag === "tbody")[0], ZH["admin.members.revoke"]).fire("click")
  const failDialog = last(doc.body.children)
  await btnByText(failDialog, ZH["me.keys.revokeSubmit"]).fire("click")
  const status = findAll(failDialog, (node) => node.className === "hint error")[0]
  assert.deepEqual([failDialog.open, status.hidden, status.textContent], [true, false, fill(ZH["err.not_found"], { detail: failure.message })], "失败 ⇒ 窗内状态行")
})

// ── ③ 复制三路（showSecret 复制钮——§2.3⑥）──────────────────────────────────

test("③ 复制三路：① clipboard ⇒ ② 选中 + execCommand ⇒ ③ 保持选中 + 手动提示（flash）", async () => {
  /** 定时器捕获（成功复位 2s ∥ flash 收口 8s——捕获不落真轮询，顺证复位时机）。 */
  const captureTimers = async (task) => {
    const captured = []
    const restore = globalThis.setTimeout
    globalThis.setTimeout = (callback, ms) => { captured.push({ callback, ms }); return 0 }
    try { await task() } finally { globalThis.setTimeout = restore }
    return captured
  }
  try {
    // ① navigator.clipboard（安全上下文）
    const box = makeNode("div")
    APP.showSecret(box, "标签", "sk-tc-PLAIN")
    const code = findAll(box, (node) => node.tag === "code")[0]
    const button = findAll(box, (node) => node.tag === "button")[0]
    assert.deepEqual([code.textContent, button.textContent], ["sk-tc-PLAIN", ZH["common.copy"]], "秘密区 = 明文 + 复制钮")
    const wrote = []
    globalThis.navigator.clipboard = { writeText: async (value) => { wrote.push(value) } }
    const timers1 = await captureTimers(async () => { await button.fire("click"); await tick() })
    assert.deepEqual([wrote, button.textContent], [["sk-tc-PLAIN"], ZH["common.copied"]], "路①：clipboard 写入 + 钮「已复制」")
    assert.deepEqual(timers1.map((timer) => timer.ms), [2000], "路①：2s 复位定时器在册")
    timers1[0].callback()
    assert.equal(button.textContent, ZH["common.copy"], "复位回调 ⇒ 钮文案回「复制」")
    // ② clipboard 缺位 ⇒ 选中明文 + execCommand（遗留通道）
    delete globalThis.navigator.clipboard
    const cmds = []
    doc.execCommand = (cmd) => { cmds.push(cmd); return true }
    const box2 = makeNode("div")
    APP.showSecret(box2, "标签", "S2")
    const code2 = findAll(box2, (node) => node.tag === "code")[0]
    const button2 = findAll(box2, (node) => node.tag === "button")[0]
    selection.ranges = []
    const timers2 = await captureTimers(async () => { await button2.fire("click"); await tick() })
    assert.deepEqual(cmds, ["copy"], "路②：execCommand(\"copy\")")
    assert.deepEqual([selection.ranges.length, selection.ranges[0]?.target], [1, code2], "选中对象 = 明文节点")
    assert.deepEqual([button2.textContent, timers2.map((timer) => timer.ms)], [ZH["common.copied"], [2000]], "路②成功反馈同「已复制」")
    // ③ execCommand 拒 ⇒ 保持选中 + flash 手动提示（钮无成功反馈）
    doc.execCommand = () => false
    selection.ranges = []
    flashNode.textContent = ""
    flashNode.hidden = true
    const box3 = makeNode("div")
    APP.showSecret(box3, "标签", "S3")
    const button3 = findAll(box3, (node) => node.tag === "button")[0]
    const timers3 = await captureTimers(async () => { await button3.fire("click"); await tick() })
    assert.equal(selection.ranges.length, 1, "路③：保持选中")
    assert.deepEqual([button3.textContent, timers3.length], [ZH["common.copy"], 1], "路③：无「已复制」反馈（仅 flash 收口定时器）")
    assert.deepEqual([flashNode.hidden, flashNode.textContent], [false, ZH["common.copyManual"]], "路③：flash 手动提示")
  } finally {
    delete globalThis.navigator.clipboard
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor)
    doc.execCommand = () => false
  }
})

// ── ④ 接入卡同源复用（accessCard 变体——admin 面零改 ∥ 成员面四键）──────────

test("④ 接入卡：admin 面行（零改）∥ 成员面四键措辞 ∥ 素材同源（baseURL/四端/curl）∥ 两页各取变体", () => {
  const ctx = { h: APP.h, table: APP.table }
  const baseURL = `${globalThis.location.origin}/v1`
  const admin = SYS.accessCard(ctx, "admin")
  assert.equal(findAll(admin, (node) => node.tag === "h3")[0].textContent, ZH["system.accessTitle"])
  assert.ok(textOf(admin).includes(ZH["system.accessHint"]))
  assert.deepEqual(findAll(admin, (node) => node.tag === "td").map(textOf).slice(0, 4), [
    ZH["system.baseURLRow"], baseURL, ZH["system.teamKey"], ZH["system.teamKeyValue"],
  ], "admin 面行 = 现行措辞（零改）")
  const member = SYS.accessCard(ctx, "member")
  assert.equal(findAll(member, (node) => node.tag === "h3")[0].textContent, ZH["me.keys.accessTitle"])
  assert.ok(textOf(member).includes(ZH["me.keys.accessHint"]))
  assert.deepEqual(findAll(member, (node) => node.tag === "td").map(textOf).slice(0, 4), [
    ZH["system.baseURLRow"], baseURL, ZH["me.keys.accessKeyRow"], ZH["me.keys.accessKeyValue"],
  ], "成员面四键措辞（baseURL 行同源）")
  for (const key of ["system.fieldsTitle", "system.endCli", "system.endVsc", "system.endDesktop", "system.endOther", "system.curlTitle"]) {
    assert.ok(textOf(member).includes(ZH[key]) && textOf(admin).includes(ZH[key]), `素材同源：${key}`)
  }
  assert.ok(textOf(member).includes(`curl -H "Authorization: Bearer sk-tc-…" ${baseURL}/models`), "curl 素材 = 运行时 origin")
  const meSrc = readPublic("views-me.mjs")
  assert.ok(meSrc.includes(`import { accessCard } from "./views-system.mjs"`), "views-me 复用导出（同源构件——不建第二份）")
  assert.ok(meSrc.includes(`accessCard(ctx, "member")`), "views-me 取成员变体")
  assert.ok(readPublic("views-system.mjs").includes(`accessCard(ctx, "admin")`), "admin 面仍走 admin 变体（渲染零改）")
})

// ── ⑤ 静态面（i18n 键族 ∥ 死键 ∥ 类名 ∥ 档目 ∥ 非壳）────────────────────────

test("⑤ 静态面：新 25 键两表 ∥ 死键零残留 ∥ 改值 4 键列内形 ∥ 基键集/占位符/en 零 CJK ∥ 「提示形」与类名零残留 ∥ 档目 19 ∥ 20", () => {
  const zhKeys = Object.keys(ZH)
  const enKeys = Object.keys(EN)
  const enBase = enKeys.filter((key) => !key.endsWith(".one"))
  // 新 25 键（两表在场 ∥ 非空 ∥ 占位符一致 ∥ en 零 CJK）
  for (const key of NEW_KEYS) {
    assert.ok(key in ZH && key in EN, `新键缺位：${key}`)
    assert.ok(ZH[key].trim().length > 0 && EN[key].trim().length > 0, `空值键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 表含 CJK：${key}`)
  }
  // 死键 2 枚零残留（两表 + 全 public 档面零引用）
  for (const key of DEAD_KEYS) {
    assert.ok(!(key in ZH) && !(key in EN), `死键残留：${key}`)
    for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs"))) {
      assert.equal(readPublic(name).includes(`"${key}"`), false, `${name} 仍引用死键：${key}`)
    }
  }
  // 改值 4 键（列内形——去前缀）∥ 术语 = 「API Key」（zh 保留英文原形 ∥ en = "API key"）
  assert.deepEqual([ZH["me.keys.lastUsed"], ZH["me.keys.windowTokens"], EN["me.keys.lastUsed"], EN["me.keys.windowTokens"], EN["me.keys.windowTokens.one"]], [
    "{time}", "{tokens} tokens", "{time}", "{tokens} tokens", "{tokens} token",
  ], "改值 4 键 = 列内形（`me.keys.windowTokens.one` 变体随动）")
  assert.deepEqual([ZH["me.keys.listTitle"], ZH["me.keys.issue"], ZH["me.keys.colKey"]], ["API Key 清单", "签发新 API Key", "API Key"])
  assert.ok(ZH["me.keys.empty"].includes("签发新 API Key"), "空态 = 「签发新 API Key」指引")
  // 基键集双向相等（除自称名族 + `.one` 族）∥ en 全键零 CJK ∥ 占位符逐键一致
  for (const key of zhKeys.filter((key) => !SELF_NAMES.includes(key))) assert.ok(key in EN, `en 表缺键：${key}`)
  for (const key of enKeys) assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  for (const key of enBase) {
    assert.ok(key in ZH, `en 表多出键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  assert.equal(zhKeys.length - SELF_NAMES.length, enBase.length, "基键集长度不等")
  // 「提示形」零残留（本页文案与新键值——me.keys 族两表）
  for (const [key, value] of Object.entries(ZH)) if (key.startsWith("me.keys.")) assert.equal(value.includes("提示形"), false, `提示形残留：${key}`)
  for (const [key, value] of Object.entries(EN)) if (key.startsWith("me.keys.")) assert.equal(value.toLowerCase().includes("hinted"), false, `hinted form 残留：${key}`)
  assert.equal(readPublic("views-me.mjs").includes("提示形"), false, "views-me 档面「提示形」零残留")
  // 类名零残留（`key-list`/`key-item`/`key-meta`——样式与档面两向；行悬停声明 = 2 条）
  const css = readPublic("style.css")
  const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "")
  for (const cls of ["key-list", "key-item", "key-meta"]) {
    assert.equal(new RegExp(`\\.${cls}(?![\\w-])`).test(cssCode), false, `样式类残留：.${cls}`)
    for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") || item === "index.html")) {
      assert.equal(readPublic(name).includes(cls), false, `${name} 类字面量残留：${cls}`)
    }
  }
  const hover = [...cssCode.matchAll(/([^{}]*:hover[^{}]*)\{/g)].map((match) => match[1].trim().replace(/\s+/g, " "))
  assert.deepEqual(hover.filter((selector) => selector === ".nav-item:hover" || selector.includes("tr:hover")), [".nav-item:hover", "tbody tr:hover"], "行悬停声明 = 2 条（li.key-item:hover 删净）")
  // 档目 19 ∥ 20 不变（零新档）∥ key 页不入壳五页钉表 ∥ 行数硬限
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [20, 19], "全目录 20 ∥ UI 代码档 19")
  const shell = readPublic("app.mjs").match(/SHELL_PAGES = new Set\(\[([^\]]*)\]\)/)?.[1] ?? ""
  assert.equal(shell.includes("/me/keys"), false, "key 页非壳（钉表五页不扩——§2.6① 排除面）")
  assert.ok(readPublic("views-me.mjs").split("\n").length <= 500, "views-me 行数 ≤500 硬限")
})
