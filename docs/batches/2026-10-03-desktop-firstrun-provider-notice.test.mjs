/**
 * 2026-10-03-desktop-firstrun-provider-notice.test.mjs — 首跑渠道提示修复批（#840）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿（设计 §2 验收对照 :113-120 + :196）：
 *   T1  A 真因分类（闭集二值 · 结构判定；真核数据层夹具 ∥ 真 `validateProvider` 落标）+ 回执携 `providerKind`
 *   T2  A 词路由（**词面-only**）：kind → 词（`defaultModel` ⇒ 新键 ∥ 余类 ⇒ `noProvider` ∥ 分类缺 ⇒ `noProvider`
 *       ∥ 余码 ⇒ `failed`）＋ 新词两语成对 ＋ 作废钮件零残留（D8）
 *   T3  B① 保存补写（临时 config · 核 `_setConfigPathForTest` 缝）：缺失 ⇒ 补 `name:model`（补后
 *       `loadConfig().provider` 有效 = 复现对 B 半）∥ 既有非空零覆盖 ∥ 无效-非空零触碰（KD-5）∥
 *       `active:true` 支照旧 ∥ 坏条目零写
 *   T4  B②③：`loadModels(null)` 候选负控（段归 `none` ∧ `models:[]` ∧ 零 `model:list` 请求）∥ 步 2 步入径
 *       ⇒ `loadModels(现渠)` ∥ handlers 携 `onUseModel`（同一引用 —— 零第二实现；缺注入 ⇒ 零键）＋ 完成径零改
 *   T5  C 无效装配不入表（两次 send ⇒ 装配恰两次）∥ 有效 ⇒ 恰一次（同键复用保持）
 *   T6  KD-8 槽复验（真槽文件：槽无效 ⇒ 标记保持；槽有效 ⇒ 清标）+ 源码判据
 *   T7  集成腿（真 `createAgentHost` ＋ 真槽文件 ＋ 真 `setPrefs` ＋ 真 `send`）：send#1 ⇒ `provider-invalid`
 *       ∧ 零入表（C）；`setPrefs` 写槽 ⇒ send#2 ⇒ 放行（KD-8）＋ 重装配（C）
 * 纪律：只读面 ∕ 行为断言（真核件优先——桩只在「非射程面」）；⌛ 面（真机读数）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（T2 取件链：`composer-sync → composer-wire → badges → subagent-reduce → /rc/…`）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const tmpDir = (name) => mkdtempSync(join(tmpdir(), name))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await sleep(5) } return true }

// 核面取件走桌面 node_modules 路径（与桌面档同一模块实例——先例 = `2026-09-29-hatch-clearance-2.test.mjs:161`）。
const cfgIo = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")
const coreCfg = await mod("thincoder-desktop/node_modules/@thincoder/core/config.mjs")
const coreAssemble = await mod("thincoder-desktop/node_modules/@thincoder/core/agent/assemble.mjs")
const coreListModels = await mod("thincoder-desktop/node_modules/@thincoder/core/provider/list-models.mjs")
const [turnInputMod, turnDriverMod, providersMod, agentHostMod, sessionSlotsMod] = await Promise.all([
  mod("thincoder-desktop/src/main/turn-input.mjs"),
  mod("thincoder-desktop/src/main/turn-driver.mjs"),
  mod("thincoder-desktop/src/main/providers.mjs"),
  mod("thincoder-desktop/src/main/agent-host.mjs"),
  mod("thincoder-desktop/src/main/session-slots.mjs"),
])

const KEY = "1"

/** 真核数据层夹具：写临时 config ⇒ `loadConfig()` 实读（复现对 A 半——§1 ① 同径）。 */
function withConfig(obj) {
  const file = join(tmpDir("fr840-cfg-"), "config.json")
  writeFileSync(file, JSON.stringify(obj))
  cfgIo._setConfigPathForTest(file)
  return file
}

/** turn-driver 夹具（假注入面齐全 —— 档头「零宿主依赖」判据；逐形同 `2026-09-29-send-busy-timing.test.mjs`）。 */
function driverOf({ ensure }) {
  const events = [], runs = []
  const driver = turnDriverMod.createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (a, item) => new Promise((res) => runs.push({ text: item, res })),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => null },
    ensure, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  return { driver, events, runs }
}

