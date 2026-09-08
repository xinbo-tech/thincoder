/**
 * setup-reminders.test.mjs — SESSION.md §11.2（2026-09-08——F1 env-state slot 字段 +
 * F2 resumed 按会话跟踪 + N6 注入句解耦）VSC 端单测（双端镜像：CLI 仓同文件名的同套
 * 用例——模板同构、载体异名：VSC = agent 级 _resumedPending + 模块级 restartDetectionDone
 * 闸保留——评审 #7 对齐）。
 *
 * 覆盖（§11.2 测试段）：
 *  - envStateLine 模板：slot 字段存在/位置（model 后 resumed 前）/null 降级/resumed yes-no；
 *  - hydrateRun 恢复事件（_resumedPending agent 级载体——评审 #7 点名）：restore:true
 *    factory 路径（setupAgentRun 同款）+ fullHistory 载入非空 → 首 run resumed:yes 一次、
 *    次 run（同绑定复用）false；换槽销毁重建（新 factory agent）→ 再 true；
 *    depth>0 / resume / autoTurn → false；
 *  - slot 注入：engPersist.slot 透传进 env 行；无绑定（直连/非面板顶层 run）→ slot: null；
 *  - 注入句解耦（N6/AC4）：process restarted 句 = 模块级闸（进程内首个恢复回合发一次）——
 *    同进程换槽重建只发 resumed:yes、句不再发（闸已关）；全新会话首回合不发句不误报。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { envStateLine, pushEnvStateReminder, _resetRestartDetectionForTests } from "../src/agent/setup-reminders.mjs"
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"

let sessionsDir
let cwd

beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "setup-rem-"))
  cwd = join(sessionsDir, "project")
  _setSessionsDirForTest(sessionsDir)
  // 模块级重启闸每用例复位——进程内首回合语义逐用例独立（生产从不调用——测试专用 seam）
  _resetRestartDetectionForTests()
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

const envOf = (hist) => {
  for (let i = hist.length - 1; i >= 0; i--) {
    const c = hist[i]?.content
    if (typeof c === "string" && c.startsWith("[System reminder: env: vscode,")) return c
  }
  return null
}

const restartCount = (hist) => hist.filter((m) =>
  typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")
).length

const hist = [{ role: "user", content: "u1" }]
const provider = { model: "deepseek-v4-pro" }

/** hydrateRun 调用参数装配（镜像 agent-lifecycle-singleton.test.mjs 的 optsFor 形态）。
 *  缺省 restore:true——工厂路径（setupAgentRun/首轮/destroy 重建）；复用续跑显式
 *  restore:false（顶层 opts 缺省同义——见 agent.mjs §11 hydrate 分支）。 */
const optsFor = (optsOver = {}, topOver = {}) => ({
  provider,
  cwd,
  input: "hi",
  opts: { fullHistory: hist, engPersist: { cwd, slot: 1 }, ...optsOver },
  depth: 0,
  role: null,
  getAuto: () => false,
  restore: true,
  ...topOver,
})

// ─── envStateLine 模板（§11.2 测试段——slot 字段存在/位置/null 降级/resumed yes-no）───

test("envStateLine: slot 字段存在且位置在 model 后 resumed 前（双端同构模板——END=vscode）", () => {
  assert.equal(
    envStateLine({ mode: "normal", model: "m1", slot: 3, resumed: false }),
    "[System reminder: env: vscode, mode: normal, model: m1, slot: 3, resumed: no.]",
  )
  assert.equal(
    envStateLine({ mode: "eng", model: "m1", slot: 3, resumed: true }),
    "[System reminder: env: vscode, mode: eng, model: m1, slot: 3, resumed: yes.]",
  )
  const line = envStateLine({ mode: "normal", model: "m1", slot: 3, resumed: true })
  assert.ok(line.indexOf("model: m1") < line.indexOf("slot: 3"), "slot after model")
  assert.ok(line.indexOf("slot: 3") < line.indexOf("resumed: yes"), "slot before resumed")
})

test("envStateLine/push: slot 无绑定 → 显式 slot: null（N3）；model 缺失 → unknown 降级", () => {
  assert.equal(
    envStateLine({ mode: "normal", model: "m1", slot: null, resumed: false }),
    "[System reminder: env: vscode, mode: normal, model: m1, slot: null, resumed: no.]",
  )
  const h = []
  pushEnvStateReminder(h, { engineering: false, provider: {}, slot: null, resumed: false })
  assert.equal(h.length, 1)
  assert.match(h[0].content, /slot: null,/)
  assert.match(h[0].content, /model: unknown/)
  assert.match(h[0].content, /resumed: no\./)
})

// ─── hydrateRun 恢复事件（_resumedPending agent 级载体——评审 #7）───

test("hydrateRun: restore:true 工厂路径 + 历史非空 → 首 run resumed:yes 一次；复用路径不武装 → no", async () => {
  // 首轮（extension host 重启 / destroy 后重建同路径）：factory 新建 + restore:true
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.match(envOf(r1.history), /resumed: yes\./, "每次会话恢复首回合 resumed:yes（AC2）")
  assert.equal(r1.agent._resumedPending, false, "消费即清——后续回合 no")
  // 同绑定复用（restore=false——面板连续多回合同一对象）：不重新武装 → 恒 no
  const r2 = await hydrateRun(r1.agent, optsFor({}, { restore: false }))
  assert.equal(r2.agent, r1.agent)
  assert.match(envOf(r2.history), /resumed: no\./, "复用路径不武装（评审 #7——同绑定只一次）")
})

