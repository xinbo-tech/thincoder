/**
 * reasoning-echo-live.test.mjs — D-CC22 活体推入面回声恒带 · VSC 端壳面（#109 · 批档 §2.9 ③ A-C8 / A-C9）。
 *
 * 宿主面：真端壳循环（`thincoder-vscode/src/agent.mjs` 的 `runAgent`）+ 脚本化 provider
 * （本地 HTTP/SSE）+ tmp 工作区（含 `.git`）+ tmp config 隔离（同 `scenario-01`）——断言
 * **线上请求体**里该 assistant 消息的回声字段 + 端壳单点结构面。
 *
 * 判据：required 族（deepseek-flash）第 2 工具轮缺 reasoning ⇒ 键在场且为 `""`（第 3 次请求
 * 体）；首工具轮有值面零回归（第 2 次请求体）；optional 族（glm-5.3）全量请求体键恒不存在；
 * 端壳零 `reasoning_content:` 字面 + 构造调用恰 1 处 + `specs.mjs` 双面（import ∧ re-export）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { runAgent } from "../../src/agent.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../../src")

let work
let cfgDir

before(() => {
  work = mkdtempSync(join(tmpdir(), "tc-integ-echo-"))
  mkdirSync(join(work, ".git"), { recursive: true }) // 项目根判据（.git 仓根）
  writeFileSync(join(work, "note-a.txt"), "alpha\n", "utf8")
  writeFileSync(join(work, "note-b.txt"), "beta\n", "utf8")
  cfgDir = mkdtempSync(join(tmpdir(), "tc-integ-echo-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
  rmSync(work, { recursive: true, force: true })
  rmSync(cfgDir, { recursive: true, force: true })
})

/** 跑一个完整回合（真端壳循环；AUTO 档 = 工具免逐项审批）。 */
async function runTurn(llm, model, input) {
  const opts = { depth: 0, history: [], fullHistory: [] }
  await runAgent(providerFor(llm, { model }), work, input, {}, undefined, true, opts)
}

/** 工具轮脚本步（`reasoning` 可选 —— 缺省 = 本轮无推理回传）。 */
const readStep = (path, reasoning) => ({
  ...(reasoning ? { reasoning } : {}),
  toolCall: { name: "read", arguments: { path } },
})

/** 请求体中的工具轮 assistant 消息（判据面 = 带 tool_calls 的 assistant 行）。 */
const toolRounds = (messages) => messages.filter((m) => m.role === "assistant" && Array.isArray(m.tool_calls))

test("A-C8 required 族（deepseek-flash）：第 2 工具轮缺 reasoning ⇒ 线上该消息键在场且为空串", async () => {
  const llm = await mockLLM([
    readStep("note-a.txt", "think-1"),
    readStep("note-b.txt"),
    { content: "done" },
  ])
  try {
    await runTurn(llm, "deepseek-flash", "读两个笔记")
    assert.ok(llm.requests.length >= 3, `三个请求（实到 ${llm.requests.length}）`)
    const first = toolRounds(llm.requests[1].body.messages).at(-1)
    assert.equal(first.reasoning_content, "think-1", "首工具轮有值 ⇒ 逐字回传（零回归）")
    const second = toolRounds(llm.requests[2].body.messages).at(-1)
    assert.equal("reasoning_content" in second, true, "缺值 ⇒ 字段不省略")
    assert.equal(second.reasoning_content, "", "缺值 ⇒ 空串到线（D-CC22）")
  } finally {
    await llm.close()
  }
})

test("A-C8 边界 optional 族（glm-5.3）：全量请求体中任一 assistant 消息键恒不存在", async () => {
  const llm = await mockLLM([
    readStep("note-a.txt", "think-1"),
    readStep("note-b.txt", "think-2"),
    { content: "done" },
  ])
  try {
    await runTurn(llm, "glm-5.3", "读两个笔记")
    for (const r of llm.requests) {
      for (const m of r.body.messages ?? []) {
        if (m.role !== "assistant") continue
        assert.equal("reasoning_content" in m, false, `optional 族零回声（该键出现在：${JSON.stringify(m).slice(0, 140)}）`)
      }
    }
  } finally {
    await llm.close()
  }
})

test("A-C9 端壳单点结构面：零字段字面 ∧ 构造调用恰 1 处 ∧ specs.mjs 双面含名", () => {
  const agentSrc = readFileSync(join(SRC, "agent.mjs"), "utf8")
  assert.equal((agentSrc.match(/reasoning_content:/g) ?? []).length, 0, "端壳零 reasoning_content: 字面（字段字面只存核单点）")
  assert.equal((agentSrc.match(/assistantToolCallMessage\(/g) ?? []).length, 1, "构造单点调用恰 1 处（端壳零第二构造点）")
  const specsSrc = readFileSync(join(SRC, "specs.mjs"), "utf8")
  assert.match(specsSrc, /import\s*{[^}]*\bassistantToolCallMessage\b[^}]*}\s*from\s*"@thincoder\/core\/model-specs\.mjs"/, "specs.mjs 核 import 名表含该名")
  assert.match(specsSrc, /export\s*{[^}]*\bassistantToolCallMessage\b[^}]*}/, "specs.mjs re-export 面含该名")
})
