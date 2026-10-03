# 2026-10-03 · 桌面 Linux 产物（AppImage ∥ deb ∥ 官网 ∥ 自动更新）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 17:27「能把linux版桌面端也做了吗？」+ 17:35「WSL2」（构建通道裁定）；承 D32/D40/D41 阶段二片——Linux 产物线开工。
> 台账 = #847（desktop · 归批）。前情 = docs/batches/2026-10-03-release-0-10-2.md §6（已收口 2026-10-03）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）——Linux 桌面产物线（承 D32 阶段二片 · D42 落档）**

- **来源**：用户 2026-10-03 17:27「能把 linux 版桌面端也做了吗？」+ 17:35「**WSL2**」（构建通道裁定）。
- **已定形（用户确认）**：① 产物 = **AppImage**（免安装单文件——主；可带自动更新）+ **deb**（Debian/Ubuntu 系安装包）；② **自动更新** = AppImage 跟随 D40 口径（官网 feed 增 `latest-linux.yml`；deb 走系统包管理器手动升级）；③ **构建通道 = WSL2（Ubuntu）**（本机一次性装配）；④ **官网** = 下载页/桌面页加 Linux 区块（随发布一体同步）；⑤ **边界** = rpm ∥ Snap ∥ macOS 不在本片（后加）。
- **需求档**：`docs/desktop/requirements/PACKAGING.md` **D42**（台账 **#847**）；总览计数随动（九卷 41 + D14 = **42（D1–D42）**）。
- **实探已知事实（本席 17:27–17:35）**：现行 `electron-builder.yml` = 仅 Windows NSIS（publish generic 契约 ∥ `artifactName` 模板 ∥ win 签名 hook 均在位）；本机**无 Docker** ∥ **WSL 组件在、零发行版**（装配 = 一次性 `wsl --install -d Ubuntu`——管理员 + 或需重启，用户步）；**Windows 直出 AppImage 探针实跑 = 卡死不可行**（该路作废；证据 = 本席实跑）；Electron 二进制下载须走 npmmirror 镜像（本机纪律——直连 GitHub 静默超时）；`render-core` 永不发布（private）⇒ 两核包入包恒走源树物化（`scripts/materialize-deps.mjs`，`prepackage` 自跑——同 Windows）。
- **待设计轮查实/定形**（不得预判）：WSL2 构建环境装配清单（发行版 ∥ Node 24 ∥ 依赖 ∥ 镜像 ∥ 目录布局与产物回取）∥ electron-builder Linux 段（targets ∥ artifactName 模板 ∥ deb 元数据 ∥ Linux 图标面（现仅 `build/icon.ico`——须 png 集）∥ AppImage 运行条件（FUSE ∥ Ubuntu 24 userns/AppArmor 面））∥ 更新器平台分支审计（`update.mjs`——win32 现状 vs linux/AppImage；deb 无更新语义）∥ 产物校验面（Linux 版断言集——含核 ∥ 版本逐字 ∥ 形状）∥ 站点/上传/发布流（`upload-download.mjs` 扩展 ∥ `RELEASE.md` §5 增行）∥ 验收（WSLg 冒烟 = 可自动面 ∥ 真机走查 = 用户侧）。
- **本片边界**：不开工 macOS ∥ 不触 Windows 线（已发版）∥ 站点改动随发布窗（本轮零部署）∥ 构建机（WSL2 发行版）安装 = 用户门。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
