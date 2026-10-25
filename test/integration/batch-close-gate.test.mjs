/**
 * batch-close-gate.test.mjs — 集成用例 7-1 / 7-2 / 7-3（RTM CLI 端故事 7「收口只判本批改过的档」；
 * 判据原文 = `test/RTM.md` 第 7 节；机制 = `docs/core/design/DOC-DISCIPLINE.md` §3.20「② 的范围」）。
 *
 * 业务入口 = 真 `batch` 工具（`agent-tools/batch.mjs`）的 depth-0 `close` 轨——不直调 `runBatchGate`：
 * 本档要的是「收口这件事」的业务可观察结果（放行 ∥ 拒绝、回执行、§1 状态行落没落盘）。
 * 断言面 = 工具回执文本 + §1 状态行落盘字节（档全文逐字比较）。
 *
 * 笔域集（每例以两档干净档为底——7-3 再加一档含悬空指针的档）两条腿都做实：触达账（`agent._touchedFiles`）与提交 diff
 * （批档 §1 的 `批起 sha = <sha>` 记入行 ⇒ `git diff --name-only <sha> HEAD`）。每例先实读 diff 腿自证，
 * 否则「范围 N 档」只是空转读数。
 *
 * 夹具 = 系统临时域（项目根 + 真 git 仓 + 六段批档；`mkdtempSync`——零落仓、可并发）。收口后的台账重锚
 * 经测试缝 `_setLedgerDirForTest` 导向临时目录（不碰真实用户数据目录）。
 * RTM 的「同一夹具」= 同一夹具形：每例各自独立起一份，用例之间不依赖执行序。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-close-gate.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { runDocCheck } from "../../thincoder-core/doc-check/index.mjs"
// `ledger.mjs` 走动态导入：静态链入 `node:sqlite`（W8 契约——台账模块的消费侧一律动态取）。
const { _setLedgerDirForTest, _resetLedgerDirForTest } = await import("../../thincoder-core/ledger.mjs")

const BATCH_REL = "docs/batches/fixture.md"
const CLEAN_A = "docs/notes/clean-a.md"
const CLEAN_B = "docs/notes/clean-b.md"
const OUT_REL = "docs/notes/out-of-range.md" // 工作树内、范围外（不在触达账 ∧ 不在提交 diff）
const DIRTY_REL = "docs/notes/dirty.md" // 笔域集内、含悬空指针

const CLEAN = "# 干净档\n\n无指针。\n"
const DIRTY = "# 脏档\n\n见 `docs/notes/missing-page.md`。\n" // 恰一条 锚·档缺

/** 台账库目录（临时域——收口重锚不落真实用户目录）。 */
const ledgerDir = mkdtempSync(join(tmpdir(), "bcg-ledgerdir-"))
_setLedgerDirForTest(ledgerDir)

/** depth-0 主 agent（`batch` 工具的 close 轨仅此身份放行）；`touched` = 父侧触达账。 */
const parentCtx = (root, touched) => ({ depth: 0, agent: { cwd: root, _touchedFiles: touched, config: { agent: { engineering: true } } } })
const depth0 = batchTool(null)

const projects = []

