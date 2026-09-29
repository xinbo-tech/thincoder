/**
 * 2026-09-29-parity-b7-minor.test.mjs — 批次本地对拍锁（B7 · W4/E 舱：「1c 四面锁」+ 顺并两面）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = `node --test docs/batches/2026-09-29-parity-b7-minor.test.mjs`
 * （本刻暂存 `.thincoder/tmp/` 同名件（#545 写门）——两层深 ⇒ 相对 import 与终位同构；父侧 copy 收位即同命令）。
 *
 * 判据面（批档 `docs/batches/2026-09-29-parity-b7-minor.md`）：
 *   F1 relay 换接同绑定（2a · §2.2.1 1c-①）——baseline 快照（W2 `-baseline-relay.mjs`）∥ 换接后现盘：
 *      逐调用返回值序列 + webview 载荷逐字（掩码 = `startedAt` 时间戳归一——非行为面）+ 换接结构面
 *      （VSC 档取值自 rc 单源——防整档回退且行为等值）。
 *   F2 文法零依赖副本漂移锁（F6 · 1c-② · RM-4 复建）——rc `relayPathOf` / `RELAY_PREFIX_RE`
 *      ∥ 权威 core `parseRelayPath` / `RELAY_PREFIX_RE` 逐字对（含正则 `.source` 恒等）。
 *   F3 结果摘要 rc ∥ CLI 逐字对拍（1c-③）——掩码先归一，掩码外语料逐字全等（漂移即红）；
 *      掩码集 = 已登记端差（§2 修正轮 1 ② ∕ 修正轮 2 ①）：① 成功面退出状态剪除（CLI 拼 `(exit code 0)`）
 *      ② 状态位族折叠（`(exit code N≠0)` / `(killed: …)` / `(spawn failed)` ⇒ `«status»`——presence 保真、
 *      措辞归一）③ 失败面 `(empty)` 占位剪除（有状态位且末条为 `(empty)`）；④ `verify` 分支不入射程
 *      （rc 零对位——按登记差在册，射程边界显式断言）。
 *   F4 CLI `routeSubToken` ∥ rc `relayEventToSubPatch` 语义同判（2c · 1c-④）——单层令牌语料：
 *      识别集（消费判据同判）· 九类分类（token → patch 全表九行——`RENDER-CORE.md` §5）· queued 四字段可比项
 *      （kind ∥ position ∥ reason≡detail；`waiting` = rc 独有推导——列外）。嵌套面 ∥ 缺字段降级形 = 列外
 *      （CLI 独有载位 ∕ CLI 仅认五段形——不在可比集）。
 *   F5 尾块逐字（顺并面 · A 舱 W1 读数直复用）——核 `scopedRulesBlock` ∥ 前身快照（W2 `-baseline-rules-face.mjs`）
 *      byteEqual + 冻结读数 + `prepareRun` depth 门（depth0 尾块在且居末 ∥ depth1 零）。
 *   F6 rules 面（顺并面 · A 舱 W1 读数直复用）——分类三例 / JIT 命中计数 / 合并去重（核 ∥ 前身快照 + 冻结值）。
 *
 * 依赖件：`.thincoder/tmp/2026-09-29-parity-b7-w2-baseline-relay.mjs` / `-baseline-rules-face.mjs`
 * （W2 前身快照——在册；清 tmp ⇒ 装载期报错，可见非静默）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const at = (p) => new URL("../../" + p, import.meta.url)
const RS = "\x1e"

const baselineRelay = await import(at(".thincoder/tmp/2026-09-29-parity-b7-w2-baseline-relay.mjs"))
const curRelay = await import(at("thincoder-vscode/src/extension/panel-subagent-relay.mjs"))
const rc = await import(at("thincoder-render-core/subblocks/relay.mjs"))
const corePrefix = await import(at("thincoder-core/agent/relay-prefix.mjs"))
const rcSum = await import(at("thincoder-render-core/tool-summary.mjs"))
const cliSum = await import(at("thincoder-cli/src/tui/tool-summaries.mjs"))
const cliBlocks = await import(at("thincoder-cli/src/tui/subagent-blocks.mjs"))
const coreRules = await import(at("thincoder-core/rules.mjs"))
const coreSetup = await import(at("thincoder-core/agent/setup.mjs"))
const prevFace = await import(at(".thincoder/tmp/2026-09-29-parity-b7-w2-baseline-rules-face.mjs"))

// ─── F1 relay 换接同绑定（2a）──────────────────────────────────────────────

/** 语料 = W2 读数件（`2026-09-29-parity-b7-w2-readings.mjs`）步骤计划逐字移植：
 *  事件面全分支 + 嵌套剥除 + 表外 ∥ 非本面边界 + plain / sync 两面板形态 + 内容面同序列。 */
