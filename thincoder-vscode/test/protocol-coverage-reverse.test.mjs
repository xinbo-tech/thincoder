/**
 * protocol-coverage-reverse.test.mjs — 发面（webview → host）协议全量对表机检
 * （VSC 配置页接线修复批 · F-W12 / N-W7）。
 *
 * 判据权威 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §13（表落点 + 头注：枚举口径 / 四形态登记
 * / fail-closed 点名失败）；处置判定 = 活（双向在位）/ 补（发射在位而 host 缺消费位）/
 * 删（host 消费位在位而发射恒无——死 handler）。
 *
 * 枚举口径（唯一）：只取**顶级判别式**——webview 侧 = `postMessage` 载荷顶级 `type` 字面量；
 * host 侧 = 分发档（`panel-messages*.mjs`）顶级 `case` 标签。子判别式不单列。
 *
 * 形态登记（四形态——未登记形态 ⇒ fail-closed 点名，不静默漏计数）：① 对象字面量（多数）·
 * ② 三元双分支（`editMcp` / `saveMcpServer`）· ③ 局部对象绑定（`question.js` 的 `payload`）·
 * ④ 局部箭头函数返回字面量（`permission.js` 的 `reply`）。
 *
 * 形态先例 = `test/protocol-coverage.test.mjs`（§12 收面全量对表——表行读数同款）。
 * 表行读数（逐行坐标 = 执行时实测输出）：`node test/protocol-coverage-reverse.test.mjs --emit`
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const VSC = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PROTOCOL = resolve(VSC, "..", "docs", "vsc", "design", "WEBVIEW-PROTOCOL.md")

/** 处置闭区间（§13 方向口径）。 */
const DISPOSITIONS = ["活", "删", "补"]

/** host 分发档（§13 头注：`panel-messages*.mjs` 顶级 `case` 标签）。 */
const HOST_DISPATCH = "panel-messages"

// ── 词法工具（与 §12 机检同款：配平切片 / 行号 / 相对路径）──────

const lineAt = (code, idx) => code.slice(0, idx).split("\n").length
const relOf = (root, abs) => relative(root, abs).split("\\").join("/")

const skipLiteral = (text, i) => {
  const c = text[i]
  i += 1
  while (i < text.length && text[i] !== c) i += text[i] === "\\" ? 2 : 1
  return i
}

/** 配平切片（字符串形态）：`text[openIdx]` 为 `(` / `{` ⇒ 返回其内部文本。 */
function sliceBalanced(text, openIdx) {
  const close = text[openIdx] === "(" ? ")" : "}"
  let depth = 0
  for (let i = openIdx; i < text.length; i += 1) {
    const c = text[i]
    if (c === '"' || c === "'" || c === "`") { i = skipLiteral(text, i); continue }
    if (c === "/" && text[i + 1] === "/") { i = text.indexOf("\n", i); if (i < 0) break; continue }
    if (c === "/" && text[i + 1] === "*") { i = text.indexOf("*/", i) + 1; continue }
    if (c === "(" || c === "{") depth += 1
    else if (c === ")" || c === "}") {
      depth -= 1
      if (depth === 0) return text.slice(openIdx + 1, i)
    }
  }
  throw new Error(`sliceBalanced: 未配平 @${openIdx}`)
}

/** 源档（webview 树：浏览器直载 `.js` + `.mjs` 两树同扫）。 */
function webviewFiles(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (!e.name.startsWith("_") && e.name !== "node_modules") out.push(...webviewFiles(p))
    } else if (e.name.endsWith(".mjs") || e.name.endsWith(".js")) out.push(p)
  }
  return out
}

