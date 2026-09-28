/**
 * agent-assemble.mjs — 宿主**装配面**出档（状态栏对齐批：自 `agent-host.mjs` 装配段**逐字搬运** —— 原档
 * 触行数拉线拆档，档名 = 在册预案「装配面拆 `thincoder-desktop/src/main/agent-assemble.mjs`」落形）。
 * 装配序（`docs/desktop/design/SHELL.md` §4 装配第三份 · 批档 §2.2(b) 1–7）：配置 → 代理注入 → 记忆 →
 * 文件规则 → 记忆层（项目 / 团队）→ 工具 → 代理；本档出 `assembleFor` + 装配缺省面 `DEFAULT_DEPS`
 * （逐项可注入 —— 装配序可机验 U79）+ 团队层取值 `teamConfig` + 装配作者 `gitAuthor` +
 * 装配后唯一校验点 `validateProvider`。原路径（`agent-host.mjs`）**同名 re-export 保名面** —— 调用方
 * import 路径与名面零改。
 * 装配端差（SHELL.md §4 显式登记两项 + 取值面一项，随搬运）：`cwd` = 项目根（注入的
 * `projects.currentCwd()`）——**非** `process.cwd()`；不附着 M1 装配钩子（本端读面未接）；不连外部
 * 工具服务器（本端无此面）。
 * **R3 执行面缝（#523②）**：档尾**模块装配期一次接线** —— `installExecRunSeams()`（出档 `exec-run.mjs`：
 * `configureExecRun` ← 核上提件 `runInterruptible` ∕ `configureProcessTreeKill` ← 核 `killProcessTree` 转口；
 * VSC `tools/shared.mjs:104-105` 同形）。
 * 零宿主依赖：核函数全部经 `deps` 取值（缺省 = 核单源）⇒ 平 node 直测（零 `electron`）。
 */
import { execSync } from "node:child_process"
import { isAbsolute, join } from "node:path"
import { createAgent } from "@thincoder/core/agent.mjs"
import { configDir, loadConfig } from "@thincoder/core/config.mjs"
import { createMemory, syncDir } from "@thincoder/core/memory.mjs"
import { discoverRules } from "@thincoder/core/rules.mjs"
import { assembleBuiltinTools } from "@thincoder/core/tools/index.mjs"
// 执行面两缝（R3 · #523② —— 核件转口，零副本；接线在本档尾）。
import { installExecRunSeams } from "./exec-run.mjs"

/** 装配缺省面（逐项可注入 —— 断言装配调用序用假 deps；缺省 = 核单源）。 */
export const DEFAULT_DEPS = Object.freeze({
  loadConfig, createMemory, createAgent, assembleBuiltinTools, discoverRules, syncDir,
  team: teamConfig, author: gitAuthor,
})

/** 团队层配置（核 `config.memory.team` 有 repo 才成层）——端本地最小实现（同形于 CLI 装配侧取值）；
 *  未配置 ⇒ null（装配跳过团队层，与 CLI 同）。 */
export function teamConfig(config) {
  const team = config?.memory?.team
  if (!team?.repo) return null
  const name = team.name ?? "default"
  return { name, repo: team.repo, dir: team.dir ?? join(configDir, "teams", name) }
}

/** 装配作者：git user.name，缺 ⇒ `"unknown"`（端本地最小实现——不引他端模块）。 */
export function gitAuthor() {
  try { return execSync("git config user.name", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "unknown" } catch { return "unknown" }
}

/** 装配后唯一校验点（判据 = `name && model && baseURL`）：**不抛** —— 记 `_providerInvalid` 由回合驱动消费
 *  （`{ok:false,reason:"provider-invalid"}`，零假回合）；原因文案可由 config 覆盖。 */
export function validateProvider(agent, config) {
  const p = agent?.provider
  if (p?.name && p?.model && p?.baseURL) return
  agent._providerInvalid = true
  agent._providerInvalidReason = config?.providerInvalidReason ?? "provider incomplete (name/model/baseURL)"
}

/** 装配一份会话代理（端差已扣 —— 见档头；序同 CLI 装配序，取值面：`cwd` = 项目根）。
 *  `deps` 逐项可注入（缺省 = 核函数）：装配序可机验（U79）。 */
export async function assembleFor({ cwd, slot, deps = {} }) {
  const D = { ...DEFAULT_DEPS, ...deps }
  const config = D.loadConfig()
  const provider = config.provider
  const providers = config.providersList
  const injectProxy = D.injectProxy ?? (await import("@thincoder/core/proxy.mjs")).injectProxy
  injectProxy(providers, config)
  if (provider?.name) provider.proxyUri = providers.find((p) => p.name === provider.name)?.proxyUri

  const memory = D.createMemory({ dbPath: config.memory.dbPath })
  if (config.embedding?.apiKey) {
    const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
    memory.embedder = createEmbedder(config.embedding)
  }
  const fileRules = D.discoverRules(cwd)
  if (fileRules.length) {
    const filePatterns = new Set(fileRules.map((r) => r.pattern))
    const configRules = (config.agent?.streamRules || []).filter((r) => !filePatterns.has(r.pattern))
    config.agent.streamRules = [...fileRules, ...configRules]
  }
  memory.codeOrigin = cwd
  if (config.memory.projectDir) {
    memory.projectOrigin = isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(cwd, config.memory.projectDir)
    await D.syncDir(memory, { layer: "project", dir: memory.projectOrigin })
  }
  const team = D.team(config)
  if (team) {
    const { ensureClone } = await import("@thincoder/core/git/gitmem.mjs")
    await ensureClone(team)
    await D.syncDir(memory, { layer: "team", dir: team.dir })
  }
  const tools = await D.assembleBuiltinTools({
    memory, cwd, projectDir: config.memory.projectDir, author: D.author(), team,
    model: provider?.model ?? null,
  })
  const agent = D.createAgent({ provider, tools, config, cwd, memory })
  agent.providers = providers
  agent.activeProvider = provider?.name ?? ""
  agent.activeModel = provider?.model ?? null
  agent._slot = slot
  validateProvider(agent, config)
  return agent
}

// ─── 装配期缝接线（R3 · #523② —— 模块装配期一次；VSC `tools/shared.mjs:104-105` 同形）────────
installExecRunSeams()
