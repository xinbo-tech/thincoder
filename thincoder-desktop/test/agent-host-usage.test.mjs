/**
 * agent-host-usage.test.mjs — 宿主回合尾用量读数直测（`docs/desktop/design/IPC.md` §1 `ev:usage` 行 ·
 * 批档 §2 条目 ⑦ 判据线 + KD-20；用例号 **U132 起** —— U1–U131 已占用，本档自铸续号）。
 * 纪律：真槽沙箱（tmp sessions 根 + 沙箱 cwd）+ 纯假装配 + 假 `run` + 假 `emit` ⇒ 零网 / 零 electron / 零用户目录。
 * 四条判据面：
 *   ① 回合尾有效读数 ⇒ **恰一帧** `{key,percent}`，值 = 核 `historyPercent` 投影（端侧零重算 · 0–100 整数）；
 *   ② 同点 = **落盘之后 · 终局帧之前**（done / stopped / error 三径同序）；
 *   ③ 无效读数（空史 ⇒ 0）⇒ **零帧**（禁假造读数）；④ 在飞 ⇒ 零帧（读数只在回合尾出）。
 * 可达面说明：核 `historyPercent` 恒返数字（空史 ⇒ 0）⇒「非数」臂经核不可达，本档以可达的 **0** 为无效臂；
 *   码内 `typeof percent !== "number"` 为防御性守卫，判据与渲染侧占用切片同式（`IPC.md` §1 行「有效读数」）。
 * 端不夹值（夹值 = 端侧重算，违 `IPC.md` §1「端零重算」）⇒ 窗口超限时读数 > 100 理论可达 —— 本档只验「直传 + 门」，量纲句归设计 / 显示面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { pushReal } from "@thincoder/core/context.mjs"
import { historyPercent } from "@thincoder/core/token-window.mjs"
import { createAgentHost } from "../src/main/agent-host.mjs"
import { slotPath } from "../src/main/session-slots.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const KEY = "9" // 会话键（= 槽号；键面原样入载荷）
/** `context` 以 K 计（×1024 换算单源在核 `providerSpec`）⇒ 窗口 1024 token；纯 ASCII 串按 `ceil(len/4)` 计 ⇒ 百分比可算死。 */
const PROVIDER = { name: "p1", model: "m1", context: 1 }
const ASCII = (n) => "a".repeat(n) // 400 ⇒ 100 token ⇒ 10%（800 ⇒ 20% · 1200 ⇒ 29%）

/** 纯假装配：核 `assembleFor` 的形（`agent._slot = slot`）+ 真 provider 面（读数取值所在）。 */
function fakeAgent(cwd, slot) {
  return {
    cwd, provider: { ...PROVIDER }, providers: [{ name: PROVIDER.name, model: PROVIDER.model }],
    tools: [], config: {}, history: [], _fullHistory: [], _slot: slot,
  }
}

/** 假宿主：`assemble` 注入 + 假 `emit`（收序 + **发射当场**回调 —— 盘面读数用）。 */
function makeHost(cwd, { run, onEvent } = {}) {
  const out = []
  const host = createAgentHost({
    emit: (channel, payload) => { out.push([channel, payload]); onEvent?.(channel, payload) },
    assemble: async ({ cwd: site, slot }) => fakeAgent(site, slot),
    run,
    projects: { currentCwd: () => cwd },
  })
  return { host, out }
}

const usage = (out) => out.filter(([c]) => c === "ev:usage")
const channels = (out) => out.map(([c]) => c)
const readSlot = (cwd, slot) => JSON.parse(readFileSync(slotPath(cwd, slot), "utf8"))
const tick = () => new Promise((r) => setImmediate(r)) // 结算微任务（假 `run` 已决 ⇒ `.then` 同轮排队）

// ─── U132 有效读数臂（done 径）──────────────────────────────────

