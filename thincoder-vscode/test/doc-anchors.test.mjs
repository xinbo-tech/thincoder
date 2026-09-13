/**
 * doc-anchors.test.mjs — V5 文档锚一致性机检用例（DOC-CODE-RECONCILE 批 §10 · T-DC1–T-DC14；S4 单仓化修订）。
 *
 * 判据权威 = `docs/design/DOC-CODE-RECONCILE.md` §4（判据）/ §4.7（假阳八类）/ §4.8（双态）/ §10（用例）/ §11（AC）。
 * 夹具 = 临时工作区 `<ws>/thincoder-vscode`（本域根）+ `<ws>/thincoder-cli`（合并仓另一域——A2 代码面并集），
 * **夹具自持**（S4：对端发现 / 缺仓域外 / 自指 fail-closed 整类退役——设计档 TWO-REPO-MERGE.md §2.4 R7）。
 * 慢层（slow()）：真仓（合并仓全域——仓根统一版脚本）全量扫描（T-DC6 ②）。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  checkAnchors, collectSourceDomain, extractTokens, caseTokenExists, collectCaseTitles,
  NOTE_RE, PLATFORM_API_SET, PLATFORM_API_TERMS, main,
} from "../../scripts/doc-anchors.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MERGED = resolve(REPO, "..") // 合并仓根（S4——统一三档驻村）

/** 夹具：写临时工作区文件集（键 = 相对路径）。 */
function fixture(files) {
  const ws = mkdtempSync(join(tmpdir(), "doc-anchors-"))
  for (const [rel, content] of Object.entries(files)) {
    const p = join(ws, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, content, "utf8")
  }
  return ws
}
/**
 * 夹具符号名以片段拼装：A2 存在域 = **代码面词界命中**（`test/**` 在域内）——夹具名以字面量落在本档内，
 * 会让真仓清单被自我遮蔽（合并仓另一域实装符号 / 合成缺失名的判定失真）。
 * 同源纪律 = 设计档 §4.2 P4「自命中防治」的镜像面（本档 = 遮蔽防治）。
 */
const OTHER_SYMBOL = "enforce" + "Region" + "Cap"
const SYNTHETIC_MISSING = "zzNo" + "Such"

/** 基础工作区：本域源 / 测档 + 合并仓另一域代码面（跨域实装符号在册——A2 代码面并集）。 */
const BASE = {
  "thincoder-vscode/src/a.mjs": "export const alphaOne = 1\nexport function scanGroups() { return [] }\n",
  "thincoder-vscode/test/a.test.mjs": 'test("T-VS1 正常：例", () => {})\nslow("T-VS32 错误：例", () => {})\n',
  "thincoder-cli/src/x.mjs": `export function ${OTHER_SYMBOL}() { return 0 }\n`,
}
/** 建一个含探针档的工作区（`extra` 可覆盖 / 追加）。 */
function scenario(docContent, extra = {}, name = "PROBE") {
  const ws = fixture({ ...BASE, [`thincoder-vscode/docs/design/${name}.md`]: docContent, ...extra })
  return { ws, root: join(ws, "thincoder-vscode"), other: join(ws, "thincoder-cli") }
}
const clean = (ws) => rmSync(ws, { recursive: true, force: true })
/** 进程内跑 main 并收集输出。 */
const runMain = (args, opts = {}) => {
  const out = []
  const code = main(args, { log: (s) => out.push(s), env: {}, ...opts })
  return { code, out, text: out.join("\n") }
}

