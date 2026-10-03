/**
 * 2026-10-04-issue-fix-round2.test.mjs — issue 修复批·二（ACP 协议面）批内单测件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-04-issue-fix-round2.test.mjs`
 *
 * 射程 = 设计档 `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §2（逐条目标形）∥ §10（用例 T1–T20）：
 *   T1–T3  `usage_update` 形状（#871a）· T4–T5 `session/list` 条目（#871b）
 *   T6–T8  `configOptions` 全形（#873）· T9–T14 会话身份 + 两通知（#872）
 *   T15–T20 `resource_link`（#870）。
 * 沙箱纪律：HOME ∥ USERPROFILE → 临时目录（**一切（动态）import 之前**）；槽面经核
 *   `_setSessionsDirForTest` 缝 + config 面经 `_setConfigPathForTest` 缝——核件经
 *   `thincoder-cli/node_modules/@thincoder/core/` 取（**与 CLI 侧同一模块实例**——缝才生效；
 *   先例 = `2026-10-03-default-model-carryover.test.mjs`）。零网络 ∥ 零真实 LLM
 *   （`createSession` 桩注入——`buildAcpHandlers` 既有注入口）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readdirSync, rmSync, truncateSync, writeFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT_URL = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const SANDBOX_HOME = mkdtempSync(join(tmpdir(), "acp2-home-"))
process.env.HOME = SANDBOX_HOME
process.env.USERPROFILE = SANDBOX_HOME
const SESS_DIR = join(SANDBOX_HOME, "sessions")

const mod = (rel) => import(new URL(rel, ROOT_URL).href)
const coreMod = (rel) => import(new URL(`thincoder-cli/node_modules/@thincoder/core/${rel}`, ROOT_URL).href)
const created = []
const tmpDir = (tag) => { const d = mkdtempSync(join(tmpdir(), `acp2-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) }
after(() => { cleanup(); rmSync(SANDBOX_HOME, { recursive: true, force: true }) })

const coreSession = await coreMod("session.mjs")
const slots = await coreMod("session-slots.mjs")
const cfg = await coreMod("config.mjs")
slots._setSessionsDirForTest(SESS_DIR)
cfg._setConfigPathForTest(join(SANDBOX_HOME, "config.json"))

/** ACP 装配面（直驱 `buildAcpHandlers`——唯一外部契约；凭据门以注入 isConfigured 过）。 */
async function buildAcp(opts = {}) {
  const acp = await mod("thincoder-cli/src/acp.mjs")
  return acp.buildAcpHandlers({ isConfigured: () => true, ...opts })
}
/** 会话桩（agent 形态 = 投影/applySession 消费面最小集；run/cancel 记数）。
 *  `cwd` = load/resume 装载面对 agent 的硬需求（`applySession` 钉槽分支读 `agent.cwd`）。 */
function mkStubSession(id, { provider = { name: "p1", model: "kimi-k3" }, cwd } = {}) {
  const session = {
    id,
    cancelled: 0,
    runs: [],
    agent: { ...(cwd ? { cwd } : {}), provider: { ...provider }, planMode: false, config: {} },
    run: async (input) => { session.runs.push(input) },
    cancel() { session.cancelled++ },
    busy: false,
  }
  return session
}

// ─── T1–T3 · #871a `usage_update` 形状 ───────────────────────────────────────

test("T1 usage_update·正常：kimi-k3 ⇒ {used:150,size:1000000}", async () => {
  const { buildAcpCallbacks } = await mod("thincoder-cli/src/acp/bridge.mjs")
  const notes = []
  const cb = buildAcpCallbacks({ sessionId: "1", agent: { provider: { model: "kimi-k3" } }, notify: (m, p) => notes.push({ m, p }), request: async () => {} })
  cb.onUsage({ prompt_tokens: 100, completion_tokens: 50 })
  console.log(`[读数] T1: ${JSON.stringify(notes)}`)
  assert.equal(notes[0].m, "session/update")
  assert.deepEqual(notes[0].p, { sessionId: "1", update: { sessionUpdate: "usage_update", used: 150, size: 1_000_000 } })
})

