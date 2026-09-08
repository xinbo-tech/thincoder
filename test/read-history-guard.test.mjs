/**
 * read-history-guard.test.mjs — read_history 跨会话深查双保险护栏测试（SESSION.md §13
 * D-R19a + L24——STRUCTURE-DEBT-BATCH-7——双端同构）：
 * ① 行扫第一道保留（READ_HISTORY_SCAN_MAX = 200,000 行——流式计数——超限 parse 前拒绝）；
 * ② 消息数第二道（parse 后 history.length > READ_HISTORY_MAX_MESSAGES = 50,000 即拒——
 *    JSON 单行槽行扫不设防——消息数预算补位——超限返回同一逐字定稿文案）；
 * ③ 正常查询不回归（小槽深查 keyword 过滤 / 恰好 50,000 边界放行 / 无 path 本会话缺省）。
 * 全部经 readHistoryTool.execute 公开面驱动（真实 writeFileSync 夹具槽——无 mock）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readHistoryTool } from "../src/agent-tools/read-history.mjs"

/** 超限错误文案（SESSION.md §13——逐字定稿——断言与实现同文案）。 */
const TOO_LARGE = JSON.stringify({ error: "session too large — refine keyword or since/until" })
const MAX_MSGS = 50_000
const MAX_LINES = 200_000

let dir, small, big, boundary, lineOver

before(() => {
  dir = mkdtempSync(join(tmpdir(), "rh-guard-"))
  const mk = (name, body) => {
    const p = join(dir, name)
    writeFileSync(p, body)
    return p
  }
  small = mk("small.json", JSON.stringify({
    history: [
      { role: "user", ts: 1, content: "alpha keyword one" },
      { role: "assistant", ts: 2, content: "beta reply" },
      { role: "user", ts: 3, content: "gamma keyword two" },
    ],
  }))
  // 单行 JSON 槽（无换行——行扫通过）——超限/边界夹具只在消息数上分
  const mkMessages = (n) => JSON.stringify({
    history: Array.from({ length: n }, (_, i) => ({ role: "user", content: `m${i}` })),
  })
  big = mk("big.json", mkMessages(MAX_MSGS + 1))
  boundary = mk("boundary.json", mkMessages(MAX_MSGS))
  // 超 200,000 行——行扫第一道必须 parse 前拒绝（内容非 JSON 也无妨——行扫先拒）
  lineOver = mk("lines.json", "x\n".repeat(MAX_LINES + 1))
})

after(() => {
  rmSync(dir, { recursive: true, force: true })
})

test("消息数第二道：>50,000 消息的单行 JSON 槽被拒——定稿文案（非 parse/结构错误）", () => {
  const out = readHistoryTool.execute({ path: big }, { agent: {} })
  assert.equal(out, TOO_LARGE)
})

test("消息数边界：恰好 50,000 消息放行——limit 窗口仍生效（newest 50）", () => {
  const out = readHistoryTool.execute({ path: boundary }, { agent: {} })
  const arr = JSON.parse(out)
  assert.ok(Array.isArray(arr))
  assert.equal(arr.length, 50)
  assert.equal(arr[0].content, `m${MAX_MSGS - 50}`) // newest 端起点（chronological 输出）
})

test("行扫第一道保留：>200,000 行的文件在 parse 前被拒——同一定稿文案", () => {
  const out = readHistoryTool.execute({ path: lineOver }, { agent: {} })
  assert.equal(out, TOO_LARGE)
})

test("正常查询不回归：小槽深查 keyword 命中/未命中 + 无 path 本会话缺省", () => {
  const hit = JSON.parse(readHistoryTool.execute({ path: small, keyword: "alpha" }, { agent: {} }))
  assert.equal(hit.length, 1)
  assert.equal(hit[0].role, "user")
  assert.equal(hit[0].content, "alpha keyword one")
  const miss = JSON.parse(readHistoryTool.execute({ path: small, keyword: "no-such-word" }, { agent: {} }))
  assert.equal(miss.length, 0)
  // 无 path → 本会话缺省（_fullHistory——零行为变化回归——T-R19.1）
  const local = JSON.parse(readHistoryTool.execute({}, {
    agent: { _fullHistory: [{ role: "user", ts: 1, content: "local talk" }] },
  }))
  assert.equal(local.length, 1)
  assert.equal(local[0].content, "local talk")
})
