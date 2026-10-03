/**
 * 2026-10-03-default-model-carryover.test.mjs — 会话选定写回批（#880）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-03-default-model-carryover.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿（批档 §2 批内用例设计 :78-88 + 设计档 `docs/core/design/SESSION.md` §6.21 判据句 6）：
 *   T1 选定写回正径（红 → 绿）：真 `createAgentHost` + 真槽 + 真 `setPrefs` ⇒ 回执 `ok:true` ∧
 *       `providerState` 在场（第四刷新点）∧ 读盘 `defaultModel === "p1:m2"`（验收①口径）∧ 槽写照旧
 *   T2 新会话起点（红 → 绿）：写回后 `loadConfig()` 运行时解析 = `provider.name` p1 ∕ `provider.model` m2 ∕
 *       `providerState` ok（新槽无源 ⇒ `defaultModel` 档入选——核 `resolveProviderPlan` 实跑；验收②口径）
 *   T3 负控两径：回声（同值重发 ⇒ 槽面零实变 ⇒ 零写）＋ 复合等值（选定串 == 现值 ⇒ 零写——防盘面抖动
 *       ∥ 探针空转）；两径证据 = config 内容逐字同 ∧ mtime 零动
 *   T4 档位径负控：`{ effort:"off" }` 径 ⇒ 回执**无** `providerState` 键 ∧ `defaultModel` 不变
 *   T5 失败不反扑：config 路径指向目录（读/写必失败）⇒ 回执仍 `ok:true` ∧ 槽已写 ∧ `console.error` 记错
 *       ∧ 零进程抛
 *   T6 渲染面消费（红 → 绿）：`createComposerWire` 桩桥——`session:prefs` 成功回执携 `providerState` ⇒
 *       store 切片写入；键缺席 ⇒ 零写（负向锁）
 *   T7 源判据（结构机检）：触发支调用 ∥ 槽面实变门 ∥ 槽面 `changed` 判据 ∥ 写回单点在档（防「只活在本用例」）
 * 纪律：只读面 ∕ 行为断言（真核件优先——桩只在「非射程面」：写后探针桩 = 零网）；⌛ 面（真机读数）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（T6 取件链：`composer-wire → badges → subagent-reduce → /rc/…`）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const tmpDir = (name) => mkdtempSync(join(tmpdir(), name))
const settle = async (fn, ms = 2000) => {
  const t0 = Date.now()
  while (!fn()) { if (Date.now() - t0 > ms) throw new Error("settle timeout"); await new Promise((r) => setTimeout(r, 5)) }
}

// 核面取件走桌面 node_modules 路径（与桌面档同一模块实例——先例 = `2026-10-03-desktop-firstrun-provider-notice.test.mjs:40-43`）：
// 配置缝 / 解析实读 / 槽读面 / 探针桩四件与 main 侧代码同装载面（缝才生效）。
const cfgIo = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")
const coreCfg = await mod("thincoder-desktop/node_modules/@thincoder/core/config.mjs")
const coreSession = await mod("thincoder-desktop/node_modules/@thincoder/core/session.mjs")
const probeMod = await mod("thincoder-desktop/node_modules/@thincoder/core/provider/list-models.mjs")
const [agentHostMod, sessionSlotsMod] = await Promise.all([
  mod("thincoder-desktop/src/main/agent-host.mjs"),
  mod("thincoder-desktop/src/main/session-slots.mjs"),
])

/** 渠夹具（持 key ∧ 有单值模型 —— 写回后 config 级解析可成立）。 */
const P1 = { name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }

/** 真核数据层夹具：写临时 config ⇒ `loadConfig()` 实读（同 `#840` 同径）。 */
function withConfig(obj) {
  const file = join(tmpDir("dmc-cfg-"), "config.json")
  writeFileSync(file, JSON.stringify(obj))
  cfgIo._setConfigPathForTest(file)
  return file
}

