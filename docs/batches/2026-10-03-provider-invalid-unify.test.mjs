/**
 * 2026-10-03-provider-invalid-unify.test.mjs — 无效渠道态逻辑归一批（#841）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-03-provider-invalid-unify.test.mjs
 *
 * 腿（批档 §2 验收对照 :104-113 + 修正块 :171-200 权威读法；矩阵 S1–S10 = :120-130 + S10 = 修正块 :179）：
 *   T1  核回退序三步逐档 + 模型面三步 + `resolveChannelModel` 面（纯函数直读）
 *   T2  状态分界矩阵 S1–S10（真夹具 + `loadConfig()` 实读——config 级三键逐行；S9 单列口径）
 *   T3  断言 C 明示必达（CLI 腿：TUI 三态分流 + 负向锁 + 结构不全径；headless 腿 = 源码判据）
 *   T4  断言 A 解析一致（两腿：config 级只比 `state`；运行面 = 三端同喂同一假槽逐字段）
 *   T5  断言 B 单源（源码判据）+ VSC 回归对拍 S1/S2/S6（可用性不得降）
 * 三端腿中 VSC/桌面面由 B/C 单实现——A 单提交时相应断言按现盘读（未落 ⇒ 预期红；报明，勿删）。
 * 2026-10-09 清除批随正：渠道单值模型退场——夹具去单值（渠条目不携 `model`）；矩阵/断言模型面随正
 * （渠道单值零参与；`resolveChannelModel` ②档 = `null`）。
 * 纪律：只读面 ∥ 行为断言（真核件优先——桩只在「非射程面」）；⌛ 面（真机读数）归父侧闭合。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const tmpDir = (name) => mkdtempSync(join(tmpdir(), name))

// ── vscode 宿主模块桩（进程内 resolve 钩；先例 = `2026-09-29-parity-b1-vsc-core.test.mjs:35-51`）──
const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
const mk = () => new Proxy(function vscodeStub() {}, { get: (t, p) => (p === Symbol.toPrimitive || p === "then" ? undefined : mk()), apply: () => undefined, construct: () => mk() });
export const window = mk(); export const workspace = mk(); export const commands = mk(); export const env = mk(); export const languages = mk();
export const Uri = mk(); export const Range = mk(); export const Position = mk(); export const Selection = mk();
export default { window, workspace, commands, env, languages, Uri };
`)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

// ── 取件（设计纪律：三侧各持自身解析实径的核实例——junction 不折叠 ⇒ **逐侧设缝**，
//    先例 = `2026-10-03-desktop-firstrun-provider-notice.test.mjs:40-43` 桌面面取件）──
const cfgIo = await mod("thincoder-core/config-io.mjs")
const coreCfg = await mod("thincoder-core/config.mjs")
const coreRef = await mod("thincoder-core/model-ref.mjs")
const coreAssemble = await mod("thincoder-core/agent/assemble.mjs")
const tui = await mod("thincoder-cli/src/tui/index.mjs")
// VSC ∥ 桌面侧的核实例（各自经端 node_modules junction 解析——与端内源码同一装载面）
const cfgIoVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/config-io.mjs")
const cfgIoDesk = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")
const coreCfgDesk = await mod("thincoder-desktop/node_modules/@thincoder/core/config.mjs")

// ── 夹具（设计 §2 :118-130 真核口径：deepseek ∥ kimi 双渠 + 无 key 渠；渠道不携模型——
//    2026-10-09 清除批：`providers[].model` 退场，模型面单源 = `defaultModel` ∥ 槽）──
const DS = { name: "deepseek", baseURL: "https://api.deepseek.com/v1", apiKey: "sk-ds" }
const KM = { name: "kimi", baseURL: "https://api.moonshot.cn/v1", apiKey: "sk-km" }
const NK = { name: "nokey", baseURL: "https://api.nokey.example/v1" } // 无 apiKey
const SOLO = { name: "solo", baseURL: "https://api.solo.example/v1", apiKey: "sk-solo" }

/** 三端同喂的同一假槽（S9 行口径 = 槽渠道持 key ∧ 无槽模型 ⇒ 模型面链：dm 属渠段 ∥ `null`）。 */
const FAKE_SLOT = { provider: "deepseek", model: null }

