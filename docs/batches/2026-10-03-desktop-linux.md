# 2026-10-03 · 桌面 Linux 产物（AppImage ∥ deb ∥ 官网 ∥ 自动更新）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 17:27「能把linux版桌面端也做了吗？」+ 17:35「WSL2」（构建通道裁定）；承 D32/D40/D41 阶段二片——Linux 产物线开工。
> 台账 = #847（desktop · 归批）。前情 = docs/batches/2026-10-03-release-0-10-2.md §6（已收口 2026-10-03）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-03

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
**状态行**：设计完成（落点 = docs/desktop/design/PACKAGING.md §1 KD-73 ∥ §2.11 ∥ §3.4 ∥ §4.4 ∥ §5 T-DSK61–63 ∥ §6 D42 行；docs/RELEASE.md §5.6 Linux 臂 L1–L5；2026-10-03；机检红线修复轮（24 悬空 → 0 ∥ 6 超宽 → 0）∥ 评审修复轮（10 号全落——复跑 exit 0）∥ 实施窗回填轮（§3.4 ∥ §3.1 实测回填 ∥ 拟新增⇒已落 ∥ 父侧两笔读数——复跑 exit 0））
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

**评审修复轮（设计评审轮 1 · 10 号逐号 · 父侧裁 = 全采纳）· 2026-10-03 · eng-designer**

来源 = 本档 §3 设计评审轮次 1（VERDICT pass——🔴 0 ∥ 🟡 5 ∥ 🔵 5）。处置 = 10 号逐条落地（纯形态 ∥ 口径 ∥ 粒度收正 + 定裁句——均落评审授权面内；判定阈值 ∥ 配置 ∥ 他批 ∥ 需求卷零触）：

- **① §3.1/§3.3 收正**：CHANGELOG **19 ⇒ 27**（本批实读——重发窗并列）；main.mjs「242 = 该批 as-of」口径注（§3.3 头改「该批实施落盘 as-of 读数」——消同日双「现行」）。
- **② §2.11.3 拆分评审结论**：保留单档（三理由：读面共享 ∥ 硬限余量 ∥ 先例）∥ 抽档预案 = Linux 臂出档独立模块（主档汇流）∥ 触发判据 = 实读迫 500 硬限；§3.4 行 4 随拍。
- **③ §6 D42 ②** 翻「已收正（主 agent 笔面——已落）」+ 引需求卷 `docs/desktop/requirements/PACKAGING.md:16` ∥ `:24`；「现文」⇒「设计轮前案」（时点形）。
- **④ §2.8.1 门行补指针**（Linux 介质合项 = §2.11.4）+ §2.11.4 补未武装态菜单项定裁（enabled = true ∥ label 不变 ∥ 点按零效果）+ §3.4 行 10 列 §2.8.1 ∥ §2.9.7。
- **⑤ §2.11.5 站点区块按 §2.9.3 粒度补齐**：href 形 ∥ 按钮文案 ∥ 小字注 ∥ 系统要求句 ∥ 更新句。
- **⑥ AppImage 执行位前置**：§2.11.5（desktop.html 节）∥ T-DSK62 ①（`chmod +x`——或文件管理器放行）。
- **⑦ §4.4「提取三读数」⇒「四读数」**（对齐 §2.11.3 四项）；本段 ⑤「验收对照」行同口径随此收正（该正文行 append-only 不改——本块为准）。
- **⑧ §3.4 行 9 补预估（~380 行）+ 档位适用定裁**（同 .mjs 代码档——300 建议 ∥ 500 硬限为闸）。
- **⑨ cache-control 扩展名全集钉定**：§2.9.7 ∥ §2.11.5（含 `.AppImage`/`.deb`——「零改」成立：实测源读 `upload-download.mjs` 回退形已覆盖）。
- **⑩ §2.11.1 补适用范围句**（`Node.js >= 24` = 本仓开发 ∥ 产品运行面；构建机 = 构建链脚本载体）+ 换版条款含 `node` 主版本。