const PLAN = [
  { t: "tok", v: "eng-coder#2/⟦ev⟧async" },
  { t: "q", k: "eng-coder#2" }, // async 只入 pending
  { t: "tok", v: "eng-coder#2/[model]gpt-5" }, // started pool=true
  { t: "q", k: "eng-coder#2" }, // started 清点
  { t: "tok", v: "eng-coder#2/[model]" }, // 二次 [model]：pool=false、model=null
  { t: "tok", v: "eng-coder#2/[model]direct", panel: "sync" }, // sync 面板：registry 命中 ⇒ syncLive=true
  { t: "tok", v: "explore#1/[model]second" }, // plain 面板：syncLive=false
  { t: "tok", v: "advisor#7/⟦ev⟧queued\x1eslot\x1e2\x1e0\x1e" },
  { t: "q", k: "advisor#7" },
  { t: "tok", v: "advisor#7/⟦ev⟧queued\x1edepc\x1e1\x1e0\x1e依赖 A 舱" },
  { t: "q", k: "advisor#7" },
  { t: "tok", v: "advisor#7/⟦ev⟧queued\x1ewait\x1e3\x1e0\x1e等待中" },
  { t: "q", k: "advisor#7" },
  { t: "tok", v: "advisor#7/⟦ev⟧queued" }, // 缺字段形
  { t: "q", k: "advisor#7" },
  { t: "tok", v: "advisor#7/⟦ev⟧cancelled" }, // cancelled(was: queued) + 清点
  { t: "q", k: "advisor#7" },
  { t: "tok", v: "eng-coder#2/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e" },
  { t: "tok", v: "explore#1/⟦ev⟧async" },
  { t: "tok", v: "explore#1/[model]glm-4.6" },
  { t: "tok", v: "explore#1/⟦ev⟧settled\x1e0\x1e0\x1e" },
  { t: "tok", v: "explore#1/⟦ev⟧done" },
  { t: "tok", v: "explore#1/⟦ev⟧turn\x1e3\x1e100" },
  { t: "tok", v: "explore#1/[model]x" }, // 终态后再来 [model]：pool=false
  { t: "tok", v: "explore#1/eng-coder#2/⟦ev⟧done" }, // 嵌套剥除
  { t: "tok", v: "explore#1/eng-coder#2/[model]m" }, // 嵌套剥除（model）
  { t: "tok", v: "explore#1/eng-coder#2/nested text" }, // rest 起于文本 ⇒ false
  { t: "tok", v: "eng-coder#2/⟦ev⟧approval" }, // 表外 ⟦ev⟧：消费不泄漏
  { t: "tok", v: "eng-coder#2/⟦ev⟧" }, // 空事件名
  { t: "tok", v: "eng-coder#2/hello world" }, // false
  { t: "tok", v: "eng-coder#2/text with ⟦ev⟧ inside" }, // 字面在文本中段 ⇒ false（T-N6）
  { t: "tok", v: "eng-coder#2/read foo [model]" }, // 同族变体 ⇒ false
  { t: "tok", v: "eng-coder#2/read bar ⟦ev⟧x" }, // 同族变体 ⇒ false
  { t: "tok", v: "eng-coder#2/" }, // 空 rest ⇒ false
  { t: "tok", v: "no-relay at all" }, // false
  { t: "tok", v: "⟦ev⟧plain" }, // 无前缀 ⇒ false
  { t: "tok", v: "[model]no-prefix" }, // false
  { t: "chunk", f: "text", a: "eng-coder#2/hello world" },
  { t: "chunk", f: "text", a: "eng-coder#2/hello world" }, // 重复（payload 照发）
  { t: "chunk", f: "think", a: "advisor#7/deep thought" },
  { t: "chunk", f: "toolCall", a: "eng-coder#2/read", b: { path: "a.mjs" } },
  { t: "chunk", f: "toolCall", a: "eng-coder#2/bash", b: { command: "ls -la", workdir: "src" } },
  { t: "chunk", f: "toolCall", a: "eng-coder#2/read" }, // b 缺省
  { t: "chunk", f: "toolCall", a: "eng-coder#2/edit", b: { path: "x", payload: "z".repeat(200) } }, // >120 截断
  { t: "chunk", f: "toolOutput", a: "eng-coder#2/ls out", b: "line1\nline2" },
  { t: "chunk", f: "toolOutput", a: "eng-coder#2/obj out", b: { kind: "k", text: "from object" } },
  { t: "chunk", f: "toolResult", a: "eng-coder#2/dead face" }, // 非四面 ⇒ false
  { t: "chunk", f: "text", a: "explore#1/eng-coder#2/nested content" }, // sub 面
  { t: "chunk", f: "text", a: "no prefix here" }, // false
  { t: "chunk", f: "text", a: "eng-coder#2/hello world" }, // 三次重复
  { t: "chunk", f: "toolCall", a: "eng-coder#2/edit", b: { filePath: "b.mjs" } }, // 无 command ⇒ cmd 缺省
]

