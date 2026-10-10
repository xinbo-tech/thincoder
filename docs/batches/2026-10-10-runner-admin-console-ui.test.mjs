/**
 * 2026-10-10-runner-admin-console-ui.test.mjs — thincoder-server 批内单测件（控制台面·沙盒页——runner-admin-console 批；判据源 =
 * `webui/WEBUI.md` §2.8① ∥ §2.2 ∥ §5 行数预算 ∥ §6 AC-19/AC-20 面；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-runner-admin-console-ui.test.mjs`
 *
 * 射程（腿 ↔ 设计轴对照在括号）：
 *   ① 运行面节点表（读时探活 ∥ 可用性提示两态 ∥ 六列 ∥ 在线/离线徽标 ∥ 容器计数与离线不外推）
 *   ② 添加节点弹窗（两字段 ∥ 自检中态 ∥ 提交体 ∥ 成/败两路——失败留窗、草稿不丢）
 *   ③ 删除节点弹窗三态（有容器 ⇒ 列数 + 二选一 ∥ 无容器 ⇒ 单确认 ∥ 不可达 ⇒ 明示保留语义）
 *   ④ 容器区（懒加载 ∥ 容器表四列 ∥ 态文案三形 + 枚举外原值兜底 ∥ 启停删路径 ∥ 创建弹窗（镜像预填 ∥ 卷空 ⇒ 省略键））
 *   ⑤ 托管接入弹窗（八字段 ∥ S5 窗内预告知句 ∥ 汇总提交体（可选项省略）∥ 必填门 ∥ 无模型门）
 *   ⑥ 装机任务区（三态徽标 ∥ 失败「停在哪步」∥ 步骤读数展开 ∥ 在途 3s 读时轮询、定终态停 ∥ keep 态撤销凭据）
 *   ⑦ i18n 两表（本批 82 键逐键在场 ∥ 占位符对位 ∥ en 零 CJK ∥ 基键集双向相等 ∥ `err.upstream_error` 改值 ∥ 键数终值）
 *   ⑧ 静态面（档目 +1 ∥ nav 管理 8 ∥ app 接线 ∥ 行数/行宽 ∥ 零外链 ∥ `t` 字面量闭合 ∥ 类名双向闭合）
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

const [{ ZH }, { EN }, SANDBOX, NAV, MODELS] = await Promise.all([load("i18n-zh.mjs"), load("i18n-en.mjs"), load("views-sandbox.mjs"), load("nav.mjs"), load("views-models.mjs")])
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
const VIEW_SRC = readPublic("views-sandbox.mjs")
const CSS = readPublic("style.css")

/** 本批新增键（81 沙盒 + 1 nav——§2.2 键族登记；两表逐键同步）。 */
const NEW_KEYS = [
  "admin.sandbox.title", "admin.sandbox.runnersTitle", "admin.sandbox.addRunner", "admin.sandbox.noNodes", "admin.sandbox.allOffline",
  "admin.sandbox.name", "admin.sandbox.address", "admin.sandbox.namePh", "admin.sandbox.addressPh", "admin.sandbox.checking",
  "admin.sandbox.added", "admin.sandbox.loadFailed", "admin.sandbox.empty", "admin.sandbox.colOnline", "admin.sandbox.colVersion",
  "admin.sandbox.colContainers", "admin.sandbox.colActions", "admin.sandbox.online", "admin.sandbox.offline", "admin.sandbox.expand",
  "admin.sandbox.collapse", "admin.sandbox.remove", "admin.sandbox.removeRunnerTitle", "admin.sandbox.removeRunnerConfirm", "admin.sandbox.runnerContainers",
  "admin.sandbox.keepContainers", "admin.sandbox.removeContainers", "admin.sandbox.runnerUnreachable", "admin.sandbox.runnerDeleted", "admin.sandbox.createContainer",
  "admin.sandbox.containerName", "admin.sandbox.image", "admin.sandbox.imagePh", "admin.sandbox.volume", "admin.sandbox.volumePh",
  "admin.sandbox.colState", "admin.sandbox.stateCreated", "admin.sandbox.stateRunning", "admin.sandbox.stateExited", "admin.sandbox.start",
  "admin.sandbox.stop", "admin.sandbox.containerCreated", "admin.sandbox.containerEmpty", "admin.sandbox.removeContainerTitle", "admin.sandbox.removeContainerNote",
  "admin.sandbox.containerDeleted", "admin.sandbox.onboardingBtn", "admin.sandbox.onboardingHost", "admin.sandbox.onboardingHostPh", "admin.sandbox.onboardingPort",
  "admin.sandbox.onboardingUser", "admin.sandbox.authKind", "admin.sandbox.authKey", "admin.sandbox.authPassword", "admin.sandbox.secretKey",
  "admin.sandbox.secretPassword", "admin.sandbox.secretPh", "admin.sandbox.sudoSecret", "admin.sandbox.onboardingName", "admin.sandbox.model",
  "admin.sandbox.modelPick", "admin.sandbox.noModels", "admin.sandbox.credentialMode", "admin.sandbox.credBurn", "admin.sandbox.credKeep",
  "admin.sandbox.s5Notice", "admin.sandbox.fieldRequired", "admin.sandbox.submitting", "admin.sandbox.onboardingStart", "admin.sandbox.onboardingStarted",
  "admin.sandbox.tasksTitle", "admin.sandbox.colStep", "admin.sandbox.colTime", "admin.sandbox.stateInstalling", "admin.sandbox.stateReady",
  "admin.sandbox.stateFailed", "admin.sandbox.tasksEmpty", "admin.sandbox.stopAt", "admin.sandbox.revoke", "admin.sandbox.revokeConfirm",
  "admin.sandbox.revoked", "nav.page.admin.sandbox",
]
/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/([^:])\/\/.*$/gm, "$1")

