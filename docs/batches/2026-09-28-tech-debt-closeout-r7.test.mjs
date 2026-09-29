/**
 * 2026-09-28-tech-debt-closeout-r7.test.mjs — 批次本地单测件（轮 7 · 拆档 ∕ 尺寸 ∕ 工具清理 · eng-coder #32）。
 * 运行（仓根）：node --import ./thincoder-desktop/test/rc-resolve.mjs --test docs/batches/2026-09-28-tech-debt-closeout-r7.test.mjs
 * 覆盖：#510 拆档族（events ∕ composer ∕ core.css 三档 + 尺寸闸）· #471 产品码四项（③ dot-segment 门 ·
 * ④ 门①段界 · ⑤ host 门 · ⑥ 阈值派生）。
 * 落位说明：子代理写 `docs/batches/*.test.mjs` 被写门拒（台账 #545）⇒ 暂存 `.thincoder/tmp/`，父侧 copy 至终位。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { registerHooks } from "node:module"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..", "..") // 仓根（.thincoder/tmp 两层深）
const read = (rel) => readFileSync(join(root, rel), "utf8")
const nodeLines = (rel) => { const s = read(rel); return s.split("\n").length - (s.endsWith("\n") ? 1 : 0) }

/** electron 桩（protocol / window 两档装载面）——`protocol.handle` 捕获 handler，供门测直驱。 */
const STUB = `
export const protocol = { registerSchemesAsPrivileged: () => {}, handle: (scheme, fn) => { globalThis.__r7 = globalThis.__r7 ?? new Map(); globalThis.__r7.set(scheme, fn) } }
export const BrowserWindow = class {}
export const Menu = { buildFromTemplate: () => ({}) }
export const dialog = { showMessageBox: async () => ({ response: 1 }) }
export const nativeTheme = { shouldUseDarkColors: false }
export const net = { fetch: async () => ({ status: 0, headers: new Headers() }) }
export const shell = { openExternal: () => {} }
`
const STUB_URL = "data:text/javascript," + encodeURIComponent(STUB)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "electron") return { url: STUB_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── 尺寸闸 / 结构面（#510 ∕ #365 拆档产物）────────────────────────────────

test("size: 拆档族逐档 ≤ 300（内容行数）", () => {
  const files = [
    "thincoder-desktop/renderer/events.mjs", "thincoder-desktop/renderer/events-blocks.mjs", "thincoder-desktop/renderer/events-slices.mjs",
    "thincoder-desktop/renderer/mount-composer.mjs", "thincoder-desktop/renderer/composer-sync.mjs",
    "thincoder-desktop/renderer/core.css", "thincoder-desktop/renderer/core-markdown.css",
    "thincoder-vscode/src/agent/setup-tooltable.mjs", "thincoder-vscode/src/agent/tool-table.mjs",
  ]
  for (const file of files) {
    const n = nodeLines(file)
    assert.ok(n <= 300, `${file} = ${n} (>300)`)
  }
})

test("style: core-markdown.css 先于 core.css 链入（拆档层叠序等价）", () => {
  const html = read("thincoder-desktop/renderer/index.html")
  assert.ok(html.indexOf("./core-markdown.css") >= 0 && html.indexOf("./core-markdown.css") < html.indexOf("./core.css"))
})

// ─── #510 拆档 · events 归约面（行为）──────────────────────────────────────

test("events: 块面三径 + 切片随动 + 原引用不变式（拆档后经单出口 reduce）", async () => {
  const m = await import("../../thincoder-desktop/renderer/events.mjs")
  const base = { activeSession: "k1", blocks: [] }
  const s1 = m.reduce(base, { channel: "ev:token", key: "k1", text: "hello" })
  assert.equal(s1.blocks[0].kind, "assistant")
  assert.equal(s1.blocks[0].streaming, true)
  const s2 = m.reduce(s1, { channel: "ev:tool-call", key: "k1", id: "t1", name: "read", argsSummary: "x" })
  assert.equal(s2.blocks[1].kind, "tool")
  assert.equal(s2.blocks[1].status, "running")
  assert.equal(s2.blocks[0].streaming, false) // 段界游标清点（块面原语）
  const s3 = m.reduce(s2, { channel: "ev:tool-result", key: "k1", id: "t1", ok: true, result: "ok" })
  assert.equal(s3.blocks[1].status, "done")
  assert.equal(typeof s3.blocks[1].durationMs, "number")
  const s4 = m.reduce(s3, { channel: "ev:usage", key: "k1", ctxPct: 42, usage: { prompt_tokens: 1, completion_tokens: 2, reasoning_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0 }, timers: { count: 1, expired: 0 } })
  assert.deepEqual(s4.usage, { k1: 42 })
  assert.deepEqual(s4.tokens.k1, { prompt: 1, completion: 2, reasoningTokens: 0, cacheHit: 0, cacheMiss: 0 })
  assert.deepEqual(s4.timers.k1, { count: 1, expired: 0 })
  const s5 = m.reduce(s4, { channel: "ev:ledger", key: "k1", lines: [{ text: "L", warn: true }], detailLines: ["D"] })
  assert.deepEqual(s5.ledgerLines.k1, [{ text: "L", warn: true }])
  assert.deepEqual(s5.ledgerDetail, ["D"])
  const s6 = m.reduce(s5, { channel: "ev:goal", key: "k1", status: "active", objective: "o", criteria: "c" })
  assert.deepEqual(s6.goal.k1, { status: "active", objective: "o", criteria: "c" })
  assert.equal(m.reduce(s6, { channel: "ev:goal", key: "k1", status: "bogus" }), s6) // 表外零写
  const s7 = m.reduce(s6, { channel: "ev:activity", key: "k1", event: "stopped" })
  assert.equal(s7.blocks[1].status, "done")
  assert.equal(s7.stopMark.k1, true)
  assert.equal(s7.tabBadges.k1.includes("done"), true)
  const s8 = m.reduce(s7, { channel: "ev:unknown", key: "k1" })
  assert.equal(s8, s7) // 未知通道 ⇒ 原引用
  const foreign = m.reduce(s7, { channel: "ev:token", key: "k2", text: "x" })
  assert.equal(foreign, s7) // 键门：非活动会话零落
  // 运行中工具块 ⇒ stopped 扇扫（块面原语）
  const r1 = m.reduce(base, { channel: "ev:tool-call", key: "k1", id: "t9", name: "x" })
  const r2 = m.reduce(r1, { channel: "ev:activity", key: "k1", event: "stopped" })
  assert.equal(r2.blocks[0].status, "interrupted")
})

test("events: 导出名面不变（拆档保名——re-export 面）", async () => {
  const m = await import("../../thincoder-desktop/renderer/events.mjs")
  for (const name of ["reduce", "isTurnTail", "openSession", "clearApproval", "clearQuestion", "applyFlags", "sameRecord"]) {
    assert.equal(typeof m[name], "function", `missing export: ${name}`)
  }
})

// ─── #510 拆档 · composer 派生面（行为）────────────────────────────────────

test("composer: createComposerSync 读面 + 推送 + 候选面（桩 store，无 DOM）", async () => {
  const { createComposerSync, effortOf } = await import("../../thincoder-desktop/renderer/composer-sync.mjs")
  assert.equal(effortOf("none"), "off")
  assert.equal(effortOf(""), "auto")
  assert.equal(effortOf(undefined), "auto")
  assert.equal(effortOf("high"), "high")
  const pushed = []
  let setCalls = 0
  const held = {
    activeSession: "k1", blocks: [], pending: { k1: [{}, {}] }, sessionFlags: { k1: { planMode: true } },
    modelCandidates: { models: [{ id: "m1" }] }, sessionMeta: { k1: { provider: "p1", model: "m1", effort: "high" } },
  }
  const store = { get: () => held, set: () => { setCalls += 1 }, subscribe: () => () => {} }
  const calls = []
  const sync = createComposerSync({
    store, activeKey: () => held.activeSession, pushSubs: [], writeText: undefined,
    call: async (channel, payload) => { calls.push([channel, payload]); return { ok: true, models: [{ id: "m1", effortEnum: ["high"], thinkOff: true }] } },
    push: (message) => pushed.push(message),
    wire: { failure: () => null },
    panelOf: () => null, noticesOf: () => null, tailOf: () => null,
  })
  assert.equal(sync.state.turnState(), "idle")
  assert.deepEqual(sync.state.queue(), { count: 2 })
  assert.deepEqual(sync.state.models(), [{ id: "m1" }])
  assert.deepEqual(sync.state.flags(), { planMode: true })
  assert.equal(sync.state.workspaceRequired(), false)
  sync.primeBusy(store.get())
  sync.resetBusy()
  await sync.syncPanel(store.get()) // 无锚 / 无面板 ⇒ 零抛（挂件与忙态面早退）
  assert.ok(pushed.some((m) => m.type === "planMode" && m.active === true))
  assert.ok(pushed.some((m) => m.type === "autoApprove" && m.value === false))
  for (let i = 0; i < 50 && calls.length < 1; i += 1) await new Promise((resolve) => setTimeout(resolve, 0)) // 确定性等待（轮询到落定 —— 零单跳宏任务假设）
  assert.deepEqual(calls, [["model:list", { provider: "p1" }]])
  assert.ok(setCalls >= 1) // 候选面写切片（setModelCandidates）
  assert.ok(pushed.some((m) => m.type === "models" && m.models.length === 1 && m.prefs.reasoning === "high"), "candidate push shape (prefs projection)")
})

test("composer: attachComposer 装配冒烟（无 DOM ⇒ 槽缺早退；同步面工厂随装）", async () => {
  const { attachComposer, isComposing } = await import("../../thincoder-desktop/renderer/mount-composer.mjs")
  const errors = []
  const original = console.error
  console.error = (...parts) => errors.push(parts.map(String).join(" "))
  try {
    const app = attachComposer({ invoke: async () => ({ ok: true }) }, {})
    assert.equal(typeof app.submit, "function")
    assert.equal(typeof app.refresh, "function")
    assert.equal(app.submit("x"), false) // 无面板 ⇒ 拒（零抛）
    app.refresh() // 派生面重走（无锚 ⇒ 零抛）
    app.detach()
  } finally {
    console.error = original
  }
  assert.equal(isComposing({ isComposing: true }), true)
  assert.equal(isComposing({ keyCode: 229 }), true)
  assert.equal(isComposing({ keyCode: 13 }), false)
})

// ─── #471 产品码四项（③④⑤⑥ · protocol 门行为）─────────────────────────────

test("protocol: ⓪ host ∕ ①′ dot-segment ∕ ① 段界 ∕ ② extension 四门 + 正供面", async () => {
  const protocol = await import("../../thincoder-desktop/src/main/protocol.mjs")
  protocol.serveAppProtocol()
  const handler = globalThis.__r7.get("app")
  assert.equal(typeof handler, "function")
  const errors = []
  const original = console.error
  console.error = (...parts) => errors.push(parts.map(String).join(" "))
  try {
    const ok = await handler({ url: "app://desktop/index.html" })
    assert.equal(ok.status, 200)
    assert.match(ok.headers.get("content-type"), /text\/html/)
    const host = await handler({ url: "app://evil/index.html" })
    assert.equal(host.status, 404)
    assert.ok(errors.some((l) => l.includes("[protocol] host refused")), "⑤ host 门归属行")
    const dot = await handler({ url: "app://desktop/sub/..%2Findex.html" })
    assert.equal(dot.status, 404)
    assert.ok(errors.some((l) => l.includes("[protocol] dot-segment refused")), "③ URL 形收紧归属行")
    const escape = await handler({ url: "app://desktop/..%2Fpackage.json" })
    assert.equal(escape.status, 404)
    assert.ok(errors.some((l) => l.includes("[protocol] escape refused")), "① 逃逸门归属行")
    const boundary = await handler({ url: "app://desktop/..foo" })
    assert.equal(boundary.status, 404)
    assert.ok(!errors.some((l) => l.includes("escape refused: app://desktop/..foo")), "④ `..foo` 不得误判逃逸")
    assert.ok(errors.some((l) => l.includes("[protocol] extension refused: app://desktop/..foo")), "④ 段界后落门②")
  } finally {
    console.error = original
  }
})

test("protocol: 探针表全向量实驱（九探针 404 ∕ 200 逐项）+ blocked ≥ 负探针枚数（smoke 判据保持）", async () => {
  const protocol = await import("../../thincoder-desktop/src/main/protocol.mjs")
  const { NEGATIVE_PROBE_COUNT, probesSatisfied } = await import("../../thincoder-desktop/src/main/window.mjs")
  protocol.serveAppProtocol()
  const handler = globalThis.__r7.get("app")
  const before = protocol.protocolStats.blocked
  const original = console.error
  console.error = () => {}
  const readings = []
  try {
    // 探针表实读（单源 = window.mjs `PROBES`；此处逐项重列作夹具——改表须同改本列）
    const probes = [
      ["html", "index.html", 200, "text/html"], ["css", "theme.css", 200, "text/css"], ["rcMd", "rc/md.mjs", 200, "text/javascript"],
      ["escape", "../package.json", 404], ["escapePct", "%2e%2e/package.json", 404], ["ext", "probe.json", 404],
      ["rcEscape", "rc/..%2Fthincoder-core%2Fi18n.mjs", 404], ["escapeSrc", "..%2Fsrc%2Fmain%2Fprotocol.mjs", 404],
      ["escapeCss", "rc/..%2Fthincoder-desktop%2Frenderer%2Fcore.css", 404],
    ]
    for (const [id, path, expect, mime] of probes) {
      const res = await handler({ url: `app://desktop/${path}` })
      const got = { id, status: res.status }
      if (expect === 200) got.mime = (res.headers.get("content-type") ?? "").split(";")[0].trim()
      readings.push(got)
      assert.equal(res.status, expect, `${id} (${path})`)
    }
  } finally {
    console.error = original
  }
  assert.equal(probesSatisfied(readings), true, "逐探针读数须满探针期望表")
  const negatives = readings.filter((r) => r.status === 404).length
  assert.equal(negatives, NEGATIVE_PROBE_COUNT, "⑥ 负探针枚数派生 = 表实读")
  assert.ok(protocol.protocolStats.blocked - before >= NEGATIVE_PROBE_COUNT)
})

test("window: probesSatisfied 判据表（⑥ 阈值派生对端——表外多 / 少 / 值差三向）", async () => {
  const { probesSatisfied } = await import("../../thincoder-desktop/src/main/window.mjs")
  const good = [
    { id: "html", status: 200, mime: "text/html" }, { id: "css", status: 200, mime: "text/css" },
    { id: "rcMd", status: 200, mime: "text/javascript" }, { id: "escape", status: 404 }, { id: "escapePct", status: 404 },
    { id: "ext", status: 404 }, { id: "rcEscape", status: 404 }, { id: "escapeSrc", status: 404 }, { id: "escapeCss", status: 404 },
  ]
  assert.equal(probesSatisfied(good), true)
  assert.equal(probesSatisfied(good.slice(0, -1)), false) // 少一枚
  assert.equal(probesSatisfied(good.concat([{ id: "x", status: 404 }])), false) // 多一枚
  assert.equal(probesSatisfied(good.map((p, i) => (i === 3 ? { id: "escape", status: 200 } : p))), false) // 值差
})
