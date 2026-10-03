/**
 * 2026-10-04-issue-fix-round3.test.mjs — 批内件（issue 修复批·三 · 批档 §2.4 四组全量）
 *
 * 覆盖（批档 `docs/batches/2026-10-04-issue-fix-round3.md` §2.4 表 ∥ §2.2 验收）：
 *   组 1 · #823（VSC MCP 警告消费——假装配）：展开出参 warnings ⇒ 尾调用入队（首两段 CLI 逐字正则 +
 *          VSC 出口句）∥ 同指纹二轮零重推（指纹变更 ∥ 恢复后复失败 ⇒ 再推）∥ 零警告零写 + 指纹清 ∥
 *          负控（缺键 ∥ 非数组 ∥ 零服务器 ∥ `warnings` 键缺）∥ 装配抛 ⇒ 非致命零提醒。
 *   组 2 · #854（状态栏「思考中」静态化）：thinking ⇒ 静态段在场 ∧ 零 `.loading-dots`；null ⇒ 段缺席 ∥
 *          全树代码面 `loading-dots` ∕ `@keyframes dots` 零残留。
 *   组 3 · #875a（阅读位保护门控·两向）：旗标假 ⇒ 三径零写（消息区工具卡/错误 ∥ 活动区（直调 + 出生径）∥
 *          块跟滚）+ 显式动作照写；旗标真 ⇒ 三径照写 MAX；调用点纪律（`scrollDown` 本体零门）。
 *   组 4 · #875b（推理块两径默认折叠）：live 径 `renderReasoning` ⇒ `open = false`（内容在场）∥
 *          恢复径 `buildAssistantRestore` 无 `open` 属性（展开后内容在场；缺 reasoning ⇒ 零块）。
 *   组 5 · #875c（三键应用）：三键落值 ∥ 缺键缺省（true ∥ 32vh ∥ 3）∥ 坏值 ⇒ 缺省 ∥ `tailLines = 0` ⇒
 *          零预览 ∥ 核缝直测 ∥ 装载烟测（甲舱 `webview/ui-prefs.js:12` 具名导入核缝可解析——缝未落前
 *          整链不可装载）。
 *
 * 跑法（自仓根 thincoder/）：`node --test docs/batches/2026-10-04-issue-fix-round3.test.mjs`
 * 纪律：平 node · 零网络；VSC 面腿按注入面构造（happy-dom 真 webview 模块 + `vscode` ∕ `panel-mcp`
 * 短接桩——沿 `2026-09-30-vsc-residuals` ∥ `2026-09-30-cross-end-digest-recovery` 先例；甲舱档只读 +
 * 驱动，零改写）；真机腿 = 父侧走查（不入件）。随批留存 · 不进仓套件。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, realpathSync } from "node:fs"
import { registerHooks } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
/** 盘符大小写单键：junction 规范形 = 大写（`realpathSync` 经 junction ⇒ `D:`；直路径保留入参大小写 ⇒ 双实例——先例 = 跨端消化批夹具收正）。 */
const canon = (p) => p.replace(/^([a-z]):/, (_, d) => `${d.toUpperCase()}:`)
const ROOT = canon(realpathSync(resolve(HERE, "..", ".."))) // 仓根 = thincoder/
const mod = (rel) => import(pathToFileURL(canon(realpathSync(resolve(ROOT, rel)))).href)
const readSrc = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

// ─── 宿主短接桩（registerHooks——只供装载，行为面零触；沿 `2026-09-30-vsc-residuals` 先例）──

const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }) }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined }
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }) }
export const env = { openExternal: async () => undefined }
`)
/** `panel-mcp` 短接：行为面经 `globalThis.__panelMcpStub` 逐腿切换（出参 ∥ 抛两向）。 */
const PANEL_MCP_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export async function connectMcpServersExpanded(servers) { return globalThis.__panelMcpStub(servers) }
`)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    if (specifier === "../extension/panel-mcp.mjs" && String(context.parentURL ?? "").endsWith("/agent/tool-table.mjs")) {
      return { url: PANEL_MCP_STUB_URL, shortCircuit: true }
    }
    return next(specifier, context)
  },
})

// ─── happy-dom（真 webview 模块装载面——沿 `2026-09-30-cross-end-digest-recovery` 先例）──

