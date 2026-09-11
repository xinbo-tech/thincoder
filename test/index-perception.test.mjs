/**
 * index-perception.test.mjs — 第 21 批（VSC 索引感知面 B1–B4）机器验收。
 * 设计权威：`docs/design/MEMORY.md` §4（契约一~八 · 用例 T-I1~T-I10 §4.5 · AC-I1~I5 §4.6）；
 * 批次档 `thincoder/docs/batches/2026-09-11-VSC-INDEX-PERCEPTION.md` §2。
 *
 * 分层（§4.5 归册）：T-I1~T-I4/T-I4b/T-I8/T-I9 快层直跑（无真实网络——fetch 桩按需注入）；
 * T-I5（提示面——内含 needsRebuild）与 T-I8b 走真实 git 子进程/真仓 → slow(...)（快层 skip、
 * `npm run test:full` 跑）。
 * 2026-09-11 TEST-LIFECYCLE 扫①：B2 ignored 触发面 git 慢档组（T-I6/T-I6b/T-I7/T-I10）拆出
 * 至 `test/index-ignored-slow.test.mjs`（本档体积回归 300 咨询线内）；另裁 T-I9 旧串负向锚段。
 * 环境隔离：全部 fixture 在 tmp；config 路径经 _setConfigPathForTest 沙箱化（面板面）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { execSync } from "node:child_process"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import * as vscode from "vscode"
import files from "./files.mjs"
import { slow } from "./slow.mjs"
import { indexCompat, loadIndex, needsRebuild, searchIndex } from "../src/indexer.mjs"
import { encodeVectors } from "../src/index-bin.mjs"
import { discoverFiles, kindFor, listMemoryFiles } from "../src/index-discover.mjs"
import { pushIndexStatus, maybePromptIndex } from "../src/extension/panel-index.mjs"
import { updateIndexStatus } from "../webview/settings-tools.js"
import { setupWebview } from "./helpers/webview-env.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { setVSCodeEmbedder, resetEmbedder } from "../src/embed-config.mjs"
import { setProjectFolder, clearProjectOverride } from "../src/extension/panel-messages.mjs"

// 词表（§4.2 契约八——收集域 = needsRebuild 返回值；indexCompat.reason 属独立命名空间）
const REASON_WORDS = new Set(["no-index", "new-commits", "file-added", "file-removed", "file-missing", "file-changed", "up-to-date"])
// 旧串负向锚（FORBIDDEN）随扫① 削段退役——行为由 T-I6/T-I6b/T-I7/T-I10 锁定。
const SRC_DIR = fileURLToPath(new URL("../src/", import.meta.url))
const _dirs = []
let _savedWs

before(() => {
  _savedWs = vscode.workspace.workspaceFolders
  _setConfigPathForTest(join(mkdtempSync(join(tmpdir(), "tc-ip-cfg-")), "config.json"))
})

after(() => {
  vscode.workspace.workspaceFolders = _savedWs
  clearProjectOverride()
  resetEmbedder()
  _setConfigPathForTest(null)
  for (const d of _dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } }
})

function tmpDir(prefix) {
  const d = mkdtempSync(join(tmpdir(), prefix))
  _dirs.push(d)
  return d
}

function mtimeOf(cwd, rel) {
  try { return Math.trunc(statSync(join(cwd, rel)).mtimeMs) } catch { return 0 }
}

/** 最小索引 fixture：manifest + vectors.bin（每文件 1 chunk）；entries = 路径或 {path, mtime}。 */
function writeIndex(cwd, { model = "A", dim = 4, vectorDim = dim, entries = [], commit = null } = {}) {
  const dir = join(cwd, ".thincoder", "index")
  mkdirSync(dir, { recursive: true })
  const fileMap = {}
  entries.forEach((e, i) => {
    const rel = typeof e === "string" ? e : e.path
    const mtime = typeof e === "string" ? mtimeOf(cwd, rel) : e.mtime
    fileMap[rel] = { mtime, kind: kindFor(rel), chunks: [{ idx: i, startLine: 1, endLine: 1 }] }
  })
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ version: 1, vector_dim: vectorDim, embed_model: model, indexed_commit: commit, files: fileMap }, null, 2))
  writeFileSync(join(dir, "vectors.bin"), encodeVectors(dim, entries.map(() => Float32Array.from({ length: dim }, () => 0.5))))
}

