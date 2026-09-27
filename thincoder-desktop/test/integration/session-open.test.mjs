/**
 * session-open.test.mjs — E2E 用例 `T-DSK38`（恢复态播种 + 用户块 md 深度 · 真 Electron 直驱；
 * 设计单源 = `docs/desktop/design/PROJECT.md` §7 T-DSK38 + 残余批注（D17 / D19 · 验收面）；需求 §4 D16
 * 「凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例」）。
 * 域界 = 目录界：本档住 `test/integration/`（集成域 —— 真进程 / 真窗口 / 真 DOM ⇒ 核产出 HTML 的**真解析面**
 * 〔假面 `test/fake-dom.mjs` 不解析 HTML —— 单元面判据 = 串/锚，本档 = 逐选择器实核〕）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 四者同指该家；
 * userData 面 `--user-data-dir=<家>/userData`；摘 `ELECTRON_RUN_AS_NODE`（先例 = T-DSK27 / T-DSK32 / T-DSK37）。
 * 夹具（本序特有）：① `config.json` = `{"locale":"en"}` + 窄窗渠道（`context` = 1K ⇒ 打开态读数可算且 > 0）；
 * ② 会话槽族：槽 1（回放历史含 md 面 + `tasks` 2 条）· 槽 2（空史 / 空任务 —— 零节点负臂）· `.manifest`
 * （槽索引）· `.manifest.desktop`（本端记录 ⇒ `resumeSlot` 命中槽 1）。
 * 边界：零文案匹配（断言只取 `data-*` 锚 / 态值 / 选择器结构 / 读数）· 不出网（零渠道请求）· 不截图。
 * 用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 AP（若 #477 实施批占用同号 ⇒ 父侧并号裁定）。
 * 失败取证 = console / pageerror 转发 + 步内自含读数（KD-9）；零固定 sleep（就绪判据 = 引导位落位 + 帧锚）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright-core"

/** 应用根（`package.json` 所在 —— `args: ["."]` 的解析基址；与 runner 的 cwd 无关）。 */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
/** 等待上限（真进程冷启 + IPC 往返 ⇒ 比单元域宽一档）。 */
const WAIT = { timeout: 30000 }
const FLOW = '[data-slot="flow"]'
const STATUS = '[data-slot="status"]'
const PROJECTS = '[data-slot="projects"]'
/** 最近目录行（左列作用域限定 + `data-path` 形 —— 与引导面 `project:open` 控件区分）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** 两状态行承载段（D17 段 6 / 段 9）+ 两块型（块面锚）。 */
const TASKS_SEG = `${STATUS} [data-seg="tasks"]`
const CONTEXT_SEG = `${STATUS} [data-seg="context"]`
const USER_BLOCK = `${FLOW} [data-block-kind="user"]`
const ASSISTANT_BLOCK = `${FLOW} [data-block-kind="assistant"]`
/** md 夹具（用户块与助手块**同文本** ⇒ 深度对拍有牙：围栏 + 标题两构件）。 */
const MD_TEXT = "```js\nconst a = 1 < 2\n```\n\n## 小节标题"
/** 读数垫量（窄窗 1K ⇒ 打开态读数 > 0；与 md 面无关的独立条目）。 */
const WARMUP = "预热垫量 ".repeat(80)
/** 槽族档名（40 hex：`sha1(normalizeCwd(cwd))` —— 核 `cwdHash` 同式：盘符大写）。 */
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)).digest("hex")

/** 槽数据（核 `newSlotData` 形 + 回放历史（**核线形** = `role` / `content` / `reasoning_content`）+ `tasks`）。 */
const slotData = (cwd, over = {}) => ({
  version: 2, cwd, title: "打开态会话", updatedAt: Date.now(),
  history: [
    { role: "user", content: WARMUP, ts: Date.now() - 5000 },
    { role: "assistant", content: "收到", ts: Date.now() - 4000 },
    { role: "user", content: MD_TEXT, ts: Date.now() - 3000 },
    { role: "assistant", content: MD_TEXT, reasoning_content: "先读文件再答", ts: Date.now() - 2000 },
  ],
  contextHistory: [], tasks: [{ id: 1, text: "A", status: "done" }, { id: 2, text: "B", status: "pending" }],
  planMode: false, goal: null, autoApprove: false, advisor: null, effort: null,
  pendingReminders: [], sessionStart: null,
  createdBy: "desktop", activeProvider: "p1", activeModel: "m1",
  ...over,
})

