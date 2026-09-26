/**
 * i18n.mjs — 词表面（`docs/desktop/design/SHELL.md:31` · 批 2 档 §2.4（g）· 本批 §2.1 E-5 / §2.5 U44）：
 *   ① 核域键 = `config:read` 语言面**下发投影**（核 `projectDictionary(locale)` 已扁平投影
 *      ⇒ 渲染面零核导入、零第二词表源）；
 *   ② 宿主 UI 专有键 = `HOST_DICT`（左列 10 键 + 标签条 4 键 + 对话流 6 键 + 活动池 7 键 + 审批卡 7 键
 *      + 设置 48 键 + 向导 10 键 + 信息行 9 键 = **101 键** × 2 语；
 *      两语键集须相等，增键两语同增、禁单语落键）；
 *   ③ `t(key, params)` 解析序 = **宿主 → 核投影 → 键名自身**（缺键回落键名：不静默吞、不抛、
 *      永不返回空 / `undefined`）；插值 = **核同形** `${name}`（键值由核 `projectDictionary`
 *      原样投影 ⇒ 占位方言只能随核 —— `thincoder-core/i18n.mjs:12`「两端同约定」），缺参原样保留；
 *   ④ 语言归一：**与核 `normalizeLocale` 同形同终态**（`thincoder-core/i18n.mjs:75-81`）—— BCP-47 取
 *      基语言（`zh-CN` ⇒ `zh`）；缺 / 非串 / 未知 ⇒ `"en"`；值域同核 `SUPPORTED_LOCALES`。
 * 零落盘 · 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */

/** 宿主 UI 专有键（两语键序同 = 对位阅读 · 键集相等 = 用例机检面）：`rail.*` = 左列元素 ·
 *  `origin.*` = 会话行来源端标（值与核 `createdBy` 三值同名）· `tab.*` = 标签条（位标词 + 关闭控件词面 +
 *  关闭确认面两键词 —— 两键 = 文本按钮词面，**非图标字形**）· `chat.*` = 对话流（空态提示 / 摘要块 / 药丸两态 /
 *  工具卡改动摘要 + 耗时）· `pool.*` = 活动池（标题 / 三族标 / 折叠控件两态 `aria-label` / 空态提示 ——
 *  折叠字形住 `renderer/pool.css`）· `approval.*` = 审批卡两形三出口词面 + 批形计数（`${count}` 占位；
 *  键位闭集住 `renderer/views/approval.mjs`）· `settings.*` = 设置面（标题 / 关闭 / 语言控件两键 = 目标语自名 /
 *  四段名 / 两段态 / 十二失败码 / 渠道段：字段标 · 校验两态 `${count}` 与 `${reason}` · 移除 `${name}` ·
 *  当前标 · 两增键 / agent 段：只读标 · 保存 / 模型段：当前 · 空态 · 采用 / MCP 段：两 kind · 字段标 ·
 *  移除 · 增键 —— 段名键单源 = `renderer/views/settings.mjs` `SECTIONS`，失败面段标 `SCOPE_WORD` 同键）·
 *  `wizard.*` = 首启向导（标题 / 退场 / 三步名 / 两推进键 / 渠道提交键 / 目录步两词）·
 *  `info.*` = 项目级信息行（标题 / 三读数标：需求池 · 技术待办 · 老化——同核台账口径 / 超阈标 / 相位标 ·
 *  两相位值 / 空态 —— 键位闭集住 `renderer/views/info-row.mjs` · `renderer/views/onboarding.mjs`）·
 *  占位方言沿核 `${name}`，本档零字形字面）。 */
