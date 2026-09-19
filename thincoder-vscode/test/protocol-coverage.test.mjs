/**
 * protocol-coverage.test.mjs — host → webview 协议面收发对表机检（VSC-DEBT 批 7 · D-2）。
 *
 * 判据权威 = `docs/vsc/design/VSC-DEBT.md` §2.3（选案 2）/ §3.2（提取规则 · 处置判定：
 * 活 = 双向在位 · 删 = 消费位在位而发射恒无 · 补 = 发射在位而消费缺失）/ §6 A4·A5 / §7 T-5–T-7。
 * 表落 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12（人读面；本档只解析结构化单元——非句子子串）。
 *
 * 枚举口径（唯一 · KD-3）：只取**顶级判别式**——host 侧 = `postMessage` 载荷顶级 `type`；
 * webview 侧 = 顶级 `switch (msg.type)` 的 `case` 标签 ∪ 顶级 `name` 比较字面量
 * （`sub:<role>#<id>` 动态段归一 `sub:*`）。子判别式（`statusText.kind` / `subagent.status` /
 * `compress` 状态族 / `digest` 两型）= 所属消息的载荷变体，不单列。
 * 1-hop 辅助发点（`emitToolPanel` / ledger `post` / `postSubagentEvent` / `statusTextPayload`）
 * 必须解析到载荷构造处；未登记形态一律 fail-closed（不静默漏计数）。
 *
 * 形态先例 = `test/agent-tools-registry.test.mjs`（静态源读 + 字面断言）。
 * 表行读数（逐行坐标 = 执行时实测输出）：`node test/protocol-coverage.test.mjs --emit`
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const VSC = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PROTOCOL = resolve(VSC, "..", "docs", "vsc", "design", "WEBVIEW-PROTOCOL.md")

/** 处置闭区间（§3.2 处置判定）。 */
const DISPOSITIONS = ["活", "删", "补"]

/** 1-hop 接力缝：`postMessage(<标识符>)` ⇒ 同档内该标识符载荷的构造调用处（§3.2）。 */
const RELAYS = [
  // 四档拆分批（2026-09-18 · VSC-DEBT §12.2.3 R-1/R-5）：relay 面迁出至 panel-subagent-relay.mjs
  // （原 `panel-callbacks` 行 = 死登记 ⇒ 删除；兜底 = 主档再现裸标识符位即 fail-closed 点名）。
  { file: "src/extension/panel-subagent-relay.mjs", fn: "postSubagentEvent" },
  { file: "src/extension/ledger-surface.mjs", fn: "post" },
]

/** `postMessage(<构造调用>)` 形态：构造器名 ⇒ 顶级判别式（§3.2 逐处在案）。 */
const BUILDERS = { toolPanelPayload: "toolPanel", statusTextPayload: "statusText" }

const TYPE_LIT = /(?:^|[{,\s])type:\s*"([^"\n]+)"/
const NAME_LIT = /\.name\s*(?:\?\.)?startsWith\(\s*"([^"]+)"\s*\)|\.name\s*===\s*"([^"]+)"/g
const TYPEOF_TEST = /typeof\s+[\w$.[\]?]*$/

/** `typeof x.name === "string"` 类形态非协议判别式（排除）。 */
const isTypeofCompare = (code, idx) => TYPEOF_TEST.test(code.slice(Math.max(0, idx - 60), idx))

// ── 提取器 ───────────────────────────────────────────────────

/** 源档（`src` 为 `.mjs`；`webview` 为浏览器直载 `.js` + `.mjs`——两树同扫）。 */
function esmFiles(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (!e.name.startsWith("_") && e.name !== "node_modules") out.push(...esmFiles(p))
    } else if (e.name.endsWith(".mjs") || e.name.endsWith(".js")) out.push(p)
  }
  return out
}

/** 配平切片：`code[openIdx]` 为 `(` / `{` ⇒ 返回其内部文本（跳过字符串 / 模板 / 注释）。 */
function sliceBalanced(code, openIdx) {
  const close = code[openIdx] === "(" ? ")" : "}"
  let depth = 0
  for (let i = openIdx; i < code.length; i += 1) {
    const c = code[i]
    if (c === '"' || c === "'" || c === "`") {
      i += 1
      while (i < code.length && code[i] !== c) i += code[i] === "\\" ? 2 : 1
      continue
    }
    if (c === "/" && code[i + 1] === "/") {
      i = code.indexOf("\n", i)
      if (i < 0) break
      continue
    }
    if (c === "/" && code[i + 1] === "*") {
      i = code.indexOf("*/", i) + 1
      continue
    }
    if (c === "(" || c === "{") depth += 1
    else if (c === ")" || c === "}") {
      depth -= 1
      if (depth === 0) return code.slice(openIdx + 1, i)
    }
  }
  throw new Error(`sliceBalanced: 未配平 @${openIdx}`)
}

