/**
 * edit-eol.test.mjs — CRLF byte-offset drift + same-family hazards (EDIT-TOOL-EOL F5).
 *
 * Regression for the 2026-08-28 editor-path bug: edit's non-replace_all branch
 * passed an LF-domain offset (`normalizeEOL` drops every `\r`) straight to
 * `doc.positionAt`, which expects raw CRLF offsets (`\r\n` = 2 chars). The
 * drift = newlines before the match, so the range edit landed on the wrong line
 * (粘连/截断/重复). The old mock doc had no `positionAt`, so the range branch was
 * never exercised — this file's mock reproduces the real host semantics.
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import * as vscode from "vscode"

let tmp, cwd
const ctx = () => ({ cwd })

function setup() {
  tmp = mkdtempSync(join(tmpdir(), "thincoder-vscode-eol-test-"))
  cwd = tmp
}
function cleanup() { rmSync(tmp, { recursive: true, force: true }) }

/**
 * Faithful TextDocument mock: positionAt / lineAt / _applyEdit all operate on
 * the RAW buffer (CRLF preserved; `\r` counts as 1 char), matching the real host.
 * `getText()` never includes a BOM — the host manages it via file encoding.
 */
function makeDoc(text, fsPath = "d:\\proj\\file.mjs") {
  const doc = {
    uri: vscode.Uri.file(fsPath),
    isDirty: false,
    _text: text,
    get lineCount() { return this._text.split("\n").length },
    getText() { return this._text },
    positionAt(offset) {
      let line = 0, col = 0
      const n = Math.max(0, Math.min(offset, this._text.length))
      for (let i = 0; i < n; i++) {
        if (this._text[i] === "\n") { line++; col = 0 } else col++
      }
      return { line, character: col }
    },
    lineAt(lineNumber) {
      const line = this._text.split("\n")[lineNumber] ?? ""
      return { lineNumber, text: line.replace(/\r$/, "") }
    },
    _applyEdit(range, newText) {
      const start = rawOffsetAt(this._text, range.start.line, range.start.character)
      const end = rawOffsetAt(this._text, range.end.line, range.end.character)
      this._text = this._text.slice(0, start) + newText + this._text.slice(end)
    },
    async save() { this.isDirty = false; return true },
  }
  return doc
}

/** Raw-buffer offset of (line, character) — the inverse of positionAt. */
function rawOffsetAt(text, line, character) {
  let offset = 0
  for (let l = 0; l < line; l++) {
    const nl = text.indexOf("\n", offset)
    if (nl === -1) return text.length
    offset = nl + 1
  }
  return Math.min(text.length, offset + character)
}

/** Temporarily override process.platform (used by getOpenDoc's win32 branch). */
function forcePlatform(p) {
  const desc = Object.getOwnPropertyDescriptor(process, "platform")
  Object.defineProperty(process, "platform", { value: p, configurable: true })
  return () => {
    if (desc) Object.defineProperty(process, "platform", desc)
    else delete process.platform
  }
}

beforeEach(() => {
  setup()
  vscode.workspace.textDocuments.length = 0
  vscode.workspace.applyEditCalls.length = 0
})
afterEach(cleanup)

