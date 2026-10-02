/**
 * 2026-10-02-desktop-settings-layout.test.mjs — 设置面样式收正批（#812 · 需求 D37）· **批次本地件**
 * （住 `docs/batches/` · 不登记常驻套件 · 随批留存；格式先例 = `2026-09-29-desktop-carryover-c1.test.mjs`）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-10-02-desktop-settings-layout.test.mjs`
 *
 * 射程 = 批档 §2.1（五条）+ 设计档 `docs/desktop/design/PROJECT.md` §6.1 本批块（五腿）：
 *   腿 ① 行结构断言（渠道行平 node 直测：两行结构 ∥ 动作簇四件序（修改 ∥ ✕ ∥ 校验 ∥ 移除名 —— 现盘序 •
 *         KD-66 ②）∥ 编辑态 ∥ 第三行条件 ∥ 功能面全保留）+ 拆档 re-export 零改面（§2.1 ⑤）；
 *   腿 ② 断行恒定（`thincoder-desktop/renderer/settings.css` 源扫：`.settings-row` `nowrap` ∥ 省略四件 ∥
 *         原因句豁免（`[data-unavailable-reason]` —— 置位 = `views/settings-sections-providers.mjs`）保 `white-space: normal` ∥
 *         补则两件（代码评审两裁 · 2026-10-02）：只读收束（`.settings-field-readonly` 四件 ∥ `.settings-readonly-hint` `flex: 0 0 auto`）
 *         ∥ MCP 展开面豁免（`.settings-mcp-detail .settings-row-value` 保自然折行））；
 *   腿 ③ 样式纪律（零新变量（`--` 定义数 0）∥ 零 `@media`（零新断点））；
 *   腿 ④ 拨杆形四规则在位（`appearance: none` ∥ 轨道 30×16 圆角 8 · 底 `--line` ∥ 圆钮 12px `#fff` ∥
 *         选中 `--accent` + 钮右移 `left: 16px`）；
 *   腿 ⑤ 卡界源扫（`.settings-row` = `1px solid var(--line)` 描边 + 圆角 `6px` 在位 + 卡底零独立填充 +
 *         活动 / 当前行 mix 基色 `--bg`）。
 * 值源单源 = 设计档 `docs/desktop/design/UI.md` §1 本批注项 1–4 ∥ KD-66；锚点坐标随实现（D37 拆档后渠道族 =
 * `renderer/views/settings-sections-providers.mjs`，`settings-sections.mjs` re-export）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const at = (rel) => pathToFileURL(join(ROOT, rel)).href
const CSS_PATH = "thincoder-desktop/renderer/settings.css"
const PROVIDERS_PATH = "thincoder-desktop/renderer/views/settings-sections-providers.mjs"

// ─── 装配面（渲染档 + 真词表；平 node 直装 —— 沿 carryover c1 件先例）────────────────────────
const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
i18n.initDict({ locale: "zh" })
const sections = await import(at("thincoder-desktop/renderer/views/settings-sections.mjs"))
const providers = await import(at(PROVIDERS_PATH))
const controls = await import(at("thincoder-desktop/renderer/views/settings-controls.mjs"))

/** 渠道段直测夹具：段 / 处理器（空表 ⇒ `wire` 落 `disabled`，不碍结构断言）/ 依赖注入（校验钮 = 真件）。 */
function providersTree(rows, overrides = {}) {
  const section = { state: "ready", rows, presets: [], probe: null, draft: null, verify: null, ...overrides.section }
  const deps = {
    channelForm: () => ({ tag: "form", props: { class: "settings-form" }, children: [] }),
    verifyControl: controls.verifyControl,
    reasonWord: (reason) => (typeof reason === "string" ? reason : ""),
    formats: [],
    edit: overrides.edit ?? null,
    keyDraft: overrides.keyDraft ?? null,
  }
  return sections.providersBody(section, {}, deps)
}

/** 树面小工具（null 容错）：深搜 / 类名 / 属性 / 动作序列。 */
const findDeep = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) { for (const item of node) { const hit = findDeep(item, pred); if (hit !== null) return hit } return null }
  if (pred(node)) return node
  return findDeep(node.children ?? null, pred)
}
const byClass = (nodes, cls) => nodes.find((n) => n !== null && typeof n?.props?.class === "string" && n.props.class.split(" ").includes(cls)) ?? null
const byAttr = (nodes, attr) => nodes.find((n) => n !== null && n?.props?.[attr] !== undefined) ?? null
const actionsOf = (node) => node.children.filter((n) => n !== null && n?.props?.["data-action"] !== undefined).map((n) => n.props["data-action"])

