/**
 * ledger-surface.test.mjs — 台账可见面用例（M2 SQLite 台账批——设计档
 * docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §3 测试层（AC-1..7 / T1–T10）；
 * 用例编号 T97–T110 / AC80–AC90 = v1 可见面设计遗留编号（保号不改名——原设计面已随 M2 收敛入模块设计档 §2.2）。
 * 面：计数单源（T97）· 行文本逐字（T98/T99）· 启动行门（T100）· 阈值三例（T101）· 老化界值（T102）·
 * 去重 + 送达门 + 条目键稳定（T103）· 状态行接线（T106）· 项目发现（T109）· 降级不崩（T110）· 刷新成本（AC89）。
 * 手法：tmp SQLite 夹具（ledgerAdd + created_at/updated_at 时间戳回拨——buildScan 时间戳源
 * 替代 v1 ageOf git blame 注入面）+ 直驱 `runLedgerScan` / `renderStatus` / `buildScan`。
 * 归册（M2 重写）：T104（check-ledger `--summary`）随 check-ledger 作废——移 M8 批；T102 改快层
 * （时间戳纯计算，无 git）；AC89 归册 slow 层（计时用例）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, parse } from "node:path"
import { slow } from "./slow.mjs"
import {
  buildScan, discoverFamily, entryTitle, findProject, formatAgingLine, formatDetailLine, formatMarker,
  formatThresholdLine, ledgerAdd, ledgerClose, ledgerCount, ledgerDbPath, ledgerQuery, ledgerUpdate, loadNotifyState,
  normalizeEntry, notifyKey, openLedger, saveNotifyState, _resetLedgerDirForTest, _setExecutorProbeTtlForTest,
  _setLedgerDirForTest,
} from "@thincoder/core/ledger.mjs"
import { _resetProcessProbeTestImpl, _setProcessProbeTestImpl } from "@thincoder/core/process-probe.mjs"
import { runLedgerScan, startLedgerSurface, _setLoadCoreForTest } from "../src/tui/ledger-surface.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { C } from "../src/tui/ansi.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")
let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-surface-"))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
})
afterEach(() => {
  _resetLedgerDirForTest()
  _resetProcessProbeTestImpl()
  _setExecutorProbeTtlForTest(null) // 判活 TTL 缝恢复（裁定 #8——测试间不串）
  _setLoadCoreForTest(null) // 载核缝复位（#233——LS 组）
  rmSync(tmp, { recursive: true, force: true })
})

const mk = (rel, content) => { const abs = join(tmp, rel); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); return abs }
const poolEntry = (name, board = "FOO.md") => `- [ ] **${name}** → 需求 \`docs/requirements/${board}\` §1.13 · 任务书 \`docs/batches/B.md\` §2 · status=待讨论`
const techEntry = (name, evidence = "src/a.mjs:1") => `- [ ] **${name}** → 证据 \`${evidence}\``
/** 需求行（board 显式 = 阈值同板块口径；title 沿用 v1 条目文本——条目键与 v1 同源）。 */
const poolRow = (name, board = "FOO.md") => ({ kind: "requirement", title: poolEntry(name, board), board })
/** 技术行（trigger 可空——带触发不计老化，同 v1 口径）。 */
const techRow = (name, trigger = null) => ({ kind: "tech_todo", title: techEntry(name), ...(trigger ? { trigger } : {}) })

/** SQLite 夹具：目录建项目 → 插行（ledgerAdd——入待讨论）→ 指定行时间戳回拨 ageDays 天（老化注入面）。 */
function mkLedgerAt(dir, rows = []) {
  mkdirSync(dir, { recursive: true })
  const db = openLedger(dir, { create: true })
  const ids = rows.map(({ row }) => ledgerAdd({ cwd: dir, row }))
  for (const [i, { ageDays }] of rows.entries()) {
    if (!ageDays) continue
    const t = new Date(Date.now() - ageDays * 86400000).toISOString()
    db.prepare("UPDATE items SET created_at = ?, updated_at = ? WHERE id = ?").run(t, t, ids[i])
  }
  db.close()
  return dir
}

