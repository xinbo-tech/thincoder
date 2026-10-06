/**
 * 2026-10-06-upward-flag-marker.test.mjs — 上抛标识制批（台账 #970）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 d:/teamcode/thincoder 下）：
 *   node --test docs/batches/2026-10-06-upward-flag-marker.test.mjs
 *
 * 覆盖 = 设计档 §6.33（判据单源）引擎面用例 U-UM1–U-UM6 ∥ U-UM8（直驱）：
 *   U-UM1 正常·ask 单条 ⇒ 行 `[上抛·待裁] · <from>: <msg>` · 恰 1 条合并 user 消息 · 队列清空
 *   U-UM2 正常·note 单条 ⇒ 行 `[上抛·知会] · …`
 *   U-UM3 边界·多条目（ask + note）⇒ 恰 1 条 · 两行按入队序 · `- ` 前缀 · header 计数句不变
 *   U-UM4 边界·注脚共存 ⇒ 标识行 + 既有结束注脚（settle / cancel 两形态逐字不变）
 *   U-UM5 边界·未知 kind（防御）⇒ 原样渲染 · 不抛 · 消息不丢；escapeXml 零回归
 *   U-UM6 边界·机读面零改 ⇒ `child:upstream` 日志 kind 原值 · `upstreamAskLabelVars` 逐字（零改面锁定）
 *   U-UM8 边界·空队列 ⇒ no-op（零历史变更 · 零容器创建——零改面锁定）
 * （U-UM7 = 提示词面对读 + `prompt-refs-check` 脚本核——载体不在本档；读数见批档 §5）
 * 直驱法 = `pushChildUpstream` → `drainChildUpstream`（合成 parent 形——先例 2026-10-05 批件档 A-ZW4 腿）。
 * 先红后绿（实测读数——批档 §5）：红 = U-UM1/2/3/4/5（渲染面）；绿 = U-UM6 ∥ U-UM8（零改面锁定——批前即绿）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const PARENT = await mod("thincoder-core/agent-tools/parent-channel.mjs") // pushChildUpstream / drainChildUpstream
const LOG = await mod("thincoder-core/log.mjs") // 日志面隔离（测试缝）

const SANDBOX = mkdtempSync(join(tmpdir(), "um-flag-"))
const LOGS = join(SANDBOX, "logs")
LOG._setLogsDirForTest(LOGS) // `child:upstream` 日志落盘隔离——不污染真日志
after(() => {
  LOG._resetLogsDirForTest()
  rmSync(SANDBOX, { recursive: true, force: true })
})

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

/* ── 夹具 / 期望串（header 两形态 / 标识两枚——逐字自核内单点）──────────────────────── */

/** 合成父（消费方）形态：`history` 数组（`upstreamHolder` 路径③：主容器 + 载体别名）。 */
const mkParent = () => ({ history: [] })
/** 入队单点。 */
const push = (parent, from, kind, message) => PARENT.pushChildUpstream({ parent, from, kind, message })
/** 取最后一次注入的 user 消息文本（drain 合并注入点）。 */
const injected = (parent) => {
  const msg = parent.history.at(-1)
  assert.equal(msg?.role, "user", "注入条目 = user 消息")
  return String(msg.content)
}
/** 队列内条目（载体读——同 drain 读径）。 */
const queueOf = (parent) => parent._childUpstream

const singleHeader = (from) =>
  `[System reminder: in-flight message from your subagent ${from} — it keeps working on the unaffected parts. ` +
  "Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means the child skips that part and reports it as not done.]"
const manyHeader = (n) =>
  `[System reminder: ${n} in-flight message(s) from your subagents — they keep working on the unaffected parts. ` +
  "Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means that child skips the part and reports it as not done.]"

/** `child:upstream` 日志行（隔离目录内当日档——缺档 ⇒ 空集）。 */
const readUpstreamLogs = () => {
  let raw
  try { raw = readFileSync(join(LOGS, `agent-${new Date().toISOString().slice(0, 10)}.log`), "utf8") } catch { return [] }
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.ev === "child:upstream")
}

