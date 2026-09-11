/**
 * ledger-surface.test.mjs — 台账可见面用例（LEDGER-SURFACE 批——设计档 §3.2 T97–T110 / §3.1 AC80–AC90）。
 * 面：数字单源等价（T97）· 行文本逐字（T98/T99）· 启动行门（T100）· 阈值三例（T101）· 老化界值（T102 慢层）·
 * 去重 + 送达门 + 条目键稳定（T103）· 收口行命令（T104）· 提示词槽位（T105）· 状态行接线（T106）·
 * 项目发现（T109）· 降级不崩（T110）。
 * 手法：夹具台账（tmp）+ 注入 `ageOf`（确定性——真 git 走 slow 层）+ 直驱 `runLedgerScan` / `renderStatus`。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync, execFileSync } from "node:child_process"
import { slow } from "./slow.mjs"
import { blameAges, discoverFamily, entryTitle, findProject, formatAgingLine, formatDetailLine, formatMarker, formatThresholdLine, loadNotifyState, normalizeEntry, notifyKey, planChangeLines, saveNotifyState, summarizeLedger } from "../src/ledger.mjs"
import { runLedgerScan } from "../src/tui/ledger-surface.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { C } from "../src/tui/ansi.mjs"
import { main as ledgerMain, runCheck } from "../scripts/check-ledger.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CLI = join(REPO, "scripts", "check-ledger.mjs")
const pr = (p) => join(REPO, p)
const ws = (p) => resolve(REPO, "..", p)
const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")
const lineOf = (text, needle) => text.split("\n").findIndex((l) => l.includes(needle)) + 1
let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "ledger-surface-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

const mk = (rel, content) => { const abs = join(tmp, rel); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); return abs }
const poolEntry = (name, board = "FOO.md") => `- [ ] **${name}** → 需求 \`docs/requirements/${board}\` §1.13 · 任务书 \`docs/batches/B.md\` §2 · status=待讨论`
const techEntry = (name, evidence = "src/a.mjs:1") => `- [ ] **${name}** → 证据 \`${evidence}\``
const ledgerText = (pool, tech) => ["# t", "", `## 需求池（${pool.length} 条）`, "", ...pool, "", `## 技术待办（${tech.length} 条）`, "", ...tech, ""].join("\n")

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

/** 单项目夹具族（族根 = tmp 下）驱动 runLedgerScan：agedNames 指定计老化的条目名。 */
function drive({ pool = [], tech = [], agedNames = [], startup = true, ageOf = null, failPush = false } = {}) {
  const family = join(tmp, "fam")
  const proj = join(family, "proj")
  const text = ledgerText(pool, tech)
  const abs = mk(join("fam", "proj", "docs", "TODO.md"), text)
  const autoAge = () => new Map(agedNames.map((n) => [lineOf(text, `**${n}**`), 40]))
  const state = { processing: false }
  const lines = []
  runLedgerScan({
    state, anchor: proj, notifyFile: join(family, "notify.json"),
    pushLine: (t) => { if (failPush) throw new Error("push failed"); lines.push(t) },
    ageOf: ageOf ?? autoAge, startup,
  })
  return { state, lines, abs, proj, notifyFile: join(family, "notify.json") }
}

