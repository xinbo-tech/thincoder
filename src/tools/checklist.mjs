import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { DESC } from "./shared.mjs"

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
  if (!existsSync(filePath)) return []
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
  if (assigned) write(filePath, items)

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

/** Write items back to file, preserving tree structure */
function write(filePath, items, _depth = 0) {
  if (_depth === 0) mkdirSync(dirname(filePath), { recursive: true })
  const lines = []
  const indent = "  ".repeat(_depth)
  for (const item of items) {
    const mark = item.status === "done" ? "x" : item.status === "in_progress" ? "~" : " "
    const label = item.id ? `${item.id}: ${item.text}` : item.text
    lines.push(`${indent}- [${mark}] ${label}`)
    if (item.children?.length) {
      lines.push(...write(filePath, item.children, _depth + 1).split("\n").filter(Boolean))
    }
  }
  if (_depth === 0) {
    writeFileSync(filePath, lines.join("\n") + "\n")
    return ""
  }
  return lines.join("\n")
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

        const id = parentId ? nextChildId(parentId, target) : nextRootId(items, parse(donePath(ctx.cwd)))
        const node = { id, index: 0, depth: parentId ? 1 : 0, status: "pending", text: args.item, children: [] }
        target.push(node)
        write(checklistPath(ctx.cwd), items)
        return `Added: [ ] ${id}: ${args.item}${parentId ? ` (under ${parentId})` : ""}`
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
