# 2026-10-01 · 桌面打包发布
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 22:19「把桌面打包发布做一下吧——现阶段先打成安装包发布到 thincoder.com 网站上可以下载，以后再做应用商店发布」（承接需求档 D32 分期：阶段一）。
> 台账 = #807（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（构建链净退 0 + 闸绿（dist-r4）∥ 收窗 0 ✓；开放项 = 原装位重跑 ∥ 残留清理 ∥ T-DSK55③ ∥ 站点轮（发布 = 用户门））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目（覆盖）**：D32 分期·**阶段一** = ① 打包链落定（`electron-builder.yml`——桌面首张）② **Windows x64 安装包**（NSIS）③ **官网（thincoder.com）下载入口与托管**。**阶段二（不在本批）**：应用商店（Windows 商店 ∥ Snap）+ macOS ∥ Linux 产物（构建机后补）。

**关键判据（父侧代选 · 用户可改）**：NSIS x64 ∥ 版本 **0.10.1**（CalVer 当月首发）∥ 图标 = 现制简单版（站点 brand 系）∥ **签名 = 实签为主路径**——证书**已购并验活**（2026-09-30 · GlobalSign EV · `CN=Shanghai Xinbo Technology Co., Ltd.` · eToken 5300/SafeNet；PE 实签通过）；构建期 = UKey 在位 + SAC + PIN；token 缺席 ⇒ 跳过签名 + 明示（降级不阻塞）。

**授权口径**：用户 22:19 令 + 会话既有全自动口径——设计 → 评审（代点火）→ §4（代签 · 三条件齐备）→ 实施 → 收口；**硬门即停**（新范围 ∥ 用户口径裁决 ∥ 不可逆动作）。

**过程要点**：D32 台账行此前缺——本批补建 **#807**；「证书已购」事实沿自 2026-09-30 验活收据（父侧 22:26 更正并入项目记忆——防再丢）。设计舱 = eng-designer 首轮（设计面已落：desktop `PROJECT.md` KD-64 等多节 ∥ `RELEASE.md` 并线 ∥ README 地图行；§2 曾因档头占位受阻——本笔清讫后复写）。

**评审 → 代签 → 实施（2026-10-01 22:55）**：评审轮 1 = **pass**（0🔴/3🟡/4🔵——§3 在档）→ 修复轮 1（§2.9 八条逐号落——父侧逐处核读通过；机检净增零）→ **§4 代签**（三条件齐备：评审 pass ∥ 修复核讫 ∥ token 在手）→ **eng-coder 实施轮点火**（九档产品面 + 批内件；构建 ∥ 真机 ∥ 站点 = 后续轮次——发布动作 = 用户门）。

**原装位重跑完成（构建窗 · 父侧 · 2026-10-03 09:4x——用户 09:25「UKey 插上了」）**：`npm run package`（镜像双设 = `ELECTRON_MIRROR` ∥ `ELECTRON_BUILDER_BINARIES_MIRROR` npmmirror）——**全链走通**：物化 → electron-builder 26.15.3 → **四件 EV 实签**（`ThinCoder.exe` ∥ `elevate.exe` ∥ `Setup.__uninstaller.exe` ∥ `ThinCoder-Setup-0.10.1.exe`——载体 powershell ∥ RFC3161 取时 ✓）→ NSIS → blockmap → postpackage **闸绿**（断言 5 条 + 更新面 4 条——`#832` 式 +4 断言首跑即绿）。**产物**（`dist/`）：`ThinCoder-Setup-0.10.1.exe`（107.6 MB ∥ sha256 `29fe80e3…d58680`）∥ `latest.yml`（version 0.10.1 ∥ sha512 实读）∥ `.blockmap`（0.1 MB）∥ `win-unpacked/`（含 `resources/app-update.yml`：provider generic ∥ url 契约 ✓）。**dev 链已恢复**（5/5 规范）。PIN = 全程未弹（SAC 已解锁态，四签直过）。**过程三挫如实**（①镜像值尾空格 ⇒ GitHub 挂 600s；②父侧引号事故 ⇒ 环境变量进日志（已删日志，建议轮换 token）；③被击杀进程留 toolset 锁（`%TEMP%\.electron-builder-toolset.lock`）⇒ 安安静静重试数分钟——已清、换 .cmd 脚本注入参数 + 智能盯梢后一跑到底）。**U4 实读**：publisherName = `Shanghai Xinbo Technology Co., Ltd.`（证书 CN）∥ `latest.yml` 字段齐（version/files[0].url/sha512/size/path/releaseDate）∥ **sha512 形 = 基 64 带填充（`==` 尾）**——设计档「无填充——实施窗钉定」句须随正（一行，见台账）。**余项**：T-DSK55 ③ 真机（用户择时，会断本窗）∥ 发布三动作 = 用户门（站点部署 ∥ feed 上传）∥ `dist-r3` 锁残留（重启后清）∥ `dist-r4` 保留（旧参考）。

**重打（2026-10-03 11:2x · 父侧——用户 11:22「软件是不是要重新打包一下？」）**：纳入上午第二实例笔（`main.mjs` 263 行——明示框 + 唤醒；原 09:50 版不含）。`npm run package`（同双镜像 .cmd 脚本）**180s 收官**：四件 EV 实签 ✓ ∥ blockmap ✓ ∥ postpackage **闸绿（断言 5 + 更新面 4）** ∥ dev 链已恢复 5/5。新产物（`dist/`）：`ThinCoder-Setup-0.10.1.exe`（107.6 MB ∥ **sha256 `023d07ca…bb78d`** ∥ sha512 见 `latest.yml`——新版）∥ `latest.yml`（releaseDate 2026-10-03T03:26Z）∥ `.blockmap`。旧 09:50 版已移 `.thincoder/tmp/desktop-dist-0950-20261003`（可还原）。**发布三动作仍 = 用户门**（站点部署 ∥ feed 上传 ∥ 真机走查）。

**发布执行（2026-10-03 11:2x—11:3x · 用户 11:27「安装包没问题了。发布吧」= 用户门放行）**：① **feed 上传**（`upload-download.mjs`——exe → blockmap → latest.yml 末传）：三件 PUT ✓（6.0s；尾部有 Windows 退出期 libuv 断言噪音——上传器已随修 `process.exitCode` 化）；**URL 实测**：`downloads/latest.yml` 200（version 0.10.1）∥ `downloads/ThinCoder-Setup-0.10.1.exe` 200（content-length **112,829,224** = 产物实值）∥ `.blockmap` 200（118,843）。② **站点部署**（`deploy-oss.mjs`）：15 档 0 失败（0.8s）；**页面实测**：`desktop.html` 200（含「桌面版指南」∥「自动更新」）∥ `download.html` 200（含「下载 Windows 安装包」+ exe 直链）∥ `/` 200（三条入口）∥ `changelog.html` 200（桌面端 v0.10.1）∥ `sitemap.xml` 200（desktop 行）∥ `about.html` 200（桌面版 0.10.1）。**判据注**：命令退出码受 Windows 退出期断言影响（以 URL/页面实测为准——全绿）。**余项**：T-DSK55 ③ 真机走查（用户择时/或已自测——待言）∥ `dist-r3` 锁残留（重启后清）。

**回执补（bash#17 · 2026-10-03 11:29）**：feed 上传命令 **exit code = 1**——根因 = 尾部 libuv 断言（`src\win\async.c:94`——`process.exit` 与 undici 连接回收竞态；Windows/Node24 已知类），**发生于三件 PUT 全部完成之后**（日志逐件 ✓ + URL 三件实测 200 = 实质达成）。**判据差额如实登记**：`RELEASE.md` §5.6「发布完成 = 发布命令 exit 0」文面未达（实测 1），实质达成（产物+页面全验）；修复 = 上传器 `process.exitCode` 化（已随站点仓提交 `0749c08`）——**该修复未复验**（下次上传窗首验；无浪费性重传以试）。建议：判据口径补注「断言类退出噪音不计入失败，以产物 URL 实测为准」（或随下次窗验后定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（构建窗实跑后值列回填 + 镜像行实测选定轮落——§4.1 ∥ §4.2 值 39 ⇒ 42 ∥ 373 ⇒ 376；§5.7 镜像行「实测选定」；门实跑零增；明细 = §2.13；2026-10-02）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 落点 |
|---|---|---|
| 1 | D32 阶段一 · 打包链落定（`electron-builder.yml`） | 设计 ✓（§2.4-①②；设计档 §5.1） |
| 2 | D32 阶段一 · Windows 安装包（NSIS x64 · **签名就绪**——用户 22:23 ∥ 22:5x 补正） | 设计 ✓（§2.4-③；设计档 §5.3） |
| 3 | D32 阶段一 · 官网（thincoder.com）下载（托管键形 ∥ 上传机制 ∥ 页面规格） | 规格 ✓（§2.5；执行 = 主 agent 轮——站点仓） |
| 4 | check-dist 续填（安装包 ∥ 预载 ∥ 渲染面 ∥ 签名态） | 设计 ✓（设计档 §5.5） |
| 5 | RELEASE.md 并线（§4 号段 ∥ §5 增阶段 3b ∥ §6 官网面） | **已落**（本设计轮——`docs/RELEASE.md` + `docs/README.md` 地图行） |
| 不在本批 | 应用商店（Windows 商店 ∥ Snap）∥ macOS ∥ Linux ∥ 免安装 zip ∥ 自动更新 ∥ 公证 = **阶段二**（台账 #749 保持 待讨论——本批零动） | — |

