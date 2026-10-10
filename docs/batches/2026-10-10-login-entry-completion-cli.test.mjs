/**
 * 2026-10-10-login-entry-completion-cli.test.mjs — 批内单测件（登录面补全批 · **CLI 面** · 台账 #1229）。
 * 姊妹件 = `2026-10-10-login-entry-completion.test.mjs`（core ∥ 桌面面——在飞批 #149）。
 * 名随批档留存 · 住 `docs/batches/` · 不入仓套件（`thincoder-cli/test/` 收集面为空——单元档随批次本地）。
 * 跑法（`thincoder/` 仓根）：
 *   node --test docs/batches/2026-10-10-login-entry-completion-cli.test.mjs
 *
 * 射程（判据源 = `docs/cli/design/TUI-COMMANDS.md` §3.1 ∥ §5.5 ∥ §1；`docs/cli/design/TUI.md` §7.8
 * 三态；机制单源 = `docs/core/design/TEAM.md` §2.1–§2.6）：
 *   腿1 首启向导两路：route 屏三行（零预选 ∥ 说明行随光标）∥ 团队三问步序列 ∥ 掩码回显（`•`）∧
 *     提交值原样 ∥ 败 ⇒ 四句逐字 + 停留 ∥ 回退 ⇒ route ∧ 已填保留 ∧ 密码零留存 ∥ 本地步负控 ∥
 *     「以后再说」= cancelWizard 语义；
 *   腿2 `/team` 家族：注册两表 ∥ 状态面（未登录句 ∥ argv 同形三行 + 活校验回填）∥ `/team login`
 *     问句面（三问步 ∥ 成 ⇒ 结果行 + 两复读 + 模型选定门）∥ 败四句 + 停留 ∥ 退出（幂等 ∥ 吊销未达）
 *     ∥ 表外子命令/多余参数 ⇒ 用法行；
 *   腿3 状态段三态：未登录零注入（**负控：整行逐字节等价**）∥ 已登录 `<成员>@<主机>`（不搬全串）∥
 *     `invalid` ⇒ 核字典键词形 + 警示色 + 簇尾末位；
 *   腿4 模态族第三支：`modalOpen` 三支 ∥ 键面（Esc 取消 ∥ Enter 提交 ∥ ↑↓/PgUp·PgDn 吞）∥
 *     掩码判据单源（两消费方）。
 * 纪律：零真机 ∥ 零网络（本机 127.0.0.1 stub）∥ 零真实用户配置（临时档——`_setConfigPathForTest` 缝；
 * 收尾复位）。core 面取件经 `thincoder-cli/node_modules/@thincoder/core`（= CLI 源码 `@thincoder/core/*`
 * 所落解析面：缺省 realpath 归并为单实例 ∥ `--preserve-symlinks` 下 CLI 读的即本面——取件取本面两态
 * 皆中；守卫见下），保证配置缝作用到被测代码读到的同一模块实例；全部导入 URL 自 ROOT 派生、
 * 一律取 `realpathSync.native` 规范形（盘符大小写无关——见 ROOT 注）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_RAW = [join(HERE, "..", ".."), join(HERE, "..", "..", "..")]
  .find((d) => existsSync(join(d, "thincoder-cli")) && existsSync(join(d, "thincoder-core")))
if (ROOT_RAW === undefined) throw new Error("按件位未定位到仓库根（须含 thincoder-cli/ 与 thincoder-core/）")
/** 盘符大小写归一（大小写无关——全部导入 URL 自 ROOT 派生）：ROOT 取 `realpathSync.native` 规范形。
 *  Node 模块缓存按 URL 串键：小写盘符调用（本座常态）下派生串带小写盘符，`--preserve-symlinks`
 *  不走 realpath（串即键）⇒ 同档大小写不同 = 两实例；`.native`（句柄派生）盘符恒规范形 ⇒ 夹具与
 *  CLI 图两侧同串。普通 `realpathSync` 对真档保留输入盘符大小写，不足以归一（自检②同取 `.native`）。 */
const ROOT = realpathSync.native(ROOT_RAW)

const mod = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const cli = (rel) => mod(`thincoder-cli/${rel}`)
/** core 面取件（CLI 侧 junction 路径——CLI 源码 `@thincoder/core/*` 所落解析面：缺省 realpath 归并
 *  为单实例；`--preserve-symlinks` 下 CLI 读的即本面、直路 = 另实例（缝须取本面——自检①行为面判）；
 *  ROOT 规范形 ⇒ 本面 URL 与 CLI 图解析基同串（大小写无关）。 */
const coreMod = (rel) => import(pathToFileURL(join(ROOT, "thincoder-cli/node_modules/@thincoder/core", rel)).href)

const { createTuiState } = await cli("src/tui/tui-state.mjs")
const { computeLayout } = await cli("src/tui/layout.mjs")
const { renderFrame } = await cli("src/tui/render-frame.mjs")
const { createWizard } = await cli("src/tui/wizard.mjs")
const { handleWizardKeys, handleTeamAskKeys } = await cli("src/tui/key-handler-modals.mjs")
const { createKeyHandler } = await cli("src/tui/key-handler.mjs")
const { modalOpen } = await cli("src/tui/timer-watch.mjs")
const { askMaskActive } = await cli("src/tui/ask-steps.mjs")
const { SLASH_COMMANDS, HANDLERS } = await cli("src/tui/slash-commands.mjs")
const team = await cli("src/tui/cmd-team.mjs")
const argv = await cli("src/cli/team-command.mjs")
const cfgIo = await coreMod("config-io.mjs")
const { t } = await coreMod("i18n.mjs")

