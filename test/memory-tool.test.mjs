/**
 * memory-tool.test.mjs — memory tool layer unification + delete semantics fix
 * (docs/design/MEMORY.md §3 —— 2026-09-08 采纳 #1/#2/#5; 验收测试表 9 用例).
 *
 * Covers the acceptance table:
 *   layer 可选单删 / layer 省略单删按 origin 路由 / layer 不匹配报错 / 批删必填 layer /
 *   list 补 [layer] 标签 / 输出无 scope 词 / delete 尊重 origin /
 *   边界 本地无 origin 目录 ENOENT 容错 / clear project 拒绝
 * plus schema + description assertions (model-visible surface speaks `layer` only).
 *
 * No embedder configured in tests → search exercises the keyword path (deterministic).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryTool, filterAliveFiles } from "../src/memory-tool.mjs"
import { serializeEntry, entryFilename } from "../src/memory.mjs"

function freshCwd() {
  return mkdtempSync(join(tmpdir(), "mem-layer-test-"))
}

function cleanup(cwd) {
  try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ }
}

/** Execute the memory tool against a temp cwd. */
function run(args, cwd) {
  return memoryTool.execute(args, { cwd })
}

/** put via the tool and return the entry id (filename) it created. */
function putId(cwd, { layer = "personal", type = "rule", title, content, tags } = {}) {
  const out = run({ action: "put", layer, type, title, content, tags }, cwd)
  assert.match(out, /^Saved memory entry/, `put failed: ${out}`)
  const m = out.match(/id=([A-Za-z0-9._-]+)/)
  assert.ok(m, `no id in put output: ${out}`)
  return m[1]
}

/** Write a memory entry file directly at a physical dir (root when layerDir is null). */
function writeEntry(cwd, layerDir, { type = "rule", title, content } = {}) {
  const dir = layerDir ? join(cwd, ".thincoder", "memory", layerDir) : join(cwd, ".thincoder", "memory")
  mkdirSync(dir, { recursive: true })
  const filename = entryFilename(title)
  writeFileSync(join(dir, filename), serializeEntry({ type, title, content }), "utf8")
  return filename
}

function memPath(cwd, ...rest) {
  return join(cwd, ".thincoder", "memory", ...rest)
}

// ── 用例 1: layer 可选单删（id 在 project 层, layer: "project" 校验通过 → 删）──

test("AC1 layer 可选单删: delete {id, layer} 校验通过即删", () => {
  const cwd = freshCwd()
  try {
    const id = putId(cwd, { layer: "project", type: "rule", title: "project layer rule", content: "project content" })
    const out = run({ action: "delete", id, layer: "project" }, cwd)
    assert.match(out, new RegExp(`^Deleted ${id}: project layer rule`), `delete failed: ${out}`)
    assert.equal(existsSync(memPath(cwd, "project", id)), false, "file must be gone")
  } finally { cleanup(cwd) }
})

// ── 用例 2: layer 省略单删（id 在 project 层, 无 layer → 按 origin 路由 → 删）──

test("AC2 layer 省略单删: delete {id} 按 id origin 路由删除（不报 layer 错）", () => {
  const cwd = freshCwd()
  try {
    const id = putId(cwd, { layer: "project", type: "rule", title: "orphan project rule", content: "project content" })
    const out = run({ action: "delete", id }, cwd)
    assert.match(out, new RegExp(`^Deleted ${id}: orphan project rule`), `delete failed: ${out}`)
    assert.equal(existsSync(memPath(cwd, "project", id)), false, "file must be gone from its origin dir")
  } finally { cleanup(cwd) }
})

// ── 用例 3: layer 不匹配单删（id 在 project, layer: "personal" → 明确错误, 不删）──

