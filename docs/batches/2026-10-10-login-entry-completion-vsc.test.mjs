/**
 * 2026-10-10-login-entry-completion-vsc.test.mjs — 批内件（登录面补全批 · VSC 面；随批档存档；
 * 直接跑：`node --test docs/batches/2026-10-10-login-entry-completion-vsc.test.mjs`）。
 *
 * 判据面（设计 = `docs/vsc/design/WEBVIEW.md` §4.11 ∥ §4.12；机制单源 = `docs/core/design/TEAM.md`
 * §2.5 ∥ §2.6）：
 *   W 腿（webview 真件 + happy-dom + 真 index.html 夹具）：
 *     W1 路由屏两卡（词面逐字 = zh.json 实件对拍）∥ 零预选（起手恒路由屏）；W2 同屏换取（团队）；
 *     W3 回退保真（server ∥ username 保留 ∧ 密码清）；W4 本地路既有表单等价（负控：preset 直发 ∥
 *     custom 交棒）；W5 团队提交上行逐字；W6 失败四句 ∥ 同名冲突 ∥ 板退场（providerStatus 闸）；
 *     W7 卡降（管理面：零控件 ∥ 读数 ∥ 未登录句）。W8 词面两语键集相等 ∥ 值改登记。
 *   E 腿（extension 真件 + vscode 模块桩 + 临时 config 缝 + 本地 HTTP 桩）：
 *     E1 item 三态文本 ∥ tooltip 含 host（不搬 URL 全串）∥ 命令字段；E2 命令流登录（三问序 ⇒
 *     核真链写盘 ⇒ 复读 + 推送）；E3 命令流退出（QuickPick ⇒ 清本地；吊销未达提示）；
 *     E4 起手活校验（invalid ⇒ 登录流；unreachable 不判失效）；E5 失败四句（401 ⇒ 逐字）；
 *     E6 注册面 + 转口四件 + 零新协议（机检）；E7 webview 成拍随动（`refreshTeamSurface` ⇒ verify 清——重登成新 token 新判）。
 *
 * 纪律：平 node · 零第三方新增（happy-dom = `thincoder-vscode/` 仓内既有 devDep，实读在盘）；
 * 零真网络（HTTP 桩 = 127.0.0.1 本地回环）；不碰真配置（`_setConfigPathForTest` 注临时档）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"

const ROOT = new URL("../../", import.meta.url)
const VSC = new URL("thincoder-vscode/", ROOT)
const read = (rel, base = ROOT) => readFileSync(new URL(rel, base), "utf8")
const ZH = JSON.parse(read("locales/zh.json", VSC))
const EN = JSON.parse(read("locales/en.json", VSC))

// ─── 装载面①：`vscode` 模块桩（node:module resolve 钩子——沿批内件既有先例）──────────────────
const _stubDir = mkdtempSync(join(tmpdir(), "x-login-vsc-"))
const _vsStub = join(_stubDir, "vscode-stub.mjs")
writeFileSync(_vsStub, [
  "const noop = () => {}",
  "export const __state = { items: [], inputs: [], quickPicks: [], warnings: [], errors: [] }",
  "export const window = {",
  "  createStatusBarItem: (alignment, priority) => {",
  "    const item = { alignment, priority, text: '', tooltip: undefined, backgroundColor: undefined, command: '', name: '', shown: false, disposed: false,",
  "      show() { this.shown = true }, hide() { this.shown = false }, dispose() { this.disposed = true } }",
  "    __state.items.push(item); return item",
  "  },",
  "  showInputBox: async () => __state.inputs.shift(),",
  "  showQuickPick: async () => __state.quickPicks.shift(),",
  "  showWarningMessage: async (m) => { __state.warnings.push(String(m)) },",
  "  showErrorMessage: async (m) => { __state.errors.push(String(m)) },",
  "  showInformationMessage: async () => undefined,",
  "  onDidChangeActiveTextEditor: () => ({ dispose() {} }),",
  "  registerWebviewViewProvider: noop,",
  "}",
  "export const StatusBarAlignment = { Left: 1, Right: 2 }",
  "export class ThemeColor { constructor(id) { this.id = id } }",
  "export const commands = { registerCommand: noop, executeCommand: async () => undefined }",
  "export const workspace = { workspaceFolders: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }), onDidChangeWorkspaceFolders: () => ({ dispose() {} }) }",
  "export const env = { language: 'zh' }",
  "export const Uri = { file: (p) => ({ fsPath: p }), parse: (s) => ({ toString: () => s }) }",
  "export class EventEmitter { constructor() { this.event = () => ({ dispose: noop }) } fire() {} dispose() {} }",
  "export default {}",
].join("\n"), "utf8")
const _vsHook = join(_stubDir, "resolve-hook.mjs")
writeFileSync(_vsHook, [
  "export async function resolve(specifier, context, next) {",
  "  if (specifier === \"vscode\") return { url: " + JSON.stringify(pathToFileURL(_vsStub).href) + ", shortCircuit: true }",
  "  return next(specifier, context)",
  "}",
].join("\n"), "utf8")
;(await import("node:module")).register(pathToFileURL(_vsHook).href)

// ─── 装载面②：happy-dom + 真 index.html 夹具（#welcome-panel 全件）──────────────────────────
// happy-dom 自带 fetch 带同源策略（本地回环桩被 CORS 拦）⇒ 先存 node 原生面，注册后即刻回切
// （W 腿零网络；E 腿真链打回环桩——需 node fetch）。
const _nodeFetch = globalThis.fetch
const _nodeAbortSignal = globalThis.AbortSignal
const { GlobalRegistrator } = await import(pathToFileURL(join(fileURLToPath(ROOT), "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {}
globalThis.fetch = _nodeFetch
globalThis.AbortSignal = _nodeAbortSignal
{
  const html = read("webview/index.html", VSC)
  const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"))
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, "") // 脚本件零载（模块面经 import 驱动）
}
const _posts = []
globalThis.acquireVsCodeApi = () => { const api = { postMessage: (m) => _posts.push(m), getState: () => ({}), setState() {} }; window._vscode = api; return api }

const wi18n = await import(new URL("webview/i18n.js", VSC).href)
wi18n.setStrings(ZH)
const _state = await import(new URL("webview/state.js", VSC).href)
const onboarding = await import(new URL("webview/onboarding.js", VSC).href)
const settingsTeam = await import(new URL("webview/settings-team.js", VSC).href)

const byId = (id) => document.getElementById(id)
const STATUS = { presets: [{ name: "p1", desc: "P1" }, { name: "p2", desc: "P2" }] }
/** 用例级复位：板隐 ⇒ 重出场（路由屏复位 + 密码清）。 */
const fresh = () => {
  _state.S._welcomeDismissed = false
  byId("welcome-panel").style.display = "none"
  onboarding.showWelcomePanel(STATUS)
}

