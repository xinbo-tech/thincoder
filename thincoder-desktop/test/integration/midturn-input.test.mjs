/**
 * midturn-input.test.mjs — E2E 用例 `T-DSK45`（回合中插入 —— 真 Electron 直驱；设计单源 =
 * `docs/desktop/design/E2E-TESTING.md` §4 / §6 `T-DSK45` 行 + `docs/desktop/design/PROJECT.md` §6.1 本批注；
 * 机制 / 判据单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40** · `docs/desktop/design/UI.md` §1「本批注（回合中插入 · 步边界 pickup）」）。
 * 域界 = 目录界：本档住 `test/integration/`（真进程 / 真窗口 / 真 DOM ⇒ 真渲染链）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 四者同指该家；
 * userData 面 `--user-data-dir=<家>/userData`；摘 `ELECTRON_RUN_AS_NODE`（先例 = T-DSK27 / 32 / 37 / 39 / 40）。
 * **离线可产断言面（本档 —— `ev:queue` 注入**：主进程 `webContents.send`（宿主 emit 同径，全链走生产码））**：
 * ① 状态形 ⇒ 流尾待发送气泡组（输入区上方 · 逐条 · 非块节点）∧ 段 14 读数随动；
 * ② 消费回执形 ⇒ 气泡退场 ∧ 用户块同位置交接（标签回常态 `❯`）∧ 段 14 随动；
 * ③ 空快照 ⇒ 组退场（零节点）∧ 段 14 回落静息态。
 * **离线不可产面**（登记 = `docs/desktop/design/E2E-TESTING.md` §6 `T-DSK45`；人工走查 + 父侧真跑闭合）：
 * 真回合前置（忙态提交 ⇒ 宿主在飞表受理 ∕ 步边界注入时机 ∕ 回合尾续发）—— 真 provider 会话在零渠道夹具下不可复现；
 * 机检面 = `thincoder-desktop/test/queued-input.test.mjs`（计划面 ∕ 队列表）+ `thincoder-desktop/test/agent-host.test.mjs`
 * （U217–U219：宿主受理 ∕ 步边界取批 ∕ 续发链）+ `thincoder-desktop/test/events-reduce.test.mjs`（U220 归约两形）。
 * 夹具（沿 `T-DSK40` 先例）：`config.json` = `{"locale":"en"}`（向导跳过）+ 会话槽族档（`cwd` = PROJ；空史 ⇒ `no-message`）。
 * 边界：零文案匹配（断言走 `data-*` 锚 / 态值；例外 = `⏳` / `❯` 两字形与段 14 两词 —— 设计钉死值，经词表单源 `t()` 取）·
 * 不出网（零渠道）· 不截图（本批无 PNG 判据）。
 * 用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **BK**。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright-core"
import { t } from "../../renderer/i18n.mjs"

/** 应用根（`package.json` 所在 —— `args: ["."]` 的解析基址；与 runner 的 cwd 无关）。 */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
/** 等待上限（真进程冷启 + IPC 往返 ⇒ 比单元域宽一档）。 */
const WAIT = { timeout: 30000 }
const FLOW = '[data-slot="flow"]'
const PROJECTS = '[data-slot="projects"]'
/** 最近目录行（左列作用域限定 + `data-path` 形 —— 与引导面 `project:open` 控件区分）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** 槽族档名（40 hex：`sha1(normalizeCwd(cwd))` —— 核 `cwdHash` 同式：盘符大写）。 */
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)).digest("hex")
/** 槽数据（核 `newSlotData` 形；空史 ⇒ 开页零块 ⇒ `no-message` —— 沿 `T-DSK40` 夹具）。 */
const slotData = (cwd) => ({
  version: 2, cwd, title: "回合中插入", updatedAt: Date.now(), history: [],
  contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: false,
  advisor: { guard: false }, engineering: false, effort: null, pendingReminders: [],
  sessionStart: null, createdBy: "desktop", activeProvider: "", activeModel: "",
})