describe("F5 — CRLF offset drift + same-family hazards (EDIT-TOOL-EOL)", () => {
  it("CRLF range edit: 60-line doc, editing line 55 touches only that line", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const lines = Array.from({ length: 60 }, (_, i) => `line ${String(i + 1).padStart(2, "0")} content`)
    const raw = lines.join("\r\n") + "\r\n"
    const doc = makeDoc(raw, "d:\\proj\\crlf-range.txt")
    vscode.workspace.textDocuments.push(doc)

    const r = await editTool.execute({ path: "crlf-range.txt", old_string: "line 54 content\nline 55 content", new_string: "line 54 content\nline 55 CHANGED" }, { cwd: "d:\\proj" })
    assert.match(r, /Replaced 1 occurrence/)
    const out = doc.getText()
    assert.ok(out.includes("line 55 CHANGED\r\n"), "target line changed")
    assert.ok(!out.includes("line 55 content"), "original target gone")
    assert.ok(out.includes("line 54 content\r\n"), "line 54 intact")
    assert.ok(out.includes("line 56 content\r\n"), "line 56 intact")
    assert.equal((out.match(/\r\n/g) || []).length, 60, "CRLF count unchanged (no drift)")
  })

  it("replace_all on a CRLF doc stays pure CRLF (no LF flip)", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const doc = makeDoc("x\r\nx\r\nx\r\n", "d:\\proj\\ra.txt")
    vscode.workspace.textDocuments.push(doc)

    const r = await editTool.execute({ path: "ra.txt", old_string: "x", new_string: "Y", replace_all: true }, { cwd: "d:\\proj" })
    assert.match(r, /Replaced 3 occurrence/)
    const out = doc.getText()
    assert.equal(out, "Y\r\nY\r\nY\r\n")
    assert.ok(!/(?<!\r)\n/.test(out), "no bare LF after replace_all")
  })

  it("mixed EOL: CRLF head + bare-LF island, both edits map correctly", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const raw = "head1\r\nhead2\r\nislandA\nislandB\r\ntail\r\n"
    const doc = makeDoc(raw, "d:\\proj\\mixed.txt")
    vscode.workspace.textDocuments.push(doc)

    await editTool.execute({ path: "mixed.txt", old_string: "head1\nhead2", new_string: "head1\nHEAD2" }, { cwd: "d:\\proj" })
    assert.equal(doc.getText(), "head1\r\nHEAD2\r\nislandA\nislandB\r\ntail\r\n")
    await editTool.execute({ path: "mixed.txt", old_string: "islandB\ntail", new_string: "ISLANDB\ntail" }, { cwd: "d:\\proj" })
    assert.equal(doc.getText(), "head1\r\nHEAD2\r\nislandA\nISLANDB\r\ntail\r\n")
  })

  it("lfOffsetToRaw treats \\r\\n as an atomic 2-char unit", async () => {
    const { lfOffsetToRaw } = await import("../src/tools/shared.mjs")
    assert.equal(lfOffsetToRaw("a\r\nb", 2), 3)
    assert.equal(lfOffsetToRaw("a\r\nb", 0), 0)
    assert.equal(lfOffsetToRaw("a\nb", 2), 2)
  })

  it("getOpenDoc matches fsPath case-insensitively on win32", async () => {
    const { getOpenDoc } = await import("../src/tools/shared.mjs")
    const doc = makeDoc("x", "d:\\proj\\Case.mjs")
    vscode.workspace.textDocuments.push(doc)
    const restore = forcePlatform("win32")
    try {
      assert.equal(getOpenDoc("D:\\PROJ\\case.MJS"), doc)
    } finally {
      restore()
    }
  })

  it("read(hashes=true) on a CRLF+BOM file hashes the first line without \\r/\\uFEFF", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    writeFileSync(join(cwd, "bom-crlf.txt"), "\uFEFFfirst line\r\nsecond line\r\n")
    const out = await readTool.execute({ path: "bom-crlf.txt", hashes: true }, ctx())
    assert.ok(out.includes(hashLine("first line")), "first-line hash excludes \\r and \\uFEFF: " + out)
    assert.ok(out.includes(hashLine("second line")), "second-line hash excludes \\r: " + out)
  })

  it("hashline_edit round-trips BOM + CRLF on disk (hash domain consistent with read)", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "bom.txt")
    writeFileSync(f, "\uFEFFfirst\r\nsecond\r\n")
    const r = await hashlineEditTool.execute({ path: "bom.txt", old_hashes: [hashLine("first")], new_content: "FIRST" }, ctx())
    assert.match(r, /replaced 1 line/)
    assert.equal(readFileSync(f, "utf8"), "\uFEFFFIRST\r\nsecond\r\n")
  })

  it("hashline_edit open-doc (BOM file) passes BOM-less text to the editor (no double BOM)", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "open-bom.txt")
    writeFileSync(f, "\uFEFFfirst\r\nsecond\r\n")
    // The host's getText() never includes the BOM (VS Code manages it via encoding).
    const doc = makeDoc("first\r\nsecond\r\n", f)
    vscode.workspace.textDocuments.push(doc)

    const r = await hashlineEditTool.execute({ path: "open-bom.txt", old_hashes: [hashLine("first")], new_content: "FIRST" }, ctx())
    assert.match(r, /replaced 1 line/)
    assert.equal(doc.getText(), "FIRST\r\nsecond\r\n")
    assert.ok(!doc.getText().startsWith("\uFEFF"), "editor text must not carry the BOM")
  })

  it("old_string not found in an open doc returns an error and does not apply", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const doc = makeDoc("a\r\nb\r\nc\r\n", "d:\\proj\\nf.txt")
    vscode.workspace.textDocuments.push(doc)
    vscode.workspace.applyEditCalls.length = 0

    const r = await editTool.execute({ path: "nf.txt", old_string: "zzz", new_string: "x" }, { cwd: "d:\\proj" })
    assert.match(r, /old_string not found/)
    assert.equal(vscode.workspace.applyEditCalls.length, 0, "no WorkspaceEdit on a miss")
    assert.equal(doc.getText(), "a\r\nb\r\nc\r\n")
  })

  it("insert_after on a CRLF open doc injects CRLF (no bare-LF mixing)", async () => {
    const { insertAfterTool } = await import("../src/tools/more-file.mjs")
    const doc = makeDoc("one\r\ntwo\r\nthree\r\n", "d:\\proj\\ins.txt")
    vscode.workspace.textDocuments.push(doc)

    const r = await insertAfterTool.execute({ path: "ins.txt", after_line: 2, content: "twoAndHalf" }, { cwd: "d:\\proj" })
    assert.match(r, /Inserted after line 2/)
    const out = doc.getText()
    assert.equal(out, "one\r\ntwo\r\ntwoAndHalf\r\nthree\r\n")
    assert.ok(!/(?<!\r)\n/.test(out), "no bare LF injected")
  })

  it("insert_after after_regex with $ anchor matches CRLF lines", async () => {
    const { insertAfterTool } = await import("../src/tools/more-file.mjs")
    const doc = makeDoc("alpha\r\nbeta\r\ngamma\r\n", "d:\\proj\\ins2.txt")
    vscode.workspace.textDocuments.push(doc)

    const r = await insertAfterTool.execute({ path: "ins2.txt", after_regex: "beta$", content: "betaAndHalf" }, { cwd: "d:\\proj" })
    assert.match(r, /Inserted after line 2/)
    assert.equal(doc.getText(), "alpha\r\nbeta\r\nbetaAndHalf\r\ngamma\r\n")
  })
})

