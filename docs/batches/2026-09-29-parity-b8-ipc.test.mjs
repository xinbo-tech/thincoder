/**
 * 2026-09-29-parity-b8-ipc.test.mjs — 批次本地单测件（parity-b8-ipc · A 舱 W1：宿主事件键面 A2–A6 · eng-coder）。
 * 运行（仓根）：node --import ./thincoder-desktop/test/rc-resolve.mjs --test docs/batches/2026-09-29-parity-b8-ipc.test.mjs
 * （本刻暂存 `.thincoder/tmp/2026-09-29-parity-b8-ipc.test.mjs` 同名件——两层深 ⇒ 相对 import 与终位一致；
 *  子代理写 `docs/batches/*.test.mjs` 被写门拒〔台账 #545〕——父侧 copy 至终位即运行命令同一）
 * 覆盖（设计 = `docs/batches/2026-09-29-parity-b8-ipc.md` §2.5 测试面 ①②③④⑤）：
 *   ① `CHANNELS` ⇔ `HANDLERS` 两向相等（白名单单源零副本——注册期 fail-closed 前提面）；
 *   ② `EVENT_CHANNELS` 二十三通道逐名（出站订阅白名单 · 定序）；
 *   ③ 桥出站 ∕ 载荷键面 = A2 ∕ A3 ∕ A6 新名（直驱宿主桥断言键集——A6 含容器 `usage` ∕ 五键 ∕ `ctxPct`）；
 *   ④ A1 元素形：`msg:send.images` = **严格 dataURL 串**（串入 ⇒ 落盘件出；旧对象形 ⇒ 弃项——零兼容形）；
 *   ⑤ A9 出站投影：`ev:queue.items` ∕ `queueSnapshot` = **串数组**恰形（单源单点——两出站面）。
 * 舱位 = A 舱（W1：①②③）· B 舱（W2：④⑤）；W3（A7 ∕ A8 键面——无运行时断言面）· W4（文档收正）不在本件。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..", "..") // 仓根（docs/batches 两层深；`.thincoder/tmp` 暂存期同深 ⇒ 相对面一致）
const require = createRequire(import.meta.url)
const deskUrl = (rel) => pathToFileURL(join(root, "thincoder-desktop", rel)).href
/** 核件相对面（经 desktop junction 取——与宿主同拼写同 realpath ⇒ 同一模块实例，注入缝同实例生效；拼写一致 = 前提）。 */
const coreUrl = (rel) => pathToFileURL(join(root, "thincoder-desktop", "node_modules", "@thincoder", "core", rel)).href

// ─── ① 请求面两向：白名单 ⇔ 注册表 ──────────────────────────────────────────

test("① CHANNELS ⇔ HANDLERS 两向相等（白名单单源零副本）", () => {
  const preload = require(join(root, "thincoder-desktop/src/preload/preload.cjs"))
  const channels = [...preload.CHANNELS]
  const registry = readFileSync(join(root, "thincoder-desktop/src/main/ipc-registry.mjs"), "utf8")
  const head = registry.indexOf("const HANDLERS = Object.freeze({")
  assert.ok(head >= 0, "HANDLERS 表在盘")
  const rows = [...registry.slice(head, registry.indexOf("\n})", head)).matchAll(/^\s{2}"([^"]+)":\s*([A-Za-z_$][\w$]*),/gm)]
  assert.deepEqual(rows.map((row) => row[1]).sort(), [...channels].sort(), "白名单 ↔ 注册表逐项一致（两向）")
  assert.equal(rows.length, channels.length, "两向计数相等")
  // 实读定格 = 45（39 + B10 W2 设置面四增 `provider:setKey` ∕ `delKey` ∕ `models` ∕ `setProxy` + W3 两增 `mcp:update` ∕ `mcp:reconnect` —— 定序末位；随动 = 父侧 2026-09-29）
  assert.equal(channels.length, 45, "白名单实读计数")
  assert.equal(channels[channels.length - 1], "mcp:reconnect", "定序末位")
  assert.equal(new Set(channels).size, channels.length, "白名单零重复项")
})

// ─── ② 事件面逐名：EVENT_CHANNELS 二十三通道 ────────────────────────────────

test("② EVENT_CHANNELS 二十三通道逐名（定序）", () => {
  const preload = require(join(root, "thincoder-desktop/src/preload/preload.cjs"))
  assert.deepEqual([...preload.EVENT_CHANNELS], [
    "ev:token", "ev:reasoning", "ev:activity", "ev:subagent", "ev:subchunk", "ev:tool-call", "ev:tool-output", "ev:tool-result",
    "ev:approval", "ev:question", "ev:task", "ev:susp", "ev:digest", "ev:usage", "ev:error", "ev:ledger", "ev:timer",
    "ev:queue", "ev:flags", "ev:statusText", "ev:compress", "ev:goal", "ev:config",
  ])
})

// ─── ③ 宿主事件键面：A2 ∕ A3 ∕ A6 新名（直驱宿主桥）────────────────────────