function replay(mod, steps) {
  const seen = []
  const webview = { postMessage: (p) => seen.push(p) }
  const plain = { _wvReady: true, _panel: { webview } }
  const sync = { _wvReady: true, _panel: { webview }, _agent: { _syncChildAborts: new Set(["eng-coder#2"]) } }
  const paneOf = (name) => (name === "sync" ? sync : plain)
  const results = []
  for (const s of steps) {
    if (s.t === "tok") results.push(mod.relaySubagentEventToken(paneOf(s.panel), s.v))
    else if (s.t === "q") results.push(mod.queuedInfoOf(paneOf(s.panel), s.k))
    else if (s.t === "chunk") results.push(mod.relaySubagentContentChunk(plain, s.f, s.a, s.b))
  }
  return { results, seen }
}

/** `startedAt` 掩码（时间面非行为面）；差异定位用于红时诊断。 */
const maskTs = (v) => JSON.stringify(v, (k, val) => (k === "startedAt" && typeof val === "number" ? "<ts>" : val))
function firstDiff(a, b) {
  const xs = maskTs(a).split("\n")
  const ys = maskTs(b).split("\n")
  for (let i = 0; i < Math.max(xs.length, ys.length); i++) {
    if (xs[i] !== ys[i]) return { i, base: (xs[i] ?? "").slice(0, 160), cur: (ys[i] ?? "").slice(0, 160) }
  }
  return null
}

test("F1 relay 换接同绑定（2a）：baseline ∥ rc 换接后——返回值序列 + webview 载荷逐字（掩码 = startedAt）", () => {
  const A = replay(baselineRelay, PLAN)
  const B = replay(curRelay, PLAN)
  assert.deepEqual(B.results, A.results, "逐调用返回值序列同（baseline = 换接前产者）")
  const diff = maskTs(A.seen) === maskTs(B.seen) ? null : firstDiff(A.seen, B.seen)
  assert.equal(diff, null, "webview 载荷序列逐字（掩码仅 startedAt——非行为面）")
  assert.ok(A.seen.length >= 20, `语料产出量（实测 ${A.seen.length}）`)
  const tsOk = (r) => r.seen.filter((p) => p.type === "subagent" && p.status === "started").every((p) => typeof p.startedAt === "number")
  assert.ok(tsOk(A) && tsOk(B), "startedAt = 出生时刻（number——掩码仅归一展示面）")
  // 换接结构面（2a）：VSC 事件面 ∕ 内容面取值自 rc 单源（防「整档回退为本地第二产者」——行为等值亦须单源）
  const vscSrc = readFileSync(new URL("../../thincoder-vscode/src/extension/panel-subagent-relay.mjs", import.meta.url), "utf8")
  assert.ok(/from "@thincoder\/render-core\/subblocks\/relay\.mjs"/.test(vscSrc), "换接：VSC 档取值自 rc 单源")
  assert.ok(/relayEventToSubPatch/.test(vscSrc) && /relaySubContentChunk/.test(vscSrc), "换接：事件面 ∥ 内容面两单源名在档")
})

// ─── F2 文法零依赖副本漂移锁（F6）──────────────────────────────────────────

