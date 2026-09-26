/**
 * views.test.mjs — E-2 / E-3 左列用例（批档 §2.5 U39–U44 + 本批新增 U53 · `docs/desktop/design/RENDERER.md` §1.1 ·
 * `docs/desktop/design/UI.md` §1 左列会话行 / 启动态 / 空态 / 断点 / i18n 行）：
 * 左列三态判定（纯函数脱 DOM）/ 启动态树（零会话行）/ 来源端三态 / 标题缺省 / 折叠常量单源 / 词表键齐零硬编码 /
 * 会话行两锚（U53：行 ⇒ `session:switch` 携本键 ∧ 空态 ⇒ `session:create` 入口）。
 * 拆档（批档 §2.11 第 3 条预案 + 档行预算）：标签条面 `thincoder-desktop/test/views-tabbar.test.mjs`
 * （U45–U48 + U54 / U55）· 中区外壳面 `thincoder-desktop/test/views-chrome.test.mjs`（U49–U51）·
 * 零回归锁面 `thincoder-desktop/test/views-locks.test.mjs`（U52）。
 * 纪律：本档只读源 + 调纯函数（`railModel` / `railTree`）——**不触 DOM**（挂载面走查随人工 ·
 * `docs/desktop/design/PROJECT.md` §4.1 三分落点）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { HOST_DICT, initDict, t } from "../renderer/i18n.mjs"
import { railModel, railTree } from "../renderer/views/sessions.mjs"

/** 树遍历（深度优先 · 保序）：节点集 / 叶文本集共用 —— `asText` 切换收集面（`null` 空位不入）。 */
function walk(tree, asText) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      if (!asText) out.push(child)
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      return
    }
    if (asText) out.push(String(child))
  }
  visit(tree)
  return out
}

const nodes = (tree) => walk(tree, false)
const texts = (tree) => walk(tree, true)

/** 剥注释（块 / 行 / HTML）：源码机检看**声明点**——`styles.css` 断点前的注释行含同字样（不剥即假计）。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

/** 折叠常量扫描式（批档 §2.13 第 1 条：`\b900\b` 否决——`900px` 的 `0|p` 之间无词边界）。 */
const countBreakpoint = (source) => [...source.matchAll(/(?<![0-9A-Za-z_])900(?:px)?(?![0-9A-Za-z_])/g)].length

/** 载荷行夹具（字段集 = 批档 §2.4（e））。 */
const row = (slot, over = {}) => ({
  slot, title: `标题${slot}`, createdBy: "desktop", updatedAt: 1, messageCount: 0, isActive: false, ...over,
})

// ─── U39 三态判定（boot / empty / list）────────────────────────

test("U39: 左列三态判定 + 树根 data-state 同名", () => {
  const cases = [
    ["boot", { projectCwd: null, recent: [], rows: [] }],
    ["empty", { projectCwd: "C:\\proj", recent: [], rows: [] }],
    ["list", { projectCwd: "C:\\proj", recent: [], rows: [row(1)] }],
  ]
  for (const [expected, input] of cases) {
    const model = railModel(input)
    assert.equal(model.state, expected, `态判定（入参 cwd=${input.projectCwd} rows=${input.rows.length}）`)
    assert.equal(railTree(model).props["data-state"], expected, "树根 data-state = 态（机读锚）")
  }
  assert.equal(railModel().state, "boot", "空入参 ⇒ boot（零 cwd）")
})

// ─── U40 启动态树（入口 + 最近目录序 · 零会话行）──────────────────

