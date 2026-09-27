/**
 * preload.cjs — 上下文隔离窄桥（`docs/desktop/design/PROJECT.md` §2 KD-3；批档 §2.11 收正②）。
 * 顶层只允许四类语句：**常量定义 · 函数声明 · 守卫调用 · 守卫导出**——`contextBridge` 装配（含 `require("electron")`）
 * 整块落装配函数体内；守卫谓词写死 = `typeof window !== "undefined"`（沙箱预载处为渲染进程上下文 ⇒ 装配；
 * 主进程 `createRequire` 读取与平 node 测试无 `window` ⇒ 零装配、不触 `electron`）。
 * 白名单 `CHANNELS` **单源**（主侧经 `createRequire` 读之据以注册——`src/main/ipc.mjs`）；非白名单通道**立即 reject**（不入 IPC）。
 * 二十七项 ⇒ **二十八项**（R3b 增 `subagent:stop` —— 定序末位）= 配置读取 + 项目面（打开 —— 原生目录选择 / 最近目录）+ 会话面（列表 / 新建 / 切换 / 重命名 /
 * 删除 / 恢复）+ 审批响应（`approval:respond` —— 出口动作面，见 `src/main/ipc.mjs`）+ 作答响应
 * （`question:respond` —— `question` 工具真作答面）+ 历史页（`history:page`）
 * + 回合驱动（`msg:send` / `msg:interrupt`）（`docs/desktop/design/IPC.md` §2 该行 · 白名单面）
 * + 设置族十二项（provider / model / agent 参数 / MCP / 配置写 / 语言）与项目级信息两项（台账 / 相位）
 * + 会话级偏好写面（`session:prefs`）+ **子 agent 停止出口（`subagent:stop` —— R3b 落 · 白名单**末位**）
 * ——**定序**（`config:read` → `project:open` → `project:recent` → `sessions:list` → `session:create` →
 * `session:switch` → `session:rename` → `session:delete` → `session:resume` → `approval:respond` → `history:page` →
 * `msg:send` → `msg:interrupt` → `provider:list` → `provider:save` → `provider:remove` → `provider:verify` →
 * `model:list` → `settings:agent` → `mcp:list` → `mcp:save` → `mcp:remove` → `config:write` → `ledger:read` →
 * `batch:status` → `question:respond` → `session:prefs` → `subagent:stop`；顺序供白名单定序断言 —— 主侧据以注册）。
 * 出站订阅面 `on(name, cb)`：白名单 = **十二条** `ev:*`（`EVENT_CHANNELS`）——表外名 **throw**（不入 IPC）；
 * 返回退订函数（同 listener 引用 ⇒ 二次退订零抛）。
 */
const CHANNELS = Object.freeze([
  "config:read", "project:open", "project:recent", "sessions:list",
  "session:create", "session:switch", "session:rename", "session:delete", "session:resume",
  "approval:respond", "history:page", "msg:send", "msg:interrupt",
  "provider:list", "provider:save", "provider:remove", "provider:verify",
  "model:list", "settings:agent", "mcp:list", "mcp:save", "mcp:remove",
  "config:write", "ledger:read", "batch:status", "question:respond", "session:prefs", "subagent:stop",
])
/** 出站订阅白名单（十条 ⇒ **十一条** —— R3b 增 `ev:subagent`；**十一条 ⇒ 十二条** —— R3c 增 `ev:reasoning`；序同桥面表；名面与主侧 `webContents.send` 用名同；十通道 = 回调映射 + 宿主自产两条（`ev:usage` / `ev:error`）—— 非回调映射，`docs/desktop/design/IPC.md` §1 事件映射段）。 */
const EVENT_CHANNELS = Object.freeze([
  "ev:token", "ev:reasoning", "ev:activity", "ev:subagent", "ev:tool-call", "ev:tool-output", "ev:tool-result",
  "ev:approval", "ev:question", "ev:task", "ev:usage", "ev:error",
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
