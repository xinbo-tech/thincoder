/** churn 探针（父侧直跑）：detach/reattach（= mountPool 每帧既有路径）是否复位块内容区 ∕ 池容器的滚动位。 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "scroll-probe3-"))
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
  const out = await page.evaluate(async () => {
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    const { mountPool } = await import(new URL("./views/activity.mjs", document.baseURI).href)
    const root = document.querySelector('[data-slot="pool"]')
    const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ kind: "text", text: `行 ${i + 1} 内容内容内容内容内容内容` }))
    // 60 块 × 多行 ⇒ 撑爆池容器（制造池自身滚动位）
    const mkState = (rowsPer) => ({
      activeSession: "1", pool: {}, poolCollapsed: {},
      subBlocks: { "1": Array.from({ length: 60 }, (_, i) => ({ key: `sub:probe#${i}`, label: `p${i}`, role: "probe", id: i, rows: rowsOf(rowsPer), frozen: false, region: "activity", status: "running" })) },
    })
    const log = []
    mountPool(root, mkState(20), {}); await raf2()
    const c = root.querySelector(".advisor-content")
    const pool = { st0: root.scrollTop, sh: root.scrollHeight, ch: root.clientHeight }
    // 制造：块内容区在底 + 池滚到中段 + 旗标设 false（防复钉干扰）
    c._pinFollow = false
    c.scrollTop = c.scrollHeight
    root.scrollTop = 500
    await raf2()
    const before = { contentST: c.scrollTop, poolST: root.scrollTop, poolPin: root._poolPin }
    mountPool(root, mkState(20), {}); // 同态重挂 = 纯 churn
    await raf2()
    const c2 = root.querySelector(".advisor-content")
    const after = { contentST: c2?.scrollTop, sameEl: c2 === c, poolST: root.scrollTop, poolPin: root._poolPin, c2pin: c2?._pinFollow }
    // 池 pin 缺省时（undefined ≠ false）churn 后是否被 re-pin 到底
    const pool2 = { st: root.scrollTop, sh: root.scrollHeight, ch: root.clientHeight }
    return { pool0: pool, before, after, pool2, note: "contentST 68→? ; poolST 500→? ; 池 re-pin 判据 = _poolPin !== false（undefined 时也写）" }
  })
  console.log(JSON.stringify(out, null, 1))
} finally { await app.close() }
