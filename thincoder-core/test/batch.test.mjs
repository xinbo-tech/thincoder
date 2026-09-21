/**
 * batch.test.mjs — 批次档生命周期工具 `batch` 行为面（BATCH-RECORD §4 权威；用例表 C1–C10
 * 权威 = 批档 `docs/batches/2026-09-21-batch-lifecycle-tool.md` §2；append 行为断言零改复用 =
 * 旧 batch-segment.test.mjs 保留跑绿）。
 *
 * 覆盖：create 正/负例（BR-18–20/25 + 基底单源）· depth-0 身份门（BR-19/24）· status 段属主
 * 流转 + 词表 + 声明段拒（BR-21/22/C4/C5）· close/冻结（BR-23/C6/C7）· depth-0 path 面
 * （D-BR21：可选 path / 在飞批缺省 / 0·复数拒 / 子代理评审拒）· 别名等价（AC-2/AC-9/BR-26/C8）
 * · #84 缝（AC-11——主名三通道记账）· append 不补骨架（C10）·
 * **F11 词面协议（tool-discipline 批）**：A 组 = value 谓词收紧（余核 = 关键词） + note 括注
 * （A1/A2/A3/A4，含事故①「讨论已收口」防复发先红）；B 组 = create source 必填/落盘 · prev
 * 幂等剥前缀 · `<BATCH-ID>` 删除（B1–B4）；C 组 = 死占位机检（**已拆出** `batch-placeholder-gate.test.mjs`
 * ——本档 F11 落地后实测 506 行 > 500 硬限，按设计预裁拆分位拆出）；兼容组 = 手写档夹具零改（C6/C7/T10/C4 三格）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  batchTool, batchSegmentTool, configureBatchSegment, resetBatchSegment,
  resolveBatchDocPath, MAX_TEXT_CHARS, SEGMENT_BY_ROLE,
} from "../agent-tools/batch.mjs"
import { _resetProjectRootForTest, _setProjectRootForTest } from "../manifest.mjs"

/** 六段骨架 + §1 状态行（进行中）。 */
function record(statusLine = "🔄 进行中（模块设计·门禁与流程族）") {
  return [
    "# batch record", "",
    "## §1 本批目标与条目（主 agent）", "",
    `**状态行**：${statusLine}`, "",
    "## §2 本批任务书（eng-designer）", "",
    "## §3 设计评审（评审子代理）", "",
    "## §4 主 agent 批注", "",
    "## §5 交付摘要（eng-coder）", "",
    "## §6 收口（父代理）", "",
  ].join("\n")
}

/** 无 §1 状态行的骨架（fail-closed 输入——T10 语义）。 */
function recordWithoutStatusLine() {
  return [
    "# batch rec", "",
    "## §1 本批目标与条目（主 agent）", "",
    "**交付目标**：x", "",
    "## §2 本批任务书（eng-designer）", "",
    "## §3 设计评审（评审子代理）", "",
    "## §4 主 agent 批注", "",
    "## §5 交付摘要（eng-coder）", "",
    "## §6 收口（父代理）", "",
  ].join("\n")
}

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-batch-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

const coder = (dir) => ({ cwd: dir, _role: "eng-coder", _touchedFiles: [] })

/** depth-0 上下文（create/close/status §1/append §1/§4/§6 的身份——D-BR17/D-BR18）。 */
const depth0 = (dir) => ({ cwd: dir, depth: 0, agent: { cwd: dir } })

/** manifest 注入（C9/越基底/create 基底/在飞扫描基底用——声明面单源 batchDocBases）。 */
function writeManifest(dir, batches) {
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({
    version: 1, phase: "initial-dev", docRoot: { batches },
  }))
}

/** 拒句捕获（F11 组：message 全文断言——词表回显 / 逐行残留）。 */
const errOf = (p) => p.then(() => null, (e) => e)
/** 档头填充（F11-C 次序句：create ⇒ 主 agent 填档头 ⇒ 首个 append/status 开放；“普通文档写”）。 */
const fillHeader = (abs) => writeFileSync(abs, readFileSync(abs, "utf8").replace("#<编号>", "#214").replace("<板块>", "TOOLS"), "utf8")