/** 最小状态 / agent 桩（renderStatus 直驱——attention-state.test.mjs 同款）。 */
const baseState = (over = {}) => ({
  input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
  processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
  tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  ctxCache: { tokens: 0 },
  permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
  suspended: false, _suspPending: false, attentionAwaiting: false,
  ...over,
})
const agentStub = (over = {}) => ({
  provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0,
  ...over,
})

/** 单项目夹具族（每拍独立目录——族根 = tmp/fam/<seq> 下）驱动 runLedgerScan：rows = 台账行（{ row, ageDays }）。 */
let famSeq = 0
async function drive({ rows = [], startup = true, failPush = false } = {}) {
  const base = join(tmp, "fam", String(famSeq++))
  const proj = mkLedgerAt(join(base, "proj"), rows)
  const state = { processing: false }
  const lines = []
  await runLedgerScan({
    state, anchor: proj, notifyFile: join(base, "notify.json"),
    pushLine: (t) => { if (failPush) throw new Error("push failed"); lines.push(t) },
    startup,
  })
  return { state, lines, proj }
}

// ── T97 计数单源（AC80/F7——SQLite 口径：未决四态；归档不计） ─────────────────
test("T97 正常/反证：buildScan 计数 == ledgerCount 单源（改动同步变——非空转；归档不计）", () => {
  const proj = mkLedgerAt(join(tmp, "proj"), [
    { row: poolRow("甲") }, { row: poolRow("乙") },
    { row: techRow("丙") }, { row: techRow("丁") },
  ])
  const scan = () => buildScan({ cwd: proj })
  assert.equal(scan().pool, 2, "池计数 = 未决需求条目数")
  assert.equal(scan().tech, 2, "技术计数 = 未决技术条目数")
  assert.equal(ledgerCount({ cwd: proj }), 4, "计数单源 = 未决四态（两侧同口径）")
  ledgerAdd({ cwd: proj, row: poolRow("丙") })
  assert.equal(scan().pool, 3, "加一条 → 两侧同步变")
  assert.equal(ledgerCount({ cwd: proj }), 5)
  const db = openLedger(proj, { create: true })
  const id = db.prepare("SELECT id FROM items WHERE title = ?").get(poolEntry("甲")).id
  db.close()
  ledgerClose({ cwd: proj, id, status: "已废弃" })
  assert.equal(scan().pool, 2, "撤回（已废弃）→ 不计（计数口径 = 未决四态，非空转）")
  assert.equal(ledgerCount({ cwd: proj }), 4)
})

// ── T98/T99 行文本逐字（AC81/F1+F2） ────────────────────────────────────────
test("T98 正常：L1 标记逐字 + aged 色语义（formatMarker / renderStatus 直驱）", () => {
  assert.equal(formatMarker({ pool: 4, tech: 32 }), "台账 4·32")
  assert.equal(formatMarker(null), null, "空扫描 → 空标记（无台账不显）")
  const flat = renderStatus(baseState({ ledger: { marker: "台账 4·32", warn: false } }), agentStub(), 80, [])
  assert.ok(stripAnsi(flat).includes(" │ 台账 4·32"), "L1 在位")
  assert.ok(!flat.includes(C.warn), "aged=0 → 默认色（无警示色段）")
  const warn = renderStatus(baseState({ ledger: { marker: "台账 4·32", warn: true } }), agentStub(), 80, [])
  assert.ok(warn.includes(`${C.warn}台账 4·32`), "aged>0 → 警示色段包裹")
})

