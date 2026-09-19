/**
 * setup-retrieval-gate.test.mjs — §6.10 修法 B（子代检索门 · depth-0）行为组
 * （TUI 假死批 2026-09-18 · 批档 `docs/batches/2026-09-18-tui-freeze.md` §2.5 T-G1–T-G3）。
 *
 * 行为面（断言对象 = `prepareRun` 写入 `agent.history` 的可观察行 + 检索调用计数）：
 * - T-G1（正常）：depth 0 + memory 句柄 + 命中夹具 ⇒ 两块召回注入在场
 *   （`[Relevant documentation` / `[Relevant memories from previous sessions`）；
 * - T-G2（边界）：同夹具 depth 1 ⇒ 两前缀块**零在场** ∧ 检索调用计数 = 0；
 * - T-G3（AC-8 机判面）：两路径各跑一遍 + `unhandledRejection` 计数 = 0。
 *
 * 缝：检索调用计数 = `memory.db.prepare` 包裹计数（核内检索全经 `memory.db.prepare`
 * ——零模块 spy、零 ESM 绑定改写）。夹具 = tmp 树 + in-memory 库（无 embedder ⇒ 纯 FTS）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { prepareRun } from "../agent/setup.mjs"
import { createAgent } from "../agent.mjs"
import { createMemory, put, docSync } from "../memory.mjs"

const DOC_PREFIX = "[Relevant documentation"
const MEM_PREFIX = "[Relevant memories from previous sessions"

/** 命中夹具：一个 doc chunk（FTS 通道）+ 一条 personal 记忆；返回计数缝（db.prepare 计数）。 */
async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "core-retrieval-gate-"))
  // Windows 句柄滞后：depth-0 装配面会 spawn git（cwd = 本目录）——子进程未及退出时 rmdir 会
  // EPERM；清理带退避重试，仍锁则放弃（残留 tmp 目录无害——既有先例：VSC 测试同款容忍）。
  t.after(async () => {
    for (let i = 0; i < 10; i++) {
      try { rmSync(dir, { recursive: true, force: true, maxRetries: 2, retryDelay: 50 }); return } catch { /* handle lag */ }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  })
  writeFileSync(join(dir, "notes.md"), "# needle\n\nthe needle doc lives here\n", "utf8")
  const memory = createMemory({ dbPath: ":memory:" })
  await docSync(memory, dir, {})
  await put(memory, { type: "knowledge", title: "needle memory", content: "the needle memory lives here" })
  const real = memory.db
  let calls = 0
  memory.db = { prepare: (...args) => { calls++; return real.prepare(...args) }, exec: real.exec.bind(real) }
  t.after(() => { memory.db = real; real.close() })
  return { dir, memory, calls: () => calls }
}

function mkAgent(memory, cwd) {
  const agent = createAgent({ provider: { name: "p", model: "m", apiKey: "k" }, cwd, config: {} })
  agent.tools = []
  agent.memory = memory
  return agent
}

const historyText = (agent) => agent.history.map((m) => String(m.content ?? "")).join("\n")

test("T-G1 正常：depth 0 + 命中夹具 ⇒ 两块召回注入在场（doc + memory）", async (t) => {
  const { dir, memory } = await fixture(t)
  const agent = mkAgent(memory, dir)
  await prepareRun(agent, "needle", {}, { depth: 0 })
  const text = historyText(agent)
  assert.ok(text.includes(DOC_PREFIX), `相关文档块在场（实 ${text.slice(0, 200)}）`)
  assert.ok(text.includes(MEM_PREFIX), "相关记忆块在场")
})

test("T-G2 边界：depth 1 ⇒ 两前缀块零在场 ∧ 检索调用计数 = 0", async (t) => {
  const { dir, memory, calls } = await fixture(t)
  const agent = mkAgent(memory, dir)
  await prepareRun(agent, "needle", {}, { depth: 1 })
  const text = historyText(agent)
  assert.ok(!text.includes(DOC_PREFIX), "子代理不注入相关文档块（§6.10 修法 B）")
  assert.ok(!text.includes(MEM_PREFIX), "子代理不注入相关记忆块")
  assert.equal(calls(), 0, "depth > 0 零检索调用（向量通道扫描与 FTS 皆不发生）")
})

test("T-G3 边界（AC-8 机判面）：两路径皆跑完 ∧ unhandledRejection 计数 = 0", async (t) => {
  const { dir, memory } = await fixture(t)
  let rejections = 0
  const onRejection = () => { rejections++ }
  process.on("unhandledRejection", onRejection)
  try {
    await prepareRun(mkAgent(memory, dir), "needle", {}, { depth: 0 })
    await prepareRun(mkAgent(memory, dir), "needle", {}, { depth: 1 })
    await new Promise((resolve) => setImmediate(resolve)) // 排空一轮微任务
    await new Promise((resolve) => setTimeout(resolve, 0)) // + 一个宏任务
    assert.equal(rejections, 0, "两路径零未捕获 rejection（浮动 Promise 面无）")
  } finally {
    process.off("unhandledRejection", onRejection)
  }
})