// ─── 夹具自检：缝作用到 CLI 源码所读实例（行为面）∥ 两取件面同源（realpath 等价）──────────────────
{
  // ① 行为面：缝设在 `cfgIo` ⇒ CLI 链（cmd-team → 核 team/config/…）须读到同一实例。
  //    （对象同一性断言不可跨环境：缺省 realpath 归并下两面同实例；`--preserve-symlinks` 下两面分体、
  //    而 CLI 读的正是 junction 面——彼时直路取件会静默脱缝，故以行为判。）
  const probeDir = mkdtempSync(join(tmpdir(), "thincoder-login-cli-probe-"))
  const probeCfg = join(probeDir, "config.json")
  writeFileSync(probeCfg, JSON.stringify({ team: { server: "https://probe.invalid", member: { username: "probe" }, label: "probe", token: "tk-probe" } }))
  let probeSeen
  try {
    cfgIo._setConfigPathForTest(probeCfg)
    probeSeen = team.refreshTeamState({})
  } finally {
    cfgIo._resetConfigPathForTest()
    rmSync(probeDir, { recursive: true, force: true })
  }
  assert.equal(probeSeen?.server, "https://probe.invalid", "配置缝须作用到 CLI 所读实例（脱缝 ⇒ 测试会读写真实用户配置）")

  // ② 同源面：junction 的 realpath = 本仓 core 树（两取件面同一真实档）。两边同取 `.native` 规范形——
  //    普通 `realpathSync` 对真档保留输入盘符大小写（junction 侧 = 目标形 `D:`）⇒ 小写盘符下两串相异 = 假红。
  assert.equal(realpathSync.native(join(ROOT, "thincoder-cli/node_modules/@thincoder/core")), realpathSync.native(join(ROOT, "thincoder-core")), "core 取件两面同源：junction ⇒ realpath = thincoder-core/（native 规范形）")
}

// ─── 夹具 ──────────────────────────────────────────────────────────────────────────────────────

const TMP = mkdtempSync(join(tmpdir(), "thincoder-login-cli-"))
const CFG = join(TMP, "config.json")

const NOT_LOGGED_IN = "未登录——登录后可用"
const FAIL_NETWORK = "网络不可达"
const FAIL_CREDENTIALS = "用户名或密码错误"
const TEXT_MANUAL_CONFLICT = "已存在同名 provider「team」——未自动添加；请改名或删除后重登"
const TEXT_REVOKE_UNDELIVERED = "服务端吊销未达"

test.before(() => { cfgIo._setConfigPathForTest(CFG) })
test.after(() => {
  cfgIo._resetConfigPathForTest()
  rmSync(TMP, { recursive: true, force: true })
})

const writeConfig = (obj) => writeFileSync(CFG, JSON.stringify(obj, null, 2))
const readConfig = () => JSON.parse(readFileSync(CFG, "utf8"))

function makeAgent(extra = {}) {
  return { providers: [], config: {}, provider: null, cwd: ROOT, tasks: [], _pendingTimers: [], ...extra }
}

/** ctx 夹具：真实 state（createTuiState）+ 记录型 pushLine/render + 可观察的 picker/闩转口。 */
function makeCtx(extra = {}) {
  const agent = extra.agent ?? makeAgent()
  const state = createTuiState({ cols: 100, rows: 30, agent })
  state._agent = agent
  const lines = []
  const calls = { renders: 0, pickers: 0, modalCloses: 0 }
  const ctx = {
    agent, state, lines, calls,
    pushLine: (text, color) => { lines.push({ text, color }) },
    pushLabel: (text, color) => { lines.push({ text, color }) },
    render: () => { calls.renders++ },
    persistRaw: async () => {},
    showPicker: async () => null,
    openModelPicker: async () => { calls.pickers++; return null },
    onModalClose: () => { calls.modalCloses++ },
  }
  return ctx
}

/** 向导键面 ctx（handleWizardKeys 消费面）。 */
const keyCtx = (ctx, wiz) => ({
  ...ctx,
  renderWizard: wiz.renderWizard, cancelWizard: wiz.cancelWizard, wizardSubmitText: wiz.wizardSubmitText,
  wizardChooseProvider: wiz.wizardChooseProvider, wizardProviderItems: wiz.wizardProviderItems,
  wizardRouteItems: wiz.wizardRouteItems, wizardChooseRoute: wiz.wizardChooseRoute,
  wizardBackToRoute: wiz.wizardBackToRoute,
})

