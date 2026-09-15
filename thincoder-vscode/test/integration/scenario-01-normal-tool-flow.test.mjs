/**
 * scenario-01-normal-tool-flow.test.mjs — 集成场景 ①「普通模式完整工具流」VSC 实例（用户点名必选）。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = 扩展侧 agent 循环直驱（vscode-mock
 * + 本端 provider 缝））；共享语义源 = CLI 侧 `docs/design/TESTING.md` §5.1。
 *
 * 三态：
 *   正常 —— 真 agent 循环 + 脚本化 provider + 临时工作区：改档 → verify{passed} → 完成；
 *   边界 —— doc-only 浅改（.md）→ verify 未声明也放行（文档改动无验证可跑）；
 *   错误 —— 代码改动 + verify{failed} → 打回（旗位 false + 引导串）——不得声称完成。
 *
 * 判定探针（口径内，§4.5）：`_verifyPassed` = verify 关口机械判定旗位——本场景以其判定值
 * 断言"放行/打回"业务结果（机验不挂输出串：文案随模型措辞漂移）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runAgent } from "../../src/agent.mjs"
import { _setConfigPathForTest } from "../../src/config-io.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

let work
let cfgDir

before(() => {
  work = mkdtempSync(join(tmpdir(), "tc-integ-flow-"))
  cfgDir = mkdtempSync(join(tmpdir(), "tc-integ-flow-cfg-"))
  // 环境隔离：配置指向临时空配置（不读真实用户配置——集成档确定性）
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
  rmSync(work, { recursive: true, force: true })
  rmSync(cfgDir, { recursive: true, force: true })
})

/** 跑一个完整回合（真 agent 循环；AUTO 档 = 工具免逐项审批——面板 AUTO 语义）。 */
async function runTurn(llm, input) {
  const opts = { depth: 0, history: [], fullHistory: [] }
  const result = await runAgent(providerFor(llm), work, input, {}, undefined, true, opts)
  return { result, agent: opts.agent, history: opts.history }
}

/** history 里某工具最近一条结果（模型可见面）。 */
function toolResult(history, name) {
  const toolIds = new Set()
  for (const m of history) if (m.role === "assistant" && m.tool_calls) for (const tc of m.tool_calls) if (tc.function?.name === name) toolIds.add(tc.id)
  const hit = history.filter((m) => m.role === "tool" && toolIds.has(m.tool_call_id)).at(-1)
  return hit ? String(hit.content) : ""
}

test("① 正常：读档 → 改档 → 验证 → verify{passed}——文件真的被改、verify 认定通过", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "hello.mjs", content: "export const hello = 'integration'\n" } } },
    { toolCall: { name: "verify", arguments: { verification: { status: "passed", summary: "写了文件并核对了内容" } } } },
    { content: "完成了：hello.mjs 已写入，verify 通过。" },
  ])
  try {
    const { result, agent, history } = await runTurn(llm, "创建 hello.mjs")
    assert.equal(readFileSync(join(work, "hello.mjs"), "utf8"), "export const hello = 'integration'\n", "目标文件真的被改（业务产物）")
    assert.match(toolResult(history, "verify"), /Verification declared passed/, "verify 放行串（模型可见的验证声明）——W9 起文案随核实现")
    assert.equal(agent._verifyPassed, true, "verify 判定旗位 = 通过")
    assert.match(result, /hello\.mjs 已写入/, "回合正常收尾返回模型答复")
    assert.ok(llm.calls >= 3, `脚本化 provider 被调满三轮（实到 ${llm.calls}）`)
  } finally {
    await llm.close()
  }
})

test("① 边界：doc-only 浅改（.md）→ 未声明 verification 也放行（文档改动无验证可跑）", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "notes.md", content: "# 会议记录\n" } } },
    { toolCall: { name: "verify", arguments: {} } },
    { content: "文档已更新。" },
  ])
  try {
    const { agent, history } = await runTurn(llm, "记一条会议笔记")
    assert.equal(readFileSync(join(work, "notes.md"), "utf8"), "# 会议记录\n", "文档真的被写")
    assert.match(toolResult(history, "verify"), /Documentation-only changes/, "doc-only 快路径放行串（W9 起文案随核实现）")
    assert.equal(agent._verifyPassed, true, "放行旗位（未声明也放行）")
  } finally {
    await llm.close()
  }
})

test("① 错误：代码改动 + verification{failed} → verify 打回（拒绝串 + 重试提醒——不得声称完成）", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "app.js", content: "export const answer = 42\n" } } },
    { toolCall: { name: "verify", arguments: { verification: { status: "failed", summary: "自检未过" } } } },
    { content: "我先停在这里。" },
  ])
  try {
    const { agent, history } = await runTurn(llm, "写个 app.js")
    const out = toolResult(history, "verify")
    assert.match(out, /VERIFY BLOCKED/, "打回报告（模型可见）——W9 起文案随核实现")
    assert.match(out, /declared verification failed/, "修复引导串（核文案）")
    assert.ok(existsSync(join(work, "app.js")), "改动本身在盘（打回不等于回滚）")
    // 回合不得因该打回而无感完成：守卫注入重试提醒（机械「不得声称完成」）
    const reminder = history.find((m) => m?.role === "user" && /verify was not passed/.test(String(m.content)))
    assert.ok(reminder, "重试提醒注入（打回后不得静默收尾）")
    assert.match(String(reminder.content), /\(retry 1\/3\)/, "提醒带重试计数")
    assert.ok((agent._verifyRetries ?? 0) >= 1, "打回已计数（判定旗位不复位为通过）")
    assert.notEqual(agent._verifyPassed, true, "旗位绝不为「通过」")
  } finally {
    await llm.close()
  }
})

// W9（2026-09-15 审计修正轮-1）：载体镜像回填——goal 工具**原地**改状态也要推 onGoal（面板面）。
// 反证：原「引用不等」守卫在 `_goal === goal` 同引用下恒假 ⇒ 终态词（done）不可达（审计 finding #2）。
test("① 正常：goal set→complete——载体镜像回填推 onGoal（active → done）+ _goal 单源原地更新", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "goal", arguments: { action: "set", objective: "把 hello.mjs 写出来", criteria: "文件在盘且内容逐字" } } },
    { toolCall: { name: "goal", arguments: { action: "complete" } } },
    { content: "YES — 文件已在盘，凭据成立。" }, // 核 goal 独立判决支路（depth 0 + history>2）的模型回包
    { content: "目标完成。" },
  ])
  try {
    const goals = []
    const opts = { depth: 0, history: [], fullHistory: [] }
    await runAgent(providerFor(llm), work, "立目标并完成", { onGoal: (g) => goals.push(g) }, undefined, true, opts)
    assert.deepEqual(goals[0], { status: "active", objective: "把 hello.mjs 写出来", criteria: "文件在盘且内容逐字" }, "set 后推面板（active）")
    assert.equal(goals.at(-1)?.status, "done", "complete 后推面板终态词（核 complete → 面板 done）")
    assert.equal(goals.at(-1)?.objective, "把 hello.mjs 写出来", "终态带回 objective")
    assert.equal(opts.agent._goal?.status, "complete", "本端载体 _goal 同对象原地更新（槽持久化面读它）")
    assert.match(toolResult(opts.history, "goal"), /Goal verified complete/, "工具面：核 goal 完成句")
  } finally {
    await llm.close()
  }
})
