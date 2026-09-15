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
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import { newSlotData, saveSessionToSlot, setSlotEngDesignTokens } from "../src/extension/session-io.mjs"
import { readSlotEngDesignTokens, clearSlotEngDesignToken, engTokensMergeForSave } from "../src/extension/session-slot-write.mjs"
import { resolveDesignSlot, authorizeEngCoderDesignToken, executeConsumeDesignAction } from "../src/agent-tools/subagent.mjs"
// W12（2026-09-15）：advisor 镜像删旧——逐族注入器（injectAdvisorResult / injectEscalateResult）
// 退役；F-2 四例所驱的端侧统一注入器（本档 subagent-async.mjs，W13 面）保留——跨族预算面改指
// 核统一注入器 `injectAsyncResult`（`@thincoder/core/agent-tools/subagent.mjs`）。
import { injectAsyncResult, DIGEST_INJECT_BUDGET } from "../src/agent-tools/subagent-async.mjs"
import { injectAsyncResult as injectAsyncResultCore } from "@thincoder/core/agent-tools/subagent.mjs"
// W9（2026-09-15）：digest 预算单源 = 核 `agent-tools/digest-budget.mjs`——落盘目录 = 核
// `configDir/tool-results`（原 VSC 面 `<cwd>/.thincoder/tmp` 退役）；测试沙箱 = 核缝
// `_setDigestOffloadDirForTest`（原「cwd 即沙箱」形状随之退役）。
import { _setDigestOffloadDirForTest } from "@thincoder/core/agent-tools/digest-budget.mjs"

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

// ─── BATCH-3-STRUCTURE F-2：digest 注入批量预算（VSC 镜像——2026-09-09）───
// 用例表 1:1（与 CLI async-settle.test.mjs 同尺寸钉死）：3 条 pending 30K+30K+40K（合计
// 100K > 64K）→ 后条清单行（报告已落盘 <path>——不 inline 全文——path 来源钉死）；累计恰
// 64K → 全部 inline（预算含边界）；单条 ≤64K 不回归 + 空轮 no-op。digest 轮 = 同 history
// 连续注入（无他人落史——pushReal 每次恰 +1）；预算状态键 = 载体（W9 起：核 digest-budget
// 以传入对象为键、经 `键.history.length` 判轮；VSC 注入器以 history 为 WeakMap 键合成
// 稳定键——见 async-settle.mjs digestBudgetKey）。落盘目录 = 核 `configDir/tool-results`
// （W9 单源化——原 VSC 面 `<cwd>/.thincoder/tmp` 退役）——沙箱经核缝 `_setDigestOffloadDirForTest`。

/** 最小 history 载体（数组 + 墓碑 Map——injectAsyncResult 读写的面）。 */
function mkHistory() {
  const h = []
  h._asyncTombstones = new Map()
  return h
}

