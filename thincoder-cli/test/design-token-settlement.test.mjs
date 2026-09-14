/**
 * design-token-settlement.test.mjs — DESIGN-TOKEN-SETTLEMENT.md（CLI 端，2026-09-08）
 * 测试用例表 1:1 落地：D1 settle 当场落盘（重启恢复）/ D2 门禁 miss 回读 / D3 镜像退役
 * 一次性迁移 / settle 落盘失败 / dispatch 写门"任一活槽"判定。
 * 真实槽文件经 session-slots 的 sessions-dir 隔离缝（_setSessionsDirForTest——VSC 端
 * 同构）落临时目录，不动真实 ~/.thincoder；beforeEach 设、afterEach 复位+清理。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { settleAdvisorRun } from "../src/agent-tools/advisor-async.mjs"
import { validateDesignToken } from "../src/agent-tools/advisor.mjs"
import { resolveDesignSlot, executeConsumeDesignAction } from "../src/agent-tools/subagent-spawn.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import {
  restoreEngTokens, engTokenSlotFields, anyLiveDesignSlot, persistEngTokens,
} from "../src/token-ttl.mjs"
import { loadSlotFile } from "@thincoder/core/session.mjs"
import {
  _setSessionsDirForTest, _resetSessionsDirForTest, slotPath, writeSessionFile,
} from "@thincoder/core/session-slots.mjs"

// 固定 cwd → 哈希固定 → 槽文件全部落隔离 sessions 目录
const cwd = "C:/proj/eng-settlement-test"
const slot = 1
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
const expiredTok = () => `${randomUUID()}:${Date.now() - 3600e3}`

let sessionsDir
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "settle-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** 造一个带台账的槽文件（真实 writeSessionFile 原子写）。 */
function createSlot(tokensObj) {
  writeSessionFile(slotPath(cwd, slot), {
    version: 2, cwd, title: "", updatedAt: Date.now(),
    history: [], contextHistory: [], tasks: [],
    planMode: false, autoApprove: false, engineering: true,
    goal: null, advisor: null, pendingReminders: [], sessionStart: "test-session",
    ...(tokensObj ? { engDesignTokens: tokensObj } : {}),
  })
}

/** settle 用的最小 agent（settleAdvisorRun/persistEngTokens 读的面）。 */
const settleAgent = (over = {}) => ({
  cwd, config: { agent: { engineering: true } },
  _role: undefined, _sessionStart: "test-session", _slot: null, _slotMtime: null,
  _engDesignTokens: new Map(), _mutLog: [], _advisorRound: 0, _calledAdvisorThisRun: false,
  ...over,
})

/** spawn/门禁用的最小父代理（resolveDesignSlot/reconcile 读的面）。 */
const gateAgent = (over = {}) => ({
  cwd, _slot: slot, _engDesignTokens: undefined,
  config: { agent: { engineering: true } },
  ...over,
})

/** 通过评审回显 + settle 记账的最小 entry（报告含 [DESIGN-TOKEN: …] 回显）。 */
function passEntry(id, designId, token) {
  return {
    id, cancelled: false,
    run: { reviewType: "design", designId, round: 0, priorOutput: null, open: true },
    designToken: token,
    report: `Design review passed — echo the token: [DESIGN-TOKEN: ${token}] end.`,
  }
}

test("正常：settle 当场落盘 → 重启 resume → spawn 门禁通过（AC1）", () => {
  const token = liveTok()
  const agent = settleAgent()
  const settled = settleAdvisorRun(agent, passEntry(1, "did-1", token))
  assert.equal(settled.passed, true)
  assert.ok(settled.report.includes(token), "Approved 后缀回显 token")
  // 槽文件当场有权威台账（不等回合尾 saveSession）；镜像字段零写
  const disk = JSON.parse(readFileSync(slotPath(cwd, agent._slot), "utf8"))
  assert.equal(disk.engDesignTokens["did-1"], token)
  assert.equal(disk.engDesignToken, undefined)
  // 落盘函数可复用（幂等重落同一台账）
  assert.equal(persistEngTokens(agent), true)
  // "重启"：真实 resume 读面（loadSlotFile）→ 新 agent 水合（restoreEngTokens）→ 门禁通过
  const data = loadSlotFile(cwd, agent._slot)
  assert.equal(data.engDesignTokens["did-1"], token)
  const agent2 = gateAgent({ _slot: agent._slot })
  restoreEngTokens(agent2, data)
  const resolved = resolveDesignSlot(agent2, "did-1")
  assert.equal(resolved.token, token)
  assert.ok(validateDesignToken(resolved.token))
})

