/**
 * config-pool.test.mjs — 并发池统一可配置（POOL-CONFIG-UNIFIED，2026-09-09——设计评审
 * 采纳版）：F-1 耦合锁（DEFAULTS ↔ 运行时回退常量三键 4/4/4——补 T-24a4 真空——原注释
 * 宣称锁但测试树零引用）/ F-2 advisor 读取器（合法覆盖/非法回退/判定点读生效上限——
 * 文案含生效值）/ F-5 同 scope 守卫（running 同 scope 拒——settled 续跑不回归——
 * 异 scope 并行允许——与池容量守卫两关独立）/ F-3 子菜单显示回退（poolCur 三键）。
 * 纯单元：无真实评审启动（拒发路径在 entry.start 前返回——成功路径不驱动 launch——
 * 续跑/异 scope 经纯谓词 + 实例解析断言）。无网络、无真实 ~/.thincoder 写入。
 *
 * AC-3 TUI 交互走查清单（固定人工清单——评审 #3 批准的替代形态：/config 写盘触及真实
 * config.json——自动化测试不驱动真实磁盘）：
 *   ① /config → 并发池 → 子菜单 header 显 eng-coder 4 / other 4 / advisor 4；
 *   ② 选 "advisor 评审池上限" → 输入 6 → 保存行显 {engCoder:4, other:4, advisor:6}；
 *   ③ 回主菜单 → 并发池行显 advisor 6；/config → view → poolLimits 行显 advisor 6；
 *   ④ 重进并发池子菜单 → advisor 项显 6（落盘生效——重读 cur 走配置值）；
 *   ⑤ 改回 4 恢复现场（或手动删 agent.poolLimits 键）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULTS } from "@thincoder/core/config.mjs"
import { ASYNC_POOL_LIMITS } from "@thincoder/core/agent-tools/subagent-async.mjs"
import { poolCur } from "../src/tui/cmd-config.mjs"
import {
  ADVISOR_POOL_LIMIT, resolveAdvisorPoolLimit, advisorPoolLimitFor,
  runningAdvisorOfScope, runningAdvisorCount, launchAsyncAdvisor,
  resolveAdvisorLaunch,
} from "@thincoder/core/agent-tools/advisor-async.mjs"

/** 拒发测试用的最小 agent（launch 拒发路径只读这些面——成功路径不进入）。 */
const agent = (over = {}) => ({
  cwd: "C:/proj", config: { agent: {} },
  _asyncAdvisors: new Map(), _advisorRuns: new Map(), _asyncSubagents: new Map(),
  _subAgentCounter: 0,
  ...over,
})

/** 池内 running 条目（构造 4 个不同 scope 的 running 评审）。 */
function runningEntry(id, reviewType, key) {
  return { id: String(id), role: "advisor", status: "running", reviewType, run: { docSetKey: key } }
}

test("F-1 耦合锁：DEFAULTS ↔ 运行时回退常量三键 4/4/4（补 T-24a4 锚定真空）", () => {
  const d = DEFAULTS.agent.poolLimits
  // subagent 域两键与 ASYNC_POOL_LIMITS 逐键同值
  for (const k of ["engCoder", "other"]) {
    assert.equal(d[k], 4, `DEFAULTS.agent.poolLimits.${k} = 4`)
    assert.equal(d[k], ASYNC_POOL_LIMITS[k], `DEFAULTS.${k} 与 ASYNC_POOL_LIMITS.${k} 同值`)
  }
  // advisor 键与 advisor-async 常量同值（三池默认统一 4/4/4）
  assert.equal(d.advisor, 4, "DEFAULTS.agent.poolLimits.advisor = 4")
  assert.equal(ADVISOR_POOL_LIMIT, 4, "ADVISOR_POOL_LIMIT = 4（2 → 4）")
  assert.equal(d.advisor, ADVISOR_POOL_LIMIT, "DEFAULTS.advisor 与 ADVISOR_POOL_LIMIT 同值")
  // subagent 常量表保持两键（advisor 键不属 subagent 域——读取器独立）
  assert.deepEqual(Object.keys(ASYNC_POOL_LIMITS).sort(), ["engCoder", "other"])
  assert.deepEqual(Object.keys(d).sort(), ["advisor", "engCoder", "other"], "DEFAULTS 三键齐全")
})

test("F-2 读取器：合法覆盖生效 / 非法与缺省回退 4（resolveAdvisorPoolLimit/advisorPoolLimitFor）", () => {
  assert.equal(resolveAdvisorPoolLimit({ advisor: 6 }), 6, "合法 ≥1 整数生效")
  assert.equal(resolveAdvisorPoolLimit({ advisor: 1 }), 1, "下界 1 合法")
  assert.equal(advisorPoolLimitFor({ config: { agent: { poolLimits: { advisor: 6 } } } }), 6, "agent 包装读 config")
  // 非法 / 缺省回退常量 4
  for (const bad of [{ advisor: "abc" }, { advisor: 0 }, { advisor: -2 }, { advisor: 2.5 }, {}, null, undefined, "x", []]) {
    assert.equal(resolveAdvisorPoolLimit(bad), 4, `非法/缺省回退 4: ${JSON.stringify(bad)}`)
  }
  assert.equal(advisorPoolLimitFor({}), 4)
  assert.equal(advisorPoolLimitFor(null), 4)
})