/** 无效装配存根（真 `validateProvider` 落标；渠表空 ∧ `defaultModel` 缺 ⇒ `provider` 类）。 */
const invalidAgent = (cwd, slot) => {
  const agent = { cwd, _slot: slot, title: "", history: [], config: { locale: "zh", providers: [] }, provider: {} }
  coreAssemble.validateProvider(agent, agent.config)
  return agent
}

// ─── T1 · A 真因分类 + 回执透传 ───────────────────────────────────────────────

test("T1 A 真因分类：闭集二值 · 结构判定（真核数据层夹具）+ 回执携 providerKind", async () => {
  const { providerKindOf } = turnInputMod
  try {
    // ① 仅渠+key（无 defaultModel）—— #841：回退链入选 ⇒ fallback（可运行；非无效态）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }] })
    const bare = coreCfg.loadConfig()
    assert.equal(bare.provider?.name, "p1", "#841 核读：渠持 key ⇒ 回退链入选（fallback —— 可运行）")
    assert.equal(bare.providerState, "fallback", "核读：三态 = fallback")
    assert.equal(bare.providerInvalidReason, null, "真因串零（provider 完整 —— 无效面不在场）")
    assert.equal(providerKindOf({ provider: bare.provider, config: bare }), "provider", "name 在场 ⇒ provider 类（① 分支 —— 结构面）")
    assert.equal(providerKindOf({ config: { providers: [{ name: "p1", apiKey: "k1" }] } }), "defaultModel", "有持 key 渠道 ∧ defaultModel 缺 ⇒ defaultModel 类")
    assert.equal(providerKindOf({ config: { providers: [{ name: "p1" }] } }), "provider", "全无 key 渠道 ∧ defaultModel 缺 ⇒ 真·无 key 词（#841 换源）")

    // ② 渠条目结构不全（缺 baseURL）⇒ `provider` 类（修正轮发现 6 夹具）
    withConfig({ providers: [{ name: "p1", model: "m1", apiKey: "k1" }], defaultModel: "p1:m1" })
    const incomplete = coreCfg.loadConfig()
    assert.equal(incomplete.provider?.name, "p1", "核读：name 非空（名段解析通过 ∧ 持 key）")
    const agentA = { provider: incomplete.provider, config: incomplete }
    coreAssemble.validateProvider(agentA, incomplete)
    assert.equal(agentA._providerInvalid, true, "真核落标（缺 baseURL ⇒ 条目结构不全）")
    assert.equal(providerKindOf(agentA), "provider", "name 非空 ∧ 无效 ⇒ provider 类（修点在渠道面）")

    // ③ `defaultModel` 非空而解析未过（模型段空）—— #841：回退链入选 ⇒ fallback（非无效态）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }], defaultModel: "deepseek:" })
    const emptySeg = coreCfg.loadConfig()
    assert.equal(emptySeg.provider?.name, "p1", "#841 核读：不可解析 ⇒ 回退链入选（fallback）")
    assert.equal(emptySeg.providerState, "fallback", "核读：三态 = fallback")
    assert.equal(providerKindOf({ provider: emptySeg.provider, config: emptySeg }), "provider", "name 在场 ⇒ provider 类（① 分支）")

    // ④ 保守三面：config 缺 ∥ 无人证面 ∥ 渠表空 ⇒ `provider`（落回现词）
    assert.equal(providerKindOf({ _providerInvalid: true }), "provider", "config 缺（测试桩）⇒ provider")
    assert.equal(providerKindOf({ config: { locale: "zh" } }), "provider", "config 无人证面 ⇒ provider")
    assert.equal(providerKindOf({ config: { locale: "zh", providers: [] } }), "provider", "渠表空 ⇒ provider（真无渠道）")

    // ⑤ 回执面（A 真因透传——13:09 前口径 §1 ② 的修复：真因出档；#841：可达场景 = 不可运行档）
    //   provider 类：渠全无 key ∧ defaultModel 缺（③ 换源后 ⇒ provider 词）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1" }] })
    const keyless = coreCfg.loadConfig()
    assert.equal(keyless.providerState, "invalid", "前提：全无 key ⇒ invalid")
    const agentB = { provider: keyless.provider, config: keyless, _slot: 1, history: [] }
    coreAssemble.validateProvider(agentB, keyless)
    const one = driverOf({ ensure: async () => agentB })
    assert.deepEqual(await one.driver.send(KEY, "甲", null), { ok: false, reason: "provider-invalid", providerKind: "provider", started: false }, "回执携 providerKind（provider 类 —— 全无 key 词）")
    assert.equal(one.runs.length, 0, "零起跑")
    //   defaultModel 类：渠全无 key ∧ defaultModel 非空（② 分支 —— 全无 key 态；持 key 时该档 = fallback）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1" }], defaultModel: "p1:m1" })
    const keylessDm = coreCfg.loadConfig()
    assert.equal(keylessDm.providerState, "invalid", "前提：全无 key ⇒ invalid（defaultModel 非空）")
    const agentC = { provider: keylessDm.provider, config: keylessDm, _slot: 1, history: [] }
    coreAssemble.validateProvider(agentC, keylessDm)
    const two = driverOf({ ensure: async () => agentC })
    assert.deepEqual(await two.driver.send(KEY, "乙", null), { ok: false, reason: "provider-invalid", providerKind: "defaultModel", started: false }, "回执携 providerKind（defaultModel 类）")
    assert.equal(two.runs.length, 0, "零起跑")
  } finally {
    cfgIo._resetConfigPathForTest()
  }
})

