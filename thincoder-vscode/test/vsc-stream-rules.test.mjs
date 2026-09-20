/**
 * vsc-stream-rules.test.mjs — VSC 行为/能力两则批 · A 面（#130）用例：stream 规则在 VSC 端生效
 * （`.thincoder/rules/*.md`——与 CLI 同语义）。判据 = 批档
 * `docs/batches/2026-09-20-vsc-rules-retry-batch.md` §2.5 T-A1…T-A4：
 * T-A1 装配合并（文件规则置前 + 同 pattern 去重）· T-A2 abort 端到端（重入 + `once` 去重）·
 * T-A3 子回合继承（真 `buildSpawnChild`）· T-A4 warn 文案逐字（`stream rule warnings …`）。
 * 手法：T-A2/T-A4 真 `runAgent`（depth 1——零面板副作用）+ `globalThis.fetch` 假 SSE 桩
 * （先例 `test/provider-timeout-semantics.test.mjs:49-53`——零网络）；配置面 = 临时 config
 * 路径（核测试缝 `_setConfigPathForTest`——不读用户真实 config）。
 * 观测缝记明（批档 §2.5 T-A2）：`chat` 载荷形（`streamRules` / `firedPatterns`）不经 HTTP 体
 * ⇒ fetch 桩不可见——判据 = 载荷生效的端到端效果（请求计数 + history 提醒）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { mergeFileRules } from "../src/agent/rules-face.mjs"
import { runAgent } from "../src/agent.mjs"

let root
const enc = new TextEncoder()

before(() => {
  root = mkdtempSync(join(tmpdir(), "tc-stream-rules-"))
  const cfg = join(root, "config.json")
  writeFileSync(cfg, "{}\n", "utf8")
  _setConfigPathForTest(cfg)
})
after(() => {
  _setConfigPathForTest(null)
  try { rmSync(root, { recursive: true, force: true }) } catch { /* best effort */ }
})

/** 规则档夹具（`.thincoder/rules/<name>.md`——核 discoverRules 形态）+ 返回 cwd。 */
const RULE_ABORT = ['---', 'pattern: "ABORTME"', "action: abort", "repeat: once", "---", "Use the project logger instead of console.log.", ""].join("\n")
const RULE_WARN = ['---', 'pattern: "WARNME"', "action: warn", "repeat: always", "---", "Use the project logger instead of console.log.", ""].join("\n")
function mkProj(tag, ruleText) {
  const cwd = join(root, tag)
  mkdirSync(join(cwd, ".thincoder", "rules"), { recursive: true })
  writeFileSync(join(cwd, ".thincoder", "rules", "r1.md"), ruleText, "utf8")
  return cwd
}

// ─── SSE 桩（假流——openai 形态）─────────────────────────────────────────────

const chunk = (text, finish = null) => `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: finish }] })}\n\n`
function closedStream(frames) {
  let i = 0
  return new ReadableStream({ pull(c) { if (i < frames.length) c.enqueue(enc.encode(frames[i++])); else c.close() } })
}

/** 真装配 + 真循环直驱（depth 1 = 子回合形态）。返回 { calls, history, agent }。 */
async function drive(cwd, frames) {
  const provider = { name: "stub", baseURL: "https://stub.invalid/v1", model: "stub-model", apiKey: "sk-stub" }
  let calls = 0
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => {
    calls++
    return { ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }), body: closedStream(frames), text: async () => "" }
  }
  const sink = {}
  try {
    await runAgent(provider, cwd, "task", {}, undefined, false, { depth: 1, role: "explore", maxTurns: 4, stateSink: sink })
  } finally {
    globalThis.fetch = origFetch
  }
  return { calls, history: sink.history, agent: sink.agent }
}

// ─── T-A1 装配合并（正常 + 边界）────────────────────────────────────────────

test("T-A1 装配合并：文件规则置前、同 pattern 只留文件侧；无目录 ⇒ 原样返回（恒等）", () => {
  const cwd = mkProj("merge", RULE_ABORT)
  const configRules = [
    { pattern: "ABORTME", message: "config dup", action: "warn", repeat: "always", name: "cfg-dup" },
    { pattern: "TODO", message: "config keep", action: "warn", repeat: "always", name: "cfg-keep" },
  ]
  const merged = mergeFileRules(configRules, cwd)
  assert.equal(merged.length, 2, `文件规则置前 + config 非重复项保留（实读 ${JSON.stringify(merged)})`)
  assert.equal(merged[0].name, "r1", "文件规则置前（核 discoverRules 产物）")
  assert.equal(merged[0].action, "abort", "文件侧动作原样")
  assert.equal(merged[1].name, "cfg-keep", "同 pattern 的 config 规则被去重（文件侧优先）")
  assert.ok(!merged.some((r) => r.name === "cfg-dup"), "config 重复项不保留")

  const bare = mergeFileRules(configRules, join(root, "no-rules-dir"))
  assert.equal(bare, configRules, "无 .thincoder/rules ⇒ 原样返回（恒等——零拷贝零改）")
})

