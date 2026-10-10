/**
 * 2026-10-10-team-login-client-access-desktop.test.mjs — 批内单测件（B1 批 · **桌面舱 D 面** · 名随批档 ·
 * 住 `docs/batches/` · 不入仓套件 · 随批留存；服务端面件 = `2026-10-10-team-login-client-access.test.mjs`，
 * 跨端收口件 = `docs/batches/2026-10-10-team-login-client-access-ends.test.mjs`）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-team-login-client-access-desktop.test.mjs`
 *
 * 射程（判据源 = `docs/desktop/design/SETTINGS.md` §2.21 ∥ `docs/desktop/design/IPC.md` §2 团队族行 ∥
 * `docs/core/design/TEAM.md` §2.5）：
 *   A 词面：团队段词族十五键两语在场；未登录句 ∥ 四失败句 ∥ 两提示句 = 逐字句；
 *   B 段形：`SECTIONS` 八段（团队追尾）；未登录 = 表单（三字段 + 登录钮 + 提示行；地址 ∥ 用户名携 `data-draft`，
 *     密码不携）∥ 已登录 = 状态行三读 + 退出钮；`loading` ⇒ 零体（段态门）；失败面段标覆盖 `team`；
 *   C 装配面：`SCOPES` 十一（`team` 受理 ∥ 表外拒 + 记错）；开面随读（`openSettings` ⇒ `team:status`）；
 *     组弹窗读链 `MODAL_READS.team`（恰一通道）；登录 = 载荷三键 + **回执后复读两调用点**（`team:status` + `provider:list`）;
 *     退出 = 复读两调用点 + `revokeDelivered:false` ⇒ 吊销未达提示；失败 = 就地错误行（reason 直落）；
 *     空表单 ∥ 空凭据 ⇒ **零发送** + 分类兜底（`network` ∥ `credentials`）；
 *   D 隐藏判据：`providerList` —— `derived === true` ∧ 无 key ⇒ 滤除；`derived` 有 key ∥ 手工 ⇒ 在场；
 *   E 通道三件套：`CHANNELS` 五十一项（末位三 = 团队族）∥ `HANDLERS` 行集 = 白名单集 ∥ 三档头计数 + 定序末位 ∥
 *     `EVENT_CHANNELS` 二十四（零动）；
 *   F 转口档直调（主侧）：`team:status` 形 ∥ `team:login` 形门兜底（无地址 ⇒ `network`）∥ 网络不可达 ⇒ `network` ∥
 *     `team:logout` 无 token ⇒ `ok:true`。
 * 平 node 直测（假 DOM / 假 FormData / 桩窄桥；不碰真配置——`_setConfigPathForTest` 注临时档）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = [join(HERE, "..", ".."), join(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-desktop")))
const at = (rel) => pathToFileURL(join(ROOT, rel)).href
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const require = createRequire(import.meta.url)

await import(at("thincoder-desktop/test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于渲染档取件注册）

const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
i18n.initDict({ locale: "zh" })
const { SECTIONS, settingsModel, settingsModalTree } = await import(at("thincoder-desktop/renderer/views/settings.mjs"))
const { initialState, createStore } = await import(at("thincoder-desktop/renderer/store.mjs"))
const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))

/** 团队段词族十五键（zh 值 —— 未登录句 ∥ 四失败句 ∥ 两提示句 = 三端逐字同句，单源 = `TEAM.md` §2.5）。 */
const TEAM_ZH = {
  "settings.section.team": "团队",
  "settings.team.serverLabel": "服务器地址",
  "settings.team.usernameLabel": "用户名",
  "settings.team.passwordLabel": "密码",
  "settings.team.login": "登录",
  "settings.team.logout": "退出登录",
  "settings.team.loggedOut": "未登录——登录后可用",
  "settings.team.memberLabel": "成员",
  "settings.team.labelLabel": "端标签",
  "settings.team.reason.network": "网络不可达",
  "settings.team.reason.credentials": "用户名或密码错误",
  "settings.team.reason.rateLimited": "登录尝试过于频繁",
  "settings.team.reason.writeFailed": "本机配置写入失败",
  "settings.team.notice.manualNameConflict": "已存在同名 provider「team」——未自动添加；请改名或删除后重登",
  "settings.team.notice.revokeNotDelivered": "服务端吊销未达",
}

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
const byAction = (node, action) => findDeep(node, (n) => n?.props?.["data-action"] === action)
const byRead = (node) => collectDeep(node, (n) => typeof n?.props?.["data-read"] === "string").map((n) => n.props["data-read"])

