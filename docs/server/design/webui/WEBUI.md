# Thincoder Server · 控制台前端（webui/WEBUI）

> 板块 = server ∥ 本档 = webui 域（页面路由 ∥ HTML ∥ 静态资源）；板总览 = `docs/server/design/PROJECT.md`（文档地图 = §3）。
> 本域回指 = `docs/server/design/PROJECT.md` §7（非功能·前端自洽 = 本档 §6）。
> 面档：沙盒面 = `docs/server/design/webui/SANDBOX.md` ∥ 管理面对话 = `docs/server/design/webui/CHAT.md` ∥ 系统页 = `docs/server/design/webui/SYSTEM.md` ∥ 读数面 = `docs/server/design/webui/READINGS.md` ∥ 我的面 = `docs/server/design/webui/ME.md` ∥ 管理数据面 = `docs/server/design/webui/ADMIN.md` ∥ 样式与版式 = `docs/server/design/webui/STYLE.md` ∥ 多语言 = `docs/server/design/webui/I18N.md`。

## 1. 静态面

- 落点 = `thincoder-server/public/`（已落盘）：`index.html`（壳——侧栏容器 + 挂载点 + 模块入口）∥ `app.mjs`（入口：路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 启动装配）∥ `dom.mjs`（渲染助手 + 提示条）∥ `health.mjs`（健康轮询）∥ `nav.mjs`（IA 单源——组/项数据 + 路由解析纯函数）∥ `style.css`。
- **视图档（按页分档——§2）**：按页族逐条起名，一项一族。
  - **登录与我的三页**：`views-auth.mjs`（登录）∥ `views-me.mjs`（我的·key/用量/账户三页）。
  - **成员管理**：`views-admin.mjs`（成员管理）。
  - **用量与看板**：`views-usage.mjs`（已落盘——全队用量 + 看板——`docs/server/design/webui/READINGS.md` §2.1②）。
  - **管理总览**：`views-overview.mjs`（已落盘——管理总览——`docs/server/design/webui/READINGS.md` §2.1③）。
  - **审计**：`views-audit.mjs`（已落盘——审计——`docs/server/design/webui/READINGS.md` §2.1④）。
  - **Provider（含弹窗件）**：`views-providers.mjs`（Provider——列表 + 双弹窗编排；`docs/server/design/webui/ADMIN.md` §2.1④）∥ `views-providers-modals.mjs`（Provider 弹窗件——添加流 ∥ 详情流；`docs/server/design/webui/ADMIN.md` §2.1④）。
  - **系统（含系统配置卡）**：`views-system.mjs`（系统——版本/更新 ∥ 接入卡 ∥ 向量服务 ∥ 服务健康；`docs/server/design/webui/SYSTEM.md` §2.1）∥ `views-system-config.mjs`（系统配置卡——含代理设置 ∥ 连通测试块；`docs/server/design/webui/SYSTEM.md` §2.1 ∥ §2.2）。
  - **服务模型（含展示元数据快照）**：`views-models.mjs`（已落盘——服务模型：列表 + 详情/配置弹窗——`docs/server/design/webui/ADMIN.md` §2.1③）∥ `model-specs-snapshot.mjs`（已落盘——展示元数据快照——`docs/server/design/webui/ADMIN.md` §2.1③）。
  - **沙盒（含卷 / 连接 / 我的工作区）**
    - `views-sandbox.mjs`（已落盘——沙盒页：运行面卡 + 容器区/镜像区——`docs/server/design/webui/SANDBOX.md` §2.1①）∥ `views-sandbox-containers.mjs` ∥ `views-sandbox-images.mjs`（容器面/镜像族件——`docs/server/design/webui/SANDBOX.md` §2.1①）。
    - `views-sandbox-volumes.mjs`（已落——卷族件——`docs/server/design/webui/SANDBOX.md` §2.1①）∥ `views-sandbox-connection.mjs`（已落——连接面 TLS 档——`docs/server/design/webui/SANDBOX.md` §2.1①）∥ `views-me-sandbox.mjs`（已落——我的·工作区——`docs/server/design/webui/SANDBOX.md` §2.2）。
  - **对话（含输入区 / 消息面 / 成员面三件）**
    - `views-chat.mjs`（管理面对话页——`docs/server/design/webui/CHAT.md` §2.1）∥ `views-chat-composer.mjs`（对话页输入区适配层 ∥ 状态行 ∥ 斜杠表——`docs/server/design/webui/CHAT.md` §3）∥ `views-chat-messages.mjs`（已落——对话页消息面（帧面纯函数 ∥ 回读装配）——`docs/server/design/webui/CHAT.md` §3）。
    - `views-me-chat.mjs` ∥ `views-me-chat-messages.mjs` ∥ `views-me-chat-composer.mjs`（成员面对话页三件——`docs/server/design/webui/CHAT.md` §2.2）。
  - **项目（含管理侧两标签壳与 Git 源）**
    - `views-projects.mjs`（已落——我的·项目 + 共用构建器（项目详情弹窗 ∥ 添加仓对话框）——`docs/server/design/webui/PROJECTS.md` §2.1）。
    - `views-admin-projects.mjs`（已落——管理·项目**两标签壳**（项目 ∥ Git 源）——`docs/server/design/webui/PROJECTS.md` §2.2/§2.3）∥ `views-git-sources.mjs`（已落——**Git 源面板**（标签②——页题 h2 撤）——`docs/server/design/webui/PROJECTS.md` §2.4）。
  - **终端核五件与消费件**：`terminal-core.mjs` ∥ `terminal-vt.mjs` ∥ `terminal-codec.mjs` ∥ `terminal-render.mjs` ∥ `terminal-link.mjs` ∥ `views-sandbox-terminal.mjs`（已落——终端核五件（解析/网格 ∥ VT 解析面 ∥ 编解码面 ∥ DOM 渲染 ∥ WS 传输）+ 控制台消费件——`docs/server/design/webui/TERMINAL.md` §2/§3 ∥ `docs/server/design/webui/SANDBOX.md` §2.1①）。
  - **MCP**：`views-mcp.mjs`（已落——MCP 页（清单 ∥ 探活读数 ∥ 增/改/删弹窗）——`docs/server/design/webui/MCP.md` §2）。
  - **公共组件**：`modal.mjs`（已落盘——弹窗 + 窗体助手四件——`docs/server/design/webui/ADMIN.md` §2.1①）∥ `tabs.mjs`（已落——公共标签页组件——`docs/server/design/webui/TABS.md` §2.1）。
