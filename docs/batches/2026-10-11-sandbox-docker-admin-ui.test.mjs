/**
 * 2026-10-11-sandbox-docker-admin-ui.test.mjs — thincoder-server 批内单测件（控制台面·沙盒页——sandbox-docker-admin 批；判据源 =
 * `webui/WEBUI.md` §2.8① ∥ §2.2 ∥ §5 行数预算 ∥ §6 AC-19/AC-20 面；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-11-sandbox-docker-admin-ui.test.mjs`
 *
 * 射程（腿 ↔ 设计轴对照在括号）：
 *   ① 容器表六钮（详情/启动/停止/重启/日志/删除）+ 详情窗（信息段逐值 ∥ 挂载表 ∥ 端口表 ∥ 环境块 ∥ 用量块（懒取 + 刷新）∥ 强杀二次确认）
 *   ② 日志窗（`pre` 码面 + tail 选择 + 刷新 ∥ 截断标记 ∥ 空态 ∥ 失败窗内就地）
 *   ③ 镜像区（镜像表（多标签逐行 ∥ 无标签）∥ 大小/创建 ∥ 拉取窗（在飞态 + 钮禁用）∥ 删除窗（强制勾选——缺省不勾））
 *   ④ i18n 两表（本批 54 键逐键在场 ∥ 占位符对位 ∥ en 零 CJK ∥ 基键集双向相等）
 *   ⑤ 静态面（档目 34 ∥ 35 ∥ 两新档 ∥ 行数/行宽 ∥ 零外链/零 CJK ∥ `t` 字面量闭合 ∥ 类名双向闭合 ∥ canon 不破 ∥ 门禁链）
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

const [{ ZH }, { EN }, SANDBOX, CONTAINERS, IMAGES] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("views-sandbox.mjs"), load("views-sandbox-containers.mjs"), load("views-sandbox-images.mjs"),
])
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
const SOURCES = {
  "views-sandbox.mjs": readPublic("views-sandbox.mjs"),
  "views-sandbox-containers.mjs": readPublic("views-sandbox-containers.mjs"),
  "views-sandbox-images.mjs": readPublic("views-sandbox-images.mjs"),
}
const CSS = readPublic("style.css")

/** 本批新增键（54——§2.2 键族登记；两表逐键同步）。 */
const NEW_KEYS = [
  "admin.sandbox.detail", "admin.sandbox.restart", "admin.sandbox.logs", "admin.sandbox.kill", "admin.sandbox.killTitle",
  "admin.sandbox.killConfirm", "admin.sandbox.killed", "admin.sandbox.detailTitle", "admin.sandbox.detailId", "admin.sandbox.detailCreated",
  "admin.sandbox.detailRestarts", "admin.sandbox.detailCommand", "admin.sandbox.detailEntrypoint", "admin.sandbox.mountsTitle", "admin.sandbox.mountsEmpty",
  "admin.sandbox.colType", "admin.sandbox.colSource", "admin.sandbox.colDestination", "admin.sandbox.colMode", "admin.sandbox.colRw",
  "admin.sandbox.rwYes", "admin.sandbox.rwNo", "admin.sandbox.portsTitle", "admin.sandbox.portsEmpty", "admin.sandbox.colPort",
  "admin.sandbox.colHostIp", "admin.sandbox.colHostPort", "admin.sandbox.envTitle", "admin.sandbox.envEmpty", "admin.sandbox.usageTitle",
  "admin.sandbox.usageRefresh", "admin.sandbox.usageCpu", "admin.sandbox.usageCpuNa", "admin.sandbox.usageMem", "admin.sandbox.usageDisk",
  "admin.sandbox.logsTitle", "admin.sandbox.logsTail", "admin.sandbox.logsRefresh", "admin.sandbox.logsEmpty", "admin.sandbox.logsTruncated",
  "admin.sandbox.imagesTitle", "admin.sandbox.imagePull", "admin.sandbox.imageRef", "admin.sandbox.imageRefPh", "admin.sandbox.imagePulling",
  "admin.sandbox.imagePulled", "admin.sandbox.imagesEmpty", "admin.sandbox.imageUntagged", "admin.sandbox.colSize", "admin.sandbox.colCreated",
  "admin.sandbox.imageDeleteTitle", "admin.sandbox.imageDeleteConfirm", "admin.sandbox.imageForce", "admin.sandbox.imageDeleted",
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
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

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
const invalidFail = (message) => () => { throw Object.assign(new Error(message), { code: "invalid_request_error", status: 400 }) }

const fRunner = (over = {}) => ({ id: 1, name: "box-a", address: "http://10.0.0.6:2375", status: "ok", online: true, version: "29.1.3", containers: { total: 3, running: 2 }, selfCheck: "ok", createdAt: 1700000000, ...over })
const fContainer = (over = {}) => ({ id: "c1", name: "workspace-a", image: "thincoder-sandbox:1", state: "running", ...over })
const fDetail = (over = {}) => ({
  id: "c1", name: "workspace-a", image: "thincoder-sandbox:1", state: "running", status: "running",
  created: "2026-10-11T00:00:00Z", startedAt: "2026-10-11T00:01:00Z", finishedAt: "0001-01-01T00:00:00Z", restartCount: 2,
  command: { entrypoint: ["/entry.sh"], cmd: ["sleep", "infinity"] },
  env: ["A=1", "B=2"],
  mounts: [{ type: "volume", source: "tc-ws-7", destination: "/workspace", mode: "rw", rw: true }],
  ports: [{ port: "8080", hostIp: "0.0.0.0", hostPort: "18080" }, { port: "9000", hostIp: null, hostPort: null }],
  ...over,
})
const fUsage = (over = {}) => ({ cpuPercent: 20, memUsed: 10485760, memLimit: 1073741824, diskRw: 4096, diskRoot: 8192, sampledAt: 0, ...over })
const fImage = (over = {}) => ({ id: "sha256:aaa", tags: ["thincoder-sandbox:1"], size: 123456, created: 1700000000, ...over })

/** 页面渲染夹具（运行面 + 容器 + 镜像三读）。 */
async function fMount({ routes = {}, runners = [fRunner()], containers = [fContainer()], images = [fImage()], runs = [] } = {}) {
  globalThis.document = stubDocument()
  const { ctx, calls } = fCtx({
    "GET /api/admin/sandbox/overview": () => ({ status: "ok", runners }),
    "GET /api/admin/sandbox/runners/1/containers": () => ({ containers }),
    "GET /api/admin/sandbox/runners/1/images": () => ({ images }),
    "GET /api/admin/sandbox/onboarding": () => ({ runs }),
    ...routes,
  })
  const mount = makeNode("section")
  await SANDBOX.renderSandbox(ctx, mount)
  return { ctx, calls, mount, modal: () => fFind(globalThis.document.body, (node) => node.tag === "dialog") }
}

/** 展开节点行（容器区 + 镜像区懒加载）。 */
async function expand(mount) {
  await byText(mount, ZH["admin.sandbox.expand"]).fire("click")
  await tick()
}

const tableAt = (mount, index) => fFindAll(mount, (node) => node.tag === "table")[index]
const headersOf = (table) => fFindAll(table, (node) => node.tag === "th").map((cell) => cell.textContent)

// ── ① 容器表六钮 + 详情窗（§2.8①）───────────────────────────────────────────

test("① 容器表六钮 ∥ 详情窗：信息段逐值 ∥ 挂载表 ∥ 端口表 ∥ 环境块 ∥ 用量块（懒取 + 刷新）∥ 强杀二次确认", async () => {
  try {
    const routes = {
      "GET /api/admin/sandbox/runners/1/containers/c1": () => ({ container: fDetail() }),
      "GET /api/admin/sandbox/runners/1/containers/c1/stats": () => ({ usage: fUsage() }),
      "POST /api/admin/sandbox/runners/1/containers/c1/kill": () => ({ ok: true }),
    }
    const { calls, mount, modal } = await fMount({ routes })
    await expand(mount)
    const table = tableAt(mount, 1) // [0] 节点表 ∥ [1] 容器表
    assert.deepEqual(headersOf(table), [ZH["admin.sandbox.containerName"], ZH["admin.sandbox.image"], ZH["admin.sandbox.colState"], ZH["admin.sandbox.colActions"]], "容器表四列")
    const ops = fFindAll(table, (node) => node.tag === "button").map((node) => node.textContent)
    assert.deepEqual(ops, [ZH["admin.sandbox.detail"], ZH["admin.sandbox.start"], ZH["admin.sandbox.stop"], ZH["admin.sandbox.restart"], ZH["admin.sandbox.logs"], ZH["admin.sandbox.remove"]], "行内六钮（详情/启动/停止/重启/日志/删除）")
    // 详情窗：懒取（详情 + 用量各一次）
    await byText(table, ZH["admin.sandbox.detail"]).fire("click")
    const dialog = modal()
    assert.ok(dialog !== null, "详情窗开启")
    await tick()
    const detailReads = calls.filter(([method, path]) => method === "GET" && path.startsWith("/api/admin/sandbox/runners/1/containers/c1"))
    assert.deepEqual(detailReads.map(([, path]) => path).sort(), ["/api/admin/sandbox/runners/1/containers/c1", "/api/admin/sandbox/runners/1/containers/c1/stats"], "详情 + 用量两读（懒取——开窗各一次）")
    const detailText = textOf(dialog)
    assert.ok(detailText.includes(fill(ZH["admin.sandbox.detailTitle"], { name: "workspace-a" })), "窗题携容器名")
    for (const [key, value] of [
      ["admin.sandbox.detailId", "c1"], ["admin.sandbox.image", "thincoder-sandbox:1"], ["admin.sandbox.colState", ZH["admin.sandbox.stateRunning"]],
      ["admin.sandbox.detailCreated", "ts:2026-10-11T00:00:00Z"], ["admin.sandbox.detailRestarts", "2"],
      ["admin.sandbox.detailCommand", "sleep infinity"], ["admin.sandbox.detailEntrypoint", "/entry.sh"],
    ]) assert.ok(detailText.includes(ZH[key]) && detailText.includes(value), `信息段逐值：${key} = ${value}`,)
    // 挂载表（五列 + 逐值）∥ 端口表（未映射 ⇒ 「—」）
    const tables = fFindAll(dialog, (node) => node.tag === "table")
    assert.deepEqual(headersOf(tables[0]), [ZH["admin.sandbox.colType"], ZH["admin.sandbox.colSource"], ZH["admin.sandbox.colDestination"], ZH["admin.sandbox.colMode"], ZH["admin.sandbox.colRw"]], "挂载表五列")
    assert.deepEqual(fFindAll(tables[0], (node) => node.tag === "td").map((cell) => cell.textContent), ["volume", "tc-ws-7", "/workspace", "rw", ZH["admin.sandbox.rwYes"]], "挂载逐值（可写）")
    assert.deepEqual(headersOf(tables[1]), [ZH["admin.sandbox.colPort"], ZH["admin.sandbox.colHostIp"], ZH["admin.sandbox.colHostPort"]], "端口表三列")
    assert.deepEqual(fFindAll(tables[1], (node) => node.tag === "td").map((cell) => cell.textContent), ["8080", "0.0.0.0", "18080", "9000", "—", "—"], "端口逐值（未映射 ⇒ null ⇒ 「—」）")
    assert.deepEqual(fFind(dialog, (node) => node.tag === "pre").textContent, "A=1\nB=2", "环境块原文（逐行）")
    // 用量块（懒取落定 + 刷新重取）
    for (const value of ["20%", "10 MiB / 1 GiB", "4 KiB / 8 KiB"]) assert.ok(detailText.includes(value), `用量逐值：${value}`)
    await byText(dialog, ZH["admin.sandbox.usageRefresh"]).fire("click")
    await tick()
    assert.equal(calls.filter(([, path]) => path.endsWith("/stats")).length, 2, "刷新 ⇒ 重取一次")
    // 强杀二次确认（危险钮 ⇒ 确认窗 ⇒ POST kill）
    await byText(dialog, ZH["admin.sandbox.kill"]).fire("click")
    const confirm = modal()
    assert.ok(textOf(confirm).includes(fill(ZH["admin.sandbox.killConfirm"], { name: "workspace-a" })), "二次确认句（携容器名）")
    const dangerBtn = fFind(confirm, (node) => node.tag === "button" && node.className === "danger")
    await dangerBtn.fire("click")
    await tick()
    assert.equal(calls.filter(([method, path]) => method === "POST" && path.endsWith("/kill")).length, 1, "强杀路径")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === fill(ZH["admin.sandbox.killed"], { name: "workspace-a" })), "强杀 flash")
    assert.equal(modal(), null, "成功 ⇒ 关窗")
  } finally { delete globalThis.document }
})

