/**
 * 2026-10-07-mcp-kv-input.test.mjs — 批内件（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036 · 批档 §2 测试面）。
 *
 * 四腿：
 *   L1 桌面构树（`mcpBody` 平 node 描述符树）：逗号保真 ∥ 零项零行 + 添加钮在场 ∥ 加删 handler 绑定 ∥ 行 id 唯一。
 *   L2 桌面出口（`createMcpExits` + 真 DOM ∥ FormData）：加 +1 ∥ 删 −1（定点）∥ 令牌不复用 ∥ 配对四态
 *      （逗号值 ∥ 空行丢 ∥ 重复后胜 ∥ 全空 ⇒ 字段删）。
 *   L3 VSC 真 webview（happy-dom）：加 ∥ 删 ∥ 保存载荷含逗号 ∥ 预填—保存互逆。
 *   L4 源扫（词面）：四新键 × 两端 × 两语在场 ∥ 标签值 = 约定值 ∥「comma-separated ∥ 逗号分隔」零残留
 *      （扫描面 = VSC `webview/**` + `locales/**`、桌面 `renderer/**`——CLI ∕ 记录面 ∕ 产物面不在面）。
 *
 * 跑法（自仓根 thincoder/）：`node --test docs/batches/2026-10-07-mcp-kv-input.test.mjs`
 * 纪律：平 node · 零网络 · 零第三方新增（happy-dom = 仓内既有 devDep，实读在盘）；随批留存 · 不进仓套件
 * （VSC `test/files.mjs` 清单 = 空 ∕ 桌面 `test/` 零涉）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
// tmp 直跑适配（`add-dialog-verify/` 深度 3）：两候选根取命中——原位（depth 2）∥ tmp 两处皆兼容
const ROOT = [resolve(HERE, "..", ".."), resolve(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-desktop")))
const rel = (p) => join(ROOT, p)
const mod = (p) => import(pathToFileURL(rel(p)).href)
const src = (p) => readFileSync(rel(p), "utf8")

// ─── 桌面 `/rc/` 解析钩子（渲染档取件——须先于桌面验收面模块装载）────────────────────────
await mod("thincoder-desktop/test/rc-resolve.mjs")

const dom = await mod("thincoder-desktop/renderer/dom.mjs")
const deskI18n = await mod("thincoder-desktop/renderer/i18n.mjs")
const mcpView = await mod("thincoder-desktop/renderer/views/settings-sections-mcp.mjs")
const mcpExits = await mod("thincoder-desktop/renderer/mount-settings-segments-mcp.mjs")

// ─── happy-dom 真 DOM（实读在盘：`thincoder-vscode/node_modules/@happy-dom/**`——沿批内件先例）──
const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {} // happy-dom 缺项垫片

const vscMcp = await mod("thincoder-vscode/webview/settings-mcp.js")
const vscMcpDialog = await mod("thincoder-vscode/webview/settings-mcp-dialog.js")

// ─── 共用夹具 ─────────────────────────────────────────────────────────────────────────────

const DEP = { reasonWord: (reason) => String(reason ?? "") }

/** 描述符树展平（含 `null` / 裸串过滤）。 */
function flat(node, out = []) {
  if (node === null || node === undefined) return out
  if (Array.isArray(node)) { for (const item of node) flat(item, out); return out }
  if (typeof node !== "object" || typeof node.tag !== "string") return out
  out.push(node)
  const children = node.children === null || node.children === undefined ? [] : Array.isArray(node.children) ? node.children : [node.children]
  for (const child of children) flat(child, out)
  return out
}

/** MCP 表单树（`state = ready` ∥ 弹窗体分支 —— KD-77 ①：表单只住 `mcpFormBody`）。 */
const bodyOf = (form) => flat(mcpView.mcpFormBody({ state: "ready", servers: [], details: {}, form }, {}))

/** 表单元素（真视图描述符树 + 真 `dom.build`——两个宿主共用；表单树 = `mcpFormBody`）。 */
function formEl(form, handlers = {}) {
  const nodes = mcpView.mcpFormBody({ state: "ready", servers: [], details: {}, form }, handlers)
  return dom.build(nodes.find((n) => n?.props?.["data-form"] === "mcp"))
}

/** 桌面表单挂载（**页宿主**：设置槽内——清空既有 DOM）。 */
function mountForm(form, handlers = {}) {
  document.body.innerHTML = `<div data-slot="settings"><div id="mcp-host"></div></div>`
  const el = formEl(form, handlers)
  document.getElementById("mcp-host").append(el)
  return el
}

