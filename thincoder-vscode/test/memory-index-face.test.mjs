/**
 * memory-index-face.test.mjs — W8（MEMORY · 索引面归一核面）专项验收机判。
 * 任务书 = `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W8（:155–:175）·
 * 判据 = A-K12（索引面归一）· A-K13（重建 UX）· A-K14（旧目录清退）· VP-9 可见化重述。
 *
 * 覆盖：① 删除集反向判零（src/ + test/ 零索引族相对引用）；② 检索 = 核面（无 embedder →
 * FTS 回退非空）+ 面板读数源于核库；③ buildIndex 相位序列（scan → index → done）+
 * statusText 载荷 + 完成提示 = 核读数；④ 模型变更零手动重建（失效向量置空 + 检索懒回填）；
 * ⑤ 旧目录清退（告示一次 → 删除动作 → 目录清退；零自动删除路径）；⑥ 未列入扩展名可见化
 * （核面承接——全量回退路径的 unlistedExts → 完成提示提示行）。
 *
 * 环境隔离：config 路径 + HOME 指向 tmp（memory.db 落 tmp；embedder 缺省 null）。
 */
import { test, before, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir, homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import * as vscode from "vscode"
import { slow } from "./slow.mjs"
import { applyEngineFloorGuard } from "../extension.mjs"
import { _resetMemoryHandleForTest, getEmbedder, memoryDbPath, memoryFor, projectMemoryDir, resetEmbedder, setVSCodeEmbedder } from "../src/embed-config.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { setProjectFolder, clearProjectOverride } from "../src/extension/panel-messages.mjs"
import { buildIndex, maybePromptLegacyIndexRemoval, pushIndexStatus, removeLegacyIndexDir, LEGACY_INDEX_DIR } from "../src/extension/panel-index.mjs"
import { codeSearchTool } from "../src/tools/code.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const VSC_ROOT = resolve(__here, "..")

let root, home, cwd, savedWs
const savedEnv = {}

before(async () => {
  const ok = await applyEngineFloorGuard() // 真实探针：本机过闸 ⇒ 记忆面启用
  assert.equal(ok, true, "测试机须满足引擎下限（22.13+ / node:sqlite）")
})

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "mem-face-"))
  home = join(root, "home")
  cwd = join(root, "project")
  mkdirSync(home, { recursive: true })
  mkdirSync(cwd, { recursive: true })
  savedEnv.USERPROFILE = process.env.USERPROFILE
  savedEnv.HOME = process.env.HOME
  process.env.USERPROFILE = home
  process.env.HOME = home
  _setConfigPathForTest(join(home, ".thincoder", "config.json"))
  _resetMemoryHandleForTest()
  resetEmbedder()
  savedWs = vscode.workspace.workspaceFolders
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: cwd } }] // _cwd() 源（setProjectFolder 需工作区收录）
  assert.equal(setProjectFolder(cwd).ok, true, "项目绑定 = 临时树")
})

afterEach(() => {
  vscode.workspace.workspaceFolders = savedWs
  clearProjectOverride()
  _setConfigPathForTest(null)
  _resetMemoryHandleForTest()
  resetEmbedder()
  if (savedEnv.USERPROFILE === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = savedEnv.USERPROFILE
  if (savedEnv.HOME === undefined) delete process.env.HOME
  else process.env.HOME = savedEnv.HOME
  try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) } catch { /* Windows handle lag */ }
})

const write = (rel, content) => {
  const p = join(cwd, ...rel.split("/"))
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, content, "utf8")
}

/** 桩面板：收集 webview 消息（host → webview 面）。 */
function stubPanel() {
  const posted = []
  return { posted, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}

/** fetch 桩：按 input 数量回等长向量（embed 校验 data.length === batch.length——零网络）。 */
async function withFetch(fn, dim = 4) {
  const real = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body)
    return { ok: true, json: async () => ({ data: body.input.map((_, i) => ({ index: i, embedding: new Array(dim).fill(0.5) })) }) }
  }
  try { return await fn() } finally { globalThis.fetch = real }
}

// ─── ① A-K12 反向判零：删除集零引用 ─────────────────────────────────────────

