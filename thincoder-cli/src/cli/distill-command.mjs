import { isAbsolute, join } from "node:path"
import { loadConfig, configPath } from "../config.mjs"
import { createMemory } from "@thincoder/core/memory.mjs"
import { teamConfig, gitAuthor } from "./make-agent.mjs"
import { setupWizard } from "./setup-wizard.mjs"
import { askPermission } from "./permission.mjs"

/** Unified message when no API key is configured */
function noKeyMessage() {
  return `还没有配置 API key。运行 thincoder 进入 TUI，用 /provider add 和 /provider key 配置；或直接编辑 ${configPath}`
}

/** thincoder distill <transcript-file> [--yes] [--layer=...]
 *  Returns exit code: 0=success, 1=error */
export async function distillCommand(args, exitSoon) {
  const flags = {}
  const positional = []
  for (const a of args) {
    const m = a.match(/^--([\w-]+)(?:=(.*))?$/)
    if (m) flags[m[1]] = m[2] ?? true
    else positional.push(a)
  }
  // AC2（MEMORY.md §6.5）：显式拦截旧 flag——`--scope=X` 与 `--scope X` 两形态落入 flags.scope，
  // 报错防静默吞参（解析器本不校验未知 flag——旧 --scope=project 静默落 personal 最危险）。
  if (flags.scope !== undefined) {
    console.error("distill: --scope renamed to --layer — update your invocation")
    return 1
  }
  const file = positional[0]
  if (!file) {
    console.error("Usage: thincoder distill <transcript-file> [--yes] [--layer=personal|project|team]")
    return 1
  }
  const { readFile } = await import("node:fs/promises")
  const transcript = await readFile(file, "utf8")

  const config = loadConfig()
  let provider = config.provider
  if (!provider.apiKey) {
    if (!process.stdin.isTTY) {
      console.error(noKeyMessage())
      return 1
    }
    provider = await setupWizard()
    if (!provider) {
      return 1
    }
  }
  const memory = createMemory({ dbPath: config.memory.dbPath })
  const team = teamConfig(config)
  const { extractCandidates, saveCandidate } = await import("../distill.mjs")

  console.error("[distill] extracting candidates...")
  let candidates
  try {
    candidates = await extractCandidates(provider, transcript)
  } catch (error) {
    console.error(`[distill] ${error.message}`)
    return 1
  }
  if (candidates.length === 0) {
    console.log("No distillable knowledge found in this session.")
    return 0
  }

  const opts = {
    projectDir: config.memory.projectDir ? (isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(process.cwd(), config.memory.projectDir)) : null,
    team,
    author: gitAuthor(),
  }
  let saved = 0
  for (const c of candidates) {
    if (flags.layer) c.layer = flags.layer
    console.log(`\n--- candidate ---`)
    console.log(`[${c.type}] ${c.title}  (layer: ${c.layer})`)
    console.log(c.content)
    if (c.type === "rule") {
      console.log("(rule 类知识通常建议手动撰写；确认提取吗？)")
    }
    const accept = flags.yes ? true : await askPermission("distill-save", { title: c.title })
    if (!accept) {
      console.log("skipped")
      continue
    }
    const where = await saveCandidate(memory, c, opts)
    console.log(`saved -> ${where}`)
    saved++
  }
  console.log(`\nDistilled ${saved}/${candidates.length} entries.`)
  return 0
}