/** 当前 mtime 快照（每阶段重建 manifest——git 慢档组随拆档迁至 `index-ignored-slow.test.mjs`；本档保留定义以供将来同型 fixture）。 */
function snapshot(cwd, paths) { return paths.map((p) => ({ path: p, mtime: mtimeOf(cwd, p) })) }

function stubEmbedder(model) { return { baseURL: "http://stub.invalid/v1", apiKey: "k", model } }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function stubPanel() {
  const posted = []
  return { posted, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}

/** fetch 桩：返回 dim 维向量（无网络；embed() 只用 .ok/.json()）。 */
async function withFetch(dim, fn) {
  const real = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: [{ index: 0, embedding: new Array(dim).fill(0.5) }] }) })
  try { return await fn() } finally { globalThis.fetch = real }
}

/** needsRebuild 函数体源码（花括号配平）——各分支 reason 字面量的收集域。 */
function needsRebuildBody(src) {
  const start = src.indexOf("export function needsRebuild(")
  assert.ok(start >= 0, "needsRebuild 导出在位")
  let depth = 0
  for (let j = src.indexOf("{", start); j < src.length; j++) {
    if (src[j] === "{") depth++
    else if (src[j] === "}" && --depth === 0) return src.slice(start, j + 1)
  }
  throw new Error("needsRebuild 函数体配平失败")
}

test("T-I4b 状态行渲染（F6/AC-I1）：不匹配 → settings.indexMismatch 两语文案逐字 + 重建按钮可用", () => {
  const env = setupWebview()
  try {
    document.body.innerHTML = '<div id="index-status"></div><button id="index-build-btn"></button>'
    const expect = {
      zh: "索引由 A 构建 ≠ 当前模型 B——建议重建",
      en: "Index built with A ≠ current model B — rebuild recommended",
    }
    const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
    const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
    assert.equal(zh["settings.indexMismatch"], "索引由 ${index} 构建 ≠ 当前模型 ${current}——建议重建", "zh 键逐字（设计 §4.2 契约四）")
    assert.equal(en["settings.indexMismatch"], "Index built with ${index} ≠ current model ${current} — rebuild recommended", "en 键逐字")
    updateIndexStatus({ built: true, files: 3, chunks: 9, mismatch: { indexModel: "A", currentModel: "B" } })
    assert.equal(document.getElementById("index-status").textContent, expect.en, "不匹配态状态行（en locale）")
    assert.equal(document.getElementById("index-build-btn").disabled, false, "重建入口可用")
    // 一致态回落既有文案 + 文件/块计数
    updateIndexStatus({ built: true, files: 3, chunks: 9 })
    assert.ok(document.getElementById("index-status").textContent.includes("3 files, 9 chunks"), "一致态仍走 indexBuilt（零回归）")
  } finally { env.cleanup() }
})

// ─── B1：校验 + 不产出 + 可见（AC-I1） ─────────────────────────────────

test("T-I1 模型不匹配（F6/AC-I1）：indexCompat = model-changed；searchIndex 返空且不进打分段（零网络）", async () => {
  const cwd = tmpDir("tc-ip-t1-")
  writeFileSync(join(cwd, "a.md"), "hello world\n")
  writeIndex(cwd, { model: "A", entries: ["a.md"] })
  assert.deepEqual(indexCompat(cwd, stubEmbedder("B")), { compatible: false, reason: "model-changed", indexModel: "A", currentModel: "B" })
  let fetched = 0
  const real = globalThis.fetch
  globalThis.fetch = async () => { fetched++; throw new Error("模型失配不得发网络请求") }
  try {
    assert.deepEqual(await searchIndex(cwd, stubEmbedder("B"), "hello", { kind: "doc" }), [], "失配 → []（回退信号）")
    assert.equal(fetched, 0, "第二道闸在 embed 之前")
  } finally { globalThis.fetch = real }
  // 正控（修前红对照）：同名模型下同 fixture 命中非空——证明返空来自闸而非空索引
  const hits = await withFetch(4, () => searchIndex(cwd, stubEmbedder("A"), "hello", { kind: "doc" }))
  assert.equal(hits.length, 1, "正控：模型一致 → 1 条命中")
  assert.equal(indexCompat(cwd, stubEmbedder("A")).compatible, true)
})

