/**
 * run.mjs — 管理面 agent 共用件（agent/ADMIN-AGENT.md §5 ∥ §6；admin-agent-chat 批——台账 #1254）：
 * 预算常量（缺省 20 分钟 ∥ 60 调用——chat 回合环复用）∥ 核 provider 客户端装载（`loadCoreChat`——KD-SV-78/82）∥
 * provider 注册表模型标识集（`providerModelRefs`——chat 建会话校验 ∥ 成员面模型清单同源）∥ 无人值守裁剪面清单（`TRIMMED_FACES`）。
 *
 * 任务式环（`runAgentTask`/`buildModelExit`——runner-admin-console 批）已随任务式装机退场删净（2026-10-14）：
 * 装机/主机运维 = 管理面 chat 内动作（KD-SV-135）；chat 回合环自持（`chat.mjs`），同源复用本档预算常量与核装载。
 */
import { modelEntriesOf } from "../gateway/providers.mjs"
import { readPackageVersion } from "../ops/update.mjs"

/** 预算缺省（§5——时长 20 分钟 ∥ 工具调用 60 次；超限 ⇒ 停 + 报告）。 */
export const DEFAULT_MAX_CALLS = 60
export const DEFAULT_MAX_DURATION_MS = 20 * 60 * 1000

/** 无人值守裁剪面（§5——保留核 agent 环/工具协议/provider/审计挂钩；下列族不挂载——`team_ledger`（团队台账核工具）：服务端 admin agent 零团队登录 ⇒ 工具不可达）；
 *  `mcp` 已解裁（server-mcp 批——管理会话挂 MCP 面，§2.2），`ledger` 为核台账族（团队台账以 `team_ledger` 单列、与本族同裁）。 */
export const TRIMMED_FACES = Object.freeze(["tty", "memory", "ledger", "subagent", "browser", "team_ledger"])

/** 核装载（KD-SV-78）：动载 `@thincoder/core` provider 客户端（`chat(provider, { messages, tools })`）。
 *  部署前提 = `@thincoder/core` 依赖声明（`package.json`——钉版本）；本仓开发面经注入口替身零依赖。
 *
 *  客户端标识声明（PROVIDER.md §6.17）：声明跟核装载点走——核装载成功后才可声明（无核 ⇒ 无 chat ⇒
 *  无出站请求）；本档顶层零 `@thincoder/core` 静态 import（静态式会让无核的检出树启动即崩，
 *  破坏「缺核各面退中性」）。`importCore` = 测试注入缝（同「注入口替身」口径）。 */
export async function loadCoreChat({ importCore = (specifier) => import(specifier) } = {}) {
  const mod = await importCore("@thincoder/core/provider/index.mjs")
  const { setClientIdentity } = await importCore("@thincoder/core/client-identity.mjs")
  setClientIdentity({ surface: "server", version: readPackageVersion() })
  return mod.chat
}

/** provider 注册表（库单源——读时构建；与网关同源件）：出 = 对外标识集（`alias ?? "<provider>/<model>"`）。 */
export function providerModelRefs(entries = []) {
  const refs = []
  for (const entry of entries) {
    for (const { name, alias } of modelEntriesOf(entry.models)) refs.push(alias ?? `${entry.name}/${name}`)
  }
  return refs
}
