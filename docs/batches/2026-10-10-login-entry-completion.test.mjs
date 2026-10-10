/**
 * 2026-10-10-login-entry-completion.test.mjs — 批内单测件（登录面补全批 · **core + 桌面两面** · 名随批档 ·
 * 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-login-entry-completion.test.mjs`
 *
 * 射程（判据源 = 批档 §2 · `docs/desktop/design/UI.md` §1 表行 16 ∥ 本批注 ∥ §4.2 表 · `docs/desktop/design/SETTINGS.md`
 * §2.6 ∥ §2.22 ∥ §3.2 · `docs/desktop/design/IPC.md` §2 团队族行 · `docs/core/design/TEAM.md` §2.5 ∥ §2.6）：
 *   K1 核活校验 `teamVerify`：200 ⇒ `valid` ∥ 401 ⇒ `invalid` ∥ 不可达 ∥ 无 token ⇒ `unreachable`（零请求）；
 *      **只读**（配置逐字不变）
 *   K2 核字典键 `status.team.invalid`（两语逐字；图形端经投影直取 —— 零端侧副本）
 *   D1 通道四件：`CHANNELS` 五十二（末位 = `team:verify`）∥ `HANDLERS` 闭集 ∥ 转口四件（未登录 ⇒ `{ok:false}` 零调核 ∥
 *      桩服务 200 ⇒ `{ok:true,state:"valid"}`）
 *   D2 段 16 团队登录态三态（入口词 ∥ 成员名 + 悬停 = host ∥ 已失效 + warn）∥ **零会话例外**（无活动会话亦在场）∥
 *      序 = `title` 后 `enter` 前 ∥ 闭集 18 码
 *   D3 段体三面：未登录 = 表单（三字段 + 登录钮 + 提示行）∥ 已失效 = 失效行 + 重登面（提示行退场）∥ 已登录 = 三读数 +
 *      退出钮；管理面段体 = 详情三行（**零登/退控件**）；hub re-export ∥ 段分派改 `teamAdminBody`
 *   D4 装配面：启动读口（`team.refresh`）∥ 面板开合（段点 ⇒ `div.team-pop` 建件 + 就地读 `team:status` + `team:verify`）∥
 *      关三路（段再点 ∥ Esc（捕获相 —— 面板在场仅关面板）∥ 面板外点击）∥ 写路复读两调用点 ∥ 退出 ⇒ `verify` 清
 *   D5 首启两路：路由屏两卡（零预选）+ 「以后再说」∥ 团队卡 ⇒ 团队表单（三字段复用 —— 密码不申报）∥ 回退 ⇒ 路由屏 ∥
 *      本地卡 ⇒ 步 1 ∥ 团队提交成 / 败两径 + 空表单门 ∥ 步闭集（初值 `"route"`；表外回落）
 * 平 node 直测（假 DOM / 假 FormData / 桩窄桥 / 桩 HTTP 服务；不碰真配置——`_setConfigPathForTest` 注临时档）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { createRequire } from "node:module"
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = realpathSync([join(HERE, "..", ".."), join(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-desktop"))))
const at = (rel) => pathToFileURL(join(ROOT, rel)).href
/** 桌面主面**同实例**取件（B1 桌面件 D 腿同注）：`@thincoder/core` 经 `thincoder-desktop/node_modules` 链解析。
 *  Windows 盘符大小写不一（`file:///d:/…`（`import.meta.url` 来）∥ 实径 `D:\…`）会让同一文件经不同 URL 取件
 *  ⇒ **两实例**（`_setConfigPathForTest` 缝只对同实例生效 —— 否则静默读真配置）。主面相关腿一律经本函数取件。 */
const desktopCore = (rel) => new URL(`node_modules/@thincoder/core/${rel}`, pathToFileURL(join(ROOT, "thincoder-desktop") + "/")).href
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const require = createRequire(import.meta.url)

await import(at("thincoder-desktop/test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于渲染档取件注册）

// 核件取两径（各自同实例）：**仓根径**（K1 —— 与 `CORE_TEAM` 同实例）∥ **桌面径**（D1 —— 与桌面主面同实例，见档头）。
const coreConfig = await import(at("thincoder-core/config-io.mjs"))
const CORE_TEAM = await import(at("thincoder-core/team.mjs"))
const CORE_I18N = await import(at("thincoder-core/i18n.mjs"))
const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
i18n.initDict({ locale: "zh", dict: CORE_I18N.projectDictionary("zh") })
const SL = await import(at("thincoder-desktop/renderer/views/statusline.mjs"))
const TEAM_SECTIONS = await import(at("thincoder-desktop/renderer/views/settings-sections-team.mjs"))
const SETTINGS_VIEW = await import(at("thincoder-desktop/renderer/views/settings.mjs"))
const ONBOARDING = await import(at("thincoder-desktop/renderer/views/onboarding.mjs"))
const STORE = await import(at("thincoder-desktop/renderer/store.mjs"))

/** 深搜 / 全收 / 按属性取（树面小工具 —— null 容错）。 */
const findDeep = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) { for (const item of node) { const hit = findDeep(item, pred); if (hit !== null) return hit } return null }
  if (pred(node)) return node
  return findDeep(node.children ?? null, pred)
}
const collectDeep = (node, pred, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) collectDeep(item, pred, out); return out }
  if (pred(node)) out.push(node)
  collectDeep(node.children ?? null, pred, out)
  return out
}