复跑 = 仓根 `node scripts/doc-check.mjs`：exit 0（悬空 0 ∥ 行宽 0——拟新增 ∥ 迁移期引文 ∥ 注记豁免与修复前同值，零净增）。`docs/RELEASE.md` 零触（10 号坐标全落 PACKAGING——逐号复核）。设计档变更记录 +1 行（PACKAGING.md）。

- 附：机检行数面差异 **2 ⇒ 1**——① §3.1 CHANGELOG 声明收正（19 ⇒ 27）顺带解消前批在册的 PACKAGING 侧一条；余 1 = `docs/desktop/design/E2E-TESTING.md:249`（`.gitignore` 表 8 ⇒ 实读 9）——前批在册报告态项，非本面（零触）。

**实施窗回填轮（设计档回填到实施实测——本档 §2 ④⑤ 随正）· 2026-10-03 · eng-designer**

来源 = 实施舱交付（本档 §5 终态读数）+ 父侧两笔（工程工具面——直接执行）。处置 = 纯回填 ∥ 读数（零语义改——契约 ∥ 判断句 ∥ 机制描述零动；需求卷 ∥ 站点仓 ∥ 实现代码零触）：

- **① 设计档 §3.4 翻「实施落盘」形态**（标题 ∥ 说明 ∥ 表头 ∥ 实测值回填）：`electron-builder.yml` **46 ⇒ 63** ∥ `package.json` **26 ⇒ 29** ∥ `build/icon.png` **新档 2872 B**（sha256 `08fe76b9…b57d`——父侧逐字节独立复算在案）∥ `check-dist.mjs` **225 ⇒ 339**（父侧面件（直接执行）——实跑：win32 对真实 dist 全绿 ∥ linux 臂空夹具逐条 fail-closed）∥ `update.mjs` **217 ⇒ 227** ∥ `main.mjs` **263 ⇒ 265** ∥ `AGENTS.md` **25 ⇒ 27** ∥ `CHANGELOG.md` **27 ⇒ 33**（父侧面件（直接执行））∥ 批内件 `docs/batches/2026-10-03-desktop-linux.test.mjs` **新档实读 172 行**（预估 ~380——差额披露 = §5 决策表 #5：五腿全在 ∥ 无 harness 需求）。
- **② 设计档 §3.1 读齐平 + §2.11.3 行数注收正**：yml **63** ∥ check-dist **339** ∥ package.json **29** ∥ CHANGELOG **33** ∥ update.mjs **227**（§3.1 各留前读链）；§2.11.3「行数：225 ⇒ ~300」⇒「225 ⇒ 339」——机检行数面「回填工单」PACKAGING 侧 5 条 → 0。
- **③「拟新增」⇒「已落」（设计档）**：`update.mjs` 两处随正（KD-71 ① ∥ §2.8.1 题面）；站点仓两项（`upload-download.mjs` ∥ `desktop.html`）维持「拟新增」（未落——执行 = 父侧轮）。
- **④ 原 ④ ∥ ⑤ 收正（本块为准——前正文行 append-only 不改）**：(a) **受影响表**（原 ④）= ① 所列各档实测（批内件 = **172** 行）；(b) **验收对照**（原 ⑤）= 机检：check-dist Linux 臂（+9——已落实读 **339** 行）∥ 构建机命令读数（`dpkg-deb -f` 两字段 ∥ AppImage 提取**四读数**——单源 = 设计档 §2.11.3）∥ 批内件（已落 **172** 行 · 5/5 绿）；人工 = **T-DSK62**（用户真机）；发布窗 = **T-DSK63**（AppImage 更新链）。
- **⑤ 披露 ∥ 上抛（父侧笔面）**：(a) `check-dist.mjs` 读数——机检/KD-4 口径实读 **339**（设计档 §3.1 ∥ §3.4 已按 339 落）；实施舱 §5 决策表 #6 载 **340**（差 1）——§5 侧如需对齐 = 父侧/实施舱笔面。(b) 机检行数面余 2 条：`docs/desktop/design/SHELL.md:177`（main.mjs 表 263 ⇒ 实读 265——本批 +2 随动；**非本轮写域**——报告在案）∥ `docs/desktop/design/E2E-TESTING.md:249`（.gitignore 表 8 ⇒ 实读 9——前批在册报告态项）。
- **⑥ 复跑读数**（仓根 `node scripts/doc-check.mjs`）：候选 45916 · 悬空 **0** ∥ 注记豁免 319 · 拟新增 46 · 迁移期引文 297 ∥ OK(锚) 0 悬空 ∥ OK(行宽) 0 超宽 ∥ exit **0**；行数面 = 报告态差异 **2** 条（= ⑤(b)；PACKAGING 侧 5 条清零）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（桌面 Linux 产物批 · 台账 #847）**——目标 = `thincoder/docs/desktop/design/PACKAGING.md`（KD-73 + §2.11.1–2.11.6 + §3.4 + §4.4 + §5 T-DSK61–63 + §6 D42 行）∥ `thincoder/docs/RELEASE.md` §5.6 Linux 臂 L1–L5 ∥ `thincoder/docs/desktop/requirements/PACKAGING.md` D42 行；计数 = 🔴 0 ∥ 🟡 5 ∥ 🔵 5。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Affected-file size annotations | 🟡 | §3.4「现行」读数与 §3.1/§3.3 实读不一致：`CHANGELOG.md` 计 19（`PACKAGING.md:335`、`:374`）vs §3.4 计 27（`:395`）——未自注；`main.mjs` 计 242（`:368`）vs 263（`:393`）——已自注「242 系该批 as-of 读数」，但 §3.3 头亦标「实读 2026-10-03」，同日双「现行」并存 | 把 §3.1/§3.3 两行收正到本批实读（或逐行补 as-of 口径注），消「现行」双值 |
| 2 | Affected-file size annotations | 🟡 | `scripts/check-dist.mjs` 预期 225 ⇒ ~300（`:391` ∥ `:283`）——自认「越 300 顾问线」，但拆分评审仅「随实读登记」，无顾问线结论（500 硬限侧有「断言族抽档」预案） | 本设计轮给出顾问线拆分评审结论（保留并说明理由 ∥ 抽档形态与触发判据） |
| 3 | Document ownership / cross-file state | 🟡 | §6 **D42** 行 ② 仍写需求卷「现文『GitHub Actions 云构建』⇒ 终态 = 内网构建机」且状态列「②上抛（主 agent 笔面）」（`PACKAGING.md:453`）；需求卷 D42 行现文已为「构建通道 = 内网构建机」（`requirements/PACKAGING.md:16`）且 `:24` 已记「设计轮收口…D42 两处收正」 | 按本档 §4.3「已落：D40 ∥ D41」先例，把 D42 ② 翻「已收正」并引需求卷行；「现文」措辞改时点形 |
| 4 | Clarity | 🟡 | 武装门合项（`updaterMediumOk`）只落 `:293-294`（§2.11.4）；§2.8.1 `:115` 的门定义未随拍、§3.4 改档集 `:397` 亦不含 §2.8.1；未武装态（deb）菜单项行为仅见用例行「点按零效果」（`:442`），enabled/label 未定裁 | §2.8.1 门行补指针（Linux 介质合项 = §2.11.4）或列入改档集；§2.11.4 补一句未武装态菜单项定裁 |
| 5 | Clarity | 🟡 | §2.11.5 站点区块规格（`:303-305`）粒度低于其自称体例：§2.9 承诺「零前置知识可实现（逐页 ∥ 逐段 ∥ 链接 ∥ 文案要点）」（`:164`），而 Linux 区块只写「AppImage ∥ deb 两直链 + 小字注」——无按钮文案/链接形；「系统要求行补 Linux 句」未给句面（对照 Windows 卡逐字 href/文案先例 `:188`） | 按 §2.9.3 粒度补齐 Linux 区块（href 形 ∥ 按钮文案 ∥ 系统要求句），或明示文案自由裁量 |
| 6 | Acceptance criteria | 🔵 | AppImage 走查/文案均只写「双击运行（FUSE）」（`:305` ∥ `:442`）；站点下载件是否携执行位未定（前提 = 下载路径通常不携执行位——未验证） | desktop 页 Linux 节与 T-DSK62 前置补 `chmod +x`（或明示文件管理器放行路径） |
| 7 | Clarity | 🔵 | §4.4 记「AppImage 提取三读数」（`:429`）vs §2.11.3 实列四项（app.asar ∥ `package-type` 不在 ∥ `.desktop` 名 ∥ 图标，`:285-286`） | 二处取一（建议按四项表述） |
| 8 | Affected-file size annotations | 🔵 | 批内件新档（`docs/batches/2026-10-03-desktop-linux.test.mjs`）无行数预估（`:396`）；先例批内件 376–410 行，档位适用未定裁 | 补预估行数或一句豁免/适用定裁 |
| 9 | Clarity | 🔵 | `:301` 称 upload-download.mjs cache-control「现档已覆盖（`.yml` ⇒ no-cache ∥ 余 ⇒ max-age=86400）——零改」；所引 §2.9.7 现文只列 `.yml`/`.exe`/`.blockmap`（`:215`），`.AppImage`/`.deb` 落点未列 | 覆盖判据钉成扩展名全集（含 `.AppImage`/`.deb`）再宣称零改 |
| 10 | Feasibility | 🔵 | 构建机 `node v22.22.2`（`:234`「工具链固定」）与 Project Guide「Node.js >= 24 only」并存——适用范围（构建脚本 vs 运行时）未述 | 补适用范围句，或把 Node 主版本纳入「换版 ⇒ 复跑配方复验」面 |