/* ── U-UM1–U-UM3 · 渲染映射（单点）────────────────────────────────────────────────── */

test("U-UM1 正常·ask 单条 ⇒ 标识行 + 恰 1 条合并消息 + 队列清空", () => {
  const parent = mkParent()
  const { seq, position } = push(parent, "eng-designer#53", "ask", "Design token missing for X — which face wins?")
  assert.equal(seq, 1, "单调计数自 1 起")
  assert.equal(position, 1, "入队位次 = 1")
  assert.equal(queueOf(parent).length, 1, "队列恰 1 条")
  assert.equal(PARENT.drainChildUpstream(parent), 1, "消费恰 1 条")
  assert.equal(queueOf(parent).length, 0, "drain 即清（队列清空）")
  assert.equal(parent.history.length, 1, "恰 1 条合并 user 消息")
  assert.equal(
    injected(parent),
    [singleHeader("eng-designer#53"), "[上抛·待裁] · eng-designer#53: Design token missing for X — which face wins?"].join("\n"),
    "整条注入 = header + 标识行（`ask` ⇒ `[上抛·待裁]`）",
  )
  assert.ok(String(parent._fullHistory.at(-1)?.content ?? "").startsWith("[System reminder:"), "事件落盘（_fullHistory 双写）")
  out("U-UM1", "ask ⇒ `[上抛·待裁]` · 恰 1 条 · 队列清空 ✓")
})

test("U-UM2 正常·note 单条 ⇒ 标识行 `[上抛·知会]`", () => {
  const parent = mkParent()
  push(parent, "eng-designer#53", "note", "FYI: premise B revised")
  assert.equal(PARENT.drainChildUpstream(parent), 1)
  assert.equal(injected(parent).split("\n").at(-1), "[上抛·知会] · eng-designer#53: FYI: premise B revised", "`note` ⇒ `[上抛·知会]`")
  out("U-UM2", "note ⇒ `[上抛·知会]` ✓")
})

test("U-UM3 边界·多条目（ask + note）⇒ 恰 1 条 · `- ` 前缀 · 入队序 · header 计数句", () => {
  const parent = mkParent()
  push(parent, "eng-designer#53", "ask", "need a ruling on Y")
  push(parent, "explore#61", "note", "source list is complete")
  assert.equal(PARENT.drainChildUpstream(parent), 2)
  assert.equal(parent.history.length, 1, "恰 1 条 user 消息（合并注入）")
  const lines = injected(parent).split("\n")
  assert.equal(lines.length, 3, "header + 两行")
  assert.equal(lines[0], manyHeader(2), "header 计数句不变")
  assert.equal(lines[1], "- [上抛·待裁] · eng-designer#53: need a ruling on Y", "行 1 = 入队序首位 · `- ` 前缀 · 标识")
  assert.equal(lines[2], "- [上抛·知会] · explore#61: source list is complete", "行 2 = 入队序次位 · 标识二枚")
  out("U-UM3", "两行按入队序 · 各带 `- ` 前缀与对应标识 ✓")
})

/* ── U-UM4–U-UM5 · 注脚共存 / 防御回退 ──────────────────────────────────────────── */

test("U-UM4 边界·注脚共存 ⇒ 标识行 + 既有结束注脚（两形态逐字不变）", () => {
  // 腿 ① settle（done-in-pool——§6.7.3 表示）
  const p1 = mkParent()
  p1._asyncSubagents = new Map([["53", { done: true }]])
  push(p1, "eng-designer#53", "ask", "still there?")
  assert.equal(PARENT.drainChildUpstream(p1), 1)
  assert.equal(
    injected(p1).split("\n").at(-1),
    "[上抛·待裁] · eng-designer#53: still there? (eng-designer#53 has since settled — see its report)",
    "settle 注脚逐字 + 标识行",
  )
  // 腿 ② cancel（出池 + 墓碑）
  const p2 = mkParent()
  p2._asyncTombstones = new Map([["7", { status: "cancelled", role: "subagent" }]])
  push(p2, "eng-coder#7", "note", "premise found broken")
  assert.equal(PARENT.drainChildUpstream(p2), 1)
  assert.equal(
    injected(p2).split("\n").at(-1),
    "[上抛·知会] · eng-coder#7: premise found broken (eng-coder#7 has since been cancelled)",
    "cancel 注脚逐字 + 标识行",
  )
  out("U-UM4", "settle / cancel 两注脚逐字 + 标识共存 ✓")
})