test("U132: 回合尾有效读数 ⇒ 恰一帧 `{key,percent}`（值 = 核投影 · 0–100 整数 · 同点 = 落盘后终局前）", async (t) => {
  const s = useSlotSandbox(t)
  const slotAt = {}
  let seen = null
  const { host, out } = makeHost(s.cwd, {
    run: (agent) => { seen = agent; pushReal(agent, { role: "user", content: ASCII(400) }); return Promise.resolve() },
    onEvent: (channel) => { slotAt[channel] = readSlot(s.cwd, Number(KEY)) },
  })
  await host.send(KEY, "hello")
  await tick()

  const us = usage(out)
  assert.deepEqual(channels(out), ["ev:usage", "ev:activity"], "序列 = 读数帧 → 终局帧（读数紧邻终局之前）")
  assert.deepEqual(us.map(([, p]) => p), [{ key: KEY, percent: 10 }], "恰一帧 · 载荷 = `{key,percent}`（键面原样）")
  const p = us[0][1].percent
  assert.ok(Number.isInteger(p) && p >= 0 && p <= 100, `本夹具量纲 = 0–100 整数（实 ${p}）`)
  assert.equal(p, historyPercent(seen.history, seen.provider), "值 = 核 `historyPercent` 投影（端侧零重算）")
  assert.ok(slotAt["ev:usage"]?.history?.some((m) => m.content === ASCII(400)), "发射当场槽文件已含本回合增量（落盘先于读数）")
  assert.deepEqual(slotAt["ev:activity"], slotAt["ev:usage"], "终局帧仍在（零回归）∧ 读数帧 → 终局帧之间零再写（盘面在读数前已定稿）")
})

// ─── U133 三径同点 ────────────────────────────────────────────

test("U133: 三径同点（done / stopped / error 各恰一帧 · 值随本径历史 · 序 = 读数帧终局前）", async (t) => {
  const s = useSlotSandbox(t)
  const content = { done: ASCII(400), stopped: ASCII(800), errored: ASCII(1200) }
  const seen = {}
  const slotAt = {}
  const { host, out } = makeHost(s.cwd, {
    run: (agent, text, _cb, opts) => {
      seen[text] = agent
      if (text === "stopped") {
        pushReal(agent, { role: "user", content: content.stopped })
        return new Promise((_res, rej) => opts.signal.addEventListener("abort", () => rej(new Error("AbortError: aborted"))))
      }
      pushReal(agent, { role: "user", content: text === "done" ? content.done : content.errored })
      return text === "done" ? Promise.resolve() : Promise.reject(new Error("boom"))
    },
    onEvent: (channel, payload) => {
      if (payload?.key) slotAt[`${payload.key}:${channel}`] ??= readSlot(s.cwd, Number(payload.key))
    },
  })
  await host.send("1", "done")
  await host.send("2", "stopped")
  await host.send("3", "errored")
  host.interrupt("2")
  await tick()
  await tick()

  const want = [
    ["1", "ev:activity", { key: "1", event: "done" }, 10, content.done],
    ["2", "ev:activity", { key: "2", event: "stopped" }, 20, content.stopped],
    ["3", "ev:error", { key: "3", message: "boom" }, 29, content.errored],
  ]
  for (const [key, terminal, terminalPayload, percent, marker] of want) {
    const seq = out.filter(([, p]) => p?.key === key)
    assert.deepEqual(channels(seq), ["ev:usage", terminal], `${key} 径：恰一帧读数 + 终局帧（读数在前）`)
    assert.deepEqual(seq[0][1], { key, percent }, `${key} 径：值 = 本径历史读数（${percent}%）`)
    assert.deepEqual(seq[1][1], terminalPayload, `${key} 径：终局帧载荷不变（读数同点不扰终局面）`)
    assert.equal(seq[0][1].percent, historyPercent(seen[key === "1" ? "done" : key === "2" ? "stopped" : "errored"].history, PROVIDER), `${key} 径：值 = 核投影（零重算）`)
    assert.ok(slotAt[`${key}:ev:usage`]?.history?.some((m) => m.content === marker), `${key} 径：发射当场已落盘（同点 = 落盘后）`)
  }
})