- 视图拆分 = 按页归档（每档 ≤300）。
- 直发 = `thincoder-server/src/webui/static.mjs`（已落盘）：`node:http` 读发 `public/`——mime 表（`.mjs` ⇒ text/javascript） ∥ 防路径穿越 ∥ `Cache-Control: no-cache`（内部工具——改版即见）。
- 路由：`GET /` ⇒ `index.html`；其余静态档按名直发（同源）；`/v1/*` 与 `/api/*` 优先于静态面（分派 = `docs/server/design/gateway/API.md` §1）。
- 形态钉死（用户令）：**零框架 ∥ 零构建 ∥ 零外部资源**（无 CDN ∥ 无外链字体——内网自洽）；先例 = 本仓 webview（`thincoder-vscode/webview/`）的 vanilla 口径。
- JS = **六十九档**：`modal.mjs` ∥ `i18n.mjs` ∥ `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ i18n 部件**十八档**（`i18n-{zh,en}-{shell,me,admin,sandbox,system,core,project,ledger,mcp}.mjs`——`docs/server/design/webui/I18N.md` §2.1 拆表） ∥ `model-specs-snapshot.mjs`）+ `style.css`；行标 = ≤500 软线。
- **档目（UI 代码档 ∥ 含 favicon 全目录——AC 行口径）单源 = 本节**：UI 代码档 **71** ∥ 含 favicon 全目录 **72**（实读 2026-10-16；口径 = 全目录档数 −1（favicon.png）；UI 代码 = 69 `*.mjs` + 1 `style.css` + 1 `index.html`；全目录 = + favicon.png）。
- **静态面双根**：`public/`（本根）+ **`/rc/*` → `@thincoder/render-core` 包目录**（渲染核供给根——`static.mjs` 前缀表；两先例同形 = 桌面 `app://` 双根 ∥ VSC 相对径）。

## 2. 控制台 IA 与视图（哈希路由——KD-SV-20）

- **形态（定稿）**：**左侧栏**分组导航 + 内容区；hash 路由扩展为 `#/<组>/<页>`；一页一职责。

| 组 | 页（hash） | 职责 | 角色 |
|---|---|---|---|
| 我的 | `#/me/chat` | 对话（成员面 agent——开发：工作区绑定会话 + 流式对话区 + 工具调用行 + 输入区全件；工作区选择/盒态动作（启动/拉仓）；**会话源 = 盒内**（离线 ⇒ 就启动引导）——`docs/server/design/webui/CHAT.md` §2.2；非壳页） | 全体 |
| 我的 | `#/me/keys` | API Key 表（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作——多把并存；`docs/server/design/webui/ME.md` §2.1） ∥ 签发新 API Key（弹窗 ∥ 新明文一次性区带复制钮） ∥ 逐把吊销（弹窗） | 全体 |
| 我的 | `#/me/usage` | 本人用量看板（`docs/server/design/webui/ME.md` §2.2——概览卡行 ∥ 筛选行 ∥ KPI 行 ∥ 按日主图（维度切换 端点/模型）∥ 分模型区 ∥ 明细表）+ 向量服务提示条（模型名 ∥ snippet——`docs/server/design/webui/READINGS.md` §2.1①；缺 `embedding` 段 ⇒ 不渲染） | 全体 |
| 我的 | `#/me/account` | 基本信息（展示名/用户名/角色）+ 自助改密 | 全体 |
| 我的 | `#/me/projects` | 我的·项目：可见项目表（显示名 ∥ 仓地址 ∥ 源 ∥ 我的权限 ∥ 负责人——搜索 ∥ 行点击 ⇒ 项目详情弹窗（权限感知：成员表 ∥ 加成员 ∥ 改显示名/地址/负责人——按能力显隐）；`docs/server/design/webui/PROJECTS.md` §2.1） | 全体 |
| 我的 | `#/me/sandbox` | 我的工作区：本人工作区状态（盒状态（含回收原因） ∥ 快照 ∥ 所属 runner——`docs/server/design/webui/SANDBOX.md` §2.2；只读） | 全体 |
| 我的 | `#/me/ledger` | 团队台账：列表（编号 ∥ 仓 ∥ 标题 ∥ 状态（+老化标） ∥ 负责人 ∥ 更新 ∥ 操作）∥ 三筛（仓/状态/负责人）∥ 新建/编辑/收口/撤回——`docs/server/design/webui/LEDGER.md` §2.1 | 全体 |
| 管理 | `#/admin/overview` | 总览（落地页）：今日请求/token ∥ 成员数 ∥ 健康 ∥ 更新提示 ∥ 快捷入口（`docs/server/design/webui/READINGS.md` §2.1③） | admin |
| 管理 | `#/admin/chat` | 对话（管理面 agent——运维/管理：机队 ∥ 成员与 provider ∥ 审查排障；会话列表 + 流式对话区 + 工具调用行——`docs/server/design/webui/CHAT.md` §2.1；非壳页） | admin |
| 管理 | `#/admin/members` | 成员表（行点击 ⇒ 详情弹窗——模型表直显（逐行已用 ∥ 禁用勾选） ∥ 设额度（分模型） ∥ 重置密码 ∥ 逐 key 吊销；新建成员弹窗——`docs/server/design/webui/ADMIN.md` §2.1②） | admin |
| 管理 | `#/admin/projects` | 项目（**两标签：项目 ∥ Git 源**——一页两标签；旧址 `#/admin/git-sources` ⇒ 本页 Git 源标签）：面板① 全量项目表（显示名 ∥ 仓地址 ∥ 源 ∥ 负责人 ∥ 成员数——搜索 ∥「添加仓」（源选单 + 拉列表勾选批量 + 手输保底）∥ 行点击 ⇒ 详情弹窗（admin 能力面全显））∥ 面板② 源表（名字 ∥ 平台 ∥ PAT 掩码 ∥ 状态 ∥ 同步方式 ∥ 上次同步 ∥ 操作（立即同步 ∥ 拉列表 ∥ 体检 ∥ 编辑 ∥ 删除））+ 添/编/删弹窗——`docs/server/design/webui/PROJECTS.md` §2.2/§2.3/§2.4） | admin |
| 管理 | `#/admin/projects/<tab>` | 子段形（`projects` ∥ `git-sources`）——刷新/分享/直打落对应标签；切换 = 页内 `replaceState`（零重渲）——`docs/server/design/webui/TABS.md` §2.2 四岔口（第二消费面） | admin |
| 管理 | `#/admin/providers` | Provider 列表（行点击 ⇒ 详情弹窗：基本信息 ∥ 服务模型勾选）∥ 页首「添加」⇒ 添加弹窗（预设/自定义两径；数据源 = providers ∥ presets 端点——契约 = `docs/server/design/gateway/API.md` §2.2；`docs/server/design/webui/ADMIN.md` §2.1④） | admin |
| 管理 | `#/admin/models` | 服务模型：开放清单（`/v1/models` 同源——provider 派生）∥ 列表配额列 ∥ 详情/配置弹窗（A/C/D/E + 配额 F——`docs/server/design/webui/ADMIN.md` §2.1③） | admin |
| 管理 | `#/admin/mcp` | MCP 服务器清单（表：名 ∥ 传输 ∥ 目标 ∥ 启用 ∥ 操作（探活/改/删））∥「添加」弹窗（三传输字段 ∥ 秘密零回填）∥ 行内探活读数行——`docs/server/design/webui/MCP.md` §2 | admin |
| 管理 | `#/admin/usage` | 全队用量：过滤 + 趋势/聚合/排行 + 导出（`docs/server/design/webui/READINGS.md` §2.1②） | admin |
| 管理 | `#/admin/audit` | 审计事件列表（过滤：类型/成员/时段——`docs/server/design/webui/READINGS.md` §2.1④） | admin |
| 管理 | `#/admin/system` | 版本与更新 ∥ 成员接入 ∥ 向量服务 ∥ 服务配置（含代理设置 ∥ 连通测试块——`docs/server/design/webui/SYSTEM.md` §2.2） ∥ 服务健康（数据 = `/api/system` ∥ `docs/server/design/webui/SYSTEM.md` §2.1） | admin |
| 管理 | `#/admin/sandbox` | 沙盒：运行面 ∥ 工作区 ∥ 资源与 TTL ∥ 审计可查（四面——`docs/server/design/webui/SANDBOX.md` §2.1；非壳页；**两标签**：运行面 ∥ 镜像与镜像源（子段形——`docs/server/design/webui/TABS.md` §2.2）） | admin |

- 登录 = `#/login`（无侧栏——登录卡）；`#/` ∥ 未知 ⇒ 角色默认页（admin ⇒ `#/admin/overview` ∥ user ⇒ `#/me/keys`）。
- **计数口径**（IA 单源）：各式页面/组项计数 = `nav.mjs` `NAV_GROUPS` 数据实读（组项数）；**登录页不属侧栏、不计入**（登录页单列——「十八页 + 登录」式）；各式计数语句与此一致。
- **旧链迁移**：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview` ∥ `#/admin/proxy` ⇒ `#/admin/system` ∥ **`#/admin/git-sources` ⇒ `#/admin/projects/git-sources`**（Git 源并入项目页标签②；重定向带子段——`app.mjs` 拼回 ⇒ 落点/刷新/直打均达；旧书签可达；`#/admin/members` 等页路径仍直达）。
- **路由解析 = `nav.mjs` 纯函数**（`resolveRoute(path, role)`——无 DOM、单元测试档直测）：**解析序 = 别名先行、子段裁分在其后**（别名目标再走裁分 ⇒ `sub` 回传——`#/admin/git-sources` ⇒ `/admin/projects` + `sub: "git-sources"`）；别名重定向 ∥ 角色默认 ∥ admin 面 `denied`（页面级「无权限」块——判据仍在服务端，§3）。
  **子段容许（裁定「进」）**：`#/<组>/<页>/<子段>`——裁末段试前缀（在册 ⇒ 记 `sub` 供页面消费 ∥ 未在册 ⇒ 照旧默认页回落）；既有 hash 形行为逐字不变（`docs/server/design/webui/TABS.md` §2.2）。
- **导航渲染**：侧栏 = 品牌 ∥ 组标题 + 项（活动态高亮）∥ 底部（meta 槽（健康状态灯（`docs/server/design/webui/READINGS.md` §2.1⑤） ∥ 版本——`/api/system`，全角色） + 语言切换器 + 退出登录）；admin 组仅 admin 渲染。
- **窄屏**：`≤760px` 侧栏降级为顶条（单条媒体查询——非移动端适配承诺）。
- **文案面（多语言——`docs/server/requirements/PROJECT.md` §2:13）**：全量文案单源 = 文案表（`i18n-zh.mjs` ∥ `i18n-en.mjs`）；`nav.mjs` 数据持 `labelKey`（键——非字面量）；页档/助手经 `t()` 取值——机制全文 = `docs/server/design/webui/I18N.md` §2.1。
- 数据全经 `/api/*`（契约 = `docs/server/design/accounts/ACCOUNTS.md` §3 ∥ `docs/server/design/metering/METERING.md` §3 ∥ `docs/server/design/gateway/API.md` §2.2）；`GET /` 公开（页面壳零数据）。

- **数据表页视口高壳（功能点 20——`docs/server/design/webui/STYLE.md` §2.2）**：数据表五页（成员 ∥ Provider ∥ 服务模型 ∥ 审计 ∥ 用量明细 `#/me/usage`）= 壳面；`#/admin/usage` 看板页不入壳；机制全文 = `docs/server/design/webui/STYLE.md` §2.2。

### 2.1 系统页与 meta 槽（版本/更新 ∥ 成员接入 ∥ 向量服务 ∥ 服务配置 ∥ 服务健康）

⇒ 见 `docs/server/design/webui/SYSTEM.md` §2.1。

### 2.2 多语言（中文 ∥ English——需求 §2:13）

⇒ 机制 = `docs/server/design/webui/I18N.md` §2.1 ∥ 键族登记 = 各面档「文件账·键族登记」节（`docs/server/design/webui/SANDBOX.md` §3 ∥ `docs/server/design/webui/CHAT.md` §3 ∥ `docs/server/design/webui/ME.md` §3 ∥ `docs/server/design/webui/SYSTEM.md` §3 ∥ `docs/server/design/webui/ADMIN.md` §3）。

### 2.3 可见面二轮（六面机制——功能点 15；另含可见面：⑥ 功能点 25 ∥ ⑦ 功能点 26）

- **① 向量服务可见面** ⇒ `docs/server/design/webui/READINGS.md` §2.1①。
- **② 用量看板升级** ⇒ `docs/server/design/webui/READINGS.md` §2.1②。
- **③ 管理总览** ⇒ `docs/server/design/webui/READINGS.md` §2.1③。
- **④ 审计/安全面** ⇒ `docs/server/design/webui/READINGS.md` §2.1④。
- **⑤ 健康可见** ⇒ `docs/server/design/webui/READINGS.md` §2.1⑤。
- **⑥ 「我的·key 与签发」页重做** ⇒ `docs/server/design/webui/ME.md` §2.1。
- **⑦ 「我的·用量」页图表化** ⇒ `docs/server/design/webui/ME.md` §2.2。

### 2.4 弹窗机制与成员/服务模型/Provider 面（功能点 16 ∥ 17 ∥ 18）

**① 公共弹窗组件** ⇒ `docs/server/design/webui/ADMIN.md` §2.1①。
**② 成员弹窗（三态：查看 ∥ 编辑 ∥ 新建）** ⇒ `docs/server/design/webui/ADMIN.md` §2.1②。
**③ 服务模型页与配置面** ⇒ `docs/server/design/webui/ADMIN.md` §2.1③。
**④ Provider 管理面（列表 + 双弹窗）** ⇒ `docs/server/design/webui/ADMIN.md` §2.1④。

### 2.5 样式族规范（功能点 19——全控制台样式收束）

⇒ 见 `docs/server/design/webui/STYLE.md` §2.1。

### 2.6 数据表页视口高壳与布局收正（功能点 20）

⇒ 见 `docs/server/design/webui/STYLE.md` §2.2。

### 2.7 代理设置与连通测试（系统页「服务配置」卡内——功能点 30）

⇒ 见 `docs/server/design/webui/SYSTEM.md` §2.2。

### 2.8 沙盒页（管理——`#/admin/sandbox`）

**① 运行面** ⇒ `docs/server/design/webui/SANDBOX.md` §2.1①。

⇒ 全节（形态 ∥ ②–⑥ 余面 ∥ 镜像源族 ∥ 一键拉取 ∥ 拉取认源 ∥ 卷族）见 `docs/server/design/webui/SANDBOX.md` §2.1。

### 2.9 我的·工作区（`#/me/sandbox`——成员面）

⇒ 见 `docs/server/design/webui/SANDBOX.md` §2.2。

### 2.10 管理面对话（`#/admin/chat`；机制全文 = `docs/server/design/agent/ADMIN-AGENT.md` §11）

⇒ 见 `docs/server/design/webui/CHAT.md` §2.1。

### 2.11 控制台公共标签页组件（功能点 39；机制全文 = `docs/server/design/webui/TABS.md` §2.1）

⇒ 见 `docs/server/design/webui/TABS.md` §2.1。

### 2.12 团队项目与权限面（`#/me/projects` ∥ `#/admin/projects`（两标签：项目 ∥ Git 源）；机制全文 = `docs/server/design/project/PROJECTS.md`）

⇒ 见 `docs/server/design/webui/PROJECTS.md` §2。

## 3. 判权与安全

- **判权全在后端**（会话 + 角色——`docs/server/design/accounts/ACCOUNTS.md` §3）：前端仅显隐与表单；`user` 直打管理端点 ⇒ 403——页面不是判据；管理组导航仅 admin 渲染 ∥ admin hash 由 `nav.mjs` 判 `denied` 落「无权限」块（含 provider 管理面——服务端为准）。admin 端点（总览 ∥ 向量服务 ∥ 审计 ∥ 用量报表）同门；`/healthz` = 公开（轮询零凭据——在案）。
  项目面（`/api/projects*`）= 会话 + 能力矩阵（`docs/server/design/project/PROJECTS.md` §3——`user` 可达可见面，控件按 `can` 显隐；管理面与 Git 源面仍 admin 门）。
- 会话在 HttpOnly cookie（前端零令牌存储）；`401` ⇒ 回 `#/login`（会话过期即回登录）；`403` ⇒ 提示无权限。
- 渲染与转义（**收窄**）：控制台自有节点 = `h`/`textContent`（零**手拼** HTML 串）；**含模型/用户/工具内容的文本面 = 核 `md()` 单源渲 HTML 入 `innerHTML`**（注入点 = 页面唯一；核内输入先全量转义——对照表 = `docs/server/design/webui/CHAT.md` §2.1）。

## 4. 视觉与自托管

- 系统字体 ∥ 表格 + 表单 ∥ 桌面优先（宽表横滚）；全自托管（无外部资源引用）；侧栏分组导航（§2）∥ 窄屏降级 = §2 末条。

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数 | 职责 |
|---|---|---|
| `thincoder-server/src/webui/static.mjs`（已落盘） | **114** | `public/` 直发 ∥ mime ∥ 防穿越 ∥ no-cache ∥ **`/rc/*` → 核包目录（第二根——`@thincoder/render-core`）** |
| `thincoder-server/public/index.html`（已落盘） | **20** | 前端壳（挂载点 + 模块入口） |
| `thincoder-server/public/app.mjs`（已落盘） | **209** | 入口：路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 启动装配 |
| `thincoder-server/public/dom.mjs`（已落盘） | **118**（`h` ∥ `table` ∥ `fmtTs`/`fmtValue`/`fmtModelQuotas` ∥ `showSecret`/`copyText` ∥ `usageTable` ∥ `dataShell` ∥ `flash`（携 `flashEl`/计时器）） | 渲染助手 ∥ 格式化 ∥ 提示条 |
| `thincoder-server/public/health.mjs`（已落盘） | **62**（`HEALTH_POLL_MS` ∥ 三态文案键 ∥ `healthSnapshot` ∥ `onHealth` ∥ 灯直更 ∥ `pollHealth` ∥ 启停 ∥ 订阅清零口） | 健康轮询（`docs/server/design/webui/READINGS.md` §2.1⑤ 三落点共源） |
| `thincoder-server/public/nav.mjs`（已落盘） | **107** | IA 单源（§2 ∥ §2.1） |
| `thincoder-server/public/views-auth.mjs` | ⇒ `docs/server/design/webui/ME.md` §3 | —— |
| `thincoder-server/public/views-me.mjs` | ⇒ `docs/server/design/webui/ME.md` §3（账户页「Git 凭据」卡） | —— |
| `thincoder-server/public/views-admin.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/views-providers.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/views-providers-modals.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/views-system.mjs` | ⇒ `docs/server/design/webui/SYSTEM.md` §3 | —— |
| `thincoder-server/public/views-system-config.mjs` | ⇒ `docs/server/design/webui/SYSTEM.md` §3 | —— |
| `thincoder-server/public/views-usage.mjs` | ⇒ `docs/server/design/webui/READINGS.md` §3 | —— |
| `thincoder-server/public/views-overview.mjs` | ⇒ `docs/server/design/webui/READINGS.md` §3 | —— |
| `thincoder-server/public/views-chat.mjs` | ⇒ `docs/server/design/webui/CHAT.md` §3 | —— |
| `thincoder-server/public/views-chat-composer.mjs`（新建） | ⇒ `docs/server/design/webui/CHAT.md` §3 | —— |
| `thincoder-server/public/views-chat-messages.mjs`（已落） | ⇒ `docs/server/design/webui/CHAT.md` §3（面小计本档行） | —— |
| `thincoder-server/public/views-audit.mjs` | ⇒ `docs/server/design/webui/READINGS.md` §3 | —— |
| `thincoder-server/public/views-models.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/model-specs-snapshot.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/views-sandbox.mjs` | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-sandbox-containers.mjs` | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-sandbox-images.mjs` | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-sandbox-image-sources.mjs` | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-sandbox-volumes.mjs`（已落） | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-sandbox-base.mjs`（已落） | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-sandbox-connection.mjs`（已落——连接面 TLS 档） | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/views-me-sandbox.mjs`（已落） | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/modal.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/tabs.mjs`（已落） | ⇒ `docs/server/design/webui/TABS.md` §3 | —— |
| `thincoder-server/public/terminal-core.mjs`（已落） | ⇒ `docs/server/design/webui/TERMINAL.md` §3 | —— |
| `thincoder-server/public/terminal-vt.mjs`（已落——核件拆出） | ⇒ `docs/server/design/webui/TERMINAL.md` §3 | —— |
| `thincoder-server/public/terminal-codec.mjs`（已落——核件拆出） | ⇒ `docs/server/design/webui/TERMINAL.md` §3 | —— |
| `thincoder-server/public/terminal-render.mjs`（已落） | ⇒ `docs/server/design/webui/TERMINAL.md` §3 | —— |
| `thincoder-server/public/terminal-link.mjs`（已落） | ⇒ `docs/server/design/webui/TERMINAL.md` §3 | —— |
| `thincoder-server/public/views-sandbox-terminal.mjs`（已落） | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/style.css` | ⇒ `docs/server/design/webui/STYLE.md` §3 | —— |
| `thincoder-server/public/i18n.mjs` | ⇒ `docs/server/design/webui/I18N.md` §3 | —— |
| `thincoder-server/public/i18n-zh.mjs` | ⇒ `docs/server/design/webui/I18N.md` §3 | —— |
| `thincoder-server/public/i18n-zh-shell.mjs`（已落盘） | **82** | 文案表·zh·壳族 |
| `thincoder-server/public/i18n-zh-me.mjs` | ⇒ `docs/server/design/webui/ME.md` §3 | —— |
| `thincoder-server/public/i18n-zh-admin.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/i18n-zh-sandbox.mjs` | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/i18n-zh-system.mjs` | ⇒ `docs/server/design/webui/SYSTEM.md` §3 | —— |
| `thincoder-server/public/i18n-zh-core.mjs` | ⇒ `docs/server/design/webui/CHAT.md` §3 | —— |
| `thincoder-server/public/i18n-en.mjs` | ⇒ `docs/server/design/webui/I18N.md` §3 | —— |
| `thincoder-server/public/i18n-en-shell.mjs`（已落盘） | **80** | 文案表·en·壳族 |
| `thincoder-server/public/i18n-en-me.mjs` | ⇒ `docs/server/design/webui/ME.md` §3 | —— |
| `thincoder-server/public/i18n-en-admin.mjs` | ⇒ `docs/server/design/webui/ADMIN.md` §3 | —— |
| `thincoder-server/public/i18n-en-sandbox.mjs` | ⇒ `docs/server/design/webui/SANDBOX.md` §3 | —— |
| `thincoder-server/public/i18n-en-system.mjs` | ⇒ `docs/server/design/webui/SYSTEM.md` §3 | —— |
| `thincoder-server/public/i18n-en-core.mjs` | ⇒ `docs/server/design/webui/CHAT.md` §3 | —— |
| `thincoder-server/public/views-projects.mjs`（已落） | ⇒ `docs/server/design/webui/PROJECTS.md` §3 | —— |
| `thincoder-server/public/views-admin-projects.mjs`（已落） | ⇒ `docs/server/design/webui/PROJECTS.md` §3 | —— |
| `thincoder-server/public/views-git-sources.mjs`（已落） | ⇒ `docs/server/design/webui/PROJECTS.md` §3；**转面板件**（页题 h2 撤 ∥ 导出名不变）——`docs/server/design/webui/PROJECTS.md` §2.4 | —— |
| `thincoder-server/public/i18n-zh-project.mjs`（已落） | ⇒ `docs/server/design/webui/PROJECTS.md` §3 | —— |
| `thincoder-server/public/i18n-en-project.mjs`（已落） | ⇒ `docs/server/design/webui/PROJECTS.md` §3 | —— |
| `thincoder-server/public/views-mcp.mjs`（已落；**259**） | ⇒ `docs/server/design/webui/MCP.md` §3 | —— |
| `thincoder-server/public/i18n-zh-mcp.mjs`（已落；**56**） | ⇒ `docs/server/design/webui/MCP.md` §3 | —— |
| `thincoder-server/public/i18n-en-mcp.mjs`（已落；**56**） | ⇒ `docs/server/design/webui/MCP.md` §3 | —— |

## 6. 验收判据（机检）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 前端自洽 | `public/**` 零外部引用（无 `http(s)://` 外链 ∥ 无 CDN ∥ 无外链字体——扫描断言，扫描面 = 全量新档）；静态直发 mime 正确 ∥ 路径穿越拒；档目断言随正（口径 = UI 代码档 ∥ 含 favicon 全目录——单源 = `docs/server/design/webui/WEBUI.md` §1；链不复述；`-webui-deploy` 件） | 单元测试档 |
| AC-11（控制台 provider 面——判据全文 = `docs/server/design/gateway/API.md` §5 AC-11 行） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-12（功能点 14——控制台 IA；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `nav.mjs` 直测：组/项结构（我的 **7** ∥ 管理 **11** ∥ admin 组仅 admin） ∥ 重定向（`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview` ∥ `#/admin/proxy` ⇒ `#/admin/system` ∥ `#/admin/git-sources` ⇒ `#/admin/projects/git-sources`（重定向带子段）） ∥ 角色默认 ∥ admin 面 `denied` ∥ 子段容许（`#/<组>/<页>/<子段>` 裁末段 + `sub` 回传——`docs/server/design/webui/TABS.md` §2.2）；静态档目随正（单源 = `docs/server/design/webui/WEBUI.md` §1——链不复述）∥ 管理页拆分（成员/用量/总览/审计/服务模型各一页） | 单元测试档 |
| AC-13③④（功能点 12——版本/更新可见 ∥ 成员接入卡） | ⇒ `docs/server/design/webui/SYSTEM.md` §4 | —— |
| AC-14（功能点 13——控制台多语言） | ⇒ `docs/server/design/webui/I18N.md` §4 | —— |
| AC-15（功能点 15——控制台可见面六面；三拆） | ⇒ ① = `docs/server/design/webui/SYSTEM.md` §4 ∥ ②–⑤ = `docs/server/design/webui/READINGS.md` §4 ∥ ⑥ = `docs/server/design/webui/ME.md` §4 | —— |
| AC-16（功能点 16——控制台弹窗交互） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-17（功能点 17——服务模型页 ∥ 配置面） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-17（续·机检口径） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-18（功能点 18——Provider 管理面重做） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-19（功能点 19——样式族总体统一） | ⇒ `docs/server/design/webui/STYLE.md` §4 | —— |
| AC-19（续·机检口径） | ⇒ `docs/server/design/webui/STYLE.md` §4 | —— |
| AC-20（功能点 20——控制台布局收正） | ⇒ `docs/server/design/webui/STYLE.md` §4 | —— |
| AC-20（续·机检口径） | ⇒ `docs/server/design/webui/STYLE.md` §4 | —— |
| AC-21（功能点 21——配额配置面） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-23（功能点 23——成员模型面 v2） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-23（续·机检口径） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-24（功能点 24——上游模型元数据留存与展示） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-24（续·机检口径） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-25（功能点 25——「我的·key 与签发」页重做） | ⇒ `docs/server/design/webui/ME.md` §4 | —— |
| AC-25（续·机检口径） | ⇒ `docs/server/design/webui/ME.md` §4 | —— |
| AC-26（功能点 26——「我的·用量」页图表化） | ⇒ `docs/server/design/webui/ME.md` §4 | —— |
| AC-26（续·机检口径） | ⇒ `docs/server/design/webui/ME.md` §4 | —— |
| AC-28（功能点 28——server 配置控制台） | ⇒ `docs/server/design/webui/SYSTEM.md` §4 | —— |
| AC-28（续·机检口径） | ⇒ `docs/server/design/webui/SYSTEM.md` §4 | —— |
| AC-29①（功能点 29——配置形：控制台编辑面） | ⇒ `docs/server/design/webui/ADMIN.md` §4 | —— |
| AC-30（功能点 30——代理设置与连通测试） | ⇒ `docs/server/design/webui/SYSTEM.md` §4 | —— |
| AC-30（续·机检口径） | ⇒ `docs/server/design/webui/SYSTEM.md` §4 | —— |
| 镜像源族（AC-38） | ⇒ `docs/server/design/webui/SANDBOX.md` §4 | —— |
| 一键拉取（AC-38 ④） | ⇒ `docs/server/design/webui/SANDBOX.md` §4 | —— |
| 拉取认源（AC-38 ⑤） | ⇒ `docs/server/design/webui/SANDBOX.md` §4 | —— |
| 沙盒页（AC-36） | ⇒ `docs/server/design/webui/SANDBOX.md` §4 | —— |
| 管理面 agent 会话页 | ⇒ `docs/server/design/webui/CHAT.md` §4 | —— |
| 成员面（我的·工作区——AC-36 ⑧） | ⇒ `docs/server/design/webui/SANDBOX.md` §4 | —— |
| 管理面 chat 对齐（KD-SV-101） | ⇒ `docs/server/design/webui/CHAT.md` §4 | —— |
| 对话页壳面对齐（功能点 41 ∥ AC-41 ∥ KD-SV-106/107/108/109） | ⇒ `docs/server/design/webui/CHAT.md` §4 | —— |
| 控制台公共标签页组件（功能点 39 ∥ AC-39） | ⇒ `docs/server/design/webui/TABS.md` §4 | —— |
| 卷族（AC-40） | ⇒ `docs/server/design/webui/SANDBOX.md` §4 | —— |
| AC-44（功能点 44——团队项目与权限；控制台面） | ⇒ `docs/server/design/webui/PROJECTS.md` §4 | —— |
| AC-48（功能点 48——项目面单入口 + 基址门；控制台面） | ⇒ `docs/server/design/webui/PROJECTS.md` §4 ∥ `docs/server/design/webui/STYLE.md` §4 | —— |
| 成员面对话页（功能点 50 ∥ AC-50①） | ⇒ `docs/server/design/webui/CHAT.md` §4 | —— |

## 7. 关键决策（本域）

| # | 决策 | 理由 |
|---|---|---|
| KD-SV-9 | **控制台前端 = vanilla 静态面**（`public/` 静态档组——`node:http` 直发）；零框架 ∥ 零构建 ∥ 零外部资源；哈希路由（IA = §2 ∥ KD-SV-20）；判权全在后端 | 用户令钉死（先例 = 本仓 webview vanilla 口径）；静态档零依赖贴合内网自洽；视图交互维护性 |
| KD-SV-20 | **控制台 IA = 侧栏分组导航 + 一页一职责**：组 = 我的（key/用量/账户设置/**项目**/**工作区**/**团队台账**）∥ 管理（总览/**对话**/成员/**项目**（两标签：项目 ∥ Git 源——KD-SV-149）/**Provider**/服务模型/用量统计/审计/系统/**沙盒**）；hash 路由 `#/<组>/<页>`；旧链重定向；解析 = `nav.mjs` 纯函数；窄屏降级顶条 | 用户令（单页堆叠被判不专业）；侧栏 = 分组扩展面（系统/文案/后续协同面挂点）；纯函数解析 = 机检可达；零框架零构建不变（KD-SV-9） |
| KD-SV-26 ∥ KD-SV-44 ∥ KD-SV-51 | ⇒ `docs/server/design/webui/I18N.md` §1 | —— |
| KD-SV-29 | ⇒ `docs/server/design/webui/READINGS.md` §1 | —— |
| KD-SV-31 ∥ KD-SV-32 ∥ KD-SV-33 ∥ KD-SV-34 ∥ KD-SV-41 ∥ KD-SV-43 ∥ KD-SV-45 ∥ KD-SV-46 | ⇒ `docs/server/design/webui/ADMIN.md` §1 | —— |
| KD-SV-36 ∥ KD-SV-37 | ⇒ `docs/server/design/webui/STYLE.md` §1 | —— |
| KD-SV-47 ∥ KD-SV-49 | ⇒ `docs/server/design/webui/ME.md` §1 | —— |
| KD-SV-52 | **`app.mjs` 拆三档**：渲染助手 + `flash` ⇒ `dom.mjs` ∥ 健康轮询 ⇒ `health.mjs`（+ 订阅清零口）∥ `app.mjs` 收窄为入口 | 350 越 300 软线；注册预案（健康块单独拆）按当刻实估不回线内（`350−50+1 ≈ 301`——`50` = 删除行数；新档 `≈62` = 删除 50 + 档头/导入 ≈12——§5 同源）；随正面已含全部目录断言（边际改点 ≈ 零）；逐字搬移 + 门禁/走查双验 |
| KD-SV-54 | ⇒ `docs/server/design/webui/ADMIN.md` §1 | —— |
| KD-SV-60 | ⇒ `docs/server/design/webui/SYSTEM.md` §1 | —— |
| KD-SV-101 | ⇒ `docs/server/design/webui/CHAT.md` §1 | —— |
| KD-SV-102 ∥ KD-SV-103 | ⇒ `docs/server/design/webui/TABS.md` §1 | —— |
| KD-SV-106（页面侧；107/108/109 = agent 域——`docs/server/design/agent/ADMIN-AGENT.md` §9） | ⇒ `docs/server/design/webui/CHAT.md` §1 | —— |
| KD-SV-124 | ⇒ `docs/server/design/webui/PROJECTS.md` §1 | —— |
| KD-SV-181 ∥ KD-SV-182 ∥ KD-SV-183 | ⇒ `docs/server/design/webui/TERMINAL.md` §1（终端核三件/可复用边界 ∥ 渲染与调色板 ∥ 能力表 v1） | —— |

## 8. 本域边界（不做的面）

- 独立客户端管理台（不做——需求 §4；管理面 = 内嵌网页）∥ 前端框架 ∥ 构建步骤 ∥ CDN/外部资源 ∥ 移动端适配（桌面优先——窄屏不做承诺）。（成员面接入卡 ∥ 文档面多语言 ∥ 服务端消息/日志语言 ∥ 第三语言 ⇒ 见 `docs/server/design/webui/ME.md` §5 ∥ `docs/server/design/webui/I18N.md` §5。）
- 二轮不做面 ⇒ 见 `docs/server/design/webui/READINGS.md` §5。
- 弹窗不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- Provider 重做不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- 服务模型配置面不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- embed 解耦不做面 ⇒ 见 `docs/server/design/webui/SYSTEM.md` §5。
- server-model-alias 不做面（KD-SV-59） ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- 样式族不做面 ⇒ 见 `docs/server/design/webui/STYLE.md` §5。
- 布局收正不做面 ⇒ 见 `docs/server/design/webui/STYLE.md` §5。
- 配额分模型不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- 配额 v2 · 成员模型面不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- Provider 模型元数据不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- me-keys 不做面 ⇒ 见 `docs/server/design/webui/ME.md` §5。
- me 用量图表化不做面 ⇒ 见 `docs/server/design/webui/ME.md` §5。
- 结构轮不做面：`style.css` ∥ `index.html` 零触 ∥ `thincoder-server/src/**` 零触（服务端语义零改）∥ 批外档零触（域外发现只报）∥ i18n 语义面（键值 ∥ 回退链 ∥ 复数取形）零改 ∥ 门面外消费面（`i18n.mjs` ∥ 视图件 `t()` 面）零改。
- 视图取件面核实：`views-*` 十档零 `app.mjs` import——渲染助手/`t`/`flash` 等全经 `ctx` 注入（`viewCtx()` 单点装配）；i18n 表族 = `i18n.mjs` 单点取件 ⇒ `dom.mjs`/`health.mjs` 拆分与门面保留下视图面零触（零触承载面 = `ctx` 注入）。
- 控制台测试 key 修复不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- server 代理不做面 ⇒ 见 `docs/server/design/webui/ADMIN.md` §5。
- 配置控制台不做面 ⇒ 见 `docs/server/design/webui/SYSTEM.md` §5。
- 代理面不做面（KD-SV-60） ⇒ 见 `docs/server/design/webui/SYSTEM.md` §5。

- 管理面 chat 渲染面不做项（理由逐项 = `docs/server/design/webui/CHAT.md` §2.1 对齐集 ⑥⑦⑧⑩⑪） ⇒ 见 `docs/server/design/webui/CHAT.md` §5。
- 公共标签页组件不做面 ⇒ 见 `docs/server/design/webui/TABS.md` §5。
- 团队项目与权限面不做面 ⇒ 见 `docs/server/design/webui/PROJECTS.md` §5。

