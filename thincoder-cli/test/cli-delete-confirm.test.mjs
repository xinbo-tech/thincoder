/**
 * cli-delete-confirm.test.mjs — CLI 端删除类入口二次确认（台账 #96）。
 * 权威 = docs/cli/design/TUI-COMMANDS.md §5.4；用例 = 批档 docs/batches/2026-09-19-cli-delete-confirm.md §2.5（CD-1…CD-10）。
 * 驱动 = 真 TUI 路径 + 真 persistRaw：createPickers 真装配（真 showPicker / confirmDelete / picker 栈）
 * + createConfigHelpers(agent, { configPath }) 注入（真读真写 tmp config.json）+ createKeyHandler 真键路
 * （Enter = popPicker(items[index])——key-handler.mjs:225 逐字同路径；Esc = popPicker(null)——:203）。
 * 断言面 = 磁盘字节 / 内存镜像 / 级联三处 / picker 面序列——零夹具手写载荷（载荷由流自己写）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadConfig, _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"
import { createPickers } from "../src/tui/pickers.mjs"
import { createModelPicker } from "../src/tui/model-picker.mjs"
import { handleMcpCommand } from "../src/tui/cmd-mcp.mjs"
import { createConfigHelpers } from "../src/tui/config-helpers.mjs"
import { createKeyHandler } from "../src/tui/key-handler.mjs"

const C = { text: "t", dim: "d", tool: "c", error: "e", warn: "w" }
const L1 = "Models & Providers"
const qProvider = (name) => `Remove provider ${name}?`
const qMcp = (name) => `Remove MCP server "${name}"?`

const KIMI = { name: "kimi", baseURL: "https://kimi.example/v1", model: "kimi-k3", apiKey: "sk-kimi-plain" }
const DEEPSEEK = { name: "deepseek", baseURL: "https://ds.example/v1", model: "deepseek-v4-pro", apiKey: "sk-ds-secret" }
const SRV1 = { name: "srv1", url: "https://mcp1.example/mcp", token: "tok-srv1-secret" }
const SRV2 = { name: "srv2", url: "https://mcp2.example/mcp", token: "tok-srv2-secret" }

/** 渠道删除夹具：deepseek 带 apiKey 原文 + 级联三处悬挂引用（consultModels / subagentModels / advisor）。 */
const providerCfg = (providers = [KIMI, DEEPSEEK]) => ({
  defaultModel: "kimi:kimi-k3",
  providers,
  agent: {
    consultModels: [{ provider: "deepseek", model: "deepseek-v4-pro" }, { provider: "kimi", model: "kimi-k3" }],
    subagentModels: { coder: "deepseek:deepseek-v4-pro", explore: "kimi:kimi-k3" },
    advisor: { provider: "deepseek" },
  },
})
const mcpCfg = () => ({ defaultModel: "kimi:kimi-k3", providers: [KIMI], mcp: { servers: [SRV1, SRV2] } })

/** 最小 state（同 tui-selection-surfaces.test.mjs 桩形——真键路 computeLayout 读取面）。 */
const mkState = () => ({
  input: "", cursor: 0, tasks: [], lines: [], scroll: 0, subTasks: {}, search: null,
  interruptPrompt: null, question: null, picker: null, permission: null, wizard: null,
  expandedBlocks: new Set(), _frozenSubKeys: new Set(), streaming: "", reasoning: "",
  foldEnabled: true, status: "", history: [], historyIndex: -1, pickerStack: [],
  dims: { get: () => ({ cols: 80, rows: 24 }) },
})

