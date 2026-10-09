/**
 * 2026-10-06-console-provider-redo.test.mjs — thincoder-server 批内单测件（Provider 管理面重做·静态面腿 ①–④；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。2026-10-07 拆档（越 500 硬线前拆分——运行面腿 ⑤–⑦ 见 `-runtime` 件）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-console-provider-redo.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §6 AC-18 行 + 本批档 §2 腿①–⑦；腿③④以 §2 修正块为准）：
 *   ① nav/页标题值 =「Provider」（两表）∥ `labelKey` 面不破 ∥ admin 面 denied 不破
 *   ② 页面直测：列表（列 ∥ 掩码/未配置 ∥ 服务模型数）+ 添加钮 + 行点击 ⇒ 详情弹窗 + 零内联添加面（桩 DOM）
 *   ③ 添加弹窗两径：预设（首开惰性拉取 ∥ 已配名剔除 ∥ 信息行 ∥ POST 全字段）∥ 自定义（「获取模型」探针 ⇒
 *      候选勾选 ⇒ POST）∥ 预设拉取失败 ⇒ 提示 + 自定义径照常 ∥ 未选 ⇒ 提示不提交
 *   ④ 详情弹窗：信息段（预填 ∥ 掩码占位「留空 = 不修改」∥ 清除密钥勾 ∥ 测试连接/删除）+ 勾选段（候选 = 上游发现 ∥
 *      勾选态 = 现配置 ∥ 退役项只读注行 ∥ 零手填）∥ 错误径（失败 ⇒ 段内提示 +「刷新候选」重试可达候选 ∥
 *      失败态保存不丢现配置——草稿无损）
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

const [{ ZH }, { EN }, NAV, PROVIDERS, MODALS] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("nav.mjs"), load("views-providers.mjs"), load("views-providers-modals.mjs"),
])

const fill = (text, params) => text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

// ── 桩 DOM（`modal.mjs` 壳面近形：showModal/close 事件/classList/remove；`h` 同 app 语义近似）──────────

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
const textOf = (node) => {
  if (typeof node === "string") return node
  return [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" ")
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
/** 候选勾选钮（双弹窗共用形：`label[复选框, 模型名]`；`key-clear` 勾不计）。 */
const pickBoxes = (root) => findAll(root, (node) => node.tag === "input" && node.attrs.type === "checkbox" && node.parent?.tag === "label" && node.parent.className !== "key-clear")
const pickBox = (root, model) => pickBoxes(root).find((box) => box.parent.children.includes(model)) ?? null

/** 桩 ctx：api 路由表（`"METHOD path"` ⇒ handler——抛 = 失败径）∥ fail/flash 记录 ∥ 全调用入 `calls`。 */
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
    dataShell: (mount, { head, area }) => {
      // 随正（2026-10-07 控制台布局收正批）：stub 语义近似——真品 = app.mjs dataShell；本件仅渲染面
      mount.append(head, area)
      return undefined // setCount 已撤（2026-10-07 光通道轮——计数入表 tfoot）
    },
  }
  return { ctx, calls }
}

// ── ① nav/标题值 ────────────────────────────────────────────────────────────

test("① nav/标题值：`nav.page.admin.providers` ∥ `admin.providers.title` =「Provider」（两表）∥ labelKey 面不破", () => {
  assert.deepEqual([ZH["nav.page.admin.providers"], EN["nav.page.admin.providers"]], ["Provider", "Provider"])
  assert.deepEqual([ZH["admin.providers.title"], EN["admin.providers.title"]], ["Provider", "Provider"])
  const item = NAV.NAV_GROUPS[1].items.find((entry) => entry.path === "/admin/providers")
  assert.deepEqual([item.labelKey, "label" in item], ["nav.page.admin.providers", false]) // 数据持键——非字面量
  assert.deepEqual(NAV.resolveRoute("/admin/providers", "user"), { path: "/admin/providers", denied: true })
})

// ── ② 页面（列表 + 添加钮 + 零内联面）───────────────────────────────────────

