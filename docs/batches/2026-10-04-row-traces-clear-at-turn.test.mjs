/**
 * 2026-10-04-row-traces-clear-at-turn.test.mjs — 批内件（行痕族消失时机批 · 台账 #919 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-04-row-traces-clear-at-turn.md` §2.6 / §2.7（评审 #4 pass · 修正项随臂）；
 * 机制单源 = `docs/desktop/design/RENDERER.md` §1.6 **KD-74**（两门 + 晚到 `stopped` 丢弃闩）。
 *
 * 用例 ↔ 判据（T1–T7 · **先红后绿两读落批档 §5**）：
 *   T1（红→绿 · 纯动作）：`clearTurnTraces`：两痕在场 ⇒ 键摘 ∧ 闩置；两连调 ⇒ 第二次原引用（幂等——闩已置 ∧ 痕已空，T7 同判）；
 *       键无效（非串 ∥ 空串）⇒ 原引用（零写）。
 *   T2（红→绿 · 出站接线）：直发径（`sendDirect`）∥ 忙态队径（`sendQueued`）两出站 ⇒ `call("msg:send")` 前沿两痕已摘 ∧ 闩已在
 *       （通道桩内读态——出站时刻即清，非回执后）；回执后态不回写（闩不撤销——失败回执臂前置腿）。
 *   T3（红→绿 · 晚到丢弃）：闩开 ∧ `stopped` 终局到达 ⇒ `stopMark` 零写（痕零复现）；**回合尾其余结算照跑**
 *       （`done` 位标在 ∘ 提问项摘 ∘ 游标清——旧回合状态照常收束）。
 *   T4（红→绿 · 开门自愈 + 失败回执臂）：闩开 → 回合首帧（`turn` ∧ 此前非 running——与 `turnStarts` 同判）⇒ 闩摘 ⇒
 *       新 `stopped` ⇒ 痕照出；**此前 running** ⇒ 闩留（非首帧）⇒ 新 `stopped` 痕零写；**失败回执臂（评审 #4 发现 3）**：
 *       出站回执非 `ok` ⇒ 闩留场 ⇒ 其后回合首帧摘闩 ⇒ 新 `stopped` 照写（自愈——无永久压制）。
 *   T5（恒绿 · 首屏门不回归）：`applyPage` `before == null` ⇒ 两痕仍清 ∥ `before` 非空 ⇒ 不清（五清零动）；
 *       闩 `stopHold` 不入首屏清键集（首屏读不摘闩——门簿记非痕）。
 *   T6（恒绿 · 三族零触）：出站清点后 `timerNotice` ∥ `compress` ∥ `digest` 三切片引用不变（零写）。
 *   T7（红→绿 · 幂等）：两连发 ⇒ 第二次原引用（闩已置 ∧ 两痕已空 ⇒ 等值零通知）。
 *
 * 车具：**零 DOM**（机制面全平 node 直测——纯动作 ∥ 纯归约 ∥ wire 注入桩；`sendDirect` 内 `panelOf` ∥ `repaint` ∥
 *   `onLoadingReset` 皆可空桩）；`events.mjs` 传递闭包含 `/rc/` 取件 ⇒ `/rc/` 解析钩子（沿
 *   `2026-10-04-composer-queue-gate-stick.test.mjs` 先例）。本件不进仓套件（批内件 · 随批留存）；复跑（cwd = 仓库根 `thincoder/`）：
 *   node --test docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs
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

const KEY = "p1:m1"
/** 两痕在场态（AC-1 / AC-2 起场）：`helpLines` ∥ `stopMark` 各一键 + 对照三族（T6 断言零触）。 */
function stateWithTraces(over = {}) {
  return {
    ...initialState(),
    activeSession: KEY,
    helpLines: { [KEY]: [{ kind: "cmd", text: "❯ /model" }], other: [{ kind: "cmd", text: "x" }] },
    stopMark: { [KEY]: true, other: true },
    stopHold: { other: true }, // 跨键闩在场（零串扰判据源）
    timerNotice: { [KEY]: { text: "到期行" } },
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
    seen.push({ channel, key: payload.key, help: held.helpLines[KEY], mark: held.stopMark[KEY], hold: held.stopHold[KEY] })
    return receipt
  }
  const wire = createComposerWire({
    store, activeKey: () => KEY, call, push: () => {}, panelOf: () => null, repaint: () => {}, onLoadingReset: () => {},
    suspIdleOf: () => false, toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
    withUserBlock: (s) => s, setAttachDegraded: (s) => s, applyFlags: (s) => s, openSettings: () => {},
  })
  return { wire, seen, state: () => held }
}

