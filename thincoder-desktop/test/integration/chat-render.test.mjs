/**
 * chat-render.test.mjs — E2E 用例 `T-DSK37`（会话流经核 + 会话面板元数据 · 真 Electron 直驱；设计单源 =
 * `docs/desktop/design/PROJECT.md` §7 T-DSK35（C7 面）/ T-DSK34（D18 面）+ 需求 §4 D16「凡改桌面可见面 ⇒
 * 验收须含一条真 Electron 使用面用例」（用例号自铸披露 = 批档 §5））。
 * 域界 = 目录界：本档住 `test/integration/`（集成域 —— 真进程 / 真窗口 / 真 DOM ⇒ 核产出 HTML 的**真解析面**
 * 〔假面 `test/fake-dom.mjs` 不解析 HTML —— 单元面判据 = 串/锚，本档 = 逐选择器实核〕）。
 * 隔离 = 每用例两枚 `mkdtemp`（家 + 项目根）：HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 四者同指该家；
 * userData 面 `--user-data-dir=<家>/userData`；摘 `ELECTRON_RUN_AS_NODE`（先例 = T-DSK27 / T-DSK32）。
 * 夹具（本序特有）：① `config.json` = `{"locale":"en"}`（configured 真 ⇒ 向导不占槽）；② 会话槽族四档
 * （`<40hex>.json` 基档 = 最近目录源 · `.1` 槽数据 = 回放历史 · `.manifest` = 槽索引 · `.manifest.desktop`
 * = 本端记录 ⇒ `resumeSlot` 命中槽 1）—— 形 = 核物化形（先例 `test/projects.test.mjs` / `test/session-contract.test.mjs`）。
 * 边界：零文案匹配（断言只取 `data-*` 锚 / 态值 / class 选择器 / 核产出结构）· 不出网（零渠道）· 不截图。
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
const PROJECTS = '[data-slot="projects"]'
/** 最近目录行（左列作用域限定 + `data-path` 形 —— 与引导面 `project:open` 控件区分）。 */
const RECENT = `${PROJECTS} [data-action="project:open"][data-path]`
/** 核产出三面（真解析面）：围栏代码块 / 代码块复制钮 / 推理块。 */
const CODE_BLOCK = `${FLOW} pre.code-block`
const CODE_COPY = `${FLOW} pre.code-block button.code-copy-btn`
const REASONING = `${FLOW} details.reasoning-block`
/** 夹具历史（回放面：围栏块 + 注入样本 + 文件路径候选 + 推理块）。 */
const FENCED = "```js\nconst a = 1 < 2\n```"
const INJECTED = "<script>alert(1)</script>"
const PATH_TEXT = "见 src/main/app.mjs 的说明"
const REASONING_TEXT = "先读文件再答"
/** 槽族档名（40 hex：`sha1(normalizeCwd(cwd))` —— 核 `cwdHash` 同式：盘符大写）。 */
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)).digest("hex")

/** 槽数据（核 `newSlotData` 形 + 回放历史（**核线形** = `role` / `content` / `reasoning_content` ——
 *  窗口切面 `historyWindow` 入参形）+ D18 元数据两源字段）。 */
const slotData = (cwd) => ({
  version: 2, cwd, title: "回放会话", updatedAt: Date.now(),
  history: [
    { role: "user", content: "看下代码", ts: Date.now() - 3000 },
    { role: "assistant", content: `${FENCED}\n\n${PATH_TEXT}`, reasoning_content: REASONING_TEXT },
    { role: "user", content: INJECTED, ts: Date.now() - 1000 },
  ],
  contextHistory: [], tasks: [],
  planMode: false, goal: null, autoApprove: false, advisor: null, effort: null,
  pendingReminders: [], sessionStart: null,
  createdBy: "desktop", activeProvider: "p1", activeModel: "m1",
})

