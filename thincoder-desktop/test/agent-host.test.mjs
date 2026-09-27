/**
 * agent-host.test.mjs — 宿主装配桥脱壳直测（批档 §2.4 U78–U86）。
 * 纪律：替身 `deps` + 替身 `run` + 假 `emit` ⇒ **零网 / 零 electron / 零用户目录**（`loadConfig` 亦替身；真盘面落于 tmp sessions 根 —— 本档多例经 `send` 必走终点保存，故**模块级**沙箱一次）。
 * 覆盖：脱壳纪律 · 装配序与端差取值 · 装配形 + provider 判定 · 实例生命周期 · 桥面十一回调（含 `onUsage`——非独立通道）· `⟦ev⟧` 分流 · 挂起表两形 · verdict 矩阵与即删 · 回合驱动与中断（U78–U86 同序）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { ACTIVITY_EVENTS, createAgentHost, ITEM_VERDICTS } from "../src/main/agent-host.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const sandbox = useSlotSandbox() // 模块级：`send` 三路皆终点保存 ⇒ 不沙箱即写真实用户 sessions 目录
after(sandbox.cleanup)

const SRC = readFileSync(new URL("../src/main/agent-host.mjs", import.meta.url), "utf8")
const KEY = "3"
const CWD = "/fake-project-root" // 注入项目根 —— 非 process.cwd() ⇒ 装配取值可辨
const PROVIDER = { name: "p1", model: "m1", baseURL: "http://127.0.0.1:1/v1" }

/** 剥注释（块 / 行）：源面机检须看**代码** —— 档头注释里明写 `process.cwd()` 反例（实测踩中）。 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}

/** 假装配面：记录调用序 + 产出核同形对象（`config.agent` 恒在场 —— 核 `loadConfig` 缺省面）。 */
function fakeDeps({ provider = PROVIDER, invalid = false } = {}) {
  const order = []
  const seen = {}
  const config = {
    provider: invalid ? { name: "", model: "", baseURL: "" } : { ...provider },
    providersList: invalid ? [] : [{ name: provider.name, model: provider.model }],
    agent: { streamRules: [] },
    memory: { dbPath: ":memory:", projectDir: "proj-mem" },
    providerInvalidReason: invalid ? "no provider configured" : undefined,
  }
  const memory = { codeOrigin: null, projectOrigin: null }
  const agent = { provider: { ...config.provider }, tools: [], cwd: CWD, history: [], _fullHistory: [] } // 保存面所需（核 `saveSession` 直读 `cwd` / 人读线）
  const deps = {
    loadConfig: () => { order.push("loadConfig"); return config },
    injectProxy: () => { order.push("injectProxy") },
    createMemory: () => { order.push("createMemory"); return memory },
    discoverRules: (cwd) => { order.push("discoverRules"); seen.rulesCwd = cwd; return [{ pattern: "AGENTS.md" }] },
    syncDir: async (_m, o) => { order.push(`syncDir:${o.layer}`) },
    team: () => { order.push("team"); return null },
    author: () => "tester",
    assembleBuiltinTools: (o) => { order.push("assembleBuiltinTools"); seen.tools = o; return [{ name: "read" }] },
    createAgent: (o) => { order.push("createAgent"); seen.agent = o; return agent },
  }
  return { deps, order, seen, config, memory, agent }
}

/** 假宿主：**真** `assembleFor` + 假 deps（装配路径真跑）+ 假 `emit` 收序。 */
function makeHost({ provider, invalid, run } = {}) {
  const out = []
  const fd = fakeDeps({ provider, invalid })
  const host = createAgentHost({
    emit: (channel, payload) => out.push([channel, payload]),
    run: run ?? (() => Promise.resolve()),
    deps: fd.deps,
    projects: { currentCwd: () => CWD },
  })
  return { host, out, ...fd }
}

/** 起一回合并取回桥面（假 `run` 捕获 `cb`；返回常驻 Promise ⇒ 在飞不结算，桥面直调不受影响）。 */
async function boot(opts = {}) {
  let cb = null
  const h = makeHost({ ...opts, run: (_agent, _text, callbacks) => { cb = callbacks; return new Promise(() => {}) } })
  await h.host.ensure(KEY, 3)
  const receipt = await h.host.send(KEY, "hello")
  return { ...h, cb, receipt }
}

/** 末条某通道载荷。 */
const at = (out, channel) => out.filter(([c]) => c === channel).at(-1)[1]

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