test("T2 usage_update·边界：缺字段 ∥ {} ∥ 无参 ⇒ used 0 · 零抛", async () => {
  const { buildAcpCallbacks } = await mod("thincoder-cli/src/acp/bridge.mjs")
  const notes = []
  const cb = buildAcpCallbacks({ sessionId: "1", agent: { provider: { model: "kimi-k3" } }, notify: (m, p) => notes.push({ m, p }), request: async () => {} })
  cb.onUsage({})
  cb.onUsage()
  cb.onUsage({ prompt_tokens: 7 })
  console.log(`[读数] T2: ${JSON.stringify(notes.map((n) => n.p.update))}`)
  assert.deepEqual(notes[0].p.update, { sessionUpdate: "usage_update", used: 0, size: 1_000_000 })
  assert.deepEqual(notes[1].p.update, { sessionUpdate: "usage_update", used: 0, size: 1_000_000 })
  assert.equal(notes[2].p.update.used, 7)
})

test("T3 usage_update·边界：未知模型 ∥ 无 provider ⇒ size = 128000 兜底", async () => {
  const { buildAcpCallbacks } = await mod("thincoder-cli/src/acp/bridge.mjs")
  const notes = []
  const mk = (agent) => buildAcpCallbacks({ sessionId: "1", ...(agent ? { agent } : {}), notify: (m, p) => notes.push(p), request: async () => {} })
  mk({ provider: { model: "mystery-model-xyz" } }).onUsage({ prompt_tokens: 1 })
  mk(null).onUsage({ prompt_tokens: 1 }) // 无 agent（直驱既调用面）
  console.log(`[读数] T3: sizes=${notes.map((n) => n.update.size).join(",")}`)
  assert.equal(notes[0].update.size, 128_000)
  assert.equal(notes[1].update.size, 128_000)
})

// ─── T4–T5 · #871b `session/list` 条目 ───────────────────────────────────────

test("T4 session/list·正常：updatedAt = ISO 往返恒等；messageCount 键不在", async () => {
  const cwd = tmpDir("t4-cwd")
  await coreSession.newSession(cwd)
  const built = await buildAcp({ cwd: () => cwd })
  const r = built.handlers["session/list"]({})
  const e = r.sessions[0]
  console.log(`[读数] T4: ${JSON.stringify(e)}`)
  assert.equal(r.sessions.length, 1)
  assert.equal(typeof e.updatedAt, "string", "updatedAt = ISO 字符串")
  assert.equal(new Date(e.updatedAt).toISOString(), e.updatedAt, "对发射值往返恒等")
  assert.equal("messageCount" in e, false, "messageCount 键不在")
  assert.deepEqual(Object.keys(e).sort(), ["cwd", "sessionId", "title", "updatedAt"])
  cleanup()
})

/** T5 夹具：`handlers-slots` 的协作面桩（`listSlots` 返回非有限 ∥ 超域 `updatedAt`）。
 *  真实管线全链 `isNum` 守卫（`session-slot-scan.mjs` mergeFields / `session-slots.mjs`
 *  `meta.updatedAt ?? meta.ts`）⇒ 非有限值经公开管线不可达（超域有限值须手改/损坏槽档
 *  方达——设计 §11 登记）；单测以解析钩子提供第二模块实例 + 桩模块（协作面桩 = 单测
 *  正当手法；`registerHooks` 先例 = 面板批内件）。 */
let t5Armed = false
function armT5Stub() {
  if (t5Armed) return
  t5Armed = true
  const shimDir = mkdtempSync(join(tmpdir(), "acp2-t5-shim-"))
  created.push(shimDir)
  const realSession = new URL("thincoder-cli/node_modules/@thincoder/core/session.mjs", ROOT_URL).href
  const shimFile = join(shimDir, "session-stub.mjs")
  writeFileSync(shimFile, `export * from ${JSON.stringify(realSession)}\nexport function listSlots() { return [
  { slot: 42, updatedAt: NaN, title: "stub" },
  { slot: 43, updatedAt: 9e15, title: "big" },
  { slot: 44, updatedAt: -9e15, title: "neg" },
  { slot: 45, updatedAt: 8.64e15, title: "edge" },
] }\n`, "utf8")
  const shimUrl = pathToFileURL(shimFile).href
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "@thincoder/core/session.mjs" && context.parentURL?.includes("handlers-slots.mjs?t5-stub")) {
        return { url: shimUrl, shortCircuit: true }
      }
      return nextResolve(specifier, context)
    },
  })
}

