/**
 * i18n-settings.mjs — 设置面词族第四档（i18n 拆分批 `docs/batches/2026-09-29-i18n-split.md` §2 · 台账 #614
 * 顶格消解：主档 `renderer/i18n.mjs` 内容行 500 顶格 ⇒ 自有 `settings.*` 族 55 键整族出档，本档承接）。
 *
 * 键面（**59 键** · 两语键集相等且同序；轮六（2026-10-02）增 `providers.verify.okShort` ∥ `.failShort` 两键——60 ⇒ 62；泛化行退役（2026-10-04）净删 `settings.agent.readonly` ∥ `.save` 两键——62 ⇒ 60；渠道档位退役（2026-10-04）净删 `settings.model.tier` 一键——60 ⇒ 59）：`settings.*` = 设置面（标题 ∕ 关闭 / 语言控件两键 = 目标语自名 / 主题三态族四键（D33） /
 * 四段名 / 两段态 / 十三失败码 / 渠道段：字段标 · 校验两态 `${count}` 与 `${reason}` · 移除 `${name}` ·
 * 当前标 · 两增键 / 模型段：当前 · 空态 · 采用 / MCP 段：两 kind · 字段标 ·
 * 移除 · 增键 —— 段名键单源 = `renderer/views/settings.mjs` `SECTIONS`，失败面段标 `SCOPE_WORD` 同键）。
 * S3 分档增（#673 · 2026-09-29）：失败码族补 `settings.reason.hostBusy`（渠行行标分档词 —— 消费面 =
 * `renderer/views/settings-sections.mjs`；值源 = VSC 硬编码词「宿主繁忙」同形，两语同增）。
 * 主题切换批增（#743 · 2026-09-30）：面头主题三态族四键（`settings.theme` ∥ `.system` ∥ `.light` ∥ `.dark` ——
 * 值 = 设计给定（en：Theme ∕ System ∕ Light ∕ Dark；zh：主题 ∕ 跟随系统 ∕ 亮色 ∕ 暗色）；消费面 =
 * `renderer/views/settings.mjs` `themeNode`）—— **56 ⇒ 60 键**（`HOST_DICT` 合并表 295 ⇒ 299 经合并点随动）。
 *
 * 值源：搬前主档原链注全述（键名 ∕ 两语值**逐字保原** —— 出档 = 纯搬零改；合并表两语键序同理零变，
 * 原位展开于 `question.cancel` 与向导注释之间）。
 * 消费面（设置面 **9** 档 · 皆 `t()` 取词、导入面零改动）：`renderer/settings-confirm.mjs`（密钥删除确认）·
 * `renderer/views/settings.mjs`（标题 ∕ 关闭 ∕ 语言 ∕ 段名 ∕ 态词 ∕ 失败码三表出词）·
 * `views/settings-controls.mjs` · `views/settings-sections.mjs` · `views/settings-sections-providers.mjs` · `views/settings-sections-env.mjs` ·
 * `views/settings-sections-mcp.mjs` · `views/settings-sections-models.mjs` · `views/settings-sections-tools.mjs`。
 * 合并点 = `renderer/i18n.mjs` `HOST_DICT` 两语展开 —— 单一装配点仍 = `initDict`（本档零装配逻辑，纯词表）。
 * 两语键集须相等（增键两语同增、禁单语落键）；零落盘 · 零 `node:` / 零裸包 · 零 `/rc/` 静态导入
 * （渲染面静态闭包判据 —— 经合并点主档保持平 node 可装载）。
 */