/** 树面文字全收（词组面断言用 —— 串叶子按文档序）。 */
const collectText = (node, out = []) => {
  if (typeof node === "string") { out.push(node); return out }
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) collectText(item, out); return out }
  collectText(node.children ?? null, out)
  return out
}

/** 桩 HTTP 服务（核 `teamVerify` 三值判据面；逐路径按 mode 应答）。 */
async function startStub() {
  const state = { mode: "valid", hits: [] }
  const server = createServer((req, res) => {
    state.hits.push(`${req.method} ${req.url}`)
    if (state.mode === "valid") { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ member: { username: "u" } })) } else {
      res.writeHead(401, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "unauthorized" }))
    }
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  return { state, base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r) }) }
}

// ─── K · 核面 ──────────────────────────────────────────────────────────────────────────────

test("K1 核活校验：200 ⇒ valid ∥ 401 ⇒ invalid ∥ 不可达 ∥ 无 token ⇒ unreachable（零请求）∥ 只读（配置逐字不变）", async () => {
  const stub = await startStub()
  const dir = mkdtempSync(join(tmpdir(), "lec-verify-"))
  const cfg = join(dir, "config.json")
  const write = (team) => writeFileSync(cfg, JSON.stringify({ team, providers: [] }, null, 2))
  coreConfig._setConfigPathForTest(cfg)
  try {
    write({ server: stub.base, member: { username: "u", name: "U" }, label: "desk@host", token: "tok-1" })
    const before = readFileSync(cfg, "utf8")
    assert.deepEqual(await CORE_TEAM.teamVerify(), { state: "valid" }, "200 ⇒ valid")
    assert.equal(stub.state.hits.length, 1, "恰一次请求")
    assert.equal(stub.state.hits[0], "GET /api/client/me", "端点 = /api/client/me")
    assert.equal(readFileSync(cfg, "utf8"), before, "只读：配置逐字不变（零写盘）")
    stub.state.mode = "invalid"
    assert.deepEqual(await CORE_TEAM.teamVerify(), { state: "invalid" }, "401 ⇒ invalid")
    const unreachable = { ...{}, server: "http://127.0.0.1:1", member: null, label: null, token: "tok-1" }
    write(unreachable)
    assert.deepEqual(await CORE_TEAM.teamVerify(), { state: "unreachable" }, "网络不可达 ⇒ unreachable（不判失效）")
    write({ server: stub.base, member: { username: "u" }, label: "x", token: null })
    const hits = stub.state.hits.length
    assert.deepEqual(await CORE_TEAM.teamVerify(), { state: "unreachable" }, "无 token ⇒ unreachable")
    assert.equal(stub.state.hits.length, hits, "无 token ⇒ 零请求（无从校验）")
  } finally {
    coreConfig._resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
    await stub.close()
  }
})

test("K2 核字典键 `status.team.invalid`：两语逐字 ∥ 图形端经投影直取（零端侧副本）", () => {
  const entry = CORE_I18N.CORE_MESSAGES["status.team.invalid"]
  assert.equal(entry.zh, "已失效——重新登录", "zh 逐字")
  assert.equal(entry.en, "Session expired — log in again", "en 逐字")
  const zh = CORE_I18N.projectDictionary("zh")
  assert.equal(zh["status.team.invalid"], "已失效——重新登录", "投影在场（`t()` 第二优先级）")
  assert.equal(i18n.t("status.team.invalid"), "已失效——重新登录", "桌面 `t()` 直取（零副本）")
  assert.equal(i18n.t("status.team.entry"), "登录团队服务器", "宿主键 = 入口词")
  assert.equal(Object.hasOwn(i18n.HOST_DICT.zh, "status.team.invalid"), false, "已失效词零端侧副本")
})

// ─── D1 · 通道四件 ──────────────────────────────────────────────────────────────────────────

