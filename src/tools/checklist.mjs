/**
 * checklist.mjs — persistent task checklist (.thincoder/checklist.md)
 * Ported from CLI thincoder/src/tools/checklist.mjs (DESC file-read replaced with inline description).
 * Manages a tree-structured checklist; done items auto-archive to checklist-done.md.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs"
import { join, dirname } from "node:path"

const CHECKLIST = "checklist.md"
const DONE = "checklist-done.md"

function checklistPath(cwd) { return join(cwd, ".thincoder", CHECKLIST) }
function donePath(cwd) { return join(cwd, ".thincoder", DONE) }

// ─── R10 F4（MULTI-INSTANCE-COLLAB.md D-F4a）：并发写防护——写前 mtime 门控 ─────
// 每路径基线 = 本读-改-写链内最近一次 stat 的 mtime（parse 读时记录、write 自写后刷新
// ——评审修正 #6：parse 规范化写回 → add 链的自写不误触发 merged/重分配）。
// 按绝对路径记录：不同 cwd 的 checklist 文件互不干扰；测试每例用独立 tmp 目录无残留。
const baselines = new Map() // filePath → { mtimeMs, size } | null（null = 读时文件缺失）

/** stat 元组（mtimeMs + size——同 tick 快写 mtime 可能相同（实测 NTFS 亚毫秒窗）——
 *  size 兜底：内容变长/变短必然 size 差；等长同刻替换才漏——与会话层 mtime 门控同量级 */
function statTuple(filePath) {
  try {
    const s = statSync(filePath)
    return { mtimeMs: s.mtimeMs, size: s.size }
  } catch { return null }
}

/**
 * Parse checklist file into tree-structured items.
 * Indentation (2 spaces per level) determines parent-child relationships.
 * Each item: { id, index, depth, status, text, children[] }
 * "index" is the 1-based position in the flat markdown list.
 * 纯读 + 内存补 ID——无磁盘副作用（write-back 由 parse 决定；merge 重读用它防递归写）。
 * 返回 { items, assigned }——assigned = 本次补了缺失 ID（调用方决定是否 write-back）。
 */
function readItems(filePath) {
  if (!existsSync(filePath)) return { items: [], assigned: false }
  const lines = readFileSync(filePath, "utf-8").split("\n")
  const items = []
  let flatIdx = 0
  const stack = [{ children: items, depth: -1 }] // virtual root

  for (const line of lines) {
    const m = line.match(/^(\s*)- \[(.)\] (.+)$/)
    if (!m) continue
    flatIdx++
    const indent = m[1]
    const depth = Math.floor(indent.length / 2) // 2 spaces = 1 level
    const raw = m[2]
    const status = raw === "x" ? "done" : raw === "~" ? "in_progress" : "pending"
    const text = m[3].trim()

    // Strip ALL leading "T[\d.]+:" tokens (historical dirty data can accumulate
    // "T15: T15: T15:"); keep the first token as the ID and the rest as text.
    let id = null
    let bareText = text
    let idTok
    while ((idTok = bareText.match(/^(T[\d.]+):\s*/))) {
      if (id == null) id = idTok[1]
      bareText = bareText.slice(idTok[0].length)
    }
    const node = { id, index: flatIdx, depth, status, text: bareText, children: [] }

    // Find parent by popping stack until we find a node at depth-1
    while (stack.length > 1 && stack.at(-1).depth >= depth) stack.pop()
    const parent = stack.at(-1)
    parent.children.push(node)
    stack.push({ children: node.children, depth, id: node.id })
  }

  // Assign stable IDs to lines that lacked an explicit one, exactly once.
  // IDs are "max existing number + 1" (not position-based) so gaps left by
  // archived items never collide, and persisted IDs never drift on re-read.
  let assigned = false
  function assignIds(nodes, parentId) {
    for (const n of nodes) {
      if (!n.id) {
        n.id = parentId ? nextChildId(parentId, nodes) : nextRootId(nodes, doneRoots)
        assigned = true
      }
      if (n.children?.length) assignIds(n.children, n.id)
    }
  }
  // Root IDs archived to the done file also reserve numbers (mirrors the `add`
  // path's double-file scan), so auto-assigned IDs never collide with them.
  const doneRoots = readDoneRoots(join(dirname(filePath), DONE))
  assignIds(items, null)
  return { items, assigned }
}

/**
 * Parse checklist file（读链入口——R10 F4）：stat-then-read 记基线 → 纯读 → 补 ID 落盘
 * （规范化写回——有并发写时门控合并）。合并发生时返回合并后 items（调用方以合并结果
 * 为准——评审修正 #6：自写刷新基线 → 链内后续写不误判并发）。
 * export：单元测试直接编排 读→seedFile→写 链（R10 F4 伪并发用例——工具层无法在
 * parse 与 write 之间注入 seed）。
 */
