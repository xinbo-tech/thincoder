/**
 * 2026-09-30-desktop-typography-unify.test.mjs — 批内件（排版统一批 · D29 · 台账 #736 · **源扫描腿**）。
 * 判据表 = 批档 `docs/batches/2026-09-30-desktop-typography-unify.md` §2 §九「机检判据 · 源扫描腿」①–⑦。
 * 输入 = 12 档桌面 CSS（含零改 `skin.css`——第 12 档）+ `renderer/index.html` 骨架（批档 §2 §六-A/B 清册面）；随批留存 · 不进仓套件。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-09-30-desktop-typography-unify.test.mjs
 *
 * 判据形（逐条 ⇄ 批档 §2 §九）：
 *   ① font-size：全档 ∈ {`var(--fs)`} ∪ 白名单（`core-markdown.css` ∥ `core.css` 内 em 修饰选择器集
 *      ——标题 h1–h6 ∥ code ∥ `.code-block code` ∥ table）∪ {`inherit`}；**零 px/rem 字面**。
 *   ② font-weight：≤ 400 ∪ 白名单（`strong` ∥ h1–h6 ∥ `th`）。
 *   ③ `theme.css` 三变量在位（`--fs: 14px` ∥ `--lh: 1.3` ∥ `--ls: normal`）∧ `--font` 指 `var(--mono)`。
 *   ④ `chat-composer.css` 覆盖段选择器清单在位（批档 §2 §六-C —— 搜索条三锚按实盘 DOM 面收正，见下）。
 *   ⑤ letter-spacing：值一律取单源 `var(--ls)`（零 tracking 字面）；声明点 = `theme.css` 基面 + 覆盖段推理钮复位
 *      （核件 `composer/composer.css` 逐字锁载 `letter-spacing: 0.5px`——真机判据⑤ `letter-spacing = normal` 须由
 *      覆盖段归零回收；批档 §2 §六-B「`#reasoning-btn` `ls:0.5px` ⇒ 覆盖段收基线」即此点）。
 *   ⑥ line-height：∈ {`var(--lh)`} ∪ {`inherit`}（`core.css` 面 20 推理内覆盖——设计「零改」面）。
 *   ⑦ 负面锁：`thincoder-render-core/**` ∥ `thincoder-vscode/**` 零 diff（核件逐字锁 + VSC 侧零改）；
 *      在册例外 = `thincoder-vscode/src/extension/image-handler.mjs`（#735 在飞批改动，非本批）。
 *   ⑧ 骨架零改（`index.html` 零 font 字面 ∥ 链序在位）；⑨ `font-family` 全档单源（`var(--font)` ∥ `var(--mono)` ∥ `inherit`——零族字面；`font` 简写同拍）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const ROOT = process.cwd()
const CSS_FILES = [
  "thincoder-desktop/renderer/theme.css",
  "thincoder-desktop/renderer/chrome.css",
  "thincoder-desktop/renderer/session-list.css",
  "thincoder-desktop/renderer/skin.css",
  "thincoder-desktop/renderer/chat.css",
  "thincoder-desktop/renderer/chat-cards.css",
  "thincoder-desktop/renderer/chat-composer.css",
  "thincoder-desktop/renderer/chat-fixes.css",
  "thincoder-desktop/renderer/core-markdown.css",
  "thincoder-desktop/renderer/core.css",
  "thincoder-desktop/renderer/pool.css",
  "thincoder-desktop/renderer/settings.css",
]
const HTML = "thincoder-desktop/renderer/index.html"

const text = (rel) => readFileSync(`${ROOT}/${rel}`, "utf8")

/** 注释剥离（块注释清空、换行位保留——行号 ∕ 偏移对齐）：声明扫描面。 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
}

/** 平铺规则解析（含 `@media` 下钻——本仓 CSS 无嵌套规则，仅 at-rule 一层）：返回 [{ selector, body, at }]。 */
function parseRules(css, base = 0, out = []) {
  let i = 0
  while (i < css.length) {
    const open = css.indexOf("{", i)
    if (open === -1) break
    const selector = css.slice(i, open).trim()
    let depth = 1
    let j = open + 1
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth += 1
      else if (css[j] === "}") depth -= 1
      j += 1
    }
    const body = css.slice(open + 1, j - 1)
    if (selector.startsWith("@")) parseRules(body, base + open + 1, out)
    else out.push({ selector, body, at: base + open + 1 })
    i = j
  }
  return out
}