test("D1 通道四件：`CHANNELS` 五十二（末位 `team:verify`）∥ `HANDLERS` 闭集 ∥ 转口四件（未登录零调核 ∥ 桩 200 ⇒ valid）", async () => {
  const preload = require(join(ROOT, "thincoder-desktop/src/preload/preload.cjs"))
  assert.equal(preload.CHANNELS.length, 52, "白名单 52 项")
  assert.equal(new Set(preload.CHANNELS).size, 52, "零重复项")
  assert.deepEqual(preload.CHANNELS.slice(-4), ["team:status", "team:login", "team:logout", "team:verify"], "末位四 = 团队族（49–52）")
  const registry = read("thincoder-desktop/src/main/ipc-registry.mjs")
  const rows = [...(registry.match(/const HANDLERS = Object\.freeze\(\{[\s\S]*?\n\}\)/) ?? [""])[0].matchAll(/"([^"]+)":/g)].map((m) => m[1])
  assert.equal(rows.length, 52, "HANDLERS 52 行")
  assert.equal(rows.at(-1), "team:verify", "表尾 = 新通道")
  assert.deepEqual([...rows].sort(), [...preload.CHANNELS].sort(), "行集 = 白名单集（闭合）")
  assert.ok(read("thincoder-desktop/src/main/team.mjs").includes('import { teamLogin, teamLogout, teamStatus, teamVerify } from "@thincoder/core/team.mjs"'), "转口四件同源 import")
  const stub = await startStub()
  const relayCore = await import(desktopCore("config-io.mjs")) // 主面同实例（见档头 `desktopCore` 注）
  const dir = mkdtempSync(join(tmpdir(), "lec-relay-"))
  const cfg = join(dir, "config.json")
  relayCore._setConfigPathForTest(cfg)
  try {
    const relay = await import(at("thincoder-desktop/src/main/team.mjs"))
    writeFileSync(cfg, JSON.stringify({ providers: [] }, null, 2))
    assert.deepEqual(await relay.teamVerifyChannel(), { ok: false }, "未登录 ⇒ {ok:false}")
    assert.equal(stub.state.hits.length, 0, "未登录 ⇒ 零调核（零请求）")
    writeFileSync(cfg, JSON.stringify({ team: { server: stub.base, member: { username: "u" }, label: "x", token: "tok" }, providers: [] }, null, 2))
    assert.deepEqual(await relay.teamVerifyChannel(), { ok: true, state: "valid" }, "成 ⇒ 三值直传")
    stub.state.mode = "invalid"
    assert.deepEqual(await relay.teamVerifyChannel(), { ok: true, state: "invalid" }, "401 ⇒ invalid 直传")
  } finally {
    relayCore._resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
    await stub.close()
  }
})

// ─── D2 · 段 16 团队登录态 ──────────────────────────────────────────────────────────────────

test("D2 段三态 + 零会话例外 + 序 + 闭集 18", () => {
  assert.equal(SL.STATUS_SEGMENTS.length, 18, "承载 18 码")
  assert.deepEqual(SL.STATUS_SEGMENTS.slice(-3), ["title", "team", "enter"], "序 = `title` 后 `enter` 前")
  const seg = (team, extra = {}) => SL.statusModel({ activeSession: null, team, ...extra }).segments.filter((s) => s.code === "team")
  const out = seg({ loggedIn: false })
  assert.equal(out.length, 1, "未登录 ⇒ 入口段在场（零会话例外面）")
  assert.equal(out[0].parts[0].text, "登录团队服务器", "入口词逐字")
  assert.equal(out[0].warn, undefined, "未登录非警示")
  assert.equal(out[0].attrs, undefined, "未登录零悬停")
  const member = seg({ loggedIn: true, verify: "valid", server: "https://t.example/v1", member: { username: "u", name: "U" } })
  assert.equal(member[0].parts[0].text, "U", "成员名 = name 优先")
  assert.equal(member[0].attrs.title, "t.example", "悬停 = host 形（不搬 URL 全串）")
  const fallback = seg({ loggedIn: true, verify: null, server: "https://t.example", member: { username: "u" } })
  assert.equal(fallback[0].parts[0].text, "u", "name 缺 ⇒ username")
  assert.equal(seg({ loggedIn: true, verify: "unreachable", server: "https://t.example", member: { username: "u" } })[0].parts[0].text, "u", "unreachable ⇒ 按已登录（离线容忍）")
  const invalid = seg({ loggedIn: true, verify: "invalid", server: "https://t.example", member: { username: "u", name: "U" } })
  assert.equal(invalid[0].parts[0].text, "已失效——重新登录", "已失效词（核字典直取）")
  assert.equal(invalid[0].warn, true, "已失效 ⇒ 警示色")
  assert.equal(seg({ loggedIn: true, verify: "valid", member: null })[0], undefined, "成员名不可读 ⇒ 零节点（禁假造）")
  // 有活动会话时：序在 title 与 enter 之间（全段序抽验）
  const full = SL.statusModel({
    activeSession: "s1",
    sessions: [{ slot: "s1", title: "会话" }],
    team: { loggedIn: true, verify: "valid", server: "https://t.example", member: { username: "u" } },
  }).segments.map((s) => s.code)
  assert.deepEqual(full.slice(-3), ["title", "team", "enter"], "活动会话面同序")
})

// ─── D3 · 段体三面 + 管理面 ─────────────────────────────────────────────────────────────────