/** 对象**体**内的顶级 `type` 字面量（嵌套对象 / 三元分支的 `type` 不计——只取载荷顶级判别式）。 */
function scanTypeLits(body) {
  const out = []
  let depth = 0
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i]
    if (c === '"' || c === "'" || c === "`") { i = skipLiteral(body, i); continue }
    if (c === "{") { depth += 1; continue }
    if (c === "(" || c === "[") { depth += 1; continue }
    if (c === "}" || c === ")" || c === "]") { depth -= 1; continue }
    if (depth === 0 && c === "t") {
      const hit = /^type:\s*"([^"\n]+)"/.exec(body.slice(i, i + 200))
      if (hit) { out.push(hit[1]); i += hit[0].length - 1 }
    }
  }
  return out
}

/** 对象字面量文本 ⇒ 其顶级 type 字面量（`{ ... }`）。 */
function objectTypes(text) {
  const t = text.trim()
  return scanTypeLits(sliceBalanced(t, t.indexOf("{")))
}

/** 三元表达式顶层 `?`（跳过 `?.`）与配对 `:` ⇒ [then, else]（非三元 ⇒ null）。 */
function ternaryBranches(expr) {
  let depth = 0
  let q = -1
  for (let i = 0; i < expr.length; i += 1) {
    const c = expr[i]
    if (c === '"' || c === "'" || c === "`") { i = skipLiteral(expr, i); continue }
    if (c === "(" || c === "{" || c === "[") depth += 1
    else if (c === ")" || c === "}" || c === "]") depth -= 1
    else if (depth === 0 && c === "?" && q < 0 && expr[i + 1] !== ".") q = i
    else if (depth === 0 && c === ":" && q >= 0) return [expr.slice(q + 1, i), expr.slice(i + 1)]
  }
  return null
}

/** 同档内标识符的局部绑定初始化式（`postMessage(x)` 的实参来源——形态③/④）。 */
function initOf(code, idx, ident) {
  const re = new RegExp(`(?:const|let|var)\\s+${ident}\\s*=\\s*`, "g")
  let last = null
  for (const m of code.matchAll(re)) {
    if (m.index > idx) break
    last = m
  }
  if (!last) return null
  const start = last.index + last[0].length
  const rest = code.slice(start).trimStart()
  const lead = start + (code.slice(start).length - rest.length)
  if (rest.startsWith("{")) return { form: "bind", text: sliceBalanced(code, lead) }
  const arrow = rest.indexOf("=>")
  if (arrow < 0 || arrow > 40) return null
  const after = code.slice(lead + arrow + 2).trimStart()
  const lead2 = lead + arrow + 2 + (code.slice(lead + arrow + 2).length - after.length)
  if (!after.startsWith("(") && !after.startsWith("{")) return null
  const sliced = sliceBalanced(code, lead2)          // `({...})` ⇒ `{...}`；`{...}` ⇒ body
  return { form: "arrow", text: sliced.trim().startsWith("{") ? sliceBalanced(sliced, sliced.indexOf("{")) : sliced }
}

/** 单条 `postMessage` 实参 ⇒ 判别式（形态登记——未登记形态点名失败）。 */
function typesOfArg(code, arg, where, idx) {
  const t = arg.trim()
  if (t.startsWith("{")) {
    const types = objectTypes(t)
    assert.equal(types.length, 1, `形态① 对象字面量须恰含一个顶级 type 字面量（fail-closed）：${where}`)
    return { form: "obj", types }
  }
  const branches = ternaryBranches(t)
  if (branches) {
    for (const b of branches) assert.ok(b.trim().startsWith("{"), `形态② 三元双分支两侧须皆对象字面量（fail-closed）：${where}`)
    const types = branches.flatMap((b) => objectTypes(b))
    assert.equal(types.length, 2, `形态② 三元双分支须恰含两个顶级 type 字面量（fail-closed）：${where}`)
    return { form: "ternary", types }
  }
  // 形态③ 局部对象绑定（`postMessage(payload)`）/ 形态④ 局部箭头函数（`postMessage(reply(true))`）
  const ident = /^([A-Za-z_$][\w$]*)(?:\s*\([\s\S]*\))?$/.exec(t)
  if (ident) {
    const init = initOf(code, idx, ident[1])
    assert.ok(init, `形态未登记（postMessage(${t}) 无同档局部绑定解析——两种形态之外）：${where}`)
    const types = scanTypeLits(` ${init.text} `)
    assert.equal(types.length, 1, `形态③/④ 局部绑定须恰含一个顶级 type 字面量（fail-closed）：${where}`)
    return { form: init.form, types }
  }
  assert.fail(`postMessage 载荷形态未登记（禁止静默漏计数）：${where}`)
}

