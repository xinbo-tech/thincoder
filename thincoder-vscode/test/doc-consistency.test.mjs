/**
 * doc-consistency.test.mjs — 文档一致性机械校验 V1/V2/V3 VSC 面（ENGINEERING-MODE.md §2.19
 * 机械校验最小集 · §2.22.6 第 5 批镜像；用例 T61/T63/T64；S4 单仓化修订）。
 *
 * 断言面：
 *   ① 仓库扫描零违规 + **基线必须为空**（入基线 = 例外 = 违规——fail-closed；存量不再有「降报告」合法态）；
 *   ② **V1 豁免**（§2.22.7 VSC 独有语义）：含「（CLI 侧）」注记的行豁免（不报、不入基线）——单仓语义 =
 *      产品域外引用豁免（设计档 TWO-REPO-MERGE.md §2.5；判据本体保留）；
 *   ②b **跨域隔离（T-M9）**：两域同 basename 同名档不互相满足节号——全域解析 = 逐域隔离（引用只对本域
 *      文件解析，无 basename 一对多 fail-open）；
 *   ③ **V3 三态零假阳**：在飞不报 / 有实质内容无轮次行必报 / 有戳不报 / 骨架行不算；
 *      域缺 `docs/batches/` → 跳过不报（夹具空域行为面）；**工具前时代批次档**（< `V3_ERA_START`）不判；
 *   ④ **基线机制**（夹具域）：基线档可读可写 · 条目降为「存量」的过滤语义保留（本仓基线必须为空）；
 *      **非空即 FAIL**（spawn 面反证——合成非空基线 ⇒ FAIL + 退出码 1：T-VS32 ②）；
 *   ⑤ **接线**（T64）：`test/files.mjs` 入册 + 校验器真被跑到（未接线 = 红）。
 * S4 单仓化（设计档 §2.4 R8）：V4 跨仓形态合规整类退场（T-VS31–T-VS33 删段——判据随 R5/R8 删除）。
 * 纯文件读取 + 结构判——零网络、零 git。慢层（slow()——2026-09-12 收尾轮 9 归册）：T64（接线 + 仓库域扫描真跑）·
 * T-VS32 ②（真 spawn——合成非空基线反证）；观测 90ms–1.9s（随负载波动）；其余用例留快层。
 */
import { test, beforeEach, afterEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  checkDocConsistency, checkSectionRefs, checkCountLists, checkBatchSegments, checkDocWidths,
  loadBaseline, v1Key, v2Key, v3Key, SCAN_DIRS, BASELINE_PATH,
} from "../../scripts/check-doc-width.mjs"
import files from "./files.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MERGED = resolve(REPO, "..") // 合并仓根（S4——仓根统一版脚本）
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
test("仓库扫描：V1/V2/V3 零违规 + 基线必须为空（入基线 = 例外 = 违规）", () => {
  const { v1, v2, v3 } = checkDocConsistency(REPO)
  const baseline = loadBaseline(REPO)
  assert.equal(baseline.size, 0, "基线必须保持为空——新增违规一律红，不得再入基线（入基线 = 例外 = 违规）")
  const offenders = [
    ...v1.map((r) => `V1 ${r.file} “${r.ref}”（${r.reason}）`),
    ...v2.map((r) => `V2 ${r.file}:${r.line} “${r.decl}” 声明 ${r.declared} ≠ 枚举 ${r.found}（${r.form}）`),
    ...v3.map((r) => `V3 ${r.file} §3 缺工具写入的轮次行`),
  ]
  assert.deepStrictEqual(offenders, [],
    "扫描域零违规（处置：修掉，或产品域外引用按 §2.22.7 加「（CLI 侧）」注记；不得再入基线——入基线 = 例外 = 违规）")
  assert.ok(Array.isArray(v1) && Array.isArray(v2) && Array.isArray(v3), "扫描产出三列表（V1/V2/V3——V4 随 S4 退场）")
})