const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
document.body.innerHTML = `
  <div id="chat-container">
    <div id="messages"></div>
    <div id="subagent-activity"></div>
    <div id="toolbar"><div id="status-line"></div><div id="input-row"><textarea id="input"></textarea></div></div>
    <div id="model-dropdown"></div><div id="reasoning-dropdown"></div><div id="session-dropdown"></div>
    <button id="session-selector"></button><span id="session-title"></span>
  </div>`
const wvPosts = []
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => wvPosts.push(m), getState: () => ({}), setState: () => {} })
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
const tick = (ms = 150) => new Promise((r) => setTimeout(r, ms))
/** 有界等待：谓词成立即返（rAF 帧 ∥ 节流复排——渲染器 minMs 50 跳帧自愈）。 */
const waitFor = async (predicate, ms = 1000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (predicate()) return true
    await tick(10)
  }
  return predicate()
}

// ─── 装载面（VSC 真 webview 图 ∥ 核件 ∥ 甲舱 src 面）──

const [
  wState, wi18n, wUi, wStreaming, wStatusBar, wUiPrefs, wActivityView,
  coreBlock, coreReasoning, coreSubBlock, mcpReminders, toolTable,
] = await Promise.all([
  mod("thincoder-vscode/webview/state.js"),
  mod("thincoder-vscode/webview/i18n.js"),
  mod("thincoder-vscode/webview/ui.js"),
  mod("thincoder-vscode/webview/streaming.js"),
  mod("thincoder-vscode/webview/status-bar.js"),
  mod("thincoder-vscode/webview/ui-prefs.js"), // #875c 应用面（甲舱——具名导入核缝 = 装载烟测面）
  mod("thincoder-vscode/webview/activity-view.js"), // 核叶 shim（`export *`——缝再出口）
  mod("thincoder-render-core/flow/block.mjs"), // #875b 恢复径
  mod("thincoder-render-core/flow/reasoning.mjs"), // #875b live 径
  mod("thincoder-render-core/subblocks/block.mjs"), // 夹具：真子代理块构件
  mod("thincoder-vscode/src/agent/setup-reminders.mjs"), // #823 提醒面（甲舱）
  mod("thincoder-vscode/src/agent/tool-table.mjs"), // #823 装配面（甲舱——panel-mcp 短接）
])
const { ctx, S } = wState
const { applyMcpWarnings } = mcpReminders

// ─── 组 1 · #823（MCP 警告消费——假装配）─────────────────────────────────────────

const WARNINGS = ["srv-a: connect ECONNREFUSED 127.0.0.1:1", "srv-b: spawn ENOENT"]
/** 真装配面（深度 0——装饰段 + MCP 段 + 基础集全走）；panel-mcp 行为 = `__panelMcpStub`。 */
const buildTable = (mcpServers) => toolTable.buildToolTable({
  depth: 0, role: null, engineering: false, provider: { model: "glm-5" },
  mcpServers, builtinTools: [], opts: {}, batchDoc: null, settingsTool: {},
})

