/**
 * doc-consistency.test.mjs — 文档一致性机械校验 V1/V2（ENGINEERING-MODE.md §2.19 机械校验最小集 ·
 * 需求 §1.15 · 批次档 §2 用例 T41 / AC28）。
 *
 * 断言面：
 *   ① 仓库扫描零新增——`checkDocConsistency(repoRoot)` 的违规必须全部在基线
 *     （`test/fixtures/doc-consistency-baseline.json`）内：**新增违规阻断、存量不达基线降为报告**
 *      （需求 §1.15 非功能性需求——零假阳才能常驻）。
 *   ② 反证非空转（夹具面）——临时域内人为制造 V1 失效引用 / V2 计数不符 → 必被检出；
 *      合规对照文档不被误报（零假阳面）。
 *   ③ 反证非空转（仓库域面）——向真实扫描域注入一条计数不符探针 → 判为**新增**（不落基线）→ 检出。
 *   ④ 基线文件本身可读且非空（首跑固化清单——AC28 判据源）。
 * 纯文件读取 + 字符串/结构判——零网络、零 git、快层直跑。
 */
import { test, beforeEach, afterEach, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  checkDocConsistency, checkSectionRefs, checkCountLists, checkDocWidths, checkBatchSegments,
  loadBaseline, v1Key, v2Key, v3Key, SCAN_DIRS, BASELINE_PATH,
} from "../scripts/check-doc-width.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__here, "..")

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

test("T41 ① 仓库扫描：V1/V2/V3 违规全部在基线内（新增违规阻断）", () => {
  const { v1, v2, v3 } = checkDocConsistency(REPO)
  const baseline = loadBaseline(REPO)
  assert.ok(baseline.size > 0, "基线清单非空（首跑固化）")
  const fresh = [
    ...v1.map((r) => [v1Key(r), `V1 ${r.file} “${r.ref}”（${r.reason}）`]),
    ...v2.map((r) => [v2Key(r), `V2 ${r.file}:${r.line} “${r.decl}” 声明 ${r.declared} ≠ 枚举 ${r.found}（${r.form}）`]),
    ...v3.map((r) => [v3Key(r), `V3 ${r.file} §3 缺工具写入的轮次行`]),
  ].filter(([k]) => !baseline.has(k))
  assert.deepStrictEqual(fresh.map(([, msg]) => msg), [], "新增违规（修掉或按存量入基线——§2.19 D3/D4）")
  // 存量报告面（不阻断——需求 §1.15「存量不达基线降为报告」）：失效基线条目只统计、不报错
  const detected = new Set([...v1.map(v1Key), ...v2.map(v2Key), ...v3.map(v3Key)])
  const stale = [...baseline].filter((k) => !detected.has(k))
  if (stale.length) console.log(`[doc-consistency] 基线条目已失效（已被修掉/文档位移）${stale.length} 条——报告不阻断`)
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

test("T41 ④ 反证（仓库域）：注入一条计数不符探针 → 判为新增（不落基线）", () => {
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
  assert.ok(Array.isArray(raw.entries) && raw.entries.length > 0, "基线 entries 数组非空")
  assert.ok(raw.entries.every((e) => /^(V1|V2|V3)\|/.test(e)), "条目标记形态 V1|/V2|/V3|")
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
