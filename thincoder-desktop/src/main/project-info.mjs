/**
 * project-info.mjs — 项目级信息两通道（`ledger:read` / `batch:status`）：**项目一份、不随会话走**
 * （通道载荷一律**不携会话 `key`**——`docs/desktop/design/IPC.md` §1 键面）。
 *
 * 台账读 = 核 `buildScan`（`thincoder-core/ledger.mjs:114`）——**动态 import**（W8 契约②：
 * `ledger-db.mjs` 静态 import `node:sqlite` ⇒ 消费侧禁静态 import）；端侧**不直读核内表**，
 * 只取三计数 + 阈值读数（行集不下发——批档 §2.10 项 1）。
 * 项目相位 = 核 `readManifest(cwd)` 回执 `manifest.phase`（`thincoder-core/manifest.mjs:334`；
 * **无顶层 `phase`**——批档 §2.10 项 2）——非 ENOENT 读错**上抛**（`:342`）⇒ invoke 拒绝直传（不吞）。
 */
import { readManifest } from "@thincoder/core/manifest.mjs"
import { currentCwd } from "./projects.mjs"

/** 载荷 cwd 缺省 = 主进程当前项目内存态（`projects.mjs` 单源）。 */
function cwdOf(payload) {
  return payload?.cwd ?? currentCwd() ?? null
}

/**
 * `ledger:read(payload)` ⇒ `{ ok, counts:{ pool, tech, aged }, thresholdReached }` ∥
 * `{ ok:false, reason:"no-project" }`——**无 `rows`**（行集不下发）。
 * 未开项目（无 cwd）= `no-project`；有 cwd 而无台账库 ⇒ 核 `openLedger` 回 null ⇒ 行集空 ⇒
 * 三计数全 0 + `thresholdReached:false` 且 `ok:true`（「未发现台账」是合法读数，非错误）。
 */
export async function ledgerRead(payload) {
  const cwd = cwdOf(payload)
  if (!cwd) return { ok: false, reason: "no-project" }
  const { buildScan } = await import("@thincoder/core/ledger.mjs")
  const scan = buildScan({ cwd })
  return {
    ok: true,
    counts: { pool: scan.pool, tech: scan.tech, aged: scan.aged },
    thresholdReached: scan.thresholdReached,
  }
}

/**
 * `batch:status(payload)` ⇒ `{ ok, phase }` ∥ `{ ok:false, reason }`——`reason` = `missing` ∥
 * `invalid`（整档缺 / 不可解析，两分不合并——核回执直传）；相位值域 = `initial-dev` /
 * `production`。非 ENOENT 读错由核上抛（本档零 catch ⇒ invoke 拒绝直传）。
 */
export function batchStatus(payload) {
  const cwd = cwdOf(payload)
  if (!cwd) return { ok: false, reason: "missing" }
  const r = readManifest(cwd)
  if (!r.ok) return { ok: false, reason: r.reason }
  return { ok: true, phase: r.manifest?.phase ?? null }
}