// ─── T-A2 abort 端到端（正常 + 边界）─────────────────────────────────────────

test("T-A2 abort 端到端：命中 ⇒ 部分输出 + 规则提醒 + 重入（请求 2）；`once` 去重 ⇒ 不增至 3", async () => {
  const cwd = mkProj("abort", RULE_ABORT)
  // 两次响应同含 ABORTME：`repeat: once` + 共享 firedPatterns ⇒ 第二次不触发（请求计数 2 而非 3）
  const frames = [chunk("ABORTME line"), chunk(" tail", "stop"), "data: [DONE]\n\n"]
  const { calls, history } = await drive(cwd, frames)
  assert.equal(calls, 2, `重入恰一次（fetch 桩请求计数 = 2；实读 ${calls}）`)
  const reminders = history.filter((m) => typeof m.content === "string" && m.content.startsWith('[System reminder — stream rule "r1"'))
  assert.equal(reminders.length, 1, `规则提醒恰一次（实读 ${JSON.stringify(history.map((m) => String(m.content).slice(0, 60)))})`)
  assert.ok(reminders[0].content.includes("Use the project logger instead of console.log."), "提醒携带规则正文（核 ruleMessage）")
  assert.ok(history.some((m) => m.role === "assistant" && m.content === "ABORTME line"), "部分输出已入 history")
})

// ─── T-A3 子回合继承（正常）─────────────────────────────────────────────────

test("T-A3 子回合继承：父装配（真 hydrateRun）⇒ 核 buildSpawnChild 子 config.agent.streamRules 非空", async () => {
  const cwd = mkProj("inherit", RULE_ABORT)
  // 父 = 真装配路径产物（A-1/A-2 接线）；provider 不可解析 ⇒ chat 即抛（零网络）
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new DOMException("The operation was aborted.", "AbortError") }
  const sink = {}
  try {
    await runAgent({ name: "stub", model: "stub-model" }, cwd, "task", {}, undefined, false,
      { depth: 1, role: "explore", maxTurns: 1, stateSink: sink })
  } catch { /* setup 已完成——只取 agent */ } finally {
    globalThis.fetch = origFetch
  }
  const parent = sink.agent
  assert.ok(parent, "装配产物在位")
  assert.ok(Array.isArray(parent.config?.agent?.streamRules) && parent.config.agent.streamRules.length > 0,
    `父装配期已并入（A-1/A-2——实读 ${JSON.stringify(parent.config?.agent?.streamRules)})`)
  const built = buildSpawnChild(parent, { agent: parent, depth: 0, cwd, callbacks: {} },
    { task: "audit the delivery" }, "explore", false, [], [], null)
  const childRules = built.child.config?.agent?.streamRules
  assert.ok(Array.isArray(childRules) && childRules.length > 0, "子 config 继承同一份 streamRules（核 childConfig = {...parent.config}）")
  assert.equal(childRules[0].name, "r1", "继承项 = 文件规则")
})

// ─── T-A4 warn 面文案逐字（正常）────────────────────────────────────────────

test("T-A4 warn 面：命中 ⇒ 不重入（请求 1）+ history 逐字 `stream rule warnings from your last response`", async () => {
  const cwd = mkProj("warn", RULE_WARN)
  const frames = [chunk("WARNME hit", "stop"), "data: [DONE]\n\n"]
  const { calls, history } = await drive(cwd, frames)
  assert.equal(calls, 1, "warn 不重入（请求计数 1）")
  const reminder = history.find((m) => typeof m.content === "string" && m.content.includes("stream rule warnings from your last response"))
  assert.ok(reminder, `warn 注入文案逐字（CLI 标尺；实读 ${JSON.stringify(history.map((m) => String(m.content).slice(0, 70)))})`)
  assert.ok(reminder.content.includes("- r1: Use the project logger instead of console.log."), "逐字含 `- <name>: <message>`")
})