/** 矩阵 S1–S10（`cfg` = config 级 / `run` = 运行面——同喂 `FAKE_SLOT`）。 */
const MATRIX = [
  { id: "S1", config: { providers: [DS] }, cfg: { state: "fallback", channel: "deepseek", model: null }, run: { state: "fallback", source: "slot", channel: "deepseek", model: null } },
  { id: "S2", config: { providers: [DS], defaultModel: "deepseek:" }, cfg: { state: "fallback", channel: "deepseek", model: null }, run: { state: "fallback", source: "slot", channel: "deepseek", model: null } },
  { id: "S3", config: { providers: [DS], defaultModel: "deepseek:deepseek-v4-pro" }, cfg: { state: "ok", channel: "deepseek", model: "deepseek-v4-pro" }, run: { state: "ok", source: "slot", channel: "deepseek", model: "deepseek-v4-pro" } },
  { id: "S4", config: { providers: [] }, cfg: { state: "invalid", channel: null, model: null }, run: { state: "invalid", source: null, channel: null, model: null } },
  { id: "S5", config: { providers: [NK] }, cfg: { state: "invalid", channel: null, model: null }, run: { state: "invalid", source: null, channel: null, model: null } },
  { id: "S6", config: { providers: [DS, KM], defaultModel: "kimi:kimi-k3" }, cfg: { state: "ok", channel: "kimi", model: "kimi-k3" }, run: { state: "ok", source: "slot", channel: "deepseek", model: null } },
  { id: "S7", config: { providers: [DS, KM], defaultModel: "nope:x" }, cfg: { state: "fallback", channel: "deepseek", model: null }, run: { state: "fallback", source: "slot", channel: "deepseek", model: null } },
  { id: "S8", config: { providers: [NK, KM], defaultModel: "nokey:x" }, cfg: { state: "fallback", channel: "kimi", model: null }, run: { state: "fallback", source: "registry", channel: "kimi", model: null } },
  { id: "S9", config: { providers: [DS, KM], defaultModel: "kimi:kimi-k3" }, slotRow: true, cfg: { state: "ok", channel: "kimi", model: "kimi-k3" }, run: { state: "ok", source: "slot", channel: "deepseek", model: null } },
  { id: "S10", config: { providers: [SOLO] }, cfg: { state: "fallback", channel: "solo", model: null }, run: { state: "fallback", source: "registry", channel: "solo", model: null } },
]

/** 真核数据层夹具：写临时 config ⇒ `loadConfig()` 实读（临时配置路径缝——三侧实例逐设）。 */
function withConfig(obj) {
  const file = join(tmpDir("piu-cfg-"), "config.json")
  writeFileSync(file, JSON.stringify(obj))
  cfgIo._setConfigPathForTest(file)
  cfgIoVsc._setConfigPathForTest(file)
  cfgIoDesk._setConfigPathForTest(file)
}

/** 复位三侧配置路径缝。 */
function resetConfigPaths() {
  cfgIo._resetConfigPathForTest()
  cfgIoVsc._resetConfigPathForTest()
  cfgIoDesk._resetConfigPathForTest()
}

/** 断言 A 投影面（`{state, source, channel, model, provider.name, provider.model}` 逐字段）。 */
const proj = (p) => ({
  state: p.state, source: p.source, channel: p.channel, model: p.model,
  "provider.name": p.provider?.name ?? null, "provider.model": p.provider?.model ?? null,
})

/** 桌面装配轻注入面（真核装配序 + 置假依赖——真核默认件将建库 ∥ 连网，非本单射程）。 */
const LIGHT_DEPS = {
  loadConfig: () => coreCfgDesk.loadConfig(), // 桌面侧核实例（与 `assembleFor` 同装载面）
  createMemory: () => ({ search: async () => [] }),
  createAgent: ({ provider, tools, config, cwd, memory }) => ({ provider, tools, config, cwd, memory, history: [], title: "" }),
  assembleBuiltinTools: async () => [],
  discoverRules: () => [],
  syncDir: async () => {},
  team: () => null,
  author: () => "test",
}

// ─── T1 · 核回退序三步逐档 + 模型面三步 + resolveChannelModel ────────────────