test("A-K12 反向判零：src/ + test/ 零索引族相对引用（删除集 = indexer/index-bin/index-discover/memory/embedding）", () => {
  const GONE = new Set(["indexer.mjs", "index-bin.mjs", "index-discover.mjs", "memory.mjs", "embedding.mjs"])
  const SRC_ROOT = join(VSC_ROOT, "src")
  const violations = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) { walk(p); continue }
      if (!e.name.endsWith(".mjs")) continue
      const code = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
      const re = /(?:^|[\s;])(?:import|export)\s+(?!\()([^;"'`]{0,400}?)\bfrom\s*["']([^"']+)["']|(?:^|[\s;])import\s*["']([^"']+)["']/g
      let m
      while ((m = re.exec(code))) {
        const spec = m[2] ?? m[3]
        if (!spec?.startsWith(".")) continue // 裸包（@thincoder/core/…）= 核面引用，不在判域
        const resolved = resolve(dirname(p), spec)
        // 相对引用解析后落在 src/ 下且命中删除集档名 ⇒ 残留引用
        if (resolved.startsWith(SRC_ROOT) && GONE.has(resolved.replaceAll("\\", "/").split("/").pop())) {
          violations.push(`${p.replaceAll("\\", "/")} → ${spec}`)
        }
      }
    }
  }
  walk(join(VSC_ROOT, "src"))
  walk(join(VSC_ROOT, "test"))
  assert.deepEqual(violations, [], `删除集零引用（实 ${violations.join(" · ")}）`)
  for (const f of ["src/indexer.mjs", "src/index-bin.mjs", "src/index-discover.mjs", "src/memory.mjs", "src/embedding.mjs"]) {
    assert.equal(existsSync(join(VSC_ROOT, ...f.split("/"))), false, `${f} 已删净`)
  }
})

// ─── ①b 配置面 `~` 展开（核 config 单点同形——防「静默换库」） ────────────────

test("①b `~` 展开：memory.dbPath / memory.projectDir 归一为主目录绝对路径（与核 config.mjs:263-264 同点）", () => {
  const cfg = join(home, ".thincoder", "config.json")
  mkdirSync(dirname(cfg), { recursive: true })
  writeFileSync(cfg, JSON.stringify({ memory: { dbPath: "~/.thincoder/memory.db", projectDir: "~/proj-mem" } }), "utf8")
  assert.equal(memoryDbPath(), join(homedir(), ".thincoder", "memory.db"), "dbPath `~` 展开 = 家目录绝对路径（否则 cwd 下落字面 `~` 树、与 CLI 不同库）")
  assert.equal(projectMemoryDir(cwd), join(homedir(), "proj-mem"), "projectDir `~` 展开 = 家目录绝对路径（非 cwd 相对拼接）")
})

// ─── ② A-K12 检索 = 核面（FTS 回退非空）+ 面板读数换源 ─────────────────────────

slow("A-K12 检索 = 核面：核 sync 后 codeSearch 命中（无 embedder → FTS 回退非空）+ 面板读数 = 核库计数", async () => {
  write("src/marker.mjs", "export function needleFunction() { return 42 }\n")
  write("README.md", "the needle doc lives here\n")
  const face = await import("@thincoder/core/memory.mjs")
  const memory = await memoryFor(cwd)
  await face.codeSync(memory, cwd, {})
  await face.docSync(memory, cwd, {})
  assert.equal(getEmbedder(), null, "无 embedder（纯 FTS 口径）")

  const hit = await codeSearchTool.execute({ query: "needleFunction", limit: 5 }, { cwd })
  assert.ok(!hit.startsWith("Error"), `code_search 面可用: ${hit}`)
  assert.match(hit, /src\/marker\.mjs/, `FTS 回退非空（实 ${hit.slice(0, 120)}）`)

  const panel = stubPanel()
  pushIndexStatus(panel)
  const msg = panel.posted.find((m) => m.type === "indexStatus")
  assert.ok(msg, "indexStatus 已推送")
  assert.equal(msg.status.built, true, "built = 核库有行")
  assert.equal(msg.status.files, 2, "files = code+doc 的 COUNT(DISTINCT path)")
  assert.equal(msg.hasEmbedder, false, "hasEmbedder 保留（核 config 面）")
  assert.equal("mismatch" in msg.status, false, "mismatch 字段退场（懒回填自然化）")

  // 面板读数按 origin 限定（他一项目的行不进本项目读数）
  const other = join(root, "other")
  mkdirSync(other, { recursive: true })
  writeFileSync(join(other, "x.mjs"), "export const x = 1\n")
  await face.codeSync(memory, other, {})
  const panel2 = stubPanel()
  pushIndexStatus(panel2)
  assert.equal(panel2.posted.find((m) => m.type === "indexStatus").status.files, 2, "读数不收他项目行（origin 限定）")
})

