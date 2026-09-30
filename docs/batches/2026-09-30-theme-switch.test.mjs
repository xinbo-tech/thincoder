/**
 * 2026-09-30-theme-switch.test.mjs — 批内件（主题切换批 · 台账 #743 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-09-30-theme-switch.md` §2（KD-61 机制 ∥ 修复轮块）∥
 * `docs/desktop/design/PROJECT.md` §6.1「主题切换批（验收面）」块（六腿逐字）；机制单源 = 同档 §2 KD-61 ∥
 * `docs/desktop/design/RENDERER.md` §1.4 ∥ `docs/desktop/design/UI.md` §1「本批注（主题切换 · D33 · 2026-09-30）」。
 * 六腿（全绿 = 批内验收）：
 *   腿 1 存储读回 ∥ 缺省：假 storage/doc —— 无值 ∥ `dark` ∥ 表外 ∥ 读抛 ⇒ `system` 降级 + `console.error`（零写回）；
 *   腿 2 落写 ∥ fail-soft：`setTheme("dark")` ⇒ `dataset.theme` + `setItem`；`setItem` 抛 ⇒ 属性仍落 + `console.error` + 返落地值；
 *   腿 3 表外值拒绝：`setTheme("blue")` ⇒ `null` + 零写 + 零改 + `console.error`；
 *   腿 4 单写者负控（扫描面 ⊇ 属性写径）：`documentElement.dataset.theme` 写径 ∪
 *        `documentElement.setAttribute("data-theme", …)` 形 —— 两形合计写径恰 `theme.mjs` 一处字面
 *        （扫描域 = `thincoder-desktop/**` 源码树，排除 node_modules）；
 *   腿 5 CSS 结构：`theme.css` 零 `prefers-color-scheme` ∥ `light-dark(` 恰 24 ∥ 两枚 `:root[data-theme]` 规则 ∥
 *        基线四值（`--font` / `--fs` / `--lh` / `--ls`）逐字零动；
 *   腿 6 设置面头：三钮 ∥ `data-action` / `data-theme` 锚齐 ∥ 当前态（`data-active` + `aria-pressed="true"`）恰一 ∥
 *        缺 handlers ⇒ 三钮 `disabled`（描述符树平 node 直测）。
 * 附臂（测试面随修随加 · 不占设计条目）：词键四键两语值（en：Theme ∕ System ∕ Light ∕ Dark；zh：主题 ∕ 跟随系统 ∕ 亮色 ∕ 暗色）。
 * 夹具口径：全假件（假 doc ∥ 假 storage —— 注入缝 `{ doc, storage }`）；设置视图链经 `/rc/` 取核件 ⇒ 跑法带解析钩。
 * 本件不进仓套件（批内件 · 随批留存）；跑法（仓根 `thincoder/`）：
 *   node --test --import ./thincoder-desktop/test/rc-resolve.mjs docs/batches/2026-09-30-theme-switch.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
const rel = (p) => resolve(ROOT, p)
const src = (p) => readFileSync(rel(p), "utf8")

const THEME_MOD = "thincoder-desktop/renderer/theme.mjs"
const THEME_CSS = "thincoder-desktop/renderer/theme.css"
const KEY = "thincoder.desktop.theme"

let themeSource = null
try { themeSource = src(THEME_MOD) } catch { /* 红态：档未落 —— 下行显式报错 */ }
if (themeSource === null) throw new Error(`theme.mjs 不在盘（或 cwd 非仓根 thincoder/ —— cwd = ${ROOT}）`)
const { THEMES, initTheme, setTheme } = await import(pathToFileURL(rel(THEME_MOD)).href)

// ─── 夹具 ────────────────────────────────────────────────────────────────────

/** 假环境（注入缝面）：假 doc（`documentElement.dataset`）∥ 假 storage（Map 载体 ∥ 读 ∥ 写两抛臂 ∥ `writes` 逐笔记账）。 */
function createEnv({ stored = undefined, throwRead = false, throwWrite = false } = {}) {
  const data = new Map()
  if (stored !== undefined) data.set(KEY, stored)
  const writes = []
  const doc = { documentElement: { dataset: {} } }
  const storage = {
    getItem(key) { if (throwRead) throw new Error("read-boom"); return data.has(key) ? data.get(key) : null },
    setItem(key, value) { if (throwWrite) throw new Error("write-boom"); data.set(key, value); writes.push([key, value]) },
  }
  return { doc, storage, data, writes, dataset: doc.documentElement.dataset }
}