export function parse(filePath) {
  baselines.set(filePath, statTuple(filePath))
  const { items, assigned } = readItems(filePath)
  if (assigned) {
    const res = write(filePath, items)
    if (res.merged) return res.items
  }
  return items
}

function readDoneRoots(doneFile) {
  if (!existsSync(doneFile)) return []
  const roots = []
  for (const line of readFileSync(doneFile, "utf-8").split("\n")) {
    const m = line.match(/^- \[.\] (T\d+): /)
    if (m) roots.push({ id: m[1] })
  }
  return roots
}

function nextRootId(items, doneItems) {
  let max = 0
  for (const list of [items, doneItems]) {
    for (const c of list ?? []) {
      const m = c.id?.match(/^T(\d+)$/)
      if (m) max = Math.max(max, parseInt(m[1]))
    }
  }
  return `T${max + 1}`
}

function nextChildId(parentId, children) {
  let max = 0
  const prefix = `${parentId}.`
  for (const c of children) {
    if (c.id?.startsWith(prefix)) {
      const suffix = c.id.slice(prefix.length)
      if (/^\d+$/.test(suffix)) max = Math.max(max, parseInt(suffix))
    }
  }
  return `${prefix}${max + 1}`
}

/** Status join（R10 F4 done union——"done 集合 union"格子：done > in_progress > pending，
 *  匹配项双方状态取并（任一方 done → done；否则任一方 in_progress → in_progress）。 */
const STATUS_LEVEL = { pending: 0, in_progress: 1, done: 2 }
function joinStatus(a, b) {
  return (STATUS_LEVEL[a] ?? 0) >= (STATUS_LEVEL[b] ?? 0) ? a : b
}

/** 重分配 ID（R10 F4 T-F4b：并发 add 同号——盘上保留原 ID、本端项 max+1 续分配）。
 *  候选 = 本端全部项 ∪ 盘上同层项 ∪（根层）done 文件归档根号——绝不复用任何一方占用号
 *  （含本链 parse 刚给后续行分配的号——遍历全部 ourItems 而非仅已合并前缀）。 */
function allocId(ourItems, disk, doneIds, parentId) {
  const ids = [...ourItems.map((i) => i.id), ...disk.map((d) => d.id)]
  if (!parentId && doneIds) ids.push(...doneIds)
  if (parentId) {
    const prefix = `${parentId}.`
    let max = 0
    for (const id of ids) {
      if (typeof id === "string" && id.startsWith(prefix) && /^\d+$/.test(id.slice(prefix.length))) {
        max = Math.max(max, parseInt(id.slice(prefix.length)))
      }
    }
    return `${prefix}${max + 1}`
  }
  let max = 0
  for (const id of ids) {
    const m = typeof id === "string" ? id.match(/^T(\d+)$/) : null
    if (m) max = Math.max(max, parseInt(m[1]))
  }
  return `T${max + 1}`
}

/** 重分配后子树子 ID 前缀改写（T5.1 → T7.1——父号 T5 → T7） */
function rePrefixChildren(nodes, fromId, toId) {
  const prefix = `${fromId}.`
  for (const n of nodes) {
    if (typeof n.id === "string" && n.id.startsWith(prefix)) n.id = `${toId}${n.id.slice(fromId.length)}`
    if (n.children?.length) rePrefixChildren(n.children, fromId, toId)
  }
}

/**
 * R10 F4（MULTI-INSTANCE-COLLAB.md D-F4a）双方 items union by ID：
 *   - 基线 = 本端（内存）结构；匹配项按 ID 对齐——同 ID 同文本：保留本端 + 状态 join +
 *     子树递归合并（他端同父下新增子项追加）；同 ID 不同文本（并发 add 同号）：盘上保留
 *     原 ID（整体并入结果末尾）、本端项重分配 max+1（子树不并入对方——防子项双份）。
 *   - 盘上独有项（他端新增）追加到同级末尾——不丢项。
 *   - done 文件过滤（仅 checklist.md 根层；checklist-done.md 是纯追加文件不适用）：
 *     归档过的 ID（本链刚 archive 的 + 他端并发 archive 的——done 文件是合并后最新态）
 *     不复活——双向：本端已移除项不被盘复活；他端已移除项（本端内存还有）从基线剔除。
 *     无此过滤时并发 mark 会让归档项以 pending 状态复活回 checklist（与 done 文件双份）。
 *   - children 归并递归（过滤仅根层——归档总是整子树随根走，子层无需过滤）。
 */