// ─── ③ A-K13 重建 UX：相位序列 + 完成提示 = 核读数 ────────────────────────────

slow("A-K13 重建 UX：buildIndex 相位 = scan → index → done（statusText 载荷）+ 完成提示 = 核读数", async () => {
  write("src/a.mjs", "export const a = 1\n")
  write("notes.md", "# t\n\nx\n")
  const panel = stubPanel()
  const progressLines = []
  const infos = []
  const realWithProgress = vscode.window.withProgress
  const realInfo = vscode.window.showInformationMessage
  vscode.window.withProgress = async (_opts, task) => task({ report: (p) => progressLines.push(p.message) }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) })
  vscode.window.showInformationMessage = async (text, ...btns) => { infos.push({ text, btns }); return undefined }
  try {
    await buildIndex(panel)
  } finally {
    vscode.window.withProgress = realWithProgress
    vscode.window.showInformationMessage = realInfo
  }
  const statuses = panel.posted.filter((m) => m.type === "statusText" && m.kind === "index")
  const phases = statuses.map((s) => s.phase)
  assert.ok(phases.includes("scan"), `scan 相位在案（实 ${phases.join(",")}）`)
  assert.ok(phases.includes("index"), `index 相位在案（实 ${phases.join(",")}）`)
  assert.equal(phases.at(-1), "done", "尾相位 = done（webview 清段）")
  const progress = statuses.find((s) => s.phase === "index")
  assert.equal(typeof progress.done, "number", "index 相位携 i/total（done=current）")
  assert.equal(typeof progress.total, "number")
  assert.ok(!phases.includes("embed"), "原 embed 相位退场（核同步期不产嵌入）")
  const built = infos.find((i) => i.text.startsWith("Index built:"))
  assert.ok(built, `完成提示在案（实 ${JSON.stringify(infos)}）`)
  assert.match(built.text, /^Index built: 2 files\./, "完成提示 = 核读数（code/doc 文件数）")
  assert.ok(!String(built.text).includes("Semantic search"), "无 embedder → 不报 semantic search 已启用")
})

// ─── ④ A-K13 模型变更零手动重建（失效向量置空 + 检索懒回填）───────────────────

slow("A-K13 模型变更零手动重建：换模型 → 旧向量置空 + 检索时懒回填（不产无效结果）", async () => {
  write("src/a.mjs", "export function alpha() { return 1 }\n")
  const face = await import("@thincoder/core/memory.mjs")
  const memory = await memoryFor(cwd)
  await face.codeSync(memory, cwd, {})
  const stamped = () => memory.db.prepare(`SELECT value FROM meta WHERE key = 'code_embedding_model'`).get()?.value ?? null
  const withVec = () => memory.db.prepare(`SELECT COUNT(*) AS n FROM code_chunks WHERE embedding IS NOT NULL`).get().n

  await withFetch(async () => {
    setVSCodeEmbedder({ baseURL: "http://stub.invalid/v1", model: "m1", apiKey: "k" })
    const hit1 = await codeSearchTool.execute({ query: "alpha", limit: 5 }, { cwd })
    assert.ok(!hit1.startsWith("Error"), `m1 检索可用: ${hit1}`)
    assert.equal(stamped(), "m1", "嵌入模型戳 = m1")
    assert.ok(withVec() > 0, "m1 向量已回填")
    // 模型变更：无手动重建入口——核面 = 失效置空 + 下次检索懒回填
    setVSCodeEmbedder({ baseURL: "http://stub.invalid/v1", model: "m2", apiKey: "k" })
    const hit2 = await codeSearchTool.execute({ query: "alpha", limit: 5 }, { cwd })
    assert.ok(!hit2.startsWith("Error"), `m2 检索可用: ${hit2}`)
    assert.equal(stamped(), "m2", "换模型后戳更新（自动）")
    assert.ok(withVec() > 0, "m2 向量已懒回填（零手动重建）")
  }, 4)
})

// ─── ⑤ A-K14 旧目录清退（告示一次 → 删除动作；零自动删除路径）─────────────────

