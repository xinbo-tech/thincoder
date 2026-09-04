/**
 * file-tools.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { builtinTools } from "../src/tools/index.mjs"
import { applyPatchLines, computeEditEntry, EMPTY_NEW_STRING, REGION_TOO_LARGE, MAX_DIFF_LINES } from "../src/tools/edit-diff.mjs"

test("read_image: 非视觉模型直接拒绝（防 image_url 毒化会话），视觉模型正常返回", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  try {
    // 1x1 透明 PNG
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")
    writeFileSync(join(dir, "a.png"), png)
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    // DeepSeek（无视觉）：读文件前就拒绝，错误信息说明原因与替代方案
    await assert.rejects(
      () => byName.read_image.execute({ path: "a.png" }, { cwd: dir, agent: { provider: { model: "deepseek-v4-pro" } } }),
      /does not support image input/,
    )
    // Kimi K3（有视觉）：正常返回 { text, images }
    const out = await byName.read_image.execute({ path: "a.png" }, { cwd: dir, agent: { provider: { model: "kimi-k3" } } })
    const parsed = JSON.parse(out)
    assert.match(parsed.text, /read_image: a\.png/)
    assert.equal(parsed.images[0].type, "image_url")
    // 无 agent 上下文（独立调用）：不拦截
    const out2 = await byName.read_image.execute({ path: "a.png" }, { cwd: dir })
    assert.equal(JSON.parse(out2).images.length, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("read_image: glm-5.3-flash 多模态放行（PROVIDER.md §11 T2，2026-08-31 补自动化）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-glmflash-"))
  try {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")
    writeFileSync(join(dir, "a.png"), png)
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    // glm-5.3-flash（multimodal=true）：与 kimi-k3 同样放行，门禁不拒绝
    const out = await byName.read_image.execute({ path: "a.png" }, { cwd: dir, agent: { provider: { model: "glm-5.3-flash" } } })
    const parsed = JSON.parse(out)
    assert.match(parsed.text, /read_image: a\.png/)
    assert.ok(Array.isArray(parsed.images) && parsed.images.length === 1, "image part 进 multimodal 通道")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("read_image: svg 返回文本源码（不进 image_url，任何模型可用），bmp 拒绝并提示转 PNG", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  try {
    writeFileSync(join(dir, "a.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>')
    writeFileSync(join(dir, "a.bmp"), Buffer.from([66, 77]))
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    // 视觉模型：返回纯文本（JSON.parse 失败 → agent 当普通 tool 结果，不产 image_url 毒化历史）
    const out = await byName.read_image.execute({ path: "a.svg" }, { cwd: dir, agent: { provider: { model: "kimi-k3" } } })
    assert.match(out, /svg source/)
    assert.match(out, /<rect/)
    assert.throws(() => JSON.parse(out))
    // 文本模型也可用——svg 不需要视觉能力，在 vision gate 之前分支
    const out2 = await byName.read_image.execute({ path: "a.svg" }, { cwd: dir, agent: { provider: { model: "deepseek-v4-pro" } } })
    assert.match(out2, /<svg/)
    // bmp：没有主流视觉 API 支持，拒绝并提示转换
    await assert.rejects(
      () => byName.read_image.execute({ path: "a.bmp" }, { cwd: dir, agent: { provider: { model: "kimi-k3" } } }),
      /Unsupported image format: \.bmp[\s\S]*Convert it to PNG/,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("tools: write / read / edit / glob / grep", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "sub/a.txt", content: "hello\nworld\n" }, ctx)
    const readOut = await byName.read.execute({ path: "sub/a.txt" }, ctx)
    assert.match(readOut, /1\thello/)

    await byName.edit.execute({ path: "sub/a.txt", old_string: "hello\nworld", new_string: "hello\nmjs" }, ctx)
    const readOut2 = await byName.read.execute({ path: "sub/a.txt" }, ctx)
    assert.match(readOut2, /2\tmjs/)

    // edit 多次匹配必须报错
    await byName.write.execute({ path: "b.txt", content: "x x x" }, ctx)
    await assert.rejects(() => byName.edit.execute({ path: "b.txt", old_string: "x", new_string: "y" }, ctx))

    const globOut = await byName.glob.execute({ pattern: "**/*.txt" }, ctx)
    assert.match(globOut, /sub\/a\.txt/)
    assert.match(globOut, /b\.txt/)

    const grepOut = await byName.grep.execute({ pattern: "mjs" }, ctx)
    assert.match(grepOut, /a\.txt:2:/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})




