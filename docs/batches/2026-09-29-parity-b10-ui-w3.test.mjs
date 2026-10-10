/**
 * b10-w3.test.mjs — parity-b10-ui 批 · W3 设置面余面（S8–S11 ∕ S14 ∕ S17）批内件。
 * 覆盖 = §2.6 逐行「判据」列 + §2.12 用例表（T7 ∕ T8 ∕ T9）+ 通道面结构（51 项两向相等）+ S17 候选面对拍。
 * 跑法：`node --test .thincoder/tmp/b10-w3.test.mjs`（cwd 任意；本件自锚仓根）——W6 汇总并入
 * `docs/batches/2026-09-29-parity-b10-ui.test.mjs`（本件 = 暂存件，勿直接写批内目录）。
 * 零第三方依赖（仅 node: 内建）；盘面用临时 config（`_setConfigPathForTest`）；槽面用临时 sessions 根
 * （`_setSessionsDirForTest`）；探针 / 遍历面全离线（S9 一支 = 本机即时失败的真命令 —— 零外部依赖）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
// tmp 直跑适配（`add-dialog-verify/` 深度 3）：两候选根取命中——原位（depth 2）∥ tmp 两处皆兼容
const ROOT = [join(HERE, "..", ".."), join(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-desktop"))) // 仓根
const at = (p) => pathToFileURL(join(ROOT, p)).href
const read = (p) => readFileSync(join(ROOT, p), "utf8")
const deskReq = createRequire(join(ROOT, "thincoder-desktop/package.json"))
const coreAt = (p) => pathToFileURL(deskReq.resolve("@thincoder/core/" + p)).href
/** 确定性等待（fire-and-forget 链落定）。 */
const settle = async (cond, tries = 200) => { for (let i = 0; i < tries && !cond(); i += 1) await new Promise((r) => setTimeout(r, 0)) }

await import(at("thincoder-desktop/test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于渲染档取件）

const coreIo = await import(coreAt("config-io.mjs"))
const coreThinkOff = await import(coreAt("think-off.mjs"))
const coreSpecs = await import(coreAt("model-specs.mjs"))
const coreShell = await import(coreAt("shell-candidates.mjs"))
const coreSession = await import(coreAt("session.mjs"))
const coreSlots = await import(coreAt("session-slots.mjs"))
const coreSlotWrite = await import(coreAt("session-slot-write.mjs"))
const mcp = await import(at("thincoder-desktop/src/main/mcp-servers.mjs"))
const settingsMain = await import(at("thincoder-desktop/src/main/settings.mjs"))
const settingsValues = await import(at("thincoder-desktop/src/main/settings-values.mjs"))
const settingsEnv = await import(at("thincoder-desktop/src/main/settings-env.mjs"))
const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
const agentView = await import(at("thincoder-desktop/renderer/views/settings-agent.mjs"))
const mcpView = await import(at("thincoder-desktop/renderer/views/settings-sections-mcp.mjs"))
const agentExitsMod = await import(at("thincoder-desktop/renderer/mount-settings-segments-agent.mjs"))
const segmentsMod = await import(at("thincoder-desktop/renderer/mount-settings-segments.mjs"))
const mcpExitsMod = await import(at("thincoder-desktop/renderer/mount-settings-segments-mcp.mjs"))

/** 临时 config 夹具（调用面自管 `_setConfigPathForTest` 复位）。 */
function withConfig(seed) {
  const dir = mkdtempSync(join(tmpdir(), "b10-w3-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed))
  coreIo._setConfigPathForTest(cfg)
  return cfg
}
const diskOf = (cfg) => JSON.parse(readFileSync(cfg, "utf8"))
/** 假 store（最小面：get ∕ set 采纳新态 + 记录 —— `applyFlags` 落态可断）。 */
function fakeStore(seed) {
  let state = seed
  return { get: () => state, set: (next) => { state = next === null || typeof next !== "object" ? state : next; return state } }
}

/** 族别两样模型（本件两处用：effort 族 off 形 = `null` ∕ type 族 = `{type:"disabled"}`）——取前先核。 */
const EFFORT_MODEL = "hy3"
const TYPE_MODEL = "deepseek-v4-flash"
const effortSpec = coreSpecs.specForModel(EFFORT_MODEL)
const typeSpec = coreSpecs.specForModel(TYPE_MODEL)

/** 渲染面 advisor 档位选中值（经 `agentBody` 真树取 —— 投影恒等判据面；`models` 给候选；
 *  `advisorModel` 缺省 = 盘上 advisor 覆写模型（与归一回落链的前项一致）。 */
function effortSelected(cfg, { models = [], advisorModel = undefined } = {}) {
  const disk = diskOf(cfg)
  const target = advisorModel === undefined ? (typeof disk.agent?.advisor?.model === "string" ? disk.agent.advisor.model : null) : advisorModel
  const section = {
    state: "ready", fields: settingsValues.agentFields(disk),
    models, provider: null, advisorModel: target, guard: null,
  }
  const rows = agentView.agentBody(section, { onNamedField: () => {} })
  const row = rows.find((n) => n?.props?.["data-field-name"] === "agent.advisor.reasoningEffort")
  const select = row.children[1]
  const chosen = select.children.find((option) => option.props.selected === true)
  return chosen === undefined ? null : chosen.props.value
}

// ─── S11 ∕ 核 helper：applyAdvisorEffort 三态（两族别）─────────────────────────

test("S11：核 helper applyAdvisorEffort —— none ⇒ 族别 off 形 + 删档；档 ⇒ 字面值 + 清 off 形；空 ⇒ 两清", () => {
  assert.equal(effortSpec.thinkApi, "effort")
  assert.ok((effortSpec.reasoningEffortEnum ?? []).includes("none"), "样模型枚举含 none（off 可达）")
  assert.notEqual(typeSpec.thinkApi, "effort")
  const offOf = (spec) => coreThinkOff.thinkOffShape(spec)
  // ① effort 族：none ⇒ thinking = null + 删 reasoningEffort
  const a = { provider: "p", model: EFFORT_MODEL, reasoningEffort: "low" }
  coreThinkOff.applyAdvisorEffort(a, "none", effortSpec)
  assert.deepEqual(a.thinking, offOf(effortSpec))
  assert.equal("reasoningEffort" in a, false)
  assert.equal(a.provider, "p", "兄弟键不动")
  // ② 档（自 off 恢复）：字面值 + 清 null 形
  coreThinkOff.applyAdvisorEffort(a, "high", effortSpec)
  assert.equal(a.reasoningEffort, "high")
  assert.equal("thinking" in a, false)
  // ③ 空 ⇒ 两清（回中性）
  coreThinkOff.applyAdvisorEffort(a, "", effortSpec)
  assert.equal("reasoningEffort" in a, false)
  assert.equal("thinking" in a, false)
  // ④ type 族：none ⇒ {type:"disabled"}；档 ⇒ 清 off 形（源式只清 null 字面 —— B10 S11 收正）
  const b = {}
  coreThinkOff.applyAdvisorEffort(b, "none", typeSpec)
  assert.deepEqual(b.thinking, offOf(typeSpec))
  coreThinkOff.applyAdvisorEffort(b, "medium", typeSpec)
  assert.equal(b.reasoningEffort, "medium")
  assert.equal("thinking" in b, false, "type 族 off 形残记同清（否则档位读回被压）")
  coreThinkOff.applyAdvisorEffort(b, "", typeSpec)
  assert.equal("thinking" in b, false)
})

test("S11 ∕ 写面 spec 归属（收正 · 顾问 🟡2）：advisor 无覆写 ⇒ 取形 = 主模型段（`defaultModel`）——effort 族 ⇒ `null` 形真有效；type 族 ⇒ disabled 形", () => {
  // ① effort 族主模型（无 advisor 覆写）：none ⇒ thinking = null（非 DEFAULT_SPEC 的 disabled 形）
  const cfg = withConfig({ defaultModel: `p:${EFFORT_MODEL}` })
  try {
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "none" } }).ok, true)
    assert.equal(diskOf(cfg).agent.advisor.thinking, null, "族别 off 形随主模型（核 `resolveAdvisorProvider` 同序）")
    assert.equal(effortSelected(cfg, { advisorModel: EFFORT_MODEL }), "none")
    // ② type 族主模型：同径 ⇒ disabled 形；档 ⇒ 字面值且残记清
    const cfg2 = withConfig({ defaultModel: `p:${TYPE_MODEL}` })
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "none" } }).ok, true)
    assert.deepEqual(diskOf(cfg2).agent.advisor.thinking, { type: "disabled" })
    settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "medium" } })
    assert.equal(diskOf(cfg2).agent.advisor.reasoningEffort, "medium")
    assert.equal("thinking" in diskOf(cfg2).agent.advisor, false)
    assert.equal(effortSelected(cfg2, { advisorModel: TYPE_MODEL }), "medium")
    // ③ 渠默认模型项（advisor.provider 在配、无 model）：取形 = 该渠条目 model 而非主模型段
    const cfg3 = withConfig({ defaultModel: `p:${EFFORT_MODEL}`, providers: [{ name: "adv", model: TYPE_MODEL }], agent: { advisor: { provider: "adv" } } })
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "none" } }).ok, true)
    assert.deepEqual(diskOf(cfg3).agent.advisor.thinking, { type: "disabled" }, "渠默认模型族别胜出")
  } finally { coreIo._resetConfigPathForTest() }
})

