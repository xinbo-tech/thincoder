/**
 * portability-vsc-advisor-context.test.mjs — 批次二（可移植性 VSC 镜像面）用例表 1:1：
 * T-V07–T-V13（设计档 `thincoder-vscode/docs/design/PORTABILITY.md` §6）+ AC-V04/AC-V05/AC-V09/AC-V11 机判面（§7）。
 * 零网络 / 零真实 LLM（消息构建面 = 纯函数直驱；工具门面 = 拒绝即返回；T-V11 正控 = 在 batchDoc 门
 * 抛出——证明文档校验未拦，零评审发起）。
 * 判据权威 = §3.3（注入面）/ §4.2（降级句逐字）/ §4.3（消息与 UI 文案逐字）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { buildAdvisorUserMessage } from "../src/advisor/messages.mjs"
import { NO_DOC_MAP_NOTICE, NO_GIT_NOTICE, NO_GUIDE_NOTICE, NO_STANDARDS_NOTICE, findProjectRoot } from "../src/advisor/project-context.mjs"
import { clearConventionsCache, isDocPath, loadConventions } from "../src/conventions.mjs"
import { advisorTool } from "../src/agent-tools/advisor.mjs"
import { engTool } from "../src/agent-tools/eng.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

const tmpDirs = []
after(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  clearConventionsCache()
  _setConfigPathForTest(null)
})

function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "pva-"))
  tmpDirs.push(dir)
  return dir
}
const write = (root, rel, content) => {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
/** 评审用 agent（无 git 依赖——findReviewRepos 在临时目录天然返回空）。 */
const mkAgent = (ws, over = {}) => ({ cwd: ws, history: [], config: { agent: { engineering: true } }, _provider: null, ...over })

// ─── T-V07：注入在场（VP-1 · VP-12 / AC-V04） ────────────────────────────────

test("T-V07 正常（注入）：有 AGENTS.md + docs/README.md → `## Project Guide (AGENTS.md)` 段 + 文档地图注入在场", () => {
  const ws = mkws()
  write(ws, "AGENTS.md", "# WS Guide\n\nThe requirements live under docs/.\n")
  write(ws, "docs/README.md", "# Doc Map\n\n- 板块 A → docs/design/A.md\n")
  write(ws, "docs/design/x.md", "# X\n")
  const msg = buildAdvisorUserMessage(mkAgent(ws), null, "design", null, ["docs/design/x.md"])
  assert.ok(msg.includes("## Project Guide (AGENTS.md)"), "Project Guide 段在场（VP-12 补缺落地）")
  assert.ok(msg.includes("# WS Guide") && msg.includes("The requirements live under docs/."), "AGENTS.md 正文注入")
  assert.ok(msg.includes("## Document Map"), "文档地图段在场")
  assert.ok(msg.includes("板块 A → docs/design/A.md"), "地图正文注入（探测回退 docs/README.md）")
  assert.ok(msg.includes("requirement fit"), "design 指令含 requirement-fit 检查项（guideRoot 真值路径）")
  // code 路径共用同一注入序列（guideRoot → 指令 2 + 附加判据）
  const codeMsg = buildAdvisorUserMessage(mkAgent(ws), null, "code", null, null, ["src/x.mjs"])
  assert.ok(codeMsg.includes("## Project Guide (AGENTS.md)"), "code 路径同样注入 Project Guide")
  assert.ok(
    codeMsg.includes("Additional criterion: **requirement fit** — does the implementation match what the requirements documents (referenced by the Project Guide above) actually ask for?"),
    "requirement-fit 附加判据逐字（guideRoot 真值）",
  )
  assert.ok(codeMsg.includes("2. The `## Project Guide (AGENTS.md)` section above maps the project"), "指令 2 = guide 分支句（旧 AGENTS.md 自探句退场）")
})

// ─── T-V08：缺料降级（VP-1 · VP-2 · VP-3 · VP-12 / AC-V04） ─────────────────

