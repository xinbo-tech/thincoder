/**
 * file-search.test.mjs — grep + glob tools (src/tools/search.mjs), self-contained pure-Node
 * implementation. 2026-09-06: these were switched off `vscode.workspace.findFiles` (whose
 * extension-host backend spawns the bundled ripgrep binary — intermittently ENOENT on this
 * dev box) to a pure Node fs walk (CLI system.mjs approach). These tests run the real tools
 * against a temp dir — no vscode mock needed, the module has zero vscode dependency.
 */

import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { pathToFileURL, fileURLToPath } from "node:url"

const { grepTool, globTool } = await import(
  pathToFileURL(fileURLToPath(new URL("../src/tools/search.mjs", import.meta.url))).href
)

let tmp
const ctx = () => ({ cwd: tmp })

function w(rel, content) {
  const p = join(tmp, rel)
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content)
  return p
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "tc-file-search-"))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe("grepTool — pure-Node recursive search", () => {
  it("finds matches recursively, skipping IGNORED_DIRS (node_modules)", async () => {
    w("a.txt", "hello world\nfoo bar\n")
    w("sub/b.txt", "the quick fox\nfoo baz\n")
    w("node_modules/d.txt", "should be skipped foo\n")
    const out = await grepTool.execute({ pattern: "foo" }, ctx())
    assert.match(out, /a\.txt:2: foo bar/)
    assert.match(out, /sub[\\/]b\.txt:2: foo baz/)
    assert.ok(!out.includes("node_modules"), "must skip IGNORED_DIRS")
  })

  it("glob filter restricts the file set", async () => {
    w("a.txt", "foo\n")
    w("b.md", "foo\n")
    const out = await grepTool.execute({ pattern: "foo", glob: "*.txt" }, ctx())
    assert.match(out, /a\.txt:1: foo/)
    assert.ok(!out.includes("b.md"), "glob=*.txt must exclude .md files")
  })

  it("supports literal + ignoreCase + single-file target", async () => {
    w("a.txt", "Foo BAR\nfoo bar\n")
    const lit = await grepTool.execute({ pattern: "Foo BAR", literal: true }, ctx())
    assert.match(lit, /a\.txt:1: Foo BAR/)
    assert.ok(!lit.includes(":2:"), "literal must not match line 2 (case differs)")
    const ic = await grepTool.execute({ pattern: "foo bar", ignoreCase: true }, ctx())
    assert.match(ic, /:1:/)
    assert.match(ic, /:2:/)
  })

  it("returns '(no matches)' and reports a missing path", async () => {
    w("a.txt", "nothing here\n")
    assert.equal(await grepTool.execute({ pattern: "zzz" }, ctx()), "(no matches)")
    assert.match(await grepTool.execute({ pattern: "x", path: "nope" }, ctx()), /path not found/)
  })
})

describe("globTool — pure-Node recursive glob", () => {
  it("matches ** recursively, skipping IGNORED_DIRS, returns relative paths", async () => {
    w("a.txt", "")
    w("sub/b.js", "")
    w("node_modules/c.js", "")
    const out = await globTool.execute({ pattern: "**/*.txt" }, ctx())
    assert.ok(out.includes("a.txt"), "root file must match")
    const jsOut = await globTool.execute({ pattern: "**/*.js" }, ctx())
    assert.ok(jsOut.includes("sub/b.js"), "nested file must match")
    assert.ok(!jsOut.includes("node_modules"), "must skip IGNORED_DIRS")
  })

  it("single-segment glob does not cross directories; missing path reported", async () => {
    w("top.txt", "")
    w("sub/inner.txt", "")
    const out = await globTool.execute({ pattern: "*.txt" }, ctx())
    assert.ok(out.includes("top.txt"))
    assert.ok(!out.includes("inner.txt"), "single-segment glob must not cross directories")
    assert.match(await globTool.execute({ pattern: "*", path: "nope" }, ctx()), /path not found/)
  })
})