// ═══ create（BR-18–20/25 · C1/C2/C3/C9）════════════════════════════════════════

test("C1/BR-18 create 正例：主代理建档——六段骨架 + §1 状态行占位（进行中）+ 前情指针 + 编制行；建档即过 gate", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      const tool = batchTool(null)
      const out = await tool.execute(
        { action: "create", path: "2026-09-21-x.md", topic: "x", source: "夹具来源", prev: "旧档（已收口 2026-09-20）", date: "2026-09-21" },
        { agent: { cwd: dir }, depth: 0 },
      )
      assert.match(out, /created/, "成功回执")
      const abs = join(dir, "docs", "batches", "2026-09-21-x.md")
      const after = readFileSync(abs, "utf8")
      for (const heading of [
        "## §1 讨论（主 agent）", "## §2 批次任务与设计（eng-designer）", "## §3 设计评审（评审子代理）",
        "## §4 用户批准（主 agent）", "## §5 实施记录（eng-coder）", "## §6 验证与收口（父代理）",
      ]) assert.ok(after.includes(heading), `骨架段头：${heading}`)
      assert.ok(after.includes("**状态行**：🔄 进行中"), "§1 占位状态行（gate 合法词）")
      assert.ok(!after.includes("**状态行**：已收口") && !/\*\*状态行\*\*：.*已收口/.test(after), "占位状态行不带冻结词（已收口优先误冻结防线——判定域限状态行）")
      assert.ok(after.includes("六段 append-only，一段一作者"), "档头 boilerplate（六段一段一作者句）")
      assert.ok(after.includes("编制：主 agent · 2026-09-21"), "编制行")
      assert.ok(after.includes("前情 = 旧档（已收口 2026-09-20）"), "前情指针")
      assert.ok(after.includes("来源 = 夹具来源"), "编制行实参化（F11-B2）")
      assert.ok(after.startsWith("# 2026-09-21 · x\n"), "档头 = 日期 · 主题（F11-B4：无 `<BATCH-ID>` 段）")
      fillHeader(abs) // F11-C 次序句：create ⇒ 主 agent 填档头 ⇒ 首个 append 开放（夹具 Δ）
      await tool.execute({ action: "append", segment: "§4", text: "post-create write" }, { agent: { cwd: dir }, depth: 0 })
      assert.ok(readFileSync(abs, "utf8").includes("post-create write"), "建档即过 gate（占位状态行 ⇒ 在飞批可写）+ 档头填后过占位机检")
    } finally { _resetProjectRootForTest() }
  })
})

test("C2/BR-19/BR-24 create/close 身份拒：eng-designer / eng-coder / 评审 ⇒ throw（main-agent-only）", async () => {
  await withTempDir(async (dir) => {
    const tool = batchTool(null)
    const create = { action: "create", path: "2026-09-21-x.md", topic: "x" }
    const close = { action: "close" }
    await assert.rejects(tool.execute(create, { agent: { cwd: dir, _role: "eng-designer" }, depth: 1 }), /create is main-agent-only/)
    await assert.rejects(tool.execute(create, { agent: coder(dir), depth: 1 }), /create is main-agent-only/)
    await assert.rejects(batchTool("rec.md", { review: true }).execute(create, { agent: coder(dir) }), /create is main-agent-only/, "评审形态同拒")
    await assert.rejects(batchTool("rec.md", { review: true }).execute(close, { agent: coder(dir) }), /close is main-agent-only/, "评审 close 拒（BR-24）")
  })
})

