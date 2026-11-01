/**
 * turn-cap-progress.test.mjs — 集成场景 25-1 / 25-2（RTM 故事 25「撞帽了，用户看得见自己转了多久」）
 *
 * 业务入口：CLI 会话撞帽后用户看到的那张卡（询问行 + 待答状态行）。
 * 交互组件：核 [`ContinueError` 抛点 ∥ `_turnSeq` 每轮递增] ⟷ CLI 撞帽分支
 * （`thincoder-cli/src/tui/agent-turn.mjs` 的 `ask` 决策支）。
 *
 * 断言只落用户面文本：卡上必须同时出现「本段轮数」与「链内累计轮数」，且不出现 `(limit`。
 *
 * 核侧联动是用真的：`ContinueError` 与 `continueDecision` 都从核模块导入，
 * 撞帽点的决策必须是 `ask`（depth-0 用户卡）。**模拟的只有 `_turnSeq` 的推进**
 * （真实推进在核循环 `thincoder-core/agent/turn-loop.mjs` 每轮 `++agent._turnSeq`；
 * 单测 C6 已钉住该规则，本档不重复搬核）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { runAgentTurn } from "../../thincoder-cli/src/tui/agent-turn.mjs"
import { ContinueError } from "../../thincoder-core/agent/helpers.mjs"
import { continueDecision } from "../../thincoder-core/agent/continue-decision.mjs"

const SEG = 3

/**
 * 起一个能跑撞帽分支的最小 ctx：真 CLI 回合体 + 桩 `runAgent`。
 * `segments` = 每次重入时「本段跑了几轮 ⇒ 累计变成几」的序列，长度即撞帽次数。
 */
function makeHarness(segments) {
  const lines = []
  const statuses = []
  const agent = {
    _turnSeq: 0,
    history: [],
    provider: { baseURL: "https://example.invalid", model: "stub" },
    autoApprove: false,
  }
  const state = { subTasks: {}, tasks: [], queue: [], pendingInput: [] }
  const answers = segments.map((_, i) => i < segments.length - 1) // 前几次选 Continue，最后一次选 Stop

  let segIndex = 0
  let answerIndex = 0
  const ctx = {
    agent,
    state,
    pushLine: (t) => lines.push(String(t)),
    pushLabel: () => {},
    scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: async () => true,
    askBatchPermission: async () => true,
    askQuestion: async () => "Continue",
    askSecretInput: async () => "",
    handleSlash: async () => false,
    saveSession: async () => {},
    render: () => {
      statuses.push(state.status)
      const perm = state.permission
      if (perm && !perm.__answered) {
        perm.__answered = true
        const answer = answers[answerIndex++] ?? false
        queueMicrotask(() => perm.resolve(answer))
      }
    },
    // 桩：本段跑满 SEG 轮后撞帽（累计推进照核循环的规则）
    runAgent: async () => {
      agent._turnSeq += SEG
      segIndex += 1
      throw new ContinueError(SEG)
    },
  }
  return { ctx, lines, statuses, agent }
}

test("25-1 续跑一段后再次撞帽：第二张卡给出本段 3 ∥ 累计 6", async () => {
  const h = makeHarness([SEG, SEG])
  await runAgentTurn(h.ctx, "长任务", {})
  const cards = h.lines.filter((l) => l.startsWith("Ran "))
  assert.equal(cards.length, 2, `应有两次撞帽卡，实得 ${cards.length}：${JSON.stringify(cards)}`)
  assert.equal(cards[0], "Ran 3 turns — 3 turns total. Continue?")
  assert.equal(cards[1], "Ran 3 turns — 6 turns total. Continue?")
  assert.ok(
    h.statuses.includes("Continue after 3 turns (6 total)?"),
    `待答状态行缺累计：${JSON.stringify(h.statuses.filter((s) => s && s.startsWith("Continue after")))}`,
  )
  for (const l of h.lines) assert.ok(!l.includes("(limit"), `卡上不该再有 (limit：${l}`)
})

test("25-2 首段即撞帽：累计等于本段，两个数都在", async () => {
  const h = makeHarness([SEG])
  await runAgentTurn(h.ctx, "长任务", {})
  const cards = h.lines.filter((l) => l.startsWith("Ran "))
  assert.equal(cards.length, 1, `首段撞帽只该有一张卡：${JSON.stringify(cards)}`)
  assert.equal(cards[0], "Ran 3 turns — 3 turns total. Continue?")
  assert.ok(h.statuses.includes("Continue after 3 turns (3 total)?"))
  for (const l of h.lines) assert.ok(!l.includes("(limit"), `卡上不该再有 (limit：${l}`)
})

test("核联动：撞帽在 depth-0 的决策是 ask（本档的卡面才有意义）", () => {
  assert.equal(continueDecision(new ContinueError(SEG), { autoTurn: false, autoApprove: false }), "ask")
})
