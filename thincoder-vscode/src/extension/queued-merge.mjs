/**
 * queued-merge.mjs — busy 排队消息的合并消费纯函数族（VSC 半——R15 攒批恢复 · queue-visible 批 2026-09-24）。
 *
 * 机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦（消费成形）+ `docs/vsc/design/
 * WEBVIEW-PROTOCOL.md` §3.2 行 17（快照字段）；跨端同源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`
 * §6.8「合并消费」。**核单源（转口）**：五名（`MAX_MERGE_ITEMS` / `MAX_MERGE_CHARS` /
 * `QUEUED_MAX_ITEMS` / `formatMergedMessages` / `planQueuedInput`）自 `@thincoder/core/queued.mjs`
 * 转口（同一绑定）；对拍锁 = `docs/batches/2026-09-29-parity-b2-queued.test.mjs`（批次本地件）。
 */

export { MAX_MERGE_ITEMS, MAX_MERGE_CHARS, QUEUED_MAX_ITEMS, formatMergedMessages, planQueuedInput } from "@thincoder/core/queued.mjs"
