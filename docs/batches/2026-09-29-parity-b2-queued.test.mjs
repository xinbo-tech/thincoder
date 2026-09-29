/**
 * 2026-09-29-parity-b2-queued.test.mjs — 批次本地单元件（队列族三端收口 · 对拍锁重建 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = `node --test docs/batches/2026-09-29-parity-b2-queued.test.mjs`。
 * （本刻暂存 `.thincoder/tmp/` 同名件——两层深 ⇒ 相对 import 与终位一致；父侧 copy 至终位即运行命令同一。）
 *
 * 判据升级（旧锁 T-V16-14 = 双副本逐字对 → 新 = 核单源 + 两端转口同一绑定；本地副本复活 ⇒ 锁红）：
 *   L1 同源锁 = 核 ∕ vsc 转口 ∕ cli 转口三档——五名同一绑定 · 三常量值同 · 两转口档零本地定义（结构扫描）；
 *   B1–B5 = 合并计划 ∕ 形态文案 ∕ slash 分类 ∕ 取项件 ∕ 空 ∕ 非串（核件直驱）。
 * 注 ①：取项件 slash 分支 = 待收正面（批档 §2.3-⑤）——本锁不锁（防锁死收正轮）。
 * 注 ②：跨包实例恒等受宿主机目录链接目标盘符大小写差影响（vsc 链接 `D:` ∕ cli 链接 `d:`——Node 模块
 *   恒等 = 解析 URL 串恒等）⇒ 「同一绑定」按各自解析上下文判定；同一文件单源另以 realpath（大小写不
 *   敏感）证——两条合判 = 机制上可达的最强形（2026-09-29 父侧裁定维持）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"

const FIVE = ["MAX_MERGE_ITEMS", "MAX_MERGE_CHARS", "QUEUED_MAX_ITEMS", "formatMergedMessages", "planQueuedInput"]
const FUNCS = ["formatMergedMessages", "planQueuedInput"]
const CONSTS = ["MAX_MERGE_ITEMS", "MAX_MERGE_CHARS", "QUEUED_MAX_ITEMS"]
const CORE_SPEC = "@thincoder/core/queued.mjs"

const CORE = new URL("../../thincoder-core/queued.mjs", import.meta.url)
const VSC = new URL("../../thincoder-vscode/src/extension/queued-merge.mjs", import.meta.url)
const CLI = new URL("../../thincoder-cli/src/tui/queued-merge.mjs", import.meta.url)
// 两转口档内 `from "@thincoder/core/queued.mjs"` 的同一解析路径（各包 node_modules 链接 ⇒ 核件）
const CORE_VIA_VSC = new URL("../../thincoder-vscode/node_modules/@thincoder/core/queued.mjs", import.meta.url)
const CORE_VIA_CLI = new URL("../../thincoder-cli/node_modules/@thincoder/core/queued.mjs", import.meta.url)

const core = await import(CORE)
const coreViaVsc = await import(CORE_VIA_VSC)
const coreViaCli = await import(CORE_VIA_CLI)
const vsc = await import(VSC)
const cli = await import(CLI)

/** 结构扫描：源内五名「本地定义」命中集（export 形 + 局部形两族；空集 = 零本地定义）。 */
function defHits(src) {
  const hits = []
  for (const name of FIVE) {
    const exportForm = new RegExp(`export\\s+(?:const|function|async\\s+function)\\s+${name}\\b`)
    const localForm = new RegExp(`(?:^|\\n)\\s*(?:const|let|var|function|async\\s+function)\\s+${name}\\b`)
    if (exportForm.test(src)) hits.push(`export:${name}`)
    if (localForm.test(src)) hits.push(`local:${name}`)
  }
  return hits
}

// ─── L1 同源锁（核单源 + 两端转口同一绑定）────────────────────────────────

test("L1 同源锁：五名同一绑定（核 ∕ vsc 转口 ∕ cli 转口）· 三常量值同 · 两转口档零本地定义", () => {
  for (const [label, m] of [["core", core], ["vsc", vsc], ["cli", cli]]) {
    for (const name of FIVE) assert.ok(name in m, `${label} 导出 ${name}`)
  }
  // 函数：各自解析上下文内 === 核件（严格恒等——转口 = 同一绑定，非再实现）
  for (const name of FUNCS) {
    assert.equal(typeof core[name], "function", `核件导出函数 ${name}`)
    assert.equal(vsc[name], coreViaVsc[name], `vsc 转口 ${name} === 核件（vsc 解析上下文）`)
    assert.equal(cli[name], coreViaCli[name], `cli 转口 ${name} === 核件（cli 解析上下文）`)
  }
  // 同一文件单源（realpath 大小写不敏感——Windows 目录链接目标盘符大小写差，见文件头注②）
  const canon = (u) => realpathSync(fileURLToPath(u)).toLowerCase()
  const coreReal = canon(CORE)
  assert.equal(canon(CORE_VIA_VSC), coreReal, "vsc 链路 ⇒ 核件同一文件")
  assert.equal(canon(CORE_VIA_CLI), coreReal, "cli 链路 ⇒ 核件同一文件")
  // 三常量值同（判据值 = 8 ∕ 2000 ∕ 8）
  const vals = (m) => CONSTS.map((n) => m[n])
  assert.deepEqual(vals(core), [8, 2000, 8], "核件三常量值")
  assert.deepEqual(vals(vsc), vals(core), "vsc 三常量值同核件")
  assert.deepEqual(vals(cli), vals(core), "cli 三常量值同核件")
  // 两转口档：转口行指向核件 + 零本地定义（结构扫描两形）
  for (const [label, url] of [["vsc", VSC], ["cli", CLI]]) {
    const src = readFileSync(fileURLToPath(url), "utf8")
    assert.ok(src.includes(`export { ${FIVE.join(", ")} } from "${CORE_SPEC}"`), `${label} 转口行（五名 ⇒ ${CORE_SPEC}）`)
    assert.deepEqual(defHits(src), [], `${label} 转口档零本地定义（五名）`)
  }
  // 负控（判别力自证）：合成「本地副本复活」源必须判红——锁红条件成立
  const resurrected = [
    "export const MAX_MERGE_ITEMS = 8",
    "export function planQueuedInput(items) { return items }",
    "const QUEUED_MAX_ITEMS = 8",
  ].join("\n")
  assert.deepEqual(
    defHits(resurrected),
    ["export:MAX_MERGE_ITEMS", "local:QUEUED_MAX_ITEMS", "export:planQueuedInput"],
    "负控：副本复活 ⇒ 扫描判红"
  )
})

