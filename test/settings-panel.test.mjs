/**
 * settings-panel.test.mjs — VSC 设置面板并发池三框（POOL-CONFIG-UNIFIED F-4/AC-4，
 * 2026-09-09）：
 * ① extension 面：agentSettings() 快照 poolLimits 三键回退（无配置 → 4/4/4——config-io
 *    测试缝隔离）——settings.mjs 回退对象含 advisor；
 * ② webview 面：agentCardHtml() 三数字框（ag-pool-engcoder/ag-pool-other/ag-pool-
 *    advisor）——默认/部分配置逐键回退 ?? 4——自定义值如实显示。
 * happy-dom 环境（helpers/webview-env.mjs）——无真实 vscode/网络/磁盘。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setupWebview } from "./helpers/webview-env.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

// ─── webview 环境（happy-dom + en locale + vscode stub）──────────────
let wv
before(() => { wv = setupWebview() })
after(() => { wv?.cleanup() })

// settings-agent.js 经 i18n t() 渲染——locale 由 setupWebview 注入；SS 预置状态后
// agentCardHtml() 纯字符串构建。模块 import 面（settings-models/model-menu 链）可能
// 触碰 DOM——须在 happy-dom 注册（before 钩子）之后加载——惰性单例。
let _webviewMods = null
async function webviewMods() {
  if (!_webviewMods) {
    _webviewMods = {
      agentCardHtml: (await import("../webview/settings-agent.js")).agentCardHtml,
      SS: (await import("../webview/settings-state.js")).SS,
    }
  }
  return _webviewMods
}

test("② webview 面：无配置 → 三数字框显 4/4/4（ag-pool-advisor 第三框存在）", async () => {
  const { agentCardHtml, SS } = await webviewMods()
  SS.agentSettings = { poolLimits: null }
  const html = agentCardHtml()
  assert.ok(/id="ag-pool-advisor"[^>]*value="4"/.test(html), "advisor 第三框显 4")
  assert.ok(/id="ag-pool-engcoder"[^>]*value="4"/.test(html), "eng-coder 框显 4")
  assert.ok(/id="ag-pool-other"[^>]*value="4"/.test(html), "other 框显 4")
})

test("② webview 面：部分配置（旧 2 键对象）→ advisor 框逐键回退显 4", async () => {
  const { agentCardHtml, SS } = await webviewMods()
  SS.agentSettings = { poolLimits: { engCoder: 6 } }
  const html = agentCardHtml()
  assert.ok(/id="ag-pool-advisor"[^>]*value="4"/.test(html), "无 advisor 键 → ?? 4 回退")
  assert.ok(/id="ag-pool-engcoder"[^>]*value="6"/.test(html), "engCoder=6 如实显示")
})

test("② webview 面：三键自定义 → 三框如实显示 2/3/6", async () => {
  const { agentCardHtml, SS } = await webviewMods()
  SS.agentSettings = { poolLimits: { engCoder: 2, other: 3, advisor: 6 } }
  const html = agentCardHtml()
  assert.ok(/id="ag-pool-advisor"[^>]*value="6"/.test(html))
  assert.ok(/id="ag-pool-engcoder"[^>]*value="2"/.test(html))
  assert.ok(/id="ag-pool-other"[^>]*value="3"/.test(html))
})

test("① extension 面：无配置 → agentSettings() 快照 poolLimits 三键 4/4/4（回退显 4）", async () => {
  // 动态 import（settings.mjs 链条无 vscode 依赖——纯 node——config 路径测试缝隔离）
  const cfgTmp = mkdtempSync(join(tmpdir(), "tc-panel-cfg-"))
  writeFileSync(join(cfgTmp, "config.json"), "{}", "utf8")
  _setConfigPathForTest(join(cfgTmp, "config.json"))
  try {
    const { agentSettings } = await import("../src/extension/settings.mjs")
    const s = agentSettings(null)
    assert.deepEqual(s.poolLimits, { engCoder: 4, other: 4, advisor: 4 }, "快照 poolLimits 三键 4/4/4")
    assert.deepEqual(s.poolLimits.advisor, 4, "advisor 键在快照中")
  } finally {
    _setConfigPathForTest(null)
    try { rmSync(cfgTmp, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

// 本文件同时锚定 settings.poolAdvisor 文案存在（webview 渲染用 t()——缺键渲染空串）
test("locales：poolAdvisor/poolAdvisorHelp 双语文案存在（en/zh 对称）", () => {
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  assert.ok(en["settings.poolAdvisor"] && en["settings.poolAdvisorHelp"], "en 文案存在")
  assert.ok(zh["settings.poolAdvisor"] && zh["settings.poolAdvisorHelp"], "zh 文案存在")
  assert.equal(typeof en["settings.poolAdvisorHelp"], "string")
})
