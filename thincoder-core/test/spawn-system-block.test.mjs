/**
 * spawn-system-block.test.mjs — 台账 #23 实施轮用例（AGENT-LOOP-SUBAGENT.md §6.26 用例表 U1–U7）：
 * spawn 级固定机制性指令（批次档路径行 + 审计模板 / A2 摘要 / touched 快照）改走 **system 固块**
 * （`child._spawnSystemBlock` spawn 单点写入 → 核 `prepareRun` 在槽位装配之后、项目指令之前拼接），
 * `input` 只留任务书；压缩只重建 `history` ⇒ 结构上吞不掉。
 *   U1 正常：eng-coder spawn —— 批次档行进 system ∧ input 不含（先红：system 无该行）
 *   U2 正常：审计 spawn —— 五锚在 system ∧ input 不含（先红：五锚只在 input）
 *   U3 边界：长史压缩（`compressFallback` 零网络 + `compressIfNeeded` 桩 provider 一条）——
 *        五锚仍在 system ∧ `agent.history` 无五锚（先红：两处皆无——压缩吞首条 = 病根复现）
 *   U4 边界：同一 child 连跑两次 `prepareRun` ⇒ 两次 `systemPrompt` 逐字节相等（缓存契约）
 *   U5 边界：无固块路径（depth-0 / explore）⇒ 零固块 ∧ 以槽位装配产物起头（零回归）
 *   U6 边界：designer 勘察 spawn（attempt = null）⇒ system 无审计五锚 ∧ 无批次档行
 *   U7 边界：整请求体（system + history）计数 —— 固块文本恰出现 1 次且该次在 system 面（先红：在 history）
 * 驱动面 = 真 `buildSpawnChild` + 真 `prepareRun`（零网络；压缩一条用 fetch 桩），照
 * `thincoder-cli/test/batch-doc-gate.test.mjs` / `compress-form.test.mjs` 两份先例。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"

import { buildSpawnChild } from "../agent-tools/subagent-spawn.mjs"
import { prepareRun } from "../agent/setup.mjs"
import { assemblePrompt } from "../prompt-overlays.mjs"
import { ENG_TASK_BOOK_MIN } from "../agent-tools/spawn-gates.mjs"
import { compressFallback, compressIfNeeded } from "../context.mjs"

/** 审计五锚（§6.26 U2——块头逐字；首锚 = 块起点）。 */
const AUDIT_ANCHORS = [
  "[Audit instructions — mechanical template",
  "[Parent spawn task book — mechanical summary",
  "Zero-git scope authority",
  "[Audit budget — mechanical]",
  "[Audit report format — mechanical template",
]
const BATCH_LINE = (abs) => `Batch record (batchDoc): ${abs}`
const DESIGN_ID = "did-spawn-block"
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
/** 审计父任务书夹具（三要素段齐备——A2 摘要面）。 */
const PARENT_TASK_BOOK = `# 派单\n\n## Docs involved\n- docs/core/design/X.md\n\n## 文件清单\n- src/a.mjs\n\n## 验收标准\n- AC1 绿\n\n## 背景\n长背景不应被带出\n`

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "spawn-block-")) })
/** Windows 实测：depth-0 装配链的句柄释放滞后 → rmSync 偶发 EPERM——短重试兜底
 *  （`setup-reminders.test.mjs` / CLI `eng-designer-role.test.mjs` 同款手法）。 */
async function rmTmp(dir) {
  for (let i = 0; ; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { if (i >= 10) return; await new Promise((r) => setTimeout(r, 100)) }
  }
}
afterEach(async () => { await rmTmp(tmp) })

/** 真实批次档夹具（cwd 相对路径 + 固块应携带的绝对路径）。 */
function makeBatchDoc(rel = "docs/batches/2026-09-22-spawn-block.md") {
  const abs = resolve(tmp, rel)
  mkdirSync(join(tmp, "docs", "batches"), { recursive: true })
  writeFileSync(abs, "# 批次记录（测试夹具）\n")
  return { rel, abs }
}

