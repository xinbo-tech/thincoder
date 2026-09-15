/**
 * session-gc.mjs — 端壳：会话目录残留 GC（VS Code 端）。
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：实现**单源 = 核**
 * `@thincoder/core/session-gc.mjs`——残留分类 / 保留期常量 / 活跃槽判据 / 冷 cwd 原语 +
 * 启动钩子（`scheduleSessionGC`）**全部纯转口**（SESSION.md §6.12；机制条文零改）。
 * 沙箱缝说明（保留口径 · 实核）：核钩子由 `sessionPath(cwd)` 派生 `dir`/`prefix`
 * （核 `session-gc.mjs:100-108`——随核 `_setSessionsDirForTest` 沙箱缝）；而 `gcResidue` /
 * `listColdCwds` / `deleteColdCwd` 的**默认参数** `dir = sessionsDir()` 为核内
 * `join(configDir,"sessions")`（**不**随沙箱缝）⇒ 直调者若需沙箱隔离须显式传 `dir`。
 * 端侧无直调点（冷 cwd 手动执行面仅 CLI——端差登记见 `docs/core/design/SESSION.md` §6.12）。
 */
export {
  RESIDUE_RETENTION_MS, ORPHAN_TMP_RETENTION_MS, COLD_CWD_RETENTION_MS,
  gcResidue, scheduleSessionGC, listColdCwds, deleteColdCwd, runSessionGc,
} from "@thincoder/core/session-gc.mjs"
