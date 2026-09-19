/**
 * config-pool.test.mjs — 并发池统一可配置（POOL-CONFIG-UNIFIED，2026-09-09——VSC 端）：
 * F-1 耦合锁（AGENT_DEFAULTS ↔ 运行时常量/回退 ↔ 调度器 effectivePoolLimits 第三键
 * 4/4/4）/ F-2 advisor 读取器（合法覆盖/非法回退——判定点读生效上限——ED-4 后池满 +
 * 异 scope ⇒ 排队——ack 含 queued + position）/ F-5 同 scope 守卫（_advisorRuns running
 * 记录同 scope 拒）/ F-4 白名单（panel 写面
 * 三键——非法键丢弃——全非法删整键）+ 落盘 + 读取回退。纯单元：拒发/排队路径在
 * entry.start 前返回（成功路径不驱动 launch——无真实评审）——config 经
 * _setConfigPathForTest 隔离。
 *
 * 面板显示面（合并自 settings-panel.test.mjs——2026-09-11 TEST-LIFECYCLE 扫① 合档）：同
 * 板块凝聚——extension 面 agentSettings() 快照回退 + webview 面 agentCardHtml() 三数字框
 * 逐键回退 + poolAdvisor 双语文案；happy-dom 环境沿 helpers/webview-env.mjs 先例。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { setupWebview } from "./helpers/webview-env.mjs"
import {
  DEFAULTS, _setConfigPathForTest,
} from "@thincoder/core/config.mjs"
import { loadAgentSettings, saveAgentSettingsFromPanel } from "../src/extension/settings.mjs"
import { loadRaw } from "@thincoder/core/config-io.mjs"
// W12（2026-09-15）：advisor 池面改指核单源（原 `../src/agent-tools/advisor-async.mjs` 随镜像
// 删旧退役）——`launchAsyncAdvisor(parent, ctx, launch)` 核签名（拒发路径文案 = 核逐字）。
import {
  ADVISOR_POOL_LIMIT, resolveAdvisorPoolLimit, advisorPoolLimitFor, launchAsyncAdvisor, resolveAdvisorLaunch,
} from "@thincoder/core/agent-tools/advisor-async.mjs"
import { docSetKey } from "@thincoder/core/agent-tools/review-facts.mjs"
// W13（2026-09-15）：池常量/回归读取器 = 核单源（原 `../src/agent-tools/subagent-scheduler.mjs`
// 镜像删旧）；核 `poolLimitsFor` 两域键（engCoder/other）+ advisor 第三键归核 advisor-async 读取器。
import { ASYNC_POOL_LIMITS, poolLimitsFor } from "@thincoder/core/agent-tools/subagent-async.mjs"

// ─── config 隔离（无真实 ~/.thincoder 触碰）+ webview 环境（happy-dom + en locale + vscode stub）──
let _cfg
let _wv
before(() => {
  _cfg = mkdtempSync(join(tmpdir(), "tc-pool-cfg-"))
  writeFileSync(join(_cfg, "config.json"), "{}", "utf8")
  _setConfigPathForTest(join(_cfg, "config.json"))
  _wv = setupWebview()
})
after(() => {
  _setConfigPathForTest(null)
  _wv?.cleanup()
  try { rmSync(_cfg, { recursive: true, force: true }) } catch { /* ignore */ }
})

const mkParent = (over = {}) => ({
  cwd: "C:/proj", config: { agent: {} }, history: {}, _asyncAdvisors: new Map(), ...over,
})

/** 拒发路径的 launch 请求（核签名——拒发在 entry.start 前返回，不触真评审）。 */
function tryLaunch(parent, reviewType, documents, poolLimits) {
  const cfg = { config: { agent: { ...(poolLimits ? { poolLimits } : {}) } } }
  const p = { ...parent, ...cfg }
  // 核 launch 需解析后的实例（`run`）——同源解析面（不另建分叉）。
  const inst = resolveAdvisorLaunch(p, reviewType, { documents })
  return launchAsyncAdvisor(p, { cwd: "C:/proj" }, {
    reviewType, documents, paths: null, object: null, run: inst.run, designId: inst.designId, designToken: null,
  })
}