test("globToRegex: **跨目录 / * 段内 / ? 单字符 / 精确匹配", async () => {
  const { globToRegex } = await import("../src/tools/shared.mjs")
  // **/*.txt：匹配任意深度的 .txt 文件（含根目录、多层子目录）
  const re1 = globToRegex("**/*.txt")
  assert.ok(re1.test("a.txt"), "**/*.txt should match root file")
  assert.ok(re1.test("sub/a.txt"), "**/*.txt should match one-level deep")
  assert.ok(re1.test("deep/nested/a.txt"), "**/*.txt should match multi-level deep")
  assert.ok(!re1.test("a.txt.bak"), "**/*.txt should not match wrong extension")

  // ** 单独使用：匹配任意路径（跨目录）
  const re2 = globToRegex("src/**")
  assert.ok(re2.test("src/a.mjs"), "src/** should match file in src/")
  assert.ok(re2.test("src/deep/nested/a.mjs"), "src/** should match deeply nested file")
  assert.ok(!re2.test("test/a.mjs"), "src/** should not match outside src/")

  // * 段内通配（不跨 /）
  const re3 = globToRegex("*.mjs")
  assert.ok(re3.test("a.mjs"), "*.mjs should match root file")
  assert.ok(!re3.test("sub/a.mjs"), "*.mjs should not match subdirectory file")

  // ? 单字符
  const re4 = globToRegex("a?.mjs")
  assert.ok(re4.test("ab.mjs"), "a?.mjs should match ab.mjs")
  assert.ok(!re4.test("abc.mjs"), "a?.mjs should not match abc.mjs")

  // 精确匹配
  const re5 = globToRegex("exact.mjs")
  assert.ok(re5.test("exact.mjs"), "exact match")
  assert.ok(!re5.test("notexact.mjs"), "no false positive")
})



test("tools: grep before/after 上下文行（匹配行 : 上下文行 -，相邻区间合并）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-ctx-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // 两处匹配相邻（line2 / line4），before=1 after=1 → line3 同时是 line2 的 after 与 line4 的 before，应去重合并
    await byName.write.execute({
      path: "c.txt",
      content: "alpha\nMATCH one\nmid\nMATCH two\nomega\n",
    }, ctx)

    // 无上下文：仍是 path:line: content，不出现 -N- 上下文分隔
    const plain = await byName.grep.execute({ pattern: "MATCH", path: "c.txt" }, ctx)
    assert.match(plain, /c\.txt:2: MATCH one/)
    assert.match(plain, /c\.txt:4: MATCH two/)
    assert.doesNotMatch(plain, /c\.txt-\d+-/)

    // before=1 after=1：匹配行用 ':'，上下文行用 '-'，line3 只出现一次
    const ctxOut = await byName.grep.execute({ pattern: "MATCH", path: "c.txt", before: 1, after: 1 }, ctx)
    const lines = ctxOut.split("\n")
    // 顺序：c-1- alpha / c:2: MATCH one / c-3- mid / c:4: MATCH two / c-5- omega
    assert.equal(lines.length, 5)
    assert.match(lines[0], /c\.txt-1- alpha/)
    assert.match(lines[1], /c\.txt:2: MATCH one/)
    assert.match(lines[2], /c\.txt-3- mid/)        // line3 合并去重，只一行
    assert.match(lines[3], /c\.txt:4: MATCH two/)
    assert.match(lines[4], /c\.txt-5- omega/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- ls / fetch


test("ls: 目录列表（目录在前，含大小时间）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-ls-"))
  try {
    const { writeFile, mkdir } = await import("node:fs/promises")
    await mkdir(join(dir, "src"))
    await writeFile(join(dir, "a.txt"), "hello")
    const ls = builtinTools.find((t) => t.name === "ls")
    const out = await ls.execute({ path: dir }, { cwd: dir })
    const lines = out.split("\n")
    assert.match(lines[0], /^d {2}src\//) // 目录在前
    assert.match(lines[1], /^- {2}a\.txt\s+5\s/) // 文件带大小
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})




// ---------------------------------------------------------------- delete / git 工具


test("delete: 未跟踪文件可删，跟踪文件拒绝，force 可删跟踪文件", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-del-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir })
    execFileSync("git", ["config", "user.name", "t"], { cwd: dir })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: dir })
    writeFileSync(join(dir, "tracked.js"), "1\n")
    writeFileSync(join(dir, "untracked.js"), "2\n")
    execFileSync("git", ["add", "tracked.js"], { cwd: dir })
    execFileSync("git", ["commit", "-qm", "init"], { cwd: dir })

    const del = builtinTools.find((t) => t.name === "delete")
    const ctx = { cwd: dir }

    // 未跟踪文件可删
    const r1 = await del.execute({ path: "untracked.js" }, ctx)
    assert.ok(r1.includes("Deleted"))
    assert.ok(!existsSync(join(dir, "untracked.js")))

    // 跟踪文件拒绝
    await assert.rejects(() => del.execute({ path: "tracked.js" }, ctx), /git-tracked/)

    // force 可删跟踪文件
    await del.execute({ path: "tracked.js", force: true }, ctx)
    assert.ok(!existsSync(join(dir, "tracked.js")))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- grep regex validation


