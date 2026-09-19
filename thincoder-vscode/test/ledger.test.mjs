/**
 * ledger.test.mjs — VSC 台账可见面用例（M2 SQLite 台账批——设计档
 * docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §3 测试层（AC-1..7 / T1–T10）；
 * 用例编号 T97–T110 / AC80–AC90 = v1 可见面设计遗留编号（保号不改名——原设计面已随 M2 收敛入模块设计档 §2.2）；VSC 端）。
 * 面：数据面 / 机制面归核（`@thincoder/core/ledger.mjs` + `ledger-surface.mjs`——W4 单源）· 跨端去重档键等价 ·
 * item 形态（T107）· webview 渲染（T108，真 chat.js + happy-dom）· 启动行 post 门 + 送达门 · 接线机检 · 老化界值。
 * 手法：tmp SQLite 夹具（ledgerAdd + 时间戳回拨——替代 v1 ageOf git blame 注入面）；vscode-mock（`test/vscode-mock`）。
 * 归册（M2 重写）：T107 观测 619ms——slow() 门控；AC89 归册 slow 层（计时用例）；T102 改快层（时间戳纯计算，无 git）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, parse } from "node:path"
import * as vscode from "vscode"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import files from "./files.mjs"
import { slow } from "./slow.mjs"
import {
  buildScan, entryTitle, formatAgingLine, formatDetailLine, formatMarker, formatThresholdLine,
  ledgerAdd, ledgerDbPath, loadNotifyState, normalizeEntry, notifyKey, openLedger, planChangeLines,
  _resetLedgerDirForTest, _setLedgerDirForTest,
} from "@thincoder/core/ledger.mjs"
import { _setLedgerSurfaceForTest, dispose as disposeLedgerSurface, initLedgerSurface, pushLedgerStartup, refreshLedger } from "../src/extension/ledger-surface.mjs"

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-vsc-"))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
})
afterEach(() => {
  _resetLedgerDirForTest()
  disposeLedgerSurface()
  _setLedgerSurfaceForTest({ notifyFile: undefined, cwd: undefined })
  vscode.window.statusBarItems.length = 0
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

/** 假 panel：捕获 post（`_wvReady` 控制就绪门）。 */
const fakePanel = ({ ready = true } = {}) => {
  const posted = []
  return { posted, _wvReady: ready, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}

// ── 语义同源（计数 / 阈值 / 行文本 / 去重） ─────────────────────────────────
test("T97/T101 正常/边界：buildScan 计数与阈值口径（同板块 2 / 池 ≥3 / 跨档各 1 不达阈；trigger 计入技术计数）", () => {
  const proj = mkLedgerAt(join(tmp, "proj"), [
    { row: poolRow("甲") }, { row: poolRow("乙") },
    { row: techRow("丙") }, { row: techRow("丁", "归批") },
  ])
  const s = buildScan({ cwd: proj })
  assert.equal(s.pool, 2)
  assert.equal(s.tech, 2, "trigger 条目计入技术计数")
  assert.equal(s.thresholdReached, true, "同板块 2 → 达阈")
  const thr = (rel, pool) => buildScan({ cwd: mkLedgerAt(join(tmp, rel), pool.map((row) => ({ row }))) }).thresholdReached
  assert.equal(thr("p2", [poolRow("甲", "FOO.md"), poolRow("乙", "BAR.md"), poolRow("丙", "BAZ.md")]), true, "池 3 → 达阈")
  assert.equal(thr("p3", [poolRow("甲", "FOO.md"), poolRow("乙", "BAR.md")]), false, "跨两档各 1 → 不达阈")
})

test("T99 正常：L1–L4 行文本逐字（VSC 端同 formatter——` — 可开批` / `；…` / 回退标题）", () => {
  const scan = (over) => ({
    name: "thincoder-vscode", root: "/x", ledger: "/x/ledger.db", pool: 3, tech: 9, aged: 0,
    agedKeys: [], agedTitles: [], thresholdReached: false, boards: new Map(), actionable: false, ...over,
  })
  assert.equal(formatMarker(scan()), "台账 3·9")
  assert.equal(formatDetailLine(scan()), "台账 thincoder-vscode：需求池 3 · 技术待办 9（老化 0）")
  assert.equal(formatDetailLine(scan({ thresholdReached: true })), "台账 thincoder-vscode：需求池 3 · 技术待办 9（老化 0） — 可开批")
  assert.equal(formatAgingLine(scan(), ["甲", "乙"]), "台账变化：thincoder-vscode 老化首次越线 2 条（超 30 天未处置）：甲；乙")
  assert.equal(formatAgingLine(scan(), ["甲", "乙", "丙", "丁"]), "台账变化：thincoder-vscode 老化首次越线 4 条（超 30 天未处置）：甲；乙；丙；…")
  assert.equal(formatThresholdLine(scan()), "台账变化：thincoder-vscode 需求池达阈值（3 条）— 可开批")
  const long = "- [ ] 无粗体段落文本一二三四五六七八九十十一十二十三"
  assert.equal(entryTitle(long), normalizeEntry(long).slice(0, 20) + "…", "无粗体段 → 归一化文本前 20 字")
})

test("T103 正常：去重 + 条目键稳定 + 跨端键等价（CLI 写的键本端逐字认得）", () => {
  const scan = {
    name: "p", root: "/p", ledger: "/p/ledger.db", pool: 0, tech: 1, aged: 1,
    agedKeys: [normalizeEntry("- [ ] **丙** → 证据 `src/a.mjs:1`")], agedTitles: ["丙"],
    thresholdReached: false, boards: new Map(), actionable: true,
  }
  assert.equal(planChangeLines(undefined, scan).lines.length, 1, "首扫：老化事件 1 行")
  assert.deepStrictEqual(planChangeLines({ aged: scan.agedKeys, threshold: false }, scan).lines, [], "已记账 → 0 行（一次性去重）")
  const moved = { ...scan, agedKeys: [normalizeEntry("- [ ] **丙**  → 证据 `src/a.mjs:1`")] }
  assert.equal(planChangeLines({ aged: scan.agedKeys }, moved).lines.length, 0, "位移 / 空白折叠 → 同键")
  assert.equal(planChangeLines({ aged: scan.agedKeys }, { ...scan, agedKeys: [normalizeEntry("- [ ] **丙改** → 证据 `src/a.mjs:1`")] }).lines.length, 1, "文本变更 → 新键 = 一次新增")
  // 跨端：绝对路径·正斜杠 + **盘符大写**（session-slots `normalizeCwd` 同契约——CLI `process.cwd()` 大写 / 本端 `uri.fsPath` 小写须同键）
  //  盘符 = Windows 概念（POSIX 下 `d:\…` 非绝对路径——归一规则不适用）：盘符断言按平台守卫（本仓 CI = ubuntu-latest）
  const ledger = join(tmp, "ledger.db")
  assert.ok(!notifyKey(ledger).includes("\\"), "无反斜杠（跨端共享档——全平台）")
  if (process.platform === "win32") {
    const lower = "d:\\teamcode\\thincoder\\ledger.db"
    const upper = "D:\\teamcode\\thincoder\\ledger.db"
    assert.equal(notifyKey(lower), notifyKey(upper), "盘符大小写 → 同键（F5 跨端去重前提）")
    assert.equal(notifyKey(lower), "D:/teamcode/thincoder/ledger.db", "盘符大写 + 正斜杠（逐字）")
  }
})

// ── T107 item 形态（AC87/F8） ───────────────────────────────────────────────
slow("T107 正常：item text = L1 / tooltip = 明细行集 / aged>0 → warningBackground / 无台账 → hide", async () => {
  const alpha = mkLedgerAt(join(tmp, "ws", "alpha"), [
    { row: poolRow("甲") }, { row: poolRow("乙") }, { row: techRow("丙"), ageDays: 40 },
  ])
  _setLedgerSurfaceForTest({ cwd: alpha, notifyFile: join(tmp, "n.json") })
  const panel = fakePanel()
  await initLedgerSurface(panel)
  const items = vscode.window.statusBarItems
  assert.equal(items.length, 1, "item 建立（priority 99——主 item 100 之侧）")
  const item = items[0]
  assert.equal(item.alignment, vscode.StatusBarAlignment.Right)
  assert.equal(item.priority, 99)
  assert.equal(item.command, undefined, "无点击命令（K4——点击面板否决在案）")
  assert.equal(item.text, "台账 2·1", "text = L1")
  assert.equal(item.tooltip.value, "台账 alpha：需求池 2 · 技术待办 1（老化 1） — 可开批", "tooltip = 明细行集 L2 行")
  assert.equal(item.backgroundColor?.id, "statusBarItem.warningBackground", "aged>0 → 警示底色")
  assert.equal(item.visible, true, "当前项目在 → show")
  // 无台账 → hide（锚 = 盘根下全链不存在的幽灵路径——同 CLI T109③ 夹具：tmpdir 子目录锚的
  //  父链会命中并行用例在 %TEMP% 遗留的 ledger-* 台账目录 → 假红，幽灵链不随环境漂移）
  const ghost = join(parse(tmpdir()).root, "thincoder-vsc-zero-ledger-probe", "deep")
  _setLedgerSurfaceForTest({ cwd: ghost })
  await refreshLedger(panel, { emit: false })
  assert.equal(item.visible, false, "无台账 → hide（K6/U4）")
})

// ── 启动行 post 门 + 送达门（AC82/F5） ──────────────────────────────────────
test("T107/T103 边界：post 门（可动作才 post）+ 送达门（未就绪不记账、就绪后重报）+ 缝推送计数 = 行数", async () => {
  const alpha = mkLedgerAt(join(tmp, "ws", "alpha"), [{ row: techRow("丙"), ageDays: 40 }])
  _setLedgerSurfaceForTest({ cwd: alpha, notifyFile: join(tmp, "n.json") })
  const notices = (p) => p.posted.filter((m) => m.type === "ledgerNotice")
  const pushed = (p) => notices(p).flatMap((m) => m.lines)
  // 未就绪（_wvReady=false）→ 不 post、不记账
  const cold = fakePanel({ ready: false })
  await initLedgerSurface(cold)
  await pushLedgerStartup(cold)
  assert.deepStrictEqual(cold.posted, [], "webview 未就绪 → 零 post")
  assert.deepStrictEqual(loadNotifyState(join(tmp, "n.json")).ledgers, {}, "未送达不记账")
  // 就绪 → 变化行 + 启动行（明细行集）逐行推送（缝注入：推送计数 = 行数）
  const warm = fakePanel()
  await pushLedgerStartup(warm)
  assert.equal(notices(warm).length, 2, "缝推送计数 = 行数（2 行 → 2 次 pushLine）")
  assert.deepStrictEqual(pushed(warm).map((l) => l.text), [
    "台账变化：alpha 老化首次越线 1 条（超 30 天未处置）：丙",
    "台账 alpha：需求池 0 · 技术待办 1（老化 1）",
  ], "变化行在前、明细行在后")
  assert.ok(pushed(warm).every((l) => l.warn === true), "warn 档（该项目 actionable）")
  assert.equal(loadNotifyState(join(tmp, "n.json")).ledgers[notifyKey(ledgerDbPath(alpha))].aged.length, 1, "送达后记账（aged）")
  await pushLedgerStartup(warm)
  assert.equal(notices(warm).length, 3, "第二拍 = 启动行（K2 不去重）")
  assert.equal(notices(warm).at(-1).lines.length, 1, "变化行已去重（只剩明细行）")
})

// ── T108 webview 渲染（AC87/F8——真 chat.js + happy-dom） ────────────────────
let cleanupEnv
before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installFullIndexFixture()
})
after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})
const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))