// ═══ W1 路由屏两卡（词面逐字实件对拍 ∥ 零预选）═══════════════════════════════════════════════
test("W1 路由屏两卡：词面逐字（zh 实件）∥ 零预选（起手恒路由屏 ∥ 无选中态）∥ 跳过钮值改毕", () => {
  fresh()
  assert.equal(byId("welcome-panel").style.display, "flex", "板在场")
  assert.notEqual(byId("welcome-routes").style.display, "none", "路由屏在场")
  assert.equal(byId("welcome-swap").style.display, "none", "换取区退场（起手 = 路由屏——零预选 · 零自动前进）")
  assert.equal(byId("welcome-route-team-title").textContent, ZH["welcome.route.teamTitle"], "团队卡标题逐字")
  assert.equal(byId("welcome-route-team-desc").textContent, ZH["welcome.route.teamDesc"], "团队卡说明逐字")
  assert.equal(byId("welcome-route-team-btn").textContent, ZH["settings.team.login"], "团队卡行动钮（词 = settings.team.login）")
  assert.equal(byId("welcome-route-local-title").textContent, ZH["welcome.route.localTitle"], "本地卡标题逐字")
  assert.equal(byId("welcome-route-local-desc").textContent, ZH["welcome.route.localDesc"], "本地卡说明逐字")
  assert.equal(byId("welcome-route-local-btn").textContent, ZH["welcome.route.localAction"], "本地卡行动钮逐字")
  assert.equal(byId("welcome-skip-btn").textContent, ZH["welcome.skip"], "跳过钮 = welcome.skip（值改）")
  assert.equal(ZH["welcome.skip"], "以后再说", "值改登记（zh）")
  assert.equal(EN["welcome.skip"], "Later", "值改登记（en）")
  const cards = [...document.querySelectorAll("[data-route-card]")]
  assert.equal(cards.length, 2, "两卡并排（data-route-card ×2）")
  for (const c of cards) {
    assert.equal(c.getAttribute("aria-selected"), null, "零预选（无 aria-selected）")
    assert.equal(c.getAttribute("aria-pressed"), null, "零预选（无 aria-pressed）")
    assert.equal(c.classList.contains("active"), false, "零预选（无 active）")
  }
  assert.ok(byId("welcome-route-team-btn").getAttribute("data-route") === "team", "团队卡锚 data-route=team")
  assert.ok(byId("welcome-route-local-btn").getAttribute("data-route") === "local", "本地卡锚 data-route=local")
})

