/**
 * agent-host-subagent.test.mjs — R3b 宿主子 agent 面直测（`docs/desktop/design/IPC.md` §2 `subagent:stop` 行 ·
 * `docs/desktop/design/UI.md` §1 本批注项 2「数据链 = 宿主 relay 分流 + 存活投影 2s 再断言」；
 * `docs/desktop/design/PROJECT.md` §7 T-DSK36 ③/⑤；批档 §2 ㈠/㈡/㈤）：
 *   U164 存活投影**起 / 停 / 清点**：单拍 = 逐键在飞实例（只发在飞）· 摘装配表 ⇒ 该键出拍 · 起拍幂等 / 停拍后重起
 *        · 2s 真拍体实证（一拍窗内出帧）；
 *   U165 `subagent:stop` 往返：成功 = 实收 `cancelled`（异步 running ⇒ abort + settle token 经桥面；异步 queued ⇒
 *        核发射 `⟦ev⟧cancelled` 当场；同步族 registry 命中 ⇒ cancelSyncChild）· 拒态闭集（`bad-key` / `unknown-sub`）。
 * 纪律：真槽沙箱（tmp sessions 根）+ 假装配 + 假 `run` + 假 `emit` ⇒ 零网 / 零 electron / 零用户目录。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createAgentHost } from "../src/main/agent-host.mjs"
import { LIVE_HEARTBEAT_MS } from "../src/main/subagent-face.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const KEY = "9"
const PROVIDER = { name: "p1", model: "m1", baseURL: "http://127.0.0.1:1/v1" }

/** 假装配：核装配形最小面（`history` 供槽装载 / 保存；池表由用例挂）。 */
function makeHost(cwd, { run } = {}) {
  const out = []
  const calls = []
  const host = createAgentHost({
    emit: (channel, payload) => out.push([channel, payload]),
    assemble: async ({ cwd: site, slot }) => ({
      cwd: site, provider: { ...PROVIDER }, providers: [{ name: PROVIDER.name, model: PROVIDER.model }],
      tools: [], config: {}, history: [], _fullHistory: [], _slot: slot,
    }),
    run: run ?? (() => new Promise(() => {})), // 缺省 = 在飞不结算（桥面直调不受影响）
    projects: { currentCwd: () => cwd },
  })
  return { host, out, calls }
}
const subs = (out) => out.filter(([channel]) => channel === "ev:subagent").map(([, payload]) => payload)
const tick = () => new Promise((r) => setImmediate(r))

/** 池条目（核 `subagent-run.mjs:66` 形最小面）。 */
const entry = (over = {}) => ({
  id: 3, role: "coder", relayPrefix: "coder#3/", status: "running", position: undefined,
  done: false, cancelled: false, model: "m-child", startedAt: 111, controller: null, ...over,
})

// ─── U164 存活投影（起 / 停 / 清点）────────────────────────────

