/**
 * batch-anchor-create.test.mjs —— 集成用例 8-1 / 8-2（RTM CLI 端故事 8「批次档建在项目里
 * （工作区锚报明、不落锚目录）」；判据 = `docs/core/design/BATCH-RECORD.md` §4.15 条 5 ·
 * 设计 = `docs/core/design/LEDGER.md` §3.8「多根工作区锚（batch 面）」）。
 *
 * 业务入口 = 真 `batch` 工具（`agent-tools/batch.mjs`）的 `create` 动作（depth-0 形态）；
 * 判据落在工具回执 / 抛面文案与盘面事实（档是否落成、锚目录下是否新建目录）——不是内部函数返回值。
 * 夹具 = tmp 目录（根无 `PROJECT-MANIFEST.json`、下辖 1 个带档项目）：会话锚 = 该目录。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"

/** 下辖项目的项目档（批次基底走默认声明值 `docs/batches`——与 RTM 8-2 的路径形一致）。 */
const MANIFEST = JSON.stringify({
  version: "0.0.0-test",
  phase: "test",
  docRoot: {
    requirements: "docs/core/requirements",
    specs: "docs/core/specs",
    design: "docs/core/design",
    modules: "docs/core/modules",
    batches: "docs/batches",
  },
  codePaths: ["src"],
  index: { publicRepos: [] },
}, null, 2)

/** 夹具：锚目录（无档） + 下辖 1 个带档项目 `only`。返回锚绝对路径。 */
function workspaceFixture(t) {
  const box = mkdtempSync(join(tmpdir(), "tc-int-batch-anchor-"))
  t.after(() => rmSync(box, { recursive: true, force: true }))
  mkdirSync(join(box, "only"), { recursive: true })
  writeFileSync(join(box, "only", "PROJECT-MANIFEST.json"), MANIFEST)
  return box
}

/** create 调用面（depth-0 主 agent 形态；会话锚 = `box`）。 */
const create = (box, path) => batchTool().execute(
  { action: "create", path, topic: "anchor-demo", source: "integration 8-x fixture" },
  { agent: { cwd: box }, depth: 0 },
)

test('8-1 多根工作区锚（下辖 1 个项目）+ create 无所属 ⇒ 报明 + 路径指引，零建档', { timeout: 60_000 }, async (t) => {
  const box = workspaceFixture(t)
  const candidate = resolve(join(box, "only"))

  await assert.rejects(
    () => create(box, "docs/batches/x.md"),
    (err) => {
      const msg = String(err?.message ?? err)
      assert.match(msg, /belongs to no project/, `报明锚态（机检锚），实际：${msg}`)
      assert.ok(msg.includes(candidate), `下辖项目全列（绝对路径），实际：${msg}`)
      assert.match(msg, /holds 1 project\(s\) below it/, `单句对 1 ∥ ≥2 皆真，实际：${msg}`)
      assert.match(msg, /Pass an explicit path under a project \(e\.g\. ".*docs\/batches\/<file>\.md"\)/, `显式路径指引，实际：${msg}`)
      return true
    },
  )
  assert.equal(existsSync(join(box, "docs")), false, "锚目录下零 docs 新建（不静默建 <锚>/docs/batches）")
  assert.equal(existsSync(join(candidate, "docs", "batches")), false, "被报明的项目侧也零建档（本动作未落盘）")
})

test('8-2 多根工作区锚 + create 目标属某项目 ⇒ 落该项目声明基底，锚目录零新建', { timeout: 60_000 }, async (t) => {
  const box = workspaceFixture(t)
  const project = resolve(join(box, "only"))
  const expected = resolve(join(project, "docs", "batches", "x.md"))

  const receipt = String(await create(box, "only/docs/batches/x.md"))

  assert.match(receipt, /^batch: created /, `create 正常路径不被误报，实际：${receipt}`)
  assert.ok(receipt.includes(expected), `回执路径 = 该项目内绝对路径，实际：${receipt}`)
  assert.equal(existsSync(expected), true, "档落该项目声明基底")
  const src = readFileSync(expected, "utf8")
  assert.match(src, /^# /m, "落成的是批次档骨架")
  assert.match(src, /## §1/, "六段骨架在盘")
  assert.equal(existsSync(join(box, "docs")), false, "锚目录下零 docs 新建")
})
