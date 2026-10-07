/**
 * 2026-10-07-me-usage-charts-ui.test.mjs — thincoder-server 批内单测件（me 用量图表化批——AC-26 机检载体 · 页面腿；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存；服务端腿 = `-me-usage-charts.test.mjs`（两件同批——
 * 越 500 硬线拆档，沿按域拆档先例）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-me-usage-charts-ui.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §2.3⑦/§6 AC-26 两行；腿 ↔ 判据在括号）：
 *   腿 B（页面树面——桩 DOM 直渲 `renderMeUsage`）：六区（概览卡 2 ∥ 筛选控件 4 ∥ KPI 2 + 拆注 ∥ 堆叠柱/切换 2/图例 ∥
 *      分模型表 5 列 ∥ 明细 usageTable + tfoot）∥ 两读同拍（`Promise.all` 同过滤面——明细 + `limit=100`）∥
 *      三档窗换算（近 7/30/本月 ⇒ `from` ms）∥ 维度切换 = 本地重画（零重取）∥ 殿后行（月窗有量——端过滤不裁）∥ 空/错态
 *   腿 C（样式与键集）：`.bar-stacked`/`.bar-seg`/`.bar-swatch`/`.chart-toggle` 在册 ∥ `.page-area` gap ∥ `.report-card` 上限自滚 ∥
 *      零新 `:root` 变量（38）∥ 零新悬停规则（七条）∥ 键集 +8 ∥ −1（两表同步 ∥ en 零 CJK ∥ 占位符一致 ∥ `me.usage.summary` 零残留）∥
 *      `statCard` 导出 ∥ 零外部引用 ∥ `views-me` 内容行 ≤300（越线 ⇒ 拆分预案：`views-me-usage.mjs`）
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
const loadPublic = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const I18N = await loadPublic("i18n.mjs")
const { ZH } = await loadPublic("i18n-zh.mjs")
const { EN } = await loadPublic("i18n-en.mjs")
const ME = await loadPublic("views-me.mjs")

// ── 腿 B（页面树面——桩 DOM）────────────────────────────────────────────────

class FakeNode {}
function makeNode(tag) {
  const classes = new Set()
  const node = new FakeNode()
  Object.assign(node, { tag, children: [], listeners: {}, attrs: {}, parent: null, checked: false, hidden: false, textContent: "", className: "", value: "" })
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
  return node
}

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
const textOf = (node) => (typeof node === "string" ? node : [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" "))
const fill = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

/** 页桩 ctx（真 `renderMeUsage` 直驱——取数面注入；`table`/`usageTable`/`dataShell` 同 app 助手语义近似）。 */
function pageCtx({ routes, state = {} }) {
  const calls = []
  const shell = { last: null }
  const ctx = {
    h,
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${String(path).split("?")[0]}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(path)
    },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
    state,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    fmtTs: (ts) => String(ts),
    fmtModelQuotas: (quotas) => {
      const count = Object.keys(quotas ?? {}).length
      return count === 0 ? ZH["common.quotaByPlatform"] : fill(ZH["common.modelQuotaCount"], { count })
    },
    table: (headers, rows, { foot = false } = {}) => h("div", { class: "table-wrap" },
      h("table", {},
        h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
        h("tbody", {}, ...rows.map((cells) => h("tr", {}, ...cells.map((cell) => h("td", {}, ...(Array.isArray(cell) ? cell : [cell])))))),
        ...(foot ? [h("tfoot", {}, h("tr", {}, h("td", { text: I18N.t("common.rowCount", { count: rows.length }) })))] : []))),
    usageTable: (rows, { foot = false } = {}) => (rows.length === 0
      ? h("p", { class: "hint", text: ZH["usage.empty"] })
      : h("div", { class: "table-wrap" },
          h("table", {},
            h("tbody", {}, ...rows.map((row) => h("tr", {}, h("td", { text: String(row.ts ?? "") })))),
            ...(foot ? [h("tfoot", {}, h("tr", {}, h("td", { text: I18N.t("common.rowCount", { count: rows.length }) })))] : [])))),
    dataShell: (mount, { head, area }) => {
      shell.last = { head, area }
      mount.append(h("div", { class: "page-head" }, head), h("div", { class: "page-area" }, area))
    },
  }
  return { ctx, calls, shell }
}