test("F-2 超预算：单 digest 轮 30K+30K+40K（100K > 64K）→ 后条清单行不 inline（全文落盘 path 钉死）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "eng-digest-"))
  const offload = join(cwd, "tool-results")
  _setDigestOffloadDirForTest(offload) // 沙箱（核缝；落盘目录 = 核 configDir/tool-results 的测试替代）
  try {
    const history = mkHistory()
    const ctx = { history, fullHistory: [], cwd }
    const mkBig = (id, ch, n) => ({ id, role: "explore", report: ch.repeat(n), error: null })
    await injectAsyncResult(mkBig(1, "A", 30000), ctx)
    await injectAsyncResult(mkBig(2, "B", 30000), ctx)
    await injectAsyncResult(mkBig(3, "C", 40000), ctx)
    assert.equal(history.length, 3)
    assert.ok(history[0].content.includes("A".repeat(200)), "首条 30K inline")
    assert.ok(history[1].content.includes("B".repeat(200)), "次条 30K inline（累计 60K ≤ 64K）")
    const third = history[2].content
    assert.ok(!third.includes("C".repeat(200)), "第三条不 inline 全文")
    const m = third.match(/saved to disk[^:]*: (.+)/)
    assert.ok(m, "清单行含落盘 path（报告已落盘 <path> 形态）")
    const file = m[1].trim().split(/\n/)[0]
    assert.ok(file.startsWith(offload), "path 来源 = 核落盘目录（沙箱 override 下）")
    assert.equal(readFileSync(file, "utf8"), "C".repeat(40000), "清单行指向的文件 = 第三条全文")
    // 轮复位：他人落史（下一请求窗口）→ 预算清零——后续单条照旧 inline
    history.push({ role: "user", content: "next turn" })
    await injectAsyncResult(mkBig(4, "D", 20000), ctx)
    assert.equal(history.length, 5)
    assert.ok(history[4].content.includes("D".repeat(200)), "新轮（累计不跨轮残留）")
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F-2 边界：累计恰 64K（32K+32K）全部 inline——预算含边界（≤ 判定）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "eng-digest-"))
  try {
    assert.equal(DIGEST_INJECT_BUDGET, 65536, "预算常量 64K")
    const history = mkHistory()
    const ctx = { history, fullHistory: [], cwd }
    const mkBig = (id, ch, n) => ({ id, role: "explore", report: ch.repeat(n), error: null })
    await injectAsyncResult(mkBig(1, "A", 32768), ctx)
    await injectAsyncResult(mkBig(2, "B", 32768), ctx)
    assert.equal(history.length, 2)
    assert.ok(history[0].content.includes("A".repeat(200)), "首条 inline")
    assert.ok(history[1].content.includes("B".repeat(200)), "65536 ≤ 64K——含边界全 inline")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F-2 单条 ≤64K 不回归 + 空轮 no-op：预算不跨 history 残留（轮隔离）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "eng-digest-"))
  try {
    const heavy = mkHistory()
    await injectAsyncResult({ id: 1, role: "explore", report: "A".repeat(60000), error: null }, { history: heavy, fullHistory: [], cwd })
    assert.ok(heavy[0].content.includes("A".repeat(200)), "单条 60K inline")
    // 空轮（无 pending → 无注入调用）不改变任何状态——新 history 首条即新轮：恒 inline
    const fresh = mkHistory()
    await injectAsyncResult({ id: 1, role: "explore", report: "B".repeat(30000), error: null }, { history: fresh, fullHistory: [], cwd })
    assert.equal(fresh.length, 1)
    assert.ok(fresh[0].content.includes("B".repeat(200)), "单条 ≤64K 不回归（预算按 history 隔离——heavy 轮不泄漏）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F-2 落盘失败兜底：persist 失败 → 回退常规 inline（不吞报告不抛——结果零丢失）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "eng-digest-"))
  try {
    // W9：落盘目录 = 核落盘根（override 沙箱）——「目录不可建」构造：父路径是文件
    const blocker = join(cwd, "offload-blocker")
    writeFileSync(blocker, "blocker", "utf8")
    _setDigestOffloadDirForTest(join(blocker, "sub"))
    const history = mkHistory()
    const ctx = { history, fullHistory: [], cwd }
    await injectAsyncResult({ id: 1, role: "explore", report: "A".repeat(30000), error: null }, ctx)
    await injectAsyncResult({ id: 2, role: "explore", report: "C".repeat(40000), error: null }, ctx) // 累计 70K > 64K → 超限 → 落盘失败兜底
    assert.equal(history.length, 2, "两注均入史（中途不抛——余条不丢）")
    assert.ok(history[0].content.includes("A".repeat(200)), "首条 inline")
    assert.ok(history[1].content.includes("C".repeat(200)), "兜底：全文 inline——报告不丢")
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── 群 B 批 B5（§16 D-DG2——AGENT-LOOP.md §16）：四族接线（T-DG3 —— W12 改判）───
// W12（2026-09-15）：T-DG1（同族 advisor 双条）/ T-DG2（escalate/consult 族标签面）退役——其
// 断言对象 = 端侧逐族注入器（随 advisor 镜像删旧）；预算单源（核 `digestBudgetOver`）的**跨族**
// 面由下方 T-DG3 直驱核统一注入器继续锁（同族面由本档 F-2 四例的核单源预算面承载）。

test("T-DG3 边界：跨族同轮共享预算（subagent 40K + advisor 40K）→ 次条判超（单源记账）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "eng-digest-"))
  const offload = join(cwd, "tool-results")
  _setDigestOffloadDirForTest(offload)
  try {
    // 载体适配（W12）：核注入器消费 `{ history, _fullHistory }`（pushReal 双线）+ 稳定键
    // （核 digest 轮预算按载体累计——同轮多条合计面）。
    const carrier = { history: mkHistory(), _fullHistory: [] }
    await injectAsyncResultCore(carrier, { id: 21, role: "explore", report: "E".repeat(40000), error: null })
    await injectAsyncResultCore(carrier, { id: 22, role: "advisor", reviewType: "code", report: "F".repeat(40000), error: null })
    assert.ok(carrier.history[0].content.includes("E".repeat(200)), "首条（subagent）inline")
    assert.ok(!carrier.history[1].content.includes("F".repeat(200)), "次条（advisor）判超——跨族合计（共享预算单源）")
    const file = carrier.history[1].content.match(/saved to disk[^:]*: (.+)/)[1].trim().split(/\n/)[0]
    assert.ok(file.includes("async-subagent-22"), "落盘 tag = 核单源形态（async-subagent-<id>）")
    assert.equal(readFileSync(file, "utf8"), "F".repeat(40000), "次条全文落盘")
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(cwd, { recursive: true, force: true })
  }
})

