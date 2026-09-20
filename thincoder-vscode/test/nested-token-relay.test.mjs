/**
 * nested-token-relay.test.mjs — 嵌套 token 显示面批（#137 · 批次档
 * `docs/batches/2026-09-20-nested-token-batch.md` §2）机器验收：**内层链事件不路由**
 * （产者侧嵌套守卫——`panel-subagent-relay.mjs` `relaySubagentEventToken`）。
 *
 * 复现读数 → 批档 §2.2（真模块闭路：真 relay + 真 webview `activity.js` + happy-dom 夹具）：
 * 外层 = depth-0 async spawn 的生产字面（`subagent-run.mjs:147`/`:149`）；内层 = 真装配
 * （`buildSpawnChild` sync 支）+ 真宣告（`armSyncChildAbort` 第 4 参 announce——生产形
 * `subagent.mjs:339`）+ 真前缀链（`wrapChildCallbacks`）⇒ 面板实收 `eng-coder#2/explore#1/[model]…`。
 * 判据 = §2.3（收窄判据：`nested ∧ rest 起于 ⟦ev⟧／[model]`）+ §2.6 NFR-A2 留痕（`ev:substrip`
 * 独立事件名——不并入 `ev:subdeliver` 五处置计数）。用例 = §2.4 T-N2–T-N7：修前红 = T-N2–T-N5 +
 * T-N7；T-N6 = 宽判据反例锁（今日绿——收窄口径下维持绿；实现若按 `nested` 即早退则必红——内层
 * 含字面 `[model]`／`⟦ev⟧` 的 text chunk 被整条吞掉）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import files from "./files.mjs"
import { relaySubagentEventToken, relaySubagentContentChunk, buildPanelCallbacks } from "../src/extension/panel-callbacks.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { emitRelayModel, wrapChildCallbacks } from "@thincoder/core/agent/spawn-child.mjs"
import { armSyncChildAbort } from "@thincoder/core/agent-tools/subagent.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

const RS = "\x1e"
const OUTER = "eng-coder#2/" // 外层（生产形 relay 前缀——深度 0 async spawn）
const OUTER_KEY = "eng-coder#2"
const INNER_MODEL = "explore-audit-model"
/** 外层出生帧：`⟦ev⟧async` 无 helper（生产字面 `subagent-run.mjs:147`）；`[model]` 走单源。 */
const outerAsync = (emit) => emit(OUTER + "⟦ev⟧async" + RS)
const outerModel = (emit) => emitRelayModel(emit, OUTER, "outer-model")

let _tmp, _logDir, cleanupEnv

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-nested-token-"))
  _logDir = join(_tmp, "logs")
  process.env.THINCODER_LOG_DIR = _logDir // logEvent 写门（NODE_TEST_CONTEXT 下默认跳过）
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  delete process.env.THINCODER_LOG_DIR
  cleanupEnv()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* tmp 清理失败不影响判据 */ }
})

/** 桩面板（relay 投递面最小载体：`_wvReady: true` ⇒ 直投 + posted 捕记）。 */
function stubPanel() {
  const posted = []
  const p = { _wvReady: true, _agent: null, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
  p.posted = posted
  return p
}

/** logEvent 行读取（THINCODER_LOG_DIR 隔离目录）——`ev:substrip` 痕面断言。 */
function logEvents(ev) {
  let names = []
  try { names = readdirSync(_logDir) } catch { return [] }
  const out = []
  for (const n of names) for (const line of readFileSync(join(_logDir, n), "utf8").split("\n")) {
    if (!line.trim()) continue
    try { const e = JSON.parse(line); if (!ev || e.ev === ev) out.push(e) } catch { /* 半行忽略 */ }
  }
  return out
}
const substrips = () => logEvents("ev:substrip")

/** 真链夹具（§2.2 探针骨架）：外层 = eng-coder 子代回调（`wrapChildCallbacks` 生产形），内层 =
 *  真装配（`buildSpawnChild` sync 支——只取号）+ 真宣告（`armSyncChildAbort` announce 闭包）。
 *  `emitted` = 真链终点（面板 onToken 位——本档逐帧 token 交用例驱动，不冒充 relay 已在场）。 */
function nestedChain() {
  const emitted = []
  const outerCb = wrapChildCallbacks(OUTER, { onToken: (t) => { emitted.push(String(t)) } })
  const parent = {
    cwd: "/proj", _role: "eng-coder", _touchedFiles: [], tools: [],
    provider: { name: "p", baseURL: "https://x", model: INNER_MODEL, apiKey: "k" },
    config: { agent: {} },
  }
  const ctx = { agent: parent, depth: 1, callbacks: outerCb, cwd: "/proj" }
  const built = buildSpawnChild(parent, ctx, { task: "survey the repo" }, "explore", false, [], [], null)
  const announce = () => emitRelayModel(ctx.callbacks?.onToken, built.relayPrefix, built.childProvider?.model ?? "")
  return {
    built, emitted, announce,
    emitFn: (t) => ctx.callbacks.onToken(t), // 生产发射面（`ctx.callbacks.onToken` 位）
    inner: (rest) => ctx.callbacks.onToken(built.relayPrefix + rest), // 内层事件帧（生产前缀链）
    arm: () => armSyncChildAbort(parent, built.relayPrefix.slice(0, -1), null, announce),
  }
}

/** 内层出生帧（真链产物）= arm 当场宣告恰好一帧。 */
function birthFrame() {
  const chain = nestedChain()
  chain.arm()
  assert.equal(chain.emitted.length, 1, "宣告恰一帧")
  return { chain, tok: chain.emitted[0] }
}

/** webview 真模块组（逐测冷启复位——sync-block-stop 同骨架）。 */
async function wv() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const env = { S: state.S, ctx: state.ctx, ...activity }
  env.ctx.activityEl.replaceChildren()
  env.S._subBlocks.clear()
  env.S._subDescShown = true
  return env
}
const feed = (env, payloads) => { for (const m of payloads) if (m.type === "subagent") env.applySubagentStatus(m) }