test("F2 文法副本漂移锁（F6 · RM-4 复建）：relayPathOf ∥ 权威 parseRelayPath 逐字 + 正则 .source 恒等", () => {
  const samples = [
    "eng-coder#2/read", "coder#3/x#4/rest", "explore#1/[model]glm-5.3", "eng-designer#12/a/b/c",
    "plan#0/⟦ev⟧turn", "no-prefix", "sub:eng-coder#2", "#3/x", "coder#x/y", "coder#7/",
  ]
  for (const s of samples) {
    assert.deepEqual(rc.relayPathOf(s), corePrefix.parseRelayPath(s), `文法对拍：${JSON.stringify(s)}`)
  }
  assert.equal(rc.RELAY_PREFIX_RE.source, corePrefix.RELAY_PREFIX_RE.source, "前缀正则逐字同源（副本漂移锁——权威 = core/agent/relay-prefix.mjs）")
})

// ─── F3 结果摘要 rc ∥ CLI（掩码 = 登记端差）────────────────────────────────

/** 掩码归一（§2 修正轮 1 ② ∕ 修正轮 2 ① 判据形）：① 成功面退出状态剪除 → ③ 失败面 `(empty)` 占位剪除
 *  → ② 状态位族折叠（`«status»`——presence 保真、措辞归一）。掩码外语料逐字全等（漂移即红）。 */
function normSummary(s) {
  if (s == null) return s
  let t = String(s)
  t = t.replace(/ ?\(exit code 0\)/g, "")
  t = t.replace(/\(empty\) (?=\((?:exit code \d+|killed:|spawn failed)\))/g, "")
  t = t.replace(/\((?:exit code \d+|killed: [^)]*|spawn failed)\)/g, "«status»")
  return t
}

const ROWS = (rows) => ["### 评审", "| # | Category | Severity | Issue |", "|---|----------|----------|-------|", ...rows].join("\n")
const F3_CORPUS = [
  ["read", "Read 120 lines"], ["read", "a\nb\nc"], ["read", ""],
  ["write", "wrote 2048 bytes to x.mjs"], ["write", "created file x.mjs"], ["write", "Edited x.mjs:1"], ["write", ""],
  ["grep", "a\nb\nc"], ["grep", "only"], ["grep", ""], ["grep", "\n\n"],
  ["glob", "a.mjs\nb.mjs"], ["glob", "a.mjs"], ["glob", ""], ["glob", "\n"],
  ["bash", "[stdout]:\nboom\n\n(exit code 2)"],
  ["bash", "[stdout]:\nline1\nline2\n\n(exit code 1)"],
  ["bash", "Command failed: spawn C:\\Windows\\system32\\cmd.exe ENOENT\n[stdout]:\n(empty)\n\n(spawn failed)"],
  ["bash", "[stdout]:\nok\n\n(exit code 0)"],
  ["bash", "[stdout]:\n(empty)\n\n(exit code 1)"],
  ["bash", "[stdout]:\n(empty)\n\n(exit code 0)"],
  ["bash", ""],
  ["bash", "[stdout]:\n" + "x".repeat(140) + "\n\n(exit code 1)"],
  ["bash", "[stdout]:\nboom\n\n(killed: timeout 400ms)"],
  ["advisor", ROWS(["| 1 | Scope | 🔴 | 越禁 |", "| 2 | Clarity | 🟡 | 措辞 |", "| 3 | Style | 🔵 | 用词 |"])],
  ["advisor", ROWS(["| 1 | Clarity | 🔵 | 用词 |"])],
  ["advisor", "Advisor: design review launch refused. Ask the user to approve the design first."],
  ["advisor", "no table here at all"],
  ["mcp__foo", "first line\nsecond"], ["mcp__foo", "  \nreal first\n"], ["mcp__foo", ""],
]

