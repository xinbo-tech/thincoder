/**
 * 2026-10-26-pen-gate-batch-scope.test.mjs — 当批单测件（批档 = `docs/batches/2026-10-26-pen-gate-batch-scope.md` §2）：
 * 凭证带批次（E1）+ 收口自动消费（E2）。权威 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10
 * （用例表 U-BG1–U-BG15；A1–A6 回指见同节「验收」）。U-BG11 = 旁列读失败 ⇒ close 拒；U-BG12 ∥ U-BG13 =
 * 反向守卫（「没有」≠「读不到」：无槽文件 ∥ 无该字段 ⇒ 空集，close 照常收口——评审轮次 3 🟡13）；
 * U-BG14 = manifest 层同判（`_slot` 未钉时）：manifest 在盘但损坏 ⇒ close 拒，manifest 不存在 ⇒ 合法缺省；
 * U-BG15 = 同层反向（manifest「读到了，说没有」）：在盘且合法但 `active` 缺席 ⇒ 无槽号 ⇒ 零消费、close 照常收口。
 *
 * 复跑（cwd = `d:\teamcode\thincoder`；无 git 的树同样可跑——U-BG9 是内容判据，不靠 `git diff`）：
 *   `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs`
 * 生命周期：随批档留存（不进 `test/` 收集面——收口即删）。
 * 面界（如实）：U-BG10 是**合并规则面**（纯函数）——保存路径的接线不在本批受影响文件面（设计档 §10
 * 受影响表无 `session.mjs` / 端面档），故「忙时保存不写丢归属」的端到端证据不在本档；收口回指见
 * 批档 §5 实施记录的上抛项。
 *
 * 夹具 = 系统临时域：每例独立项目根（`PROJECT-MANIFEST.json` + 六段批档 + 一份设计档）与独立
 * sessions 根（`_setSessionsDirForTest`——槽文件不落真实用户目录）；台账库同法
 * （`_setLedgerDirForTest`——收口重锚不落真实用户目录）。槽文件按 cwd 哈希分档 ⇒ 例间零互染。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { batchAbsPath, batchPathKey, executeDesignSlotsAction } from "../../thincoder-core/agent-tools/design-slots.mjs"
import { settleDesignReview } from "../../thincoder-core/agent-tools/design-token.mjs"
import { docSetKey } from "../../thincoder-core/agent-tools/review-facts.mjs"
import { mergeEngTokenBatchesForSave } from "../../thincoder-core/session-slot-write.mjs"
import { persistEngTokens, readEngTokenBatchesFromSlot, restoreEngTokens, tokenExpiryMs } from "../../thincoder-core/token-ttl.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, manifestPath, slotPath } from "../../thincoder-core/session-slots.mjs"
// 台账模块静态链入 `node:sqlite`（W8 契约）——消费侧一律动态取。
const { _resetLedgerDirForTest, _setLedgerDirForTest } = await import("../../thincoder-core/ledger.mjs")

const BATCH_REL = "docs/batches/fixture.md"
const OTHER_BATCH_REL = "docs/batches/other.md"
const DESIGN_REL = "docs/core/design/DESIGN-FIXTURE.md"

const ID_A = "design-a"
const ID_B = "design-b"
const ID_C = "design-c"
const ID_OLD = "design-old"

/** 合法 token 值形 `<uuid>:<expiresAt>`（uuid 段 = 8-4-4-4-12 位十六进制；1 小时有效期）。 */
const mkToken = (digit) => `${String(digit).repeat(8)}-${String(digit).repeat(4)}-${String(digit).repeat(4)}-${String(digit).repeat(4)}-${String(digit).repeat(12)}:${Date.now() + 3600 * 1000}`

