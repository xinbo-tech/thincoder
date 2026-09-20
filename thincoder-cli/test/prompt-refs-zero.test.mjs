/**
 * prompt-refs-zero.test.mjs — 提示词面 / 模型可见面文档引用清零机判锁（PROMPT-REFS-ZERO-BATCH）。
 *
 * 判据契约 = `docs/core/design/PROMPT-SYSTEM.md` §6.6（J1/J2/J3 三式 · 白名单 · 域与排除——本档即其
 * 常驻锁落点）；来源 = 用户 2026-09-20 19:31 裁定「提示词中根本不应该出现对文档的引用」——
 * 删引用（非改址）· 句义保留；引用必要 ⇒ 进档面 / 注释面，不进模型面。
 *
 * 域：PROMPT_FACES = `thincoder-core/prompts/**` + `thincoder-core/tool-docs/**` + `docs/core/design/prompts/**`（.md 全文）
 *     CODE_ROOTS  = `thincoder-core/**` + `thincoder-cli/src/**` + `thincoder-vscode/src/**`（.mjs/.js/.cjs）
 * 排除分面：公共排除 = test/_archive/node_modules/.git/.thincoder/dist/build/coverage；
 *     CODE_ROOTS 另排 docs/scripts（注意 `docs/core/design/prompts/` 恰在 docs/ 下且属 PROMPT_FACES——排除不适用）。
 * 代码档行级算法：全行注释（* / // / /*）跳过 → 引号感知截断行尾 `//` 注释 → 正则扫描。
 * 先例 = prompts-dual-source.test.mjs / doc-fnum-refs.test.mjs（跨包只读扫描 · 夹具全内存零落盘）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, extname } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..", "..")

const PROMPT_DIRS = ["thincoder-core/prompts", "thincoder-core/tool-docs", "docs/core/design/prompts"]
const CODE_DIRS = ["thincoder-core", "thincoder-cli/src", "thincoder-vscode/src"]
const BASE_EXCL = new Set(["test", "_archive", "node_modules", ".git", ".thincoder", "dist", "build", "coverage"])
const CODE_EXCL = new Set([...BASE_EXCL, "docs", "scripts"])
const CODE_EXTS = [".mjs", ".js", ".cjs"]

// ── 判据三式（PROMPT-SYSTEM.md §6.6 逐字契约面）──────────────────────────
const J1_RE = /[A-Z][A-Z0-9-]{2,}\.md/g
const J1_WHITELIST = new Set(["AGENTS.md", "SKILL.md", "README.md", "MANIFEST.md"])
const J2_RE = /§\s*(?:\d{2,}(?![\d\\.])|\d+\.\d)/g
const J3_RE = /[a-z][a-z0-9-]*\.md/g
// J3 豁免 = CANON 操作数族（父侧裁定 2026-09-20 候选 A——判据 2「保留面四类·操作数」的显式化，
// 与 J1 白名单同构）：逐行先整串删除再扫。整串（非按命中 token）删除：token 形态下
// `project_rules.md`→`rules.md`、`.thincoder/advisor.md`→`advisor.md`（_ / / 不在字符类），
// 按 token 豁免会误放行孤立引证，整串删除不会。
const J3_CANON_OPERANDS = [
  "AGENTS.md", "SKILL.md", "README.md", "MANIFEST.md",
  ".thincoder/advisor.md", "project_rules.md",
]

/** J3 豁免：逐行先整串删除 CANON 操作数再扫（PROMPT-SYSTEM.md §6.6 契约面） */
export function stripCanonOperands(line) {
  let out = line
  for (const s of J3_CANON_OPERANDS) out = out.split(s).join("")
  return out
}

/** 域内列档（相对仓根 · 正斜杠 · 排除目录按段匹配） */
function listFiles(dirs, exts, excl) {
  const out = []
  for (const d of dirs) {
    for (const e of readdirSync(join(ROOT, d), { withFileTypes: true, recursive: true })) {
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

const scanFace = (dirs, exts, excl, face) => listFiles(dirs, exts, excl).flatMap((f) => scanFile(f, face))

// ── 用例表（§2.4——夹具全内存 · 零落盘）──────────────────────────────────

test("T1 正常：J1 档名引证命中（夹具报 1 条 file:line token）", () => {
  const hits = lineHits('… (AGENT-LOOP.md §11.2)', "prompt")
  assert.deepEqual(hits, ["AGENT-LOOP.md", "§11.2"])
})

test("T2 边界：白名单操作数（AGENTS.md / SKILL.md / README.md / MANIFEST.md）零报", () => {
  assert.deepEqual(lineHits('read AGENTS.md', "code"), [])
  assert.deepEqual(lineHits('join(dir, "SKILL.md")', "code"), [])
  assert.deepEqual(lineHits("see README.md and MANIFEST.md anchors", "prompt"), [])
  // J3 CANON 豁免（父侧裁定候选 A）：小写操作数整串豁免；豁免面外的同名引证仍报
  assert.deepEqual(lineHits("standards live in .thincoder/advisor.md and project_rules.md", "prompt"), [])
  assert.deepEqual(lineHits("citation formats per project_rules.md-style — see also advisor.md", "prompt"), ["advisor.md"])
})

test("T3 边界：批次段号 §1–§6 正例面（协议自名——J2 天然不命中）", () => {
  assert.deepEqual(lineHits("段值域 = §1–§6（§1 讨论 / §2 任务 / §3 评审 / §4 批准 / §5 实施 / §6 收口）", "prompt"), [])
})

test("T4 边界：路径形（<…> / * 紧邻 .md）J3 零报", () => {
  assert.deepEqual(lineHits("`docs/batches/<batch>-<topic>.md`", "prompt"), [])
  assert.deepEqual(lineHits("batches/*.md", "prompt"), [])
  assert.deepEqual(lineHits("design/<board>.md", "prompt"), [])
})

test("T5 边界：转义点形（正则字面量专属）由守卫天然不命中", () => {
  assert.deepEqual(lineHits('"/panel \\(… — §19\\.6\\), /"', "code"), [])
})

test("T6 边界：注释面豁免（全行 // 与 JSDoc * 行——代码面剥离后零报）", () => {
  assert.deepEqual(lineHits("// (AGENT-LOOP.md §6.10)", "code"), [])
  assert.deepEqual(lineHits(" * §14.5 (AGENT-LOOP.md) note", "code"), [])
})

test("T7 错误：P 面小写档名引证（J3）报 1 条", () => {
  assert.deepEqual(lineHits("pairs with common.md", "prompt"), ["common.md"])
})

test("T8 错误：裸节号形（J2 两位数支）报 1 条", () => {
  assert.deepEqual(lineHits("… (…… §17.5.5 …)", "prompt"), ["§17.5"])
})

test("T9 实档：三式域内零命中（本批清零后的常驻锁）", () => {
  const promptFiles = listFiles(PROMPT_DIRS, [".md"], BASE_EXCL)
  const codeFiles = listFiles(CODE_DIRS, CODE_EXTS, CODE_EXCL)
  // 域防呆：三面各自至少扫到 1 档（排除误用 ⇒ 空扫假绿的守卫）
  for (const d of PROMPT_DIRS) assert.ok(promptFiles.some((f) => f.startsWith(d)), `域缺档: ${d}`)
  for (const d of CODE_DIRS) assert.ok(codeFiles.some((f) => f.startsWith(d)), `域缺档: ${d}`)
  const hits = [
    ...promptFiles.flatMap((f) => scanFile(f, "prompt")),
    ...codeFiles.flatMap((f) => scanFile(f, "code")),
  ]
  assert.deepEqual(hits, [])
})
