/**
 * 2026-09-29-desktop-rebuild-fidelity-P1.probe.mjs — 真机探针件 · 波 1（#604 草稿保真总闸 · P1 两径）。
 * 覆盖 = 批档 §2.2 真机腿 P1（AC-1 真机面）：真 Electron + 真交互驱动 ——
 *   ① 向导径：零配置首启（`configured === false` ⇒ 向导占槽）——步 1 渠道表单输入（含光标定位）⇒
 *      触发后台读数落地（外部写 `~/.thincoder/config.json` ⇒ `ev:config` ⇒ `refreshSettings` 径，
 *      见 `renderer/mount-settings.mjs`）⇒ 读回值 ∕ 焦点 ∕ 光标 ∕ 根 scrollTop；
 *   ② 设置径：有配置夹具（`configured === true`）——开项目 + 建会话 ⇒ 模型菜单 footer 首项
 *      「+ Add provider…」开设置面（A8 唯一映射点）⇒ 渠道自定形表单输入（含光标定位）⇒ 同径触发
 *      ⇒ 读回值 ∕ 焦点 ∕ 光标 ∕ 根 scrollTop（含 `checked` ∕ `select` 选面）。
 * 打印 = JSON 报告（`checks` 逐条 + 前后读数）并落 `.thincoder/tmp/…-readings.json`（留证复跑）；
 * 判据不达 ⇒ 退出码 1（零静默）。
 * 跑法（父侧亲跑，自仓库根）：`node .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-P1.probe.mjs`
 */
import { createRequire } from "node:module"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, "..", "..") // 仓根（`.thincoder/tmp` ∥ `docs/batches` 同深 ⇒ 两处均可跑）
const APP_DIR = join(REPO, "thincoder-desktop")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")
const WAIT = { timeout: 30000 }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const SLOT = '[data-slot="settings"]'
const checks = []
const check = (name, ok, detail) => { checks.push({ name, ok: ok === true, ...(detail === undefined ? {} : { detail }) }) }

/** 回环桩（模型面读数秒回 —— 探针确定性；非产品面）。 */
const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({ object: "list", data: [{ id: "p1-model-a" }, { id: "p1-model-b" }] }))
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const PORT = server.address().port

/** 隔离家 + 启动（两径同形）。 */
async function launch(home, tag) {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  env.HOME = home; env.USERPROFILE = home; env.APPDATA = home; env.XDG_CONFIG_HOME = home
  const app = await _electron.launch({ args: [".", `--user-data-dir=${join(home, `ud-${tag}`)}`], cwd: APP_DIR, env, colorScheme: "light" })
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, WAIT)
  return { app, page }
}

// ─── ① 向导径 ─────────────────────────────────────────────────────────────────

async function phaseWizard() {
  const out = {}
  const base = mkdtempSync(join(tmpdir(), "p1-wizard-"))
  const home = join(base, "home")
  mkdirSync(join(home, ".thincoder"), { recursive: true }) // 目录在场（config-watch 挂点）；**无 config.json** ⇒ configured=false
  const { app, page } = await launch(home, "w")
  try {
    // 向导内容短 ⇒ 收窗让根滑面非零（读数非退化）
    try { await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0]?.setSize?.(900, 420) }) } catch (error) { out.resize = String(error) }
    await sleep(400)
    await page.waitForFunction((s) => document.querySelector(`${s}[data-onboarding]`) !== null, SLOT, WAIT)
    out.stepBefore = await page.evaluate((s) => document.querySelector(`${s}[data-onboarding]`)?.getAttribute("data-step") ?? null, SLOT)

    const keySel = `${SLOT} form[data-form="preset"] input[name="key"]`
    await page.fill(keySel, "wiz-real-draft")
    out.before = await page.evaluate((s) => {
      const slot = document.querySelector(s)
      const el = document.querySelector(`${s} form[data-form="preset"] input[name="key"]`)
      el.focus()
      el.setSelectionRange(2, 6)
      const max = slot.scrollHeight - slot.clientHeight
      slot.scrollTop = Math.max(0, Math.min(120, max))
      // 重建痕（重建确发生判据：原表单节点须被替掉 —— 免保真断言空过）
      document.querySelector(`${s} form[data-form="preset"]`).setAttribute("data-probe-stamp", "before")
      return {
        value: el.value, selection: [el.selectionStart, el.selectionEnd], focused: document.activeElement === el,
        scrollTop: slot.scrollTop, scrollMax: max, stamped: true,
      }
    }, SLOT)

    // 触发后台读数落地：外部写 config.json（新档 ⇒ config-watch 元组变 ⇒ `ev:config` ⇒ `refreshSettings` 七读）
    writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
    await page.waitForFunction((s) => {
      const form = document.querySelector(`${s} form[data-form="preset"]`)
      return form !== null && form.getAttribute("data-probe-stamp") === null
    }, SLOT, { timeout: 12000 }).catch(() => {}) // 有界等待（超时照读 —— 判据面自证）
    await page.waitForFunction((s) => document.querySelector(`${s} [data-state="loading"]`) === null, SLOT, { timeout: 12000 }).catch(() => {})
    await sleep(1200) // 余读落定期

    out.after = await page.evaluate((s) => {
      const slot = document.querySelector(s)
      const el = document.querySelector(`${s} form[data-form="preset"] input[name="key"]`)
      return {
        value: el?.value ?? null,
        selection: el ? [el.selectionStart, el.selectionEnd] : null,
        focused: el !== null && document.activeElement === el,
        scrollTop: slot.scrollTop,
        stillWizard: document.querySelector(`${s}[data-onboarding]`) !== null,
        step: document.querySelector(`${s}[data-onboarding]`)?.getAttribute("data-step") ?? null,
        stamp: document.querySelector(`${s} form[data-form="preset"]`)?.getAttribute("data-probe-stamp") ?? null,
      }
    }, SLOT)
  } catch (error) {
    out.error = String(error)
  } finally {
    try { await app.close() } catch { /* 已关 */ }
  }
  out.dir = base
  return out
}

