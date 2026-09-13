import { ansi, C } from "./ansi.mjs"
import { SLASH_ALIASES } from "./slash-commands.mjs"

/** /help command: list all slash commands and aliases.
 *  ctx: { pushLine, pushLabel, SLASH_COMMANDS } */
export async function handleHelpCommand(ctx) {
  const { pushLine, pushLabel, SLASH_COMMANDS } = ctx
  // reverse the shared alias table: command → alias
  const aliasList = Object.fromEntries(Object.entries(SLASH_ALIASES).map(([alias, cmd]) => [cmd, alias]))
  const order = ["Agent", "Session", "Project", "System"]
  const byGroup = new Map()
  for (const c of SLASH_COMMANDS) {
    if (!c.group) continue
    if (!byGroup.has(c.group)) byGroup.set(c.group, [])
    byGroup.get(c.group).push(c)
  }
  pushLabel(`❯ Help`, ansi.bold + C.tool)
  for (const group of order) {
    const cmds = byGroup.get(group)
    if (!cmds) continue
    pushLine(`  ${group}:`, C.dim)
    for (const c of cmds) {
      const alias = aliasList[c.name]
      pushLine(`    ${c.name.padEnd(12)}${alias ? ` (${alias})`.padEnd(8) : "        "} ${c.desc}`, C.text)
    }
  }
}
