/**
 * 2026-10-05-timer-notice-turn-gate.test.mjs — 批内件（timer 提醒行回合起跑门批 · 台账 #952 · 设计轮立红）。
 * 判据表 = 批档 `docs/batches/2026-10-05-timer-notice-turn-gate.md` §2.7 / §2.8；
 * 机制单源 = `docs/desktop/design/RENDERER.md` §1.6 **KD-74**（三员双门——timer 员 2026-10-05 并入；晚到照写照显）。
 *
 * 用例 ↔ 判据（T1–T3 先红后绿 ∥ S1–S3 恒绿；两读落批档 §5——先红 = 设计轮实读，后绿 = 实施轮）：
 *   T1（红→绿 · 纯动作）：`clearTurnTraces` 三痕在场 ⇒ 三键摘（`helpLines` ∥ `stopMark` ∥ `timerNotice`）∧ 闩置；
 *       他键零触（跨会话零串扰）；再调 ⇒ 原引用（幂等）；键无效 ⇒ 原引用（零写）。
 *   T2（红→绿 · 出站接线）：直发径（`sendDirect`）∥ 忙态队径（`sendQueued`）两出站 ⇒ `call("msg:send")` 前沿
 *       `timerNotice` 本键已摘（出站时刻即清，非回执后）；两出站点同笔调用源面锁。
 *   T3（红→绿 · 晚到照写照显）：出站门后（闩开）`ev:timer` 到达 ⇒ 切片照写（零丢弃——闩只涉 `stopped` 痕）；
 *       `text` 非非空串 ⇒ 原引用（`onTimer` 写径语义零改）；下一回合门 ⇒ 本键摘（留至下一门收束）。
 *   S1（恒绿 · 首屏门保留）：`applyPage` `before == null` ⇒ `timerNotice` 本键仍清（五清零动）∥ `before` 非空 ⇒ 不清。
 *   S2（恒绿 · 锚链零改）：`blockAnchor` 探针序 = 到期触发行组为首锚（`[data-timer]` → `[data-stopped]` → `[data-help]`
 *       → `[data-card]` → `[data-pill]`）——新块恒插行组之前（贴尾锚零改）。
 *   S3（恒绿 · 两族零触）：出站清点后 `compress` ∥ `digest` 引用不变（零写）。
 *
 * 车具：**零 DOM**（机制面全平 node 直测——纯动作 ∥ 纯归约 ∥ wire 注入桩；`sendDirect` 内 `panelOf` ∥ `repaint` ∥
 *   `onLoadingReset` 皆可空桩）；`events.mjs` 传递闭包含 `/rc/` 取件 ⇒ `/rc/` 解析钩子（沿
 *   `docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs` 先例）。本件不进仓套件（批内件 · 随批留存）；
 *   复跑（cwd = 仓库根 `thincoder/`）：node --test docs/batches/2026-10-05-timer-notice-turn-gate.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => resolve(ROOT, p)
const src = (p) => readFileSync(rel(p), "utf8")
const mod = (p) => import(pathToFileURL(rel(p)).href)

// 渲染档取核件：`/rc/` 解析钩子（events.mjs → subagent-reduce.mjs → /rc/subblocks/state.mjs 传递闭包）。
const rcRoot = resolve(ROOT, "thincoder-render-core")
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) return { url: pathToFileURL(resolve(rcRoot, specifier.slice(4))).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

const { initialState, clearTurnTraces } = await mod("thincoder-desktop/renderer/store.mjs")
const { createComposerWire } = await mod("thincoder-desktop/renderer/composer-wire.mjs")
const { reduce } = await mod("thincoder-desktop/renderer/events.mjs")
const { applyPage } = await mod("thincoder-desktop/renderer/page-read.mjs")
const { blockAnchor } = await mod("thincoder-desktop/renderer/views/chat-chrome.mjs")

const KEY = "p1:m1"
/** 三痕在场态（T1 / T2 / T3 / S1 / S3 起场）：三族各本键一键 + 他键对照；`timerNotice` 另携他键行（跨键零串扰判据源）。 */
function stateWithTraces(over = {}) {
  return {
    ...initialState(),
    activeSession: KEY,
    helpLines: { [KEY]: [{ kind: "cmd", text: "❯ /model" }], other: [{ kind: "cmd", text: "x" }] },
    stopMark: { [KEY]: true, other: true },
    stopHold: { other: true },
    timerNotice: { [KEY]: { text: "到期行" }, other: { text: "他键行" } },
    compress: { [KEY]: { phase: "run" } },
    digest: { [KEY]: [{ status: "start", n: 1 }] },
    tabBadges: { [KEY]: ["done"] },
    ...over,
  }
}