/** webview 侧发射集：`postMessage` 载荷顶级 `type` 字面量（四形态普查同出）。 */
function webviewSites(root) {
  const byDisc = new Map()
  const forms = new Map()
  const push = (disc, where, form) => {
    if (!byDisc.has(disc)) byDisc.set(disc, new Set())
    byDisc.get(disc).add(where)
    if (!forms.has(form)) forms.set(form, [])
    forms.get(form).push(`${disc} @ ${where}`)
  }
  for (const abs of webviewFiles(join(root, "webview"))) {
    const code = readFileSync(abs, "utf8")
    const rel = relOf(root, abs)
    for (const m of code.matchAll(/\.postMessage\(/g)) {
      const where = `${rel}:${lineAt(code, m.index)}`
      const arg = sliceBalanced(code, m.index + m[0].length - 1)
      const { form, types } = typesOfArg(code, arg, where, m.index)
      for (const d of types) push(d, where, form)
    }
  }
  return { byDisc, forms }
}

/** host 侧分发档：`panel-messages*.mjs` 顶级 `case` 标签。 */
function hostCases(root) {
  const byDisc = new Map()
  const dir = join(root, "src", "extension")
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile() || !e.name.startsWith(HOST_DISPATCH) || !e.name.endsWith(".mjs")) continue
    const abs = join(dir, e.name)
    const code = readFileSync(abs, "utf8")
    const rel = relOf(root, abs)
    for (const m of code.matchAll(/switch\s*\(\s*[\w$]+(?:\.[\w$]+)*\.type\s*\)\s*\{/g)) {
      const body = sliceBalanced(code, m.index + m[0].length - 1)
      const base = m.index + m[0].length
      let depth = 0
      for (let i = 0; i < body.length; i += 1) {
        const c = body[i]
        if (c === '"' || c === "'" || c === "`") { i = skipLiteral(body, i); continue }
        if (c === "/" && body[i + 1] === "/") { i = body.indexOf("\n", i); if (i < 0) break; continue }
        if (c === "{") { depth += 1; continue }
        if (c === "}") { depth -= 1; continue }
        if (depth === 0 && c === "c") {
          const hit = /^case\s+"([^"]+)"/.exec(body.slice(i, i + 200))
          if (hit) {
            if (!byDisc.has(hit[1])) byDisc.set(hit[1], new Set())
            byDisc.get(hit[1]).add(`${rel}:${lineAt(code, base + i)}`)
            i += 4
          }
        }
      }
    }
  }
  return byDisc
}

// ── 文档面（§13 表） ────────────────────────────────────────

/** 解析 `WEBVIEW-PROTOCOL.md` §13 表：首列判别式 + 五列单元（不读散文句）。 */
function protocolRows(md) {
  const anchor = md.indexOf("\n## 13.")
  assert.ok(anchor > 0, "§13 节在位（发面表落点——`docs/vsc/design/WEBVIEW-PROTOCOL.md`）")
  const rest = md.slice(anchor + 1)
  const end = rest.indexOf("\n## ")
  const section = end < 0 ? rest : rest.slice(0, end)
  const rows = []
  for (const line of section.split("\n")) {
    const t = line.trim()
    if (!t.startsWith("|")) continue
    const cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim())
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
    if (cells[0].includes("判别式")) continue
    assert.equal(cells.length, 5, `§13 行不是五列：${t.slice(0, 60)}`)
    rows.push({
      disc: cells[0].replace(/`/g, "").trim(),
      wv: cells[1],
      host: cells[2],
      disp: cells[3].replace(/`/g, "").trim(),
      note: cells[4],
    })
  }
  return rows
}

