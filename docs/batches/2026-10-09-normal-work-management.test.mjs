/**
 * 2026-10-09-normal-work-management.test.mjs — 普通模式工作管理统一批（台账 #1111）批内单测件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-09-normal-work-management.test.mjs`
 *
 * 射程 = 批档 §2.6 AC-5 ∥ AC-7（先红后绿；红读 / 绿读在 §5）：
 *   T1 普通 depth-0 append：§2 ∥ §5 成功 + §3 拒（模式化新串逐字）
 *   T2 普通 depth-0 status：§2 成功 + §3/§4/§6 拒（新串逐字）∥ 缺省 = §1 取段
 *   T3 coder 携绑定 §5 成功（append + status）∥ 越段拒（`batch_segment:` 面逐字）
 *   T4 create 普通骨架四处替换形（diff 恰 4 行、余行逐字同）∥ 工程骨架逐字零变
 *   T5 模式翻转即时生效（同 agent 对象 eng→normal ⇒ §2 放行；骨架不随翻转回写）
 *   T6 工程面零变回归：`SEGMENT_BY_ROLE` 表 ∥ 工程拒文案（append/status）∥ 迁移面串
 *   T7 挂载臂（family-tools）：coder 未绑定工具表不含 `batch` ∥ 携绑定含 `batch`
 *   T8 spawn 臂（subagent-spawn）：携绑定探测 + 绑定 + 固块行 ∥ 不可读拒 ∥ 未携照常 ∥ eng 强制门零变
 * 夹具纪律：create/append/status 全经工具执行体（临时基底 + `_setProjectRootForTest` 注入缝——
 *   先例 = docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs）。
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
const FAMILY = await load("thincoder-core/agent/family-tools.mjs")
const SPAWN = await load("thincoder-core/agent-tools/subagent-spawn.mjs")

const read = (p) => readFileSync(p, "utf8")
const REC = (root, name = "probe.md") => join(root, "docs", "batches", name)

/** 临时基底（`_setProjectRootForTest` 注入缝——先例 = 2026-10-05-toolface-first-use-fixes 批内件）。 */
async function withRoot(tag, fn) {
  const root = mkdtempSync(join(tmpdir(), `nwm-${tag}-`))
  MANIFEST._setProjectRootForTest(root)
  try { return await fn(root) } finally {
    MANIFEST._resetProjectRootForTest()
    rmSync(root, { recursive: true, force: true })
  }
}

/** depth-0 主 agent ctx（模式位显式——执行期实读面）。 */
const CTX0 = (root, engineering) => ({ depth: 0, agent: { cwd: root, config: { agent: { engineering } } } })
/** coder 子代理 ctx（depth>0；普通模式 = engineering false）。 */
const CTX_CODER = (root) => ({ depth: 1, agent: { cwd: root, _role: "coder", config: { agent: { engineering: false } } } })

const tool = () => BATCH.batchTool(null)
const createAt = (ctx, name, extra = {}) => tool().execute(
  { action: "create", path: `docs/batches/${name}`, topic: "probe", source: "fixture source", ledger: "#1111", board: "board", ...extra }, ctx)
const appendAt = (ctx, rec, segment, text) => tool().execute({ action: "append", path: rec, segment, text }, ctx)
const statusAt = (ctx, rec, segment, value) => tool().execute({ action: "status", path: rec, ...(segment === undefined ? {} : { segment }), value }, ctx)

/** 夹具（骨架产出直写——非工具面用例的底档）。 */
const writeFixture = (root, name, src) => {
  const rec = REC(root, name)
  mkdirSync(dirname(rec), { recursive: true })
  writeFileSync(rec, src)
  return rec
}

/* ── T1 普通 depth-0 append 域 ───────────────────────────────── */