describe("edit 数组形态（2026-08-31 工具顺手度，CLI ebd70eb parity）：多文件原子替换", () => {
  it("两文件原子替换——都成功", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "const A = 1\n", "utf8")
    writeFileSync(join(cwd, "b.txt"), "const B = 2\n", "utf8")
    const r = await editTool.execute({
      edits: [
        { path: "a.txt", old_string: "const A = 1", new_string: "const A = 10", replace_all: true },
        { path: "b.txt", old_string: "const B = 2", new_string: "const B = 20", replace_all: true },
      ],
    }, { cwd })
    assert.match(r, /Replaced 1 occurrence\(s\) in a\.txt/)
    assert.match(r, /Replaced 1 occurrence\(s\) in b\.txt/)
    assert.ok(readFileSync(join(cwd, "a.txt"), "utf8").includes("const A = 10"), "a.txt 已改")
    assert.ok(readFileSync(join(cwd, "b.txt"), "utf8").includes("const B = 20"), "b.txt 已改")
  })

  it("任一失败 → 全不写（原子回滚）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "const A = 1\n", "utf8")
    writeFileSync(join(cwd, "b.txt"), "const B = 2\n", "utf8")
    const r = await editTool.execute({
      edits: [
        { path: "a.txt", old_string: "const A = 1", new_string: "const A = 100", replace_all: true },
        { path: "b.txt", old_string: "NOT FOUND", new_string: "x" },
      ],
    }, { cwd })
    assert.match(r, /edit aborted \(atomic — no files written\)/)
    assert.ok(readFileSync(join(cwd, "a.txt"), "utf8").includes("const A = 1"), "a.txt 未被写（原子回滚）")
  })

  it("与顶层 old_string/new_string 互斥（2026-09-05 用户裁定：path 放行、old/new 仍互斥）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "x\n", "utf8")
    const r = await editTool.execute({
      path: "a.txt",
      old_string: "x",
      new_string: "y",
      edits: [{ path: "a.txt", old_string: "x", new_string: "y" }],
    }, { cwd })
    assert.match(r, /mutually exclusive/)
  })

  it("顶层 path + edits（条目无 path）：顶层为默认——同文件串行生效（2026-09-05 用户裁定）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "const A = 1\nconst B = 2\n", "utf8")
    const r = await editTool.execute({
      path: "a.txt",
      edits: [
        { old_string: "const A = 1", new_string: "const A = 10" },
        { old_string: "const B = 2", new_string: "const B = 20" },
      ],
    }, { cwd })
    assert.equal((r.match(/Replaced 1 occurrence\(s\) in a\.txt/g) || []).length, 2, "两条都回显")
    assert.ok(readFileSync(join(cwd, "a.txt"), "utf8").includes("const A = 10"), "第一条生效（顶层默认）")
    assert.ok(readFileSync(join(cwd, "a.txt"), "utf8").includes("const B = 20"), "第二条生效（串行累积）")
  })

  it("条目自带 path 覆盖顶层 path（2026-09-05 用户裁定）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "const A = 1\n", "utf8")
    writeFileSync(join(cwd, "b.txt"), "const B = 2\n", "utf8")
    const r = await editTool.execute({
      path: "a.txt",
      edits: [
        { path: "b.txt", old_string: "const B = 2", new_string: "const B = 20" },
        { old_string: "const A = 1", new_string: "const A = 10" },
      ],
    }, { cwd })
    assert.match(r, /Replaced 1 occurrence\(s\) in a\.txt/)
    assert.match(r, /Replaced 1 occurrence\(s\) in b\.txt/)
    assert.ok(readFileSync(join(cwd, "a.txt"), "utf8").includes("const A = 10"), "a.txt 已改（顶层）")
    assert.ok(readFileSync(join(cwd, "b.txt"), "utf8").includes("const B = 20"), "b.txt 已改（条目优先）")
  })

  it("条目与顶层皆无 path → 路径错误（文本补顶层选项）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "a.txt"), "x\n", "utf8")
    const r = await editTool.execute({
      edits: [{ old_string: "x", new_string: "y" }],
    }, { cwd })
    assert.match(r, /each edit must have a path — give each entry its own path or pass a top-level path/)
  })

  it("同文件多条串行累积（编辑器路径）：第一条变长，第二条仍精确命中（2026-09-01 缺陷修复）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    // 修复前：第二条的 range 基于原始 raw 计算，第一条变长后坐标漂移 → 剪错位置
    const doc = makeDoc("const A = 1\nconst B = 2\nconst C = 3\n", "d:\\proj\\same-doc.txt")
    vscode.workspace.textDocuments.push(doc)
    const r = await editTool.execute({
      edits: [
        { path: "same-doc.txt", old_string: "const A = 1\nconst B = 2", new_string: "const A = 10 // lengthened\nconst B = 2" },
        { path: "same-doc.txt", old_string: "const A = 10 // lengthened\nconst B = 2", new_string: "const A = 10 // lengthened\nconst B = 20" },
      ],
    }, { cwd: "d:\\proj" })
    assert.equal((r.match(/Replaced 1 occurrence\(s\) in same-doc\.txt/g) || []).length, 2, "两条都回显")
    assert.equal(doc.getText(), "const A = 10 // lengthened\nconst B = 20\nconst C = 3\n", "两条都生效，无漂移")
  })

  it("同文件多条串行累积（CRLF 编辑器路径）：raw 域快照随条目推进，第二条不漂移", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const doc = makeDoc("const A = 1\r\nconst B = 2\r\nconst C = 3\r\n", "d:\\proj\\same-crlf.txt")
    vscode.workspace.textDocuments.push(doc)
    const r = await editTool.execute({
      edits: [
        { path: "same-crlf.txt", old_string: "const A = 1\nconst B = 2", new_string: "const A = 10 // lengthened\nconst B = 2" },
        { path: "same-crlf.txt", old_string: "const B = 2\nconst C = 3", new_string: "const B = 2\nconst C = 30" },
      ],
    }, { cwd: "d:\\proj" })
    assert.equal(doc.getText(), "const A = 10 // lengthened\r\nconst B = 2\r\nconst C = 30\r\n", "CRLF 保持原样，第二条精确命中")
    assert.ok(!/(?<!\r)\n/.test(doc.getText()), "无裸 LF 混入")
  })

  it("同文件多条串行累积（磁盘路径）：第一条增行，第二条按累积内容生效", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "same-disk.txt"), "const A = 1\nconst B = 2\nconst C = 3\n", "utf8")
    const r = await editTool.execute({
      edits: [
        { path: "same-disk.txt", old_string: "const A = 1\nconst B = 2", new_string: "const A = 10\nconst A2 = 12\nconst B = 2" },
        { path: "same-disk.txt", old_string: "const B = 2\nconst C = 3", new_string: "const B = 20\nconst C = 3" },
      ],
    }, { cwd })
    assert.equal((r.match(/Replaced 1 occurrence\(s\) in same-disk\.txt/g) || []).length, 2, "两条都回显")
    assert.equal(
      readFileSync(join(cwd, "same-disk.txt"), "utf8"),
      "const A = 10\nconst A2 = 12\nconst B = 20\nconst C = 3\n",
      "两条都生效（修复前只有第一条留存）"
    )
  })

  it("同文件多条：第二条 old_string not found → 原子失败全不写（磁盘路径）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "atom.txt"), "const A = 1\nconst B = 2\n", "utf8")
    const r = await editTool.execute({
      edits: [
        { path: "atom.txt", old_string: "const A = 1", new_string: "const A = 100" },
        { path: "atom.txt", old_string: "NOT FOUND", new_string: "x" },
      ],
    }, { cwd })
    assert.match(r, /edit aborted \(atomic — no files written\)/)
    assert.equal(readFileSync(join(cwd, "atom.txt"), "utf8"), "const A = 1\nconst B = 2\n", "文件保持原样")
  })

  it("同文件批次 [replace_all, 非 replace_all]（编辑器路径 CRLF）：第二条精确命中（#1 raw 镜像漂移回归）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    // 修复前：replace_all 条目的 raw 镜像只拼接首处替换（其余 occurrence 残留旧文本），
    // 第二条的 lfOffsetToRaw 在漂移的 rawText 上定位 → applyEditorRangeEdit 剪错位置。
    // old→new 长度必须变化（等长替换不暴露漂移）且出现 ≥2 次。
    const doc = makeDoc("alpha\r\nbeta\r\nalpha\r\ngamma\r\n", "d:\\proj\\ra-crlf.txt")
    vscode.workspace.textDocuments.push(doc)
    const r = await editTool.execute({
      edits: [
        { path: "ra-crlf.txt", old_string: "alpha", new_string: "A", replace_all: true },
        { path: "ra-crlf.txt", old_string: "A\ngamma", new_string: "A\nGAMMA" },
      ],
    }, { cwd: "d:\\proj" })
    assert.match(r, /Replaced 2 occurrence/)
    assert.equal(doc.getText(), "A\r\nbeta\r\nA\r\nGAMMA\r\n", "replace_all 两处生效 + 第二条精确命中（修复前剪进 alpha 残骸）")
    assert.ok(!/(?<!\r)\n/.test(doc.getText()), "无裸 LF 混入")
  })

  it("同文件批次 [replace_all, 非 replace_all]（编辑器路径 LF）：第二条精确命中（#1 回归）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const doc = makeDoc("alpha\nbeta\nalpha\ngamma\n", "d:\\proj\\ra-lf.txt")
    vscode.workspace.textDocuments.push(doc)
    const r = await editTool.execute({
      edits: [
        { path: "ra-lf.txt", old_string: "alpha", new_string: "A", replace_all: true },
        { path: "ra-lf.txt", old_string: "A\ngamma", new_string: "A\nGAMMA" },
      ],
    }, { cwd: "d:\\proj" })
    assert.match(r, /Replaced 2 occurrence/)
    assert.equal(doc.getText(), "A\nbeta\nA\nGAMMA\n", "LF 路径第二条精确命中")
  })

})