export const SETTINGS_DICT = Object.freeze({
  en: {
    // ── 设置面（批 9：`views/settings.mjs` + `views/settings-sections.mjs`）──
    "settings.title": "Settings",
    "settings.close": "Close settings",
    "settings.lang.en": "English",
    "settings.lang.zh": "中文",
    "settings.theme": "Theme",
    "settings.theme.system": "System",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.section.providers": "Providers",
    "settings.section.model": "Model",
    "settings.section.agent": "Agent options",
    "settings.section.mcp": "MCP",
    "settings.state.none": "Not configured",
    "settings.state.loading": "Loading…",
    "settings.reason.mtimeConflict": "Config changed elsewhere — reload before saving",
    "settings.reason.invalidShape": "Invalid config shape",
    "settings.reason.invalidKey": "Unknown config key",
    "settings.reason.invalidValue": "Invalid value",
    "settings.reason.invalidPatch": "Invalid patch",
    "settings.reason.noProject": "No working directory open",
    "settings.reason.missing": "Config file missing",
    "settings.reason.invalidManifest": "Invalid project manifest",
    "settings.reason.unavailable": "Unavailable",
    "settings.reason.hostBusy": "Host busy",
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
    "settings.providers.verify.okShort": "Verified",
    "settings.providers.verify.failShort": "Failed",
    "settings.providers.noKey": "No API key",
    "settings.providers.remove": "Remove ${name}",
    "settings.providers.active": "Active",
    "settings.proxyRow": "proxy",
    "settings.proxyRowTitle": "Route this provider's model requests through the proxy (needs global proxy.model on)",
    "settings.fetchModels": "Fetch Models",
    "settings.connecting": "Connecting…",
    "settings.connOk": "✓ Connected — ${count} models",
    "settings.providerUrlRequired": "baseURL required",
    "settings.secretDeleteConfirm": "Delete? This cannot be undone — the original credential cannot be recovered; you would have to reconfigure it or get a new one from the provider.",
    "settings.model.current": "Current model",
    "settings.model.empty": "No models yet",
    "settings.model.use": "Use",
    "settings.mcp.kind.url": "URL",
    "settings.mcp.kind.command": "Command",
    "settings.mcp.remove": "Remove ${name}",
    "settings.mcp.nameLabel": "Name",
    "settings.mcp.add": "Add server",
  },
  zh: {
    // ── 设置面（批 9：`views/settings.mjs` + `views/settings-sections.mjs`）──
    "settings.title": "设置",
    "settings.close": "关闭设置",
    "settings.lang.en": "English",
    "settings.lang.zh": "中文",
    "settings.theme": "主题",
    "settings.theme.system": "跟随系统",
    "settings.theme.light": "亮色",
    "settings.theme.dark": "暗色",
    "settings.section.providers": "渠道",
    "settings.section.model": "模型",
    "settings.section.agent": "agent 参数",
    "settings.section.mcp": "MCP",
    "settings.state.none": "未配置",
    "settings.state.loading": "载入中…",
    "settings.reason.mtimeConflict": "配置已在别处变更——请重载后再保存",
    "settings.reason.invalidShape": "配置形态非法",
    "settings.reason.invalidKey": "未知配置键",
    "settings.reason.invalidValue": "取值非法",
    "settings.reason.invalidPatch": "补丁非法",
    "settings.reason.noProject": "未打开工作目录",
    "settings.reason.missing": "配置文件缺失",
    "settings.reason.invalidManifest": "项目清单非法",
    "settings.reason.unavailable": "不可用",
    "settings.reason.hostBusy": "宿主繁忙",
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
    "settings.providers.verify.okShort": "校验通过",
    "settings.providers.verify.failShort": "校验失败",
    "settings.providers.noKey": "未配置密钥",
    "settings.providers.remove": "移除 ${name}",
    "settings.providers.active": "当前",
    "settings.proxyRow": "代理",
    "settings.proxyRowTitle": "该 provider 的模型请求走代理（需全局 proxy.model 开启）",
    "settings.fetchModels": "拉取模型",
    "settings.connecting": "连接中…",
    "settings.connOk": "✓ 连接成功 — ${count} 个模型",
    "settings.providerUrlRequired": "需要 baseURL",
    "settings.secretDeleteConfirm": "确定删除？删除后无法恢复——凭证原文不可复得，只能重新配置或回服务商重取。",
    "settings.model.current": "当前模型",
    "settings.model.empty": "暂无模型",
    "settings.model.use": "采用",
    "settings.mcp.kind.url": "URL",
    "settings.mcp.kind.command": "命令",
    "settings.mcp.remove": "移除 ${name}",
    "settings.mcp.nameLabel": "名称",
    "settings.mcp.add": "添加服务器",
  },
})