// ── 桩 DOM（`modal.mjs` 壳面近形：showModal/close 事件/classList/remove；`h` 同 app 语义近似）──────

function makeNode(tag) {
  const classes = new Set()
  return {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, textContent: "", className: "", value: "", hidden: false, disabled: false, checked: false,
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) },
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
  if (root !== null && typeof root === "object") {
    if (pred(root)) out.push(root)
    for (const child of root.children ?? []) fFindAll(child, pred, out)
  }
  return out
}
const fFind = (root, pred) => fFindAll(root, pred)[0] ?? null
const byText = (root, text) => fFind(root, (node) => node.textContent === text)
const textOf = (node) => (typeof node === "string" ? node : [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" "))
const cellsOf = (row) => fFindAll(row, (node) => node.tag === "td").map((cell) => textOf(cell))
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const optionsOf = (select) => fFindAll(select, (node) => node.tag === "option")

/** 桩 ctx（api 路由表 `"METHOD path"` ⇒ handler；全调用入 `calls`）。 */
function fCtx(routes = {}) {
  const calls = []
  const ctx = {
    h: fH,
    state: {},
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    fmtTs: (ts) => `ts:${ts}`,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    flash: (message) => calls.push(["flash", message]),
    fail: (error) => calls.push(["fail", String(error?.message ?? error)]),
  }
  return { ctx, calls }
}

/** 确定性失败（映射面人话——`upstream_error` 携引擎原文）。 */
const upstreamFail = (message) => () => { throw Object.assign(new Error(message), { code: "upstream_error", status: 502 }) }

const fRunner = (over = {}) => ({ id: 1, name: "box-a", address: "http://10.0.0.6:2375", status: "ok", online: true, version: "27.1.1", containers: { total: 3, running: 2 }, selfCheck: "ok", createdAt: 1700000000, ...over })
const fContainer = (over = {}) => ({ id: "c1", name: "workspace-a", image: "thincoder-sandbox:1", state: "running", ...over })
const fRun = (over = {}) => ({ id: 1, host: "10.0.0.6", status: "running", step: "install-docker", startedAt: 1700000000000, steps: [], credential: { mode: "burn", state: "active" }, ...over })
const PROVIDERS = [{ id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: [{ id: "m-1" }, { id: "m-2" }] }]
const MODEL_IDS = MODELS.deriveModels(PROVIDERS).map((row) => row.id)

/** 页面渲染夹具（运行面 + 容器 + 任务三读）。 */
async function fMount({ routes = {}, runners = [fRunner()], runs = [fRun()], containers = [fContainer()] } = {}) {
  globalThis.document = stubDocument()
  const { ctx, calls } = fCtx({
    "GET /api/admin/sandbox/overview": () => ({ status: "ok", runners }),
    "GET /api/admin/sandbox/runners/1/containers": () => ({ containers }),
    "GET /api/admin/sandbox/onboarding": () => ({ runs }),
    ...routes,
  })
  const mount = makeNode("section")
  await SANDBOX.renderSandbox(ctx, mount)
  return { ctx, calls, mount, modal: () => fFind(globalThis.document.body, (node) => node.tag === "dialog") }
}

// ── ① 运行面（节点表 ∥ 可用性提示——§2.8①）───────────────────────────────────