test("T1 核回退序三步逐档 + 模型面三步 + resolveChannelModel（纯函数 · 零 I/O）", () => {
  const plan = (providers, defaultModel, slot) => coreRef.resolveProviderPlan({ providers, defaultModel, slot })

  // ① 会话槽渠道（在册 ∧ 持 key）——带槽模型 ⇒ 模型面①；无槽模型 ⇒ 模型面②（dm 属渠段 ∥ `null`——渠道单值退场）
  assert.deepEqual(proj(plan([DS, KM], "kimi:kimi-k3", FAKE_SLOT)),
    { state: "ok", source: "slot", channel: "deepseek", model: null, "provider.name": "deepseek", "provider.model": null }, "槽渠道入选（source=slot——渠道单值退场 ⇒ 模型面 null）")
  assert.equal(plan([DS, KM], "kimi:kimi-k3", { provider: "deepseek", model: "ds-slot" }).model, "ds-slot", "模型面①：槽带模型 ⇒ 槽模型")
  // ① 跳过两档（KD-841-2 key 门 + 在册门）
  assert.equal(plan([NK, KM], null, { provider: "nokey", model: "x" }).channel, "kimi", "槽无 key ⇒ 跳过（不钉进运行态）")
  assert.equal(plan([KM], "kimi:kimi-k3", { provider: "ghost", model: "x" }).channel, "kimi", "槽不在册 ⇒ 跳过")

  // ② defaultModel 渠道（解析通过 ∧ 持 key）
  assert.deepEqual(proj(plan([DS], "deepseek:deepseek-v4-pro", null)),
    { state: "ok", source: "defaultModel", channel: "deepseek", model: "deepseek-v4-pro", "provider.name": "deepseek", "provider.model": "deepseek-v4-pro" }, "defaultModel 渠道入选")
  // ③ 首个持 key 渠道（按表序）
  assert.equal(plan([NK, KM], "nokey:x", null).source, "registry", "③ 回归表序首选")
  assert.equal(plan([KM, DS], null, null).channel, "kimi", "③ 表序（kimi 在首）")
  // ④ invalid 两档 + reason
  assert.equal(plan([], null, null).state, "invalid", "④ 渠表空 ⇒ invalid")
  assert.equal(plan([], null, null).reason, "未配置任何 provider", "invalid reason（渠表空）")
  assert.equal(plan([NK], null, null).state, "invalid", "④ 全表无 key ⇒ invalid")
  assert.match(plan([NK], null, null).reason, /未配置 API 密钥/, "invalid reason（有渠无 key）")

  // reason 逐档（fallback = defaultModelReason 现两档 + 新档；ok ⇒ null）
  assert.match(plan([DS], null, null).reason, /defaultModel 未设置/, "fallback reason（缺）")
  assert.match(plan([DS], "deepseek:", null).reason, /model part is empty/, "fallback reason（不可解析）")
  assert.match(plan([DS], "nope:x", null).reason, /unknown provider/, "fallback reason（渠道不在册）")
  assert.match(plan([NK, KM], "nokey:x", null).reason, /无 API 密钥——已回退到可用渠道/, "fallback reason（渠道无 key——新档）")
  assert.equal(plan([DS], "deepseek:deepseek-v4-pro", null).reason, null, "ok ⇒ reason null")

  // 模型面 ①②③（② defaultModel 属入选渠道 ⇒ 其模型段；③ 无 ⇒ null）
  assert.equal(plan([DS], "deepseek:m2", null).model, "m2", "模型面②：dm 属入选渠道")
  assert.equal(plan([DS], "kimi:k1", null).model, null, "模型面②不属（他渠 ∕ 不可解析）⇒ null（渠道单值退场——不回退）")
  assert.equal(plan([DS, KM], "kimi:k1", { provider: "deepseek", model: null }).model, null, "模型面②：dm 属他渠 ∧ 槽无模型 ⇒ null（零回落）")
  assert.equal(plan([SOLO], null, null).model, null, "模型面③：无 ⇒ null（合法）")

  // resolveChannelModel 面（VSC 转口面——① dm 属本渠 ⇒ 模型段；② 其余 ⇒ null）
  assert.equal(coreRef.resolveChannelModel(DS, "deepseek:x"), "x", "转口①：dm 属本渠 ⇒ 模型段")
  assert.equal(coreRef.resolveChannelModel(DS, "kimi:k3"), null, "转口②：他渠 ⇒ null（不回退渠道单值）")
  assert.equal(coreRef.resolveChannelModel(DS, "deepseek:"), null, "转口：空模型段 ⇒ null（不回退渠道单值）")
  assert.equal(coreRef.resolveChannelModel(SOLO, null), null, "转口③：无 ⇒ null")
})

