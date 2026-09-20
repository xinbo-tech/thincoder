/**
 * batch-segment-manifest.test.mjs — 批次档段写入的 manifest 面（ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md
 * §3；写入门禁用例 = batch-segment.test.mjs）。
 *
 * 覆盖：resolveBatchDocPath 先 cwd 后 manifest docRoot.batches 双基底（N3）· execute 与门禁单源（AC-M3-1）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchSegmentTool, resolveBatchDocPath } from "../agent-tools/batch.mjs"
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

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-batch-seg-man-"))
  _setProjectRootForTest(dir)
  try { return await fn(dir) } finally { _resetProjectRootForTest(); rmSync(dir, { recursive: true, force: true }) }
}

const coder = (dir) => ({ cwd: dir, _role: "eng-coder", _touchedFiles: [] })

function writeManifest(dir, overrides = {}) {
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({
    version: 1, phase: "initial-dev",
    docRoot: {
      requirements: "docs/requirements", specs: "docs/requirements/specs",
      design: "docs/design", modules: "docs/design/modules", batches: "docs/batches",
    },
    promptsLanding: "thincoder-core/prompts",
    checkConfig: {
      scanDirs: ["docs"], lineWidth: 300,
      anchors: { domain: "docs", exclude: ["_archive", "batches"] }, exemptions: [],
    },
    ...overrides,
  }, null, 2), "utf8")
}

test("N3/AC-M3-1 双基底：resolveBatchDocPath 先 cwd 后 manifest docRoot.batches；execute 同门（单源）", async () => {
  await withTempDir(async (dir) => {
    const batchesDir = join(dir, "docs", "batches")
    mkdirSync(batchesDir, { recursive: true })
    writeFileSync(join(batchesDir, "r.md"), record(), "utf8")

    // ① 无 manifest → v1 单基底：裸名不可读 → throw
    assert.throws(() => resolveBatchDocPath(dir, "r.md"), /not a readable file/)

    // ② manifest docRoot.batches → 第二基底命中
    writeManifest(dir, { docRoot: { batches: "docs/batches" } })
    assert.equal(resolveBatchDocPath(dir, "r.md"), join(batchesDir, "r.md"))

    // ③ execute 绑定裸名 → 同一门禁放行（拒面与落点接线同源）
    const tool = batchSegmentTool("r.md", {})
    const out = await tool.execute({ segment: "§5", text: "via second base" }, { agent: coder(dir) })
    assert.match(out, /appended/)
    assert.ok(readFileSync(join(batchesDir, "r.md"), "utf8").includes("via second base"), "经第二基底落盘")

    // ④ 两基底皆不可读 → throw（fail-closed 不变）
    assert.throws(() => resolveBatchDocPath(dir, "nope.md"), /not a readable file/)
  })
})
