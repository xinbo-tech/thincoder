# Thincoder Server · 控制台前端（webui/WEBUI）

> 板块 = server ∥ 本档 = webui 域（页面路由 ∥ HTML ∥ 静态资源）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 本域回指 = `PROJECT.md` §7（非功能·前端自洽 = 本档 §6）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 静态面

- 落点 = `thincoder-server/public/`（已落盘；本批 IA 重排——§2）：`index.html`（壳——侧栏容器 + 挂载点 + 模块入口）∥ `app.mjs`（路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手）∥ `nav.mjs`（IA 单源——组/项数据 + 路由解析纯函数）∥ `style.css`。
- 视图档（按页分档——§2）：`views-auth.mjs`（登录）∥ `views-me.mjs`（我的三页）∥ `views-admin.mjs`（成员 ∥ 用量统计）∥ `views-providers.mjs`（Provider 与模型）∥ `views-system.mjs`（系统——骨架，挂点 = §2）。
- 原 `views.mjs`（三视图单档）**退役拆档**——缘由 = 新页（provider ∥ IA 重排）叠加后单档将破 300 软线；拆分 = 按页归档（每档 ≤300）。
- 直发 = `thincoder-server/src/webui/static.mjs`（已落盘）：`node:http` 读发 `public/`——mime 表（`.mjs` ⇒ text/javascript） ∥ 防路径穿越 ∥ `Cache-Control: no-cache`（内部工具——改版即见）。
- 路由：`GET /` ⇒ `index.html`；其余静态档按名直发（同源）；`/v1/*` 与 `/api/*` 优先于静态面（分派 = `gateway/API.md` §1）。
- 形态钉死（用户 2026-10-06 08:09）：**零框架 ∥ 零构建 ∥ 零外部资源**（无 CDN ∥ 无外链字体——内网自洽）；先例 = 本仓 webview（`thincoder-vscode/webview/`）的 vanilla 口径。
- JS = 七档（`app.mjs` 实读 167 ⇒ 本批预期 ≈190 ∥ `nav.mjs` ≈70（新） ∥ `views-*` 五档 ≈550（新/拆）——各档 ≤300 软线内）。

## 2. 控制台 IA 与视图（哈希路由——KD-SV-20）

- **形态（本批定稿——用户 16:13 令）**：**左侧栏**分组导航 + 内容区；hash 路由扩展为 `#/<组>/<页>`；一页一职责（原「管理」单页堆叠拆开——成员/用量分页）。

| 组 | 页（hash） | 职责 | 角色 |
|---|---|---|---|
| 我的 | `#/me/keys` | key 清单（提示形） ∥ 签发/轮换（新明文一次性区） | 全体 |
| 我的 | `#/me/usage` | 本月额度/已用摘要 + 本人用量明细 | 全体 |
| 我的 | `#/me/account` | 基本信息（展示名/用户名/角色）+ 自助改密 | 全体 |
| 管理 | `#/admin/members` | 建成员（初始密码一次性回显） ∥ 成员表（key 清单/吊销/设额度/重置） | admin |
| 管理 | `#/admin/providers` | provider 增删改 ∥ 模型发现/开放勾选 ∥ 测试/预设快速添加（契约 = `gateway/API.md` §2.2） | admin |
| 管理 | `#/admin/usage` | 全队用量表（过滤查询） | admin |
| 管理 | `#/admin/system` | 版本与更新 ∥ 成员接入（骨架——随 `requirements/PROJECT.md` §2:12 面填充；侧栏底部 meta 槽同挂） | admin |

