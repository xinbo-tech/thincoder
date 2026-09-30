/**
 * P9 探针 · 波 4（#608④ 说明行判重）—— 真 Electron 单腿（**父侧亲跑**）。
 * 腿：子代理 **queued 取消 ⇒ 再出生 ⇒ 无第二说明行**（首块移除后不再插 —— 与 VSC `S._subDescShown` 同判；
 * 父裁 A（2026-09-29）= 沿 #630 挂载根旗标「一次置位不重置」）。
 * 三帧（真 app 管道：store + reduce ⇒ 帧面）：
 *   A 首出生（queued）⇒ `.sub-desc` 恰一 ∧ 插入点 = 块元素内 `.advisor-content` 之前；
 *   B queued 取消 ⇒ 块表空 ⇒ **零块帧弃账**（重建痕：族容器 ∕ 说明行同灭 —— 旧族 DOM 判据在此帧后必重插）；
 *   C 再出生（started · 新 id）⇒ **零重插**（`.sub-desc` = 0）∧ 新族容器（≠ A 帧引用 —— 判别力证据）。
 * 帧落判面 = **有界谓词等待**（`waitForFunction` 5s + 兜底 `catch` 后照断言 —— 沿波 5 固定墙钟收正先例；
 * 谓词不立 ⇒ 断言照旧出红，判别力不损）；失败信号 = `failed` ∕ `verdict` 读数 + 非零退出码（沿 P1 ∕ P2P5 ∕ P8 先例）。
 * 跑法（自仓库根）：`node .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P9.probe.mjs`
 * 读数落盘 = `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P9-readings.json`（`checks` 六判自述）；
 * 口径先例 = P1 ∕ P8 ∕ P6 读数落盘件。语义单源 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.6④。
 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "m608-p9-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const out = { boot: null, phaseA: {}, phaseB: {}, phaseC: {}, checks: {}, notes: [] }
let verdict = 1
const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  out.boot = await page.evaluate(() => document.documentElement.dataset.boot)

  // ── 探针夹具（真 app 管道：store + reduce ⇒ 帧面；池面经装配层 paintPool ⇒ mountPool）──────────
  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    window.__store = store
    window.__raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    window.__wait = (ms) => new Promise((r) => setTimeout(r, ms))
    window.__sub = (status, extra = {}) => store.set(reduce(store.get(), { channel: "ev:subagent", key: "1", status, role: "probe", ...extra }))
    window.__read = () => {
      const root = document.querySelector('[data-slot="pool"]')
      const desc = root.querySelector(".sub-desc")
      const block = root.querySelector(".sub-block")
      const content = block ? block.querySelector(".advisor-content") : null
      return {
        descCount: root.querySelectorAll(".sub-desc").length,
        descGlobal: document.querySelectorAll(".sub-desc").length,
        blockCount: root.querySelectorAll(".sub-block").length,
        familyPresent: root.querySelector('[data-family="subagents"]') !== null,
        descParentIsBlock: desc !== null && block !== null && desc.parentElement === block,
        descBeforeContent: desc !== null && content !== null
          && [...block.children].indexOf(desc) < [...block.children].indexOf(content),
        modelCount: (store.get().subBlocks ?? {})["1"]?.length ?? 0,
      }
    }
    store.set({ ...store.get(), activeSession: "1", pool: { running: 0, approval: 0, queue: [], approvals: [] }, poolCollapsed: {} })
    await window.__raf2()
  })

  // ── A 帧 · 首出生（queued）── 有界谓词等待（帧落即读 —— 沿波 5 固定墙钟收正先例）──────────
  await page.evaluate(async () => { window.__sub("queued", { id: 1, pool: true, position: 1 }); await window.__raf2() })
  await page.waitForFunction(() => document.querySelector('[data-slot="pool"]').querySelectorAll(".sub-block").length === 1, null, { timeout: 5000 }).catch(() => {})
  out.phaseA = await page.evaluate(async () => {
    await window.__raf2()
    window.__famA = document.querySelector('[data-slot="pool"]').querySelector('[data-family="subagents"]')
    return window.__read()
  })
  // ── B 帧 · queued 取消（零块帧弃账）──────────────────────────────────────────
  await page.evaluate(async () => { window.__sub("cancelled", { id: 1, was: "queued" }); await window.__raf2() })
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-slot="pool"]')
    return root.querySelectorAll(".sub-block").length === 0 && root.querySelector('[data-family="subagents"]') === null
  }, null, { timeout: 5000 }).catch(() => {})
  out.phaseB = await page.evaluate(async () => { await window.__raf2(); return window.__read() })
  // ── C 帧 · 再出生（started · 新 id）─────────────────────────────────────────
  await page.evaluate(async () => { window.__sub("started", { id: 2, pool: true }); await window.__raf2() })
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-slot="pool"]')
    return root.querySelectorAll(".sub-block").length === 1 && root.querySelectorAll(".sub-desc").length === 0
  }, null, { timeout: 5000 }).catch(() => {})
  out.phaseC = await page.evaluate(async () => {
    await window.__raf2()
    const root = document.querySelector('[data-slot="pool"]')
    const famC = root.querySelector('[data-family="subagents"]')
    const r = window.__read()
    r.familyFresh = famC !== null && famC !== window.__famA
    return r
  })

  out.checks = {
    aDescOnce: out.phaseA.descCount === 1,
    aInsertPoint: out.phaseA.descParentIsBlock === true && out.phaseA.descBeforeContent === true,
    bCleared: out.phaseB.blockCount === 0 && out.phaseB.familyPresent === false && out.phaseB.descCount === 0,
    cBlockPresent: out.phaseC.blockCount === 1 && out.phaseC.modelCount === 1,
    cNoSecondDesc: out.phaseC.descCount === 0 && out.phaseC.descGlobal === 0,
    cFamilyRebuilt: out.phaseC.familyFresh === true,
  }
  out.failed = Object.entries(out.checks).filter(([, ok]) => ok !== true).map(([name]) => name)
  out.verdict = out.failed.length === 0
  console.log(JSON.stringify(out, null, 1))
  writeFileSync(join(REPO, ".thincoder", "tmp", "2026-09-29-desktop-rebuild-fidelity-P9-readings.json"), JSON.stringify(out, null, 2))
  verdict = out.verdict ? 0 : 1
} finally {
  await app.close()
}
process.exit(verdict)