// ── 对账 ────────────────────────────────────────────────────

/** 处置判定（§13 方向口径）：发射在位 + 消费在位 = 活；发射在而消费缺 = 补；发射恒无 = 删。 */
const expectedDisp = (wv, host, disc) => (wv.has(disc) ? (host.has(disc) ? "活" : "补") : "删")

/** 双向对账：未登记（源码在位而表无行）· 悬空行（表有行而源码零位）· 处置列形态。 */
function analyze({ wv, host }, rows) {
  const src = new Set([...wv.keys(), ...host.keys()])
  const table = new Set(rows.map((r) => r.disc))
  const cells = (r) => [r.disc, r.wv, r.host, r.disp, r.note]
  return {
    src,
    table,
    unregistered: [...src].filter((d) => !table.has(d)).sort(),
    orphan: [...table].filter((d) => !src.has(d)).sort(),
    dup: rows.map((r) => r.disc).filter((d, i, a) => a.indexOf(d) !== i),
    badDisp: rows.filter((r) => !DISPOSITIONS.includes(r.disp)).map((r) => `${r.disc}（④=${r.disp || "空"}）`),
    emptyCell: rows.filter((r) => !cells(r).every((c) => c.length > 0)).map((r) => r.disc),
    wrongDisp: rows
      .filter((r) => src.has(r.disc) && r.disp !== expectedDisp(wv, host, r.disc))
      .map((r) => `${r.disc}（表记 ${r.disp} · 在位形态实得 ${expectedDisp(wv, host, r.disc)}）`),
  }
}

const realTree = () => {
  const { byDisc: wv, forms } = webviewSites(VSC)
  return { ...analyze({ wv, host: hostCases(VSC) }, protocolRows(readFileSync(PROTOCOL, "utf8"))), forms, wv }
}

// ── 表行读数（`--emit`） ────────────────────────────────────

function emit(cap = 3) {
  const { byDisc: wv, forms } = webviewSites(VSC)
  const host = hostCases(VSC)
  const discs = [...new Set([...wv.keys(), ...host.keys()])]
  const width = Math.max(...discs.map((d) => d.length))
  console.log(`# 提取集 ${discs.length} = webview ${wv.size} / host ${host.size} · 形态分布 ${[...forms.keys()].sort().join("/")}`)
  const fmt = (sites) => {
    if (!sites || sites.size === 0) return "无"
    const list = [...sites].sort()
    return list.slice(0, cap).map((s) => {
      const [f, l] = s.split(":")
      return l == null ? f : `${f}:${l}`
    }).join("/") + (list.length > cap ? `（共 ${list.length} 处）` : "")
  }
  for (const d of [...discs].sort()) {
    console.log(`| ${`\`${d}\``.padEnd(width + 2)} | ${fmt(wv.get(d))} | ${fmt(host.get(d))} | \`${expectedDisp(wv, host, d)}\` |`)
  }
}

if (process.argv.includes("--emit")) {
  emit(process.argv.includes("--full") ? Infinity : 3)
  process.exit(0)
}

// ── 用例（W12-1–W12-3） ─────────────────────────────────────

test("W12-1 §13 表 ↔ 源码提取集双向对账（零未处置 · 零悬空行）", () => {
  const r = realTree()
  assert.deepEqual(r.unregistered, [], `表缺登记：源码在位而 §13 无行 ⇒ ${r.unregistered.join(" · ")}`)
  assert.deepEqual(r.orphan, [], `表内悬空行：§13 有行而源码零位 ⇒ ${r.orphan.join(" · ")}`)
  assert.deepEqual(r.dup, [], "§13 首列重复行")
})

