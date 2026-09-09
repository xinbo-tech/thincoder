/**
 * config-pool.test.mjs — 并发池统一可配置（POOL-CONFIG-UNIFIED，2026-09-09——VSC 端）：
 * F-1 耦合锁（AGENT_DEFAULTS ↔ 运行时常量/回退 ↔ 调度器 effectivePoolLimits 第三键
 * 4/4/4）/ F-2 advisor 读取器（合法覆盖/非法回退——判定点读生效上限——拒文案报生效值）/
 * F-5 同 scope 守卫（_advisorRuns running 记录同 scope 拒）/ F-4 白名单（panel 写面
 * 三键——非法键丢弃——全非法删整键）+ 落盘 + 读取回退。纯单元：拒发路径在 entry.start
 * 前返回（成功路径不驱动 launch——无真实评审）——config 经 _setConfigPathForTest 隔离。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import {
  AGENT_DEFAULTS, loadAgentSettings, loadRaw,
  saveAgentSettingsFromPanel, _setConfigPathForTest,
} from "../src/config-io.mjs"
import {
  ADVISOR_POOL_LIMIT, resolveAdvisorPoolLimit, advisorPoolLimitFor, launchAsyncAdvisor,
} from "../src/agent-tools/advisor-async.mjs"
import { ASYNC_POOL_LIMITS, effectivePoolLimits } from "../src/agent-tools/subagent-scheduler.mjs"

// ─── config 隔离（无真实 ~/.thincoder 触碰）──────────────────────────────
let _cfg
before(() => {
  _cfg = mkdtempSync(join(tmpdir(), "tc-pool-cfg-"))
  writeFileSync(join(_cfg, "config.json"), "{}", "utf8")
  _setConfigPathForTest(join(_cfg, "config.json"))
})
after(() => {
  _setConfigPathForTest(null)
  try { rmSync(_cfg, { recursive: true, force: true }) } catch { /* ignore */ }
})

const mkParent = (over = {}) => ({
  config: { agent: {} }, history: {}, _asyncAdvisors: new Map(), ...over,
})

/** 拒发路径的 launch 请求（进入 entry.start 前即返回——不触真评审）。 */
function tryLaunch(parent, reviewType, documents, poolLimits) {
  const cfg = { config: { agent: { ...(poolLimits ? { poolLimits } : {}) } } }
  return launchAsyncAdvisor({
    parent: { ...parent, ...cfg },
    ctx: { cwd: "C:/proj" },
    reviewType, documents, paths: null, object: null,
  })
}

test("F-1 耦合锁：AGENT_DEFAULTS/常量/scheduler 回退三键 4/4/4（默认全链路真实）", () => {
  const d = AGENT_DEFAULTS.poolLimits
  assert.deepEqual(d, { engCoder: 4, other: 4, advisor: 4 }, "AGENT_DEFAULTS.poolLimits 三键 4/4/4")
  assert.equal(ADVISOR_POOL_LIMIT, 4, "ADVISOR_POOL_LIMIT = 4（2 → 4）")
  assert.equal(d.advisor, ADVISOR_POOL_LIMIT, "默认与运行时常量同值")
  assert.equal(ASYNC_POOL_LIMITS.engCoder, d.engCoder)
  assert.equal(ASYNC_POOL_LIMITS.other, d.other)
  assert.deepEqual(Object.keys(ASYNC_POOL_LIMITS).sort(), ["engCoder", "other"], "subagent 常量表两键不变")
  // scheduler effectivePoolLimits 第三键回退（显示/读取回退面——调度路径不消费）
  const eff = effectivePoolLimits(null).limits
  assert.deepEqual(eff, { engCoder: 4, other: 4, advisor: 4 })
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

test("F-2 判定点：容量拒发读生效上限——缺省 4（4 running + 第 5 拒——文案报 4）", () => {
  const pool = new Map([1, 2, 3, 4].map((i) => [`e${i}`, { id: i, status: "running" }]))
  const parent = mkParent({ _asyncAdvisors: pool })
  const r = tryLaunch(parent, "design", ["docs/a.md"])
  assert.ok(r.error, "第 5 并发被拒")
  assert.ok(r.error.includes("pool limit 4"), `文案报生效值 4: ${r.error}`)
  assert.ok(r.error.includes("agent.poolLimits.advisor"), "文案含可配键引用")
})

test("F-2 判定点：配置覆盖后按生效上限拒（advisor=1——第 2 个拒——文案报 1）", () => {
  const pool = new Map([["e1", { id: 1, status: "running" }]])
  const parent = mkParent({ _asyncAdvisors: pool })
  const r = tryLaunch(parent, "design", ["docs/a.md"], { advisor: 1 })
  assert.ok(r.error, "配置 advisor=1 时第 2 个评审被拒")
  assert.ok(r.error.includes("pool limit 1"), `文案报生效值 1（读 config——非死常量）: ${r.error}`)
})

test("F-5 同 scope 守卫：_advisorRuns running 记录同 scope 拒——scope 语义文案", () => {
  const key = JSON.stringify([resolve("C:/proj", "docs/x.md")])
  const parent = mkParent({
    history: { _advisorRuns: new Map([["rv1", { reviewId: "rv1", reviewType: "design", scopeKey: key, state: "running", round: 1 }]]) },
  })
  const r = tryLaunch(parent, "design", ["docs/x.md"])
  assert.ok(r.error, "同 scope running 记录 → 拒")
  assert.ok(r.error.includes("settle 后逐个发起"), "拒文案含指引")
  assert.ok(r.error.includes("same documents/paths"), "scope 语义")
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
