# 桌面端（DESKTOP）· 打包与发行（打包链 · Windows 安装包 · 官网托管）

> 面 = **打包与发行面**——打包链（`electron-builder.yml`）· Windows NSIS x64 安装包（签名就绪）· 官网（thincoder.com）托管（阶段一）· **自动更新（electron-updater ∥ generic feed——§2.8）** · **官网桌面面（站点仓规格——§2.9）**；本档是该面的单源设计。
> 需求侧 = 需求分卷（本域卷 = `docs/desktop/requirements/PACKAGING.md`——**D12 ∥ D32 ∥ D40 ∥ D41 ∥ D42**；查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**）；总览 ∥ 跨域决策 ∥ 索引 = `docs/desktop/design/PROJECT.md`；发布线 = `docs/RELEASE.md`（阶段 3b——桌面端首版已登记发布单元）。
> 建档 = 2026-10-02（文档体系重组批 #813 · 波 1——内容逐字迁自 `docs/desktop/design/PROJECT.md` §2 / §4.1 / §4.2 / §5 / §6.1 / §7 / §10，as-of 2026-10-02；段号随迁重编（§5.x ⇒ §2.x）；迁移前原址 = 各源档保位指针）。
> **行数纪律（300 建议 ∕ 500 硬限）只对代码档**（`.mjs` ∥ `.cjs` ∥ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

## 1. 关键决策（KD-6 ∥ KD-64）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-6 | 打包工具 = **`electron-builder`**（**构建期 devDep**，非运行期依赖） | 三目标（win / mac / linux）一套声明 + 产物类型齐全（NSIS / dmg / AppImage / deb）；校验与分发脚本可挂——照扩展端 `package` → `postpackage` → `publish:all` 三段先例（`thincoder-vscode/package.json:124-134`） | **`@electron/packager` + 手写安装器**（安装器自研 = 三平台各自踩坑）· **`electron-forge`**（插件面与模板产物更宽，配置面大于需要）· **仅 zip 免安装**（需求 D12 要求「可安装可启动」） |
| KD-64 | **桌面打包分发 · 阶段一**（桌面打包发布批 · 2026-10-01 · 台账 #807 · 需求 D32 分期令 + 用户签名补正 22:23 ∥ 22:5x）：① **作用域**——阶段一 = 打包链（`electron-builder.yml`）+ **Windows NSIS x64 安装包**（签名就绪）+ 官网（thincoder.com）托管直链；阶段二 = 免安装包 ∥ macOS ∥ Linux 产物 ∥ 应用商店（Windows 商店 ∥ Snap）（**自动更新 = 本档 §1 KD-71——桌面发布·阶段二批落**）；② **配置契约** = §2.1 单源表（`appId` `com.thincoder.desktop` ∥ `productName` `ThinCoder` ∥ `win.target = nsis`(x64) ∥ `artifactName = ThinCoder-Setup-${version}.${ext}` ∥ `win.icon = build/icon.ico` ∥ asar 缺省 ∥ `files` 白名单（`src/**` + `renderer/**` + `package.json`——app 面；生产依赖（两核包）由 node-module 收集器独立随装——实读 `app-builder-lib/out/fileMatcher.js:177-191`「grab only excludes」+ `out/platformPackager.js:350-368` 两 matcher 分列）∥ NSIS assisted 四参）；③ **两核包内嵌 = 物化（源树实拷 · 自脚本 `scripts/materialize-deps.mjs`）**——判由 = electron-builder **无 follow-symlinks 面**（junction 经 `lstat` 入账 ≢ directory ⇒ 不入递归队列（`out/util/NodeModuleCopyHelper.js:102-104`）；symlink 入 asar = `{type:"link"}` 节点（`out/asar/asarUtil.js:196-207`）⇒ 装后断链）+ §2.3 纪律「打包物化一律源自源树」；④ **构建序列** = 物化（`prepackage` 自跑）→ `npm run package`（`postpackage` = check-dist 闸）→ `dev-link.mjs --force` 恢复 + `--check` = 0（终态）；⑤ **签名就绪**（GlobalSign EV 已到位：`CN=Shanghai Xinbo Technology Co., Ltd.` ∥ 指纹 `1B89F84D20EF2BE361D178EE2EA41228879CBE02` ∥ eToken 5300 ∥ SAC 10.9）——`win.signtoolOptions.sign` = **hook**（`scripts/win-sign.mjs`：指纹探测 ⇒ 在位实签（载体二择——详 §2.3；RFC3161 时间戳）∥ 缺席跳过 + 明示——两态同管线）；时间戳 = GlobalSign RFC3161（URL 实现期实测选定；备选 = DigiCert 缺省）；构建期要求 = UKey + SAC + PIN（构建者在场）；签名态读数 = check-dist 读 PE 证书表（信息行——发布版要求 = 已签）；⑥ **图标** = `build/icon.ico`（多尺寸 16–256）· 生成器 `scripts/make-icon.mjs`（零依赖 ∥ 确定性 ∥ `</>` + `#2563eb` = 站点 favicon 同形）；⑦ **版本源** = `package.json` `version` 单源（桌面号段 · 首版 **0.10.1**——发布窗定号）；⑧ **check-dist 续填** = §2.5 断言表（安装包名形 × 版本 ∥ 预载 ∥ 渲染面 ∥ 签名态）；⑨ **官网托管** = 键形 `downloads/ThinCoder-Setup-<号>.exe` + 独立上传小件（站点仓——规格 = 批档 §2；不并 `deploy-oss.mjs`：全量遍历 + prune 误删面（`deploy-oss.mjs:230-238`）⇒ 附带 `downloads/` 前缀豁免加固）；⑩ **发布线** = `docs/RELEASE.md` 阶段 3b（构建 → 产物校验 → 上传 → 官网挂载；发布动作 = 用户门）；**边界** = 更新通道扩展（beta ∥ 回滚）= 不做（自动更新 = **KD-71**）∥ 阶段二余项零触 ∥ 站点仓零写（规格 = **KD-72**——§2.9） | 需求 D32 分期令（用户 2026-10-01 22:19）+ 签名两则（22:23 ∥ 22:5x）；机制实读 = `app-builder-lib`（v26.15.3 在盘）四坐标；VSC 先例对位 = `docs/RELEASE.md` §5.5（分器分流：vsce = link + follow ∥ electron-builder = 物化） | **被否**：link 形 + follow（electron-builder 无该面——junction 不入 asar 实体）；`npm install --install-links` 物化（registry 快照——违「源自源树」）；`certificateSubjectName` 直配（token 缺席 ⇒ 构建硬失败——无降级形）；免安装 zip 同批（多一产物面 = 多断言 ∥ 上传 ∥ 页面三项面）；`deploy-oss.mjs` 并入（prune 误删 ∥ 重传面）；下载键不带版本号（缓存陈旧面） |

| KD-71 | **桌面自动更新（阶段二）= electron-updater + generic feed（三件面同批落）**（桌面发布·阶段二批 · 2026-10-02 · 台账 #810）：① **应用侧**——`thincoder-desktop/src/main/update.mjs`（已落 · 策略面零 `electron` ∥ 零 `electron-updater` 顶层 import ∥ 注入缝——先例 = `heap-watch.mjs`）+ `main.mjs` 装配（`createRequire` 取 `autoUpdater`）；**行为合同** = 启动自检（`app.whenReady()` 后 10s 一次/会话；门 = `isPackaged ∧ 非 --smoke`）→ 静默下载（`autoDownload = true` 显式）→ 提示重启（通知一次/版本 + 帮助菜单「检查更新…」状态机——§2.8.1 表）；安装 = `autoInstallOnAppQuit = true`（退出即安静安装）∥ 菜单点按 = 确认框 ⇒ `quitAndInstall(true, true)`（安静 + 装后重拉——6.8.9 源读在册）；**零新事件通道**（主进程原生面——`onNative` 缝 +1〔`update` 第四项〕；`ev:menu` 六值 ∥ `EVENT_CHANNELS` 24 ∥ 白名单 47 零动；渲染面零接线）；② **构建侧**——`publish` = `{ provider: generic, url: https://thincoder.com/downloads/ }`（§2.1 行）；生成物 = `latest.yml`（落 dist 根）+ `app-update.yml`（随 `resources/`——源读在册——§2.8.2）；check-dist +4 断言；依赖 = `electron-updater ^6.8.9` 入 `dependencies`（**首个第三方运行依赖**——声明面三处收正）；③ **站点侧** = feed 三件（`thincoder.com/downloads/` 下：exe ∥ blockmap ∥ `latest.yml`——§2.8.3；上传序 exe→blockmap→latest.yml ∥ prune 豁免 ∥ 版本四点对盘）；**边界** = 单通道（beta ∥ 回滚 ∥ 降级不做）∥ 周期拍不做 ∥ 渲染面更新面不做（须新通道）∥ 发布动作 = 用户门 | 台账 #810（用户 2026-10-02 00:44 问询 + 「开始」令 = 采用）；可行性 = 标准件（electron-updater 6.8.9 ∥ v6.8.9 源读 2026-10-02）；触发面 = D36 菜单批「检查更新（归 #810）」挂点承接 | **被否**：`publish` 缺省（undefined ⇒ update-info 路径崩——#807 构建窗实证）· `autoDownload = false` 手动下载（违「静默下载」口径）· 渲染面提示面（须新 IPC 通道——违零新通道）· beta/alpha 通道（超范围）· 应用内进度 UI（打扰会话）· 周期拍（会话期单次自检足够） |
| KD-72 | **官网桌面面（阶段二）= 站点仓页集扩建 + 发布随动（一次性规格）**（桌面发布·阶段二批 · 2026-10-02 · 台账 #826）：① **页集**——`thincoder.com/www/desktop.html`（拟新增——桌面新页，照 `cli.html`/`vscode.html` 先例，§2.9.2 章节规格）∥ `download.html` 桌面卡置首（直链安装包 + 版本 ∥ 系统要求行 ∥ 更新句——§2.9.3）∥ `index.html`（三条入口 ∥ meta——§2.9.4）∥ `about.html`（版本行 + 桌面——§2.9.5）∥ `changelog.html`（桌面节——首发 v0.10.1——§2.9.6）∥ 导航全站同拍（桌面项在 VS Code 后）∥ `sitemap.xml` ∥ **零图**（截图位 = 不设——沿全站零 `<img>` 先例）；② **脚本**——`gen-changelog.mjs` desktop 臂 ∥ `deploy-oss.mjs` prune 豁免 ∥ `upload-download.mjs` 新档（feed 上传——§2.9.7）；③ **版本面三处**（about ∥ download ∥ changelog 页头）= 号随发布（`docs/RELEASE.md` §6.1/§6.5 口径——桌面 = 源树）；**执行 = 父侧轮**（站点仓独立仓——子代理零写；本档 = 规格单源）；**边界** = 零样式 ∕ 零设计体系改动（只加内容面与既有类）∥ 零构建保持 ∥ `install.html` 主体不做（桌面安装步骤归 desktop 页——阶段一边界保持）∥ Linux ∕ mac 面不做 | 台账 #826（用户 2026-10-02 21:39「网站要更新加上桌面版的介绍」）；形态 = 照 cli/vscode 先例（父侧建议 · 用户「开始」= 采用）；与 #810 咬合面 = 更新 feed 托管（§2.8.3） | **被否**：截图区（全站零图先例——后续要点图另行小笔）· 并入 `install.html` 主体（阶段一边界——桌面手册归专页）· changelog 桌面节插在 VS Code 节前（RELEASE.md §6.2 定「随其后」）· `deploy-oss.mjs` 吞上传（全量遍历 + 大件重传——阶段一已否） |
| KD-73 | **桌面 Linux 产物（AppImage ∥ deb · 构建机链 · 更新面分流）**（桌面 Linux 产物批 · 2026-10-03 · 台账 #847 · 需求 D42）：① **产物与目标**——`AppImage`（免安装单文件——主 ∥ 自动更新单元）+ `deb`（Debian/Ubuntu 系——手动升级单元）双目标 × x64；`artifactName` 承全局模板（`ThinCoder-Setup-${version}.${ext}`——首跑实产在册，零改）；② **构建通道 = 内网构建机**（代号 ha-proxy · `10.0.0.5` · Ubuntu 22.04.5 · x86_64 · 首跑全链实证——配方 = §2.11.1；**备用** = GitHub Actions（`.github/workflows/linux-build.yml` 在册——org 账单锁未解，零动）；WSL 两代判死 = 批档 §1 补记 ∥ 补记二）；③ **仓内修复三处**（现状 ⇒ 修法 ⇒ 判据 = §2.11.2 表 3）：**图标**（Linux 拒 `.ico` ⇒ 入库 `build/icon.png`（256×256 · 2872 B——`build/icon.ico` 第 4 帧字节切片 · 零转换）+ `linux.icon` 显式）∥ **deb 元数据**（fpm 要 homepage + author.email ⇒ `package.json` 补 `homepage` ∥ `author`——2026-10-03 用户定值）∥ **feed 分流**（`latest-linux.yml` 不得含 deb 条目 ⇒ `deb.publish: null`——deb = 手动升级单元，不产 update-info）；④ **更新面分流**（AppImage 跟 D40：feed 单条目 ⇒ `AppImageUpdater` 拾取；deb = **无自动更新**——双保险：feed 无 deb 条目 + 武装门扩「Linux 仅 AppImage 运行（`APPIMAGE` 在）」；上游事实在案：`electron-builder` 仍向 deb 资源面写 `package-type: deb` ∥ `app-update.yml`（`PublishManager.js`（`:193-194`）该径不过目标级 publish）⇒ 分流真值由我方门承担）；⑤ **产物校验** = check-dist **Linux 臂**（+9 断言——§2.11.3；平台分臂同脚本）；⑥ **验收**（可自动面 = check-dist 绿 + AppImage 结构提取读数；人工面 = 用户真机走查——**WSLg 面不可行**〔WSL2 判死〕⇒ 重裁 = §2.11.3）；⑦ **站点与发布**（feed 上传序 = AppImage → deb → `latest-linux.yml` 末传 ∥ `downloads/` prune 豁免沿用 ∥ 站点区块规格 = §2.11.5；发布线 = `docs/RELEASE.md` §5.6 Linux 臂）；⑧ **取回落位** = `D:\WSL\artifacts\<版本>\`（版本子目录——消 `latest-linux.yml` 跨版本覆盖面）；**边界** = rpm ∥ Snap ∥ macOS 不做（D42）∥ 构建机图形冒烟（xvfb/GUI 栈）不做 ∥ CI 矩阵待账单锁解 ∥ 站点执行 = 父侧轮 ∥ Linux 签名面不做（两产物均不签） | 需求 D42（用户 2026-10-03 17:27 ∥ 17:35）+ 批档 §1 补记二（首跑三缺项 + 实产读数）；机制实读 = `app-builder-lib@26.15.3` ∥ `electron-updater@6.8.9`（在盘）八坐标（`FpmTarget.js`（`:133-141`） ∥ `PublishManager.js`（`:193-194`） ∥ `:337-360` ∥ `AppImageTarget.js`（`:135-143`） ∥ `platformPackager.js`（`:107-123`） ∥ `LinuxTargetHelper.js`（`:203-219`） ∥ `:296-313` ∥ `iconConverter.js`（`:190-207`）；拾取面 = `Provider.js`（`:74-90`）） | **被否**：两目标分两次单跑（后跑覆盖 `latest-linux.yml`——首跑探针实证 deb-only 输出）；`deb.publish: {publishAutoUpdate:false}`（绕、键义偏移）；`linux.publish: null` 除 deb 资源面（AppImage 需 `app-update.yml`——同源不可分）；仅靠 feed 无 deb 条目、不设武装门（静默失败尝试 ∥ 语义靠巧合）；`artifactName` 去「Setup」（首跑实产 + 站点/校验同刻改名——无必要）；图标 512 重绘（品牌形零改；256 = ICO 帧上限） |

