/**
 * views-tabbar.test.mjs — E-1 标签条用例（批档 §2.5 U45–U48 + 本批新增 U54 / U55 · 拆分预案 §2.11 第 3 条 ·
 * `docs/desktop/design/UI.md` §1 标签条行 / 交互行 · §2 项 2）：三态 + 根锚 / 位标四值 + 空闲零节点 / 标题缺省 /
 * 接线形两态 + 零字形 + 样式面常量单源 / 标签接线携键（U54）/ 关闭确认面两态两键（U55）。
 * 纪律：本档只读源 + 调纯函数（`tabbarModel` / `tabbarTree`）——**不触 DOM**（`docs/desktop/design/RENDERER.md`
 * §1.1：挂载函数不进自动面 ⇒ 挂载 / 横滚 / 渐隐 / `inert` 运行时面随人工走查）；「重挂可重入」由**树面重入等价**
 * （同输入两次构树 · 归一后结构相等）承载。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { initDict, t } from "../renderer/i18n.mjs"
import { BADGE_WORD, tabbarModel, tabbarTree } from "../renderer/views/sessions.mjs"

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

/** 接线形归一（两态等价比较用）：`onClick` / `disabled` 两键**折出**、余形全等 ⇒ 比的正是"其余形"。
 * `assert.deepStrictEqual` 对两个不同的箭头函数判不等 ⇒ 两态比较前先归一化（批档 §2.12 第 8 条）；
 * 两态自身（`onClick` 有无 / `disabled` 真值）由 U48 逐控断言承载，不入本归一。 */
const shapeTree = (tree) => nodes(tree).map((node) => {
  const { onClick, disabled, ...rest } = node.props
  return { props: rest, text: node.children.filter((kid) => typeof kid === "string") }
})

/** 剥注释（块 / 行 / HTML）—— 机检看声明点，注释面不假计（与 `test/views.test.mjs` 同式）。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

/** 字面量内容抽取（极简词法游走：注释剔除 · 字符串 / 模板字面量入集）—— U48 字形扫描只看**字面量位**
 *  （算符位不扫 · 批档 §2.11 第 6 条）。模板字面量 `${}` 内 = 代码位 ⇒ 配平跳过不入集。
 *  扫描域为**字面量内容**：转义符折成其一字符；`.mjs` 本题材无跨行字面量；假设 = 被扫两档无正则字面量
 *  （含引号的正则会误起字面量扫描）—— 假设失效时先改本游走再信结论。 */
function literalContents(source) {
  const out = []
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (ch === "/" && source[i + 1] === "/") {
      i += 2
      while (i < source.length && source[i] !== "\n") i += 1
      continue
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i += 1
      i += 2
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch
      let buffer = ""
      i += 1
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") {
          buffer += source[i + 1] ?? ""
          i += 2
          continue
        }
        if (quote === "`" && source[i] === "$" && source[i + 1] === "{") {
          i += 2
          let depth = 1
          while (i < source.length && depth > 0) {
            if (source[i] === "{") depth += 1
            else if (source[i] === "}") depth -= 1
            i += 1
          }
          continue
        }
        buffer += source[i]
        i += 1
      }
      i += 1
      out.push(buffer)
      continue
    }
    i += 1
  }
  return out
}

/** 出现次数（含注释面 / 剥注释面两读共此式）。 */
const countOf = (source, token) => source.split(token).length - 1

/** 渲染面档集合（U43 同式：递归收集 —— 常量面机检的扫描域）。 */
function rendererFiles() {
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
  return { root, files }
}

/** 标签节点集（序 = 树序 = 标签序）。 */
const tabItems = (tree) => nodes(tree).filter((node) => node.props?.class === "tabbar-item")

/** 载荷行夹具（字段集 = 批档 §2.4（e））。 */
const row = (slot, over = {}) => ({
  slot, title: `标题${slot}`, createdBy: "desktop", updatedAt: 1, messageCount: 0, isActive: false, ...over,
})

/** 词表哨兵缝（宿主表 + 核投影两注入面；`ctx.after` 复位）。 */
function useSentinels(ctx, hostKeys, dictKeys = []) {
  const sentinel = (key) => `⟦${key}⟧`
  initDict({
    locale: "en",
    host: Object.fromEntries(hostKeys.map((key) => [key, sentinel(key)])),
    dict: Object.fromEntries(dictKeys.map((key) => [key, sentinel(key)])),
  })
  ctx.after(() => initDict({}))
  return sentinel
}

// ─── U45 三态 + 根锚（零 / 单 / 多标签）────────────────────────