### 2.2 设计档落点

- `docs/desktop/design/PROJECT.md`：§2 **KD-64**（新增：作用域 ∥ 配置契约 ∥ 两核包物化 ∥ 构建序列 ∥ 签名就绪 ∥ 图标 ∥ 版本源 ∥ check-dist 续填 ∥ 官网托管 ∥ 发布线；含被否候选）；§4.1（新行 5 + 三行收正）；§4.2 本批「现行 ⇒ 预期」块（十一行）；**§5 重写**（打包链与发行面——5.1 配置契约 ∥ 5.2 构建序列 ∥ 5.3 签名就绪 ∥ 5.4 图标资产 ∥ 5.5 产物校验 ∥ 5.6 失败面 ∥ 5.7 其余面）；§6.1 批块；§7 **T-DSK55**；§8 边界（本批行 + 签名陈句收正）；§10 **DE**；变更记录
- `docs/RELEASE.md`：档头覆盖行 ∥ §1 顺序 ∥ §3 N5 ∥ §4.2-5 ∥ §4.4 ∥ §5.0-P4 ∥ §5.1 ∥ §5.2-2 ∥ §5.2-4 ∥ §5.5（render-core 内嵌形按打包器分流）∥ **§5.6 新**（原 §5.6 ∕ §5.7 ⇒ §5.7 ∕ §5.8 顺延）∥ §6.1–§6.6 ∥ 变更记录
- `docs/README.md`：§1 地图行（三发布单元 ⇒ 四）+ 变更记录
- 零触：核 ∥ CLI ∥ VSC ∥ 站点仓（规格住本档 §2.5）

