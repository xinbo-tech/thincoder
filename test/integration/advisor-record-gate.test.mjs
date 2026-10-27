/**
 * advisor-record-gate.test.mjs — 集成用例 17-1 / 17-2（RTM CLI 端故事 17「评审没写进批档就不算过」；
 * 回指需求 F-A13；机制单源 = `docs/core/design/ADVISOR-GUARDS.md` §1.1 ∥ §1.3）。
 *
 * 业务可观察面 = 两件：① 结算回执（有没有 token、拒因点名）② 同 designId 的 eng-coder spawn 门解析
 * （放行 ∥ 机械拒）。驱动面 = 结算函数本体 `settleDesignReview`——同步轨（`advisor.mjs`）与异步轨
 * （`advisor-settle.mjs`）调的就是它，本档不重复模拟工具包装层。
 *
 * 每轮 = 一次「点火 + 结算」：点火时读 §3 轮次块数作基线（生产 = `advisor.mjs` 绑批档时同拍读）；
 * 评审轮内是否把 §3 写进批档由 `writeBlock` 决定（生产 = 评审经 `batch` 的 append / status 动作写入）。
 *
 * 夹具 = 系统临时域（项目根 + 六段批档 + 设计档；独立 sessions 根——零落真实用户目录）。
 * 复跑（cwd = 仓根）：`node --test test/integration/advisor-record-gate.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { countRoundBlocks } from "../../thincoder-core/agent-tools/batch-skeleton.mjs"
import { settleDesignReview } from "../../thincoder-core/agent-tools/design-token.mjs"
import { docSetKey } from "../../thincoder-core/agent-tools/review-facts.mjs"
import { resolveDesignSlot } from "../../thincoder-core/agent-tools/subagent-spawn.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest } from "../../thincoder-core/session-slots.mjs"

const BATCH_REL = "docs/batches/fixture.md"
const DESIGN_REL = "docs/core/design/DESIGN-FIXTURE.md"
const DESIGN_ID = "design-17"

/** 六段批档；`blocks` = §3 轮次块数，`statusRow` = §3 段级状态行（`null` = 该行不存在）。 */
const recordText = ({ blocks = 0, statusRow = null } = {}) => [
  "# 夹具批 · §3 落地门",
  "",
  "> 编制：夹具 · 2026-10-27 · 来源 = 集成夹具。",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中",
  "",
  "夹具讨论。",
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "夹具任务。",
  "",
  "## §3 设计评审（评审子代理）",
  ...(statusRow ? [`**状态行**：${statusRow}`, ""] : []),
  ...Array.from({ length: blocks }, (_, i) => [`### 轮次 ${i + 1}（评审子代理）`, "", `夹具评审第 ${i + 1} 轮发现。`, ""]).flat(),
  "## §4 用户批准（主 agent）",
  "夹具批准。",
  "",
  "## §5 实施记录（eng-coder）",
  "夹具实施。",
  "",
  "## §6 验证与收口（父代理）",
  "夹具收口。",
  "",
].join("\n")

const sessionsDir = mkdtempSync(join(tmpdir(), "arg-sessions-"))
_setSessionsDirForTest(sessionsDir)
const roots = []
after(() => {
  _resetSessionsDirForTest()
  for (const p of roots) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(sessionsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

function fixture(tag, text) {
  const root = mkdtempSync(join(tmpdir(), `arg-${tag}-`))
  roots.push(root)
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/core/design"), { recursive: true })
  writeFileSync(join(root, BATCH_REL), text)
  writeFileSync(join(root, DESIGN_REL), "# 设计夹具\n\n夹具正文。\n")
  const agent = { cwd: root, _slot: 1, config: { agent: { engineering: true } } }
  return { root, agent, batchAbs: join(root, BATCH_REL) }
}

let seq = 0
const mintToken = () => `2026202${++seq}-2026-2026-2026-202620262026:${Date.now() + 3600 * 1000}`
const receipt = (token) => `评审正文。\n[DESIGN-TOKEN: ${token}]\n\nVERDICT: pass`

/**
 * 一次评审轮（点火 → 评审写入 → 结算）：`writeBlock` = 本轮是否把 §3 写进批档。
 * 生产同形：`advisor.mjs` 点火时读基线落 `run.section3BlocksAtStart`；评审经 `batch` 写 §3 后结算。
 */
function reviewRound(agent, run, { writeBlock }) {
  // 生产同形：未绑批档 ⇒ 基线 null（无对象可判，本门不适用）
  run.section3BlocksAtStart = run.batchDoc ? countRoundBlocks(readFileSync(run.batchDoc, "utf8"), 3) : null
  if (writeBlock && run.batchDoc) writeFileSync(run.batchDoc, recordText({ blocks: run.section3BlocksAtStart + 1, statusRow: "评审通过" }))
  const token = mintToken()
  return { settled: settleDesignReview(agent, run, token, receipt(token)), token }
}

test("17-1 错误 · 评审回 pass 但 §3 未写 ⇒ 无 token、spawn 被机械拒；补写 §3 后重评 ⇒ 签发", () => {
  const { root, agent, batchAbs } = fixture("r171", recordText({ blocks: 0, statusRow: null }))
  const run = { reviewId: DESIGN_ID, designId: DESIGN_ID, batchDoc: batchAbs, docSetKey: docSetKey([DESIGN_REL], root), section3BlocksAtStart: null, open: true }

  // 第一轮：回 pass，一字未写进 §3
  const first = reviewRound(agent, run, { writeBlock: false })
  assert.equal(first.settled.passed, false, `未落档不得签发：${first.settled.output}`)
  assert.ok(first.settled.output.includes("review record incomplete"), `回执应点名记录不合格：${first.settled.output}`)
  assert.throws(() => resolveDesignSlot(agent, DESIGN_ID), /designId not found/, "同 designId 的 eng-coder spawn 被机械拒")

  // 第二轮：本次评审把 §3 写进批档（轮次块 + 状态行 = 评审通过）⇒ 签发
  const second = reviewRound(agent, run, { writeBlock: true })
  assert.equal(second.settled.passed, true, `补写后重评应签发：${second.settled.output}`)
  assert.equal(resolveDesignSlot(agent, DESIGN_ID).token, second.token, "spawn 门放行（拿到本 designId 的凭证）")
})

test("17-2 边界（零回归）· 不带 `batchDoc` 的评审回 pass ⇒ 照常签发", () => {
  const { root, agent } = fixture("r172", recordText({ blocks: 0, statusRow: null }))
  const run = { reviewId: DESIGN_ID, designId: DESIGN_ID, batchDoc: null, docSetKey: docSetKey([DESIGN_REL], root), section3BlocksAtStart: null, open: true }
  const { settled, token } = reviewRound(agent, run, { writeBlock: false })
  assert.equal(settled.passed, true, `本门不适用 ⇒ 照常签发：${settled.output}`)
  assert.equal(resolveDesignSlot(agent, DESIGN_ID).token, token, "spawn 门放行")
})
