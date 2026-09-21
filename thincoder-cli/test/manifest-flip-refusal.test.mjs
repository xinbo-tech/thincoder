/**
 * manifest-flip-refusal.test.mjs — #41 翻转族「先判后翻 / 拒翻零副作用」CLI 侧两路机检
 * （docs/core/design/MANIFEST.md §2.8 F3/F4 · §3.1 AC-20 · 批档 §2.3 AC-C）：
 *  ① `/session` 切槽——预判据前置于 `switchToSlot`（拒 ⇒ 切槽整体不发生：`switchToSlot` /
 *     `applySession` 均不调）；准 ⇒ 既有切换 + `applySession` 之后一行附着。
 *  ② ACP `session/load` / `session/resume`——判据前置于 `createSession`（拒 ⇒ 既有 ACP
 *     错误通道、不建会话）；准 ⇒ 既有装载 + 装载后一行重估（附着）。
 *
 * 夹具：隔离 sessions 目录（`_setSessionsDirForTest`）+ tmp 仓 / 梯⑤（空目录）/ 歧义（≥2 带档子仓）
 * 三变体 cwd（PROJECT-MANIFEST.json 判据 = 入口决策树——判据单源 `resolveEngineeringManifest`）。
 * 2026-09-21（#188）：拒翻格夹具由「根不可解析」（梯⑤）改**歧义**（梯⑤ 现走建档 + 放行——T53）；
 * 拒翻文案锚改 `/项目不可解析/`（KD-M1-28）。
 * 本档为 #41 任务书外增档（批档 §2.2 未列——AC-C 两路的机检落点，见 §5 报告）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { handleSessionCommand } from "../src/tui/cmd-session.mjs"
import { buildAcpHandlers } from "../src/acp.mjs"
import { DEFAULT_MANIFEST, MANIFEST_REL } from "@thincoder/core/manifest.mjs"
import { loadManifest } from "@thincoder/core/session.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, claimSlot, getSessionId, saveManifest, slotPath, writeSessionFile } from "@thincoder/core/session-slots.mjs"

const LEGAL_JSON = JSON.stringify(DEFAULT_MANIFEST, null, 2) + "\n"
let sessionsDir
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "tc-flip-refusal-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** tmp 仓（.git 判据）——可再加合法档。 */
function mkRepoDir(t, withManifest = true) {
  const dir = mkdtempSync(join(tmpdir(), "tc-flip-repo-"))
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  mkdirSync(join(dir, ".git"), { recursive: true })
  if (withManifest) writeFileSync(join(dir, MANIFEST_REL), LEGAL_JSON)
  return dir
}
/** tmp 非仓（无 .git ∧ 向下零个带 manifest 子仓 ⇒ 梯⑤ 无项目——本批起走建档流 + 放行，T53）。 */
function mkPlainDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "tc-flip-plain-"))
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  return dir
}

/** 拒翻夹具（本批收正——`mkPlainDir`（梯⑤）现走建档放行）：容器 + ≥2 带档子仓 ⇒ 歧义。 */
function mkAmbiguousDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "tc-flip-amb-"))
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  for (const n of ["alpha", "zed"]) {
    const d = join(dir, n)
    mkdirSync(join(d, ".git"), { recursive: true })
    writeFileSync(join(d, MANIFEST_REL), LEGAL_JSON)
  }
  return dir
}

/** 槽文件 + 会话 manifest 登记（真实写路径——`listSlots` / `switchToSlot` 面）。 */
function seedSlot(cwd, slot, fields = {}) {
  writeSessionFile(slotPath(cwd, slot), {
    version: 2, cwd, title: "seeded", updatedAt: Date.now(),
    history: [{ role: "user", content: "seeded message" }], contextHistory: [],
    tasks: [], planMode: false, autoApprove: false, goal: null,
    pendingReminders: [], sessionStart: "seed-session",
    ...fields,
  })
  const m = loadManifest(cwd)
  m.slots[slot] = { updatedAt: Date.now(), messageCount: 1, turnCount: 1, firstMessage: "seeded" }
  saveManifest(cwd, m)
}

// ─── ① `/session` 切槽（AC-C · F3）───────────────────────────────────────────────