// ─── 腿 ①：行结构（两行 ∥ 动作簇四件序 ∥ 编辑态 ∥ 第三行 ∥ 功能面全保留）────────────────────

test("腿①A：渠道行 = 两行卡（主 ∥ 副）+ 动作簇四件现盘序 + 功能面全保留", () => {
  const [row] = providersTree([{ name: "p1", model: "gpt-4o", baseURL: "https://api.openai.com/v1", active: true, hasKey: true, maskedKey: "sk-…1234", proxy: true }])
  assert.equal(row.tag, "div")
  assert.equal(row.props["data-provider"], "p1")
  const [main, sub] = row.children
  assert.equal(main?.props?.class, "settings-row-main", "主行在场（两行结构①）")
  assert.equal(sub?.props?.class, "settings-row-sub", "副行在场（两行结构②）")
  // 主行：名 + 钥面（masked）+ 当前标 + 动作簇
  assert.equal(main.children[0].props.class, "settings-row-name")
  assert.equal(main.children[0].children[0], "p1")
  assert.equal(main.children[1].props.class, "settings-key")
  assert.equal(main.children[1].props["data-key"], "masked")
  assert.equal(main.children[1].children[0], "sk-…1234", "masked 钥面全保留")
  assert.equal(byAttr(main.children, "data-active")?.children[0], i18n.t("settings.providers.active"), "当前标全保留")
  assert.deepEqual(actionsOf(main),
    ["settings:providerKeyEdit", "settings:providerKeyDelete", "settings:verify", "settings:removeProvider"],
    "动作簇四件 · 现盘序（修改 ∥ ✕ ∥ 校验 ∥ 移除名）")
  // 副行：`模型 · baseURL` 串形 + 行尾代理开关
  assert.equal(byClass(sub.children, "settings-row-value").children[0], "gpt-4o · https://api.openai.com/v1")
  const proxy = findDeep(sub, (n) => n?.props?.["data-provider-proxy"] !== undefined)
  assert.equal(proxy?.props?.type, "checkbox")
  assert.equal(proxy?.props?.checked, true, "代理开关全保留（行尾）")
  assert.equal(findDeep(row, (n) => n?.props?.["data-provider-model"] !== undefined), null, "旧 model 段标退场 —— 串形单址")
  assert.equal(findDeep(row, (n) => n?.props?.["data-provider-baseurl"] !== undefined), null, "旧 baseurl 段标退场 —— 串形单址")
})

test("腿①B：串形缺段不落空分隔符 + 空段零节点", () => {
  const [rowBare, rowUrl] = providersTree([
    { name: "p2", hasKey: false },
    { name: "p3", baseURL: "https://x.example/v1", hasKey: false },
  ])
  const subBare = rowBare.children[1]
  assert.equal(byClass(subBare.children, "settings-row-value"), null, "两段皆空 ⇒ 串零节点（禁假造）")
  assert.equal(byClass(rowBare.children[0].children, "settings-key").props["data-key"], "none", "未配 ⇒ 无密钥词档")
  assert.deepEqual(actionsOf(rowBare.children[0]),
    ["settings:providerKeyEdit", "settings:verify", "settings:removeProvider"], "未配 ⇒ 删钥钮不在簇（三件）")
  const subUrl = rowUrl.children[1]
  assert.equal(byClass(subUrl.children, "settings-row-value").children[0], "https://x.example/v1", "缺 model ⇒ 不落前导分隔符")
})