// ─── T2 · A 词路由（词面-only）───────────────────────────────────────────────

/** 假 DOM 节点（`dom.mjs` 唯一构造点 = `document.createElement` + `instanceof Node`）。 */
class FakeNode {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.attrs = new Map(); this.kids = []; this.parentNode = null }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null }
  append(...nodes) { for (const node of nodes) { if (node !== null && typeof node === "object") node.parentNode = this; this.kids.push(node) } }
  replaceChildren(...nodes) { this.kids = []; this.append(...nodes) }
}

test("T2 A 词路由：kind → 词（词面-only）＋ 新词两语成对 ＋ 作废钮件零残留", async () => {
  const { createComposerSync } = await mod("thincoder-desktop/renderer/composer-sync.mjs")
  const { initDict, t } = await mod("thincoder-desktop/renderer/i18n.mjs")
  // 新词两语成对（值 = 更正块 :208 逐字——状态陈述）
  initDict({ locale: "en" })
  assert.equal(t("composer.send.noDefaultModel"), "Default model missing or invalid", "en 新词")
  initDict({ locale: "zh" })
  assert.equal(t("composer.send.noDefaultModel"), "默认模型未设置或无效", "zh 新词")
  // 行面行为（真工厂 ＋ 假 DOM ＋ 假载体 —— `wire.failure()` 单消费点）
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = { createElement: (tag) => new FakeNode(tag) }
  globalThis.Node = FakeNode
  try {
    const anchor = new FakeNode("div")
    const state = { activeSession: "1", pending: {}, attachDegraded: {} }
    let failure = null
    const sync = createComposerSync({
      store: { get: () => state }, activeKey: () => state.activeSession,
      call: () => new Promise(() => {}), push: () => {}, pushSubs: [],
      wire: { failure: () => failure }, panelOf: () => null, noticesOf: () => anchor,
    })
    const rowWord = () => { sync.paintNotices(state); return anchor.kids.length === 0 ? null : anchor.kids[0].kids[0] }
    failure = { reason: "provider-invalid", kind: "defaultModel" }
    assert.equal(rowWord(), "默认模型未设置或无效", "defaultModel 类（缺 ∥ 无效）⇒ 新词（状态陈述）")
    failure = { reason: "provider-invalid", kind: "provider" }
    assert.equal(rowWord(), "未配置 API 密钥 — 点击 ⚙ 设置", "余类（真无渠道 ∥ 条目结构不全）⇒ 现键照旧")
    failure = { reason: "provider-invalid" }
    assert.equal(rowWord(), "未配置 API 密钥 — 点击 ⚙ 设置", "分类缺 ⇒ 现键（保守——落回现词）")
    failure = { reason: "aborted" }
    assert.equal(rowWord(), "发送失败（aborted）——文本已保留", "余码 ⇒ failed 模板（reason 原样）")
    failure = null
    assert.equal(rowWord(), null, "无失败 ⇒ 零行")
  } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
  // 作废钮件零残留（D8 —— 更正块 :210-216：钮词 ∥ 锚 ∥ 守卫码 ∥ 词对；判据域 = 桌面 renderer ∥ src 源面）
  const files = []
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(rel)
      else if (/\.(mjs|css|cjs|html)$/.test(entry.name)) files.push(rel)
    }
  }
  walk("thincoder-desktop/renderer")
  walk("thincoder-desktop/src")
  const residue = files.filter((rel) => /chooseModel|composer:chooseModel|no-default-model|settings\.reason\.noDefaultModel/.test(text(rel)))
  assert.deepEqual(residue, [], "作废钮件 ∥ 守卫码 ∥ 词对零残留（D8）")
})