test("D3 段体三面 + 管理面（零登/退控件）∥ hub re-export ∥ 段分派", () => {
  const handlers = { onTeamLogin: () => {}, onTeamLogout: () => {} }
  const loggedOut = TEAM_SECTIONS.teamBody({ state: "ready", loggedIn: false, server: "https://t.example", member: { username: "u" }, label: null, notice: null }, handlers)
  const form = findDeep(loggedOut, (n) => n?.props?.["data-form"] === "team")
  assert.ok(form !== null, "未登录 ⇒ 表单")
  assert.equal(form.props["data-draft-scope"], "team", "草稿作用域")
  const inputs = collectDeep(form, (n) => n?.tag === "input").map((n) => n.props)
  assert.deepEqual(inputs.map((p) => p.id), ["team-server", "team-username", "team-password"], "三字段序")
  assert.equal(inputs[0]["data-draft"], "", "地址携草稿标记")
  assert.equal(Object.hasOwn(inputs[2], "data-draft"), false, "密码恒不保真")
  assert.ok(findDeep(loggedOut, (n) => n?.props?.["data-team-hint"] !== undefined) !== null, "未登录提示行")
  assert.equal(findDeep(loggedOut, (n) => n?.props?.["data-action"] === "settings:teamLogout"), null, "未登录 ⇒ 零退出钮")

  const invalid = TEAM_SECTIONS.teamBody({ state: "ready", loggedIn: true, verify: "invalid", server: "https://t.example", member: { username: "u" }, label: null, notice: null }, handlers)
  assert.equal(findDeep(invalid, (n) => n?.props?.["data-team-invalid"] !== undefined)?.children[0], "已失效——重新登录", "已失效行逐字")
  assert.ok(findDeep(invalid, (n) => n?.props?.["data-form"] === "team") !== null, "已失效 ⇒ 重登面（表单在场）")
  assert.equal(findDeep(invalid, (n) => n?.props?.["data-team-hint"] !== undefined), null, "已失效 ⇒ 提示行退场（单一状态行）")
  assert.equal(findDeep(invalid, (n) => n?.props?.["data-action"] === "settings:teamLogout"), null, "已失效 ⇒ 零退出钮")

  const loggedIn = TEAM_SECTIONS.teamBody({ state: "ready", loggedIn: true, verify: "valid", server: "https://t.example", member: { username: "u", name: "U" }, label: "desk@host", notice: null }, handlers)
  assert.deepEqual(collectDeep(loggedIn, (n) => typeof n?.props?.["data-read"] === "string").map((n) => n.props["data-read"]), ["team-server", "team-member", "team-label"], "已登录三读数")
  assert.equal(typeof findDeep(loggedIn, (n) => n?.props?.["data-action"] === "settings:teamLogout")?.props?.onClick, "function", "退出钮活件")
  const notice = TEAM_SECTIONS.teamBody({ loggedIn: false, notice: { kind: "failure", reason: "network" } }, handlers)
  assert.equal(findDeep(notice, (n) => n?.props?.["data-team-notice"] !== undefined)?.children[0], "网络不可达", "失败四句之一（逐字）")

  const admin = TEAM_SECTIONS.teamAdminBody({ server: "https://t.example", member: { username: "u", name: "U" }, label: "desk@host" })
  assert.deepEqual(collectDeep(admin, (n) => typeof n?.props?.["data-read"] === "string").map((n) => n.props["data-read"]), ["team-server", "team-member", "team-label"], "管理面详情三行")
  assert.equal(collectDeep(admin, (n) => n?.tag === "button").length, 0, "管理面零按钮（登/退退场）")
  assert.equal(TEAM_SECTIONS.teamAdminBody({ server: null, member: null, label: null }).filter((n) => n !== null).length, 0, "三值皆缺 ⇒ 零节点")
  assert.ok(read("thincoder-desktop/renderer/views/settings-sections.mjs").includes('export { teamAdminBody } from "./settings-sections-team.mjs"'), "hub re-export = 管理面")
  assert.ok(read("thincoder-desktop/renderer/views/settings.mjs").includes('teamAdminBody(model.team) : [])'), "段分派改指管理面")
  const modal = SETTINGS_VIEW.settingsModalTree({ settings: { open: false, modal: "team", configured: true, team: { state: "ready", loggedIn: true, server: "https://t.example", member: { username: "u" }, label: "x", notice: null } } }, "team", {})
  assert.equal(findDeep(modal.card, (n) => n?.props?.["data-form"] === "team"), null, "设置面弹窗 ⇒ 零表单（管理面）")
})

// ─── D4 · 装配面（面板开合 ∥ 读链 ∥ 关三路 ∥ 启动读口）─────────────────────────────────────────

