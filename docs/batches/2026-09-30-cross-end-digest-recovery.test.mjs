/**
 * 2026-09-30-cross-end-digest-recovery.test.mjs — 批内件（跨端消化面恢复批 · 台账 #726）。
 * 状态（**2026-10-04 重锚复跑 · 台账 #824**）：K1–K7 ∥ C1a–C5 ∥ V1–V5 = **20/20 绿**（仓根 `node --test`）——V4② 随「未结轮照现」机制重锚（末页 open ⇒ label + count 两元素）。
 * 判据表 = 批档 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2 §五（核腿 ∥ CLI 腿 ∥ VSC 腿）+ §2 三.1（写缝）。
 * 腿族：
 *   核缝面（先行舱 · 已落）：K1 写缝 pushRecord（形 ∥ 序 ∥ ts ∥ 存储同点 ∥ 尾窗驱逐）∥ K2 机器线零触负控 ∥
 *     K3 尽力面（未绑 ∥ 存储失败 ∥ 载体缺位）∥ K4 读缝默认关逐字等价 + `{records:true}` opt-in；
 *   核读面 delta（本期）：K5 伪存储混录负控（role ∥ keyword ∥ tool 三面与消息-only 基线逐字等价）∥
 *     K6 空壳行形（`{ts, role:null, content:""}` ∥ since-until 随集 ∥ limit 按条目取端）∥
 *     K7 JSON 面 ∥ 索引面逐条相等（同档两路同判）；
 *   CLI 面（本期）：C1 写点三处（digest 三型 ∥ 冻结 ⇒ 记录入存储 + 机器线零新增 + 文案同值单算式）∥
 *     C2 重建（伪槽混序 ⇒ 痕行族逐字 + 位次复列 + 冻结载体合成件渲染不崩）∥ C3 跨页分裂回扫（restoreLines ∥
 *     createLoadOlder 两调用面）∥ C4 负控（记录缺 ⇒ 基线逐字等价 ∥ 未绑 ⇒ 零存储追加）∥ C5 复活双记录（在册容差）。
 *   VSC 面（VSC 舱 · 2026-10-01 落）：V1 写面三发点（真 `suspensionSession` 驱动 start/end + `postDigestCap`——
 *     活行载体含记录 ∥ 机器线零触 ∥ 记录 `ms` 与帧同值）∥ V2 出站全链（真 webview 归档 ⇒ `recordAppend`
 *     恰一次 ⇒ 真宿主处理体追加；meta 契约子集 + rows 保尾）∥ V3 读面 opt-in 真驱（`loadOlder`）+ 页级重建
 *     （痕元素 tier 两档 ∥ `dataset.n` ∥ done/failed 逐字；归档块活形 + `data-idx`；同位去重）∥ V4 负控
 *     （记录缺逐字等价 ∥ 未结轮照现〔两元素〕∥ 未归档块不重建 I-7）∥ V5 容差②（save 前/后可见性——下一落盘承接）。
 *     装载面：vscode 解析桩（temp 生成——vscode-mock 包随测试树退役的在册面）+ happy-dom（真 webview 模块）。
 * 机制单源 = `docs/core/design/SESSION.md` §6.26；CLI 承接细则 = `docs/cli/design/TUI-SESSION-VIEW.md` §6；
 * VSC 承接细则 = `docs/vsc/design/WEBVIEW.md` §5.7。
 * 跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [core, win, i18n, lifecycle, startup, drive, turnMod, freeze, segments, readHistory, conversation, ansiMod, helpers] = await Promise.all([
  mod("thincoder-core/context.mjs"), // 核写缝（`pushRecord` ∥ `pushReal`）
  mod("thincoder-core/history-window.mjs"), // 核读缝（`{ records: true }` opt-in——已备零改）
  mod("thincoder-core/i18n.mjs"), // 痕行文案单源（live ∥ 重建同调断言用）
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // 承载件（记录形 ∥ 痕行文本 ∥ 重建）
  mod("thincoder-cli/src/tui/startup.mjs"), // 读面（historyToLines 记录分支 ∥ restoreLines）
  mod("thincoder-cli/src/tui/suspension-drive.mjs"), // 写点①（digestTurn）
  mod("thincoder-cli/src/tui/agent-turn.mjs"), // 写点②（cap 分支）∥ runAgentTurn 装配面
  mod("thincoder-cli/src/tui/subagent-freeze.mjs"), // 写点③（freezeSubTaskLines）
  mod("thincoder-cli/src/tui/render-segments.mjs"), // 渲染端（合成件零改消费断言）
  mod("thincoder-core/agent-tools/read-history.mjs"), // 读面 delta 消费面
  mod("thincoder-cli/src/tui/conversation-writer.mjs"), // 真 pushLine/pushLabel 写入面
  mod("thincoder-cli/src/tui/ansi.mjs"),
  mod("thincoder-cli/node_modules/@thincoder/core/agent/helpers.mjs"), // ContinueError（cap 腿夹具）——经 CLI 侧 junction 取（盘符大小写 ⇒ ESM URL 双键；与 CLI 包解析同实例——2026-10-01 夹具收正）
])
const { pushRecord, pushReal } = core
const { historyWindow } = win
const { t } = i18n
const { ansi, C } = ansiMod
const readHistoryTool = readHistory.readHistoryTool

// ─── 记录夹具（两族形——单源 = SESSION.md §6.26）──

const startRec = () => ({ kind: "digest", status: "start", n: 2, tier: "ask", from: "upstream", msg: "问句" })
const capRec = () => ({ kind: "digest", status: "cap", mode: "stop", turns: 3 })
const endRec = () => ({ kind: "digest", status: "end", ok: true, ms: 1500 })
const subRec = () => ({
  kind: "subagent",
  meta: { key: "k1", role: "advisor", status: "done" },
  rows: [{ kind: "text", text: "行一" }, { kind: "text", text: "行二" }],
})

test("腿 K1·写缝 pushRecord：两族记录 ⇒ 人读线逐条落录（形 ∥ 序 ∥ ts）∥ 存储同点追加 ∥ 尾窗驱逐", () => {
  const appended = []
  const agent = { cwd: null, history: [], _fullHistory: [], _recordStore: { append: (r) => appended.push(r) }, _historyWindow: 0 }
  for (const r of [startRec(), capRec(), endRec(), subRec()]) pushRecord(agent, r)
  assert.equal(agent._fullHistory.length, 4, "逐条落录（序 = 追加序）")
  assert.deepEqual(
    agent._fullHistory.map((r) => (r.kind === "digest" ? r.status : r.kind)),
    ["start", "cap", "end", "subagent"],
    "形 ∥ 序",
  )
  for (const r of agent._fullHistory) assert.equal(typeof r.ts, "number", "`ts` 打点（与 pushReal 同点语义）")
  assert.equal(agent._fullHistory[0].n, 2, "起跑事实原样（`tier` ∥ `from` ∥ `msg` 随行）")
  assert.equal(agent._fullHistory[3].meta.key, "k1", "subagent 形原样（meta 零改名）")
  assert.equal(agent._fullHistory[3].rows.length, 2, "subagent rows 原样")
  assert.equal(appended.length, 4, "存储追加（`_recordStore.append` 同点）")
  assert.equal(appended[0], agent._fullHistory[0], "存储收到同一记录对象（三面同一形）")

  // 既有 `ts` 保留（打点只在缺省时——pushReal 同语义）
  const frozen = { kind: "digest", status: "end", ok: true, ms: 1, ts: 12345 }
  pushRecord(agent, frozen)
  assert.equal(frozen.ts, 12345, "既有 `ts` 不覆写")

  // 尾窗驱逐（双胞三面之三）：绑定窗口 3 ⇒ 只保最近 3 条；存储已收全量（先追加后驱逐——磁盘为准）
  const wAppended = []
  const winAgent = { history: [], _fullHistory: [], _historyWindow: 3, _recordStore: { append: (r) => wAppended.push(r) } }
  for (let i = 0; i < 5; i++) pushRecord(winAgent, { kind: "digest", status: "end", ok: true, ms: i })
  assert.equal(winAgent._fullHistory.length, 3, "绑定窗口 ⇒ 尾窗驱逐（只保最近窗口条）")
  assert.deepEqual(winAgent._fullHistory.map((r) => r.ms), [2, 3, 4], "弃最旧 ∥ 保尾")
  assert.equal(wAppended.length, 5, "被驱逐记录仍在存储（先追加后驱逐）")
})

test("腿 K2·机器线零触负控：pushRecord ⇒ `agent.history` 零新增 ∥ pushReal 正控触碰（判据可判别）", () => {
  const msg = { role: "user", content: "既有消息", ts: 1 }
  const agent = { history: [msg], _fullHistory: [msg] }
  const historyRef = agent.history
  pushRecord(agent, startRec())
  pushRecord(agent, subRec())
  assert.equal(agent.history, historyRef, "机器线数组引用零换")
  assert.equal(agent.history.length, 1, "记录不入机器线（零新增——不喂模型）")
  assert.deepEqual(agent.history, [msg], "机器线内容逐字不变")
  assert.equal(agent._fullHistory.length, 3, "人读线照常追加（对照臂）")
  // 正控（判别性）：同形直调 pushReal ⇒ 机器线 +1 —— 证明上述断言非空转
  const peer = { history: [{ ...msg }], _fullHistory: [{ ...msg }] }
  pushReal(peer, { role: "assistant", content: "新消息", ts: 2 })
  assert.equal(peer.history.length, 2, "对照：pushReal 触碰机器线（本件判据可判别）")
})

test("腿 K3·尽力面：未绑（模式 F）∥ 存储失败 ⇒ 零抛（人读线照常）；载体缺位 ⇒ 零动作（零抛）", () => {
  // 未绑：`_recordStore` 缺 ⇒ 存储腿空转，人读线照常（模式 F 零回归）
  const unbound = { history: [], _fullHistory: [] }
  assert.doesNotThrow(() => pushRecord(unbound, startRec()))
  assert.equal(unbound._fullHistory.length, 1, "未绑 ⇒ 人读线追加照常")
  assert.equal(unbound.history.length, 0, "未绑 ⇒ 机器线仍零触")
  // 存储追加失败（degraded）⇒ 不阻断（尽力面 N-S6）
  const failing = { history: [], _fullHistory: [], _recordStore: { append() { throw new Error("disk down") } } }
  assert.doesNotThrow(() => pushRecord(failing, endRec()))
  assert.equal(failing._fullHistory.length, 1, "存储失败 ⇒ 人读线照常（尽力面）")
  // 载体缺位（无活跃会话）⇒ 零动作（零抛——日志归端侧）
  assert.doesNotThrow(() => pushRecord(null, startRec()))
  assert.doesNotThrow(() => pushRecord(undefined, capRec()))
  // 载体最小形（无 `_recordStore` ∥ 无 `_historyWindow`——VSC 不绑记录存储）：零窗口驱逐 ∥ 存储腿空转
  const carrier = { _fullHistory: [], history: [] }
  for (let i = 0; i < 5; i++) pushRecord(carrier, { kind: "digest", status: "end", ok: true, ms: i })
  assert.equal(carrier._fullHistory.length, 5, "未绑窗口 ⇒ 零驱逐（全量人读线保持）")
})

test("腿 K4·读缝默认关 ⇒ 逐字等价（负控 · 承 #719）；`{ records:true }` opt-in 已备（零改直通）", () => {
  const msgA = { role: "user", content: "问题", ts: 1 }
  const msgB = { role: "assistant", content: "回答", ts: 2 }
  const msgC = { role: "user", content: "再问", ts: 3 }
  const msgD = { role: "assistant", content: "再答", ts: 4 }
  const mixed = [msgA, startRec(), msgB, subRec(), msgC, endRec(), msgD]
  // 缺 opts ∥ `{}` ∥ `{records:false}` 三径同值（默认关）
  const off = historyWindow(mixed, null, 200)
  assert.deepEqual(historyWindow(mixed, null, 200, {}), off, "空 opts 同默认径")
  assert.deepEqual(historyWindow(mixed, null, 200, { records: false }), off, "`{records:false}` 同默认径")
  // 逐字等价（负控）：默认径输出 = 同形「未知 kind 占位」输出（记录零特殊处理——改前语义）
  const spacers = [msgA, { type: "unknown-1", ts: 1 }, msgB, { type: "unknown-3", ts: 3 }, msgC, { type: "unknown-5", ts: 5 }, msgD]
  for (const [before, pageSize] of [[null, 200], [null, 3], [5, 4], [1, 2]]) {
    assert.equal(
      JSON.stringify(historyWindow(mixed, before, pageSize)),
      JSON.stringify(historyWindow(spacers, before, pageSize)),
      `默认径逐字等价（before=${before} ∥ pageSize=${pageSize}）`,
    )
  }
  // 记录零达 + 邻位计算不受记录影响
  assert.ok(off.messages.every((m) => m.kind !== "digest" && m.kind !== "subagent"), "记录零达（默认关）")
  assert.deepEqual(off.messages.map((m) => m.idx), [0, 2, 4, 6], "idx = 全局位次（记录占位不改）")
  assert.equal(off.messages[1].turnStart, true, "turnStart 跨记录回扫（记录不参与谓词）")
  // 冻结字面（小夹具——逐字面手写基线）
  assert.deepEqual(historyWindow([msgA, startRec(), msgB], null, 200).messages, [
    { kind: "user", text: "问题", timestamp: 1, idx: 0 },
    { kind: "assistant", text: "回答", reasoning: null, timestamp: 2, idx: 2, turnStart: true, tools: [] },
  ], "默认径输出字面（手写基线——逐字）")
  // opt-in 已备（读缝零改——本舱核验在位）
  const on = historyWindow(mixed, null, 200, { records: true })
  const recs = on.messages.filter((m) => m.kind === "digest" || m.kind === "subagent")
  assert.equal(recs.length, 3, "`{records:true}` ⇒ 两型记录原样入窗（占条目位）")
  assert.deepEqual(recs.map((m) => m.idx), [1, 3, 5], "记录携全局 idx（位次面）")
  assert.equal(recs[0].tier, "ask", "digest 形零改名（字段原样）")
  assert.equal(recs[1].meta.key, "k1", "subagent 形零改名（meta ∥ rows 原样）")
})

// ═══ 核读面 delta 三腿（SESSION.md §6.26 读面 delta 登记 · :981-986）═══

/** 伪存储（`_recordStore` 最小形）：`append` ∥ 方向 `iterate` ∥ 区间 `page`（真存储契约同形）。 */
function fakeStore(entries = []) {
  const appended = []
  return {
    appended,
    entries,
    append(r) { appended.push(r); return true },
    firstUserMessage: () => null,
    total: () => entries.length,
    *iterate(direction = "newest") {
      for (const m of (direction === "oldest" ? entries : [...entries].reverse())) yield m
    },
    page(start, end, { margin = 1 } = {}) {
      const lo = Math.max(0, start - margin)
      const hi = Math.min(entries.length, end + margin)
      return { messages: entries.slice(lo, hi), base: lo }
    },
  }
}