test("F-1 耦合锁：DEFAULTS.agent.poolLimits/常量/scheduler 回退三键 4/4/4（默认全链路真实）", () => {
  const d = DEFAULTS.agent.poolLimits
  assert.deepEqual(d, { engCoder: 4, other: 4, advisor: 4 }, "DEFAULTS.agent.poolLimits 三键 4/4/4")
  assert.equal(ADVISOR_POOL_LIMIT, 4, "ADVISOR_POOL_LIMIT = 4（2 → 4）")
  assert.equal(d.advisor, ADVISOR_POOL_LIMIT, "默认与运行时常量同值")
  assert.equal(ASYNC_POOL_LIMITS.engCoder, d.engCoder)
  assert.equal(ASYNC_POOL_LIMITS.other, d.other)
  assert.deepEqual(Object.keys(ASYNC_POOL_LIMITS).sort(), ["engCoder", "other"], "subagent 常量表两键不变")
  // 核读面：`poolLimitsFor` 两域键回退 + advisor 第三键经核 advisor 读取器（W13 形式）
  const eff = poolLimitsFor(null)
  assert.deepEqual({ ...eff, advisor: advisorPoolLimitFor(null) }, { engCoder: 4, other: 4, advisor: 4 })
})

test("F-1 无配置 → loadAgentSettings 回退三键默认 4/4/4", () => {
  const s = loadAgentSettings()
  assert.deepEqual(s.poolLimits, { engCoder: 4, other: 4, advisor: 4 }, "读回退三键")
})

test("F-2 读取器：合法覆盖生效 / 非法与缺省回退 4", () => {
  assert.equal(resolveAdvisorPoolLimit({ advisor: 6 }), 6)
  assert.equal(advisorPoolLimitFor({ config: { agent: { poolLimits: { advisor: 6 } } } }), 6)
  for (const bad of [{ advisor: "abc" }, { advisor: 0 }, { advisor: -1 }, { advisor: 2.5 }, {}, null, undefined]) {
    assert.equal(resolveAdvisorPoolLimit(bad), 4, `非法/缺省回退 4: ${JSON.stringify(bad)}`)
  }
})

test("F-2 判定点：池满 + 异 scope ⇒ 排队——缺省 4（4 running + 第 5 排队——ack 含 queued + position）", () => {
  const pool = new Map([1, 2, 3, 4].map((i) => [`e${i}`, { id: i, role: "advisor", status: "running" }]))
  const parent = mkParent({ _asyncAdvisors: pool })
  const r = tryLaunch(parent, "design", ["docs/a.md"])
  assert.equal(r.error, undefined, "异 scope 池满 → 排队非拒（ED-4——原 ②-6a 拒发退役）")
  assert.equal(r.queued, true, "ack 含 queued")
  assert.equal(r.position, 1, "ack 含 position")
})

test("F-2 判定点：配置覆盖后按生效上限排队（advisor=1——第 2 个排队——ack 报 position）", () => {
  const pool = new Map([["e1", { id: 1, role: "advisor", status: "running" }]])
  const parent = mkParent({ _asyncAdvisors: pool })
  const r = tryLaunch(parent, "design", ["docs/a.md"], { advisor: 1 })
  assert.equal(r.error, undefined, "配置 advisor=1 池满 + 异 scope → 排队非拒")
  assert.equal(r.queued, true, "ack 含 queued")
  assert.equal(r.position, 1, "ack 报 position（读 config——非死常量）")
})

test("F-5 同 scope 守卫：同 type+scope running 池条目 → 拒（核 runningAdvisorOfScope 语义）", () => {
  // W12 改判：核同 scope 守卫读**池条目**（`run.docSetKey`），非端侧 `_advisorRuns` 记录。
  const parent = mkParent({ cwd: "C:/proj", _asyncAdvisors: new Map([["1", {
    id: 1, role: "advisor", status: "running", reviewType: "design",
    run: { docSetKey: docSetKey(["docs/x.md"], "C:/proj") },
  }]]) })
  const r = tryLaunch(parent, "design", ["docs/x.md"])
  assert.ok(r.error, "同 scope running 条目 → 拒")
  assert.ok(r.error.includes("此 scope 已有评审在跑"), "拒文案含指引")
  assert.ok(r.error.includes("still running"), "scope 语义")
})

