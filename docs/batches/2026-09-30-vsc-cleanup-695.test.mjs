/**
 * 2026-09-30-vsc-cleanup-695.test.mjs — 批内件 #695（fromPanel 写路径失败面：10 新站点接入 `postProviderError`）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-30-vsc-cleanup-695.test.mjs`
 * 不入仓套件 · 随批留存归档（组界 = #695 组 ∥ #701 组——批档 §2.7 行 13：预估 ≈250–350 行、超 300 即按组拆两档 ⇒ 本件 = #695 组）。
 *
 * 腿（判据语义 = 批档 §2.2 表 ∕ §2.10 修复表）：
 *   T1（面① · 逐站）：10 新站点 × 冲突注入 ⇒ 各恰一条 `{type:"providerError", scope, reason:"mtime-conflict"}`
 *   T2（负控 · 逐站）：正常写真 ⇒ 零 `providerError` ∧ 盘面落写
 *   T3（面②）：`reportHandlerError` 直驱（多行消息）⇒ `{scope:"panel", reason:首行}` + `console.error` 保留；
 *       结构锁 = 分发表调用点在位
 *   T4（负控 · 面②）：正常处理链 ⇒ 零发射
 *
 * 冲突注入（两式合 = 批档 §2.2「注入建议」；对站点可观察面等价——`CONFIG_CONFLICT_HINT` → `reason:"mtime-conflict"`）：
 *   ① vscPersistRaw 各站 = **窗内外部写**（#675 先例）：`persistRaw` 边界包装——armed 时在真实写窗口
 *      （read 后 ∕ 写前 stat 前）落对端写 ⇒ 走核真冲突检测（mtime 比对，非仿制）；
 *   ② 不可窗触站（`setProviderKey` ∕ `removeProviderKeyFromConfig`——核内直持写执行体、模块边界不可达）
 *      = **模块短接**：armed 时直返核归一串 `conflictError({ok:false,reason:"mtime-conflict"})`（= 核真冲突返回值）。
 * ⑨ 写入口选形：`settings.saveMcpServer` = add→update 回退链——新条目冲突在 add 已吞（update 回退返
 *   not-found 串，链既有形态、非本批引入）；本腿按「各站写入体选位」注入到链内可达冲突的写（既有条目
 *   ⇒ update 分支），站可观察面 = T1 期望形。
 * vscode 桩 = `2026-09-30-vsc-residuals.test.mjs` 先例（registerHooks 短接——只供装载，行为面零触）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：核 configDir 于模组装载期取值——一切动态 import 之前覆盖，防误写真实配置）
const _home = mkdtempSync(join(tmpdir(), "vsc-cleanup-695-home-"))
process.env.HOME = _home
process.env.USERPROFILE = _home

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const src = (rel) => readFileSync(join(ROOT, rel), "utf8")

// ─── vscode 桩 + 假 config-io（registerHooks 短接）───────────────────────────────

const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }), onDidChangeWorkspaceFolders: () => ({ dispose() {} }), findFiles: async () => [], getWorkspaceFolder: () => null }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined, showQuickPick: async () => undefined, showInputBox: async () => undefined, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }), activeTerminal: null, terminals: [], createTerminal: () => ({ show() {}, sendText() {}, dispose() {} }), onDidChangeTerminalShellIntegration: () => ({ dispose() {} }), onDidChangeActiveTextEditor: () => ({ dispose() {} }), withProgress: async (_o, fn) => fn({ report() {} }) }
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class MarkdownString { constructor(v) { this.value = v } }
export class ThemeColor { constructor(id) { this.id = id } }
export class ThemeIcon { constructor(id) { this.id = id } }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ViewColumn = { One: 1 }
export const env = { openExternal: async () => undefined, language: "en" }
export const extensions = { getExtension: () => null }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }), getDiagnostics: () => [] }
export class Position { constructor(line, ch) { this.line = line; this.character = ch } }
export class Range { constructor(s, e) { this.start = s; this.end = e } }
export const SymbolKind = {}
`)

// 假 config-io：边界包装（export * 全量转发真件；仅三写执行体 armed 期短路/注入）
const CORE_IO = core("config-io.mjs")
const FAKE_IO_URL = "data:text/javascript," + encodeURIComponent(`
import * as real from ${JSON.stringify(CORE_IO)}
export * from ${JSON.stringify(CORE_IO)}
const armed = () => globalThis.__vscCleanupArmed === true
/** ① 窗内外部写：对端在核写窗口（read 后 ∕ 写前 stat 前）落一次写——内容逐字保持、mtime 前推（确定相异）。 */
function windowWrite() { if (typeof globalThis.__vscCleanupWindowWrite === "function") globalThis.__vscCleanupWindowWrite() }
/** ② 核冲突归一串（= 真冲突时核写执行体返回值——短接形，见档头）。 */
const conflictOf = (r) => real.conflictError(r)
export function persistRaw(mutate, opts = {}) {
  if (!armed()) return real.persistRaw(mutate, opts)
  return real.persistRaw((raw) => { mutate(raw); windowWrite() }, opts)
}
export function setProviderKey(name, key) {
  if (!armed()) return real.setProviderKey(name, key)
  return conflictOf({ ok: false, reason: "mtime-conflict" })
}
export function removeProviderKeyFromConfig(name) {
  if (!armed()) return real.removeProviderKeyFromConfig(name)
  return conflictOf({ ok: false, reason: "mtime-conflict" })
}
`)

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    if (specifier === "@thincoder/core/config-io.mjs") return { url: FAKE_IO_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

// ─── 载具：真链直驱（stub panel 绑真 push 层——panel-settings-push / panel-index） ──────────────

const coreIo = await import(core("config-io.mjs"))
const { saveEmbeddingConfig } = await import(vsc("src/extension/panel-index.mjs"))
const { saveProviderKey, deleteProviderKey, saveMcpServer, deleteMcpServer } = await import(vsc("src/extension/panel-settings-push.mjs"))
const {
  handleSaveShellSettings, handleSaveWebsearchKey, handleDeleteWebsearchKey, handleSetProviderProxy,
  handleSaveEmbedKey, handleDeleteEmbedKey, handleSaveProviderKey, handleDeleteProviderKey,
  handleSaveMcpServer, handleDeleteMcpServer,
} = await import(vsc("src/extension/panel-messages-settings.mjs"))

// M9 探针（写路径后置步）：核内探针链为另一模块身份（realpath 盘符 ∕ 姊妹档 701 同因），其配置读 =
// 重定向 HOME（本件不落该处）⇒ 无渠道 ⇒ `probeProviderAdmission` 早退——本件零网面；断言不依赖探针。

const mkPanel = (sink) => {
  const p = {
    _panel: { webview: { postMessage: (m) => sink.push(m) } },
    _pushSettingsLight: () => sink.push({ type: "pushedLight" }),
    _pushSettings: () => sink.push({ type: "pushed" }),
    _pushMcpStatus: () => sink.push({ type: "pushedMcp" }),
    _pushStatus: () => sink.push({ type: "pushedStatus" }),
  }
  // ChatPanel 薄委托同形绑定（panel-settings-push ∕ panel-index 真件）
  p._saveEmbeddingConfig = (cfg) => saveEmbeddingConfig(p, cfg)
  p._saveProviderKey = (name, key) => saveProviderKey(p, name, key)
  p._deleteProviderKey = (name) => deleteProviderKey(p, name)
  p._saveMcpServer = (name, cfg) => saveMcpServer(p, name, cfg)
  p._deleteMcpServer = (name) => deleteMcpServer(p, name)
  return p
}

// ─── 逐站表（10 站——scope ∕ 驱动 ∕ 盘面判据；行号 = 批档 §2.2 表 ∕ §2.10 逐处） ───────────────

const MCP_ONE = { mcp: { servers: [{ name: "alpha", command: "old" }] } }
const SITES = [
  { id: "① :190 shell", scope: "env", push: "pushedLight", seed: {},
    drive: (p) => handleSaveShellSettings(p, { value: "/bin/zsh" }),
    check: (raw) => assert.equal(raw.shell, "/bin/zsh", "盘面落写") },
  { id: "② :107 websearch save", scope: "tools", push: "pushedLight", seed: {},
    drive: (p) => handleSaveWebsearchKey(p, { key: "tvly-test" }),
    check: (raw) => assert.equal(raw.websearch?.apiKey, "tvly-test", "盘面落写") },
  { id: "③ :110 websearch delete", scope: "tools", push: "pushedLight", seed: { websearch: { apiKey: "tvly-old" } },
    drive: (p) => handleDeleteWebsearchKey(p),
    check: (raw) => assert.equal(raw.websearch?.apiKey, undefined, "盘面 key 清空") },
  { id: "④ :92 provider-proxy", scope: "providers", push: "pushedLight",
    seed: { providers: [{ name: "alpha", baseURL: "http://127.0.0.1:9/v1" }] },
    drive: (p) => handleSetProviderProxy(p, { name: "alpha", proxy: true }),
    check: (raw) => assert.equal(raw.providers[0].proxy, true, "盘面落写") },
  { id: "⑤ :101 embed save", scope: "tools", push: null, seed: {},
    drive: (p) => handleSaveEmbedKey(p, { key: "sk-embed" }),
    check: (raw) => assert.equal(raw.embedding?.apiKey, "sk-embed", "盘面落写") },
  { id: "⑥ :104 embed delete", scope: "tools", push: null,
    seed: { embedding: { apiKey: "sk-old", baseURL: "http://127.0.0.1:9/v1", model: "m" } },
    drive: (p) => handleDeleteEmbedKey(p),
    check: (raw) => assert.equal(raw.embedding?.apiKey, undefined, "盘面 key 清空") },
  { id: "⑦ :29 provider-key save", scope: "providers", push: "pushedStatus",
    seed: { providers: [{ name: "alpha", baseURL: "http://127.0.0.1:9/v1" }] },
    drive: (p) => handleSaveProviderKey(p, { name: "alpha", key: "sk-x" }),
    check: (raw) => assert.equal(raw.providers[0].apiKey, "sk-x", "盘面落写") },
  { id: "⑧ :32 provider-key delete", scope: "providers", push: "pushedStatus",
    seed: { providers: [{ name: "alpha", apiKey: "sk-old", baseURL: "http://127.0.0.1:9/v1" }] },
    drive: (p) => handleDeleteProviderKey(p, { name: "alpha" }),
    check: (raw) => assert.equal(raw.providers[0].apiKey, undefined, "盘面 key 清空") },
  { id: "⑨ :35 mcp save", scope: "mcp", push: "pushedMcp", seed: MCP_ONE,
    drive: (p) => handleSaveMcpServer(p, { name: "alpha", config: { command: "new" } }),
    check: (raw) => assert.equal(raw.mcp.servers[0].command, "new", "盘面落写（update 分支）") },
  { id: "⑩ :38 mcp delete", scope: "mcp", push: "pushedMcp", seed: { mcp: { servers: [{ name: "alpha", command: "x" }] } },
    drive: (p) => handleDeleteMcpServer(p, { name: "alpha" }),
    check: (raw) => assert.equal(raw.mcp.servers.length, 0, "盘面条目清空") },
]

const tmpCfg = (seed) => {
  const dir = mkdtempSync(join(tmpdir(), "vsc-cleanup-695-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed, null, 2) + "\n")
  return cfg
}

let _bump = 0
const armWindowWrite = (cfg) => {
  globalThis.__vscCleanupWindowWrite = () => {
    writeFileSync(cfg, readFileSync(cfg, "utf8")) // 对端写：内容逐字保持、时间戳前推
    const t = Date.now() + 60_000 + (++_bump) * 1000
    utimesSync(cfg, new Date(t), new Date(t))
  }
  globalThis.__vscCleanupArmed = true
}
const disarm = () => { globalThis.__vscCleanupArmed = false }

// ─── T1：10 新站点 × 冲突注入 ⇒ 各恰一条 ──────────────────────────────────────────

for (const site of SITES) {
  test(`T1 ${site.id}：冲突注入 ⇒ 恰一条 {scope:'${site.scope}', reason:'mtime-conflict'}`, async () => {
    const cfg = tmpCfg(site.seed)
    coreIo._setConfigPathForTest(cfg)
    try {
      armWindowWrite(cfg)
      const sink = []
      const panel = mkPanel(sink)
      await site.drive(panel)
      disarm()
      const errors = sink.filter((m) => m.type === "providerError")
      assert.equal(errors.length, 1, `${site.id}：恰一条发射（实读 ${JSON.stringify(sink)}）`)
      assert.deepEqual(errors[0], { type: "providerError", scope: site.scope, reason: "mtime-conflict" }, site.id)
      if (site.push) assert.ok(sink.some((m) => m.type === site.push), `${site.id}：原回推行保留（${site.push}）`)
    } finally {
      disarm()
      coreIo._resetConfigPathForTest()
    }
  })
}

test("T1 ⑧b 次级写（custom 清理）不叠发：主写冲突 ⇒ 仍恰一条", async () => {
  const cfg = tmpCfg({ providers: [{ name: "custom", apiKey: "sk-c", baseURL: "http://127.0.0.1:9/v1", model: "m" }] })
  coreIo._setConfigPathForTest(cfg)
  try {
    armWindowWrite(cfg)
    const sink = []
    await handleDeleteProviderKey(mkPanel(sink), { name: "custom" })
    disarm()
    const errors = sink.filter((m) => m.type === "providerError")
    assert.equal(errors.length, 1, `次级写不叠发（实读 ${JSON.stringify(sink)}）`)
    assert.deepEqual(errors[0], { type: "providerError", scope: "providers", reason: "mtime-conflict" })
  } finally {
    disarm()
    coreIo._resetConfigPathForTest()
  }
})

// ─── T2：负控 · 逐站（正常写真 ⇒ 零发射 ∧ 盘面落写） ─────────────────────────────

for (const site of SITES) {
  test(`T2 ${site.id}：正常写真 ⇒ 零 providerError ∧ 盘面落写`, async () => {
    const cfg = tmpCfg(site.seed)
    coreIo._setConfigPathForTest(cfg)
    try {
      const sink = []
      await site.drive(mkPanel(sink))
      assert.equal(sink.filter((m) => m.type === "providerError").length, 0, `${site.id}：零失败面发射`)
      if (site.push) assert.ok(sink.some((m) => m.type === site.push), `${site.id}：回推行在位`)
      site.check(JSON.parse(readFileSync(cfg, "utf8")))
    } finally {
      coreIo._resetConfigPathForTest()
    }
  })
}

// ─── T3 ∕ T4：面②（分发表单点收口） ─────────────────────────────────────────────

/** console.error 捕获（记录面断言 + 输出降噪；异常径恢复原函数）。 */
async function capturing(fn) {
  const orig = console.error
  const lines = []
  console.error = (...a) => lines.push(a.join(" "))
  try { return { result: await fn(), lines } } finally { console.error = orig }
}

test("T3 面② `reportHandlerError` 直驱：多行消息 ⇒ {scope:'panel', reason:首行}；console.error 保留", async () => {
  const { reportHandlerError } = await import(vsc("src/extension/chat-panel.mjs"))
  const sink = []
  const panel = { _panel: { webview: { postMessage: (m) => sink.push(m) } } }
  const { lines } = await capturing(async () => {
    reportHandlerError(panel, new Error("config file not parseable — refusing to overwrite: /x\n  at line 2"))
  })
  assert.deepEqual(sink, [{ type: "providerError", scope: "panel", reason: "config file not parseable — refusing to overwrite: /x" }], "首行截取 + panel scope（零段标形）")
  assert.ok(lines.length >= 1 && lines[0].includes("message handler"), "console.error 保留（宿主日志面）")
  sink.length = 0
  const { lines: lines2 } = await capturing(async () => { reportHandlerError(panel, "boom\nsecond") })
  assert.deepEqual(sink, [{ type: "providerError", scope: "panel", reason: "boom" }], "非 Error 抛件同式（String(e) 首行）")
  assert.ok(lines2.length >= 1, "console.error 保留（非 Error 径）")
  // 结构锁：分发表调用点在位（chat-panel.mjs 消息入口）
  assert.match(src("thincoder-vscode/src/extension/chat-panel.mjs"), /\.catch\(\(e\) => reportHandlerError\(this, e\)\)/, "分发表调用点")
})

test("T4 负控 · 面②：正常处理链（含分发表组合形）⇒ 零发射", async () => {
  const { handlePanelMessage } = await import(vsc("src/extension/panel-messages.mjs"))
  const { reportHandlerError } = await import(vsc("src/extension/chat-panel.mjs"))
  const sink = []
  const panel = mkPanel(sink)
  // 分发表组合形（chat-panel.mjs 消息入口同式）：正常消息 ⇒ 不触兜底
  await handlePanelMessage(panel, { type: "getMcpStatus" }).catch((e) => reportHandlerError(panel, e))
  await handlePanelMessage(panel, { type: "noSuchMessageType" }).catch((e) => reportHandlerError(panel, e))
  assert.equal(sink.filter((m) => m.type === "providerError").length, 0, "正常处理链零失败面发射")
  assert.equal(sink.some((m) => m.type === "pushedMcp"), true, "正常链照常工作（getMcpStatus 回推在位）")
})