// ── ② 日志窗（§2.8①）────────────────────────────────────────────────────────

test("② 日志窗：`pre` 码面 + tail 选择 + 刷新 ∥ 截断标记 ∥ 空态 ∥ 失败窗内就地", async () => {
  try {
    const routes = {
      "GET /api/admin/sandbox/runners/1/containers/c1/logs?tail=200": () => ({ logs: "hello stdout\nwarn stderr\n", truncated: false, tail: 200 }),
      "GET /api/admin/sandbox/runners/1/containers/c1/logs?tail=500": () => ({ logs: "big\n", truncated: true, tail: 500 }),
    }
    const { calls, mount, modal } = await fMount({ routes })
    await expand(mount)
    await byText(tableAt(mount, 1), ZH["admin.sandbox.logs"]).fire("click")
    const dialog = modal()
    assert.ok(dialog !== null, "日志窗开启")
    await tick()
    const pre = fFind(dialog, (node) => node.tag === "pre")
    assert.ok(pre.className.split(" ").includes("snippet") && pre.className.split(" ").includes("pre-scroll"), `码面块（.snippet + 纵滚）：${pre.className}`)
    assert.equal(pre.textContent, "hello stdout\nwarn stderr\n", "日志文本（服务端已解复用）")
    assert.deepEqual(calls.filter(([, path]) => path.includes("/logs")).map(([, path]) => path), ["/api/admin/sandbox/runners/1/containers/c1/logs?tail=200"], "缺省 tail=200")
    // tail 选择 + 刷新（截断 ⇒ 标记行在场）
    const select = fFind(dialog, (node) => node.tag === "select")
    assert.deepEqual(fFindAll(select, (node) => node.tag === "option").map((option) => option.value), ["100", "200", "500", "1000", "2000"], "tail 选项（缺省 200）")
    select.value = "500"
    await byText(dialog, ZH["admin.sandbox.logsRefresh"]).fire("click")
    await tick()
    assert.deepEqual(calls.filter(([, path]) => path.includes("/logs")).map(([, path]) => path).at(-1), "/api/admin/sandbox/runners/1/containers/c1/logs?tail=500", "刷新携当前 tail")
    const marker = byText(dialog, ZH["admin.sandbox.logsTruncated"])
    assert.ok(marker !== null && marker.hidden === false, "截断标记在场")
    // 空态 ∥ 失败（窗内就地，不反噬页面）
    const empty = await fMount({ routes: { "GET /api/admin/sandbox/runners/1/containers/c1/logs?tail=200": () => ({ logs: "", truncated: false, tail: 200 }) } })
    await expand(empty.mount)
    await byText(tableAt(empty.mount, 1), ZH["admin.sandbox.logs"]).fire("click")
    await tick()
    assert.equal(fFind(empty.modal(), (node) => node.tag === "pre").textContent, ZH["admin.sandbox.logsEmpty"], "空态文案")
    const bad = await fMount({ routes: { "GET /api/admin/sandbox/runners/1/containers/c1/logs?tail=200": upstreamFail("docker down") } })
    await expand(bad.mount)
    await byText(tableAt(bad.mount, 1), ZH["admin.sandbox.logs"]).fire("click")
    await tick()
    assert.ok(textOf(bad.modal()).includes(fill(ZH["err.upstream_error"], { detail: "docker down" })), "失败 ⇒ 窗内就地人话")
    assert.deepEqual(bad.calls.filter(([tag]) => tag === "fail"), [], "窗内收口——零页级 fail")
  } finally { delete globalThis.document }
})

