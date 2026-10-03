/**
 * 2026-09-29-hatch-clearance-2.test.mjs — 口子清零二轮批 批次本地对拍锁（#673：9 组「消 ∕ 补做」+ 文档面随动）。
 *
 * 运行（仓根）：node --test docs/batches/2026-09-29-hatch-clearance-2.test.mjs
 *   （件内自注册 `/rc/` 解析钩子 —— 渲染档取核件走平 node 同源解析；亦兼容
 *    `node --import ./thincoder-desktop/test/rc-resolve.mjs --test docs/batches/2026-09-29-hatch-clearance-2.test.mjs`）
 *
 * 腿（设计 §2.4 ①–⑤ + §2.7 ∕ §2.8 各机检腿；§2.4⑥ §1.8 拒绝面 = 转继任批，不含）：
 *   L1 同文重项（核 `planBusyQueued`「本批新建泡」匹配 —— append.length === 1）
 *   L2 E10 窗值（桌面 `MAX_RENDER_BLOCKS` = 150 ∥ VSC `MAX_MESSAGE_BLOCKS` = 150 + 单源档三处）
 *   L3 E-④ 键盘可达臂（VSC `session.css` 两钮 `:focus-visible` 在场 ∥ 桌面臂保留）
 *   L4 D21 内容面（`core.css` 面 20 覆盖段在场 + 容器臂收窄「`> :last-child` 归零」退场）
 *   L5 N1③ `CANCELABLE_ROLES` = 六员 ∪ consult ∕ escalate（`FAMILY_ROLES` 零改）+ 停钮门消费
 *   L6 N1① `ev:usage` 帧门（`pct > 0` ∨ 本帧携新读数）
 *   L7 S3 分档（词 ∕ 抑制形 ∥ 宿主忙落账覆盖 ∥ `provider:verify` 回执另携 `failure`）
 *   L8 MCP 装配缝 + M1 钩子（并入 ∕ 失败落警告 ∥ manifest 附着 + 槽值优先）
 *   L9 文档面旧串零命中（判据域 = 规范面 only；记录面 ∕ 批档豁免 + 延后序档点名排除）
 *   L10 引导形（`provider-invalid` ⇒ VSC `error.provider` 词逐字 · 两语 ── §2.7 行 3「消——基准实读后归一」；
 *       #840 续：路由按真因分类 —— `defaultModel` 类走新键，基准词路由保留）
 *
 * 批次本地单测件：名随批次档、住批次目录、不进仓套件（复跑 = 上行命令；改后盘 = 对拍锁）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子

const root = process.cwd()
const at = (rel) => pathToFileURL(join(root, rel)).href
const read = (rel) => readFileSync(join(root, rel), "utf8")
const tmpDir = (name) => mkdtempSync(join(tmpdir(), name))
/** 注释剥离（值面扫描判据：注释内引旧串 = 改写记录，非活规则）。 */
const stripCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")

// ─── L1 · 同文重项（核 `planBusyQueued`「本批新建泡」匹配）────────────────────

test("L1 同文重项：items 同文不重复建泡（回源档 1 泡口径）", async () => {
  const { planBusyQueued } = await import(at("thincoder-render-core/flow/queued-mark.mjs"))
  const twice = planBusyQueued([], { items: ["x", "x"] })
  assert.equal(twice.append.length, 1, "items:[\"x\",\"x\"] ⇒ append 恰 1（源档 1 泡）")
  assert.deepEqual(twice.append, [{ raw: "x", mark: true }])
  assert.equal(planBusyQueued([], { items: ["x", "x", "x"] }).append.length, 1, "三重同文 ⇒ 仍 1 泡")
  assert.equal(planBusyQueued([], { items: ["x", "y"] }).append.length, 2, "异文 ⇒ 各建一泡（零回归）")
  // 既有气泡面零回归：已标记同文 ⇒ 保持（零动作）；另有同文未标记 ⇒ 就地标记
  const held = planBusyQueued([{ raw: "x", marked: true }], { items: ["x"], count: 1 })
  assert.deepEqual({ clear: held.clear, remove: held.remove, mark: held.mark, append: held.append }, { clear: [], remove: [], mark: [], append: [] }, "已标记同文 ⇒ 保持")
  assert.deepEqual(planBusyQueued([{ raw: "x", marked: false }], { items: ["x"], count: 1 }).mark, [0], "未标记同文 ⇒ 就地标记")
})

