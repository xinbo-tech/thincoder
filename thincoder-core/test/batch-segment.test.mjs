/**
 * batch-segment.test.mjs — 批次档段写入工具行为面（ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md §3；
 * manifest 咬合 / 双基底用例 = batch-segment-manifest.test.mjs）。
 *
 * 覆盖（T 表 = 模块设计 §3.2）：六段骨架 + §1 状态行既有字节不变（T1/AC-2）· §3 轮次盖戳（T2）·
 * 凭证剥除（T4）· 超长拒（T5）· 越段拒（T6）· 冻结档拒写（T7）· §2 内「状态行」字样不参与冻结
 * 判定（T9）· 状态行缺失/不可解析 fail-closed（T10）。
 * #84 记账面注入缝（CORE-UNIFICATION §2.13.4）行为同前：缺省 no-op · configureBatchSegment 覆盖 ·
 * resetBatchSegment 撤销。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchSegmentTool, configureBatchSegment, MAX_TEXT_CHARS, resetBatchSegment } from "../agent-tools/batch-segment.mjs"

/**
 * 六段骨架 + §1 状态行（进行中）。§2 内的 `**状态行**：已收口 …` 行是 T9 对抗样本——
 * 冻结判定只读 §1，该行不参与判定（放行不误拒）。
 */
function record(statusLine = "🔄 进行中（模块设计·门禁与流程族）") {
  return [
    "# batch record", "",
    "## §1 本批目标与条目（主 agent）", "",
    `**状态行**：${statusLine}`, "",
    "## §2 本批任务书（eng-designer）", "",
    "**状态行**：✅ 已收口 2026-09-16——§2 段内字样（冻结判定只读 §1——不参与判定）", "",
    "## §3 设计评审（评审子代理）", "",
    "## §4 主 agent 批注", "",
    "## §5 交付摘要（eng-coder）", "",
    "## §6 收口（父代理）", "",
  ].join("\n")
}

/** 无 §1 状态行的骨架（T10 输入——fail-closed 视为冻结）。 */
function recordWithoutStatusLine() {
  return [
    "# batch record", "",
    "## §1 本批目标与条目（主 agent）", "",
    "**交付目标**：门禁与流程族", "",
    "## §2 本批任务书（eng-designer）", "",
    "## §3 设计评审（评审子代理）", "",
    "## §4 主 agent 批注", "",
    "## §5 交付摘要（eng-coder）", "",
    "## §6 收口（父代理）", "",
  ].join("\n")
}

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-batch-seg-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

const coder = (dir) => ({ cwd: dir, _role: "eng-coder", _touchedFiles: [] })

test("#84 记账面注入缝：缺省 no-op（CLI 零行为变）；注入面被回调（agent + abs）；reset 撤销", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    const agent = coder(dir)
    const abs = join(dir, "rec.md")

    // ① 缺省：no-op——零记账（CLI 语义零行为变）
    await tool.execute({ segment: "§5", text: "plain write" }, { agent })
    assert.deepEqual(agent._touchedFiles, [], "缺省不注入 ⇒ 零记账")
    assert.ok(readFileSync(abs, "utf8").includes("plain write"), "写入本身照常落盘")

    // ② 注入（端装配形态——VSC 侧现形 = 记入写域）
    const calls = []
    configureBatchSegment({
      onWrite: (a, p) => {
        calls.push([a, p])
        if (Array.isArray(a._touchedFiles) && !a._touchedFiles.includes(p)) a._touchedFiles.push(p)
      },
    })
    try {
      await tool.execute({ segment: "§5", text: "with seam" }, { agent })
      assert.equal(calls.length, 1, "写入成功 ⇒ 回调恰一次")
      assert.equal(calls[0][0], agent)
      assert.equal(calls[0][1], abs, "回调拿到的 abs = 绑定档绝对路径")
      assert.deepEqual(agent._touchedFiles, [abs], "注入面执行记账（幂等由注入实现保证）")
      await tool.execute({ segment: "§5", text: "again" }, { agent })
      assert.equal(calls.length, 2, "每次写入各回调一次")
      assert.deepEqual(agent._touchedFiles, [abs], "重复写入不重复记账（注入面 includes 守卫）")
    } finally { resetBatchSegment() }

    // ③ reset 撤销 ⇒ 回 no-op
    await tool.execute({ segment: "§5", text: "post reset" }, { agent })
    assert.equal(calls.length, 2, "reset 撤销注入（不再回调）")
    assert.ok(readFileSync(abs, "utf8").includes("post reset"), "写入照常")
  })
})

test("#84 注入缝：非法形态（缺 onWrite / 非对象）⇒ 视为 no-op，不抛", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    const agent = coder(dir)
    try {
      configureBatchSegment({}) // 无 onWrite
      configureBatchSegment(null)
      const out = await tool.execute({ segment: "§5", text: "no-op shape" }, { agent })
      assert.match(out, /appended/)
    } finally { resetBatchSegment() }
  })
})