// ── T-DC1 正常：A1 在册零报 / 合成缺失必报（AC-DC1） ─────────────────────────
test("T-DC1 正常：`T-VS1`（在册）零报 · `T-ZZ9`（合成缺失）判 1 处 + 症状串", () => {
  const { ws, root } = scenario("# 探针\n\n- 在册用例号：`T-VS1`\n- 合成缺失用例号：`T-ZZ9`\n")
  try {
    const r = checkAnchors({ root })
    assert.equal(r.hits.length, 1, JSON.stringify(r.hits))
    assert.deepStrictEqual([r.hits[0].kind, r.hits[0].anchor], ["A1", "T-ZZ9"])
    assert.equal(r.hits[0].file, "docs/design/PROBE.md")
    assert.ok(r.hits[0].symptom.includes("用例号锚不在册"), r.hits[0].symptom)
    // AC-DC1：抽取 / 判据具名函数导出在位（反证非空转）
    assert.equal(typeof extractTokens, "function")
    assert.equal(typeof caseTokenExists, "function")
    assert.deepStrictEqual(collectCaseTitles(join(root, "test")), ["T-VS1 正常：例", "T-VS32 错误：例"])
  } finally { clean(ws) }
})

// ── T-DC2 边界：右界反证（`T-VS3` 不得由 `T-VS32` 满足） ─────────────────────
test("T-DC2 边界：右界反证——语料 `T-VS3` 不被 `T-VS32` / `T-VS35` 满足（必报）", () => {
  const { ws, root } = scenario("# 右界\n\n- 语料含：`T-VS3`\n", {
    "thincoder-vscode/test/a.test.mjs": 'slow("T-VS32 错误：例", () => {})\nslow("T-VS35 错误：例", () => {})\n',
  })
  try {
    const r = checkAnchors({ root })
    assert.equal(r.hits.length, 1, JSON.stringify(r.hits))
    assert.equal(r.hits[0].anchor, "T-VS3")
    assert.ok(!caseTokenExists(collectCaseTitles(join(root, "test")), "T-VS3"), "前缀碰撞不得满足")
  } finally { clean(ws) }
})

// ── T-DC3 正常 / 边界：A2 存在域（本域 ∪ 合并仓另一域）+ 皆无必报 ─────────────
test("T-DC3 正常/边界：A2 本域 / 合并仓另一域代码面在册零报 · 代码面皆无必报", () => {
  const docs = `# 符号\n\n- 本域在册：\`scanGroups\`\n- 另一域代码面在册：\`${OTHER_SYMBOL}\`\n- 代码面皆无：\`${SYNTHETIC_MISSING}\`\n`
  const { ws, root, other } = scenario(docs)
  try {
    const r = checkAnchors({ root, codeRoots: [root, other] }) // 代码面 = 合并仓域集并集
    assert.equal(r.hits.length, 1, JSON.stringify(r.hits))
    assert.deepStrictEqual([r.hits[0].kind, r.hits[0].anchor], ["A2", SYNTHETIC_MISSING])
    assert.ok(r.hits[0].symptom.includes("符号锚不在册"), r.hits[0].symptom)
  } finally { clean(ws) }
})

// ── T-DC4 正常 / 边界：A3 判序五态（与台账 L4② 同函数——AC-DC3） ────────────
test("T-DC4 正常/边界：A3 判序五态（仓根 / 裸 .md / 陈旧前缀 / 多义 / 0 命中）+ 判序单源", () => {
  const docs = [
    "# A3 判序",
    "",
    "- ① 仓根解析：`docs/design/alpha.md`",
    "- ② 裸 .md 档名：`alpha.md`",
    "- ③ 陈旧前缀 + basename 唯一：`scripts/old/uniq.mjs`",
    "- ④ basename 多义：`src/where/dup.mjs`",
    "- ⑤ 0 命中：`src/nope.mjs`",
  ].join("\n")
  const { ws, root } = scenario(docs, {
    "thincoder-vscode/docs/design/alpha.md": "# alpha\n",
    "thincoder-vscode/scripts/uniq.mjs": "export const u = 1\n",
    "thincoder-vscode/src/dup.mjs": "export const d = 1\n",
    "thincoder-vscode/webview/dup.mjs": "export const d2 = 1\n",
  })
  try {
    const got = checkAnchors({ root }).hits.map((h) => `${h.kind}|${h.anchor}`)
    assert.deepStrictEqual(got, ["A3|src/where/dup.mjs", "A3|src/nope.mjs"], JSON.stringify(got))
    // AC-DC3 判序单源（S4：统一版驻村——仓根 `scripts/`）：`export function evidenceState` 恰一处 + VSC 锚引擎含该导入
    const scripts = join(MERGED, "scripts")
    const defs = readdirSync(scripts).filter((f) => f.endsWith(".mjs"))
      .filter((f) => readFileSync(join(scripts, f), "utf8").includes("export function evidenceState"))
    assert.deepStrictEqual(defs, ["check-ledger.mjs"], "判序函数恰一处定义（无第二份定位实现）")
    assert.ok(/import\s*\{\s*evidenceState\s*\}\s*from\s*"\.\/check-ledger\.mjs"/.test(readFileSync(join(scripts, "doc-anchors-core.mjs"), "utf8")), "统一版 VSC 锚引擎导入复用（单源）")
  } finally { clean(ws) }
})