test("① 运行面：六列在册 ∥ 在线/离线徽标 ∥ 离线行红标 ∥ 容器计数与离线「—」 ∥ 空态/提示两态", async () => {
  try {
    const { calls, mount } = await fMount()
    const headers = fFindAll(fFindAll(mount, (node) => node.tag === "table")[0], (node) => node.tag === "th").map((cell) => cell.textContent).slice(0, 6)
    assert.deepEqual(headers, [ZH["admin.sandbox.name"], ZH["admin.sandbox.address"], ZH["admin.sandbox.colOnline"], ZH["admin.sandbox.colVersion"], ZH["admin.sandbox.colContainers"], ZH["admin.sandbox.colActions"]], "六列表头（§2.8①）")
    const nodeTable = fFindAll(mount, (node) => node.tag === "table")[0]
    const rows = fFindAll(nodeTable, (node) => node.tag === "tr").filter((row) => fFind(row, (cell) => cell.tag === "td") !== null)
    assert.equal(rows.length, 1, "一节点一行")
    assert.ok(cellsOf(rows[0]).includes("2/3"), `容器计数 = 运行中/总：${cellsOf(rows[0]).join(" | ")}`)
    assert.ok(cellsOf(rows[0]).includes(fRunner().version), "版本列")
    assert.equal(fFind(mount, (node) => node.className === "badge ok")?.textContent, ZH["admin.sandbox.online"], "在线徽标")
    assert.ok(fFind(mount, (node) => node.textContent === ZH["admin.sandbox.empty"]) === null, "有节点 ⇒ 空态缺位")
    assert.deepEqual(calls.map(([method, path]) => `${method} ${path}`), ["GET /api/admin/sandbox/overview", "GET /api/admin/sandbox/onboarding"], "首读两件（容器区待展开——懒加载）")
    // 全离线（节点面不整页禁用——两钮恒在场）
    const offline = await fMount({ runners: [fRunner({ online: false, version: null, containers: null, status: "unavailable" })] })
    const alert = fFind(offline.mount, (node) => node.tag === "p" && node.textContent === ZH["admin.sandbox.allOffline"])
    assert.ok(alert !== null && alert.hidden === false, "全离线 ⇒ 提示条在场")
    assert.ok(byText(offline.mount, ZH["admin.sandbox.addRunner"]) !== null && byText(offline.mount, ZH["admin.sandbox.onboardingBtn"]) !== null, "禁用面缺位（两钮恒在场）")
    assert.ok(cellsOf(offline.mount).includes("—"), "离线节点容器计数不外推 ⇒ 「—」")
    assert.equal(fFindAll(offline.mount, (node) => node.tag === "tr" && node.className === "error").length, 1, "离线行红标")
    // 无节点（另一文案）
    const none = await fMount({ runners: [], routes: { "GET /api/admin/sandbox/overview": () => ({ status: "unavailable", runners: [] }) } })
    assert.ok(fFind(none.mount, (node) => node.textContent === ZH["admin.sandbox.noNodes"]) !== null, "无节点 ⇒ 提示条")
    assert.ok(fFind(none.mount, (node) => node.textContent === ZH["admin.sandbox.empty"]) !== null, "无节点 ⇒ 表位空态")
    // 读数失败 ⇒ 就地错态 + fail 收口
    const bad = await fMount({ routes: { "GET /api/admin/sandbox/overview": upstreamFail("engine down") } })
    assert.ok(fFind(bad.mount, (node) => node.textContent === ZH["admin.sandbox.loadFailed"]) !== null, "读面失败 ⇒ 就地错态")
    assert.deepEqual(bad.calls.filter(([tag]) => tag === "fail").length, 1, "fail 收口一次")
  } finally { delete globalThis.document }
})

// ── ② 添加节点弹窗（自检中态 ∥ 成/败两路）─────────────────────────────────────

test("② 添加节点：两字段 ∥ 必填门 ∥ 自检中态 ∥ 提交体 ∥ 成（关窗 + flash）∥ 败（留窗 + 草稿不丢）", async () => {
  try {
    const { calls, mount, modal } = await fMount({ routes: { "POST /api/admin/sandbox/runners": () => ({ runner: fRunner() }) } })
    await byText(mount, ZH["admin.sandbox.addRunner"]).fire("click")
    const dialog = modal()
    assert.ok(dialog !== null, "弹窗开启")
    const inputs = fFindAll(dialog, (node) => node.tag === "input")
    assert.equal(inputs.length, 2, "两字段（名 ∥ 地址）")
    assert.equal(inputs[0].attrs.placeholder, ZH["admin.sandbox.namePh"], "名称占位")
    assert.equal(inputs[1].attrs.placeholder, ZH["admin.sandbox.addressPh"], "地址占位")
    const form = fFind(dialog, (node) => node.tag === "form")
    await form.fire("submit")
    assert.equal(calls.filter(([method]) => method === "POST").length, 0, "空表单 ⇒ 不提交")
    assert.ok(textOf(dialog).includes(fill(ZH["admin.sandbox.fieldRequired"], { field: ZH["admin.sandbox.name"] })), "必填门人话（窗内）")
    inputs[0].value = "box-c"
    inputs[1].value = "http://10.0.0.8:2375"
    const pending = form.fire("submit")
    assert.ok(textOf(dialog).includes(ZH["admin.sandbox.checking"]), "自检中态（落定前）")
    await pending
    assert.deepEqual(calls.find(([method]) => method === "POST"), ["POST", "/api/admin/sandbox/runners", { name: "box-c", address: "http://10.0.0.8:2375" }], "提交体两件")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === fill(ZH["admin.sandbox.added"], { name: "box-c" })), "成功 flash")
    assert.equal(modal(), null, "成功 ⇒ 关窗")
    // 败路：502 携引擎原文 ⇒ 窗内就地人话 ∥ 草稿不丢
    const bad = await fMount({ routes: { "POST /api/admin/sandbox/runners": upstreamFail("docker api refused") } })
    await byText(bad.mount, ZH["admin.sandbox.addRunner"]).fire("click")
    const badDialog = bad.modal()
    const badInputs = fFindAll(badDialog, (node) => node.tag === "input")
    badInputs[0].value = "box-d"
    badInputs[1].value = "http://10.0.0.9:2375"
    await fFind(badDialog, (node) => node.tag === "form").fire("submit")
    assert.ok(textOf(badDialog).includes(fill(ZH["err.upstream_error"], { detail: "docker api refused" })), "窗内就地人话（逐句）")
    assert.equal(bad.modal(), badDialog, "失败 ⇒ 不关窗")
    assert.deepEqual([badInputs[0].value, badInputs[1].value], ["box-d", "http://10.0.0.9:2375"], "草稿不丢")
  } finally { delete globalThis.document }
})