- 登录 = `#/login`（无侧栏——登录卡）；`#/` ∥ 未知 ⇒ 角色默认页（admin ⇒ `#/admin/members` ∥ user ⇒ `#/me/keys`）。
- **旧链迁移**：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/members`（重定向——旧书签可达）。
- **路由解析 = `nav.mjs` 纯函数**（`resolveRoute(path, role)`——无 DOM、批内件直测）：别名重定向 ∥ 角色默认 ∥ admin 面 `denied`（页面级「无权限」块——判据仍在服务端，§3）。
- **导航渲染**：侧栏 = 品牌 ∥ 组标题 + 项（活动态高亮）∥ 底部（meta 槽 + 退出登录）；admin 组仅 admin 渲染。
- **窄屏**：`≤760px` 侧栏降级为顶条（单条媒体查询——非移动端适配承诺）。
- **文案挂点（多语言面——`requirements/PROJECT.md` §2:13）**：导航/页标题文案单源 = `nav.mjs` 数据（label 字段）；各页内文案随页档——以文案表替换取值处（结构零动；切换形态不预设）。
- 数据全经 `/api/*`（契约 = `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3 ∥ `gateway/API.md` §2.2）；`GET /` 公开（页面壳零数据）。

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
| `thincoder-server/public/app.mjs`（已落盘） | **167**（实读；本批预期 ≈190 = +23：IA 路由表接线 ∥ 视图装配） | 路由分派 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手 |
| `thincoder-server/public/nav.mjs`（拟新增） | **无 ⇒ ≈70**（设计估——组/项数据 ∥ `resolveRoute` 纯函数 ∥ 侧栏渲染） | IA 单源（§2） |
| `thincoder-server/public/views-auth.mjs`（拟新增） | **无 ⇒ ≈30**（设计估——登录；自 `views.mjs` 拆） | 登录视图 |
| `thincoder-server/public/views-me.mjs`（拟新增） | **无 ⇒ ≈150**（设计估——key ∥ 用量 ∥ 账户设置三页；自 `views.mjs` 拆） | 我的三页 |
| `thincoder-server/public/views-admin.mjs`（拟新增） | **无 ⇒ ≈130**（设计估——成员 ∥ 用量统计两页；自 `views.mjs` 拆） | 管理（成员族） |
| `thincoder-server/public/views-providers.mjs`（拟新增） | **无 ⇒ ≈210**（设计估——列表 ∥ 表单（增/改） ∥ 发现/勾选 ∥ 测试/删除） | Provider 与模型页 |
| `thincoder-server/public/views-system.mjs`（拟新增） | **无 ⇒ ≈30**（设计估——骨架：两节容器 + 空态） | 系统页（挂点） |
| `thincoder-server/public/views.mjs`（已落盘） | **244**（实读；本批**退役拆档**——内容拆入上述四档） | —— |
| `thincoder-server/public/style.css`（已落盘） | **49**（实读；本批预期 ≈95 = +46：侧栏/分组/活动态/窄屏） | 系统字体 ∥ 表格/表单 ∥ 桌面优先（宽表横滚） |
| **小计** | **≈680 ⇒ 558 ⇒ 本批预期 ≈1009**（+451——净增 = nav/五视图 − `views.mjs` 退役；public 档数 4 ⇒ 9） | —— |

## 6. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 前端自洽 | `public/**` 零外部引用（无 `http(s)://` 外链 ∥ 无 CDN ∥ 无外链字体——扫描断言，含新增五档）；静态直发 mime 正确 ∥ 路径穿越拒；档目断言随正（含 favicon.png 共十档——`-webui-deploy` 件） | 批内件 |
| AC-11（控制台 provider 面——判据全文 = `gateway/API.md` §5 AC-11 行） | `#/admin/providers` 页在册（列表 ∥ 增/改/删 ∥ 发现/勾选 ∥ 测试 ∥ 预设快速添加）；端点契约 = `gateway/API.md` §2.2；密钥掩码回显（不回明文） | 批内件 |
| AC-12（功能点 14——控制台 IA；候补行——需求档回笔 = 主 agent 笔） | `nav.mjs` 直测：组/项结构（我的 3 ∥ 管理 4 ∥ admin 组仅 admin） ∥ 重定向（`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/members`） ∥ 角色默认 ∥ admin 面 `denied`；静态九档在册 ∥ 管理页拆分（成员/用量各一页——单页堆叠消失） | 批内件 |

## 7. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-9 | **控制台前端 = vanilla 静态面**（`public/` 静态档组——`node:http` 直发）；零框架 ∥ 零构建 ∥ 零外部资源；哈希路由（IA = §2 ∥ KD-SV-20）；判权全在后端 | 用户 08:09 钉死（先例 = 本仓 webview vanilla 口径）；静态档零依赖贴合内网自洽；视图交互维护性 | 单文件内嵌 HTML（视图/表单增长后难维护）· 前端框架（违零依赖/零构建）· CDN ∥ 外链字体（内网不达）· 构建步骤（bundler——违零构建） |
| KD-SV-20 | **控制台 IA = 侧栏分组导航 + 一页一职责**：组 = 我的（key/用量/账户设置）∥ 管理（成员/provider 与模型/用量统计/系统）；hash 路由 `#/<组>/<页>`；旧链重定向；解析 = `nav.mjs` 纯函数；窄屏降级顶条 | 用户 16:13 令（单页堆叠被判不专业）；侧栏 = 分组扩展面（系统/文案/后续协同面挂点）；纯函数解析 = 机检可达；零框架零构建不变（KD-SV-9） | 顶栏分区（横向空间有限——中英文案翻倍更挤 ∥ 分组层级浅）· 不重排（被用户否）· 框架路由（违 KD-SV-9）· 服务端路径路由（静态直发面破——hash 保刷新/书签） |

## 8. 本域边界（不做的面）

- 独立客户端管理台（不做——需求 §4；管理面 = 内嵌网页）∥ 前端框架 ∥ 构建步骤 ∥ CDN/外部资源 ∥ 移动端适配（桌面优先——窄屏不做承诺）∥ 多语言文案表本体（`requirements/PROJECT.md` §2:13 轮——本档留挂点 ∥ §2 末条）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——webui 域：静态面 ∥ 三视图 ∥ 判权/自托管约束；KD-SV-9。
- 2026-10-06：fix 轮（评审轮次 1 #1）——管理视图数据源句补记：成员表行含各成员 key 清单（提示形 + id——`GET /api/members` 行内；契约 = `accounts/ACCOUNTS.md` §3）。
- 2026-10-06：实施后回填轮（fix）——§1 JS 行与 §5 行数按实读回填（小计 ≈680 ⇒ 558；管理视图未出档）。
- 2026-10-06：控制台 provider/模型管理 + IA 设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ §2:14 ∥ 台账 #962/#966）——§1 静态面九档重排（`views.mjs` 退役拆档）∥ §2 重写为「控制台 IA 与视图」（侧栏分组 ∥ 七页 ∥ 旧链重定向 ∥ `nav.mjs` 纯函数 ∥ 窄屏降级 ∥ 首版完备化/多语言面挂点）∥ §3/§4 随正 ∥ §5 预算（小计 558 ⇒ ≈1009）∥ §6 判据补 AC-11/AC-12 行 ∥ §7 增 KD-SV-20（KD-SV-9 行随正：计数句去「三视图」）∥ §8 增多语言留白句。
