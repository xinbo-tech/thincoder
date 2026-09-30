/**
 * 2026-09-29-desktop-rebuild-fidelity-P2P5.probe.mjs — 真机探针件 · 波 2（#606 重建面位 ∕ 焦点保真族 · P2–P5 四腿）。
 * 覆盖 = 批档 §2.4 真机腿（AC-3 真机面）：真 Electron + 真交互驱动（隔离家目录 + 桩模型服务）——
 *   P2 会话条：开下拉（真点）⇒ 帧写（`tabBadges` 翻转）⇒ 下拉 scrollTop 保 ∕ 条目节点身份 ∕ 条目置焦保真；
 *      pointerdown → 帧写 → pointerup ⇒ click 仍达（跨帧点按不丢）。
 *   P3 会话头：busy 翻转（`tabBadges` 含 `running`）前后 `[data-field="model"]` select 节点引用不变 + 只刷
 *      `disabled` ∕ `aria-disabled`；复真同判。
 *   P4 池面：审批条目跨帧身份（`data-prompt-id` 引用不变 + 唯一不重插）——注入面驱动（子 agent 块 = adopt 径
 *      前提；审批 ∕ 读数 = 态面写入，同 store 单树，事件链同形）。
 *   P5 对话流：following=false 滚中位 ⇒ 切 locale（重挂键）⇒ 根 scrollTop 守恒；归档块展开 ⇒ 同帧 ⇒ `open` 保持。
 * 帧写驱动 = 渲染面 store 单例写入（`store.set` —— 与事件归约同树；页面内经动态 `import` 直取）。
 * 读数落盘 `.thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P2P5-readings.json`（+ 截图 `…-p2p5.png`）。
 * 跑法（自仓库根）：`node .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P2P5.probe.mjs`；exit 0 = 全过。
 */
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { createServer } from "node:http"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, "..", "..") // 仓根（`.thincoder/tmp` ∥ `docs/batches` 同深 ⇒ 两处均可跑）
const OUT = join(REPO, ".thincoder", "tmp")
const APP_DIR = join(REPO, "thincoder-desktop")
mkdirSync(OUT, { recursive: true })
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron: electron } = require("playwright-core")
const WAIT = { timeout: 30000 }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const hashOf = (cwd) => createHash("sha1").update(String(cwd).replace(/^([a-z]):/, (_, d) => `${d.toUpperCase()}:`)).digest("hex")

// ── 桩模型服务（OpenAI 兼容；/models 秒回 —— 头面候选面；chat 回文本帧）────────────────────────
const server = createServer((req, res) => {
  let body = ""
  req.on("data", (c) => (body += c))
  req.on("end", () => {
    if (req.url.includes("/models")) {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ object: "list", data: [{ id: "stub-m" }, { id: "stub-m2" }] }))
      return
    }
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.end(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "P2P5 stub" } }] })}\n\ndata: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`)
  })
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const PORT = server.address().port

// ── 夹具（隔离家目录 + 真槽文件；沿 P1 ∕ P8 先例）────────────────────────────────────────────
const home = mkdtempSync(join(tmpdir(), "p2p5-home-"))
const project = mkdtempSync(join(tmpdir(), "p2p5-proj-"))
const stateDir = join(home, ".thincoder")
const slots = join(stateDir, "sessions")
mkdirSync(slots, { recursive: true })
writeFileSync(join(stateDir, "config.json"), JSON.stringify({
  locale: "en",
  defaultModel: "alpha:stub-m",
  providers: [{ name: "alpha", baseURL: `http://127.0.0.1:${PORT}/v1`, apiKey: "k-alpha", model: "stub-m" }],
}))
const base = join(slots, `${hashOf(project)}.json`)
writeFileSync(base, JSON.stringify({ cwd: project }))
writeFileSync(`${base}.1`, JSON.stringify({
  version: 2, cwd: project, title: "P2P5 探针会话", updatedAt: Date.now(),
  history: [
    { role: "user", content: "P2P5 开场", ts: Date.now() - 3000 },
    { role: "assistant", content: "P2P5 开场回执", ts: Date.now() - 2000 },
  ],
  contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: true, advisor: null, effort: null,
  pendingReminders: [], sessionStart: Date.now() - 60000,
  createdBy: "desktop", activeProvider: "alpha", activeModel: "stub-m",
}))
writeFileSync(`${base}.manifest`, JSON.stringify({
  slots: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1), {
    ts: Date.now(), messageCount: 2, updatedAt: Date.now() - i * 1000,
    title: `P2P5 会话 ${i + 1}`, activeProvider: "alpha", activeModel: "stub-m",
  }])),
}))
for (let i = 2; i <= 12; i += 1) {
  writeFileSync(`${base}.${i}`, JSON.stringify({
    version: 2, cwd: project, title: `P2P5 会话 ${i}`, updatedAt: Date.now() - i * 1000,
    history: [{ role: "user", content: `P2P5 开场 ${i}`, ts: Date.now() - 3000 }],
    contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: true, advisor: null, effort: null,
    pendingReminders: [], sessionStart: Date.now() - 60000,
    createdBy: "desktop", activeProvider: "alpha", activeModel: "stub-m",
  }))
}
writeFileSync(`${base}.manifest.desktop`, JSON.stringify({ slot: 1, updatedAt: Date.now() }))

