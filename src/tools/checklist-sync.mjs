/**
 * checklist-sync.mjs — checklist 并发写同步机（R10 F4，MULTI-INSTANCE-COLLAB.md §2a.3
 * ——2026-09-06，自 checklist.mjs 拆出：门控 + 合并 + 序列化——防 checklist.mjs 超 300
 * 行 advisory 线；本模块为纯同步机制，不持 checklist 业务状态）。
 *
 * 双端 checklist 同路径 {cwd}/.thincoder/checklist.md——多实例并发写原为裸整文件覆盖
 * （丢项）。写前 mtime 门控 + ID 键合并（评审修正 #6 基线规则：基线 = 本读-改-写链内
 * 最近一次 stat 的 mtime；本进程自写后刷新——parse 规范化写回不误触发 merged/重分配）。
 * .bak 不做（决策点② A：cwd 在 git 仓库内——git 兜底现场）。
 *
 * 冲突语义（flushWrite 内收口）：写前 stat ≠ 基线（对端并发写过）→ 重读磁盘 → 双方
 * union by ID（本端新增 + 盘上他端新增都保留；同 ID 不同文本 → 盘上保留、本端重分配
 * max+1 续分配；同 ID 仅状态不同 → in_progress 胜过 pending——标记不丢）；checklist
 * 文件合并时按 done 文件归档 ID 排除（含子任务点号 ID——并发 mark-done 的"盘上有旧
 * pending 副本"不复活已归档项——done 集合 union 的另一半）。checklist-done.md 自身
 * 合并 = 纯 union（无归档排除）。
 *
 * 调用方（checklist.mjs）通过 flushWrite 的 opts 注入：reread（磁盘无写回重读）、
 * doneFile 路径、isDone（目标文件是否为 done 文件）——避免本模块反向依赖 checklist
 * 的 parse/树结构。
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"

const baselines = new Map() // filePath → 最近一次读的 stat mtime（null = 读时文件缺失）

/** F4 测试缝（伪属主范式——T-F4a..d）：在每次写前门控处注入"对端写盘"钩子——模拟本链
 *  parse 后、write 前对端实例的真实并发写。生产不设置（null → 零行为影响）。 */
let writeGateHook = null
export function _setWriteGateHookForTest(fn) { writeGateHook = fn }

/** 文件缺失 → null（门控 t0 基线形态）。 */
export function statMtime(p) {
  try { return statSync(p).mtimeMs } catch { return null }
}

/** 调用方（parse 读链）登记基线——读后写链以它为门控比对基准。 */
export function noteReadBaseline(filePath, mtime) {
  baselines.set(filePath, mtime)
}

/** Done 文件归档根 ID 清单（含子任务点号 ID：T1 与 T1.2 都进——归档排除用；编号预留
 *  nextRootId 的 /^T(\d+)$/ 过滤不受影响）。 */
export function readDoneRoots(doneFile) {
  if (!existsSync(doneFile)) return []
  const roots = []
  for (const line of readFileSync(doneFile, "utf-8").split("\n")) {
    const m = line.match(/^- \[.\] ((?:T\d+)(?:\.\d+)*): /)
    if (m) roots.push({ id: m[1] })
  }
  return roots
}

/** Serialize items to markdown lines (2-space indent per depth) — tree structure preserved. */
function renderItems(nodes, depth, out) {
  const indent = "  ".repeat(depth)
  for (const item of nodes) {
    const mark = item.status === "done" ? "x" : item.status === "in_progress" ? "~" : " "
    const label = item.id ? `${item.id}: ${item.text}` : item.text
    out.push(`${indent}- [${mark}] ${label}`)
    if (item.children?.length) renderItems(item.children, depth + 1, out)
  }
}

/**
 * 门控 + 合并 + 写（F4 收口——parse 规范化写回 / add / mark 双写都经它）。
 * @param filePath 目标文件（checklist.md 或 checklist-done.md）
 * @param items 本端（读-改-写链产物）的顶层 items
 * @param opts.reread 磁盘无写回重读函数（返回盘上顶层 items——合并触发时调用）
 * @param opts.doneFile done 文件路径（checklist 合并的归档排除源）
 * @param opts.isDone 目标文件是否为 done 文件（true = 纯 union，无归档排除）
 * @returns { merged, items }——merged=true 时 items 为落盘真相（本端节点原地重分配——
 *   调用方持有的引用/消息读到的即最终 ID）；merged=false 时 items 为原输入。
 */
export function flushWrite(filePath, items, { reread, doneFile, isDone }) {
  if (writeGateHook) writeGateHook(filePath) // 测试缝：模拟对端此刻写盘
  const base = baselines.get(filePath) // undefined = 本链无读（防御——无基线无从门控）
  const now = statMtime(filePath)
  let finalItems = items
  let merged = false
  if (base !== undefined && now !== base) {
    // 磁盘被对端并发改过（本链读后）→ 重读磁盘 + 合并（ID union）
    const diskItems = reread()
    finalItems = mergeItems(diskItems, items, doneFile, isDone)
    merged = true
  }
  const out = []
  renderItems(finalItems, 0, out)
  writeFileSync(filePath, out.join("\n") + "\n")
  baselines.set(filePath, statMtime(filePath)) // 自写后刷新基线（防自写误判并发）
  return { merged, items: finalItems }
}