/** 桌面表单追加（**弹窗宿主**：`body` 尾——不改既有 DOM，沿 `settings-modal.mjs` 挂法）。 */
function appendForm(form, handlers = {}) {
  const el = formEl(form, handlers)
  document.body.append(el)
  return el
}

/** 桌面出口车具：假 store ∥ ask 录（真 DOM 行集读取面 = happy-dom）。 */
function harness(form, servers = []) {
  const calls = { ask: [], set: [], reports: [] }
  let state = { settings: { mcp: { form, servers } } }
  const exits = mcpExits.createMcpExits({
    ask: async (channel, payload) => { calls.ask.push({ channel, payload }); return { ok: true } },
    store: { get: () => state },
    setSettings: (patch) => { calls.set.push(patch); state = { ...state, settings: { ...state.settings, ...patch } } },
    report: (...args) => calls.reports.push(args),
    clearReport: () => {},
    reads: { loadMcp: async () => {} },
    slot: '[data-slot="settings"]',
    formOf: (event) => event?.currentTarget?.closest?.("form") ?? null,
    invalidateDrafts: () => {},
    openModal: () => true, closeModal: () => {}, // KD-77 ①：`onMcpEdit` 开径 = 先开弹窗后写 form（缺件 ⇒ 零写）
  })
  return { exits, calls, form: () => state.settings.mcp.form }
}

// ─── L1 · 桌面构树（平 node）──────────────────────────────────────────────────────────────

test("L1-1 桌面构树：env 行集回显逗号保真（值 = 字面）；组按型渲染", () => {
  const nodes = bodyOf({ editing: "srv", type: "stdio", kv: { env: [{ t: 1, k: "KEY", v: "va,lue" }, { t: 2, k: "B", v: "x=y" }], headers: [], wsHeaders: [] } })
  const envRows = nodes.filter((n) => n.props?.["data-kv-row"] === "env")
  assert.equal(envRows.length, 2, "env 两行在场")
  const values = nodes.filter((n) => n.props?.["data-kv-part"] === "v").map((n) => n.props.value)
  assert.deepEqual(values, ["va,lue", "x=y"], "值 = 字面（逗号 ∥ 等号原样——零剥离）")
  assert.deepEqual(nodes.filter((n) => n.props?.["data-kv-part"] === "k").map((n) => n.props.value), ["KEY", "B"], "键同行序")
  assert.equal(nodes.filter((n) => n.props?.["data-kv-row"] === "headers").length, 0, "他组零行（按型渲染）")
  assert.equal(nodes.filter((n) => n.props?.["data-kv-row"] === "wsHeaders").length, 0, "ws 组零行")
  assert.equal(nodes.filter((n) => n.props?.["data-kv-group"] === "env").length, 1, "本组添加钮恰一")
  const httpNodes = bodyOf({ editing: "srv", type: "http", kv: { env: [], headers: [{ t: 3, k: "A", v: "1" }], wsHeaders: [] } })
  assert.equal(httpNodes.filter((n) => n.props?.["data-kv-row"] === "headers").length, 1, "http ⇒ headers 组")
  assert.equal(httpNodes.filter((n) => n.props?.["data-kv-group"] === "headers").length, 1, "http 添加钮组标")
  const wsNodes = bodyOf({ editing: "srv", type: "ws", kv: { env: [], headers: [], wsHeaders: [{ t: 4, k: "W", v: "2" }] } })
  assert.equal(wsNodes.filter((n) => n.props?.["data-kv-row"] === "wsHeaders").length, 1, "ws ⇒ wsHeaders 组")
  console.log(`[读数] L1-1: env 行=2 值=${JSON.stringify(values)} · http/ws 组另判 ✓`)
})

test("L1-2 桌面构树：零项 ⇒ 零行 + 添加钮恒在场（form 缺 ∥ kv 缺 ∥ 空表三形）", () => {
  for (const form of [null, { editing: null, type: "stdio" }, { editing: null, type: "stdio", kv: { env: [], headers: [], wsHeaders: [] } }]) {
    const nodes = bodyOf(form)
    assert.equal(nodes.filter((n) => n.props?.["data-kv-row"] !== undefined).length, 0, `零项 ⇒ 零行（${JSON.stringify(form)}）`)
    const add = nodes.filter((n) => n.props?.["data-kv-group"] === "env")
    assert.equal(add.length, 1, "添加钮在场（stdio 组）")
    assert.equal(add[0].props["data-action"], "settings:mcpKvAdd", "锚名 = 视图 `data-action` 同域")
  }
  console.log("[读数] L1-2: 三形零行 ✓ · 添加钮恒一")
})