/** 夹具：tmp config.json（真盘）+ loadConfig 真读（路径注入）+ createPickers 真装配 + 真键路。 */
function mkFx(t, content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-dcf-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  _setConfigPathForTest(p)
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })
  const cfg = loadConfig()
  const agent = {
    providers: cfg.providersList, config: cfg,
    activeProvider: "kimi", activeModel: "kimi-k3", provider: { ...cfg.providersList[0] }, tools: [],
  }
  const state = mkState()
  const lines = []
  const helper = createConfigHelpers(agent, { configPath: p })
  const calls = { persist: 0, memAtWrite: [] } // memAtWrite = 写盘时刻内存快照（先盘后存顺序判据）
  const base = {
    agent, state, render: () => {}, ansi: { bold: "", reset: "", dim: "" }, C,
    pushLine: (text, color) => lines.push({ text, color }), pushLabel: () => {},
    askQuestion: async () => "", maskKey: (k) => k, configPath: p,
    persistRaw: async (mutate) => {
      calls.persist++
      calls.memAtWrite.push({
        providers: agent.providers.map((x) => x.name),
        mcp: (agent.config?.mcp?.servers ?? []).map((s) => s.name),
      })
      await helper.persistRaw(mutate)
    },
  }
  const pickers = createPickers(base)
  const onKey = createKeyHandler({
    agent, state, render: () => {}, pushLine: () => {},
    popPicker: pickers.popPicker, renderPickerLines: pickers.renderPickerLines,
  })
  // slash 命令面 ctx（同 index.mjs 装配——cmd-mcp 由 handlerCtx 透传取得 showPicker/confirmDelete）
  const ctx = { ...base, showPicker: pickers.showPicker, closePicker: pickers.closePicker, confirmDelete: pickers.confirmDelete }
  return {
    cfgPath: p, read: () => readFileSync(p, "utf8"), json: () => JSON.parse(readFileSync(p, "utf8")),
    agent, state, lines, calls, pickers, onKey, tui: { ctx, state, pickers, onKey },
  }
}

const items = (p) => p.entries.filter((e) => e.type === "item")
const itemBy = (p, pred) => items(p).find(pred)
const tick = () => new Promise((r) => setTimeout(r, 0))
/** 面记录器：按 picker **对象身份**记录每次换面（连续同题两次确认面不被去重——「恰 1 确认面」可判）。 */
const rec = () => ({ list: [], last: null })
/** Enter 键（默认落点即当前 index）/ ↑ 键 / Esc 键——真键路。 */
const keyEnter = (onKey) => onKey("", { name: "return" })
const keyUp = (onKey) => onKey("", { name: "up" })
const keyEsc = (onKey) => onKey("", { name: "escape" })
const yes = (onKey) => { keyUp(onKey); keyEnter(onKey) } // 显式移到 Yes 行后确认（反误触语义）

/** 等 picker 面出现（真栈轮转——动态 import / 微任务渐次落地）；rec 记录全序列（恰 1 确认面判据）。 */
async function waitPicker(state, r, pred, label) {
  for (let i = 0; i < 200; i++) {
    const p = state.picker
    if (p && r.last !== p) { r.last = p; r.list.push(p.title) }
    if (p && (!pred || pred(p))) return p
    await tick()
  }
  assert.fail(`picker 面未出现：${label}（当前 = ${state.picker?.title ?? "null"} · 已见 = ${r.list.join(" → ")}）`)
}

/** 渠道删除驱动：L1 → Remove provider… → 选中 <target> → 确认面（answer 决定取消/确认）。 */
async function driveProviderRemove(tui, target, answer) {
  const { state, pickers, onKey } = tui
  const r = rec()
  const opening = pickers.openModelPicker()
  const l1 = await waitPicker(state, r, (p) => p.title === L1, L1)
  pickers.popPicker(itemBy(l1, (e) => e.action === "remove"))
  const rp = await waitPicker(state, r, (p) => p.title === "Remove Provider", "Remove Provider")
  pickers.popPicker(items(rp).find((e) => e.name === target))
  const face = await waitPicker(state, r, (p) => p.title === qProvider(target), "确认面")
  if (answer === "yes") yes(onKey)
  else if (answer === "cancel") keyEnter(onKey) // 默认落点 = Cancel（防误触 Enter 即删）
  else keyEsc(onKey)
  await waitPicker(state, r, (p) => p.title === L1, `${L1}（重开）`)
  keyEsc(onKey)
  await opening
  return { seen: r.list, face }
}

