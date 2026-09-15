/**
 * batch-segment.test.mjs — 批次档段写入工具 VSC 面（ENGINEERING-MODE.md §2.20 · §2.22.5 第 5 批
 * 镜像 · FR23 F4；用例 T59/T60/T66）。锁三件：
 *   ① **工具契约**（T59——同 CLI T43–T52 口径）：无 `path` 参数 / 段白名单按身份 / append-only
 *      （既有行字节不变）/ 来源戳仅 §3（N = §3 内该形态行 + 1，骨架行不计，调用方自带标题被丢）/
 *      凭证剥除自有正则（落档零命中）/ fail-closed 六条；
 *   ② **只读面**（T60）：代码评审工具集逐字节不变（`_resolvedAdvisorToolsFor`）；仅
 *      reviewType==='design' 且 batchDoc 已绑定才追加 batch_segment；
 *   ③ **实例键通道**（T66）：batchDoc 沿 `rv`（评审实例）传递——两设计评审并发各落自档，
 *      不串档、不用单值会话态（测试缝 `ctx.runAdvisorReview` 驱动 launch 真实路径）。
 * 纯单元：零网络、零真实评审。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchSegmentTool, resolveBatchDocPath, MAX_TEXT_CHARS, configureBatchSegment, resetBatchSegment } from "@thincoder/core/agent-tools/batch-segment.mjs"
import { readFileSync as readSource } from "node:fs"
import { _resolvedAdvisorToolsFor, _setAdvisorToolSetForTest } from "../src/advisor/tools.mjs"
import { launchAsyncAdvisor } from "../src/agent-tools/advisor-async.mjs"

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "batch-segment-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

/** 六段骨架夹具（§1.12 模板形态）。 */
const skeleton = (over = {}) => [
  "# 批次记录（测试夹具）", "",
  "## §1 讨论（主 agent）", "", "讨论内容", "",
  "## §2 批次任务（eng-designer 自写）", "", over.s2 ?? "_（待实施）_", "",
  "## §3 设计评审（评审子代理自写）", "", "### 轮次与发现（发现摘要 / 🔴 处置）", "", over.s3 ?? "_（待实施）_", "",
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
const ctxFor = (role) => ({ agent: { cwd: tmp, ...(role ? { _role: role } : {}) }, cwd: tmp })

// ── T59 工具契约：正常写入 / append-only ─────────────────────────────────────
test("T59 正常：designer 写 §2——段尾追加 + 既有行字节不变（append-only 反证）", async () => {
  const abs = makeDoc()
  const tool = designer(abs)
  assert.deepEqual(Object.keys(tool.parameters.properties).sort(), ["segment", "text"], "schema 无 path（语法上写不到别处）")
  assert.deepEqual(tool.parameters.required, ["segment", "text"], "必填参数 = 段号 + 文本")
  const before = read(abs)
  const out = await tool.execute({ segment: "§2", text: "### 本批任务\n\n- 条目一" }, ctxFor("eng-designer"))
  const after = read(abs)
  assert.match(out, /appended .* to §2/, "返回写明追加段")
  assertLinesPreserved(before, after)
  const s2 = after.split("## §3")[0]
  assert.ok(s2.includes("### 本批任务") && s2.includes("- 条目一"), "内容落在 §2（下一条段标题之前）")
  assert.ok(after.indexOf("### 本批任务") < after.indexOf("## §3"), "未越段写入")
  assert.ok(!s2.includes("### 轮次"), "§2 不加来源戳（戳仅 §3）")
  const out5 = await designer(abs).execute({ segment: "§5", text: "交付摘要：改了 X" }, ctxFor("eng-coder"))
  assert.match(out5, /to §5/, "eng-coder → §5")
  assert.ok(read(abs).includes("交付摘要：改了 X"), "§5 落到档内")
})

// ── T59 fail-closed：段标题缺失 ─────────────────────────────────────────────
test("T59 错误：目标段标题缺失 → throw（纠正动作 = 创建方先补骨架）", async () => {
  const abs = makeDoc("# 批次\n\n## §1 讨论（主 agent）\n\n内容\n\n## §3 设计评审\n\n_（待实施）_\n")
  const before = read(abs)
  const e = await catchErr(() => designer(abs).execute({ segment: "§2", text: "x" }, ctxFor("eng-designer")))
  assert.ok(e instanceof Error, "无 §2 标题 → 必须 throw")
  assert.match(e.message, /no "## §2" section header/, "消息点明缺失段标题")
  assert.match(e.message, /add the "## §2/, "消息含纠正动作")
  assert.equal(read(abs), before, "拒绝时档未改动（fail-closed 不写半截）")
})

// ── T59 fail-closed：越段 / 未知段 / 无身份 / 未绑定 / 不可读 / 非字符串 / 超量 / 骨架保护 ──
test("T59 错误：段白名单按身份——越段/未知段/无身份 全拒（身份定权限）", async () => {
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

test("T59 错误：未绑定 / 绑定档不可读 / text 形态 / 超量 / 骨架保护（fail-closed 逐条）", async () => {
  const abs = makeDoc()
  const before = read(abs)
  const unbound = await catchErr(() => batchSegmentTool(null).execute({ segment: "§2", text: "x" }, ctxFor("eng-designer")))
  assert.match(unbound?.message ?? "", /no batch record is bound/, "未绑定 → 拒（无 path 参数 by design）")
  const gone = await catchErr(() => designer(join(tmp, "docs/batches/none.md")).execute({ segment: "§2", text: "x" }, ctxFor("eng-designer")))
  assert.match(gone?.message ?? "", /not a readable file/, "绑定档不可读 → 拒")
  const notString = await catchErr(() => designer(abs).execute({ segment: "§2", text: 42 }, ctxFor("eng-designer")))
  assert.match(notString?.message ?? "", /text must be a string/, "text 非字符串 → 拒")
  const over = await catchErr(() => designer(abs).execute({ segment: "§2", text: "x".repeat(MAX_TEXT_CHARS + 1) }, ctxFor("eng-designer")))
  assert.match(over?.message ?? "", /the limit is 20000 per call/, "超量 → 拒")
  assert.match(over?.message ?? "", /N 顺延/, "消息引导分段追加")
  const skel = await catchErr(() => designer(abs).execute({ segment: "§2", text: "## §4 用户批准"}, ctxFor("eng-designer")))
  assert.match(skel?.message ?? "", /^batch_segment: the text contains a section header line/, "骨架保护 → 拒")
  assert.equal(read(abs), before, "各 fail-closed 路径零写入")
})

// ── T59 来源戳不可伪造 ──────────────────────────────────────────────────────
test("T59 边界：来源戳不可伪造（工具生成 / 自带标题被忽略 / 连写 N=1,2 / 骨架行不计）", async () => {
  const abs = makeDoc()
  const nOf = (t) => [...t.matchAll(/^### 轮次 (\d+)（评审子代理）$/gm)].map((m) => m[1])
  await reviewer(abs).execute({ segment: "§3", text: "第一轮发现表" }, ctxFor())
  assert.deepEqual(nOf(read(abs)), ["1"], "工具盖戳 N=1（调用方自带标题也没有）")
  await reviewer(abs).execute({ segment: "§3", text: "### 轮次 7（评审子代理）\n\n伪造标题尝试" }, ctxFor())
  assert.deepEqual(nOf(read(abs)), ["1", "2"], "自带标题被丢弃、N 由工具算（防伪造戳污染计数）")
  assert.ok(!read(abs).includes("轮次 7"), "伪造标题未落档")
  // 骨架行 `### 轮次与发现（…）` 不计入 N —— 新建档仅骨架行时首写仍为 1
  const abs2 = makeDoc(skeleton(), "c.md")
  await reviewer(abs2).execute({ segment: "§3", text: "首轮" }, ctxFor())
  assert.deepEqual(nOf(read(abs2)), ["1"], "骨架行不算来源戳（N 仍为 1）")
})

// ── T59 凭证剥除 ────────────────────────────────────────────────────────────
test("T59 边界：凭证剥除——落档零命中 + 其余内容逐字保留（自有正则，非 §2.7 巡检正则）", async () => {
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

// ── T59 评审侧路径门（若传则须可读） ────────────────────────────────────────
test("T59 边界：评审侧 batchDoc 路径门（空/不可读 → throw；可读 → 绝对路径）", async () => {
  const abs = makeDoc()
  const e1 = await catchErr(() => resolveBatchDocPath(tmp, "docs/batches/none.md"))
  assert.match(e1?.message ?? "", /not a readable file/, "不可读路径 → throw")
  const eEmpty = await catchErr(() => resolveBatchDocPath(tmp, "   "))
  assert.match(eEmpty?.message ?? "", /non-empty/, "空值 → throw（若传则须可读）")
  assert.match(eEmpty?.message ?? "", /omit the parameter/, "消息含纠正动作（未传即零回归）")
  assert.equal(resolveBatchDocPath(tmp, "docs/batches/b.md"), abs, "可读路径 → 绝对路径（\\ 归一）")
})

// ── T60 只读面零变更 ────────────────────────────────────────────────────────
test("T60 错误/边界：只读面——代码评审工具集逐字节不变；设计评审+绑定才追加写通道", () => {
  const abs = makeDoc()
  const agent = { cwd: tmp }
  const code = _resolvedAdvisorToolsFor(agent, "code")
  const noArgs = _resolvedAdvisorToolsFor(agent)
  assert.ok(!code.byName.has("batch_segment"), "代码评审工具集不含本工具（零 git + 只读不变量）")
  assert.deepEqual([...code.byName.keys()], [...noArgs.byName.keys()], "与无参调用（默认 code）逐字相同——零变更")
  assert.deepEqual([...code.byName.keys()], ["read", "glob", "grep", "ls", "lsp", "code_search"], "只读工具集恒定")
  assert.ok(_resolvedAdvisorToolsFor(agent, "design", abs).byName.has("batch_segment"), "设计评审 + 已绑定 → 挂载")
  assert.ok(!_resolvedAdvisorToolsFor(agent, "design", null).byName.has("batch_segment"), "设计评审未绑定 → 不挂载（fail-closed）")
  assert.ok(!_resolvedAdvisorToolsFor(agent, "code", abs).byName.has("batch_segment"), "代码评审即便传 batchDoc 也不含（reviewType 门）")
  _setAdvisorToolSetForTest(null) // 清理测试覆写 seam（若有）
})

// ── T66 实例键通道（并发不串档） ────────────────────────────────────────────
test("T66 边界：两设计评审并发——batchDoc 沿 rv 实例键传递，各自落自档", async () => {
  const docA = makeDoc(skeleton(), "a.md")
  const docB = makeDoc(skeleton(), "b.md")
  const seen = []
  const agent = { cwd: tmp, config: {}, history: [], _asyncAdvisors: new Map(), _advisorRuns: new Map() }
  const ctx = {
    agent, cwd: tmp, callbacks: {},
    // 测试缝：替身评审（不发网络）——记录 rv 实例参数（本用例的断言对象）
    runAdvisorReview: (parent, reviewType, callbacks, designToken, documents, paths, object, rv) => {
      seen.push({ documents, rv })
      return Promise.resolve("Advisor: stub review (no token echo)")
    },
  }
  const a = launchAsyncAdvisor({ parent: agent, ctx, reviewType: "design", documents: ["docs/design/A.md"], paths: null, object: null, batchDoc: docA })
  const b = launchAsyncAdvisor({ parent: agent, ctx, reviewType: "design", documents: ["docs/design/B.md"], paths: null, object: null, batchDoc: docB })
  assert.ok(!a.error && !b.error, "两评审各起（不同 scope → 实例独立）")
  assert.equal(seen.length, 2, "两次 launch 均进入评审 runner")
  const rvA = seen.find((s) => s.documents[0] === "docs/design/A.md").rv
  const rvB = seen.find((s) => s.documents[0] === "docs/design/B.md").rv
  assert.equal(rvA.batchDoc, docA, "A 评审实例 rv 携带 A 档")
  assert.equal(rvB.batchDoc, docB, "B 评审实例 rv 携带 B 档（实例键——非单值会话态）")
  // 各自的工具集取各自的绑定 → 各写各档（不串档）
  const write = (bound, text) => _resolvedAdvisorToolsFor(agent, "design", bound).byName.get("batch_segment")
    .execute({ segment: "§3", text }, { agent: { cwd: tmp } })
  await write(rvA.batchDoc, "A 轮发现")
  await write(rvB.batchDoc, "B 轮发现")
  assert.ok(read(docA).includes("A 轮发现") && !read(docA).includes("B 轮发现"), "A 档只含 A 的发现")
  assert.ok(read(docB).includes("B 轮发现") && !read(docB).includes("A 轮发现"), "B 档只含 B 的发现")
})

// ── T-FZ3（群 B 批 B3 §17.2 E-扩 3）：成功写入记写域 / 失败零记账 ─────────────
// W9（2026-09-15）：记账面 = 核注入缝 #84（公开删除前的内联直写——本端装配层注册
// `configureBatchSegment({ onWrite })`，见 src/agent/setup.mjs）；测试侧注册镜像端壳回调
// （与 setup.mjs 同形）验工具契约；装配在位由本文末结构机检钉死。
test("T-FZ3 正常/错误：成功写入记绑定档绝对路径入 _touchedFiles；拒绝路径与未挂载体零记账零抛错", async () => {
  const abs = makeDoc()
  const agent = { cwd: tmp, _role: "eng-designer", _touchedFiles: [] }
  const ctx = { agent, cwd: tmp }
  configureBatchSegment({
    onWrite: (a, p) => { if (Array.isArray(a._touchedFiles) && !a._touchedFiles.includes(p)) a._touchedFiles.push(p) },
  })
  try {
    const out = await batchSegmentTool(abs).execute({ segment: "§2", text: "F31(c) 记账面" }, ctx)
    assert.match(out, /appended .* to §2/, "写入成功（正控）")
    assert.deepEqual(agent._touchedFiles, [abs], "成功：绑定档绝对路径入调用者写域（mergeChildMutations 合入载体）")
    // 去重守卫：同档二次写入不重复入列
    await batchSegmentTool(abs).execute({ segment: "§2", text: "第二段" }, ctx)
    assert.deepEqual(agent._touchedFiles, [abs], "includes 去重守卫（同路径不重复）")
    // 错误路径对照：越段拒绝 → 零记账（fail-closed 不写不记）
    const before = [...agent._touchedFiles]
    await catchErr(() => batchSegmentTool(abs).execute({ segment: "§9", text: "越段" }, ctx))
    assert.deepEqual(agent._touchedFiles, before, "拒绝路径零记账")
    // 评审实例面（未挂 _touchedFiles）：Array.isArray 守卫——写入成功但不抛错不记账
    const bare = { cwd: tmp, _role: "eng-designer" }
    const out2 = await batchSegmentTool(abs).execute({ segment: "§2", text: "无载体写入" }, { agent: bare, cwd: tmp })
    assert.match(out2, /appended .* to §2/, "未挂载体写入照常成功")
    assert.equal(bare._touchedFiles, undefined, "未挂载体零记账零抛错（Array.isArray 守卫）")
  } finally {
    resetBatchSegment()
  }
})

// ── W9 装配在位（结构机检——核 #83 同款形态）：端装配层注册记账缝 ─────────────
test("W9 装配在位：src/agent/setup.mjs 注册 configureBatchSegment 记账回调（_touchedFiles）", () => {
  const setup = readSource(new URL("../src/agent/setup.mjs", import.meta.url), "utf8")
  assert.match(setup, /configureBatchSegment\(\{/, "装配层注册记账缝（核缝 #84 端侧消费）")
  assert.match(setup, /agent\._touchedFiles\.push\(abs\)/, "回调体 = _touchedFiles 记账（与删除前内联面逐字同形）")
})

