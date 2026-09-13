import { readFileSync, existsSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { DESC } from "./shared.mjs"
// F4 并发写同步机（门控 + ID union 合并 + 序列化）在 checklist-sync.mjs——本文件只留
// parse/树操作与工具执行；设计见 MULTI-INSTANCE-COLLAB.md §2a.3（D-F4a/b）。
import { statMtime, noteReadBaseline, readDoneRoots, flushWrite } from "./checklist-sync.mjs"

const CHECKLIST = "checklist.md"
const DONE = "checklist-done.md"

function checklistPath(cwd) { return join(cwd, ".thincoder", CHECKLIST) }
function donePath(cwd) { return join(cwd, ".thincoder", DONE) }

/**
 * Parse checklist file into tree-structured items.
 * Indentation (2 spaces per level) determines parent-child relationships.
 * Each item: { id, index, depth, status, text, children[] }
 * "index" is the 1-based position in the flat markdown list.
 */
function parse(filePath) {
  return readItems(filePath, { writeback: true })
}

/** 读盘 → 建树 → 无 ID 行一次性分配（assignIds）；writeback=true 时（公开 parse 语义）
 *  分配后立即经 write() 落盘（同走 F4 门控——并发写合并/放弃重分配）。基线在**读前**
 *  stat（stat→read 序：对端在读与 stat 微窗口写入只造成假合并，绝不漏检静默覆盖）。 */
function readItems(filePath, { writeback }) {
  const base = statMtime(filePath) // 基线 = 本链最近 stat（评审修正 #6）
  let text = null
  try {
    if (existsSync(filePath)) text = readFileSync(filePath, "utf-8")
  } catch { text = null } // 读失败（对端删/半写）→ 按缺失降级
  noteReadBaseline(filePath, text === null ? null : base)
  if (text === null) return []
  const lines = text.split("\n")
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
    const text2 = m[3].trim()

    // Strip ALL leading "T[\d.]+:" tokens (historical dirty data can accumulate
    // "T15: T15: T15:"); keep the first token as the ID and the rest as text.
    let id = null
    let bareText = text2
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
        n.id = parentId ? nextChildId(parentId, nodes, doneIds) : nextRootId(nodes, doneRoots)
        assigned = true
      }
      if (n.children?.length) assignIds(n.children, n.id)
    }
  }
  // Root IDs archived to the done file also reserve numbers (mirrors the `add`
  // path's double-file scan), so auto-assigned IDs never collide with them.
  const doneRoots = readDoneRoots(join(dirname(filePath), DONE))
  const doneIds = doneRoots.map((r) => r.id) // 含点号子 ID——子层分配同样预留
  assignIds(items, null)
  if (writeback && assigned) {
    // 规范化写回（同走门控——F4）：合并发生时返回落盘真相——调用方（add/mark/list）在
    // 磁盘真值上继续，避免基于过期 parse 再触发一轮合并
    const r = write(filePath, items)
    if (r.merged) return r.items
  }
  return items
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

function nextChildId(parentId, children, archivedIds) {
  let max = 0
  const prefix = `${parentId}.`
  for (const c of children) {
    if (c.id?.startsWith(prefix)) {
      const suffix = c.id.slice(prefix.length)
      if (/^\d+$/.test(suffix)) max = Math.max(max, parseInt(suffix))
    }
  }
  // 归档预留（F4 补正）：已归档同前缀点号 ID 不复用——重加子项撞归档 ID 会被门控合并误删
  for (const id of archivedIds ?? []) {
    if (typeof id !== "string" || !id.startsWith(prefix)) continue
    const suffix = id.slice(prefix.length)
    if (/^\d+$/.test(suffix)) max = Math.max(max, parseInt(suffix))
  }
  return `${prefix}${max + 1}`
}

/** Write items back to file, preserving tree structure — F4 收口点（门控 + 合并见
 *  checklist-sync.mjs flushWrite）。返回 { merged, items }（同 flushWrite 契约）。 */
function write(filePath, items) {
  mkdirSync(dirname(filePath), { recursive: true })
  return flushWrite(filePath, items, {
    reread: () => readItems(filePath, { writeback: false }), // 合并用磁盘重读（无写回）
    doneFile: join(dirname(filePath), DONE), // checklist 合并的归档排除源
    isDone: filePath.endsWith(DONE), // done 文件自身 = 纯 union
  })
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
  description: DESC("checklist"),
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

        // 归档预留（根 + 点号子 ID——add 父/子都扫 done 文件；防撞号 + 防合并误删）
        const doneItems = parse(donePath(ctx.cwd))
        const id = parentId
          ? nextChildId(parentId, target, doneItems.map((i) => i.id))
          : nextRootId(items, doneItems)
        const node = { id, index: 0, depth: parentId ? 1 : 0, status: "pending", text: args.item, children: [] }
        target.push(node)
        write(checklistPath(ctx.cwd), items)
        // F4：合并可能原地重分配本端新项（并发同号）——以 node.id（落盘真相）报回
        return `Added: [ ] ${node.id}: ${args.item}${parentId ? ` (under ${parentId})` : ""}`
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