// 读面夹具：消息面（含 tool 声明 / 结果）+ 记录面（ts 落窗口内——since-until 判别用）
const RH_MSGS = [
  { role: "user", content: "第一份报告", ts: 100 },
  { role: "assistant", content: "收到一", tool_calls: [{ id: "c1", function: { name: "bash", arguments: '{"cmd":"ls"}' } }], ts: 200 },
  { role: "tool", name: "bash", tool_call_id: "c1", content: "ok一", ts: 300 },
  { role: "user", content: "第二份报告", ts: 400 },
]
const RH_RECS = [
  { kind: "digest", status: "start", n: 1, tier: "digest", ts: 150 },
  { kind: "digest", status: "end", ok: true, ms: 900, ts: 350 },
  { kind: "subagent", meta: { key: "coder#1", role: "eng-coder", status: "done" }, rows: [{ kind: "text", text: "报告正文（rows——非 content）" }], ts: 450 },
]
const RH_MIXED = [RH_MSGS[0], RH_RECS[0], RH_MSGS[1], RH_MSGS[2], RH_RECS[1], RH_MSGS[3], RH_RECS[2]]
const rhCtx = (entries) => ({ agent: { cwd: process.cwd(), _recordStore: fakeStore(entries) } })

test("腿 K5·读面 delta ①·伪存储混录负控：role ∥ keyword ∥ tool 三面 ⇒ 与消息-only 基线逐字等价", () => {
  const baseline = rhCtx(RH_MSGS)
  const mixed = rhCtx(RH_MIXED)
  for (const args of [
    { role: "user" },
    { role: "assistant" },
    { role: "tool" },
    { keyword: "报告" },
    { keyword: "收到" },
    { tool: "bash" },
    { role: "user", keyword: "报告" },
    { role: "tool", tool: "bash", keyword: "ok" },
  ]) {
    assert.equal(
      readHistoryTool.execute(args, mixed),
      readHistoryTool.execute(args, baseline),
      `检索面逐字等价（${JSON.stringify(args)}）`,
    )
  }
  // 记录不冒充任何过滤面命中：keyword「报告」的两路结果均 = 两条 user 消息
  const hits = JSON.parse(readHistoryTool.execute({ keyword: "报告" }, mixed))
  assert.deepEqual(hits.map((e) => e.ts), [100, 400], "keyword 零命中记录（记录无 content）")
})

