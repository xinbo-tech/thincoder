/**
 * 2026-10-05-toolface-first-use-fixes.test.mjs — 工具面首用可发现性批（台账 #938）批内单测件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs`
 *
 * 射程 = 批档 §2 测试面 T1–T14（先红后绿；红读 / 绿读在 §5）：
 *   ① T1 描述面两腿：十枚文本形 + `round (initial|fix` 在场腿（描述文本逐枚命中）∥ 过门腿
 *      （以描述所载中文/英文形构造六字段任务书投喂 `validateTaskBookFields`：双语全形不抛 ∥ 逐段缺拒）。
 *   ② T2–T6 ∥ T14 create 档头可填性（建即填 ∥ 未给 ∥ 偏给 ∥ 归一 ∥ 单行拒〔ledger + board〕∥ 空串 ≡ 未给）。
 *   ③ T7–T10 死占位判据可辨性（未填拒 ∥ 正文引用豁免 ∥ 旧形结构行拒 ∥ 段体整行引用豁免）。
 *   回归：T11 次序三态 ∥ T12 batchSkeleton 4 参形零变 ∥ T13 模板占位行（尖括号形）放行。
 * 夹具纪律：create/append/status 全经工具执行体（临时基底 + `_setProjectRootForTest` 注入缝——
 *   先例 = docs/batches/2026-09-30-core-tools-pairfix.test.mjs）；手写档仅在需要旧形 / 引用形时使用。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const SK = await load("thincoder-core/agent-tools/batch-skeleton.mjs")
const BATCH = await load("thincoder-core/agent-tools/batch.mjs")
const MANIFEST = await load("thincoder-core/manifest.mjs")
const SHARED = await load("thincoder-core/tools/shared.mjs")
const GATES = await load("thincoder-core/agent-tools/spawn-gates.mjs")

const read = (p) => readFileSync(p, "utf8")
const CTX = (root) => ({ agent: { cwd: root }, depth: 0 })
const tool = (root) => BATCH.batchTool(null)
const REC = (root, name = "probe.md") => join(root, "docs", "batches", name)

/** 临时基底（`_setProjectRootForTest` 注入缝——先例 = 2026-09-30-core-tools-pairfix 批内件）。 */
async function withRoot(tag, fn) {
  const root = mkdtempSync(join(tmpdir(), `toolface-${tag}-`))
  MANIFEST._setProjectRootForTest(root)
  try { return await fn(root) } finally {
    MANIFEST._resetProjectRootForTest()
    rmSync(root, { recursive: true, force: true })
  }
}

/** create 驱动（深度 0 · 相对路径 `docs/batches/<name>`——基底 = 注入根）。 */
const createAt = (root, name, args) => tool(root).execute({ action: "create", path: `docs/batches/${name}`, topic: "probe", source: "fixture source", ...args }, CTX(root))
const appendAt = (root, rec, text, segment = 1) => tool(root).execute({ action: "append", segment, path: rec, text }, CTX(root))
const statusAt = (root, rec) => tool(root).execute({ action: "status", value: "进行中", path: rec }, CTX(root))

/** 手写夹具（六段骨架形 · 档头三行可换形——旧形 / 引用形注入用）。 */
function fixtureRecord({
  title = "# 2026-10-05 · fixture",
  编制 = "> 编制：主 agent · 2026-10-05 · 来源 = fixture source。",
  台账 = "> 台账 = #938（core · 归批）。前情 = 无（独立批）。",
  s1body = null,
} = {}) {
  return [
    title,
    "> 六段 append-only，一段一作者。",
    编制,
    台账,
    "## §1 讨论（主 agent）",
    "**状态行**：🔄 进行中（夹具）",
    ...(s1body ? [s1body] : []),
    "## §2 批次任务与设计（eng-designer）",
    "**状态行**：（eng-designer 写入时更新）",
    "## §3 设计评审（评审子代理）",
    "## §4 用户批准（主 agent）",
    "## §5 实施记录（eng-coder）",
    "## §6 验证与收口（父代理）",
    "",
  ].join("\n")
}

const writeFixture = (root, name, src) => {
  const rec = REC(root, name)
  mkdirSync(dirname(rec), { recursive: true })
  writeFileSync(rec, src)
  return rec
}

