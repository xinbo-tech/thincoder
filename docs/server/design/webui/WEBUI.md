# Thincoder Server · 控制台前端（webui/WEBUI）

> 板块 = server ∥ 本档 = webui 域（页面路由 ∥ HTML ∥ 静态资源）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 本域回指 = `PROJECT.md` §7（非功能·前端自洽 = 本档 §6）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 静态面

- 落点 = `thincoder-server/public/`（已落盘；本批 IA 重排——§2）：`index.html`（壳——侧栏容器 + 挂载点 + 模块入口）∥ `app.mjs`（路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手）∥ `nav.mjs`（IA 单源——组/项数据 + 路由解析纯函数）∥ `style.css`。
- 视图档（按页分档——§2）：`views-auth.mjs`（登录）∥ `views-me.mjs`（我的三页）∥ `views-admin.mjs`（成员管理）∥ `views-usage.mjs`（已落盘——全队用量 + 看板——§2.3②）∥ `views-overview.mjs`（已落盘——管理总览——§2.3③）∥
  `views-audit.mjs`（已落盘——审计——§2.3④）∥ `views-providers.mjs`（Provider——列表 + 双弹窗编排；§2.4④）∥ `views-providers-modals.mjs`（Provider 弹窗件——添加流 ∥ 详情流；§2.4④）∥
  `views-system.mjs`（系统——版本/更新 ∥ 接入卡 ∥ 向量服务 ∥ 服务健康；§2.1）∥ `views-models.mjs`（已落盘——服务模型：列表 + 详情/配置弹窗——§2.4③）∥ `model-specs-snapshot.mjs`（已落盘——展示元数据快照——§2.4③）；公共组件 = `modal.mjs`（已落盘——弹窗——§2.4①）。
- 原 `views.mjs`（三视图单档）**退役拆档**——缘由 = 新页（provider ∥ IA 重排）叠加后单档将破 300 软线；拆分 = 按页归档（每档 ≤300）。
- 直发 = `thincoder-server/src/webui/static.mjs`（已落盘）：`node:http` 读发 `public/`——mime 表（`.mjs` ⇒ text/javascript） ∥ 防路径穿越 ∥ `Cache-Control: no-cache`（内部工具——改版即见）。
- 路由：`GET /` ⇒ `index.html`；其余静态档按名直发（同源）；`/v1/*` 与 `/api/*` 优先于静态面（分派 = `gateway/API.md` §1）。
- 形态钉死（用户 2026-10-06 08:09）：**零框架 ∥ 零构建 ∥ 零外部资源**（无 CDN ∥ 无外链字体——内网自洽）；先例 = 本仓 webview（`thincoder-vscode/webview/`）的 vanilla 口径。
- JS = 十七档（`app.mjs` ∥ `nav.mjs` ∥ `views-*` 十档 ∥ `modal.mjs` ∥ `i18n.mjs` ∥ `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ `model-specs-snapshot.mjs`；行标 = ≤300 软线——现行越线在册：`app.mjs`（实读 321 ⇒ 本批 +≈25，2026-10-07——me-keys 批；拆分预案 = §5） ∥ i18n 双表（实读 352 ∥ 355 ⇒ 本批 +≈23/表（2026-10-07）——R25 独立结构轮） ∥
  `views-admin.mjs`（实读 331（2026-10-07——配额 v2 批落地后）——拆分预案 = §5） ∥ `views-providers-modals.mjs`（实读 367（2026-10-07——列式收正批落地后）——拆分预案 = §5））+ `style.css`；逐档实读与叠加链 = §5。

## 2. 控制台 IA 与视图（哈希路由——KD-SV-20）

- **形态（本批定稿——用户 16:13 令）**：**左侧栏**分组导航 + 内容区；hash 路由扩展为 `#/<组>/<页>`；一页一职责（原「管理」单页堆叠拆开——成员/用量分页）。

| 组 | 页（hash） | 职责 | 角色 |
|---|---|---|---|
| 我的 | `#/me/keys` | API Key 表（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作——多把并存；§2.3⑥） ∥ 签发新 API Key（弹窗 ∥ 新明文一次性区带复制钮） ∥ 逐把吊销（弹窗） | 全体 |
| 我的 | `#/me/usage` | 本人用量看板（§2.3⑦——概览卡行 ∥ 筛选行 ∥ KPI 行 ∥ 按日主图（维度切换 端点/模型）∥ 分模型区 ∥ 明细表）+ 向量服务提示条（模型名 ∥ snippet——§2.3①） | 全体 |
| 我的 | `#/me/account` | 基本信息（展示名/用户名/角色）+ 自助改密 | 全体 |
| 管理 | `#/admin/overview` | 总览（落地页）：今日请求/token ∥ 成员数 ∥ 健康 ∥ 更新提示 ∥ 快捷入口（§2.3③） | admin |
| 管理 | `#/admin/members` | 成员表（行点击 ⇒ 详情弹窗——模型表直显（逐行已用 ∥ 禁用勾选） ∥ 设额度（分模型） ∥ 重置密码 ∥ 逐 key 吊销；新建成员弹窗——§2.4②） | admin |
| 管理 | `#/admin/providers` | Provider 列表（行点击 ⇒ 详情弹窗：基本信息 ∥ 服务模型勾选）∥ 页首「添加」⇒ 添加弹窗（预设/自定义两径；数据源 = providers ∥ presets 端点——契约 = `gateway/API.md` §2.2；§2.4④） | admin |
| 管理 | `#/admin/models` | 服务模型：开放清单（`/v1/models` 同源——provider 派生）∥ 列表配额列 ∥ 详情/配置弹窗（A/C/D/E + 配额 F——§2.4③） | admin |
| 管理 | `#/admin/usage` | 全队用量：过滤 + 趋势/聚合/排行 + 导出（§2.3②） | admin |
| 管理 | `#/admin/audit` | 审计事件列表（过滤：类型/成员/时段——§2.3④） | admin |
| 管理 | `#/admin/system` | 版本与更新 ∥ 成员接入 ∥ 向量服务 ∥ 服务健康（数据 = `/api/system` ∥ §2.1） | admin |

- 登录 = `#/login`（无侧栏——登录卡）；`#/` ∥ 未知 ⇒ 角色默认页（admin ⇒ `#/admin/overview` ∥ user ⇒ `#/me/keys`）。
- **旧链迁移**：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview`（重定向——旧书签可达；`#/admin/members` 等页路径仍直达）。
- **路由解析 = `nav.mjs` 纯函数**（`resolveRoute(path, role)`——无 DOM、批内件直测）：别名重定向 ∥ 角色默认 ∥ admin 面 `denied`（页面级「无权限」块——判据仍在服务端，§3）。
- **导航渲染**：侧栏 = 品牌 ∥ 组标题 + 项（活动态高亮）∥ 底部（meta 槽（健康状态灯（§2.3⑤） ∥ 版本——`/api/system`，全角色） + 语言切换器 + 退出登录）；admin 组仅 admin 渲染。
- **窄屏**：`≤760px` 侧栏降级为顶条（单条媒体查询——非移动端适配承诺）。
- **文案面（多语言——`requirements/PROJECT.md` §2:13）**：全量文案单源 = 文案表（`i18n-zh.mjs` ∥ `i18n-en.mjs`）；`nav.mjs` 数据持 `labelKey`（键——非字面量）；页档/助手经 `t()` 取值——机制全文 = §2.2。
- 数据全经 `/api/*`（契约 = `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3 ∥ `gateway/API.md` §2.2）；`GET /` 公开（页面壳零数据）。

- **数据表页视口高壳（功能点 20——§2.6）**：数据表五页（成员 ∥ Provider ∥ 服务模型 ∥ 审计 ∥ 用量明细 `#/me/usage`）= 壳面；`#/admin/usage` 看板页不入壳；机制全文 = §2.6。

### 2.1 系统页与 meta 槽（版本/更新 ∥ 成员接入 ∥ 向量服务 ∥ 服务健康）

- **meta 槽**（侧栏底部——全角色）：健康状态灯（§2.3⑤——`/healthz` 轮询；点 + 文案）∥ 版本一行（`GET /api/system`——启动装配时取一次；失败 ⇒ 留空静默）∥ 语言切换器 ∥ 退出登录。
- **`#/admin/system` 四节**：
  - **版本与更新**：当前版本 ∥ 更新档位（`mode`：`false`/`notify`/`auto`）∥ 最近自检（`lastCheckAt`——本地化时间；`null` = 未检）∥ 更新提示（`latest` 在场 ⇒ 「有新版本可用：vX.Y.Z（升级见部署文档）」；不在场 ⇒ 「未发现新版本」——自检失败同面，静默口径 = `gateway/API.md` §2.3）。
  - **成员接入卡**：baseURL（`location.origin` + `/v1`——运行时装配）∥ 团队 key 提示（`sk-tc-…` 形——签发 = `#/me/keys`）∥ 四端示例（CLI ∥ VSC ∥ 桌面 ∥ 其他 OpenAI 兼容——字段 = name/baseURL/model/apiKey；model = `provider/model` 形）∥ curl 冒烟一行（`GET /v1/models`）。
  - **向量服务**（admin——§2.3①）：引擎地址 ∥ 模型（`GET /api/admin/embedding`——配置真值）∥ 可达性状态（渲染自动探活 + 「重新检测」——`POST /api/admin/embedding/test`）∥ `/v1/embeddings` 调用 snippet ∥ 用法一句 ∥ 试跑（短文本 ⇒ 维度 ∥ 耗时——不落库不计量）。
  - **服务健康**：状态（`ok`/`degraded`）∥ DB ∥ 运行时长 ∥ 最近检查（本地化时间）——数据 = 前端健康共享态（§2.3⑤；30s 自动刷新）。
- **角色面**：更新提示 ∥ 向量服务 ∥ 服务健康 = admin 面（`#/admin/system`）；meta 槽（状态灯 ∥ 版本行）= 全角色；`requirements/PROJECT.md` §2:12③「更新可用提示」按可动作方收窄——在案。
- 落点：接入卡 = admin 面（供分发给成员）；成员面 = `#/me/keys` 页接入卡（同源复用——me-keys 批）+ README「成员接入」节；文案 = 多语言表键引用（§2.2——各卡各件同表收编）；渲染沿 `h`/`textContent`（零拼串）。

### 2.2 多语言（中文 ∥ English——需求 §2:13）

- **形态**：两语 = `zh` ∥ `en`；运行时 = `i18n.mjs`（已落盘）；文案表 = `i18n-zh.mjs` ∥ `i18n-en.mjs`（已落盘）；静态 ESM 浏览器原生 import 取载（**零构建**——无打包器 ∥ 无 fetch ∥ 无第三方 i18n 库）。
- **检测与缺省**：记忆值优先（`localStorage["tc_lang"]`）；无 ⇒ `navigator.languages` 顺序扫描——首命中 `zh*` ⇒ zh ∥ 首命中 `en*` ⇒ en；无命中 ⇒ **缺省 zh**（现状保持零惊群 ∥ 一触可切）；非法记忆值忽略（回检测）。
- **切换器**：两枚小按钮「中文 ∥ English」（**自称名不翻译——`lang.zh` ∥ `lang.en` 固定取 zh 表渲染**；当前态高亮）；挂点（IA 服从 KD-SV-20）= 侧栏 meta 槽（登录后——版本行/退出登录同区；窄屏随顶条）+ 登录卡（`#/login` 无侧栏——卡内一行）；组件 = `i18n.mjs` 导出（`h` + `onChange` 注入——两处复用）。
- **切换动作**：写记忆 ⇒ 重渲当前界面（侧栏 ∥ 视图同拍——重渲口 = `app.mjs` 的 `rerender()`）+ `documentElement.lang` 随动（`zh-CN` ∥ `en`）；表单草稿不保（低频动作——在案）。
- **文案表形**：键 = `页面.区块.词`（点分平键——`login.submit` ∥ `nav.page.me.keys` ∥ `admin.members.secretLabel` ∥ `err.unauthorized`）；参数 = `{name}` 占位 + `t(key, params)` 替换；缺键回退链 = 当前表 → 中文表 → 键原文（+ `console.warn`——安全网）；键集口径 = 两表键集相等（双向——**除自称名族 `lang.zh` ∥ `lang.en`：仅 zh 表载体**——批内件同口径断言）。
- **计数复数形（配额 v2 批——KD-SV-44）**：`t(key, {count})` 且 `count` 为数字 ∥ `t(key, {tokens})` 且 `tokens` 为数字（并集——§5 预置变体族含仅 `{tokens}` 参者）⇒ 取形 = `Intl.PluralRules(当前语言).select(count)`（零依赖内建；按语言缓存）；
  查键序 = `${key}.${form}` → `key`（→ zh 表同序 → 键原文）；`.one` 变体族 = **仅 en 表载体**（zh 无复数区分——`select` 恒 `other` ⇒ 落基键）；键集口径随正 = **除自称名族 + `.one` 变体族**（判定 = 剥离 `.one` 的基键集双向相等 ∧ `.one` 键仅 en 表 ∧ 变体基键在场）。
- **错误消息策略（服务端零改）**：服务端消息维持中文（机器面——口径 = `gateway/API.md` §3）；控制台按 `code` 前端映射（`err.<code>` 键）——映射集 = 控制台可达码 + 预留（`rate_limited` 仅 /v1 面产生——预留；键在册）：
  `unauthorized` ∥ `invalid_credentials` ∥ `forbidden` ∥ `not_found` ∥ `invalid_request_error` ∥ `upstream_error` ∥ `internal_error` ∥ `too_many_attempts` ∥ `rate_limited`（模型限流——429）。
- **映射细则**：`429` 随 `Retry-After` 头捕获（秒数注入文案——`too_many_attempts` ∥ `rate_limited` 两码同机制）；参数码（`invalid_request_error` ∥ `not_found`）句末附服务端原文（细节不丢——en 下附注为中文，在案）；码未在表 ⇒ 服务端原文兜底（未来新码/上游透传零遗漏）。
- **覆盖范围**：十页 + 登录 + 侧栏（组/页/品牌/退出/meta 槽（状态灯/版本/切换器））+ 表单（label/placeholder/按钮）+ 表头 + 空态 + 一次性秘密区 + confirm + flash + 错误映射 + 格式化助手（`fmtModelQuotas` 覆盖计数键化（0 ⇒「按平台」） ∥ `fmtTs` 随语言设 locale ∥ `fmtValue`「—」语言中性保留）+ 标签页 title（运行期 `document.title`——`index.html` 两处静态 CJK = 装配前缺省——豁免在案）。
- **二轮新增键族**（六面——两表逐键同步 ∥ en 零 CJK ∥ 占位符一致）：`health.*` ∥ `overview.*` ∥ `usageReport.*` ∥ `vector.*` ∥ `audit.*` ∥ `nav.page.admin.overview|audit` ∥ `me.keys.*`（维护增量 ≈87 键）。
- **键族登记**：弹窗批（两表逐键同步）= `common.save|cancel|close` ∥ `admin.members.*` ∥ `admin.models.*` ∥ `nav.page.admin.models`（≈17 键）。
- **键族登记（Provider 重做批——两表逐键同步）**：改值——`nav.page.admin.providers` ∥ `admin.providers.title` =「Provider」；新增 ≈13 键（添加/详情弹窗面）∥ 退役 ≈14 键（内联面旧键——`modelPh` ∥ `addModel` ∥ `formNew` ∥ `formEdit` ∥ `saveEdit` ∥ `presetLoad` ∥ `presetLoaded` ∥ `presetHint` ∥ `edit` 等——删净「手填」残留）。
  表体量（实读基线 312 ∥ 308——弹窗批后；本批净 ≈−1/表）：zh ≈311 ∥ en ≈307（估——实施实读为准）；双表均越 300 软线 ⇒ 拆表处置 = R25 独立结构轮。
- **键族登记（服务模型配置面批——两表逐键同步；本批）**：新增 27 键（`admin.models.*` 配置四组（开放状态/停用流/限流/展示元数据/成本权重） ∥ `admin.models.note` ∥ `admin.models.saved` ∥ `admin.models.invalidNumber` ∥ `err.rate_limited`）∥ 退役 1 键（`admin.models.configSkeleton`——骨架占位随字段落地删净）；体量叠加 ⇒ zh ≈337 ∥ en ≈333（估——实施实读为准；越 300 状态不变——拆表 = R25 独立结构轮）。
- **键族登记（布局收正批——两表逐键同步；本批）**：新增 6 键——`common.rowCount`（共 {count} 项） ∥ `admin.members.colKey` ∥ `admin.members.colLastUsed` ∥ `admin.members.colWindowTokens` ∥ `admin.members.colActions`（「操作」表头） ∥ `admin.members.windowTokensCell`；表体量：zh 328 ⇒ ≈334 ∥ en 324 ⇒ ≈330（实读基线 2026-10-07——§5）。
- **键族登记（配额分模型批——两表逐键同步；本批）**：改值 1 键——`col.quota`（「本月额度」/「Monthly quota」 ⇒ 「分模型配额」/「Model quotas」——列表列 ∥ 弹窗行 ∥ 我的页行三处同键）；新增 ≈10 键——`common.modelQuotaCount`（{count} 个模型） ∥ `common.quotaByPlatform`（按平台） ∥ `admin.members.modelQuotaTitle` ∥ `admin.members.colMonthlyQuota`。
  续：`admin.members.colPlatformQuota` ∥ `admin.members.quotaLoadFailed` ∥ `admin.members.quotaRetry` ∥ `admin.models.quotaTitle` ∥ `admin.models.quotaHint` ∥ `admin.models.ruleNonNegativeInt`；表体量：zh 334 ⇒ ≈344 ∥ en 330 ⇒ ≈340。
- **键族登记（配额 v2 · 成员模型面批——两表逐键同步；本批）**：新增 2 键——`admin.members.colDisabled`（「禁用」表头） ∥ `admin.members.disableHint`（勾选语义提示）；删死键 2 枚——`col.actions`（#994——旧键退役未删，零消费者） ∥ `admin.members.quotaEmptyHint`（查看态空态随模型表直显退役）；
  en 表增 `.one` 复数变体 7 枚（`common.rowCount` ∥ `common.modelQuotaCount` ∥ `admin.members.windowTokensCell` ∥ `admin.members.quotaOffListNote` ∥ `me.keys.windowTokens` ∥ `admin.providers.discovered` ∥ `admin.providers.testOk`——#988）；
  表体量（本设计轮实读）：zh 345 ⇒ ≈345（净 ±0）∥ en 341 ⇒ ≈348（+7 变体）。
- **键族登记（Provider 模型元数据族——两表逐键同步；列式收正后净 7 键）**：`admin.providers.candidatesLoading`（#984 加载态） ∥ `admin.providers.metaVision`（「视觉」/「Vision」——转任候选表「视觉」列头） ∥
  `admin.providers.upstreamRetiredBadge`（「已退役」/「Retired」） ∥ `admin.providers.upstreamRetiredNote`（「上游标记退役：{models}」） ∥ `admin.providers.colDisplayName`（「展示名」/「Display name」——候选表列头） ∥
  `admin.providers.colContext`（「上下文」/「Context」——列头） ∥ `admin.providers.colStatus`（「状态」/「Status」——列头）；删死键 1 枚——`admin.providers.metaContext`（「上下文 {value}」——零消费者；净 = 5 ⇒ 7：+3 列头键 ∥ −1）；
  表体量（2026-10-07 复读——列式收正批落地后）：行 **352 ∥ 355**；键 **308 ∥ 313**（`Object.keys` 直读——en 含 `.one` 变体族 7 枚）。
- **键族登记（me-keys 批——两表逐键同步；本批）**：新增 **25 键**——表六列（`me.keys.colName` ∥ `colKey` ∥ `colCreated` ∥ `colLastUsed` ∥ `colWindow` ∥ `colActions`） ∥
  签发流（`issue` ∥ `issueTitle` ∥ `nameLabel` ∥ `namePh` ∥ `nameHint` ∥ `issueHint` ∥ `issueSubmit` ∥ `capHint`） ∥ 吊销流（`revokeTitle` ∥ `revokeConsequence` ∥ `revokeSubmit` ∥ `revoked`） ∥
  接入卡成员面（`accessTitle` ∥ `accessHint` ∥ `accessKeyRow` ∥ `accessKeyValue`） ∥ 复制钮（`common.copy` ∥ `common.copied` ∥ `common.copyManual`）；
  **改值 4 键**——`me.keys.listTitle`（「key 清单（提示形）」 ⇒ 「API Key 清单」——黑话下架） ∥ `me.keys.empty`（重写——「签发新 API Key」指引） ∥ `me.keys.lastUsed` ∥ `me.keys.windowTokens`（去前缀——列内形 `{time}` ∥ `{tokens} tokens`）；
  **退役 2 键**——`me.keys.rotate` ∥ `me.keys.rotateConfirm`（轮换按钮下架——零消费者删净）；表体量：zh 352 ⇒ ≈374 ∥ en 355 ⇒ ≈377（估——实施实读为准）。
  **复用 1 键（零新增）**——`me.keys.neverUsed`（「从未使用」——§2.3⑥ 表「最后使用」空值文案；成员弹窗 key 表同键——§2.6⑤；两表在盘，本批零改）。
  **词汇口径（一名两形——登记）**：本页新文案实体名 = 「API Key」（需求 §2:25③ 字面——列头/按钮/弹窗；zh 保留英文原形 ∥ en = "API key"；用户 2026-10-07 16:41/16:43 定音（B——批档 §1.3 术语门））；
  `nav.page.me.keys`（「key 与签发」） ∥ 管理面（「key 清单」/「key 数」） ∥ 审计型（「key 签发/吊销」） ∥ 接入卡（`system.accessHint`）仍用「key」（本批零触——admin 面边界）；页题 `me.keys.title`（「我的 key」）∥ `me.keys.secretLabel`（「新 key（明文）」）= 现有键值（本批零改）。统一 = 另笔（台账 #1025 ∥ `design/PROJECT.md` §9 R40③）。
- **键族登记（me 用量图表化批——两表逐键同步；本批）**：新增 **8 键**——`me.usage.range`（时间维度） ∥ `me.usage.range7`（近 7 天） ∥ `me.usage.range30`（近 30 天） ∥ `me.usage.rangeMonth`（本月） ∥
  `me.usage.clear`（清除筛选条件） ∥ `me.usage.modelPh`（模型——输入占位） ∥ `me.usage.used`（本月已用——概览卡 ∥ 分模型列头同键） ∥ `me.usage.kpiSplit`（`prompt {prompt} · completion {completion}`——KPI 注行）；
  **退役 1 键**——`me.usage.summary`（「本月摘要」——摘要表重做后零消费者，删净）；表体量（本设计轮实读）：zh 375 ⇒ 实读 382 ∥ en 378 ⇒ 实读 385（2026-10-07——本批落地后）。
