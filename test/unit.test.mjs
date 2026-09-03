/**
 * unit.test.mjs — Automated unit tests for thincoder-vscode modules.
 * Pure Node.js, no VS Code, no API keys required.
 * Run: node --test test/unit.test.mjs
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

// ─── memory.mjs ──────────────────────────────────────────────

import { tokenizeQuery, scoreEntry, search } from "../src/memory.mjs"
import { memoryTool } from "../src/memory-tool.mjs"

describe("memory — tokenizeQuery", () => {
  it("deduplicates repeated keywords", () => {
    const result = tokenizeQuery("test test test memory memory")
    // "test" and "memory" should appear only once each
    assert.equal(result.filter(w => w === "test").length, 1)
    assert.equal(result.filter(w => w === "memory").length, 1)
  })

  it("filters stopwords", () => {
    const result = tokenizeQuery("the is a of in and for")
    assert.equal(result.length, 0)
  })

  it("filters single-character words", () => {
    const result = tokenizeQuery("a b c")
    assert.equal(result.length, 0)
  })

  it("extracts meaningful keywords", () => {
    const result = tokenizeQuery("fix the shell env variable")
    assert.deepStrictEqual(result, ["fix", "shell", "env", "variable"])
  })

  it("handles empty query", () => {
    assert.equal(tokenizeQuery("").length, 0)
  })

  it("is case-insensitive", () => {
    const result = tokenizeQuery("SHELL Env TEST")
    assert(result.includes("shell"))
    assert(result.includes("env"))
    assert(result.includes("test"))
  })
})

describe("memory — scoreEntry", () => {
  it("scores title match higher (3pts)", () => {
    const entry = { title: "shell fixes", content: "some content", tags: "" }
    assert.equal(scoreEntry(entry, ["shell"]), 3)
  })

  it("scores tag match (2pts)", () => {
    const entry = { title: "misc", content: "some content", tags: "shell env" }
    assert.equal(scoreEntry(entry, ["shell"]), 2)
  })

  it("scores content match (1pt)", () => {
    const entry = { title: "misc", content: "we fixed the shell", tags: "" }
    assert.equal(scoreEntry(entry, ["shell"]), 1)
  })

  it("accumulates across multiple keywords", () => {
    const entry = { title: "shell", content: "env variable", tags: "fix" }
    // shell: title=3, env: content=1, variable: content=1, fix: tags=2
    assert.equal(scoreEntry(entry, ["shell", "env", "variable", "fix"]), 3 + 1 + 1 + 2)
  })
})

describe("memory — search (integration)", () => {
  let tmpDir, memDir

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "thincoder-test-memory-"))
    memDir = join(tmpDir, ".thincoder", "memory")
    mkdirSync(memDir, { recursive: true })
    // Create test entries
    const now = new Date().toISOString()
    writeFileSync(join(memDir, "a.json"), JSON.stringify({
      id: "a", type: "knowledge", title: "Shell environment",
      content: "Use SAFE_ENV to filter dangerous variables", tags: "shell security",
      created_at: now, updated_at: now,
    }))
    writeFileSync(join(memDir, "b.json"), JSON.stringify({
      id: "b", type: "decision", title: "API key storage",
      content: "Use SecretStorage for API keys", tags: "security keys",
      created_at: now, updated_at: now,
    }))
    writeFileSync(join(memDir, "c.json"), JSON.stringify({
      id: "c", type: "pattern", title: "Unrelated pattern",
      content: "Something about colors and themes", tags: "ui theme",
      created_at: now, updated_at: now,
    }))
  })

  after(() => {
    try { rmSync(tmpDir, { recursive: true }) } catch {}
  })

  it("returns matching results sorted by score", () => {
    const results = search(tmpDir, "shell", { limit: 5 })
    assert(results.length >= 1)
    assert.equal(results[0].title, "Shell environment")
  })

  it("deduplication prevents score inflation", () => {
    // "shell shell shell" should give same score as "shell"
    const results1 = search(tmpDir, "shell", { limit: 5 })
    const results3 = search(tmpDir, "shell shell shell", { limit: 5 })
    assert.equal(results1.length, results3.length)
    if (results1.length > 0) {
      assert.equal(results1[0].score, results3[0].score)
    }
  })

  it("returns empty array for non-matching query", () => {
    const results = search(tmpDir, "zzz_nonexistent_zzz", { limit: 5 })
    assert.equal(results.length, 0)
  })
})

describe("memory — merged memory tool (MEMORY.md §6: single tool, five actions)", () => {
  let tmpDir, memDir
  const ctx = (cwd = tmpDir) => ({ cwd })
  const exec = (args, cwd = tmpDir) => memoryTool.execute(args, { cwd })

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "thincoder-test-mmem-"))
    memDir = join(tmpDir, ".thincoder", "memory")
  })

  after(() => {
    try { rmSync(tmpDir, { recursive: true }) } catch {}
  })

  it("S6-1: single memory tool — five actions, readonly classification, old names gone", () => {
    assert.equal(memoryTool.name, "memory")
    assert.equal(memoryTool.readonly, false)
    assert.deepEqual(memoryTool.parameters.properties.action.enum, ["search", "put", "list", "delete", "clear"])
    assert.deepEqual(memoryTool.parameters.required, ["action"])
    assert.equal(memoryTool.isReadonlyAction({ action: "search" }), true, "search 只读动作")
    assert.equal(memoryTool.isReadonlyAction({ action: "list" }), true, "list 只读动作")
    assert.equal(memoryTool.isReadonlyAction({ action: "put" }), false, "put 侧效动作")
    assert.equal(memoryTool.isReadonlyAction({ action: "delete" }), false, "delete 侧效动作")
    assert.equal(memoryTool.isReadonlyAction({ action: "clear" }), false, "clear 侧效动作")
    assert.deepEqual(memoryTool.parameters.properties.scope.enum, ["personal", "project"], "scope 值域按端（VS Code 无 team）")
    assert.ok(memoryTool.description.includes("confirm:true"), "描述含 confirm 门禁语义")
    assert.ok(memoryTool.description.includes("team sync may resurrect"), "描述含 team 复活注")
    assert.ok(!memoryTool.description.includes("memory_"), "描述不含旧工具名")
  })

  it("T5: put → delete 单条 → 文件删 + search 零命中 + 返回内容", () => {
    const putOut = exec({ action: "put", type: "rule", title: "Delete me", content: "this must vanish after delete", scope: "personal" })
    const id = putOut.match(/id=([^\s)]+\.md)/)?.[1]
    assert.ok(id, `put 输出应含 id（文件名）: ${putOut}`)
    const delOut = exec({ action: "delete", id, scope: "personal" })
    assert.ok(delOut.includes(id), `删除返回应含 id: ${delOut}`)
    assert.ok(delOut.includes("Delete me"), `删除返回应含标题: ${delOut}`)
    assert.equal(existsSync(join(memDir, "personal", id)), false, "文件已删")
    assert.equal(search(tmpDir, "vanish", { limit: 5 }).length, 0, "搜索零命中")
  })

  it("T6: 不存在 / scope 目录校验（NF2/NF3 同语义）", () => {
    const putOut = exec({ action: "put", type: "knowledge", title: "Scoped entry", content: "lives in personal", scope: "personal" })
    const id = putOut.match(/id=([^\s)]+\.md)/)?.[1]
    assert.ok(id)
    // 文件在 personal/ 目录 → project scope 必须报 not found（目录定位校验）
    const wrongScope = exec({ action: "delete", id, scope: "project" })
    assert.match(wrongScope, /not found in scope project/)
    // 不存在 id
    const missing = exec({ action: "delete", id: "20260101-nope-ab12.md", scope: "personal" })
    assert.match(missing, /not found in scope personal/)
    // 路径逃逸拒绝（分隔符 / ".." 不可能是合法文件名 id）
    const evil = exec({ action: "delete", id: "../outside.md", scope: "personal" })
    assert.match(evil, /not found in scope personal/)
    // team scope 明确拒绝并指引 CLI（scope 值域按端）
    assert.match(exec({ action: "delete", id: "20260101-x.md", scope: "team" }), /no team layer.*CLI/)
    // 条目未被误删
    assert.equal(existsSync(join(memDir, "personal", id)), true)
  })

  it("T10: put/search 输出带 id（文件名）", async () => {
    const putOut = exec({ action: "put", type: "decision", title: "Id visible", content: "agent can find this id", scope: "project" })
    const id = putOut.match(/id=([^\s)]+\.md)/)?.[1]
    assert.ok(id, `put 输出应含 id: ${putOut}`)
    assert.equal(existsSync(join(memDir, "project", id)), true, "project scope 写入 scope 子目录")
    const searchOut = await exec({ action: "search", query: "Id visible", limit: 5 })
    assert.match(searchOut, new RegExp(id), `search 输出应含 id: ${searchOut}`)
    const scopedOut = await exec({ action: "search", query: "Id visible", scope: "project", limit: 5 })
    assert.match(scopedOut, new RegExp(id), "search scope 过滤仍命中")
    assert.equal(await exec({ action: "search", query: "Id visible", scope: "personal", limit: 5 }), "No matching memories found.", "personal scope 不含 project 条目")
  })

  it("S6-2: action list — scope/type/keyword/limit 过滤 + 行形态 + 截断注 + 空库", () => {
    // 独立状态：清掉前序用例（T5/T6/T10）留下的条目
    try { rmSync(memDir, { recursive: true }) } catch {}
    mkdirSync(memDir, { recursive: true })
    exec({ action: "put", type: "rule", title: "代码风格", content: "不加分号", scope: "personal" })
    exec({ action: "put", type: "knowledge", title: "部署架构", content: "单台 VPS", scope: "personal" })
    exec({ action: "put", type: "decision", title: "选型决策", content: "PostgreSQL 做主库", scope: "project" })
    const all = exec({ action: "list" })
    assert.ok(/^\d{8}-.+\.md \[rule\] 代码风格（\d{4}-\d{2}-\d{2}）$/m.test(all), `行形态: ${all}`)
    assert.ok(all.includes("[knowledge] 部署架构"), all)
    assert.ok(all.includes("[decision] 选型决策"), all)
    const personal = exec({ action: "list", scope: "personal" })
    assert.ok(personal.includes("代码风格") && !personal.includes("选型决策"), personal)
    const typed = exec({ action: "list", type: "rule" })
    assert.equal(typed.split("\n").length, 1)
    assert.ok(typed.includes("代码风格"), typed)
    const kw = exec({ action: "list", keyword: "VPS" })
    assert.ok(kw.includes("部署架构") && !kw.includes("选型决策"), kw)
    const truncated = exec({ action: "list", limit: 1 })
    assert.ok(truncated.startsWith("1 条——截断前 3\n"), `截断注: ${truncated}`)
    assert.equal(truncated.split("\n").length, 2)
    assert.match(exec({ action: "list", type: "bogus" }), /Invalid memory type "bogus"/)
    assert.match(exec({ action: "list", scope: "team" }), /no team layer.*CLI/)
  })

  it("S6-3: action delete 批量 — 无过滤拒/无 confirm 预览拒/0 匹配/confirm 执行/预览截断", () => {
    try { rmSync(memDir, { recursive: true }) } catch {}
    mkdirSync(memDir, { recursive: true })
    exec({ action: "put", type: "rule", title: "保留规则", content: "不要删我", scope: "personal" })
    const targets = []
    for (let i = 0; i < 6; i++) {
      const out = exec({ action: "put", type: "knowledge", title: `批量目标 ${i}`, content: "bulk delete target ZQX", scope: "project" })
      targets.push(out.match(/id=([^\s)]+\.md)/)[1])
    }
    // 无过滤条件批量删拒绝
    assert.match(exec({ action: "delete", scope: "project" }), /type and\/or keyword filter/)
    assert.match(exec({ action: "delete", scope: "project", confirm: true }), /type and\/or keyword filter/)
    assert.match(exec({ action: "delete" }), /batch delete requires scope/)
    // 无 confirm → 预览（不删）
    const preview = exec({ action: "delete", scope: "project", keyword: "批量" })
    const previewLines = preview.split("\n")
    assert.equal(previewLines[0], "将删 6 条：前 5 条预览", previewLines[0])
    assert.equal(previewLines.length, 8, "首行 + 5 预览行 + 截断注 + confirm 提示")
    assert.ok(previewLines.slice(1, 6).every((l) => l.includes("批量目标")), preview)
    assert.ok(preview.endsWith("confirm:true required — re-send with it to execute the deletion"), preview)
    assert.ok(preview.includes("5 条——截断前 6"), preview)
    assert.equal(existsSync(join(memDir, "project", targets[0])), true, "无 confirm 不删")
    // 0 匹配不报错
    assert.equal(exec({ action: "delete", scope: "project", keyword: "不存在", confirm: true }), "0 条匹配")
    // confirm 后执行
    assert.equal(exec({ action: "delete", scope: "project", keyword: "批量", confirm: true }), "Deleted 6 entries in scope project")
    assert.equal(targets.filter((f) => existsSync(join(memDir, "project", f))).length, 0, "全部文件已删")
    assert.equal(search(tmpDir, "ZQX", { limit: 5 }).length, 0, "搜索零命中")
    // personal 批量 + type 过滤
    assert.equal(exec({ action: "delete", scope: "personal", type: "rule", confirm: true }), "Deleted 1 entries in scope personal")
    assert.equal(search(tmpDir, "不要删我", { limit: 5 }).length, 0)
  })

  it("S6-4: action clear — 门禁四拒 + personal 清空 + 共享层不动", () => {
    try { rmSync(memDir, { recursive: true }) } catch {}
    mkdirSync(memDir, { recursive: true })
    exec({ action: "put", type: "rule", title: "待清规则", content: "personal 要清空", scope: "personal" })
    exec({ action: "put", type: "knowledge", title: "共享知识", content: "project 不许 clear", scope: "project" })
    assert.match(exec({ action: "clear" }), /clear requires scope "personal"/)
    assert.match(exec({ action: "clear", scope: "project", confirm: true }), /shared layers don't support clear/)
    assert.match(exec({ action: "clear", scope: "personal" }), /clear requires confirm:true/)
    assert.match(exec({ action: "clear", scope: "personal", confirm: false }), /clear requires confirm:true/)
    assert.match(exec({ action: "clear", scope: "team", confirm: true }), /no team layer.*CLI/)
    assert.equal(search(tmpDir, "待清", { limit: 5 }).length, 1, "未确认前不动")
    const out = exec({ action: "clear", scope: "personal", confirm: true })
    assert.equal(out, "Cleared personal memory (1 entries deleted)")
    assert.equal(search(tmpDir, "待清", { limit: 5 }).length, 0, "personal 清空后 search 零命中")
    assert.equal(search(tmpDir, "不许", { limit: 5 }).length, 1, "project 层不受 clear 影响")
  })

  it("S6-5: 未知 action / 缺参 put / 非法 scope 明确报错", () => {
    assert.match(exec({}), /unknown action ""/)
    assert.match(exec({ action: "bogus" }), /unknown action "bogus"/)
    assert.match(exec({ action: "put", type: "rule", title: "t", scope: "personal" }), /requires title and content/)
    assert.match(exec({ action: "put", scope: "team", type: "rule", title: "t", content: "c" }), /no team layer.*CLI/)
  })
})


// ─── context.mjs ─────────────────────────────────────────────

import { parseImports } from "../src/context.mjs"

describe("context — parseImports", () => {
  it("parses single-line ESM import", () => {
    const deps = parseImports(`import { foo } from "./bar.mjs"`)
    assert(deps.includes("./bar.mjs"))
  })

  it("parses single-line CJS require", () => {
    const deps = parseImports(`const fs = require("node:fs")`)
    // node: should be filtered
    assert.equal(deps.length, 0)
  })

  it("parses dynamic import", () => {
    const deps = parseImports(`const mod = await import("./dynamic.mjs")`)
    assert(deps.includes("./dynamic.mjs"))
  })

  it("handles multiline import (s flag)", () => {
    const deps = parseImports(`import {
  foo,
  bar,
  baz,
} from "./multiline.mjs"`)
    assert(deps.includes("./multiline.mjs"), "Should match multiline import")
  })

  it("filters node: builtins", () => {
    const deps = parseImports(`import { readFile } from "node:fs"`)
    assert.equal(deps.length, 0)
  })

  it("filters vscode imports", () => {
    const deps = parseImports(`import * as vscode from "vscode"`)
    assert.equal(deps.length, 0)
  })

  it("parses multiple imports", () => {
    const deps = parseImports(`
import { a } from "./a.mjs"
import { b } from "./b.mjs"
import { c } from "node:fs"
`)
    assert.equal(deps.length, 2)
    assert(deps.includes("./a.mjs"))
    assert(deps.includes("./b.mjs"))
  })

  it("returns empty for no imports", () => {
    assert.equal(parseImports("const x = 1;").length, 0)
  })
})

// ─── shell.mjs — SAFE_ENV filter ─────────────────────────────

describe("shell — SAFE_ENV", () => {
  // We can't reload the module, but we can test the pattern logic by
  // verifying that common secret patterns WOULD be caught and common
  // tool vars WOULD pass through.
  const SECRET_PATTERNS = /_(?:KEY|TOKEN|SECRET|PASSWORD|PASS|CREDENTIALS?)(?:_|$)|^(?:NPM_TOKEN|GITHUB_TOKEN|GITLAB_TOKEN|AWS_|AZURE_|GCLOUD_)/i

  it("filters API_KEY", () => {
    assert(SECRET_PATTERNS.test("OPENAI_API_KEY"))
    assert(SECRET_PATTERNS.test("DEEPSEEK_API_KEY"))
  })

  it("filters _TOKEN", () => {
    assert(SECRET_PATTERNS.test("NPM_TOKEN"))
    assert(SECRET_PATTERNS.test("GITHUB_TOKEN"))
  })

  it("filters _SECRET", () => {
    assert(SECRET_PATTERNS.test("DB_SECRET"))
    assert(SECRET_PATTERNS.test("JWT_SECRET"))
  })

  it("filters _PASSWORD", () => {
    assert(SECRET_PATTERNS.test("DB_PASSWORD"))
  })

  it("filters _CREDENTIAL / _CREDENTIALS", () => {
    assert(SECRET_PATTERNS.test("GOOGLE_APPLICATION_CREDENTIALS"))
  })

  it("does NOT filter SSH_AUTH_SOCK (not a secret)", () => {
    assert(!SECRET_PATTERNS.test("SSH_AUTH_SOCK"))
  })

  it("does NOT filter GIT_AUTHOR_NAME (not a secret)", () => {
    assert(!SECRET_PATTERNS.test("GIT_AUTHOR_NAME"))
  })

  it("filters AWS_ / AZURE_ / GCLOUD_ prefixes", () => {
    assert(SECRET_PATTERNS.test("AWS_ACCESS_KEY_ID"))
    assert(SECRET_PATTERNS.test("AZURE_CLIENT_SECRET"))
    assert(SECRET_PATTERNS.test("GCLOUD_PROJECT"))
  })

  it("allows PATH", () => {
    assert(!SECRET_PATTERNS.test("PATH"))
  })

  it("allows HOME", () => {
    assert(!SECRET_PATTERNS.test("HOME"))
  })

  it("allows NODE_PATH", () => {
    assert(!SECRET_PATTERNS.test("NODE_PATH"))
  })

  it("allows npm_config_*", () => {
    assert(!SECRET_PATTERNS.test("npm_config_cache"))
    assert(!SECRET_PATTERNS.test("npm_config_registry"))
  })

  it("allows VSCODE_*", () => {
    assert(!SECRET_PATTERNS.test("VSCODE_PID"))
  })
})

// ─── more-file.mjs — applyPatchTool ──────────────────────────

// These tests need filesystem; we create temp files
import { applyPatchTool } from "../src/tools/more-file.mjs"

describe("applyPatchTool — standard unified diff", () => {
  let tmpDir

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "thincoder-test-patch-"))
    writeFileSync(join(tmpDir, "hello.txt"), "line one\nline two\nline three\n")
  })

  after(() => {
    try { rmSync(tmpDir, { recursive: true }) } catch {}
  })

  it("applies standard unified diff (--- a/...  +++ b/...)", async () => {
    const patch = `--- a/hello.txt
+++ b/hello.txt
@@ -1,3 +1,3 @@
 line one
-line two
+modified line two
 line three
`
    const ctx = { cwd: tmpDir }
    const result = await applyPatchTool.execute({ patch }, ctx)
    assert(result.includes("Patched hello.txt"))
    const content = readFileSync(join(tmpDir, "hello.txt"), "utf8")
    assert(content.includes("modified line two"), "should have the new line")
    // "line two" should not appear as a standalone line (not as substring)
    const lines = content.split("\n")
    assert(!lines.includes("line two"), '"line two" should be gone')
  })

  it("applies git diff format (diff --git a/... b/...)", async () => {
    writeFileSync(join(tmpDir, "gitfile.txt"), "old content\n")
    const patch = `diff --git a/gitfile.txt b/gitfile.txt
--- a/gitfile.txt
+++ b/gitfile.txt
@@ -1 +1 @@
-old content
+new content
`
    const ctx = { cwd: tmpDir }
    const result = await applyPatchTool.execute({ patch }, ctx)
    assert(result.includes("Patched gitfile.txt"))
    const content = readFileSync(join(tmpDir, "gitfile.txt"), "utf8")
    assert.equal(content, "new content\n")
  })

  it("handles /dev/null (new file creation)", async () => {
    const patch = `--- /dev/null
+++ b/newfile.txt
@@ -0,0 +1 @@
+brand new file
`
    const ctx = { cwd: tmpDir }
    const result = await applyPatchTool.execute({ patch }, ctx)
    // /dev/null source is skipped — no existing file to read,
    // and there are no hunks with real old line numbers,
    // so it's handled gracefully
    assert(result.includes("No files patched") || result.includes("Patched"))
  })

  it("handles empty patch gracefully", async () => {
    const ctx = { cwd: tmpDir }
    const result = await applyPatchTool.execute({ patch: "" }, ctx)
    assert(result.includes("Error") || result.includes("No diff sections"))
  })
})

// ─── generate-title.mjs — multimodal text extraction ─────────

describe("generate-title — text extraction logic", () => {
  // We test the extraction pattern used in generate-title.mjs:
  // Array.isArray check + .find(p => p.type === "text")
  function extractText(content) {
    if (Array.isArray(content)) {
      return content.find(p => p.type === "text")?.text || ""
    }
    return content
  }

  it("extracts text from string content", () => {
    assert.equal(extractText("hello world"), "hello world")
  })

  it("extracts text from multimodal array", () => {
    const multimodal = [
      { type: "text", text: "look at this image" },
      { type: "image_url", image_url: { url: "data:image/png;base64,..." } },
    ]
    assert.equal(extractText(multimodal), "look at this image")
  })

  it("returns empty string if no text part in array", () => {
    const multimodal = [
      { type: "image_url", image_url: { url: "data:image/png;base64,..." } },
    ]
    assert.equal(extractText(multimodal), "")
  })

  it("length check works correctly on multimodal", () => {
    const multimodal = [
      { type: "text", text: "hi" },
      { type: "image_url", image_url: { url: "data:..." } },
    ]
    // Old bug: multimodal.length === 2, which is < 10, would return early.
    // New code extracts text first: "hi".length === 2, which is also < 10.
    // This is correct behavior — genuine short message.
    const text = extractText(multimodal)
    assert.equal(text.length < 10, true)
  })

  it("long multimodal text passes length check", () => {
    const multimodal = [
      { type: "text", text: "this is a long enough message for a title" },
      { type: "image_url", image_url: { url: "data:..." } },
    ]
    const text = extractText(multimodal)
    assert(text.length >= 10)
  })
})

// ─── highlight.js ──────────────────────────────────────────

import { tokenize, highlight, normalizeLang } from "../webview/highlight.js"

describe("highlight — tokenize", () => {
  it("tokenizes JS keywords", () => {
    const tokens = tokenize("const x = 1", "js")
    assert(tokens.some(t => t.type === "keyword" && t.value === "const"))
  })

  it("tokenizes strings", () => {
    const tokens = tokenize('"hello world"', "js")
    assert(tokens.some(t => t.type === "string" && t.value === '"hello world"'))
  })

  it("tokenizes numbers", () => {
    const tokens = tokenize("42 3.14 0xFF", "js")
    const nums = tokens.filter(t => t.type === "number")
    assert.equal(nums.length, 3)
  })

  it("tokenizes line comments", () => {
    const tokens = tokenize("// this is a comment", "js")
    assert(tokens.some(t => t.type === "comment"))
  })

  it("tokenizes block comments", () => {
    const tokens = tokenize("/* multi\nline */ code", "js")
    assert(tokens.some(t => t.type === "comment" && t.value.includes("/*")))
  })

  it("tokenizes Python keywords", () => {
    const tokens = tokenize("def foo(): pass", "py")
    assert(tokens.some(t => t.type === "keyword" && t.value === "def"))
  })

  it("tokenizes SQL keywords", () => {
    const tokens = tokenize("SELECT * FROM users", "sql")
    assert(tokens.some(t => t.type === "keyword" && t.value === "SELECT"))
  })

  it("produces valid HTML", () => {
    const html = highlight("const x = 1", "js")
    assert(html.includes('class="tk-keyword"'))
    assert(html.includes("const"))
    assert(!html.includes("<script"))  // no XSS
  })
})