/** 残留拒句断言（域 = 档头 ∧ 逐行清单 ∧ 半句退场——T7 / T9 共用）。 */
function checkResidueError(e, expectLineNo) {
  const m = e.message
  assert.ok(m.includes("batch: 骨架死占位残留"), "拒句头")
  assert.ok(m.includes("the batch record's header still carries skeleton placeholders"), "域 = 档头")
  assert.ok(m.includes(`档头 line ${expectLineNo}:`), "逐行残留（行号）")
  assert.ok(m.includes("#<编号>") || m.includes("<BATCH-ID>") || m.includes("<讨论来源>"), "逐行残留（原文）")
  assert.ok(!m.includes("or your target section"), "「or your target section」半句退场")
  assert.ok(m.includes("Nothing was written."), "零写盘句")
  return true
}

/* ── T1 ① 描述面两腿 ─────────────────────────────────────────── */

test("T1 ① 描述面两腿：十枚文本形 + round 枚举在场 ∥ 双语六字段任务书过门、逐段缺拒", () => {
  const desc = SHARED.DESC("subagent")
  const forms = [
    "目标与理由", "(goal & why)", "round (initial|fix",
    "已知事实", "(known facts)",
    "设计要点与禁止范围", "(design points & forbidden scope)",
    "验收标准", "(acceptance criteria)",
    "交付报告格式", "(delivery-report format)",
  ]
  for (const f of forms) assert.ok(desc.includes(f), `描述面逐枚命中：${JSON.stringify(f)}`)

  const zhLines = ["目标与理由：夹具。", "已知事实：夹具。", "设计要点与禁止范围：夹具。", "验收标准：夹具。", "交付报告格式：夹具。"]
  const enLines = ["goal & why: fixture.", "known facts: fixture.", "design points & forbidden scope: fixture.", "acceptance criteria: fixture.", "delivery-report format: fixture."]
  GATES.validateTaskBookFields({ round: "initial", task: zhLines.join("\n") })
  GATES.validateTaskBookFields({ round: "fix", task: enLines.join("\n") })
  const labels = [
    "目标与理由 (goal & why)", "已知事实 (known facts)", "设计要点与禁止范围 (design points & forbidden scope)",
    "验收标准 (acceptance criteria)", "交付报告格式 (delivery-report format)",
  ]
  const zhPrefixes = ["目标与理由", "已知事实", "设计要点与禁止范围", "验收标准", "交付报告格式"]
  zhPrefixes.forEach((pre, i) => {
    const dropped = zhLines.filter((l) => !l.startsWith(pre)).join("\n")
    assert.throws(() => GATES.validateTaskBookFields({ round: "initial", task: dropped }),
      (e) => e.message.includes(labels[i]), `中文形缺 ${pre} ⇒ 拒且 missing 列该段 label`)
  })
  const enPrefixes = ["goal & why", "known facts", "design points & forbidden scope", "acceptance criteria", "delivery-report format"]
  enPrefixes.forEach((pre, i) => {
    const dropped = enLines.filter((l) => !l.startsWith(pre)).join("\n")
    assert.throws(() => GATES.validateTaskBookFields({ round: "initial", task: dropped }),
      (e) => e.message.includes(labels[i]), `英文形缺 ${pre} ⇒ 拒且 missing 列该段 label`)
  })
  assert.throws(() => GATES.validateTaskBookFields({ task: zhLines.join("\n") }), /round \(initial\|fix\)/, "round 缺 ⇒ 拒（结构化参数）")
})

/* ── T2–T5 ∥ T14 ② 建即填 / 未给 / 偏给 / 归一 / 空串 ≡ 未给 ───── */

test("T2 ② 建即填：create(ledger #938 + board core) ⇒ 台账行实参 ∧ 四枚占位零命中 ∧ 回执零填法句", async () => {
  await withRoot("t2", async (root) => {
    const msg = await createAt(root, "probe.md", { ledger: "#938", board: "core" })
    const src = read(REC(root))
    assert.ok(src.includes("> 台账 = #938（core · 归批）。"), "台账行 = #938（core 形")
    for (const ph of SK.TEMPLATE_PLACEHOLDERS) assert.ok(!src.includes(ph), `四枚占位字面零命中：${ph}`)
    assert.ok(msg.includes("header 台账 line filled (#938 · core)"), "回执标注已填")
    assert.ok(!msg.includes("placeholder(s) remain"), "回执零填法句")
  })
})

test("T3 ② 未给：create(无两参) ⇒ 两占位字面在场 ∧ 回执含填法句", async () => {
  await withRoot("t3", async (root) => {
    const msg = await createAt(root, "probe.md", {})
    const src = read(REC(root))
    assert.ok(src.includes("> 台账 = #<编号>（<板块> · 归批）。"), "台账行占位留存")
    assert.ok(msg.includes("header 台账 placeholder(s) remain — fill them by file edit before the record's first append/status opens"), "回执含填法句")
  })
})

