/**
 * settings-panel.test.mjs — E2E 首例 `T-DSK27`（真 Electron 直驱；设计单源 = `docs/desktop/design/E2E-TESTING.md`
 * §3.3 九步 · §3.2 隔离契约 · §6 用例表）。域界 = 目录界：本档住 `test/integration/`（集成域 —— 真进程 / 真窗口 /
 * 真 DOM），单元域用例不在此档。
 * 隔离 = 每用例一枚 `mkdtemp` 家，**两面分开改向**：① 配置面 —— `HOME` / `USERPROFILE` / `APPDATA` / `XDG_CONFIG_HOME`
 * 四者同指该家（核 `configDir = join(homedir(), ".thincoder")` ⇒ 配置面随之改向）；② userData 面（单实例锁落点）——
 * 走设计 §3.2 退路开关 `--user-data-dir=<家>/userData`：**实施期实证** = 只靠 env 改向时本机实读 `{"lock":"secondary"}`
 * （Chromium 的 appData 取系统真值、不采信 `APPDATA` env ⇒ 撞开发机在跑实例的锁，且真家被误用；加开关后
 * `app.getPath("userData")` = `<家>/userData`，本机已有实例 · 并发两实例两况俱过）。再摘除 `ELECTRON_RUN_AS_NODE`
 * （不摘 ⇒ electron 退化成纯 node，启动失败成假红）。fixture 唯一预置 = `<家>/.thincoder/config.json` = `{"locale":"en"}`
 * ⇒ `configured` 为真（向导不占槽）+ 零网络（无渠道不发 `model:list`）⇒ `model` 段应 `none`（重定向生效的活证据）。
 * 断言面 = 契约锚与态值（`data-*` 锚 / 段序 / 态序），非文案 —— 文案随 locale 变，锚随结构（KD-7）。
 * 判据③：PNG 落固定落点 `test/artifacts/settings-panel.png`（单一常量；进 `.gitignore`）；像素不进机检（KD-8）。
 * 失败取证靠 PNG 与 stdout（KD-9）—— 落点起始清位（旧图不冒名）＋ 渲染面 console / pageerror 转发；零固定 sleep（就绪判据 = 引导位落位）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright-core"

/** 应用根（`package.json` 所在 —— `args: ["."]` 的解析基址；与 runner 的 cwd 无关）。 */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
/** 判据③固定落点（档内单一绝对常量）。 */
const SHOT = join(APP_DIR, "test", "artifacts", "settings-panel.png")
/** PNG 签名（前 4 字节 —— 判据③的机检面）。 */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
/** 段序（`renderer/views/settings.mjs` `SECTIONS` 冻结序，同域）。 */
const SECTION_ORDER = ["providers", "model", "agent", "mcp"]
/** 四段收敛终态（与 `SECTION_ORDER` 同位同序：providers / model / agent / mcp —— 无激活渠道 ⇒ `model` = `none`）。 */
const SECTION_STATES = ["ready", "none", "ready", "ready"]
/** 锚选择器：段查询**作用域限定**设置面（`data-section` 名在左列 rail 面同现）。 */
const SECTIONS = "[data-settings] [data-section]"
const PANEL = "[data-settings]"
const ENTRY = 'button.info-entry[data-action="settings:open"]'
const CLOSE = 'button.settings-close[data-action="settings:close"]'
/** 等待上限（真进程冷启 + IPC 往返 ⇒ 比单元域宽一档）。 */
const WAIT = { timeout: 30000 }

/** 路径归一（只消 `\` 与大小写：Windows 路径大小写不敏感 —— 不掩盖真差异）。 */
const norm = (value) => String(value).replaceAll("\\", "/").toLowerCase()