// ─── T1（红→绿 · 纯动作：两痕摘 ∧ 闩置 ∥ 幂等 ∥ 键无效）────────────────────────
test("T1（红→绿 · 纯动作）：clearTurnTraces 两痕在场 ⇒ 键摘 ∧ 闩置；再调 ⇒ 原引用；键无效 ⇒ 原引用", () => {
  // ① 两痕在场 ⇒ 本键两痕摘 + 闩置；**他键零触**（跨会话零串扰）
  const s1 = stateWithTraces()
  const out1 = clearTurnTraces(s1, KEY)
  assert.notEqual(out1, s1, "两痕在场 ⇒ 新引用（有写）")
  assert.equal(out1.helpLines[KEY], undefined, "helpLines 本键摘")
  assert.equal(out1.stopMark[KEY], undefined, "stopMark 本键摘")
  assert.equal(out1.stopHold[KEY], true, "闩置（回合起跑门簿记）")
  assert.equal(out1.helpLines.other !== undefined, true, "他键 helpLines 零触")
  assert.equal(out1.stopMark.other, true, "他键 stopMark 零触")
  assert.equal(out1.stopHold.other, true, "他键闩零触（跨会话零串扰）")
  // ② 幂等（= T7 单点同判）：两痕已空 ∧ 闩已在 ⇒ 原引用（等值零通知）
  const out2 = clearTurnTraces(out1, KEY)
  assert.equal(out2, out1, "两痕已空 ∧ 闩已在 ⇒ 原引用（幂等）")
  // ③ 键无效 ⇒ 原引用（零写）
  const s3 = stateWithTraces()
  assert.equal(clearTurnTraces(s3, null), s3, "键 null ⇒ 原引用")
  assert.equal(clearTurnTraces(s3, ""), s3, "键空串 ⇒ 原引用")
  assert.equal(clearTurnTraces(s3, 42), s3, "键非串 ⇒ 原引用")
})

// ─── T2（红→绿 · 出站接线：直发 ∥ 忙态队两出站 ⇒ 动作被调且 key 正确）────────────
test("T2（红→绿 · 出站接线）：sendDirect ∥ sendQueued 两出站 ⇒ call 前沿两痕已摘 ∧ 闩已在；失败回执不撤闩", async () => {
  for (const path of ["direct", "queued"]) {
    const { wire, seen, state } = bootWire()
    wire.post(path === "direct" ? "userMessage" : "queuedUserMessage", { text: "这条" })
    await new Promise((r) => setTimeout(r, 5))
    assert.deepEqual(seen, [{ channel: "msg:send", key: KEY, help: undefined, mark: undefined, hold: true }],
      `${path} 径出站时刻（call 前沿）两痕已摘 ∧ 闩已在`)
    // 失败回执前置腿：闩不随回执撤销（T4 失败臂基座——闩留场 ⇒ 自愈窗保持）
    assert.equal(state().stopHold[KEY], true, "回执后闩零撤（出站侧无撤销面）")
  }
  // 源面锁：两出站点同笔调用（单源判据——机检可读）
  const wireSrc = src("thincoder-desktop/renderer/composer-wire.mjs")
  assert.equal([...wireSrc.matchAll(/clearTurnTraces\(store\.get\(\), key\)/g)].length, 2, "两出站点同笔调用（直发 ∥ 队径各一）")
})

