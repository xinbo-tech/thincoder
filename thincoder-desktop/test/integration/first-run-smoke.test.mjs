/**
 * first-run-smoke.test.mjs — E2E 用例 `T-DSK32`（首启空态引导冒烟 · 十二序；真 Electron 直驱；设计单源 =
 * `docs/desktop/design/E2E-TESTING.md` §3.5 十二序 · §3.1 断言面 · §3.2 隔离契约 · §6 用例表）。
 * 域界 = 目录界：本档住 `test/integration/`（集成域 —— 真进程 / 真窗口 / 真 DOM）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：① 配置面 —— `HOME` / `USERPROFILE` / `APPDATA` / `XDG_CONFIG_HOME`
 * 四者同指该家；② userData 面（单实例锁落点）—— `--user-data-dir=<家>/userData`（§3.2 退路开关，沿 T-DSK27 实证）；
 * 再摘 `ELECTRON_RUN_AS_NODE`（不摘 ⇒ electron 退化成纯 node，启动失败成假红）。
 * 前提性夹具（本序特有 —— 与 T-DSK27 的「预置 config = 已配置」相反）：**零 config** ⇒ `configured` 假 ⇒ 启向导向
 * 占槽（第 ③ 步真点退场即对此），加会话槽族档一枚（`<40hex>.json` = `{cwd: PROJ}`，形 = 核物化形，先例
 * `test/projects.test.mjs`）⇒ 左列「最近目录」非空（第 ⑤ 步）。边界：零文案匹配（locale 未定 —— 断言只取
 * `data-*` 锚 / 态值 / console 字面）· 不出网（零渠道 ⇒ 发送止于 `provider-invalid`）· 不截图。
 * 失败取证 = console / pageerror 转发 + 步内自含读数（KD-9）；零固定 sleep（就绪判据 = 引导位落位）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright-core"

/** 应用根（`package.json` 所在 —— `args: ["."]` 的解析基址；与 runner 的 cwd 无关）。 */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
/** 等待上限（真进程冷启 + IPC 往返 ⇒ 比单元域宽一档）。 */
const WAIT = { timeout: 30000 }
/** 骨架槽锚（三件 —— `index.html` 属性，装配面按槽挂载）。 */
const PROJECTS = '[data-slot="projects"]'
const FLOW = '[data-slot="flow"]'
const COMPOSER = '[data-slot="composer"]'
const SETTINGS = '[data-slot="settings"]'
/** 引导节点锚（`data-guide` 码 ⇒ 选择器；码面断言 = 锚面 —— 零文案）。 */
const guide = (code) => `[data-guide="${code}"]`
/** 设面退场控件（向导 / 设置树同锚名：本序开始时向导占槽）。 */
const DISMISS = `${SETTINGS} button[data-action="settings:close"]`
/** 输入框（`renderer/mount-composer.mjs` 单锚）。 */
const INPUT = `${COMPOSER} textarea[data-input="text"]`
/** 最近目录行：**作用域限定**左列 + 必须带 `data-path`（同页另有引导面无 `data-path` 形 —— 第 ⑥ 步判据）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** 标签关闭控件（唯一标签 ⇒ 无确认面；同类文本键 `tab:close-cancel` / `tab:close-confirm` 不入本锚）。 */
const TAB_CLOSE = 'button[data-action="tab:close"]'
/** 零渠道发送失败行（`mount-composer.mjs` ask 拼串 × `agent-host.mjs` `provider-invalid`）。 */
const FAILED = "[composer] msg:send failed: provider-invalid"
/** 会话槽族档名（40 hex —— 槽族闭集形）。 */
const HEX40 = "0123456789abcdef0123456789abcdef01234567"
/** 键入面文本（零渠道 ⇒ 失败 ⇒ 稿须逐字留）。 */
const TYPED = "冒烟：失败不丢稿"

/** 路径归一（只消 `\` 与大小写：Windows 路径大小写不敏感 —— 不掩盖真差异）。 */
const norm = (value) => String(value).replaceAll("\\", "/").toLowerCase()

