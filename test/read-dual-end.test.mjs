/**
 * read-dual-end.test.mjs — read 工具双端返回（DUAL-END-TRUNCATION F-1，C 方案——
 * docs/design/DUAL-END-TRUNCATION.md，2026-09-09——CLI test/read-dual-end.test.mjs
 * 同构镜像，编号格式按 VSC 侧 padStart(6)）：
 * 大文件（> MAX_READ_LINES=2000 行）窗口截断时返回 头（请求窗口）+ `…(truncated:
 * K lines in middle, use offset to continue)` + 尾（末 READ_TAIL_LINES=500 行）——
 * 行数/total 注补（VSC 现无 2000 上限无 total 尾注——本实现补 default 2000 上限 +
 * 窗口截断时的 total 尾注 + 双端形态）。AC-1 边沿：offset 窗口与尾区重叠不重复 /
 * 无中段 K=0 无假省略注 / ≤ 阈值文件走旧路径零变化。hashes 模式照常（AC-3）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readTool, READ_TAIL_LINES } from "../src/tools/file.mjs"
import { MAX_READ_LINES } from "../src/tools/shared.mjs"

/** mkdtemp 项目 + 写 n 行文件（"line N"，1-based——无尾随换行 → split("\n") = n 行）。 */
function fixture(n) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vsc-read-dual-"))
  const name = "big.txt"
  const lines = Array.from({ length: n }, (_, i) => `line ${i + 1}`)
  writeFileSync(join(dir, name), lines.join("\n"), "utf8")
  return { dir, name, lines, cleanup: () => { try { rmSync(dir, { recursive: true, force: true }) } catch {} } }
}
const num = (ln) => String(ln).padStart(6, " ")
const listing = (lines, from, to) => lines.slice(from - 1, to).map((l, i) => `${num(from + i)}\t${l}`).join("\n")
const run = (f, args) => readTool.execute({ path: f.name, ...args }, { cwd: f.dir })

// AC-1/F-1 — 大文件默认读：头 N（窗口 1..2000）+ 省略注（K=100）+ 尾 M（2101..2600）
test("F-1: 大文件默认读返回 头+省略注+尾（K = total − 窗口 − 尾）", async (t) => {
  const f = fixture(2600)
  t.after(f.cleanup)
  const out = await run(f, {})
  assert.ok(out.startsWith(`${num(1)}\tline 1`), "头第一行在")
  assert.ok(out.includes(`${num(2000)}\tline 2000`), "头窗口末行在")
  const k = 2600 - MAX_READ_LINES - READ_TAIL_LINES // 100
  assert.ok(out.includes(`…(truncated: ${k} lines in middle, use offset to continue)`), `省略注在（K=${k}）`)
  assert.ok(out.includes(`${num(2101)}\tline 2101`), "尾第一行（真实尾行内容——非纯注）在")
  assert.ok(out.endsWith(`${num(2600)}\tline 2600`), "文件真实末行在输出尾")
  assert.ok(!out.includes(`${num(2050)}\t`), "中段行（2001..2100）不出现")
  assert.equal(out.split("\n").length, 2000 + 1 + 500) // 头 + 注 + 尾
})

// AC-1 边沿 — ≤ 阈值（2000 行）文件默认读：完整列出、无任何省略注（旧路径零变化）
test("AC-1 边沿: ≤阈值文件零变化——默认读完整列出、无省略注", async (t) => {
  const f = fixture(2000)
  t.after(f.cleanup)
  const out = await run(f, {})
  assert.equal(out, listing(f.lines, 1, 2000))
  assert.ok(!out.includes("truncated") && !out.includes("…"), "无省略注")
})

// AC-1 边沿 — ≤ 阈值 + 显式小窗口：旧窗口路径 + 补 total 尾注（行数提示补——CLI parity）
test("AC-1 边沿: ≤阈值文件 + 显式小窗口——窗口 + total 尾注", async (t) => {
  const f = fixture(1500)
  t.after(f.cleanup)
  const out = await run(f, { limit: 100 })
  assert.equal(out, listing(f.lines, 1, 100) + `\n... (1500 lines total, use offset to continue)`)
})

// AC-1 边沿 — 窗口与尾区重叠：K=0 → 无假省略注 + 剩余整印 + 任何行不重复
test("AC-1 边沿: 重叠 K=0——无假省略注 + 剩余整印 + 不重复", async (t) => {
  const f = fixture(2400) // 2400 ≤ 窗口(2000) + 尾(500)——尾区起点落窗口内
  t.after(f.cleanup)
  const out = await run(f, {})
  assert.equal(out, listing(f.lines, 1, 2400), "整文件列出（窗口 + 余段）")
  assert.ok(!out.includes("truncated") && !out.includes("…"), "K=0 无假省略注")
})

// AC-1 边沿 — offset 窗口完全落在尾区内：重叠去重（tail 从窗口后开始——不重复打印）
test("AC-1 边沿: offset 窗口在尾区内——重叠不重复、余段完整", async (t) => {
  const f = fixture(2600)
  t.after(f.cleanup)
  const out = await run(f, { offset: 2400, limit: 100 }) // 窗口 2400..2499，文件余 2500..2600
  assert.equal(out, listing(f.lines, 2400, 2600))
  assert.ok(!out.includes("truncated"), "重叠 → K=0 无注")
  assert.equal(out.split(`${num(2401)}\t`).length - 1, 1, "窗口行仅一次（不重复）")
})

// AC-3 — offset 续读路径：中段窗口双端、越近文件尾的窗口走旧路径（续读到尾）
test("AC-3: offset 续读路径不变——中段窗口双端、近尾窗口旧路径", async (t) => {
  const f = fixture(10000)
  t.after(f.cleanup)
  const mid = await run(f, { offset: 5000, limit: 2000 }) // 窗口 5000..6999
  assert.ok(mid.startsWith(`${num(5000)}\tline 5000`), "offset 续读——头从 offset 起")
  const k = 9500 - 6999 // 尾区 9501..10000，中段 7000..9500
  assert.ok(mid.includes(`…(truncated: ${k} lines in middle, use offset to continue)`), `中段省略注在（K=${k}）`)
  assert.ok(mid.includes(`${num(9501)}\tline 9501`) && mid.endsWith(`${num(10000)}\tline 10000`), "真实尾部在")
  const tail = await run(f, { offset: 9000, limit: 2000 }) // 窗口达文件尾 → 旧路径
  assert.equal(tail, listing(f.lines, 9000, 10000), "近尾窗口旧路径——整余段无注")
})

// AC-3 — hashes 模式与双端返回交互：头尾行 hash 照常（hash 域与 hashline_edit 一致）
test("AC-3: hashes 模式头尾行 hash 照常", async (t) => {
  const f = fixture(2600)
  t.after(f.cleanup)
  const out = await run(f, { hashes: true })
  const h1 = createHash("sha256").update(f.lines[0]).digest("hex").slice(0, 12)
  const hN = createHash("sha256").update(f.lines[2599]).digest("hex").slice(0, 12)
  assert.ok(out.startsWith(`${num(1)}${h1}  line 1`), "头行 hash 在")
  assert.ok(out.endsWith(`${num(2600)}${hN}  line 2600`), "尾行 hash 在")
  assert.ok(out.includes(`…(truncated: 100 lines in middle, use offset to continue)`), "hashes 模式省略注在")
})