test("T99 正常：L2/L3/L4 逐字（` — 可开批` / `；…` 截断 / 无粗体段回退标题）", () => {
  const scan = (over) => ({
    name: "thincoder", root: "/x", ledger: "/x/ledger.db", pool: 2, tech: 5, aged: 0,
    agedKeys: [], agedTitles: [], thresholdReached: false, boards: new Map(), actionable: false, ...over,
  })
  assert.equal(formatDetailLine(scan()), "台账 thincoder：需求池 2 · 技术待办 5（老化 0）", "老化恒显（含 0）")
  assert.equal(formatDetailLine(scan({ thresholdReached: true })), "台账 thincoder：需求池 2 · 技术待办 5（老化 0） — 可开批")
  assert.equal(formatAgingLine(scan(), ["甲", "乙"]), "台账变化：thincoder 老化首次越线 2 条（超 30 天未处置）：甲；乙")
  assert.equal(formatAgingLine(scan(), ["甲", "乙", "丙"]), "台账变化：thincoder 老化首次越线 3 条（超 30 天未处置）：甲；乙；丙", "恰 3 条无省略")
  assert.equal(formatAgingLine(scan(), ["甲", "乙", "丙", "丁"]), "台账变化：thincoder 老化首次越线 4 条（超 30 天未处置）：甲；乙；丙；…", ">3 条第三项后接 `；…`")
  assert.equal(formatThresholdLine(scan({ pool: 3 })), "台账变化：thincoder 需求池达阈值（3 条）— 可开批")
  assert.equal(entryTitle("- [ ] **甲**（待讨论）"), "甲", "标题 = 首个粗体段")
  assert.equal(entryTitle("- [ ] 短标题无粗体"), "短标题无粗体", "≤20 字不加 `…`")
  const long = "- [ ] 无粗体段落文本一二三四五六七八九十十一十二十三"
  assert.equal(entryTitle(long), normalizeEntry(long).slice(0, 20) + "…", "回退 = 归一化文本前 20 字（超出加 `…`）")
})

// ── T100/T101 启动行门 / 阈值（AC82/AC83） ──────────────────────────────────
test("T100 边界：启动行门——可动作（aged>0 / 阈值）出 L2 行；不可动作 → 会话流零行、标记照显", async () => {
  const a = await drive({ rows: [{ row: techRow("丙"), ageDays: 40 }] })
  assert.equal(a.lines.length, 2, JSON.stringify(a.lines))
  assert.equal(a.lines[0], "台账变化：proj 老化首次越线 1 条（超 30 天未处置）：丙", "先变化行")
  assert.equal(a.lines[1], "台账 proj：需求池 0 · 技术待办 1（老化 1）", "后明细行（每项目一行）")

  const b = await drive({ rows: [{ row: poolRow("甲") }, { row: poolRow("乙") }] })
  assert.equal(b.lines.length, 2, JSON.stringify(b.lines))
  assert.equal(b.lines[0], "台账变化：proj 需求池达阈值（2 条）— 可开批", "首达阈带 L4")
  assert.equal(b.lines[1], "台账 proj：需求池 2 · 技术待办 0（老化 0） — 可开批")

  const c = await drive({ rows: [{ row: { kind: "requirement", title: poolEntry("甲") } }] })
  assert.deepStrictEqual(c.lines, [], "不可动作 → 会话流零行")
  assert.equal(c.state.ledger.marker, "台账 1·0", "常驻标记不受此门约束（F2 照显）")
  assert.equal(c.state.ledger.warn, false, "aged=0 → 默认色")
})

test("T101 边界：阈值三例（同板块 2 达阈 / 池 3 达阈 / 跨两档各 1 不达阈）", () => {
  const thr = (rel, pool) => buildScan({ cwd: mkLedgerAt(join(tmp, rel), pool.map((row) => ({ row }))) }).thresholdReached
  assert.equal(thr("p1", [poolRow("甲", "FOO.md"), poolRow("乙", "FOO.md")]), true, "①同板块 2 → 达阈")
  assert.equal(thr("p2", [poolRow("甲", "FOO.md"), poolRow("乙", "BAR.md"), poolRow("丙", "BAZ.md")]), true, "②池 3 → 达阈")
  assert.equal(thr("p3", [poolRow("甲", "FOO.md"), poolRow("乙", "BAR.md")]), false, "③跨两档各 1 → 不达阈")
})

