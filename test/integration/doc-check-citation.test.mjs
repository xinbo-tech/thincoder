/**
 * doc-check-citation.test.mjs — 集成用例 7-12（RTM CLI 端故事 7「收口只判本批改过的档」；判据原文 = `test/RTM.md` 第 7 节第 7-12 行）。
 *
 * 机制 = `docs/core/design/DOC-DISCIPLINE.md` §3.25 条目 Y（依据行逐字引文）∥ §5 `A-DD39` ⑩（写段面拒串含 `锚 1 条`——
 * 命中类 `引缺` 归锚不归段）；需求 = `docs/core/requirements/DOC-CHECK.md` F13 ∥ AC-11。
 *
 * 业务入口 = 真 `batch` 工具（`agent-tools/batch.mjs`）的写段轨（子代理 append）——不直调 `runBatchGate`：
 * 本例测的是「写者往档里写错引文、当场被拒」这件事的业务可观察结果（拒 ∥ 放行 + 批档落盘字节）。
 * 错引文写进**本次写入的正文**（不是别人已落盘的档）⇒ 命中落「本次写入文本」标签，拒串才带 `锚 1 条`。
 *
 * 夹具 = 系统临时域（项目根 + 六段批档 + 一档引文来源档；`mkdtempSync`——零落仓、可并发）。
 * 台账重锚经测试缝 `_setLedgerDirForTest` 导向临时目录（不碰真实用户数据目录）。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/doc-check-citation.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
// `ledger.mjs` 走动态导入：静态链入 `node:sqlite`（W8 契约——台账模块的消费侧一律动态取）。
const { _setLedgerDirForTest, _resetLedgerDirForTest } = await import("../../thincoder-core/ledger.mjs")

const BATCH_REL = "docs/batches/fixture.md"
const SRC_REL = "docs/notes/source.md" // 引文来源档（在盘、解析序 ① 可解）
const SRC_BODY = "# 引文来源档\n\n判据句：这一行是引文来源。\n"
const GOOD = "这一行是引文来源。" // 逐字（该档第 3 行的后半句）
const BAD = "这一行是引文之源。" // 改一个字（来源 → 之源）
/** 档头「一段一作者」映射（`batch` create 落骨架时写入）——收口面 `§N（作者：<角色>）` 的唯一来源。 */
const MAPPING = "> 一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）"

const ledgerDir = mkdtempSync(join(tmpdir(), "cite-ledgerdir-"))
_setLedgerDirForTest(ledgerDir)

const projects = []
after(() => {
  _resetLedgerDirForTest()
  // `force` 只忽略 ENOENT、不重试 EPERM/EBUSY：句柄未即释时清理会抛 ⇒ 整档判失败（与判据无关）——给重试窗。
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 子代理（`eng-designer` ⇒ 写 §2），目标是 spawn 绑定的批档（无 path 参数）；触达账空。 */
const asDesigner = batchTool(BATCH_REL)
const designerCtx = (root) => ({ depth: 1, agent: { cwd: root, _role: "eng-designer", _touchedFiles: [], config: { agent: { engineering: true } } } })

/** 六段批档全文（§2/§3/§4/§6 各有内容——与真实骨架同形；本用例只动 §2 段尾）。 */
const record = () => [
  "# 夹具批 · 依据行逐字引文",
  "",
  MAPPING,
  "> 编制：夹具 · 2026-11-03 · 来源 = 集成夹具。",
  "> 台账 = #1（夹具）。前情 = 无（独立批）。",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：进行中",
  "",
  "夹具讨论。",
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "夹具任务。",
  "",
  "## §3 设计评审（评审子代理）",
  "**状态行**：评审通过",
  "",
  "夹具评审。",
  "",
  "## §4 用户批准（主 agent）",
  "夹具批准。",
  "",
  "## §5 实施记录（eng-coder）",
  "夹具实施。",
  "",
  "## §6 验证与收口（父代理）",
  "夹具收口。",
  "",
].join("\n")

/** 夹具项目根（项目声明 + 批档目录 + 引文来源档；不落盘任何真实仓内容）。 */
function makeProject(tag) {
  const root = mkdtempSync(join(tmpdir(), `cite-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/notes"), { recursive: true })
  writeFileSync(join(root, SRC_REL), SRC_BODY)
  writeFileSync(join(root, BATCH_REL), record())
  return root
}

/** 回执 / 拒串里的 verdict 首行（`DOC-CHECK GATE:` 起头的那一行）——逐字断言取它，不取整串。 */
const verdictLineOf = (text) => {
  const line = String(text).split("\n").find((l) => l.startsWith("DOC-CHECK GATE:"))
  assert.ok(line, `应携 verdict 首行，实际：${text}`)
  return line
}

test("7-12 错误 · 写段面本次写入文本引文不逐字 ⇒ 拒（锚 1 条 · ✗ 锚·引缺）、零字节；改逐字后同一笔放行", async () => {
  const root = makeProject("r712")

  // 前置（结构面）：写段门的类属集含 `引缺`——不增则该类被计成段类 `1 处引缺`，与 verdict 行「锚 N 条」相抵。
  const batchGateSrc = readFileSync(new URL("../../thincoder-core/agent-tools/batch-gate.mjs", import.meta.url), "utf8")
  assert.match(batchGateSrc, /const ANCHOR_CLASSES = new Set\(\["档缺", "节缺", "引缺"\]\)/, "锚类集含 `引缺`（源面直读）")

  const before = readFileSync(join(root, BATCH_REL), "utf8")

  await assert.rejects(
    () => asDesigner.execute({ action: "append", segment: "§2", text: `本段依据 ${SRC_REL}「${BAD}」——判据见该档。` }, designerCtx(root)),
    (e) => {
      assert.match(e.message, /文档机检门拒写/, `拒串点名门位：${e.message}`)
      assert.equal(
        verdictLineOf(e.message),
        "DOC-CHECK GATE: REFUSED（命中 1 条——本次写入文本（锚 1 条））",
        `verdict 首行逐字（引缺 归锚不归段）：${e.message}`,
      )
      assert.match(e.message, /✗ 锚·引缺 本次写入文本:1 `docs\/notes\/source\.md`/, `命中行点名本次写入文本与所指档：${e.message}`)
      assert.match(e.message, /（引文不在该档内：「/, `命中行点名引文（读者不必回目标档自己找）：${e.message}`)
      assert.doesNotMatch(e.message, /处引缺/, `不得被计成段类：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), before, "拒写 ⇒ 批档字节逐字不变（零字节落盘）")

  // 引文改成逐字（同一处、同一档）⇒ 同一笔放行；落盘后 §2 段头之前逐字不变
  const landed = `本段依据 ${SRC_REL}「${GOOD}」——判据见该档。`
  const receipt = await asDesigner.execute({ action: "append", segment: "§2", text: landed }, designerCtx(root))
  assert.match(receipt, /appended \d+ characters to §2/, `落盘回执：${receipt}`)
  assert.match(receipt, /DOC-CHECK GATE: PASS/, `落盘时门放行：${receipt}`)
  const after = readFileSync(join(root, BATCH_REL), "utf8")
  assert.ok(after.includes(landed), "本次文本已落盘")
  assert.equal(after.slice(0, after.indexOf("## §2")), before.slice(0, before.indexOf("## §2")), "§2 段头之前逐字不变")
  assert.equal(after.slice(after.indexOf("## §3")), before.slice(before.indexOf("## §3")), "§3 之后逐字不变")
})
