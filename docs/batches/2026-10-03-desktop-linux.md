# 2026-10-03 · 桌面 Linux 产物（AppImage ∥ deb ∥ 官网 ∥ 自动更新）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 17:27「能把linux版桌面端也做了吗？」+ 17:35「WSL2」（构建通道裁定）；承 D32/D40/D41 阶段二片——Linux 产物线开工。
> 台账 = #847（desktop · 归批）。前情 = docs/batches/2026-10-03-release-0-10-2.md §6（已收口 2026-10-03）。
## §1 讨论（主 agent）
**状态行**：进行中（候评审——§2 已落（2026-10-03）∥ §1 补记一二在册 ∥ 需求卷 D42 两处已收正）

**§1 讨论（主 agent）——Linux 桌面产物线（承 D32 阶段二片 · D42 落档）**

- **来源**：用户 2026-10-03 17:27「能把 linux 版桌面端也做了吗？」+ 17:35「**WSL2**」（构建通道裁定）。
- **已定形（用户确认）**：① 产物 = **AppImage**（免安装单文件——主；可带自动更新）+ **deb**（Debian/Ubuntu 系安装包）；② **自动更新** = AppImage 跟随 D40 口径（官网 feed 增 `latest-linux.yml`；deb 走系统包管理器手动升级）；③ **构建通道 = WSL2（Ubuntu）**（本机一次性装配）；④ **官网** = 下载页/桌面页加 Linux 区块（随发布一体同步）；⑤ **边界** = rpm ∥ Snap ∥ macOS 不在本片（后加）。
- **需求档**：`docs/desktop/requirements/PACKAGING.md` **D42**（台账 **#847**）；总览计数随动（九卷 41 + D14 = **42（D1–D42）**）。
- **实探已知事实（本席 17:27–17:35）**：现行 `electron-builder.yml` = 仅 Windows NSIS（publish generic 契约 ∥ `artifactName` 模板 ∥ win 签名 hook 均在位）；本机**无 Docker** ∥ **WSL 组件在、零发行版**（装配 = 一次性 `wsl --install -d Ubuntu`——管理员 + 或需重启，用户步）；**Windows 直出 AppImage 探针实跑 = 卡死不可行**（该路作废；证据 = 本席实跑）；Electron 二进制下载须走 npmmirror 镜像（本机纪律——直连 GitHub 静默超时）；`render-core` 永不发布（private）⇒ 两核包入包恒走源树物化（`scripts/materialize-deps.mjs`，`prepackage` 自跑——同 Windows）。
- **待设计轮查实/定形**（不得预判）：WSL2 构建环境装配清单（发行版 ∥ Node 24 ∥ 依赖 ∥ 镜像 ∥ 目录布局与产物回取）∥ electron-builder Linux 段（targets ∥ artifactName 模板 ∥ deb 元数据 ∥ Linux 图标面（现仅 `build/icon.ico`——须 png 集）∥ AppImage 运行条件（FUSE ∥ Ubuntu 24 userns/AppArmor 面））∥ 更新器平台分支审计（`update.mjs`——win32 现状 vs linux/AppImage；deb 无更新语义）∥ 产物校验面（Linux 版断言集——含核 ∥ 版本逐字 ∥ 形状）∥ 站点/上传/发布流（`upload-download.mjs` 扩展 ∥ `RELEASE.md` §5 增行）∥ 验收（WSLg 冒烟 = 可自动面 ∥ 真机走查 = 用户侧）。
- **本片边界**：不开工 macOS ∥ 不触 Windows 线（已发版）∥ 站点改动随发布窗（本轮零部署）∥ 构建机（WSL2 发行版）安装 = 用户门。

