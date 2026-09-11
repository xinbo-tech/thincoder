/**
 * doc-consistency.test.mjs — 文档一致性机械校验 V1/V2/V3 VSC 面（ENGINEERING-MODE.md §2.19
 * 机械校验最小集 · §2.22.6 第 5 批镜像；用例 T61/T63/T64）。
 *
 * 断言面：
 *   ① 仓库扫描零新增——违规必须全部在基线内（新增阻断、存量降为报告——§1.15 口径）；
 *   ② **V1 豁免**（§2.22.7 VSC 独有语义）：含「（CLI 侧）」注记的行豁免（不报、不入基线）；
 *   ③ **V3 三态零假阳**：在飞不报 / 有实质内容无轮次行必报 / 有戳不报 / 骨架行不算；
 *      本仓缺 `docs/batches/` → 跳过不报（跨仓边界——真守门在 CLI 侧）；
 *   ④ **基线机制**：存量降报告（不阻断）、新增阻断；
 *   ⑤ **接线**（T64）：`test/files.mjs` 入册 + 校验器真被跑到（未接线 = 红）。
 * 纯文件读取 + 结构判——零网络、零 git、快层直跑。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  checkDocConsistency, checkSectionRefs, checkCountLists, checkBatchSegments, checkDocWidths,
  loadBaseline, v1Key, v2Key, v3Key, SCAN_DIRS, BASELINE_PATH,
} from "../scripts/check-doc-width.mjs"
import files from "./files.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "doc-consistency-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

/** 在临时域建 docs/design/<name>（V1/V2 扫描域）。 */
function writeDoc(name, content) {
  const dir = join(tmp, SCAN_DIRS[0])
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), content)
}

// ── ① 仓库扫描（新增违规阻断） ──────────────────────────────────────────────
test("仓库扫描：V1/V2/V3 违规全部在基线内（新增违规阻断——修掉或按存量登记）", () => {
  const { v1, v2, v3 } = checkDocConsistency(REPO)
  const baseline = loadBaseline(REPO)
  assert.ok(baseline.size > 0, "基线清单非空（首跑固化）")
  const fresh = [
    ...v1.map((r) => [v1Key(r), `V1 ${r.file} “${r.ref}”（${r.reason}）`]),
    ...v2.map((r) => [v2Key(r), `V2 ${r.file}:${r.line} “${r.decl}” 声明 ${r.declared} ≠ 枚举 ${r.found}（${r.form}）`]),
    ...v3.map((r) => [v3Key(r), `V3 ${r.file} §3 缺工具写入的轮次行`]),
  ].filter(([k]) => !baseline.has(k))
  assert.deepStrictEqual(fresh.map(([, msg]) => msg), [],
    "新增违规（处置：修掉，或无法本地解析的跨仓引用按 §2.22.7 加「（CLI 侧）」注记；新增项不得登记入基线自耗 AC42 阻断）")
  const detected = new Set([...v1.map(v1Key), ...v2.map(v2Key), ...v3.map(v3Key)])
  const stale = [...baseline].filter((k) => !detected.has(k))
  if (stale.length) console.log(`[doc-consistency] 基线条目已失效（已被修掉/文档位移）${stale.length} 条——报告不阻断`)
  assert.ok(Array.isArray(v1) && Array.isArray(v2) && Array.isArray(v3), "扫描产出三列表（V1/V2/V3）")
})

