/**
 * reasoning-echo-live.test.mjs — D-CC22 活体推入面回声恒带（#109 · 批档 §2.10 ① A-C12）。
 *
 * 缝式离线行为断言（零网络 · 零真机）：`_runAdvisorToolLoop` 的 `seams.chat` 覆写——循环对
 * 入参 `messages` **原位推入**，断言直读该数组（判据面 = advisor 站点推入的工具轮 assistant
 * 消息）。缝形态先例 = `thincoder-cli/test/advisor-context-budget.test.mjs:21-26`。
 *
 * 判据（§2.10 ① A-C12）：required 族缺 reasoning ⇒ 键在场且为 `""`；有值 ⇒ 逐字回传；
 * optional / 未声明族 ⇒ 键恒不存在。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { _runAdvisorToolLoop } from "../advisor/run.mjs"

const AGENT = { cwd: "C:/proj/echo", config: {} }
const ECHO_TOOL = { name: "echo", execute: async () => "ok" }
const TOOLS = { schemas: [], byName: new Map([[ECHO_TOOL.name, ECHO_TOOL]]) }
const CALL = [{ id: "c1", name: "echo", arguments: "{}" }]

/** 跑一次评审循环（脚本化 chat 缝 —— 首步工具调用、次步终稿），返回原位推入后的 messages。 */
async function runLoop(provider, steps) {
  const messages = [{ role: "user", content: "review the change" }]
  let i = 0
  const chat = async (p, opts) => {
    const step = steps[Math.min(i++, steps.length - 1)]
    if (step.text) opts.onToken(step.text)
    return { content: step.text ?? null, toolCalls: step.toolCalls ?? [], reasoning: step.reasoning }
  }
  await _runAdvisorToolLoop(provider, messages, null, null, AGENT, AGENT.cwd, TOOLS, "code", null, null, { chat })
  return messages
}

/** 推入的工具轮 assistant 消息（判据面 = 带 tool_calls 的 assistant 行）。 */
const toolRounds = (messages) => messages.filter((m) => m.role === "assistant" && Array.isArray(m.tool_calls))

test("A-C12 required 族：工具轮缺 reasoning ⇒ 键在场且为空串（D-CC22）", async () => {
  const messages = await runLoop({ model: "deepseek-flash" }, [{ toolCalls: CALL }, { text: "review done" }])
  const [pushed] = toolRounds(messages)
  assert.ok(pushed, "工具轮 assistant 消息已推入 messages")
  assert.equal("reasoning_content" in pushed, true, "required 族缺值 ⇒ 字段不省略")
  assert.equal(pushed.reasoning_content, "", "缺值 ⇒ 空串在场")
})

test("A-C12 required 族：有 reasoning ⇒ 逐字回传（有值面零回归）", async () => {
  const messages = await runLoop({ model: "deepseek-flash" }, [{ toolCalls: CALL, reasoning: "think-1" }, { text: "review done" }])
  const [pushed] = toolRounds(messages)
  assert.equal(pushed.reasoning_content, "think-1")
})

test("A-C12 optional 族：键恒不存在（有值 / 无值两情形）", async () => {
  for (const reasoning of [undefined, "think-1"]) {
    const messages = await runLoop({ model: "glm-5.3" }, [{ toolCalls: CALL, reasoning }, { text: "review done" }])
    const [pushed] = toolRounds(messages)
    assert.equal("reasoning_content" in pushed, false, `glm-5.3 / reasoning=${reasoning} ⇒ 键不存在`)
  }
})
