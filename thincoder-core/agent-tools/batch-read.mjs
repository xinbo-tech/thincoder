/**
 * agent-tools/batch-read.mjs — 批次档只读读面（read-data-interface 批 · 设计档
 * `docs/cli/design/READ-DATA-INTERFACE.md` §2.5 / §3.3 · 台账 #887）。
 *
 * `listBatchRecords({ cwd, bases })` —— ACP `batch/list` 与变更观察器共用的**文件集 + 段状态单源**：
 * 文件集 = 基底根（`batchDocBases`——声明面单源）下全部 `*.md`（递归；收集器 `collectMarkdownFiles`
 * 转导出复用）；路径升序稳定；单档读错跳过（尽力面）。各段状态 = `readSectionStatusWord`（段头 /
 * 状态行正则 / 词表全消费 batch-skeleton 单源——与冻结门字面零漂移；`§4` / `§6` = 字面「无状态词」）。
 */
import { readFileSync } from "node:fs"
import { basename } from "node:path"

import { collectMarkdownFiles } from "./batch-lifecycle.mjs"
import { batchDocBases } from "./batch-paths.mjs"
import { readSectionStatusWord } from "./batch-skeleton.mjs"

/** 段号表（1–6——输出映射键序固定；`readSectionStatusWord` 消费数形段号）。 */
const SEGMENTS = [1, 2, 3, 4, 5, 6]

/** 批次档列举（只读）：`{ batches: [{ file, path, sections }] }`——`path` = 绝对路径（`/` 归一）、
 *  `file` = basename、`batches` 按路径升序；单档读错跳过（尽力面）。`bases` 缺省 = `batchDocBases(cwd)`。 */
export function listBatchRecords({ cwd, bases } = {}) {
  const base = cwd ?? process.cwd()
  const roots = bases ?? batchDocBases(base)
  const files = new Set()
  for (const root of roots) for (const abs of collectMarkdownFiles(root)) files.add(abs.replace(/\\/g, "/"))
  const batches = []
  for (const p of [...files].sort()) {
    let src
    try { src = readFileSync(p, "utf8") } catch { continue } // 单档读错跳过（尽力面）
    const sections = {}
    for (const seg of SEGMENTS) sections[`§${seg}`] = readSectionStatusWord(src, seg)
    batches.push({ file: basename(p), path: p, sections })
  }
  return { batches }
}