const MEMBER = {
  id: 1, name: "Alice", username: "alice", role: "user",
  modelQuotas: { "bailian/qwen3.5-plus": 100 },
  modelUsage: { "bailian/qwen3.5-plus": 40, "bge-m3": 6, "meta/ghost": 7 },
  usedTokens: 46, keys: [],
}
const DAYS = ["2026-10-05", "2026-10-06", "2026-10-07"]
const SUMMARY = {
  totals: { requests: 3, promptTokens: 19, completionTokens: 27, totalTokens: 46 },
  trend: [
    { day: DAYS[0], requests: 1, totalTokens: 10 },
    { day: DAYS[1], requests: 0, totalTokens: 0 },
    { day: DAYS[2], requests: 2, totalTokens: 36 },
  ],
  trendByEndpoint: [
    { day: DAYS[0], endpoint: "chat", requests: 1, totalTokens: 10 },
    { day: DAYS[1], endpoint: "chat", requests: 0, totalTokens: 0 },
    { day: DAYS[2], endpoint: "chat", requests: 1, totalTokens: 30 },
    { day: DAYS[0], endpoint: "embeddings", requests: 0, totalTokens: 0 },
    { day: DAYS[1], endpoint: "embeddings", requests: 0, totalTokens: 0 },
    { day: DAYS[2], endpoint: "embeddings", requests: 1, totalTokens: 6 },
  ],
  trendByModel: [
    { day: DAYS[0], model: "bailian/qwen3.5-plus", requests: 1, totalTokens: 10 },
    { day: DAYS[1], model: "bailian/qwen3.5-plus", requests: 0, totalTokens: 0 },
    { day: DAYS[2], model: "bailian/qwen3.5-plus", requests: 1, totalTokens: 30 },
    { day: DAYS[0], model: "bge-m3", requests: 0, totalTokens: 0 },
    { day: DAYS[1], model: "bge-m3", requests: 0, totalTokens: 0 },
    { day: DAYS[2], model: "bge-m3", requests: 1, totalTokens: 6 },
  ],
  byModel: [
    { model: "bailian/qwen3.5-plus", requests: 2, totalTokens: 40 },
    { model: "bge-m3", requests: 1, totalTokens: 6 },
  ],
}
const ROWS = [{ ts: 3 }, { ts: 2 }, { ts: 1 }]
const withLocation = async (fn) => {
  globalThis.location = { origin: "http://console.test" } // 向量提示条 snippet 取 origin（node 无 location）
  try { return await fn() } finally { delete globalThis.location }
}

