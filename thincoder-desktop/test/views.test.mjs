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

test("U44: 词表键齐 ∧ 零硬编码（两语键集相等 ∧ 十三键用量 ∧ 树文本 / 控件词面全哨兵 ∧ 视图档零 CJK）", (ctx) => {
  const keys = Object.keys(HOST_DICT.en)
  assert.deepEqual([...keys].sort(), [...Object.keys(HOST_DICT.zh)].sort(), "两语键集相等")
  const railKeys = [
    "rail.action.openDir", "rail.recent.title", "rail.sessions.title", "rail.project.none", "rail.empty.hint",
    "rail.action.newSession", "rail.session.untitled", "rail.action.rename", "rail.action.delete", "rail.action.cancel",
    "origin.cli", "origin.vscode", "origin.desktop",
  ]
  for (const key of railKeys) assert.ok(keys.includes(key), `词表含左列键 ${key}`)

  const sentinel = (key) => `⟦${key}⟧`
  initDict({ locale: "en", host: Object.fromEntries(railKeys.map((key) => [key, sentinel(key)])) })
  ctx.after(() => initDict({})) // 复位缝（宿主表缺省 = HOST_DICT）
  const rows = [row(1, { title: "", createdBy: "cli" }), row(2, { createdBy: "vscode" }), row(3, { createdBy: "desktop" })]
  const list = railModel({ projectCwd: "C:\\proj", recent: [], rows })
  const trees = [
    railTree(railModel({ projectCwd: null, recent: [{ cwd: "C:\\r1" }], rows: [] })),
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [] })),
    railTree(list),
    // 换形两面（批 A ④）：取消键只在形面在场 ⇒ 两形各一树（词面消费面 = 键齐判据）
    railTree(list, {}, { key: "2", mode: "rename" }),
    railTree(list, {}, { key: "2", mode: "delete" }),
  ]
  const data = new Set(["C:\\r1", "C:\\proj", "标题2", "标题3"])
  const used = new Set()
  for (const tree of trees) {
    for (const text of texts(tree)) {
      if (text.startsWith("⟦") && text.endsWith("⟧")) { used.add(text.slice(1, -1)); continue }
      assert.ok(data.has(text), `树内文本须为词表键值或数据串（实 = ${text}）`)
    }
    // 控件词面面（aria-label —— 图标控件与文本控件）：同上须为词表键值（裸串 = 硬编码面）
    for (const node of nodes(tree)) {
      const label = node.props?.["aria-label"]
      if (label === undefined) continue
      assert.ok(label.startsWith("⟦") && label.endsWith("⟧"), `控件词面须为词表键值（实 = ${label}）`)
      used.add(label.slice(1, -1))
    }
  }
  assert.deepEqual([...used].sort(), [...railKeys].sort(), "十三键全被左列消费（键齐 = 用量面 —— 含两动作键 / 取消键的控件词面）")

  const view = stripComments(readFileSync(new URL("../renderer/views/sessions.mjs", import.meta.url), "utf8"))
  assert.ok(!/\p{Script=Han}/u.test(view), "视图档源零 CJK（面向用户文案全经 t()）")
})

// ─── U53 会话行两锚 ∧ 行内两控件与行原位换形（左列接线面 · 批档 §2.12 第 2 / 8 条 · §2.4 ④）──

