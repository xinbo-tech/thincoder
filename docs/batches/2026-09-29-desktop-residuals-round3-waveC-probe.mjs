/**
 * r3-waveC-probe.mjs — 桌面残余三轮 · 波 C **真机探针腿**（#617-CJ 错误面非模态 ∕ 设置面可进可出）。
 * 运行：cd thincoder && node .thincoder/tmp/r3-waveC-probe.mjs（playwright-core 住 thincoder-desktop）。
 * 盘：临时 HOME（畸形 `config.json` ⇒ `config:read` 拒 ⇒ `data-boot="error"`）；真 Electron（`_electron.launch`）。
 * 断言（设计 §2.2 #617-CJ 判据 —— Playwright 真机）：
 *   ① `data-boot="error"` ∧ gate `data-state="error"` ∧ `#boot-reason` 文本在场（非空）
 *   ② 顶部横幅几何：带高 < 100px ∕ 顶贴 0（非全窗）∥ 点击穿透：`elementFromPoint` 命中带下元素（非 gate）
 *   ③ 设置按钮可点：`#settings-btn` Playwright 真点（命中检测）⇒ 设置面 `[data-settings][data-state="open"]` 可见
 *   ④ 设置面可出：`settings:close` 真点 ⇒ 开态节点清零；向导槽空：`[data-onboarding]` 不在场
 *   ⑤ 反例（loading 口径）：清 `data-state` ⇒ gate 复归全窗（bbox = 视口 ∕ 中心命中 = gate）⇒ 还原
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const HERE = dirname(fileURLToPath(import.meta.url))
const APP_DIR = join(HERE, "..", "..", "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron: electron } = require("playwright-core")
const WAIT = { timeout: 30000 }
const home = mkdtempSync(join(tmpdir(), "r3c-probe-"))
mkdirSync(join(home, ".thincoder"), { recursive: true })
// 畸形档（非法 JSON ⇒ loadRaw 抛 ⇒ config:read 拒 ⇒ boot=error）
writeFileSync(join(home, ".thincoder", "config.json"), '{"agent": {"maxTurns": 200,')

const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
delete env.ELECTRON_RUN_AS_NODE
const app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "userData")}`], cwd: APP_DIR, env, colorScheme: "light" })
const page = await app.firstWindow()
const R = {}
try {
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)
  R.boot = await page.evaluate(() => document.documentElement.dataset.boot)
  R.gate = await page.evaluate(() => {
    const g = document.getElementById("boot-gate")
    const reason = document.getElementById("boot-reason")
    return { present: g !== null, state: g?.dataset.state ?? null, reasonText: reason?.textContent ?? "", reasonHidden: reason?.hidden ?? null }
  })
  R.geometry = await page.evaluate(() => {
    const g = document.getElementById("boot-gate")
    const r = g.getBoundingClientRect()
    const hit = document.elementFromPoint(100, Math.min(30, Math.max(1, r.height - 1)))
    return { height: Math.round(r.height), top: Math.round(r.top), width: Math.round(r.width), viewportH: window.innerHeight, hitIsGate: hit === g || g.contains(hit), hitTag: hit?.id || hit?.className || hit?.tagName }
  })
  R.wizardSlotEmpty = await page.evaluate(() => document.querySelector('[data-slot="settings"] [data-onboarding]') === null)
  await page.screenshot({ path: join(HERE, "r3-waveC-error-banner.png") }) // 横幅面（设置面未开）
  // ③ 设置按钮真点（Playwright 命中检测 ⇒ 若被盖则超时）⇒ 设置面可见
  await page.locator("#settings-btn").click({ timeout: 15000 })
  await page.waitForSelector('[data-settings][data-state="open"]', { state: "visible", timeout: 15000 })
  R.settingsOpened = await page.evaluate(() => {
    const face = document.querySelector('[data-settings][data-state="open"]')
    const box = face.getBoundingClientRect()
    return { open: true, visible: box.width > 0 && box.height > 0, closeBtn: !!document.querySelector('[data-action="settings:close"]') }
  })
  await page.screenshot({ path: join(HERE, "r3-waveC-settings-open.png") })
  // ④ 关闭出口真点 ⇒ 开态清零
  await page.locator('[data-action="settings:close"]').click({ timeout: 15000 })
  await page.waitForFunction(() => document.querySelector('[data-settings][data-state="open"]') === null, undefined, WAIT)
  R.settingsClosed = true
  // ⑤ 反例：清 data-state ⇒ 复归全窗（loading 口径）；还原 error
  R.loadingShape = await page.evaluate(() => {
    const g = document.getElementById("boot-gate")
    g.dataset.state = ""
    const r = g.getBoundingClientRect()
    const center = document.elementFromPoint(Math.round(window.innerWidth / 2), Math.round(window.innerHeight / 2))
    const out = { height: Math.round(r.height), viewportH: window.innerHeight, centerIsGate: center === g || g.contains(center) }
    g.dataset.state = "error"
    return out
  })
} catch (error) {
  R.error = String(error?.message ?? error)
} finally {
  try { await app.close() } catch {}
  console.log(JSON.stringify(R, null, 2))
  rmSync(home, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  process.exit(0)
}