test("T-823-1（正常·假装配）展开出参 warnings ⇒ 尾调用入队（首两段 CLI 逐字正则 + VSC 出口句）", async () => {
  globalThis.__panelMcpStub = async () => ({ tools: [], warnings: [...WARNINGS] })
  const { baseSet, mcpWarnings } = await buildTable([{ name: "srv-a" }, { name: "srv-b" }])
  assert.deepEqual(mcpWarnings, WARNINGS, "出参透传（`r.warnings ?? []`）")
  assert.ok(Array.isArray(baseSet), "基础集照常产出")
  const agent = {}
  applyMcpWarnings(agent, mcpWarnings)
  assert.equal(agent._pendingReminders.length, 1, "提醒恰一条")
  const text = agent._pendingReminders[0]
  // 首两段逐字 = CLI 模板（`thincoder-cli/src/command-interactive.mjs:164-166`）
  const cliTwo = /^\[System reminder: 2 MCP server\(s\) failed to connect at startup:\n {2}- srv-a: connect ECONNREFUSED 127\.0\.0\.1:1\n {2}- srv-b: spawn ENOENT\n/
  assert.ok(cliTwo.test(text), `首两段 CLI 逐字（实读：${JSON.stringify(text.slice(0, 110))}）`)
  assert.ok(text.endsWith("You can try reconnecting from the Settings panel (MCP section → Reconnect).]"), "末行 = VSC 出口句")
  assert.ok(!text.includes("/mcp connect"), "非 CLI 出口（本端可达出口面）")
  assert.equal(agent._mcpWarnings, mcpWarnings, "载体 = 同引用（三端同形——`SETTINGS.md` §2.4）")
  console.log(`[读数] T-823-1: pending=${agent._pendingReminders.length} · 首行=${JSON.stringify(text.split("\n")[0])}`)
})

test("T-823-2（边界）同指纹二轮零重推；指纹变更 ⇒ 推；零警告零写 + 指纹清；恢复后复失败 ⇒ 再推", () => {
  const agent = {}
  applyMcpWarnings(agent, WARNINGS)
  const n1 = agent._pendingReminders.length
  applyMcpWarnings(agent, [...WARNINGS]) // 同失败集（新数组同指纹）
  assert.equal(agent._pendingReminders.length, n1, "同指纹 ⇒ 零重推")
  applyMcpWarnings(agent, ["srv-c: connect timeout"]) // 指纹变更
  assert.equal(agent._pendingReminders.length, n1 + 1, "指纹变更 ⇒ 再推")
  const n2 = agent._pendingReminders.length
  applyMcpWarnings(agent, []) // 恢复
  assert.equal(agent._pendingReminders.length, n2, "零警告 ⇒ 队零写")
  assert.equal(agent._mcpWarnedKey, null, "指纹清（复失败可再推）")
  applyMcpWarnings(agent, WARNINGS)
  assert.equal(agent._pendingReminders.length, n2 + 1, "恢复后复失败 ⇒ 再推")
  console.log(`[读数] T-823-2: n1=${n1} n2=${n2} final=${agent._pendingReminders.length}`)
})

test("T-823-3（负控）零服务器 ∥ `warnings` 键缺 ∥ 缺键 ∥ 非数组 ⇒ 零写（队 ∥ 载体零触）", async () => {
  globalThis.__panelMcpStub = async () => ({ tools: [], warnings: ["never-delivered"] })
  const zero = await buildTable([]) // 零服务器 ⇒ 不展开
  assert.deepEqual(zero.mcpWarnings, [], "零服务器 ⇒ 零警告")
  globalThis.__panelMcpStub = async () => ({ tools: [] }) // `warnings` 键缺
  const missing = await buildTable([{ name: "srv-a" }])
  assert.deepEqual(missing.mcpWarnings, [], "`r.warnings ?? []` 归一")
  for (const mcpWarnings of [zero.mcpWarnings, missing.mcpWarnings]) {
    const agent = {}
    applyMcpWarnings(agent, mcpWarnings)
    assert.equal("_pendingReminders" in agent, false, "零警告 ⇒ 队零写")
    assert.equal("_mcpWarnings" in agent, false, "载体零写")
    assert.equal(agent._mcpWarnedKey, null, "指纹清")
  }
  for (const bad of [undefined, null, "srv-a: boom", 42, {}]) {
    const agent = {}
    applyMcpWarnings(agent, bad) // 缺键 ∥ 非数组
    assert.equal("_pendingReminders" in agent, false, `负控（${JSON.stringify(bad)}）⇒ 队零写`)
    assert.equal("_mcpWarnings" in agent, false, "载体零写")
    assert.equal(agent._mcpWarnedKey, null, "指纹清")
  }
  console.log(`[读数] T-823-3: zero=${JSON.stringify(zero.mcpWarnings)} missing=${JSON.stringify(missing.mcpWarnings)} · 负控 5 值零写`)
})

test("T-823-4（装配抛）展开抛 ⇒ 非致命（照常 resolve）+ 零警告 ⇒ 零提醒", async () => {
  globalThis.__panelMcpStub = async () => { throw new Error("expansion crashed") }
  const { baseSet, mcpWarnings } = await buildTable([{ name: "srv-a" }])
  assert.ok(Array.isArray(baseSet), "装配非致命（baseSet 照常产出）")
  assert.deepEqual(mcpWarnings, [], "抛 ⇒ 零警告（catch 缺省 `[]`）")
  const agent = {}
  applyMcpWarnings(agent, mcpWarnings)
  assert.equal("_pendingReminders" in agent, false, "零提醒")
  console.log(`[读数] T-823-4: 抛径 resolve ✓ · mcpWarnings=${JSON.stringify(mcpWarnings)}`)
})

// ─── 组 2 · #854（状态栏「思考中」静态化）────────────────────────────────────────

test("T-854-1（渲染两态）thinking ⇒ 静态段在场 ∧ 零 `.loading-dots`；null ⇒ 段缺席", () => {
  wi18n.setStrings({ "status.thinking": "THINK" })
  const line = document.getElementById("status-line")
  S._phase = "thinking"
  wStatusBar.renderStatusBar()
  assert.ok(line.textContent.includes("THINK…"), `thinking ⇒ 静态段「THINK…」（实读：${JSON.stringify(line.textContent)}）`)
  assert.equal(line.querySelectorAll(".loading-dots").length, 0, "零动画节点（`.loading-dots`）")
  assert.ok(!/loading-dots|@keyframes/.test(line.innerHTML), "渲染面零动画残留")
  S._phase = null
  wStatusBar.renderStatusBar()
  assert.ok(!line.textContent.includes("THINK"), "null ⇒ 段缺席")
  console.log(`[读数] T-854-1: thinking 段=${JSON.stringify("THINK…")} · 段内 loading-dots=0 · null 段缺席 ✓`)
})

test("T-854-2（全树代码面）`loading-dots` ∥ `@keyframes dots` 零命中", () => {
  const SKIP_DIRS = new Set(["node_modules", ".git", ".thincoder", "docs", "out", "build", "coverage", ".vscode-test"])
  const CODE_EXT = /\.(js|mjs|cjs|css|html)$/
  const hits = []
  let files = 0
  const walk = (rel) => {
    for (const e of readdirSync(resolve(ROOT, rel), { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name) || /^dist/.test(e.name)) continue
        walk(rel === "" ? e.name : `${rel}/${e.name}`)
      } else if (CODE_EXT.test(e.name)) {
        files += 1
        const text = readFileSync(resolve(ROOT, rel, e.name), "utf8")
        if (/loading-dots|@keyframes\s+dots/.test(text)) hits.push(rel === "" ? e.name : `${rel}/${e.name}`)
      }
    }
  }
  walk("")
  assert.ok(files > 100, `扫描面非空（防意外空集假绿——实读 ${files} 档）`)
  assert.deepEqual(hits, [], `全树代码面零残留（扫描 ${files} 档）`)
  console.log(`[读数] T-854-2: 扫描 ${files} 档 · 命中 ${hits.length}`)
})

