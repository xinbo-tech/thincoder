/**
 * session-ledger-notice.test.mjs — 账本可靠批（LEDGER-RELIABILITY）**CLI 端面**机检
 * （设计 `docs/core/design/SESSION.md` §6.25 判据句 4 · 批档 `docs/batches/2026-09-28-ledger-reliability.md` §2.4 L4 组端侧续编）：
 *   · L4-3：`/session` 行计数不可得（`null`）⇒ `— turns`（真 0 ⇒ `0 turns`；禁显示 `null` / 假 0）；
 *   · L4-6 / L4-7：账本异常（`refused > 0 ∨ scene`）⇒ CLI 两处（`/session` 头 · 启动行）各出警示一行；
 *   · L4-9：启动行在场条件**不继承** `allSlots.length > 1`——单会话 / 零会话项目同样在场。
 *
 * 夹具 = 隔离 sessions 根（`_setSessionsDirForTest`）+ 真实槽文件 / manifest；拒写注入 = 坏基座 +
 * `saveManifest`（§6.23 拒写面）。**用例序有意义**：`ledgerHealth().refused` 为本进程累计 ⇒
 * 先正常面、再「仅现场档」、最后拒写累计（否则 `reason` 面不可分——`refused > 0` 恒压过 `scene`）。
 * 文案 = 三端同句 zh 在册字面：`会话账本异常（<reason>）——打开会话即自动补回`，
 * `scene` 在场附 `；损坏现场档保留 30 天`（§6.25 判据句 4 的条件附句）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { handleSessionCommand } from "../src/tui/cmd-session.mjs"
import { showStartup } from "../src/tui/startup.mjs"
import { ledgerHealth, loadManifest, manifestPath, saveManifest, slotPath, writeSessionFile } from "@thincoder/core/session.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest } from "@thincoder/core/session-slots.mjs"
import { _resetVerifyStateForTest } from "@thincoder/core/session-slot-verify.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\ledger-cli" : "/proj/ledger-cli"
let dir = null

before(() => {
  dir = mkdtempSync(join(tmpdir(), "cli-ledger-notice-"))
  _setSessionsDirForTest(dir)
})
after(() => {
  _resetVerifyStateForTest()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => {
  for (const e of readdirSync(dir)) rmSync(join(dir, e), { recursive: true, force: true })
})
afterEach(() => {
  // 列表调用会登记核实拍（§6.25 判据句 3）——逐例排空，免跨例残留写面
  _resetVerifyStateForTest()
})

// ─── 夹具 ────────────────────────────────────────────────────────────────────

function putSlot(n, data = {}) {
  writeSessionFile(slotPath(CWD, n), {
    version: 2, cwd: CWD, title: "", activeProvider: "prov", updatedAt: 7,
    history: [], contextHistory: [], ...data,
  })
}
function putManifest(m = {}) {
  writeFileSync(manifestPath(CWD), JSON.stringify({ slots: {}, sessionId: "test", ...m }))
}
/** 拒写 loud 行静音（stderr 非判据面；断言在返回值 / `ledgerHealth`）。 */
function quiet(fn) {
  const orig = console.error
  const errs = []
  console.error = (...a) => errs.push(a.join(" "))
  try { fn() } finally { console.error = orig }
  return errs
}
/** 启动屏 ctx（`showStartup` 直驱——真实函数面；无 crashNotice / 无 restored）。 */
function startupCtx(cwd) {
  const lines = []
  return {
    lines,
    ctx: {
      agent: { cwd, provider: { apiKey: "k", model: "m" }, activeProvider: "prov", tools: [] },
      state: { lines: [], _linesChars: 0 },
      opts: {},
      pushLine: (t) => lines.push(String(t)),
      pushLabel: (l) => lines.push(String(l)),
      render: () => {},
      startWizard: () => {},
    },
  }
}
/** `/session` ctx（picker entries 捕获——不落选择；agent 取 manifest-flip-refusal 同形）。 */
function sessionCtx(cwd) {
  const lines = []
  const entries = []
  return {
    lines,
    entries,
    ctx: {
      agent: {
        cwd, config: { agent: { engineering: false } }, providers: [], provider: {},
        history: [], _fullHistory: [], tasks: [], title: "", planMode: false,
        _slot: null, _slotMtime: null, _sessionStart: null, _engDesignTokens: null,
      },
      state: { lines: [], _linesChars: 0 },
      showPicker: async (_title, es) => { entries.push(...es); return null },
      pushLine: (t) => lines.push(String(t)),
      pushLabel: (l) => lines.push(String(l)),
      render: () => {},
    },
  }
}
const isWarn = (s) => String(s).startsWith("会话账本异常（")
const warnLines = (lines) => lines.filter(isWarn)