// ── T-DC5 正常 / 边界：注记须携带消解信息（AC-DC5） ──────────────────────────
test("T-DC5 正常：退场 / 归位注记零报 · 裸「已废」判（注记须带消解信息）", () => {
  const docs = [
    "# 注记",
    "",
    "- 退场注记：`zzGoneOne`（已退场——删除记录 = TESTING.md §8.1）",
    "- 归位注记：`zzGoneTwo`（归位——自 docs/design/OLD.md）",
    "- 裸关键词（不构成注记）：`zzGoneThree`（已废）",
  ].join("\n")
  const { ws, root } = scenario(docs)
  try {
    const r = checkAnchors({ root })
    assert.deepStrictEqual(r.hits.map((h) => h.anchor), ["zzGoneThree"], JSON.stringify(r.hits))
    // AC-DC5：注记正则常量在位（grep 面）
    assert.ok(NOTE_RE instanceof RegExp, "注记关键词常量导出在位")
    assert.ok(readFileSync(join(MERGED, "scripts", "doc-anchors-core.mjs"), "utf8").includes("NOTE_RESOLUTION_RE"), "消解信息正则常量在位")
  } finally { clean(ws) }
})

// ── T-DC6 正常：报告态（逐处行 + 尾行计数 + `--json` 字段枚举；退出码 0） ────
test("T-DC6 正常：报告态——逐处行 + 尾行计数 + `--json` 字段齐；退出码 0（夹具域）", () => {
  const { ws, root } = scenario("# 报告态\n\n- 缺失：`T-ZZ9`\n")
  try {
    const r = runMain(["--root", root])
    assert.equal(r.code, 0, r.text)
    assert.ok(r.out.some((l) => l.startsWith("✗ V5 docs/design/PROBE.md:3 [A1] T-ZZ9 — 期望")), r.text)
    assert.match(r.out[r.out.length - 1], /^V5: 命中 1 处 · distinct 1（A1 1 \/ A2 0 \/ A3 0）· 报告态$/)
    const j = runMain(["--root", root, "--json"])
    const obj = JSON.parse(j.out[0])
    assert.deepStrictEqual(Object.keys(obj).sort(), ["counts", "hits", "mode", "sourceDomain"])
    assert.equal(obj.mode, "report")
    assert.deepStrictEqual(Object.keys(obj.counts).sort(), ["A1", "A2", "A3", "distinct", "total"])
    assert.deepStrictEqual(Object.keys(obj.hits[0]).sort(), ["anchor", "file", "kind", "line", "symptom"])
  } finally { clean(ws) }
})

slow("T-DC6 ② 正常：源域实跑（合并仓全域——报告态退出码 0；档数入输出）", () => {
  const r = runMain(["--json", "--root", MERGED, "--domain", "thincoder-vscode"], { cwd: MERGED })
  assert.equal(r.code, 0, r.text)
  const obj = JSON.parse(r.out[0])
  assert.equal(obj.mode, "report")
  assert.ok(obj.sourceDomain > 50, `源域档数入输出（实得 ${obj.sourceDomain}）`)
  assert.ok(obj.counts.total === 0, "清账收口：真仓复跑零命中（期 2 清账 323 → 0——防回潮锁）")
  assert.ok(readFileSync(join(REPO, "docs/design/DOC-CODE-RECONCILE.md"), "utf8").includes("源域实测档数"), "as-of 口径在档")
})