// §18.14 split (from test/tools.test.mjs): edit-tool domain — literal contract / hashline / EOL semantics / tool-description batch guidance

describe("edit — literal replacement contract (no $-interpolation)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("new_string with $& is inserted LITERALLY (regression: string replace corrupted files)", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "a.mjs")
    writeFileSync(f, "const x = 1\n")
    const marker = "const re = s.replace(/a/g, " + String.fromCharCode(34, 36, 38, 34) + ")"
    const r = await editTool.execute({ path: "a.mjs", old_string: "const x = 1", new_string: marker, replace_all: true }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    assert.equal(readFileSync(f, "utf8"), marker + "\n")
  })

  it("replace_all with $-patterns replaces every occurrence literally", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "b.mjs")
    writeFileSync(f, "a\na\n")
    const marker = ["$", "&", "$", "1"].join("")
    const r = await editTool.execute({ path: "b.mjs", old_string: "a", new_string: marker, replace_all: true }, ctx())
    assert.match(r, /Replaced 2 occurrence/)
    assert.equal(readFileSync(f, "utf8"), marker + "\n" + marker + "\n")
  })
})

describe("hashline_edit — content-hash addressing (ported from CLI)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("replaces a single line by hash", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "a.txt")
    writeFileSync(f, "line one\nline two\nline three\n")
    const h = hashLine("line two")
    const r = await hashlineEditTool.execute({ path: "a.txt", old_hashes: [h], new_content: "replaced" }, ctx())
    assert.match(r, /replaced 1 line\(s\) at L2/)
    assert.equal(readFileSync(f, "utf8"), "line one\nreplaced\nline three\n")
  })

  it("replaces a contiguous block by hash sequence", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "b.txt")
    writeFileSync(f, "a\nb\nc\nd\n")
    const r = await hashlineEditTool.execute({
      path: "b.txt",
      old_hashes: [hashLine("b"), hashLine("c")],
      new_content: "x\ny",
    }, ctx())
    assert.match(r, /replaced 2 line\(s\) at L2 with 2 line\(s\)/)
    assert.equal(readFileSync(f, "utf8"), "a\nx\ny\nd\n")
  })

  it("reports missing hash sequence with current hashes", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "c.txt")
    writeFileSync(f, "only\n")
    await assert.rejects(
      () => hashlineEditTool.execute({ path: "c.txt", old_hashes: ["deadbeef00aa"], new_content: "x" }, ctx()),
      /Hash sequence not found/,
    )
  })

  it("rejects ambiguous matches with position details", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "d.txt")
    writeFileSync(f, "same\nsame\nsame\n")
    await assert.rejects(
      () => hashlineEditTool.execute({ path: "d.txt", old_hashes: [hashLine("same")], new_content: "x" }, ctx()),
      /matches 3 positions/,
    )
  })
})