test("F3 结果摘要 rc ∥ CLI：掩码归一后逐字全等（掩码 = 登记端差三面；verify 不入射程）", () => {
  // 掩码语义自证 + 判别力（掩码不吞内容位——掩码外漂移必红）
  assert.equal(normSummary("bash: boom (exit code 1)"), "bash: boom «status»", "掩码②：状态位族折叠为规范形")
  assert.equal(normSummary("bash: boom (exit code 0)"), "bash: boom", "掩码①：成功面退出状态剪除")
  assert.equal(normSummary("bash: (empty) (exit code 1)"), "bash: «status»", "掩码③：失败面 `(empty)` 占位剪除")
  assert.notEqual(normSummary("bash: boom (exit code 1)"), normSummary("bash: boom2 (exit code 1)"), "掩码不吞内容位（漂移即红）")
  for (const [name, text] of F3_CORPUS) {
    const a = rcSum.formatToolSummary(name, text)
    const b = cliSum.formatToolSummary(name, text)
    assert.equal(normSummary(b), normSummary(a), `摘要对拍（掩码后逐字）：${name} ${JSON.stringify(String(text).slice(0, 24))}`)
  }
  // 登记端差显式断言（掩码本体在册——不静默跳过，先例 = 退役 tool-summary-parity X7-8/X7-9）
  const ok = "[stdout]:\nok\n\n(exit code 0)"
  assert.equal(rcSum.formatToolSummary("bash", ok), "bash: ok", "端差①：rc 成功面不拼退出状态")
  assert.equal(cliSum.formatToolSummary("bash", ok), "bash: ok (exit code 0)", "端差①：CLI 成功面拼 `(exit code 0)`")
  const emptyFail = "[stdout]:\n(empty)\n\n(exit code 1)"
  assert.equal(rcSum.formatToolSummary("bash", emptyFail), "bash: (exit code 1)", "端差③：rc 失败面 `(empty)` 占位不入内容位")
  assert.equal(cliSum.formatToolSummary("bash", emptyFail), "bash: (empty) (exit code 1)", "端差③：CLI 占位原样入 parts")
  const emptyOk = "[stdout]:\n(empty)\n\n(exit code 0)"
  assert.equal(rcSum.formatToolSummary("bash", emptyOk), "bash: (empty)", "成功面空输出：两端掩码后同形（rc 侧）")
  assert.equal(cliSum.formatToolSummary("bash", emptyOk), "bash: (empty) (exit code 0)", "成功面空输出：CLI 拼状态（掩码①剪除后同形）")
  const spawn = "Command failed: spawn x ENOENT\n[stdout]:\n(empty)\n\n(spawn failed)"
  assert.equal(rcSum.formatToolSummary("bash", spawn), "bash: (spawn failed)", "状态位族：spawn failed（rc）")
  assert.equal(cliSum.formatToolSummary("bash", spawn), "bash: (spawn failed)", "状态位族：spawn failed（CLI 同形）")
  // verify 射程边界（登记差——rc 零对位；显式断言以在册，不静默跳过）
  const vtext = "Changed files: x.mjs\n  ✗ a.mjs:3 — syntax\n✓ Tests passed."
  assert.equal(rcSum.formatToolSummary("verify", vtext), "verify: Changed files: x.mjs", "verify：rc 落默认分支")
  assert.notEqual(cliSum.formatToolSummary("verify", vtext), rcSum.formatToolSummary("verify", vtext), "verify：CLI 分支无 rc 对位（不入逐字射程）")
})

// ─── F4 CLI routeSubToken ∥ rc relayEventToSubPatch（2c）───────────────────

const KEY4 = "eng-coder#2"

/** CLI 侧观测（受控 state：块预建 ⇒ done/stopped/cancelled 的终态效应可观测；render 为 noop）。 */
function cliObserve(tok) {
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set() }
  cliBlocks.ensureSubTaskKey(state, KEY4, "eng-coder")
  const sub = state.subTasks[KEY4]
  const consumed = cliBlocks.routeSubToken(state, tok, () => {})
  return {
    consumed, removed: state.subTasks[KEY4] === undefined, async: sub.async === true, model: sub.model ?? null,
    queued: sub.queued ? { kind: sub.queued.kind, position: sub.queued.position ?? null, detail: sub.queued.detail } : null,
    turn: sub.turn, maxTurns: sub.maxTurns, done: sub.done === true, stopped: sub.stopped === true,
    awaitingDigest: sub.awaitingDigest === true, approval: sub.approval ?? null,
    blocks: sub.blocks?.length ?? 0, frozen: state._frozenSubKeys.has(KEY4),
  }
}

/** rc 侧观测（每例一件 scope；deps = 冻结时刻 ∕ syncLive false）。 */
function rcObserve(tok) {
  const scope = rc.createRelayScope()
  const patch = rc.relayEventToSubPatch(tok, scope, { now: () => 1700000000000, syncLiveOf: () => false })
  return { patch, pending: [...scope.pendingAsync], relayToken: rc.isRelayToken(tok), contentFace: rc.relaySubContentChunk("text", tok) !== null }
}

