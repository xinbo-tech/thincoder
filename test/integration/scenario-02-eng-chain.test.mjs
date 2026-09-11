/**
 * scenario-02-eng-chain.test.mjs — 集成场景 ②「工程模式全链」VSC 实例。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = 本端 token 结算面 + 本端 spawn 门
 * （两路）直驱）；共享语义源 = CLI 侧 `docs/design/TESTING.md` §5.2（机械脊柱：评审结算 →
 * token → 门 → 消费；文档撰写段不在用例内）。
 *
 * 三态：
 *   正常 —— 设计评审结算（脚本化结论：评审者回显它收到的 token）→ token 签发 → 带 token
 *           spawn 放行（阻塞 / 异步两路）→ 链终 consume 消费槽；
 *   边界 —— 链未收口：同 designId 修正轮复用放行（窗口内）；消费后再 spawn → 机械拒
 *           （需新评审新 token）；
 *   错误 —— 无 token spawn：机械拒绝 + 零 spawn（不产生子代理）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { advisorTool } from "../../src/agent-tools/advisor.mjs"
import { subagentTool } from "../../src/agent-tools/subagent.mjs"
import { _setConfigPathForTest } from "../../src/config-io.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

let work
let cfgDir

before(() => {
  work = mkdtempSync(join(tmpdir(), "tc-integ-eng-"))
  cfgDir = mkdtempSync(join(tmpdir(), "tc-integ-eng-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  // 被审设计档 + 批次档（真文件——batchDoc 门要求可读路径）
  mkdirSync(join(work, "docs", "design"), { recursive: true })
  mkdirSync(join(work, "docs", "batches"), { recursive: true })
  writeFileSync(join(work, "docs", "design", "FEATURE.md"), "# 设计：示例功能\n\n- 目标：验证工程链脊柱\n", "utf8")
  writeFileSync(join(work, "docs", "batches", "2026-09-11-demo.md"), "# 批次档\n\n## §1 讨论\n\n## §2 批次任务\n", "utf8")
})
after(() => {
  _setConfigPathForTest(null)
  rmSync(work, { recursive: true, force: true })
  rmSync(cfgDir, { recursive: true, force: true })
})

/** 评审者脚本：从收到的提示里取回显 token 并逐字回显（脚本化结论 = 无 🔴 通过）。
 *  注意：提示词模版自身含 `[DESIGN-TOKEN:<token>]` 占位写法——只匹配真凭证形状（uuid:expiresAt）。 */
const reviewerStep = (body) => {
  const seen = JSON.stringify(body.messages ?? [])
  const m = seen.match(/\[DESIGN-TOKEN:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\d+)\]/)
  return {
    content: "设计评审完成。\n\n| # | 类别 | 严重级 | 发现 |\n|---|---|---|---|\n| 1 | 示例 | 🔵 | 无阻塞问题 |\n\n" +
      (m ? `[DESIGN-TOKEN:${m[1]}]` : "[DESIGN-TOKEN:missing]"),
  }
}

/** 工程模式父 agent（最小真形状：cwd/config/_provider/history/_engDesignTokens）。 */
function engParent(llm) {
  return {
    cwd: work,
    config: { agent: { engineering: true }, advisor: { guard: false }, providersList: [] },
    history: [],
    _role: null,
    _provider: providerFor(llm),
    _engDesignTokens: null,
    _advisorRound: 0,
    _lastAdvisorOutput: null,
    _asyncSubagents: new Map(),
    _subIdCounter: 0,
  }
}

function advisorCtx(agent) {
  return { agent, cwd: work, depth: 0, callbacks: { onToolPanel: () => {} } }
}

/** spawn 缝（batch-doc-gate 先例）：桩 runAgent 记录 run 边界，零网络。 */
function spawnHarness() {
  const runs = []
  return {
    runs,
    ctx: (agent) => ({
      agent, cwd: work, depth: 0,
      callbacks: { onSubagent: () => {}, onToolPanel: () => {} },
      getAuto: () => false,
      runAgent: async (provider, cwd, input) => { runs.push(input); return "Subagent report (stub)" },
    }),
  }
}

const BATCH = "docs/batches/2026-09-11-demo.md"
const DESIGN = "docs/design/FEATURE.md"
/** 条件轮询（同 scenario-03：替代固定墙钟等待——防高负载 flake）。 */
async function until(pred, ms = 1000) {
  const t0 = Date.now()
  for (;;) {
    if (pred()) return true
    if (Date.now() - t0 > ms) return pred()
    await new Promise((r) => setTimeout(r, 5))
  }
}