test("T-DSK32 first-run-smoke — 零配置首启（向导占槽⇒真退场）⇒ no-project 禁用 ⇒ 真点最近目录 ⇒ no-message 可用 ⇒ 关标签 ⇒ no-session ⇒ 引导建会话 ⇒ 键入不丢稿", async (t) => {
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-"))
  const project = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-proj-"))
  let app = null
  // 失败取证信道（KD-9）：渲染面 console / pageerror 直转测试输出；console 另收一份供第 ⑪ 步等串。
  //   声明先于收尾 hook —— 第 ⑫ 步的 pageerror 断言在 hook 内消费（启动期失败亦不落 TDZ）。
  const consoleLines = []
  const pageErrors = []
  // 收尾单 hook：先关应用、再清两枚临时家（顺序不可换 —— 进程仍持该家时删目录必失败）；`finally` = 清理不依赖
  // `close()` 成功，`close()` 的拒绝照旧逃逸（用例仍记红）；末行断言 = 全程 pageerror 空（**含关闭期** —— 设计第 ⑫ 步；
  // **收集起点 = 窗口取得**（其前引导期不在收集内 —— 两监听在 `firstWindow()` 之后才挂））。
  t.after(async () => {
    try {
      if (app !== null) await app.close()
    } finally {
      rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
      rmSync(project, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    }
    assert.deepEqual(pageErrors, [], `全程 pageerror 须空（含关闭期）—— 实 = ${pageErrors.join(" | ")}`)
  })
  // 夹具：会话槽族档一枚（`cwd` = PROJ）—— 左列「最近目录」据此非空；核档位 = `<家>/.thincoder/sessions/`。
  const slots = join(home, ".thincoder", "sessions")
  mkdirSync(slots, { recursive: true })
  writeFileSync(join(slots, `${HEX40}.json`), JSON.stringify({ cwd: project }))

  // ① 真进程起：env 必须显式传（缺省 = process.env ⇒ 漏真家）
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "userData")}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  page.on("console", (message) => {
    consoleLines.push(message.text())
    console.log(`[e2e:console:${message.type()}] ${message.text()}`)
  })
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
    console.log(`[e2e:pageerror] ${error.message}`)
  })
  /** console 等串（有界轮询 —— console 不落页面上下文，`waitForFunction` 够不着）。 */
  const waitConsole = async (needle) => {
    const until = Date.now() + WAIT.timeout
    while (Date.now() < until) {
      if (consoleLines.some((line) => line.includes(needle))) return
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`console 未现「${needle}」（超时 ${WAIT.timeout}ms —— 实收 ${consoleLines.length} 行）`)
  }

  // ② 引导位落位（先等 ok|error 再断 ok）+ 三槽锚在位 + 隔离落位实证（§3.2）
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  const boot = await page.evaluate(() => document.documentElement.dataset.boot)
  assert.equal(boot, "ok", `引导位须 ok —— 实 = ${boot}`)
  const userData = await app.evaluate(({ app: host }) => host.getPath("userData"))
  assert.ok(norm(userData).startsWith(norm(home)), `userData 须落夹具家内 —— 实 = ${userData}（家 = ${home}）`)
  for (const slot of [PROJECTS, FLOW, COMPOSER]) assert.equal(await page.locator(slot).count(), 1, `骨架槽锚唯一 ${slot}`)

  // ③ 向导退场（**真点** —— 零配置 ⇒ 向导树占 `[data-slot="settings"]` 槽）：不退场 ⇒ 覆盖层压住左列，第 ④ 步起全落空。
  const dismiss = page.locator(DISMISS)
  await dismiss.waitFor({ state: "visible", ...WAIT })
  await dismiss.click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.childNodes.length === 0, SETTINGS, WAIT)

  // ④ 无项目空态：flow `none` / 零块 / 引导 no-project 带动作控件 / 输入框禁用
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "none", FLOW, WAIT)
  const flow = page.locator(FLOW)
  assert.equal(await flow.getAttribute("data-blocks"), "0", "零块")
  const noProject = page.locator(guide("no-project"))
  await noProject.waitFor({ state: "visible", ...WAIT })
  assert.equal(await noProject.locator('button[data-action="project:open"]').count(), 1, "引导面动作控件在位（句柄在场）")
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "none", COMPOSER, WAIT)
  assert.equal(await page.locator(INPUT).isDisabled(), true, "无活动会话 ⇒ 输入框禁用")

  // ⑤ 最近目录行在位（夹具槽 ⇒ 恰一枚带 `data-path` 者）
  const recent = page.locator(RECENT)
  await recent.first().waitFor({ state: "visible", ...WAIT })
  assert.equal(await recent.count(), 1, "最近目录恰一枚")

  // ⑥ 真点最近目录 ⇒ 开项目（夹具槽可续 ⇒ 续会话 ∥ 不可续 ⇒ 新分配 —— 两况同落 no-message + 可用）
  await recent.first().click()
  await page.waitForFunction((scope) => {
    const box = document.querySelector(scope)?.querySelector("textarea")
    return document.querySelector('[data-guide="no-message"]') !== null && box !== null && box.disabled === false
  }, COMPOSER, WAIT)
  // ⑦ 空态断言（既有空态节点在场 · 词面不变 · 该码零动作控件 ⇒ 引导面无假按钮）
  assert.equal(await page.locator(guide("no-project")).count(), 0, "no-project 离场")
  assert.equal(await flow.getAttribute("data-state"), "empty", "无活动块 ⇒ empty（既有空态词面不变）")
  assert.equal(await flow.getAttribute("data-blocks"), "0", "仍零块")
  assert.equal(await page.locator(`${guide("no-message")} button`).count(), 0, "no-message 零动作控件")
  assert.equal(await page.locator(INPUT).isDisabled(), false, "有活动会话 ⇒ 输入框可用")

  // ⑧ 关标签（唯一 ⇒ 无确认面）⇒ 回空态：no-session + 引导面建会话控件 + 输入框重新禁用
  await page.locator(TAB_CLOSE).first().click()
  await page.waitForFunction(
    (scope) => document.querySelector('[data-guide="no-session"]') !== null && document.querySelector(scope)?.getAttribute("data-state") === "none",
    FLOW,
    WAIT,
  )
  const noSession = page.locator(guide("no-session"))
  assert.equal(await noSession.locator('button[data-action="session:create"]').count(), 1, "引导面建会话控件在位（作用域限定：标签栏同键控件不入）")
  assert.equal(await flow.getAttribute("data-blocks"), "0", "仍零块")
  assert.equal(await page.locator(INPUT).isDisabled(), true, "无活动会话 ⇒ 输入框禁用")

  // ⑨ 真点引导面建会话 ⇒ 回 no-message + 可用
  await noSession.locator('button[data-action="session:create"]').click()
  await page.waitForFunction((scope) => {
    const box = document.querySelector(scope)?.querySelector("textarea")
    return document.querySelector('[data-guide="no-message"]') !== null && box !== null && box.disabled === false
  }, COMPOSER, WAIT)
  assert.equal(await page.locator(guide("no-session")).count(), 0, "no-session 离场")
  assert.equal(await flow.getAttribute("data-blocks"), "0", "新会话零块")

  // ⑩⑪ 键入 + 回车（零渠道 ⇒ 发送失败但稿不丢）：值逐字留 / 零乐观块（全程 pageerror 空 ⇒ 收尾 hook 判 —— 含关闭期）
  const input = page.locator(INPUT)
  await input.fill(TYPED)
  await input.press("Enter")
  await waitConsole(FAILED)
  assert.equal(await input.inputValue(), TYPED, "失败 ⇒ 稿逐字留（不清输入）")
  assert.equal(await flow.getAttribute("data-blocks"), "0", "失败 ⇒ 零块（零假回合）")
  console.log(`[e2e] T-DSK32 ok —— boot = ${boot} · userData = ${userData} · 失败串现 = ${FAILED}`)
})