/** 六段批档（§2/§3/§4/§6 各有内容 = close 链门前置；§1 = 进行中；不记 `批起 sha` ⇒ 收口门只认触达账）。 */
const recordText = () => [
  "# 夹具批 · 凭证带批次",
  "",
  "> 编制：夹具 · 2026-10-26 · 来源 = 当批单测。",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中",
  "",
  "夹具讨论。",
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

const sessionsDir = mkdtempSync(join(tmpdir(), "bgt-sessions-"))
const ledgerDir = mkdtempSync(join(tmpdir(), "bgt-ledger-"))
_setSessionsDirForTest(sessionsDir)
_setLedgerDirForTest(ledgerDir)

const projects = []
after(() => {
  _resetSessionsDirForTest()
  _resetLedgerDirForTest()
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(sessionsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 项目夹具（项目声明 + 两份批档 + 一份设计档）。 */
function makeProject(tag) {
  const root = mkdtempSync(join(tmpdir(), `bgt-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/core/design"), { recursive: true })
  writeFileSync(join(root, BATCH_REL), recordText())
  writeFileSync(join(root, OTHER_BATCH_REL), recordText())
  writeFileSync(join(root, DESIGN_REL), "# 设计夹具\n\n夹具正文。\n")
  return root
}

/** depth-0 主 agent 对象（`batch` 工具的 close/status 轨仅此身份放行；槽状态图挂同一对象上）。 */
const makeAgent = (root, { engineering = true, slot = 1 } = {}) => ({
  cwd: root,
  _slot: slot,
  _sessionStart: "2026-10-26T00:00:00.000Z",
  _touchedFiles: [],
  config: { agent: { engineering } },
})

const ctxOf = (agent) => ({ depth: 0, agent })
const tool = batchTool(null)
const slotFileOf = (agent) => slotPath(agent.cwd, agent._slot)
const readSlot = (agent) => JSON.parse(readFileSync(slotFileOf(agent), "utf8"))
const writeSlot = (agent, data) => writeFileSync(slotFileOf(agent), JSON.stringify(data), "utf8")
const statusLineOf = (root, rel = BATCH_REL) => readFileSync(join(root, rel), "utf8").split("\n").find((l) => l.startsWith("**状态行**："))
/** 批档绝对路径（收口目标与旁列值两侧均为此形）。 */
const absBatch = (root, rel = BATCH_REL) => resolve(root, rel)

/**
 * 跑一次真 settle（E1 唯一写点）：评审文档集（项目根相对形，与生产 `documents` 同写法）⇒
 * `docSetKey` ⇒ 槽 + 批归属旁列；`persistEngTokens` = 调用方（`settleAdvisorRun`）的当场落盘同调。
 */
function settle(agent, { root, designId, docs, token }) {
  const run = { designId, docSetKey: docSetKey(docs, root), open: true }
  const settled = settleDesignReview(agent, run, token, `评审正文\n[DESIGN-TOKEN: ${token}]\n\nVERDICT: pass`)
  assert.equal(settled.passed, true, `前置：评审应结算通过（回显 + 裁定行齐）— ${settled.output}`)
  persistEngTokens(agent)
  return run
}

/** 只往槽文件塞一枚槽（模拟「旁列启用前签发的旧槽」——无批归属行）。 */
function seedLooseSlot(agent, token) {
  const data = readSlot(agent)
  data.engDesignTokens = { ...(data.engDesignTokens ?? {}), [ID_OLD]: token }
  writeSlot(agent, data)
}

test("U-BG1 正常 · settle 记下批归属（批档绝对路径）、token 值形仍两段、跨重启可读", () => {
  const root = makeProject("bg1")
  const agent = makeAgent(root)
  const token = mkToken(1)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token })

  assert.equal(batchPathKey(agent._engDesignTokenBatches.get(ID_A)), batchPathKey(absBatch(root)), "归属 = 批档绝对路径")
  assert.equal(agent._engDesignTokens.get(ID_A), token, "槽值 = settle 的 token 原串")
  assert.equal(token.split(":").length, 2, "token 值形零改（仍 `<uuid>:<expiryMs>` 两段）")
  assert.notEqual(tokenExpiryMs(token), null, "两段形 ⇒ tokenExpiryMs 可判（三段值形会令全部槽失效）")

  const disk = readSlot(agent)
  assert.equal(batchPathKey(disk.engDesignTokenBatches[ID_A]), batchPathKey(absBatch(root)), "旁列随 D1 当场落盘")
  assert.equal(disk.engDesignTokens[ID_A], token)

  assert.match(executeDesignSlotsAction({}, { agent }), new RegExp(`designId=${ID_A} .*batch=fixture\\.md `), "清点「批」列读旁列")

  const fresh = makeAgent(root) // 模拟重启：内存空、盘上有
  restoreEngTokens(fresh, disk)
  assert.equal(batchPathKey(fresh._engDesignTokenBatches.get(ID_A)), batchPathKey(absBatch(root)), "restore 同拍读入旁列")
  assert.equal(batchPathKey(readEngTokenBatchesFromSlot(fresh)[ID_A]), batchPathKey(absBatch(root)), "轻读兄弟可读")
})

test("U-BG2 正常 · close 消费本批全部槽、回执点名枚数、§1 已收口", async () => {
  const root = makeProject("bg2")
  const agent = makeAgent(root)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token: mkToken(2) })

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 1 枚 · 留槽无归属 0 枚/, `回执点名消费枚数：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "§1 → 已收口")
  assert.equal(readSlot(agent).engDesignTokens, undefined, "该批槽已移出槽文件（空表 ⇒ 字段删）")
  assert.equal(agent._engDesignTokens.size, 0, "内存槽同拍清空")
})

test("U-BG3 边界 · 同批两枚（评审 + 修轮）一次 close 全消费；它批零动", async () => {
  const root = makeProject("bg3")
  const agent = makeAgent(root)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token: mkToken(3) })
  settle(agent, { root, designId: ID_B, docs: [BATCH_REL], token: mkToken(4) })
  const otherToken = mkToken(5)
  settle(agent, { root, designId: ID_C, docs: [OTHER_BATCH_REL, DESIGN_REL], token: otherToken })

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 2 枚/, `同批两枚一次消费：${receipt}`)
  const disk = readSlot(agent)
  assert.deepEqual(Object.keys(disk.engDesignTokens ?? {}), [ID_C], "本批两枚已移出，它批一枚仍在盘")
  assert.equal(disk.engDesignTokens[ID_C], otherToken, "它批槽值零动")
})

test("U-BG4 边界 · 旧槽（无旁列）不被消费、回执点名无归属枚数、槽仍在盘", async () => {
  const root = makeProject("bg4")
  const agent = makeAgent(root)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token: mkToken(6) })
  const loose = mkToken(7)
  seedLooseSlot(agent, loose)

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 1 枚 · 留槽无归属 1 枚/, `无归属枚数点名：${receipt}`)
  const disk = readSlot(agent)
  assert.equal(disk.engDesignTokens[ID_OLD], loose, "旧槽零触（不猜归属 ⇒ 不消费）")
  assert.equal(disk.engDesignTokens[ID_A], undefined, "本批槽照常消费")
})

