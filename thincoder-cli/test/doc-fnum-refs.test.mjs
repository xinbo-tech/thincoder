/**
 * doc-fnum-refs.test.mjs — V6 编号引用可解析（批 9 CRITERIA-FACE · 条目 2）。
 *
 * 判据来源 = `docs/core/design/DOC-DISCIPLINE.md` §2 V6 块（本档即判据落点——函数 + 常驻测试同档自持）。
 * 纪律句（编号自持）：档内编号家族（F / N / D / AC / T 类）**节内定义、节内引用**；
 * 跨节 / 跨档引用他处编号 ⇒ 去编号化（改「指针（文档:节）+ 语义名」形态）。
 *
 * 判据：抽取「§<节号> + 家族编号」与「§<节号> + 家族编号区间（Fm–Fn）」；
 * 定义面 = 被引节内的编号定义位（粗体行首 / 列表项首 / 表格行首）；区间**逐号展开**判；
 * 集合差非空 ⇒ 报（档:行 + token）。
 *
 * 首落**报告态**（承 F4 先例）：判据只产出报告行、不阻断构建；清账完成后再收紧（阈值 0）。
 * 本批判定面 = 实档 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.4（集合差为空——v1 实档 MECHANISM 已归档退役，2026-09-17）
 * 由 T-V6-1 钉数断言固化）；全档 / 全仓扫描 = 后续批（读数登记、不阻断本批）。
 * 全档读数登记（as-of 本批实施轮·实测）= 3 条，均「无档名」跨档引用：需求档 :421 §2 ACC-1 · :478 §3 N9 · :484 §2 ACC-7。
 * 已知边界（扩面前处置）：① 排除面（围栏 / 行内码 span / 判据串）未定义——批档 §3 轮 1 #5；
 * ② 无编号标题不重置节上下文（defsOf——假阴方向）。
 *
 * 用例面 = 设计档 §5 DD-24（正常）/ DD-25（错误）+ 区间边界例；夹具全内存（零落盘）；
 * 实档面只读（readFileSync——无写）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const REAL_DOC = join(HERE, "..", "..", "docs", "core", "requirements", "ENGINEERING-MODE-V2.md")
const REAL_DOC_NAME = "docs/core/requirements/ENGINEERING-MODE-V2.md"

// ── 判据实现（V6）────────────────────────────────────────────
const TOK = "(?:AC|F|N|D|T)(?:-?[A-Za-z0-9]+)*"
const REF_RE = new RegExp(`§\\s*(\\d+(?:\\.\\d+)*)\\s+(${TOK})(?:\\s*[–—]\\s*(${TOK}))?`, "g")
const DEF_BOLD_RE = new RegExp(`^\\s*(?:[-*]\\s*)?\\*\\*(${TOK})`)
const DEF_TABLE_RE = new RegExp(`^\\s*\\|\\s*\\**(${TOK})(?=\\s*\\**\\s*\\|)`)
const SECTION_RE = /^#{2,4}\s*§?\s*(\d+(?:\.\d+)*)/
const digitsOf = (t) => (t.match(/(\d+)$/) ?? [])[1]

/** 区间逐号展开（同前缀 + 数值界内展开；退化形态 = 两端点原样） */
function expand(t1, t2) {
  if (!t2) return [t1]
  const p1 = t1.replace(/\d+$/, "")
  const p2 = t2.replace(/\d+$/, "")
  const n1 = Number(digitsOf(t1))
  const n2 = Number(digitsOf(t2))
  if (p1 !== p2 || !Number.isFinite(n1) || !Number.isFinite(n2) || n2 < n1 || n2 - n1 > 500) return [t1, t2]
  return Array.from({ length: n2 - n1 + 1 }, (_, i) => `${p1}${n1 + i}`)
}

/** 抽引用：{ line, sec, tokens[] }（无家族编号的 §N 提及不抽取——零假阳） */
export function refsOf(text) {
  const out = []
  text.split("\n").forEach((l, i) => {
    REF_RE.lastIndex = 0
    let m
    while ((m = REF_RE.exec(l)) !== null) {
      const [, sec, t1, t2] = m
      if (!digitsOf(t1) || (t2 && !digitsOf(t2))) continue
      out.push({ line: i + 1, sec, tokens: expand(t1, t2) })
    }
  })
  return out
}

/** 定义面：节号 → 定义编号集（编号定义位 = 粗体行首 / 列表项首 / 表格行首） */
export function defsOf(text) {
  const map = new Map()
  let sec = null
  for (const l of text.split("\n")) {
    const h = l.match(SECTION_RE)
    if (h) { sec = h[1]; continue }
    if (sec === null) continue
    for (const re of [DEF_BOLD_RE, DEF_TABLE_RE]) {
      const m = l.match(re)
      if (m && digitsOf(m[1])) (map.get(sec) ?? map.set(sec, new Set()).get(sec)).add(m[1])
    }
  }
  return map
}