## 2. 打包链与发行面（需求卷 D12 ∕ D32）

> **阶段（D32 分期令 · 2026-10-01）**：**阶段一** = 打包链（`electron-builder.yml`）+ **Windows 安装包**（NSIS x64 · 签名就绪）+ 官网（thincoder.com）托管下载；**阶段二** = 免安装包 ∥ macOS ∥ 应用商店（Windows 商店 ∥ Snap）（后批）；**Linux 产物 = D42 批（§2.11）** ∥ **自动更新 = KD-71（§2.8）落**。机制 ∕ 契约单源 = 本档 §1 **KD-64**（本节 = 实施与操作面展开）。

### 2.1 打包配置契约（`thincoder-desktop/electron-builder.yml` · 阶段一）

| 项 | 值 | 说明 |
|---|---|---|
| `appId` | `com.thincoder.desktop` | 应用标识（Windows AUMID 载体） |
| `productName` | `ThinCoder` | 安装目录 ∕ 快捷方式 ∕ 卸载项显示名 |
| `directories.output` | `dist`（缺省） | 产物落点（check-dist 读面） |
| `win.target` | `nsis`（`arch: ["x64"]`） | 阶段一单目标；免安装 zip = 阶段二 |
| `win.icon` | `build/icon.ico` | 图标资产（§2.4） |
| `artifactName` | `ThinCoder-Setup-${version}.${ext}` | 产物名携版本（§2.5 断言面） |
| `asar` | `true`（缺省保持） | 应用包 = `dist/win-unpacked/resources/app.asar`（核包断言面） |
| `files` | `["src/**", "renderer/**", "package.json"]` | 显式白名单（`scripts/**` ∥ `tools/**` ∥ `test/**` 不入包）；**生产依赖独立随装**（实读 `fileMatcher.js`——node-module matcher 只取 `!` 排除、不受 include 白名单约束） |
| `nsis.oneClick` | `false`（assisted） | 安装目录可改的前置 |
| `nsis.perMachine` | `false`（per-user） | 免 UAC 提升 |
| `nsis.allowToChangeInstallationDirectory` | `true` | 用户可改安装目录 |
| `nsis.deleteAppDataOnUninstall` | `false`（缺省） | 卸载不删用户数据（会话 ∥ 配置住 `~/.thincoder/`——家目录面本不随包） |
| `win.signtoolOptions.sign` | `scripts/win-sign.mjs`（hook） | 签名就绪形——§2.3 |
| `win.signtoolOptions.signingHashAlgorithms` | `["sha256"]`（显式） | 消双重调用——v26 缺省 = `["sha1","sha256"]` ⇒ 自定义 hook 每文件被调两轮（实施实测在册）；显式单算法 ⇒ 运行面单轮 |
| `publish` | `{ provider: generic, url: https://thincoder.com/downloads/ }`（channel 缺省 `latest`） | **更新面总闸**（§2.8）：update-info（`latest.yml`）+ `app-update.yml` 路径启用；generic 无上传面（源读：`scheduleUpload` 对 generic 直接返回）——上传恒走站点小件（§2.8.3）；`npm run package` 不触发发布（isPublish 三否——源读在册） |

（快捷方式 ∥ 开始菜单项 = electron-builder NSIS 缺省（建）——不显式配置。）

### 2.2 构建序列（发布窗内）

1. **物化**：`node scripts/materialize-deps.mjs`——两核包 junction ⇒ 真目录（**源树实拷**：`../thincoder-core` ∥ `../thincoder-render-core` 直读；排 `test/**` ∥ `.thincoder/**`；`core` 携 `prompts/` 16 + `tool-docs/` 52）；`prepackage` = 自动前置（`npm run package` 一条链自足）
2. **打包 + 校验**：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm run package`（`postpackage` 自动跑 check-dist——闸；**产物面 = 安装包 + `.blockmap` + `latest.yml`**（update-info——§2.8.2）∥ `resources/app-update.yml` 随包）
3. **恢复 dev 链**（收窗）：`node scripts/dev-link.mjs --force` → `node scripts/dev-link.mjs --check` = 0（终态判据）

（签名 = 内联（hook 自动）；证书在位 ⇒ 实签 ∥ 缺席 ⇒ 跳过 + 明示。物化后忘恢复 = dev 链 `materialized` 态——`--force` 恢复，窗口内预期态。`publish`（§2.1）——generic 契约 ⇒ update-info（`latest.yml`）∥ `app-update.yml` 随构建生成（§2.8.2）；官网上传 = 站点小件（§2.8.3）——链完整至 `postpackage` 闸。）

### 2.3 签名就绪（GlobalSign EV · 两态同管线）

- **证书（已到位 · 2026-09-30 验活）**：GlobalSign EV——主题 `CN=Shanghai Xinbo Technology Co., Ltd.` ∥ 指纹 `1B89F84D20EF2BE361D178EE2EA41228879CBE02` ∥ 载体 = eToken 5300（SafeNet）USB token ∥ SAC 10.9 在装 ∥ 实签 PE 已通过。
- **签名载体 = 二择（2026-10-01 预检）**：① **PowerShell `Set-AuthenticodeSignature`（主）**——零依赖 ∥ 本机实证：证书库指纹 + eToken 5300 实签 `.ps1` ⇒ status Valid ∥ verify Valid（签名者 = `CN="Shanghai Xinbo Technology Co., Ltd."`）；② **`signtool`（备）**——仅当实施期可得（Windows SDK ∥ `winCodeSign` 缓存下载）。
- **载体预检实得（2026-10-01）**：`signtool` 本机未装——PATH ∥ `C:\Program Files (x86)\Windows Kits` ∥ electron-builder 缓存三查零命中 ⇒ 主路径取 ①（零依赖 ∥ 已证）。
- **机制**：`win.signtoolOptions.sign` → `scripts/win-sign.mjs`（hook）——证书库探测（指纹）：**在位** ⇒ 经载体实签（二择——上行）+ 明示行；**缺席** ⇒ **跳过 + `⚠ 未签名 …` 明示**（构建零失败——未签版可测）。
- **时间戳** = GlobalSign RFC3161（URL 实现期实测选定并回填本行）；备选 = DigiCert（electron-builder 缺省）。
- **构建期要求**：UKey 在位 + SafeNet SAC 驱动在 + 签名时 **PIN 弹窗**（构建者需在场）。
- **签名态读数** = check-dist 读产物 PE 证书表（「已签 ∥ 未签」信息行——不闸；**发布版要求 = 已签**）。

### 2.4 图标资产

`thincoder-desktop/build/icon.ico`——多尺寸（16 ∕ 32 ∥ 48 ∥ 256）单文件入库（构建输入）。源 = `scripts/make-icon.mjs`（零依赖生成器 · 确定性可复跑——圆角方块 `#2563eb` + `</>` 白字形；与站点 `favicon.svg` 品牌形同源）。

### 2.5 产物校验（check-dist 续填——`scripts/check-dist.mjs`）

| 断言 | 形 | 说明 |
|---|---|---|
| 核包随产物 ×2（既有） | asar 内 `node_modules/@thincoder/{core,render-core}/package.json` 存在 + `version` 逐字 = 源 | B ∕ F 对位；未物化 ⇒ 判红 |
| 安装包 | `dist/ThinCoder-Setup-<源版本>.exe` 存在 | 名形 × 源 `package.json` 版本一致 |
| 预载 | asar 内 `src/preload/preload.cjs` 存在 | 隔离三件之一随包 |
| 渲染面 | asar 内 `thincoder-desktop/renderer/index.html` 存在 | `/rc/` 根由核包断言承载 |
| 签名态 | 产物 PE 证书表读数（已签 ∥ 未签） | 信息行——不闸 |

（**本批续填（断言 +4）= §2.8.2**——`latest.yml` 两读 ∥ sha512 对盘 ∥ `app-update.yml`。）
（fail-closed 不变：缺一即 exit 1 + 显式提示。）

### 2.6 失败面（构建链）

| 症状 | 根因 | 处置 |
|---|---|---|
| `dist` 缺 ∥ 核包断言红 | 未物化 ∥ 物化失败 | 重跑物化（先 `dev-link --check` 判链态） |
| 版本不匹配红 | 旧构建残留 | 清 `dist` 重跑 package |
| 签名跳过明示 | token 未插 ∥ SAC 缺 ∥ 证书库探测无该指纹 | 明示行指名；发布版须复跑至「已签」 |
| `signtool` 缺席（备载体不可得） | Windows SDK 未装 ∥ `winCodeSign` 缓存未下载 | **回退主载体**（PowerShell `Set-AuthenticodeSignature`——零依赖 ∥ 本机已证）——不回退为「跳过」 |
| Electron ∥ NSIS 二进制下载失败 | 网络 | 镜像：`ELECTRON_MIRROR` ∥ `ELECTRON_BUILDER_BINARIES_MIRROR`（实读 `electronGet.js` 环境变量族） |
| dev 链 `materialized` 残留 | 物化后未恢复 | `node scripts/dev-link.mjs --force` → `--check` = 0 |
| nsis 尾段崩溃：`Cannot read properties of null (reading 'channel')`（`updateInfoBuilder.ts`） | `publish` **缺省（undefined）** ⇒ v26 update-info 路径 `computeChannelNames` 读 null——整链非零退出 ⇒ `postpackage` 闸被截断未跑 | 显式 `publish` 契约（§2.1——generic provider 形；**须显式**：undefined 即崩；`null` = 官方「don't publish」形——二择皆显式）⇒ update-info ∥ `app-update.yml` 路径按契约启停；修后链完整过闸 |

### 2.7 其余面（阶段一）

| 项 | 形态 |
|---|---|
| 工具 | `electron-builder`（构建期 devDep）；声明面 = `thincoder-desktop/electron-builder.yml`（本批落——§2.1） |
| 目标（分期） | **Windows**（NSIS 安装器 · x64——阶段一落）；**Linux** = AppImage + deb（**D42 批——§2.11**）；**后批** = macOS（dmg + zip——签名 ∕ 公证随发布前置）· 免安装 zip |
| script 六条（单源 · 本行） | `test` = `node test/run.mjs`；`start` = `electron .`；`prepackage` = `node scripts/materialize-deps.mjs`（物化自跑——§2.2）；`package` = `electron-builder`；`postpackage` = `node scripts/check-dist.mjs`（产物校验——§2.5）；`quickcheck` = `node tools/web-quickcheck/run.mjs`（渲染面 web 快筛——**非套件** ∥ 不作验收门；单源 = `docs/desktop/design/WEB-QUICKCHECK.md`）——分发走发布计划（`docs/RELEASE.md` §5.6——桌面端首版已登记发布单元），非 script 名 |
| 验证面（三层） | ① **产物存在性**：check-dist（§2.5——机检闸）；② **产物可启**：真机冒烟（装 → 启 → 卸——§5 **T-DSK55**；CI 面随三平台 CI 批）；③ **三端共享契约零回归**：与另两端互读互写同一份配置与会话（需求档 A2） |
| CI | `.github/workflows/test.yml` 增平台矩阵（需求档 A3：本机 Windows 实跑，另两平台以 CI 为验证面——随阶段二） |
| 版本与升级 | 版本号 = CalVer（各端同制，`docs/RELEASE.md` §4——桌面 = 新号段 · 首版 `0.10.1`）；**升级路径 = 自动更新（主——§2.8）∥ 手动下载覆盖（兜底——两径并存）**；产物名 = §2.1 `artifactName` |
| 依赖镜像纪律（2026-09-29 · 台账 #394；本批补构建工具链镜像） | **依赖安装 ∕ 打包带镜像**：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`（Electron 二进制——命令形 = `ELECTRON_MIRROR=… npm install` ∕ `ELECTRON_MIRROR=… npm run package`）＋ **`ELECTRON_BUILDER_BINARIES_MIRROR`**（NSIS 等构建工具——**实测选定** = `https://npmmirror.com/mirrors/electron-builder-binaries/`（构建窗 2026-10-02 实测：NSIS 工具下载必需——无镜像时 `read ECONNRESET`（`nsis-3.0.4.1.7z` 下载）实据在册）；环境变量族实读 = `app-builder-lib/out/util/electronGet.js:506-515`）；同指 = `thincoder-desktop/scripts/check-dist.mjs` 头注（指向本节） |