（范围外备注：需求卷 D40 行「Linux/mac ∥ 商店后加」分期句（`requirements/PACKAGING.md:14`）与 D42 落地后的现态表述可能需收正——不在本评审目标（目标 = D42 行），无严重度。）

**VERDICT: pass**（🔴 0 ∥ 🟡 5 ∥ 🔵 5）

## §4 用户批准（主 agent）

**2026-10-03 21:22 · 用户「都批」**——桌面 Linux 产物批（D42 · 台账 #847）获准进入实施（与崩溃族守卫批同批批准）。

- **依据（三条件齐备）**：① 设计评审通过（0🔴 ∥ 5🟡 ∥ 5🔵——发现表 = §3 轮次 1）；② 修复轮 10/10 落地并父侧逐条核验（`docs/desktop/design/PACKAGING.md` 十处 + 本档 §2；doc-check 复跑 exit 0）；③ 设计令牌已签发（**值不入档**）。
- **批准范围** = §2 全量（`build/icon.png` 入库 ∥ `package.json` 三键 ∥ `electron-builder.yml` 三改 ∥ `check-dist` Linux 臂 ∥ `update.mjs` 武装门扩 ∥ 批内件）；**构建机首链复跑 ∥ 取回落位 ∥ 站点三页** = 随发布窗（站点执行 = 父侧轮）。
- **批准态**：已批准（2026-10-03）

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-03


