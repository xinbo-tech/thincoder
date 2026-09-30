/**
 * P10 探针 · 舱 2（#660 —— KD-47 ⑤ 零块帧领用门放宽）—— 真 Electron（本舱亲跑作证 ∕ 父侧可复跑）。
 * 两腿（语义单源 = `docs/batches/2026-09-29-desktop-carryover.md` §2.7 + `docs/desktop/design/PROJECT.md` §2 KD-47 ⑤）：
 *   A **零块 ∧ 审批在场**（帧可达配置 = 首回合首个工具审批：主回合 `ev:approval` 亦写 `pool.approvals`，子 agent
 *     块尚未出生）⇒ 帧连发（含一条 `ev:approval` 同件复现的**真事件链帧**）：审批条目 ∕ 出口钮节点引用不变 +
 *     `hover` 在场 + 跨帧点按（pointerdown → 帧写 → pointerup ⇒ click 达同枚钮）+ 头原位（宿主首元素）+ 零块帧
 *     不产族壳；**焦点保真腿**（池面独帧——`subBlocks`
 *     键不入对话流面键集：池键帧（`pool.running`）帧尾对话流审批卡 F-置焦自动锚（`app.mjs:195` `focusAutofocus`）
 *     会夺焦于流内安全出口（独立机制——本批零干涉，该配置下焦点实际落点另注 notes ∕ 不入断言）⇒ 池钮焦点
 *     保真按实测配置在池面独帧上采（该腿命名 `aFocusKeptPoolOnly` 自陈射程））。
 *   B **出生 ⇒ 族壳新建**（首个子 agent 块）：族壳在场 + 块正常 + 审批条目身份存续；块出表（零块帧，审批仍在场）
 *     ⇒ 族壳摘离；再出生 ⇒ 族壳换代（≠ 前枚 —— R5 零块弃账语义保持）。
 * 帧写驱动 = 渲染面 store 单例写入（`store.set` —— 与事件归约同树；审批 = `ev:approval` 归约、块 = `ev:subagent`
 * 归约 —— 沿 P4 ∕ P9 先例）。判面 = **有界谓词等待**（`waitForFunction` + 兜底 `catch` 后照断言——判别力不损）；
 * 失败信号 = `failed` ∕ `verdict` 读数 + 非零退出码（沿 P9 ∕ P1 ∕ P2P5 先例）。
 * 跑法（自仓库根）：`node .thincoder/tmp/2026-09-29-desktop-carryover-P10.probe.mjs`（暂存位两层深 ⇒ 与终位
 * `docs/batches/` 同名件相对路径一致；终位转正 = 父侧收口——写门拒子代理批内伴随件，沿 RF 批 §5 先例）。
 * 读数落盘 = `.thincoder/tmp/2026-09-29-desktop-carryover-P10-readings.json`（`checks` 逐判自述）。
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

const POOL = '[data-slot="pool"]'
const ENTRY = `${POOL} [data-prompt-id="P10-1"]`
const BTN = `${ENTRY} [data-action="approval:once"]`

const base = mkdtempSync(join(tmpdir(), "carryover-p10-"))
const home = join(base, "home")
mkdirSync(join(home, ".thincoder"), { recursive: true })
writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home

const out = { boot: null, phaseA: {}, phaseB: {}, checks: {}, notes: [] }
const failedOf = (checks) => Object.entries(checks).filter(([, ok]) => ok !== true).map(([name]) => name)
let verdict = 1
const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env })
try {
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  out.boot = await page.evaluate(() => document.documentElement.dataset.boot)

  // ── 夹具（真 app 管道：store 单例 + `reduce` ⇒ 帧面 paintPool ⇒ mountPool）──────────────────────
  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const { reduce } = await import(new URL("./events.mjs", document.baseURI).href)
    window.__store = store
    window.__raf2 = async () => { await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => requestAnimationFrame(r)) }
    window.__approval = (item) => store.set(reduce(store.get(), { channel: "ev:approval", key: "1", ...item }))
    window.__sub = (status, extra = {}) => store.set(reduce(store.get(), { channel: "ev:subagent", key: "1", status, role: "probe", ...extra }))
    const frame = () => store.set({ pool: { ...store.get().pool, running: (store.get().pool?.running ?? 0) + 1 } })
    window.__frame = frame
    // 池面独帧驱动（`subBlocks` 键仅命池面键集——帧尾无对话流 F-置焦自动锚夺焦）
    window.__frameBlocks = () => store.set({ subBlocks: { ...(store.get().subBlocks ?? {}), "1": [...(store.get().subBlocks?.["1"] ?? [])] } })
    window.__read = () => {
      const root = document.querySelector('[data-slot="pool"]')
      const entry = root.querySelector('[data-prompt-id="P10-1"]')
      const btn = entry === null ? null : entry.querySelector('[data-action="approval:once"]')
      const head = root.querySelector("[data-pool-head]")
      return {
        state: root.getAttribute("data-state"),
        entryPresent: entry !== null,
        entrySame: entry !== null && entry === window.__p10?.entry,
        btnSame: btn !== null && btn === window.__p10?.btn,
        familySame: root.querySelector('[data-family="approvals"]') === window.__p10?.fam,
        uniqueEntry: root.querySelectorAll('[data-prompt-id="P10-1"]').length,
        activeSameBtn: btn !== null && document.activeElement === btn,
        hoverSameBtn: btn !== null && btn.matches(":hover"),
        familyShell: root.querySelector('[data-family="subagents"]') !== null,
        blockCount: root.querySelectorAll(".sub-block").length,
        headFirst: head !== null && root.children[0] === head,
        headFresh: head !== null && head !== window.__p10?.head,
        activeDesc: document.activeElement === null ? null : `${document.activeElement.tagName}.${document.activeElement.className}`,
        running: root.querySelector('[data-read="running"]')?.textContent ?? null,
      }
    }
    store.set({ ...store.get(), activeSession: "1", subBlocks: { "1": [] }, poolCollapsed: {}, pool: { approvals: [], queue: [], running: 0, approval: 0 } })
    await window.__raf2()
  })
  await page.waitForFunction(() => document.querySelector('[data-slot="pool"]')?.getAttribute("data-state") === "empty", null, { timeout: 5000 }).catch(() => {})

  // ── 腿 A · 首个工具审批（零块 ∧ 审批在场）────────────────────────────────────────────────────
  await page.evaluate(async () => { window.__approval({ promptId: "P10-1", shape: "single", tool: "Bash", argsSummary: "probe" }); await window.__raf2() })
  await page.waitForFunction(() => document.querySelector('[data-slot="pool"] [data-prompt-id="P10-1"]') !== null, null, { timeout: 5000 }).catch(() => {})
  await page.evaluate(async () => {
    await window.__raf2()
    const root = document.querySelector('[data-slot="pool"]')
    const entry = root.querySelector('[data-prompt-id="P10-1"]')
    window.__p10 = {
      entry,
      btn: entry === null ? null : entry.querySelector('[data-action="approval:once"]'),
      fam: root.querySelector('[data-family="approvals"]'),
      head: root.querySelector("[data-pool-head]"),
    }
    window.__click = { seen: false, sameBtn: false }
    window.__famBefore = root.querySelector('[data-family="subagents"]') // 腿 B 前枚族壳（零块期 = null）
    document.addEventListener("click", (event) => {
      window.__click.seen = true
      for (let node = event.target; node !== null && node !== undefined; node = node.parentNode) {
        if (node === window.__p10.btn) { window.__click.sameBtn = true; break }
      }
    }, true)
    if (window.__p10.btn !== null) window.__p10.btn.focus()
  })
  out.phaseA.first = await page.evaluate(async () => { await window.__raf2(); return window.__read() })
  await page.hover(BTN) // 真鼠标悬停（hover 伪态须真指针在场）
  out.phaseA.hover = await page.evaluate(() => ({
    hoverSameBtn: window.__p10.btn.matches(":hover"),
    activeSameBtn: document.activeElement === window.__p10.btn,
  }))

  // 帧连发（读数变 0 → 1 → 2；审批 ∕ 队列零改 —— #660 前每帧全建，条目 ∕ 钮引用必换）
  await page.evaluate(async () => { window.__frame(); await window.__raf2() })
  await page.waitForFunction(() => document.querySelector('[data-slot="pool"] [data-read="running"]')?.textContent === "1", null, { timeout: 5000 }).catch(() => {})
  await page.evaluate(async () => { window.__frame(); await window.__raf2() })
  await page.waitForFunction(() => document.querySelector('[data-slot="pool"] [data-read="running"]')?.textContent === "2", null, { timeout: 5000 }).catch(() => {})
  out.phaseA.frames = await page.evaluate(async () => { await window.__raf2(); return window.__read() })

  // 生产事件帧（`ev:approval` 同 promptId 复现 ⇒ 就地替换——真事件链帧源；身份判面同断言）
  await page.evaluate(async () => { window.__approval({ promptId: "P10-1", shape: "single", tool: "Bash", argsSummary: "probe" }); await window.__raf2() })
  out.phaseA.eventFrame = await page.evaluate(async () => { await window.__raf2(); return window.__read() })

  // 跨帧点按（pointerdown → 帧写 → pointerup ⇒ click 达同枚钮 —— 沿 P2 先例）
  const box = await page.locator(BTN).boundingBox()
  out.phaseA.box = box === null ? null : { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }
  if (box !== null) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.evaluate(async () => { window.__frame(); await window.__raf2() })
    await page.waitForFunction(() => document.querySelector('[data-slot="pool"] [data-read="running"]')?.textContent === "3", null, { timeout: 5000 }).catch(() => {})
    await page.mouse.up()
    await page.waitForFunction(() => window.__click.seen === true, null, { timeout: 3000 }).catch(() => {})
  }
  out.phaseA.click = await page.evaluate(async () => {
    await window.__raf2()
    return { seen: window.__click.seen, sameBtn: window.__click.sameBtn, entryStill: document.querySelector('[data-slot="pool"] [data-prompt-id="P10-1"]') !== null }
  })
  out.phaseA.after = await page.evaluate(async () => { await window.__raf2(); return window.__read() })
  // 焦点保真腿（池面独帧 —— 同枚钮持焦）：focus → 帧 → 同枚？
  out.phaseA.focus = await page.evaluate(async () => {
    await window.__raf2()
    window.__p10.btn.focus()
    await window.__raf2()
    const before = document.activeElement === window.__p10.btn
    window.__frameBlocks()
    await window.__raf2()
    return {
      before,
      after: document.activeElement === window.__p10.btn,
      focusPseudo: window.__p10.btn.matches(":focus"),
      activeDesc: document.activeElement === null ? null : `${document.activeElement.tagName}.${document.activeElement.className}`,
    }
  })
  if (out.phaseA.after.activeSameBtn !== true) {
    out.notes.push("池键帧（pool.running）帧尾：对话流面重挂 —— 审批卡 F-置焦自动锚（app.mjs:195 focusAutofocus）夺焦于流内安全出口（独立机制·本批零干涉）——池钮焦点保真改由池面独帧（subBlocks 键）采")
  }

  // ── 腿 B · 出生 ⇒ 族壳新建（R5 零块弃账语义保持）──────────────────────────────────────────────
  out.phaseB.before = await page.evaluate(async () => { await window.__raf2(); return window.__read() }) // 零块帧不产族壳
  await page.evaluate(async () => { window.__sub("queued", { id: 1, pool: true, position: 1 }); await window.__raf2() })
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="pool"] .sub-block').length === 1, null, { timeout: 5000 }).catch(() => {})
  out.phaseB.born = await page.evaluate(async () => {
    await window.__raf2()
    window.__fam1 = document.querySelector('[data-slot="pool"] [data-family="subagents"]')
    const r = window.__read()
    r.familyFresh = window.__fam1 !== null && window.__famBefore !== window.__fam1
    return r
  })
  await page.evaluate(async () => { window.__sub("cancelled", { id: 1, was: "queued" }); await window.__raf2() }) // 零块帧（审批仍在场）
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="pool"] .sub-block').length === 0, null, { timeout: 5000 }).catch(() => {})
  out.phaseB.cleared = await page.evaluate(async () => { await window.__raf2(); return window.__read() })
  await page.evaluate(async () => { window.__sub("started", { id: 2, pool: true }); await window.__raf2() }) // 再出生
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="pool"] .sub-block').length === 1, null, { timeout: 5000 }).catch(() => {})
  out.phaseB.reborn = await page.evaluate(async () => {
    await window.__raf2()
    const fam2 = document.querySelector('[data-slot="pool"] [data-family="subagents"]')
    const r = window.__read()
    r.familyFresh = fam2 !== null && fam2 !== window.__fam1 && fam2 !== window.__famBefore
    return r
  })

  const a = out.phaseA
  out.checks = {
    // 腿 A —— 零块 ∧ 审批在场帧面
    aStatePool: a.first.state === "pool",
    aEntryPresent: a.first.entryPresent === true && a.first.uniqueEntry === 1,
    aNoFamilyShell: a.first.familyShell === false,
    aHoverPre: a.hover.hoverSameBtn === true,
    aFocusPre: a.hover.activeSameBtn === true,
    aEntrySame: a.frames.entrySame === true,
    aBtnSame: a.frames.btnSame === true,
    aFamilySame: a.frames.familySame === true,
    aUnique: a.frames.uniqueEntry === 1,
    aHoverKept: a.after.hoverSameBtn === true,
    aFocusKeptPoolOnly: a.focus.before === true && a.focus.after === true && a.focus.focusPseudo === true,
    aEventFrameKept: a.eventFrame.entrySame === true && a.eventFrame.btnSame === true && a.eventFrame.uniqueEntry === 1,
    aHeadInPlace: a.after.headFirst === true && a.after.headFresh === true,
    aStillNoShell: a.after.familyShell === false,
    aClickSameBtn: a.click.seen === true && a.click.sameBtn === true,
    aFramesLanded: a.after.running === "3",
    // 腿 B —— 出生 ∕ 出表 ∕ 再出生
    bNoShellBefore: out.phaseB.before.familyShell === false,
    bBornFamily: out.phaseB.born.familyFresh === true && out.phaseB.born.blockCount === 1,
    bBornEntryKept: out.phaseB.born.entrySame === true && out.phaseB.born.btnSame === true,
    bClearShell: out.phaseB.cleared.familyShell === false && out.phaseB.cleared.blockCount === 0,
    bClearEntryKept: out.phaseB.cleared.entrySame === true,
    bRebornFamily: out.phaseB.reborn.familyFresh === true && out.phaseB.reborn.blockCount === 1,
    bRebornEntryKept: out.phaseB.reborn.entrySame === true && out.phaseB.reborn.btnSame === true,
  }
  if (out.phaseA.click.entryStill !== true) out.notes.push("点按后审批条目退场（探针夹具副作用——身份判面不受影响）")
  out.failed = failedOf(out.checks)
  out.verdict = out.failed.length === 0
  console.log(JSON.stringify(out, null, 1))
  writeFileSync(join(REPO, ".thincoder", "tmp", "2026-09-29-desktop-carryover-P10-readings.json"), JSON.stringify(out, null, 2))
  verdict = out.verdict ? 0 : 1
} finally {
  await app.close()
}
process.exit(verdict)
