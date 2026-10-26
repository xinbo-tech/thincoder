/**
 * agent-tools/batch-unit-test-gate.mjs — 本批批内单测档门（收口前置门 · 单源叶档）。
 *
 * 权威规格 = `docs/core/design/TESTING.md` §3.5（判据 ∥ 门位 ∥ 报面 ∥ 用例表 ∥ 验收）——本档只实现，
 * 不重述口径（D2）。业务判据一条：**收口时，本批自己的批内单测档仍在盘 ⇒ 拒收口**
 *（`§3.1 ①` 零留存纪律的结构兜底：纪律句此前没有兜底结构，2026-10-26 实测 13 档全未删）。
 *
 * 归属判据（闭集 · 机判）——给定批档绝对路径 `abs`，目录 `D = dirname(abs)`，本批 stem `S` = 档名去 `.md`：
 *   ① 候选集 = `D` 下后缀 `.test.mjs` 的**文件**（目录不计）；
 *   ② 候选 `c` 的**归属批档** = `D` 内所有 `.md` 档名去 `.md` 后为 `c` 文件名面前缀者中的**最长者**；
 *   ③ 本批的档 = 归属批档 = `S` 的候选；非空 ⇒ 拒。无主候选（无任何 `.md` 为其前缀）不判。
 * 为什么最长前缀而非同名 = 本批实测反证（13 档里 1 档名与批档不同名 ⇒ 同名判据漏 1∕13）；为什么只管
 * 本批 = 全扫遗留等于让新批替旧账背债（用户 2026-10-26 裁定）。两条理由的完整论证 = §3.5。
 *
 * 门位：`batch` 收口两路（`close` ∥ `status` 写 §1「已收口」）在**文档机检门之前**过本门；`append` 面不过。
 * 调用点 = `batch-lifecycle.mjs` 的 `closeBatchRecord` 与 `statusBatchRecord`（两处；本档不自挂挂点）。
 *
 * 边界：门只拒、**不代删**（删除是实施者 / 人的动作）；不扫他批 ∥ 无主遗留；不依赖 manifest
 *（无声明面时文档机检门为「不适用」，本门照判）。
 *
 * 依赖单向（KD-4）：本档是**叶档**，只 import `node:*`——不 import skeleton ∥ lifecycle ∥ gate，
 * 判据可被单测直取（零环、零装配）。
 */
import { readdirSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"

/** 候选后缀（闭集）——本批单元测试档的形态（§3.1 ①：`docs/batches/*.test.mjs`）。 */
const TEST_SUFFIX = ".test.mjs"
/** 批档后缀（归属判据的候选前缀来源 = 同目录 `.md` 档）。 */
const DOC_SUFFIX = ".md"

/** 档名去后缀（形态定长、大小写敏感——`.test.mjs` ∥ `.md` 是本仓固定形态，不做模糊匹配）。 */
const stripSuffix = (name, suffix) => name.slice(0, -suffix.length)

/** 归属判据本体（纯函数）：候选 stem 的**最长批档前缀**；无任何批档名为其前缀 ⇒ `null`（无主）。
 *  最长 = 同目录并存两份批档、一份 stem 是另一份前缀时，短前缀不会把别人的档记到本批。 */
function owningBatchStem(candidateStem, batchStems) {
  let best = null
  for (const stem of batchStems) {
    if (!candidateStem.startsWith(stem)) continue
    if (best === null || stem.length > best.length) best = stem
  }
  return best
}

/**
 * 本批自己的单元测试档集（判据本体 · 只读 · 零写）。
 * @param {string} batchAbsPath — 本批批档的绝对路径（`pickTarget` 解析所得）
 * @returns {string[]} 本批自己的单元测试档绝对路径（升序；空集 = 放行面）
 * @throws 目录不可读（EACCES ∥ ENOENT ∥ 非目录）⇒ fail-closed：判不了就是不许过——收口被拒并点名目录。
 *   设计未定此支（评审 🔵#11），父侧 2026-10-26 裁决按本仓既有 fail-closed 口径落
 *   （`docs/core/design/BATCH-RECORD.md` §4.1「fail-closed」行；裁决与读数 = 本批 §5）。
 *   本支用**独立锚串** `unit-test gate cannot determine`：机检锚 `unit test file(s) still on disk`
 *   专表「档真在盘」这一拒因，两者不可互混。
 */
export function batchUnitTestFiles(batchAbsPath) {
  const dir = dirname(resolve(batchAbsPath))
  const stem = stripSuffix(basename(resolve(batchAbsPath)), DOC_SUFFIX)
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch (e) {
    throw new Error(
      "batch: 本批批内单测档门无法判定（unit-test gate cannot determine）— cannot list the batch record's directory " +
        "to tell whether this batch's own unit test file remains on disk, so the closeout is refused (fail-closed: 判不了就不许过). " +
        `Directory: ${dir}. Cause: ${e?.message ?? String(e)}. Nothing was written.`,
    )
  }
  const batchStems = entries
    .filter((e) => e.isFile() && e.name.endsWith(DOC_SUFFIX))
    .map((e) => stripSuffix(e.name, DOC_SUFFIX))
  const hits = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(TEST_SUFFIX)) continue // 目录不计；不同后缀不属候选集
    if (owningBatchStem(stripSuffix(e.name, TEST_SUFFIX), batchStems) !== stem) continue // 他批的档 ∥ 无主档 ⇒ 不判
    hits.push(resolve(dir, e.name))
  }
  return hits.sort()
}

/** 拒收文案（单源——两路收口共用；`action` 只标通路：`close` ∥ `status → 已收口`）。
 *  三件 = 判据句（机检锚串 `unit test file(s) still on disk`）+ 逐档一行绝对路径 + 修法（删）+ `Nothing was written.` */
function unitTestFilesStillOnDiskError(files, action) {
  const route = action === "status" ? "status → 已收口" : "close"
  return [
    "batch: 本批批内单测档仍在盘（收口前置门 · unit-test file gate）— " +
      `${route} refuses: this batch's own unit test file(s) still on disk, and closing would freeze the record with them left behind ` +
      "（零留存：单元测试档用毕即删，读数一行留批档 §5）.",
    `Files (${files.length}):`,
    ...files.map((f) => `  ${f}`),
    "处置：删掉上面点名的档（用毕即删——读数一行留批档 §5），再复跑收口；本门只拒、不代删。" +
      "判据只认本批自己的档（同目录最长批档名前缀），他批遗留 ∥ 无主档不判。Nothing was written.",
  ].join("\n")
}

/**
 * 收口前置门（两路收口共调）：本批自己的单元测试档仍在盘 ⇒ throw（写盘前——`§1` 状态行字节不变）。
 * 放行零回执（与其余收口前置同形：不写回执段、不改回执字面）。
 * @param {string} batchAbsPath — 本批批档的绝对路径
 * @param {"close"|"status"} [action] — 拒串标通路（`status` ⇒ 标 `status → 已收口`）
 * @throws 非空命中 ∥ 目录不可读（fail-closed，见 `batchUnitTestFiles`）
 */
export function assertUnitTestFilesCleared(batchAbsPath, action = "close") {
  const files = batchUnitTestFiles(batchAbsPath)
  if (files.length === 0) return
  throw new Error(unitTestFilesStillOnDiskError(files, action))
}