/** 本机 stub（login ∥ logout ∥ me 三端点；`seen` 记录请求体——提交值原样判据）。 */
async function startStub(opts = {}) {
  const seen = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (c) => { raw += c })
    req.on("end", () => {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization ?? null, body: raw })
      if (req.url === "/api/client/login") {
        const st = opts.login?.status ?? 200
        res.writeHead(st, { "content-type": "application/json" })
        res.end(JSON.stringify(opts.login?.body ?? { token: "tk-1", member: { username: "u", name: "U" } }))
        return
      }
      if (req.url === "/api/client/logout") { res.writeHead(opts.logout?.status ?? 200); res.end("{}"); return }
      if (req.url === "/api/client/me") { res.writeHead(opts.me?.status ?? 200); res.end("{}"); return }
      res.writeHead(404); res.end("{}")
    })
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  return { base: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((r) => server.close(r)) }
}

/** 驱向导至团队第 N 步（`stop` = "server" ∥ "username" ∥ "password"）。 */
function driveTeam(wiz, ctx, stop = "password", server = "https://t.example") {
  wiz.startWizard()
  wiz.wizardChooseRoute(wiz.wizardRouteItems()[0])
  const steps = ["server", "username", "password"]
  const values = [server, "bob", "hunter2"]
  for (const step of steps) {
    if (ctx.state.wizard.step !== step) throw new Error(`步序异常：期望 ${step}，实为 ${ctx.state.wizard.step}`)
    if (step === stop) return
    ctx.state.input = [...values[steps.indexOf(step)]]
    ctx.state.cursor = ctx.state.input.length
    wiz.wizardSubmitText()
  }
}

const statusLine = (state, agent) => renderFrame(state, agent, { cols: 140, rows: 30, slashCommands: SLASH_COMMANDS })
  .frame.split("\r\n").at(-1)

// ─── 腿 1 · 首启向导两路（TUI-COMMANDS.md §3.1）────────────────────────────────────────────────

test("腿1a route 屏：三行在场（零预选 = 首行光标）∥ 说明行随光标 ∥ 词面逐字", async () => {
  writeConfig({})
  const ctx = makeCtx()
  const wiz = createWizard(ctx)
  wiz.startWizard()
  const w = ctx.state.wizard
  assert.equal(w.step, "route", "首屏 = route（向导入口）")
  assert.equal(w.index, 0, "零预选：光标 = 首行")
  const texts = () => ctx.state.wizard.lines.map((l) => l.text)
  assert.ok(texts().some((x) => x === " ▸ 登录团队服务器"), "① 选中行（光标高亮）")
  assert.ok(texts().some((x) => x === "   配置本地 provider"), "② 在场")
  assert.ok(texts().some((x) => x === "   以后再说"), "③ 在场")
  assert.ok(texts().some((x) => x.includes("用团队发的账号登录——模型由服务器提供，不用自己填 key")), "① 说明行逐字（团队卡）")
  assert.ok(!texts().some((x) => x.includes("自己填 API key，不依赖团队服务器")), "说明行随光标（未选中不出）")

  handleWizardKeys("", { name: "down" }, keyCtx(ctx, wiz))
  assert.equal(w.index, 1)
  assert.ok(texts().some((x) => x === " ▸ 配置本地 provider"))
  assert.ok(texts().some((x) => x.includes("自己填 API key，不依赖团队服务器")), "② 说明行随光标在场")
  assert.ok(!texts().some((x) => x.includes("用团队发的账号登录")), "① 说明行退场")

  handleWizardKeys("", { name: "up" }, keyCtx(ctx, wiz))
  handleWizardKeys("", { name: "up" }, keyCtx(ctx, wiz))
  assert.equal(w.index, 2, "↑ 环绕（终端列表惯例）")
})

test("腿1b 选①⇒ 团队三问步：序列 server → username → password ∥ 掩码回显（•）∧ 提交值原样 ∥ 留存预填", async () => {
  writeConfig({ team: { server: "https://team.example", member: { username: "alice", name: "Alice" }, label: "l" } })
  const ctx = makeCtx()
  const wiz = createWizard(ctx)
  wiz.startWizard()
  wiz.wizardChooseRoute(wiz.wizardRouteItems()[0])
  const w = ctx.state.wizard
  assert.equal(w.step, "server", "步序 = server → username → password")
  assert.equal(ctx.state.input.join(""), "https://team.example", "表单预填（核留存快照——TEAM.md §2.1）")

  ctx.state.input = [..."https://t.example"]
  ctx.state.cursor = ctx.state.input.length
  await wiz.wizardSubmitText()
  assert.equal(w.step, "username")
  assert.equal(w.team.server, "https://t.example", "地址步提交（trim 口径）")
  assert.equal(ctx.state.input.join(""), "alice", "账号步预填替换为空（地址已改）")

  ctx.state.input = [..."bob"]
  await wiz.wizardSubmitText()
  assert.equal(w.step, "password")
  assert.equal(w.team.username, "bob")
  assert.equal(ctx.state.input.length, 0, "密码零预填")

  ctx.state.input = [..."hunter2"]
  ctx.state.cursor = ctx.state.input.length
  const box = computeLayout(ctx.state, { cols: 100, rows: 30 }).boxLines.join("\n")
  assert.ok(box.includes("•••••••"), "掩码回显（每字符 •）")
  assert.ok(!box.includes("hunter2"), "明文零上屏")
  assert.equal(ctx.state.input.join(""), "hunter2", "提交值原样（显示层变换）")
})