test("腿 K6·读面 delta ②·空壳行形：记录随集（无滤 ∥ since-until）⇒ `{ts, role:null, content:\"\"}`；limit 按条目取端", () => {
  const ctx = rhCtx(RH_MIXED)
  const all = JSON.parse(readHistoryTool.execute({}, ctx))
  assert.equal(all.length, RH_MIXED.length, "无滤 ⇒ 全条目（记录占条目位）")
  const shells = all.filter((e) => e.role === null)
  assert.equal(shells.length, 3, "三记录 ⇒ 三空壳")
  for (const e of shells) {
    assert.deepEqual(Object.keys(e).sort(), ["content", "role", "ts"], "行形 = {ts, role:null, content:\"\"}（键零增）")
    assert.equal(e.content, "", "content 空壳如实")
    assert.equal(typeof e.ts, "number", "ts 随记录（写缝打点）")
  }
  assert.deepEqual(shells.map((e) => e.ts), [150, 350, 450], "记录序 = 位次序")
  // 无滤下非记录条目与消息-only 逐字等价（记录零副作用）
  assert.deepEqual(all.filter((e) => e.role !== null), JSON.parse(readHistoryTool.execute({}, rhCtx(RH_MSGS))), "非记录条目逐字等价")
  // since-until：记录携 ts ⇒ 随集（窗口按 ts 判——消息同口径）
  const win = JSON.parse(readHistoryTool.execute({ since: 340, until: 460 }, ctx))
  assert.deepEqual(win.map((e) => e.ts), [350, 400, 450], "窗口 [340,460] ⇒ 记录 350/450 + 消息 400")
  assert.equal(win[0].role, null, "记录在窗内以空壳在场")
  // limit 窗口按条目取端（记录占条目位）
  const last = JSON.parse(readHistoryTool.execute({ limit: 1, direction: "newest" }, ctx))
  assert.deepEqual(last, [{ ts: 450, role: null, content: "" }], "末条目 = 记录 ⇒ 单空壳（占位计数）")
})

test("腿 K7·读面 delta ③：JSON 面 ∥ 索引面逐条相等（同档两路同判）", async () => {
  const idx = await mod("thincoder-core/session-index.mjs")
  const dir = mkdtempSync(join(tmpdir(), "tc-rec-index-"))
  const sessionsDir = join(dir, "sessions")
  const dbDir = join(dir, "db")
  mkdirSync(sessionsDir, { recursive: true })
  mkdirSync(dbDir, { recursive: true })
  idx._setSessionIndexDirForTest(dbDir)
  try {
    const file = join(sessionsDir, `${"a".repeat(40)}.json.1`)
    const history = [
      { role: "user", content: "线索：报告", ts: 100 },
      { kind: "digest", status: "start", n: 1, tier: "digest", ts: 150 },
      { role: "assistant", content: "收到", ts: 200 },
      { kind: "subagent", meta: { key: "coder#1", role: "eng-coder", status: "done" }, rows: [{ kind: "text", text: "正文" }], ts: 250 },
      { role: "user", content: "再问", ts: 300 },
    ]
    writeFileSync(file, JSON.stringify({ version: 2, cwd: dir, history }), "utf8")
    const ctx = { agent: { cwd: dir } }
    // ① JSON 面：无段档 ⇒ 索引未命中 ⇒ 回落 JSON 读（`querySessionFile`）
    const jsonFace = await readHistoryTool.execute({ path: file }, ctx)
    // ② 索引面：同内容落段档 ⇒ 懒保证索引 ⇒ SQL 面
    mkdirSync(`${file}.d`, { recursive: true })
    writeFileSync(join(`${file}.d`, "seg-000001.jsonl"), history.map((m) => JSON.stringify(m)).join("\n") + "\n", "utf8")
    const indexFace = await readHistoryTool.execute({ path: file }, ctx)
    const a = JSON.parse(jsonFace)
    const b = JSON.parse(indexFace)
    assert.equal(a.length, history.length, "夹具口径：全条目（含记录）")
    assert.deepEqual(b, a, "索引面 ∥ JSON 面逐条相等（两路同判——记录混入后保持）")
    assert.equal(b[1].role, null, "记录占行（索引面同判——role null）")
    assert.equal(b[1].content, "", "记录占行（content 空）")
    // FTS / 词元面：记录零词元（空 content ⇒ 跨会话检索零命中）
    const allFace = JSON.parse(await readHistoryTool.execute({ path: "all", keyword: "正文" }, ctx))
    assert.deepEqual(allFace, [], "FTS：记录 rows 不入词元面（零命中——\u00a76.26:983）")
  } finally {
    idx._resetSessionIndexDirForTest()
    idx.removeIndexFiles(join(dbDir, "session-index.db"))
    rmSync(dir, { recursive: true, force: true })
  }
})

// ═══ CLI 面腿（写点三处 ∥ 重建 ∥ 跨页 ∥ 负控 ∥ 复活容差）═══

/** TUI state 最小形（写入 ∥ 恢复面所需字段——真装配面字段子集）。 */
function tuiState() {
  return {
    lines: [], _linesChars: 0, _lineIdCounter: 0, _historyLoaded: 0, _historyTotal: 0, _hasOlder: false, scroll: 0,
    processing: false, status: "Ready", exitArmed: false, streaming: "", reasoning: "",
    _advisorBlocks: [], currentTool: null, processingStarted: 0, lastOutputAt: 0,
    _turnControllers: [], controller: null, interruptPrompt: null, attentionAwaiting: false,
    subTasks: {}, tasks: [], queue: [], pendingInput: [],
    suspended: false, _suspPending: false, _suspAborted: false,
    foldEnabled: true, expandedBlocks: new Set(), _foldScroll: new Map(),
    dims: { get: () => ({ cols: 80, rows: 24 }) },
    _agent: null,
  }
}

/** agent 最小形（写缝载体：`_fullHistory` 人读线 ∥ `_recordStore` 伪存储）。 */
function fakeAgent(over = {}) {
  const store = over._recordStore === undefined ? fakeStore() : over._recordStore
  return {
    cwd: "C:/fake", title: "t", autoApprove: true,
    history: [], _fullHistory: [], _historyWindow: 0,
    _recordStore: store,
    _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
    _pendingDistill: null, _sessionAbort: null, _sessionAbortAll: null,
    ...over,
  }
}

/** 回合 ctx 最小形（digestTurn ∥ runAgentTurn 直驱——真 conversation-writer 写入面）。 */
function turnFixture({ agent = fakeAgent(), state = tuiState(), runAgent = async () => {} } = {}) {
  const render = () => {}
  const writer = conversation.createConversationWriter({ state, render })
  const ctx = {
    agent, state, render, scheduleRender: render,
    pushLine: writer.pushLine, pushLabel: writer.pushLabel, ensureAssistantLabel: writer.ensureAssistantLabel,
    handleSlash: async () => {}, saveSession: () => {}, runAgent, distillFlushTimeoutMs: 1,
    askPermission: null, askBatchPermission: null, askQuestion: null,
  }
  return { ctx, agent, state }
}

