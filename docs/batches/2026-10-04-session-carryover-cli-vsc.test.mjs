/**
 * 2026-10-04-session-carryover-cli-vsc.test.mjs — 会话选定写回批（#883 · CLI ∥ VSC）批次本地单元件
 * （名随批次档 · 住批次目录 · 不进仓套件 · 随批留存归档）。
 * 复跑 = 从仓库根（thincoder/）：`node --test docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs`
 *
 * 腿（批档 §2 批内用例设计 :67-83 + 修正块 :125「播种回声 ⇒ 零写回」条；判据单源 =
 * `docs/core/design/SESSION.md` §6.21 判据句 6）：
 *   CLI T-C1 选定写回正径（红 → 绿）：selectModel ⇒ 读盘 defaultModel 实写 ∥ 槽写照旧 ∥ 内存镜像
 *   CLI T-C2 回声零写：槽基线 = 选定复合 ⇒ config 零写（内容字节 ∥ 槽写照旧）
 *   CLI T-C3 新会话起点采用（红 → 绿）：写回后 loadConfig() 运行时解析 p1 ∕ m2 ∕ ok
 *   CLI T-C4 失败不反扑：config 路径指向目录 ⇒ 零抛 ∧ 槽已写 ∧ console.error 记错 ∧ 内存镜像不落
 *   CLI T-C5 源判据（结构机检）：触发支调用 ∥ 写回单点 ∥ 两门判据在档
 *   VSC T-V1 选定写回正径（红 → 绿）：写回单点直驱 ⇒ { ok:true, written:true } ∥ 读盘 ∥ $schema 保持
 *   VSC T-V2 回声零写（两径）：槽面回声（slotBefore = 选定）∥ 播种回声（档缺 ∧ lastPushedPrefs 命中）
 *   VSC T-V3 等值零写：现值同串 ⇒ written:false ∥ 字节不变（防盘面抖动）
 *   VSC T-V4 新会话起点采用：写回后核 resolveProviderPlan ⇒ channel p1 ∕ model m2 ∧ resolveDefaultModel m2
 *   VSC T-V5 失败不反扑：config 路径指向目录 ⇒ { ok:false, reason } 零抛
 *   VSC T-V6 源判据（结构机检）：选定 case 调用 ∥ slotBefore ∥ lastPushedPrefs ∥ 宿主簿记在推送点
 * 挂载面（批内件挂载规范）：核件经**单实例归一钩**——生产裸符 `@thincoder/core/*` 经端 junction
 * realpath（盘符大小写与测试 file URL 不同 ⇒ 模块身份分裂双实例，测试缝只落其一）；hook 把裸符
 * 归一为本仓 `thincoder-core/*` file URL ⇒ CLI ∥ VSC 源码与本案共用同一核实例（零行为差；先例 =
 * `2026-09-30-vsc-cleanup-701.test.mjs:30-39`）。HOME ∥ USERPROFILE 重定向于一切 (动态) import
 * 之前（安全网——核 configDir 装载期取值）；config 面经 `_setConfigPathForTest` 缝 ∥ 槽面经
 * `_setSessionsDirForTest` 缝。零网络（写后探针桩注入——非射程面）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

// 家目录重定向（安全网：核 configDir 于模组装载期取值——一切 (动态) import 之前覆盖）。
const HOME_SANDBOX = mkdtempSync(join(tmpdir(), "scc883-home-"))
process.env.HOME = HOME_SANDBOX
process.env.USERPROFILE = HOME_SANDBOX

const ROOT_URL = new URL("../../", import.meta.url) // 仓根（docs/batches 两层深）
const ROOT = fileURLToPath(ROOT_URL)
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（ROOT = ${ROOT}）`)

// 单实例归一（见件头注）：`@thincoder/core/*` 裸符 → 本仓 `thincoder-core/*` file URL。
const CORE_BASE = new URL("thincoder-core/", ROOT_URL)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@thincoder/core/")) {
      return { url: new URL(specifier.slice("@thincoder/core/".length), CORE_BASE).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
})

const mod = (rel) => import(new URL(rel, ROOT_URL).href)
const text = (rel) => readFileSync(join(ROOT, rel), "utf8")

const coreIo = await mod("thincoder-core/config-io.mjs")
const coreCfg = await mod("thincoder-core/config.mjs")
const coreSession = await mod("thincoder-core/session.mjs")
const coreSlots = await mod("thincoder-core/session-slots.mjs")
const coreRef = await mod("thincoder-core/model-ref.mjs")
const listModels = await mod("thincoder-core/provider/list-models.mjs")
const { createModelPicker } = await mod("thincoder-cli/src/tui/model-picker.mjs")
const spw = await mod("thincoder-vscode/src/extension/settings-panel-write.mjs")
const presets = await mod("thincoder-vscode/src/extension/presets.mjs")

const created = []
const tmpDir = (tag) => { const d = mkdtempSync(join(tmpdir(), `scc883-${tag}-`)); created.push(d); return d }
after(() => {
  coreIo._resetConfigPathForTest()
  coreSlots._resetSessionsDirForTest()
  listModels._setProbeImplForTest(null)
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true })
  rmSync(HOME_SANDBOX, { recursive: true, force: true })
})

/** 渠夹具（持 key ∧ 有单值模型——写回后 config 级解析可成立）。 */
const P1 = { name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }

