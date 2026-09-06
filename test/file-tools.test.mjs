/**
 * file-tools.test.mjs — file tools — external-path / symlink resolution + batch-edit validation / touchedPaths / apply_patch atomicity / delete guard.
 *
 * Split from test/tools.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync, symlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

let tmp, cwd

const ctx = () => ({ cwd })

function setup() {
  tmp = mkdtempSync(join(tmpdir(), "thincoder-vscode-tools-test-"))
  cwd = tmp
}

function cleanup() { rmSync(tmp, { recursive: true, force: true }) }

/** cwdHash12 契约（CHECKPOINT.md F5/验收 12，与 src/tools/checkpoint.mjs 相同）：
 *  sha1(normalizeCwd(cwd)).slice(0,12)——Windows 盘符大写归一化，跨端互通前提。 */

describe("scope removal — 外部路径/symlink 正常解析执行（TOOLS.md §10.1 T-W1/T-W5）", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("T-W1: read 外部路径（../outside.txt）正常解析执行，不再抛 Access denied", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(tmpdir(), "scope-outside.txt"), "outside content\n")
    try {
      const out = await readTool.execute({ path: "../scope-outside.txt" }, ctx())
      assert.match(out, /outside content/)
    } finally {
      rmSync(join(tmpdir(), "scope-outside.txt"), { force: true })
    }
  })

  slow("T-W1: write 外部路径正常写（与 bash 一致——路径解析，不做目录限制）", async () => {
    const { writeTool } = await import("../src/tools/file.mjs")
    const outside = join(tmpdir(), "scope-outside-write.txt")
    try {
      const out = await writeTool.execute({ path: "../scope-outside-write.txt", content: "written outside\n" }, ctx())
      assert.match(out, /wrote/i)
      assert.equal(readFileSync(outside, "utf8").replace(/\r\n/g, "\n"), "written outside\n")
    } finally {
      rmSync(outside, { force: true })
    }
  })

  it("T-W1: edit 外部路径正常解析执行（不再抛 Access denied）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const outside = join(tmpdir(), "scope-outside-edit.txt")
    writeFileSync(outside, "before\n")
    try {
      const out = await editTool.execute({ path: "../scope-outside-edit.txt", old_string: "before", new_string: "after", replace_all: true }, ctx())
      assert.match(out, /Replaced 1 occurrence/)
      assert.equal(readFileSync(outside, "utf8").replace(/\r\n/g, "\n"), "after\n")
    } finally {
      rmSync(outside, { force: true })
    }
  })

  it("T-W5: workspace 内 symlink 指向外部文件 → read 正常解析执行（realpath 断言移除后语义）", async (t) => {
    const { readTool } = await import("../src/tools/file.mjs")
    const outside = join(tmpdir(), "scope-symlink-target.txt")
    writeFileSync(outside, "via symlink\n")
    const link = join(cwd, "link.txt")
    try {
      symlinkSync(outside, link)
    } catch {
      // Windows 无开发者模式时 symlink 创建需要管理员权限——跳过而非失败
      t.skip("symlink creation not permitted on this host")
      return
    }
    try {
      const out = await readTool.execute({ path: "link.txt" }, ctx())
      assert.match(out, /via symlink/)
    } finally {
      rmSync(outside, { force: true })
    }
  })
})