/** 真宿主（装配面放必抛哨 —— `setPrefs` 决不该装配）。 */
const makeHost = (cwd) => agentHostMod.createAgentHost({
  emit: () => {},
  projects: { currentCwd: () => cwd },
  assemble: async () => { throw new Error("assemble must not run in setPrefs path") },
  run: async () => {},
})

/** 写后探针桩（零网 ∥ 不阻断写——同 `#840` T3 口径）。 */
const stubProbe = () => probeMod._setProbeImplForTest(async () => ({ ok: false, error: "probe stub" }))
const resetSeams = () => {
  probeMod._setProbeImplForTest(null)
  cfgIo._resetConfigPathForTest()
  sessionSlotsMod._resetSessionsDirForTest()
}

/** 公共夹具：临时 config + 临时 sessions 根 + 真新槽 + 真宿主。 */
async function fixture(config, name) {
  const cfgFile = withConfig(config)
  sessionSlotsMod._setSessionsDirForTest(tmpDir(`dmc-${name}-sessions-`))
  const cwd = tmpDir(`dmc-${name}-cwd-`)
  const slot = await sessionSlotsMod.newSession(cwd)
  return { cfgFile, cwd, slot, key: String(slot), host: makeHost(cwd) }
}

/** config 档面「零写」双证：内容逐字 ∧ mtime 零动。 */
const zeroWriteEvidence = (file) => ({ content: readFileSync(file, "utf8"), mtime: statSync(file).mtimeMs })

// ─── T1 · 选定写回正径（红 → 绿）────────────────────────────────────────────

test("T1 选定写回正径：setPrefs ⇒ 回执 providerState 在场 ∧ 读盘 defaultModel = p1:m2 ∧ 槽写照旧", async () => {
  const { cwd, slot, key, host } = await fixture({ providers: [P1] }, "t1")
  stubProbe()
  try {
    const receipt = host.setPrefs(key, { provider: "p1", model: "m2" })
    assert.equal(receipt.ok, true, "回执 ok:true")
    assert.equal(typeof receipt.providerState, "object", "选定写回径成功回执携 providerState（第四刷新点——写后核读）")
    assert.equal(receipt.providerState.state, "ok", "写后核读：三态 = ok")
    assert.equal(receipt.providerState.channel, "p1", "写后核读：channel = p1")
    assert.equal(receipt.providerState.model, "m2", "写后核读：model = m2")
    assert.equal(coreCfg.loadConfig().defaultModel, "p1:m2", "读盘实写回：defaultModel = p1:m2（验收①口径）")
    assert.equal(receipt.meta.model, "m2", "槽写照旧：回执 meta（与 history:page 同源同形）")
    assert.equal(receipt.meta.provider, "p1", "槽写照旧：meta.provider")
    assert.equal(coreSession.loadSlotFile(cwd, slot).activeModel, "m2", "槽面实读：activeModel = m2")
  } finally {
    resetSeams()
  }
})

// ─── T2 · 新会话起点（红 → 绿）──────────────────────────────────────────────

test("T2 新会话起点：写回后 loadConfig() 解析 = p1 ∕ m2 ∕ ok；新槽无源前提", async () => {
  const { cwd, key, host } = await fixture({ providers: [P1] }, "t2")
  stubProbe()
  try {
    assert.equal(host.setPrefs(key, { provider: "p1", model: "m2" }).ok, true, "写回径受理")
    const cfg = coreCfg.loadConfig()
    assert.equal(cfg.defaultModel, "p1:m2", "盘面：defaultModel = p1:m2")
    assert.equal(cfg.provider?.name, "p1", "运行时解析：provider.name = p1（新会话起点）")
    assert.equal(cfg.provider?.model, "m2", "运行时解析：provider.model = m2")
    assert.equal(cfg.providerState, "ok", "运行时解析：providerState = ok")
    // 前提（取数链另一腿）：新槽无会话级源 ⇒ `defaultModel` 档入选（核 `resolveProviderPlan` 实跑口径）。
    const fresh = await sessionSlotsMod.newSession(cwd)
    const freshData = coreSession.loadSlotFile(cwd, fresh)
    assert.equal(freshData.activeProvider ?? null, null, "新槽无 activeProvider（槽面无源 —— 前提）")
    assert.equal(freshData.activeModel ?? null, null, "新槽无 activeModel（槽面无源 —— 前提）")
  } finally {
    resetSeams()
  }
})