test("T-DSK27 settings-panel — 真 Electron 起 ⇒ 主界面 ⇒ 开设置面（四段收敛）⇒ 固定落点 PNG ⇒ 关闭清容器", async (t) => {
  /** fixture 家（每用例一枚）。 */
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-"))
  let app = null
  // 收尾单 hook：先关应用、再清家（顺序不可换 —— 应用进程仍持该家时删目录必失败）；`finally` 的作用 = 清理
  // 不依赖 `close()` 成功（close 抛错时清位照做），**不**吞异常 —— `close()` 的拒绝照旧逃逸出 hook（用例仍记红），
  // 且进程尚存活时 `rmSync` 仍可能重试后 EPERM —— 故清家是「尽力」而非「保证零残留」。
  t.after(async () => {
    try {
      if (app !== null) await app.close()
    } finally {
      rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    }
  })
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))

  // 判据③落点先清位：否则上一轮成功的 PNG 仍留在判据路径上，会被当成本次取证（失败落在第 ⑦ 步之前时）。
  rmSync(SHOT, { force: true })

  // userData 面（单实例锁落点）：env 改不动的面（见头注实证）⇒ 走退路开关，落位 = 家内子目录（随家一并清）。
  const USER_DATA = join(home, "userData")
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE

  // ① 真进程起：env 必须显式传（缺省 = process.env ⇒ 漏真家）；不传 executablePath（走包内 electron 解析）
  app = await electron.launch({ args: [".", `--user-data-dir=${USER_DATA}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  // 失败取证信道（KD-9）：渲染面 console / pageerror 直转测试输出 —— 只加日志、不加断言。
  page.on("console", (message) => console.log(`[e2e:console:${message.type()}] ${message.text()}`))
  page.on("pageerror", (error) => console.log(`[e2e:pageerror] ${error.message}`))

  // ② 引导位：先等 `ok | error` 落位，再断言 `ok`（直接等 `ok` 会把引导失败报成超时）
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  const boot = await page.evaluate(() => document.documentElement.dataset.boot)
  assert.equal(boot, "ok", `引导位须 ok —— 实 = ${boot}`)

  // ②b 隔离落位实证（§3.2 实施首步）：userData ∈ fixture 家（不 ∈ ⇒ 单实例锁撞车 / 真家泄漏）
  const userData = await app.evaluate(({ app: host }) => host.getPath("userData"))
  assert.ok(norm(userData).startsWith(norm(home)), `userData 须落 fixture 家内 —— 实 = ${userData}（家 = ${home}）`)

  // ③ 设置入口在位且唯一（装配期即挂，与项目有无无关）
  const entry = page.locator(ENTRY)
  await entry.waitFor({ state: "visible", ...WAIT })
  assert.equal(await entry.count(), 1, "设置入口唯一")

  // ④ 点按 ⇒ 面板根 `data-state` 转 `open`
  await entry.click()
  await page.locator(PANEL).waitFor({ state: "visible", ...WAIT })
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "open", PANEL, WAIT)

  // ⑤ 段集合与序
  const sections = await page.locator(SECTIONS).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section")))
  assert.deepEqual(sections, SECTION_ORDER, "四段序")

  // ⑥ 段态收敛：等四段俱脱离加载态（open 同步置 loading ⇒ 本谓词可靠）⇒ 断言四段终态
  try {
    await page.waitForFunction(
      (scope) => {
        const nodes = [...document.querySelectorAll(scope)]
        return nodes.length === 4 && nodes.every((node) => node.getAttribute("data-state") !== "loading")
      },
      SECTIONS,
      WAIT,
    )
  } catch (error) {
    // 诊断读数须**自含**：`evaluateAll` 回调进页面上下文（既不共享档内符号，首参亦 = 匹配元素数组）
    const readout = await page.locator(SECTIONS).evaluateAll(
      (nodes) => nodes.map((node) => `${node.getAttribute("data-section")}=${node.getAttribute("data-state")}`),
    )
    console.log(`[e2e] 段面未收敛 —— 现读数 = ${readout.join(" ")}`)
    throw error
  }
  const states = await page.locator(SECTIONS).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-state")))
  assert.deepEqual(states, SECTION_STATES, "四段态（model = none 兼作隔离生效证据）")

  // ⑦ 固定落点 PNG：先预建落点目录（不押 screenshot 的自建行为）⇒ 落盘 ⇒ 机检 = 存在 + 签名
  mkdirSync(dirname(SHOT), { recursive: true })
  await page.screenshot({ path: SHOT })
  const bytes = readFileSync(SHOT)
  assert.ok(bytes.length > 0, "PNG 非空")
  assert.ok(bytes.subarray(0, 4).equals(PNG_MAGIC), `PNG 签名须 89504e47 —— 实 = ${bytes.subarray(0, 4).toString("hex")}`)

  // ⑧ 关闭 ⇒ 退场 = 容器清空（零子节点，非 hidden）
  await page.locator(CLOSE).click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "closed", PANEL, WAIT)
  const root = page.locator(PANEL)
  assert.equal(await root.count(), 1, "设置根唯一")
  assert.equal(await root.evaluate((node) => node.childNodes.length), 0, "关闭 ⇒ 零子节点")

  console.log(`[e2e] T-DSK27 ok —— PNG = ${SHOT} · userData = ${userData} · boot = ${boot}`)
})