// ─── T3（红→绿 · 晚到 stopped 丢弃：痕零写 ∧ 回合尾其余结算照跑）──────────────────
test("T3（红→绿 · 晚到丢弃）：闩开窗内 stopped ⇒ stopMark 零写 ∧ done 位标在 ∧ 提问项摘 ∧ 游标清（结算零触）", () => {
  // 起场 = 出站后（闩开 ∧ 两痕已清）+ 提问项在场 + 尾块游标在（结算面可判读数）
  const s = clearTurnTraces(stateWithTraces({
    tabBadges: { [KEY]: ["running"] },
    questions: { [KEY]: [{ promptId: "q1" }] },
    blocks: [{ kind: "tool", name: "bash", status: "running", argsSummary: "ls", result: null }],
    following: true,
  }), KEY)
  assert.equal(s.stopHold[KEY], true, "起场：闩开")
  const stopped = reduce(s, { channel: "ev:activity", key: KEY, event: "stopped" })
  assert.equal(stopped.stopMark[KEY], undefined, "晚到 stopped ⇒ 痕零写（丢弃）")
  assert.deepEqual(stopped.tabBadges[KEY], ["done"], "回合尾其余结算照跑：done 位标落")
  assert.equal(stopped.questions[KEY], undefined, "回合尾其余结算照跑：提问项摘")
  const tail = stopped.blocks[stopped.blocks.length - 1]
  assert.equal(tail.status, "interrupted", "回合尾其余结算照跑：未结算工具卡清扫（interrupted）")
})

// ─── T4（红→绿 · 开门自愈 + 失败回执臂）─────────────────────────────────────────
test("T4（红→绿 · 开门自愈）：首帧（此前非 running）⇒ 闩摘 ⇒ 新 stopped 照写；此前 running ⇒ 闩留；失败回执臂 ⇒ 闩留 ⇒ 首帧摘 ⇒ 照写", () => {
  const stoppedEv = { channel: "ev:activity", key: KEY, event: "stopped" }
  // ① 首帧开门：闩开 → turn（此前非 running——位标 done）⇒ 闩摘 → 新 stopped ⇒ 痕照出
  let s = clearTurnTraces(stateWithTraces({ tabBadges: { [KEY]: ["done"] } }), KEY)
  const afterTurn = reduce(s, { channel: "ev:activity", key: KEY, event: "turn", turn: 1, maxTurns: 8 })
  assert.equal(afterTurn.stopHold[KEY], undefined, "回合首帧 ⇒ 闩摘")
  const stopped = reduce(afterTurn, stoppedEv)
  assert.equal(stopped.stopMark[KEY], true, "首帧后新 stopped ⇒ 痕照出（不误弃）")
  // ② 此前 running ⇒ 非首帧 ⇒ 闩留 ⇒ 新 stopped 痕零写（闩开窗跨回合——判据同 turnStarts）
  s = clearTurnTraces(stateWithTraces({ tabBadges: { [KEY]: ["running"] } }), KEY)
  const midTurn = reduce(s, { channel: "ev:activity", key: KEY, event: "turn", turn: 2, maxTurns: 8 })
  assert.equal(midTurn.stopHold[KEY], true, "此前 running（非首帧）⇒ 闩留")
  const stopped2 = reduce(midTurn, stoppedEv)
  assert.equal(stopped2.stopMark[KEY], undefined, "闩开窗内 stopped ⇒ 痕零写")
  // ③ 失败回执臂（评审 #4 发现 3）：发送失败（回执非 ok）⇒ 闩留场 ⇒ 其后回合首帧摘闩 ⇒ 新 stopped 照写（自愈）
  s = clearTurnTraces(stateWithTraces({ tabBadges: { [KEY]: ["done"] } }), KEY)
  assert.equal(s.stopHold[KEY], true, "失败臂起场：出站即闩（回执成败零涉——出站时刻置闩）")
  const first = reduce(s, { channel: "ev:activity", key: KEY, event: "turn", turn: 1, maxTurns: 8 })
  assert.equal(first.stopHold[KEY], undefined, "失败回执后回合首帧 ⇒ 闩摘（自愈——无永久压制）")
  assert.equal(reduce(first, stoppedEv).stopMark[KEY], true, "其后新 stopped ⇒ 痕照写")
})