test("grep: invalid regex gives helpful error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-re-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "hello\nworld\n" }, ctx)

    await assert.rejects(
      () => byName.grep.execute({ pattern: "**bad**", path: "." }, ctx),
      /not a valid regex/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- grep \r\n normalization


test("grep: \\r\\n file still matches", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-eol-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "crlf.mjs"), "hello world\r\nconst x = 1\r\n", "utf8")

    const out = await byName.grep.execute({ pattern: "hello", path: "." }, ctx)
    assert.ok(out.includes("crlf.mjs"), out)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- ls missing directory


test("ls: missing directory gives helpful error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-ls-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await assert.rejects(
      () => byName.ls.execute({ path: "nonexistent" }, ctx),
      /not found/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("grep literal + ignoreCase; ls filter", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-"))
  try {
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    writeFileSync(join(dir, "a.js"), "function foo.bar() {}\nFOOBAR\nx\n")
    writeFileSync(join(dir, "b.txt"), "nothing")
    const ctx = { cwd: dir }

    const lit = await byName.grep.execute({ pattern: "foo.bar()", literal: true, path: "a.js" }, ctx)
    assert.match(lit, /foo\.bar\(\)/, "literal match — regex specials not interpreted")

    const ic = await byName.grep.execute({ pattern: "foobar", ignoreCase: true, path: "a.js" }, ctx)
    assert.match(ic, /FOOBAR/, "ignoreCase matches case variant")

    const ls = await byName.ls.execute({ filter: "*.js", path: "." }, ctx)
    assert.match(ls, /a\.js/, "ls filter keeps matching entry")
    assert.doesNotMatch(ls, /b\.txt/, "ls filter excludes non-matching entry")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("tree: depth-limited directory tree", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-tree-"))
  try {
    mkdirSync(join(dir, "src/nested/deep"), { recursive: true })
    writeFileSync(join(dir, "src/a.js"), "x")
    writeFileSync(join(dir, "src/nested/b.js"), "x")
    writeFileSync(join(dir, "root.txt"), "x")
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    const out = await byName.tree.execute({ depth: 2 }, { cwd: dir })
    assert.match(out, /src\//, "lists directory with trailing slash")
    assert.match(out, /root\.txt/, "lists root file")
    assert.doesNotMatch(out, /deep/, "depth limit excludes deeper levels")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- §15 edit LCS 语义（TOOLS.md D15.1——2026-09-04）

test("T15.1: edit LCS——公共行保留、新行插入、旧行不丢（applyPatchLines 单元）", () => {
  const r = applyPatchLines("const A = 1\nconst B = 2", "const A = 1\nconst A2 = 11\nconst B = 2")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "const A = 1\nconst A2 = 11\nconst B = 2")
})

test("T15.1a: new-only 行在首个公共行前——LCS 序（X 插在 A 前）", () => {
  const r = applyPatchLines("A\nB", "X\nA\nB")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "X\nA\nB")
})

test("T15.2: 零重叠单行→按插入——old 行保留、new 行插其后", () => {
  const r = applyPatchLines("line3", "line3b")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "line3\nline3b")
})

test("T15.3: 零重叠多行→按插入——old 全保留、new 插后", () => {
  const r = applyPatchLines("a\nb", "x\ny")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "a\nb\nx\ny")
})

test("T15.3a: 空 new_string（纯删除意图）→ 显式错误", () => {
  const r = applyPatchLines("a", "")
  assert.equal(r.ok, false)
  assert.equal(r.reason, EMPTY_NEW_STRING)
})

test("T15.4: 单行带上下文改词——diff 应用成功", () => {
  const r = applyPatchLines("const C = 1\nconst D = 2", "const C = 10\nconst D = 2")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "const C = 10\nconst D = 2")
})

test("T15.5: old 段去一行（带公共上下文）→ 删除生效", () => {
  const r = applyPatchLines("a\nb\nc", "a\nc")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "a\nc")
})

test("T15.8: old/new 行数超限（>1000）→ region too large", () => {
  const big = Array.from({ length: MAX_DIFF_LINES + 1 }, (_, i) => `L${i}`).join("\n")
  assert.equal(applyPatchLines(big, "x\n").ok, false)
  assert.equal(applyPatchLines("x\n", big).reason, REGION_TOO_LARGE)
})

test("T15: no-op（new 与 old 行级一致）→ 原样替换仍成功", () => {
  const r = applyPatchLines("x\ny", "x\ny")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "x\ny")
})

