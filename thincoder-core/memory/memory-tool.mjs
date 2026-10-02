/**
 * memory/memory-tool.mjs — memory agent 工具面（自 `memory/docs.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786）。
 * 内容 = `MEMORY_ACTIONS` ∥ `MEMORY_LAYERS` ∥ 校验 / 格式化小件 ∥ `memoryTools`（单一 `memory` 工具，
 * 五 action）+ 各 action 执行器（`execSearch` / `execPut` / `execList` / `execDelete` / `execDeleteSingle`
 * / `execClear`）——迁出块逐字；原档 `memory/docs.mjs` 经 `export { … } from` 转口保名
 * （消费链 `memory.mjs → docs.mjs → memory-tool.mjs` 零改）。
 */
import { isAbsolute, join } from "node:path"
import { put, search, putMarkdown, clearPersonal } from "./core.mjs"
import { deleteByUid, matchMemoryRows, deleteWhere } from "./delete.mjs"
import { commitAndPush } from "../git/gitmem.mjs"
import { DESC } from "../tools/shared.mjs" // #15 描述外置：文本单点 = tool-docs/memory.md

// ---------------------------------------------------------------- agent tools

/** §6 shared tool surface — action enum / parameter shapes / output contract shared with the
 *  VS Code face (`thincoder-vscode/src/memory-tool.mjs`); the description is a per-end form —
 *  core text lives in `tool-docs/memory.md` (DESC() load; #15 外置). Layer VALUES per end
 *  (VS Code has no team layer and rejects it with CLI guidance). */
const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const MEMORY_LAYERS = ["personal", "project", "team"]

function validateTypeFilter(type) {
  if (type === undefined || type === null || type === "") return null
  const t = String(type)
  if (!["rule", "knowledge", "decision", "pattern"].includes(t)) throw new Error(`Invalid memory type "${t}"; expected one of: rule, knowledge, decision, pattern`)
  return t
}

function normalizeLimit(limit, dflt) {
  const n = Number(limit)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt
}

function fmtDate(ts) {
  return ts ? new Date(ts).toISOString().slice(0, 10) : "?"
}

const listRowLine = (r) => `[${r.layer}] ${r.id} [${r.type}] ${r.title}（${fmtDate(r.ts)}）`

/**
 * Generate the memory agent tool — ONE `memory` tool with five actions (MEMORY.md §6 D-M1).
 * search/list are read-only actions (planMode pass / no permission ask — dispatch classifies
 * them action-level, same as subagent check/status); put keeps its side-effect permission
 * gate; batch delete/clear gate on confirm:true + layer inside the tool (direct-delete
 * ruling — the confirm parameter IS the gate) and stay non-readonly like the retired tools.
 * opts: { cwd, projectDir, author, team: { dir, name } | null }
 */
export function memoryTools(memory, opts = {}) {
  const projectDir = opts.projectDir ? (isAbsolute(opts.projectDir) ? opts.projectDir : join(opts.cwd ?? process.cwd(), opts.projectDir)) : null
  // §6.11：dirs 保持原样（目录 I/O 基准）——归一落在各公共入口内（写缝 syncDir / indexMarkdownFile、
  // 删缝 deleteByUid / matchMemoryRows、读缝 search / fetchEntry）⇒ 逐入口一行，非工具层预归一。
  const dirs = { project: projectDir, team: opts.team?.dir ?? null }
  return [
    {
      name: "memory",
      description: DESC("memory"), // #15 外置：文本单点 = tool-docs/memory.md
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: MEMORY_ACTIONS, description: "Operation to run (required)" },
          layer: { type: "string", enum: MEMORY_LAYERS, description: "The memory layer: personal (private), project (shared via this repo's .thincoder/memory/), team (CLI only). Same concept as the [layer] tag and the id prefix on search/list result rows. put/search/list: optional (put defaults to personal; search/list omit = all layers). single delete: optional (omit = route by id prefix). batch delete/clear: required" },
          type: { type: "string", enum: ["rule", "knowledge", "decision", "pattern"], description: "Entry type: put = what to save; list/delete batch = filter by type" },
          title: { type: "string", description: "put: short title" },
          content: { type: "string", description: "put: full content to remember" },
          tags: { type: "string", description: "put: space-separated tags" },
          query: { type: "string", description: "search: natural-language query" },
          keyword: { type: "string", description: "list/delete batch: filter matching title/content" },
          id: { type: "string", description: "delete single: the entry id from put/search/list output" },
          limit: { type: "number", description: "Max rows: list 50 by default, search 5 by default" },
          confirm: { type: "boolean", description: "delete batch/clear: must be true — without it the tool refuses" },
        },
        required: ["action"],
      },
      readonly: false,
      async execute(args) {
        const action = String(args?.action ?? "")
        if (!MEMORY_ACTIONS.includes(action)) {
          throw new Error(`memory: unknown action "${action}" — expected one of: ${MEMORY_ACTIONS.join("/")}`)
        }
        switch (action) {
          case "search": return execSearch(memory, args)
          case "put": return execPut(memory, args, opts, dirs)
          case "list": return execList(memory, args, dirs)
          case "delete": return execDelete(memory, args, dirs)
          case "clear": return execClear(memory, args)
        }
      },
    },
  ]
}