test("U-UM5 边界·未知 kind 原样渲染 · 不抛 · 消息不丢 + escapeXml 零回归", () => {
  const parent = mkParent()
  assert.doesNotThrow(() => push(parent, "eng-designer#53", "other", "defensive input"))
  assert.equal(PARENT.drainChildUpstream(parent), 1)
  const line = injected(parent).split("\n").at(-1)
  assert.equal(line, "other · eng-designer#53: defensive input", "值域外 = 原样 kind（fail-open）")
  assert.ok(line.includes("defensive input"), "消息不丢")
  // 腿 ② 转义仍在（escapeXml 保留于行模板——零回归）
  const p2 = mkParent()
  push(p2, "explore#61", "note", "a & b <c>")
  PARENT.drainChildUpstream(p2)
  assert.equal(injected(p2).split("\n").at(-1), "[上抛·知会] · explore#61: a &amp; b &lt;c&gt;", "escapeXml 保留")
  out("U-UM5", "未知 kind 原样 · 不抛 · escapeXml 保留 ✓")
})

/* ── U-UM6 · 机读面零改（零改面锁定）───────────────────────────────────────────── */

test("U-UM6 边界·机读面零改 ⇒ 日志原 kind · 显示携参逐字", () => {
  const parent = mkParent()
  const before = readUpstreamLogs().length
  push(parent, "eng-designer#53", "ask", "which face?")
  push(parent, "explore#61", "note", "FYI only")
  const fresh = readUpstreamLogs().slice(before)
  assert.equal(fresh.length, 2, "两笔 child:upstream 日志")
  assert.deepEqual(fresh.map((e) => [e.id, e.kind]), [["eng-designer#53", "ask"], ["explore#61", "note"]], "机读面 = 原 kind（零改）")
  // 显示面：upstreamAskLabelVars 输出逐字（无 kind 字样——边界 4）
  assert.deepEqual(PARENT.upstreamAskLabelVars(parent), { from: "eng-designer#53", msg: "which face?" }, "队首 ask 携参 = { from, msg }")
  assert.equal(PARENT.drainChildUpstream(parent), 2, "清理（不遗留）")
  assert.equal(PARENT.upstreamAskLabelVars(parent), null, "空队列 ⇒ null")
  // 静态：日志调用点逐字（机读面留原 kind）
  const src = readFileSync(resolve(ROOT, "thincoder-core/agent-tools/parent-channel.mjs"), "utf8")
  assert.ok(src.includes('logEvent("child:upstream", { id: from, kind, seq })'), "日志调用点零改")
  out("U-UM6", "日志 kind 原值 · labelVars 逐字 · 调用点零改 ✓")
})

/* ── U-UM8 · 空队列 no-op（零改面锁定）────────────────────────────────────────── */

test("U-UM8 边界·空队列 ⇒ no-op（零历史变更 · 零容器创建）", () => {
  const parent = mkParent()
  assert.equal(PARENT.drainChildUpstream(parent), 0, "空队列 ⇒ 0")
  assert.equal(parent.history.length, 0, "零历史变更")
  assert.equal(parent._childUpstream, undefined, "零容器创建")
  assert.equal(parent._fullHistory, undefined, "零落盘")
  out("U-UM8", "空队列 no-op（零历史变更 · 零容器创建）✓")
})
