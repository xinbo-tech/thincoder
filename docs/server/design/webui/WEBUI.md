# Thincoder Server · 控制台前端（webui/WEBUI）

> 板块 = server ∥ 本档 = webui 域（页面路由 ∥ HTML ∥ 静态资源）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 本域回指 = `PROJECT.md` §7（非功能·前端自洽 = 本档 §6）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 静态面

- 落点 = `thincoder-server/public/`（已落盘；本批 IA 重排——§2）：`index.html`（壳——侧栏容器 + 挂载点 + 模块入口）∥ `app.mjs`（路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手）∥ `nav.mjs`（IA 单源——组/项数据 + 路由解析纯函数）∥ `style.css`。
- 视图档（按页分档——§2）：`views-auth.mjs`（登录）∥ `views-me.mjs`（我的三页）∥ `views-admin.mjs`（成员 ∥ 用量统计）∥ `views-providers.mjs`（Provider 与模型）∥ `views-system.mjs`（系统——版本/更新 ∥ 接入卡；§2.1）。
- 原 `views.mjs`（三视图单档）**退役拆档**——缘由 = 新页（provider ∥ IA 重排）叠加后单档将破 300 软线；拆分 = 按页归档（每档 ≤300）。
- 直发 = `thincoder-server/src/webui/static.mjs`（已落盘）：`node:http` 读发 `public/`——mime 表（`.mjs` ⇒ text/javascript） ∥ 防路径穿越 ∥ `Cache-Control: no-cache`（内部工具——改版即见）。
- 路由：`GET /` ⇒ `index.html`；其余静态档按名直发（同源）；`/v1/*` 与 `/api/*` 优先于静态面（分派 = `gateway/API.md` §1）。
- 形态钉死（用户 2026-10-06 08:09）：**零框架 ∥ 零构建 ∥ 零外部资源**（无 CDN ∥ 无外链字体——内网自洽）；先例 = 本仓 webview（`thincoder-vscode/webview/`）的 vanilla 口径。
- JS = 十档（`app.mjs` ≈230 ∥ `nav.mjs` ≈85 ∥ `views-*` 五档 ≈685 ∥ `i18n.mjs` ≈110 ∥ `i18n-zh.mjs` ≈220 ∥ `i18n-en.mjs` ≈220——各档 ≤300 软线内；逐档预算与叠加链 = §5）。

## 2. 控制台 IA 与视图（哈希路由——KD-SV-20）

- **形态（本批定稿——用户 16:13 令）**：**左侧栏**分组导航 + 内容区；hash 路由扩展为 `#/<组>/<页>`；一页一职责（原「管理」单页堆叠拆开——成员/用量分页）。

| 组 | 页（hash） | 职责 | 角色 |
|---|---|---|---|
| 我的 | `#/me/keys` | key 清单（提示形） ∥ 签发/轮换（新明文一次性区） | 全体 |
| 我的 | `#/me/usage` | 本月额度/已用摘要 + 本人用量明细 | 全体 |
| 我的 | `#/me/account` | 基本信息（展示名/用户名/角色）+ 自助改密 | 全体 |
| 管理 | `#/admin/members` | 建成员（初始密码一次性回显） ∥ 成员表（key 清单/吊销/设额度/重置） | admin |
| 管理 | `#/admin/providers` | provider 增删改 ∥ 模型发现/开放勾选 ∥ 测试/预设快速添加（数据源 = 预设列表端点——契约 = `gateway/API.md` §2.2） | admin |
| 管理 | `#/admin/usage` | 全队用量表（过滤查询） | admin |
| 管理 | `#/admin/system` | 版本与更新 ∥ 成员接入（填充 = §2.1——数据 = `/api/system`） | admin |

