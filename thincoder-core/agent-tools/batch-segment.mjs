/**
 * agent-tools/batch-segment.mjs — **过渡 shim**（batch 工具单名化收口，BATCH-RECORD §4.14）：
 * 本档仅 re-export `batch.mjs` 主档导出面（旧 import 面 = VSC `setup-tooltable.mjs` 经此 import
 * `configureBatchSegment` / 旧测试消费——导出全超集，行为零变）。权威实现 = batch.mjs
 * （batchTool 四 action + append 迁移面 + 过渡别名 batchSegmentTool）；撤除判据 = §4.14
 * （消费面清零后删本档——先例债：删档需同步 tooltable 装配 import，随批登记）。
 */
export {
  MAX_TEXT_CHARS,
  SEGMENT_BY_ROLE,
  batchDocBases,
  batchDocForReview,
  batchSegmentTool,
  batchTool,
  configureBatchSegment,
  resetBatchSegment,
  resolveBatchDocPath,
} from "./batch.mjs"