test("U164: 存活投影起 / 停 / 清点（单拍只发在飞 · 摘表出拍 · 起拍幂等 ∧ 停拍可重起 · 2s 真拍体出帧）", async (t) => {
  const s = useSlotSandbox(t)
  const { host, out } = makeHost(s.cwd)
  assert.equal(LIVE_HEARTBEAT_MS, 2000, "拍体周期 = 2s（设计「2s 再断言」单源）")
  assert.ok(typeof host.stopSubagent === "function" && typeof host.heartbeatBeat === "function", "子 agent 面已在宿主面展开（`subagent:stop` + 拍体）")

  const first = host.startHeartbeat()
  assert.equal(host.startHeartbeat(), first, "起拍幂等（同句柄 —— 同宿主单拍）")
  host.stopHeartbeat()
  assert.notEqual(host.startHeartbeat(), first, "停拍 ⇒ 句柄清；重起 ⇒ 新句柄（起 / 停两向）")

  // 清点面：装配表在场才入拍
  assert.equal(host.heartbeatBeat(), 0, "零装配 ⇒ 拍体零投")
  const agent = await host.ensure(KEY, 9)
  agent._asyncSubagents = new Map([
    ["3", entry()],
    ["4", entry({ id: 4, status: "queued", position: 2, controller: null })],
    ["5", entry({ id: 5, status: "done", done: true })],
  ])
  agent._asyncAdvisors = new Map([["6", entry({ id: 6, role: "advisor", startedAt: 222 })]])
  out.length = 0
  assert.equal(host.heartbeatBeat(), 3, "单拍 = 在飞三例（running / queued / advisor-running —— 终态出表）")
  assert.deepEqual(subs(out).map((p) => [p.key, p.status, p.id]), [[KEY, "started", 3], [KEY, "queued", 4], [KEY, "started", 6]], "逐条 `ev:subagent`（键 = 会话键）")

  host.dispose(KEY) // 清点：会话关闭 / 删除面 ⇒ 该键投影清（旧会话块不随拍重投）
  out.length = 0
  assert.equal(host.heartbeatBeat(), 0, "摘装配表 ⇒ 该键出拍（零再断言）")
  assert.deepEqual(subs(out), [], "出拍后零 `ev:subagent` 帧")

  // 2s 真拍体实证（一拍窗内出帧 —— 起拍后不手动驱动）
  const agent2 = await host.ensure(KEY, 9)
  agent2._asyncSubagents = new Map([["7", entry({ id: 7 })]])
  await tick()
  const before = subs(out).length
  await new Promise((resolve) => setTimeout(resolve, LIVE_HEARTBEAT_MS + 600))
  assert.ok(subs(out).length > before, "2s 拍体真出帧（出生自愈面通电 —— 非仅手动直驱）")
  host.stopHeartbeat()
  const after = subs(out).length
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.equal(subs(out).length, after, "停拍后零新帧（停拍生效）")
})

// ─── U165 `subagent:stop` 往返（实收 cancelled ∧ 拒态闭集）──────────

