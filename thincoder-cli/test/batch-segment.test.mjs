/**
 * batch-segment.test.mjs — 批次档段写入工具（ENGINEERING-MODE.md §2.20 · FR22 F1-F7 / N1-N5）。
 * 用例表 T43–T53 1:1 落地（含 T43b/T49b/T52b；T46 的 V3 三态在 test/doc-consistency.test.mjs）：
 *   T43 正常 append（既有行字节不变）· T43b 段标题缺失拒 · T44 越段/未知段拒 ·
 *   T45 凭证剥除零命中 · T47 路径门 + 只读面零变更（含挂载面 T47b）·
 *   T48 来源戳不可伪造（含骨架行不计/连写 N=1,2）· T49b 提示词双源（含限定子串）·
 *   T50 骨架保护 · T51 并发隔离（实例键）· T52/T52b 超量拒 + 分段追加 N 顺延 ·
 *   T53 身份判据同源（绑定即身份——不读他批状态）。
 * 纯单元：零网络、零子代理启动、零真实评审（advisor 只在门禁抛出点驱动）。
 * T47b 经 prepareRun + buildSpawnChild（真 git 子进程面）——slow() 门控（2026-09-12 收尾轮 9）。
 */
import { test, beforeEach, afterEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { batchSegmentTool, batchDocForReview, resolveBatchDocPath, MAX_TEXT_CHARS } from "@thincoder/core/agent-tools/batch-segment.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { _advisorToolsFor } from "@thincoder/core/advisor/run.mjs"
import { buildAdvisorSystemPrompt } from "@thincoder/core/advisor.mjs"
import { advisorTool } from "@thincoder/core/agent-tools/advisor.mjs"
import { prepareRun } from "@thincoder/core/agent/setup.mjs"

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "batch-segment-")) })
/** Windows 实测（eng-designer-role.test.mjs 同款手法）：setup 深度 0 链路的句柄释放滞后 →
 *  rmSync 偶发 EPERM——await 重试兑底（非本工具语义，仅夹具清理）。 */
async function rmTmp(dir) {
  for (let i = 0; ; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { if (i >= 10) return; await new Promise((r) => setTimeout(r, 100)) }
  }
}
afterEach(async () => { await rmTmp(tmp) })

/** 六段骨架夹具（§1.12 模板形态；`_（…）_` = 占位行）。 */
const skeleton = (over = {}) => [
  "# 批次记录（测试夹具）", "",
  "## §1 讨论（主 agent）", "", "讨论内容", "",
  "## §2 批次任务（eng-designer 自写）", "", over.s2 ?? "_（待实施）_", "",
  "## §3 设计评审（评审子代理自写）", "", "### 轮次与发现（发现摘要 / 🔴 处置——**凭证值不落档**）", "", over.s3 ?? "_（待实施）_", "",
  "## §4 用户批准（主 agent 记）", "", "_（待批准）_", "",
  "## §5 实施记录（eng-coder 自写）", "", over.s5 ?? "_（待实施）_", "",
  "## §6 验证与收口（父代理自写）", "", "_（待核销）_", "",
].join("\n")

/** 建真实批次档（cwd 相对路径 = docs/batches/<name>）→ 返回绝对路径。 */
function makeDoc(content = skeleton(), name = "b.md") {
  mkdirSync(join(tmp, "docs", "batches"), { recursive: true })
  const abs = join(tmp, "docs", "batches", name)
  writeFileSync(abs, content)
  return abs
}
const read = (abs) => readFileSync(abs, "utf8")
const catchErr = async (fn) => { try { await fn(); return undefined } catch (e) { return e } }
/** append-only 反证：旧行必须是新行的**顺序子序列**（逐字节）。 */
function assertLinesPreserved(oldText, newText) {
  const next = newText.split("\n")
  let i = 0
  for (const line of oldText.split("\n")) {
    const at = next.indexOf(line, i)
    assert.ok(at >= 0, `既有行在新档中丢失/被改写：${JSON.stringify(line)}`)
    i = at + 1
  }
}
const designer = (abs) => batchSegmentTool(abs)
const reviewer = (abs) => batchSegmentTool(abs, { review: true })
const ctxFor = (role) => ({ agent: { cwd: tmp, ...(role ? { _role: role } : {}) } })

