/**
 * ledger-variant-notice.mjs — 变体键库首跑检测提示（F-LX3 · 设计档 `docs/core/design/LEDGER.md` §12 ·
 * 批 `docs/batches/2026-10-05-ledger-variant-db-notice.md` · 台账 #935）。
 *
 * 升级到含键归一的版本后，存量变体键库（旧产物写入的盘符翻转拼写键——`legacyKeyVariants`）不再无声搁浅：
 * CLI 主入口启动时对**当前项目根**检测，命中 ⇒ 单行 i18n 提示（`thincoder ledger audit` 查看 ∥
 * `thincoder ledger migrate` 收正）；**只提示，零自动动作**（不迁移 / 不删档 / 不建库 / 零写）。
 * 判据 = 变体键档**文件存在**（KD-VN1——零开库：不触 SQLite / 不建 WAL；坏档 / 空库不漏报）。
 * 每进程至多一次 = 模块级闩（首唤检测 / 后唤零动作——重置缝 `_resetLedgerVariantNoticeForTest`，
 * 先例 = `_resetLedgerDirForTest`）。降级 = 全径 try ⇒ 返回 `null`（零抛零阻塞——启动链不受累）。
 * 本档静态链入 `ledger-migrate.mjs`（node:sqlite）⇒ 消费侧一律动态 import（W8 契约②）。
 * 检测面零新建哈希式：键式直引 `ledgerKey` ∥ 变体枚举直引 `legacyKeyVariants`（单源不二写）。
 */
import { statSync } from "node:fs"
import { join, resolve } from "node:path"

import { t } from "./i18n.mjs"
import { ledgerDirPath, ledgerKey } from "./ledger-db.mjs"
import { legacyKeyVariants } from "./ledger-migrate.mjs"
import { resolveProjectRoot } from "./manifest.mjs"

/** 默认探针（吞错形——与 `migrate` 源枚举过滤同判据）：`statSync(p).isFile()`，任何 stat 失败 ⇒ false。 */
const defaultExists = (p) => { try { return statSync(p).isFile() } catch { return false } }

/** 一次为限闩（「每进程」= ESM 模块实例的天然粒度——首唤检测 / 后唤零动作）。 */
let noticeChecked = false

/** 测试重置缝（同 `_resetLedgerDirForTest` 先例——闩为进程级事实，直测需复位）。 */
export function _resetLedgerVariantNoticeForTest() { noticeChecked = false }

/**
 * 检测当前项目根的变体键库：命中 ⇒ 单行提示文案（i18n 键 `ledger.variantDbNotice`——zh ∥ en 单源），
 * 无 ∥ 已查过 ∥ 任何异常（根解析 / 探针 / 文案解析）⇒ `null`（静默降级——零抛）。
 * 命中判据 = 变体键（`k !== 主键`）中有档在盘（文件存在——零开库）；主库在否不影响判定。
 * @param {{cwd?: string, dir?: string, locale?: string, exists?: (p: string) => boolean}} [opts]
 * @returns {string|null} 单行文案 / null
 */
export function ledgerVariantNotice({ cwd = process.cwd(), dir = ledgerDirPath(), locale = "en", exists = defaultExists } = {}) {
  if (noticeChecked) return null
  noticeChecked = true
  try {
    const root = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
    const targetKey = ledgerKey(root)
    const hit = legacyKeyVariants(root).filter((k) => k !== targetKey).some((k) => exists(join(dir, `${k}.db`)))
    return hit ? t("ledger.variantDbNotice", {}, locale) : null
  } catch { return null }
}