test("T1 普通 depth-0 append：§2 ∥ §5 成功 ＋ §3 拒（模式化新串逐字）", async () => {
  await withRoot("t1", async (root) => {
    const ctx = CTX0(root, false)
    await createAt(ctx, "probe.md")
    const rec = REC(root)
    const m2 = await appendAt(ctx, rec, "§2", "### 2.1 设计行")
    assert.ok(/appended/.test(m2) && m2.includes("§2"), "§2 放行（设计师席并入）")
    const m5 = await appendAt(ctx, rec, "§5", "### 5.1 实施行")
    assert.ok(/appended/.test(m5) && m5.includes("§5"), "§5 放行（直做实施记录）")
    const src = read(rec)
    assert.ok(src.includes("### 2.1 设计行") && src.includes("### 5.1 实施行"), "两段载荷在盘")
    await assert.rejects(() => appendAt(ctx, rec, "§3", "x"), (e) =>
      e.message === "batch: §3 is not yours to write — in normal mode depth-0 append writes §1/§2/§4/§5/§6 (一段一作者: §3 = design review only). Nothing was written.",
      "§3 拒（普通面新串逐字）")
  })
})

/* ── T2 普通 depth-0 status 域 ───────────────────────────────── */

test("T2 普通 depth-0 status：§2 成功 ＋ §3/§4/§6 拒（新串逐字）∥ 缺省 = §1", async () => {
  await withRoot("t2", async (root) => {
    const ctx = CTX0(root, false)
    await createAt(ctx, "probe.md")
    const rec = REC(root)
    const msg = await statusAt(ctx, rec, "§2", "设计完成")
    assert.ok(msg.includes('§2 status line updated to "设计完成"'), "§2 流转成功（取段）")
    assert.ok(read(rec).includes("**状态行**：设计完成"), "§2 状态行落盘")
    const def = await statusAt(ctx, rec, undefined, "进行中")
    assert.ok(def.includes('§1 status line updated to "进行中"'), "segment 缺省 = §1（取段）")
    for (const seg of ["§3", "§4", "§6"]) {
      await assert.rejects(() => statusAt(ctx, rec, seg, "进行中"), (e) =>
        e.message === `batch: ${seg} is not yours to write — in normal mode status writes §1/§2/§5 only (一段一作者: §3 = design review; §4/§6 carry no status word list). Nothing was written.`,
        `${seg} 拒（普通面新串逐字）`)
    }
  })
})

/* ── T3 coder 携绑定 §5 ─────────────────────────────────────── */

test("T3 coder 携绑定 §5：append ∥ status 成功；§2 越段拒（batch_segment: 面逐字）", async () => {
  await withRoot("t3", async (root) => {
    const ctx0 = CTX0(root, false)
    await createAt(ctx0, "probe.md")
    const rec = REC(root)
    const coder = BATCH.batchTool(rec)
    const ctx = CTX_CODER(root)
    const am = await coder.execute({ action: "append", segment: "§5", text: "### 5.1 coder 自写" }, ctx)
    assert.ok(/appended/.test(am) && am.includes("§5"), "coder §5 append 放行（绑定自写）")
    const sm = await coder.execute({ action: "status", segment: "§5", value: "实施完成" }, ctx)
    assert.ok(sm.includes('§5 status line updated to "实施完成"'), "coder §5 status 放行（增表身份段）")
    await assert.rejects(() => coder.execute({ action: "append", segment: "§2", text: "x" }, ctx), (e) =>
      e.message === "batch_segment: §2 is not yours to write — this caller writes §5 only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5).",
      "§2 越段拒（迁移面逐字零变）")
    await assert.rejects(() => coder.execute({ action: "append", segment: "§5", text: "x", path: rec }, ctx), (e) =>
      e.message.startsWith("batch: path is a depth-0-only parameter"), "子代理传 path 拒（D-BR21 零变）")
  })
})

/* ── T4 骨架模式取形 ────────────────────────────────────────── */

const ENG_SKELETON = [
  "# 2026-10-09 · probe",
  "> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。",
  "> 编制：主 agent · 2026-10-09 · 来源 = fixture source。",
  "> 台账 = #1111（board · 归批）。前情 = 无（独立批）。",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中（…）",
  "<§1 模板占位：本批条目 / 关键判据 / 授权口径>",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：（eng-designer 写入时更新）",
  "<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>",
  "## §3 设计评审（评审子代理）",
  "## §4 用户批准（主 agent）",
  "## §5 实施记录（eng-coder）",
  "## §6 验证与收口（父代理）",
  "",
].join("\n")