// ─── ② 设置径 ─────────────────────────────────────────────────────────────────

async function phaseSettings() {
  const out = {}
  const base = mkdtempSync(join(tmpdir(), "p1-settings-"))
  const home = join(base, "home")
  const proj = join(base, "proj")
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  mkdirSync(proj, { recursive: true })
  const configPath = join(home, ".thincoder", "config.json")
  const configText = JSON.stringify({
    locale: "en",
    providers: [{ name: "p1", apiKey: "sk-p1-probe", baseURL: `http://127.0.0.1:${PORT}/v1`, model: "p1-model", format: "openai" }],
  })
  writeFileSync(configPath, configText)
  const { app, page } = await launch(home, "s")
  try {
    const inv = (ch, payload) => page.evaluate(([c, p]) => window.thincoder.invoke(c, p), [ch, payload])
    out.open = await inv("project:open", { fsPath: proj })
    out.session = await page.evaluate(async () => {
      const mod = await import(new URL("./mount-sessions.mjs", document.baseURI).href)
      await mod.createSession?.()
      return true
    })

    // 开设置面：模型菜单 footer 首项 = 「+ Add provider…」⇒ openSettings（A8 唯一映射点；`#model-btn` 可见性
    // 由候选面推送决定 —— 交给 click ∕ waitForSelector 自等，不设固定墙钟）
    await page.click("#model-btn")
    await page.waitForSelector(".mm-overlay .mm-manage", { timeout: 15000 })
    await page.click(".mm-overlay .mm-manage")
    await page.waitForFunction((s) => document.querySelector(`${s} [data-form="custom"]`) !== null, SLOT, WAIT)
    await page.waitForFunction((s) => document.querySelector(`${s} [data-state="loading"]`) === null, SLOT, { timeout: 10000 }).catch(() => {})
    await sleep(600) // 余读落定期

    await page.fill(`${SLOT} [data-form="custom"] input[name="name"]`, "p1-draft-name")
    await page.fill(`${SLOT} [data-form="custom"] input[name="baseURL"]`, "http://p1-draft.invalid/v1")
    await page.fill(`${SLOT} [data-form="custom"] input[name="model"]`, "p1-draft-model")
    await page.fill(`${SLOT} [data-form="custom"] input[name="key"]`, "sk-p1-draft")
    await page.selectOption(`${SLOT} [data-form="custom"] select[name="format"]`, "anthropic")
    await page.check(`${SLOT} [data-form="custom"] input[name="active"]`)

    out.before = await page.evaluate((s) => {
      const slot = document.querySelector(s)
      const custom = document.querySelector(`${s} [data-form="custom"]`)
      const el = custom.querySelector('input[name="name"]')
      el.focus()
      el.setSelectionRange(2, 7)
      const max = slot.scrollHeight - slot.clientHeight
      slot.scrollTop = Math.max(0, Math.min(150, max))
      custom.setAttribute("data-probe-stamp", "before") // 重建痕（重建确发生判据 —— 免保真断言空过）
      return {
        name: el.value, selection: [el.selectionStart, el.selectionEnd], focused: document.activeElement === el,
        baseURL: custom.querySelector('input[name="baseURL"]').value,
        model: custom.querySelector('input[name="model"]').value,
        format: custom.querySelector('select[name="format"]').value,
        active: custom.querySelector('input[name="active"]').checked,
        key: custom.querySelector('input[name="key"]').value,
        scrollTop: slot.scrollTop, scrollMax: max, stamped: true,
      }
    }, SLOT)

    // 触发后台读数落地：外部同文重写 config.json（mtime 变 ⇒ `ev:config` ⇒ `refreshSettings` 七读）
    writeFileSync(configPath, configText)
    await page.waitForFunction((s) => {
      const form = document.querySelector(`${s} [data-form="custom"]`)
      return form !== null && form.getAttribute("data-probe-stamp") === null
    }, SLOT, { timeout: 12000 }).catch(() => {}) // 有界等待（超时照读 —— 判据面自证）
    await page.waitForFunction((s) => document.querySelector(`${s} [data-state="loading"]`) === null, SLOT, { timeout: 12000 }).catch(() => {})
    await sleep(1200) // 余读落定期

    out.after = await page.evaluate((s) => {
      const slot = document.querySelector(s)
      const custom = document.querySelector(`${s} [data-form="custom"]`)
      const el = custom?.querySelector('input[name="name"]') ?? null
      return {
        open: document.querySelector(s).getAttribute("data-settings") !== null && document.querySelector(s).getAttribute("data-state") === "open",
        name: el?.value ?? null,
        selection: el ? [el.selectionStart, el.selectionEnd] : null,
        focused: el !== null && document.activeElement === el,
        baseURL: custom?.querySelector('input[name="baseURL"]')?.value ?? null,
        model: custom?.querySelector('input[name="model"]')?.value ?? null,
        format: custom?.querySelector('select[name="format"]')?.value ?? null,
        active: custom?.querySelector('input[name="active"]')?.checked ?? null,
        key: custom?.querySelector('input[name="key"]')?.value ?? null,
        scrollTop: slot.scrollTop,
        stamp: custom?.getAttribute("data-probe-stamp") ?? null,
      }
    }, SLOT)
  } catch (error) {
    out.error = String(error)
  } finally {
    try { await app.close() } catch { /* 已关 */ }
  }
  out.dir = base
  return out
}