- **可测性**：`i18n.mjs` 模块顶层零浏览器全局访问——`document`/`localStorage`/`navigator` 仅在 init/绑定函数内触碰；检测输入经参数注入（`pickLang(stored, languages)`）——保批内件 node 直测（§6）。
- **零 CJK 机检口径（§6 AC-14 同拍）**：扫描面 = **前端 JS 代码档**（**排除 `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ `index.html`**）；三档口径 = zh 表 = 唯一 CJK 档 ∥ `i18n.mjs` 与 en 表零 CJK；`index.html` 两处静态 CJK（`<title>` ∥ 加载提示）= 装配前缺省——**显式豁免**（豁免/披露在案）。
- **不做**：文档面多语言（README 等——另议）∥ 服务端消息/日志语言 ∥ 用户数据值 ∥ 第三语言（加语言 = 表档 + 检测行增量——断点）。

### 2.3 可见面二轮（六面机制——功能点 15；另含后批可见面：⑥ 功能点 25 ∥ ⑦ 功能点 26）

**① 向量服务可见面**：系统页向量卡（§2.1——admin：地址 ∥ 模型 ∥ 可达性 ∥ snippet ∥ 用法 ∥ 试跑）∥ 用户面 = 我的用量页顶部提示条（模型名 + snippet + 用法一句——**地址/探活/试跑 = admin 面**；模型名经 `/api/system` 的 `embedding.model` 下发）∥ 用量面 endpoint 区分：明细列（存量——`usageTable` 已有「端点」列）+ 端点过滤（两用量页同参数——下拉：全部/chat/embeddings）。

**② 用量看板升级**（`#/admin/usage`——明细表之上）：

- 过滤表单增「端点」下拉；查询 = 明细 + 报表同拍刷新（同过滤面）。
- **概览卡**：请求数 ∥ tokens 合计（`summary.totals`）。
- **时间趋势（按日）**：纯 CSS 柱状图（flex 柱列 + 高度百分比——零依赖；柱 `title` = 日期/请求数/tokens；轴标 = 首末日）；数据 = `summary.trend`（服务端零填充——前端只画）；空态 ⇒ 文案（零错）。
- **聚合与排行**：按模型 ∥ 按成员两表（序号 ∥ 名称 ∥ 请求数 ∥ tokens——降序即排行；聚合与排行同数据面，不设独立组件）。
- **导出**：`GET /api/usage/export`（同过滤面）——fetch ⇒ blob ⇒ 临时链接下载（400 经错误映射展示；不用裸链接导航——错误页不劫持 SPA）。

**③ 管理总览**（`#/admin/overview`——admin 落地页）：卡集六枚——今日请求 ∥ 今日 token ∥ 成员数（`GET /api/overview`）∥ 健康（共享态——⑤）∥ 更新提示（`state.system.update.latest`：在场 ⇒ 高亮提示 + 导流系统页；缺 ⇒ 「未发现新版本」）∥ 快捷入口（成员/provider/用量/审计/系统五链）。落地页变更：admin 登录 ⇒ `#/admin/overview`；`#/admin` 重定向同指；旧页书签直达。user 面不可达（`nav` `denied` + 服务端 403 双层）。

**④ 审计/安全面**（`#/admin/audit`）：过滤表单（类型下拉（全部 + 九型） ∥ 成员输入 ∥ 起止时间）+ 表（时间 ∥ 类型 ∥ 操作者 ∥ 对象（与操作者同名 ⇒ 「—」） ∥ 详情——按型模板渲染（IP ∥ 维度 ∥ key 提示形 ∥ 角色））；空态文案；`GET /api/audit` 取数（倒序）。

**⑤ 健康可见**：前端健康轮询（`app.mjs`——登录后启动：立即一次 + `HEALTH_POLL_MS = 30000`；登出停止）；数据 = `GET /healthz` 直读（公开端点——不经 `api()` 封装：503 也携状态体）；三态：绿（200 `ok`）∥ 黄（503 `degraded`——DB 异常）∥ 红（请求失败——服务不可达）。
落点三处：侧栏 meta 槽状态灯（点 + 文案；元素 id = `nav-health`——轮询回调直更，无整页重渲）∥ 系统页健康块（§2.1）∥ 总览健康卡；后两者经 `ctx.onHealth` 订阅（视图注册——路由切换清空）。失败静默（灯变红——不 flash 刷屏）。

**⑥ 「我的·key 与签发」页重做（功能点 25——me-keys 批；用户 2026-10-07 16:06「太草率」+ 16:08「可以」+ 附加两令「key最好有个名称」 ∥「一个用户可能会有多个Key」）**：

- **页形**（`#/me/keys`；非壳页——§2.6① 排除面在册）：页题「我的 key」+ 页首「签发新 API Key」钮（`me.keys.issue`）∥ 页级一次性秘密区（`ctx.showSecret`——签发成功后明文落此，含复制钮）∥ API Key 表卡（卡题 = `me.keys.listTitle`——「提示形」黑话下架）∥ 接入卡（成员面——素材复用，见下）。
- **API Key 表（六列——表格族 canon §2.5①）**：名称（`key.name`——签发时命名 ∥ 空名默认 `key-N`） ∥ API Key（`code` 提示形） ∥ 签发时间（`fmtTs(createdAt)`） ∥ 最后使用（`fmtTs(lastUsedAt)`——空值 ⇒ `me.keys.neverUsed`「从未使用」） ∥ 近 30 天（`{tokens} tokens`） ∥ 操作（行内「吊销」= `tiny danger`）。
  数据 = `/api/me` key 行（单源 = `memberView`——行形 += `name`/`createdAt`；仅未吊销 ⇒ 吊销后行离列）；空态 = `.hint` 引导（「签发新 API Key」指引 + 明文仅显示一次——`me.keys.empty`）。
- **签发流**（公共弹窗 `modal.mjs`）：体 = 名称输入（可空——`me.keys.namePh`「留空 = 自动命名」+ `me.keys.nameHint`）+ 说明行（`me.keys.issueHint`——明文仅一次）+ 上限提示（`me.keys.capHint`）；脚区 = 「签发」（主）+「取消」；成功 ⇒ 关窗 + 页级秘密区回显明文 + 表刷新（多把并存——旧把照常可用）；失败 ⇒ 窗内状态行（弹窗定则——反馈落窗内）。
- **吊销流**（公共弹窗）：体 = API Key 名 + 提示形 + **后果文案**（`me.keys.revokeConsequence`——吊销立即失效 ∥ 客户端即断 ∥ 不可撤销）；脚区 = 「吊销」（危险）+「取消」；成功 ⇒ 关窗 + 表刷新（行离列）+ flash「已吊销」；失败 ⇒ 窗内状态行。**零原生 `confirm`**（`window.confirm` 页面零调用——机检扫描面）。
- **复制钮（`showSecret` 全局随动）**：秘密区 = 明文 + 「复制」钮（`common.copy`）；复制三路 = ① `navigator.clipboard.writeText`（安全上下文）⇒ ② 选中明文 + `document.execCommand("copy")` ⇒ ③ 仍失败 ⇒ 保持选中 + flash 手动提示（`common.copyManual`）；成功反馈 = 钮文案「已复制」（`common.copied`——2s 复位）。三处秘密面（新 key ∥ 新建成员初始密码 ∥ 重置密码）同随动。
- **接入卡（成员面——⑤）**：与 admin 接入卡**同源复用**（`views-system.mjs` 导出的同构件——`accessCard(ctx, variant)`；admin 面 = 现行零改）；成员变体 = 措辞三键（`me.keys.accessTitle`/`accessHint`/`accessKeyRow`+`accessKeyValue`）+ 同四端字段/baseURL/curl 素材键。
- **轮换（全换）处置（设计轮裁——§7 KD-SV-47）**：**页面不保留**（按钮下架——多把并存下「全换」= 全断操作，与逐把模型相抵；需求 ①「留否 = 设计轮定」⇒ 否）；HTTP 端点 `/api/me/keys/rotate` **保留**（API 契约与既有批内件零动——非页面面；契约 = `accounts/ACCOUNTS.md` §3）。
- **壳面口径**：本页非壳页（功能点 20 钉表五页不扩——key 表行数量级小、页内含接入卡静态长内容；入壳 = 另议）；表不带 tfoot 计数（tfoot = 壳面 canon）。
- **数据/权**：全经 `/api/*`（契约 = `accounts/ACCOUNTS.md` §3）；判权仍在服务端（本人面——无 webui 侧新增判据）。

**⑦ 「我的·用量」页图表化（功能点 26——me 用量图表化批；用户 2026-10-07 22:03「我的用量那个界面感觉单薄……更多的图表」）**：

- **页形**（`#/me/usage`——壳面五页在册不动〔§2.6①〕；页头固定 + 页区承缩）：
  - **页头**（`.page-head`）：页题 ∥ 向量提示条（现件——§2.3①）∥ 概览卡行 ∥ 筛选行。
    概览卡行 = 两枚 stat 卡：「本月已用」= `member.usedTokens`（日表月累计——含嵌入行，现口径） ∥ 「分模型配额」= `fmtModelQuotas(member.modelQuotas)`（`col.quota` 同键）。
    筛选行 = 时间维度 select（近 7 天 ∥ 近 30 天 ∥ 本月；缺省 30） ∥ 端点 select（全部 ∥ chat ∥ embeddings） ∥ 模型输入（外标形） ∥ 「清除筛选条件」钮——即选即查。
  - **页区**（`.page-area`——两卡）：**报表卡**（`report-card`——不承缩；上限 = 页区高 55%（超限卡内自滚——明细卡恒得剩余高））+ **明细卡**（承缩——表槽自滚 + 表尾计数，链 = §2.6②）。
- **报表卡内**：KPI 行 ∥ 主图 ∥ 分模型区。
  - KPI 行 = 两枚 stat 卡：「请求数」= `totals.requests` ∥ 「tokens」= `totals.totalTokens`（注行 = `me.usage.kpiSplit`——prompt/completion 拆）。
  - **主图**（h4 = `usageReport.trend`）：按日**堆叠柱**——纯 CSS 件（`.bar-stacked`/`.bar-seg`；柱高 = 当日 tokens/峰值；段 = 维度值）。
    段色 = `--accent` 透明度阶梯 [1 / 0.7 / 0.45 / 0.3]（第 5 段起 0.3——零新颜色变量）；段 `title` = 日 · 维值 · 请求数 · tokens。
    维度切换 = `.chart-toggle` 两枚 `tiny` 钮（「端点」∥「模型」——`usageReport.endpoint` ∥ `usage.col.model` 同键）；活动态取 `.lang-switch .active` 同形；切换 = 本地重画（数据一次取齐——零重取）。
    图例 = `.bar-swatch` + 维值名；轴标 = `.chart-axis`（现件）；空态（`totals.requests` = 0）⇒ `usageReport.trendEmpty`。
    数据：维度「端点」= `trendByEndpoint` ∥ 「模型」= `trendByModel`（逐日 × 维值段；零填充在服务端——前端只画）。
  - **分模型区**（h4 = `usageReport.byModel`）：表五列 = #（`usageReport.colRank`） ∥ 模型（`usage.col.model`） ∥ 请求数（`usageReport.requests`） ∥ tokens（`usageReport.tokens`） ∥ 本月已用（`me.usage.used`）。
    「本月已用」取值 = `member.modelUsage` 同键（缺 = 0；自然月 = 配额窗）；行序 = `byModel` 降序 + 范围无行而本月有量者殿后（月量降序）；空 ⇒ `usage.empty`。
    殿后行 × 过滤口径：殿后行源 = 月窗（含嵌入行——与概览卡行同为月语境）；`endpoint` 过滤只裁窗表（`byModel` 侧）——仅月窗有量的嵌入模型在 `endpoint = chat` 下照以殿后行示出（0/0 + 本月已用）。
- **明细卡内**：h3 = `me.usage.detail`（现件）；表 = `usageTable(rows, { withMember: false, foot: true })`（列零改）；数据 = `/api/me/usage`。
- **单过滤面（四区同拍）**：筛选行四控件 ⇒ `Promise.all` 两读同刷——`/api/me/usage/summary`（契约 = `metering/METERING.md` §3）∥ `/api/me/usage`（+ `limit=100`）。
  概览卡行 = 月语境，不随筛选行；失败 ⇒ 两区各 `.hint error`（`usage.loadFailed`——`ctx.fail` 收口）。
- **窗换**：近 7 天（-6 日）∥ 近 30 天（缺省——服务端缺省窗同构）∥ 本月（月首）；`from` ms 客户端换算（admin 先例同构；异时区窗沿差 = 已知边界在案）。
- **导出 = 不设（判否）**：① 参考图导出钮属金额/账单语境——本服务器无金额面（`metering/METERING.md` §8 不做项）⇒ 无对应语义；
  ② 放宽 `/api/usage/export` 对 user = 翻判权三态（AC-15② 在案）；另立本人面导出端点 = 新契约面无对应收益。如后续点名 ⇒ 另轮轻通道补。
- **statCard 复用**：`views-overview.mjs` 的 `statCard(h, label, ...content)` 导出复用（函数体零改——注行 = 追加 `.hint` 节点）；`views-usage.mjs` 自有同形件零动（两处并存 = 去重候选，在册）。
- **元素对照（参考截图——逐条可追）**：

| 截图元素 | 本页落点 / 不映射理由 |
|---|---|
| ① 页头说明条（GMT+8 ∥ 5 分钟延迟） | **不映射**——记账 = 实时（无延迟管道）；时间本地化显示既在（`fmtTs`） |
| ② 峰谷提示 banner（+「我知道了」） | **不映射**——无峰谷计价面（金额族） |
| ③ 两概览卡（充值余额 ∥ 累计消费金额） | 金额族不映射；替代 = 概览卡行（本月已用 ∥ 分模型配额） |
| ④ 筛选行·时间维度 | 时间维度 select（近 7 天 ∥ 近 30 天 ∥ 本月；缺省 30 = 服务端缺省窗同构） |
| ④·API Key 下拉 | **不映射**（key 过滤轴数据面无）；第二轴 = 模型输入（数据面既有） |
| ④·清除筛选条件 | 「清除筛选条件」钮（四控件复位 + 重查） |
| ④·导出钮 | **不设**（判否——见上） |
| ⑤ KPI 卡 ×3（金额 ∥ 请求数 ∥ Tokens） | KPI 行 ×2（请求数 ∥ tokens——注行 = 输入/输出拆）；金额卡不映射 |
| ⑥ 主柱图 + 图例切换（模型 ∥ API Key） | 按日堆叠柱 + 维度切换（端点 ∥ 模型）——零依赖柱件复用 |
| ⑦ 分模型区（逐模型 请求数面积图 ∥ Tokens 柱图） | 分模型表（逐模型 请求数 ∥ tokens ∥ 本月已用）——逐模型出图不采（页肥；表形等价） |

- **不做（本页批）**：成本/金额/余额（`metering/METERING.md` §8 不变）∥ 小时/周粒度（日/月两键为限）∥ 图表库/CDN（零依赖——KD-SV-29 机制不破）∥ 本人面导出（判否）∥ key 维度过滤（数据面无此轴）∥ 数字千分位（站内口径不引）∥ 模型 top-N 归并（全模型分段——色阶下限 0.3 在案）∥ 总览/管理面零改。

### 2.4 弹窗机制与成员/服务模型/Provider 面（功能点 16 ∥ 17 ∥ 18）

**① 公共弹窗组件**（`modal.mjs`——新档；功能点 16②）：

- **基座 = 原生 `<dialog>` + `showModal()`**：零依赖（平台承担模态语义——顶层渲染 ∥ 背景 inert ∥ ESC 缺省关闭（`cancel` 事件）∥ `::backdrop` 遮罩）；本档只补壳与策略（KD-SV-31）。
- **复用 API**：`openModal({ title, body, footer, onClose })` ⇒ 句柄 `{ close(), root }`；`title` = 字符串（textContent）；`body`/`footer` = 调用方以 `h` 构建的节点（footer 缺省 ⇒ 无脚区）；`onClose` = 关闭回调（任意路径——一次）。**单例**：同时最多一窗——开新先关旧（不叠加；需要再扩）。
- **关闭语义**：× 钮 ∥ `Esc` ∥ `handle.close()`；**遮罩点击不关**（平台缺省——防误触丢表单）；任意关闭 = 丢弃未保存草稿（在案——沿语言切换草稿口径）。
- **键盘/焦点**：打开 ⇒ 焦点入窗（平台缺省 = 首个可聚焦元素；调用方以 `autofocus` 定首选）；背景 inert（平台——Tab 不逸出）；关闭 ⇒ 焦点还原（平台语义——收口轮实走核验；不符 ⇒ 组件补显式还原）；开窗期锁背景滚动（`body.modal-open` 类——`close` 事件收口）。
- **可测性**：模块顶层零浏览器全局（node 可 import——API 形断言）；DOM 交互仅在 `openModal` 内（沿 §2.2 口径）；× 钮文案 = `common.close`（`aria-label`——两表同步）。

**② 成员弹窗（三态：查看 ∥ 编辑 ∥ 新建——功能点 16①；分模型配额 = 功能点 21② ∥ 模型表直显/逐行已用/禁用 = 功能点 23①③）**：

- **入口**：成员表行点击（`tr.row-clickable tabindex="0"`——Enter/Space 同开——键盘可达）⇒ 查看态；页首「新建成员」钮 ⇒ 新建态。表列 = 展示名 ∥ 用户名 ∥ 角色 ∥ **分模型配额**（覆盖计数：0 ⇒「按平台」∥ N ⇒「N 个模型」——`fmtModelQuotas`）∥ 已用 ∥ key 数（原「key 清单/操作」两列收编入弹窗——表 = 概览 + 入口）。
- **查看态（本批：模型表直显——功能点 23①）**：详情（展示名 ∥ 用户名 ∥ 角色 ∥ 分模型配额（覆盖计数——`fmtModelQuotas`）∥ 本月已用）+ **分模型用量节 = 模型表**（进窗即惰性拉 `GET /api/admin/providers`（查看/编辑两态共用——成功：行 = 全 chat 模型（`deriveModels` 同源序）；失败 ⇒ 窗内状态行 + 重试；加载中 hint）：
  列 = 模型 ∥ **每月用量**（覆盖值 ∥ 未设 ⇒「按平台」）∥ **平台默认**（`settings[上游].quotaTokens`——只读；未设 ⇒「不限」）∥ **本月已用**（逐行——`memberView.modelUsage`（自然月——与配额检查同源同窗；缺 ⇒ 0））∥ **禁用**（勾选 = 对该成员禁用——下条）；离表覆盖键 ⇒ 注行「另有 N 项不在服务清单（保留）」（`quotaOffListNote`——查看/编辑两态同注，恒不触碰）。
  离表**禁用**键 = 键恒保留（同覆盖键口径）：不计入 N（注行只数覆盖键）∥ 不列示（弹窗内无显示/清理面——仅 map 面可读）∥ 恢复 = 重开回行后取消勾选（裁据 = `accounts/ACCOUNTS.md` §7 B26）。
  + key 表（表格形——§2.6⑤；数据 = `memberView`——与 `#/me/keys` 同源）+ 逐 key「吊销」；操作 = 「设额度」（切编辑态）∥「重置密码」（confirm ⇒ POST ⇒ 关窗 + 页级一次性秘密区——仍仅一次）∥「关闭」。
- **禁用勾选（功能点 23③——#1004；查看态表「禁用」列）**：勾选 = 禁用（**默认全可用**）；**即时写**（切换 ⇒ `POST /api/members/:id/model-disables` 单键合并（`true`/`null`）；在飞期勾选框禁用；成功 = 静默（勾选态即反馈）∥ 失败 ⇒ 勾选回弹 + 窗内状态行（`mapError`））；
  下一请求即生效（服务端逐请求判——执行面 = `gateway/API.md` §2.1；机制全文 = `accounts/ACCOUNTS.md` §2.2）；表下提示 = `admin.members.disableHint`（勾选 = 对该成员禁用（默认可用））。
- **编辑态（分模型覆盖——键级合并）**：惰性拉 `GET /api/admin/providers`（两态共用——进窗首个；成功：表 = 全 chat 模型行：模型（`deriveModels` 同源序）∥ 每月用量输入（空 = 按平台）∥ 平台默认（`settings[上游].quotaTokens`——只读；未设 ⇒「不限」）；失败 ⇒ 窗内状态行 + 「重试」；加载中 hint）。
  不在服务清单的覆盖键 ⇒ 注行「另有 N 项不在服务清单（保留）」——恒不触碰。保存 ⇒ `POST /api/members/:id/model-quotas`（每行输入：空 ⇒ 显式 null（删键）；非法 ⇒ 就地提示不提交）⇒ 回查看态 + 弹窗与表同刷新；取消 ⇒ 回查看态（丢弃输入）。
- **新建态**：用户名 ∥ 展示名 ∥ 角色 +「创建」+「取消」；创建 ⇒ POST `/api/members` ⇒ 关窗 + 页级一次性秘密区回显初始密码（`ctx.showSecret`——语义不变）+ 表刷新；失败 ⇒ flash（弹窗留驻）。
- **刷新口径**：幂等操作（配额 ∥ 吊销）成功 ⇒ 弹窗留驻 + 就地重渲（连续操作不丢上下文）；秘密面动作（新建 ∥ 重置）成功 ⇒ 关窗（秘密区在页上可见——仅一次）；禁用勾选 = 即时写（无批提交面——不重渲，勾选态自持）。
- **不做**：成员改名 ∥ 改角色 ∥ 删除（现行操作集外——删除全库零路径在案）∥ 离表计数键逐行列示（离表且无覆盖的计数键不入表——用量仍入总额，注行口径在案）∥ 禁用草稿/批量保存（即时写——上条）∥ 嵌入行禁用（表不列嵌入行——嵌入面零涉）。

**③ 服务模型页与配置面**（`#/admin/models`——管理组（**Provider** 之后——管理 7）∥ admin 面；功能点 17；配置面 = 用户 2026-10-06 21:39/21:40 裁定 A/C/D/E——KD-SV-34）：

- **列表**（同源派生）：数据 = `GET /api/admin/providers` 的 `models` 展平（`provider/model` 前缀形）+ 嵌入引擎模型（`state.system.embedding.model`——在场则列，面 = embeddings）；
  列 = 模型 ∥ Provider ∥ 面 ∥ **配额**（功能点 23②——`settings[上游].quotaTokens`：值 ∥ 未设 ⇒「不限」（`common.quotaUnlimited`）；嵌入行 ⇒「—」；与 F 组单源——零第二存储/端点，保存后列表刷新随动）；**序 = `id` 升序**（2026-10-07 走查收正——长清单可找；`deriveModels` 出口单点）；空态文案；行点击 ⇒ 详情弹窗。
  同源口径 = 与 `/v1/models` **同源派生**（后者需团队 key——控制台经既有 admin 数据面派生，目录来源不变——需求边界；本页 = 开放清单全量，`/v1/models` = 开放清单 − 调用者禁用集（成员面——`gateway/API.md` §2.1））；**本页零上游探针**（列表/详情/停用皆不引发现面——上游可达性与本页无涉）。