// ─── T3 · B① 保存补写 ────────────────────────────────────────────────────────

test("T3 B① 保存补写：缺失 ⇒ 补 name:model；既有非空零覆盖；无效-非空零触碰；active:true 支照旧；坏条目零写", async () => {
  const { providerSave } = providersMod
  coreListModels._setProbeImplForTest(async () => ({ ok: false, error: "probe down" })) // 写后探针桩（零网 ∥ 不阻断写）
  try {
    // ① 仅渠+key ⇒ 保存新渠 ⇒ 补写 `defaultModel = 新条目 name:model`（补后运行时 provider 有效 = 复现对 B 半）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }] })
    const saved = providerSave({ name: "p2", shape: "custom", baseURL: "https://api.invalid/v1", model: "m2", format: "openai", key: "k2" })
    assert.deepEqual({ ok: saved.ok, reason: saved.reason }, { ok: true, reason: null }, "保存成功径回执两键照旧（#841：另携 providerState —— 设置写第三刷新点）")
    assert.equal(saved.providerState?.state, "ok", "#841：设置写回执 providerState = 写后核读")
    assert.equal(coreCfg.loadConfig().defaultModel, "p2:m2", "缺失 ⇒ 补写 name:model")
    assert.equal(coreCfg.loadConfig().provider?.name, "p2", "补后 loadConfig().provider 有效（可发送）")
    assert.equal(coreCfg.loadConfig().provider?.model, "m2", "模型段 = 条目模型")
    assert.equal(coreCfg.loadConfig().providerInvalidReason, null, "真因串清（核读）")

    // ② 既有非空零覆盖
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }], defaultModel: "p1:m1" })
    const saved3 = providerSave({ name: "p3", shape: "custom", baseURL: "https://api.invalid/v1", model: "m3", format: "openai" })
    assert.deepEqual({ ok: saved3.ok, reason: saved3.reason }, { ok: true, reason: null }, "#841：回执两键照旧")
    assert.equal(coreCfg.loadConfig().defaultModel, "p1:m1", "既有非空零覆盖")

    // ③ 无效-非空零触碰（KD-5「仅缺失」——无效态归 A 词面引导）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }], defaultModel: "ghost:x" })
    const saved4 = providerSave({ name: "p4", shape: "custom", baseURL: "https://api.invalid/v1", model: "m4", format: "openai" })
    assert.deepEqual({ ok: saved4.ok, reason: saved4.reason }, { ok: true, reason: null }, "#841：回执两键照旧")
    assert.equal(coreCfg.loadConfig().defaultModel, "ghost:x", "无效-非空不静默覆盖")

    // ④ `active:true` 支照旧（显式意图——覆盖写在册；两支排他 = 不走补写支）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }], defaultModel: "p1:m1" })
    const saved5 = providerSave({ name: "p5", shape: "custom", baseURL: "https://api.invalid/v1", model: "m5", format: "openai", active: true })
    assert.deepEqual({ ok: saved5.ok, reason: saved5.reason }, { ok: true, reason: null }, "#841：回执两键照旧")
    assert.equal(coreCfg.loadConfig().defaultModel, "p5:m5", "active:true 支照旧（覆盖写）")

    // ⑤ 坏条目零写（校验失败零写盘 ∥ 补写零触发）
    withConfig({ providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }] })
    assert.deepEqual(providerSave({ name: "bad", shape: "custom", baseURL: "", model: "m9", format: "openai" }), { ok: false, reason: "invalid-shape" }, "坏条目拒码照旧")
    const after = coreCfg.loadConfig()
    assert.equal(after.defaultModel ?? null, null, "坏条目零写（defaultModel 未补）")
    assert.equal(after.providers.length, 1, "渠表零增")
  } finally {
    coreListModels._setProbeImplForTest(null)
    cfgIo._resetConfigPathForTest()
  }
})