test("L1-3 桌面构树：加删 handler 绑定（有 ⇒ onClick 函数 ∥ 缺 ⇒ disabled 诚实非死控）", () => {
  const form = { editing: "srv", type: "stdio", kv: { env: [{ t: 5, k: "A", v: "1" }], headers: [], wsHeaders: [] } }
  const wired = bodyOf(form)[0] && flat(mcpView.mcpFormBody({ state: "ready", servers: [], details: {}, form }, { onMcpKvAdd: () => {}, onMcpKvRemove: () => {} }))
  const addBtn = wired.find((n) => n.props?.["data-kv-group"] === "env")
  const delBtn = wired.find((n) => n.props?.["data-action"] === "settings:mcpKvRemove")
  assert.equal(typeof addBtn.props.onClick, "function", "添加钮已接线")
  assert.equal(typeof delBtn.props.onClick, "function", "移除钮已接线")
  assert.equal("disabled" in addBtn.props, false, "接线面零 disabled")
  assert.equal(delBtn.props["aria-label"], deskI18n.t("settings.mcp.kvRemove"), "移除钮可及名 = 词键解析值（键已注册）")
  assert.notEqual(deskI18n.t("settings.mcp.kvRemove"), "settings.mcp.kvRemove", "词键在册（非键名直传）")
  const bare = bodyOf(form)
  const bareAdd = bare.find((n) => n.props?.["data-kv-group"] === "env")
  const bareDel = bare.find((n) => n.props?.["data-action"] === "settings:mcpKvRemove")
  assert.equal(bareAdd.props.disabled, true, "缺 handlers ⇒ disabled")
  assert.equal(bareDel.props.disabled, true, "缺 handlers ⇒ ✕ disabled")
  console.log("[读数] L1-3: 两钮两态 ✓")
})

test("L1-4 桌面构树：行 id 唯一 ∥ 命名 = `mcp-<group>-<k|v>-<t>` ∥ 两格携 data-draft", () => {
  const form = { editing: "srv", type: "stdio", kv: { env: [{ t: 1, k: "A", v: "1" }, { t: 2, k: "B", v: "2" }, { t: 3, k: "C", v: "3" }], headers: [], wsHeaders: [] } }
  const nodes = bodyOf(form)
  const ids = nodes.filter((n) => n.props?.["data-kv-part"] !== undefined).map((n) => n.props.id)
  assert.equal(ids.length, 6, "三行 × 两格")
  assert.equal(new Set(ids).size, ids.length, "行 id 唯一")
  assert.deepEqual(ids, ["mcp-env-k-1", "mcp-env-v-1", "mcp-env-k-2", "mcp-env-v-2", "mcp-env-k-3", "mcp-env-v-3"], "命名 = `mcp-<group>-<k|v>-<t>`")
  assert.deepEqual(nodes.filter((n) => n.props?.name === "env-k").length, 3, "FormData 载荷键 = `<group>-k`")
  const draftMarks = nodes.filter((n) => n.props?.["data-kv-part"] !== undefined && n.props["data-draft"] === "")
  assert.equal(draftMarks.length, 6, "两格皆申报草稿（#604 捕获域）")
  const editNodes = flat(mcpView.mcpFormBody({ state: "ready", servers: [], details: {}, form: { editing: null, type: "stdio", kv: { env: [], headers: [], wsHeaders: [] } } }, {}))
  const nonRow = editNodes.filter((n) => n.props?.["data-draft"] === "" && n.props?.["data-kv-part"] === undefined).map((n) => n.props.id)
  assert.deepEqual(nonRow, ["mcp-name", "mcp-command", "mcp-args"], "非行控件同携（保输入链下半 = 草稿闸按 id 复填）")
  console.log(`[读数] L1-4: ${ids.length} id 唯一 ✓ · data-draft 行件 6 ∥ 非行 ${nonRow.length} ✓`)
})

// ─── L2 · 桌面出口（真 DOM + FormData）────────────────────────────────────────────────────