test("U-BG5 错误 · 消费落盘失败 ⇒ close 被拒（§1 字节不变）、内存回滚、可重试", async () => {
  const root = makeProject("bg5")
  const agent = makeAgent(root)
  const token = mkToken(8)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token })
  const before = readFileSync(join(root, BATCH_REL), "utf8")
  // 注入：`writeSessionFile` 的临时名 ${p}.tmp 被占成目录 ⇒ persistEngTokens 写盘必抛（确定性、跨平台）
  const tmpBlocker = `${slotFileOf(agent)}.tmp`
  mkdirSync(tmpBlocker)

  await assert.rejects(
    () => tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent)),
    (e) => {
      assert.match(e.message, /consume-design: 1 slot\(s\) were removed in memory but could NOT be durably deleted/, `拒因 = 消费核原串：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), before, "close 被拒 ⇒ 档全文逐字不变（§1 状态行字节不变）")
  assert.equal(agent._engDesignTokens.get(ID_A), token, "内存槽整体回滚（可重试）")
  assert.equal(readSlot(agent).engDesignTokens[ID_A], token, "槽仍在盘")

  rmSync(tmpBlocker, { recursive: true, force: true })
  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 1 枚/, `重试即收口：${receipt}`)
  assert.equal(readSlot(agent).engDesignTokens, undefined)
})

test("U-BG6 边界 · status 写 §1「已收口」（第二通路）与 close 同效消费", async () => {
  const root = makeProject("bg6")
  const agent = makeAgent(root)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token: mkToken(9) })

  const receipt = await tool.execute({ action: "status", value: "已收口", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 1 枚/, `第二通路同样消费：${receipt}`)
  assert.match(statusLineOf(root), /已收口/)
  assert.equal(readSlot(agent).engDesignTokens, undefined, "槽已移出槽文件")
})

test("U-BG7 边界 · 普通模式批收口 ⇒ no-op、不报错、无 [design tokens] 段", async () => {
  const root = makeProject("bg7")
  const agent = makeAgent(root, { engineering: false })
  const token = mkToken(1)
  writeSlot(agent, {
    version: 2, cwd: root, sessionStart: agent._sessionStart,
    engDesignTokens: { [ID_A]: token },
    engDesignTokenBatches: { [ID_A]: absBatch(root) },
  })

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /^batch: §1 status line → 「已收口/, `普通模式照常收口：${receipt}`)
  assert.doesNotMatch(receipt, /\[design tokens\]/, `普通模式 no-op ⇒ 回执无该段：${receipt}`)
  assert.equal(readSlot(agent).engDesignTokens[ID_A], token, "零消费（普通模式批无设计槽）")
})

test("U-BG8 边界 · 评审文档集不含（或含多份）批档 ⇒ 旁列无该条目、清点「批」列 = —（不猜）", () => {
  const root = makeProject("bg8")
  const agent = makeAgent(root)
  settle(agent, { root, designId: ID_A, docs: [DESIGN_REL], token: mkToken(2) })

  assert.equal(agent._engDesignTokenBatches, undefined, "无批档 ⇒ 内存无旁列")
  assert.equal(readSlot(agent).engDesignTokenBatches, undefined, "无批档 ⇒ 盘上无该字段")
  const line = executeDesignSlotsAction({}, { agent }).split("\n").find((l) => l.startsWith(`- designId=${ID_A} `))
  assert.ok(line, "清点面应有该槽行")
  assert.match(line, / batch=— /, `批列如实降级：${line}`)

  // 派生直测（含归属不唯一的拒猜面）
  const batchAbs = absBatch(root)
  assert.equal(batchAbsPath(JSON.stringify([batchAbs, absBatch(root, DESIGN_REL)])), batchAbs, "单份批档 ⇒ 该档绝对路径")
  assert.equal(batchAbsPath(JSON.stringify([batchAbs, absBatch(root, OTHER_BATCH_REL)])), null, "多份不同批档 ⇒ 归属不唯一 ⇒ 不猜")
  assert.equal(batchAbsPath("not json"), null, "不可解析 ⇒ null")
  // 同一实例的 settle 面：文档集含两份批档 ⇒ 不归属任一份（错归属 = 收口消费别批授权）
  const ambiguous = makeAgent(root, { slot: 2 })
  settle(ambiguous, { root, designId: ID_B, docs: [BATCH_REL, OTHER_BATCH_REL], token: mkToken(3) })
  assert.equal(ambiguous._engDesignTokenBatches, undefined, "多份批档 ⇒ 归属 = 无（不猜）")
})

test("U-BG9 机检 · 四段判据文本逐字不变（不靠 git）", () => {
  // 期望串 = 改动前快照（写死在测试里；判据 = 内容比对，无 git 的树里同样可跑）
  const EXPECT = {
    "thincoder-core/agent/dispatch.mjs": {
      anchor: "if (agent.config?.agent?.engineering && depth === 0",
      lines: 4,
      text: "    if (agent.config?.agent?.engineering && depth === 0\n        && !anyLiveDesignSlot(agent)\n        && FILE_MUTATORS.has(toolCall.name)\n        && !(await lightRoundOpen(agent))) {",
    },
    "thincoder-core/token-ttl.mjs": {
      anchor: "export function anyLiveDesignSlot(agent) {",
      lines: 12,
      text: 'export function anyLiveDesignSlot(agent) {\n  const live = (m) => {\n    for (const t of m.values()) {\n      if (typeof t === "string" && tokenExpiryMs(t) !== null && !tokenExpired(t)) return true\n    }\n    return false\n  }\n  const m = agent?._engDesignTokens\n  if (m instanceof Map && live(m)) return true\n  const rec = reconcileEngTokensFromSlot(agent)\n  return rec instanceof Map && live(rec)\n}',
    },
    "thincoder-core/agent-tools/design-token.mjs": {
      anchor: "const TOKEN_TTL_DEFAULT_MS =",
      lines: 1,
      text: "const TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000 // 7-day ceiling (v2 2026-08-25)",
    },
    "thincoder-core/agent-tools/design-slots.mjs": {
      anchor: "if (selectors.length > 1) {",
      lines: 3,
      text: '  if (selectors.length > 1) {\n    throw new Error(`consume-design: pass exactly ONE selector — designId / designIds / expired / olderThanDays (got: ${selectors.join(" + ")}); a batch consume never guesses its target set.`)\n  }',
    },
  }
  const repoRoot = resolve(import.meta.dirname, "../..")
  for (const [file, e] of Object.entries(EXPECT)) {
    const lines = readFileSync(join(repoRoot, file), "utf8").replace(/\r\n/g, "\n").split("\n")
    const i = lines.findIndex((l) => l.includes(e.anchor))
    assert.ok(i >= 0, `锚句应在位：${file} — ${e.anchor}`)
    assert.equal(lines.slice(i, i + e.lines).join("\n"), e.text, `判据文本逐字不变：${file}`)
  }
})

test("U-BG10 边界（合并）· 忙时保存不写丢归属（槽独有项保留、同 key 新写者胜）", () => {
  const batch1 = absBatch("C:/p1")
  const batch2 = absBatch("C:/p2")
  assert.deepEqual(mergeEngTokenBatchesForSave(undefined, { [ID_A]: batch1 }), { [ID_A]: batch1 }, "未携该字段 ⇒ 保留槽值（忙时保存的缺席 ≠ 删除）")
  assert.deepEqual(mergeEngTokenBatchesForSave({}, { [ID_A]: batch1 }), { [ID_A]: batch1 }, "空快照 ⇒ 槽值保留")
  assert.deepEqual(mergeEngTokenBatchesForSave({ [ID_B]: batch2 }, { [ID_A]: batch1 }), { [ID_A]: batch1, [ID_B]: batch2 }, "并集：槽独有项保留")
  assert.deepEqual(mergeEngTokenBatchesForSave({ [ID_A]: batch2 }, { [ID_A]: batch1 }), { [ID_A]: batch2 }, "同 key 冲突 ⇒ 新写者胜")
  assert.equal(mergeEngTokenBatchesForSave({}, null), null, "两端皆空 ⇒ null（写 null = 清字段）")
})

test("U-BG11 错误 · 槽文件在盘但读不到 ⇒ close 被拒（§1 字节不变）、零消费、可重试", async () => {
  const root = makeProject("bg11")
  const agent = makeAgent(root)
  settle(agent, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token: mkToken(4) })
  const recordBefore = readFileSync(join(root, BATCH_REL), "utf8")
  const good = readFileSync(slotFileOf(agent), "utf8")
  const corrupt = good.slice(0, Math.floor(good.length / 2)) // 截断 ⇒ JSON.parse 必失败（文件在盘）
  writeFileSync(slotFileOf(agent), corrupt, "utf8")

  await assert.rejects(
    () => tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent)),
    (e) => {
      assert.match(e.message, /batch-attribution side column could NOT be read/, `拒因点名旁列读失败：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), recordBefore, "close 被拒 ⇒ 档全文逐字不变（§1 状态行字节不变）")
  assert.equal(readFileSync(slotFileOf(agent), "utf8"), corrupt, "槽文件字节不变（零消费）")

  // 可重试：槽文件恢复可读后，同一次 close 正常收口
  writeFileSync(slotFileOf(agent), good, "utf8")
  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 1 枚/, `修复后重试即收口：${receipt}`)
  assert.equal(readSlot(agent).engDesignTokens, undefined, "重试后本批槽已移出槽文件")

  // 第二支：非 ENOENT 的 I/O 错同样不许当「不存在」（existsSync 兜底会把它吞成空集）
  const rootIo = makeProject("bg11io")
  const agentIo = makeAgent(rootIo)
  settle(agentIo, { root: rootIo, designId: ID_B, docs: [BATCH_REL, DESIGN_REL], token: mkToken(5) })
  const ioRecordBefore = readFileSync(join(rootIo, BATCH_REL), "utf8")
  rmSync(slotFileOf(agentIo))
  mkdirSync(slotFileOf(agentIo)) // 文件位换成目录 ⇒ readFileSync 抛 EISDIR（code ≠ ENOENT）
  await assert.rejects(
    () => tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agentIo)),
    (e) => {
      assert.match(e.message, /could NOT be read/, `I/O 错也拒：${e.message}`)
      // 语义判据（不钉宿主错误码）：非 ENOENT 的 I/O 错不得被降级成「没有」（existsSync 兜底就会）
      assert.doesNotMatch(e.message, /ENOENT/, `非 ENOENT 的 I/O 错不得判成「文件不存在」：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(rootIo, BATCH_REL), "utf8"), ioRecordBefore, "I/O 错 ⇒ 档全文逐字不变")
})

test("U-BG12 边界 · 干净会话（无槽文件）⇒ close 照常收口（「没有」≠「读不到」）", async () => {
  const root = makeProject("bg12")
  const agent = makeAgent(root)
  assert.equal(existsSync(slotFileOf(agent)), false, "前置：干净会话无槽文件（ENOENT 合法缺省）")

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /^batch: §1 status line → 「已收口/, `strict 读不得把「没有」判成「读不到」：${receipt}`)
  assert.match(receipt, /\[design tokens\] 消费 0 枚 · 留槽无归属 0 枚/, `空集 ⇒ no-op：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "§1 → 已收口")
  assert.equal(existsSync(slotFileOf(agent)), false, "消费步 no-op ⇒ 不铸槽文件（零写）")
})

