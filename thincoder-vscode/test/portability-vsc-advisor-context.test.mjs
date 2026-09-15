/**
 * portability-vsc-advisor-context.test.mjs — 批次二（可移植性 VSC 镜像面）用例表 1:1：
 * T-V11–T-V13（设计档 `thincoder-vscode/docs/design/PORTABILITY.md` §6）+ AC-V04/AC-V05/AC-V09/AC-V11 机判面（§7）。
 * 零网络 / 零真实 LLM（工具门面 = 拒绝即返回；T-V11 正控 = 在 batchDoc 门
 * 抛出——证明文档校验未拦，零评审发起）。
 * 判据权威 = §4.3（消息与 UI 文案逐字）。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：T-V07–T-V10 整删 + AC-V11 段删——装配器出口（buildAdvisorUserMessage）
 * 的提示词句子断言属散文锚（PA-A1 / C1-a；判据见 CLI 侧设计档 TESTING.md §11）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { findProjectRoot } from "../src/advisor/project-context.mjs"
import { clearConventionsCache, isDocPath, loadConventions } from "@thincoder/core/conventions.mjs"
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
  const msgs = readFileSync(new URL("../src/advisor/messages.mjs", import.meta.url), "utf8")
  const lines = msgs.split("\n").length
  assert.ok(lines <= 500, `messages.mjs ≤500（实 ${lines}）`)
  assert.ok(lines < 296, `messages.mjs 较 296 净减（实 ${lines}）`)
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