test("T4 create 骨架：普通变体四处替换（diff 恰 4 行、余行逐字同）∥ 工程产出逐字零变", async () => {
  const args = { date: "2026-10-09", topic: "probe", source: "fixture source", prev: "无（独立批）", ledger: "#1111", board: "board" }
  const eng = SK.batchSkeleton(args)
  const eng4 = SK.batchSkeleton({ date: "2026-10-09", topic: "probe", source: "fixture source", prev: "无（独立批）" })
  assert.equal(eng, ENG_SKELETON, "工程产出逐字零变（六参形）")
  assert.ok(eng4.includes("> 台账 = #<编号>（<板块> · 归批）。"), "4 参旧调用形零变（缺省 = engineering）")
  const nor = SK.batchSkeleton({ ...args, mode: "normal" })
  const e = eng.split("\n"); const n = nor.split("\n")
  assert.equal(n.length, e.length, "行数同")
  const diff = e.map((l, i) => (l === n[i] ? -1 : i)).filter((i) => i >= 0)
  assert.deepEqual(diff, [1, 7, 8, 12], "diff 恰四处（① 汇总行 ② §2 段头 ③ §2 状态占位句 ④ §5 段头）")
  assert.equal(n[1], "> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（主 agent）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（实施者：主 agent ∥ coder）· §6 验证与收口（父代理）。")
  assert.equal(n[7], "## §2 批次任务与设计（主 agent）")
  assert.equal(n[8], "**状态行**：（主 agent 写入时更新）")
  assert.equal(n[12], "## §5 实施记录（实施者：主 agent ∥ coder）")
})

test("T4b create 走工具面：普通位建档 ⇒ 普通变体在盘（作者标签随模式）", async () => {
  await withRoot("t4b", async (root) => {
    await createAt(CTX0(root, false), "normal.md")
    const src = read(REC(root, "normal.md"))
    assert.ok(src.includes("## §2 批次任务与设计（主 agent）"), "普通建档 ⇒ §2 标签 = 主 agent")
    assert.ok(src.includes("## §5 实施记录（实施者：主 agent ∥ coder）"), "普通建档 ⇒ §5 标签 = 实施者")
    await createAt(CTX0(root, true), "eng.md", { ledger: null, board: null })
    const esrc = read(REC(root, "eng.md"))
    assert.ok(esrc.includes("## §2 批次任务与设计（eng-designer）") && esrc.includes("## §5 实施记录（eng-coder）"), "工程位建档 ⇒ 原标签（逐字零变）")
  })
})

/* ── T5 模式翻转 ────────────────────────────────────────────── */

test("T5 模式翻转即时生效：同 agent 对象 eng→normal ⇒ §2 放行；骨架不回写", async () => {
  await withRoot("t5", async (root) => {
    const agent = { cwd: root, config: { agent: { engineering: true } } }
    const ctx = { depth: 0, agent }
    await createAt(ctx, "flip.md")
    const rec = REC(root, "flip.md")
    assert.ok(read(rec).includes("## §2 批次任务与设计（eng-designer）"), "建档时 eng 取形（取形时点 = 建档即固）")
    await assert.rejects(() => appendAt(ctx, rec, "§2", "x"), (e) =>
      e.message === "batch: §2 is not yours to write — depth-0 append writes §1/§4/§6 only (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder).",
      "eng 位 ⇒ §2 拒（工程面串逐字）")
    agent.config.agent.engineering = false
    const msg = await appendAt(ctx, rec, "§2", "### 2.1 翻转后写入")
    assert.ok(/appended/.test(msg), "翻转到 normal ⇒ §2 放行（执行期实读——翻转即时生效）")
    assert.ok(read(rec).includes("## §2 批次任务与设计（eng-designer）"), "既有骨架不回写（翻转不动取形）")
  })
})

/* ── T6 工程面零变回归 ──────────────────────────────────────── */

