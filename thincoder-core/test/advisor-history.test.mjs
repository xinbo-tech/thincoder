/**
 * advisor-history.test.mjs — advisor 历史抽取（核内单一实现；CORE-UNIFICATION S0a ·
 * 来源 = 两产品同名对，逐字节同 ⇒ 取一侧逐字节随迁）。
 * 行为面：响应表提取（向后取最近 / 向前 sinceIdx）· advisor.md 缺档回落内置判据 ·
 * 会话背景抽取（最近 maxTurns 轮 + system reminder 过滤）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ADVISOR_MD_PATH,
  extractAgentResponseTable,
  extractConversationBackground,
  loadAdvisorMd,
} from "../advisor/history.mjs"

const TABLE = "| # | Action | Detail |\n| 1 | Fixed | x |"

test("ADVISOR_MD_PATH is the project advisor.md", () => {
  assert.equal(ADVISOR_MD_PATH, ".thincoder/advisor.md")
})

test("backward scan returns the MOST RECENT response table", () => {
  const history = [
    { role: "assistant", content: TABLE + "\nold" },
    { role: "user", content: "again" },
    { role: "assistant", content: TABLE + "\nnew" },
  ]
  assert.ok(extractAgentResponseTable(history).includes("new"))
})

test("forward scan (sinceIdx) returns the first table at/after the index", () => {
  const history = [
    { role: "assistant", content: TABLE + "\nold" },
    { role: "assistant", content: TABLE + "\nnew" },
  ]
  assert.ok(extractAgentResponseTable(history, 1).includes("new"))
})

test("no table -> null; non-array -> null", () => {
  assert.equal(extractAgentResponseTable([{ role: "assistant", content: "no table" }]), null)
  assert.equal(extractAgentResponseTable(null), null)
})

test("loadAdvisorMd falls back to the built-in criteria when the project file is absent", () => {
  const criteria = loadAdvisorMd("Z:/definitely/not/here")
  assert.ok(criteria.startsWith("Review the code changes, focusing on:"))
  assert.ok(criteria.includes("Correctness"))
})

test("conversation background keeps the most recent exchanges, newest last, capped at maxTurns", () => {
  const history = [
    { role: "user", content: "u1" },
    { role: "assistant", content: "a1" },
    { role: "user", content: "u2" },
    { role: "assistant", content: "a2" },
    { role: "user", content: "u3" },
  ]
  const bg = extractConversationBackground(history, 2)
  assert.ok(bg.includes("User: u3"))
  assert.ok(bg.includes("User: u2"))
  assert.ok(bg.includes("Assistant: a2"))
  assert.ok(!bg.includes("u1"))
})

test("system-reminder / mode turns are filtered out of the background", () => {
  const bg = extractConversationBackground(
    [{ role: "user", content: "[System reminder: x]" }, { role: "user", content: "real" }],
    3,
  )
  assert.ok(!bg.includes("System reminder"))
  assert.ok(bg.includes("User: real"))
})

test("empty history -> null", () => {
  assert.equal(extractConversationBackground([]), null)
})
