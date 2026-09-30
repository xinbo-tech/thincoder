/**
 * 2026-09-29-desktop-config-read-receipt.test.mjs — 桌面 config:read 回执契约收正批 · **批次本地件**
 * （落位沿 #545 现行法：批内件住 `docs/batches/` · 不登记常驻套件 `thincoder-desktop/test/files.mjs` · 随批留存）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-09-29-desktop-config-read-receipt.test.mjs`
 *
 * 射程 = 「判据与回执形错位」类（台账 #667）：
 *   错位本体 = `finishWizard` 按 `receipt.ok === true` 判 ∥ 实回执**无 `ok` 字段**
 *   （形单源 = `thincoder-desktop/src/main/ipc.mjs:105-110` 成功形 = `{ config, locale, dict, configured }`；
 *    失败形 = `mount-settings.mjs` `ask()` 归一 `{ ok:false, reason }`）。
 *   ⇒ 本件夹具一律取**主侧实形**（不得掺消费面假设形——批 9 旧测「收尾复读闸三臂」按假设形造绿而场红，
 *     即本类假绿；2026-09-29 修前红实测在案 = 腿 1 ∕ 2）。
 *
 * 四腿：① 成功·已配（真支：configured 真落 · dismiss 旗不烧）② 成功·仍未配（正常态：零 report · 退场旗）
 *      ③ 真失败（失败臂照走 · 两臂互斥）④ 畸形形（按失败处置——防「任何对象皆成功」过宽判据）
 *      —— ③ ∕ ④ 修前修后皆绿（防过修两向钉）。
 * 形态 = 逻辑缝直测（注入缝 · 零 DOM ∕ 零 electron）：`createWizard(deps)` 直取；
 * 本件依赖 = `renderer/mount-onboarding.mjs` + `renderer/store.mjs`（纯数据面 · 零 `/rc/` 依赖）。
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url)) // 终位 = thincoder/docs/batches
const dsk = (rel) => pathToFileURL(join(here, "../..", "thincoder-desktop", rel)).href

const { createWizard } = await import(dsk("renderer/mount-onboarding.mjs"))
const { createStore, initialState } = await import(dsk("renderer/store.mjs"))

/** 主侧实形夹具（形源 = `thincoder-desktop/src/main/ipc.mjs:105-110`）。 */
const successReceipt = (configured) => ({ config: {}, locale: "en", dict: {}, configured })

/** 一拍静置（`onFinish` 为 `void` 包装 ⇒ 待微任务链跑完）。 */
const settle = () => new Promise((resolve) => setImmediate(resolve))

/** 驱一轮收尾：种子态 = 向导占槽（configured 假 · 未退场 · 步 3）；`report` ∕ `clearReport` 为探针。 */
const driveFinish = async (receipt) => {
  const reports = []
  let clears = 0
  const seed = initialState()
  seed.settings = { ...seed.settings, configured: false, wizard: { step: 3, dismissed: false, notice: null } }
  const store = createStore(seed)
  const wizard = createWizard({
    store,
    ask: async () => receipt,
    report: (...args) => { reports.push(args) },
    clearReport: () => { clears += 1 },
  })
  wizard.handlers.onFinish()
  await settle()
  return { state: store.get(), reports, clears }
}

test("腿 1 · 成功·已配：成功臂（零 report ∕ 清串 ∕ configured 真落槽 ∕ 退场旗不烧）", async () => {
  const { state, reports, clears } = await driveFinish(successReceipt(true))
  assert.equal(reports.length, 0, `成功回执不得走失败臂（实 = ${JSON.stringify(reports)}）`)
  assert.equal(clears, 1)
  assert.equal(state.settings.configured, true)
  assert.equal(state.settings.wizard.dismissed, false) // 真支：configured 闸退场，非 dismiss 旗
})

test("腿 2 · 成功·仍未配：「仍未配」= 正常态（零 report ∕ 正常退场旗）", async () => {
  const { state, reports, clears } = await driveFinish(successReceipt(false))
  assert.equal(reports.length, 0, `成功回执不得走失败臂（实 = ${JSON.stringify(reports)}）`)
  assert.equal(clears, 1)
  assert.equal(state.settings.configured, false)
  assert.equal(state.settings.wizard.dismissed, true)
})

test("腿 3 · 真失败：失败臂照走（恰一次 · 两臂互斥 ∕ 保旧值 · 仍退场）", async () => {
  const { state, reports, clears } = await driveFinish({ ok: false, reason: "config:read rejected: boom" })
  assert.equal(reports.length, 1)
  assert.equal(reports[0][0], "panel")
  assert.equal(reports[0][2], "config:read")
  assert.equal(clears, 0) // 两臂互斥（禁「先清后报」—— 批 9 审计钉）
  assert.equal(state.settings.configured, false) // 回退：保旧值
  assert.equal(state.settings.wizard.dismissed, true)
})

test("腿 4 · 畸形形（缺 configured）：按失败处置（防过宽成功判据）", async () => {
  const { state, reports, clears } = await driveFinish({})
  assert.equal(reports.length, 1)
  assert.equal(clears, 0)
  assert.equal(state.settings.configured, false)
  assert.equal(state.settings.wizard.dismissed, true)
})