test("C3/BR-20/AC-4 create fail-closed 面：目标已存在 · 非 .md · 越基底 · 缺 path/topic", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      const tool = batchTool(null)
      const ctx = { agent: { cwd: dir }, depth: 0 }
      mkdirSync(join(dir, "docs", "batches"), { recursive: true })
      writeFileSync(join(dir, "docs", "batches", "2026-09-21-x.md"), record(), "utf8")
      await assert.rejects(tool.execute({ action: "create", path: "2026-09-21-x.md", topic: "x" }, ctx), /already exists/, "C3/BR-20 目标已存在")
      await assert.rejects(tool.execute({ action: "create", path: "2026-09-21-t.txt", topic: "t" }, ctx), /\.md/, "非 .md 后缀拒")
      writeManifest(dir, "declared-batches")
      await assert.rejects(tool.execute({ action: "create", path: "../outside-2026-09-21.md", topic: "o" }, ctx), /outside the batch-record base roots/, "越基底拒")
      await assert.rejects(tool.execute({ action: "create", path: "2026-09-21-z.md" }, ctx), /requires topic/, "缺 topic 拒")
      await assert.rejects(tool.execute({ action: "create", topic: "z" }, ctx), /requires path/, "缺 path 拒")
    } finally { _resetProjectRootForTest() }
  })
})

test("C9/BR-25 create 目录不存在：mkdir -p 后骨架一次落位（BR-25）", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      writeManifest(dir, "declared-batches")
      await batchTool(null).execute({ action: "create", path: "nested/2026-09-21-n.md", topic: "n", source: "test" }, { agent: { cwd: dir }, depth: 0 })
      assert.ok(readFileSync(join(dir, "declared-batches", "nested", "2026-09-21-n.md"), "utf8").includes("## §1 讨论（主 agent）"), "骨架落位")
    } finally { _resetProjectRootForTest() }
  })
})

test("create 相对 path 基底 = manifest docRoot.batches（轮 2 裁定——声明面单源，不写死 docs/batches、不落 cwd）", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      writeManifest(dir, "declared-batches")
      await batchTool(null).execute({ action: "create", path: "2026-09-21-d.md", topic: "d", source: "test" }, { agent: { cwd: dir }, depth: 0 })
      assert.ok(existsSync(join(dir, "declared-batches", "2026-09-21-d.md")), "落声明基底")
      assert.ok(!existsSync(join(dir, "2026-09-21-d.md")), "不落 cwd")
      assert.ok(!existsSync(join(dir, "docs", "batches")), "不落默认基底")
    } finally { _resetProjectRootForTest() }
  })
})

// ═══ status（BR-21/22 · C4/C5）═════════════════════════════════════════════════

test("C4/BR-21 status 正例：designer §2 流转（设计完成）；§1 冻结态零变；BR-22 声明段/词表外/双词/缺值拒", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const tool = batchTool("rec.md")
    const designerCtx = { agent: { cwd: dir, _role: "eng-designer" }, depth: 1 }
    const out = await tool.execute({ action: "status", value: "✅ 设计完成 2026-09-21" }, designerCtx)
    assert.match(out, /§2 status line updated/, "成功回执点名写域段")
    const after = readFileSync(abs, "utf8")
    assert.ok(after.includes("**状态行**：✅ 设计完成 2026-09-21"), "§2 状态行更新")
    assert.ok(after.includes("**状态行**：🔄 进行中（模块设计·门禁与流程族）"), "§1 冻结态零变（gate 判定域只读 §1）")
    await assert.rejects(tool.execute({ action: "status", segment: "§1", value: "✅ 设计完成" }, designerCtx), /§1 is not yours to write/, "BR-22 声明段 ≠ 写域段 ⇒ 拒")
    await assert.rejects(tool.execute({ action: "status", value: "随便写写" }, designerCtx), /is not in the legal keyword set/, "C5/BR-22 词表外值拒")
    await assert.rejects(tool.execute({ action: "status", value: "进行中又已收口" }, designerCtx), /multiple keywords/, "词面纪律：双词值拒（已收口优先误冻结防线）")
    await assert.rejects(tool.execute({ action: "status" }, designerCtx), /status requires value/, "缺 value 拒")
    await assert.rejects(
      batchTool("rec.md").execute({ action: "status", value: "进行中" }, { agent: { cwd: dir, _role: "explore" }, depth: 1 }),
      /no segment is writable/, "无写权身份 ⇒ 拒",
    )
    const d0 = depth0(dir)
    await batchTool(null).execute({ action: "status", value: "🔄 进行中", path: "rec.md" }, d0)
    assert.ok(readFileSync(abs, "utf8").includes("**状态行**：🔄 进行中"), "depth-0 status 落 §1（写域仅 §1——轮 2 #3 裁定②）")
    await assert.rejects(
      batchTool(null).execute({ action: "status", segment: "§2", value: "🔄 进行中", path: "rec.md" }, d0),
      /§2 is not yours to write/, "depth-0 对 §2 声明 status ⇒ 拒",
    )
  })
})

