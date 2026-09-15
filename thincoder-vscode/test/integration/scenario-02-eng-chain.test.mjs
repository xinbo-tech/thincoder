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
import { advisorTool } from "@thincoder/core/agent-tools/advisor.mjs" // W12：端侧 advisor 工具随镜像删旧退役——工具面改指核单源
// W13（2026-09-15）：subagent 工具面 = 核单源（原端侧 `../../src/agent-tools/subagent.mjs` 镜像删旧）；
// 子代理执行 = 核 `runChildPipeline` → 核 `runAgent`（原端侧 `ctx.runAgent` 测试缝不存在于核工具——
// 夹具改驱真链路：mock provider（本地 SSE 零外网））。
import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
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

/** 工程模式父 agent（最小真形状：cwd/config/provider/history/_engDesignTokens）。
 *  W12（2026-09-15）：advisor 工具/解析面改指核单源——核 `resolveAdvisorProvider` 读
 *  `agent.provider`（回退分支）与 `agent.config.providersList`；夹具同批适配（`_provider` 端侧遗留载体保留）。 */
function engParent(llm) {
  const provider = providerFor(llm)
  return {
    cwd: work,
    config: { agent: { engineering: true }, advisor: { guard: false }, providersList: [provider] },
    history: [],
    _role: null,
    provider,
    _provider: provider,
    _engDesignTokens: null,
    _advisorRound: 0,
    _lastAdvisorOutput: null,
    _asyncSubagents: new Map(),
    _asyncQueue: [],
    tools: [], // W13：子代理装配读 parent.tools（真跑夹具——无工具子代理仅产报告）
    _subAgentCounter: 0,
  }
}

function advisorCtx(agent) {
  return { agent, cwd: work, depth: 0, callbacks: { onToolPanel: () => {} } }
}

/** spawn 缝（W13 改指）：真核 spawn——子代理真跑打 mock provider（零外网）。 */
function spawnHarness() {
  return {
    ctx: (agent) => ({
      agent, cwd: work, depth: 0,
      callbacks: { onSubagent: () => {}, onToolPanel: () => {} },
      getAuto: () => false,
    }),
  }
}

const BATCH = "docs/batches/2026-09-11-demo.md"
const DESIGN = "docs/design/FEATURE.md"
/** 子代理报告（mock 末步——≥ MIN_REPORT_CHARS 免续写扩写轮）。 */
const CHILD_REPORT = "Subagent report (mock): 工程链脊柱验证完成。".repeat(12)
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
  const llm = await mockLLM([reviewerStep, reviewerStep, reviewerStep, reviewerStep, { content: CHILD_REPORT }])
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

    // spawn 放行两路：阻塞路 + 异步路（同一真实门 + 真子运行——mock provider）
    const h = spawnHarness()
    const calls0 = llm.calls
    await subagentTool.execute({ task: "实现功能", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent))
    assert.ok(llm.calls > calls0, "阻塞路带 token 放行（真子运行触达 mock provider）")
    const ack = JSON.parse(await subagentTool.execute({ task: "异步实现", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: true }, h.ctx(agent)))
    assert.equal(ack.status, "running", "异步路带 token 放行")
    await until(() => agent._asyncSubagents.get(String(ack.id))?.done === true, 5000)
    assert.equal(agent._asyncSubagents.get(String(ack.id))?.done, true, "异步路真子运行跑完（同一门）")

    // 链终消费（父侧核销）
    const consumed = await subagentTool.execute({ action: "consume-design", designId }, h.ctx(agent))
    assert.match(consumed, /design slot consumed/, "链终消费回执")
    assert.equal(agent._engDesignTokens.has(designId), false, "槽已消费（再 spawn 无授权）")
  } finally {
    await llm.close()
  }
})

test("② 边界：链未收口——同 designId 修正复用放行；消费后再 spawn → 机械拒", async () => {
  const llm = await mockLLM([reviewerStep, reviewerStep, reviewerStep, { content: CHILD_REPORT }])
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

    const calls0 = llm.calls
    await subagentTool.execute({ task: "首轮实现", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent))
    // 修正轮：同一 designId + 同 token 复用（docs FIRST 窗口内放行）
    await subagentTool.execute({ task: "修正轮", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent))
    assert.ok(llm.calls - calls0 >= 2, "修正窗口内同 designId 复用放行（不需新评审——两轮真跑）")

    await subagentTool.execute({ action: "consume-design", designId }, h.ctx(agent))
    const calls1 = llm.calls
    await assert.rejects(
      () => subagentTool.execute({ task: "链终后再来", role: "eng-coder", designToken: token, designId, batchDoc: BATCH, async: false }, h.ctx(agent)),
      /designId not found|Invalid or missing design token/,
      "消费后同 designId 再 spawn → 机械拒（需新评审新 token）",
    )
    assert.equal(llm.calls, calls1, "拒绝路径零 spawn（零新请求）")
  } finally {
    await llm.close()
  }
})

test("② 错误：无 token spawn eng-coder → 机械拒绝 + 零 spawn（不产生子代理）", async () => {
  const llm = await mockLLM([reviewerStep])
  try {
    const agent = engParent(llm)
    const h = spawnHarness()
    const calls0 = llm.calls
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
    assert.equal(llm.calls, calls0, "拒绝路径零 spawn（零新请求）")
    assert.equal(agent._asyncSubagents.size, 0, "异步池空（拒在入池之前）")
  } finally {
    await llm.close()
  }
})
