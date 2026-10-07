/**
 * 2026-10-06-console-list-style.test.mjs — thincoder-server 批内单测件（样式族总体统一批·AC-19 机检载体；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-console-list-style.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §2.5 ∥ §6 AC-19 两行 + 本批档 §2；腿 ↔ 族/轴对照在括号）：
 *   ① 底座（口径①——变量单源）：`:root` 变量族 38 在册且值表同拍（色 19 + 遮罩 1 ∥ 间距 7 ∥ 圆角 3 ∥ 字排 4 ∥
 *      线宽 2 ∥ 布局 2）∥ `:root` 块外零颜色字面量（hex/rgb/rgba/hsl）
 *   ② 一套刻度（②④⑤）：`font-size` 全 `var(--fs)`（缺省撤销——含 UA 带字号元素覆盖面）∥ `font-weight` 全 ≤400 ∥ `line-height` 全
 *      `var(--lh)` ∥ padding/margin/gap ∈ `--sp-*` ∪ {0, auto} ∪ 布局组（`var(--nav-w)`——底座布局行 ∥ S15：
 *      内容缩进；白名单口径 = AC-19 续行「∪ 布局组变量」）
 *   ③ 态面（④）：行悬停声明清单（`.nav-item:hover` ∥ `tbody tr:hover` ∥ `li.key-item:hover`——同取 `--hover`；
 *      清单外零行悬停声明）∥ 聚焦环单形（`--bw-strong solid var(--accent)`——全档 outline 同形；控件外偏 2px ∥
 *      行内缩 −2px）
 *   ④ 错态面（⑨ canon）：七处「加载失败」面 = `.hint error`（逐面逐行）∥ 系统页诊断失败面 2 处（状态行 ⇒
 *      `.error`——独立生效选择器；试跑行 ⇒ `.hint error`）∥ #103 段内错误面 = `.hint error` ∥ `"hint error"`
 *      全档计数同拍（10——错态不外溢）
 *   ⑤ 类名双向闭合（AC-19 续）：档面字面类 ⊆ `style.css` 类选择器 ∥ `style.css` 类选择器 ⊆ 档面字面类 ∪ 态类 ∥
 *      死类零残留（`key-line`/`stat`/`view`——规则与字面两向）
 *   ⑥ 静态面：档目 19 ∥ 20（本批零新档）逐名同拍 ∥ `public/**` 零外链 ∥ 静态直发（200 ∥ mime ∥ 字节等于磁盘）
 *   ⑦ 门禁清单：`prepublishOnly` 二十件含本批件（配额 v2 批后）∥ 清单目标在盘
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const CSS = readFileSync(join(PUBLIC_DIR, "style.css"), "utf8")
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
const STATIC = await import(pathToFileURL(join(ROOT, "thincoder-server", "src", "webui", "static.mjs")).href)

const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")
const linesOf = (name) => readPublic(name).split("\n")
/** 注释剔除（块注释——范围扫描以「无注释文本」为准）。 */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")
/** 规则表（选择器 ∥ 声明体——@media 内层规则同收，外层头行不收）。 */
const rulesOf = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, " "), body: m[2].trim() }))

// ── ① 底座（口径①——变量单源）：`:root` 变量族 ∥ 值表同拍 ∥ 块外零颜色字面量 ─────────────────

/** 底座值表（§2.5 底座——色 19 + 遮罩 1 ∥ 间距 7 ∥ 圆角 3 ∥ 字排 4 ∥ 线宽 2 ∥ 布局 2；计 38 = 变量族计数断言）。 */
const BASE_VARS = {
  "--bg": "#f5f6f8", "--panel": "#ffffff", "--fill": "#f0f2f5", "--hover": "#eef1f5", "--selected": "#e6efff",
  "--backdrop": "rgba(15, 23, 42, 0.45)",
  "--text": "#1f2430", "--muted": "#6b7280", "--border": "#d9dee5",
  "--accent": "#2f6fed", "--accent-hover": "#2a63d4", "--accent-contrast": "#ffffff",
  "--ok": "#2e9e5b", "--warn": "#d8a013", "--danger": "#c2372f", "--idle": "#9aa3b0",
  "--danger-fill": "#fff5f5", "--warn-fill": "#fff4d6", "--warn-line": "#e5cf98", "--warn-ink": "#6b4b00",
  "--sp-1": "2px", "--sp-2": "4px", "--sp-3": "6px", "--sp-4": "8px", "--sp-5": "12px", "--sp-6": "16px", "--sp-7": "20px",
  "--r-1": "4px", "--r-2": "6px", "--r-3": "8px",
  "--font": `system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif`,
  "--mono": `ui-monospace, Consolas, "Courier New", monospace`,
  "--fs": "13px", "--lh": "1.5",
  "--bw": "1px", "--bw-strong": "2px",
  "--nav-w": "200px", "--modal-w": "560px",
}

