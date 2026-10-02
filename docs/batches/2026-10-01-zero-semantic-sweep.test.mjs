/**
 * 2026-10-01-zero-semantic-sweep.test.mjs — 批内件（零语义清账批 · 台账 #781 ∥ #783 ∥ #753 ∥ #756 ∥ #763 ∥ #777 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-01-zero-semantic-sweep.md` §2（§2.2 逐项落点 ∥ §2.8 腿清单 L1–L9 ∥ §2.9 验收对照）。
 * 九腿（全绿 = 批内验收）：
 *   L1 源面锁（#781）：turn-driver.mjs「四查位」×2 + 第 ④ 项枚举在位；turn-face.mjs `end` 出站块 13 行齐 ≥4 空格（零 2 空格残行）。
 *   L2 负向锁（#781）：`thincoder-desktop/src/main/**` 窄域「三查位」零命中。
 *   L3 源/负向锁（#783）：streaming.js 含 `question.js` ∥ 不含「removes its own card」。
 *   L4 负向/正向锁（#753 族）：七处旧串逐串零命中（行拆容忍 = 注释前缀 + 空白归一后扫）∥ 新锚（消费面补发 ∥ 两态 ∥ 消费窗）在位
 *        ∥ `finishSubTasksByRole` 零命中（扫描域 = cli/src ∥ core ∥ vscode/src）。
 *   L5 实跑（#753 烟测）：`thincoder-cli` 为 cwd 直载 `src/tui/subagent-blocks.mjs` ∥ `src/tui/subagent-freeze.mjs` ⇒ exit 0。
 *   L6 源面锁（#756）：batch.mjs 含「用例 §4.8」∥ 不含「BR-1–26」；TOOLS.md ∥ AGENT-LOOP-UPSTREAM.md 不含 `batch_segment`；
 *        BATCH-RECORD.md 非表行 >300 = 0（两谓词复跑）。
 *   L7 实跑（#763）：`node --test docs/batches/2026-09-30-theme-switch.test.mjs`（无 `--import`）⇒ exit 0 ∧ `pass 6`。
 *   L8 实跑（#777）：`node --test docs/batches/2026-09-30-desktop-residuals.test.mjs` ⇒ exit 0 ∧ `pass 15`。
 *   L9 负控（防空扫假绿）：已证正例在位（`async-settle.mjs` 含「消费面补发」——同谓词灵敏度先证）。
 * 口径：平 node 直测（本档自身零 `/rc/` 依赖）；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-10-01-zero-semantic-sweep.test.mjs
 * 本件不进仓套件（批内件 · 随批留存；随批复跑 = 直接跑本档）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-cli/src/tui/subagent-blocks.mjs"))) {
  throw new Error(`cwd 非仓根 thincoder/（实 = ${ROOT}）`)
}
const read = (p) => readFileSync(resolve(ROOT, p), "utf8")
/** 子进程环境（L5/L7/L8）：剥 `NODE_TEST_CONTEXT`——本档常以 `node --test` 运行，该变量会让嵌套 `node --test` 子进程被当成「已是测试子进程」而静默空跑（exit 0 ∧ 零输出 ⇒ 假绿）。 */
const childEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT"))
/** 行拆容忍归一：逐行去注释前缀 + 空白归一（旧串跨注释续行时仍可判）。 */
const flat = (t) => t
  .split(/\r?\n/)
  .map((l) => l.replace(/^\s*(?:\/\/+|\/\*+|\*+)?\s?/, ""))
  .join(" ")
  .replace(/\s+/g, " ")

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".git") continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}
const textsOf = (dir, ext = /\.(mjs|js|cjs)$/) =>
  walk(resolve(ROOT, dir)).filter((f) => ext.test(f)).map((f) => readFileSync(f, "utf8"))