test("T5 session/list·边界：meta updatedAt 非有限 ∥ 超域 ⇒ 键缺席（含 JSON 序列化面）；list 零抛", async () => {
  armT5Stub()
  const hs = await mod("thincoder-cli/src/acp/handlers-slots.mjs?t5-stub")
  const handlers = hs.createSlotsHandlers({
    getCwd: () => tmpDir("t5-cwd"), sessions: new Map(),
    notifyRef: { current: () => {} }, requestRef: { current: async () => {} },
    createSession: async ({ id }) => mkStubSession(id),
    requireConfigured: () => ({}), releaseClosedSlot: () => {}, log: () => {},
  })
  let r
  assert.doesNotThrow(() => { r = handlers["session/list"]({}) }, "list 零抛（非法 ∥ 超域不入 toISOString）")
  console.log(`[读数] T5: ${JSON.stringify(r.sessions)}`)
  assert.equal(r.sessions.length, 4)
  assert.equal(r.sessions[0].updatedAt, undefined, "非有限（NaN）⇒ undefined")
  assert.equal(r.sessions[1].updatedAt, undefined, "超域（9e15）⇒ undefined")
  assert.equal(r.sessions[2].updatedAt, undefined, "超域（−9e15）⇒ undefined")
  assert.equal(typeof r.sessions[3].updatedAt, "string", "边界 |v| = 8.64e15 域内 ⇒ ISO（含 ≤ 判）")
  assert.equal(new Date(r.sessions[3].updatedAt).toISOString(), r.sessions[3].updatedAt, "对发射值往返恒等")
  for (const [i, e] of r.sessions.slice(0, 3).entries()) {
    assert.equal("updatedAt" in JSON.parse(JSON.stringify(e)), false, `JSON 序列化键缺席（[${i}]）`)
  }
  assert.equal(r.sessions[0].sessionId, "42")
})

// ─── T6–T8 · #873 `configOptions` 全形 ──────────────────────────────────────

const assertFullShape = (opts, label) => {
  assert.ok(Array.isArray(opts) && opts.length > 0, `${label}: configOptions 数组`)
  for (const o of opts) {
    assert.equal(typeof o.id, "string", `${label}: id`)
    assert.equal(typeof o.name, "string", `${label}: name`)
    assert.ok(o.type === "select" || o.type === "boolean", `${label}: 判别键 type`)
    assert.ok("currentValue" in o, `${label}: currentValue`)
    if (o.type === "select") {
      assert.ok(Array.isArray(o.options) && o.options.length > 0, `${label}: select options`)
      for (const x of o.options) { assert.equal(typeof x.value, "string"); assert.equal(typeof x.name, "string") }
    }
  }
}

test("T6 set_config_option·正常：model/thinking/mode 各一次 ⇒ 响应全形（判别键/现值/options）", async () => {
  const built = await buildAcp()
  built.sessions.set("1", mkStubSession("1"))
  const r1 = built.handlers["session/set_config_option"]({ sessionId: "1", configId: "model", value: "p1:m2" })
  console.log(`[读数] T6 model: ${JSON.stringify(r1.configOptions)}`)
  assert.equal(r1.error, undefined)
  assertFullShape(r1.configOptions, "T6")
  const model = r1.configOptions.find((o) => o.id === "model")
  assert.equal(model.type, "select"); assert.equal(model.currentValue, "p1:m2")
  assert.deepEqual(model.options, [{ value: "p1:m2", name: "p1:m2" }])
  assert.equal(r1.configOptions.find((o) => o.id === "thinking").type, "boolean")
  assert.equal(r1.configOptions.find((o) => o.id === "mode").currentValue, "normal")
  const r2 = built.handlers["session/set_config_option"]({ sessionId: "1", configId: "thinking", value: false })
  assert.equal(r2.configOptions.find((o) => o.id === "thinking").currentValue, false, "off 形 ⇒ false")
  const r3 = built.handlers["session/set_config_option"]({ sessionId: "1", configId: "mode", value: "plan" })
  assert.equal(r3.configOptions.find((o) => o.id === "mode").currentValue, "plan")
})