/** 段态夹具（其余切片刻意最简 —— 本件只测团队段面）。 */
const baseState = (team, extra = {}) => ({
  locale: "zh", theme: "system", activeSession: null, sessionFlags: {},
  settings: { open: true, notice: null, modal: "team", configured: true, defaultModel: null, team, ...extra },
})
const teamTree = (team, handlers = { onTeamLogin: () => {}, onTeamLogout: () => {} }) => settingsModalTree(baseState(team), "team", handlers)

// ─── A 词面（十五键 · 逐字句）──────────────────────────────────────────────────────────────

test("A 词面：团队段词族十五键两语在场 ∥ 未登录句 ∥ 四失败句 ∥ 两提示句逐字", () => {
  const en = i18n.HOST_DICT.en ?? {}
  for (const [key, value] of Object.entries(TEAM_ZH)) {
    assert.equal(i18n.t(key), value, `zh ${key} 逐字`)
    assert.equal(typeof en[key], "string", `en ${key} 在场`)
    assert.notEqual(en[key], "", `en ${key} 值非空`)
  }
  assert.equal(Object.keys(TEAM_ZH).length, 15, "团队段词族 = 十五键")
})

test("A2 三端同句：未登录句 ∥ 四失败句 ∥ 两提示句 zh 与 VSC 端逐字相等（跨端同一句面）", () => {
  const vsc = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  const pairs = [
    ["settings.team.loggedOut", "settings.team.notLoggedIn"],
    ["settings.team.reason.network", "settings.team.fail.network"],
    ["settings.team.reason.credentials", "settings.team.fail.credentials"],
    ["settings.team.reason.rateLimited", "settings.team.fail.rateLimited"],
    ["settings.team.reason.writeFailed", "settings.team.fail.writeFailed"],
    ["settings.team.notice.manualNameConflict", "settings.team.notice.manualNameConflict"],
    ["settings.team.notice.revokeNotDelivered", "settings.team.notice.revokeUndelivered"],
  ]
  for (const [desktopKey, vscKey] of pairs) {
    assert.equal(typeof vsc[vscKey], "string", `VSC ${vscKey} 在场`)
    assert.equal(i18n.t(desktopKey), vsc[vscKey], `${desktopKey} 与 VSC ${vscKey} 逐字同句`)
  }
})

// ─── B 段形（八段 · 两态 · 草稿标记 · 段态门）──────────────────────────────────────────────

test("B1 段集：`SECTIONS` = 八段（团队追尾，既有七段零重排）", () => {
  assert.equal(SECTIONS.length, 8)
  assert.deepEqual(SECTIONS.map((s) => s.name), ["providers", "model", "agent", "mcp", "env", "tools", "models", "team"])
})

test("B2 未登录面：表单三字段 + 登录钮 + 提示行 ∥ 地址 ∥ 用户名携 `data-draft`、密码不携", () => {
  const tree = teamTree({ state: "ready", loggedIn: false, server: "https://t.example/v1", member: { username: "u" }, label: null, notice: null })
  const form = findDeep(tree.card, (n) => n?.props?.["data-form"] === "team")
  assert.ok(form !== null, "登录表单在场")
  assert.equal(form.props["data-draft-scope"], "team", "表单草稿作用域 = team")
  const inputs = collectDeep(form, (n) => n?.tag === "input").map((n) => n.props)
  assert.deepEqual(inputs.map((p) => p.id), ["team-server", "team-username", "team-password"], "三字段序")
  assert.equal(inputs[0]["data-draft"], "", "地址携草稿标记")
  assert.equal(inputs[1]["data-draft"], "", "用户名携草稿标记")
  assert.equal(Object.hasOwn(inputs[2], "data-draft"), false, "密码恒不保真（不携草稿标记）")
  assert.equal(inputs[0].value, "https://t.example/v1", "地址现存值重建保留")
  assert.equal(inputs[1].value, "u", "用户名现存值重建保留")
  const hint = findDeep(tree.card, (n) => n?.props?.["data-team-hint"] !== undefined)
  assert.equal(hint.children[0], "未登录——登录后可用", "提示行逐字")
  assert.equal(typeof byAction(tree.card, "settings:teamLogin")?.props?.onClick, "function", "登录钮活件")
  assert.equal(byAction(tree.card, "settings:teamLogout"), null, "未登录 ⇒ 零退出钮")
})

