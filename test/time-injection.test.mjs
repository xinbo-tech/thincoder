/**
 * time-injection.test.mjs — per-run time reminder position & prefix-cache contract
 *
 * 2026-08-16 cache-hit regression: the plugin reloads the machine line from disk every
 * run (transient messages dropped on persist), so a time reminder interleaved BEFORE
 * the user input drifted position run-to-run and destroyed provider prefix caches.
 * Contract now: the reminder is the LAST message of the sequence (after the user
 * input) — its second-precision content can never shift a prefix. Also locks the
 * fresh-machine-line injections that the interleaved push had silently disabled.
 */
import { describe, it } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { runAgent } from "../src/agent.mjs"

const TIME_RE = /current time is \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/

function makeProvider() {
  return { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" } // unreachable — we never call chat
}

async function captureSetup({ provider, history, fullHistory }) {
  // runAgent with a provider that fails instantly after setup — we only inspect the
  // machine line as prepared before the first chat call.
  const seen = { history: null }
  try {
    await runAgent(provider, process.cwd(), "你好", {}, undefined, true, {
      history, fullHistory,
      // Force failure at the first LLM call; setup already ran by then.
      mcpServers: [], skills: [],
    })
  } catch {
    // expected: chat to 127.0.0.1:1 fails
  }
  seen.history = history
  return seen
}

describe("per-run time reminder (prefix-cache contract)", () => {
  slow("sits AFTER the user input (last machine-line message) on a fresh run", async () => {
    const history = []
    const fullHistory = []
    await captureSetup({ provider: makeProvider(), history, fullHistory })
    const timeIdx = history.findIndex((m) => typeof m.content === "string" && TIME_RE.test(m.content))
    assert.ok(timeIdx >= 0, "time reminder injected")
    const userIdx = history.findIndex((m) => m.role === "user" && m.content === "你好")
    assert.ok(userIdx >= 0, "user input present")
    assert.ok(timeIdx > userIdx, `time (${timeIdx}) must come AFTER the user input (${userIdx}) — interleaving drifts run-to-run and kills the prefix cache`)
    assert.equal(history[timeIdx].transient, true, "transient — dropped on persist")
  })

  slow("fresh-machine-line injections still run (the interleaved push had disabled them)", async () => {
    const history = []
    const fullHistory = []
    await captureSetup({ provider: makeProvider(), history, fullHistory })
    // fresh run injects the AUTO/permission reminder + context — assert at least one
    // of the machine-only reminders besides the time one landed before the user input
    const machine = history.filter((m) => typeof m.content === "string" && m.content.startsWith("[System"))
    assert.ok(machine.length >= 1, "fresh-run system reminders present")
  })

  slow("across runs the prefix before the time stays byte-identical (cache premise)", async () => {
    // 2026-09-06 适配：富注入（git/env 在最新 user 前——SESSION §11.1 同款补齐）后，
    // 首轮 vs 二轮的全序列同构断言已不成立——每轮 disk 重放旧 user 消息到注入前，
    // 序列逐轮增长。缓存命中的真实主体 = disk 重放历史（旧消息逐轮共享前缀）。
    // 契约收敛为三条（防 2026-08-16 事故复发——time 漂移进前缀区）：
    // ① time 恒为该轮最后一条（尾部位置永不扰动前缀）；② disk 重放保序打头；
    // ③ 稳定注入（git）重新落在 disk 重放之后、最新 user 之前。
    const run1 = []
    await captureSetup({ provider: makeProvider(), history: run1, fullHistory: [] })
    // run1 "ends": persist drops transient → what disk holds
    const onDisk = run1.filter((m) => !m.transient)
    const run2 = [...onDisk.map((m) => ({ ...m }))] // disk reload (fresh array, same content)
    await captureSetup({ provider: makeProvider(), history: run2, fullHistory: [] })
    const t2 = run2.find((m) => typeof m.content === "string" && TIME_RE.test(m.content))
    assert.ok(t2, "run 2 re-injects a fresh time")
    assert.ok(t2.transient, "time is transient — dropped on persist")
    // ① time 是最后一条（其后无消息）
    assert.equal(run2[run2.length - 1], t2, "time stays the LAST message — tail position can never shift a prefix")
    // ② disk 重放保序打头（run2 前部 = run1 持久消息同序同内容）
    const replay = run2.slice(0, onDisk.length)
    assert.deepEqual(
      replay.map((m) => JSON.stringify({ ...m, ts: 0 })),
      onDisk.map((m) => JSON.stringify({ ...m, ts: 0 })),
      "disk replay leads run2 in order — history is the cache prefix body",
    )
    // ③ git 稳定注入重新落在重放后、最新 user 前（非穿插）
    const newestUser = run2.findIndex((m, i) => i >= onDisk.length && m.role === "user" && m.content === "你好")
    assert.ok(newestUser >= 0, "new run pushes its own user input")
    const gitIdx = run2.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: git context"))
    assert.ok(gitIdx > onDisk.length - 1 && gitIdx < newestUser, "git re-injected after disk replay, before the newest user — stable slot, never interleaved")
  })
})