test("T-V08 边界（缺料）：无 AGENTS.md / 无地图 / 未声明标准文档 → 三条降级句在场；`Read METHODOLOGY.md` 零命中", () => {
  const ws = mkws()
  write(ws, "docs/design/x.md", "# X\n")
  const msg = buildAdvisorUserMessage(mkAgent(ws), null, "design", null, ["docs/design/x.md"])
  assert.ok(msg.includes(NO_GUIDE_NOTICE), "① 无指南降级句逐字（§4.2）")
  assert.ok(msg.includes(NO_DOC_MAP_NOTICE), "② 无文档地图降级句逐字（§4.2）")
  assert.ok(msg.includes(NO_STANDARDS_NOTICE), "③ 无标准文档降级句逐字（§4.2）")
  assert.ok(!/Read METHODOLOGY\.md/.test(msg), "`Read METHODOLOGY.md` 指令零命中（VP-3 反证）")
  assert.ok(!msg.includes("## Project Methodology"), "旧 METHODOLOGY 注入段零残留（空 catch 静默跳过已退役）")
  assert.ok(!msg.includes("does it follow the project's METHODOLOGY.md?"), "design 指令旧判据句零残留")
  assert.ok(msg.includes("methodology compliance (does it follow the project's standards as provided?)"), "新判据句逐字（§4.3）")
  const codeMsg = buildAdvisorUserMessage(mkAgent(ws), null, "code", null, null, ["src/x.mjs"])
  assert.ok(!codeMsg.includes("## Project Methodology (Engineering Mode)"), "code 路径旧注入段零残留")
  assert.ok(codeMsg.includes(NO_STANDARDS_NOTICE), "code 路径同走声明制降级句")
  assert.ok(codeMsg.includes("2. No AGENTS.md was found at the project root"), "指令 2 = 无指南分支句（guideRoot 假值）")
})

// ─── T-V09：声明优先（VP-1 · VP-2） ─────────────────────────────────────────

test("T-V09 正常（声明）：advisor.docMap / advisor.standardsDoc 指向自定义路径 → 声明文件注入（优先于探测）", () => {
  const ws = mkws()
  write(ws, "meta/guide.md", "GUIDE BODY (declared)\n")
  write(ws, "meta/standards.md", "STANDARDS BODY (declared)\n")
  write(ws, "docs/README.md", "# Probe Map (must NOT win)\n") // 探测面在场 → 声明优先反证
  write(ws, ".thincoder/conventions.json", JSON.stringify({ advisor: { docMap: "meta/guide.md", standardsDoc: "meta/standards.md" } }))
  write(ws, "docs/design/x.md", "# X\n")
  const msg = buildAdvisorUserMessage(mkAgent(ws), null, "design", null, ["docs/design/x.md"])
  assert.ok(msg.includes("GUIDE BODY (declared)"), "声明 docMap 注入")
  assert.ok(!msg.includes("Probe Map (must NOT win)"), "声明优先于探测（docs/README.md 未注入）")
  assert.ok(msg.includes("STANDARDS BODY (declared)"), "声明 standardsDoc 注入（仅在声明时）")
  assert.ok(!msg.includes(NO_DOC_MAP_NOTICE) && !msg.includes(NO_STANDARDS_NOTICE), "有声明 → 两条降级句均不在场")
})

// ─── T-V10：非 git 降级（VP-8 / AC-V05） ────────────────────────────────────

test("T-V10 正常（非 git）：临时目录（无 .git）跑设计评审消息构建 → NO_GIT_NOTICE 在场；评审照常", () => {
  const ws = mkws()
  write(ws, "docs/design/x.md", "# X\n")
  const msg = buildAdvisorUserMessage(mkAgent(ws), null, "design", null, ["docs/design/x.md"])
  assert.ok(msg.includes(NO_GIT_NOTICE), "无 git 降级句逐字在场（§4.2——原静默跳过）")
  assert.ok(msg.includes("## Documents to Review") && msg.includes("- docs/design/x.md — Read this file in full"), "评审内容照常构建")
  // 正控：有 git 的仓（本仓）→ 该句不在场
  const repoMsg = buildAdvisorUserMessage(mkAgent(process.cwd()), null, "design", null, ["docs/design/PORTABILITY.md"])
  assert.ok(!repoMsg.includes(NO_GIT_NOTICE), "正控：git 仓不报无 git 降级")
})

// ─── T-V11–T-V12：文档门禁校验（VP-10 / AC-V09） ────────────────────────────

test("T-V11 正常（校验）：design 评审传 documents=[\"docs/design/x.md\"] → 越过文档门禁（在 batchDoc 门抛出）；isDocPath 正控", async () => {
  const ws = mkws()
  write(ws, "docs/design/x.md", "# X\n")
  const agent = { cwd: ws, history: [], config: {}, _touchedFiles: [], _engDesignTokens: new Map() }
  const ctx = { agent, cwd: ws, depth: 0, callbacks: {}, signal: undefined }
  await assert.rejects(
    advisorTool.execute({ type: "design", documents: ["docs/design/x.md"], batchDoc: "no-such-batch-xyz.md" }, ctx),
    /batchDoc is not a readable file/,
    "有效文档列表未被文档门禁拦下（校验通过后才到达 batchDoc 门——零评审发起）",
  )
  const conv = loadConventions(ws)
  assert.equal(isDocPath("docs/design/x.md", conv), true, "isDocPath 正控")
  assert.equal(isDocPath("src/prompts/x.md", conv), false, "src/** 下 .md 非文档（判据换源反证）")
  assert.equal(isDocPath("packages/foo/src/x.md", conv), false, "嵌套布局同判（原 `docs/` 前缀判据退役后不再放行）")
})