/** 九类分类语料（单层——§5 token → patch 全表九行；rc 期望 patch 逐字 ∕ CLI 期望观测子集）。 */
const F4_EVENT = [
  { kind: "async", tok: "eng-coder#2/⟦ev⟧async", rc: null, cli: { consumed: true, async: true } },
  { kind: "async", tok: `eng-coder#2/⟦ev⟧async${RS}`, rc: null, cli: { consumed: true, async: true } },
  { kind: "model", tok: "eng-coder#2/[model]glm-5.3", rc: { status: "started", role: "eng-coder", id: 2, pool: false, model: "glm-5.3", syncLive: false }, cli: { consumed: true, model: "glm-5.3" } },
  { kind: "queued", tok: `eng-coder#2/⟦ev⟧queued${RS}slot${RS}2${RS}0${RS}`, rc: { status: "queued", role: "eng-coder", id: 2, kind: "slot", position: 2, waiting: null, reason: null }, cli: { consumed: true, queued: { kind: "slot", position: 2, detail: "" } } },
  { kind: "queued", tok: `eng-coder#2/⟦ev⟧queued${RS}wait${RS}3${RS}0${RS}waiting for: plan#7`, rc: { status: "queued", role: "eng-coder", id: 2, kind: "wait", position: 3, waiting: "waiting-deps", reason: "waiting for: plan#7" }, cli: { consumed: true, queued: { kind: "wait", position: 3, detail: "waiting for: plan#7" } } },
  { kind: "queued", tok: `eng-coder#2/⟦ev⟧queued${RS}depc${RS}1${RS}0${RS}依赖 A 舱`, rc: { status: "queued", role: "eng-coder", id: 2, kind: "depc", position: 1, waiting: "dependency-cancelled", reason: "依赖 A 舱" }, cli: { consumed: true, queued: { kind: "depc", position: 1, detail: "依赖 A 舱" } } },
  { kind: "turn", tok: `eng-coder#2/⟦ev⟧turn${RS}3${RS}100${RS}`, rc: { status: "turn", role: "eng-coder", id: 2, turn: 3, maxTurns: 100 }, cli: { consumed: true, turn: 3, maxTurns: 100 } },
  { kind: "cancelled", tok: `eng-coder#2/⟦ev⟧cancelled${RS}0${RS}0${RS}${RS}`, rc: { status: "cancelled", was: "queued", role: "eng-coder", id: 2 }, cli: { consumed: true, removed: true, frozen: true, done: false } },
  { kind: "stopped", tok: `eng-coder#2/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`, rc: { status: "cancelled", role: "eng-coder", id: 2 }, cli: { consumed: true, removed: true, frozen: true, stopped: true } },
  { kind: "settled", tok: `eng-coder#2/⟦ev⟧settled${RS}0${RS}0${RS}`, rc: { status: "settled", role: "eng-coder", id: 2 }, cli: { consumed: true, removed: false, done: true, awaitingDigest: true } },
  { kind: "done", tok: `eng-coder#2/⟦ev⟧done${RS}0${RS}0${RS}`, rc: { status: "done", role: "eng-coder", id: 2 }, cli: { consumed: true, removed: true, done: true, stopped: false } },
  { kind: "other", tok: `eng-coder#2/⟦ev⟧approval${RS}x${RS}`, rc: null, cli: { consumed: true } },
  { kind: "other", tok: "eng-coder#2/⟦ev⟧", rc: null, cli: { consumed: true } },
  { kind: "other", tok: "eng-coder#2/⟦ev⟧weird", rc: null, cli: { consumed: true } },
]

/** 边界语料（识别集同判——非九类面：内容 chunk ∥ 非 relay 面）。 */
const F4_BOUND = [
  { tok: "eng-coder#2/hello world", cli: { consumed: true, blocks: 1 } },
  { tok: "eng-coder#2/", cli: { consumed: true } },
  { tok: "eng-coder#2/text with ⟦ev⟧ inside", cli: { consumed: true, blocks: 1 } },
  { tok: "no-relay at all", cli: { consumed: false } },
  { tok: "⟦ev⟧noprefix", cli: { consumed: false } },
  { tok: "sub:eng-coder#2", cli: { consumed: false } },
]

