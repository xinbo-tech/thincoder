#!/usr/bin/env node
/**
 * doc-anchors-targets.mjs — 文档锚一致性机检 · 采集面（源域 + 在册判据域）。
 *
 * 本档 = `doc-anchors.mjs` 家族的采集面（R24a 拆分——各档 ≤300 行）：
 * ① 源域（被检文档）：本域 docs 树全量 .md − 归档 − 批档 − 台账两档（`collectSourceDomain`）；
 * ② 在册判据域（A1/A2 目标面）：档名主干（`collectDocStems`）· 代码面标识符（`collectCodeTokens` /
 * `collectCodeTokensFor`）· 用例标题（`readLiteral` / `collectCaseTitles` / `caseTokenExists`——
 * A1 目标域 `test/**` 的用例注册调用（顶层 `test(` / `slow(`）首参字面量标题集）。
 * 消费面 = VSC 锚引擎（`doc-anchors-core.mjs`）；判据语义（存在性 / 排除式）见核心档头注与判据权威档。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".turbo", ".thincoder"])
/** 台账两档（L1–L4 专判面——不入本检查源域，避免重复报行）。 */
export const LEDGER_FILES = ["docs/TODO.md", "docs/TODO-archive.md"]

/** 源域（被检文档）：本域 docs 树全量 .md − 归档（历史快照）− 批档（时序日志）− 台账两档（L1–L4 专判）。 */
export function collectSourceDomain(root) {
  const out = []
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (n.endsWith(".md")) out.push(p)
    }
  }
  walk(join(root, "docs"))
  const keep = (p) => {
    const rel = relative(root, p).replace(/\\/g, "/")
    if (rel.split("/").includes("_archive")) return false
    if (rel === "docs/batches" || rel.startsWith("docs/batches/")) return false
    return !LEDGER_FILES.includes(rel)
  }
  return out.filter(keep).sort()
}

/** 档名主干集合（A2 排除式 ②——本域 `docs/` 树任一 `.md` 档名去后缀）。 */
export function collectDocStems(root) {
  const stems = new Set()
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (n.endsWith(".md")) stems.add(n.slice(0, -3))
    }
  }
  walk(join(root, "docs"))
  return stems
}

/** 代码面标识符集（A2 在册判据：词界命中 ⇔ 标识符集含该名）。
 *  采集 = **根树全深走**（SKIP_DIRS 排除）——域形态两制并容：产品树（`src/` 等子目录）与**核树**
 *  （`thincoder-core/` 无 `src/`：根级模块 + 领域子目录）。判据句 = 合并仓代码面（域集并集）实装符号
 *  （两仓合并后「对端」并入仓内）。修复来源 = `2026-09-13-CORE-UNIFICATION.md:6432` 登记项
 *  （「核根文件不入 VSC 引擎代码面 ⇒ 硬悬空」——修复面 = 本函数）。 */
export function collectCodeTokens(root) {
  const set = new Set()
  const add = (p) => {
    let text = ""
    try { text = readFileSync(p, "utf8") } catch { return }
    for (const m of text.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) set.add(m[0])
  }
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (/\.(?:mjs|js|cjs|json)$/.test(n)) add(p)
    }
  }
  walk(root)
  return set
}

/** 合并仓代码面（A2 在册判据域）：各域代码树并集（判据句 = 仓内实装；两仓合并后「对端」并入仓内）。 */
export function collectCodeTokensFor(roots) {
  const set = new Set()
  for (const r of roots) for (const t of collectCodeTokens(r)) set.add(t)
  return set
}

/** 读一个字面量串（`"` / `'` / `` ` `` 起始；未闭合 → null）。 */
function readLiteral(text, i) {
  const q = text[i]
  if (q !== '"' && q !== "'" && q !== "`") return null
  let out = ""
  for (let k = i + 1; k < text.length; k++) {
    const c = text[k]
    if (c === "\\") { out += text[k + 1] ?? ""; k++; continue }
    if (c === q) return out
    if (c === "\n" && q !== "`") return null
    out += c
  }
  return null
}
/** A1 目标域：`test/**` 的用例注册调用（顶层 `test(` / `slow(`）首参字面量 = 用例标题集。 */
export function collectCaseTitles(testRoot) {
  const titles = []
  const walk = (dir) => {
    let names = []
    try { names = readdirSync(dir) } catch { return }
    for (const n of names) {
      if (SKIP_DIRS.has(n)) continue
      const p = join(dir, n)
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (/\.(?:mjs|js|cjs)$/.test(n)) {
        let text = ""
        try { text = readFileSync(p, "utf8") } catch { continue }
        for (const m of text.matchAll(/(?<![A-Za-z0-9_$])(?:test|slow)\s*\(/g)) {
          const lit = readLiteral(text, m.index + m[0].length)
          if (lit) titles.push(lit)
        }
      }
    }
  }
  walk(testRoot)
  return titles
}
/** A1 在册判据：某用例标题含该 token（**右界判**——`T-VS3` 不得由 `T-VS32` 满足）。 */
export function caseTokenExists(titles, token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`(?<![A-Za-z0-9_-])${esc}(?![A-Za-z0-9_-])`)
  return titles.some((t) => re.test(t))
}