test("腿1c 登录败：四句逐字就地 + 停留可重试（步不动 ∥ 密码零留存）", async () => {
  const stub = await startStub({ login: { status: 401 } })
  try {
    writeConfig({})
    const ctx = makeCtx()
    const wiz = createWizard(ctx)
    driveTeam(wiz, ctx, "password", stub.base)
    const w = ctx.state.wizard
    ctx.state.input = [..."hunter2"]
    await wiz.wizardSubmitText()
    assert.equal(ctx.state.wizard, w, "败 ⇒ 停留（面不散）")
    assert.equal(w.step, "password", "步不动（就地重试）")
    assert.equal(w.error, FAIL_CREDENTIALS, "四句逐字（credentials）")
    assert.ok(w.lines.some((l) => l.text.includes(FAIL_CREDENTIALS)), "失败行就地出")
    assert.equal(ctx.state.input.length, 0, "输入框清空（密码零留存——重试重输）")
    assert.ok(!JSON.stringify(ctx.state.wizard).includes("hunter2"), "面体态零明文密码")

    // 停留可重试：原地再提交一次（同一步）——仍就地出词
    ctx.state.input = [..."hunter3"]
    await wiz.wizardSubmitText()
    assert.equal(ctx.state.wizard, w)
    assert.equal(w.error, FAIL_CREDENTIALS)
  } finally { await stub.close() }
})

test("腿1d 回退：「← 换一种方式」↑ 聚焦 + Enter ⇒ route 在场 ∧ 已填保留 ∧ 密码零留存", async () => {
  writeConfig({})
  const ctx = makeCtx()
  const wiz = createWizard(ctx)
  const kc = keyCtx(ctx, wiz)
  driveTeam(wiz, ctx, "server")
  ctx.state.input = [..."https://t.example"]
  await wiz.wizardSubmitText()
  ctx.state.input = [..."bob"]
  await wiz.wizardSubmitText()
  assert.equal(ctx.state.wizard.step, "password")
  ctx.state.input = [..."hunter2"] // 未提交的密码（回退即弃）
  ctx.state.cursor = ctx.state.input.length

  handleWizardKeys("", { name: "up" }, kc)
  assert.equal(ctx.state.wizard.teamFocusBack, true, "↑ 聚焦回退行")
  const focused = ctx.state.wizard.lines.find((l) => l.text.includes("← 换一种方式"))
  assert.ok(focused.text.includes("Enter 确认"), "焦点态行文本自含可见提示（不得藏键）")
  handleWizardKeys("", { name: "return" }, kc)
  assert.equal(ctx.state.wizard.step, "route", "回退 ⇒ route 屏")
  assert.equal(ctx.state.wizard.teamFocusBack, false, "焦点复位")
  assert.equal(ctx.state.wizard.team.server, "https://t.example", "已填保留（地址）")
  assert.equal(ctx.state.wizard.team.username, "bob", "已填保留（账号）")
  assert.equal(ctx.state.input.length, 0, "输入框归还")
  assert.ok(!JSON.stringify(ctx.state).includes("hunter2"), "密码恒不保留（回退即清——状态面零明文）")

  // 回退后再入团队路：留存值仍在（同会话保真）且密码步仍空
  wiz.wizardChooseRoute(wiz.wizardRouteItems()[0])
  assert.equal(ctx.state.input.join(""), "https://t.example", "已填保留（地址——再入预填）")
  ctx.state.input = [..."https://t.example"]
  await wiz.wizardSubmitText()
  ctx.state.input = [..."bob"]
  await wiz.wizardSubmitText()
  assert.equal(ctx.state.wizard.step, "password")
  assert.equal(ctx.state.input.length, 0)
})

test("腿1e 选②⇒ 既有 provider 步逐字等价（负控）∥ 回退行 = 列表末行（Enter 回 route）", async () => {
  writeConfig({ providers: [{ name: "mine", baseURL: "https://mine.example/v1", apiKey: "sk-x" }] })
  const ctx = makeCtx({ agent: makeAgent({ providers: [{ name: "mine", baseURL: "https://mine.example/v1", apiKey: "sk-x" }] }) })
  const wiz = createWizard(ctx)
  wiz.startWizard()
  wiz.wizardChooseRoute(wiz.wizardRouteItems()[1])
  assert.equal(ctx.state.wizard.step, "provider", "② ⇒ 既有 provider 步（零改）")
  const items = wiz.wizardProviderItems()
  assert.equal(items[0].kind, "existing")
  assert.equal(items[0].label, "mine (added)", "既有条目词面零改")
  assert.equal(items.at(-1).kind, "back", "回退行 = 列表末行")
  assert.equal(items.at(-1).label, "← 换一种方式", "行文本逐字")
  assert.ok(ctx.state.wizard.lines.some((l) => l.text.includes("← 换一种方式")), "列表可见")

  const preset = items.find((i) => i.kind === "preset")
  wiz.wizardChooseProvider(preset)
  assert.equal(ctx.state.wizard.step, "key", "预设选中 ⇒ 既有 key 步（负控）")
  assert.equal(ctx.state.wizard.fields.name, preset.name)

  // 回退行 Enter ⇒ 回 route（本地步 1 在场点）
  wiz.wizardChooseRoute(wiz.wizardRouteItems()[1])
  wiz.wizardChooseProvider(wiz.wizardProviderItems().at(-1))
  assert.equal(ctx.state.wizard.step, "route")
})