test("① 底座：`:root` 变量族 38（值表同拍）∥ 块外零颜色字面量", () => {
  const clean = stripComments(CSS)
  const rootMatch = clean.match(/:root\s*\{[^{}]*\}/)
  assert.ok(rootMatch !== null, ":root 变量底座缺位")
  const rootVars = new Map([...rootMatch[0].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)].map((m) => [m[1], m[2].trim()]))
  assert.equal(rootVars.size, Object.keys(BASE_VARS).length, `变量族计数不同拍：${rootVars.size}（期望 ${Object.keys(BASE_VARS).length}）`)
  for (const [name, value] of Object.entries(BASE_VARS)) assert.equal(rootVars.get(name), value, `底座变量 ${name} 值不同拍（现 ${rootVars.get(name)}）`)
  const outside = clean.replace(rootMatch[0], "")
  const hex = outside.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
  const fn = outside.match(/\b(?:rgba?|hsla?)\(/g) ?? []
  assert.deepEqual([hex, fn], [[], []], ":root 块外零颜色字面量（hex/rgb/rgba/hsl——口径①）")
})

// ── ② 一套刻度（口径②④⑤）：字号 ∥ 字重 ∥ 行高 ∥ 内距/栅格 ───────────────────────────────────

test("② 一套刻度：`font-size` 全 `var(--fs)`（缺省撤销——含覆盖面）∥ `font-weight` 全 ≤400 ∥ `line-height` 全 `var(--lh)` ∥ 内距/栅格 ∈ 刻度 ∪ 布局组", () => {
  const clean = stripComments(CSS)
  const fontSizes = [...clean.matchAll(/font-size\s*:\s*([^;}]+)/g)].map((m) => m[1].trim())
  assert.ok(fontSizes.length >= 20, `font-size 声明过少（扫描失效？）：${fontSizes.length}`)
  for (const value of fontSizes) assert.equal(value, "var(--fs)", `字号非唯一档：${value}`)
  assert.match(clean, /body\s*\{[^{}]*font-size:\s*var\(--fs\)/, "body 缺省撤销缺位（缺省 16px 不得生效）")
  const weights = [...clean.matchAll(/font-weight\s*:\s*([^;}]+)/g)].map((m) => m[1].trim())
  assert.ok(weights.length >= 1, "font-weight 声明缺位（UA 粗体未撤？）")
  for (const value of weights) {
    const num = Number(value)
    assert.ok(value === "normal" || (Number.isFinite(num) && num <= 400), `字重越 400：${value}`)
  }
  for (const value of [...clean.matchAll(/line-height\s*:\s*([^;}]+)/g)].map((m) => m[1].trim())) assert.equal(value, "var(--lh)", `行高非唯一档：${value}`)
  assert.match(clean, /body\s*\{[^{}]*line-height:\s*var\(--lh\)/, "行高全档继承缺位")
  // 缺省撤销（覆盖面——S5 列出的 UA 派生字号面）：在用 UA 带字号元素逐枚须携字号覆盖（font-size ∥ 控件 font: inherit）
  const UA_SIZE_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "pre", "code", "input", "select", "button", "textarea"]
  const usedTags = new Set()
  for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") || item === "index.html")) {
    for (const m of readPublic(name).matchAll(/h\("([a-z][a-z0-9-]*)"/g)) usedTags.add(m[1])
  }
  const rules = rulesOf(clean)
  for (const tag of UA_SIZE_TAGS.filter((item) => usedTags.has(item))) {
    const covered = rules.some((rule) => rule.selector.split(",").some((part) => new RegExp(`(?:^|[\\s>+~])${tag}(?![\\w-])`).test(part.trim())) && /font-size:\s*var\(--fs\)|font:\s*inherit/.test(rule.body))
    assert.ok(covered, `UA 带字号元素 <${tag}> 无字号声明覆盖（S5 缺省未撤）`)
  }
  // 内距/栅格：--sp-1..7 ∪ {0, auto} ∪ 布局组（--nav-w——底座布局行 ∥ S15：内容缩进；AC-19 续行白名单已补明）
  const SPACING = new Set(["0", "auto", ...Array.from({ length: 7 }, (_, index) => `var(--sp-${index + 1})`), "var(--nav-w)"])
  const decls = [...clean.matchAll(/(?:^|[;{\s])(padding|margin|gap)(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/g)]
  assert.ok(decls.length >= 40, `内距声明过少（扫描失效？）：${decls.length}`)
  for (const decl of decls) {
    for (const token of decl[2].trim().split(/\s+/)) assert.ok(SPACING.has(token), `内距越刻度：${decl[0]} ${decl[2].trim()}`)
  }
})

