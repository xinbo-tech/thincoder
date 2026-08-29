/**
 * session-eng-advisor.test.mjs — engineering + advisor.guard are SESSION-level (2026-08-29).
 * CLI side of the cross-end fix: the flag used to live ONLY in global config.json, which the
 * VS Code extension also read/wrote — the two ends flipped each other's engineering mode.
 * Now: session slot = authority (shared with VS Code), config.json = mirror.
 *
 * Session files go to the real ~/.thincoder/sessions dir (configDir is fixed at import time);
 * a mkdtemp cwd hashes to a unique slot base — tests write only their own hash files and
 * clean up after (same pattern as session-migration.test.mjs).
 */
import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { createHash } from "node:crypto"
import { sessionPath, saveSession, loadSession, applySession, activeSlot } from "../src/session.mjs"

function slotBase(cwd) {
  const hash = createHash("sha1").update(cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")).digest("hex")
  return join(dirname(sessionPath(cwd)), `${hash}.json`)
}

function cleanup(cwd) {
  const base = slotBase(cwd)
  for (const suffix of ["", ".manifest", ".1", ".2", ".tmp"]) {
    try { rmSync(base + suffix, { force: true }) } catch {}
  }
}

function makeAgent(cwd) {
  return {
    cwd,
    config: { agent: { engineering: false }, advisor: { guard: false } },
    history: [], _fullHistory: [],
    _engDesignToken: null, _pendingReminders: [],
    title: "", tasks: [], planMode: false, autoApprove: false, goal: null,
  }
}

// ─── 1. /eng toggle dual-writes slot + config ───────────────────

describe("cmd-eng — /eng toggle dual-writes the session slot and the config mirror", () => {
  test("ON toggle writes slot.engineering=true (session authority) + config mirror", async () => {
    const { handleEngCommand } = await import("../src/tui/cmd-eng.mjs")
    const cwd = mkdtempSync(join(tmpdir(), "tc-eng-on-"))
    try {
      const agent = makeAgent(cwd)
      saveSession(agent) // seed the slot file — /eng always runs with a live session on disk
      const configWrites = []
      await handleEngCommand({
        agent,
        pushLine: () => {}, pushLabel: () => {},
        persistRaw: async (fn) => { const raw = {}; fn(raw); configWrites.push(raw) },
        showPicker: async () => ({ action: "create" }),
      })
      assert.equal(agent.config.agent.engineering, true, "live state flipped")
      const slot = activeSlot(cwd)
      const data = JSON.parse(readFileSync(`${slotBase(cwd)}.${slot}`, "utf8"))
      assert.equal(data.engineering, true, "slot (authority) written by /eng")
      assert.equal(configWrites[0]?.agent?.engineering, true, "config mirror written by /eng")
    } finally { cleanup(cwd) }
  })

  test("OFF toggle writes slot.engineering=false", async () => {
    const { handleEngCommand } = await import("../src/tui/cmd-eng.mjs")
    const cwd = mkdtempSync(join(tmpdir(), "tc-eng-off-"))
    try {
      const agent = makeAgent(cwd)
      agent.config.agent.engineering = true
      saveSession(agent)
      await handleEngCommand({
        agent,
        pushLine: () => {}, pushLabel: () => {},
        persistRaw: async () => {},
        showPicker: async () => null,
      })
      const slot = activeSlot(cwd)
      const data = JSON.parse(readFileSync(`${slotBase(cwd)}.${slot}`, "utf8"))
      assert.equal(data.engineering, false, "session-level OFF persisted to the slot")
    } finally { cleanup(cwd) }
  })
})

// ─── 2. applySession restores slot engineering + advisor.guard ──

describe("applySession — slot engineering / advisor.guard restore (CLI startup parity)", () => {
  test("slot engineering=true + advisor.guard=true override the config-seeded agent", () => {
    const cwd = mkdtempSync(join(tmpdir(), "tc-apply-eng-"))
    try {
      const agent = makeAgent(cwd) // config says engineering:false / guard:false
      saveSession(agent)
      // External writer (e.g. VS Code) flips the flags in the slot file directly
      const p = `${slotBase(cwd)}.${activeSlot(cwd)}`
      const data = JSON.parse(readFileSync(p, "utf8"))
      data.engineering = true
      data.advisor = { guard: true }
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, JSON.stringify(data))
      const restored = loadSession(cwd)
      const fresh = makeAgent(cwd)
      applySession(fresh, restored)
      assert.equal(fresh.config.agent.engineering, true, "slot value wins on resume")
      assert.equal(fresh.config.advisor.guard, true, "advisor guard restored from the slot")
    } finally { cleanup(cwd) }
  })

  test("LEGACY slot without engineering field → config value survives (compat lock)", () => {
    const cwd = mkdtempSync(join(tmpdir(), "tc-apply-legacy-"))
    try {
      const agent = makeAgent(cwd)
      agent.config.agent.engineering = true // config-seeded
      saveSession(agent)
      // Strip the new fields — simulating a pre-2026-08-29 slot file
      const p = `${slotBase(cwd)}.${activeSlot(cwd)}`
      const data = JSON.parse(readFileSync(p, "utf8"))
      delete data.engineering
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, JSON.stringify(data))
      const restored = loadSession(cwd)
      const fresh = makeAgent(cwd)
      fresh.config.agent.engineering = true
      applySession(fresh, restored)
      assert.equal(fresh.config.agent.engineering, true, "no field in slot → config fallback intact")
    } finally { cleanup(cwd) }
  })

  test("slot engineering=false explicitly overrides a config-seeded true (not treated as missing)", () => {
    const cwd = mkdtempSync(join(tmpdir(), "tc-apply-explicit-"))
    try {
      const agent = makeAgent(cwd)
      saveSession(agent)
      const p = `${slotBase(cwd)}.${activeSlot(cwd)}`
      const data = JSON.parse(readFileSync(p, "utf8"))
      data.engineering = false
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, JSON.stringify(data))
      const fresh = makeAgent(cwd)
      fresh.config.agent.engineering = true // config says ON (e.g. global toggle)
      applySession(fresh, loadSession(cwd))
      assert.equal(fresh.config.agent.engineering, false, "explicit slot false wins over config true")
    } finally { cleanup(cwd) }
  })
})