test("腿 B 页面六区：概览卡 ∥ 筛选四控件 ∥ KPI+拆注 ∥ 堆叠柱/切换/图例 ∥ 分模型五列 ∥ 明细 tfoot ∥ 两读同拍", async () => {
  await withLocation(async () => {
    const { ctx, calls, shell } = pageCtx({
      routes: { "GET /api/me/usage/summary": () => SUMMARY, "GET /api/me/usage": () => ({ rows: ROWS }) },
      state: { member: MEMBER, system: { embedding: { model: "bge-m3" } } },
    })
    const mount = makeNode("section")
    await ME.renderMeUsage(ctx, mount)

    // 两读同拍（同过滤面——summary + 明细 + limit=100）
    const gets = calls.filter(([method]) => method === "GET")
    assert.deepEqual(gets.map(([, path]) => String(path).split("?")[0]).sort(), ["/api/me/usage", "/api/me/usage/summary"])
    const summaryUrl = new URL(gets.find(([, path]) => String(path).startsWith("/api/me/usage/summary?"))[1], "http://x")
    const detailUrl = new URL(gets.find(([, path]) => String(path).startsWith("/api/me/usage?"))[1], "http://x")
    assert.equal(detailUrl.searchParams.get("limit"), "100")
    assert.equal(detailUrl.searchParams.get("from"), summaryUrl.searchParams.get("from"))

    // 页头：页题 ∥ 向量提示条 ∥ 概览卡行（本月已用 ∥ 分模型配额——月语境）
    assert.equal(findAll(mount, (node) => node.tag === "h2")[0].textContent, ZH["me.usage.title"])
    assert.ok(textOf(mount).includes(ZH["vector.meTitle"]), "向量提示条在册")
    assert.deepEqual(findAll(mount, (node) => node.className === "stat-label").map((node) => node.textContent),
      [ZH["me.usage.used"], ZH["col.quota"], ZH["usageReport.requests"], ZH["usageReport.tokens"]])
    assert.deepEqual(findAll(mount, (node) => node.className === "stat-value").map((node) => node.textContent),
      ["46", fill(ZH["common.modelQuotaCount"], { count: 1 }), "3", "46"])
    // 筛选行四控件（select×2 + input + 钮）
    const filter = findNode(mount, (node) => node.className === "row-form")
    assert.ok(filter !== null, "筛选行在册")
    assert.deepEqual([
      findAll(filter, (node) => node.tag === "select").length,
      findAll(filter, (node) => node.tag === "input").length,
      findAll(filter, (node) => node.tag === "button").length,
    ], [2, 1, 1])
    assert.equal(findAll(filter, (node) => node.tag === "select")[0].value, "30", "缺省窗 = 近 30 天")
    // KPI 拆注（prompt/completion）
    assert.ok(textOf(mount).includes(fill(ZH["me.usage.kpiSplit"], { prompt: 19, completion: 27 })), "KPI 注行 = 拆分")
    // 主图：切换 2（端点 ∥ 模型——活动态）∥ 堆叠柱（柱高 = 当日/峰值）∥ 段（色阶 ∥ title）∥ 图例 ∥ 轴标
    const toggle = findNode(mount, (node) => node.className === "chart-toggle")
    const toggleBtns = findAll(toggle, (node) => node.tag === "button")
    assert.deepEqual(toggleBtns.map((btn) => btn.textContent), [ZH["usageReport.endpoint"], ZH["usage.col.model"]])
    assert.deepEqual(toggleBtns.map((btn) => btn.className), ["tiny active", "tiny"], "活动态 = 端点（缺省维度）")
    const bars = findAll(mount, (node) => node.className === "bar-stacked")
    assert.deepEqual(bars.map((bar) => bar.attrs.style), ["height:28%", "height:0%", "height:100%"])
    const segs = findAll(mount, (node) => node.className === "bar-seg")
    assert.deepEqual(segs.map((seg) => seg.attrs.style), ["height:100%;opacity:1", "height:83%;opacity:1", "height:17%;opacity:0.7"]) // 零段不画（段色 = 透明度阶梯）
    assert.deepEqual(segs.map((seg) => seg.attrs.title), [
      `${DAYS[0]} · chat · ${ZH["usageReport.requests"]} 1 · 10 ${ZH["usageReport.tokens"]}`,
      `${DAYS[2]} · chat · ${ZH["usageReport.requests"]} 1 · 30 ${ZH["usageReport.tokens"]}`,
      `${DAYS[2]} · embeddings · ${ZH["usageReport.requests"]} 1 · 6 ${ZH["usageReport.tokens"]}`,
    ])
    const swatches = findAll(mount, (node) => node.className === "bar-swatch")
    assert.deepEqual(swatches.map((span) => span.attrs.style), ["opacity:1", "opacity:0.7"])
    assert.deepEqual(swatches.map((span) => textOf(span.parent)), ["chat", "embeddings"], "图例 = 点 + 维值名")
    assert.deepEqual(findAll(mount, (node) => node.className === "chart-axis")[0].children.map(textOf), [DAYS[0], DAYS[2]])
    // 分模型区：五列 ∥ byModel 降序 + 殿后行（月窗有量——0/0 + 本月已用）
    const modelTable = findNode(mount, (node) => node.tag === "table" && findAll(node, (cell) => cell.tag === "th")[0]?.textContent === ZH["usageReport.colRank"])
    assert.ok(modelTable !== null, "分模型表在册")
    assert.deepEqual(findAll(modelTable, (node) => node.tag === "th").map((cell) => cell.textContent),
      [ZH["usageReport.colRank"], ZH["usage.col.model"], ZH["usageReport.requests"], ZH["usageReport.tokens"], ZH["me.usage.used"]])
    assert.deepEqual(findAll(modelTable, (node) => node.tag === "tr" && node.parent?.tag === "tbody").map((row) => row.children.map(textOf)), [
      ["1", "bailian/qwen3.5-plus", "2", "40", "40"],
      ["2", "bge-m3", "1", "6", "6"],
      ["3", "meta/ghost", "0", "0", "7"],
    ])
    // 明细卡：现件 usageTable + 表尾计数（tfoot）
    const slot = findNode(mount, (node) => node.className === "table-slot")
    assert.ok(slot !== null, "明细表槽在册")
    assert.equal(textOf(findNode(slot, (node) => node.tag === "tfoot")), fill(ZH["common.rowCount"], { count: ROWS.length }))
    assert.ok(shell.last !== null && shell.last.head != null && shell.last.area != null, "dataShell 两段传参")
    assert.ok(findNode(mount, (node) => node.className === "card report-card") !== null, "报表卡 = report-card（上限自滚）")
  })
})