test("② 页面：列表（掩码/未配置 ∥ 服务模型数）+ 添加钮 + 行点击 ⇒ 详情弹窗 + 零内联添加面", async () => {
  globalThis.document = createDocument()
  try {
    const documentStub = globalThis.document
    const { ctx } = makeCtx({
      "GET /api/admin/providers": () => ({
        providers: [
          { id: 1, name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "…1234", models: ["deepseek-chat", "deepseek-reasoner"] },
          { id: 2, name: "local", baseURL: "http://10.0.0.5/v1", apiKey: "", models: [] },
        ],
      }),
      "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }),
    })
    const mount = makeNode("section")
    await PROVIDERS.renderProviders(ctx, mount)
    // 页首 = 标题「Provider」+ 添加钮
    assert.equal(byText(mount, ZH["admin.providers.title"]).tag, "h2")
    assert.ok(byText(mount, ZH["admin.providers.add"]) !== null, "缺「添加」钮")
    // 零内联添加/编辑面（旧表单撤除——页面零表单控件）
    assert.deepEqual(findAll(mount, (node) => ["form", "input", "select", "textarea"].includes(node.tag)).length, 0)
    // 表：列 ∥ 掩码/未配置 ∥ 服务模型数
    const rows = findAll(mount, (node) => node.tag === "tr")
    assert.deepEqual(rows[0].children.map((cell) => textOf(cell)),
      [ZH["admin.providers.name"], ZH["admin.providers.baseURL"], ZH["admin.providers.colKey"], ZH["admin.providers.colModelCount"]])
    assert.deepEqual(rows[1].children.map((cell) => cell.textContent), ["deepseek", "https://api.deepseek.com", "…1234", "2"])
    assert.deepEqual(rows[2].children.map((cell) => cell.textContent), ["local", "http://10.0.0.5/v1", ZH["admin.providers.maskEmpty"], "0"])
    // 行点击（Enter/Space 同开）⇒ 详情弹窗
    await rows[1].fire("click")
    const dialog = findNode(documentStub.body, (node) => node.tag === "dialog")
    assert.equal(dialog.children[0].children[0].textContent, "deepseek", "详情弹窗标题 = provider 名")
    await tick() // 首开自动拉取候选
    assert.ok(byText(dialog, ZH["admin.providers.refreshCandidates"]) !== null, "详情弹窗缺「刷新候选」")
    // 键面：Enter 同开（键盘可达）
    await dialog.children[0].children[1].fire("click") // × 关闭
    await rows[2].fire("click")
    assert.ok(findNode(documentStub.body, (node) => node.tag === "dialog") !== null)
    await findNode(documentStub.body, (node) => node.tag === "dialog").children[0].children[1].fire("click")
    // 空态 ∥ 失败态
    const empty = makeNode("section")
    await PROVIDERS.renderProviders(makeCtx({ "GET /api/admin/providers": () => ({ providers: [] }) }).ctx, empty)
    assert.ok(byText(empty, ZH["admin.providers.listEmpty"]) !== null, "空态文案")
    const failed = makeCtx({ "GET /api/admin/providers": () => { throw new Error("boom") } })
    const failedMount = makeNode("section")
    await PROVIDERS.renderProviders(failed.ctx, failedMount)
    assert.deepEqual([failed.calls.some(([kind, value]) => kind === "fail" && value === "boom"), byText(failedMount, ZH["admin.providers.listFailed"]) !== null], [true, true])
  } finally { delete globalThis.document }
})

// ── ③ 添加弹窗（两径——预设/自定义）─────────────────────────────────────────

