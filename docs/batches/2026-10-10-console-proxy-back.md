# 2026-10-10 · console-proxy-back
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 08:22「服务器的代理设置还是放回系统设置页面。」+ 08:41「测试要保留。」。
> 台账 = #1199（server · 归批）。前情 = docs/batches/2026-10-09-console-proxy-page.md（已收口 2026-10-09 · 其第一半「代理独立入口」本次回改）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-10 08:22「服务器的代理设置还是放回系统设置页面。」+ 08:41「测试要保留。」——回改 #1158 第一半（代理独立页 `#/admin/proxy` 退役）；**测试功能保留随迁**（系统页服务配置卡内——目标预填 ∥ 真打读数 ∥ 空值就地拒三语义零变）。

**拍法**：**轻通道笔**（用户面重排 = 位置/细节面——父侧直接执行 · 可 revert；收口走轻通道全链：设计形式化 → 独立评审 → 审批 → 核销）。披露：本笔 = 轻通道（细节面）| 改 = 代理设置自独立页回迁系统页服务配置卡 + 测试随迁 + 路由/导航/i18n 随正 | 触面 = `thincoder-server/public/**` + 需求档 + 设计档（WEBUI）| 回退 = revert。

**落点（勘读 2026-10-10）**：`public/views-system-config.mjs`（卡体——proxy.uri 行回归 + 连通测试块并入）∥ `public/views-proxy.mjs`（删档——逻辑并入）∥ `public/nav.mjs:27`（项删）∥ `public/app.mjs:25/:104`（import + 路由删；`/admin/proxy` ⇒ `/admin/system` 旧链别名入 `nav.mjs` ROUTE_ALIASES）∥ `public/i18n-{zh,en}-admin.mjs`（`admin.providers.useProxy` 指向句改「系统页」）∥ `public/i18n-{zh,en}-system.mjs`（注释块随正；`proxy.title` 页标题键退场）∥ `public/i18n-{zh,en}-shell.mjs`（`nav.page.admin.proxy` 键退场）。

**边界**：服务端点零改（`POST /api/admin/proxy/test` ∥ `PATCH /api/admin/config { proxyUri }` 照旧）；产品面其余零触；`proxy.uri` 语义零变（空 ⇒ 删段 ∥ 重启生效）。

**状态**：进行中。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