**§5 实施记录（eng-coder）——桌面 Linux 产物（D42 · 台账 #847）· 实施轮（initial）**

**交付摘要（改动表——file:line 级）**：

- `thincoder-desktop/build/icon.png`——**新档** 2872 B（`icon.ico` 第 4 帧字节切片：offset 1279 ∥ sha256 `08fe76b9466cf60a440c4215e98bb2f9adf5d6f87e6eaffd9616affe8408b57d`；二进制件经 node 逐字节落盘——write 工具为文本面，UTF-8 编码会破坏字节）。
- `thincoder-desktop/electron-builder.yml`——46 ⇒ **63** 行：L1 头注收正（Windows ∥ Linux 双面表述）；L45–56 linux 段（`target` = AppImage → deb 各 x64 ∥ `icon` = `build/icon.png` ∥ `category` = `Development` ∥ `syncDesktopName` = `true`）；L58–60 deb 段（`publish: null`——feed 分流键）；win 面 ∥ 总闸 `publish`（generic）∥ `artifactName` ∥ nsis 四参零动。
- `thincoder-desktop/package.json`——26 ⇒ **29** 行：L6–8 三键（`homepage` = `https://thincoder.com` ∥ `author` = `liwei <liwei@thincoder.com> (上海新舶)` ∥ `desktopName` = `thincoder.desktop`——用户定值逐字）。
- `thincoder-desktop/src/main/update.mjs`——217 ⇒ **227** 行：L41–43 `updaterMediumOk` 纯谓词导出（`platform !== "linux" || appImageEnv != null`）；头注随正（L10 门句 + L12 Linux 介质合项——§2.11.4）。
- `thincoder-desktop/src/main/main.mjs`——263 ⇒ **265** 行：L38 导入 +1；L227 装配注入三合项（`app.isPackaged && !SMOKE && updaterMediumOk({ platform: process.platform, appImageEnv: process.env.APPIMAGE })`）；L9 ∥ L223 注释随正。
- `thincoder-desktop/AGENTS.md`——25 ⇒ **27** 行：Commands 行（package）= per-host 平台构建（Windows NSIS ∥ Linux AppImage + deb · D42 · 构建机 · §2.11）+ 闸「win32 / linux branches」；macOS = later。
- `docs/batches/2026-10-03-desktop-linux.test.mjs`——**新档** 166 行 · 5 用例——五腿（图标帧 ∥ yml linux/deb 契约 ∥ package.json 三键 ∥ 门真值表 ∥ check-dist 分臂源扫）。