export const HOST_DICT = Object.freeze({
  en: {
    "rail.action.openDir": "Open folder…",
    "rail.recent.title": "Recent folders",
    "rail.sessions.title": "Sessions",
    "rail.project.none": "No project open",
    "rail.empty.hint": "No sessions in this project yet",
    "rail.action.newSession": "New session",
    "rail.session.untitled": "Untitled session",
    "origin.cli": "CLI",
    "origin.vscode": "VS Code",
    "origin.desktop": "Desktop",
    "tab.badge.approval": "awaiting approval",
    "tab.action.close": "Close tab",
    "tab.action.close.cancel": "Cancel",
    "tab.action.close.confirm": "Close",
    "chat.empty.hint": "No messages in this session yet",
    "chat.pill.new": "${n} new",
    "chat.pill.bottom": "Back to latest",
    "chat.summary.older": "${n} earlier messages",
    "chat.tool.changes": "${files} files · +${add} −${del}",
    "chat.tool.duration": "${seconds}s",
    "pool.title": "Activity",
    "pool.family.approvals": "Approvals",
    "pool.family.blocks": "Running",
    "pool.family.queue": "Queued",
    "pool.collapse": "Collapse activity",
    "pool.expand": "Expand activity",
    "pool.empty.hint": "No activity in this session yet",
    "approval.once": "Allow once",
    "approval.always": "Always allow",
    "approval.reject": "Reject",
    "approval.batch.approveAll": "Approve all",
    "approval.batch.deny": "Deny all",
    "approval.batch.oneByOne": "Review one by one",
    "approval.batch.count": "${count} tools awaiting approval",
    // ── 设置面（批 9：`views/settings.mjs` + `views/settings-sections.mjs`）──
    "settings.title": "Settings",
    "settings.close": "Close settings",
    "settings.lang.en": "English",
    "settings.lang.zh": "中文",
    "settings.section.providers": "Providers",
    "settings.section.model": "Model & tier",
    "settings.section.agent": "Agent options",
    "settings.section.mcp": "MCP",
    "settings.state.none": "Not configured",
    "settings.state.loading": "Loading…",
    "settings.reason.mtimeConflict": "Config changed elsewhere — reload before saving",
    "settings.reason.invalidShape": "Invalid config shape",
    "settings.reason.invalidKey": "Unknown config key",
    "settings.reason.invalidValue": "Invalid value",
    "settings.reason.invalidPatch": "Invalid patch",
    "settings.reason.noProject": "No project open",
    "settings.reason.missing": "Config file missing",
    "settings.reason.invalidManifest": "Invalid project manifest",
    "settings.reason.unavailable": "Unavailable",
    "settings.reason.timeout": "Timed out",
    "settings.reason.malformed": "Malformed response",
    "settings.reason.probeFailed": "Probe failed",
    "settings.providers.nameLabel": "Name",
    "settings.providers.presetLabel": "Preset",
    "settings.providers.baseURLLabel": "Base URL",
    "settings.providers.modelLabel": "Model",
    "settings.providers.formatLabel": "Format",
    "settings.providers.keyLabel": "API key",
    "settings.providers.activeToggle": "Set as active provider",
    "settings.providers.addCustom": "Add custom provider",
    "settings.providers.addPreset": "Add preset provider",
    "settings.providers.verify": "Verify",
    "settings.providers.verify.ok": "Verified · ${count} models",
    "settings.providers.verify.fail": "Verification failed: ${reason}",
    "settings.providers.noKey": "No API key",
    "settings.providers.remove": "Remove ${name}",
    "settings.providers.active": "Active",
    "settings.agent.readonly": "Read-only",
    "settings.agent.save": "Save",
    "settings.model.current": "Current model",
    "settings.model.empty": "No models yet",
    "settings.model.use": "Use",
    "settings.mcp.kind.url": "URL",
    "settings.mcp.kind.command": "Command",
    "settings.mcp.remove": "Remove ${name}",
    "settings.mcp.nameLabel": "Name",
    "settings.mcp.configLabel": "Config (JSON)",
    "settings.mcp.add": "Add server",
    // ── 首启向导（批 9：`views/onboarding.mjs`）──
    "wizard.title": "Initial setup",
    "wizard.dismiss": "Close setup",
    "wizard.step.channel": "Provider",
    "wizard.step.model": "Model",
    "wizard.step.dir": "Folder",
    "wizard.next": "Next",
    "wizard.finish": "Finish",
    "wizard.dir.hint": "Pick a project folder — you can change it later.",
    "wizard.dir.pick": "Choose folder…",
    "wizard.save": "Save provider",
    // ── 项目级信息行（批 9：`views/info-row.mjs`）──
    "info.title": "Project info",
    "info.threshold": "Ready for a batch",
    "info.phase": "Phase",
    "info.phase.initialDev": "Initial dev",
    "info.phase.production": "Production",
    "info.read.pool": "Requirements",
    "info.read.tech": "Tech todos",
    "info.read.aged": "Aged",
    "info.state.none": "No reading yet",
  },
  zh: {
    "rail.action.openDir": "打开目录…",
    "rail.recent.title": "最近目录",
    "rail.sessions.title": "会话",
    "rail.project.none": "未打开项目",
    "rail.empty.hint": "项目内暂无会话",
    "rail.action.newSession": "新建会话",
    "rail.session.untitled": "未命名会话",
    "origin.cli": "CLI",
    "origin.vscode": "扩展端",
    "origin.desktop": "桌面端",
    "tab.badge.approval": "待审批",
    "tab.action.close": "关闭标签",
    "tab.action.close.cancel": "取消",
    "tab.action.close.confirm": "关闭",
    "chat.empty.hint": "本会话暂无消息",
    "chat.pill.new": "${n} 条新消息",
    "chat.pill.bottom": "回到最新",
    "chat.summary.older": "更早的 ${n} 条",
    "chat.tool.changes": "${files} 个文件 · +${add} −${del}",
    "chat.tool.duration": "${seconds} 秒",
    "pool.title": "活动",
    "pool.family.approvals": "待审批",
    "pool.family.blocks": "活动块",
    "pool.family.queue": "队列",
    "pool.collapse": "折叠活动池",
    "pool.expand": "展开活动池",
    "pool.empty.hint": "本会话暂无活动",
    "approval.once": "允许一次",
    "approval.always": "始终允许",
    "approval.reject": "拒绝",
    "approval.batch.approveAll": "全部批准",
    "approval.batch.deny": "全部拒绝",
    "approval.batch.oneByOne": "逐项审查",
    "approval.batch.count": "待审批 ${count} 个工具",
    // ── 设置面（批 9：`views/settings.mjs` + `views/settings-sections.mjs`）──
    "settings.title": "设置",
    "settings.close": "关闭设置",
    "settings.lang.en": "English",
    "settings.lang.zh": "中文",
    "settings.section.providers": "渠道",
    "settings.section.model": "模型与档位",
    "settings.section.agent": "agent 参数",
    "settings.section.mcp": "MCP",
    "settings.state.none": "未配置",
    "settings.state.loading": "载入中…",
    "settings.reason.mtimeConflict": "配置已在别处变更——请重载后再保存",
    "settings.reason.invalidShape": "配置形态非法",
    "settings.reason.invalidKey": "未知配置键",
    "settings.reason.invalidValue": "取值非法",
    "settings.reason.invalidPatch": "补丁非法",
    "settings.reason.noProject": "未打开项目",
    "settings.reason.missing": "配置文件缺失",
    "settings.reason.invalidManifest": "项目清单非法",
    "settings.reason.unavailable": "不可用",
    "settings.reason.timeout": "超时",
    "settings.reason.malformed": "响应格式畸形",
    "settings.reason.probeFailed": "探活失败",
    "settings.providers.nameLabel": "名称",
    "settings.providers.presetLabel": "预设",
    "settings.providers.baseURLLabel": "Base URL",
    "settings.providers.modelLabel": "模型",
    "settings.providers.formatLabel": "协议格式",
    "settings.providers.keyLabel": "API 密钥",
    "settings.providers.activeToggle": "设为当前渠道",
    "settings.providers.addCustom": "添加自定义渠道",
    "settings.providers.addPreset": "添加预设渠道",
    "settings.providers.verify": "校验",
    "settings.providers.verify.ok": "校验通过 · ${count} 个模型",
    "settings.providers.verify.fail": "校验失败：${reason}",
    "settings.providers.noKey": "未配置密钥",
    "settings.providers.remove": "移除 ${name}",
    "settings.providers.active": "当前",
    "settings.agent.readonly": "只读",
    "settings.agent.save": "保存",
    "settings.model.current": "当前模型",
    "settings.model.empty": "暂无模型",
    "settings.model.use": "采用",
    "settings.mcp.kind.url": "URL",
    "settings.mcp.kind.command": "命令",
    "settings.mcp.remove": "移除 ${name}",
    "settings.mcp.nameLabel": "名称",
    "settings.mcp.configLabel": "配置（JSON）",
    "settings.mcp.add": "添加服务器",
    // ── 首启向导（批 9：`views/onboarding.mjs`）──
    "wizard.title": "初始设置",
    "wizard.dismiss": "关闭向导",
    "wizard.step.channel": "渠道",
    "wizard.step.model": "模型",
    "wizard.step.dir": "目录",
    "wizard.next": "下一步",
    "wizard.finish": "完成",
    "wizard.dir.hint": "选择项目目录——之后也可以更改。",
    "wizard.dir.pick": "选择目录…",
    "wizard.save": "保存渠道",
    // ── 项目级信息行（批 9：`views/info-row.mjs`）──
    "info.title": "项目信息",
    "info.threshold": "可开批",
    "info.phase": "相位",
    "info.phase.initialDev": "初始开发",
    "info.phase.production": "生产",
    "info.read.pool": "需求池",
    "info.read.tech": "技术待办",
    "info.read.aged": "老化",
    "info.state.none": "暂无读数",
  },
})