/** V6 报告（报告态——只产报告行，不阻断）：集合差非空 ⇒ 逐条报（档:行 + token） */
export function v6Report({ text, doc = "(夹具)", defs }) {
  const d = defs ?? defsOf(text)
  const lines = []
  for (const r of refsOf(text)) {
    const have = d.get(r.sec) ?? new Set()
    for (const t of r.tokens) {
      if (!have.has(t)) lines.push(`报告(V6): ${doc}:${r.line} §${r.sec} ${t}（编号引用·被引节无定义）`)
    }
  }
  return lines
}

// ── DD-24 正常：实档 §13.4 面 + 夹具（定义齐全的编号区间）⇒ 集合差空 ⇒ 零报 ──
test("T-V6-1（DD-24）正常：实档 §13.4 面集合差空 + 夹具定义齐全区间（§13.4 F1–F14）零报", () => {
  const real = readFileSync(REAL_DOC, "utf8")
  const defs = defsOf(real)
  assert.deepStrictEqual(
    [...(defs.get("13.4") ?? [])].sort((a, b) => Number(digitsOf(a)) - Number(digitsOf(b))),
    Array.from({ length: 14 }, (_, i) => `F${i + 1}`),
    "实档 §13.4 定义位 = F1–F14（列表项首 `- **Fm …**` 形态——定义面非空）",
  )
  // 空射成立性钉数：§13.4 面候选引用 = 0（全档 refsOf 实测）——「集合差为空」为平凡真，登记防空转
  assert.deepStrictEqual(
    refsOf(real).filter((r) => r.sec === "13.4"),
    [],
    "实档 §13.4 面候选引用 = 0（空射面——读数登记见档头）",
  )
  assert.deepStrictEqual(
    v6Report({ text: real, doc: REAL_DOC_NAME, defs }).filter((l) => l.includes(" §13.4 ")),
    [],
    "实档 §13.4 面集合差为空（零报——本批判定面）",
  )
  const fx = [
    "# 夹具：定义齐全的编号区间",
    "",
    "### 13.4 夹具节",
    "",
    ...Array.from({ length: 14 }, (_, i) => `- **F${i + 1} 条目${i + 1}**：夹具定义位。`),
    "",
    "引用区间：§13.4 F1–F14。",
  ].join("\n")
  const refs = refsOf(fx).filter((r) => r.sec === "13.4")
  assert.equal(refs.length, 1, "夹具引用抽取 1 处")
  assert.deepStrictEqual(refs[0].tokens, Array.from({ length: 14 }, (_, i) => `F${i + 1}`), "区间逐号展开 = F1…F14（14 号）")
  assert.deepStrictEqual(v6Report({ text: fx }), [], "区间全定义 ⇒ 集合差空 ⇒ 零报")
})

// ── DD-25 错误：夹具引用 §13.4 F99（无定义）/ 区间 §13.4 F15–F17（被引节无定义）⇒ 报 ──
test("T-V6-2（DD-25）错误：悬空单号 + 越界区间 ⇒ 报（档:行 + token；区间逐号展开）", () => {
  const fx = [
    "# 夹具：悬空编号（实档 §13.4 定义域 F1–F14 同形）",
    "",
    "### 13.4 夹具节",
    "",
    ...Array.from({ length: 14 }, (_, i) => `- **F${i + 1} 条目${i + 1}**：夹具定义位。`),
    "",
    "引用悬空单号：§13.4 F99（无定义）。",
    "引用越界区间：§13.4 F15–F17（被引节无定义）。",
  ].join("\n")
  assert.deepStrictEqual(v6Report({ text: fx, doc: "夹具档.md" }), [
    "报告(V6): 夹具档.md:20 §13.4 F99（编号引用·被引节无定义）",
    "报告(V6): 夹具档.md:21 §13.4 F15（编号引用·被引节无定义）",
    "报告(V6): 夹具档.md:21 §13.4 F16（编号引用·被引节无定义）",
    "报告(V6): 夹具档.md:21 §13.4 F17（编号引用·被引节无定义）",
  ], "逐条报（档:行 + token）；区间逐号展开判（F15/F16/F17 = 三条）")
})

// ── 区间边界 + 零假阳界：端点界内零报 / 跨界仅界外报 / 无家族编号与字母词不抽取 ──
test("T-V6-3 边界：区间端点界内 / 跨界 / 无编号提及与近似词零假阳", () => {
  const defs = new Map([["13.4", new Set(["F1", "F14"])]])
  const fx = [
    "界内区间：§13.4 F1–F1。",
    "跨界区间：§13.4 F14–F16。",
    "无编号提及：§13.4 各仓自持。",
    "近似词（D 开头单词）：§13.4 Drop 描述。",
  ].join("\n")
  const lines = v6Report({ text: fx, doc: "夹具档.md", defs })
  assert.deepStrictEqual(lines, [
    "报告(V6): 夹具档.md:2 §13.4 F15（编号引用·被引节无定义）",
    "报告(V6): 夹具档.md:2 §13.4 F16（编号引用·被引节无定义）",
  ], "界内单号区间零报；跨界区间仅界外两号报（F14 有定义不报）")
  assert.deepStrictEqual(refsOf(fx).length, 2, "无家族编号提及 / D 开头单词均不抽取（零假阳）")
})
