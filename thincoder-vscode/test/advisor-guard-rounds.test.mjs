/**
 * advisor-guard-rounds.test.mjs — 顾问面治理批（撤 cap）端侧面：guard 不以轮次停推。
 * 判据全文 = `docs/core/design/ADVISOR-CONVERGENCE.md` §3.1 / §6.2 + `ADVISOR-GUARDS.md` §7；
 * 用例 T-AF7（端侧 = `maybeGuardPushbacks` 直驱桩 agent——零 chat / 零网络 / 零长等待）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { maybeGuardPushbacks } from "../src/agent/run-stages.mjs"
import { MAX_ADVISOR_PUSHBACKS } from "../src/agent/run-helpers.mjs"

/** 桩 agent：guard 开 + 本 run 改码未评审 + code 实例 round=6（撤 cap 前的停推边界）。 */
const mkAgent = (round) => ({
  cwd: "C:/proj/vsc-af", config: { advisor: { guard: true }, agent: {} },
  _mutatedThisRun: true, _calledAdvisorThisRun: false, _touchedFiles: [], _tasks: [],
  _advisorRound: round, _advisorRuns: new Map(), _asyncAdvisors: new Map(),
})
const mkSt = () => ({
  response: { content: "done" }, history: [], fullHistory: [], callbacks: {},
  cfgVerifyGuard: false, pb: { guardPushbacks: 0, advisorPushbacks: 0 },
})

test("T-AF7（端）guard 不以轮次停推：_advisorRound=6 仍推回（提醒载 round 7）；MAX_ADVISOR_PUSHBACKS 仍限 3", async () => {
  assert.equal(MAX_ADVISOR_PUSHBACKS, 3, "推回上限常量保留（guard 自身节流——非轮次判据）")
  const agent = mkAgent(6)
  const st = mkSt()
  assert.equal(await maybeGuardPushbacks(agent, st), true, "照常推回（撤 cap——轮次不参与停推判定）")
  assert.match(String(st.history.at(-1).content), /\(round 7\)/, "提醒载本次将使用的轮次号（轮次字段保留）")
  const capped = mkAgent(6)
  const st2 = mkSt()
  st2.pb.advisorPushbacks = MAX_ADVISOR_PUSHBACKS
  assert.equal(await maybeGuardPushbacks(capped, st2), false, "达推回上限（3）后不推回")
  assert.equal(st2.history.length, 0, "无提醒注入")
})

/** F10 催更门排除（tool-discipline 批 · 用户裁定扩端）：工程模式下 task 工具机械停用（装配摘除 +
 *  execute 拒）⇒ 不再发指向被拒工具的 pending-task 提醒（死胡同提醒防线）；普通模式门本体零改。 */
test("F10-5（端）催更门排除：engineering=true ⇒ 零推回（零新增 user 行）；普通模式正控 ⇒ 照常推回", async () => {
  const mkTaskAgent = (engineering) => ({
    ...mkAgent(0), config: { advisor: { guard: true }, agent: { engineering } },
    _tasks: [{ title: "pending-1", status: "pending" }],
  })
  const engAgent = mkTaskAgent(true)
  const stEng = mkSt()
  assert.equal(await maybeGuardPushbacks(engAgent, stEng), false, "工程模式不推回（催更门排除）")
  assert.equal(stEng.history.filter((m) => m.role === "user").length, 0, "零新增 user 行（提醒不发）")
  assert.equal(engAgent._taskPushbacks ?? 0, 0, "预算不消耗")
  // 正控（反证非空转）：同桩 engineering=false ⇒ 照常推回
  const normalAgent = mkTaskAgent(false)
  const stNormal = mkSt()
  assert.equal(await maybeGuardPushbacks(normalAgent, stNormal), true, "普通模式照常推回（门本体零改）")
  assert.match(String(stNormal.history.at(-1).content), /pending tasks: pending-1/, "提醒句列出 pending 条目")
  assert.equal(normalAgent._taskPushbacks, 1, "预算照常消耗")
})