/** 真核数据层夹具：写临时 config ⇒ `loadConfig()` 实读（临时配置路径缝）。 */
function withConfig(obj) {
  const file = join(tmpDir("cfg-"), "config.json")
  writeFileSync(file, JSON.stringify(obj))
  coreIo._setConfigPathForTest(file)
  return file
}

/** 槽种子（写前基线——回声腿的「槽面未变」现场）。 */
function seedSession(cwd, slot) {
  coreSlots.writeSessionFile(coreSession.slotPath(cwd, slot), {
    version: 2, cwd, title: "", activeProvider: "p1", activeModel: "m1",
    history: [], contextHistory: [],
  })
}

/** agent 假体（`selectModel` ∥ `saveSession` 最小集）。 */
function makeAgent(cwd, slot = 1) {
  return {
    cwd, _slot: slot,
    providers: [{ ...P1 }],
    activeProvider: "p1", activeModel: "m1",
    provider: { ...P1 },
    history: [],
    config: {},
  }
}

/** picker 上下文（桩面 = 非射程；`selectModel` 直驱——picker ∥ /model 直参同漏斗面）。 */
function makePicker(agent) {
  const lines = []
  const ctx = {
    agent, state: {}, render: () => {}, ansi: {}, C: { tool: "", error: "", dim: "", warn: "" },
    pushLine: (t) => lines.push(String(t)),
    persistRaw: async () => {},
    askQuestion: async () => "",
    maskKey: (k) => k,
    showPicker: async () => null, closePicker: () => {},
    renderPickerLines: () => {},
    confirmDelete: () => {},
  }
  return { picker: createModelPicker(ctx), lines }
}

/** 写回单点直驱（VSC 组——未落 ⇒ 出口面断言先红）。 */
function carryaway(opts) {
  assert.equal(typeof spw.carryoverDefaultModel, "function", "写回单点在盘（settings-panel-write.mjs 新导出）")
  return spw.carryoverDefaultModel(opts)
}

/** config 档面「零写」双证：内容逐字 ∧ mtime 零动。 */
const zeroWriteEvidence = (file) => ({ content: readFileSync(file, "utf8"), mtime: statSync(file).mtimeMs })

// ─── CLI 组 ─────────────────────────────────────────────────────────────────

test("T-C1 选定写回正径：selectModel ⇒ 读盘 defaultModel = p1:m2 ∧ 槽写照旧 ∧ 内存镜像", async () => {
  coreSlots._setSessionsDirForTest(tmpDir("c1-sessions-"))
  const cwd = tmpDir("c1-cwd-")
  withConfig({ providers: [P1] }) // 槽面无源 ∥ 无 defaultModel
  const agent = makeAgent(cwd)
  const { picker } = makePicker(agent)
  await picker.selectModel({ provider: "p1", model: "m2" })
  assert.equal(coreCfg.loadConfig().defaultModel, "p1:m2", "读盘实写回：defaultModel = p1:m2（验收①口径）")
  const slotData = coreSession.loadSlotFile(cwd, 1)
  assert.equal(slotData.activeProvider, "p1", "槽写照旧：activeProvider = p1")
  assert.equal(slotData.activeModel, "m2", "槽写照旧：activeModel = m2")
  assert.equal(agent.config.defaultModel, "p1:m2", "内存镜像（/config 面新鲜——wizard.mjs:210-211 先例）")
})

test("T-C2 回声零写：槽基线 = 选定复合 ⇒ config 内容字节不变（零写）∧ 槽写照旧", async () => {
  coreSlots._setSessionsDirForTest(tmpDir("c2-sessions-"))
  const cwd = tmpDir("c2-cwd-")
  seedSession(cwd, 1) // 槽基线 p1:m1
  const cfgFile = withConfig({ providers: [P1], defaultModel: "p1:keep" })
  const before = zeroWriteEvidence(cfgFile)
  const agent = makeAgent(cwd)
  const { picker } = makePicker(agent)
  await picker.selectModel({ provider: "p1", model: "m1" }) // 同值重发（回声）
  const after = zeroWriteEvidence(cfgFile)
  assert.equal(after.content, before.content, "回声：config 内容逐字零写")
  assert.equal(after.mtime, before.mtime, "回声：config mtime 零动")
  assert.equal(coreCfg.loadConfig().defaultModel, "p1:keep", "回声：defaultModel 保持 p1:keep")
  assert.equal(coreSession.loadSlotFile(cwd, 1).activeModel, "m1", "槽写照旧：activeModel = m1")
})