// ── T103 去重 + 送达门 + 条目键稳定（AC85/F5） ──────────────────────────────
test("T103 正常：首扫记账 → 重扫 0 行；他条编辑 0 行；同条文本编辑 1 行；未送达不记账", async () => {
  const proj = mkLedgerAt(join(tmp, "fam", "proj"), [
    { row: poolRow("甲") }, { row: poolRow("乙") }, { row: techRow("丙"), ageDays: 40 },
  ])
  const notifyFile = join(tmp, "fam", "notify.json")
  const state = { processing: false }
  let failPush = false
  const scan = async () => {
    const lines = []
    await runLedgerScan({ state, anchor: proj, notifyFile, pushLine: (t) => { if (failPush) throw new Error("push failed"); lines.push(t) } })
    return lines
  }
  const dbPath = ledgerDbPath(proj)
  const setTitle = (from, to) => {
    const db = openLedger(proj, { create: true })
    db.prepare("UPDATE items SET title = ? WHERE title = ?").run(to, from)
    db.close()
  }
  const first = await scan()
  assert.deepStrictEqual(first, [
    "台账变化：proj 老化首次越线 1 条（超 30 天未处置）：丙",
    "台账变化：proj 需求池达阈值（2 条）— 可开批",
  ], "首扫：L3 + L4（变化行在前）")
  assert.deepStrictEqual(await scan(), [], "再扫同状态 → 0 行（一次性去重）")
  const entry = loadNotifyState(notifyFile).ledgers[notifyKey(dbPath)]
  assert.ok(entry && entry.threshold === true && entry.aged.length === 1, "送达后记账（aged + threshold）")

  // 他条编辑（非老化条 甲）：老化键不变 → 0 行
  setTitle(poolEntry("甲"), poolEntry("甲").replace("**甲**", "**甲注**"))
  assert.deepStrictEqual(await scan(), [], "他条编辑 → 键稳定（0 行）")
  // 同条文本变更 → 键变 = 一次新增
  setTitle(techEntry("丙"), techEntry("丙").replace("**丙**", "**丙改**"))
  assert.equal((await scan()).length, 1, "同条文本变更 → 1 行（新键）")
  assert.deepStrictEqual(await scan(), [], "新键亦去重")
  // 送达门：push 失败不记账 → 补送达重报
  setTitle(techEntry("丙改"), techEntry("丙改").replace("**丙改**", "**丙改2**"))
  failPush = true
  assert.deepStrictEqual(await scan(), [], "未送达（push 抛错）→ 无行入流")
  assert.equal(loadNotifyState(notifyFile).ledgers[notifyKey(dbPath)].aged.length, 1, "未送达不记账（档内仍为旧态）")
  failPush = false
  assert.equal((await scan()).length, 1, "补送达 → 重报（用户不丢事件）")
  assert.deepStrictEqual(await scan(), [], "送达后记账 → 归零")
})