// ─── S11 ∕ T8：settings:agent 三态写盘 + 回读投影恒等 ─────────────────────────

test("S11 ∕ T8：三态写（none ∕ 档 ∕ 空）——盘 off 形 ∧ 删 reasoningEffort ∕ 字面值 ∕ 删键；写后投影恒等", () => {
  const cfg = withConfig({ agent: { advisor: { model: EFFORT_MODEL } } })
  try {
    // none ⇒ 盘 off 形 + 删 reasoningEffort；投影 = none
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "none" } }).ok, true)
    let disk = diskOf(cfg)
    assert.deepEqual(disk.agent.advisor.thinking, coreThinkOff.thinkOffShape(effortSpec))
    assert.equal("reasoningEffort" in disk.agent.advisor, false)
    assert.equal(effortSelected(cfg), "none", "投影恒等（off 形 ⇒ none）")
    // 档 ⇒ 字面值（off 形清）；投影 = 该档
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "high" } }).ok, true)
    disk = diskOf(cfg)
    assert.equal(disk.agent.advisor.reasoningEffort, "high")
    assert.equal("thinking" in disk.agent.advisor, false)
    assert.equal(effortSelected(cfg), "high")
    // 空 ⇒ 删档（中性）；投影 = 空选
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "" } }).ok, true)
    disk = diskOf(cfg)
    assert.equal("reasoningEffort" in disk.agent.advisor, false)
    assert.equal(effortSelected(cfg), "", "投影恒等（两清 ⇒ 中性）")
    // type 族：档后不携 off 形残记（B10 收正——源式残留会压过档位读回）
    const cfg2 = withConfig({ agent: { advisor: { model: TYPE_MODEL } } })
    settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "none" } })
    assert.deepEqual(diskOf(cfg2).agent.advisor.thinking, { type: "disabled" })
    settingsMain.settingsAgent({ patch: { "agent.advisor.reasoningEffort": "medium" } })
    assert.equal(diskOf(cfg2).agent.advisor.reasoningEffort, "medium")
    assert.equal("thinking" in diskOf(cfg2).agent.advisor, false)
    assert.equal(effortSelected(cfg2), "medium")
    // 同批其余键先落后置（S11 三态写后置不影响同批 patch）
    settingsMain.settingsAgent({ patch: { "agent.maxTurns": 42, "agent.advisor.reasoningEffort": "none" } })
    assert.equal(diskOf(cfg2).agent.maxTurns, 42)
  } finally { coreIo._resetConfigPathForTest() }
})