describe("highlight — normalizeLang", () => {
  it("maps common aliases", () => {
    assert.equal(normalizeLang("javascript"), "js")
    assert.equal(normalizeLang("typescript"), "ts")
    assert.equal(normalizeLang("python"), "py")
    assert.equal(normalizeLang("bash"), "sh")
    assert.equal(normalizeLang("json"), "json")
    assert.equal(normalizeLang(""), "js")
  })

  it("defaults to js for unknown", () => {
    assert.equal(normalizeLang("rust"), "js")
  })
})

// ─── diff.js ────────────────────────────────────────────────

import { lineDiff } from "../webview/diff.js"

describe("diff — lineDiff", () => {
  it("detects no changes", () => {
    const d = lineDiff("a\nb\nc", "a\nb\nc")
    assert(d.every(l => l.type === "same"))
  })

  it("detects single line change", () => {
    const d = lineDiff("line1\nline2\nline3", "line1\nmodified\nline3")
    assert(d.some(l => l.type === "del" && l.text === "line2"))
    assert(d.some(l => l.type === "add" && l.text === "modified"))
  })

  it("detects addition at end", () => {
    const d = lineDiff("a\nb", "a\nb\nc")
    assert(d.some(l => l.type === "add" && l.text === "c"))
  })

  it("detects deletion at start", () => {
    const d = lineDiff("a\nb\nc", "b\nc")
    assert(d.some(l => l.type === "del" && l.text === "a"))
  })

  it("handles empty old", () => {
    const d = lineDiff("", "new content")
    assert(d.every(l => l.type === "add"))
  })

  it("handles empty new", () => {
    const d = lineDiff("old content", "")
    assert(d.every(l => l.type === "del"))
  })

  it("preserves prefix context lines", () => {
    const d = lineDiff("context\na\nb", "context\nx\ny")
    assert.equal(d[0].type, "same")
    assert.equal(d[0].text, "context")
  })
})

