/**
 * 2026-09-29-desktop-statusline-cli-gap.test.mjs — 批内件（名随批次档 · 实施舱暂存 `.thincoder/tmp/`
 * （终位由父侧 copy 至 `docs/batches/`）· 不入仓套件 · 随批留存归档）。
 *
 * 覆盖 = 状态行 ⇒ CLI 补漏批机检判据（批档 §2.4 测试面 ①–⑥）：段 9 上下文读数两语逐字（en 逐字 = CLI
 * `thincoder-cli/src/tui/render-frame.mjs:413-416`）/ 半态 / fmtK 三带 / ≥ 80 warn；段 11 常驻 / 零节点 /
 * warn 开合 / tooltip 载波（核明细行逐字——「 — 可开批」信号保留，豁免面）；归约 `usageTokens` 写 ∕ 清、
 * `ledgerMarker` 写 ∕ 清 ∕ 同值原引用；主进程两纯函数 `ledgerMarkerOf` ∕ `sameLedgerMarker`；键集相等；
 * 零残留（`renderer/**` 源档 `info.threshold` 零命中 ∕ 段面零「可开批」形——沿「复制面对齐」批 D13 判例）。
 * 语义单源 = `docs/desktop/design/UI.md` §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」∕ `docs/desktop/design/IPC.md` §1。
 * **真机对照 = 父侧真跑（终验 · D16 义务）**——本件只承机检腿。
 *
 * 跑法（从仓库根 `thincoder/`）：`node --test .thincoder/tmp/2026-09-29-desktop-statusline-cli-gap.test.mjs`
 * （两层深 ⇒ 相对 import 与终位 `docs/batches/` 一致，两处可跑）。平 node 直测（无假 DOM 需求）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const src = (rel) => readFileSync(`${ROOT}${rel}`, "utf8")

// ─── 取件（rc 钩子注册后用动态 import —— 静态 import 于链接期解析，钩子未生效）──────────

const { initDict, HOST_DICT } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { contextSegment, ledgerSegment } = await import("../../thincoder-desktop/renderer/views/statusline-segments.mjs")
const { STATUS_SEGMENTS, statusModel, statusTree } = await import("../../thincoder-desktop/renderer/views/statusline.mjs")
const { reduce } = await import("../../thincoder-desktop/renderer/events.mjs")
const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
const { STATUS_KEYS } = await import("../../thincoder-desktop/renderer/mount-status.mjs")
const { ledgerMarkerOf, sameLedgerMarker } = await import("../../thincoder-desktop/src/main/project-info.mjs")

const segOf = (model, code) => model.segments.find((s) => s.code === code)
const findSeg = (node, code) => {
  if (node?.props?.["data-seg"] === code) return node
  for (const child of node?.children ?? []) { const hit = findSeg(child, code); if (hit !== null) return hit }
  return null
}
const CORE_DETAIL = "台账 proj：需求池 1 · 技术待办 2（老化 0） — 可开批" // 核 `formatDetailLine` 形态（「 — 可开批」信号逐字）

// ─── ① 段 9 · 上下文读数（两语逐字 ∕ fmtK 三带 ∕ 半态 ∕ warn）────────────────

test("T1 段 9 两语逐字：`context <pct>% <tokens>`（en 逐字 = CLI；zh 对位译形）", () => {
  initDict({ locale: "en" })
  assert.equal(contextSegment({ k: 24 }, { k: 12345 }, "k").parts[0].text, "context 24% 12k")
  assert.equal(segOf(statusModel({ activeSession: "k", usage: { k: 24 }, usageTokens: { k: 12345 } }), "context").parts[0].text, "context 24% 12k")
  initDict({ locale: "zh" })
  assert.equal(contextSegment({ k: 24 }, { k: 12345 }, "k").parts[0].text, "上下文 24% 12k")
  assert.equal(segOf(statusModel({ activeSession: "k", usage: { k: 24 }, usageTokens: { k: 12345 } }), "context").parts[0].text, "上下文 24% 12k")
  initDict({ locale: "en" })
})

test("T2 段 9 令牌格式三带（端 `fmtK` 同 CLI 同式）：≥ 10000 ⇒ 整数 k ∕ ≥ 1000 ⇒ 一位小数 k ∕ 否则裸数", () => {
  const tail = (n) => contextSegment({ k: 24 }, { k: n }, "k").parts[0].text
  assert.equal(tail(10000), "context 24% 10k")
  assert.equal(tail(12345), "context 24% 12k")
  assert.equal(tail(9999), "context 24% 10.0k")
  assert.equal(tail(1234), "context 24% 1.2k")
  assert.equal(tail(1000), "context 24% 1.0k")
  assert.equal(tail(999), "context 24% 999")
})

test("T3 段 9 半态（令牌 0 ∕ 缺 ∕ 非数 ⇒ 尾段缺席，同 CLI）· 百分无效 ⇒ 整段零节点", () => {
  assert.equal(contextSegment({ k: 24 }, { k: 0 }, "k").parts[0].text, "context 24%")
  assert.equal(contextSegment({ k: 24 }, {}, "k").parts[0].text, "context 24%")
  assert.equal(contextSegment({ k: 24 }, { k: "12k" }, "k").parts[0].text, "context 24%")
  assert.equal(contextSegment({ k: 24 }, null, "k").parts[0].text, "context 24%")
  for (const bad of [{ k: 0 }, { k: -1 }, { k: "24" }, {}]) assert.equal(contextSegment(bad, { k: 12345 }, "k"), null)
  assert.equal(contextSegment(null, { k: 12345 }, "k"), null)
  assert.equal(segOf(statusModel({ activeSession: "k" }), "context"), undefined, "缺切片 ⇒ 段零节点")
})

test("T4 段 9 ≥ 80 警示（沿 `USAGE_WARN`）· `data-usage` 字面", () => {
  assert.equal(contextSegment({ k: 80 }, { k: 12345 }, "k").warn, true)
  assert.equal(contextSegment({ k: 79 }, { k: 12345 }, "k").warn, false)
  assert.equal(contextSegment({ k: 24 }, { k: 12345 }, "k").attrs["data-usage"], "24")
  const high = findSeg(statusTree(statusModel({ activeSession: "k", usage: { k: 80 }, usageTokens: { k: 12345 } })), "context")
  assert.ok(high.props.class.includes("status-usage-warn"), "≥ 80 ⇒ 树面警示 class")
  const low = findSeg(statusTree(statusModel({ activeSession: "k", usage: { k: 79 }, usageTokens: { k: 12345 } })), "context")
  assert.ok(!low.props.class.includes("status-usage-warn"))
})

// ─── ② 段 11 · 台账常驻（在场 ∕ 零节点 ∕ warn ∕ tooltip）────────────────────

test("T5 段 11 常驻：`ledgerMarker` 在场 ⇒ 段在场（不绑 `thresholdReached` —— 旧判据退场）", () => {
  const seg = ledgerSegment({ text: "台账 2·3", warn: false }, [])
  assert.equal(seg.code, "ledger")
  assert.equal(seg.parts[0].text, "台账 2·3")
  assert.equal(segOf(statusModel({ activeSession: "k", ledgerMarker: { text: "台账 2·3", warn: false } }), "ledger").parts[0].text, "台账 2·3")
  // 常驻反证：无 marker ∧ 旧判据真 ⇒ 零节点（旧判据不再消费）
  assert.equal(segOf(statusModel({ activeSession: "k", projectInfo: { thresholdReached: true } }), "ledger"), undefined)
})

test("T6 段 11 零节点负向锁：marker `null` ∕ 空 text ∕ 非载体 ∕ 形不合 ⇒ 段零节点", () => {
  for (const bad of [null, undefined, {}, { text: "" }, { text: 42 }, { text: null }]) {
    assert.equal(ledgerSegment(bad, []), null, JSON.stringify(bad))
  }
  assert.equal(segOf(statusModel({ activeSession: "k" }), "ledger"), undefined)
})

test("T7 段 11 `warn` 位（核判位直转 —— 端零重算）：true ⇒ 警示 class ∕ false ⇒ 无", () => {
  assert.equal(ledgerSegment({ text: "台账 1·0", warn: true }, []).warn, true)
  assert.equal(ledgerSegment({ text: "台账 1·0", warn: false }, []).warn, false)
  const on = findSeg(statusTree(statusModel({ activeSession: "k", ledgerMarker: { text: "台账 1·0", warn: true } })), "ledger")
  assert.ok(on.props.class.includes("status-seg-warn"), "warn 真 ⇒ 警示 class")
  const off = findSeg(statusTree(statusModel({ activeSession: "k", ledgerMarker: { text: "台账 1·0", warn: false } })), "ledger")
  assert.ok(!off.props.class.includes("status-seg-warn"), "warn 假 ⇒ 零警示 class")
})

test("T8 段 11 tooltip 载波（核明细行逐字 —— 「 — 可开批」信号保留于 tooltip）· 空集零 title", () => {
  const lines = [CORE_DETAIL, "台账 second：需求池 0 · 技术待办 0（老化 0）"]
  assert.equal(ledgerSegment({ text: "台账 1·2", warn: false }, lines).attrs.title, lines.join("\n"))
  assert.equal(ledgerSegment({ text: "台账 1·2", warn: false }, []).attrs, undefined)
  assert.equal(ledgerSegment({ text: "台账 1·2", warn: false }, ["", null]).attrs, undefined)
})

// ─── ③ 归约（`usageTokens` ∕ `ledgerMarker`）────────────────────────────────

test("T9 归约 `ev:usage`：`usageTokens` 写 ∕ 同值原引用 ∕ 0 ∕ 缺 ⇒ 清本键 ∕ `ctxPct` 无效整体原引用", () => {
  const s = reduce(initialState(), { channel: "ev:usage", key: "1", ctxPct: 24, ctxTokens: 12345 })
  assert.equal(s.usageTokens["1"], 12345)
  assert.equal(reduce(s, { channel: "ev:usage", key: "1", ctxPct: 24, ctxTokens: 12345 }), s, "同值重发 ⇒ 原引用")
  const cleared = reduce(s, { channel: "ev:usage", key: "1", ctxPct: 30, ctxTokens: 0 })
  assert.equal(Object.hasOwn(cleared.usageTokens, "1"), false, "0 ⇒ 清本键（端侧落半态）")
  assert.equal(cleared.usage["1"], 30, "同笔 `usage` 照写（同门独立）")
  const cleared2 = reduce(s, { channel: "ev:usage", key: "1", ctxPct: 30 })
  assert.equal(Object.hasOwn(cleared2.usageTokens, "1"), false, "缺 ⇒ 清本键")
  assert.equal(reduce(s, { channel: "ev:usage", key: "1", ctxPct: 0, ctxTokens: 9 }), s, "`ctxPct` 无效 ⇒ 整体原引用")
})

test("T10 归约 `ev:ledger` `marker`：写（归一）∕ 清（`null`）∕ 同值原引用 ∕ 形不合零写 ∕ 键缺席零动作", () => {
  const base = initialState()
  const s1 = reduce(base, { channel: "ev:ledger", key: "1", marker: { text: "台账 2·3", warn: true } })
  assert.deepEqual(s1.ledgerMarker, { text: "台账 2·3", warn: true })
  assert.equal(reduce(s1, { channel: "ev:ledger", key: "1", marker: { text: "台账 2·3", warn: true } }), s1, "同值 ⇒ 原引用")
  const cleared = reduce(s1, { channel: "ev:ledger", key: "1", marker: null })
  assert.equal(cleared.ledgerMarker, null, "`null` ⇒ 清残影")
  assert.notEqual(cleared, s1)
  assert.equal(reduce(s1, { channel: "ev:ledger", key: "1", marker: { text: "" } }), s1, "形不合 ⇒ 零写")
  assert.equal(reduce(s1, { channel: "ev:ledger", key: "1", marker: 42 }), s1, "非载体 ⇒ 零写")
  const s2 = reduce(base, { channel: "ev:ledger", key: "1", lines: [{ text: "台账变化：x", warn: true }] })
  assert.equal(s2.ledgerMarker, undefined, "键缺席 ⇒ 零动作")
  assert.deepEqual(reduce(base, { channel: "ev:ledger", key: "1", marker: { text: "台账 0·0", warn: 1 } }).ledgerMarker, { text: "台账 0·0", warn: false }, "`warn` 真值归一")
})

test("T11 镜面键集：`STATUS_KEYS` 含 `usageTokens` ∕ `ledgerMarker`；承载段集 17 不动", () => {
  assert.ok(STATUS_KEYS.includes("usageTokens"))
  assert.ok(STATUS_KEYS.includes("ledgerMarker"))
  assert.equal(STATUS_SEGMENTS.length, 17)
  assert.equal(new Set(STATUS_SEGMENTS).size, 17)
})

// ─── ④ 主进程两纯函数 ─────────────────────────────────────────────────────

test("T12 `ledgerMarkerOf`：核状态位 ⇒ `{ text, warn }` ∕ `null`（未扫 ∕ 无当前项目 ∕ 非载体）", () => {
  assert.deepEqual(ledgerMarkerOf({ marker: "台账 2·3", warn: true, scannedAt: 1 }), { text: "台账 2·3", warn: true })
  assert.deepEqual(ledgerMarkerOf({ marker: "台账 2·3" }), { text: "台账 2·3", warn: false })
  assert.equal(ledgerMarkerOf({ marker: null, warn: true }), null)
  assert.equal(ledgerMarkerOf({ marker: "" }), null)
  assert.equal(ledgerMarkerOf(null), null)
  assert.equal(ledgerMarkerOf(undefined), null)
})

test("T13 `sameLedgerMarker`：`text` 逐字 + `warn` 真值同判（两 `null` 同值）", () => {
  assert.equal(sameLedgerMarker(null, null), true)
  assert.equal(sameLedgerMarker(null, { text: "x", warn: false }), false)
  assert.equal(sameLedgerMarker({ text: "台账 1·2", warn: true }, { text: "台账 1·2", warn: true }), true)
  assert.equal(sameLedgerMarker({ text: "台账 1·2", warn: true }, { text: "台账 1·2", warn: false }), false)
  assert.equal(sameLedgerMarker({ text: "台账 1·2", warn: false }, { text: "台账 1·3", warn: false }), false)
})

// ─── ⑤ 键集相等 · ⑥ 零残留（机检）────────────────────────────────────────

test("T14 键集相等（两语同拍）· 退场键键集零命中 · `status.usage` 两语值逐字", () => {
  const en = HOST_DICT.en, zh = HOST_DICT.zh
  const enKeys = Object.keys(en)
  assert.equal(enKeys.length, Object.keys(zh).length, "两语键数相等")
  assert.equal(enKeys.every((k) => Object.hasOwn(zh, k)), true, "两语键集相等")
  assert.equal("info.threshold" in en, false)
  assert.equal("info.threshold" in zh, false)
  assert.equal(en["status.usage"], "context ${percent}%${tokens}")
  assert.equal(zh["status.usage"], "上下文 ${percent}%${tokens}")
})

test("T15 零残留：`renderer/**` 源档退场键字面零命中（源档全树扫描）", () => {
  const hits = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) { walk(path); continue }
      let text = ""
      try { text = readFileSync(path, "utf8") } catch { continue }
      if (text.includes("info.threshold")) hits.push(path)
    }
  }
  walk(join(ROOT, "thincoder-desktop", "renderer"))
  assert.deepEqual(hits, [])
})

test("T16 零残留：段面零「可开批」形（段构建器产物不含；tooltip 载波 = 核明细行逐字，豁免）", () => {
  const model = statusModel({ activeSession: "k", ledgerMarker: { text: "台账 2·3", warn: true }, ledgerDetail: [CORE_DETAIL] })
  const tree = statusTree(model)
  const texts = []
  const collect = (node) => {
    if (typeof node === "string") { texts.push(node); return }
    for (const child of node?.children ?? []) collect(child)
  }
  collect(tree)
  assert.equal(texts.some((text) => text.includes("可开批") || text.includes("Ready for a batch")), false, "段面产物零「可开批」形")
  assert.equal(findSeg(tree, "ledger").props.title, CORE_DETAIL, "tooltip 载波逐字（豁免面：信号保留）")
  const segSrc = src("thincoder-desktop/renderer/views/statusline-segments.mjs")
  assert.equal(segSrc.includes("可开批") || segSrc.includes("Ready for a batch"), false, "段构建器源档零字面")
})

// ─── 源面锁（载荷扩 2 · 结构机检）────────────────────────────────────────

test("T17 源面锁：宿主载荷扩 2（`ev:usage` `ctxTokens` ∕ `ev:ledger` `marker`）在盘", () => {
  const host = src("thincoder-desktop/src/main/agent-host.mjs")
  assert.match(host, /import \{ estimateTokens, historyPercent \} from "@thincoder\/core\/token-window\.mjs"/)
  assert.match(host, /ctxTokens: estimateTokens\(agent\?\.history \?\? \[\]\)/)
  const info = src("thincoder-desktop/src/main/project-info.mjs")
  assert.match(info, /export function ledgerMarkerOf\(ledger\)/)
  assert.match(info, /export function sameLedgerMarker\(a, b\)/)
  assert.match(info, /const marker = ledgerMarkerOf\(LEDGER_STATE\.ledger\)/)
  assert.match(info, /payload\.marker = marker/)
})
