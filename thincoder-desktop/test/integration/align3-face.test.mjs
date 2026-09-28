/**
 * align3-face.test.mjs — E2E 用例 `T-DSK42` / `T-DSK43`（「对齐第三批 · 小修族」真机面 —— 真 Electron 直驱；
 * 设计单源 = `docs/desktop/design/E2E-TESTING.md` §6 两行 + `docs/desktop/design/PROJECT.md` §7 两行；
 * 机制 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」）。
 * 域界 = 目录界：本档住 `test/integration/`（真进程 / 真窗口 / 真 DOM ⇒ 真解析面）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 四者同指该家；
 * userData 面 `--user-data-dir=<家>/userData`；摘 `ELECTRON_RUN_AS_NODE`（先例 = T-DSK27 / 32 / 37 / 39 / 40）。
 * 夹具（两用例同源）：`config.json` = `{"locale":"en"}`（向导跳过）+ 会话槽族档（`cwd` = PROJ；回放历史 =
 * 核线形（`role` / `content` / `tool_calls` / `tool_call_id`）⇒ 页读产工具卡；末 `user` 块 ⇒ 错误横幅重试钮在场）。
 * **离线可产断言面**（本档）：T-DSK42 ① 工具卡头（名称 / 参数 / 摘要段 —— 活卡三注入）+ ③ 错误横幅文 + 重试钮
 * （`ev:error` 注入 —— 主进程 `webContents.send`（宿主 emit 同径）；**剔 `techInfo`** ⇒ details 面留真机）+
 * ④ `no-message` 欢迎条三行；T-DSK43 ④ 设置面具名控件 + `change` ⇒ 即改即存（盘上回读）+ ⑤ 设置面开 ⇒ Esc ⇒ 清空。
 * **离线不可产面**（登记 = E2E-TESTING.md §6；人工走查 + 父侧真跑闭合）：T-DSK42 ② 停止痕 / ⑤ 文件链接 ·
 * T-DSK43 ①②③⑥ 子代理门审批 / 提问卡键焦 / 忙态写门 / 审批卡真置焦。
 * 壳体面 = **单窗体两用例共用**（`before` / `after` 钩 —— 与同域 `chat-render` 同量级；同域文件的 hover 读数
 * 对并行实例敏感，两枚壳体叠加会扰动邻档 ⇒ 一档一窗体）。
 * 边界：零文案匹配（断言走 `data-*` 锚 / 态值 / 盘上回读；例外 = 摘要段与欢迎条两处**设计钉死字面** ——
 * 后者口径沿 T-DSK37 ⑪ 先例）· 不出网（零渠道；活卡三注入 = 合成载荷，全链走生产码）· 不截图（本批无 PNG 判据）。
 * 用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BF** / **BG**。
 */
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright-core"

/** 应用根（`package.json` 所在 —— `args: ["."]` 的解析基址；与 runner 的 cwd 无关）。 */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
/** 等待上限（真进程冷启 + IPC 往返 ⇒ 比单元域宽一档）。 */
const WAIT = { timeout: 30000 }
const FLOW = '[data-slot="flow"]'
const PROJECTS = '[data-slot="projects"]'
const SETTINGS = '[data-slot="settings"]'
const INFO = '[data-slot="info"]'
/** 最近目录行（左列作用域限定 + `data-path` 形 —— 与引导面 `project:open` 控件区分）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** 活卡三注入面（宿主 emit 同径 —— 先例 = T-DSK37 ⑪）。 */
const TOOL = { call: "ev:tool-call", result: "ev:tool-result" }
/** 夹具历史（核线形 —— 页读产一枚 `read` 工具卡；末 `user` 块供给错误横幅重试判据）。 */
const READ_RESULT = "1\tline one\n2\tline two\n(2 lines)"
/** 槽族档名（40 hex：`sha1(normalizeCwd(cwd))` —— 核 `cwdHash` 同式：盘符大写）。 */
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)).digest("hex")

