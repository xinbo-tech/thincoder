/**
 * 2026-10-01-desktop-pair-decisions.test.mjs — 桌面二择裁定批（#780 位标码清位跨族 ∥ #782 cap 腿墓碑查位）·
 * **批次本地件**（住 `docs/batches/` · 不登记常驻套件 · 随批留存；格式先例 = `2026-10-01-audit-remediation.test.mjs`）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-10-01-desktop-pair-decisions.test.mjs`
 *
 * 七腿（先红后绿：本件先于两案产品码落盘跑红 ⇒ 落码后复跑全绿——读数 = 批档 §5）：
 *   #780（归约面 · 平 node 直测 —— `renderer/events.mjs` `clearApproval` ∥ `renderer/questions.mjs` `clearQuestion`
 *     两清径同引共享谓词 `renderer/badges.mjs` `hasPendingFor`）：
 *     M1  同键两族共存 → 清提问 ⇒ 码留（审批族在）；
 *     M2  同键两族共存 → 清审批 ⇒ 码留（提问族在）；
 *     M3  单族清 ⇒ 码灭（正控两臂：仅提问族 ∥ 仅审批族）；
 *     M4  起源键 `null` ∥ 跨键 ⇒ 零误写（保位，含幂等保位）+ 源面锁（谓词单实现 ∥ 两清径同引 ∥ 清码前过谓词）。
 *   #782（宿主记录腿 · `src/main/turn-face.mjs` cap 腿 —— 与 `emitDigestEnd` 同源判据 `revokedTurn`）：
 *     N1  墓碑真 + `run` 替身抛 `ContinueError`（**同一 realpath 取**——与 turn-face 同实例）⇒ 零 cap 帧零记录；
 *     N2  非墓碑 ⇒ cap 帧 ∥ 记录恰一次（正控；边界轮 `end` 同点双动作照旧）；
 *     N3  timer 轮 ⇒ 零帧零记录（负控保位——timer 不冒充消化边界）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")

// ─── 归约面装载（#780）：`events.mjs` ∥ `questions.mjs`（两清径 = 本件靶面）────────────────
const eventsOf = () => import("../../thincoder-desktop/renderer/events.mjs")
const questionsOf = () => import("../../thincoder-desktop/renderer/questions.mjs")

/** `ev:approval` 载荷（白名单键子集；`key` = 起源键）。 */
const approvalEv = (key, promptId) => ({ channel: "ev:approval", key, promptId, tool: "bash", argsSummary: "…" })
/** `ev:question` 载荷（白名单键子集）。 */
const questionEv = (key, promptId) => ({ channel: "ev:question", key, promptId, question: "Q?", options: ["A", "B"] })
/** 位标读数（本键 `approval` 码在场 —— 闭集内码，数组切片）。 */
const codeOf = (state, key) => (Array.isArray(state?.tabBadges?.[key]) ? state.tabBadges[key].includes("approval") : false)

// ─── #780 · M1（清提问 ⇒ 码留）──────────────────────────────────────────────────
test("M1 · 同键两族共存 → 清提问 ⇒ 码留（审批在）", async () => {
  const { reduce, clearApproval } = await eventsOf()
  const { clearQuestion } = await questionsOf()
  const s0 = reduce({}, approvalEv("k1", "a1"))
  const s1 = reduce(s0, questionEv("k1", "q1"))
  assert.equal(codeOf(s1, "k1"), true, "前置：同键两族共存 ⇒ `approval` 码在")
  assert.equal(s1.pool.approvals.length, 1, "前置：审批项在池（起源键 = k1）")
  assert.equal(Object.hasOwn(s1.questions ?? {}, "k1"), true, "前置：提问项在切片")

  const s2 = clearQuestion(s1, "k1")
  assert.equal(codeOf(s2, "k1"), true, "提问出场 ∥ 审批族同键在 ⇒ 码留（跨族零误清 · #780）")
  assert.equal(Object.hasOwn(s2.questions ?? {}, "k1"), false, "提问项照摘（行为面零变）")
  assert.equal(s2.pool.approvals.length, 1, "审批项零动")
  const s3 = clearApproval(s2, "a1")
  assert.equal(codeOf(s3, "k1"), false, "继后两族皆清 ⇒ 码灭（码不悬留）")
})

// ─── #780 · M2（清审批 ⇒ 码留）──────────────────────────────────────────────────
test("M2 · 同键两族共存 → 清审批 ⇒ 码留（提问在）", async () => {
  const { reduce, clearApproval } = await eventsOf()
  const s0 = reduce({}, approvalEv("k2", "a2"))
  const s1 = reduce(s0, questionEv("k2", "q2"))
  assert.equal(codeOf(s1, "k2"), true, "前置：同键两族共存 ⇒ `approval` 码在")

  const s2 = clearApproval(s1, "a2")
  assert.equal(codeOf(s2, "k2"), true, "审批回执 ∥ 提问族同键在 ⇒ 码留（跨族零误清 · #780）")
  assert.equal(s2.pool.approvals.length, 0, "审批项照摘（池计数随摘项重算）")
  assert.equal(s2.pool.approval, 0, "`pool.approval` = 剩余项数（零变）")
  assert.equal(Object.hasOwn(s2.questions ?? {}, "k2"), true, "提问项零动")
  const { clearQuestion } = await questionsOf()
  const s3 = clearQuestion(s2, "k2")
  assert.equal(codeOf(s3, "k2"), false, "继后两族皆清 ⇒ 码灭")
})

