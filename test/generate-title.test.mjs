/**
 * generate-title.mjs tests — F2 fix + silent-degradation cases (docs/design/SESSION.md §IK9UZ8-D test table).
 * Stubs globalThis.fetch so the request body and error paths are asserted without touching the network.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { generateTitle } from "../src/generate-title.mjs"

const PROVIDER = { apiKey: "k", baseURL: "https://example.com/v1", model: "deepseek-v4-pro" }
const USER = "help me build a todo app in react"

/** Swap globalThis.fetch for one test; returns a restore function. */
function mockFetch(handler) {
  const orig = globalThis.fetch
  globalThis.fetch = handler
  return () => { globalThis.fetch = orig }
}

test("T1: request body disables thinking and caps max_tokens at 100", async () => {
  let body = null
  const restore = mockFetch(async (_url, opts) => {
    body = JSON.parse(opts.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: "Build a todo app" } }] }), { status: 200 })
  })
  try {
    const title = await generateTitle(USER, PROVIDER)
    assert.equal(title, "Build a todo app")
    assert.deepEqual(body.thinking, { type: "disabled" })
    assert.equal(body.max_tokens, 100)
    assert.equal(body.stream, false)
  } finally {
    restore()
  }
})

test("T2: empty content returns null (silent degradation)", async () => {
  const restore = mockFetch(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "" } }] }), { status: 200 }))
  try {
    assert.equal(await generateTitle(USER, PROVIDER), null)
  } finally {
    restore()
  }
})

test("T3: HTTP 400 and network error return null (never throw)", async () => {
  let restore = mockFetch(async () => new Response("bad request", { status: 400 }))
  try {
    assert.equal(await generateTitle(USER, PROVIDER), null)
  } finally {
    restore()
  }

  restore = mockFetch(async () => { throw new Error("ECONNREFUSED") })
  try {
    assert.equal(await generateTitle(USER, PROVIDER), null)
  } finally {
    restore()
  }
})

test("short user text returns null without fetching", async () => {
  let called = false
  const restore = mockFetch(async () => { called = true; return new Response("{}", { status: 200 }) })
  try {
    assert.equal(await generateTitle("hi", PROVIDER), null)
    assert.equal(called, false)
  } finally {
    restore()
  }
})

test("proxy branch: provider.proxyUri routes through proxyFetch (import-path regression, 2026-08-30)", async () => {
  // 回归锁：曾经 dynamic import("../proxy.mjs") 从 src/ 解析到仓库根（不存在），
  // ERR_MODULE_NOT_FOUND 被 catch 吞掉——代理用户标题静默失效，且零测试覆盖。
  // 静态导入后模块加载失败会让全部 T1-T4 用例报错（路径回归第一道锁）；
  // 本用例经 _deps 缝锁定"proxyUri 存在 → 必须走 proxyFetch"（第二道锁）。
  const { _deps } = await import("../src/generate-title.mjs")
  const orig = _deps.proxyFetchImpl
  let viaProxy = false
  _deps.proxyFetchImpl = async () => {
    viaProxy = true
    return new Response(JSON.stringify({ choices: [{ message: { content: "Proxied title" } }] }), { status: 200 })
  }
  try {
    const title = await generateTitle(USER, { ...PROVIDER, proxyUri: "http://127.0.0.1:1" })
    assert.equal(title, "Proxied title")
    assert.equal(viaProxy, true, "provider.proxyUri 存在时必须经 proxyFetch")
  } finally {
    _deps.proxyFetchImpl = orig
  }
})