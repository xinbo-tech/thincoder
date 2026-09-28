/**
 * views.test.mjs — E-2 / E-3 左列用例（批档 §2.5 U39–U44 + R3c U170 · `docs/desktop/design/RENDERER.md` §1.1 ·
 * `docs/desktop/design/UI.md` §1 左列会话行 / 启动态 / 空态 / 断点 / i18n 行）：
 * 左列三态判定（纯函数脱 DOM）/ 启动态树（零会话行）/ 来源端三态 / 标题缺省 / 折叠常量单源 / 词表键齐零硬编码 /
 * 行元数据族三值（U170 —— R3c · D18：provider · N msgs · updated）/ 账本警示行构树三例 + 文案两向（U181 · 账本可靠批 · 桌面微轮 / 修正轮）。
 * 拆档（档行预算 = `docs/desktop/design/PROJECT.md` §4.1）：标签条面 `thincoder-desktop/test/views-tabbar.test.mjs`
 * （U45–U48 + U54 / U55）· 中区外壳面 `thincoder-desktop/test/views-chrome.test.mjs`（U49–U51）·
 * 零回归锁面 `thincoder-desktop/test/views-locks.test.mjs`（U52）· 行控件与换形面 `thincoder-desktop/test/views-rail-actions.test.mjs`
 * （U53 —— R3c 拆出：本档原址补例 U170 后越层 ⇒ 拆本族；面不变、判据不变，只换宿主档）。
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

test("U44: 词表键齐 ∧ 零硬编码（两语键集相等 ∧ 十七键用量 ∧ 树文本 / 控件词面全哨兵 ∧ 视图档零 CJK）", (ctx) => {
  const keys = Object.keys(HOST_DICT.en)
  assert.deepEqual([...keys].sort(), [...Object.keys(HOST_DICT.zh)].sort(), "两语键集相等")
  const railKeys = [
    "rail.action.openDir", "rail.recent.title", "rail.sessions.title", "rail.project.none", "rail.empty.hint",
    "rail.action.newSession", "rail.session.untitled", "rail.session.msgs", "rail.session.updated", "rail.ledger.notice", "rail.ledger.notice.scene",
    "rail.action.rename", "rail.action.delete", "rail.action.cancel",
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
    // 账本警示行（账本可靠批 · 桌面微轮 / 修正轮）：注记在场（`scene = true` ⇒ 条件附句）⇒ `rail.ledger.notice` +
    // `rail.ledger.notice.scene` 两键消费面（构树 / 文案两向判据 = U181）
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(2)], ledger: { refused: 1, reason: "readback-failed", scene: true } })),
    // 换形两面（批 A ④）：取消键只在形面在场 ⇒ 两形各一树（词面消费面 = 键齐判据）
    railTree(list, {}, { key: "2", mode: "rename" }),
    railTree(list, {}, { key: "2", mode: "delete" }),
  ]
  // 数据串（`"; "` = 账本注记合成分隔符 —— en 面按 locale 直取；两向判据 = U181）
  const data = new Set(["C:\\r1", "C:\\proj", "标题2", "标题3", "; "])
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
  assert.deepEqual([...used].sort(), [...railKeys].sort(), "十七键全被左列消费（键齐 = 用量面 —— 含两动作键 / 取消键的控件词面）")

  const view = stripComments(readFileSync(new URL("../renderer/views/sessions.mjs", import.meta.url), "utf8"))
  assert.ok(!/\p{Script=Han}/u.test(view), "视图档源零 CJK（面向用户文案全经 t()）")
})

// ─── U170 行元数据族（R3c · D18 · T-DSK34 构树面）─────────────────

test("U170: 行元数据族三值（provider · N msgs · updated —— 逐值零节点 ∧ 段锚 ∧ 行控件零改）", () => {
  const rows = [
    row(1, { provider: "p1:m1", messageCount: 12, updatedAt: 1700000000000 }),
    row(2, { messageCount: 0 }),
    row(3, { provider: "", messageCount: null, updatedAt: null }),
  ]
  const tree = railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows }))
  const rowNodes = nodes(tree).filter((node) => node.props?.class === "rail-row")
  assert.deepEqual(rowNodes.map((node) => node.props["data-slot"]), ["1", "2", "3"], "行序 = 输入序（元数据节点不改行序 / 不改行控件）")
  assert.deepEqual(rowNodes.map((node) => node.props["data-action"]), ["session:switch", "session:switch", "session:switch"], "行控件零改（点行仍 = session:switch 携本键）")
  const metas = rowNodes.map((node) => (node.children ?? []).find((child) => child?.props?.class === "rail-row-meta")).filter(Boolean)
  assert.equal(metas.length, 2, "三值皆缺的行（provider \"\" ∧ 两值非数）⇒ 元数据节点零节点（禁假造）")
  const segs = (node) => node.children.map((child) => child.props["data-seg"])
  const segTexts = (node) => node.children.map((child) => texts(child).join(""))
  assert.deepEqual(segs(metas[0]), ["provider", "msgs", "updated"], "段序 = provider · N msgs · updated（逐段包元素 —— 段间分隔符归样式档）")
  assert.deepEqual(segTexts(metas[0])[0], "p1:m1", "provider = 行载值逐字（核槽投影 `activeProvider`）")
  assert.deepEqual(segTexts(metas[0])[1], t("rail.session.msgs", { n: 12 }), "N msgs = 词表键（计数入词）")
  const updated = segTexts(metas[0])[2]
  assert.equal(updated !== "" && updated !== "1700000000000" && /\d/.test(updated) && /\D/.test(updated), true, `updated = 本地化短日期（非原始读数 —— 实 = ${updated}）`)
  assert.deepEqual(segs(metas[1]), ["msgs", "updated"], "provider 缺键 ⇒ 该值零节点（余值照落）")
  assert.deepEqual(segTexts(metas[1])[0], t("rail.session.msgs", { n: 0 }), "计数 0 照落（读数 0 ≠ 缺席）")
  assert.deepEqual(nodes(tree).filter((node) => node.props?.class === "rail-origin").length, 3, "来源端标面零动（元数据族 = 加法面）")
})

// ─── U181 账本警示行（账本可靠批 · 桌面微轮 —— 构树：在场〔含 `empty`〕/ 缺席 / 非可点；修正轮：文案两向）──

test("U181: 账本警示行（在场：会话区末子 · 非可点 ∧ empty 态同在 ∥ 缺席 / boot ⇒ 零节点 ∥ 文案两向）", () => {
  const ledger = { refused: 1, reason: "readback-failed", scene: true }
  const MAIN_EN = "Session ledger anomaly (readback-failed) — opening a session self-heals it"
  const SCENE_EN = "Corrupted-scene files kept 30 days"
  const lastOf = (tree) => {
    const section = nodes(tree).find((node) => node.props?.["data-section"] === "sessions")
    return section.children.filter((child) => child !== null).pop()
  }
  const hit = (tree) => nodes(tree).some((node) => "data-ledger-notice" in (node.props ?? {}))
  /** 注记树（`extra` = `scene` 形态 —— 文案两向判据面）。 */
  const noticeOf = (extra) => lastOf(railTree(railModel({
    projectCwd: "C:\\proj", recent: [], rows: [row(1)], ledger: { refused: 1, reason: "readback-failed", ...extra },
  })))

  const notice = noticeOf({ scene: true })
  assert.equal(notice.props?.class, "rail-ledger-notice", "会话区末子 = 账本警示行（行列表之后）")
  assert.equal(notice.tag, "div", "非 `button`（零控件语义）")
  assert.equal("data-ledger-notice" in notice.props, true, "机读锚 `data-ledger-notice` 在位（裸标记）")
  assert.equal("data-action" in notice.props, false, "零 `data-action`（不可点）")
  // 文案两向（修正轮 · 三端同义）：`scene = true` ⇒ 全句逐字（主句 + 分隔符 + 附句）；`scene` 缺 / false ⇒ 仅主句
  assert.equal(texts(notice).join(""), `${MAIN_EN}; ${SCENE_EN}`, "`scene = true` ⇒ 全句逐字（主句 + 「; 」+ 附句 —— en 在册字面）")
  assert.ok(texts(notice).join("").includes("readback-failed"), "文案含 reason 值")

  const off = noticeOf({ scene: false })
  assert.equal(texts(off).join(""), MAIN_EN, "`scene = false` ⇒ 仅主句逐字（附句另键不落）")
  assert.ok(!texts(off).join("").includes("Corrupted-scene"), "附句缺席（禁恒附 —— 无现场档不指现场档）")
  assert.equal(texts(noticeOf({})).join(""), MAIN_EN, "`scene` 缺 ⇒ 与 false 同判（`=== true` 门）")

  // 分隔符按当前 locale 直取（禁内容启发式）：zh 面 = 主句 + 「；」+ 附句
  initDict({ locale: "zh" })
  try {
    assert.equal(
      texts(noticeOf({ scene: true })).join(""),
      "会话账本异常（readback-failed）——打开会话即自动补回；损坏现场档保留 30 天",
      "zh 全句逐字（主句 + 「；」+ 附句 —— zh 在册字面）",
    )
    assert.equal(texts(noticeOf({ scene: false })).join(""), "会话账本异常（readback-failed）——打开会话即自动补回", "zh `scene = false` ⇒ 仅主句")
  } finally {
    initDict({}) // 复位（缺省 = en 面）
  }

  const empty = lastOf(railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [], ledger })))
  assert.equal("data-ledger-notice" in empty.props, true, "`empty` 态（有项目无会话）⇒ 注记同在（触发脱离会话计数条件）")
  assert.equal(hit(railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(1)], ledger: null }))), false, "缺席 ⇒ 零节点（禁假造）")
  assert.equal(hit(railTree(railModel({ projectCwd: null, recent: [], rows: [], ledger }))), false, "`boot` 态 ⇒ 零节点（无 cwd 判据对象）")
})
