/**
 * auto-approve.test.mjs — live autoApprove semantics (CLI parity):
 * approve-all / the AUTO button flip the flag MID-TURN; the permission gate,
 * the AUTO reminder injection, and post-compaction reinjection must all
 * re-read the LIVE flag instead of the startup snapshot.
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { reinjectAfterCompaction } from "../src/agent/run-helpers.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"
import { setSlotAutoApprove, newSlot, loadSlot, resumeSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"

// ─── Session-level persistence ─────────────────────────────────

describe("session-io — autoApprove slot field (CLI parity, no VS Code setting)", () => {
  let tmp, cwd
  beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "thincoder-auto-test-")); cwd = tmp; _setSessionsDirForTest(join(tmp, "sessions")) })
  afterEach(() => { _resetSessionsDirForTest(); rmSync(tmp, { recursive: true, force: true }) })

  it("newSlot defaults autoApprove to false", () => {
    const slot = newSlot(cwd)
    assert.equal(loadSlot(cwd, slot).autoApprove, false)
  })

  it("setSlotAutoApprove persists the flip and round-trips", () => {
    const slot = newSlot(cwd)
    assert.equal(setSlotAutoApprove(cwd, slot, true), true)
    assert.equal(loadSlot(cwd, slot).autoApprove, true)
    assert.equal(setSlotAutoApprove(cwd, slot, false), true)
    assert.equal(loadSlot(cwd, slot).autoApprove, false)
  })

  it("setSlotAutoApprove returns false for an unknown slot", () => {
    assert.equal(setSlotAutoApprove(cwd, 99, true), false)
  })

  it("resumeSlot-then-setSlotAutoApprove persists the AUTO flag (missing-file regression)", () => {
    // Real panel path: user clicks the AUTO button BEFORE any message. ensureSlot →
    // resumeSlot claims/allocates a slot for a fresh cwd, writing only the manifest. Prior
    // to the fix, resumeSlot never created the slot data file, so setSlotAutoApprove hit
    // `if (!data) return false` and silently dropped AUTO — the next turn read
    // `undefined ?? false` and tools still asked.
    const { slot } = resumeSlot(cwd)
    assert.equal(setSlotAutoApprove(cwd, slot, true), true, "setSlotAutoApprove must persist after a resumeSlot allocation")
    assert.equal(loadSlot(cwd, slot).autoApprove, true)
  })
})

// ─── Live flag in the agent loop ───────────────────────────────

describe("reinjectAfterCompaction — live getAuto() (not the startup snapshot)", () => {
  const AUTO = "[System reminder: AUTO mode is active — all tool calls are automatically approved without asking.]"
  const PERMISSION = "[System reminder: Permission mode — confirm with the user before making changes. Describe what you plan to modify and wait for approval before executing file-changing tools.]"

  function fakeAgent() { return { _tasks: [], _planMode: false } }

  it("reinjects the AUTO reminder when the live flag is on", () => {
    const history = []
    reinjectAfterCompaction(history, fakeAgent(), () => true)
    assert.equal(history.at(-1).content, AUTO)
  })

  it("reinjects the permission reminder when the live flag is off", () => {
    const history = []
    reinjectAfterCompaction(history, fakeAgent(), () => false)
    assert.equal(history.at(-1).content, PERMISSION)
  })

  it("uses the live flag, not the value at call time — flipped flag wins", () => {
    // A getter whose value flips after the call is constructed: the result must
    // reflect the flag at reinjection time (compaction can happen late in the turn).
    let auto = false
    const getAuto = () => auto
    const history = []
    auto = true // approve-all happened before compaction
    reinjectAfterCompaction(history, fakeAgent(), getAuto)
    assert.equal(history.at(-1).content, AUTO)
  })
})

// ─── Permission gate short-circuit in executeToolBatches ───────

describe("executeToolBatches — live getAuto() short-circuits the permission gate", () => {
  function makeWriteTool(executed) {
    return { name: "write", readonly: false, execute: async () => { executed.push(true); return "ok" } }
  }

  function makeAgent() {
    return {
      _planMode: false, _role: null, _engDesignToken: null, _engDesignReviewed: false,
      _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
      _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
      config: { agent: { engineering: false } },
    }
  }

  function makeResponse() {
    return { toolCalls: [{ id: "1", name: "write", arguments: JSON.stringify({ path: "x.mjs", content: "x" }) }] }
  }

  it("asks for permission while the live flag is off", async () => {
    const executed = []
    const asked = []
    await executeToolBatches(makeAgent(), {
      response: makeResponse(),
      history: [], fullHistory: [],
      toolByName: new Map([["write", makeWriteTool(executed)]]),
      getAuto: () => false,
      callbacks: { onPermissionRequired: async () => { asked.push(true); return true } },
      signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 0,
    })
    assert.equal(asked.length, 1)
    assert.equal(executed.length, 1)
  })

  it("skips the permission gate entirely while the live flag is on", async () => {
    const executed = []
    const asked = []
    await executeToolBatches(makeAgent(), {
      response: makeResponse(),
      history: [], fullHistory: [],
      toolByName: new Map([["write", makeWriteTool(executed)]]),
      getAuto: () => true,
      callbacks: { onPermissionRequired: async () => { asked.push(true); return true } },
      signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 0,
    })
    assert.equal(asked.length, 0)
    assert.equal(executed.length, 1)
  })

  it("mid-turn flip stops later prompts in the SAME batch run — the bug regression", async () => {
    // Two write tools in two serial batches. The first call happens while the flag
    // is off (prompt); the flag flips before the second (approve-all) — the second
    // must run silently.
    let auto = false
    const asked = []
    const executed = []
    const getAuto = () => auto
    const callbacks = {
      onPermissionRequired: async () => {
        asked.push(true)
        auto = true // user clicked "Approve All" in the prompt dialog
        return true
      },
    }
    await executeToolBatches(makeAgent(), {
      response: { toolCalls: [
        { id: "1", name: "write", arguments: JSON.stringify({ path: "a.mjs", content: "a" }) },
        { id: "2", name: "write", arguments: JSON.stringify({ path: "b.mjs", content: "b" }) },
      ] },
      history: [], fullHistory: [],
      toolByName: new Map([["write", makeWriteTool(executed)]]),
      getAuto, callbacks,
      signal: undefined, cwd: process.cwd(), recentSigs: [], depth: 0,
    })
    assert.equal(asked.length, 1, "only the first tool asked")
    assert.equal(executed.length, 2, "both tools ran")
  })
})
