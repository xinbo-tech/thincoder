/**
 * eng-settlement.test.mjs — DESIGN-TOKEN-SETTLEMENT.md (2026-09-08) slot-authority ledger tests.
 * Covers the pure slot-mechanics layer of D1/D2/D4/D5/D6:
 *  - slot file = authoritative settlement ledger (setSlotEngDesignTokens / readSlotEngDesignTokens);
 *  - D4: spawn-gate resolveDesignSlot re-reads the authoritative slot on in-memory miss
 *    (a settle that already landed in the slot resolves for a same-session round whose
 *    per-run Map is empty → no `designId not found`);
 *  - D2 ①: consume-design explicitly clears the slot (subsequent spawn mechanically rejected);
 *  - D2 ③: an expired slot token never resolves AND is cleaned from the ledger at the gate;
 *  - D2/D6 (AC2): engTokensMergeForSave — an empty in-memory save keeps a settle-written slot
 *    value (never pins null); a non-empty but incomplete save UNIONS (slot-only settle-written
 *    tokens survive the busy-time save); same-key → later-minted token wins (评审 #3);
 *  - authorizeEngCoderDesignToken exact-token pass / wrong-token fail-closed.
 * The full suspension/digest/onComplete wiring is exercised by the real flow; these lock the
 * slot-authority primitives the flow depends on.
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import { newSlotData, saveSessionToSlot, setSlotEngDesignTokens } from "../src/extension/session-io.mjs"
import { readSlotEngDesignTokens, clearSlotEngDesignToken, engTokensMergeForSave } from "../src/extension/session-slot-write.mjs"
import { resolveDesignSlot, authorizeEngCoderDesignToken, executeConsumeDesignAction } from "../src/agent-tools/subagent-spawn-gate.mjs"

let sessionsDir
const cwd = "/proj/eng-settlement" // session filename is keyed by hash(cwd) under the isolated sessions dir
const slot = 1

const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
const expiredTok = () => `${randomUUID()}:${Date.now() - 3600e3}`

/** Create the slot file carrying the given engDesignTokens ledger ({designId: token}). */
function createSlot(tokensObj) {
  const data = newSlotData(cwd)
  if (tokensObj) data.engDesignTokens = tokensObj
  saveSessionToSlot(cwd, slot, data)
}
/** Minimal parent agent shape the gate reads: _engPersist binds the authoritative slot. */
const engAgent = (over = {}) => ({
  _engDesignTokens: null,
  _engPersist: { cwd, slot },
  config: { agent: { engineering: true } },
  ...over,
})

beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "engsettle-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

test("D1 ledger: setSlotEngDesignTokens persists, readSlotEngDesignTokens reads", () => {
  createSlot()
  const tok = liveTok()
  assert.equal(setSlotEngDesignTokens(cwd, slot, { d1: tok }), true)
  const read = readSlotEngDesignTokens(cwd, slot)
  assert.equal(read.engDesignTokens.d1, tok)
})

test("D4 spawn gate: resolveDesignSlot re-reads authoritative slot on in-memory miss", () => {
  // A settle already landed the token in the SLOT; this round's agent per-run Map is empty.
  const tok = liveTok()
  createSlot({ settled: tok })
  const agent = engAgent()
  const resolved = resolveDesignSlot(agent)
  assert.equal(resolved.token, tok) // no `designId not found`
  // Reconciled into the in-memory Map cache for the rest of this round.
  assert.equal(agent._engDesignTokens.get("settled"), tok)
})

test("D4 spawn gate: memory hit is used without touching the slot", () => {
  const tok = liveTok()
  createSlot({ a: tok })
  const agent = engAgent({ _engDesignTokens: new Map([["a", tok]]) })
  // Slot content differs from memory — memory wins while it holds the entry.
  setSlotEngDesignTokens(cwd, slot, { other: liveTok() })
  assert.equal(resolveDesignSlot(agent).token, tok)
})

test("resolveDesignSlot: not-found when the authoritative slot is empty", () => {
  createSlot()
  const agent = engAgent()
  assert.throws(() => resolveDesignSlot(agent), /Invalid or missing design token/)
  assert.throws(() => resolveDesignSlot(agent, "ghost"), /designId not found/)
})

test("resolveDesignSlot: multi-slot requires designId; exact designId resolves", () => {
  const ta = liveTok(), tb = liveTok()
  createSlot({ a: ta, b: tb })
  const agent = engAgent()
  assert.throws(() => resolveDesignSlot(agent), /Multiple approved designs/)
  assert.equal(resolveDesignSlot(agent, "a").token, ta)
  assert.equal(resolveDesignSlot(agent, "b").token, tb)
})

test("D2 ① consume-design explicitly clears the slot; subsequent spawn is rejected", () => {
  const ta = liveTok()
  createSlot({ a: ta })
  const agent = engAgent()
  const msg = executeConsumeDesignAction({ designId: "a" }, { agent })
  assert.match(msg, /closed out/)
  // Slot ledger cleared — a later spawn (fresh memory, empty Map) must not resurrect it.
  const read = readSlotEngDesignTokens(cwd, slot)
  assert.ok(read.engDesignTokens === undefined, "slot ledger cleared after consume")
  const fresh = engAgent()
  assert.throws(() => resolveDesignSlot(fresh, "a"), /designId not found/)
})