/** MCP 菜单路径驱动（主菜单 → srv 行 → Remove → 确认面）。gated=false ⇒ 确认面缺失即红（先红档口径）。 */
async function driveMcpMenu(tui, target, answer) {
  const { state, pickers, onKey } = tui
  const r = rec()
  const run = handleMcpCommand(tui.ctx, [])
  const menu = await waitPicker(state, r, (p) => p.title === "MCP", "MCP 主菜单")
  pickers.popPicker(itemBy(menu, (e) => e.action === `@${target}:`))
  const sub = await waitPicker(state, r, (p) => p.title === `MCP: ${target}`, `MCP: ${target}`)
  pickers.popPicker(itemBy(sub, (e) => e.action === "remove"))
  const face = await waitPicker(state, r, (p) => p.title === qMcp(target) || p.title === "MCP", "确认面 / 重开主菜单")
  if (face.title === qMcp(target)) {
    if (answer === "cancel") keyEnter(onKey)
    else if (answer === "esc") keyEsc(onKey)
    else yes(onKey) // "yes" | "auto"（恒绿档口径：门位在 ⇒ 确认）
    await waitPicker(state, r, (p) => p.title === "MCP", "MCP 主菜单（重开）")
  } else if (answer !== "auto") {
    assert.fail(`确认面未出现：${r.list.join(" → ")}`)
  }
  pickers.popPicker(null) // Esc 退出主菜单循环
  await run
  return { seen: r.list, face }
}

/** MCP 直参路径驱动（/mcp remove <name>）。 */
async function driveMcpDirect(tui, target, answer) {
  const { state, pickers, onKey } = tui
  const r = rec()
  const run = handleMcpCommand(tui.ctx, ["remove", target])
  const face = await waitPicker(state, r, (p) => p.title === qMcp(target), "确认面（直参）")
  if (answer === "yes") yes(onKey)
  else if (answer === "cancel") keyEnter(onKey)
  else keyEsc(onKey)
  await run
  return { seen: r.list, face }
}

test("CD-1 正常①（渠道删除确认）：选中 ⇒ 不落盘；Yes ⇒ 恰 1 确认面 + 落盘 + 级联 + apiKey 原文消失", async (t) => {
  const fx = mkFx(t, providerCfg())
  const { seen } = await driveProviderRemove(fx.tui, "deepseek", "yes")

  assert.equal(seen.filter((x) => x === qProvider("deepseek")).length, 1, `恰 1 确认面：${seen.join(" → ")}`)
  const disk = fx.json()
  assert.deepEqual(disk.providers.map((p) => p.name), ["kimi"], "盘：目标渠道已删")
  assert.equal(fx.read().includes("sk-ds-secret"), false, "盘：apiKey 原文随渠道消失（不可复得）")
  assert.deepEqual(disk.agent.consultModels.map((e) => e.provider), ["kimi"], "级联①：consultModels")
  assert.deepEqual(Object.keys(disk.agent.subagentModels), ["explore"], "级联②：subagentModels[role]")
  assert.equal(disk.agent.advisor?.provider, undefined, "级联③：advisor.provider")
  assert.deepEqual(fx.agent.providers.map((p) => p.name), ["kimi"], "内存镜像收正")
  assert.deepEqual(fx.agent.config.agent.consultModels.map((e) => e.provider), ["kimi"], "内存镜像 consultModels")
  assert.equal(fx.agent.config.advisor?.provider, undefined, "内存镜像 advisor.provider（提升拷贝）")
})

test("CD-2 反例①（取消 ⇒ 零落盘）：Cancel ⇒ 磁盘字节逐字同操作前 ∧ 内存不变 ∧ persistRaw 零调用", async (t) => {
  const fx = mkFx(t, providerCfg())
  const before = fx.read()
  await driveProviderRemove(fx.tui, "deepseek", "cancel")

  assert.equal(fx.read(), before, "磁盘字节逐字同操作前")
  assert.deepEqual(fx.agent.providers.map((p) => p.name), ["kimi", "deepseek"], "内存 providers 不变")
  assert.equal(fx.calls.persist, 0, "persistRaw 零调用")
})

test("CD-3 边界①（Esc ⇒ 零落盘）：确认面返回 null ⇒ 同 CD-2", async (t) => {
  const fx = mkFx(t, providerCfg())
  const before = fx.read()
  await driveProviderRemove(fx.tui, "deepseek", "esc")

  assert.equal(fx.read(), before, "磁盘字节逐字同操作前")
  assert.deepEqual(fx.agent.providers.map((p) => p.name), ["kimi", "deepseek"], "内存 providers 不变")
  assert.equal(fx.calls.persist, 0, "persistRaw 零调用")
})