**§1 补记（同日 · 构建通道改判 + 云构建就绪）**：WSL 通道经两轮实测**判死**——① **WSL2**：本机 = 阿里云 ECS（无嵌套虚拟化——`VMMonitorModeExtensions` ∥ `SLAT` 实测 False）⇒ VM 起不来（内核 MSI 重启后已装 5.10.16 ✓，但 VM 平台仍不可用）；② **WSL1**：已导入 Ubuntu 24.04（`D:\WSL\Ubuntu1`）且基础命令全通，但 **lxcore 拒载非 PIE（ET_EXEC）二进制**——node 官方包（段基址 0x400000）与发行版 node 双实测 `Exec format error`，而 `ld-linux … node -v` 直呼可跑（coreutils = PIE 全通）⇒ 构建链（node ∥ Go 类工具）不可行。**改判 = 用户「A试试」：GitHub Actions 云构建**——`.github/workflows/linux-build.yml` 已落并推送双远端（workflow_dispatch · ubuntu-latest · node 24 → `npm install` → `materialize-deps` → `electron-builder --linux AppImage deb --publish never` → upload-artifact 三件）；**当前阻塞 = GitHub 组织账号账单锁**（runner 起不来：「account is locked due to a billing issue」——属用户账号动作，待解）。需求 D42 构建通道条款已随改（同日在卷）。

