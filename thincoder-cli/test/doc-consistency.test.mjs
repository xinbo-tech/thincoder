/**
 * doc-consistency.test.mjs — 文档一致性机械校验 V1/V2（ENGINEERING-MODE.md §2.19 机械校验最小集 ·
 * 需求 §1.15 · 批次档 §2 用例 T41 / AC28）。
 *
 * 断言面：
 *   ① 仓库扫描零违规——`checkDocConsistency(repoRoot)` 的违规集必须为空，且基线
 *     （`test/fixtures/doc-consistency-baseline.json`）**必须保持为空**（入基线 = 例外 = 违规；
 *     fail-closed：基线非空即 FAIL——检查器直接退出码 1）。合规面零假阳才能常驻。
 *   ② 反证非空转（夹具面）——临时域内人为制造 V1 失效引用 / V2 计数不符 → 必被检出；
 *      合规对照文档不被误报（零假阳面）。
 *   ③ 反证非空转（仓库域面）——向真实扫描域注入一条计数不符探针 → 判为**新增**（不落基线）→ 检出。
 *   ④ 基线文件本身可读且**为空**（入基线 = 例外 = 违规——fail-closed；AC28 判据源）。
 *   ⑤ 防回潮静态锚（T75——退役提示词文件未复活；2026-09-11 TEST-LIFECYCLE 扫① 收归）。
 * S4 单仓化（设计档 TWO-REPO-MERGE.md §2.4 R5）：V4 跨仓形态合规整类退场（T-LS35–T-LS37 删段）。
 * 纯文件读取 + 字符串/结构判——零网络、零 git。仓库域扫描两例（T41①/T41④）+ spawn 主行程
 * 断言一例走 slow() 门控（2026-09-12 收尾轮 9——重扫描真实进程类）；其余用例留快层。
 */
import { test, beforeEach, afterEach, after } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  checkDocConsistency, checkSectionRefs, checkCountLists, checkDocWidths, checkBatchSegments,
  loadBaseline, v2Key, SCAN_DIRS, BASELINE_PATH,
} from "../../scripts/check-doc-width.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__here, "..")
const MERGED = resolve(REPO, "..") // 合并仓根（S4——仓根统一版脚本）

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "doc-consistency-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

/** 仓库域探针文件（T41 ④ 注入用）——全局 after 兜底清理：用例被强杀/超时
 *  留下的探针本身就是一条 V2 新增违规，会让本仓 T41 ① 自伤变红。 */
const PROBE = join(REPO, ...SCAN_DIRS[0].split("/"), "_doc-consistency-probe.md")
after(() => { rmSync(PROBE, { force: true }) })

/** 在临时域建 docs/design/<name>（V1/V2 扫描域）。 */
function writeDoc(name, content) {
  const dir = join(tmp, SCAN_DIRS[0])
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), content)
}

slow("T41 ① 仓库扫描：V1/V2/V3 零违规 + 基线必须为空（入基线 = 例外 = 违规）", () => {
  const { v1, v2, v3 } = checkDocConsistency(REPO)
  const baseline = loadBaseline(REPO)
  assert.equal(baseline.size, 0, "基线必须保持为空——新增违规一律红，不得再入基线（入基线 = 例外 = 违规）")
  const offenders = [
    ...v1.map((r) => `V1 ${r.file} “${r.ref}”（${r.reason}）`),
    ...v2.map((r) => `V2 ${r.file}:${r.line} “${r.decl}” 声明 ${r.declared} ≠ 枚举 ${r.found}（${r.form}）`),
    ...v3.map((r) => `V3 ${r.file} §3 缺工具写入的轮次行`),
  ]
  assert.deepStrictEqual(offenders, [], "扫描域零违规（清零轮后无存量合法态——修掉，不入基线）")
  assert.ok(Array.isArray(v1) && Array.isArray(v2) && Array.isArray(v3), "扫描产出三列表（V1/V2/V3）")
})