// ── ② V1 反证 + 「（CLI 侧）」豁免 ─────────────────────────────────────────
test("T63 ④ 边界：V1 失效引用被检出 / 合规引用不误报 / 「（CLI 侧）」注记行豁免", () => {
  writeDoc("target.md", "# 目标\n\n## 1. 第一节\n\n## 2.15 小节\n")
  writeDoc("probe.md", [
    "合规：见 target.md §1、target.md §2.15、本文件 §1。",
    "失效节号：见 target.md §99。",
    "未知文档：见 NOSUCH-DOC.md §1。",
    "产品域外引用（豁免）：见 CLI-ONLY.md §3（CLI 侧）。",
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
  assert.ok(refs.includes("CLI-ONLY-2.md §3|unknown-doc"), "无注记的域外引用正常报（对照）")
  assert.ok(!refs.some((r) => r.startsWith("CLI-ONLY.md §3|")), "「（CLI 侧）」注记行豁免（不报）")
  assert.ok(!loadBaseline(tmp).has(v1Key({ file: `${SCAN_DIRS[0]}/probe.md`, ref: "CLI-ONLY.md §3" })), "豁免项不入基线（临时域基线为空即证）")
  assert.ok(!refs.some((r) => r.startsWith("target.md §1|")), "合规引用不误报（§1）")
  assert.ok(!refs.some((r) => r.startsWith("target.md §2.15|")), "合规引用不误报（§2.15）")
  assert.ok(!refs.some((r) => r.startsWith("本文件 §1|")), "合规自指不误报")
})

// ── ②b T-M9 跨域隔离（全域 = 逐域解析——无 basename 一对多 fail-open） ─────
test("T-M9 边界：两域同 basename 档不互相满足节号——引用只对本域文件解析（跨域掩蔽消除）", () => {
  const mk = (domain, name, content) => {
    const dir = join(tmp, domain, SCAN_DIRS[0])
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, name), content)
  }
  // 两域（合并仓两产品域形态）：同 basename 同路径档各一份——甲的 §1 与乙的 §7 不互认
  mk("alpha", "TESTING.md", "# Alpha\n\n## 1. 一\n")
  mk("beta", "TESTING.md", "# Beta\n\n## 7. 七\n")
  mk("alpha", "ONLY-ALPHA.md", "# 甲域独有\n\n## 5. 五\n")
  mk("alpha", "probe.md", "合规：见 TESTING.md §1。\n\n失效引用：见 TESTING.md §7。\n")
  mk("beta", "probe2.md", "合规：见 TESTING.md §7。\n\n域外档引用：见 ONLY-ALPHA.md §5。\n")
  const rows = checkSectionRefs(tmp).map((r) => `${r.file}|${r.ref}|${r.reason}`)
  assert.ok(rows.includes("alpha/docs/design/probe.md|TESTING.md §7|no-section"),
    "A 域失效引用必须报——不得被 B 域同名档 §7 掩蔽（改前 = 假阴）")
  assert.ok(rows.includes("beta/docs/design/probe2.md|ONLY-ALPHA.md §5|unknown-doc"),
    "他域档不进入本域解析面（B 域引用只在 B 域解析——fail-closed）")
  assert.ok(!rows.some((r) => r.startsWith("alpha/docs/design/probe.md|TESTING.md §1|")), "本域可解析引用零误报（甲 §1）")
  assert.ok(!rows.some((r) => r.startsWith("beta/docs/design/probe2.md|TESTING.md §7|")), "本域可解析引用零误报（乙 §7）")
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
test("T61 边界：V3 三态零假阳 + 域缺 docs/batches 跳过", () => {
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
  // ④ 域缺 docs/batches/ → 跳过不报（夹具空域行为面；有批档域的 V3 判据由本档 V3 夹具覆盖）
  const empty = mkdtempSync(join(tmpdir(), "no-batches-"))
  try {
    assert.deepStrictEqual(checkBatchSegments(empty), [], "缺目录 → 跳过（不报错、不空转）")
    assert.deepStrictEqual(checkDocConsistency(empty), { v1: [], v2: [], v3: [] }, "全空扫描域零误报")
  } finally { rmSync(empty, { recursive: true, force: true }) }
})

// ── ⑤ 基线机制（夹具域：基线档可读可写 · 过滤语义保留 / 生产判据 = 基线必须保持为空——非空即 FAIL） ──
test("T63 ③ 正常：基线机制（夹具域——可读可写 · 过滤语义保留）/ 生产判据 = 基线必须保持为空（非空即 FAIL）", () => {
  mkdirSync(join(tmp, "docs", "design"), { recursive: true })
  writeDoc("probe.md", "# 探针\n\n五条纪律：\n\n- a\n- b\n")
  const { v2 } = checkDocConsistency(tmp)
  const key = v2Key({ file: `${SCAN_DIRS[0]}/probe.md`, decl: "五条", declared: 5, found: 2, form: "list" })
  assert.ok(v2.some((r) => v2Key(r) === key), "计数不符被检出（探针）")
  assert.ok(!loadBaseline(tmp).has(key), "无基线文件 → 一切视为新增（阻断方向）")
  // 写入基线（夹具域机制）→ 该条不再计入「新增」（报告面），仍留在检出面——生产判据见下：基线非空即 FAIL
  mkdirSync(join(tmp, "test", "fixtures"), { recursive: true })
  writeFileSync(join(tmp, BASELINE_PATH), JSON.stringify({ entries: [key] }))
  const baseline = loadBaseline(tmp)
  assert.ok(baseline.has(key), "基线可读且含该条")
  const { v2: v2b } = checkDocConsistency(tmp)
  const fresh = v2b.filter((r) => !baseline.has(v2Key(r)))
  assert.deepStrictEqual(fresh, [], "过滤机制保留（生产路径下：基线非空即 FAIL——入基线 = 例外 = 违规）")
})

// ── ⑥ 接线（T64） ──────────────────────────────────────────────────────────
slow("T64 正常：接线——5 个新 test 档入册 test/files.mjs + 校验器真被跑到", () => {
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
  // V3 判据行为面在 T61 临时域断言（含批档四态）；仓库域 = 本域 docs/batches 有批档则照判（零假阳前提同守）。
  const raw = JSON.parse(readFileSync(join(REPO, BASELINE_PATH), "utf8"))
  assert.ok(Array.isArray(raw.entries) && raw.entries.length === 0, "基线 entries 必须为空数组——入基线 = 例外 = 违规（fail-closed）")
  assert.ok(raw.entries.every((e) => /^(V1|V2|V3)\|/.test(e)), "条目标记形态 V1|/V2|/V3|（V4 随 S4 退场）")
})

// ── ⑧ 基线反证（T-VS32 ②——V4 段随 S4 退役，仅留基线机制反证） ──────────────

slow("T-VS32 ② 反证：合成非空基线 ⇒ FAIL + 退出码 1（fail-closed——入基线 = 例外 = 违规）", () => {
  mkdirSync(join(tmp, "test", "fixtures"), { recursive: true })
  const bfile = join(tmp, BASELINE_PATH)
  const entries = ["V2|docs/design/probe.md|五条|5|3|list", "V3|docs/batches/2026-09-11-probe.md"]
  writeFileSync(bfile, JSON.stringify({ entries }), "utf8") // 合成非空基线（临时夹具域——真仓基线零触碰）
  const blocked = spawnSync(process.execPath, [join(MERGED, "scripts", "check-doc-width.mjs")], { cwd: tmp, encoding: "utf8" })
  assert.equal(blocked.status, 1, "非空基线 ⇒ 退出码 1（fail-closed）" + blocked.stdout + blocked.stderr)
  assert.ok(blocked.stdout.includes("FAIL(基线)"), "FAIL(基线) 面在位")
  assert.ok(blocked.stdout.includes("**本基线必须保持为空**"), "固定句「本基线必须保持为空」在位")
  assert.ok(blocked.stdout.includes("新增违规 0 条"), "零新增违规下仍阻断（归因 = 基线非空本身）")
  assert.ok(entries.every((k) => blocked.stdout.includes(k)), "条目录入报告（可溯）")
  // 用后复原夹具：entries 清空 → 同夹具复跑 → 退出码 0（复原实证；真仓基线始终零触碰）
  writeFileSync(bfile, JSON.stringify({ entries: [] }), "utf8")
  const clean = spawnSync(process.execPath, [join(MERGED, "scripts", "check-doc-width.mjs")], { cwd: tmp, encoding: "utf8" })
  assert.equal(clean.status, 0, "夹具复原（entries 清空）⇒ 退出码 0" + clean.stdout + clean.stderr)
})

// ── ⑦ 宽度表格行豁免（群 A 批 A8——检查器契约附则） ──────────────────────
test("T-MA8-1 正常/边界：>300 表格行零报 / >300 非表格行照报（谓词单源）", () => {
  const row = "| 表格列 | " + "x".repeat(300) + " |" // 311 字符——表格行结构性不可折行 → 豁免
  const plain = "y".repeat(320) // 320 字符——正文非表格行 → 照报
  writeDoc("width-probe.md", ["# 宽度探针", "", row, "", plain, ""].join("\n"))
  const hits = checkDocWidths(tmp, { dir: SCAN_DIRS[0] })
  assert.deepStrictEqual(hits.map((h) => ({ line: h.line, len: h.len })), [{ line: 5, len: 320 }],
    "恰报非表格行 :5（320）——表格行 :3（311）零报")
})

test("T-MA8-2 边界（静态）：主流程零内联 width 扫描（判据单源 checkDocWidths）+ 规则 6 子串在位", () => {
  const src = readFileSync(join(MERGED, "scripts", "check-doc-width.mjs"), "utf8")
  assert.ok(src.includes("const widthHits = checkDocWidths(root, { max: maxW, dir: dirArg, domain: domainArg })"),
    "主流程经单源入口（零内联重复扫描）")
  assert.ok(!/length\s*>\s*maxW/.test(src.slice(src.indexOf("const isMain"))),
    "主流程零内联 `length > maxW` 扫描")
  assert.ok(/if \(l\.length > max && !isTableRow\(l\)\)/.test(src), "豁免谓词落在判据行（单源定义）")
})
