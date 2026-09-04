/**
 * vscode-tools.test.mjs — vscode tool surface — read_image / context / focus / ops tools (file_ops, process, get_current_time).
 *
 * Split from test/tools.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, beforeEach, afterEach } from "node:test"
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

describe("read_image — svg as text source (Kimi 400 session-poisoning regression)", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("svg returns plain-text source (no image_url, JSON envelope absent)", async () => {
    const { readImageTool } = await import("../src/tools/read_image.mjs")
    writeFileSync(join(cwd, "a.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>')
    const out = await readImageTool.execute({ path: "a.svg" }, ctx())
    assert.match(out, /svg source/)
    assert.match(out, /<rect/)
    assert.throws(() => JSON.parse(out), "plain text, not the multimodal JSON envelope")
  })

  it("bmp is rejected with a convert-to-PNG hint", async () => {
    const { readImageTool } = await import("../src/tools/read_image.mjs")
    writeFileSync(join(cwd, "a.bmp"), Buffer.from([66, 77]))
    await assert.rejects(() => readImageTool.execute({ path: "a.bmp" }, ctx()), /Convert it to PNG/)
  })
})

describe("read_image — description lists multimodal model keywords (content assertion)", () => {
  it("mentions every declared vision-capable model keyword (array-driven)", async () => {
    const { readImageTool } = await import("../src/tools/read_image.mjs")
    // 多模态模型清单：未来加新模型时在数组加一项即可；若 description 漏掉数组中任一
    // 模型，此测试必须失败（防手工同步清单滞后）。关键字按 description 实际措辞探测。
    // 2026-08-28：修复 vscode description（Qwen3.7→Qwen3.8 精确化 + 补 GLM-5.3-Flash，
    // 与 CLI read_image.md:8 对齐）后，本数组即两端完整清单 —— 已同步。
    const visionModels = ["Kimi K3", "Qwen3.8", "MiniMax M3", "GLM-5.3-Flash"]
    for (const model of visionModels) {
      assert.ok(
        readImageTool.description.includes(model),
        `read_image description 必须提到 "${model}"（多模态模型清单漏项）— 实际: ${readImageTool.description}`,
      )
    }
  })
})

describe("context — on-demand IDE state snapshot", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("is registered in the builtin registry", async () => {
    const { builtinTools } = await import("../src/tools/index.mjs")
    const names = builtinTools.map((t) => t.name)
    assert.ok(names.includes("context"))
  })

  it("changes slice reports uncommitted files (real repo)", async () => {
    const { contextTool } = await import("../src/tools/context.mjs")
    const { execSync } = await import("node:child_process")
    execSync("git init -q", { cwd })
    execSync('git config user.email t@t && git config user.name t', { cwd })
    writeFileSync(join(cwd, "a.txt"), "x\n")
    execSync("git add a.txt && git commit -qm init", { cwd })
    writeFileSync(join(cwd, "a.txt"), "y\n")
    const r = await contextTool.execute({ what: "changes" }, ctx())
    assert.match(r, /a\.txt/, "modified file listed: " + r)
  })

  it("empty IDE returns a no-context message without crashing", async () => {
    const { contextTool } = await import("../src/tools/context.mjs")
    const r = await contextTool.execute({}, ctx())
    assert.match(r, /no active editor/, "result: " + r)
  })
})

describe("focus — agent-driven cursor/editor navigation", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("is registered in the builtin registry", async () => {
    const { builtinTools } = await import("../src/tools/index.mjs")
    assert.ok(builtinTools.map((t) => t.name).includes("focus"))
  })

  it("opens an existing file and reports the focused position", async () => {
    const { focusTool } = await import("../src/tools/focus.mjs")
    writeFileSync(join(cwd, "f.txt"), "one\ntwo\nthree\n")
    const r = await focusTool.execute({ uri: "f.txt", line: 2, character: 1 }, ctx())
    assert.match(r, /Opened and focused/)
    assert.match(r, /L2:1/)
  })

  it("reports missing files", async () => {
    const { focusTool } = await import("../src/tools/focus.mjs")
    const r = await focusTool.execute({ uri: "nope.txt" }, ctx())
    assert.match(r, /file not found/)
  })
})

describe("ops tools — file_ops / process / get_current_time", () => {
  beforeEach(setup)
  afterEach(cleanup)

  it("file_ops moves / copies / renames", async () => {
    const { fileOpsTool } = await import("../src/tools/ops.mjs")
    writeFileSync(join(cwd, "a.txt"), "hello")
    assert.match(await fileOpsTool.execute({ action: "copy", source: "a.txt", dest: "b.txt" }, ctx()), /Copied/)
    assert.equal(readFileSync(join(cwd, "b.txt"), "utf8"), "hello")
    assert.match(await fileOpsTool.execute({ action: "move", source: "b.txt", dest: "c.txt" }, ctx()), /Moved/)
    assert.equal(existsSync(join(cwd, "b.txt")), false)
    assert.match(await fileOpsTool.execute({ action: "rename", source: "c.txt", dest: "d.txt" }, ctx()), /Renamed/)
    assert.match(await fileOpsTool.execute({ action: "nuke", source: "a.txt", dest: "x.txt" }, ctx()), /action must be/)
  })

  it("get_current_time returns the current date/time", async () => {
    const { getCurrentTimeTool } = await import("../src/tools/ops.mjs")
    const now = await getCurrentTimeTool.execute({}, {})
    assert.match(now, /Date:/)
  })

  it("process lists running processes with PID rows", async () => {
    const { processTool } = await import("../src/tools/ops.mjs")
    const procs = await processTool.execute({ name: "node" }, ctx())
    assert.match(procs, /PID/, "process listing returns PID rows")
  })

  it("sleep is not registered as a builtin tool", async () => {
    const { builtinTools } = await import("../src/tools/index.mjs")
    assert.ok(!builtinTools.map((t) => t.name).includes("sleep"))
  })

  it("ls filter", async () => {
    const { lsTool } = await import("../src/tools/more-file.mjs")
    writeFileSync(join(cwd, "a.js"), "x")
    writeFileSync(join(cwd, "b.txt"), "nothing")

    const ls = await lsTool.execute({ filter: "*.js", path: "." }, ctx())
    assert.match(ls, /a\.js/, "ls filter keeps matching entry")
    assert.doesNotMatch(ls, /b\.txt/, "ls filter excludes non-matching entry")
  })

  it("apply_patch: multiple hunks stay aligned after line-count drift", async () => {
    const { parsePatch, applyHunks } = await import("../src/tools/more-file.mjs")
    // hunk 1 inserts a line (shifts downstream), so hunk 2's @@ line number is stale
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
    const files = parsePatch(patch)
    assert.equal(files.length, 1)
    const lines = ["one", "two", "three", "four", "five", "six", "seven"].slice()
    applyHunks(lines, files[0].hunks, "\n", "f.txt")
    assert.deepStrictEqual(lines, ["one", "oneAndHalf", "two", "three", "four", "five", "sixX", "seven"])
  })

  it("tree: depth-limited directory tree", async () => {
    const { treeTool } = await import("../src/tools/tree.mjs")
    mkdirSync(join(cwd, "src/nested/deep"), { recursive: true })
    writeFileSync(join(cwd, "src/a.js"), "x")
    writeFileSync(join(cwd, "root.txt"), "x")
    const out = await treeTool.execute({ depth: 2 }, ctx())
    assert.match(out, /src\//, "lists directory with trailing slash")
    assert.match(out, /root\.txt/)
    assert.doesNotMatch(out, /deep/, "depth limit excludes deeper levels")
  })
})