// ─── T5（恒绿 · 首屏门不回归：五清零动 ∥ 闩不入清键集）────────────────────────────
test("T5（恒绿 · 首屏门不回归）：applyPage before==null ⇒ 两痕仍清 ∥ before 非空 ⇒ 不清 ∥ 闩不摘", () => {
  const receipt = { ok: true, messages: [], hasOlder: false, next: null, meta: {}, flags: {}, queue: [] }
  // ① 首屏（before == null）⇒ 两痕仍清（既有五清零动）
  const s1 = stateWithTraces()
  const first = applyPage(s1, receipt, { key: KEY, before: null })
  assert.equal(first.helpLines[KEY], undefined, "首屏门：helpLines 仍清")
  assert.equal(first.stopMark[KEY], undefined, "首屏门：stopMark 仍清")
  assert.equal(first.blocks.length, 0, "首屏整置照旧")
  // ② 回填（before 非空）⇒ 两痕不清（首屏门键集与行为零动）
  const s2 = stateWithTraces()
  const backfill = applyPage(s2, receipt, { key: KEY, before: { blocks: [] } })
  assert.equal(backfill.helpLines[KEY] !== undefined, true, "回填径：helpLines 不清")
  assert.equal(backfill.stopMark[KEY], true, "回填径：stopMark 不清")
  // ③ 闩 = 门簿记非痕：首屏读**不摘闩**（防清后失守——KD-74 ③）
  const s3 = clearTurnTraces(stateWithTraces(), KEY) // 出站置闩后切走再切回
  const back = applyPage(s3, receipt, { key: KEY, before: null })
  assert.equal(back.stopHold[KEY], true, "首屏页读不摘闩（门簿记不入五清）")
  // 源面锁：五清行零增员（首屏门键集不变）
  const prSrc = src("thincoder-desktop/renderer/page-read.mjs")
  assert.equal(/clearTurnTraces\(state/.test(prSrc) || /clearTurnTraces\(table/.test(prSrc), false, "page-read 零调起跑动作（两门各自独立——首屏门本体零触；头注指针句非调用）")
})

// ─── T6（恒绿 · 三族零触）───────────────────────────────────────────────────────
test("T6（恒绿 · 三族零触）：出站清点后 timerNotice ∥ compress ∥ digest 引用不变（零写）", () => {
  const s = stateWithTraces()
  const out = clearTurnTraces(s, KEY)
  assert.equal(out.timerNotice, s.timerNotice, "timerNotice 引用不变")
  assert.equal(out.compress, s.compress, "compress 引用不变")
  assert.equal(out.digest, s.digest, "digest 引用不变")
  assert.equal(out.timerNotice[KEY].text, "到期行", "timerNotice 本键行照留")
})

// ─── T7（红→绿 · 幂等：两连发 ⇒ 第二次原引用）────────────────────────────────────
test("T7（红→绿 · 幂等）：两连发 ⇒ 第二次原引用（闩已置 ∧ 两痕已空 ⇒ 等值零通知）", () => {
  const s = stateWithTraces()
  const first = clearTurnTraces(s, KEY)
  const second = clearTurnTraces(first, KEY)
  assert.equal(second, first, "第二次 ⇒ 原引用（等值零通知——视图层可据引用短路）")
})