**机检读数**（仓根）：

- `node --test docs/batches/2026-10-03-desktop-linux.test.mjs` = **exit 0 ∥ 5 用例 5 绿**（显式 exit 码复跑 = 0）；
- 定向回归 = 前一版批内件（`docs/batches/2026-10-02-desktop-release-stage2.test.mjs`，update.mjs 重装配面）**11/11 绿**——本批 update.mjs/main.mjs 改动零损伤；
- icon.png sha256 = `08fe76b9466cf60a440c4215e98bb2f9adf5d6f87e6eaffd9616affe8408b57d`（与 ICO 帧 4 逐字节相等——复算在案）；
- check-dist 源扫（腿⑤）读数：`runLinuxChecks` ∥ §2.11.3①–⑨ 九注 ∥ `process.platform` 分臂 ∥ 余平台非零出口「无断言臂」∥ win 臂零动——逐条在册（断言对象 = 父侧已落现档 340 行）；
- 行数面读数：yml **63**（§3.4 预期 ~62）∥ package.json **29**（~29）∥ update.mjs **227**（~228）∥ main.mjs **265**（~267）∥ AGENTS.md **27**（~27）∥ 批内件 **166**（预估 ~380——见决策表 #5）。

**决策透明表**：

| # | 决策 ∥ 披露 | 依据 ∥ 理由 |
|---|---|---|
| 1 | `build/icon.png` 经 node 字节切片落盘（非 write 工具） | 二进制件（PNG 任意字节）——write 工具为文本面会破坏字节；切片 = 零转换（与 `icon.ico` 帧 4 逐字节相等，复算在案） |
| 2 | yml 头注 L1 收正（「阶段一 = Windows NSIS」⇒ 双面表述） | 文件已含 Linux 段 ⇒ 旧头注成 stale（注释-代码一致性；属该档「+注释」面内，超行表逐字清单半步——披露） |
| 3 | main.mjs L9 头注门句随正 | 与 L223 ∥ L227 新门自洽（审计点③查询后自修） |
| 4 | `scripts/check-dist.mjs` ∥ `CHANGELOG.md` 零触 | 父侧工程工具面（已落 340 行）∥ 父侧维护面——非本侧写域 |
| 5 | 批内件实读 166 行（设计预估 ~380——§3.4 行 9） | 五腿全在 ∥ 断言 ~70 条（含定值断言）∥ 无 harness/替身需求（先例档含重装配面）；差额 = 文件账预估面——读数归 §6 收口/回填轮 |
| 6 | 行数面：check-dist 340（~300 越顾问线） | 设计已预授权「保留单档」（§2.11.3——距 500 硬限余量充足）；父侧面件（直接执行） |

**审计与代码评审轮次与终态**：