test("T41 ② 反证（夹具域）：V1 失效引用被检出 / 合规引用不误报", () => {
  writeDoc("target.md", "# 目标\n\n## 1. 第一节\n\n## 2.15 小节\n")
  writeDoc("probe.md", [
    "合规：见 target.md §1、target.md §2.15、本文件 §1。",
    "失效节号：见 target.md §99。",
    "未知文档：见 NOSUCH-DOC.md §1。",
    "",
    "## 1. 本档第一节",
    "",
    "本文件 §1 自指合规（同档节号存在）。",
    "本档 §7 自指失效。",
  ].join("\n"))
  const v1 = checkSectionRefs(tmp)
  const refs = v1.map((r) => `${r.ref}|${r.reason}`)
  assert.ok(refs.includes("target.md §99|no-section"), "失效节号检出")
  assert.ok(refs.includes("NOSUCH-DOC.md §1|unknown-doc"), "未知文档检出")
  assert.ok(refs.includes("本档 §7|no-section"), "自指失效检出")
  assert.ok(!refs.some((r) => r.startsWith("target.md §1|")), "合规引用不误报（§1）")
  assert.ok(!refs.some((r) => r.startsWith("target.md §2.15|")), "合规引用不误报（§2.15）")
  assert.ok(!refs.some((r) => r.startsWith("本文件 §1|")), "合规自指不误报")
})

test("T41 ③ 反证（夹具域）：V2 计数不符被检出 / 相符与伪形不误报（三形态）", () => {
  const fixture = [
    "# 计数",
    "",
    "三条铁律：",            // 声明 3 ≠ 列表 2 → 必报（list 形态）
    "",
    "- 一",
    "- 二",
    "",
    "两条铁律：",            // 声明 = 列表 → 不报（零假阳面）
    "",
    "- 一",
    "- 二",
    "",
    "三条清单**（含续行的条目）**：", // 声明 + 条目续行 → 3 == 3 不报（续行容忍）
    "",
    "1. 一",
    "   续行",
    "",
    "2. 二",
    "续行（非缩进续行同属上一条目）",
    "",
    "3. 三",
    "",
    "四处（表格）：",        // 声明 4 ≠ 表格 3 行 → 必报（table 形态）
    "",
    "| # | 名称 |",
    "|---|---|",
    "| 1 | a |",
    "| 2 | b |",
    "| 3 | c |",
    "",
    "五处（a / b / c）",     // 声明 5 ≠ 括号枚举 3 → 必报（paren 形态）
    "",
    "三处（a / b / c）",     // 声明 = 括号枚举 → 不报
    "",
    "### 5.3 项目落档（F3）", // “N 项目”复合词——不误判（负例）
    "",
    "- 一",
    "- 二",
    "- 三",
    "- 四",
    "",
    "补齐一条（单数散文用法）：", // N < 2 → 跳过（负例）
    "",
    "- 一",
    "- 二",
    "",
    "**五条**（需求档标题 / 批次档措辞）", // 强调符夹层 + 解释括号 → 非枚举头（负例）
    "",
    "- 一",
    "- 二",
    "",
    "```",
    "三条代码块内（豁免）：",  // 代码围栏内不判（负例）
    "- a",
    "```",
  ]
  writeDoc("counts.md", fixture.join("\n"))
  const v2 = checkCountLists(tmp)
  const got = v2.map((r) => `${r.declared}/${r.found}/${r.form}`)
  assert.ok(got.includes("3/2/list"), "列表形态不符检出")
  assert.ok(got.includes("4/3/table"), "表格形态不符检出")
  assert.ok(got.includes("5/3/paren"), "括号枚举形态不符检出")
  // 全量相等 = 负例（相符列表 / 后续续行 / “N 项目”复合词 / 单数散文 / 强调符夹层 / 代码块）零误报
  assert.deepStrictEqual([...got].sort(), ["3/2/list", "4/3/table", "5/3/paren"], "恰好 3 条（零假阳——负例全不报）")
})

slow("T41 ④ 反证（仓库域）：注入一条计数不符探针 → 判为新增（不落基线）", () => {
  const probe = PROBE
  writeFileSync(probe, "# 探针\n\n五条纪律：\n\n- a\n- b\n")
  try {
    const { v2 } = checkDocConsistency(REPO)
    const key = v2Key({ file: `${SCAN_DIRS[0]}/_doc-consistency-probe.md`, decl: "五条", declared: 5, found: 2, form: "list" })
    assert.ok(v2.some((r) => v2Key(r) === key), "注入探针被检出")
    assert.ok(!loadBaseline(REPO).has(key), "探针不落基线 → 判为新增（阻断方向）")
  } finally {
    rmSync(probe, { force: true })
  }
  const after = checkDocConsistency(REPO)
  assert.ok(!after.v2.some((r) => r.file.endsWith("_doc-consistency-probe.md")), "探针已清理（扫描域恢复）")
})

