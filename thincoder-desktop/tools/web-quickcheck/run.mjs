/**
 * run.mjs — web 快筛冒烟（设计单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §3.3 · 九段）：
 * 1 起服务/起浏览器 → 2 固定视口 + 干净面收集 → 3 boot 就绪判据（`∈ {ok, error}` 落位 ⇒ 断言 `ok`）
 * → 4 骨架六槽 → 5 引导面 `no-project` 链 → 6 会话条 + 输入面板装配 → 7 真事件径（会话下拉开 ∥ 关）
 * → 8 真 CSS ∥ 布局读数 → 9 截图 + 收口三零（`pageerror` ∥ `console.error` ∥ `__quickcheck.unstubbed`）。
 * 浏览器 = 系统 channel（缺省 `msedge`，`--browser=` 覆盖；不引浏览器下载）：启动失败 ⇒ 明示退出（不静默回退）。
 * 任一断言败 ⇒ 逐条列报 + exit 1；全绿 ⇒ `segments=9/9 … failed=0` + exit 0。入口 = `npm run quickcheck`（非套件）。
 */
import { mkdirSync } from "node:fs"
import { readFile, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright-core"
import { startServer } from "./serve.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SHOT = resolve(ROOT, "test/artifacts/quickcheck-boot.png")
const DEFAULT_BROWSER = "msedge"
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
/** 骨架六槽（设计 §3.3 步 4；锚 = `renderer/index.html` 静态骨架）。 */
const SLOTS = ["session-control", "flow", "composer", "pool", "status", "settings"]

/** 旗标面（唯一合法 = `--browser=`；表外参数 ∥ 空值 ⇒ 明示退出——不静默回退）。 */
const FLAG = "--browser="
const unknown = process.argv.slice(2).find((argument) => !argument.startsWith(FLAG))
if (unknown !== undefined) {
  console.error(`[quickcheck] unknown argument: ${unknown} (supported: ${FLAG}<channel>)`)
  process.exit(1)
}
const browserFlag = process.argv.find((argument) => argument.startsWith(FLAG))
const browserChannel = browserFlag === undefined ? DEFAULT_BROWSER : browserFlag.slice(FLAG.length)
if (browserChannel === "") {
  console.error(`[quickcheck] ${FLAG} requires a channel name (msedge ∥ chrome)`)
  process.exit(1)
}

const failures = []
const steps = []
let step = null

/** 段开始（进度读数 + 失败归属——收口 `segments=K/9` 读数用）。 */
function beginStep(name) {
  step = { name, failures: failures.length }
  steps.push(step)
  console.log(`[quickcheck] step ${steps.length}/9: ${name}`)
}

/** 断言（逐条记账；败 ⇒ 收口列报——不静默）。 */
function check(name, ok, detail = "") {
  if (ok) return
  failures.push(`${step?.name ?? "-"}: ${name}${detail === "" ? "" : ` — ${detail}`}`)
}

/** 主流程（异常 ⇒ `aborted` 列报 + exit 1）。 */
async function main() {
  beginStep("serve + browser")
  const server = await startServer()
  console.log(`[quickcheck] serving ${server.url}/ (browser channel: ${browserChannel})`)
  let browser = null
  try {
    try {
      browser = await chromium.launch({ channel: browserChannel, headless: true })
    } catch (error) {
      console.error(`[quickcheck] browser launch failed (channel ${browserChannel}): ${error?.message ?? error}`)
      await server.close().catch(() => {})
      process.exit(1)
    }

    beginStep("context + collectors")
    const pageErrors = []
    const consoleErrors = []
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" })
    const page = await context.newPage()
    page.on("pageerror", (error) => pageErrors.push(String(error?.message ?? error)))
    page.on("console", (message) => {
      if (message.type() !== "error") return
      const at = message.location()?.url ?? ""
      consoleErrors.push(at === "" ? message.text() : `${message.text()} (${at})`)
    })

    beginStep("boot")
    await page.goto(`${server.url}/`, { waitUntil: "domcontentloaded", timeout: 15_000 })
    await page.waitForFunction(
      () => { const value = document.documentElement.dataset.boot; return value === "ok" || value === "error" },
      undefined,
      { timeout: 15_000 },
    )
    const boot = await page.evaluate(() => document.documentElement.dataset.boot)
    check("boot = ok", boot === "ok", `dataset.boot = ${boot}`)

    beginStep("skeleton six slots")
    const slots = await page.$$eval("[data-slot]", (nodes) => nodes.map((node) => node.getAttribute("data-slot")))
    const missing = SLOTS.filter((slot) => !slots.includes(slot))
    check("六槽在场", missing.length === 0, `missing: ${missing.join(",")}`)

    beginStep("guide (no-project)")
    const guide = await page.evaluate(() => {
      const flow = document.querySelector('[data-slot="flow"]')
      const present = (selector) => flow !== null && flow.querySelector(selector) !== null
      return {
        state: flow === null ? null : flow.getAttribute("data-state"),
        blocks: flow === null ? null : flow.getAttribute("data-blocks"),
        guide: present('[data-guide="no-project"]'),
        action: present('button[data-action="project:open"]'),
      }
    })
    check("no-project 链", guide.state === "none" && guide.blocks === "0" && guide.guide && guide.action, JSON.stringify(guide))

    beginStep("session bar + composer")
    const bar = await page.evaluate(() => {
      const toolbar = document.querySelector('[data-slot="composer"]#toolbar')
      const present = (selector) => toolbar !== null && toolbar.querySelector(selector) !== null
      return {
        project: document.querySelector("button.session-project") !== null,
        selector: document.querySelector('.session-selector[aria-expanded="false"]') !== null,
        toolbar: toolbar !== null,
        input: present("#input"),
        send: present("#send-btn"),
        attach: present("#attach-btn"),
      }
    })
    check("会话条 + 输入面板", bar.project && bar.selector && bar.toolbar && bar.input && bar.send && bar.attach, JSON.stringify(bar))

    beginStep("event path (dropdown open ∥ close)")
    await page.click(".session-selector")
    const opened = await page.evaluate(() => ({
      expanded: document.querySelector(".session-selector")?.getAttribute("aria-expanded") ?? null,
      dropdown: document.querySelector('.session-dropdown[data-open="1"]') !== null,
      empty: document.querySelector(".session-empty") !== null,
    }))
    check("下拉开", opened.expanded === "true" && opened.dropdown && opened.empty, JSON.stringify(opened))
    await page.click('[data-slot="status"]')
    const closed = await page.evaluate(() => ({
      expanded: document.querySelector(".session-selector")?.getAttribute("aria-expanded") ?? null,
      dropdowns: document.querySelectorAll(".session-dropdown").length,
    }))
    check("下拉关", closed.expanded === "false" && closed.dropdowns === 0, JSON.stringify(closed))

    beginStep("CSS + layout")
    const layout = await page.evaluate(() => {
      const app = document.querySelector(".app")
      const flow = document.querySelector('[data-slot="flow"]')
      const status = document.querySelector('[data-slot="status"]')
      const flowRect = flow === null ? null : flow.getBoundingClientRect()
      const statusRect = status === null ? null : status.getBoundingClientRect()
      return {
        display: app === null ? null : getComputedStyle(app).display,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        flowW: flowRect === null ? 0 : flowRect.width,
        flowH: flowRect === null ? 0 : flowRect.height,
        statusGap: statusRect === null ? null : Math.abs(statusRect.bottom - window.innerHeight),
      }
    })
    check("grid", layout.display === "grid", `display = ${layout.display}`)
    check("--bg 亮值实测", layout.bodyBg === "rgb(247, 248, 250)", `background-color = ${layout.bodyBg}`)
    check("flow 盒几何", layout.flowW > 0 && layout.flowH > 0, `w=${layout.flowW} h=${layout.flowH}`)
    check("status 盒底贴视口底", layout.statusGap !== null && layout.statusGap <= 2, `gap = ${layout.statusGap}`)

    beginStep("screenshot + clean face")
    mkdirSync(dirname(SHOT), { recursive: true })
    await rm(SHOT, { force: true })
    await page.screenshot({ path: SHOT })
    let magic = null
    try { magic = (await readFile(SHOT)).subarray(0, 4) } catch { magic = null }
    check("截图在场 + PNG magic", magic !== null && magic.equals(PNG_MAGIC), magic === null ? "missing" : `magic=${[...magic].join(",")}`)
    const unstubbed = await page.evaluate(() => globalThis.__quickcheck?.unstubbed ?? null)
    check("unstubbed = 0", Array.isArray(unstubbed) && unstubbed.length === 0, JSON.stringify(unstubbed))
    check("pageerror = 0", pageErrors.length === 0, pageErrors.join(" | "))
    check("console.error = 0", consoleErrors.length === 0, consoleErrors.join(" | "))
  } finally {
    await browser?.close().catch(() => {})
    await server.close().catch(() => {})
  }

  const failedSteps = steps.filter((entry, index) => {
    const end = index + 1 < steps.length ? steps[index + 1].failures : failures.length
    return end > entry.failures
  })
  if (failures.length > 0) {
    console.error(`[quickcheck] failed: segments=${steps.length - failedSteps.length}/${steps.length} failed=${failures.length}`)
    for (const line of failures) console.error(`  - ${line}`)
    process.exit(1)
  }
  console.log(`[quickcheck] ok: segments=9/9 failed=0 unstubbed=0 pageerrors=0 console-errors=0 png=${SHOT}`)
  process.exit(0)
}

main().catch((error) => {
  console.error(`[quickcheck] aborted: ${error?.stack ?? error}`)
  process.exit(1)
})