describe("工具描述 — 批量引导句（§16 D-B2/D-B3，T-B3）", () => {
  it("editTool/applyPatchTool description 含批量引导语义句", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    const d = editTool.description
    assert.ok(d.includes("edits` 数组"), "edit 描述提及 edits 数组批量形态")
    assert.ok(d.includes("原子"), "edit 描述含原子语义")
    assert.ok(d.includes("多文件"), "edit 描述含多文件同批语义")
    const editsParam = editTool.parameters.properties.edits.description
    assert.ok(editsParam.includes("prefer one batched call over N single edits"), "edits 参数含批量引导句")
    assert.ok(editsParam.includes("same file"), "edits 参数含同文件多处修改引导")
    const p = applyPatchTool.description
    assert.ok(p.includes("MULTIPLE new files"), "apply_patch 描述含新建多文件语义")
    assert.ok(p.includes("/dev/null"), "apply_patch 描述含 --- /dev/null 新建形态")
  })
})

describe("edit — EOL normalization (CRLF files, LF old_string)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("edit on a CRLF file with LF old_string succeeds (EOL normalization regression)", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "crlf.txt")
    writeFileSync(f, "alpha\r\nbeta\r\ngamma\r\n")
    // Model writes LF — before the fix this failed with "old_string not found"
    const r = await editTool.execute({ path: "crlf.txt", old_string: "beta\ngamma", new_string: "beta\nGAMMA" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    const out = readFileSync(f, "utf8")
    assert.ok(out.includes("beta\r\nGAMMA\r\n"), "replacement applied with the file's CRLF style preserved: " + JSON.stringify(out))
    assert.ok(!out.includes("gamma"), "old word gone")
    assert.ok(!out.includes("alpha\n"), "no whole-file EOL rewrite")
  })

  it("a genuinely absent old_string still reports not found", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "lf.txt")
    writeFileSync(f, "one\ntwo\n")
    const r = await editTool.execute({ path: "lf.txt", old_string: "not-there-at-all", new_string: "x" }, ctx())
    assert.match(r, /old_string not found/)
  })
})

