/**
 * reasoning-echo-live.test.mjs — D-CC22 活体推入面回声恒带（#109 · 批档 §2.4 A-C2 / A-C3）。
 *
 * 宿主面（真循环 × HTTP mock）：核主循环（`thincoder-core/agent.mjs` 的工具轮推入）经真
 * provider 链路打到本地脚本化 provider，断言**线上请求体**里该 assistant 消息的回声字段。
 * 落位理由（§2.10 ⑧）：核测试层无 mock provider 面（核主循环经模块级 `chat()` 直发、无
 * 注入缝）⇒ 复用 CLI 集成层既有夹具（`test/helpers/mock-llm.mjs` + 临时工作区），零新增夹具面。
 *
 * 判据：required 族（deepseek-flash）第 2 工具轮缺 reasoning ⇒ 键在场且为 `""`（第 3 次请求
 * 体）；首工具轮有值面零回归（第 2 次请求体）；optional 族（glm-5.3）全量请求体键恒不存在。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runAgent, createAgent } from "@thincoder/core/agent.mjs"
import { builtinTools } from "@thincoder/core/tools/index.mjs"
import { mockLLM } from "../helpers/mock-llm.mjs"

/** 真循环 + 脚本化 provider（模型名决定回声族）+ 临时工作区（t.after 清理）。 */
async function runScene(t, { model, script }) {
  const dir = mkdtempSync(join(tmpdir(), "tc-int-echo-"))
  writeFileSync(join(dir, "note-a.txt"), "alpha\n")
  writeFileSync(join(dir, "note-b.txt"), "beta\n")
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  const mock = await mockLLM(script)
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const agent = createAgent({
    provider: { name: "mock", model, baseURL: `http://127.0.0.1:${mock.port}/v1`, apiKey: "test-key" },
    tools: builtinTools,
    config: { agent: { maxTurns: 12, engineering: false, verifyGuard: false } },
    cwd: dir,
    memory: null,
  })
  await runAgent(agent, "read both notes", { onPermissionRequest: async () => true })
  return { requests: mock.requests }
}

/** 工具轮脚本步（`reasoning` 可选 —— 缺省 = 本轮无推理回传，正是病灶形态）。 */
const readStep = (path, reasoning) => ({
  ...(reasoning ? { reasoning } : {}),
  toolCall: { name: "read", arguments: JSON.stringify({ path }) },
})

/** 请求体中的工具轮 assistant 消息（判据面 = 带 tool_calls 的 assistant 行）。 */
const toolRounds = (messages) => messages.filter((m) => m.role === "assistant" && Array.isArray(m.tool_calls))

test("A-C2 required 族（deepseek-flash）：第 2 工具轮缺 reasoning ⇒ 线上该消息键在场且为空串", async (t) => {
  const { requests } = await runScene(t, {
    model: "deepseek-flash",
    script: [readStep("note-a.txt", "think-1"), readStep("note-b.txt"), { content: "done" }],
  })
  assert.ok(requests.length >= 3, `三个请求（实到 ${requests.length}）`)
  const first = toolRounds(requests[1].messages).at(-1)
  assert.equal(first.reasoning_content, "think-1", "首工具轮有值 ⇒ 逐字回传（零回归）")
  const second = toolRounds(requests[2].messages).at(-1)
  assert.equal("reasoning_content" in second, true, "缺值 ⇒ 字段不省略")
  assert.equal(second.reasoning_content, "", "缺值 ⇒ 空串到线（D-CC22）")
})

test("A-C3 optional 族（glm-5.3）：全量请求体中任一 assistant 消息键恒不存在", async (t) => {
  const { requests } = await runScene(t, {
    model: "glm-5.3",
    script: [readStep("note-a.txt", "think-1"), readStep("note-b.txt", "think-2"), { content: "done" }],
  })
  for (const r of requests) {
    for (const m of r.messages ?? []) {
      if (m.role !== "assistant") continue
      assert.equal("reasoning_content" in m, false, `optional 族零回声（该键出现在：${JSON.stringify(m).slice(0, 140)}）`)
    }
  }
})