// ── ③ 态面（口径④）：行悬停声明清单 ∥ 聚焦环单形 ─────────────────────────────────────────────

test("③ 态面：行悬停声明清单（三声明同取 `var(--hover)`；清单外零行悬停声明）∥ 聚焦环单形", () => {
  const rules = rulesOf(stripComments(CSS))
  const ROW_HOVER = [".nav-item:hover", "tbody tr:hover", "li.key-item:hover"]
  const CTRL_HOVER = ["button:hover", "button.tiny:hover", "button.danger:hover", "button.link:hover", ".modal-close:hover"]
  const hoverRules = rules.filter((rule) => rule.selector.includes(":hover"))
  assert.deepEqual(hoverRules.map((rule) => rule.selector).sort(), [...ROW_HOVER, ...CTRL_HOVER].sort(), "悬停声明清单外残留（行悬停三 + 交互件五）")
  for (const selector of ROW_HOVER) {
    const rule = hoverRules.find((item) => item.selector === selector)
    assert.equal(rule.body.replace(/\s+/g, " ").trim(), "background: var(--hover);", `${selector} 悬停底非同值（唯一行悬停取色）`)
  }
  const outlines = [...stripComments(CSS).matchAll(/outline\s*:\s*([^;}]+)/g)].map((m) => m[1].replace(/\s+/g, " ").trim())
  assert.ok(outlines.length >= 2, "聚焦环声明缺位")
  for (const value of outlines) assert.equal(value, "var(--bw-strong) solid var(--accent)", `聚焦环非单形：${value}`)
  const rowFocus = rules.find((rule) => rule.selector === ".row-clickable:focus-visible")
  assert.match(rowFocus.body, /outline-offset:\s*-2px/, "行内环偏移（−2px）")
  const ctrlFocus = rules.find((rule) => rule.selector.includes("input:focus-visible"))
  assert.match(ctrlFocus.body, /outline-offset:\s*2px/, "控件外偏（2px）")
})

// ── ④ 错态面（⑨ canon）：七处「加载失败」面 ∥ 系统页诊断失败面 2 处 ∥ 段内错误面 ──────────────

test("④ 错态面：`.hint error` 逐面套用（七处 loadFailed + 系统页两处 + 段内三处 + 配额批窗内三处）∥ `\"hint error\"` 计数同拍 15", () => {
  const FACES = [
    ["views-admin.mjs", "admin.members.loadFailed"],
    ["views-me.mjs", "usage.loadFailed"],
    ["views-models.mjs", "admin.models.loadFailed"],
    ["views-usage.mjs", "usage.loadFailed"],
    ["views-audit.mjs", "audit.loadFailed"],
    ["views-providers.mjs", "admin.providers.listFailed"],
  ]
  let faceCount = 0
  for (const [file, key] of FACES) {
    const hits = linesOf(file).filter((line) => line.includes(`t("${key}")`))
    assert.ok(hits.length >= 1, `${file} 缺错误面文案点：${key}`)
    for (const line of hits) {
      faceCount += 1
      assert.ok(line.includes(`class: "hint error"`), `${file} 错误面未套 canon（${key}）：${line.trim()}`)
    }
  }
  assert.equal(faceCount, 7, "七处「加载失败」面计数同拍")
  // 系统页诊断失败面 2 处：状态行 ⇒ `.error`（独立生效——该面现无 `.hint`）∥ 试跑行 ⇒ `.hint error`
  const system = readPublic("views-system.mjs")
  assert.ok(system.includes(`statusValue.className = result.ok ? "" : "error"`), "状态行失败文案未携 `.error`")
  assert.ok(system.includes(`testResult.className = result.ok ? "hint" : "hint error"`), "试跑行失败未携 `.hint error`")
  assert.match(stripComments(CSS), /(?:^|[}\s])\.error\s*\{/, "`.error` 独立生效选择器缺位（`.hint.error` 复合不生效）")
  // #103 段内错误面（发现失败 ⇒ 段内提示 = 错态——本批以当刻盘面并入）
  assert.ok(readPublic("views-providers-modals.mjs").includes(`h("p", { class: "hint error", text: errorText })`), "段内错误面未套 canon")
  // 2026-10-07 走查收正：测试连接结果行（失败 ⇒ 段内 `.hint error`——同窗；AC-18「测试同窗」）
  assert.ok(readPublic("views-providers-modals.mjs").includes(`isError ? "hint error" : "hint"`), "测试连接失败未套 canon（同窗结果行）")
  // 计数同拍（错态不外溢——加载/空态保持纯 `.hint`）
  // 2026-10-07 配额批：views-admin 窗内状态行 +3（保存失败 ∥ 编辑态 hint ∥ 加载失败窗内行）⇒ 12 ⇒ 15（父侧直接执行 · 可 revert）
  const total = ["views-admin.mjs", "views-me.mjs", "views-models.mjs", "views-usage.mjs", "views-audit.mjs", "views-providers.mjs", "views-providers-modals.mjs", "views-system.mjs"]
    .reduce((sum, file) => sum + (readPublic(file).match(/"hint error"/g) ?? []).length, 0)
  assert.equal(total, 15, `\`"hint error"\` 计数不同拍：${total}`)
})