test("CD-4 边界①（默认落点反误触）：defaultIndex == 1 ∧ items[1].action == \"no\" ∧ Enter 直落 Cancel", async (t) => {
  const fx = mkFx(t, providerCfg())
  const before = fx.read()
  const { face } = await driveProviderRemove(fx.tui, "deepseek", "cancel")

  assert.equal(face.title, qProvider("deepseek"), "确认面问句含目标名")
  assert.equal(face.index, 1, "默认落点 = Cancel（defaultIndex: 1）")
  assert.equal(items(face)[0].action, "yes", "Yes 动作行")
  assert.equal(items(face)[1].action, "no", "Cancel 行 action = no")
  assert.equal(items(face)[1].text, "Cancel", "Cancel 行文案（与先例同形）")
  assert.equal(fx.read(), before, "Enter 未移行 ⇒ 零落盘（防误触）")
  assert.equal(fx.calls.persist, 0)
})

test("CD-5 正常②（MCP 菜单）：srv2 → Remove → Yes ⇒ 恰 1 确认面 + 落盘 + 工具表收尾", async (t) => {
  const fx = mkFx(t, mcpCfg())
  fx.agent.tools = [{ name: "srv2__echo", _mcpName: "srv2" }]
  const { seen } = await driveMcpMenu(fx.tui, "srv2", "yes")

  assert.deepEqual(seen, ["MCP", "MCP: srv2", qMcp("srv2"), "MCP"], "面序列（恰 1 确认面）")
  const disk = fx.json()
  assert.deepEqual(disk.mcp.servers.map((s) => s.name), ["srv1"], "盘：srv2 已删")
  assert.equal(fx.read().includes("tok-srv2-secret"), false, "盘：token 原文随 server 消失")
  assert.deepEqual(fx.agent.config.mcp.servers.map((s) => s.name), ["srv1"], "内存 servers 收正")
  assert.deepEqual(fx.agent.tools, [], "srv2 工具已从工具表收尾（removeMcpTools）")
  assert.ok(fx.lines.some((l) => l.text === "[mcp] srv2 removed"), "既有输出行保留")
})

test("CD-6 反例②（菜单取消）：Cancel ⇒ 磁盘字节零变 ∧ 内存 servers 不变 ∧ 无 removed 行", async (t) => {
  const fx = mkFx(t, mcpCfg())
  fx.agent.tools = [{ name: "srv2__echo", _mcpName: "srv2" }]
  const before = fx.read()
  await driveMcpMenu(fx.tui, "srv2", "cancel")

  assert.equal(fx.read(), before, "磁盘字节逐字同操作前")
  assert.deepEqual(fx.agent.config.mcp.servers.map((s) => s.name), ["srv1", "srv2"], "内存 servers 不变")
  assert.equal(fx.calls.persist, 0, "persistRaw 零调用")
  assert.equal(fx.lines.some((l) => l.text.includes("removed")), false, "无 [mcp] … removed 行")
})

test("CD-7 正常②（MCP 直参 /mcp remove srv1）：确认面恰 1（零前置 picker）⇒ Yes ⇒ 落盘", async (t) => {
  const fx = mkFx(t, mcpCfg())
  const { seen } = await driveMcpDirect(fx.tui, "srv1", "yes")

  assert.deepEqual(seen, [qMcp("srv1")], "直参路径：唯一面 = 确认面（零前置 picker）")
  const disk = fx.json()
  assert.deepEqual(disk.mcp.servers.map((s) => s.name), ["srv2"], "盘：srv1 已删")
  assert.equal(fx.read().includes("tok-srv1-secret"), false, "盘：srv1 token 原文消失")
})

test("CD-8 反例②（直参取消）：Cancel ⇒ 零落盘 ∧ 零内存变更 ∧ 无 removed 行", async (t) => {
  const fx = mkFx(t, mcpCfg())
  const before = fx.read()
  await driveMcpDirect(fx.tui, "srv1", "cancel")

  assert.equal(fx.read(), before, "磁盘字节逐字同操作前")
  assert.deepEqual(fx.agent.config.mcp.servers.map((s) => s.name), ["srv1", "srv2"], "内存 servers 不变")
  assert.equal(fx.calls.persist, 0, "persistRaw 零调用")
  assert.equal(fx.lines.some((l) => l.text.includes("removed")), false, "无 [mcp] … removed 行")
})