test("AC3 layer 不匹配单删: delete {id, layer} 与 id 实际所在层不符 → 明确错误（防误删）", () => {
  const cwd = freshCwd()
  try {
    const id = putId(cwd, { layer: "project", type: "rule", title: "mismatch victim", content: "project content" })
    const out = run({ action: "delete", id, layer: "personal" }, cwd)
    assert.match(out, /不匹配/, `expected a mismatch error, got: ${out}`)
    assert.match(out, /layer personal/, `error should name the requested layer: ${out}`)
    assert.equal(existsSync(memPath(cwd, "project", id)), true, "file must NOT be deleted on mismatch")
  } finally { cleanup(cwd) }
})

// ── 用例 4: 批删必填 layer（无 layer → 明确错误）──

test("AC4 批删必填 layer: delete {type, keyword} 无 layer → 明确错误", () => {
  const cwd = freshCwd()
  try {
    putId(cwd, { layer: "project", type: "rule", title: "cleanup target", content: "to be wiped" })
    const out = run({ action: "delete", type: "rule", keyword: "cleanup" }, cwd)
    assert.match(out, /batch delete requires layer/, `expected layer-required error, got: ${out}`)
    assert.doesNotMatch(out, /^Deleted/, "nothing may be deleted without layer")
    assert.equal(existsSync(memPath(cwd, "project")), true)
  } finally { cleanup(cwd) }
})

// ── 用例 5: list 补独立 [layer] 标签列（与 search 行对齐）──

test("AC5 list 每行含 [layer] 标签列（search 行同样对齐）", () => {
  const cwd = freshCwd()
  try {
    putId(cwd, { layer: "personal", type: "rule", title: "personal habit rule", content: "personal habit content" })
    putId(cwd, { layer: "project", type: "knowledge", title: "project knowledge", content: "project knowledge content" })
    // all-layer list tags each row with its layer
    const all = run({ action: "list" }, cwd)
    const allLines = all.split("\n").filter(Boolean)
    assert.ok(allLines.some((l) => /^\[personal\] \S+\.md \[rule\] personal habit rule/.test(l)), `personal row untagged: ${all}`)
    assert.ok(allLines.some((l) => /^\[project\] \S+\.md \[knowledge\] project knowledge/.test(l)), `project row untagged: ${all}`)
    // layer-restricted list: every row carries that layer's tag
    const proj = run({ action: "list", layer: "project" }, cwd)
    const rows = proj.split("\n").filter(Boolean)
    assert.ok(rows.length >= 1, "project layer has entries")
    for (const r of rows) {
      assert.match(r, /^\[project\] /, `row lacks [project] tag: ${r}`)
    }
    // search rows align: each hit starts with the [layer] tag + carries the id
    const s = run({ action: "search", query: "project knowledge" }, cwd)
    assert.match(s, /^\[project\] \[knowledge\] project knowledge \(id=\S+\.md\)/, `search row not tagged: ${s}`)
  } finally { cleanup(cwd) }
})

// ── 用例 6: 模型可见文本（schema/描述/结果/错误）无 scope 词（全 layer）──