/** 槽数据（核物化形 + 回放历史 —— 助手帧携 `tool_calls` / 工具条目携 `tool_call_id` ⇒ 页读配成一张工具卡）。 */
const slotData = (cwd) => ({
  version: 2, cwd, title: "小修族", updatedAt: Date.now(),
  history: [
    { role: "user", content: "看下这个文件", ts: Date.now() - 3000 },
    {
      role: "assistant", content: null,
      tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{\"path\":\"src/main/app.mjs\"}" } }],
    },
    { role: "tool", tool_call_id: "c1", name: "read", content: READ_RESULT },
  ],
  contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: false,
  advisor: { guard: false }, engineering: false, effort: null, pendingReminders: [],
  sessionStart: null, createdBy: "desktop", activeProvider: "p1", activeModel: "m1",
})

/** 起壳体：夹具两枚临时目录 + 槽族档 ⇒ Electron 启动 ⇒ `{ app, page, pageErrors, home, project }`。 */
async function launch(tag, pageErrors) {
  const home = mkdtempSync(join(tmpdir(), `tc-desktop-e2e-${tag}-`))
  const project = mkdtempSync(join(tmpdir(), `tc-desktop-e2e-${tag}-proj-`))
  const state = join(home, ".thincoder")
  const slots = join(state, "sessions")
  mkdirSync(slots, { recursive: true })
  writeFileSync(join(state, "config.json"), JSON.stringify({ locale: "en" }))
  const base = join(slots, `${hashOf(project)}.json`)
  writeFileSync(base, JSON.stringify({ cwd: project }))
  writeFileSync(`${base}.1`, JSON.stringify(slotData(project)))
  writeFileSync(`${base}.manifest`, JSON.stringify({
    slots: { "1": { ts: Date.now(), messageCount: 3, updatedAt: Date.now(), title: "小修族", activeProvider: "p1", activeModel: "m1" } },
  }))
  writeFileSync(`${base}.manifest.desktop`, JSON.stringify({ slot: 1, updatedAt: Date.now() }))

  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "userData")}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  page.on("console", (message) => console.log(`[e2e:console:${message.type()}] ${message.text()}`))
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
    console.log(`[e2e:pageerror] ${error.message}`)
  })
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  assert.equal(await page.evaluate(() => document.documentElement.dataset.boot), "ok", "引导位须 ok")
  return { app, page, project, state, home }
}

/** 开项目（真点最近目录项 ⇒ 自动一次 `session:resume` 开页）。 */
async function openProject(page) {
  await page.locator(RECENT).first().waitFor({ state: "visible", ...WAIT })
  await page.locator(RECENT).first().click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "flow", FLOW, WAIT)
}

/** 事件注入（主进程 `webContents.send` —— 宿主 emit 同径；全链走生产码，载荷为合成）。 */
const inject = (app, channel, payload) => app.evaluate(({ BrowserWindow }, [name, body]) => {
  const [win] = BrowserWindow.getAllWindows()
  win.webContents.send(name, body)
}, [channel, payload])
const KEY = "1" // 活动会话键 = `String(slot)`（`.manifest.desktop` 接续槽 1）