// ── ③ 删除节点弹窗（三态——§2.5 删除节点行）───────────────────────────────────

test("③ 删除节点三态：有容器 ⇒ 列数 + 二选一 ∥ 无容器 ⇒ 单确认 ∥ 不可达 ⇒ 明示保留语义 + 仅 keep", async () => {
  try {
    const { calls, mount, modal } = await fMount({ routes: { "DELETE /api/admin/sandbox/runners/1": () => ({ ok: true }) } })
    await byText(mount, ZH["admin.sandbox.remove"]).fire("click")
    const dialog = modal()
    assert.ok(textOf(dialog).includes(fill(ZH["admin.sandbox.runnerContainers"], { count: 1 })), "容器数在册")
    const radios = fFindAll(dialog, (node) => node.tag === "input")
    assert.equal(radios.length, 2, "二选一")
    assert.deepEqual(radios.map((radio) => radio.checked), [true, false], "缺省 = 保留")
    await byText(dialog, ZH["admin.sandbox.remove"]).fire("click")
    assert.deepEqual(calls.find(([method]) => method === "DELETE"), ["DELETE", "/api/admin/sandbox/runners/1", { containers: "keep" }], "缺省体 = keep")
    // 选「连删」⇒ remove
    const second = await fMount({ routes: { "DELETE /api/admin/sandbox/runners/1": () => ({ ok: true }) } })
    await byText(second.mount, ZH["admin.sandbox.remove"]).fire("click")
    await fFind(second.modal(), (node) => node.tag === "input" && node.value === "remove").fire("change")
    await byText(second.modal(), ZH["admin.sandbox.remove"]).fire("click")
    assert.deepEqual(second.calls.find(([method]) => method === "DELETE"), ["DELETE", "/api/admin/sandbox/runners/1", { containers: "remove" }], "连删体 = remove")
    // 无容器 ⇒ 单确认（无二选一）
    const empty = await fMount({ containers: [] })
    await byText(empty.mount, ZH["admin.sandbox.remove"]).fire("click")
    assert.equal(fFindAll(empty.modal(), (node) => node.tag === "input").length, 0, "无容器 ⇒ 零二选一")
    assert.ok(textOf(empty.modal()).includes(fill(ZH["admin.sandbox.removeRunnerConfirm"], { name: "box-a" })), "单确认句在册（删登记 ≠ 动机器）")
    // 不可达 ⇒ 明示句（容器无法核对——如有将保留运行）
    const unreachable = await fMount({ routes: { "GET /api/admin/sandbox/runners/1/containers": upstreamFail("connect ECONNREFUSED") } })
    await byText(unreachable.mount, ZH["admin.sandbox.remove"]).fire("click")
    assert.ok(textOf(unreachable.modal()).includes(ZH["admin.sandbox.runnerUnreachable"]), "不可达明示句")
    assert.equal(fFindAll(unreachable.modal(), (node) => node.tag === "input").length, 0, "不可达 ⇒ 零二选一（仅 keep）")
  } finally { delete globalThis.document }
})

// ── ④ 容器区（懒加载 ∥ 四列 ∥ 态文案 ∥ 启停删 ∥ 创建弹窗）────────────────────────