- **详情弹窗**（复用 ①）：详情 = 模型标识 ∥ Provider ∥ 上游模型名（首斜杠余段）∥ 面；嵌入模型行注「配置 = 系统页 · 向量服务卡」——A/C/D/E/F 五组不落该行。
- **配置区（五组——chat 行）**：
  - **A · 开放状态**：状态显「开放」（本页列表 = 开放集）；动作「停用」= confirm ⇒ PATCH `models` 减项 ⇒ `/v1/models` 与派发随动 ⇒ 弹窗关 + 列表刷新 + flash；提示 = 停用后从服务清单移除 ∥ 重新开放 = Provider 页勾选（仍在上游发现列表时）。**退役模型（不在上游发现集仍开放）同口径可停**——本页 = 开放清单自持操作面（用户 21:40 裁）。
  - **C · 限流**：RPM（每分钟请求数）∥ TPM（每分钟 token 数）两输入（正整数；空 = 不限）；提示 = 保存即生效（零重启）；机制全文 = `gateway/API.md` §6（KD-SV-35）。
  - **F · 配额**：每人每月默认用量输入（≥0 整数；空 = 不限——`quotaTokens`）；提示 = 不设 = 不限 ∥ 成员可在成员弹窗分模型覆盖；机制全文 = `metering/METERING.md` §2（KD-SV-38）。
  - **D · 展示元数据**：自动行 = 上下文 ∥ 最大输出 ∥ 多模态（规格快照查表——`thincoder-server/public/model-specs-snapshot.mjs`（已落盘）；未知模型 ⇒「未收录」——不套兜底值）+ 手填「说明」（短文本 ≤200 字符；空 = 未设）；口径 = 仅供展示、不影响转发。
  - **E · 成本权重**：输入权重 ∥ 输出权重两输入（非负数；空 = 未设）；**显式圈界 =「内部估算参考——非计费口径」**（对外计费零触；估算消费面 = 后续轮）。
- **保存 / 取消**（脚区）：保存 = PATCH provider `settings`（键级合并——单键提交：键 = 本模型上游名 ∥ 值 = 全字段对象（含 `quotaTokens`——≥0 整数 ∥ 空 = 显式 `null`）——未设/清空 = 显式 `null`；草稿初值 = GET 行 `settings` 该键值 ⇒ 部分字段编辑不丢其余字段）⇒ flash「已保存（保存即生效）」+ 弹窗留驻；取消 ∥ × ∥ ESC = 弃稿（沿 ①）；数值校验前端先行（非法 ⇒ 就地提示不提交——服务端复核为准）。
- **与 Provider 页协同（单源）**：勾选（Provider 页）与停用（本页）同写 `provider.models`——无互斥面；`settings` 写面 = 本页（Provider 页表单零涉）；退役项在 Provider 页只读注 + 恒保留（§2.4④），本页停用后其注行自然不含。
- **不做**：模型增删（归 provider 面——目录来源不改）∥ 直连 `/v1/models`（无团队 key）∥ 用户角色可见面（需两角色端点——未裁）∥ 上游状态检查 /「已退役」列表标注（零探针口径——退役可见性 = Provider 页发现面）∥ 并发/连接数限流（C = RPM/TPM 速率限）∥ 嵌入引擎模型行配置（= 系统页 · 向量服务卡）∥ 模型设置手工种子面（控制台单一面）∥ 配额仅平台层在本页设置（成员覆盖 = 成员弹窗 ∥ 检查 = 网关——`metering/METERING.md` §2）。

**④ Provider 管理面（功能点 18——列表 + 双弹窗；用户 21:35 ∥ 21:36 ∥ 21:40 三裁定在案）**：

- **列表页**（`#/admin/providers`）：页首 = 标题「Provider」+「添加」钮；列 = 名称 ∥ baseURL ∥ 密钥（掩码 ∥ 未配置）∥ 服务模型数；行点击（Enter/Space 同开——沿成员页口径）⇒ 详情弹窗；**零内联添加/编辑面**（旧表单撤除——判据 = §6 AC-18 行；旧表单族类（`.provider-form` ∥ `.key-clear` ∥ `.stack-models`）随双弹窗复用；`.model-picks` 随本批列表表格化退役（§2.6⑤——规则与字面删净）——零死类 ∥ §2.5 接续标注同拍）。
- **添加弹窗**（复用 ①；取形 = VSC 面板 [+ Add] 形 `thincoder-vscode/webview/settings-providers.js:200`，步序语义 = 核件 `thincoder-core/provider-flows.mjs:136` `addProviderFlow`——QuickPick 逐步问答形 = 宿主形态不移植）：
  - 类型一选（预设 ∥ 自定义）：预设表 = `GET /api/admin/providers/presets`（弹窗首开惰性拉取——已配名剔除；失败 ⇒ 提示 + 自定义径照常）；选预设 ⇒ 信息行（地址——只读）+ 模型清单表（表格形——§2.6⑤）+ 补 apiKey（可空——`env:` 照收）⇒ 保存。
  - 自定义径：名 ∥ baseURL ∥ apiKey 手写 +「获取模型」探针 ⇒ 候选勾选（勾选集 = 该条目开放模型；探针结果 = **同窗**——候选渲染（**列式富信息 + 在飞加载态同详情窗**——同一渲染助手，见下） ∥ 空地址/失败 ⇒ 窗内状态行——2026-10-07 走查收正）；保存不设发现门（models 可空——沿 POST 语义）。
  - 写入 = POST 全字段路径（无 `preset` 字段——校验不豁免；契约 = `gateway/API.md` §2.2）——**POST 携 `modelMeta`**（探针所得——过滤/合并口径同详情窗；无探针 ⇒ 省略键）；成功 ⇒ 关窗 + 列表刷新 + flash；失败 ⇒ **窗内状态行**（弹窗留驻——2026-10-07 走查收正）；未选类型 ⇒ 同窗提示；取消/×/ESC = 弃稿。
- **详情弹窗**（复用 ①——两段 + 单脚区）：**信息段** = 名称 ∥ baseURL（预填输入——「改」承接旧编辑面）∥ 密钥（输入 + 掩码占位「留空 = 不修改」+「清除密钥」勾）∥「测试连接」（同窗；= discover 复用——`POST /api/admin/providers/discover`，`providerId` 取库内 key；零新端点；**结果 = 同窗结果行**〔进行中 ∥ 成功 ∥ 失败段内显示——2026-10-07 走查收正：原 flash 在弹窗外；保存失败同窗〕）∥「删除」（confirm ⇒ DELETE）。
  - **勾选段** = 「服务的模型（勾选 = 对团队开放）」——候选 = **上游发现集**（「刷新候选」⇒ discover；`baseURL` 取草稿输入 ∥ key 取库内；勾选态 = 现配置 `models`）；候选列表 = **列式表**（五列 = 模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态——首格 = `label`（勾选 + 模型名；点题名同切换）；缺则空、零占位——§2.6⑤）；零手填口径不变）。
  - **候选行富信息（功能点 24——只显示有用途项；数据面 = `gateway/API.md` §2.2；2026-10-07 列式收正）**：数据 = 本次发现 `modelMeta` ∪ 该行已存 `modelMeta`（**逐字段——发现值优先 ∥ 存储补齐**；两处皆缺 ⇒ 该项不出）；
    展示 = 逐字段落列（首列 = 模型；后四列 = 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态——列头键 = `colDisplayName` ∥ `colContext` ∥ `metaVision` ∥ `colStatus`）：`displayName` ⇒ 展示名列 ∥ `contextWindow` ⇒ 上下文列（`fmtTokens`：≥1e6 ⇒ `xM`（一位小数舍零）∥ ≥1e3 ⇒ `xk` ∥ 原值）∥ `vision === true` ⇒ 视觉列 `✓`；
    单元格 = `hint` span——缺则空、零占位；退役格 = `hint error`（下条）；零新类、零新变量——AC-19 canon 不破。
  - **上游退役提示（只提示——不做自动停用）**：候选 `status` 在场（= 上游标记退役，如 ark「Shutdown」）⇒ 状态列 `hint error` 徽标（`upstreamRetiredBadge`）+ 注行（`upstreamRetiredNote`——「模型名 (状态原文)」清单；零命中不出）；**勾选 ∥ 保存 ∥ 派发零涉**——被标记模型照常可勾、照常服务（停用入口 = 服务模型页自持面不变——功能点 17/18 原裁）。
  - **候选段加载态（#984——本批）**：首开自动拉取 ∥「刷新候选」在飞期 ⇒ 段内 `.hint` 加载文案（`candidatesLoading`——⑨ 族 canon：静态文案、零动画）+ 触发钮在飞 `disabled`；完成 ⇒ 候选 ∥ 空态；失败 ⇒ `.hint error`（重试钮恢复可点）。添加弹窗「获取模型」同径（同一渲染助手——一处落双窗）。
  - **脚区** = 「保存」（PATCH 变更字段——`models` 全量数组 + `modelMeta` 期望图（存储 ∪ 发现——逐字段合并：**发现值优先 ∥ 存储补齐**；空图 ⇒ 省略键）⇒ 保存即热生效；零变更 ⇒ 直接关窗）∥「取消」（弃稿）。
- **同源链闭合**：勾选集 = 服务集（写入 provider `models` ⇒ 派发开放清单 ⇒ `/v1/models` 随动）；服务模型页 = 同源可视面（`providers` 展平——§2.4③）——开放/停用自持面亦在其上（A）。
- **退役模型生命周期（用户 21:40 裁）**：已开放但不在发现列表中的模型（上游退役）⇒ 本窗不可勾/不可停——只读注行「不在上游发现列表中的已开放模型：{...}——停用入口 = 服务模型页」；保存提交 = 勾选草稿（初值 = 现配置；此类项不触碰 ⇒ 恒保留）；开放/停用全权 = 服务模型页自持（A——需求 §2:17）。
- **发现失败路径（用户 21:36 裁——无手填）**：失败 ⇒ 段内提示 + 「刷新候选」重试；候选面零文本输入（无手填入口）；保存不受阻（草稿 = 现配置未动 ⇒ 无损）。
- **不做**：批量勾选端点（PATCH `models` 单写已足——零新端点）∥ 保存后自动准入探针（VSC M9 行为不移植——「测试连接」/「获取模型」一步可达）∥ 手填模型（裁定）∥ name/baseURL 独立编辑态（单脚区保存胜出——KD-SV-33）。

### 2.5 样式族规范（功能点 19——全控制台样式收束 · 2026-10-06）

用户 22:00 列表起意（「不同的列表样式会有区别，比如 hover 行的背景色会不一样，有的还没有，我希望你统一规划一下列表样式」）→ 22:01 扩裁（「还有哪些你觉得应该统一规划的样式也都一起规划一下」）⇒ 全控制台族目收束。落点 = `thincoder-server/public/style.css`（单档重排——**零新档**）+ 各视图档类串微改；**边界** = 版式/结构/数据/交互语义零动（骨架沿用）；与「系统基线统一」（一字族/一字号/无粗体·颜色区分）对齐。

**族目勘误（父侧拟十族目——设计轮实读后）**：① 列表面 ∥ ② 按钮族 ∥ ③ 表单控件 ∥ ④ 间距刻度 ∥ ⑤ 字排 ∥ ⑥ 色板与状态色 ∥ ⑦ 卡片/容器 ∥ ⑧ 弹窗内构 ∥ ⑨ 空/错/加载态——**九族维持**；**增「码面」= 第 10 族**（`code` 芯片 ∥ `snippet` 块 ∥ 密钥/标识字面量——现盘跨 ⑤⑦ 无主）；**「变量单源」由并列族重定位为底座**（全族值源——机制面）。

**口径（五条——族面通则）**：

① **变量单源**（底座）：`style.css` `:root` = 色/间距/圆角/字排/线宽/布局唯一值源；`:root` 块外零颜色字面量。
② **一套刻度**（④）：间距七级 ∥ 圆角三级（值表 = 下）；归位口径 = 就近取级、等距取小（保守——不放大）。
③ **系统基线对齐**（⑤）：**一字族 ∥ 一字号（13px） ∥ 行距 1.5 ∥ 自有文字零粗体**——强调 = 颜色通道；层级 = 结构通道（位置 ∥ 间距 ∥ 底色 ∥ 边框 ∥ 线宽）。
④ **态面齐备**（①⑨）：悬停/聚焦/禁用/空·错·加载态逐族在册；**悬停底同值——限定列表行/中性面**（`--hover`：表格数据行 ∥ 导航项；「有的还没有」收口）；钮/链接等交互件悬停取值逐型在表（②——非同值面）。
⑤ **收束不重设计**：类名骨架沿用（仅删死类 ∥ 新增态修饰 `.error`）；零动画/过渡；零依赖零构建不变（KD-SV-9）。

**散置/不一致清单（改前实读——2026-10-06 盘面；行号 = `thincoder-server/public/style.css`）**：

| # | 散置/不一致项 | 改前实读 | 收束 |
|---|---|---|---|
| S1 | 悬停底分歧 + 零悬停面（用户原句） | `:27` `#eef1f5`（导航项）∥ `:129` `#f3f6fb`（可点行）∥ 非可点表行零悬停 | `--hover`（`#eef1f5`）列表行/中性面单值 |
| S2 | 表头/码底两值 | `:39` `#eef1f5` ∥ `:40` `:69` `#f0f2f5` | `--fill`（`#f0f2f5`） |
| S3 | 状态色重字面 | `:85` `:94` `#2e9e5b` ∥ `:86` `:95` `#d8a013` ∥ `:84` `#9aa3b0` | `--ok` ∥ `--warn` ∥ `--idle` |
| S4 | 白两写法 | `:43` `:44` `:78` `#fff` ∥ `:5` `--panel`＝`#ffffff` | 统一 `--panel` |
| S5 | 字号七档 | 12px（10 处）∥ 13px（12 处）∥ 15px（`:34`）∥ 18px（`:121`）∥ 20px（`:93`）∥ body 16（缺省）∥ h2 24（UA） | `--fs`（13px——全档单值） |
| S6 | 字重七处 600 + UA 粗体 | `:23` `:28` `:39` `:72` `:74` `:79` `:93`（600）∥ h2/h3/h4（UA 700） | 全 400（零粗体——强调走色） |
| S7 | 圆角四值 | `:104` 2 ∥ `:40` 3 ∥ `:26` 等 6 ∥ `:35` `:54` `:117` 8 | `--r-1..3` = 4/6/8 |
| S8 | 间距十三值 | 1 ∥ 2 ∥ 3 ∥ 4 ∥ 5 ∥ 6 ∥ 8 ∥ 10 ∥ 12 ∥ 14 ∥ 16 ∥ 18 ∥ 20（padding/margin/gap 全档散置） | `--sp-1..7` = 2/4/6/8/12/16/20 |
| S9 | 行高三值 | 缺省 `normal` ∥ `:73` 1.7 ∥ `:121` 1 | `--lh`（1.5——全档继承） |
| S10 | 聚焦环单处 + 控件走 UA 缺省 | `:130` 仅可点行有环；钮/输入/下拉零自定义环 | 统一环 2px `--accent`（控件外偏 2px ∥ 行内缩 −2px） |
| S11 | 钮族态面缺位 | `:43` 起零 `:hover`/`:focus-visible`/`:disabled` | 五型悬停在册 ∥ 禁用中性化（`--muted` 字 ∥ `--fill` 底） |
| S12 | 危险钮两形 | 主危（`:45` 仅改字/边——底仍 `:43` 蓝）∥ 次危（`:44`+`:45` 白底红字） | 危险 = 描边单形（面板底 ∥ 红边红字 ∥ 悬停 `--danger-fill`） |
| S13 | 活动/选中态两形 | `:28` 导航（底 `#e6efff` + 字 accent + 600）∥ `:79` 语言钮（边/字 accent + 600——零底） | `--selected` 底 + accent 边/字（600 撤） |
| S14 | 死类/死规则 | `stat`（`thincoder-server/public/views-usage.mjs:106` ∥ `views-overview.mjs:50` 传参——零规则）∥ `view`（`thincoder-server/public/app.mjs:248` `:259` 传参——零规则）∥ `.key-line`（`style.css:58` 规则——零消费者） | 删净（双向闭合口径 = §6 AC-19 续行） |
| S15 | 宽值重复 | 560（`:117` ∥ `:122`）∥ 200（`:21` ∥ `:31`） | `--modal-w` ∥ `--nav-w` |
| S16 | 三态同形（错不可辨） | 加载 ∥ 空 ∥ 错皆 `.hint`（`--muted`） | 加载/空 = `.hint`；错 = `.hint error`（`--danger` 字） |
| S17 | 强调线两宽 | `.tip-bar` 3px（`:113`）∥ 聚焦环 2px | `--bw-strong`（2px） |

**底座（⑩ 重定位）：变量族（`style.css` `:root`——单源）**：

| 组 | 变量 = 值 | 角色/消费面 |
|---|---|---|
| 底/面 | `--bg`＝`#f5f6f8` ∥ `--panel`＝`#ffffff` | 页底 ∥ 侧栏/卡/弹窗/钮底 |
| | `--fill`＝`#f0f2f5` ∥ `--hover`＝`#eef1f5` ∥ `--selected`＝`#e6efff` ∥ `--backdrop`＝`rgba(15, 23, 42, 0.45)` | 静态浅底 ∥ 悬停底 ∥ 选中/活动底 ∥ 弹窗遮罩 |
| 字/线 | `--text`＝`#1f2430` ∥ `--muted`＝`#6b7280` ∥ `--border`＝`#d9dee5` | 正文 ∥ 次级/禁用字 ∥ 结构线 |
| 主 | `--accent`＝`#2f6fed` ∥ `--accent-hover`＝`#2a63d4` ∥ `--accent-contrast`＝`#ffffff` | 主色 ∥ 主钮/链接悬停 ∥ 主钮字 |
| 状态 | `--ok`＝`#2e9e5b` ∥ `--warn`＝`#d8a013` ∥ `--danger`＝`#c2372f` ∥ `--idle`＝`#9aa3b0` | 成功 ∥ 警告 ∥ 危险 ∥ 中性（健康点） |
| 状态面 | `--danger-fill`＝`#fff5f5` ∥ `--warn-fill`＝`#fff4d6` ∥ `--warn-line`＝`#e5cf98` ∥ `--warn-ink`＝`#6b4b00` | 密钥面底/危险悬停 ∥ 提示条底 ∥ 提示条线 ∥ 提示条字 |
| 间距（④） | `--sp-1..7` ＝ 2 ∥ 4 ∥ 6 ∥ 8 ∥ 12 ∥ 16 ∥ 20（px） | 全档 padding/margin/gap |
| 圆角（⑦） | `--r-1..3` ＝ 4 ∥ 6 ∥ 8 | 微件（码芯片/柱顶） ∥ 控件 ∥ 容器/弹窗 |
| 字排（⑤） | `--font`＝系统 UI 栈（现值） ∥ `--mono`＝`ui-monospace, Consolas, "Courier New", monospace` ∥ `--fs`＝13px ∥ `--lh`＝1.5 | UI 唯一族 ∥ 码唯一族（⑩ 码面——登记例外） ∥ 唯一字号 ∥ 唯一行高 |
| 线宽 | `--bw`＝1px ∥ `--bw-strong`＝2px | 结构线 ∥ 强调线（提示条左规 ∥ 聚焦环） |
| 布局 | `--nav-w`＝200px ∥ `--modal-w`＝`clamp(560px, 78vw, 1200px)`（视口比例式三段：小屏保底 560 ∥ 比例段 78vw ∥ 大屏封顶 1200——2026-10-07 用户走查令） | 侧栏宽+内容缩进 ∥ 弹窗宽（三处口径） |

**族值表 + 套用表（①–⑩——逐族；「随其落地」= #87/#88 新面，本批实施轮按当刻盘面并入）**：

**① 列表面**（数据表 ∥ 侧栏导航 ∥ key 清单）：

| 面 | 收束值 |
|---|---|
| 表容器 `.table-wrap` | 宽表横滚保留（结构零动） |
| 表头 `th` | 底 `--fill` ∥ 字 400 `--text` ∥ 线 `--bw solid --border` ∥ 内距 `--sp-3 --sp-4` |
| 表头吸附（壳内——§2.6②） | `position: sticky` + `top: 0` + `z-index: 1`（滚区 = `.table-slot > .table-wrap`）；底色 = `--fill`（上行单源）；弹窗内表自滚（单滚动面伸缩链——§2.6⑤）+ 表头吸附（2026-10-07 走查收正） |
| 单元格 `td` | 内距 `--sp-3 --sp-4` ∥ 线 `--bw solid --border` ∥ 行高 `--lh` |
| 行悬停（可点 ∥ 不可点——表格数据行） | `--hover`（`tbody tr:hover` 单一声明——表格数据行全覆盖） |
| key 表（me-keys 批——`#/me/keys`） | 表格族 canon 同源（`.table-wrap > table`——§2.6⑤ 同构 ∥ 行悬停 = `tbody tr:hover` 上行单一声明）；`ul.key-list`/`.key-item`/`.key-meta` 族随页重做**删净**（零死类——S14 口径） |
| 可点行 `.row-clickable` | `cursor: pointer` ∥ `:focus-visible` 行内环（−2px） ∥ 键盘可达（`tabindex` + Enter/Space——视图档口径现状保持） |
| 选中/活动 | `--selected` 底 + `--accent` 字（现落点 = 导航活动态 ∥ 语言钮 `.active`） |
| 导航项 `.nav-item` | 内距 `--sp-2 --sp-4` ∥ 圆角 `--r-2` ∥ 悬停 `--hover` |
| 空态 | `.hint`（⑨） |
| 套用面 | 侧栏导航 ∥ 成员表 ∥ Provider 表（#87——随其落地） ∥ 服务模型表（#88——随其落地） ∥ 用量明细/排行 ∥ 审计 ∥ 账户 ∥ key 表（me-keys 批） |

**② 按钮族**（五型 + 态面）：

| 型 | 类（现名） | 常态 | 悬停 |
|---|---|---|---|
| 主 | `button` | `--accent` 底 ∥ `--accent-contrast` 字 ∥ `--r-2` ∥ 内距 `--sp-3 --sp-5` | 底/边 `--accent-hover` |
| 次 | `button.tiny` | `--panel` 底 ∥ `--border` 边 ∥ `--text` 字 ∥ 内距 `--sp-1 --sp-3` | `--hover` 底 |
| 危险 | `button.danger`（含 `.tiny.danger`） | `--panel` 底 ∥ `--danger` 边/字 | `--danger-fill` 底 |
| 链接 | `button.link` | 无边底 ∥ `--accent` 字 | 字 `--accent-hover` |
| 图符 | `.modal-close` | `--muted` 字 ∥ `--r-2` | `--hover` 底 + `--text` 字 |

- 禁用 = `--muted` 字 ∥ `--fill` 底 ∥ `cursor: default`；聚焦 = 统一环（②③⑦ 同）。
- 语言钮收编：`.lang-switch button` 专用规则并入 `tiny`（padding 微差归刻度）；`.active` = `--selected` 底 + accent 边/字。
- 套用面：页首钮（新建成员 ∥ 添加）∥ 行内钮（测试/编辑/删除 = `tiny`/`tiny danger`）∥ 弹窗脚区（保存/创建 = 主 ∥ 取消/关闭 = 次 ∥ 重置密码/吊销/删除 = 危险）∥ 语言切换两枚 ∥ 退出登录（`link`）∥ 服务模型停用钮（#88——随其落地 = 危险族）。