test("T108 正常：`ledgerNotice` 逐行 `.ledger-line` 入 #messages；warn 类仅警示行；连发不吞行", async () => {
  await import("../webview/chat.js")
  const lines = () => [...document.querySelectorAll(".ledger-line")]
  send({ type: "clearMessages" })
  send({ type: "ledgerNotice", lines: [{ text: "台账 a：需求池 1 · 技术待办 2（老化 0）", warn: false }, { text: "台账变化：a 需求池达阈值（3 条）— 可开批", warn: true }] })
  assert.equal(lines().length, 2, "逐行入流")
  assert.equal(lines()[0].parentElement.id, "messages", "落会话流（可回看——非状态区）")
  assert.equal(lines()[0].classList.contains("warn"), false, "平态行无 warn 类")
  assert.equal(lines()[1].classList.contains("warn"), true, "警示行 warn 类")
  assert.equal(lines()[0].textContent, "台账 a：需求池 1 · 技术待办 2（老化 0）", "文本逐字")
  send({ type: "ledgerNotice", lines: [{ text: "台账 b：需求池 0 · 技术待办 0（老化 0）", warn: false }] })
  assert.equal(lines().length, 3, "连发两次不吞行（append-only）")
})

// ── 接线机检（AC87/AC90） ───────────────────────────────────────────────────
test("接线机检：本档入册（files.mjs 显式清单——未入册 = 不跑）", () => {
  assert.ok(files.includes("test/ledger.test.mjs"), "本档已登记 test/files.mjs（VSC 显式清单）")
})

