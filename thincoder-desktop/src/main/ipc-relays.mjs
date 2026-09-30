/**
 * ipc-relays.mjs — IPC **转口群**出档（#685 拆点 ⟨331 ⇒ 两档⟩ —— `docs/desktop/design/IPC.md` §2）：**二十四项**
 * 设置族（provider 八 ∕ model 两 ∕ agent 参数 ∕ MCP 六 ∕ env ∕ tools）· 索引数据面两 · 台账相位两 · 配置写 ——
 * 逐项 = **一参数纯转口**（本档零算法副本）。处理体本体（会话族 ∕ 项目面 ∕ 宿主注入面 ∕ `file:open`）留
 * `ipc.mjs`：本档**单向** import 该档（`liveAgents` 取用 —— mcp 四转口随动面 ⇒ 零环）；注册面零改
 * （`HANDLERS` 表 ∕ 注册序 ∕ 白名单 ∕ `main.mjs` 不动）—— `ipc-registry.mjs` import 拆两源（核心面自
 * `ipc.mjs` ∕ 本档转口面），表行逐字不动。纪律：零裸包（除 `./` 同仓面）· 逐通道回执形单源 = IPC.md §2。
 */
import { currentCwd } from "./projects.mjs"
import { liveAgents } from "./ipc.mjs"
import { configWrite, indexStatus, modelCatalog, modelList, settingsAgent } from "./settings.mjs"
import { settingsEnv } from "./settings-env.mjs"
import { settingsTools } from "./settings-tools.mjs"
import { providerDelKey, providerList, providerModels, providerRemove, providerSave, providerSetKey, providerSetProxy, providerVerify } from "./providers.mjs"
import { mcpList, mcpReconnect, mcpRemove, mcpSave, mcpTools, mcpUpdate } from "./mcp-servers.mjs"
import { batchStatus, ledgerRead } from "./project-info.mjs"
import { runIndexBuild } from "./index-status.mjs"

/** R2 · 索引数据面两通道（构建处理体出档 `index-status.mjs` ∕ 读数装配出档 `settings.mjs`）：两通道
 *  **无载荷**——`dir` = 主进程当前项目内存态（`currentCwd()`）；未开项目 ⇒ 读数零计数（零假造）·
 *  构建落 `{ ok:false, reason:"no-project" }`（可见失败面，零静默）。 */
export function indexBuild() { return runIndexBuild({ dir: currentCwd() }) }
export function indexStatusChannel() { return indexStatus({ dir: currentCwd() }) }

/** R7 · 设置补充三项（处理体出档 `settings-env.mjs` ∕ `settings-tools.mjs` ∕ `mcp-servers.mjs`）：
 *  `settings:env` 三支 = 读 `{}` ∕ 写 `{ patch: { proxy?, shell? } }` ∕ TestProxy `{ testProxy: { uri } }`
 *  （写经核 `writeConfigAtomic`——端侧零自写盘）；`settings:tools` 两支 = 读 `{}` ∕ 写
 *  `{ patch: { embedding?: { apiKey }, websearch?: { apiKey } } }`；`mcp:tools` 两支 = `{ name }`
 *  （连接列举）∥ `{ name, test: true }`（Test 探活一次）。载荷 / 回执形 = `docs/desktop/design/IPC.md` §2。 */
export function settingsEnvChannel(payload) { return settingsEnv(payload) }
export function settingsToolsChannel(payload) { return settingsTools(payload) }
export function mcpToolsChannel(payload) { return mcpTools(payload) }

/* ─── 设置族十二项处理体：转口三档模块，本档零算法副本 ─── */
/** `provider:list`（无入参）⇒ `{ ok, providers, active }`（密钥只回遮罩值）。 */
export function providerListChannel() { return providerList() }
/** `provider:save(payload)` ⇒ `{ ok, reason }`：载荷 `{ name, shape, preset?, baseURL?, model?, key?, format?, active? }`。 */
export function providerSaveChannel(payload) { return providerSave(payload) }
/** `provider:remove(payload)` ⇒ `{ ok, reason }`：载荷 `{ name }`（激活渠道保护 = 核错误串直传）。 */
export function providerRemoveChannel(payload) { return providerRemove(payload) }
/** `provider:verify(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, reason }`（`timeout`/`malformed`/`unavailable`；
 *  探不通**仍可保存**——本通道只回报，不拦写）。 */
export function providerVerifyChannel(payload) { return providerVerify(payload) }
/** B10 W2 四处理体转口（S1 ∕ S2 ∕ S5 —— 载荷 ∕ 回执形单源 = `providers.mjs`；本档零算法副本）。 */
export function providerSetKeyChannel(payload) { return providerSetKey(payload) }
export function providerDelKeyChannel(payload) { return providerDelKey(payload) }
export function providerModelsChannel(payload) { return providerModels(payload) }
export function providerSetProxyChannel(payload) { return providerSetProxy(payload) }
/** `model:list(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, reason }`：载荷 `{ provider }`（provider 名）。 */
export function modelListChannel(payload) { return modelList(payload) }
/** `model:catalog`（无载荷）⇒ `{ ok, models, unavailable }`（全渠扇出 —— 逐 `hasKey` 渠探针；失败渠零行 + 诊断项）。 */
export function modelCatalogChannel() { return modelCatalog() }
/** `settings:agent(payload)`：读 `{}` ⇒ `{ ok, fields }`；写 `{ patch }` ⇒ `{ ok, reason, fields }`（写后回读）。 */
export function settingsAgentChannel(payload) { return settingsAgent(payload) }
/** `mcp:list`（无入参）⇒ `{ ok, servers }`（只列已配；不连接）。 */
export function mcpListChannel() { return mcpList() }
/** `mcp:save(payload)` ⇒ `{ ok, tools }` ∥ `{ ok:false, reason, detail? }`（探活不通 ⇒ 零写盘）。 */
export function mcpSaveChannel(payload) { return mcpSave(payload, { listAgents: liveAgents }) }
/** `mcp:remove(payload)` ⇒ `{ ok }` ∥ `{ ok:false, reason }`：载荷 `{ name }`。 */
export function mcpRemoveChannel(payload) { return mcpRemove(payload, { listAgents: liveAgents }) }
/** `mcp:update(payload)` ⇒ `{ ok, tools }` ∥ `{ ok:false, reason }`：载荷 `{ name, config }`（S8 编辑面——仅落盘 + 随动重挂）。 */
export function mcpUpdateChannel(payload) { return mcpUpdate(payload, { listAgents: liveAgents }) }
/** `mcp:reconnect(payload)` ⇒ `{ ok, tools }` ∥ `{ ok:false, reason }`：载荷 `{ name }`（S9 行重连——先断后连）。 */
export function mcpReconnectChannel(payload) { return mcpReconnect(payload, { listAgents: liveAgents }) }
/** `config:write(payload)` ⇒ `{ ok, reason, locale, dict, configured }` ∥ `{ ok:false, reason }`：载荷 `{ patch }`（仅 `locale`）。 */
export function configWriteChannel(payload) { return configWrite(payload) }
/** `ledger:read(payload)` ⇒ `{ ok, counts, thresholdReached }` ∥ `{ ok:false, reason }`：载荷 `{ cwd? }`。 */
export function ledgerReadChannel(payload) { return ledgerRead(payload) }
/** `batch:status(payload)` ⇒ `{ ok, phase }` ∥ `{ ok:false, reason }`：载荷 `{ cwd? }`（`missing`/`invalid`）。 */
export function batchStatusChannel(payload) { return batchStatus(payload) }