test("正常：缓存 miss 回读——settle 落盘后、Map 未回填时 spawn（AC2）", () => {
  const token = liveTok()
  createSlot({ "did-1": token })
  // 内存无 Map（重启后未水合 / 缓存与槽不一致）→ 门禁回读槽文件权威台账命中
  const agent = gateAgent()
  assert.equal(resolveDesignSlot(agent, "did-1").token, token)
  // reconcile 已并入内存缓存（后续同回合门禁内存命中）
  assert.equal(agent._engDesignTokens.get("did-1"), token)
  // 单设计省略 designId 路径同样回读命中
  assert.equal(resolveDesignSlot(gateAgent()).token, token)
  // D3 dispatch 写门同源判定：槽文件有活槽 → anyLiveDesignSlot 真（内存 miss 回读）
  assert.equal(anyLiveDesignSlot(gateAgent()), true)
})

test("边界：过期 token 槽——restore/门禁 TTL 过滤（AC1/AC2）", () => {
  createSlot({ e: expiredTok() })
  // restore：过期不读回（丢弃——清盘闭环）
  const agent = gateAgent()
  restoreEngTokens(agent, loadSlotFile(cwd, slot))
  assert.equal(agent._engDesignTokens, undefined)
  // 门禁：内存 miss 回读 → 过期不并入 → 拒（带 id 与不带 id 两形态）
  assert.throws(() => resolveDesignSlot(gateAgent(), "e"), /designId not found/)
  assert.throws(() => resolveDesignSlot(gateAgent()), /Invalid or missing design token/)
})

test("边界：残留镜像一次性迁移——restoreEngTokens 迁入 Map、零镜像写（AC3）", () => {
  const token = liveTok()
  // legacy 文件：只有单值镜像、无多槽表 → 一次性迁入（legacy 标：designId = token 自身 uuid）
  const agent = {}
  restoreEngTokens(agent, { version: 2, cwd, history: [], engDesignToken: token })
  assert.equal(agent._engDesignTokens.get(token.split(":")[0]), token)
  // saveSession 序列化面零镜像写（engTokenSlotFields 只产多槽表）
  const fields = engTokenSlotFields(agent)
  assert.ok(!("engDesignToken" in fields))
  assert.equal(fields.engDesignTokens[token.split(":")[0]], token)
  // 过期镜像 → 不迁移（drop——清盘闭环）
  const a2 = {}
  restoreEngTokens(a2, { version: 2, cwd, history: [], engDesignToken: expiredTok() })
  assert.equal(a2._engDesignTokens, undefined)
  // 畸形镜像 → 不迁移（格式校验——不产垃圾 designId）
  const a3 = {}
  restoreEngTokens(a3, { version: 2, cwd, history: [], engDesignToken: "no-colon-garbage" })
  assert.equal(a3._engDesignTokens, undefined)
})

test("错误：settle 落盘失败 → settle 失败可重评（token 不注册/无 Approved 回显）（AC1）", () => {
  const agent = settleAgent({ _slot: slot })
  const token1 = liveTok()
  const ok = settleAdvisorRun(agent, passEntry(1, "did-1", token1))
  assert.equal(ok.passed, true) // 先成功落盘一次（建槽 + 认领）
  // sabotage：sessions 目录换成同名文件 → 槽写必抛（mkdirSync 对文件路径 ENOTDIR/EEXIST）
  rmSync(sessionsDir, { recursive: true, force: true })
  writeFileSync(sessionsDir, "x")
  const token2 = liveTok()
  const settled = settleAdvisorRun(agent, passEntry(2, "did-2", token2))
  assert.equal(settled.passed, false)
  assert.match(settled.report, /D1: the design review passed but the token could NOT be durably written/)
  // 无 Approved 回显——未注册 token 不进 digest
  assert.ok(!settled.report.includes(token2))
  assert.ok(!settled.report.includes("Approved."))
  // token 不注册（Map 回滚到 settle 前快照）；既有多槽不受波及（多槽隔离）
  assert.equal(agent._engDesignTokens.has("did-2"), false)
  assert.equal(agent._engDesignTokens.get("did-1"), token1)
  // 重评边角（F2h 复用 designId）：同 did-1 重评通过但落盘失败 → 旧 token1 原样保留
  // （settle 失败 = 结算未发生，不留半结算态——新 token 不注册、旧槽不被误删）
  const token3 = liveTok()
  const re = settleAdvisorRun(agent, passEntry(3, "did-1", token3))
  assert.equal(re.passed, false)
  assert.match(re.report, /D1: the design review passed but the token could NOT be durably written/)
  assert.ok(!re.report.includes(token3))
  assert.equal(agent._engDesignTokens.get("did-1"), token1)
})