- 登录 = `#/login`（无侧栏——登录卡）；`#/` ∥ 未知 ⇒ 角色默认页（admin ⇒ `#/admin/members` ∥ user ⇒ `#/me/keys`）。
- **旧链迁移**：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/members`（重定向——旧书签可达）。
- **路由解析 = `nav.mjs` 纯函数**（`resolveRoute(path, role)`——无 DOM、批内件直测）：别名重定向 ∥ 角色默认 ∥ admin 面 `denied`（页面级「无权限」块——判据仍在服务端，§3）。
- **导航渲染**：侧栏 = 品牌 ∥ 组标题 + 项（活动态高亮）∥ 底部（meta 槽（版本——`/api/system`，全角色）+ 退出登录）；admin 组仅 admin 渲染。
- **窄屏**：`≤760px` 侧栏降级为顶条（单条媒体查询——非移动端适配承诺）。
- **文案面（多语言——`requirements/PROJECT.md` §2:13）**：全量文案单源 = 文案表（`i18n-zh.mjs` ∥ `i18n-en.mjs`）；`nav.mjs` 数据持 `labelKey`（键——非字面量）；页档/助手经 `t()` 取值——机制全文 = §2.2。
- 数据全经 `/api/*`（契约 = `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3 ∥ `gateway/API.md` §2.2）；`GET /` 公开（页面壳零数据）。

### 2.1 系统页与 meta 槽（版本/更新 ∥ 成员接入——本批填充）

- **meta 槽**（侧栏底部——全角色）：版本一行（`GET /api/system`——启动装配时取一次；失败 ⇒ 留空静默）。
- **`#/admin/system` 两节**：
  - **版本与更新**：当前版本 ∥ 更新档位（`mode`：`false`/`notify`/`auto`）∥ 最近自检（`lastCheckAt`——本地化时间；`null` = 未检）∥ 更新提示（`latest` 在场 ⇒ 「有新版本可用：vX.Y.Z（升级见部署文档）」；不在场 ⇒ 「未发现新版本」——自检失败同面，静默口径 = `gateway/API.md` §2.3）。
  - **成员接入卡**：baseURL（`location.origin` + `/v1`——运行时装配）∥ 团队 key 提示（`sk-tc-…` 形——签发 = `#/me/keys`）∥ 四端示例（CLI ∥ VSC ∥ 桌面 ∥ 其他 OpenAI 兼容——字段 = name/baseURL/model/key；model = `provider/model` 形）∥ curl 冒烟一行（`GET /v1/models`）。
- 落点：本卡 = admin 面（供分发给成员）；成员面成文 = README「成员接入」节；文案 = 多语言表键引用（§2.2——本卡各件同表收编）；渲染沿 `h`/`textContent`（零拼串）。

### 2.2 多语言（中文 ∥ English——需求 §2:13）

- **形态**：两语 = `zh` ∥ `en`；运行时 = `i18n.mjs`（拟新增）；文案表 = `i18n-zh.mjs` ∥ `i18n-en.mjs`（拟新增）；静态 ESM 浏览器原生 import 取载（**零构建**——无打包器 ∥ 无 fetch ∥ 无第三方 i18n 库）。
- **检测与缺省**：记忆值优先（`localStorage["tc_lang"]`）；无 ⇒ `navigator.languages` 顺序扫描——首命中 `zh*` ⇒ zh ∥ 首命中 `en*` ⇒ en；无命中 ⇒ **缺省 zh**（现状保持零惊群 ∥ 一触可切）；非法记忆值忽略（回检测）。
- **切换器**：两枚小按钮「中文 ∥ English」（当前态高亮）；挂点（IA 服从 KD-SV-20）= 侧栏 meta 槽（登录后——版本行/退出登录同区；窄屏随顶条）+ 登录卡（`#/login` 无侧栏——卡内一行）；组件 = `i18n.mjs` 导出（`h` + `onChange` 注入——两处复用）。
- **切换动作**：写记忆 ⇒ 重渲当前界面（侧栏 ∥ 视图同拍——重渲口 = `app.mjs` 的 `rerender()`）+ `documentElement.lang` 随动（`zh-CN` ∥ `en`）；表单草稿不保（低频动作——在案）。
- **文案表形**：键 = `页面.区块.词`（点分平键——`login.submit` ∥ `nav.page.me.keys` ∥ `admin.members.secretLabel` ∥ `err.unauthorized`）；参数 = `{name}` 占位 + `t(key, params)` 替换；缺键回退链 = 当前表 → 中文表 → 键原文（+ `console.warn`——安全网；批内件断言两表键集相等）。
- **错误消息策略（服务端零改）**：服务端消息维持中文（机器面——口径 = `gateway/API.md` §3）；控制台按 `code` 前端映射（`err.<code>` 键）——映射集 = 控制台可达码全集：`unauthorized` ∥ `invalid_credentials` ∥ `forbidden` ∥ `not_found` ∥ `invalid_request_error` ∥ `upstream_error` ∥ `internal_error` ∥ `too_many_attempts`。
- **映射细则**：`429` 随 `Retry-After` 头捕获（秒数注入文案）；参数码（`invalid_request_error` ∥ `not_found`）句末附服务端原文（细节不丢——en 下附注为中文，在案）；码未在表 ⇒ 服务端原文兜底（未来新码/上游透传零遗漏）。
- **覆盖范围**：七页 + 登录 + 侧栏（组/页/品牌/退出/meta 槽）+ 表单（label/placeholder/按钮）+ 表头 + 空态 + 一次性秘密区 + confirm + flash + 错误映射 + 格式化助手（`fmtQuota`「不限」键化 ∥ `fmtTs` 随语言设 locale ∥ `fmtValue`「—」语言中性保留）+ 标签页 title（运行期 `document.title`——`index.html` 静态值 = 装配前缺省）。
- **不做**：文档面多语言（README 等——另议）∥ 服务端消息/日志语言 ∥ 用户数据值 ∥ 第三语言（加语言 = 表档 + 检测行增量——断点）。

## 3. 判权与安全

- **判权全在后端**（会话 + 角色——`accounts/ACCOUNTS.md` §3）：前端仅显隐与表单；`user` 直打管理端点 ⇒ 403——页面不是判据；管理组导航仅 admin 渲染 ∥ admin hash 由 `nav.mjs` 判 `denied` 落「无权限」块（含 provider 管理面——服务端为准）。
- 会话在 HttpOnly cookie（前端零令牌存储）；`401` ⇒ 回 `#/login`（会话过期即回登录）；`403` ⇒ 提示无权限。
- 渲染转义（`textContent` 系——不拼 HTML 串）。

## 4. 视觉与自托管

- 系统字体 ∥ 表格 + 表单 ∥ 桌面优先（宽表横滚）；全自托管（无外部资源引用）；侧栏分组导航（§2）∥ 窄屏降级 = §2 末条。

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/webui/static.mjs`（已落盘） | **78**（实读 2026-10-06——设计估 ≈70） | `public/` 直发 ∥ mime ∥ 防穿越 ∥ no-cache |
| `thincoder-server/public/index.html`（已落盘） | **20**（实读；本批预期 ≈26 = +6：侧栏壳容器） | 前端壳（挂载点 + 模块入口） |
| `thincoder-server/public/app.mjs`（已落盘） | **167**（实读；#962 预期 ≈190 = +23：IA 路由表接线 ∥ 视图装配；再叠加 +≈10（`/api/system` 取用 ∥ meta 填充）⇒ ≈200）**⇒ ≈230**（i18n 叠加 +30 = `initLang` 接线 ∥ 错误映射 ∥ 格式化本地化 ∥ `Retry-After` 捕捉 ∥ `rerender` 口 ∥ title 随动） | 路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手 |
| `thincoder-server/public/nav.mjs`（拟新增） | **无 ⇒ ≈70**（#962 设计估——组/项数据 ∥ `resolveRoute` 纯函数 ∥ 侧栏渲染；再叠加 +≈5（meta 槽元素）⇒ ≈75）**⇒ ≈85**（i18n 叠加 +10 = `label` ⇒ `labelKey` ∥ 切换器挂 meta 槽） | IA 单源（§2 ∥ §2.1） |
| `thincoder-server/public/views-auth.mjs`（拟新增） | **无 ⇒ ≈30**（设计估——登录；自 `views.mjs` 拆）**⇒ ≈45**（i18n 叠加 +15 = 文案键化 ∥ 登录卡切换行） | 登录视图 |
| `thincoder-server/public/views-me.mjs`（拟新增） | **无 ⇒ ≈150**（设计估——key ∥ 用量 ∥ 账户设置三页；自 `views.mjs` 拆）**⇒ ≈155**（i18n 叠加 +5 = 文案键化） | 我的三页 |
| `thincoder-server/public/views-admin.mjs`（拟新增） | **无 ⇒ ≈130**（设计估——成员 ∥ 用量统计两页；自 `views.mjs` 拆）**⇒ ≈135**（i18n 叠加 +5 = 文案键化） | 管理（成员族） |
| `thincoder-server/public/views-providers.mjs`（拟新增） | **无 ⇒ ≈210**（设计估——列表 ∥ 表单（增/改） ∥ 发现/勾选 ∥ 测试/删除）**⇒ ≈215**（i18n 叠加 +5 = 文案键化） | Provider 与模型页 |
| `thincoder-server/public/views-system.mjs`（拟新增） | **无 ⇒ ≈30**（#962 骨架——两节容器 + 空态） **⇒ ≈130**（#963 填充——版本/更新 ∥ 接入卡；§2.1）**⇒ ≈135**（i18n 叠加 +5 = 文案键化） | 系统页 |
| `thincoder-server/public/views.mjs`（已落盘） | **244**（实读；本批**退役拆档**——内容拆入上述四档） | —— |
| `thincoder-server/public/style.css`（已落盘） | **49**（实读；#962 预期 ≈95 = +46：侧栏/分组/活动态/窄屏；再叠加 +≈20（卡/示例样式）⇒ ≈115）**⇒ ≈120**（i18n 叠加 +5 = 切换器钮样式） | 系统字体 ∥ 表格/表单 ∥ 桌面优先（宽表横滚） |
| `thincoder-server/public/i18n.mjs`（拟新增） | **无 ⇒ ≈110**（设计估——语言态 ∥ 检测/记忆 ∥ `t()` ∥ 切换器组件 ∥ `document` 接线；§2.2） | 多语言运行时 |
| `thincoder-server/public/i18n-zh.mjs`（拟新增） | **无 ⇒ ≈220**（设计估——中文全量文案表（平铺点分键）） | 文案表·中文 |
| `thincoder-server/public/i18n-en.mjs`（拟新增） | **无 ⇒ ≈220**（设计估——English 全量文案表；零 CJK 断言——§6） | 文案表·English |
| **小计** | **≈680 ⇒ 558 ⇒ ≈1009**（#962）**⇒ ≈1144**（#963 叠加 +135）**⇒ ≈1774**（i18n 叠加 +630 = i18n 三档 +550 ∥ app +30 ∥ views-auth +15 ∥ nav +10 ∥ views-me/admin/providers/system/style 各 +5——口径 = #963 后） | —— |

## 6. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 前端自洽 | `public/**` 零外部引用（无 `http(s)://` 外链 ∥ 无 CDN ∥ 无外链字体——扫描断言，扫描面 = 全量新档）；静态直发 mime 正确 ∥ 路径穿越拒；档目断言随正（口径 = UI 代码档 12 ∥ 含 favicon 全目录 13——`-webui-deploy` 件；= i18n 三档叠加后） | 批内件 |
| AC-11（控制台 provider 面——判据全文 = `gateway/API.md` §5 AC-11 行） | `#/admin/providers` 页在册（列表 ∥ 增/改/删 ∥ 发现/勾选 ∥ 测试 ∥ 预设快速添加——预设列表端点 ⇒ 预填）；端点契约 = `gateway/API.md` §2.2；密钥掩码回显（不回明文） | 批内件 |
| AC-12（功能点 14——控制台 IA；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `nav.mjs` 直测：组/项结构（我的 3 ∥ 管理 4 ∥ admin 组仅 admin） ∥ 重定向（`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/members`） ∥ 角色默认 ∥ admin 面 `denied`；静态九档在册 ∥ 管理页拆分（成员/用量各一页——单页堆叠消失） | 批内件 |
| AC-13③④（功能点 12——版本/更新可见 ∥ 成员接入卡；候补——需求档回笔 = 主 agent 笔） | `#/admin/system` 两节在册（版本/更新 ∥ 接入卡）；meta 槽版本（`/api/system`）；更新提示接 `latest`；接入卡含 baseURL（运行时 origin） ∥ 四端示例 ∥ curl；零外部引用断言随正（不增档）；`nav.mjs` 结构直测不破 | 批内件 |
| AC-14（功能点 13——控制台多语言；候补——需求档回笔 = 主 agent 笔） | 检测（记忆优先 ∥ `zh*`/`en*` 首命中 ∥ 无匹配 ⇒ zh——`pickLang` 直测）∥ 两表键集相等（双向）∥ en 表零 CJK ∥ 全键两语言非空 ∥ 前端档「注释外零 CJK 字面量」∥ 键引用闭合（`t` 字面量 ⊆ 表键——含 `nav.mjs` `labelKey` 面）∥ 错误映射（可达码全键 ∥ `Retry-After` 注入 ∥ 未知码原文兜底）∥ 三新档静态直发 200（`text/javascript`）∥ 档目随正（12 ∥ 13） | 批内件 + 收口轮（浏览器两语言实走） |

## 7. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-9 | **控制台前端 = vanilla 静态面**（`public/` 静态档组——`node:http` 直发）；零框架 ∥ 零构建 ∥ 零外部资源；哈希路由（IA = §2 ∥ KD-SV-20）；判权全在后端 | 用户 08:09 钉死（先例 = 本仓 webview vanilla 口径）；静态档零依赖贴合内网自洽；视图交互维护性 | 单文件内嵌 HTML（视图/表单增长后难维护）· 前端框架（违零依赖/零构建）· CDN ∥ 外链字体（内网不达）· 构建步骤（bundler——违零构建） |
| KD-SV-20 | **控制台 IA = 侧栏分组导航 + 一页一职责**：组 = 我的（key/用量/账户设置）∥ 管理（成员/provider 与模型/用量统计/系统）；hash 路由 `#/<组>/<页>`；旧链重定向；解析 = `nav.mjs` 纯函数；窄屏降级顶条 | 用户 16:13 令（单页堆叠被判不专业）；侧栏 = 分组扩展面（系统/文案/后续协同面挂点）；纯函数解析 = 机检可达；零框架零构建不变（KD-SV-9） | 顶栏分区（横向空间有限——中英文案翻倍更挤 ∥ 分组层级浅）· 不重排（被用户否）· 框架路由（违 KD-SV-9）· 服务端路径路由（静态直发面破——hash 保刷新/书签） |
| KD-SV-26 | **控制台多语言 = 前端静态双表 + 浏览器语言自动检测 + 显式切换（`localStorage` 记忆）+ 错误码前端映射**（服务端零改；缺省 zh；两语 = 中文 ∥ English） | 零依赖零构建下最简可达（静态 ESM 原生取载——无打包器 ∥ 无 fetch 一跳）∥ 页面壳零数据口径保持（无 SSR 面）∥ `code` 面既有——映射零新契约 ∥ 文案表 node 直测可达；自动 + 显式两全（英文浏览器首屏即英文 ∥ 中文用户想切即切） | 后端下发文案（新端点 + 协商面——零收益）· 第三方 i18n 库（违零依赖）· cookie 记忆（无 SSR 面——零收益）· 双语字段（30+ 抛出点双语维护 ∥ 上游透传面无处双语）· 仅自动检测（无显式切换）· 仅切换器（首屏语言不明） |

## 8. 本域边界（不做的面）

- 独立客户端管理台（不做——需求 §4；管理面 = 内嵌网页）∥ 前端框架 ∥ 构建步骤 ∥ CDN/外部资源 ∥ 移动端适配（桌面优先——窄屏不做承诺）∥ 成员面接入卡（接入成文 = README；系统页卡 = admin 面——§2.1）∥ 文档面多语言（README 等——另议）∥ 服务端消息/日志语言（机器面——错误映射 = §2.2）∥ 第三语言（加语言 = 表档 + 检测行增量）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——webui 域：静态面 ∥ 三视图 ∥ 判权/自托管约束；KD-SV-9。
- 2026-10-06：fix 轮（评审轮次 1 #1）——管理视图数据源句补记：成员表行含各成员 key 清单（提示形 + id——`GET /api/members` 行内；契约 = `accounts/ACCOUNTS.md` §3）。
- 2026-10-06：实施后回填轮（fix）——§1 JS 行与 §5 行数按实读回填（小计 ≈680 ⇒ 558；管理视图未出档）。
- 2026-10-06：控制台 provider/模型管理 + IA 设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ §2:14 ∥ 台账 #962/#966）——§1 静态面九档重排（`views.mjs` 退役拆档）∥ §2 重写为「控制台 IA 与视图」（侧栏分组 ∥ 七页 ∥ 旧链重定向 ∥ `nav.mjs` 纯函数 ∥ 窄屏降级 ∥ 首版完备化/多语言面挂点）∥ §3/§4 随正 ∥ §5 预算（小计 558 ⇒ ≈1009）∥ §6 判据补 AC-11/AC-12 行 ∥ §7 增 KD-SV-20（KD-SV-9 行随正：计数句去「三视图」）∥ §8 增多语言留白句。
- 2026-10-06：fix 轮（评审轮次 1 五条——批 `docs/batches/2026-10-06-console-providers.md` §3）：#1 §2 provider 页行/§6 AC-11 行补预设列表端点 ∥ #2 §6 AC-12 行标记收正（已落需求档）∥ #3 §6 前端自洽行档目口径统一（UI 代码档 9 ∥ 含 favicon 全目录 10）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12③④ ∥ 台账 #963）——§1 视图档句随正 ∥ §2 系统页行/导航渲染句（meta 槽）随正 ∥ §2.1 增（系统页两节 ∥ meta 槽 ∥ 接入卡 ∥ 文案口径）∥ §5 预算（views-system ⇒ ≈130 ∥ app ⇒ ≈200 ∥ nav ⇒ ≈75 ∥ style ⇒ ≈115；小计 ≈1144）∥ §6 补 AC-13③④ 候补行 ∥ §8 边界补成员面卡句；数据面 = `gateway/API.md` §2.3 ∥ 更新状态 = `ops/OPS.md` §5.4(g)/KD-SV-24。
- 2026-10-06：控制台多语言设计轮（批 `docs/batches/2026-10-06-server-i18n.md`——需求 §2:13 ∥ 台账 #965）——§1 JS 档句（十档）∥ §2 文案面句重写 ∥ §2.1 文案句收编 ∥ 增 §2.2（多语言机制：检测/切换器/文案表/错误映射/覆盖/边界）∥ §5 预算（i18n 三档拟新增；小计 ≈1144 ⇒ ≈1774）∥ §6 补 AC-14 候补行 + 档目口径随正（12 ∥ 13）∥ §7 增 KD-SV-26 ∥ §8 边界随正（留白句已设计化；文档面/服务端语言/第三语言入册）。
