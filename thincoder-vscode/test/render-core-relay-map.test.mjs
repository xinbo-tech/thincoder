/**
 * render-core-relay-map.test.mjs — **relay 映射差分锁**（设计 `RENDER-CORE.md` §7 C2：
 * 「映射差分锁（`⟦ev⟧stopped` ⇒ `{ status: "cancelled" }` 逐字 · 闭集零 `stopped` / `error`
 * 产值——§5 全表负向）」+ §5「token → patch 全表（单源）」，机检面 = 本套件）。
 *
 * 三层锁：
 *  ① **核单源全表**（`subblocks/relay.mjs` `relayEventToSubPatch`）：逐行 token ⇒ patch 逐字
 *     （含 `⟦ev⟧stopped` ⇒ `cancelled` 不产 `stopped` 值）+ `null` 双义判据（`isRelayToken`）。
 *  ② **状态值闭集负向**：全表产值 ⊆ {started,queued,turn,done,settled,cancelled}——零
 *     `stopped` / `error`（两端**同源**：差分 = 逐 token 对拍核 patch 与扩展侧产者载荷）。
 *  ③ **跨包对拍**（R2 交接项）：VSC 扩展侧产者 `panel-subagent-relay.mjs` `relaySubagentEventToken`
 *     （现役投递面）与核单源逐 token 同产物（照 `queue-visible` T-V16-14 双写对拍形）+
 *     relay 前缀文法**零依赖副本**对拍权威 `@thincoder/core/agent/relay-prefix.mjs`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { relayEventToSubPatch, createRelayScope, isRelayToken, queuedInfoOf, relayPathOf, RELAY_PREFIX_RE } from "../node_modules/@thincoder/render-core/subblocks/relay.mjs"
import { relaySubagentEventToken } from "../src/extension/panel-subagent-relay.mjs"
import { parseRelayPath, RELAY_PREFIX_RE as AUTHORITY_RE } from "@thincoder/core/agent/relay-prefix.mjs"

const RS = "\x1e"
/** 状态值闭集（设计 §5「状态值闭集（两端同源）」）。 */
const CLOSED = ["started", "queued", "turn", "done", "settled", "cancelled"]

/** 语料（判据面同源：扩展侧真发射形 `⟦ev⟧<kind>\x1e…`）。`patch` 为核单源预期产物。 */
const CORPUS = [
  { tok: "eng-coder#2/⟦ev⟧async", patch: null, note: "只入 pending 集（随 [model] 出生）" },
  { tok: "eng-coder#2/[model]glm-5.3", patch: { status: "started", role: "eng-coder", id: 2, pool: true, model: "glm-5.3", syncLive: false }, note: "async 块恒 syncLive false / pool 真" },
  { tok: "coder#5/[model]glm-5.3", patch: { status: "started", role: "coder", id: 5, pool: false, model: "glm-5.3", syncLive: true }, note: "registry 命中 ⇒ syncLive（X10）" },
  { tok: `explore#3/⟦ev⟧queued${RS}slot${RS}2${RS}${RS}`, patch: { status: "queued", role: "explore", id: 3, kind: "slot", position: 2, waiting: null, reason: null }, note: "槽满形" },
  { tok: `explore#4/⟦ev⟧queued${RS}wait${RS}3${RS}${RS}waiting for: plan#7`, patch: { status: "queued", role: "explore", id: 4, kind: "wait", position: 3, waiting: "waiting-deps", reason: "waiting for: plan#7" } },
  { tok: `explore#6/⟦ev⟧queued${RS}depc${RS}1${RS}${RS}dependency cancelled: plan#7`, patch: { status: "queued", role: "explore", id: 6, kind: "depc", position: 1, waiting: "dependency-cancelled", reason: "dependency cancelled: plan#7" } },
  { tok: "explore#8/⟦ev⟧queued", patch: { status: "queued", role: "explore", id: 8, kind: null, position: null, waiting: "waiting-deps", reason: null }, note: "降级形（无四项载荷）" },
  { tok: `plan#9/⟦ev⟧cancelled${RS}0${RS}0${RS}${RS}`, patch: { status: "cancelled", was: "queued", role: "plan", id: 9 } },
  { tok: `coder#10/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`, patch: { status: "cancelled", role: "coder", id: 10 }, note: "C2 头条：逐字 cancelled（零 stopped 值 / 零 note）" },
  { tok: `coder#11/⟦ev⟧settled${RS}0${RS}0${RS}${RS}`, patch: { status: "settled", role: "coder", id: 11 } },
  { tok: `coder#12/⟦ev⟧done${RS}0${RS}0${RS}${RS}`, patch: { status: "done", role: "coder", id: 12 } },
  { tok: `coder#13/⟦ev⟧turn${RS}3${RS}100${RS}`, patch: { status: "turn", role: "coder", id: 13, turn: 3, maxTurns: 100 } },
  { tok: `coder#14/⟦ev⟧approval${RS}x${RS}`, patch: null, note: "表外核事件：消费不泄漏" },
  { tok: "eng-coder#2/explore#1/⟦ev⟧done", patch: null, note: "嵌套剥除不路由" },
  { tok: "plain text", patch: null, note: "非协议行" },
  { tok: "sub:eng-coder#2", patch: null, note: "非 relay 文法" },
  { tok: "⟦ev⟧async", patch: null, note: "无前缀 ⇒ 非本面" },
]

