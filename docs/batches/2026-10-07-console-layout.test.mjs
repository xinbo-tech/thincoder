/**
 * 2026-10-07-console-layout.test.mjs — thincoder-server 批内单测件（控制台布局收正·AC-20 机检载体；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-console-layout.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §2.6 ∥ §6 AC-20 两行 + 本批档 §2；腿 ↔ 判据对照在括号）：
 *   腿 A（壳机制源扫——§2.6②）：`app.mjs`——`dataShell` 三件构建 + `common.rowCount` 引用 ∥ `SHELL_PAGES` 五路径逐条钉表 ∥
 *      `route()` 切换 `data-shell`（登录径清除）∥ `viewCtx` 注入 ∥ 五页逐档 `ctx.dataShell(` + 取数渲染后 `setCount(`（空/错 = 0）
 *   腿 B（CSS 声明扫描——§2.6②）：高度链声明表逐条 ∥ `position: sticky` + `top: 0` ∥ 回退媒体查询（`height: auto`）∥
 *      `main` margin 无 `auto` ∥ `.model-picks` 零残留（规则 + 字面两向）
 *   腿 C（五页壳行为——stub ctx）：逐页渲染 N 行 ⇒ `setCount` 收 N；空/错 ⇒ 0；`head`/`area` 传参形状在册
 *   腿 D（弹窗表格形——DOM 桩）：详情勾选表（单列「模型」∥ 行 = `label`（勾选 + 模型名）∥ 失败 = `.hint error`）∥
 *      预设模型表（单列「模型」：`code` 行）∥ 成员 key 表（四列头 ∥ 吊销钮行内 ∥ 空态 `noKeys` 不变量）
 *   腿 E（左对齐——§2.6④）：`main` 规则 `max-width: 1100px` 在 ∥ margin 无 `auto`
 *   腿 F（i18n——§2.2 本批 6 键）：两表在册（非空 ∥ 占位符一致 ∥ en 零 CJK）∥ `t` 引用闭合
 *   腿 G（门禁——§6 AC-20 续）：`prepublishOnly` 含本批件（十八件）∥ 清单目标在盘
 *   附加：AC-19 canon 不破（零新 `:root` 变量——38 ∥ 悬停清单八条 ∥ 内距 ∈ 刻度 ∪ {0, auto} ∪ 布局组 ∥ 类名双向闭合）
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
const CSS = readPublic("style.css")
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const [{ ZH }, { EN }, ADMIN, PROVIDERS, MODELS, AUDIT, ME, MODALS] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("views-admin.mjs"), load("views-providers.mjs"), load("views-models.mjs"),
  load("views-audit.mjs"), load("views-me.mjs"), load("views-providers-modals.mjs"),
])

/** 本批新键（§2.2 键族登记——两表逐键同步）。 */
const NEW_KEYS = [
  "common.rowCount", "admin.members.colKey", "admin.members.colLastUsed", "admin.members.colWindowTokens",
  "admin.members.colActions", "admin.members.windowTokensCell",
]
/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

/** 注释剔除（CSS 块注释）∥ 规则表（选择器 ∥ 声明体——`@media` 内层规则同收）。 */
const stripCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")
const CSS_CLEAN = stripCss(CSS)
const rulesOf = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, " "), body: m[2].trim().replace(/\s+/g, " ") }))
const CSS_RULES = rulesOf(CSS_CLEAN)
const cssRule = (selector) => CSS_RULES.find((item) => item.selector === selector) ?? null

// ── 桩 DOM（`modal.mjs`/视图件近形：replaceChildren/classList/append/remove/fire；`h` 同 app 语义近似）────────

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

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点（数组拍平）。 */
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

/** 壳桩（`ctx.dataShell` 语义近似——三段 + `setCount` 记录 ∥ 末次传参留档：断言面 = 形状 + 计数真值）。 */
function makeShell() {
  const counts = []
  let last = null
  const dataShell = (mount, { head, area }) => {
    last = { head, area }
    const foot = h("p", { class: "page-foot" })
    mount.append(h("div", { class: "page-head" }, head), h("div", { class: "page-area" }, area), foot)
    return { setCount: (count) => { counts.push(count); foot.textContent = fill(ZH["common.rowCount"], { count }) } }
  }
  return { dataShell, counts, last: () => last }
}