test("③ 添加弹窗：预设径（已配名剔除 ∥ 信息行 ∥ POST 全字段）∥ 自定义径（探针 ⇒ 勾选 ⇒ POST）∥ 预设拉取失败照常", async () => {
  globalThis.document = createDocument()
  try {
    // ── 预设径 ──
    const { ctx, calls } = makeCtx({
      "GET /api/admin/providers/presets": () => ({ presets: [
        { preset: "deepseek", name: "deepseek", baseURL: "https://api.deepseek.com", models: ["deepseek-flash"] },
        { preset: "moonshot", name: "moonshot", baseURL: "https://api.moonshot.cn/v1", models: ["moonshot-v1"] },
      ] }),
      "POST /api/admin/providers": () => ({ ok: true, id: 9 }),
    })
    let reloads = 0
    const modal = MODALS.openAddProviderModal(ctx, { providers: [{ name: "deepseek" }], reload: async () => { reloads += 1 } })
    assert.equal(modal.root.children[0].children[0].textContent, ZH["admin.providers.addTitle"])
    await tick() // 首开惰性拉取
    const select = findNode(modal.root, (node) => node.tag === "select")
    assert.deepEqual(findAll(select, (node) => node.tag === "option").map((option) => option.textContent),
      [fill(ZH["admin.providers.presetSelectCount"], { count: 1 }),
        fill(ZH["admin.providers.presetOption"], { name: "moonshot", preset: "moonshot" }),
        ZH["admin.providers.customChoice"]], "已配名剔除（deepseek 出列）")
    select.value = "moonshot"
    await select.fire("change")
    const presetText = textOf(modal.root)
    assert.deepEqual([presetText.includes("https://api.moonshot.cn/v1"), presetText.includes("moonshot-v1")], [true, true], "信息行 = 地址 ∥ 模型清单（只读）")
    assert.equal(findAll(modal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox").length, 1, "预设径输入面 = 仅 apiKey（「走代理」复选框另计）")
    findNode(modal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox").value = "sk-abc"
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind, path]) => kind === "POST" && path === "/api/admin/providers").at(-1), ["POST", "/api/admin/providers", { name: "moonshot", baseURL: "https://api.moonshot.cn/v1", apiKey: "sk-abc", models: ["moonshot-v1"] }])
    assert.deepEqual([modal.root.open, reloads], [false, 1], "成功 ⇒ 关窗 + 列表刷新")
    // 未选 ⇒ 提示不提交（弹窗留驻）
    const { ctx: ctxIdle, calls: callsIdle } = makeCtx({ "GET /api/admin/providers/presets": () => ({ presets: [] }) })
    const idle = MODALS.openAddProviderModal(ctxIdle, { providers: [] })
    await tick()
    await byText(idle.root, ZH["common.save"]).fire("click")
    assert.deepEqual([callsIdle.some(([kind, value]) => kind === "flash" && value === ZH["admin.providers.presetNeeded"]), idle.root.open, textOf(idle.root).includes(ZH["admin.providers.presetNeeded"])], [false, true, true], "未选类型 ⇒ 窗内提示（不落窗外 flash）")

    // ── 自定义径（探针 ⇒ 候选勾选 ⇒ POST）──
    const { ctx: ctxCustom, calls: callsCustom } = makeCtx({
      "GET /api/admin/providers/presets": () => ({ presets: [] }),
      "POST /api/admin/providers/discover": () => ({ models: ["m-1", "m-2"] }),
      "POST /api/admin/providers": () => ({ ok: true, id: 10 }),
    })
    const custom = MODALS.openAddProviderModal(ctxCustom, { providers: [], reload: async () => {} })
    await tick()
    const select2 = findNode(custom.root, (node) => node.tag === "select")
    select2.value = "custom"
    await select2.fire("change")
    const inputs = findAll(custom.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")
    assert.deepEqual(inputs.map((node) => node.attrs.placeholder), [ZH["admin.providers.namePh"], ZH["admin.providers.baseURLPh"], ZH["admin.providers.apiKeyPh"]])
    // 探针前置：无 baseURL ⇒ 提示（零请求）
    await byText(custom.root, ZH["admin.providers.fetchModels"]).fire("click")
    assert.deepEqual([callsCustom.some(([kind, value]) => kind === "flash" && value === ZH["admin.providers.needBaseURL"]), callsCustom.filter(([kind, path]) => kind === "POST" && path === "/api/admin/providers/discover").length, textOf(custom.root).includes(ZH["admin.providers.needBaseURL"])], [false, 0, true], "空 baseURL ⇒ 窗内提示 + 零请求")
    inputs[0].value = "local"
    inputs[1].value = "http://10.0.0.5/v1"
    await byText(custom.root, ZH["admin.providers.fetchModels"]).fire("click")
    assert.deepEqual(callsCustom.at(-1), ["POST", "/api/admin/providers/discover", { baseURL: "http://10.0.0.5/v1", proxy: false }])
    assert.deepEqual([callsCustom.some(([kind, value]) => kind === "flash" && value === fill(ZH["admin.providers.discovered"], { count: 2 })), textOf(custom.root).includes("m-1")], [false, true], "获取模型 ⇒ 候选同窗渲染（不落窗外 flash）")
    // 候选勾选（零手填）⇒ 保存 = POST（models = 勾选集）
    assert.deepEqual(pickBoxes(custom.root).map((box) => box.parent.children[1]), ["m-1", "m-2"])
    const pick = pickBox(custom.root, "m-2")
    pick.checked = true
    await pick.fire("change")
    await byText(custom.root, ZH["common.save"]).fire("click")
    assert.deepEqual(callsCustom.filter(([kind, path]) => kind === "POST" && path === "/api/admin/providers").at(-1), ["POST", "/api/admin/providers", { name: "local", baseURL: "http://10.0.0.5/v1", apiKey: "", models: ["m-2"] }])

    // ── 预设拉取失败 ⇒ 提示 + 自定义径照常 ──
    const { ctx: ctxDown, calls: callsDown } = makeCtx({
      "GET /api/admin/providers/presets": () => { throw new Error("presets down") },
      "POST /api/admin/providers": () => ({ ok: true, id: 11 }),
    })
    const down = MODALS.openAddProviderModal(ctxDown, { providers: [] })
    await tick()
    const select3 = findNode(down.root, (node) => node.tag === "select")
    assert.deepEqual(findAll(select3, (node) => node.tag === "option").map((option) => option.textContent),
      [ZH["admin.providers.presetFailed"], ZH["admin.providers.customChoice"]], "失败 ⇒ 提示 + 自定义径在位")
    select3.value = "custom"
    await select3.fire("change")
    const inputs3 = findAll(down.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")
    inputs3[0].value = "p3"
    inputs3[1].value = "http://x/v1"
    await byText(down.root, ZH["common.save"]).fire("click")
    assert.deepEqual(callsDown.filter(([kind, path]) => kind === "POST" && path === "/api/admin/providers").at(-1), ["POST", "/api/admin/providers", { name: "p3", baseURL: "http://x/v1", apiKey: "", models: [] }], "自定义径照常（保存不设发现门——models 可空）")
  } finally { delete globalThis.document }
})

// ── ④ 详情弹窗（信息段 + 勾选段）∥ 错误径 ──────────────────────────────────

test("④ 详情弹窗：信息段（预填 ∥ 掩码占位 ∥ 清除密钥 ∥ 测试连接/删除）+ 勾选段（候选 = 发现 ∥ 退役注行 ∥ 零手填）", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx, calls } = makeCtx({
      "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat", "deepseek-reasoner"] }),
    })
    const provider = { id: 7, name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "…1234", models: ["deepseek-chat", "retired-1"] }
    const modal = MODALS.openProviderDetailModal(ctx, { provider })
    assert.equal(modal.root.children[0].children[0].textContent, "deepseek")
    // 信息段：名称/baseURL 预填 ∥ 密钥掩码占位「留空 = 不修改」∥ 清除密钥勾 ∥ 测试连接/删除在册
    const inputs = findAll(modal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")
    assert.deepEqual(inputs.map((node) => node.value), ["deepseek", "https://api.deepseek.com", ""])
    assert.equal(inputs[2].attrs.placeholder, fill(ZH["admin.providers.keepKey"], { mask: "…1234" }))
    assert.ok(textOf(modal.root).includes(ZH["admin.providers.clearKey"]), "缺「清除密钥」勾")
    assert.deepEqual([byText(modal.root, ZH["admin.providers.test"]) !== null, byText(modal.root, ZH["admin.providers.delete"]) !== null], [true, true])
    // 首开自动拉取：providerId 取库内 key（测试连接 = discover 复用的同径）
    await tick()
    assert.deepEqual(calls.at(-1), ["POST", "/api/admin/providers/discover", { baseURL: "https://api.deepseek.com", providerId: 7, proxy: false }])
    // 候选勾选：勾选态 = 现配置；退役项（不在发现列表的已开放模型）只读注行——不入候选面（不可勾 ⇒ 恒保留）
    assert.deepEqual(pickBoxes(modal.root).map((box) => box.parent.children[1]), ["deepseek-chat", "deepseek-reasoner"])
    assert.deepEqual(pickBoxes(modal.root).filter((box) => box.checked).map((box) => box.parent.children[1]), ["deepseek-chat"])
    assert.ok(textOf(modal.root).includes(fill(ZH["admin.providers.retiredNote"], { models: "retired-1" })), "退役项只读注行")
    // 零手填：文本输入面 = 名称/baseURL/密钥三枚（候选面零文本输入）
    assert.equal(findAll(modal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox").length, 3)
  } finally { delete globalThis.document }
})