function mergeTrees(ourItems, diskItems, doneIds, parentId = null) {
  const diskById = new Map(diskItems.map((d) => [d.id, d]))
  const result = []
  const present = new Set()
  for (const item of ourItems) {
    if (item.id == null) continue // readItems 已补 ID——防御性跳过
    if (doneIds && doneIds.has(item.id)) continue // 他端已归档移除——本端内存残留不复活
    const d = diskById.get(item.id)
    if (d) {
      if (d.text === item.text) {
        if (item.status !== d.status) item.status = joinStatus(item.status, d.status)
        if (item.children?.length || d.children?.length) {
          item.children = mergeTrees(item.children ?? [], d.children ?? [], null, item.id)
        }
      } else {
        // 同 ID 不同内容——盘上保留原 ID，本端项重分配（max+1 续分配——T-F4b）
        const prevId = item.id
        item.id = allocId(ourItems, diskItems, doneIds, parentId)
        if (item.id !== prevId && item.children?.length) {
          // 父号变了——子树子 ID 前缀跟随（防与盘上同号项（保留原号整棵并入）撞子号）
          rePrefixChildren(item.children, prevId, item.id)
        }
      }
    }
    present.add(item.id)
    result.push(item)
  }
  for (const d of diskItems) {
    if (d.id == null || present.has(d.id)) continue
    if (doneIds && doneIds.has(d.id)) continue // 本链已归档移除——不复活
    present.add(d.id)
    result.push(d)
  }
  return result
}

/** 行级纯渲染（原 write 递归组装的等价抽取——输出字节不变） */
function assemble(nodes, depth, lines) {
  const indent = "  ".repeat(depth)
  for (const item of nodes) {
    const mark = item.status === "done" ? "x" : item.status === "in_progress" ? "~" : " "
    const label = item.id ? `${item.id}: ${item.text}` : item.text
    lines.push(`${indent}- [${mark}] ${label}`)
    if (item.children?.length) assemble(item.children, depth + 1, lines)
  }
}

/**
 * Write items back to file, preserving tree structure.
 * R10 F4（D-F4a）写前 mtime 门控：磁盘 mtime ≠ 本链基线（并发方改过）→ 重读磁盘 +
 * ID union 合并（见 mergeTrees）→ 重写。返回 { merged, items }——merged 标记本次走了
 * 合并（调用方/parse 以合并后 items 为准——add/mark 的返回串在 write 之后取 node.id，
 * 重分配结果自然反映）。自写后刷新基线（评审修正 #6——防自写误判并发）。
 * export：单元测试直接编排 读→seedFile→写 链（R10 F4 伪并发用例）。
 */
export function write(filePath, items) {
  mkdirSync(dirname(filePath), { recursive: true })
  let merged = false
  if (baselines.has(filePath)) {
    const base = baselines.get(filePath)
    const now = statTuple(filePath)
    const same = (base === null && now === null)
      || (base !== null && now !== null && base.mtimeMs === now.mtimeMs && base.size === now.size)
    if (!same) {
      // 磁盘被并发方改过——重读磁盘 + 合并（checklist-done.md 纯追加不套 done 过滤）
      const { items: diskItems } = readItems(filePath)
      const doneIds = filePath.endsWith(`/${CHECKLIST}`) || filePath.endsWith(`\\${CHECKLIST}`)
        ? new Set(readDoneRoots(join(dirname(filePath), DONE)).map((r) => r.id))
        : null
      items = mergeTrees(items, diskItems, doneIds)
      merged = true
    }
  }
  const lines = []
  assemble(items, 0, lines)
  writeFileSync(filePath, lines.join("\n") + "\n")
  baselines.set(filePath, statTuple(filePath)) // 自写后刷新基线
  return { merged, items }
}

/** Find a node by ID in the tree */
function findById(items, id) {
  for (const item of items) {
    if (item.id === id) return { parent: items, item, idx: items.indexOf(item) }
    if (item.children?.length) {
      const found = findById(item.children, id)
      if (found) return found
    }
  }
  return null
}

/** Flatten tree for mark action (index-based) */
function flatten(items, out = []) {
  for (const item of items) {
    out.push(item)
    if (item.children?.length) flatten(item.children, out)
  }
  return out
}

/** True if every descendant (children, grandchildren, …) is done. */
function allChildrenDone(node) {
  for (const c of node.children ?? []) {
    if (c.status !== "done" || !allChildrenDone(c)) return false
  }
  return true
}

/** Recursively clone a subtree for archiving, forcing every status to done. */
function archiveSubtree(node) {
  return {
    id: node.id,
    index: 0,
    depth: 0,
    status: "done",
    text: node.text,
    children: (node.children ?? []).map(archiveSubtree),
  }
}

/** Parse pending items only (for context injection) */
export function pendingItems(cwd) {
  const flat = flatten(parse(checklistPath(cwd)))
  return flat.filter(i => i.status !== "done")
}