// ─── 行程 ─────────────────────────────────────────────────────────────────────

const report = { phaseWizard: await phaseWizard(), phaseSettings: await phaseSettings() }
server.close()

const w = report.phaseWizard
check("向导径：探针无异常", w.error === undefined, w.error)
if (w.before !== undefined && w.after !== undefined) {
  check("向导径：重建确已发生（原表单节点被替换）", w.before.stamped === true && w.after.stamp === null, { stamp: w.after.stamp })
  check("向导径：仍为向导占槽（步 1）", w.after.stillWizard === true && w.after.step === "1", w.after.step)
  check("向导径：key 草稿值保真", w.after.value === w.before.value, { before: w.before.value, after: w.after.value })
  check("向导径：光标区间保真", JSON.stringify(w.after.selection) === JSON.stringify(w.before.selection), { before: w.before.selection, after: w.after.selection })
  check("向导径：焦点保真", w.after.focused === true)
  check("向导径：根 scrollTop 保真", w.after.scrollTop === w.before.scrollTop, { before: w.before.scrollTop, after: w.after.scrollTop, scrollMax: w.before.scrollMax, degenerate: w.before.scrollMax === 0 })
}
const s = report.phaseSettings
check("设置径：探针无异常", s.error === undefined, s.error)
if (s.before !== undefined && s.after !== undefined) {
  check("设置径：重建确已发生（原自定形表单被替换）", s.before.stamped === true && s.after.stamp === null, { stamp: s.after.stamp })
  check("设置径：设置面在场（开态）", s.after.open === true)
  check("设置径：name 草稿值保真", s.after.name === s.before.name, { before: s.before.name, after: s.after.name })
  check("设置径：光标区间保真", JSON.stringify(s.after.selection) === JSON.stringify(s.before.selection), { before: s.before.selection, after: s.after.selection })
  check("设置径：焦点保真", s.after.focused === true)
  check("设置径：baseURL ∕ model ∕ key 保真", s.after.baseURL === s.before.baseURL && s.after.model === s.before.model && s.after.key === s.before.key)
  check("设置径：select 选面保真", s.after.format === s.before.format, { before: s.before.format, after: s.after.format })
  check("设置径：checked 纳域保真", s.after.active === s.before.active && s.before.active === true)
  check("设置径：根 scrollTop 保真", s.after.scrollTop === s.before.scrollTop, { before: s.before.scrollTop, after: s.after.scrollTop, scrollMax: s.before.scrollMax, degenerate: s.before.scrollMax === 0 })
}

report.checks = checks
report.verdict = checks.every((c) => c.ok === true)
const OUT = join(REPO, ".thincoder", "tmp", "2026-09-29-rebuild-fidelity-p1-readings.json")
try { writeFileSync(OUT, JSON.stringify(report, null, 2)) } catch (error) { report.readingsWriteFailed = String(error) }
console.log(JSON.stringify(report, null, 2))
for (const dir of [report.phaseWizard.dir, report.phaseSettings.dir]) {
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
process.exit(report.verdict ? 0 : 1)