test("T7 响应同源·正常：new ∥ load ∥ resume 的 configOptions 同形", async () => {
  const cwd = tmpDir("t7-cwd")
  await coreSession.newSession(cwd)
  const built = await buildAcp({ cwd: () => cwd, createSession: async ({ id }) => mkStubSession(id, { cwd }) })
  const rNew = await built.handlers["session/new"]({})
  const rLoad = await built.handlers["session/load"]({ sessionId: "1" })
  const rResume = await built.handlers["session/resume"]({ sessionId: "1" })
  console.log(`[读数] T7: new=${JSON.stringify(rNew.configOptions)} loadKeys=${JSON.stringify(Object.keys(rLoad))}`)
  assert.deepEqual(Object.keys(rNew).sort(), ["configOptions", "sessionId"])
  assert.deepEqual(Object.keys(rLoad), ["configOptions"])
  assert.deepEqual(Object.keys(rResume), ["configOptions"])
  for (const [label, r] of [["new", rNew], ["load", rLoad], ["resume", rResume]]) assertFullShape(r.configOptions, `T7-${label}`)
  assert.deepEqual(rLoad.configOptions, rNew.configOptions)
  assert.deepEqual(rResume.configOptions, rNew.configOptions)
  cleanup()
})

test("T8 configOptions·边界：provider 无 model ⇒ model 项缺席；thinking/mode 在", async () => {
  const built = await buildAcp()
  built.sessions.set("1", mkStubSession("1", { provider: { name: "p1" } }))
  const r = built.handlers["session/set_config_option"]({ sessionId: "1", configId: "mode", value: "normal" })
  console.log(`[读数] T8: ${JSON.stringify(r.configOptions.map((o) => o.id))}`)
  assert.deepEqual(r.configOptions.map((o) => o.id), ["thinking", "mode"])
})

// ─── T9–T14 · #872 会话身份 + 两通知 ────────────────────────────────────────

test("T9 会话身份·正常：new id = 槽号串 ∈ list 集；失败 new 回滚（零孤儿槽）", async () => {
  const cwd = tmpDir("t9-cwd")
  const built = await buildAcp({ cwd: () => cwd, createSession: async ({ id }) => mkStubSession(id, { cwd }) })
  const rNew = await built.handlers["session/new"]({})
  console.log(`[读数] T9: id=${rNew.sessionId}`)
  assert.match(rNew.sessionId, /^\d+$/, "id = 槽号串")
  assert.ok(built.handlers["session/list"]({}).sessions.some((s) => s.sessionId === rNew.sessionId), "不变量：new id ∈ 随后 list")
  const filesBefore = readdirSync(SESS_DIR)
  const built2 = await buildAcp({ cwd: () => cwd, createSession: async () => { throw new Error("assemble-boom") } })
  const rFail = await built2.handlers["session/new"]({})
  assert.equal(rFail.error.code, -32603, "createSession 抛错 ⇒ 内部错误")
  const built3 = await buildAcp({ cwd: () => cwd, createSession: async () => ({ id: "x", agent: { _providerInvalid: true, _providerInvalidReason: "no baseURL" }, cancel() {}, run: async () => {}, busy: false }) })
  const rBad = await built3.handlers["session/new"]({})
  assert.equal(rBad.error.code, -32000, "_providerInvalid 分支")
  console.log(`[读数] T9 回滚: before=${filesBefore.length} after=${readdirSync(SESS_DIR).length}`)
  assert.deepEqual(readdirSync(SESS_DIR), filesBefore, "回滚：认领槽零留存")
  cleanup()
})

test("T10 会话身份·正常：new → 新 handler 实例（模拟跨进程）load(同 id) → 原 id prompt 全链命中", async () => {
  const cwd = tmpDir("t10-cwd")
  const a = await buildAcp({ cwd: () => cwd, createSession: async ({ id }) => mkStubSession(id, { cwd }) })
  const id1 = (await a.handlers["session/new"]({})).sessionId
  const id2 = (await a.handlers["session/new"]({})).sessionId
  assert.notEqual(id1, id2, "夹具 = 双槽（旧分配器与槽号分离可证伪）")
  const b = await buildAcp({ cwd: () => cwd, createSession: async ({ id }) => mkStubSession(id, { cwd }) })
  const rLoad = await b.handlers["session/load"]({ sessionId: id2 })
  console.log(`[读数] T10: id2=${id2} loadErr=${JSON.stringify(rLoad.error ?? null)} keys=${JSON.stringify([...b.sessions.keys()])}`)
  assert.equal(rLoad.error, undefined)
  const rPrompt = await b.handlers["session/prompt"]({ sessionId: id2, prompt: [{ type: "text", text: "hi" }] })
  assert.equal(rPrompt.error, undefined, "无 unknown session")
  assert.equal(rPrompt.stopReason, "end_turn")
  assert.deepEqual(b.sessions.get(id2).runs, ["hi"])
  cleanup()
})