// ── ⑤ 类名双向闭合（AC-19 续）：档面字面类 ↔ style.css 类选择器 ∥ 死类零残留 ─────────────────

/** 态类（动态/交互态——非档面字面类；双向闭合第二向的允许集）。 */
const STATE_CLASSES = ["active", "ok", "degraded", "down", "error", "modal-open"]

test("⑤ 类名双向闭合 ∥ 死类零残留（`key-line`/`stat`/`view`）", () => {
  const cssClasses = new Set([...stripComments(CSS).matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]))
  const usedClasses = new Set()
  for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs") || item === "index.html")) {
    const src = readPublic(name)
    for (const m of src.matchAll(/\bclass(?:Name)?\s*[:=]\s*([^\n;]*?)(?=\s*\bclass(?:Name)?\s*[:=]|[;\n]|$)/g)) {
      const window = m[1].replace(/\$\{[^}]*\}/g, " ").split("//")[0].split("}")[0].split(/,\s*[A-Za-z_$][\w$]*\s*:/)[0]
      for (const literal of window.matchAll(/["'`]([^"'`]*)["'`]/g)) for (const token of literal[1].split(/\s+/)) if (token) usedClasses.add(token)
    }
    for (const m of src.matchAll(/classList\.(?:add|remove|toggle)\(\s*["']([^"']*)["']/g)) usedClasses.add(m[1])
  }
  // 提取器健康（零误扫卫——两向各抽正例）
  for (const known of ["row-clickable", "table-wrap", "key-item", "config-field", "hint", "tiny"]) assert.ok(usedClasses.has(known), `类面扫描失效：${known}`)
  for (const known of ["card", "row-clickable", "key-item", "config-field", "modal", "error"]) assert.ok(cssClasses.has(known), `样式类扫描失效：${known}`)
  const STATE = new Set(STATE_CLASSES)
  for (const token of usedClasses) assert.ok(cssClasses.has(token), `档面类无样式规则：${token}`)
  for (const cls of cssClasses) assert.ok(usedClasses.has(cls) || STATE.has(cls), `样式类零消费者：.${cls}`)
  for (const dead of ["key-line", "stat", "view"]) {
    assert.equal(cssClasses.has(dead), false, `死类规则残留：.${dead}`)
    assert.equal(usedClasses.has(dead), false, `死类字面量残留：${dead}`)
  }
})

// ── ⑥ 静态面：档目 19 ∥ 20 ∥ 零外链 ∥ 直发（200 ∥ mime ∥ 字节等于磁盘）────────────────────────

test("⑥ 静态面：档目 19 ∥ 20 逐名同拍（本批零新档）∥ `public/**` 零外链 ∥ 直发", async () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [20, 19], "全目录 20 ∥ UI 代码档 19")
  assert.deepEqual(names, [
    "app.mjs", "favicon.png", "i18n-en.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "style.css",
    "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs",
    "views-providers-modals.mjs", "views-providers.mjs", "views-system.mjs", "views-usage.mjs",
  ])
  for (const name of names) {
    const text = readPublic(name)
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  const site = STATIC.createStaticSite()
  const server = createHttpServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) { res.writeHead(404); res.end() }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    for (const [name, mime] of [["style.css", /text\/css/], ["app.mjs", /text\/javascript/], ["views-providers-modals.mjs", /text\/javascript/]]) {
      const response = await fetch(`http://127.0.0.1:${port}/${name}`)
      assert.deepEqual([response.status, (await response.text()) === readPublic(name)], [200, true], `${name} 直发（200 ∥ 字节等于磁盘）`)
      assert.match(response.headers.get("content-type"), mime, name)
    }
  } finally {
    server.closeAllConnections?.()
    await new Promise((done) => server.close(done))
  }
})

// ── ⑦ 门禁清单：`prepublishOnly` 二十件（含本批件）∥ 清单目标在盘 ─────────────────────────────

test("⑦ 门禁清单：`prepublishOnly` 二十件含本批件 ∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.equal(batchFiles.length, 20, `门禁清单件数（十九 ⇒ 二十——配额 v2 批）：${batchFiles.length}`)
  assert.ok(batchFiles.includes("docs/batches/2026-10-06-console-list-style.test.mjs"), "本批件应入列")
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
