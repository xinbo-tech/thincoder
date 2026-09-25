/**
 * prompts-dual-source.test.mjs — prompts 双源结构机检（第 13 批 D-2——自同目录 async 引导测试档
 * **逐字迁出**；拆法见 ENGINEERING-MODE.md §2.26.3）。
 *
 * 2026-09-12 散文锚退役批（PROSE-ANCHOR-RETIRE）：原双源「锚句/子串驻留」断言族（第 2 / 9 / 15 / 16 /
 * 23 批锚与 TD 锚组的驻留断言 17 例）整删——判据见 `docs/core/design/TESTING.md` §11.1（读非测试档断言
 * 句子在场/缺席 = 散文锚）。
 * 保留面 = 结构机检（AC21 双源槽文件存在性 + 头注格式；T-CL1 ## 块计数；T-RO6 / T-TD3–T-TD4
 * 锚串零维护者注反证）。
 * 头部自持（零跨档 import——D-2 契约）：imports + read/exists 助手 + 语料读取 + NEW_PROMPTS 常量。
 * 纯文件读取 + 字符串匹配——快层 glob 自动发现直跑。
 *
 * U2（CORE-UNIFICATION §2.6.3）：英文落地面已随迁移改指核包（`thincoder-core/prompts/`——
 * `src/prompts/` 已删；中文权威面 `docs/core/design/prompts/` 原地保留，裁定 B）——本档面内改判。
 *
 * 并档注（2026-09-11 TEST-LIFECYCLE 扫①——设计档 TESTING.md §7.2 #2）：原 prompts-normal-audit.test.mjs
 * 并入（源档随并删除）；并入条款锚族已随 2026-09-12 散文锚退役批整删。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")
const exists = (rel) => existsSync(join(__here, "..", rel))
// U2：英文落地权威位 = 核包（`thincoder-cli/../thincoder-core/prompts/`）。
const readCore = (name) => read(`../thincoder-core/prompts/${name}`)
const existsCore = (name) => exists(`../thincoder-core/prompts/${name}`)

// 新 15 文件全集（PROMPT-SYSTEM §2 命名法——AC21 断言面：designer 档须在册）
const NEW_PROMPTS = [
  "persona-engineering.md", "persona-normal.md", "persona-eng-coder.md", "persona-eng-designer.md",
  "persona-explore.md", "persona-coder.md", "persona-plan.md",
  "common.md", "discipline-engineering.md", "discipline-normal.md",
  "consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md",
]
// ─────────────────────────────────────────────────────────────────────────────
// 第 2 批锚（ENGINEERING-MODE §2.15/§2.16/§2.19）：AC21 双源槽文件存在性 + 头注格式
// （其余锚族已随 2026-09-12 散文锚退役批整删）。
// ─────────────────────────────────────────────────────────────────────────────
const pdes = readCore("persona-eng-designer.md")
const pdesZh = read("../docs/core/design/prompts/persona-eng-designer.md")

test("AC21 新槽文件双源齐备 + 已入 NEW_PROMPTS（首行头注合格式——漏入则格式/宽行断言不覆盖）", () => {
  assert.ok(NEW_PROMPTS.includes("persona-eng-designer.md"), "已入 NEW_PROMPTS（15 文件全集）")
  assert.ok(existsCore("persona-eng-designer.md"), "英文落地位（核包）")
  assert.ok(exists("../docs/core/design/prompts/persona-eng-designer.md"), "中文权威位")
  assert.match(pdes.split("\n")[0], /^<!-- slot:\[1\] consumers:\[.+\] -->$/, "英文落地头注格式")
  assert.match(pdesZh.split("\n")[0], /^<!-- 槽位:\[1\] 消费方:\[.+\] -->$/, "中文权威头注格式")
})

// ─────────────────────────────────────────────────────────────────────────────
// 第 9 批锚（PROMPT-REVIEW-ORDER——ADVISOR-CONVERGENCE §13）：保留 T-RO6（时序文本零维护者注反证）。
// 驻留断言族（T-RO1–T-RO4）已随 2026-09-12 散文锚退役批整删。
// ─────────────────────────────────────────────────────────────────────────────
const ROPE_CHAIN = ["评审 pass 后逐条裁决", "修正轮落地并经核验"]
const ROPE_LABEL = "**修正轮 ⇄ 用户批准 时序**"
const ROPE_BULLET = [
  "- **修正轮 ⇄ 用户批准 时序**（评审后）：评审 pass 后你逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），",
  "  **修正轮落地并经你核验后，才可请求用户批准**；修正轮在途时**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。",
  "  **修正轮边界**：只落评审发现与你的裁决直接导出的修正——**不得夹带新语义/新范围**；夹带即新内容，",
  "  须显式摆给用户单独定，不得随批准请求一并默认通过。",
  "  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。",
].join("\n")

test("T-RO6 边界：时序文本零维护者注（§2.7 #15——旧三值句/旧相邻形态两负向锚收归接收档 T76）", () => {
  for (const lit of [...ROPE_CHAIN, ROPE_LABEL, ...ROPE_BULLET.split("\n")]) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(lit), `新增文本含维护者注: ${lit.slice(0, 26)}…`)
})

// ─────────────────────────────────────────────────────────────────────────────
// 第 15 批锚（PROMPT-SYSTEM 公共层扩容）：保留 T-CL1（## 块计数）。标题组 / 关键句 /
// C8 人格段与旧源清零驻留断言已随 2026-09-12 散文锚退役批整删。
// 2026-09-17 双面流程收正：中英不再同字面（翻译不是 cp）——「双源同一字面串」判据失效；
// 中文权威在核上级（docs/core/design/prompts/），CLI 仓旧副本已死——本测只验英文运行面块数。
// ─────────────────────────────────────────────────────────────────────────────
const commonEn = readCore("common.md")

// 计数口径（设计 §1.2）：14 节 = 内容项数；## 块 14（上行通道 + 工具观 + 工具路由表三节 + 文档体系评价 + 台账 + 批次档常识）

test("T-CL1 正常：common 英文运行面十四节（## 块数 14——上行通道 + 工具观 + 工具路由表 + 文档体系评价 + 台账 + 批次档常识）", () => {
  assert.equal(commonEn.split("\n").filter((l) => l.startsWith("## ")).length, 14, "thincoder-core（英文落地）: ## 块数应为 14")
})

// ─────────────────────────────────────────────────────────────────────────────
// TD 锚组（机制纪律提示词落地；设计 = PROMPT-SYSTEM §8.5）：
// T-TD1/T-TD2/T-TD6 驻留断言已随 2026-09-12 散文锚退役批整删；保留面 = T-TD3/T-TD4
// 锚串零维护者注反证（全文锚列表仍为本档常量）。
// ─────────────────────────────────────────────────────────────────────────────
const TD_DE = [
  "## 测试纪律（工程侧——寿命 / 门禁 / 归册）",
  "**单元测试 = 开发期工具**",
  "**不因单次改动而增补**",
  "**默认退役（删除）**",
  "三者全满足才转 ②③",
  "**退役是常态、保留须举证**",
  "**发布门 = 项目的完整验证链**",
  "**未归册而超阈 = 硬红**",
  "活文件只留**未决四态**",
  "`触发=认账不排期`",
  "行龄超 30 天标「老化」",
]
const TD_DN_EN = [
  "Code changes must be verified — unit tests are development-time tools",
  "Integration tests are project assets — never augmented per single change; the release gate is the project's full verification chain.",
]
const TD_DN_ZH = [
  "代码改动必须验证——单元测试是开发期工具",
  "集成测试是项目资产——不因单次改动而增补；发布门 = 项目的完整验证链。",
]
const TD_PE_EN = "- **The ledger is yours**: the requirement-pool / tech-backlog ledger (record + status advance + physical writes; subagents never declare ledger files in `files`)."
const TD_PE_ZH = "- **台账归你**：需求池 / 技术待办台账（记录 + 状态推进 + 物理落笔；子代理一律不在 `files` 声明台账档）。"
const TD_C_EN = "Add tests if the project has them — as unit tests"
const TD_C_ZH = "项目有测试就加测试——写单元测试"
const TD_CNT = "（计数口径 = 未决数——归档条目不计数）"

test("T-TD3/T-TD4 正常+边界：pe 双源归属句驻留 + 新增锚串零维护者注（全文锚；T-TD5 行宽机检 = check-doc-width 常驻）", () => {
  const ALL = [...TD_DE, ...TD_DN_EN, ...TD_DN_ZH, TD_PE_EN, TD_PE_ZH, TD_C_EN, TD_C_ZH, TD_CNT]
  for (const s of ALL) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(s), `新增文本含维护者注: ${s.slice(0, 26)}…`)
})
