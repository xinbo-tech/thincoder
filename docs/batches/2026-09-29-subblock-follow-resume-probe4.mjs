/** 子 agent 块跟滚 · 真 DOM 探针 v4（父侧直跑 · #603）：出口钮三读（A1）+ 池区让位两读（A6）。
 *  ① 真滚轮让位 → 新行 → 钮在场（两态文案）+ 点击 ⇒ 回底 + gap 0 + 钮退场；
 *  ② 60 块撑池 → `_poolPin=false` + 池上滚 → 新 chunk ⇒ 池位不动 + 钮在场 → 点击 ⇒ 回底。 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const REPO = "D:/teamcode/thincoder"
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

const base = mkdtempSync(join(tmpdir(), "scroll-probe4-"))
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
    window.__rows = rowsOf
    const block = (id, rows) => ({ key: `sub:probe#${id}`, label: `p${id}`, role: "probe", id, rows, frozen: false, region: "activity", status: "running" })
    window.__mkStateA = (rows) => ({ activeSession: "1", pool: {}, poolCollapsed: {}, subBlocks: { "1": [block(1, rows)] } })
    window.__mkStateB = (rowsPer) => ({ activeSession: "1", pool: {}, poolCollapsed: {}, subBlocks: { "1": Array.from({ length: 60 }, (_, i) => block(i, rowsPer)) } })
    window.__mountA = (n) => mountPool(root, window.__mkStateA(rowsOf(n)), {})
    window.__mountB = (n) => mountPool(root, window.__mkStateB(rowsOf(n)), {})
    window.__mountB2 = (n) => mountPool(root, { ...window.__mkStateB(rowsOf(n)), subBlocks: { "1": [...window.__mkStateB(rowsOf(n)).subBlocks["1"], block(60, rowsOf(n))] } }, {})
    const raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    const btnInfo = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { cls: el.className, text: (el.textContent || "").trim(), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } }
    window.__readA = async () => {
      await raf2()
      const c = root.querySelector(".advisor-content")
      const r = c?.getBoundingClientRect()
      return {
        scrollTop: c?.scrollTop, scrollHeight: c?.scrollHeight, clientHeight: c?.clientHeight,
        gap: c ? c.scrollHeight - c.scrollTop - c.clientHeight : null, pin: c?._pinFollow,
        rect: r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null,
        followBtn: btnInfo(root.querySelector(".sub-follow-btn") ?? root.querySelector("button[data-sub-follow]")),
        buttons: [...root.querySelectorAll("button")].map((b) => btnInfo(b)).filter((b) => b && b.w > 0),
      }
    }
    window.__readB = async () => {
      await raf2()
      return {
        poolST: root.scrollTop, poolSH: root.scrollHeight, poolCH: root.clientHeight,
        poolPin: root._poolPin, poolNew: root._poolNew ?? null,
        buttons: [...root.querySelectorAll("button")].map((b) => btnInfo(b)).filter((b) => b && b.w > 0),
      }
    }
    window.__prepB = () => { root._poolPin = false; root.scrollTop = 500 }
    window.__mountA(20)
    await raf2()
  })

  // ── ① 出口钮三读 ──
  const a1 = await page.evaluate(() => window.__readA())
  console.log("①-1 流到 20 行：", JSON.stringify({ gap: a1.gap, pin: a1.pin }))
  await page.mouse.move(a1.rect.x, a1.rect.y)
  await page.mouse.wheel(0, -120)
  await page.waitForTimeout(150)
  const a2 = await page.evaluate(() => window.__readA())
  console.log("①-2 真滚轮上滚后：", JSON.stringify({ gap: a2.gap, pin: a2.pin, followBtn: a2.followBtn }))
  await page.evaluate(() => window.__mountA(24))
  const a3 = await page.evaluate(() => window.__readA())
  console.log("①-3 新行到达后（钮在场 ∕ 两态）：", JSON.stringify({ gap: a3.gap, pin: a3.pin, st: a3.scrollTop, followBtn: a3.followBtn }))
  if (a3.followBtn) {
    await page.mouse.click(a3.followBtn.x, a3.followBtn.y)
    await page.waitForTimeout(150)
    const a4 = await page.evaluate(() => window.__readA())
    console.log("①-4 点钮后：", JSON.stringify({ gap: a4.gap, pin: a4.pin, st: a4.scrollTop, followBtn: a4.followBtn }))
  } else {
    console.log("①-4 点钮后： SKIP（无钮）", JSON.stringify(a3.buttons))
  }

  // ── ② 池区让位两读 ──
  await page.evaluate(() => window.__mountB(20))
  await page.evaluate(() => window.__prepB())
  const b1 = await page.evaluate(() => window.__readB())
  console.log("②-1 池上滚（_poolPin=false）后：", JSON.stringify({ poolST: b1.poolST, poolPin: b1.poolPin }))
  await page.evaluate(() => window.__mountB2(20))
  const b2 = await page.evaluate(() => window.__readB())
  console.log("②-2 新 chunk 后（池位保真判定）：", JSON.stringify({ poolST: b2.poolST, poolPin: b2.poolPin, poolNew: b2.poolNew, buttons: b2.buttons }))
  const cand = b2.buttons.find((b) => /New|新/.test(b.text) || /new/i.test(b.cls))
  if (cand) {
    const diag = await page.evaluate(async ({ x, y }) => {
      const root = document.querySelector('[data-slot="pool"]')
      const mod = await import(new URL("./views/activity-new.mjs", document.baseURI).href)
      const ret = mod.attachActivityNew(root)
      const top = document.elementFromPoint(x, y)
      const head = root.querySelector("[data-pool-head]")
      const cs = head ? getComputedStyle(head) : null
      const btn = root.querySelector(".activity-new-btn")
      return {
        attachReturned: ret, wired: root._poolNewWired === true,
        topEl: top ? (top.className || top.tagName) : null,
        headPos: cs?.position ?? null, headZ: cs?.zIndex ?? null,
        btnPE: btn ? getComputedStyle(btn).pointerEvents : null,
      }
    }, { x: cand.x, y: cand.y })
    console.log("②-3a 接线（拟 paintPool 径）+ 叠层读数：", JSON.stringify(diag))
    let clickErr = null
    try { await page.locator(".activity-new-btn").click({ timeout: 4000 }) } catch (e) { clickErr = String(e?.message ?? e).split("\n").slice(0, 2).join(" | ") }
    await page.waitForTimeout(150)
    const b3 = await page.evaluate(() => window.__readB())
    console.log("②-3b locator 真点击：", JSON.stringify({ clickErr, poolST: b3.poolST, poolPin: b3.poolPin, poolNew: b3.poolNew }))
  } else {
    console.log("②-3 点池钮后： SKIP（无候选钮）")
  }
} finally {
  await app.close()
}