- **差异审计（explore · 只读）轮 1 · 2026-10-03**：四类偏差（缺口 ∥ 静默简化 ∥ 文档漂移 ∥ 表外改动）= **零**；批内件五腿假绿核查 = 无（逐腿核）。分级发现：**F1**（blocking · 记录面——§5 在盘为空）⇒ 本块补写即闭；**F2**（advisory——批内件 166 行 vs 预估 ~380，文件账面）；**F3**（advisory——check-dist 340 vs ~300，父侧面、预授权）；**F4**（advisory——腿② win 零回归覆盖边界提示）⇒ fix 轮 1 补断言即闭；**F5**（审计限制——其装配无执行面，未复跑复算；替代 = 本侧显式复跑读数在案，收口复跑 = 父侧）。
- **fix 轮 1 · 2026-10-03**：① §5 补写（F1 闭）；② 腿② 增 7 条结构/签名面零回归断言（`asar` ∥ `directories` ∥ `files` ∥ `signtoolOptions.sign` ∥ `signingHashAlgorithms` ∥ `appId` ∥ `productName`——F4 闭）；复跑批内件 = **5/5 绿（exit 0）**。
- （评审（advisor code）轮 1——结果随附后块。）

**§5 实施记录（eng-coder）——后续块 · 评审轮次 ∥ fix 轮 2 ∥ 终态 · 2026-10-03**

**评审（advisor code）轮 1**（对象 = 7 档改动面 + 验收档）：**VERDICT = pass**（🔴 0 ∥ 🟡 1 ∥ 🔵 5）。响应处置：

- 🟡 #1（构建机复跑随发布窗 ∥ `build/icon.png` 入库态文件面不可核）＝ 接受（父侧轮——批准范围已含；报告上抛）；
- 🔵 #2（批内件行数 vs 设计预估 ~380——数字漂移）＝ 接受（父侧回填轮收正 §3.4）；
- 🔵 #3（js-yaml 传递依赖解析脆弱）＝ **fix 轮 2 修**；
- 🔵 #4（腿⑤源扫无运行时面）＝ 接受（设计定裁 = 源扫；行为面归构建机读数）；
- 🔵 #5（空串 APPIMAGE 判武装 ∥ 设计逐字钉定）＝ 接受不改（实施面私改违单源；收口 = 下一轮设计面小改可选）；
- 🔵 #6（未武装日志措辞漏新判由）＝ **fix 轮 2 修**。

**fix 轮 2 · 2026-10-03**：

- `thincoder-desktop/src/main/update.mjs`（:153 ∥ :180 ∥ :209）：未武装三处日志 `(dev / --smoke)` ⇒ `(dev / --smoke / non-AppImage Linux)`（保留 `not armed` 子串——批内件腿④断言不破；纯字符串面，行数仍 227）；
- `docs/batches/2026-10-03-desktop-linux.test.mjs`（:28-35）：js-yaml 解析加 try/catch——裸 `MODULE_NOT_FOUND` ⇒ 点名可读失败（**166 ⇒ 172 行**）；
- 复跑读数：本批内件 **5/5 绿（exit 0）** ∥ stage2 批内件 **11/11 绿**（旧措辞零断言冲突——确认在案）。

**评审（advisor code）轮 2（fix-claim 核验——范围收窄）· 2026-10-03**：**VERDICT = pass**——#6 Fixed ∥ #3 Fixed（最低档满足；残余 = 传递依赖解析未换 ①/②，维持 🔵 非阻塞）∥ #1/#2 维持（非阻塞：协调项 ∥ 回填账）∥ #4/#5 维持（设计定裁面，非缺陷）；新引入问题 = 0。范围外备注（无严重度）：`docs/batches/2026-10-02-desktop-release-stage2.md:192` 逐字引旧措辞（记录层 as-of 读数——父侧可裁）。

**终态：clean（收敛）**——差异审计轮 1（四类偏差零）+ 评审轮 1（pass）+ fix 轮 1/2 + 评审轮 2（pass）。终态读数：批内件 **172 行 ∥ 5 用例** ∥ update.mjs **227** ∥ main.mjs **265** ∥ yml **63** ∥ package.json **29** ∥ AGENTS.md **27** ∥ icon.png **2872 B**（sha256 `08fe76b9466cf60a440c4215e98bb2f9adf5d6f87e6eaffd9616affe8408b57d`）。