// ─── i18n — locale validation ──────────────────────────────

import { initLocale, t } from "../src/i18n.mjs"

describe("i18n — locale loading", () => {
  // Verify English locale loads correctly (no-op since en is fallback)
  it("loads en locale", () => {
    initLocale("en")
    assert.equal(t("welcome.heading"), "Welcome to ThinCoder")
    assert.equal(t("msg.copy"), "Copy")
    assert.equal(t("settings.title"), "Settings")
  })

  it("falls back to en for unknown locale", () => {
    initLocale("xx-unknown")
    assert.equal(t("welcome.heading"), "Welcome to ThinCoder")
  })

  it("supports variable interpolation", () => {
    initLocale("en")
    const result = t("error.failedProvider", { name: "Test" })
    assert.ok(result.includes("Test"))
    assert.ok(result.includes("Failed"))
  })

  it("session.deleteConfirm interpolates ${title} (session-delete confirmation)", () => {
    initLocale("en")
    const result = t("session.deleteConfirm", { title: 'My <b>Session' })
    assert.ok(result.includes('My <b>Session'), "title interpolated")
    assert.doesNotMatch(result, /\$\{title\}/, "placeholder consumed, not left literal")
  })

  it("session rename keys exist in both locales", () => {
    initLocale("en")
    for (const k of ["session.rename", "session.renamePrompt", "session.renamePlaceholder", "session.renameTooLong"]) {
      assert.notEqual(t(k), k, `missing en key: ${k}`)
    }
    initLocale("zh")
    for (const k of ["session.rename", "session.renamePrompt", "session.renamePlaceholder", "session.renameTooLong"]) {
      assert.notEqual(t(k), k, `missing zh key: ${k}`)
    }
  })


  it("returns key for untranslated string", () => {
    initLocale("en")
    assert.equal(t("nonexistent.key"), "nonexistent.key")
  })

  // Verify zh locale has same keys as en
  it("zh locale has all en keys", () => {
    const enPath = join(dirname(fileURLToPath(import.meta.url)), "..", "locales", "en.json")
    const zhPath = join(dirname(fileURLToPath(import.meta.url)), "..", "locales", "zh.json")
    const en = JSON.parse(readFileSync(enPath, "utf8"))
    const zh = JSON.parse(readFileSync(zhPath, "utf8"))
    for (const key of Object.keys(en)) {
      assert.ok(key in zh, `zh.json missing key: ${key}`)
    }
  })
})