/** action search — the retired search tool surface (read-only, same output contract). */
async function execSearch(memory, args) {
  const layer = args.layer
  if (layer !== undefined && layer !== null && !MEMORY_LAYERS.includes(String(layer))) {
    throw new Error(`memory search: invalid layer "${layer}"`)
  }
  const query = String(args.query ?? "").trim()
  if (!query) return "(no matching memories)" // 空 query 短路——两端同语义（评审 code review #4）
  const limit = normalizeLimit(args.limit, 5)
  let results
  if (!layer) {
    results = await search(memory, query, { limit })
  } else {
    // layer filter: oversample then slice the requested layer (results keep global rank order).
    // 窗口 = max(limit*4, 20) 是召回上限——大库 + 高 limit 时该层结果可能不足 limit（接受的取舍——评审 code review #3）
    const wide = await search(memory, query, { limit: Math.max(limit * 4, 20) })
    results = wide.filter((r) => r.layer === String(layer)).slice(0, limit)
  }
  if (results.length === 0) return "(no matching memories)"
  return results.map((r) => `[${r.layer}][${r.type}] ${r.title} (id=${r.id})\n${r.content}`).join("\n\n")
}

/** action put — the retired put tool surface (side-effect gate, unchanged semantics). */
async function execPut(memory, args, opts, dirs) {
  const layer = String(args.layer ?? "personal")
  if (!MEMORY_LAYERS.includes(layer)) throw new Error(`memory put: invalid layer "${layer}"`)
  if (layer === "personal") {
    const id = await put(memory, { type: args.type, title: args.title, content: args.content, tags: args.tags ?? "" })
    return `Saved to personal memory (id=personal:${id}): [${args.type}] ${args.title}`
  }
  if (layer === "project") {
    if (!dirs.project) throw new Error("project layer unavailable: no project directory configured")
    const filename = await putMarkdown(memory, {
      layer: "project",
      dir: dirs.project,
      type: args.type,
      title: args.title,
      content: args.content,
      tags: (args.tags ?? "").split(/\s+/).filter(Boolean),
      author: opts.author ?? "unknown",
    })
    return `Saved to project memory (id=project:${dirs.project}:${filename}): [${args.type}] ${args.title}`
  }
  if (!dirs.team) {
    throw new Error("team layer not configured: set memory.team in ~/.thincoder/config.json")
  }
  const filename = await putMarkdown(memory, {
    layer: "team",
    dir: dirs.team,
    type: args.type,
    title: args.title,
    content: args.content,
    tags: (args.tags ?? "").split(/\s+/).filter(Boolean),
    author: opts.author ?? "unknown",
  })
  await commitAndPush(dirs.team, filename, `memory: [${args.type}] ${args.title}`)
  return `Saved to team memory and pushed (id=team:${dirs.team}:${filename}): [${args.type}] ${args.title}`
}