test("T15: 区域尾随换行保持（无 CRLF 污染——LF 域）", () => {
  const r = applyPatchLines("a\nb\n", "c")
  assert.equal(r.ok, true)
  assert.equal(r.resultText, "a\nb\nc\n")
})

test("T15.2 tool 级：单行×单行唯一→就地替换（§15.2 分支 0——迁移：原零重叠插入语义翻转）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-replace-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx)
    const out = await byName.edit.execute({ path: "f.mjs", old_string: "line2", new_string: "LINE2X" }, ctx)
    assert.ok(out.includes("Edited"), out) // 分支 0 替换回显（迁移前：插入——旧行保留）
    const content = readFileSync(join(dir, "f.mjs"), "utf8")
    assert.equal(content, "line1\nLINE2X\n", "line2 被 LINE2X 就地替换——行数不变")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// §15.2 分支 0——edit 单行精确替换（TOOLS.md §15.2 D15.9.1/T15.33-37——2026-09-04）

test("T15.33: 单行 old 唯一匹配 + 单行 new（A→X）→ 就地替换——行数不变——EOL 保留", async () => {
  // 判定层（computeEditEntry——分支 0 落点）
  const out = computeEditEntry("A\nB\n", { old_string: "A", new_string: "X" }, { path: "t.txt" })
  assert.equal(out.updated, "X\nB\n", "A 消失 X 在位——行数不变")
  assert.equal(out.lineShift, 0)
  assert.equal(out.occurrences, 1)
  // 工具层——CRLF 文件替换写回保留原 EOL（joinWithEol 调用方路径）
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-replace-crlf-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "f.txt"), "a\r\nb\r\nc\r\n", "utf8")
    const r = await byName.edit.execute({ path: "f.txt", old_string: "b", new_string: "B" }, ctx)
    assert.ok(r.includes("replaced 1 occurrence"), r)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "a\r\nB\r\nc\r\n", "CRLF 保留——替换不引入裸 LF")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.34: 单行 old 多出现（A 两处）→ 仍 occurrences 错误（分支 0 不吞）", () => {
  assert.throws(
    () => computeEditEntry("A\nA\n", { old_string: "A", new_string: "X" }, { path: "t.txt" }),
    /matches 2 times/,
  )
})

test("T15.35: 多行 old 零重叠 new（old=[A,B] new=[X,Y]）→ 仍插入（回归——旧语义不动）", () => {
  const out = computeEditEntry("A\nB\n", { old_string: "A\nB", new_string: "X\nY" }, { path: "t.txt" })
  assert.equal(out.updated, "A\nB\nX\nY\n", "A、B 保留 + X、Y 插后（零重叠插入回归）")
  assert.equal(out.lineShift, 2)
})

test("T15.36: 多行 LCS（old=[A,B] new=[A,X]）→ 仍 LCS（回归——分支 0 不扩围）", () => {
  const out = computeEditEntry("A\nB\n", { old_string: "A\nB", new_string: "A\nX" }, { path: "t.txt" })
  assert.equal(out.updated, "A\nX\n", "公共行 A 保留、B 删、X 插——LCS 语义不动")
  assert.equal(out.lineShift, 0)
})

// T15.37（审计走查——非独立用例）：computeEditEntry 判定序含分支 0——isSingleLineReplace
// （old 单行 && new 单行 && new 非空）位于 occurrences 校验后、applyPatchLines 前——单行×
// 单行唯一匹配 → 就地替换（不再零重叠插入）；多匹配/空 new 既有错误先行。CLI/VS Code 双端
// 镜像同构（NF15.7b）——回潮由 T15.33 断言失败暴露（退化为插入时 updated 变 "A\nX\nB\n" 即红）。

test("T15.9: replace_all——每处旧段→新段字面替换（不做插入规则）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-replaceall-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.txt", content: "x x x" }, ctx)
    await byName.edit.execute({ path: "f.txt", old_string: "x", new_string: "y", replace_all: true }, ctx)
    const final = await byName.read.execute({ path: "f.txt" }, ctx)
    assert.match(final, /y y y/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15.13: read filePath 别名——与 path 同效（T15.3#3）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-t15-filepath-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "a.txt", content: "hello\nworld\n" }, ctx)
    const out = await byName.read.execute({ filePath: "a.txt" }, ctx)
    assert.match(out, /1\thello/)
    assert.match(out, /2\tworld/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