test("U165: `subagent:stop` 往返（异步 running / queued / 同步族三径 ⇒ 实收 `cancelled` · 拒态闭集）", async (t) => {
  const s = useSlotSandbox(t)
  const captured = []
  const { host, out } = makeHost(s.cwd, { run: (_agent, _text, cb) => { captured.push(cb); return new Promise(() => {}) } })

  // 拒态：坏键 / 未装配 / 表外 id / 缺 id
  assert.deepEqual(host.stopSubagent("zz", 3, "coder"), { ok: false, reason: "bad-key" }, "键不合规 ⇒ `bad-key`")
  assert.deepEqual(host.stopSubagent(KEY, 3, "coder"), { ok: false, reason: "unknown-sub" }, "未装配会话 ⇒ `unknown-sub`")

  const agent = await host.ensure(KEY, 9)
  await host.send(KEY, "hello") // 取回桥面（settle 面 = 该 callbacks —— 与真实路径同源）
  assert.equal(captured.length, 1, "桥面已捕获（假 run）")
  assert.deepEqual(host.stopSubagent(KEY, 99, "coder"), { ok: false, reason: "unknown-sub" }, "表外 id ⇒ `unknown-sub`")
  assert.deepEqual(host.stopSubagent(KEY, null, "coder"), { ok: false, reason: "unknown-sub" }, "缺 id ⇒ `unknown-sub`（零抹平取消）")

  // ① 异步 running：定向 abort（settle 面发 `⟦ev⟧stopped` ⇒ 实收 `cancelled`）
  const aborts = []
  agent._asyncSubagents = new Map([["3", entry({ controller: { abort: (reason) => aborts.push(reason) } })]])
  out.length = 0
  assert.deepEqual(host.stopSubagent(KEY, 3, "coder"), { ok: true, reason: null }, "running 池条目 ⇒ `ok`（发起取消）")
  assert.equal(aborts.length, 1, "条目 controller 真 abort（定向中止 —— 核既有执行器）")
  assert.deepEqual(aborts[0], { abortTrigger: "cancel", abortDetail: "subagent-cancel" }, "abort 载荷 = 核 cancel 语义（站点 #11）")
  assert.equal(agent._asyncSubagents.get("3").cancelled, true, "条目已置 cancelled 标记（核执行器）")
  captured[0].onToken("coder#3/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e") // settle 尾发（与真实路径同 token）
  assert.deepEqual(subs(out), [{ key: KEY, status: "cancelled", role: "coder", id: 3 }], "停止 ⇒ **实收 `cancelled`**（`⟦ev⟧stopped` 先例兼容映射经桥面出 `ev:subagent`）")
  assert.equal(host.stopSubagent(KEY, 3, "coder").ok, true, "在飞取消幂等（重复发起 ⇒ 仍 `ok`）")

  // ② 异步 queued：出队即终态（核发射 `⟦ev⟧cancelled` 当场经本键桥面）
  const queued = entry({ id: 4, relayPrefix: "coder#4/", status: "queued", position: 1, controller: null })
  agent._asyncSubagents = new Map([["4", queued]])
  agent._asyncQueue = [queued]
  out.length = 0
  assert.deepEqual(host.stopSubagent(KEY, 4, "coder"), { ok: true, reason: null }, "queued 池条目 ⇒ `ok`")
  assert.deepEqual(subs(out), [{ key: KEY, status: "cancelled", was: "queued", role: "coder", id: 4 }], "queued 取消 ⇒ 核当场发 `⟦ev⟧cancelled` ⇒ `ev:subagent`（等待头移除径）")
  assert.equal(agent._asyncSubagents.has("4"), false, "出队即出池（核执行器）")
  assert.deepEqual(host.stopSubagent(KEY, 4, "coder"), { ok: false, reason: "unknown-sub" }, "已出池 ⇒ `unknown-sub`（该实例不在飞）")

  // ③ 同步族：registry 命中 ⇒ `cancelSyncChild`（stopped 旗标 + 定向 abort）
  agent._asyncSubagents = new Map()
  agent._syncChildAborts = new Map([["explore#7", { ctrl: { abort: (reason) => aborts.push(reason) }, stopped: false }]])
  assert.deepEqual(host.stopSubagent(KEY, 7, "explore"), { ok: true, reason: null }, "sync registry 命中 ⇒ `ok`")
  assert.equal(agent._syncChildAborts.get("explore#7").stopped, true, "stopped 旗标已置（核执行器单源）")
  assert.deepEqual(aborts.at(-1), { abortTrigger: "cancel", abortDetail: "sync-child-cancel" }, "sync 定向 abort 载荷 = 核语义")
  assert.deepEqual(host.stopSubagent(KEY, 7, "explore"), { ok: false, reason: "unknown-sub" }, "已 stopped ⇒ `unknown-sub`（幂等边界）")
  assert.deepEqual(host.stopSubagent(KEY, 7, null), { ok: false, reason: "unknown-sub" }, "缺 role（sync 键不可构）⇒ `unknown-sub`")

  // 清点生产触发点（源面机检 —— `ipc.mjs` 依赖 electron，不可直 import）：`session:delete` 成功 ⇒ 宿主 dispose
  const ipc = readFileSync(new URL("../src/main/ipc.mjs", import.meta.url), "utf8")
  assert.match(ipc, /function sessionDelete\(payload\)[\s\S]*?agentHost\?\.dispose\(String\(payload\.slot\)\)/, "`session:delete` 成功链 ⇒ `dispose`（该键投影清 —— D20 数据链句）")
  const hostSrc = readFileSync(new URL("../src/main/agent-host.mjs", import.meta.url), "utf8")
  assert.match(hostSrc, /bridge\.dropScope\(key\)/, "`dispose` ⇒ 桥面 relay scope 回收（同键重开不继承陈旧 pending / queued 缓存）")
  assert.match(ipc, /"subagent:stop": subagentStop/, "白名单行在册（注册面两向 —— HANDLERS ≡ CHANNELS）")
})