// ─── 组 3 · #875a（阅读位保护门控·两向）─────────────────────────────────────────

const MAX_TOP = Number.MAX_SAFE_INTEGER

test("T-875a-1（旗标假）三径零写（消息区工具/错误 ∥ 活动区（直调+出生径）∥ 块跟滚）+ 显式动作照写", async () => {
  const msgs = ctx.messagesEl
  const act = ctx.activityEl
  ctx._autoFollow = false
  ctx._pinBottom = true
  ctx._pinActivity = true
  // 径 1：消息区（工具卡建 ⇒ 终卡 ⇒ 错误横幅）
  msgs.scrollTop = 7
  wUi.addTool(ctx, "read", "file.mjs", "r3-t1")
  assert.equal(msgs.scrollTop, 7, "工具卡建 ⇒ 零写")
  wUi.finishTool(ctx, "read", "r3-t1", "工具输出")
  assert.equal(msgs.scrollTop, 7, "工具卡终 ⇒ 零写")
  wUi.showError(ctx, "boom")
  assert.equal(msgs.scrollTop, 7, "错误横幅 ⇒ 零写")
  // 径 2：活动区（直调 ∥ 出生径）
  act.scrollTop = 9
  wUi.maybeScrollActivity(ctx)
  assert.equal(act.scrollTop, 9, "活动区直调 ⇒ 零写")
  // 径 3：块跟滚（真 `streaming.js` `subagentChunk` 驱动 + rAF 帧）
  wStreaming.subagentChunk({ name: "sub:eng-coder#1", kind: "text", text: "l1\nl2" })
  assert.equal(act.scrollTop, 9, "块出生径区 pin ⇒ 零写")
  const block = S._subBlocks.get("sub:eng-coder#1")
  const content = block.querySelector(".advisor-content")
  await tick(150)
  assert.equal(content.scrollTop, 0, "块跟滚帧 ⇒ 零写")
  // 显式动作零门（回底钮 ∥ 发消息同径）
  msgs.scrollTop = 5
  wUi.scrollDown(ctx)
  assert.equal(msgs.scrollTop, MAX_TOP, "显式动作照写（零门）")
  assert.equal(ctx._pinBottom, true, "显式动作重 pin")
  console.log(`[读数] T-875a-1: msgs=7→${7} · act=9→9 · blockContent=0 · scrollDown→MAX`)
})