test("T-DSK38 session-open — 恢复态播种（`tasks` / `context` 段在场）+ 用户块 md 深度（真 Electron）", async (t) => {
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-open-"))
  const project = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-open-proj-"))
  let app = null
  const pageErrors = []
  t.after(async () => {
    try {
      if (app !== null) await app.close()
    } finally {
      rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
      rmSync(project, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    }
    assert.deepEqual(pageErrors, [], `全程 pageerror 须空 —— 实 = ${pageErrors.join(" | ")}`)
  })
  // 夹具：家内 config（configured 真 + 窄窗渠道）+ 槽族四档（基档 / 槽 1 / 槽 2 / 清单 / 本端记录）
  const state = join(home, ".thincoder")
  const slots = join(state, "sessions")
  mkdirSync(slots, { recursive: true })
  writeFileSync(join(state, "config.json"), JSON.stringify({
    locale: "en", providers: [{ name: "p1", model: "m1", context: 1 }],
  }))
  const base = join(slots, `${hashOf(project)}.json`)
  writeFileSync(base, JSON.stringify({ cwd: project }))
  writeFileSync(`${base}.1`, JSON.stringify(slotData(project)))
  writeFileSync(`${base}.2`, JSON.stringify(slotData(project, { history: [], tasks: [], title: "空槽" })))
  const row = (title) => ({ ts: Date.now(), messageCount: 1, updatedAt: Date.now(), title, activeProvider: "p1", activeModel: "m1" })
  writeFileSync(`${base}.manifest`, JSON.stringify({ slots: { "1": row("打开态会话"), "2": row("空槽") } }))
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

  // ① 引导位落位（配置在 ⇒ 向导不占槽）
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  assert.equal(await page.evaluate(() => document.documentElement.dataset.boot), "ok", "引导位须 ok")

  // ② 真点最近目录 ⇒ 开项目 + 自动接续槽 1（本端记录命中）⇒ 回放帧落位
  await page.locator(RECENT).first().waitFor({ state: "visible", ...WAIT })
  await page.locator(RECENT).first().click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "flow", FLOW, WAIT)

  // ③ D17 ①：段 6（`tasks`）= 槽数据直取 ⇒ 在场（读数 1/2 = 槽内两任务一完成）
  await page.waitForFunction((scope) => document.querySelector(scope) !== null, TASKS_SEG, WAIT)
  assert.equal(await page.locator(TASKS_SEG).count(), 1, "`tasks` 段恰一枚（恢复态播种）")
  assert.equal(/\b1\/2\b/.test(await page.locator(TASKS_SEG).innerText()), true, "读数 = 槽数据直取（1 完成 / 2 总数）")
  // ④ D17 ②：段 9（`context`）= 打开态读数（> 0）⇒ 在场，且读数 = 核投影域内
  await page.waitForFunction((scope) => document.querySelector(scope) !== null, CONTEXT_SEG, WAIT)
  assert.equal(await page.locator(CONTEXT_SEG).count(), 1, "`context` 段恰一枚（打开态读数在场）")
  const usage = await page.locator(CONTEXT_SEG).first().getAttribute("data-usage")
  assert.equal(Number(usage) > 0 && Number(usage) <= 100, true, `读数为正（实 = ${usage}）`)
  assert.equal(/\b\d+%/.test(await page.locator(CONTEXT_SEG).innerText()), true, "读数词面在场（值 = 核 `sessionReading`）")

  // ⑤ D19 ③：用户块块级构件零节点 ∥ 助手块同文本块级在场（真解析面 —— 核 md 产出）
  assert.equal(await page.locator(`${USER_BLOCK} pre.code-block`).count(), 0, "用户块：围栏零块级节点（`mdInline`）")
  assert.equal(await page.locator(`${USER_BLOCK} h2`).count(), 0, "用户块：标题零块级节点")
  assert.equal(await page.locator(`${ASSISTANT_BLOCK} pre.code-block`).count(), 1, "助手块：围栏 ⇒ `pre.code-block` 恰一枚 (全量 `md`)")
  assert.equal(await page.locator(`${ASSISTANT_BLOCK} h2`).count(), 1, "助手块：标题 ⇒ `h2` 恰一枚")
  const raws = await page.locator(`${USER_BLOCK} [data-raw]`).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-raw")))
  assert.equal(raws.includes(MD_TEXT), true, "`[data-raw]` 原文逐字在场（复制面零回归）")

  // ⑥ 负臂（真机）：切槽 2（空史 / 空任务）⇒ 段 6 / 段 9 零节点（未至 / ≤ 0 不落）
  await page.locator(`${PROJECTS} button.rail-row[data-slot="2"]`).click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "empty", FLOW, WAIT)
  assert.equal(await page.locator(TASKS_SEG).count(), 0, "空任务槽 ⇒ 段 6 零节点")
  assert.equal(await page.locator(CONTEXT_SEG).count(), 0, "空史槽 ⇒ 段 9 零节点（读数 0 不落）")
  assert.equal(await page.locator(`${FLOW} [data-block-kind]`).count(), 0, "空史槽 ⇒ 零块节点（页读整置）")
  console.log(`[e2e] T-DSK38 ok —— 段读数 = tasks 1/2 · context ${usage}% · 用户块围栏 0 / 助手块围栏 1 · 空槽两段零节点`)
})