// ═══ close 与冻结（BR-23 · C6/C7）══════════════════════════════════════════════

test("C6/BR-23 close 正例：主代理 close ⇒ §1 →「已收口 <日期>」（域限状态行，他段零变）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const out = await batchTool(null).execute({ action: "close", path: "rec.md" }, depth0(dir))
    assert.match(out, /已收口 \d{4}-\d{2}-\d{2}/, "回执带收口日期")
    const after = readFileSync(abs, "utf8")
    assert.ok(after.includes("**状态行**：已收口 "), "§1 收口行落盘")
    assert.ok(!after.includes("🔄 进行中（模块设计·门禁与流程族）"), "旧 §1 行被单行改写（append-only 豁免域 = 状态行）")
    for (const heading of ["## §2 本批任务书（eng-designer）", "## §5 交付摘要（eng-coder）", "## §6 收口（父代理）"]) {
      assert.ok(after.includes(heading), "他段骨架零变")
    }
  })
})

test("C7 close 后冻结：append / status 皆拒（已收口档不回改）；对已收口档再 close ⇒ 拒", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record("✅ 已收口 2026-09-17"), "utf8")
    const d0 = depth0(dir)
    const tool = batchTool(null)
    await assert.rejects(tool.execute({ action: "append", segment: "§4", text: "reopen-marker", path: "rec.md" }, d0), /已收口档不回改/)
    await assert.rejects(tool.execute({ action: "status", value: "🔄 进行中", path: "rec.md" }, d0), /已收口档不回改/)
    await assert.rejects(tool.execute({ action: "close", path: "rec.md" }, d0), /已收口档不回改/, "已收口档再 close ⇒ 拒（close 本身是对冻结档的写）")
    assert.ok(!readFileSync(abs, "utf8").includes("reopen-marker"), "冻结档零写入")
  })
})

test("C7/T10 主名 status 通道同门：状态行缺失 / 两关键字皆不命中 ⇒ throw（fail-closed）", async () => {
  await withTempDir(async (dir) => {
    const d0 = depth0(dir)
    const tool = batchTool(null)
    writeFileSync(join(dir, "a.md"), recordWithoutStatusLine(), "utf8")
    await assert.rejects(tool.execute({ action: "status", value: "🔄 进行中", path: "a.md" }, d0), /状态行不可解析或缺失/)
    writeFileSync(join(dir, "b.md"), record("✅ 已归档（2026-09-16）"), "utf8")
    await assert.rejects(tool.execute({ action: "status", value: "🔄 进行中", path: "b.md" }, d0), /状态行不可解析或缺失/)
  })
})

// ═══ depth-0 path 面（D-BR21）══════════════════════════════════════════════════

test("D-BR21 path 拒面：eng 子代理 append/status / 评审 append 传 path ⇒ throw；零写入", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const coderCtx = { agent: coder(dir), depth: 1 }
    await assert.rejects(
      batchTool("rec.md").execute({ action: "append", segment: "§5", text: "must-not-land", path: "rec.md" }, coderCtx),
      /path is a depth-0-only parameter/,
    )
    await assert.rejects(
      batchTool("rec.md").execute({ action: "status", value: "✅ 实施完成", path: "rec.md" }, coderCtx),
      /path is a depth-0-only parameter/,
    )
    await assert.rejects(
      batchTool("rec.md", { review: true }).execute({ action: "append", segment: "§3", text: "must-not-land", path: "rec.md" }, { agent: coder(dir) }),
      /path is a depth-0-only parameter/,
    )
    assert.ok(!readFileSync(abs, "utf8").includes("must-not-land"), "拒面 ⇒ 零写入")
  })
})