test("腿 C1a·写点①（digestTurn）：起跑 ∥ 收尾 ⇒ 记录入存储（形 ∥ 序 ∥ ts）+ 文案同值单算式 + 机器线零新增", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore" }, { role: "eng-coder" }] // pend0 = 2
  await drive.digestTurn(ctx, false)
  const recs = agent._recordStore.appended
  assert.equal(recs.length, 2, "起跑 ∥ 收尾两记录入存储（同点追加）")
  assert.equal(recs[0].kind, "digest")
  assert.equal(recs[0].status, "start")
  assert.equal(recs[0].n, 2)
  assert.equal(recs[0].tier, "digest")
  assert.equal(typeof recs[0].ts, "number", "`ts` 打点（核写缝）")
  assert.equal(recs[1].status, "end")
  assert.equal(recs[1].ok, true)
  assert.equal(typeof recs[1].ms, "number")
  assert.deepEqual(agent._fullHistory.map((r) => r.status), ["start", "end"], "人读线同点追加（序）")
  assert.equal(agent.history.length, 0, "机器线零新增（弃数组承接）")
  const texts = state.lines.map((l) => l.text)
  assert.equal(state.lines.length, 3, "可见行 = 标签 + 计数 + 终态（零增）")
  assert.ok(texts.includes(t("digest.turnLabel")), "起跑标签行（tier=digest 档）")
  assert.ok(texts.includes(t("digest.start", { n: 2 })), "起跑计数行")
  assert.ok(
    texts.includes(t("digest.done", { n: 2, seconds: (recs[1].ms / 1000).toFixed(1) })),
    "终态行：记录 `ms` 与行文案 `seconds` 同值单算式",
  )
  // 零待消化（n=0）：活流既有门（只标签行）——两记录照旧入存储
  const b = turnFixture()
  await drive.digestTurn(b.ctx, false)
  assert.deepEqual(b.agent._recordStore.appended.map((r) => r.status), ["start", "end"], "n=0 ⇒ 记录照旧两级")
  assert.equal(b.agent._recordStore.appended[0].n, 0)
  assert.equal(b.state.lines.length, 1, "n=0 ⇒ 只标签行（活流同门——计数/终态行零产）")
  // upstream ∥ ask 两档（tier="ask" + from/msg 随记录 ∥ 标签文案两档）
  const c = turnFixture()
  c.agent._pendingAsyncResults = [{}]
  c.agent._childUpstream = [{ seq: 1, from: "eng-designer#8", kind: "ask", message: "请复核" }]
  await drive.digestTurn(c.ctx, true)
  const askRec = c.agent._recordStore.appended[0]
  assert.equal(askRec.tier, "ask")
  assert.equal(askRec.from, "eng-designer#8", "from 随记录（tier 两档之 ask 档）")
  assert.equal(askRec.msg, "请复核")
  assert.ok(c.state.lines.some((l) => l.text === t("digest.turnLabelAsk", { from: "eng-designer#8", msg: "请复核" })), "ask 标签行逐字")
})

test("腿 C1b·写点②（cap 分支）：撞帽 ⇒ cap 记录入存储（形 ∥ ts）+ 可见行同点 + 机器线零新增", async () => {
  const { ctx, agent, state } = turnFixture({ runAgent: async () => { throw new helpers.ContinueError(3) } })
  const outcome = await turnMod.runAgentTurn(ctx, "", { autoTurn: true, skipSession: true })
  assert.equal(outcome, "stopped", "撞帽无人值守档 ⇒ 收口（不静默自续）")
  const recs = agent._recordStore.appended
  assert.equal(recs.length, 1)
  assert.deepEqual(
    { kind: recs[0].kind, status: recs[0].status, mode: recs[0].mode, turns: recs[0].turns },
    { kind: "digest", status: "cap", mode: "stop", turns: 3 },
    "cap 记录形（逐字）",
  )
  assert.equal(typeof recs[0].ts, "number")
  assert.ok(state.lines.some((l) => l.text === t("digest.capStop", { turns: 3 }) && l.color === C.warn), "cap 可见行（同点 ∥ C.warn）")
  assert.equal(agent.history.length, 0, "机器线零新增")
})

test("腿 C1c·写点③（冻结）：freezeSubTaskLines ⇒ subagent 记录（meta/rows）同点入存储；rows 保尾 ≤500", () => {
  const agent = fakeAgent()
  const state = tuiState()
  state._agent = agent
  const sub = {
    key: "coder#1", role: "eng-coder", model: "m1", started: 1000, done: true, doneAt: 2500,
    turn: 2, maxTurns: 5, stopped: false, lastError: null, dropped: 0,
    blocks: [{ kind: "text", text: "行一" }, { kind: "text", text: "行二" }], children: [],
  }
  freeze.freezeSubTaskLines(state, sub)
  const rec = agent._recordStore.appended[0]
  assert.equal(rec.kind, "subagent")
  assert.deepEqual(rec.meta, {
    key: "sub:coder#1", role: "eng-coder", model: "m1", startedAt: 1000, doneAt: 2500, turn: 2, maxTurns: 5, status: "done", pool: false,
  }, "meta = 冻结时点块头事实（形逐字）")
  assert.deepEqual(rec.rows, [{ kind: "text", text: "行一" }, { kind: "text", text: "行二" }], "rows = 块内容行集（{kind,text}）")
  assert.equal(typeof rec.ts, "number")
  const carrier = state.lines.find((l) => l._frozenSubTask)
  assert.equal(carrier.text, "subagent activity: coder#1", "冻结载体行（与记录同点）")
  assert.equal(carrier._frozenSubTask, sub, "载体行持活块对象（渲染端零改）")
  assert.equal(agent.history.length, 0, "机器线零新增")
  // status 三档映射：stopped ⇒ "stopped" ∥ lastError 在场 ⇒ "error"（+ meta.error）∥ 其余 "done"
  assert.equal(lifecycle.subagentRecord({ key: "k", role: "r", started: 1, doneAt: 2, stopped: true, blocks: [] }).meta.status, "stopped")
  const err = lifecycle.subagentRecord({ key: "k", role: "r", started: 1, doneAt: 2, stopped: false, lastError: "interrupted", blocks: [] })
  assert.equal(err.meta.status, "error")
  assert.equal(err.meta.error, "interrupted", "error 文本随 meta（§6.26 meta `error?`）")
  // rows 保尾上界（§6.26 有界保尾）：501 行 ⇒ 弃最旧 1 行 + 前置省略标记行（标记不占额度）
  const many = lifecycle.subagentRecord({
    key: "k", role: "r", started: 1, doneAt: 2,
    blocks: Array.from({ length: 501 }, (_, i) => ({ kind: "text", text: `l${i}` })),
  })
  assert.equal(many.rows.length, 501, "1 标记 + 500 内容（显示行 ≤ 500——标记不占额度）")
  assert.deepEqual(many.rows[0], { kind: "meta", text: "… [rows truncated: 1 lines omitted]" })
  assert.equal(many.rows[1].text, "l1", "弃最旧（保尾）")
  // 既有 trim 标记行随行携带（行集条目形 = {kind,text}——内部标记不外泄）
  const withMarker = lifecycle.subagentRecord({
    key: "k", role: "r", started: 1, doneAt: 2, dropped: 5,
    blocks: [{ kind: "meta", text: "…（已省略 5 行）", _trimMarker: true }, { kind: "text", text: "尾行" }],
  })
  assert.deepEqual(withMarker.rows, [
    { kind: "meta", text: "…（已省略 5 行）" },
    { kind: "text", text: "尾行" },
  ], "省略标记行随行集（行数真值）∥ 内部字段不入记录")
})