/** wire 车具（直发 ∥ 队径共用——store 闭包桩 + call 前沿读态；deps 全空桩，`sendDirect` 回执路径可走通）。 */
function bootWire({ receipt = { ok: true } } = {}) {
  let held = stateWithTraces()
  const seen = [] // 通道桩内读态（call 前沿 = 出站时刻）
  const store = { get: () => held, set: (next) => { held = next; return held } }
  const call = async (channel, payload) => {
    seen.push({ channel, key: payload.key, timer: held.timerNotice[KEY], help: held.helpLines[KEY], mark: held.stopMark[KEY], hold: held.stopHold[KEY] })
    return receipt
  }
  const wire = createComposerWire({
    store, activeKey: () => KEY, call, push: () => {}, panelOf: () => null, repaint: () => {}, onLoadingReset: () => {},
    suspIdleOf: () => false, toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
    withUserBlock: (s) => s, setAttachDegraded: (s) => s, applyFlags: (s) => s, openSettings: () => {},
  })
  return { wire, seen }
}

// ─── T1（红→绿 · 纯动作：三键摘 ∧ 闩置 ∥ 幂等 ∥ 键无效）────────────────────────────
test("T1（红→绿 · 纯动作）：三痕在场 ⇒ 三键摘 ∧ 闩置；他键零触；再调 ⇒ 原引用；键无效 ⇒ 原引用", () => {
  const s1 = stateWithTraces()
  const out1 = clearTurnTraces(s1, KEY)
  assert.notEqual(out1, s1, "三痕在场 ⇒ 新引用（有写）")
  assert.equal(out1.helpLines[KEY], undefined, "helpLines 本键摘")
  assert.equal(out1.stopMark[KEY], undefined, "stopMark 本键摘")
  assert.equal(out1.timerNotice[KEY], undefined, "timerNotice 本键摘（2026-10-05 · 台账 #952 并入回合起跑门）")
  assert.equal(out1.stopHold[KEY], true, "闩置（回合起跑门簿记）")
  assert.equal(out1.helpLines.other !== undefined, true, "他键 helpLines 零触")
  assert.equal(out1.stopMark.other, true, "他键 stopMark 零触")
  assert.equal(out1.timerNotice.other !== undefined, true, "他键 timerNotice 零触（跨会话零串扰）")
  assert.equal(out1.stopHold.other, true, "他键闩零触")
  const out2 = clearTurnTraces(out1, KEY)
  assert.equal(out2, out1, "三键已空 ∧ 闩已在 ⇒ 原引用（幂等——等值零通知）")
  const s3 = stateWithTraces()
  assert.equal(clearTurnTraces(s3, null), s3, "键 null ⇒ 原引用")
  assert.equal(clearTurnTraces(s3, ""), s3, "键空串 ⇒ 原引用")
  assert.equal(clearTurnTraces(s3, 42), s3, "键非串 ⇒ 原引用")
})

