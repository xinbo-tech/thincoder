/**
 * session-ledger-notice.test.mjs — 账本可靠批（LEDGER-RELIABILITY）**VSC 端面**机检
 * （设计 `docs/core/design/SESSION.md` §6.25 判据句 4 · 批档 `docs/batches/2026-09-28-ledger-reliability.md` §2.4 L4 组续编）：
 *   · L4-8 载荷面：`sessions` 消息增字段 `ledger`（`{ refused, reason, scene }`）——**异常才携**
 *     （正常 = 键缺席——负断言；判据单源 = 核 `ledgerHealth(cwd)`）；
 *   · L4-8 注记面：会话下拉**首行警示注记**（非可点条目 / 缺席 ⇒ 零节点 / 异常清 ⇒ 消失）；
 *     文案 = 主句键 + `scene === true` 时**条件附句**键（两键合成；`scene` 缺 / false ⇒ 仅主句）；
 *   · L4-4：会话行计数不可得（`count: null`）⇒ `—msgs`（真 0 ⇒ `0msgs`；禁裸 `null`）。
 *
 * 夹具 = `helpers/webview-env.mjs` `setupWebview()`（happy-dom + en locale）+ 真 `webview/chat.js`
 * 消息循环（`sessions` 载荷派发）+ tmp 会话沙箱（`_setSessionsDirForTest`）。
 * **用例序有意义**：`ledgerHealth().refused` 为本进程累计 ⇒ 先正常面、再「仅现场档」、最后拒写累计。
 * 文案 = 键 `session.ledgerNotice` + `session.ledgerNotice.scene`（zh/en 逐字在册——见 `WEBVIEW-PROTOCOL.md` §6.3）。
 */
import { test, before, after, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { ledgerHealth, loadManifest, manifestPath, saveManifest, slotPath, writeSessionFile } from "@thincoder/core/session.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import { _resetVerifyStateForTest } from "@thincoder/core/session-slot-verify.mjs"
import { pushSessions } from "../src/extension/panel-session.mjs"
import { _cwd } from "../src/extension/panel-messages.mjs"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"

let _tmp = null
let _cleanupEnv = null

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-ledger-notice-"))
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
  vscode.env.language = "en"
  const env = setupWebview()
  _cleanupEnv = env.cleanup
  installFullIndexFixture() // chat.js 顶层 init 读全量 index.html id
})

