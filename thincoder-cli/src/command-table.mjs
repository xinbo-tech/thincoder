/**
 * command-table.mjs — CLI 命令分发表（`bin/thincoder.mjs` 外提——2026-09-28 拆档批 R4 · 纯移动 ·
 *   命令行为 ∕ USAGE 文本 ∕ 旗标语义零改）：分发骨架 + 八薄命令族（memory ∕ sync ∕ distill ∕
 *   reindex ∕ completion ∕ upgrade ∕ session ∕ ledger）+ help ∕ version；交互长驻三命令
 *   （chat ∕ tui ∕ acp）经 `command-interactive.mjs` 承接。依赖经 ctx 注入（`usage` ∕ `version` ∕
 *   `exitSoon`——bin 装配面注入；先例 = `src/tui/turn-face.mjs` 出档）。
 */
import { readFileSync } from "node:fs"
import { isAbsolute, join } from "node:path"
import { loadConfig } from "@thincoder/core/config.mjs"
import { createMemory, syncDir } from "@thincoder/core/memory.mjs"
import { teamConfig } from "./cli/make-agent.mjs"
import { memoryCommand } from "./cli/memory-command.mjs"
import { distillCommand } from "./cli/distill-command.mjs"
import { chatCommand, tuiCommand, acpCommand } from "./command-interactive.mjs"