// ── F4 合并（ID 键 union）─────────────────────────────────────────────────────

function flattenTree(nodes, out = []) {
  for (const n of nodes) {
    out.push(n)
    if (n.children?.length) flattenTree(n.children, out)
  }
  return out
}

/** 层内递归合并（磁盘序在前；本端独有/重分配项追加尾部）——规则见文件头注释。 */
function mergeLevel(diskNodes, ourNodes, env) {
  const diskById = new Map(diskNodes.filter((n) => n.id != null).map((n) => [n.id, n]))
  const ourById = new Map(ourNodes.filter((n) => n.id != null).map((n) => [n.id, n]))
  const result = []
  const pending = [] // 本端独有 + 同 ID 异文本（待重分配）——追加在磁盘序之后
  for (const d of diskNodes) {
    if (d.id != null && !env.isDone && env.doneIds.has(d.id)) continue // 已归档（对端 mark-done）→ 不复活
    const o = d.id != null ? ourById.get(d.id) : null
    if (!o) { result.push(d); continue } // 盘上独有 → 整棵保留
    const childEnv = { ...env, prefix: `${d.id}.` } // 子层重分配域 = 父 ID 前缀（"T1" → "T1."）
    if (o.text === d.text && o.status === d.status) {
      // 双端同一节点（parse 规范化幂等场景）→ 去重；子树仍逐层合并（防丢任一端子新增）
      d.children = mergeLevel(d.children ?? [], o.children ?? [], childEnv)
      result.push(d)
      continue
    }
    if (o.text === d.text) {
      // 仅状态不同 → in_progress 胜过 pending（标记意图不丢；同文本不可能 pending×pending）
      const carry = d.status === "in_progress" ? d : o
      carry.children = mergeLevel(d.children ?? [], o.children ?? [], childEnv)
      result.push(carry)
      continue
    }
    // 同 ID 不同文本（并发 add 各自从同基线分到同号）→ 盘上保留；本端项排队重分配
    result.push(d)
    pending.push(o)
  }
  for (const o of ourNodes) {
    if (o.id == null) { pending.push(o); continue } // 无 ID 行（理论极少——parse 已归一）→ 原样追加
    if (!env.isDone && env.doneIds.has(o.id)) continue // 本端项已被归档 → 丢弃（不复活）
    if (!diskById.has(o.id)) pending.push(o) // 本端独有 → 保留（含子树）
    // 共享 ID 已在磁盘循环处理（去重/状态/文本冲突排队）
  }
  for (const o of pending) {
    if (o.id != null && diskById.has(o.id)) reassignNode(o, env) // 文本冲突项 → 重分配 max+1 续分配
    result.push(o)
  }
  return result
}

/** 重分配：层前缀（根 "T" / 子树 `${parentId}.`）下 max+1；子树 ID 前缀同步换新
 *  （"T4.1" → "T5.1"——ID 层级与父节点保持一致）。原地改——调用方引用即最终 ID。 */
function reassignNode(node, env) {
  let max = 0
  for (const id of env.allIds) {
    if (!id?.startsWith(env.prefix)) continue
    const suffix = id.slice(env.prefix.length)
    if (/^\d+$/.test(suffix)) max = Math.max(max, parseInt(suffix))
  }
  const oldId = node.id
  const newId = `${env.prefix}${max + 1}`
  node.id = newId
  env.allIds.add(newId)
  if (oldId) renameSubtreePrefixes(node, oldId, newId)
}

function renameSubtreePrefixes(node, oldId, newId) {
  for (const c of node.children ?? []) {
    if (c.id?.startsWith(`${oldId}.`)) {
      c.id = newId + c.id.slice(oldId.length)
      renameSubtreePrefixes(c, oldId, newId)
    }
  }
}

/** 合并入口：isDone = checklist-done 文件（纯 union——无归档排除）；否则按 done 文件
 *  当前归档 ID 排除（含点号子 ID——对端 mark-done 归档的项不因本端旧 parse 复活）。 */
function mergeItems(diskItems, ourItems, doneFile, isDone) {
  const doneRoots = isDone ? [] : readDoneRoots(doneFile)
  const doneIds = new Set(doneRoots.map((r) => r.id))
  const allIds = new Set() // 重分配 max 计算域：双端全树 + 归档根（根层防撞）
  for (const n of flattenTree(diskItems).concat(flattenTree(ourItems))) {
    if (n.id != null) allIds.add(n.id)
  }
  for (const id of doneIds) allIds.add(id)
  const env = { isDone, doneIds, allIds, prefix: "T" } // 根层前缀 "T"；子层在 mergeLevel 递归时推导
  return mergeLevel(diskItems, ourItems, env)
}
