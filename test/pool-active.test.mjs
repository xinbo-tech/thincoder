// pool-active.test.mjs — 异步子代理池活跃判定（2026-09-05 走查缺陷修复：
// "子代理执行中主会话可继续使用"——loading/send 门控依据 poolActive()）。
import { test, before } from "node:test"
import assert from "node:assert/strict"
import { setupWebview } from "./helpers/webview-env.mjs"

let S
let poolActive

before(async () => {
  setupWebview()
  globalThis.acquireVsCodeApi = () => ({})
  const state = await import("../webview/state.js")
  S = state.S
  poolActive = state.poolActive
})

test("empty map → inactive", () => {
  S._subagentMap = {}
  assert.equal(poolActive(), false)
})

test("running entry → active", () => {
  S._subagentMap = { "explore#1": { status: "running" } }
  assert.equal(poolActive(), true)
})

test("started entry → active", () => {
  S._subagentMap = { "explore#1": { status: "started" } }
  assert.equal(poolActive(), true)
})

test("queued entry → active", () => {
  S._subagentMap = { "coder#2": { status: "queued" } }
  assert.equal(poolActive(), true)
})

test("done/error/cancelled entries → inactive", () => {
  S._subagentMap = {
    "explore#1": { status: "done" },
    "explore#2": { status: "error" },
    "explore#3": { status: "cancelled" },
  }
  assert.equal(poolActive(), false)
})

test("mixed (one still running) → active", () => {
  S._subagentMap = {
    "explore#1": { status: "done" },
    "coder#2": { status: "running" },
  }
  assert.equal(poolActive(), true)
})
