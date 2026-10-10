/**
 * 2026-10-06-console-modals.test.mjs — thincoder-server 批内单测件（控制台弹窗批·AC-16 ∥ AC-17 判据载体；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-console-modals.test.mjs`
 *
 * 射程（判据源 = 两行：`webui/WEBUI.md` §6 AC-16 ∥ AC-17；腿 ↔ 轴对照在括号）：
 *   ① 组件 = AC-16（`modal.mjs`：零依赖 ∥ `<dialog>` 基座 ∥ 复用 API ∥ 单例/关闭/遮罩策略 ∥ 顶层零浏览器全局
 *      ——桩 DOM 行为直测）② 成员弹窗 = AC-16 ∥ AC-21②（三态 ∥ 分模型覆盖（惰性 providers ∥ 键级合并）∥ 一次性秘密不破——假 ctx 行为直测）
 *   ③ 服务模型页 = AC-17（`deriveModels` 同源派生纯函数 ∥ 详情弹窗复用组件 ∥ 配置五组在册——A/C/F/D/E）
 *   ④ nav（AC-16/17 面：管理 7 ∥ 新路径 ∥ denied ∥ 重定向/默认页不破）⑤ 静态面（档目 30 ∥ 31 ∥ 零外链 ∥
 *      两表键集/占位符 ∥ 键引用闭合 ∥ 两新档静态直发）⑥ 门禁清单（`prepublishOnly` 含本批件 ∥ 清单在盘）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const [{ ZH }, { EN }, NAV, MODAL, MODELS, ADMIN] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("nav.mjs"), load("modal.mjs"), load("views-models.mjs"), load("views-admin.mjs"),
])
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))

/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
/** 自称名族（仅 zh 表载体——切换器固定取 zh 表）。 */
const SELF_NAMES = ["lang.zh", "lang.en"]
/** 本批新键（§2.2 键族——两表逐键同步）。 */
const NEW_KEYS = [
  "common.save", "common.cancel", "common.close",
  "admin.members.newBtn", "admin.members.colKeyCount", "admin.members.empty",
  "admin.models.title", "admin.models.colModel", "admin.models.colProvider", "admin.models.colSurface",
  "admin.models.upstream", "admin.models.empty", "admin.models.loadFailed", "admin.models.detailTitle",
    "admin.models.configTitle", // configSkeleton 随配置面批退役（2026-10-06）∥ embedNote 随 embed 解耦批退役（2026-10-09）
  "nav.page.admin.models",
]
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

// ── 桩 DOM（`modal.mjs` 壳面近形：showModal/close 事件/classList/remove；`h` 同 app 语义近似）──────

function makeNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, focused: false, textContent: "", className: "", value: "", hidden: false,
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) },
    append(...items) {
      for (const item of items.flat(Infinity)) {
        if (item === null || item === undefined || item === false) continue
        if (typeof item === "object") item.parent = node
        node.children.push(item)
      }
    },
    replaceChildren(...items) { node.children = []; node.append(...items) },
    addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { node.attrs[name] = String(value) },
    remove() {
      if (node.parent !== null) node.parent.children = node.parent.children.filter((child) => child !== node)
      node.parent = null
    },
    focus() { node.focused = true },
    fire(type, event = {}) {
      const target = { preventDefault() {}, ...event }
      return Promise.all((node.listeners[type] ?? []).map((fn) => fn(target)))
    },
    showModal() { node.open = true },
    close() { node.open = false; for (const fn of node.listeners.close ?? []) fn({}) },
  }
  return node
}