test("腿 C2·重建：伪槽混序 ⇒ 痕行族逐字（tier 两档 ∥ count ∥ cap ∥ done/aborted ∥ 位次复列）+ 冻结载体（合成件渲染不崩）", () => {
  const state = tuiState()
  state._agent = fakeAgent()
  const H = [
    { role: "user", content: "问题一", ts: 1 },
    { kind: "digest", status: "start", n: 2, tier: "ask", from: "eng-designer#8", msg: "请复核", ts: 2 },
    { role: "assistant", content: "回答一", ts: 3 },
    { kind: "digest", status: "cap", mode: "stop", turns: 3, ts: 4 },
    { kind: "digest", status: "end", ok: false, ms: 2300, ts: 5 },
    {
      kind: "subagent", ts: 6,
      meta: { key: "coder#1", role: "eng-coder", model: "m1", startedAt: 1000, doneAt: 2500, turn: 2, maxTurns: 5, status: "done" },
      rows: [{ kind: "text", text: "行一" }, { kind: "text", text: "行二" }],
    },
    { role: "user", content: "问题二", ts: 7 },
    { kind: "digest", status: "start", n: 1, tier: "digest", ts: 8 },
    { kind: "digest", status: "end", ok: true, ms: 1500, ts: 9 },
  ]
  startup.restoreLines(state, { history: H, total: H.length, base: 0 })
  const texts = state.lines.map((l) => l.text)
  const idxOf = (s) => texts.indexOf(s)
  const askLabel = t("digest.turnLabelAsk", { from: "eng-designer#8", msg: "请复核" })
  assert.ok(texts.includes(askLabel), "ask 标签行（tier 两档之 ask）")
  assert.ok(texts.includes(t("digest.turnLabel")), "digest 标签行（tier 两档之 digest）")
  assert.ok(texts.includes(t("digest.start", { n: 2 })), "起跑计数行")
  assert.ok(texts.includes(t("digest.capStop", { turns: 3 })), "cap 行")
  assert.ok(texts.includes(t("digest.aborted", { n: 2, seconds: "2.3" })), "aborted 终态行（n 页内直用 ∥ seconds 同算式）")
  assert.ok(texts.includes(t("digest.start", { n: 1 })), "第二轮起跑计数行")
  assert.ok(texts.includes(t("digest.done", { n: 1, seconds: "1.5" })), "done 终态行")
  // 位次复列（记录按其全局位次重建——行入流与内容同生态）
  assert.ok(idxOf(askLabel) > idxOf("问题一") && idxOf(askLabel) < idxOf("回答一"), "ask 痕行位次（问题一 之后 ∥ 回答一 之前）")
  assert.ok(idxOf(t("digest.aborted", { n: 2, seconds: "2.3" })) < idxOf("问题二"), "aborted 位次（问题二 之前）")
  assert.ok(idxOf(t("digest.done", { n: 1, seconds: "1.5" })) > idxOf("问题二"), "done 位次（问题二 之后）")
  const capLine = state.lines.find((l) => l.text === t("digest.capStop", { turns: 3 }))
  assert.equal(capLine.color, C.warn, "cap 行色 C.warn（与活流同）")
  // 冻结载体 + 合成件（渲染端零改消费）
  const carrier = state.lines.find((l) => l._frozenSubTask)
  assert.equal(carrier.text, "subagent activity: coder#1")
  assert.equal(carrier.color, C.dim)
  const synth = carrier._frozenSubTask
  assert.equal(synth.done, true)
  assert.equal(synth.stopped, false)
  assert.equal(synth.key, "coder#1")
  assert.equal(synth.started, 1000, "started ← meta.startedAt（折叠头 elapsed 同源）")
  assert.deepEqual(synth.blocks, [{ kind: "text", text: "行一" }, { kind: "text", text: "行二" }])
  assert.equal(synth._charCount, "行一".length + "行二".length, "_charCount = 行集字符和（账实一致）")
  const rows = segments.frozenSubSeg(state, carrier, state.lines.indexOf(carrier), 80, 24)
  assert.ok(Array.isArray(rows) && rows.length > 0, "合成件渲染不崩（真渲染端）")
  const joined = rows.map((r) => r.text).join("\n")
  assert.ok(joined.includes("coder#1"), "折叠头含 key")
  assert.ok(joined.includes("done"), "折叠头态词")
})

test("腿 C3·跨页分裂：end 页缺 start ⇒ 终态行在且 n 正确（存储回扫——容差①于 CLI 不成立）", () => {
  const H3 = [
    { kind: "digest", status: "start", n: 4, tier: "digest", ts: 1 },
    { role: "user", content: "更早", ts: 2 },
    ...Array.from({ length: 19 }, (_, i) => ({ role: "assistant", content: `填充${i}`, ts: 10 + i })),
    { kind: "digest", status: "end", ok: true, ms: 1500, ts: 99 },
    { role: "assistant", content: "尾", ts: 100 },
  ]
  const window = H3.slice(3)
  assert.ok(!window.some((r) => r.kind === "digest" && r.status === "start"), "夹具：页内（含回扫前）无本轮 start")
  // ① 有存储读口 ⇒ 回扫补齐 `n`
  const state = tuiState()
  state._agent = fakeAgent({ _recordStore: fakeStore(H3) })
  startup.restoreLines(state, { history: window, total: H3.length, base: 3 })
  const texts = state.lines.map((l) => l.text)
  assert.ok(texts.includes(t("digest.done", { n: 4, seconds: "1.5" })), "终态行在且 n 正确（回扫命中页外 start）")
  // ② 无存储读口（模式 F 型页）⇒ 终态行零产（fail-soft——页内本轮 start 确缺）
  const state2 = tuiState()
  state2._agent = fakeAgent({ _recordStore: null })
  // 隔离面：段① 回扫注记 `_startN` 驻记录对象本体（`lifecycle-records.mjs` `resolveSplitTerminalNs`）⇒ 段② 用独立副本
  // 并**去注记**（结构化克隆会连注记一并复制——需显式剥）（2026-10-01 夹具收正）。
  const window2 = structuredClone(H3).slice(3).map((r) => { if (r && "_startN" in r) delete r._startN; return r })
  startup.restoreLines(state2, { history: window2, total: H3.length, base: 3 })
  assert.ok(!state2.lines.some((l) => l.text === t("digest.done", { n: 4, seconds: "1.5" })), "判据可判别：无读口 ⇒ 零终态行")
})

test("腿 C3b·翻页（createLoadOlder）：页内缺 start ⇒ 预解析回扫补齐终端 n", () => {
  const H = [
    { kind: "digest", status: "start", n: 4, tier: "digest", ts: 1 },
    { role: "assistant", content: "填充0", ts: 2 },
    ...Array.from({ length: 19 }, (_, i) => ({ role: "assistant", content: `填充${i + 1}`, ts: 10 + i })),
    { kind: "digest", status: "end", ok: true, ms: 1500, ts: 99 },
    { role: "assistant", content: "尾二", ts: 100 },
    { role: "assistant", content: "尾三", ts: 101 },
  ]
  const store = fakeStore(H)
  const agent = fakeAgent({ _recordStore: store, _fullHistory: H })
  const state = tuiState()
  state._agent = agent
  state.lines = [{ text: "… 2 more earlier messages (scroll to top to load)", color: C.dim }]
  state._historyTotal = H.length // 24 ⇒ 页 = [2, 22)；回扫前数组含 ±1 页沿 = [1, 23)——本轮 start（abs 0）在页沿之外
  state._historyLoaded = 2
  state._hasOlder = true
  const loadOlder = startup.createLoadOlder({ agent, state, render: () => {} })
  loadOlder()
  const texts = state.lines.map((l) => l.text)
  assert.ok(texts.includes(t("digest.done", { n: 4, seconds: "1.5" })), "终态行在且 n 正确（回扫）")
})

test("腿 C4·负控：记录缺 ⇒ 与改前基线逐字等价 ∥ 未绑 ⇒ 零存储追加（模式 F 零回归）", async () => {
  const HBase = [
    { role: "user", content: "问题一", ts: 1 },
    { role: "assistant", content: "回答一", ts: 2 },
    { role: "user", content: "问题二", ts: 3 },
  ]
  const HMixed = [
    HBase[0],
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 1.5 },
    HBase[1],
    { kind: "digest", status: "end", ok: true, ms: 1000, ts: 2.5 },
    HBase[2],
  ]
  const base = startup.historyToLines(HBase, 0, HBase.length)
  // 手写字面基线（改前恢复面逐字——记录分支零副作用）
  assert.deepEqual(base, [
    { text: "❯ You:", color: ansi.bold + C.user },
    { text: "问题一", color: C.text, _kind: "text" },
    { text: "", color: C.dim },
    { text: "❯ ThinCoder:", color: ansi.bold + C.assistant },
    { text: "回答一", color: C.text },
    { text: "", color: C.dim },
    { text: "❯ You:", color: ansi.bold + C.user },
    { text: "问题二", color: C.text, _kind: "text" },
  ], "记录缺 ⇒ 恢复面与改前基线逐字等价（手写字面）")
  const mixed = startup.historyToLines(HMixed, 0, HMixed.length)
  const recordTexts = new Set([t("digest.turnLabel"), t("digest.start", { n: 2 }), t("digest.done", { n: 2, seconds: "1.0" })])
  const stripped = mixed.filter((l) => !recordTexts.has(l.text) && !l._frozenSubTask)
  assert.deepEqual(stripped, base, "混合夹具剔除记录行 ⇒ 与基线逐字等价（判据可判别）")
  // 未绑（模式 F）：记录入 _fullHistory 照常 ∥ 存储腿空转 ∥ 零抛
  const unbound = fakeAgent({ _recordStore: null })
  const f = turnFixture({ agent: unbound })
  f.agent._pendingAsyncResults = [{}]
  await assert.doesNotReject(() => drive.digestTurn(f.ctx, false))
  assert.equal(unbound._fullHistory.length, 2, "未绑 ⇒ 记录入人读线（落盘随既有保存链）")
  assert.equal(unbound.history.length, 0, "机器线零触")
  const state = tuiState()
  state._agent = unbound
  const sub = { key: "k#1", role: "eng-coder", started: 1, doneAt: 2, blocks: [{ kind: "text", text: "x" }], children: [] }
  assert.doesNotThrow(() => freeze.freezeSubTaskLines(state, sub))
  assert.equal(unbound._fullHistory.length, 3, "冻结记录照常入人读线")
  // 载体缺位（无 `_agent`——headless / 子代理内）⇒ 零动作（零抛）
  const bare = tuiState()
  assert.doesNotThrow(() => freeze.freezeSubTaskLines(bare, { ...sub, key: "k#2", children: [] }))
})

