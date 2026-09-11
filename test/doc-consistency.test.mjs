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
 *   ⑤ 防回潮静态锚族（T75/T76——2026-09-11 TEST-LIFECYCLE 扫① 收归：退役文件/退役串零残留，
 *      原档删段；逐条清单见批次档 §5——跨档收归，接收后原档断言删除、保护逐年驻此）。
 * 纯文件读取 + 字符串/结构判——零网络、零 git、快层直跑。
 */
import { test, beforeEach, afterEach, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs"
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

/* ─── 第 13 批（T72–T74——文档机制边界与拆分；ENGINEERING-MODE.md §2.26） ─── */

test("T72 正常/反证：跨仓引用——带 .md 形态 fail-closed 报 unknown-doc；规范形态零命中（B/AC53）", () => {
  writeDoc("cross-repo.md", [
    "# 跨仓引用夹具",
    "",
    "带 .md 的跨仓形态：见 WEBVIEW.md §5 展开说明。", // 反证：必报 unknown-doc（防未来静默放开）
    "",
    "规范形态：见 WEBVIEW（VSC 仓）§5 展开说明。", // 规范：V1 域外——零命中
  ].join("\n"))
  const refs = checkSectionRefs(tmp).map((r) => `${r.ref}|${r.reason}`)
  assert.ok(refs.includes("WEBVIEW.md §5|unknown-doc"), "带 .md 跨仓形态如实报（fail-closed 钉住）")
  assert.equal(refs.length, 1, "规范形态零命中（仅反证行一条）")
  // 规范文本在位（`docs/README.md` §3.7——B 落笔面；检查器零改）
  const readme = readFileSync(join(REPO, "docs", "README.md"), "utf8")
  for (const sub of ["跨仓引用形态", "名称（仓别）§N", "去路径前缀"]) {
    assert.ok(readme.includes(sub), `§3.7 规范子串缺失: ${sub}`)
  }
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

test("T74 边界：宽度扫描单源（主流程调用 checkDocWidths；内联重复零残留——C/AC54）", () => {
  const src = readFileSync(join(REPO, "scripts", "check-doc-width.mjs"), "utf8")
  assert.ok(src.includes("checkDocWidths(root, { max: maxW, dir: dirArg })"), "主流程调用 checkDocWidths（单源）")
  assert.equal((src.match(/\.length > max/g) ?? []).length, 1, "宽度比较单点（checkDocWidths 内）")
  assert.ok(!/\.length > maxW/.test(src), "内联宽度扫描零残留（防两处规则漂移）")
  assert.ok(src.includes("表格行豁免"), "头注/实现含豁免注记（§2.26.2）")
})

/* ─── 防回潮静态锚族（2026-09-11 TEST-LIFECYCLE 扫① 收归；原档删段）──────────────────
 * 退役态（退役提示词文件 / 旧句 / 旧节）不得复活——逐字零残留扫描（fail-on-reappear）。
 * 收归来源六档（prompts-async-guidance / prompts-dual-source / prompts-normal-audit /
 * eng-designer-role / verify-redesign / ledger——逐条清单见批次档 §5）。条目形态
 * { files, forbidden }（路径相对工作区根 WS）；forbidden = string（includes）/ RegExp；
 * 可选 section: [起, 止] = 段落作用域（全档含合法历史引用时切片判——防假阳）。 */
const WS = resolve(REPO, "..")
const readWs = (rel) => readFileSync(resolve(WS, rel), "utf8")
/* 退役提示词文件（原 async-guidance AC-2 + eng-designer-role T32 对照断言） */
const RETIRED_PROMPT_FILES = ["system.md", "engineering.md", "engineering-sub.md", "main.md", "discipline.md", "methodology-template.md", "eng-coder.md", "explore.md", "coder.md", "plan.md"]
const PE_2 = ["thincoder/src/prompts/persona-engineering.md", "thincoder/docs/design/prompts/persona-engineering.md"]
const DE_2 = ["thincoder/src/prompts/discipline-engineering.md", "thincoder/docs/design/prompts/discipline-engineering.md"]
const DN_2 = ["thincoder/src/prompts/discipline-normal.md", "thincoder/docs/design/prompts/discipline-normal.md"]
const ledgerClosure7 = ["thincoder/docs/requirements/ENGINEERING-MODE.md", "thincoder/docs/TODO.md", "thincoder-vscode/docs/TODO.md", "thincoder/src/prompts/persona-eng-designer.md", "thincoder/docs/design/prompts/persona-eng-designer.md", "thincoder-vscode/src/prompts/persona-eng-designer.md", "thincoder-vscode/docs/design/prompts/persona-eng-designer.md"]
const RETIRED_STRINGS = [
  { files: [...PE_2, ...DE_2, ...DN_2], forbidden: ["恰好三选一", "exactly three values"] }, // 旧三值句（T-RO5）
  { files: PE_2, forbidden: ["（发起权在用户）→ 用户批准", "(initiation stays with the user) → user approval"] }, // 旧相邻形态（T-RO6）
  { files: [...DE_2, ...DN_2], forbidden: [ // 旧源清零（T-CL4；去重 async-guidance / NA4）
    "Check the tool table before any search", "任何搜索前先查工具表", "Tool routing", "工具路由", "Codebase exploration order",
    "代码库探索顺序", "Environment state", "环境状态", "MCP tools", "MCP 工具"] },
  { files: DE_2, forbidden: ["实现后验收标准逐条勾销"] }, // 旧勾销句（AC61）
  { files: PE_2, forbidden: ["ARCHITECT", "You design and delegate", "你是架构师", "需求文档 + 设计文档（docs/），"] }, // 旧身份句（AC23/AC24）
  { files: DE_2, forbidden: ["主会话即 designer"] },
  { files: ["thincoder/src/prompts/persona-eng-coder.md"], forbidden: ["The parent agent is the architect", "The parent agent provided a design document.", /architect/i] }, // coder 旧身份（AC64）
  { files: ["thincoder/docs/design/prompts/persona-eng-coder.md"], forbidden: ["父代理是架构师", "父代理提供了设计文档。", "架构师"] },
  { file: "thincoder/docs/design/ENGINEERING-MODE.md", section: ["### 2.8 错误与恢复", "### 2.9"], forbidden: ["父代理更新设计文档"] }, // T40 旧路由（历史引用在切片外）
  { files: ["thincoder/docs/README.md"], forbidden: ["过渡期主 agent 代行"] },
  { files: ["thincoder/AGENTS.md"], forbidden: ["主 agent·产品经理产物"] },
  { files: ["thincoder/src/prompts/persona-eng-coder.md", "thincoder/src/prompts/discipline-normal.md"], forbidden: ["runs syntax checks", "related tests via verify", "call `verify` in its default mode"] }, // 旧 verify 语义（T-V10）
  { files: DN_2, forbidden: ["§21"] }, // 悬空指针（T-NA3）
  { files: ["thincoder/docs/design/ESCALATE.md"], forbidden: ["同步旧路径", "同步语义零回归"] }, // 旧同步句（ESCALATE）
  { file: "thincoder/docs/design/AGENT-LOOP.md", section: ["### 14.2 飞刀（escalate）", "## 15. 操作纪律"], forbidden: [/async:false\s*显式同步保留/] },
  { files: ledgerClosure7, forbidden: ["状态推进 = eng-designer"] }, // 旧口径（T95——跨仓七档）
]
const hitsOf = (text, forbidden) => forbidden.filter((s) => (typeof s === "string" ? text.includes(s) : s.test(text)))

test("T75 防回潮（收归族）：退役提示词文件未复活（双源两面——原 async-guidance / eng-designer-role）", () => {
  for (const dir of ["src/prompts", "docs/design/prompts"]) {
    for (const f of RETIRED_PROMPT_FILES) assert.ok(!existsSync(join(REPO, ...dir.split("/"), f)), `${dir}/${f} 已退役——不应存在`)
  }
})

test("T76 防回潮（收归族）：退役串零残留（逐字扫描——收归六档，原档删段）", () => {
  let checks = 0
  for (const e of RETIRED_STRINGS) {
    for (const rel of e.files ?? [e.file]) {
      let text = readWs(rel)
      if (e.section) {
        const i = text.indexOf(e.section[0]), j = text.indexOf(e.section[1])
        assert.ok(i >= 0 && j > i, `${rel}: 段落切片锚缺失（${e.section[0]}）`)
        text = text.slice(i, j)
      }
      assert.deepStrictEqual(hitsOf(text, e.forbidden), [], `${rel}: 退役串残留`)
      checks += e.forbidden.length
    }
  }
  assert.ok(checks >= 40, "扫描面非空转（收归串全量在扫）")
  // 反证非空转（原 AC61 反证随迁）：同一判据谓词对含串样本必捕获（两分支探针——谓词失效即红）
  const probe = RETIRED_STRINGS[0].forbidden[0]
  assert.deepStrictEqual(hitsOf(`前缀·${probe}·后缀`, [probe]), [probe], "反证：字符串分支非空转")
  assert.deepStrictEqual(hitsOf("…architect…", [/architect/i]), [/architect/i], "反证：RegExp 分支非空转")
})
