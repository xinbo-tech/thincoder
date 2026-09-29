/** 子 agent 块跟滚 · 真 DOM 探针（父侧直跑 · 非产品码）。
 * 目的：在真 Chromium（同款 Electron 实例）里驱动 `mountPool` 渲染链，判定「跟滚写」是否真实生效。
 * 手法：不接模型——直接以假 state 反复调真代码 `mountPool(root, state)`（= 每 chunk 的既有路径），
 * 逐步增行越过 60px 内容高，逐帧读数 `scrollTop ∕ scrollHeight ∕ clientHeight ∕ _pinFollow ∕ _poolPin`。 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "scroll-probe-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home
env.USERPROFILE = home
env.APPDATA = home
env.XDG_CONFIG_HOME = home

const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  const boot = await page.evaluate(() => document.documentElement.dataset.boot)
  console.log(`boot=${boot}`)

  const out = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    const log = []
    const modUrl = (p) => new URL(p, document.baseURI).href
    const { mountPool } = await import(modUrl("./views/activity.mjs"))
    const root = document.querySelector('[data-slot="pool"]')
    if (!root) return { fatal: "no pool slot" }

    const mkState = (rows, frozen) => ({
      activeSession: "1",
      pool: {}, poolCollapsed: {},
      subBlocks: { "1": [{ key: "sub:probe#1", label: "probe", role: "probe", id: 1, rows, frozen: frozen === true, region: "activity", status: "running" }] },
    })
    const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ kind: "text", text: `行 ${i + 1} 内容内容内容内容内容内容` }))

    // 逐帧：行数 1 → 20，每帧 mountPool（= 既有每 chunk 路径）+ 读数
    for (const n of [1, 3, 8, 14, 20]) {
      mountPool(root, mkState(rowsOf(n)), {})
      await raf2()
      const block = root.querySelector(".sub-block")
      const content = block?.querySelector(".advisor-content")
      log.push({
        rows: n,
        contentFound: content != null,
        scrollTop: content?.scrollTop ?? null,
        scrollHeight: content?.scrollHeight ?? null,
        clientHeight: content?.clientHeight ?? null,
        gap: content ? content.scrollHeight - content.scrollTop - content.clientHeight : null,
        pinFollow: content ? content._pinFollow : null,
        open: block?.open ?? null,
        isConnected: block?.isConnected ?? null,
        poolPin: root._poolPin ?? null,
        poolScrollTop: root.scrollTop,
        poolScrollHeight: root.scrollHeight,
        poolClientHeight: root.clientHeight,
        poolNew: root._poolNew ?? 0,
      })
    }
    // 模拟"用户上滚后再来新内容"（pin=false 径）与"程序重建后 pin 是否复位"
    const content2 = root.querySelector(".advisor-content")
    if (content2) content2._pinFollow = false
    mountPool(root, mkState(rowsOf(24)), {})
    await raf2()
    const c3 = root.querySelector(".advisor-content")
    log.push({ phase: "pin=false 后新 chunk", scrollTop: c3?.scrollTop, gap: c3 ? c3.scrollHeight - c3.scrollTop - c3.clientHeight : null, pinFollow: c3?._pinFollow })
    // 用户上滚后手动滚回近底（scroll 监听应复跟）——真实滚动作
    if (c3) { c3.scrollTop = 0; await raf2(); c3.scrollTop = 0; await raf2() }
    const c4 = root.querySelector(".advisor-content")
    log.push({ phase: "手动回顶后", scrollTop: c4?.scrollTop, pinFollow: c4?._pinFollow })
    await sleep(200)
    const c5 = root.querySelector(".advisor-content")
    log.push({ phase: "回顶静置 200ms 后", scrollTop: c5?.scrollTop, pinFollow: c5?._pinFollow })
    return { log }
  })
  console.log(JSON.stringify(out, null, 1))
} finally {
  await app.close()
}
