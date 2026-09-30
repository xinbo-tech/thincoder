/**
 * P6 探针 · 波 3（#607 滚动策略族 · 抽核件 pin 工厂）—— 真 Electron 三载体（**父侧亲跑**）。
 * 腿 1 **块内容区**：真滚轮上滚 ⇒ `_pinFollow` 假 ⇒ 新内容帧零写；出口钮在场 ⇒ 真点击 ⇒ 回底 + 清账；滚回底 ⇒ 复钉。
 * 腿 2 **池列**：60 块撑池 ⇒ 真滚轮上滚 ⇒ `_poolPin` 假 ⇒ 新 chunk 帧零写 + 计数钮在场 ⇒ 真点击 ⇒ 回底 + re-pin + 清账。
 * 腿 3 **对话流**：真 app 管道（store + reduce ⇒ 帧面；多块流 —— 单块流与对齐步守卫不相容，属既有渲染面机制）
 *       ——真滚轮上滚 ⇒ `following` 假 ⇒ 新内容帧零写；滚回底 ⇒ `following` 真 ⇒ 贴底 gap 0（`stickToBottom` 径）。
 * 两腿池面经 **store 驱动**（`subBlocks` ∉ POOL_KEYS ⇒ 走 app 装配层 `paintPool` ⇒ `mountPool` + `attachActivityNew`
 * 一次到位——直调 `mountPool` 会绕过计数贴接线）。VSC 面零回归 = **批内件对拍 + 结构判据**
 * （`2026-09-29-desktop-rebuild-fidelity-M607.test.mjs` M-607b ∕ M-607c；本件不驱动 VSC webview——VSC 套件零触）。
 * 跑法（自仓库根）：`node .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.probe.mjs`
 * 读数面 = 逐腿 JSON 打印 + 落盘读数件 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.p6-readings.json`
 * （`checks` 九判 = 腿判据自述——沿 P1 ∕ P8 读数落盘先例）；语义单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8 ④ ∕ §5。
 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "m607-p6-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const out = { boot: null, block: {}, pool: {}, flow: {}, notes: [] }
const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  out.boot = await page.evaluate(() => ({
    boot: document.documentElement.dataset.boot,
    settingsChildren: document.querySelector('[data-slot="settings"]')?.children.length ?? -1,
  }))

  // ── 探针夹具（store 驱动 —— 走 app 装配层；读数面 = 池根 ∕ 块内容区 ∕ 对话流）─────────────
  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ kind: "text", text: `行 ${i + 1} 内容内容内容内容内容内容` }))
    const block = (id, rows) => ({ key: `sub:probe#${id}`, label: `p${id}`, role: "probe", id, rows, frozen: false, region: "activity", status: "running" })
    window.__raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    window.__wait = (ms) => new Promise((r) => setTimeout(r, ms))
    window.__mountA = (n) => store.set({ ...store.get(), activeSession: "1", pool: {}, poolCollapsed: {}, subBlocks: { "1": [block(1, rowsOf(n))] } })
    window.__mountB = (rowsPer, extra = 0) => store.set({
      ...store.get(), activeSession: "1", pool: {}, poolCollapsed: {},
      subBlocks: { "1": Array.from({ length: 60 + extra }, (_, i) => block(i, rowsOf(rowsPer))) },
    })
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } }
    const root = document.querySelector('[data-slot="pool"]')
    window.__readBlock = async () => {
      await window.__raf2()
      const c = root.querySelector(".advisor-content")
      const btn = root.querySelector(".sub-follow-btn")
      return {
        scrollTop: c?.scrollTop ?? null, gap: c ? c.scrollHeight - c.scrollTop - c.clientHeight : null, pin: c?._pinFollow,
        contentBox: box(c), followBtn: btn ? { text: (btn.textContent || "").trim(), ...box(btn) } : null,
      }
    }
    window.__readPool = async () => {
      await window.__raf2()
      const btn = root.querySelector(".activity-new-btn")
      const head = root.querySelector("[data-pool-head]")
      return {
        poolST: root.scrollTop, poolMax: root.scrollHeight - root.clientHeight,
        poolPin: root._poolPin === undefined ? "undefined" : root._poolPin, wired: root._poolNewWired === true,
        poolNew: root._poolNew ?? null, headBox: box(head), btnBox: btn ? { text: (btn.textContent || "").trim(), ...box(btn) } : null,
      }
    }
  })

  // ── 腿 1 · 块内容区（单块池；真滚轮 + 真点击）────────────────────────────────
  await page.evaluate(() => window.__mountA(20))
  await page.waitForTimeout(150)
  out.block.t0 = await page.evaluate(() => window.__readBlock())
  await page.mouse.move(out.block.t0.contentBox.x, out.block.t0.contentBox.y)
  await page.mouse.wheel(0, -120)
  await page.waitForTimeout(200)
  out.block.t1AfterWheel = await page.evaluate(() => window.__readBlock())
  await page.evaluate(() => window.__mountA(24))
  out.block.t2AfterAppend = await page.evaluate(() => window.__readBlock())
  if (out.block.t2AfterAppend.followBtn) {
    await page.mouse.click(out.block.t2AfterAppend.followBtn.x, out.block.t2AfterAppend.followBtn.y)
    await page.waitForTimeout(200)
    out.block.t3AfterBtnClick = await page.evaluate(() => window.__readBlock())
  } else {
    out.notes.push("腿 1：新内容后出口钮不在场（点击腿 SKIP）")
  }
  await page.mouse.move(out.block.t2AfterAppend.contentBox.x, out.block.t2AfterAppend.contentBox.y)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(200)
  out.block.t4AfterWheelBack = await page.evaluate(() => window.__readBlock())

  // ── 腿 2 · 池列（60 块；真滚轮 + 真点击）────────────────────────────────────
  await page.evaluate(() => window.__mountB(20))
  await page.waitForTimeout(150)
  out.pool.t0 = await page.evaluate(() => window.__readPool())
  await page.mouse.move(out.pool.t0.headBox.x, out.pool.t0.headBox.y)
  await page.mouse.wheel(0, -240)
  await page.waitForTimeout(200)
  out.pool.t1AfterWheel = await page.evaluate(() => window.__readPool())
  await page.evaluate(() => window.__mountB(20, 1))
  await page.waitForTimeout(150)
  out.pool.t2AfterChunk = await page.evaluate(() => window.__readPool())
  if (out.pool.t2AfterChunk.btnBox) {
    // 计数钮清账腿：先真滚轮到池顶（钮居池头粘性带 —— 滚动态下块卡（positioned）叠于带上，命中面不可达：
    // 既有叠层观察（#603 探针在册 · 非阻断）；池顶无叠置 ⇒ 真点击可达）
    for (let i = 0; i < 80; i += 1) {
      await page.mouse.move(out.pool.t0.headBox.x, out.pool.t0.headBox.y)
      await page.mouse.wheel(0, -600)
      await page.waitForTimeout(25)
      const st = await page.evaluate(() => document.querySelector('[data-slot="pool"]').scrollTop)
      if (st === 0) break
    }
    out.pool.t2bAtTop = await page.evaluate(() => window.__readPool())
    const target = out.pool.t2bAtTop.btnBox
    if (target) {
      out.pool.btnHitTarget = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y)
        return el ? (el.className || el.tagName) : null
      }, { x: target.x, y: target.y })
      await page.mouse.click(target.x, target.y) // 真鼠标点击（坐标面）
      out.notes.push("腿 2：计数钮真鼠标坐标点击已发")
      await page.waitForTimeout(250)
      out.pool.t3AfterBtnClick = await page.evaluate(() => window.__readPool())
    } else {
      out.notes.push("腿 2：池顶态计数钮不在场（点击腿 SKIP）")
    }
  } else {
    out.notes.push("腿 2：新 chunk 后计数钮不在场（点击腿 SKIP）")
  }

  // ── 腿 3 · 对话流（真 app 管道 · 多块流）────────────────────────────────────
  out.flow.t0 = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    const CHUNK = "流程探针正文段落，含 **粗体** 与 `code` 行内码，用来撑出可滚区。".repeat(120)
    const LONG = "历史块正文。".repeat(400)
    window.__flowChunk = CHUNK
    store.set({ ...store.get(), activeSession: "1", following: true })
    await window.__raf2(); await window.__wait(200)
    store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: "种子" }))
    await window.__raf2(); await window.__wait(200)
    const seed = store.get().blocks[0] // 真归约块形（kind assistant ∕ id live-0 ∕ text ∕ streaming）
    const mk = (i) => ({ ...seed, id: `probe-${i}`, text: `${LONG}（块 ${i}）` })
    store.set({ ...store.get(), blocks: [mk(1), mk(2), mk(3), seed] })
    await window.__raf2(); await window.__wait(250)
    for (let i = 0; i < 3; i += 1) {
      store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: CHUNK }))
      await window.__raf2(); await window.__wait(150)
    }
    const r = flow.getBoundingClientRect()
    return {
      following: store.get().following, scrollTop: flow.scrollTop,
      gap: flow.scrollHeight - flow.scrollTop - flow.clientHeight, box: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
    }
  })
  await page.mouse.move(out.flow.t0.box.x, out.flow.t0.box.y)
  await page.mouse.wheel(0, -300)
  await page.waitForTimeout(250)
  out.flow.t1AfterWheel = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    return { following: store.get().following, scrollTop: flow.scrollTop, gap: flow.scrollHeight - flow.scrollTop - flow.clientHeight }
  })
  out.flow.t2AfterAppend = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    const before = flow.scrollTop
    store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: window.__flowChunk }))
    await window.__raf2(); await window.__wait(200)
    return { before, after: flow.scrollTop, following: store.get().following, gap: flow.scrollHeight - flow.scrollTop - flow.clientHeight }
  })
  await page.mouse.move(out.flow.t0.box.x, out.flow.t0.box.y)
  await page.mouse.wheel(0, 60000)
  await page.waitForTimeout(250)
  out.flow.t3AfterWheelBack = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    return { following: store.get().following, gap: flow.scrollHeight - flow.scrollTop - flow.clientHeight }
  })
  out.flow.t4AfterAppendNearBottom = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    const flow = document.querySelector('[data-slot="flow"]')
    store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: window.__flowChunk }))
    await window.__raf2(); await window.__wait(200)
    return { following: store.get().following, gap: flow.scrollHeight - flow.scrollTop - flow.clientHeight }
  })

  out.checks = {
    blockFlagFalse: out.block.t1AfterWheel.pin === false,
    blockZeroWrite: out.block.t2AfterAppend.scrollTop === out.block.t1AfterWheel.scrollTop,
    blockBtnClear: out.block.t3AfterBtnClick?.gap === 0 && out.block.t3AfterBtnClick?.pin === true && out.block.t3AfterBtnClick?.followBtn === null,
    poolFlagFalse: out.pool.t1AfterWheel.poolPin === false,
    poolZeroWrite: out.pool.t2AfterChunk.poolST === out.pool.t1AfterWheel.poolST,
    poolCountClear: out.pool.t3AfterBtnClick?.poolPin === true && out.pool.t3AfterBtnClick?.poolNew === 0 && out.pool.t3AfterBtnClick?.btnBox === null,
    flowFlagFalse: out.flow.t1AfterWheel.following === false,
    flowZeroWrite: out.flow.t2AfterAppend.after === out.flow.t2AfterAppend.before,
    flowRePin: out.flow.t3AfterWheelBack.following === true && out.flow.t4AfterAppendNearBottom.gap === 0,
  }
  console.log(JSON.stringify(out, null, 1))
  writeFileSync(join(REPO, ".thincoder", "tmp", "2026-09-29-desktop-rebuild-fidelity-M607.p6-readings.json"), JSON.stringify(out, null, 2))
} finally {
  await app.close()
}