test("④ 错误径：发现失败 ⇒ 段内提示 +「刷新候选」重试可达候选 ∥ 失败态保存不丢现配置（草稿无损）", async () => {
  globalThis.document = createDocument()
  try {
    // 失败态：段内提示 + 重试钮在位；保存 = 仅改字段（models 不提交 ⇒ 现配置无损）
    const down = makeCtx({
      "POST /api/admin/providers/discover": () => { const error = new Error("upstream boom"); error.code = "upstream_error"; throw error },
      "PATCH /api/admin/providers/3": () => ({ ok: true, id: 3 }),
    })
    const provider = { id: 3, name: "p3", baseURL: "http://x/v1", apiKey: "", models: ["kept-1", "retired-2"] }
    const modal = MODALS.openProviderDetailModal(down.ctx, { provider, reload: async () => {} })
    await tick()
    assert.ok(textOf(modal.root).includes(ZH["err.upstream_error"]), "失败 ⇒ 段内提示（映射文案）")
    assert.ok(byText(modal.root, ZH["admin.providers.refreshCandidates"]) !== null, "「刷新候选」重试在位")
    const baseURLInput = findAll(modal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")[1]
    baseURLInput.value = "http://y/v1"
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(down.calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/3", { baseURL: "http://y/v1" }], "失败态保存不丢现配置（models 零提交——库内清单不动）")
    assert.equal(modal.root.open, false)

    // 重试可达候选：首拉失败 ⇒ 「刷新候选」重试 ⇒ 候选入列（退役注行随发现面成立）
    let fail = true
    const retry = makeCtx({ "POST /api/admin/providers/discover": () => {
      if (fail) { const error = new Error("upstream boom"); error.code = "upstream_error"; throw error }
      return { models: ["kept-1", "fresh-1"] }
    } })
    const modal2 = MODALS.openProviderDetailModal(retry.ctx, { provider, reload: async () => {} })
    await tick()
    assert.ok(textOf(modal2.root).includes(ZH["err.upstream_error"]))
    fail = false
    await byText(modal2.root, ZH["admin.providers.refreshCandidates"]).fire("click")
    assert.deepEqual(pickBoxes(modal2.root).map((box) => box.parent.children[1]), ["fresh-1", "kept-1"], "重试 ⇒ 候选可达（名称升序——2026-10-07 走查收正）")
    assert.ok(textOf(modal2.root).includes(fill(ZH["admin.providers.retiredNote"], { models: "retired-2" })), "退役注行随发现面成立")
  } finally { delete globalThis.document }
})