test("W12-2 错误路径：夹具树（未登记 type / 死 handler / 表内悬空行 / 处置错配）逐项点名（零污染真树）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "protocol-reverse-"))
  try {
    mkdirSync(join(tmp, "src", "extension"), { recursive: true })
    mkdirSync(join(tmp, "webview"), { recursive: true })
    writeFileSync(
      join(tmp, "webview", "a.js"),
      [
        'vscode.postMessage({ type: "alpha" })',
        'vscode.postMessage(flag ? { type: "gamma" } : { type: "delta" })',
        "const payload = { type: \"epsilon\" }",
        "vscode.postMessage(payload)",
      ].join("\n"),
      "utf8",
    )
    writeFileSync(
      join(tmp, "src", "extension", "panel-messages.mjs"),
      ["switch (msg.type) {", '  case "alpha": break', '  case "ghost": break', "}"].join("\n"),
      "utf8",
    )
    const { byDisc: wv } = webviewSites(tmp)
    const host = hostCases(tmp)
    assert.deepEqual([...wv.keys()].sort(), ["alpha", "delta", "epsilon", "gamma"], "webview 萃取（含三元双分支 + 局部对象绑定）")
    assert.deepEqual([...host.keys()].sort(), ["alpha", "ghost"], "host 分发档顶级 case 标签")
    const base = analyze({ wv, host }, [])
    assert.deepEqual(base.unregistered, ["alpha", "delta", "epsilon", "gamma", "ghost"], "零表 ⇒ 全部点名")
    const partial = analyze({ wv, host }, [
      { disc: "alpha", wv: "无", host: "无", disp: "活", note: "-" },
    ])
    assert.deepEqual(partial.unregistered, ["delta", "epsilon", "gamma", "ghost"], "未登记 type 逐个点名")
    assert.deepEqual(partial.orphan, [], "表内行皆有源码位")
    // 反向：表有行而源码零位 ⇒ 悬空行点名（删 handler 落地而表行未退场 = 本门）
    const stale = analyze({ wv, host }, [{ disc: "retired", wv: "无", host: "无", disp: "删", note: "-" }])
    assert.deepEqual(stale.orphan, ["retired"], "悬空行点名")
    // 处置错配：host 在位而无发射 = 死 handler ⇒ ④ 须记 删（记 活 ⇒ 错配点名）
    const wrong = analyze({ wv, host }, [
      { disc: "ghost", wv: "无", host: "src/x.mjs:1", disp: "活", note: "-" },
    ])
    assert.deepEqual(wrong.wrongDisp, ["ghost（表记 活 · 在位形态实得 删）"], "处置错配点名（死 handler 记活 ⇒ 红）")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("W12-3 边界：处置闭区间 + 五列无空 + 四形态提取齐（未知形态点名失败）", () => {
  const r = realTree()
  assert.ok(r.table.size > 0, "§13 表零行")
  assert.deepEqual(r.emptyCell, [], `五列有空单元 ⇒ ${r.emptyCell.join(" · ")}`)
  assert.deepEqual(r.badDisp, [], `④ 处置列越界（须 ∈ 活/删/补）⇒ ${r.badDisp.join(" · ")}`)
  // 处置判定与在位形态同源（三值：活 = 双向 · 删 = 死 handler · 补 = 发射在而消费缺）
  assert.deepEqual(r.wrongDisp, [], `④ 与在位形态不一致 ⇒ ${r.wrongDisp.join(" · ")}`)
  // 真树形态普查：登记四形态全部在用（形态面缺一 ⇒ 登记表该收窄；未知形态 ⇒ 提取期即点名失败）
  const forms = [...r.forms.keys()].sort()
  assert.deepEqual(forms, ["arrow", "bind", "obj", "ternary"], `真树载荷形态集须 = 登记四形态 ⇒ 实得 ${forms.join("/")}`)
  // 未知形态 ⇒ 点名失败（不静默漏计数）
  const tmp = mkdtempSync(join(tmpdir(), "protocol-reverse-form-"))
  try {
    mkdirSync(join(tmp, "webview"), { recursive: true })
    mkdirSync(join(tmp, "src", "extension"), { recursive: true })
    writeFileSync(join(tmp, "webview", "a.js"), "vscode.postMessage(build())", "utf8")
    assert.throws(() => webviewSites(tmp), /形态未登记|禁止静默漏计数/, "未登记形态必须点名失败")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})