test("④ 容器区：展开懒加载 ∥ 四列 ∥ 态文案三形 + 枚举外原值 ∥ 启停删路径 ∥ 创建弹窗（镜像预填 ∥ 卷省略）", async () => {
  try {
    const routes = {
      "POST /api/admin/sandbox/runners/1/containers": () => ({ container: fContainer({ id: "c9", name: "workspace-b" }) }),
      "POST /api/admin/sandbox/runners/1/containers/c1/start": () => ({ ok: true }),
      "POST /api/admin/sandbox/runners/1/containers/c1/stop": () => ({ ok: true }),
      "DELETE /api/admin/sandbox/runners/1/containers/c1": () => ({ ok: true }),
      "GET /api/admin/sandbox/settings": () => ({ settings: { image: "thincoder-sandbox:9" } }),
    }
    const containers = [fContainer(), fContainer({ id: "c2", name: "workspace-x", state: "created" }), fContainer({ id: "c3", name: "workspace-y", state: "exited" }), fContainer({ id: "c4", name: "workspace-z", state: "paused" })]
    const { calls, mount, modal } = await fMount({ routes, containers })
    assert.equal(calls.filter(([, path]) => path.endsWith("/containers")).length, 0, "未展开 ⇒ 零取（懒加载）")
    await byText(mount, ZH["admin.sandbox.expand"]).fire("click")
    await tick()
    assert.equal(calls.filter(([, path]) => path === "/api/admin/sandbox/runners/1/containers").length, 1, "展开 ⇒ 取一次")
    const containerHeaders = fFindAll(fFindAll(mount, (node) => node.tag === "table")[1], (node) => node.tag === "th").map((cell) => cell.textContent)
    assert.deepEqual(containerHeaders, [ZH["admin.sandbox.containerName"], ZH["admin.sandbox.image"], ZH["admin.sandbox.colState"], ZH["admin.sandbox.colActions"]], "容器表四列")
    const cells = fFindAll(mount, (node) => node.tag === "td").map((cell) => cell.textContent)
    for (const label of [ZH["admin.sandbox.stateRunning"], ZH["admin.sandbox.stateCreated"], ZH["admin.sandbox.stateExited"]]) assert.ok(cells.includes(label), `态文案在册：${label}`)
    assert.ok(cells.includes("paused"), "枚举外 ⇒ 原值兜底（零遗漏）")
    assert.equal(SANDBOX.containerStateLabel("paused"), "paused", "兜底纯函数")
    assert.equal(SANDBOX.containerStateLabel(null), "—", "空值 ⇒ 「—」")
    // 启停（动作直调）∥ 删（确认弹窗）
    await byText(mount, ZH["admin.sandbox.start"]).fire("click")
    await byText(mount, ZH["admin.sandbox.stop"]).fire("click")
    assert.deepEqual(calls.filter(([method]) => method === "POST").map(([, path]) => path), ["/api/admin/sandbox/runners/1/containers/c1/start", "/api/admin/sandbox/runners/1/containers/c1/stop"], "启停路径")
    const containerTable = fFindAll(mount, (node) => node.tag === "table")[1]
    await byText(containerTable, ZH["admin.sandbox.remove"]).fire("click")
    assert.ok(textOf(modal()).includes(ZH["admin.sandbox.removeContainerNote"]), "强停强删提示在册（卷不随删）")
    await byText(modal(), ZH["admin.sandbox.remove"]).fire("click")
    assert.deepEqual(calls.find(([method]) => method === "DELETE"), ["DELETE", "/api/admin/sandbox/runners/1/containers/c1", null], "删容器路径")
    // 创建容器弹窗（镜像预填 ∥ 卷空 ⇒ 省略键）
    await tick()
    await byText(mount, ZH["admin.sandbox.createContainer"]).fire("click")
    const dialog = modal()
    const inputs = fFindAll(dialog, (node) => node.tag === "input")
    assert.equal(inputs.length, 3, "三字段（名 ∥ 镜像 ∥ 卷）")
    await tick()
    assert.equal(inputs[1].value, "thincoder-sandbox:9", "镜像预填 = 设置读面值")
    inputs[0].value = "workspace-b"
    await fFind(dialog, (node) => node.tag === "form").fire("submit")
    assert.deepEqual(calls.filter(([method, path]) => method === "POST" && path === "/api/admin/sandbox/runners/1/containers").at(-1), ["POST", "/api/admin/sandbox/runners/1/containers", { name: "workspace-b", image: "thincoder-sandbox:9" }], "卷空 ⇒ 省略键")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === fill(ZH["admin.sandbox.containerCreated"], { name: "workspace-b" })), "建容器 flash")
  } finally { delete globalThis.document }
})

// ── ⑤ 托管接入弹窗（八字段 ∥ S5 预告知 ∥ 汇总提交体）────────────────────────────