test("F-2 判定点：池容量拒发读生效上限——文案报生效值（缺省 4——5 个并发第 5 拒）", () => {
  const a = agent({ _asyncAdvisors: new Map(
    [1, 2, 3, 4].map((i) => [`e${i}`, runningEntry(i, "design", `K${i}`)]),
  ) })
  assert.equal(runningAdvisorCount(a), 4)
  const r = launchAsyncAdvisor(a, {}, {
    reviewType: "design", documents: null, paths: null, object: null,
    designToken: null, designId: null, run: { reviewType: "design", docSetKey: "K5" },
  })
  assert.ok(r.error, "第 5 并发被拒")
  assert.ok(r.error.includes("(4 reviews at most"), `文案含生效值 4: ${r.error}`)
  assert.ok(r.error.includes("agent.poolLimits.advisor"), "文案含可配键引用")
  assert.ok(r.error.includes("§11.2"), "锚 §11.2（现行节号——旧锚已更新）")
})

test("F-2 判定点：配置覆盖后容量拒按生效上限（advisor=1——第 2 个拒——文案报 1）", () => {
  const a = agent({
    config: { agent: { poolLimits: { advisor: 1 } } },
    _asyncAdvisors: new Map([["e1", runningEntry(1, "design", "K1")]]),
  })
  const r = launchAsyncAdvisor(a, {}, {
    reviewType: "design", documents: null, paths: null, object: null,
    designToken: null, designId: null, run: { reviewType: "design", docSetKey: "K2" },
  })
  assert.ok(r.error, "配置 advisor=1 时第 2 个评审被拒")
  assert.ok(r.error.includes("(1 reviews at most"), `文案报生效值 1（读 config——非死常量）: ${r.error}`)
})

test("F-5 同 scope 守卫：running 同 scope 拒——scope 语义文案 + 指引", () => {
  const a = agent({ _asyncAdvisors: new Map([["e1", runningEntry(1, "design", "K1")]]) })
  const r = launchAsyncAdvisor(a, {}, {
    reviewType: "design", documents: null, paths: null, object: null,
    designToken: null, designId: null, run: { reviewType: "design", docSetKey: "K1" },
  })
  assert.ok(r.error, "同 scope running → 拒")
  assert.ok(r.error.includes("settle 后逐个发起"), "拒文案含指引")
  assert.ok(r.error.includes("this document set is still running"), "scope 语义（design = 文档集）")
})

test("F-5 同 scope 守卫：code 评审 running 阻断新 code launch（单 code 线程）——design 不阻断", () => {
  const a = agent({ _asyncAdvisors: new Map([["e1", runningEntry(1, "code", null)]]) })
  const codeLaunch = launchAsyncAdvisor(a, {}, {
    reviewType: "code", documents: null, paths: null, object: null,
    designToken: null, designId: null, run: { reviewType: "code", docSetKey: null },
  })
  assert.ok(codeLaunch.error, "code running → 新 code launch 拒（同 scope = 单 code 线程）")
  // 异 type 不阻断：running code 时 design launch 走容量关（0 < 4 → 允许过两关）
  assert.equal(runningAdvisorOfScope(a, "design", "Kx"), false, "code running 不阻断 design scope 谓词")
  assert.equal(runningAdvisorCount(a), 1)
})

test("F-5 异 scope 并行允许：谓词 + 容量两关都过（scope X running 不阻断 scope Y）", () => {
  const a = agent({ _asyncAdvisors: new Map([["e1", runningEntry(1, "design", "K1")]]) })
  assert.equal(runningAdvisorOfScope(a, "design", "K2"), false, "异 scope → scope 守卫放行")
  assert.ok(runningAdvisorCount(a) < 4, "容量关放行")
})

test("F-5 settled 续跑不回归：同 scope settled 实例 → round+1 续跑——守卫不阻断", () => {
  const a = agent()
  // 首次解析建实例（round 0——docSetKey 由内部归一计算）
  const r1 = resolveAdvisorLaunch(a, "design", { documents: ["docs/x.md"] })
  assert.equal(r1.isNew, true)
  const key = r1.run.docSetKey
  // 一轮 settle（非 pass——实例保持 open——模拟 settleAdvisorRun 的 round++/prior 落位）
  r1.run.round = 1
  r1.run.priorOutput = "round-1 findings…"
  // settled（无 running 池条目）→ 守卫谓词 false——同实例 round+1 续跑
  assert.equal(runningAdvisorOfScope(a, "design", key), false, "settled 实例不触发 scope 守卫")
  const r2 = resolveAdvisorLaunch(a, "design", { documents: ["docs/x.md"] })
  assert.equal(r2.reviewId, r1.reviewId, "同 scope 续跑同一实例")
  assert.equal(r2.isNew, false)
  assert.equal(r2.run.round, 1, "round 续 1（settle 已 ++）——prior 注入面")
})

test("F-1/F-3 子菜单显示回退：poolCur 三键——配置合法读配置/非法与缺省回退 DEFAULTS", () => {
  const cur = (pl) => poolCur(pl, DEFAULTS)
  // 无配置 → 三键都显默认 4
  assert.equal(cur({})("engCoder"), 4)
  assert.equal(cur({})("other"), 4)
  assert.equal(cur({})("advisor"), 4)
  // 配置合法 → 生效值
  assert.equal(cur({ engCoder: 2, other: 3, advisor: 6 })("advisor"), 6)
  assert.equal(cur({ engCoder: 2, other: 3, advisor: 6 })("engCoder"), 2)
  // 非法/缺省键 → 逐键回退默认
  assert.equal(cur({ advisor: "abc" })("advisor"), 4)
  assert.equal(cur({ advisor: 0 })("advisor"), 4)
  assert.equal(cur({ engCoder: -1, advisor: 6 })("engCoder"), 4, "非法键独立回退——不拖累合法键")
  // 部分配置对象（旧 2 键落盘——无 advisor 键）→ advisor 自然显示默认
  assert.equal(cur({ engCoder: 6 })("advisor"), 4, "旧 2 键 poolLimits 对象 → advisor 显默认 4")
})