// ─── T2 · 状态分界矩阵 S1–S10（config 级三键） ───────────────────────────────

test("T2 状态分界矩阵 S1–S10：真夹具 + loadConfig 实读（providerState ∥ providerStateReason ∥ providerInvalidReason）", () => {
  try {
    for (const row of MATRIX) {
      withConfig(row.config)
      const cfg = coreCfg.loadConfig()
      assert.equal(cfg.providerState, row.cfg.state, `${row.id} state`)
      if (row.cfg.state === "ok") {
        assert.equal(cfg.providerStateReason, null, `${row.id} ok ⇒ providerStateReason null`)
      } else {
        assert.equal(typeof cfg.providerStateReason === "string" && cfg.providerStateReason !== "", true, `${row.id} state≠ok ⇒ providerStateReason 非空`)
      }
      if (!row.slotRow) { // 含槽行（S9）单列口径：config 级只断 state（运行渠道归假槽腿 T4）
        assert.equal(cfg.provider?.name ?? null, row.cfg.channel, `${row.id} config 级渠道`)
        assert.equal(cfg.provider?.model ?? null, row.cfg.model, `${row.id} config 级模型`)
      }
      if (cfg.provider?.name) assert.equal(cfg.providerInvalidReason, null, `${row.id} 有入选渠道 ⇒ providerInvalidReason null`)
      else assert.ok(cfg.providerInvalidReason, `${row.id} 无入选渠道 ⇒ providerInvalidReason 非空`)
      if (row.cfg.state === "invalid") assert.equal(cfg.provider?.name, undefined, `${row.id} invalid ⇒ provider 置空 {}`)
    }
  } finally {
    resetConfigPaths() // 三侧实例逐复位（与 T3/T4 同式）；仅核实例参与本用例
  }
})

// ─── T3 · 断言 C 明示必达（CLI 腿）＋ headless 源码判据 ──────────────────────