const lineAt = (code, idx) => code.slice(0, idx).split("\n").length
const relOf = (root, abs) => relative(root, abs).split("\\").join("/")
const normalizeSub = (name) => (name.startsWith("sub:") ? "sub:*" : name)

function push(byDisc, disc, where) {
  if (!byDisc.has(disc)) byDisc.set(disc, new Set())
  byDisc.get(disc).add(where)
}

/** 同语句内局部绑定初始化式（`const x = <init>`——`postMessage(x)` 的实参来源，§3.2 1-hop）。 */
function localInit(code, idx, ident) {
  const line = code.slice(code.lastIndexOf("\n", idx) + 1, idx)
  const hit = new RegExp(`(?:const|let|var)\\s+${ident}\\s*=\\s*([^;]*)(?:;|$)`).exec(line)
  return hit ? hit[1].trim() : null
}

/** 接力缝载荷构造处的 `type` 字面量集（同档内解析）。 */
function relayLiterals(code, fn) {
  const out = new Set()
  for (const m of code.matchAll(new RegExp(`\\b${fn}\\(`, "g"))) {
    const lit = TYPE_LIT.exec(sliceBalanced(code, m.index + m[0].length - 1))
    if (lit) out.add(lit[1])
  }
  return [...out]
}

/** 字符串 / 模板字面量内容 + 偏移（跳过注释——`sub:` 动态频道前缀取证用）。 */
function stringLiterals(code) {
  const out = []
  for (let i = 0; i < code.length; i += 1) {
    const c = code[i]
    if (c === "/" && code[i + 1] === "/") {
      i = code.indexOf("\n", i)
      if (i < 0) break
      continue
    }
    if (c === "/" && code[i + 1] === "*") {
      i = code.indexOf("*/", i) + 1
      continue
    }
    if (c === '"' || c === "'" || c === "`") {
      const start = i + 1
      let j = start
      while (j < code.length && code[j] !== c) j += code[j] === "\\" ? 2 : 1
      out.push({ value: code.slice(start, j), idx: i })
      i = j
    }
  }
  return out
}

/** host 侧：`postMessage` 载荷顶级 `type`（含 1-hop 辅助发点解析）。 */
function hostSites(root) {
  const byDisc = new Map()
  for (const abs of esmFiles(join(root, "src"))) {
    const code = readFileSync(abs, "utf8")
    const rel = relOf(root, abs)
    for (const m of code.matchAll(/\.postMessage\(/g)) {
      const where = `${rel}:${lineAt(code, m.index)}`
      const arg = sliceBalanced(code, m.index + m[0].length - 1)
      const trimmed = arg.trim()
      if (trimmed.startsWith("{")) {
        const lit = TYPE_LIT.exec(arg)
        assert.ok(lit, `postMessage 载荷无顶级 type 字面量（fail-closed）：${where}`)
        push(byDisc, lit[1], where)
        continue
      }
      const call = /^([A-Za-z_$][\w$]*)\s*\(/.exec(trimmed)
      if (call && BUILDERS[call[1]]) {
        push(byDisc, BUILDERS[call[1]], where)
        continue
      }
      if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) {
        // 局部绑定先行（`const payload = statusTextPayload(info)` ⇒ payload 的判别式）
        const init = localInit(code, m.index, trimmed)
        const ctor = init && /^([A-Za-z_$][\w$]*)\s*\(/.exec(init)
        if (ctor && BUILDERS[ctor[1]]) {
          push(byDisc, BUILDERS[ctor[1]], where)
          continue
        }
        if (init && init.startsWith("{")) {
          const lit = TYPE_LIT.exec(init)
          if (lit) {
            push(byDisc, lit[1], where)
            continue
          }
        }
        const relay = RELAYS.find((r) => r.file === rel)
        assert.ok(relay, `postMessage(${trimmed}) 无 1-hop 接力缝登记：${where}`)
        const lits = relayLiterals(code, relay.fn)
        assert.ok(lits.length > 0, `接力缝 ${relay.fn} 未解析到载荷构造：${where}`)
        for (const l of lits) push(byDisc, l, where)
        continue
      }
      assert.fail(`postMessage 载荷形态未登记（禁止静默漏计数）：${where}`)
    }
    // 载荷顶级 `name` 的动态判别式：`sub:` 频道前缀（`sub:<role>#<id>` → `sub:*`——§3.2）。
    for (const lit of stringLiterals(code)) {
      if (lit.value.startsWith("sub:")) push(byDisc, "sub:*", `${rel}:${lineAt(code, lit.idx)}`)
    }
  }
  return byDisc
}

/** 顶级 `case` 标签（嵌套 switch 的 case 属子判别式 —— 不取）。 */
function topLevelCases(body) {
  const out = []
  let depth = 0
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i]
    if (c === '"' || c === "'" || c === "`") {
      i += 1
      while (i < body.length && body[i] !== c) i += body[i] === "\\" ? 2 : 1
      continue
    }
    if (c === "/" && body[i + 1] === "/") {
      i = body.indexOf("\n", i)
      if (i < 0) break
      continue
    }
    if (c === "{") { depth += 1; continue }
    if (c === "}") { depth -= 1; continue }
    if (depth === 0 && c === "c") {
      const hit = /^case\s+"([^"]+)"/.exec(body.slice(i, i + 120))
      if (hit) { out.push({ name: hit[1], idx: i }); i += 4 }
    }
  }
  return out
}