// ─── U82 桥面十一回调（十通道映射 + `onUsage` 并入会话累计）──────
test("U82: 十一回调 → 十通道（载荷键集按 IPC.md §1/§2）· `onUsage` 非通道（回合尾 `ev:usage` 携载荷）· onToolResult 第 4 参透传", async () => {
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
    assert.deepEqual(arm.r, { ok: true }, `${verdict} ⇒ 受理`)
    assert.equal(host.table.has(arm.promptId), false, "命中 ⇒ 表项即删")
    assert.equal(await arm.p, expect, `逐项门 ${verdict} ⇒ resolve ${expect}`)
    if (verdict === "always") assert.equal(agent.autoApprove, true, "always 另置会话放行（D8-6：实例作用域）")
  }
  for (const v of ["approveAll", "deny", "oneByOne"]) {
    const arm = await item(v, "batch")
    assert.deepEqual(arm.r, { ok: true })
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

  // ② 正常回合：立即回执 · 在飞再发 ⇒ busy · run 收 (agent, text, cb, {signal}) · resolve ⇒ done
  let resolveRun = null
  let captured = null
  const h = makeHost({
    run: (agent, text, callbacks, opts) => {
      captured = { agent, text, callbacks, opts }
      return new Promise((r) => { resolveRun = r })
    },
  })
  const p1 = h.host.send(KEY, "one")
  assert.deepEqual(await h.host.send(KEY, "two"), { ok: false, reason: "busy" }, "在飞再发 ⇒ busy（占位先于装配 await）")
  assert.deepEqual(await p1, { ok: true }, "正常 ⇒ 立即回 {ok:true}")
  assert.equal(captured.text, "one", "run 收本轮文本")
  assert.equal(captured.agent, await h.host.ensure(KEY, 3), "run 收装配实例")
  assert.deepEqual([captured.opts.signal instanceof AbortSignal, captured.opts.signal.aborted], [true, false], "run 收 {signal}（起跑未中断）")
  assert.deepEqual(h.host.interrupt("nope"), { ok: false, reason: "bad-key" })
  assert.deepEqual(h.host.interrupt(KEY), { ok: true }, "在飞 ⇒ abort 收")
  assert.equal(captured.opts.signal.aborted, true, "interrupt ⇒ signal 中止")
  resolveRun()
  await new Promise((r) => setImmediate(r))
  assert.equal(h.out.filter(([, p]) => p.event === "done").length, 1, "run resolve ⇒ done 收尾（唯一回合尾）")
  assert.deepEqual(h.host.interrupt(KEY), { ok: false, reason: "idle" }, "结算后 ⇒ idle")

  // ③ abort 后拒绝 ⇒ stopped（不入错误面）· 非 abort 拒绝 ⇒ ev:error
  let rejectRun = null
  const h2 = makeHost({ run: () => new Promise((_r, rej) => { rejectRun = rej }) })
  await h2.host.send(KEY, "x")
  h2.host.interrupt(KEY)
  rejectRun(new Error("AbortError: aborted"))
  await new Promise((r) => setImmediate(r))
  assert.equal(h2.out.filter(([, p]) => p.event === "stopped").length, 1, "abort 后拒绝 ⇒ stopped")
  assert.equal(h2.out.filter(([c]) => c === "ev:error").length, 0, "abort 分支零错误面")
  const h3 = makeHost({ run: () => Promise.reject(new Error("provider 500")) })
  await h3.host.send(KEY, "x")
  await new Promise((r) => setImmediate(r))
  assert.deepEqual(h3.out.at(-1), ["ev:error", { key: KEY, message: "provider 500" }], "非 abort 拒绝 ⇒ ev:error")
  assert.deepEqual(h3.host.interrupt(KEY), { ok: false, reason: "idle" }, "拒绝后释放在飞")

  // ④ 中断即结算本键待决门（消悬 Promise —— 门挂起时 abort 不解除 await）
  const h4 = await boot()
  const gate = h4.cb.onPermissionRequest("read", { path: "/a" })
  assert.equal(h4.host.table.size, 1)
  assert.deepEqual(h4.host.interrupt(KEY), { ok: true }, "在飞 ⇒ abort")
  assert.equal(await gate, false, "本键待决门 ⇒ 按拒结算（resolve false）")
  assert.equal(h4.host.table.size, 0, "门结算 ⇒ 表清")
})
