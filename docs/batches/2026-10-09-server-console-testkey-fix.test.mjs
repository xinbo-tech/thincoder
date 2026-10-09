/**
 * 2026-10-09-server-console-testkey-fix.test.mjs — thincoder-server 批内单测件（控制台「测试连接 ∥ 刷新候选」key
 * 缺陷修复——key = 表单草稿口径；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。运行（自 `thincoder/` 仓根）：
 * `node --test docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`
 *
 * 射程（判据源 = 本批档 §2「验收对照」表逐腿）：
 *   ① 明填 `sk-new-123` ⇒「测试连接」：请求体 `apiKey` = 草稿值（红→绿）
 *   ② 留空 ⇒「刷新候选」：= `{ baseURL, providerId }` 不含 `apiKey`（回归）
 *   ③ 留空 ⇒「测试连接」+ 首开自动拉取（同支）：同②（回归）
 *   ④ 清除勾（留空 ∥ 另填两态）⇒「测试连接」/「刷新候选」：= `{ baseURL, apiKey: "" }` 不含 `providerId`（红→绿）
 *   ⑤ 添加弹窗参照面回归：「获取模型」留空 ⇒ 无 `apiKey`；明填（含 `env:` 引用）⇒ 原文照送（参照面零改）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const [{ ZH }, MODALS] = await Promise.all([load("i18n-zh.mjs"), load("views-providers-modals.mjs")])

// ── 桩 DOM（`modal.mjs` 壳面近形：showModal/close 事件/classList/remove；`h` 同 app 语义近似）──

function makeNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, focused: false, checked: false, textContent: "", className: "", value: "", hidden: false,
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
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/** 桩 ctx：api 路由表（`"METHOD path"` ⇒ handler）∥ 全调用入 `calls`（请求体 = 判据面）。 */
function makeCtx(routes = {}) {
  const calls = []
  const ctx = {
    h,
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
  }
  return { ctx, calls }
}

// ── 判据助手 ─────────────────────────────────────────────────────────────────

const PROVIDER = { id: 7, name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "…1234", models: ["deepseek-chat"] }
const discoverCalls = (calls) => calls.filter(([method, path]) => method === "POST" && path === "/api/admin/providers/discover")
/** 文本输入面（复选框除外）——详情弹窗 = [名, baseURL, 密钥] ∥ 添加弹窗 = [名, baseURL, 密钥]。 */
const textInputs = (root) => findAll(root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")
const clearBox = (root) => findNode(root, (node) => node.tag === "input" && node.attrs.type === "checkbox" && node.parent?.className === "key-clear")

// ── ① 明填 ⇒「测试连接」：请求体 apiKey = 草稿值 ─────────────────────────────

test("① 明填 sk-new-123 ⇒「测试连接」：请求体 apiKey = 草稿值", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx, calls } = makeCtx({ "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }) })
    const modal = MODALS.openProviderDetailModal(ctx, { provider: PROVIDER })
    await tick() // 首开自动拉取（空 key——回落支）
    textInputs(modal.root)[2].value = "sk-new-123"
    await byText(modal.root, ZH["admin.providers.test"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, apiKey: "sk-new-123" }, "测试连接须以草稿 key 为准")
  } finally { delete globalThis.document }
})

// ── ② 留空 ⇒「刷新候选」：回落 providerId（不含 apiKey）──────────────────────

test("② 留空 ⇒「刷新候选」：= { baseURL, providerId } 不含 apiKey（回归）", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx, calls } = makeCtx({ "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }) })
    const modal = MODALS.openProviderDetailModal(ctx, { provider: PROVIDER })
    await tick()
    await byText(modal.root, ZH["admin.providers.refreshCandidates"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, providerId: PROVIDER.id })
  } finally { delete globalThis.document }
})

// ── ③ 留空 ⇒「测试连接」（含首开自动拉取同支）：同② ─────────────────────────

test("③ 留空 ⇒「测试连接」+ 首开自动拉取：= { baseURL, providerId } 不含 apiKey（回归）", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx, calls } = makeCtx({ "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }) })
    const modal = MODALS.openProviderDetailModal(ctx, { provider: PROVIDER })
    await tick() // 首开自动拉取
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, providerId: PROVIDER.id }, "首开自动拉取回落 providerId")
    await byText(modal.root, ZH["admin.providers.test"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, providerId: PROVIDER.id }, "测试连接留空回落 providerId")
  } finally { delete globalThis.document }
})

// ── ④ 清除勾 ⇒ 显式空 apiKey（留空 ∥ 另填两态——不含 providerId）─────────────

test("④ 清除勾（留空 ∥ 另填）⇒「测试连接」/「刷新候选」：= { baseURL, apiKey: \"\" } 不含 providerId", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx, calls } = makeCtx({ "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }) })
    const modal = MODALS.openProviderDetailModal(ctx, { provider: PROVIDER })
    await tick()
    const clear = clearBox(modal.root)
    assert.ok(clear !== null, "缺「清除密钥」勾")
    clear.checked = true
    await byText(modal.root, ZH["admin.providers.test"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, apiKey: "" }, "清除勾（留空）⇒ 显式空——测试连接")
    await byText(modal.root, ZH["admin.providers.refreshCandidates"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, apiKey: "" }, "清除勾（留空）⇒ 显式空——刷新候选")
    textInputs(modal.root)[2].value = "sk-typed" // 另填值 ∧ 清除勾 ⇒ 以清除为准（保存同式）
    await byText(modal.root, ZH["admin.providers.test"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, apiKey: "" }, "清除勾 ⊃ 明填（以清除为准）——测试连接")
    await byText(modal.root, ZH["admin.providers.refreshCandidates"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: PROVIDER.baseURL, apiKey: "" }, "清除勾 ⊃ 明填（以清除为准）——刷新候选")
  } finally { delete globalThis.document }
})

// ── ⑤ 添加弹窗参照面回归：留空 ⇒ 无 apiKey；明填（含 env:）⇒ 原文照送 ────────

test("⑤ 添加弹窗参照面回归：「获取模型」留空 ⇒ 无 apiKey；明填 env: 引用 ⇒ 原文照送", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx, calls } = makeCtx({
      "GET /api/admin/providers/presets": () => ({ presets: [] }),
      "POST /api/admin/providers/discover": () => ({ models: ["m-1"] }),
    })
    const modal = MODALS.openAddProviderModal(ctx, { providers: [] })
    await tick() // 预设表拉取
    const select = findNode(modal.root, (node) => node.tag === "select")
    select.value = "custom"
    await select.fire("change")
    const inputs = findAll(modal.root, (node) => node.tag === "input")
    inputs[1].value = "http://10.0.0.5/v1"
    await byText(modal.root, ZH["admin.providers.fetchModels"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: "http://10.0.0.5/v1" }, "留空 ⇒ 无 apiKey")
    inputs[2].value = "env:MOONSHOT_KEY"
    await byText(modal.root, ZH["admin.providers.fetchModels"]).fire("click")
    assert.deepEqual(discoverCalls(calls).at(-1)[2], { baseURL: "http://10.0.0.5/v1", apiKey: "env:MOONSHOT_KEY" }, "明填 ⇒ 原文照送（含 env: 引用）")
  } finally { delete globalThis.document }
})