/** 页桩 ctx（腿 C——取数面全注入；`table`/`usageTable` 同 app 助手语义近似）。 */
function pageCtx({ routes, state = {}, shell }) {
  const calls = []
  const ctx = {
    h,
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${String(path).split("?")[0]}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
    state,
    fmtTs: (ts) => String(ts),
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    fmtQuota: (value) => (value === null || value === undefined ? "unlimited" : String(value)),
    table: (headers, rows) => h("div", { class: "table-wrap" },
      h("table", {}, h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))), h("tbody", {}, ...rows.map((cells) => h("tr", {}, ...cells.map((cell) => h("td", {}, ...(Array.isArray(cell) ? cell : [cell])))))))),
    usageTable: (rows) => (rows.length === 0
      ? h("p", { class: "hint", text: ZH["usage.empty"] })
      : h("div", { class: "table-wrap" }, h("table", {}, h("tbody", {}, ...rows.map((row) => h("tr", {}, h("td", { text: String(row.ts ?? "") }))))))),
    dataShell: shell.dataShell,
  }
  return { ctx, calls }
}

// ── 腿 A（壳机制源扫——§2.6②）──────────────────────────────────────────────

test("腿 A 壳机制源扫：`dataShell` 三件 + `SHELL_PAGES` 五路径 + `route()` 切换 ∥ 五页接线在册", () => {
  const src = readPublic("app.mjs")
  // dataShell 三件构建 + 计数键引用（+ 挂载/脚注面）
  assert.match(src, /function dataShell\(mount, \{ head, area \}\)/, "dataShell 助手缺位")
  for (const cls of ["page-head", "page-area", "page-foot"]) assert.ok(src.includes(`"${cls}"`), `壳三段缺位：${cls}`)
  assert.ok(src.includes('t("common.rowCount"'), "行计数键（`common.rowCount`）引用缺位")
  // SHELL_PAGES 五路径逐条钉表（恰五——不得多/少）
  const shellBlock = src.match(/const SHELL_PAGES = new Set\(\[([^\]]*)\]\)/)
  assert.ok(shellBlock !== null, "SHELL_PAGES 缺位")
  assert.deepEqual([...shellBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    ["/admin/members", "/admin/providers", "/admin/models", "/admin/audit", "/me/usage"], "SHELL_PAGES = 钉表五路径（恰五）")
  // route() 切换（按路径）+ 登录径清除（登出/会话失效同径）
  assert.ok(src.includes('classList.toggle("data-shell", SHELL_PAGES.has(resolved.path))'), "route() 未切换 data-shell")
  assert.ok(src.includes('classList.remove("data-shell")'), "登录径未清 data-shell")
  const viewCtxBlock = src.match(/function viewCtx\(\)\s*\{[\s\S]*?\n\}/)
  assert.ok(viewCtxBlock !== null && viewCtxBlock[0].includes("dataShell"), "viewCtx 未注入 dataShell")
  // 五页逐档：壳调用 + 取数渲染后行计数（空/错 = 0）
  for (const file of ["views-admin.mjs", "views-providers.mjs", "views-models.mjs", "views-audit.mjs", "views-me.mjs"]) {
    const pageSrc = readPublic(file)
    assert.ok(pageSrc.includes("ctx.dataShell("), `${file} 缺壳调用`)
    assert.ok(pageSrc.includes("setCount("), `${file} 缺行计数接线`)
    assert.ok(pageSrc.includes("setCount(0)"), `${file} 空/错态计数（= 0）缺位`)
  }
})

// ── 腿 B（CSS 声明扫描——§2.6②）────────────────────────────────────────────

