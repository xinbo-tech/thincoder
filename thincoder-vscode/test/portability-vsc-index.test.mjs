/**
 * portability-vsc-index.test.mjs — 批次二（可移植性 VSC 镜像面）用例表 1:1：
 * T-V14–T-V16/T-V19（设计档 `thincoder-vscode/docs/design/PORTABILITY.md` §6）+ AC-V06/AC-V08 机判面（§7）。
 * 零网络（fetch 桩覆盖 buildIndex 的 embed 段）/ 零真实 LLM / 零长等待（临时树 + 内存夹具）。
 * 判据权威 = §3.4（索引扩表/声明并集/可见化）/ §4.3（面板提示行逐字）/ §4.5（扩表清单）。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：T-V17/T-V18（六档提示词逐字 / R24 对齐）整删——读提示词档文本 = 散文锚
 *（判据见 CLI 侧设计档 TESTING.md §11）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { discoverFiles, isIndexableFile, kindFor } from "../src/index-discover.mjs"
import { buildIndex, needsRebuild } from "../src/indexer.mjs"
import { buildIndex as panelBuildIndex } from "../src/extension/panel-index.mjs"
import { setVSCodeEmbedder, resetEmbedder } from "../src/embed-config.mjs"
import { setProjectFolder, clearProjectOverride } from "../src/extension/panel-messages.mjs"
import { clearConventionsCache, loadConventions } from "@thincoder/core/conventions.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { slow } from "./slow.mjs"
import * as vscode from "vscode"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

const tmpDirs = []
let _savedWs
before(() => {
  _savedWs = vscode.workspace.workspaceFolders
  _setConfigPathForTest(join(mkdtempSync(join(tmpdir(), "pvi-cfg-")), "config.json"))
})
after(() => {
  vscode.workspace.workspaceFolders = _savedWs
  clearProjectOverride()
  resetEmbedder()
  _setConfigPathForTest(null)
  clearConventionsCache()
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "pvi-"))
  tmpDirs.push(dir)
  return dir
}
const write = (root, rel, content) => {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
const STUB_EMBEDDER = { baseURL: "http://stub.invalid/v1", apiKey: "k", model: "stub" }
/** fetch 桩：按 input 数量回等长向量（embed 校验 data.length === batch.length）。 */
function withFetch(fn, dim = 4) {
  const real = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body)
    return { ok: true, json: async () => ({ data: body.input.map((_, i) => ({ index: i, embedding: new Array(dim).fill(0.5) })) }) }
  }
  return Promise.resolve().then(fn).finally(() => { globalThis.fetch = real })
}
function stubPanel() {
  const posted = []
  return { posted, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}
// ─── T-V14–T-V16：索引扩表 / 声明并集 / 可见化（VP-9 / AC-V06） ────────────────

test("T-V14 正常（扩展名）：.dart/.lua/.cs/.org 默认可索引（扩表对齐 §4.5）", () => {
  const ws = mkws()
  const conv = loadConventions(ws)
  for (const f of ["a.dart", "a.lua", "a.cs"]) {
    assert.equal(isIndexableFile(f, conv), true, `${f} 默认入索引（扩表前不可见）`)
    assert.equal(kindFor(f, conv), "code", `${f} 判 code`)
  }
  assert.equal(isIndexableFile("a.org", conv), true, "DOC 扩表：.org 默认入索引")
  assert.equal(kindFor("a.org", conv), "doc", ".org 判 doc")
  // 发现面同源（走同一 isIndexableFile）
  write(ws, "src/a.dart", "void main() {}\n")
  write(ws, "notes/b.org", "* heading\n")
  const found = discoverFiles(ws)
  assert.ok(found.includes("src/a.dart"), "discoverFiles 命中 .dart")
  assert.ok(found.includes("notes/b.org"), "discoverFiles 命中 .org")
})

test("T-V15 边界（声明）：index.codeExtensions:[\".xyz\"] → .xyz 入索引；未列入 → unlistedExts 计数（并集/可见面）", () => {
  const ws = mkws()
  write(ws, ".thincoder/conventions.json", JSON.stringify({ index: { codeExtensions: [".xyz", "QQQ"] } }))
  write(ws, "src/a.xyz", "x\n")
  write(ws, "src/b.qqq", "x\n") // 归一 `.QQQ` → `.qqq`——声明大小写不敏感
  write(ws, "src/c.weird", "x\n")
  const res = discoverFiles(ws, undefined, { collectUnlisted: true })
  assert.ok(res.files.includes("src/a.xyz"), "声明扩展入索引（并集——默认表仍生效）")
  assert.ok(res.files.includes("src/b.qqq"), "声明扩展归一（大写/无点形态）")
  assert.ok(res.files.includes("src/readme.md") === false, "负控：不存在文件不误报")
  assert.equal(isIndexableFile("c.weird", loadConventions(ws)), false, "未列入仍不入索引")
  assert.equal(res.unlisted.count, 1, "未列入计数（恰 1 个 .weird）")
  assert.deepEqual(res.unlisted.exts, [{ ext: ".weird", count: 1 }], "样本 = {ext, count}")
  // 默认档正控：不声明时 .xyz 未列入（同一文件同判据）
  const ws2 = mkws()
  write(ws2, "src/a.xyz", "x\n")
  const res2 = discoverFiles(ws2, undefined, { collectUnlisted: true })
  assert.equal(res2.unlisted.count, 1, "无声明 → .xyz 未列入")
})

slow("T-V16 正常（可见化）：buildIndex 返回 unlistedExts；面板消息含提示行（§4.3 逐字）", async () => {
  const cwd = mkws()
  write(cwd, "src/a.mjs", "export const a = 1\n")
  write(cwd, "src/x.qqq", "x\n")
  write(cwd, "src/y.qqq", "y\n")
  write(cwd, "src/z.zzz", "z\n")
  const direct = await withFetch(() => buildIndex(cwd, STUB_EMBEDDER, {}))
  assert.equal(direct.files, 1, "正控：可索引文件恰 1（其余为未列入）")
  assert.equal(direct.unlistedExts.count, 3, "unlistedExts 计数（.qqq×2 + .zzz×1）")
  assert.deepEqual(direct.unlistedExts.exts.map((e) => e.ext).sort(), [".qqq", ".zzz"], "样本按扩展名聚合")
  // 面板面：真 buildIndex(panel)（vscode 桩 withProgress + showInformationMessage 捕获）
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: cwd } }]
  setProjectFolder(cwd)
  setVSCodeEmbedder(STUB_EMBEDDER)
  const calls = []
  const realInfo = vscode.window.showInformationMessage
  vscode.window.showInformationMessage = async (text) => { calls.push(text); return undefined }
  try {
    await withFetch(() => panelBuildIndex(stubPanel()))
    const built = calls.find((t) => String(t).startsWith("Index built:"))
    assert.ok(built, "完成提示在案")
    assert.ok(
      String(built).includes("Index built: 1 files, 1 chunks. Semantic search is now active. 3 file(s) skipped — extensions not indexed: .qqq, .zzz; declare index.codeExtensions in .thincoder/conventions.json to include them."),
      "提示行逐字（§4.3——含声明指路）",
    )
    // 零未列入 → 原文案不变（零回归）——同一桩窗口内换工作区重跑
    const clean = mkws()
    write(clean, "src/only.mjs", "export const x = 1\n")
    vscode.workspace.workspaceFolders = [{ uri: { fsPath: clean } }]
    setProjectFolder(clean)
    calls.length = 0
    await withFetch(() => panelBuildIndex(stubPanel()))
    assert.equal(calls.find((t) => String(t).startsWith("Index built:")), "Index built: 1 files, 1 chunks. Semantic search is now active.", "无未列入 → 原文案零追加")
  } finally { vscode.window.showInformationMessage = realInfo }
})

// ─── T-V19：非 git 回退零回归（回归锁） ─────────────────────────────────────

slow("T-V19 正常（索引回归）：非 git 回退路径行为零回归（up-to-date → file-added → file-changed）", async () => {
  const cwd = mkws()
  write(cwd, "src/a.mjs", "export const a = 1\n")
  await withFetch(() => buildIndex(cwd, STUB_EMBEDDER, {}))
  assert.deepEqual(needsRebuild(cwd), { needed: false, reason: "up-to-date" }, "建后即 up-to-date（非 git 全量发现 + mtime 回退保持）")
  write(cwd, "src/b.mjs", "export const b = 2\n")
  assert.equal(needsRebuild(cwd).reason, "file-added", "新文件触发重建")
  await withFetch(() => buildIndex(cwd, STUB_EMBEDDER, {}))
  write(cwd, "src/a.mjs", "export const a = 42\n")
  assert.equal(needsRebuild(cwd).reason, "file-changed", "改动触发重建")
})


