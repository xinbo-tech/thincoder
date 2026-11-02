/*
 * batch-status-auto-set.test.mjs — 集成用例 27-1（RTM CLI 端故事 27「评审写一笔 §3 就够：状态行由工具置位」；
 * 回指 = 批档条目 R23；机制 + 判据单源 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 ∥ §5 R23）。
 *
 * 业务入口 = 真 `batch` 工具的评审追加轨（`batchTool(batchDoc, { review: true })`）→ 真结算
 * （`settleDesignReview`）→ 真的 `append §5`——三面都从工具面进，不直调内部计划函数。
 * 本行与 17-1 同一入口、判相反的那一半：17-1 判「没写 §3 ⇒ 不签发」，27-1 判「写了一笔就够」。
 *
 * 夹具 = 骨架原形批档（`batchSkeleton` 产出：§3 **无**段级状态行——新批首轮 pass 的常态形）+
 * 系统临时域的项目根（带项目声明，文档机检门照跑）。
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-status-auto-set.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { batchSkeleton, countRoundBlocks, readSectionStatusWord } from "../../thincoder-core/agent-tools/batch-skeleton.mjs"
import { settleDesignReview } from "../../thincoder-core/agent-tools/design-token.mjs"
import { docSetKey } from "../../thincoder-core/agent-tools/review-facts.mjs"

const BATCH_REL = "docs/batches/fixture.md"
const DESIGN_REL = "docs/core/design/DESIGN-FIXTURE.md"
const DESIGN_ID = "design-27"
const TOKEN = `20262027-2026-2026-2026-202620262027:${Date.now() + 3600 * 1000}`

const projects = []
after(() => {
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 工程模式夹具：项目根（项目声明 + 骨架原形批档 + 设计档）+ 主 agent。 */
function fixture(tag) {
  const root = mkdtempSync(join(tmpdir(), `bsas-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/core/design"), { recursive: true })
  // 骨架原形：`ledger` / `board` 给值 ⇒ 档头两处死占位当场填掉（否则首个 append 被占位机检拒）
  writeFileSync(join(root, BATCH_REL), batchSkeleton({
    date: "2026-11-01", topic: "fixture", source: "集成夹具", prev: "无（独立批）", ledger: "#1999", board: "core",
  }))
  writeFileSync(join(root, DESIGN_REL), "# 设计夹具\n\n夹具正文。\n")
  const agent = { cwd: root, _slot: 1, config: { agent: { engineering: true } } }
  return { root, agent }
}

const readRecord = (root) => readFileSync(join(root, BATCH_REL), "utf8")
const statusLineOf = (src) => src.split(/\r?\n/).find((l) => /^\s*\*\*状态行\*\*[：:]/.test(l) && l.includes("评审"))
const trailLinesOf = (src) => src.split(/\r?\n/).filter((l) => l.startsWith("> 状态行重置"))

test("27-1 正常 · 绑本档的评审只写一笔携 pass 的 §3（不另写状态行）⇒ 状态行自动置位、结算签发、`append §5` 放行", async () => {
  const { root, agent } = fixture("r271")
  // 前置：骨架原形批档的 §3 无段级状态行（新批首轮 pass 的常态形）
  assert.equal(readSectionStatusWord(readRecord(root), 3), null, "前置：骨架原形 §3 无状态行")

  // ① 评审写一笔 §3——正文携 `VERDICT: pass`，全程不调 `status`、不手写状态行
  const review = batchTool(BATCH_REL, { review: true })
  const receipt = await review.execute(
    { action: "append", segment: "§3", text: "两份设计档逐节核过，结论成立。\n\nVERDICT: pass" },
    { agent },
  )
  const afterReview = readRecord(root)
  assert.match(receipt, /### 轮次 1（评审子代理）/, `回执应点名本轮块：${receipt}`)
  assert.equal(countRoundBlocks(afterReview, 3), 1, "轮次块 +1")
  assert.match(statusLineOf(afterReview) ?? "", /^\*\*状态行\*\*：评审通过$/, "§3 段级状态行由工具随块置位")
  assert.equal(readSectionStatusWord(afterReview, 3), "评审通过", "读侧同值（下游 §5 门 / 收口门 / 核销门③ / 结算面读的同一行）")
  assert.deepEqual(trailLinesOf(afterReview), [], "通过方向零留痕行（落进 §3 的轮次块即记录）")

  // ② 结算面：同一档、同一实例键，回执回显 token + 裁定行 ⇒ 签发（§3 落地门两判据当场成立）
  const run = {
    designId: DESIGN_ID,
    batchDoc: resolve(root, BATCH_REL),
    docSetKey: docSetKey([DESIGN_REL], root),
    section3BlocksAtStart: 0, // 点火基线 = 评审写块之前读到的块数
    open: true,
  }
  const settled = settleDesignReview(agent, run, TOKEN, `评审正文。\n[DESIGN-TOKEN: ${TOKEN}]\n\nVERDICT: pass`)
  assert.equal(settled.passed, true, `应签发（修前红：状态行缺 ⇒ status-not-passed）— ${settled.output}`)
  assert.match(settled.output, /Approved\. Pass this exact token to eng-coder/, "回执带已批准后缀（token 已签发）")
  assert.equal(agent._engDesignTokens.get(DESIGN_ID), TOKEN, "槽里是该 designId 的全串 token")

  // ③ 随后 `append §5` 放行：段序门两判据（状态词 ∥ 末块自带 pass 裁定）都由「那一笔」满足
  const coderCtx = { depth: 1, agent: { cwd: root, config: { agent: { engineering: true } }, _role: "eng-coder", _batchDoc: BATCH_REL } }
  const five = await batchTool(BATCH_REL).execute({ action: "append", segment: "§5", text: "实现落地。" }, coderCtx)
  assert.match(five, /appended/, `§5 应写入：${five}`)
  assert.equal(readSectionStatusWord(readRecord(root), 3), "评审通过", "§5 那一笔不改 §3 状态行")
})