test("T4 ② 偏给：create(仅 ledger) ⇒ 编号实参 + 板块占位 ∧ 回执含填法句", async () => {
  await withRoot("t4", async (root) => {
    const msg = await createAt(root, "probe.md", { ledger: "#938" })
    const src = read(REC(root))
    assert.ok(src.includes("> 台账 = #938（<板块> · 归批）。"), "偏给形 = 编号实参 + 板块占位")
    assert.ok(msg.includes("header 台账 placeholder(s) remain"), "回执含填法句")
  })
})

test("T5 ② 归一：ledger=938 ⇒ #938（补齐）∥ ledger=#214/#215 原样保留", async () => {
  await withRoot("t5", async (root) => {
    await createAt(root, "a.md", { ledger: "938", board: "core" })
    assert.ok(read(REC(root, "a.md")).includes("> 台账 = #938（core · 归批）。"), "前导 # 补齐")
    await createAt(root, "b.md", { ledger: "#214/#215", board: "core" })
    assert.ok(read(REC(root, "b.md")).includes("> 台账 = #214/#215（core · 归批）。"), "已带 # / 复合编号原样保留")
  })
})

test("T14 ② 空串 ≡ 未给：ledger=\"\" ∥ board=\"\" 各一格 ⇒ 该参占位留存 + 填法句", async () => {
  await withRoot("t14", async (root) => {
    const msgA = await createAt(root, "a.md", { ledger: "", board: "core" })
    assert.ok(read(REC(root, "a.md")).includes("> 台账 = #<编号>（core · 归批）。"), "ledger 空串 ≡ 未给（编号占位留存、板块已填）")
    assert.ok(msgA.includes("header 台账 placeholder(s) remain"), "回执含填法句")
    const msgB = await createAt(root, "b.md", { ledger: "#938", board: "" })
    assert.ok(read(REC(root, "b.md")).includes("> 台账 = #938（<板块> · 归批）。"), "board 空串 ≡ 未给（板块占位留存、编号已填）")
    assert.ok(msgB.includes("header 台账 placeholder(s) remain"), "回执含填法句")
  })
})

/* ── T6 ② 单行拒（ledger + board 对称） ─────────────────────── */

test("T6 ② 单行拒：ledger ∥ board 含换行 ⇒ 拒（单行句逐字）∧ 零写盘", async () => {
  await withRoot("t6", async (root) => {
    for (const [key, value] of [["ledger", "#938\nsecond"], ["board", "core\nextra"]]) {
      let caught = null
      await assert.rejects(() => createAt(root, "probe.md", { [key]: value }), (e) => { caught = e; return true })
      assert.ok(caught.message.includes("batch: create ledger / board must be single lines — a multi-line value would break the header's 台账 line. Nothing was written."), `${key} 单行拒句逐字`)
      assert.equal(existsSync(REC(root)), false, `${key} 拒 ⇒ 零写盘`)
    }
  })
})

/* ── T7–T10 ③ 死占位判据可辨性 ──────────────────────────────── */

test("T7 ③ 未填拒：档头台账行未填 ⇒ findPlaceholderResidue 逐行残留 ∧ append/status 拒（拒句 + 逐行清单）", async () => {
  await withRoot("t7", async (root) => {
    const src = SK.batchSkeleton({ date: "2026-10-05", topic: "probe", source: "fixture source", prev: "无（独立批）" })
    const rec = writeFixture(root, "probe.md", src)
    assert.deepEqual(SK.findPlaceholderResidue(src),
      [{ line: 4, text: "> 台账 = #<编号>（<板块> · 归批）。前情 = 无（独立批）。" }],
      "残留 = 档头台账行单条（{line,text} 形）")
    await assert.rejects(() => appendAt(root, rec, "### 1.1 追加行"), (e) => checkResidueError(e, 4), "append 拒")
    await assert.rejects(() => statusAt(root, rec), (e) => checkResidueError(e, 4), "status 拒")
  })
})

test("T8 ③ 引用豁免（本批实害反证）：档头已填 + 段体引用四枚字面 ⇒ 零残留 ∧ append 放行", async () => {
  await withRoot("t8", async (root) => {
    const body = "1.1 引用面：未填形 `#<编号>` / `<板块>` 与旧形 `<BATCH-ID>` / `<讨论来源>` 的正文引用（实测误杀面）。"
    const rec = writeFixture(root, "probe.md", fixtureRecord({ s1body: body }))
    const src = read(rec)
    assert.ok(SK.TEMPLATE_PLACEHOLDERS.every((ph) => src.includes(ph)), "四枚字面确实在档（断言前提）")
    assert.deepEqual(SK.findPlaceholderResidue(src), [], "段体引用 ⇒ 零残留（引用非未填）")
    const msg = await appendAt(root, rec, "### 1.1 追加行")
    assert.ok(/appended/.test(msg), "append 放行")
  })
})