test("D-BR21 缺省定位：唯一在飞批 ⇒ 命中；0 在飞 ⇒ 拒；复数在飞 ⇒ 拒（列候选）；已收口档不作候选", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      const d0 = depth0(dir)
      const tool = batchTool(null)
      mkdirSync(join(dir, "docs", "batches"), { recursive: true })
      await assert.rejects(tool.execute({ action: "append", segment: "§4", text: "solo" }, d0), /no batch record in flight/, "0 在飞拒")
      writeFileSync(join(dir, "docs", "batches", "old-closed.md"), record("✅ 已收口 2026-09-20"), "utf8")
      writeFileSync(join(dir, "docs", "batches", "in-flight.md"), record(), "utf8")
      await tool.execute({ action: "append", segment: "§4", text: "default-target-marker" }, d0)
      assert.ok(readFileSync(join(dir, "docs", "batches", "in-flight.md"), "utf8").includes("default-target-marker"), "命中唯一在飞批")
      assert.ok(!readFileSync(join(dir, "docs", "batches", "old-closed.md"), "utf8").includes("default-target-marker"), "已收口档不作候选")
      writeFileSync(join(dir, "docs", "batches", "in-flight-2.md"), record(), "utf8")
      await assert.rejects(tool.execute({ action: "append", segment: "§4", text: "amb" }, d0), /2 batch records are in flight/, "复数在飞拒")
    } finally { _resetProjectRootForTest() }
  })
})

test("depth-0 append 段白名单：§1/§4/§6 可写；§2/§3/§5/§9 拒（batch: 前缀新错误面）；unknown segment/action", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const d0 = depth0(dir)
    const tool = batchTool(null)
    await tool.execute({ action: "append", segment: "§1", text: "s1-marker", path: "rec.md" }, d0)
    await tool.execute({ action: "append", segment: "6", text: "s6-marker", path: "rec.md" }, d0)
    const after = readFileSync(abs, "utf8")
    assert.ok(after.includes("s1-marker") && after.includes("s6-marker"), "§1/§6 落段")
    await assert.rejects(tool.execute({ action: "append", segment: "§5", text: "nope", path: "rec.md" }, d0), /batch: §5 is not yours to write/)
    await assert.rejects(tool.execute({ action: "append", segment: "§2", text: "nope", path: "rec.md" }, d0), /batch: §2 is not yours to write/)
    await assert.rejects(tool.execute({ action: "append", segment: "§3", text: "nope", path: "rec.md" }, d0), /batch: §3 is not yours to write/)
    await assert.rejects(tool.execute({ action: "append", segment: "§9", text: "nope", path: "rec.md" }, d0), /batch: §9 is not yours to write/)
    await assert.rejects(tool.execute({ action: "append", segment: "wat", text: "nope", path: "rec.md" }, d0), /batch: unknown segment/)
    await assert.rejects(tool.execute({ action: "pillage" }, d0), /batch: unknown action/)
  })
})

// ═══ 过渡别名（AC-2/AC-9/BR-26 · C8）════════════════════════════════════════════