test("T103 边界：跨端去重档键——绝对路径·正斜杠 + 盘符大写（session-slots normalizeCwd 同契约）", () => {
  // 盘符 = Windows 概念（POSIX 下 `d:\…` 非绝对路径——归一规则不适用）：断言按平台守卫（VSC CI = ubuntu-latest）
  if (process.platform === "win32") {
    const lower = "d:\\teamcode\\thincoder\\ledger.db"
    const upper = "D:\\teamcode\\thincoder\\ledger.db"
    assert.equal(notifyKey(lower), notifyKey(upper), "盘符大小写 → 同键（CLI process.cwd() 大写 / VSC uri.fsPath 小写——F5 跨端去重前提）")
    assert.equal(notifyKey(lower), "D:/teamcode/thincoder/ledger.db", "盘符大写 + 正斜杠（逐字）")
  }
  assert.ok(!notifyKey(join(tmp, "ledger.db")).includes("\\"), "无反斜杠（跨端共享档——全平台）")
})
// ── T19 双端（AC-M2-8 · LEDGER-EXECUTOR 批）：CLI L2 尾段 + warn 判位（端面 await 判活径） ──
test("T19 端面（CLI）：属主已死 → L2 明细行带「（属主已死 1，可接手）」+ state.ledger.warn = true", async () => {
  _setExecutorProbeTtlForTest(0) // 恒重探（用例内确定性）
  const base = join(tmp, "fam-ex")
  // 明细行门 = 任一项目 actionable ⇒ 夹具带一条老化行（独立——迁在途会刷 updated_at 重置自身行龄）
  const proj = mkLedgerAt(join(base, "proj"), [{ row: techRow("丁"), ageDays: 40 }, { row: techRow("丙") }])
  mkdirSync(join(proj, "docs", "batches"), { recursive: true })
  writeFileSync(join(proj, "docs", "batches", "here.md"), "# 在档\n")
  const row = ledgerQuery({ cwd: proj }).find((r) => r.title === techEntry("丙"))
  ledgerUpdate({ cwd: proj, id: row.id, patch: { status: "待设计" } })
  ledgerUpdate({ cwd: proj, id: row.id, patch: { status: "在途", task_book: "docs/batches/here.md" }, executorSessionId: "5001-dead" })
  const pre = buildScan({ cwd: proj })
  assert.equal(pre.inflightExecutors.length, 1, "前提：在途 executor 带值")
  assert.equal(pre.actionable, true, "前提：老化行（丁）使项目可动作——明细行门开")
  _setProcessProbeTestImpl({ aliveFn: (pids) => new Set(pids.filter((p) => p !== 5001)), cmdlineFn: () => new Map() })
  const state = { processing: false }
  const lines = []
  await runLedgerScan({
    state, anchor: proj, notifyFile: join(base, "notify.json"),
    pushLine: (t) => lines.push(t), startup: true,
  })
  const detail = lines.find((l) => l.startsWith("台账 proj："))
  assert.ok(detail, `明细行在流（${JSON.stringify(lines)}）`)
  assert.ok(detail.includes("（属主已死 1，可接手）"), `L2 尾段逐字（${detail}）`)
  assert.equal(state.ledger.warn, true, "warn 判位：deadExecutors>0（裁定 #7——await 判活后重算）")
})


// ── T106 状态行接线（AC87/F2） ──────────────────────────────────────────────
test("T106 正常：空标记零注入（字节等价）；非空在位（scrollHint 后、键位组前）；warn 色段", () => {
  const base = baseState()
  const off = renderStatus(base, agentStub(), 80, [])
  assert.equal(renderStatus({ ...base, ledger: { marker: null, warn: false, scannedAt: 0 } }, agentStub(), 80, []), off, "空标记 = 零字节注入")
  const on = renderStatus({ ...base, ledger: { marker: "台账 4·32", warn: false } }, agentStub(), 80, [])
  assert.ok(stripAnsi(on).includes(" │ 台账 4·32"))
  const scrolled = renderStatus({ ...base, scroll: 7, ledger: { marker: "台账 4·32", warn: false } }, agentStub(), 80, [])
  const text = stripAnsi(scrolled)
  assert.ok(text.indexOf("scrolled 7") < text.indexOf(" │ 台账 4·32"), "位于 scrollHint 后（状态段簇尾）")
  assert.ok(text.indexOf(" │ 台账 4·32") < text.indexOf("Enter"), "位于键位组前")
  const warn = renderStatus({ ...base, ledger: { marker: "台账 4·32", warn: true } }, agentStub(), 80, [])
  assert.ok(warn.includes(`${C.warn}台账 4·32`), "警示色段包裹")
})

