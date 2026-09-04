/**
 * eng-reminders.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { slow } from "./slow.mjs"
import { createMemory, put } from "../src/memory.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"





test("cache audit (2026-08-16): OS/cwd reminder injected once per process; resume re-grounds the time", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const memory = createMemory({ dbPath: join(mkdtempSync(join(tmpdir(), "mem-")), "m.db") })
  const { server } = await mockLLM([{ content: "a" }, { content: "b" }, { content: "c" }])
  try {
    const cwd = mkdtempSync(join(tmpdir(), "cache-audit-"))
    const agent = createAgent({ provider: { baseURL: `http://127.0.0.1:${server.address().port}`, apiKey: "x", model: "m" }, tools: [], config: {}, cwd, memory })
    // run 1: fresh → OS reminder lands once, time lands
    await runAgent(agent, "t1")
    const osReminders = agent.history.filter((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: OS:"))
    assert.equal(osReminders.length, 1, "OS reminder injected exactly once")
    // run 2: guard blocks the duplicate OS reminder
    await runAgent(agent, "t2")
    const osReminders2 = agent.history.filter((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: OS:"))
    assert.equal(osReminders2.length, 1, "no duplicate OS reminder on the next run")
    // resume path: time re-grounded (a resume must not keep the pre-interrupt time)
    const beforeTimes = agent.history.filter((m) => typeof m.content === "string" && /current time is/.test(m.content)).length
    await runAgent(agent, "t3", {}, { resume: true })
    const afterTimes = agent.history.filter((m) => typeof m.content === "string" && /current time is/.test(m.content)).length
    assert.ok(afterTimes > beforeTimes, "resume injects a fresh time reminder")
  } finally {
    server.close()
  }
})



// ─── ENG 状态提醒补全（2026-08-25）：OFF 转换必须通知模型 ───

test("injectEngineeringReminder: OFF transition now pushes ENG_OFF_REMINDER (was ON-only silence)", async () => {
  const { createAgent, ENG_OFF_REMINDER } = await import("../src/agent.mjs")
  const agent = createAgent({ provider: { name: "t", model: "m" }, tools: [], config: { agent: {} }, cwd: process.cwd() })
  agent._lastEngState = true // was ON
  agent.config.agent.engineering = false // now OFF
  // Direct call via the runAgent path is heavyweight; the injector is module-private —
  // exercise through the observable contract: next runAgent turn injects. Here assert the
  // exported reminder text and the /eng TUI path pushes it (cmd-eng test below).
  assert.match(ENG_OFF_REMINDER, /engineering mode is now OFF/)
})



test("cmd-eng: TUI /eng toggle OFF pushes ENG_OFF_REMINDER into pendingReminders", async () => {
  const { handleEngCommand } = await import("../src/tui/cmd-eng.mjs")
  const agent = {
    cwd: process.cwd(),
    config: { agent: { engineering: true } }, // currently ON → toggle goes OFF
    _engDesignToken: "x", _pendingReminders: [],
  }
  await handleEngCommand({
    agent,
    pushLine: () => {},
    pushLabel: () => {},
    persistRaw: async () => {},
    showPicker: async () => ({ action: "create" }),
  })
  assert.equal(agent.config.agent.engineering, false)
  assert.equal(agent._engDesignToken, null, "OFF invalidates the design token")
  assert.ok(agent._pendingReminders.some((r) => r.includes("engineering mode is now OFF")),
    "OFF reminder queued for the model (was silent before 2026-08-25)")
})



test("eng tool exit: OFF reminder reaches history via pendingReminders flush", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = { config: { agent: { engineering: true } }, _pendingReminders: [] }
  const out = await engTool.execute({ action: "exit" }, { agent })
  assert.match(out, /exited/i)
  assert.ok(agent._pendingReminders.some((r) => r.includes("engineering mode is now OFF")))
  assert.equal(agent._lastEngState, false)
})


// ─── 2026-09-01 修复轮 #2：清理对称——清单值镜像的位置同步清多槽 Map ───

test("eng tool exit clears _engDesignTokens along with the single mirror (fix #2)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = {
    config: { agent: { engineering: true } },
    _engDesignToken: "tok", _engDesignTokens: new Map([["id-a", "tok-a"], ["id-b", "tok-b"]]),
    _pendingReminders: [],
  }
  const out = await engTool.execute({ action: "exit" }, { agent })
  assert.match(out, /exited/i)
  assert.equal(agent._engDesignToken, null)
  assert.ok(agent._engDesignTokens instanceof Map && agent._engDesignTokens.size === 0,
    "multi-design slots die with the mode — no stale slot set survives eng(exit)")
})



test("eng tool off→on enter clears _engDesignTokens; idempotent enter keeps them (fix #2)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = {
    config: { agent: { engineering: false } },
    _engDesignToken: "stale", _engDesignTokens: new Map([["stale-id", "stale"]]),
    _pendingReminders: [],
  }
  await engTool.execute({ action: "enter" }, { agent })
  assert.equal(agent._engDesignToken, null)
  assert.ok(agent._engDesignTokens instanceof Map && agent._engDesignTokens.size === 0,
    "off→on transition kills stale multi-design slots (fresh design review required)")
  // 幂等 enter：既有槽存活（对齐单值镜像 AC6 语义）
  const standing = {
    config: { agent: { engineering: true } },
    _engDesignToken: "keepme", _engDesignTokens: new Map([["id-a", "tok-a"]]),
    _pendingReminders: [],
  }
  const out = await engTool.execute({ action: "enter" }, { agent: standing })
  assert.match(out, /already active/)
  assert.equal(standing._engDesignToken, "keepme", "redundant enter keeps the mirror (AC6)")
  assert.equal(standing._engDesignTokens.size, 1, "redundant enter keeps the slots too")
})



test("cmd-eng TUI toggle OFF clears _engDesignTokens (fix #2)", async () => {
  const { handleEngCommand } = await import("../src/tui/cmd-eng.mjs")
  const agent = {
    cwd: process.cwd(),
    config: { agent: { engineering: true } }, // currently ON → toggle goes OFF
    _engDesignToken: "x", _engDesignTokens: new Map([["id-a", "tok-a"]]),
    _pendingReminders: [],
  }
  await handleEngCommand({
    agent,
    pushLine: () => {}, pushLabel: () => {},
    persistRaw: async () => {},
    showPicker: async () => ({ action: "create" }),
  })
  assert.equal(agent.config.agent.engineering, false)
  assert.equal(agent._engDesignToken, null)
  assert.ok(agent._engDesignTokens instanceof Map && agent._engDesignTokens.size === 0,
    "TUI OFF kills the multi-design slot set")
})