describe("edit tools — EOL semantics + candidates + encoding probe (EDIT-TOOL-EOL, CLI parity)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("F1: edit on pure CRLF file writes back all CRLF, no bare LF", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "a\r\nb\r\nc\r\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "a\nb", new_string: "a\nB" }, ctx())
    assert.match(r, /Replaced 1 occurrence/)
    const out = readFileSync(f, "utf8")
    assert.equal(out, "a\r\nB\r\nc\r\n")
    assert.ok(!/(?<!\r)\n/.test(out), "no bare LF")
  })

  it("F1 regression: edit on LF file keeps LF", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "a\nb\n")
    await editTool.execute({ path: "f.txt", old_string: "a\nb", new_string: "a\nB" }, ctx())
    assert.equal(readFileSync(f, "utf8"), "a\nB\n")
  })

  it("F1: apply_patch on CRLF file writes back all CRLF", async () => {
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "one\r\ntwo\r\nthree\r\n")
    const patch = `--- a/f.txt
+++ b/f.txt
@@ -1,3 +1,3 @@
 one
-two
+TWO
 three
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched f\.txt/)
    assert.equal(readFileSync(f, "utf8"), "one\r\nTWO\r\nthree\r\n")
  })

  it("F1: hashline_edit on CRLF file writes back all CRLF", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "x\r\ny\r\nz\r\n")
    const r = await hashlineEditTool.execute({ path: "f.txt", old_hashes: [hashLine("y")], new_content: "Y" }, ctx())
    assert.match(r, /replaced 1 line\(s\)/)
    assert.equal(readFileSync(f, "utf8"), "x\r\nY\r\nz\r\n")
  })

  it("F2: new file in CRLF-majority directory follows CRLF (write + apply_patch)", async () => {
    const { writeTool } = await import("../src/tools/file.mjs")
    const { applyPatchTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "existing.txt"), "e1\r\ne2\r\n")
    await writeTool.execute({ path: "w.txt", content: "l1\nl2\n" }, ctx())
    assert.equal(readFileSync(join(cwd, "w.txt"), "utf8"), "l1\r\nl2\r\n")
    const patch = `--- /dev/null
+++ b/p.txt
@@ -0,0 +1,2 @@
+n1
+n2
`
    const r = await applyPatchTool.execute({ patch }, ctx())
    assert.match(r, /Patched p\.txt/)
    assert.equal(readFileSync(join(cwd, "p.txt"), "utf8"), "n1\r\nn2\r\n")
  })

  it("F2: new file in LF-majority / empty directory stays LF", async () => {
    const { writeTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "existing.txt"), "e1\ne2\n")
    await writeTool.execute({ path: "w.txt", content: "l1\nl2\n" }, ctx())
    assert.equal(readFileSync(join(cwd, "w.txt"), "utf8"), "l1\nl2\n")
    mkdirSync(join(cwd, "empty"))
    await writeTool.execute({ path: "empty/f.txt", content: "x\ny\n" }, ctx())
    assert.equal(readFileSync(join(cwd, "empty", "f.txt"), "utf8"), "x\ny\n")
  })

  it("F2/F1: write overwriting an existing CRLF file restores CRLF", async () => {
    const { writeTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "old1\r\nold2\r\n")
    await writeTool.execute({ path: "f.txt", content: "new1\nnew2\n" }, ctx())
    assert.equal(readFileSync(f, "utf8"), "new1\r\nnew2\r\n")
  })

  it("boundary: mixed-EOL file (first line LF, later CRLF) restores by first-line LF", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "first\nsecond\r\nthird\r\n")
    await editTool.execute({ path: "f.txt", old_string: "first\nsecond", new_string: "FIRST\nsecond" }, ctx())
    // First-newline rule: whole file written back in the first line's style (LF).
    assert.equal(readFileSync(f, "utf8"), "FIRST\nsecond\nthird\n")
  })

  it("F3: failed edit lists similar lines (line number + preview + score)", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.mjs"), "const timeout = 5000\nfunction start() {\n}\n")
    const r = await editTool.execute({ path: "f.mjs", old_string: "const timeout = 6000", new_string: "x" }, ctx())
    assert.match(r, /old_string not found/)
    assert.match(r, /similar lines/)
    assert.match(r, /L1: const timeout = 5000 \(\d+%\)/)
  })

  it("F3: no candidates when every line is below the 0.5 threshold (noise guard)", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "alpha\nbeta\ngamma\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "xyzzy plugh xyzzard", new_string: "x" }, ctx())
    assert.match(r, /old_string not found/)
    assert.ok(!r.includes("similar lines"), "no candidate block below threshold: " + r)
  })

  it("F3 boundary: multi-line old_string failure scores only line 1, capped at top 3", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    const body = ["wrong first line a", "wrong first line b", "wrong first line c", "wrong first line d", "wrong first line e"].join("\n") + "\n"
    writeFileSync(join(cwd, "f.txt"), body)
    const r = await editTool.execute({
      path: "f.txt",
      old_string: "wrong first line X\nsecond line content\nthird line content",
      new_string: "x",
    }, ctx())
    assert.match(r, /old_string line 1:/)
    const candRows = r.match(/^ {4}L\d+: /gm) || []
    assert.equal(candRows.length, 3, "top 3 cap: " + r)
  })

  it("T14.1.1: single-line old not-found — searched prefix untouched, similar lines top-3 appended after it (§14.1 D14.1.1)", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.mjs"), "const timeout = 5000\nfunction start() {\n}\n")
    const r = await editTool.execute({ path: "f.mjs", old_string: "const timeout = 6000", new_string: "x" }, ctx())
    assert.match(r, /old_string not found/)
    const searched = `  searched: "const timeout = 6000" — use grep to locate the actual content`
    assert.ok(r.includes(searched), "N-14.1a: searched: prefix (with grep suggestion) unchanged: " + r)
    const sim = "  similar lines:"
    const iSearch = r.indexOf(searched)
    const iSim = r.indexOf(sim)
    assert.ok(iSearch >= 0 && iSim > iSearch, "similar lines appended AFTER the searched line: " + r)
    assert.match(r, /\n  similar lines:\n    L1: const timeout = 5000 \(\d+%\)/)
    // batch channel (§14.1 D14.1.1 — CLI parity: the shared not-found error appends
    // candidates in batch edits too, single-line entries included)
    const rb = await editTool.execute({ edits: [{ path: "f.mjs", old_string: "const timeout = 6000", new_string: "x" }] }, ctx())
    assert.match(rb, /edit aborted \(atomic — no files written\): old_string not found/)
    const bSearch = rb.indexOf(`  searched: "const timeout = 6000" — use grep to locate the actual content`)
    const bSim = rb.indexOf("\n  similar lines:\n    L1: const timeout = 5000")
    assert.ok(bSearch >= 0 && bSim > bSearch, "batch not-found carries searched + similar lines after it: " + rb)
  })

  it("T14.1.6: single-line old not-found with no near lines — similar lines block omitted, searched/grep lines kept", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.txt"), "alpha\nbeta\ngamma\n")
    const r = await editTool.execute({ path: "f.txt", old_string: "singular far-fetched needle", new_string: "x" }, ctx())
    assert.match(r, /old_string not found/)
    assert.ok(!r.includes("similar lines"), "zero candidates → whole block omitted: " + r)
    assert.ok(r.includes("searched:") && r.includes("— use grep to locate the actual content"), "searched + grep guidance kept: " + r)
  })

  it("F4: hashline_edit on file containing U+FFFD warns but still executes", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    const f = join(cwd, "f.txt")
    writeFileSync(f, "good line\nbad \uFFFD line\n")
    const r = await hashlineEditTool.execute({ path: "f.txt", old_hashes: [hashLine("good line")], new_content: "replaced line" }, ctx())
    assert.match(r, /replaced 1 line\(s\)/)
    assert.match(r, /U\+FFFD/)
    assert.match(r, /encoding may be corrupted/)
    assert.equal(readFileSync(f, "utf8"), "replaced line\nbad \uFFFD line\n")
  })

  it("F4 regression: clean UTF-8 file produces no warning", async () => {
    const { hashlineEditTool } = await import("../src/tools/file.mjs")
    const { hashLine } = await import("../src/tools/shared.mjs")
    writeFileSync(join(cwd, "f.txt"), "clean\n")
    const r = await hashlineEditTool.execute({ path: "f.txt", old_hashes: [hashLine("clean")], new_content: "done" }, ctx())
    assert.ok(!r.includes("U+FFFD"), "no warning on clean file: " + r)
  })

  it("detectFileEol / joinWithEol / majorityEol / findCandidates — first-newline rule + majority + ranking", async () => {
    const { detectFileEol, joinWithEol, majorityEol, findCandidates } = await import("../src/tools/shared.mjs")
    assert.equal(detectFileEol("a\r\nb\n"), "\r\n")
    assert.equal(detectFileEol("a\nb\r\n"), "\n")
    assert.equal(detectFileEol("no newline"), "\n")
    assert.equal(detectFileEol(""), "\n")
    assert.equal(joinWithEol(["a", "b"], "x\r\ny"), "a\r\nb")
    assert.equal(majorityEol(cwd), "\n") // empty dir → LF
    writeFileSync(join(cwd, "a.txt"), "x\r\n")
    writeFileSync(join(cwd, "b.txt"), "y\r\n")
    writeFileSync(join(cwd, "c.txt"), "z\n")
    assert.equal(majorityEol(cwd), "\r\n")
    const cands = findCandidates(["const timeout = 5000", "unrelated"], "const timeout = 6000")
    assert.equal(cands.length, 1)
    assert.equal(cands[0].line, 1)
    assert.ok(cands[0].score >= 0.5)
    assert.equal(findCandidates(["short"], "a much longer needle that shares nothing").length, 0)
  })

  it("edit §14: old_string not found 结果含 grep 定位建议（T-TF3——D-TF2——单文件 + batch 双路径）", async () => {
    const { editTool } = await import("../src/tools/file.mjs")
    writeFileSync(join(cwd, "f.mjs"), "const a = 1\n", "utf8")
    // 单文件路径
    const r = await editTool.execute({ path: "f.mjs", old_string: "const a = 999", new_string: "x" }, ctx())
    assert.match(r, /old_string not found/)
    assert.match(r, /searched: "const a = 999"/)
    assert.ok(
      r.includes(" — use grep to locate the actual content"),
      "T-TF3: 单文件路径错误含 grep 建议（searched: <fragment> — use grep to locate the actual content）",
    )
    // batch 路径（edits 数组——edit 工具批量形态——同错误族同建议）
    const r2 = await editTool.execute({ edits: [{ path: "f.mjs", old_string: "no-such-content", new_string: "x" }] }, ctx())
    assert.match(r2, /old_string not found/)
    assert.ok(
      r2.includes(" — use grep to locate the actual content"),
      "T-TF3: batch 路径错误同含 grep 建议",
    )
  })
})
