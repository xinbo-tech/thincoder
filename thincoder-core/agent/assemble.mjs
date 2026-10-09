/**
 * agent/assemble.mjs — 会话装配序**核单源**：配置 → 代理注入 → 记忆（+embedder）→ 文件规则 →
 * 记忆层（项目 → 团队）→ 工具 →〔工具终形缝〕→ 代理 + 三字段（providers ∕ activeProvider ∕ activeModel）。
 * 来源（纯搬 —— 端壳零副本）：desk `src/main/agent-assemble.mjs`（其前身 = `agent-host.mjs` 装配段逐字搬运）
 * ∕ CLI `src/cli/make-agent.mjs` 装配段——两造 1–8 步逐段对齐（同序同义），本档为其唯一实现。
 * 本档出 `assembleAgent` + 装配缺省面 `DEFAULT_DEPS`（逐项可注入 —— 装配序可机验 U79）+ 团队层取值
 * `teamConfig` + 装配作者 `gitAuthor` + 装配后唯一校验点 `validateProvider`。
 * 端壳留面（各端 adapter，非本档）：desk = cwd 注入（`projects.currentCwd()`）· `_slot` · 校验调用 ·
 * `installExecRunSeams()` 尾；CLI = cwd = `process.cwd()` · MCP 合入（入 `toolsFinalize`）· `_mcpWarnings` ·
 * `applyToolExclusions` · `attachManifest` · 校验调用。
 * 零宿主依赖：核函数全部经 `deps` 取值（缺省 = 本档单源）⇒ 平 node 直测。
 */
import { execSync } from "node:child_process"
import { isAbsolute, join } from "node:path"
import { createAgent } from "../agent.mjs"
import { configDir, loadConfig } from "../config.mjs"
import { createMemory, syncDir } from "../memory.mjs"
import { discoverRules, mergeFileRules } from "../rules.mjs"
import { assembleBuiltinTools } from "../tools/index.mjs"

/** 装配缺省面（逐项可注入 —— 断言装配调用序用假 deps；缺省 = 本档单源）。 */
export const DEFAULT_DEPS = Object.freeze({
  loadConfig, createMemory, createAgent, assembleBuiltinTools, discoverRules, syncDir,
  team: teamConfig, author: gitAuthor,
})

/** 团队层配置（核 `config.memory.team` 有 repo 才成层）——原两造逐字同构，归一至此；
 *  未配置 ⇒ null（装配跳过团队层）。缺省 name = `"default"`；`dir` 缺省 = `<configDir>/teams/<name>`。 */
export function teamConfig(config) {
  const team = config?.memory?.team
  if (!team?.repo) return null
  const name = team.name ?? "default"
  return { name, repo: team.repo, dir: team.dir ?? join(configDir, "teams", name) }
}