test("腿①C：第三行（条件）= 不可用原因句；hostBusy 分档抑制（S3 保持）", () => {
  const [rowUn, rowBusy, rowOk] = providersTree([
    { name: "p4", model: "m", available: false, unavailableReason: "探不通句", hasKey: true },
    { name: "p5", available: false, failure: "hostBusy", unavailableReason: "不该显示", hasKey: true },
    { name: "p6", available: true, hasKey: true },
  ])
  const reason = rowUn.children[2]
  assert.equal(reason?.props?.["data-unavailable-reason"], "", "第三行 = 原因句（条件在场）")
  assert.equal(reason.children[0], "探不通句")
  assert.equal(byAttr(rowUn.children[1].children, "data-available").children[0], i18n.t("settings.reason.unavailable"))
  // hostBusy 档：状态词「宿主繁忙」在场 ∥ 故障句抑制（原因句零节点）
  const busyMark = byAttr(rowBusy.children[1].children, "data-available")
  assert.equal(busyMark.children[0], i18n.t("settings.reason.hostBusy"))
  assert.equal(busyMark.props["data-failure"], "hostBusy")
  assert.equal(rowBusy.children[2], null, "hostBusy ⇒ 故障句抑制（零节点）")
  assert.equal(rowOk.children[2], null, "可用 ⇒ 原因句零节点")
  assert.equal(byAttr(rowOk.children[1].children, "data-available"), null, "可用 ⇒ 不可用标零节点")
})

test("腿①D：编辑态 = 主行换形 [名 + 钥面 + 输入 + 存 ∥ 消]；代理 ∥ 移除 ∥ 校验暂撤", () => {
  const [row] = providersTree(
    [{ name: "p1", model: "gpt-4o", baseURL: "https://api.openai.com/v1", hasKey: true, maskedKey: "sk-…1234", proxy: true }],
    { edit: "p1", keyDraft: { name: "p1", value: "sk-draft" } },
  )
  const [main, sub] = row.children
  const input = byAttr(main.children, "data-provider-key-input")
  assert.equal(input?.props?.type, "password")
  assert.equal(input?.props?.value, "sk-draft", "编辑态输入种子 = keyDraft（#615② 保持）")
  assert.deepEqual(actionsOf(main), ["settings:providerKeySave", "settings:providerKeyCancel"], "存 ∥ 消")
  assert.equal(findDeep(row, (n) => n?.props?.["data-action"] === "settings:verify"), null, "校验暂撤")
  assert.equal(findDeep(row, (n) => n?.props?.["data-action"] === "settings:removeProvider"), null, "移除暂撤")
  assert.equal(findDeep(row, (n) => n?.props?.["data-provider-proxy"] !== undefined), null, "代理暂撤")
  assert.equal(byClass(sub.children, "settings-row-value")?.children[0], "gpt-4o · https://api.openai.com/v1", "副行串保留（取消即回）")
})

test("腿①E：拆档 re-export 面零改（`settings-sections.mjs` 消费面 = 同一 `providersBody`）", () => {
  assert.equal(typeof providers.providersBody, "function")
  assert.equal(sections.providersBody, providers.providersBody, "re-export = 直取同一函数（分派面零改）")
})

// ─── CSS 源扫工具（注释先剥 —— 免注释内选择器误命中）──────────────────────────────────────
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")
const blockOf = (css, selector) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const hit = new RegExp(esc + "\\s*\\{([^}]*)\\}").exec(css)
  return hit === null ? null : hit[1]
}

// ─── 腿 ②：断行恒定源扫 ─────────────────────────────────────────────────────────────────
test("腿②：`.settings-row` nowrap ∥ 省略四件 ∥ 原因句豁免保 `normal` ∥ 字段行带上 ∥ 补则两件（只读收束 ∥ 展开面豁免）", () => {
  const css = stripComments(read(CSS_PATH))
  const row = blockOf(css, ".settings-row")
  assert.ok(row !== null, "`.settings-row` 基规则在盘")
  assert.ok(row.includes("flex-wrap: nowrap"), "行族断行恒定（wrap ⇒ nowrap）")
  const value = blockOf(css, ".settings-row-value")
  for (const decl of ["min-width: 0", "overflow: hidden", "text-overflow: ellipsis", "white-space: nowrap"]) {
    assert.ok(value.includes(decl), `省略四件在位：${decl}`)
  }
  const reason = blockOf(css, ".settings-row [data-unavailable-reason]")
  assert.ok(reason !== null && reason.includes("white-space: normal"), "原因句豁免档保 `white-space: normal`")
  const fieldRow = blockOf(css, ".settings-field-row")
  assert.ok(fieldRow.includes("flex-wrap: nowrap"), "字段行（agent ∥ env ∥ 表单控件行）带上 nowrap")
  assert.ok(css.includes(".settings-row-sub > .settings-field-label { margin-left: auto; }"), "副行代理件行尾锚定（无串态兜底）")
  assert.match(read(PROVIDERS_PATH), /"data-unavailable-reason": ""/, "豁免锚置位在场（渠道行第三行）")
  // 补则两件（代码评审两裁 · 2026-10-02——KD-66 ③；§2.14 判据面）：只读字段行收束 ∥ MCP 展开面全显豁免。
  const readonly = blockOf(css, ".settings-field-readonly")
  assert.ok(readonly !== null, "只读值面规则在盘（补则①）")
  for (const decl of ["min-width: 0", "overflow: hidden", "text-overflow: ellipsis", "white-space: nowrap"]) {
    assert.ok(readonly.includes(decl), `只读值面收束四件在位：${decl}`)
  }
  assert.match(css, /\.settings-readonly-hint\s*\{[^}]*flex: 0 0 auto/, "提示词面定尺不缩（`flex: 0 0 auto`——短词面禁截）")
  const mcpValue = blockOf(css, ".settings-mcp-detail .settings-row-value")
  assert.ok(mcpValue !== null, "MCP 展开面豁免独立成则在盘（补则②）")
  assert.ok(mcpValue.includes("white-space: normal"), "展开面域值面恢复自然折行（`white-space: normal`）")
  assert.ok(mcpValue.includes("overflow-wrap: anywhere"), "长串软折（`overflow-wrap: anywhere`——全显 ∥ 零出血双保）")
})