test("B3 已登录面：状态行三读（server ∥ 成员 ∥ 端标签）+ 退出钮 ∥ 零表单", () => {
  const tree = teamTree({ state: "ready", loggedIn: true, server: "https://t.example", member: { username: "u", name: "U" }, label: "desk@host", notice: null })
  assert.deepEqual(byRead(tree.card), ["team-server", "team-member", "team-label"], "状态行三读")
  assert.equal(findDeep(tree.card, (n) => n?.props?.["data-form"] === "team"), null, "已登录 ⇒ 零表单")
  assert.equal(typeof byAction(tree.card, "settings:teamLogout")?.props?.onClick, "function", "退出钮活件")
})

test("B4 段内结果行：失败四句 ∥ 两提示句逐字 ∥ 段态 `loading` ⇒ 零体 ∥ 失败面段标覆盖 team", () => {
  const sentenceOf = (notice) => {
    const node = findDeep(teamTree({ state: "ready", loggedIn: false, server: null, member: null, label: null, notice }).card,
      (n) => n?.props?.["data-team-notice"] !== undefined)
    return node === null ? null : node.children[0]
  }
  assert.equal(sentenceOf({ kind: "failure", reason: "network" }), "网络不可达")
  assert.equal(sentenceOf({ kind: "failure", reason: "credentials" }), "用户名或密码错误")
  assert.equal(sentenceOf({ kind: "failure", reason: "rate_limited" }), "登录尝试过于频繁")
  assert.equal(sentenceOf({ kind: "failure", reason: "write_failed" }), "本机配置写入失败")
  assert.equal(sentenceOf({ kind: "manualConflict" }), TEAM_ZH["settings.team.notice.manualNameConflict"])
  assert.equal(sentenceOf({ kind: "revokeFailed" }), "服务端吊销未达")
  const loading = teamTree({ state: "loading", loggedIn: false, server: null, member: null, label: null, notice: null }).card
  assert.equal(findDeep(loading, (n) => n?.props?.["data-form"] === "team"), null, "在途 ⇒ 零体（防假读数）")
  // 失败面段标（`SCOPE_WORD` 派生覆盖 team）
  const noticeTree = settingsModalTree(baseState({ state: "ready", loggedIn: false, server: null, member: null, label: null, notice: null }, { notice: { scope: "team", reason: "probe-failed" } }), "team", {})
  const scope = findDeep(noticeTree.card, (n) => n?.props?.class === "settings-notice-scope")
  assert.equal(scope.children[0], "团队", "段标 = 团队")
})

// ─── C 装配面（读链 · 两出口 · 复读两调用点 · 空表单门）─────────────────────────────────────