test("腿 B CSS：高度链声明表逐条 ∥ 吸附 ∥ 回退媒体查询 ∥ `main` 撤 auto ∥ `.model-picks` 零残留", () => {
  const CHAIN = [
    ["body.data-shell .content", ["height: 100dvh", "display: flex", "flex-direction: column"]],
    ["body.data-shell main", ["flex: 1", "min-height: 0", "display: flex", "flex-direction: column"]],
    ["body.data-shell main > section", ["flex: 1", "min-height: 0", "display: flex", "flex-direction: column"]],
    [".page-head", ["flex: none"]],
    [".page-area", ["flex: 1", "min-height: 0", "display: flex", "flex-direction: column"]],
    [".page-area > .card", ["flex: 1", "min-height: 0", "display: flex", "flex-direction: column", "margin-bottom: 0"]],
    [".table-slot", ["flex: 1", "min-height: 0", "display: flex", "flex-direction: column"]],
    [".table-slot > .table-wrap", ["flex: 1", "min-height: 0", "overflow-y: auto"]],
    ["body.data-shell main thead th", ["position: sticky", "top: 0", "z-index: 1"]],
    [".page-foot", ["flex: none", "margin-top: var(--sp-4)", "color: var(--muted)"]],
  ]
  for (const [selector, decls] of CHAIN) {
    const rule = cssRule(selector)
    assert.ok(rule !== null, `高度链规则缺位：${selector}`)
    for (const decl of decls) assert.ok(rule.body.includes(decl), `${selector} 缺声明：${decl}`)
  }
  // 回退：≤760px 宽 ∥ ≤600px 高 ⇒ 撤链（height: auto）
  const media = CSS_CLEAN.match(/@media \(max-width: 760px\), \(max-height: 600px\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(media !== null, "回退媒体查询缺位")
  assert.match(media[1], /body\.data-shell \.content\s*\{\s*height:\s*auto;\s*\}/, "回退声明（height: auto）缺位")
  // `main` 撤 auto（左靠——§2.6④）
  const main = cssRule("main")
  assert.ok(main !== null && !main.body.includes("auto"), "main 仍含 auto 居中")
  // `.model-picks` 退役——规则 + 字面两向零残留
  assert.equal(CSS.includes("model-picks"), false, "样式规则残留：.model-picks")
  for (const name of readdirSync(PUBLIC_DIR)) {
    if (!name.endsWith(".mjs") && name !== "index.html") continue
    assert.equal(readPublic(name).includes("model-picks"), false, `${name} 字面量残留：model-picks`)
  }
})

// ── 腿 C（五页壳行为——stub ctx）────────────────────────────────────────────

const MEMBER = { id: 1, name: "Alice", username: "alice", role: "user", quotaTokens: null, usedTokens: 0, keys: [] }
const MEMBER2 = { ...MEMBER, id: 2, name: "Bob", username: "bob" }

test("腿 C 五页壳：成功 = 行数 ∥ 空 = 0 ∥ 错 = 0 ∥ `head`/`area` 传参形状在册", async () => {
  globalThis.location = { origin: "http://console.test" } // me/usage 提示条 snippet 取 origin（node 无 location）
  try {
    const CASES = [
      {
        label: "成员（#/admin/members）", render: ADMIN.renderMembers, key: "GET /api/members",
        ok: () => ({ members: [MEMBER, MEMBER2] }), empty: () => ({ members: [] }), state: { member: MEMBER }, rows: 2,
        head: (mount) => byText(mount, ZH["admin.members.title"]) !== null && byText(mount, ZH["admin.members.newBtn"]) !== null,
        area: (mount) => findNode(mount, (node) => node.className === "table-slot") !== null,
      },
      {
        label: "Provider（#/admin/providers）", render: PROVIDERS.renderProviders, key: "GET /api/admin/providers",
        ok: () => ({ providers: [{ id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: [] }, { id: 2, name: "p2", baseURL: "http://y/v1", apiKey: "…1", models: ["m"] }] }),
        empty: () => ({ providers: [] }), state: {}, rows: 2,
        head: (mount) => byText(mount, ZH["admin.providers.title"]) !== null && byText(mount, ZH["admin.providers.add"]) !== null,
        area: (mount) => findNode(mount, (node) => node.className === "table-slot") !== null,
      },
      {
        label: "服务模型（#/admin/models）", render: MODELS.renderModels, key: "GET /api/admin/providers",
        ok: () => ({ providers: [{ id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: ["m-1"] }] }),
        empty: () => ({ providers: [] }), state: { system: { embedding: { model: "bge-m3" } } }, emptyState: { system: null }, rows: 2,
        head: (mount) => byText(mount, ZH["admin.models.title"]) !== null,
        area: (mount) => findNode(mount, (node) => node.className === "table-slot") !== null,
      },
      {
        label: "审计（#/admin/audit）", render: AUDIT.renderAudit, key: "GET /api/audit",
        ok: () => ({ events: [
          { ts: 1700000000000, type: "login_success", actor: "alice", target: "alice", detail: { ip: "10.0.0.1" } },
          { ts: 1700000001000, type: "key_issue", actor: "alice", target: "alice", detail: { keyHint: "sk-tc-…" } },
        ] }),
        empty: () => ({ events: [] }), state: {}, rows: 2,
        head: (mount) => byText(mount, ZH["audit.title"]) !== null,
        area: (mount) => findNode(mount, (node) => node.className === "table-slot") !== null
          && findNode(mount, (node) => node.tag === "form") !== null,
      },
      {
        label: "我的用量（#/me/usage——用量明细）", render: ME.renderMeUsage, key: "GET /api/me/usage",
        ok: () => ({ rows: [{ ts: 1700000000000 }, { ts: 1700000001000 }, { ts: 1700000002000 }] }),
        empty: () => ({ rows: [] }), state: { member: MEMBER, system: { embedding: { model: "bge-m3" } } }, rows: 3,
        head: (mount) => byText(mount, ZH["me.usage.title"]) !== null && byText(mount, ZH["me.usage.summary"]) !== null,
        area: (mount) => findNode(mount, (node) => node.className === "table-slot") !== null,
      },
    ]
    for (const page of CASES) {
      // 成功：计数 = 行数真值（`setCount` 恰一次）+ 页头/表区形状
      const okShell = makeShell()
      const okMount = makeNode("section")
      await page.render(pageCtx({ routes: { [page.key]: page.ok }, state: page.state, shell: okShell }).ctx, okMount)
      assert.deepEqual(okShell.counts, [page.rows], `${page.label} setCount 恰一次 = 行数真值`)
      assert.ok(page.head(okMount), `${page.label} 页头形状`)
      assert.ok(page.area(okMount), `${page.label} 表区形状`)
      assert.ok(okShell.last() !== null && okShell.last().head != null && okShell.last().area != null, `${page.label} dataShell 传参（head/area）`)
      // 空态：计数 = 0（`emptyState` 在场则取——如服务模型页去嵌入行）
      const emptyShell = makeShell()
      const emptyMount = makeNode("section")
      await page.render(pageCtx({ routes: { [page.key]: page.empty }, state: page.emptyState ?? page.state, shell: emptyShell }).ctx, emptyMount)
      assert.deepEqual(emptyShell.counts, [0], `${page.label} 空态 setCount 恰一次 = 0`)
      // 错误：fail 收口 + 计数 = 0
      const errShell = makeShell()
      const err = pageCtx({ routes: { [page.key]: () => { throw new Error("boom") } }, state: page.state, shell: errShell })
      const errMount = makeNode("section")
      await page.render(err.ctx, errMount)
      assert.deepEqual([err.calls.some(([kind]) => kind === "fail"), errShell.counts], [true, [0]], `${page.label} 错态：fail + setCount 恰一次 = 0`)
    }
  } finally {
    delete globalThis.location
  }
})

// ── 腿 D（弹窗表格形——DOM 桩）──────────────────────────────────────────────

test("腿 D 弹窗表格形：详情勾选表 ∥ 预设模型表 ∥ 成员 key 表（四列 ∥ 吊销行内 ∥ 空态不变量）", async () => {
  globalThis.document = createDocument()
  try {
    // ① 详情弹窗·勾选段 = 单列表（表头「模型」∥ 行 = `label`（勾选 + 模型名）∥ 勾选态 = 现配置）
    const detail = pageCtx({
      routes: {
        "POST /api/admin/providers/discover": () => ({ models: ["m-1", "m-2"] }),
        "PATCH /api/admin/providers/1": () => ({ ok: true, id: 1 }),
      },
      shell: makeShell(),
    })
    const modal = MODALS.openProviderDetailModal(detail.ctx, { provider: { id: 1, name: "p", baseURL: "http://x/v1", apiKey: "", models: ["m-1"] } })
    await tick() // 首开自动拉取候选
    const table = findNode(modal.root, (node) => node.tag === "table")
    assert.ok(table !== null, "详情勾选段缺表格形")
    assert.deepEqual(findAll(table, (node) => node.tag === "th").map((cell) => cell.textContent), [ZH["admin.models.colModel"]], "单列表头 =「模型」")
    const pickLabels = findAll(table, (node) => node.tag === "label")
    assert.deepEqual(pickLabels.map((label) => label.children[1]), ["m-1", "m-2"], "行 = label（勾选 + 模型名）")
    for (const label of pickLabels) assert.deepEqual([label.children[0].tag, label.children[0].attrs.type], ["input", "checkbox"], "行内勾选框")
    assert.deepEqual(pickLabels.filter((label) => label.children[0].checked).map((label) => label.children[1]), ["m-1"], "勾选态 = 现配置草稿")
    // 交互零改（点题名同切换——`label` 直父）：勾选 → save ⇒ PATCH `models` = 勾选集（行为可观察）
    const box = pickLabels[1].children[0]
    box.checked = true
    await box.fire("change")
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(detail.calls.filter(([method]) => method === "PATCH").at(-1),
      ["PATCH", "/api/admin/providers/1", { models: ["m-1", "m-2"] }], "勾选写回草稿 ⇒ 保存 = 勾选集")
    modal.close()
    // 发现失败 ⇒ 段内 `.hint error`（§2.4④ 不变量）；空候选 ⇒ `.hint` 空态面
    const failing = pageCtx({ routes: { "POST /api/admin/providers/discover": () => { throw new Error("boom") } }, shell: makeShell() })
    const failModal = MODALS.openProviderDetailModal(failing.ctx, { provider: { id: 1, name: "p", baseURL: "http://x/v1", apiKey: "", models: [] } })
    await tick()
    assert.ok(findNode(failModal.root, (node) => node.className === "hint error") !== null, "发现失败 = `.hint error`")
    failModal.close()
    const blank = pageCtx({ routes: { "POST /api/admin/providers/discover": () => ({ models: [] }) }, shell: makeShell() })
    const blankModal = MODALS.openProviderDetailModal(blank.ctx, { provider: { id: 1, name: "p", baseURL: "http://x/v1", apiKey: "", models: [] } })
    await tick()
    const blankHint = findAll(blankModal.root, (node) => node.className === "hint").find((node) => node.textContent.includes(ZH["admin.providers.refreshCandidates"])) ?? null
    assert.ok(blankHint !== null, "空候选 = `.hint` 空态（重试可达）")
    blankModal.close()

    // ② 添加弹窗·预设信息段 = 单列表（表头「模型」——行 = `code` 芯片）；地址行零动
    const add = pageCtx({
      routes: { "GET /api/admin/providers/presets": () => ({ presets: [{ preset: "deepseek", name: "deepseek", baseURL: "https://api.deepseek.com", models: ["deepseek-chat", "deepseek-reasoner"] }] }) },
      shell: makeShell(),
    })
    const addModal = MODALS.openAddProviderModal(add.ctx, { providers: [] })
    await tick() // 预设表首开惰性拉取
    const select = findNode(addModal.root, (node) => node.tag === "select")
    select.value = "deepseek"
    await select.fire("change")
    const presetTable = findNode(addModal.root, (node) => node.tag === "table")
    assert.ok(presetTable !== null, "预设信息段缺模型表")
    assert.deepEqual(findAll(presetTable, (node) => node.tag === "th").map((cell) => cell.textContent), [ZH["admin.models.colModel"]], "单列表头 =「模型」")
    const presetCells = findAll(presetTable, (node) => node.tag === "td")
    assert.deepEqual(presetCells.map((cell) => [cell.children[0]?.tag, cell.children[0]?.textContent]), [["code", "deepseek-chat"], ["code", "deepseek-reasoner"]], "行 = `code` 芯片")
    assert.ok(textOf(addModal.root).includes("https://api.deepseek.com"), "地址行零动（dl 在册）")
    addModal.close()

    // ③ 成员详情弹窗·key 表（四列：密钥 ∥ 最后使用 ∥ 近 30 天 ∥ 操作——吊销钮行内；空态 = `.hint` 不变量）
    const member = {
      id: 1, name: "Alice", username: "alice", role: "user", quotaTokens: null, usedTokens: 42,
      keys: [
        { id: 7, hint: "sk-tc-abcd", lastUsedAt: null, windowTokens: 0 },
        { id: 8, hint: "sk-tc-efgh", lastUsedAt: 1700000000000, windowTokens: 12 },
      ],
    }
    const memberCtx = {
      h, state: {},
      api: async () => ({}), fail: () => {}, showSecret: () => {},
      fmtQuota: (value) => (value === null || value === undefined ? "unlimited" : String(value)),
      fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
      fmtTs: (ts) => `t:${ts}`,
    }
    const keyModal = ADMIN.openMemberModal(memberCtx, { member, reload: async () => [member], secretBox: makeNode("div") })
    const keyTable = findNode(keyModal.root, (node) => node.tag === "table")
    assert.ok(keyTable !== null, "成员弹窗缺 key 表")
    assert.deepEqual(findAll(keyTable, (node) => node.tag === "th").map((cell) => cell.textContent),
      [ZH["admin.members.colKey"], ZH["admin.members.colLastUsed"], ZH["admin.members.colWindowTokens"], ZH["admin.members.colActions"]], "四列表头")
    const keyRows = findAll(keyTable, (node) => node.tag === "tr").slice(1)
    assert.equal(keyRows.length, 2, "行 = key 数")
    assert.deepEqual(keyRows[0].children.map((cell) => textOf(cell)),
      ["sk-tc-abcd", ZH["me.keys.neverUsed"], fill(ZH["admin.members.windowTokensCell"], { tokens: 0 }), ZH["admin.members.revoke"]], "行 1（未使用 key）")
    assert.deepEqual(keyRows[1].children.map((cell) => textOf(cell)),
      ["sk-tc-efgh", "t:1700000000000", fill(ZH["admin.members.windowTokensCell"], { tokens: 12 }), ZH["admin.members.revoke"]], "行 2（在用 key）")
    assert.deepEqual([keyRows[0].children[0].children[0].tag, keyRows[0].children[3].children[0].tag], ["code", "button"], "密钥 = `code` ∥ 吊销钮行内")
    keyModal.close()
    const emptyKeyModal = ADMIN.openMemberModal(memberCtx, { member: { ...member, keys: [] }, reload: async () => [], secretBox: makeNode("div") })
    assert.deepEqual([byText(emptyKeyModal.root, ZH["admin.members.noKeys"]) !== null, findNode(emptyKeyModal.root, (node) => node.tag === "table")], [true, null], "空态 = `.hint`（noKeys——零表）")
    emptyKeyModal.close()
  } finally {
    delete globalThis.document
  }
})

// ── 腿 E（左对齐——§2.6④）──────────────────────────────────────────────────

test("腿 E 左对齐：`main` 规则 `max-width: 1100px` 在 ∥ margin 无 `auto`", () => {
  const main = cssRule("main")
  assert.ok(main !== null, "`main` 规则缺位")
  assert.ok(main.body.includes("max-width: 1100px"), "max-width 沿用缺位")
  assert.ok(!main.body.includes("auto"), "`main` 仍含 auto（未撤居中）")
  assert.match(main.body, /margin: 0(?:;| )/, "`main` margin 未收 0")
})

// ── 腿 F（i18n——§2.2 本批 6 键）────────────────────────────────────────────

test("腿 F i18n：本批 6 键两表在册（非空 ∥ 占位符一致 ∥ en 零 CJK）∥ `t` 引用闭合", () => {
  for (const key of NEW_KEYS) {
    assert.ok(key in ZH && key in EN, `本批键缺位：${key}`)
    assert.ok(ZH[key].trim().length > 0 && EN[key].trim().length > 0, `空值键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
    assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  }
  // 引用闭合：全档 `t("…")` 字面量 ⊆ 两表
  const refs = []
  for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") && !["i18n-zh.mjs", "i18n-en.mjs"].includes(item))) {
    const src = readPublic(name)
    for (const match of src.matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 150, `t 字面量过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) assert.ok(key in ZH && key in EN, `${name} 引用悬空键：${key}`)
  // 本批键消费点在册（页脚 + 成员 key 表）
  assert.ok(readPublic("app.mjs").includes('t("common.rowCount"'), "行计数键未接线")
  for (const key of ["admin.members.colKey", "admin.members.colLastUsed", "admin.members.colWindowTokens", "admin.members.colActions", "admin.members.windowTokensCell"]) {
    assert.ok(readPublic("views-admin.mjs").includes(`t("${key}"`), `成员 key 表引用缺位：${key}`)
  }
})

// ── 腿 G（门禁——§6 AC-20 续）───────────────────────────────────────────────

test("腿 G 门禁：`prepublishOnly` 十八件含本批件 ∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.equal(batchFiles.length, 18, `门禁清单件数（十七 ⇒ 十八）：${batchFiles.length}`)
  assert.ok(batchFiles.includes("docs/batches/2026-10-07-console-layout.test.mjs"), "本批件应入列")
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})

// ── 附加（AC-19 canon 不破——本批零新变量/悬停/越刻度/未闭合类）────────────────

test("附加 AC-19 canon 不破：`:root` 38 ∥ 悬停清单八条 ∥ 内距 ∈ 刻度 ∥ 类名双向闭合", () => {
  // 零新 `:root` 变量（变量族计数 = 38——新增即破）
  const rootMatch = CSS_CLEAN.match(/:root\s*\{[^{}]*\}/)
  assert.ok(rootMatch !== null, ":root 变量底座缺位")
  const rootVars = [...rootMatch[0].matchAll(/(--[\w-]+)\s*:/g)]
  assert.equal(rootVars.length, 38, `:root 变量族计数（零新增）：${rootVars.length}`)
  // 悬停清单（行悬停三 + 交互件五——本批零新增）
  const ROW_HOVER = [".nav-item:hover", "tbody tr:hover", "li.key-item:hover"]
  const CTRL_HOVER = ["button:hover", "button.tiny:hover", "button.danger:hover", "button.link:hover", ".modal-close:hover"]
  const hoverRules = CSS_RULES.filter((rule) => rule.selector.includes(":hover"))
  assert.deepEqual(hoverRules.map((rule) => rule.selector).sort(), [...ROW_HOVER, ...CTRL_HOVER].sort(), "悬停声明清单外残留")
  for (const selector of ROW_HOVER) assert.equal(cssRule(selector).body, "background: var(--hover);", `${selector} 行悬停非同值`)
  // 内距 ∈ `--sp-*` ∪ {0, auto} ∪ 布局组（`--nav-w`）
  const SPACING = new Set(["0", "auto", ...Array.from({ length: 7 }, (_, index) => `var(--sp-${index + 1})`), "var(--nav-w)"])
  const decls = [...CSS_CLEAN.matchAll(/(?:^|[;{\s])(padding|margin|gap)(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/g)]
  assert.ok(decls.length >= 40, `内距声明过少（扫描失效？）：${decls.length}`)
  for (const decl of decls) {
    for (const token of decl[2].trim().split(/\s+/)) assert.ok(SPACING.has(token), `内距越刻度：${decl[0]} ${decl[2].trim()}`)
  }
  // 类名双向闭合（档面字面类 ⊆ 样式类 ∥ 样式类 ⊆ 档面字面类 ∪ 态类）
  const cssClasses = new Set([...CSS_CLEAN.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]))
  const usedClasses = new Set()
  for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") || item === "index.html")) {
    const src = readPublic(name)
    for (const m of src.matchAll(/\bclass(?:Name)?\s*[:=]\s*([^\n;]*?)(?=\s*\bclass(?:Name)?\s*[:=]|[;\n]|$)/g)) {
      const window = m[1].replace(/\$\{[^}]*\}/g, " ").split("//")[0].split("}")[0].split(/,\s*[A-Za-z_$][\w$]*\s*:/)[0]
      for (const literal of window.matchAll(/["'`]([^"'`]*)["'`]/g)) for (const token of literal[1].split(/\s+/)) if (token) usedClasses.add(token)
    }
    for (const m of src.matchAll(/classList\.(?:add|remove|toggle)\(\s*["']([^"']*)["']/g)) usedClasses.add(m[1])
  }
  for (const known of ["row-clickable", "table-wrap", "key-item", "config-field", "hint", "tiny", "page-head", "page-area", "page-foot", "table-slot", "data-shell"]) {
    assert.ok(usedClasses.has(known), `类面扫描失效（档面）：${known}`)
  }
  for (const known of ["card", "row-clickable", "key-item", "config-field", "modal", "error", "page-head", "table-slot", "data-shell"]) {
    assert.ok(cssClasses.has(known), `样式类扫描失效：${known}`)
  }
  const STATE = new Set(["active", "ok", "degraded", "down", "error", "modal-open"])
  for (const token of usedClasses) assert.ok(cssClasses.has(token), `档面类无样式规则：${token}`)
  for (const cls of cssClasses) assert.ok(usedClasses.has(cls) || STATE.has(cls), `样式类零消费者：.${cls}`)
})