test("T-DSK45: 回合中插入 —— `ev:queue` 两形 ⇒ 待发送气泡组 ∧ 消费交接（用户块 + 标签）∧ 段 14 读数（真 Electron · 离线可产面）", async (ctx) => {
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-midturn-"))
  const project = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-midturn-proj-"))
  let app = null
  const pageErrors = []
  ctx.after(async () => {
    try {
      if (app !== null) await app.close()
    } finally {
      rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
      rmSync(project, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    }
    assert.deepEqual(pageErrors, [], `全程 pageerror 须空 —— 实 = ${pageErrors.join(" | ")}`)
  })
  // 夹具：家内 config（向导跳过）+ 槽族档（基档 / 槽 1 / 清单 / 本端记录）
  const state = join(home, ".thincoder")
  const slots = join(state, "sessions")
  mkdirSync(slots, { recursive: true })
  writeFileSync(join(state, "config.json"), JSON.stringify({ locale: "en" }))
  const base = join(slots, `${hashOf(project)}.json`)
  writeFileSync(base, JSON.stringify({ cwd: project }))
  writeFileSync(`${base}.1`, JSON.stringify(slotData(project)))
  writeFileSync(`${base}.manifest`, JSON.stringify({ slots: { "1": { ts: Date.now(), messageCount: 0, updatedAt: Date.now(), title: "回合中插入" } } }))
  writeFileSync(`${base}.manifest.desktop`, JSON.stringify({ slot: 1, updatedAt: Date.now() }))

  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "userData")}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  page.on("console", (message) => console.log(`[e2e:console:${message.type()}] ${message.text()}`))
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
    console.log(`[e2e:pageerror] ${error.message}`)
  })
  /** `ev:queue` 注入（主进程 `webContents.send` —— 宿主 `emit` 同径；载荷为合成，全链走生产码）。 */
  const inject = (channel, payload) => app.evaluate(({ BrowserWindow }, [name, body]) => {
    const [win] = BrowserWindow.getAllWindows()
    win.webContents.send(name, body)
  }, [channel, payload])
  const KEY = "1" // 活动会话键 = `String(slot)`（`.manifest.desktop` 接续槽 1）
  const count = (selector) => page.locator(`${FLOW} ${selector}`).count()

  // ⓪ 引导位落位 + 真点最近目录项 ⇒ 开项目 + 自动一次 resume 开页（空史 ⇒ `no-message`）
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  assert.equal(await page.evaluate(() => document.documentElement.dataset.boot), "ok", "引导位须 ok")
  await page.locator(RECENT).first().waitFor({ state: "visible", ...WAIT })
  await page.locator(RECENT).first().click()
  await page.waitForFunction((scope) => document.querySelector(`${scope} [data-guide="no-message"]`) !== null, FLOW, WAIT)

  // ① 状态形：镜面整置 ⇒ 流尾待发送气泡组（输入区上方 · 逐条 · 非块节点）∧ 段 14 读数 = N
  await inject("ev:queue", { key: KEY, items: [{ text: "第一条", ts: 1000 }, { text: "第二条", ts: 2000 }] })
  await page.waitForFunction((scope) => document.querySelectorAll(`${scope} [data-pending-item]`).length === 2, FLOW, WAIT)
  assert.equal(await count("[data-pending]"), 1, "待发送气泡组在场（流内非块节点）")
  assert.equal(await page.locator(`${FLOW}`).getAttribute("data-blocks"), "0", "非块节点：`data-blocks` 不变式零动（块数 = 0）")
  const bubbleLabel = await page.locator(`${FLOW} [data-pending-item] .msg-label`).first().innerText()
  assert.equal(bubbleLabel.startsWith("⏳"), true, `气泡标签 = 核 \`markPending\` 落笔（\`⏳\` 字形 —— 实 ${JSON.stringify(bubbleLabel)}）`)
  assert.equal(await page.locator('[data-seg="enter"]').innerText(), t("status.queue.n", { n: 2 }), "段 14 = 条数句（源 = 本会话队镜面）")

  // ② 消费回执形：气泡退场（剩 1）∧ 用户块同位置交接（标签回常态）∧ 段 14 随动（N-1）
  await inject("ev:queue", {
    key: KEY, items: [{ text: "第二条", ts: 2000 }], delivered: { text: "第一条", ts: 1000 },
  })
  await page.waitForFunction((scope) => document.querySelectorAll(`${scope} [data-block-kind="user"]`).length === 1, FLOW, WAIT)
  assert.equal(await count("[data-pending-item]"), 1, "气泡退场恰一条（镜面整置）")
  const userBlock = `${FLOW} [data-block-kind="user"]`
  assert.equal(await page.locator(`${userBlock} [data-raw]`).innerText(), "第一条", "用户块文本 = 回执 `delivered.text` 逐字")
  const label = await page.locator(`${userBlock} .msg-label`).innerText()
  assert.equal(label.startsWith("❯"), true, `标签回常态（核 \`paintLabel\` —— \`❯\` 字形；实 ${JSON.stringify(label)}）`)
  assert.equal(await page.locator('[data-seg="enter"]').innerText(), t("status.queue.n", { n: 1 }), "段 14 随动（N-1）")
  const order = await page.evaluate((scope) => {
    const kids = [...document.querySelector(scope).children]
    return {
      block: kids.findIndex((node) => node.getAttribute("data-block-kind") === "user"),
      pending: kids.findIndex((node) => node.hasAttribute("data-pending")),
    }
  }, FLOW)
  assert.ok(order.block >= 0 && order.pending === order.block + 1, `交接位置零跳（组恒居块序列之后 —— 块 idx=${order.block} · 组 idx=${order.pending}）`)

  // ③ 空快照：组退场（零节点）∧ 末条随快照交接 ∧ 段 14 回落静息态
  await inject("ev:queue", { key: KEY, items: [], delivered: { text: "第二条", ts: 2000 } })
  await page.waitForFunction((scope) => document.querySelector(`${scope} [data-pending]`) === null, FLOW, WAIT)
  assert.equal(await count("[data-block-kind]"), 2, "两条皆成交接（队空）")
  assert.equal(await count("[data-pending]"), 0, "空快照 ⇒ 组退场（零节点 —— 禁假造空壳）")
  assert.equal(await page.locator('[data-seg="enter"]').innerText(), t("status.enter.send"), "段 14 回落静息态（`Enter: send`）")
  console.log(`[e2e] T-DSK45 ok —— 气泡组两态 · 段 14 三态 · 交接 2 块（标签 ⏳ / ❯）`)
})
