/**
 * peer-claims.mjs — R10 多实例协作 L3 **意图认领面**（claims · TTL 租约）——VSC 端 = 核单源转口。
 *
 * 单源 = `@thincoder/core/peer-claims.mjs`（`MULTI-INSTANCE-COLLAB.md` §4.4 / D-MI17–D-MI21）：
 * 认领登记 ∕ 落盘（字段级合并写 · 原子写 · manifest 门控）∕ 命中判据 ∕ 文案 ∕ 去重集**逐名转口**
 * ——端壳零语义副本（原端自持面随收编退役：模块级认领载体 → 核 `agent._peerClaims*`；落盘
 * cwd 原文 → 核 `normalizeCwd`）。
 *
 * 宿主根解析保留（核缝参数化）：peers 根解析单源 = 核 `peersDir()`（生产 = sessions 根同父
 * `join(configDir, "peers")`）；端缝 `_setPeersDirForTest` ∕ `_resetPeersDirForTest` 转口核缝
 * ——注入即作用于核读写面（端壳零自持根状态）；沙箱测试 = sessions ∕ peers 双缝注入（真目录零触）。
 *
 * 端旧名 alias（名差表——保消费面；签名 = 核形，属主载体首参）：`readRecord` ∕ `registerClaims` ∕
 * `flushClaims` ∕ `markPeerNoted` ↔ 核 `readPeerRecord` ∕ `recordPeerClaims` ∕ `flushPeerClaims` ∕
 * `markClaimNoted`；`claimsOverlap` = 核 `pathsOverlap` 名面别名。
 */
export {
  CLAIM_TTL_MS, CLAIM_RENEW_FLUSH_MS,
  peersDir, peerFilePath, _setPeersDirForTest, _resetPeersDirForTest,
  readPeerRecord, recordPeerClaims, flushPeerClaims, parseClaims, claimHits,
  claimNoted, markClaimNoted, clearClaimNoted, claimsNow,
  claimAge, claimLeft, claimWho, claimNoteText, claimNoteKey,
  pathsOverlap, covers, _setPeerClaimsTestImpl, _resetPeerClaimsTestImpl,
} from "@thincoder/core/peer-claims.mjs"

/** 端旧名 alias 面（同源再导出——本档零副本；消费面见上注）。 */
export {
  readPeerRecord as readRecord,
  recordPeerClaims as registerClaims,
  flushPeerClaims as flushClaims,
  markClaimNoted as markPeerNoted,
  clearClaimNoted as clearPeerNoted,
  pathsOverlap as claimsOverlap,
} from "@thincoder/core/peer-claims.mjs"