// ═══ W2 同屏换取（团队卡）═════════════════════════════════════════════════════════════════════
test("W2 同屏换取：点团队卡 ⇒ 换取区换团队表单（路由退场——同屏不叠层）", () => {
  fresh()
  byId("welcome-route-team-btn").click()
  assert.equal(byId("welcome-routes").style.display, "none", "路由屏退场")
  assert.notEqual(byId("welcome-swap").style.display, "none", "换取区在场")
  assert.notEqual(byId("welcome-team-form").style.display, "none", "团队表单在场")
  assert.equal(byId("welcome-local-form").style.display, "none", "本地表单退场")
  assert.equal(byId("welcome-panel").style.display, "flex", "同屏（板未换层）")
  assert.equal(byId("welcome-team-server-label").textContent, ZH["settings.team.server"], "字段词 server")
  assert.equal(byId("welcome-team-username-label").textContent, ZH["settings.team.username"], "字段词 username")
  assert.equal(byId("welcome-team-password-label").textContent, ZH["settings.team.password"], "字段词 password")
  assert.equal(byId("welcome-team-login-btn").textContent, ZH["settings.team.login"], "登录钮词")
  assert.equal(byId("welcome-team-back").textContent, ZH["welcome.backToRoute"], "回退钮逐字")
  assert.equal(byId("welcome-team-password").type, "password", "密码面 type=password")
})

// ═══ W3 回退保真（已填保留 ∥ 密码清）══════════════════════════════════════════════════════════
test("W3 回退：「← 换一种方式」⇒ 路由屏 ∧ 已填 server/username 保留 ∧ 密码清", () => {
  fresh()
  byId("welcome-route-team-btn").click()
  byId("welcome-team-server").value = "http://team.example:8080"
  byId("welcome-team-username").value = "alice"
  byId("welcome-team-password").value = "secret-1"
  byId("welcome-team-back").click()
  assert.notEqual(byId("welcome-routes").style.display, "none", "路由屏在场")
  assert.equal(byId("welcome-swap").style.display, "none", "换取区退场")
  assert.equal(byId("welcome-team-server").value, "http://team.example:8080", "server 保留")
  assert.equal(byId("welcome-team-username").value, "alice", "username 保留")
  assert.equal(byId("welcome-team-password").value, "", "密码恒清（回退）")
  byId("welcome-route-team-btn").click()
  assert.equal(byId("welcome-team-server").value, "http://team.example:8080", "二次入场已填保留")
  assert.equal(byId("welcome-team-password").value, "", "二次入场密码清")
})