test("D2 ① consume-design single-session (no designId) clears the whole ledger", () => {
  const ta = liveTok()
  createSlot({ a: ta })
  const agent = engAgent({ _engDesignTokens: new Map([["a", ta]]) })
  assert.match(executeConsumeDesignAction({}, { agent }), /closed out/)
  assert.ok(readSlotEngDesignTokens(cwd, slot).engDesignTokens === undefined)
})

test("D2 ③ TTL: expired slot token never resolves and is cleaned from the ledger at the gate", () => {
  createSlot({ e: expiredTok() })
  const agent = engAgent()
  assert.throws(() => resolveDesignSlot(agent, "e"), /designId not found/)
  assert.throws(() => resolveDesignSlot(agent), /Invalid or missing design token/)
  // Gate-time reconcile removed the expired entry from the authoritative slot (D2 trigger③).
  assert.ok(readSlotEngDesignTokens(cwd, slot).engDesignTokens === undefined)
})

test("authorizeEngCoderDesignToken: exact token passes; wrong/missing rejected (fail-closed)", () => {
  const ta = liveTok()
  createSlot({ a: ta })
  const agent = engAgent()
  assert.doesNotThrow(() => authorizeEngCoderDesignToken(agent, "a", ta))
  assert.throws(() => authorizeEngCoderDesignToken(agent, "a", liveTok()), /Invalid or missing design token/)
  assert.throws(() => authorizeEngCoderDesignToken(agent, "a", "garbage"), /Invalid or missing design token/)
})

test("AC2 saveLines merge: empty in-memory save keeps a settle-written slot value (never pins null)", () => {
  const ta = liveTok()
  const slotVal = { settled: ta }
  // onComplete with an empty agentState (incoming null) over a slot that already has a
  // settle-written token → keep the slot value.
  assert.equal(engTokensMergeForSave(null, slotVal), slotVal)
  // abort/finally save (no engDesignTokens key → incoming undefined) → keep slot too.
  assert.equal(engTokensMergeForSave(undefined, slotVal), slotVal)
  // D6 union (评审 #2): a round that genuinely holds live tokens merges them into the slot —
  // the slot-only settle-written item survives beside the fresh in-memory one (was overwrite).
  const mem = { fresh: liveTok() }
  assert.deepEqual(engTokensMergeForSave(mem, slotVal), { settled: ta, fresh: mem.fresh })
  // Both empty → null (clean).
  assert.equal(engTokensMergeForSave(null, null), null)
  assert.equal(engTokensMergeForSave(null, undefined), null)
})

test("D6 busy-time union: incomplete in-memory save keeps the settle-written slot-only token", () => {
  // settle landed 9 in the SLOT while this round's in-memory Map (hydrated at round start) holds 8
  const slotTokens = {}
  for (let i = 0; i < 9; i++) slotTokens[`d${i}`] = liveTok()
  const memTokens = { ...slotTokens }
  delete memTokens.d8 // settle's just-landed token — absent from the in-memory save
  assert.deepEqual(engTokensMergeForSave(memTokens, slotTokens), slotTokens)
})

test("D6 same-key recency (评审 #3): the later-minted token wins — both directions", () => {
  const designId = "reused-design-id"
  const oldTok = `${randomUUID()}:${Date.now() + 60e3}`
  const newTok = `${randomUUID()}:${Date.now() + 3600e3}`
  // async re-review (F2h): settle landed the NEW token while memory holds the OLD → existing wins.
  assert.deepEqual(engTokensMergeForSave({ [designId]: oldTok }, { [designId]: newTok }), { [designId]: newTok })
  // Continuation round mints a NEW token into memory over the slot's OLD one → incoming wins.
  assert.deepEqual(engTokensMergeForSave({ [designId]: newTok }, { [designId]: oldTok }), { [designId]: newTok })
})

test("D6 tie/unparseable determinism: an in-memory value not provably newer never clobbers the slot", () => {
  const slotTok = liveTok()
  const exp = slotTok.slice(slotTok.lastIndexOf(":") + 1)
  // Same expiresAt / unparseable incoming → not provably newer → slot kept.
  assert.deepEqual(engTokensMergeForSave({ d: `${randomUUID()}:${exp}` }, { d: slotTok }), { d: slotTok })
  assert.deepEqual(engTokensMergeForSave({ d: "not-a-token" }, { d: slotTok }), { d: slotTok })
  assert.deepEqual(engTokensMergeForSave({ d: slotTok }, { d: "not-a-token" }), { d: slotTok })
})

test("clearSlotEngDesignToken removes one designId, keeps siblings", () => {
  const ta = liveTok(), tb = liveTok()
  createSlot({ a: ta, b: tb })
  assert.equal(clearSlotEngDesignToken(cwd, slot, "a"), true)
  const read = readSlotEngDesignTokens(cwd, slot)
  assert.equal(read.engDesignTokens.b, tb)
  assert.equal(read.engDesignTokens.a, undefined)
  // Unknown id → idempotent no-op false.
  assert.equal(clearSlotEngDesignToken(cwd, slot, "ghost"), false)
})