/** 最小 parent（eng-coder 侧带活 token 槽）；`over` 可载审计父字段（_role / _touchedFiles / _engTaskInput）。 */
function parent0(over = {}) {
  const token = liveTok()
  return {
    cwd: tmp,
    provider: { name: "p", model: "m" },
    config: { agent: { engineering: true } },
    tools: [{ name: "read", readonly: true }],
    _engDesignTokens: new Map([[DESIGN_ID, token]]),
    _tok: token,
    ...over,
  }
}

/** 真装配（role 指定；`attempt` = 审计尝试序号——null = 非审计路径）。 */
const build = (parent, args, role, attempt = null) =>
  buildSpawnChild(parent, { agent: parent, callbacks: {} }, args, role, true, [], [], attempt)

/** 整请求体文本（system + history——history 内容面按串归一）。 */
const historyText = (agent) => agent.history.map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""))).join("\n")
const countOf = (hay, needle) => hay.split(needle).length - 1

/** 40 条交替史（> 切割面——`splitHistory` 有中段可压）。 */
function longHistory() {
  const h = []
  for (let i = 0; i < 40; i++) h.push(i % 2 === 0 ? { role: "user", content: `u${i}` } : { role: "assistant", content: `a${i}` })
  return h
}

/** fetch 桩（捕获出站请求体；压缩面零网络——`compress-form.test.mjs` 同款最小形）。 */
function stubFetch({ content = "SUMMARY-BODY" } = {}) {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    const sse = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [new TextEncoder().encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

// ─── U1 正常：eng-coder spawn ────────────────────────────────────────────────

test("U1 正常：eng-coder spawn —— 批次档行进 system 固块 ∧ input = 纯任务书（先红：system 无该行）", async () => {
  const { rel, abs } = makeBatchDoc()
  const parent = parent0()
  const args = { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel, designId: DESIGN_ID, designToken: parent._tok }
  const built = build(parent, args, "eng-coder")

  assert.equal(built.child._spawnSystemBlock, BATCH_LINE(abs), "固块单点绑定 = 批次档行（D23-1）")
  assert.ok(!built.input.includes("Batch record (batchDoc)"), "input 不含固块（D23-6——纯任务书）")
  assert.ok(!built.child._engTaskInput.includes("Batch record (batchDoc)"), "_engTaskInput 同源 = 纯任务书")

  const run = await prepareRun(built.child, built.input, {}, { depth: 1 })
  assert.ok(run.systemPrompt.includes(BATCH_LINE(abs)), "systemPrompt 含批次档行（A23-1）")
  assert.ok(!historyText(built.child).includes("Batch record (batchDoc)"), "history 零出现（压缩吞不掉的结构性依据）")
  const base = assemblePrompt("eng-coder").prompt
  assert.ok(run.systemPrompt.startsWith(base), "拼接位 = 槽位装配之后（固块不在首位）")
})

// ─── U2 正常：审计 spawn ────────────────────────────────────────────────────

test("U2 正常：审计 spawn —— 五锚在 system 固块 ∧ input 不含（先红：五锚只在 input）", async () => {
  const parent = parent0({ _role: "eng-coder", _touchedFiles: ["src/a.mjs", "test/b.test.mjs"], _engTaskInput: PARENT_TASK_BOOK })
  const built = build(parent, { task: "audit the delivery" }, "explore", 1)

  for (const a of AUDIT_ANCHORS) {
    assert.ok(built.child._spawnSystemBlock.includes(a), `固块含锚：${a}`)
    assert.ok(!built.input.includes(a), `input 不含锚：${a}`)
  }
  assert.equal(built.child._engTaskInput, undefined, "审计子代理无 _engTaskInput 绑定（只读面）")

  const run = await prepareRun(built.child, built.input, {}, { depth: 1 })
  for (const a of AUDIT_ANCHORS) {
    assert.ok(run.systemPrompt.includes(a), `systemPrompt 含锚（A23-2）：${a}`)
    assert.ok(!historyText(built.child).includes(a), `history 不含锚：${a}`)
  }
  assert.ok(run.systemPrompt.includes("- src/a.mjs"), "touched 快照（机制面）在固块内")
  assert.ok(run.systemPrompt.includes("Docs involved"), "A2 任务书摘要在固块内（三要素段逐字）")
  assert.ok(!run.systemPrompt.includes("长背景不应被带出"), "冗长背景段不带出（A2 摘要语义零改）")
})

// ─── U3 边界：长史压缩后固块仍在 system ─────────────────────────────────────

test("U3 边界：长史压缩后五锚仍在 system ∧ history 无五锚（fallback 零网络 + compressIfNeeded 桩）", async () => {
  const newAuditChild = async () => {
    const parent = parent0({ _role: "eng-coder", _touchedFiles: [], _engTaskInput: PARENT_TASK_BOOK })
    const built = build(parent, { task: "audit the delivery" }, "explore", 1)
    built.child.history = longHistory()
    const run = await prepareRun(built.child, built.input, {}, { depth: 1 })
    return { child: built.child, systemPrompt: run.systemPrompt }
  }

  // (a) 降级路（零网络）
  const a = await newAuditChild()
  assert.equal(compressFallback(a.child), true, "长史降级压缩发生")
  for (const anchor of AUDIT_ANCHORS) {
    assert.ok(a.systemPrompt.includes(anchor), `压缩后 system 仍有锚（A23-3）：${anchor}`)
    assert.ok(!historyText(a.child).includes(anchor), `压缩后 history 无锚：${anchor}`)
  }
  assert.ok(historyText(a.child).includes("[Context was automatically compacted") || historyText(a.child).includes("[Context was truncated"), "压缩确已重建 history（非空转）")

  // (b) 摘要路（桩 provider——首条 = 压缩请求的 system 面）
  const b = await newAuditChild()
  const stub = stubFetch()
  try {
    assert.equal(await compressIfNeeded(b.child, 1, {}, { systemPrompt: b.systemPrompt }), true, "阈值触达 ⇒ 摘要压缩发生")
    assert.equal(stub.calls.length, 1, "恰一次摘要调用")
    for (const anchor of AUDIT_ANCHORS) {
      assert.ok(stub.calls[0].messages[0].content.includes(anchor), `压缩请求 system 面携固块：${anchor}`)
      assert.ok(!historyText(b.child).includes(anchor), `摘要路压缩后 history 无锚：${anchor}`)
    }
  } finally { stub.restore() }
})

// ─── U4 边界：同 child 两次装配逐字节相等（缓存契约）────────────────────────

test("U4 边界：同一 child 连跑两次 prepareRun ⇒ systemPrompt 逐字节相等（前缀缓存契约）", async () => {
  const { rel } = makeBatchDoc()
  const parent = parent0()
  const built = build(parent, { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel, designId: DESIGN_ID, designToken: parent._tok }, "eng-coder")
  const first = await prepareRun(built.child, built.input, {}, { depth: 1 })
  const second = await prepareRun(built.child, built.input, {}, { depth: 1 })
  assert.equal(second.systemPrompt, first.systemPrompt, "两次装配逐字节相等（固块生命周期内恒定——A23-4）")
})

// ─── U5 边界：无固块路径零回归 ──────────────────────────────────────────────

test("U5 边界：无固块路径（depth-0 / explore）⇒ 零固块 ∧ 以槽位装配产物起头（零回归）", async () => {
  // depth-0（非工程模式 ⇒ scenario = normal）
  const plain = {
    config: { agent: {} }, history: [], tools: [], cwd: tmp,
    _pendingReminders: [], autoApprove: false, memory: undefined,
  }
  const depth0 = await prepareRun(plain, "task", {}, { depth: 0 })
  assert.equal(plain._spawnSystemBlock, undefined, "depth-0 不绑固块")
  const normalBase = assemblePrompt("normal").prompt
  assert.ok(depth0.systemPrompt.startsWith(normalBase), "depth-0 以槽位装配产物起头")
  assert.ok(!depth0.systemPrompt.includes("Batch record (batchDoc)") && !depth0.systemPrompt.includes("[Audit scope"), "depth-0 零固块（拼接分支不进——A23-4）")

  // explore 子代理（role ≠ 工程角色 ⇒ engineeringRole false）
  const parent = parent0()
  const built = build(parent, { task: "survey the repo" }, "explore", null)
  assert.equal(built.child._spawnSystemBlock, undefined, "explore spawn 零固块绑定")
  const exploreRun = await prepareRun(built.child, built.input, {}, { depth: 1 })
  const exploreBase = assemblePrompt("explore").prompt
  assert.ok(exploreRun.systemPrompt.startsWith(exploreBase), "explore 以槽位装配产物起头")
  assert.ok(!exploreRun.systemPrompt.slice(exploreBase.length).includes("[Audit"), "尾部只可能是既有 [4] 层——本批零新增")

  // 显式 null（防御面）：拼接分支同判
  built.child._spawnSystemBlock = null
  const nullRun = await prepareRun(built.child, built.input, {}, { depth: 1 })
  assert.equal(nullRun.systemPrompt, exploreRun.systemPrompt, "显式 null 与缺省逐字节同形（零拼接）")
})

// ─── U6 边界：designer 勘察 spawn ───────────────────────────────────────────

test("U6 边界：designer 勘察 spawn（attempt = null）⇒ 无审计五锚 ∧ 无批次档行", async () => {
  const parent = parent0({ _role: "eng-designer", _touchedFiles: ["src/x.mjs"], _engTaskInput: PARENT_TASK_BOOK })
  const built = build(parent, { task: "勘察现状" }, "explore", null)
  assert.equal(built.child._spawnSystemBlock, undefined, "勘察 spawn 零固块（engineeringRole false ∧ attempt null）")
  const run = await prepareRun(built.child, built.input, {}, { depth: 1 })
  for (const a of AUDIT_ANCHORS) assert.ok(!run.systemPrompt.includes(a), `勘察 system 无锚：${a}`)
  assert.ok(!run.systemPrompt.includes("Batch record (batchDoc)"), "勘察 system 无批次档行")
})

// ─── U7 边界：整请求体独占性 ────────────────────────────────────────────────

test("U7 边界：整请求体（system + history）固块文本恰 1 次且在 system 面（先红：在 history）", async () => {
  const parent = parent0({ _role: "eng-coder", _touchedFiles: ["src/a.mjs"], _engTaskInput: PARENT_TASK_BOOK })
  const built = build(parent, { task: "audit the delivery" }, "explore", 1)
  const run = await prepareRun(built.child, built.input, {}, { depth: 1 })

  const anchor = AUDIT_ANCHORS[0]
  const body = `${run.systemPrompt}\n${historyText(built.child)}`
  assert.equal(countOf(body, anchor), 1, "整请求体恰 1 次（独占性——A23-4）")
  assert.equal(countOf(run.systemPrompt, anchor), 1, "该 1 次在 system 面")
  assert.equal(countOf(historyText(built.child), anchor), 0, "history 零出现（压缩后仍恰 1 次的结构性依据）")

  const batchParent = parent0()
  const { rel, abs } = makeBatchDoc()
  const engBuilt = build(batchParent, { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel, designId: DESIGN_ID, designToken: batchParent._tok }, "eng-coder")
  const engRun = await prepareRun(engBuilt.child, engBuilt.input, {}, { depth: 1 })
  const engBody = `${engRun.systemPrompt}\n${historyText(engBuilt.child)}`
  assert.equal(countOf(engBody, BATCH_LINE(abs)), 1, "批次档行整请求体恰 1 次")
  assert.equal(countOf(historyText(engBuilt.child), BATCH_LINE(abs)), 0, "批次档行 history 零出现")
})