test("T1/AC-2 正常：designer 写 §2——追加成功，六段标题与 §1 状态行既有字节不变", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    const out = await tool.execute(
      { segment: "§2", text: "designer notes" },
      { agent: { cwd: dir, _role: "eng-designer" } },
    )
    assert.match(out, /appended/)
    const after = readFileSync(abs, "utf8")
    assert.ok(after.includes("designer notes"), "文本追加成功")
    for (const heading of [
      "## §1 本批目标与条目（主 agent）", "## §2 本批任务书（eng-designer）",
      "## §3 设计评审（评审子代理）", "## §4 主 agent 批注",
      "## §5 交付摘要（eng-coder）", "## §6 收口（父代理）",
    ]) {
      assert.ok(after.includes(heading), `骨架标题保留：${heading}`)
    }
    assert.ok(after.includes("**状态行**：🔄 进行中（模块设计·门禁与流程族）"), "§1 状态行既有字节不变")
    assert.ok(after.indexOf("designer notes") < after.indexOf("## §3"), "追加落在 §2 段尾")
  })
})

test("T2 正常：评审形态写 §3——工具盖「### 轮次 N（评审子代理）」，N 顺延", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const tool = batchSegmentTool("rec.md", { review: true })
    await tool.execute({ segment: "§3", text: "findings one" }, { agent: coder(dir) })
    await tool.execute({ segment: "§3", text: "findings two" }, { agent: coder(dir) })
    const after = readFileSync(abs, "utf8")
    assert.ok(after.includes("### 轮次 1（评审子代理）"), "首轮盖戳 N=1")
    assert.ok(after.includes("### 轮次 2（评审子代理）"), "二轮盖戳 N=2")
  })
})

test("T3/T9 正常：coder 写 §5——§2 内「状态行」字样不参与冻结判定（放行不误拒）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await tool.execute(
      { segment: "§5", text: "delivery — 状态行（已收口字样不误判）stays in §1" },
      { agent: coder(dir) },
    )
    await tool.execute({ segment: "§5", text: "second write after bait" }, { agent: coder(dir) })
    const after = readFileSync(abs, "utf8")
    assert.ok(after.includes("delivery — 状态行（已收口字样不误判）stays in §1"))
    assert.ok(after.includes("second write after bait"), "写入后 §2 字样仍不误拒后续写入")
    assert.ok(after.includes("**状态行**：✅ 已收口 2026-09-16——§2 段内字样"), "§2 对抗行未被触碰")
  })
})

test("T4 边界：凭证行剥除——designId/凭证形态不落档，剥空整行丢弃", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await tool.execute(
      { segment: "§5", text: "keep line\ndesignId: abc123\n[DESIGN-TOKEN:xyz] suffix kept" },
      { agent: coder(dir) },
    )
    const after = readFileSync(abs, "utf8")
    assert.ok(!after.includes("abc123") && !after.includes("[DESIGN-TOKEN:"), "凭证形态不落档")
    assert.ok(after.includes("keep line") && after.includes("suffix kept"), "其余内容逐字保留")
    await assert.rejects(
      tool.execute({ segment: "§5", text: "designId: only-credential" }, { agent: coder(dir) }),
      /nothing to append/,
    )
  })
})

test("T5 边界：超 20000 字符 → throw（引导分段）", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await assert.rejects(
      tool.execute({ segment: "§5", text: "x".repeat(MAX_TEXT_CHARS + 1) }, { agent: coder(dir) }),
      new RegExp(String(MAX_TEXT_CHARS)),
    )
  })
})

test("T6 错误：越段——designer 写 §5 → throw「not yours」", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), record(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await assert.rejects(
      tool.execute({ segment: "§5", text: "nope" }, { agent: { cwd: dir, _role: "eng-designer" } }),
      /not yours/,
    )
  })
})

test("T7 错误：冻结档回改——状态行含「已收口」→ throw，未写入", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record("✅ 已收口 2026-09-17"), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await assert.rejects(
      tool.execute({ segment: "§5", text: "reopen attempt" }, { agent: coder(dir) }),
      /已收口档不回改/,
    )
    assert.ok(!readFileSync(abs, "utf8").includes("reopen attempt"), "冻结档未被写入")
  })
})

test("T10 错误：状态行缺失 → throw「状态行不可解析或缺失」（fail-closed）", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), recordWithoutStatusLine(), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await assert.rejects(
      tool.execute({ segment: "§5", text: "x" }, { agent: coder(dir) }),
      /状态行不可解析或缺失/,
    )
  })
})

test("T10 错误：状态行两关键字皆不命中 → throw（视为冻结）", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), record("✅ 已归档（2026-09-16）"), "utf8")
    const tool = batchSegmentTool("rec.md", {})
    await assert.rejects(
      tool.execute({ segment: "§5", text: "x" }, { agent: coder(dir) }),
      /状态行不可解析或缺失/,
    )
  })
})