test("U45: 标签条三态 + 根锚（零 / 单 / 多标签 ∧ data-slot / data-tabs）", () => {
  const cases = [
    ["零标签", {}, [], null],
    ["单标签", { tabs: ["a"], activeTab: "a" }, ["a"], "a"],
    ["多标签", { tabs: ["a", "b"], activeTab: "b" }, ["a", "b"], "b"],
  ]
  for (const [state, input, keys, active] of cases) {
    const tree = tabbarTree(tabbarModel(input))
    assert.equal(tree.props["data-slot"], "tabs", `${state}：根锚 data-slot="tabs"`)
    assert.equal(tree.props["data-tabs"], keys.length, `${state}：根 data-tabs = 标签数`)
    const items = tabItems(tree)
    assert.deepEqual(items.map((node) => node.props["data-tab"]), keys, `${state}：标签节点序 = 标签序`)
    const activeList = items.filter((node) => node.props["data-active"] === "1")
    assert.deepEqual(activeList.map((node) => node.props["data-tab"]), active === null ? [] : [active], `${state}：data-active 恰在活动键`)
    const inertList = items.filter((node) => node.props.inert === true)
    assert.deepEqual(inertList.map((node) => node.props["data-tab"]), keys.filter((key) => key !== active), `${state}：非活动标签带 inert`)
  }
  assert.equal(tabItems(tabbarTree(tabbarModel({}))).length, 0, "零标签 ⇒ 空条（零标签节点）")
})

// ─── U46 位标四值 + 空闲零节点 ────────────────────────────────

test("U46: 位标四值 + 空闲零节点（approval / running / done 各一 ∧ d 无位标 ∧ 文本 = 词表值）", (ctx) => {
  const sentinel = useSentinels(ctx, ["tab.badge.approval"], ["sub.running", "sub.done"])
  const model = tabbarModel({
    tabs: ["a", "b", "c", "d"], activeTab: "a",
    badges: { a: ["approval"], b: ["running", "done"], c: ["done"], d: [] },
  })
  const tree = tabbarTree(model)
  const codes = ["approval", "running", "done"]
  const badgeNodes = nodes(tree).filter((node) => node.props?.["data-badge"] !== undefined)
  assert.deepEqual(badgeNodes.map((node) => node.props["data-badge"]), codes, "三码各一（b 取 running = 优先序消费面）")
  assert.deepEqual(badgeNodes.map((node) => node.children[0]), codes.map((code) => t(BADGE_WORD[code])), "位标文本 = 词键表对应词表值")
  assert.deepEqual(codes.map((code) => BADGE_WORD[code]), ["tab.badge.approval", "sub.running", "sub.done"], "词键映射 = 审批（宿主键）/ 运行中 / 完成（核词族）")
  assert.deepEqual(Object.keys(BADGE_WORD).sort(), [...codes].sort(), "词键表 = 三码（idle 无词条）")
  assert.deepEqual(codes.map((code) => t(BADGE_WORD[code])), [sentinel("tab.badge.approval"), sentinel("sub.running"), sentinel("sub.done")], "三键取值为哨兵（审批 = 宿主键 · 状态词 = 核键）")
  const idle = nodes(tabItems(tree).find((node) => node.props["data-tab"] === "d")).filter((node) => node.props?.["data-badge"] !== undefined)
  assert.deepEqual(idle, [], "空闲标签零位标节点（不造词）")
})

// ─── U47 标题缺省 ─────────────────────────────────────────────

test("U47: 标题缺省（命中行非空 ⇒ 原串 ∥ title 空 / 无命中 ⇒ 词表缺省词）", () => {
  const rows = [row(1), row(2, { title: "" })]
  const tree = tabbarTree(tabbarModel({ tabs: ["1", "2", "9"], activeTab: "1", rows }))
  const titles = nodes(tree).filter((node) => node.props?.class === "tabbar-title")
  assert.deepEqual(
    titles.map((node) => node.children[0]),
    ["标题1", t("rail.session.untitled"), t("rail.session.untitled")],
    "命中行用 title ∥ 空串 / 无命中行 ⇒ 缺省词（不猜）",
  )
  assert.equal(titles[1].children[0], titles[2].children[0], "两缺省路径同词（单源）")
})

// ─── U48 接线形两态 + 零字形 + 常量单源 ─────────────────────

