/**
 * cmd-copy.mjs tests — /copy command: last-assistant-content selection + registry sync.
 * writeClipboardText spawns OS utilities (external side effect) and is not unit-tested here.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { lastAssistantContent } from "../src/tui/cmd-copy.mjs"
import { HANDLERS, SLASH_COMMANDS } from "../src/tui/slash-commands.mjs"

test("/copy is registered in both the command list and handler table", () => {
  assert.equal(typeof HANDLERS["/copy"], "function", "/copy missing handler")
  assert.ok(SLASH_COMMANDS.some((c) => c.name === "/copy"), "/copy not listed in SLASH_COMMANDS")
})

test("lastAssistantContent: picks the most recent assistant text", () => {
  const history = [
    { role: "user", content: "hello" },
    { role: "assistant", content: "first answer" },
    { role: "user", content: "again" },
    { role: "assistant", content: "second answer" },
  ]
  assert.equal(lastAssistantContent(history), "second answer")
})

test("lastAssistantContent: skips tool-calls-only and whitespace-only assistant entries", () => {
  const history = [
    { role: "assistant", content: null, tool_calls: [{ id: "1" }] },
    { role: "assistant", content: "   " }, // whitespace-only — not a real reply
    { role: "assistant", content: "final answer" },
  ]
  assert.equal(lastAssistantContent(history), "final answer")
})

test("lastAssistantContent: ignores user / system reminder / transient messages", () => {
  const history = [
    { role: "user", content: "[System reminder: inject]" },
    { role: "assistant", content: "the answer" },
    { role: "user", content: "next" },
  ]
  assert.equal(lastAssistantContent(history), "the answer")
})

test("lastAssistantContent: null when no assistant text exists", () => {
  assert.equal(lastAssistantContent([]), null)
  assert.equal(lastAssistantContent(null), null)
  assert.equal(lastAssistantContent([{ role: "user", content: "only user" }]), null)
})