test("L2-1 桌面出口：加 ⇒ 行 +1（令牌新号）∥ 删 ⇒ 行 −1（定点）∥ 令牌不复用 ∥ 表外令牌零写", async () => {
  // 编辑态开表单（令牌自分配器取号——真实面：条目 config → `kvStateFrom`）
  const h = harness(null, [{ name: "srv", config: { command: "npx", env: { A: "1" } } }])
  h.exits.handlers.onMcpEdit("srv")
  const seed = h.form()
  assert.equal(seed.kv.env.length, 1, "编辑态：条目 config 逐项一行")
  const seedToken = seed.kv.env[0].t
  mountForm(seed, h.exits.handlers)
  document.querySelector('[data-action="settings:mcpKvAdd"]').click()
  const added = h.form().kv.env
  assert.equal(added.length, 2, "加 ⇒ 尾附一空行")
  assert.deepEqual({ k: added[1].k, v: added[1].v }, { k: "", v: "" }, "新行两格空")
  assert.ok(added[1].t > seedToken, `令牌新号（${added[1].t} > ${seedToken}）`)
  assert.deepEqual(added[0], { t: seedToken, k: "A", v: "1" }, "存量行不动（DOM 自读保真）")
  // 删（定点 seedToken）——重挂后 DOM ≡ 切片
  mountForm(h.form(), h.exits.handlers)
  document.querySelector('[data-kv-row="env"] [data-action="settings:mcpKvRemove"]').click()
  const afterRemove = h.form().kv.env
  assert.deepEqual(afterRemove.map((r) => r.t), [added[1].t], "删 ⇒ 摘该行（他行令牌不动）")
  // 表外令牌 ⇒ 零写
  const before = JSON.stringify(h.form())
  mountForm(h.form(), h.exits.handlers)
  h.exits.handlers.onMcpKvRemove("env", seedToken)
  assert.equal(JSON.stringify(h.form()), before, "表外令牌 ⇒ 零变化 ⇒ 零写")
  // 再加 ⇒ 令牌 > 前发全部（永不复用）
  mountForm(h.form(), h.exits.handlers)
  document.querySelector('[data-action="settings:mcpKvAdd"]').click()
  const tokens = h.form().kv.env.map((r) => r.t)
  assert.deepEqual(tokens.slice(0, 1), [added[1].t], "存行令牌不动（删后复加）")
  assert.ok(tokens[1] > added[1].t, `新行令牌 > 前发全部（${tokens[1]} > ${added[1].t}——永不复用）`)
  console.log(`[读数] L2-1: 加 ${added[1].t} · 删 ${seedToken} · 复加 ${tokens[1]}（复用 = 0）`)
})

test("L2-2 桌面出口 · 类型切换：当前组同拍同步（切换不丢手）", () => {
  const h = harness({ editing: "srv", type: "stdio", kv: { env: [{ t: 11, k: "A", v: "1" }], headers: [], wsHeaders: [] } })
  mountForm(h.form(), h.exits.handlers)
  const row = document.querySelector('[data-kv-row="env"]')
  row.querySelector('[data-kv-part="k"]').value = "TYPED"
  row.querySelector('[data-kv-part="v"]').value = "va,lue"
  h.exits.handlers.onMcpFormType("http")
  assert.equal(h.form().type, "http", "类型随切")
  assert.deepEqual(h.form().kv.env, [{ t: 11, k: "TYPED", v: "va,lue" }], "切换前自读 DOM 行集 ⇒ 落切片（值含逗号原样）")
  assert.deepEqual(h.form().kv.headers, [], "新组空表（零假造）")
  console.log(`[读数] L2-2: env=${JSON.stringify(h.form().kv.env)} · type=http`)
})