// ═══ W4 本地路：既有表单等价（负控）═══════════════════════════════════════════════════════════
test("W4 本地路：点本地卡 ⇒ 既有表单（preset 原位直发 ∥ custom 交棒逐字——零重构负控）", () => {
  let opened = 0
  const dialogCalls = []
  window._openAddProviderDialog = (opts) => dialogCalls.push(opts)
  onboarding.initOnboarding({ openSettings: () => { opened += 1 } })
  _posts.length = 0
  fresh()
  byId("welcome-route-local-btn").click()
  assert.equal(byId("welcome-routes").style.display, "none", "路由屏退场")
  assert.notEqual(byId("welcome-local-form").style.display, "none", "本地表单在场")
  assert.equal(byId("welcome-team-form").style.display, "none", "团队表单退场")
  // preset 径（逐字等价）
  byId("welcome-provider").value = "p1"
  byId("welcome-key").value = "  sk-p1  "
  byId("welcome-save-btn").click()
  assert.deepEqual(_posts, [{ type: "addProvider", preset: "p1", key: "sk-p1" }], "preset 径原位直发（逐字）")
  // custom 径（交棒：板退 + 设置面开 + 框携 trim 后键）
  _posts.length = 0
  fresh()
  byId("welcome-route-local-btn").click()
  byId("welcome-provider").value = "custom"
  byId("welcome-key").value = "  sk-welcome  "
  byId("welcome-save-btn").click()
  assert.equal(opened, 1, "custom 径 ⇒ openSettings 调 1")
  assert.deepEqual(dialogCalls, [{ key: "sk-welcome" }], "键随交棒预填（trim 后逐字）")
  assert.deepEqual(_posts, [], "custom 径零直发")
})

// ═══ W5 团队提交上行 ═════════════════════════════════════════════════════════════════════════
test("W5 团队提交：三字段上行（`teamLogin`——server/username trim ∥ 密码零加工）", () => {
  fresh()
  byId("welcome-route-team-btn").click()
  byId("welcome-team-server").value = "  http://team.example:8080  "
  byId("welcome-team-username").value = "  alice  "
  byId("welcome-team-password").value = " pw raw "
  _posts.length = 0
  byId("welcome-team-login-btn").click()
  assert.deepEqual(_posts, [{ type: "teamLogin", server: "http://team.example:8080", username: "alice", password: " pw raw " }], "上行逐字（密码原样）")
})

// ═══ W6 失败四句 ∥ 同名冲突 ∥ 板退场闸 ════════════════════════════════════════════════════════
test("W6 结果行：四句逐字（zh 实件）∥ 同名冲突逐字 ∥ providerStatus 闸 ⇒ 板退场", () => {
  fresh()
  byId("welcome-route-team-btn").click()
  const rows = [
    ["network", ZH["settings.team.fail.network"]],
    ["credentials", ZH["settings.team.fail.credentials"]],
    ["rate_limited", ZH["settings.team.fail.rateLimited"]],
    ["write_failed", ZH["settings.team.fail.writeFailed"]],
  ]
  for (const [reason, word] of rows) {
    onboarding.onWelcomeTeamLoginResult({ ok: false, reason })
    assert.equal(byId("welcome-team-fail").textContent, word, `失败句逐字（${reason}）`)
    assert.notEqual(byId("welcome-team-fail").style.display, "none", "失败行在场（停留可重试）")
  }
  onboarding.onWelcomeTeamLoginResult({ ok: true, notice: "manual-name-conflict" })
  assert.equal(byId("welcome-team-fail").textContent, ZH["settings.team.notice.manualNameConflict"], "同名冲突句逐字")
  onboarding.onWelcomeTeamLoginResult({ ok: true })
  assert.equal(byId("welcome-team-fail").style.display, "none", "成且无 notice ⇒ 行清")
  // 板退场闸（providerStatus：keyOk 真 ⇒ hide——登录成即时退场链）
  byId("welcome-team-password").value = "secret-1"
  onboarding.maybeShowWelcome(STATUS, true)
  assert.equal(byId("welcome-panel").style.display, "none", "keyOk 真 ⇒ 板退场")
  fresh()
  assert.equal(byId("welcome-team-password").value, "", "重出场密码清（不随生命周期存续）")
  assert.notEqual(byId("welcome-routes").style.display, "none", "重出场 = 路由屏")
})