test("T11 会话身份·正常：resume(同 id) → 原 id cancel/close 命中；close 后认领释放", async () => {
  const cwd = tmpDir("t11-cwd")
  await coreSession.newSession(cwd)
  const slot = await coreSession.newSession(cwd)
  const id = String(slot)
  assert.notEqual(id, "1", "夹具 = 第二槽（旧分配器与槽号分离可证伪）")
  const built = await buildAcp({ cwd: () => cwd, createSession: async ({ id }) => mkStubSession(id, { cwd }) })
  const rResume = await built.handlers["session/resume"]({ sessionId: id })
  console.log(`[读数] T11: resumeErr=${JSON.stringify(rResume.error ?? null)} id=${id}`)
  assert.equal(rResume.error, undefined)
  const s = built.sessions.get(id)
  assert.ok(s, "原 id 命中（呼应 list 槽号）")
  assert.equal(built.handlers["session/cancel"]({ sessionId: id }).error, undefined)
  assert.equal(s.cancelled, 1)
  assert.deepEqual(built.handlers["session/close"]({ sessionId: id }), {})
  assert.equal(s.cancelled, 2)
  assert.equal(built.sessions.has(id), false)
  const m = coreSession.loadManifest(cwd)
  assert.equal(m.slotSessions?.[slot], undefined, "close 后认领已释放")
  cleanup()
})

test("T12 会话身份·边界：同 id 二次 load ⇒ 替换；拒载形 ⇒ 零副作用保留；delete→new 回收槽号 ⇒ 旧实例被处置", async () => {
  const cwd = tmpDir("t12-cwd")
  const slot = await coreSession.newSession(cwd)
  const id = String(slot)
  const built = await buildAcp({ cwd: () => cwd, createSession: async ({ id }) => mkStubSession(id, { cwd }) })
  await built.handlers["session/load"]({ sessionId: id })
  const first = built.sessions.get(id)
  await built.handlers["session/load"]({ sessionId: id })
  console.log(`[读数] T12: first.cancelled=${first.cancelled} size=${built.sessions.size}`)
  assert.equal(first.cancelled, 1, "旧实例被替换（cancel 被调）")
  assert.notEqual(built.sessions.get(id), first)
  assert.equal(built.sessions.size, 1, "Map 单条（同 id 唯一）")
  // 拒载形①：槽文件缺失 ⇒ 前置判据拒载 ⇒ 旧实例保留（cancel 未触——零副作用）
  const second = built.sessions.get(id)
  rmSync(coreSession.slotPath(cwd, slot))
  const rMissing = await built.handlers["session/load"]({ sessionId: id })
  assert.match(rMissing.error.message, /not found/)
  assert.equal(built.sessions.get(id), second, "旧实例保留")
  assert.equal(second.cancelled, 0, "拒载路径：cancel 未触")
  // 拒载形②：工程模式拒载（槽带 engineering + 项目档不可解析）⇒ 旧实例保留
  const slot2 = await coreSession.newSession(cwd)
  const id2 = String(slot2)
  writeFileSync(coreSession.slotPath(cwd, slot2), JSON.stringify({ version: 2, cwd, title: "", updatedAt: Date.now(), history: [], contextHistory: [], engineering: true }))
  const rFirstEng = await built.handlers["session/load"]({ sessionId: id2 })
  const third = built.sessions.get(id2)
  assert.equal(rFirstEng.error, undefined, "工程槽初次装载（项目档自动建档）")
  assert.ok(third)
  writeFileSync(join(cwd, "PROJECT-MANIFEST.json"), "{{{ not json")
  const rEng = await built.handlers["session/load"]({ sessionId: id2 })
  console.log(`[读数] T12 工程拒载: ${JSON.stringify(rEng.error?.code ?? null)}`)
  assert.ok(rEng.error, "工程模式拒载")
  assert.equal(built.sessions.get(id2), third, "旧实例保留")
  assert.equal(third.cancelled, 0, "拒载路径：cancel 未触")
  // ── delete→new 回收槽号（旧实例键 = 槽号串、`_slot` 已分离——换钉支）⇒ 旧实例被处置 ──
  // 夹具（全真实流）：① 预置槽 1（无在存实例）；② new 得槽 2；③ delete(1) 留孔；④ delete(2)
  // 触发重钉——newSession 取最低空号 = 1 ⇒ 旧实例键 "2" / _slot = 1（分离）；⑤ new 复得回收
  // 号 2 ⇒ 撞同键在存实例。处置判据：cancel 被调 ∥ Map 单条 ∥ 旧认领释放（位次 = set 后）。
  const cwd2 = tmpDir("t12b-cwd")
  await coreSession.newSession(cwd2)
  const built2 = await buildAcp({ cwd: () => cwd2, createSession: async ({ id }) => mkStubSession(id, { cwd: cwd2 }) })
  const rB = await built2.handlers["session/new"]({})
  const s2 = built2.sessions.get(rB.sessionId)
  await built2.handlers["session/delete"]({ sessionId: "1" })
  await built2.handlers["session/delete"]({ sessionId: rB.sessionId })
  assert.equal(s2.agent._slot, 1, "夹具：旧实例 _slot 已与键分离（换钉）")
  const rR = await built2.handlers["session/new"]({})
  const fresh = built2.sessions.get(rR.sessionId)
  const m2 = coreSession.loadManifest(cwd2)
  console.log(`[读数] T12 delete→new: recycled=${rR.sessionId} cancelled=${s2.cancelled} size=${built2.sessions.size} claims=${JSON.stringify(m2.slotSessions)}`)
  assert.equal(rR.sessionId, rB.sessionId, "夹具：槽号回收（同号复得）")
  assert.equal(s2.cancelled, 1, "旧实例被处置（cancel 被调——close 同法）")
  assert.ok(fresh && fresh !== s2, "同键新实例在存")
  assert.equal(built2.sessions.size, 1, "Map 单条（同键唯一）")
  assert.equal(m2.slotSessions?.[1], undefined, "旧实例认领已释放（释放位次 = sessions.set/committed 后）")
  assert.ok(m2.slotSessions?.[2], "新会话认领保留（保留集含新槽——先释后装即误释此键）")
  const rP = await built2.handlers["session/prompt"]({ sessionId: rR.sessionId, prompt: [{ type: "text", text: "hi" }] })
  assert.equal(rP.stopReason, "end_turn", "新会话正常")
  assert.deepEqual(fresh.runs, ["hi"])
  cleanup()
})