test("T-875a-2（旗标真）三径照写 MAX（消息区工具/错误 ∥ 活动区（直调+出生径）∥ 块跟滚）", async () => {
  const msgs = ctx.messagesEl
  const act = ctx.activityEl
  ctx._autoFollow = true
  ctx._pinBottom = true
  ctx._pinActivity = true
  msgs.scrollTop = 0
  wUi.addTool(ctx, "read", "file.mjs", "r3-t2")
  assert.equal(msgs.scrollTop, MAX_TOP, "工具卡建 ⇒ 写 MAX")
  msgs.scrollTop = 0
  wUi.finishTool(ctx, "read", "r3-t2", "输出")
  assert.equal(msgs.scrollTop, MAX_TOP, "工具卡终 ⇒ 写 MAX")
  msgs.scrollTop = 0
  wUi.showError(ctx, "boom2")
  assert.equal(msgs.scrollTop, MAX_TOP, "错误横幅 ⇒ 写 MAX")
  act.scrollTop = 0
  wUi.maybeScrollActivity(ctx)
  assert.equal(act.scrollTop, MAX_TOP, "活动区直调 ⇒ 写 MAX")
  wStreaming.subagentChunk({ name: "sub:eng-coder#2", kind: "text", text: "l3" })
  assert.equal(act.scrollTop, MAX_TOP, "块出生径区 pin ⇒ 写 MAX")
  const block = S._subBlocks.get("sub:eng-coder#2")
  const content = block.querySelector(".advisor-content")
  await waitFor(() => content.scrollTop === MAX_TOP)
  assert.equal(content.scrollTop, MAX_TOP, "块跟滚帧 ⇒ 写 MAX")
  console.log(`[读数] T-875a-2: 三径写值均 = ${MAX_TOP}`)
})

test("T-875a-3（纪律面）四自动调用点走门 ∥ `scrollDown` 本体零门 ∥ 帧尾门包在循环前", () => {
  const uiSrc = readSrc("thincoder-vscode/webview/ui.js")
  const fnBodyOf = (name) => {
    const at = uiSrc.indexOf(`function ${name}(`)
    assert.ok(at >= 0, `函数 ${name} 在场`)
    const open = uiSrc.indexOf("{", at)
    let depth = 0
    for (let i = open; i < uiSrc.length; i++) {
      if (uiSrc[i] === "{") depth += 1
      else if (uiSrc[i] === "}") {
        depth -= 1
        if (depth === 0) return uiSrc.slice(open, i + 1)
      }
    }
    assert.fail(`函数 ${name} 未闭合`)
  }
  assert.ok(!fnBodyOf("scrollDown").includes("_autoFollow"), "`scrollDown` 本体零门（显式动作专用）")
  for (const fn of ["maybeScrollDown", "maybeScrollActivity"]) {
    assert.ok(fnBodyOf(fn).includes("_autoFollow === false"), `两原语门（${fn}）`)
  }
  const autoCallSites = { addTool: 1, finishTool: 2, showError: 1 } // finishTool 两径（主 ∥ 回退）
  for (const [fn, n] of Object.entries(autoCallSites)) {
    const body = fnBodyOf(fn)
    assert.equal((body.match(/maybeScrollDown\(ctx\)/g) ?? []).length, n, `${fn} 调用点走门 ×${n}`)
    assert.equal((body.match(/(?<!maybe)scrollDown\(ctx\)/g) ?? []).length, 0, `${fn} 零直写`)
  }
  assert.ok(fnBodyOf("addUser").includes("scrollDown(ctx)"), "发消息（显式动作）保持直写")
  const streamSrc = readSrc("thincoder-vscode/webview/streaming.js")
  assert.ok(/subScroll:[^\n]*_autoFollow === false[^\n]*maybeScrollBlock/.test(streamSrc), "帧尾门包在 `maybeScrollBlock` 循环前")
  console.log("[读数] T-875a-3: 四调用点=门 · scrollDown=零门 · addUser=直写 · 帧尾门=循环前")
})

// ─── 组 4 · #875b（推理块两径默认折叠）──────────────────────────────────────────