// ═══ W7 卡降（管理面）═══════════════════════════════════════════════════════════════════════
test("W7 卡降：团队卡 = 管理面（读数三行 ∥ 未登录句；零登/退控件）", () => {
  settingsTeam.updateTeamStatus({ loggedIn: true, server: "http://team.example:8080", member: { username: "alice", name: "Alice" }, label: "VSC@host" })
  const html = settingsTeam.teamCardHtml()
  assert.ok(html.includes("http://team.example:8080"), "读数 server")
  assert.ok(html.includes("Alice"), "读数 member（name 优先）")
  assert.ok(html.includes("VSC@host"), "读数端标签")
  assert.ok(html.includes(ZH["settings.team.server"]) && html.includes(ZH["settings.team.memberLabel"]) && html.includes(ZH["settings.team.labelLabel"]), "读数词面（server ∥ 成员 ∥ 端标签）")
  assert.ok(!html.includes("team-login-btn") && !html.includes("team-logout-btn"), "零登/退控件（卡内）")
  assert.ok(!html.includes("<input") && !html.includes("<select"), "零表单件（管理面）")
  settingsTeam.updateTeamStatus({ loggedIn: false, server: null, member: null, label: null })
  const html2 = settingsTeam.teamCardHtml()
  assert.ok(html2.includes(ZH["settings.team.notLoggedIn"]), "未登录句保留")
  // 成员名同序（`member.name ?? username`——name 缺位 ⇒ username）
  settingsTeam.updateTeamStatus({ loggedIn: true, server: "http://t", member: { username: "bob" }, label: "L" })
  assert.ok(settingsTeam.teamCardHtml().includes("bob"), "name 缺位 ⇒ username")
  // 源面：卡档零上行发送 ∥ settings.js 零绑定调用
  const card = read("webview/settings-team.js", VSC)
  assert.ok(!card.includes('type: "teamLogin"') && !card.includes('type: "teamLogout"'), "卡档零上行（登/退面 = 首启板 ∥ 命令流）")
  const settingsSrc = read("webview/settings.js", VSC)
  assert.ok(!settingsSrc.includes("bindTeamControls"), "settings.js 零 bindTeamControls 调用（卡无控件可绑）")
})

// ═══ W8 词面两语键集 ∥ 新键在位 ═══════════════════════════════════════════════════════════════
test("W8 词面：两语键集相等 ∥ 本批新键两语在位 ∥ 状态段词宿主单一", () => {
  assert.deepEqual(Object.keys(EN).sort(), Object.keys(ZH).sort(), "两语键集相等")
  for (const k of ["welcome.route.teamTitle", "welcome.route.teamDesc", "welcome.route.localTitle", "welcome.route.localDesc", "welcome.route.localAction", "welcome.backToRoute", "settings.team.memberLabel", "settings.team.labelLabel", "status.team.entry"]) {
    assert.ok(k in ZH && k in EN, `${k} 两语在位`)
  }
  assert.ok(!("status.team.invalid" in ZH), "已失效词走核投影（宿主零副本）")
  assert.ok(!("settings.team.status" in ZH) && !("settings.team.status" in EN), "死键净删（卡内状态行退场——零消费点随实现）")
})

// ═══ E 腿：extension（vscode 桩 + 临时 config 缝 + 本地 HTTP 桩）══════════════════════════════
const stub = await import(pathToFileURL(_vsStub).href)
const cfgDir = mkdtempSync(join(tmpdir(), "x-login-vsc-cfg-"))
const cfgPath = join(cfgDir, "config.json")
const { _setConfigPathForTest } = await import(new URL("node_modules/@thincoder/core/config-io.mjs", VSC).href)
_setConfigPathForTest(cfgPath)
const { initLocale, t } = await import(new URL("src/i18n.mjs", VSC).href)
initLocale("zh")
const coreI18n = await import(new URL("node_modules/@thincoder/core/i18n.mjs", VSC).href)
const teamSurface = await import(new URL("src/extension/team-surface.mjs", VSC).href)