test("② 正常：设计评审结算 → token 签发 → spawn 放行（两路）→ 链终 consume 消费", async () => {
  const llm = await mockLLM([reviewerStep, reviewerStep, reviewerStep, reviewerStep])
  try {
    const agent = engParent(llm)
    const review = await advisorTool.execute({ type: "design", documents: [DESIGN], async: false }, advisorCtx(agent))
    assert.match(review, /Approved\. Pass this exact token to eng-coder/, "评审通过：签发 token（Approved 回执）")
    const tokenMatch = review.match(/designToken parameter\): (\S+)/)
    assert.ok(tokenMatch, "回执含 designToken 参数名与值（格式契约）")
    const token = tokenMatch[1]
    const designIdMatch = review.match(/designId: (\S+)/)
    assert.ok(designIdMatch, "回执含 designId")
    const designId = designIdMatch[1]
    assert.equal(agent._engDesignTokens.get(designId), token, "令牌槽已落（designId → token）")

    // spawn 放行两路：阻塞路 + 异步路（同一真实门）
    const h = spawnHarness()
    await subagentTool.execute({ task: "实现功能", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent))
    assert.equal(h.runs.length, 1, "阻塞路带 token 放行（真实 run 边界被触达）")
    const ack = JSON.parse(await subagentTool.execute({ task: "异步实现", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: true }, h.ctx(agent)))
    await until(() => h.runs.length === 2)
    assert.equal(ack.status, "running", "异步路带 token 放行")
    assert.equal(h.runs.length, 2, "异步路同样真跑（同一门）")

    // 链终消费（父侧核销）
    const consumed = await subagentTool.execute({ action: "consume-design", designId }, h.ctx(agent))
    assert.match(consumed, /design slot consumed/, "链终消费回执")
    assert.equal(agent._engDesignTokens.has(designId), false, "槽已消费（再 spawn 无授权）")
  } finally {
    await llm.close()
  }
})

test("② 边界：链未收口——同 designId 修正复用放行；消费后再 spawn → 机械拒", async () => {
  const llm = await mockLLM([reviewerStep, reviewerStep, reviewerStep])
  try {
    const agent = engParent(llm)
    const review = await advisorTool.execute({ type: "design", documents: [DESIGN], async: false }, advisorCtx(agent))
    const tokenMatch = review.match(/designToken parameter\): (\S+)/)
    assert.ok(tokenMatch, "回执含 designToken 参数名与值（格式契约）")
    const designIdMatch = review.match(/designId: (\S+)/)
    assert.ok(designIdMatch, "回执含 designId")
    const token = tokenMatch[1]
    const designId = designIdMatch[1]
    const h = spawnHarness()

    await subagentTool.execute({ task: "首轮实现", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent))
    // 修正轮：同一 designId + 同 token 复用（docs FIRST 窗口内放行）
    await subagentTool.execute({ task: "修正轮", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent))
    assert.equal(h.runs.length, 2, "修正窗口内同 designId 复用放行（不需新评审）")

    await subagentTool.execute({ action: "consume-design", designId }, h.ctx(agent))
    await assert.rejects(
      () => subagentTool.execute({ task: "链终后再来", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent)),
      /designId not found|Invalid or missing design token/,
      "消费后同 designId 再 spawn → 机械拒（需新评审新 token）",
    )
    assert.equal(h.runs.length, 2, "拒绝路径零 spawn")
  } finally {
    await llm.close()
  }
})

test("② 错误：无 token spawn eng-coder → 机械拒绝 + 零 spawn（不产生子代理）", async () => {
  const llm = await mockLLM([reviewerStep])
  try {
    const agent = engParent(llm)
    const h = spawnHarness()
    await assert.rejects(
      () => subagentTool.execute({ task: "偷偷实现", role: "eng-coder", batchDoc: BATCH, async: false }, h.ctx(agent)),
      /Invalid or missing design token/,
      "无 token 阻塞路机械拒",
    )
    await assert.rejects(
      () => subagentTool.execute({ task: "偷偷异步实现", role: "eng-coder", batchDoc: BATCH, async: true }, h.ctx(agent)),
      /Invalid or missing design token/,
      "无 token 异步路机械拒（两路同门）",
    )
    assert.equal(h.runs.length, 0, "拒绝路径零 spawn")
    assert.equal(agent._asyncSubagents.size, 0, "异步池空（拒在入池之前）")
  } finally {
    await llm.close()
  }
})