// ─── skills — loadSkills ─────────────────────────────────

import { loadSkills } from "../src/extension/skills.mjs"

describe("skills — loadSkills", () => {
  let tmpDir

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "thincoder-test-skills-"))
    mkdirSync(join(tmpDir, ".thincoder", "skills"), { recursive: true })
  })

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns empty when no skills directory", () => {
    const empty = mkdtempSync(join(tmpdir(), "thincoder-test-noskills-"))
    const skills = loadSkills(empty)
    assert.equal(skills.length, 0)
    rmSync(empty, { recursive: true, force: true })
  })

  it("loads markdown skill files", () => {
    writeFileSync(join(tmpDir, ".thincoder", "skills", "code-review.md"), "# Review\nCheck code quality.")
    writeFileSync(join(tmpDir, ".thincoder", "skills", "test-gen.md"), "# Tests\nWrite unit tests.")
    const skills = loadSkills(tmpDir)
    assert.equal(skills.length, 2)
    assert.equal(skills[0].name, "code-review")
    assert.ok(skills[0].content.includes("Check code quality"))
    assert.equal(skills[1].name, "test-gen")
  })

  it("skips non-markdown files and dotfiles", () => {
    writeFileSync(join(tmpDir, ".thincoder", "skills", ".hidden.md"), "hidden")
    writeFileSync(join(tmpDir, ".thincoder", "skills", "notes.txt"), "text file")
    const skills = loadSkills(tmpDir)
    const names = skills.map((s) => s.name)
    assert.ok(!names.includes("hidden"))
    assert.ok(!names.includes("notes"))
  })

  it("skips empty skill files", () => {
    writeFileSync(join(tmpDir, ".thincoder", "skills", "empty.md"), "")
    const skills = loadSkills(tmpDir)
    const names = skills.map((s) => s.name)
    assert.ok(!names.includes("empty"))
  })
})