test("S11 ∕ 控件形：advisor 档 = select（占位 ∕ none ∕ 枚举 ∕ 表外现值自成一选项）", () => {
  i18n.initDict({ locale: "zh" })
  const models = [{ id: EFFORT_MODEL, effortEnum: effortSpec.reasoningEffortEnum }]
  const section = { state: "ready", fields: [], models, provider: null, advisorModel: EFFORT_MODEL, guard: null }
  const row = agentView.agentBody(section, { onNamedField: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.advisor.reasoningEffort")
  assert.equal(row.children[1].tag, "select", "控件 = 选项（非文本）")
  const values = row.children[1].children.map((option) => option.props.value)
  assert.equal(values[0], "", "占位项（中性）恒首")
  assert.ok(values.includes("none"), "none 特值在场（关思考）")
  for (const level of effortSpec.reasoningEffortEnum) if (level !== "none") assert.ok(values.includes(level) || level === "enabled", `枚举档 ${level} 在场`)
  // 表外现值自成一选项（禁吞）
  const odd = { ...section, fields: [{ path: "agent.advisor.reasoningEffort", value: "handwritten-level", kind: "string", sensitive: false }] }
  const oddRow = agentView.agentBody(odd, { onNamedField: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.advisor.reasoningEffort")
  assert.ok(oddRow.children[1].children.some((option) => option.props.value === "handwritten-level" && option.props.selected === true))
  // 归属模型缺：枚举无档级可选（仅占位 ∕ none）——零假造
  const bare = { ...section, fields: [], advisorModel: null }
  const bareValues = agentView.agentBody(bare, { onNamedField: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.advisor.reasoningEffort").children[1].children.map((option) => option.props.value)
  assert.deepEqual(bareValues, ["", "none"], "无归属模型 ⇒ 不假造档级")
  // 归属模型在场（归一已回落）⇒ 枚举随行
  const inherit = { ...section, fields: [] }
  const inheritRow = agentView.agentBody(inherit, { onNamedField: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.advisor.reasoningEffort")
  assert.ok(inheritRow.children[1].children.some((option) => option.props.value === "none"))
})

// ─── S10 ∕ T7：六控件（形 ∕ 写径 ∕ 清径）────────────────────────────────────

test("S10 ∕ T7：六控件形（select + 复合候选 + 占位 Inherit）；非手打", () => {
  i18n.initDict({ locale: "zh" })
  const section = {
    state: "ready",
    fields: [{ path: "agent.subagentModel", value: "openai:gpt-4o", kind: "string", sensitive: false }],
    models: [{ id: "gpt-4o" }, { id: "o3" }], provider: "openai", advisorModel: null, guard: null,
  }
  const rows = agentView.agentBody(section, { onNamedField: () => {}, onSaveAgent: () => {} })
  const paths = ["agent.subagentModel", "agent.subagentModels.explore", "agent.subagentModels.plan", "agent.subagentModels.coder", "agent.subagentModels.eng-coder", "agent.subagentModels.eng-designer"]
  for (const path of paths) {
    const row = rows.find((n) => n?.props?.["data-field-name"] === path)
    assert.ok(row !== undefined, `控键 ${path} 在场`)
    assert.equal(row.children[1].tag, "select")
  }
  const global = rows.find((n) => n?.props?.["data-field-name"] === "agent.subagentModel").children[1]
  assert.deepEqual(global.children.map((option) => option.props.value), ["", "openai:gpt-4o", "openai:o3"], "候选 = 激活渠 `model:list` 投影复合值（+ 占位）")
  assert.equal(global.children.find((option) => option.props.selected === true).props.value, "openai:gpt-4o")
  const role = rows.find((n) => n?.props?.["data-field-name"] === "agent.subagentModels.explore").children[1]
  assert.equal(role.children.find((option) => option.props.selected === true).props.value, "", "空槽 ⇒ 占位（Inherit）选中")
  // 表外现值自成一选项（禁吞）
  const odd = { ...section, fields: [{ path: "agent.subagentModel", value: "other-provider:m1", kind: "string", sensitive: false }] }
  const oddSelect = agentView.agentBody(odd, { onNamedField: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.subagentModel").children[1]
  assert.ok(oddSelect.children.some((option) => option.props.value === "other-provider:m1" && option.props.selected === true))
})

test("S10 ∕ T7：选定 ⇒ patch 同键；清空 ⇒ null（显式清除）⇒ 盘删键 ∧ 回读缺键", async () => {
  // ① 出口出值两径（写 ∕ 清）
  const calls = []
  const patches = []
  const exits = agentExitsMod.createAgentExits({
    ask: async (channel, payload) => { calls.push([channel, payload]); return { ok: true, reason: null, fields: [] } },
    store: fakeStore({ settings: { agent: { fields: [] } }, activeSession: null }),
    setSettings: (patch) => patches.push(patch),
    report: () => {}, clearReport: () => {}, slot: '[data-slot="settings"]', paintSettings: () => {},
  })
  const entry = { path: "agent.subagentModels.explore", kind: "model" }
  await exits.handlers.onNamedField(entry, { target: { value: "openai:o3" } })
  assert.deepEqual(calls[0], ["settings:agent", { patch: { "agent.subagentModels.explore": "openai:o3" } }], "选定 ⇒ patch 同键")
  await exits.handlers.onNamedField(entry, { target: { value: "" } })
  assert.deepEqual(calls[1], ["settings:agent", { patch: { "agent.subagentModels.explore": null } }], "清空 ⇒ null（显式清除）")
  assert.equal(patches.length, 2, "成功径 ⇒ fields 就地刷新")
  // ② 盘面两径
  const cfg = withConfig({ agent: { subagentModel: "openai:gpt-4o", subagentModels: { explore: "openai:o3" } } })
  try {
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.subagentModel": null } }).ok, true)
    let disk = diskOf(cfg)
    assert.equal("subagentModel" in disk.agent, false, "清空 ⇒ 盘删键")
    assert.ok(settingsValues.agentFields(disk).every((field) => field.path !== "agent.subagentModel"), "回读缺键")
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.subagentModels.explore": null } }).ok, true)
    disk = diskOf(cfg)
    assert.equal("explore" in disk.agent.subagentModels, false, "角色槽删键（同族表）")
    assert.equal(disk.agent.subagentModels.plan, undefined)
    // ③ 选定写入仍走核校验（非串 / 空串 ⇒ 拒 + 零写——沿子代理模型形状表）
    const before = readFileSync(cfg, "utf8")
    const rejected = settingsMain.settingsAgent({ patch: { "agent.subagentModel": "  " } })
    assert.equal(rejected.ok, false)
    assert.equal(readFileSync(cfg, "utf8"), before, "拒径零写")
  } finally { coreIo._resetConfigPathForTest() }
})

// ─── S14 ∕ T9：slot 权威键拒写 + guard 开关槽面 ─────────────────────────────

test("S14a ∕ T9：patch 命中 agent.advisor.guard ∕ agent.engineering ⇒ 拒（slot-authority）+ 盘零变", () => {
  const cfg = withConfig({ agent: { engineering: false, advisor: { guard: false }, maxTurns: 200 } })
  try {
    const before = readFileSync(cfg, "utf8")
    const guard = settingsMain.settingsAgent({ patch: { "agent.advisor.guard": true } })
    assert.equal(guard.ok, false)
    assert.equal(guard.reason, "slot-authority")
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.engineering": true } }).reason, "slot-authority")
    const mixed = settingsMain.settingsAgent({ patch: { "agent.maxTurns": 7, "agent.advisor.guard": false } })
    assert.equal(mixed.reason, "slot-authority", "混合 patch 整拒")
    assert.equal(readFileSync(cfg, "utf8"), before, "拒径盘零变（含混合 patch 的合法键）")
    // 对照：键面权威写仍可达（会话槽面）
    assert.equal(settingsMain.settingsAgent({ patch: { "agent.maxTurns": 7 } }).ok, true)
  } finally { coreIo._resetConfigPathForTest() }
})

test("S14b ∕ T9：guard 开关（控件形 ∕ 出口载荷 ∕ 回执切片）+ 跨端同槽槽往返", async () => {
  i18n.initDict({ locale: "zh" })
  // ① 控件形：值面 = guard 槽投影（真 ∕ 假 ∕ 未知禁用）
  const base = { state: "ready", fields: [], models: [], provider: null, advisorModel: null }
  const on = agentView.agentBody({ ...base, guard: true }, { onToggleGuard: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.advisor.guard")
  assert.equal(on.children[1].props.type, "checkbox")
  assert.equal(on.children[1].props.checked, true)
  assert.equal(typeof on.children[1].props.onChange, "function")
  const unknown = agentView.agentBody({ ...base, guard: null }, { onToggleGuard: () => {} }).find((n) => n?.props?.["data-field-name"] === "agent.advisor.guard")
  assert.equal(unknown.children[1].props.disabled, true, "未知 ⇒ 禁用（禁假造）")
  // ② 出口载荷 + 回执切片（agent 在场：flags 键回携）
  const calls = []
  const withAgent = fakeStore({ activeSession: "3", settings: { agent: { fields: [] } }, sessionFlags: { 3: { planMode: true, autoApprove: false, advisorGuard: false, engineering: false } } })
  const exits = agentExitsMod.createAgentExits({
    ask: async (channel, payload) => { calls.push([channel, payload]); return { ok: true, reason: null, flags: { planMode: true, autoApprove: false, advisorGuard: true, engineering: false } } },
    store: withAgent, setSettings: () => {}, report: () => {}, clearReport: () => {}, slot: "", paintSettings: () => {},
  })
  await exits.handlers.onToggleGuard({ target: { checked: true } })
  assert.deepEqual(calls[0], ["session:flags", { key: "3", patch: { advisorGuard: true } }], "写经槽面（非 patch）")
  assert.equal(withAgent.get().sessionFlags["3"].advisorGuard, true, "回执 flags ⇒ 切片写")
  // ③ agent 不在场（回执无 flags 键）：以确认值合并 —— 其余位不丢
  const noFlags = fakeStore({ activeSession: "3", settings: { agent: { fields: [] } }, sessionFlags: { 3: { planMode: true, autoApprove: false, advisorGuard: false, engineering: true } } })
  const exits2 = agentExitsMod.createAgentExits({
    ask: async () => ({ ok: true, reason: null }),
    store: noFlags, setSettings: () => {}, report: () => {}, clearReport: () => {}, slot: "", paintSettings: () => {},
  })
  await exits2.handlers.onToggleGuard({ target: { checked: true } })
  assert.equal(noFlags.get().sessionFlags["3"].advisorGuard, true)
  assert.equal(noFlags.get().sessionFlags["3"].engineering, true, "其余三位不丢")
  // ④ 跨端同槽：核槽写往返（同一份槽文件 —— 桌面 / VSC / CLI 同槽）
  const slotsDir = mkdtempSync(join(tmpdir(), "b10-w3-slots-"))
  coreSlots._setSessionsDirForTest(slotsDir)
  try {
    const cwd = join(slotsDir, "proj")
    coreSlotWrite.saveSlotData(cwd, 3, coreSlotWrite.newSlotData(cwd)) // 物化槽文件（读改写前置）
    assert.equal(coreSlotWrite.setSlotAdvisorGuard(cwd, 3, true), true, "槽写发生")
    assert.equal(coreSession.loadSlotFile(cwd, 3).advisor.guard, true, "读回 = 写入（跨端同槽）")
    assert.equal(coreSlotWrite.setSlotAdvisorGuard(cwd, 3, false), true)
    assert.equal(coreSession.loadSlotFile(cwd, 3).advisor.guard, false, "关方向往返不丢")
  } finally { coreSlots._setSessionsDirForTest(null) }
})

// ─── S8：mcp:list config 回执 + mcp:update 原位替换 ─────────────────────────

test("S8：mcp:list 行增 config（预填源七键）；mcp:update 原位替换（数组序保持）∕ 未知名 ⇒ unknown-server 零写", async () => {
  const cfg = withConfig({
    mcp: { servers: [{ name: "a", command: "node", args: ["x.js"], env: { K: "v" } }, { name: "b", url: "https://m.example/mcp", token: "tk", headers: { "X-Foo": "bar" } }] },
  })
  try {
    const list = mcp.mcpList()
    assert.equal(list.ok, true)
    assert.deepEqual(list.servers[1].config, { command: undefined, args: undefined, env: undefined, url: "https://m.example/mcp", wsUrl: undefined, headers: { "X-Foo": "bar" }, token: "tk" }, "config = 预填源七键（现值）")
    assert.equal(list.servers[0].config.command, "node")
    // 更新：原位替换（序保持）+ 字段换形
    const updated = await mcp.mcpUpdate({ name: "a", config: { url: "https://a.example/mcp", token: "new" } })
    assert.equal(updated.ok, true)
    assert.equal(updated.tools, null, "无宿主面 ⇒ 随动零动作")
    const disk = diskOf(cfg)
    assert.deepEqual(disk.mcp.servers.map((s) => s.name), ["a", "b"], "数组序保持（原位替换）")
    assert.deepEqual(disk.mcp.servers[0], { url: "https://a.example/mcp", token: "new", name: "a" })
    // 拒径零写
    const before = readFileSync(cfg, "utf8")
    assert.equal((await mcp.mcpUpdate({ name: "nope", config: { command: "q" } })).reason, "unknown-server")
    assert.equal((await mcp.mcpUpdate({ name: "a", config: {} })).reason, "invalid-shape", "无形键 ⇒ 形判拒")
    assert.equal((await mcp.mcpUpdate({ name: "", config: { command: "q" } })).reason, "invalid-shape")
    assert.equal(readFileSync(cfg, "utf8"), before, "两拒皆零写")
  } finally { coreIo._resetConfigPathForTest() }
})

test("S8 ∕ 结构化表单树：三型字段组 ∕ 编辑态预填 + 名只读 ∕ 新增态；存 ∕ 消按钮", () => {
  i18n.initDict({ locale: "zh" })
  const handlers = { onAddMcp: () => {}, onUpdateMcp: () => {}, onMcpCancel: () => {}, onMcpFormType: () => {} }
  const deps = { reasonWord: () => null }
  const servers = [{ name: "srv", kind: "url", summary: "https://m.example/mcp", config: { url: "https://m.example/mcp", token: "tk", headers: { "X-Foo": "bar" } } }, { name: "cmd", kind: "command", summary: "node x.js", config: { command: "node", args: ["x.js", "-y"], env: { K: "v" } } }]
  const formOf = (section) => mcpView.mcpFormBody(section, handlers).find((n) => n?.props?.["data-form"] === "mcp") // KD-77 ①：表单树 = `mcpFormBody`
  const inputOf = (form, name) => form.children.find((c) => c?.tag === "input" && c.props.name === name)
  const kvRowsOf = (form, group) => form.children.filter((c) => c?.props?.["data-kv-row"] === group) // #1036：行集直取
  const kvValueOf = (form, group) => kvRowsOf(form, group)[0]?.children.find((c) => c?.props?.["data-kv-part"] === "v")?.props.value
  const submitPairOf = (form) => form.children.filter((c) => c?.tag === "button").map((b) => b.props["data-action"]).filter((action) => action !== "settings:mcpKvAdd")
  // ① 编辑态（http 型）：名只读 + 现值预填；http 组行集在场、stdio 组零行
  const httpKv = { env: [], headers: [{ t: 11, k: "X-Foo", v: "bar" }], wsHeaders: [] }
  const httpForm = formOf({ state: "ready", servers, details: {}, form: { editing: "srv", type: "http", kv: httpKv } })
  assert.equal(httpForm.props["data-mcp-form"], "edit")
  assert.equal(inputOf(httpForm, "name").props.value, "srv")
  assert.equal(inputOf(httpForm, "name").props.readOnly, true, "名 = 不变量（只读）")
  assert.equal(inputOf(httpForm, "url").props.value, "https://m.example/mcp", "预填 = 现值")
  assert.equal(inputOf(httpForm, "token").props.value, "tk")
  assert.equal(kvRowsOf(httpForm, "headers").length, 1, "http 型 ⇒ headers 行集在场（#1036 行式）")
  assert.equal(kvValueOf(httpForm, "headers"), "bar", "行值 = 切片行集")
  assert.equal(kvRowsOf(httpForm, "env").length, 0, "http 型 ⇒ stdio 组零行")
  assert.equal(inputOf(httpForm, "command"), undefined, "http 型 ⇒ stdio 组零节点")
  assert.deepEqual(submitPairOf(httpForm), ["settings:updateMcp", "settings:mcpCancel"], "存 ∕ 消两钮（新增态补消钮）")
  // ② 编辑态（stdio 型）：args 空格连串 ∕ env 行集直取
  const stdioKv = { env: [{ t: 12, k: "K", v: "v" }], headers: [], wsHeaders: [] }
  const stdioForm = formOf({ state: "ready", servers, details: {}, form: { editing: "cmd", type: "stdio", kv: stdioKv } })
  assert.equal(inputOf(stdioForm, "command").props.value, "node")
  assert.equal(inputOf(stdioForm, "args").props.value, "x.js -y")
  assert.equal(kvValueOf(stdioForm, "env"), "v", "env 行集 = 切片行集")
  assert.equal(kvRowsOf(stdioForm, "headers").length, 0, "stdio 型 ⇒ http 组零行")
  assert.equal(inputOf(stdioForm, "url"), undefined, "stdio 型 ⇒ http 组零节点")
  // ③ 新增态（form = null）：空表单 + 类型 stdio 缺省 + 添加钮
  const addForm = formOf({ state: "ready", servers, details: {}, form: null })
  assert.equal(addForm.props["data-mcp-form"], "add")
  assert.equal(inputOf(addForm, "name").props.value, "")
  assert.equal(inputOf(addForm, "name").props.readOnly, undefined)
  assert.deepEqual(submitPairOf(addForm), ["settings:addMcp", "settings:mcpCancel"], "存 ∕ 消两钮（新增态补消钮）")
  // ④ 行面五钮（Tools ∕ Edit ∕ Test ∕ Reconnect ∕ Remove）
  const rowHandlers = { onMcpTools: () => {}, onMcpEdit: () => {}, onMcpTest: () => {}, onMcpReconnect: () => {}, onRemoveMcp: () => {} }
  const row = mcpView.mcpBody({ state: "ready", servers, details: {}, form: null }, rowHandlers, deps)[0]
  assert.deepEqual(row.children.filter((c) => c?.tag === "button").map((b) => b.props["data-action"]), ["settings:mcpTools", "settings:mcpEdit", "settings:mcpTest", "settings:mcpReconnect", "settings:removeMcp"])
  // ⑤ draft 快照回填（类型切换不丢手）：切后平字段值 = 快照 > 现值；行集单源 = `form.kv`
  const draftForm = formOf({ state: "ready", servers, details: {}, form: { editing: "srv", type: "http", draft: { url: "https://typed.example", token: "typed-token" }, kv: httpKv } })
  assert.equal(inputOf(draftForm, "url").props.value, "https://typed.example", "未落盘输入优先于现值")
  assert.equal(inputOf(draftForm, "token").props.value, "typed-token")
  assert.equal(kvValueOf(draftForm, "headers"), "bar", "未触组 = 切片行集（行值单源 = `form.kv`）")
})

test("S8 ∕ 表单出口：三型载荷构建（http ∕ ws ∕ stdio）∥ 形不齐 ⇒ 零发送 + 段级失败面", async () => {
  const fields = { name: "srv", type: "stdio", command: "node", args: "x.js  -y", env: "K=v, X-Y=z, ZQ=" }
  // #1036：行集载荷 = `getAll("<group>-k" ∥ "<group>-v")` 两列对齐
  const pairs = {
    "env-k": ["K", "X-Y", "ZQ", ""], "env-v": ["v", "z", "", ""],
    "headers-k": ["Authorization"], "headers-v": ["Bearer x"],
    "wsHeaders-k": [], "wsHeaders-v": [],
  }
  const realFormData = globalThis.FormData
  globalThis.FormData = class { get(key) { return fields[key] ?? null } getAll(key) { return pairs[key] ?? [] } }
  try {
    const calls = []
    const reports = []
    let reloads = 0
    const exits = mcpExitsMod.createMcpExits({ // KD-77 ①：MCP 出口入组弹窗族（`createMcpExits`）
      ask: async (channel, payload) => { calls.push([channel, payload]); return { ok: true, reason: null } },
      store: fakeStore({ settings: { mcp: { servers: [], details: {}, form: null }, tools: {}, env: {}, models: {} } }),
      setSettings: () => {}, report: (...args) => reports.push(args), clearReport: () => {},
      reads: { loadMcp: async () => { reloads += 1 }, loadEnv: async () => {}, loadTools: async () => {}, loadAgent: async () => {} },
      slot: '[data-slot="settings"]', formOf: () => ({}), invalidateDrafts: () => {}, openModal: () => true, closeModal: () => {},
    })
    await exits.handlers.onAddMcp({ currentTarget: {} })
    assert.deepEqual(calls[0], ["mcp:save", { name: "srv", config: { command: "node", args: ["x.js", "-y"], env: { K: "v", "X-Y": "z" } } }], "stdio 型载荷（空值项删 ∕ args 空格分）")
    assert.equal(reloads, 1, "新增成功 ⇒ 行随动（复读本段）")
    fields.type = "http"; fields.url = "https://m.example/mcp"; fields.token = "tk"; fields.headers = "Authorization=Bearer x"
    await exits.handlers.onUpdateMcp({ currentTarget: {} })
    assert.deepEqual(calls[1], ["mcp:update", { name: "srv", config: { url: "https://m.example/mcp", token: "tk", headers: { Authorization: "Bearer x" } } }], "http 型载荷（编辑走 mcp:update）")
    assert.equal(reloads, 2, "编辑成功 ⇒ 行随动（复读本段）")
    fields.type = "ws"; fields.wsUrl = "wss://m.example/ws"; fields.token = ""; fields.headers = ""
    await exits.handlers.onAddMcp({ currentTarget: {} })
    assert.deepEqual(calls[2], ["mcp:save", { name: "srv", config: { wsUrl: "wss://m.example/ws" } }], "ws 型载荷（token ∕ headers 空 ⇒ 不落键）")
    // 形不齐（关键字段空）⇒ 零发送 + 失败面
    const count = calls.length
    fields.type = "http"; fields.url = "   "
    await exits.handlers.onAddMcp({ currentTarget: {} })
    assert.equal(calls.length, count, "形不齐 ⇒ 零发送")
    assert.equal(reports[reports.length - 1][1].reason, "invalid-shape")
    assert.equal(reloads, 3, "拒径零复读")
  } finally { globalThis.FormData = realFormData }
})

// ─── S9：mcp:reconnect（先断后连 ∕ 失败面 ∕ 回执两态）────────────────────────

test("S9：mcp:reconnect —— 未知名 ⇒ unknown-server（零连接）；先断后连（旧会话关 ∕ 新连失败 ⇒ 失败面 reason）", async () => {
  const cfg = withConfig({ mcp: { servers: [{ name: "dead", command: "__b10_w3_no_such_command__" }] } })
  const coreMcp = await import(coreAt("mcp.mjs"))
  try {
    assert.equal((await mcp.mcpReconnect({ name: "nope" })).reason, "unknown-server")
    assert.equal((await mcp.mcpReconnect({ name: "" })).reason, "invalid-shape")
    // 伪活会话入核表 ⇒ 重连应先关它
    let closed = false
    coreMcp._sessions.set("dead", { closed: false, state: { transport: { close() { closed = true } } } })
    const receipt = await mcp.mcpReconnect({ name: "dead" })
    assert.equal(closed, true, "先断：旧会话 transport 已关")
    assert.equal(coreMcp._sessions.has("dead"), false, "旧会话移表")
    assert.equal(receipt.ok, false, "连不通 ⇒ 失败面在场")
    assert.equal(typeof receipt.reason, "string")
    assert.ok(receipt.reason.length > 0)
  } finally { coreMcp._sessions.clear(); coreIo._resetConfigPathForTest() }
})

test("S11 ∕ 两端同 helper（结构）：VSC 写面改指核 `applyAdvisorEffort`（本地 off 形解析副本已删）；桌面主侧同引", () => {
  const vscSrc = read("thincoder-vscode/src/extension/settings-panel-write.mjs")
  assert.match(vscSrc, /applyAdvisorEffort\(merged, adv\.reasoningEffort, specForModel\(adv\.model \?\? ""\)\)/, "VSC 写面调核 helper")
  assert.equal(vscSrc.includes("advisorOffShape"), false, "本地 off 形解析副本已删（零第二源）")
  assert.equal(vscSrc.includes("thinkOffShape"), false, "写语义取源单点 = 核 helper")
  assert.match(read("thincoder-desktop/src/main/settings.mjs"), /applyAdvisorEffort\(disk\.agent\.advisor/, "桌面主侧同引核 helper")
})

// ─── S8 ∕ 类型切换 draft（切换不丢手）───────────────────────────────────────

test("S8 ∕ 类型切换出口：表单现态自读入 draft（未落盘输入随切带回）", () => {
  const inputs = [
    { getAttribute: (k) => (k === "name" ? "url" : null), hasAttribute: () => false, value: "https://typed.example" },
    { getAttribute: (k) => (k === "name" ? "token" : null), hasAttribute: () => false, value: "typed-token" },
  ]
  // KD-77 ①：现读面 = `document.querySelectorAll('[data-form="mcp"]')` 末位（弹窗体）
  const formNode = { querySelectorAll: (sel) => (sel === "input" ? inputs : []), querySelector: () => null }
  globalThis.document = { querySelectorAll: (sel) => (sel === '[data-form="mcp"]' ? [formNode] : []) }
  try {
    const patches = []
    const closes = []
    const exits = mcpExitsMod.createMcpExits({
      ask: async () => ({ ok: true }),
      store: fakeStore({ settings: { mcp: { servers: [], details: {}, form: { editing: "srv", type: "stdio" } }, tools: {}, env: {}, models: {} } }),
      setSettings: (patch) => patches.push(patch.mcp), report: () => {}, clearReport: () => {},
      reads: { loadMcp: async () => {}, loadEnv: async () => {}, loadTools: async () => {}, loadAgent: async () => {} },
      slot: '[data-slot="settings"]', formOf: () => ({}), invalidateDrafts: () => {}, openModal: () => true, closeModal: () => closes.push(1),
    })
    exits.handlers.onMcpFormType("http")
    assert.deepEqual(patches[0].form, { editing: "srv", type: "http", kv: { env: [], headers: [], wsHeaders: [] }, draft: { url: "https://typed.example", token: "typed-token" } })
    exits.handlers.onMcpCancel()
    assert.equal(closes.length, 1, "取消 ⇒ 关框（切片复位 = 开径 resetFacets —— KD-77 ① 先开后写）")
  } finally { delete globalThis.document }
})

test("S9 ∕ 重连出口：连期词面 ⇒ 成功（计数行 + 行面复读）∥ 失败（失败句子面）", async () => {
  const details = []
  const reads = { loadMcp: async () => { reads.called = (reads.called ?? 0) + 1 }, loadEnv: async () => {}, loadTools: async () => {}, loadAgent: async () => {} }
  const make = (receipt) => mcpExitsMod.createMcpExits({
    ask: async () => receipt,
    store: fakeStore({ settings: { mcp: { servers: [], details: {}, form: null }, tools: {}, env: {}, models: {} } }),
    setSettings: (patch) => details.push(patch.mcp?.details),
    report: () => {}, clearReport: () => {},
    reads, slot: '[data-slot="settings"]', formOf: () => ({}), invalidateDrafts: () => {}, openModal: () => true, closeModal: () => {},
  })
  await make({ ok: true, tools: 3 }).handlers.onMcpReconnect("srv")
  assert.deepEqual(details[0].srv, { kind: "reconnect", state: "loading", tools: null, probe: null, reason: null }, "连期 loading 词面")
  assert.deepEqual(details[1].srv, { kind: "reconnect", state: "ready", tools: 3, probe: null, reason: null }, "成功 ⇒ 计数行")
  assert.equal(reads.called, 1, "成功 ⇒ 行面复读")
  await make({ ok: false, reason: "spawn failed" }).handlers.onMcpReconnect("srv")
  assert.equal(details[3].srv.state, "fail", "失败 ⇒ 失败句子面")
  assert.equal(details[3].srv.reason, "spawn failed")
})

// ─── S17：shell 候选探测单源 + 两端薄壳 ─────────────────────────────────────

test("S17 ∕ 核候选面：注入缝候选集（System default 恒首 ∕ 出口两键）∕ memo ∕ 在飞去重", async () => {
  coreShell._setShellDetectForTest((cmd) => cmd === "pwsh")
  const hits = await coreShell.shellCandidates()
  assert.equal(hits[0].name, "System default")
  assert.equal(hits[0].value, null)
  assert.ok(hits.every((hit) => typeof hit.name === "string" && Object.keys(hit).every((k) => k === "name" || k === "value")), "出口两键（探测函数不外发）")
  if (process.platform === "win32") {
    assert.deepEqual(hits.map((hit) => hit.name).slice(0, 2), ["System default", "PowerShell (pwsh)"], "Windows 序：pwsh 命中在场")
    assert.ok(!hits.some((hit) => hit.name.startsWith("Windows PowerShell")), "未命中候选缺席")
  } else {
    assert.equal(hits.length, 1, "POSIX：仅 System default 命中")
  }
  assert.equal(await coreShell.shellCandidates(), hits, "memo（成功结果缓存同引用）")
  // 在飞去重：清 memo 后同刻两呼 = 同一 promise
  coreShell._setShellDetectForTest((cmd) => cmd === "pwsh")
  const p1 = coreShell.shellCandidates()
  const p2 = coreShell.shellCandidates()
  assert.equal(p1, p2, "在飞共享（不叠发子进程）")
  await p1
  coreShell._setShellDetectForTest(null)
})

test("S17 ∕ 结构：两端零自持候选表（薄壳 re-export 核单源）；桌面壳 = 核函数同引用", () => {
  const vscSrc = read("thincoder-vscode/src/extension/settings.mjs")
  const deskSrc = read("thincoder-desktop/src/main/settings-env.mjs")
  for (const [name, src] of [["VSC", vscSrc], ["桌面", deskSrc]]) {
    assert.equal(src.includes("GIT_BASH_PATHS"), false, `${name}：零自持 Git Bash 路径表`)
    assert.equal(src.includes("execFile"), false, `${name}：零自持探测实现`)
    assert.equal(/Program Files.*Git/.test(src), false, `${name}：零自持路径字面`)
    assert.match(src, /@thincoder\/core\/shell-candidates\.mjs/, `${name}：改指核单源`)
  }
  assert.match(vscSrc, /export \{ shellCandidates, _setShellDetectForTest \} from "@thincoder\/core\/shell-candidates\.mjs"/)
  assert.equal(settingsEnv.shellCandidates, coreShell.shellCandidates, "桌面薄壳 = 核单源（同函数引用）")
  const coreSrc = read("thincoder-core/shell-candidates.mjs")
  assert.match(coreSrc, /C:\\\\Program Files\\\\Git/, "候选表住核单源")
  assert.match(coreSrc, /timeout: PROBE_TIMEOUT_MS/)
  assert.match(coreSrc, /3000/, "超时值在核")
})

// ─── 通道面（结构）：52 项两向相等 ∕ 本批两通道在册 ∕ 三档头计数 ∕ 渲染面闭包 ──────

test("通道面：白名单 52 项 ≡ 注册表 HANDLERS（两向相等）；本批两通道在册；三档头计数五十二", () => {
  const preload = deskReq(join(ROOT, "thincoder-desktop/src/preload/preload.cjs"))
  assert.equal(preload.CHANNELS.length, 52)
  assert.deepEqual(preload.CHANNELS.slice(-2), ["team:logout", "team:verify"], "末位两通道（随动：桌面 teamVerify 转口）")
  assert.ok(preload.CHANNELS.includes("mcp:update") && preload.CHANNELS.includes("mcp:reconnect"), "本批两通道在册")
  const registrySrc = read("thincoder-desktop/src/main/ipc-registry.mjs")
  const rows = [...registrySrc.matchAll(/^\s{2}"([^"]+)":/gm)].map((m) => m[1])
  assert.equal(rows.length, 52)
  assert.deepEqual([...new Set(rows)].sort(), [...preload.CHANNELS].sort(), "白名单 ↔ 注册表两向相等")
  for (const file of ["thincoder-desktop/src/main/ipc.mjs", "thincoder-desktop/src/main/ipc-registry.mjs", "thincoder-desktop/src/preload/preload.cjs"]) {
    assert.match(read(file), /五十二项/, `${file} 档头计数随动`)
  }
  // 渲染面静态闭包纪律（零 `node:` ∕ 零裸包 —— 本批新改渲染档）
  for (const file of [
    "thincoder-desktop/renderer/mount-settings-segments-agent.mjs",
    "thincoder-desktop/renderer/mount-settings-segments.mjs",
    "thincoder-desktop/renderer/mount-settings-exits.mjs",
    "thincoder-desktop/renderer/views/settings-agent.mjs",
    "thincoder-desktop/renderer/views/settings-sections-mcp.mjs",
    "thincoder-desktop/renderer/views/settings.mjs",
  ]) {
    const src = read(file)
    assert.equal(/from\s+"node:/.test(src) || /require\(/.test(src), false, `${file}: 零 node: ∕ 零 require`)
  }
})

// ─── 集成冒烟：设置面全树（S10 ∕ S11 ∕ S14b 控件经真分派渲染）──────────────

test("集成冒烟：settingsTree 全树（agent 段六模型槽 + guard 开关 + effort 选项）零抛且在场", async () => {
  i18n.initDict({ locale: "zh" })
  const settingsView = await import(at("thincoder-desktop/renderer/views/settings.mjs"))
  const state = {
    locale: "zh",
    activeSession: "3",
    sessionFlags: { 3: { planMode: false, autoApprove: false, advisorGuard: true, engineering: false } },
    settings: {
      open: true, notice: null, configured: true, defaultModel: `${EFFORT_MODEL.split("-")[0]}:${EFFORT_MODEL}`,
      wizard: { step: 1, dismissed: true, notice: null },
      providers: { state: "ready", presets: [], providers: [{ name: EFFORT_MODEL.split("-")[0], hasKey: true, maskedKey: "••••（masked）", active: true }], edit: null, probe: null, draft: null },
      verify: null,
      model: { state: "ready", provider: EFFORT_MODEL.split("-")[0], current: `${EFFORT_MODEL.split("-")[0]}:${EFFORT_MODEL}`, models: [{ id: EFFORT_MODEL, effortEnum: effortSpec.reasoningEffortEnum, thinkOff: true }] },
      agent: { state: "ready", fields: [{ path: "agent.maxTurns", value: 200, kind: "number", sensitive: false }, { path: "agent.advisor.reasoningEffort", value: "high", kind: "string", sensitive: false }] },
      mcp: { state: "ready", servers: [], details: {}, form: null },
      env: { state: "none" },
      tools: { state: "none", status: null, building: false, keys: null, edit: null },
      models: { state: "ready", consult: [], advisor: { provider: null, model: null }, picker: {}, advisorPicker: {} },
    },
  }
  const model = settingsView.settingsModel(state)
  assert.equal(model.agent.guard, true, "guard 槽投影归一")
  assert.equal(model.agent.provider, EFFORT_MODEL.split("-")[0])
  assert.equal(model.agent.advisorModel, EFFORT_MODEL, "归属模型归一（写面 ∕ 候选面同源）")
  const handlers = { onNamedField: () => {}, onToggleGuard: () => {}, onSaveAgent: () => {}, onAddMcp: () => {}, onUpdateMcp: () => {}, onMcpEdit: () => {}, onMcpCancel: () => {}, onMcpFormType: () => {}, onMcpReconnect: () => {}, onMcpTools: () => {}, onMcpTest: () => {}, onRemoveMcp: () => {} }
  const text = JSON.stringify(settingsView.settingsTree(model, handlers))
  for (const path of ["agent.subagentModel", "agent.subagentModels.explore", "agent.subagentModels.eng-designer", "agent.advisor.guard"]) {
    assert.match(text, new RegExp(`"data-field-name":"${path.replace(/[.]/g, "\\.")}"`), `${path} 在场`)
  }
  // KD-77 ①：MCP 结构化表单 = 弹窗体（页树零表单）—— 冒烟核弹窗树
  const modalText = JSON.stringify(settingsView.settingsModalTree(state, "mcpForm", handlers))
  assert.match(modalText, /"data-mcp-form":"add"/, "MCP 结构化表单（新增态）在场（弹窗树）")
})
