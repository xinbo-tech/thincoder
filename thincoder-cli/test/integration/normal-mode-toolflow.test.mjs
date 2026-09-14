/**
 * normal-mode-toolflow.test.mjs — 集成场景 ①（TESTING.md §5.1——普通模式完整工具流）：
 * 用户点名必选场景（F13），三态齐全。
 *
 * 业务语义：用户让 agent 改一个源码文件——agent 真跑一次完整循环（读档 → 改档 → lint →
 * verify 声明结果），产物落盘、验证关口给出放行/打回的机械判决。
 * 驱动 = 真 agent 循环（runAgent）+ 脚本化 provider（本地 mock）+ 临时工作区；断言只写
 * 业务可观察结果（磁盘内容 / verify 判决输出 / 完成守卫的顶回），不锁内部结构形状。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { runAgent, createAgent } from "@thincoder/core/agent.mjs"
import { builtinTools } from "@thincoder/core/tools/index.mjs"
import { mockLLM } from "../helpers/mock-llm.mjs"

/** 临时工作区（真 fs——集成场景不 mock 文件系统）。 */
function makeWorkspace(files) {
  const dir = mkdtempSync(join(tmpdir(), "tc-int-normal-"))
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), content)
  }
  return dir
}

/** 取某工具最近一次调用的结果文本（按 tool_call id 配对——不看内部结构，只看回执）。 */
function toolResultOf(agent, name) {
  const ids = new Set()
  for (const m of agent.history) {
    if (m.role !== "assistant" || !Array.isArray(m.tool_calls)) continue
    for (const tc of m.tool_calls) if (tc.function?.name === name) ids.add(tc.id)
  }
  return agent.history
    .filter((m) => m.role === "tool" && ids.has(m.tool_call_id))
    .map((m) => String(m.content))
    .join("\n---\n")
}

/** 真 agent 循环 + 脚本化 provider 跑一个业务场景；工作区与 mock 由 t.after 清理。 */
async function runScene(t, { files, script, prompt = "update the module", agentConfig = {} }) {
  const dir = makeWorkspace(files)
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  const mock = await mockLLM(script)
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const agent = createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: `http://127.0.0.1:${mock.port}/v1`, apiKey: "test-key" },
    tools: builtinTools,
    config: { agent: { maxTurns: 12, engineering: false, verifyGuard: false, ...agentConfig } },
    cwd: dir,
    memory: null,
  })
  const report = await runAgent(agent, prompt, { onPermissionRequest: async () => true })
  return { report, agent, dir, requests: mock.requests }
}

const call = (name, args) => ({ toolCall: { name, arguments: JSON.stringify(args) } })

test("① 正常：改源码 → lint → verify 声明 passed —— 文件已改、验证获准", async (t) => {
  const { report, agent, dir } = await runScene(t, {
    files: { "lib/math.mjs": "export const add = (a, b) => a + b\n" },
    script: [
      call("read", { path: "lib/math.mjs" }),
      call("edit", { path: "lib/math.mjs", old_string: "a + b", new_string: "a + b + 0" }),
      call("lint", { path: "lib/math.mjs" }),
      call("verify", { verification: { status: "passed", command: "node --check lib/math.mjs" } }),
      { content: "Updated lib/math.mjs and verified it (syntax check passed)." },
    ],
  })

  assert.equal(readFileSync(join(dir, "lib/math.mjs"), "utf8"), "export const add = (a, b) => a + b + 0\n", "目标文件真的被改了")
  assert.equal(agent._verifyPassed, true, "verify 认定 passed——完成获准")
  assert.match(toolResultOf(agent, "lint"), /Syntax OK/, "lint 真跑过并给出结果")
  assert.match(toolResultOf(agent, "verify"), /Verification declared passed/, "verify 回执确认声明已受理")
  assert.match(String(report), /verified/i, "交付报告含验证声明")
})

test("① 边界：doc-only 浅改 → verify 免声明快路径放行", async (t) => {
  const { agent, dir } = await runScene(t, {
    files: { "README.md": "# guide\n" },
    prompt: "append a note to the readme",
    script: [
      call("edit", { path: "README.md", old_string: "# guide", new_string: "# guide\n\nNew note.\n" }),
      call("verify", {}),
      { content: "README updated." },
    ],
  })

  assert.match(readFileSync(join(dir, "README.md"), "utf8"), /New note\./, "文档改动落盘")
  assert.equal(agent._verifyPassed, true, "doc-only 改动放行（不要求 verification 声明）")
  const out = toolResultOf(agent, "verify")
  assert.match(out, /Documentation-only changes/, "verify 走 doc-only 快路径")
  assert.doesNotMatch(out, /VERIFY BLOCKED/, "不触发打回")
})

test("① 错误：代码改动 + verify 声明 failed —— 打回且完成守卫持续顶回", async (t) => {
  const failing = { content: "Verification is failing — I cannot claim this work is done." }
  const { report, agent } = await runScene(t, {
    files: { "lib/math.mjs": "export const add = (a, b) => a + b\n" },
    agentConfig: { verifyGuard: true }, // 完成守卫开启：声称完成会被顶回
    script: [
      call("edit", { path: "lib/math.mjs", old_string: "a + b", new_string: "a + b + 0" }),
      call("verify", { verification: { status: "failed", summary: "syntax check failed" } }),
      failing, failing, failing, failing, failing, failing,
    ],
  })

  assert.equal(agent._verifyPassed, false, "verify 打回（旗位 false）")
  assert.match(toolResultOf(agent, "verify"), /VERIFY BLOCKED/, "打回回执带引导串")
  const pushbacks = agent.history.filter((m) => typeof m.content === "string" && m.content.includes("verify was not passed"))
  assert.ok(pushbacks.length >= 1, "模型声称完成时被顶回——不得静默收尾")
  assert.match(String(report), /cannot claim this work is done/, "最终报告如实声明未完成（未伪称完成）")
})