// ─── T3 · 负控两径：回声 ∥ 复合等值（两径皆零写）────────────────────────────

test("T3 负控两径：回声（同值重发）∥ 复合等值（选定串 == 现值）⇒ config 零写（内容 ∥ mtime 双证）", async () => {
  const { cwd, slot, key, host } = await fixture({ providers: [P1], defaultModel: "p1:keep" }, "t3")
  stubProbe()
  try {
    // 槽面先置 p1:m1（直写核口 —— 不经选定写回径）
    assert.equal(sessionSlotsMod.writeSlotPrefs(cwd, slot, { provider: "p1", model: "m1" }).ok, true, "槽面先置 p1:m1")
    // ① 回声：同值重发 ⇒ 槽面零实变 ⇒ 零写（系统同步不劫持全局默认）
    const firstFile = withConfig({ providers: [P1], defaultModel: "p1:keep" })
    const first = zeroWriteEvidence(firstFile)
    const echo = host.setPrefs(key, { provider: "p1", model: "m1" })
    assert.equal(echo.ok, true, "回声径受理（回执照 ok）")
    const afterEcho = zeroWriteEvidence(firstFile)
    assert.equal(afterEcho.content, first.content, "回声：config 内容逐字零写")
    assert.equal(afterEcho.mtime, first.mtime, "回声：config mtime 零动")
    assert.equal(coreCfg.loadConfig().defaultModel, "p1:keep", "回声：defaultModel 保持 p1:keep")
    // ② 复合等值：槽 m1 → m2 实变，而选定串 == defaultModel 现值 ⇒ 零写（防盘面抖动 ∥ 探针空转）
    const secondFile = withConfig({ providers: [P1], defaultModel: "p1:m2" })
    const second = zeroWriteEvidence(secondFile)
    const equal = host.setPrefs(key, { provider: "p1", model: "m2" })
    assert.equal(equal.ok, true, "复合等值径受理（回执照 ok）")
    const afterEqual = zeroWriteEvidence(secondFile)
    assert.equal(afterEqual.content, second.content, "复合等值：config 内容逐字零写")
    assert.equal(afterEqual.mtime, second.mtime, "复合等值：config mtime 零动")
  } finally {
    resetSeams()
  }
})

// ─── T4 · 档位径负控 ────────────────────────────────────────────────────────

test("T4 档位径负控：{ effort } 径 ⇒ 回执无 providerState 键 ∧ defaultModel 不变", async () => {
  const { key, host } = await fixture({ providers: [P1], defaultModel: "p1:m1" }, "t4")
  stubProbe()
  try {
    const receipt = host.setPrefs(key, { effort: "off" })
    assert.equal(receipt.ok, true, "档位径受理")
    assert.equal("providerState" in receipt, false, "档位径：回执无 providerState 键（负向锁）")
    assert.equal(coreCfg.loadConfig().defaultModel, "p1:m1", "档位径：defaultModel 不变")
  } finally {
    resetSeams()
  }
})

// ─── T5 · 失败不反扑 ────────────────────────────────────────────────────────