test("腿 C5·复活径双记录（在册容差——如实断言：重建面双块 ∥ 活流单块）", () => {
  const agent = fakeAgent()
  const state = tuiState()
  state._agent = agent
  const gen1 = { key: "coder#1", role: "eng-coder", started: 1000, doneAt: 2000, blocks: [{ kind: "text", text: "一代" }], children: [] }
  state.subTasks["coder#1"] = gen1
  freeze.freezeSubTaskLines(state, gen1)
  delete state.subTasks["coder#1"]
  // 复活径（zero-block 批 P0-a）：摘旧载体行 + 重建块（墓碑摘除）→ 二代再冻结
  freeze.removeFrozenSubTaskLine(state, "coder#1")
  const gen2 = { key: "coder#1", role: "eng-coder", started: 3000, doneAt: 4000, blocks: [{ kind: "text", text: "二代" }], children: [] }
  state.subTasks["coder#1"] = gen2
  freeze.freezeSubTaskLines(state, gen2)
  assert.equal(agent._recordStore.appended.length, 2, "同键两代冻结 ⇒ 两记录（在册容差③——低频异常修复径 ∥ 数据零损）")
  assert.deepEqual(agent._recordStore.appended.map((r) => r.meta.key), ["sub:coder#1", "sub:coder#1"])
  assert.equal(
    state.lines.filter((l) => l._frozenSubTask?.key === "coder#1").length,
    1,
    "活流单块（旧载体行随复活摘除）——重建面按记录双块（在册）",
  )
})

// ═══ VSC 面腿（#726 VSC 舱——写全链 ∥ 重建 ∥ 负控 ∥ 容差②）═══
// 装载面三件（先于取件）：① vscode 解析桩（temp 文件生成 + `node:module` resolve 钩子——vscode-mock 包
// 随测试树退役的在册面，零仓内新档）；② happy-dom 注册（真 webview 模块驱动——沿 r6 探针先例）；
// ③ 真 extension 模块（桩面板驱动——suspension.mjs / panel-callbacks.mjs / panel-messages.mjs /
// panel-session.mjs / session-io.mjs）。

const _vsDir = mkdtempSync(join(tmpdir(), "x726-vsc-"))
const _vsStub = join(_vsDir, "vscode-stub.mjs")
writeFileSync(_vsStub, [
  "const noop = () => {}",
  "export const workspace = { workspaceFolders: [{ uri: { fsPath: " + JSON.stringify(ROOT) + " } }], getConfiguration: () => ({ get: () => undefined, update: async () => {} }), onDidChangeWorkspaceFolders: () => ({ dispose() {} }) }",
  "export const window = { showWarningMessage: noop, showInformationMessage: noop, showErrorMessage: noop, onDidChangeActiveTextEditor: () => ({ dispose() {} }) }",
  "export const env = { language: \"en\" }",
  "export const Uri = { file: (p) => ({ fsPath: p }), parse: (s) => ({ toString: () => s }) }",
  "export const commands = { registerCommand: noop, executeCommand: async () => undefined }",
  "export class EventEmitter { constructor() { this.event = () => ({ dispose: noop }) } fire() {} dispose() {} }",
  "export default {}",
].join("\n"), "utf8")
const _vsHook = join(_vsDir, "resolve-hook.mjs")
writeFileSync(_vsHook, [
  "export async function resolve(specifier, context, next) {",
  "  if (specifier === \"vscode\") return { url: " + JSON.stringify(pathToFileURL(_vsStub).href) + ", shortCircuit: true }",
  "  return next(specifier, context)",
  "}",
].join("\n"), "utf8")
;(await import("node:module")).register(pathToFileURL(_vsHook).href)

const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {} // happy-dom 面缺项垫片（沿 r6 探针先例）
document.body.innerHTML = `
  <div id="chat-container">
    <div id="messages"></div>
    <div id="subagent-activity"></div>
    <div id="toolbar"><div id="status-line"></div><div id="input-row"><textarea id="input"></textarea></div></div>
    <div id="model-dropdown"></div><div id="reasoning-dropdown"></div><div id="session-dropdown"></div>
    <button id="session-selector"></button><span id="session-title"></span>
  </div>`
const _wvPosts = []
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => _wvPosts.push(m), getState: () => ({}), setState: () => {} })

const [wstate, wi18n, wstreaming, wactivity, whistory, vscSusp, vscCb, vscMsgs, vscSession, vscIo] = await Promise.all([
  mod("thincoder-vscode/webview/state.js"),
  mod("thincoder-vscode/webview/i18n.js"),
  mod("thincoder-vscode/webview/streaming.js"), // 真内容 chunk 入口（rows 夹具）
  mod("thincoder-vscode/webview/activity.js"), // 真归档面（出站 recordAppend）
  mod("thincoder-vscode/webview/history.js"), // 真页级 pass（重建径）
  mod("thincoder-vscode/src/extension/suspension.mjs"), // 真 driveTurn 边界（写点 start/end）
  mod("thincoder-vscode/src/extension/panel-callbacks.mjs"), // 写点 cap（postDigestCap）
  mod("thincoder-vscode/src/extension/panel-messages.mjs"), // 宿主处理体（handleRecordAppend）
  mod("thincoder-vscode/src/extension/panel-session.mjs"), // 读面 opt-in（loadOlder ∥ loadSession）
  mod("thincoder-vscode/src/extension/session-io.mjs"), // 槽读面 / 沙箱缝（loadSlot ∥ saveSessionToSlot）
])

/** VSC 注入字典（哨兵值——词键 + 插值面 = 断言对象；host 注入契约同形）。 */
wi18n.setStrings({
  "digest.turnLabel": "TL", "digest.turnLabelAsk": "TLA:${from}:${msg}",
  "digest.start": "DS:${n}", "digest.done": "DD:${n}:${seconds}", "digest.aborted": "DA:${seconds}",
  "digest.capStop": "CS:${turns}", "digest.capAuto": "CA",
  "sub.done": "DONE", "sub.async": "ASYNC", "sub.sync": "SYNC", "sub.stopped": "STOPPED", "sub.thinking": "THINK",
})

/** 桩面板（真 extension 面消费形）：活行载体 = `lines`（`_liveLines` 同引用）+ 出站捕获 + 保存面探针。 */
function vscPanel({ slot = null } = {}) {
  const posts = []
  const lines = { history: [], fullHistory: [], contextHistory: [] }
  const panel = {
    _slot: slot,
    _panel: { webview: { postMessage: (m) => posts.push(m) } },
    _liveLines: lines, _susp: null,
    _publishTurnState: () => {}, _refreshStatus: () => {},
    _saveLinesCalls: [], _saveLines: (...args) => panel._saveLinesCalls.push(args),
    _turnControllers: [], _abortController: new AbortController(),
    _agent: { config: {}, _pendingTimers: [] },
    _context: { workspaceState: { get: () => undefined, update: async () => {} } },
  }
  return { panel, posts, lines }
}

/** 痕元素族取面（根 = `#messages`——重建元素过 `data-idx` 面同守）。 */
const wLabelsOf = (root) => [...root.querySelectorAll(".digest-turn")]
const wCountsOf = (root) => [...root.querySelectorAll(".digest-status")].filter((el) => !el.classList.contains("digest-done") && !el.classList.contains("digest-failed") && el.dataset.n !== undefined)
const wTerminalsOf = (root) => [...root.querySelectorAll(".digest-done, .digest-failed")]