test("T-V12 边界（校验）：传 [\"src/prompts/x.md\"] / [\"x.mjs\"] → 拒绝（非文档——`docs/` 前缀不再放行）", async () => {
  const ws = mkws()
  const agent = { cwd: ws, history: [], config: {}, _touchedFiles: [], _engDesignTokens: new Map() }
  const ctx = { agent, cwd: ws, depth: 0, callbacks: {}, signal: undefined }
  const r1 = await advisorTool.execute({ type: "design", documents: ["src/prompts/x.md"] }, ctx)
  assert.equal(r1, "Advisor: design review documents must be documentation files (per the project's conventions). Invalid: src/prompts/x.md", "拒绝文案逐字（§4.3）")
  const r2 = await advisorTool.execute({ type: "design", documents: ["x.mjs"] }, ctx)
  assert.equal(r2, "Advisor: design review documents must be documentation files (per the project's conventions). Invalid: x.mjs", "非文档扩展名同拒")
  assert.ok(!r1.includes("in docs/") && !r2.includes("in docs/"), "旧 `in docs/` 指路零残留（AC-V09）")
})

// ─── T-V13：文案面（VP-11 / AC-V09 · AC-V10） ──────────────────────────────

test("T-V13 错误（文案）：advisor 文档门禁拒绝 + eng 工具 enter —— 两条文案均无 `in docs/`；与 §4.3 逐字一致", async () => {
  const ws = mkws()
  const agent = { cwd: ws, history: [], config: {}, _touchedFiles: [], _engDesignTokens: new Map() }
  const refusal = await advisorTool.execute({ type: "design", documents: ["x.mjs"] }, { agent, cwd: ws, depth: 0, callbacks: {} })
  assert.ok(refusal.startsWith("Advisor: design review documents must be documentation files (per the project's conventions)."), "拒绝文案锚（§4.3）")
  assert.ok(!refusal.includes("in docs/"), "拒绝文案无 `in docs/`")
  // eng 工具 enter（config 写路径隔离——不动真实 ~/.thincoder/config.json）
  _setConfigPathForTest(join(ws, "config.json"))
  const engAgent = { config: {}, _engDesignTokens: new Map() }
  const engMsg = await engTool.execute({ action: "enter" }, { agent: engAgent, cwd: ws, callbacks: {} })
  assert.equal(
    engMsg,
    "Engineering mode activated. Design-before-code enforced: write a design document first (location per your project's document conventions), run advisor with type='design', get user approval, then implement via eng-coder subagents.",
    "eng enter 文案逐字（§4.3——尾段零改）",
  )
  assert.ok(!engMsg.includes("in docs/"), "eng 文案无 `in docs/`（AC-V09）")
})

// ─── AC-V11：拆分兑现 + 静态接线面 ─────────────────────────────────────────

test("AC-V11 拆分兑现：project-context.mjs 在位（四降级句 + 四导出）；messages.mjs ≤500 且较 296 净减；旧内联面零残留", () => {
  const pc = readFileSync(new URL("../src/advisor/project-context.mjs", import.meta.url), "utf8")
  for (const fn of ["findProjectRoot", "injectProjectGuide", "injectDocumentMap", "injectProjectStandards"]) {
    assert.ok(pc.includes(`export function ${fn}`), `project-context.mjs 导出 ${fn}`)
  }
  for (const n of ["NO_GUIDE_NOTICE", "NO_DOC_MAP_NOTICE", "NO_STANDARDS_NOTICE", "NO_GIT_NOTICE"]) {
    assert.ok(pc.includes(`export const ${n}`), `降级句常量导出 ${n}`)
  }
  const msgs = readFileSync(new URL("../src/advisor/messages.mjs", import.meta.url), "utf8")
  const lines = msgs.split("\n").length
  assert.ok(lines <= 500, `messages.mjs ≤500（实 ${lines}）`)
  assert.ok(lines < 296, `messages.mjs 较 296 净减（实 ${lines}）`)
  assert.ok(msgs.includes("injectProjectGuide(agent, parts, [...pathList, ...docList])"), "两路径共用注入点（design 早退前）")
  assert.ok(!msgs.includes("METHODOLOGY.md"), "旧 METHODOLOGY 探针零残留")
  // findProjectRoot 直驱（NEAREST 胜 + cwd 为界）
  const nested = join(ws2(), "pkg")
  write(nested, "AGENTS.md", "# pkg guide\n")
  write(nested, "src/x.mjs", "x\n")
  assert.equal(findProjectRoot(nested, ["src/x.mjs"]), nested, "范围文件向上走查命中最近 AGENTS.md")
})

/** 独立小工作区（AC-V11 的 findProjectRoot 直驱段）。 */
function ws2() {
  const d = mkws()
  write(d, "docs/keep.md", "x\n")
  return d
}