test("AC6 输出无 scope 词: 全动作模型可见文本（含 schema/描述/错误串）", () => {
  const cwd = freshCwd()
  try {
    const outputs = []
    const collect = (s) => { outputs.push(s); return s }

    // schema + description are model-visible
    const schemaText = JSON.stringify(memoryTool.parameters)
    collect(memoryTool.description)
    collect(schemaText)
    assert.ok(JSON.parse(JSON.stringify(memoryTool.parameters.properties)).layer, "schema must expose `layer`")
    assert.equal("scope" in memoryTool.parameters.properties, false, "schema must not expose `scope`")

    // success paths
    const id = putId(cwd, { layer: "project", type: "rule", title: "clean sweep", content: "clean content" })
    collect(run({ action: "search", query: "clean" }, cwd))
    collect(run({ action: "search", query: "zzz-none-matching" }, cwd))
    collect(run({ action: "list" }, cwd))
    collect(run({ action: "list", layer: "personal" }, cwd)) // 0 条匹配
    collect(run({ action: "delete", id, layer: "project" }, cwd))
    putId(cwd, { layer: "project", type: "rule", title: "batch wipe rule", content: "batch wipe content" })
    putId(cwd, { layer: "project", type: "rule", title: "batch wipe rule", content: "batch wipe content" })
    collect(run({ action: "delete", layer: "project", type: "rule", keyword: "batch", confirm: false }, cwd)) // preview
    collect(run({ action: "delete", layer: "project", type: "rule", keyword: "batch", confirm: true }, cwd))
    putId(cwd, { layer: "personal", type: "knowledge", title: "personal snippet", content: "personal snippet content" })
    collect(run({ action: "clear", layer: "personal", confirm: true }, cwd))

    // error paths
    collect(run({ action: "search", layer: "team", query: "x" }, cwd))
    collect(run({ action: "search", layer: "bogus", query: "x" }, cwd))
    collect(run({ action: "put", layer: "bogus", type: "rule", title: "t", content: "c" }, cwd))
    collect(run({ action: "list", layer: "team" }, cwd))
    collect(run({ action: "delete", type: "rule", keyword: "x" }, cwd))
    collect(run({ action: "delete", layer: "project", type: "rule" }, cwd)) // no filter
    collect(run({ action: "delete", layer: "bogus", type: "rule", keyword: "x" }, cwd))
    collect(run({ action: "delete", id: "20260101-ghost-aaaa.md", layer: "personal" }, cwd)) // not found
    collect(run({ action: "delete", id: "20260101-ghost-aaaa.md" }, cwd)) // not found, no layer
    collect(run({ action: "clear" }, cwd))
    collect(run({ action: "clear", layer: "project", confirm: true }, cwd))
    collect(run({ action: "clear", layer: "personal" }, cwd)) // missing confirm
    collect(run({ action: "nonsense" }, cwd))
    // mismatch + team error paths (full coverage of model-visible error strings)
    const probe = putId(cwd, { layer: "project", type: "rule", title: "mismatch probe", content: "probe content" })
    collect(run({ action: "delete", id: probe, layer: "personal" }, cwd)) // layer mismatch error
    collect(run({ action: "put", layer: "team", type: "rule", title: "t", content: "c" }, cwd))
    collect(run({ action: "delete", id: probe, layer: "team" }, cwd))
    collect(run({ action: "delete", layer: "team", type: "rule", keyword: "x" }, cwd))

    for (const [i, o] of outputs.entries()) {
      assert.doesNotMatch(o, /scope/i, `model-visible text #${i} still contains "scope": ${JSON.stringify(o)}`)
    }
  } finally { cleanup(cwd) }
})

// ── 用例 7: delete 尊重 origin（非当前 dirs[layer] 假设；legacy 根目录文件亦可路由）──

test("AC7 delete 尊重 origin: 按 id 物理层目录定位（含 legacy 根目录），非 dirs[layer] 假设", () => {
  const cwd = freshCwd()
  try {
    // 1) personal entry deleted by bare id via its own origin dir
    const pid = putId(cwd, { layer: "personal", type: "rule", title: "origin personal", content: "personal content" })
    const pOut = run({ action: "delete", id: pid }, cwd)
    assert.match(pOut, new RegExp(`^Deleted ${pid}: origin personal`), `personal origin delete failed: ${pOut}`)
    assert.equal(existsSync(memPath(cwd, "personal", pid)), false)
    // 2) legacy file physically at the memory root (no layer) — delete {id} routes to the root dir
    const rid = writeEntry(cwd, null, { type: "knowledge", title: "legacy root entry", content: "legacy content" })
    const rOut = run({ action: "delete", id: rid }, cwd)
    assert.match(rOut, new RegExp(`^Deleted ${rid}: legacy root entry`), `legacy root delete failed: ${rOut}`)
    assert.equal(existsSync(memPath(cwd, rid)), false)
    // 3) deleting by origin does not touch an identical-name file in another layer (no false cross-delete)
    const a = putId(cwd, { layer: "personal", type: "rule", title: "same title in personal", content: "personal content" })
    const b = putId(cwd, { layer: "project", type: "rule", title: "same title in project", content: "project content" })
    assert.notEqual(a, b)
    run({ action: "delete", id: a, layer: "personal" }, cwd)
    assert.equal(existsSync(memPath(cwd, "personal", a)), false)
    assert.equal(existsSync(memPath(cwd, "project", b)), true, "other-layer file must survive")
  } finally { cleanup(cwd) }
})

