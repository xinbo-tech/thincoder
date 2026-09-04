/**
 * edit-tools.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { builtinTools } from "../src/tools/index.mjs"
import { lastWriteOf } from "../src/tools/file.mjs"



test("tools: apply_patch 多文件原子应用 / 新建文件 / 失败不落盘", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-patch-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "a.txt"), "one\ntwo\nthree\n")
    writeFileSync(join(dir, "b.txt"), "alpha\nbeta\ngamma\n")

    // 一个补丁改两个文件 + 建一个新文件
    const patch = [
      "--- a/a.txt",
      "+++ b/a.txt",
      "@@ -1,3 +1,3 @@",
      " one",
      "-two",
      "+TWO",
      " three",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@ -1,3 +1,4 @@",
      " alpha",
      "+inserted",
      " beta",
      " gamma",
      "--- /dev/null",
      "+++ b/sub/new.txt",
      "@@ -0,0 +1,2 @@",
      "+hello",
      "+world",
      "",
    ].join("\n")
    const out = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(out, /3 file/)
    assert.strictEqual(readFileSync(join(dir, "a.txt"), "utf8"), "one\nTWO\nthree\n")
    assert.strictEqual(readFileSync(join(dir, "b.txt"), "utf8"), "alpha\ninserted\nbeta\ngamma\n")
    assert.strictEqual(readFileSync(join(dir, "sub", "new.txt"), "utf8"), "hello\nworld\n")

    // touchedPaths 供 agent 层追踪
    assert.deepStrictEqual(byName.apply_patch.touchedPaths({ patch }), ["a.txt", "b.txt", "sub/new.txt"])

    // 原子性：第二个文件 hunk 不上，第一个文件也不能落盘
    const before = readFileSync(join(dir, "a.txt"), "utf8")
    const bad = [
      "--- a/a.txt",
      "+++ b/a.txt",
      "@@ -1,1 +1,1 @@",
      "-one",
      "+ONE",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@ -1,1 +1,1 @@",
      "-no-such-line",
      "+x",
      "",
    ].join("\n")
    await assert.rejects(() => byName.apply_patch.execute({ patch: bad }, ctx), /does not apply/)
    assert.strictEqual(readFileSync(join(dir, "a.txt"), "utf8"), before)

    // 上下文多处匹配 → 拒绝，要求更多上下文
    writeFileSync(join(dir, "dup.txt"), "x\ny\nx\ny\n")
    const ambiguous = ["--- a/dup.txt", "+++ b/dup.txt", "@@ -1,2 +1,2 @@", " x", "-y", "+z", ""].join("\n")
    await assert.rejects(() => byName.apply_patch.execute({ patch: ambiguous }, ctx), /matches \d+ locations/)

    // 路径越界不再拒绝（TOOLS.md §10.1：作用域限制移除）——cwd 之外的路径正常解析执行
    const ws = join(dir, "ws")
    mkdirSync(ws)
    const esc = ["--- /dev/null", "+++ b/../outside.txt", "@@ -0,0 +1,1 @@", "+hello", ""].join("\n")
    await byName.apply_patch.execute({ patch: esc }, { cwd: ws })
    assert.equal(readFileSync(join(dir, "outside.txt"), "utf8"), "hello\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- hashline_edit


test("hashline_edit: 按哈希定位替换单行", async () => {
    const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "const x = 1\nconst y = 2\nconst z = 3\n" }, ctx)

    // Read with hashes to get line hashes
    const readOut = await byName.read.execute({ path: "f.mjs", hashes: true }, ctx)
    // Parse hash from output: "1\t[abc123def456] const x = 1"
    const line1Hash = readOut.split("\n")[0].match(/\[([a-f0-9]{12})\]/)[1]

    // Replace line 1 with new content using hash
    const out = await byName.hashline_edit.execute({
      path: "f.mjs",
      old_hashes: [line1Hash],
      new_content: "const x = 42",
    }, ctx)
    assert.match(out, /replaced 1 line/)

    const updated = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.match(updated, /const x = 42/)
    assert.match(updated, /const y = 2/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("hashline_edit: 多行替换", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\nline3\nline4\n" }, ctx)

    const readOut = await byName.read.execute({ path: "f.mjs", hashes: true }, ctx)
    const lines = readOut.split("\n")
    const h2 = lines[1].match(/\[([a-f0-9]{12})\]/)[1]
    const h3 = lines[2].match(/\[([a-f0-9]{12})\]/)[1]

    const out = await byName.hashline_edit.execute({
      path: "f.mjs",
      old_hashes: [h2, h3],
      new_content: "replaced_A\nreplaced_B",
    }, ctx)
    assert.match(out, /replaced 2 line/)

    const updated = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.match(updated, /line1/)
    assert.match(updated, /replaced_A/)
    assert.match(updated, /replaced_B/)
    assert.match(updated, /line4/)
    assert.doesNotMatch(updated, /line2/)
    assert.doesNotMatch(updated, /line3/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit: 文件自上次读后被写过 → not-found 提示建议重读（2026-08-31 脏标记提示）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-dirty-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\n" }, ctx) // write 标记 dirty
    await assert.rejects(
      () => byName.edit.execute({ path: "f.mjs", old_string: "old text that was never there", new_string: "x" }, ctx),
      /was modified since your last read/,
      "dirty file must hint re-read instead of a generic whitespace hint",
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})




test("hashline_edit: hash 未匹配时报错含当前哈希", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "hello world\n" }, ctx)

    await assert.rejects(
      () => byName.hashline_edit.execute({
        path: "f.mjs",
        old_hashes: ["deadbeef0000"],
        new_content: "nope",
      }, ctx),
      /Hash sequence not found/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("hashline_edit: 多个匹配时报错列出所有位置", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // File with multiple empty lines — all have the same hash
    const lines = [
      "// file with blanks",  // unique hash
      "",                       // empty-line hash (collides across all empties)
      "const a = 1",            // unique hash
      "",                       // collides
      "const b = 2",            // unique hash
      "",                       // collides
    ]
    await byName.write.execute({ path: "f.mjs", content: lines.join("\n") }, ctx)

    // Try to replace a single empty line — it will match 3 positions
    const emptyHash = hashLine("")
    await assert.rejects(
      () => byName.hashline_edit.execute({
        path: "f.mjs",
        old_hashes: [emptyHash],
        new_content: "// replaced",
      }, ctx),
      /matches 3 positions.*ambiguous/s
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- normalizeEOL (Windows line endings)


test("normalizeEOL: \\r\\n file → edit matches with \\n only", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // Write file with Windows line endings directly to disk (bypass write tool which uses \n)
    writeFileSync(join(dir, "f.mjs"), "hello\r\nworld\r\n", "utf8")

    // edit should still match with \n-only old_string (normalizeEOL kicks in)
    const out = await byName.edit.execute({
      path: "f.mjs",
      old_string: "hello\nworld",
      new_string: "replaced\nworld",
    }, ctx)
    assert.ok(out.includes("replaced 1 occurrence"), out)

    // F1: write-back restores the file's ORIGINAL EOL style — CRLF in → CRLF out
    // (no whole-file rewrite to LF; previously this asserted the old LF-always behavior)
    const content = readFileSync(join(dir, "f.mjs"), "utf8")
    assert.strictEqual(content, "replaced\r\nworld\r\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("normalizeEOL: hashes are consistent regardless of \\r\\n", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol2-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // Write file with \r\n, reading should give same hashes as \n-only version
    writeFileSync(join(dir, "crlf.mjs"), "const a = 1\r\nconst b = 2\r\n", "utf8")

    const readOut = await byName.read.execute({ path: "crlf.mjs", hashes: true }, ctx)
    const hash1 = readOut.split("\n")[0].match(/\[([a-f0-9]{12})\]/)[1]

    // Compare against hash of \n-only line
    const expectedHash = hashLine("const a = 1")
    assert.strictEqual(hash1, expectedHash)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- insert_after regex validation


test("insert_after: invalid regex gives helpful error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-re-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "hello\nworld\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx) // clear the dirty flag (read-before-insert guard)

    await assert.rejects(
      () => byName.insert_after.execute({
        path: "f.mjs",
        after_regex: "**bad**",
        content: "// inserted",
      }, ctx),
      /not a valid JavaScript regex/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("insert_after: refuses on a dirty file (modified since last read) — stale line-number guard", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-dirty-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\n" }, ctx)

    // write marks the file dirty → insert_after must refuse (line numbers stale)
    await assert.rejects(
      () => byName.insert_after.execute({ path: "f.mjs", after_line: 1, content: "x" }, ctx),
      /was modified since your last read/
    )

    // read clears the dirty flag → insert_after works again
    await byName.read.execute({ path: "f.mjs" }, ctx)
    const out = await byName.insert_after.execute({ path: "f.mjs", after_line: 1, content: "inserted" }, ctx)
    assert.ok(out.includes("Inserted after line 1"), "fresh read → insert allowed")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("insert_after: fresh file (never written this session) works without a prior read", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-fresh-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "g.mjs"), "a\nb\n", "utf8") // created outside the tool chain — not dirty
    const out = await byName.insert_after.execute({ path: "g.mjs", after_line: 1, content: "mid" }, ctx)
    assert.ok(out.includes("Inserted after line 1"), "non-dirty file inserts immediately")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("insert_after 精确判定（2026-08-31 工具顺手度）：edit 后未受影响区允许、受影响区拒绝", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-precise-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\nline3\nline4\nline5\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx)
    // edit L3（替换 line3 → line3 + 新行 = 行数 +1）→ 受影响区 startLine=3
    await byName.edit.execute({ path: "f.mjs", old_string: "line3", new_string: "line3\nline3b" }, ctx)
    // 未受影响区（after_line=2 < startLine=3）→ 行号未漂移 → 允许（消掉"必须重 read"摩擦）
    const ok = await byName.insert_after.execute({ path: "f.mjs", after_line: 2, content: "// ok" }, ctx)
    assert.ok(ok.includes("Inserted after line 2"), "未受影响区允许")
    // 受影响区（after_line=4 > startLine=3）→ 行号已漂移 +1 → 拒绝（护栏保留）
    await assert.rejects(
      () => byName.insert_after.execute({ path: "f.mjs", after_line: 4, content: "// stale" }, ctx),
      /行号已漂移/,
      "受影响区拒绝（stale 防住）"
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("insert_after 精确判定：write 全文重写后任何 after_line 拒绝（必须重 read）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-write-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\n" }, ctx)
    // write 全文重写 → 全文件受影响 → 任何 after_line 拒绝
    await assert.rejects(
      () => byName.insert_after.execute({ path: "f.mjs", after_line: 1, content: "x" }, ctx),
      /was modified since your last read/,
      "write 后拒绝（全文重写）"
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit 数组形态（2026-08-31 工具顺手度）：多文件原子替换——任一失败全不写", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-batch-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "a.mjs", content: "const A = 1\nconst A2 = 2\n" }, ctx)
    await byName.write.execute({ path: "b.mjs", content: "const B = 2\nconst B2 = 3\n" }, ctx)
    await byName.read.execute({ path: "a.mjs" }, ctx)
    await byName.read.execute({ path: "b.mjs" }, ctx)
    // 两文件原子替换——都成功（带公共上下文行——单行改词走 LCS）
    const ok = await byName.edit.execute({
      edits: [
        { path: "a.mjs", old_string: "const A = 1\nconst A2 = 2", new_string: "const A = 10\nconst A2 = 2" },
        { path: "b.mjs", old_string: "const B = 2\nconst B2 = 3", new_string: "const B = 20\nconst B2 = 3" },
      ],
    }, ctx)
    assert.ok(ok.includes("Edited a.mjs") && ok.includes("Edited b.mjs"), "两文件都改")
    assert.ok((await byName.read.execute({ path: "a.mjs" }, ctx)).includes("const A = 10"), "a.mjs 已改")
    assert.ok((await byName.read.execute({ path: "b.mjs" }, ctx)).includes("const B = 20"), "b.mjs 已改")
    // 任一失败 → 全不写（原子）
    await assert.rejects(
      () => byName.edit.execute({
        edits: [
          { path: "a.mjs", old_string: "const A = 10\nconst A2 = 2", new_string: "const A = 100\nconst A2 = 2" },
          { path: "b.mjs", old_string: "NOT FOUND", new_string: "x" },
        ],
      }, ctx),
      /edit aborted \(atomic — no files written\)/,
      "任一失败原子回滚"
    )
    // 确认 a.mjs 未被写（原子回滚）
    assert.ok((await byName.read.execute({ path: "a.mjs" }, ctx)).includes("const A = 10"), "a.mjs 未被写（原子回滚）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit 数组形态：顶层 path + 无 path 条目 → 顶层为默认（2026-09-05 用户裁定）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-toppath-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "a.mjs", content: "const A = 1\nconst B = 2\n" }, ctx)
    await byName.read.execute({ path: "a.mjs" }, ctx)
    const r = await byName.edit.execute({
      path: "a.mjs",
      edits: [
        { old_string: "const A = 1", new_string: "const A = 10" },
        { old_string: "const B = 2", new_string: "const B = 20" },
      ],
    }, ctx)
    assert.equal((r.match(/Edited a\.mjs: replaced 1 occurrence\(s\)/g) || []).length, 2, "两条都回显")
    const final = await byName.read.execute({ path: "a.mjs" }, ctx)
    assert.ok(final.includes("const A = 10"), "第一条生效（顶层 path 默认）")
    assert.ok(final.includes("const B = 20"), "第二条生效（同文件串行累积）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("edit 数组形态：条目自带 path 优先于顶层 path（2026-09-05 用户裁定）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-pathprio-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "a.mjs", content: "const A = 1\n" }, ctx)
    await byName.write.execute({ path: "b.mjs", content: "const B = 2\n" }, ctx)
    await byName.read.execute({ path: "a.mjs" }, ctx)
    await byName.read.execute({ path: "b.mjs" }, ctx)
    const r = await byName.edit.execute({
      path: "a.mjs",
      edits: [
        { path: "b.mjs", old_string: "const B = 2", new_string: "const B = 20" }, // 条目 path 覆盖顶层
        { old_string: "const A = 1", new_string: "const A = 10" }, // 无 path → 顶层 a.mjs
      ],
    }, ctx)
    assert.ok(r.includes("Edited a.mjs") && r.includes("Edited b.mjs"), "两文件都改")
    assert.ok((await byName.read.execute({ path: "a.mjs" }, ctx)).includes("const A = 10"), "a.mjs 已改")
    assert.ok((await byName.read.execute({ path: "b.mjs" }, ctx)).includes("const B = 20"), "b.mjs 已改")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("edit 数组形态：顶层 old_string/new_string 与 edits 仍互斥——顶层 path 放行后收窄", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-mutex-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "a.mjs", content: "const A = 1\n" }, ctx)
    await assert.rejects(
      () => byName.edit.execute({
        path: "a.mjs",
        old_string: "const A = 1",
        new_string: "const A = 2",
        edits: [{ path: "a.mjs", old_string: "const A = 1", new_string: "const A = 3" }],
      }, ctx),
      /mutually exclusive/,
      "顶层 old/new 与数组仍互斥"
    )
    // 条目与顶层皆无 path → 路径错误（文本补顶层选项）
    await assert.rejects(
      () => byName.edit.execute({
        edits: [{ old_string: "const A = 1", new_string: "const A = 9" }],
      }, ctx),
      /each edit must have a path — give each entry its own path or pass a top-level path/,
      "无任何 path（条目与顶层皆缺）→ 路径错误"
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit 数组：同文件多条串行累积（2026-09-01 缺陷修复——后者不再静默覆盖前者）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-batch-samefile-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // T-a：同文件两条 edits（互不重叠区域）→ 两条都生效（带公共上下文行——LCS 语义）
    await byName.write.execute({ path: "f.mjs", content: "const A = 1\nconst B = 2\nconst C = 3\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx)
    const r = await byName.edit.execute({
      edits: [
        { path: "f.mjs", old_string: "const A = 1\nconst B = 2", new_string: "const A = 10\nconst B = 2" },
        { path: "f.mjs", old_string: "const B = 2\nconst C = 3", new_string: "const B = 20\nconst C = 3" },
      ],
    }, ctx)
    assert.equal((r.match(/Edited f\.mjs: replaced 1 occurrence\(s\)/g) || []).length, 2, "两条都回显")
    const final = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.ok(final.includes("const A = 10"), "第一条生效")
    assert.ok(final.includes("const B = 20"), "第二条生效（修复前被第一条覆盖静默丢失）")
    assert.ok(final.includes("const C = 3"), "未编辑行不动")

    // T-b：同文件第二条 old_string not found → 原子失败全不写
    await byName.read.execute({ path: "f.mjs" }, ctx)
    await assert.rejects(
      () => byName.edit.execute({
        edits: [
          { path: "f.mjs", old_string: "const A = 10\nconst B = 20", new_string: "const A = 100\nconst B = 20" },
          { path: "f.mjs", old_string: "NOT FOUND", new_string: "x" },
        ],
      }, ctx),
      /edit aborted \(atomic — no files written\)/,
      "同文件原子失败"
    )
    const afterAbort = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.ok(afterAbort.includes("const A = 10"), "失败后第一条未写入（全不写）")

    // T-c：行偏移累积——第一条在头部 +2 行，第二条的行号基于累积内容计算；
    // recordWrite 合并快照（startLine=组内最靠上受影响行，shift=全组净漂移）
    // → 受影响区护栏覆盖两条编辑之间的行区，insert_after 不误判
    await byName.read.execute({ path: "f.mjs" }, ctx)
    const r2 = await byName.edit.execute({
      edits: [
        { path: "f.mjs", old_string: "const A = 10\nconst B = 20", new_string: "// 头部注释一\n// 头部注释二\nconst A = 100\nconst B = 20" },
        { path: "f.mjs", old_string: "const B = 20\nconst C = 3", new_string: "const B = 200\nconst C = 3" },
      ],
    }, ctx)
    assert.equal((r2.match(/Edited f\.mjs/g) || []).length, 2, "两条都回显")
    // 快照与护栏断言必须在 read 之前——read 会清 lastWrite（新视图以 read 为准）
    const lw = lastWriteOf(join(dir, "f.mjs"))
    assert.equal(lw.type, "edit", "recordWrite 快照存在")
    assert.equal(lw.startLine, 1, "合并快照 startLine = 组内最靠上的受影响行")
    assert.equal(lw.shift, 2, "合并快照 shift = 全组净行数差（+2）")
    await assert.rejects(
      () => byName.insert_after.execute({ path: "f.mjs", after_line: 3, content: "x" }, ctx),
      /行号已漂移/,
      "受影响区（含累积偏移）内 insert_after 拒绝——两条编辑之间的行区护栏无缺口"
    )
    const content = readFileSync(join(dir, "f.mjs"), "utf8")
    assert.ok(content.includes("// 头部注释一\n// 头部注释二\nconst A = 100"), "第一条生效（+2 行）")
    assert.ok(content.includes("const B = 200"), "第二条生效（行号基于累积内容）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit 数组：合并快照 startLine 取组内最靠上行（#2——逆序条目护栏无缺口）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-batch-reverse-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // 逆序组：第一条在 L3，第二条在 L1（调用序在后、行号更靠上）
    await byName.write.execute({ path: "f.mjs", content: "const A = 1\nconst B = 2\nconst C = 3\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx)
    await byName.edit.execute({
      edits: [
        { path: "f.mjs", old_string: "const B = 2\nconst C = 3", new_string: "const B = 2\nconst C = 30" },
        { path: "f.mjs", old_string: "const A = 1\nconst B = 2", new_string: "const A = 10\nconst A2 = 11\nconst B = 2" },
      ],
    }, ctx)
    // 快照与护栏断言必须在 read 之前——read 会清 lastWrite（新视图以 read 为准）
    const lw = lastWriteOf(join(dir, "f.mjs"))
    assert.equal(lw.type, "edit", "recordWrite 快照存在")
    assert.equal(lw.startLine, 1, "startLine = Math.min(组内所有 editStartLine) = 1（修复前 = 首条的 3）")
    // 护栏：受影响区（startLine=1 起）内 insert_after 拒绝——修复前 startLine=3 时 after_line=2 被放行
    await assert.rejects(
      () => byName.insert_after.execute({ path: "f.mjs", after_line: 2, content: "x" }, ctx),
      /行号已漂移/,
      "受影响区内 insert_after 拒绝（护栏下界回到组内最靠上行）"
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit 数组：.mjs 引入语法错误时结果含语法检查输出（#4——与单文件路径格式对齐）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-batch-syntax-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "g.mjs", content: "const G = 1\n" }, ctx)
    const r = await byName.edit.execute({
      edits: [{ path: "g.mjs", old_string: "const G = 1\n", new_string: "const G = (\n" }],
    }, ctx)
    assert.ok(r.includes("Edited g.mjs"), "编辑成功回显")
    assert.match(r, /Syntax: FAILED/, "数组路径结果附语法检查输出（修复前缺失）")
    // 单文件路径对照——同一坏文件的后续单条编辑，格式一致
    const single = await byName.edit.execute({ path: "g.mjs", old_string: "const G = (\n", new_string: "const G = )\n" }, ctx)
    assert.match(single, /Syntax: FAILED/, "单文件路径同款输出（对照）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit：new_string 非字符串在写盘前友好报错（#5——不再先写 'undefined' 再 TypeError）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-newstring-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "const A = 1\n" }, ctx)
    // 单文件：new_string 缺失（undefined）
    await assert.rejects(
      () => byName.edit.execute({ path: "f.mjs", old_string: "const A = 1" }, ctx),
      /new_string must be a string/,
      "单文件 undefined → 友好错误",
    )
    // 单文件：非字符串类型
    await assert.rejects(
      () => byName.edit.execute({ path: "f.mjs", old_string: "const A = 1", new_string: 42 }, ctx),
      /new_string must be a string/,
      "单文件非字符串 → 友好错误",
    )
    // 数组路径：同款校验
    await assert.rejects(
      () => byName.edit.execute({ edits: [{ path: "f.mjs", old_string: "const A = 1" }] }, ctx),
      /new_string must be a string/,
      "数组 undefined → 友好错误",
    )
    // 写盘前拒绝——文件未被损坏成 "undefined"
    const after = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.ok(after.includes("const A = 1"), "文件未被写（错误在写盘前抛出）")
    assert.ok(!after.includes("undefined"), "没有 'undefined' 字面量被写入")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})




test("edit 数组：跨文件条目行为不变（回归——同文件修复不影响多文件原子语义）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-edit-batch-cross-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "a.mjs", content: "const A = 1\nconst A2 = 11\n" }, ctx)
    await byName.write.execute({ path: "b.mjs", content: "const B = 2\n" }, ctx)
    await byName.read.execute({ path: "a.mjs" }, ctx)
    await byName.read.execute({ path: "b.mjs" }, ctx)
    const r = await byName.edit.execute({
      edits: [
        { path: "a.mjs", old_string: "const A = 1", new_string: "const A = 10" },
        { path: "a.mjs", old_string: "const A2 = 11", new_string: "const A2 = 110" },
        { path: "b.mjs", old_string: "const B = 2", new_string: "const B = 20" },
      ],
    }, ctx)
    assert.ok(r.includes("Edited a.mjs") && r.includes("Edited b.mjs"), "两个文件都回显")
    const fa = await byName.read.execute({ path: "a.mjs" }, ctx)
    const fb = await byName.read.execute({ path: "b.mjs" }, ctx)
    assert.ok(fa.includes("const A = 10") && fa.includes("const A2 = 110"), "a.mjs 同文件两条都生效")
    assert.ok(fb.includes("const B = 20"), "b.mjs 独立生效")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("写入工具返回带上下文窗口（2026-08-31 工具顺手度——模型拿到行号锚点的语义自检）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-write-ctx-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx)
    // edit L4（替换 line4 → LINE4，带共享上下文行 line5）→ 返回应含上下文（L1-L7，L4 标记 →）
    const r = await byName.edit.execute({ path: "f.mjs", old_string: "line4\nline5", new_string: "LINE4\nline5" }, ctx)
    assert.ok(r.includes("context (L1-L7)"), "含上下文头")
    assert.ok(r.includes("→ L4\tLINE4"), "写入行标记 → + 新内容")
    assert.ok(r.includes(" L3\tline3"), "前一行在上下文里")
    assert.ok(r.includes(" L5\tline5"), "后一行在上下文里")
    // insert_after L6 → edit L4 后 after_line=6 在受影响区——先 read 再插入（新机制语义）
    await byName.read.execute({ path: "f.mjs" }, ctx)
    const r2 = await byName.insert_after.execute({ path: "f.mjs", after_line: 6, content: "inserted" }, ctx)
    assert.ok(r2.includes("context (L"), "insert_after 含上下文头")
    assert.ok(r2.includes("→ L7\tinserted"), "插入行标记 →")
    // hashline_edit 同样含上下文
    const read = await byName.read.execute({ path: "f.mjs", hashes: true }, ctx)
    const m = read.match(/(\w{12})\] (line8)/)
    if (m) {
      const r3 = await byName.hashline_edit.execute({ path: "f.mjs", old_hashes: [m[1]], new_content: "LINE8" }, ctx)
      assert.ok(r3.includes("context (L"), "hashline_edit 含上下文头")
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("write 全文重写不附上下文（无行号锚点——模型刚写的知道内容）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-write-no-ctx-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    const r = await byName.write.execute({ path: "f.mjs", content: "hello\nworld\n" }, ctx)
    assert.ok(!r.includes("context (L"), "write 全文重写不附上下文")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("apply_patch: multiple hunks in one file stay aligned after line-count drift", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-patch-"))
  try {
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    writeFileSync(join(dir, "f.txt"), "one\ntwo\nthree\nfour\nfive\nsix\nseven\n")
    const ctx = { cwd: dir }
    // hunk 1 inserts a line (shift), so hunk 2's target drifts from its @@ line number
    const patch = `--- a/f.txt
+++ b/f.txt
@@ -1,3 +1,4 @@
 one
+oneAndHalf
 two
 three
@@ -5,3 +5,3 @@
 five
-six
+sixX
 seven
`
    const out = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(out, /Applied patch/)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "one\noneAndHalf\ntwo\nthree\nfour\nfive\nsixX\nseven\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



// ---------------------------------------------------------------- EOL semantics + edit candidates + encoding probe (EDIT-TOOL-EOL)


test("EOL F1: edit on pure CRLF file writes back all CRLF, no bare LF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-edit-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\r\nb\r\nc\r\n", "utf8")
    const out = await byName.edit.execute({ path: "f.txt", old_string: "b\nc", new_string: "B\nc" }, ctx)
    assert.ok(out.includes("replaced 1 occurrence"), out)
    const content = readFileSync(join(dir, "f.txt"), "utf8")
    assert.strictEqual(content, "a\r\nB\r\nc\r\n")
    assert.ok(!/(?<!\r)\n/.test(content), "no bare LF")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL F1 regression: edit on LF file keeps LF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-lf-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\nb\n", "utf8")
    await byName.edit.execute({ path: "f.txt", old_string: "a\nb", new_string: "a\nB" }, ctx)
    assert.strictEqual(readFileSync(join(dir, "f.txt"), "utf8"), "a\nB\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL F1: apply_patch on CRLF file writes back all CRLF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-patch-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "one\r\ntwo\r\nthree\r\n", "utf8")
    const patch = `--- a/f.txt
+++ b/f.txt
@@ -1,3 +1,3 @@
 one
-two
+TWO
 three
`
    const out = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(out, /Applied patch/)
    assert.strictEqual(readFileSync(join(dir, "f.txt"), "utf8"), "one\r\nTWO\r\nthree\r\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL F1: hashline_edit on CRLF file writes back all CRLF", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-hash-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "x\r\ny\r\nz\r\n", "utf8")
    const out = await byName.hashline_edit.execute({ path: "f.txt", old_hashes: [hashLine("y")], new_content: "Y" }, ctx)
    assert.ok(out.includes("replaced 1 line(s)"), out)
    assert.strictEqual(readFileSync(join(dir, "f.txt"), "utf8"), "x\r\nY\r\nz\r\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL F2: new file in CRLF-majority directory follows CRLF (write + apply_patch)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-new-crlf-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "existing.txt"), "e1\r\ne2\r\n", "utf8")
    await byName.write.execute({ path: "w.txt", content: "l1\nl2\n" }, ctx)
    assert.strictEqual(readFileSync(join(dir, "w.txt"), "utf8"), "l1\r\nl2\r\n")
    const patch = `--- /dev/null
+++ b/p.txt
@@ -0,0 +1,2 @@
+n1
+n2
`
    await byName.apply_patch.execute({ patch }, ctx)
    assert.strictEqual(readFileSync(join(dir, "p.txt"), "utf8"), "n1\r\nn2\r\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL F2: new file in LF-majority / empty directory stays LF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-new-lf-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // LF-majority directory
    writeFileSync(join(dir, "existing.txt"), "e1\ne2\n", "utf8")
    await byName.write.execute({ path: "w.txt", content: "l1\nl2\n" }, ctx)
    assert.strictEqual(readFileSync(join(dir, "w.txt"), "utf8"), "l1\nl2\n")
    // Empty directory
    const empty = join(dir, "empty")
    mkdirSync(empty)
    await byName.write.execute({ path: "empty/f.txt", content: "x\ny\n" }, ctx)
    assert.strictEqual(readFileSync(join(empty, "f.txt"), "utf8"), "x\ny\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL F2/F1: write overwriting an existing CRLF file restores CRLF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-overwrite-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "old1\r\nold2\r\n", "utf8")
    await byName.write.execute({ path: "f.txt", content: "new1\nnew2\n" }, ctx)
    assert.strictEqual(readFileSync(join(dir, "f.txt"), "utf8"), "new1\r\nnew2\r\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("EOL boundary: mixed-EOL file (first line LF, later CRLF) restores by first-line LF", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-mixed-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "first\nsecond\r\nthird\r\n", "utf8")
    await byName.edit.execute({ path: "f.txt", old_string: "first\nsecond", new_string: "FIRST\nsecond" }, ctx)
    // First-newline rule: whole file written back in the first line's style (LF).
    const content = readFileSync(join(dir, "f.txt"), "utf8")
    assert.strictEqual(content, "FIRST\nsecond\nthird\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit F3: failed edit lists similar lines (line number + preview + score)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cand-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.mjs"), "const timeout = 5000\nfunction start() {\n}\n", "utf8")
    const err = await byName.edit.execute({ path: "f.mjs", old_string: "const timeout = 6000", new_string: "x" }, ctx).then(() => null, (e) => e)
    assert.ok(err, "edit should fail")
    assert.match(err.message, /old_string not found/)
    assert.match(err.message, /similar lines/)
    assert.match(err.message, /L1: const timeout = 5000 \(\d+%\)/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit §14: old_string not found 结果含 grep 定位建议（T-TF3——D-TF2——单文件 + batch 双路径）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grephint-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.mjs"), "const a = 1\n", "utf8")
    // 单文件路径
    const err = await byName.edit.execute({ path: "f.mjs", old_string: "const a = 999", new_string: "x" }, ctx).then(() => null, (e) => e)
    assert.ok(err, "edit should fail")
    assert.match(err.message, /old_string not found/)
    assert.ok(
      err.message.includes(" — use grep to locate the actual content"),
      "T-TF3: 单文件路径错误含 grep 建议（searched: <fragment> — use grep to locate the actual content）",
    )
    // batch 路径（edits 数组——edit 工具首选形态——同错误族同建议）
    const err2 = await byName.edit.execute({ edits: [{ path: "f.mjs", old_string: "no-such-content", new_string: "x" }] }, ctx).then(() => null, (e) => e)
    assert.ok(err2, "batch edit should fail")
    assert.match(err2.message, /old_string not found/)
    assert.ok(
      err2.message.includes(" — use grep to locate the actual content"),
      "T-TF3: batch 路径错误同含 grep 建议",
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit F3: no candidates when every line is below the 0.5 threshold (noise guard)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cand-none-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "alpha\nbeta\ngamma\n", "utf8")
    const err = await byName.edit.execute({ path: "f.txt", old_string: "xyzzy plugh xyzzard", new_string: "x" }, ctx).then(() => null, (e) => e)
    assert.ok(err, "edit should fail")
    assert.match(err.message, /old_string not found/)
    assert.ok(!err.message.includes("similar lines"), "no candidate block below threshold: " + err.message)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit F3 boundary: multi-line old_string failure scores only line 1, capped at top 3", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cand-multi-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    const body = ["wrong first line a", "wrong first line b", "wrong first line c", "wrong first line d", "wrong first line e"].join("\n") + "\n"
    writeFileSync(join(dir, "f.txt"), body, "utf8")
    const err = await byName.edit.execute({
      path: "f.txt",
      old_string: "wrong first line X\nsecond line content\nthird line content",
      new_string: "x",
    }, ctx).then(() => null, (e) => e)
    assert.ok(err, "edit should fail")
    assert.match(err.message, /old_string line 1:/)
    const candRows = err.message.match(/^ {4}L\d+: /gm) || []
    assert.strictEqual(candRows.length, 3, "top 3 cap: " + err.message)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("hashline_edit F4: file containing U+FFFD warns but still executes", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-fffd-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "good line\nbad \uFFFD line\n", "utf8")
    const out = await byName.hashline_edit.execute({ path: "f.txt", old_hashes: [hashLine("good line")], new_content: "replaced line" }, ctx)
    assert.ok(out.includes("replaced 1 line(s)"), out)
    assert.match(out, /U\+FFFD/)
    assert.match(out, /encoding may be corrupted/)
    assert.strictEqual(readFileSync(join(dir, "f.txt"), "utf8"), "replaced line\nbad \uFFFD line\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("hashline_edit F4 regression: clean UTF-8 file produces no warning", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-fffd-clean-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "clean\n", "utf8")
    const out = await byName.hashline_edit.execute({ path: "f.txt", old_hashes: [hashLine("clean")], new_content: "done" }, ctx)
    assert.ok(!out.includes("U+FFFD"), "no warning on clean file: " + out)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("detectFileEol: first-newline rule (CRLF first → CRLF; bare LF / none → LF)", async () => {
  const { detectFileEol, joinWithEol, majorityEol, findCandidates } = await import("../src/tools/shared.mjs")
  assert.strictEqual(detectFileEol("a\r\nb\n"), "\r\n")
  assert.strictEqual(detectFileEol("a\nb\r\n"), "\n")
  assert.strictEqual(detectFileEol("no newline"), "\n")
  assert.strictEqual(detectFileEol(""), "\n")
  assert.strictEqual(joinWithEol(["a", "b"], "x\r\ny"), "a\r\nb")
  // majorityEol: empty dir → LF; CRLF-majority dir → CRLF
  const dir = mkdtempSync(join(tmpdir(), "thincoder-majeol-"))
  try {
    assert.strictEqual(majorityEol(dir), "\n")
    writeFileSync(join(dir, "a.txt"), "x\r\n")
    writeFileSync(join(dir, "b.txt"), "y\r\n")
    writeFileSync(join(dir, "c.txt"), "z\n")
    assert.strictEqual(majorityEol(dir), "\r\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  // findCandidates: threshold + ranking + first-line-only for multi-line needle
  const cands = findCandidates(["const timeout = 5000", "unrelated"], "const timeout = 6000")
  assert.strictEqual(cands.length, 1)
  assert.strictEqual(cands[0].line, 1)
  assert.ok(cands[0].score >= 0.5)
  assert.strictEqual(findCandidates(["short"], "a much longer needle that shares nothing").length, 0)
})


// ---------------------------------------------------------------- §15 edit LCS 批量 + apply_patch 裸 @@（TOOLS.md D15.1/D15.6——2026-09-04）

test("T15.6: 批量各条目独立判定——插入条目与 LCS 替换条目混用——原子", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-batchmix-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // a.mjs：零重叠条目 → 插入（new 多行——§15.2 迁移：单行×单行零重叠已由分支 0 改为替换——
    // 多行形态下插入语义保留）；b.mjs：带上下文条目 → LCS 替换
    await byName.write.execute({ path: "a.mjs", content: "const A = 1\n" }, ctx)
    await byName.write.execute({ path: "b.mjs", content: "const B = 2\nconst B2 = 3\n" }, ctx)
    await byName.read.execute({ path: "a.mjs" }, ctx)
    await byName.read.execute({ path: "b.mjs" }, ctx)
    const r = await byName.edit.execute({
      edits: [
        { path: "a.mjs", old_string: "const A = 1", new_string: "// 插入说明一\n// 插入说明二" },
        { path: "b.mjs", old_string: "const B = 2\nconst B2 = 3", new_string: "const B = 20\nconst B2 = 3" },
      ],
    }, ctx)
    assert.ok(r.includes("Edited a.mjs") && r.includes("Edited b.mjs"), "两条都回显")
    const fa = await byName.read.execute({ path: "a.mjs" }, ctx)
    const fb = await byName.read.execute({ path: "b.mjs" }, ctx)
    assert.ok(fa.includes("const A = 1"), "a.mjs: 旧行保留（多行零重叠插入——回归）")
    assert.ok(fa.includes("// 插入说明一"), "a.mjs: 新行一插入其后")
    assert.ok(fa.includes("// 插入说明二"), "a.mjs: 新行二插入其后")
    assert.ok(fb.includes("const B = 20"), "b.mjs: LCS 替换生效")
    assert.ok(fb.includes("const B2 = 3"), "b.mjs: 公共行保留")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.17: apply_patch 裸 @@ 头 + ≥2 上下文行 → 上下文唯一定位并应用", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-bare-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.mjs"), "const A = 1\nconst B = 2\nconst C = 3\nconst D = 4\n")
    const patch = [
      "--- a/f.mjs",
      "+++ b/f.mjs",
      "@@",
      " const A = 1",
      " const B = 2",
      "-const C = 3",
      "+const C = 30",
      " const D = 4",
    ].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "f.mjs"), "utf8"), "const A = 1\nconst B = 2\nconst C = 30\nconst D = 4\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.18: 裸 @@ + 纯 + 插入（无 - 锚）→ 仍报错 add more context lines（不写）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-bare1-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.mjs"), "a\nb\nc\n")
    // §15.3 迁移（AC15.15①——2026-09-04）：原夹具（1 上下文行 + -b/+B——含 - 锚）按 D15.10.1
    // 放宽为「锚序列唯一即应用」——该形态现由 T15.42 覆盖。本行夹具换为仍拒形态：
    // 纯 + 无 - 锚（插入位置不可判——锚自由形态需 ≥2 上下文——NF15.8c）。
    const patch0 = ["--- a/f.mjs", "+++ b/f.mjs", "@@", " b", "+bb"].join("\n") // 1 上下文行纯 +
    await assert.rejects(
      () => byName.apply_patch.execute({ patch: patch0 }, ctx),
      /add more context lines/,
      "1 行上下文纯 + 无 - 锚——仍拒（报错引导）",
    )
    assert.equal(readFileSync(join(dir, "f.mjs"), "utf8"), "a\nb\nc\n", "未写")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.19: 裸 @@ 锚多匹配 → 报错含 Anchor 片段（不写）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-bare2-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "x\ny\nz\nx\ny\nz\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", " x", " y", "-z", "+Z2"].join("\n")
    await assert.rejects(
      () => byName.apply_patch.execute({ patch }, ctx),
      /Anchor: "x ⏎ y ⏎ z"/,
      "多匹配报错含已尝试锚片段",
    )
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "x\ny\nz\nx\ny\nz\n", "未写")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.20: 两个无坐标 hunk 串行——第二个命中第一个应用后的内容", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-bare3-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.mjs"), "const A = 1\nconst B = 2\nconst C = 3\nconst D = 4\n")
    const patch = [
      "--- a/f.mjs",
      "+++ b/f.mjs",
      "@@",
      " const A = 1",
      "-const B = 2",
      "+const B = 20",
      " const C = 3",
      "@@",
      " const B = 20",
      " const C = 3",
      "-const D = 4",
      "+const D = 40",
    ].join("\n")
    // 第二个 hunk 的上下文（B=20）只有第一个 hunk 应用后才存在——串行成功
    await byName.apply_patch.execute({ patch }, ctx)
    const content = readFileSync(join(dir, "f.mjs"), "utf8")
    assert.equal(content, "const A = 1\nconst B = 20\nconst C = 3\nconst D = 40\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- §15.3 apply_patch 零上下文 hunk 放宽（TOOLS.md D15.10.1/NF15.8c——T15.38-44——2026-09-04）

test("T15.38: 零上下文裸 @@ 头 + 唯一 - 锚 → 替换应用（行数不变）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-38-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "one\ntwo\nthree\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", "-two", "+TWO"].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "one\nTWO\nthree\n", "- 行全文唯一——替换——行数不变")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.38a: 跨文件零上下文 - 锚 + 文件间空行分隔 → 分隔空行不成为幽灵上下文（复评 #1 回归）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-38a-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "a.txt"), "one\ntwo\nthree\n")
    writeFileSync(join(dir, "b.txt"), "x\ny\nz\n")
    // 文件头 "--- " 以 - 开头——若分隔空行被吞为上下文，锚序列变 [two, ""] → 误报 not-found
    const patch = [
      "--- a/a.txt",
      "+++ b/a.txt",
      "@@",
      "-two",
      "+TWO",
      "",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@",
      "-y",
      "+Y",
    ].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "one\nTWO\nthree\n", "文件 A 零上下文 hunk 应用")
    assert.equal(readFileSync(join(dir, "b.txt"), "utf8"), "x\nY\nz\n", "文件 B 零上下文 hunk 应用")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.39: 零上下文多行 - 锚（唯一连续序列）→ 块替换", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-39-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\nb\nc\nd\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", "-b", "-c", "+BC"].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "a\nBC\nd\n", "A、B 消失——新块在位")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.40: ① - 锚序列多匹配 → matches N locations ② 纯 + 零上下文 → 仍拒（均不写）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-40-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "x\nb\ny\nb\nz\n")
    const ambiguous = ["--- a/f.txt", "+++ b/f.txt", "@@", "-b", "+B"].join("\n")
    await assert.rejects(
      () => byName.apply_patch.execute({ patch: ambiguous }, ctx),
      /matches 2 locations/,
      "零上下文 - 锚两处匹配——报错引导调整锚（不静默选一）",
    )
    const purePlus = ["--- a/f.txt", "+++ b/f.txt", "@@", "+nope"].join("\n")
    await assert.rejects(
      () => byName.apply_patch.execute({ patch: purePlus }, ctx),
      /add more context lines/,
      "纯 + 零上下文无锚——位置不明——仍拒（报错加锚）",
    )
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "x\nb\ny\nb\nz\n", "未写")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.41: 带上下文 hunk（≥2——T15.17/T15.20 形态）回归——既有路径零改动", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-41-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // 内容带同前缀歧义（alpha/beta 重复）——≥2 上下文序列（alpha,beta,gamma）唯一定位——
    // 证明带上下文路径仍按既有上下文匹配工作（T15.17/T15.19/T15.20 同形态断言继续全绿）
    writeFileSync(join(dir, "f.txt"), "alpha\nbeta\ngamma\nalpha\nbeta\nzeta\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", " alpha", " beta", "-gamma", "+GAMMA"].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(
      readFileSync(join(dir, "f.txt"), "utf8"),
      "alpha\nbeta\nGAMMA\nalpha\nbeta\nzeta\n",
      "≥2 上下文既有路径零改动",
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.42: 恰 1 上下文行 + - 行 → 锚序列唯一即应用（评审 #4a——非单调消除）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-42-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\nb\nc\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", " a", "-b", "+B"].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "a\nB\nc\n", "上下文行保留、旧行→新行——不再被 ≥2 规则拒")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.43: - 锚序列零匹配 → not-found（不写——报错）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-43-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\nb\nc\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", "-zzz", "+Z"].join("\n")
    await assert.rejects(
      () => byName.apply_patch.execute({ patch }, ctx),
      /does not apply/,
      "锚序列全文不存在——既有 not-found 语义",
    )
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "a\nb\nc\n", "未写")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.44: 两个零上下文 - 锚 hunk 串行——后 hunk 锚 = 前 hunk 应用后新内容", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-44-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\nb\nc\n")
    const patch = ["--- a/f.txt", "+++ b/f.txt", "@@", "-b", "+B", "@@", "-B", "+C"].join("\n")
    // 第二个 hunk 的锚（B）只有第一个 hunk 应用后才存在——串行逐 hunk 定位（T15.20 同款语义——零上下文形态）
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "a\nC\nc\n", "两 hunk 依次生效")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── §15.3a apply_patch 文件头 +++ 容缺（TOOLS.md §15.3a——P15.10——2026-09-05 用户裁定「符合模型直觉」）───
// 来源：父侧 3 连败（18:42:48/18:43:03/18:44:15——`--- a/` 头后直接 hunk 被拒 "expected +++ line after"——
// 报错文本逐字告知修法仍重试同形——报错引导无效实证——形态合法化而非继续引导）。
// 边界：`--- /dev/null` 缺 +++ 仍拒（新文件名从 --- 侧不可推导——特报文本）；
// 删行内容 `-- x`（patch 文本 `--- x`）不是文件头——裸 @@ 内不得误断（非 a/b/ 前缀形态）。

test("P15.10a: 容缺头——`--- a/` 后直接跟 hunk → 同路径应用（单文件自然形态）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-p1510a-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "a.txt"), "one\ntwo\n", "utf8")
    const patch = ["--- a/a.txt", "@@", "-one", "+ONE", " two"].join("\n")
    const r = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(r, /Applied patch to 1 file\(s\):\n  modified a\.txt/)
    assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "ONE\ntwo\n", "同路径应用")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("P15.10b: 多文件混合——完整头（+++ 配对）+ 容缺头同补丁", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-p1510b-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "a.txt"), "one\n", "utf8")
    writeFileSync(join(dir, "b.txt"), "two\n", "utf8")
    const patch = ["--- a/a.txt", "+++ b/a.txt", "@@", "-one", "+ONE", "--- b/b.txt", "@@", "-two", "+TWO"].join("\n")
    const r = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(r, /Applied patch to 2 file\(s\)/)
    assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "ONE\n", "完整头文件已改")
    assert.equal(readFileSync(join(dir, "b.txt"), "utf8"), "TWO\n", "容缺头文件已改")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("P15.10c: `--- /dev/null` 缺 +++ → 特报（新文件名不可推导——信息真缺失仍拒）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-p1510c-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await assert.rejects(
      () => byName.apply_patch.execute({ patch: "--- /dev/null\n@@\n+hello\n" }, ctx),
      /"--- \/dev\/null" needs a "\+\+\+ b\/<path>" line naming the new file/,
      "dev/null 容缺 → 特报文本"
    )
    assert.ok(!existsSync(join(dir, "hello")), "未创建任何文件")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("P15.10d: 删行内容 `-- x`（patch 文本 `--- x`）不误断为文件头——裸 @@ 内正常消费（边界锁）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-p1510d-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "b.txt"), "A\n-- tgt\nC\n", "utf8")
    // 裸 @@ 内 `--- tgt` 行 = 删除行（内容 "-- tgt"）——非 a/b/ 前缀不是文件头——不得断 hunk
    const patch = ["--- b/b.txt", "@@", " A", "--- tgt", " C"].join("\n")
    await byName.apply_patch.execute({ patch }, ctx)
    assert.equal(readFileSync(join(dir, "b.txt"), "utf8"), "A\nC\n", "-- tgt 行被删除（而非被当文件头）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("P15.10e: 空段头（头后无 hunk）过滤——不虚报、不触发无谓读；纯空段 → No file changes", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-p1510e-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "a.txt"), "one\n", "utf8")
    // 尾部容缺空段头（b.txt 不存在）——若不过滤会触发 File not found——过滤后不碰
    const patch = ["--- a/a.txt", "+++ b/a.txt", "@@", "-one", "+ONE", "--- b/b.txt"].join("\n")
    const r = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(r, /Applied patch to 1 file\(s\)/, "空段头不进统计")
    assert.equal(readFileSync(join(dir, "a.txt"), "utf8"), "ONE\n", "真实 hunk 已应用")
    assert.ok(!existsSync(join(dir, "b.txt")), "空段文件未创建")
    // 纯空段补丁（只有头无 hunk）→ No file changes
    await assert.rejects(
      () => byName.apply_patch.execute({ patch: "--- a/ghost.txt\n" }, ctx),
      /No file changes found/,
      "纯空段 → No file changes"
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



// ─── §14.1 失败反馈带下一跳——edit 单行相似行（TOOLS.md §14.1 D14.1.1）───
// F3 落点核对（2026-09-05 实现批）：相似行段在 computeEditEntry（edit-diff.mjs）内按
// old 是否含 \n 分头——评分函数 findCandidates（shared.mjs）对任意 not-found old 无条件
// 调用（单行 old 已覆盖——本批仅补测试锁定）——单形态/批量/ACP 桥三通道共享同一错误构造。
// 实测格式字节（单行）："\n\n  similar lines:\n    L<行号>: <截断预览> (<分>%)"——
// 零候选 → 整段省略（T14.1.6）。
// 既有测试映射：T14.1.2（多行 F3 输出逐字不变）→ 上方 "edit F3 boundary: multi-line
// old_string failure scores only line 1, capped at top 3"；T14.1.3（T-TF3 searched+grep
// 前缀保留）→ 上方 "edit §14: old_string not found 结果含 grep 定位建议（T-TF3…）"。

test("edit §14.1 T14.1.1: 单行 old not-found（文件含近似行）→ searched 前缀保留 + similar lines top3 段（行号/截断内容/分——F3 同款行格式逐字）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t1411-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // 4 个同分近似行——锁 top3 上限 + 行号序（同分按行号升序）+ 行格式逐字（4 空格缩进）
    writeFileSync(join(dir, "f.mjs"), ["const timeout = 1000", "const timeout = 2000", "const timeout = 3000", "const timeout = 4000", "function start() {", "}"].join("\n") + "\n", "utf8")
    const err = await byName.edit.execute({ path: "f.mjs", old_string: "const timeout = 9999", new_string: "x" }, ctx).then(() => null, (e) => e)
    assert.ok(err, "edit should fail")
    assert.ok(err.message.startsWith("old_string not found in f.mjs"), "错误前缀不动: " + err.message)
    assert.ok(
      err.message.includes('  searched: "const timeout = 9999" — use grep to locate the actual content'),
      "T14.1.1: searched 前缀 + grep 引导保留: " + err.message,
    )
    assert.ok(
      err.message.includes("\n\n  similar lines:\n    L1: const timeout = 1000 (80%)\n    L2: const timeout = 2000 (80%)\n    L3: const timeout = 3000 (80%)"),
      "T14.1.1: similar lines 段逐字（L 行号/截断内容/分——F3 同款行格式）: " + err.message,
    )
    assert.ok(!err.message.includes("L4: const timeout = 4000"), "top 3 上限（第 4 候选不出现）: " + err.message)

    // 截断锁：长候选行的行预览限 80 字符（CANDIDATE_PREVIEW_LEN——评分在 500 字符域）
    const longOld = "zz" + "a".repeat(97) + "Q"
    const longLine = "zz" + "a".repeat(97) + "q" + "b".repeat(98) // 99/198 = 0.5 恰过分数阈（199 字符行 → 99/199 = 0.497 < 0.5 被分数阈排除——长度比预检 100/199 ≈ 0.503 ≥ 0.5 不会拦它）
    writeFileSync(join(dir, "long.txt"), longLine + "\n", "utf8")
    const err2 = await byName.edit.execute({ path: "long.txt", old_string: longOld, new_string: "x" }, ctx).then(() => null, (e) => e)
    // 截断锁（正则行级——searched: 行合法含完整 old——只锁 similar lines 行预览恰为 80 字符）
    const row = err2.message.match(/^ {4}L1: (.{80}) \(\d+%\)$/m)
    assert.ok(row, "T14.1.1: 行格式 = 4 空格 + L1: + 80 字符预览 + 分: " + err2.message)
    assert.equal(row[1], longOld.slice(0, 80), "T14.1.1: 行预览截断至 CANDIDATE_PREVIEW_LEN(80)——80 字符后内容不出现")

    // 批量通道自动继承（computeEditEntry 单一权威——batch 错误同含 similar lines 段）
    const err3 = await byName.edit.execute({ edits: [{ path: "f.mjs", old_string: "function nostart", new_string: "x" }] }, ctx).then(() => null, (e) => e)
    assert.ok(err3.message.startsWith("edit aborted (atomic — no files written): "), "batch 前缀不动: " + err3.message)
    assert.ok(
      err3.message.includes("\n\n  similar lines:\n    L5: function start() { (50%)"),
      "T14.1.1: 批量路径同含 similar lines 段（computeEditEntry 内追加——自动继承）: " + err3.message,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("edit §14.1 T14.1.6: 单行 old not-found 且文件无近似行（零候选）→ 无 similar lines 段——searched 前缀与 grep 引导行保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t1416-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "alpha\nbeta\ngamma\n", "utf8")
    const err = await byName.edit.execute({ path: "f.txt", old_string: "xyzzy plugh xyzzard", new_string: "x" }, ctx).then(() => null, (e) => e)
    assert.ok(err, "edit should fail")
    assert.ok(
      err.message.includes('  searched: "xyzzy plugh xyzzard" — use grep to locate the actual content'),
      "T14.1.6: searched 前缀 + grep 引导保留（零候选省略仅作用于 similar lines 段）: " + err.message,
    )
    assert.ok(!err.message.includes("similar lines"), "T14.1.6: 零候选 → 无 similar lines 段（整段省略——不输出空段）: " + err.message)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