test("AC89 边界：无老化候选项不计老化（trigger 豁免——SQLite 时间戳源，零 git 子进程）", async () => {
  const alpha = mkLedgerAt(join(tmp, "ws", "alpha"), [{ row: techRow("X", "归批") }])
  _setLedgerSurfaceForTest({ cwd: alpha, notifyFile: join(tmp, "n.json") })
  await initLedgerSurface(fakePanel())
  const item = vscode.window.statusBarItems[0]
  assert.equal(item?.text, "台账 0·1", "trigger 条目计入技术计数")
  assert.equal(item?.backgroundColor, undefined, "无老化候选 → 无警示底色")
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
  _setLedgerSurfaceForTest({ cwd: join(family, "alpha"), notifyFile: join(family, "n.json") })
  const panel = fakePanel()
  const t0 = Date.now()
  await initLedgerSurface(panel)
  const dt = Date.now() - t0
  assert.ok(dt <= 500, `单次刷新 ${dt}ms ≤ 500ms（两项目族——SQLite）`)
  assert.equal(vscode.window.statusBarItems[0]?.text, "台账 1·10", "扫描结果到位（非空转）")
})

// ── T102 老化界值（快层——时间戳纯计算；SQLite 时间戳源替代 v1 git blame） ────
test("T102 边界：老化界值（29 / 31 天 + 触发表态）", () => {
  const proj = mkLedgerAt(join(tmp, "proj"), [
    { row: techRow("甲"), ageDays: 29 },
    { row: techRow("乙"), ageDays: 31 },
    { row: techRow("丙", "认账不排期"), ageDays: 31 },
  ])
  const s = buildScan({ cwd: proj })
  assert.equal(s.aged, 1, `仅 31 天条计老化（实得 ${s.aged}）`)
  assert.ok(s.agedKeys[0].includes("乙"))
  // 行龄未知（时间戳 NULL）→ 不计且不抛
  const db = openLedger(proj, { create: true })
  db.prepare("UPDATE items SET created_at = NULL, updated_at = NULL WHERE title = ?").run(techEntry("乙"))
  db.close()
  assert.equal(buildScan({ cwd: proj }).aged, 0, "行龄未知 → 不计且不抛")
})