// ── 用例 8: 边界 本地无 origin 目录 → ENOENT 容错（不报假成功）──

test("AC8 本地无 origin 目录: 不存在/无目录的 id 删除 → 优雅 not-found, 不报假成功", () => {
  const cwd = freshCwd() // no memory dirs at all yet
  try {
    const out = run({ action: "delete", id: "20260101-ghost-aaaa.md" }, cwd)
    assert.match(out, /^Error: memory .* not found/, `expected graceful not-found, got: ${out}`)
    assert.doesNotMatch(out, /^Deleted/, "no false success")
    const outLayer = run({ action: "delete", id: "20260101-ghost-aaaa.md", layer: "personal" }, cwd)
    assert.match(outLayer, /not found in layer personal/, `expected layer not-found, got: ${outLayer}`)
    assert.doesNotMatch(outLayer, /^Deleted/, "no false success")
  } finally { cleanup(cwd) }
})

// ── 用例 9: clear project 拒绝（clear 仅 personal）──

test("AC9 clear project 拒绝: clear {layer: project, confirm: true} → 明确拒绝且不删", () => {
  const cwd = freshCwd()
  try {
    putId(cwd, { layer: "project", type: "rule", title: "untouchable project rule", content: "project content" })
    const files = run({ action: "list", layer: "project" }, cwd)
    assert.match(files, /untouchable project rule/)
    const out = run({ action: "clear", layer: "project", confirm: true }, cwd)
    assert.match(out, /clear is personal-only/, `expected personal-only refusal, got: ${out}`)
    const after = run({ action: "list", layer: "project" }, cwd)
    assert.match(after, /untouchable project rule/, "project entries must survive a refused clear")
  } finally { cleanup(cwd) }
})

// ── 补充: 向量路径 stale-index guard（filterAliveFiles）——已删条目不得经向量路径复现 ──

test("vector stale-index guard: 已删除文件的向量命中行被丢弃（活文件保留）", () => {
  const cwd = freshCwd()
  try {
    const liveId = writeEntry(cwd, "project", { type: "rule", title: "live entry", content: "still here" })
    const rows = [
      { file: `.thincoder/memory/project/${liveId}`, score: 0.9 }, // live
      { file: ".thincoder/memory/project/20260101-ghost-aaaa.md", score: 0.8 }, // deleted since last rebuild
    ]
    const alive = filterAliveFiles(cwd, rows)
    assert.equal(alive.length, 1, `only the live file row may survive: ${JSON.stringify(alive)}`)
    assert.equal(alive[0].file, `.thincoder/memory/project/${liveId}`)
  } finally { cleanup(cwd) }
})

// ── 额外: 批删确认 + 输出契约（Deleted N entries in layer X）──

test("批删（layer + filter + confirm:true）→ 'Deleted N entries in layer X'", () => {
  const cwd = freshCwd()
  try {
    putId(cwd, { layer: "project", type: "rule", title: "batch target one", content: "batch content" })
    putId(cwd, { layer: "project", type: "rule", title: "batch target two", content: "batch content" })
    putId(cwd, { layer: "project", type: "knowledge", title: "batch keeper", content: "batch content" })
    const out = run({ action: "delete", layer: "project", type: "rule", keyword: "batch", confirm: true }, cwd)
    assert.equal(out, "Deleted 2 entries in layer project", `batch delete output contract: ${out}`)
    const after = run({ action: "list", layer: "project" }, cwd)
    assert.match(after, /batch keeper/)
    assert.doesNotMatch(after, /batch target/)
  } finally { cleanup(cwd) }
})
