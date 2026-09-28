/**
 * agent-host.test.mjs — 宿主装配桥脱壳直测（批档 §2.4 U78–U86）。
 * 纪律：替身 `deps` + 替身 `run` + 假 `emit` ⇒ **零网 / 零 electron / 零用户目录**（`loadConfig` 亦替身；真盘面落于 tmp sessions 根 —— 本档多例经 `send` 必走终点保存，故**模块级**沙箱一次）。
 * 覆盖：脱壳纪律 · 装配序与端差取值 · 装配形 + provider 判定 · 实例生命周期 · 桥面十一回调（含 `onUsage`——非独立通道）· `⟦ev⟧` 分流 · 挂起表两形 · verdict 矩阵与即删 · 回合驱动与中断（U78–U86 同序）——排队面三例（U217–U219）出档 `test/agent-host-queued.test.mjs`（本档越 500 硬限 ⇒ 按在册预案「门面用例拆出 + 装配假面 harness 共享」落形）。
 * 点修轮（U-6 ∕ U-7）两例：U224（中止墓碑 —— 亡键零 timer 轮）· U225（中止径落盘零写 —— 槽 ∕ manifest 零复活）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { ACTIVITY_EVENTS, ITEM_VERDICTS } from "../src/main/agent-host.mjs"
import { NOTIFY_TEXTS } from "../src/main/notify.mjs"
// 共享假面（「回合中插入」批拆分产出 —— 本档越 500 硬限 ⇒ 装配假面出档 `test/agent-host-harness.mjs`；拆档 = `agent-host-queued.test.mjs`）。
import { at, boot, CWD, KEY, makeHost, SRC, stripComments, until } from "./agent-host-harness.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"
import { loadManifest, slotPath } from "../src/main/session-slots.mjs" // U225 写面读数（槽 / manifest 两处）

const sandbox = useSlotSandbox() // 模块级：`send` 三路皆终点保存 ⇒ 不沙箱即写真实用户 sessions 目录
after(sandbox.cleanup)

// ─── U78 脱壳面纪律 ────────────────────────────────────────────
test("U78: 源面零 electron / 零 MCP / 零 attachManifest · 假 emit 收序 = 事件序", async () => {
  assert.ok(!/electron/i.test(SRC), "源面零 electron 字样（正则零命中 —— 平 node 直测前提）")
  assert.ok(!/\bmcp\b/i.test(SRC) && !/attachManifest/.test(SRC), "零 MCP / 零 attachManifest（§2.6 D8-2 / D8-3）")
  assert.ok(!/process\.cwd\(\)/.test(stripComments(SRC)), "装配取值零 process.cwd()（cwd = 注入项目根）")
  const { cb, out } = await boot()
  cb.onToken("hello")
  cb.onToolCall("read", { path: "/a" }, "id1")
  cb.onAgentTurn(1, 200)
  assert.deepEqual(out.map(([c]) => c), ["ev:token", "ev:tool-call", "ev:activity"], "收序 = 事件序")
})

// ─── U79 装配段调用序 + 端差取值 ────────────────────────────────
test("U79: 装配调用序 = §2.2(b) 1–7 · cwd = 注入项目根 · model 必传", async () => {
  const h = makeHost()
  await h.host.ensure(KEY, 3)
  assert.deepEqual(h.order, [
    "loadConfig", "injectProxy", "createMemory", "discoverRules",
    "syncDir:project", "team", "assembleBuiltinTools", "createAgent",
  ], "装配序（§2.2(b) 1–7：配置 → 代理注入 → 记忆 → 规则 → 记忆层 → 团队层 → 工具 → 代理）")
  assert.notEqual(CWD, process.cwd(), "注入根与进程 cwd 可辨（防取值面假过）")
  assert.deepEqual([h.seen.rulesCwd, h.seen.tools.cwd, h.seen.agent.cwd], [CWD, CWD, CWD], "三处 cwd 皆注入项目根（**非** process.cwd()）")
  assert.deepEqual([h.seen.tools.model, h.seen.agent.provider.model], ["m1", "m1"], "model 必传（非空）· provider 原样入代理")
  assert.deepEqual(h.seen.agent.tools, [{ name: "read" }], "工具面入代理（替身产物原样）")
  assert.deepEqual(h.config.agent.streamRules.map((r) => r.pattern), ["AGENTS.md"], "文件规则并入 config.agent.streamRules（核缺省在场）")
  assert.equal(h.order.length, 8, "装配序八项 = 单次（零重复遍）")
})

// ─── U80 装配形 + provider 判定 ────────────────────────────────
test("U80: 装配形三值在场 · provider 无效 ⇒ _providerInvalid + 非空 reason", async () => {
  const ok = await boot()
  assert.deepEqual([ok.agent.providers, ok.agent.activeProvider, ok.agent.activeModel], [[{ name: "p1", model: "m1" }], "p1", "m1"], "装配形三值在场")
  const bad = await boot({ invalid: true })
  assert.equal(bad.agent._providerInvalid, true, "provider 无效 ⇒ 判定位（不抛）")
  assert.equal(bad.agent._providerInvalidReason, "no provider configured", "reason 非空（config 可覆盖）")
})

// ─── U81 装配实例生命周期 ──────────────────────────────────────
test("U81: 同键复用 · dispose 后重装配 · 装配表清", async () => {
  const h = makeHost()
  const a1 = await h.host.ensure(KEY, 3)
  const a2 = await h.host.ensure(KEY, 3)
  assert.equal(a1, a2, "同键复用同一实例")
  assert.equal(h.order.filter((x) => x === "createAgent").length, 1, "createAgent 恰一次")
  h.host.dispose(KEY)
  assert.equal(h.host.agents.has(KEY), false, "dispose ⇒ 装配表清")
  await h.host.ensure(KEY, 3)
  assert.equal(h.order.filter((x) => x === "createAgent").length, 2, "dispose 后重装配（恰二次）")
})

// ─── U82 桥面十一回调（十一通道映射 + `onUsage` 并入会话累计）──────
test("U82: 十一回调 → 十一通道（载荷键集按 IPC.md §1/§2）· `onUsage` 非通道（回合尾 `ev:usage` 携载荷）· onToolResult 第 4 参透传", async () => {
  const { cb, out, host } = await boot()
  const arms = [
    [() => cb.onToken("plain text"), "ev:token", { key: KEY, text: "plain text" }],
    [() => cb.onReasoning("think chunk"), "ev:reasoning", { key: KEY, text: "think chunk" }],
    [() => cb.onAgentTurn(2, 8), "ev:activity", { key: KEY, event: "turn", n: 2, max: 8 }],
    [() => cb.onToolCall("read", { path: "/a" }, "id1"), "ev:tool-call", { key: KEY, id: "id1", name: "read", argsSummary: '"/a"' }],
    [() => cb.onToolOutput("read", "chunk", "id1"), "ev:tool-output", { key: KEY, id: "id1", chunk: "chunk" }],
    [() => cb.onToolResult("read", "Error: boom", "id1"), "ev:tool-result", { key: KEY, id: "id1", ok: false, result: "Error: boom" }],
    [() => cb.onToolResult("read", "ok", "id1", "sub-9"), "ev:tool-result", { key: KEY, id: "id1", ok: true, result: "ok", subKey: "sub-9" }],
    [() => cb.onTaskUpdate([{ id: "t1" }]), "ev:task", { key: KEY, items: [{ id: "t1" }] }],
  ]
  for (const [fire, channel, payload] of arms) {
    fire()
    assert.deepEqual(at(out, channel), payload, `${channel} 载荷逐字（含 ok 判据 / subKey 透传 / 原样转发）`)
  }
  const q = cb.onQuestion("q?", ["a", "b"]) // 作答门载荷携 promptId（动态）⇒ 同审批门：键集 / 值分断言
  const qp = at(out, "ev:question")
  assert.deepEqual(Object.keys(qp).sort(), ["key", "options", "promptId", "question"], "作答门载荷键集四键")
  assert.deepEqual([qp.key, qp.question, qp.options], [KEY, "q?", ["a", "b"]], "作答门载荷值三件（余下 = promptId）")
  assert.ok(host.respond({ promptId: qp.promptId, answer: "b" }).ok, "作答出口命中（promptId 从表取）")
  assert.equal(await q, "b", "工具结果 = 作答串（真作答面 —— 悬起 Promise ⇒ resolve）")
  const single = cb.onPermissionRequest("bash", { command: "ls -la" })
  const sp = at(out, "ev:approval")
  assert.deepEqual(Object.keys(sp).sort(), ["argsSummary", "key", "promptId", "shape", "tool"], "逐项门载荷键集")
  assert.equal(sp.shape, "single", "逐项形 = single（IPC.md:18 值域）")
  assert.deepEqual([sp.tool, sp.argsSummary], ["bash", "ls -la"], "工具名 + 参数摘要单行")
  const batch = cb.onBatchPermissionRequest({ count: 2, tools: [{ name: "read" }, { name: "write" }] })
  const bp = at(out, "ev:approval")
  assert.deepEqual(Object.keys(bp).sort(), ["batch", "key", "promptId", "shape"], "批门载荷键集")
  assert.deepEqual(bp.batch, { count: 2, tools: ["read", "write"] }, "tools = 工具名串数组（IPC.md:18）")
  assert.notEqual(sp.promptId, bp.promptId, "两门 promptId 互异")
  assert.ok(host.respond({ promptId: sp.promptId, verdict: "reject" }).ok)
  assert.ok(host.respond({ promptId: bp.promptId, verdict: "deny" }).ok)
  assert.deepEqual([await single, await batch], [false, "deny"], "两形结算值映射（逐项 / 批）")
})

// ─── U83 `⟦ev⟧` 分流 ───────────────────────────────────────────
test("U83: 协议行分流矩阵（多字段 / 空字段 / turn / relay 前缀 ⇒ ev:subagent / 表外名 / 普通文本）+ 零协议行进文本面", async () => {
  const { cb, out } = await boot()
  const ev = () => at(out, "ev:activity")
  const matrix = [
    ["⟦ev⟧queued\x1e1\x1e2", { key: KEY, event: "queued", fields: "1\x1e2" }, "多字段原样（`\\x1e` 串不拆）"],
    ["⟦ev⟧still\x1e", { key: KEY, event: "still", fields: "" }, "空字段 = 空串（非 null —— 分隔符在场）"],
    ["⟦ev⟧turn", { key: KEY, event: "turn", fields: null }, "内联 turn：`fields` 键在场（判别写死 —— IPC.md §1 载荷键集段）"],
    ["⟦ev⟧weird\x1ez", { key: KEY, event: "weird", fields: "z" }, "表外事件名 ⇒ 进 ev:activity（不丢）"],
  ]
  for (const [line, payload, label] of matrix) {
    cb.onToken(line)
    assert.deepEqual(ev(), payload, label)
  }
  cb.onToken("advisor#7/⟦ev⟧settled\x1ex") // R3b：relay 前缀族 ⇒ `ev:subagent`（前缀剥除；映射单源 = 核 relay 表）
  assert.equal(out.filter(([c]) => c === "ev:subagent").length, 1, "relay 前缀 ⟦ev⟧ ⇒ `ev:subagent` 恰一帧（零前缀泄漏入 ev:activity）")
  const textBefore = out.filter(([c]) => c === "ev:token").length
  cb.onToken("see ⟦ev⟧x above")
  assert.deepEqual(out.at(-1), ["ev:token", { key: KEY, text: "see ⟦ev⟧x above" }], "非 relay 前缀不剥 ⇒ 整串进文本面（防误判）")
  assert.equal(out.filter(([c]) => c === "ev:token").length, textBefore + 1, "协议行零进文本面")
  assert.deepEqual([...ACTIVITY_EVENTS], ["turn", "queued", "async", "settled", "stopped", "done", "cancelled", "approval"], "八名闭集（SHELL.md §4）")
  assert.deepEqual([...ITEM_VERDICTS], ["once", "always", "reject"], "逐项门三值闭集")
})

// ─── U84 挂起表两形 ────────────────────────────────────────────
test("U84: 挂起表两形（入表读数 · promptId 互异 · 批形 count/tools）", async () => {
  const { cb, host } = await boot()
  const single = cb.onPermissionRequest("read", { path: "/a" })
  assert.equal(host.table.size, 1, "逐项门入表恰一项")
  const singleId = [...host.table.keys()][0]
  assert.equal(host.table.get(singleId).shape, "single")
  assert.equal(host.table.get(singleId).key, KEY, "表项携键（respond 时据键置 autoApprove）")
  const batch = cb.onBatchPermissionRequest({ count: 3, tools: [{ name: "bash" }] })
  assert.equal(host.table.size, 2, "批门再入表 ⇒ 两项")
  const ids = [...host.table.keys()]
  assert.equal(new Set(ids).size, 2, "promptId 互异")
  assert.ok(host.respond({ promptId: singleId, verdict: "once" }).ok)
  assert.ok(host.respond({ promptId: ids[1], verdict: "oneByOne" }).ok)
  assert.equal(host.table.size, 0, "两门结算 ⇒ 表清")
  assert.deepEqual([await single, await batch], [true, "oneByOne"], "两形结算值")
})

// ─── U85 verdict 映射与即删 ────────────────────────────────────
test("U85: 逐项/批门 verdict 矩阵 · 跨形与表外 ⇒ bad-verdict ∧ 表项保留 · 命中即删 · 未知 id", async () => {
  const { cb, host, agent } = await boot()
  const item = async (verdict, shape = "single") => {
    const p = shape === "single" ? cb.onPermissionRequest("read", { path: "/a" }) : cb.onBatchPermissionRequest({ count: 1, tools: [{ name: "bash" }] })
    const promptId = [...host.table.keys()].at(-1)
    return { p, r: host.respond({ promptId, verdict }), promptId }
  }
  for (const [verdict, expect] of [["once", true], ["always", true], ["reject", false]]) {
    const arm = await item(verdict)
    assert.equal(arm.r.ok, true, `${verdict} ⇒ 受理`)
    assert.equal(arm.r.key, KEY, "成功径回执携 `key`（状态栏对齐批叠加面）")
    assert.deepEqual(arm.r.flags, host.flagsOf(KEY), "成功径回执携 `flags`（活值投影 —— 与 `flagsOf` 同值）")
    assert.equal(host.table.has(arm.promptId), false, "命中 ⇒ 表项即删")
    assert.equal(await arm.p, expect, `逐项门 ${verdict} ⇒ resolve ${expect}`)
    if (verdict === "always") {
      assert.equal(agent.autoApprove, true, "always 另置会话放行（D8-6：实例作用域）")
      assert.equal(arm.r.flags.autoApprove, true, "放行置位已入回执 `flags`（同笔重叠 —— 桌内翻转即时面）")
    }
  }
  for (const v of ["approveAll", "deny", "oneByOne"]) {
    const arm = await item(v, "batch")
    assert.equal(arm.r.ok, true, `批门 ${v} ⇒ 受理`)
    assert.equal(arm.r.key, KEY, "批门成功径同携 `key`（审批门两形同面）")
    assert.deepEqual(arm.r.flags, host.flagsOf(KEY), "批门成功径同携 `flags`（活值投影）")
    assert.equal(await arm.p, v, `批形三值逐字透传（${v}）`)
  }
  // 跨形 / 表外值 ⇒ 判红 ∧ 挂起保留（合法值可续解 —— 「不 resolve」的反面证据）
  for (const [verdict, shape, resume, expect] of [
    ["approveAll", "single", "reject", false],
    ["once", "batch", "deny", "deny"],
    ["maybe", "single", "once", true],
  ]) {
    const arm = await item(verdict, shape)
    assert.deepEqual(arm.r, { ok: false, reason: "bad-verdict" }, `${shape} 门收 ${verdict} ⇒ bad-verdict`)
    assert.equal(host.table.has(arm.promptId), true, "非法 ⇒ 表项保留（挂起不丢）")
    assert.ok(host.respond({ promptId: arm.promptId, verdict: resume }).ok)
    assert.equal(await arm.p, expect, "保留项收合法值 ⇒ 续解")
  }
  assert.deepEqual(host.respond({ promptId: "nope", verdict: "once" }), { ok: false, reason: "unknown-prompt" })
  assert.deepEqual(host.respond({}), { ok: false, reason: "unknown-prompt" }, "缺 id ⇒ unknown-prompt")
})

// ─── U86 回合驱动与中断 ────────────────────────────────────────
test("U86: send 三态 · 中断（abort + 门拒结算）· 结算三映射（done / stopped / error）", async () => {
  // ① 无 provider ⇒ 零假回合（run 零调用 · 在飞即释放）
  let badRuns = 0
  const bad = makeHost({ invalid: true, run: () => { badRuns += 1; return Promise.resolve() } })
  await bad.host.ensure(KEY, 3)
  assert.deepEqual(await bad.host.send(KEY, "hi"), { ok: false, reason: "provider-invalid" })
  assert.equal(badRuns, 0, "provider 无效 ⇒ run 零调用")
  assert.deepEqual(await bad.host.send(KEY, "hi"), { ok: false, reason: "provider-invalid" }, "在飞已释放（非 busy）")
  assert.deepEqual(await bad.host.send("nope", "hi"), { ok: false, reason: "bad-key" }, "坏键 ⇒ bad-key")

  // ② 正常回合：立即回执 · **在飞再发 ⇒ 入队**（KD-40 ② 零 busy 拒面）· run 收 (agent, text, cb, {signal}) ·
  //    resolve ⇒ done ⇒ 回合尾续发（队非空 —— 队列先于接管）
  const runs = []
  let resolveRun = null
  let captured = null
  const h = makeHost({
    run: (agent, text, callbacks, opts) => {
      captured = { agent, text, callbacks, opts }
      runs.push(text)
      return new Promise((r) => { resolveRun = r })
    },
  })
  const p1 = h.host.send(KEY, "one")
  assert.deepEqual(await h.host.send(KEY, "two"), { ok: true, queued: true }, "在飞再发 ⇒ 入队受理（占位先于装配 await 同判；零 busy 拒面）")
  const queuedFrame = () => h.out.filter(([c]) => c === "ev:queue").at(-1)?.[1]
  assert.deepEqual(queuedFrame()?.items.map((item) => item.text), ["two"], "入队即出站（`ev:queue` 状态形 —— 快照 = 本键队列）")
  assert.deepEqual(await p1, { ok: true }, "正常 ⇒ 立即回 {ok:true}")
  assert.equal(captured.text, "one", "run 收本轮文本")
  assert.equal(captured.agent, await h.host.ensure(KEY, 3), "run 收装配实例")
  assert.deepEqual([captured.opts.signal instanceof AbortSignal, captured.opts.signal.aborted], [true, false], "run 收 {signal}（起跑未中断）")
  assert.equal(typeof captured.opts.consumeQueuedInput, "function", "用户回合 ⇒ 步边界缝在场（KD-40 ② —— turn-face 传参）")
  assert.deepEqual(h.host.interrupt("nope"), { ok: false, reason: "bad-key" })
  assert.deepEqual(h.host.interrupt(KEY), { ok: true }, "在飞 ⇒ abort 收")
  assert.equal(captured.opts.signal.aborted, true, "interrupt ⇒ signal 中止")
  resolveRun()
  await new Promise((r) => setImmediate(r))
  assert.equal(h.out.filter(([, p]) => p.event === "done").length, 1, "run resolve ⇒ done 收尾（首个回合）")
  assert.deepEqual(runs, ["one", "two"], "结算后队非空 ⇒ 宿主续发（队列先于接管 —— KD-40 ③）")
  assert.deepEqual(queuedFrame().items, [], "取批后快照空（整置语义）——配回执 `delivered.text` 逐字")
  assert.equal(queuedFrame().delivered.text, "two", "消费回执 = 本批注入文本（单条原样）")
  resolveRun()
  await new Promise((r) => setImmediate(r))
  assert.equal(h.out.filter(([, p]) => p.event === "done").length, 2, "续发轮结算 ⇒ 第二 done（队空 ⇒ 不递归）")
  assert.deepEqual(h.host.interrupt(KEY), { ok: false, reason: "idle" }, "结算后（队空）⇒ idle")

  // ③ abort 后拒绝 ⇒ stopped（不入错误面）· 非 abort 拒绝 ⇒ ev:error
  let rejectRun = null
  const h2 = makeHost({ run: () => new Promise((_r, rej) => { rejectRun = rej }) })
  await h2.host.send(KEY, "x")
  h2.host.interrupt(KEY)
  rejectRun(new Error("AbortError: aborted"))
  await new Promise((r) => setImmediate(r))
  assert.equal(h2.out.filter(([, p]) => p.event === "stopped").length, 1, "abort 后拒绝 ⇒ stopped")
  assert.equal(h2.out.filter(([c]) => c === "ev:error").length, 0, "abort 分支零错误面")
  const err500 = new Error("provider 500")
  const h3 = makeHost({ run: () => Promise.reject(err500) })
  await h3.host.send(KEY, "x")
  await new Promise((r) => setImmediate(r))
  assert.deepEqual(h3.out.at(-1), ["ev:error", { key: KEY, message: "provider 500", techInfo: err500.stack }],
    "非 abort 拒绝 ⇒ ev:error ∧ `techInfo` = `err.stack` 逐字（「对齐第三批」项 9 · KD-37）")
  assert.deepEqual(h3.host.interrupt(KEY), { ok: false, reason: "idle" }, "拒绝后释放在飞")

  // ③b `techInfo` 缺径（非 Error 拒绝 ⇒ 无 `stack`）⇒ **键缺席**（禁假造 —— 错误横幅 `details` 面随之缺席）
  const h3b = makeHost({ run: () => Promise.reject("plain-reason") })
  await h3b.host.send(KEY, "x")
  await new Promise((r) => setImmediate(r))
  assert.deepEqual(h3b.out.at(-1), ["ev:error", { key: KEY, message: "plain-reason" }], "无 `stack` ⇒ 零 `techInfo` 键（载荷键缺席）")

  // ④ 中断即结算本键待决门（消悬 Promise —— 门挂起时 abort 不解除 await）
  const h4 = await boot()
  const gate = h4.cb.onPermissionRequest("read", { path: "/a" })
  assert.equal(h4.host.table.size, 1)
  assert.deepEqual(h4.host.interrupt(KEY), { ok: true }, "在飞 ⇒ abort")
  assert.equal(await gate, false, "本键待决门 ⇒ 按拒结算（resolve false）")
  assert.equal(h4.host.table.size, 0, "门结算 ⇒ 表清")
})

// ─── U178 模式位活值投影 + `respond` 成功径叠加（状态栏对齐批）──────────────

test("U178: `flagsOf` 活值投影（agent 不在场 ⇒ null）· `respond` 成功径叠加 `{ key, flags }`（提问门径 / 失败径零叠加）", async () => {
  const bare = makeHost()
  assert.equal(bare.host.flagsOf(KEY), null, "agent 不在场 ⇒ null（禁假造 —— 页读供面槽投影兜底）")
  assert.equal(bare.host.flagsOf(null), null, "无键 ⇒ null")

  const h = await boot()
  assert.deepEqual(h.host.flagsOf(KEY), { planMode: false, autoApprove: false, advisorGuard: false, engineering: false },
    "agent 在场 ⇒ 四布尔齐（严格执行面缺省全假 —— 负向锁）")
  assert.deepEqual(h.host.flagsOf(3), h.host.flagsOf(KEY), "键归一（数值键同指）")
  h.agent.planMode = true
  h.agent.config = { advisor: { guard: true }, agent: { engineering: true } }
  assert.deepEqual(h.host.flagsOf(KEY), { planMode: true, autoApprove: false, advisorGuard: true, engineering: true },
    "活值逐项直读（`planMode` / `advisor.guard === true` / `agent.engineering === true` —— 槽恢复同源）")

  const gate = h.cb.onPermissionRequest("bash", { command: "ls" })
  const promptId = [...h.host.table.keys()].at(-1)
  const receipt = h.host.respond({ promptId, verdict: "always" })
  assert.deepEqual(Object.keys(receipt).sort(), ["flags", "key", "ok"], "成功径叠加键集（`{ ok, key, flags }`）")
  assert.equal(receipt.key, KEY, "`key` = 门键")
  assert.equal(receipt.flags.autoApprove, true, "`always` 放行置位 ⇒ 回执 `flags` 即刷新（桌内 AUTO 翻转 —— 零新通道）")
  assert.equal(await gate, true, "门 resolve 值照旧（叠加不改语义）")

  const asked = h.cb.onQuestion("问？", ["a"])
  const qid = [...h.host.table.keys()].at(-1)
  assert.deepEqual(h.host.respond({ promptId: qid, answer: "a" }), { ok: true }, "提问门径 ⇒ 零叠加（不携 key / flags）")
  assert.equal(await asked, "a")
  assert.deepEqual(h.host.respond({ promptId: "nope", verdict: "once" }), { ok: false, reason: "unknown-prompt" }, "失败径 ⇒ 零叠加")
  assert.deepEqual(h.host.respond({}), { ok: false, reason: "unknown-prompt" }, "缺 id ⇒ 零叠加（unknown-prompt）")
})

// ─── U191 三路由补例（桌面空闲唤醒批 —— 窗内 send ∕ 附件 busy ∕ interrupt idle ∕ dispose 级联）───

test("U191: 挂起窗三路由 —— 窗内 send ⇒ pushInput（普通回合）· 含附件 ⇒ busy 留队 · interrupt 空闲 ⇒ idle · dispose ⇒ 清池 + 出窗帧", async () => {
  const runs = []
  const toasts = []
  const h = makeHost({
    run: (agent, text, callbacks, opts) => {
      runs.push({ text, opts })
      if (runs.length === 1) agent._asyncSubagents = new Map([["7", { id: "7", role: "subagent", status: "running", done: false }]])
      return Promise.resolve()
    },
    notify: (payload) => toasts.push(payload),
    focused: () => false,
    reveal: () => {},
  })
  await h.host.ensure(KEY, 3)
  const susp = () => h.out.filter(([c]) => c === "ev:susp").at(-1)?.[1] // 末帧安全读（无帧 ⇒ undefined）
  assert.deepEqual(await h.host.send(KEY, "hello"), { ok: true }, "首回合受理")
  await until(() => susp()?.active === true, "回合尾入窗")
  assert.equal(h.agent._suspended, true, "挂起窗在场（载体 `_suspended` —— 回合尾结算后 · 在飞已释）")
  assert.deepEqual(susp(), { key: KEY, active: true, running: 1, queued: 0, pending: 0, done: 0 }, "入口帧 = 核计数直传")
  assert.equal(toasts.length, 1, "档①：用户回合完成 ⇒ 通知恰一条（失焦）")
  assert.equal(toasts[0].body, NOTIFY_TEXTS.en.done, "档① 句 = 词键值（无 locale 配置 ⇒ en）")
  assert.equal(runs[0].opts.suspDriven, true, "单回合执行面 = `suspDriven: true`（撤回合尾直注入兜底）")

  // ① 窗内 send（文本）⇒ 入驱动器队列 ⇒ 立即受理 ∧ 以普通回合语义起跑
  assert.deepEqual(await h.host.send(KEY, "窗内输入"), { ok: true }, "窗内文本 ⇒ 入队受理（立即回）")
  await until(() => runs.length === 2, "窗内用户回合")
  assert.deepEqual([runs[1].text, runs[1].opts.autoTurn], ["窗内输入", false], "窗内用户回合 = 普通回合语义（用户输入优先序沿核件）")

  // ② 窗内含附件 ⇒ busy 留队重试（核件输入面 = 文本单形 —— 登记 §10 BC）
  const images = [{ name: "a.png", mime: "image/png", dataURL: "data:image/png;base64,AAAA" }]
  assert.deepEqual(await h.host.send(KEY, "带图", images), { ok: false, reason: "busy" }, "附件 ⇒ 留队重试")
  assert.equal(runs.length, 2, "busy 径零起跑（零假回合）")

  // ③ interrupt 空闲（窗等待期 —— 无在飞回合）⇒ idle
  await until(() => true, "tick") // 一拍：让窗内回合的 finally 释放在飞
  assert.deepEqual(h.host.interrupt(KEY), { ok: false, reason: "idle" }, "窗空闲期 ⇒ idle（无全停面）")

  // ④ dispose ⇒ 窗级联中止（清池不注入 + 出窗帧 + 装配表清）
  h.host.dispose(KEY)
  await until(() => susp()?.active === false, "出窗帧")
  assert.equal(h.agent._asyncSubagents.size, 0, "清池不注入（abort 语义 —— 陈旧结果不回灌）")
  assert.equal(h.agent._suspended, false, "载体复位（窗退出）")
  assert.equal(h.agent._sessionAbort ?? null, null, "会话控制器随窗摘除")
  assert.equal(h.host.agents.has(KEY), false, "装配表清（dispose 既有面零回归）")
})

// ─── U192 切项目级联路由（§2.2 —— `project:open` 成功径调用面）─────────────

test("U192: `abortSuspensions()` ⇒ 全键窗中止（清池不注入 + 出窗帧）· 装配表不动 · 幂等零动作", async () => {
  const h = makeHost({
    run: (agent) => {
      agent._asyncSubagents = new Map([["9", { id: "9", role: "subagent", status: "running", done: false }]])
      return Promise.resolve()
    },
  })
  const susp = () => h.out.filter(([c]) => c === "ev:susp").at(-1)?.[1]
  assert.deepEqual(await h.host.send(KEY, "hi"), { ok: true }, "受理")
  await until(() => susp()?.active === true, "回合尾入窗")
  assert.equal(h.host.abortSuspensions(), 1, "命中一窗（§2.2 切项目级联路由）")
  await until(() => susp()?.active === false, "出窗帧")
  assert.equal(h.agent._asyncSubagents.size, 0, "清池不注入（abort 语义）")
  assert.equal(h.agent._suspended, false, "载体复位")
  assert.equal(h.host.agents.has(KEY), true, "装配表不动（级联只中止窗 —— 非 dispose）")
  assert.equal(h.host.abortSuspensions(), 0, "已无窗 ⇒ 零动作（幂等）")
})

// ─── U195 「对齐第三批」桥面增键（真宿主注入面：判据 / 两采样 / 两接缝）────────────

test("U195: 「对齐第三批」桥面 —— 失败判据核单源 · advisor 两键（仅具名）· owner / diff 四参缝 · links 零假造负向锁", async () => {
  const { host, out, cb, agent } = await boot()

  // ① `ev:tool-result` 判据 = 核 `isToolFailure`（项 2）：半 / 全角头 ∧ 独立成行状态位 ⇒ ok 假；正文提及不误报
  const resultOf = (text) => { out.length = 0; cb.onToolResult("bash", text, "t1"); return at(out, "ev:tool-result") }
  assert.deepEqual(
    [resultOf("Error: boom").ok, resultOf("Error：全角").ok, resultOf("$ x\n(exit code 1)").ok, resultOf("plain ok").ok, resultOf("文中 (exit code 1) 不误报").ok],
    [false, false, false, true, true],
    "判据核单源直取（旧 `startsWith(\"Error:\")` 漏判面：全角头与状态位两臂）",
  )

  // ② advisor 轮次采样（项 14 · A14）：仅 `advisor` 名携 `round` / `model`（`_advisorRound` 活读 +1）
  agent._advisorRound = 2
  out.length = 0
  cb.onToolCall("advisor", { type: "code" }, "a1")
  assert.deepEqual(at(out, "ev:tool-call"), { key: KEY, id: "a1", name: "advisor", argsSummary: "code", round: 3, model: "m1" },
    "advisor ⇒ `round` = `_advisorRound + 1` · `model` = 生效 provider 模型（宿主只读采样 —— 零构造）")
  out.length = 0
  cb.onToolCall("read", { path: "/a" }, "t2")
  assert.deepEqual(["round" in at(out, "ev:tool-call"), "model" in at(out, "ev:tool-call")], [false, false], "非 advisor ⇒ 零两键（零改面）")

  // ③ 子代理门四参缝（B1 / 相抵①）：owner / diff 随载荷出站（缺 ⇒ 键缺席）
  out.length = 0
  const gate = cb.onPermissionRequired("apply_patch", { path: "a.mjs" }, { patch: "@@ -1 +1 @@" }, { owner: { label: "eng-coder#2" } })
  const ask = at(out, "ev:approval")
  assert.deepEqual([ask.owner, ask.diff], ["eng-coder#2", { patch: "@@ -1 +1 @@" }], "owner = `opts.owner.label` 原样 · diff = 核 `diffInfo` 原样")
  assert.deepEqual([ask.shape, ask.tool], ["single", "apply_patch"], "载荷族零变（逐项形 + 工具名）")
  assert.equal(host.respond({ promptId: ask.promptId, verdict: "once" }).ok, true, "四参缝不破既有出口（门结算走既有 verdict 面）")
  assert.equal(await gate, true, "门 resolve = 放行真值")
  out.length = 0
  cb.onPermissionRequired("read", { path: "a.mjs" }, null, null)
  assert.deepEqual(Object.keys(at(out, "ev:approval")).sort(), ["argsSummary", "key", "promptId", "shape", "tool"], "无 owner / diff ⇒ 两键缺席（深度 0 / 无主形幂等）")

  // ④ links 负向锁（相抵② · KD-39）：注入面在位但 `cwd` = 假项目根 ⇒ 盘上零命中 ⇒ 零 `links` 键（禁假链接）
  assert.equal("links" in resultOf("read /fake-project-root/missing.mjs"), false, "验存闸下无真路径 ⇒ 零 `links` 键")

  // ⑤ 子回合边界（A7）：`ev:activity { event: "turnBreak" }` —— **无 `fields`**（非内联 / 非回合尾）
  out.length = 0
  cb.onTurnEnd(agent, 3)
  assert.deepEqual(at(out, "ev:activity"), { key: KEY, event: "turnBreak" }, "turnBreak 形逐字（零 `fields`）")
})

// ─── T-TW21 驱动面（timer-wake 阶段 2 —— 空闲闩到点 ⇒ timer 轮：旗标与落流同径）────────

test("T-TW21（驱动面）: 回合尾接管后武装 ⇒ 空闲到点 ⇒ `ev:timer` 落流 + 单回合执行面收 `{autoTurn,timerTurn}`", async () => {
  const runs = []
  const h = makeHost({
    run: (agent, text, callbacks, opts) => {
      runs.push({ text, opts })
      if (runs.length === 1) agent._pendingTimers = [{ id: "t1", expiresAt: Date.now() - 1, message: "ping" }] // 到期件（闩延迟夹 0）
      return Promise.resolve()
    },
  })
  await h.host.ensure(KEY, 3)
  assert.deepEqual(await h.host.send(KEY, "hello"), { ok: true }, "首回合受理（回合尾接管 ⇒ 未入窗 ⇒ 武装空闲闩）")
  await until(() => runs.length === 2, "空闲 timer 轮")
  assert.deepEqual([runs[1].opts.autoTurn, runs[1].opts.timerTurn, runs[1].opts.suspDriven], [true, true, true], "timer 轮 = 双旗标（五件透传）")
  assert.equal(runs[0].opts.timerTurn, false, "普通回合缺省 ⇒ false")
  assert.deepEqual(at(h.out, "ev:timer"), { key: KEY, text: "[System reminder: ⏰ timer — ping]" }, "触发落流（交付原文逐字 · 开轮前）")
  assert.deepEqual(h.agent._pendingTimers, [], "到期即出列（幂等）")
  assert.equal(h.out.filter(([channel]) => channel === "ev:digest").length, 0, "timer 轮不冒充消化边界（零 `ev:digest` 帧）")
})

// ─── U224 U-6 收口（在途 timer 臂）：会话中止 ⇒ 回合尾接管墓碑 —— 空闲闩零重武装（亡键零 timer 轮）──

test("U224: U-6 —— `dispose` 后陈旧回合结算（池空 + 在途 timer）⇒ 零亡键 timer 轮（闩零重武装）", async () => {
  const runs = []
  let resolveRun = null
  const h = makeHost({
    run: (agent, text) => {
      runs.push(text)
      agent._pendingTimers = [{ id: "t1", expiresAt: Date.now() - 1, message: "ping" }] // 到期件（闩延迟夹 0 —— 免真实等待；手法同 T-TW21）
      return new Promise((r) => { resolveRun = r })
    },
  })
  await h.host.ensure(KEY, 3)
  await h.host.send(KEY, "旧回合")
  h.host.dispose(KEY) // 会话中止 ⇒ 在飞中止 + 落中止墓碑（闩撤）
  resolveRun() // 陈旧回合迟到结算
  await until(() => h.out.some(([channel, payload]) => channel === "ev:activity" && payload.event === "done"), "陈旧回合结算")
  await new Promise((done) => setTimeout(done, 15)) // 失效窗：旧行为 = 闩重武装 + 延迟 0 点火（本刻内必达）
  assert.deepEqual(runs, ["旧回合"], "零亡键 timer 轮（闩零重武装 —— 旧行为 ⇒ 第二跑 `{autoTurn,timerTurn}`）")
  assert.equal(h.out.some(([channel]) => channel === "ev:timer"), false, "零 `ev:timer` 落流（亡键零交付）")
  assert.equal(h.agent._pendingTimers.length, 1, "到期件仍在册（亡键零消费 —— 出列即消费）")
})

// ─── U225 U-7 收口：会话中止（`dispose` ∕ 切项目）⇒ 回合尾落盘零写（槽 ∕ manifest 零复活）─────────

test("U225: U-7 —— 会话中止 ⇒ 回合尾落盘零写（已删会话槽 ∕ manifest 零复活）· 正控 = 正常回合双写", async () => {
  const K9 = "9" // 本用例键 —— 与既有例的槽 3 隔离（模块沙箱共享：正控须对本刻负向断言有物可对）
  const slot9 = slotPath(CWD, 9)
  const entry9 = () => loadManifest(CWD).slots[9] ?? null
  // ① `dispose` 臂（在飞中止 ⇒ 回合拒绝 —— catch 径）：落盘零写
  let rejectRun = null
  const h = makeHost({ run: () => new Promise((_r, rej) => { rejectRun = rej }) })
  await h.host.ensure(K9, 9)
  await h.host.send(K9, "旧回合")
  h.host.dispose(K9)
  rejectRun(new Error("AbortError: aborted"))
  await until(() => h.out.some(([channel, payload]) => channel === "ev:activity" && payload.event === "stopped"), "中止径结算")
  assert.equal(existsSync(slot9), false, "dispose 臂：槽零写（中止径跳过落盘 —— 旧行为 ⇒ 复活槽文件）")
  // ② 切项目臂（成功径同判）：`abortSuspensions` 后回合 resolve ⇒ 落盘零写
  let resolveRun = null
  const h2 = makeHost({ run: () => new Promise((r) => { resolveRun = r }) })
  await h2.host.ensure(K9, 9)
  await h2.host.send(K9, "旧项目回合")
  h2.host.abortSuspensions()
  resolveRun()
  await until(() => h2.out.some(([channel, payload]) => channel === "ev:activity" && payload.event === "done"), "切项目径结算")
  assert.equal(existsSync(slot9), false, "切项目臂：槽零写（成功径同判）")
  assert.equal(entry9(), null, "manifest 零条目（两臂合计 —— 已删会话不进清单）")
  // ③ 正控：同键正常回合 ⇒ 槽 ∕ manifest 双写（写面可达 —— 上面两条负向断言非空判）
  const h3 = makeHost({ run: () => Promise.resolve() })
  await h3.host.send(K9, "正常回合")
  await until(() => existsSync(slot9), "正常回合落盘")
  assert.notEqual(entry9(), null, "正控：槽 ∕ manifest 双写（本刻同键写面可达）")
})
