/**
 * 2026-10-07-vsc-provider-proxy-fix.test.mjs — 批档单元件（随批档存档；直接跑：node --test）。
 *
 * 复现件（红→绿对）：
 *  ① core `isLoopbackTarget` —— loopback 判定（新增面）。
 *  ② core `proxyFetch`：loopback 目标即便带代理串也走直连（死代理不拦）。
 *  ③ VSC `testProviderConnection`：「网页代理在案」时，本地渠道探针仍直连并拉出列表
 *     （= 用户 2026-10-07 案：localhost:8787 渠道「测试连接」被塞进企业代理 → 403 假红）。
 *
 * 用 temp 配置注入（`_setConfigPathForTest`）——绝不触碰真 `~/.thincoder/config.json`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CORE = new URL("../../thincoder-core/", import.meta.url).href
const VSC = new URL("../../thincoder-vscode/src/extension/", import.meta.url).href

// ── vscode 桩（扩展模块在纯 node 下解析 "vscode" 用；命名导出 = src/extension 的实际引用面）──
import { registerHooks } from "node:module"
const STUB_VSCODE = "data:text/javascript," + encodeURIComponent(`
const anything = new Proxy(function(){}, { get: () => anything, apply: () => anything, construct: () => anything })
export const window = anything, workspace = anything, commands = anything, Uri = anything, env = anything,
  ConfigurationTarget = anything, ProgressLocation = anything, StatusBarAlignment = anything, ThemeColor = anything,
  Position = anything, Range = anything, Selection = anything, CancellationToken = anything, MarkdownString = anything,
  RelativePattern = anything, ExtensionContext = anything, WebviewView = anything, WebviewViewResolveContext = anything,
  openFolder = anything, diff = anything
`)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: STUB_VSCODE, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

/** 起一个 127.0.0.1 上的 mock「网关」（GET /v1/models → 一条模型）。 */
async function mockGateway() {
  const srv = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ object: "list", data: [{ id: "team/team-chat", object: "model" }] }))
  })
  await new Promise((r) => srv.listen(0, "127.0.0.1", r))
  return { srv, port: srv.address().port, close: () => { srv.close(); srv.closeAllConnections?.() } }
}

test("① isLoopbackTarget：localhost ∥ 127/8 ∥ ::1 命中；近似串不误伤", async () => {
  const { isLoopbackTarget } = await import(CORE + "proxy.mjs")
  assert.equal(typeof isLoopbackTarget, "function", "proxy.mjs 应导出 isLoopbackTarget")
  assert.equal(isLoopbackTarget("http://localhost:8787/v1/models"), true)
  assert.equal(isLoopbackTarget("http://localhost.:8787/"), true) // 尾点归一
  assert.equal(isLoopbackTarget("http://127.0.0.1:1/"), true)
  assert.equal(isLoopbackTarget("http://127.9.9.9:99/x"), true)
  assert.equal(isLoopbackTarget("http://[::1]:8787/v1"), true)
  assert.equal(isLoopbackTarget("https://api.deepseek.com"), false)
  assert.equal(isLoopbackTarget("http://10.0.0.9:8000/v1"), false)
  assert.equal(isLoopbackTarget("http://127.0.0.1.evil.com/"), false) // 前缀不误伤
  assert.equal(isLoopbackTarget("not a url"), false)
})

test("② proxyFetch：loopback 目标带死代理串 ⇒ 仍直连命中（旧代码 = 红）", async () => {
  const { proxyFetch } = await import(CORE + "proxy.mjs")
  const gw = await mockGateway()
  try {
    const res = await proxyFetch(`http://127.0.0.1:${gw.port}/v1/models`, {}, "http://127.0.0.1:1")
    assert.equal(res.ok, true)
    assert.equal(res.status, 200)
    const body = await res.text()
    assert.match(body, /team\/team-chat/)
  } finally { gw.close() }
})

test("③ testProviderConnection：网页代理在案（死代理），本地渠道探针直连拉出列表（旧代码 = 红）", async () => {
  const { _setConfigPathForTest, _resetConfigPathForTest } = await import(CORE + "config-io.mjs")
  const { testProviderConnection } = await import(VSC + "settings.mjs")
  const gw = await mockGateway()
  const dir = mkdtempSync(join(tmpdir(), "tc-proxy-fix-"))
  const cfgPath = join(dir, "config.json")
  // temp 注入用途 = 隔离真配置 + 旧读点回归绊线（`web: true` + 死代理串）：修后探针路径不取它——绊线判别力依赖 `CORE` 模块实例同一性（若回退取全局 `web` 旗即复红）。
  writeFileSync(cfgPath, JSON.stringify({
    // 现行代码把探针路由此器——死端口 1；修后应完全不取它
    proxy: { uri: "http://127.0.0.1:1", web: true, model: false },
    providers: [],
  }))
  _setConfigPathForTest(cfgPath)
  try {
    const r = await testProviderConnection({ baseURL: `http://127.0.0.1:${gw.port}/v1`, apiKey: "sk-tc-test", format: "openai" })
    assert.equal(r.ok, true, `探针应直连成功（实际: ${r.error ?? "?"}）`)
    assert.deepEqual(r.models, ["team/team-chat"])
  } finally {
    _resetConfigPathForTest()
    gw.close()
  }
})