test("T-I2 头维不一致（F6/AC-I1）：manifest.vector_dim ≠ vectors.bin 头 → loadIndex = null", () => {
  const cwd = tmpDir("tc-ip-t2-")
  writeFileSync(join(cwd, "a.md"), "x\n")
  writeIndex(cwd, { model: "A", dim: 4, vectorDim: 8, entries: ["a.md"] })
  assert.equal(loadIndex(cwd), null, "头/清单不一致 = 等价损坏索引（走重建路径）")
  writeIndex(cwd, { model: "A", dim: 4, vectorDim: 4, entries: ["a.md"] })
  assert.equal(loadIndex(cwd)?.dim, 4, "正控：一致时正常装载")
})

test("T-I3 query 维度兜底（F6/AC-I1）：同名模型 + 实际维度不同 → searchIndex = []（不进打分）", async () => {
  const cwd = tmpDir("tc-ip-t3-")
  writeFileSync(join(cwd, "a.md"), "hello world\n")
  writeIndex(cwd, { model: "A", dim: 4, entries: ["a.md"] })
  assert.deepEqual(await withFetch(8, () => searchIndex(cwd, stubEmbedder("A"), "hello", { kind: "doc" })), [], "query 维 8 ≠ 索引维 4")
  assert.equal((await withFetch(4, () => searchIndex(cwd, stubEmbedder("A"), "hello", { kind: "doc" }))).length, 1, "正控：维度一致 → 命中")
})

test("T-I4 状态面（F6/AC-I1）：pushIndexStatus 载荷 built:true 且带 mismatch:{indexModel,currentModel}", () => {
  const cwd = tmpDir("tc-ip-t4-")
  writeFileSync(join(cwd, "a.md"), "x\n")
  writeIndex(cwd, { model: "A", entries: ["a.md"] })
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: cwd } }]
  setProjectFolder(cwd)
  const panel = stubPanel()
  setVSCodeEmbedder(stubEmbedder("B"))
  pushIndexStatus(panel)
  const msg = panel.posted.find((m) => m.type === "indexStatus")
  assert.equal(msg.status.built, true)
  assert.deepEqual(msg.status.mismatch, { indexModel: "A", currentModel: "B" }, "不匹配时追加 mismatch 载荷")
  assert.equal(msg.hasEmbedder, true)
  setVSCodeEmbedder(stubEmbedder("A"))
  pushIndexStatus(panel)
  assert.equal("mismatch" in panel.posted.at(-1).status, false, "一致时零 mismatch 键（既有形状不变）")
})

slow("T-I5 提示面（F6/AC-I1）：文案含两模型名（含 needed ∧ 不匹配 合取分支）+ 既有两键；选 Build 触发重建", async () => {
  const cwd = tmpDir("tc-ip-t5-")
  writeFileSync(join(cwd, "a.md"), "x\n")
  writeIndex(cwd, { model: "A", entries: ["a.md"] })
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: cwd } }]
  setProjectFolder(cwd)
  setVSCodeEmbedder(stubEmbedder("B"))
  const calls = []
  const realInfo = vscode.window.showInformationMessage
  let nextAnswer = "Build"
  vscode.window.showInformationMessage = async (text, ...btns) => { calls.push({ text, btns }); const a = nextAnswer; nextAnswer = undefined; return a }
  try {
    // buildIndex 为 fire-and-forget（maybePromptIndex 不 await）——轮询等待完成提示；
    // fetch 桩蓋整个窗口（建造阶段会调 embed）。
    await withFetch(4, async () => {
      await maybePromptIndex(stubPanel())
      for (let i = 0; i < 250 && !calls.some((c) => c.text.startsWith("Index built:")); i++) await sleep(20)
    })
    assert.equal(calls[0]?.text, "Index was built with A but the current embedding model is B. Rebuild now?", "逐字文案（设计 §4.2 契约四）")
    assert.deepEqual(calls[0]?.btns, ["Build", "Later"], "既有两键不变")
    assert.ok(calls.some((c) => c.text.startsWith("Index built:")), "选 Build → 重建真跑（完成提示在案）")

    // 合取分支（needed ∧ 不匹配——可达）：文案仍明示两名，不出「not built」假陈述
    calls.length = 0
    writeIndex(cwd, { model: "A", entries: ["a.md"] }) // 重建后的清单换回异模型 + 新文件未入册
    writeFileSync(join(cwd, "b.md"), "new\n")
    await withFetch(4, () => maybePromptIndex(stubPanel()))
    assert.equal(calls[0]?.text, "Index was built with A but the current embedding model is B. Rebuild now?", "needed ∧ 不匹配 → 同句（两模型名在位）")
    assert.ok(!calls[0]?.text.includes("not built"), "不出「not built」假陈述（索引在，只是异模型）")
  } finally { vscode.window.showInformationMessage = realInfo }
})