/** 装配作者：git `user.name`，缺 ⇒ `"unknown"`（注入缝 = `DEFAULT_DEPS.author`）。 */
export function gitAuthor() {
  try { return execSync("git config user.name", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "unknown" } catch { return "unknown" }
}

/** 装配后唯一校验点（判据 = `name && model && baseURL`）：**不抛** —— 无效 ⇒ 记 `_providerInvalid`
 *  由回合驱动消费（`{ok:false,reason:"provider-invalid"}`，零假回合）；有效 ⇒ 清两标（幂等，复验径复用）。
 *  reason = `config?.providerInvalidReason ?? 三档文案`（provider 不存在 ∕ model 缺失 ∕ 缺少 baseURL）。
 *  返回 agent 便于链式调用。 */
export function validateProvider(agent, config) {
  const p = agent?.provider
  if (p?.name && p?.model && p?.baseURL) {
    delete agent._providerInvalid
    delete agent._providerInvalidReason
    return agent
  }
  agent._providerInvalid = true
  agent._providerInvalidReason = config?.providerInvalidReason
    ?? (!p?.name ? "provider 不存在" : !p.model ? "model 缺失" : "缺少 baseURL")
  return agent
}

/** 装配一份会话代理（序见档头；`cwd` = 项目根，由各端 adapter 注入）。
 *  `deps` 逐项可注入（缺省 = 本档单源）：装配序可机验（U79）；`deps.injectProxy` 可选（缺省 = 动态
 *  import `../proxy.mjs`）。
 *  `toolsFinalize(baseTools, { config, cwd, provider }) → tools ∕ Promise<tools>`：工具终形缝
 *  （缺省 = 恒等）——位次 = 工具装配后、`createAgent` 前；核体 `await`（同步返回值与 Promise 同判）。 */
export async function assembleAgent({ cwd, deps = {}, toolsFinalize = null }) {
  const D = { ...DEFAULT_DEPS, ...deps }
  const config = D.loadConfig()
  const provider = config.provider
  const providers = config.providersList
  // 代理注入（逐渠独立：provider.proxy ∧ `proxy.uri` 在案 ⇒ 该渠模型请求经代理——无全局闸，2026-10-08）；config.provider 是 loadConfig 里的
  // 独立拷贝 —— 同步注入结果（proxyUri）。
  const injectProxy = D.injectProxy ?? (await import("../proxy.mjs")).injectProxy
  injectProxy(providers, config)
  if (provider?.name) provider.proxyUri = providers.find((p) => p.name === provider.name)?.proxyUri

  const memory = D.createMemory({ dbPath: config.memory.dbPath })
  // Vector retrieval: enabled if embedding is configured (lazy vector generation, computed on first search)
  if (config.embedding?.apiKey) {
    const { createEmbedder } = await import("../embedding.mjs")
    memory.embedder = createEmbedder(config.embedding)
  }
  // 项目级规则（.thincoder/rules/*.md）并入 config：文件规则在前（优先），config.json 规则按 pattern 去重在后。
  // 合并体单源 = `../rules.mjs` `mergeFileRules`（B7 3a 自本处内联块抽取；`discover` 走 `D.` 注入缝）。
  config.agent.streamRules = mergeFileRules(config.agent?.streamRules, cwd, D.discoverRules)
  // code/doc 索引按 origin（项目根目录）隔离：检索只落本项目范围。
  memory.codeOrigin = cwd
  // 项目层：启动时把 `.thincoder/memory/` 目录同步进索引（有则同步、无则跳过）。
  if (config.memory.projectDir) {
    memory.projectOrigin = isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(cwd, config.memory.projectDir)
    await D.syncDir(memory, { layer: "project", dir: memory.projectOrigin })
  }
  // 团队层（可选）：首用自动 clone；启动只索引本地目录，远端拉取走显式 sync 命令。
  const team = D.team(config)
  if (team) {
    const { ensureClone } = await import("../git/gitmem.mjs")
    await ensureClone(team)
    await D.syncDir(memory, { layer: "team", dir: team.dir })
  }
  // #70（CORE-UNIFICATION TOOLS）：注册表与消费侧拼装面归位核内——单源 `assembleBuiltinTools`
  // （静态表 ∪ memory / code_search / doc_search / repo_outline / settings / peer_instances 六面 ∪
  // 门控 read_image）。传 `model` 必需：漏传 ⇒ `read_image` 对所有模型静默消失
  // （门判据 = specForModel(model)?.multimodal）。
  const baseTools = await D.assembleBuiltinTools({
    memory, cwd, projectDir: config.memory.projectDir, author: D.author(), team,
    model: provider?.model ?? null,
  })
  const tools = toolsFinalize ? await toolsFinalize(baseTools, { config, cwd, provider }) : baseTools
  const agent = D.createAgent({ provider, tools, config, cwd, memory })
  agent.providers = providers
  agent.activeProvider = provider?.name ?? ""
  agent.activeModel = provider?.model ?? null
  return agent
}