test("U40: 启动态树（project:open 入口 ∧ 最近目录序 = 输入序 ∧ 零会话行）", () => {
  const recent = [{ cwd: "C:\\r1", mtimeMs: 3 }, { cwd: "C:\\r2", mtimeMs: 2 }]
  const tree = railTree(railModel({ projectCwd: null, recent, rows: [] }))
  const all = nodes(tree)
  const open = all.filter((node) => node.props?.["data-action"] === "project:open")
  assert.equal(open.length, 1 + recent.length, "启动入口 1 + 最近项逐条（同动作面）")
  assert.deepEqual(open[0].children, [t("rail.action.openDir")], "入口文案 = 词表键值")
  assert.ok(texts(tree).includes(t("rail.recent.title")), "最近目录区标题 = 词表键值")
  const items = all.find((node) => node.props?.["data-list"] === "recent").children
  assert.deepEqual(items.map((li) => li.children[0].props["data-path"]), ["C:\\r1", "C:\\r2"], "最近目录序 = 输入序")
  assert.equal(all.filter((node) => node.props?.class === "rail-row").length, 0, "零会话行")
  assert.equal(all.some((node) => node.props?.["data-list"] === "sessions"), false, "零会话列表容器")
  assert.equal(all.some((node) => node.props?.["data-action"] === "session:switch"), false, "零会话行动作（会话行动作码 = session:switch）")
})

// ─── U41 来源端三态（三值带标 · 缺键 / 未知无标）─────────────────

test("U41: 来源端三态（cli / vscode / desktop 带标 ∧ \"\" / 未知值 无标）", () => {
  const rows = [
    row(1, { createdBy: "cli" }), row(2, { createdBy: "vscode" }), row(3, { createdBy: "desktop" }),
    row(4, { createdBy: "" }), row(5, { createdBy: "weird" }),
  ]
  const tree = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows }))
  const all = nodes(tree)
  const rowNodes = all.filter((node) => node.props?.class === "rail-row")
  assert.deepEqual(rowNodes.map((node) => node.props["data-slot"]), ["1", "2", "3", "4", "5"], "行序 = 输入序")
  const marks = all.filter((node) => node.props?.class === "rail-origin")
  assert.deepEqual(marks.map((node) => node.props["data-origin"]), ["cli", "vscode", "desktop"], "三值各带标（序 = 行序）")
  assert.deepEqual(marks.map((node) => node.children[0]), ["cli", "vscode", "desktop"].map((v) => t(`origin.${v}`)), "标文案 = 词表键值")
  const markCount = (node) => node.children.filter((child) => child !== null && child?.props?.class === "rail-origin").length
  assert.equal(markCount(rowNodes[3]), 0, "缺键（\"\"）⇒ 无标节点")
  assert.equal(markCount(rowNodes[4]), 0, "未知值 ⇒ 无标节点（不猜测）")
})

// ─── U42 标题缺省 ─────────────────────────────────────────────

test("U42: 标题缺省（title 空 ⇒ 词表缺省词 · 非空串）", () => {
  const tree = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1, { title: "" })] }))
  const titleNode = nodes(tree).find((node) => node.props?.class === "rail-row-title")
  assert.deepEqual(titleNode.children, [t("rail.session.untitled")], "缺省词 = 词表键值（非键名回落）")
  assert.equal(titleNode.children[0], t("rail.session.untitled"), "文案非空")
})

// ─── U43 折叠常量单源 ─────────────────────────────────────────

test("U43: 折叠常量单源（命中 ⊆ styles.css ∧ 非注释恰 1 ∧ 渲染面零 matchMedia）", () => {
  const root = fileURLToPath(new URL("../renderer/", import.meta.url))
  const files = []
  const walkFiles = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walkFiles(path)
      else files.push(path)
    }
  }
  walkFiles(root)
  assert.ok(files.length > 0, "渲染面档集合非空（扫描面成立）")
  const raw = []
  const code = []
  for (const file of files) {
    const source = readFileSync(file, "utf8")
    if (countBreakpoint(source) > 0) raw.push(file)
    for (let i = 0; i < countBreakpoint(stripComments(source)); i++) code.push(file)
  }
  assert.deepEqual(raw, [join(root, "styles.css")], "常量命中只住 styles.css 一处（含注释面）")
  assert.deepEqual(code, [join(root, "styles.css")], "非注释命中恰 1（断点声明本身）")
  for (const file of files.filter((name) => name.endsWith(".mjs"))) {
    assert.ok(!readFileSync(file, "utf8").includes("matchMedia"), `渲染面零 matchMedia：${file}`)
  }
})

// ─── U44 词表键齐 ∧ 零硬编码 ──────────────────────────────────