// ─── U134 无效读数臂 ──────────────────────────────────────────

test("U134: 无效读数（空史 ⇒ 0）⇒ 零帧（禁假造）· 终局帧仍在", async (t) => {
  const s = useSlotSandbox(t)
  const { host, out } = makeHost(s.cwd, { run: () => Promise.resolve() }) // 本回合零历史增量
  await host.send(KEY, "empty")
  await tick()

  assert.equal(historyPercent([], PROVIDER), 0, "空史 ⇒ 核投影 0（无效读数 —— 读数与 0 的区分即在此）")
  assert.deepEqual(usage(out), [], "无效读数 ⇒ 零 `ev:usage` 帧")
  assert.deepEqual(channels(out), ["ev:activity"], "零帧 ≠ 零终局（回合面不受读数门影响）")
})

// ─── U135 在飞臂 ──────────────────────────────────────────────

test("U135: 在飞（未结算）⇒ 零帧（读数只在回合尾出 —— 非「永不发」）", async (t) => {
  const s = useSlotSandbox(t)
  let settle = null
  let seen = null
  const { host, out } = makeHost(s.cwd, {
    run: (agent) => { seen = agent; pushReal(agent, { role: "user", content: ASCII(400) }); return new Promise((r) => { settle = r }) },
  })
  await host.send(KEY, "inflight")
  await tick()

  assert.deepEqual(usage(out), [], "在飞 ⇒ 零读数帧（历史已非空 —— 非「空史」假过）")
  assert.equal(historyPercent(seen.history, PROVIDER), 10, "在飞时读数已为 10（发即 10）⇒ 零帧是**时点**判据（只在回合尾）")
  settle()
  await tick()
  assert.deepEqual(usage(out).map(([, p]) => p), [{ key: KEY, percent: 10 }], "结算后恰一帧（同笔反证上臂零帧非恒不发）")
})

// ─── U136 逐回合臂 ────────────────────────────────────────────

test("U136: 逐回合各一帧（二回合 ⇒ 恰两帧 · 值随本回合读数单调）", async (t) => {
  const s = useSlotSandbox(t)
  const { host, out } = makeHost(s.cwd, {
    run: (agent, text) => { pushReal(agent, { role: "user", content: text }); return Promise.resolve() },
  })
  await host.send(KEY, ASCII(400))
  await tick()
  await host.send(KEY, ASCII(400))
  await tick()

  assert.deepEqual(usage(out).map(([, p]) => p.percent), [10, 20], "逐回合各一帧 · 值随本回合历史（400 ⇒ 10% · 累计 800 ⇒ 20%）")
})

// ─── U137 读数域 = 工作史 ─────────────────────────────────────

test("U137: 读数域 = `agent.history`（工作史）—— 二史分歧 ⇒ 值随工作史（压缩后态）", async (t) => {
  const s = useSlotSandbox(t)
  let seen = null
  const { host, out } = makeHost(s.cwd, {
    run: (agent) => {
      seen = agent
      for (let i = 0; i < 4; i += 1) pushReal(agent, { role: "user", content: ASCII(400) })
      agent.history = agent.history.slice(0, 1) // 压缩后态：工作史收缩 / 记录史（`_fullHistory`）保留全量
      return Promise.resolve()
    },
  })
  await host.send(KEY, "compacted")
  await tick()

  assert.equal(historyPercent(seen._fullHistory, PROVIDER), 39, "对照臂：记录史 = 39%（读数若走记录史即 39）")
  assert.deepEqual(usage(out).map(([, p]) => p), [{ key: KEY, percent: 10 }], "值随工作史（压缩后 10%）—— 与核 `stats` 行同域（`historyPercent(agent.history, provider)`）")
})