test("T41 ⑤ 基线文件与扫描域口径（AC28 判据源）", () => {
  const raw = JSON.parse(readFileSync(join(REPO, BASELINE_PATH), "utf8"))
  assert.ok(Array.isArray(raw.entries) && raw.entries.length === 0, "基线 entries 必须为空数组——入基线 = 例外 = 违规（fail-closed）")
  assert.ok(raw.entries.every((e) => /^(V1|V2|V3)\|/.test(e)), "条目标记形态 V1|/V2|/V3|（V4 随 S4 退场）")
  assert.deepStrictEqual(SCAN_DIRS, ["docs/design", "docs/requirements", "docs/batches"], "扫描域（排除 _archive/）")
  // 扫描域宽度面：V1/V2 域内 _archive/ 不受约束（collectMarkdown 跳过）
  const widths = checkDocWidths(REPO, { dir: SCAN_DIRS[0] })
  assert.ok(Array.isArray(widths), "宽度检查可跑（扫描域口径同源）")
})

test("T46 边界：V3 批次档 §3 工具轮次行三态零假阳（AC32——在飞不报/批准必报/有戳不报/骨架行不算）", () => {
  const dir = join(tmp, "docs", "batches")
  mkdirSync(dir, { recursive: true })
  const PLACE = "_（待实施）_"
  const doc = (name, sec3, sec4, sec6) => writeFileSync(join(dir, name), [
    "# 批次", "", "## §1 讨论（主 agent）", "", "内容", "",
    "## §3 设计评审（评审子代理自写）", "", "### 轮次与发现（发现摘要 / 🔴 处置）", "", sec3, "",
    "## §4 用户批准（主 agent 记）", "", "### 批准（日期 + 批准范围）", "", sec4, "",
    "## §6 验证与收口（父代理自写）", "", "### 父侧验证（L2 全量结果 + verify）", "", sec6, "",
  ].join("\n"))
  doc("inflight.md", PLACE, PLACE, PLACE) // ① 在飞：§4/§6 仅骨架/占位行 → 不报（零假阳）
  doc("approved.md", PLACE, "**2026-09-10 · 用户批准（原话：「批准」）**", PLACE) // ② 已批准、§3 无工具轮次行 → 必报
  doc("stamped.md", "### 轮次 1（评审子代理）\n\n| a | b |\n|---|---|\n| 1 | 2 |", PLACE, "**已核销**") // ③ 含工具写入轮次行 → 不报
  doc("skeleton.md", "", "**2026-09-10 · 用户批准**", PLACE) // ④ §3 只有骨架行 `### 轮次与发现（…）` → 报（骨架行不算）
  const got = checkBatchSegments(tmp).map((r) => r.file.replace(/\\/g, "/"))
  assert.deepStrictEqual(got, ["docs/batches/approved.md", "docs/batches/skeleton.md"],
    "四态：只报 ②④——在飞不报（判据不引用 §1 状态词）、骨架行既不算内容也不算来源戳")
})

/* ─── 第 13 批（T72–T73——文档机制边界与拆分；ENGINEERING-MODE.md §2.26） ─── */

test("T72 正常/反证：带 .md 形态引用 fail-closed 报 unknown-doc；规范形态零命中（B/AC53）", () => {
  writeDoc("cross-repo.md", [
    "# 引用夹具",
    "",
    "带 .md 的域外形态：见 WEBVIEW.md §5 展开说明。", // 反证：必报 unknown-doc（防未来静默放开）
    "",
    "规范形态：见 WEBVIEW（VSC 仓）§5 展开说明。", // 规范：无 .md 形态 ⇒ 不入 V1 判——零命中
  ].join("\n"))
  const refs = checkSectionRefs(tmp).map((r) => `${r.ref}|${r.reason}`)
  assert.ok(refs.includes("WEBVIEW.md §5|unknown-doc"), "带 .md 域外形态如实报（fail-closed 钉住）")
  assert.equal(refs.length, 1, "规范形态零命中（仅反证行一条）")
})