test("C 装配面：开面随读 ∥ 弹窗读链 ∥ 闭集 ∥ 登录 ∥ 退出 ∥ 失败 ∥ 空表单门", async () => {
  const calls = []
  let phase = "loggedOut"
  const receipts = {}
  const host = {
    invoke: async (channel, payload) => {
      calls.push([channel, payload])
      if (typeof receipts[channel] === "function") return receipts[channel]()
      if (receipts[channel] !== undefined) return receipts[channel]
      if (channel === "team:status") {
        return phase === "loggedIn"
          ? { ok: true, loggedIn: true, server: "https://t.example", member: { username: "u", name: "U" }, label: "desk@host" }
          : { ok: true, loggedIn: false, server: "https://t.example", member: null, label: null }
      }
      if (channel === "provider:list") return { ok: true, presets: [], providers: [], active: null, defaultModel: null }
      if (channel === "model:catalog") return { ok: true, models: [] }
      if (channel === "settings:agent") return { ok: true, fields: [], models: null }
      if (channel === "mcp:list") return { ok: true, servers: [] }
      if (channel === "settings:env") return { ok: true, proxy: {}, shell: {} }
      if (channel === "settings:tools") return { ok: true }
      if (channel === "index:status") return { ok: true, status: null }
      return { ok: false, reason: "stub" }
    },
  }
  // 假 DOM ∥ 假 FormData（浏览器面 API 的平 node 等价物）
  class FakeFormData {
    constructor(form) { this.map = new Map(Object.entries(form?._fields ?? {})) }
    get(name) { return this.map.has(name) ? this.map.get(name) : null }
  }
  const fakeForm = { _fields: { server: "https://t.example", username: "u", password: "p" }, getAttribute: () => "team", querySelectorAll: () => [] }
  const prevFormData = globalThis.FormData
  const prevDoc = globalThis.document
  const prevError = console.error
  globalThis.FormData = FakeFormData
  globalThis.document = { querySelector: () => null, querySelectorAll: () => [fakeForm], addEventListener: () => {} }
  const errors = []
  console.error = (...args) => errors.push(args)
  const settle = () => new Promise((done) => setTimeout(done, 0))
  const takeCalls = () => calls.splice(0, calls.length).map(([channel]) => channel)
  try {
    const store = createStore(initialState())
    const face = attachSettings(host, { store })
    face.detach()
    const teamSlice = () => store.get().settings?.team ?? null
    await settle()
    assert.ok(takeCalls().includes("provider:list"), "初绘：基础读在场（不动 team）")
    assert.equal(teamSlice(), null, "初绘：team 切片未触")

    // 开面随读（页面径）
    face.openSettings()
    await settle()
    assert.ok(calls.some(([c]) => c === "team:status"), "开面随读：`team:status` 触发")
    assert.equal(teamSlice()?.state, "ready", "段转 ready")
    assert.equal(teamSlice()?.loggedIn, false, "未登录态")
    takeCalls()

    // 组弹窗读链 + 闭集
    assert.equal(face.openSettingsModal("team"), true, "team ∈ SCOPES（十一值）")
    await settle()
    assert.deepEqual(takeCalls(), ["team:status"], "`MODAL_READS.team` ⇒ 恰一通道")
    assert.equal(face.openSettingsModal("bogus"), false, "表外组拒")
    assert.match(String(errors.at(-1)?.[0] ?? ""), /unknown group/, "拒径记错（零静默）")
    face.closeSettingsModal()
    takeCalls()

    // 登录成（同名冲突提示 + 复读两调用点）
    receipts["team:login"] = { ok: true, notice: "manual-name-conflict" }
    phase = "loggedIn"
    face.handlers.onTeamLogin()
    await settle()
    const login = calls.find(([c]) => c === "team:login")
    assert.deepEqual(login?.[1], { server: "https://t.example", username: "u", password: "p" }, "登录载荷三键")
    const after = takeCalls()
    assert.ok(after.includes("team:status") && after.includes("provider:list"), "回执后复读两调用点")
    assert.equal(teamSlice()?.loggedIn, true, "段转登录态")
    assert.equal(teamSlice()?.notice?.kind, "manualConflict", "同名冲突当刻就地")
    phase = "loggedOut"

    // 退出（吊销未达提示）
    receipts["team:logout"] = { ok: true, revokeDelivered: false }
    face.handlers.onTeamLogout()
    await settle()
    const out = takeCalls()
    assert.ok(out.includes("team:status") && out.includes("provider:list"), "退出复读两调用点")
    assert.equal(teamSlice()?.notice?.kind, "revokeFailed", "吊销未达当刻就地")

    // 当刻一次性提示：开面两径随清（本组面态复位）
    assert.equal(face.openSettingsModal("team"), true, "再开（弹窗径）")
    await settle()
    assert.equal(teamSlice()?.notice, null, "弹窗开 ⇒ 提示清")
    face.closeSettingsModal()
    takeCalls()
    face.handlers.onTeamLogout()
    await settle()
    assert.equal(teamSlice()?.notice?.kind, "revokeFailed", "提示在场（前置真·页径）")
    face.openSettings()
    await settle()
    assert.equal(teamSlice()?.notice, null, "页开 ⇒ 提示清")
    takeCalls()

    // 登录失败（就地错误行）
    receipts["team:login"] = { ok: false, reason: "credentials" }
    face.handlers.onTeamLogin()
    await settle()
    assert.equal(teamSlice()?.notice?.reason, "credentials", "失败 reason 直落")
    takeCalls()

    // 空表单门（零发送 + 分类兜底）
    fakeForm._fields = { server: "", username: "u", password: "p" }
    face.handlers.onTeamLogin()
    await settle()
    assert.ok(!calls.some(([c]) => c === "team:login"), "无地址 ⇒ 零发送")
    assert.equal(teamSlice()?.notice?.reason, "network", "分类兜底 network")
    fakeForm._fields = { server: "https://t.example", username: "", password: "p" }
    face.handlers.onTeamLogin()
    await settle()
    assert.ok(!calls.some(([c]) => c === "team:login"), "凭据不全 ⇒ 零发送")
    assert.equal(teamSlice()?.notice?.reason, "credentials", "分类兜底 credentials")
  } finally {
    console.error = prevError
    globalThis.document = prevDoc
    globalThis.FormData = prevFormData
  }
})