test("腿1f 「以后再说」⇒ 退场 + Skipped 提示行（既有 cancelWizard 语义——无半配置落盘）", async () => {
  writeConfig({})
  const ctx = makeCtx()
  const wiz = createWizard(ctx)
  wiz.startWizard()
  wiz.wizardChooseRoute(wiz.wizardRouteItems()[2])
  assert.equal(ctx.state.wizard, null, "退场")
  assert.ok(ctx.lines.some((l) => l.text.startsWith("Skipped initial setup")), "既有提示行")
  assert.deepEqual(readConfig(), {}, "零半配置落盘")
})

// ─── 腿 2 · `/team` 家族（TUI-COMMANDS.md §5.5）────────────────────────────────────────────────

test("腿2a 注册面：SLASH_COMMANDS 含 /team 行 ∥ HANDLERS 映射在场", () => {
  const row = SLASH_COMMANDS.find((c) => c.name === "/team")
  assert.ok(row, "SLASH_COMMANDS 含 /team")
  assert.equal(row.group, "System")
  assert.equal(HANDLERS["/team"], team.handleTeamCommand, "HANDLERS 映射 = cmd-team 入口")
})

test("腿2b `/team` ∥ `/team status`：未登录逐字句 ∥ 已登录 argv 同形三行 + 活校验回填（invalid ∥ unreachable）", async () => {
  writeConfig({})
  const ctx = makeCtx()
  await team.handleTeamCommand(ctx, [])
  assert.equal(ctx.lines.at(-1).text, NOT_LOGGED_IN, "未登录 ⇒ 未登录句逐字")
  assert.equal(ctx.state.team.loggedIn, false, "state.team 复读")

  const stub = await startStub({ me: { status: 200 } })
  try {
    const member = { username: "u", name: "U" }
    writeConfig({ team: { server: stub.base, member, label: "lab", token: "tk-1" } })
    const ctx2 = makeCtx()
    await team.handleTeamCommand(ctx2, ["status"])
    const texts = ctx2.lines.map((l) => l.text)
    assert.deepEqual(texts, [`Server: ${stub.base}`, "Member: U (u)", "Label:  lab"], "argv `team status` 同形三行")
    assert.equal(ctx2.state.team.verify, "valid", "活校验回填（写者③）")
    assert.equal(ctx2.state.team.loggedIn, true)

    // invalid ⇒ 追词句（核字典键词形）+ 回填
    const stub401 = await startStub({ me: { status: 401 } })
    writeConfig({ team: { server: stub401.base, member, label: "lab", token: "tk-1" } })
    const ctx3 = makeCtx()
    await team.handleTeamCommand(ctx3, ["status"])
    assert.equal(ctx3.state.team.verify, "invalid")
    assert.ok(ctx3.lines.some((l) => l.text === t("status.team.invalid")), "追「已失效」句（词面单源 = 核字典键）")
    await stub401.close()

    // unreachable（非 401 失败）⇒ 照本地（零提示行——离线容忍）
    const stub500 = await startStub({ me: { status: 500 } })
    writeConfig({ team: { server: stub500.base, member, label: "lab", token: "tk-1" } })
    const ctx4 = makeCtx()
    await team.handleTeamCommand(ctx4, ["status"])
    assert.equal(ctx4.state.team.verify, "unreachable")
    assert.deepEqual(ctx4.lines.map((l) => l.text), [`Server: ${stub500.base}`, "Member: U (u)", "Label:  lab"], "不判失效——零追加行")
    await stub500.close()
  } finally { await stub.close() }
})

test("腿1c2 失败四句另两句：不可达 ⇒ 网络不可达 ∥ 根非对象 ⇒ 本机配置写入失败（均停留可重试）", async () => {
  writeConfig({})
  const ctx = makeCtx()
  const wiz = createWizard(ctx)
  driveTeam(wiz, ctx, "password", "http://127.0.0.1:1") // 关闭端口 ⇒ 不可达
  ctx.state.input = [..."hunter2"]
  await wiz.wizardSubmitText()
  assert.equal(ctx.state.wizard.error, FAIL_NETWORK, "网络不可达（逐字）")
  assert.equal(ctx.state.wizard.step, "password", "停留可重试")

  // 根非对象（核拒写面）⇒ write_failed
  writeFileSync(CFG, "[]")
  const ctx2 = makeCtx()
  const wiz2 = createWizard(ctx2)
  const stub = await startStub()
  try {
    driveTeam(wiz2, ctx2, "password", stub.base)
    ctx2.state.input = [..."hunter2"]
    await wiz2.wizardSubmitText()
    assert.equal(ctx2.state.wizard.error, "本机配置写入失败", "write_failed（逐字）")
    assert.equal(ctx2.state.wizard.step, "password", "停留可重试")
  } finally { await stub.close() }
})