/** 真链帧 → relay 驱动（返回逐帧识别结果）：`fn` 内发射的每一帧按序过 `relaySubagentEventToken`。 */
function drive(p, chain, fn) {
  const n = chain.emitted.length
  fn()
  return chain.emitted.slice(n).map((t) => relaySubagentEventToken(p, t))
}

// ─── T-N2 嵌套出生帧剥除（真链）────────────────────────────────────

test("T-N2 嵌套出生帧剥除（真链）：零载荷 + 消费 + `ev:substrip` 一行", () => {
  const p = stubPanel()
  const { chain, tok } = birthFrame()
  assert.equal(tok, OUTER + chain.built.relayPrefix + "[model]" + INNER_MODEL, "帧逐字（真装配 + 真宣告产物）")
  const mark = substrips().length
  const before = p.posted.length
  assert.equal(relaySubagentEventToken(p, tok), true, "识别即消费（先红：发 1 条 started{pool:false, model}）")
  assert.equal(p.posted.length, before, "零载荷（先红：1 条）")
  const strip = substrips().slice(mark)
  assert.equal(strip.length, 1, "ev:substrip 恰一行（先红：零痕）")
  assert.deepEqual([strip[0].ch, strip[0].outer, strip[0].kind], ["sub:explore#1", OUTER_KEY, "model"], "痕载荷逐字")
})

// ─── T-N3 嵌套 async 不污染 pending ────────────────────────────────

test("T-N3 嵌套 async 不污染 pending：内层两帧零载荷 + 两痕；单层出生仍 pool:true", () => {
  const p = stubPanel()
  const chain = nestedChain()
  const mark = substrips().length
  outerAsync((t) => relaySubagentEventToken(p, t)) // ① 外层出生前驱（生产字面）
  assert.equal(p.posted.length, 0, "① async 帧零载荷（既有语义）")
  const results = drive(p, chain, () => {
    chain.inner("⟦ev⟧async" + RS) // ② 内层 async（生产形 subagent-run.mjs:147）
    emitRelayModel(chain.emitFn, chain.built.relayPrefix, INNER_MODEL) // ② 内层 [model]（生产形 subagent-run.mjs:149）
  })
  assert.deepEqual(results, [true, true], "② 两帧均识别并消费")
  assert.equal(p.posted.length, 0, "② 内层两帧零载荷（先红：1 条误发 started{pool:true}）")
  assert.deepEqual(substrips().slice(mark).map((e) => e.kind), ["async", "model"], "② 两痕（先红：零痕）")
  outerModel((t) => relaySubagentEventToken(p, t)) // ③ 单层出生帧 ⇒ 外层 pending 仍在位
  assert.equal(p.posted.length, 1, "全帧序唯一载荷（先红：2 条）")
  assert.deepEqual([p.posted[0].pool, p.posted[0].model], [true, "outer-model"], "外层 pending 未被内层事件吞掉（先红：false）")
})

// ─── T-N4 端到端（真 webview 闭路）────────────────────────────────

