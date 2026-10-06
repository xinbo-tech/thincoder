# Thincoder Server · 控制台前端（webui/WEBUI）

> 板块 = server ∥ 本档 = webui 域（页面路由 ∥ HTML ∥ 静态资源）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 本域回指 = `PROJECT.md` §7（非功能·前端自洽 = 本档 §6）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 静态面

- 落点 = `thincoder-server/public/`（已落盘）：`index.html`（壳——挂载点 + 模块入口）∥ `app.mjs`（哈希路由 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手）∥ `views.mjs`（三视图与表单）∥ `style.css`。
- 直发 = `thincoder-server/src/webui/static.mjs`（已落盘）：`node:http` 读发 `public/`——mime 表（`.mjs` ⇒ text/javascript） ∥ 防路径穿越 ∥ `Cache-Control: no-cache`（内部工具——改版即见）。
- 路由：`GET /` ⇒ `index.html`；其余静态档按名直发（同源）；`/v1/*` 与 `/api/*` 优先于静态面（分派 = `gateway/API.md` §1）。
- 形态钉死（用户 2026-10-06 08:09）：**零框架 ∥ 零构建 ∥ 零外部资源**（无 CDN ∥ 无外链字体——内网自洽）；先例 = 本仓 webview（`thincoder-vscode/webview/`）的 vanilla 口径。
- JS = 两档（`app.mjs` 实读 167（估 ≈180） ∥ `views.mjs` 实读 244（估 ≈270）——≤300 软线内；管理视图未出档）。

## 2. 三视图（哈希路由）

- `#/login`：登录表单（`username` + `password` → `POST /api/login`）。
- `#/me`（我的——全体）：本人信息 ∥ key 清单（提示形） ∥ 签发/轮换（新明文一次性区） ∥ 本人用量表 ∥ 改密表单。
- `#/admin`（管理——仅 admin）：成员表（name/username/角色/额度/已用 ∥ 各成员 key 清单——提示形 + id，吊销控件数据源） ∥ 建成员（初始密码一次性回显） ∥ 设额度 ∥ 吊销 key ∥ 重置密码 ∥ 全队用量表（过滤）。
- 数据全经 `/api/*`（契约 = `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3）；`GET /` 公开（页面壳零数据）。

## 3. 判权与安全

- **判权全在后端**（会话 + 角色——`accounts/ACCOUNTS.md` §3）：前端仅显隐与表单；`user` 直打管理端点 ⇒ 403——页面不是判据。
- 会话在 HttpOnly cookie（前端零令牌存储）；`401` ⇒ 回 `#/login`（会话过期即回登录）；`403` ⇒ 提示无权限。
- 渲染转义（`textContent` 系——不拼 HTML 串）。

## 4. 视觉与自托管

- 系统字体 ∥ 表格 + 表单 ∥ 桌面优先（宽表横滚）；全自托管（无外部资源引用）。

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/webui/static.mjs`（已落盘） | **78**（实读 2026-10-06——设计估 ≈70） | `public/` 直发 ∥ mime ∥ 防穿越 ∥ no-cache |
| `thincoder-server/public/index.html`（已落盘） | **20**（实读 2026-10-06——设计估 ≈40） | 前端壳（挂载点 + 模块入口） |
| `thincoder-server/public/app.mjs`（已落盘） | **167**（实读 2026-10-06——设计估 ≈180） | 哈希路由 ∥ fetch 封装 ∥ 会话态 ∥ 渲染助手 |
| `thincoder-server/public/views.mjs`（已落盘） | **244**（实读 2026-10-06——设计估 ≈270） | 三视图与表单（登录 ∥ 我的 ∥ 管理） |
| `thincoder-server/public/style.css`（已落盘） | **49**（实读 2026-10-06——设计估 ≈120） | 系统字体 ∥ 表格/表单 ∥ 桌面优先（宽表横滚） |
| **小计** | **≈680 ⇒ 558** | —— |

## 6. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 前端自洽 | `public/**` 零外部引用（无 `http(s)://` 外链 ∥ 无 CDN ∥ 无外链字体——扫描断言）；静态直发 mime 正确 ∥ 路径穿越拒 | 批内件 |

## 7. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-9 | **控制台前端 = vanilla 静态面**（`public/` 四档——`node:http` 直发）；零框架 ∥ 零构建 ∥ 零外部资源；哈希路由三视图；判权全在后端 | 用户 08:09 钉死（先例 = 本仓 webview vanilla 口径）；静态档零依赖贴合内网自洽；三视图交互维护性 | 单文件内嵌 HTML（三视图 + 表单后难维护）· 前端框架（违零依赖/零构建）· CDN ∥ 外链字体（内网不达）· 构建步骤（bundler——违零构建） |

## 8. 本域边界（不做的面）

- 独立客户端管理台（不做——需求 §4；管理面 = 内嵌网页）∥ 前端框架 ∥ 构建步骤 ∥ CDN/外部资源 ∥ 移动端适配（桌面优先——窄屏不做承诺）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——webui 域：静态面 ∥ 三视图 ∥ 判权/自托管约束；KD-SV-9。
- 2026-10-06：fix 轮（评审轮次 1 #1）——管理视图数据源句补记：成员表行含各成员 key 清单（提示形 + id——`GET /api/members` 行内；契约 = `accounts/ACCOUNTS.md` §3）。
- 2026-10-06：实施后回填轮（fix）——§1 JS 行与 §5 行数按实读回填（小计 ≈680 ⇒ 558；管理视图未出档）。