/** 假 DOM（`build` 所需最小面：`createElement` ∥ `Node` ∥ 属性 ∥ 事件 ∥ 树操作）。 */
class FakeNode {}
class FakeElement extends FakeNode {
  constructor(tag) {
    super()
    this.tagName = String(tag).toUpperCase()
    this.children = []
    this.attrs = new Map()
    this.style = {}
    this.listeners = new Map()
    this.parentNode = null
    this.scrollTop = 0
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)) }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null }
  getAttributeNames() { return [...this.attrs.keys()] }
  removeAttribute(k) { this.attrs.delete(k) }
  addEventListener(t, fn) { this.listeners.set(t, [...(this.listeners.get(t) ?? []), fn]) }
  append(...nodes) { for (const n of nodes) { this.children.push(n); if (n instanceof FakeNode) n.parentNode = this } }
  replaceChildren() { this.children = [] }
  replaceWith(node) {
    const parent = this.parentNode
    if (parent !== null) {
      parent.children[parent.children.indexOf(this)] = node
      node.parentNode = parent
      this.parentNode = null
    }
  }
  remove() {
    const parent = this.parentNode
    if (parent !== null) {
      parent.children = parent.children.filter((c) => c !== this)
      this.parentNode = null
    }
  }
  contains(node) { for (let n = node; n != null; n = n.parentNode) if (n === this) return true; return false }
  get childNodes() { return this.children }
  /** 选择器子集（测试面）：`[attr]` ∥ `[attr="value"]` —— 本批机检所及全形（零 CSS 引擎）。 */
  matches(selector) {
    const parsed = /^\[([a-zA-Z-]+)(?:="([^"]*)")?\]$/.exec(selector ?? "")
    if (parsed === null) return false
    const value = this.attrs.get(parsed[1])
    if (value === undefined) return false
    return parsed[2] === undefined ? true : value === parsed[2]
  }
  querySelectorAll(selector) {
    const out = []
    const walk = (node) => {
      for (const child of node.children) {
        if (child instanceof FakeElement) {
          if (child.matches(selector)) out.push(child)
          walk(child)
        }
      }
    }
    walk(this)
    return out
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
  focus() {}
  set textContent(value) { this.text = String(value) }
  get textContent() { return this.text ?? "" }
}

/** 微任务 + 三拍宏任务冲刷（链路全微任务 ⇒ 一拍即足；多拍 = 防链路引入单跳定时器后的脆性）——时序确定性单源。 */
const settle = async () => { for (let i = 0; i < 3; i += 1) await new Promise((done) => setTimeout(done, 0)) }

/** 假 FormData（`teamFormNode` 取件面 = 假表单 —— 与 B1 桌面件同式）。 */
class FakeFormData {
  constructor(form) { this.map = new Map(Object.entries(form?._fields ?? {})) }
  get(name) { return this.map.has(name) ? this.map.get(name) : null }
}

test("D4 装配面：启动读口 ∥ 面板开合（建件 + 就地读 + 活校验）∥ 关三路 ∥ 写路复读 ∥ 退出清 verify", async () => {
  const listeners = { keydown: [], click: [] }
  const body = new FakeElement("body")
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  const prevFormData = globalThis.FormData
  const prevError = console.error
  globalThis.Node = FakeNode
  globalThis.FormData = FakeFormData
  globalThis.document = {
    body,
    createElement: (tag) => new FakeElement(tag),
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn) },
    querySelector: () => null,
    querySelectorAll: () => [fakeForm],
  }
  const errors = []
  console.error = (...args) => errors.push(args)
  const calls = []
  let phase = "loggedOut"
  const fakeForm = { _fields: { server: "https://t.example", username: "u", password: "p" }, getAttribute: () => "team", querySelectorAll: () => [] }
  const host = {
    invoke: async (channel, payload) => {
      calls.push([channel, payload])
      if (channel === "team:status") {
        return phase === "loggedIn"
          ? { ok: true, loggedIn: true, server: "https://t.example", member: { username: "u", name: "U" }, label: "desk@host" }
          : { ok: true, loggedIn: false, server: "https://t.example", member: null, label: null }
      }
      if (channel === "team:verify") return { ok: true, state: "valid" }
      if (channel === "provider:list") return { ok: true, presets: [], providers: [], defaultModel: null }
      if (channel === "team:login") return { ok: true }
      if (channel === "team:logout") return { ok: true }
      return { ok: false, reason: "stub" }
    },
  }
  const takeCalls = () => calls.splice(0, calls.length).map(([channel]) => channel)
  const panels = () => body.children.filter((n) => n?.getAttribute?.("data-team-pop") !== undefined)
  try {
    const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))
    const store = STORE.createStore(STORE.initialState())
    const face = attachSettings(host, { store })
    await settle()
    takeCalls()
    assert.equal(typeof face.team?.refresh, "function", "启动读口出句柄（`app.mjs` 消费）")
    await face.team.refresh() // 启动读（触发点①：loggedOut ⇒ 无 verify）
    await settle()
    assert.deepEqual(takeCalls(), ["team:status"], "启动读 = 恰一 `team:status`（未登录零调核）")

    // 面板开（段点 ⇒ 视图档翻转 ⇒ 本档施用面）：建件 + 就地读 + 活校验
    SL.toggleTeamPanel()
    await settle()
    assert.equal(panels().length, 1, "开 ⇒ `div.team-pop` 建件")
    assert.ok(findDeep(panels()[0].children, () => true) !== null || panels()[0].children.length > 0, "面板有内容（登录表单族）")
    assert.deepEqual(takeCalls(), ["team:status"], "开面读（未登录 ⇒ 零 verify）")
    phase = "loggedIn"
    SL.closeTeamPanel()
    assert.equal(panels().length, 0, "段再点（合）⇒ 撤件零残留")
    SL.toggleTeamPanel()
    await settle()
    assert.deepEqual(takeCalls(), ["team:status", "team:verify"], "开合读 = `team:status` + token 在场 ⇒ `team:verify`（触发点②）")
    assert.equal(store.get().settings?.team?.verify, "valid", "verify 三值落切片")
    assert.ok(findDeep(panels()[0].children, (n) => n?.attrs?.get?.("data-action") === "settings:teamLogout") !== null, "已登录面 ⇒ 退出钮在场")

    // 关三路 · Esc（捕获相）：面板在场 ⇒ 仅关面板（stopPropagation 截获）
    const escape = listeners.keydown[0]
    assert.equal(typeof escape, "function", "Esc 绑定在场")
    let stopped = 0
    escape({ key: "Escape", stopPropagation: () => { stopped += 1 } })
    assert.equal(panels().length, 0, "Esc ⇒ 面板关")
    assert.equal(stopped, 1, "Esc 截获（不连带既有 document 级 Esc 面）")
    escape({ key: "Escape", stopPropagation: () => { stopped += 1 } })
    assert.equal(stopped, 1, "面板不在场 ⇒ 零截获（交既有面）")

    // 关三路 · 面板外点击
    SL.toggleTeamPanel()
    await settle()
    takeCalls()
    const click = listeners.click[0]
    click({ target: new FakeElement("span") })
    assert.equal(panels().length, 0, "面板外点击 ⇒ 关")

    // 写路：登录成 ⇒ 复读两调用点；退出 ⇒ verify 清
    SL.toggleTeamPanel()
    await settle()
    takeCalls()
    face.handlers.onTeamLogin()
    await settle()
    const login = takeCalls()
    assert.ok(login.includes("team:login") && login.includes("team:status") && login.includes("provider:list"), "登录成 ⇒ 复读两调用点")
    phase = "loggedOut"
    face.handlers.onTeamLogout()
    await settle()
    assert.equal(store.get().settings?.team?.verify, null, "退出（token 缺席）⇒ verify 清位")
    face.detach()
    SL.closeTeamPanel()
    await settle() // 在途链落定于假 DOM 在场期（免脱挂后监听面空转）
  } finally {
    console.error = prevError
    globalThis.document = prevDoc
    globalThis.Node = prevNode
    globalThis.FormData = prevFormData
  }
})