test("L2-3 桌面出口 · 配对四态：逗号值 ∥ 空行丢 ∥ 重复后胜 ∥ 全空 ⇒ 字段删", async () => {
  const kv = {
    env: [{ t: 20, k: "KEY", v: "va,lue" }, { t: 21, k: "", v: "orphan" }, { t: 22, k: "DUP", v: "1" }, { t: 23, k: "DUP", v: "2" }, { t: 24, k: "EMPTYV", v: "" }],
    headers: [], wsHeaders: [],
  }
  const h = harness({ editing: null, type: "stdio", kv })
  mountForm(h.form(), h.exits.handlers)
  document.getElementById("mcp-name").value = "srv2"
  document.getElementById("mcp-command").value = "npx"
  await h.exits.handlers.onAddMcp({ currentTarget: document.querySelector('[data-action="settings:addMcp"]') })
  const sent = h.calls.ask.filter((c) => c.channel === "mcp:save").pop()
  assert.ok(sent !== undefined, "`mcp:save` 已发")
  assert.deepEqual(sent.payload, { name: "srv2", config: { command: "npx", args: [], env: { KEY: "va,lue", DUP: "2" } } }, "四态同判：逗号值 ∥ 空键 ∥ 空值行丢 ∥ 重复后行胜")
  // 全空 ⇒ 字段键缺席（清空 = 删除——沿现判）
  const h2 = harness({ editing: null, type: "stdio", kv: { env: [{ t: 30, k: "", v: "" }], headers: [], wsHeaders: [] } })
  mountForm(h2.form(), h2.exits.handlers)
  document.getElementById("mcp-name").value = "srv3"
  document.getElementById("mcp-command").value = "npx"
  await h2.exits.handlers.onAddMcp({ currentTarget: document.querySelector('[data-action="settings:addMcp"]') })
  const sent2 = h2.calls.ask.filter((c) => c.channel === "mcp:save").pop()
  assert.equal("env" in sent2.payload.config, false, "全空 ⇒ `env` 键缺席")
  // 落盘形零改：载荷仍 `{ name, config }`
  assert.deepEqual(Object.keys(sent2.payload).sort(), ["config", "name"], "载荷形零改")
  console.log(`[读数] L2-3: env=${JSON.stringify(sent.payload.config.env)} · 全空形=${JSON.stringify(sent2.payload.config)}`)
})

test("L2-4 桌面出口 · 弹窗宿主（槽外）：加 ∥ 删仍在场 ∥ 两宿主并存 ⇒ 读文档序末位（组弹窗体）", () => {
  // 菜单「组弹窗」径：页闭（槽内零子节点）+ 弹窗体挂 `body` 尾（`settings-modal.mjs` 挂法）
  const h = harness({ editing: null, type: "stdio", kv: { env: [], headers: [], wsHeaders: [] } })
  document.body.innerHTML = `<div data-slot="settings"></div>`
  appendForm(h.form(), h.exits.handlers)
  document.querySelector('[data-action="settings:mcpKvAdd"]').click()
  assert.equal(h.form().kv.env.length, 1, "槽外表单：加 ⇒ 行 +1（修前 = 零写死钮——槽作用域读不到弹窗体）")
  document.body.innerHTML = `<div data-slot="settings"></div>`
  appendForm(h.form(), h.exits.handlers)
  document.querySelector('[data-action="settings:mcpKvRemove"]').click()
  assert.equal(h.form().kv.env.length, 0, "槽外表单：删 ⇒ 行 −1")
  // 两宿主并存（页体在槽内 ∥ 弹窗体在 body 尾）：读面 = 文档序末位
  const h2 = harness({ editing: "srv", type: "stdio", kv: { env: [{ t: 71, k: "MODAL", v: "m" }], headers: [], wsHeaders: [] } })
  document.body.innerHTML = `<div data-slot="settings"><div id="mcp-host"></div></div>`
  document.getElementById("mcp-host").append(formEl({ editing: "srv", type: "stdio", kv: { env: [{ t: 99, k: "PAGE", v: "p" }], headers: [], wsHeaders: [] } }, h2.exits.handlers))
  appendForm(h2.form(), h2.exits.handlers)
  const last = [...document.querySelectorAll('[data-form="mcp"]')].pop()
  last.querySelector('[data-kv-part="v"]').value = "m,v"
  last.querySelector('[data-action="settings:mcpKvAdd"]').click()
  assert.deepEqual(h2.form().kv.env.map((r) => r.k), ["MODAL", ""], "读面 = 文档序末位（弹窗体）——页体行不得混入")
  assert.equal(h2.form().kv.env[0].v, "m,v", "弹窗体键入值保真")
  console.log(`[读数] L2-4: 单宿主加/删 ✓（1 ⇒ 0）· 双宿主读末位 ✓（rows=${JSON.stringify(h2.form().kv.env.map((r) => [r.k, r.v]))}）`)
})

// ─── L3 · VSC 真 webview（happy-dom）───────────────────────────────────────────────────────