// ─── T2（红→绿 · 出站接线：直发 ∥ 忙态队两出站 ⇒ 前沿已摘）──────────────────────────
test("T2（红→绿 · 出站接线）：sendDirect ∥ sendQueued 两出站 ⇒ call 前沿 timerNotice 已摘；两出站点同笔调用", async () => {
  for (const path of ["direct", "queued"]) {
    const { wire, seen } = bootWire()
    wire.post(path === "direct" ? "userMessage" : "queuedUserMessage", { text: "这条" })
    await new Promise((r) => setTimeout(r, 5))
    assert.equal(seen.length, 1, `${path} 径出站一次`)
    assert.equal(seen[0].channel, "msg:send", `${path} 径通道 = msg:send`)
    assert.equal(seen[0].timer, undefined, `${path} 径出站时刻（call 前沿）timerNotice 本键已摘`)
    assert.equal(seen[0].help, undefined, `${path} 径同门：helpLines 已摘`)
    assert.equal(seen[0].mark, undefined, `${path} 径同门：stopMark 已摘`)
    assert.equal(seen[0].hold, true, `${path} 径同门：闩已在`)
  }
  const wireSrc = src("thincoder-desktop/renderer/composer-wire.mjs")
  assert.equal([...wireSrc.matchAll(/clearTurnTraces\(store\.get\(\), key\)/g)].length, 2, "两出站点同笔调用（直发 ∥ 队径各一）")
})

// ─── T3（红→绿 · 晚到照写照显 + 下一门清）─────────────────────────────────────────
test("T3（红→绿 · 晚到）：出站门后 ev:timer 到达 ⇒ 照写（零丢弃）；形不合 ⇒ 原引用；下一回合门 ⇒ 本键摘", () => {
  const s0 = clearTurnTraces(stateWithTraces(), KEY) // 出站门（闩开——晚到窗）
  assert.equal(s0.stopHold[KEY], true, "起场：闩开（出站置闩）")
  const s1 = reduce(s0, { channel: "ev:timer", key: KEY, status: "fired", text: "晚到行" })
  assert.equal(s1.timerNotice[KEY]?.text, "晚到行", "晚到 timer 照写照显（零丢弃——闩只涉 stopped 痕）")
  const s1b = reduce(s1, { channel: "ev:timer", key: KEY, status: "fired", text: "" })
  assert.equal(s1b, s1, "text 非非空串 ⇒ 原引用（onTimer 写径语义零改）")
  const s2 = clearTurnTraces(s1, KEY)
  assert.equal(s2.timerNotice[KEY], undefined, "下一回合门 ⇒ 本键摘（留至下一门收束）")
})

// ─── S1（恒绿 · 首屏门保留：五清零动）─────────────────────────────────────────────
test("S1（恒绿 · 首屏门保留）：applyPage before==null ⇒ timerNotice 仍清 ∥ before 非空 ⇒ 不清", () => {
  const receipt = { ok: true, messages: [], hasOlder: false, next: null, meta: {}, flags: {}, queue: [] }
  const first = applyPage(stateWithTraces(), receipt, { key: KEY, before: null })
  assert.equal(first.timerNotice[KEY], undefined, "首屏门：timerNotice 仍清（五清零动）")
  assert.equal(first.helpLines[KEY], undefined, "首屏门：helpLines 仍清")
  assert.equal(first.stopMark[KEY], undefined, "首屏门：stopMark 仍清")
  const backfill = applyPage(stateWithTraces(), receipt, { key: KEY, before: { blocks: [] } })
  assert.equal(backfill.timerNotice[KEY]?.text, "到期行", "回填径：timerNotice 不清")
})

// ─── S2（恒绿 · 锚链零改：首锚 = 到期触发行组）─────────────────────────────────────
test("S2（恒绿 · 锚链零改）：blockAnchor 探针序首锚 = [data-timer]（新块恒插行组之前）", () => {
  const probes = []
  const fake = { querySelector: (selector) => { probes.push(selector); return null } }
  assert.equal(blockAnchor(fake), null, "全锚缺席 ⇒ null（末位）")
  assert.deepEqual(probes, ["[data-timer]", "[data-stopped]", "[data-help]", "[data-card]", "[data-pill]"], "探针序零改——首锚 = 到期触发行组（贴尾锚零改）")
})

// ─── S3（恒绿 · 两族零触）─────────────────────────────────────────────────────────
test("S3（恒绿 · 两族零触）：出站清点后 compress ∥ digest 引用不变（零写）", () => {
  const s = stateWithTraces()
  const out = clearTurnTraces(s, KEY)
  assert.equal(out.compress, s.compress, "compress 引用不变")
  assert.equal(out.digest, s.digest, "digest 引用不变")
})