// ── T43 正常 ────────────────────────────────────────────────────────────────
test("T43 正常：designer 写 §2——段尾追加 + 既有行字节不变（append-only 反证）", async () => {
  const abs = makeDoc()
  const props = designer(abs).parameters.properties
  assert.deepEqual(Object.keys(props).sort(), ["segment", "text"], "schema 无 path（语法上写不到别处——AC29）")
  assert.deepEqual(designer(abs).parameters.required, ["segment", "text"], "必填参数 = 段号 + 文本")
  const before = read(abs)
  const out = await designer(abs).execute({ segment: "§2", text: "### 本批任务\n\n- 条目一" }, ctxFor("eng-designer"))
  const after = read(abs)
  assert.match(out, /appended .* to §2/, "返回写明追加段")
  assertLinesPreserved(before, after)
  const s2 = after.split("## §3")[0]
  assert.ok(s2.includes("### 本批任务") && s2.includes("- 条目一"), "内容落在 §2（下一条段标题之前）")
  assert.ok(after.includes("## §2 批次任务（eng-designer 自写）\n\n_（待实施）_\n\n### 本批任务"), "插入点 = 段尾（占位行之后）")
  assert.ok(after.indexOf("### 本批任务") < after.indexOf("## §3"), "未越段写入")
  // §2 无来源戳（戳只加在 §3——AC34 作用域）
  assert.ok(!s2.includes("### 轮次"), "§2 不加节标题")
  // eng-coder 写 §5 同款
  const out5 = await designer(abs).execute({ segment: "§5", text: "交付摘要：改了 X" }, ctxFor("eng-coder"))
  assert.match(out5, /to §5/, "eng-coder → §5")
  assert.ok(read(abs).includes("交付摘要：改了 X"), "§5 落到档内")
})