// ─── 壳体（单窗体两用例共用 —— `before` 起 / `after` 收：关窗 + 清两枚临时目录 + pageerror 空判）──
const pageErrors = []
let shell = null
test.before(async () => { shell = await launch("align3", pageErrors) })
test.after(async () => {
  try {
    if (shell !== null) await shell.app.close()
  } finally {
    rmSync(shell.home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    rmSync(shell.project, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
  assert.deepEqual(pageErrors, [], `全程 pageerror 须空 —— 实 = ${pageErrors.join(" | ")}`)
})

test("T-DSK42: 小修族·对话流面 —— 工具卡头（含摘要段）∧ 错误横幅（文 + 重试钮）∧ `no-message` 欢迎条三行（真 Electron · 离线可产面）", async () => {
  const { app, page } = shell
  await openProject(page)

  // ① 页读面工具卡（夹具回放）：名称 / 参数摘要 在场（`status` / 耗时不在页读载波 —— 见②活卡）
  const readHead = `${FLOW} [data-block-kind="tool"] [data-tool-head]`
  await page.waitForFunction((scope) => document.querySelector(scope) !== null, readHead, WAIT)
  const readText = await page.locator(readHead).first().innerText()
  assert.ok(readText.includes("read"), `回放工具卡头含名称（实 = ${JSON.stringify(readText)}）`)
  assert.ok(readText.includes("src/main/app.mjs"), "回放工具卡头含参数摘要（核回放 line 形直落）")
  assert.equal(await page.locator(`${FLOW} [data-block-kind="tool"] [data-tool-result]`).count(), 0, "回放卡默认折叠（无显式展开旗 ⇒ 体不落）")
  const readSummary = await page.locator(`${FLOW} [data-block-kind="tool"] [data-seg="summary"]`).innerText()
  assert.equal(readSummary, "→ 2 lines", "① 摘要段 = `→ ` + 核 `formatToolSummary` 直取（`read` 分派 —— 设计钉死字面）")

  // ② 活卡三注入（运行期链：`ev:tool-call` ⇒ `ev:tool-output` ⇒ `ev:tool-result`）：状态词 / 耗时 / 摘要段 +
  //    头行两态色（值源 = VSC 内联色 —— 真机 computed style 读数）
  await inject(app, TOOL.call, { key: KEY, id: "live1", name: "grep", argsSummary: "needle" })
  await inject(app, TOOL.result, { key: KEY, id: "live1", ok: true, result: "a.mjs:1: needle" })
  await inject(app, TOOL.call, { key: KEY, id: "live2", name: "bash", argsSummary: "npm test" })
  await inject(app, TOOL.result, { key: KEY, id: "live2", ok: false, result: "boom\n(exit code 1)" })
  await page.waitForFunction((scope) => document.querySelectorAll(`${scope} [data-tool-head]`).length >= 3, FLOW, WAIT)
  const liveDone = `${FLOW} [data-tool-head][data-status="done"]`
  const liveError = `${FLOW} [data-tool-head][data-status="error"]`
  assert.equal(await page.locator(`${liveDone} [data-seg="status"]`).innerText(), "done", "状态词 = 闭枚举出词（完成）")
  assert.equal(await page.locator(`${liveDone} [data-seg="time"]`).innerText().then((text) => /^\d+\.\ds$/.test(text)), true, "耗时段在场（`${seconds}s` 词键 —— 完成态且数在）")
  const liveSummary = await page.locator(`${liveDone} [data-seg="summary"]`).innerText()
  assert.equal(liveSummary, "→ 1 match", "执行态摘要段 = 核 `formatToolSummary` 直取（`grep` 分派 —— 尾缀字面同核）")
  const colorOf = (selector) => page.locator(selector).first().evaluate((node) => getComputedStyle(node).color)
  assert.equal(await colorOf(liveError), "rgb(241, 76, 76)", "失败卡头行色 = `#f14c4c`（VSC 内联色 —— 项 2 红）")
  assert.equal(await colorOf(liveDone), "rgb(78, 201, 176)", "成功卡头行色 = `#4ec9b0`（同源 —— 项 2 绿）")

  // ③ 错误横幅（`ev:error` 注入 —— 不携 `techInfo`）：文 + 重试钮（末 `user` 块在场 ⇒ 钮在）；details 面留真机
  await inject(app, "ev:error", { key: KEY, message: "provider-invalid: no provider configured" })
  const banner = `${FLOW} [data-block-kind="error"]`
  await page.waitForFunction((scope) => document.querySelector(scope) !== null, banner, WAIT)
  assert.equal((await page.locator(`${banner} .error-text`).innerText()).includes("provider-invalid"), true, "错误横幅文面在场（回合级错误块）")
  assert.equal(await page.locator(`${banner} [data-action="chat:retry"]`).count(), 1, "重试钮在场恰一枚（重发源 = 末 `user` 块）")
  assert.equal(await page.locator(`${banner} .error-details`).count(), 0, "无 `techInfo` ⇒ details 节点缺席（零假造）")

  // ④ `no-message` 欢迎条三行（真点标签条新建控件 `session:create` ⇒ 新会话零块）；行字面 = 设计钉死值
  await page.locator('[data-slot="tabs"] [data-action="session:create"]').click()
  await page.waitForFunction((scope) => document.querySelector(`${scope} [data-guide="no-message"]`) !== null, FLOW, WAIT)
  const welcome = await page.locator(`${FLOW} .chat-welcome`).innerText()
  assert.equal(welcome.split("\n").filter((line) => line.trim() !== "").join("|"),
    "Welcome to ThinCoder|Ask about this workspace — the agent can read files, run commands, and edit code.|Enter to send · Shift+Enter for newline",
    "④ 欢迎条三行 = 抬头 / 文案（夹具零渠道 ⇒ `settings.configured` 假 ⇒ `welcome.text`）/ 快捷键行（本端键位 —— `@` 段端差登记）")
  console.log(`[e2e] T-DSK42 ok —— 回放卡摘要 = ${readSummary} · 活卡两态色 = #f14c4c / #4ec9b0 · 错误横幅 + 重试钮 · 欢迎条三行`)
})

test("T-DSK43: 小修族·外围面 —— 设置面具名控件 + `change` 即改即存（盘上回读）∧ Esc 关面板（真 Electron · 离线可产面）", async () => {
  const { page, state } = shell

  // ① 开设置面（信息行单入口 —— 产品径；面板自开 ⇒ 四段读数随动）
  await page.locator(`${INFO} [data-action="settings:open"]`).click()
  const named = `${SETTINGS} [data-field-name]`
  await page.waitForFunction((scope) => document.querySelectorAll(scope).length === 10, named, WAIT)
  const names = await page.locator(named).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-field-name")))
  assert.deepEqual(names, [
    "agent.maxTurns", "agent.subagentTurns", "agent.poolLimits.engCoder", "agent.poolLimits.other",
    "agent.poolLimits.advisor", "agent.compactThreshold", "agent.verifyGuard", "agent.consultTurns",
    "agent.consultTimeoutMs", "agent.advisor.reasoningEffort",
  ], "④ 具名控件十键在场（键集 = `NAMED_FIELDS` 单源）")
  const types = await page.locator(`${named} input`).evaluateAll((nodes) => nodes.map((node) => node.type))
  assert.deepEqual(types, ["number", "number", "number", "number", "number", "number", "checkbox", "number", "number", "text"],
    "④ 控件型三值（P14 —— number / checkbox / text）")

  // ② 即改即存：改 `agent.maxTurns` ⇒ 单键落盘（盘上回读）+ 控件保读回值（无保存键参与）
  const maxTurns = `${SETTINGS} [data-field-name="agent.maxTurns"] input`
  await page.locator(maxTurns).fill("123")
  await page.locator(maxTurns).press("Tab") // 失焦 ⇒ `change` 面
  const configPath = join(state, "config.json")
  const deadline = Date.now() + 10000
  let persisted = null
  while (Date.now() < deadline) {
    persisted = JSON.parse(readFileSync(configPath, "utf8"))
    if (persisted?.agent?.maxTurns === 123) break
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  assert.equal(persisted?.agent?.maxTurns, 123, "④ 单键 patch 落盘（`settings:agent` { patch } ⇒ 核 `writeConfigAtomic`；盘上回读 = 123）")
  assert.equal(await page.locator(maxTurns).inputValue(), "123", "控件值 = 回执 `fields` 回读值（即改即存 —— 零保存键）")
  assert.equal(JSON.parse(readFileSync(configPath, "utf8")).locale, "en", "他键保留（单键 patch 不吞邻键）")

  // ③ Esc 关面板（F-Esc）：面板开态 ⇒ Escape ⇒ 容器清空（退场 = 零子节点）
  await page.keyboard.press("Escape")
  await page.waitForFunction((scope) => document.querySelector(scope)?.children.length === 0, SETTINGS, WAIT)
  assert.equal(await page.locator(`${SETTINGS} [data-field-name]`).count(), 0, "⑤ Esc ⇒ 面板清空（`settings:close` 既有出口 —— 单一实现）")
  console.log("[e2e] T-DSK43 ok —— 具名十键 + 即改即存（盘上 123）· Esc 清空")
})