test("T-C3 新会话起点采用：写回后 loadConfig() 解析 = p1 ∕ m2 ∕ ok", async () => {
  coreSlots._setSessionsDirForTest(tmpDir("c3-sessions-"))
  const cwd = tmpDir("c3-cwd-")
  withConfig({ providers: [P1] })
  const agent = makeAgent(cwd)
  const { picker } = makePicker(agent)
  await picker.selectModel({ provider: "p1", model: "m2" })
  const cfg = coreCfg.loadConfig()
  assert.equal(cfg.defaultModel, "p1:m2", "盘面：defaultModel = p1:m2")
  assert.equal(cfg.provider?.name, "p1", "运行时解析：provider.name = p1（新会话起点——核 resolveProviderPlan 实跑）")
  assert.equal(cfg.provider?.model, "m2", "运行时解析：provider.model = m2")
  assert.equal(cfg.providerState, "ok", "运行时解析：providerState = ok")
})

test("T-C4 失败不反扑：config 路径指向目录 ⇒ 零抛 ∧ 槽已写 ∧ console.error 记错 ∧ 内存镜像不落", async () => {
  coreSlots._setSessionsDirForTest(tmpDir("c4-sessions-"))
  const cwd = tmpDir("c4-cwd-")
  coreIo._setConfigPathForTest(tmpDir("c4-cfgdir-")) // config 路径 = 目录 ⇒ 读/写必失败
  const agent = makeAgent(cwd)
  const { picker } = makePicker(agent)
  const logged = []
  const origError = console.error
  console.error = (...args) => { logged.push(args.map(String).join(" ")) }
  try {
    let threw = null
    try { await picker.selectModel({ provider: "p1", model: "m2" }) } catch (error) { threw = error }
    assert.equal(threw, null, "零进程抛")
    assert.equal(coreSession.loadSlotFile(cwd, 1).activeModel, "m2", "槽已写（会话写照旧——失败不反扑）")
    assert.ok(logged.some((line) => line.includes("carryover failed")), "console.error 记错（零静默）")
    assert.equal(agent.config.defaultModel, undefined, "内存镜像不落（ok:false 径）")
  } finally {
    console.error = origError
    coreIo._resetConfigPathForTest()
  }
})

test("T-C5 源判据：触发支调用 ∥ 写回单点 ∥ 两门判据在档（防「只活在本用例」）", () => {
  const picker = text("thincoder-cli/src/tui/model-picker.mjs")
  assert.ok(picker.includes("carryoverDefaultModel({ provider: target.name, model: item.model, slotBefore })"),
    "触发支调用在档（写前读槽基线随行）")
  const helpers = text("thincoder-cli/src/tui/config-helpers.mjs")
  assert.ok(helpers.includes("export async function carryoverDefaultModel("), "写回单点在档")
  assert.ok(helpers.includes("if (before === composite) return { ok: true, written: false }"), "槽面实变门在档")
  assert.ok(helpers.includes("if (loadConfig().defaultModel === composite) return { ok: true, written: false }"), "等值门在档")
})

// ─── VSC 组 ─────────────────────────────────────────────────────────────────

test("T-V1 选定写回正径：写回单点直驱 ⇒ { ok:true, written:true } ∧ 读盘 p1:m2 ∧ $schema 注入保持", () => {
  listModels._setProbeImplForTest(async () => ({ ok: false, error: "probe stub" }))
  withConfig({ providers: [P1] })
  const r = carryaway({ provider: "p1", model: "m2", slotBefore: null })
  assert.equal(r.ok, true, "受理：ok:true")
  assert.equal(r.written, true, "实写：written:true")
  const raw = coreIo.loadRaw()
  assert.equal(raw.defaultModel, "p1:m2", "读盘实写回：defaultModel = p1:m2")
  assert.equal(raw.$schema, spw.VSC_CONFIG_SCHEMA, "$schema 注入保持（vscPersistRaw 通道）")
})