test("CD-9 结构对账（计数单位 = 按入口归组）：删除类写点归组 == 2 ∧ 各入口内 confirmDelete( 在位", async () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "tui")
  const files = []
  const walk = (dir, rel = "") => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name), `${rel}${e.name}/`)
      else if (e.name.endsWith(".mjs")) files.push({ name: `${rel}${e.name}`, lines: readFileSync(join(dir, e.name), "utf8").split("\n") })
    }
  }
  walk(srcDir)
  // 本域删除条写点模式（仅此两族——新增第三族须同批扩表，否则本检查不可见）
  const patterns = [/providers\.splice\(/, /\.servers\s*=\s*[^\n]*\.filter\(/]
  const FN = /^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/
  const groups = new Map() // "file:entry（函数）" → { points, gated }
  for (const f of files) {
    f.lines.forEach((line, i) => {
      if (!patterns.some((re) => re.test(line))) return
      let entry = "(top-level)", start = -1
      for (let j = i - 1; j >= 0; j--) {
        const m = f.lines[j].match(FN)
        if (m) { entry = m[1]; start = j; break }
      }
      const g = groups.get(`${f.name}:${entry}`) ?? { points: [], gated: false }
      g.points.push(i + 1)
      if (start >= 0 && f.lines.slice(start, i).some((l) => l.includes("confirmDelete("))) g.gated = true
      groups.set(`${f.name}:${entry}`, g)
    })
  }
  const names = [...groups.keys()].sort()
  assert.deepEqual(names, ["cmd-mcp.mjs:removeServer", "model-picker.mjs:removeProviderFlow"],
    `域内删除类入口名单（计数 = ${names.length}，名单数 = 2——计数漂移 ⇒ 红 + 点名）`)
  for (const [key, g] of groups) assert.ok(g.gated, `${key} 写点（行 ${g.points.join("/")}）之前无 confirmDelete( 门`)

  // 域外正控（非 TUI 面——本门不涉；证明「删除 + 显式确认」原型在册）
  const bin = readFileSync(join(srcDir, "..", "..", "bin", "thincoder.mjs"), "utf8")
  assert.match(bin, /session gc --dry-run \| --confirm/, "域外正控 session gc --confirm 在册")
})

test("CD-10 零回归锚（恒绿）：级联三处同清 · 先盘后存顺序 · 内存镜像收正 · activeProvider 不可删", async (t) => {
  // ── 渠道面（门位若在 ⇒ Yes；不在 ⇒ 现态直删——本档断言与门无关，恒绿）──
  const fx = mkFx(t, providerCfg())
  const { state, pickers, onKey } = fx.tui
  const r = rec()
  const opening = pickers.openModelPicker()
  const l1 = await waitPicker(state, r, (p) => p.title === L1, L1)
  assert.ok(itemBy(l1, (e) => e.action === "remove"), "锚④：>1 渠道 ⇒ Remove provider… 行在")
  pickers.popPicker(itemBy(l1, (e) => e.action === "remove"))
  const rp = await waitPicker(state, r, (p) => p.title === "Remove Provider", "Remove Provider")
  assert.deepEqual(items(rp).map((e) => e.name), ["deepseek"], "锚④：删除候选排除 activeProvider（kimi）")
  pickers.popPicker(items(rp)[0])
  const face = await waitPicker(state, r, (p) => p.title === qProvider("deepseek") || p.title === L1, "确认面 / 重开 L1")
  if (face.title === qProvider("deepseek")) { yes(onKey); await waitPicker(state, r, (p) => p.title === L1, `${L1}（重开）`) }
  keyEsc(onKey)
  await opening

  const disk = fx.json()
  assert.deepEqual(disk.providers.map((p) => p.name), ["kimi"], "盘：目标渠道已删")
  assert.deepEqual(disk.agent.consultModels.map((e) => e.provider), ["kimi"], "锚①：级联 consultModels（盘）")
  assert.deepEqual(Object.keys(disk.agent.subagentModels), ["explore"], "锚①：级联 subagentModels[role]（盘）")
  assert.equal(disk.agent.advisor?.provider, undefined, "锚①：级联 advisor.provider（盘）")
  assert.deepEqual(fx.agent.providers.map((p) => p.name), ["kimi"], "锚③：内存 providers 收正")
  assert.deepEqual(fx.agent.config.agent.consultModels.map((e) => e.provider), ["kimi"], "锚③：内存镜像 consultModels")
  assert.deepEqual(Object.keys(fx.agent.config.agent.subagentModels), ["explore"], "锚③：内存镜像 subagentModels")
  assert.equal(fx.agent.config.agent.advisor?.provider, undefined, "锚③：内存镜像 agent.advisor.provider")
  assert.equal(fx.agent.config.advisor?.provider, undefined, "锚③：内存镜像提升拷贝 advisor.provider")
  assert.ok(fx.calls.memAtWrite[0].providers.includes("deepseek"), "锚②：写盘时刻内存尚未收正（先盘后存）")

  // ── 渠道面锚④（单渠道 ⇒ 无 Remove provider… 行）──
  const fx1 = mkFx(t, providerCfg([KIMI]))
  const opening1 = fx1.pickers.openModelPicker()
  const l1b = await waitPicker(fx1.state, rec(), (p) => p.title === L1, `${L1}（单渠道）`)
  assert.equal(items(l1b).some((e) => e.action === "remove"), false, "锚④：单渠道 ⇒ Remove provider… 行不出（length > 1 门）")
  keyEsc(fx1.onKey)
  await opening1

  // ── MCP 面锚②/③（先盘后存 + 内存镜像收正）──
  const fx2 = mkFx(t, mcpCfg())
  fx2.agent.tools = [{ name: "srv2__echo", _mcpName: "srv2" }]
  await driveMcpMenu(fx2.tui, "srv2", "auto")
  assert.ok(fx2.calls.memAtWrite[0].mcp.includes("srv2"), "锚②：MCP 写盘时刻内存 servers 尚未收正")
  assert.deepEqual(fx2.json().mcp.servers.map((s) => s.name), ["srv1"], "盘：srv2 已删")
  assert.deepEqual(fx2.agent.config.mcp.servers.map((s) => s.name), ["srv1"], "锚③：MCP 内存镜像收正")
})

