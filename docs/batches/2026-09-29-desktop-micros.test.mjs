/**
 * 批内件 · desktop-micros 码面波机检腿（2026-09-29）——候选终位 = `docs/batches/2026-09-29-desktop-micros.test.mjs`
 * （写门相抵 #545 ⇒ 立即形：本波住 `.thincoder/tmp/`；父侧收位时 copy 至终位）。
 *
 * 覆盖（设计 = 本批 §2 腿三 L-A ∕ L-B ∕ L-C）：
 *  - L-A（J-1 · #576 结构核）：CLI `tui/suspension-drive.mjs` `pendingTimerDeadline` 调用点计 1 ∧ 判据包形
 *    （与桌面 `timerFaceOf` 同形）∧ 导入面 `timerWakeEnabled` 自 `./timer-watch.mjs`（核 re-export 名恒在）；
 *  - L-B（J-4 · #578② 值核）：theme.css 亮色两值提取 = `#8a6100` ∕ `#047990` ∧ WCAG 复算对 `--bg` ∕ `--bg-raised`
 *    皆 ≥4.5（读数 5.21 ∕ 5.54 ∕ 4.77 ∕ 5.07）∧ 暗色块两值零动（`#cca700` ∕ `#11a8cd`）；
 *  - L-C（J-5 · #578③ 结构核）：`session-wire.mjs` `session.deleteFailed` 恰 2 处（两失败径——回执拒 ∕ 抛，
 *    形同 `session.openFailed` 族先例）∧ `i18n-views.mjs` 该键恰 2 处（两语）+ 组注计数「四键」。
 * 复跑：`node --test docs/batches/2026-09-29-desktop-micros.test.mjs`（临时位同跑 —— 路径基准 = 档位两深，
 * `.thincoder/tmp` 与 `docs/batches` 同深 ⇒ `../../` = 仓根，两处均可跑）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

const CLI_SUSP = "thincoder-cli/src/tui/suspension-drive.mjs"
const CLI_WATCH = "thincoder-cli/src/tui/timer-watch.mjs"
const THEME = "thincoder-desktop/renderer/theme.css"
// 越线档结构轮（#536）改指：接线面随批出档 `renderer/session-wire.mjs`（二失败径串皆居该档——复跑绿）
const MOUNT = "thincoder-desktop/renderer/session-wire.mjs"
const I18N = "thincoder-desktop/renderer/i18n-views.mjs"

// ─── L-A · #576（J-1）结构核 ─────────────────────────────────────────────────

test("L-A #576 · deadline 判据包形（调用点计 1 · 同桌面 timerFaceOf 形）", () => {
  const src = text(CLI_SUSP)
  const calls = src.match(/pendingTimerDeadline\s*\(/g) ?? []
  assert.equal(calls.length, 1, "pendingTimerDeadline 调用点计 = 1")
  assert.match(src, /timerWakeEnabled\(agent\)\s*\?\s*pendingTimerDeadline\(agent\)\s*:\s*null/, "判据包形（与桌面 :60 同形）")
  assert.ok(!src.includes("deadline: () => pendingTimerDeadline(agent),"), "旧裸取形退场")
})

test("L-A #576 · 导入面 timerWakeEnabled 自 ./timer-watch.mjs（核 re-export 名恒在）", () => {
  assert.match(text(CLI_SUSP), /import\s*\{[^}]*\btimerWakeEnabled\b[^}]*\}\s*from\s*"\.\/timer-watch\.mjs"/)
  assert.match(text(CLI_WATCH), /export\s*\{\s*timerWakeEnabled\s*\}/, "端面转口在场")
})

// ─── L-B · #578②（J-4）值核 + WCAG 复算 ─────────────────────────────────────

const srgb = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const luminance = (hex) => {
  const h = hex.replace("#", "")
  assert.match(h, /^[0-9a-fA-F]{6}$/, `6 位 hex：${hex}`)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const varOf = (part, name) => {
  const m = part.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))
  return m ? m[1].trim() : null
}

test("L-B #578② · 亮色两值 + WCAG 复算 ≥4.5（对 --bg ∕ --bg-raised）+ 暗色零动", () => {
  const css = text(THEME)
  const darkAt = css.indexOf("@media (prefers-color-scheme: dark)")
  assert.ok(darkAt > 0, "暗色块在场")
  const light = css.slice(0, darkAt)
  const dark = css.slice(darkAt)

  const bg = varOf(light, "bg")
  const raised = varOf(light, "bg-raised")
  const warn = varOf(light, "warn")
  const plan = varOf(light, "mode-plan")
  assert.equal(warn, "#8a6100", "亮色 --warn 定值")
  assert.equal(plan, "#047990", "亮色 --mode-plan 定值")

  const r = {
    warnBg: contrast(warn, bg), warnRaised: contrast(warn, raised),
    planBg: contrast(plan, bg), planRaised: contrast(plan, raised),
  }
  console.log(`[读数] L-B：--warn ${warn} 对 ${bg}=${r.warnBg.toFixed(2)} ∕ ${raised}=${r.warnRaised.toFixed(2)} · --mode-plan ${plan} 对 ${bg}=${r.planBg.toFixed(2)} ∕ ${raised}=${r.planRaised.toFixed(2)}`)
  assert.ok(r.warnBg >= 4.5 && r.warnRaised >= 4.5 && r.planBg >= 4.5 && r.planRaised >= 4.5, "两值两底皆 ≥4.5")
  assert.equal(r.warnBg.toFixed(2), "5.21")
  assert.equal(r.warnRaised.toFixed(2), "5.54")
  assert.equal(r.planBg.toFixed(2), "4.77")
  assert.equal(r.planRaised.toFixed(2), "5.07")

  assert.equal(varOf(dark, "warn"), "#cca700", "暗色 --warn 零动")
  assert.equal(varOf(dark, "mode-plan"), "#11a8cd", "暗色 --mode-plan 零动")
})

// ─── L-C · #578③（J-5）结构核 ───────────────────────────────────────────────

test("L-C #578③ · session-wire 两失败径恰 2 处（形同 openFailed 族先例）", () => {
  const src = text(MOUNT)
  assert.equal((src.match(/session\.deleteFailed/g) ?? []).length, 2, "键恰 2 处（两失败径）")
  assert.ok(src.includes('showToast(t("session.deleteFailed", { reason: reasonOf(receipt) }))'), "回执拒径（同族形）")
  assert.ok(src.includes('showToast(t("session.deleteFailed", { reason: String(error?.message ?? error) }))'), "调用抛径（同族形）")
  assert.equal((src.match(/showToast\(t\("session\.openFailed"/g) ?? []).length, 4, "先例 openFailed 4 处")
  assert.equal((src.match(/showToast\(t\("session\.renameFailed"/g) ?? []).length, 2, "先例 renameFailed 2 处")
})

test("L-C #578③ · i18n 该键恰 2 处（两语）+ 组注计数「四键」", () => {
  const src = text(I18N)
  assert.equal((src.match(/"session\.deleteFailed"/g) ?? []).length, 2, "键恰 2 处（en ∕ zh）")
  assert.ok(src.includes('"session.deleteFailed": "Could not delete the session (${reason})"'), "en 值")
  assert.ok(src.includes('"session.deleteFailed": "会话删除失败（${reason}）"'), "zh 值")
  assert.equal((src.match(/失败面可见性（四键/g) ?? []).length, 2, "两语组注计数 = 四键")
  assert.equal((src.match(/失败面可见性（三键/g) ?? []).length, 0, "旧计数退场")
})
