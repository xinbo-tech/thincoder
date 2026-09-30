import { isAbsolute, join } from "node:path"
import { loadConfig } from "@thincoder/core/config.mjs"
import { teamConfig } from "./make-agent.mjs"
import { put, search, list } from "@thincoder/core/memory/core.mjs"
import { deleteByUid } from "@thincoder/core/memory/delete.mjs"
import { sweepMemory, formatSweepReport } from "@thincoder/core/memory/sweep.mjs"

/** thincoder memory <list|search|put|remove|sweep> subcommands.
 *  opts.dirs: { project, team } layer directories for project/team file deletion (tests inject their own);
 *  falls back to the same config-derived dirs the agent uses.
 *  opts.dbPath: 库路径覆盖（sweep 的备份命名依据——缺省 = `config.memory.dbPath` 展开值）。 */
export async function memoryCommand(memory, args, opts = {}) {
  const [sub, ...rest] = args

  const flags = {}
  const positional = []
  for (const a of rest) {
    const m = a.match(/^--([\w-]+)=(.*)$/)
    if (m) flags[m[1]] = m[2]
    else positional.push(a)
  }

  switch (sub) {
    case "list": {
      const entries = await list(memory, { type: flags.type })
      printEntries(entries)
      break
    }
    case "search": {
      const query = positional.join(" ")
      if (!query) {
        console.error("Usage: thincoder memory search <query>")
        return 1
      }
      printEntries(await search(memory, query, { limit: 10 }))
      break
    }
    case "put": {
      if (!flags.type || !flags.title || !flags.content) {
        console.error("Usage: thincoder memory put --type=<rule|knowledge|decision|pattern> --title=<t> --content=<c> [--tags=<t>]")
        return 1
      }
      const id = await put(memory, { type: flags.type, title: flags.title, content: flags.content, tags: flags.tags ?? "" })
      console.log(`Saved (id=${id})`)
      break
    }
    case "remove": {
      const uid = positional[0]
      if (!uid) {
        console.error("Usage: thincoder memory remove <uid>  (uid: personal:<n> | project:<origin>:<path> | team:<origin>:<path>; bare <n> = personal)")
        return 1
      }
      try {
        const entry = await deleteByUid(memory, uid, { dirs: opts.dirs ?? cliDirs() })
        console.log(`Removed ${entry.id}: ${entry.title}`)
      } catch (e) {
        console.error(e.message)
        return 1
      }
      break
    }
    case "sweep": {
      const parsed = parseSweepArgs(rest)
      if (parsed.error) {
        console.error(parsed.error)
        console.error(SWEEP_USAGE)
        return 1
      }
      try {
        const result = sweepMemory(memory, { origin: parsed.origin, path: parsed.path, confirm: parsed.confirm, dbPath: opts.dbPath ?? loadConfig().memory.dbPath })
        for (const line of formatSweepReport(result)) console.log(line)
        if (result.dryRun) console.log("(dry-run——零写；要落写加 --confirm)")
      } catch (e) {
        console.error(e.message)
        return 1
      }
      break
    }
    default:
      console.error("Usage: thincoder memory <list|search|put|remove|sweep>")
      return 1
  }
}

const SWEEP_USAGE = "Usage: thincoder memory sweep [--origin <o>] [--path <sub>] [--dry-run|--confirm]"

/** sweep 参数面：`--origin <o>` ∕ `--path <sub>`（各两形：空格 ∕ `=`）+ 裸 `--dry-run` ∕ `--confirm`
 *  （缺省 = 干跑；两者互斥）；`--path` 须与 `--origin` 同用（§6.14 面①-3 存量剪枝窄化档）。 */
function parseSweepArgs(rest) {
  let origin = null, path = null, sawDry = false, sawConfirm = false
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    const eq = a.match(/^--(origin|path)=(.*)$/)
    if (eq) { if (eq[1] === "origin") origin = eq[2]; else path = eq[2]; continue }
    if (a === "--origin") { origin = rest[++i] ?? ""; continue }
    if (a === "--path") { path = rest[++i] ?? ""; continue }
    if (a === "--dry-run") { sawDry = true; continue }
    if (a === "--confirm") { sawConfirm = true; continue }
    return { error: `Unknown argument: ${a}` }
  }
  if (origin === "") return { error: "--origin 需要一个非空路径" }
  if (path === "") return { error: "--path 需要一个非空前缀" }
  if (path !== null && origin === null) return { error: "--path 须与 --origin 同用" }
  if (sawDry && sawConfirm) return { error: "--dry-run 与 --confirm 互斥" }
  return { origin, path, confirm: sawConfirm }
}

/** Layer directories for project/team file deletion — derived from the same config the agent uses. */
function cliDirs() {
  const config = loadConfig()
  const dirs = { project: null, team: null }
  if (config.memory?.projectDir) dirs.project = isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(process.cwd(), config.memory.projectDir)
  const team = teamConfig(config)
  if (team) dirs.team = team.dir
  return dirs
}

function printEntries(entries) {
  if (entries.length === 0) {
    console.log("(no entries)")
    return
  }
  for (const e of entries) {
    console.log(`#${e.id} [${e.type}] ${e.title}${e.tags ? `  (${e.tags})` : ""}`)
    console.log(`  ${e.content.split("\n")[0].slice(0, 100)}`)
  }
}