/** webview 侧：顶级 `switch (msg.type)` 的 `case` ∪ `name` 比较字面量。 */
function webviewSites(root) {
  const byDisc = new Map()
  for (const abs of esmFiles(join(root, "webview"))) {
    const code = readFileSync(abs, "utf8")
    const rel = relOf(root, abs)
    for (const m of code.matchAll(/switch\s*\(\s*[\w$]+(?:\.[\w$]+)*\.type\s*\)\s*\{/g)) {
      const body = sliceBalanced(code, m.index + m[0].length - 1)
      const base = m.index + m[0].length
      for (const c of topLevelCases(body)) {
        push(byDisc, normalizeSub(c.name), `${rel}:${lineAt(code, base + c.idx)}`)
      }
    }
    for (const m of code.matchAll(NAME_LIT)) {
      if (m[2] && isTypeofCompare(code, m.index)) continue
      push(byDisc, normalizeSub(m[1] ?? m[2]), `${rel}:${lineAt(code, m.index)}`)
    }
  }
  return byDisc
}

// ── 文档面（§12 表） ────────────────────────────────────────

/** 解析 `WEBVIEW-PROTOCOL.md` §12 表：首列判别式 + 五列单元（不读散文句）。 */
function protocolRows(md) {
  const anchor = md.indexOf("\n## 12.")
  assert.ok(anchor > 0, "§12 节在位（表落点——`docs/vsc/design/WEBVIEW-PROTOCOL.md`）")
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
    assert.equal(cells.length, 5, `§12 行不是五列：${t.slice(0, 60)}`)
    rows.push({
      disc: cells[0].replace(/`/g, "").trim(),
      host: cells[1],
      wv: cells[2],
      disp: cells[3].replace(/`/g, "").trim(),
      note: cells[4],
    })
  }
  return rows
}

// ── 对账 ────────────────────────────────────────────────────

const expectedDisp = (host, wv, disc) => (host.has(disc) ? (wv.has(disc) ? "活" : "补") : "删")

/** 双向对账：未登记（源码在位而表无行）· 悬空行（表有行而源码零位）· 处置列形态。 */
function analyze({ host, wv }, rows) {
  const src = new Set([...host.keys(), ...wv.keys()])
  const table = new Set(rows.map((r) => r.disc))
  const cells = (r) => [r.disc, r.host, r.wv, r.disp, r.note];
  return {
    src,
    table,
    unregistered: [...src].filter((d) => !table.has(d)).sort(),
    orphan: [...table].filter((d) => !src.has(d)).sort(),
    dup: rows.map((r) => r.disc).filter((d, i, a) => a.indexOf(d) !== i),
    badDisp: rows.filter((r) => !DISPOSITIONS.includes(r.disp)).map((r) => `${r.disc}（④=${r.disp || "空"}）`),
    emptyCell: rows.filter((r) => !cells(r).every((c) => c.length > 0)).map((r) => r.disc),
    wrongDisp: rows
      .filter((r) => src.has(r.disc) && r.disp !== expectedDisp(host, wv, r.disc))
      .map((r) => `${r.disc}（表记 ${r.disp} · 在位形态实得 ${expectedDisp(host, wv, r.disc)}）`),
  }
}

const realTree = () => analyze({ host: hostSites(VSC), wv: webviewSites(VSC) }, protocolRows(readFileSync(PROTOCOL, "utf8")))

// ── 表行读数（`--emit`） ────────────────────────────────────

function fmtSites(sites, cap = 3) {
  if (!sites || sites.size === 0) return "无"
  const list = [...sites].sort()
  const [file0] = list[0].split(":")
  const shown = list.slice(0, cap).map((s, i) => {
    const [f, l] = s.split(":")
    return i > 0 && f === file0 ? `:${l}` : `${f}:${l}`
  })
  return shown.join("/") + (list.length > cap ? `（共 ${list.length} 处）` : "")
}