/** TUI ctx 夹具（slash-commands 调用形态）；picker 恒选 slot。 */
function sessionCtx(agent, lines, slot) {
  return {
    agent,
    state: { lines: [], _linesChars: 0 },
    showPicker: async () => ({ slot }),
    pushLine: (t, c) => lines.push(String(t)),
    pushLabel: (l) => lines.push(String(l)),
    render: () => {},
  }
}
const tuiAgent = (cwd, over = {}) => ({
  cwd, config: { agent: { engineering: false } }, providers: [], provider: {},
  history: [], _fullHistory: [], tasks: [], title: "", planMode: false,
  _slot: null, _slotMtime: null, _sessionStart: null, _engDesignTokens: null,
  ...over,
})

test("切槽拒翻：目标槽工程（合值 true）+ 歧义（≥2 候选）⇒ 切槽整体不发生（switchToSlot / applySession 均不调）", async (t) => {
  const cwd = mkAmbiguousDir(t)
  seedSlot(cwd, 1, { engineering: true })
  const lines = []
  const agent = tuiAgent(cwd)
  await handleSessionCommand(sessionCtx(agent, lines, 1))
  assert.ok(!lines.some((l) => l.includes("Switched to slot")), "零切换回显")
  assert.ok(lines.some((l) => l.includes("Cannot switch to slot 1") && l.includes("(slot unchanged)")), "原因行在场")
  assert.ok(lines.some((l) => l.includes("项目不可解析")), "原因句 = 决策树文案族（KD-M1-28）")
  const m = loadManifest(cwd)
  assert.equal(m.active, undefined, "活跃指针未切（switchToSlot 未调——无半态）")
  assert.equal(m.slotSessions?.[1], undefined, "未认领（零槽写）")
  assert.equal(agent._slot ?? null, null, "agent 未钉槽")
  assert.equal(agent.manifest ?? null, null, "不附着（拒翻）")
})

test("切槽梯⑤（无项目）：目标槽工程 + 空目录 ⇒ 放行 + 就地建档 + 附着（T53——本批可拒面收窄）", async (t) => {
  const cwd = mkPlainDir(t)
  seedSlot(cwd, 1, { engineering: true })
  const lines = []
  const agent = tuiAgent(cwd)
  await handleSessionCommand(sessionCtx(agent, lines, 1))
  assert.ok(lines.some((l) => l.includes("Switched to slot 1")), "梯度⑤ 不再拒切（建档即项目落地）")
  assert.ok(agent.manifest, "附着（applySession 之后一行）")
  assert.equal(readFileSync(join(cwd, MANIFEST_REL), "utf8"), LEGAL_JSON, "档在锚处生成（= DEFAULT_MANIFEST）")
  const m = loadManifest(cwd)
  assert.equal(m.active, 1, "活跃指针已切（准翻）")
})

test("切槽（准）：目标槽工程 + 合法档 ⇒ 既有切换 + applySession 之后一行附着", async (t) => {
  const cwd = mkRepoDir(t)
  seedSlot(cwd, 1, { engineering: true })
  const lines = []
  const agent = tuiAgent(cwd)
  await handleSessionCommand(sessionCtx(agent, lines, 1))
  assert.ok(lines.some((l) => l.includes("Switched to slot 1")), "既有切换回显在场")
  assert.ok(agent.manifest, "applySession 后一行附着（agent.manifest ← 判据结果）")
  const m = loadManifest(cwd)
  assert.equal(m.active, 1, "活跃指针已切")
})

test("切槽（边界）：目标槽普通会话 ⇒ 零 manifest I/O（不判不建）", async (t) => {
  const cwd = mkPlainDir(t)
  seedSlot(cwd, 2, { engineering: false })
  const lines = []
  const agent = tuiAgent(cwd)
  await handleSessionCommand(sessionCtx(agent, lines, 2))
  assert.ok(lines.some((l) => l.includes("Switched to slot 2")), "普通会话照切（零判据）")
  assert.equal(agent.manifest ?? null, null, "不附着")
})

test("切槽（边界）：遗留槽（无 engineering 字段）+ 当前工程会话 ⇒ 合值 true ⇒ 预判据照触发（歧义格）", async (t) => {
  const cwd = mkAmbiguousDir(t)
  seedSlot(cwd, 3, { engineering: undefined }) // 遗留槽：字段缺席
  const lines = []
  const agent = tuiAgent(cwd, { config: { agent: { engineering: true } } })
  await handleSessionCommand(sessionCtx(agent, lines, 3))
  assert.ok(!lines.some((l) => l.includes("Switched to slot")), "合值 = config 回退（true）⇒ 拒翻、切槽不发生")
  assert.ok(lines.some((l) => l.includes("项目不可解析")), "原因句在场")
})