describe("file tools — batch edits validation + touchedPaths + apply_patch atomicity + delete dirty guard (2026-09-02 review fixes)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("batch edits: missing new_string rejected with a message (no TypeError), nothing written", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "one\ntwo\n")
    const r = await editTool.execute({
      edits: [
        { path: "a.txt", old_string: "one", new_string: "ONE" },
        { path: "a.txt", old_string: "two" }, // new_string 缺省——原实现 normalizeEOL 抛 TypeError
      ],
    }, ctx())
    assert.match(r, /edit for a\.txt: new_string must be a string/)
    assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "one\ntwo\n", "atomic — nothing written")
  })

  it("batch edits: non-string old_string/new_string rejected with a message", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "one\n")
    const r1 = await editTool.execute({ edits: [{ path: "a.txt", old_string: 42, new_string: "x" }] }, ctx())
    assert.match(r1, /edit for a\.txt: old_string must be a string/)
    const r2 = await editTool.execute({ edits: [{ path: "a.txt", old_string: "one", new_string: null }] }, ctx())
    assert.match(r2, /edit for a\.txt: new_string must be a string/)
    assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "one\n", "nothing written")
  })

  it("touchedPaths: edits-array mapping (write/edit) + multi-path patch (apply_patch) + delete", async () => {
    const { writeTool, editTool } = await import("../src/tools/file.mjs")
    const { applyPatchTool, deleteTool } = await import("../src/tools/more-file.mjs")
    assert.deepStrictEqual(writeTool.touchedPaths({ path: "w.txt" }), ["w.txt"])
    assert.deepStrictEqual(writeTool.touchedPaths({ filePath: "w2.txt" }), ["w2.txt"])
    assert.deepStrictEqual(editTool.touchedPaths({ path: "e.txt" }), ["e.txt"])
    assert.deepStrictEqual(editTool.touchedPaths({ filePath: "e2.txt" }), ["e2.txt"])
    assert.deepStrictEqual(
      editTool.touchedPaths({ edits: [{ path: "a.txt" }, { path: "b.txt" }, { old_string: "x" }] }),
      ["a.txt", "b.txt"], "edits 数组逐条映射，缺 path 条目过滤")
    // 2026-09-05 用户裁定：顶层 path = 缺 path 条目的默认——计入 touchedPaths（条目全带 path 时不虚报）
    assert.deepStrictEqual(
      editTool.touchedPaths({ path: "top.txt", edits: [{ old_string: "x" }, { path: "b.txt" }] }),
      ["b.txt", "top.txt"], "有缺 path 条目 → 顶层计入")
    assert.deepStrictEqual(
      editTool.touchedPaths({ path: "top.txt", edits: [{ path: "a.txt" }] }),
      ["a.txt"], "条目全带 path → 顶层不虚报")
    assert.deepStrictEqual(
      editTool.touchedPaths({ filePath: "top2.txt", edits: [{ old_string: "x" }] }),
      ["top2.txt"], "filePath 别名同样作为默认计入")
    const patch = `--- a/a.txt
+++ b/a.txt
@@ -1 +1 @@
-x
+y
--- /dev/null
+++ b/new.txt
@@ -0,0 +1 @@
+n
`
    assert.deepStrictEqual(applyPatchTool.touchedPaths({ patch }), ["a.txt", "new.txt"], "多文件 patch 全部路径")
    assert.deepStrictEqual(applyPatchTool.touchedPaths({ patch: "garbage --- no headers" }), [], "畸形 patch → 无路径")
    assert.deepStrictEqual(deleteTool.touchedPaths({ path: "d.txt" }), ["d.txt"])
    assert.deepStrictEqual(deleteTool.touchedPaths({ filePath: "d2.txt" }), ["d2.txt"])
  })

  it("apply_patch atomic: hunk failure on the 2nd file leaves the 1st file untouched", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "a.txt"), "aaa\n")
    writeFileSync(join(cwd, "b.txt"), "bbb\n")
    const patch = `--- a/a.txt
+++ b/a.txt
@@ -1 +1 @@
-aaa
+AAA
--- a/b.txt
+++ b/b.txt
@@ -1 +1 @@
-zzz
+ZZZ
`
    await assert.rejects(() => applyPatchTool.execute({ patch }, ctx()), /Hunk 1 in b\.txt does not apply/)
    assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "aaa\n", "file 1 NOT written — never write a partial patch")
    assert.equal(readFileSync(join(cwd, "b.txt"), "utf8"), "bbb\n")
    assert.ok(!existsSync(join(cwd, "a.txt.thincoder-tmp")), "no leftover .tmp")
  })

  it("apply_patch atomic: dirty open doc on the 2nd file leaves the 1st file untouched", async () => {
    const vscode = await import("vscode")
    vscode.workspace.textDocuments.length = 0
    try {
      const { applyPatchTool } = await import("../src/tools/more-file.mjs")
      writeFileSync(join(cwd, "a.txt"), "aaa\n")
      const bAbs = join(cwd, "b.txt")
      writeFileSync(bAbs, "bbb\n")
      vscode.workspace.textDocuments.push({ uri: { fsPath: bAbs }, isDirty: true, getText: () => "dirty content" })
      const patch = `--- a/a.txt
+++ b/a.txt
@@ -1 +1 @@
-aaa
+AAA
--- a/b.txt
+++ b/b.txt
@@ -1 +1 @@
-bbb
+BBB
`
      const r = await applyPatchTool.execute({ patch }, ctx())
      assert.match(r, /unsaved changes in the editor: .*b\.txt/)
      assert.equal(readFileSync(join(cwd, "a.txt"), "utf8"), "aaa\n", "file 1 NOT written")
    } finally {
      vscode.workspace.textDocuments.length = 0
    }
  })

  it("delete refuses an open dirty doc; deletes an open clean doc", async () => {
    const vscode = await import("vscode")
    vscode.workspace.textDocuments.length = 0
    try {
      const { deleteTool } = await import("../src/tools/more-file.mjs")
      const dAbs = join(cwd, "d.txt")
      writeFileSync(dAbs, "x\n")
      vscode.workspace.textDocuments.push({ uri: { fsPath: dAbs }, isDirty: true, getText: () => "x\n" })
      const r = await deleteTool.execute({ path: "d.txt" }, ctx())
      assert.match(r, /unsaved changes in the editor: .*d\.txt/)
      assert.ok(existsSync(dAbs), "dirty file NOT deleted")

      const cAbs = join(cwd, "c.txt")
      writeFileSync(cAbs, "y\n")
      vscode.workspace.textDocuments.length = 0
      vscode.workspace.textDocuments.push({ uri: { fsPath: cAbs }, isDirty: false, getText: () => "y\n" })
      const r2 = await deleteTool.execute({ path: "c.txt" }, ctx())
      assert.match(r2, /Deleted c\.txt/)
      assert.ok(!existsSync(cAbs), "clean open file deleted")
    } finally {
      vscode.workspace.textDocuments.length = 0
    }
  })
})