test("⑤ 托管接入：八字段 ∥ S5 窗内预告知句 ∥ 模型下拉源 ∥ 汇总提交体（可选项省略）∥ 必填门 ∥ 无模型门", async () => {
  try {
    const { calls, mount, modal } = await fMount({ routes: { "POST /api/admin/sandbox/onboarding": () => ({ run: fRun() }), "GET /api/admin/providers": () => ({ providers: PROVIDERS }) } })
    await byText(mount, ZH["admin.sandbox.onboardingBtn"]).fire("click")
    const dialog = modal()
    const text = textOf(dialog)
    for (const label of ["admin.sandbox.onboardingHost", "admin.sandbox.onboardingPort", "admin.sandbox.onboardingUser", "admin.sandbox.authKind", "admin.sandbox.secretKey", "admin.sandbox.sudoSecret", "admin.sandbox.onboardingName", "admin.sandbox.model", "admin.sandbox.credentialMode"]) {
      assert.ok(text.includes(ZH[label]), `字段在册：${label}`)
    }
    assert.ok(text.includes(ZH["admin.sandbox.s5Notice"]), "S5 窗内预告知句在册（开监听重启 Docker ⇒ 既有容器短暂中断）")
    const modelSelect = fFind(dialog, (node) => node.tag === "select" && optionsOf(node).some((option) => option.textContent === MODEL_IDS[0]))
    assert.deepEqual(optionsOf(modelSelect).map((option) => option.textContent), [ZH["admin.sandbox.modelPick"], ...MODEL_IDS], "模型下拉源 = provider 注册表现有模型")
    assert.equal(fFind(dialog, (node) => node.tag === "input" && node.attrs.type === "number").value, "22", "SSH 端口缺省 22")
    const kindSelect = fFind(dialog, (node) => node.tag === "select" && optionsOf(node).some((option) => option.value === "password"))
    const modeSelect = fFind(dialog, (node) => node.tag === "select" && optionsOf(node).some((option) => option.value === "keep"))
    assert.equal(optionsOf(modeSelect).map((option) => option.textContent).join("|"), `${ZH["admin.sandbox.credBurn"]}|${ZH["admin.sandbox.credKeep"]}`, "凭据处置两态（缺省 burn）")
    const form = fFind(dialog, (node) => node.tag === "form")
    await form.fire("submit")
    assert.equal(calls.filter(([method]) => method === "POST").length, 0, "空表单 ⇒ 不提交")
    assert.ok(textOf(dialog).includes(fill(ZH["admin.sandbox.fieldRequired"], { field: ZH["admin.sandbox.onboardingHost"] })), "必填门人话")
    // 秘密标签随认证方式（key ⇒ 私钥 ∥ password ⇒ 登录密码）
    kindSelect.value = "password"
    await kindSelect.fire("change")
    assert.ok(textOf(dialog).includes(ZH["admin.sandbox.secretPassword"]), "认证 = 密码 ⇒ 秘密标签换名")
    // 汇总提交体（sshPort 数值 ∥ sudoSecret/name 可选项省略）
    const inputs = fFindAll(dialog, (node) => node.tag === "input")
    inputs[0].value = "10.0.0.6"
    inputs[2].value = "ubuntu"
    fFind(dialog, (node) => node.tag === "textarea").value = "secret-material"
    modelSelect.value = MODEL_IDS[1]
    modeSelect.value = "keep"
    await form.fire("submit")
    assert.deepEqual(calls.filter(([method]) => method === "POST").at(-1)[2], { host: "10.0.0.6", sshUser: "ubuntu", auth: { kind: "password", secret: "secret-material" }, model: MODEL_IDS[1], credentialMode: "keep", sshPort: 22 }, "汇总体（sudoSecret/name 缺省 ⇒ 省略键）")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === ZH["admin.sandbox.onboardingStarted"]), "发起 flash")
    assert.equal(modal(), null, "成功 ⇒ 关窗")
    // 无模型门（provider 表空 ⇒ 提示项 + 前端先行拦）
    const noModels = await fMount({ routes: { "POST /api/admin/sandbox/onboarding": () => ({ run: fRun() }), "GET /api/admin/providers": () => ({ providers: [] }) } })
    await byText(noModels.mount, ZH["admin.sandbox.onboardingBtn"]).fire("click")
    const nmDialog = noModels.modal()
    assert.ok(textOf(nmDialog).includes(ZH["admin.sandbox.noModels"]), "无可用模型 ⇒ 提示项")
    const nmInputs = fFindAll(nmDialog, (node) => node.tag === "input")
    nmInputs[0].value = "10.0.0.6"
    nmInputs[2].value = "ubuntu"
    fFind(nmDialog, (node) => node.tag === "textarea").value = "s"
    await fFind(nmDialog, (node) => node.tag === "form").fire("submit")
    assert.equal(noModels.calls.filter(([method]) => method === "POST").length, 0, "无模型 ⇒ 前端先行拦（不提交）")
  } finally { delete globalThis.document }
})

// ── ⑥ 装机任务区（三态 ∥ 停在哪步 ∥ 读数展开 ∥ 3s 轮询定终态停 ∥ 撤销凭据）────────