// ── T-DC7 边界：假阳八类逐类一行 → 零报（AC-DC4 / N6 硬前提） ────────────────
test("T-DC7 边界：假阳八类（设计档编号 / 档名主干 / API / 哈希 / 命令 / 另一域符号 / 占位 / 平台码）零报", () => {
  const docs = [
    "# 假阳八类",
    "",
    "- ① 设计档内部编号：`AC-VS29` · `F15` · `N6` · `D3`",
    "- ② 档名主干：`TESTING` · `PROJECT` · `FEATURES` · `PHILOSOPHY`",
    "- ③ 库 / 浏览器 API：`preventDefault` · `stopImmediatePropagation`",
    "- ④ 提交哈希：`0231627` · `051b317`",
    "- ⑤ 命令字面与 fenced 块（见下）",
    `- ⑥ 合并仓另一域实装符号：\`${OTHER_SYMBOL}\``,
    "- ⑦ 运行时 / 示例占位：`.thincoder/conventions.json` · `X.md` · `path/to/file.md`",
    "- ⑧ 平台码：`TF400813`",
    "",
    "```text",
    "node scripts/check-doc-width.mjs",
    "T-QQ9（块内零判）",
    "```",
  ].join("\n")
  const { ws, root, other } = scenario(docs, {
    "thincoder-vscode/docs/design/TESTING.md": "# TESTING\n",
    "thincoder-vscode/docs/design/PROJECT.md": "# PROJECT\n",
    "thincoder-vscode/docs/design/FEATURES.md": "# FEATURES\n",
    "thincoder-vscode/docs/design/PHILOSOPHY.md": "# PHILOSOPHY\n",
  })
  try {
    assert.deepStrictEqual(checkAnchors({ root, codeRoots: [root, other] }).hits, [], "八类假阳逐类零报（零假阳是常驻前提）")
    // 词表 / 排除式载体在位（反证：非空转——词表非空且 API 名在内）
    assert.ok(PLATFORM_API_SET.has("preventDefault") && PLATFORM_API_SET.has("stopImmediatePropagation"))
    assert.deepStrictEqual(Object.keys(PLATFORM_API_TERMS).sort(), ["dom", "node", "vscode"], "词表三派生面（Node / DOM / vscode.*）")
  } finally { clean(ws) }
})

// ── T-DC8 边界：fenced 块 / 行内命令 / 搜索模式串 → 零报 ─────────────────────
test("T-DC8 边界：fenced 块整块跳 · 行内命令与搜索模式串整行跳（可执行坐标保字面）", () => {
  const docs = [
    "# 预处理",
    "",
    "行内命令：`cd thincoder-vscode && node scripts/check-doc-width.mjs`",
    "搜索模式串：`grep -E 'thincoder-cli/docs/x.md|CLI 仓 [^（]*\\.md'`",
    "",
    "```",
    "T-ZZ7",
    "`docs/design/NOPE-DOC.md`",
    "```",
  ].join("\n")
  const { ws, root } = scenario(docs)
  try {
    assert.deepStrictEqual(checkAnchors({ root }).hits, [])
  } finally { clean(ws) }
})