test("hydrateRun: 换槽销毁重建 → resumed 随绑定新生（再 true）；空历史新建不武装", async () => {
  const slotB = [{ role: "user", content: "slot-b-content" }]
  const slotC = [{ role: "user", content: "slot-c-content" }]
  // 槽 A 首轮恢复
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.match(envOf(r1.history), /resumed: yes\./)
  // 换槽 B → panel._agent = null（ensurePanelAgent）→ 回合 factory 新建（restore:true）
  const r2 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: slotB, engPersist: { cwd, slot: 2 } }))
  assert.notEqual(r2.agent, r1.agent, "换槽销毁重建——新 agent 对象")
  assert.match(envOf(r2.history), /resumed: yes\./, "每次槽恢复进新 agent 天然得一次 resumed:yes")
  // 再换槽 C → 再 true（F2——每次会话恢复的首个回合一次）
  const r3 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: slotC, engPersist: { cwd, slot: 3 } }))
  assert.match(envOf(r3.history), /resumed: yes\./)
  // 全新空历史（新会话首轮）：factory 新建但 fullHistory 空 → 不武装
  const r4 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [], engPersist: { cwd, slot: 4 } }))
  assert.match(envOf(r4.history), /resumed: no\./, "载入历史非空才武装（N5 判据）")
})

test("hydrateRun: depth>0 / resume / autoTurn 回合 → 不武装不注入（resumed 恒 false）", async () => {
  // depth>0（子代理——setupAgentRun 工厂路径但 fullHistory 恒空）：无 env 注入、不武装
  const child = await hydrateRun(buildTopLevelAgent(), { ...optsFor({}, {}), depth: 1, role: "explore", opts: {} })
  assert.equal(envOf(child.history), null, "env-state 仅 depth-0（N4 守卫）")
  assert.equal(child.agent._resumedPending, undefined, "depth>0 不武装")
  // 顶层续跑形态（interrupt-continuation resume / digest autoTurn——复用同 agent）：
  // 恢复已在首轮消费——resume/autoTurn 回合不重新武装 → resumed:no
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.match(envOf(r1.history), /resumed: yes\./)
  const r2 = await hydrateRun(r1.agent, optsFor({ resume: true }, { restore: false }))
  assert.match(envOf(r2.history), /resumed: no\./, "resume（续跑）回合 no——不重复武装")
  const r3 = await hydrateRun(r1.agent, optsFor({ autoTurn: true }, { restore: false }))
  assert.match(envOf(r3.history), /resumed: no\./, "autoTurn（digest）回合 no")
})

// ─── slot 注入（F1——engPersist.slot 透传；无绑定显式 null）───

test("hydrateRun: env 行 slot 透传 engPersist.slot；无绑定（直连）→ slot: null", async () => {
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor({ engPersist: { cwd, slot: 5 } }))
  assert.match(envOf(r1.history), /slot: 5,/)
  // 直连/非面板顶层 run（无 engPersist 绑定）→ slot: null（不读 manifest active——N3）
  const r2 = await hydrateRun(buildTopLevelAgent(), { ...optsFor(), opts: { fullHistory: hist } })
  assert.match(envOf(r2.history), /slot: null,/)
})

// ─── 注入句解耦（N6/AC4——模块级闸保留为 process restarted 句专用）───

test("hydrateRun: 模块闸——进程内首个恢复回合发 process restarted 句一次；换槽重建只发 resumed:yes 无句", async () => {
  // 启动恢复（extension host 重启 + 面板恢复有历史槽）：句 + resumed:yes
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.equal(restartCount(r1.history), 1, "启动恢复发句一次")
  assert.match(envOf(r1.history), /resumed: yes\./)
  // 同进程换槽重建（新 factory agent——真机里即 loadSession 切走再切回）：模块闸已关——
  // 句不再发（N6——切槽不误报进程重启）；resumed:yes 照发（会话级信号与进程级闸独立）
  const r2 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [{ role: "user", content: "switched" }], engPersist: { cwd, slot: 2 } }))
  assert.equal(restartCount(r2.history), 0, "切槽不发 process restarted 句（AC4）")
  assert.match(envOf(r2.history), /resumed: yes\./)
  // 进程内多次切槽：句仍不再发
  const r3 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [{ role: "user", content: "switched-again" }], engPersist: { cwd, slot: 3 } }))
  assert.equal(restartCount(r3.history), 0, "进程内多次切槽句不再发")
  assert.match(envOf(r3.history), /resumed: yes\./)
})

test("hydrateRun: 全新会话（空历史）首回合——无句、闸随即关闭、后续回合恒 no 不误报", async () => {
  // 全新会话首回合：fullHistory 空 → 句不发 + 检测关闸（进程内不再判）
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [] }))
  assert.equal(restartCount(r1.history), 0)
  assert.match(envOf(r1.history), /resumed: no\./)
  // 后续回合（history 已非空）——闸已关 + 无武装 → 恒 no 不误报
  const r2 = await hydrateRun(r1.agent, optsFor({}, { restore: false }))
  assert.equal(restartCount(r2.history), 0)
  assert.match(envOf(r2.history), /resumed: no\./)
})
