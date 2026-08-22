/**
 * sse.mjs tests — defensive tool_calls parsing (PROVIDER.md §10, GitHub thincoder#2).
 * Locks: null/malformed elements skipped+counted, name-less slots dropped, missing id
 * synthesized, non-string arguments JSON.stringify'd, _warnings surfaced.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { readSSE } from "../src/provider/sse.mjs"

const deltaChunk = (d) => JSON.stringify({ id: "1", choices: [{ delta: d }] })

function sseResponse(payloads) {
  const body = payloads.map((p) => `data: ${p}\n\n`).join("") + "data: [DONE]\n\n"
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } })
}

const parse = (payloads) => readSSE(sseResponse(payloads), {})

test("T1: null element skipped + counted; valid tool call kept", async () => {
  const r = await parse([
    deltaChunk({ tool_calls: [null, { index: 0, id: "a", function: { name: "read", arguments: "{}" } }] }),
  ])
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].name, "read")
  assert.equal(r.toolCalls[0].id, "a")
  assert.equal(r.droppedToolCalls, 1)
  assert.ok(r._warnings.some((w) => w.name === "malformed-tool-calls"))
})

test("T2: tool call missing function (no name) is dropped", async () => {
  const r = await parse([deltaChunk({ tool_calls: [{ index: 0, id: "a" }] })])
  assert.equal(r.toolCalls.length, 0)
  assert.equal(r.droppedToolCalls, 1)
})

test("T3: split arguments merge by id + tail continuation", async () => {
  const r = await parse([
    deltaChunk({ tool_calls: [{ id: "call_1", function: { name: "read", arguments: '{"a":' } }] }),
    deltaChunk({ tool_calls: [{ function: { arguments: "1}" } }] }),
  ])
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].name, "read")
  assert.equal(r.toolCalls[0].arguments, '{"a":1}')
})

test("T4: missing id synthesized to call_N", async () => {
  const r = await parse([deltaChunk({ tool_calls: [{ index: 0, function: { name: "read", arguments: "{}" } }] })])
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].id, "call_0")
  assert.equal(r.toolCalls[0].name, "read")
})

test("T5: function: null does not throw, dropped + counted", async () => {
  const r = await parse([deltaChunk({ tool_calls: [{ index: 0, id: "a", function: null }] })])
  assert.equal(r.toolCalls.length, 0)
  assert.equal(r.droppedToolCalls, 1)
})

test("T6: non-string arguments JSON.stringify'd", async () => {
  const r = await parse([deltaChunk({ tool_calls: [{ index: 0, id: "a", function: { name: "read", arguments: { path: "x" } } }] })])
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].arguments, '{"path":"x"}')
})

test("T7: mixed payload — valid keeps, malformed counted, single warning", async () => {
  const r = await parse([
    deltaChunk({ tool_calls: [
      { index: 0, id: "a", function: { name: "read", arguments: "{}" } },
      null,
      { index: 2 },
    ] }),
  ])
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].name, "read")
  assert.equal(r.droppedToolCalls, 2)
  assert.equal(r._warnings.filter((w) => w.name === "malformed-tool-calls").length, 1)
})
test("T8: synthesized id avoids colliding with an explicit call_N id", async () => {
  const r = await parse([
    deltaChunk({ tool_calls: [
      { index: 0, id: "call_1", function: { name: "a", arguments: "{}" } },
      { index: 1, function: { name: "b", arguments: "{}" } },
    ] }),
  ])
  assert.equal(r.toolCalls.length, 2)
  assert.equal(r.toolCalls[0].id, "call_1")
  assert.equal(r.toolCalls[1].id, "call_0") // not the colliding "call_1"
})

test("non-SSE single-chunk JSON response is also defended", async () => {
  const body = JSON.stringify({ choices: [{ delta: { tool_calls: [null, { index: 0, id: "a", function: { name: "read", arguments: "{}" } }] }, finish_reason: "tool_calls" }] })
  const resp = new Response(body, { status: 200, headers: { "content-type": "application/json" } })
  const r = await readSSE(resp, {})
  assert.equal(r.toolCalls.length, 1)
  assert.equal(r.toolCalls[0].name, "read")
  assert.equal(r.droppedToolCalls, 1)
})