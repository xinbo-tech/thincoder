/**
 * preload.cjs — 上下文隔离窄桥（`docs/desktop/design/PROJECT.md` §2 KD-3；批档 §2.11 收正②）。
 * 顶层只允许四类语句：**常量定义 · 函数声明 · 守卫调用 · 守卫导出**——`contextBridge` 装配（含 `require("electron")`）
 * 整块落装配函数体内；守卫谓词写死 = `typeof window !== "undefined"`（沙箱预载处为渲染进程上下文 ⇒ 装配；
 * 主进程 `createRequire` 读取与平 node 测试无 `window` ⇒ 零装配、不触 `electron`）。
 * 白名单 `CHANNELS` **单源**（主侧经 `createRequire` 读之据以注册——`src/main/ipc-registry.mjs`）；非白名单通道**立即 reject**（不入 IPC）。
 * 请求白名单 = **四十五项**（三十五 ⇒ 三十八 ⇒ 三十九 ⇒ 四十三 ⇒ 四十五 —— R7 设置补充三项：`settings:env` ∕ `settings:tools` ∕ `mcp:tools` · 模型菜单全渠扇出批增 `model:catalog` · B10 W2 设置面四增：`provider:setKey` ∕ `provider:delKey` ∕ `provider:models` ∕ `provider:setProxy` · B10 W3 MCP 两增：`mcp:update` ∕ `mcp:reconnect` · 定序末位）= 配置读取 + 项目面（打开 —— 原生目录选择 / 最近目录）+ 会话面（列表 / 新建 / 切换 / 重命名 /
 * 删除 / 恢复）+ 审批响应（`approval:respond` —— 出口动作面，见 `src/main/ipc.mjs`）+ 作答响应
 * （`question:respond` —— `question` 工具真作答面）+ 历史页（`history:page`）
 * + 回合驱动（`msg:send` / `msg:interrupt`）（`docs/desktop/design/IPC.md` §2 该行 · 白名单面）
 * + 设置族十二项（provider / model / agent 参数 / MCP / 配置写 / 语言）与项目级信息两项（台账 / 相位）
 * + 会话级偏好写面（`session:prefs`）+ **子 agent 停止出口（`subagent:stop` —— R3b 落）** + **文件链接打开（`file:open` —— 「对齐第三批」落）** + **R1 输入面板移植两项**（模式位四写面 `session:flags` + @ 补全面 `at:complete`）+ **会话维护线两项**（`session:gc` 会话数据回收 ∕ `session:index` 派生索引重建 —— R1 · 桌面功能对位批；白名单**末位**）
 * + **索引数据面两项**（`index:build` 语义索引构建入口 ∕ `index:status` 索引状态读数 —— R2 · 桌面功能对位批；白名单**末位**）
 * + **R7 设置补充三项**（`settings:env` env 读写 ∕ `settings:tools` 两 key 读写 ∕ `mcp:tools` MCP 工具清单 ∕ Test 探活 —— 桌面功能对位批；白名单**末位**）
 * + **模型菜单全渠扇出批增 `model:catalog`**（无载荷全渠扇出 —— 模型钮一级候选面；白名单**末位**）
 * + **B10 W2 设置面四增**（S1 ∕ S2 ∕ S5：`provider:setKey` 渠道密钥设 ∕ 改 · `provider:delKey` 密钥删 ·
 * `provider:models` 自定形「拉取模型」· `provider:setProxy` 渠级代理开关；白名单**末位**）
 * + **B10 W3 MCP 两增**（S8 ∕ S9：`mcp:update` MCP 编辑面 · `mcp:reconnect` 行重连；白名单**末位**）
 * ——**定序**（`config:read` → `project:open` → `project:recent` → `sessions:list` → `session:create` →
 * `session:switch` → `session:rename` → `session:delete` → `session:resume` → `approval:respond` → `history:page` →
 * `msg:send` → `msg:interrupt` → `provider:list` → `provider:save` → `provider:remove` → `provider:verify` →
 * `model:list` → `settings:agent` → `mcp:list` → `mcp:save` → `mcp:remove` → `config:write` → `ledger:read` →
 * `batch:status` → `question:respond` → `session:prefs` → `subagent:stop` → `file:open` → `session:flags` → `at:complete` → `session:gc` → `session:index` → `index:build` → `index:status` →
 * `settings:env` → `settings:tools` → `mcp:tools` → `model:catalog` → `provider:setKey` → `provider:delKey` →
 * `provider:models` → `provider:setProxy` → `mcp:update` → `mcp:reconnect`；顺序供白名单定序断言 —— 主侧据以注册）。
 * 出站订阅面 `on(name, cb)`：白名单 = **二十三条** `ev:*`（`EVENT_CHANNELS`）——表外名 **throw**（不入 IPC）；
 * 返回退订函数（同 listener 引用 ⇒ 二次退订零抛）。
 */