test("L3-1 VSC 真 webview：加行 ∥ 保存载荷含逗号（`KEY=va,lue` 不坏）", () => {
  const posts = []
  window._vscode = { postMessage: (m) => posts.push(m) }
  window._mcpServers = []
  window._confirmSecretDelete = () => {}
  document.body.innerHTML = `<div id="mcp-list"></div><button id="mcp-add-btn"></button>`
  vscMcp.bindMcpControls()
  vscMcpDialog.openMcpDialog(null)
  assert.ok(document.getElementById("mcp-dialog") !== null, "弹窗在场（表单入框 —— KD-77 ①）")
  assert.ok(document.getElementById("mcp-form") !== null, "表单在框体")
  assert.equal(document.querySelectorAll("[data-kv-row]").length, 0, "零项 ⇒ 零行")
  document.querySelector('[data-kv-add="env"]').click()
  assert.equal(document.querySelectorAll('[data-kv-row="env"]').length, 1, "加行 ⇒ 尾附一空行")
  const row = document.querySelector('[data-kv-row="env"]')
  row.querySelector('[data-kv-part="k"]').value = "KEY"
  row.querySelector('[data-kv-part="v"]').value = "va,lue"
  document.getElementById("mcp-name").value = "srv"
  document.getElementById("mcp-command").value = "npx"
  posts.length = 0
  document.getElementById("mcp-save-btn").click()
  const msg = posts.find((m) => m.type === "saveMcpServer")
  assert.ok(msg !== undefined, "`saveMcpServer` 已发")
  assert.deepEqual(msg, { type: "saveMcpServer", name: "srv", config: { command: "npx", args: [], env: { KEY: "va,lue" } } }, "载荷含逗号值逐字")
  console.log(`[读数] L3-1: env=${JSON.stringify(msg.config.env)}`)
})

test("L3-2 VSC 真 webview：删行 ∥ 预填—保存互逆（零修改保存 ⇒ 载荷与现值同）", () => {
  const posts = []
  window._vscode = { postMessage: (m) => posts.push(m) }
  window._mcpServers = []
  window._confirmSecretDelete = () => {}
  document.body.innerHTML = `<div id="mcp-list"></div><button id="mcp-add-btn"></button>`
  vscMcp.bindMcpControls()
  // 预填 ∥ 删
  vscMcpDialog.openMcpDialog({ name: "srv", command: "npx", env: { A: "1", B: "va,lue" } })
  let rows = document.querySelectorAll('[data-kv-row="env"]')
  assert.equal(rows.length, 2, "预填 = 逐项一行（插入序）")
  assert.deepEqual([...rows].map((r) => r.querySelector('[data-kv-part="v"]').value), ["1", "va,lue"], "值 = 字面")
  rows[0].querySelector("[data-kv-del]").click()
  rows = document.querySelectorAll('[data-kv-row="env"]')
  assert.equal(rows.length, 1, "✕ ⇒ 摘该行")
  assert.equal(rows[0].querySelector('[data-kv-part="k"]').value, "B", "余行不动")
  posts.length = 0
  document.getElementById("mcp-save-btn").click()
  const edit = posts.find((m) => m.type === "editMcp")
  assert.deepEqual(edit.config.env, { B: "va,lue" }, "删后保存 ⇒ 载荷 = 余行")
  // 预填—保存互逆（零修改 ⇒ 载荷与现值同）
  vscMcpDialog.openMcpDialog({ name: "srv", command: "npx", env: { A: "1", B: "va,lue" } })
  posts.length = 0
  document.getElementById("mcp-save-btn").click()
  const again = posts.find((m) => m.type === "editMcp")
  assert.deepEqual(again.config.env, { A: "1", B: "va,lue" }, "read(render(cfg)) ≡ cfg（序保持 ∥ 值逐字）")
  // 全空 ⇒ 该字段不设（清空 = 删项）
  vscMcpDialog.openMcpDialog({ name: "srv", command: "npx", env: { A: "1" } })
  document.querySelector('[data-kv-row="env"] [data-kv-del]').click()
  posts.length = 0
  document.getElementById("mcp-save-btn").click()
  const empty = posts.find((m) => m.type === "editMcp")
  assert.equal("env" in empty.config, false, "全空 ⇒ config 不带 env 键")
  console.log(`[读数] L3-2: 删后=${JSON.stringify(edit.config.env)} · 零改保存=${JSON.stringify(again.config.env)} · 全空键缺席 ✓`)
})