test("腿 B 窗换算/切换：三档 ⇒ `from` ms ∥ 维度切换 = 本地重画（零重取）∥ 清除 = 四控件复位", async () => {
  await withLocation(async () => {
    const { ctx, calls } = pageCtx({
      routes: { "GET /api/me/usage/summary": () => SUMMARY, "GET /api/me/usage": () => ({ rows: ROWS }) },
      state: { member: MEMBER },
    })
    const mount = makeNode("section")
    await ME.renderMeUsage(ctx, mount)
    const lastSummaryUrl = () => new URL(calls.filter(([, path]) => String(path).startsWith("/api/me/usage/summary?")).at(-1)[1], "http://x")
    const dayStart = (offset) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getTime() }
    assert.equal(Number(lastSummaryUrl().searchParams.get("from")), dayStart(-29), "缺省 30 = 服务端缺省窗同构")
    const range = findAll(mount, (node) => node.tag === "select")[0]
    range.value = "7"
    await range.fire("change")
    assert.equal(Number(lastSummaryUrl().searchParams.get("from")), dayStart(-6))
    range.value = "month"
    await range.fire("change")
    const today = new Date()
    assert.equal(Number(lastSummaryUrl().searchParams.get("from")), new Date(today.getFullYear(), today.getMonth(), 1).getTime(), "本月 = 月首")
    // 端点 ∥ 模型（trim）——两读同参
    const endpoint = findAll(mount, (node) => node.tag === "select")[1]
    endpoint.value = "chat"
    await endpoint.fire("change")
    const model = findAll(mount, (node) => node.tag === "input")[0]
    model.value = "  bailian/qwen3.5-plus  "
    await model.fire("change")
    const filtered = lastSummaryUrl()
    assert.deepEqual([filtered.searchParams.get("endpoint"), filtered.searchParams.get("model")], ["chat", "bailian/qwen3.5-plus"])
    const detailUrl = new URL(calls.filter(([, path]) => String(path).startsWith("/api/me/usage?")).at(-1)[1], "http://x")
    assert.deepEqual([detailUrl.searchParams.get("endpoint"), detailUrl.searchParams.get("model"), detailUrl.searchParams.get("from")],
      ["chat", "bailian/qwen3.5-plus", filtered.searchParams.get("from")])
    // 维度切换 = 本地重画（零重取）
    const before = calls.length
    const modelToggle = findAll(mount, (node) => node.tag === "button" && node.textContent === ZH["usage.col.model"])[0]
    await modelToggle.fire("click")
    assert.equal(calls.length, before, "切换零重取")
    const segTitles = findAll(mount, (node) => node.className === "bar-seg").map((seg) => seg.attrs.title)
    assert.ok(segTitles.every((title) => title.includes("bailian/qwen3.5-plus") || title.includes("bge-m3")), "重画 = 模型维序")
    assert.deepEqual(findAll(mount, (node) => node.className === "chart-toggle")[0].children.map((btn) => btn.className), ["tiny", "tiny active"])
    // 清除 = 四控件复位 + 重查
    await findAll(mount, (node) => node.tag === "button" && node.textContent === ZH["me.usage.clear"])[0].fire("click")
    assert.deepEqual([range.value, endpoint.value, model.value], ["30", "", ""])
    const cleared = lastSummaryUrl()
    assert.deepEqual([cleared.searchParams.get("endpoint"), cleared.searchParams.get("model")], [null, null])
  })
})