// ── ② V1 反证 + 「（CLI 侧）」豁免 ─────────────────────────────────────────
test("T63 ④ 边界：V1 失效引用被检出 / 合规引用不误报 / 「（CLI 侧）」注记行豁免", () => {
  writeDoc("target.md", "# 目标\n\n## 1. 第一节\n\n## 2.15 小节\n")
  writeDoc("probe.md", [
    "合规：见 target.md §1、target.md §2.15、本文件 §1。",
    "失效节号：见 target.md §99。",
    "未知文档：见 NOSUCH-DOC.md §1。",
    "跨仓引用（豁免）：见 CLI-ONLY.md §3（CLI 侧）。",
    "同形无注记（不豁免）：见 CLI-ONLY-2.md §3。",
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
  assert.ok(refs.includes("CLI-ONLY-2.md §3|unknown-doc"), "无注记的跨仓引用正常报（对照）")
  assert.ok(!refs.some((r) => r.startsWith("CLI-ONLY.md §3|")), "「（CLI 侧）」注记行豁免（不报）")
  assert.ok(!loadBaseline(tmp).has(v1Key({ file: `${SCAN_DIRS[0]}/probe.md`, ref: "CLI-ONLY.md §3" })), "豁免项不入基线（临时域基线为空即证）")
  assert.ok(!refs.some((r) => r.startsWith("target.md §1|")), "合规引用不误报（§1）")
  assert.ok(!refs.some((r) => r.startsWith("target.md §2.15|")), "合规引用不误报（§2.15）")
  assert.ok(!refs.some((r) => r.startsWith("本文件 §1|")), "合规自指不误报")
})

// ── ③ V2 反证（三形态 + 零假阳负例） ───────────────────────────────────────
test("T63 ② 正常：V2 计数不符被检出 / 相符与伪形不误报（三形态）", () => {
  writeDoc("counts.md", [
    "# 计数", "",
    "三条铁律：", "", "- 一", "- 二", "",
    "两条铁律：", "", "- 一", "- 二", "",
    "四处（表格）：", "", "| # | 名称 |", "|---|---|", "| 1 | a |", "| 2 | b |", "| 3 | c |", "",
    "五处（a / b / c）", "",
    "三处（a / b / c）", "",
    "### 5.3 项目落档（F3）", "", "- 一", "- 二", "- 三", "- 四", "",
    "```", "三条代码块内（豁免）：", "- a", "```",
  ].join("\n"))
  const got = checkCountLists(tmp).map((r) => `${r.declared}/${r.found}/${r.form}`)
  assert.ok(got.includes("3/2/list"), "列表形态不符检出")
  assert.ok(got.includes("4/3/table"), "表格形态不符检出")
  assert.ok(got.includes("5/3/paren"), "括号枚举形态不符检出")
  assert.deepStrictEqual([...got].sort(), ["3/2/list", "4/3/table", "5/3/paren"], "恰好 3 条（负例零误报）")
})

// ── ④ V3 三态零假阳 + 缺目录跳过（T61） ────────────────────────────────────
test("T61 边界：V3 三态零假阳 + 本仓缺 docs/batches 跳过（跨仓边界）", () => {
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
  doc("approved.md", PLACE, "**2026-09-11 · 用户批准（原话：「批准」）**", PLACE) // ② 已批准、§3 无工具轮次行 → 必报
  doc("stamped.md", "### 轮次 1（评审子代理）\n\n| a | b |\n|---|---|\n| 1 | 2 |", PLACE, "**已核销**") // ③ 含工具写入轮次行 → 不报
  doc("skeleton.md", "", "**2026-09-11 · 用户批准**", PLACE) // ④ §3 只有骨架行 → 报（骨架行不算）
  const got = checkBatchSegments(tmp).map((r) => r.file.replace(/\\/g, "/"))
  assert.deepStrictEqual(got, ["docs/batches/approved.md", "docs/batches/skeleton.md"],
    "四态：只报 ②④——在飞不报（判据不引用 §1 状态词）、骨架行既不算内容也不算来源戳")
  // ④ 本仓缺 docs/batches/ → 跳过不报（真守门在 CLI 侧 V3——§2.22.6 跨仓边界）
  const empty = mkdtempSync(join(tmpdir(), "no-batches-"))
  try {
    assert.deepStrictEqual(checkBatchSegments(empty), [], "缺目录 → 跳过（不报错、不空转）")
    assert.deepStrictEqual(checkDocConsistency(empty), { v1: [], v2: [], v3: [] }, "全空扫描域零误报")
  } finally { rmSync(empty, { recursive: true, force: true }) }
})

// ── ⑤ 基线机制（存量降报告 / 新增阻断） ────────────────────────────────────
test("T63 ③ 正常：存量不达基线降报告（不阻断）/ 基线外即新增（阻断方向）", () => {
  mkdirSync(join(tmp, "docs", "design"), { recursive: true })
  writeDoc("probe.md", "# 探针\n\n五条纪律：\n\n- a\n- b\n")
  const { v2 } = checkDocConsistency(tmp)
  const key = v2Key({ file: `${SCAN_DIRS[0]}/probe.md`, decl: "五条", declared: 5, found: 2, form: "list" })
  assert.ok(v2.some((r) => v2Key(r) === key), "计数不符被检出（探针）")
  assert.ok(!loadBaseline(tmp).has(key), "无基线文件 → 一切视为新增（阻断方向）")
  // 写入基线 → 该条降为「存量」：不再计入新增（报告面），仍留在检出面
  mkdirSync(join(tmp, "test", "fixtures"), { recursive: true })
  writeFileSync(join(tmp, BASELINE_PATH), JSON.stringify({ entries: [key] }))
  const baseline = loadBaseline(tmp)
  assert.ok(baseline.has(key), "基线可读且含该条")
  const { v2: v2b } = checkDocConsistency(tmp)
  const fresh = v2b.filter((r) => !baseline.has(v2Key(r)))
  assert.deepStrictEqual(fresh, [], "存量在基线内 → 降为报告（不阻断）")
})

// ── ⑥ 接线（T64） ──────────────────────────────────────────────────────────
test("T64 正常：接线——5 个新 test 档入册 test/files.mjs + 校验器真被跑到", () => {
  const list = readFileSync(join(REPO, "test", "files.mjs"), "utf8")
  const own = [
    "test/batch-segment.test.mjs", "test/batch-doc-gate.test.mjs",
    "test/eng-designer-role.test.mjs", "test/doc-consistency.test.mjs",
  ]
  for (const f of own) {
    assert.ok(list.includes(`"${f}"`), `${f} 已入册 test/files.mjs（未接线 = 快层不跑 = 机制没活）`)
    assert.ok(files.includes(f), `${f} 出现在清单导出面`)
  }
  // 面② 的锚句断言档（test/prompts-mirror-anchors.test.mjs）同属「5 新档全入册」——
  // 该档由提示词双源面新建，本档在其落地后同守接线（存在即必入册；缺失不误红）。
  const anchors = "test/prompts-mirror-anchors.test.mjs"
  if (existsSync(join(REPO, anchors))) assert.ok(list.includes(`"${anchors}"`), `${anchors} 已入册（5 新档全入册）`)
  // 「实跑」判据：校验器在本仓域真被执行（返回三列表）——对人为违规的敏感性由临时域用例承载（本档前四例）
  const { v1, v2, v3 } = checkDocConsistency(REPO)
  assert.ok(Array.isArray(v1) && Array.isArray(v2) && Array.isArray(v3), "仓库域扫描真跑（V1/V2/V3）——非空转判据在临时域用例（本档前四例）")
  assert.ok(Array.isArray(checkDocWidths(REPO, { dir: SCAN_DIRS[0] })), "宽度检查可跑（扫描域口径同源）")
  assert.deepStrictEqual(SCAN_DIRS, ["docs/design", "docs/requirements", "docs/batches"], "扫描域（缺目录即跳过）")
  // 本仓现状：无 docs/batches（批次档单一归属 = CLI 仓）→ V3 跳过不报（行为面在 T61 临时域断言；
  // 不预设永假——将来 VSC 自建批次档属设计 §2.22.6 明载的未来态）。
  const raw = JSON.parse(readFileSync(join(REPO, BASELINE_PATH), "utf8"))
  assert.ok(Array.isArray(raw.entries) && raw.entries.length > 0, "基线 entries 数组非空")
  assert.ok(raw.entries.every((e) => /^(V1|V2|V3)\|/.test(e)), "条目标记形态 V1|/V2|/V3|")
})

// ── ⑦ 宽度表格行豁免（群 A 批 A8——README 规则 6 豁免句 + 检查器契约附则） ──────
test("T-MA8-1 正常/边界：>300 表格行零报 / >300 非表格行照报（谓词单源）", () => {
  const row = "| 表格列 | " + "x".repeat(300) + " |" // 311 字符——表格行结构性不可折行 → 豁免
  const plain = "y".repeat(320) // 320 字符——正文非表格行 → 照报
  writeDoc("width-probe.md", ["# 宽度探针", "", row, "", plain, ""].join("\n"))
  const hits = checkDocWidths(tmp, { dir: SCAN_DIRS[0] })
  assert.deepStrictEqual(hits.map((h) => ({ line: h.line, len: h.len })), [{ line: 5, len: 320 }],
    "恰报非表格行 :5（320）——表格行 :3（311）零报")
})

test("T-MA8-2 边界（静态）：主流程零内联 width 扫描（判据单源 checkDocWidths）+ 规则 6 子串在位", () => {
  const src = readFileSync(join(REPO, "scripts", "check-doc-width.mjs"), "utf8")
  assert.ok(src.includes("const widthHits = checkDocWidths(root, { max: maxW, dir: dirArg })"),
    "主流程经单源入口（零内联重复扫描）")
  assert.ok(!/length\s*>\s*maxW/.test(src.slice(src.indexOf("const isMain"))),
    "主流程零内联 `length > maxW` 扫描")
  assert.ok(/if \(l\.length > max && !isTableRow\(l\)\)/.test(src), "豁免谓词落在判据行（单源定义）")
  const readme = readFileSync(join(REPO, "docs", "design", "README.md"), "utf8")
  assert.ok(readme.includes("表格行豁免"), "规则 6 豁免句在位")
  assert.ok(readme.includes("checkDocWidths"), "检查器契约附则（宽度扫描单源）在位")
})
