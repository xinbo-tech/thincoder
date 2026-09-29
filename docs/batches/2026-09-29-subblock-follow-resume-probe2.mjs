/** 子 agent 块跟滚 · 真 DOM 探针 v2（自然复现：真滚轮踩旗标 → 哑火 → 回滚恢复）。
 *  在真 Chromium 里：① 流到 20 行（追底）→ ② 真滚轮在内容区上滚 → ③ 继续流 24 行（看是否哑火）
 *  → ④ 真滚轮滚回底 → ⑤ 再流（看是否恢复）。 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "scroll-probe2-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })

  await page.evaluate(async () => {
    const { mountPool } = await import(new URL("./views/activity.mjs", document.baseURI).href)
    const root = document.querySelector('[data-slot="pool"]')
    const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ kind: "text", text: `行 ${i + 1} 内容内容内容内容内容内容` }))
    const mkState = (rows) => ({
      activeSession: "1", pool: {}, poolCollapsed: {},
      subBlocks: { "1": [{ key: "sub:probe#1", label: "probe", role: "probe", id: 1, rows, frozen: false, region: "activity", status: "running" }] },
    })
    window.__mount = (n) => mountPool(root, mkState(rowsOf(n)), {})
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    window.__read = async () => {
      await raf2()
      const c = root.querySelector(".advisor-content")
      const r = c?.getBoundingClientRect()
      return { scrollTop: c?.scrollTop, scrollHeight: c?.scrollHeight, clientHeight: c?.clientHeight,
        gap: c ? c.scrollHeight - c.scrollTop - c.clientHeight : null, pin: c?._pinFollow, rect: r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null }
    }
    window.__mount(20)
    await raf2()
  })

  const s1 = await page.evaluate(() => window.__read())
  console.log("① 流到 20 行：", JSON.stringify(s1))

  // ② 真滚轮：指针移到内容区上，向上滚两格（模拟用户翻看前几行）
  await page.mouse.move(s1.rect.x, s1.rect.y)
  await page.mouse.wheel(0, -120)
  await page.waitForTimeout(150)
  const s2 = await page.evaluate(() => window.__read())
  console.log("② 内容区上滚 120px 后：", JSON.stringify(s2))

  // ③ 继续流（+4 行）：旗标若翻 false ⇒ 应哑火
  await page.evaluate(() => window.__mount(24))
  const s3 = await page.evaluate(() => window.__read())
  console.log("③ 再流 4 行后（哑火判定）：", JSON.stringify(s3))

  // ④ 真滚轮滚回底
  await page.mouse.move(s3.rect.x, s3.rect.y)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(150)
  const s4 = await page.evaluate(() => window.__read())
  console.log("④ 滚回底后：", JSON.stringify(s4))

  // ⑤ 再流（+4 行）：恢复判定
  await page.evaluate(() => window.__mount(28))
  const s5 = await page.evaluate(() => window.__read())
  console.log("⑤ 再流后（恢复判定）：", JSON.stringify(s5))
} finally {
  await app.close()
}