test("L3-3 VSC 真 webview：三型组切换 ∥ 零项零行（三组）", () => {
  const posts = []
  window._vscode = { postMessage: (m) => posts.push(m) }
  window._mcpServers = []
  window._confirmSecretDelete = () => {}
  document.body.innerHTML = `<div id="mcp-list"></div><button id="mcp-add-btn"></button>`
  vscMcp.bindMcpControls()
  vscMcpDialog.openMcpDialog(null)
  assert.equal(document.querySelectorAll('[data-kv-add]').length, 3, "三组各一添加钮")
  for (const group of ["env", "headers", "ws-headers"]) {
    assert.equal(document.querySelectorAll(`[data-kv-row="${group}"]`).length, 0, `${group} 零项零行`)
  }
  // http 组加行 ⇒ 摘
  document.querySelector('[data-kv-add="headers"]').click()
  assert.equal(document.querySelectorAll('[data-kv-row="headers"]').length, 1, "headers 组加行")
  document.querySelector('[data-kv-row="headers"] [data-kv-del]').click()
  assert.equal(document.querySelectorAll('[data-kv-row="headers"]').length, 0, "headers 组删行")
  console.log("[读数] L3-3: 三钮三组 ✓ · 加删往返零残")
})

// ─── L4 · 源扫（词面）────────────────────────────────────────────────────────────────────

const KV_WORDS = { kvAdd: { en: "+ Add row", zh: "+ 添加行" }, kvRemove: { en: "Remove row", zh: "删除行" }, kvKey: { en: "KEY", zh: "KEY" }, kvValue: { en: "value", zh: "值" } }

test("L4-1 源扫：四新键 × 两端 × 两语在场 ∥ 词值 = 约定值 ∥ 两值改落", async () => {
  const en = JSON.parse(src("thincoder-vscode/locales/en.json"))
  const zh = JSON.parse(src("thincoder-vscode/locales/zh.json"))
  const { VIEWS_DICT } = await mod("thincoder-desktop/renderer/i18n-views.mjs")
  const ends = [["VSC-en", en], ["VSC-zh", zh], ["桌面-en", VIEWS_DICT.en], ["桌面-zh", VIEWS_DICT.zh]]
  for (const [label, dict] of ends) {
    const lang = label.endsWith("zh") ? "zh" : "en"
    for (const [name, words] of Object.entries(KV_WORDS)) {
      assert.equal(dict[`settings.mcp.${name}`], words[lang], `${label} settings.mcp.${name}`)
    }
    const env = lang === "en" ? "Env" : "环境变量"
    const headers = lang === "en" ? "Headers" : "请求头"
    assert.equal(dict["settings.mcp.env"], env, `${label} env 值改`)
    assert.equal(dict["settings.mcp.headers"], headers, `${label} headers 值改`)
  }
  console.log(`[读数] L4-1: 四键 × 4 词面 ✓ · env/headers 值改 ✓（VSC ${Object.keys(en).length} 键 ∥ 桌面 VIEWS_DICT 两语同拍）`)
})

test("L4-2 源扫：`comma-separated` ∥ `逗号分隔` 零残留（面 = VSC webview/** + locales/**、桌面 renderer/**）", () => {
  const SKIP = new Set(["node_modules", ".git", ".thincoder", "dist", "dist-r3", "dist-r4", "out", "build", "coverage"])
  const EXT = /\.(js|mjs|cjs|json|css|html)$/
  const hits = []
  let files = 0
  const walk = (rel0) => {
    for (const entry of readdirSync(rel(rel0), { withFileTypes: true })) {
      const child = `${rel0}/${entry.name}`
      if (entry.isDirectory()) {
        if (SKIP.has(entry.name)) continue
        walk(child)
      } else if (EXT.test(entry.name) && statSync(rel(child)).isFile()) {
        files += 1
        const text = readFileSync(rel(child), "utf8")
        if (/comma-separated|逗号分隔/.test(text)) hits.push(child)
      }
    }
  }
  for (const face of ["thincoder-vscode/webview", "thincoder-vscode/locales", "thincoder-desktop/renderer"]) walk(face)
  assert.ok(files > 20, `扫描面非空（防空集假绿——实读 ${files} 档）`)
  assert.deepEqual(hits, [], `零残留（扫描 ${files} 档）`)
  console.log(`[读数] L4-2: 扫描 ${files} 档 · 命中 ${hits.length}`)
})
