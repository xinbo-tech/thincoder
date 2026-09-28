/**
 * statusline-align.test.mjs — E2E 用例 `T-DSK39`（状态栏对齐 · 屏面为准 —— 打开态对表；真 Electron 直驱；
 * 设计单源 = `docs/desktop/design/PROJECT.md` §7 T-DSK39 行 + `docs/desktop/design/E2E-TESTING.md` §6；
 * 需求 §4 **D22**（桌面状态行与 CLI 状态行同刻同信息）+ 需求 §4 D16（改桌面可见面 ⇒ 必含一条真 Electron 用例）。
 * 域界 = 目录界：本档住 `test/integration/`（真进程 / 真窗口 / 真 DOM ⇒ 真解析面）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 四者同指该家；
 * userData 面 `--user-data-dir=<家>/userData`；摘 `ELECTRON_RUN_AS_NODE`（先例 = T-DSK27 / T-DSK32 / T-DSK37 / T-DSK38）。
 * 夹具（本序特有）：① `config.json` = `{"locale":"en"}` + 窄窗渠道（`context` = 1K ⇒ 打开态读数可算且 > 0）；
 * ② 会话槽族两枚（`cwd` = PROJ；模式位取**可达态** —— `planMode ⊥ engineering`（核 ENG-PLAN-EXCLUSION：工程
 *  模式清 plan；四真不可达））+ `.manifest` + `.manifest.desktop`（本端记录 ⇒ resume 命中槽 1）。
 * 断言序（设计 §7 T-DSK39 行 ①–⑥；**两臂**：主臂 = 工程模式会话 · 第二臂 = plan 会话）：
 *  ① 真点左列最近目录项（`project:open` + `data-path`）⇒ `openDir` 成功链 ⇒ 自动一次 `session:resume` 开页；
 *  ② 在场段 ⊆ 16 码闭集（单源 = `STATUS_SEGMENTS`）∧ 相对序 = 闭集序 ∧ 假 / 缺 ⇒ 零节点 —— **主臂**（工程模式）：
 *   `auto` / `advisor` / `eng` 在场 + `plan` 零节点（负断言）；**第二臂**（真点会话行切槽）：`plan` 在场 + `eng` 零节点；
 *   **两臂保留在场** = `state` / `tasks` / `context` / `title` / `enter`；
 *  ③ `state` 段词 = `Ready` · ④ `enter` 段词 = `Enter: send` · ⑤ `tasks` 段词 = `✓0/2`；
 *  ⑥ PNG 落 `thincoder-desktop/test/artifacts/statusline-align.png`（父侧 CLI 同刻对照面）；全程 `pageerror` 须空。
 * 边界：零文案匹配（例外 = ③④⑤ 三处**设计逐字词面读数**）· 不出网（零渠道请求）。
 * 用例号自铸披露 = `docs/desktop/design/PROJECT.md` §10 **AS**。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _electron as electron } from "playwright-core"
import { STATUS_SEGMENTS } from "../../renderer/views/statusline.mjs"

/** 应用根（`package.json` 所在 —— `args: ["."]` 的解析基址；与 runner 的 cwd 无关）。 */
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
/** 等待上限（真进程冷启 + IPC 往返 ⇒ 比单元域宽一档）。 */
const WAIT = { timeout: 30000 }
const STATUS = '[data-slot="status"]'
const PROJECTS = '[data-slot="projects"]'
const FLOW = '[data-slot="flow"]'
/** 最近目录行（左列作用域限定 + `data-path` 形 —— 与引导面 `project:open` 控件区分）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** 段节点选择器（码值域 = `STATUS_SEGMENTS`）。 */
const seg = (code) => `${STATUS} [data-seg="${code}"]`
/** PNG 落点（判据③固定落点 —— 单一常量）。 */
const PNG = join(APP_DIR, "test", "artifacts", "statusline-align.png")
/** 读数垫量（窄窗 1K ⇒ 打开态读数 > 0 —— 沿 T-DSK38 夹具先例）。 */
const WARMUP = "预热垫量 ".repeat(80)
/** 槽族档名（40 hex：`sha1(normalizeCwd(cwd))` —— 核 `cwdHash` 同式：盘符大写）。 */
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)).digest("hex")

/** 槽数据（核 `newSlotData` 形；模式位由 `over` 覆写 —— 臂① 工程模式 / 臂② plan）。 */
const slotData = (cwd, over = {}) => ({
  version: 2, cwd, title: "状态栏对齐", updatedAt: Date.now(),
  history: [{ role: "user", content: WARMUP, ts: Date.now() - 3000 }],
  contextHistory: [], tasks: [{ id: 1, text: "A", status: "pending" }, { id: 2, text: "B", status: "pending" }],
  planMode: false, goal: null, autoApprove: true, advisor: { guard: true }, engineering: true, effort: null,
  pendingReminders: [], sessionStart: null,
  createdBy: "desktop", activeProvider: "p1", activeModel: "m1",
  ...over,
})