test("C8/AC-9/BR-26 别名等价：batch_segment ⇒ append 同一执行体（同回执构 / 同拒面 / schema 仅 {segment,text}）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const tool = batchSegmentTool("rec.md")
    const coderCtx = { agent: coder(dir), depth: 1 }
    const outAlias = await tool.execute({ segment: "§5", text: "via alias" }, coderCtx)
    assert.match(outAlias, /appended/)
    assert.ok(readFileSync(abs, "utf8").includes("via alias"), "别名写入落盘")
    const outBatch = await batchTool("rec.md").execute({ action: "append", segment: "§5", text: "via alias" }, coderCtx)
    assert.equal(outBatch, outAlias, "别名与主名 append 回执逐字同构（同一执行体）")
    await assert.rejects(tool.execute({ segment: "§2", text: "nope" }, coderCtx), /batch_segment: §2 is not yours to write/, "越段拒面同（batch_segment: 前缀逐字）")
    await assert.rejects(tool.execute({ segment: "§5", text: "designId: only-credential" }, coderCtx), /nothing to append/, "凭证剥空拒同（T4 同型——纯凭证行剥空整行丢弃）")
    await assert.rejects(tool.execute({ segment: "§5", text: "## §4 injected" }, coderCtx), /section header line/, "骨架保护同")
    await assert.rejects(tool.execute({ segment: "§5", text: "y".repeat(MAX_TEXT_CHARS + 1) }, coderCtx), new RegExp(String(MAX_TEXT_CHARS)), "超量拒同")
    writeFileSync(abs, record("✅ 已收口 2026-09-17"), "utf8")
    await assert.rejects(tool.execute({ segment: "§5", text: "reopen" }, coderCtx), /batch_segment: 已收口档不回改/, "冻结拒同（前缀逐字保）")
    await assert.rejects(
      batchSegmentTool(null).execute({ segment: "§5", text: "orphan" }, coderCtx),
      /batch_segment: no batch record is bound/, "无绑定拒（batch_segment: 前缀逐字）",
    )
  })
})

test("AC-2 别名形状 + 动态 import 键集：双导出在场 · name/schema/描述锚 · re-export 面完整", async () => {
  const plain = batchSegmentTool("rec.md")
  const rev = batchSegmentTool("rec.md", { review: true })
  assert.equal(plain.name, "batch_segment")
  assert.equal(rev.name, "batch_segment", "review 形态同名（挂载面等价——§4.14）")
  assert.deepEqual([...plain.parameters.required], ["segment", "text"])
  for (const anchor of [
    "Append your own section of the batch record (一段一作者).",
    "eng-designer → §2, design review → §3, eng-coder → §5",
    "Credential values are stripped mechanically before writing",
    "### 轮次 N（评审子代理）",
    "§× 未写入",
  ]) assert.ok(plain.description.includes(anchor), `描述逐字锚：${anchor.slice(0, 32)}…`)
  const mod = await import("../agent-tools/batch.mjs")
  for (const key of ["batchTool", "batchSegmentTool", "resolveBatchDocPath", "batchDocBases", "batchDocForReview", "configureBatchSegment", "resetBatchSegment", "MAX_TEXT_CHARS", "SEGMENT_BY_ROLE"]) {
    assert.ok(mod[key] !== undefined, `导出在场：${key}`)
  }
  assert.equal(typeof mod.batchTool, "function")
  assert.equal(typeof mod.batchSegmentTool, "function")
  assert.deepEqual(SEGMENT_BY_ROLE, { "eng-designer": 2, "eng-coder": 5 }, "SEGMENT_BY_ROLE re-export（shim 超集需要）")
})

// ═══ #84 缝（AC-11）+ C10 + 路径单源等价 ═══════════════════════════════════════