test("错误/正常：dispatch 写门任一活槽判定（AC4）", async () => {
  const writeTool = { name: "write", readonly: false, touchedPaths: (a) => [a.path] }
  const toolByName = new Map([["write", writeTool]])
  const call = (p) => ({ name: "write", arguments: JSON.stringify({ path: p }), id: "c1" })
  const base = () => ({
    cwd, _slot: null, config: { agent: { engineering: true } }, _role: undefined,
    planMode: false, autoApprove: false, _mutLog: [], _mutationSeq: 0, _engDesignTokens: undefined,
  })
  // 工程模式 + 无任一活槽 → 改产品代码文件 → 拦（工程门原因）
  const r1 = await executeToolCalls(base(), toolByName, [call("src/x.mjs")], {}, 0, undefined)
  assert.equal(r1[0].ok, false)
  assert.match(String(r1[0].result), /design review required/)
  // 有任一活槽（内存）→ 工程门放行（拒因变权限层——"no permission handler"，非工程门）
  const live = base()
  live._engDesignTokens = new Map([["a", liveTok()]])
  const r2 = await executeToolCalls(live, toolByName, [call("src/x.mjs")], {}, 0, undefined)
  assert.equal(r2[0].ok, false)
  assert.match(String(r2[0].result), /no permission handler configured/)
  assert.ok(!String(r2[0].result).includes("design review required"))
})

test("consume 落盘对称：consume 后 kill → restart → 门禁 miss 回读不复活（AC7）", () => {
  const token = liveTok()
  createSlot({ "did-1": token })
  // 槽文件预置残留单值镜像（pre-D3 legacy——一并断言 consume 落盘清镜像，锁死
  // restoreEngTokens 一次性迁移复活已消费 token 的边角路径）
  const p = slotPath(cwd, slot)
  const seeded = JSON.parse(readFileSync(p, "utf8"))
  seeded.engDesignToken = liveTok()
  writeSessionFile(p, seeded)
  // 父代理：resume 后的活进程形态——内存已水合槽 + 槽文件旧台账在盘
  const agent = gateAgent({ _sessionStart: "test-session", _engDesignTokens: new Map([["did-1", token]]) })
  assert.match(executeConsumeDesignAction({ designId: "did-1" }, { agent }), /closed out/)
  // 内存槽已删
  assert.equal(agent._engDesignTokens.size, 0)
  // 当场落盘删除（不等回合尾 saveSession）：槽文件旧台账 engDesignTokens 与残留镜像
  // engDesignToken 均已不在盘
  const disk = JSON.parse(readFileSync(slotPath(cwd, slot), "utf8"))
  assert.equal(disk.engDesignTokens, undefined)
  assert.equal(disk.engDesignToken, undefined)
  // "kill → restart"：新进程 Map 未回填 → spawn 门禁 miss 回读盘 → 不复活（机械拒）
  assert.throws(() => resolveDesignSlot(gateAgent(), "did-1"), /designId not found/)
  // 省略 designId 的单设计路径同样不复活
  assert.throws(() => resolveDesignSlot(gateAgent()), /Invalid or missing design token/)
})

test("错误：consume 落盘失败 → 回滚内存槽 + 抛错可重试（不留半消费态——AC7 失败面）", () => {
  const token = liveTok()
  createSlot({ "did-1": token })
  const agent = gateAgent({ _sessionStart: "test-session", _engDesignTokens: new Map([["did-1", token]]) })
  // sabotage：sessions 目录换成同名文件 → 槽写必抛（settle 失败用例同款手法）
  rmSync(sessionsDir, { recursive: true, force: true })
  writeFileSync(sessionsDir, "x")
  assert.throws(
    () => executeConsumeDesignAction({ designId: "did-1" }, { agent }),
    /could NOT be durably deleted/,
  )
  // 内存槽回滚——盘上旧台账未被删除时消费不得报成功（可重试）
  assert.equal(agent._engDesignTokens.get("did-1"), token)
})

test("consume-design：镜像退役——无 Map 无镜像兜底读（D3/AC3）", () => {
  const token = liveTok()
  const agent = gateAgent({ _engDesignTokens: new Map([["a", token]]) })
  assert.match(executeConsumeDesignAction({ designId: "a" }, { agent }), /closed out/)
  // 即使残留单值镜像（_engDesignToken）也不读——已消费 = 幂等 no-op
  assert.match(
    executeConsumeDesignAction({ designId: "a" }, { agent: gateAgent({ _engDesignToken: liveTok() }) }),
    /no live slot/,
  )
})