test("F4 CLI routeSubToken ∥ rc relayEventToSubPatch（2c）：识别集 ∥ 九类分类 ∥ queued 可比项（单层）", () => {
  // ① 识别集：CLI 消费 ⇔ rc 侧消费（事件面消费 ∨ 内容面成形——两面对照消费者所见）
  for (const row of [...F4_EVENT, ...F4_BOUND]) {
    const r = rcObserve(row.tok)
    const c = cliObserve(row.tok)
    assert.equal(c.consumed, r.patch !== null || r.relayToken || r.contentFace, `识别集同判：${row.tok}`)
  }
  // ② 九类分类：rc patch 逐字（startedAt 掩去——值另断言 number）∥ CLI 观测子集
  for (const row of F4_EVENT) {
    const r = rcObserve(row.tok)
    const c = cliObserve(row.tok)
    if (row.rc === null) {
      assert.equal(r.patch, null, `rc 消费无载荷（表外 / 只入 pending）：${row.tok}`)
      assert.ok(r.relayToken, `rc 消费不泄漏（isRelayToken 真）：${row.tok}`)
    } else {
      assert.deepEqual({ ...r.patch, startedAt: undefined }, { ...row.rc, startedAt: undefined }, `rc patch 逐字：${row.tok}`)
      if (row.rc.status === "started") assert.equal(typeof r.patch.startedAt, "number", "startedAt = 出生时刻")
    }
    for (const [k, v] of Object.entries(row.cli)) assert.deepEqual(c[k], v, `CLI 观测 ${k}：${row.tok}`)
    if (row.kind === "async") assert.deepEqual(r.pending, ["eng-coder#2"], `async 只入 pending 集：${row.tok}`)
  }
  assert.deepEqual(
    [...new Set(F4_EVENT.map((r) => r.kind))].sort(),
    ["async", "cancelled", "done", "model", "other", "queued", "settled", "stopped", "turn"],
    "九类分类齐备（§5 全表九行）"
  )
  // ③ queued 四字段可比项（kind ∥ position ∥ reason≡detail；waiting = rc 独有推导——列外）
  for (const row of F4_EVENT.filter((r) => r.kind === "queued")) {
    const r = rcObserve(row.tok)
    const c = cliObserve(row.tok)
    assert.equal(c.queued.kind, r.patch.kind, `queued.kind 可比：${row.tok}`)
    assert.equal(c.queued.position, r.patch.position, `queued.position 可比：${row.tok}`)
    assert.equal(c.queued.detail ?? "", r.patch.reason ?? "", `queued.reason≡detail 可比：${row.tok}`)
  }
})

// ─── F5/F6 夹具（= A 舱 W1 读数件夹具逐字复用）─────────────────────────────

const fixtureDir = (() => {
  const dir = mkdtempSync(join(tmpdir(), "b7-w4-"))
  mkdirSync(join(dir, ".cursor", "rules"), { recursive: true })
  mkdirSync(join(dir, ".thincoder", "rules"), { recursive: true })
  writeFileSync(join(dir, ".cursor", "rules", "always.mdc"), "---\nalwaysApply: true\n---\nAlways rule body.")
  writeFileSync(join(dir, ".cursor", "rules", "no-fm.md"), "Plain body, no frontmatter.")
  writeFileSync(join(dir, ".cursor", "rules", "scoped.mdc"), '---\nglobs: "src/**"\n---\nScoped rule body.')
  writeFileSync(join(dir, ".cursor", "rules", "docs-only.mdc"), '---\nglobs: "docs/**"\n---\nDocs rule body.')
  writeFileSync(join(dir, ".cursor", "rules", "desc-only.mdc"), "---\ndescription: only desc\n---\nDesc body.")
  writeFileSync(join(dir, ".thincoder", "rules", "a.md"), '---\npattern: "a"\n---\nfile rule A')
  return dir
})()

// ─── F5 尾块逐字（顺并面）──────────────────────────────────────────────────

test("F5 尾块逐字：核 setup 侧 ∥ 前身快照 byteEqual + 冻结读数 + prepareRun depth 门", async () => {
  const agentA = {}
  const agentB = {}
  const coreBlock = coreRules.scopedRulesBlock(agentA, fixtureDir)
  const prevBlock = prevFace.scopedRulesBlock(agentB, fixtureDir)
  assert.equal(coreBlock, prevBlock, "尾块文本逐字（核 ∥ 前身快照）")
  assert.equal(coreBlock.length, 97, "冻结读数（W1 §5.2 ③：97 bytes）")
  assert.deepEqual(agentA._rules.always.map((r) => r.name).sort(), ["always", "no-fm"], "读点缓存 always（同点唯一一次目录读取）")
  assert.deepEqual(agentA._rules.scoped.map((r) => r.name).sort(), ["docs-only", "scoped"], "读点缓存 scoped")
  const mkAgent = () => ({ cwd: fixtureDir, history: [], _pendingReminders: [], config: {}, tools: [] })
  const r0 = await coreSetup.prepareRun(mkAgent(), "hello", {}, { depth: 0 })
  const r1 = await coreSetup.prepareRun(mkAgent(), "hello", {}, { depth: 1 })
  assert.ok(r0.systemPrompt.endsWith(coreBlock), "depth0：尾块居 systemPrompt 末（核 setup 侧自持）")
  assert.ok(!r1.systemPrompt.includes("Project rules (.cursor/rules):"), "depth1：子代理面无尾块（depth 门）")
})