test("T-N4 端到端：外层块 pool / ⏹ / model / startedAt 不被内层出生帧改写", async () => {
  const env = await wv()
  const p = stubPanel()
  outerAsync((t) => relaySubagentEventToken(p, t))
  outerModel((t) => relaySubagentEventToken(p, t))
  feed(env, p.posted)
  const block = env.S._subBlocks.get("sub:eng-coder#2")
  const meta = block?._subMeta
  assert.equal(meta?.pool, true, "基态：外层 async 块出生（pool:true）")
  assert.ok(block.querySelector(".sub-stop-btn"), "基态：⏹ 在位（门控 running ∧ pool）")
  const seen = { model: meta.model, startedAt: meta.startedAt }
  const { tok } = birthFrame()
  const mark = p.posted.length
  assert.equal(relaySubagentEventToken(p, tok), true)
  feed(env, p.posted.slice(mark))
  assert.equal(meta.pool, true, "pool 未被翻 false（先红：内层 started 覆写）")
  assert.ok(block.querySelector(".sub-stop-btn"), "⏹ 仍在位（先红：门控失守 ⇒ 移除）")
  assert.equal(meta.model, seen.model, "model 首见值不被覆写（逐字）")
  assert.equal(meta.startedAt, seen.startedAt, "startedAt 不重置（逐字）")
})

// ─── T-N5 同族事件面（turn / queued / done）───────────────────────

test("T-N5 同族事件面：内层 turn/queued/done 不改写外层块 + 逐帧留痕", async () => {
  const env = await wv()
  const p = stubPanel()
  outerAsync((t) => relaySubagentEventToken(p, t))
  outerModel((t) => relaySubagentEventToken(p, t))
  feed(env, p.posted)
  const block = env.S._subBlocks.get("sub:eng-coder#2")
  const meta = block._subMeta
  const base = { status: meta.status, turn: meta.turn, frozen: meta.frozen }
  const chain = nestedChain()
  const mark = p.posted.length, tmark = substrips().length
  const results = drive(p, chain, () => {
    chain.inner(`⟦ev⟧turn${RS}7${RS}9${RS}llm${RS}`) // 生产形 agent.mjs:217
    chain.inner(`⟦ev⟧queued${RS}slot${RS}3${RS}queued${RS}`) // subagent-scheduler.mjs:356
    chain.inner(`⟦ev⟧done${RS}0${RS}0${RS}done${RS}`) // async-settle.mjs:275
  })
  assert.deepEqual(results, [true, true, true], "三帧均识别并消费")
  assert.equal(p.posted.length, mark, "三帧零载荷（先红：各 1 条落外层键）")
  feed(env, p.posted.slice(mark))
  assert.deepEqual({ status: meta.status, turn: meta.turn, frozen: meta.frozen }, base,
    "外层块 status/turn/frozen 零变化（先红：queued · turn 7 · frozen true）")
  assert.deepEqual(substrips().slice(tmark).map((e) => e.kind), ["turn", "queued", "done"], "逐帧 ev:substrip 痕（先红：零痕）")
})

// ─── T-N6 内容面不误吞（宽判据反例锁——评审 #1）────────────────────

test("T-N6 内容面不误吞：含字面 [model] 的内层 text chunk 仍落内容面 + 零痕", () => {
  const p = stubPanel()
  const cbs = buildPanelCallbacks(p, {})
  const tok = OUTER + "explore#1/discussing [model] tokens" // 文本 chunk（rest 不以 [model] 起头）
  const mark = substrips().length
  assert.equal(relaySubagentEventToken(p, tok), false, "事件面不认领（宽判据必红：整条被吞——内容面与主流双失）")
  assert.equal(p.posted.length, 0, "事件面零载荷")
  assert.equal(relaySubagentContentChunk(p, "text", tok), true, "内容面认领")
  const m = p.posted.at(-1)
  assert.deepEqual([m.type, m.name, m.sub, m.kind, m.text],
    ["toolPanel", "sub:eng-coder#2", "explore#1", "text", "discussing [model] tokens"], "内容面载荷逐字（D-M8 嵌套子标）")
  cbs.onToken(tok) // 真回调链同读（事件面先吃、内容面后判——panel-callbacks.mjs:139-141）
  assert.equal(p.posted.at(-1).name, "sub:eng-coder#2", "真链同路由（不落主流）")
  assert.equal(p.posted.filter((x) => x.type === "token").length, 0, "主流零命中")
  assert.equal(substrips().length, mark, "零 ev:substrip（剥除不越界）")
})

// ─── T-N7 清单登记 ───────────────────────────────────────────────

test("T-N7 清单登记：本档已登记 test/files.mjs", () => {
  assert.ok(files.includes("test/nested-token-relay.test.mjs"), "本档已登记 test/files.mjs（先红：未登记）")
})