test("腿 V1·写面三发点（真 suspensionSession 驱动 start/end + postDigestCap）：活行载体含记录（同点 ∥ 形 ∥ ts）+ 机器线零触", async () => {
  const { panel, posts, lines } = vscPanel()
  const history = lines.history
  panel._liveLines = lines
  history._pendingAsyncResults = [{ role: "explore", id: 1 }] // pend0 = 1
  const entry = { turnSlot: {}, distillSlot: {}, lines, runTurn: async () => { history._pendingAsyncResults.splice(0) } }
  await vscSusp.suspensionSession(panel, entry)
  // 帧面（对照片）+ 记录面（写点）
  const frames = posts.filter((m) => m.type === "digest")
  assert.deepEqual(frames.map((f) => f.status), ["start", "end"], "起止两帧（真 driveTurn 边界）")
  assert.deepEqual(lines.fullHistory.map((r) => [r.kind, r.status]), [["digest", "start"], ["digest", "end"]], "两记录入活行载体（同点 ∥ 序）")
  const [start, end] = lines.fullHistory
  assert.equal(start.n, 1, "起跑数随记录（与帧同值面）")
  assert.equal(start.tier, "digest")
  assert.equal(typeof start.ts, "number", "ts 打点（核写缝）")
  assert.equal(end.ok, true)
  assert.equal(end.ms, frames[1].ms, "记录 `ms` 与帧 `ms` 同值单算式")
  assert.equal(history.length, 0, "机器线零触（`history` 弃数组承接——零新增）")
  assert.equal(panel._saveLinesCalls.length, 1, "会话退出兜底落盘一次（记录已随载——D-S3 ③）")
  assert.deepEqual(panel._saveLinesCalls[0][0].map((r) => r.kind), ["digest", "digest"], "兜底落盘所写人读线含两记录（下一落盘承接面）")
  // cap 发点（真 postDigestCap——全调用面同收）
  const c = vscPanel()
  vscCb.postDigestCap(c.panel, "stop", 3)
  assert.deepEqual(c.posts, [{ type: "digest", status: "cap", mode: "stop", turns: 3 }], "cap 帧")
  const cap = c.lines.fullHistory[0]
  assert.deepEqual({ kind: cap.kind, status: cap.status, mode: cap.mode, turns: cap.turns }, { kind: "digest", status: "cap", mode: "stop", turns: 3 }, "cap 记录（形逐字）")
  assert.equal(typeof cap.ts, "number")
  assert.equal(c.lines.history.length, 0, "cap 同点：机器线零触")
})

test("腿 V2·出站全链：真 webview 归档 ⇒ `recordAppend` 恰一次（幂等守卫内）⇒ 宿主处理体追加活行载体；meta 契约子集 + rows 保尾", () => {
  const n0 = _wvPosts.length
  const t0 = Date.now() - 15000
  wactivity.applySubagentStatus({ role: "eng-coder", id: 1, status: "started", pool: true, startedAt: t0 })
  wstreaming.subagentChunk({ name: "sub:eng-coder#1", kind: "text", text: Array.from({ length: 500 }, (_, i) => `l${i}`).join("\n") })
  wstreaming.subagentChunk({ name: "sub:eng-coder#1", kind: "think", text: "尾行" })
  wactivity.applySubagentStatus({ role: "eng-coder", id: 1, status: "done" })
  const emits = () => _wvPosts.slice(n0).filter((m) => m.type === "recordAppend")
  assert.equal(emits().length, 1, "归档派生点恰一发")
  const rec = emits()[0].record
  assert.equal(rec.kind, "subagent")
  assert.equal(rec.meta.key, "sub:eng-coder#1", "meta.key = 块头事实（块键原样）")
  assert.equal(rec.meta.role, "eng-coder")
  assert.equal(rec.meta.status, "done")
  assert.equal(rec.meta.startedAt, t0)
  assert.equal(typeof rec.meta.doneAt, "number")
  assert.deepEqual(Object.keys(rec.meta).sort(), ["doneAt", "key", "maxTurns", "pool", "role", "startedAt", "status"], "meta = 核契约已知字段子集（零增键）")
  assert.deepEqual(rec.rows[0], { kind: "meta", text: "… [rows truncated: 500 lines omitted]" }, "rows 保尾：弃最旧 500 行 + 前置省略标记行")
  assert.deepEqual(rec.rows[1], { kind: "think", text: "尾行" }, "rows 条目形 `{kind,text}`（保尾后）")
  // 幂等守卫内恰一次：同块再终态（drop-frozen）⇒ 零二发
  wactivity.applySubagentStatus({ role: "eng-coder", id: 1, status: "done" })
  assert.equal(emits().length, 1, "同块恰一次（重复终态零二发）")
  // 宿主处理体（真 case 处理函数）：`_liveLines` 优先 ∥ `_susp?.lines` 回落
  const a = vscPanel()
  vscMsgs.handleRecordAppend(a.panel, { type: "recordAppend", record: rec })
  assert.equal(a.lines.fullHistory.length, 1, "追加到活行载体（同引用）")
  assert.equal(a.lines.fullHistory[0].kind, "subagent")
  assert.equal(typeof a.lines.fullHistory[0].ts, "number", "ts 打点（核写缝）")
  assert.equal(a.lines.history.length, 0, "机器线零触")
  const b = vscPanel()
  b.panel._liveLines = null
  b.panel._susp = { lines: b.lines } // 挂起会话载体回落
  vscMsgs.handleRecordAppend(b.panel, { type: "recordAppend", record: structuredClone(rec) })
  assert.equal(b.lines.fullHistory.length, 1, "`_susp?.lines` 回落同判")
  // 载体缺位（无活跃会话）⇒ 零动作零抛
  assert.doesNotThrow(() => vscMsgs.handleRecordAppend({ _liveLines: null, _susp: null }, { type: "recordAppend", record: structuredClone(rec) }))
})