test("T-V2 回声零写（两径）：槽面回声 ∥ 播种回声 ⇒ written:false ∧ config 字节不变", () => {
  // ① 槽面回声：slotBefore 复合 = 选定复合（回声 ∕ 重选——系统同步不劫持全局默认）
  const first = withConfig({ providers: [P1], defaultModel: "p1:keep" })
  const firstBefore = zeroWriteEvidence(first)
  const echo = carryaway({ provider: "p1", model: "m1", slotBefore: { activeProvider: "p1", activeModel: "m1" } })
  assert.equal(echo.ok, true, "槽面回声：受理")
  assert.equal(echo.written, false, "槽面回声：零写")
  const firstAfter = zeroWriteEvidence(first)
  assert.equal(firstAfter.content, firstBefore.content, "槽面回声：config 内容逐字零写")
  assert.equal(firstAfter.mtime, firstBefore.mtime, "槽面回声：config mtime 零动")
  // ② 播种回声：槽基线档缺 ∧ 选定复合命中宿主簿记（boot 播种自动回写——判零不劫持全局默认）
  const second = withConfig({ providers: [P1], defaultModel: "p1:keep" })
  const secondBefore = zeroWriteEvidence(second)
  const seeding = carryaway({ provider: "p1", model: "m1", slotBefore: null, lastPushedPrefs: "p1:m1" })
  assert.equal(seeding.ok, true, "播种回声：受理")
  assert.equal(seeding.written, false, "播种回声：零写回（宿主簿记命中）")
  const secondAfter = zeroWriteEvidence(second)
  assert.equal(secondAfter.content, secondBefore.content, "播种回声：config 内容逐字零写")
  assert.equal(secondAfter.mtime, secondBefore.mtime, "播种回声：config mtime 零动")
})

test("T-V3 等值零写：现值同串 ⇒ written:false ∧ 字节不变（防盘面抖动）", () => {
  const file = withConfig({ providers: [P1], defaultModel: "p1:m2" })
  const before = zeroWriteEvidence(file)
  const r = carryaway({ provider: "p1", model: "m2", slotBefore: null })
  assert.equal(r.ok, true, "等值径受理")
  assert.equal(r.written, false, "等值径零写")
  const after = zeroWriteEvidence(file)
  assert.equal(after.content, before.content, "等值：config 内容逐字零写")
  assert.equal(after.mtime, before.mtime, "等值：config mtime 零动")
})

test("T-V4 新会话起点采用：写回后 resolveProviderPlan ⇒ p1 ∕ m2 ∕ ok ∧ resolveDefaultModel = m2", () => {
  listModels._setProbeImplForTest(async () => ({ ok: false, error: "probe stub" }))
  withConfig({ providers: [P1] })
  assert.equal(carryaway({ provider: "p1", model: "m2", slotBefore: null }).written, true, "写回径受理")
  const raw = coreIo.loadRaw()
  const plan = coreRef.resolveProviderPlan({ providers: [P1], defaultModel: raw.defaultModel, slot: null })
  assert.equal(plan.channel, "p1", "新会话起点：channel = p1（核 resolveProviderPlan 实跑）")
  assert.equal(plan.model, "m2", "新会话起点：model = m2")
  assert.equal(plan.state, "ok", "新会话起点：state = ok")
  assert.equal(presets.resolveDefaultModel(P1, raw), "m2", "本端模型解析（presets.mjs resolveDefaultModel）= m2")
})

test("T-V5 失败不反扑：config 路径指向目录 ⇒ { ok:false, reason } 零抛", () => {
  coreIo._setConfigPathForTest(tmpDir("v5-cfgdir-"))
  try {
    let r = null
    let threw = null
    try { r = carryaway({ provider: "p1", model: "m2", slotBefore: null }) } catch (error) { threw = error }
    assert.equal(threw, null, "零进程抛")
    assert.equal(r?.ok, false, "失败面：ok:false（不反扑 ∥ 记错零静默归调用方）")
    assert.ok(typeof r.reason === "string" && r.reason.length > 0, "失败面：reason 非空")
  } finally {
    coreIo._resetConfigPathForTest()
  }
})

test("T-V6 源判据：选定 case 调用 ∥ slotBefore ∥ lastPushedPrefs ∥ 宿主簿记在推送点（防「只活在本用例」）", () => {
  const pm = text("thincoder-vscode/src/extension/panel-messages.mjs")
  assert.ok(pm.includes("carryoverDefaultModel({ provider: msg.provider, model: msg.model, slotBefore, lastPushedPrefs: lastPushedPrefs() })"),
    "选定 case 写回调用在档（写前读 + 宿主簿记随行）")
  const writeFace = text("thincoder-vscode/src/extension/settings-panel-write.mjs")
  assert.ok(writeFace.includes("export function carryoverDefaultModel("), "写回单点在档")
  assert.ok(writeFace.includes("if (before === null && lastPushedPrefs === composite) return { ok: true, written: false }"),
    "播种回声门在档（槽基线档缺 ∧ 簿记命中）")
  const settings = text("thincoder-vscode/src/extension/settings.mjs")
  assert.ok(settings.includes("export function lastPushedPrefs()"), "宿主簿记读口在档")
  assert.ok(settings.includes("_lastPushedPrefs ="), "推送点记录最近下发 prefs 复合（沿 _lastModelsPayload 先例）")
})