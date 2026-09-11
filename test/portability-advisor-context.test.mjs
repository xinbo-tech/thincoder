/**
 * portability-advisor-context.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面③
 * 用例表 T-10–T-12（PO-1/PO-2/P8 注入与降级）+ T-20（PO-4–PO-7 六档提示词编辑面）。
 *
 * 断言对象 = src/advisor/project-context.mjs（拆分兑现 + 声明优先 + 降级句）+
 * src/advisor/messages.mjs 接线 + 六档提示词（AC-06 机检面：指令性自指 = 0、
 * check-doc-width 零指涉；红线锚句由既有 prompts-* 测试承载）。
 * 全离线：临时项目目录 + 直接调用消息构建（无网络、无子代理）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { buildAdvisorUserMessage } from "../src/advisor/messages.mjs"
import { clearConventionsCache } from "../src/conventions.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")

// §4.4 逐字降级句（本档为机器断言副本——设计档 §4.4 为内容权威源）
const NO_DOC_MAP = "(No document map found under the project root, and none is declared — the Document ownership criterion is degraded: check placement against the Project Guide where present, and state the limitation in your findings.)"
const NO_STANDARDS = "(No project standards document was declared — judge methodology compliance from the Project Guide (when present) and the review criteria above; state the limitation in your findings.)"
const NO_GIT = "(No git repository detected — change-set context is unavailable; read the review-scope files directly.)"

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-ctx-"))
  mkdirSync(join(tmp, "docs", "design"), { recursive: true })
  writeFileSync(join(tmp, "docs", "design", "X.md"), "# Design X\n")
  clearConventionsCache()
})
async function rmTmp(dir) {
  for (let i = 0; ; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { if (i >= 10) return; await new Promise((r) => setTimeout(r, 100)) }
  }
}
afterEach(async () => {
  clearConventionsCache()
  await rmTmp(tmp)
})

const agent = (over = {}) => ({
  cwd: tmp, provider: { name: "deepseek", model: "deepseek-chat" },
  config: { agent: { engineering: true } }, history: [], _advisorRound: 0, ...over,
})
const buildDesign = (a = agent()) =>
  buildAdvisorUserMessage(a, null, "design", "tok-1", ["docs/design/X.md"], null, null, "did-1")

test("T-10 正常（注入）：有 AGENTS.md + docs/README.md → 指南 + 地图注入保持", () => {
  writeFileSync(join(tmp, "AGENTS.md"), "# Project Guide\nGUIDE-BODY\n")
  writeFileSync(join(tmp, "docs", "README.md"), "# Document Map\nMAP-BODY\n")
  const msg = buildDesign()
  assert.ok(msg.includes("## Project Guide (AGENTS.md)") && msg.includes("GUIDE-BODY"), "指南注入")
  assert.ok(msg.includes("## Document Map") && msg.includes("MAP-BODY"), "地图注入")
  assert.ok(!msg.includes(NO_DOC_MAP), "有地图 → 无降级句")
})

test("T-11 边界（缺料）：无地图/无标准文档 → 两条降级句在场；Read METHODOLOGY.md 零命中", () => {
  const msg = buildDesign()
  assert.ok(msg.includes(NO_DOC_MAP), "文档地图降级句在场（逐字）")
  assert.ok(msg.includes(NO_STANDARDS), "标准文档降级句在场（逐字）")
  assert.ok(msg.includes(NO_GIT), "无 git 降级句在场（逐字）")
  assert.ok(!msg.includes("Read METHODOLOGY.md"), "旧指令句零命中")
  assert.ok(!msg.includes("## Project Methodology"), "旧注入节零残留")
})

test("T-12 正常（声明）：advisor.docMap 指向自定义路径 → 声明优先于探测", () => {
  writeFileSync(join(tmp, "docs", "README.md"), "# Built-in Map\nBUILTIN-BODY\n")
  writeFileSync(join(tmp, "OWN-MAP.md"), "# Declared Map\nDECLARED-BODY\n")
  mkdirSync(join(tmp, ".thincoder"), { recursive: true })
  writeFileSync(join(tmp, ".thincoder", "conventions.json"), JSON.stringify({ advisor: { docMap: "OWN-MAP.md" } }))
  clearConventionsCache()
  const msg = buildDesign()
  assert.ok(msg.includes("DECLARED-BODY"), "注入声明路径")
  assert.ok(!msg.includes("BUILTIN-BODY"), "探测路径被声明覆盖")
  // 声明存在但文件缺失 → 走降级句（不静默）
  writeFileSync(join(tmp, ".thincoder", "conventions.json"), JSON.stringify({ advisor: { docMap: "missing/MAP.md" } }))
  clearConventionsCache()
  assert.ok(buildDesign().includes(NO_DOC_MAP), "声明路径找不到 → 降级句")
  // 标准文档声明 → 注入 ## Project Standards（两处注入点同源）
  writeFileSync(join(tmp, "STANDARDS.md"), "# Standards\nSTD-BODY\n")
  writeFileSync(join(tmp, ".thincoder", "conventions.json"), JSON.stringify({ advisor: { standardsDoc: "STANDARDS.md" } }))
  clearConventionsCache()
  assert.ok(buildDesign().includes("STD-BODY"), "设计路径注入标准文档")
  const codeMsg = buildAdvisorUserMessage(agent(), null, "code", null, null, ["OWN-MAP.md"], null, null)
  assert.ok(codeMsg.includes("STD-BODY"), "代码/收敛路径注入标准文档")
  assert.ok(codeMsg.includes("## Project Standards"), "统一节名")
})

// ─────────────────────────────────────────────────────────────────────────────
// T-20：六档提示词编辑面（AC-06 机检面——通用化句在场 + 自指清零 + 红线锚）
// ─────────────────────────────────────────────────────────────────────────────
const SIX = [
  "src/prompts/discipline-engineering.md",
  "docs/design/prompts/discipline-engineering.md",
  "src/prompts/advisor-design.md",
  "docs/design/prompts/advisor-design.md",
  "src/prompts/persona-eng-designer.md",
  "docs/design/prompts/persona-eng-designer.md",
]

test("T-20 正常（提示词）：通用化句在场；指令性自指=0（标注形态除外）；check-doc-width 全删", () => {
  const general = {
    "src/prompts/discipline-engineering.md": ["落点按项目文档约定", "本产品自研仓 = docs/design/<TOPIC>.md", "查项目文档地图"],
    "docs/design/prompts/discipline-engineering.md": ["落点按项目文档约定", "本产品自研仓 = docs/design/<TOPIC>.md", "项目自身的流程文件"],
    "src/prompts/advisor-design.md": ["(per the project's document map, when the review context provides one)", "Tier authority: the code-structure criteria stated in this bullet.", "(e.g. `path/to/file.md:42`)", "do not assume any particular project files"],
    "docs/design/prompts/advisor-design.md": ["（按项目文档地图——当评审上下文提供时）", "档位权威 = 本条目陈述的代码结构判据。", "（如 `path/to/file.md:42`）", "不假定任何具体项目文件"],
    "src/prompts/persona-eng-designer.md": ["Your write domain = the project's requirements/design documents", "记录 + 状态推进 + 物理落笔", "不触碰项目台账档"],
    "docs/design/prompts/persona-eng-designer.md": ["写域 = 项目的需求档 / 设计档", "todo 状态推进（记录 + 状态推进 + 物理落笔）归主 agent"],
  }
  for (const f of SIX) {
    const text = read(f)
    for (const s of general[f]) assert.ok(text.includes(s), `${f}: 通用化句缺失: ${s}`)
    assert.ok(!text.includes("check-doc-width"), `${f}: 自指脚本零指涉（P7 全删）`)
    // AC-06：指令性自指 = 0——「本产品自研仓 =」示例标注形态除外
    const offenders = text.split("\n").filter((l) =>
      (l.includes("docs/README.md") || l.includes("docs/design/<TOPIC>.md")) && !l.includes("本产品自研仓"))
    assert.deepEqual(offenders, [], `${f}: 未标注的本仓指涉残留`)
  }
  // 红线锚句（代表性子集——全量由 prompts-async-guidance / prompts-dual-source 承载）
  const de = read("src/prompts/discipline-engineering.md")
  for (const anchor of [
    "**六段自写 · 一段一作者**", "batch_segment({segment, text})", "**执行者拒收**",
    "Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane).",
    "Task sizing is NOT your call", "**Credential values stay out of documents**",
  ]) assert.ok(de.includes(anchor), `红线锚句缺失: ${anchor}`)
  const rd = read("src/prompts/advisor-design.md")
  assert.ok(rd.includes("`VERDICT: pass` or `VERDICT: changes-required`"), "advisor 裁决行锚缺失")
  assert.ok(rd.includes("the designId must be the LAST thing you output"), "designId 末字节锚缺失")
})