// ─── D 隐藏判据（`providerList`）────────────────────────────────────────────────────────────

test("D 隐藏判据：`derived === true` ∧ 无 key ⇒ 滤除；derived 有 key ∥ 手工 ⇒ 在场", async () => {
  const coreConfig = await import(at("thincoder-core/config-io.mjs"))
  const dir = mkdtempSync(join(tmpdir(), "b1-team-providers-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify({
    providers: [
      { name: "manual", baseURL: "https://m.example/v1", apiKey: "sk-manual" },
      { name: "team", baseURL: "https://t.example/v1", apiKey: "", derived: true },
      { name: "team-kept", baseURL: "https://t2.example/v1", apiKey: "sk-2", derived: true },
    ],
    defaultModel: null,
  }, null, 2))
  coreConfig._setConfigPathForTest(cfg)
  try {
    const providers = await import(at("thincoder-desktop/src/main/providers.mjs"))
    assert.deepEqual(providers.providerList().providers.map((p) => p.name), ["manual", "team-kept"], "派生无 key 滤除（退出态隐藏）")
  } finally {
    coreConfig._resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── E 通道三件套 ───────────────────────────────────────────────────────────────────────────

test("E 通道三件套：白名单五十一 ∥ 末位三 = 团队族 ∥ 注册表闭包 ∥ 三档头计数 ∥ 订阅面零动", () => {
  const preload = require(join(ROOT, "thincoder-desktop/src/preload/preload.cjs"))
  assert.equal(preload.CHANNELS.length, 51)
  assert.equal(new Set(preload.CHANNELS).size, 51, "零重复项")
  assert.deepEqual(preload.CHANNELS.slice(-3), ["team:status", "team:login", "team:logout"], "末位三 = 团队族（49–51）")
  assert.equal(preload.EVENT_CHANNELS.length, 24, "订阅面零动")
  const registry = read("thincoder-desktop/src/main/ipc-registry.mjs")
  const table = (registry.match(/const HANDLERS = Object\.freeze\(\{[\s\S]*?\n\}\)/) ?? [""])[0]
  const rows = [...table.matchAll(/"([^"]+)":/g)].map((m) => m[1])
  assert.equal(rows.length, 51)
  assert.deepEqual([...rows].sort(), [...preload.CHANNELS].sort(), "HANDLERS 行集 = 白名单集（闭合）")
  assert.deepEqual(rows.slice(-3), ["team:status", "team:login", "team:logout"], "表尾三行")
  assert.match(read("thincoder-desktop/src/main/ipc.mjs"), /\*\*五十一项\*\*白名单面/)
  assert.match(registry, /\*\*五十一项\*\*（B1 批三新/)
  const preloadSrc = read("thincoder-desktop/src/preload/preload.cjs")
  assert.match(preloadSrc, /请求白名单 = \*\*五十一项\*\*/)
  assert.match(preloadSrc, /→ `team:status` → `team:login` → `team:logout`；顺序供白名单定序断言/)
})

// ─── F 转口档直调（主侧）────────────────────────────────────────────────────────────────────

test("F 转口档：`team:status` 形 ∥ 形门兜底 ∥ 网络不可达 ∥ 无 token 退出", async () => {
  const coreConfig = await import(at("thincoder-core/config-io.mjs"))
  const dir = mkdtempSync(join(tmpdir(), "b1-team-relay-"))
  const cfg = join(dir, "config.json")
  mkdirSync(dir, { recursive: true })
  writeFileSync(cfg, JSON.stringify({ providers: [] }, null, 2))
  coreConfig._setConfigPathForTest(cfg)
  try {
    const team = await import(at("thincoder-desktop/src/main/team.mjs"))
    assert.deepEqual(team.teamStatusChannel(), { ok: true, loggedIn: false, server: null, member: null, label: null }, "未登录回执形")
    assert.deepEqual(await team.teamLoginChannel({}), { ok: false, reason: "network" }, "形门兜底（无地址 ⇒ network）")
    assert.deepEqual(await team.teamLoginChannel({ server: "http://127.0.0.1:1", username: "u", password: "p" }), { ok: false, reason: "network" }, "网络不可达 ⇒ network")
    const logout = await team.teamLogoutChannel()
    assert.equal(logout?.ok, true, "无 token 退出 ⇒ ok")
    assert.notEqual(logout?.revokeDelivered, false, "无 token ⇒ 吊销未达键缺席 ∥ true")
  } finally {
    coreConfig._resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})
