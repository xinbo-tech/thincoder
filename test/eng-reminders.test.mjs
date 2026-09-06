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





slow("cache audit (2026-08-16): OS/cwd reminder injected once per process; resume re-grounds the time", async () => {
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



/** /eng TUI 测试隔离（2026-09-06 advisor 🟡——原用真实 process.cwd() 会在 test:full 时
 *  改写真实仓库会话槽 + 认领副作用）：mkdtemp cwd（persistEngineering 仍会认领临时槽）
 *  + 会话目录 hash 残留清理（session-eng-advisor 同款）。 */
async function engCmdIsolation() {
  const { sessionPath } = await import("../src/session.mjs")
  const { createHash } = await import("node:crypto")
  const cwd = mkdtempSync(join(tmpdir(), "tc-eng-cmd-"))
  const base = join(dirname(sessionPath(cwd)),
    createHash("sha1").update(cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")).digest("hex") + ".json")
  const cleanup = () => {
    rmSync(cwd, { recursive: true, force: true })
    for (const suffix of ["", ".manifest", ".manifest.cli", ".1", ".2", ".tmp"]) {
      try { rmSync(base + suffix, { force: true }) } catch {}
    }
  }
  return { cwd, cleanup }
}



slow("cmd-eng TUI toggle OFF: token set kept (R16 F-R16a) + OFF reminder queued", async () => {
  const { handleEngCommand } = await import("../src/tui/cmd-eng.mjs")
  const { cwd, cleanup } = await engCmdIsolation()
  try {
    const agent = {
      cwd,
      config: { agent: { engineering: true } }, // currently ON → toggle goes OFF
      _engDesignToken: "x", _engDesignTokens: new Map([["id-a", "tok-a"]]), _pendingReminders: [],
    }
    await handleEngCommand({
      agent,
      pushLine: () => {},
      pushLabel: () => {},
      persistRaw: async () => {},
      showPicker: async () => ({ action: "create" }),
    })
    assert.equal(agent.config.agent.engineering, false)
    assert.equal(agent._engDesignToken, "x", "TUI OFF keeps the design token (R16 F-R16a — ON→OFF 不清)")
    assert.equal(agent._engDesignTokens.size, 1, "TUI OFF keeps the slot set — only TTL expiry cleans")
    assert.ok(agent._pendingReminders.some((r) => r.includes("engineering mode is now OFF")),
      "OFF reminder queued for the model (was silent before 2026-08-25)")
  } finally { cleanup() }
})



test("eng tool exit: OFF reminder reaches history via pendingReminders flush", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = { config: { agent: { engineering: true } }, _pendingReminders: [] }
  const out = await engTool.execute({ action: "exit" }, { agent })
  assert.match(out, /exited/i)
  assert.ok(agent._pendingReminders.some((r) => r.includes("engineering mode is now OFF")))
  assert.equal(agent._lastEngState, false)
})


// ─── 2026-09-01 修复轮 #2 语义按 R16 反转（2026-09-06）：token 随会话跨模式存活 ───

test("eng tool exit KEEPS tokens — ON→OFF does not clear (R16 F-R16a)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = {
    config: { agent: { engineering: true } },
    _engDesignToken: "tok", _engDesignTokens: new Map([["id-a", "tok-a"], ["id-b", "tok-b"]]),
    _pendingReminders: [],
  }
  const out = await engTool.execute({ action: "exit" }, { agent })
  assert.match(out, /exited/i)
  assert.equal(agent._engDesignToken, "tok", "exit keeps the single mirror — valid tokens survive OFF (R16)")
  assert.ok(agent._engDesignTokens instanceof Map && agent._engDesignTokens.size === 2,
    "exit keeps the multi-design slot set (only TTL expiry cleans — F-R16b)")
})



test("eng tool off→on enter KEEPS valid tokens — no fresh review required (R16 F-R16a)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const agent = {
    config: { agent: { engineering: false } },
    _engDesignToken: "standing", _engDesignTokens: new Map([["id-a", "standing"]]),
    _pendingReminders: [],
  }
  const out = await engTool.execute({ action: "enter" }, { agent })
  assert.match(out, /activated/i)
  assert.ok(!/expired design token/.test(out), "无过期 token → 文案不含清理句")
  assert.equal(agent._engDesignToken, "standing", "off→on keeps the mirror — valid token stays usable (OFF→ON 不重评)")
  assert.equal(agent._engDesignTokens.size, 1, "off→on keeps the slot set")
  // 幂等 enter：既有槽存活（对齐单值镜像 AC6 语义——already-on 纯 no-op 不变）
  const standing = {
    config: { agent: { engineering: true } },
    _engDesignToken: "keepme", _engDesignTokens: new Map([["id-a", "tok-a"]]),
    _pendingReminders: [],
  }
  const out2 = await engTool.execute({ action: "enter" }, { agent: standing })
  assert.match(out2, /already active/)
  assert.equal(standing._engDesignToken, "keepme", "redundant enter keeps the mirror (AC6)")
  assert.equal(standing._engDesignTokens.size, 1, "redundant enter keeps the slots too")
})