/** 扩展侧产者夹具（每例一件：pending / queued 缓存按 panel 分账——单例跨例会串味）。 */
function mkPanel() {
  const posted = []
  const panel = { _wvReady: true, _panel: { webview: { postMessage: (m) => posted.push(m) } }, _agent: { _syncChildAborts: new Set(["coder#5"]) } }
  return { panel, posted }
}

test("RM-1 核单源全表逐行：token ⇒ patch 逐字（含 `⟦ev⟧stopped` ⇒ cancelled）+ null 双义判据", () => {
  const scope = createRelayScope()
  for (const { tok, patch, note } of CORPUS) {
    const got = relayEventToSubPatch(tok, scope, { syncLiveOf: (key) => key === "coder#5", now: () => 1700000000000 })
    if (patch === null) {
      assert.equal(got, null, `null 面：${tok}${note ? `（${note}）` : ""}`)
    } else {
      assert.ok(got, `应产 patch：${tok}`)
      assert.deepEqual({ ...got, startedAt: undefined }, { ...patch, startedAt: undefined }, `patch 逐字：${tok}${note ? `（${note}）` : ""}`)
      if (got.startedAt !== undefined) assert.equal(typeof got.startedAt, "number", "startedAt = 出生时刻（可注入）")
    }
    // null 双义：本面（isRelayToken 真）∧ null ⇒ 已消费无载荷（不得原样转发）
    if (got === null) assert.equal(typeof isRelayToken(tok), "boolean", "消费判据可查")
  }
  assert.equal(isRelayToken("eng-coder#2/⟦ev⟧async"), true, "本面（含 ⟦ev⟧ 字面 ∧ relay 前缀）")
  assert.equal(isRelayToken("eng-coder#2/explore#1/⟦ev⟧done"), true, "嵌套仍属本面（剥除不路由）")
  assert.equal(isRelayToken("plain text"), false, "非本面")
  assert.equal(isRelayToken("⟦ev⟧async"), false, "无前缀 ⇒ 非本面")
})

