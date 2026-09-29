/**
 * 波B 机检腿（残余族清账批 · 2026-09-29 · 跨树码面）——候选终位 = `docs/batches/2026-09-29-desktop-residuals-sweep.test.mjs`
 * （写门相抵 #545 ⇒ 潜行形 `.thincoder/tmp/`；父侧收位时并入终位）。
 *
 * 覆盖：
 *  - #563① 核 `subblocks/block.mjs` `initBlockFollow` 监听集 = wheel / touchmove / pointerdown / scroll（动态实调 + handler 真接线）；
 *  - 让位三律（#603 让位修复批 · 2026-09-29）：非手势位移不改旗标 ∕ 手势门内离底翻假 ∕ 近底无条件翻真
 *    （父侧随动 2026-09-29——旧三件监听集与旧单 scroll 语义断言被取代）；
 *  - #555 五处注释坐标**双侧比对**（注释新坐标串在场 + 旧串退场 + 目标行符号在场）；
 *  - 读数（内容行数）。
 * 届盘口径（2026-09-29）：⑤ `agent.mjs` 坐标按届盘 245 落（设计轮值 242 于 B1-P4-I +3 行后已漂）；
 * ① 四坐标由 B1-P4-I 整组移除（无裁定）⇒ 按本批设计意图回写届盘值（父侧裁定 a）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..") // .thincoder/tmp → 仓根
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const lineAt = (rel, n) => text(rel).split("\n")[n - 1] ?? ""
const contentLines = (rel) => text(rel).split("\n").length - 1 // 内容行数口径（文末换行不计）

const CORE = "thincoder-core"
const VSC = "thincoder-vscode/src"

// ─── #563① 监听集（动态实调核原语）──────────────────────────────────────────

test("#563① block.mjs · initBlockFollow 监听集 = wheel / touchmove / scroll", async () => {
  const mod = await import(new URL("../../thincoder-render-core/subblocks/block.mjs", import.meta.url))
  const seen = []
  const handlers = {}
  const content = { addEventListener: (ev, fn) => { seen.push(ev); handlers[ev] = fn } }
  mod.initBlockFollow({ querySelector: (sel) => (sel === ".advisor-content" ? content : null) })
  assert.deepEqual(seen, ["wheel", "touchmove", "pointerdown", "scroll"], "监听集全量 + 顺序（让位三律收正——取代旧三件）")
  assert.ok(seen.includes("scroll"), "scroll ∈ listeners")
  // 让位三律（2026-09-29 让位修复批 · 取代旧『离底 ⇒ false』单 scroll 语义）：
  content._pinFollow = true
  content.scrollHeight = 100; content.scrollTop = 50; content.clientHeight = 0
  handlers.scroll()
  assert.equal(content._pinFollow, true, "非手势位移不改旗标")
  handlers.wheel()
  handlers.scroll()
  assert.equal(content._pinFollow, false, "手势门内离底 ⇒ 翻假（让位）")
  content.scrollTop = 95
  handlers.scroll()
  assert.equal(content._pinFollow, true, "近底 gap 5 < 24 ⇒ 无条件翻真")
})

test("#563① block.mjs · 内容区缺失 ⇒ 零操作（不抛）", async () => {
  const mod = await import(new URL("../../thincoder-render-core/subblocks/block.mjs", import.meta.url))
  assert.doesNotThrow(() => mod.initBlockFollow({ querySelector: () => null }))
})

// ─── #555 五处坐标双侧比对 ─────────────────────────────────────────────────

test("#555① setup.mjs · 四坐标回写（父侧裁定 a——B1-P4-I 整组移除后按设计意图回写届盘值）", () => {
  const src = text(`${VSC}/agent/setup.mjs`)
  for (const s of ["`subagent.mjs:271`", "`:194`", "`subagent-spawn.mjs:304`", "`subagent-async.mjs:291`"]) {
    assert.ok(src.includes(s), `新坐标在场：${s}`)
  }
  for (const s of ["`subagent.mjs:258`", "`subagent-spawn.mjs:305`", "`subagent-async.mjs:272`"]) {
    assert.ok(!src.includes(s), `旧串退场：${s}`)
  }
  assert.ok(lineAt(`${CORE}/agent-tools/subagent.mjs`, 271).includes("parent.autoApprove"), "spawn 门 271")
  assert.ok(lineAt(`${CORE}/agent-tools/subagent.mjs`, 194).includes("escalate"), "escalate 门 194")
  assert.ok(lineAt(`${CORE}/agent-tools/subagent-spawn.mjs`, 304).includes("parent.autoApprove"), "子代权限继承 304")
  assert.ok(lineAt(`${CORE}/agent-tools/subagent-async.mjs`, 291).includes("agent.autoApprove"), "读点族 291")
})

test("#555② panel-callbacks · `dispatch.mjs:441` 文件错位 ⇒ `dispatch-run.mjs:137`", () => {
  const src = text(`${VSC}/extension/panel-callbacks.mjs`)
  assert.ok(src.includes("`dispatch-run.mjs:137`"))
  assert.ok(!src.includes("`dispatch.mjs:441`"))
  assert.ok(lineAt(`${CORE}/agent/dispatch-run.mjs`, 137).includes("toolCtx._subagentKey"), "第 4 参传入行")
})

test("#555③④ panel-callbacks · subagent-spawn 两坐标（319⇒318 · 308-309⇒308）", () => {
  const src = text(`${VSC}/extension/panel-callbacks.mjs`)
  assert.ok(src.includes("`subagent-spawn.mjs:318`"))
  assert.ok(!src.includes("`subagent-spawn.mjs:319`"))
  assert.ok(src.includes("`subagent-spawn.mjs:308`"))
  assert.ok(!src.includes("`subagent-spawn.mjs:308-309`"))
  assert.ok(lineAt(`${CORE}/agent-tools/subagent-spawn.mjs`, 318).includes("${ownerKey}/${name}"), "键形写点 318")
  assert.ok(lineAt(`${CORE}/agent-tools/subagent-spawn.mjs`, 308).includes("!ctx.onPermissionRequest) return false"), "静默分支 308")
})

test("#555⑤ panel-subagent-relay · 六类 token 五档坐标（含 turn-loop.mjs 重锚 77——核拆分后）", () => {
  const src = text(`${VSC}/extension/panel-subagent-relay.mjs`)
  const present = ["`subagent-run.mjs:163`", "`subagent-scheduler.mjs:356`", "`subagent-async.mjs:281`", "`async-settle.mjs:239/273/275`", "`agent/turn-loop.mjs:77`"]
  const absent = ["`subagent-run.mjs:143`", "`subagent-scheduler.mjs:337`", "`subagent-async.mjs:262`", "`async-settle.mjs:228/262/264`", "`agent.mjs:207`", "`agent.mjs:245`"]
  for (const s of present) assert.ok(src.includes(s), `新坐标在场：${s}`)
  for (const s of absent) assert.ok(!src.includes(s), `旧串退场：${s}`)
  const rows = [
    [`${CORE}/agent-tools/subagent-run.mjs`, 163, "⟦ev⟧async"],
    [`${CORE}/agent-tools/subagent-scheduler.mjs`, 356, "⟦ev⟧queued"],
    [`${CORE}/agent-tools/subagent-async.mjs`, 281, "⟦ev⟧cancelled"],
    [`${CORE}/agent-tools/async-settle.mjs`, 239, "⟦ev⟧stopped"],
    [`${CORE}/agent-tools/async-settle.mjs`, 273, "⟦ev⟧settled"],
    [`${CORE}/agent-tools/async-settle.mjs`, 275, "⟦ev⟧done"],
    [`${CORE}/agent/turn-loop.mjs`, 77, "⟦ev⟧turn"],
  ]
  for (const [f, n, anchor] of rows) {
    assert.ok(lineAt(f, n).includes(anchor), `${f}:${n} 携 ${anchor}`)
  }
})

// ─── 读数 ─────────────────────────────────────────────────────────────────

test("读数（内容行数 · 届盘 2026-09-29）", () => {
  const files = [
    "thincoder-render-core/subblocks/block.mjs",
    `${VSC}/agent/setup.mjs`,
    `${VSC}/extension/panel-callbacks.mjs`,
    `${VSC}/extension/panel-subagent-relay.mjs`,
    `${CORE}/agent-tools/subagent.mjs`,
    `${CORE}/agent-tools/subagent-spawn.mjs`,
    `${CORE}/agent-tools/subagent-async.mjs`,
    `${CORE}/agent-tools/subagent-run.mjs`,
    `${CORE}/agent-tools/subagent-scheduler.mjs`,
    `${CORE}/agent-tools/async-settle.mjs`,
    `${CORE}/agent/dispatch-run.mjs`,
    `${CORE}/agent.mjs`,
  ]
  for (const f of files) console.log(`READ ${contentLines(f)}  ${f}`)
  assert.ok(files.length > 0)
})