test("T9 ③ 旧形结构行：标题行 ∥ 编制行残留旧形字面 ⇒ 拒", async () => {
  await withRoot("t9", async (root) => {
    const a = fixtureRecord({ title: "# 2026-10-05 · fixture（<BATCH-ID>）" })
    assert.deepEqual(SK.findPlaceholderResidue(a), [{ line: 1, text: "# 2026-10-05 · fixture（<BATCH-ID>）" }], "标题行残留单条")
    const recA = writeFixture(root, "a.md", a)
    await assert.rejects(() => appendAt(root, recA, "x"), (e) => checkResidueError(e, 1), "标题行残留 ⇒ append 拒")
    const b = fixtureRecord({ 编制: "> 编制：主 agent · 2026-10-05 · 来源 = <讨论来源>。" })
    assert.deepEqual(SK.findPlaceholderResidue(b), [{ line: 3, text: "> 编制：主 agent · 2026-10-05 · 来源 = <讨论来源>。" }], "编制行残留单条")
    const recB = writeFixture(root, "b.md", b)
    await assert.rejects(() => statusAt(root, recB), (e) => checkResidueError(e, 3), "编制行残留 ⇒ status 拒")
  })
})

test("T10 ③ 段域 / 整行引用豁免：段体整行引用台账行未填形 ⇒ 零残留 ∧ append 放行", async () => {
  await withRoot("t10", async (root) => {
    const rec = writeFixture(root, "probe.md", fixtureRecord({ s1body: "> 台账 = #<编号>（<板块> · 归批）。前情 = 旧档。" }))
    assert.deepEqual(SK.findPlaceholderResidue(read(rec)), [], "段域整行引用 ⇒ 零残留")
    const msg = await appendAt(root, rec, "### 1.2 追加行")
    assert.ok(/appended/.test(msg), "append 放行")
  })
})

/* ── T11–T13 回归 ────────────────────────────────────────────── */

test("T11 回归·次序：create（无参）⇒ 首写拒 ⇒ 文件编辑填 ⇒ 放行（三态全中）", async () => {
  await withRoot("t11", async (root) => {
    const msg = await createAt(root, "probe.md", {})
    assert.ok(/created/.test(msg), "① 建档成")
    await assert.rejects(() => tool(root).execute({ action: "append", segment: 1, text: "### 1.1 抢占" }, CTX(root)),
      /骨架死占位残留/, "② 首写拒（在飞唯一 ⇒ 缺省定位）")
    const rec = REC(root)
    writeFileSync(rec, read(rec).replace("#<编号>", "#938").replace("<板块>", "core"))
    const ok = await tool(root).execute({ action: "append", segment: 1, text: "### 1.1 正文" }, CTX(root))
    assert.ok(/appended/.test(ok), "③ 文件编辑填后放行")
  })
})

test("T12 回归·4 参调用：batchSkeleton({date,topic,source,prev}) 输出 = 现行占位形（零变）", () => {
  const four = SK.batchSkeleton({ date: "2026-10-05", topic: "probe", source: "fixture source", prev: "无（独立批）" })
  const six = SK.batchSkeleton({ date: "2026-10-05", topic: "probe", source: "fixture source", prev: "无（独立批）", ledger: null, board: null })
  assert.equal(four, six, "缺省 ≡ 显式 null（4 参旧调用形零变）")
  assert.ok(four.includes("> 台账 = #<编号>（<板块> · 归批）。前情 = 无（独立批）。"), "4 参形占位行零变")
  assert.ok(four.startsWith("# 2026-10-05 · probe\n> 六段 append-only"), "档头两行零变")
})

test("T13 回归·模板行：段体含模板占位行（尖括号形）⇒ 放行（枚举零命中）", async () => {
  await withRoot("t13", async (root) => {
    const rec = writeFixture(root, "probe.md", fixtureRecord({
      s1body: "<§1 模板占位：本批条目 / 关键判据 / 授权口径>\n泛型样例 <T> 与 `Error: <message>`。",
    }))
    const msg = await appendAt(root, rec, "### 1.3 追加行")
    assert.ok(/appended/.test(msg), "模板占位行 / 泛型尖括号不拦（枚举零命中——非泛形）")
  })
})