/** 语言值域（与核 `SUPPORTED_LOCALES` 同步 —— **显式常量**，不由 `HOST_DICT` 键集派生：
 *  派生下核增语种即静默分叉；本档零核导入 ⇒ 由用例机检「值域 == 核值域」）。 */
export const SUPPORTED_LOCALES = Object.freeze(["en", "zh"])

/** 缺省语言（未知终态 —— 与核同）。 */
export const FALLBACK_LOCALE = "en"

/** 当前语言（归一后）· 当前核域投影 · 宿主键表覆盖（测试缝，缺省 = 本档 `HOST_DICT`）。 */
let current = FALLBACK_LOCALE
let project = {}
let hostTable = null

/** 归一（**镜像核同形** `thincoder-core/i18n.mjs:75-81`：BCP-47 取基语言 `zh-CN` ⇒ `zh`；
 *  缺 / 空 / 非串 / 未知 ⇒ 缺省）。 */
export function normalizeLocale(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return FALLBACK_LOCALE
  if (SUPPORTED_LOCALES.includes(raw)) return raw
  const base = raw.split("-")[0]
  return SUPPORTED_LOCALES.includes(base) ? base : FALLBACK_LOCALE
}

/** 词表置位（引导面调用）→ 归一后的语言。`dict` = `config:read` 载荷的核投影（缺 / 非载体
 *  ⇒ 空投影）；`host` = 宿主键表覆盖（**测试缝** —— 先例 = 核 `_setSessionsDirForTest`：
 *  宿主表缺省 = 本档 `HOST_DICT`（缝：⑤ 优先级判据须能注入同名键）。 */
export function initDict({ locale, dict, host } = {}) {
  current = normalizeLocale(locale)
  project = dict !== null && typeof dict === "object" ? dict : {}
  hostTable = host !== null && typeof host === "object" ? host : null
  return current
}

/** 当前语言（归一后 —— 读数面）。 */
export function locale() { return current }

/** 插值：**核同形同语义** —— `${name}` 占位、逐参首发替换（镜像核 `t` 的替换面，
 *  `thincoder-core/i18n.mjs:91-93`）；缺参 / 参不匹配 ⇒ 占位原样保留（不吞、不抛）。 */
function interpolate(template, params) {
  if (params === null || typeof params !== "object") return template
  let out = template
  for (const [name, value] of Object.entries(params)) out = out.replace("${" + name + "}", String(value))
  return out
}

/** 解析序：宿主 → 核投影 → 键名自身。 */
export function t(key, params) {
  const hit = (hostTable ?? HOST_DICT[current] ?? {})[key] ?? project[key]
  if (typeof hit !== "string") return String(key)
  return params === undefined ? hit : interpolate(hit, params)
}
