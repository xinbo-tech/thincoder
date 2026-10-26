/**
 * batch-close-token-consume.test.mjs — 集成用例 10-1 / 10-2（RTM CLI 端故事 10「收口即清账」；
 * 回指需求 F-D7（凭证带批归属）∥ F-D8（收口自动消费）；机制 + 判据单源 =
 * `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10）。
 *
 * 业务入口 = 真 `batch` 工具（`agent-tools/batch.mjs`）的 depth-0 `close` 轨——不直调
 * `consumeBatchDesignTokens`：本档要的是「收口这件事」的业务可观察结果——回执文本、§1 状态行
 * 落盘字节、槽在不在盘、同 designId 的 spawn 门解析还放不放行。
 * 前置（签发一枚带批归属的槽）= 真 settle（`settleDesignReview` + D1 当场落盘），与生产同路。
 *
 * 10-2 的失败注入法：占住 `persistEngTokens` 的临时文件名（`${slotPath}.tmp` 落成目录）⇒
 * `writeSessionFile` 必抛 ⇒ `persistEngTokens` 抛在消费核的落盘步（与「注入必抛」同一抛出点，
 * 不 monkey-patch ESM 绑定——那个名字是 static import 的不可变绑定）。
 *
 * 夹具 = 系统临时域（项目根 + 六段批档 + 设计档；独立 sessions 根 ∥ 台账库目录——零落真实用户目录）。
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-close-token-consume.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { executeDesignSlotsAction } from "../../thincoder-core/agent-tools/design-slots.mjs"
import { settleDesignReview } from "../../thincoder-core/agent-tools/design-token.mjs"
import { docSetKey } from "../../thincoder-core/agent-tools/review-facts.mjs"
import { resolveDesignSlot } from "../../thincoder-core/agent-tools/subagent-spawn.mjs"
import { persistEngTokens } from "../../thincoder-core/token-ttl.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, slotPath } from "../../thincoder-core/session-slots.mjs"
// 台账模块静态链入 `node:sqlite`（W8 契约）——消费侧一律动态取。
const { _resetLedgerDirForTest, _setLedgerDirForTest } = await import("../../thincoder-core/ledger.mjs")

const BATCH_REL = "docs/batches/fixture.md"
const DESIGN_REL = "docs/core/design/DESIGN-FIXTURE.md"
const DESIGN_ID = "design-10"
const TOKEN = `20262026-2026-2026-2026-202620262026:${Date.now() + 3600 * 1000}`

/** 六段批档（§2/§3/§4/§6 有内容 = close 链门前置；§1 = 进行中；不记基 sha ⇒ 机检门只认触达账）。 */
const recordText = () => [
  "# 夹具批 · 收口即清账",
  "",
  "> 编制：夹具 · 2026-10-26 · 来源 = 集成夹具。",
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
  "夹具评审。",
  "",
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

const sessionsDir = mkdtempSync(join(tmpdir(), "bctc-sessions-"))
const ledgerDir = mkdtempSync(join(tmpdir(), "bctc-ledger-"))
_setSessionsDirForTest(sessionsDir)
_setLedgerDirForTest(ledgerDir)

const projects = []
after(() => {
  _resetSessionsDirForTest()
  _resetLedgerDirForTest()
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(sessionsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

const statusLineOf = (root) => readFileSync(join(root, BATCH_REL), "utf8").split("\n").find((l) => l.startsWith("**状态行**："))
const slotFileOf = (agent) => slotPath(agent.cwd, agent._slot)
const readSlot = (agent) => JSON.parse(readFileSync(slotFileOf(agent), "utf8"))

/** 工程模式夹具：项目根（项目声明 + 批档 + 设计档）+ depth-0 主 agent（槽状态图挂同对象）。 */
function fixture(tag) {
  const root = mkdtempSync(join(tmpdir(), `bctc-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/core/design"), { recursive: true })
  writeFileSync(join(root, BATCH_REL), recordText())
  writeFileSync(join(root, DESIGN_REL), "# 设计夹具\n\n夹具正文。\n")
  const agent = {
    cwd: root,
    _slot: 1,
    _sessionStart: "2026-10-26T00:00:00.000Z",
    _touchedFiles: [],
    config: { agent: { engineering: true } },
  }
  return { root, agent }
}

/** 真 settle：评审文档集带批档 ⇒ 签发槽 + 记下批归属（+ D1 当场落盘，与生产同路）。 */
function settleWithBatchDoc(root, agent) {
  const run = { designId: DESIGN_ID, docSetKey: docSetKey([BATCH_REL, DESIGN_REL], root), open: true }
  const settled = settleDesignReview(agent, run, TOKEN, `评审正文\n[DESIGN-TOKEN: ${TOKEN}]\n\nVERDICT: pass`)
  assert.equal(settled.passed, true, `前置：评审应结算通过 — ${settled.output}`)
  persistEngTokens(agent)
  assert.equal(agent._engDesignTokenBatches.get(DESIGN_ID), resolve(root, BATCH_REL), "前置：槽带批归属（旁列 = 批档绝对路径）")
}

test("10-1 正常 · 收口即清账：回执点名消费 1 枚、spawn 机械拒、清点面该槽不在", async () => {
  const { root, agent } = fixture("r101")
  settleWithBatchDoc(root, agent)
  const ctx = { depth: 0, agent }
  const tool = batchTool(null)

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctx)

  assert.match(receipt, /\[design tokens\] 消费 1 枚/, `回执应点名消费 1 枚：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "§1 状态行已写「已收口」")
  assert.equal(readSlot(agent).engDesignTokens, undefined, "该批槽已移出槽文件")
  // spawn 门禁解析 = 门禁「同 designId 再 spawn 机械拒」的单源判据
  assert.throws(() => resolveDesignSlot(agent, DESIGN_ID), /designId not found/, "同 designId 的 eng-coder spawn 被机械拒")
  const inventory = executeDesignSlotsAction({}, { agent })
  assert.ok(!inventory.includes(DESIGN_ID), `清点面该槽不在：${inventory}`)
  assert.match(inventory, /design-slots: 0 slot\(s\)/, "清点面空账本")
})

test("10-2 错误 · 消费落盘失败 ⇒ close 被拒、§1 字节不变、槽仍在盘（内存已回滚）", async () => {
  const { root, agent } = fixture("r102")
  settleWithBatchDoc(root, agent)
  const ctx = { depth: 0, agent }
  const tool = batchTool(null)
  const before = readFileSync(join(root, BATCH_REL), "utf8")
  // 注入：占住 persistEngTokens 的临时名 ⇒ writeSessionFile 必抛 ⇒ 消费核落盘步抛
  const tmpBlocker = `${slotFileOf(agent)}.tmp`
  mkdirSync(tmpBlocker)

  await assert.rejects(
    () => tool.execute({ action: "close", path: BATCH_REL }, ctx),
    (e) => {
      assert.match(e.message, /consume-design: 1 slot\(s\) were removed in memory but could NOT be durably deleted/, `拒绝原因应点名消费失败：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), before, "§1 状态行字节不变（档全文逐字比较）")
  assert.equal(readSlot(agent).engDesignTokens[DESIGN_ID], TOKEN, "槽仍在盘")
  assert.equal(agent._engDesignTokens.get(DESIGN_ID), TOKEN, "内存槽已整体回滚")

  // 可重试：注入解除后同一 close 即收口（「被拒的收口没有收口」）
  rmSync(tmpBlocker, { recursive: true, force: true })
  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctx)
  assert.match(receipt, /\[design tokens\] 消费 1 枚/, `重试即收口：${receipt}`)
})