test("T73 正常：宽度表格行豁免——表格行零报告 / 非表格超宽照报（C/AC54）", () => {
  const long = "x".repeat(320)
  const tableLine = `| a | ${long} |`
  const plainLine = `p${long}`
  writeDoc("width.md", ["# 宽度夹具", "", tableLine, "", plainLine].join("\n"))
  const hits = checkDocWidths(tmp)
  assert.equal(hits.length, 1, "恰一条命中（表格行被豁免）")
  assert.equal(hits[0].line, 5, "非表格超宽行照报（含行号）")
  assert.equal(hits[0].len, plainLine.length, "行长度如实（非表格面零改）")
  assert.ok(!hits.some((h) => h.line === 3), ">300 字符表格行零报告（豁免谓词 = isTableRow）")
})

/* ─── 防回潮静态锚（2026-09-11 TEST-LIFECYCLE 扫① 收归；原档删段）───
 * 退役提示词文件不得复活——文件存在性扫描（fail-on-reappear）。 */
/* 退役提示词文件（原 async-guidance AC-2 + eng-designer-role T32 对照断言） */
const RETIRED_PROMPT_FILES = ["system.md", "engineering.md", "engineering-sub.md", "main.md", "discipline.md", "methodology-template.md", "eng-coder.md", "explore.md", "coder.md", "plan.md"]

test("T75 防回潮（收归族）：退役提示词文件未复活（双源两面——原 async-guidance / eng-designer-role）", () => {
  for (const dir of ["src/prompts", "docs/design/prompts"]) {
    for (const f of RETIRED_PROMPT_FILES) assert.ok(!existsSync(join(REPO, ...dir.split("/"), f)), `${dir}/${f} 已退役——不应存在`)
  }
})

/* ─── 第 14 批（T111–T112——拆分守恒与自持回归锁；ENGINEERING-MODE.md §2.26.3 D-2 / §2.27.4） ─── */

/** 快层发现集 = `test/*.test.mjs`（单层通配 ↔ readdirSync 同集——run-fast 默认目标） */
const FAST_LAYER = readdirSync(join(REPO, "test")).filter((f) => f.endsWith(".test.mjs"))
/** 用例数 = 顶层 `test(` / `slow(` 声明数（两档均无 slow——计数字面即归册面） */
const caseCount = (rel) => (readFileSync(join(REPO, rel), "utf8").match(/^(?:test|slow)\(/gm) ?? []).length
/** 拆分守恒 as-of 基线（2026-09-12 散文锚退役批重测；拆分时合计 53）：A 14 / B 4 / 合计 18。
 *  实施规则：两档增删用例时须同步更新本基线（红 = 对账提醒——防静默丢例）。 */
const SPLIT_CASES = { async: 14, dual: 4 }

test("T111 正常：拆分守恒——14 + 4 = 18（as-of 基线）；两档各 ≤500；被快层发现（D-2/AC56）", () => {
  const A = "test/prompts-async-guidance.test.mjs"
  const B = "test/prompts-dual-source.test.mjs"
  for (const f of [A, B]) assert.ok(FAST_LAYER.includes(f.split("/").pop()), `未被快层 glob 发现: ${f}`)
  assert.equal(caseCount(A), SPLIT_CASES.async, "async-guidance 用例数（as-of 基线）")
  assert.equal(caseCount(B), SPLIT_CASES.dual, "dual-source 用例数（as-of 基线）")
  assert.equal(caseCount(A) + caseCount(B), SPLIT_CASES.async + SPLIT_CASES.dual, "拆分守恒（合计 = 两档和）")
  for (const f of [A, B]) {
    const n = readFileSync(join(REPO, f), "utf8").split("\n").length
    assert.ok(n <= 500, `${f} ${n} 行 >500 硬限`)
  }
})

test("T112 边界：新档自持——零跨档引用；import 全 node:（D-2/AC56）", () => {
  const src = readFileSync(join(REPO, "test/prompts-dual-source.test.mjs"), "utf8")
  assert.equal((src.match(/prompts-async-guidance/g) ?? []).length, 0, "零跨档引用（含注释）")
  const specs = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])
  assert.ok(specs.length > 0 && specs.every((s) => s.startsWith("node:")), "import 全 node: 内建（头部自持）")
})