// ─── L4-3 行计数占位（判据句 4 显示面）────────────────────────────────────────

test("L4-3 `/session` 行：计数不可得 ⇒ `— turns` ∧ 真 0 ⇒ `0 turns`（禁裸 null）；正常账本 ⇒ 两处零警示行（负断言）", async () => {
  putSlot(1, { title: "empty-real-zero" })
  putSlot(2, { title: "unknown-count" })
  const now = Date.now()
  putManifest({
    slots: {
      // 真 0：摘要带数值 0（可信——不触发核实）
      1: { ts: now + 1000, messageCount: 0, turnCount: 0, updatedAt: now, title: "empty-real-zero" },
      // 不可得：摘要在场但计数两字段缺席 ⇒ null（不假造 0）
      2: { ts: now + 1000, updatedAt: now, title: "unknown-count" },
    },
  })

  const s = sessionCtx(CWD)
  await handleSessionCommand(s.ctx)
  const items = s.entries.filter((e) => e.type === "item").map((e) => e.text)
  const zero = items.find((x) => x.startsWith("Slot 1 "))
  const unknown = items.find((x) => x.startsWith("Slot 2 "))
  assert.ok(zero?.includes("0 turns"), `真 0 ⇒ \`0 turns\`（实到 ${zero}）`)
  assert.ok(unknown?.includes("— turns"), `不可得 ⇒ \`— turns\`（实到 ${unknown}）`)
  assert.ok(!unknown.includes("0 turns") && !unknown.includes("null"), "禁假 0 / 禁裸 null")
  assert.ok(s.entries[0].text.startsWith("Sessions ("), "正常账本 ⇒ 首行仍是列表头（零警示前缀——负断言）")

  const u = startupCtx(CWD)
  showStartup(u.ctx)
  assert.deepEqual(warnLines(u.lines), [], "正常账本 ⇒ 启动面零警示行（负断言）")
})

// ─── L4-7 / L4-9 警示行（仅现场档 · 单 / 零会话项目在场）────────────────────

test("L4-9 启动警示行（零会话项目）：`{manifest}.corrupted` 在盘 ⇒ 在场——脱离 `allSlots.length > 1`（零会话无 Tip 行）", () => {
  writeFileSync(`${manifestPath(CWD)}.corrupted`, "broken-scene") // 现场档（§6.23 保全面产物）
  const h = ledgerHealth(CWD)
  assert.equal(h.scene, true, "夹具前提：现场在盘")
  assert.equal(h.refused, 0, "夹具前提：本进程零拒写（reason 面 = `scene`）")

  const u = startupCtx(CWD)
  showStartup(u.ctx)
  assert.ok(!u.lines.some((l) => String(l).startsWith("Tip:")), "零会话项目 ⇒ 无多会话 Tip 行")
  const warn = warnLines(u.lines)
  assert.equal(warn.length, 1, `启动行警示恰一行（实到 ${JSON.stringify(u.lines)}）`)
  assert.ok(warn[0].includes("（scene）"), "reason = `scene`（仅损坏现场）")
  assert.ok(warn[0].includes("打开会话即自动补回"), "含指引（三端同句）")
  assert.ok(warn[0].includes("损坏现场档保留 30 天"), "`scene` 在场 ⇒ 附现场档句")
})