## §6 验证与收口（父代理）

**批次**：desktop-linux（D42 · 台账 #847 · 2026-10-03）——§1 起全链（讨论 → 设计 → 评审 → 修复 → 批准 → 实施 → 回填 → 收口）。

**验证读数（父侧亲跑——不采信自报）**
- 批内件 `node --test docs/batches/2026-10-03-desktop-linux.test.mjs` = **EXIT 0**（5 用例 5 绿）。
- 定向回归 `docs/batches/2026-10-02-desktop-release-stage2.test.mjs` = **EXIT 0**（11/11）。
- `thincoder-desktop/build/icon.png` = sha256 `08fe76b9…b57d`；**对 `build/icon.ico` 第 4 帧（offset 1279 · size 2872 · PNG 签名）逐字节独立复算 = BYTE-EQUAL**。
- 桌面套件 `npm test` = EXIT 0（空清单制度）。
- `thincoder-desktop/scripts/check-dist.mjs`（父侧直接执行件）：win32 臂**对真实 dist 全绿**（5 断言 + B/F 逐字 + 更新面 4 + 签名读数）∥ linux 臂对空夹具逐条 fail-closed；**339 行**（KD-4 内容行数口径）。
- 抽查：`electron-builder.yml`（linux ∥ deb 段逐值；win 段零动）∥ `package.json` 三键逐字 ∥ `update.mjs:41-42` 谓词 ∥ `main.mjs:227` 装配注入三合项。
- doc-check 复跑 = **EXIT 0**（悬空 0 ∥ 行宽 0；行数面差异 **2 ⇒ 1**——`SHELL.md:177` 父侧小笔已修；余 1 = `E2E-TESTING.md:249`〔前批在册 #836〕）。

**验收对照（条目 → 读数）**：R1 ✅（`icon.png` 入库 + `linux.icon` 显式）∥ R2 ✅（三键 = 用户定值逐字）∥ R3 ✅（`deb.publish: null` + linux 段）∥ R4 ✅（`updaterMediumOk` 导出 + 装配注入）∥ R5 ✅（`AGENTS.md` Commands 行）∥ R6 ✅（批内件五腿）∥ AC①–⑤ ✅（批内件 5/5 ∥ sha256 ∥ 契约逐值 ∥ 门真值表 ∥ 行数读数）。

**结算**
- 台账：**#847** ⇒ 在途 → 待核销 → **已核销**（依据 = 本档 §6 ∥ 提交 `e008844`（check-dist 父侧笔）∥ `28be794d`（CHANGELOG 父侧笔）∥ `ffe107c9`（源面实施））。
- **发布窗三项（父侧轮 · 登记）**：T-DSK61 构建机修后首链复跑 + 读数 ∥ 产物取回 `D:\WSL\artifacts\<版本>\` ∥ 站点三页 + feed 上传（§2.11.5）。**T-DSK62 = 用户面**（Linux 真机走查）；**T-DSK63 = 发布窗**（AppImage 更新链）。
- 父侧直接执行披露（可 revert）：`check-dist.mjs`（工程工具面）∥ `CHANGELOG.md`（父侧维护面）∥ `SHELL.md:177` 计数小笔。
- check-dist 行数口径 = **339**（KD-4 内容行数）——§5 载「340」= 实施舱原文换行计数；以 339 为准。
- 前批遗留复核：`E2E-TESTING.md:249`（#836 在册——非本批）；暂缓批复核：无。

**对外口径**：仓内件全落（图标 ∥ 元数据 ∥ feed 分流 ∥ 校验臂 ∥ 武装门）；**真产物验证 = 构建机修后首链（发布窗）**——首链绿前，本批不作「Linux 产物可用」的对外宣称。

**提交**：`e008844` ∥ `28be794d` ∥ `ffe107c9` ∥ 本收口轮记录提交（随后）。
