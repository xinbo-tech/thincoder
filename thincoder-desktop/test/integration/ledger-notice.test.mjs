/**
 * ledger-notice.test.mjs — E2E 用例 `T-DSK40`（账本警示面 —— 真 Electron 直驱；设计单源 =
 * `docs/desktop/design/E2E-TESTING.md` §3.6 六序 / §6 + `docs/desktop/design/PROJECT.md` §7 T-DSK40 行；
 * 触发与在场 = `docs/desktop/design/UI.md` §1「本批注（账本警示面）」· 契约 = `docs/desktop/design/IPC.md` §2「会话族注」项 6）。
 * 域界 = 目录界：本档住 `test/integration/`（真进程 / 真窗口 / 真 DOM ⇒ 真解析面）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 四者同指该家；
 * userData 面 `--user-data-dir=<家>/userData`；摘 `ELECTRON_RUN_AS_NODE`（先例 = T-DSK27 / T-DSK32 / T-DSK37 / T-DSK39）。
 * 夹具（本序特有）：`config.json` = `{"locale":"en"}`（向导跳过）+ 会话槽族档（`cwd` = PROJ；空史 ⇒ 开页零块 ⇒
 * `no-message`）+ **损坏现场档**一枚 = `{manifest}.corrupted`（后缀族 = 核 `preserveScene`——命名单源 =
 * `docs/core/design/SESSION.md` §6.1 / §6.23）。
 * 断言序（设计 §3.6 六序）：① 真点左列最近目录项（`project:open` + `data-path`）⇒ 等 `[data-guide="no-message"]`
 * ② 会话区 `[data-section="sessions"]` 末子 = `div.rail-ledger-notice[data-ledger-notice]`（**非 `button`** ∧ 零
 * `data-action`——非可点）∧ `[data-list="sessions"]` 行数 = 夹具族数（不打断列表）③ PNG 落
 * `thincoder-desktop/test/artifacts/ledger-notice.png`（存在 + magic）④ 全程零 `pageerror`。
 * 边界：零文案匹配（`reason` 值面归视图用例 —— `test/views.test.mjs` U181）· 不出网（零渠道）。
 * 用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **AU**。
 */
import { test } from "node:test"
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
const PROJECTS = '[data-slot="projects"]'
const SESSIONS = '[data-section="sessions"]'
const LIST = '[data-list="sessions"]'
/** 最近目录行（左列作用域限定 + `data-path` 形 —— 与引导面 `project:open` 控件区分）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** PNG 落点（判据③固定落点 —— 单一常量）。 */
const PNG = join(APP_DIR, "test", "artifacts", "ledger-notice.png")
/** 槽族档名（40 hex：`sha1(normalizeCwd(cwd))` —— 核 `cwdHash` 同式：盘符大写）。 */
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)).digest("hex")

/** 槽数据（核 `newSlotData` 形；空史 ⇒ 开页零块 ⇒ `no-message`）。 */
const slotData = (cwd) => ({
  version: 2, cwd, title: "账本警示", updatedAt: Date.now(), history: [],
  contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: false,
  advisor: { guard: false }, engineering: false, effort: null, pendingReminders: [],
  sessionStart: null, createdBy: "desktop", activeProvider: "", activeModel: "",
})

test("T-DSK40 ledger-notice — 损坏现场档 ⇒ 会话区末位 dim 注记（非可点 · 不打断列表 · 真 Electron）", async (t) => {
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-ledger-"))
  const project = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-ledger-proj-"))
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
  // 夹具：家内 config（向导跳过）+ 槽族档（基档 / 槽 1 / 清单 / 本端记录）+ 损坏现场档一枚
  const state = join(home, ".thincoder")
  const slots = join(state, "sessions")
  mkdirSync(slots, { recursive: true })
  writeFileSync(join(state, "config.json"), JSON.stringify({ locale: "en" }))
  const base = join(slots, `${hashOf(project)}.json`)
  writeFileSync(base, JSON.stringify({ cwd: project }))
  writeFileSync(`${base}.1`, JSON.stringify(slotData(project)))
  writeFileSync(`${base}.manifest`, JSON.stringify({ slots: { "1": { ts: Date.now(), messageCount: 0, updatedAt: Date.now(), title: "账本警示" } } }))
  writeFileSync(`${base}.manifest.desktop`, JSON.stringify({ slot: 1, updatedAt: Date.now() }))
  writeFileSync(`${base}.manifest.corrupted`, "{ 损坏现场 }")

  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "userData")}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  page.on("console", (message) => console.log(`[e2e:console:${message.type()}] ${message.text()}`))
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
    console.log(`[e2e:pageerror] ${error.message}`)
  })

  // ① 引导位落位 + 真点最近目录项（带 `data-path` 形）⇒ 开项目 + 自动一次 resume 开页（空史 ⇒ `no-message`）
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  assert.equal(await page.evaluate(() => document.documentElement.dataset.boot), "ok", "引导位须 ok")
  await page.locator(RECENT).first().waitFor({ state: "visible", ...WAIT })
  await page.locator(RECENT).first().click()
  await page.waitForFunction(() => document.querySelector('[data-guide="no-message"]') !== null, undefined, WAIT)

  // ② 警示行在场：会话区**末子节点** = `div.rail-ledger-notice[data-ledger-notice]`（非 `button` ∧ 零 `data-action`）
  await page.waitForFunction((scope) => document.querySelector(`${scope} .rail-ledger-notice`) !== null, SESSIONS, WAIT)
  const shape = await page.evaluate((scope) => {
    const section = document.querySelector(scope)
    const node = section === null ? null : section.lastElementChild
    return {
      tag: node?.tagName ?? null,
      cls: String(node?.className ?? ""),
      anchor: node?.hasAttribute("data-ledger-notice") ?? false,
      action: node?.hasAttribute("data-action") ?? null,
      controls: node === null ? null : node.querySelectorAll("button, a, input").length,
      count: section === null ? null : section.querySelectorAll(".rail-ledger-notice").length,
    }
  }, SESSIONS)
  assert.equal(shape.tag, "DIV", "末子节点 = `div`（非 `button` —— 零控件语义）")
  assert.equal(shape.cls.split(" ").includes("rail-ledger-notice"), true, `class = rail-ledger-notice（实 ${shape.cls}）`)
  assert.equal(shape.anchor, true, "机读锚 `data-ledger-notice` 在位")
  assert.equal(shape.action, false, "零 `data-action`（不可点）")
  assert.equal(shape.controls, 0, "零内嵌交互控件")
  assert.equal(shape.count, 1, "注记恰一枚")
  const rowCount = await page.locator(`${LIST} > li`).count()
  assert.equal(rowCount, 1, "不打断列表：`[data-list=sessions]` 行数 = 夹具族数（1）")

  // ③ PNG 落点（固定路径）+ magic（89 50 4E 47）
  mkdirSync(dirname(PNG), { recursive: true })
  await page.screenshot({ path: PNG })
  assert.deepEqual([...readFileSync(PNG).subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], "PNG 落点存在（固定路径）+ magic")
  console.log(`[e2e] T-DSK40 ok —— 末子 = ${shape.tag}.${shape.cls} · 行数 = ${rowCount} · PNG = ${PNG}`)
})