**③ 表单控件族**：

| 面 | 收束值 |
|---|---|
| `input`/`select` | 内距 `--sp-3 --sp-4` ∥ 线 `--bw solid --border` ∥ 圆角 `--r-2` ∥ 字继承（`--fs`） ∥ 聚焦环 |
| `input.tiny`（紧凑） | 内距 `--sp-1 --sp-3` |
| `input.quota`／`.provider-form input` | 宽/最小宽 = 尺寸字面（非刻度面——原值保留） |
| `label` | 距 `--sp-3` ∥ `--muted` |
| 勾选框 `checkbox` | 原生 + `accent-color: var(--accent)`（零自绘） |
| 表单容器 `.row-form`/`.stack`/`.provider-form` | 距 `--sp-4` |
| 套用面 | 登录 ∥ 改密 ∥ 配额 ∥ 过滤表单（用量/审计） ∥ 新建成员 ∥ #87 弹窗字段（名/baseURL/密钥/清除勾/候选勾选——随其落地） ∥ #88 配置输入（RPM/TPM/权重/说明——随其落地） |

**④ 间距刻度**：

| 面 | 收束值 |
|---|---|
| 刻度 | `--sp-1..7` ＝ 2/4/6/8/12/16/20 |
| 归位口径 | 就近取级 ∥ 等距取小（不放大） |
| 页节距 | `main` 外距 `--sp-7` ∥ 卡下距/内距 `--sp-6` ∥ 页题下距 `--sp-6` |
| 栅格间隔 | `.stat-grid`/`.grid-2` `--sp-5` ∥ `.detail-grid` `--sp-3 --sp-5` |
| 白名单 | `0`/`auto` 字面；尺寸类（width/height/max-*）不属刻度面 |

**⑤ 字排族**：

| 面 | 收束值 |
|---|---|
| 族 | `--font` 单栈（UI） ∥ `--mono`（码——⑩ 面） |
| 字号 | `--fs` 13px（全档唯一——含页题/卡题/KPI/表/钮/输入） |
| 行高 | `--lh` 1.5（全档继承——`.end-list` 1.7 ∥ 图符钮 1 撤） |
| 字重 | 全 400（零粗体——600 七处 ∥ UA 700 撤） |
| 层级 | 结构通道（位置 ∥ 间距 ∥ 底色 ∥ 边框 ∥ 色）——h2/h3 = `--text` ∥ h4 = `--muted` |
| 强调样例 | `.update-tip` = `--warn` 字；ok/degraded/down 状态文案 = 色 |
| 字距 | 零声明（现状即符——无 tracking） |

**⑥ 色板与状态色族**：值 = 底座色变量（上表）——语义分配：

| 面 | 收束值 |
|---|---|
| 提示条 `.flash` | `--warn-fill`/`--warn-line`/`--warn-ink`（单形——零严重度分色） |
| 提示条 `.tip-bar` | 卡 + 左 `--bw-strong` `--accent` 规 |
| 密钥面 `.secret` | 虚线 `--danger` 边 + `--danger-fill` 底 |
| 健康三态（灯 ∥ 系统块 ∥ 总览卡） | `--ok`/`--warn`/`--danger` ∥ 中性 `--idle` |
| KPI 三态（`.stat-value.ok/.degraded/.down`） | 同上单源 |
| 套用面 | 十页色面 + #87/#88（随其落地） |

**⑦ 卡片/容器族**：

| 面 | 收束值 |
|---|---|
| 基 `.card` | `--panel` ∥ `--bw solid --border` ∥ `--r-3` ∥ 内距 `--sp-6` ∥ 下距 `--sp-6` |
| 变体 | `.stat-grid .card`（网格内零下距） ∥ `.tip-bar`（左规） ∥ `.secret`（危险面） ∥ `.snippet`（码块——⑩） |
| 套用面 | 总览卡集 ∥ 用量看板卡 ∥ 系统四卡 ∥ 接入卡 ∥ 成员/Provider/模型列表卡（#87/#88 随其落地） ∥ 登录卡 ∥ 我的三页卡 |

**⑧ 弹窗内构族**：

| 面 | 收束值 |
|---|---|
| 壳 `dialog.modal` | `--panel` ∥ `--bw solid --border` ∥ `--r-3` ∥ 宽 `--modal-w` |
| 头/脚 `.modal-head`/`.modal-foot` | 内距 `--sp-5 --sp-6` ∥ 分隔线 `--bw` |
| 体 `.modal-body` | 内距 `--sp-5 --sp-6` ∥ max-height `min(70vh, --modal-w)`（公式未动；560 不再约束 ⇒ 桌面实际 = 70vh——2026-10-07 用户走查令） |
| 小节 h4 ∥ 详情栅格 `.detail-grid` | `--muted`（⑤） ∥ 栅距 `--sp-3 --sp-5` + 下距 `--sp-5` |
| 遮罩 `::backdrop` | `--backdrop` |
| 弹窗内表格（§2.6⑤） | 全站表格族同源（`.table-wrap > table`）——勾选表 ∥ 预设模型表 ∥ 成员 key 表 ∥ 配额表；自滚（单滚动面伸缩链 §2.6⑤——短表保自然全高 ∥ 长表承缩自滚）+ 表头吸附（2026-10-07 走查收正） |
| 套用面 | 成员三态窗 ∥ 模型详情窗 ∥ #87 双弹窗（添加/详情——随其落地） ∥ #88 配置窗（随其落地） |

**⑨ 空/错/加载态族**：

| 面 | 收束值 |
|---|---|
| 加载 | `.hint`（静态文案——零动画零 spinner） |
| 空 | `.hint` |
| 错（页内） | `.hint error`（`--danger` 字——七处「加载失败」面：`views-admin.mjs:45` ∥ `views-me.mjs:67` ∥ `views-models.mjs:79` ∥ `views-usage.mjs:57` `:58` ∥ `views-audit.mjs:46` ∥ `views-providers.mjs:35`；+ 系统页诊断失败面：`views-system.mjs:47` 状态行 ⇒ `.error` ∥ `:50` 试跑行 ⇒ `.hint error`；+ 弹窗段内 3 处（`views-providers-modals.mjs`：候选发现失败 ∥ 窗内状态行×2〔添加窗 ∥ 详情窗——测试连接/保存/获取模型；2026-10-07 走查收正〕）） |
| 全局提示 | `.flash`（⑥ 单形） |
| 套用面 | 十页空/加载/错态 + #87/#88 新面（随其落地） |

**⑩ 码面族（新增）**：

| 面 | 收束值 |
|---|---|
| 芯片 `code` | `--mono` ∥ `--fs` ∥ `--fill` 底 ∥ 内距 `--sp-1 --sp-2` ∥ `--r-1` |
| 块 `.snippet` | `--mono` ∥ `--fill` 底 ∥ `--bw solid --border` ∥ `--r-2` ∥ 内距 `--sp-4` ∥ 横滚 |
| 块内芯片 | 底/内距清零（去重） |
| 密钥字面量 `.secret-value` | `word-break: break-all` ∥ `user-select: all`（可全选——保留） |
| 口径 | 码族 = **唯一族例外**（字面量对齐/可读——桌面排版先例同款：码面独立于 UI 族）；同号同重（一字号口径不破） |
| 套用面 | 表内标识/密钥提示形 ∥ 系统页/用量页 snippet ∥ 密钥明文区 ∥ #87 模型清单（随其落地） ∥ #88 快照值（随其落地） |

**#87/#88 接续标注**：本节 = 全域样式单源——**后续新增面按本节族表套用**；#87（Provider 重做——工具条 ∥ 添加/详情双弹窗 ∥ 候选勾选列表） ∥ #88（服务模型配置——配置四组 ∥ 停用流 ∥ 元数据行）之新面已列各族套用面并标「随其落地」——本批实施轮以当刻盘面为准并入；
两批产品面落地晚于本批 ⇒ 由其落地轮按本节套用（本批不代改其面）；#87 旧内联面撤除 ⇒ 其表单族类（`.provider-form`/`.key-clear`/`.stack-models`）随双弹窗复用——零死类（S14 零登记）；`.model-picks` 随布局收正批（§2.6⑤）退役——规则与字面删净。

**me 用量图表化批（2026-10-07）新面登记**：`.bar-stacked`/`.bar-seg`/`.bar-swatch`/`.chart-toggle`/`.bar-legend`/`.report-card`——按族套用（段色 = `--accent` 透明度阶梯〔⑥ 色板单源不破〕 ∥ 切换钮活动态 = `.lang-switch .active` 同形〔① 选中态〕 ∥ 内距/间距/圆角 ∈ 各族刻度；零新 `:root` 变量 ∥ 零新悬停规则）；实施轮以当刻盘面并入。

**实施面（本批）**：`style.css` 重排（值源化 + 态面 + 死规则删） ∥ `views-admin.mjs` ∥ `views-me.mjs` ∥ `views-models.mjs` ∥ `views-usage.mjs` ∥ `views-audit.mjs` ∥ `views-providers.mjs`（`.hint error` 共 7 处） ∥ `views-providers-modals.mjs`（#87 段内错误面 ⇒ `.hint error`——随其落地并入） ∥ `views-system.mjs`（诊断失败面 2 处——`.error` 修饰） ∥
  `views-overview.mjs` ∥ `app.mjs`（死类串删——`stat` 2 处 ∥ `view` 2 处）；`nav.mjs` ∥ `modal.mjs` ∥ i18n 两表 = 零触（零新文案）。

### 2.6 数据表页视口高壳与布局收正（功能点 20——2026-10-07）

用户 07:24–07:32 走查四条（表格适应视口高 ∥ 主内容左对齐 ∥ provider 弹窗模型列表表格化 ∥ 成员弹窗 key 列表表格化）⇒ 本条。**边界**：不动列/数据语义 ∥ 分页/筛选不入本批 ∥ 零依赖/零构建不变（KD-SV-9）。

**① 套用面（钉表）与排除面**：

- 壳面 = 数据表五页：成员 `#/admin/members` ∥ Provider `#/admin/providers` ∥ 服务模型 `#/admin/models` ∥ 审计 `#/admin/audit` ∥ 用量明细 `#/me/usage`（我的·用量页——父侧 07:4x 裁定；批 `docs/batches/2026-10-07-console-layout.md` §1 补记）。
- 排除面：`#/admin/usage` 看板页（报表卡无界——与有界壳不相容；如需并入另轮）∥ 布局/信息表（系统页四表 ∥ 账户页表 ∥ 我的用量页报表卡（分模型表——随卡自滚；非壳表链））∥ key 表（页级——`#/me/keys`；非壳数据表——钉表五页不扩（2026-10-07 me-keys 批在案）；入壳 = 另议）。

**② 机制——两段壳与高度链（表尾计数 = 表内 tfoot）**：

- 壳结构 = `.page-head`（页题/工具条/过滤——固定）∥ `.page-area`（表卡——吃剩余高）；由 `ctx.dataShell(mount, { head, area })` 构建（两段挂载）。表卡内 = `.table-slot`（表 ∥ 空/错态）——直持 `.table-wrap`（滚区）；**行计数 = 表内 `<tfoot>`**（`table(…, { foot: true })` 或自建构建器同形——「共 N 项」，吸附表底）。
- `body.data-shell` = 壳页标记（`app.mjs` 路由按 `SHELL_PAGES` 五路径切换——登录/登出径清除）。
- 高度链（`style.css` 声明单源——本表）：

| 选择器 | 声明 |
|---|---|
| `body.data-shell .content` | `height: 100dvh; display: flex; flex-direction: column` |
| `body.data-shell main` | `flex: 1; min-height: 0; display: flex; flex-direction: column` |
| `body.data-shell main > section` | `flex: 1; min-height: 0; display: flex; flex-direction: column` |
| `.page-head` | `flex: none` |
| `.page-area` | `flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--sp-6)`（多卡壳页——卡间距；单卡页零影响） |
| `.page-area > .card` | `flex: 1; min-height: 0; display: flex; flex-direction: column; margin-bottom: 0` |
| `.page-area > .card.report-card` | `flex: none; max-height: 55%; overflow-y: auto`（报表卡——自然高不承缩；上限 = 页区高 55%（超限卡内自滚——滚动条仅超限时出）；明细卡仍走上行承缩链、恒得剩余高——me 用量图表化批。与 §2.6① 判否理由〔报表卡无界——与有界壳不相容〕对齐：本页报表卡经上限界定，入壳相容） |
| `.table-slot` | `flex: 1; min-height: 0; display: flex; flex-direction: column` |
| `.table-slot > .table-wrap` | `flex: 1; min-height: 0; overflow-y: auto` |
| `body.data-shell main thead th` | `position: sticky; top: 0; z-index: 1` |
| `body.data-shell main tfoot td` | `position: sticky; bottom: 0; z-index: 1; background: var(--fill); color: var(--muted)` |

- 吸附口径：表头吸附在滚区上沿、**表尾 `tfoot` 吸附滚区下沿**（底色 = `--fill`——① 族单源）；**弹窗内表 = 自滚 + 表头吸附**（壳吸附选择器限 `main` 不命中弹窗；弹窗侧规则 = 2026-10-07 走查收正——§2.6⑤）。
- 挂载前提①（弹窗挂载点——壳吸附不命中弹窗可核）：`<dialog>` 直属 `document.body`（`modal.mjs` 实读 2026-10-07——`document.body.append(root)`；不在 `main` 内）⇒ 吸附选择器 `body.data-shell main thead th` 不命中弹窗内表。
- 挂载前提②（壳挂载点——高度链落点）：视图根 `<section>` 直属 `main#app`（`app.mjs` 路由实读——`h("section")` ⇒ `appEl.replaceChildren(mount)`；`index.html` `<main id="app">`）——`ctx.dataShell` 的 `mount` = 该 section ⇒ 高度链 `main > section` 命中视图根。
- 回退：`@media (max-width: 760px), (max-height: 600px)` ⇒ `body.data-shell .content { height: auto }`——撤高度链（整页滚；吸附随壳失效）；阈值 = 设计取值。
- 零新 `:root` 变量 ∥ 零新悬停规则——§2.5 canon 不破（新声明全数纳入其判据）。

**③ 表尾行计数（tfoot）**：「共 N 项」（`common.rowCount`）——值 = 渲染行数（纯前端派生：随表同建——每次取数渲染即随行集现算；**空/错态 = 无表（hint）⇒ 无 tfoot**）。刷新对 = 全部重渲路径（过滤提交 ∥ 弹窗操作后 reload ∥ 语言重渲同拍）。零新端点。

**④ 主内容区左对齐**：`main` 撤 `margin: 0 auto` ⇒ `margin: 0`（左靠；`max-width: 1100px` 沿用——不加戏）。

**⑤ 弹窗内列表 = 表格形**（风格随全站表格族——`.table-wrap > table` 同构 ∥ 既有表样式零新族；**清单序 = 名称升序**〔候选 ∥ 预设清单〕——2026-10-07 走查收正：长清单可找）：

- **Provider 详情弹窗·勾选段**：**列式表五列**（表头 = `admin.models.colModel` ∥ `admin.providers.colDisplayName` ∥ `colContext` ∥ `metaVision` ∥ `colStatus`）——首格 = `label`（勾选 + 模型名）⇒ 点题名同切换保持（交互零改）；
  逐格 = `hint` span（缺则空、零占位；退役格 = `hint error`——有则示；功能点 24 = §2.4④）；空态 = `.hint` ∥ 加载 = `.hint`（`candidatesLoading`——#984）∥ 发现失败 = `.hint error`（§2.4④ 不变量）。
- **添加弹窗·预设信息段**：模型清单 = 单列表（表头 = `admin.models.colModel`——行 = `code` 芯片）；地址行与 apiKey 面零动。
- **成员详情弹窗·key 表**：四列 = 密钥（`code` hint） ∥ 最后使用（本地化 ∥ `neverUsed`） ∥ 近 30 天（`windowTokensCell`——既有窗口口径） ∥ 操作（表头 `admin.members.colActions`；吊销钮行内）；空态 = `.hint`（`admin.members.noKeys`）。
- **弹窗内表自滚**（2026-10-07 走查收正 ∥ 同日实测修正——主信息不随表滚 ∥ **单滚动面**：伸缩链 = `.modal-body` flex 列 ⇒ **内容盒（`.modal-body > div`——modal.mjs 整只 append 的调用层盒）** flex 列 `min-height: 0` ⇒ 固定块 `flex: none` ∥ 清单区（`.pick-box`）`flex: 1 1 auto; min-height: 0` 自滚 ∥
直挂表区（`.modal-body > div > .table-wrap`——成员 key 表 ∥ 配额表）`flex: 1 1 auto; min-height: min-content`——短表（成员 key 表）保自然全高不缩 ∥ 长表（配额表）承缩自滚 + 下限（`.modal-body > div > .quota-table` `min-height: 140px` ≈ 三行——再挤 ⇒ 体滚兜底）；
外层 `overflow-y: auto` 仅极端兜底；Edge headless 同构实测红→绿在案）+ 表头吸附（`.modal-body .table-wrap thead th` sticky——同壳口径）。
- `.model-picks` 退役——规则与字面删净（S14 零登记口径）。

## 3. 判权与安全

- **判权全在后端**（会话 + 角色——`accounts/ACCOUNTS.md` §3）：前端仅显隐与表单；`user` 直打管理端点 ⇒ 403——页面不是判据；管理组导航仅 admin 渲染 ∥ admin hash 由 `nav.mjs` 判 `denied` 落「无权限」块（含 provider 管理面——服务端为准）。本批新增 admin 端点（总览 ∥ 向量服务 ∥ 审计 ∥ 用量报表）同门；`/healthz` = 公开（轮询零凭据——在案）。
- 会话在 HttpOnly cookie（前端零令牌存储）；`401` ⇒ 回 `#/login`（会话过期即回登录）；`403` ⇒ 提示无权限。
- 渲染转义（`textContent` 系——不拼 HTML 串）。

## 4. 视觉与自托管