test("腿 V3·读面 opt-in 真驱 + 页级重建：记录随页携（`loadOlder`）⇒ 痕元素（tier 两档 ∥ `dataset.n` ∥ done/failed 逐字）+ 归档块（活形）+ `data-idx` 在位", () => {
  vscIo._setSessionsDirForTest(join(_vsDir, "sessions-a"))
  const VH = [
    { role: "user", content: "问题一", ts: 1 },
    { kind: "digest", status: "start", n: 2, tier: "ask", from: "eng-designer#8", msg: "请复核", ts: 2 },
    { role: "assistant", content: "回答一", ts: 3 },
    { kind: "digest", status: "end", ok: true, ms: 1500, ts: 4 },
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 5 },
    { kind: "digest", status: "cap", mode: "stop", turns: 3, ts: 6 },
    { role: "assistant", content: "回答二", ts: 7 },
    { kind: "digest", status: "end", ok: false, ms: 2300, ts: 8 },
    { kind: "subagent", ts: 9, meta: { key: "sub:eng-coder#1", role: "eng-coder", model: "m1", startedAt: 1000, doneAt: 16000, turn: 2, maxTurns: 5, status: "done" }, rows: [{ kind: "text", text: "行一" }, { kind: "think", text: "行二" }] },
    { role: "user", content: "问题二", ts: 10 },
  ]
  vscIo.saveSessionToSlot(ROOT, 1, { version: 2, cwd: ROOT, history: VH, contextHistory: [] })
  const { panel, posts } = vscPanel({ slot: 1 })
  vscSession.loadOlder(panel, VH.length)
  const page = posts.find((m) => m.type === "historyPage")
  assert.ok(page, "historyPage 在场")
  assert.ok(page.messages.some((m) => m.kind === "digest") && page.messages.some((m) => m.kind === "subagent"), "opt-in：记录随页携")
  const root = wstate.ctx.messagesEl
  root.replaceChildren()
  whistory.applyHistoryPage(wstate.ctx, page)
  // ① 痕元素族（复列 = 全量完整轮）
  assert.equal(wLabelsOf(root).length, 2, "两完整轮 ⇒ 标签 ×2")
  assert.equal(wLabelsOf(root)[0].textContent, "TLA:eng-designer#8:请复核", "ask 档标签逐字（tier 两档之一）")
  assert.equal(wLabelsOf(root)[1].textContent, "TL", "digest 档标签逐字")
  assert.deepEqual(wCountsOf(root).map((el) => [el.textContent, el.dataset.n]), [["DS:2", "2"], ["DS:2", "2"]], "计数元素（`dataset.n` 在位）")
  assert.equal(wTerminalsOf(root)[0].className, "digest-status digest-done", "终态元素 done 档类")
  assert.equal(wTerminalsOf(root)[0].textContent, "DD:2:1.5", "终态 done 逐字（n 自起跑记录 ∥ seconds 同算式）")
  assert.equal(wTerminalsOf(root)[1].className, "digest-status digest-failed", "终态元素 failed 档类")
  assert.equal(wTerminalsOf(root)[1].textContent, "DA:2.3", "终态 aborted 逐字")
  const cap = root.querySelector(".digest-cap")
  assert.equal(cap.className, "digest-cap digest-cap-stop", "cap 行（mode=stop 档类）")
  assert.equal(cap.textContent, "CS:3", "cap 逐字")
  // ② 记录序 ≡ 恢复序（页级 pass 按记录序入元素）
  assert.deepEqual(
    [...root.children].map((el) => el.className.split(" ")[0]),
    ["message", "digest-turn", "digest-status", "message", "digest-status", "digest-turn", "digest-status", "digest-cap", "message", "digest-status", "advisor-block", "message"],
    "元素序 = 记录序（记录位次原位——零配对）",
  )
  assert.equal(wLabelsOf(root)[0].dataset.idx, "1", "标签 data-idx = 起跑记录全局 idx")
  assert.equal(wTerminalsOf(root)[0].dataset.idx, "3", "终态 data-idx = 终态记录全局 idx")
  assert.equal(cap.dataset.idx, "5", "cap data-idx 在位")
  // ③ 归档块（活形同构）
  const blk = root.querySelector(".sub-block")
  assert.equal(blk.className, "advisor-block sub-block sub-frozen", "归档块活形（冻结态）")
  assert.equal(blk.open, false, "折叠态")
  assert.equal(blk.dataset.idx, "8", "重建块携 `data-idx`（分页游标面）")
  assert.equal(blk.dataset.subname, "sub:eng-coder#1")
  assert.equal(blk.dataset.subrole, "eng-coder")
  assert.equal(blk.dataset.subid, "1")
  assert.ok(blk.querySelector("summary").textContent.includes("eng-coder#1"), "块头含键")
  assert.ok(blk.querySelector("summary").textContent.includes("DONE"), "块头态词 = 冻结 done（构形件同源）")
  assert.deepEqual([...blk.querySelector(".advisor-content").children].map((el) => [el.textContent, el.dataset.kind]), [["行一", "text"], ["行二", "think"]], "rows 回放（核件同径——同 kind 相邻行随活流合并判据，跨 kind 恒分行）")
  assert.equal(blk.querySelector(".sub-stop-btn"), null, "重建块零 ⏹")
  // ④ 同位去重（防双渲染——幂等）：记录元素重放零重复
  const recEls = () => root.querySelectorAll(".digest-turn, .digest-status, .digest-cap, .sub-block").length
  const before = recEls()
  whistory.applyHistoryPage(wstate.ctx, page)
  assert.equal(recEls(), before, "同位 `[data-idx]` 去重（记录元素重放幂等零重复）")
  vscIo._resetSessionsDirForTest()
})

test("腿 V4·负控：默认关逐字等价（消息面）∥ 未结轮照现（容差①）∥ cap 无打开轮零产 ∥ 未归档块不重建（I-7）", () => {
  // ① 记录缺 ⇒ opt-in 与默认径逐字等价（消息面无破）
  vscIo._setSessionsDirForTest(join(_vsDir, "sessions-b"))
  const HB = [
    { role: "user", content: "问题一", ts: 1 },
    { role: "assistant", content: "回答一", ts: 2 },
    { role: "user", content: "问题二", ts: 3 },
  ]
  vscIo.saveSessionToSlot(ROOT, 2, { version: 2, cwd: ROOT, history: HB, contextHistory: [] })
  const { panel, posts } = vscPanel({ slot: 2 })
  vscSession.loadOlder(panel, HB.length)
  const page = posts.find((m) => m.type === "historyPage")
  assert.equal(JSON.stringify(page.messages), JSON.stringify(historyWindow(HB, HB.length).messages), "记录缺 ⇒ 与默认径逐字等价")
  // ② 未结轮照现：cap 无打开轮 ∥ end 缺 start ⇒ 零产；start 缺 end〔末页 open〕⇒ 照现两元素
  const root = wstate.ctx.messagesEl
  root.replaceChildren()
  const half = [
    { kind: "digest", status: "cap", mode: "stop", turns: 3, ts: 1, idx: 10 },
    { kind: "digest", status: "end", ok: true, ms: 1000, ts: 2, idx: 11 },
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 3, idx: 12 },
  ]
  whistory.applyHistoryPage(wstate.ctx, { messages: half, hasOlder: false, older: false })
  assert.equal(root.querySelectorAll(".digest-turn, .digest-status, .digest-cap").length, 2, "未结轮照现（末页 open——label + count 两元素）")
  // ③ 未归档块不重建（I-7 收窄）：live 块驻活动区——记录缺 ⇒ 页重建零块
  const liveRoot = wstate.ctx.activityEl
  const before = liveRoot.children.length
  wactivity.applySubagentStatus({ role: "eng-coder", id: 7, status: "started", pool: true })
  assert.equal(liveRoot.children.length, before + 1, "夹具：live 块驻活动区")
  root.replaceChildren()
  whistory.applyHistoryPage(wstate.ctx, { messages: [{ role: "user", content: "无记录页", ts: 1, idx: 0 }], hasOlder: false, older: false })
  assert.equal(root.querySelectorAll(".sub-block").length, 0, "未归档块不重建（重建只产自记录）")
  assert.ok(liveRoot.querySelector(".sub-block"), "live 块仍在活动区（零触）")
  wactivity.applySubagentStatus({ role: "eng-coder", id: 7, status: "cancelled" }) // 收窗（免跨腿残留）
  vscIo._resetSessionsDirForTest()
})

test("腿 V5·容差②（save 前/后可见性）：记录先入活行（内存即时可见）∥ 零即时落盘——随下一 `saveLines` 落槽（重载可见性 = 至最后一次落盘）", () => {
  vscIo._setSessionsDirForTest(join(_vsDir, "sessions-c"))
  const { panel, lines } = vscPanel({ slot: 3 })
  lines.fullHistory.push({ role: "user", content: "问题", ts: 1 })
  const record = { kind: "subagent", meta: { key: "sub:eng-coder#1", role: "eng-coder", status: "done", startedAt: 1, doneAt: 2 }, rows: [{ kind: "text", text: "行一" }] }
  vscMsgs.handleRecordAppend(panel, { type: "recordAppend", record })
  assert.equal(lines.fullHistory.length, 2, "save 前：记录先入活行（内存面即时可见）")
  assert.equal(panel._saveLinesCalls.length, 0, "零即时落盘（落盘晚一拍——下一落盘承接）")
  // 下一落盘（真 `saveLines` 写面——回合尾同点）：记录随槽 JSON 投影落盘
  vscSession.saveLines(panel, lines.fullHistory, [], {}, 3)
  const slotData = vscIo.loadSlot(ROOT, 3)
  assert.equal(slotData.history.length, 2, "槽 JSON 投影全量（含记录）")
  assert.equal(slotData.history[1].kind, "subagent", "记录落槽（槽 JSON 投影——不绑记录存储）")
  // 重载可见性：读面 opt-in（首屏径 = `loadSession`——面板重开 ∥ reload 同径）⇒ 页内重现
  const r = vscPanel({ slot: 3 })
  vscSession.loadSession(r.panel)
  const page = r.posts.find((m) => m.type === "historyPage")
  assert.ok(page.messages.some((m) => m.kind === "subagent"), "重载可见性 = 至最后一次落盘（首屏页携记录）")
  // 翻页径（`loadOlder`）同判（两 opt-in 调用面）
  const s = vscPanel({ slot: 3 })
  vscSession.loadOlder(s.panel, 2)
  const older = s.posts.find((m) => m.type === "historyPage")
  assert.ok(older.messages.some((m) => m.kind === "subagent"), "翻页径同携记录")
  vscIo._resetSessionsDirForTest()
})