test("T13 通知·正常：set_mode ⇒ currentModeId（非 mode）", async () => {
  const notes = []
  const built = await buildAcp({ notify: (m, p) => notes.push({ m, p }) })
  built.sessions.set("1", mkStubSession("1"))
  const r = built.handlers["session/set_mode"]({ sessionId: "1", mode: "plan" })
  console.log(`[读数] T13: ${JSON.stringify(notes)}`)
  assert.deepEqual(r, {})
  assert.equal(notes.length, 1)
  assert.equal(notes[0].p.update.sessionUpdate, "current_mode_update")
  assert.equal(notes[0].p.update.currentModeId, "plan")
  assert.equal("mode" in notes[0].p.update, false)
})

test("T14 通知·正常：set_config_option ⇒ configOptions 全量数组（非 {configId,value}）", async () => {
  const notes = []
  const built = await buildAcp({ notify: (m, p) => notes.push({ m, p }) })
  built.sessions.set("1", mkStubSession("1"))
  const r = built.handlers["session/set_config_option"]({ sessionId: "1", configId: "thinking", value: true })
  const upd = notes[0].p.update
  console.log(`[读数] T14: ${JSON.stringify(upd)}`)
  assert.equal(upd.sessionUpdate, "config_option_update")
  assert.ok(Array.isArray(upd.configOptions), "全量数组")
  assert.equal("configId" in upd, false); assert.equal("value" in upd, false)
  assert.deepEqual(upd.configOptions, r.configOptions, "通知与响应同源")
})

// ─── T15–T20 · #870 `resource_link` ─────────────────────────────────────────

const rl = () => mod("thincoder-cli/src/acp/resource-link.mjs")
const seg = async (blocks, cwd, f) => (await rl()).buildPromptText(blocks, { cwd })