test("腿 B 殿后行/空错态：月窗有量殿后（端过滤不裁）∥ 空窗 ⇒ trendEmpty/usage.empty ∥ 失败 ⇒ 两区 .hint error", async () => {
  await withLocation(async () => {
    // 殿后行：范围无行而本月有量者殿后（月量降序——端过滤只裁窗表）
    const chatSummary = { ...SUMMARY, byModel: [{ model: "bailian/qwen3.5-plus", requests: 2, totalTokens: 40 }] }
    const tailCtx = pageCtx({
      routes: { "GET /api/me/usage/summary": () => chatSummary, "GET /api/me/usage": () => ({ rows: ROWS }) },
      state: { member: MEMBER },
    })
    const tailMount = makeNode("section")
    await ME.renderMeUsage(tailCtx.ctx, tailMount)
    const modelTable = findNode(tailMount, (node) => node.tag === "table" && findAll(node, (cell) => cell.tag === "th")[0]?.textContent === ZH["usageReport.colRank"])
    assert.deepEqual(findAll(modelTable, (node) => node.tag === "tr" && node.parent?.tag === "tbody").map((row) => row.children.map(textOf)), [
      ["1", "bailian/qwen3.5-plus", "2", "40", "40"],
      ["2", "meta/ghost", "0", "0", "7"],
      ["3", "bge-m3", "0", "0", "6"],
    ])
    const endpoint = findAll(tailMount, (node) => node.tag === "select")[1]
    endpoint.value = "chat" // 端过滤重查 ⇒ 殿后行照显（0/0 + 本月已用）
    await endpoint.fire("change")
    assert.ok(textOf(tailMount).includes("meta/ghost") && textOf(tailMount).includes("bge-m3"), "端过滤不裁殿后行")
    // 空窗：totals 0 ⇒ 主图空态 ∥ 分模型空 ⇒ usage.empty（零错）
    const emptyCtx = pageCtx({
      routes: {
        "GET /api/me/usage/summary": () => ({ totals: { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 }, trend: [{ day: DAYS[2], requests: 0, totalTokens: 0 }], trendByEndpoint: [], trendByModel: [], byModel: [] }),
        "GET /api/me/usage": () => ({ rows: [] }),
      },
      state: { member: { ...MEMBER, modelUsage: {} } },
    })
    const emptyMount = makeNode("section")
    await ME.renderMeUsage(emptyCtx.ctx, emptyMount)
    assert.ok(textOf(emptyMount).includes(ZH["usageReport.trendEmpty"]), "主图空态")
    assert.ok(textOf(emptyMount).includes(ZH["usage.empty"]), "分模型空态")
    assert.equal(findNode(emptyMount, (node) => node.tag === "tfoot"), null, "空集零表（无 tfoot）")
    assert.ok(!emptyCtx.calls.some(([kind]) => kind === "fail"), "空集零错")
    // 失败 ⇒ ctx.fail + 两区各 `.hint error`（零表）
    const broken = pageCtx({
      routes: { "GET /api/me/usage/summary": () => { throw new Error("boom") }, "GET /api/me/usage": () => { throw new Error("boom") } },
      state: { member: MEMBER },
    })
    const brokenMount = makeNode("section")
    await ME.renderMeUsage(broken.ctx, brokenMount)
    assert.ok(broken.calls.some(([kind]) => kind === "fail"), "失败收口 ctx.fail")
    assert.equal(findAll(brokenMount, (node) => node.className === "hint error").length, 2, "两区各一错态")
    assert.equal(findNode(brokenMount, (node) => node.tag === "table"), null, "错态无表")
  })
})

// ── 腿 C（样式与键集）───────────────────────────────────────────────────────

const CSS = readPublic("style.css")
const CSS_CLEAN = CSS.replace(/\/\*[\s\S]*?\*\//g, "")
const CSS_RULES = [...CSS_CLEAN.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, " "), body: m[2].trim().replace(/\s+/g, " ") }))
const cssRule = (selector) => CSS_RULES.find((rule) => rule.selector === selector) ?? null