### 2.8 自动更新（阶段二 · electron-updater ∕ generic feed——批档 §1 需求登记③ ∥ 台账 #810）

> **定位**：桌面 = **自更新安装单元**（Windows 安装包——启动自检 ∥ 静默下载 ∥ 提示重启；**不打断会话**）。
> 三件面 = 应用侧（§2.8.1）∥ 构建侧（§2.8.2）∥ 站点侧 feed（§2.8.3）。**单通道**（stable——generic feed 一条）∥ **升级两径并存**（自动更新为主 ∥ 手动下载覆盖为兜底）。
> 发布随动 = `docs/RELEASE.md` §5.6（步骤 2 ∥ 步骤 4 ∥ 完成判定）+ §6.5 判据 4。

#### 2.8.1 应用侧（行为合同——`thincoder-desktop/src/main/update.mjs`（已落）∥ `main.mjs` 装配）

- **载体与装配**：`electron-updater`（6.8.9——v6.8.9 源读在册：事件族 ∥ `autoDownload` 缺省 `true` ∥ `autoInstallOnAppQuit` 缺省 `true` ∥ `quitAndInstall(isSilent, isForceRunAfter)` 位置参形）；
  装配面 = `main.mjs`（`createRequire` 取 `autoUpdater`——CJS 互操作；electron 原语（`Notification` ∥ `dialog` ∥ `app.isPackaged` ∥ `app.getVersion()`）全落装配面）；
  **策略面零 `electron` ∥ 零 `electron-updater` 顶层 import**（注入缝 = `updater` ∥ `notify` ∥ `menuRefresh` ∥ `dialog` ∥ `log`——平 node 直测；先例 = `heap-watch.mjs` 注入缝形）。
- **武装门（判据）**：`app.isPackaged === true` 且非 `--smoke`（未打包 ⇒ 库自身 `isUpdaterActive()` 返回 false——双保险；**冒烟读数面零增字段**——沿 KD-59 ⑤ 字段闭集契约）；**Linux 介质合项**（仅 AppImage 运行武装——`APPIMAGE` 在）——单源 = §2.11.4。
- **启动自检**：`app.whenReady()` 后**延时 10s 一次** `checkForUpdates()`——**会话期单次**（无周期拍）；延时由 = 避开启动 I/O 峰值与首帧窗。手动面 = 菜单项随时可再查（状态机行）。
- **静默下载**：`autoDownload = true`（显式落定——缺省同值，显式免漂移）；下载期**零 UI**（不接 `download-progress` 呈现——仅 stderr 详情行）；
  **不打断会话（判据）**：检查 ∥ 下载全异步（事件驱动、stream 化）——**零模态框 ∥ 零窗口操作 ∥ 零会话面读写**：与在飞回合 ∥ 子代理零互斥（更新面不调任何 session ∥ agent API）。

**状态机（五态——菜单面判据）**：

| 状态 | 触发 | 菜单项（帮助组） | 点按行为 |
|---|---|---|---|
| `idle` | 初始 ∥ 无更新 ∥ 失败复位 | 「检查更新…」enabled | 手动检查（见下） |
| `checking` | `checkForUpdates()` 发起 | 「正在检查更新…」disabled | — |
| `downloading` | `update-available`（自动下载中） | 「正在下载更新…」disabled | — |
| `ready` | `update-downloaded` | 「重启以安装更新」enabled | 确认框 ⇒ `quitAndInstall(true, true)` |
| `idle`（静默回转） | `error` | 「检查更新…」enabled | 手动检查 |

- **手动检查三果**：`update-available` ⇒ 转下载态（静默续跑）∥ `update-not-available` ⇒ 对话框「已是最新版本（v<当前号>）」∥ `error` ⇒ 对话框「检查更新失败」+ 一行原因（**不自动重试**——下次启动即自动重试面）。
  `checking` ∥ `downloading` 态点按无效（disabled——库内重入返在途 promise，双保险）。
  **下载期失败（含手动检查转入下载者）** = **保留全静默**（与自动面 fail-soft 同款——不弹框 ∥ 状态回 `idle`；零 nag ∥ 可再点菜单重试 ∥ 自动重试 = 下次启动面）——**有意为之**：对话框仅覆检查期 `error`。
- **提示重启（两原生面 · 零新事件通道）**：① **通知**——`update-downloaded` 时一次/版本（native `Notification`；句 = 「更新已就绪——重启后自动安装（v<号>）」；点击 ⇒ 聚焦主窗（reveal 先例）——**不直接安装**：安装入口唯一 = 菜单项）；② **菜单项**——帮助组「检查更新…」（状态机上行；状态迁移 ⇒ `refreshMenu()` 重建）。
  **零新通道（判据）**：`ev:menu` 动作集六值零动 ∥ `EVENT_CHANNELS` 24 零动 ∥ preload 白名单 47 零动 ∥ 渲染面零接线（`onNative` 缝 **+1**——`update` = 宿主自办第四项）。
- **安装时机（两径）**：① `autoInstallOnAppQuit = true`（显式落定）——**正常退出即安静安装**（下次启动 = 新版本）；
  ② 菜单点按径 = 原生确认框（「重启并安装更新（v<号>）？进行中的任务将被中断。」∥ 按钮「重启安装」/「取消」）⇒ `quitAndInstall(true, true)`（**安静安装 + 装后重拉新版本**——v6.8.9 源读：`isSilent ⇒ /S` ∥ `isForceRunAfter ⇒ --force-run`）。
- **失败面（自动面 · fail-soft）**：全静默——stderr 详情行 + 状态回 `idle`（**零 nag ∥ 零自动重试 ∥ 零弹框**）；更新面失败不影响应用使用；「重启安装未起」兜底 = 下次退出 `onQuit` 径再试（真机腿 = T-DSK60）。
- **词面**：菜单四项（`checkUpdate` ∥ `checkingUpdate` ∥ `downloadingUpdate` ∥ `restartUpdate`）+ 对话框/通知七项——值住 `menu-words.mjs`（本批扩键 32 ⇒ 43——zh/en 对照；消费 = 装配面注入；该档宪章句随拍扩为「应用菜单与更新面词表」）。
- **边界（不做）**：周期拍 ∥ beta/alpha 通道 ∥ 回滚 ∥ 降级安装 ∥ 更新历史 UI ∥ 应用内进度 UI ∥ 渲染面更新面（须新通道）∥ 更新设置开关（零配置键——单行为）。

#### 2.8.2 构建侧（publish 契约 ∥ 生成物 ∥ 断言 ∥ 依赖）

- **配置契约**（`electron-builder.yml`——§2.1 同行）：`publish = { provider: generic, url: https://thincoder.com/downloads/ }`（channel 缺省 `latest`）。
  **generic 无上传面**（源读：`scheduleUpload` 对 generic 直接返回）∥ `npm run package` 不触发发布（isPublish 判 = release 脚本 ∥ git tag ∥ CI 三否——源读在册）——**上传恒走站点小件**（§2.8.3）。
- **生成物（构建窗）**：`dist/ThinCoder-Setup-<号>.exe` + `.exe.blockmap`（差分块图——已在产）+ **`latest.yml`（落 dist 根）**（update-info——`computeChannelNames` 缺省单通道 ⇒ 恰一档；
  字段 = `version` ∥ `files[0].url` ∥ `files[0].sha512` ∥ `path` ∥ `sha512` ∥ `releaseDate`——v26 源读）+ `app-update.yml`（随 `win-unpacked/resources/` 入包——`provider` ∥ `url` ∥ `updaterCacheDirName`）。
- **check-dist 续填（断言 +4——闸内 · fail-closed）**：① `latest.yml`（dist 根）存在 ∥ `version` = 源版本；② `files[0].url` = `ThinCoder-Setup-<源版本>.exe`（逐字）；③ `files[0].sha512` = 安装包实算（形 = 基 64 **带填充**——实施窗钉定「无填充」经构建窗实读收正：`latest.yml` 实读 `…DxfQ==`；check-dist 按填充不敏感实现——真兼容）；
  ④ `app-update.yml`（`win-unpacked/resources/` 下）存在 ∥ `provider: generic` ∥ `url` = 契约值。
- **依赖面**：`electron-updater`（^6.8.9——registry 实读 2026-10-02）入 `dependencies`——**首个第三方运行依赖**；声明面三处收正：`package.json` description ∥ `AGENTS.md`（「Zero third-party runtime dependencies…」句）∥ 本档。
  传递依赖族（fs-extra ∥ js-yaml ∥ lazy-val ∥ lodash.escaperegexp ∥ lodash.isequal ∥ semver ∥ tiny-typed-emitter ∥ builder-util-runtime——registry 元数据实读）由生产依赖收集器随装（`files` 白名单零动）。
  - **签名校验链（实读在册）**：builder 缺省 `win.verifyUpdateCodeSignature !== false` ⇒ `app-update.yml` 携 `publisherName`（签名面可算时）⇒ 更新器对下载件验 Authenticode（`NsisUpdater.verifySignature`）；实得读数 = **`Shanghai Xinbo Technology Co., Ltd.`**（证书 CN——构建窗实读回填）。
- **CHANGELOG**：实施轮落 `[Unreleased]` 段（Added——自动更新句；F2 口径——发布窗定号）。

#### 2.8.3 站点侧（feed 托管——路径 ∥ 上传 ∥ 判据）

- **路径布局**（桶 `thincoder-com`；同前缀同目录——更新器解析形 = 源读：`newBaseUrl` 补尾斜杠 ⇒ base + 文件名；channel 文件 = `latest.yml`）：
  `thincoder.com/downloads/` 下三件——`ThinCoder-Setup-<号>.exe` ∥ 同名 `.blockmap` ∥ `latest.yml`（桶键 = `downloads/` 前缀 + 文件名）。
- **上传序（判据）**：**exe → blockmap → latest.yml**（`latest.yml` **末传**——消「新号已可见而包未就绪」窗）；失败 = 从失败件重传（幂等 PUT）。上传载体 = 站点小件 `thincoder.com/scripts/upload-download.mjs`（拟新增——§2.9.7）。
- **prune 豁免**：`deploy-oss.mjs` prune 面加 `downloads/` 前缀豁免（下载件 ∥ feed 不在 `www/` 本地集——无豁免即被误删；改动点 = §2.9.7）。
- **同号重传**：重签 ∥ 重建同号 ⇒ **三件全重传**（`latest.yml` 内 sha512 随变）；取回核验加查询串绕缓存（同法 = `docs/RELEASE.md` §5.6 步 4）。
- **版本四点对盘（发布窗判据）**：`latest.yml.version` = 源 `package.json` `version` = 安装包名内号 = 站点版本面号（前两 = check-dist；后两 = 站点核验——`docs/RELEASE.md` §6.5）。

### 2.9 官网桌面面（站点仓 `thincoder.com` · 规格——执行 = 父侧轮）

> **定位**：站点仓 = 独立仓（子代理零写）；本规格 = **零前置知识可实现**（逐页 ∥ 逐段 ∥ 链接 ∥ 文案要点——父侧照做即可）。
> 口径锚 = `docs/RELEASE.md` §6（版本面 ∥ changelog 分节）；本轮 = 一次性页集扩建 + 发布随动面（feed——§2.8.3）。**样式零改**（只用既有类：`page-header` ∥ `content` ∥ `download-cards` ∥ `download-card` ∥ `btn btn-primary` ∥ `section-title` ∥ `version-date` ∥ `nav-links`）。

**2.9.1 页集与导航（触点全集）**

- 新页 `thincoder.com/www/desktop.html`（拟新增——桌面专页，照 `cli.html`/`vscode.html` 先例）：结构 = nav（同站）→ `page-header`（h1「桌面版指南」+ 副句）→ `main#main.content` 六节（§2.9.2）。
- 导航全站同拍（**11 档** = 10 现行页 + 新页）：每页 `nav-links` 增一行 `<li><a href="desktop.html">桌面</a></li>`——插位 = 「VS Code」行后；`desktop.html` 本页项携 `class="active"`。
- `www/sitemap.xml`：`<url><loc>https://thincoder.com/desktop.html</loc></url>` 增行（`vscode.html` 行后——与导航同序）。
- **零图**（沿全站零 `<img>` 先例）；截图位 = **不设**（如后续要点图：唯一预留位 = `page-header` 下全宽单幅——非本批）。

**2.9.2 desktop.html 章节（六节 · 文案要点）**

1. `<h2>安装</h2>`——Windows 10 ∥ 11（x64）；安装包从下载页获取（链 `download.html`）；双击安装、**按用户安装（不需要管理员权限）**；配置与会话与 CLI ∥ VS Code **共用**（`~/.thincoder/`——任一端配置即三端生效）。
2. `<h2>开始使用</h2>`——菜单 文件 → 打开工作目录…；会话 = 标签页多会话并行；输入框描述任务、Enter 发送；工具调用与审批与另两端同源（安全模式默认——改动前先确认）。
3. `<h2>界面</h2>`——左列会话标签 ∥ 中列对话流 ∥ 右列活动池（子代理与任务实时可见）；主题 = 亮 ∥ 暗 ∥ 跟随系统（设置面切换）。
4. `<h2>模型与配置</h2>`——模型 ∥ 提供商与 CLI、VS Code 共用 `~/.thincoder/config.json`；设置面（菜单 设置 → 设置…）七段：渠道、agent 参数、MCP、运行环境、工具与服务、会诊与审查、模型。
5. `<h2>自动更新</h2>`——启动后自动检查更新：发现新版本**后台静默下载**（不影响当前工作）；下载完成后在菜单 帮助 → 检查更新 处**重启安装**，或**下次退出应用时自动完成安装**；手动下载覆盖安装兜底（配置与会话不丢）。
6. `<h2>系统要求</h2>`——Windows 10 ∥ 11（x64）；安装包约 108 MB；至少一个支持的模型提供商账号。