test("T-875b-1（live 径）`renderReasoning` ⇒ `open = false`；内容在场（手动展开可看全）", () => {
  const { el, content } = coreReasoning.renderReasoning({ text: "推理文本" })
  assert.equal(el.open, false, "默认折叠")
  assert.equal(content.textContent.trim(), "推理文本", "内容已渲（折叠≠丢内容）")
  el.open = true
  assert.equal(el.open, true, "手动展开可达")
  assert.equal(content.textContent.trim(), "推理文本", "展开后内容在场")
  console.log(`[读数] T-875b-1: open=${el.open}（展开态读数）· 内容=${JSON.stringify(content.textContent.trim())}`)
})

test("T-875b-2（恢复径）`buildAssistantRestore` 无 `open` 属性；展开后内容在场；缺 reasoning ⇒ 零块", () => {
  const el = coreBlock.buildAssistantRestore({ reasoning: "恢复推理", text: "正文", idx: 3 })
  const d = el.querySelector(".reasoning-block")
  assert.ok(d, "推理块在场")
  assert.equal(d.hasAttribute("open"), false, "恢复径无 `open` 属性")
  assert.equal(d.open, false, "默认折叠")
  d.open = true
  assert.equal(d.querySelector(".reasoning-content").textContent.trim(), "恢复推理", "展开后内容在场")
  const none = coreBlock.buildAssistantRestore({ text: "只有正文" })
  assert.equal(none.querySelector(".reasoning-block"), null, "缺 reasoning ⇒ 零块")
  console.log(`[读数] T-875b-2: hasAttribute(open)=${d.hasAttribute("open")} · 内容=${JSON.stringify(d.querySelector(".reasoning-content").textContent.trim())}`)
})

// ─── 组 5 · #875c（三键应用 ∥ 核缝 ∥ 装载烟测）───────────────────────────────────

let blockSeq = 0
/** 折叠态子代理块（真构件；6+ 行内容 ⇒ tail 渲染面）——返回块元素。 */
const mkFoldedBlock = (rows) => {
  blockSeq += 1
  const block = coreSubBlock.renderSubBlock({ key: `k-${blockSeq}`, label: "eng-coder#1", role: "eng-coder", id: blockSeq })
  const content = block.querySelector(".advisor-content")
  for (const text of rows) {
    const div = document.createElement("div")
    div.className = "advisor-text"
    div.textContent = text
    content.appendChild(div)
  }
  block.open = false // 折叠 ⇒ tail 渲染判据（live 折叠 ∥ frozen 同面）
  wActivityView.refreshBlock(block)
  return block
}
/** tail 预览行数（`.sub-tail` 内 `│ ` 前缀行计数；无节点 ⇒ 0）。 */
const tailCountOf = (block) => {
  const tail = block.querySelector(".sub-tail")
  return tail === null ? 0 : tail.textContent.split("\n").filter((l) => l.startsWith("│ ")).length
}

test("T-875c-1（三键应用）autoFollow ⇒ 门落值；maxHeight ⇒ 内联；tailLines=5 ⇒ 预览 5 行", () => {
  wUiPrefs.applyUiPrefs({ autoFollow: false, activityMaxHeight: 40, activityTailLines: 5 })
  assert.equal(ctx._autoFollow, false, "门落值（`_autoFollow`）")
  assert.equal(ctx.activityEl.style.maxHeight, "40vh", "内联封顶（40vh）")
  assert.ok(ctx._autoFollow === false, "（门面二次读）")
  const block = mkFoldedBlock(["r1", "r2", "r3", "r4", "r5", "r6"])
  assert.equal(tailCountOf(block), 5, "tailLines=5 ⇒ 预览 5 行（取尾）")
  console.log(`[读数] T-875c-1: autoFollow=${ctx._autoFollow} · maxHeight=${ctx.activityEl.style.maxHeight} · tail=${tailCountOf(block)}`)
})