test("T6 工程面零变：SEGMENT_BY_ROLE 表 ∥ depth-0 工程拒文案 ∥ status 拒文案 ∥ eng-coder 迁移面串", async () => {
  assert.deepEqual(SK.SEGMENT_BY_ROLE, { "eng-designer": 2, "eng-coder": 5 }, "工程面表零字面改")
  assert.deepEqual(SK.SEGMENT_BY_ROLE_NORMAL, { "coder": 5 }, "普通增表（单键）")
  assert.deepEqual(SK.DEPTH0_SEGMENTS, {
    append: { engineering: [1, 4, 6], normal: [1, 2, 4, 5, 6] },
    status: { engineering: [1], normal: [1, 2, 5] },
  }, "depth-0 两集模式键常量")
  await withRoot("t6", async (root) => {
    const engCtx = CTX0(root, true)
    await createAt(engCtx, "probe.md")
    const rec = REC(root)
    await assert.rejects(() => appendAt(engCtx, rec, "§2", "x"), (e) =>
      e.message === "batch: §2 is not yours to write — depth-0 append writes §1/§4/§6 only (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder).",
      "工程 append 拒文案逐字")
    await assert.rejects(() => statusAt(engCtx, rec, "§2", "设计完成"), (e) =>
      e.message === "batch: §2 is not yours to write — status writes YOUR OWN section §1 only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5, main agent → §1). Nothing was written.",
      "工程 status 拒文案逐字（写域收为 §1 单段）")
    const engCoderTool = BATCH.batchTool(rec)
    await assert.rejects(() => engCoderTool.execute({ action: "append", segment: "§2", text: "x" }, { depth: 1, agent: { cwd: root, _role: "eng-coder", config: { agent: { engineering: true } } } }), (e) =>
      e.message === "batch_segment: §2 is not yours to write — this caller writes §5 only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5).",
      "eng-coder 迁移面串逐字")
  })
})

/* ── T7 挂载臂 ──────────────────────────────────────────────── */

test("T7 挂载臂：coder 未绑定工具表不含 batch ∥ 携绑定含 batch ∥ eng 两分支零变", async () => {
  const unbound = await FAMILY.assembleFamilyTools({ depth: 1, role: "coder", engineering: false, consultModels: [], batchDoc: null })
  assert.equal(unbound.some((t) => t.name === "batch"), false, "未绑定 ⇒ 不挂载（语法面不可达）")
  const bound = await FAMILY.assembleFamilyTools({ depth: 1, role: "coder", engineering: false, consultModels: [], batchDoc: "docs/batches/x.md" })
  assert.equal(bound.some((t) => t.name === "batch"), true, "携绑定 ⇒ 追加 batchTool")
  for (const role of ["eng-coder", "eng-designer"]) {
    const eng = await FAMILY.assembleFamilyTools({ depth: 1, role, engineering: true, consultModels: [], batchDoc: "docs/batches/x.md" })
    assert.equal(eng.some((t) => t.name === "batch"), true, `${role} 分支零变（恒挂）`)
  }
})

/* ── T8 spawn 臂 ────────────────────────────────────────────── */

test("T8 spawn 臂：coder 携绑定探测 + 绑定 + 固块行 ∥ 不可读拒 ∥ 未携照常 ∥ eng 强制门零变", async () => {
  await withRoot("t8", async (root) => {
    const rec = writeFixture(root, "bound.md", SK.batchSkeleton({ date: "2026-10-09", topic: "probe", source: "fixture source", prev: "无（独立批）" }))
    const parent = { cwd: root, config: { agent: {} }, tools: [], autoApprove: true, memory: null }
    const ctx = { callbacks: {} }
    const spawn = (args) => SPAWN.buildSpawnChild(parent, ctx, args, "coder", false, [], [], null)
    const bound = spawn({ task: "hi", batchDoc: "docs/batches/bound.md" })
    assert.equal(bound.child._batchDoc, rec, "携绑定 ⇒ child._batchDoc = 解析绝对路径")
    assert.equal(bound.child._spawnSystemBlock, `Batch record (batchDoc): ${rec}`, "固块行同推（绑定 coder 读到本档）")
    const unbound = spawn({ task: "hi" })
    assert.equal(unbound.child._batchDoc, undefined, "未携 ⇒ 不绑定")
    assert.equal(unbound.child._spawnSystemBlock, undefined, "未携 ⇒ 零固块")
    let caught = null
    assert.throws(() => spawn({ task: "hi", batchDoc: "docs/batches/missing.md" }), (e) => { caught = e; return true })
    assert.ok(caught.message.startsWith("batchDoc for role='coder' — ") && caught.message.includes("must resolve to a readable file"), "不可读 ⇒ 拒（同族文案）")
    let engCaught = null
    assert.throws(() => SPAWN.buildSpawnChild(parent, ctx, { task: "hi" }, "eng-coder", false, [], [], null), (e) => { engCaught = e; return true })
    assert.ok(engCaught.message.startsWith("batchDoc is required for role='eng-coder' — "), "eng 强制门零变（缺参即拒）")
  })
})