// ─── D5 · 首启两路 ──────────────────────────────────────────────────────────────────────────

test("D5 首启两路：路由屏两卡（零预选 + 「以后再说」）∥ 团队表单（密码不申报）∥ 回退 ∥ 本地 ⇒ 步 1 ∥ 步闭集", () => {
  const base = STORE.initialState()
  const state = { ...base, settings: { ...base.settings, configured: false } }
  const handlers = { onDismiss: () => {}, onChooseRoute: () => {}, onTeamLogin: () => {}, onBackToRoute: () => {}, onNext: () => {}, onFinish: () => {} }
  const route = ONBOARDING.wizardModel(state)
  assert.equal(route.step, "route", "初值 = 路由屏")
  assert.equal(route.active, true, "未配 ⇒ 向导占槽")
  const routeTree = ONBOARDING.wizardTree(route, handlers)
  assert.equal(routeTree.props["data-step"], "route", "宿主 `data-step` 直读步值")
  assert.deepEqual(collectDeep(routeTree, (n) => n?.props?.["data-route-card"] !== undefined).map((n) => n.props["data-route-card"]), ["team", "local"], "两卡（团队 ∥ 本地）")
  assert.deepEqual(collectDeep(routeTree, (n) => n?.props?.["data-route"] !== undefined).map((n) => n.props["data-route"]), ["team", "local"], "两行动钮")
  assert.equal(collectDeep(routeTree, (n) => n?.props?.["data-selected"] !== undefined).length, 0, "零预选")
  assert.ok(findDeep(routeTree, (n) => n?.props?.["data-wizard-later"] !== undefined) !== null, "「以后再说」在场（第三态）")
  assert.equal(collectDeep(routeTree, (n) => n?.props?.["data-step-mark"] !== undefined).length, 0, "路由屏零步标")
  assert.equal(findDeep(routeTree, (n) => n?.tag === "footer"), null, "路由屏零尾控件")
  assert.equal(findDeep(routeTree, (n) => n?.props?.["data-route"] === "team").children[0], "登录", "团队卡钮词复用 `settings.team.login`")

  const teamState = { ...state, settings: { ...state.settings, wizard: { step: "team", dismissed: false, notice: null }, team: { state: "ready", loggedIn: false, server: "https://t.example", member: { username: "u" }, label: null, notice: null } } }
  const teamRoute = ONBOARDING.wizardModel(teamState)
  const teamTree = ONBOARDING.wizardTree(teamRoute, handlers)
  const form = findDeep(teamTree, (n) => n?.props?.["data-form"] === "wizard-team")
  assert.ok(form !== null, "团队表单屏（同屏换取）")
  const inputs = collectDeep(form, (n) => n?.tag === "input").map((n) => n.props)
  assert.deepEqual(inputs.map((p) => p.id), ["wizard-team-server", "wizard-team-username", "wizard-team-password"], "三字段复用（`fieldPair`）")
  assert.equal(inputs[0].value, "https://t.example", "地址预填自留存值")
  assert.equal(inputs[1].value, "u", "用户名预填")
  assert.equal(inputs[0]["data-draft"], "", "地址携草稿标记（回退保真）")
  assert.equal(Object.hasOwn(inputs[2], "data-draft"), false, "密码恒不保真")
  assert.ok(findDeep(teamTree, (n) => n?.props?.["data-action"] === "wizard:backToRoute") !== null, "「← 换一种方式」在场")
  assert.equal(collectDeep(teamTree, (n) => n?.props?.["data-step-mark"] !== undefined).length, 0, "团队屏零步标")
  assert.equal(findDeep(teamTree, (n) => n?.tag === "footer"), null, "团队屏零尾控件")
  const failed = ONBOARDING.wizardTree(ONBOARDING.wizardModel({ ...teamState, settings: { ...teamState.settings, team: { ...teamState.settings.team, notice: { kind: "failure", reason: "credentials" } } } }), handlers)
  assert.equal(findDeep(failed, (n) => n?.props?.["data-team-notice"] !== undefined)?.children[0], "用户名或密码错误", "失败句就地（四句逐字同）")

  const local = ONBOARDING.wizardModel({ ...state, settings: { ...state.settings, wizard: { step: 1, dismissed: false, notice: null } } })
  const localTree = ONBOARDING.wizardTree(local, handlers)
  assert.equal(collectDeep(localTree, (n) => n?.props?.["data-step-mark"] !== undefined).length, 3, "本地步 1 ⇒ 步标在场")
  assert.ok(findDeep(localTree, (n) => n?.tag === "footer") !== null, "本地步 ⇒ 尾控件在场")
  assert.equal(ONBOARDING.wizardModel({ ...state, settings: { ...state.settings, wizard: { step: 99 } } }).step, "route", "表外值回落路由屏")
  assert.deepEqual([...STORE.WIZARD_STEPS], ["route", "team", 1, 2, 3], "步闭集单源 = `WIZARD_STEPS`")
  assert.equal(STORE.setWizardStep(state, 9), state, "表外步 ⇒ 原引用（零写）")
  assert.equal(STORE.setWizardStep(state, "team").settings.wizard.step, "team", "两屏步值可写")
})