const createDocument = () => ({ body: makeNode("body"), createElement: (tag) => makeNode(tag), getElementById: () => null })

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点（字符串原样）。 */
function h(tag, props = {}, ...children) {
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

function findAll(root, pred, out = []) {
  if (root !== null && typeof root === "object") {
    if (pred(root)) out.push(root)
    for (const child of root.children ?? []) findAll(child, pred, out)
  }
  return out
}
const findNode = (root, pred) => findAll(root, pred)[0] ?? null
const byText = (root, text) => findNode(root, (node) => node.textContent === text)
const textOf = (node) => {
  if (typeof node === "string") return node
  return [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" ")
}
/** 微任务轮转（惰性拉取落定）。 */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

// ── ① 组件面（AC-16——`modal.mjs`）───────────────────────────────────────────

test("① 组件：`<dialog>` 基座 ∥ 复用 API ∥ 单例/关闭/遮罩策略 ∥ 顶层零浏览器全局", async () => {
  assert.equal(typeof globalThis.document, "undefined", "import 至今无 document——模块顶层零浏览器全局")
  const src = readFileSync(join(PUBLIC_DIR, "modal.mjs"), "utf8")
  assert.deepEqual([/https?:\/\//.test(src), /@import/.test(src)], [false, false], "零外部引用（KD-SV-9）")
  for (const line of src.split("\n")) {
    if (!line.startsWith("import ")) continue
    assert.match(line, /^import .* from "\.\/[^"]+"$/, `import 须为相对档：${line}`)
  }
  assert.equal(typeof MODAL.openModal, "function")
  assert.ok(src.includes('createElement("dialog")') && src.includes(".showModal()"), "原生 `<dialog>` + showModal() 基座")
  assert.ok(src.includes('"common.close"'), "× 钮 = `common.close`（aria-label）")

  globalThis.document = createDocument()
  try {
    const body = globalThis.document.body
    let closedA = 0
    const bodyNode = makeNode("div")
    const footerNode = makeNode("div")
    const a = MODAL.openModal({ title: "A", body: bodyNode, footer: footerNode, onClose: () => { closedA += 1 } })
    // 壳：头（标题 + × 钮——aria-label 键）+ 体（调用方节点）+ 脚（调用方节点）
    const [head, bodyEl, footEl] = a.root.children
    assert.deepEqual([a.root.tag, a.root.open, head.children[0].textContent, head.children[1].textContent], ["dialog", true, "A", "×"])
    assert.deepEqual([head.children[1].attrs["aria-label"], head.children[1].tag], [ZH["common.close"], "button"])
    assert.deepEqual([bodyEl.children[0] === bodyNode, footEl.children[0] === footerNode], [true, true])
    assert.deepEqual([body.classList.contains("modal-open"), body.children.includes(a.root)], [true, true], "开窗 = showModal + 锁背景滚动")
    // 遮罩点击不关（根上零 click 监听——平台缺省；防误触丢表单）
    await a.root.fire("click")
    assert.equal(closedA, 0, "遮罩点击不关")
    // × 钮路径：关闭一次（onClose 一次 ∥ 壳移除 ∥ 解锁）
    await head.children[1].fire("click")
    assert.deepEqual([closedA, a.root.parent, a.root.open, body.classList.contains("modal-open")], [1, null, false, false])
    a.close() // 句柄路径——双调幂等（onClose 不重发）
    assert.equal(closedA, 1)
    // 单例：开新先关旧（不叠加）∥ ESC 路径（平台关闭 ⇒ close 事件同链）
    let closedB = 0
    const b = MODAL.openModal({ title: "B", onClose: () => { closedB += 1 } })
    const c = MODAL.openModal({ title: "C", onClose: () => { closedB += 10 } })
    assert.deepEqual([closedB, b.root.parent, b.root.open, c.root.open], [1, null, false, true], "开新先关旧")
    assert.equal(body.classList.contains("modal-open"), true)
    c.root.close() // 平台缺省关闭（ESC）⇒ close 事件 ⇒ 收口
    assert.deepEqual([closedB, c.root.parent, body.classList.contains("modal-open")], [11, null, false])
  } finally {
    delete globalThis.document
  }
})

// ── ② 成员弹窗（AC-16 ∥ AC-21②——三态 ∥ 分模型覆盖（惰性 providers ∥ 键级合并）∥ 一次性秘密不破）──────────

test("② 成员弹窗：三态（查看/编辑/新建）∥ 分模型覆盖面（惰性 providers ∥ 键级合并提交 ∥ 不在清单键保留）∥ 秘密面", async () => {
  globalThis.document = createDocument()
  globalThis.window = { confirm: () => true }
  try {
    const documentStub = globalThis.document
    const calls = []
    const secrets = []
    const members = []
    let providersFail = false
    let quotasFail = false
    const providersResp = { providers: [
      { id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: ["m-b", "m-a"], settings: { "m-b": { quotaTokens: 500 } } },
      { id: 2, name: "p2", baseURL: "http://y/v1", apiKey: "", models: ["x"], settings: {} },
    ] }
    const ctx = {
      h,
      api: async (path, { method = "GET", body } = {}) => {
        calls.push([method, path, body ?? null])
        if (method === "GET" && path === "/api/admin/providers") {
          if (providersFail) { providersFail = false; throw new Error("boom") }
          return providersResp
        }
        if (method === "POST" && path === "/api/members/1/model-quotas") {
          if (quotasFail) { quotasFail = false; throw Object.assign(new Error("raw server message"), { code: "internal_error" }) }
          return { id: 1, modelQuotas: Object.fromEntries(Object.entries(body.quotas).filter(([, value]) => value !== null)) }
        }
        if (method === "POST" && path === "/api/members") return { id: 9, name: "bob", username: "bob", role: "user", tempPassword: "temp-pw-1" }
        if (String(path).endsWith("/password-reset")) return { id: 1, tempPassword: "temp-pw-2" }
        if (String(path).endsWith("/revoke")) return { ok: true }
        throw new Error(`unexpected ${method} ${path}`)
      },
      fail: (error) => calls.push(["fail", String(error)]),
      showSecret: (box, label, value) => secrets.push({ box, label, value }),
      fmtModelQuotas: (quotas) => {
        const count = Object.keys(quotas ?? {}).length
        return count === 0 ? ZH["common.quotaByPlatform"] : fill(ZH["common.modelQuotaCount"], { count })
      },
      fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
      fmtTs: (ts) => String(ts),
    }
    const member = { id: 1, name: "Alice", username: "alice", role: "user", modelQuotas: { "p2/x": 7, "ghost/model": 3 }, usedTokens: 42, keys: [{ id: 7, hint: "sk-tc-abcd", lastUsedAt: null, windowTokens: 0 }] }
    const reload = async () => members
    const secretBox = makeNode("div")
    /** 配额表（表头含「平台默认」列——查看/编辑两态同形；与 key 表区分）。 */
    const quotaTableOf = (root) => findNode(root, (node) => node.tag === "table"
      && findAll(node, (cell) => cell.tag === "th").some((cell) => cell.textContent === ZH["admin.members.colPlatformQuota"]))

    // 查看态：详情（含分模型配额覆盖计数）+ 分模型用量节 = 模型表直显（配额 v2 批——5 列）+ key 清单（提示形）+ 三操作
    const modal = ADMIN.openMemberModal(ctx, { member, reload, secretBox })
    assert.deepEqual([modal.root.open, modal.root.children[0].children[0].textContent], [true, "Alice"])
    for (const text of [ZH["admin.members.setQuota"], ZH["admin.members.resetPwd"], ZH["common.close"], ZH["admin.members.revoke"], ZH["admin.members.modelQuotaTitle"]]) {
      assert.ok(byText(modal.root, text), `查看态缺控件：${text}`)
    }
    assert.ok(byText(modal.root, "sk-tc-abcd"), "key 清单入窗（提示形）")
    assert.ok(textOf(modal.root).includes(fill(ZH["common.modelQuotaCount"], { count: 2 })), "覆盖计数 = 2 个模型（详情行——三处同源）")
    assert.equal(secrets.length, 0, "查看态零秘密回显")
    // 模型表直显（进窗即惰性拉 providers）：5 列 ∥ 服务清单行 ∥ 离表覆盖键 ⇒ 注行（只数覆盖键）
    await tick()
    const viewTable = quotaTableOf(modal.root)
    assert.ok(viewTable !== null, "查看态模型表缺位")
    assert.deepEqual(findAll(viewTable, (node) => node.tag === "th").map((cell) => cell.textContent),
      [ZH["admin.models.colModel"], ZH["admin.members.colMonthlyQuota"], ZH["admin.members.colPlatformQuota"], ZH["col.used"], ZH["admin.members.colDisabled"]], "5 列逐头")
    assert.ok(textOf(viewTable).includes("p2/x"), "服务清单行在表（p2/x）")
    assert.ok(byText(modal.root, fill(ZH["admin.members.quotaOffListNote"], { count: 1 })) !== null, "离表覆盖键 ⇒ 注行（ghost/model——只数覆盖键）")
    assert.ok(byText(modal.root, ZH["admin.members.disableHint"]) !== null, "表下禁用语义提示")

    // 吊销（幂等）：弹窗留驻 + 就地重渲
    members.splice(0, members.length, { ...member, keys: [] })
    await byText(modal.root, ZH["admin.members.revoke"]).fire("click")
    assert.deepEqual(calls.at(-1), ["POST", "/api/members/1/keys/7/revoke", null])
    assert.deepEqual([modal.root.open, modal.root.parent !== null, byText(modal.root, ZH["admin.members.noKeys"]) !== null], [true, true, true])

    // 编辑态：配额面两态共用（取数 = 进窗首个——已就绪零重拉）⇒ 全 chat 模型行（id 升序 ∥ 空 = 按平台 ∥ 平台默认只读 ∥ 不在清单键注行）
    const fetches = () => calls.filter(([method, path]) => method === "GET" && path === "/api/admin/providers").length
    const fetched = fetches()
    await byText(modal.root, ZH["admin.members.setQuota"]).fire("click")
    assert.deepEqual([quotaTableOf(modal.root) !== null, fetches() - fetched], [true, 0], "进态零重拉（查看/编辑两态共用单次取数）")
    const table = quotaTableOf(modal.root)
    assert.ok(table !== null, "覆盖表缺位")
    assert.deepEqual(findAll(table, (node) => node.tag === "tr").slice(1).map((tr) => tr.children.map((cell) => textOf(cell)).join("|")),
      ["p1/m-a||" + ZH["common.quotaUnlimited"], "p1/m-b||500", "p2/x||" + ZH["common.quotaUnlimited"]], "行 = 全 chat 模型（id 升序）∥ 平台默认列")
    const inputs = findAll(table, (node) => node.tag === "input")
    assert.deepEqual(inputs.map((node) => node.value), ["", "", "7"], "草稿初值 = 覆盖现值（空 = 按平台）")
    assert.ok(byText(modal.root, fill(ZH["admin.members.quotaOffListNote"], { count: 1 })) !== null, "不在服务清单的覆盖键 ⇒ 注行（保留）")

    // 保存 = 键级合并（空 ⇒ 显式 null 删键）⇒ 回查看态 + 弹窗与表同刷新；不在清单键恒不触碰
    inputs[0].value = "1200"
    inputs[2].value = "" // 清空 = 按平台（显式 null 删键）
    members.splice(0, members.length, { ...member, modelQuotas: { "p1/m-a": 1200, "ghost/model": 3 }, keys: [] })
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.at(-1), ["POST", "/api/members/1/model-quotas", { quotas: { "p1/m-a": 1200, "p1/m-b": null, "p2/x": null } }], "提交 = 表行全体（空 = null）∥ 不在清单键不入体")
    assert.deepEqual([byText(modal.root, ZH["admin.members.setQuota"]) !== null, textOf(modal.root).includes("p1/m-a"), byText(modal.root, fill(ZH["admin.members.quotaOffListNote"], { count: 1 })) !== null], [true, true, true], "保存 ⇒ 回查看态 + 刷新（表与弹窗同拍）")

    // 非法 ⇒ 就地提示不提交（零请求）
    await byText(modal.root, ZH["admin.members.setQuota"]).fire("click")
    await tick()
    findAll(quotaTableOf(modal.root), (node) => node.tag === "input")[0].value = "1.5"
    const beforeInvalid = calls.length
    await byText(modal.root, ZH["common.save"]).fire("click")
    const invalidHint = findNode(modal.root, (node) => node.className === "hint error" && node.hidden === false)
    assert.deepEqual([invalidHint !== null && invalidHint.textContent, calls.length - beforeInvalid],
      [fill(ZH["admin.models.invalidNumber"], { field: ZH["admin.members.colMonthlyQuota"], rule: ZH["admin.models.ruleNonNegativeInt"] }), 0], "非法 ⇒ 就地提示不提交")

    // 取消 ⇒ 回查看态（丢弃输入——零请求）
    const beforeCancel = calls.length
    await byText(modal.root, ZH["common.cancel"]).fire("click")
    assert.deepEqual([byText(modal.root, ZH["admin.members.setQuota"]) !== null, calls.length - beforeCancel], [true, 0], "取消丢弃输入")

    // 编辑态复用同面（配额面两态共用——已就绪零重拉；失败径 = 尾部新窗验）
    const sharedFetches = fetches()
    await byText(modal.root, ZH["admin.members.setQuota"]).fire("click")
    assert.deepEqual([quotaTableOf(modal.root) !== null, fetches() - sharedFetches], [true, 0], "进态零重拉（两态共用单次取数）")

    // 保存失败 ⇒ 窗内状态行（弹窗留驻——定则「弹窗开着 ⇒ 一切反馈落窗内」）
    quotasFail = true
    const beforeFail = calls.length
    await byText(modal.root, ZH["common.save"]).fire("click")
    const saveNote = findNode(modal.root, (node) => node.className === "hint error" && node.hidden === false)
    assert.deepEqual([saveNote !== null && saveNote.textContent, modal.root.open, calls.length - beforeFail],
      [ZH["err.internal_error"], true, 1], "失败 ⇒ 窗内状态行 + 留驻（不走 flash）")
    await byText(modal.root, ZH["common.cancel"]).fire("click")

    // 重置密码（秘密面）：confirm ⇒ POST ⇒ 关窗 + 页级一次性回显
    await byText(modal.root, ZH["admin.members.resetPwd"]).fire("click")
    assert.deepEqual(calls.at(-1), ["POST", "/api/members/1/password-reset", null])
    assert.deepEqual([secrets.at(-1).box === secretBox, secrets.at(-1).label, secrets.at(-1).value], [true, fill(ZH["admin.members.tempPwdLabel"], { name: "Alice" }), "temp-pw-2"])
    assert.deepEqual([modal.root.open, modal.root.parent, documentStub.body.classList.contains("modal-open")], [false, null, false], "秘密面动作 ⇒ 关窗")

    // 新建态：用户名 ∥ 展示名 ∥ 角色 + 创建/取消；创建 ⇒ POST ⇒ 关窗 + 页级回显（空展示名 ⇒ null）
    const modal2 = ADMIN.openMemberModal(ctx, { member: null, reload, secretBox })
    assert.equal(modal2.root.children[0].children[0].textContent, ZH["admin.members.createTitle"])
    const inputs2 = findAll(modal2.root, (node) => node.tag === "input")
    assert.deepEqual([inputs2.length, inputs2[0].focused], [2, true])
    inputs2[0].value = " bob "
    inputs2[1].value = ""
    findNode(modal2.root, (node) => node.tag === "select").value = "admin"
    await byText(modal2.root, ZH["admin.members.createBtn"]).fire("click")
    assert.deepEqual(calls.at(-1), ["POST", "/api/members", { username: "bob", name: null, role: "admin" }])
    assert.deepEqual([secrets.at(-1).box === secretBox, secrets.at(-1).label, secrets.at(-1).value], [true, fill(ZH["admin.members.secretLabel"], { username: "bob" }), "temp-pw-1"])
    assert.deepEqual([modal2.root.open, modal2.root.parent], [false, null], "新建 ⇒ 关窗 + 页级秘密区")

    // 取数失败 ⇒ 窗内状态行 + 「重试」（取数 = 进窗首个；重试可达模型表——弹窗反馈定则）
    providersFail = true
    const failModal = ADMIN.openMemberModal(ctx, { member, reload, secretBox })
    await tick()
    assert.ok(byText(failModal.root, ZH["admin.members.quotaLoadFailed"]) !== null, "失败 ⇒ 窗内状态行")
    await byText(failModal.root, ZH["admin.members.quotaRetry"]).fire("click")
    await tick()
    assert.ok(quotaTableOf(failModal.root) !== null, "重试 ⇒ 模型表在册")
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

// ── ③ 服务模型页（AC-17——派生同源 ∥ 详情弹窗 ∥ 配置五组 A/C/F/D/E）────────────────

test("③ 服务模型：`deriveModels` 同源派生 ∥ 列表/空态/失败态 ∥ 详情弹窗复用组件 ∥ 配置五组在册", async () => {
  // 派生（纯函数）：providers 展平 = `provider/model` 前缀形（上游模型名 = 首斜杠余段——含斜杠模型名亦然；零引擎行——KD-SV-58）；序 = id 升序（2026-10-07 走查收正——长清单可找）
  assert.deepEqual(MODELS.deriveModels([
    { name: "deepseek", models: ["deepseek-chat", "meta/llama-3"] },
    { name: "openai", models: [] },
  ]), [
    { id: "deepseek/deepseek-chat", provider: "deepseek", upstream: "deepseek-chat", surface: "chat" },
    { id: "deepseek/meta/llama-3", provider: "deepseek", upstream: "meta/llama-3", surface: "chat" },
  ])
  assert.deepEqual([MODELS.deriveModels([]), MODELS.deriveModels([{ name: "p", models: ["m"] }])], [[], [{ id: "p/m", provider: "p", upstream: "m", surface: "chat" }]])
  const src = readFileSync(join(PUBLIC_DIR, "views-models.mjs"), "utf8")
  assert.ok(src.includes('import { openModal } from "./modal.mjs"'), "详情弹窗复用公共组件")

  globalThis.document = createDocument()
  try {
    const documentStub = globalThis.document
    const ctx = {
      h,
      state: { system: { embedding: { model: "bge-m3" } } },
      api: async () => ({ providers: [{ id: 1, name: "deepseek", baseURL: "https://up.example/v1", apiKey: "", models: ["deepseek-chat"] }] }),
      fail: (error) => { throw new Error(`fail 不应被调用：${error}`) },
      fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
      dataShell: (mount, { head, area }) => {
        // 随正（2026-10-07 控制台布局收正批）：stub 语义近似——真品 = app.mjs dataShell；本件仅渲染面
        mount.append(head, area)
         return undefined // setCount 已撤（2026-10-07 光通道轮——计数入表 tfoot）
      },
    }
    const mount = makeNode("section")
    await MODELS.renderModels(ctx, mount)
    const rowText = (tr) => tr.children.map((cell) => textOf(cell)).join("|")
    const trs = findAll(mount, (node) => node.tag === "tr")
    assert.deepEqual(trs.map(rowText), [
      [ZH["admin.models.colModel"], ZH["admin.models.colProvider"], ZH["admin.models.colSurface"], ZH["admin.models.quotaTitle"]].join("|"),
      "deepseek/deepseek-chat|deepseek|chat|" + ZH["common.quotaUnlimited"],
      fill(ZH["common.rowCount"], { count: 1 }), // tfoot 计数行（序 = id 升序——2026-10-07 走查收正 ∥ 计数入表）
    ], "列表 = providers 展平（零引擎行——KD-SV-58）+ 配额列（未设 ⇒「不限」）+ tfoot 计数")
    // 详情弹窗（行点击）：模型标识 ∥ Provider ∥ 上游模型名 ∥ 面 + 配置面（四组——配置面批后）
    await trs[1].fire("click") // 升序后 deepseek 行 = 第 1 行（表头 0——零引擎行后）
    let dialog = findNode(documentStub.body, (node) => node.tag === "dialog")
    assert.equal(dialog.children[0].children[0].textContent, ZH["admin.models.detailTitle"])
    let text = textOf(dialog)
    for (const piece of ["deepseek/deepseek-chat", ZH["admin.models.upstream"], "deepseek-chat", ZH["admin.models.configTitle"],
      ZH["admin.models.quotaTitle"], ZH["admin.members.colMonthlyQuota"], ZH["admin.models.quotaHint"]]) {
      assert.ok(text.includes(piece), `详情缺：${piece}`)
    }
    assert.equal(text.includes(ZH["admin.models.embedNote"]), false, "嵌入行注 = 仅嵌入行")
    assert.ok(findAll(dialog, (node) => ["input", "select", "textarea"].includes(node.tag)).length === 7, "配置六组 = 可编辑字段七枚（rpm/tpm/costIn/costOut/quotaTokens/note/alias——A/C/F/G/D/E）")
    await dialog.children[0].children[1].fire("click") // × 关闭
    // 嵌入行详情面已退役（KD-SV-58——2026-10-09 embed 解耦批）：列表零引擎行 ⇒ 无嵌入行可点；引擎面 = 单独命名空间
    assert.equal(trs.slice(1).some((tr) => rowText(tr).startsWith("bge-m3|")), false, "列表零引擎行")
    // 空态 / 失败态
    const emptyMount = makeNode("section")
    await MODELS.renderModels({ ...ctx, api: async () => ({ providers: [] }), state: { system: null } }, emptyMount)
    assert.ok(byText(emptyMount, ZH["admin.models.empty"]) !== null, "空态文案")
    let failed = null
    const failMount = makeNode("section")
    await MODELS.renderModels({ ...ctx, api: async () => { throw new Error("boom") }, fail: (error) => { failed = error } }, failMount)
    assert.deepEqual([failed !== null, byText(failMount, ZH["admin.models.loadFailed"]) !== null], [true, true], "失败态文案 + fail 收口")
  } finally {
    delete globalThis.document
  }
})

// ── ④ nav（管理 7 ∥ 新路径 ∥ denied ∥ 重定向/默认页不破）────────────────────

test("④ nav：管理 7 ∥ `/admin/models` 在册 ∥ denied ∥ 重定向/默认页不破 ∥ labelKey 闭包", () => {
  const [me, admin] = NAV.NAV_GROUPS
  assert.deepEqual(me.items.map((item) => item.path), ["/me/keys", "/me/usage", "/me/account"])
  assert.deepEqual(admin.items.map((item) => item.path), ["/admin/overview", "/admin/members", "/admin/providers", "/admin/models", "/admin/usage", "/admin/audit", "/admin/system", "/admin/sandbox"])
  for (const item of [...me.items, ...admin.items]) {
    assert.ok(item.labelKey && !("label" in item), item.path)
    assert.ok(item.labelKey in ZH && item.labelKey in EN, `labelKey 悬空：${item.labelKey}`)
  }
  assert.deepEqual([NAV.resolveRoute("/admin/models", "admin"), NAV.resolveRoute("/admin/models", "user")], [{ path: "/admin/models" }, { path: "/admin/models", denied: true }])
  const redirect = { path: "/admin/overview", redirect: true }
  assert.deepEqual([NAV.resolveRoute("/admin", "admin"), NAV.resolveRoute("/", "admin")], [redirect, redirect])
  assert.deepEqual([NAV.resolveRoute("/", "user"), NAV.resolveRoute("/nope", "user"), NAV.resolveRoute("/me", "user")], [{ path: "/me/keys", redirect: true }, { path: "/me/keys", redirect: true }, { path: "/me/keys", redirect: true }])
})

// ── ⑤ 静态面（档目 30 ∥ 31 ∥ 零外链 ∥ i18n 键集/键引用闭合 ∥ 直发）────────────

test("⑤ 静态面：档目 30 ∥ 31 ∥ 零外链 ∥ 两表键集/占位符 ∥ 本批新键 ∥ 键引用闭合 ∥ 两新档直发", async () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [32, 31]) // 含 favicon 全目录 ∥ UI 代码档（2026-10-10 沙盒运行面批 +1）
  assert.deepEqual(names, [
    "app.mjs", "dom.mjs", "favicon.png", "health.mjs", "i18n-en-admin.mjs", "i18n-en-me.mjs", "i18n-en-shell.mjs", "i18n-en-system.mjs", "i18n-en.mjs", "i18n-zh-admin.mjs",
    "i18n-zh-me.mjs", "i18n-zh-shell.mjs", "i18n-zh-system.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "style.css",
    "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs", "views-providers-modals.mjs", "views-providers.mjs", "views-sandbox.mjs", "views-system-config.mjs", "views-system.mjs", "views-usage.mjs",
  ])
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  // 两表基键集双向相等（除自称名族 + `.one` 变体族——KD-SV-44）∥ en 零 CJK ∥ 占位符逐键一致 ∥ 本批新键两表在册
  const zhKeys = Object.keys(ZH)
  const enKeys = Object.keys(EN)
  const enBase = enKeys.filter((key) => !key.endsWith(".one")) // `.one` 变体族 = 仅 en 表载体（KD-SV-44）
  for (const key of zhKeys.filter((key) => !SELF_NAMES.includes(key))) assert.ok(key in EN, `en 表缺键：${key}`)
  for (const key of enKeys) assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  for (const key of enBase) {
    assert.ok(key in ZH, `en 表多出键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  assert.equal(zhKeys.length - SELF_NAMES.length, enBase.length)
  for (const key of NEW_KEYS) assert.ok(key in ZH && key in EN, `本批新键缺位：${key}`)
  // 键引用闭合：`t("…")` 字面量 ⊆ 表键（全档扫面）∥ 两新档 + 成员页裸键字面量 ⊆ 表键
  const refs = []
  for (const name of names.filter((name) => name.endsWith(".mjs") && !name.startsWith("i18n-zh") && !name.startsWith("i18n-en"))) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
    for (const match of src.matchAll(/\bt\(\s*'([^']+)'\s*[,)]/g)) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 200, `键引用过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) assert.ok(key in ZH && key in EN, `${name} 引用悬空键：${key}`)
  for (const name of ["modal.mjs", "views-models.mjs", "views-admin.mjs"]) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/["']([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)["']/g)) {
      assert.ok(match[1] in ZH && match[1] in EN, `${name} 裸键字面量悬空：${match[1]}`)
    }
  }
  // 两新档静态直发（200 ∥ text/javascript ∥ 字节 = 磁盘——真 static.mjs 句柄）
  const site = (await import(pathToFileURL(join(ROOT, "thincoder-server", "src", "webui", "static.mjs")).href)).createStaticSite()
  const server = createServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) { res.writeHead(404); res.end() }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    for (const name of ["modal.mjs", "views-models.mjs"]) {
      const response = await fetch(`http://127.0.0.1:${port}/${name}`)
      assert.deepEqual([response.status, (await response.text()) === readFileSync(join(PUBLIC_DIR, name), "utf8")], [200, true], name)
      assert.match(response.headers.get("content-type"), /text\/javascript/, name)
    }
  } finally {
    server.closeAllConnections?.()
    await new Promise((done) => server.close(done))
  }
})

// ── ⑥ 门禁清单（`prepublishOnly` 含本批件 ∥ 清单在盘）────────────────────────

test("⑥ 门禁清单：`prepublishOnly` 含本批件 ∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.ok(batchFiles.includes("docs/batches/2026-10-06-console-modals.test.mjs"), `本批件应入列（现 ${batchFiles.length} 件）`)
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