（`<title>` = 「桌面版指南 — ThinCoder」；`meta description` = 「ThinCoder 桌面版指南：Windows 安装、界面、会话与自动更新。」；副句 = 「Windows 桌面入口——安装、界面与自动更新」。）

**2.9.3 download.html**

- **桌面卡置首**（`download-cards` 第一块；形 = 既有卡同构）：icon 🖥️（emoji 先例——🧩 ∥ ⌨️ 同族；**收正**：阶段一前案 `</>` 不在卡位——`</>` 系品牌位形）∥ `h3`「桌面版」∥ 简介：「自带窗口的完整桌面应用——多会话标签页、活动池，独立于编辑器；与 CLI、VS Code 共用同一份配置与会话。」
  主按钮 `<a href="https://thincoder.com/downloads/ThinCoder-Setup-0.10.1.exe" class="btn btn-primary">下载 Windows 安装包</a>`（**版本号随发布**——href 与小字注两处）∥ 小字注：「Windows 10 ∥ 11（x64）· v0.10.1 · 约 108 MB；安装后自动保持最新」。
- **系统要求节**：列表**首行**插入 `<li><strong>桌面版：</strong>Windows 10 ∥ 11（x64）· 当前版本 0.10.1（截至最新发布）</li>`（余两行零动；序 = 与卡序一致）。
- **更新节**：段首补句「桌面版启动后自动检查更新，新版本后台静默下载、重启即完成安装；也可下载新版本覆盖安装。」（余句零动）。
- `meta description` 收正：「下载 ThinCoder：桌面版（Windows 安装包）、CLI（npm 全局安装）与 VS Code 扩展（市场或 .vsix 侧载）。」
- 「完整安装手册」句收正：「…见 <a href="install.html">完整安装手册</a>（CLI ∕ VS Code）与 <a href="desktop.html">桌面版指南</a>。」

**2.9.4 index.html**

- 「怎么工作」节：「两条入口」⇒「**三条入口**」；新增一段（置于「终端（CLI）」段前）：「**桌面版（Windows）** — 独立窗口应用，自带完整界面与会话管理；与 CLI、VS Code 共用配置与会话。<a href="desktop.html">了解桌面版 →</a>」。
- `meta description`：「ThinCoder 是运行于桌面、VS Code 与终端的 AI 编程 Agent。零依赖、独立判断、对代码负责——是你可以信任的技术搭档。」（余零动。）

**2.9.5 about.html**

- 版本行：「当前版本：**桌面版 0.10.1** / **CLI 0.12.67** / **VS Code 扩展 0.9.7**（最新版本请查阅发布页）」（号随发布——三处同值纪律 = `docs/RELEASE.md` §6.1；余零动）。

**2.9.6 changelog.html**

- 「VS Code 扩展」节收口（「更早版本」块）后追加：`<h2 class="section-title">桌面端</h2>` + 首发条目 `<h2>v0.10.1 <span class="version-date">2026-10-01</span></h2>` + `<ul>` 三条要点（人读门择要——内部机制择除）：Windows 安装包（安装目录可改 ∥ 按用户安装免管理员）∥ 数字签名（GlobalSign EV——安装与运行无 Windows 安全告警）∥ 桌面入口首发（会话标签页 ∥ 活动池 ∥ 设置面；与 CLI ∕ VS Code 共用配置与会话）。
- 页头副句加桌面：「（桌面版 0.10.1 · CLI 0.12.67 · VS Code 扩展 0.9.7）」。

**2.9.7 站点仓脚本（三件）**

- `thincoder.com/scripts/gen-changelog.mjs`（站点仓 · 档已在）：增 `--side desktop` 臂——输入 = `thincoder-desktop/CHANGELOG.md`（工作区兄弟路径——`--desktop` 可覆盖）；`--since` 缺省 = `0.10.1`；`GAPS.desktop` = 无（零缺段）；用法注释同拍。
  判据 = 跑 `--side desktop` 输出含 `v0.10.1` + 日期（骨架形 = 既有 `--side` 两值同式）。
- `thincoder.com/scripts/deploy-oss.mjs`（站点仓 · 档已在）：prune 过滤行（`:234`）追加 `&& !k.startsWith("downloads/")`（**downloads 前缀豁免**——下载件 ∥ feed 不在 `www/` 本地集，无豁免即被 `OSS_DELETE=1` 误删）。
- `thincoder.com/scripts/upload-download.mjs`（**拟新增**——feed 上传小件；不并 `deploy-oss.mjs`——全量遍历 ∥ 大件重传两由）：
  用法 = `node thincoder.com/scripts/upload-download.mjs <文件…>`（键 = `downloads/` 前缀 + 文件名）；OSS HMAC 签名式照 `thincoder.com/scripts/deploy-oss.mjs:84-101`；`DRY_RUN=1` 预览（零凭证可跑）；
  凭证 = `OSS_KEY`/`OSS_SECRET`（`ALIYUN_KEY`/`ALIYUN_SECRET` 兜底）；cache-control = `.yml`（含 `.yaml`）⇒ `no-cache`；**余档全集**（`.exe` ∥ `.blockmap` ∥ `.AppImage` ∥ `.deb`）⇒ `max-age=86400`；出口 = 非零即失败可读。
- **部署分工**：页面集走 `deploy-oss.mjs`（`www/` 全量）；feed 三件走 `upload-download.mjs`（§2.8.3 上传序）。

### 2.10 发布窗承接（前批余项 · 台账 #807——非本批实施；发布动作 = 用户门）

| # | 项 | 处置 | 时点 | 依据 ∥ 锚 |
|---|---|---|---|---|
| 1 | **原装位重跑**（canonical `npm run package` 至默认 `dist/`） | 锁释放后跑一趟（postpackage 闸同跑）——终产物构件与 `dist-r4` 同链同源 | 发布窗内（锁释放后） | #807 批档 §6 构建窗核验 |
| 2 | **残留清理**（`dist` 被压旧树 ∥ `dist-r3` 半成品） | 重跑前清理（防 check-dist「版本不匹配」红——§2.6 行） | 发布窗前 | 同 #807 批档 §6 余账 |
| 3 | **T-DSK55 ③**（卸载格 + 数据保留） | 用户择时走查（会断当前会话窗口——基线已钉 `~/.thincoder`） | 发布窗内（用户在场） | 本档 §5 T-DSK55 行 ③ |

（另：#807 站点轮余项 → 本批吸收 = §2.9 ∥ §2.8.3；`deploy-oss` prune 加固与 `gen-changelog` desktop 臂 = 前批 §6 **DE ②∥④** 的落盘点——本批 §2.9.7 兑现。）

### 2.11 Linux 打包链与发行面（D42 · 2026-10-03 · 台账 #847）

> **定位**：Linux 双产物（**AppImage** 主 ∥ **deb**）——构建在**内网构建机**（非本机：WSL 两代判死 ∥ 云构建待账单锁——批档 §1 补记 ∥ 补记二）；机制 ∕ 契约单源 = §1 **KD-73**（本节 = 实施与操作面展开）。站点面 = §2.11.5（规格——执行 = 父侧轮）。

**2.11.1 构建通道与流水线（构建机 = ha-proxy）**

- **构建机读数（首跑实证 · 2026-10-03）**：Ubuntu 22.04.5 · x86_64 · 2C/1.6G/32G；`node v22.22.2` ∥ `npm 10.9.7` ∥ `git 2.34.1`；gitee ∥ npmmirror ∥ github 直连皆 200。**工具链固定** = 上述读数（不追新；**换版 ⇒ 复跑配方复验**——含 `node` 主版本；`node -v` ∥ `npm -v` 读数入构建记录）。
- **适用范围（Project Guide「Node.js >= 24」）**：该口径 = **本仓开发 ∥ 产品运行面**要求；本读数 = **构建面**——构建机 `node` 为构建链脚本载体（`npm install` → 打包 → 校验，首跑全链实证在册），产物运行时不依赖之（内嵌 Electron 自带运行时）。
- **配方（首跑全链实证——唯一入口）**：

  ```bash
  cd ~ && git clone --depth 1 https://gitee.com/shanghai-xinbo/thincoder.git     # 首次（~ = /home/<user>）
  cd ~/thincoder/thincoder-desktop
  npm config set registry https://registry.npmmirror.com                          # 机器级（一次性）
  export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
  export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
  npm install --no-audit --no-fund
  npm run package    # prepackage（物化）→ electron-builder（linux 两目标）→ postpackage（check-dist Linux 臂 = 闸）
  ```

  （**镜像纪律**：npm registry ∥ Electron 二进制 ∥ electron-builder 工具三面 = 构建机纪律（npmmirror 族）；`npm run package` 一条链自足——物化自跑 ∥ check-dist 自跑，同 §2.2。构建机直连实证在册——镜像保确定性、非绕墙。）
- **幂等重跑**（源码刷新 → 清产物 → 重走链）：`cd ~/thincoder && git fetch origin && git reset --hard FETCH_HEAD` → `rm -rf thincoder-desktop/dist`（消旧产物 ∥ 防 §2.6「版本不匹配」∥ 防 `latest-linux.yml` 混版）→ 重走配方（`npm install` 幂等）。
- **重跑纪律（唯一边界）**：**不得单目标构建**——`--linux deb` 单跑会以 deb-only `latest-linux.yml` 覆盖既有 feed 产物（首跑探针实证在册）；feed 产物恒由**两目标同跑**的面产出。
- **产物**（dist 根三件）：`ThinCoder-Setup-<号>.AppImage` ∥ `ThinCoder-Setup-<号>.deb` ∥ `latest-linux.yml`（另存 `linux-unpacked/` = 中间面——不入取回清单）。
- **取回落位命名**：`D:\WSL\artifacts\<版本>\`（三件平铺——版本子目录消 `latest-linux.yml` 跨版本覆盖面；现行 `D:\WSL\artifacts\` 散件 = 首跑在案，不回迁）；取回 = scp/ssh 会话（**凭证 = 父侧自持、零入库**）；回取后读数 = 三件 sha256（与构建机对盘——记录入实施 §5）。

**2.11.2 配置契约与仓内修复**

**（a）`electron-builder.yml` linux ∥ deb 段（新增——逐值；列于 `nsis` 块后 ∥ `artifactName` 前，win 面零动）**：

| 项 | 值 | 说明 |
|---|---|---|
| `linux.target` | `AppImage`(x64) ∥ `deb`(x64) | 双目标同跑；执行序 = async 面（AppImage）先于非 async 面（deb）（`platformPackager.js`（`:107-123`））⇒ AppImage 打包发生在 deb 写资源面之前——AppImage 不携 `package-type` |
| `linux.icon` | `build/icon.png` | 显式（缺省发现面存在——候选含 `icon.png`（`iconConverter.js`（`:119-129`））；显式 = 读面自明 ∥ 消歧——同 `win.icon` 先例） |
| `linux.category` | `Development` | 消缺省 `Utility` 警告（`LinuxTargetHelper.js`（`:296-313`））；值 = freedesktop 主类 |
| `linux.syncDesktopName` | `true` | `.desktop` 文件名 ∥ `StartupWMClass` ∥ Electron `app_id` 三者同源（`LinuxTargetHelper.js`（`:203-219` ∥ `:249-259`））——消窗口关联警告 |
| `deb.publish` | `null` | **feed 分流键**（官方「don't publish」形）：deb = 手动升级单元——目标级 `publish: null` ⇒ 该目标零 update-info 条目（`PublishManager.js`（`:337-346`））；AppImage 条目不损 |
| `artifactName`（零动） | 全局 `ThinCoder-Setup-${version}.${ext}` | 承现行模板（首跑实产 `…0.10.2.AppImage` ∥ `…0.10.2.deb` 在册） |

**（b）`thincoder-desktop/package.json` 新增键（2026-10-03 用户定值）**：

| 键 | 值 | 判据 |
|---|---|---|
| `homepage` | `https://thincoder.com` | fpm 硬前置（缺 ⇒ deb 目标失败——`FpmTarget.js`（`:79-83`））；deb `Homepage` 字段源 |
| `author` | `liwei <liwei@thincoder.com> (上海新舶)` | fpm 硬前置（`author.email` 缺 ⇒ 构建失败——`FpmTarget.js`（`:85-93`） ∥ `errorMessages.js`（`:4`））；deb `Maintainer` 派生 = `liwei <liwei@thincoder.com>`（company 后缀不入派生） |
| `desktopName` | `thincoder.desktop` | 窗口关联（Electron `app_id` ∥ WM_CLASS 源——与 `linux.syncDesktopName: true` 成对；`scheme.json` syncDesktopName 描述） |

**（c）图标资产**：`build/icon.png` 入库——256×256 · 2872 B · `build/icon.ico` **第 4 帧字节切片**（零转换；本档实核：`icon.ico` 4 帧（16 ∥ 32 ∥ 48 ∥ 256），第 4 帧 offset 1279 · size 2872——与提取件逐字节相等，sha256 `08fe76b9…b57d`）；生成物入库形同 `build/icon.ico` 先例；**漂移检测** = 批内件断言「PNG ≡ ICO 第 4 帧」。

**2.11.3 产物校验（check-dist Linux 臂）与验收**

