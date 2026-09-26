/**
 * config-io-panel-guard.test.mjs — 两键写面收口（批 2026-09-25-config-mirror-closeout · T-1..T-8）。
 * 设计：`docs/vsc/design/SETTINGS.md` §2.14（写面契约）+ §3（`advisor.guard` 通用保存登记）。
 *
 * 契约：`advisor.guard` / `agent.engineering` 两键的**唯一**写面 = 会话槽；通用面板保存面
 * （`saveAgentSettingsFromPanel`）对两键零写（config 镜像写已停——翻转路径不碰 config，
 * 通用保存路径键级恒等）。
 * 断言口径：翻转路径 = config **字节**恒等；通用保存路径 = **键级**恒等（该路径必重序列化 config）。
 *
 * 拆分自 `test/config-io-panel.test.mjs`（实施轮末实读 307 > 300 软线——批档 §2.4 预案执行）
 * 边界 = advisor.guard / engineering 写面组；原档保留 effort 键接线组（V-1..V-4 / V-6）。
 * 夹具自持——零跨档 import（与同族拆分先例一致）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest, loadRaw } from "@thincoder/core/config-io.mjs"
import { saveAgentSettingsFromPanel } from "../src/extension/settings-panel-write.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../src/extension/session-io.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"

let dir
let cfgPath
let sessionsDir

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-panel-guard-"))
  sessionsDir = join(dir, "sessions")
  mkdirSync(sessionsDir, { recursive: true })
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({
    defaultModel: "deepseek:deepseek-v4-pro",
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
    ],
  }, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  _setSessionsDirForTest(sessionsDir)
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── 夹具 ───────────────────────────────────────────────────────────────────

const GSLOT = 9

/** 盘面 advisor 段直写（前置态注入——不经面板写面）。 */
function seedAdvisor(obj) {
  const raw = loadRaw()
  raw.agent = { ...(raw.agent ?? {}), advisor: obj }
  writeFileSync(cfgPath, JSON.stringify(raw, null, 2) + "\n", "utf8")
}
const advOf = () => loadRaw().agent?.advisor ?? {}

/** 真实 `saveLines` 物化槽（同档 selectModel 用例先例——槽文件在盘 ⇒ 开关写面无需认领）。 */
async function seedSlot(slot) {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  saveLines({ _slot: slot }, [], [], {}, slot)
}

/** 面板桩：翻转路径 / 通用保存路径共用（`_ensureSlot` 指真槽）。 */
function mkPanel(over) {
  const prefs = {}
  const push = { light: 0 }
  const panel = {
    _context: { workspaceState: { get: () => prefs, update: (k, v) => { prefs[k] = v } } },
    _loadModelPrefs: () => (prefs.modelPrefs ??= {}),
    _ensureSlot: () => GSLOT,
    _setPlanMode: async () => {}, // ENG-PLAN-EXCLUSION：工程位 ON 翻转先清 plan 残留
    _saveLines: () => {},
    _pushSessions: () => {},
    _pushSettingsLight: () => { push.light += 1 },
    _panel: { webview: { postMessage: () => Promise.resolve(true) } },
    ...(over ?? {}),
  }
  return { panel, push }
}
const slotOf = (slot) => JSON.parse(readFileSync(slotPath(process.cwd(), slot), "utf8"))
const cfgBytes = () => readFileSync(cfgPath, "utf8")

// ─── 翻转路径：槽写 + config 零写 ────────────────────────────────────────────

test("T-1 槽写 ON：setAdvisorGuard{value:true} ⇒ 槽 advisor.guard 真值 ∧ config 逐字不变", async () => {
  await seedSlot(GSLOT)
  const before = cfgBytes()
  const { panel, push } = mkPanel()
  await handlePanelMessage(panel, { type: "setAdvisorGuard", value: true })
  assert.equal(slotOf(GSLOT).advisor.guard, true, "槽 = 唯一写面（真值可辨——非真值即改写未达）")
  assert.equal(cfgBytes(), before, "config 逐字不变（A：镜像写已停）")
  assert.equal(push.light, 1, "推送面刷新")
})

test("T-2 槽写 OFF：setAdvisorGuard{value:false} ⇒ 槽 advisor.guard 假值（不被真值兜底吃掉）", async () => {
  await seedSlot(GSLOT)
  const before = cfgBytes()
  const { panel, push } = mkPanel()
  await handlePanelMessage(panel, { type: "setAdvisorGuard", value: true })
  await handlePanelMessage(panel, { type: "setAdvisorGuard", value: false })
  assert.equal(slotOf(GSLOT).advisor.guard, false, "假值可辨（`?? true` 形态的兜底会吃掉这一格）")
  assert.equal(cfgBytes(), before, "config 逐字不变")
  assert.equal(push.light, 2, "两翻转两推送")
})

