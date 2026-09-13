#!/usr/bin/env node
/**
 * reconcile-lookup.mjs — 层 3 · 反查（文档↔实装对账批 · 本仓自持独立实现 · 语义同源）。
 *
 * 判据权威 = `docs/design/DOC-CODE-RECONCILE.md` §5（本档不重述判据——单一权威源）。
 * 判据句：本批改动触及的 token 若被某设计 / 需求档锚定，**该档必须出现在输出清单里**——
 * 供批次「受影响文件表」收录（补批次档 §1 病根表第 1 行：描述被改面的设计档不在表里）。
 * 抽取器 **单源**：变更 token 的强形态与排除式 = V5 `extractTokens`（同一函数，不发明第二套抽取式）。
 * 边界（硬）：**只读、不写、不阻断**（产出是人与父侧判断的输入——不是闸；退出码恒 0）；
 * **不自动改档**；**不跨仓反查**（对端面 = 另仓的轮）；不写台账。
 * 输入：`--range <git 范围>`（默认 `HEAD~1..HEAD`）· `--repo <路径>`（默认 = 仓根）。
 * 输出：逐档逐 token 一行 `docs/design/<X>.md — 命中 <token>（:<行>）× n` + 尾行计数；`--json` 同形机读。
 * 用法：`node scripts/reconcile-lookup.mjs [--range <range>] [--repo <路径>] [--json]`。
 */
import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { basename, join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { collectDocStems, extractTokens } from "./check-doc-anchors.mjs"

/** 默认 git 范围（设计 §5 #1）。 */
export const DEFAULT_RANGE = "HEAD~1..HEAD"
/** 反查域：本仓设计档 + 需求档（设计 §5 #3——排除归档）。 */
export const LOOKUP_DIRS = ["docs/design", "docs/requirements"]
const SKIP_DIRS = new Set(["node_modules", ".git", "_archive"])

/**
 * 变更行抽取：`git diff --unified=0 <range>` 的新增 / 删除行 + 变更档路径（只读子进程）。
 * 返回文本行数组（`+` / `-` 前缀已剥；`+++` / `---` 头取其路径）。
 */
export function changedLines(repo, range = DEFAULT_RANGE) {
  const out = execFileSync("git", ["-C", repo, "diff", "--unified=0", "--no-color", range], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
  })
  const lines = []
  for (const l of out.split("\n")) {
    const head = /^(\+\+\+|---)\s+([ab]\/)?(.*)$/.exec(l)
    if (head) { if (head[3] !== "/dev/null") lines.push(head[3]); continue }
    if (l.startsWith("+++") || l.startsWith("---")) continue
    if (l.startsWith("+") || l.startsWith("-")) lines.push(l.slice(1))
  }
  return lines
}

/** 变更 token 抽取（**单源** = V5 抽取器；`codeSpans: false` = diff 行逐词面）。 */
export function changedTokens(lines, repo) {
  const ctx = { docStems: collectDocStems(repo), repoNames: [basename(resolve(repo))] }
  const seen = new Map()
  for (const line of lines) {
    for (const a of extractTokens(line, ctx, { codeSpans: false })) {
      if (a.kind === "A3" && (a.token.startsWith(".") || a.token.includes("<"))) continue // 相对 / 占位伪形态
      if (!seen.has(a.token)) seen.set(a.token, a.kind)
    }
  }
  return [...seen].map(([token, kind]) => ({ token, kind }))
}

/** 词界匹配（防 `scanGroups` 由 `scanGroupsX` 满足——与 V5 同类判据）。 */
function tokenRegex(token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?<![A-Za-z0-9_$])${esc}(?![A-Za-z0-9_$])`)
}

/** 反查域档清单（`docs/design` + `docs/requirements`，排除归档）。 */
export function lookupDocs(root) {
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
  for (const d of LOOKUP_DIRS) walk(join(root, d))
  return out.sort()
}

/** 反查：变更 token 在设计 / 需求档全文命中 ⇒ 该档入清单。 */
export function lookup({ repo = process.cwd(), range = DEFAULT_RANGE } = {}) {
  const root = resolve(repo)
  const tokens = changedTokens(changedLines(root, range), root)
  const files = []
  let lines = 0
  for (const p of lookupDocs(root)) {
    const rel = relative(root, p).replace(/\\/g, "/")
    const ls = readFileSync(p, "utf8").split("\n")
    const hits = []
    for (const { token, kind } of tokens) {
      const re = tokenRegex(token)
      const at = []
      ls.forEach((l, i) => { if (re.test(l)) at.push(i + 1) })
      if (at.length) { hits.push({ token, kind, line: at[0], count: at.length }); lines += at.length }
    }
    if (hits.length) files.push({ file: rel, hits })
  }
  return { range, repo: root, tokens, files, counts: { files: files.length, lines, tokens: tokens.length } }
}

/** CLI 主行程（**退出码恒 0**——不阻断；git 不可用同样不报错）。 */
export function main(args = process.argv.slice(2), { cwd = process.cwd(), log = console.log } = {}) {
  const argOf = (f) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : null }
  const repo = resolve(argOf("--repo") ?? cwd)
  const range = argOf("--range") ?? DEFAULT_RANGE
  let res
  try {
    res = lookup({ repo, range })
  } catch (e) {
    log(`反查跳过（不阻断）：git 不可用 / 仓不可读（range=${range}）——${String(e.message).split("\n")[0]}`)
    return 0
  }
  if (args.includes("--json")) {
    log(JSON.stringify(res))
  } else {
    for (const f of res.files) for (const h of f.hits) log(`${f.file} — 命中 ${h.token}（:${h.line}）× ${h.count}`)
    log(`反查: ${res.counts.files} 档 / ${res.counts.lines} 行 · 变更 token ${res.counts.tokens} 处（只读不阻断）`)
  }
  return 0
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.exit(main())