// ─── T4 · B②③：完成径零改 ＋ 模型步接线 ──────────────────────────────────────

test("T4 B②③：loadModels(null) 候选负控 ∥ 步 2 步入径 ⇒ loadModels(现渠) ∥ handlers 携 onUseModel（同一引用）＋ 完成径零改", async () => {
  const { createReads } = await mod("thincoder-desktop/renderer/mount-settings-reads.mjs")
  const { createWizard } = await mod("thincoder-desktop/renderer/mount-onboarding.mjs")

  // ① 候选负控（改档判据：守卫态零候选）：无激活渠道 ⇒ 段归 "none" ∧ models:[] ∧ 零 `model:list` 请求
  const asks = []
  let slices = {}
  const reads = createReads({
    ask: async (channel, payload) => { asks.push({ channel, payload }); return { ok: false, reason: "stub" } },
    store: { get: () => ({ settings: slices }) },
    setSettings: (patch) => { slices = { ...slices, ...patch } },
    report: () => {},
  })
  await reads.loadModels(null)
  assert.deepEqual(slices.model, { state: "none", provider: null, current: null, models: [] }, "无渠 ⇒ 段归 none ∧ models:[]（禁假造候选）")
  assert.equal(asks.length, 0, "无渠 ⇒ 零 `model:list` 请求")
  await reads.loadModels("")
  assert.equal(asks.length, 0, "空串同判（零请求）")

  // ② 步 2 步入径：步 1 ⇒ 步 2 ＋ 现渠候选装载（渠空 ⇒ loadModels(null)）
  const loaded = []
  const calls = []
  const modelSpy = (provider, name) => { calls.push([provider, name]) }
  let state = { settings: { wizard: { step: 1 }, model: { provider: "p1" } } }
  const mkHandlers = (extra = {}) => createWizard({
    store: { get: () => state, set: (next) => { state = next } },
    ask: async () => ({ ok: false, reason: "stub" }), report: () => {}, clearReport: () => {},
    loadModels: (provider) => { loaded.push(provider) },
    submitChannel: () => {}, verifyChannel: () => {},
    ...extra,
  }).handlers
  const handlers = mkHandlers({ useModel: modelSpy })
  handlers.onNext()
  assert.equal(state.settings.wizard.step, 2, "步 1 ⇒ 步 2")
  assert.deepEqual(loaded, ["p1"], "步入步 2 ⇒ loadModels(现渠)")
  state = { settings: { wizard: { step: 1 }, model: { provider: null } } }
  handlers.onNext()
  assert.deepEqual(loaded, ["p1", null], "渠空 ⇒ loadModels(null)（负控同径）")

  // ③ handlers 携 onUseModel（同一引用 —— 零第二实现；缺注入 ⇒ 零键 ⇒ 视图 `wire` 落 disabled）
  assert.equal(typeof handlers.onUseModel, "function", "注入 ⇒ 键在场")
  assert.equal(handlers.onUseModel, modelSpy, "同一引用（零第二实现）")
  handlers.onUseModel("p1", "m1")
  assert.deepEqual(calls, [["p1", "m1"]], "步 2 采用 ⇒ 直通出口族")
  assert.equal("onUseModel" in mkHandlers(), false, "缺注入 ⇒ 零键（诚实非死控）")

  // ④ 完成径零改（B② 改档：不阻断）：`config:read` 谓真 ⇒ 直接落 configured（零守卫零改道）
  let finishState = { settings: { configured: false } }
  const fin = createWizard({
    store: { get: () => finishState, set: (next) => { finishState = next } },
    ask: async () => ({ configured: true }), report: () => {}, clearReport: () => {},
    loadModels: () => {}, submitChannel: () => {}, verifyChannel: () => {},
  }).handlers
  fin.onFinish()
  await until(() => finishState.settings?.configured === true)
  assert.equal(finishState.settings.configured, true, "configured 真 ⇒ 直接收尾（零阻断）")
  assert.ok(!/noDefaultModel|no-default-model/.test(text("thincoder-desktop/renderer/mount-onboarding.mjs")), "清点件零残留（完成径原文）")
  assert.ok(!/noDefaultModel/.test(text("thincoder-desktop/renderer/views/settings.mjs")), "REASON_WORD 零新增码")
  assert.ok(!/noDefaultModel/.test(text("thincoder-desktop/renderer/i18n-settings.mjs")), "settings.reason 词对零残留")
})