/** action list — new inventory action (read-only): layer/type/keyword filters + limit truncation note. */
async function execList(memory, args, dirs) {
  const layer = args.layer ?? null
  if (layer && !MEMORY_LAYERS.includes(String(layer))) throw new Error(`memory list: invalid layer "${layer}"`)
  const rows = await matchMemoryRows(memory, {
    layer: layer ? String(layer) : null,
    type: validateTypeFilter(args.type),
    keyword: args.keyword ? String(args.keyword).trim() : null,
    projectDir: dirs.project,
    teamDir: dirs.team,
  })
  if (rows.length === 0) return "0 条匹配"
  const limit = normalizeLimit(args.limit, 50)
  const shown = rows.slice(0, limit)
  const lines = shown.map(listRowLine)
  if (rows.length > shown.length) lines.unshift(`${shown.length} 条——截断前 ${rows.length}`)
  return lines.join("\n")
}

/** action delete — single ({ id, layer? } — MEMORY.md §6.2: layer OPTIONAL, validated when
 *  passed, else the id prefix routes the delete) + batch (layer + type/keyword + confirm). */
async function execDelete(memory, args, dirs) {
  const hasId = args.id !== undefined && args.id !== null && String(args.id) !== ""
  if (hasId) return execDeleteSingle(memory, args, dirs)
  // batch form
  const layer = args.layer
  if (!layer) throw new Error("batch delete requires layer plus type and/or keyword filter")
  if (!MEMORY_LAYERS.includes(String(layer))) throw new Error(`memory delete: invalid layer "${layer}"`)
  const type = validateTypeFilter(args.type)
  const keyword = args.keyword ? String(args.keyword).trim() : null
  if (!type && !keyword) {
    throw new Error("batch delete requires type and/or keyword filter — a layer-wide wipe without filters is refused (personal full wipe is the clear action)")
  }
  if (layer === "project" && !dirs.project) throw new Error("project layer unavailable: no project directory configured")
  if (layer === "team" && !dirs.team) throw new Error("team layer not configured: set memory.team in ~/.thincoder/config.json")
  const filters = { layer: String(layer), type, keyword }
  const rows = await matchMemoryRows(memory, { ...filters, projectDir: dirs.project, teamDir: dirs.team })
  if (rows.length === 0) return "0 条匹配"
  if (args.confirm !== true) {
    const lines = [rows.length > 5 ? `将删 ${rows.length} 条：前 5 条预览` : `将删 ${rows.length} 条`]
    lines.push(...rows.slice(0, 5).map(listRowLine))
    if (rows.length > 5) lines.push(`5 条——截断前 ${rows.length}`)
    lines.push("confirm:true required — re-send with it to execute the deletion")
    return lines.join("\n")
  }
  const n = await deleteWhere(memory, filters, { dirs })
  return `Deleted ${n} entries in layer ${layer}`
}

/** Single-entry delete — MEMORY.md §6.2: layer is OPTIONAL. When passed it is validated
 *  against the id prefix (mismatch refused — guards against deleting the wrong entry); when
 *  omitted the delete routes by the id prefix alone, so any id search/list returned is
 *  directly deletable (deleteByUid already resolves the layer from the uid prefix). */
async function execDeleteSingle(memory, args, dirs) {
  const uid = String(args.id)
  const prefix = uid.split(":")[0]
  const uidLayer = prefix === "personal" || prefix === "project" || prefix === "team" ? prefix : /^\d+$/.test(prefix) ? "personal" : null
  if (!uidLayer) throw new Error(`invalid memory id: ${uid}`)
  const layer = args.layer
  if (layer !== undefined && layer !== null && String(layer) !== uidLayer) {
    throw new Error(`id prefix ${prefix}: 与 layer ${layer} 不匹配`)
  }
  const entry = await deleteByUid(memory, uid, { dirs })
  return `Deleted ${entry.id}: ${entry.title}\n${(entry.content ?? "").slice(0, 500)}`
}

/** action clear — personal-only full wipe (layer + confirm:true gates; project/team refused). */
function execClear(memory, args) {
  const layer = args.layer
  if (!layer) throw new Error('clear requires layer "personal" — pass layer: "personal" plus confirm: true')
  if (String(layer) !== "personal") {
    if (!MEMORY_LAYERS.includes(String(layer))) throw new Error(`memory clear: invalid layer "${layer}"`)
    throw new Error("shared layers don't support clear — use delete with type/keyword batch filters instead")
  }
  if (args.confirm !== true) throw new Error("clear requires confirm:true — this wipes ALL personal memory")
  const n = clearPersonal(memory)
  return `Cleared personal memory (${n} entries deleted)`
}