test("T-DSK37 chat-render — 会话流经核（围栏块 / 复制钮 / 推理块 / 转义闸 / 文件链接零节点）+ 会话面板元数据（真 Electron）", async (t) => {
  const home = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-"))
  const project = mkdtempSync(join(tmpdir(), "tc-desktop-e2e-proj-"))
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
  // 夹具：家内 config（configured 真）+ 槽族四档（基档 / 槽 1 数据 / 清单 / 本端记录）
  const state = join(home, ".thincoder")
  const slots = join(state, "sessions")
  mkdirSync(slots, { recursive: true })
  writeFileSync(join(state, "config.json"), JSON.stringify({ locale: "en" }))
  const base = join(slots, `${hashOf(project)}.json`)
  writeFileSync(base, JSON.stringify({ cwd: project }))
  writeFileSync(`${base}.1`, JSON.stringify(slotData(project)))
  writeFileSync(`${base}.manifest`, JSON.stringify({
    slots: { "1": { ts: Date.now(), messageCount: 3, updatedAt: Date.now(), title: "回放会话", activeProvider: "p1", activeModel: "m1" } },
  }))
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
  assert.equal(await page.locator(`${FLOW} button[data-action="session:create"]`).count(), 0, "向导不占槽（configured 真）")

  // ② 真点最近目录 ⇒ 开项目 + 自动接续槽 1 ⇒ 回放帧落位（块锚 = 数据源）
  await page.locator(RECENT).first().waitFor({ state: "visible", ...WAIT })
  await page.locator(RECENT).first().click()
  await page.waitForFunction((scope) => document.querySelector(scope)?.getAttribute("data-state") === "flow", FLOW, WAIT)
  const kinds = await page.locator(`${FLOW} [data-block-kind]`).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-block-kind")))
  assert.deepEqual(kinds, ["user", "assistant", "reasoning", "user"], "回放块序 = 历史序（助手条目序 = [assistant, reasoning] + 尾注入样本用户块）")

  // ③ C7 ① / T-DSK35 ①：围栏块 ⇒ `pre.code-block` 真在场（核 md 围栏切分）+ 复制钮真在场
  assert.equal(await page.locator(CODE_BLOCK).count(), 1, "围栏块 ⇒ `pre.code-block` 恰一枚（真解析面）")
  assert.equal((await page.locator(`${CODE_BLOCK} code`).innerText()).includes("const a = 1 < 2"), true, "代码文本在场（块内 `code`）")
  assert.equal(await page.locator(CODE_COPY).count(), 1, "代码块复制钮在场（核件 `attachCopyButtons`）")
  // 点按 ⇒ `clipboard.writeText` 收代码文本（主进程剪贴板回读 —— 真出口链）
  await page.locator(CODE_COPY).click()
  await page.waitForFunction((scope) => /Copied/.test(document.querySelector(scope)?.textContent ?? ""), CODE_COPY, WAIT)
  const clip = await app.evaluate(({ clipboard }) => clipboard.readText())
  assert.equal(clip.includes("const a = 1 < 2"), true, `复制钮点按 ⇒ 剪贴板收代码文本（实 = ${JSON.stringify(clip)}）`)

  // ④ C7 ②：注入样本 ⇒ 字面文本（转义闸）+ 零脚本节点（真执行面）
  const flowText = await page.locator(FLOW).innerText()
  assert.equal(flowText.includes(INJECTED), true, "注入样本以**字面文本**在场（转义闸）")
  assert.equal(await page.locator(`${FLOW} script`).count(), 0, "零脚本节点（渲染面零执行面）")

  // ⑤ T-DSK35 ③：推理块 = 折叠块（`details.reasoning-block` —— 核件结构）
  assert.equal(await page.locator(REASONING).count(), 1, "推理块 = 折叠块恰一枚")
  assert.equal((await page.locator(`${REASONING} summary`).innerText()).trim().length > 0, true, "折叠头词面在场（核键 `status.thinking` 出串）")
  assert.equal((await page.locator(`${REASONING} .reasoning-content`).innerText()).includes(REASONING_TEXT), true, "推理内容在场（经核 md）")

  // ⑥ T-DSK35 ④（KD-RC-5）：文件路径文本在场但**零链接节点**
  assert.equal(flowText.includes("src/main/app.mjs"), true, "文件路径文本在场")
  assert.equal(await page.locator(`${FLOW} .file-link`).count(), 0, "文件链接零节点（KD-RC-5 —— 核 linkifyPaths 桌面不消费）")

  // ⑦ D18：会话面板元数据族三值（provider · N msgs · updated）+ 多标签结构不削
  const meta = page.locator(`${PROJECTS} [data-row-meta]`).first()
  await meta.waitFor({ state: "visible", ...WAIT })
  assert.deepEqual(
    await meta.locator("[data-seg]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-seg"))),
    ["provider", "msgs", "updated"],
    "行元数据段序 = provider · N msgs · updated",
  )
  const metaText = await meta.innerText()
  assert.equal(metaText.includes("p1:m1"), true, `provider = 槽投影逐字（实 = ${JSON.stringify(metaText)}）`)
  assert.equal(/3/.test(metaText), true, "N msgs = 读数（槽清单 messageCount = 3）")
  assert.equal(await page.locator('[data-slot="tabs"] .tabbar-item').count(), 1, "多标签结构不削（本序单标签 —— 结构面 = 标签条在场）")
  console.log(`[e2e] T-DSK37 ok —— 块序 = ${kinds.join("/")} · 剪贴板 = ${JSON.stringify(clip.slice(0, 40))} · 元数据 = ${JSON.stringify(metaText)}`)
})