test("U48: 接线形两态 + 零字形 + 常量单源（未接线全 disabled ∧ 接线零 disabled ∧ 视图两档零字形字面）", (ctx) => {
  const sentinel = useSentinels(ctx, ["tab.action.close", "rail.action.newSession"])
  const input = { tabs: ["a", "b"], activeTab: "b", rows: [row(1), row(2)] }
  const handlers = { onActivate: () => {}, onClose: () => {}, onNew: () => {} }
  const tree = tabbarTree(tabbarModel(input))
  const wired = tabbarTree(tabbarModel(input), handlers)
  assert.deepEqual(shapeTree(wired), shapeTree(tree), "两态其余形全等（树形只随 handlers 变 —— RENDERER.md §1.1 接线形通则）")
  assert.deepEqual(shapeTree(tabbarTree(tabbarModel(input), handlers)), shapeTree(wired), "重入等价：同输入两次构树（归一后结构相等）")

  const controls = nodes(tree).filter((node) => node.tag === "button")
  assert.deepEqual(
    controls.map((node) => node.props["data-action"]),
    ["tab:activate", "tab:close", "tab:activate", "tab:close", "session:create"],
    "控制项序 = 标签序 ×（标签 + 关闭）+ 条末新建",
  )
  assert.ok(controls.every((node) => node.props.disabled === true), "未接线 ⇒ 全控制项 disabled（诚实非死控）")
  assert.ok(controls.every((node) => node.props.onClick === undefined), "未接线 ⇒ 零 onClick（不落假接线）")

  const wiredControls = nodes(wired).filter((node) => node.tag === "button")
  assert.deepEqual(
    wiredControls.map((node) => node.props["data-action"]),
    controls.map((node) => node.props["data-action"]),
    "两态动作面同序（data-action 恒在 = 机读锚）",
  )
  assert.ok(wiredControls.every((node) => typeof node.props.onClick === "function"), "接线 ⇒ 逐控落 onClick")
  assert.ok(wiredControls.every((node) => node.props.disabled === undefined), "接线 ⇒ 无 disabled（两态互斥）")

  const close = controls.filter((node) => node.props["data-action"] === "tab:close")
  assert.deepEqual(close.map((node) => node.props["aria-label"]), [sentinel("tab.action.close"), sentinel("tab.action.close")], "关闭控件词面只走 aria-label（字形住样式档）")
  const add = tree.children.at(-1)
  assert.equal(add.props["data-action"], "session:create", "新建控件住条末（标签条层面）")
  assert.equal(add.props["aria-label"], sentinel("rail.action.newSession"), "新建控件 aria-label = 与左列空态同键")
  assert.deepEqual([...add.children, ...close[0].children], [], "图标控件零文本子（零字形字面）")

  const glyphs = ["+", "×", "●", "⚠", "✓"]
  for (const name of ["sessions.mjs", "chrome.mjs"]) {
    const source = readFileSync(new URL(`../renderer/views/${name}`, import.meta.url), "utf8")
    const hits = literalContents(source).filter((literal) => glyphs.some((glyph) => literal.includes(glyph)))
    assert.deepEqual(hits, [], `视图档 ${name} 字面量零字形（命中 = ${JSON.stringify(hits)}）`)
  }

  const { root, files } = rendererFiles()
  assert.ok(files.length > 0, "渲染面档集合非空（扫描面成立）")
  for (const token of ["1.75rem", "14rem", "mask-image"]) {
    const raw = files.filter((file) => countOf(readFileSync(file, "utf8"), token) > 0)
    assert.deepEqual(raw, [join(root, "styles.css")], `${token} 命中只住 styles.css 一处（含注释面）`)
    const code = files.flatMap((file) => Array.from({ length: countOf(stripComments(readFileSync(file, "utf8")), token) }, () => file))
    assert.deepEqual(code, [join(root, "styles.css")], `${token} 非注释命中恰 1（声明本身 —— 标签宽 / 溢出渐隐单源）`)
  }
})

// ─── U54 标签接线形（携带本键）─────────────────────────────

test("U54: 标签接线形（激活 / 关闭各携本键 ∧ 新建无键）", () => {
  const seen = []
  const handlers = {
    onActivate: (key) => seen.push(`activate:${key}`),
    onClose: (key) => seen.push(`close:${key}`),
    onNew: () => seen.push("new"),
  }
  const tree = tabbarTree(tabbarModel({ tabs: ["1", "2", "3"], activeTab: "2" }), handlers)
  const controls = nodes(tree).filter((node) => node.tag === "button")
  assert.deepEqual(
    controls.map((node) => node.props["data-action"]),
    ["tab:activate", "tab:close", "tab:activate", "tab:close", "tab:activate", "tab:close", "session:create"],
    "控制项序 = 标签序 ×（标签 + 关闭）+ 条末新建（接线不动形）",
  )
  for (const node of controls) node.props.onClick()
  assert.deepEqual(
    seen,
    ["activate:1", "close:1", "activate:2", "close:2", "activate:3", "close:3", "new"],
    "逐键回代本键（键域 = 串 —— 通道载荷回代归 app.mjs）",
  )
})