- **平台分臂（同脚本 `scripts/check-dist.mjs`）**：`win32` ⇒ 现行 Windows 臂零动；`linux` ⇒ 下述断言（闸 · fail-closed）；余平台 ⇒ 显式「无断言臂」非零退出（零静默）。
- **Linux 臂断言（+9）**：① `linux-unpacked/resources/app.asar` 在（读面同 win 臂）；② 核包 ×2（core ∥ render-core）在 ∧ 版本逐字 = 源（对位 B ∕ F——读函数沿用，路径换 linux-unpacked）；③ 预载（`src/preload/preload.cjs`）在；④ 渲染面（`thincoder-desktop/renderer/index.html`）在；
  ⑤ `ThinCoder-Setup-<源版本>.AppImage` 在（名形 × 版本逐字）；⑥ `ThinCoder-Setup-<源版本>.deb` 在；⑦ `app-update.yml`（`linux-unpacked/resources/` 下）在 ∧ `provider: generic` ∧ `url` = 契约值；
  ⑧ `latest-linux.yml` 在 ∧ `version` = 源 ∧ `files[0].url` = AppImage 名（逐字）∧ `files` 恰一条 ∧ `path` = 同名 AppImage ∧ `sha512` = AppImage 实算（基 64 填充不敏感）**∧ 全条目不携 `.deb`**（feed 分流判据）；
  ⑨ dist 残留扫（`.AppImage` ∥ `.deb` 名携非源版本 ⇒ 红——扩现行 guard）。
  （行数：225 ⇒ 339——越 300 顾问线 ⇒ **拆分评审结论 = 保留单档**：① 全臂共享同一产物读面与同一 fail-closed 闸——分档增跨档间接；② 距 500 硬限余量充足；③ 先例 = `src/main/window.mjs`（336 越线在册——保留形）。**抽档预案** = Linux 臂断言族出档独立模块（`scripts/` 下——主档汇流调用；档名实施窗定）——**触发判据** = 实读迫 500 硬限（任一追加批先核读；将越 ∥ 已越 ⇒ 该批先抽档）。）
- **构建机命令级判据（check-dist 外——不可纯读面）**：`dpkg-deb -f dist/ThinCoder-Setup-<号>.deb Maintainer` = `liwei <liwei@thincoder.com>` ∧ `Homepage` = `https://thincoder.com`（deb 控制段 = xz 压缩——node 纯读不可及 ⇒ 住构建机清单；读数入 §5）。
- **AppImage 结构提取读数（可自动面 ∥ 构建机）**：`./ThinCoder-Setup-<号>.AppImage --appimage-extract` ⇒ `squashfs-root/`：① `resources/app.asar` 在；② `resources/package-type` **不在**（AppImage 不得携 deb 面）；
  ③ `.desktop` 文件名 = `thincoder.desktop` ∧ 含 `StartupWMClass=thincoder`；④ 图标在（`.DirIcon` ∥ `usr/share/icons/...`——读数记录）。提取不可执行 ⇒ 记读数 + 停下上报（不得静默略过）。
- **冒烟面裁定（WSLg 面不可行——WSL2 判死（批档 §1 补记）；重裁三档）**：**可自动面** = check-dist 闸 + 上述提取读数（构建机 · 机检）；**人工面** = **T-DSK62**（用户 Linux 真机走查——AppImage 运行 ∥ deb 安装启动 ∥ 窗口关联 ∥ 数据共用）；**不做（后加）** = 构建机图形冒烟（xvfb + GTK 显示栈——构建机基线外）∥ CI 矩阵（账单锁待解）。

**2.11.4 更新面（AppImage 分流 · deb 无自动更新）**

- **AppImage 臂**：`latest-linux.yml` 单条目 = AppImage；运行期 `autoUpdater` ⇒ `AppImageUpdater`（`main.js`（`:44-76`）linux 缺省面；`APPIMAGE` 环境变量核对同档 `AppImageUpdater.js`（`:17-28`））；行为合同照 D40 ∕ §2.8.1 零差（自检 10s 一次 ∥ 静默下载 ∥ 提示重启 ∥ `quitAndInstall` 两径）。
- **deb 臂（无自动更新——双保险）**：① **feed 侧** = `deb.publish: null`（§2.11.2（a））——feed 无 deb 条目；
  ② **应用侧** = 武装门扩——`update.mjs` 导出纯谓词 `updaterMediumOk({ platform, appImageEnv })`（`platform !== "linux" || appImageEnv != null`），
  装配注入 = `app.isPackaged && !SMOKE && updaterMediumOk({ platform: process.platform, appImageEnv: process.env.APPIMAGE })`（§2.8.1 门 +1 合项——deb 安装零自检 ∥ 零网络 ∥ 零状态机）。
- **上游事实（在案——非我方可控面）**：`electron-builder` 仍向 deb 资源面写 `app-update.yml` + `package-type: deb`（`FpmTarget.js`（`:133-141`）——该径不过目标级 publish：`PublishManager.js`（`:193-194`））⇒ 若武装门缺失，库会选 `DebUpdater` 并尝试更新（feed 无 deb ⇒ 下载前失败 · fail-soft）——**故 deb 的「无更新面」由我方门承担，不由库缺省承担**（纵深第二层 = feed 无 deb 条目）。
- **未武装态菜单项定裁（deb）**：帮助组「检查更新…」项——**enabled = true**（可点——与 dev ∥ `--smoke` 未武装面同形：判定住 `menuClick` 未武装径）∥ **label 不变**（「检查更新…」）；点按 = **零效果**（silent return + stderr 一行——fail-soft 同款，零弹框 ∥ 零 nag）。置灰 ∥ 隐藏 = 不做（需新增注入面——菜单模板跨平台单形）。
- **边界**：deb 内嵌更新器文件（`app-update.yml` ∥ `package-type`）现态收敛 = 不做（上游面零控——照实记录；上游若开目标级资源面 ⇒ 复评）∥ beta ∥ 回滚（KD-71 边界沿）。

**2.11.5 站点与发布对接（feed ∥ 上传序 ∥ 页面规格）**

- **feed 面**（`thincoder.com/downloads/`）：`ThinCoder-Setup-<号>.AppImage` ∥ `latest-linux.yml`（**无 blockmap**——AppImage 整件更新面；首跑实产三件无 `.blockmap` 在册；差分面 = 库内嵌块图）。deb = **站点下载件**（非 feed 件）。
- **上传序**：`AppImage → deb → latest-linux.yml`（feed 末传——消「新号已可见而包未就绪」窗；同 §2.8.3 纪律）；载体 = 站点小件 `upload-download.mjs`（键 = `downloads/` 前缀；
  cache-control 现档已覆盖（**扩展名全集**：`.yml` ⇒ no-cache ∥ 余档（`.exe` ∥ `.blockmap` ∥ `.AppImage` ∥ `.deb`）⇒ max-age=86400——单源 = §2.9.7）——零改）；`deploy-oss.mjs` prune 豁免（`downloads/` 前缀）沿用——零改。
- **版本对盘（发布窗判据）**：`latest-linux.yml.version` = 源 `package.json` `version` = AppImage 名内号 = 站点版本面号（四点——前两 = check-dist ∥ 后两 = 站点核验）。
- **站点区块（规格——执行 = 父侧轮；沿 §2.9 体例 · 零样式改动 · 零新页）**：
  - `download.html`：桌面卡内增 **Linux 区块**（Windows 小字注后——同卡分块，形同既有卡）——按钮二（**版本号随发布**——href 二 ∥ 小字注 ∥ 系统要求行 四处同号；`<号>` = 发布窗源树号）：
    `<a href="https://thincoder.com/downloads/ThinCoder-Setup-<号>.AppImage" class="btn btn-primary">下载 Linux 版（AppImage）</a>` ∥
    `<a href="https://thincoder.com/downloads/ThinCoder-Setup-<号>.deb" class="btn btn-secondary">下载 Linux 安装包（deb）</a>`；
    小字注「Linux（x86_64）· v<号> · AppImage 约 127 MB、deb 约 101 MB；AppImage 免安装、自动更新；deb 走系统包管理器手动升级」；
    系统要求节桌面条后插 `<li><strong>桌面版（Linux）：</strong>Linux（x86_64）· AppImage（免安装，需 FUSE）∥ deb（Ubuntu ∥ Debian 系）· 当前版本 <号>（截至最新发布）</li>`（序 = 与卡序一致）；
    更新节补句「Linux：AppImage 自动更新；deb 走系统包管理器手动升级。」
  - `desktop.html`：安装节补 **Linux 节**（与 Windows 块同构）——**AppImage**：下载后置执行位（`chmod +x ThinCoder-Setup-<号>.AppImage`；或文件管理器「属性 → 允许执行」放行）⇒ 双击运行（需 FUSE）；
    **deb**：`sudo apt install ./ThinCoder-Setup-<号>.deb`（或双击安装）；自动更新面句 = AppImage 自动（同 Windows 句）∥ deb 手动（系统包管理器升级）；系统要求节补 Linux 条（AppImage（需 FUSE）∥ deb（Ubuntu ∥ Debian 系））。
  - `about.html` ∥ `changelog.html`：版本面同号（桌面 = 源树——§6.1 口径）；changelog 桌面节条目随 `CHANGELOG.md` 句（§6.4 半自动沿）。
  - 部署 = `deploy-oss.mjs` 全量（随 §5.8 阶段 5）。

**2.11.6 失败面（Linux 链）**

| 症状 | 根因 | 处置 |
|---|---|---|
| deb 目标失败（`Please specify author 'email'…` ∥ `project homepage`） | `package.json` 元数据缺 | §2.11.2（b）两键（现行已定形） |
| Linux 图标面缺省（default Electron icon） | `build/icon.png` 缺 ∥ `linux.icon` 未指 | 入库 icon.png + 显式 `linux.icon`；批内件帧断言拦漂移 |
| `latest-linux.yml` 含 deb ∥ 指向 deb | 单目标跑覆盖 ∥ `deb.publish` 未 null | 两目标同跑为唯一入口（§2.11.1）+ `deb.publish: null`；check-dist ⑧ 拦 |
| Electron ∥ 工具二进制下载失败（`read ECONNRESET` 类） | 网络 ∥ 镜像缺 | 三镜像环境（§2.11.1 配方） |
| check-dist「版本不匹配」红 | dist 旧产物残留 | 清 dist 重跑（§2.11.1 重跑序） |
| 提取读数：`package-type` 在 AppImage 内 ∥ `.desktop` 名不符 | 构建序异常 ∥ syncDesktopName 缺 | 停下上报（序面 ∥ 配置面复评） |

**边界（不做）**：rpm ∥ Snap ∥ macOS（D42 边界）；Linux 签名面（两产物均不签）；deb apt 仓库面（手动升级直链）；构建机图形冒烟 ∥ CI 矩阵（后加）；站点部署（父侧轮）。

## 3. 文件账

### 3.1 本端文件清单与行数预算（打包族行）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/electron-builder.yml`（本批落） | **63**（实读 2026-10-03——桌面 Linux 产物批实施落盘（46 ⇒ 63：linux 段（target 两目标 ∥ icon ∥ category ∥ syncDesktopName）+ deb 段（`publish: null`）+ 注释——§2.11.2（a））；前读 **46**（实读 2026-10-03——桌面发布·阶段二批实施落盘（42 ⇒ 46：publish 契约（provider ∥ url）+ 注释指针代际收正——披露①）；前读 **42**（实读 2026-10-02〔构建窗修复轮后〕；内容行数口径——契约逐值在盘；39 ⇒ 42——修复轮 +2：注释 ∥ `signingHashAlgorithms` 行（已落）∥ 构建窗修复轮 +3：注释 ∥ `publish: null` 键 ∥ 块间空行））） | 打包配置契约单源（**阶段一**：Windows NSIS x64 ∥ 签名 hook ∥ files 白名单 ∥ NSIS 四参——逐项 = §2.1） |
| `thincoder-desktop/scripts/check-dist.mjs` | **339**（实读 2026-10-03——桌面 Linux 产物批实施落盘（225 ⇒ 339：平台分臂 + Linux 臂 +9 断言——§2.11.3；父侧面件（直接执行）——实跑：win32 对真实 dist 全绿 ∥ linux 臂空夹具逐条 fail-closed）；前读 **225**（实读 2026-10-03——桌面发布·阶段二批实施落盘（190 ⇒ 225：+4 断言——`latest.yml` 两读 ∥ sha512 对盘 ∥ `app-update.yml`，§2.8.2；父侧面件）；前读 **190**（实读 2026-10-02〔构建窗修复轮后〕；前读 128（实读 2026-09-29）⇒ 188（实读 2026-10-01〔实施落盘〕）；本批续填已落：安装包名形 × 版本 ∥ 预载 ∥ 渲染面断言 + PE 签名态读数（§2.5）——既有断言零删；构建窗修复轮 +2：asar 读面缺陷修复——`dataStart` 定标））） | 产物校验（照扩展端 `check-vsix` 先例；fail-closed——缺一即 exit 1） |
| `thincoder-desktop/scripts/materialize-deps.mjs`（本批新档） | **143**（实读 2026-10-01〔实施落盘〕） | 两核包物化（源树实拷：junction ⇒ 真目录 ∥ 运行必需件筛 ∥ 落位自检——§2.2 ∥ §1 KD-64③） |
| `thincoder-desktop/scripts/win-sign.mjs`（本批新档） | **163**（实读 2026-10-01〔实施落盘〕） | Windows 签名 hook（指纹探测 ∥ 实签 ∥ 缺席跳过 + 明示——§2.3） |
| `thincoder-desktop/scripts/make-icon.mjs`（本批新档） | **171**（实读 2026-10-01〔实施落盘〕） | 图标生成器（零依赖——PNG 编码 ∥ ICO 封包 ∥ `</>` 品牌笔——§2.4） |
| `thincoder-desktop/package.json`（切片 3 判域迁入——脚本 ∥ 发布面；原址指针在册） | **29**（实读 2026-10-03——桌面 Linux 产物批实施落盘（26 ⇒ 29：`homepage` ∥ `author` ∥ `desktopName` 三键——用户定值，§2.11.2（b））；前读 **26**（实读 2026-10-03——桌面发布·阶段二批实施落盘（25 ⇒ 26：`dependencies` + `electron-updater ^6.8.9` ∥ description 句收正）；前读 **25**（实读 2026-10-01〔实施落盘——桌面打包发布批〕；前读 24（web 快筛批实施后（23 ⇒ 24：script + `quickcheck`））；本批 + `prepackage`——script 六条 ∥ 版本发布窗定号 `0.10.1`；回填见本档 §3.2 本批块））） | 包定性：`main` 入口 + script **六条**（`test` / `start` / `prepackage` / `package` / `postpackage` / `quickcheck`——**单源 = 本档 §2**）；devDeps = `electron` + `electron-builder`（构建期·非运行期）+ **`playwright-core`**（E2E 驱动·测试面——原批 + **web 快筛驱动**（系统浏览器 channel 面）——web 快筛批；`dependencies` = `electron-updater ^6.8.9`（**首个第三方运行依赖**——桌面发布·阶段二批 +1 · 声明面三处收正）） |
| `thincoder-desktop/build/icon.ico`（本批新档 · 二进制） | 4 151 B（多尺寸 16 ∕ 32 ∥ 48 ∥ 256——二进制资产不入行数账） | 图标资产（构建输入 ∥ 生成物入库） |
| `thincoder-desktop/CHANGELOG.md`（发布窗首建 · 已落） | **33**（实读 2026-10-03——桌面 Linux 产物批实施落盘（27 ⇒ 33：`[Unreleased]` 段——Added Linux 句；父侧面件（直接执行））；前读 **27**（实读 2026-10-03〔桌面 Linux 产物批——修复轮核读〕；**19 ⇒ 27**：重发窗收正（0.10.2 段 ∥ 0.10.1 段自动更新句随列）；前读 **19**（实读 2026-10-03〔桌面发布·阶段二批实施落盘〕——13 ⇒ 19：`[Unreleased]` 段——Added 自动更新句；父侧面件）；前读 **13**（实读 2026-10-01〔实施落盘〕——首发 0.10.1 段（Added 三条）））） | 桌面 CHANGELOG（首发段——本档 §2.2 ∥ `docs/RELEASE.md` §5.2 步 2） |

