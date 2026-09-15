/**
 * prompts-mirror-anchors.test.mjs — 提示词双源镜像锚测试（第 5 批 VSC-MIRROR · 面②）。
 *
 * 权威：ENGINEERING-MODE.md §2.22.2（镜像锚 A1–A12——文本类锚已退场）/ §2.22.7（双源结构 + 端特有段 + 镜像节引用）；
 * 验收：AC43（双源结构 + 端特有段）；用例 T62——其余（AC39 文本类锚面 / T65）已退场（2026-09-12 PROSE-ANCHOR-RETIRE；见下断言面）。
 *
 * 2026-09-13 单仓化（S5——设计档 TWO-REPO-MERGE.md §2.4 R10）：跨仓断言段退役（兄弟仓路径 /
 * 自指防护 / 跨仓读取与比对）；本端单仓版守卫 = ① 双源同名集合各 15 相等 + ② 本端镜像节引用
 * 可解析——**读取面限于本端文件**（零跨仓读取）。
 *
 * 2026-09-15 W2（`docs/batches/2026-09-15-vsc-core-wiring.md` §2 W2）：英文落地面 `src/prompts/`
 * 已删 ⇒ ① / T-DC16 的英文侧改指**核包**（`@thincoder/core/prompt-files.mjs` 单一解析面——
 * 契约 8：调用方不做路径运算）；中文权威面 `docs/design/prompts/` 原地保留（裁定 B——
 * 迁移期参照历史）⇒ 「双源」= 核包落地面 ↔ 本端中文镜像。
 *
 * 断言面（2026-09-12 PROSE-ANCHOR-RETIRE 后存留）：
 *   ① 双源同名集合各 15（核包 prompts/ 与 docs/design/prompts——落地 ↔ 镜像对位）；
 *   ② 本端镜像节引用不悬空（本端可解析，或以「（CLI 侧）」注记豁免——§2.22.7 V1 判据）；
 *   ③ 机制纪律锚串零维护者注（测试内常量面——T-TD3/T-TD4/T-TD7 残余）。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：原 A1–A12 文本类锚 / A8 工具描述 / 端特有段 / 同文组 / 公共层 /
 * A12 人格 / 角色重定义 / ⑨-1 / ⑨-2 及 ⑨-3 归属句循环整删·段删——读非测试档文本 = 散文锚
 *（判据见 CLI 侧设计档 TESTING.md §11）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PROMPTS_DIR as CORE_PROMPTS_DIR, loadSlot } from "@thincoder/core/prompt-files.mjs"

const VSC = join(dirname(fileURLToPath(import.meta.url)), "..")
const readVsc = (rel) => readFileSync(join(VSC, rel), "utf8")
const mdSet = (rel) => readdirSync(join(VSC, rel)).filter((f) => f.endsWith(".md")).sort()
/** 英文落地面 = 核包 `prompts/`（W2 改指——单一解析面导出的目录常量）。 */
const mdSetCore = () => readdirSync(CORE_PROMPTS_DIR).filter((f) => f.endsWith(".md")).sort()

test("③ 双源同名集合各 15（AC43/T62）", () => {
  assert.equal(mdSetCore().length, 15, `核包 prompts/: 应为 15 档（实 ${mdSetCore().length}）`)
  const mirror = mdSet("docs/design/prompts")
  assert.equal(mirror.length, 15, `docs/design/prompts: 本端应为 15 档（实 ${mirror.length}）`)
  assert.deepStrictEqual(mirror, mdSetCore(), "核包落地 ↔ 本端镜像同名集合相等")
})

test("⑤ 本端镜像节引用不悬空（本端可解析，或「（CLI 侧）」注记豁免——§2.22.7 V1 判据）", () => {
  const docs = []
  ;(function collect(dir) {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      if (n === "_archive") continue
      if (statSync(p).isDirectory()) collect(p)
      else if (n.endsWith(".md")) docs.push(p)
    }
  })(join(VSC, "docs"))
  const numsOf = (p) => {
    const s = new Set()
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = /^#{1,6}\s+(.*)$/.exec(line)
      if (!m) continue
      for (const re of [/^§?\s*(\d+(?:\.\d+)*)\b/, /§\s*(\d+(?:\.\d+)*)/]) {
        const a = re.exec(m[1])
        if (a) s.add(a[1])
      }
    }
    return s
  }
  const hasSection = (s, n) => s.has(n) || [...s].some((x) => x.startsWith(n + "."))
  const REF = /\[?([A-Za-z0-9_\-./]+\.md)\]?(?:\([^)\n]*\))?[^\S\n]*[（(【]?[^\S\n]*[:：]?[^\S\n]*§\s*(\d+(?:\.\d+)*)/g
  const dangling = []
  for (const f of mdSet("docs/design/prompts")) {
    const rel = "docs/design/prompts/" + f
    readVsc(rel).split("\n").forEach((line, i) => {
      REF.lastIndex = 0
      let m
      while ((m = REF.exec(line))) {
        const base = m[1].split("/").pop()
        const okVsc = docs.filter((p) => p.endsWith(base)).some((p) => hasSection(numsOf(p), m[2]))
        if (!okVsc && !line.includes("（CLI 侧）")) dangling.push(`${rel}:${i + 1} ${m[0]}`)
      }
    })
  }
  assert.deepStrictEqual(dangling, [], "镜像含悬空节引用（须本端可解析，或按 §2.22.7 标注「（CLI 侧）」）")
})