/** HTTP 桩（127.0.0.1 本地回环——端口随机）：三端点各自 mode（`me` ∈ 200∖401∖500 ∥ `login` ∈ 200∖401∖429 ∥ `logout` ∈ 200∖500）。 */
const http = { me: 200, login: 200, logout: 200, hits: [] }
const server = createServer((req, res) => {
  http.hits.push(`${req.method} ${req.url}`)
  const send = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)) }
  if (req.url === "/api/client/login" && req.method === "POST") {
    if (http.login === 401) return send(401, { error: "bad credentials" })
    if (http.login === 429) return send(429, { error: "slow down" })
    return send(200, { token: "tok-login", member: { username: "alice", name: "Alice" } })
  }
  if (req.url === "/api/client/logout") {
    if (http.logout === 500) return send(500, { error: "boom" })
    return send(200, { ok: true })
  }
  if (req.url === "/api/client/me") {
    if (http.me === 401) return send(401, { error: "revoked" })
    if (http.me === 500) return send(500, { error: "boom" })
    return send(200, { username: "alice" })
  }
  send(404, { error: "not found" })
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const BASE = `http://127.0.0.1:${server.address().port}`
after(() => { server.close(); rmSync(cfgDir, { recursive: true, force: true }); rmSync(_stubDir, { recursive: true, force: true }) })

const teamConfig = (token) => JSON.stringify({
  team: token === null ? { server: BASE, member: null, label: null } : { server: BASE, member: { username: "alice", name: "Alice" }, label: "VSC@host", token },
  providers: token === null ? [] : [{ name: "team", baseURL: `${BASE}/v1`, apiKey: token, derived: true }],
})
const writeCfg = (text) => writeFileSync(cfgPath, text, "utf8")
const readCfg = () => JSON.parse(readFileSync(cfgPath, "utf8"))
const _pushes = []
const fakePanel = { _panel: { webview: { postMessage: (m) => _pushes.push(m) } }, _pushStatus: () => _pushes.push({ type: "providerStatus" }) }
const item = () => stub.__state.items[0]
/** 桩队列清空（每腿起手自守——跨腿零残留）。 */
const drainQueues = () => { stub.__state.quickPicks.length = 0; stub.__state.inputs.length = 0 }

test("E1 item 三态：未登录入口 ∥ 已登录成员名（name 优先）∥ 已失效句 + warning 底；tooltip = host + 端标签", async () => {
  // ① 未登录
  writeCfg("{}")
  await teamSurface.initTeamSurface(fakePanel)
  assert.equal(stub.__state.items.length, 1, "item 单例（恰一）")
  assert.equal(item().text, ZH["status.team.entry"], "未登录 ⇒ 入口词逐字")
  assert.equal(item().command, "thincoder.team", "命令 = thincoder.team（点击即流）")
  assert.equal(item().alignment, stub.StatusBarAlignment.Right, "Right 面")
  assert.equal(item().priority, 98, "优先级 98（台账 99 邻位）")
  assert.equal(item().shown, true, "常显（未登录态亦在场）")
  // ② 已登录（启动触发点①：活校验 200 ⇒ 成员名）
  http.me = 200
  writeCfg(teamConfig("tok-1"))
  await teamSurface.initTeamSurface(fakePanel)
  assert.equal(item().text, "Alice", "已登录 ⇒ 成员名（member.name 优先）")
  assert.ok(String(item().tooltip).includes(`127.0.0.1:${server.address().port}`), "tooltip 含 host")
  assert.ok(!String(item().tooltip).includes("http://"), "tooltip 不搬 URL 全串")
  assert.ok(String(item().tooltip).includes("VSC@host"), "tooltip 含端标签")
  assert.equal(item().backgroundColor, undefined, "已登录 ⇒ 零警示底")
  // ③ 已失效（401 ⇒ invalid：警示句 + warning 底）
  http.me = 401
  await teamSurface.initTeamSurface(fakePanel)
  const invalidWord = coreI18n.CORE_MESSAGES["status.team.invalid"].zh
  assert.equal(item().text, invalidWord, "已失效句 = 核字典键逐字")
  assert.ok(!("status.team.invalid" in ZH), "已失效词走核投影（宿主零副本）")
  assert.equal(item().backgroundColor?.id, "statusBarItem.warningBackground", "警示底（warning 族）")
  assert.equal(stub.__state.errors.length, 0, "死证/校验面零误报错")
})