- 系统字体 ∥ 表格 + 表单 ∥ 桌面优先（宽表横滚）；全自托管（无外部资源引用）；侧栏分组导航（§2）∥ 窄屏降级 = §2 末条。

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/webui/static.mjs`（已落盘） | **78**（实读 2026-10-06——设计估 ≈70） | `public/` 直发 ∥ mime ∥ 防穿越 ∥ no-cache |
| `thincoder-server/public/index.html`（已落盘） | **20**（实读 2026-10-06——设计估 ≈26；#962 壳重排实读零增） | 前端壳（挂载点 + 模块入口） |
| `thincoder-server/public/app.mjs`（已落盘） | **219**（实读 2026-10-06——设计估 ≈190；#962 IA 路由表接线 ∥ 视图装配；#963 +10 = `/api/system` 取用 ∥ meta 填充）**⇒ 240 ⇒ 299**（i18n 叠加 +21 = `initLang` 接线 ∥ 错误映射 ∥ 格式化本地化 ∥ `Retry-After` 捕捉 ∥ `rerender` 口 ∥ title 随动；二轮 +59 = 健康轮询（30s ∥ 三态 ∥ 视图监听） ∥ 两新页接线）**⇒ ≈301**（弹窗批 +≈2 = `views-models` 接线；**越 300 软线**——拆分预案（越线 ⇒ 启用）：健康轮询块迁独立小档 `health.mjs`（拟新增）——沿 `views-admin` 拆分先例；provider 重做批 ±0——接线面不变）**；实读 300（2026-10-07）⇒ ≈316（本批 +≈16 = `dataShell` ∥ `SHELL_PAGES` ∥ 路由 `data-shell` 切换 ∥ `viewCtx` 接线——越 300 软线；拆分预案在册、本批不触发——拆分面（健康轮询块）与布局面零耦合 ∥ 本批增量 = 接线面；重估时点 = 下次触碰本档 ∥ 独立结构轮）⇒ 实读 317 ⇒ ≈320（配额批：`fmtModelQuotas` 新增 ∥ `fmtQuota` 退役——±3；越 300 状态不变——拆分预案在册）**；实读 **321**（2026-10-07——配额批/配额 v2 批落地后；越 300 状态不变——拆分预案在册）**⇒ ≈346（me-keys 批：`showSecret` 复制钮 + 三路回退 +≈25——越 300 状态不变，拆分预案在册）** | 路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手 |
| `thincoder-server/public/nav.mjs`（已落盘） | **无 ⇒ 82 ⇒ 87**（实读 2026-10-06——#962 设计估 ≈70；组/项数据 ∥ `resolveRoute` 纯函数 ∥ 侧栏渲染；#963 +1 = meta 槽版本行；i18n 叠加 ±0 = `label` ⇒ `labelKey` 收编 ∥ 切换器挂 meta 槽；二轮 +5 = 总览/审计两项 ∥ `/admin` 重定向收正 ∥ 默认页收正 ∥ 灯位）**⇒ ≈90**（弹窗批 +≈3 = 服务模型项；§2.4③）；provider 重做批 ±0（labelKey 不变——值改 = 文案表）；实读 88（2026-10-07——本批零动） | IA 单源（§2 ∥ §2.1） |
| `thincoder-server/public/views-auth.mjs`（已落盘） | **无 ⇒ 29**（实读 2026-10-06——#962 设计估 ≈30；登录；自 `views.mjs` 拆）**⇒ 31**（i18n 叠加 +2 = 文案键化 ∥ 登录卡切换行）；实读 31（2026-10-07——本批零动） | 登录视图 |
| `thincoder-server/public/views-me.mjs`（已落盘） | **无 ⇒ 86 ⇒ 87 ⇒ ≈122 ⇒ 117**（实读——本 fix 轮复核 2026-10-06；#962 设计估 ≈150；key ∥ 用量 ∥ 账户设置三页；自 `views.mjs` 拆；i18n 叠加 +1 = 文案键化；二轮 +≈35 = key 行细节（最后使用/窗口用量） ∥ 端点过滤 ∥ 向量提示条）**⇒ ≈125（本批 +≈8 = 我的用量页壳化——key/账户两页零动）⇒ 实读 122 ⇒ ≈126**（配额批：配额行 = 覆盖计数 +≈4）**⇒ ≈211**（me-keys 批：key 页重做 +≈85 = 表六列 ∥ 双弹窗 ∥ 接入卡 ∥ 空态——§2.3⑥；实施实读为准）**⇒ 实读 194（2026-10-07——本设计轮复读；在册估 ≈211 高 17——实读收正）⇒ ≈279（本批：用量页图表化重写 +≈85；194+85≈279——未越 300 软线）⇒ 实读 295（2026-10-07——本批落地后；实际 +101——越估 16；≤300 软线内，拆分预案未触发）** | 我的三页 |
| `thincoder-server/public/views-admin.mjs`（已落盘） | **无 ⇒ 137 ⇒ 139 ⇒ ≈100**（实读 2026-10-06——#962 设计估 ≈130；成员 ∥ 用量统计两页；自 `views.mjs` 拆；i18n 叠加 +2 = 文案键化；二轮 −≈39 = 用量页迁 `views-usage.mjs`——拆分缘由 = 叠加后破 300 软线）**⇒ ≈210**（弹窗批 +≈110 = 成员弹窗三态 ∥ 行点击 ∥ 建表单迁弹窗；§2.4②）**⇒ 169**（实读——本 fix 轮复核）**⇒ ≈189（本批 +≈20 = 成员页壳化 ∥ 成员弹窗 key 表）⇒ 实读 185 ⇒ ≈255**（配额批：分模型覆盖面（查看/编辑两态 ∥ 惰性拉 providers ∥ 键级合并提交）+≈70）**⇒ 实读 275 ⇒ ≈325 ⇒ 实读 331（2026-10-07）**（配额 v2 批：查看态模型表直显（5 列 ∥ 逐行已用 ∥ 平台默认） ∥ 禁用勾选即时写 ∥ providers 取数两态共用；**越 300 软线——在册**：拆分预案 = 成员弹窗面迁 `views-admin-modal.mjs`（拟新增）；本批不触发（增量皆 §2.4② 必落行为；拆分属结构轮——与 #993 同族）；重估时点 = 下次触碰本档） | 管理·成员页 |
| `thincoder-server/public/views-providers.mjs`（已落盘） | **无 ⇒ 213 ⇒ 214**（实读 2026-10-06）**⇒ 本批重做拆分两档**（页面 ≈110——列表 ∥ 工具条 ∥ 行点击接线；拆档缘由 = 双弹窗叠加破 300 软线——§2.4④）**⇒ 实读 56（2026-10-07——重做批落地后）⇒ ≈64（本批 +≈8 = 壳化）⇒ 实读 61（2026-10-07——清账批复读）** | Provider 页（列表） |
| `thincoder-server/public/views-providers-modals.mjs`（已落盘） | **≈260**（设计估——添加流 ∥ 详情流 ∥ 候选勾选助手；越 300 ⇒ 详情流再拆预案——§2.4④）**⇒ 实读 300（2026-10-07——本 fix 轮复核）⇒ ≈335 ⇒ 实读 365（2026-10-07）⇒ 实读 367（2026-10-07——列式收正批落地后）**（模型元数据批落地 +65 = 候选行富信息 ∥ 加载态 ∥ 退役提示 ∥ 保存线形；**越 300 软线在册**——拆分预案（本批细化）= 候选段渲染助手外拆 `views-providers-picks.mjs`（`renderPicks` ∥ 徽标 ∥ 格式化 ∥ 三态——双弹窗共用件）；触发 = 结构轮（#993/#976 同族）） | Provider 弹窗件 |
| `thincoder-server/public/views-system.mjs`（已落盘） | **无 ⇒ 15 ⇒ 59 ⇒ 60 ⇒ ≈150 ⇒ 168**（实读——本 fix 轮复核 2026-10-06；#962 骨架（设计估 ≈30）；#963 +44 = 两节填充——版本/更新 ∥ 接入卡（§2.1）；i18n 叠加 +1 = 文案键化；二轮 +≈90 = 向量卡 ∥ 健康块）**⇒ 实读 172（2026-10-07——配额批零动）⇒ ≈178（me-keys 批：接入卡件导出/参数化 +≈6——admin 面行为零改）** | 系统页 |
| `thincoder-server/public/views-usage.mjs`（已落盘） | **无 ⇒ 139**（实读 2026-10-06——设计估 ≈170；全队用量：过滤（+端点） ∥ 报表（概览卡 ∥ CSS 柱趋势 ∥ 聚合/排行两表） ∥ 导出（blob 下载） ∥ 明细表——§2.3②）；实读 139（2026-10-07——本批零动：看板页不入壳） | 管理·用量看板 |
| `thincoder-server/public/views-overview.mjs`（已落盘） | **无 ⇒ 74**（实读 2026-10-06——设计估 ≈100；总览卡集六枚（今日/成员/健康/更新/快捷入口）——§2.3③）；实读 74（2026-10-07——本批零动）**±0（me 用量图表化批：`statCard` 导出〔1 词改——函数体零改 ∥ 行数零增〕；实读 74——2026-10-07 本批落地后，±0 保持）** | 管理·总览 |
| `thincoder-server/public/views-audit.mjs`（已落盘） | **无 ⇒ 88**（实读 2026-10-06——设计估 ≈100；审计列表：过滤三轴 ∥ 按型模板渲染 ∥ 空态——§2.3④）**⇒ ≈96（本批 +≈8 = 壳化）⇒ 实读 91 ⇒ 90 ⇒ 实读 91（2026-10-07）**（配额 v2 批落地：双标题收正——h3 删净（#995），±0） | 管理·审计 |
| `thincoder-server/public/views-models.mjs`（已落盘） | **77 ⇒ ≈235**（实读 2026-10-06——弹窗批实施后；本批 +≈158 = 配置四组（A/C/D/E） ∥ 草稿/保存/取消 ∥ 停用流 ∥ 快照接入 ∥ 校验/格式化；§2.4③）**⇒ 实读 194（2026-10-07——配置面批落地后）⇒ ≈202（本批 +≈8 = 壳化）⇒ 实读 199 ⇒ ≈218**（配额批：F 组（输入 ∥ 提示 ∥ 非负整数规则）+≈19）**⇒ 实读 207 ⇒ ≈216 ⇒ 实读 216（2026-10-07）**（配额 v2 批落地：列表配额列（列头 ∥ 取值三态 ∥ tfoot 列数随动）+9） | 服务模型页（列表 + 详情/配置） |
| `thincoder-server/public/model-specs-snapshot.mjs`（已落盘） | **≈80**（设计估——展示元数据快照（context ∥ maxOutput ∥ multimodal 子集——源 = 核 `model-specs.mjs` 快照） ∥ `specForDisplay(name)` 前缀查表纯函数；§2.4③）；实读 103（2026-10-07——本批零动） | 展示元数据快照 |
| `thincoder-server/public/modal.mjs`（已落盘） | **无 ⇒ 68**（实读 2026-10-06——设计估 ≈110；公共弹窗组件：`openModal`（`<dialog>` 基座 ∥ 单例 ∥ 遮罩/关闭/焦点） ∥ 复用 API；§2.4①）；实读 68（2026-10-07——本批零动） | 公共弹窗组件 |
| `thincoder-server/public/views.mjs`（迁移期引文——已退役拆档（2026-10-06）——档不在盘（原读数 244 · as-of）） | —— | —— |
| `thincoder-server/public/style.css`（已落盘） | **83**（实读 2026-10-06——设计估 ≈95；#962 侧栏/分组/活动态/窄屏；#963 +8 = 系统页样式（`.snippet` ∥ `.card h4` ∥ `.update-tip` ∥ `.end-list`/`.end-name`））**⇒ 89 ⇒ ≈122**（i18n 叠加 +6 = 切换器钮样式；二轮 +≈33 = 灯（三色点） ∥ 图（柱列/轴标） ∥ 卡集网格 ∥ 提示条）**⇒ ≈152**（弹窗批 +≈30 = 弹窗（遮罩 ∥ 头/体/脚 ∥ 滚动锁） ∥ 行点击 ∥ 详情栅格）**⇒ 139**（实读——弹窗批后）**⇒ ≈165**（本批 +≈26 = 配置组 ∥ 表单网格 ∥ 停用钮 ∥ 元数据行）**⇒ +≈25**（provider 重做批另计 = 工具条 ∥ 勾选段 ∥ 危险钮行）**⇒ ≈216**（样式族批估——+≈26 = `:root` 变量族 +≈20 ∥ 态面（悬停/聚焦/禁用/错态）+≈9 ∥ 死规则 −2；三批全落地后以实读为准）**⇒ 实读 198（2026-10-07——样式族批落地后）⇒ ≈222（本批 +≈24 = 高度链 ∥ 表槽 ∥ 吸附 ∥ 页脚 ∥ 回退媒体查询 ∥ `main` 撤 auto ∥ `.model-picks` 删）⇒ 实读 224（2026-10-07——配额批/配额 v2 批落地后；分模型表区/输入列宽复用为主）**⇒ ≈219（me-keys 批：`ul.key-list` 族删净 −5——零死类；实施实读为准）⇒ 实读 218 ⇒ ≈240（本批：堆叠段件 `.bar-stacked`/`.bar-seg`/`.bar-swatch` ∥ 切换 `.chart-toggle`（活动态） ∥ `.page-area` gap ∥ `.page-area > .card.report-card` ——+≈22；零新颜色变量 ∥ 零新悬停规则）⇒ 实读 228（2026-10-07——本批落地后；实际 +10——低于估 12）** | 系统字体 ∥ 表格/表单 ∥ 桌面优先（宽表横滚） |
| `thincoder-server/public/i18n.mjs`（已落盘） | **无 ⇒ 113**（实读 2026-10-06——设计估 ≈110；语言态 ∥ 检测/记忆 ∥ `t()` ∥ 切换器组件 ∥ `document` 接线；§2.2）**⇒ 实读 110（本设计轮——与历史读数 113 差 3：口径/旧修订差）⇒ ≈120 ⇒ 实读 137（2026-10-07）**（配额 v2 批落地：计数复数形（`Intl.PluralRules` 取形 ∥ 按语言缓存 ∥ `count` ∥ `tokens` 并集）+27——越估 17） | 多语言运行时 |
| `thincoder-server/public/i18n-zh.mjs`（已落盘） | **无 ⇒ 198 ⇒ 292 ⇒ 312**（实读——弹窗批后）**⇒ ≈311**（provider 重做批：≈+13 键 ∥ 退役 ≈14 键——净 ≈−1/表；§2.2）**⇒ ≈337**（配置面批净 ≈+26 键——§2.2）**⇒ 实读 328（2026-10-07）⇒ ≈334（本批 +6 键——§2.2）⇒ ≈344**（配额批 +≈10 键 ∥ 值改 1——§2.2）**⇒ 实读 345 ⇒ ≈345 ⇒ 实读 345（2026-10-07）**（配额 v2 批落地：+2 键 ∥ −2 死键——净 ±0）**⇒ ≈350（模型元数据批：+5 键）⇒ 实读 350（2026-10-07——清账批复读）⇒ 实读 352（2026-10-07——列式收正批落地后）**⇒ ≈374（me-keys 批：+25 键 ∥ −2 键 ∥ 改值 4——净 ≈+23；§2.2）⇒ 实读 375 ⇒ ≈382（本批：+8 键 ∥ −1 键——§2.2）⇒ 实读 382（2026-10-07——本批落地后）** | 文案表·中文 |
| `thincoder-server/public/i18n-en.mjs`（已落盘） | **无 ⇒ 194 ⇒ 288 ⇒ 308**（实读——弹窗批后）**⇒ ≈307**（同步——§2.2；零 CJK 断言 = §6）**⇒ ≈333**（配置面批净 ≈+26 键——§2.2）**⇒ 实读 324（2026-10-07）⇒ ≈330（本批 +6 键——§2.2）⇒ ≈340**（配额批 +≈10 键——§2.2）**⇒ 实读 341 ⇒ ≈348 ⇒ 实读 348（2026-10-07）**（配额 v2 批落地：+2 键 ∥ −2 死键 ∥ +7 `.one` 变体）**⇒ ≈353（模型元数据批：+5 键）⇒ 实读 353（2026-10-07——清账批复读）⇒ 实读 355（2026-10-07——列式收正批落地后）**⇒ ≈377（me-keys 批：净 ≈+23——§2.2 同步）⇒ 实读 378 ⇒ ≈385（本批：+8 键 ∥ −1 键——§2.2）⇒ 实读 385（2026-10-07——本批落地后）** | 文案表·English |
| **小计** | **≈680 ⇒ 558 ⇒ 943**（#962 实读）**⇒ 1006**（#963 实读：+63 = views-system +44 ∥ app +10 ∥ nav +1 ∥ style +8）**⇒ 1545**（i18n 实读：+539 = i18n 三档 +505 = 113 + 198 + 194 ∥ app +21 ∥ views-auth +2 ∥ views-me +1 ∥ views-admin +2 ∥ views-providers +1 ∥ views-system +1 ∥ style +6；nav ±0）**⇒ ≈2247**（二轮估：+≈702 = 新三档 ≈370 ∥ app +35 ∥ nav +12 ∥ views-me +35 ∥ views-admin −49 ∥ views-system +90 ∥ style +35 ∥ i18n 两表 +174）**⇒ ≈2646**（弹窗批估：+≈399 = modal 新 ≈110 ∥ views-models 新 ≈110 ∥ views-admin +≈110 ∥ style +≈30 ∥ i18n 两表 +≈34 ∥ nav +≈3 ∥ app +≈2）**⇒ ≈2840**（provider 重做批估：+≈195 = 弹窗体新 ≈260 ∥ 页面 214 ⇒ ≈110 ∥ style +≈25 ∥ i18n 两表 ≈−2（净 ≈−1/表）；app/nav ±0）**⇒ ≈3154**（服务模型配置面批估：+≈314 = views-models **77 ⇒ ≈235** ∥ model-specs-snapshot 新 ≈80 ∥ style +≈26 ∥ i18n 两表 +≈50；modal/app/nav ±0）**⇒ ≈3180**（样式族批估：style +≈26 ∥ 余档 ±0——类串微改行数零变；批内件另计）**⇒ 3000（实读 2026-10-07——全表实读和 = public 19 档 2922 + `static.mjs` 78）⇒ ≈3112（布局批估 +≈112）⇒ ≈3233（配额分模型批估 +≈121 = views-admin +≈70 ∥ views-models +≈19 ∥ views-me +≈4 ∥ app +≈3 ∥ i18n 两表 +≈20 ∥ style +≈5；modal/nav/快照等零动）⇒ 实读 3170（本设计轮——public 19 档 3092 + `static.mjs` 78；配额批落地后）⇒ ≈3245（配额 v2 批 +≈75 = views-admin +≈50 ∥ views-models +≈9 ∥ views-audit −1 ∥ i18n-zh ±0 ∥ i18n-en +7 ∥ i18n.mjs +≈10；app/modal/style 零动）⇒ **实读 3269（2026-10-07——配额 v2 批落地后；public 19 档 3191 + `static.mjs` 78；+99——越估 ≈24）**⇒ ≈3290**（模型元数据批 +≈45 = 视图件 +≈35 ∥ i18n 两表 +5/+5；以 v2 落定实读为基）**⇒ 实读 3345（2026-10-07——模型元数据批落地后；Δ+76 = views-providers-modals +65 ∥ i18n 两表 +5/+6）⇒ 实读 3350（2026-10-07——列式收正批落地后；public 19 档 3272 + `static.mjs` 78；上链 3345 复算 = 3344——差 1 在案）**⇒ ≈3505（me-keys 批 +≈155 = views-me +85 ∥ app +25 ∥ views-system +6 ∥ i18n 两表 +44 ∥ style −5；零新档——档目 19 ∥ 20 不变）⇒ ≈3626（me 用量图表化批 +≈121 = views-me +≈85 ∥ style +≈22 ∥ i18n 两表 +≈14 ∥ views-overview ±0；零新档——档目 19 ∥ 20 不变）⇒ 实读 3619（2026-10-07——本批落地后；public 19 档 3541 + `static.mjs` 78；对链上 ≈3626 差 7——me-keys ∥ 本批实读累计估差收口）** | —— |

## 6. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 前端自洽 | `public/**` 零外部引用（无 `http(s)://` 外链 ∥ 无 CDN ∥ 无外链字体——扫描断言，扫描面 = 全量新档）；静态直发 mime 正确 ∥ 路径穿越拒；档目断言随正（口径 = UI 代码档 12 ∥ 含 favicon 全目录 13——`-webui-deploy` 件；i18n 批后基线 ⇒ 15 ∥ 16（二轮批后）⇒ 17 ∥ 18（弹窗批后）⇒ **18 ∥ 19**（provider 重做批后）⇒ **19 ∥ 20**（配置面批后——+ `model-specs-snapshot.mjs`）） | 批内件 |
| AC-11（控制台 provider 面——判据全文 = `gateway/API.md` §5 AC-11 行） | `#/admin/providers` 页在册（列表 ∥ 增/改/删（弹窗面——§2.4④） ∥ 发现/勾选（详情弹窗——候选 = 上游发现） ∥ 测试（同窗） ∥ 预设快速添加（添加弹窗））；端点契约 = `gateway/API.md` §2.2；密钥掩码回显（不回明文）；发现失败 = 提示 + 重试（**无手填**——用户 21:36 裁定；服务端 502 语义零改） | 批内件 |
| AC-12（功能点 14——控制台 IA；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `nav.mjs` 直测：组/项结构（我的 3 ∥ 管理 6（二轮批后）⇒ **7**（弹窗批后——§2） ∥ admin 组仅 admin） ∥ 重定向（`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview`） ∥ 角色默认 ∥ admin 面 `denied`；静态档目随正（二轮批后 15 ∥ 16 ⇒ 弹窗批后 17 ∥ 18 ⇒ provider 重做批后 **18 ∥ 19** ⇒ 配置面批后 **19 ∥ 20**）∥ 管理页拆分（成员/用量/总览/审计/服务模型各一页——单页堆叠消失） | 批内件 |
| AC-13③④（功能点 12——版本/更新可见 ∥ 成员接入卡；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `#/admin/system` 四节在册（版本/更新 ∥ 接入卡 + 二轮 向量服务 ∥ 服务健康——§2.1）；meta 槽版本（`/api/system`）；更新提示接 `latest`（更新提示 = admin 面 ∥ 版本行 = 全角色——角色面收窄在案）；接入卡含 baseURL（运行时 origin） ∥ 四端示例 ∥ curl；零外部引用断言随正（不增档）；`nav.mjs` 结构直测不破 | 批内件 |
| AC-14（功能点 13——控制台多语言；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 检测（记忆优先 ∥ `zh*`/`en*` 首命中 ∥ 无匹配 ⇒ zh——`pickLang` 直测）∥ 两表键集相等（双向——除自称名族 `lang.zh` ∥ `lang.en`：固定取 zh 表）∥ i18n 三档 CJK 口径（zh 表 = 唯一 CJK 档 ∥ `i18n.mjs` 与 en 表零 CJK）∥ 各表全键非空 ∥ 前端 JS 代码档「注释外零 CJK 字面量」（排除 `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ `index.html`；`index.html` 两处静态 CJK = 装配前缺省——豁免在案）∥ 键引用闭合（`t` 字面量 ⊆ 表键——含 `nav.mjs` `labelKey` 面）∥ 错误映射（可达码全键 ∥ `Retry-After` 注入 ∥ 未知码原文兜底）∥ 三新档静态直发 200（`text/javascript`）∥ 档目随正（i18n 批后 12 ∥ 13 ⇒ 二轮批后 15 ∥ 16 ⇒ 弹窗批后 17 ∥ 18 ⇒ provider 重做批后 **18 ∥ 19** ⇒ 配置面批后 **19 ∥ 20**） | 批内件 + 收口轮（浏览器两语言实走） |
| AC-15（功能点 15——控制台可见面六面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 向量卡（配置真值行 ∥ 试跑回维度+耗时 ∥ 失败分类文案 ∥ 用户面提示条（模型名——零地址））+ endpoint 列/过滤（两用量页控件）；② 看板（概览卡 ∥ CSS 柱趋势 ∥ 聚合/排行两表 ∥ 导出 blob 下载——与 `/api/usage` 同一过滤面（数据源 = 预聚合日表；日对齐窗逐值相等——口径 = `metering/METERING.md` §4）∥ 空态无错）；③ 总览（admin 落 `#/admin/overview` ∥ `#/admin` 重定向同指 ∥ 卡集六枚 ∥ user 不可达）；④ 审计页（过滤三轴 ∥ 列 ∥ 类型文案 ∥ 空态）；⑤ 灯（`nav-health` 三态 ∥ 30s 轮询 ∥ 停服红/恢复绿——收口轮浏览器实走）；⑥ key 表（六列——名称/API Key/签发时间/最后使用/近 30 天/操作；最后使用 ∥ 近 30 天 = 真值 ∥ 从未使用文案；多把并存——§2.3⑥）；i18n 两表键集相等（新增 ≈87 键——en 零 CJK ∥ 占位符一致）∥ 静态档目随正（二轮批后 15 ∥ 16 ⇒ 弹窗批后 17 ∥ 18 ⇒ provider 重做批后 **18 ∥ 19** ⇒ 配置面批后 **19 ∥ 20**）∥ `nav.mjs` 直测（管理 7（弹窗批后） ∥ 重定向收正 ∥ 默认页收正） | 批内件 + 收口轮 |
| AC-16（功能点 16——控制台弹窗交互；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `modal.mjs` 在册（零依赖 ∥ `<dialog>` 基座——遮罩/ESC/焦点/单例 ∥ 复用 API ∥ 模块顶层零浏览器全局）；成员页行点击 ⇒ 三态弹窗（查看/编辑/新建——设额度 ∥ 重置密码 ∥ 逐 key 吊销全在窗内 ∥ 保存/取消 = 编辑态）；一次性秘密不破（新建 ∥ 重置 ⇒ 关窗 + 页级回显——仅一次）；静态档目随正（弹窗批后 17 ∥ 18 ⇒ provider 重做批后 18 ∥ 19 ⇒ 配置面批后 **19 ∥ 20**）∥ i18n 两表新键同步（en 零 CJK） | 批内件 + 收口轮（浏览器实走） |
| AC-17（功能点 17——服务模型页 ∥ 配置面 A/C/D/E；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 列表 = 开放清单同源派生（`providers` 展平 + `embedding.model` ∥ 全量 ∥ 配额列（AC-23②） ∥ 空态 ∥ admin 面；与 `/v1/models` 之差 = 成员禁用滤除（成员面——`gateway/API.md` §2.1）；**零上游探针**——渲染路径零 discover 调用）；② 详情弹窗复用 `modal.mjs`——配置五组在册：A 开放状态（「停用」confirm ⇒ PATCH `models` 减项 ⇒ `/v1/models` 随动 + 派发 404 + 行离列；**退役（不在发现集仍开放）同口径可停**）；C 限流（RPM/TPM 输入——空 = 不限；PATCH `settings`）；D 元数据（快照查表：上下文 ∥ 最大输出 ∥ 多模态；未知 ⇒「未收录」；说明 ≤200 字符）；E 权重（输入/输出）；F 配额（`quotaTokens`——≥0 整数；空 = 不限——判据 = AC-21 行）；保存/取消（草稿 = C/E/D/F 说明；取消 = 弃稿） | 批内件 + 收口轮（浏览器实走） |
| AC-17（续） | C 机检：超限 ⇒ 429 `rate_limited` + `Retry-After`（保存即热生效；窗滚恢复；非法 ⇒ 400 库与运行时零变）∥ `settings` 线形机检（值 = 全字段对象——部分字段保存 ⇒ 其余字段保留；单字段清空 = 显式 `null` 不误伤）∥ D 未知零兜底 ∥ E「内部估算参考——非计费」注在册 ∥ 与 Provider 页协同（单源 `models`——停后其只读注不含）∥ i18n 两表新键同步（en 零 CJK ∥ 占位符一致 ∥ `err.rate_limited` 入映射集）∥ 档目随正（+ `model-specs-snapshot.mjs`——19 ∥ 20）∥ `nav.mjs` 直测（管理 7 ∥ 路径在册） | 批内件 + 收口轮 |
| AC-18（功能点 18——Provider 管理面重做；已落需求档） | nav 值 =「Provider」（两表）∥ 页面直测：列表 + 添加钮 + 行点击 ⇒ 详情弹窗 + 零内联添加面 ∥ 添加弹窗两径 ∥ 详情弹窗 = 信息段 + 勾选列表（候选 = 上游发现；零手填；退役项只读注）∥ 错误径（发现失败 ⇒ 段内提示 +「刷新候选」重试可达候选 ∥ 失败态保存不丢现配置——草稿无损；预设拉取失败 ⇒ 提示 + 自定义径照常）∥ 勾选保存 ⇒ PATCH `models` = 勾选集 ∥ 测试同窗 ∥ 热生效（PATCH ⇒ `/v1/models`——API 级复跑；真机 = 收口轮）∥ 档目 18 ∥ 19 ⇒ 配置面批后 **19 ∥ 20** | 批内件 + 收口轮 |
| AC-19（功能点 19——样式族总体统一；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | §2.5 在册：口径五条 ∥ 散置/不一致清单（改前实读——S1–S17） ∥ 变量族底座（`:root` 单源——色/间距/圆角/字排/线宽/布局） ∥ 族值表 + 逐族套用表（①列表 ②按钮 ③表单 ④间距 ⑤字排 ⑥色板 ⑦卡片 ⑧弹窗内构 ⑨空错态 ⑩码面——含 #87/#88 新面「随其落地套用」） ∥ 可点行/不可点行判据 ∥ 空/错/加载态 | 批内件 + 收口轮 |
| AC-19（续·机检口径） | `thincoder-server/public/style.css`：`:root` 块外零颜色字面量（hex/rgba） ∥ 行悬停声明清单（`.nav-item:hover` ∥ `tbody tr:hover`——同取 `var(--hover)`；清单外零行悬停声明；`li.key-item:hover` 随 ul 清单退役删净——me-keys 批） ∥ padding/margin/gap 取值 ∈ `--sp-*` ∪ {0, auto} ∪ 布局组变量（`--nav-w`——S15 ∥ 底座布局行；尺寸类白名单除外） ∥ `font-weight` 全 ≤400 ∥ `font-size` 全 = `var(--fs)`（缺省撤销） ∥ 聚焦环单形（`--bw-strong solid var(--accent)`） ∥ 类名双向闭合（档面字面类 ⊆ `style.css` 类选择器 ∥ `style.css` 类选择器 ⊆ 档面字面类 ∪ 态类）；视觉收口轮浏览器实走（悬停/聚焦/空·错·加载态/弹窗/两语言） | 批内件 + 收口轮 |
| AC-20（功能点 20——控制台布局收正；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 视口高壳在册：壳面五页钉表（成员 `#/admin/members` ∥ Provider `#/admin/providers` ∥ 服务模型 `#/admin/models` ∥ 审计 `#/admin/audit` ∥ 用量明细 `#/me/usage`——§2.6①）；页头固定 ∥ 表头吸附 ∥ 行区滚动 ∥ 表尾行计数（tfoot——吸附表底；声明表 = §2.6②）∥ 矮视口回退整页滚 ∥ ② 表尾行计数在册（表内 tfoot「共 N 项」= 渲染行数真值——空/错 = 无表无 tfoot；纯前端派生 ∥ 零新端点） ∥ ③ 内容左对齐（`main` 无 auto 居中——`max-width` 沿用） ∥ ④ 弹窗内列表 = 表格形（Provider 勾选 ∥ 预设信息段模型清单 ∥ 成员 key 表——§2.6⑤）；排除面在册（`#/admin/usage` 看板页 ∥ 布局/信息表 ∥ key 表页级（非壳——§2.6① me-keys 批在案）） | 批内件 + 收口轮（浏览器实走） |
| AC-20（续·机检口径） | 批内件腿：`app.mjs`——`dataShell` 在册（`.page-head`/`.page-area` 两段）+ 表尾计数在册（`table(…, { foot: true })` 与三自建构建器 tfoot 同形 + `common.rowCount` 引用） ∥ `SHELL_PAGES` 五路径逐条钉表 ∥ `route()` 切换 `data-shell`（登录/登出径清除） ∥ 五页逐档 `dataShell(` 调用 + 表内 tfoot 计数（成功 = 行数 ∥ 空/错 = 无表） ∥ `style.css`——高度链声明表逐条在册 ∥ `position: sticky` + `top: 0`（表头）∥ `bottom: 0`（tfoot）在册 ∥ 回退媒体查询在册（`height: auto`） ∥ `main` 规则 margin 无 `auto` ∥ 弹窗三处表格形（结构/列头/空错态不变量——含勾选表 `label` 形） ∥ `.model-picks` 零残留（规则与字面两向） ∥ AC-19 canon 不破（零新 `:root` 变量 ∥ 零新悬停规则 ∥ 内距 ∈ 刻度 ∥ 类名双向闭合） ∥ 档目 19 ∥ 20 不变 ∥ 门禁清单添本批件（十七 ⇒ 十八——以实施盘面为准） ∥ 旧件随正：stub ctx 补 `dataShell` 三件 + 门禁计数两件 | 批内件 + 收口轮 |
| AC-21（功能点 21——配额配置面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 服务模型页配置弹窗 F 组（`quotaTokens` 输入——空 = 不限；保存 = PATCH settings 单键全对象——含 quotaTokens；非法 ⇒ 就地提示不提交 ∥ 服务端 400）∥ ② 成员弹窗分模型覆盖（**编辑态** = 全 chat 模型行（`deriveModels` 序）+ 平台默认列 ∥ providers 取数（失败 ⇒ 窗内状态行 + 重试）∥ 保存 = POST `model-quotas` 键级合并（空 = null 删键）∥ 不在清单键保留（注行）；查看态面 = AC-23①）∥ 覆盖键形校验（首斜杠两段非空——裸名键 ⇒ 400；#1001②）∥ 覆盖计数显示（`fmtModelQuotas`：0 ⇒「按平台」——列表列 ∥ 弹窗 ∥ 我的页三处同源）∥ i18n 两表新键同步（en 零 CJK ∥ 占位符一致）；旧总框面零残留（`fmtQuota` 退役——若余消费实读为界） | 批内件 + 收口轮（浏览器实走） |
| AC-23（功能点 23——成员模型面 v2；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 成员弹窗查看态：进窗即惰性拉 providers（失败 ⇒ 窗内状态行 + 重试）⇒ 模型表直显（全 chat 模型行（`deriveModels` 序）：模型 ∥ 每月用量（覆盖 ∥ 未设 ⇒「按平台」）∥ 平台默认（未设 ⇒「不限」）∥ 本月已用（`memberView.modelUsage`——自然月 ∥ 缺 ⇒ 0）∥ 禁用勾选）∥ 离表覆盖键注行（保留——恒不触碰）∥ 编辑态零改（§2.4②）∥ ② 服务模型页列表配额列（`settings[上游].quotaTokens`——未设 ⇒「不限」 ∥ 嵌入行「—」——与 F 组单源） ∥ ③ 禁用勾选即时写（`POST …/model-disables` 单键合并 ∥ 在飞禁用 ∥ 失败 ⇒ 回弹 + 窗内状态行）∥ 表下提示键在册（§2.4②） | 批内件 + 收口轮（浏览器实走） |
| AC-23（续·机检口径） | `views-admin.mjs`——进窗 providers 取数（查看 ∥ 编辑两态共用）+ 查看态表构建器（5 列逐头在场 ∥ 行 = `deriveModels` 序 ∥ 注行键引用）∥ 禁用 handler（`model-disables` POST ∥ 回弹 ∥ 在飞禁用）∥ `views-models.mjs` 配额列（列头 + 取值三态）∥ `views-audit.mjs` 单标题（`audit.title` 引用一次 ∥ h3 无）∥ i18n 键存在性（新 2 键两表 ∥ 死键 2 枚零残留 ∥ `.one` 变体 7 枚仅 en ∥ 基键集相等）∥ 复数形直测（en count=1 ⇒ 单形 ∥ 2 ⇒ 基 ∥ zh 不变）∥ views-admin 越 300 在册（拆分预案在）∥ 档目 19 ∥ 20 不变 ∥ 零新 `:root` 变量 ∥ 零新悬停规则（AC-19 canon 不破） | 批内件 |
| AC-24（功能点 24——上游模型元数据留存与展示；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 详情弹窗候选行富信息 = **列式表五列**（模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态——首格 = 勾选 + 名；缺则空、零占位）∥ 上游退役提示（`status` ⇒ 状态格 + 注行——**只提示**：勾选/保存/派发零涉）∥ 候选段加载态（#984——在飞 `.hint` + 钮禁用）∥ 数据面 = discover `modelMeta` ∪ 存储（逐字段——发现优先） ∥ 键族 7（两表同步——en 零 CJK；`metaContext` 零残留） ∥ 零新样式类/变量（AC-19 canon 不破） ∥ 档目 19 ∥ 20 不变 | 批内件 + 收口轮（浏览器实走） |
| AC-24（续·机检口径） | `views-providers-modals.mjs`——列式表构建器（五列表头逐格在场 ∥ 首格 `label`（勾选 + 模型名）∥ 缺项零输出） ∥ `fmtTokens` 直测（1048576⇒1M ∥ 262144⇒262k ∥ 8192⇒8k） ∥ 加载态分支（在飞 ⇒ 加载文案 + 钮 `disabled`；完成/失败 ⇒ 转场） ∥ 退役注行构建（「模型 (状态)」清单） ∥ 保存线形（`modelMeta` 空图 ⇒ 省略；非空 ⇒ 随携——求交回归） ∥ i18n 键族 7 键两表在场（`metaContext` 零残留） ∥ `style.css` 零动（`:root`/悬停/类名闭合不破） | 批内件 |
| AC-25（功能点 25——「我的·key 与签发」页重做；已落需求档） | ① 多把并存（签发 ⇒ 新把在场 ∥ 旧把照常可用；吊销 ⇒ 即断；他人 key 操作 ⇒ 404——端点契约判据 = `accounts/ACCOUNTS.md` §5 AC-25 行） ∥ ② 命名（签发携名落库 ∥ 表列显 ∥ 空名默认 `key-N`） ∥ ③ 表六列（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作——签发时间 = 新暴露字段 `createdAt`） ∥ ④ 弹窗化（签发/吊销 = `modal.mjs`——吊销后果文案在场 ∧ 页面零 `window.confirm`）+ 复制钮（`showSecret`——三秘密面随动） ∥ ⑤ 接入卡成员面（baseURL ∥ curl ∥ 四端——与 admin 接入卡同源复用） ∥ ⑥ 「提示形」零残留（页面文案与两表值） + 空态引导（含「签发新 API Key」指引）；页面非壳（§2.6① 排除面在册） | 批内件 + 收口轮（浏览器实走） |
| AC-25（续·机检口径） | `views-me.mjs`——六列表头逐键在场 ∥ 行 = key 行映射（名称/提示形/签发时间/最后使用/近 30 天/吊销钮） ∥ 空态分支 ↺ 两弹窗 = `openModal` 调用（签发：名称输入 + 提交路径 `/api/me/keys/issue`；吊销：后果文案键引用 + 提交路径含 keyId） ∥ 页面零 `window.confirm`（档面扫描） ∥ `showSecret` 复制钮 + 三路回退（`navigator.clipboard` stub 直测三路） ∥ 接入卡成员面 = `accessCard` 导出复用（admin 面行断言回归——零改） ∥ i18n：新 25 键两表同步（en 零 CJK ∥ 占位符一致）∥ 死键 `me.keys.rotate`/`rotateConfirm` 零残留 ∥ 改值键列内形（`lastUsed`/`windowTokens`）∥ `style.css` 类名双向闭合（`key-list`/`key-item`/`key-meta` 零残留）+ 行悬停清单 = 2 条（`li.key-item:hover` 删净——AC-19 续行同拍）∥ 档目 19 ∥ 20 不变（零新档）；迁移 v8 判据 = `store/STORE.md` §3 | 批内件 |
| AC-26（功能点 26——「我的·用量」页图表化；候补——需求档落点 = 主 agent） | ① 页形在册（概览卡行（本月已用 ∥ 分模型配额）∥ 筛选行四控件（时间维度三档 ∥ 端点 ∥ 模型 ∥ 清除）∥ KPI 行（请求数 ∥ tokens+拆分注）∥ 主图（按日堆叠柱——维度切换 端点/模型 两态）∥ 分模型区（逐模型 请求数 ∥ tokens ∥ 本月已用）∥ 明细表（现件 + tfoot）——§2.3⑦） ∥ ② 零依赖（堆叠柱 = 纯 CSS 件——`.bar-stacked`/`.bar-seg`；零新库 ∥ 零外部引用扫描不破） ∥ ③ 数据面（`/api/me/usage/summary` + `/api/me/usage` 同过滤面同拍；`memberView.modelUsage` 消费（分模型「本月已用」列——缺 = 0）） ∥ ④ 壳面不破（`SHELL_PAGES` 五路径不动；高度链 +2 行在册（§2.6②）；报表卡上限自滚（明细卡恒得剩余高）+ 明细卡承缩（表槽自滚 + tfoot 计数在册）；矮视口回退既有口径） ∥ ⑤ i18n（新 8 键两表同步 ∥ `me.usage.summary` 退役零残留——§2.2） ∥ ⑥ 空/错态（全零窗 ⇒ KPI 0 + 主图 `usageReport.trendEmpty` ∥ 分模型空 ⇒ `usage.empty` ∥ 失败 ⇒ `.hint error` 两区——零错） ∥ ⑦ 导出 = 不设（判否——§2.3⑦）；admin CSV 零动 ∥ ⑧ 段色 = `--accent` 透明度阶梯（零新颜色变量）；弹窗/原生 `confirm` 零涉 | 批内件 + 收口轮（浏览器实走） |
| AC-26（续·机检口径） | `views-me.mjs`：`renderMeUsage` 结构（概览卡 2 枚 ∥ 筛选控件 4（select×2 + input + 钮）∥ KPI 2 枚 ∥ `.chart-toggle` 两钮 + `.bar-seg` 段容器 ∥ 分模型表五列 ∥ 明细 = `usageTable(rows, { withMember: false, foot: true })`）∥ 两跳取数（`Promise.all`——`/api/me/usage/summary` + `/api/me/usage`）∥ 三档窗换算（近 7/30/本月 ⇒ `from` ms）∥ 维度切换 = 本地重画（零重取） ∥ `views-overview.mjs`：`statCard` 导出在场 ∥ `style.css`：`.bar-stacked`/`.bar-seg`/`.bar-swatch`/`.chart-toggle` 在册 ∥ `.page-area` gap + `.page-area > .card.report-card`（`flex: none` + 上限自滚——§2.6②）在册（表随正） ∥ AC-19 canon（类名双向闭合 ∥ `:root` 零新颜色字面量 ∥ 悬停规则零新 ∥ 内距 ∈ 刻度） ∥ i18n 键集（+8 ∥ −1；两表同步 ∥ en 零 CJK） ∥ 档目 19 ∥ 20 不变（零新档） ∥ 旧件随正 = `2026-10-07-console-layout.test.mjs`（me 页用例：路由桩补 summary ∥ 页头断言改点） | 批内件 |

## 7. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-9 | **控制台前端 = vanilla 静态面**（`public/` 静态档组——`node:http` 直发）；零框架 ∥ 零构建 ∥ 零外部资源；哈希路由（IA = §2 ∥ KD-SV-20）；判权全在后端 | 用户 08:09 钉死（先例 = 本仓 webview vanilla 口径）；静态档零依赖贴合内网自洽；视图交互维护性 | 单文件内嵌 HTML（视图/表单增长后难维护）· 前端框架（违零依赖/零构建）· CDN ∥ 外链字体（内网不达）· 构建步骤（bundler——违零构建） |
| KD-SV-20 | **控制台 IA = 侧栏分组导航 + 一页一职责**：组 = 我的（key/用量/账户设置）∥ 管理（总览/成员/**Provider**/服务模型/用量统计/审计/系统）；hash 路由 `#/<组>/<页>`；旧链重定向；解析 = `nav.mjs` 纯函数；窄屏降级顶条 | 用户 16:13 令（单页堆叠被判不专业）；侧栏 = 分组扩展面（系统/文案/后续协同面挂点）；纯函数解析 = 机检可达；零框架零构建不变（KD-SV-9） | 顶栏分区（横向空间有限——中英文案翻倍更挤 ∥ 分组层级浅）· 不重排（被用户否）· 框架路由（违 KD-SV-9）· 服务端路径路由（静态直发面破——hash 保刷新/书签） |
| KD-SV-26 | **控制台多语言 = 前端静态双表 + 浏览器语言自动检测 + 显式切换（`localStorage` 记忆）+ 错误码前端映射**（服务端零改；缺省 zh；两语 = 中文 ∥ English） | 零依赖零构建下最简可达（静态 ESM 原生取载——无打包器 ∥ 无 fetch 一跳）∥ 页面壳零数据口径保持（无 SSR 面）∥ `code` 面既有——映射零新契约 ∥ 文案表 node 直测可达；自动 + 显式两全（英文浏览器首屏即英文 ∥ 中文用户想切即切） | 后端下发文案（新端点 + 协商面——零收益）· 第三方 i18n 库（违零依赖）· cookie 记忆（无 SSR 面——零收益）· 双语字段（30+ 抛出点双语维护 ∥ 上游透传面无处双语）· 仅自动检测（无显式切换）· 仅切换器（首屏语言不明） |
| KD-SV-29 | **可见面二轮 = 服务端聚合/代发 + 零依赖前端**：总览落 `#/admin/overview`（admin 默认页；`#/admin` 重定向同指）；图表 = 纯 CSS 柱（零依赖零构建——KD-SV-9 不变）；健康 = 前端三态轮询（30s——共享态 + `ctx.onHealth` 订阅）；导出 = 服务端 CSV（前端 blob 下载）；key 细节 = `memberView` 单源扩展 | 图表库/框架组件被否（违 KD-SV-9 零框架零构建）；健康并入 `/api/system` 轮询被否（探活语义单源 = `/healthz`——KD-SV-23）；服务端出图被否（新增图片/HTML 面——无谓）；独立排行组件被否（聚合降序即排行——两套视图徒增重复） | 图表库 ∥ 构建步骤（零依赖纪律）· 整页轮询（重渲闪烁）· 移动端适配（不做承诺不变） |
| KD-SV-31 | **控制台弹窗 = 自持公共组件**（`modal.mjs`——原生 `<dialog>` + `showModal()` 基座；单例不叠加；关闭 = × ∥ ESC ∥ 句柄；遮罩点击不关（防误触）；焦点/背景 inert = 平台语义（收口轮核验）；零依赖零构建不变——KD-SV-9） | 用户 20:12 点名公共组件（后续铺开——组件化省重复）；原生 dialog 承担模态/焦点/ESC——自绘需重造同套语义 | 自绘遮罩组件（重造 ESC/焦点陷阱/inert——码量与缺陷面）· 各页自绘（用户点名否）· 非模态 `show()`（背景可交互——语义不符）· 第三方弹窗库（违零依赖） |
| KD-SV-32 | **服务模型页 = 派生视图（零新端点）+ 配置骨架先行**（列表 = `providers` 展平 + `embedding.model`——与 `/v1/models` 同源；配置候选上抛，未裁前不落字段；页 = admin 面） | 需求 §2:17——目录来源不改（provider 配置派生）；控制台无团队 key（不直连 `/v1/models`）；未裁字段不擅自定死 | 新端点 `GET /api/models`（复述性——现有数据面已足）· 用户角色可见（需两角色读端点——新服务端面，未裁）· 模型增删入口（目录归 provider 面） |