test("A-K14 旧目录清退：告示恰一次（memento）→ Delete 清退；Keep 零删除；删除调用点唯一", async () => {
  const legacy = join(cwd, LEGACY_INDEX_DIR)
  mkdirSync(legacy, { recursive: true })
  writeFileSync(join(legacy, "manifest.json"), "{}")

  const prompts = []
  let answer = "Delete"
  const realInfo = vscode.window.showInformationMessage
  vscode.window.showInformationMessage = async (text, ...btns) => { prompts.push({ text, btns }); return answer }
  const memento = new Map()
  const panel = { ...stubPanel(), _context: { globalState: { get: async (k) => memento.get(k), update: async (k, v) => { memento.set(k, v) } } } }
  try {
    await maybePromptLegacyIndexRemoval(panel)
    assert.equal(prompts.length, 1, "告示一次")
    assert.deepEqual(prompts[0].btns, ["Delete", "Keep"], "两键 = [删除][保留]")
    assert.match(prompts[0].text, /\.thincoder\/index\//, "告示指名旧目录")
    assert.equal(existsSync(legacy), false, "点击 Delete → 目录清退（用户显式动作）")

    // 再建 + 再调（同 cwd）：memento 去重 ⇒ 不再告示、零自动删除
    mkdirSync(legacy, { recursive: true })
    await maybePromptLegacyIndexRemoval(panel)
    assert.equal(prompts.length, 1, "memento 去重：同项目不再告示")
    assert.equal(existsSync(legacy), true, "零自动删除（无用户动作 ⇒ 目录原样）")

    // Keep 分支：新项目 → 告示 → 保留
    answer = "Keep"
    const cwd2 = join(root, "project2")
    mkdirSync(join(cwd2, LEGACY_INDEX_DIR), { recursive: true })
    vscode.workspace.workspaceFolders = [{ uri: { fsPath: cwd2 } }]
    setProjectFolder(cwd2)
    await maybePromptLegacyIndexRemoval(panel)
    assert.equal(prompts.length, 2, "新项目独立告示")
    assert.equal(existsSync(join(cwd2, LEGACY_INDEX_DIR)), true, "Keep ⇒ 零删除")
  } finally {
    vscode.window.showInformationMessage = realInfo
  }

  // 静态唯一性：清退调用点唯一（唯一 rmSync 在 removeLegacyIndexDir 内；唯一调用方 = 告示动作）
  const src = readFileSync(join(VSC_ROOT, "src", "extension", "panel-index.mjs"), "utf8")
  assert.equal((src.match(/rmSync\(/g) ?? []).length, 1, "全档唯一删除调用")
  const panelSrc = readFileSync(join(VSC_ROOT, "src", "extension", "panel-index.mjs"), "utf8")
  const fnBody = panelSrc.slice(panelSrc.indexOf("export function removeLegacyIndexDir"))
  assert.ok(fnBody.slice(0, fnBody.indexOf("\n}")).includes("rmSync("), "唯一删除住在 removeLegacyIndexDir 内")
  const callers = [...readdirSync(join(VSC_ROOT, "src", "extension")).map((f) => join(VSC_ROOT, "src", "extension", f))]
    .filter((f) => f.endsWith(".mjs") && readFileSync(f, "utf8").includes("removeLegacyIndexDir(") && !f.endsWith("panel-index.mjs"))
  assert.deepEqual(callers, [], "删除动作不被其他档调用（调用点 = 告示动作内）")
})

// ─── ⑥ VP-9 可见化（核面承接重述）：unlisted → 完成提示含声明指路 ──────────────

slow("可见化（核面承接）：未列入扩展名 → 完成提示含提示行（声明指路逐字）", async () => {
  write("src/a.mjs", "export const a = 1\n")
  write("src/x.qqq", "x\n")
  write("src/y.qqq", "y\n")
  const panel = stubPanel()
  const infos = []
  const realInfo = vscode.window.showInformationMessage
  vscode.window.showInformationMessage = async (text) => { infos.push(text); return undefined }
  try {
    await buildIndex(panel)
  } finally {
    vscode.window.showInformationMessage = realInfo
  }
  const built = infos.find((t) => String(t).startsWith("Index built:"))
  assert.ok(built, "完成提示在案")
  assert.ok(String(built).includes("2 file(s) skipped — extensions not indexed: .qqq; declare index.codeExtensions in .thincoder/conventions.json to include them."), `未列入提示行（实 ${built}）`)
})