// ── ③ 镜像区（§2.8①）────────────────────────────────────────────────────────

test("③ 镜像区：表（多标签逐行 ∥ 无标签）∥ 拉取窗（在飞态 + 钮禁用）∥ 删除窗（强制勾选——缺省不勾）", async () => {
  try {
    const routes = {
      "POST /api/admin/sandbox/runners/1/images/pull": () => ({ ok: true, image: "ubuntu", tag: "latest" }),
      "DELETE /api/admin/sandbox/runners/1/images": () => ({ ok: true, ref: "thincoder-sandbox:1" }),
    }
    const images = [fImage({ tags: ["thincoder-sandbox:1", "thincoder-sandbox:2"] }), fImage({ id: "sha256:bbb", tags: null, size: 2048, created: 1700000001 })]
    const { calls, mount, modal } = await fMount({ routes, images })
    await expand(mount)
    assert.ok(textOf(mount).includes(ZH["admin.sandbox.imagesTitle"]), "镜像区小标题在册")
    const table = tableAt(mount, 2) // [2] 镜像表（[0] 节点 ∥ [1] 容器）
    assert.deepEqual(headersOf(table), [ZH["admin.sandbox.image"], ZH["admin.sandbox.colSize"], ZH["admin.sandbox.colCreated"], ZH["admin.sandbox.colActions"]], "镜像表四列")
    const rows = fFindAll(table, (node) => node.tag === "tr").filter((row) => fFind(row, (cell) => cell.tag === "td") !== null)
    assert.equal(rows.length, 2, "两镜像两行")
    assert.deepEqual(fFindAll(rows[0], (node) => node.tag === "div").map((node) => node.textContent), ["thincoder-sandbox:1", "thincoder-sandbox:2"], "多标签逐行")
    assert.ok(textOf(rows[1]).includes(ZH["admin.sandbox.imageUntagged"]), "无标签 ⇒「无标签」")
    assert.deepEqual(fFindAll(table, (node) => node.tag === "td").map((cell) => cell.textContent).filter((text) => text.includes("KiB")), ["120.6 KiB", "2 KiB"], "大小格式化")
    assert.ok(textOf(table).includes("ts:1700000000000"), "创建时间（秒 ⇒ ms 化）")
    // 拉取窗（单输入；空 ⇒ 必填门；在飞态 + 钮禁用；成 ⇒ flash + 关窗）
    await byText(mount, ZH["admin.sandbox.imagePull"]).fire("click")
    const pullDialog = modal()
    const input = fFind(pullDialog, (node) => node.tag === "input")
    assert.equal(input.attrs.placeholder, ZH["admin.sandbox.imageRefPh"], "占位 = 名[:标签]")
    const form = fFind(pullDialog, (node) => node.tag === "form")
    await form.fire("submit")
    assert.equal(calls.filter(([method]) => method === "POST").length, 0, "空 ⇒ 不提交")
    assert.ok(textOf(pullDialog).includes(fill(ZH["admin.sandbox.fieldRequired"], { field: ZH["admin.sandbox.imageRef"] })), "必填门人话")
    input.value = "ubuntu"
    const submitBtn = fFind(pullDialog, (node) => node.tag === "button" && node.attrs.type === "submit")
    const pending = form.fire("submit")
    assert.ok(textOf(pullDialog).includes(ZH["admin.sandbox.imagePulling"]), "在飞态句（可能持续数分钟）")
    assert.equal(submitBtn.disabled, true, "在飞 ⇒ 钮禁用")
    await pending
    assert.deepEqual(calls.filter(([method]) => method === "POST").at(-1), ["POST", "/api/admin/sandbox/runners/1/images/pull", { image: "ubuntu" }], "提交体单键")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === fill(ZH["admin.sandbox.imagePulled"], { ref: "ubuntu:latest" })), "拉取 flash（服务端切分回携）")
    assert.equal(modal(), null, "成功 ⇒ 关窗")
    // 删除窗（缺省不勾 ⇒ force:false；勾上 ⇒ force:true）
    await tick()
    await byText(tableAt(mount, 2), ZH["admin.sandbox.remove"]).fire("click")
    const delDialog = modal()
    assert.ok(textOf(delDialog).includes(fill(ZH["admin.sandbox.imageDeleteConfirm"], { ref: "thincoder-sandbox:1" })), "确认句携引用")
    const checkbox = fFind(delDialog, (node) => node.tag === "input" && node.attrs.type === "checkbox")
    assert.equal(checkbox.checked, false, "强制删除——缺省不勾")
    await fFind(delDialog, (node) => node.tag === "button" && node.className === "danger").fire("click")
    await tick()
    assert.deepEqual(calls.find(([method]) => method === "DELETE"), ["DELETE", "/api/admin/sandbox/runners/1/images", { ref: "thincoder-sandbox:1", force: false }], "缺省体 force:false")
    assert.ok(calls.some(([tag, message]) => tag === "flash" && message === fill(ZH["admin.sandbox.imageDeleted"], { ref: "thincoder-sandbox:1" })), "删除 flash")
    // 勾选 ⇒ force:true；409（400 人话）⇒ 窗内就地 + 钮复位
    const forced = await fMount({ routes: { "DELETE /api/admin/sandbox/runners/1/images": invalidFail("镜像被引用或多标签（引擎 409）") }, images: [fImage()] })
    await expand(forced.mount)
    await byText(tableAt(forced.mount, 2), ZH["admin.sandbox.remove"]).fire("click")
    const forcedDialog = forced.modal()
    fFind(forcedDialog, (node) => node.tag === "input" && node.attrs.type === "checkbox").checked = true
    const delBtn = fFind(forcedDialog, (node) => node.tag === "button" && node.className === "danger")
    await delBtn.fire("click")
    await tick()
    assert.deepEqual(forced.calls.find(([method]) => method === "DELETE")[2], { ref: "thincoder-sandbox:1", force: true }, "勾选 ⇒ force:true")
    assert.ok(textOf(forced.modal()).includes(fill(ZH["err.invalid_request_error"], { detail: "镜像被引用或多标签（引擎 409）" })), "409 ⇒ 窗内就地人话")
    assert.equal(delBtn.disabled, false, "失败 ⇒ 钮复位（可勾强制重试）")
    assert.equal(forced.modal(), forcedDialog, "失败 ⇒ 不关窗")
  } finally { delete globalThis.document }
})