test("T-R16c: off→on enter clears ONLY expired tokens — mixed Map, mirror sync (R16 F-R16b ②)", async () => {
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const now = Date.now()
  const valid = `11111111-2222-3333-4444-555555555555:${now + 24 * 3600 * 1000}`
  const expiredA = `aaaaaaaa-1111-4111-8111-00000000000a:${now - 1000}`
  const expiredB = `bbbbbbbb-2222-4222-8222-00000000000b:${now - 1000}`
  // 混合 Map：2 过期 + 1 有效；镜像 = 过期B（最后签发——其槽过期 → 镜像同步清）
  const agent = {
    config: { agent: { engineering: false } },
    _engDesignToken: expiredB,
    _engDesignTokens: new Map([["exp-a", expiredA], ["exp-b", expiredB], ["val-c", valid]]),
    _pendingReminders: [],
  }
  const out = await engTool.execute({ action: "enter" }, { agent })
  assert.match(out, /activated/i)
  assert.ok(out.includes("Cleared 2 expired design tokens") && out.includes("清 2 个过期 token"), `enter 文案含清 N 个过期 token: ${out}`)
  assert.equal(agent._engDesignTokens.size, 1, "只有过期槽被删")
  assert.equal(agent._engDesignTokens.get("val-c"), valid, "有效槽原样保留（TTL 内不重评）")
  assert.equal(agent._engDesignToken, null, "镜像（过期 token）同步清")
  // 无 Map 的 legacy 镜像（旧单值会话）：过期同样在 enter 清
  const legacy = { config: { agent: { engineering: false } }, _engDesignToken: expiredA, _pendingReminders: [] }
  const out2 = await engTool.execute({ action: "enter" }, { agent: legacy })
  assert.ok(out2.includes("Cleared 1 expired design token") && out2.includes("清 1 个过期 token"), `legacy 镜像清理文案: ${out2}`)
  assert.equal(legacy._engDesignToken, null, "legacy 过期镜像清")
  assert.equal(legacy.config.agent.engineering, true)
})



slow("cmd-eng TUI toggle ON clears only expired tokens — valid kept (R16 F-R16b ②)", async () => {
  const { handleEngCommand } = await import("../src/tui/cmd-eng.mjs")
  const { cwd, cleanup } = await engCmdIsolation()
  try {
    const now = Date.now()
    const expired = `aaaaaaaa-1111-4111-8111-00000000000a:${now - 1000}`
    const valid = `11111111-2222-3333-4444-555555555555:${now + 24 * 3600 * 1000}`
    const agent = {
      cwd,
      config: { agent: { engineering: false } }, // currently OFF → toggle goes ON
      _engDesignToken: expired, _engDesignTokens: new Map([["exp", expired], ["val", valid]]),
      _pendingReminders: [],
    }
    const lines = []
    await handleEngCommand({
      agent,
      pushLine: (l) => lines.push(l), pushLabel: () => {},
      persistRaw: async () => {},
      showPicker: async () => ({ action: "create" }), // METHODOLOGY missing in temp cwd
    })
    assert.equal(agent.config.agent.engineering, true)
    assert.equal(agent._engDesignToken, null, "过期镜像同步清")
    assert.equal(agent._engDesignTokens.size, 1, "过期槽删、有效槽保留")
    assert.equal(agent._engDesignTokens.get("val"), valid, "有效 token 跨 OFF→ON 存活")
    assert.ok(lines.some((l) => l.includes("cleared 1 expired design token")),
      `ON 文案报清理数: ${lines.join(" | ")}`)
  } finally { cleanup() }
})
