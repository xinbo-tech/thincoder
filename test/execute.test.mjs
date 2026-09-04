/**
 * execute.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { executeTool } from "../src/tools/execute.mjs"


// ---------------------------------------------------------------- execute tool regressions



test("execute: timeout 生效——无限循环脚本在限定时间内返回错误而不是挂死", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec-"))
  try {
    const out = await executeTool.execute({ code: "while (true) {}", timeoutMs: 300 }, { cwd: dir })
    assert.match(out, /Error/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("execute: inline code 是纯净 node ESM——process/import() 全 Node 可用（无伪沙箱）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec2-"))
  try {
    const out = await executeTool.execute({ code: 'const fs = await import("node:fs"); console.log(typeof fs.readFileSync, typeof process.cwd)' }, { cwd: dir })
    assert.equal(out, "function function")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("T-E1: execute inline code 不注入预置全局（readFile/writeFile/glob/grep/log/require 全 undefined——§12 F-E1）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec-tE1-"))
  try {
    const out = await executeTool.execute(
      { code: 'console.log(typeof readFile, typeof writeFile, typeof glob, typeof grep, typeof log, typeof require)' },
      { cwd: dir },
    )
    assert.equal(out, "undefined undefined undefined undefined undefined undefined")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("T-E4: execute inline code 调用已删助手（readFile）→ ReferenceError 明确失败（不静默）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec-tE4-"))
  try {
    const out = await executeTool.execute({ code: 'readFile("x.txt")' }, { cwd: dir })
    assert.match(out, /ReferenceError/)
    assert.match(out, /readFile is not defined/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("T-E2: execute 描述不再宣称预置全局 + 含文件操作路由句（§12 F-E2——absence + presence 双断言）", () => {
  const mdDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "tools")
  const md = readFileSync(join(mdDir, "execute.md"), "utf8")
  const codeParam = executeTool.parameters.properties.code.description
  const surfaces = { "execute.md": md, "execute 工具 description": executeTool.description, "code 参数 description": codeParam }
  for (const [name, text] of Object.entries(surfaces)) {
    for (const stale of ["Globals:", "readFile(path)", "writeFile(path, content)", "prelude"]) {
      assert.ok(!text.includes(stale), `${name} 仍含 prelude 预置声明 "${stale}"`)
    }
    assert.ok(text.includes("read/ls/glob/grep/write/edit"), `${name} 缺文件操作路由句（read/ls/glob/grep/write/edit 专用工具）`)
    assert.ok(text.includes("no globals are injected") || text.includes("no preloaded"), `${name} 缺纯净 ESM 声明`)
  }
})



test("execute: 原生 fs 读取 + 正则过滤（grep 助手退役后同语义的 node 实现——D-E5）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec3-"))
  writeFileSync(join(dir, "f.txt"), "hello\nworld\n")
  try {
    const out = await executeTool.execute({
      code: 'const { readFileSync } = await import("node:fs"); const ls = readFileSync("f.txt", "utf8").split("\\n"); console.log(ls.map((l, i) => `${i + 1}: ${l}`).filter((x) => /wor/.test(x)).join(","))',
    }, { cwd: dir })
    assert.equal(out, "2: world")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("execute: 顶层 await + import() 项目 ESM + console + filter", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec4-"))
  try {
    writeFileSync(join(dir, "mod.mjs"), 'export const name = "mod"\n')
    const imp = await executeTool.execute({ code: 'const m = await import("./mod.mjs"); console.log(m.name)' }, { cwd: dir })
    assert.equal(imp, "mod")

    const filt = await executeTool.execute({ code: 'console.log("a")\nconsole.log("b")', filter: "a" }, { cwd: dir })
    assert.equal(filt, "a")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("execute: scriptFile 跑 workspace 脚本文件 + nodeArgs(--check) + 越界（外部文件）正常执行（§10.1 T-e-3 语义改）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec-sf-"))
  const ext = mkdtempSync(join(tmpdir(), "thincoder-exec-ext-"))
  try {
    writeFileSync(join(dir, "hello.mjs"), 'console.log("hello from script")\n')
    const out = await executeTool.execute({ scriptFile: "hello.mjs" }, { cwd: dir })
    assert.equal(out, "hello from script")

    writeFileSync(join(dir, "good.mjs"), "const x = 1\n")
    // nodeArgs(--check)：语法校验（好文件无输出即通过；坏文件报 SyntaxError）。用 --check 而非 --test——
    // 嵌套 node --test（测试套件内再跑 node --test）输出为空，属测试环境伪影，真实场景正常。
    const good = await executeTool.execute({ scriptFile: "good.mjs", nodeArgs: ["--check"] }, { cwd: dir })
    assert.equal(good, "(no output)")
    writeFileSync(join(dir, "bad.mjs"), "const x = \n")
    const badSyntax = await executeTool.execute({ scriptFile: "bad.mjs", nodeArgs: ["--check"] }, { cwd: dir })
    assert.match(badSyntax, /SyntaxError|Unexpected/)

    // T-e-3 语义改（TOOLS.md §10.1）：scriptFile 指向 workspace 外 → 正常执行（不再报错拒绝）
    writeFileSync(join(ext, "external.mjs"), 'console.log("external script")\n')
    const extOut = await executeTool.execute({ scriptFile: join(relative(dir, ext), "external.mjs") }, { cwd: dir })
    assert.equal(extOut, "external script")

    const neither = await executeTool.execute({}, { cwd: dir })
    assert.match(neither, /either code or scriptFile/)
    const bad = await executeTool.execute({ scriptFile: "hello.mjs", nodeArgs: ["--eval", "1"] }, { cwd: dir })
    assert.match(bad, /not allowed/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(ext, { recursive: true, force: true })
  }
})