test("E2 命令流（登录）：起手活校验 ⇒ 三问（预填留存值）⇒ 核真链写盘 ⇒ 复读 + 双推送", async () => {
  http.login = 200
  writeCfg("{}")
  http.hits.length = 0
  _pushes.length = 0
  drainQueues()
  stub.__state.inputs.push(BASE, "alice", "pw-1")
  stub.__state.quickPicks.push("SHOULD-NOT-BE-CONSUMED")
  await teamSurface.runTeamCommand()
  assert.deepEqual(http.hits.filter((h) => h.includes("/api/client/login")), ["POST /api/client/login"], "核链真打 login（零自写盘）")
  assert.equal(stub.__state.quickPicks.length, 1, "未登录 ⇒ 不进退出流（QuickPick 未消费）")
  const cfg = readCfg()
  assert.equal(cfg.team.token, "tok-login", "写盘：token 落 team 段")
  assert.equal(cfg.team.server, BASE, "写盘：server 归一")
  const derived = cfg.providers.find((p) => p.name === "team")
  assert.equal(derived?.apiKey, "tok-login", "写盘：派生条目 apiKey = token（同盘读）")
  assert.equal(item().text, "Alice", "成 ⇒ 复读 + 刷新 item")
  assert.ok(_pushes.some((m) => m.type === "teamStatus" && m.loggedIn === true), "推 teamStatus（设置面板随动）")
  assert.ok(_pushes.some((m) => m.type === "providerStatus"), "推 providerStatus")
  assert.equal(stub.__state.errors.length, 0, "零错误面")
})

test("E3 命令流（退出）：QuickPick「退出登录」⇒ 清本地；吊销未达 ⇒ 逐字提示", async () => {
  writeCfg(teamConfig("tok-1"))
  http.me = 200
  http.logout = 200
  http.hits.length = 0
  drainQueues()
  _pushes.length = 0
  stub.__state.quickPicks.push(ZH["settings.team.logout"])
  await teamSurface.runTeamCommand()
  assert.ok(http.hits.includes("POST /api/client/logout"), "核链真打 logout（吊销 best-effort）")
  assert.equal(readCfg().team.token, undefined, "本地 token 已清")
  assert.equal(item().text, ZH["status.team.entry"], "退出 ⇒ item 回入口")
  assert.ok(_pushes.some((m) => m.type === "teamStatus" && m.loggedIn === false), "推 teamStatus（退出成拍）")
  // 吊销未达（500 ⇒ revokeDelivered false）
  writeCfg(teamConfig("tok-2"))
  http.logout = 500
  drainQueues()
  stub.__state.quickPicks.push(ZH["settings.team.logout"])
  await teamSurface.runTeamCommand()
  assert.equal(readCfg().team.token, undefined, "网络失败照清本地")
  assert.ok(stub.__state.warnings.includes(ZH["settings.team.notice.revokeUndelivered"]), "吊销未达句逐字（一次性）")
  // QuickPick 取消 ⇒ 零动作
  writeCfg(teamConfig("tok-3"))
  http.logout = 200
  drainQueues()
  stub.__state.quickPicks.push(undefined)
  await teamSurface.runTeamCommand()
  assert.equal(readCfg().team.token, "tok-3", "取消 ⇒ 零写盘")
})

test("E4 起手活校验：invalid ⇒ 登录流（非退出流）；unreachable 不判失效（离线容忍）", async () => {
  // 已失效（401）⇒ 起手校验后进登录流
  writeCfg(teamConfig("tok-dead"))
  http.me = 401
  http.login = 200
  drainQueues()
  stub.__state.inputs.push(BASE, "alice", "pw-2")
  stub.__state.quickPicks.push("SHOULD-NOT-BE-CONSUMED")
  await teamSurface.runTeamCommand()
  assert.equal(stub.__state.quickPicks.length, 1, "已失效 ⇒ 不进退出流（QuickPick 未消费）")
  assert.equal(stub.__state.inputs.length, 0, "登录三问已消费（重新登录面）")
  assert.equal(item().text, "Alice", "重登成 ⇒ item 恢复（verify 清）")
  // unreachable（/me 500）⇒ 不判失效 ⇒ 退出流
  http.me = 500
  writeCfg(teamConfig("tok-9"))
  drainQueues()
  stub.__state.quickPicks.push(undefined) // 取消退出流（零写盘）
  await teamSurface.runTeamCommand()
  assert.equal(stub.__state.inputs.length, 0, "unreachable ⇒ 不进登录流（离线容忍）")
  assert.notEqual(item().text, ZH["status.team.invalid"], "unreachable 不判失效")
})

