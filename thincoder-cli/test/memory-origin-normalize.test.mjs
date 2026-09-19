/**
 * memory-origin-normalize.test.mjs — §6.11 origin 归一（TUI 假死批 2026-09-18 ·
 * 批档 `docs/batches/2026-09-18-tui-freeze.md` §2.5 用例表 T-O1/T-O2/T-O3）。
 *
 * 行为面：**同一棵树两种拼写 ⇒ 库内一个 origin 键**（单次索引、检索同批行——「半可见」收正）；
 * 纯函数面：三变换（`\`→`/` · 盘符大写 · 去尾斜杠）+ 非字符串 / 空串透传。
 *
 * 快层：in-memory sqlite + tmp 目录——无 git、无网络。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createMemory, codeSync, docSync, syncDir, codeSearch, docSearch } from "@thincoder/core/memory.mjs"
import { normalizeOrigin } from "@thincoder/core/memory/origin.mjs"

/** 同一树的第二种拼写（设计三变换：盘符大小写 ∨ 分隔符反形 ∨ 尾斜杠——POSIX 退化为尾斜杠）。 */
function altSpelling(dir) {
  const lower = normalizeOrigin(dir).replace(/^([A-Za-z]):/, (_m, d) => `${d.toLowerCase()}:`)
  return process.platform === "win32" ? `${lower.replaceAll("/", "\\")}\\` : `${lower}/`
}

