import { join } from "node:path"
import { loadConfig } from "../config.mjs"
import { teamConfig } from "./make-agent.mjs"
import { put, search, list, deleteByUid } from "../memory/core.mjs"

/** thincoder memory <list|search|put|remove> subcommands.
 *  opts.dirs: { project, team } layer directories for project/team file deletion (tests inject their own);
 *  falls back to the same config-derived dirs the agent uses. */
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
    default:
      console.error("Usage: thincoder memory <list|search|put|remove>")
      return 1
  }
}

/** Layer directories for project/team file deletion — derived from the same config the agent uses. */
function cliDirs() {
  const config = loadConfig()
  const dirs = { project: null, team: null }
  if (config.memory?.projectDir) dirs.project = join(process.cwd(), config.memory.projectDir)
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
