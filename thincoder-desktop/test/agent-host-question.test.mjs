/**
 * agent-host-question.test.mjs — 作答门（`question` 工具真作答面）脱壳直测（批档 §2.4 ② · 用例 T-DSK24；
 * `docs/desktop/design/PROJECT.md`:275 · 同档 §1 `question:respond` / `ev:question`）。
 * 纪律：同 `agent-host.test.mjs`（替身 `deps` + 假 `emit` ⇒ 零网 / 零 electron / 零用户目录；真盘面落 tmp
 *       sessions 根 ⇒ 模块级沙箱一次）。
 * 覆盖：U114 往返（出站载荷键集四键 ∧ 表项两判据）· U115 三 reason 皆不 resolve（挂起保留 ⇒ 可续答）·
 *       U116 取消两径（`answer: null` 显式 ∧ 打断路径 —— 取消串单源 `QUESTION_CANCELLED`）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createAgentHost } from "../src/main/agent-host.mjs"
import { QUESTION_CANCELLED } from "../src/main/suspensions.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const sandbox = useSlotSandbox() // 模块级：取消 / 打断真收尾（`stopped`）必走终点保存 ⇒ 不沙箱即写真实用户目录
after(sandbox.cleanup)

const KEY = "3"
const CWD = "/fake-project-root"

/** 假装配面（精简：装配路径可跑通即可 —— 作答面不依赖装配细节）+ 假 `emit` 收序。 */
function makeHost(run) {
  const out = []
  const agent = { provider: { name: "p1", model: "m1", baseURL: "http://127.0.0.1:1/v1" }, tools: [], cwd: CWD, history: [], _fullHistory: [] }
  const config = {
    provider: { name: "p1", model: "m1", baseURL: "http://127.0.0.1:1/v1" },
    providersList: [{ name: "p1", model: "m1" }], agent: { streamRules: [] },
    memory: { dbPath: ":memory:", projectDir: "proj-mem" },
  }
  const deps = {
    loadConfig: () => config, injectProxy: () => {}, createMemory: () => ({ codeOrigin: null, projectOrigin: null }),
    discoverRules: () => [], syncDir: async () => {}, team: () => null, assembleBuiltinTools: () => [],
    createAgent: () => agent,
  }
  const host = createAgentHost({
    emit: (channel, payload) => out.push([channel, payload]), run, deps, projects: { currentCwd: () => CWD },
  })
  return { host, out }
}

/** 起回合取回桥面（假 `run` 捕获 `cb`；缺省 = 常驻 Promise ⇒ 在飞不结算，桥面直调不受影响）。 */
async function boot(run) {
  let cb = null
  const h = makeHost((...args) => { cb = args[2]; return (run ?? (() => new Promise(() => {})))(...args) })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "hello")
  return { ...h, cb }
}

/** 末条某通道载荷。 */
const at = (out, channel) => out.filter(([c]) => c === channel).at(-1)[1]

// ─── U114 作答门往返 ──────────────────────────────────────────
test("U114: 作答门往返 —— 出站载荷键集恒四键 · 表项两判据 · 作答串结算 ∧ 命中即删", async () => {
  const { cb, out, host } = await boot()
  const q = cb.onQuestion("选哪个？", ["甲", "乙"])
  const qp = at(out, "ev:question")
  assert.deepEqual([qp.key, qp.question, qp.options], [KEY, "选哪个？", ["甲", "乙"]],
    "作答门出站载荷三值逐字（`ev:question` —— 核 `docs/desktop/design/IPC.md` §1）")
  assert.equal(typeof qp.promptId, "string", "promptId = 串（同表键 —— 下条表项读取即证）")
  assert.deepEqual(Object.keys(qp).sort(), ["key", "options", "promptId", "question"], "键集恒四键（零多余）")
  const entry = host.table.get(qp.promptId)
  assert.deepEqual([entry.kind, "shape" in entry], ["question", false], "表项 kind = question ∧ 无 shape 键（无 verdict 闭集）")
  assert.equal(host.table.size, 1, "作答门入表恰一项")
  assert.deepEqual(host.respond({ promptId: qp.promptId, answer: "乙" }), { ok: true }, "作答命中 ⇒ 受理")
  assert.equal(await q, "乙", "工具结果 = 作答串原样（非信号串）")
  assert.equal(host.table.has(qp.promptId), false, "命中 ⇒ 表项即删")
  cb.onQuestion("缺给答项？")
  assert.deepEqual(at(out, "ev:question").options, [], "给答项缺省 ⇒ 空数组（键集不变）")
})