// ── 断言账 ∕ 读数 ─────────────────────────────────────────────────────────────────────────────
const checks = []
const check = (name, cond, detail) => {
  checks.push({ name, pass: cond === true, detail })
  console.log(`${cond === true ? "✓" : "✗"} ${name}${detail === undefined ? "" : ` —— ${JSON.stringify(detail)}`}`)
}
const readings = { phases: {} }
let app = null
try {
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  app = await electron.launch({ args: [".", `--user-data-dir=${join(home, "ud")}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  page.on("pageerror", (e) => console.log(`  [pageerror] ${e.message}`))
  await page.waitForLoadState("domcontentloaded")
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), undefined, WAIT)

  // 前置：开项目 + 续槽 1（真链路）
  const opened = await page.evaluate(async (p) => {
    const mod = await import(new URL("./mount-sessions.mjs", document.baseURI).href)
    const receipt = await window.thincoder.invoke("project:open", { fsPath: p })
    await mod.refreshRail()
    await mod.resumeOpened()
    return receipt
  }, project)
  check("前置：项目已开 + 会话续起", opened?.cwd === project, opened?.cwd)
  const activeKey = await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    return store.get().activeSession
  })
  check("前置：活动会话在场", activeKey !== null && activeKey !== undefined, activeKey)

  /** 页内位标帧写助手（同 store 单树；CSP 禁 `new Function` ⇒ 逐处内联 `page.evaluate`）。 */
  const badgeWrite = (codes) => page.evaluate(async (cs) => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const s = store.get()
    store.set({ tabBadges: { ...(s.tabBadges ?? {}), [s.activeSession]: cs } })
    return true
  }, codes)

  // ── P2 会话条 ────────────────────────────────────────────────────────────────
  await page.click('[data-slot="session-control"] .session-selector')
  await page.waitForSelector(".session-dropdown", { timeout: 8000 })
  const p2before = await page.evaluate(() => {
    const dropdown = document.querySelector(".session-dropdown")
    const item = dropdown.querySelector(".session-item:not(.session-empty)")
    const key = item.getAttribute("data-slot")
    item.focus()
    dropdown.scrollTop = 40 // focus 后置位（focus 可能滚入视 —— 滚位末写保真）
    window.__p2 = { dropdown, item, key, clicks: 0 }
    item.addEventListener("click", () => { window.__p2.clicks += 1 })
    return {
      key, scrollTop: dropdown.scrollTop, max: dropdown.scrollHeight - dropdown.clientHeight,
      focused: document.activeElement === item, badgeBefore: item.querySelector(".session-item-badge")?.getAttribute("data-badge") ?? null,
    }
  })
  readings.phases.p2before = p2before
  check("P2 前置：下拉开 ∧ 条目置焦 ∧ 滚位就位", p2before.focused === true && p2before.scrollTop === 40 && p2before.max > 0, p2before)

  await badgeWrite(["running"])
  await page.waitForFunction(() => document.querySelector(".session-item .session-item-badge") !== null, undefined, { timeout: 8000 }).catch(() => {})
  await sleep(200)
  const p2after = await page.evaluate(() => {
    const dropdown = document.querySelector(".session-dropdown")
    return {
      sameDropdown: window.__p2.dropdown === dropdown,
      sameItem: window.__p2.item === dropdown?.querySelector(`.session-item[data-slot="${window.__p2.key}"]`),
      scrollTop: dropdown?.scrollTop ?? null,
      focused: document.activeElement === window.__p2.item,
      badge: window.__p2.item.querySelector(".session-item-badge")?.getAttribute("data-badge") ?? null,
    }
  })
  readings.phases.p2after = p2after
  check("P2 下拉壳节点身份不变", p2after.sameDropdown === true)
  check("P2 条目节点身份不变（键控复用）", p2after.sameItem === true)
  check("P2 下拉 scrollTop 保真（帧写跨帧）", p2after.scrollTop === 40, { before: 40, after: p2after.scrollTop })
  check("P2 条目置焦保真（帧写 ⇒ 焦点落回同键条目）", p2after.focused === true)
  check("P2 位标随帧更新（idle ⇒ running）", p2after.badge === "running", { before: p2before.badgeBefore, after: p2after.badge })

  // pointerdown → 帧写 → pointerup ⇒ click 仍达（滚位归零 ⇒ 活动条目全幅可见；帧写翻**该条目**位标 = 最强断面）
  const pressKey = await page.evaluate(() => {
    const dropdown = document.querySelector(".session-dropdown")
    dropdown.scrollTop = 0
    const item = window.__p2.item
    window.__p2.clicks = 0
    return item.getAttribute("data-slot")
  })
  const box = await page.locator(`.session-item[data-slot="${pressKey}"]`).boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await badgeWrite(["done"]) // 帧写（位标翻 —— 该条目子件变；条目节点 = 键控复用）
  await sleep(250) // 帧合并出画窗（FRAME_MIN_MS 50）
  await page.mouse.up()
  await page.waitForFunction(() => window.__p2.clicks > 0, undefined, { timeout: 3000 }).catch(() => {})
  const p2click = await page.evaluate(() => ({
    clicks: window.__p2.clicks,
    itemAlive: window.__p2.item === document.querySelector(`.session-item[data-slot="${window.__p2.key}"]`) || window.__p2.item.parentNode !== null,
  }))
  readings.phases.p2click = p2click
  check("P2 跨帧点按不丢：pointerdown → 帧写 → pointerup ⇒ click 达", p2click.clicks > 0, p2click)

  // 改名形点按不误触选择出口（换形 = 换件 —— 形内点按不达条目选择监听；修复前：点入输入框 ⇒ 冒泡触 onSelect ⇒ 关形 + 切会话）
  await page.click('[data-slot="session-control"] .session-selector')
  await page.waitForSelector(".session-dropdown .session-item", { timeout: 8000 })
  await page.click(`.session-item[data-slot="${pressKey}"] [data-action="session:rename"]`)
  await page.waitForSelector('[data-action="session:rename-input"]', { timeout: 8000 })
  const p2renameBefore = await page.evaluate(() => {
    const input = document.querySelector('[data-action="session:rename-input"]')
    window.__p2r = { input }
    return { present: input !== null }
  })
  await page.click('[data-action="session:rename-input"]') // 形内点按（真点）
  await sleep(300)
  const p2renameAfter = await page.evaluate(() => ({
    formStill: window.__p2r.input === document.querySelector('[data-action="session:rename-input"]') && window.__p2r.input.isConnected === true,
    dropdownOpen: document.querySelector(".session-dropdown") !== null,
  }))
  readings.phases.p2rename = { before: p2renameBefore, after: p2renameAfter }
  check("P2 改名形点按不误触选择出口（输入仍连 ∕ 形在场 ∕ 下拉仍开）", p2renameBefore.present === true && p2renameAfter.formStill === true && p2renameAfter.dropdownOpen === true, p2renameAfter)
  await page.click('[data-action="session:rename-cancel"]').catch(() => {}) // 复原（免形滞留影响后续腿）

  // ── P3 会话头 ────────────────────────────────────────────────────────────────
  await page.waitForSelector('[data-field="model"] select', { timeout: 12000 }).catch(() => {})
  const p3before = await page.evaluate(() => {
    const select = document.querySelector('[data-field="model"] select')
    if (select === null) return { present: false }
    window.__p3 = { select }
    return { present: true, disabled: select.disabled === true, options: select.querySelectorAll("option").length }
  })
  readings.phases.p3before = p3before
  check("P3 前置：会话头 model 控件在场", p3before.present === true, p3before)
  if (p3before.present === true) {
    await badgeWrite(["running"])
    await page.waitForFunction(() => window.__p3.select.disabled === true, undefined, { timeout: 8000 }).catch(() => {})
    await sleep(150)
    const p3busy = await page.evaluate(() => ({
      same: window.__p3.select === document.querySelector('[data-field="model"] select'),
      disabled: window.__p3.select.disabled === true,
      aria: window.__p3.select.getAttribute("aria-disabled"),
      options: window.__p3.select.querySelectorAll("option").length,
    }))
    readings.phases.p3busy = p3busy
    check("P3 busy 翻转 ⇒ select 节点引用不变", p3busy.same === true)
    check("P3 busy ⇒ disabled ∕ aria-disabled 就位", p3busy.disabled === true && p3busy.aria === "true", p3busy)
    check("P3 busy 不换 option 集", p3busy.options === p3before.options, { before: p3before.options, after: p3busy.options })
    await badgeWrite([])
    await page.waitForFunction(() => window.__p3.select.disabled !== true, undefined, { timeout: 8000 }).catch(() => {})
    const p3idle = await page.evaluate(() => ({ same: window.__p3.select === document.querySelector('[data-field="model"] select'), disabled: window.__p3.select.disabled === true }))
    readings.phases.p3idle = p3idle
    check("P3 复真 ⇒ 同节点 ∕ disabled 摘除", p3idle.same === true && p3idle.disabled !== true, p3idle)
  }

  // ── P4 池面（审批条目跨帧身份；注入面驱动 —— adopt 径前提 = 子 agent 块在场）──────────────────
  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const s = store.get()
    const key = s.activeSession
    store.set({
      subBlocks: { ...(s.subBlocks ?? {}), [key]: [{ key: "p4-sub", label: "P4-sub", role: "explore", id: 41, status: "running" }] },
      pool: { running: 1, approval: 1, approvals: [{ promptId: "P4-1", shape: "single", tool: "Bash" }], queue: [] },
    })
  })
  await page.waitForSelector('[data-prompt-id="P4-1"]', { timeout: 8000 }).catch(() => {})
  const p4before = await page.evaluate(() => {
    const entry = document.querySelector('[data-prompt-id="P4-1"]')
    window.__p4 = { entry, family: document.querySelector('[data-family="approvals"]') }
    return { present: entry !== null, unique: window.__p4.family?.querySelectorAll('[data-prompt-id="P4-1"]').length ?? 0 }
  })
  readings.phases.p4before = p4before
  check("P4 前置：审批条目在场", p4before.present === true, p4before)
  if (p4before.present === true) {
    await page.evaluate(async () => {
      const { store } = await import(new URL("./store.mjs", document.baseURI).href)
      const s = store.get()
      store.set({ pool: { ...s.pool, running: 5 } })
    }) // 读数变帧（approvals 零改）
    await page.waitForFunction(() => document.querySelector('[data-read="running"]')?.textContent === "5", undefined, { timeout: 8000 }).catch(() => {})
    await sleep(150)
    const p4after = await page.evaluate(() => ({
      sameEntry: window.__p4.entry === document.querySelector('[data-prompt-id="P4-1"]'),
      sameFamily: window.__p4.family === document.querySelector('[data-family="approvals"]'),
      unique: window.__p4.family.querySelectorAll('[data-prompt-id="P4-1"]').length, // 池内唯一（审批卡同锚在流内 —— 另一面）
      running: document.querySelector('[data-read="running"]')?.textContent ?? null,
    }))
    readings.phases.p4after = p4after
    check("P4 读数变帧 ⇒ 审批条目节点引用不变", p4after.sameEntry === true)
    check("P4 族容器引用不变 + 条目唯一（复用不重插）", p4after.sameFamily === true && p4after.unique === 1, p4after)
    check("P4 读数随帧更新（running 1 → 5）", p4after.running === "5", p4after)
  }

  // ── P5 对话流（following=false 滚中位 ⇒ 切 locale；归档块展开 ⇒ 切 locale）────────────────────
  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    const s = store.get()
    const filler = Array.from({ length: 30 }, (_, i) => ({ kind: "assistant", text: `P5 填充行 ${i}` }))
    store.set({
      following: false,
      blocks: [
        { kind: "user", text: "P5 用户", ts: Date.now() - 9000 },
        ...filler,
        {
          kind: "subagent", key: "p5-sub", label: "P5-sub", role: "explore", id: 51,
          meta: { key: "p5-sub", label: "P5-sub", role: "explore", id: 51, frozen: true, status: "done", startedAt: Date.now() - 4000, endedAt: Date.now() - 1000 },
          rows: [{ kind: "text", text: "P5 归档内容" }],
        },
      ],
    })
  })
  await page.waitForSelector('[data-block-kind="subagent"] .advisor-block', { timeout: 8000 }).catch(() => {})
  const p5before = await page.evaluate(() => {
    const flow = document.querySelector('[data-slot="flow"]')
    const echo = document.querySelector('[data-block-kind="subagent"] .advisor-block')
    if (echo !== null) echo.open = true // 用户展开（归档回显默认折）
    flow.scrollTop = Math.min(120, flow.scrollHeight - flow.clientHeight)
    window.__p5 = { flow, echo }
    return { echoPresent: echo !== null, open: echo?.open ?? null, scrollTop: flow.scrollTop, max: flow.scrollHeight - flow.clientHeight, blocks: document.querySelectorAll("[data-block-kind]").length }
  })
  readings.phases.p5before = p5before
  check("P5 前置：归档块回显在场 ∧ 展开 ∧ 滚位非退化", p5before.echoPresent === true && p5before.open === true && p5before.scrollTop > 0, p5before)

  await page.evaluate(async () => {
    const { store } = await import(new URL("./store.mjs", document.baseURI).href)
    store.set({ locale: "zh" })
  }) // 重挂键（locale）⇒ mountChat 重挂径
  await page.waitForFunction(() => document.documentElement.dataset.locale === "zh", undefined, { timeout: 8000 }).catch(() => {})
  await sleep(400) // 帧合并 + 重挂出画
  const p5after = await page.evaluate(() => {
    const flow = document.querySelector('[data-slot="flow"]')
    const echo = document.querySelector('[data-block-kind="subagent"] .advisor-block')
    return {
      locale: document.documentElement.dataset.locale,
      scrollTop: flow.scrollTop,
      open: echo?.open ?? null,
      echoPresent: echo !== null,
      echoRebuilt: window.__p5.echo !== null && echo !== null && window.__p5.echo !== echo, // 重挂痕（免空过 —— 本批 P1 先例）
      blocks: document.querySelectorAll("[data-block-kind]").length,
    }
  })
  readings.phases.p5after = p5after
  check("P5 切 locale ⇒ 重挂确发生（locale 锚换位 + 块面在场 + 回显重建痕）", p5after.locale === "zh" && p5after.blocks === p5before.blocks && p5after.echoRebuilt === true, p5after)
  check("P5 following=false ⇒ 根 scrollTop 守恒（切换 locale 重挂径）", p5after.scrollTop === p5before.scrollTop, { before: p5before.scrollTop, after: p5after.scrollTop })
  check("P5 归档块展开 ⇒ 切 locale ⇒ open 保持", p5after.echoPresent === true && p5after.open === true, p5after)

  await page.screenshot({ path: join(OUT, "2026-09-29-desktop-rebuild-fidelity-p2p5.png") })
} catch (error) {
  check("探针执行", false, String(error?.message ?? error))
} finally {
  try { if (app !== null) await app.close() } catch { /* 已死 */ }
  server.close()
}

writeFileSync(join(OUT, "2026-09-29-desktop-rebuild-fidelity-P2P5-readings.json"), JSON.stringify({ checks, readings }, null, 2))
const failed = checks.filter((c) => !c.pass)
console.log(`\nP2–P5 读数：${checks.filter((c) => c.pass).length}/${checks.length} 过`)
console.log(`读数件 = ${join(OUT, "2026-09-29-desktop-rebuild-fidelity-P2P5-readings.json")}`)
console.log(failed.length === 0 ? "P2–P5 PASS" : `P2–P5 FAIL（${failed.map((f) => f.name).join(" · ")}）`)
for (const dir of [home, project]) { try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) } catch { /* 清理失败不翻判 */ } }
process.exit(failed.length === 0 ? 0 : 1)