test("AC-11 #84 缝：注入回调按写入各一次（create/append/status 三通道）；幂等由注入面保证；reset 撤销", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      const tool = batchTool(null)
      const agent = { cwd: dir, _touchedFiles: [] }
      const calls = []
      configureBatchSegment({
        onWrite: (a, abs) => {
          calls.push(abs)
          if (Array.isArray(a._touchedFiles) && !a._touchedFiles.includes(abs)) a._touchedFiles.push(abs)
        },
      })
      try {
        const ctx = { agent, depth: 0 }
        await tool.execute({ action: "create", path: "2026-09-21-x.md", topic: "x", source: "test" }, ctx)
        fillHeader(join(dir, "docs", "batches", "2026-09-21-x.md")) // F11-C 夹具 Δ（create 后、首写前）
        await tool.execute({ action: "append", segment: "§4", text: "seam write", path: "docs/batches/2026-09-21-x.md" }, ctx)
        await tool.execute({ action: "status", value: "🔄 进行中", path: "docs/batches/2026-09-21-x.md" }, ctx)
        assert.equal(calls.length, 3, "三次写入 ⇒ 回调恰三次（含 create/status 新通道）")
        assert.deepEqual(agent._touchedFiles, [calls[0]], "幂等记账（includes 守卫——同档不重复）")
      } finally { resetBatchSegment() }
      await tool.execute({ action: "append", segment: "§4", text: "post reset", path: "docs/batches/2026-09-21-x.md" }, { agent, depth: 0 })
      assert.equal(calls.length, 3, "reset 撤销注入（不再回调）")
    } finally { _resetProjectRootForTest() }
  })
})

test("C10 append 不补骨架：目标档缺 §2 骨架标题 ⇒ throw（既有 fail-closed——create 是骨架唯一权威入口）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "partial.md")
    writeFileSync(abs, "# partial record\n\n## §1 讨论（主 agent）\n\n**状态行**：🔄 进行中\n\nsome text\n", "utf8")
    await assert.rejects(
      batchSegmentTool("partial.md").execute({ segment: "§2", text: "body-marker" }, { agent: { cwd: dir, _role: "eng-designer" }, depth: 1 }),
      /batch_segment: the bound batch record has no "## §2" section header/,
    )
    assert.ok(!readFileSync(abs, "utf8").includes("body-marker"), "未写入")
  })
})

test("resolveBatchDocPath（主档单源）：cwd 命中 → abs；不可读 → throw（若传则须可读——评审门同源）", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), record(), "utf8")
    assert.equal(resolveBatchDocPath(dir, "rec.md"), join(dir, "rec.md"))
    assert.throws(() => resolveBatchDocPath(dir, "nope.md"), /batchDoc is not a readable file/)
  })
})

// ═══ F11 词面协议结构化（A：value 谓词 + note · B：create 补齐/归一化 · C：死占位机检）════

test("F11-A1/A4 写入面机械拦：散文内嵌值拒 + 词表回显（先红）；note 含冻结词 / 占位 / 多行 ⇒ 拒；零写入", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    const designer = { agent: { cwd: dir, _role: "eng-designer" }, depth: 1 }
    writeFileSync(abs, record(), "utf8")
    // 事故①复现形：现行子串谓词恰命中「已收口」∈ §1 词表 ⇒ 接受；新谓词剥装饰后余核 `讨论已收口` ≠ 关键词 ⇒ 拒
    const e1 = await errOf(batchTool(null).execute({ action: "status", value: "讨论已收口 2026-09-21", path: "rec.md" }, depth0(dir)))
    assert.match(String(e1?.message), /is not in the legal keyword set/, "F11-A1 余核 ≠ 关键词（散文内嵌）⇒ 拒")
    assert.match(String(e1?.message), /进行中 \/ 已收口/, "错误句回显 §1 词表（与 0 命中 / 词表外同串）")
    for (const [note, re, label] of [
      ["已收口", /must not contain any STATUS_WORDS keyword/, "F11-A4 note 含冻结词（括注永不误触 gate）"],
      ["<板块> 待填", /must not carry skeleton placeholders/, "F11-A4 note 含骨架占位"],
      ["两行\n注释", /single line/, "F11-A4 note 多行"],
    ]) {
      assert.match(String((await errOf(batchTool("rec.md").execute({ action: "status", value: "进行中", note }, designer)))?.message), re, label)
    }
    assert.ok(readFileSync(abs, "utf8").includes("**状态行**：🔄 进行中（模块设计·门禁与流程族）"), "零写入（§1 冻结真值零污染）")
  })
})