test("L4-7 两处接线（单会话项目 · 现场档）：启动行 + `/session` 头各出一行；现场清 ⇒ 两处俱止", async () => {
  putSlot(1, { title: "one" })
  putManifest({ slots: { 1: { ts: Date.now() + 1000, messageCount: 1, turnCount: 1, title: "one" } } })
  writeFileSync(`${manifestPath(CWD)}.corrupted`, "broken-scene")

  const u = startupCtx(CWD)
  showStartup(u.ctx)
  assert.ok(!u.lines.some((l) => String(l).startsWith("Tip:")), "单会话项目 ⇒ 无多会话 Tip 行")
  assert.equal(warnLines(u.lines).length, 1, "启动行在场（不继承 `allSlots.length > 1`）")

  const s = sessionCtx(CWD)
  await handleSessionCommand(s.ctx)
  assert.ok(isWarn(s.entries[0].text), `\`/session\` 首行 = 警示行（实到 ${s.entries[0].text}）`)
  assert.ok(s.entries[0].text.includes("（scene）"), "头部警示 reason 逐字")

  rmSync(`${manifestPath(CWD)}.corrupted`, { force: true })
  assert.equal(ledgerHealth(CWD).scene, false, "现场清 ⇒ `scene` 止")
  const u2 = startupCtx(CWD)
  showStartup(u2.ctx)
  assert.deepEqual(warnLines(u2.lines), [], "现场清 ⇒ 启动行止")
  const s2 = sessionCtx(CWD)
  await handleSessionCommand(s2.ctx)
  assert.ok(!s2.entries.some((e) => isWarn(e.text)), "现场清 ⇒ `/session` 零警示行")
})

// ─── L4-6 警示行（拒写累计 ⇒ reason = lastReason）───────────────────────────

test("L4-6 两处接线（拒写累计）：`refused > 0` ⇒ 启动行 + `/session` 头警示含 `lastReason`；现场清 ⇒ 仅附句止", async () => {
  putSlot(1, { title: "one" })
  putManifest({ slots: { 1: { ts: Date.now() + 1000, messageCount: 1, turnCount: 1, title: "one" } } })
  writeFileSync(manifestPath(CWD), "{ 坏基座") // 拒写注入（§6.23：不可信基座）
  const errs = quiet(() => assert.equal(saveManifest(CWD, loadManifest(CWD)), false, "拒写基座 ⇒ false"))
  assert.ok(errs.length >= 1, "stderr loud 行在场（拒写可见）")

  const h = ledgerHealth(CWD)
  assert.ok(h.refused >= 1, "本进程累计 ≥ 1")
  const reason = h.lastReason
  assert.equal(h.scene, true, "现场保全产物在盘")

  const u = startupCtx(CWD)
  showStartup(u.ctx)
  const warn = warnLines(u.lines)
  assert.equal(warn.length, 1, "启动行在场")
  assert.ok(warn[0].includes(`（${reason}）`), `reason = lastReason 逐字（实到 ${warn[0]}）`)
  assert.ok(warn[0].includes("打开会话即自动补回"), "含指引")
  assert.ok(warn[0].includes("损坏现场档保留 30 天"), "现场在盘 ⇒ 附句")

  rmSync(`${manifestPath(CWD)}.corrupted`, { force: true }) // 现场清（拒写累计仍在）
  assert.equal(ledgerHealth(CWD).scene, false, "现场清 ⇒ `scene` 止")
  const u2 = startupCtx(CWD)
  showStartup(u2.ctx)
  const warn2 = warnLines(u2.lines)
  assert.equal(warn2.length, 1, "拒写累计 ⇒ 行仍在（现场清只止附句）")
  assert.ok(warn2[0].includes(`（${reason}）`) && !warn2[0].includes("损坏现场档保留 30 天"), "零附句（条件附句面）")

  const s = sessionCtx(CWD)
  await handleSessionCommand(s.ctx)
  assert.ok(isWarn(s.entries[0].text) && s.entries[0].text.includes(`（${reason}）`), "`/session` 头警示含 reason")
})