test("AC-CL-3 缺键 fail-closed（渠道）：ctx 无 confirmDelete ⇒ 入口报错、零落盘（不降级直删）", async (t) => {
  const fx = mkFx(t, providerCfg())
  const before = fx.read()
  const state = mkState()
  const helper = createConfigHelpers(fx.agent, { configPath: fx.cfgPath })
  // 直装 createModelPicker（绕过 createPickers 装配——缺 confirmDelete 键）
  const picker = createModelPicker({
    agent: fx.agent, state, render: () => {}, ansi: { bold: "", reset: "", dim: "" }, C,
    pushLine: () => {}, persistRaw: helper.persistRaw, askQuestion: async () => "", maskKey: (k) => k,
    closePicker: () => {}, renderPickerLines: () => {},
    showPicker: async (title, entries) => {
      if (title === L1) return entries.find((e) => e.type === "item" && e.action === "remove")
      if (title === "Remove Provider") return entries.find((e) => e.type === "item" && e.name === "deepseek")
      return null
    },
  })
  await assert.rejects(() => picker.openModelPicker(), /confirmDelete/, "缺门 ⇒ 报错（非静默放行）")
  assert.equal(fx.read(), before, "零落盘（不降级直删）")
  assert.deepEqual(fx.agent.providers.map((p) => p.name), ["kimi", "deepseek"], "内存 providers 不变")
})

test("AC-CL-3 缺键 fail-closed（MCP 直参）：ctx 无 confirmDelete ⇒ 入口报错、零落盘", async (t) => {
  const fx = mkFx(t, mcpCfg())
  const before = fx.read()
  const helper = createConfigHelpers(fx.agent, { configPath: fx.cfgPath })
  const ctx = {
    agent: fx.agent, pushLine: () => {}, pushLabel: () => {}, askQuestion: async () => "",
    persistRaw: helper.persistRaw, configPath: fx.cfgPath, showPicker: async () => null,
  }
  await assert.rejects(() => handleMcpCommand(ctx, ["remove", "srv1"]), /confirmDelete/, "缺门 ⇒ 报错（非静默放行）")
  assert.equal(fx.read(), before, "零落盘（不降级直删）")
  assert.deepEqual(fx.agent.config.mcp.servers.map((s) => s.name), ["srv1", "srv2"], "内存 servers 不变")
})