// ─── #780 · M3（单族清 ⇒ 码灭 · 正控两臂）─────────────────────────────────────────
test("M3 · 单族清 ⇒ 码灭（正控两臂）", async () => {
  const { reduce, clearApproval } = await eventsOf()
  const { clearQuestion } = await questionsOf()

  // 臂 A：仅提问族 ⇒ 清提问即码灭
  const sA0 = reduce({}, questionEv("k3", "q3"))
  assert.equal(codeOf(sA0, "k3"), true, "臂 A 前置：提问置码")
  const sA1 = clearQuestion(sA0, "k3")
  assert.equal(codeOf(sA1, "k3"), false, "臂 A：无审批项 ⇒ 码灭（提问出场）")

  // 臂 B：仅审批族 ⇒ 清审批即码灭
  const sB0 = reduce({}, approvalEv("k3", "a3"))
  assert.equal(codeOf(sB0, "k3"), true, "臂 B 前置：审批置码")
  const sB1 = clearApproval(sB0, "a3")
  assert.equal(codeOf(sB1, "k3"), false, "臂 B：无提问项 ⇒ 码灭（审批回执）")
})

// ─── #780 · M4（起源键 null ∥ 跨键 ⇒ 零误写 · 保位 + 源面锁）───────────────────────
test("M4 · 起源键 null ∥ 跨键 ⇒ 零误写（保位）+ 源面锁", async () => {
  const { reduce, clearApproval } = await eventsOf()
  const { clearQuestion } = await questionsOf()

  // 臂 A：审批条目无起源键（`ev.key` 缺省 ⇒ `item.key = null`）⇒ 清审批零位标写
  const sA0 = reduce({}, { channel: "ev:approval", promptId: "a9", tool: "bash" })
  const sA1 = clearApproval(sA0, "a9")
  assert.equal(sA1.tabBadges, sA0.tabBadges, "臂 A：无起源键 ⇒ 零位标写（`tabBadges` 引用保位）")
  assert.equal(sA1.pool.approvals.length, 0, "臂 A：摘项照常（零位标写 ≠ 零摘项）")

  // 臂 B：跨键 —— 清 A 键不动 B 键码；同键两族各自的清径互不越界
  const sB0 = reduce(reduce({}, approvalEv("kA", "aA")), approvalEv("kB", "aB"))
  const sB1 = reduce(sB0, questionEv("kB", "qB"))
  assert.equal(codeOf(sB1, "kA"), true, "臂 B 前置：kA 码在（仅审批族）")
  assert.equal(codeOf(sB1, "kB"), true, "臂 B 前置：kB 码在（两族共存）")
  const sB2 = clearApproval(sB1, "aA")
  assert.equal(codeOf(sB2, "kA"), false, "臂 B：kA 两族皆清 ⇒ kA 码灭")
  assert.equal(codeOf(sB2, "kB"), true, "臂 B：kB 零误清（跨键保位）")
  const sB3 = clearQuestion(sB2, "kB")
  assert.equal(codeOf(sB3, "kB"), true, "臂 B：kB 审批族在 ⇒ 码留（跨族）")
  const sB4 = clearApproval(sB3, "aB")
  assert.equal(codeOf(sB4, "kB"), false, "臂 B：kB 两族皆清 ⇒ 码灭")

  // 臂 C：幂等保位（未命中 ⇒ 原引用 —— 两清径守卫线零变）
  const sC0 = reduce({}, questionEv("kC", "qC"))
  assert.equal(clearQuestion(sC0, "kX"), sC0, "无本键提问项 ⇒ 原引用（零写）")
  assert.equal(clearApproval(sC0, "aX"), sC0, "未命中 `promptId` ⇒ 原引用（零写）")

  // 源面锁（设计 §2 一·6）：谓词单实现（两清径同引）∥ 两清径清码前过谓词
  const badgesSrc = read("thincoder-desktop/renderer/badges.mjs")
  const eventsSrc = read("thincoder-desktop/renderer/events.mjs")
  const questionsSrc = read("thincoder-desktop/renderer/questions.mjs")
  assert.equal((badgesSrc.match(/export function hasPendingFor\(/g) ?? []).length, 1, "谓词单实现（`badges.mjs` 恰一导出）")
  for (const [name, src] of [["events.mjs", eventsSrc], ["questions.mjs", questionsSrc]]) {
    const gate = src.indexOf("hasPendingFor(next, key)")
    const clear = src.indexOf('badgeStamps(next.tabBadges ?? {}, key, "approval", false)')
    assert.ok(gate >= 0, `${name}：清径同引共享谓词`)
    assert.ok(clear >= 0 && gate < clear, `${name}：清码前过谓词（序锁）`)
  }
})

// ─── #782 · turn-face 假面（帧 ∥ 记录两收集面）────────────────────────────────────
const faceOf = async (over = {}) => {
  const { createTurnFace } = await import("../../thincoder-desktop/src/main/turn-face.mjs")
  const frames = []
  const records = []
  const agent = { title: "t", _slot: 1, history: [], _fullHistory: [], _recordStore: { append: (record) => records.push(record) }, _historyWindow: 0 }
  const face = createTurnFace({
    post: (ch, payload) => frames.push({ ch, payload }),
    run: over.run ?? (() => Promise.resolve("done")),
    bridge: () => ({}),
    postUsage: () => {},
    flights: new Map(),
    turnGate: { stamp() {}, revoked: () => over.revoked === true },
  })
  return { face, frames, records, agent }
}
const digestFrames = (frames) => frames.filter((frame) => frame.ch === "ev:digest")
const capFrames = (frames) => digestFrames(frames).filter((frame) => frame.payload.status === "cap")
const endFrames = (frames) => digestFrames(frames).filter((frame) => frame.payload.status === "end")
/** 撞帽入口：`ContinueError` 须与 turn-face **同 realpath 取**（#774 双实例教训）。 */
const continueErrorOf = () => import("../../thincoder-desktop/node_modules/@thincoder/core/agent.mjs")

// ─── #782 · N1（墓碑真 ⇒ 帧 ∥ 记录同抑制）────────────────────────────────────────
test("N1 · 墓碑真 + 撞帽 ⇒ 零 cap 帧 ∧ `appendRecord` 零调用（帧 ∥ 记录同抑制）", async () => {
  const { ContinueError } = await continueErrorOf()
  const fx = await faceOf({ revoked: true, run: () => Promise.reject(new ContinueError(30)) })
  const out = await fx.face.executeTurn("1", fx.agent, "文本", { autoTurn: true })
  assert.deepEqual(out, { ok: true }, "回合照常收口（`return \"stopped\"` 零改）")
  assert.equal(capFrames(fx.frames).length, 0, "零 cap 帧（墓碑命中 —— #782 门）")
  assert.equal(digestFrames(fx.frames).length, 0, "零 digest 帧（cap ∥ `end` 两查位同抑制）")
  assert.equal(fx.records.length, 0, "`appendRecord` 零调用（帧 ∥ 记录同抑制）")
  assert.ok(fx.frames.some((frame) => frame.ch === "ev:activity" && frame.payload.event === "stopped"), "stopped 终局帧照出（收口径零变）")
})

// ─── #782 · N2（非墓碑 ⇒ cap 帧 ∥ 记录恰一次 · 正控）─────────────────────────────
test("N2 · 非墓碑 ⇒ cap 帧 ∥ 记录恰一次（正控）", async () => {
  const { ContinueError } = await continueErrorOf()
  const fx = await faceOf({ run: () => Promise.reject(new ContinueError(30)) })
  const out = await fx.face.executeTurn("1", fx.agent, "文本", { autoTurn: true })
  assert.deepEqual(out, { ok: true }, "autoTurn ⇒ cap 即收口（零自续）")
  const caps = capFrames(fx.frames)
  assert.equal(caps.length, 1, "cap 帧恰一次（非墓碑 ⇒ 门不拦）")
  assert.deepEqual([caps[0].payload.key, caps[0].payload.status, caps[0].payload.mode, caps[0].payload.turns], ["1", "cap", "stop", 30], "cap 帧载荷形（key ∕ status ∕ mode ∕ turns）")
  const capRecords = fx.records.filter((record) => record.status === "cap")
  assert.equal(capRecords.length, 1, "cap 记录恰一次（帧 ∥ 记录同点双动作）")
  assert.equal(capRecords[0].kind, "digest", "记录形（kind = digest）")
  assert.equal(endFrames(fx.frames).length, 1, "边界轮 `end` 帧照出（`autoTurn ∧ ¬timerTurn` —— 同点双动作零变）")
  assert.equal(fx.records.filter((record) => record.status === "end").length, 1, "`end` 记录照出")
})

// ─── #782 · N3（timer 轮 ⇒ 零帧零记录 · 负控保位）────────────────────────────────
test("N3 · timer 轮 ⇒ 零帧零记录（负控保位）", async () => {
  const { ContinueError } = await continueErrorOf()
  const fx = await faceOf({ run: () => Promise.reject(new ContinueError(30)) })
  const out = await fx.face.executeTurn("1", fx.agent, "文本", { autoTurn: true, timerTurn: true })
  assert.deepEqual(out, { ok: true }, "timer 轮 cap 即收口（无人值守档零变）")
  assert.equal(digestFrames(fx.frames).length, 0, "零 digest 帧（timer 不冒充消化边界 —— 判据 `opts.timerTurn !== true` 保位）")
  assert.equal(fx.records.length, 0, "零记录（同抑制）")
  assert.ok(fx.frames.some((frame) => frame.ch === "ev:activity" && frame.payload.event === "stopped"), "stopped 终局帧照出")
})