### 2.3 受影响文件与测试面（现行 ⇒ 预期——含尺寸两列）

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml` | **无 ⇒ ≈55**（新建——阶段一契约） | 打包面 |
| 2 | `thincoder-desktop/package.json` | **24 ⇒ ≈26**（+`prepackage`；版本发布窗定号 0.0.0 ⇒ 0.10.1） | 脚本面 |
| 3 | `thincoder-desktop/scripts/materialize-deps.mjs` | **无 ⇒ ≈70**（新建——源树实拷物化） | 打包面 |
| 4 | `thincoder-desktop/scripts/win-sign.mjs` | **无 ⇒ ≈80**（新建——签名 hook 两态） | 签名面 |
| 5 | `thincoder-desktop/scripts/make-icon.mjs` | **无 ⇒ ≈120**（新建——零依赖图标生成器） | 资产面 |
| 6 | `thincoder-desktop/build/icon.ico` | **无 ⇒ 多尺寸资产**（二进制——不入行数账） | 资产面 |
| 7 | `thincoder-desktop/scripts/check-dist.mjs` | **128 ⇒ ≈180**（续填四类断言 + 签名态） | 校验面 |
| 8 | `thincoder-desktop/CHANGELOG.md` | **无 ⇒ ≈10**（发布窗首建） | 发布面 |
| 9 | `thincoder-desktop/AGENTS.md` | **24 ⇒ ≈25**（`package` 命令行收正） | 文档面 |
| 10 | 批内件 `docs/batches/2026-10-01-desktop-packaging-release.test.mjs` | 拟新增（物化 ∥ 生成器 ∥ 断言纯函数面；随批留存） | 全批 |
| 11 | 设计 ∥ 发布 ∥ 地图三档 | 见 §2.2（本设计轮已落——勿重写） | 全批 |

零触面：`src/**` ∥ `renderer/**` ∥ 核 ∥ CLI ∥ VSC ∥ 站点仓；测试面随修随加——不占设计条目（2026-09-27 裁定）。

### 2.4 机制设计（要点——单源 = 设计档 §2 KD-64 ∥ §5）

① **配置契约**：`appId com.thincoder.desktop` ∥ `productName ThinCoder` ∥ `win.target = nsis`(x64) ∥ `artifactName = ThinCoder-Setup-${version}.${ext}` ∥ `win.icon = build/icon.ico` ∥ asar 缺省 ∥ `files` 白名单（`src/**` + `renderer/**` + `package.json`；生产依赖独立随装——实读 `app-builder-lib/out/fileMatcher.js:177-191`「grab only excludes」）∥ NSIS assisted（`oneClick:false` ∥ `perMachine:false` ∥ `allowToChangeInstallationDirectory:true` ∥ `deleteAppDataOnUninstall:false`）。
② **两核包内嵌 = 物化（源树实拷）**——判由：electron-builder 无 follow-symlinks 面（junction 以 `lstat` 入账 ≢ directory ⇒ 不入递归队列——`out/util/NodeModuleCopyHelper.js:102-104`；symlink 入 asar = `{type:"link"}` 节点——`out/asar/asarUtil.js:196-207` ⇒ 装后断链）+ §5.3「打包物化一律源自源树」；脚本 = `scripts/materialize-deps.mjs`；序列 = 物化 → package（check-dist 闸）→ `dev-link --force` 恢复 + `--check` = 0（终态）。
③ **签名就绪**：GlobalSign EV 已到位（指纹 `1B89F84D20EF2BE361D178EE2EA41228879CBE02` ∥ eToken 5300 ∥ SAC 10.9）；`win.signtoolOptions.sign` = hook（指纹探测 ⇒ 在位实签（`/sha1` + RFC3161 时间戳）∥ 缺席跳过 + 明示——两态同管线；发布版须「已签」）；构建期要求 = UKey + SAC + PIN（构建者在场）；时间戳 URL = 实施期实测选定。
④ **图标**：`build/icon.ico` 多尺寸（16–256）；生成器零依赖（`</>` + `#2563eb`——与站点 favicon 同形）。
⑤ **版本源**：`package.json` 单源；首版 **0.10.1**（发布窗定号）；产物名 / check-dist / 站点卡片三面同号。
⑥ **check-dist 续填**：安装包名形 × 版本 ∥ 预载 ∥ 渲染面 ∥ PE 签名态（信息行）；既有核包断言与版本逐字不变。

### 2.5 站点侧规格（执行 = 主 agent 轮 · thincoder.com 零写）

- **download.html**：桌面卡（置卡片区首——本批发布主产物；`</>` 图标 ∥ 「Windows 10 ∥ 11（x64）」∥ 主按钮 = 直链 `https://thincoder.com/downloads/ThinCoder-Setup-0.10.1.exe`）；系统要求节 + 桌面行（版本随发布）；更新节 + 桌面句（手动下载覆盖——自动更新不做）；meta description 随动。
- **about.html**：当前版本行 + 桌面端（三处同值纪律 = `docs/RELEASE.md` §6.1）。
- **changelog.html**：增「桌面端」节（首发 v0.10.1 条目；条目形 = 同档 §6.2 既有形）。
- **托管键形**：`downloads/ThinCoder-Setup-<号>.exe`；缓存 `max-age=86400`（同号重传窗口 ≤1 天——核验加查询串）。
- **上传机制 = 独立小件**（建议）：站点仓 `scripts/upload-download.mjs`（单键 PUT ∥ 复用 OSS HMAC 签名式（照 `deploy-oss.mjs:84-101` 形）∥ DRY_RUN 面）；**不并 `deploy-oss.mjs`**——由：① 其语义 = 「www/ 全量发布」（并入 = 每站发重传 100MB 级包）② **prune 误删面**：`OSS_DELETE=1` 时 `stale = 全桶键 − 本地键`（`:230-238`）⇒ `downloads/**` 必被判陈旧删除——附带加固 = prune 面加 `downloads/` 前缀豁免（= 设计档 §10 DE②）。
- **install.html**：不做（边界）。

### 2.6 验收对照（逐项可机检）

| 面 | 判据 | 载体 |
|---|---|---|
| 机检 | `node scripts/check-dist.mjs` exit 0（全断言）∥ 产物名 × 源版本一致 ∥ 收窗 `dev-link --check` = 0 | 实施轮 ∥ 收窗 |
| 真机 | **T-DSK55**：装 → 启 → 卸（已签 ∥ 未签两臂） | 用户走查 + 父侧真跑闭合 |
| 官网 | URL 可达（200 + 字节数一致）∥ 站点三处版本面 = 本次号 | 站点轮 |
| 边界 | 无自动更新 ∥ 阶段二项零触 ∥ 站点仓零写 | — |

### 2.7 关键决策（逐条由）

1. **物化（源树实拷）而非 follow**——electron-builder 无 follow 面（实读在册）∥ §5.3 源自源树。
2. **NSIS 单产物**（免安装 zip 缓）——用户诉求 = 安装包；少产物面 / 少断言。
3. **签名 = sign hook 按指纹**（非 `certificateSubjectName` 直配）——两态同管线（直配径 token 缺席 ⇒ 硬失败、无降级）。
4. **图标 = 生成器 + 入库 .ico**——确定性 ∥ 可复跑 ∥ 与站点品牌同形。
5. **上传 = 独立小件**（不并 deploy-oss）——prune 误删面 + 重传面。
6. **桌面入版本面（三处）+ changelog 桌面节**——「三处同值」纪律延伸。

### 2.8 上抛项 / 登记

- 设计档 §10 **DE** 四件（图标 PNG 复用 ∥ deploy prune 加固 ∥ 时间戳 URL 实测 ∥ §6.4 生成器输入随站点轮）。
- 登记：`docs/README.md` 地图行已随本批收正（三 ⇒ 四发布单元）；台账 #749（渠道扩展 = 阶段二载体）保持 待讨论——本批零动。
- 披露：本批设计经用户两则补正（2026-10-01 22:23 ∥ 22:5x——签名诉求）定形；「证书获取 = 用户动作」按后则更正为「已购并验活」——设计按已到位形落（批档头注在册）。
- 补记：§2 写入首跑被批档门拒（档头骨架死占位）；经父侧清档头后于本轮复写落档（暂存副本曾备于 `.thincoder/tmp/2026-10-01-desktop-packaging-release.section-2.md`——以本段为准）。

### 2.9 修复轮 1（评审轮 1 · 发现 1–7 逐号 + #8 父侧预检）——eng-designer

承本档 §3 轮次 1（发现 1–7 · 父侧裁 = 全采纳）∥ 父侧实机取证 **#8**（非评审发现——随本轮一并落）。

| # | 处置 | 落点（修后 as-of 坐标） |
|---|---|---|
| 1 | 三处分期限定——阶段一 = Windows 产物存在 + 本平台冒烟；macOS ∥ Linux 产物与三平台 CI 随阶段二（同源 = §5.7「目标（分期）」行）；需求档侧分期注 = 父侧笔（已收正在案——本轮零动） | `docs/desktop/design/PROJECT.md:1387`（D12）∥ `:1465`（A3）∥ `:1498`（T-DSK14） |
| 2 | §6.1 增「斜径命令面批（验收面 · 2026-10-01 · 台账 #761）」块（需求回指 = D34 ∥ 设计单源 ∥ 机检面 = 批内件 **425 行 · 18 例全绿**〔本舱复跑复核——腿 1–9 含 6A–6J〕∥ 真机面 = T-DSK56 + D16 义务）；§7 增 **T-DSK56**（真 Electron 五腿）；§10 增 **DF**（自铸披露）；§8 增本批边界行 | `:1455-1457`（§6.1 块）∥ `:1538`（T-DSK56）∥ `:1748`（DF）∥ `:1627`（§8 行） |
| 3 | `docs/RELEASE.md` §5.6 步骤 3 补仓根坐标（**在 `thincoder` 仓根执行** + `cd ..` 行） | `docs/RELEASE.md:270-273` |
| 4 | 档头需求侧行 ∥ §6.1 表头计数 ⇒ **D1–D35**；表头下附句（D35 尚无设计面——需求自注「实现形待设计」= 台账 #801；非本档缺项） | `:6` ∥ `:1370` + `:1372` |
| 5 | §10 **DE ④** 措辞收正——点名站点仓生成器 `thincoder.com/scripts/gen-changelog.mjs`（实读只含 `--side` 两值 cli ∥ vsc）；RELEASE.md §6.4 档面已含桌面输入（本批随动已落） | `:1747`（DE ④） |
| 6 | §7 **T-DSK55 ③** 括注改指 §5.1 行（**家目录面本不随包**——单源 = §5.1「`nsis.deleteAppDataOnUninstall`」行）；按键归因删 | `:1537` |
| 7 | §4.2 批内件行补规模预估（拟新增 ≈300 行——三面腿：物化 ∥ 图标生成 ∥ check-dist 断言纯函数） | `:1282` |
| #8 | **签名载体二择收正**（§5.3）：① PowerShell `Set-AuthenticodeSignature`（主——零依赖 ∥ 本机实证：签名 status ∥ verify = Valid，签名者 = `CN="Shanghai Xinbo Technology Co., Ltd."`）∥ ② `signtool`（备——仅当实施期可得：Windows SDK ∥ `winCodeSign` 缓存下载）；§5.3 增「载体预检实得」句（本机未装 signtool——PATH ∥ Windows Kits ∥ electron-builder 缓存三查零命中）；§5.6 增「`signtool` 缺席」行（处置 = 回退主载体，不回退为「跳过」）；同行「签名跳过明示」根因删 signtool 缺席；**KD-64 ⑤** 载体句随动 | `:1321-1324`（§5.3）∥ `:1351-1352`（§5.6）∥ `:109`（KD-64 ⑤） |

- 计数随正（本舱自检捕获）：§8 行「CLI 27 条中未落者」= **22**（另批 13 ∥ 不做 9——`/help` 增量后口径；原稿「另批 14」= 增量前残值，已收正）。
- 两档变更记录各追一行（PROJECT.md `:2208` ∥ RELEASE.md `:399`）。
- 机检净增核对（`node scripts/doc-check.mjs`——全部编辑后复跑）：悬空 **122 ⇒ 122** ∥ 行宽 **120 ⇒ 120** ∥ 拟新增 59 ⇒ 59 ∥ 迁移期引文 297 ⇒ 297（净增零；新增行 ≤300 字符 ∥ 表格行 ∥ 区带豁免）。
- 批内件复核：`node --test docs/batches/2026-10-01-desktop-slash-commands.test.mjs` ⇒ **18 pass / 0 fail**。
- 披露：§8 行「核共享层缝」实况 = **纯加法可选**（不传 `deps.slash` ⇒ 现行为零变——VSC 零接缝）∥ CLI ∥ VSC ∥ `thincoder-core` 零触——与斜径批实况一致（非「全零触」）。
- 零新语义（收正 ∥ 计数 ∥ 映射补齐）；产品码 ∥ `thincoder-desktop/**` ∥ 需求档 ∥ 站点仓 ∥ 本档 §1/§3–§6 零触。

### 2.10 实施后收正轮（设计面 · 2026-10-01）——eng-designer

承本档 §5 未决项 ①（`win.signtoolOptions` 未设 `signingHashAlgorithms` ⇒ hook 每文件被调两轮——缺省 `["sha1","sha256"]`）∥ ⑤（设计档 §4.1 ∕ §4.2 规模值回填）＋父侧裁（修复值 = `signingHashAlgorithms: ["sha256"]`）：

| # | 落点 | 收正 |
|---|---|---|
| 1 | 设计档 **§5.1（配置契约）** | 增行 `win.signtoolOptions.signingHashAlgorithms` = `["sha256"]`（消双重调用——运行面单轮；缺省两轮 = sha1 + sha256）；该修复的设计面先落（docs-first——yml 落行 = 修复轮，随 coder） |
| 2 | 设计档 **§4.1（八行）／§4.2 本批块（十行）** | 值列翻「现行 ⇒ 实读（实施落盘）」——`electron-builder.yml` 无 ⇒ **37**（+`signingHashAlgorithms` 行 ⇒ +1~2——终值随实施回归）∥ `package.json` 24 ⇒ **25** ∥ `materialize-deps.mjs` 无 ⇒ **143** ∥ `win-sign.mjs` 无 ⇒ **163** ∥ `make-icon.mjs` 无 ⇒ **171** ∥ `build/icon.ico` 无 ⇒ **4 151 B**（二进制资产——不入行数账）∥ `check-dist.mjs` 128 ⇒ **188** ∥ `CHANGELOG.md` 无 ⇒ **13** ∥ `AGENTS.md` 24 ⇒ **25** ∥ 批内件 **372 行 · 20 用例**（五面腿：L1 物化 5 ∥ L2 图标 3 ∥ L3 check-dist 6 ∥ L4 签名 4 ∥ L5 配置 2） |
| 3 | **§2.3 表值列收正** | 原 = 预期值（行 1–10）；以实施落盘实读为准（= 上行同值）——表不回改（追加制；本块即收正记录；沿本档先例「以 §5 实况为准」） |
| 4 | 变更记录 | 设计档 `docs/desktop/design/PROJECT.md` 追一行（`：2210`） |

- 设计档坐标（as-of 本笔）：§5.1 增行 `:1308` ∥ §4.1 `:172-173` ∥ `:317-322` ∥ §4.2 本批块 `:1269-1282` ∥ 变更记录 `:2210`。
- **机检对账**（`node scripts/doc-check.mjs` 复跑）：悬空 **122 ⇒ 122** ∥ 行宽 **120 ⇒ 120** ∥ 拟新增 41 ⇒ 41 ∥ 迁移期引文 297 ⇒ 297（闸面净增零）；报告面（符号·宽）悬空 872 ⇒ 876（+4 = 本轮 `signingHashAlgorithms` 新增提及——包外配置键，不入闸）。
- **遗留观察**（明示 · 本轮零动）：§5 根注 ∥ §5.1 档头 ∥ §5.1 sign 行 ∥ §5.3 ∥ §5.4 ∥ §5.7 六处「（拟新增）」标——待 yml 修复轮落行后统一「转正」。
- 零新语义（读数 ∥ 收正）；产品码 ∥ `docs/RELEASE.md` ∥ 需求档 ∥ 本档 §1/§3–§6 ∥ 其余批次——零触。

### 2.11 文档面回填轮（设计面 · 2026-10-01 · #9 修复轮核讫后）——eng-designer

承本档 §5 定点修复轮（三档落盘：yml **39** ∥ `.gitignore` **8** ∥ 批内件 **373**）+ §6 #9 核讫（三档实读 + 父侧亲跑 20/20）+ §2.10 自记窗口（「修复轮 +1~2——终值随实施回归」∥ 遗留观察六处「（拟新增）」转正——yml 修复轮已落行 ⇒ 触发）。派单 = 打包族载句与值列回填（他批面零触 ∥ §2.3 原表不回改——追加制 ∥ 产品码零触）。

**号 → 改动（file:line）**

| # | 落点 | 改动 |
|---|---|---|
| 1 | 设计档 §4.1（`:173`） | `thincoder-desktop/electron-builder.yml` 值 **37 ⇒ 39**（修复轮 +2——注释 ∥ `signingHashAlgorithms` 行；「终值随实施回归」兑现） |
| 2 | 设计档 §4.1（`:174`） | `thincoder-desktop/.gitignore` 值 **5 ⇒ 8**（修复轮 +3——注释 ∥ `dist/` 条目）+ 说明列补 `dist/` 忽略面 |
| 3 | 设计档 §4.2 本批块（`:1269-1282`） | 行 1 yml **无 ⇒ 39**（∥ `signingHashAlgorithms` 补列；修复轮 +2 注兑现）∥ 行 10 批内件 **372 ⇒ 373 行 · 20 用例** ∥ 表头括注补 `.gitignore` **5 ⇒ 8**（该档无独立行——最小笔） |
| 4 | 设计档 §5 六处（`:1289` ∥ `:1291` ∥ `:1307` ∥ `:1325` ∥ `:1332` ∥ `:1361`） | 「（拟新增）」转正——按现盘落实状态删标（yml ∥ win-sign ∥ make-icon 三档已落）；normative face 不再携失效标 |
| 5 | 设计档变更记录（`:2212`） | +1 行（本轮回填在盘） |
| 6 | 本档 §2.11（本笔）+ §2 状态行 | §2.10 兑现 ∥ 状态行随动 |

**读回 ∥ 机检读数（逐条实跑）**

- 逐处读回（D6）：上 1–5 各处在盘（编辑回执逐处 + §4.1 ∥ §4.2 ∥ §5 ∥ 变更记录四处复读）。
- 行数账实读（KD-4 口径——单源 = `scripts/doc-check-linecounts.mjs` `countContentLines`）：`electron-builder.yml` ⇒ **39** ∥ 批内件 ⇒ **373** ∥ `.gitignore` ⇒ **8**；余本批档同 §2.10（**25** ∥ **143** ∥ **163** ∥ **171** ∥ **4 151 B** ∥ **188** ∥ **13** ∥ **25**）。
- `node scripts/doc-check.mjs` 复跑：悬空 **122 ⇒ 122** ∥ 行宽 **120 ⇒ 120** ∥ 拟新增 **41 ⇒ 41** ∥ 迁移期引文 **297 ⇒ 297**（闸面净增零）；报告面（符号·宽）**872 ⇒ 872**（候选 42806 ⇒ 42808——:2212 两枚提及均解析）；行数面差异 **9 ⇒ 7 条**（消 :173 ∥ :174——余 7 条 = 他批档回填工单，非本批面）。
- **拟新增计数与派单预期偏差（如实）**：派单预期「41 ⇒ 35——六处转正」未现——该六处标的路径均已落盘解析，「（拟新增」标对已解析路径为无输出分支（计数仅收「悬空 + 标」——单源 = `scripts/doc-check-anchors.mjs:272-286`）⇒ 六处转正 = normative face 卫生项（删失效标），机检计数面本为零变。
- 零新语义（读数 ∥ 转正）；他批面（排版族 ∥ 轮五档 ∥ 其余批次）∥ §2.3 原表 ∥ 产品码——零触。

### 2.12 构建窗缺陷修复轮（设计面先落——docs-first · 2026-10-02）——eng-designer

承实测构建（2026-10-01 深夜 · `ELECTRON_MIRROR=… npm run package`）NSIS 尾段崩溃于 v26 update-info 路径：构日志（`.thincoder/tmp` 侧 tool-results `1790870188426-bash-15.log` 行 46–48）`⨯ Cannot read properties of null (reading 'channel')` @ `updateInfoBuilder.ts:47` ← `createUpdateInfoTasks`——根因 = 无 `publish` 配置触发。
**整链退出码非零 ⇒ `postpackage`（check-dist 闸）被截断未跑**；另产非设计面残件 `app-update.yml`（空配置形）。

裁定 = **显式 `publish: null`**（v26.15.3 源语义实读在案：显式 null ⇒ `getPublishConfigs` 即返 null ⇒ update-info ∥ `app-update.yml` 路径整体不启；源注释逐字「if explicitly set to null - do not publish」；官网托管走独立小件（本批既定）——不走 electron-builder 发布通道）。
**安装包本体不受影响**（已建成已签——112,468,344 B ∥ 三签名 Valid ∥ RFC3161 时间戳 Valid；② 实测面已兑现，本轮零动）。

**号 → 改动（file:line）**

| # | 落点 | 改动 |
|---|---|---|
| 1 | 设计档 `docs/desktop/design/PROJECT.md` §5.1 配置契约表（`:1309`） | 增行 `publish` = `null`（显式不发布——官网托管独立通道）；说明 = 消 v26 update-info 路径（缺省时 nsis 尾段 `channel` null 崩溃 ⇒ `postpackage` 闸被截断；显式 `null` = 官方「don't publish」形，v26.15.3 源注释在册） |
| 2 | 设计档 §5.2 构建序列（`:1319` 括注） | 补半句——`publish: null`（显式 · §5.1）：官网托管独立通道；消 v26 update-info 路径 ⇒ 链完整至 `postpackage` 闸（缺省 ⇒ nsis 尾段崩、闸截断——§5.6） |
| 3 | 设计档 §5.6 失败面（`:1357`） | 增行——nsis 尾段崩溃（`Cannot read properties of null (reading 'channel')`）∥ 根因（无 `publish` 配置 ⇒ `computeChannelNames` 读 null——整链非零退出、闸被截断）∥ 处置（显式 `publish: null` ⇒ update-info ∥ `app-update.yml` 路径整体不启；修后链完整过闸） |
| 4 | 设计档变更记录（`:2215`） | +1 行（本轮在盘） |

**读回 ∥ 机检读数（逐条实跑）**

- 逐处读回（D6）：上 1–4 各处在盘（编辑回执逐处 + 复读；行号届盘自核）。
- `node scripts/doc-check.mjs`（thincoder 仓根 · 本轮四笔后复跑）——**悬空 122 ⇒ 122 ∥ 行宽 120 ⇒ 120 ∥ 拟新增 41 ⇒ 41 ∥ 迁移期引文 297 ⇒ 297**（闸面净增零；新增行 ≤300 字符 ∥ 表格行 ∥ 变更记录区带豁免）。
- 行数面差异 **8 ⇒ 8**（基线实读 8；#12 记 7——余 +1 非本席笔迹，他批面）；报告面（符号·宽）候选 **42808 ⇒ 42811**（+3 = `Cannot` ∥ `updateInfoBuilder` ∥ `computeChannelNames` 三枚新增提及——首枚源内解析、后两枚报告面，均不入闸）。
- 遗留观察（明示 · 本轮零动）：yml 落行（`publish: null`）后 §4.1 ∥ §2.3 的 yml 行数值列（现 39）预计随 coder 修复轮 +1——回填窗口随该轮后择（本舱不预改）。
- yml 落行 = 紧随的 coder 修复轮（本舱只落设计面）；**产品码 ∥ 他批面（排版族 ∥ 轮五档等）∥ 其余 §5 节——零触**。

### 2.13 值列回填 + 镜像行实测选定轮（构建窗实跑后 · 设计面）——eng-designer

承 2026-10-02 深夜构建窗实跑（electron-builder **exit 0** ∥ 全件签名 ∥ check-dist 绿 ∥ 收窗 0）后两处文档面收正：① 值列回填（#17 后实读——KD-4 内容行数口径 · 单源 = `scripts/doc-check-linecounts.mjs`）；② §5.7 镜像行「候选」⇒「实测选定」（构建窗实证落档）。只动设计档 + 本档 §2——产品码 ∥ `electron-builder.yml` ∥ 批内件 ∥ 他批面零触。

**号 → 改动（file:line）**

| # | 落点 | 改动 |
|---|---|---|
| 1 | 设计档 §4.1（`:173`） | `thincoder-desktop/electron-builder.yml` 值 **39 ⇒ 42**（构建窗修复轮 +3——注释 ∥ `publish: null` 键 ∥ 块间空行；修复轮 +2 注保持） |
| 2 | 设计档 §4.2 本批块（`:1273` ∥ `:1282`） | 行 1 yml **无 ⇒ 42**（契约列补 `publish: null`；构建窗修复轮 +3 注）∥ 行 10 批内件 **373 ⇒ 376**（父侧工具面修正 +2〔check-dist 读面 ∕ L3 夹具——读面缺陷修复轮〕∥ 构建窗修复轮 +1〔L5 `publish` 断言〕——父侧核讫） |
| 3 | 设计档 §5.7 镜像行（`:1369`） | `ELECTRON_BUILDER_BINARIES_MIRROR`「候选（实施期实测选定）」⇒「**实测选定**」（构建窗 2026-10-02 实测：NSIS 工具下载必需——无镜像时 `read ECONNRESET`（`nsis-3.0.4.1.7z` 下载）实据在册；值 = `https://npmmirror.com/mirrors/electron-builder-binaries/`） |
| 4 | 设计档变更记录（`:2216`） | +1 行（本轮在盘） |
| 5 | 本档 §2.13（本笔）+ §2 状态行 | 本轮落档记录 ∥ 状态行随动 |

**读回 ∥ 机检读数（逐条实跑）**

- 逐处读回（D6）：上 1–4 各处在盘（编辑回执逐处 + 复读；行号届盘自核）。
- 行数账实读（KD-4 口径——单源 = `scripts/doc-check-linecounts.mjs` `countContentLines`）：`electron-builder.yml` ⇒ **42** ∥ 批内件 ⇒ **376**（落笔前实读核对——与父侧口径同值）。
- `node scripts/doc-check.mjs`（thincoder 仓根 · 本轮五笔后复跑）：**悬空 122 ⇒ 122 ∥ 行宽 120 ⇒ 120 ∥ 拟新增 41 ⇒ 41 ∥ 迁移期引文 297 ⇒ 297**（闸面净增零）；报告面（符号·宽）候选 **42811 ⇒ 42814**（+3 = `ECONNRESET` ×2〔`:1369` ∥ `:2216`〕∥ `ELECTRON_BUILDER_BINARIES_MIRROR` ×1〔`:2216` 变更记录新行〕——均报告面，不入闸）；**行数面差异 9 ⇒ 8**（消 `:173`——表 39 ⇒ 实读 42 差异闭合；基线 9 = §2.12 记 8 ＋ coder 修复轮落行新增 `:173` 一行；余 8 = 他批档回填工单 ∥ 一行式异常，非本批面）。
- `publish: null` 相关（§5.1 ∥ §5.2 ∥ §5.6 `:1357` ∥ 变更记录 `:2215`）已由前轮落定——本轮零动；§2.3 原表不回改（追加制）。
- 零触：产品码 ∥ `thincoder-desktop/electron-builder.yml` ∥ 批内件 ∥ 他批面（排版族 ∥ 轮五档 ∥ 其余批次）——零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（三档对账：`docs/desktop/design/PROJECT.md` ∥ `docs/RELEASE.md` ∥ `docs/desktop/requirements/PROJECT.md`）· 抽查复核命中：`thincoder-desktop/package.json` = **24**（与 `PROJECT.md:172` 一致）· `thincoder-desktop/scripts/check-dist.mjs` = **128**（与 `:317` ∥ `:1279` 一致）· `thincoder-desktop/AGENTS.md` = **24**（与 `:1281` 一致）；本批改动面未跨 300 ∥ 500 层（check-dist 128 ⇒ ≈180 < 300，无拆分案必要）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 ∥ 验收 | 🟡 | 分期令未对账：本档 §5 明定阶段一 = 仅 Windows（`docs/desktop/design/PROJECT.md:1358`「阶段一 = Windows（NSIS 安装器 · x64）」∥ `:1289`），但 §6.1 D12 行仍判「三平台产物存在」（`:1382`）、§6.2 A3 仍判「三平台 CI 矩阵」（`:1456`）、§7 T-DSK14 期望句仍为「三平台产物齐备」（`:1489`）；需求档同面亦未收正（`docs/desktop/requirements/PROJECT.md:157` D12 ∥ `:200` §6 平台行「不是先 Windows 后扩」∥ `:213` A3）⇒ 阶段一下 A1「每条功能点机检判据全绿」不可达 | 按 D32 分期令给验收面补分期限定（D12 行 ∥ §6.2 A3 ∥ T-DSK14 标「阶段一 = Windows 产物与冒烟；macOS ∥ Linux 与三平台 CI 随阶段二」），并同步需求档 §6 平台行 ∥ A3 ∥ D12 的分期口径（或明标「需求侧待收正」） |
| 2 | 验收覆盖 | 🟡 | D34（斜杠命令族）无验收映射：全文未检出该批 §6.1 验收块 ∥ §7 用例行（T-DSK56 号未用）∥ §8 本批边界行——可检面只在 §4.2 块内批内件（`:1147` ∥ `:1152-1171`）；与同族近批（D29 ∥ D30 ∥ D31 ∥ D32 ∥ D33 均有「§6.1 块 + T-DSK5x + §8 行」）不一致，D16 真机义务面亦未点出 | 补 §6.1 块 + §7 用例行（真 Electron：`/model` 开菜单 ∥ `/help` 流内打印 ∥ 回落 toast + 文本保留），或明注「D34 验收载体 = 批内件 + 父侧真机走查（机检豁免）」消歧 |
| 3 | 清晰性（发布档操作面） | 🟡 | `docs/RELEASE.md` §5.6 步骤 3 的 `node scripts/dev-link.mjs --force && … --check`（`:272-273`）紧跟步骤 2 的 `cd thincoder-desktop`（`:264`）且未标回仓根；`dev-link.mjs` 只在仓根 `thincoder/scripts/`（同档 `:186`「在 `thincoder` 仓根跑」）⇒ 照抄执行即解析失败 | 步骤 3 补显式仓根坐标（`cd ..` ∥ 括注「在 `thincoder` 仓根执行」），与 §5.0 P3 ∥ §5.3 口径同形 |
| 4 | 文档状态（计数漂移） | 🔵 | 需求侧计数三处不同步：设计档头「D1–D34」（`:6`）· §6.1 表头仍「D1–D33」（`:1367`）· 需求档现为 D1–D35（`requirements/PROJECT.md:180` D35「实现形待设计」） | 两处计数同步 D1–D35；注 D35 尚无设计面（需求自注待设计，非本档缺项） |
| 5 | 文档状态（悬项 ∥ 跨档滞后） | 🔵 | §10 **DE ④**（`:1736`）称「`docs/RELEASE.md` §6.4 生成器输入面…需增桌面 `CHANGELOG.md`」，而 RELEASE.md §6.4 现行输入面已含「三端 `CHANGELOG.md`（CLI ∕ VS Code 扩展 ∕ 桌面）」（`:352`）⇒ 若指本仓档面则该悬项已落（stale）；若指站点仓脚本则未点名 | DE ④ 收正措辞：点名站点仓脚本（路径）为动作对象，或标「RELEASE.md 档面已落」——二者取一 |
| 6 | 验收判据归因 | 🔵 | §7 **T-DSK55 ③** 把「`~/.thincoder/` 用户数据保留」的判据括注为 `deleteAppDataOnUninstall:false`（`:1528`），该键管的是 AppData userData；家目录数据保留与包无关（本档 §5.1 `:1306` 自述「家目录面本不随包」） | T-DSK55 ③ 括注改指 §5.1 行，或删按键归因、保留「保留」事实断言 |
| 7 | 受影响文件 ∥ 规模标注 | 🔵 | 本批 §4.2 块批内件行未给规模预估（`:1282`——无「≈N 行」），同档近批块惯例给出（例 `:1264` ≈200 行） | 批内件行补规模预估（≈N 行 ∥ 用例腿数），与同档块惯例同形 |

计数：**0 🔴 ∥ 3 🟡 ∥ 4 🔵**。
VERDICT: pass

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户 22:19 令 + §1 授权口径（设计 → 评审 → §4（代签 · 三条件齐备）→ 实施 → 收口）+ ① 评审轮 1 = **pass**（0🔴 ∥ 3🟡 ∥ 4🔵——§3 在档）+ ② 修复轮 1 核讫（§2.9 八条逐号落——父侧逐处核读：`:1387` ∥ `:1465` ∥ `:1498` ∥ `:1538` ∥ `:1747-1748` ∥ `:6`/`:1370` ∥ `:1321-1324` ∥ `:1537` 等；`docs/RELEASE.md:270-273`；机检净增零（悬空 122⇒122 ∥ 行宽 120⇒120））+ ③ 设计 token 在手（评审通过已签发——值不落档）。
**用户 22:40 裁定（在案）**：`nsis.deleteAppDataOnUninstall` 维持 `false` = **卸载不删数据**——与现设计一致（零改动）。
**批准范围** = §2 全（**以 §2.9 修复面为准**）：阶段一 = 打包链（`electron-builder.yml`）∥ Windows x64 NSIS 安装包（签名就绪 · 两态同管线 · 主载体 PowerShell）∥ check-dist 续填 ∥ 官网托管规格（执行 = 主 agent 轮 ∥ 站点仓零写）。实施轮 = 本批准面上码；**发布动作（定号 ∥ 上传 ∥ 挂载）仍为用户门**；构建 ∥ 真机走查 ∥ 站点 = 后续轮次。

## §5 实施记录（eng-coder）
**状态行**：实施完成（构建窗缺陷修复轮落——`publish: null`（yml :20-21）∥ L5 断言（批内件 :322）；审计零发现 ∥ advisor 轮 1 pass（0🔴/2🟡/4🔵——无 must-fix）；余账在案（§5 末块）；构建 ∥ 真机 ∥ 站点 = 后续轮次）



**实施轮（initial · 2026-10-01 · eng-coder）**——承 §2.3 十行表 ∥ §2.4 六条要点 ∥ §2.9 修复面逐行落；设计单源 = 设计档 §5（重写版）。全批 = 构建期 ∥ 资产 ∥ 文档面——`src/**` ∥ `renderer/**` 零改。声明面披露：`scripts/**` 与 `CHANGELOG.md` 属工程工具面 ∥ 父侧维护类（不在 files 声明面——照常交付，在此逐处披露）。

**交付表（现行 ⇒ 实读；行数 = 实读内容行数）**

| # | 档 | 现行 ⇒ 实读 | 要点 ∥ 读数 |
|---|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml` | 无 ⇒ **37** | §5.1 逐值照抄（appId `com.thincoder.desktop` ∥ productName `ThinCoder` ∥ directories.output `dist` ∥ files 白名单三目 ∥ asar true ∥ win.target nsis+x64 ∥ win.icon `build/icon.ico` ∥ artifactName `ThinCoder-Setup-${version}.${ext}` ∥ NSIS 四参 ∥ win.signtoolOptions.sign `scripts/win-sign.mjs`）；两处缺省值显式写明（值 = 设计值） |
| 2 | `thincoder-desktop/package.json` | 24 ⇒ **25** | +`prepackage`（物化自跑）；`version` 0.0.0 ⇒ **0.10.1**（发布窗定号）；script 六条（test ∥ start ∥ prepackage ∥ package ∥ postpackage ∥ quickcheck） |
| 3 | `thincoder-desktop/scripts/materialize-deps.mjs` | 无 ⇒ **143** | 源树实拷（`../thincoder-core` ∥ `../thincoder-render-core`）∥ 排 `test/**` ∥ `.thincoder/**` ∥ `lstat` 判链 ⇒ `unlinkSync` 只摘链 ∥ 落位自检（真身非 link + 包名对账）；**实测危险面在册**：`rmSync(recursive)` 穿透 junction 递归删目标内容（临时根实证）——故删链位一律不走它 |
| 4 | `thincoder-desktop/scripts/win-sign.mjs` | 无 ⇒ **163** | hook 具名导出 `sign(config, packager)`（electron-builder 契约实读在册：`resolveFunction` 取 `sign` ∥ 证书缺席不跳过 hook ∥ 返回值不消费）；指纹探测 ⇒ 在位实签（载体 ① PowerShell 主 ∥ ② signtool 备）∥ 缺席 ⇒ 跳过 + `⚠ 未签名 …`（构建零失败）∥ 真错抛出；RFC3161 端点 = GlobalSign 官方文档值（2026-10-01 实读；构建窗实测回填窗在案） |
| 5 | `thincoder-desktop/scripts/make-icon.mjs` + `build/icon.ico` | 无 ⇒ **171** + 资产 | ICO **4 151 B** · magic `00000100` · 4 entries 16/32/48/256 · sha256 `12b2b9b45496f16b…` · **复跑字节一致**；零依赖（zlib + 手写 PNG chunks）∥ 品牌形 = 站点 favicon 同源（`#2563eb` 圆角方块 + `</>` 白字形几何笔画） |
| 6 | `thincoder-desktop/scripts/check-dist.mjs` | 128 ⇒ **188** | 既有断言**零删**；+ 安装包名形 × 源版本 ∥ 预载 ∥ 渲染面 ∥ PE 证书表签名态信息行（**不闸**）+ 旧构建残留（版本不匹配）判红；头注补依赖镜像纪律指向 §5.7；fail-closed 保持 |
| 7 | `thincoder-desktop/CHANGELOG.md` | 无 ⇒ **13** | 首发 0.10.1 段（Added 三条：Windows 安装包 ∥ 签名就绪 ∥ 图标资产）；形对齐既有端 |
| 8 | `thincoder-desktop/AGENTS.md` | 24 ⇒ **25** | `package` 命令行按 §5.7 script 六条收正（物化 → electron-builder → check-dist 闸；阶段一 = Windows x64 ∥ 另两平台随阶段二）+ `quickcheck` 行 |
| 9 | 批内件 `docs/batches/2026-10-01-desktop-packaging-release.test.mjs` | 无 ⇒ **372 行 · 20 用例** | 五面腿：L1 物化 5 ∥ L2 图标 3 ∥ L3 check-dist 6 ∥ L4 签名 4 ∥ L5 配置 2；fixture 落 `.thincoder/tmp/` 自清理；**20/20 绿** |
| 10 | 设计档 ∥ 发布档（§2.2 已落） | 零触（勿重写） | 随动轮笔归父侧 ∕ 设计舱 |

**决策透明表（本席裁量处）**：① yml 两处缺省值（`directories.output` ∥ `asar`）显式落笔——值 = 设计值，读面自明（非改值）；② 删链位一律 `unlinkSync`——实测 `rmSync(recursive)` 穿透 junction（临时根实证，见档头注）；③ 时间戳 URL 取 GlobalSign 官方文档值 + 「构建窗实测回填」注（设计 §5.3 ∥ §10 DE③ 在册）；④ 批内件超设计「三面腿」⇒ **五面腿**（+L4 签名纯函数 ∥ +L5 配置契约含 electron-builder 真 scheme 校验）= 覆盖超集（非偏离）；⑤ 评审建议未采纳两条（yml 增 `signingHashAlgorithms` ∥ hook 路径改 `./` 前缀）——两者皆超 §4 批准的设计面，报父侧另裁，不自行改设计面。

**审计 ∥ 评审轮次与终态**：内部 explore 偏离审计（四类：未实现 ∥ 静默简化 ∥ 文档漂移 ∥ 声明外改动）⇒ **无发现**；内部 advisor 代码评审 轮 1 ⇒ **0🔴 ∥ 3🟡 ∥ 5🔵 · pass**；修复轮 1 = 采纳三条（恢复命令统一 ∥ 逐包错误隔离 ∥ 往返腿测试加固——后两条为评审 🔵 项，实现面自纠；均落盘并复跑绿）；advisor 轮 2（仅核修复声称）⇒ **pass · 无新增 🔴**；不采纳五项（签名双轮 ∥ RFC3161 载体协议 ∥ `dist/` 忽略 ∥ hook 路径前缀 ∥ 设计档读数回填）——理由 = 超设计面 ∥ 落点在声明面外 ∥ 文档面归父侧，均在案。**终态 = `clean`**。

**验收读数（逐条实跑）**：① `node --test docs/batches/2026-10-01-desktop-packaging-release.test.mjs` ⇒ **20 pass ∕ 0 fail**；② `node --check` 四支 .mjs + 批内件 ⇒ 零错；③ `node thincoder-desktop/scripts/make-icon.mjs` ×2 ⇒ `build/icon.ico` 4 151 B ∥ 复跑字节一致 ∥ magic `00000100` + 4 entries（16/32/48/256）；④ `node thincoder-desktop/scripts/check-dist.mjs`（无 dist）⇒ `✖ dist not found` + exit 1（现行为保持）；⑤ `JSON.parse(package.json)` 通过 ∥ version `0.10.1` ∥ scripts 含 `prepackage`；⑥ artifactName × check-dist 名形同式（L5 断言）。

**禁止面核**：未跑 `npm run package`（无 `dist/`）∥ 未跑真实物化（现盘两链仍 junction——`isSymbolicLink: true`）∥ 未真跑签名路径；`dev-link.mjs` ∥ `src/**` ∥ `renderer/**` ∥ 核 ∥ CLI ∥ VSC ∥ 站点仓零改。

**未决项（上抛父侧）**：① `win.signtoolOptions` 未设 `signingHashAlgorithms` ⇒ hook 每文件被调两轮（缺省 `["sha1","sha256"]` 实读在册；候选修法 = yml 增 `signingHashAlgorithms: ["sha256"]` ∥ hook 按 `config.hash`/`config.isNest` 短路）——涉 §5.1 配置契约面，待父侧裁；② 载体① `-TimestampServer` 携 RFC3161 端点的协议兼容性 = 构建窗实测面（本机 PowerShell 5.1.22621 在装；本评审不可执行）——设计 §10 DE③ 在册；③ `thincoder-desktop/.gitignore` 未含 `dist/`（打包后大件未忽略）——落点在任务书 files 清单外，未动，待父侧笔；④ hook 路径无 `./` 前缀 ⇒ 依 cwd 解析（`npm run package` 成立）——与 §5.1 字面 ∥ 批内件断言三点同拍，改动须同笔；⑤ 设计档 §4.1/§4.2 规模值仍为预估（实读 143 ∥ 163 ∥ 171 ∥ 188 ∥ 372）——按「预估——实施后对账」口径待回填；⑥ 收窗动作（`dev-link --force` → `--check` = 0）与构建 ∥ 真机 = 后续轮次（本席未跑）。

**定点修复轮（实施后点修 · 2026-10-01 · eng-coder）**——承 §2.10（设计面先落：§5.1 增行 `docs/desktop/design/PROJECT.md:1308`）+ 本档 §5 未决项 ①（双重调用）∥ ③（`.gitignore` 未含 `dist/`）；父侧派单 = **只此三处**（勿扩展 ∥ 勿全量探索；不跑 `npm run package` ∥ 不跑真实物化 ∥ 不真跑签名）。

**号 → 改动（file:line）**

| # | 落点 | 改动 |
|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml:29-30` | `win.signtoolOptions` 段增注释 + `signingHashAlgorithms: ["sha256"]`（值逐字 = 设计 §5.1 `:1308`；消 hook 每文件两轮——v26 缺省 `["sha1","sha256"]`）；行数 **37 ⇒ 39**（+2，落 §2.10 预告「+1~2」窗内） |
| 2 | `thincoder-desktop/.gitignore:7-8` | 增注释 + `dist/`（沿既有「注释 + 条目」形）；行数 **5 ⇒ 8**。**声明面披露**：`.gitignore` 属工程工具类——不在 files 声明面，照常交付（派单点名） |
| 3 | `docs/batches/2026-10-01-desktop-packaging-release.test.mjs:319` | L5「§5.1 逐值照抄」用例补新键断言（deepEqual `["sha256"]`）；scheme 校验（`:327-331`）整配置覆盖自动含新键；行数 **372 ⇒ 373**；用例数仍 **20**（五腿 5 ∥ 3 ∥ 6 ∥ 4 ∥ 2） |

其余零动（`src/**` ∥ `renderer/**` ∥ `scripts/**` ∥ 其余批面零触——工作树核对在案）。

**验收读数（逐条实跑）**：① `node --test docs/batches/2026-10-01-desktop-packaging-release.test.mjs`（真 Node v24.19.0 · 经 bash）⇒ **20 pass ∕ 0 fail**（≈2.5s）；② yml 实读含新键（`:29-30`，值 `["sha256"]`）；③ `.gitignore` 实读含 `dist/`（`:8`）；④ scheme 校验过（L5 第二用例真验证器 v26.15.3——键在 `WindowsSigntoolConfiguration`（enum `["sha1","sha256"]`）+ `additionalProperties: false` ⇒ 强判）；⑤ 复跑环境注记：`execute` 子进程走 Electron 运行时（asar fs 拦截 ⇒ L3 fixture 假红「Invalid package」）——复跑须经 bash 真 Node（本席首跑 15/5 假红后换径，如实在案）。

**决策透明表**：① yml 增注释行（超「仅键」最简形 +1）——由 = 「为何单算法」非自明；沿该段注释先例（`sign` 行形）；② `.gitignore` 入位 = 文末新块（沿既有两目同形）；③ 批内件最小形（仅 +1 断言；用例名 ∥ 档头注释 ∥ 其余 19 用例零动）。

**审计 ∥ 评审轮次与终态**：内部 explore 偏离审计（四类：未实现 ∥ 静默简化 ∥ 文档漂移 ∥ 声明外改动）⇒ **无发现**（mtime 簇独立 corroborate：三档同刻、声明面外零迹象；scheme default `['sha1','sha256']` 实读核准）。内部 advisor 代码评审 轮 1 ⇒ **0🔴 ∥ 2🟡 ∥ 3🔵 · pass**（无 must-fix ⇒ 零自修轮）。**终态 = `clean`**。
- 报告级/可选项（处置在案）：🟡 文档值列回填（设计档 §4.1/§4.2 ∥ 批档 §2.10：37 ⇒ **39** ∥ 372 ⇒ **373** ∥ 5 ⇒ **8**——文档面归设计舱/父侧，本席零触）；🟡 批内件 373 行 > 300（尺寸档 advisory——非本修引入；在册惯例：批内件五腿合档）；🔵「（拟新增）」标六处转正窗口已触发（§2.10 `:137` 自记——同归文档面）；🔵 `.gitignore` `dist/` 未锚定（维持逐字——派单字面 + 既有两目同形）；🔵 L5/L4 腿 devDeps 前提注（可选——零动纪律未采纳）。

**未决项余账（更新）**：① 双重调用 ⇒ **消解（本轮）**；③ `.gitignore` ⇒ **消解（本轮）**；余 ②（RFC3161 载体协议兼容性 = 构建窗实测）∥ ④（hook 路径无 `./` 前缀——维持，与设计字面同拍）∥ ⑤（设计档值回填——余值 = yml **39** ∥ 批内件 **373** ∥ `.gitignore` **8**，移交）∥ ⑥（收窗 ∥ 构建 ∥ 真机 = 后续轮次）。

**构建窗缺陷修复轮（实施面 · 2026-10-02 · eng-coder）**——承 §2.12（设计面先落）+ 派单：**只此两处**（勿扩面 ∥ 勿全量探索；不跑 `npm run package` ∥ 不跑真实物化 ∥ 不真跑签名）。

**号 → 改动（file:line）**

| # | 落点 | 改动 |
|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml:20-21` | 顶层增注释（`:20`——显式不发布 ∥ 消 v26 update-info ∥ `app-update.yml` 路径）+ `publish: null`（`:21`）；落点 = `asar` 块后 ∥ `win` 前（顶层块沿档形空行分隔）；行数 **39 ⇒ 42**（KD-4 内容行数——脚本实算 ∥ read 面一致；+3 = 注释 ∥ `publish: null` ∥ 块间空行） |
| 2 | `docs/batches/2026-10-01-desktop-packaging-release.test.mjs:322` | L5「§5.1 逐值照抄」用例补 `assert.equal(builderConfig.publish, null, "显式不发布（官网托管独立通道）——消 v26 update-info ∥ app-update.yml 路径（§5.1）")`（入位 = `signingHashAlgorithms` 断言后——§5.1 表相邻行 ∥ 前轮新键断言先例；用例名 ∥ 档头注释 ∥ 其余用例零动）；行数 **375 ⇒ 376**（KD-4 实读；批档账记 373——差 +2 见决策透明表 ③）；用例数仍 **20** |

其余零动（`src/**` ∥ `renderer/**` ∥ `scripts/**` ∥ 其余批面零触——工作树核对在案）。

**验收读数（逐条实跑）**：① `node --test docs/batches/2026-10-01-desktop-packaging-release.test.mjs`（真 Node v24.19.0 · 经 bash）⇒ **20 pass ∕ 0 fail**（duration_ms 2370.9）；② yml 实读含 `publish: null`（`:18 asar` → `:20` 注释 ∥ `:21` 键 → `:23 win` 上下文在盘）；③ scheme 校验过（L5 第二用例 v26.15.3 真验证器 ⇒ `publish: null` 接纳）；④ 未跑 `npm run package`（禁面；`dist/` 存量 = 深夜构建 ≤23:59 HKT——本轮窗零新产物）。

**决策透明表（本席裁量处）**：① publish 落点 = `asar` 块后（派单「近顶层 ∥ `asar` 邻位」建议位）；顶层块沿档形空行分隔 ⇒ 净增 +3（超派单字面 +2 一行——由 = 块间空行 ∥ 档形自明）；② 批内件断言入位 = `hashAlgorithms` 断言后（§5.1 表相邻行 + 前轮先例——最小笔）；③ 计数残差如实：批内件批档/派单记 **373** ∥ 现盘实读改前 **375** ∥ 改后 **376**——本席仅 +1，+2 差成因未证（无 git 迹 ∥ 无快照；#9 核定位 `:319` 现盘 `:321` ⇒ 位移在落点之上，非本轮产生）⇒ 移交父侧；④ yml 终值 **42**——设计预告「+1」（§2.12）为估算，回填按实测勿按预告算术。

**审计 ∥ 评审轮次与终态**：内部 explore 偏离审计（四类：未实现 ∥ 静默简化 ∥ 文档漂移 ∥ 声明外改动）⇒ **无发现**（附核在手：+2 差归因非本轮 ∥ `dist/` 存量 mtime ≤23:59 ∥ `win-unpacked/resources/app.asar` = **0 B**（mtime 19:43 HKT）——存量单读数观察，构建面留意）。内部 advisor 代码评审 轮 1 ⇒ **0🔴 ∥ 2🟡 ∥ 4🔵 · pass**（无 must-fix ⇒ **零自修轮**）；host 机检：引用核对 8/11 相符（3 处 unverified）；本席计数以 KD-4 脚本实测为准——yml = **42** ∥ 批内件 = **376**。**终态 = `clean`**。

**评审响应表（逐项处置）**：🟡① yml 值列滞后（§4.1 `:173` ∥ §4.2 `:1273` 记 39）⇒ **转呈**（文档面归设计舱/父侧；实值 = **42**〔+3〕）；🟡② 批内件 376 行 > 300 ⇒ **维持登记**（advisory 在册 · 非本轮引入）；🔵③ 批内件 373 ⇒ 376 漂移 ⇒ **转呈**（KD-4 实读 376；父侧已登记「+2 差」）；🔵④ 根因措辞钉定 ⇒ **登记**（构建窗 `--debug` 复核；**修复充分性源内实证**——显式 null 短路 `PublishManager.js:343/:350/:357` ⇒ `:143-148` 早返 ⇒ update-info ∥ `app-update.yml` 路径整段不启）；🔵⑤ 用例标题枚举止于旧键组 ⇒ **留待下次触碰**（沿前轮「零动」先例）；🔵⑥ §5 记录窗口 ⇒ **本轮即落**（本块）。

**未决项（上抛父侧）**：① 批内件 +2 计数残差真因（建议 git 定源 ∥ 复核 §2.11 核数）；② §4.1/§4.2 值列回填（实测值：yml **42** ∥ 批内件 **376**）；③ 构建窗复跑（`publish: null` 版）：验链完整至 `postpackage` 闸 ∥ 根因 `--debug` 钉定 ∥ `dist/` 清残件建议 ∥ app.asar 0 B 复核；④ 收窗（`dev-link --force` → `--check` = 0）∥ 真机 = 后续轮次（本席未跑）。

## §6 验证与收口（父代理）

**#9 修复轮交付核验（2026-10-01 23:40 · 父侧）**
- 三档实读 ✓：`electron-builder.yml:29-30`（注释 + `signingHashAlgorithms: ["sha256"]`——值 = 设计 §5.1 `:1308` 逐字；`signtoolOptions` 段内；37 ⇒ **39**）∥ `.gitignore:7-8`（注释 + `dist/`；5 ⇒ **8**）∥ 批内件 `:319`（L5 新键 deepEqual 断言）+ `:327-331`（scheme 全集覆盖）；行数 **372 ⇒ 373**。
- 父侧亲跑：`node --test docs/batches/2026-10-01-desktop-packaging-release.test.mjs`（真 Node）⇒ **20 pass ∕ 0 fail**（2 608ms）。
- 内部审计无发现 ∥ advisor 轮 1 = 0🔴/2🟡/3🔵 pass；终态 **clean**。另账：批内件 373 行 > 300 = advisory（批内件五腿合档惯例——收口轮随账）。
- **待派（在途）**：设计面文档值回填轮——§4.1 `:173-174` ∥ §4.2 `:1273`/`:1282` 值回填（37 ⇒ 39 ∥ 372 ⇒ 373 ∥ `.gitignore` 5 ⇒ 8 补述）；§2.10「终值随实施回归」兑现；六处「（拟新增）」转正（`:1289`/`:1291`/`:1307`/`:1325`/`:1332`/`:1361`）——序列 = 轮五收口评审窗后派（避让在评档面）。
- **余账**：② RFC3161 载体协议 = 构建窗实测 ∥ ④ hook 路径前缀（维持）∥ ⑥ 构建 → 真机 T-DSK55（已签 ∥ 未签两臂）→ 站点轮 → 收窗（**发布动作 = 用户门**）。

**#12 文档面回填轮核讫（2026-10-01 23:5x · 父侧）**
- 设计档实读 ✓（抽核）：§4.1 `:173`（yml **39**——修复轮 +2 注兑现）∥ `:174`（`.gitignore` **8**——+3）∥ §4.2 `:1269`（表头括注 `.gitignore` 5 ⇒ 8）∥ `:1273`（行 1 yml **无 ⇒ 39**）∥ `:1282`（批内件 **373 行 · 20 用例**）；六处「（拟新增）」转正（`:1289`/`:1291`/`:1307`/`:1325`/`:1332`/`:1361`——抽核 `:1307` 现文 = 「（hook）」）；变更记录 `:2212` 在盘。批档 §2 状态行 + §2.11 在盘。
- 行数口径定格（KD-4 内容行数 · 文末换行不计；父侧亲测同值）：yml **39** ∥ 批内件 **373** ∥ `.gitignore` **8**。
- 门实跑（#12 回执）：悬空 122 = 122 ∥ 行宽 120 = 120 ∥ 拟新增 41 = 41（如实偏差：六处转正 = normative 面卫生，计数面本零变——标对已解析路径为无输出分支）∥ 行数面 **9 ⇒ 7**（消 `:173`/`:174` 两处）。
- **余账（不变）**：② RFC3161 载体协议 = 构建窗实测 ∥ ④ hook 路径前缀（维持）∥ ⑥ **构建**（`ELECTRON_MIRROR=… npm run package`——**待用户 UKey + 「跑」令**）→ 收窗 → 真机 T-DSK55 → 站点轮（**发布动作 = 用户门**）。

**构建窗核验（2026-10-02 00:00–00:45 · 父侧）**
- **净退出达成**：electron-builder（`npx electron-builder --config.directories.output=dist-r4` · cwd = thincoder-desktop · 双镜像 env + `ELECTRON_BUILDER_CACHE=.thincoder/tmp/eb-cache`）⇒ **exit 0** —— `publish: null` 修复生效（updateInfo ∥ `app-update.yml` 路径不启）。
- 制品（`dist-r4`）：`ThinCoder-Setup-0.10.1.exe` **112,466,976 B** + blockmap + win-unpacked；**四件签名全落**（ThinCoder.exe ∥ elevate.exe ∥ 卸载器 ∥ 安装包本体——GlobalSign EV + RFC3161，逐件 `[win-sign] ✔` 在日志）；`resources/` 无 `app-update.yml` 残件。
- 闸：`node scripts/check-dist.mjs dist-r4` ⇒ ✔（断言 5 条 + 版本逐字 B ∕ F）· exit 0。
- 收窗：`dev-link --force` → `--check` = **5 规范 ∕ 0 漂移**（终态 0）。
- **窗内修复四件**：① NSIS 工具下载 ECONNRESET → 双镜像（`ELECTRON_BUILDER_BINARIES_MIRROR` **实测选定**——设计 §5.7 随动在途）；② updateInfo 崩（`channel` null）→ `publish: null`（设计 §5.1 `:1309` ∥ §5.2 `:1319` ∥ §5.6 `:1357` ∥ yml `:20-21` ∥ L5 断言 `:322`）；③ check-dist 读面缺陷（asar 条目读漏 `dataStart`——定标 `dataStart = 8 + 头段字节数`，真产物 123,460 = 8+123,452；读面 + L3 夹具修正 ⇒ 批内件 20/20 + 真产物亲跑绿）；④ 环境压锁 → 输出位绕行（见下）。
- **过程读数（在册）**：跑2 成包（= 用户实装基件 ∥ 修复前链）∥ 跑3a/3b/3c = `EBUSY`（压锁）∥ 跑5 = 工具 5 分钟上限截停于末步签名 ∥ 跑6 = 净退（上述）。
- **环境压锁（未决 · 开放项）**：`dist\win-unpacked\resources\app.asar`（跑2 产物）自 00:28 起被**过滤件层持久压锁**——`EBUSY`（unlink ∥ 改名该文件）∥ `EPERM`（改名其父目录 ∥ 连 `dist` 整树）∥ 读取正常 ∥ RM 反查空壳（`0 |`）∥ ACL 干净（含云桌面 SID `S-1-4-…` 写删 ACE）；进程面无持有者。**绕行** = 输出位。**遗留两项**（重启后一行区）：① 原装输出位 `dist` canonical `npm run package` 一趟（解锁后）；② 清理 `dist`（被压旧树）∥ `dist-r3`（半成品）。另：临时输出位说明 = 终产物构件与 canonical 同链同源；本轮构建走 `npx electron-builder` 直驱（取构建器自身净退出码），`npm run package` 的 postpackage 闸对默认 `dist`（被锁树）——已以 `check-dist dist-r4` 手跑等价覆盖。
- **T-DSK55（在途）**：① 安装 ✓（用户实走——`%LOCALAPPDATA%\Programs\ThinCoder`）∥ ② 快捷方式 ∥ 开始菜单 ✓（桌面 + 开始菜单双 `.lnk`）· 启动进主界面 ✓（用户实走——会话 slot 33 无缝续进安装版）∥ ④ 臂① 签名 ✓（安装后 exe：Valid ∥ GlobalSign EV ∥ RFC3161）；③ **卸载 + 数据保留 = 待走**（会断当前会话窗口——用户择时；基线已钉 `~/.thincoder`）。臂②（未签）机检面在册（跳过+⚠ 用例）。

- **设计收正轮核讫（2026-10-02 00:47 · 父侧核读）**：§4.1 `:173` yml 值 = **42** ∥ §4.2 本批块 `:1273`/`:1282` 双行随动（批内件 = **376 行 · 20 用例**）∥ §5.7 `:1369` 镜像行「**实测选定**」∥ 变更记录 `:2216` ∥ §2.13 块在盘——六处读回一致；行数面差异 9 ⇒ 8（消 `:173`——表 ∥ 实读闭合；余 8 = 他批面，非本批）。至此构建窗文档面全闭：**开放项 = 原装输出位 canonical 重跑（等锁释放）∥ `dist` ∥ `dist-r3` 残留清理 ∥ T-DSK55 ③ 卸载格（用户择时）∥ 站点轮 + 发布（用户门）**。