// ── T97 数字单源（AC80/F7） ─────────────────────────────────────────────────
test("T97 正常/反证：summarizeLedger 计数 == checkLedger L2 实得（改动同步变——非空转）", () => {
  mk("docs/requirements/FOO.md", "# 需求\n\n## 1.13 台账\n")
  mk("docs/batches/B.md", "# 批次\n\n## §2 任务\n")
  const abs = mk("docs/TODO.md", ledgerText([poolEntry("甲"), poolEntry("乙")], [techEntry("丙"), techEntry("丁")]))
  const count = () => summarizeLedger({ root: tmp, ledger: abs }, { ageOf: () => null })
  const l2 = () => runCheck({ root: tmp, ledgers: ["docs/TODO.md"], baseline: new Set() }).fresh.filter((v) => v.kind === "L2")
  assert.equal(count().pool, 2, "池计数 = 组内未决条目数")
  assert.equal(count().tech, 2, "技术计数 = 组内未决条目数")
  assert.deepStrictEqual(l2(), [], "声明 == 实得（两侧同口径）")
  writeFileSync(abs, ledgerText([poolEntry("甲"), poolEntry("乙"), poolEntry("丙")], [techEntry("丁"), techEntry("戊")]))
  assert.equal(count().pool, 3, "加一条 → 两侧同步变")
  assert.equal(count().tech, 2)
  assert.deepStrictEqual(l2(), [])
  writeFileSync(abs, ledgerText([poolEntry("甲")], [techEntry("丙")]).replace("需求池（1 条）", "需求池（5 条）"))
  assert.equal(count().pool, 1, "计数口径 = 实得（不读声明）")
  assert.equal(l2().length, 1, "机检报红（声明 5 ≠ 实得 1——反证非空转）")
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
    name: "thincoder", root: "/x", ledger: "/x/docs/TODO.md", pool: 2, tech: 5, aged: 0,
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
test("T100 边界：启动行门——可动作（aged>0 / 阈值）出 L2 行；不可动作 → 会话流零行、标记照显", () => {
  const a = drive({ tech: [techEntry("丙")], agedNames: ["丙"] })
  assert.equal(a.lines.length, 2, JSON.stringify(a.lines))
  assert.equal(a.lines[0], "台账变化：proj 老化首次越线 1 条（超 30 天未处置）：丙", "先变化行")
  assert.equal(a.lines[1], "台账 proj：需求池 0 · 技术待办 1（老化 1）", "后明细行（每项目一行）")

  const b = drive({ pool: [poolEntry("甲"), poolEntry("乙")] })
  assert.equal(b.lines.length, 2, JSON.stringify(b.lines))
  assert.equal(b.lines[0], "台账变化：proj 需求池达阈值（2 条）— 可开批", "首达阈带 L4")
  assert.equal(b.lines[1], "台账 proj：需求池 2 · 技术待办 0（老化 0） — 可开批")

  const c = drive({ pool: [poolEntry("甲")] })
  assert.deepStrictEqual(c.lines, [], "不可动作 → 会话流零行")
  assert.equal(c.state.ledger.marker, "台账 1·0", "常驻标记不受此门约束（F2 照显）")
  assert.equal(c.state.ledger.warn, false, "aged=0 → 默认色")
})

test("T101 边界：阈值三例（同板块 2 达阈 / 池 3 达阈 / 跨两档各 1 不达阈）", () => {
  const thr = (pool) => summarizeLedger({ root: tmp, ledger: mk("docs/TODO.md", ledgerText(pool, [])) }, { ageOf: () => null }).thresholdReached
  assert.equal(thr([poolEntry("甲"), poolEntry("乙")]), true, "①同板块 2 → 达阈")
  assert.equal(thr([poolEntry("甲", "FOO.md"), poolEntry("乙", "BAR.md"), poolEntry("丙", "BAZ.md")]), true, "②池 3 → 达阈")
  assert.equal(thr([poolEntry("甲", "FOO.md"), poolEntry("乙", "BAR.md")]), false, "③跨两档各 1 → 不达阈")
})

// ── T103 去重 + 送达门 + 条目键稳定（AC85/F5） ──────────────────────────────
test("T103 正常：首扫记账 → 重扫 0 行；位移/他条编辑 0 行；同条文本编辑 1 行；未送达不记账", () => {
  const proj = join(tmp, "fam", "proj")
  const abs = mk(join("fam", "proj", "docs", "TODO.md"), ledgerText([poolEntry("甲"), poolEntry("乙")], [techEntry("丙")]))
  const notifyFile = join(tmp, "fam", "notify.json")
  const state = { processing: false }
  const ageAll = (file) => new Map(readFileSync(file, "utf8").split("\n").map((_, i) => [i + 1, 40]))
  let failPush = false
  const scan = () => {
    const lines = []
    runLedgerScan({ state, anchor: proj, notifyFile, pushLine: (t) => { if (failPush) throw new Error("push failed"); lines.push(t) }, ageOf: ageAll })
    return lines
  }
  const first = scan()
  assert.deepStrictEqual(first, [
    "台账变化：proj 老化首次越线 1 条（超 30 天未处置）：丙",
    "台账变化：proj 需求池达阈值（2 条）— 可开批",
  ], "首扫：L3 + L4（变化行在前）")
  assert.deepStrictEqual(scan(), [], "再扫同状态 → 0 行（一次性去重）")
  const entry = loadNotifyState(notifyFile).ledgers[notifyKey(abs)]
  assert.ok(entry && entry.threshold === true && entry.aged.length === 1, "送达后记账（aged + threshold）")

  // 他条编辑（非老化条）：键不变 → 0 行
  writeFileSync(abs, readFileSync(abs, "utf8").replace("**甲** →", "**甲注** →"))
  assert.deepStrictEqual(scan(), [], "他条编辑 → 键稳定（0 行）")
  // 行位移：头部插一行 → 键不变 → 0 行
  writeFileSync(abs, "\n" + readFileSync(abs, "utf8"))
  assert.deepStrictEqual(scan(), [], "行位移 → 键稳定（0 行）")
  // 同条文本变更 → 键变 = 一次新增
  writeFileSync(abs, readFileSync(abs, "utf8").replace("**丙**", "**丙改**"))
  assert.equal(scan().length, 1, "同条文本变更 → 1 行（新键）")
  assert.deepStrictEqual(scan(), [], "新键亦去重")
  // 送达门：push 失败不记账 → 补送达重报
  writeFileSync(abs, readFileSync(abs, "utf8").replace("**丙改**", "**丙改2**"))
  failPush = true
  assert.deepStrictEqual(scan(), [], "未送达（push 抛错）→ 无行入流")
  assert.equal(loadNotifyState(notifyFile).ledgers[notifyKey(abs)].aged.length, 1, "未送达不记账（档内仍为旧态）")
  failPush = false
  assert.equal(scan().length, 1, "补送达 → 重报（用户不丢事件）")
  assert.deepStrictEqual(scan(), [], "送达后记账 → 归零")
})

test("T103 边界：跨端去重档键——绝对路径·正斜杠 + 盘符大写（session-slots normalizeCwd 同契约）", () => {
  // 盘符 = Windows 概念（POSIX 下 `d:\…` 非绝对路径——归一规则不适用）：断言按平台守卫（VSC CI = ubuntu-latest）
  if (process.platform === "win32") {
    const lower = "d:\\teamcode\\thincoder\\docs\\TODO.md"
    const upper = "D:\\teamcode\\thincoder\\docs\\TODO.md"
    assert.equal(notifyKey(lower), notifyKey(upper), "盘符大小写 → 同键（CLI process.cwd() 大写 / VSC uri.fsPath 小写——F5 跨端去重前提）")
    assert.equal(notifyKey(lower), "D:/teamcode/thincoder/docs/TODO.md", "盘符大写 + 正斜杠（逐字）")
  }
  assert.ok(!notifyKey(join(tmp, "docs", "TODO.md")).includes("\\"), "无反斜杠（跨端共享档——全平台）")
})

// ── T104 收口行命令（AC86/F6） ─────────────────────────────────────────────
const cliFamily = () => {
  const family = join(tmp, "ws")
  for (const [name, pool, tech] of [["alpha", [poolEntry("甲")], [techEntry("丙")]], ["beta", [], []]]) {
    mkdirSync(join(family, name, "docs"), { recursive: true })
    writeFileSync(join(family, name, "docs", "TODO.md"), ledgerText(pool, tech))
  }
  return family
}
const FAMILY_ROWS = ["台账 alpha：需求池 1 · 技术待办 1（老化 0）", "台账 beta：需求池 0 · 技术待办 0（老化 0）"]

test("T104 正常：`--summary` 输出 = L2 序列逐字 + 退出码 0 + 台账字节不变（main 直驱）", () => {
  const family = cliFamily()
  const ledgerAbs = join(family, "alpha", "docs", "TODO.md")
  const before = readFileSync(ledgerAbs)
  const out = []
  assert.equal(ledgerMain(["--summary", "--root", join(family, "alpha")], { log: (l) => out.push(l) }), 0, "退出码 0（main 返回值）")
  assert.deepStrictEqual(out, FAMILY_ROWS, "L2 序列逐字（每项目一行——current 在前、同级按目录名升序）")
  assert.ok(before.equals(readFileSync(ledgerAbs)), "运行前后台账字节不变（只读）")
})

slow("T104b 正常：真命令冒烟（子进程）+ 空族提示", () => {
  const family = cliFamily()
  const r = spawnSync(process.execPath, [CLI, "--summary", "--root", join(family, "alpha")], { encoding: "utf8" })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.deepStrictEqual(r.stdout.trim().split("\n"), FAMILY_ROWS, "真命令行输出 = L2 序列")
  // 空族（隔离目录：parent 超同级枚举上限 → 零候选——本机 tmp 为大目录）
  const iso = mkdtempSync(join(tmpdir(), "ledger-iso-"))
  try {
    const e = spawnSync(process.execPath, [CLI, "--summary", "--root", iso], { encoding: "utf8" })
    assert.equal(e.status, 0)
    assert.equal(e.stdout.trim(), "台账：未发现台账（docs/TODO.md）。", "空族提示（仅命令面）")
  } finally { rmSync(iso, { recursive: true, force: true }) }
})

// ── T105 收口行槽位文本面（AC86） ───────────────────────────────────────────
test("T105 正常：四提示词两锚在位（`台账可见面（收口行）` + `--summary`）+ 脚本名零命中", () => {
  const prompts = [
    pr("src/prompts/discipline-engineering.md"), pr("docs/design/prompts/discipline-engineering.md"),
    ws("thincoder-vscode/src/prompts/discipline-engineering.md"), ws("thincoder-vscode/docs/design/prompts/discipline-engineering.md"),
  ]
  for (const f of prompts) {
    const t = readFileSync(f, "utf8")
    assert.ok(t.includes("台账可见面（收口行）"), f + "：槽位锚缺失")
    assert.ok(t.includes("--summary"), f + "：`--summary` 锚缺失")
    assert.ok(!t.includes("check-ledger"), f + "：脚本名不得进提示词（FR13）")
  }
  for (const f of [pr("docs/requirements/ENGINEERING-MODE.md"), pr("docs/design/ENGINEERING-MODE.md")]) {
    assert.ok(readFileSync(f, "utf8").includes("台账可见面（收口行）"), f + "：枚举同步锚缺失")
  }
  for (const dir of [pr("src/prompts"), ws("thincoder-vscode/src/prompts")]) {
    for (const f of readdirSync(dir)) {
      assert.ok(!readFileSync(join(dir, f), "utf8").includes("check-ledger"), `${dir}/${f}：脚本名零命中（AC48/AC80 口径不动）`)
    }
  }
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
  const ix = readFileSync(new URL("../src/tui/index.mjs", import.meta.url), "utf8")
  assert.ok(ix.includes("startLedgerSurface({ state, agent, pushLine, render })"), "TUI 挂载接线在位")
  assert.ok(ix.includes("ledger: { marker: null, warn: false, scannedAt: 0 }"), "state 位在位")
})

// ── T109 项目发现（AC88/F4） ────────────────────────────────────────────────
test("T109 边界：深路径 / 容器目录 / 全无台账", () => {
  for (const name of ["alpha", "beta"]) mk(`ws/${name}/docs/TODO.md`, ledgerText([], []))
  mkdirSync(join(tmp, "ws", "cont"), { recursive: true })
  assert.equal(findProject(join(tmp, "ws", "alpha", "src", "deep")).root, join(tmp, "ws", "alpha"), "①向上（含自身）最近含台账目录")
  const fam = discoverFamily(join(tmp, "ws", "alpha", "docs", "x"))
  assert.deepStrictEqual(fam.projects.map((p) => p.root), [join(tmp, "ws", "alpha"), join(tmp, "ws", "beta")], "项目集 = current + 同级含台账者（升序）")
  const cont = discoverFamily(join(tmp, "ws", "cont"))
  assert.equal(cont.current, null, "②容器目录 → current=null")
  assert.deepStrictEqual(cont.projects.map((p) => p.root), [join(tmp, "ws", "alpha"), join(tmp, "ws", "beta")], "②候选集 = 子目录族")
  const cur2 = discoverFamily(join(tmp, "ws", "beta", "src"))
  assert.deepStrictEqual(cur2.projects.map((p) => p.root), [join(tmp, "ws", "beta"), join(tmp, "ws", "alpha")], "发现序：current 在前（字典序在后仍居首——判别夹具）")
  const iso = mkdtempSync(join(tmpdir(), "ledger-iso-"))
  try {
    const none = discoverFamily(join(iso, "deep", "nested"))
    assert.equal(none.current, null, "③无任何台账 → current=null")
    assert.deepStrictEqual(none.projects, [], "③projects=[]（零输出前提）")
  } finally { rmSync(iso, { recursive: true, force: true }) }
})

// ── T110 降级不崩（AC89/N1+N2） ─────────────────────────────────────────────
test("T110 错误：降级不崩——不可读项目跳过 / 坏 JSON 空态 / 无候选不跑 git / headless 零接线", () => {
  // ① ageOf 抛错（模拟读取失败路径）→ 该项目跳过、余者照常、零抛出
  const ok = drive({ pool: [poolEntry("甲"), poolEntry("乙")] })
  assert.equal(ok.lines.length, 2, "正常项目照常出启动行（明细行集）")
  const bad = drive({ tech: [techEntry("丙")], ageOf: () => { throw new Error("boom") } })
  assert.deepStrictEqual(bad.lines, [], "读取失败 → 该项目跳过（不抛）")
  assert.equal(bad.state.ledger.marker, null, "被跳过的项目不进状态位")
  // ② 去重档坏 JSON → 空态（按空档重新记账——最坏一次重报）
  const notifyFile = mk("fam/broken.json", "{ not json")
  assert.deepStrictEqual(loadNotifyState(notifyFile), { version: 1, ledgers: {} })
  assert.equal(saveNotifyState(join(tmp, "no-such-dir", "n.json"), { version: 1, ledgers: {} }), true, "临时目录可建（temp + rename）")
  const again = drive({ tech: [techEntry("丙")], agedNames: ["丙"] })
  assert.equal(again.lines.length, 2, "坏档 → 重报（事件不丢）")
  // ③ 无候选条目不跑 git（计数断言）——有候选时恰一次
  let calls = 0
  const counted = () => { calls++; return null }
  summarizeLedger({ root: tmp, ledger: mk("c1/docs/TODO.md", ledgerText([], ["- [ ] **X** → 证据 `src/x.mjs:1` · 触发=归批（第 8 批）"])) }, { ageOf: counted })
  assert.equal(calls, 0, "无候选 → 零 git 子进程")
  summarizeLedger({ root: tmp, ledger: mk("c2/docs/TODO.md", ledgerText([], [techEntry("Y")])) }, { ageOf: counted })
  assert.equal(calls, 1, "有候选 → 恰一次全档 blame")
  // ④ headless 零接线（文件域判据）：bin 入口内零台账面
  assert.ok(!readFileSync(pr("bin/thincoder.mjs"), "utf8").includes("ledger"), "bin/thincoder.mjs 内 `ledger` 零命中（零接线）")
})

// ── T102 老化界值（慢层——真 git 夹具；commit 日期钉常量） ──────────────────
slow("T102 边界：老化界值（29 / 31 天 + 触发表态；commit 日期钉常量）", () => {
  const abs = mk("docs/TODO.md", ledgerText([], [techEntry("甲")]))
  const git = (args, env = {}) => execFileSync("git", args, { cwd: tmp, stdio: "ignore", env: { ...process.env, ...env } })
  git(["init", "-q"]); git(["config", "user.email", "t@example.com"]); git(["config", "user.name", "t"])
  const commit = (daysAgo) => {
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString()
    git(["add", "-A"]); git(["commit", "-qm", "c"], { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date })
  }
  commit(29) // 甲：29 天——不计
  const text1 = readFileSync(abs, "utf8")
  writeFileSync(abs, text1 + techEntry("乙") + "\n")
  commit(31) // 乙：31 天——计
  const text2 = readFileSync(abs, "utf8")
  writeFileSync(abs, text2 + techEntry("丙") + " · 触发=认账不排期" + "\n")
  commit(31) // 丙：31 天但带触发——不计
  const s = summarizeLedger({ root: tmp, ledger: abs })
  assert.equal(s.aged, 1, `仅「31 天且无触发」计老化（实得 ${s.aged}）`)
  assert.ok(s.agedKeys[0].includes("乙"), "老化键 = 该条目")
  const ages = blameAges(abs)
  assert.ok(ages.get(lineOf(readFileSync(abs, "utf8"), "**甲**")) < 30, "29 天条不计（界值下侧）")
  assert.ok(ages.get(lineOf(readFileSync(abs, "utf8"), "**乙**")) > 30, "31 天条计（界值上侧）")
  // 行龄未知（非 git 目录）→ 不计且不抛
  const plain = join(tmp, "plain", "docs", "TODO.md")
  mkdirSync(dirname(plain), { recursive: true })
  writeFileSync(plain, ledgerText([], [techEntry("丁")]))
  assert.equal(blameAges(plain), null, "非 git → null（零假阳降级）")
  assert.equal(summarizeLedger({ root: join(tmp, "plain"), ledger: plain }).aged, 0, "行龄未知 → 不计且不抛")
})

// ── AC89 批级：单次刷新成本（慢层——真 git 夹具；两仓同口径） ────────────────
slow("AC89 批级：单次刷新 ≤500ms（两项目族 + 真 blameAges 路径）", () => {
  const family = join(tmp, "ws")
  for (const name of ["alpha", "beta"]) {
    const tech = Array.from({ length: 10 }, (_, i) => techEntry(`T${i}`, `src/f${i}.mjs:${i + 1}`))
    mkdirSync(join(family, name, "docs"), { recursive: true })
    writeFileSync(join(family, name, "docs", "TODO.md"), ledgerText([poolEntry("甲")], tech))
  }
  const git = (args) => execFileSync("git", args, { cwd: tmp, stdio: "ignore" })
  git(["init", "-q"]); git(["config", "user.email", "t@example.com"]); git(["config", "user.name", "t"])
  git(["add", "-A"]); git(["commit", "-qm", "c"])
  const state = { processing: false }
  const t0 = Date.now()
  runLedgerScan({ state, anchor: join(family, "alpha"), notifyFile: join(family, "n.json"), pushLine: () => {}, startup: true })
  const dt = Date.now() - t0
  assert.ok(dt <= 500, `单次刷新 ${dt}ms ≤ 500ms（两项目族——真 git blame）`)
  assert.equal(state.ledger.marker, "台账 1·10", "扫描结果到位（非空转）")
})