test("腿2c `/team login` 问句面：三问步 ∥ 成 ⇒ 面退场 + 结果行 + 两复读 + 模型选定门", async () => {
  const stub = await startStub()
  try {
    writeConfig({ team: { server: "https://old.example", member: { username: "old" }, label: "old" } })
    const ctx = makeCtx()
    await team.handleTeamCommand(ctx, ["login"])
    const face = ctx.state.teamAsk
    assert.ok(face, "问句面在场（模态族第三支）")
    assert.equal(face.step, "server")
    assert.equal(ctx.state.input.join(""), "https://old.example", "表单预填（留存快照）")

    ctx.state.input = [...stub.base]
    await team.teamAskSubmit(ctx)
    assert.equal(ctx.state.teamAsk.step, "username")
    assert.equal(ctx.state.input.join(""), "old", "账号预填")
    ctx.state.input = [..."u"]
    await team.teamAskSubmit(ctx)
    assert.equal(ctx.state.teamAsk.step, "password")
    assert.equal(ctx.state.input.length, 0)
    ctx.state.input = [..."pw-1"]
    // 掩码（面体同源判据）
    assert.equal(askMaskActive(ctx.state), true)
    const box = computeLayout(ctx.state, { cols: 100, rows: 30 }).boxLines.join("\n")
    assert.ok(box.includes("••••") && !box.includes("pw-1"), "掩码回显（/team login 面同源）")
    await team.teamAskSubmit(ctx)

    assert.equal(ctx.state.teamAsk, null, "成 ⇒ 面退场")
    const texts = ctx.lines.map((l) => l.text)
    assert.ok(texts.includes("Logged in."), "结果行首句（argv 同形）")
    assert.ok(texts.includes("Server: " + stub.base), "结果行三行同形")
    assert.equal(ctx.state.team.loggedIn, true, "state.team 复读")
    assert.equal(ctx.state.team.verify, null, "重登成 ⇒ verify 清（新 token 新判）")
    assert.ok(ctx.agent.providers.some((p) => p.name === "team" && p.derived === true), "渠道列表复读（派生条目在场）")
    assert.equal(ctx.calls.pickers, 1, "defaultModel 未设 ⇒ 追开模型 picker")
    assert.equal(stub.seen[0].url, "/api/client/login")
    assert.equal(JSON.parse(stub.seen[0].body).password, "pw-1", "提交值原样（掩码只在显示层）")
  } finally { await stub.close() }
})

test("腿2c2 defaultModel 已设 ⇒ 零打断（不弹模型 picker）", async () => {
  const stub = await startStub()
  try {
    writeConfig({ defaultModel: "deepseek:deepseek-chat" })
    const ctx = makeCtx()
    await team.handleTeamCommand(ctx, ["login"])
    ctx.state.input = [...stub.base]
    await team.teamAskSubmit(ctx)
    ctx.state.input = [..."u"]
    await team.teamAskSubmit(ctx)
    ctx.state.input = [..."pw-1"]
    await team.teamAskSubmit(ctx)
    assert.equal(ctx.calls.pickers, 0, "已设 ⇒ 零打断")
    assert.equal(ctx.state.teamAsk, null)
  } finally { await stub.close() }
})

test("腿2d `/team login` 败 ⇒ 四句逐字 + 面停留可重试（Esc ⇒ 退场归还输入框）", async () => {
  const stub = await startStub({ login: { status: 429 } })
  try {
    writeConfig({})
    const ctx = makeCtx()
    await team.handleTeamCommand(ctx, ["login"])
    ctx.state.input = [...stub.base]
    await team.teamAskSubmit(ctx)
    ctx.state.input = [..."u"]
    await team.teamAskSubmit(ctx)
    ctx.state.input = [..."pw-1"]
    await team.teamAskSubmit(ctx)
    const face = ctx.state.teamAsk
    assert.ok(face, "败 ⇒ 停留（面不散）")
    assert.equal(face.error, "登录尝试过于频繁", "四句逐字（rate_limited）")
    assert.ok(face.lines.some((l) => l.text.includes("登录尝试过于频繁")), "失败行就地出")
    assert.equal(ctx.state.input.length, 0, "输入框清空（密码零留存）")

    // Esc ⇒ 退场（键面转口）+ 输入框归还 + 闩重武装
    const closes = ctx.calls.modalCloses
    handleTeamAskKeys("", { name: "escape" }, { ...ctx, teamAskSubmit: () => team.teamAskSubmit(ctx), teamAskCancel: () => team.teamAskCancel(ctx) })
    assert.equal(ctx.state.teamAsk, null)
    assert.equal(ctx.calls.modalCloses, closes + 1, "#448① 面退场 ⇒ 闩重武装")
  } finally { await stub.close() }
})

