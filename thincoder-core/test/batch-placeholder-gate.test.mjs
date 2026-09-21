/**
 * batch-placeholder-gate.test.mjs — 批次档**死占位机检**（F11-C · tool-discipline 批）。
 *
 * 拆档理由（行数纪律）：F11 用例入 `batch.test.mjs` 后实测 **506 行 > 500 硬限**（设计预估
 * 485，实超）⇒ 按设计预裁的拆分位拆出「占位机检组」（共享夹具随拆复制——`record()` /
 * `withTempDir` / manifest 注入同款）；A/B 组（value 谓词 + create 参数面）仍住
 * `batch.test.mjs`。
 *
 * 判据 = 骨架死占位**枚举单源**（`agent-tools/batch-skeleton.mjs` 的 `TEMPLATE_PLACEHOLDERS`
 * + 纯函数 `findPlaceholderResidue`）：判定域 = **档头 + 本次目标段**（他段占位不归本段作者管
 * ——一段一作者）；行号 = 各判定域内 1-based（档头域自档首行起 · 段域自 `## §N` 标题行起）。
 *
 * 用例：C1（create 直产档未填档头 ⇒ 首写拒 + 次序句兜底 · 填后立即放行）· C2（status 同门）·
 * C3（判定域域限——他段占位不拦）· C4（`<§N 模板占位：…>` 合法暂存不拦）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchTool } from "../agent-tools/batch.mjs"
import { _resetProjectRootForTest, _setProjectRootForTest } from "../manifest.mjs"

/** 六段骨架 + §1 状态行（进行中；档头无死占位——手写档夹具形态）。 */
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
  const dir = mkdtempSync(join(tmpdir(), "core-batch-gate-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

const coder = (dir) => ({ cwd: dir, _role: "eng-coder", _touchedFiles: [] })
/** depth-0 上下文（create/append §4 的身份）。 */
const depth0 = (dir) => ({ cwd: dir, depth: 0, agent: { cwd: dir } })
/** 拒句捕获（message 全文断言——逐行残留行号 + 原文）。 */
const errOf = (p) => p.then(() => null, (e) => e)
/** 档头填充（次序句：create ⇒ 主 agent 填档头 ⇒ 首个 append/status 开放；“普通文档写”）。 */
const fillHeader = (abs) => writeFileSync(abs, readFileSync(abs, "utf8").replace("#<编号>", "#214").replace("<板块>", "TOOLS"), "utf8")

test("F11-C1 create 直产档首写被拒（次序句兜底）：档头逐行残留（行号 + 原文）；填后立即放行（非死锁）", async () => {
  await withTempDir(async (dir) => {
    _setProjectRootForTest(dir)
    try {
      const d0 = depth0(dir)
      const tool = batchTool(null)
      await tool.execute({ action: "create", path: "2026-09-21-c.md", topic: "c", source: "test", date: "2026-09-21" }, { agent: { cwd: dir }, depth: 0 })
      const abs = join(dir, "docs", "batches", "2026-09-21-c.md")
      const e = await errOf(tool.execute({ action: "append", segment: "§4", text: "must-not-land", path: "docs/batches/2026-09-21-c.md" }, d0))
      assert.match(String(e?.message), /档头 line 4: > 台账 = #<编号>（<板块> · 归批）。/, "逐行列残留（行号 = 填充位置提示 + 原文）")
      assert.ok(!readFileSync(abs, "utf8").includes("must-not-land"), "零写入")
      fillHeader(abs)
      await tool.execute({ action: "append", segment: "§4", text: "filled-header write", path: "docs/batches/2026-09-21-c.md" }, d0)
      assert.ok(readFileSync(abs, "utf8").includes("filled-header write"), "填档头后立即放行（机检 = 次序约束兜底）")
    } finally { _resetProjectRootForTest() }
  })
})

test("F11-C2/C3 判定域：目标段残留拦（status 同门）；他段残留不拦（一段一作者）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record().replace("## §5 交付摘要（eng-coder）", "## §5 交付摘要（eng-coder）\n来源 = <讨论来源>"), "utf8")
    const e = await errOf(batchTool("rec.md").execute({ action: "status", value: "实施完成" }, { agent: coder(dir), depth: 1 }))
    assert.match(String(e?.message), /目标段 line 2: 来源 = <讨论来源>/, "F11-C2 目标段（§5）残留 ⇒ status 拒（段内 1-based 行号）")
    await batchTool("rec.md").execute({ action: "append", segment: "§2", text: "designer-write" }, { agent: { cwd: dir, _role: "eng-designer" }, depth: 1 })
    assert.ok(readFileSync(abs, "utf8").includes("designer-write"), "F11-C3 同档 §5 占位仍在 ⇒ 写 §2 成功（他段不归本段作者管）")
  })
})

test("F11-C4 模板占位合法暂存：§4 append 含 `<§4 模板占位：…>` 行 ⇒ 成功（枚举只拦死占位）", async () => {
  await withTempDir(async (dir) => {
    const abs = join(dir, "rec.md")
    writeFileSync(abs, record(), "utf8")
    const line = "<§4 模板占位：本批条目 / 关键判据 / 授权口径>"
    await batchTool(null).execute({ action: "append", segment: "§4", text: line, path: "rec.md" }, depth0(dir))
    assert.ok(readFileSync(abs, "utf8").includes(line), "模板占位行原样入段（append 不删行——合法暂存）")
  })
})