/** 规则内声明 [{ prop, value, line }]（line = 原文件 1-based 行号）。 */
function declsOf(file, raw, rule) {
  const out = []
  const re = /([a-zA-Z-]+)\s*:\s*([^;\n]+)/g
  let m
  while ((m = re.exec(rule.body)) !== null) {
    const at = rule.at + m.index
    const line = raw.slice(0, at).split("\n").length
    out.push({ prop: m[1].trim(), value: m[2].trim(), line })
  }
  return out
}

function rulesOf(rel) {
  const raw = text(rel)
  return { raw, rules: parseRules(stripComments(raw)) }
}

/** 逐档全量声明（源扫描共用面）。 */
function allDecls() {
  const rows = []
  for (const rel of CSS_FILES) {
    const { raw, rules } = rulesOf(rel)
    for (const rule of rules) {
      for (const d of declsOf(rel, raw, rule)) rows.push({ file: rel, selector: rule.selector, ...d })
    }
  }
  return rows
}

const MODIFIER_EM_SELECTOR = (selector) => /(\.block-text|\.reasoning-content)[^{]*(\bh[1-6]\b|\bcode\b|\btable\b)/.test(selector)
const MODIFIER_WEIGHT_SELECTOR = (selector) => /\bstrong\b/.test(selector) || /\bth\b/.test(selector) || /\bh[1-6]\b/.test(selector)
const EM_VALUE = /^\d*\.?\d+em$/

test("① font-size：全档取 `var(--fs)` ∪ em 修饰白名单；零 px/rem 字面", () => {
  const rows = allDecls().filter((d) => d.prop === "font-size")
  assert.ok(rows.length > 40, `声明数异常（${rows.length}）——清册面缺失`)
  const violations = []
  const emSeen = new Set()
  for (const d of rows) {
    if (d.value === "var(--fs)") continue
    if (d.value === "inherit") {
      // 面 20 推理内 `.code-lang` 复位（`core.css` —— 设计「零改」面）。
      if (d.file !== "thincoder-desktop/renderer/core.css") violations.push(`${d.file}:${d.line} inherit 仅限 core.css 面 20`)
      continue
    }
    if (EM_VALUE.test(d.value)) {
      emSeen.add(Number.parseFloat(d.value))
      if (!["thincoder-desktop/renderer/core-markdown.css", "thincoder-desktop/renderer/core.css"].includes(d.file)) {
        violations.push(`${d.file}:${d.line} em 修饰越档（${d.value}）`)
      }
      if (!MODIFIER_EM_SELECTOR(d.selector)) violations.push(`${d.file}:${d.line} em 修饰越选择器（${d.selector}）`)
      continue
    }
    violations.push(`${d.file}:${d.line} font-size 逃逸（${d.value}）`)
  }
  assert.deepEqual(violations, [], violations.join("\n"))
  // em 值闭集（批档 §2 §七 + 核档 §5 覆盖块：标题 1.3–0.9 ∥ 行内码 0.9/0.92 ∥ 代码体 0.88 ∥ 表 0.9）。
  const expected = new Set([1.3, 1.15, 1.05, 1, 0.95, 0.9, 0.92, 0.88])
  for (const v of emSeen) assert.ok(expected.has(v), `em 值越闭集：${v}em`)
})

test("② font-weight：≤ 400 ∪ markdown 修饰白名单（strong ∥ h1–h6 ∥ th）", () => {
  const rows = allDecls().filter((d) => d.prop === "font-weight")
  assert.ok(rows.length > 5, `声明数异常（${rows.length}）`)
  const violations = []
  for (const d of rows) {
    const n = Number.parseInt(d.value, 10)
    assert.ok(Number.isFinite(n), `${d.file}:${d.line} font-weight 非数（${d.value}）`)
    if (n <= 400) continue
    const modifierFile = ["thincoder-desktop/renderer/core-markdown.css", "thincoder-desktop/renderer/core.css"].includes(d.file)
    if (modifierFile && MODIFIER_WEIGHT_SELECTOR(d.selector)) continue
    violations.push(`${d.file}:${d.line} font-weight > 400 逃逸（${d.value} @ ${d.selector}）`)
  }
  assert.deepEqual(violations, [], violations.join("\n"))
})

test("③ theme.css：三变量在位 ∧ `--font` 指 `var(--mono)`", () => {
  const { raw, rules } = rulesOf("thincoder-desktop/renderer/theme.css")
  const decls = rules.flatMap((rule) => declsOf("theme.css", raw, rule))
  const get = (prop) => decls.filter((d) => d.prop === prop).map((d) => d.value)
  // 轻通道轮三 ∥ 轮四 ∥ 轮五（2026-10-01 · 台账 #759 ∥ #808）随盘收正：族首 Cascadia Mono（轮三）∥ 14px ⇒ 12px ∥ 1.5 ⇒ 1.3（轮四）∥ 12px ⇒ 14px（轮五 定版）。
  assert.deepEqual(get("--fs"), ["14px"])
  assert.deepEqual(get("--lh"), ["1.3"])
  assert.deepEqual(get("--ls"), ["normal"])
  assert.deepEqual(get("--font"), ["var(--mono)"])
  assert.ok(get("--mono").some((v) => v.startsWith("\"Cascadia Mono\"") && v.includes("ui-monospace")), "--mono 等宽栈缺失")
  // 变量单源：余十档零 `--font` / `--mono` 重声明。
  for (const rel of CSS_FILES.filter((f) => !f.endsWith("theme.css"))) {
    const r = rulesOf(rel)
    const redeclared = r.rules.flatMap((rule) => declsOf(rel, r.raw, rule)).filter((d) => d.prop === "--font" || d.prop === "--mono")
    assert.deepEqual(redeclared, [], `${rel} 重声明族变量`)
  }
  // 基面消费：`body` 面 `font` 简写取三变量 ∥ `letter-spacing` 独立一行。
  const body = rules.find((rule) => rule.selector === "body")
  assert.ok(body, "body 规则缺失")
  const bodyDecls = declsOf("theme.css", raw, body)
  assert.ok(bodyDecls.some((d) => d.prop === "font" && d.value === "var(--fs)/var(--lh) var(--font)"), "body font 简写未取变量")
  assert.ok(bodyDecls.some((d) => d.prop === "letter-spacing" && d.value === "var(--ls)"), "body letter-spacing 独立行缺失")
})

test("④ chat-composer.css 覆盖段选择器清单在位（批档 §2 §六-C）", () => {
  const { rules } = rulesOf("thincoder-desktop/renderer/chat-composer.css")
  const selectors = new Set(rules.flatMap((rule) => rule.selector.split(",").map((s) => s.trim())))
  const expected = [
    ".composer #paste-bar",
    "body .paste-toast",
    ".composer .paste-chip",
    ".composer .paste-chip-del",
    ".composer #input",
    ".composer #send-btn",
    ".composer #abort-btn",
    ".composer #attach-btn",
    ".composer .ctrl-btn",
    ".composer #reasoning-btn",
    ".composer .dropdown-item",
    ".composer .dropdown-item .check",
    ".composer .dropdown-item .dropdown-sub",
    ".composer .dropdown-item .submenu-arrow",
    ".composer .dropdown-manage",
    ".composer #at-dropdown .dropdown-item",
    ".composer .at-file-name",
    ".composer .at-file-path",
    "body .auto-confirm-text",
    "body .auto-confirm-yes",
    "body .auto-confirm-no",
    "body .mm-panel",
    "body .mm-flyout",
    "body .mm-row .mm-sub",
    "body .mm-manage",
    "body .mm-filter",
    // 搜索条三锚：核 `search.mjs` 把 `#search-bar` 插在 `#toolbar` 之前（兄弟节点——`insertBefore(bar, toolbar)`）
    // ⇒ 设计清单 `#toolbar …` 前缀与其 DOM 面不符，按实际锚 × 特征度提升落（差异已报）。
    "#search-bar #search-input",
    "#search-bar #search-count",
    "body #search-bar button",
  ]
  const missing = expected.filter((s) => !selectors.has(s))
  assert.deepEqual(missing, [], `覆盖段缺选择器：${missing.join(" ∥ ")}`)
})

test("⑤ letter-spacing：值一律取单源 `var(--ls)`；零 tracking 字面", () => {
  const rows = allDecls().filter((d) => d.prop === "letter-spacing")
  const violations = []
  for (const d of rows) {
    if (d.value !== "var(--ls)") violations.push(`${d.file}:${d.line} tracking 字面（${d.value}）`)
  }
  assert.deepEqual(violations, [], violations.join("\n"))
  const sites = [...new Set(rows.map((d) => d.file))].sort()
  assert.deepEqual(sites, ["thincoder-desktop/renderer/chat-composer.css", "thincoder-desktop/renderer/theme.css"], `声明点越界：${sites.join(",")}`)
  const theme = rows.filter((d) => d.file.endsWith("theme.css"))
  assert.equal(theme.length, 1, "theme.css 基面声明点应为恰 1 处")
  const override = rows.filter((d) => d.file.endsWith("chat-composer.css"))
  assert.equal(override.length, 1, "覆盖段归零声明点应为恰 1 处（核件 `#reasoning-btn` 复位）")
})

test("⑥ line-height：∈ {`var(--lh)`} ∪ {`inherit`}（core.css 面 20）", () => {
  const rows = allDecls().filter((d) => d.prop === "line-height")
  assert.ok(rows.length > 15, `声明数异常（${rows.length}）`)
  const violations = []
  for (const d of rows) {
    if (d.value === "var(--lh)") continue
    if (d.value === "inherit" && d.file === "thincoder-desktop/renderer/core.css" && /\.code-block\s+code/.test(d.selector)) continue
    violations.push(`${d.file}:${d.line} line-height 逃逸（${d.value}）`)
  }
  assert.deepEqual(violations, [], violations.join("\n"))
})

test("⑦ 负面锁：`thincoder-render-core/**` ∥ `thincoder-vscode/**` 零 diff（在册例外除外）", () => {
  const porcelain = execFileSync("git", ["status", "--porcelain", "--", "thincoder-render-core", "thincoder-vscode"], {
    cwd: ROOT, encoding: "utf8",
  })
  const entries = porcelain.split("\n").map((l) => l.trim()).filter(Boolean)
  // 在册例外 = `thincoder-vscode/src/extension/image-handler.mjs`（#735 在飞批改动——本批零触；基线记录 = 2026-09-30）。
  const recorded = new Set(["M thincoder-vscode/src/extension/image-handler.mjs"])
  const unexpected = entries.filter((e) => !recorded.has(e))
  assert.deepEqual(unexpected, [], `核件 ∕ VSC 侧越界改动：${unexpected.join(" ∥ ")}`)
  // 核件 `composer/composer.css` 逐字锁：与 HEAD 逐字节同。
  const composerDiff = execFileSync("git", ["diff", "--stat", "--", "thincoder-render-core/composer/composer.css"], { cwd: ROOT, encoding: "utf8" })
  assert.equal(composerDiff.trim(), "", "核件 `composer/composer.css` 被改（逐字锁破）")
})

test("⑧ 骨架零改：index.html 无 font 字面（链序零动）", () => {
  const html = text(HTML)
  assert.ok(html.length > 0, "骨架缺失")
  assert.equal(/font-size|font-weight|letter-spacing|font-family/.test(html), false, "骨架携 font 字面（应零改）")
  // 链序在位（11 档 CSS —— 排版单源 = theme.css 居首）。
  for (const rel of CSS_FILES) {
    const href = `./${rel.split("/").pop()}`
    assert.ok(html.includes(href), `链序缺 ${href}`)
  }
})

test("⑨ font-family 全档单源：∈ {`var(--font)`, `var(--mono)`, `inherit`}——零族字面（`font` 简写同拍）", () => {
  const rows = allDecls().filter((d) => d.prop === "font-family")
  assert.ok(rows.length > 5, `声明数异常（${rows.length}）`)
  const violations = rows
    .filter((d) => !["var(--font)", "var(--mono)", "inherit"].includes(d.value))
    .map((d) => `${d.file}:${d.line} 族字面（${d.value}）`)
  assert.deepEqual(violations, [], violations.join("\n"))
  // `font` 简写：族面只许两处变量式（theme 基面 ∥ settings 面）+ `inherit`（控件回收）。
  const shorthand = allDecls().filter((d) => d.prop === "font")
  const bad = shorthand
    .filter((d) => !["inherit", "var(--fs)/var(--lh) var(--font)"].includes(d.value))
    .map((d) => `${d.file}:${d.line} font 简写逃逸（${d.value}）`)
  assert.deepEqual(bad, [], bad.join("\n"))
})