export const checklistTool = {
  name: "checklist",
  description:
    "Manage the persistent task checklist in .thincoder/checklist.md. " +
    "Items support tree hierarchy via indentation (2 spaces per level) and auto-assigned IDs (T1, T1.1). " +
    "Completed items are auto-archived to .thincoder/checklist-done.md.\n" +
    "Parameters:\n" +
    "- action (required): 'add' | 'mark' | 'list'\n" +
    "- id: task ID to mark, e.g. 'T3' (preferred — use the ID returned by 'add')\n" +
    "- item: item text (required for add)\n" +
    "- index: 1-based item index (fallback for mark, only when id is absent)\n" +
    "- status: 'pending' | 'in_progress' | 'done' (required for mark)\n" +
    "- parent: parent task ID for tree-structured tasks (e.g. 'T1')\n" +
    "Note: marking a parent 'done' requires all its children already done — otherwise rejected (complete children first). " +
    "For in-session subtask breakdown of a single checklist item, use the task tool instead.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["add", "mark", "list"],
        description: "add a new item / mark item status / list all items"
      },
      id: {
        type: "string",
        description: "Task ID to mark (preferred — use the ID returned by add, e.g. 'T3')"
      },
      item: {
        type: "string",
        description: "Item text (required for add)"
      },
      index: {
        type: "number",
        description: "1-based item index (fallback for mark, only when id is absent)"
      },
      status: {
        type: "string",
        enum: ["pending", "in_progress", "done"],
        description: "New status (required for mark)"
      },
      parent: {
        type: "string",
        description: "Parent task ID for tree-structured tasks (e.g. 'T1')"
      },
    },
    required: ["action"],
  },
  readonly: false,
  execute(args, ctx) {
    switch (args.action) {
      case "add": {
        if (!args.item || typeof args.item !== "string") return "Error: 'item' is required for add"
        const items = parse(checklistPath(ctx.cwd))

        let target = items
        let parentId = null
        if (args.parent) {
          const found = findById(items, args.parent)
          if (!found) return `Error: parent '${args.parent}' not found. Use 'list' to see all task IDs.`
          target = found.item.children
          parentId = found.item.id
        }

        const id = parentId ? nextChildId(parentId, target) : nextRootId(items, parse(donePath(ctx.cwd)))
        const node = { id, index: 0, depth: parentId ? 1 : 0, status: "pending", text: args.item, children: [] }
        target.push(node)
        write(checklistPath(ctx.cwd), items)
        // 返回串在 write 之后取 node.id——并发合并重分配后以合并结果为准（D-F4a：
        // add/mark 的结果以合并后为准；无并发时与预分配 id 相同——零行为变化）
        return `Added: [ ] ${node.id}: ${node.text}${parentId ? ` (under ${parentId})` : ""}`
      }
      case "mark": {
        if (args.id == null && args.index == null) return "Error: 'id' or 'index' is required for mark"
        const status = args.status
        if (!status || !["pending", "in_progress", "done"].includes(status)) return "Error: 'status' is required (pending|in_progress|done)"
        const cp = checklistPath(ctx.cwd)
        const items = parse(cp)
        let item
        if (args.id != null) {
          const found = findById(items, args.id)
          if (!found) return `Error: id '${args.id}' not found. Use 'list' to see all task IDs.`
          item = found.item
        } else {
          const flat = flatten(items)
          if (args.index < 1 || args.index > flat.length) return `Error: index ${args.index} out of range (1-${flat.length})`
          item = flat[args.index - 1]
        }
        const old = item.status
        if (old === status) return `Already ${status}: ${item.text}`
        if (status === "done" && item.children?.length && !allChildrenDone(item)) {
          return "Error: 父任务仍有未完成的子任务，先处理子任务再标父 done"
        }
        item.status = status
        if (status === "done") {
          // Move the whole subtree to the done file (hierarchy preserved).
          const dp = donePath(ctx.cwd)
          const doneItems = parse(dp)
          doneItems.push(archiveSubtree(item))
          write(dp, doneItems)
          // Remove the subtree from the tree.
          const found = findById(items, item.id)
          if (found) found.parent.splice(found.idx, 1)
        }
        write(cp, items)
        return `Marked ${item.id} ${old} → ${status}`
      }
      case "list": {
        const items = parse(checklistPath(ctx.cwd))
        if (items.length === 0) return "(checklist is empty)"
        const marks = { pending: " ", in_progress: "~", done: "x" }
        const lines = []
        function render(nodes, depth) {
          const indent = "  ".repeat(depth)
          for (const n of nodes) {
            const idTag = n.id ? `${n.id}: ` : ""
            lines.push(`${indent}- [${marks[n.status]}] ${idTag}${n.text}`)
            if (n.children?.length) render(n.children, depth + 1)
          }
        }
        render(items, 0)
        return lines.join("\n")
      }
      default:
        return `Error: unknown action '${args.action}'`
    }
  },
}