// ─── U55 关闭确认面（两态 × 两键 · 批档 §2.12 第 8 条）──────────────

test("U55: 关闭确认面（命中 ⇒ 标签项 data-confirm ∧ 子序 [标签, 取消, 确认] ∧ 未命中 ⇒ 常态关闭控件）", (ctx) => {
  const sentinel = useSentinels(ctx, [
    "tab.action.close", "tab.action.close.cancel", "tab.action.close.confirm", "rail.action.newSession",
  ])
  const input = { tabs: ["a", "b"], activeTab: "b", rows: [row(1), row(2)], pendingClose: "b" }
  const tree = tabbarTree(tabbarModel(input))
  const [other, hit] = tabItems(tree)
  assert.equal(hit.props["data-confirm"], "1", "命中键 ⇒ 标签项 data-confirm=1（机读锚）")
  assert.equal(other.props["data-confirm"], undefined, "未命中键 ⇒ 无 data-confirm")
  assert.equal(other.props.inert, true, "未命中非活动键 inert 照旧（确认面不改标签语义）")

  const hitControls = nodes(hit).filter((node) => node.tag === "button")
  assert.deepEqual(hitControls.map((node) => node.props["data-action"]), ["tab:activate", "tab:close-cancel", "tab:close-confirm"], "命中项子序 = [标签, 取消, 确认]")
  assert.deepEqual(hitControls.slice(1).map((node) => node.props.class), ["tabbar-cancel", "tabbar-confirm"], "两键 class 锚")
  assert.deepEqual(hitControls.slice(1).map((node) => node.children), [[sentinel("tab.action.close.cancel")], [sentinel("tab.action.close.confirm")]], "两键词面 = 文本按钮（词键值 —— 零字形）")
  assert.ok(hitControls.slice(1).every((node) => node.props["aria-label"] === undefined), "文本按钮不走 aria-label（词面即文案）")
  assert.ok(hitControls.every((node) => node.props.disabled === true), "未接线 ⇒ 三控全 disabled")
  assert.equal(nodes(tree).filter((node) => node.props?.["data-action"] === "tab:close").length, 1, "命中项关闭控件原位退出（全树关闭控件恰 1 = 未命中项）")

  const plain = tabbarTree(tabbarModel({ ...input, pendingClose: null }))
  assert.deepEqual(
    tabItems(plain).flatMap((node) => nodes(node).filter((kid) => kid.tag === "button").map((kid) => kid.props["data-action"])),
    ["tab:activate", "tab:close", "tab:activate", "tab:close"],
    "未命中态 ⇒ 零确认键（两态互斥）",
  )
  const stray = tabbarTree(tabbarModel({ ...input, pendingClose: "9" }))
  assert.equal(nodes(stray).some((node) => node.props?.["data-confirm"] !== undefined), false, "待确认键不在标签集 ⇒ 零确认面（只比在册键）")

  const seen = []
  const wired = tabbarTree(tabbarModel(input), {
    onActivate: (key) => seen.push(`activate:${key}`),
    onClose: (key) => seen.push(`close:${key}`),
    onCancelClose: () => seen.push("cancel"),
    onConfirmClose: () => seen.push("confirm"),
    onNew: () => seen.push("new"),
  })
  const wiredControls = nodes(wired).filter((node) => node.tag === "button")
  assert.deepEqual(
    wiredControls.map((node) => node.props["data-action"]),
    ["tab:activate", "tab:close", "tab:activate", "tab:close-cancel", "tab:close-confirm", "session:create"],
    "接线态控制序（命中项两键取代关闭控件）",
  )
  assert.ok(wiredControls.every((node) => node.props.disabled === undefined), "接线 ⇒ 无 disabled")
  wiredControls[2].props.onClick() // 命中项标签控件（键 b）
  wiredControls[3].props.onClick() // 取消
  wiredControls[4].props.onClick() // 确认
  assert.deepEqual(seen, ["activate:b", "cancel", "confirm"], "两键回代无键（判据单源 = store pendingClose）· 标签控件回代本键")

  const view = stripComments(readFileSync(new URL("../renderer/views/sessions.mjs", import.meta.url), "utf8"))
  for (const banned of [/\bwindow\.confirm\b/, /<dialog/i, /\bsetTimeout\b/, /\bwindow\.prompt\b/]) {
    assert.ok(!banned.test(view), `确认面四禁之一落空（字形面由 U48 字面量扫描承载）：${banned}`)
  }
})