/** 夹具：proj（代码 + 文档）+ mem（project 层记忆目录）+ in-memory 库。 */
async function fixture(t) {
  const base = await mkdtemp(join(tmpdir(), "thincoder-origin-"))
  // Windows 句柄滞后：codeSync 会 spawn git（cwd = 本目录）——子进程未及退出时 rmdir 会 EBUSY；
  // 清理带退避重试，仍锁则放弃（残留 tmp 目录无害——既有先例：VSC 测试同款容忍）。
  t.after(async () => {
    for (let i = 0; i < 10; i++) {
      try { await rm(base, { recursive: true, force: true, maxRetries: 2, retryDelay: 50 }); return } catch { /* handle lag */ }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  })
  const proj = join(base, "proj")
  await mkdir(join(proj, "src"), { recursive: true })
  await writeFile(join(proj, "src", "a.mjs"), "export function needleAlpha() { return 1 }\n", "utf8")
  await writeFile(join(proj, "readme.md"), "# needleAlpha\n\nthe needle alpha doc lives here\n", "utf8")
  const memDir = join(base, "mem")
  await mkdir(memDir, { recursive: true })
  await writeFile(join(memDir, "note.md"), "---\ntype: rule\ntitle: needleAlpha note\ntags: []\nauthor: t\n---\nneedle alpha body\n", "utf8")
  return { base, proj, memDir, mem: createMemory({ dbPath: ":memory:" }) }
}

/** 全量读数（origin 键集合 + 三表行数——两拼写同步后须逐项零变）。 */
function counts(mem) {
  const one = (sql) => mem.db.prepare(sql).get()
  return {
    codeRows: one(`SELECT COUNT(*) AS n FROM code_chunks`).n,
    codeOrigins: mem.db.prepare(`SELECT DISTINCT origin FROM code_chunks`).all().map((r) => r.origin).sort(),
    docRows: one(`SELECT COUNT(*) AS n FROM doc_chunks`).n,
    docOrigins: mem.db.prepare(`SELECT DISTINCT origin FROM doc_chunks`).all().map((r) => r.origin).sort(),
    fileRows: one(`SELECT COUNT(*) AS n FROM files WHERE layer = 'project'`).n,
    fileOrigins: mem.db.prepare(`SELECT DISTINCT origin FROM files WHERE layer = 'project'`).all().map((r) => r.origin).sort(),
    codeFileChunks: one(`SELECT COUNT(*) AS n FROM code_chunks WHERE path = 'src/a.mjs'`).n,
    noteRows: one(`SELECT COUNT(*) AS n FROM files WHERE layer = 'project' AND path = 'note.md'`).n,
  }
}

test("T-O1 正常：同树两拼写（codeSync / docSync / syncDir）⇒ origin 键 = 1 ∧ 恰一行 ∧ 计数不翻倍", async (t) => {
  const { proj, memDir, mem } = await fixture(t)
  await codeSync(mem, proj, {})
  await docSync(mem, proj, {})
  await syncDir(mem, { layer: "project", dir: memDir })
  const before = counts(mem)
  assert.deepEqual(before.codeOrigins, [normalizeOrigin(proj)], "首次同步：库内 origin = 归一形（非原样拼写）")
  assert.ok(before.codeRows > 0 && before.docRows > 0 && before.fileRows > 0, "三面皆有行")

  // 第二种拼写同步**同一棵树**
  await codeSync(mem, altSpelling(proj), {})
  await docSync(mem, altSpelling(proj), {})
  await syncDir(mem, { layer: "project", dir: altSpelling(memDir) })
  const after = counts(mem)

  assert.deepEqual(after, before, "两拼写折叠到同一 origin 键：行数零增（不翻倍）")
  assert.equal(after.codeOrigins.length, 1, "该树 origin 键集合大小 = 1")
  assert.equal(after.docOrigins.length, 1)
  assert.equal(after.fileOrigins.length, 1)
  assert.equal(after.noteRows, 1, "(layer, origin, path) 恰一行")
})

test("T-O2 边界：读缝两拼写取到同一批行（codeSearch / docSearch）", async (t) => {
  const { proj, mem } = await fixture(t)
  await codeSync(mem, proj, {})
  await docSync(mem, proj, {})
  const read = async (origin) => {
    mem.codeOrigin = origin
    const code = await codeSearch(mem, "needleAlpha", { limit: 5 })
    const doc = await docSearch(mem, "needleAlpha", { limit: 5 })
    return { code: code.map((r) => `${r.path}:${r.line_start}`), doc: doc.map((r) => `${r.path}:${r.line_start}`) }
  }
  const asWritten = await read(proj)
  const asAlt = await read(altSpelling(proj))
  assert.ok(asWritten.code.length > 0, "原文拼写命中非空（FTS 通道）")
  assert.ok(asWritten.doc.length > 0, "文档通道命中非空")
  assert.deepEqual(asAlt, asWritten, "两种拼写取到同一批行（半可见收正）")
})

test("T-O3 错误：非字符串 / 空串原样透传 ∧ 三变换逐条（幂等）∧ 入口不炸", async () => {
  // 类型护栏：非字符串 / 空串原样透传
  for (const v of [null, undefined, 123, {}, [], ""]) assert.deepEqual(normalizeOrigin(v), v)
  // 三变换逐条 + 幂等
  for (const [input, expected] of [
    ["c:\\x\\y\\", "C:/x/y"],
    ["E:\\proj\\sub\\", "E:/proj/sub"],
    ["C:/", "C:/"],
    ["/", "/"],
    ["d:", "D:"],
    ["a/b/", "a/b"],
  ]) {
    assert.equal(normalizeOrigin(input), expected, `${input} → ${expected}`)
    assert.equal(normalizeOrigin(normalizeOrigin(input)), expected, `${input}：幂等`)
  }
  // 入口不炸：origin 未设 / 空串 ⇒ 无过滤读（零行零抛）
  const mem = createMemory({ dbPath: ":memory:" })
  for (const origin of [null, undefined, ""]) {
    mem.codeOrigin = origin
    assert.deepEqual(await codeSearch(mem, "x", { limit: 3 }), [])
    assert.deepEqual(await docSearch(mem, "x", { limit: 3 }), [])
  }
  // 缺失目录 ⇒ 零行零抛（既有降级语义原样）
  assert.deepEqual(await syncDir(mem, { layer: "project", dir: null }), { added: 0, updated: 0, removed: 0, skipped: 0 })
})