test("L1 · 源面锁（#781）：turn-driver「四查位」×2 + 第④项枚举 ∥ turn-face `end` 块 13 行齐 4 空格", () => {
  const td = read("thincoder-desktop/src/main/turn-driver.mjs")
  assert.equal((td.match(/四查位/g) ?? []).length, 2, "「四查位」恰两处（:53 查位枚举 ∥ :117 墓碑同源注）")
  assert.ok(td.includes("四查位同失效"), "查位枚举句在位（:53）")
  assert.ok(td.includes("边界轮 `end` 帧 ∥ 记录零写"), "第 ④ 项枚举在位（口径对齐 PROJECT.md:135）")
  assert.ok(td.includes("中止墓碑四查位同源"), "墓碑同源注收正（:117）")

  const tf = read("thincoder-desktop/src/main/turn-face.mjs").split(/\r?\n/)
  const i0 = tf.findIndex((l) => l.startsWith("    /** 边界轮"))
  assert.notEqual(i0, -1, "`end` 出站块锚未命中")
  const block = tf.slice(i0, i0 + 13)
  assert.equal(block.length, 13, "块 = 13 行（注释 4 ∥ endEmitted ∥ emitDigestEnd 8）")
  assert.ok(block.every((l) => /^ {4}/.test(l)), "13 行齐 ≥4 空格")
  assert.equal(block.some((l) => /^ {2}\S/.test(l)), false, "零 2 空格残行（#719 遗留收正）")
  assert.ok(block[4].startsWith("    let endEmitted"), "endEmitted 齐位")
  assert.ok(block[5].startsWith("    const emitDigestEnd"), "emitDigestEnd 齐位")
  assert.ok(block[12].startsWith("    }"), "收括号齐位")
})

test("L2 · 负向锁（#781）：`thincoder-desktop/src/main/**` 窄域「三查位」零命中", () => {
  const hits = walk(resolve(ROOT, "thincoder-desktop/src/main"))
    .filter((f) => readFileSync(f, "utf8").includes("三查位"))
    .map((f) => f.replace(/\\/g, "/"))
  assert.deepEqual(hits, [], `窄域零命中（命中 = ${hits.join(" ∥ ")}）`)
})

test("L3 · 源/负向锁（#783）：streaming.js 新锚 `question.js` 在位 ∥ 旧串零命中", () => {
  const st = read("thincoder-vscode/webview/streaming.js")
  assert.equal(st.includes("removes its own card"), false, "旧归属串（removes its own card）零命中")
  assert.ok(st.includes("question.js"), "新锚（归属 = 端壳 question.js）在位")
})

test("L4 · 负向/正向锁（#753 族）：七处旧串零命中 ∥ 新锚在位 ∥ dead-export 零残留", () => {
  const cliTexts = textsOf("thincoder-cli/src")
  const oldStrs = [
    "完成即冻结", // 处 1–2（subagent-blocks 两处）
    "settle 时发", // 处 1–2
    "freezes via the ⟦ev⟧done event at settle", // 处 3（tool-display）
    "The block freezes on the ⟦ev⟧done settle event", // 处 4（tool-events）
    "the block freezes on the ⟦ev⟧done/stopped settle event at flight end", // 处 5（tool-events）
    "正常态块已在 settle 时各自冻结", // 处 6（agent-turn）
    "The ⟦ev⟧done freeze is NOT emitted here", // 处 7（run-stages）
  ]
  for (const s of oldStrs) {
    assert.equal(cliTexts.some((t) => flat(t).includes(flat(s))), false, `旧串零命中（cli/src）：${s}`)
  }
  assert.equal(flat(read("thincoder-core/agent/run-stages.mjs")).includes("The ⟦ev⟧done freeze is NOT emitted here"), false, "旧串零命中（core ∥ run-stages）")

  const sb = read("thincoder-cli/src/tui/subagent-blocks.mjs")
  assert.equal((sb.match(/消费面补发/g) ?? []).length, 2, "新锚「消费面补发」×2（两处）")
  assert.equal((sb.match(/两态/g) ?? []).length, 2, "新锚「两态」×2（两处）")
  for (const a of ["消费面补发", "两态", "消费窗"]) {
    assert.ok(cliTexts.some((t) => t.includes(a)), `新锚在位（cli/src）：${a}`)
  }
  for (const f of [
    "thincoder-cli/src/tui/tool-display.mjs",
    "thincoder-cli/src/tui/tool-events.mjs",
    "thincoder-cli/src/tui/agent-turn.mjs",
    "thincoder-core/agent/run-stages.mjs",
  ]) {
    assert.ok(read(f).includes("消费窗"), `消费窗锚在位：${f}`)
  }

  const scan = [...cliTexts, ...textsOf("thincoder-core"), ...textsOf("thincoder-vscode/src")]
  assert.equal(scan.some((t) => t.includes("finishSubTasksByRole")), false, "`finishSubTasksByRole` 零命中（cli/src ∥ core ∥ vscode/src）")
})

