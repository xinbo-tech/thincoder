/**
 * views-rail-actions.test.mjs — E-3 左列**行控件与换形面**用例（U53 —— 原住 `thincoder-desktop/test/views.test.mjs`；
 * `docs/desktop/design/UI.md` §1 左列会话行（批 A ④）· `docs/desktop/design/RENDERER.md` §1.1 接线形通则）：
 * 会话行两锚（行 ⇒ `session:switch` 携本键 ∧ 空态 ⇒ `session:create` 入口）· 行内两控件（改名 / 删除）·
 * 行原位换形（改名形 [文本控件, 取消, 确认] ∥ 删除形 [行控件, 取消, 确认]）· 形面拒收 · 行动作四禁（源面零命中）。
 * 拆档理由 = 档行预算（`docs/desktop/design/PROJECT.md` §4.1「300 行 = 主动拆分层」—— R3c 元数据族原址补例
 * 使 `views.test.mjs` 越层 ⇒ 拆本族为独立档；面不变、判据不变，只换宿主档 —— 先例 = 批 7 / 批 B 两轮拆分）。
 * 纪律：本档只读源 + 调纯函数（`railModel` / `railTree`）——**不触 DOM**（挂载面走查随人工）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { t } from "../renderer/i18n.mjs"
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

/** 剥注释（块 / 行 / HTML）：源码机检看**声明点**——注释行含同字样（不剥即假计）。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

/** 载荷行夹具（字段集 = 批档 §2.4（e） + R3c `provider`——行元数据族三值行载面）。 */
const row = (slot, over = {}) => ({
  slot, title: `标题${slot}`, createdBy: "desktop", updatedAt: 1, messageCount: 0, provider: "p1:m1", isActive: false, ...over,
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

// ─── U211「对齐第三批」末项删除门（P12 渲染半 —— 双闸另一半 = 主侧 `session:delete` 末项拒）──

test("U211: 「对齐第三批」末项删除门（渲染半）—— 会话数 > 1 才落删除控件 ∧ 单会话 / 零会话零控件 ∧ 改名面零动", () => {
  const handlers = { onDelete: () => {}, onRename: () => {} }
  const deletes = (rows) => nodes(railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows }), handlers))
    .filter((node) => node.props?.["data-action"] === "session:delete")
  const renames = (rows) => nodes(railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows }), handlers))
    .filter((node) => node.props?.["data-action"] === "session:rename")

  assert.equal(deletes([row(1)]).length, 0, "单会话 ⇒ 零删除控件（行控件仍归位）")
  assert.equal(renames([row(1)]).length, 1, "单会话 ⇒ 改名控件不受门（两控不同命）")
  assert.deepEqual(
    nodes(railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1)] }), handlers))
      .filter((node) => node.tag === "button").map((node) => node.props["data-action"]),
    ["session:switch", "session:rename"],
    "单会话常态行 = [行, 改名]（删除位不落空控件）",
  )
  assert.equal(deletes([row(1), row(2)]).length, 2, "两会话 ⇒ 每行一枚删除控件（判据 = 会话数 > 1，非常态行面）")
  assert.equal(deletes([row(1), row(2), row(3)]).length, 3, "三会话 ⇒ 同判据（与行数同阶）")
  assert.equal(deletes([]).length, 0, "零会话（empty 态）⇒ 零删除控件（零行面）")

  // 单会话 + 删除形（防御面：形态入参本身不扞门 —— 常态控作已不在场 ⇒ 无入口可达）
  const singleForm = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1)] }), handlers, { key: "1", mode: "delete" })
  assert.equal(nodes(singleForm).some((node) => node.props["data-form"] === "delete"), true, "形面入参直落（树形只随入参形变 —— 门只管常态入口）")
})