**§1 补记二（同日 20:1x–20:26 · 构建机首跑 = 出产物）**：B 路线（内网构建机 `10.0.0.5` 代号 ha-proxy）**首跑全链实通**——配方 = gitee 浅克隆 → npmmirror registry + `ELECTRON_MIRROR` + `ELECTRON_BUILDER_BINARIES_MIRROR` → `npm install`（301 包）→ `materialize-deps` → `electron-builder --linux AppImage deb --publish never`。**实产**：`ThinCoder-Setup-0.10.2.AppImage`（127,048,532 B · sha256 2543559b…c616）∥ `ThinCoder-Setup-0.10.2.deb`（100,650,684 B · sha256 77710267…049d）∥ `latest-linux.yml`（350 B）；产物已拉回父侧 `D:\WSL\artifacts\`。**首跑挖出三处仓内缺项（入设计定形）**：① 图标——electron-builder 拒收 `.ico` ⇒ 须入库 `build/icon.png`（256×256，可从 icon.ico 内嵌帧直取）；② deb 元数据——fpm 要 `homepage` + `author.email`（补后即通）；③ feed 语义错位——latest-linux.yml 现指向 deb，与「AppImage 跟自动更新 ∥ deb 手动」相抵。设计轮 = eng-designer（本批 §2 + `docs/desktop/design/PACKAGING.md` Linux 段 + `RELEASE.md` §5 随动），已起跑。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（落点 = docs/desktop/design/PACKAGING.md §1 KD-73 ∥ §2.11 ∥ §3.4 ∥ §4.4 ∥ §5 T-DSK61–63 ∥ §6 D42 行；docs/RELEASE.md §5.6 Linux 臂 L1–L5；2026-10-03；机检红线修复轮（24 悬空 → 0 ∥ 6 超宽 → 0 · 复跑 exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer）——桌面 Linux 产物（D42 · 台账 #847）· 设计轮（initial）**

**① 本批条目（覆盖——每条 = 需求回指 + 设计落点 + 判据）**

| # | 条目 | 需求回指 | 设计落点 | 机检判据 |
|---|---|---|---|---|
| 1 | **AppImage**（主 · 自动更新单元）+ **deb**（手动升级单元）双产物 · x64 · 同跑一条链 | D42 | `docs/desktop/design/PACKAGING.md` §1 **KD-73①** ∥ §2.11.1–§2.11.2 | check-dist Linux 臂 ⑤⑥（产物在 ∥ 名形 × 版本） |
| 2 | 仓内修复三处：**图标**（`build/icon.png` 入库 + `linux.icon`）∥ **deb 元数据**（`homepage` ∥ `author.email`——用户定值）∥ **feed 分流**（`deb.publish: null`） | D42 ∥ 批档 §1 补记二 | §2.11.2（a/b/c） | 批内件（帧断言 ∥ 三键值）∥ check-dist ⑧（feed 单条目）∥ `dpkg-deb -f`（构建机） |
| 3 | 两警告消：`linux.category: Development` ∥ `desktopName` + `linux.syncDesktopName` | 批档 §1 补记二 | §2.11.2（a/b） | 批内件（yml/包键）∥ 提取读数（`.desktop` 名 ∥ `StartupWMClass`） |
| 4 | 产物校验（check-dist **平台分臂** + Linux 臂 **+9**）∥ 冒烟面重裁（可自动 ∥ 人工） | D42（验收） | §2.11.3 ∥ §4.4 | check-dist exit 0 ∥ 构建机提取读数 |
| 5 | 自动更新分流：AppImage 跟 D40 ∥ **deb 无自动更新**（双保险：feed + 武装门扩） | D42 ∥ D40 | §2.11.4 | 批内件（门真值表）∥ T-DSK62 ⑤ ∥ T-DSK63 |
| 6 | 发布对接：feed 两件 ∥ 上传序（AppImage → deb → `latest-linux.yml`）∥ prune 豁免沿用 ∥ 站点区块 ∥ 版本四点对盘 | D42 ∥ D41 版式 | §2.11.5 ∥ `docs/RELEASE.md` §5.6 Linux 臂 ∥ §6.5 判据 4 | 取回 200 ∥ `latest-linux.yml` 对盘 ∥ 站点核读 |
| 7 | 构建机流水线（配方 ∥ 工具链读数 ∥ 幂等重跑 ∥ 取回落位命名） | D42（构建通道） | §2.11.1 | T-DSK61（构建机读数） |

（**不在本批**：rpm ∥ Snap ∥ macOS（D42 边界）∥ 站点部署（父侧轮）∥ CI 矩阵（账单锁）；构建动作 = 实施/发布窗。）

**② 设计档落点**：`docs/desktop/design/PACKAGING.md` §1 **KD-73**；**§2.11**（2.11.1–2.11.6）；§3.4（本批块——10 行）；**§4.4**（验收面）；§5 **T-DSK61–63**；§6 **D42** 行；§2 页头/引言/§2.7 三处随动；`docs/RELEASE.md` §5.6（**Linux 臂 L1–L5** ∥ 标题 ∥ 定位 ∥ 构建机要求）+ §5.6 步骤 4（两平台键形 + 判据）∥ 完成判定 ∥ §5.1 图行 ∥ §6.5 判据 4。

**③ 机制设计（要点——全文 = 设计档）**

- **构建** = 内网构建机（ha-proxy）配方：浅克隆 → 三镜像环境（registry ∥ `ELECTRON_MIRROR` ∥ `ELECTRON_BUILDER_BINARIES_MIRROR`）→ `npm run package`（物化 → 两目标 → check-dist 闸）；幂等重跑 = `git fetch` + `reset --hard` → 清 `dist`；**不得单目标跑**（deb 单跑覆盖 feed——首跑探针实证）。
- **feed 分流** = `deb.publish: null`（目标级「don't publish」形——源读 `PublishManager.js:337-346`）⇒ `latest-linux.yml` 恰一条目 = AppImage；deb = 手动升级单元。
- **deb 无自动更新** = 双保险：feed 无 deb 条目 + **武装门扩**（`update.mjs` `updaterMediumOk`：Linux 仅 `APPIMAGE` 运行武装）；上游事实在案 = deb 仍携 `package-type: deb`（`FpmTarget.js:133-141` ∥ `PublishManager.js:193-194`——目标级 publish 管不到该径）⇒ 分流真值由我方门承担。
- **图标** = `build/icon.png`（256×256 · 2872 B · `icon.ico` 第 4 帧字节切片——本席实核逐字节相等，sha256 `08fe76b9…b57d`）+ `linux.icon` 显式。
- **执行序在案** = async 面（AppImage）先于非 async 面（deb）（`platformPackager.js:107-123`）⇒ AppImage 不携 `package-type`（提取读数 ② 拦）。

**④ 受影响文件与测试面**（现行 = 实读 2026-10-03；逐行 = 设计档 §3.4）：
`electron-builder.yml` 46 ⇒ ~62 ∥ `package.json` 26 ⇒ ~29 ∥ `build/icon.png` **新档** 2872 B ∥ `check-dist.mjs` 225 ⇒ ~300 ∥ `update.mjs` 217 ⇒ ~228 ∥ `main.mjs` 263 ⇒ ~267 ∥ `AGENTS.md` 25 ⇒ ~27 ∥ `CHANGELOG.md` 27 ⇒ ~33（`[Unreleased]`——段位随发布窗）；**批内件** = `docs/batches/2026-10-03-desktop-linux.test.mjs`（新档——图标帧断言 ∥ yml linux/deb 契约 ∥ package.json 三键 ∥ 门真值表 ∥ check-dist 分臂源扫）。

**⑤ 验收对照**：设计档 **§4.4**——机检 = check-dist Linux 臂（+9）∥ 构建机命令读数（`dpkg-deb -f` 两字段 ∥ AppImage 提取三读数）∥ 批内件；人工 = **T-DSK62**（用户真机）；发布窗 = **T-DSK63**（AppImage 更新链）。
**三链同源复核**：本批 7 条 ↔ 设计 §4.4 ↔ 需求卷 D42——各款全覆盖（D42 两处待收正项 = 上抛①）。

**⑥ 关键决策**：设计档 §1 **KD-73**（八点 + 被否六候选）；三处修复定形 = §2.11.2（表 3）；feed 分流键 = `deb.publish: null`（被否替代形在册）。

**⑦ 上抛项**

- ① 需求卷 **D42 行两处收正**（**主 agent 笔面**）：**构建通道**（现文「GitHub Actions 云构建」⇒ 内网构建机为主 ∥ GH Actions = 备用——证据 = 批档 §1 补记二）∥ **验收冒烟面**（现文「WSLg 冒烟（可自动面）+ 真机走查」⇒ check-dist + 提取读数（可自动）∥ 真机走查（人工）——WSL2 判死 = §1 补记）。
- ② 站点执行 = 父侧轮（规格 = 设计档 §2.11.5）。
- ③ 首跑后全链复跑（含 check-dist 闸）+ 读数（sha256 ∥ `dpkg-deb` ∥ 提取）入本档 §5——构建动作 = 实施/发布窗。
- ④ 披露：T-DSK61–63 号自铸；`build/icon.png` = 二进制入库（生成物形）；构建机凭据零入库。

**修复轮（机检红线清零——候评审前置）· 2026-10-03 · eng-designer**

来源 = 父侧 2026-10-03 20:4x 库读（`node scripts/doc-check.mjs` 仓根 = FAIL：锚 24 悬空 ∥ 行宽 6 超宽——全落本批新增面）。处置 = 纯形态收正（语义零改 ∥ 判定阈值 ∥ 配置零触 ∥ 他批 ∥ 他档零触）：

- **① 锚面 24 悬空 → 0**（全在 `docs/desktop/design/PACKAGING.md`）：域外第三方档坐标 **20 处裸名化**（R3 同形——`app-builder-lib` ∥ `electron-updater` 内部档；坐标原值以（`:N-M`）后置形**逐条保留**——信息零丢）∥ `renderer/index.html` 补 `thincoder-desktop/` 前缀（R1 同形）∥ `app-update.yml` 三处落（`resources/` 下）定位形。
- **② 超宽 6 行 → 0**（≤300）：`PACKAGING.md` 279 ∥ 282 ∥ 288 ∥ 393 + `docs/RELEASE.md` 280 ∥ 287（as-of 修复前编号）——子句界折行（续行缩进 2 空格）。
- **③ 复跑读数**（仓根）：`OK(锚): 0 条悬空（闸态——阈值 0）` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行（区带豁免在效——变更记录 ∥ 历史沿革；区带内超宽行不计）` ∥ `exit 0`；汇总 = 候选 45889 · 悬空 0 · 注记豁免 319 · 拟新增 49 · 迁移期引文 297 · 声明源缺位 0（注记豁免计数零膨胀——319 = 修复前同值）。
- 同拍：两档变更记录各 +1 行（PACKAGING ∥ RELEASE）。
- 行数面 2 条（报告态——PACKAGING L329 ∥ E2E-TESTING L249）= 修复前基线同值——非本轮面，零触。
- **状态 = 候评审就绪**（红线清零）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
