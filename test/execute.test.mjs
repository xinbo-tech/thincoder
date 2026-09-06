/**
 * execute.test.mjs — JS execution tool tests (VS Code port).
 * Run: node --test test/execute.test.mjs
 */
import { describe, it, before, after } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { executeTool } from "../src/tools/execute.mjs"

let tmpDir
const ctx = () => ({ cwd: tmpDir })

before(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "thincoder-exec-"))
  mkdirSync(join(tmpDir, "sub"), { recursive: true })
  writeFileSync(join(tmpDir, "a.txt"), "line one\nline two\nline three\n")
  writeFileSync(join(tmpDir, "sub", "b.js"), "export const x = 1\n")
})

after(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

async function run(code, extra = {}) {
  return executeTool.execute({ code, ...extra }, ctx())
}

describe("execute — pure node ESM (no preloaded helpers, TOOLS.md §12)", () => {
  it("runs simple code and returns console output", async () => {
    const out = await run('console.log("hello", 1 + 1)')
    assert.equal(out, "hello 2")
  })

  it("returns (no output) when nothing is logged", async () => {
    const out = await run("const x = 1")
    assert.equal(out, "(no output)")
  })

  it("T-E1: inline code has no injected globals (readFile/writeFile/glob/grep/log/require all undefined)", async () => {
    const out = await run('console.log(typeof readFile, typeof writeFile, typeof glob, typeof grep, typeof log, typeof require)')
    assert.equal(out, "undefined undefined undefined undefined undefined undefined")
  })

  it("T-E4: calling a retired helper (readFile) fails with a clear ReferenceError", async () => {
    const out = await run('readFile("a.txt")')
    assert.match(out, /ReferenceError/)
    assert.match(out, /readFile is not defined/)
  })

  it("T-E2: description claims no preloaded globals and routes file ops to dedicated tools", () => {
    const desc = executeTool.description
    const codeParam = executeTool.parameters.properties.code.description
    for (const [name, text] of Object.entries({ description: desc, "code param description": codeParam })) {
      for (const stale of ["Globals:", "readFile(path)", "writeFile(path, content)", "prelude"]) {
        assert.ok(!text.includes(stale), `${name} still advertises "${stale}"`)
      }
      assert.ok(text.includes("read/ls/glob/grep/write/edit"), `${name} missing file-op routing sentence`)
      assert.ok(text.includes("no globals are injected") || text.includes("no preloaded"), `${name} missing pure-ESM statement`)
    }
  })

  it("native fs import reads a file relative to cwd", async () => {
    const out = await run('const { readFileSync } = await import("node:fs"); console.log(readFileSync("a.txt", "utf8").split("\\n").length)')
    assert.equal(out, "4") // 3 lines + trailing empty
  })

  it("native fs read + regex filter replaces the retired grep helper", async () => {
    const out = await run('const { readFileSync } = await import("node:fs"); const ls = readFileSync("a.txt", "utf8").split("\\n"); console.log(ls.map((l, i) => `${i + 1}: ${l}`).filter((x) => /line t/.test(x)).join("\\n"))')
    assert.equal(out, "2: line two\n3: line three")
  })

  it("composes multiple operations in one script (native fs)", async () => {
    const out = await run(`
      const { readFileSync, readdirSync } = await import("node:fs")
      const files = readdirSync(".").filter((f) => f.endsWith(".txt"))
      let count = 0
      for (const f of files) count += readFileSync(f, "utf8").split("\\n").length
      console.log("files", files.length, "lines", count)
    `)
    assert.match(out, /files \d+ lines \d+/)
    assert(existsSync(join(tmpDir, "a.txt")))
  })
})

describe("execute — full Node access (no fake sandbox)", () => {
  it("process is available", async () => {
    const out = await run('console.log(typeof process, typeof process.cwd)')
    assert.equal(out, "object function")
  })

  it("dynamic import() resolves Node builtins", async () => {
    const out = await run('const { basename } = await import("node:path"); console.log(basename("/a/b.txt"))')
    assert.equal(out, "b.txt")
  })

  it("dynamic import() resolves project modules relative to cwd", async () => {
    writeFileSync(join(tmpDir, "lib.mjs"), "export const answer = 42\n")
    const out = await run('const lib = await import("./lib.mjs"); console.log(lib.answer)')
    assert.equal(out, "42")
  })

  it("rejects oversize scripts", async () => {
    const big = "// " + "x".repeat(60_000)
    const out = await run(big)
    assert(out.includes("script too large"))
  })
})

describe("execute — error handling and limits", () => {
  it("reports runtime errors with partial output", async () => {
    const out = await run('console.log("before"); throw new Error("boom")')
    assert(out.includes("before"))
    assert(out.includes("Error: boom"))
  })

  slow("enforces timeout", async () => {
    const out = await run("while (true) {}", { timeoutMs: 200 })
    assert(out.includes("Error"))
  })

  slow("T14.1.4: timeout error carries the retry guidance (larger timeoutMs up to 600000 / bash 120s)", async () => {
    const out = await run("while (true) {}", { timeoutMs: 200 })
    assert.ok(out.includes("script timed out after 200ms"), "actual duration preserved: " + out)
    assert.ok(
      out.includes("retry with a larger timeoutMs (up to 600000) for long scripts, or use bash (default 120s) for shell commands"),
      "T14.1.4: guidance sentence appended: " + out,
    )
  })

  slow("T14.1.5: success / other-error outputs carry no timeout guidance (append-only, zero drift)", async () => {
    assert.equal(await run('console.log("ok")'), "ok", "success output unchanged")
    const err = await run('throw new Error("boom")')
    assert.ok(err.includes("Error: boom"))
    assert.ok(!err.includes("retry with a larger timeoutMs"), "runtime error unchanged: " + err)
  })

  it("accepts an oversized timeoutMs (clamped at 600000/600s) without error", async () => {
    const out = await run('console.log("ok")', { timeoutMs: 999_999_999 })
    assert.equal(out, "ok")
  })
})

describe("execute — async / import / console / workdir / filter", () => {
  before(() => {
    writeFileSync(join(tmpDir, "mod.mjs"), 'export const name = "mod"; export default 7\n')
  })

  it("supports top-level await + dynamic import() of project ESM", async () => {
    const out = await run('const m = await import("./mod.mjs"); console.log(m.name, m.default)')
    assert.equal(out, "mod 7")
  })

  it("console.log writes to output", async () => {
    const out = await run('console.log("c1", 2)')
    assert.equal(out, "c1 2")
  })

  it("throws sync errors and surfaces them via stderr", async () => {
    const out = await run('throw new Error("sync-boom")')
    assert(out.includes("Error: sync-boom"))
  })

  it("workdir runs in a subdirectory", async () => {
    const out = await run('const { readFileSync } = await import("node:fs"); console.log(readFileSync("b.js", "utf8").trim())', { workdir: "sub" })
    assert.equal(out, "export const x = 1")
  })

  it("workdir outside the workspace resolves and runs (bash parity, TOOLS.md §10.1)", async () => {
    // Boundary assertion removed 2026-09-02: paths are resolved, not restricted.
    const out = await run('console.log("x")', { workdir: ".." })
    assert.equal(out, "x")
  })

  it("filter keeps only matching output lines", async () => {
    const out = await run('console.log("alpha")\nconsole.log("beta")\nconsole.log("gamma")', { filter: "beta" })
    assert.equal(out, "beta")
  })

  it("filter never swallows an error", async () => {
    const out = await run('throw new Error("boom")', { filter: "zzz-no-match" })
    assert(out.includes("Error: boom"))
  })

  it("non-numeric / zero timeoutMs falls back to default", async () => {
    assert.equal(await run('console.log("fast")', { timeoutMs: "abc" }), "fast")
    assert.equal(await run('console.log("fast2")', { timeoutMs: 0 }), "fast2")
  })
})

describe("execute — scriptFile (node <file> / nodeArgs)", () => {
  it("runs a workspace script file", async () => {
    writeFileSync(join(tmpDir, "hello.mjs"), 'console.log("hello from script")\n')
    assert.equal(await executeTool.execute({ scriptFile: "hello.mjs" }, ctx()), "hello from script")
  })

  it("nodeArgs(--check): good file silent, bad file SyntaxError", async () => {
    writeFileSync(join(tmpDir, "good.mjs"), "const x = 1\n")
    assert.equal(await executeTool.execute({ scriptFile: "good.mjs", nodeArgs: ["--check"] }, ctx()), "(no output)")
    writeFileSync(join(tmpDir, "bad.mjs"), "const x = \n")
    assert.match(await executeTool.execute({ scriptFile: "bad.mjs", nodeArgs: ["--check"] }, ctx()), /SyntaxError|Unexpected/)
  })

  it("scriptFile outside the workspace runs (bash parity — execute can run any script)", async () => {
    // Boundary rejection removed 2026-09-02 (TOOLS.md §10.1 T-e-3): bash can run
    // arbitrary scripts, so execute scriptFile resolves the path without restriction.
    writeFileSync(join(tmpdir(), "thincoder-outside-escape.mjs"), 'console.log("outside script ran")\n')
    try {
      assert.equal(await executeTool.execute({ scriptFile: "../thincoder-outside-escape.mjs" }, ctx()), "outside script ran")
    } finally {
      rmSync(join(tmpdir(), "thincoder-outside-escape.mjs"), { force: true })
    }
  })

  it("missing code+scriptFile errors; eval-like nodeArgs rejected", async () => {
    assert.match(await executeTool.execute({}, ctx()), /either code or scriptFile/)
    assert.match(await executeTool.execute({ scriptFile: "hello.mjs", nodeArgs: ["--eval", "1"] }, ctx()), /not allowed/)
  })
})
