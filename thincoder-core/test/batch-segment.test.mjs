/**
 * batch-segment.test.mjs — 批次档段写入的记账面注入缝（#84 VSC 侧并入 · 端注入形态）。
 *
 * 行为面（CORE-UNIFICATION §2.13.4 #84「记账面按端注入」）：
 * 缺省 **no-op**（CLI 语义零行为变）· 端装配经 `configureBatchSegment({ onWrite })` 覆盖
 * （写入成功即回调一次，拿到 agent + abs——VSC 侧现形 = `_touchedFiles` 记账）·
 * `resetBatchSegment()` 撤销回 no-op。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchSegmentTool, configureBatchSegment, resetBatchSegment } from "../agent-tools/batch-segment.mjs"

const RECORD = [
  "# batch record",
  "",
  "## §2 design",
  "",
  "## §5 implementation",
  "",
  "## §6 close-out",
  "",
].join("\n")

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-batch-seg-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

test("#84 记账面注入缝：缺省 no-op（CLI 零行为变）；注入面被回调（agent + abs）；reset 撤销", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "rec.md"), RECORD, "utf8")
    const tool = batchSegmentTool("rec.md", {})
    const agent = { cwd: dir, _role: "eng-coder", _touchedFiles: [] }
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
    writeFileSync(join(dir, "rec.md"), RECORD, "utf8")
    const tool = batchSegmentTool("rec.md", {})
    const agent = { cwd: dir, _role: "eng-coder" }
    try {
      configureBatchSegment({}) // 无 onWrite
      configureBatchSegment(null)
      const out = await tool.execute({ segment: "§5", text: "no-op shape" }, { agent })
      assert.match(out, /appended/)
    } finally { resetBatchSegment() }
  })
})