// ─── 3. saveSession round-trips the live flags into the slot ────

test("saveSession stamps the live engineering/advisor config into the slot every turn-end", () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-save-eng-"))
  try {
    const agent = makeAgent(cwd)
    agent.config.agent.engineering = true
    agent.config.advisor = { guard: true, model: "glm-5.3" }
    saveSession(agent)
    const data = JSON.parse(readFileSync(`${slotBase(cwd)}.${activeSlot(cwd)}`, "utf8"))
    assert.equal(data.engineering, true)
    assert.equal(data.advisor.guard, true)
    assert.equal(data.advisor.model, "glm-5.3")
  } finally { cleanup(cwd) }
})

// ─── 4. /advisor guard toggle dual-writes the slot ──────────────

describe("cmd-advisor — guard toggle dual-writes the session slot and the config mirror", () => {
  test("guard ON → slot.advisor.guard=true + config mirror; model/thinking stay config-scoped", async () => {
    const { handleAdvisorCommand } = await import("../src/tui/cmd-advisor.mjs")
    const cwd = mkdtempSync(join(tmpdir(), "tc-adv-guard-"))
    try {
      const agent = makeAgent(cwd)
      agent.provider = { model: "deepseek-v4-pro" }
      saveSession(agent) // seed the slot file
      const configWrites = []
      let picks = 0
      await handleAdvisorCommand({
        agent,
        pushLine: () => {}, pushLabel: () => {},
        persistRaw: async (fn) => { const raw = {}; fn(raw); configWrites.push(raw) },
        showPicker: async () => (picks++ === 0 ? { type: "item", text: "Advisor: off", action: "guard" } : null),
      })
      const slot = activeSlot(cwd)
      const data = JSON.parse(readFileSync(`${slotBase(cwd)}.${slot}`, "utf8"))
      assert.equal(data.advisor.guard, true, "slot (authority) written by the guard toggle")
      assert.equal(configWrites.at(-1)?.agent?.advisor?.guard, true, "config mirror written")
    } finally { cleanup(cwd) }
  })
})