// ── T-DC9 边界：射程边界（`.md`+§ 免判 / 非 `.md`+§ 必判 / `:N-M` 剥离——判别化） ──
test("T-DC9 边界：`.md`+§ 归 V1（零报）· 非 `.md`+§ 必判 · `:N-M` 尾剥离后判 · 仓前缀 / E3 形态零报", () => {
  const docs = [
    "# 射程",
    "",
    "- V1 面（`.md` token + 同行 § ⇒ 归 V1——零报）：`NOPE-V1.md` 见 §8.1",
    "- 非 `.md` token + 同行 §（归 V5——必判）：`src/nope.mjs` 见 §4",
    "- `:N-M` 行区间尾（剥离后按裸路径判）：`scripts/nope.mjs:12-34`",
    "- V4 退场面：`thincoder-cli/src/x.md`（带域前缀 ⇒ 不入本域判——R8 后仍不入 A3 面）",
    "- E3 形态：`tui/model-catalog.mjs`（CLI 仓）",
  ].join("\n")
  const { ws, root } = scenario(docs)
  try {
    const got = checkAnchors({ root }).hits.map((h) => `${h.kind}|${h.anchor}`)
    assert.deepStrictEqual(got, ["A3|src/nope.mjs", "A3|scripts/nope.mjs"], JSON.stringify(got))
  } finally { clean(ws) }
})

// ── T-DC10 边界：源域排除（归档 / 批档 / 台账两档零扫描） ────────────────────
test("T-DC10 边界：`_archive/` · `docs/batches/` · 台账两档不入源域（零扫描）", () => {
  const { ws, root } = scenario("# 活档\n\n正文（零锚）。\n", {
    "thincoder-vscode/docs/design/_archive/OLD.md": "# 旧\n\n- `T-ZZ1`\n",
    "thincoder-vscode/docs/batches/2026-01-01-B.md": "# 批\n\n- `T-ZZ2`\n",
    "thincoder-vscode/docs/TODO.md": "# 台账\n\n- `T-ZZ3`\n",
    "thincoder-vscode/docs/TODO-archive.md": "# 归档台账\n\n- `T-ZZ4`\n",
  })
  try {
    assert.deepStrictEqual(collectSourceDomain(root).map((p) => p.slice(root.length + 1).replace(/\\/g, "/")), ["docs/design/PROBE.md"])
    assert.deepStrictEqual(checkAnchors({ root }).hits, [], "排除域零扫描（不进清单）")
  } finally { clean(ws) }
})

// ── T-DC11 边界：运行时 / 用户态域与示例占位 → 零报 ──────────────────────────
test("T-DC11 边界：`.thincoder/…` · `X.md` · `path/to/file.md` · `node_modules/x.md` 零报", () => {
  const { ws, root } = scenario("- 运行时 / 占位：`.thincoder/conventions.json` · `X.md` · `path/to/file.md` · `node_modules/x.md`\n")
  try {
    assert.deepStrictEqual(checkAnchors({ root }).hits, [])
  } finally { clean(ws) }
})

// ── T-DC12 边界：`--json` vs 尾行计数自洽（D3 口径——AC-DC7） ──
test("T-DC12 边界：`--json` 计数自洽（total=Σ 分型；distinct ≤ total）+ 与尾行一致", () => {
  const docs = `# 计数\n\n- \`T-ZZ9\`\n- \`T-ZZ9\`（重处）\n- \`${SYNTHETIC_MISSING}\`\n- \`src/nope.mjs\`\n`
  const { ws, root } = scenario(docs)
  try {
    const obj = JSON.parse(runMain(["--root", root, "--json"]).out[0])
    assert.deepStrictEqual(obj.counts, { total: 4, distinct: 3, A1: 2, A2: 1, A3: 1 })
    assert.equal(obj.counts.total, obj.hits.length)
    assert.equal(obj.counts.A1 + obj.counts.A2 + obj.counts.A3, obj.counts.total)
    assert.equal(obj.counts.distinct, new Set(obj.hits.map((h) => h.anchor)).size)
    assert.ok(obj.counts.distinct <= obj.counts.total)
    assert.equal(obj.sourceDomain, 1)
    const txt = runMain(["--root", root]).out.slice(-1)[0]
    assert.ok(txt.includes(`命中 ${obj.counts.total} 处 · distinct ${obj.counts.distinct}（A1 ${obj.counts.A1} / A2 ${obj.counts.A2} / A3 ${obj.counts.A3}）· 报告态`), txt)
  } finally { clean(ws) }
})

