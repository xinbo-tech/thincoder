/**
 * trace-bounds.test.mjs — TUI-OOM-ROOTCAUSE 批 组 2（B2-trace——AGENT-LOOP.md §23.3.2）
 * 用例表 1:1：T-TR1–T-TR5（单遍序列化等价 / 完整落盘 / 序号缓存）。
 *
 * 形态：快层 unit——临时 THINCODER_TRACES_DIR（写门开启——NODE_TEST_CONTEXT 下需显式
 * override）；readdir 计数经 `_traceHooks` 注入缝（慢写替身随 A21 改判退场）。
 *
 * U3（CORE-UNIFICATION §2.6.3）改判登记：实现单源归核（`@thincoder/core/traces/trace-store.mjs`——
 * CLI 副本已删）；容量 / 清理策略随 §2.5 #116 / A21 裁决（取 VSC 侧：完整落盘 + 每写 prune）
 * ⇒ T-TR2 / T-TR3 / T-TR4 由「额度截断 / 在途丢弃」改判为「完整落盘（不截断 / 不丢弃）」。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { recordChatTrace, nextTraceSeq, _traceHooks, _resetTraceStateForTest } from "@thincoder/core/traces/trace-store.mjs"

let dir
let prevEnv
let prevHooks
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-traces-"))
  prevEnv = process.env.THINCODER_TRACES_DIR
  process.env.THINCODER_TRACES_DIR = dir
  _resetTraceStateForTest()
  prevHooks = { ..._traceHooks }
})
afterEach(() => {
  if (prevEnv === undefined) delete process.env.THINCODER_TRACES_DIR
  else process.env.THINCODER_TRACES_DIR = prevEnv
  Object.assign(_traceHooks, prevHooks)
  _resetTraceStateForTest()
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

const traceFiles = () => readdirSync(dir).flatMap((d) => readdirSync(join(dir, d)).map((f) => join(dir, d, f)))
const readOnly = () => JSON.parse(readFileSync(traceFiles()[0], "utf8"))
const mkOpts = (messages, extra = {}) => ({
  messages,
  logCtx: { role: "main", depth: 0, turn: 1, stage: "turn", kind: "chat", session: "S1", cwd: process.cwd(), traces: true, ...extra },
})

test("T-TR1 单遍序列化等价：字段集与既有形态同构、敏感串被脱敏", async () => {
  const messages = [
    { role: "user", content: "hello" },
    { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{\"path\":\"a\"}" } }] },
    { role: "user", content: "sk-abcdef123456" },
    { role: "user", content: "x", extra: { token: "supersecret" } },
  ]
  const provider = { name: "mock", model: "mock-model" }
  const result = { content: "out", reasoning: "think", toolCalls: [{ id: "c1" }], usage: { prompt_tokens: 5 }, finishReason: "stop" }
  await recordChatTrace(provider, mkOpts(messages), result, null)
  const rec = readOnly()
  // 字段集与次序（§13 元数据字段清单——T-TR1 参照物）
  assert.deepEqual(Object.keys(rec), [
    "ts", "session", "cwdHash", "role", "depth", "turn", "provider", "model", "stage", "kind",
    "isContinuation", "messages", "content", "reasoning", "toolCalls", "usage", "finishReason",
  ])
  assert.equal(rec.provider, "mock")
  assert.equal(rec.model, "mock-model")
  assert.equal(rec.session, "S1")
  assert.equal(rec.kind, "chat")
  assert.equal(rec.isContinuation, false)
  assert.equal(rec.content, "out")
  assert.equal(rec.reasoning, "think")
  assert.deepEqual(rec.usage, { prompt_tokens: 5 })
  assert.equal(rec.finishReason, "stop")
  // 消息体逐字同形（完整落盘——原样写出、不做改写）
  assert.equal(rec.messages[0].content, "hello")
  assert.equal(rec.messages[1].tool_calls[0].function.arguments, "{\"path\":\"a\"}")
  // 脱敏：形态扫描（sk-…）+ 字段名黑名单（token）
  assert.equal(rec.messages[2].content, "[redacted]")
  assert.equal(rec.messages[3].extra.token, "[REDACTED]")

  // 错误路径（D-TR5）：error 字段 + finishReason:null
  await recordChatTrace(provider, mkOpts([]), null, new Error("boom"))
  const files = traceFiles()
  assert.equal(files.length, 2)
  const errRec = JSON.parse(readFileSync(files.sort()[1], "utf8"))
  assert.equal(errRec.finishReason, null)
  assert.match(errRec.error.err, /boom/)
  assert.equal(typeof errRec.error.kind, "string")
})

test("T-TR2 完整落盘：一条 1MB content 逐字保留（无单消息额度——A21 裁决）", async () => {
  const big = "H".repeat(500_000) + "T".repeat(500_000)
  await recordChatTrace({ name: "mock", model: "m" }, mkOpts([{ role: "tool", content: big }]), { content: "ok" }, null)
  const rec = readOnly()
  assert.equal(rec.messages[0].content, big, "完整落盘（不截断、无省略标记）")
})

test("T-TR3 完整落盘：>4MB 记录 messages 逐条保留（无记录级降级——A21 裁决）", async () => {
  const messages = Array.from({ length: 100 }, (_, i) => ({ role: "tool", content: `#${i}#` + "z".repeat(100_000) }))
  await recordChatTrace({ name: "mock", model: "m" }, mkOpts(messages), { content: "ok", usage: { completion_tokens: 3 } }, null)
  const rec = readOnly()
  assert.equal(Array.isArray(rec.messages), true, "messages 保持数组（无 stub 降级）")
  assert.equal(rec.messages.length, 100, "100 条消息逐条保留")
  assert.equal(rec.messages[0].content, "#0#" + "z".repeat(100_000))
  assert.equal(rec.messages[99].content, "#99#" + "z".repeat(100_000))
  assert.equal(rec.content, "ok")
  assert.deepEqual(rec.usage, { completion_tokens: 3 })
})

test("T-TR4 无在途上限：连发 20 条 → 20 条全落盘（零丢弃——A21 裁决）", async () => {
  const promises = []
  for (let i = 0; i < 20; i++) {
    promises.push(recordChatTrace({ name: "mock", model: "m" }, mkOpts([{ role: "user", content: `m${i}` }]), { content: "x" }, null))
  }
  await Promise.all(promises)
  assert.equal(traceFiles().length, 20, "20 条全部落盘（无在途上界——零丢弃）")
})

test("T-TR5 序号缓存：连续 3 次调用 → readdirSync 恰 1 次；seq 递增且不撞号", () => {
  let reads = 0
  _traceHooks.exists = () => true
  _traceHooks.readdir = () => { reads++; return ["abc-1.jsonl", "abc-7.jsonl"] }
  const d = "2026-09-12"
  const seqs = [nextTraceSeq(d), nextTraceSeq(d), nextTraceSeq(d)]
  assert.equal(reads, 1, "readdirSync 恰 1 次（序号缓存——不逐调用扫目录）")
  assert.deepEqual(seqs, [8, 9, 10], "从磁盘 max+1 递增预留（不撞既有号）")
})