test("腿2e `/team logout`：未登录幂等 ∥ 成 ⇒ 结果行 + 撤销未达一次性提示 + 两复读", async () => {
  writeConfig({})
  const ctx = makeCtx()
  await team.handleTeamCommand(ctx, ["logout"])
  assert.equal(ctx.lines.at(-1).text, NOT_LOGGED_IN, "未登录 ⇒ 未登录句（零动作）")

  const stub = await startStub()
  try {
    writeConfig({
      team: { server: stub.base, member: { username: "u", name: "U" }, label: "lab", token: "tk-1" },
      providers: [{ name: "team", baseURL: `${stub.base}/v1`, apiKey: "tk-1", derived: true }],
    })
    const ctx2 = makeCtx()
    await team.handleTeamCommand(ctx2, ["logout"])
    assert.ok(ctx2.lines.some((l) => l.text === "Logged out."), "结果行")
    assert.equal(ctx2.state.team.loggedIn, false, "state.team 复读")
    assert.equal(ctx2.state.team.verify, null, "token 摘除 ⇒ verify 清")
    const diskTeam = readConfig().team
    assert.equal(diskTeam.token, undefined, "核写面：token 摘除（server/member/label 留存）")
    assert.equal(ctx2.agent.providers.find((p) => p.name === "team")?.apiKey, undefined, "渠道列表复读（派生条目失 key）")

    // 吊销未达：服务端不可达（stub 关后同址）⇒ 一次性提示逐字
    writeConfig({ team: { server: stub.base, member: { username: "u", name: "U" }, label: "lab", token: "tk-2" } })
    await stub.close()
    const ctx3 = makeCtx()
    await team.handleTeamCommand(ctx3, ["logout"])
    assert.ok(ctx3.lines.some((l) => l.text === TEXT_REVOKE_UNDELIVERED), "「服务端吊销未达」逐字")
    assert.equal(ctx3.state.team.loggedIn, false, "本地照清")
  } finally { await stub.close().catch(() => {}) }
})

test("腿2f 表外子命令 ∥ 多余参数 ⇒ 用法行（fail-closed——零动作）", async () => {
  writeConfig({ services: undefined })
  const ctx = makeCtx()
  await team.handleTeamCommand(ctx, ["frobnicate"])
  assert.equal(ctx.lines.at(-1).text, team.TEAM_USAGE)
  const ctx2 = makeCtx()
  await team.handleTeamCommand(ctx2, ["login", "--server", "x"])
  assert.equal(ctx2.lines.at(-1).text, team.TEAM_USAGE, "三问面零旗标（旗标面属 argv 命令）")
  assert.equal(ctx2.state.teamAsk, null, "零动作")
  const ctx3 = makeCtx()
  await team.handleTeamCommand(ctx3, ["status", "x"])
  assert.equal(ctx3.lines.at(-1).text, team.TEAM_USAGE)
})

test("腿2g 同名冲突一次性提示（notice 码 ⇒ 文逐字）：登录成仍出结果行 + 提示行", async () => {
  const stub = await startStub()
  try {
    writeConfig({ providers: [{ name: "team", baseURL: "https://manual.example/v1", apiKey: "sk-manual" }] })
    const ctx = makeCtx({ agent: makeAgent({ providers: [{ name: "team", baseURL: "https://manual.example/v1", apiKey: "sk-manual" }] }) })
    await team.handleTeamCommand(ctx, ["login"])
    ctx.state.input = [...stub.base]
    await team.teamAskSubmit(ctx)
    ctx.state.input = [..."u"]
    await team.teamAskSubmit(ctx)
    ctx.state.input = [..."pw-1"]
    await team.teamAskSubmit(ctx)
    assert.ok(ctx.lines.some((l) => l.text === TEXT_MANUAL_CONFLICT), "提示逐字")
    assert.equal(ctx.state.team.loggedIn, true, "登录成（不覆盖手工条目）")
    assert.equal(readConfig().providers[0].baseURL, "https://manual.example/v1", "手工条目零覆盖")
  } finally { await stub.close() }
})

// ─── 腿 3 · 状态段三态（TUI.md §7.8）──────────────────────────────────────────────────────────

test("腿3 状态段三态：未登录零注入（负控逐字节）∥ 已登录 <成员>@<主机> ∥ invalid 词形 + 警示色 + 簇尾末位", () => {
  const agent = makeAgent()
  const mk = (teamSlice) => {
    const state = createTuiState({ cols: 140, rows: 30, agent })
    state._agent = agent
    if (teamSlice !== undefined) state.team = teamSlice
    return state
  }
  const loggedOut = { loggedIn: false, member: null, server: null, label: null, verify: null }
  const lineLoggedOut = statusLine(mk(loggedOut), agent)
  const preBatchState = mk(undefined)
  delete preBatchState.team // 真「批前形」：切片键缺席（非「缺省值同形」——两侧夹具须真不同）
  const lineNoSlice = statusLine(preBatchState, agent)
  assert.equal(lineLoggedOut, lineNoSlice, "未登录 ⇒ 零注入（整行逐字节等价——负控）")

  const lineIn = statusLine(mk({ loggedIn: true, member: { username: "u", name: "U" }, server: "https://t.example:8443", label: "lab", verify: "valid" }), agent)
  assert.ok(lineIn.includes(" │ U@t.example:8443"), "成员名 + 主机（URL.host——非默认端口保留）")
  assert.ok(!lineIn.includes("https://t.example"), "不搬 URL 全串")

  const lineNoName = statusLine(mk({ loggedIn: true, member: { username: "u" }, server: "https://t.example", label: "lab", verify: null }), agent)
  assert.ok(lineNoName.includes(" │ u@t.example"), "member.name ?? member.username（缺名回退用户名）+ 默认端口去")

  const lineInvalid = statusLine(mk({ loggedIn: true, member: { username: "u" }, server: "https://t.example", label: "lab", verify: "invalid" }), agent)
  assert.ok(lineInvalid.includes(t("status.team.invalid")), "核字典键词形（CLI 现渲缺省 en）")
  assert.ok(lineInvalid.includes("\x1b[33m"), "警示色（同 timerHint 到期态形）")
  assert.ok(!lineInvalid.includes("u@t.example"), "失效态段转词（不并显成员段）")
  assert.ok(lineInvalid.indexOf(t("status.team.invalid")) < lineInvalid.indexOf("│ Enter: send"), "簇尾末位（enterHint 之前）")

  // 半态：verify = unreachable ⇒ 照本地（成员段在场，无警示色段）
  const lineUnreach = statusLine(mk({ loggedIn: true, member: { username: "u" }, server: "https://t.example", label: "lab", verify: "unreachable" }), agent)
  assert.ok(lineUnreach.includes(" │ u@t.example"), "unreachable ⇒ 照本地（离线容忍）")
  assert.ok(!lineUnreach.includes(t("status.team.invalid")))
})