/** `console.error` 捕获（同步面 —— 断言行数 = 零静默判据）。 */
function capture(fn) {
  const lines = []
  const original = console.error
  console.error = (...args) => { lines.push(args.map(String).join(" ")) }
  try { return { value: fn(), lines } } finally { console.error = original }
}

/** 描述符树展平（`{ tag, props, children }` 递归 —— 平 node 零 DOM）。 */
function flatten(node, out = []) {
  if (node === null || typeof node !== "object") return out
  if (typeof node.tag === "string") out.push(node)
  for (const child of Array.isArray(node.children) ? node.children : []) flatten(child, out)
  return out
}

/** 源树递归枚举（腿 4 扫描面；排除 node_modules 与点目录（`.thincoder/tmp` 留存快照等非产品源）；只收代码档扩展名）。 */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(mjs|cjs|js|html|css)$/.test(entry)) out.push(path)
  }
  return out
}

// ─── 腿 1 · 存储读回 ∥ 缺省（无值 ∥ dark ∥ 表外 ∥ 读抛）────────────────────────

test("腿 1 · 存储读回 ∥ 缺省：无值 ∥ dark ∥ 表外 ∥ 读抛 ⇒ system 降级 + console.error", () => {
  // (a) 无值 ⇒ `system`（降级）+ 零写回
  const envA = createEnv()
  const readA = capture(() => initTheme({ doc: envA.doc, storage: envA.storage }))
  assert.equal(readA.value, "system")
  assert.equal(envA.dataset.theme, "system")
  assert.equal(readA.lines.length, 0, "无值非错误面 —— 零记错")
  assert.equal(envA.writes.length, 0, "未切过 ⇒ 存储零写回")
  assert.equal(envA.data.has(KEY), false)

  // (b) 存储值在场 ⇒ 读回应用（零写回 —— 原值零动）
  const envB = createEnv({ stored: "dark" })
  const readB = capture(() => initTheme({ doc: envB.doc, storage: envB.storage }))
  assert.equal(readB.value, "dark")
  assert.equal(envB.dataset.theme, "dark")
  assert.equal(readB.lines.length, 0)
  assert.equal(envB.data.get(KEY), "dark", "读回不重写存储")
  assert.equal(envB.writes.length, 0, "读回零写回")

  // (c) 表外值 ⇒ `system` + console.error（零静默 —— 零写回零改外）
  const envC = createEnv({ stored: "blue" })
  const readC = capture(() => initTheme({ doc: envC.doc, storage: envC.storage }))
  assert.equal(readC.value, "system")
  assert.equal(envC.dataset.theme, "system")
  assert.equal(readC.lines.length, 1, "表外值 ⇒ 恰一行零静默")
  assert.equal(envC.writes.length, 0, "降级零写回（零外写）")
  assert.equal(envC.data.get(KEY), "blue", "原值零动")

  // (d) 读抛 ⇒ `system` + console.error + 零抛
  const envD = createEnv({ throwRead: true })
  const readD = capture(() => initTheme({ doc: envD.doc, storage: envD.storage }))
  assert.equal(readD.value, "system")
  assert.equal(envD.dataset.theme, "system")
  assert.equal(readD.lines.length, 1, "读抛 ⇒ 恰一行零静默")
})

// ─── 腿 2 · 落写 ∥ fail-soft ───────────────────────────────────────────────────

test("腿 2 · 落写 ∥ fail-soft：setTheme ⇒ dataset.theme + setItem；写抛 ⇒ 属性仍落", () => {
  // (a) 正常写：`dataset.theme` + 存储同刻落值 + 返落地值（三值闭集全过）
  for (const value of THEMES) {
    const env = createEnv()
    const write = capture(() => setTheme(value, { doc: env.doc, storage: env.storage }))
    assert.equal(write.value, value, `setTheme(${value}) 返落地值`)
    assert.equal(env.dataset.theme, value)
    assert.equal(env.data.get(KEY), value, "写 = 点按即刻")
    assert.equal(write.lines.length, 0)
  }

  // (b) 写抛 ⇒ 属性仍落 + console.error（fail-soft —— 会话内照常生效）
  const envB = createEnv({ throwWrite: true })
  const writeB = capture(() => setTheme("dark", { doc: envB.doc, storage: envB.storage }))
  assert.equal(writeB.value, "dark")
  assert.equal(envB.dataset.theme, "dark", "写失败 ⇒ 属性仍落（fail-soft）")
  assert.equal(writeB.lines.length, 1, "写失败 ⇒ 恰一行零静默")
})