const CHANNELS = Object.freeze([
  "config:read", "project:open", "project:recent", "sessions:list",
  "session:create", "session:switch", "session:rename", "session:delete", "session:resume",
  "approval:respond", "history:page", "msg:send", "msg:interrupt",
  "provider:list", "provider:save", "provider:remove", "provider:verify",
  "model:list", "settings:agent", "mcp:list", "mcp:save", "mcp:remove",
  "config:write", "ledger:read", "batch:status", "question:respond", "session:prefs", "subagent:stop", "file:open",
  "session:flags", "at:complete",
  "session:gc", "session:index",
  "index:build", "index:status",
  "settings:env", "settings:tools", "mcp:tools",
  "model:catalog",
  "provider:setKey", "provider:delKey", "provider:models", "provider:setProxy",
  "mcp:update", "mcp:reconnect",
])
/** 出站订阅白名单（序同桥面表；名面与主侧 `webContents.send` 用名同；**二十三条** = 回调映射十三条（含 **R4 增 `ev:statusText` ∕ `ev:compress`**——桥 `onWait` ∕ `onCompressStart` ∕ `onCompress` ∕ `onCompressFail` 映射）+ 宿主自产十条（`ev:usage` / `ev:error` / `ev:susp` / `ev:digest` / `ev:ledger` [`ev:timer` —— timer-wake 阶段 2 增] / [`ev:queue` —— 「回合中插入」批增] / [`ev:flags` —— R1 输入面板移植增：工具驱动翻转 ∕ 写回执后] / [`ev:goal` —— **R5 增**：goal 工具结果时点采样] / [`ev:config` —— **R8 增**：config 写盘感知——宿主 watch onChange 出站，渲染面设置面复读]）—— 非回调映射；计数族权威数 / 三档同值收正 = 在册登记（`docs/desktop/design/PROJECT.md` §10 BE 行），事件映射段 = `docs/desktop/design/IPC.md` §1）。 */
const EVENT_CHANNELS = Object.freeze([
  "ev:token", "ev:reasoning", "ev:activity", "ev:subagent", "ev:subchunk", "ev:tool-call", "ev:tool-output", "ev:tool-result",
  "ev:approval", "ev:question", "ev:task", "ev:susp", "ev:digest", "ev:usage", "ev:error", "ev:ledger", "ev:timer",
  "ev:queue",
  "ev:flags",
  "ev:statusText", "ev:compress",
  "ev:goal",
  "ev:config",
])
const BRIDGE_KEY = "thincoder"

/** 订阅面工厂（顶层函数声明 —— 沙箱可得面）：`ipcRenderer` 注入；白名单外 **throw**；返回退订函数
 *  （闭包持同一 listener 引用 ⇒ `removeListener` 幂等，二次退订零抛）。 */
function makeOn(ipcRenderer) {
  return (name, cb) => {
    if (!EVENT_CHANNELS.includes(name)) throw new Error(`[preload] event channel not allowed: ${name}`)
    const listener = (_event, payload) => cb(payload)
    ipcRenderer.on(name, listener)
    return () => ipcRenderer.removeListener(name, listener)
  }
}

/** 装配：沙箱预载的 `require` 为 polyfill，仅 `electron` + `events` / `timers` / `url` 可得 ⇒ 常量不外移、装配不拆分档。 */
function assemble() {
  const { contextBridge, ipcRenderer } = require("electron")
  const invoke = (channel, payload) => {
    if (!CHANNELS.includes(channel)) return Promise.reject(new Error(`[preload] channel not allowed: ${channel}`))
    return ipcRenderer.invoke(channel, payload)
  }
  contextBridge.exposeInMainWorld(BRIDGE_KEY, { invoke, on: makeOn(ipcRenderer) })
}

if (typeof window !== "undefined") assemble()
if (typeof module !== "undefined" && module.exports) module.exports = { CHANNELS, EVENT_CHANNELS, makeOn }
