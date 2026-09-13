/**
 * core-hygiene.test.mjs — 核内结构机检（CORE-UNIFICATION T-C15 / T-C14 / N3 · S0a 起 · S1 补齐）。
 * 行为面：核内零产品侧 import · 零裸包名 import（N3 / N7）· 核内相对 import 可解析 ·
 * 核 `.mjs` 档位（≤300 软线 / ≤500 硬限——N8 / T-C14：超软线须带拆分计划）。
 *
 * 规则面（口径随 S1 收正——见批次档 §5）：
 *  - 说明符抽取先**去注释**（行注释 / 块注释 / 字符串外的散文引用）——S0a 版的裸正则把
 *    注释里的 `from "……"` 当 import 报（假阳性：`memory/schema.mjs` 的散文、`advisor.mjs`
 *    的 `../advisor.mjs` 指针注释等）⇒ 机检面精度收正（判据不变，仍报档与行）。
 *  - 档位：>500 = 硬红；>300 = 须在 `SOFT_LINE_REGISTRY` 登记（**未登记的新超线档 = 红**——
 *    防回潮）。已登记档的**拆分计划**属设计面（设计档 §2.5 行数列 = 落点），核内只登记读数。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * 超软线档登记表（`wc -l` 口径）——**逐字随迁**所致（S1 只做提取，**不重写**——
 * F3 / D-C2「零新写」；源档在两产品侧本就 >300）。拆分计划 = 设计档 §2.5 行数列（设计者面）。
 */
const SOFT_LINE_REGISTRY = new Set([
  "agent/dispatch.mjs", "agent/helpers.mjs", "agent/setup.mjs", "agent.mjs",
  "agent-tools/advisor-async.mjs", "agent-tools/consult.mjs", "agent-tools/read-history.mjs",
  "agent-tools/subagent-actions.mjs", "agent-tools/subagent-async.mjs",
  "agent-tools/subagent-scheduler.mjs", "agent-tools/subagent-spawn.mjs", "agent-tools/subagent.mjs",
  "config.mjs", "context.mjs", "git/checkpoint.mjs", "memory/code-sync.mjs", "memory/docs.mjs",
  "memory/schema.mjs", "provider/core.mjs", "provider/responses.mjs", "session-slots.mjs",
  "session-store.mjs", "session.mjs", "tools/edit-diff.mjs", "tools/file.mjs", "tools/git.mjs",
  "tools/lsp.mjs", "tools/repomap.mjs", "tools/shared.mjs", "traces/trace-store.mjs",
])

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (name.endsWith(".mjs")) out.push(p)
  }
  return out
}

/** Strip block + line comments so prose mentioning `from "…"` is never read as an import. */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

const specifiers = (src) => {
  const clean = stripComments(src)
  return [
    ...[...clean.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1]),
    ...[...clean.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
  ]
}

test("core .mjs files import only node: builtins + core-relative paths (N3 / N7 / T-C15)", () => {
  const bad = []
  for (const file of walk(ROOT)) {
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (spec.startsWith("node:") || spec.startsWith("./") || spec.startsWith("../")) continue
      bad.push(`${relative(ROOT, file)}: ${spec}`)
    }
  }
  assert.deepEqual(bad, [], `non-core import specifiers: ${bad.join(", ")}`)
})

test("every core-relative import resolves inside thincoder-core/", () => {
  const missing = []
  for (const file of walk(ROOT)) {
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (!spec.startsWith(".")) continue
      if (!existsSync(join(dirname(file), spec))) missing.push(`${relative(ROOT, file)} -> ${spec}`)
    }
  }
  assert.deepEqual(missing, [], `dangling relative imports: ${missing.join(", ")}`)
})

test("no core file reaches into a product tree — N3", () => {
  // ANY-depth `..` hop followed by a product name — the realistic form from thincoder-core/ is a
  // single hop up into a sibling product directory. Assembled from parts so this test's
  // own source never contains the scanned literal.
  const P = "thinc" + "oder" + "(?:-vscode)?"
  const productHop = new RegExp("(?:\\.\\.\\/)+" + P)
  const hits = []
  for (const file of walk(ROOT)) {
    if (productHop.test(readFileSync(file, "utf8"))) hits.push(relative(ROOT, file))
  }
  assert.deepEqual(hits, [])
})

test("core .mjs files: ≤500 hard cap, and every >300 file is registered (T-C14 / N8)", () => {
  const hard = []
  const unregistered = []
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file).replace(/\\/g, "/")
    const lines = readFileSync(file, "utf8").split("\n").length - 1 // wc -l semantics
    if (lines > 500) hard.push(`${rel}: ${lines}`)
    else if (lines > 300 && !SOFT_LINE_REGISTRY.has(rel)) unregistered.push(`${rel}: ${lines}`)
  }
  assert.deepEqual(hard, [], `>500 (hard cap): ${hard.join(", ")}`)
  assert.deepEqual(
    unregistered, [],
    `>300 without a registered split plan (design §2.5 行数列): ${unregistered.join(", ")}`,
  )
})