// ─── B1–B5 行为用例（核件直驱）───────────────────────────────────────────

test("B1 合并计划：8 条 ⇒ 一批（count 8 · merged）· 第 9 条 ⇒ 截批留待下批 · 2001 字 ⇒ 单条直发 · 1001×2 ⇒ 逐条直发", () => {
  const short = (n) => Array.from({ length: n }, (_, i) => `m${i + 1}`)
  // 8 条短消息 ⇒ 一批（count 8 · merged）
  const a8 = core.planQueuedInput(short(8))
  assert.equal(a8.length, 1, "8 ⇒ 单动作")
  assert.equal(a8[0].count, 8)
  assert.equal(a8[0].merged, true)
  assert.equal(a8[0].text, core.formatMergedMessages(short(8)))
  // 第 9 条 ⇒ 截批留待下批（计划形 + 真消费留队两证）
  const a9 = core.planQueuedInput(short(9))
  assert.equal(a9[0].count, 8)
  assert.equal(a9[0].merged, true)
  assert.equal(a9[1].count, 1, "第 9 条不入首批")
  assert.equal(a9[1].merged, false)
  const q9 = short(9).map((text) => ({ text }))
  const t9 = core.takeQueuedBatchItem(q9)
  assert.equal(t9.merged, core.formatMergedMessages(short(8)), "首批 = 前 8 条")
  assert.deepEqual(q9.map((i) => i.text), ["m9"], "第 9 条留队（不丢）")
  // 单条 2001 字 ⇒ 直发（不进批）
  const long1 = "x".repeat(2001)
  const aL = core.planQueuedInput([long1])
  assert.deepEqual([aL.length, aL[0].count, aL[0].merged, aL[0].text], [1, 1, false, long1])
  // 两条 1001 字 ⇒ 逐条直发（合并文本 2028 > 2000 ⇒ 批总长超限截批）
  const pair = core.planQueuedInput(["y".repeat(1001), "z".repeat(1001)])
  assert.deepEqual(pair.map((a) => [a.count, a.merged]), [[1, false], [1, false]])
  assert.equal(pair[0].text, "y".repeat(1001))
  assert.equal(pair[1].text, "z".repeat(1001))
})

test("B2 形态文案：formatMergedMessages([\"a\",\"b\"]) 逐字 = 你排队了 2 条消息：+ 编号逐条 + ——一次处理", () => {
  assert.equal(core.formatMergedMessages(["a", "b"]), "你排队了 2 条消息：\n1. a\n2. b\n——一次处理")
})

test("B3 slash 分类：首动作 slash（count 1 · 保序）· 后续 turn（count 2 · merged）", () => {
  const acts = core.planQueuedInput(["/x", "y", "z"])
  assert.deepEqual(acts[0], { kind: "slash", text: "/x", count: 1 })
  assert.equal(acts[1].kind, "turn")
  assert.equal(acts[1].count, 2)
  assert.equal(acts[1].merged, true)
  assert.equal(acts[1].text, core.formatMergedMessages(["y", "z"]))
})

test("B4 取项件：空队 ⇒ {null,null} · 两条 ⇒ 合并 item（text = merged · 队列清）· 携图批 ⇒ count 1 退化逐条", () => {
  assert.deepEqual(core.takeQueuedBatchItem([]), { item: null, merged: null })
  const q2 = [{ text: "a" }, { text: "b" }]
  const r2 = core.takeQueuedBatchItem(q2)
  const merged2 = core.formatMergedMessages(["a", "b"])
  assert.equal(r2.merged, merged2)
  assert.equal(r2.item.text, merged2)
  assert.equal(q2.length, 0, "队列清")
  const qM = [{ text: "a" }, { text: "b", images: ["data:image/png;base64,x"] }]
  const rM = core.takeQueuedBatchItem(qM)
  assert.equal(rM.merged, "a", "携图批 ⇒ count 1 退化逐条")
  assert.equal(qM.length, 1, "一条已取 ∕ 一条留存")
  assert.equal(qM[0].text, "b")
})

test("B5 空 ∕ 非串：[] ⇒ [] · 非串 ⇒ String 化同判（零抛）", () => {
  assert.deepEqual(core.planQueuedInput([]), [])
  const acts = core.planQueuedInput([1, 2])
  assert.equal(acts.length, 1)
  assert.equal(acts[0].count, 2)
  assert.equal(acts[0].merged, true)
  assert.equal(acts[0].text, core.formatMergedMessages(["1", "2"]))
})