/** 命令分发（原 `bin/thincoder.mjs` 顶层 switch 骨架逐字搬移——命令行为零改）。 */
export async function runCommandTable(command, args, ctx) {
  const { usage, version, exitSoon } = ctx
  switch (command) {
    case "chat": {
      await chatCommand(args, ctx)
      break
    }

    case "memory": {
      const config = loadConfig()
      const memory = createMemory({ dbPath: config.memory.dbPath })
      if (config.embedding?.apiKey) {
        const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
        memory.embedder = createEmbedder(config.embedding)
      }
      if (config.memory.projectDir) {
        memory.projectOrigin = isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(process.cwd(), config.memory.projectDir)
      }
      const code = await memoryCommand(memory, args)
      if (code) exitSoon(code)
      break
    }

    case "sync": {
      const config = loadConfig()
      const team = teamConfig(config)
      if (!team) {
        console.error("Team memory not configured. Set memory.team in ~/.thincoder/config.json:")
        console.error('  "team": { "name": "myteam", "repo": "git@github.com:org/team-memory.git" }')
        exitSoon(1)
        break
      }
      const memory = createMemory({ dbPath: config.memory.dbPath })
      const { ensureClone, pullTeam } = await import("@thincoder/core/git/gitmem.mjs")
      try {
        const cloned = await ensureClone(team)
        if (cloned) console.log(`Cloned team repo to ${team.dir}`)
        await pullTeam(team.dir)
        const stats = await syncDir(memory, { layer: "team", dir: team.dir })
        console.log(`Synced. Index: +${stats.added} ~${stats.updated} -${stats.removed}`)
      } catch (error) {
        console.error(`[error] ${error.message}`)
        exitSoon(1)
      }
      break
    }

    case "distill": {
      const code = await distillCommand(args, exitSoon)
      if (code) exitSoon(code)
      break
    }

    case "reindex": {
      const config = loadConfig()
      const memory = createMemory({ dbPath: config.memory.dbPath })
      // files 层（project/team 的 markdown 索引）全量重建；索引是易失品，真相在 markdown
      memory.db.prepare(`DELETE FROM files`).run()
      const cwd = process.cwd()
      let total = { added: 0, removed: 0 }
      if (config.memory.projectDir) {
        const s = await syncDir(memory, { layer: "project", dir: isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(cwd, config.memory.projectDir) })
        total.added += s.added
      }
      const team = teamConfig(config)
      if (team) {
        const { ensureClone } = await import("@thincoder/core/git/gitmem.mjs")
        await ensureClone(team)
        const s = await syncDir(memory, { layer: "team", dir: team.dir })
        total.added += s.added
      }
      console.log(`Reindexed ${total.added} markdown entries (project${team ? " + team" : ""}). Vectors will be lazily regenerated on next search.`)
      break
    }

    case "tui":
    case undefined: {
      await tuiCommand(ctx)
      break
    }

    case "completion": {
      const shell = args[0]
      if (!["bash", "zsh", "fish"].includes(shell)) {
        console.error(`Usage: thincoder completion <bash|zsh|fish>`)
        exitSoon(1)
        break
      }
      // §11.2 交付行数债（2026-09-08——500 行硬限触碰执行）：直写段逐字迁出
      // src/completions.mjs（脚本字节不变——printCompletion 发射）
      const { printCompletion } = await import("./completions.mjs")
      printCompletion(shell)
      break
    }

    case "upgrade": {
      const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
      const local = pkg.version
      const { checkForUpdate } = await import("./upgrade.mjs")
      const result = await checkForUpdate(local)
      if (!result) {
        console.error("[upgrade] Unable to query npm registry — check your network connection and that npm is installed")
        exitSoon(1)
        break
      }
      if (!result.newer) {
        console.log(`ThinCoder ${local} is already the latest.`)
      } else {
        console.log(`Upgrading: ${local} → ${result.latest}`)
        const { execSync } = await import("node:child_process")
        execSync("npm install -g thincoder@latest", { stdio: "inherit" })
        console.log(`Upgraded to ${result.latest}`)
      }
      break
    }

    case "acp": {
      await acpCommand(args, ctx)
      break
    }

    case "session": {
      // SESSION.md §6.12 / §6.17：会话目录 GC 显式面（冷 cwd 90 天面 + 三合取存量组全量面）——
      // 双端同面（2026-09-21 端差注销：VS Code 端命令 `thincoder.sessionGc` 走同一核数据面）。
      // SESSION.md §6.19 D-SE46（2026-09-22 会话索引批）：`session index` = 派生索引库显式面
      // （--status 读数 / --rebuild 全量重扫）——同一 `session` 分发族（壳侧分发，实现在核）。
      if (args[0] === "index") {
        const { runSessionIndex } = await import("@thincoder/core/session-index-cmd.mjs")
        process.exitCode = await runSessionIndex(args)
        break
      }
      const { runSessionGc } = await import("@thincoder/core/session-gc.mjs")
      process.exitCode = await runSessionGc(args)
      break
    }

    case "ledger": {
      // LEDGER.md §2.2（2026-09-25 批）：台账存量收正面——变体键合并迁移（migrate）/ 残档审计（audit）；
      // 核内实现（ledger-migrate.mjs），壳侧只分发（先例 = `session gc` 双档：--dry-run 只读 / --confirm 执行）。
      if (args[0] === "migrate" || args[0] === "audit") {
        const m = await import("@thincoder/core/ledger-migrate.mjs")
        process.exitCode = await (args[0] === "migrate" ? m.runLedgerMigrate(args) : m.runLedgerAudit(args))
        break
      }
      // 只读数据接口（read-data-interface 批）：`ledger list --json [--full] [--family] [--cwd <dir>]`——
      // 核内 runner（ledger-read.mjs）严格解析（缺 --json / 未知参 ⇒ usage + exit 1）；壳侧只分发。
      if (args[0] === "list") {
        const m = await import("@thincoder/core/ledger-read.mjs")
        process.exitCode = m.runLedgerList(args.slice(1))
        break
      }
      console.error("Usage: thincoder ledger migrate --dry-run | --confirm [--from <key>] | thincoder ledger audit [--root <dir>] | thincoder ledger list --json [--full] [--family] [--cwd <dir>]")
      exitSoon(1)
      break
    }

    case "--help":
    case "-h": {
      process.stdout.write(usage)
      break
    }

    case "--version":
    case "-v": {
      console.log(version)
      break
    }

    default: {
      console.error(`Unknown command: ${command}\n`)
      process.stdout.write(usage)
      exitSoon(1)
    }
  }
}