// ─── 腿 4 · 模态族第三支（键面 ∥ 模态判据 ∥ 掩码单源）────────────────────────────────────────

test("腿4 模态族第三支：modalOpen 三支真值 ∥ 键面（Enter 提交 ∥ ↑↓/PgUp·PgDn 吞）∥ 掩码判据单源", async () => {
  assert.equal(modalOpen({}), false)
  assert.equal(modalOpen({ picker: { lines: [] } }), true, "picker（既有）")
  assert.equal(modalOpen({ wizard: {} }), true, "wizard（既有）")
  assert.equal(modalOpen({ teamAsk: { lines: [] } }), true, "团队问句面（本批——#448① 抑制计入）")

  writeConfig({})
  const ctx = makeCtx()
  await team.handleTeamCommand(ctx, ["login"])
  const submit = (key) => handleTeamAskKeys("", key, { ...ctx, teamAskSubmit: () => team.teamAskSubmit(ctx), teamAskCancel: () => team.teamAskCancel(ctx) })
  assert.equal(submit({ name: "pageup" }), true, "PgUp 吞（不触发 loadOlder）")
  assert.equal(ctx.state.teamAsk.step, "server")
  ctx.state.input = [..."https://t.example"]
  submit({ name: "return" })
  await new Promise((r) => setTimeout(r, 0)) // 提交为异步（步内推进同步 + 末步核调）
  assert.equal(ctx.state.teamAsk.step, "username", "Enter 提交当前步")

  // 掩码判据单源（两消费方）
  const wizCtx = makeCtx()
  const wiz = createWizard(wizCtx)
  driveTeam(wiz, wizCtx, "password")
  assert.equal(askMaskActive(wizCtx.state), true, "向导密码步")
  wizCtx.state.wizard.step = "username"
  assert.equal(askMaskActive(wizCtx.state), false, "非掩码步")
  assert.equal(askMaskActive(ctx.state), false, "问句面非掩码步")
  ctx.state.teamAsk.step = "password"
  assert.equal(askMaskActive(ctx.state), true, "问句面密码步")
  assert.equal(askMaskActive({}), false, "零面")
})

test("腿4b 键面转口（真实 createKeyHandler）：向导 route ↑↓/Enter ∥ 团队步 ↑ 聚焦 ∥ 问句面 Esc", async () => {
  writeConfig({})
  const ctx = makeCtx()
  const wiz = createWizard(ctx)
  const noop = () => {}
  const handler = createKeyHandler({
    ...keyCtx(ctx, wiz),
    renderPickerLines: noop, popPicker: noop, handleSlash: noop, handleTab: noop, submit: noop,
    pasteClipboardImage: noop, pushLine: ctx.pushLine, cleanup: noop, showPicker: async () => null, loadOlder: noop,
    teamAskSubmit: () => team.teamAskSubmit(ctx), teamAskCancel: () => team.teamAskCancel(ctx),
  })
  wiz.startWizard()
  handler("", { name: "down" })
  assert.equal(ctx.state.wizard.index, 1, "守卫：route 步 ↑↓ 归向导（不落历史导航）")
  handler("", { name: "return" })
  assert.equal(ctx.state.wizard.step, "provider", "② 选中 ⇒ 既有 provider 步")
  handler("", { name: "escape" })
  assert.equal(ctx.state.wizard, null, "Esc 恒可跳（既有语义）")

  // 团队步：↑ 聚焦（全键归面）⇒ Enter 回退
  driveTeam(wiz, ctx, "username")
  handler("", { name: "up" })
  assert.equal(ctx.state.wizard.teamFocusBack, true)
  handler("a") // 焦点在场 ⇒ 零输入（吞）
  assert.equal(ctx.state.input.length, 0, "焦点在场 ⇒ 零输入")
  handler("", { name: "down" })
  assert.equal(ctx.state.wizard.teamFocusBack, false, "↓ 回输入框")
  handler("", { name: "up" })
  handler("", { name: "return" })
  assert.equal(ctx.state.wizard.step, "route", "Enter 确认回退")

  // 问句面（序 2b）：Esc 退场（先退向导面——两面不同时在场）
  ctx.state.wizard = null
  await team.handleTeamCommand(ctx, ["login"])
  assert.ok(ctx.state.teamAsk)
  handler("", { name: "escape" })
  assert.equal(ctx.state.teamAsk, null, "守卫：问句面 Esc ⇒ 取消（不落其他族）")
})