after(() => {
  _resetLedgerDirForTest()
  // `force` 只忽略 ENOENT、不重试 EPERM/EBUSY；临时仓带 `.git`，句柄未即释时清理会抛
  // ⇒ 三例全绿却整档判失败（失败面与判据无关）——故给重试窗。
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 六段批档全文（`sha` ⇒ §1 落 `批起 sha = <sha>` 记入行；§2/§3/§4/§6 各有内容——close 的链门前置）。 */
const record = (sha) => [
  "# 夹具批 · 收口门范围",
  "",
  "> 编制：夹具 · 2026-10-25 · 来源 = 集成夹具。",
  "> 台账 = #1（夹具）。前情 = 无（独立批）。",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中",
  "",
  "夹具讨论。",
  "",
  `**批起 sha = ${sha}**`,
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "夹具任务。",
  "",
  "## §3 设计评审（评审子代理）",
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

/** 夹具项目根（项目声明 + 批档/文档目录；不落盘任何真实仓内容）。 */
function makeProject(tag) {
  const root = mkdtempSync(join(tmpdir(), `bcg-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/notes"), { recursive: true })
  return root
}

/**
 * 真 git 仓：空基提交 → 取基 sha → 写批档（§1 记入基 sha）+ 本批两档 → 提交。
 * 于是提交 diff 腿恒 = 批档（由 selfKey 过滤）＋ `CLEAN_A` ＋ `CLEAN_B`；触达账按例各自给
 * （7-1 一档 · 7-2 两档 · 7-3 两干净档＋脏档）。
 */
function gitRepo(root) {
  git(root, "init", "-q")
  commit(root, "base")
  const sha = rev(root)
  writeFileSync(join(root, BATCH_REL), record(sha))
  writeFileSync(join(root, CLEAN_A), CLEAN)
  writeFileSync(join(root, CLEAN_B), CLEAN)
  commit(root, "本批两档 + 批档")
  return sha
}

/** git 封装（`core.quotepath=false` 与受测实现同款——不关此开关时非 ASCII 档名会被引号转义，静默掉出清单）。 */
const git = (cwd, ...argv) => execFileSync("git", [
  "-C", cwd, "-c", "user.email=fixture@example.test", "-c", "user.name=fixture",
  "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", "-c", "core.quotepath=false", ...argv,
], { encoding: "utf8" })
const commit = (cwd, message) => { git(cwd, "add", "-A"); git(cwd, "commit", "-q", "-m", message) }
const rev = (cwd) => git(cwd, "rev-parse", "HEAD").trim()

/** 提交 diff 腿实读（本批 `.md`、批档自身除外——判定面同款过滤：批档不是判据对象）。 */
const diffDocs = (root, sha) => git(root, "diff", "--name-only", sha, "HEAD")
  .split("\n").map((s) => s.trim())
  .filter((f) => f.endsWith(".md") && f !== BATCH_REL)
  .sort()

/** 回执里的 **gate 段首行**（`[doc-check gate] <verdict> · 范围 N 档`）——RTM 那句「回执首行
 *  `DOC-CHECK GATE: …`」指的是本段首行，不是整条 close 回执的首行（后者是 `batch: §1 status line → …` 状态句）。 */
const gateLineOf = (receipt) => {
  const line = receipt.split("\n").find((l) => l.startsWith("[doc-check gate] "))
  assert.ok(line, `回执应携 gate 行，实际回执：${receipt}`)
  return line
}

/** §1 状态行原文（拒收口 ⇒ 逐字不变；放行 ⇒ 已收口）。 */
const statusLineOf = (root) => readFileSync(join(root, BATCH_REL), "utf8").split("\n").find((l) => l.startsWith("**状态行**："))

/** 例前置：提交 diff 腿实读 = 本批两档（否则「范围 N 档」只是空转读数）。 */
function assertBatchCommitted(root, sha) {
  assert.deepEqual(diffDocs(root, sha), [CLEAN_A, CLEAN_B], "提交 diff 腿应恰含本批两档（批档自身由 selfKey 过滤）")
}

test('7-1 正常 · 笔域集内各档零命中 ⇒ 收口放行、回执 DOC-CHECK GATE: PASS、范围行档数 = 笔域集档数', async () => {
  const root = makeProject("r71")
  const sha = gitRepo(root)
  assertBatchCommitted(root, sha)

  // 触达账只落 1 档、提交 diff 2 档 ⇒ 笔域集 = 并集 2 档：「范围 2 档」因此能证明 diff 腿参与
  //（若 diff 腿失效、仅触达账入判，范围会掉成 1 档）。
  const receipt = await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, [join(root, CLEAN_A)]))

  assert.equal(gateLineOf(receipt), "[doc-check gate] DOC-CHECK GATE: PASS · 范围 2 档", `PASS 且范围 = 笔域集 2 档：${receipt}`)
  assert.match(receipt, /^batch: §1 status line → 「已收口 \d{4}-\d{2}-\d{2}」/, `收口放行且落盘：${receipt}`)
  assert.doesNotMatch(receipt, /基 sha 未定/, "§1 记入行在盘 ⇒ 取到基，无该明示行")
  assert.match(statusLineOf(root), /已收口/, "§1 状态行已写「已收口」")
})

test('7-2 边界 · 工作树内范围外脏档 ⇒ 不入判、收口放行、回执零该档行', async () => {
  const root = makeProject("r72")
  const sha = gitRepo(root)
  assertBatchCommitted(root, sha)
  writeFileSync(join(root, OUT_REL), DIRTY) // 工作树内、两腿都不含（未提交 ∧ 未触达）

  // 前置：这档确实脏（含悬空指针）——否则本例空转，什么都证明不了
  const probe = runDocCheck(root, { mode: "gate", docs: [join(root, OUT_REL)], docsSource: "explicit" })
  assert.ok(probe.anchorHits.length >= 1, `前置：范围外档须真含悬空指针 —— ${probe.report}`)

  const receipt = await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, [join(root, CLEAN_A), join(root, CLEAN_B)]))

  assert.equal(gateLineOf(receipt), "[doc-check gate] DOC-CHECK GATE: PASS · 范围 2 档", `范围外档不入判、档数不变：${receipt}`)
  assert.doesNotMatch(receipt, /out-of-range/, `回执零该档行（连档名都不出现）：${receipt}`)
  assert.doesNotMatch(receipt, /missing-page/, `回执零该档的命中行：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "收口放行且落盘")
})

test('7-3 错误 · 笔域集内一档含悬空指针 ⇒ 收口被拒（throw）、§1 状态行字节不变', async () => {
  const root = makeProject("r73")
  const sha = gitRepo(root)
  assertBatchCommitted(root, sha)
  writeFileSync(join(root, DIRTY_REL), DIRTY) // 笔域集内（提交 diff 腿 + 触达账都含它）
  commit(root, "本批脏档")
  const before = readFileSync(join(root, BATCH_REL), "utf8")

  await assert.rejects(
    () => depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, [join(root, CLEAN_A), join(root, CLEAN_B), join(root, DIRTY_REL)])),
    (e) => {
      assert.match(e.message, /文档机检门拒收口/, `拒串点名门位：${e.message}`)
      assert.match(e.message, /DOC-CHECK GATE: REFUSED（命中 1 条）/, `拒串携 verdict 首行：${e.message}`)
      assert.match(e.message, /✗ 锚·档缺 docs\/notes\/dirty\.md:\d+/, `拒串点名该档与命中行：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), before, "拒收口 ⇒ 档全文逐字不变（§1 状态行字节不变）")
  assert.match(statusLineOf(root), /进行中/, "§1 状态行仍「进行中」")
})