test("T-DSK39 statusline-align — 打开态对表（banner 两态可达 + 段闭集序 + 词面读数 · 真 Electron）", async (t) => {
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-status-"))
  const project = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-status-proj-"))
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
  // 臂②：plan 会话（`engineering: false` ⇒ `plan` 与 `eng` 互斥面另一态）
  writeFileSync(`${base}.2`, JSON.stringify(slotData(project, { planMode: true, engineering: false, title: "PLAN 会话" })))
  const row = (title) => ({ ts: Date.now(), messageCount: 1, updatedAt: Date.now(), title, activeProvider: "p1", activeModel: "m1" })
  writeFileSync(`${base}.manifest`, JSON.stringify({ slots: { "1": row("状态栏对齐"), "2": row("PLAN 会话") } }))
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

  // ① 引导位落位 + 真点最近目录项（带 `data-path` 形）⇒ 开项目 + 自动接续槽 1 ⇒ 开页
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  assert.equal(await page.evaluate(() => document.documentElement.dataset.boot), "ok", "引导位须 ok")
  await page.locator(RECENT).first().waitFor({ state: "visible", ...WAIT })
  await page.locator(RECENT).first().click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "flow", FLOW, WAIT)
  await page.waitForFunction((scope) => document.querySelector(scope) !== null, seg("enter"), WAIT)

  /** 在场段码（DOM 序 = 段序）。 */
  const codes = () => page.locator(`${STATUS} [data-seg]`).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-seg")))
  const word = (code) => page.locator(seg(code)).first().innerText()

  // ②（主臂）工程模式会话：闭集 ∧ 闭集序 ∧ 三码在场 + `plan` 零节点
  const arm1 = await codes()
  assert.equal(arm1.every((code) => STATUS_SEGMENTS.includes(code)), true, `在场段 ⊆ 16 码闭集（实 ${arm1.join(",")}）`)
  assert.deepEqual(arm1, STATUS_SEGMENTS.filter((code) => arm1.includes(code)), "相对序 = 闭集序（`STATUS_SEGMENTS` 单源）")
  for (const code of ["auto", "advisor", "eng", "state", "tasks", "context", "title", "enter"]) {
    assert.equal(arm1.includes(code), true, `臂①/打开态在场段：${code}`)
  }
  assert.equal(arm1.includes("plan"), false, "臂① `plan` 段零节点（ENG-PLAN-EXCLUSION：工程模式清 plan —— 负向锁）")
  // ③④⑤ 词面读数（设计逐字）
  assert.equal((await word("state")).trim(), "Ready", "③ `state` 段词 = Ready（locale = en）")
  assert.equal((await word("enter")).trim(), "Enter: send", "④ `enter` 段词 = Enter: send")
  assert.equal((await word("tasks")).trim(), "✓0/2", "⑤ `tasks` 段词 = ✓0/2（槽内两任务全 pending）")

  // ②（第二臂）真点会话行（`session:switch` —— 同一开页尾）⇒ `plan` 在场 ∧ `eng` 零节点 ∧ 两臂保留五段仍在场
  await page.locator(`${PROJECTS} button.rail-row[data-slot="2"]`).click()
  await page.waitForFunction((scope) => document.querySelector(scope) !== null, seg("plan"), WAIT)
  const arm2 = await codes()
  for (const code of ["plan", "auto", "advisor"]) assert.equal(arm2.includes(code), true, `第二臂 在场段：${code}`)
  assert.equal(arm2.includes("eng"), false, "第二臂 `eng` 段零节点（engineering = false —— 负向锁）")
  for (const code of ["state", "tasks", "context", "title", "enter"]) {
    assert.equal(arm2.includes(code), true, `两臂保留在场段（第二臂同钉）：${code}`)
  }
  assert.deepEqual(arm2, STATUS_SEGMENTS.filter((code) => arm2.includes(code)), "第二臂 段序仍 = 闭集序（banner 四码序 = PLAN → AUTO → ADVISOR → ENG）")

  // ⑥ PNG 落点（父侧 CLI 同刻对照面）+ magic（89 50 4E 47）
  mkdirSync(dirname(PNG), { recursive: true })
  await page.screenshot({ path: PNG })
  assert.deepEqual([...readFileSync(PNG).subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], "PNG 落点存在（固定路径）+ magic")
  console.log(`[e2e] T-DSK39 ok —— 臂① 段 = ${arm1.join(",")} · 臂② 段 = ${arm2.join(",")} · PNG = ${PNG}`)
})