test("T5 失败不反扑：config 路径指向目录 ⇒ 回执仍 ok:true ∧ 槽已写 ∧ console.error 记错 ∧ 零抛", async () => {
  sessionSlotsMod._setSessionsDirForTest(tmpDir("dmc-t5-sessions-"))
  const cwd = tmpDir("dmc-t5-cwd-")
  const slot = await sessionSlotsMod.newSession(cwd)
  cfgIo._setConfigPathForTest(tmpDir("dmc-t5-cfgdir-")) // config 路径 = 目录 ⇒ 读/写必失败
  const host = makeHost(cwd)
  const logged = []
  const origError = console.error
  console.error = (...args) => { logged.push(args.map(String).join(" ")) }
  try {
    let receipt = null
    let threw = null
    try { receipt = host.setPrefs(String(slot), { provider: "p1", model: "m2" }) } catch (error) { threw = error }
    assert.equal(threw, null, "零进程抛")
    assert.equal(receipt?.ok, true, "回执仍 ok:true（配置面失败不反扑——本会话已生效）")
    assert.equal("providerState" in (receipt ?? {}), false, "失败径零叠加（键缺席）")
    assert.equal(coreSession.loadSlotFile(cwd, slot).activeModel, "m2", "槽已写（会话写照旧）")
    assert.ok(logged.some((line) => line.includes("carryover failed")), "主侧 console.error 记错（零静默）")
  } finally {
    console.error = origError
    resetSeams()
  }
})

// ─── T6 · 渲染面消费（红 → 绿）──────────────────────────────────────────────

test("T6 渲染面消费：成功回执携 providerState ⇒ 切片写；键缺席 ⇒ 零写（负向锁）", async () => {
  const { createStore } = await mod("thincoder-desktop/renderer/store.mjs")
  const { createComposerWire } = await mod("thincoder-desktop/renderer/composer-wire.mjs")
  const store = createStore() // 真 store（补丁合并语义——零桩漂移）
  store.set({ activeSession: "1" })
  let receipt = null
  const wire = createComposerWire({
    store,
    activeKey: () => store.get().activeSession,
    call: async () => receipt,
    push: () => {},
    panelOf: () => null,
    repaint: () => {},
  })
  // ① 回执携 providerState ⇒ 切片写（与 msg:send 同点同规则）
  const ps = { state: "ok", channel: "p1", model: "m2", reason: null, invalidReason: null }
  receipt = { ok: true, reason: null, cwd: "/x", slot: 1, meta: { provider: "p1", model: "m2" }, providerState: ps }
  wire.post("selectModel", { provider: "p1", model: "m2" })
  await settle(() => store.get().sessionMeta["1"] !== undefined)
  assert.equal(store.get().providerState, ps, "providerState 落切片（同一引用）")
  assert.equal(store.get().sessionMeta["1"].model, "m2", "sessionMeta 写照旧（既有语义零改）")
  // ② 回执无键 ⇒ 零写（负向锁 —— 原引用保持）
  const held = store.get().providerState
  receipt = { ok: true, reason: null, cwd: "/x", slot: 1, meta: { provider: "p1", model: "m3" } }
  wire.post("selectModel", { provider: "p1", model: "m3" })
  await settle(() => store.get().sessionMeta["1"].model === "m3")
  assert.equal(store.get().providerState, held, "键缺席 ⇒ 切片零写（原引用保持）")
})

// ─── T7 · 源判据（结构机检）────────────────────────────────────────────────

test("T7 源判据：触发支调用 ∥ 槽面实变门 ∥ 槽面 changed 判据 ∥ 写回单点在档", () => {
  const host = text("thincoder-desktop/src/main/agent-host.mjs")
  assert.match(host, /carryoverDefaultModel\(patch\.provider, patch\.model\)/, "触发支调用在档（选定写回单点）")
  assert.match(host, /written\.changed === true/, "槽面实变门在档（`written.changed`）")
  assert.match(text("thincoder-desktop/src/main/session-slots.mjs"), /const changed =/, "槽面实变判据在档")
  assert.match(text("thincoder-desktop/src/main/settings.mjs"), /export function carryoverDefaultModel\(/, "写回单点在档")
})