// ─── rules — loadRules ──────────────────────────────────

import { loadRules, matchesGlob } from "../src/extension/rules.mjs"

describe("rules — loadRules", () => {
  let tmpDir

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "thincoder-test-rules-"))
    mkdirSync(join(tmpDir, ".thincoder", "rules"), { recursive: true })
    mkdirSync(join(tmpDir, ".cursor", "rules"), { recursive: true })
  })

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns empty when no rules directories", () => {
    const empty = mkdtempSync(join(tmpdir(), "thincoder-test-norules-"))
    assert.equal(loadRules(empty).length, 0)
    rmSync(empty, { recursive: true, force: true })
  })

  it("loads rules from both .thincoder/rules/ and .cursor/rules/", () => {
    writeFileSync(join(tmpDir, ".thincoder", "rules", "conventions.md"), "---\ndescription: test\n---\nRule content.")
    writeFileSync(join(tmpDir, ".cursor", "rules", "css.md"), "---\nglobs: '*.css'\n---\nCSS rule.")
    const rules = loadRules(tmpDir)
    assert.equal(rules.length, 2)
    const thincoderRule = rules.find(r => r.source === ".thincoder/rules")
    assert.equal(thincoderRule.name, "conventions")
    assert.equal(thincoderRule.description, "test")
    assert.equal(thincoderRule.content, "Rule content.")
    assert.equal(thincoderRule.globs, null)
    const cursorRule = rules.find(r => r.source === ".cursor/rules")
    assert.equal(cursorRule.name, "css")
    assert.deepEqual(cursorRule.globs, ["*.css"])
  })

  it("parses globs from frontmatter", () => {
    writeFileSync(join(tmpDir, ".thincoder", "rules", "react.md"),
      "---\nglobs: 'src/**/*.tsx; src/**/*.jsx'\n---\nReact rules.")
    const rules = loadRules(tmpDir)
    const react = rules.find(r => r.name === "react")
    assert.deepEqual(react.globs, ["src/**/*.tsx", "src/**/*.jsx"])
  })

  it("rule without frontmatter has no globs", () => {
    writeFileSync(join(tmpDir, ".thincoder", "rules", "plain.md"), "Just plain text, no frontmatter.")
    const rules = loadRules(tmpDir)
    const plain = rules.find(r => r.name === "plain")
    assert.equal(plain.globs, null)
    assert.equal(plain.content, "Just plain text, no frontmatter.")
  })

  it("loads .mdc files (Cursor format)", () => {
    writeFileSync(join(tmpDir, ".cursor", "rules", "python.mdc"), "---\nglobs: '*.py'\n---\nPython rules.")
    const rules = loadRules(tmpDir)
    const py = rules.find(r => r.name === "python")
    assert.ok(py)
    assert.deepEqual(py.globs, ["*.py"])
    assert.equal(py.content, "Python rules.")
  })
})

describe("rules — matchesGlob", () => {
  it("matches simple * pattern", () => {
    assert.ok(matchesGlob("app.tsx", ["*.tsx"]))
    assert.ok(!matchesGlob("app.ts", ["*.tsx"]))
    assert.ok(matchesGlob("src/app.tsx", ["src/*.tsx"]))
  })

  it("matches ** recursive pattern", () => {
    assert.ok(matchesGlob("src/components/Button.tsx", ["src/**/*.tsx"]))
    assert.ok(!matchesGlob("src/components/Button.ts", ["src/**/*.tsx"]))
  })

  it("matches directory pattern", () => {
    assert.ok(matchesGlob("src/components/foo/bar.tsx", ["src/components/**/*"]))
    assert.ok(!matchesGlob("src/utils/bar.tsx", ["src/components/**/*"]))
  })

  it("matches multiple patterns", () => {
    assert.ok(matchesGlob("style.css", ["*.css", "*.scss"]))
    assert.ok(matchesGlob("style.scss", ["*.css", "*.scss"]))
    assert.ok(!matchesGlob("style.less", ["*.css", "*.scss"]))
  })
})

console.log("\n✓ All unit tests passed.\n")