// ── ⑨ 机制纪律锚（残留面 = 锚串零维护者注——2026-09-12 PROSE-ANCHOR-RETIRE 后仅存测试内常量检查）──
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

test("⑨-3 正常+边界：pe 双源归属句 + 新增锚串零维护者注（T-TD3/T-TD4/T-TD7）", () => {
  const ALL = [...TD_DE, ...TD_DN_EN, ...TD_DN_ZH, TD_PE_EN, TD_PE_ZH, TD_C_EN, TD_C_ZH, TD_CNT]
  for (const s of ALL) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(s), `新增文本含维护者注: ${s.slice(0, 26)}…`)
})

// ── T-DC16（DOC-CODE-RECONCILE 批 · F20）：纪律条文 fail-when-unchanged 锚 ─────
// 锚类裁定 = `docs/design/DOC-CODE-RECONCILE.md` §7：本锚类 = **纪律条文 fail-when-unchanged 锚**
// （被锚文本 = 本批落笔的纪律行为面条文——代理运行期实际执行的条文；断言 = 其**逐字在位性**，脱字即红；
// **非退役散文锚类**——2026-09-12 PROSE-ANCHOR-RETIRE 删的 = 读非测试档文本的叙述性转述核对）。
// W2（2026-09-15）：本端英文落地面 `src/prompts/` 已删 ⇒ 被锚文本 = **运行期落地档 = 核包
// `prompts/discipline-engineering.md`**（本端装配实际执行面）；同节逐字同源断言退场——
// 核包 ↔ 中文镜像属**不同实现面**（多实现面纪律：语义同源、不做 byte-identical 硬一致），
// 镜像（`docs/design/prompts/`）为裁定 B 保留的参照历史、非运行期面。
const F20_LINES = [
  "6. **批 = 一次实现轮、各带自己的批次档**：一批 = 一次实现轮——每轮带**本批的批次档**（`batchDoc` = 本批的批次档）。",
  "7. **子代理只写本仓**：任何子代理（eng-designer / eng-coder）**只写本仓文件**——含本仓批次档里自己那一段；",
  "   写本仓之外的任何档（含代写、顺手改、路径指向本仓之外的写入）= **违规**。",
  "8. **需本仓之外的改动 = 停下上报**：本轮确需动本仓之外的档时，**停下报告**（改什么 / 为什么），",
  "   由主 agent **另起一轮处置**——不得在本轮落笔本仓之外。",
]
const F20_SECTION = "## 文档与台账自持（本仓记本仓的）"

/** 取「文档与台账自持」节正文（到下一个 `## ` 标题为止）。 */
function f20Section(text) {
  const lines = text.split("\n")
  const i = lines.indexOf(F20_SECTION)
  assert.ok(i >= 0, `节标题在位：${F20_SECTION}`)
  const j = lines.findIndex((l, k) => k > i && /^## /.test(l))
  return lines.slice(i + 1, j === -1 ? lines.length : j)
}

test("T-DC16 正常：F20 批轮次与写域纪律——运行期落地档（核包）同节逐字在位（脱字即红）+ 零维护者注", () => {
  const sec = f20Section(loadSlot("discipline-engineering.md"))
  const i = sec.indexOf(F20_LINES[0])
  assert.ok(i >= 0, "thincoder-core/prompts: F20 条 6 在位（删除 / 改写即行为面失守）")
  assert.deepStrictEqual(sec.slice(i, i + F20_LINES.length), F20_LINES, "thincoder-core/prompts: F20 三条逐字在位（fail-when-unchanged）")
  for (const s of F20_LINES) {
    assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(s), `锚文本零维护者注：${s.slice(0, 20)}…`)
    assert.ok(s.length <= 300, `行宽 ≤300：${s.length}`)
  }
})