// ─── ② ACP session/load · session/resume（AC-C · F4）────────────────────────────

/** ACP harness：createSession 计数（拒 ⇒ 不建会话的机械证明）。 */
function acpHarness(cwd) {
  const created = []
  const handlerSet = buildAcpHandlers({
    cwd: () => cwd,
    notify: () => {},
    log: () => {},
    isConfigured: () => true,
    createSession: async ({ id }) => {
      created.push(id)
      return { id, agent: { cwd, config: { agent: { engineering: false } }, _slot: null }, run: async () => {}, cancel: () => {} }
    },
  })
  return { handlers: handlerSet.handlers, created }
}

for (const method of ["session/load", "session/resume"]) {
  test(`${method} 拒翻：目标槽工程 + 歧义（≥2 候选）⇒ 既有错误通道、不建会话`, async (t) => {
    const cwd = mkAmbiguousDir(t)
    seedSlot(cwd, 1, { engineering: true })
    const { handlers, created } = acpHarness(cwd)
    await handlers.authenticate()
    const r = await handlers[method]({ sessionId: 1 })
    assert.ok(r?.error, `${method} 返回错误对象（既有 ACP 错误通道）`)
    assert.equal(typeof r.error.code, "number")
    assert.match(r.error.message, /项目不可解析/, "原因句 = 决策树文案族（KD-M1-28）")
    assert.deepEqual(created, [], "不建会话（createSession 零调用）")
  })

  test(`${method} 准：目标槽工程 + 合法档 ⇒ 建会话 + 装载后一行重估（附着）`, async (t) => {
    const cwd = mkRepoDir(t)
    seedSlot(cwd, 1, { engineering: true })
    const { handlers, created } = acpHarness(cwd)
    await handlers.authenticate()
    const r = await handlers[method]({ sessionId: 1 })
    assert.ok(!r?.error, `${method} 装载成功：${r?.error?.message ?? ""}`)
    assert.equal(created.length, 1, "建会话一次")
    assert.ok(handlers, "handlers 就绪")
  })
}

test("session/load 边界：目标槽普通会话 ⇒ 不判（零 manifest I/O）", async (t) => {
  const cwd = mkPlainDir(t)
  seedSlot(cwd, 2, { engineering: false })
  const { handlers, created } = acpHarness(cwd)
  await handlers.authenticate()
  const r = await handlers["session/load"]({ sessionId: 2 })
  assert.ok(!r?.error, `装载成功（普通槽不受判据影响）：${r?.error?.message ?? ""}`)
  assert.equal(created.length, 1)
})

// ─── F-CR1 认领释放（SESSION-CLAIM 批 · SESSION.md §6.2 / §6.16——/session 调用面）────────────

test("F-CR1 切槽释放（/session 调用面 · 验收①）：旧绑定释放 + 目标认领；再切回 ⇒ 重新认领", async (t) => {
  const cwd = mkPlainDir(t)
  seedSlot(cwd, 40)
  seedSlot(cwd, 41)
  claimSlot(cwd, 41) // 启动恢复 = 当前绑定槽 41（本进程）
  const agent = tuiAgent(cwd, { _slot: 41 })
  const lines = []

  await handleSessionCommand(sessionCtx(agent, lines, 40))
  assert.ok(lines.some((l) => l.includes("Switched to slot 40")), "切槽回显在场")
  const m1 = loadManifest(cwd)
  assert.equal(m1.slotSessions[41], undefined, "旧绑定 41 释放（认领随绑定走）")
  assert.equal(m1.slotSessions[40], getSessionId(), "目标 40 认领 = 本进程")
  assert.equal(m1.active, 40, "共享指针翻至目标（D-6）")

  await handleSessionCommand(sessionCtx(agent, lines, 41))
  const m2 = loadManifest(cwd)
  assert.equal(m2.slotSessions[41], getSessionId(), "验收①后半：旧槽重新认领")
  assert.equal(m2.slotSessions[40], undefined, "40 释放")
})