// ─── T5 · C 无效装配不入表 ────────────────────────────────────────────────────

test("T5 C：无效装配不入表（逐发重装配）∥ 有效 ⇒ 恰一次（同键复用保持）", async () => {
  sessionSlotsMod._setSessionsDirForTest(tmpDir("fr840-t5-sessions-"))
  const cwd = tmpDir("fr840-t5-cwd-")
  try {
    const slot = await sessionSlotsMod.newSession(cwd)
    const key = String(slot)

    // ① 无效 ⇒ 逐发重装配（C：不缓存无效态）
    let invalidCount = 0
    const hostInvalid = agentHostMod.createAgentHost({
      emit: () => {},
      projects: { currentCwd: () => cwd },
      assemble: async () => { invalidCount += 1; return invalidAgent(cwd, slot) },
      run: async () => {},
    })
    assert.deepEqual(await hostInvalid.send(key, "甲", null), { ok: false, reason: "provider-invalid", providerKind: "provider", started: false }, "无效径回执（分类随出）")
    assert.equal(hostInvalid.agents.size, 0, "无效装配不入表")
    assert.deepEqual(await hostInvalid.send(key, "乙", null), { ok: false, reason: "provider-invalid", providerKind: "provider", started: false }, "同键再发 ⇒ 仍拦")
    assert.equal(invalidCount, 2, "两次 send ⇒ 装配恰两次（零缓存）")

    // ② 有效 ⇒ 恰一次（同键复用保持 —— C 不误伤有效面）
    let validCount = 0
    const hostValid = agentHostMod.createAgentHost({
      emit: () => {},
      projects: { currentCwd: () => cwd },
      assemble: async () => {
        validCount += 1
        const agent = { cwd, _slot: slot, title: "", history: [], config: { locale: "zh", providers: [] }, provider: { name: "p1", model: "m1", baseURL: "https://api.invalid/v1" } }
        coreAssemble.validateProvider(agent, agent.config)
        assert.equal(agent._providerInvalid, undefined, "有效 ⇒ 零标")
        return agent
      },
      run: async (agent, text) => { agent.history.push({ role: "user", content: text }) },
    })
    const firstValid = await hostValid.send(key, "丙", null)
    assert.equal(firstValid.ok, true, "有效径放行")
    assert.equal(typeof firstValid.providerState, "object", "#841：成功回执携 providerState（发送时点刷新）")
    await until(() => hostValid.busyOf(key) === false)
    assert.equal((await hostValid.send(key, "丁", null)).ok, true, "同键再发 ⇒ 表内复用")
    assert.equal(validCount, 1, "有效 ⇒ 装配恰一次")
    await until(() => hostValid.busyOf(key) === false)
  } finally {
    sessionSlotsMod._resetSessionsDirForTest()
  }
})

// ─── T6 · KD-8 槽复验 ────────────────────────────────────────────────────────