test("U44: 词表键齐 ∧ 零硬编码（两语键集相等 ∧ 十键用量 ∧ 树文本全哨兵 ∧ 视图档零 CJK）", (ctx) => {
  const keys = Object.keys(HOST_DICT.en)
  assert.deepEqual([...keys].sort(), [...Object.keys(HOST_DICT.zh)].sort(), "两语键集相等")
  const railKeys = [
    "rail.action.openDir", "rail.recent.title", "rail.sessions.title", "rail.project.none", "rail.empty.hint",
    "rail.action.newSession", "rail.session.untitled", "origin.cli", "origin.vscode", "origin.desktop",
  ]
  for (const key of railKeys) assert.ok(keys.includes(key), `词表含左列键 ${key}`)

  const sentinel = (key) => `⟦${key}⟧`
  initDict({ locale: "en", host: Object.fromEntries(railKeys.map((key) => [key, sentinel(key)])) })
  ctx.after(() => initDict({})) // 复位缝（宿主表缺省 = HOST_DICT）
  const trees = [
    railTree(railModel({ projectCwd: null, recent: [{ cwd: "C:\\r1" }], rows: [] })),
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [] })),
    railTree(railModel({
      projectCwd: "C:\\proj", recent: [],
      rows: [row(1, { title: "", createdBy: "cli" }), row(2, { createdBy: "vscode" }), row(3, { createdBy: "desktop" })],
    })),
  ]
  const data = new Set(["C:\\r1", "C:\\proj", "标题2", "标题3"])
  const used = new Set()
  for (const tree of trees) {
    for (const text of texts(tree)) {
      if (text.startsWith("⟦") && text.endsWith("⟧")) { used.add(text.slice(1, -1)); continue }
      assert.ok(data.has(text), `树内文本须为词表键值或数据串（实 = ${text}）`)
    }
  }
  assert.deepEqual([...used].sort(), [...railKeys].sort(), "十键全被左列消费（键齐 = 用量面）")

  const view = stripComments(readFileSync(new URL("../renderer/views/sessions.mjs", import.meta.url), "utf8"))
  assert.ok(!/\p{Script=Han}/u.test(view), "视图档源零 CJK（面向用户文案全经 t()）")
})

// ─── U53 会话行两锚（左列接线面 · 批档 §2.12 第 2 / 8 条）──────────────

test("U53: 会话行两锚（行 ⇒ session:switch 携本键 ∧ 空态 ⇒ session:create 入口）", () => {
  const seen = []
  const handlers = { onSession: (key) => seen.push(key), onNewSession: () => seen.push("new") }
  const tree = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1), row(2)] }), handlers)
  const rows = nodes(tree).filter((node) => node.props?.class === "rail-row")
  assert.deepEqual(rows.map((node) => node.props["data-action"]), ["session:switch", "session:switch"], "行动作 = session:switch（激活并成标签 —— 与标签激活同一路）")
  assert.deepEqual(rows.map((node) => node.props["data-slot"]), ["1", "2"], "行携本键 data-slot")
  assert.ok(rows.every((node) => typeof node.props["data-slot"] === "string"), "键域 = 串（与标签键同域 —— 通道载荷回代归 app.mjs）")
  assert.ok(rows.every((node) => "disabled" in node.props === false), "handlers 给 ⇒ 无 disabled（接线形通则 —— 诚实非死控）")
  for (const node of rows) node.props.onClick()
  assert.deepEqual(seen, ["1", "2"], "点击回代本行键（序 = 行序）")

  const empty = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [] }), handlers)
  const entry = nodes(empty).find((node) => node.props?.["data-action"] === "session:create")
  assert.ok(entry, "空态新建入口在位（`session:create` 锚）")
  assert.deepEqual(entry.children, [t("rail.action.newSession")], "入口文案 = 词表键值（与标签条新建控件同键 —— 同一事实同词）")
  assert.equal("disabled" in entry.props, false, "handlers 给 ⇒ 无 disabled")
  entry.props.onClick()
  assert.deepEqual(seen, ["1", "2", "new"], "空态入口回代 onNewSession（树面零通道细节 —— 通道名归 app.mjs）")
})