test("U53: 会话行两锚 + 行内两控件与行原位换形（行 ⇒ session:switch 携本键 ∧ 空态 ⇒ session:create 入口 ∧ ④ 两控件 / 两形）", () => {
  const seen = []
  const handlers = { onSession: (key) => seen.push(key), onNewSession: () => seen.push("new") }
  const tree = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1), row(2)] }), handlers)
  const rows = nodes(tree).filter((node) => node.props?.class === "rail-row")
  assert.deepEqual(rows.map((node) => node.props["data-action"]), ["session:switch", "session:switch"], "行动作 = session:switch（激活并成标签 —— 与标签激活同一路）")
  assert.deepEqual(rows.map((node) => node.props["data-slot"]), ["1", "2"], "行携本键 data-slot")
  assert.ok(rows.every((node) => typeof node.props["data-slot"] === "string"), "键域 = 串（与标签键同域 —— 通道载荷回代归 mount-sessions.mjs）")
  assert.ok(rows.every((node) => "disabled" in node.props === false), "handlers 给 ⇒ 无 disabled（接线形通则 —— 诚实非死控）")
  for (const node of rows) node.props.onClick()
  assert.deepEqual(seen, ["1", "2"], "点击回代本行键（序 = 行序）")

  const empty = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [] }), handlers)
  const entry = nodes(empty).find((node) => node.props?.["data-action"] === "session:create")
  assert.ok(entry, "空态新建入口在位（`session:create` 锚）")
  assert.deepEqual(entry.children, [t("rail.action.newSession")], "入口文案 = 词表键值（与标签条新建控件同键 —— 同一事实同词）")
  assert.equal("disabled" in entry.props, false, "handlers 给 ⇒ 无 disabled")
  entry.props.onClick()
  assert.deepEqual(seen, ["1", "2", "new"], "空态入口回代 onNewSession（树面零通道细节 —— 通道名归 mount-sessions.mjs）")

  // ─── ④ 行内两控件（常态）与行原位换形（批 A · `docs/desktop/design/UI.md` §1 左列会话行）───
  const byAction = (root, action) => nodes(root).filter((node) => node.props?.["data-action"] === action)
  const rowItems = (root) => nodes(root).filter((node) => node.props?.class === "rail-item")
  const [item1] = rowItems(tree)
  assert.deepEqual(
    nodes(item1).filter((node) => node.tag === "button").map((node) => node.props["data-action"]),
    ["session:switch", "session:rename", "session:delete"],
    "常态行控制序 = [行, 改名, 删除]（两控件住行末）",
  )
  const icons = nodes(tree).filter((node) => ["session:rename", "session:delete"].includes(node.props?.["data-action"]))
  assert.deepEqual(icons.map((node) => node.props["data-slot"]), ["1", "1", "2", "2"], "两控件携本行键（键域 = 行 data-slot 同域）")
  assert.deepEqual(
    icons.map((node) => node.props["aria-label"]),
    [t("rail.action.rename"), t("rail.action.delete"), t("rail.action.rename"), t("rail.action.delete")],
    "图标控件词面经 aria-label = 词表键值（字形住 styles.css —— 视图档零字形字面）",
  )
  assert.ok(icons.every((node) => node.children === undefined), "图标控件零文本子（机读面 = 名字面）")
  assert.ok(icons.every((node) => node.props.disabled === true), "缺 onRename / onDelete ⇒ 两控件 disabled（诚实非死控 —— 树形只随 handlers 变）")

  const wired = {
    onSession: (key) => seen.push(`switch:${key}`),
    onRename: (key) => seen.push(`rename:${key}`),
    onDelete: (key) => seen.push(`delete:${key}`),
    onRenameCancel: (key) => seen.push(`rename-cancel:${key}`),
    onRenameConfirm: (key) => seen.push(`rename-confirm:${key}`),
    onDeleteCancel: (key) => seen.push(`delete-cancel:${key}`),
    onDeleteConfirm: (key) => seen.push(`delete-confirm:${key}`),
  }
  const list = railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1), row(2)] })
  const wiredIcons = byAction(railTree(list, wired), "session:rename")
  assert.ok(wiredIcons.every((node) => "disabled" in node.props === false), "handlers 给 ⇒ 两控件无 disabled")
  wiredIcons[0].props.onClick()
  assert.deepEqual(seen.slice(-1), ["rename:1"], "行控件回代本行键（键面归树面，通道归接线面）")

  // 改名形：子序 [文本控件, 取消, 确认]（行按钮原位退出 —— 编辑对象即行内容，活性与编辑面不同处）
  const [plainItem, renameItem] = rowItems(railTree(list, wired, { key: "2", mode: "rename" }))
  assert.equal(renameItem.props["data-form"], "rename", "在形行 ⇒ data-form 机读锚 = 形名")
  assert.equal(plainItem.props["data-form"], undefined, "未在形行 ⇒ 无 data-form（在形面只及本键）")
  const renameButtons = nodes(renameItem).filter((node) => node.tag === "button")
  assert.deepEqual(
    renameButtons.map((node) => node.props["data-action"]),
    ["session:rename-cancel", "session:rename-confirm"],
    "改名形控制序 = [取消, 确认]（行按钮原位退出 ⇒ 全行零 session:switch）",
  )
  assert.deepEqual(renameButtons.map((node) => node.props.class), ["rail-cancel", "rail-confirm"], "两键 class 锚（框外两形同形 —— 沿关闭确认面）")
  assert.deepEqual(renameButtons.map((node) => node.children), [[t("rail.action.cancel")], [t("rail.action.rename")]], "两键词面 = 文本按钮（确认键 = 本条动作词同键 —— 同一事实同词）")
  assert.deepEqual(renameButtons.map((node) => node.props["data-slot"] ?? null), [null, "2"], "确认键携本键 · 取消键零键（清形态无对象 —— 判据单源 = store）")
  const renameText = nodes(renameItem).find((node) => node.tag === "input")
  assert.equal(renameText.props["data-action"], "session:rename-input", "改名形 = 文本控件（行原位换形）")
  assert.equal(renameText.props.value, "标题2", "文本控件值 = 行标题原值（行标题面投影，控件不造词）")
  assert.equal(renameText.props["aria-label"], t("rail.action.rename"), "文本控件词面同键同词")
  assert.deepEqual(texts(renameItem), [t("rail.action.cancel"), t("rail.action.rename")], "改名形全行文本 = 两键词面（行标题只落控件值，不另落文本）")
  for (const node of renameButtons) node.props.onClick()
  assert.deepEqual(seen.slice(-2), ["rename-cancel:2", "rename-confirm:2"], "两键回代本行键")

  // 删除形：子序 [行控件, 取消, 确认]（行控件在位 —— 沿关闭确认面同形）
  const deleteItem = rowItems(railTree(list, wired, { key: "2", mode: "delete" }))[1]
  assert.equal(deleteItem.props["data-form"], "delete", "在形行 ⇒ data-form = delete")
  assert.deepEqual(
    nodes(deleteItem).filter((node) => node.tag === "button").map((node) => node.props["data-action"]),
    ["session:switch", "session:delete-cancel", "session:delete-confirm"],
    "删除形控制序 = [行控件, 取消, 确认]（两形差别只在首子）",
  )
  assert.ok(texts(deleteItem).includes("标题2"), "删除形行控件携行标题（对象名在场 —— 决策面不悬空）")
  assert.equal(byAction(deleteItem, "session:rename").length + byAction(deleteItem, "session:delete").length, 0, "在形 ⇒ 常态两控件不在场（两态互斥）")

  // 形面拒收（形缺省 / 未知 mode / 键不在册）：落常态（零在形锚 —— 树形只随入参形变）
  for (const form of [null, { key: "2", mode: "weird" }, { key: "9", mode: "rename" }]) {
    const plain = railTree(list, wired, form)
    assert.equal(nodes(plain).some((node) => node.props["data-form"] !== undefined), false, `形不合法 ⇒ 零在形锚（form=${JSON.stringify(form)}）`)
    assert.equal(byAction(plain, "session:rename").length, 2, "形不合法 ⇒ 常态两控件照旧")
  }

  // 四禁（④ 判据面 —— `docs/desktop/design/UI.md` §1 左列会话行）：树面 / 接线面两档皆零命中
  for (const file of ["../renderer/views/sessions.mjs", "../renderer/mount-sessions.mjs"]) {
    const source = stripComments(readFileSync(new URL(file, import.meta.url), "utf8"))
    for (const banned of [/\bwindow\.prompt\b/, /\bwindow\.confirm\b/, /<dialog/i, /\bsetTimeout\b/]) {
      assert.ok(!banned.test(source), `行动作四禁之一落空：${file} :: ${banned}`)
    }
  }
})