// ─── 腿 3 · 表外值拒绝 ────────────────────────────────────────────────────────

test("腿 3 · 表外值拒绝：setTheme 表外 ⇒ null + 零写 + 零改 + console.error", () => {
  for (const bad of ["blue", "DARK", "", null, 7, undefined]) {
    const env = createEnv({ stored: "dark" })
    env.dataset.theme = "dark" // 现态（直调面 —— 不经装配）
    const refused = capture(() => setTheme(bad, { doc: env.doc, storage: env.storage }))
    assert.equal(refused.value, null, `表外拒绝：${String(bad)}`)
    assert.equal(env.dataset.theme, "dark", "零改（属性零动）")
    assert.equal(env.writes.length, 0, "零写（存储零动）")
    assert.equal(env.data.get(KEY), "dark", "原值零动")
    assert.equal(refused.lines.length, 1, "表外 ⇒ 恰一行零静默")
  }
})

// ─── 腿 4 · 单写者负控（扫描面 ⊇ 属性写径）────────────────────────────────────

test("腿 4 · 单写者负控：两形写径合计恰 theme.mjs 一处字面", () => {
  const files = walk(rel("thincoder-desktop"))
  assert.ok(files.length > 50, `扫描面非空（实读 ${files.length} 档）`)
  const FORM_DATASET = /documentElement\.dataset\.theme/g
  const FORM_SETATTR = /documentElement\.setAttribute\(\s*["']data-theme["']/g
  const hits = []
  for (const file of files) {
    const text = readFileSync(file, "utf8")
    const count = (text.match(FORM_DATASET)?.length ?? 0) + (text.match(FORM_SETATTR)?.length ?? 0)
    if (count > 0) hits.push({ file, count })
  }
  const total = hits.reduce((sum, hit) => sum + hit.count, 0)
  assert.equal(total, 1, `两形合计写径恰一处（实读 ${total}：${JSON.stringify(hits)}）`)
  assert.match(hits[0].file, /renderer[\\/]theme\.mjs$/, "唯一写径落 theme.mjs")
})

// ─── 腿 5 · CSS 结构 ─────────────────────────────────────────────────────────

test("腿 5 · CSS 结构：@media 退场 ∥ 值对恰 24 ∥ 两枚覆写规则 ∥ 基线四值零动", () => {
  const css = src(THEME_CSS)
  assert.equal(css.includes("prefers-color-scheme"), false, "零 prefers-color-scheme")
  assert.equal(css.includes("@media"), false, "@media 退场")
  assert.equal((css.match(/light-dark\(/g) ?? []).length, 24, "light-dark( 恰 24（色值对）")
  assert.equal((css.match(/:root\[data-theme/g) ?? []).length, 2, "两枚 :root[data-theme] 规则")
  assert.equal((css.match(/--mono:/g) ?? []).length, 1, "非色变量 --mono 单块单留")
  // 三态 color-scheme（缺省媒体 + 两强制态覆写）
  assert.match(css, /:root\s*\{[^}]*color-scheme:\s*light dark;/s, "缺省 color-scheme: light dark")
  assert.match(css, /:root\[data-theme="light"\]\s*\{\s*color-scheme:\s*light;\s*\}/, "light 强制态覆写")
  assert.match(css, /:root\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;\s*\}/, "dark 强制态覆写")
  // 基线四值（D29 守界）逐字零动
  for (const line of ["--font: var(--mono);", "--fs: 14px;", "--lh: 1.5;", "--ls: normal;"]) {
    assert.ok(css.includes(line), `基线四值逐字零动：${line}`)
  }
  // 暗值逐字保原（抽样三项 —— 双块收敛零值改）
  for (const pair of ["#f7f8fa, #15171c", "#1b1f24, #e6e9ee", "#f44747"]) {
    assert.ok(css.includes(pair), `值对逐字保原：${pair}`)
  }
})

// ─── 腿 6 · 设置面头（描述符树平 node 直测）────────────────────────────────────

test("腿 6 · 设置面头：三钮锚齐 ∥ 当前态恰一 ∥ 缺 handlers ⇒ 三钮 disabled", async () => {
  const i18n = await import(pathToFileURL(rel("thincoder-desktop/renderer/i18n.mjs")).href)
  i18n.initDict({ locale: "en", dict: {} })
  const view = await import(pathToFileURL(rel("thincoder-desktop/renderer/views/settings.mjs")).href)
  const state = {
    locale: "en",
    theme: "dark",
    settings: {
      open: true, notice: null, configured: true, defaultModel: null,
      wizard: { step: 1, dismissed: true, notice: null },
      providers: { state: "none", presets: [], providers: [], edit: null, probe: null, draft: null, keyDraft: null },
      verify: null,
      model: { state: "none", provider: null, current: null, models: [] },
      agent: { state: "none", fields: [] },
      mcp: { state: "none", servers: [], details: {}, form: null },
      env: { state: "none" },
      tools: { state: "none", status: null, building: false, keys: null, edit: null },
      models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: {}, advisorPicker: {} },
    },
  }
  const handlers = { onSetTheme: () => {}, onToggleLang: () => {}, onCloseSettings: () => {} }
  const nodes = flatten(view.settingsTree(view.settingsModel(state), handlers))
  const buttons = nodes.filter((n) => n.props?.["data-action"] === "settings:theme")
  assert.equal(buttons.length, 3, "三钮在场")
  assert.deepEqual(buttons.map((b) => b.props["data-theme"]), ["system", "light", "dark"], "序 = 跟随系统 ∥ 亮色 ∥ 暗色")
  for (const button of buttons) {
    assert.equal(button.props.class, "settings-theme-opt")
    assert.equal(button.props.type, "button")
    assert.equal(typeof button.props.onClick, "function", "handlers 给 ⇒ 钮接线")
  }
  const active = buttons.filter((b) => b.props["data-active"] !== undefined)
  assert.equal(active.length, 1, "data-active 恰一")
  assert.equal(active[0].props["data-theme"], "dark", "当前态 = 切片 theme 读数")
  assert.equal(active[0].props["aria-pressed"], "true")
  assert.equal(buttons.filter((b) => b.props["aria-pressed"] === "true").length, 1, "aria-pressed 当前态恰一")
  const group = nodes.find((n) => n.props?.class === "settings-theme")
  assert.ok(group, "容器 settings-theme 在场")
  assert.equal(group.props.role, "group")
  assert.equal(group.props["aria-label"], "Theme")
  const langIndex = nodes.findIndex((n) => n.props?.["data-action"] === "settings:lang")
  assert.ok(nodes.indexOf(group) < langIndex, "钮族居语言控件左侧")
  assert.deepEqual(buttons.map((b) => b.children[0]), ["System", "Light", "Dark"], "词面（en）")

  // 缺 handlers ⇒ 三钮 disabled（沿 wire 两态通则）
  const bare = flatten(view.settingsTree(view.settingsModel(state), {}))
  const bareButtons = bare.filter((n) => n.props?.["data-action"] === "settings:theme")
  assert.equal(bareButtons.length, 3)
  for (const button of bareButtons) assert.equal(button.props.disabled, true, "缺 handlers ⇒ disabled")

  // 表外切片值 ⇒ 归 `system`（不猜）；zh 词面（附臂同测 —— 测试面随修随加）
  const odd = flatten(view.settingsTree(view.settingsModel({ ...state, theme: "blue" }), handlers))
  const oddActive = odd.filter((n) => n.props?.["data-action"] === "settings:theme" && n.props["data-active"] !== undefined)
  assert.equal(oddActive.length, 1)
  assert.equal(oddActive[0].props["data-theme"], "system", "表外切片值 ⇒ system 降级")
  i18n.initDict({ locale: "zh", dict: {} })
  try {
    const zhTree = view.settingsTree(view.settingsModel(state), handlers)
    const zhNodes = flatten(zhTree)
    assert.equal(zhNodes.find((n) => n.props?.class === "settings-theme").props["aria-label"], "主题")
    assert.deepEqual(
      zhNodes.filter((n) => n.props?.["data-action"] === "settings:theme").map((b) => b.children[0]),
      ["跟随系统", "亮色", "暗色"],
    )
  } finally {
    i18n.initDict({ locale: "en", dict: {} }) // 复位（i18n 模块级语言态 —— 防跨用例污染）
  }
})