test("F-4 白名单：panel 写面三键——非法键丢弃——全非法删整键（saveAgentSettingsFromPanel 直写盘——断言落盘结果）", () => {
  // 三键合法 → 全落盘
  saveAgentSettingsFromPanel({ poolLimits: { engCoder: 2, other: 3, advisor: 6 } })
  assert.deepEqual(loadAgentSettings().poolLimits, { engCoder: 2, other: 3, advisor: 6 }, "三键合法 → 全落盘")
  // 非法键丢弃（other=0 非法——advisor="abc" 非法——合法键保留）
  saveAgentSettingsFromPanel({ poolLimits: { engCoder: 5, advisor: "abc", other: 0 } })
  assert.deepEqual(loadAgentSettings().poolLimits, { engCoder: 5 }, "非法 advisor/other 键丢弃——合法键保留")
  // 全非法 → 删整键（loadAgentSettings 合并回退默认三键 4/4/4）
  saveAgentSettingsFromPanel({ poolLimits: { engCoder: "x", advisor: 0, other: null } })
  assert.equal(loadRaw().agent.poolLimits, undefined, "全非法 → 删整键")
  assert.deepEqual(loadAgentSettings().poolLimits, { engCoder: 4, other: 4, advisor: 4 }, "删键后读回退默认三键")
})

test("F-4 落盘：面板三键 → 磁盘读回 + 生效读取（saveAgentSettingsFromPanel 自持落盘）", () => {
  saveAgentSettingsFromPanel({ poolLimits: { engCoder: 2, other: 3, advisor: 7 } })
  const raw = loadRaw()
  assert.deepEqual(raw.agent.poolLimits, { engCoder: 2, other: 3, advisor: 7 }, "磁盘落盘三键")
  assert.equal(loadAgentSettings().poolLimits.advisor, 7, "运行读取回 advisor=7")
})

// ═══ 面板显示面（合并自 settings-panel.test.mjs——2026-09-11 TEST-LIFECYCLE 扫① 合档）═══

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

test("面板显示面② webview 面：无配置 → 三数字框显 4/4/4（ag-pool-advisor 第三框存在）", async () => {
  const { agentCardHtml, SS } = await webviewMods()
  SS.agentSettings = { poolLimits: null }
  const html = agentCardHtml()
  assert.ok(/id="ag-pool-advisor"[^>]*value="4"/.test(html), "advisor 第三框显 4")
  assert.ok(/id="ag-pool-engcoder"[^>]*value="4"/.test(html), "eng-coder 框显 4")
  assert.ok(/id="ag-pool-other"[^>]*value="4"/.test(html), "other 框显 4")
})

test("面板显示面② webview 面：部分配置（旧 2 键对象）→ advisor 框逐键回退显 4", async () => {
  const { agentCardHtml, SS } = await webviewMods()
  SS.agentSettings = { poolLimits: { engCoder: 6 } }
  const html = agentCardHtml()
  assert.ok(/id="ag-pool-advisor"[^>]*value="4"/.test(html), "无 advisor 键 → ?? 4 回退")
  assert.ok(/id="ag-pool-engcoder"[^>]*value="6"/.test(html), "engCoder=6 如实显示")
})

test("面板显示面② webview 面：三键自定义 → 三框如实显示 2/3/6", async () => {
  const { agentCardHtml, SS } = await webviewMods()
  SS.agentSettings = { poolLimits: { engCoder: 2, other: 3, advisor: 6 } }
  const html = agentCardHtml()
  assert.ok(/id="ag-pool-advisor"[^>]*value="6"/.test(html))
  assert.ok(/id="ag-pool-engcoder"[^>]*value="2"/.test(html))
  assert.ok(/id="ag-pool-other"[^>]*value="3"/.test(html))
})

test("面板显示面① extension 面：无配置 → agentSettings() 快照 poolLimits 三键 4/4/4（回退显 4）", async () => {
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
    _setConfigPathForTest(join(_cfg, "config.json")) // 复位本档共享隔离路径（非 null——后续用例仍隔离）
    try { rmSync(cfgTmp, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

// 本组同时锚定 settings.poolAdvisor 文案存在（webview 渲染用 t()——缺键渲染空串）
test("面板显示面：locales — poolAdvisor/poolAdvisorHelp 双语文案存在（en/zh 对称）", () => {
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  assert.ok(en["settings.poolAdvisor"] && en["settings.poolAdvisorHelp"], "en 文案存在")
  assert.ok(zh["settings.poolAdvisor"] && zh["settings.poolAdvisorHelp"], "zh 文案存在")
  assert.equal(typeof en["settings.poolAdvisorHelp"], "string")
})