test("③ 桥出站键面 = A2 ∕ A3 ∕ A6 新名（turn ∕ maxTurns · tool-output.text · usage 容器 + 五键 + ctxPct + ctxTokens）", async () => {
  const { createAgentHost } = await import(deskUrl("src/main/agent-host.mjs"))
  const sessions = await import(coreUrl("session-slots.mjs")) // 会话目录注入缝（落盘只入本用例临时目录）
  const cwd = mkdtempSync(join(tmpdir(), "b8-w1-"))
  sessions._setSessionsDirForTest(join(cwd, "sessions"))
  const posts = []
  const agent = {
    cwd, slot: 1, key: "1", title: "T", history: [{ role: "user", content: "x".repeat(400) }],
    config: {}, provider: { model: "b8-w1-fake", context: 1 }, _slot: 1, _pendingTimers: [],
  }
  const host = createAgentHost({
    emit: (channel, payload) => posts.push({ channel, payload }),
    projects: { currentCwd: () => cwd },
    assemble: async () => agent,
    run: async (_agent, _text, callbacks) => {
      callbacks.onAgentTurn(3, 12) // A2 出站面
      callbacks.onToolOutput("read", "partial", "t-1") // A3 出站面
      callbacks.onUsage({ prompt_tokens: 11, completion_tokens: 7, completion_tokens_details: { reasoning_tokens: 2 }, prompt_cache_hit_tokens: 3, prompt_cache_miss_tokens: 4 }) // A6 累加面
    },
  })
  try {
    assert.equal((await host.send("1", "hello")).ok, true, "#841：成功回执另携 providerState")
    for (let i = 0; i < 100 && !posts.some((p) => p.channel === "ev:usage"); i += 1) await new Promise((resolve) => setImmediate(resolve))
    const pick = (channel) => posts.filter((p) => p.channel === channel)
    // A2：turn 形 = `{ turn, maxTurns }`（旧 `n` ∕ `max` 零残留；值缺省受理帧〔#597 · `turn-driver.mjs:186` 无帧值先发〕不携两键——除外）
    const turnFrames = pick("ev:activity").filter((p) => p.payload?.event === "turn")
    const turn = turnFrames.find((p) => Object.hasOwn(p.payload, "turn"))
    assert.ok(turn, "带帧值 turn 帧出场")
    assert.deepEqual(Object.keys(turn.payload).sort(), ["event", "key", "maxTurns", "turn"])
    assert.equal(turn.payload.turn, 3)
    assert.equal(turn.payload.maxTurns, 12)
    for (const frame of turnFrames) assert.ok(!("n" in frame.payload) && !("max" in frame.payload), "旧键 `n` ∕ `max` 零残留")
    // A3：`text` 键面（旧 `chunk` 零残留）
    const out = pick("ev:tool-output")[0]
    assert.ok(out, "tool-output 帧出场")
    assert.deepEqual(Object.keys(out.payload).sort(), ["id", "key", "text"])
    assert.equal(out.payload.text, "partial")
    // A6：容器 `usage` + 五键（VSC 键面）+ `ctxPct`（旧 `percent` ∕ `tokens` 零残留）+ `ctxTokens`（状态行批 #600 增——随动 2026-09-29）
    const usage = pick("ev:usage")[0]
    assert.ok(usage, "ev:usage 帧出场")
    assert.deepEqual(Object.keys(usage.payload).sort(), ["ctxPct", "ctxTokens", "key", "timers", "usage"])
    assert.ok(typeof usage.payload.ctxPct === "number" && usage.payload.ctxPct > 0, "有效读数门内")
    assert.deepEqual(Object.keys(usage.payload.usage).sort(), [
      "completion_tokens", "prompt_cache_hit_tokens", "prompt_cache_miss_tokens", "prompt_tokens", "reasoning_tokens",
    ])
    assert.deepEqual(usage.payload.usage, {
      prompt_tokens: 11, completion_tokens: 7, reasoning_tokens: 2, prompt_cache_hit_tokens: 3, prompt_cache_miss_tokens: 4,
    })
    assert.deepEqual(usage.payload.timers, { count: 0, expired: 0 })
    // 键面两端对位（出站真帧 ⇒ 真归约）：A2 回合槽 ∕ A3 工具结果 ∕ A6 三槽落位（形改义同 —— 端内槽名不随动）
    const { reduce } = await import(deskUrl("renderer/events.mjs"))
    const { initialState } = await import(deskUrl("renderer/store.mjs"))
    let state = { ...initialState(), activeSession: "1" }
    state = reduce(state, { ...turn.payload, channel: "ev:activity" })
    assert.deepEqual(state.turns["1"], { n: 3, max: 12 }, "A2 回合槽（端内名 `{ n, max }`）")
    state = reduce(state, { channel: "ev:tool-call", key: "1", id: "t-1", name: "read", argsSummary: "x" })
    state = reduce(state, { ...out.payload, channel: "ev:tool-output" })
    assert.equal(state.blocks.at(-1)?.result, "partial", "A3 结果累积")
    state = reduce(state, { ...usage.payload, channel: "ev:usage" })
    assert.equal(state.usage["1"], usage.payload.ctxPct, "A6 占用读数槽")
    assert.deepEqual(state.tokens["1"], { prompt: 11, completion: 7, reasoningTokens: 2, cacheHit: 3, cacheMiss: 4 }, "A6 令牌槽（端内名）")
  } finally {
    sessions._resetSessionsDirForTest()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── ④ ∕ ⑤（B 舱 · W2）：A1 附件元素形 · A9 队出站投影 ────────────────────────

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const VISION = "claude-sonnet-4-5" // spec.multimodal === true（落盘 ⇒ 指针段径——零降级面）
const tick = async (fn, ms = 3000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("tick timeout"); await new Promise((resolve) => setImmediate(resolve)) } return true }

test("④ A1：`images` = 严格 dataURL 串（串入 ⇒ 落盘件出；旧对象形弃——零兼容形）", async () => {
  const att = await import(deskUrl("src/main/attachments.mjs"))
  const cwd = mkdtempSync(join(tmpdir(), "b8-w2-a1-"))
  try {
    const ok = att.prepareTurnAttachments("看图", [PNG], { cwd, model: VISION, locale: "zh" })
    assert.equal(ok.paths.length, 1, "串入 ⇒ 落盘件一枚")
    assert.equal(ok.dropped, 0, "零弃项")
    assert.equal(existsSync(ok.paths[0]), true, "盘上可见（解析面直用串）")
    assert.ok(ok.paths[0].startsWith(join(cwd, ".thincoder", "tmp")), "落盘 = 项目 tmp（核件命名面）")
    assert.match(ok.text, /\[Attached images: /, "指针段入文（送达面不破）")
    const legacy = att.prepareTurnAttachments("看图", [{ name: "a.png", mime: "image/png", dataURL: PNG }], { cwd, model: VISION, locale: "zh" })
    assert.deepEqual([legacy.paths, legacy.dropped], [[], 1], "旧对象形 ⇒ 弃项（严格串——零兼容形）")
    att.cleanupTurn(ok.paths)
    assert.equal(existsSync(ok.paths[0]), false, "回合尾清理面")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("⑤ A9：两出站面（`ev:queue.items` ∕ `queueSnapshot`）串数组恰形", async () => {
  const { createTurnDriver } = await import(deskUrl("src/main/turn-driver.mjs"))
  const cwd = mkdtempSync(join(tmpdir(), "b8-w2-a9-"))
  const agent = { cwd, slot: 1, key: "1", title: "T", history: [], config: {}, provider: { model: "b8-w2-fake" }, _slot: 1, _pendingTimers: [] }
  const events = [], runs = []
  const driver = createTurnDriver({
    post: (channel, payload) => events.push({ channel, payload }),
    run: (_agent, text) => new Promise((resolve) => runs.push({ text, resolve })), // 悬挂 ⇒ 在飞（零真实回合）
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => cwd },
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
  })
  try {
    assert.deepEqual(driver.queueSnapshot("1"), [], "空队 ⇒ 空数组（键恒在场形）")
    assert.equal((await driver.send("1", "甲")).ok, true, "起跑（run 悬挂 ⇒ 在飞；#841：成功回执另携 providerState）")
    await tick(() => runs.length === 1)
    assert.deepEqual(await driver.send("1", "乙"), { ok: true, queued: true }, "在飞 ⇒ 入队（受理即推）")
    const states = events.filter((e) => e.channel === "ev:queue" && e.payload.delivered === undefined)
    assert.ok(states.length > 0, "受理帧出场（队非空 ⇒ 出站）")
    assert.deepEqual(states.at(-1).payload.items, ["乙"], "`ev:queue.items` = 串数组（A9 恰形）")
    assert.ok(states.at(-1).payload.items.every((item) => typeof item === "string"), "逐项严格串（旧对象形零残留）")
    assert.deepEqual(driver.queueSnapshot("1"), ["乙"], "`queueSnapshot` 供面同源恰形（`history:page.queue` 键）")
    // 端内两跳收官（形改义同 · 同 ③ 先例）：归约 ⇒ `pending` 切片 = 串数组 ⇒ 构树读串（零 `.text` 依赖）
    const { reduce } = await import(deskUrl("renderer/events.mjs"))
    const { initialState } = await import(deskUrl("renderer/store.mjs"))
    const { pendingGroupNode } = await import(deskUrl("renderer/views/chat-pending.mjs"))
    const mirrored = reduce({ ...initialState(), activeSession: "1" }, { ...states.at(-1).payload, channel: "ev:queue" })
    assert.deepEqual(mirrored.pending["1"], ["乙"], "端内镜面切片 = 串数组（A9 随动）")
    assert.equal(JSON.stringify(pendingGroupNode({ pending: mirrored.pending["1"] })).includes("乙"), true, "待发送组构树读串（消费端闭合）")
  } finally {
    driver.dispose("1")
    rmSync(cwd, { recursive: true, force: true })
  }
})