test("T-3 同口径：setEngineeringEnabled{true/false} ⇒ 槽 engineering 变 ∧ config 逐字不变", async () => {
  await seedSlot(GSLOT)
  const before = cfgBytes()
  const { panel, push } = mkPanel()
  await handlePanelMessage(panel, { type: "setEngineeringEnabled", value: true })
  assert.equal(slotOf(GSLOT).engineering, true, "槽 engineering 真值")
  await handlePanelMessage(panel, { type: "setEngineeringEnabled", value: false })
  assert.equal(slotOf(GSLOT).engineering, false, "槽 engineering 假值")
  assert.equal(cfgBytes(), before, "config 逐字不变（#379 镜像写已停）")
  assert.equal(push.light, 2)
})

// ─── 通用保存路径：伪造载荷零写 ──────────────────────────────────────────────

test("T-4 旁路直测：通用保存伪造 engineering:true ⇒ config 无 agent.engineering ∧ 槽字节不变", async () => {
  await seedSlot(GSLOT)
  const slotFile = slotPath(process.cwd(), GSLOT)
  const slotBefore = readFileSync(slotFile, "utf8")
  saveAgentSettingsFromPanel({ engineering: true, maxTurns: 77 })
  assert.equal("engineering" in (loadRaw().agent ?? {}), false, "白名单已删项（B）——伪造载荷不可达")
  assert.equal(loadRaw().agent.maxTurns, 77, "同载荷其余键照常落盘（对照组——证明该保存确实执行）")
  assert.equal(readFileSync(slotFile, "utf8"), slotBefore, "槽不受通用保存影响")
})

test("T-5 旁路直测：通用保存伪造 advisor:{guard:true} ⇒ 盘上 guard 不动（不翻转／不物化）", () => {
  seedAdvisor({ guard: false, model: "hy3" })
  saveAgentSettingsFromPanel({ advisor: { guard: true } })
  assert.equal(advOf().guard, false, "盘上 false 不被载荷 true 翻转（B′：`merged.guard` 赋值行已删）")
  assert.equal(advOf().model, "hy3", "种子循环 verbatim 存活")
  seedAdvisor({ model: "hy3" }) // 盘上缺席格
  saveAgentSettingsFromPanel({ advisor: { guard: true } })
  assert.equal("guard" in advOf(), false, "载荷 guard 不物化（缺席保持缺席——`?? false` 已删）")
})

test("T-6 三格恒等：盘 guard ∈ {缺席 · true · false} × 通用保存 ⇒ 存留性与值逐格不变", () => {
  for (const [label, guard] of [["缺席", "absent"], ["true", true], ["false", false]]) {
    seedAdvisor(guard === "absent" ? { model: "hy3" } : { guard, model: "hy3" })
    saveAgentSettingsFromPanel({ advisor: {}, maxTurns: 55 })
    const after = "guard" in advOf() ? advOf().guard : "absent"
    assert.equal(after, guard, "[" + label + "] 前后恒等（缺席格捕捉 `?? false` 物化，值格捕捉改写）")
  }
})

test("T-7 登记钉住：盘 advisor.guard: null × 通用保存 ⇒ 键缺席 ∧ 其余键不变", () => {
  seedAdvisor({ guard: null, model: "hy3", reasoningEffort: "low", thinking: null })
  saveAgentSettingsFromPanel({ advisor: {} })
  assert.equal("guard" in advOf(), false, "null = 清空（种子循环丢弃）⇒ 顶层整键替换后缺席（SETTINGS.md §3 静态预期）")
  assert.equal(advOf().model, "hy3", "其余键不变")
  assert.equal(advOf().reasoningEffort, "low", "其余键不变")
  assert.equal(advOf().thinking, null, "off 形 carve-out 存活")
})

// ─── 错误路径 ───────────────────────────────────────────────────────────────

test("T-8 错误：槽未认领（写面收敛 null）翻 guard ⇒ 面板不崩 ∧ config 逐字不变", async () => {
  const foreign = 7
  const { loadManifest, saveManifest } = await import("../src/extension/session-io.mjs")
  const m = loadManifest(process.cwd())
  m.slotSessions = { ...(m.slotSessions ?? {}), [foreign]: "peer-session-xyz" }
  saveManifest(process.cwd(), m)
  const before = cfgBytes()
  const { panel, push } = mkPanel({ _ensureSlot: () => foreign })
  await handlePanelMessage(panel, { type: "setAdvisorGuard", value: true })
  assert.equal(existsSync(slotPath(process.cwd(), foreign)), false, "未认领槽零落盘（写面返回 false 不抛）")
  assert.equal(cfgBytes(), before, "config 逐字不变（失败不回落镜像写）")
  assert.equal(push.light, 1, "推送面照常（catch 兜底不阻断）")
})