test("F11-A2/A3 note 落盘形态：带 note ⇒ `关键词（括注）`；无 note ⇒ 纯值（旧形态零变）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    const designer = { agent: { cwd: dir, _role: "eng-designer" }, depth: 1 }
    writeFileSync(abs, record(), "utf8")
    await batchTool("rec.md").execute({ action: "status", value: "进行中", note: "F10/F11 进设计轮" }, designer)
    assert.ok(readFileSync(abs, "utf8").includes("**状态行**：进行中（F10/F11 进设计轮）"), "F11-A2 括注落状态行（仅状态行行内）")
    await batchTool("rec.md").execute({ action: "status", value: "设计完成" }, designer)
    assert.ok(readFileSync(abs, "utf8").includes("**状态行**：设计完成"), "F11-A3 无 note ⇒ 纯值")
    assert.ok(!readFileSync(abs, "utf8").includes("设计完成（"), "无括注")
  })
})

test("F11-B1 缺 source ⇒ 拒（topic 同款 fail-closed——死锁防线）；多行 source 拒；零落盘", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      const ctx = { agent: { cwd: dir }, depth: 0 }
      await assert.rejects(batchTool(null).execute({ action: "create", path: "2026-09-21-s.md", topic: "s" }, ctx), /create requires source/, "缺 source 拒")
      await assert.rejects(batchTool(null).execute({ action: "create", path: "2026-09-21-s.md", topic: "s", source: "a\nb" }, ctx), /source must be a single line/, "多行 source 拒")
      assert.ok(!existsSync(join(dir, "docs", "batches", "2026-09-21-s.md")), "零落盘")
    } finally { _resetProjectRootForTest() }
  })
})

test("F11-B2/B4 create 产物：编制行实参化 · 档头无 `<BATCH-ID>` · 台账两占位留待主 agent", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      await batchTool(null).execute({ action: "create", path: "2026-09-21-s.md", topic: "s", source: "用户 22:47 双提问", date: "2026-09-21" }, { agent: { cwd: dir }, depth: 0 })
      const after = readFileSync(join(dir, "docs", "batches", "2026-09-21-s.md"), "utf8")
      assert.ok(after.includes("编制：主 agent · 2026-09-21 · 来源 = 用户 22:47 双提问。"), "F11-B2 编制行 = 来源实参")
      assert.ok(!after.includes("<讨论来源>"), "旧占位零产出")
      assert.ok(after.startsWith("# 2026-09-21 · s\n"), "F11-B4 档头 = `# <date> · <topic>`（无 ID 段）")
      assert.ok(after.includes("> 台账 = #<编号>（<板块> · 归批）。"), "台账行两占位保留（填充 = 主 agent · 首写前）")
    } finally { _resetProjectRootForTest() }
  })
})

test("F11-B3 prev 幂等剥：`前情 = 前情 = X` / `前情 = X` / `X` ⇒ 落盘行均 `前情 = X`（单前缀）", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      for (const [i, prev] of ["前情 = 前情 = X", "前情 = X", "X"].entries()) {
        const name = `2026-09-21-p${i}.md`
        await batchTool(null).execute({ action: "create", path: name, topic: `p${i}`, source: "test", prev }, { agent: { cwd: dir }, depth: 0 })
        const after = readFileSync(join(dir, "docs", "batches", name), "utf8")
        assert.ok(after.includes("前情 = X。") && !after.includes("前情 = 前情"), `prev=${JSON.stringify(prev)} ⇒ 单前缀落盘`)
      }
    } finally { _resetProjectRootForTest() }
  })
})

test("F11-C 组拆档落地：占位机检用例（C1–C4）住邻档 `test/batch-placeholder-gate.test.mjs`（本档 + F11 后越 500 硬限 ⇒ 按设计预裁拆分位拆出）", () => {
  const sibling = join(dirname(fileURLToPath(import.meta.url)), "batch-placeholder-gate.test.mjs")
  assert.ok(existsSync(sibling), "邻档在位（C 组已拆出——本档零引用其私有夹具）")
})
