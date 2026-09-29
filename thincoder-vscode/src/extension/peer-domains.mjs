/**
 * peer-domains.mjs — R10 L3 文件写域登记 + 冲突检测（`MULTI-INSTANCE-COLLAB.md` §2a.5 / §4.3）——
 * VSC 端 = 核单源转口。
 *
 * 单源 = `@thincoder/core/peer-domains.mjs`：目标解析（`peerWriteTargets`——`toolTouchPaths`
 * 单源谓词）· 目录扫描聚合（mtime 惰性缓存 · 死清理「判活探测失败 ≠ 死，不删」）· 冲突查询
 * （`conflicts` 分组形）· 软提示合成（`peerCollabNote`——认领行 × 足迹行、逐 target、零双报）·
 * 回合累积与整写（`recordPeerWrites` ∕ `flushPeerDomains`——首步清认领去重集）**逐名转口**。
 * 原端自持面随收编退役（差额登记句见批档）：绑定对象查询形 ∕ 扁平条目形 ∕ `peerNotes` 输入端 ∕
 * `{mtimeMs,size}` 双键缓存 ∕ 无 `batchAlive → null` 支（偶然而非正确）——取核形单源。
 *
 * 认领面（§4.4）归口 `./peer-claims.mjs`——本档 re-export 路径缝与认领 API（旧 re-export 面保形
 * ——名面不缩）。
 *
 * 调用点（§2.3 件 5——端 adapter 改核形）：`execute-tools.mjs` = `peerCollabNote(agent, tool, args)`
 * ＋ `recordPeerWrites(agent, tool, args)` ＋ `markClaimNoted`；`run-stages.mjs` =
 * `flushPeerDomains(agent)`（去重集清空 = 其首步）。软提示行间 ∕ 附加分隔符 = 核形 `\n`（原端块内
 * 空行 `\n\n` 退场——分隔符不属逐字锚，§4.3 在册）。
 */
export {
  HOT_WINDOW_MS, PEER_WRITE_TOOLS, peerWriteTargets,
  peerDomains, conflicts, peerCollabNote, recordPeerWrites, flushPeerDomains,
  _setPeerDomainsTestImpl, _resetPeerDomainsTestImpl,
} from "@thincoder/core/peer-domains.mjs"

// 认领面（§4.4）名面——路径缝 + 认领 API 转口（旧 peer-domains 的 re-export 面保形）。
export {
  peersDir, peerFilePath, _setPeersDirForTest, _resetPeersDirForTest,
  CLAIM_TTL_MS, CLAIM_RENEW_FLUSH_MS,
  claimAge, claimLeft, claimWho, claimNoteText, claimNoteKey,
  markClaimNoted, markPeerNoted, clearPeerNoted, registerClaims, claimsOverlap,
} from "./peer-claims.mjs"