// ─── U115 判红不 resolve ─────────────────────────────────────
test("U115: 判红三 reason 皆不 resolve（挂起保留 ⇒ 合法载荷可续答）—— bad-kind 两向 / bad-answer / 表外 id", async () => {
  const { cb, out, host } = await boot()
  const q = cb.onQuestion("q?", ["a"]) // ① 审批载荷打提问门（缺 answer 键）⇒ bad-kind
  const qp = at(out, "ev:question")
  assert.deepEqual(host.respond({ promptId: qp.promptId, verdict: "once" }), { ok: false, reason: "bad-kind" }, "审批载荷打提问门 ⇒ bad-kind")
  assert.equal(host.table.has(qp.promptId), true, "不 resolve ⇒ 表项保留（挂起不丢）")
  const p = cb.onPermissionRequest("read", { path: "/a" }) // ② 作答载荷打审批门 ⇒ bad-kind（两向）
  const ap = at(out, "ev:approval")
  assert.deepEqual(host.respond({ promptId: ap.promptId, answer: "x" }), { ok: false, reason: "bad-kind" }, "作答载荷打审批门 ⇒ bad-kind")
  assert.equal(host.table.has(ap.promptId), true, "表项保留")
  for (const bad of [7, true, {}, ["a"]]) {
    // ③ 非串且非 null ⇒ bad-answer
    assert.deepEqual(host.respond({ promptId: qp.promptId, answer: bad }), { ok: false, reason: "bad-answer" }, `假作答疑（${JSON.stringify(bad)}）⇒ bad-answer`)
    assert.equal(host.table.has(qp.promptId), true, "不 resolve")
  }
  assert.deepEqual(host.respond({ promptId: "nope", answer: "x" }), { ok: false, reason: "unknown-prompt" }, "表外 id ⇒ unknown-prompt（作答形同判）")
  assert.deepEqual(host.respond({ promptId: qp.promptId, answer: "a" }), { ok: true }, "保留项收合法作答 ⇒ 续答")
  assert.equal(await q, "a", "续解值 = 作答串")
  assert.ok(host.respond({ promptId: ap.promptId, verdict: "reject" }).ok, "审批门照旧（两门并存零串扰）")
  assert.equal(await p, false, "审批门结算值不变")
  assert.equal(host.table.size, 0, "两门皆结算 ⇒ 表清")
})

// ─── U116 取消两径 ───────────────────────────────────────────
test("U116: 取消两径 —— `answer: null` 显式 ∧ 打断路径 ⇒ 取消串（单源 `QUESTION_CANCELLED`）", async () => {
  const h = await boot() // ① 显式取消
  const q1 = h.cb.onQuestion("q?", ["a"])
  const p1 = at(h.out, "ev:question")
  assert.deepEqual(h.host.respond({ promptId: p1.promptId, answer: null }), { ok: true }, "null = 取消 ⇒ 受理")
  assert.equal(await q1, QUESTION_CANCELLED, "null ⇒ 取消串（单源 = `suspensions.mjs`）")
  assert.equal(h.host.table.size, 0, "取消 ⇒ 表清")

  // ② 打断路径：回合在飞 ⇒ abort ⇒ 假 run 拒绝 ⇒ 门按取消结算 + 收尾 `stopped`（门挂起时 abort 不解除 await）
  const h2 = await boot((_a, _t, _cb, opts) => new Promise((_res, rej) => {
    opts.signal.addEventListener("abort", () => rej(new Error("AbortError: aborted")), { once: true })
  }))
  const q2 = h2.cb.onQuestion("q?", [])
  assert.deepEqual(h2.host.interrupt(KEY), { ok: true }, "在飞 ⇒ abort")
  assert.equal(await q2, QUESTION_CANCELLED, "打断 ⇒ 门按取消结算（消悬 Promise）")
  assert.equal(h2.host.table.size, 0, "门结算 ⇒ 表清")
  await new Promise((r) => setImmediate(r))
  assert.equal(h2.out.filter(([, pay]) => pay.event === "stopped").length, 1, "abort 后拒绝 ⇒ 收尾 stopped（非错误面）")
  assert.equal(h2.out.filter(([c]) => c === "ev:error").length, 0, "stopped 分支零错误面")
})
