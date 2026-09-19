/**
 * tool-display-sync.test.mjs — #45 工具驱动的模式 / 参数变更 → 端显示同步 cell 机检
 * （`docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.3 判据①② · 批档 §2.3 AC-D）。
 *
 * 覆盖：
 *  - 模式腿（判据①）：`engineering` ≠ `_engShown`（已展示基线）⇒ 触发 `onEngMode` + 基线跟随；
 *    等值 ⇒ 零推送（**首个工具批不无条件重推**——基线语义）；两向（ON / OFF）。
 *  - 参数腿（判据②）：`_settingsTouched` ⇒ 触发 `onSettingsChanged` + 读后复位（重推幂等）。
 *  - 基线来源（`hydrateRun` 槽应用处）：会话工程态落地后 `_engShown` = 当前 engineering（非
 *    undefined / null）；同 agent 翻转后同步点如实触发。
 *  - 深度 > 0：子代理 callback 面无该两键 ⇒ `?.` 恒 no-op（零注入、零推送——不抛）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { syncToolDrivenDisplayState } from "../src/agent/agent-state.mjs"
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _gitFailureCooldownForTests, _clearGitFailureCooldownForTests } from "../src/agent/setup-reminders.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"

let sessionsDir, cwd
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "tc-tool-display-sync-"))
  cwd = join(sessionsDir, "project")
  mkdirSync(cwd, { recursive: true })
  mkdirSync(join(cwd, ".git"), { recursive: true }) // 项目根判据（.git 仓根）
  // git 隔离：预填失败冷却（hydrateRun 的 git 注入零 spawn）——本档用例面与 git 无关。
  _gitFailureCooldownForTests(cwd, Date.now())
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  _clearGitFailureCooldownForTests(cwd)
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** 探针 callback 面（记录两腿触发——顶层形态）。 */
function probeCallbacks() {
  const seen = []
  return { seen, onEngMode: (v) => seen.push(["eng", v]), onSettingsChanged: () => seen.push(["settings"]) }
}
/** 最小 agent 载体（只铺同步 cell 读写的面）。 */
const mkAgent = (engineering, over = {}) => ({ config: { agent: { engineering } }, _engShown: engineering === true, ...over })

test("判据① 模式腿：engineering ≠ _engShown ⇒ onEngMode + 基线跟随；等值 ⇒ 零推送", () => {
  const cbs = probeCallbacks()
  const agent = mkAgent(false)
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: false, settings: false }, "基线等值 ⇒ 零推送（首个工具批不重推）")
  assert.deepEqual(cbs.seen, [])
  // 工具翻转（eng 工具写 config）→ 触发 + 基线更新
  agent.config.agent.engineering = true
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: true, settings: false })
  assert.deepEqual(cbs.seen, [["eng", true]], "推送新值")
  assert.equal(agent._engShown, true, "基线已跟随（重推幂等）")
  // 同批再调 / 下一批：值未变 ⇒ 不重复推送
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: false, settings: false })
  assert.equal(cbs.seen.length, 1)
  // OFF 方向同款
  agent.config.agent.engineering = false
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: true, settings: false })
  assert.deepEqual(cbs.seen, [["eng", true], ["eng", false]], "OFF 向同样发（#eng-btn 态随变）")
})

test("判据② 参数腿：_settingsTouched ⇒ onSettingsChanged + 读后复位（不做成功判定）", () => {
  const cbs = probeCallbacks()
  const agent = mkAgent(false, { _settingsTouched: true })
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: false, settings: true })
  assert.deepEqual(cbs.seen, [["settings"]])
  assert.equal(agent._settingsTouched, false, "读后复位")
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: false, settings: false }, "复位后不再推（快照重推幂等）")
  assert.equal(cbs.seen.length, 1)
})

test("两腿同批：各自独立触发（同一同步点内顺序无关）", () => {
  const cbs = probeCallbacks()
  const agent = mkAgent(false, { _settingsTouched: true })
  agent.config.agent.engineering = true
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: true, settings: true })
  assert.deepEqual(cbs.seen, [["eng", true], ["settings"]])
})

test("深度 > 0：子代理 callback 面无该两键 ⇒ `?.` 恒 no-op（零注入、零推送、不抛）", () => {
  const agent = mkAgent(true, { _settingsTouched: true })
  const childCbs = { onToken: () => {}, onToolCall: () => {} }
  assert.doesNotThrow(() => syncToolDrivenDisplayState(agent, childCbs))
  assert.doesNotThrow(() => syncToolDrivenDisplayState(agent, undefined), "无 callbacks 恒安全")
})

test("基线来源：hydrateRun 槽应用处 `_engShown` = 当前 engineering（非 undefined / null）", async () => {
  const optsFor = (over = {}) => ({
    provider: { model: "deepseek-v4-pro" },
    cwd,
    input: "hi",
    opts: { fullHistory: [{ role: "user", content: "u1" }], engPersist: { cwd, slot: 1 }, engState: { enabled: true }, ...over },
    depth: 0,
    role: null,
    getAuto: () => false,
    restore: true,
  })
  const agent = buildTopLevelAgent()
  const cbs = probeCallbacks()
  await hydrateRun(agent, optsFor())
  assert.equal(agent.config.agent.engineering, true, "会话工程态落地")
  assert.equal(agent._engShown, true, "基线 = 当前 engineering（布尔——非 undefined）")
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: false, settings: false }, "水合后首个工具批不无条件重推")
  // 工具驱动翻转（eng 工具 exit 语义）→ 同步点如实触发
  agent.config.agent.engineering = false
  assert.deepEqual(syncToolDrivenDisplayState(agent, cbs), { eng: true, settings: false })
  assert.deepEqual(cbs.seen, [["eng", false]])
})