test("腿 C 样式：堆叠段件/切换/图例在册 ∥ 链行随正 ∥ 零新 :root 变量 ∥ 零新悬停规则", () => {
  for (const selector of [".bar-stacked", ".bar-seg", ".bar-swatch", ".chart-toggle", ".chart-toggle .active", ".bar-legend"]) {
    assert.ok(cssRule(selector) !== null, `新面缺位：${selector}`)
  }
  assert.ok(cssRule(".bar-seg").body.includes("background: var(--accent)"), "段色 = --accent 单源")
  assert.ok(cssRule(".bar-swatch").body.includes("background: var(--accent)"), "图例点 = --accent")
  const area = cssRule(".page-area")
  assert.ok(area !== null && area.body.includes("gap: var(--sp-6)"), ".page-area 缺 gap（多卡壳页）")
  const report = cssRule(".page-area > .card.report-card")
  assert.ok(report !== null, "report-card 规则缺位")
  for (const decl of ["flex: none", "max-height: 55%", "overflow-y: auto"]) assert.ok(report.body.includes(decl), `report-card 缺声明：${decl}`)
  // AC-19 canon 不破：`:root` 38 ∥ 悬停清单七条（本批零新增）
  const rootMatch = CSS_CLEAN.match(/:root\s*\{[^{}]*\}/)
  assert.equal([...rootMatch[0].matchAll(/(--[\w-]+)\s*:/g)].length, 38, ":root 变量族计数（零新增）")
  const HOVER = ["button.danger:hover", "button.link:hover", "button.tiny:hover", "button:hover", ".modal-close:hover", ".nav-item:hover", "tbody tr:hover"]
  assert.deepEqual(CSS_RULES.filter((rule) => rule.selector.includes(":hover")).map((rule) => rule.selector).sort(), [...HOVER].sort(), "悬停声明清单外残留")
  // 段色阶梯 = 内联透明度（档面无新颜色字面量——`--accent` 单源）
  assert.ok(readPublic("views-me.mjs").includes("const BAR_ALPHA = [1, 0.7, 0.45, 0.3]"), "段色阶梯在册")
})

const NEW_KEYS = [
  "me.usage.range", "me.usage.range7", "me.usage.range30", "me.usage.rangeMonth",
  "me.usage.clear", "me.usage.modelPh", "me.usage.used", "me.usage.kpiSplit",
]
const SELF_NAMES = ["lang.zh", "lang.en"]
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")

test("腿 C 键集：+8 两表同步 ∥ `me.usage.summary` 退役零残留 ∥ 基键集双向相等 ∥ t 引用闭合", () => {
  for (const key of NEW_KEYS) {
    assert.ok(key in ZH && key in EN, `本批键缺位：${key}`)
    assert.ok(ZH[key].trim().length > 0 && EN[key].trim().length > 0, `空值键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
    assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  }
  assert.equal("me.usage.summary" in ZH || "me.usage.summary" in EN, false, "退役键残留")
  for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") || item === "index.html")) {
    assert.equal(readPublic(name).includes("me.usage.summary"), false, `${name} 残留退役键`)
  }
  const baseKeys = (table) => Object.keys(table).filter((key) => !SELF_NAMES.includes(key) && !key.endsWith(".one")).sort()
  assert.deepEqual(baseKeys(ZH), baseKeys(EN), "两表基键集双向相等")
  for (const key of Object.keys(EN).filter((item) => item.endsWith(".one"))) assert.ok(!(key in ZH), `zh 表含 .one 变体：${key}`)
  const refs = []
  for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") && !["i18n-zh.mjs", "i18n-en.mjs"].includes(item))) {
    for (const match of readPublic(name).matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 150, `t 字面量过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) assert.ok(key in ZH && key in EN, `${name} 引用悬空键：${key}`)
  const meSrc = readPublic("views-me.mjs")
  for (const key of NEW_KEYS) assert.ok(meSrc.includes(`t("${key}"`), `消费缺位：${key}`)
})

test("腿 C 面：`statCard` 导出 ∥ `views-me` 内容行 ≤300 ∥ 零外部引用 ∥ 导出面不设", () => {
  assert.match(readPublic("views-overview.mjs"), /export function statCard\(h, label, \.\.\.content\)/, "statCard 未导出")
  const meSrc = readPublic("views-me.mjs")
  const lines = meSrc.split("\n").length - (meSrc.endsWith("\n") ? 1 : 0)
  assert.ok(lines <= 300, `views-me 内容行 ≤300（实 = ${lines}；越线 ⇒ 拆分预案：views-me-usage.mjs）`)
  for (const name of ["views-me.mjs", "style.css"]) {
    const text = readPublic(name)
    assert.ok(!/https?:\/\//.test(text), `${name} 含外部链接（零依赖/内网自洽）`)
    assert.ok(!/@import/.test(text), `${name} 含 @import`)
  }
  assert.ok(meSrc.includes("Promise.all"), "两读同拍（Promise.all）在册")
  assert.equal(meSrc.includes("/api/usage/export"), false, "本人面导出不设（判否——§2.3⑦）")
})
