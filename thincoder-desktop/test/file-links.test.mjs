/**
 * file-links.test.mjs — 验存文件链接直测（「对齐第三批」相抵② · KD-39 —— `docs/desktop/design/UI.md` §1 本批注
 * 相抵② / `docs/desktop/design/PROJECT.md` §2 KD-39 / `docs/desktop/design/IPC.md` §1 `ev:tool-result` 行 `links`）。
 * 覆盖：盘上存在闸（真文件成链接 / 缺文件 / 同名目录不成链接）· 相对与绝对两径 · 行后缀（`:line` / `:line:col`）
 * · 去重 · 封顶 `MAX_LINKS` · URL 残体与「无 cwd」相对 token 两负向锁 · `fileOpenTarget` 载荷判据两向。
 * 纪律：平 node 直测（零 `electron` / 零网）——逐用例 `mkdtemp` 沙箱（不碰真实盘面 / 用户目录）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MAX_LINKS, extractFileLinks, fileOpenTarget } from "../src/main/file-links.mjs"

/** 沙箱：临时项目根（用例后整棵删除）。 */
function sandbox(t) {
  const dir = mkdtempSync(join(tmpdir(), "desktop-links-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

/** 绝对路径的正斜杠形（token 面与 win32 分隔符无关 —— 与 `links.path` 逐字同形）。 */
const slashed = (p) => p.split("\\").join("/")

// ─── U197 验存闸（正向 + 去重 + 两径 + 行后缀）────────────────────────

test("U197: 验存闸 —— 真文件成链接（相对 / 绝对 / 行后缀）· 缺文件与同名目录不成链接 · 去重", (t) => {
  const dir = sandbox(t)
  mkdirSync(join(dir, "src"))
  mkdirSync(join(dir, "pkg.bin")) // 同名目录（带扩展名 ⇒ 入 token 正则，但非文件）—— isFile 闸面
  writeFileSync(join(dir, "src", "a.mjs"), "x")
  writeFileSync(join(dir, "src", "col.cjs"), "y")
  writeFileSync(join(dir, "b.txt"), "z")
  const absB = slashed(join(dir, "b.txt"))
  const text = [
    "相对：src/a.mjs",
    "带行：src/a.mjs:12",
    "列位：src/col.cjs:12:5",
    `绝对：${absB}`,
    "重复：src/a.mjs",
    "缺件：src/missing.mjs",
    "目录：pkg.bin",
  ].join("\n")
  assert.deepEqual(extractFileLinks(dir, text), [
    { raw: "src/a.mjs", path: join(dir, "src", "a.mjs"), line: null },
    { raw: "src/a.mjs:12", path: join(dir, "src", "a.mjs"), line: 12 },
    { raw: "src/col.cjs:12:5", path: join(dir, "src", "col.cjs"), line: 12 },
    { raw: absB, path: absB, line: null },
  ], "四链接逐字（raw = 含行后缀原文 · path = 盘上绝对路径 · line = 数 / 缺 ⇒ null）；缺件 / 目录 / 重复三项零链接")
})

// ─── U198 负向锁（URL 残体 / 无 cwd 相对 token / 非串文本）· 封顶 · 载荷判据 ────

test("U198: 负向锁（URL 残体 · 无 cwd 相对 token · 空 / 非串文本）· 封顶 MAX_LINKS · `fileOpenTarget` 两向", (t) => {
  const dir = sandbox(t)
  writeFileSync(join(dir, "a.mjs"), "x")

  assert.deepEqual(extractFileLinks(dir, "//example.com/a.png"), [], "协议相对 URL 残体 ⇒ 不成链接")
  assert.deepEqual(extractFileLinks(dir, "\\\\srv\\share\\a.mjs"), [], "UNC 残体（双反斜杠起）⇒ 不成链接")
  assert.deepEqual(extractFileLinks(null, "a.mjs"), [], "无 cwd ⇒ 相对 token 零判据（不落 `process.cwd()` 第二解析基）")
  assert.equal(extractFileLinks(null, slashed(join(dir, "a.mjs"))).length, 1, "无 cwd ∧ 绝对 token ⇒ 照检（与 cwd 无关）")
  assert.deepEqual([extractFileLinks(dir, ""), extractFileLinks(dir, null), extractFileLinks(dir, 7)], [[], [], []], "空串 / 非串 / 非文本 ⇒ 零链接（零抛）")

  const names = []
  for (let i = 0; i < MAX_LINKS + 5; i += 1) {
    writeFileSync(join(dir, `f${i}.txt`), "x")
    names.push(`f${i}.txt`)
  }
  assert.equal(MAX_LINKS, 50, "封顶常量 = 50（值同源 = VSC 同档）")
  assert.equal(extractFileLinks(dir, names.join(" ")).length, MAX_LINKS, "逐结果封顶（55 命中 ⇒ 50）")

  assert.equal(fileOpenTarget({ path: "C:/x/y.mjs", line: 3 }), "C:/x/y.mjs", "`file:open` 载荷：非空绝对串 ⇒ 原样（`line` 不施加 —— 载荷备用）")
  assert.deepEqual(
    [fileOpenTarget({}), fileOpenTarget({ path: "" }), fileOpenTarget({ path: 7 }), fileOpenTarget(null), fileOpenTarget({ path: "src/a.mjs" })],
    [null, null, null, null, null],
    "缺 / 空串 / 非串 / 无载荷 / **相对串** ⇒ null（调用面出 `bad-path` —— 绝对性契约，禁按进程 cwd 静默解析）",
  )
})