// ─── L2 · E10 窗值（桌面 150 ∥ VSC 150 + 单源档三处）────────────────────────

test("L2 E10：桌面窗值对齐 VSC（150）∥ 单源档三处同拍", () => {
  const desk = read("thincoder-desktop/renderer/views/chat-scroll.mjs")
  assert.match(desk, /export const MAX_RENDER_BLOCKS = 150\b/, "桌面 MAX_RENDER_BLOCKS = 150")
  assert.ok(!/MAX_RENDER_BLOCKS = 200\b/.test(desk), "旧值 200 零残留")
  const vsc = read("thincoder-vscode/webview/ui.js")
  assert.match(vsc, /MAX_MESSAGE_BLOCKS = 150\b/, "VSC 150 保持（方向 = 建议㈠：桌面对齐 VSC，非反向）")
  const doc = read("docs/desktop/design/RENDERER.md")
  assert.match(doc, /MAX_RENDER_BLOCKS = 150/, "RENDERER.md §2 常量条同拍")
  assert.match(doc, /初值 150/, "RENDERER.md §2 窗限增量条同拍")
  assert.match(doc, /窗口 150 块/, "RENDERER.md §4 行 5 同拍")
  assert.ok(!/初值 200/.test(doc) && !/窗口 200 块/.test(doc), "三处旧值零残留")
  assert.match(doc, /historyWindow` 缺省 200 \*\*条\*\*/, "页量 200 条（不同面）零误改")
})

// ─── L3 · E-④ 键盘可达臂（VSC 补两臂 ∥ 桌面臂保留）──────────────────────────

test("L3 键盘可达臂：VSC 两钮 `:focus-visible` 在场 ∥ 桌面臂保留", () => {
  const vsc = read("thincoder-vscode/webview/session.css")
  const arm = vsc.replace(/\/\*[\s\S]*?\*\//g, "")
  assert.match(arm, /\.session-rename:focus-visible[^{]*\{[^}]*opacity: 1/, "VSC `.session-rename` 键盘臂（opacity 1）")
  assert.match(arm, /\.session-delete:focus-visible[^{]*\{[^}]*opacity: 1/, "VSC `.session-delete` 键盘臂（opacity 1）")
  const desk = read("thincoder-desktop/renderer/session-list.css")
  assert.match(desk, /\.session-rename:focus-visible[\s\S]{0,120}?\.session-delete:focus-visible/, "桌面臂保留（a11y 不回退）")
})

// ─── L4 · D21 内容面（面 20 覆盖段 ∥ 容器臂收窄）────────────────────────────

test("L4 D21 内容面：面 20 覆盖段在场 ∥ 容器臂收窄", () => {
  const css = stripCss(read("thincoder-desktop/renderer/core.css"))
  assert.match(css, /\.reasoning-content \.code-block \{[^}]*background: rgba\(127,127,127,\.12\)/, "pre 灰底逐值（VSC :408）")
  assert.match(css, /\.reasoning-content \.code-block \{[^}]*border-radius: 6px/, "圆角 6 逐值")
  assert.match(css, /\.reasoning-content \.code-block \{[^}]*padding: 8px 10px/, "padding 逐值")
  assert.match(css, /\.reasoning-content \.code-block code \{[^}]*padding: 0/, "pre code 归零（VSC :409）")
  assert.match(css, /\.reasoning-content \.code-lang \{[^}]*display: inline/, ".code-lang 零样式（复位面 8）")
  const md = stripCss(read("thincoder-desktop/renderer/core-markdown.css"))
  assert.match(md, /\.reasoning-content p:last-child/, "p:last-child 单条保留")
  assert.ok(!/> :last-child/.test(md), "容器臂（> :last-child 归零）退场")
})

// ─── L5 · N1③ 停钮族集 ────────────────────────────────────────────────────

test("L5 N1③：CANCELABLE_ROLES = 六员 ∪ consult ∕ escalate（FAMILY_ROLES 零改）", async () => {
  const mod = await import(at("thincoder-render-core/subblocks/activity-view.mjs"))
  assert.deepEqual(mod.FAMILY_ROLES, ["explore", "plan", "coder", "eng-coder", "eng-designer", "advisor"], "头词族六员零改")
  assert.deepEqual(mod.CANCELABLE_ROLES, [...mod.FAMILY_ROLES, "consult", "escalate"], "停钮族集 = 六员 ∪ consult ∕ escalate")
  const src = read("thincoder-render-core/subblocks/activity-view.mjs")
  assert.match(src, /CANCELABLE_ROLES\.includes\(meta\.role\)/, "停钮门消费新族集（⏹ 在场判据）")
})

// ─── L6 · N1① 帧门 ────────────────────────────────────────────────────────

test("L6 N1①：ev:usage 帧门（pct > 0 ∨ 本帧携新读数）", async () => {
  const { usageFrameWanted } = await import(at("thincoder-desktop/src/main/agent-host.mjs"))
  assert.equal(usageFrameWanted(0, 0, { count: 0 }), false, "全零读数 ⇒ 不发")
  assert.equal(usageFrameWanted(0, 120, { count: 0 }), true, "取整 0 + tokens 读数 ⇒ 照达")
  assert.equal(usageFrameWanted(0, 0, { count: 2 }), true, "取整 0 + timers 读数 ⇒ 照达")
  assert.equal(usageFrameWanted(7, 0, { count: 0 }), true, "pct > 0 ⇒ 发")
  assert.equal(usageFrameWanted(null, undefined, null), false, "非数 ∕ 缺 ⇒ 不发（零假造）")
})

// ─── L7 · S3 分档（词 ∕ 抑制 ∥ 宿主忙落账覆盖）──────────────────────────────

test("L7 S3：分档映射 ∥ 抑制形 ∥ 宿主忙落账覆盖", async () => {
  const { initDict } = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  initDict({ locale: "zh" })
  const { providersBody } = await import(at("thincoder-desktop/renderer/views/settings-sections.mjs"))
  const deps = { channelForm: () => null, verifyControl: () => null, formats: [], reasonWord: (r) => r ?? "", edit: null }
  const rowOf = (row) => providersBody({ state: "ready", rows: [row], presets: [], verify: null, probe: null, draft: null }, {}, deps)[0]
  const markOf = (node) => node.children.find((c) => c?.props?.class === "settings-mark")
  const reasonOf = (node) => node.children.find((c) => c !== null && c?.props?.["data-unavailable-reason"] !== undefined)

  const busy = rowOf({ name: "p1", available: false, failure: "hostBusy", unavailableReason: "渠道故障句" })
  assert.equal(markOf(busy).children[0], "宿主繁忙", "hostBusy ⇒ 分档词「宿主繁忙」（VSC 同词）")
  assert.equal(markOf(busy).props["data-failure"], "hostBusy", "分档机检锚在场")
  assert.equal(markOf(busy).props["data-available"], "false", "不可用标零改")
  assert.equal(reasonOf(busy), undefined, "抑制渠道故障句（载体为宿主忙）")

  const down = rowOf({ name: "p2", available: false, failure: "malformed", unavailableReason: "渠道故障句" })
  assert.equal(markOf(down).children[0], "不可用", "非 hostBusy ⇒ 渠道故障词")
  assert.ok(reasonOf(down) !== undefined && reasonOf(down).children[0] === "渠道故障句", "非 hostBusy ⇒ 失败句在场（逐字）")

  // 采样器（port 件）：落账覆盖两向 + 窗口过期 + 起停幂等
  const { hostBusy, overrideAdmissionIfHostBusy, startSampler, stopSampler, _setLoopSamplerForTest } = await import(at("thincoder-desktop/src/main/loop-sampler.mjs"))
  const { admissionOf, recordAdmission, _setProbeImplForTest } = await import(at("thincoder-desktop/node_modules/@thincoder/core/provider/list-models.mjs"))
  assert.equal(hostBusy(), false, "未启动 ⇒ fail-open（恒 false）")
  assert.equal(overrideAdmissionIfHostBusy("p1", "reason"), false, "非忙 ⇒ 零覆盖")
  let now = 1_000_000
  _setLoopSamplerForTest({ nowFn: () => now })
  startSampler()
  now += 2500 // 单拍推进（> BUSY_LAG_MS = 1000）
  await new Promise((r) => setTimeout(r, 260)) // 采样拍（SAMPLE_INTERVAL_MS = 100）
  assert.equal(hostBusy(), true, "窗口内 lag ≥ 1000 ⇒ 忙证据在场")
  assert.equal(overrideAdmissionIfHostBusy("p1", "reason-keep"), true, "忙 ⇒ 覆盖落账")
  const rec = admissionOf("p1")
  assert.equal(rec.ok, false, "落账 = 失败形")
  assert.equal(rec.failure, "hostBusy", "落账分类 = hostBusy")
  assert.equal(rec.reason, "reason-keep", "reason 逐字不动")
  assert.ok(Number.isFinite(rec.ts), "ts 盖落账时间")

  // 清忙窗（回执面**非忙档**先验——落账 ∕ 证据两态分验）
  stopSampler()
  assert.equal(hostBusy(), false, "停采 ⇒ 忙证据清（verify 非忙档前提）")

  // 回执面同源（临时 config 缝 + 探径桩）：`provider:verify` 回执另携 `failure`（IPC.md §2 本行契约）
  const cfgPath = join(mkdtempSync(join(tmpdir(), "hx-l7-")), "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [{ name: "p9", baseURL: "https://api.invalid/v1", model: "m9", apiKey: "k9" }], defaultModel: "p9:m9" }))
  const cfgIo = await import(at("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs"))
  const { providerVerify, providerList } = await import(at("thincoder-desktop/src/main/providers.mjs"))
  cfgIo._setConfigPathForTest(cfgPath)
  try {
    _setProbeImplForTest(async () => ({ ok: false, error: "probe down" }))
    const v1 = await providerVerify({ name: "p9" })
    assert.deepEqual({ ok: v1.ok, reason: v1.reason, failure: v1.failure }, { ok: false, reason: "malformed", failure: "malformed" }, "verify 失败回执携 failure（reason 闭集零改）")
    // 忙窗内再验 ⇒ 覆盖落账 + 回执读账（行面同源）
    now = 2_000_000
    _setLoopSamplerForTest({ nowFn: () => now })
    startSampler()
    now += 2500
    await new Promise((r) => setTimeout(r, 260))
    const v2 = await providerVerify({ name: "p9" })
    assert.equal(v2.failure, "hostBusy", "宿主忙 ⇒ verify 回执 failure = hostBusy（覆盖后读账）")
    assert.equal(v2.reason, "malformed", "reason 闭集不辟新码（零改）")
    const row = providerList().providers.find((p) => p.name === "p9")
    assert.equal(row.available, false, "行面 available = false")
    assert.equal(row.failure, "hostBusy", "行面 failure 同源（provider:list 行注）")
    now += 2000 // 滚出窗
    assert.equal(hostBusy(), false, "滚出窗 ⇒ 旧忙态不粘滞")
    stopSampler()
    _setLoopSamplerForTest(null)
  } finally {
    _setProbeImplForTest(null)
    cfgIo._resetConfigPathForTest()
  }
  assert.equal(hostBusy(), false, "停采 ⇒ 零证据")
  recordAdmission("p1", { ok: true, ts: 1 }) // 复原落账面（免污染同进程后续用例）
})

// ─── L10 · 引导形（`provider-invalid` ⇒ VSC 基准词；#840 续：真因分类路由）────────────────

test("L10 引导形：provider-invalid ⇒ VSC `error.provider` 词逐字（两语）∥ 真因分类路由在档", async () => {
  const { initDict, t } = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  const vscEn = JSON.parse(read("thincoder-vscode/locales/en.json"))
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  initDict({ locale: "zh" })
  assert.equal(t("composer.send.noProvider"), vscZh["error.provider"], "zh 词 = VSC error.provider 逐字（基准归一）")
  initDict({ locale: "en" })
  assert.equal(t("composer.send.noProvider"), vscEn["error.provider"], "en 词 = VSC error.provider 逐字")
  const src = read("thincoder-desktop/renderer/composer-sync.mjs")
  assert.match(src, /reason === "provider-invalid"[\s\S]{0,120}?failure\?\.kind === "defaultModel"/, "失败行路由：provider-invalid 按真因分类（#840 续——defaultModel 类走新键）")
  assert.match(src, /t\("composer\.send\.noProvider"\)/, "非 defaultModel 类 ⇒ 基准词路由保留（值逐字不动）")
  assert.match(src, /t\("composer.send.failed", \{ reason \}\)/, "余码原模板保留")
})

// ─── L8 · MCP 装配缝 + M1 钩子 ────────────────────────────────────────────

test("L8 MCP 装配 + M1 钩子：并入 ∕ 失败落警告 ∥ manifest 附着 + 槽值优先", async () => {
  const { assembleFor } = await import(at("thincoder-desktop/src/main/agent-assemble.mjs"))
  const tmp = (p) => mkdtempSync(join(tmpdir(), p))

  /** 假 deps（核装配缺省八缝 + MCP 连接器注入缝）。 */
  const harness = (config, connect) => {
    const memory = {}
    const baseTools = [{ name: "read" }]
    const agent = { provider: config.provider, config }
    const deps = {
      loadConfig: () => config,
      createMemory: () => memory,
      createAgent: ({ tools }) => { agent.tools = tools; return agent },
      assembleBuiltinTools: async () => baseTools,
      discoverRules: () => [],
      syncDir: async () => {},
      team: () => null,
      author: () => "fake-author",
      injectProxy: () => {},
    }
    if (connect) deps.connectMcpServer = connect
    return { deps, agent, baseTools, memory }
  }
  const cfg = (extra = {}) => ({
    provider: { name: "p1", model: "m1", baseURL: "https://api.invalid/v1" },
    providersList: [{ name: "p1" }],
    memory: { dbPath: "fake.db", projectDir: null, team: null },
    agent: { streamRules: [] },
    ...extra,
  })

  // ① 零 MCP ⇒ 恒等（baseTools 原样）+ 警告空表 + 非工程 ⇒ manifest null
  const one = harness(cfg())
  const out1 = await assembleFor({ cwd: tmp("hx-l8a-"), slot: 1, deps: one.deps })
  assert.equal(out1, one.agent)
  assert.equal(out1._slot, 1, "_slot 注入")
  assert.equal(out1.tools, one.baseTools, "零 servers ⇒ baseTools 原样（恒等）")
  assert.deepEqual(out1._mcpWarnings, [], "警告面在场（空表）")
  assert.equal(out1.manifest, null, "非工程 ⇒ manifest null")
  assert.ok(!("_projectView" in out1), "非工程 ⇒ 零项目读面（不读 ∕ 不拒 ∕ 不建档）")
  assert.equal(out1._providerInvalid, undefined, "校验调用在盘（有效 ⇒ 零标记）")

  // ② 有 servers + 连接成功 ⇒ 工具并入（含 `_mcpName`）
  const two = harness(cfg({ mcp: { servers: [{ name: "s1", command: "x" }] } }), async (srv) => [{ name: `${srv.name}_t`, _mcpName: srv.name }])
  const out2 = await assembleFor({ cwd: tmp("hx-l8b-"), slot: 1, deps: two.deps })
  assert.equal(out2.tools.length, two.baseTools.length + 1, "并入一件")
  assert.equal(out2.tools.some((t) => t._mcpName === "s1"), true, "装配后 agent.tools 含 _mcpName 条目")
  assert.deepEqual(out2._mcpWarnings, [], "连接成功 ⇒ 零警告")

  // ③ 有 servers + 连接失败 ⇒ 警告在场不抛 + 工具原样（恒等）
  const three = harness(cfg({ mcp: { servers: [{ name: "s2", command: "x" }] } }), async () => { throw new Error("boom") })
  const out3 = await assembleFor({ cwd: tmp("hx-l8c-"), slot: 1, deps: three.deps })
  assert.equal(out3._mcpWarnings.length, 1, "失败 ⇒ 一条警告（不抛）")
  assert.match(out3._mcpWarnings[0], /MCP server "s2" failed to connect: boom/, "警告逐字（CLI 同形）")
  assert.equal(out3.tools, three.baseTools, "零并入 ⇒ 原数组原样")

  // ④ 工程模式（config 回退）⇒ manifest 附着（首跑建档 ⇒ created true；二跑读档 ⇒ created false）
  const engCwd = tmp("hx-l8d-")
  const four = harness(cfg({ agent: { streamRules: [], engineering: true } }))
  const out4 = await assembleFor({ cwd: engCwd, slot: 1, deps: four.deps })
  assert.ok(out4.manifest !== null && typeof out4.manifest === "object", "工程模式 ⇒ manifest 已附着")
  assert.equal(out4._projectView.created, true, "缺档 ⇒ 就地建档（KD-M1-25 轻动作）")
  const fourB = harness(cfg({ agent: { streamRules: [], engineering: true } }))
  const out4b = await assembleFor({ cwd: engCwd, slot: 1, deps: fourB.deps })
  assert.ok(out4b.manifest !== null, "二跑读档态 ⇒ 仍附着")
  assert.equal(out4b._projectView.created, false, "档已在 ⇒ created false")

  // ⑤ 槽值优先（槽 `engineering` 在场 ⇒ 以槽值判，压 config）
  const slotCwd = tmp("hx-l8e-")
  const { slotPath, writeSessionFile } = await import(at("thincoder-core/session-slots.mjs"))
  writeSessionFile(slotPath(slotCwd, 7), { version: 2, cwd: slotCwd, history: [], engineering: true })
  const five = harness(cfg()) // config 无 engineering
  const out5 = await assembleFor({ cwd: slotCwd, slot: 7, deps: five.deps })
  assert.ok(out5.manifest !== null, "槽 engineering:true ⇒ 附着（槽值优先）")
  const slotCwd2 = tmp("hx-l8f-")
  writeSessionFile(slotPath(slotCwd2, 7), { version: 2, cwd: slotCwd2, history: [], engineering: false })
  const fiveB = harness(cfg({ agent: { streamRules: [], engineering: true } })) // config 真
  const out5b = await assembleFor({ cwd: slotCwd2, slot: 7, deps: fiveB.deps })
  assert.equal(out5b.manifest, null, "槽 engineering:false ⇒ 不附着（槽值压 config 真）")
})

// ─── L9 · 文档面旧串零命中（规范面；记录面 ∕ 批档 ∕ 延后序档豁免）─────────────

test("L9 文档面：旧串零命中（规范面）", () => {
  // 点名排除 = 延后序档（#667 后收正——本批明文不判负）；批档 = 记录面（豁免）。
  const OLD = [
    { text: "不需该钮", exclude: [] },
    { text: "待消除（归对齐批）", exclude: [] },
    { text: "render-frame.mjs:227-230", exclude: ["docs/desktop/design/IPC.md"] },
    { text: "chrome.css:222", exclude: [] },
  ]
  const files = []
  const walk = (rel) => {
    for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
      const p = `${rel}/${e.name}`
      if (e.isDirectory()) { if (!p.endsWith("/batches") && !p.endsWith("/_archive")) walk(p) }
      else if (e.name.endsWith(".md")) files.push(p)
    }
  }
  walk("docs")
  const hits = []
  for (const rel of files) {
    const lines = read(rel).split(/\r?\n/)
    let inChangelog = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^##\s*变更记录/.test(line)) inChangelog = true
      if (inChangelog) continue // 记录面（changelog）豁免
      if (/^\s*-\s*20\d\d-\d\d-\d\d/.test(line)) continue // changelog 行（记录面）
      for (const old of OLD) {
        if (old.exclude.includes(rel)) continue
        if (line.includes(old.text)) hits.push(`${rel}:${i + 1} [${old.text}]`)
      }
    }
  }
  assert.deepEqual(hits, [], "旧串零命中（规范面）")
})