// ─── F6 rules 面（顺并面）──────────────────────────────────────────────────

test("F6 rules 面：分类三例 ∥ JIT 命中计数 ∥ 合并去重（核 ∥ 前身快照 + 冻结值）", () => {
  // ① 分类三例（alwaysApply ∕ no-fm ∕ globs；desc-only 两集皆无）
  const rules = coreRules.loadRules(fixtureDir)
  const c = coreRules.classifyRules(rules)
  const v = prevFace.classifyRules(rules)
  const names = (arr) => arr.map((r) => r.name).sort()
  assert.deepEqual({ always: names(c.always), scoped: names(c.scoped) }, { always: ["always", "no-fm"], scoped: ["docs-only", "scoped"] }, "冻结读数（W1 §5.2 ①）")
  assert.deepEqual(names(c.always), names(v.always), "分类 always 核 ∥ 前身")
  assert.deepEqual(names(c.scoped), names(v.scoped), "分类 scoped 核 ∥ 前身")
  assert.ok(!names(c.always).includes("desc-only") && !names(c.scoped).includes("desc-only"), "desc-only 两集皆无")
  // ② JIT 命中（hit1 ∕ dup ∕ hit2 ∕ miss ∕ toolMiss）+ 注入文本
  const runJit = (mod) => {
    const agent = { cwd: fixtureDir }
    mod.scopedRulesBlock(agent, fixtureDir)
    const hist = []
    const counts = [
      mod.injectScopedRules(agent, hist, [{ tool: { name: "read" }, args: { path: "src/a.py" } }]),
      mod.injectScopedRules(agent, hist, [{ tool: { name: "read" }, args: { path: "src/a.py" } }]),
      mod.injectScopedRules(agent, hist, [{ tool: { name: "read" }, args: { path: "docs/x.md" } }]),
      mod.injectScopedRules(agent, hist, [{ tool: { name: "read" }, args: { path: "other/z.md" } }]),
      mod.injectScopedRules(agent, hist, [{ tool: { name: "bash" }, args: { command: "ls" } }]),
    ]
    return { counts, len: hist.length, contents: hist.map((m) => m.content) }
  }
  const jc = runJit(coreRules)
  assert.deepEqual(jc.counts, [1, 0, 1, 0, 0], "冻结读数（W1 §5.2 ②：hit1=1 ∕ dup=0 ∕ hit2=1 ∕ miss=0 ∕ toolMiss=0）")
  assert.deepEqual(jc, runJit(prevFace), "JIT 命中（counts + 注入文本）核 ∥ 前身")
  // ③ 合并去重（盘读 ∥ 注入缝；文件规则置前 ∕ 同 pattern 去重 ∕ 空集恒等）
  const cfg = [{ pattern: "b" }, { pattern: "c" }]
  assert.deepEqual(coreRules.mergeFileRules(cfg, fixtureDir).map((r) => r.pattern), ["a", "b", "c"], "冻结读数（W1 §5.2 ④：盘读 a,b,c——文件规则置前）")
  assert.deepEqual(coreRules.mergeFileRules(cfg, fixtureDir).map((r) => r.pattern), prevFace.mergeFileRules(cfg, fixtureDir).map((r) => r.pattern), "合并盘读核 ∥ 前身")
  const fileRules = [{ pattern: "a", message: "fa" }, { pattern: "b", message: "fb" }]
  const dedup = coreRules.mergeFileRules(cfg, fixtureDir, () => fileRules)
  assert.deepEqual(dedup.map((r) => r.pattern), ["a", "b", "c"], "注入缝去重（同 pattern 去重 ∕ 文件侧优先）")
  assert.equal(dedup[0], fileRules[0], "文件对象原样（零拷贝）")
  assert.equal(coreRules.mergeFileRules(cfg, fixtureDir, () => []), cfg, "空集恒等（原样返回）")
})