// ── T109 项目发现（AC88/F4） ────────────────────────────────────────────────
test("T109 边界：深路径 / 容器目录 / 全无台账", () => {
  for (const name of ["alpha", "beta"]) {
    mkdirSync(join(tmp, "ws", name), { recursive: true })
    openLedger(join(tmp, "ws", name), { create: true }).close()
  }
  mkdirSync(join(tmp, "ws", "cont"), { recursive: true })
  assert.equal(findProject(join(tmp, "ws", "alpha", "src", "deep")).root, join(tmp, "ws", "alpha"), "①向上（含自身）最近含台账目录")
  const fam = discoverFamily(join(tmp, "ws", "alpha", "docs", "x"))
  assert.deepStrictEqual(fam.projects.map((p) => p.root), [join(tmp, "ws", "alpha"), join(tmp, "ws", "beta")], "项目集 = current + 同级含台账者（升序）")
  const cont = discoverFamily(join(tmp, "ws", "cont"))
  assert.equal(cont.current, null, "②容器目录 → current=null")
  assert.deepStrictEqual(cont.projects.map((p) => p.root), [join(tmp, "ws", "alpha"), join(tmp, "ws", "beta")], "②候选集 = 子目录族")
  const cur2 = discoverFamily(join(tmp, "ws", "beta", "src"))
  assert.deepStrictEqual(cur2.projects.map((p) => p.root), [join(tmp, "ws", "beta"), join(tmp, "ws", "alpha")], "发现序：current 在前（字典序在后仍居首——判别夹具）")
  // ③ 全无台账：锚 = 系统盘根下**全链不存在的幽灵路径**——全链零台账（环境自持）。
  //    旧夹具以 tmpdir 子目录为锚，父链扫描会命中并行用例在 %TEMP% 遗留的 ledger-* 台账目录 → 假红
  //    （test:full 并行下实测复现）；幽灵链任何时刻不随环境漂移，断言强度不变（仍要求 current=null + projects=[]）。
  const ghost = join(parse(tmpdir()).root, "thincoder-zero-ledger-probe", "deep", "nested")
  const none = discoverFamily(ghost)
  assert.equal(none.current, null, "③无任何台账 → current=null")
  assert.deepStrictEqual(none.projects, [], "③projects=[]（零输出前提）")
})

// ── T110 降级不崩（AC89/N1+N2） ─────────────────────────────────────────────
test("T110 错误：降级不崩——不可读台账跳过 / 坏 JSON 空态 / 无候选不计老化 / 缺目录可建", async () => {
  // ① 台账库不可读（坏字节）→ 该项目跳过、零抛出（正常项目先证照常）
  const ok = await drive({ rows: [{ row: poolRow("甲") }, { row: poolRow("乙") }] })
  assert.equal(ok.lines.length, 2, "正常项目照常出启动行（明细行集）")
  const bad = join(tmp, "fam", String(famSeq++), "proj")
  mkdirSync(bad, { recursive: true })
  writeFileSync(ledgerDbPath(bad), "not a sqlite db")
  const state = { processing: false }
  const lines = []
  await runLedgerScan({ state, anchor: bad, notifyFile: join(dirname(bad), "n.json"), pushLine: (t) => lines.push(t), startup: true })
  assert.deepStrictEqual(lines, [], "读取失败 → 该项目跳过（不抛）")
  assert.equal(state.ledger.marker, null, "被跳过的项目不进状态位")
  // ② 去重档坏 JSON → 空态（按空档重新记账——最坏一次重报）
  const notifyFile = mk("fam2/broken.json", "{ not json")
  assert.deepStrictEqual(loadNotifyState(notifyFile), { version: 1, ledgers: {} })
  assert.equal(saveNotifyState(join(tmp, "no-such-dir", "n.json"), { version: 1, ledgers: {} }), true, "临时目录可建（temp + rename）")
  // ③ 无老化候选项（trigger 条目豁免）→ 零变化行、标记照显（SQLite 时间戳源——无 git 子进程路径）
  const tr = await drive({ rows: [{ row: techRow("丙", "认账不排期"), ageDays: 40 }] })
  assert.deepStrictEqual(tr.lines, [], "带触发 → 不计老化（零变化行）")
  assert.equal(tr.state.ledger.marker, "台账 0·1", "技术计数照常（trigger 条目计入）")
  assert.equal(tr.state.ledger.warn, false, "无老化 → 默认色")
})