test("T6 KD-8：槽复验（槽无效 ⇒ 标记保持；槽有效 ⇒ 清标）+ 源码判据", async () => {
  sessionSlotsMod._setSessionsDirForTest(tmpDir("fr840-t6-sessions-"))
  const cwd = tmpDir("fr840-t6-cwd-")
  try {
    const slot = await sessionSlotsMod.newSession(cwd)
    const key = String(slot)
    /** 假装配（无效 config 形——真 `validateProvider` 落标；渠在位 ⇒ 槽有效时可复验通过）。 */
    const mkHost = (assembled) => agentHostMod.createAgentHost({
      emit: () => {},
      projects: { currentCwd: () => cwd },
      assemble: async () => {
        const agent = {
          cwd, _slot: slot, title: "", history: [],
          config: { locale: "zh", providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }], defaultModel: null },
          provider: {},
          providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }],
        }
        coreAssemble.validateProvider(agent, agent.config)
        assembled.push(agent)
        return agent
      },
      run: async () => {},
    })

    // ① 槽无效（空槽——无 activeProvider）⇒ 标记保持
    const hostA = mkHost([])
    const a1 = await hostA.ensure(key, slot)
    assert.equal(a1._providerInvalid, true, "槽无效 ⇒ 标记保持（下次发送仍拦）")

    // ② 槽有效（会话级选模型 = 真槽写）⇒ 重装配 ⇒ KD-8 清标
    const hostB = mkHost([])
    const a2 = await hostB.ensure(key, slot)
    assert.equal(a2._providerInvalid, true, "先验：装配后标记在场")
    assert.equal(sessionSlotsMod.writeSlotPrefs(cwd, slot, { provider: "p1", model: "m1" }).ok, true, "真槽写入")
    const a3 = await hostB.ensure(key, slot) // 表内零命中（C）⇒ 再装配 ⇒ 槽施加后复验
    assert.equal(a3._providerInvalid, undefined, "槽有效 ⇒ KD-8 清标（本次发送放行）")
    assert.equal(a3.provider?.name, "p1", "槽值施加（provider）")
    assert.equal(a3.provider?.model, "m1", "槽值施加（model）")

    // 源码判据（复验调用在档 —— 防「清标只活在本用例」）
    assert.match(text("thincoder-desktop/src/main/agent-host.mjs"), /if \(agent\._providerInvalid\) validateProvider\(agent, agent\.config\)/, "assembleAndLoad 槽复验在档")
  } finally {
    sessionSlotsMod._resetSessionsDirForTest()
  }
})

// ─── T7 · 集成腿（13:17 活体路径）────────────────────────────────────────────

test("T7 集成腿：send#1 拦（零入表）⇒ setPrefs 写槽 ⇒ send#2 放行（KD-8）＋ 重装配（C）", async () => {
  sessionSlotsMod._setSessionsDirForTest(tmpDir("fr840-t7-sessions-"))
  const cwd = tmpDir("fr840-t7-cwd-")
  cfgIo._setConfigPathForTest(join(tmpDir("fr840-t7-cfg-"), "config.json")) // 写回去向 = 缝（真 config 零触 — #890）
  try {
    const slot = await sessionSlotsMod.newSession(cwd)
    const key = String(slot)
    const assembled = []
    const host = agentHostMod.createAgentHost({
      emit: () => {},
      projects: { currentCwd: () => cwd },
      assemble: async ({ cwd: c, slot: s }) => {
        const agent = {
          cwd: c, _slot: s, title: "", history: [],
          _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(),
          config: { locale: "zh", providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }], defaultModel: null },
          provider: {},
          providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }],
        }
        coreAssemble.validateProvider(agent, agent.config) // 真核落标（defaultModel 缺 ⇒ 无效）
        assembled.push(agent)
        return agent
      },
      run: async (agent, text) => { agent.history.push({ role: "user", content: text }) },
    })

    const r1 = await host.send(key, "甲", null)
    assert.deepEqual(r1, { ok: false, reason: "provider-invalid", providerKind: "defaultModel", started: false }, "send#1：真因分类随回执出档（首跑缺环实况）")
    assert.equal(host.agents.size, 0, "C：无效装配零入表")

    const prefs = host.setPrefs(key, { provider: "p1", model: "m1" })
    assert.equal(prefs.ok, true, "会话级选模型（真槽写——既有语义零改）")
    assert.equal(host.agents.size, 0, "在表零命中 ⇒ 只写盘（不隐式装配）")
    assert.equal(JSON.parse(readFileSync(cfgIo._configPath(), "utf8")).defaultModel, "p1:m1", "写回去向 = 缝档（#890：真 config 零触）")

    await until(() => host.busyOf(key) === false)
    const r2 = await host.send(key, "乙", null)
    assert.equal(r2.ok, true, "send#2：KD-8 清标 ⇒ 本次发送放行（13:17 活体路径；#841：回执另携 providerState）")
    assert.equal(assembled.length, 2, "C 迫使修正后首发重装配")
    await until(() => host.busyOf(key) === false)
  } finally {
    sessionSlotsMod._resetSessionsDirForTest()
    cfgIo._resetConfigPathForTest()
  }
})