| KD-SV-33 | **Provider 管理面 = 列表 + 双弹窗（添加 ∥ 详情）**——零新端点（勾选集 = 服务集——PATCH `models` 全量数组单写）；候选 = 上游发现（无手填——用户 21:36 裁）；退役模型只读注 + 恒保留（A = 服务模型页自持——用户 21:40 裁）；添加流取形 VSC 面板 [+ Add]（核件步序语义）；单脚区保存 | 用户 21:35/21:36/21:40 令；复用 `modal.mjs`（KD-SV-31）；PATCH 单写天然覆盖批量勾选；写路径沿 POST 全字段 + 校验单源 | 批量勾选端点（无谓）· 手填模型 ∥ 候选 ∪ 现配置勾选（用户否——A 归服务模型页）· 保存后自动准入探针（不移植）· name/baseURL 独立编辑态（保存面分裂）· 详情纯展示（「改」回退） |
| KD-SV-34 | **服务模型配置面 = A/C/D/E 落字段**（用户 21:39/21:40 裁）：A 开放/停用——开放态 = `provider.models` 成员（单源）；停用 = 减项（confirm ⇒ 零重启随动 ⇒ 行离列）；**服务模型页 = 开放清单自持操作面**（退役模型同口径可停；零上游探针；重开 = Provider 页勾选）∥ C/E 设置 = `providers.settings_json`（v4）+ PATCH `settings` 键级合并（零新端点——机制 = KD-SV-35）∥ D = 展示元数据（自动行 = 核规格快照查表（零端点 ∥ 未知 ⇒「未收录」不套兜底）+ 手填「说明」≤200 字符）∥ E = 成本权重（输入/输出——**内部估算参考（非计费）**；估算消费面 = 后续轮） | 用户裁定 + 需求 §2:17；读 = GET 行扩字段 ∥ 写 = PATCH 扩字段（沿 KD-SV-19 库单源 + 保存即热生效）；A 归因 = 退役模型在 Provider 页无操作路径（用户 21:40）；D 快照沿 KD-SV-17 先例 | 本页承担重开（候选面需上游发现——Provider 页勾选已足）· 列表「已退役」标注 / 上游状态检查（零探针——退役可见性 = Provider 页发现面）· D 服务端端点（纯展示数据——零端点面）· D 直引核件（KD-SV-2）· E 单价/计费口径（对外计费边界）· `settings` 独立新表 + 新端点族（单列 + PATCH 已足） |