test("U-BG13 边界 · 槽文件在盘但无批归属字段（旧槽形）⇒ 空集、不抛、旧槽零消费", async () => {
  const root = makeProject("bg13")
  const agent = makeAgent(root)
  const loose = mkToken(6)
  writeSlot(agent, {
    version: 2, cwd: root, sessionStart: agent._sessionStart,
    engDesignTokens: { [ID_OLD]: loose }, // 旁列启用前签发的槽形：有槽表、无 engDesignTokenBatches
  })

  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 0 枚 · 留槽无归属 1 枚/, `无该字段 = 空集（不抛）：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "§1 → 已收口")
  const disk = readSlot(agent)
  assert.equal(disk.engDesignTokens[ID_OLD], loose, "旧槽零消费（不猜归属）")
  assert.equal(disk.engDesignTokenBatches, undefined, "零写：不凭空铸旁列")
})

test("U-BG14 错误（manifest 层）· manifest 在盘但读不到 ⇒ close 被拒；manifest 不存在 ⇒ 合法缺省照常收口", async () => {
  // 前置：`_slot` 未钉（null）⇒ 槽号由 manifest 的 `active` 解析——strict 形 manifest 读的唯一触发面
  const root = makeProject("bg14")
  const seeder = makeAgent(root) // 钉槽 1：settle 当场落盘（产物 = 槽文件 + manifest 摘要行）
  settle(seeder, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token: mkToken(7) })
  const manifestFile = manifestPath(root)
  const goodManifest = JSON.stringify({ ...JSON.parse(readFileSync(manifestFile, "utf8")), active: 1 })
  writeFileSync(manifestFile, goodManifest, "utf8")

  const agent = makeAgent(root, { slot: null }) // 槽号走 manifest（同一会话重启后的形态）
  restoreEngTokens(agent, readSlot(seeder))
  const recordBefore = readFileSync(join(root, BATCH_REL), "utf8")
  const slotBefore = readFileSync(slotFileOf(seeder), "utf8")
  writeFileSync(manifestFile, goodManifest.slice(0, -1), "utf8") // 在盘但缺尾部 `}` ⇒ 解析失败（≠ ENOENT；与长度无关）

  await assert.rejects(
    () => tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent)),
    (e) => {
      assert.match(e.message, /session manifest could NOT be read/, `拒因点名 manifest 读失败：${e.message}`)
      // 拒因坐标归 manifest 层：槽号解析在旁列读的 try 之外 ⇒ 不得被重包成「旁列读不到」
      assert.doesNotMatch(e.message, /batch-attribution side column/, `manifest 层拒因不得被重包成旁列读失败：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), recordBefore, "close 被拒 ⇒ 档全文逐字不变（§1 状态行字节不变）")
  assert.equal(readFileSync(slotFileOf(seeder), "utf8"), slotBefore, "零消费（槽文件字节不变）")

  // 可重试：manifest 修复后同一 close 成功，本批槽照常消费
  writeFileSync(manifestFile, goodManifest, "utf8")
  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /\[design tokens\] 消费 1 枚/, `manifest 修复后重试即收口：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "§1 → 已收口")
  assert.equal(readSlot(seeder).engDesignTokens, undefined, "本批槽已移出槽文件")

  // 第二支：manifest 不存在（干净会话）= 无槽号（合法缺省——「没有」≠「读不到」，与 U-BG12 同判）
  const root2 = makeProject("bg14b")
  const clean = makeAgent(root2, { slot: null })
  assert.equal(existsSync(manifestPath(root2)), false, "前置：干净会话无会话 manifest（≠ 在盘损坏）")
  const receipt2 = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(clean))
  assert.match(receipt2, /^batch: §1 status line → 「已收口/, `manifest 不存在不得判成「读不到」：${receipt2}`)
  assert.match(receipt2, /\[design tokens\] 消费 0 枚 · 留槽无归属 0 枚/, `无槽号 = 空集 ⇒ no-op：${receipt2}`)
  assert.match(statusLineOf(root2), /已收口/, "§1 → 已收口")
  assert.equal(existsSync(manifestPath(root2)), false, "零写：收口 no-op 不铸 manifest")
})

test("U-BG15 边界（manifest 层）· manifest 合法但 active 缺席 ⇒ 无槽号 = 空集、close 照常收口、零消费", async () => {
  const root = makeProject("bg15")
  const seeder = makeAgent(root) // 钉槽 1：settle 当场落盘（槽文件 + manifest 摘要行）
  const token = mkToken(8)
  settle(seeder, { root, designId: ID_A, docs: [BATCH_REL, DESIGN_REL], token })
  // 多点位夹具：带同批旁列的槽同时摆在槽 0 / 1 / 2——「无 active」被错猜成这三个槽号之一都会消费
  // （猜成其它号时该槽位无文件 ⇒ 空集，本条不判——判别范围就是这三个号）。槽 1 由 settle 落盘，
  // 0 / 2 直接补同形记录。
  for (const n of [0, 2]) {
    writeFileSync(slotPath(root, n), JSON.stringify({
      version: 2, cwd: root, sessionStart: seeder._sessionStart,
      engDesignTokens: { [ID_A]: token },
      engDesignTokenBatches: { [ID_A]: absBatch(root) },
    }), "utf8")
  }
  const slotFiles = [0, 1, 2].map((n) => slotPath(root, n))
  const slotsBefore = slotFiles.map((f) => readFileSync(f, "utf8"))

  // 夹具 = manifest 在盘、可解析，仅 `active` 缺席（「读到了，说没有」；`active: null` 走同一行）
  // ——与 U-BG14 支①（在盘损坏 ⇒ close 拒）合起来锁住「合法但无 active」与「坏文件」的分界。
  // `active` 先钉上再删：settle 走钉槽面（`_slot` 已给）⇒ `saveManifest` 不写该键，不先钉就等于
  // 「从未有过」而非「有过又缺」，夹具叙述与实际不符。
  const manifestFile = manifestPath(root)
  const withActive = { ...JSON.parse(readFileSync(manifestFile, "utf8")), active: 1 }
  writeFileSync(manifestFile, JSON.stringify(withActive, null, 2), "utf8")
  assert.equal(JSON.parse(readFileSync(manifestFile, "utf8")).active, 1, "前置：manifest 里先有 active（下面才谈「缺席」）")
  delete withActive.active
  writeFileSync(manifestFile, JSON.stringify(withActive, null, 2), "utf8")
  const manifestBefore = readFileSync(manifestFile, "utf8")
  assert.equal(typeof JSON.parse(manifestBefore), "object", "前置：manifest 合法（可解析，≠ 在盘损坏）")
  assert.equal("active" in JSON.parse(manifestBefore), false, "前置：active 缺席 ⇒ 槽号不可解析")

  // 槽号只能由 manifest 解析、内存空（重启后的形态）⇒ 若把「无 active」当成槽号可解析 / 当读不到，本条即红
  const agent = makeAgent(root, { slot: null })
  assert.equal(agent._engDesignTokens, undefined, "前置：内存无槽 ⇒ 零消费只能来自「无槽号」")
  const receipt = await tool.execute({ action: "close", path: BATCH_REL }, ctxOf(agent))
  assert.match(receipt, /^batch: §1 status line → 「已收口/, `无 active 不得判成 manifest 读不到（不抛）：${receipt}`)
  assert.match(receipt, /\[design tokens\] 消费 0 枚 · 留槽无归属 0 枚/, `无槽号 ⇒ 该批槽集为空（零消费）：${receipt}`)
  assert.match(statusLineOf(root), /已收口/, "§1 → 已收口")
  assert.equal(readFileSync(slotFileOf(seeder), "utf8"), slotsBefore[1], "零消费：槽 1 字节不变（槽仍在盘）")
  assert.equal(readFileSync(slotFiles[0], "utf8"), slotsBefore[0], "零消费：槽 0 字节不变")
  assert.equal(readFileSync(slotFiles[2], "utf8"), slotsBefore[2], "零消费：槽 2 字节不变")
  assert.equal(readFileSync(manifestFile, "utf8"), manifestBefore, "零写：本通路不改写 manifest")
})