// ── T-DC13 错误：阻断态（退出码 1 + FAIL 句）+ 无基线 + 切换三条件在档 ───────
test("T-DC13 错误：阻断态（合成三类缺失 ⇒ 退出码 1 + FAIL 句；`--strict` / `V5_GATE` 两通道）", () => {
  const docs = `# 三类缺失\n\n- \`T-ZZ9\`\n- \`${SYNTHETIC_MISSING}\`\n- \`src/nope.mjs\`\n`
  const { ws, root } = scenario(docs)
  try {
    const soft = runMain(["--root", root])
    assert.equal(soft.code, 0, "报告态不阻断")
    const hard = runMain(["--root", root, "--strict"])
    assert.equal(hard.code, 1, hard.text)
    assert.ok(hard.text.includes("FAIL(V5): 命中 3 处（阈值 0——文档锚须在册）"), hard.text)
    assert.equal(hard.out.filter((l) => l.startsWith("✗ V5")).length, 3, "逐处报红")
    assert.equal(runMain(["--root", root], { env: { V5_GATE: "1" } }).code, 1, "V5_GATE 通道同效")
    // AC-DC9 切换三条件逐条在档（设计档 §4.8）
    const design = readFileSync(join(REPO, "docs/design/DOC-CODE-RECONCILE.md"), "utf8")
    for (const s of ["V5 复跑命中 = 0", "反证夹具绿", "落档 + 接线"]) assert.ok(design.includes(s), `切换条件在档：${s}`)
  } finally { clean(ws) }
})

// ── T-DC14 错误：基线通道反证（合成非空基线 ⇒ V5 行为零变） ──────────────────
test("T-DC14 错误：基线通道反证——合成非空基线档，V5 行为零变（通道不存在）", () => {
  const { ws, root } = scenario("# 基线\n\n- `T-ZZ9`\n")
  try {
    const before = JSON.stringify(checkAnchors({ root }))
    mkdirSync(join(root, "test", "fixtures"), { recursive: true })
    writeFileSync(join(root, "test", "fixtures", "doc-consistency-baseline.json"), JSON.stringify({ entries: ["V5|docs/design/PROBE.md|T-ZZ9"] }), "utf8")
    assert.equal(JSON.stringify(checkAnchors({ root })), before, "V5 不读基线（通道不存在——不是「默认空」）")
    const src = readFileSync(join(MERGED, "scripts", "doc-anchors-core.mjs"), "utf8")
    assert.ok(!/doc-consistency-baseline|baseline/i.test(src), "源码零引用基线通道")
  } finally { clean(ws) }
})

// ── AC-DC13：档位与登记（新档 ≤500 / 两测档入册 / check-doc-width ±0） ───────
test("AC-DC13 静态：统一版两档 ≤500 且已入册 test/files.mjs（+2）；check-doc-width 零增行", () => {
  const list = readFileSync(join(REPO, "test", "files.mjs"), "utf8")
  for (const f of ["test/doc-anchors.test.mjs", "test/reconcile-lookup.test.mjs"]) {
    assert.ok(list.includes(`"${f}"`), `${f} 已入册（未接线 = 快层不跑）`)
    assert.ok(readFileSync(join(REPO, f), "utf8").split("\n").length <= 500, `${f} ≤500（硬限）`)
  }
  for (const f of ["doc-anchors.mjs", "doc-anchors-core.mjs"]) {
    const n = readFileSync(join(MERGED, "scripts", f), "utf8").split("\n").length
    assert.ok(n <= 500, `scripts/${f} ≤500（实 ${n}——统一三档硬限无豁免）`)
  }
  assert.ok(!readFileSync(join(MERGED, "scripts", "check-doc-width.mjs"), "utf8").includes("anchorState"), "V5 不并入宽度档（零功能增厚）")
})