test("T3 断言 C：CLI 三态分流 + 负向锁 + 结构不全径（TUI）∥ headless 源码判据", async () => {
  try {
    for (const row of MATRIX) {
      withConfig(row.config)
      const cfg = coreCfg.loadConfig()
      const agent = {
        provider: cfg.provider, providers: cfg.providers, config: cfg,
        activeProvider: cfg.provider?.name ?? "", activeModel: cfg.provider?.model ?? null,
      }
      coreAssemble.validateProvider(agent, cfg) // 真核落/清标（TUI 启动同径）
      if (cfg.providerState === "invalid") agent.provider = null // tuiCommand 前置（D-S1 收正：仅 state invalid 清）
      let picked = 0
      const lines = []
      const ret = await tui.promptProviderIfInvalid(agent, async () => { picked += 1 }, (t) => lines.push(t))
      if (row.cfg.state === "ok") {
        assert.equal(cfg.providerInvalidReason, null, `${row.id} 负向锁前提：providerInvalidReason 空`)
        assert.equal(ret, false, `${row.id} ok ⇒ 零弹窗`); assert.equal(picked, 0, `${row.id} ok ⇒ 零 picker`); assert.deepEqual(lines, [], `${row.id} ok ⇒ 零节点（负向锁）`)
      } else if (row.cfg.state === "fallback") {
        assert.equal(ret, false, `${row.id} fallback ⇒ 不弹 picker（不打断）`); assert.equal(picked, 0, `${row.id} fallback ⇒ 零 picker`)
        assert.equal(lines.length, 1, `${row.id} fallback ⇒ 提示行在场（明示必达）`)
        const word = row.cfg.channel + (row.cfg.model ? `:${row.cfg.model}` : "")
        assert.ok(lines[0].includes(`本次使用 \`${word}\``), `${row.id} 词形 = 渠道[:模型]（model 缺省 ⇒ 仅渠道名）`)
      } else {
        assert.equal(ret, true, `${row.id} invalid ⇒ 弹 picker（导引节点在场）`); assert.equal(picked, 1, `${row.id} invalid ⇒ picker 恰一次`)
        assert.equal(lines.length, 1, `${row.id} invalid ⇒ 提示行（措辞 = 渠道 ∥ 密钥）`)
        assert.match(lines[0], /渠道 ∥ 密钥/, `${row.id} 取消提示措辞收正`)
      }
    }
    // 结构不全径（KD-841-4：缺 baseURL ⇒ 既有装配标记落标——发送门 ∥ 桌面拒绝径载体；
    // 静置引导面按核态合成式判：`state === "ok"` ∧ `providerInvalidReason` 空 ⇒ 零节点（负向锁 = PROVIDER.md:437）
    // ——结构不全归发送失败面（#840 `provider` 类词），非启动 picker）
    withConfig({ providers: [{ name: "broken", model: "deepseek-flash", apiKey: "k1" }], defaultModel: "broken:deepseek-flash" })
    const cfg = coreCfg.loadConfig()
    assert.equal(cfg.providerState, "ok", "前提：默认模型独立成立（解析通过 ∧ 持 key）")
    assert.equal(cfg.providerInvalidReason, null, "前提：provider 不完整面 = 核 providerInvalidReason（name 在场 ⇒ null）")
    const agent = { provider: cfg.provider, providers: cfg.providers, config: cfg }
    coreAssemble.validateProvider(agent, cfg)
    assert.equal(agent._providerInvalid, true, "真核落标（缺 baseURL——发送门 ∥ 桌面拒绝径载体）")
    let picked = 0
    const ret = await tui.promptProviderIfInvalid(agent, async () => { picked += 1 }, () => {})
    assert.equal(ret, false, "结构不全 ⇒ 静置引导面零节点（归发送失败面）")
    assert.equal(picked, 0, "零 picker")
    // headless 腿（D-S4 收正——源码判据：invalid 类合成式 ⇒ error + exit 1；fallback ⇒ stderr 一行 +
    // 继续运行；两腿与 TUI 面同式——表达式面在 TUI 腿已行为机检，本腿销表达式驻档）
    const src = text("thincoder-cli/src/command-interactive.mjs")
    assert.match(src, /providerState === "invalid"/, "invalid 类门（合成式第一腿）在档")
    assert.match(src, /typeof headlessCfg\.providerInvalidReason === "string" && headlessCfg\.providerInvalidReason !== ""/, "invalid 类门（第二腿 = providerInvalidReason 非空）在档")
    assert.match(src, /exitSoon\(1\)/, "invalid ⇒ 明确退出码")
    assert.match(src, /providerState === "fallback"/, "fallback ⇒ stderr 一行在档")
    assert.ok(!/if \(agent\._providerInvalid\) \{/.test(src), "旧装配标记门零残留（headless）")
    assert.ok(!/未配置有效模型（defaultModel/.test(src), "旧 strict 词面零残留")
  } finally {
    resetConfigPaths()
  }
})

// ─── T4 · 断言 A 解析一致（config 级 + 运行面三端） ──────────────────────────

test("T4 断言 A：config 级只比 state ∥ 运行面（核直读 ∥ VSC resolveTurnStage ∥ 桌面 assembleFor+loadAgentSlot）逐字段", async () => {
  const stages = await mod("thincoder-vscode/src/extension/panel-turn-stages.mjs")
  const desktopAssemble = await mod("thincoder-desktop/src/main/agent-assemble.mjs")
  const desktopSessionIO = await mod("thincoder-desktop/src/main/session-io.mjs")
  const desktopSlots = await mod("thincoder-desktop/src/main/session-slots.mjs")
  desktopSlots._setSessionsDirForTest(tmpDir("piu-sessions-"))
  const cwd = tmpDir("piu-cwd-")
  try {
    for (const row of MATRIX) {
      withConfig(row.config)
      const cfg = coreCfg.loadConfig()
      // 腿 ①：config 级（无槽入参——KD-841-3）= 只比 state（修正块 :178）
      assert.equal(cfg.providerState, row.cfg.state, `${row.id} config 级 state`)
      // 腿 ②：核直读（全六字段基线）
      const plan = coreRef.resolveProviderPlan({ providers: cfg.providers, defaultModel: cfg.defaultModel, slot: FAKE_SLOT })
      assert.deepEqual(proj(plan), { ...row.run, "provider.name": row.run.channel, "provider.model": row.run.model }, `${row.id} 核腿逐字段`)
      // 腿 ③：VSC 回合面（resolveTurnStage——同喂假槽；B 单未落 ⇒ 现链读）
      const posted = []
      const panel = { _activeData: () => ({ activeProvider: FAKE_SLOT.provider, activeModel: FAKE_SLOT.model }), _panel: { webview: { postMessage: (m) => posted.push(m) } } }
      const stage = await stages.resolveTurnStage({ panel, turnSlot: 1, providerName: null, modelOverride: null, reasoning: null })
      if (row.run.channel === null) {
        assert.equal(stage.done, true, `${row.id} VSC：不可运行 ⇒ done`)
      } else {
        assert.equal(stage.done, false, `${row.id} VSC：可运行 ⇒ 不 done`)
        assert.equal(stage.providerName, row.run.channel, `${row.id} VSC 渠道 == 核`)
        assert.equal(stage.p?.name ?? null, row.run.channel, `${row.id} VSC provider.name == 核`)
        assert.equal(stage.p?.model ?? null, row.run.model, `${row.id} VSC 模型 == 核`)
      }
      // 腿 ④：桌面装配读（assembleFor 经核装配 + loadAgentSlot 槽施加——真槽文件）
      const slot = await desktopSlots.newSession(cwd)
      desktopSlots.writeSlotPrefs(cwd, slot, { provider: FAKE_SLOT.provider })
      const agent = await desktopAssemble.assembleFor({ cwd, slot, deps: LIGHT_DEPS })
      desktopSessionIO.loadAgentSlot(agent, cwd, slot)
      assert.equal(agent.config.providerState, row.run.state, `${row.id} 桌面 state == 核`)
      assert.equal(agent.activeProvider || null, row.run.channel, `${row.id} 桌面渠道 == 核`)
      assert.equal(agent.activeModel ?? null, row.run.model, `${row.id} 桌面模型 == 核`)
      assert.equal(agent.provider?.name ?? null, row.run.channel, `${row.id} 桌面 provider.name == 核`)
      assert.equal(agent.provider?.model ?? null, row.run.model, `${row.id} 桌面 provider.model == 核`)
    }
  } finally {
    resetConfigPaths()
    desktopSlots._resetSessionsDirForTest()
  }
})

// ─── T5 · 断言 B 单源 + VSC 回归对拍（可用性不得降） ─────────────────────────

test("T5 断言 B 单源（源码判据）+ VSC 回归对拍 S1/S2/S6（可用性不得降）", () => {
  // ① VSC 回归对拍（S1/S2/S6 新读数 == 设计矩阵「现 · VSC」列——渠道+key 已配 ⇒ 三端仍直接可发）
  try {
    for (const row of [
      { id: "S1", config: { providers: [DS] }, was: ["deepseek", null] },
      { id: "S2", config: { providers: [DS], defaultModel: "deepseek:" }, was: ["deepseek", null] },
      { id: "S6", config: { providers: [DS, KM], defaultModel: "kimi:kimi-k3" }, was: ["kimi", "kimi-k3"] },
    ]) {
      withConfig(row.config)
      const cfg = coreCfg.loadConfig()
      const plan = coreRef.resolveProviderPlan({ providers: cfg.providers, defaultModel: cfg.defaultModel })
      assert.deepEqual([plan.channel, plan.model], row.was, `${row.id} 新读数 == 现 VSC 读数（可用性不得降）`)
      assert.notEqual(plan.state, "invalid", `${row.id} 可直接可发（非 invalid）`)
    }
  } finally {
    resetConfigPaths()
  }
  // ② CLI ∥ 桌面取值点唯一 = `loadConfig().provider`（零自建渠道扫描）——已落
  for (const rel of [
    "thincoder-cli/src/command-interactive.mjs", "thincoder-cli/src/tui/index.mjs",
    "thincoder-desktop/src/main/agent-assemble.mjs", "thincoder-desktop/src/main/turn-input.mjs",
  ]) {
    assert.ok(!/resolveProviders\(|providerNames\(/.test(text(rel)), `${rel} 零自建渠道扫描`)
  }
  // ③ VSC 树零自建回退扫描 + 核转口（B 单目标态——未落 ⇒ 本组预期红）
  const stages = text("thincoder-vscode/src/extension/panel-turn-stages.mjs")
  assert.ok(!/for \(const n of providerNames\(\)\)/.test(stages), "panel-turn-stages 零自建扫描链（B 单）")
  assert.match(stages, /resolveProviderPlan/, "回合面改核调用（B 单）")
  const presets = text("thincoder-vscode/src/extension/presets.mjs")
  assert.match(presets, /resolveChannelModel/, "resolveDefaultModel 改核转口（B 单）")
  assert.ok(!/dm\.indexOf\(":"\)/.test(presets), "presets 零自持解析（B 单）")
})