test("T-875c-2（缺键缺省）payload 缺键 ⇒ true ∥ 32vh ∥ 3；二轮同载荷零净变", () => {
  wUiPrefs.applyUiPrefs({})
  assert.equal(ctx._autoFollow, true, "缺键 ⇒ 缺省 true")
  assert.equal(ctx.activityEl.style.maxHeight, "32vh", "缺键 ⇒ 缺省 32vh")
  const block = mkFoldedBlock(["r1", "r2", "r3", "r4", "r5"])
  assert.equal(tailCountOf(block), 3, "缺键 ⇒ 缺省 3 行")
  const snap = { follow: ctx._autoFollow, height: ctx.activityEl.style.maxHeight, tail: tailCountOf(block) }
  wUiPrefs.applyUiPrefs({}) // 幂等（同载荷零净变）
  wUiPrefs.applyUiPrefs() // 无参（缺省同判）
  assert.deepEqual({ follow: ctx._autoFollow, height: ctx.activityEl.style.maxHeight, tail: tailCountOf(block) }, snap, "二轮 ∥ 无参 ⇒ 零净变")
  console.log(`[读数] T-875c-2: ${JSON.stringify(snap)}（幂等复读同值）`)
})

test("T-875c-3（坏值 ⇒ 缺省）非布 ∥ 非正数 ∥ 非整数 ⇒ true ∥ 32vh ∥ 3", () => {
  wUiPrefs.applyUiPrefs({ autoFollow: "nope", activityMaxHeight: -3, activityTailLines: 2.5 })
  assert.equal(ctx._autoFollow, true, "坏值 ⇒ 缺省 true")
  assert.equal(ctx.activityEl.style.maxHeight, "32vh", "坏值 ⇒ 缺省 32vh")
  const block = mkFoldedBlock(["r1", "r2", "r3", "r4"])
  assert.equal(tailCountOf(block), 3, "坏值 ⇒ 缺省 3 行")
  console.log(`[读数] T-875c-3: true ∥ 32vh ∥ tail=${tailCountOf(block)}`)
})

test("T-875c-4（tailLines=0）经 `uiPrefs` ⇒ 零预览；核缝直测 0 ∥ 4 ∥ 坏值回缺省", () => {
  wUiPrefs.applyUiPrefs({ activityTailLines: 0 })
  const block = mkFoldedBlock(["r1", "r2", "r3", "r4"])
  assert.equal(block.querySelector(".sub-tail"), null, "0 ⇒ 零预览节点")
  assert.equal(tailCountOf(block), 0, "0 ⇒ 零行")
  wActivityView.configureActivityView({ tailLines: 0 }) // 核缝直测
  const b0 = mkFoldedBlock(["r1", "r2", "r3"])
  assert.equal(tailCountOf(b0), 0, "核缝 0 ⇒ 零预览")
  wActivityView.configureActivityView({ tailLines: 4 })
  const b4 = mkFoldedBlock(["r1", "r2", "r3", "r4", "r5"])
  assert.equal(tailCountOf(b4), 4, "核缝 4 ⇒ 预览 4 行")
  wActivityView.configureActivityView({ tailLines: -1 }) // 坏值
  const bBad = mkFoldedBlock(["r1", "r2", "r3", "r4", "r5"])
  assert.equal(tailCountOf(bBad), 3, "核缝坏值 ⇒ 回缺省 3")
  wActivityView.configureActivityView({}) // 缺键
  assert.equal(tailCountOf(mkFoldedBlock(["r1", "r2", "r3", "r4"])), 3, "核缝缺键 ⇒ 回缺省 3")
  console.log("[读数] T-875c-4: uiPrefs 0→0 · 缝 0→0 / 4→4 / -1→3 / {}→3")
})

test("T-875c-5（装载烟测）核缝经 shim 再出口 = 核件本体；甲舱 `ui-prefs.js` 具名导入可解析", async () => {
  assert.equal(typeof wActivityView.configureActivityView, "function", "shim 再出口缝在盘")
  const coreSeam = (await mod("thincoder-render-core/subblocks/activity-view.mjs")).configureActivityView
  const junctionSeam = (await mod("thincoder-vscode/node_modules/@thincoder/render-core/subblocks/activity-view.mjs")).configureActivityView
  assert.equal(wActivityView.configureActivityView, coreSeam, "同名同模块（shim `export *` ≡ 核件）")
  assert.equal(junctionSeam, coreSeam, "junction 取件 = 同函数对象（单一实例）")
  assert.equal(typeof wUiPrefs.applyUiPrefs, "function", "整链装载（缝未落前 = ERR_MODULE_NOT_FOUND——整图不可装载）")
  console.log("[读数] T-875c-5: shim ≡ core ≡ junction（同函数对象）· ui-prefs 导入面可解析")
})