test("D5b 首启接线：卡选取 / 回退 / 团队提交（成 ∥ 败 ∥ 空表单门）", async () => {
  const { createWizard } = await import(at("thincoder-desktop/renderer/mount-onboarding.mjs"))
  const calls = []
  const host = {
    invoke: async (channel, payload) => {
      calls.push([channel, payload])
      if (channel === "team:login") return host.loginReceipt
      if (channel === "provider:list") return { ok: true, presets: [], providers: [], defaultModel: null }
      if (channel === "model:catalog") return { ok: true, models: [] }
      return { ok: false, reason: "stub" }
    },
    loginReceipt: { ok: true },
  }
  const ask = (channel, payload) => host.invoke(channel, payload)
  const store = STORE.createStore(STORE.initialState())
  const prevFormData = globalThis.FormData
  globalThis.FormData = FakeFormData
  const errors = []
  const prevError = console.error
  console.error = (...args) => errors.push(args)
  const takeCalls = () => calls.splice(0, calls.length).map(([channel]) => channel)
  const form = { _fields: { server: "https://t.example", username: "u", password: "p" }, getAttribute: () => "wizard-team", querySelectorAll: () => [] }
  const eventOf = (target) => ({ currentTarget: { closest: (sel) => (sel === "form" ? target : null) } })
  try {
    const base = STORE.initialState()
    store.set({ ...base, settings: { ...base.settings, configured: false } })
    const { handlers } = createWizard({
      store, ask, report: () => {}, clearReport: () => {},
      loadModels: (provider) => host.invoke("model:list", { provider }),
      submitChannel: () => {}, verifyChannel: () => {},
      loadProviders: () => host.invoke("provider:list"),
    })
    handlers.onChooseRoute("team")
    assert.equal(store.get().settings.wizard.step, "team", "团队卡 ⇒ 团队表单屏")
    handlers.onChooseRoute("local")
    assert.equal(store.get().settings.wizard.step, 1, "本地卡 ⇒ 步 1")
    handlers.onBackToRoute()
    assert.equal(store.get().settings.wizard.step, "route", "回退 ⇒ 路由屏")
    handlers.onChooseRoute("bogus")
    assert.equal(store.get().settings.wizard.step, "route", "表外路由 ⇒ 零动作")
    assert.match(String(errors.at(-1)?.[0] ?? ""), /unknown route/, "表外路由记错（零静默）")

    // 团队提交 · 败（四句就地 —— 切片 + 词键单源）
    handlers.onChooseRoute("team")
    host.loginReceipt = { ok: false, reason: "credentials" }
    handlers.onTeamLogin(eventOf(form))
    await settle()
    assert.deepEqual(calls.find(([c]) => c === "team:login")?.[1], { server: "https://t.example", username: "u", password: "p" }, "载荷三键")
    assert.deepEqual(store.get().settings.team.notice, { kind: "failure", reason: "credentials" }, "败 ⇒ 就地错误行")
    assert.equal(store.get().settings.wizard.step, "team", "败 ⇒ 停留可重试")
    takeCalls()

    // 团队提交 · 成（同名冲突 + 复读 + 进步 2）
    host.loginReceipt = { ok: true, notice: "manual-name-conflict" }
    handlers.onTeamLogin(eventOf(form))
    await settle()
    const after = takeCalls()
    assert.ok(after.includes("provider:list"), "登录成 ⇒ `loadProviders` 复读（派生条目）")
    assert.equal(store.get().settings.team.notice?.kind, "manualConflict", "同名冲突当刻就地")
    assert.equal(store.get().settings.team.verify, null, "重登成 ⇒ verify 清")
    assert.equal(store.get().settings.wizard.step, 2, "登录成 ⇒ 进步 2（模型）")
    // 同名冲突提示并入步 2 头行（判据单源 = SETTINGS.md §2.22 项 2 补句 —— 成功径同拍进步 ⇒ 提示不静默）
    const step2Words = collectText(ONBOARDING.wizardTree(ONBOARDING.wizardModel(store.get()), {}))
    assert.ok(step2Words.includes(i18n.t("settings.team.notice.manualNameConflict")), "同名冲突 ⇒ 进步 2 后词面在场（不静默）")
    takeCalls()
    handlers.onNext() // 离步 2（⇒ 步 3）
    assert.equal(store.get().settings.wizard.step, 3, "下一步 ⇒ 步 3")
    assert.equal(store.get().settings.team.notice, null, "离步 2 ⇒ 一次性提示消费即清")
    handlers.onBackToRoute() // 复位（空表单门块前态）
    takeCalls()

    // 空表单门（零发送 + 分类同核兜底面）
    handlers.onBackToRoute()
    handlers.onChooseRoute("team")
    const empty = { _fields: { server: "", username: "u", password: "p" }, getAttribute: () => "wizard-team", querySelectorAll: () => [] }
    handlers.onTeamLogin(eventOf(empty))
    await settle()
    assert.ok(!calls.some(([c]) => c === "team:login"), "无地址 ⇒ 零发送")
    assert.deepEqual(store.get().settings.team.notice, { kind: "failure", reason: "network" }, "分类兜底 network")
  } finally {
    console.error = prevError
    globalThis.FormData = prevFormData
  }
})