test("T15 resource_link·正常：文本在前 + 整文内联；仅引用（无 text）可走", async () => {
  const cwd = tmpDir("t15-cwd")
  const f = join(cwd, "note.md")
  writeFileSync(f, "alpha\nbeta\n")
  const uri = pathToFileURL(f).href
  const text = await seg([{ type: "text", text: "hello" }, { type: "resource_link", uri, name: "note.md" }], cwd)
  console.log(`[读数] T15: ${JSON.stringify(text)}`)
  assert.ok(text.startsWith("hello\n\n[File: "), "文本段在前")
  assert.ok(text.includes(`[File: ${f}]`), "路径 = 解码后解析的绝对路径")
  assert.ok(text.includes("```\nalpha\nbeta\n```"), "围栏全文（无语言标记）")
  const only = await seg([{ type: "resource_link", uri, name: "note.md" }], cwd)
  assert.ok(only.startsWith("[File: "), "仅引用可走")
  const built = await buildAcp({ cwd: () => cwd })
  built.sessions.set("1", mkStubSession("1"))
  const r = await built.handlers["session/prompt"]({ sessionId: "1", prompt: [{ type: "text", text: "hello" }, { type: "resource_link", uri }] })
  assert.equal(r.stopReason, "end_turn")
  assert.equal(built.sessions.get("1").runs[0], text, "接线：run 收聚合文本")
  cleanup()
})

test("T16 resource_link·边界：#L10-L20 ∥ #L5:15 ∥ 尾越界截断（选区行数正确）", async () => {
  const cwd = tmpDir("t16-cwd")
  const f = join(cwd, "lines.txt")
  const lines = Array.from({ length: 30 }, (_, i) => `L${i + 1}`)
  writeFileSync(f, lines.join("\n") + "\n")
  const uriOf = (hash) => pathToFileURL(f).href + hash
  const body = (s) => s.split("```")[1].replace(/^\n/, "").replace(/\n$/, "")
  const s1 = await seg([{ type: "resource_link", uri: uriOf("#L10-L20") }], cwd)
  console.log(`[读数] T16: ${JSON.stringify(s1.slice(0, 60))}`)
  assert.ok(s1.startsWith(`[File: ${f} lines 10–20]`), "选区头（en dash）")
  assert.deepEqual(body(s1).split("\n"), lines.slice(9, 20), "行数正确（11 行）")
  const s2 = await seg([{ type: "resource_link", uri: uriOf("#L5:15") }], cwd)
  assert.ok(s2.startsWith(`[File: ${f} lines 5–15]`))
  assert.deepEqual(body(s2).split("\n"), lines.slice(4, 15))
  const s3 = await seg([{ type: "resource_link", uri: uriOf("#L28-L99") }], cwd)
  assert.ok(s3.startsWith(`[File: ${f} lines 28–30]`), "尾越界截到总行数")
  assert.deepEqual(body(s3).split("\n"), lines.slice(27, 30))
  const s4 = await seg([{ type: "resource_link", uri: uriOf("#L29") }], cwd)
  assert.ok(s4.startsWith(`[File: ${f} lines 29–29]`), "单行形")
  cleanup()
})

test("T17 resource_link·边界：百分号编码 ∥ 盘符形 ∥ 相对路径按 cwd", async () => {
  const cwd = tmpDir("t17-cwd")
  mkdirSync(join(cwd, "rel"), { recursive: true })
  writeFileSync(join(cwd, "a b.md"), "spaced")
  writeFileSync(join(cwd, "drive.md"), "driven")
  writeFileSync(join(cwd, "rel", "sub.txt"), "relative")
  const pct = await seg([{ type: "resource_link", uri: pathToFileURL(join(cwd, "a b.md")).href }], cwd)
  console.log(`[读数] T17 pct: ${JSON.stringify(pct.split("\n")[0])}`)
  assert.ok(pct.includes(`[File: ${join(cwd, "a b.md")}]`) && pct.includes("spaced"), "百分号编码解码")
  const drive = join(cwd, "drive.md")
  const driveUri = `file:///${drive.replace(/\\/g, "/")}` // 盘符形：/C:/… → 剥前导 /
  assert.match(driveUri, /^file:\/\/\/[A-Za-z]:/, "夹具 = 盘符形")
  const d = await seg([{ type: "resource_link", uri: driveUri }], cwd)
  assert.ok(d.includes(`[File: ${drive}]`) && d.includes("driven"), "盘符剥前导 / 后正确解析")
  const rel = await seg([{ type: "resource_link", uri: "rel/sub.txt" }], cwd)
  assert.ok(rel.includes(`[File: ${join(cwd, "rel", "sub.txt")}]`) && rel.includes("relative"), "相对路径按 cwd 解析")
  cleanup()
})