// ── T102 老化界值（快层——时间戳纯计算；buildScan 时间戳源替代 v1 git blame） ──
test("T102 边界：老化界值（29 / 31 天 + 触发表态；created_at 时间戳源）", () => {
  const proj = mkLedgerAt(join(tmp, "proj"), [
    { row: techRow("甲"), ageDays: 29 },
    { row: techRow("乙"), ageDays: 31 },
    { row: techRow("丙", "认账不排期"), ageDays: 31 },
  ])
  const s = buildScan({ cwd: proj })
  assert.equal(s.aged, 1, `仅「31 天且无触发」计老化（实得 ${s.aged}）`)
  assert.ok(s.agedKeys[0].includes("乙"), "老化键 = 该条目")
  // 行龄未知（时间戳 NULL）→ 不计且不抛
  const db = openLedger(proj, { create: true })
  db.prepare("UPDATE items SET created_at = NULL, updated_at = NULL WHERE title = ?").run(techEntry("乙"))
  db.close()
  assert.equal(buildScan({ cwd: proj }).aged, 0, "行龄未知 → 不计且不抛")
})

// ── AC89 批级：单次刷新成本（慢层——两项目族，SQLite 时间戳路径） ────────────
slow("AC89 批级：单次刷新 ≤500ms（两项目族 + SQLite 行集）", async () => {
  const family = join(tmp, "ws")
  for (const name of ["alpha", "beta"]) {
    const rows = [
      { row: poolRow("甲") },
      ...Array.from({ length: 10 }, (_, i) => ({ row: techRow(`T${i}`) })),
    ]
    mkLedgerAt(join(family, name), rows)
  }
  const state = { processing: false }
  const t0 = Date.now()
  await runLedgerScan({ state, anchor: join(family, "alpha"), notifyFile: join(family, "n.json"), pushLine: () => {}, startup: true })
  const dt = Date.now() - t0
  assert.ok(dt <= 500, `单次刷新 ${dt}ms ≤ 500ms（两项目族——SQLite）`)
  assert.equal(state.ledger.marker, "台账 1·10", "扫描结果到位（非空转）")
})

// ── LS1–LS3 端壳句柄契约（#233——恒同步返回 `{ dispose }`） ─────────────────────

test("LS-1 正常：`startLedgerSurface({})` 返回具 `dispose` 函数；调用不抛（核可载入）", async () => {
  const h = startLedgerSurface({}) // 原生载核（真核可载入——动态 import）
  assert.equal(typeof h.dispose, "function", "返回值具 dispose 函数（同步句柄形）")
  assert.doesNotThrow(() => h.dispose(), "dispose() 不抛")
  await new Promise((r) => setTimeout(r, 20))
})

test("LS-2 错误：核载入失败 ⇒ 同形空句柄；`dispose()` 不抛（N1 降级不崩）", async () => {
  _setLoadCoreForTest(() => Promise.reject(new Error("load failed")))
  const h = startLedgerSurface({})
  assert.equal(typeof h.dispose, "function", "载入失败仍返回句柄（空）")
  assert.doesNotThrow(() => h.dispose(), "空句柄 dispose() 不抛")
  await new Promise((r) => setTimeout(r, 10)) // 拒绝路径不产生 unhandled rejection
})

test("LS-3 边界：`dispose()` 先于核就绪（载入挂起）⇒ 置位且跳过启动（核侧零调用 / 零周期）", async () => {
  let resolveCore
  const pending = new Promise((r) => { resolveCore = r })
  _setLoadCoreForTest(() => pending)
  let started = 0
  const h = startLedgerSurface({})
  h.dispose() // 先于载入完成——置位
  resolveCore({ startLedgerSurface: () => { started += 1; return { dispose() {} } }, runLedgerScan: async () => {} })
  await new Promise((r) => setTimeout(r, 10))
  assert.equal(started, 0, "已置位 ⇒ 跳过启动：核 startLedgerSurface 零调用（零周期）")
  assert.doesNotThrow(() => h.dispose(), "置位后重复 dispose 幂等不抛")
})
