/**
 * prompt-refs-check.mjs — 提示词面 / 模型可见面文档引用清零（常驻机判锁 · 闸态阈值 0）。
 *
 * 判据契约 = `docs/core/design/PROMPT-SYSTEM.md` §6.6（J1/J2/J3 三式 · 白名单 · 域与排除）；
 * 来源 = 用户 2026-09-20 19:31 裁定「提示词中根本不应该出现对文档的引用」——删引用（非改址）·
 * 句义保留；引用必要 ⇒ 进档面 / 注释面，不进模型面。
 * 沿革：原落点 = `thincoder-cli/test/prompt-refs-zero.test.mjs`（T1–T9 常驻锁）——随 2026-09-28
 * 测试树全清退役；2026-09-29 用户裁「重建形态 = 脚本族」⇒ 本档（判据语义原样，零改）。
 *
 * 域：PROMPT_DIRS = `thincoder-core/prompts/**` + `thincoder-core/tool-docs/**`（.md 全文）
 *     CODE_DIRS   = `thincoder-core/**` + `thincoder-cli/src/**` + `thincoder-vscode/src/**`（.mjs/.js/.cjs）
 * 排除：公共排除 = test/_archive/node_modules/.git/.thincoder/dist/build/coverage；CODE_DIRS 另排 docs/scripts；
 *     PROMPT_DIRS 全在 thincoder-core/ 内——公共排除不适用（分面各判）。
 * 行级算法：全行注释（* / // / /*）跳过 → 引号感知截断行尾 `//` 注释 → 正则扫描；
 *     J3 仅提示词面；行内 CANON 操作数整串删除（先删除再扫——token 形删除会误放行孤立引证）。
 * 运行（仓根零参）：`node scripts/prompt-refs-check.mjs` —— 命中 ⇒ FAIL（exit 1）；清零 ⇒ OK（exit 0）。
 */
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, extname } from "node:path"
import { fileURLToPath } from "node:url"
import { CANON_OPERANDS, stripCanonOperands } from "../thincoder-core/doc-check/anchors.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

const PROMPT_DIRS = ["thincoder-core/prompts", "thincoder-core/tool-docs"]
const CODE_DIRS = ["thincoder-core", "thincoder-cli/src", "thincoder-vscode/src"]
const BASE_EXCL = new Set(["test", "_archive", "node_modules", ".git", ".thincoder", "dist", "build", "coverage"])
const CODE_EXCL = new Set([...BASE_EXCL, "docs", "scripts"])
const CODE_EXTS = [".mjs", ".js", ".cjs"]

// ── 判据三式（PROMPT-SYSTEM.md §6.6 逐字契约面 · 2026-09-29 重建——勿改语义）──────
const J1_RE = /[A-Z][A-Z0-9-]{2,}\.md/g
// J1 白名单 = 判保留面操作数族（与 J3 豁免**同一张表** = `CANON_OPERANDS` 七名；小写两名（`.thincoder/advisor.md` ∥
// `project_rules.md`）永不命中 J1_RE；大写名（含第七名 `RTM.md`）在名单内是功能必需——提示词面现含 `RTM.md`，缺它 J1 必报——
// 本档不再持第二份手写名单）。
const J1_WHITELIST = new Set(CANON_OPERANDS)
const J2_RE = /§\s*(?:\d{2,}(?![\d\\.])|\d+\.\d)/g
const J3_RE = /[a-z][a-z0-9-]*\.md/g
// J3 豁免 = CANON 操作数族（与 J1 白名单同构）：逐行先整串删除再扫。
// 表与剥除函数的**定义单源** = `thincoder-core/doc-check/anchors.mjs`（`CANON_OPERANDS` / `stripCanonOperands`）——
// 本档只 import、不复制（同一张表两处消费：本档 J3 豁免 ∥ 锚判的提示词面裁剪）。反方向不成立：
// 引擎对 `scripts/**` 的 import 点 = 0（`docs/core/design/DOC-DISCIPLINE.md` A-DD29 ⑤），且本档是零参主程序，
// 被 import 即整轮扫描执行。导出面保留（`stripCanonOperands` 在本档导出史与 API 契约在册）：仓内现无消费点——
// 需要它的一律从定义单源取。
export { stripCanonOperands }

/** 域内列档（相对仓根 · 正斜杠 · 排除目录按段匹配；缺目录 ⇒ 空集——域防呆在下游） */
function listFiles(dirs, exts, excl) {
  const out = []
  for (const d of dirs) {
    let entries = []
    try {
      entries = readdirSync(join(ROOT, d), { withFileTypes: true, recursive: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (!e.isFile()) continue
      const rel = relative(ROOT, join(e.parentPath ?? e.path, e.name)).replaceAll("\\", "/")
      if (rel.split("/").some((s) => excl.has(s))) continue
      if (!exts.includes(extname(e.name))) continue
      out.push(rel)
    }
  }
  return out.sort()
}

/** 代码档行级剥离：全行注释 → 空串；行尾 `//` 注释 → 引号感知截断（字符串字面量内的 `//` 不截断） */
export function stripCodeLine(line) {
  const t = line.trim()
  if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return ""
  let out = "", q = null
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === "\\") { out += c + (line[i + 1] ?? ""); i++; continue }
      if (c === q) q = null
      out += c
      continue
    }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; continue }
    if (c === "/" && line[i + 1] === "/") break
    out += c
  }
  return out
}

/** 单行命中 token（face = "prompt" 全文扫 | "code" 先剥注释）；J3 仅 prompt 面 */
export function lineHits(line, face) {
  let text = face === "code" ? stripCodeLine(line) : line
  if (face !== "code") text = stripCanonOperands(text)
  const out = []
  for (const [re, wl] of [[J1_RE, J1_WHITELIST], [J2_RE, null]]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) if (!wl || !wl.has(m[0])) out.push(m[0])
  }
  if (face !== "code") {
    J3_RE.lastIndex = 0
    let m
    while ((m = J3_RE.exec(text)) !== null) out.push(m[0])
  }
  return out
}

function scanFile(file, face) {
  const hits = []
  readFileSync(join(ROOT, file), "utf8").split("\n").forEach((l, i) => {
    for (const tok of lineHits(l, face)) hits.push(`${file}:${i + 1} ${tok}`)
  })
  return hits
}

// ── 零参主运行 ──────────────────────────────────────────────────────────────

const promptFiles = listFiles(PROMPT_DIRS, [".md"], BASE_EXCL)
const codeFiles = listFiles(CODE_DIRS, CODE_EXTS, CODE_EXCL)
const missing = []
for (const d of PROMPT_DIRS) if (!promptFiles.some((f) => f.startsWith(d))) missing.push(`提示词面 ${d}`)
for (const d of CODE_DIRS) if (!codeFiles.some((f) => f.startsWith(d))) missing.push(`代码面 ${d}`)
const hits = [
  ...promptFiles.flatMap((f) => scanFile(f, "prompt")),
  ...codeFiles.flatMap((f) => scanFile(f, "code")),
]

console.log(`汇总：提示词面 ${promptFiles.length} 档 · 代码面 ${codeFiles.length} 档 · 命中 ${hits.length}`)
for (const h of hits) console.log(`✗ ${h}`)
if (missing.length) {
  for (const m of missing) console.log(`FAIL(域防呆): 缺档 ${m}——空扫假绿守卫`)
  process.exit(1)
}
if (hits.length) {
  console.log(`FAIL(prompt-refs): ${hits.length} 条文档引用命中（闸态——阈值 0）`)
  process.exit(1)
}
console.log("OK(prompt-refs): J1/J2/J3 三式零命中")