// ── T43b 段标题缺失 ─────────────────────────────────────────────────────────
test("T43b 错误：目标段标题缺失 → throw（纠正动作 = 创建方先补骨架）", async () => {
  const abs = makeDoc("# 批次\n\n## §1 讨论（主 agent）\n\n内容\n\n## §3 设计评审\n\n_（待实施）_\n")
  const before = read(abs)
  const e = await catchErr(() => designer(abs).execute({ segment: "§2", text: "x" }, ctxFor("eng-designer")))
  assert.ok(e instanceof Error, "无 §2 标题 → 必须 throw")
  assert.match(e.message, /no "## §2" section header/, "消息点明缺失段标题")
  assert.match(e.message, /creator|add the "## §2/, "消息含纠正动作")
  assert.equal(read(abs), before, "拒绝时档未改动（fail-closed 不写半截）")
})

// ── T44 越段 / 未知段 ───────────────────────────────────────────────────────
test("T44 错误：越段/未知段 → throw（身份定权限——参数只声明段号）", async () => {
  const abs = makeDoc()
  const before = read(abs)
  const cases = [
    [designer(abs), "eng-designer", "§3", /§3 is not yours to write/],
    [designer(abs), "eng-coder", "§2", /§2 is not yours to write/],
    [reviewer(abs), undefined, "§2", /§2 is not yours to write/],
    [designer(abs), "eng-designer", "§9", /§9 is not yours to write/],
    [designer(abs), "eng-designer", "垃圾", /unknown segment/],
    [batchSegmentTool(abs), undefined, "§2", /no segment is writable by this caller/],
  ]
  for (const [tool, role, segment, re] of cases) {
    const e = await catchErr(() => tool.execute({ segment, text: "越段尝试" }, ctxFor(role)))
    assert.ok(e instanceof Error, `${segment}/${role ?? "no-role"} → 必须 throw`)
    assert.match(e.message, re, `拒绝理由可引用：${segment}/${role ?? "no-role"}`)
  }
  assert.equal(read(abs), before, "全部越段尝试零写入")
})

// ── T45 凭证剥除 ────────────────────────────────────────────────────────────
test("T45 边界：凭证剥除——落档零命中 + 其余内容逐字保留", async () => {
  const abs = makeDoc()
  const text = [
    "### 发现",
    "[DESIGN-TOKEN:6f1c9a2e-1111-2222-3333-444455556666:1757500000000]",
    "designId: 6f1c9a2e-1111-2222-3333-444455556666",
    "VERDICT: pass",
    "计数：🔴 0 · 🟡 1 · 🔵 2",
    "行内提及 designId: deadbeef 也应剥除",
  ].join("\n")
  await reviewer(abs).execute({ segment: "§3", text }, ctxFor())
  const doc = read(abs)
  assert.ok(!doc.includes("DESIGN-TOKEN"), "token 形态零命中")
  assert.ok(!/designId\s*:\s*\S/.test(doc), "designId 冒号态零命中")
  assert.ok(!doc.includes("deadbeef"), "行内形态同剥（子串剥除）")
  for (const keep of ["### 发现", "VERDICT: pass", "计数：🔴 0 · 🟡 1 · 🔵 2"]) {
    assert.ok(doc.includes(keep), `其余内容逐字保留：${keep}`)
  }
})

// ── T47 / T47b 路径门 + 挂载面 ──────────────────────────────────────────────
test("T47 错误/边界：路径门（若传则须可读）+ 代码评审工具集零变更", async () => {
  const abs = makeDoc()
  const e1 = await catchErr(() => resolveBatchDocPath(tmp, "docs/batches/none.md"))
  assert.match(e1?.message ?? "", /not a readable file/, "不可读路径 → throw")
  const eEmpty = await catchErr(() => resolveBatchDocPath(tmp, "   "))
  assert.match(eEmpty?.message ?? "", /non-empty/, "空值 → throw（若传则须可读）")
  assert.equal(resolveBatchDocPath(tmp, "docs/batches/b.md"), abs, "可读路径 → 绝对路径（\\ 归一）")
  // advisor 工具门禁：传不可读 batchDoc → throw
  const agent = { cwd: tmp, config: {}, history: [], _advisorRuns: new Map() }
  await assert.rejects(
    () => advisorTool.execute({ type: "design", documents: ["docs/design/ENGINEERING-MODE.md"], batchDoc: "docs/batches/none.md" }, { agent }),
    /not a readable file/, "评审带不可读 batchDoc → throw（评审未启动）")
  assert.ok(!advisorTool.parameters.required?.includes("batchDoc"), "不强制必传（N5 零回归）")
  // 工具集：仅「设计评审 + 已绑定」才挂写通道；未绑定/代码评审 → 零变更
  const code = _advisorToolsFor(agent, "code")
  assert.ok(!code.byName.has("batch_segment"), "代码评审工具集不含本工具")
  assert.deepEqual([...code.byName.keys()], [..._advisorToolsFor(agent).byName.keys()], "与无参调用（旧签名默认）逐字相同——代码评审零变更")
  assert.deepEqual([...code.byName.keys()], ["read", "glob", "grep", "ls", "lsp", "code_search"], "只读工具集（检索面恒在——六工具；未绑定索引时执行面端中立降级）恒定")
  assert.ok(!_advisorToolsFor(agent, "design", null).byName.has("batch_segment"), "设计评审未绑定 → 不挂载（fail-closed）")
  assert.ok(_advisorToolsFor(agent, "design", abs).byName.has("batch_segment"), "设计评审 + 已绑定 → 挂载")
})

slow("T47b 边界：挂载面 + spawn 绑定（eng-designer/eng-coder 有；主 agent 无——不变量 3）", async () => {
  const abs = makeDoc()
  // §2.20.2 spawn 绑定：buildSpawnChild 把批次档绝对路径记在 child 上
  const token = `${randomUUID()}:${Date.now() + 3600e3}`
  const parent = {
    cwd: tmp, provider: { name: "p", model: "m" }, config: { agent: { engineering: true } }, tools: [],
    _engDesignTokens: new Map([["did", token]]),
  }
  const built = buildSpawnChild(parent, { agent: parent, callbacks: {} }, { task: "t", batchDoc: "docs/batches/b.md" }, "eng-designer", false, [], [], null)
  assert.equal(built.child._batchDoc, abs, "eng-designer：child._batchDoc = 批次档绝对路径")
  const coderBuilt = buildSpawnChild(parent, { agent: parent, callbacks: {} }, { task: "t", batchDoc: "docs/batches/b.md", designId: "did", designToken: token }, "eng-coder", false, [], [], null)
  assert.equal(coderBuilt.child._batchDoc, abs, "eng-coder：child._batchDoc = 批次档绝对路径")
  const mk = (role) => ({
    config: { agent: { engineering: true } }, history: [], tools: [], cwd: tmp,
    _pendingReminders: [], autoApprove: true, memory: undefined, _role: role, _batchDoc: abs,
  })
  const coder = await prepareRun(mk("eng-coder"), "task", {}, { depth: 1 })
  const coderTool = coder.toolByName.get("batch_segment")
  assert.ok(coderTool, "eng-coder 挂 batch_segment（§2.20.3）")
  await coderTool.execute({ segment: "§5", text: "coder 写入" }, { agent: mk("eng-coder") })
  assert.ok(read(abs).includes("coder 写入"), "eng-coder 工具写 §5")
  const designerRun = await prepareRun(mk("eng-designer"), "task", {}, { depth: 1 })
  assert.ok(designerRun.toolByName.get("batch_segment"), "eng-designer 挂 batch_segment（§2.20.3）")
  const main = await prepareRun(mk(undefined), "task", {}, { depth: 0 })
  assert.ok(!main.toolByName.has("batch_segment"), "主 agent 不挂载（§1/§4/§6 走普通文档写）")
})

// ── T48 来源戳不可伪造 ──────────────────────────────────────────────────────
test("T48 边界：来源戳不可伪造（工具生成 / 自带标题被忽略 / 连写 N=1,2 / 骨架行不计）", async () => {
  const abs = makeDoc()
  const nOf = (t) => [...t.matchAll(/^### 轮次 (\d+)（评审子代理）$/gm)].map((m) => m[1])
  await reviewer(abs).execute({ segment: "§3", text: "第一轮发现表\nVERDICT: pass" }, ctxFor())
  assert.deepEqual(nOf(read(abs)), ["1"], "① 工具写的标题 + N=1（档内已有骨架行 `### 轮次与发现（…）` 不计——④）")
  // ② 调用方自带同名标题 → 被忽略（丢弃），N 由工具算
  await reviewer(abs).execute({ segment: "§3", text: "### 轮次 7（评审子代理）\n\n第二轮" }, ctxFor())
  const doc = read(abs)
  assert.deepEqual(nOf(doc), ["1", "2"], "② 自带标题被丢弃、N 顺延为 2（伪造无效）")
  assert.ok(!doc.includes("轮次 7"), "伪造戳不入档")
  assert.ok(/^### 轮次 2（评审子代理）$/m.test(doc) && doc.includes("第二轮"), "第二轮成节且带工具戳")
  assert.equal(doc.match(/### 轮次与发现（/g).length, 1, "骨架行原样保留（未被改写）")
})

// ── T49b 提示词面（双源） ────────────────────────────────────────────────────
const WRITE_RE = /把本轮\*\*发现表 \+ VERDICT \+ 计数逐字\*\*写进批次档 §3/
const QUAL_RE = /仅当本评审为设计评审、且工具面里已挂载 `batch_segment` 时/

test("T49b 错误：代码评审不带写指令（round 1 无此句；round 2+ 该句必带限定）", () => {
  const codeR1 = buildAdvisorSystemPrompt({}, null, "code")
  assert.doesNotMatch(codeR1, WRITE_RE, "代码评审 round 1 注入文本不含写指令")
  // round 2+：设计 + 代码共用 ROUND2/ROUND3——指令在，但必带适用面限定（否则代码评审误报「§3 未写入」）
  const agent = { _advisorRound: 1, _lastAdvisorOutput: "x".repeat(300), _mutatedThisRun: true }
  const codeR2 = buildAdvisorSystemPrompt(agent, null, "code")
  assert.match(codeR2, WRITE_RE, "round 2 共用提示词含写指令")
  assert.match(codeR2, QUAL_RE, "该句带「仅设计评审 / 工具已挂载」限定（代码评审不适用）")
  // 设计评审 round 1 亦含（advisor-design.md——评审 #3）
  assert.match(buildAdvisorSystemPrompt({}, null, "design"), WRITE_RE, "设计评审 round 1 注入文本含写指令")
})

// ── T50 骨架保护 ────────────────────────────────────────────────────────────
test("T50 边界：text 含 `^## §N` 行 → throw（防段定位错位）", async () => {
  const abs = makeDoc()
  const before = read(abs)
  const e = await catchErr(() => designer(abs).execute({ segment: "§2", text: "前言\n\n## §4 用户批准（主 agent 记）\n\n批准\n" }, ctxFor("eng-designer")))
  assert.match(e?.message ?? "", /section header line/, "骨架保护拒")
  assert.match(e?.message ?? "", /Nothing was written/, "消息含纠正动作")
  assert.equal(read(abs), before, "拒绝时档未改动")
})

// ── T51 并发隔离（实例键） ──────────────────────────────────────────────────
test("T51 边界：两设计评审并发——各自落自档（实例键绑定，不串档）", async () => {
  const docA = makeDoc(skeleton(), "a.md")
  const docB = makeDoc(skeleton(), "b.md")
  const docsA = ["docs/design/A.md"]
  const docsB = ["docs/design/B.md"]
  const agent = {
    cwd: tmp, config: {},
    _asyncAdvisors: new Map([
      ["1", { status: "running", reviewType: "design", documents: docsA, run: { reviewType: "design", batchDoc: docA } }],
      ["2", { status: "running", reviewType: "design", documents: docsB, run: { reviewType: "design", batchDoc: docB } }],
    ]),
  }
  assert.equal(batchDocForReview(agent, docsA), docA, "A 评审实例 → A 档")
  assert.equal(batchDocForReview(agent, docsB), docB, "B 评审实例 → B 档（无单值会话态）")
  assert.equal(batchDocForReview(agent, ["docs/design/C.md"]), null, "未知文档集 → 无绑定（fail-closed）")
  // 同步路径以 callbacks 为准（带 batchDoc 键，可能为 null）——不得回看池条目（防同步/异步混跑串档）
  assert.equal(batchDocForReview(agent, docsA, { batchDoc: null }), null, "同步未绑定 → null（不看池）")
  assert.equal(batchDocForReview(agent, docsA, { batchDoc: docB }), docB, "同步绑定以 callbacks 为准")
  // run.mjs 的挂载路径：各自的工具集取各自的绑定 → 各写各档
  await _advisorToolsFor(agent, "design", batchDocForReview(agent, docsA)).byName.get("batch_segment")
    .execute({ segment: "§3", text: "A 轮发现" }, ctxFor())
  await _advisorToolsFor(agent, "design", batchDocForReview(agent, docsB)).byName.get("batch_segment")
    .execute({ segment: "§3", text: "B 轮发现" }, ctxFor())
  assert.ok(read(docA).includes("A 轮发现") && !read(docA).includes("B 轮发现"), "A 档只含 A 的发现")
  assert.ok(read(docB).includes("B 轮发现") && !read(docB).includes("A 轮发现"), "B 档只含 B 的发现（不串档）")
})

// ── T52 / T52b 超量 ─────────────────────────────────────────────────────────
test("T52/T52b 边界：超量拒（引导分段追加）+ 分段追加各成节 N 顺延", async () => {
  const abs = makeDoc()
  const before = read(abs)
  const e = await catchErr(() => reviewer(abs).execute({ segment: "§3", text: "x".repeat(MAX_TEXT_CHARS + 1) }, ctxFor()))
  assert.match(e?.message ?? "", /the limit is 20000 per call/, "超量必拒")
  assert.match(e?.message ?? "", /每次调用各成节、N 顺延/, "消息引导分段追加（各成节、N 顺延）")
  assert.equal(read(abs), before, "超量拒绝零写入")
  // T52b：拆成两次调用 → 两次各成节，N = 1、2
  await reviewer(abs).execute({ segment: "§3", text: "前半发现表" }, ctxFor())
  await reviewer(abs).execute({ segment: "§3", text: "后半发现表" }, ctxFor())
  const doc = read(abs)
  const ns = [...doc.matchAll(/^### 轮次 (\d+)（评审子代理）$/gm)].map((m) => m[1])
  assert.deepEqual(ns, ["1", "2"], "两次调用各成节、N 顺延（档案按节记）")
  assert.ok(doc.indexOf("前半发现表") < doc.indexOf("后半发现表"), "顺序追加")
})

// ── T53 身份判据同源 ────────────────────────────────────────────────────────
test("T53 正常：身份判据与目标档绑定读同一实例键（不读他批状态、无单值会话态）", async () => {
  const abs = makeDoc()
  const bound = reviewer(abs)
  // ctx.agent 无 _role、无任何他批状态——写权来自「本实例已绑定」这一事实
  await bound.execute({ segment: "§3", text: "实例绑定写入" }, { agent: { cwd: tmp } })
  assert.ok(read(abs).includes("实例绑定写入"), "目标档 = 实例绑定（与身份判据同源）")
  // 未绑定（review 形态但无目标档）→ fail-closed
  const e = await catchErr(() => batchSegmentTool(null, { review: true }).execute({ segment: "§3", text: "x" }, { agent: { cwd: tmp } }))
  assert.match(e?.message ?? "", /no batch record is bound/, "未绑定 → throw（无写权）")
  // 绑定档不可读（绑定后档被删）→ fail-closed
  const gone = reviewer(join(tmp, "docs", "batches", "gone.md"))
  const e2 = await catchErr(() => gone.execute({ segment: "§3", text: "x" }, { agent: { cwd: tmp } }))
  assert.match(e2?.message ?? "", /not a readable file/, "路径不可读 → throw")
})