test("⑥ 装机任务区：三态徽标 ∥ 失败「停在哪步」∥ 展开取详情（步骤读数）∥ 在途 3s 读时轮询定终态停 ∥ keep 态撤销凭据", async () => {
  const realSetTimeout = globalThis.setTimeout
  const timers = []
  const pendingTimers = []
  globalThis.setTimeout = (fn, ms, ...rest) => {
    if (ms === SANDBOX.TASK_POLL_MS) { timers.push(ms); pendingTimers.push(fn); return -1 } // 只记录（不实执行——零悬挂定时器）
    return realSetTimeout(fn, ms, ...rest)
  }
  try {
    assert.equal(SANDBOX.TASK_POLL_MS, 3000, "在途轮询间隔 = 3s")
    // 列表 = 步骤无读数（服务端形——onboarding.mjs `runView`）；详情 = 携 `steps[].readings`
    const failed = fRun({ id: 7, host: "10.0.0.7", status: "failed", step: "S5", credential: { mode: "keep", state: "sealed" }, steps: [{ id: "S1", status: "done" }, { id: "S5", status: "failed" }] })
    const ready = fRun({ id: 8, host: "10.0.0.8", status: "succeeded", step: "S8", credential: { mode: "burn", state: "burned" }, steps: [{ id: "S8", status: "done" }] })
    const routes = {
      "DELETE /api/admin/sandbox/onboarding/7/credential": () => ({ ok: true }),
      "GET /api/admin/sandbox/onboarding/7": () => ({ run: { ...failed, steps: [
        { id: "S1", status: "done", note: "受理", readings: { host: "10.0.0.7", sshUser: "ubuntu", authKind: "key", credentialMode: "keep" } },
        { id: "S5", status: "failed", note: "开 API 监听失败", readings: { command: "systemctl restart docker", exitCode: 1, summary: "unit not found" } },
      ] } }),
    }
    const { calls, mount, modal } = await fMount({ routes, runs: [fRun(), failed, ready] })
    const labels = fFindAll(mount, (node) => node.tag === "span").map((node) => node.textContent)
    for (const label of [ZH["admin.sandbox.stateInstalling"], ZH["admin.sandbox.stateFailed"], ZH["admin.sandbox.stateReady"]]) assert.ok(labels.includes(label), `三态文案在册：${label}`)
    assert.deepEqual(["running", "failed", "ready", "succeeded", "weird"].map((status) => SANDBOX.runStateLabel(status)), [ZH["admin.sandbox.stateInstalling"], ZH["admin.sandbox.stateFailed"], ZH["admin.sandbox.stateReady"], ZH["admin.sandbox.stateReady"], ZH["admin.sandbox.stateInstalling"]], "态映射（枚举外 ⇒ 在途）")
    assert.deepEqual(timers, [3000], "在途 ⇒ 恰一枚 3s 轮询")
    assert.equal(calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding/7").length, 0, "未展开 ⇒ 零详情取数（懒取）")
    // 任务行展开 = 详情取数一次 ⇒ 步骤清单 + 读数（失败 ⇒ 停在哪步）
    await fFind(mount, (node) => node.tag === "td" && node.textContent === "10.0.0.7").parent.fire("click")
    assert.equal(calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding/7").length, 1, "展开 ⇒ 详情取一次")
    await tick()
    const detail = textOf(mount)
    assert.ok(detail.includes(fill(ZH["admin.sandbox.stopAt"], { step: "S5" })), "失败 ⇒ 停在哪步（列表 `step`）")
    assert.ok(detail.includes("S1 — 受理") && detail.includes("S5 — 开 API 监听失败"), "步骤名 + note（详情形 `id`/`note`）")
    assert.ok(detail.includes("host: 10.0.0.7") && detail.includes("sshUser: ubuntu") && detail.includes("authKind: key"), "读数逐键（对象形——键：值）")
    assert.ok(detail.includes("command: systemctl restart docker") && detail.includes("exitCode: 1") && detail.includes("summary: unit not found"), "读数三件（命令/退出码/摘要）")
    // 撤销凭据（keep 态——二次确认）
    await byText(mount, ZH["admin.sandbox.revoke"]).fire("click")
    const dialog = modal()
    assert.ok(textOf(dialog).includes(ZH["admin.sandbox.revokeConfirm"]), "二次确认句")
    assert.equal(fFind(dialog, (node) => node.tag === "h3").textContent, ZH["admin.sandbox.revoke"], "窗题 = 撤销凭据")
    await fFind(dialog, (node) => node.tag === "button" && node.className === "danger").fire("click")
    assert.deepEqual(calls.find(([method]) => method === "DELETE"), ["DELETE", "/api/admin/sandbox/onboarding/7/credential", null], "撤销路径")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === ZH["admin.sandbox.revoked"]), "撤销 flash")
    // 单链：撤销后重读不叠排（pollTimer 在场 ⇒ 零新排）
    assert.deepEqual(timers, [3000], "单链——重读不叠排")
    const readsBefore = calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding").length
    pendingTimers[0]()
    await tick()
    assert.equal(calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding").length, readsBefore + 1, "放行一轮 ⇒ 重读一次")
    assert.deepEqual(timers, [3000, 3000], "重读后一枚续排（链式单枚）")
    // burn 态 ⇒ 零撤销钮
    const burned = await fMount({ runs: [ready] })
    assert.equal(byText(burned.mount, ZH["admin.sandbox.revoke"]), null, "burn 态零撤销钮")
    // 定终态停：全终态 ⇒ 零新定时器
    const settledCount = timers.length
    const settled = await fMount({ runs: [ready] })
    assert.equal(timers.length, settledCount, "全终态 ⇒ 零新排（定终态停）")
    assert.equal(settled.calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding").length, 1, "定终态仍读一次（读时读）")
    // 离页/重渲 ⇒ 停机（挂载点断开卫）
    const stale = await fMount({ runs: [fRun({ id: 9 })] })
    const staleReads = stale.calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding").length
    const staleTimer = pendingTimers.at(-1)
    stale.mount.isConnected = false
    staleTimer()
    await tick()
    assert.equal(stale.calls.filter(([, path]) => path === "/api/admin/sandbox/onboarding").length, staleReads, "挂载点断开 ⇒ 轮询自停")
    // 详情取数失败 ⇒ fail 收口 + 零步骤读数（不假造）
    const badDetail = await fMount({ runs: [{ ...fRun({ id: 7, steps: [{ id: "S1", status: "done" }] }) }] })
    await fFind(badDetail.mount, (node) => node.tag === "td" && node.textContent === "10.0.0.6").parent.fire("click")
    await tick()
    assert.equal(badDetail.calls.filter(([tag]) => tag === "fail").length, 1, "详情失败 ⇒ fail 收口（任务面不反噬）")
    assert.equal(textOf(badDetail.mount).includes("S1 —"), false, "详情失败 ⇒ 零步骤读数（不假造）")
    assert.deepEqual(calls.filter(([tag]) => tag === "fail"), [], "主挂载无障碍路径零 fail 收口")
  } finally {
    globalThis.setTimeout = realSetTimeout
    delete globalThis.document
  }
})

// ── ⑦ i18n 两表（§2.2——本批键族 ∥ 基键集 ∥ `err.upstream_error` 改值）─────────

test("⑦ i18n：82 键逐键在场 ∥ 占位符对位 ∥ en 零 CJK ∥ 基键集双向相等 ∥ `err.upstream_error` 携 {detail} ∥ 键数终值", () => {
  for (const key of NEW_KEYS) {
    for (const [lang, table] of [["zh", ZH], ["en", EN]]) {
      assert.ok(typeof table[key] === "string" && table[key].trim() !== "", `${lang} 表缺键：${key}`)
    }
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不对位：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 值含 CJK：${key}`)
  }
  assert.equal(NEW_KEYS.length, 82, "本批键数（81 沙盒 + nav 1）")
  // 基键集双向相等（自称名族 = 仅 zh；`.one` 变体族 = en 独有——沿既有口径排除）
  const SELF_NAMES = new Set(["lang.zh", "lang.en"])
  const base = (table) => new Set(Object.keys(table).filter((key) => !SELF_NAMES.has(key)).map((key) => key.replace(/\.one$/, "")))
  const zhBase = base(ZH)
  const enBase = base(EN)
  assert.deepEqual([...zhBase].filter((key) => !enBase.has(key)), [], "仅 zh 键（自称名族除外）")
  assert.deepEqual([...enBase].filter((key) => !zhBase.has(key)), [], "仅 en 键")
  // 改值面（本批唯一共享键值改动——参数码化）
  assert.equal(ZH["err.upstream_error"], "上游服务出错：{detail}", "zh 改值")
  assert.equal(EN["err.upstream_error"], "Upstream service error: {detail}", "en 改值")
  assert.equal(ZH["nav.page.admin.sandbox"], "沙盒", "nav 键（zh）")
  assert.equal(EN["nav.page.admin.sandbox"], "Sandbox", "nav 键（en）")
  // 键数终值（实读 2026-10-11：555 ∥ 560——沙盒-docker 批 +54 ∥ chat 批 +33；键集零语义，拆分为文件面）
  assert.deepEqual([Object.keys(ZH).length, Object.keys(EN).length], [555, 560], "键数终值")
})

// ── ⑧ 静态面（档目 ∥ nav ∥ app 接线 ∥ 行数 ∥ 零外链 ∥ 键/类闭合）────────────────

test("⑧ 静态面：档目 36 ∥ 37 ∥ nav 管理 9 ∥ app 接线 ∥ 行数/行宽 ∥ 零外链 ∥ t 字面量闭合 ∥ 类名双向闭合", () => {
  // 档目（31 ∥ 32 ⇒ 36 ∥ 37——2026-10-11 两批 + 拆分层后）
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [37, 36], "档目 37 ∥ 36（2026-10-11 两批 + 拆分层后）")
  assert.ok(names.includes("views-sandbox.mjs"), "新档在册")
  // nav（管理 9 ∥ sandbox 项末位）
  const admin = NAV.NAV_GROUPS.find((group) => group.key === "admin")
  assert.equal(admin.items.length, 9, "管理 9（2026-10-11：chat ∥ sandbox +2）")
  assert.deepEqual(admin.items.at(-1), { key: "sandbox", labelKey: "nav.page.admin.sandbox", path: "/admin/sandbox" }, "sandbox 项末位（labelKey 单源）")
  // app.mjs 接线（import + PAGES 行）
  const appSrc = readPublic("app.mjs")
  assert.ok(appSrc.includes('import { renderSandbox } from "./views-sandbox.mjs"'), "app 导入面")
  assert.ok(appSrc.includes('"/admin/sandbox": renderSandbox'), "app PAGES 行")
  // 行数/行宽/零外链/零 CJK（视图档软线 300 ∥ 硬线 500——实读在断言消息）
  const lines = VIEW_SRC.split("\n").length
  assert.ok(lines <= 500, `views-sandbox.mjs 越 500 顾问线（硬限 800）：${lines}`)
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
  for (const token of used) assert.ok(cssClasses.has(token), `档面类无样式规则：${token}`)
  for (const token of ["badge", "off", "detail-row", "stack-box", "step-list"]) assert.ok(used.has(token) && cssClasses.has(token), `本批新类双向闭合：${token}`)
  // `:root` 38 ∥ 悬停七条不破（本批零新变量/悬停——AC-19 canon）
  const cssClean = stripComments(CSS)
  assert.equal([...cssClean.match(/:root\s*\{[^{}]*\}/)[0].matchAll(/(--[\w-]+)\s*:/g)].length, 38, ":root 38（零新增）")
  assert.equal([...cssClean.matchAll(/:hover/g)].length, 7, "悬停七条（零新增）")
  // 门禁链：本批 ui 件入链（姊妹两件 = 服务面批落——本件不代断言其档面在盘）
  const chain = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.ok(chain.includes("docs/batches/2026-10-10-runner-admin-console-ui.test.mjs"), `本批 ui 件入链（39 ⇒ 42）：${chain.length}`)
  for (const rel of chain.filter((entry) => !entry.includes("runner-admin-console"))) assert.ok(existsSync(join(ROOT, rel)), `链目标在盘：${rel}`)
})