function emit(width = 0, cap = 3) {
  const { host, wv } = { host: hostSites(VSC), wv: webviewSites(VSC) }
  const discs = [...new Set([...host.keys(), ...wv.keys()])]
  const rows = new Set(discs.map((d) => expectedDisp(host, wv, d)))
  width = Math.max(...discs.map((d) => d.length))
  console.log(`# 提取集 ${discs.length} = host ${host.size} / webview ${wv.size} · 处置分布 ${[...rows].sort().join("/")}`)
  for (const d of [...discs].sort()) {
    console.log(`| ${`\`${d}\``.padEnd(width + 2)} | ${fmtSites(host.get(d) ?? new Set(), cap)} | ${fmtSites(wv.get(d) ?? new Set(), cap)} | \`${expectedDisp(host, wv, d)}\` |`)
  }
}

if (process.argv.includes("--emit")) {
  emit(0, process.argv.includes("--full") ? Infinity : 3)
  process.exit(0)
}

// ── 用例（T-5–T-7 · A4/A5） ─────────────────────────────────

test("T-5 §12 表 ↔ 源码提取集双向对账（复跑零未处置）", () => {
  const r = realTree()
  assert.deepEqual(r.unregistered, [], `表缺登记：源码在位而 §12 无行 ⇒ ${r.unregistered.join(" · ")}`)
  assert.deepEqual(r.orphan, [], `表内悬空行：§12 有行而源码零位 ⇒ ${r.orphan.join(" · ")}`)
  assert.deepEqual(r.dup, [], "§12 首列重复行")
})

test("A4 §12 表逐行在位（五列无空 · 处置闭区间）", () => {
  const r = realTree()
  assert.ok(r.table.size > 0, "§12 表零行")
  assert.deepEqual(r.emptyCell, [], `五列有空单元 ⇒ ${r.emptyCell.join(" · ")}`)
  assert.deepEqual(r.badDisp, [], `④ 处置列越界（须 ∈ 活/删/补）⇒ ${r.badDisp.join(" · ")}`)
})

test("T-6 处置判定与在位形态同源（活 = 双向 · 删 = 发射恒无 · 补 = 消费缺失）", () => {
  const r = realTree()
  assert.deepEqual(r.wrongDisp, [], `④ 与在位形态不一致 ⇒ ${r.wrongDisp.join(" · ")}`)
  const wvSites = webviewSites(VSC) // 提到谓词外（原在 filter 内 ⇒ 每判别式重扫 webview 树——D-T6 慢阈红因）
  const hostOnly = [...r.src].filter((d) => !wvSites.has(d))
  const rows = protocolRows(readFileSync(PROTOCOL, "utf8"))
  for (const d of hostOnly) {
    assert.equal(rows.find((x) => x.disc === d)?.disp, "补", `host-only 应登记 补：${d}`)
  }
})

test("T-7 错误路径：源码新增 type 未登记 ⇒ 点名该 type（夹具树——零污染真树）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "protocol-coverage-"))
  try {
    mkdirSync(join(tmp, "src", "extension"), { recursive: true })
    mkdirSync(join(tmp, "webview"), { recursive: true })
    writeFileSync(
      join(tmp, "src", "extension", "a.mjs"),
      ['panel.webview.postMessage({ type: "alpha" })', 'panel.webview.postMessage({ type: "beta" })'].join("\n"),
      "utf8",
    )
    writeFileSync(join(tmp, "webview", "chat.js"), 'switch (m.type) {\n  case "alpha": break\n  case "ghost": break\n}', "utf8")
    const host = hostSites(tmp)
    const wv = webviewSites(tmp)
    const base = analyze({ host, wv }, [])
    assert.deepEqual(base.unregistered, ["alpha", "beta", "ghost"], "零表 ⇒ 全部点名")
    const partial = analyze({ host, wv }, [
      { disc: "alpha", host: "无", wv: "无", disp: "活", note: "-" },
    ])
    assert.deepEqual(partial.unregistered, ["beta", "ghost"], "未登记 type 逐个点名")
    assert.deepEqual(partial.orphan, [], "表内行皆有源码位")
    // 反向：表有行而源码零位 ⇒ 悬空行点名
    const stale = analyze({ host, wv }, [{ disc: "retired", host: "无", wv: "无", disp: "删", note: "-" }])
    assert.deepEqual(stale.orphan, ["retired"], "悬空行点名")
    // 裁决列：host-only ⇒ 补 · webview-only ⇒ 删 · 双向 ⇒ 活
    const rows = ["alpha", "beta", "ghost"].map((d) => ({ disc: d, host: "无", wv: "无", disp: expectedDisp(host, wv, d), note: "-" }))
    assert.deepEqual(analyze({ host, wv }, rows).wrongDisp, [], "处置判定与在位形态同源")
    assert.deepEqual(
      rows.map((r) => `${r.disc}:${r.disp}`),
      ["alpha:活", "beta:补", "ghost:删"],
      "T-6 三分支（双向 / host-only⇒补 / webview-only⇒删）",
    )
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})