test("RM-2 状态值闭集负向（C2）：全表产值 ∈ 闭集——零 `stopped` / `error`；queued 缓存随终态作废", () => {
  const scope = createRelayScope()
  const seen = new Set()
  const produced = []
  for (const { tok } of CORPUS) {
    const got = relayEventToSubPatch(tok, scope, { syncLiveOf: () => true })
    if (got) { seen.add(got.status); produced.push(got.status) }
  }
  for (const s of seen) assert.ok(CLOSED.includes(s), `产值 ∈ 闭集：${s}`)
  assert.ok(!seen.has("stopped"), "零 `stopped` 产值（`⟦ev⟧stopped` ⇒ cancelled——先例兼容裁定）")
  assert.ok(!seen.has("error"), "零 `error` 产值（有意收窄——错误径归宿 = stopped / done / settled）")
  assert.deepEqual([...new Set(produced)].sort(), ["cancelled", "done", "queued", "settled", "started", "turn"], "全表产值集 = 闭集全量（六值皆可达）")
  // queued 缓存：写入后可读（重生投影同形单源）；started / cancelled / 终态分支作废
  const s2 = createRelayScope()
  relayEventToSubPatch(`explore#3/⟦ev⟧queued${RS}slot${RS}2${RS}${RS}`, s2, {})
  assert.deepEqual(queuedInfoOf(s2, "explore#3"), { kind: "slot", position: 2, waiting: null, reason: null }, "queued 四项入缓存（suspension 重生投影同形）")
  relayEventToSubPatch(`explore#3/⟦ev⟧cancelled${RS}0${RS}0${RS}${RS}`, s2, {})
  assert.equal(queuedInfoOf(s2, "explore#3"), null, "出队即终态 ⇒ 缓存作废")
  // fail-closed：scope 必给（缺 scope 不静默降级）
  assert.throws(() => relayEventToSubPatch("eng-coder#2/⟦ev⟧async", null, {}), /scope required/, "缺 scope 直接报错（不静默退化）")
})

test("RM-3 跨包对拍（R2 交接项）：扩展侧产者 `relaySubagentEventToken` 与核单源逐 token 同产物", () => {
  for (const { tok, patch } of CORPUS) {
    const { panel, posted } = mkPanel()
    const consumed = relaySubagentEventToken(panel, tok)
    const corePatch = relayEventToSubPatch(tok, createRelayScope(), { syncLiveOf: (key) => key === "coder#5" })
    assert.equal(consumed, isRelayToken(tok), `消费判据同源：${tok}`)
    if (corePatch === null) {
      assert.deepEqual(posted, [], `核 null ⇒ 扩展零投递（表外 / 剥除 / 非本面）：${tok}`)
      continue
    }
    assert.equal(posted.length, 1, `核产 patch ⇒ 扩展恰一投递：${tok}`)
    const payload = { ...posted[0] }
    assert.equal(payload.type, "subagent", "投递包装 type 逐字")
    delete payload.type
    for (const [k, v] of Object.entries(corePatch)) {
      if (k === "startedAt") { assert.equal(typeof payload[k], "number", "startedAt 同面（值取时刻）"); continue }
      assert.deepEqual(payload[k], v, `字段对拍 ${k}：${tok}`)
    }
    assert.deepEqual(Object.keys(payload).sort(), Object.keys(corePatch).sort(), `键集同面：${tok}`)
  }
})

test("RM-4 relay 前缀文法跨包对拍（零依赖副本漂移锁）：核 `relayPathOf` ∥ 权威 `parseRelayPath`", () => {
  const samples = [
    "eng-coder#2/read", "coder#3/x#4/rest", "explore#1/[model]glm-5.3", "eng-designer#12/a/b/c",
    "plan#0/⟦ev⟧turn", "no-prefix", "sub:eng-coder#2", "#3/x", "coder#x/y", "coder#7/",
  ]
  for (const s of samples) {
    assert.deepEqual(relayPathOf(s), parseRelayPath(s), `文法对拍：${s}`)
  }
  assert.equal(RELAY_PREFIX_RE.source, AUTHORITY_RE.source, "前缀正则逐字同源（副本漂移锁——权威 = @thincoder/core/agent/relay-prefix.mjs）")
})