test("T18 resource_link·降级：五类标记逐词表（不中断）", async () => {
  const cwd = tmpDir("t18-cwd")
  const f = join(cwd, "short.txt")
  writeFileSync(f, "one\ntwo\nthree\n")
  const m = (block) => seg([{ type: "resource_link", ...block }], cwd)
  const rUnreadable = await m({ uri: pathToFileURL(join(cwd, "nope.md")).href })
  const rZed = await m({ uri: "zed://buffer/1" })
  const rHttp = await m({ uri: "https://example.com/x.txt" })
  const rSel = await m({ uri: pathToFileURL(f).href + "#L5-L2" })
  const rRange = await m({ uri: pathToFileURL(f).href + "#L9" })
  console.log(`[读数] T18: ${JSON.stringify([rZed, rSel])}`)
  assert.equal(rUnreadable, `[File reference: ${join(cwd, "nope.md")} — unreadable]`)
  assert.equal(rZed, "[File reference: zed://buffer/1 — unsupported scheme]")
  assert.equal(rHttp, "[File reference: https://example.com/x.txt — unsupported scheme]")
  assert.equal(rSel, `[File reference: ${f} — invalid selection]`)
  assert.equal(rRange, `[File reference: ${f} — lines out of range]`)
  cleanup()
})

test("T19 resource_link·上限：行 ∥ 字符 ∥ NUL ∥ 字节（sparse 造件）", async () => {
  const cwd = tmpDir("t19-cwd")
  const m = (file) => seg([{ type: "resource_link", uri: pathToFileURL(file).href }], cwd)
  const big = join(cwd, "big.txt")
  writeFileSync(big, Array.from({ length: 2001 }, (_, i) => `L${i + 1}`).join("\n"))
  const longf = join(cwd, "long.txt")
  writeFileSync(longf, "x".repeat(100_001))
  const nul = join(cwd, "nul.bin")
  writeFileSync(nul, Buffer.from([0x61, 0x00, 0x62]))
  const huge = join(cwd, "huge.bin")
  writeFileSync(huge, "s")
  truncateSync(huge, 10 * 1024 * 1024 + 1)
  const rBig = await m(big); const rLong = await m(longf); const rNul = await m(nul); const rHuge = await m(huge)
  console.log(`[读数] T19: ${JSON.stringify([rBig, rLong, rNul, rHuge].map((s) => s.slice(s.indexOf("—") + 2, -1)))}`)
  assert.equal(rBig, `[File reference: ${big} — too many lines (>2000)]`)
  assert.equal(rLong, `[File reference: ${longf} — too long (>100000 chars)]`)
  assert.equal(rNul, `[File reference: ${nul} — binary (NUL byte)]`)
  assert.equal(rHuge, `[File reference: ${huge} — too large (>10MB)]`)
  cleanup()
})

test("T20 resource_link·错误：空 prompt ∥ 仅 image ⇒ -32602（文案收正）；畸形首块不吞后续合法块", async () => {
  const built = await buildAcp()
  built.sessions.set("1", mkStubSession("1"))
  const r1 = await built.handlers["session/prompt"]({ sessionId: "1", prompt: [] })
  const r2 = await built.handlers["session/prompt"]({ sessionId: "1", prompt: [{ type: "image", data: "x", mimeType: "image/png" }] })
  console.log(`[读数] T20: ${JSON.stringify(r1)}`)
  assert.equal(r1.error.code, -32602)
  assert.equal(r1.error.message, "prompt requires a text or resource_link content block")
  assert.equal(r2.error.code, -32602)
  const r3 = await built.handlers["session/prompt"]({ sessionId: "1", prompt: [{ type: "text", text: 7 }, { type: "text", text: "ok" }] })
  assert.equal(r3.stopReason, "end_turn", "首个合法 text 块（畸形首块不吞）")
  assert.equal(built.sessions.get("1").runs.at(-1), "ok")
})
