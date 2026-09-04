/**
 * edit-batch.mjs — edit 工具的数组形态（edits: [...]）：一次多文件原子替换。
 * （2026-08-31 工具顺手度 §9 ②；2026-09-01 缺陷修复"同文件多条串行累积"；
 * 2026-09-04 TOOLS.md §15 D15.1——条目级判定+应用迁至 edit-diff.mjs——批量调共用。）
 *
 * 语义：同一 path 的多条编辑按序**串行累积应用**——第 n 条基于前 n-1 条已应用后的
 * 累积内容做匹配与替换；跨 path 条目互不影响（并行原子语义）；任一条失败 →
 * 全不写（原子性保留）。每条目独立按判定序（§15.2 分支 0 单行替换 / 零重叠→插入 / LCS /
 * 空 new 显式报错）。
 */
import { readFile, writeFile } from "node:fs/promises"
import { resolveInCwd, normalizeEOL, joinWithEol, gitDiffOne, autoSyntaxCheck } from "./shared.mjs"
// file.mjs ↔ edit-batch.mjs 循环引用：两侧导入的都是函数声明（提升初始化），
// 仅在调用期使用——ESM 循环下安全（无模块求值期取值）。
import { recordWrite, appendWriteContext } from "./file.mjs"
// TOOLS.md §15 D15.1：批量条目判定+应用共用 edit-diff（§15.2 分支 0 单行替换 + 行级 LCS——零重叠→插入）；
// D15.3#9：edits 互斥错误文本随前置校验分支迁出至 edit-diff.mjs。
import { assertEditArgsExclusive, validateEditEntry, computeEditEntry } from "./edit-diff.mjs"

/**
 * Apply the `edits` array form: multi-file atomic replacement. Throws on any
 * failure (atomic — nothing written). Returns the per-entry result text (joined).
 */
export async function applyEditBatch(args, ctx) {
  if (!Array.isArray(args.edits) || args.edits.length === 0) {
    throw new Error("edits must be a non-empty array of {path, old_string, new_string}")
  }
  assertEditArgsExclusive(args)
  // 原子：先全量检查（所有文件的替换都可执行）——任一失败全不写。
  // 2026-09-01 缺陷修复（TOOLS.md §9 ②"同文件多条规则"）：同一 path 的多条编辑
  // 按序**串行累积应用**——第 n 条基于前 n-1 条已应用后的累积内容做匹配与替换
  // （原实现每条都基于盘上原始内容计算、写盘循环后置，同文件后者覆盖前者 →
  // 除最后一条外全部静默丢失）；跨 path 条目互不影响（并行原子语义不变）。
  const groups = new Map() // abs → 每文件一条流水线
  for (const e of args.edits) {
    if (!e.path) throw new Error("each edit must have a path")
    // 前置校验（空 old / 非字符串 new——文本同 edit-diff 批量形态；读盘前校验）
    validateEditEntry(e, { label: `edit for ${e.path}: `, rich: false })
    const abs = resolveInCwd(ctx, e.path)
    let g = groups.get(abs)
    if (!g) {
      const raw = await readFile(abs, "utf8")
      g = { abs, path: e.path, raw, content: normalizeEOL(raw), edits: [] }
      groups.set(abs, g)
    }
    g.edits.push(e)
  }
  const prepared = [] // 每条目一条回显；同文件内按 args 序，跨文件按首次出现分组序（应用/回显语义均正确）
  for (const g of groups.values()) {
    g.netShift = 0 // 组内行数差累积（合并快照的 shift = 全组净漂移）
    for (const e of g.edits) {
      // 条目级判定+应用（edit-diff——§15.2 分支 0 单行替换 + 判定序 1/2/3 + 空 new 显式报错 + >1000 行报错）
      const out = computeEditEntry(g.content, e, {
        path: g.path,
        absPath: g.abs,
        abortPrefix: "edit aborted (atomic — no files written): ",
      })
      prepared.push({
        g,
        editStartLine: out.editStartLine, // 基于累积内容计算——已天然计入前面条目的行偏移，不再累加
        lineShift: out.lineShift,
        occurrences: out.occurrences,
      })
      g.content = out.updated // 串行累积：下一条基于本条应用后的内容
      g.netShift += out.lineShift
    }
  }
  // 全部检查通过——每文件一次写盘（同文件多条：写入串行累积后的最终内容）；
  // recordWrite 每组一条合并快照：startLine = 组内**所有**编辑受影响行的最小值
  // （#2，2026-09-01 交付评审尾巴——原实现取首条 = 调用序第一条，逆序条目时
  // 护栏下界过高、受影响区内的 insert_after 被放行），shift = 全组行数差累积
  // ——受影响区护栏覆盖组内所有编辑
  for (const g of groups.values()) {
    const startLine = Math.min(...prepared.filter((p) => p.g === g).map((p) => p.editStartLine))
    await writeFile(g.abs, joinWithEol(normalizeEOL(g.content).split("\n"), g.raw), "utf8")
    recordWrite(g.abs, { type: "edit", startLine, shift: g.netShift })
  }
  const results = []
  for (const p of prepared) {
    // #4（2026-09-01 交付评审尾巴）：与单文件路径对齐——每条结果附 git diff +
    // autoSyntaxCheck（同文件多条会重复 diff/检查，换取格式一致、实现零分支）
    const diff = gitDiffOne(ctx.cwd, p.g.abs)
    const base = `Edited ${p.g.path}: replaced ${p.occurrences} occurrence(s)${diff ? "\n" + diff : ""}${await autoSyntaxCheck(p.g.abs)}`
    results.push(await appendWriteContext(p.g.abs, p.editStartLine, base))
  }
  return results.join("\n")
}