// ─── B3：嵌套 memory（AC-I3） ─────────────────────────────────────────

/** 嵌套 memory fixture（纯 fs——自检面/发现面同源断言无需 git）。 */
function memoryFixture(prefix) {
  const cwd = tmpDir(prefix)
  mkdirSync(join(cwd, ".thincoder", "memory", "personal", "archive"), { recursive: true })
  writeFileSync(join(cwd, ".thincoder", "memory", "top.md"), "top\n")
  writeFileSync(join(cwd, ".thincoder", "memory", "personal", "archive", "x.md"), "nested\n")
  return cwd
}

test("T-I8 嵌套 memory 自检一致（F8/AC-I3）：listMemoryFiles ⊇ 嵌套文件且 == discoverFiles 的 memory 子集", () => {
  const cwd = memoryFixture("tc-ip-t8-")
  const mem = listMemoryFiles(cwd)
  assert.ok(mem.includes(".thincoder/memory/personal/archive/x.md"), "嵌套文件在自检面内（修前：平层 readdir 漏报）")
  assert.deepEqual([...mem].sort(), discoverFiles(cwd).filter((f) => f.startsWith(".thincoder/memory/")).sort(), "自检面 == 发现面（同源不可背离）")
})

slow("T-I8b 嵌套 memory 零无效重算（F8/AC-I3）：git 快路径连调两次 needed:false", () => {
  const cwd = memoryFixture("tc-ip-t8b-")
  execSync("git init -q", { cwd, stdio: "ignore" }) // 无 commit——`git status` 快路径进得去
  writeIndex(cwd, { entries: [".thincoder/memory/top.md", ".thincoder/memory/personal/archive/x.md"] })
  assert.deepEqual(needsRebuild(cwd), { needed: false, reason: "up-to-date" }, "首判零重建（修前：反复 file-removed）")
  assert.deepEqual(needsRebuild(cwd), { needed: false, reason: "up-to-date" }, "二判同向（无效重算已消）")
})

// ─── B4：词表锁（AC-I4） ──────────────────────────────────────────────

test("T-I9 词表锁（F9/AC-I4）：needsRebuild 各分支 reason 全量收集 ∈ 七词表 + 运行抽检 no-index", () => {
  // ① 收集域 = needsRebuild 返回值：静态全量（静态收集保证七词全覆盖——含运行 fixture 不可达的
  //    new-commits/file-missing；运行态四词由 T-I5/T-I6/T-I7/T-I8/T-I10 覆盖）+ 运行抽检 no-index。
  // 2026-09-11 TEST-LIFECYCLE 扫① 削段：原②块（旧串负向全路径 grep + 两条源码形态锚）删——
  //    负向防回潮锚已退役；ignored 语义行为由 T-I6/T-I6b/T-I7/T-I10 锁定。
  const src = readFileSync(join(SRC_DIR, "indexer.mjs"), "utf8")
  const reasons = [...needsRebuildBody(src).matchAll(/reason:\s*"([a-z-]+)"/g)].map((m) => m[1])
  const uniq = new Set(reasons)
  for (const r of uniq) assert.ok(REASON_WORDS.has(r), `reason "${r}" ∈ 七词表`)
  assert.deepEqual([...uniq].sort(), [...REASON_WORDS].sort(), "七词全量 == 各分支字面量集（词表锁）")
  assert.equal(needsRebuild(join(tmpDir("tc-ip-t9-"), "missing")).reason, "no-index", "运行抽检：no-index")
  assert.ok(files.includes("test/index-perception.test.mjs"), "本档已登记 test/files.mjs")
})

// ─── （已拆出：B2 ignored 触发面 git 慢档组 → `test/index-ignored-slow.test.mjs`）────
// T-I6/T-I6b/T-I7/T-I10（真实 git 子进程）随 2026-09-11 扫① 拆分独立成档（本档体积回归 300 咨询线内）。