| KD-SV-36 | **控制台样式族 = 变量单源 + 一套刻度 + 系统基线对齐**（功能点 19——用户 22:00/22:01）：族目 = ①列表 ②按钮 ③表单 ④间距 ⑤字排 ⑥色板状态 ⑦卡片 ⑧弹窗 ⑨空错态 ⑩码面（勘误：新增 ⑩ ∥ 变量单源重定位为底座）；一字族 ∥ 一字号 13px ∥ 行距 1.5 ∥ 零粗体（强调 = 色通道）；悬停底同值（列表行/中性面——`--hover`） ∥ 可点行 = 三件套（指针/焦点环/键盘） ∥ 收束不重设计（骨架/类名沿用——死类删净 ∥ 零新档零动画） | 用户 22:00「hover 行的背景色会不一样，有的还没有」+ 22:01 扩裁；系统基线 = 用户 2026-09-30 排版裁定（`docs/desktop/requirements/UI.md` D29 同口径——一字族/一字号/无粗体·颜色区分）；需求 §2:19 | 保留多字号/字重（违系统基线）· 逐组件一次性样式（散置复现——无单源）· 新 CSS 档/框架（违 KD-SV-9 零依赖零构建）· 过渡动画（超收束范围）· 暗色主题（未裁）· 14px 单号（桌面值——控制台以表格密面为主，13px = 现盘主值） |
| KD-SV-37 | **控制台布局收正 = 数据表五页视口高壳 + 左对齐 + 弹窗列表表格化**（功能点 20）：壳面钉五页（`#/me/usage` 为「用量明细」= 我的·用量页；`#/admin/usage` 看板页排除——报表区无界）；两段壳（`.page-head`/`.page-area`）+ 高度链（`body.data-shell` ⇒ `100dvh` flex 链 ⇒ `.table-slot` ⇒ `.table-wrap` 滚区）+ `thead th` 吸附（限 `main`）；**表尾 tfoot「共 N 项」**（`common.rowCount`——吸附表底）；弹窗内表自滚（单滚动面伸缩链 §2.6⑤ + 表头吸附——2026-10-07 轻笔/走查收正）；回退 = ≤760px 宽 ∥ ≤600px 高 ⇒ 撤链整页滚；`main` 撤 auto；弹窗三列表 = 表格形（勾选表 = 列式五列——首格 `label`（勾选 + 模型名）；点题名同切换保持） | 用户 07:24–07:32 走查四条（需求 §2:20——父侧 07:4x 第五页裁定在案）；零新档 ∥ 零新端点 ∥ 零新变量（AC-19 canon 不破）；行计数纯前端派生 | 看板页入壳（报表区无界——不相容）· 每页自写壳结构（机制散置——违单源）· 全局冻结布局（非壳页受害）· grid/双列勾选表（丢点题名切换 ∥ 触旧件断言之形）· 分页（面外）· 服务端出计数（违背纯前端派生口径） |
| KD-SV-41 | **配额配置面 = 服务模型页 F 组 + 成员弹窗分模型覆盖**：F = settings `quotaTokens`（单键全对象提交——零新端点）；成员覆盖 = 查看态覆盖行表 ∥ 编辑态全 chat 模型行（平台默认列 ∥ 惰性拉 providers ∥ 失败窗内提示 + 重试）+ 键级合并提交（空 = null 删键——不在清单键恒保留）；列表/我的页 = 覆盖计数（`fmtModelQuotas`） | 需求 §2:21①②（用户 09:28——两落点点名：服务模型页 ∥ 成员弹窗）+ KD-SV-34（settings 复用）∥ KD-SV-31（弹窗复用）∥ 合并语义沿 settings 先例（部分保存不丢键）∥ 弹窗反馈定则（#986——失败/加载落窗内） | 新端点族（PATCH 键级已足）· 全量替换提交（不在清单键会被误删）· 集中配额页（背离用户点名落点）· 输入即存（误触面） |
| KD-SV-43 | **成员弹窗 = 模型表直显（查看态）+ 逐行已用**：查看态表 = 全 chat 模型行（`deriveModels` 序）：模型 ∥ 每月用量（覆盖 ∥「按平台」）∥ 平台默认（只读）∥ 本月已用（`memberView.modelUsage`——`quota_counters` 自然月 ∥ 与配额检查同源同窗）∥ 禁用勾选；providers 取数 = 进窗两态共用（沿编辑态机制）；离表覆盖键 = 注行保留；**口径勘明**：逐行已用 = 自然月（配额窗）；成员总额含嵌入行（现口径）；报表/key 窗 = 近 30 本地日——三窗各自单源（KD-SV-6 周期裁定） | 用户 11:16 走查（「模型列表……直接放进弹窗」+「已用应该显示在每行」）∥ 11:54 一字裁定「A」（读法 = 模型表进弹窗本体直显）∥ 数据面已备（`quota_counters`——缺 = 显示面 + API 字段）∥ 表与编辑态同形（一表两态——零新组件） | 查看态只列覆盖行（用户否——模型列表不可见）· 查看态零取数（不用 providers——行集不全；平台值不可见）· 已用用报表窗（近 30 天——与配额判据对不上，逐行「为什么超限」不可对账）· 离表键列表行（行集膨胀——注行已足） |
| KD-SV-44 | **i18n 计数复数形 = `Intl.PluralRules` + `.one` 变体族（仅 en）**：`t(key, {count} ∥ tokens)` ⇒ 取形选键（数字参任一触发）（`${key}.${form}` → `key`）；zh 无复数区分（`select` 恒 `other` ⇒ 零族）；键集口径 = 除自称名族 + `.one` 族 | #988（en `common.rowCount` count=1 ⇒「1 items」——「单复数未分形」直解 = 补形）∥ `Intl.PluralRules` = 零依赖内建（KD-SV-9 不破）∥ 机检可达（键集合/取形直测） | 中性句式改写（·「1 tokens」等同族仍在——无检查面）· 调用点三目（`t(count===1 ? keyOne : key)`——键族翻倍 ∥ zh 同键重复）· 全句重写（语义漂移面）· 第三方 i18n 库（违零依赖） |
| KD-SV-45 | **上游模型元数据 = 白名单留存 + 弹窗展示 + 退役提示（只提示）**：保留集 = 四字段（`displayName` ∥ `contextWindow` ∥ `vision` ∥ `status`——用途先行；未收录不采、缺就空着）；留存 = `providers.model_meta_json`（v7——保存携 `modelMeta`：过滤 + 求交；发现探针零落库）；展示 = 详情弹窗候选行（**列式五列**——首格 = 勾选 + 模型名；缺则空、零占位；数据 = 发现 ∪ 存储逐字段——发现优先）∥ 上游退役 = 状态格标 + 注行（**不自动停用**——停用入口 = 服务模型页自持面） | 用户 12:05/12:23 令 + 12:11 范围纪律（只取有用途字段 ∥ 不建机制 ∥ 缺就空着）；元数据 = 纯展示面（转发/派发/对外契约零涉）；存储最小形 = 单列扩展（v4 settings 同构先例） | 照单全存（用户否——噪声/无用途）· 元数据同步/校验/仲裁机制（用户否）· `/v1/models` 带出富字段（对外契约须论证+点名——未点火）· 自动停用（用户裁 = 只提示）· 服务模型页/成员页展示（各有批面）· 推理档位族入集（无展示/动作面——堆砌） |
| KD-SV-46 | **候选段在飞态 = 静态 `.hint` + 触发钮禁用**（#984）：加载文案 `candidatesLoading` ∥ 触发钮（`fetchBtn`/`refreshBtn`）在飞 `disabled` ∥ 完成/失败转场同既有分支 | #984（慢上游 ⇒ 静默等待）；⑨ 族 canon = 加载态 `.hint` 静态文案（零动画零 spinner——零新状态面）；按钮在飞禁用沿成员禁用勾选在飞禁用先例 | spinner/骨架屏（违零动画口径）· 整段占位替换（丢重试钮 ∥ 上下文）· 不动触发钮（双击重入面） |
| KD-SV-47 | **「我的·key 与签发」页 = 多把并存工作台**（功能点 25）：API Key 表六列（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作）+ 页首「签发新 API Key」（弹窗——名称可空）+ 行内「吊销」（弹窗——后果文案；零原生 `confirm`）+ 页级一次性秘密区（复制钮——`showSecret` 全局随动）+ 接入卡成员面（`accessCard` 同源复用——admin 面零改）+ 空态引导；**「轮换」页面下架**（端点保留——全断操作与逐把模型相抵；需求 ① 留否 = 否）；页面非壳（钉表五页不扩）∥ `ul.key-list` 族退役（死类删净） | 用户 16:06「太草率」+ 16:08「可以」+ 附加两令（名称 ∥ 多把）；多把模型 = 加一把/吊销一把（全换无位）；秘密面复用 `showSecret`（一处随动三处受益）；接入卡单源（防两卡漂移） | 轮换保留在页面（须弹窗 + 后果——误读面仍在；与逐把模型重复）· 原生 confirm（用户 2 令：后果明示须可见——非原生）· key 页入壳（钉表五页 = 功能点 20 已钉——扩表 = 另议）· ul 清单保留（表格化 = 功能点 25③）· 新档拆接入卡组件（档目计数连锁——导出复用已足） |
| KD-SV-49 | **「我的·用量」页 = 本人面轻量图表**（me 用量图表化批——用户 22:03 令）：页形 = §2.3⑦（概览卡 ∥ 筛选行四控件 ∥ KPI ∥ 按日堆叠柱主图（维度切换 = 端点/模型——零依赖柱件复用；段色 = `--accent` 透明度阶梯）∥ 分模型区（请求数 ∥ tokens ∥ 本月已用）∥ 明细表）；**导出不设**；壳面五页钉表维持（报表卡不承缩 + 明细承缩——高度链 +2 行）；管理面专属面收窄 = 跨成员过滤/排行 ∥ CSV 导出 ∥ 看板页 | 用户 22:03「单薄……更多的图表」；数据面本人过滤复用（`usageSummary({memberId})` 既有 + 新端点 = KD-SV-50）；零依赖柱件既有（KD-SV-29 机制不破）；零新档（档目 19 ∥ 20 不动） | 图表库/CDN（违 KD-SV-9）· 金额/余额族（无此面——`metering/METERING.md` §8）· 小时/周粒度（日/月两键为限）· 本人面导出（金额语境无对应 ∥ 放宽 admin 端点 = 翻 AC-15② 三态 ∥ 新端点无对应收益）· 前端拉明细自算（KD-SV-27 在案）· 出壳改自由滚动页（需求 §2:20 五页钉表在案——另轮如裁） |

## 8. 本域边界（不做的面）