| `thincoder-desktop/src/main/update.mjs`（本批新档 · 已落） | **227**（实读 2026-10-03——桌面 Linux 产物批实施落盘（217 ⇒ 227：`updaterMediumOk` 谓词导出 + 头注随正——§2.11.4）；前读 **217**（实读 2026-10-03——桌面发布·阶段二批实施落盘（无 ⇒ 217：应用侧更新策略面——五态状态机 ∥ 事件接线 ∥ 注入缝；§2.8.1））） | 自动更新（应用侧——策略面） |

### 3.2 现有文件改动 · 桌面打包发布批（实施落盘）

**本批（桌面打包发布 · 阶段一 · 2026-10-01 · 台账 #807 · 批 `docs/batches/2026-10-01-desktop-packaging-release.md`）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 本档 §1 **KD-64** ∥ §2；实施落盘 2026-10-01——产品码零触；修复轮另触 `thincoder-desktop/.gitignore`（**5 ⇒ 8**——注释 ∥ `dist/` 条目））：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml` | **无 ⇒ 42**（本批落——阶段一契约：win nsis x64 ∥ `artifactName` ∥ icon ∥ files 白名单 ∥ NSIS 四参 ∥ `signtoolOptions.sign` ∥ `signingHashAlgorithms` ∥ `publish: null`；修复轮 +2——注释 ∥ 键行（已落）∥ 构建窗修复轮 +3——注释 ∥ `publish: null` 键 ∥ 块间空行） | 打包面 |
| 2 | `thincoder-desktop/package.json` | **24 ⇒ 25**（scripts + `prepackage`（物化自跑）——script 六条；版本 = 发布窗定号 0.0.0 ⇒ 0.10.1） | 脚本面 |
| 3 | `thincoder-desktop/scripts/materialize-deps.mjs` | **无 ⇒ 143**（已落——两核包物化：源树实拷 + junction 替换 + 落位自检） | 打包面 |
| 4 | `thincoder-desktop/scripts/win-sign.mjs` | **无 ⇒ 163**（已落——签名 hook：指纹探测 ∥ 实签 ∥ 跳过 + 明示） | 签名面 |
| 5 | `thincoder-desktop/scripts/make-icon.mjs` | **无 ⇒ 171**（已落——图标生成器：零依赖 PNG ∥ ICO 编码 + `</>` 品牌笔） | 资产面 |
| 6 | `thincoder-desktop/build/icon.ico` | **无 ⇒ 4 151 B**（多尺寸 16 ∕ 32 ∥ 48 ∥ 256——二进制资产不入行数账；生成物入库（构建输入）） | 资产面 |
| 7 | `thincoder-desktop/scripts/check-dist.mjs` | **128 ⇒ 188**（已落——续填：安装包名形 × 版本 ∥ 预载 ∥ 渲染面断言 + PE 签名态读数；既有断言零删） | 校验面 |
| 8 | `thincoder-desktop/CHANGELOG.md` | **无 ⇒ 13**（已落 · 发布窗首建——首发 0.10.1 段） | 发布面 |
| 9 | `thincoder-desktop/AGENTS.md` | **24 ⇒ 25**（`package` 命令行按现链条收正——物化 ∥ check-dist；另两平台注随阶段二） | 文档面 |
| 10 | 批内件 | `docs/batches/2026-10-01-desktop-packaging-release.test.mjs`（**已建成 · 376 行 · 20 用例**——五面腿（L1 物化 5 ∥ L2 图标 3 ∥ L3 check-dist 6 ∥ L4 签名 4 ∥ L5 配置 2）；**373 ⇒ 376**——父侧工具面修正 +2（check-dist 读面 ∕ L3 夹具——读面缺陷修复轮）∥ 构建窗修复轮 +1（L5 `publish` 断言）——父侧核讫；随批留存 · 不进仓套件） | 全批 |
| 11 | 设计档 ∥ 发布档 | 本档 §1 **KD-64** ∥ 本档 §3.1（新行五 + 三行收正）∥ 本档 §3.2 本块 ∥ 本档 §2（重写——2.1–2.7）∥ 本档 §4 批块 ∥ 本档 §5 **T-DSK55** ∥ `docs/desktop/design/PROJECT.md` §8 ∥ 本档 §6 **DE** ∥ 变更记录；`docs/RELEASE.md` §1 ∥ §3 ∥ §4 ∥ §5（+§5.6 新——5.6 ∕ 5.7 顺延 5.7 ∕ 5.8）∥ §6 ∥ 变更记录；`docs/README.md` §1 地图行 + 变更记录 | 全批 |

零触面：`src/**` ∥ `renderer/**`（产品码零改——本批 = 构建期 ∥ 资产 ∥ 文档面）∥ 核 ∥ CLI ∥ VSC ∥ 站点仓（规格在批档——执行 = 主 agent 轮）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

### 3.3 现有文件改动 · 桌面发布·阶段二批（自动更新 ∥ 官网桌面面——实施落盘）

**本批（桌面发布·阶段二批 · 2026-10-02 · 台账 #810 ∥ #826）行「现行 ⇒ 实读（实施落盘）」**（现行 = 实读 2026-10-02——内容行数口径；右列 = **该批实施落盘 as-of 读数**（2026-10-03——后续批改动以 §3.1 现读 ∥ §3.4 本批行为准）（父侧面件 ∥ 跨批件终态同批档 §5 追记）；机制 ∕ 判据单源 = 本档 §1 **KD-71** ∥ **KD-72** ∥ §2.8 ∥ §2.9）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml` | **42 ⇒ 46**（实施落盘）（publish 契约行——`null` ⇒ generic provider（provider ∥ url）；§2.1 行） | 打包面 |
| 2 | `thincoder-desktop/package.json` | **25 ⇒ 26**（实施落盘）（`dependencies` + `electron-updater ^6.8.9`；description 句收正） | 依赖面 |
| 3 | `thincoder-desktop/src/main/update.mjs` | **无 ⇒ 217**（实施落盘 · 新档）（策略面五态状态机；§2.8.1） | 更新面 |
| 4 | `thincoder-desktop/src/main/main.mjs` | **203 ⇒ 242**（实施落盘——该批 as-of；后续改动 ⇒ 现读 **263**〔2026-10-03 轻通道轮：第二实例唤醒 ∥ 明示原因框〕——见 §3.4 行 6）（装配：`createRequire` 取 `autoUpdater` ∥ 注入五缝 ∥ 延时自检点火 ∥ 通知落子） | 装配面 |
| 5 | `thincoder-desktop/src/main/app-menu.mjs` | **143 ⇒ 158**（实施落盘）（帮助组 +「检查更新…」项 ∥ `update` 注入（状态 → label ∥ enabled）） | 菜单模板面 |
| 6 | `thincoder-desktop/src/main/menu-words.mjs` | **115 ⇒ 145**（实施落盘）（+11 键（菜单四 + 对话框 ∥ 通知七）× zh/en；键集 32 ⇒ 43） | 词表面 |
| 7 | `thincoder-desktop/src/main/window.mjs` | **288 ⇒ 336**（实施落盘）（`onNative` +`update` 分支 ∥ 更新对话框族（确认 ∥ 结果两态）∥ `setUpdateFace` 转口——沿 `setMenuTheme` 先例；**越 300 顾问线在册**——拆分预案 ∥ 消解窗口 = `docs/desktop/design/PROJECT.md` §4.1 越层段本批行） | 宿主菜单面 |
| 8 | `thincoder-desktop/scripts/check-dist.mjs` | **190 ⇒ 225**（父侧面件实施落盘）（+4 断言：`latest.yml` 两读 ∥ sha512 对盘 ∥ `app-update.yml`——§2.8.2） | 校验面 |
| 9 | `thincoder-desktop/AGENTS.md` | **25 ⇒ 25**（实施落盘 · 净 0）（命令面零动；依赖句收正（第三方运行依赖例外——`electron-updater`）） | 文档面 |
| 10 | `thincoder-desktop/CHANGELOG.md` | **13 ⇒ 19**（父侧面件实施落盘——该批 as-of；重发窗收正 ⇒ 现读 **27**〔0.10.2 段 ∥ 0.10.1 段收正〕——见 §3.1 行 8 ∥ §3.4 行 8）（`[Unreleased]` 段——Added 自动更新句） | 发布面 |
| 11 | 批内件（本批新档） | `docs/batches/2026-10-02-desktop-release-stage2.test.mjs`（**已建成 · 388 行 · 11/11 绿**（实施落盘）——状态机替身面 ∥ 菜单映射 ∥ 词键 ∥ yml 契约 ∥ prune 豁免/上报脚本源扫；随批留存 · 不进仓套件） | 全批 |
| 12 | 批内件（前批随动） | `docs/batches/2026-10-01-desktop-packaging-release.test.mjs`（**376 ⇒ 410**（父侧面件实施落盘——21/21 绿；实读 2026-10-03）——L5 `publish` 断言翻新（`null` ⇒ provider 契约——跨批随动，沿「改钉新形」先例）） | 全批 |
| 13 | 设计档 ∥ 发布档 | 本档（§1 **KD-71** ∥ **KD-72** ∥ §2.1 ∥ §2.2 ∥ §2.6 ∥ §2.7 ∥ §2.8–§2.10 ∥ §3.1 新行 + 本块 ∥ §4.3 新立 ∥ §5 **T-DSK60** ∥ §6 **DK** ∥ 变更记录）；`docs/desktop/design/MENU.md`（**KD-65** ①/②/⑦ 随拍 + §3.5 新块 + 变更记录）；`docs/desktop/design/PROJECT.md`（§2 KD 索引两行 + §5 指针 + §8 边界行 + §10 **DK** + §7 **T-DSK60** 行 + 变更记录）；`docs/RELEASE.md`（§5.6 步 1/2/4 + 完成判定 ∥ §5.1 图行 ∥ §5.5 指针 ∥ §5.2-2 ∥ §6.3 ∥ §6.5 判据 4 ∥ §6.6 边界句 ∥ 变更记录）；`docs/README.md`（地图行 + 变更记录） | 全批 |

零触面：`electron-builder.yml` 其余键 ∥ `materialize-deps.mjs` ∥ `win-sign.mjs` ∥ `make-icon.mjs` ∥ `build/icon.ico` ∥ `src/main/**` 其余档（`context-menu.mjs` ∥ `projects.mjs` ∥ …）∥ `renderer/**`（**渲染面零接线**——更新面全主进程）
  ∥ `src/preload/preload.cjs` ∥ `ipc.mjs` ∥ `ipc-registry.mjs` ∥ 通道集（事件 24 ∥ 白名单 47）∥ 核 ∥ CLI ∥ VSC ∥ `thincoder-render-core`；站点仓 = 父侧轮（规格 = §2.9）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

### 3.4 现有文件改动 · 桌面 Linux 产物批（实施落盘）

