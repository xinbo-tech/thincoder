# 桌面需求 · 打包与发行（PACKAGING）

> **卷**：桌面端需求分卷之「打包与发行」——**D12 ∥ D32 ∥ D40 ∥ D41**（4 条）。
> **总览 ∥ D 表索引**：`docs/desktop/requirements/PROJECT.md`（D1–D41 全表查卷口；模块目标 / 定位 / 界面形态 / 边界 / 非功能 / 验收 / 依赖）。**同族设计档**：`docs/desktop/design/PACKAGING.md`。
> **来源**：自 `docs/desktop/requirements/PROJECT.md` §4 按域分卷迁入（**行文逐字 · 零新语义**）——2026-10-02 文档体系重组批（DOC-MIGRATION）波 3；批档 `docs/batches/2026-10-02-doc-structure-reorg.md`。坐标 = as-of 2026-10-02。
> 行内「自本行起 D 表 = D1–D××」类 = 原档历史随行句（as-of——不追改）。

## 功能点

| # | 功能点 | 判据（可机检） |
|---|---|---|
| D12 | 发行面 | 三平台（Windows / macOS / Linux）可安装可启动的产物；版本与升级路径（细目留设计轮）；**【2026-10-01 分期（D32 阶段令）】交付分期 = 阶段一 Windows 产物（打包链 + 安装包 + 官网下载）；macOS ∥ Linux 产物随阶段二（构建机后补）** |
| D32 | 发行渠道（2026-09-30 裁定） | **桌面三平台版本**（Windows ∥ macOS ∥ Linux）**发布到官网（thincoder.com）供下载**；另发布到 **Windows 商店 ∥ Snap 商店**；**MAS（Mac App Store）明确不做**（沙箱与产品本质冲突——用户明裁「MAS就算了」）；实现形待设计——前置 = 打包链落定（`electron-builder.yml` 未落）；签名 ∥ 商店账号（Partner Center ∥ Apple Developer）= 用户动作；来源 = 用户 2026-09-30 22:55–22:59；**【2026-10-01 22:19 分期令（用户原话「现阶段先打成安装包发布到 thincoder.com 网站上可以下载，以后再做应用商店发布」）】阶段一（本批）= 打包链落定（`electron-builder.yml`）+ **Windows 安装包** + **官网（thincoder.com）下载**；阶段二（后）= 应用商店（Windows 商店 ∥ Snap）+ 其余平台产物（macOS ∥ Linux——构建机后补）；批 = `docs/batches/2026-10-01-desktop-packaging-release.md`；台账 #807**；**【2026-10-01 22:23 用户补正：签名 = 保留诉求（「我还是希望签名得」）】【2026-10-01 22:26 事实更正：**证书 = 已购并验活**（2026-09-30 · GlobalSign EV `CN=Shanghai Xinbo Technology Co., Ltd.` · eToken/SafeNet 形）——阶段一 = **签名就绪**设计（**主路径 = 实签**；token 缺席 ⇒ 跳过 + 明示）；构建期 = UKey 在位 + PIN】**；**自本行起 D 表 = D1–D32** |
| D40 | 自动更新（2026-10-02 用户令 · 台账 #810） | 启动自检（延时一次）⇒ 发现新版本**后台静默下载**（不打断会话）⇒ 下载完成**提示重启安装**（菜单项 ∥ 通知双面）∥ 或**退出时自动安装**；手动「检查更新…」随时可用；覆盖安装兜底。**【分期】feed = 官网托管（`downloads/` 三件——`latest.yml` 末传 ∥ prune 豁免）；Linux/mac ∥ 商店后加（承 D32）** |
| D41 | 官网桌面面（2026-10-02 用户令 · 台账 #826） | 官网（thincoder.com）含桌面版介绍与下载：**desktop 专页**（安装 ∥ 开始使用 ∥ 界面 ∥ 模型与配置 ∥ 自动更新 ∥ 系统要求）∥ `download.html` 桌面卡 + 系统要求行 ∥ 导航 ∥ 首页 ∥ 关于 ∥ 更新日志触点 ∥ **feed 托管（`downloads/`）**；**版本面三处对盘**（源 `package.json` = 安装包名 = 站点版本面——承 `docs/RELEASE.md` §6.1）。**【分期】仅 Windows 下载版——Linux/mac ∥ 商店后加** |

## 变更记录

- 2026-10-02：建档（自 `docs/desktop/requirements/PROJECT.md` §4 分卷迁入——行文逐字 · 零新语义；D 表索引见总览；重组批波 3）。
- 2026-10-02：新增 **D40**（自动更新——启动自检 ∥ 静默下载 ∥ 提示重启/退出安装 ∥ feed 官网托管；台账 #810）∥ **D41**（官网桌面面——专页 ∥ 下载卡 ∥ 触点 ∥ feed 托管 ∥ 版本面三处对盘；台账 #826）；来源 = 用户 21:39 需求 + 批 `docs/batches/2026-10-02-desktop-release-stage2.md`；**卷计 = 4 条**。