test("L5 · 实跑（#753 烟测）：cli cwd 直载两档 ⇒ exit 0", () => {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e",
    "await import('./src/tui/subagent-blocks.mjs'); await import('./src/tui/subagent-freeze.mjs')"],
    { cwd: resolve(ROOT, "thincoder-cli"), encoding: "utf8", timeout: 120000, env: childEnv })
  assert.equal(r.status, 0, `exit 0（stderr 尾 = ${r.stderr.trim().slice(-400)}）`)
})

test("L6 · 源面锁（#756）：batch.mjs 头注新形 ∥ 两档名面零残留 ∥ BATCH-RECORD 行宽 0", () => {
  const bm = read("thincoder-core/agent-tools/batch.mjs")
  assert.ok(bm.includes("用例 §4.8"), "头注新形「用例 §4.8」在位")
  assert.equal(bm.includes("BR-1–26"), false, "旧串「BR-1–26」零命中")
  for (const f of ["docs/core/design/TOOLS.md", "docs/core/design/AGENT-LOOP-UPSTREAM.md"]) {
    assert.equal(read(f).includes("batch_segment"), false, `名面零残留（batch_segment）：${f}`)
  }
  const lines = read("docs/core/design/BATCH-RECORD.md").split(/\r?\n/)
  const p1 = lines.filter((l) => /^[^|].{299,}$/.test(l))
  const p2 = lines.filter((l) => l.length > 300 && !l.startsWith("|"))
  assert.deepEqual([...p1, ...p2], [], "非表行 >300 零命中（两谓词复跑）")
})

test("L7 · 实跑（#763）：theme-switch 平跑（无 --import）⇒ exit 0 ∧ pass 6", () => {
  const r = spawnSync(process.execPath, ["--test", "docs/batches/2026-09-30-theme-switch.test.mjs"],
    { cwd: ROOT, encoding: "utf8", timeout: 180000, env: childEnv })
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 0, `exit 0（输出尾 = ${out.trim().slice(-400)}）`)
  assert.ok(/\bpass 6\b/.test(out), "`pass 6`（六腿全绿）")
})

test("L8 · 实跑（#777）：desktop-residuals 整件 ⇒ exit 0 ∧ pass 15", () => {
  const r = spawnSync(process.execPath, ["--test", "docs/batches/2026-09-30-desktop-residuals.test.mjs"],
    { cwd: ROOT, encoding: "utf8", timeout: 180000, env: childEnv })
  const out = `${r.stdout}\n${r.stderr}`
  assert.equal(r.status, 0, `exit 0（输出尾 = ${out.trim().slice(-400)}）`)
  assert.ok(/\bpass 15\b/.test(out), "`pass 15`（整件全绿）")
})

test("L9 · 负控（防空扫假绿）：已知正例在位（扫描谓词灵敏度先证）", () => {
  assert.ok(read("thincoder-core/agent-tools/async-settle.mjs").includes("消费面补发"), "正例在位：async-settle.mjs 含「消费面补发」")
  assert.ok(read("thincoder-cli/src/tui/subagent-blocks.mjs").includes("消费面补发"), "同谓词对本批改动面命中（L4 正例敏感）")
})