**本批（桌面 Linux 产物批 · 2026-10-03 · 台账 #847 · 批 `docs/batches/2026-10-03-desktop-linux.md`）行「现行 ⇒ 实读（实施落盘）」**（现行 = 实读 2026-10-03——内容行数口径；右列 = **本批实施落盘实读**（2026-10-03——实测回填轮；父侧两笔（直接执行）在册）；机制 ∕ 判据单源 = 本档 §1 **KD-73** ∥ §2.11）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml` | **46 ⇒ 63**（linux 段（target 两目标 ∥ icon ∥ category ∥ syncDesktopName）+ deb 段（`publish: null`）+ 注释） | 打包面 |
| 2 | `thincoder-desktop/package.json` | **26 ⇒ 29**（`homepage` ∥ `author` ∥ `desktopName`——用户定值；§2.11.2（b）） | 元数据面 |
| 3 | `thincoder-desktop/build/icon.png`（新档 · 二进制） | **无 ⇒ 2872 B**（已落——`icon.ico` 第 4 帧字节切片（sha256 `08fe76b9…b57d`，父侧逐字节独立复算）；生成物入库形同 `icon.ico` 先例） | 资产面 |
| 4 | `thincoder-desktop/scripts/check-dist.mjs` | **225 ⇒ 339**（平台分臂 + Linux 臂 +9 断言；**父侧面件（直接执行）**——实跑：win32 对真实 dist 全绿 ∥ linux 臂空夹具逐条 fail-closed；越 300 顾问线 ⇒ **拆分评审结论 = 保留单档**——理由 ∥ 抽档预案与触发判据 = §2.11.3） | 校验面 |
| 5 | `thincoder-desktop/src/main/update.mjs` | **217 ⇒ 227**（`updaterMediumOk` 导出 + 头注随正——§2.11.4） | 更新面 |
| 6 | `thincoder-desktop/src/main/main.mjs` | **263 ⇒ 265**（武装门注入 +1 合项；现行 263 = 本批实读——§3.3 行 4「242」系该批 as-of 读数） | 装配面 |
| 7 | `thincoder-desktop/AGENTS.md` | **25 ⇒ 27**（Commands 行：Linux 构建/校验面随正） | 文档面 |
| 8 | `thincoder-desktop/CHANGELOG.md` | **27 ⇒ 33**（`[Unreleased]` 段——Added Linux 句；**父侧面件（直接执行）**；段位随发布窗（F2 口径）） | 发布面 |
| 9 | 批内件（新档） | `docs/batches/2026-10-03-desktop-linux.test.mjs`（新档——图标帧断言（PNG ≡ ICO 第 4 帧）∥ yml linux/deb 契约 ∥ package.json 三键 ∥ `updaterMediumOk` 真值表 ∥ check-dist 分臂源扫；**实读 172 行**（预估 ~380——先例档 376–410 系预估依据；差额披露 = 批档 §5 决策表 #5：五腿全在 ∥ 无 harness 需求）；**档位适用定裁** = 同 .mjs 代码档（300 建议 ∥ 500 硬限）——越建议线可〔advisory〕∥ 硬限为闸） | 全批 |
| 10 | 设计档 ∥ 发布档 | 本档（§1 **KD-73** ∥ §2.8.1（门行指针） ∥ §2.9.7（cache-control 全集） ∥ §2.11 ∥ §3.4 本块 ∥ §4.4 ∥ §5 **T-DSK61–63** ∥ §6 **D42** 行 ∥ 变更记录）；`docs/RELEASE.md`（§5.1 图行 ∥ §5.6 Linux 臂 ∥ §6.5 判据 4 扩 ∥ 变更记录） | 全批 |

零触面：`electron-builder.yml` win 段 ∥ `materialize-deps.mjs` ∥ `win-sign.mjs` ∥ `make-icon.mjs` ∥ `build/icon.ico` ∥ `src/main/**` 其余档 ∥ `renderer/**` ∥ `src/preload/preload.cjs` ∥ 通道集（事件 24 ∥ 白名单 47）∥ 核 ∥ CLI ∥ VSC ∥ `thincoder-render-core` ∥ `.github/workflows/linux-build.yml`（备用通道零动）；
  站点仓 = 父侧轮（规格 = §2.11.5）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

## 4. 验收回指（D12 ∥ D32）

### 4.1 功能点（D12）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| D12 | 三平台产物存在 + 可启动冒烟过我（§2 三层验证面）——**分期（2026-10-01 D32 阶段令）：阶段一 = Windows 产物存在 + 本平台冒烟；macOS ∥ Linux 产物与三平台 CI 随阶段二**（同源 = §2.7「目标（分期）」行） | T-DSK14 / CI 矩阵 |

### 4.2 桌面打包发布批（验收面 · 阶段一）

**桌面打包发布批（验收面 · 阶段一 · 2026-10-01 · 台账 #807）**：需求回指 = **D32**（分期令现文：阶段一 = 打包链 + Windows 安装包 + 官网下载 ∥ 签名就绪形）；设计单源 = 本档 §1 **KD-64** ∥ §2（2.1 契约 ∥ 2.2 序列 ∥ 2.3 签名 ∥ 2.5 校验 ∥ 2.6 失败面）；
机检面 = ① `node scripts/check-dist.mjs` exit 0（全断言——§2.5）+ 产物名 × 源版本一致（`dist/ThinCoder-Setup-<package.json version>.exe`）② 物化终态两判（`node scripts/dev-link.mjs --check` = 0——收窗）③ 批内件（物化 ∥ 图标 ∥ 断言族——载体 = `docs/batches/2026-10-01-desktop-packaging-release.test.mjs`）；
真机面 = **T-DSK55**（真机冒烟：装 → 启 → 卸；臂 = 已签 ∥ 未签两态）；**官网面** = 下载 URL 可达 + 页面版本面同值（口径 = `docs/RELEASE.md` §6.5）；**离线不可产面**（真机安装 ∥ SmartScreen 观感 ∥ CDN 回源）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

### 4.3 桌面发布·阶段二批（验收面 · 自动更新 ∥ 官网桌面面 · 2026-10-02 · 台账 #810 ∥ #826）

需求回指 = 需求卷 **D40**（自动更新）∥ **D41**（官网桌面面）∥ D32（发行渠道 · 阶段二片）∥ D36（帮助菜单——「检查更新（归 #810）」挂点承接）+ 批档 §1 需求登记 ①②③ + 台账 #810 ∥ #826；
设计单源 = 本档 §1 **KD-71** ∥ **KD-72** ∥ §2.8（2.8.1–2.8.3）∥ §2.9（2.9.1–2.9.7）∥ §2.10（承接表）；
机检面 = ① **check-dist 断言 +4**（`latest.yml` 两读 ∥ sha512 对盘 ∥ `app-update.yml`——§2.8.2）② 批内件（状态机替身面 ∥ 菜单映射（`update` 注入→label/enabled）∥ 词键集（32 ⇒ 43）∥ yml publish 契约 ∥ 站点脚本源扫（prune 豁免 ∥ `--side desktop`）∥ 旧批内件 L5 断言翻新）③ **站点面核读**（§2.9 逐页清单：页面 ∥ 链接 ∥ 文案要点 ∥ 导航 11 档 ∥ sitemap ∥ 版本面三处）；
真机面 = **T-DSK60**（自动更新链——真机 · 发布窗）∥ 站点三处版本面 + feed（`docs/RELEASE.md` §6.5 判据 1 ∥ 4）；**离线不可产面**（真网络 OSS ∥ 真签名安装 ∥ SmartScreen 观感 ∥ 更新器真下载）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

> **需求侧（已落：D40 ∥ D41）**：自动更新 ∥ 官网桌面面已入需求卷（主 agent 笔 · 2026-10-02）——引 `docs/desktop/requirements/PACKAGING.md:3` ∥ `:14-15` ∥ `:20`；本档验收回指 = D40 ∥ D41（§4.3 同拍）。

### 4.4 桌面 Linux 产物批（验收面 · 2026-10-03 · 台账 #847）

**桌面 Linux 产物批（#847）**：需求回指 = 需求卷 **D42**（AppImage ∥ deb ∥ 官网下载 ∥ AppImage 自动更新随 D40 ∥ deb 手动）∥ 批档 §1 ∥ §1 补记二（首跑三缺项 + 实产读数）；
设计单源 = 本档 §1 **KD-73** ∥ §2.11（2.11.1–2.11.6）；
机检面 = ① **check-dist Linux 臂** exit 0（+9 断言——§2.11.3）② 构建机命令读数（`dpkg-deb -f` 两字段 = 定值 ∥ AppImage 提取四读数：`app.asar` 在 ∥ `package-type` 不在 ∥ `.desktop` 名 ∥ 图标在——单源 = §2.11.3）③ 批内件（图标帧 ∥ yml 契约 ∥ 三键 ∥ 门真值表）；
真机面 = **T-DSK61**（构建机 · 机检）∥ **T-DSK62**（用户真机走查——AppImage ∥ deb）∥ **T-DSK63**（AppImage 自动更新链——发布窗）；**离线不可产面**（真机首屏 ∥ FUSE 运行 ∥ 窗口关联观感）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

## 5. 用例

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK14 | 正常 · 产物与启动 | 跑 `package` script | **阶段一（2026-10-01 D32 阶段令）= Windows 产物存在（安装包名形 = §2.1）**；校验脚本通过；本平台冒烟启动可进主界面；**macOS ∥ Linux 产物与三平台 CI 随阶段二** |
| T-DSK55 | 正常 · 打包产物真机冒烟（D32 阶段一 · 真机两臂） | 发布窗产物 `dist/ThinCoder-Setup-<号>.exe`（臂① 已签（证书在位构建）· 臂② 未签（token 缺席构建）） | ① 安装器可运行完成（per-user；安装目录可改默认在）；② 安装后快捷方式 ∥ 开始菜单项在场；启动进主界面（`app://desktop/` 首屏）；③ 卸载后程序目录退场 ∧ `~/.thincoder/` 用户数据保留（**家目录面本不随包**——单源 = §2.1「`nsis.deleteAppDataOnUninstall`」行）；④ 臂① = 文件属性「数字签名」页现 GlobalSign EV（`CN=Shanghai Xinbo Technology Co., Ltd.`）∥ 臂② = 构建期 `⚠ 未签名` 明示行在（零 SmartScreen 承诺）；机检面 = check-dist 读 PE 证书表两态读数（§2.5） | 真机面 = 用户走查 + 父侧真跑闭合（D16 义务）；用例号自铸披露 = §6 **DE** |

| T-DSK60 | 正常 / 边界 · 自动更新链（真机 · 发布窗） | 旧版已安装（vN——真发布 · **前置：vN 须为携更新面版本**——0.10.1 = 携更新面（2026-10-03 重发窗实读：产物含 `app-update.yml`（`resources/` 下） ∥ feed 三件已传）⇒ **首测点 = 0.10.1 → 0.10.2**（真机现刻可行）；或允许本地构建旧版）+ 新版本已发布（vN+1：feed 三件已上传） | ① 启动旧版 ⇒ 10s 内自动检查（log 行在）——**未点按前零打扰**（零模态框 ∥ 零窗口操作 ∥ 在飞回合不受扰）；② 下载完成 ⇒ 菜单 帮助→检查更新 变「重启以安装更新」+ 通知一条（一次/版本）；③ 菜单点按 ⇒ 确认框 ⇒ 安静安装 + 自动重拉 ⇒ 版本号 = vN+1；④ **另一径**：不点按、正常退出 ⇒ 再启 = vN+1（onQuit 安装）；⑤ 全程会话数据保留（`~/.thincoder` 零动）；⑥ 手查三果（`update-available` ⇒ 转下载态；`update-not-available` ⇒ 对话框「已是最新版本」；`error`（如断网）⇒ 对话框「检查更新失败」+ 一行原因、状态回 `idle`——下次可重试；「静默回转」限自动面（单源 = §2.8.1 失败面））；机检面 = 批内件（状态机替身面——事件注入） | 真机面 = 父侧真跑闭合 + 用户走查（D16 义务）；用例号自铸披露 = §6 **DK** |

| T-DSK61 | 正常 / 边界 · Linux 构建链与产物形状（构建机 · D42） | 构建机（ha-proxy）+ 配方（§2.11.1）∥ 源 = 浅克隆当前树 | ① `npm run package` 全链 exit 0（物化 ∥ 两目标 ∥ check-dist Linux 臂 = 闸）；② dist 三件：`ThinCoder-Setup-<源号>.AppImage` ∥ `.deb` ∥ `latest-linux.yml`；③ `latest-linux.yml` = 单条目 AppImage（`version` ∥ `files[0].url` ∥ `path` ∥ `sha512` 四读对盘；无 `.deb`）；④ `dpkg-deb -f …deb Maintainer` = `liwei <liwei@thincoder.com>` ∧ `Homepage` = `https://thincoder.com`；⑤ AppImage 提取读数（`app.asar` 在 ∥ 无 `package-type` ∥ `.desktop` 名 ∥ `StartupWMClass`）；机检面 = check-dist + 构建机命令清单 | 构建机执行 = 父侧/实施轮；读数入 §5；用例号自铸披露 = §6 **D42** 行 |
| T-DSK62 | 正常 / 边界 · 真机走查（AppImage ∥ deb——用户侧 · D42） | 产物三件（取回落位）+ 用户 Linux 真机（Ubuntu 22.04+ 桌面） | ① AppImage 置执行位（`chmod +x`——或文件管理器放行）⇒ 双击（FUSE）⇒ 首屏（`app://desktop/`）；② 窗口 ∥ 任务栏归组与 `.desktop` 关联（`StartupWMClass=thincoder`）；③ deb 安装（`sudo apt install ./ThinCoder-Setup-<号>.deb` 或双击）⇒ 启动 ⇒ 首屏；④ 两端与 CLI ∥ VSC 共用 `~/.thincoder/`（任一端配置三端生效）；⑤ AppImage 端：帮助菜单「检查更新…」在（未点按前零打扰——自检 fail-soft）；deb 端：**无更新动作**（点按零效果——无自动更新语义；菜单项恒在场 = 既有形）；⑥ 卸载/清理（deb remove；AppImage = 删文件） | 真机面 = 用户走查 + 父侧核读（D16 义务）；用例号自铸披露 = §6 **D42** 行 |
| T-DSK63 | 正常 · AppImage 自动更新链（真机 · 发布窗） | 旧版 AppImage（vN——须携更新面（本批起产物皆携）∥ 或本地构建旧版）+ 新版本已发布（vN+1：`AppImage` ∥ `latest-linux.yml` 已传） | ① 启动 vN ⇒ 10s 内自检（log 行）——未点按零打扰；② 静默下载完成 ⇒ 菜单「重启以安装更新」+ 通知一条；③ 点按 ⇒ 确认框 ⇒ 安静安装 ⇒ 重拉 ⇒ 版本 = vN+1（原位替换——`APPIMAGE` 路径面）；④ 另一径：退出即装（`autoInstallOnAppQuit`）；⑤ 全程 `~/.thincoder` 零动；⑥ **对照**：deb 端同窗（feed 新号在）⇒ 无任何更新动作（门 = 无自动更新） | 真机 = 用户走查（D16）；前置：第二个携更新 Linux 版本（或本地旧版构建）；用例号自铸披露 = §6 **D42** 行 |