// ─── D5c · 回退 / 换路保真（#604 残件载体 —— 向导步切换）─────────────────────────────────────

test("D5c 回退 / 换路保真：已填保留（地址 ∥ 用户名）∥ 密码恒清 ∥ 路由屏往返不丢", async () => {
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  const prevForm = globalThis.FormData
  const prevError = console.error
  const slot = new FakeElement("div")
  slot.setAttribute("data-slot", "settings")
  globalThis.Node = FakeNode
  globalThis.FormData = FakeFormData
  console.error = () => {}
  globalThis.document = {
    body: new FakeElement("body"),
    createElement: (tag) => new FakeElement(tag),
    addEventListener: () => {},
    querySelector: (selector) => (selector === '[data-slot="settings"]' ? slot : null),
    querySelectorAll: () => [],
  }
  const byId = (id) => slot.querySelector(`[id="${id}"]`)
  try {
    const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))
    const store = STORE.createStore(STORE.initialState())
    const face = attachSettings({
      invoke: async (channel) => (channel === "provider:list"
        ? { ok: true, presets: [], providers: [], active: null, defaultModel: null }
        : { ok: true, configured: false }),
    }, { store })
    const base = STORE.initialState()
    store.set({ ...base, settings: { ...base.settings, configured: false, wizard: { step: "team", dismissed: false, notice: null } } })
    assert.ok(byId("wizard-team-server") !== null, "团队表单在场（向导占槽换屏）")
    byId("wizard-team-server").value = "https://typed.example" // 手填（未提交）
    byId("wizard-team-username").value = "typed-user"
    byId("wizard-team-password").value = "typed-secret"
    face.wizardHandlers.onBackToRoute()
    assert.equal(store.get().settings.wizard.step, "route", "回退 ⇒ 路由屏")
    assert.equal(byId("wizard-team-server"), null, "团队表单退场")
    face.wizardHandlers.onChooseRoute("team")
    assert.equal(store.get().settings.wizard.step, "team", "再入 ⇒ 团队屏")
    assert.equal(byId("wizard-team-server")?.value, "https://typed.example", "地址已填保留（回退往返不丢——判据单源 = SETTINGS.md §2.22 项 3）")
    assert.equal(byId("wizard-team-username")?.value, "typed-user", "用户名已填保留")
    assert.ok(byId("wizard-team-password") !== null, "密码格在场（重建）")
    assert.equal(byId("wizard-team-password").value ?? "", "", "密码恒清（不申报 ⇒ 不保真）")
    await settle() // 在途链（`loadProviders`）落定于假 DOM 在场期（免脱挂后监听面空转）
    face.detach()
  } finally {
    console.error = prevError
    globalThis.document = prevDoc
    globalThis.Node = prevNode
    globalThis.FormData = prevForm
  }
})
