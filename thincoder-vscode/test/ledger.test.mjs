/**
 * ledger.test.mjs — VSC 台账可见面用例（LEDGER-SURFACE 批——设计档 §3.2 T97–T110 / §3.1 AC80–AC90；VSC 端）。
 * 面：语义同源（解析 / 计数 / 阈值 / 行文本 / 去重——本端独立实现）· 跨端去重档键等价 · item 形态（T107）·
 * webview 渲染（T108，真 chat.js + happy-dom）· 启动行 post 门 + 送达门 · 接线机检 · 老化界值（慢层 git）。
 * 手法：tmp 夹具 + 注入 ageOf（确定性）；vscode-mock（`test/vscode-mock`——最小扩展面）。
 * 归册（2026-09-12 收尾轮 9）：T107 观测 619ms——slow() 门控；AC89/T102 原已归册，其余用例留快层。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { execFileSync } from "node:child_process"
import * as vscode from "vscode"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import files from "./files.mjs"
import { slow } from "./slow.mjs"
import {
  blameAges, discoverFamily, detailScans, entryTitle, findProject, formatAgingLine, formatDetailLine, formatMarker,
  formatThresholdLine, loadNotifyState, normalizeEntry, notifyKey, planChangeLines, scanGroups, summarizeLedger,
} from "../src/ledger.mjs"
import { _setLedgerSurfaceForTest, dispose as disposeLedgerSurface, initLedgerSurface, pushLedgerStartup, refreshLedger } from "../src/extension/ledger-surface.mjs"

const lineOf = (text, needle) => text.split("\n").findIndex((l) => l.includes(needle)) + 1
let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "ledger-vsc-")) })
afterEach(() => {
  disposeLedgerSurface()
  _setLedgerSurfaceForTest({ notifyFile: undefined, cwd: undefined, ageOf: undefined })
  vscode.window.statusBarItems.length = 0
  rmSync(tmp, { recursive: true, force: true })
})

const mk = (rel, content) => { const abs = join(tmp, rel); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); return abs }
const poolEntry = (name, board = "FOO.md") => `- [ ] **${name}** → 需求 \`docs/requirements/${board}\` §1.13 · 任务书 \`docs/batches/B.md\` §2 · status=待讨论`
const techEntry = (name, evidence = "src/a.mjs:1") => `- [ ] **${name}** → 证据 \`${evidence}\``
const ledgerText = (pool, tech) => ["# t", "", `## 需求池（${pool.length} 条）`, "", ...pool, "", `## 技术待办（${tech.length} 条）`, "", ...tech, ""].join("\n")
/** 假 panel：捕获 post（`_wvReady` 控制就绪门）。 */
const fakePanel = ({ ready = true } = {}) => {
  const posted = []
  return { posted, _wvReady: ready, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}

// ── 语义同源（解析 / 计数 / 阈值 / 行文本 / 去重） ──────────────────────────
test("T97/T101 正常/边界：解析计数与阈值口径（组扫描 / 池 ≥3 / 同板块 ≥2 / 跨档各 1 不达阈）", () => {
  const groups = scanGroups(["# t", "## 需求池（2 条）", "- [ ] **甲**（待讨论）", "- [ ] **乙**（待讨论）", "## 技术待办（1 条）", "- [ ] **丙** → 证据 `src/a.mjs:1`"])
  assert.deepStrictEqual(groups.map((g) => [g.name, g.declared, g.entries.length]), [["需求池（2 条）", 2, 2], ["技术待办（1 条）", 1, 1]])
  const s = (pool) => summarizeLedger({ root: tmp, ledger: mk("docs/TODO.md", ledgerText(pool, [techEntry("丙")])) }, { ageOf: () => null })
  assert.equal(s([poolEntry("甲"), poolEntry("乙")]).thresholdReached, true, "同板块 2 → 达阈")
  assert.equal(s([poolEntry("甲", "FOO.md"), poolEntry("乙", "BAR.md"), poolEntry("丙", "BAZ.md")]).thresholdReached, true, "池 3 → 达阈")
  assert.equal(s([poolEntry("甲", "FOO.md"), poolEntry("乙", "BAR.md")]).thresholdReached, false, "跨两档各 1 → 不达阈")
  assert.equal(s([poolEntry("甲")]).tech, 1)
})

test("T99 正常：L1–L4 行文本逐字（VSC 端同 formatter——` — 可开批` / `；…` / 回退标题）", () => {
  const scan = (over) => ({
    name: "thincoder-vscode", root: "/x", ledger: "/x/docs/TODO.md", pool: 3, tech: 9, aged: 0,
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
    name: "p", root: "/p", ledger: "/p/docs/TODO.md", pool: 0, tech: 1, aged: 1,
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
  const ledger = join(tmp, "docs", "TODO.md")
  assert.ok(!notifyKey(ledger).includes("\\"), "无反斜杠（跨端共享档——全平台）")
  if (process.platform === "win32") {
    const lower = "d:\\teamcode\\thincoder\\docs\\TODO.md"
    const upper = "D:\\teamcode\\thincoder\\docs\\TODO.md"
    assert.equal(notifyKey(lower), notifyKey(upper), "盘符大小写 → 同键（F5 跨端去重前提）")
    assert.equal(notifyKey(lower), "D:/teamcode/thincoder/docs/TODO.md", "盘符大写 + 正斜杠（逐字）")
  }
})

// ── T107 item 形态（AC87/F8） ───────────────────────────────────────────────
slow("T107 正常：item text = L1 / tooltip = 明细行集 / aged>0 → warningBackground / 无台账 → hide", () => {
  const ws = join(tmp, "ws")
  const alpha = join(ws, "alpha")
  const text = ledgerText([poolEntry("甲"), poolEntry("乙")], [techEntry("丙")])
  mk(join("ws", "alpha", "docs", "TODO.md"), text)
  const aged = new Map([[lineOf(text, "**丙**"), 40]])
  _setLedgerSurfaceForTest({ cwd: alpha, notifyFile: join(tmp, "n.json"), ageOf: () => aged })
  const panel = fakePanel()
  initLedgerSurface(panel)
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
  // 无台账（隔离目录：parent 超同级枚举上限）→ hide
  const iso = mkdtempSync(join(tmpdir(), "ledger-iso-"))
  try {
    _setLedgerSurfaceForTest({ cwd: join(iso, "deep") })
    refreshLedger(panel, { emit: false })
    assert.equal(item.visible, false, "无台账 → hide（K6/U4）")
  } finally { rmSync(iso, { recursive: true, force: true }) }
})

// ── 启动行 post 门 + 送达门（AC82/F5） ──────────────────────────────────────
test("T107/T103 边界：post 门（可动作才 post）+ 送达门（未就绪不记账、就绪后重报）", () => {
  const alpha = join(tmp, "ws", "alpha")
  const text = ledgerText([], [techEntry("丙")])
  mk(join("ws", "alpha", "docs", "TODO.md"), text)
  const ageOf = () => new Map([[lineOf(text, "**丙**"), 40]])
  _setLedgerSurfaceForTest({ cwd: alpha, notifyFile: join(tmp, "n.json"), ageOf })
  // 未就绪（_wvReady=false）→ 不 post、不记账
  const cold = fakePanel({ ready: false })
  initLedgerSurface(cold)
  pushLedgerStartup(cold)
  assert.deepStrictEqual(cold.posted, [], "webview 未就绪 → 零 post")
  assert.deepStrictEqual(loadNotifyState(join(tmp, "n.json")).ledgers, {}, "未送达不记账")
  // 就绪 → 变化行 + 启动行（明细行集）落地
  const warm = fakePanel()
  pushLedgerStartup(warm)
  const notice = warm.posted.find((m) => m.type === "ledgerNotice")
  assert.ok(notice, "ledgerNotice 投递")
  assert.deepStrictEqual(notice.lines.map((l) => l.text), [
    "台账变化：alpha 老化首次越线 1 条（超 30 天未处置）：丙",
    "台账 alpha：需求池 0 · 技术待办 1（老化 1）",
  ], "变化行在前、明细行在后")
  assert.ok(notice.lines.every((l) => l.warn === true), "warn 档（该项目 actionable）")
  assert.equal(loadNotifyState(join(tmp, "n.json")).ledgers[notifyKey(join(alpha, "docs", "TODO.md"))].aged.length, 1, "送达后记账")
  pushLedgerStartup(warm)
  assert.equal(warm.posted.filter((m) => m.type === "ledgerNotice").length, 2, "第二拍 = 启动行（K2 不去重）")
  assert.equal(warm.posted.at(-1).lines.length, 1, "变化行已去重（只剩明细行）")
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
test("接线机检：四处挂载 + 样式族 + 本档入册（未入册 = 不跑）", () => {
  assert.ok(files.includes("test/ledger.test.mjs"), "本档已登记 test/files.mjs（VSC 显式清单）")
})

test("AC89 边界：无候选条目不跑 git 子进程（计数断言）——有候选恰一次", () => {
  const alpha = join(tmp, "ws", "alpha")
  mk(join("ws", "alpha", "docs", "TODO.md"), ledgerText([], ["- [ ] **X** → 证据 `src/x.mjs:1` · 触发=归批（第 8 批）"]))
  let calls = 0
  _setLedgerSurfaceForTest({ cwd: alpha, notifyFile: join(tmp, "n.json"), ageOf: () => { calls++; return null } })
  refreshLedger(fakePanel(), { emit: false })
  assert.equal(calls, 0, "无候选 → 零 git 子进程（N2）")
  mk(join("ws", "alpha", "docs", "TODO.md"), ledgerText([], [techEntry("丙")]))
  refreshLedger(fakePanel(), { emit: false })
  assert.equal(calls, 1, "有候选 → 恰一次全档 blame")
})

// ── AC89 批级：单次刷新成本（慢层——真 git 夹具） ───────────────────────
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
  _setLedgerSurfaceForTest({ cwd: join(family, "alpha"), notifyFile: join(family, "n.json") })
  const panel = fakePanel()
  const t0 = Date.now()
  initLedgerSurface(panel)
  const dt = Date.now() - t0
  assert.ok(dt <= 500, `单次刷新 ${dt}ms ≤ 500ms（两项目族——真 git blame）`)
  assert.equal(vscode.window.statusBarItems[0]?.text, "台账 1·10", "扫描结果到位（非空转）")
})

// ── T102 老化界值（慢层——真 git 夹具；VSC 端 blameAges 同规则） ─────────────
slow("T102 边界：VSC blameAges 老化界值（29 / 31 天——commit 日期钉常量）", () => {
  const abs = mk("docs/TODO.md", ledgerText([], [techEntry("甲")]))
  const git = (args, env = {}) => execFileSync("git", args, { cwd: tmp, stdio: "ignore", env: { ...process.env, ...env } })
  git(["init", "-q"]); git(["config", "user.email", "t@example.com"]); git(["config", "user.name", "t"])
  const commit = (daysAgo) => {
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString()
    git(["add", "-A"]); git(["commit", "-qm", "c"], { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date })
  }
  commit(29)
  writeFileSync(abs, readFileSync(abs, "utf8") + techEntry("乙") + "\n")
  commit(31)
  const s = summarizeLedger({ root: tmp, ledger: abs })
  assert.equal(s.aged, 1, `仅 31 天条计老化（实得 ${s.aged}）`)
  assert.ok(s.agedKeys[0].includes("乙"))
  const ages = blameAges(abs)
  assert.ok(ages.get(lineOf(readFileSync(abs, "utf8"), "**甲**")) < 30)
  assert.ok(ages.get(lineOf(readFileSync(abs, "utf8"), "**乙**")) > 30)
  assert.equal(blameAges(join(tmp, "nope.md")), null, "非 git → null（降级不抛）")
})
