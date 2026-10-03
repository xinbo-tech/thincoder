/**
 * 2026-10-04-issue-fix-round4.test.mjs — issue 修复批·四（家族重锚/工程面 · 台账 #893）批次本地单元件。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-04-issue-fix-round4.test.mjs
 *
 * 面 = 批次档写通道的凭证剥除（`batch.mjs` `CRED_RE` / `CRED_TEST_RE` 三形；判据承诺 =
 * 「凭证绝不落档」· 工具承诺 "Credential values are stripped mechanically before writing"）。
 * 三形对表（批侧自有正则 ⊗ 单源 `design-token.mjs` `stripDesignTokenEcho`）：
 *   ① 闭括号形（回显方括号包裹的全串 token）   ② 键形（designId 键 + 值）   ③ 无标两段 token 值形
 *   ③ = 本批补形（Approved 后缀逐字携带的 `⟨uuid⟩:⟨epoch⟩`——既有两形覆盖不到）。
 *   裸 uuid 不剥（非凭证 ∥ 无 token 上下文不可精确——本批 KD-7 明裁）。
 *   两源差异（防后人「对齐」）：单源 `design-token.mjs` 剥裸 uuid，且对 ③ 形仅去 uuid（留 `:epoch`）；批侧反是——
 *   ③ 形整值剥 ∥ 裸 uuid 逐字保留。
 *
 * 腿（C1–C5 —— 初态 = 实施前实读；「先红后绿」红面 = ③ 形存活）：
 *   C1  ① 形剥净 + 同行其余文字逐字保留（零回归）        初绿
 *   C2  ② 形剥净 + 同行其余文字逐字保留（零回归）        初绿
 *   C3  ③ 形剥净（本批补形——红 = 该形存活进档）            初红
 *   C4  裸 uuid 逐字保留（宽剥否决面）                    初绿
 *   C5  纯凭证行（③ 形独占行）⇒ 整行丢弃；邻行逐字保留     初红（C3 面）
 * 执行面 = 真工具链（`batchTool.execute` append 经真写通道 ⇒ 读回档全文断言——非私有函数直调）。
 * 全隔离：每腿自建临时目录 + 临时批次档（不触真实批档 ∥ 不写用户 config）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const { batchTool } = await mod("thincoder-core/agent-tools/batch.mjs")

const UUID = "3f6a1c2e-9b0d-4a41-8f7e-5c2d9a7b1e04" // 假 token uuid（形态真值——非真实凭证）
const EPOCH = "4102444800000" // 2100-01-01 epoch ms（13 位——落 \d{10,16}）
const TOKEN = `${UUID}:${EPOCH}` // ③ 形原值（无标两段）

/** 临时批次档：骨架 §1–§6 + §1 状态行「进行中」+ 档头零死占位（append 门判据形）。 */
function mkRecord(t, tag) {
  const dir = mkdtempSync(join(tmpdir(), `r4-${tag}-`))
  t.after(() => rmSync(dir, { recursive: true, force: true })) // 腿尾清理（零 tmp 残留）
  const rec = join(dir, "probe-batch.md")
  writeFileSync(rec, [
    "# 2026-10-04 · probe（批内件夹具）",
    "> 编制：主 agent · 2026-10-04 · 来源 = 批内件夹具（临时档——非真实批档）。",
    "> 台账 = #1（probe · 归批）。前情 = 无（独立批）。",
    "## §1 讨论（主 agent）",
    "**状态行**：🔄 进行中（probe）",
    "## §2 批次任务与设计（eng-designer）",
    "## §3 设计评审（评审子代理）",
    "## §4 用户批准（主 agent）",
    "## §5 实施记录（eng-coder）",
    "## §6 验证与收口（父代理）",
    "",
  ].join("\n"), "utf8")
  return { dir, rec }
}

/** 经真写通道 append 一段文本（eng-coder 身份 §5）⇒ 返回 { receipt, src }。 */
async function appendThrough(dir, rec, text) {
  const tool = batchTool(rec)
  const receipt = await tool.execute(
    { action: "append", segment: "§5", text },
    { depth: 1, agent: { cwd: dir, _role: "eng-coder" } },
  )
  return { receipt, src: readFileSync(rec, "utf8") }
}

/** §5 段体（`## §5` 至下一段标题；行面 = 去空行的正文行）。 */
function section5Body(src) {
  const i = src.indexOf("## §5")
  const j = src.indexOf("## §6", i + 1)
  return src.slice(i, j < 0 ? undefined : j).split("\n").slice(1).filter((l) => l.trim())
}

test("C1 ① 形（闭括号）剥净——同行其余文字逐字保留（零回归）", async (t) => {
  const { dir, rec } = mkRecord(t, "c1")
  const { receipt, src } = await appendThrough(dir, rec, `alpha [DESIGN-TOKEN:${TOKEN}] omega`)
  assert.match(receipt, /^batch_segment: appended /, "写通道受理（非拒写）")
  assert.ok(!src.includes("[DESIGN-TOKEN:"), "① 形零残留")
  assert.ok(!src.includes(UUID), "uuid 零残留")
  assert.deepEqual(section5Body(src).map((l) => l.split(/\s+/).join(" ")), ["alpha omega"], "同行其余文字逐字保留（全段判——多余行即红）")
})

test("C2 ② 形（键形）剥净——同行其余文字逐字保留（零回归）", async (t) => {
  const { dir, rec } = mkRecord(t, "c2")
  const { src } = await appendThrough(dir, rec, `alpha designId: ${UUID} omega`)
  assert.ok(!src.includes("designId"), "② 形键名零残留")
  assert.ok(!src.includes(UUID), "键值零残留")
  assert.deepEqual(section5Body(src).map((l) => l.split(/\s+/).join(" ")), ["alpha omega"], "同行其余文字逐字保留（全段判——多余行即红）")
})

test("C3 ③ 形（无标两段 token 值）剥净——本批补形（红 = 该形存活进档）", async (t) => {
  const { dir, rec } = mkRecord(t, "c3")
  const { src } = await appendThrough(dir, rec, `alpha ${TOKEN} omega`)
  assert.ok(!src.includes(UUID), "③ 形 uuid 零残留")
  assert.ok(!src.includes(EPOCH), "③ 形 epoch 零残留")
  assert.ok(src.includes("alpha") && src.includes("omega"), "同行其余文字逐字保留")
})

test("C4 裸 uuid 逐字保留（非凭证 ∥ 无上下文精确性——宽剥否决面）", async (t) => {
  const { dir, rec } = mkRecord(t, "c4")
  const { src } = await appendThrough(dir, rec, `alpha ${UUID} omega`)
  assert.ok(src.includes(UUID), "裸 uuid 逐字保留（不剥）")
})

test("C5 纯凭证行（③ 形独占行）⇒ 整行丢弃；邻行逐字保留", async (t) => {
  const { dir, rec } = mkRecord(t, "c5")
  const { src } = await appendThrough(dir, rec, `keep-before\n${TOKEN}\nkeep-after`)
  assert.deepEqual(section5Body(src), ["keep-before", "keep-after"], "③ 形独占行整行丢弃（不留空行）")
  assert.ok(!src.includes(UUID) && !src.includes(EPOCH), "③ 形零残留")
})