after(() => {
  try { window.dispatchEvent(new window.MessageEvent("message", { data: { type: "providerStatus", status: {}, keyOk: true } })) } catch { /* teardown edge */ }
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  _cleanupEnv?.()
  vscode.env.language = undefined
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

const slotData = () => ({
  version: 2, cwd: _cwd(), title: "seeded", activeProvider: "prov", updatedAt: Date.now(),
  history: [], contextHistory: [],
})
// 载荷面用例经 `pushSessions` → `listSlots` 登记核实拍（§6.25 判据句 3）——逐例排空，免跨例残留写面
// （与 CLI 姊妹档 `test/session-ledger-notice.test.mjs` 同形）
afterEach(() => { _resetVerifyStateForTest() })
/** 面板桩（`pushSessions` 直驱：真实原型调用面所需最小件——`_slot` 钉住免后台认领）。 */
function stubPanel() {
  const posted = []
  return { _slot: 1, posted, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}
/** 拒写 loud 行静音（stderr 非判据面；断言在 `ledgerHealth` / 载荷）。 */
function quiet(fn) {
  const orig = console.error
  try { fn() } finally { console.error = orig }
}
const sessionsMsg = (p) => p.posted.find((m) => m.type === "sessions")

// ─── 载荷面（L4-8 · 宿主侧）──────────────────────────────────────────────────

test("L4-8 载荷面（正常）：账本正常 ⇒ `sessions` 零 `ledger` 键（负断言）", () => {
  const cwd = _cwd()
  writeSessionFile(slotPath(cwd, 1), slotData())
  assert.equal(ledgerHealth(cwd).refused, 0, "夹具前提：本进程零拒写")
  assert.equal(ledgerHealth(cwd).scene, false, "夹具前提：零现场档")

  const p = stubPanel()
  pushSessions(p)
  const msg = sessionsMsg(p)
  assert.ok(msg, "sessions 载荷在场")
  assert.equal(Object.hasOwn(msg, "ledger"), false, "正常 ⇒ 键缺席（非 `undefined` 值）")
  assert.equal(msg.sessions.length, 1, "列表行照常（零回归）")
})

test("L4-8 载荷面（异常才携 · 仅现场档）：`{manifest}.corrupted` 在盘 ⇒ `ledger = { refused: 0, reason: \"scene\", scene: true }`", () => {
  const cwd = _cwd()
  writeSessionFile(slotPath(cwd, 1), slotData())
  writeFileSync(`${manifestPath(cwd)}.corrupted`, "broken-scene")
  const p = stubPanel()
  pushSessions(p)
  const msg = sessionsMsg(p)
  assert.deepEqual(msg.ledger, { refused: 0, reason: "scene", scene: true }, "载荷 = 核出口投影（判据单源）")
  rmSync(`${manifestPath(cwd)}.corrupted`, { force: true })
})

test("L4-8 载荷面（拒写累计）：`refused > 0` ⇒ `ledger.reason = lastReason`（`scene` 同时在场仍取 `lastReason`）", () => {
  const cwd = _cwd()
  writeSessionFile(slotPath(cwd, 1), slotData())
  writeFileSync(manifestPath(cwd), "{ 坏基座") // 拒写注入（§6.23 不可信基座）
  quiet(() => saveManifest(cwd, loadManifest(cwd)))
  const h = ledgerHealth(cwd)
  assert.ok(h.refused >= 1 && h.scene === true, `夹具前提：refused=${h.refused} scene=${h.scene}`)

  const p = stubPanel()
  pushSessions(p)
  const msg = sessionsMsg(p)
  assert.deepEqual(msg.ledger, { refused: h.refused, reason: h.lastReason, scene: true }, "`reason` 优先取 `lastReason`（非 `scene`）")
})

// ─── 注记面（L4-8 · webview 侧）+ 计数占位（L4-4）────────────────────────────

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const loadWebview = () => import("../webview/chat.js") // 真消息循环（含 session-bar 监听注册）
/** 点开下拉（`index.html` 默认内联 `display:none`——fixture 无内联样式，逐次复位后点开）。 */
function openDropdown() {
  const dd = document.getElementById("session-dropdown")
  dd.style.display = "none"
  document.getElementById("session-selector").click()
  assert.equal(dd.style.display, "block", "下拉已开（buildSessionDropdown 已跑）")
  return dd
}
const notes = () => document.querySelectorAll("[data-ledger-notice]")

test("L4-8 注记面 + L4-4 计数占位：载荷携 `ledger` ⇒ 首行警示注记（非可点 · reason 与指引）；`count: null` ⇒ `—msgs`", async () => {
  await loadWebview()
  const now = Date.now()
  send({
    type: "sessions",
    sessions: [
      { slot: 1, title: "alpha", count: 7, updated: now, provider: null, active: true },
      { slot: 2, title: "beta", count: null, updated: now, provider: null, active: false },
    ],
    active: 1,
    ledger: { refused: 2, reason: "readback-failed", scene: true },
  })
  const dd = openDropdown()

  const note = notes()[0]
  assert.ok(note, "注记节点在场")
  assert.equal(dd.firstElementChild, note, "注记 = 首行（先于会话行）")
  assert.equal(note.tagName, "DIV", "裸 div（非 button）")
  assert.equal(note.getAttribute("role"), null, "零 role（非可点条目）")
  assert.equal(note.getAttribute("tabindex"), null, "零 tabindex")
  assert.equal(note.getAttribute("data-action"), null, "零 data-action")
  assert.equal(note.textContent, "Session ledger anomaly (readback-failed) — opening a session self-heals it; Corrupted-scene files kept 30 days", "scene=true ⇒ 全句逐字（主句 + 「; 」+ 附句——en 在册字面）")

  const rows = dd.querySelectorAll(".session-item")
  assert.equal(rows.length, 2, "会话行零回归")
  assert.ok(rows[0].textContent.includes("7msgs"), "计数在场 ⇒ `Nmsgs`")
  assert.ok(rows[1].textContent.includes("—msgs"), "计数不可得 ⇒ `—msgs`")
  assert.ok(!rows[1].textContent.includes("nullmsgs"), "禁裸 `null`")
})

test("L4-8 注记面（scene=false / 缺 ⇒ 仅主句逐字 ∧ 无附句）：refused > 0 无现场档 ⇒ 不指现场档", async () => {
  await loadWebview()
  const sessions = [{ slot: 1, title: "alpha", count: 3, updated: Date.now(), provider: null, active: true }]
  const MAIN = "Session ledger anomaly (readback-failed) — opening a session self-heals it"

  send({ type: "sessions", sessions, active: 1, ledger: { refused: 1, reason: "readback-failed", scene: false } })
  openDropdown()
  assert.equal(notes()[0].textContent, MAIN, "scene=false ⇒ 仅主句逐字")
  assert.ok(!notes()[0].textContent.includes("Corrupted-scene"), "附句缺席（禁恒附——refused > 0 ∧ scene = false 不指现场档）")

  send({ type: "sessions", sessions, active: 1, ledger: { refused: 1, reason: "readback-failed" } })
  openDropdown()
  assert.equal(notes()[0].textContent, MAIN, "`scene` 缺 ⇒ 与 false 同判（`=== true` 门）")
})

test("L4-8 注记面（缺席 ⇒ 零注记 · 异常清 ⇒ 消失）：无 `ledger` 键 ⇒ 零节点（零历史态）", async () => {
  await loadWebview()
  const sessions = [{ slot: 1, title: "alpha", count: 1, updated: Date.now(), provider: null, active: true }]

  send({ type: "sessions", sessions, active: 1 })
  openDropdown()
  assert.equal(notes().length, 0, "缺席 ⇒ 零注记（负断言）")

  send({ type: "sessions", sessions, active: 1, ledger: { refused: 1, reason: "scene", scene: true } })
  openDropdown()
  assert.equal(notes().length, 1, "携 ⇒ 注记在场")
  assert.ok(notes()[0].textContent.includes("(scene)"), "reason = `scene` 逐字")

  send({ type: "sessions", sessions, active: 1 })
  openDropdown()
  assert.equal(notes().length, 0, "异常清 ⇒ 注记消失（零历史态）")
})

test("L4-8 注记面（zh 面 · scene=true ⇒ 全句逐字 · zh 分隔符「；」）", async () => {
  await loadWebview()
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  send({ type: "i18n", strings: zh }) // 真 i18n 消息路径（chat-messages case "i18n" → setStrings）
  try {
    send({ type: "sessions", sessions: [{ slot: 1, title: "alpha", count: 1, updated: Date.now(), provider: null, active: true }], active: 1, ledger: { refused: 0, reason: "scene", scene: true } })
    openDropdown()
    assert.equal(notes()[0].textContent, "会话账本异常（scene）——打开会话即自动补回；损坏现场档保留 30 天", "zh 全句逐字（主句 + 「；」+ 附句）")
  } finally {
    send({ type: "i18n", strings: en }) // 复位（后续用例 = en 夹具）
  }
})

// ─── 文案面（键在册 · zh/en 逐字）────────────────────────────────────────────

test("L4-8 文案面：`session.ledgerNotice` + `session.ledgerNotice.scene` 两语逐字在册（zh / en）", () => {
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  assert.equal(zh["session.ledgerNotice"], "会话账本异常（${reason}）——打开会话即自动补回", "zh 主句逐字")
  assert.equal(zh["session.ledgerNotice.scene"], "损坏现场档保留 30 天", "zh 附句逐字")
  assert.equal(en["session.ledgerNotice"], "Session ledger anomaly (${reason}) — opening a session self-heals it", "en 主句逐字")
  assert.equal(en["session.ledgerNotice.scene"], "Corrupted-scene files kept 30 days", "en 附句逐字")
})