- 独立客户端管理台（不做——需求 §4；管理面 = 内嵌网页）∥ 前端框架 ∥ 构建步骤 ∥ CDN/外部资源 ∥ 移动端适配（桌面优先——窄屏不做承诺）∥ 成员面接入卡（接入成文 = README；系统页卡 = admin 面——§2.1）∥ 文档面多语言（README 等——另议）∥ 服务端消息/日志语言（机器面——错误映射 = §2.2）∥ 第三语言（加语言 = 表档 + 检测行增量）。
- 二轮不做面：图表库（趋势 = 纯 CSS 柱——KD-SV-29）∥ 告警推送（健康 = 可见灯 + 页内块——推送归外部）∥ 引擎起停（手动——需求 §4）∥ 总览图表（总览 = 数值卡）∥ key 管理表增列（二轮不加——`memberView` 数据已在）。
- 弹窗批不做面：其他页弹窗迁移（按需后随——需求 §2:16）∥ 弹窗叠加/嵌套/拖拽/动画 ∥ 遮罩点击关闭 ∥ 成员改名/改角色/删除 ∥ 模型增删（归 provider 面）∥ 服务模型页用户角色可见面（需两角色端点——未裁）。
- Provider 重做批不做面：手填模型（用户 21:36 裁定——两弹窗皆无）∥ 批量勾选端点（PATCH `models` 单写已足）∥ 保存后自动准入探针（VSC M9 不移植）∥ name/baseURL 独立编辑态 ∥ 预设表写路径（仍 POST 全字段——校验不豁免）∥ 退役模型在 Provider 面的停用（= 服务模型页自持面——A；用户 21:40 裁）。
- 服务模型配置面批不做面：上游状态检查 /「已退役」列表标注（零探针口径——退役可见性 = Provider 页发现面）∥ 并发/连接数限流（C = RPM/TPM 速率限）∥ 嵌入引擎模型行配置（= 系统页 · 向量服务卡）∥ 模型设置手工种子面（控制台单一面）∥ 模型设置版本史/回滚（行即现值）∥ 对外计费语义（E = 内部估算参考——估算消费面 = 后续轮）。
- 样式族批不做面：版式/结构重设计（骨架沿用——卡片/表格/侧栏/弹窗结构零动）∥ 类名体系改名（沿用——仅删死类 ∥ 新增 `.error` 态修饰）∥ 动画/过渡（零——保持零依赖零动画）∥ 主题化/暗色（不做——未裁）∥ 自绘控件（checkbox 等原生 + `accent-color`）∥ 移动端适配（不做承诺不变——窄屏单条媒体查询保持）。
- 布局收正批不做面：`#/admin/usage` 看板页入壳（报表区无界——另轮如需）∥ 布局/信息表与 key 清单（页级）壳化 ∥ 弹窗内表吸附/分页/筛选 ∥ 分页/虚拟滚动 ∥ 主题化/暗色（不变）。
- 配额分模型批不做面：分模型已用列（未点名——数据面已备，如需即加）∥ 配额阈值告警（需求 §4 暂缓不变）∥ 配额集中配置页（落点 = 用户点名两处）∥ 成员总量额度（退役——被三级取代）。
- 配额 v2 · 成员模型面批不做面：弹窗机制面（`thincoder-server/public/app.mjs` 路由 ∥ `modal.mjs`——行数红线）∥ 结构轮（#993 `app.mjs` 拆分 ∥ #976 i18n 拆表）∥ Provider 面 ∥ 离表计数键逐行列示 ∥ 禁用草稿/批量保存 ∥ 嵌入行禁用（嵌入面零涉）∥ 分模型已用历史/趋势（面外）。
- Provider 模型元数据批不做面：元数据同步/校验/仲裁机制（用户 12:11 裁）∥ 自动停用/自动勾选（退役 = 只提示）∥ 保留集外字段（推理档位/视频/输出上限等）∥ `/v1/models` 对外元数据带出（须论证 + 点名） ∥ 服务模型页/成员页展示面（各有批面）∥ 元数据参与转发/计费；弹窗机制面（`app.mjs`/`modal.mjs`）与结构轮（#993/#976）不在本批。
- me-keys 批不做面：轮换按钮回页面（下架——端点保留）∥ 改名/排序/搜索（名称 = 签发时标签——签发后只读）∥ key 用量明细/趋势（面外——`#/me/usage` 已有）∥ admin 面 key 表加列（名称不进管理表——另议）∥ 壳化/分页/筛选（§2.6① 排除面）∥ 独立「key 详情」弹窗（行即全信息）∥ 成员面接入卡的 README 成文删改（README 仍为成文面）；`#/me/keys` 独立加载态（数据随 `/api/me` 同拍——无独立拉取）。
- me 用量图表化批不做面：成本/金额/余额（`metering/METERING.md` §8 不变）∥ 小时/周粒度（日/月两键为限）∥ 图表库（零依赖手绘——KD-SV-29 机制不破）∥ 本人面导出（判否——§2.3⑦）∥ key 维度过滤（数据面无此轴）∥ 数字千分位（站内口径不引）∥ 模型 top-N 归并（全模型分段——色阶下限在案）∥ 总览/管理面零改 ∥ 出壳/自由滚动版式（壳面五页钉表维持——另轮如裁）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——webui 域：静态面 ∥ 三视图 ∥ 判权/自托管约束；KD-SV-9。
- 2026-10-06：fix 轮（评审轮次 1 #1）——管理视图数据源句补记：成员表行含各成员 key 清单（提示形 + id——`GET /api/members` 行内；契约 = `accounts/ACCOUNTS.md` §3）。
- 2026-10-06：实施后回填轮（fix）——§1 JS 行与 §5 行数按实读回填（小计 ≈680 ⇒ 558；管理视图未出档）。
- 2026-10-06：控制台 provider/模型管理 + IA 设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ §2:14 ∥ 台账 #962/#966）——§1 静态面九档重排（`views.mjs` 退役拆档）∥ §2 重写为「控制台 IA 与视图」（侧栏分组 ∥ 七页 ∥ 旧链重定向 ∥ `nav.mjs` 纯函数 ∥ 窄屏降级 ∥ 首版完备化/多语言面挂点）∥ §3/§4 随正 ∥ §5 预算（小计 558 ⇒ ≈1009）∥ §6 判据补 AC-11/AC-12 行 ∥ §7 增 KD-SV-20（KD-SV-9 行随正：计数句去「三视图」）∥ §8 增多语言留白句。
- 2026-10-06：fix 轮（评审轮次 1 五条——批 `docs/batches/2026-10-06-console-providers.md` §3）：#1 §2 provider 页行/§6 AC-11 行补预设列表端点 ∥ #2 §6 AC-12 行标记收正（已落需求档）∥ #3 §6 前端自洽行档目口径统一（UI 代码档 9 ∥ 含 favicon 全目录 10）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12③④ ∥ 台账 #963）——§1 视图档句随正 ∥ §2 系统页行/导航渲染句（meta 槽）随正 ∥ §2.1 增（系统页两节 ∥ meta 槽 ∥ 接入卡 ∥ 文案口径）∥ §5 预算（views-system ⇒ ≈130 ∥ app ⇒ ≈200 ∥ nav ⇒ ≈75 ∥ style ⇒ ≈115；小计 ≈1144）∥ §6 补 AC-13③④ 候补行 ∥ §8 边界补成员面卡句；数据面 = `gateway/API.md` §2.3 ∥ 更新状态 = `ops/OPS.md` §5.4(g)/KD-SV-24。
- 2026-10-06：控制台多语言设计轮（批 `docs/batches/2026-10-06-server-i18n.md`——需求 §2:13 ∥ 台账 #965）——§1 JS 档句（十档）∥ §2 文案面句重写 ∥ §2.1 文案句收编 ∥ 增 §2.2（多语言机制：检测/切换器/文案表/错误映射/覆盖/边界）∥ §5 预算（i18n 三档拟新增；小计 ≈1144 ⇒ ≈1774）∥ §6 补 AC-14 候补行 + 档目口径随正（12 ∥ 13）∥ §7 增 KD-SV-26 ∥ §8 边界随正（留白句已设计化；文档面/服务端语言/第三语言入册）。
- 2026-10-06：fix 轮（评审轮次 1 #1——批 `docs/batches/2026-10-06-first-release-completeness.md` §3）：§2.1 补角色面注句（更新提示 = admin 面 ∥ 版本行 = 全角色——`requirements/PROJECT.md` §2:12③ 按可动作方收窄在案）∥ §6 AC-13③④ 行同拍。
- 2026-10-06：fix 轮（评审轮次 1 #1/#2/#7——批 `docs/batches/2026-10-06-server-i18n.md` §3）：§2.2 增「可测性」条（`i18n.mjs` 模块顶层零浏览器全局——检测输入参数注入）∥ 增「零 CJK 机检口径」条（扫描面 = 前端 JS 代码档——排除 `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ `index.html`；三档口径；`index.html` 两处静态 CJK = 装配前缺省豁免）∥ 切换器条补自称名规则（`lang.zh`/`lang.en` 固定取 zh 表）∥ 文案表形条补键集口径（除自称名族）∥ §6 AC-14 行同拍。
- 2026-10-06：AC-13③④/AC-14 行候补标记收正（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：实施后回填轮（R14——批 `docs/batches/2026-10-06-console-providers.md`）：§5 九档实读收正（小计 558 ⇒ **943**）∥ `views.mjs` 行改退役形（迁移期引文——原读数 244 · as-of）∥ 叠加链同拍（#963/i18n 结果值随 re-base——增量 +135/+630 不动）。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§5 四档实读收正（views-system **59** ∥ app **219** ∥ nav **82** ∥ style **83**；小计 ⇒ **1006**；i18n 叠加链随正）∥ §2.1 接入卡字段收正（`apiKey`）。
- 2026-10-06：实施后回填轮（R18——批 `docs/batches/2026-10-06-server-i18n.md`）：§5 i18n 三档实读翻正（**113** ∥ **198** ∥ **194**）∥ 接线增量实读（app +21 ∥ nav ±0 ∥ views-auth +2 ∥ views-me +1 ∥ views-admin +2 ∥ views-providers +1 ∥ views-system +1 ∥ style +6）∥ 小计 ⇒ **1545**（叠加链随正）∥ §2.2「拟新增」标记随正。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 视图档句重写（+3 档）/ JS 档数（十三档）∥ §2 表增总览/审计两页 + 默认页收正（admin ⇒ `#/admin/overview`）+ 旧链重定向同指 + key/用量/系统行随正 ∥ §2.1 重写（四节：+ 向量服务卡 ∥ 服务健康块；meta 槽 + 状态灯）∥ §2.2 覆盖范围随正 + 新增键族句（≈87 键——拆表断点）∥ 增 §2.3（六面机制：向量/看板/总览/审计/健康/key 细节）∥ §3 判权句随正 ∥ §5 预算（新三档 ∥ 逐档增量；小计 ⇒ ≈2247）∥ §6 补 AC-15 行 + AC-12/AC-13 行随正 ∥ §7 增 KD-SV-29 ∥ §8 边界随正。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：KD-SV-20 管理列举补「总览/审计」∥ AC-12 行删残留（原「管理 4」语句随正）∥ 档目行补「本批后 ⇒ 15 ∥ 16」注（§6 三处口径对齐——12/13 = i18n 后基线）。
- 2026-10-06：控制台弹窗批设计轮（批 `docs/batches/2026-10-06-console-modals.md`——需求 §2:16 ∥ §2:17 ∥ 台账 #973/#974）——§1 视图档句/JS 档数（十五档）随正 ∥ §2 表增服务模型页 + 成员行随正 ∥ §2.2 覆盖（十页）+ 本批键族（≈17 键）+ 表体量句（拆表登记）∥ §2.3⑥ 管理表列面注随正 ∥ 增 §2.4（弹窗机制 ∥ 成员弹窗三态 ∥ 服务模型页）∥ §5 预算（新两档 ∥ 逐档增量；小计 ⇒ ≈2646）∥ §6 补 AC-16/AC-17 行 + AC-12/AC-14/AC-15 行随正（17 ∥ 18 ∥ 管理 7）∥ §7 增 KD-SV-31/32 ∥ §8 边界随正；KD-SV-20 十页。
- 2026-10-06：fix 轮（评审轮次 1 第 2/6 项——批 `docs/batches/2026-10-06-console-modals.md` §3）：§5 六处实读收正（`app.mjs` **299** ⇒ ≈301 ∥ `i18n-zh.mjs` **292** ⇒ ≈309 ∥ `i18n-en.mjs` **288** ⇒ ≈305 ∥ `nav.mjs` **87** ⇒ ≈90 ∥ `style.css` **≈122** ⇒ ≈152 ∥ `views-admin.mjs` **≈100** ⇒ ≈210）+ `app.mjs` 越 300 软线拆分预案 ∥ §2.2 表体量句（双表——≈309 ∥ ≈305）∥ §2.4① 机制名删（策略句保留）。
- 2026-10-06：Provider 管理面重做设计轮（批 `docs/batches/2026-10-06-console-provider-redo.md`——需求 §2:18 ∥ 台账 #980；裁定 21:36 无手填 ∥ 21:40 A 保留服务模型页）——§1 视图档句/JS 档数（十六档）随正 ∥ §2 providers 行重写 ∥ §2.2 键族登记（改值 2 ∥ 新增 ≈13 ∥ 退役 ≈14；表体量 ⇒ ≈311 ∥ ≈307）∥ §2.4 标题 + ④（列表 + 双弹窗 ∥ 勾选机制 ∥ 退役生命周期 ∥ 发现失败径）∥ §5 预算（拆分两档 + style/i18n 增量；小计 ⇒ ≈2840）∥ §6 AC-18 行 + AC-11 行随正 + 档目 18 ∥ 19 五处随正 ∥ §7 增 KD-SV-33 ∥ §8 边界随正；机制全文 = §2.4④。
- 2026-10-06：服务模型配置面设计轮（批 `docs/batches/2026-10-06-models-config.md`——需求 §2:17 ∥ 台账 #981；裁定 21:39「ACDE」∥ 21:40「A 保留」）——§1 静态面（+ `model-specs-snapshot.mjs`；JS 十七档；触面「拟新增」标记随实读收正五处）∥ §2.2 映射集扩 `rate_limited` + 键族登记（净 ≈+26 键）∥ §2.4③ 重写（配置四组 ∥ 停用流 ∥ 退役语义 ∥ 零探针 ∥ 保存/取消 ∥ 与 Provider 页协同）∥ §5 预算（views-models **77 ⇒ ≈235** ∥ 快照新 ≈80 ∥ i18n/style 增量；小计 ⇒ ≈3154）∥ §6 AC-17 行重写（+续行）+ 档目 18 ∥ 19 ⇒ **19 ∥ 20** 五处随正 ∥ §7 增 KD-SV-34 ∥ §8 边界随正；机制全文 = §2.4③；KD-SV-35 = `gateway/API.md` §6。
- 2026-10-06：样式族统一设计轮（批 `docs/batches/2026-10-06-console-list-style.md`——需求 §2:19 ∥ 台账 #982；用户 22:00/22:01）——§2.5 新增（口径五条 ∥ 散置/不一致清单 S1–S17 ∥ 变量族底座 ∥ 族值表 + 逐族套用表 ①–⑩（勘误：+ 码面族 ∥ 变量单源重定位为底座） ∥ 可点行判据 ∥ 空/错/加载态 ∥ #87/#88 接续标注） ∥ §5 预算（style ⇒ ≈216 三批叠加口径；小计 ⇒ ≈3180） ∥ §6 补 AC-19 两行 ∥ §7 增 KD-SV-36 ∥ §8 边界随正；机制全文 = §2.5。
- 2026-10-06：fix 轮（评审 #94——批 `docs/batches/2026-10-06-console-provider-redo.md` §3 九条；本档面）：§6 AC-18 行补错误径（发现失败 ⇒ 提示 +「刷新候选」重试可达候选 ∥ 失败态保存草稿无损；预设拉取失败 ⇒ 提示 + 自定义径照常）∥ §2.4④ 删「收正项」残留 +「测试连接」补 discover 复用句 + 旧表单族类随双弹窗复用（零死类）∥ §2.5 接续标注同句 ∥ §5/§2.2 i18n 净增量口径统一（净 ≈−1/表）∥ §6 删空行回归单表块。
- 2026-10-06：fix 轮（评审 #95——批 `docs/batches/2026-10-06-models-config.md` §3；本档面）：§2.2 映射集改述（可达码 + 预留——`rate_limited` 仅 /v1 面产生）∥ §2.4③ 保存线形明写（键 = 上游名 ∥ 值 = 全字段对象；草稿初值 = GET 行）∥ §5 四档实读收正（拟新增 ⇒ 已落盘：views-usage **139** ∥ views-overview **74** ∥ views-audit **88** ∥ modal **68**）∥ §5 两处「本批」改批名（二轮——views-me/views-system 行）∥ §6 AC-17（续）补 settings 线形机检。
- 2026-10-06：fix 轮（评审 #96——批 `docs/batches/2026-10-06-console-list-style.md` §3 七条；本档面）：§1 行标句收正（越线在册）∥ §2.5 口径④/S1/① 表/⑨ 表/实施面收正（悬停清单制 ∥ ul 清单行纳入 ∥ 系统页诊断失败面补列）∥ §5 三档实读收正（views-me **117** ∥ views-admin **169** ∥ views-system **168**）∥ §6 AC-19 续机检口径同拍 ∥ §7 KD-SV-36 悬停句收正。
- 2026-10-07：布局收正设计轮（批 `docs/batches/2026-10-07-console-layout.md`——需求 §2:20 ∥ 台账 #985）——§2 增壳指针句 ∥ §2.2 键族登记（+5 键） ∥ §2.4②④ 表格形指针 ∥ §2.5 三处随正（`.model-picks` 退役等） ∥ 增 §2.6（机制全文——五页钉表 ∥ 高度链 ∥ 页脚计数 ∥ 回退 ∥ 左对齐 ∥ 弹窗表格形） ∥ §5 预算实读回填 + 本批增量 ∥ §6 补 AC-20 两行 ∥ §7 增 KD-SV-37 ∥ §8 边界随正。
- 2026-10-07：fix 轮（评审 #112——批 `docs/batches/2026-10-07-console-layout.md` §3 四条；本档面）：§5 `app.mjs` 行补「本批不触发拆分」理由 + 重估时点 ∥ §2.2 补登 `admin.members.colActions`（本批 6 键）∥ §2.6⑤ 同拍 ∥ §1 越线三值随 §5 实读收正 ∥ §2.6② 增两条挂载前提（弹窗 ∥ 壳）。
- 2026-10-07：轻笔（用户 08:26「你是不会用tfoot吗？」——批 `docs/batches/2026-10-07-console-tfoot.md`）：§2.6② 三段壳 ⇒ **两段壳** + 高度链表 `.page-foot` 行 ⇒ `body.data-shell main tfoot td`（吸附表底） ∥ §2.6③ 表尾行计数（tfoot——空/错 = 无表无 tfoot） ∥ §6 AC-20 两行同拍（页脚行计数 ⇒ 表尾行计数）。
- 2026-10-07：走查续笔（用户 08:34「弹窗里主细表是一起滚动的」+「provider 的模型列表连顺序都不排」——同轮）：§2.6⑤ 补「**清单序 = 名称升序**」（候选 ∥ 预设清单）+「**弹窗内表自滚**」（`.modal-body .table-wrap` 上限 40vh + 表头吸附——主信息不随动）。
- 2026-10-07：走查续笔二（用户 08:45「出了内外两道垂直滚动条」——40vh 上限行与 `.modal-body` 自身滚并存所致）：§2.6⑤ 弹窗自滚改**伸缩链**（单滚动面——固定块 `flex: none` ∥ 清单区 `min-height: 0` 自滚；外层仅极端兜底）——取代 40vh 上限。
- 2026-10-07：滞账收正（评审 #116 半程信号 + 本笔自纠——滞账四处同拍）：§7 KD-SV-37（:439）「三段壳/`.page-foot`/页脚」「弹窗内吸附（面外）」⇒ 两段壳 + 表内 tfoot + 弹窗自滚带表头吸附；§2.5 :207/:293 与 §2.6② :350「弹窗内表不吸附」⇒ 同拍收正。
- 2026-10-07：**实测修正**（用户 08:53「把表格的滚动给干掉了」——链未接通所致）：伸缩链漏「内容盒」层（`.modal-body > .stack-models` 选择器命不中——真结构 = `.modal-body > div > .stack-models`，`modal.mjs:36` 整只 append 调用层盒）；Edge headless 同构试验台红→绿（V0 复现现场：体滚/表不滚；修正后：表滚/体不滚/短内容贴合——探针在 `.thincoder/tmp`）⇒ §2.6⑤ 选择器全链下钻一层 + `modal-body > div` 承链。
- 2026-10-07：走查收正三（用户 08:58「在弹窗里点测试连接，结果在弹窗外面显示了响应」）：§2.4④ 详情弹窗「测试连接」结果 = 同窗结果行（`testNote`——进行中/成功/失败段内；失败走 `mapError`；原 flash 在弹窗外——AC-18「测试同窗」的落实收正）；随正件 = `-console-provider-redo.test.mjs:443`（断言从 flash 改同窗行 + 零 flash）。
- 2026-10-07：走查收正四（承三 + 父侧常识定则——**弹窗开着 ⇒ 一切反馈落窗内；窗关 ⇒ 页面 flash**）：§2.4④ 两窗同拍——获取模型（空地址/失败 ⇒ 窗内状态行；成功 flash 删——候选即反馈）∥ 保存（未选类型/失败 ⇒ 窗内；401 仍踢登录）∥ 刷新候选 flash 删；窗关后动作 flash 保持。随正件 = `-console-provider-redo.test.mjs` 四处 + `-console-list-style.test.mjs` ④ 计数 12。
- 2026-10-07：修正轮（评审 #119——批 `docs/batches/2026-10-07-console-tfoot.md` §1 补记七；本档面）：「≤40vh」残留三处（:207/:293/:440）⇒「单滚动面伸缩链（§2.6⑤）」∥ §2.5⑨ 错误面坐标四处收正（`views-admin.mjs:45` ∥ `views-me.mjs:67` ∥ `views-models.mjs:79` ∥ `views-providers.mjs:35`）∥ §2.4③ 列表序 = `id` 升序（`views-models.mjs:26`）。
- 2026-10-07：行宽收正（父侧机械折行——§2.6⑤ 363 字符行 ⇒ 折两行；doc-check 行宽闸读数）。**零语义**。
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）——§2 IA 三行随正（成员/服务模型/我的用量）∥ §2.2 键族登记（改值 1 ∥ 新增 ≈10）∥ §2.4② 重写（成员弹窗：分模型覆盖面两态 ∥ 覆盖计数列 ∥ 键级合并提交）∥ §2.4③ 增 F 组（配置区四组 ⇒ 五组；嵌入行注同拍）∥ §5 预算（views-admin 185 ⇒ ≈255 ∥ views-models 199 ⇒ ≈218 ∥ views-me 122 ⇒ ≈126 ∥ app 317 ⇒ ≈320 ∥ i18n 两表 ⇒ ≈344/≈340 ∥ style 223 ⇒ ≈228；小计 ⇒ ≈3165）∥ §6 增 AC-21 行 + AC-17 行随正 ∥ §7 增 KD-SV-41 ∥ §8 边界随正；机制全文 = §2.4②/③；存储/检查 = `store/STORE.md` §2 v5 段 ∥ `metering/METERING.md` §2。
- 2026-10-07：fix 轮（评审 #126——批 `docs/batches/2026-10-07-quota-per-model.md` §3 十项，本档面）：§5 小计复算收正（public 19 档和 **2854 ⇒ 2922**——改前漏计 `modal.mjs` 68；全表 **2932 ⇒ 3000** ∥ 两估随正 ≈3044 ⇒ ≈3112 ∥ ≈3165 ⇒ ≈3233）∥ §6 AC-15 行看板句与 `metering/METERING.md` §4 同拍（同一过滤面；日对齐窗逐值相等）∥ §6 AC-17 行「配置四组」⇒「配置五组」（计数随列举）。
- 2026-10-07：配额 v2 · 成员模型面批设计轮（批 `docs/batches/2026-10-07-quota-v2-member-models.md`——需求 §2:23 ∥ 台账 #1002/#1003/#1004 + 并入 #1001/#994/#995/#988）——§2 两行随正（成员/服务模型）∥ §2.2 增计数复数形（KD-SV-44）+ 键族登记（+2 ∥ −2 ∥ `.one` 7）∥ §2.4② 重写（查看态模型表直显 5 列 ∥ 禁用勾选即时写；编辑态/刷新口径/不做随正）∥ §2.4③ 列表配额列 + 同源口径句 ∥ §5 六行实读回基 + 小计 ⇒ ≈3245（实读 3170）∥ §6 AC-21 ② 重写 + AC-17 ① 随正 + 增 AC-23 两行 ∥ §7 增 KD-SV-43/44 ∥ §8 边界随正；机制全文 = §2.4②（控制台面）∥ `accounts/ACCOUNTS.md` §2.2（禁用）∥ `gateway/API.md` §2.1（执行）。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-quota-v2-member-models.md` §3 六发现，本档面）：§6 AC-23 行「候补」标记收正（已落需求档——沿 AC-13/AC-14 先例）∥ §1 越线清单随 §5 实读链收正（`app.mjs` 实读 317 ⇒ ≈320 ∥ i18n 双表 实读 345 ⇒ ≈345 ∥ 341 ⇒ ≈348）+ 补 `views-admin.mjs` 越线条目（行宽守界折行）∥ §5 `views-providers-modals.mjs` 读数链收正（实读 272 ⇒ 300——盘面复核；小计 3170 零随动）∥ §2.4② 注行补离表禁用键口径句（计 N ∥ 列示 ∥ 恢复路径——消歧；裁据 = `accounts/ACCOUNTS.md` §7 B26）。
- 2026-10-07：Provider 模型元数据批设计轮（批 `docs/batches/2026-10-07-provider-model-metadata.md`——台账 #1005 + 并入 #984；用户 12:05/12:23 令）——§1 越线清单随 §5 收正（i18n 双表 ⇒ ≈350/≈353 + 补 `views-providers-modals.mjs` 越线条目）∥ §2.2 键族登记（+5 键）∥ §2.4④ 勾选段重写（候选行富信息 ∥ 上游退役提示 ∥ 加载态 ∥ 保存线形；添加弹窗探针同拍）∥ §2.6⑤ 行形句随正 ∥ §5 预算（视图件 300 ⇒ ≈335 越线在册 + 拆分预案细化 ∥ i18n 两表 ∥ 小计 ⇒ ≈3290）∥ §6 增 AC-24 两行 ∥ §7 增 KD-SV-45/46 ∥ §8 边界随正；机制全文 = §2.4④（展示面）∥ `gateway/API.md` §2.2（数据面）。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-provider-model-metadata.md` §3 九发现，本档面）：§2.4④ 保存线补合并优先级（**发现值优先 ∥ 存储补齐**——与显示线同源措辞）+ 添加窗写线明写携 `modelMeta`（探针所得；无探针 ⇒ 省略键）∥ §6 AC-24 行「候补」标记收正（已落需求档——沿 AC-13/AC-14 先例）。
- 2026-10-07：文档清账批（fix 轮——承批档 `docs/batches/2026-10-07-doc-cleanup.md` §2 · 台账 #983）：§5 触面实读收正 +「拟新增」标记随正（`views-providers` **61** ∥ `views-providers-modals` **365** ∥ `model-specs-snapshot` **103** ∥ i18n 两表 **350 ∥ 353**）∥ §2.2 键族登记补清账批复读（行 350 ∥ 353；键 **306 ∥ 311**）。**零语义**。
- 2026-10-07：Provider 候选表列式收正（收口链第一段·设计档形式化——轻通道笔 #1 已成事实入档；批 `docs/batches/2026-10-07-provider-picks-columns.md` · 台账 #1020；用户 15:15「列」令）：§2.4④ 勾选段/候选行富信息收正为**列式**（五列 = 模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态——首格 `label`；缺则空、零占位） ∥ §2.6⑤ 行形句随正 ∥ §2.2 键族登记重排（净 7 键——+3 列头键 ∥ 删死键 `metaContext` ∥ `metaVision` 转列头）∥ §5 三档实读回填（`views-providers-modals` 367 ∥ i18n 两表 352 ∥ 355）+ 小计 ⇒ 实读 3350 ∥ §6 AC-24 两行随正 ∥ §7 KD-SV-37/45 随正 ∥ §1 越线读数随正。
- 2026-10-07：弹窗宽度收正（收口链第二段·设计档形式化——轻通道笔 #2 已成事实入档；批 `docs/batches/2026-10-07-provider-picks-columns.md` · 台账 #1020；用户 15:24「弹窗宽度都检查一下」令）：§2.5 底座布局行收正（`--modal-w`＝`clamp(560px, 78vw, 1200px)`——视口比例三段式） ∥ §2.5 ⑧ 族 `.modal-body` 行随正（560 不再约束 ⇒ 桌面实际 = 70vh） ∥ 四窗几何（2560×1440：1200×464 ∥ 1200×570 ∥ 1200×929 ∥ 1200×173）；零新变量（AC-19 canon 不破）。
- 2026-10-07：弹窗内双表收缩链收正（收口链第一段·设计档形式化——轻通道笔 #1 已成事实入档；批 `docs/batches/2026-10-07-member-modal-tables.md` · 台账 #1022；用户 15:57 走查报「key 清单被压得看不见」令）：§2.6⑤ 直挂表区句收正为多表收缩口径（`style.css:177-178`——短表〔成员 key 表〕保自然全高（`min-height: min-content`）∥ 长表〔`.quota-table`〕承缩自滚 + 下限 `min-height: 140px` ≈ 三行——再挤 ⇒ 体滚兜底）∥ §2.5⑧ 弹窗内表格行随正（列 + 收缩链）∥ 红绿试验台 = `.thincoder/tmp/2026-10-07-member-keys-walk.mjs`（修前 key 表 h=187/226 切行 ⇒ 修后 h=226=natural ∥ 配额 504/655 自滚 ∥ 体无外滚；560 极端 = key 全高 ∥ 配额 140 触底 ∥ 体滚兜底）。
- 2026-10-07：me-keys 批设计轮（批 `docs/batches/2026-10-07-me-keys-redo.md`——需求 §2:25 ∥ 台账 #1023；用户 16:06 走查 + 16:08「可以」+ 附加两令）——§2 路由表 me/keys 行重写 ∥ §2.3⑥ 重写为「我的·key 与签发页重做」全文（六列密钥表 ∥ 双弹窗 ∥ 复制钮全局随动 ∥ 接入卡成员面同源复用 ∥ 轮换页面下架+端点保留 ∥ 非壳页口径）∥ §2.1 成员面落点句随正 ∥ §2.2 键族登记（+25 ∥ −2 ∥ 改值 4）∥ §2.5① ul 清单行 ⇒ key 表行 + 套用面随正 ∥ §2.6① 排除面句随正 ∥ §5 六行预算 + 小计 ⇒ ≈3505 ∥ §6 增 AC-25 两行 + AC-15⑥/AC-19 续/AC-20 行随正 ∥ §7 增 KD-SV-47 ∥ §8 边界随正；同源随动 = `accounts/ACCOUNTS.md`（端点/命名/上限）∥ `store/STORE.md` v8 段 ∥ `design/PROJECT.md` §4/§7。
- 2026-10-07：fix 轮（评审 #43——批 `docs/batches/2026-10-07-me-keys-redo.md` §3 七号落修；本档面 = #4/#7/#8）：§5 两表行净增口径收正（净 ≈+22 ⇒ **≈+23**——+25 ∥ −2；行数估不动，终值以实施实读为准）∥ §2.2 键族登记补「复用 1 键」条（`me.keys.neverUsed`——「从未使用」）+ §2.3⑥ 表句登记同拍 ∥ §2.5④ 悬停枚举删「ul 清单行」（随 ul 清单退役——与 AC-19 续「行悬停声明 = 2 条」同拍）。
- 2026-10-07：术语定音随正（用户 16:41「惯例都叫apikey」+ 16:43 取 B——批 `docs/batches/2026-10-07-me-keys-redo.md` §1.3 术语门）：me 页新文案实体名「密钥」⇒「API Key」（zh 保留英文原形 ∥ en = "API key"）——§2 路由行 ∥ §2.2 键族登记（改值 `me.keys.listTitle`/`me.keys.empty`）与词汇口径条 ∥ §2.3⑥（页形/表/空态/吊销流）∥ §6 AC-15⑥/AC-25 行 ∥ §7 KD-SV-47；既有四面（nav/管理/审计/接入卡）零触——统一 = 另笔（台账 #1025）。
- 2026-10-07：me 用量图表化批设计轮（批 `docs/batches/2026-10-07-me-usage-charts.md`——用户 22:03 令 ∥ 台账 #1055）——§2 路由行随正（`#/me/usage` = 本人用量看板）∥ §2.2 键族登记（+8 ∥ −1）∥ §2.3 增 ⑦「我的·用量页图表化」全文（页形 ∥ 元素对照表 ∥ 数据面 ∥ 导出判否 ∥ 不做单）∥ §2.5 新面登记 ∥ §2.6② 链 +2 行 ∥ §5 预算（views-me 实读 194 ⇒ ≈280 ∥ views-overview +1 ∥ style 实读 218 ⇒ ≈240 ∥ i18n 两表 375/378 ⇒ ≈382/≈385；小计 ⇒ ≈3630）∥ §6 增 AC-26 两行 ∥ §7 增 KD-SV-49 + KD-SV-29 否决栏随正（「我的用量页趋势/聚合」条目删——改判在 KD-SV-49）∥ §8 边界随正（二轮不做面条目删 + 本批不做面增）；同源随动 = `metering/METERING.md` §3/§4/§5/§6/§7/§8 ∥ `design/PROJECT.md` §4/§6/§7/§9。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-me-usage-charts.md` §3 八发现〔🟡1–3 ∥ 🔵4–8〕，本档面 = 🟡1–3 ∥ 🔵4/7/8）：§5 views-me 句收正为条件式（194+85≈279 未越——不拆为实；越线预案在册）+ 算术平（`views-overview` ±0 ∥ i18n 两表 +≈14 ∥ 小计 ≈3626）∥ §2.3⑦ 报表卡上限口径收正（上限 = 页区高 55% + 卡内自滚——明细卡恒得剩余高）+ 殿后行 × `endpoint` 过滤口径明写 ∥ §2.6② 链行同拍 ∥ §2.6① 排除面残留名随正（「我的用量摘要表」⇒「我的用量页报表卡·分模型表」）∥ §6 AC-26 两行随拍；同源随动 = `metering/METERING.md` §3/§4/§5 ∥ `design/PROJECT.md` §6/§9。
- 2026-10-07：轮 2 残余小收正（主 agent 直接执行 · 可 revert——评审轮次 2 残余 ①③）：§1 i18n 增量 +≈22 ⇒ **+≈23**（与 §5/:614 同拍）∥ §2.3 节题补后批面归属（⑥ 功能点 25 ∥ ⑦ 功能点 26）。
- 2026-10-07：实施后回填轮（me 用量图表化批——批 `docs/batches/2026-10-07-me-usage-charts.md`）：§5 五档实读收正（`views-me` **295**（估 ≈279——越估 16，软线内，拆分预案未触发） ∥ `style.css` **228**（估 ≈240——低于估 12） ∥ i18n 两表 **382 ∥ 385**（在估） ∥ `views-overview` **74**（±0 保持））+ 小计按实读平账（**3619** = public 19 档 3541 + `static.mjs` 78——对链上 ≈3626 差 7，累计估差收口）∥ §2.2 键族表体量实读收正 ∥ §2.5 新面登记补 `.bar-legend`（与实装清单同拍）；同源随动 = `metering/METERING.md` §5 ∥ `design/PROJECT.md` §6/§9。