## 6. 上抛与登记（DE ∥ DK）

| 行 | 内容 | 状态 | 单源 |
|---|---|---|---|
| DE | **桌面打包发布批（阶段一）上抛四件**：① **图标资产复用建议**——`build/icon.ico` 的源生成器可顺产 PNG（站点 OG ∕ 下载页卡面用）——站点轮可选采（跨仓 = 主 agent 轮）② **`deploy-oss.mjs` prune 加固**（站点仓）：`OSS_DELETE=1` 时 prune 面 = 全桶键 − 本地 `www/` 键（`thincoder.com/scripts/deploy-oss.mjs:230-238`）⇒ 桶内 `downloads/**` 会被判陈旧一并删除——建议 prune 面加 `downloads/` 前缀豁免（或维持 `OSS_DELETE` 恒关——现缺省）③ **签名时间戳 URL 实测选定**（GlobalSign RFC3161——实施期实测；落档 = 本档 §2.3）④ **站点仓 changelog 生成器（`thincoder.com/scripts/gen-changelog.mjs`）desktop 臂**：现只含 cli ∥ vsc（实读 2026-10-01——`--side` 两值）；`docs/RELEASE.md` §6.4 档面已含桌面 `CHANGELOG.md` 输入（本批随动已落）⇒ 余动作 = 该脚本增 desktop 臂（站点轮随动） | 上抛（①③④随站点 ∥ 实施轮；②站点仓加固） | 单源 = 本档 §1 **KD-64** ∥ §2；站点面 = 批档 §2「站点侧规格」 |

| DK | **`T-DSK60` 用例号自铸披露 + 桌面发布·阶段二批（#810 ∥ #826）披露五件**（沿 T-DSK37–T-DSK59 先例——本批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **`electron-updater` = 首个第三方运行依赖**（声明面三处收正：`package.json` description ∥ `AGENTS.md` ∥ 本档——「零第三方」旧句作废；由 = 差分更新 ∥ 安装器生命周期 ∥ 验签链均为库面能力，手搓 = 重造块图算法）；③ **桌面下载卡图标收正**（阶段一前案 `</>` ⇒ 🖥️——emoji 先例；`</>` 系品牌位形）；④ **RELEASE.md 指针代际**（`docs/desktop/design/PROJECT.md` §5 已迁 `docs/desktop/design/PACKAGING.md` §2——重组后死指针，本批收正；同族：CHANGELOG「拟新增」四标）；⑤ **需求卷侧已收正**（主 agent 笔面——已落）：**D40**（自动更新）∥ **D41**（官网桌面面）已入需求卷——引 `docs/desktop/requirements/PACKAGING.md:3` ∥ `:14-15` ∥ `:20` | 登记（自铸披露 + 四处披露；⑤ 已收正） | 单源 = 本档 §1 **KD-71** ∥ **KD-72** ∥ 批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §2 |

| D42 | **桌面 Linux 产物批（#847）披露与上抛**：① **用例号自铸**（T-DSK61–63——沿先例；若并行批占号 ⇒ 并号裁定）；② **需求卷收正（主 agent 笔面——已落）**：D42 行两处收正已落——**构建通道**（设计轮前案「GitHub Actions 云构建」⇒ 内网构建机（ha-proxy）为主 ∥ GH Actions = 备用（账单锁待解）——收正所在 = `docs/desktop/requirements/PACKAGING.md:16`）∥ **验收冒烟面**（设计轮前案「WSLg 冒烟（可自动面）+ 真机走查」⇒ check-dist + AppImage 提取读数（可自动）∥ 真机走查（人工）——收正记录 = `docs/desktop/requirements/PACKAGING.md:24`）；③ **站点执行 = 父侧轮**（规格 = §2.11.5——页面增量 ∥ feed 上传 ∥ 版本面）；④ `build/icon.png` = 二进制入库（生成物形——同 `build/icon.ico` 先例；源 = `icon.ico` 第 4 帧字节切片）；⑤ **构建机凭据零入库**（scp/ssh 会话 = 父侧自持） | ①③登记；②已收正（主 agent 笔面——已落）；④⑤登记 | 单源 = 本档 §1 **KD-73** ∥ §2.11 ∥ 批档 `docs/batches/2026-10-03-desktop-linux.md` §1 |

## 变更记录

- 2026-10-02：建档（文档体系重组批 #813 · 波 1 · 迁移轮）——自 `docs/desktop/design/PROJECT.md`（§2 **KD-6** ∥ **KD-64** ∥ §4.1 / §4.2 ∥ §5 ∥ §6.1 ∥ §7 ∥ §10）逐字迁入；段号随迁重编（§5.x ⇒ §2.x）；原址保位指针在册（as-of 2026-10-02）；迁移前历史见 `docs/desktop/design/PROJECT.md` 变更记录。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§3.1 补行 3**（`package.json` ∥ `build/icon.ico` ∥ `CHANGELOG.md`——自 `docs/desktop/design/PROJECT.md` §4.1 逐字迁入；原址各改一行指针；判域在册）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**文档清账轮 · 执行轮 4（render-core + 桌面轻段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 3 处处置（R1 改指 1——`thincoder-desktop/renderer/index.html`；R3 裸名化 2——`fileMatcher.js` ∥ `electronGet.js`，域外第三方档坐标去目录段）。**零新语义**。
- 2026-10-02（**桌面发布·阶段二批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §1 · 台账 #810 ∥ #826）：§1 增 **KD-71**（自动更新——三件面：应用侧行为合同（启动自检 10s 一次 ∥ 静默下载 ∥ 状态机五态 ∥ 提示重启两原生面 ∥ 零新事件通道 ∥ `quitAndInstall(true, true)`）∥ 构建侧（`publish` generic 契约 ∥ `latest.yml`/`app-update.yml` 生成物 ∥ check-dist +4 断言 ∥ `electron-updater` 首个第三方运行依赖）∥ 站点侧（feed 三件 ∥ 上传序 ∥ prune 豁免 ∥ 版本四点对盘）；边界 + 被否六候选）+ **KD-72**（官网桌面面——页集 ∥ 卡 ∥ 触点 ∥ 脚本三件 ∥ 版本面三处）；§2.1 `publish` 行翻 generic 契约；§2.2 ∥ §2.6 ∥ §2.7 随动；**§2.8–§2.10 新立**（自动更新 ∥ 官网桌面面规格 ∥ 发布窗承接表）；§3.1 新行 + **§3.3 新立**（本批块）；**§4.3 新立**（验收面 + 需求侧缺口上抛）；§5 增 **T-DSK60**；§6 增 **DK**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**桌面发布·阶段二批 · 修复轮（评审轮 1 · 发现 1 ∥ 2 ∥ 3 ∥ 6 ∥ 7 ∥ 8 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §3 轮次 1 · 台账 #810 ∥ #826）：① 需求侧缺口注翻「已落：D40 ∥ D41」+ §4.3 回指补 D40/D41 + §6 **DK** ⑤ 转已收正（引需求卷行）；② §5 **T-DSK60** ⑥ 按 §2.8.1 收正（`error` 径 = 对话框「检查更新失败」+ 状态回 `idle`；「静默回转」限自动面；补第三果 `update-available` ⇒ 转下载态）+ 输入面补前置（vN 须携更新面——0.10.1 无更新器）；③ §3.3 行 7 补越线在册（拆分预案 ∥ 消解窗口 = `docs/desktop/design/PROJECT.md` §4.1 越层段本批行）；⑥ §2.5 补 +4 断言指针（= §2.8.2）；⑦ §2.8.3 绕缓存先例改指实出处（`docs/RELEASE.md` §5.6 步 4）。**零新语义**（收正 ∥ 登记 ∥ 指位）。明细 = 批档 §2 修复轮块。
- 2026-10-03（**桌面发布·阶段二批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §2 ∥ §5 · 台账 #810 ∥ #826）：§3.3 翻「实施落盘」形态（标题 ∥ 说明 ∥ 表头 ∥ 十二行实读回填——yml **46** ∥ package.json **26** ∥ update.mjs **217** ∥ main.mjs **242** ∥ app-menu **158** ∥ menu-words **145** ∥ window **336** ∥ check-dist **225** ∥ AGENTS.md **25**（净 0）∥ CHANGELOG **19** ∥ 批内件 **388** ∥ 前批随动 **410**）；§3.1 五行走读齐平（yml ∥ check-dist ∥ package.json ∥ CHANGELOG ∥ update.mjs——机检工单；package.json 说明面「零第三方不变」随正）；§2.8.1 手动检查段补下载期失败定裁半句（保留全静默——与自动面 fail-soft 同款）。**零新语义**（回填 ∥ 收正 ∥ 一句定裁）。明细 = 批档 §2 回填轮块。
- 2026-10-03（**发布后收正 · 主 agent 直接执行 · 可 revert**）：§5 T-DSK60 输入面前提收正——「0.10.1 不含更新器」系设计轮旧前提，已为当日重发窗覆盖（产物含 `app-update.yml`（`resources/` 下） ∥ feed 三件已传，实读 = 批档 `docs/batches/2026-10-01-desktop-packaging-release.md` §1）⇒ 首测点 = **0.10.1 → 0.10.2**。
- 2026-10-03（**桌面 Linux 产物批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-desktop-linux.md` §1 ∥ §1 补记二 · 台账 #847 · 需求 D42）：§1 增 **KD-73**（Linux 双产物 ∥ 构建机通道 ∥ 仓内修复三处 ∥ 更新面分流 ∥ check-dist Linux 臂 ∥ 站点 ∥ 取回落位；被否六候选）；**§2.11 新立**（2.11.1 流水线 ∥ 2.11.2 配置契约与修复 ∥ 2.11.3 校验与冒烟重裁 ∥ 2.11.4 更新面 ∥ 2.11.5 站点与发布 ∥ 2.11.6 失败面）；§2 引言 ∥ §2.7 目标行分期句收正（Linux = 本批 §2.11）；**§3.4 新立**（本批块——10 行）；**§4.4 新立**（验收面）；§5 增 **T-DSK61–63**；§6 增 **D42** 行（披露 + 上抛）；§2 页头需求卷标收正（D12 ∥ D32 ⇒ + D40 ∥ D41 ∥ D42）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**桌面 Linux 产物批 · 修复轮（机检红线清零）· eng-designer**——承 `docs/batches/2026-10-03-desktop-linux.md` §1 · 台账 #847）：锚面 24 悬空收正（域外第三方档坐标裸名化——坐标原值以后置括号形保留；`renderer/index.html` 补 `thincoder-desktop/` 前缀；`app-update.yml` 三处改「（`resources/` 下）」定位形）；宽面 4 行折行（279 ∥ 282 ∥ 288 ∥ 393——语义零改）。**零新语义**。复跑 `node scripts/doc-check.mjs`（仓根）= exit 0。
- 2026-10-03（**桌面 Linux 产物批 · 评审修复轮（评审轮 1 · 10 号逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-linux.md` §3 轮次 1 · 台账 #847）：① §3.1 ∥ §3.3 收正到本批实读（CHANGELOG **19 ⇒ 27** ∥ main.mjs as-of 口径注——消「现行」双值）；② §2.11.3 补顾问线拆分评审结论（保留单档 ∥ 抽档形态与触发判据）；③ §6 **D42** ② 翻「已收正」（引需求卷 `:16` ∥ `:24`）；④ §2.8.1 补门行指针（Linux 介质合项 = §2.11.4）∥ §2.11.4 补未武装态菜单项定裁 ∥ §3.4 行 10 列 §2.8.1 ∥ §2.9.7；⑤ §2.11.5 站点区块按 §2.9.3 粒度补齐（href 形 ∥ 按钮文案 ∥ 小字注 ∥ 系统要求句）；⑥ AppImage 执行位前置（§2.11.5 ∥ T-DSK62——`chmod +x`）；⑦ §4.4 三读数 ⇒ **四读数**（对齐 §2.11.3）；⑧ §3.4 行 9 补预估（~380 行）∥ 档位适用定裁；⑨ cache-control 扩展名全集钉定（§2.9.7 ∥ §2.11.5——含 `.AppImage`/`.deb`）；⑩ §2.11.1 补适用范围句（Node ≥ 24 vs 构建面）。**收正 ∥ 定裁 ∥ 粒度补齐**（均落评审 10 号面内）；`docs/RELEASE.md` 零触。复跑 `node scripts/doc-check.mjs`（仓根）= exit 0。
- 2026-10-03（**桌面 Linux 产物批 · 实施窗回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-desktop-linux.md` §2 ∥ §5 · 台账 #847）：§3.4 翻「实施落盘」形态（标题 ∥ 说明 ∥ 表头 ∥ 实测值回填——yml **63** ∥ package.json **29** ∥ icon.png **2872 B**（sha256 `08fe76b9…b57d`）∥ check-dist **339**（父侧面件）∥ update.mjs **227** ∥ main.mjs **265** ∥ AGENTS.md **27** ∥ CHANGELOG **33**（父侧面件）∥ 批内件 **172**）；§3.1 五行走读齐平（机检行数面回填工单——PACKAGING 侧 5 条清零）；§2.11.3 行数注收正（225 ⇒ 339）；`update.mjs` 两处「拟新增」⇒「已落」（KD-71 ① ∥ §2.8.1 题面——站点仓两项维持拟新增）。**零新语义**（回填 ∥ 读数）。明细 = 批档 §2 回填轮块。
- 2026-10-04（**渠道档位退役批 · fix 轮（U1 段名收正）· eng-designer**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §2 修正块 · 台账 #902）：设置面段名「模型与档位」⇒「**模型**」（en「Model & tier」⇒「Model」）——发布稿七段列表收正（§2.9.2）；产品码落点 = 实施轮（批档 §2 修正块）。**产品码零触（修正轮）**。明细 = 批档 §2 修正块。