// ─── 腿 ③：样式纪律（零新变量 ∥ 零新断点）──────────────────────────────────────────────
test("腿③：样式纪律 —— 零新变量（`--` 定义数 0）∥ 零 `@media`", () => {
  const css = read(CSS_PATH)
  const defs = css.split("\n").filter((line) => /^\s*--[\w-]+\s*:/.test(line))
  assert.equal(defs.length, 0, `零新变量（\`--\` 定义数 0）——实读 ${defs.length}`)
  assert.equal(css.includes("@media"), false, "零 `@media`（零新断点）")
})

// ─── 腿 ④：拨杆形四规则在位 ─────────────────────────────────────────────────────────────
test("腿④：拨杆形四规则（轨道 30×16 · 圆角 8 · 底 `--line` ∥ 圆钮 12px `#fff` ∥ 选中 `--accent` + `left: 16px`）", () => {
  const css = stripComments(read(CSS_PATH))
  const track = blockOf(css, 'input.settings-field[type="checkbox"]')
  assert.ok(track !== null, "复选子域基规则在盘")
  assert.ok(track.includes("appearance: none"), "① appearance: none")
  assert.ok(track.includes("width: 30px") && track.includes("height: 16px"), "② 轨道 30×16")
  assert.ok(track.includes("border-radius: 8px") && track.includes("background: var(--line)"), "② 圆角 8 · 底 `--line`")
  const knob = blockOf(css, 'input.settings-field[type="checkbox"]::after')
  assert.ok(knob.includes("width: 12px") && knob.includes("height: 12px") && knob.includes("border-radius: 50%"), "③ 圆钮 12px")
  assert.ok(knob.includes("background: #fff"), "③ 钮色 `#fff`（字面 —— 两主题同值）")
  const checked = blockOf(css, 'input.settings-field[type="checkbox"]:checked')
  assert.ok(checked.includes("background: var(--accent)"), "④ 选中轨道 `--accent`")
  const checkedKnob = blockOf(css, 'input.settings-field[type="checkbox"]:checked::after')
  assert.ok(checkedKnob.includes("left: 16px"), "④ 钮右移 `left: 16px`")
})

// ─── 腿 ⑤：卡界源扫 ────────────────────────────────────────────────────────────────────
test("腿⑤：卡界 = VSC 实形 —— 1px `--line` 描边 + 圆角 6px + 卡底零独立填充 + 活动行 mix 基色 `--bg`", () => {
  const css = stripComments(read(CSS_PATH))
  const row = blockOf(css, ".settings-row")
  assert.ok(row.includes("border: 1px solid var(--line)"), "1px `--line` 描边在位（D24 描边归零基线仅本卡界让位）")
  assert.ok(row.includes("border-radius: 6px"), "圆角 6px 在位（VSC 实形）")
  assert.equal(/background/.test(row), false, "卡底零独立填充（升底让位）")
  const mix = blockOf(css, ".settings-row[data-current]")
  assert.ok(mix.includes("color-mix(in srgb, var(--accent) 14%, var(--bg))"), "活动 / 当前行 mix 基色 = `--bg`（行域静息底一致）")
})