test("E5 失败面：401 ⇒ 「用户名或密码错误」逐字；429 ⇒ 「登录尝试过于频繁」逐字", async () => {
  writeCfg("{}")
  http.login = 401
  drainQueues()
  stub.__state.errors.length = 0
  stub.__state.inputs.push(BASE, "alice", "wrong")
  await teamSurface.runTeamCommand()
  assert.deepEqual(stub.__state.errors, [ZH["settings.team.fail.credentials"]], "401 ⇒ 凭据句逐字")
  http.login = 429
  stub.__state.inputs.push(BASE, "alice", "pw")
  await teamSurface.runTeamCommand()
  assert.equal(stub.__state.errors.at(-1), ZH["settings.team.fail.rateLimited"], "429 ⇒ 限流句逐字")
  assert.equal(readCfg().team, undefined, "败 ⇒ 零写盘")
})

test("E6 注册面 + 转口四件 + 零新协议（机检）", () => {
  const ext = read("extension.mjs", VSC)
  assert.ok(ext.includes('vscode.commands.registerCommand("thincoder.team"'), "命令注册（包根 extension.mjs）")
  assert.ok(ext.includes("initTeamSurface(_panel)") && ext.includes("disposeTeamSurface()"), "item 初始化 ∥ 销毁接线")
  const pkg = JSON.parse(read("package.json", VSC))
  const cmds = pkg.contributes.commands.map((c) => c.command)
  assert.ok(cmds.includes("thincoder.team"), "contributes.commands +1")
  const relay = read("src/extension/team.mjs", VSC)
  for (const name of ["teamStatus", "teamVerify", "teamLogin", "teamLogout"]) {
    assert.ok(relay.includes(`${name} as core`), `转口四件（${name}）`)
  }
  const surface = read("src/extension/team-surface.mjs", VSC)
  assert.ok(surface.includes('from "./team.mjs"'), "surface 经转口取核（与桌面同拍）")
  assert.ok(!surface.includes("fetch(") && !surface.includes("/api/"), "零新协议：surface 零端点 ∥ 零直呼网络")
  // webview 上行只在既有消息集内
  const onboardingSrc = read("webview/onboarding.js", VSC)
  const sent = [...onboardingSrc.matchAll(/type: "([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual([...new Set(sent)].sort(), ["addProvider", "teamLogin"], "webview 上行类型 ⊆ 既有集（零新消息）")
  // 消费位：teamLoginResult 双消费（卡 ∥ 板面钩）
  const chat = read("webview/chat-messages.js", VSC)
  assert.ok(chat.includes('case "teamLoginResult": onTeamLoginResult(m); onWelcomeTeamLoginResult(m); break'), "回执双消费位 +板面钩")
})

// ═══ E7 webview 成拍随动（verify 清位第二出口）════════════════════════════════════════════════
test("E7 webview 成拍随动：`refreshTeamSurface()` ⇒ verify 清（重登成 = 新 token 新判——TEAM.md §2.6）", async () => {
  http.me = 401
  writeCfg(teamConfig("tok-dead2"))
  await teamSurface.initTeamSurface(fakePanel)
  assert.equal(item().text, coreI18n.CORE_MESSAGES["status.team.invalid"].zh, "起手：已失效态（verify=invalid）")
  assert.equal(item().backgroundColor?.id, "statusBarItem.warningBackground", "起手：警示底")
  http.me = 200
  writeCfg(teamConfig("tok-fresh")) // webview 径重登成拍（panel-messages-settings 仅调 refreshTeamSurface）
  teamSurface.refreshTeamSurface()
  assert.equal(item().text, "Alice", "重登成 ⇒ item 复归成员名（非「已失效」）")
  assert.equal(item().backgroundColor, undefined, "警示底同清")
})