// ── ④ i18n 两表（§2.2——本批键族）─────────────────────────────────────────────

test("④ i18n：54 键逐键在场 ∥ 占位符对位 ∥ en 零 CJK ∥ 基键集双向相等", () => {
  for (const key of NEW_KEYS) {
    for (const [lang, table] of [["zh", ZH], ["en", EN]]) {
      assert.ok(typeof table[key] === "string" && table[key].trim() !== "", `${lang} 表缺键：${key}`)
    }
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不对位：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 值含 CJK：${key}`)
  }
  assert.equal(NEW_KEYS.length, 54, "本批键数（54——容器详情/日志/用量/镜像族）")
  // 基键集双向相等（自称名族 = 仅 zh；`.one` 变体族 = en 独有——沿既有口径排除）
  const SELF_NAMES = new Set(["lang.zh", "lang.en"])
  const base = (table) => new Set(Object.keys(table).filter((key) => !SELF_NAMES.has(key)).map((key) => key.replace(/\.one$/, "")))
  const zhBase = base(ZH)
  const enBase = base(EN)
  assert.deepEqual([...zhBase].filter((key) => !enBase.has(key)), [], "仅 zh 键（自称名族除外）")
  assert.deepEqual([...enBase].filter((key) => !zhBase.has(key)), [], "仅 en 键")
  // 纯函数面（本批——格式与态映射）
  assert.deepEqual([0, 1023, 2048, 10485760, 1073741824].map((value) => CONTAINERS.formatBytes(value)), ["0 B", "1023 B", "2 KiB", "10 MiB", "1 GiB"], "formatBytes 档位")
  assert.equal(CONTAINERS.formatBytes(null), "—", "非数 ⇒ 「—」")
  assert.equal(SANDBOX.containerStateLabel("paused"), "paused", "容器态枚举外 ⇒ 原值兜底（re-export 面）")
  assert.equal(typeof IMAGES.createImageSection, "function", "镜像区件导出")
})

// ── ⑤ 静态面（档目 ∥ 行数/行宽 ∥ canon ∥ 门禁链）─────────────────────────────

test("⑤ 静态面：档目 34 ∥ 35 ∥ 行数/行宽 ∥ 零外链/零 CJK ∥ `t` 字面量闭合 ∥ 类名双向闭合 ∥ canon 不破 ∥ 门禁链", () => {
  // 档目（34 ∥ 35——本批 +2 档；test 口径 = [总档数, 除 favicon 档数]）
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [35, 34], "档目 35 ∥ 34（test 口径）⇒ 文档口径 34 ∥ 35")
  for (const name of ["views-sandbox-containers.mjs", "views-sandbox-images.mjs"]) assert.ok(names.includes(name), `新档在册：${name}`)
  const cssClasses = new Set([...CSS.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((match) => match[1]))
  for (const [name, source] of Object.entries(SOURCES)) {
    const lines = source.split("\n").length
    assert.ok(lines <= 500, `${name} 越 500 软线：${lines}`)
    assert.ok(Math.max(...source.split("\n").map((line) => line.length)) <= 300, `${name} 行宽 ≤300`)
    assert.deepEqual([/https?:\/\//.test(source), source.includes("@import")], [false, false], `${name} 零外链（KD-SV-9）`)
    assert.equal(CJK.test(stripComments(source)), false, `${name} 代码段零 CJK（文案全入两表）`)
    // `t` 字面量闭合（两表）
    for (const match of stripComments(source).matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) {
      assert.ok(match[1] in ZH && match[1] in EN, `${name} t 字面量悬空：${match[1]}`)
    }
    // 类名双向闭合（档面字面类 ⊆ 样式类）
    const used = new Set()
    for (const match of source.matchAll(/\bclass(?:Name)?\s*[:=]\s*([^\n;]*?)(?=\s*\bclass(?:Name)?\s*[:=]|[;\n]|$)/g)) {
      const window = match[1].replace(/\$\{[^}]*\}/g, " ").split("//")[0].split("}")[0].split(/,\s*[A-Za-z_$][\w$]*\s*:/)[0]
      for (const literal of window.matchAll(/["'`]([^"'`]*)["'`]/g)) for (const token of literal[1].split(/\s+/)) if (token) used.add(token)
    }
    for (const token of used) assert.ok(cssClasses.has(token), `${name} 档面类无样式规则：${token}`)
  }
  for (const token of ["wrap", "pre-scroll"]) assert.ok(cssClasses.has(token), `本批新类在样式面：${token}`)
  // 容器态文案单源 + 旧导出面（re-export——沿 runner-admin-console 批件面）
  assert.ok(SOURCES["views-sandbox.mjs"].includes('export { containerStateLabel } from "./views-sandbox-containers.mjs"'), "容器态文案 re-export（单源）")
  assert.ok(SOURCES["views-sandbox.mjs"].includes('from "./views-sandbox-containers.mjs"') && SOURCES["views-sandbox.mjs"].includes('from "./views-sandbox-images.mjs"'), "两区件接线")
  // AC-19 canon 不破（零新 `:root` 变量 ∥ 零新悬停规则）
  const cssClean = stripComments(CSS)
  assert.equal([...cssClean.match(/:root\s*\{[^{}]*\}/)[0].matchAll(/(--[\w-]+)\s*:/g)].length, 38, ":root 38（零新增）")
  assert.equal([...cssClean.matchAll(/:hover/g)].length, 7, "悬停七条（零新增）")
  // 门禁链：本批两件入链（档目/计数断言件 = 父侧随正件——本件不代断言其档面）
  const chain = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  for (const entry of ["docs/batches/2026-10-11-sandbox-docker-admin.test.mjs", "docs/batches/2026-10-11-sandbox-docker-admin-ui.test.mjs"]) {
    assert.ok(chain.includes(entry), `本批件入链：${entry}（现 ${chain.length} 件）`)
  }
  for (const rel of chain.filter((entry) => !entry.includes("sandbox-docker-admin"))) assert.ok(existsSync(join(ROOT, rel)), `链目标在盘：${rel}`)
})
