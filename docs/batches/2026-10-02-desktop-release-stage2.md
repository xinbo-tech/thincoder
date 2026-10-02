# 2026-10-02 · 桌面发布·阶段二（官网与自动更新）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 21:39 三项需求（发布流程加桌面 ∥ 官网加桌面介绍 ∥ 自动更新落地）+ 台账 #810（自动更新在册）+ #807 站点轮余项承接。
> 台账 = #810 ∥ #826（桌面发布 · 归批）。前情 = docs/batches/2026-10-01-desktop-packaging-release.md §1（进行中——阶段二承接其「站点轮」余项）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-03
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**需求登记（用户 2026-10-02 21:39 · 父侧笔录）**：
1. **发布流程加桌面端**——口径：先 Windows 下载版；Linux/mac ∥ 应用商店 = 后加。**现状核**：`docs/RELEASE.md` §5.6「阶段 3b · 发桌面（Windows 安装包 · 阶段一）」已在（2026-10-01 打包批落笔——定号/CHANGELOG/物化/打包/签名/上传/官网挂载 ∥ §6 站点面设计在档）⇒ 本批动作 = **缺口核**（全对齐 ⇒ 零改；含自动更新入流程与否）。
2. **官网加桌面介绍**——形态（父侧建议 · 用户「开始」＝采用）：照 `cli.html`/`vscode.html` 先例建 **desktop 专页** + `download.html` 桌面下载卡 + index/导航触点 + 系统要求/更新段 + changelog 桌面节（RELEASE.md §6 已在设计）+ **更新 feed 托管面**（与 3 咬合）。**路由注**：站点 = `d:\teamcode\thincoder.com`（**独立仓**）⇒ 子代理禁跨仓写——**站点实现 = 父侧直做**（设计仍入本批设计档；评审同批视检）。
3. **桌面自动更新落地**——口径照台账 **#810** 在册案：应用侧 electron-updater（**启动自检 ∥ 静默下载 ∥ 提示重启**——不打断会话）∥ 构建侧 publish 配置（generic feed ⇒ `latest.yml` + `app-update.yml` + blockmap——**开封 `publish: null`**）∥ 站点侧 feed 托管。路由：应用侧/构建侧 = 仓内（eng-coder）；站点侧 = 父侧。

**承接（#807 打包批余项）**：站点轮 ⇒ 本批；原装位重跑 ∥ 残留清理 ∥ T-DSK55③ ⇒ 发布窗自持（#807 批档面——发布 = 用户门）。**边界**：Linux/mac ∥ 商店 = 不做；更新通道只此一条（generic feed）；零新事件通道；不改三端既有发布链。**设计轮已派发**（eng-designer）。

**站点侧记录已建（用户 21:43 令「在 thincoder.com 那边也建批档」）**：`thincoder.com/docs/batches/2026-10-02-desktop-download-page.md`（**父侧直笔**——站点仓无批工具基根（跨仓 fail-closed 已实测）⇒ 普通记录档，形沿用六段语义；**设计单源仍 = 本批**，站点档只记执行与读数）；站点仓缺 docs 层 ⇒ 就地补建 `docs/batches/`（首档）。

**站点仓 manifest 已落（用户 21:48 令「该创建就要创建」）**：`thincoder.com/PROJECT-MANIFEST.json`——经 `writeManifest(writer:'main')` 专权写门（schema 校验 OK）：`docRoot.batches = docs/batches` ∥ `codePaths = ["www","scripts"]` ∥ phase = initial-dev。**边界复核**：跨仓 create 仍拒（基根按**会话锚**解析——站点 manifest 不在本会话判定面）⇒ 站点侧记录维持普通档（父侧直笔）；**锚在站点仓的会话**可得六段全机制。**⚠ 双项目并存副作用**：工作区锚下现有两个带档目录（thincoder ∥ thincoder.com）⇒ 机制「不猜」——批档/台账诸写面**一律显式路径**（本笔即以绝对路径落笔为准）。在飞：设计轮 #35 继续。

**设计轮核读 + 需求卷 U1 兑现（父侧 · 2026-10-02 22:0x）**：设计落点实读——`docs/desktop/design/PACKAGING.md` **331 行**（KD-71 自动更新三件面 §2.8.1/§2.8.2/§2.8.3 ∥ KD-72 官网规格 §2.9.1–2.9.7 ∥ §2.10 承接表 ∥ T-DSK60）；`docs/RELEASE.md` **403 行**七处收正（图行 feed 三件 ∥ §5.6 指针 ∥ 步 4 `upload-download` ∥ §6.3 桌面行——抽核 ✓）；`MENU.md`/`PROJECT.md` 指针随动 ✓；批档 §2 在册（状态行 = 设计完成）。**需求卷兑现（主 agent 笔 · U1）**：**D40**（自动更新）∥ **D41**（官网桌面面）落 `requirements/PACKAGING.md`（卷计 4 条）+ 总览索引/计数随动（九卷 40 + D14 = **41（D1–D41）**）+ 九卷头像句随动 + 两档变更行。**设计就绪——候用户点火设计评审。**

**站点侧落笔（父侧直轮 · 2026-10-03 01:3x——跨仓：站点 = 独立仓，子代理零写）**：按 §2.9.1–§2.9.7 全件落 —— ① 页集：`www/desktop.html` 新建（六节）∥ `download.html` 桌面卡置首 + 系统要求首行 + 更新句 + meta + 手册句 ∥ `index.html` 三条入口 ∥ `about.html` 版本行 ∥ `changelog.html` 桌面节 + 副句 ∥ `sitemap.xml`；② 导航 11 页同拍；③ 脚本三件：`gen-changelog.mjs` +`--side desktop` ∥ `deploy-oss.mjs` prune `downloads/` 豁免 ∥ `upload-download.mjs` 新建。**读数**（实跑）：生成器 desktop 臂含 `v0.10.1`+日期 ✓ ∥ 上传件无参 exit 1 + DRY_RUN 预览 ✓ ∥ 11/11 页导航 + 断链 0 ✓ ∥ sitemap 11 行 ✓ ∥ 三脚本 `--check` ✓。**零部署**（发布/部署 = 用户门不开）。站点仓签入 = 特性提交 `1be4ae0`（16 档）+ 本记录尾行；站点档 = `thincoder.com/docs/batches/2026-10-02-desktop-download-page.md` §3/§4 在册。

**父侧直笔三线（标记 · 可 revert——2026-10-03 01:3x—01:4x）**：① `thincoder-desktop/scripts/check-dist.mjs` **+更新面 4 断言**（§2.8.2：`latest.yml` 两读 ∥ sha512 对盘（安装包实算——基 64 填充不敏感）∥ `app-update.yml` provider/url）——工程工具面（机械门禁不允许进实施舱）；实跑 = 旧 dist 报「latest.yml 缺位」**正确红态**（fail-closed），下次构建转绿。② `thincoder-desktop/CHANGELOG.md` `[Unreleased] Added` 句（父侧维护件）。③ **跨批批内件随正 2 档**：⑫ `2026-10-01-desktop-packaging-release.test.mjs`（L3 fixture 补更新面两件 + 更新面负控一腿 ∥ L5 `publish` 断言 ⇒ provider 契约）**21/21 绿**；`2026-10-02-settings-menu-trim.test.mjs`（帮助组快照随正〔检查更新… 首项 + sep〕）**3/3 绿**。⑫/trim 随正依据 = 本批 §3.3 行 12 设计点名 + 本批变更引发（跨批记录族 = 父侧面——实施舱被门正确拒止、停报不绕，`#3` 已裁「父侧直做」）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（落点 = docs/desktop/design/PACKAGING.md §1 KD-71 ∥ KD-72 · §2.8–§2.10 · §4.3 · §5 T-DSK60 · §6 DK；评审轮 1 修复已落（发现 1–8）——机检锚 0 ∥ 行宽 0（2026-10-03））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 设计轮交付（eng-designer · 2026-10-02 · 授权 = §1 需求登记 ①/②/③ + #807 承接）

**本批条目（覆盖）**：

| # | 条目 | 设计单源（落点） | 验收对照 |
|---|---|---|---|
| ① | 发布流程加桌面——缺口核 | `docs/RELEASE.md` §5.6（步 1 ∥ 步 2 ∥ 步 4 ∥ 完成判定 ∥ 失败处置 ∥ 定位行）∥ §5.1 图行 ∥ §5.2-2 ∥ §5.5 ∥ §6.3 ∥ §6.5 判据 4 ∥ §6.6 | 缺口核结论 = 七处收正（下表）——已落；机检 = doc-check（锚 0 ∥ 行宽 0） |
| ② | 官网加桌面介绍 | `docs/desktop/design/PACKAGING.md` §1 **KD-72** ∥ **§2.9**（2.9.1–2.9.7） | 站点轮执行后实读（父侧）：页面五点 + 版本面三处 + changelog 桌面节 |
| ③ | 桌面自动更新落地 | `docs/desktop/design/PACKAGING.md` §1 **KD-71** ∥ **§2.8**（2.8.1/2.8.2/2.8.3）∥ §2.1 ∥ §2.2 ∥ §2.6 ∥ §2.7 ∥ §3.1 ∥ §3.3 ∥ §5 **T-DSK60** | 实施批机检（T-DSK60）+ 发布窗：check-dist 四断言 ∥ feed 三件 ∥ 版本四点对盘 |
| 承 | #807 站点轮余项承接 | `docs/desktop/design/PACKAGING.md` **§2.10**（原装位重跑 ∥ 残留清理 ∥ **T-DSK55 ③**） | 发布窗自持（发布 = 用户门） |

**缺口核结论（条目① · 七处——「全对齐 ⇒ 零改」不成立，均已收正）**：
1. §5.6 定位行 ∥ 失败处置行：机制单源指针代际收正（`docs/desktop/design/PROJECT.md` §5 ⇒ `docs/desktop/design/PACKAGING.md` §2）。
2. §5.2-2 ∥ §5.6 步 1 ∥ §6.3 桌面行：桌面 CHANGELOG「（拟新增）」陈标翻正（已建 · 13 行）。
3. §5.6 步 2：产物面句补（`latest.yml`（落 dist 根）∥ `app-update.yml`）+ 判据补 update-info 四断言坐标。
4. §5.6 步 4：翻「feed 三件」（键形三 ∥ 上传序 exe → blockmap → latest.yml ∥ 对盘判据；绕缓存句移入本步）。
5. §5.6 完成判定：补三件 URL 可达；失败处置改指 §2.6 ∥ §2.8.1（更新失败面 fail-soft）。
6. §5.1 图行：上传（安装包 ∥ blockmap ∥ latest.yml）。
7. §6.5 判据 4 新立（feed 面）∥ §6.6 边界句收正（页面集扩建 = 一次性发行面变更，不在循环面）。
零改面 = §5.6 步骤 3 ∥ §5.7（不动）。

**设计轮落点（全表——本批编辑）**：

| 档 | 行数（实读 2026-10-02） | 落点 |
|---|---|---|
| `docs/desktop/design/PACKAGING.md` | **331** | §1 **KD-71** ∥ **KD-72**；§2.1 publish 行；§2.2 ∥ §2.6 ∥ §2.7 随动；**§2.8 ∥ §2.9 ∥ §2.10 三节新立**；§3.1 新行（`update.mjs`——拟新增）∥ §3.3 本批块；**§4.3 新立**；§5 **T-DSK60**；§6 **DK**；变更记录 |
| `docs/desktop/design/MENU.md` | **164** | **KD-65** ①（帮助组 +「检查更新…」）∥ ②（`onNative` 四项）∥ ⑦（边界翻正）；**§3.5 新立**（本批块）；变更记录 |
| `docs/desktop/design/PROJECT.md` | **1760** | §2 索引 +2（KD-71 ∥ KD-72）；§5 指针（发行业两面补列）；§8 三处翻正 + 本批边界行新立；§7 **T-DSK60**；§10 **DK**；变更记录 |
| `docs/RELEASE.md` | **403** | 上表七处 + 变更记录 |
| `docs/README.md` | **152** | §1 地图行（桌面阶段二）+ 变更记录 |

**受影响文件（施行面 · 现行 ⇒ 预期）**——应用/构建侧 = eng-coder；站点侧 = 父侧轮：

| 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|
| `thincoder-desktop/src/main/update.mjs`（拟新增） | 无 ⇒ ≈170（五态状态机 ∥ 注入缝 ∥ 零 electron 顶层 import） | 应用侧 |
| `thincoder-desktop/src/main/main.mjs` | **203 ⇒ ≈235**（`createRequire` ∥ 注入五缝 ∥ 10s 自检点火 ∥ 通知落子） | 装配 |
| `thincoder-desktop/src/main/app-menu.mjs` | **143 ⇒ ≈160**（帮助组项 + `update` 注入） | 菜单 |
| `thincoder-desktop/src/main/menu-words.mjs` | **115 ⇒ ≈150**（+11 键；键集 32 ⇒ 43） | 词表 |
| `thincoder-desktop/src/main/window.mjs` | **288 ⇒ ≈305**（`onNative` +`update` 转口 ∥ 确认 ∥ 结果对话框） | 宿主 |
| `thincoder-desktop/electron-builder.yml` | **42 ⇒ ≈45**（`publish` 契约行） | 构建 |
| `thincoder-desktop/package.json` | **25 ⇒ ≈27**（dependencies + `electron-updater` ∥ description） | 依赖 |
| `thincoder-desktop/scripts/check-dist.mjs` | **190 ⇒ ≈194**（+4 断言） | 闸 |
| `thincoder-desktop/CHANGELOG.md` | **13 ⇒ ≈17**（`[Unreleased]` 段） | 记录 |
| `docs/batches/2026-10-01-desktop-packaging-release.test.mjs` | **376 ⇒ ≈380**（publish 断言翻新——「改钉新形」） | 跨批随动 |
| `docs/batches/2026-10-02-desktop-release-stage2.test.mjs`（拟新增） | 无 ⇒ 用例（**T-DSK60**） | 测试 |
| 站点侧（`thincoder.com`——父侧轮） | `thincoder.com/www/desktop.html`（拟新增）∥ 下载/index/about/changelog/sitemap 五点 ∥ `thincoder.com/scripts/` 三件 | 站点 |

零触面：`renderer/**` ∥ `preload.cjs` ∥ `ipc-registry.mjs` ∥ 通道集（事件 24 ∥ 白名单 47）∥ `ev:menu` 六值 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC。

**验收对照（逐条指向——机检化）**：
1. 构建闸：check-dist 四断言全绿（`latest.yml` version ∥ `files[0].url` ∥ `files[0].sha512` ∥ `app-update.yml` provider/url）——机检（`thincoder-desktop/scripts/check-dist.mjs`）。
2. 应用行为（**T-DSK60**）：自检门（`isPackaged` ∧ 非 `--smoke`）∥ 静默下载零 UI ∥ 通知一次/版本 ∥ 菜单状态机 label ∥ `quitAndInstall(true, true)` 参数形。
3. feed：三件 URL 可取回 ∥ `latest.yml` 对盘（version ∥ sha512）——`docs/RELEASE.md` §5.6 步 4 ∥ §6.5 判据 4。
4. 菜单/词表：帮助组项 + sep ∥ `onNative` 四项 ∥ 键集 43 ∥ 白名单 47 零动。
5. 官网：desktop 页六节 ∥ 导航 11 档 ∥ 下载卡置首 ∥ 版本面三处 ∥ changelog 桌面节——站点轮实读（父侧）。
6. 机检面：doc-check 全绿（锚 0 ∥ 行宽 0）。

**关键决策（摘要——全文 = `docs/desktop/design/PACKAGING.md` §1）**：
- **KD-71**：electron-updater 6.8.9 + generic feed 三件面同批落；零新事件通道（`onNative` +1）；启动自检一次/会话；静默下载 + 提示重启；`autoInstallOnAppQuit` + 菜单确认 ⇒ `quitAndInstall(true, true)`。
- **KD-72**：页集扩建 = 一次性发行面变更；零样式 ∥ 零构建保持；执行 = 父侧轮。
- 被否族摘要：publish 缺省 ∥ `autoDownload = false` ∥ 渲染面提示面 ∥ beta/alpha ∥ 周期拍 ∥ 截图区 ∥ `deploy-oss` 吞上传（详 KD 行）。

**上抛项**：
- **U1（需求侧缺口——笔 = 主 agent）**：需求卷 D 表近无「桌面自动更新」「官网桌面面」D 项（D32 阶段二句未含更新）——本批按台账 #810 ∥ #826 采用案落；收正与否 = 主 agent 裁。
- **U2（站点仓实现）**：= 父侧轮（子代理零写——在册）；站点档 `thincoder.com/docs/batches/2026-10-02-desktop-download-page.md` 记执行与读数。
- **U3（#807 承接）**：发布窗自持（原装位重跑 ∥ 残留清理 ∥ T-DSK55 ③——发布 = 用户门）。
- **U4（回填项）**：`publisherName` 实得 ∥ `latest.yml` 实读 ∥ sha512 形 = 实施窗回填（在册 §2.8.2）。
- **U5（披露）**：设计轮机检自审——初跑 19 悬空 + 3 宽行（本批引入）⇒ 全数修复；终读 悬空 0 ∥ 行宽 0 ∥ 拟新增 48 ∥ 迁移期引文 297。

### 评审轮 1 · 修复轮（发现 1–8 逐号点修 · 父侧裁 = 全采纳 · eng-designer · 2026-10-03）

承接 = §3 轮次 1（🟡 5 ∥ 🔵 3）逐号点修——**收正 ∥ 登记 ∥ 指位；零新语义 · 产品码零触**（docs first）。

**逐号处置（号 → 改动 file:line——修后读回）**：

| # | 处置 | 落点（修后实读） |
|---|---|---|
| 1 | 需求侧四处同拍收正：① §4.3 缺口注翻「已落：D40 ∥ D41」（引需求卷行）∥ ② §4.3 需求回指补 D40/D41（需求卷条目前置——三链同源）∥ ③ §6 **DK** ⑤ 转「已收正」+ 状态列随正 ∥ ④ `PROJECT.md` §6.1 表头 **D1–D39 ⇒ D1–D41** + 本批批块指针行（→ PACKAGING §4.3——沿 #812 ∥ #817 先例形） | `docs/desktop/design/PACKAGING.md:307` ∥ `:302` ∥ `:324`；`docs/desktop/design/PROJECT.md:902` ∥ `:989` |
| 2 | T-DSK60 ⑥ 按 §2.8.1 契约收正（`error` 径 = 对话框「检查更新失败」+ 状态回 `idle`；「静默回转」限自动面；补第三果 `update-available` ⇒ 转下载态） | `docs/desktop/design/PACKAGING.md:316` |
| 3 | window.mjs 越线在册：两文件账行各补「越 300 顾问线在册」+ §4.1 越层段新立本批行（**新越层档**——预案 = 冒烟读数族出档评估（拟新增 `src/main/smoke.mjs`）· 消解窗口 = 下次结构性触碰的批） | `docs/desktop/design/PACKAGING.md:275`；`docs/desktop/design/MENU.md:114`；`docs/desktop/design/PROJECT.md:486` |
| 4 | `RELEASE.md` §5.8 步骤 1 源「两端」⇒ 三端（+桌面 `CHANGELOG.md`——与 §6.4 同拍）；步骤 2「系统要求两行」⇒ 三行（首行 = 桌面版——单源 = `docs/desktop/design/PACKAGING.md` §2.9.3） | `docs/RELEASE.md:306` ∥ `:308` |
| 5 | MENU §2：① 增本批注（菜单半——帮助组项 + `onNative` 四项 + 零改面）∥ ② 项 1 帮助组补首项「检查更新…」（按语义边界折行——消超宽）∥ ③ 项 5 边界随正（「检查更新」移出不做系列 ⇒ 本批落标） | `docs/desktop/design/MENU.md:28-29` ∥ `:32-33` ∥ `:38` |
| 6 | §2.5 补一行指针（**本批续填（断言 +4）= §2.8.2**） | `docs/desktop/design/PACKAGING.md:76` |
| 7 | §2.8.3 绕缓存「沿 §2.6 先例」改指实出处（同法 = `docs/RELEASE.md` §5.6 步 4） | `docs/desktop/design/PACKAGING.md:157` |
| 8 | T-DSK60 前置补句（**vN 须为携更新面版本**——0.10.1（阶段一产物）无更新器；首测点 = 第二个携更新版本发布窗 ∥ 或允许本地构建旧版） | `docs/desktop/design/PACKAGING.md:316` |

**机检读数（修后 · `node scripts/doc-check.mjs` @ `thincoder` 仓根）**：**悬空 0 ∥ 行宽 0**（OK(锚) ∥ OK(行宽)）；拟新增 48 ⇒ **50**（`PROJECT.md` 两处携「（拟新增」标——列报 · 不入闸）∥ 迁移期引文 297（净 0）∥ 声明源缺位 0 ∥ exit 0；行数面差异 2（报告态——修前同值）。

**变更记录**：四档各一行——`docs/desktop/design/PACKAGING.md:333` ∥ `docs/desktop/design/MENU.md:169` ∥ `docs/desktop/design/PROJECT.md:1767` ∥ `docs/RELEASE.md:404`（各标「修复轮（评审轮 1 · 发现 …）」）。

**范围外注（照报——未动）**：§3 范围外注（工作区根 `AGENTS.md`「Zero third-party…」句第四处随动）仍归父侧裁——本修零触（越八号）。

### 实施后回填轮（`#3` 报告项三处 + 留白 ④ 定裁入档 · 父侧裁 = 全采纳 · eng-designer · 2026-10-03）

承接 = `#3` 报告「设计档漂移（报告项）」三处 + 设计留白 ④ 定裁；取数源 = 本档 §5 实施表 ∥ §5 追记（内容行数口径；⑫ 终值 = 盘实读；跨批 ∥ 父侧面件终态同 §5 追记）。**零新语义 · 产品码零触**（回填 ∥ 随正 ∥ 一句定裁——非新机制）。逐处修后读回（D6）已核。

**逐号处置（号 → 改动 file:line——修后实读）**：

| # | 处置 | 落点（修后实读） |
|---|---|---|
| 1 | 三处册值同拍：`window.mjs` **≈305 ⇒ 336**（§3.3 行 7 ∥ §3.5 行 3 ∥ PROJECT §4.1 越层段本批行——PROJECT 行内「现行 ⇒ 预期」同拍 ⇒「现行 ⇒ 实读」） | `docs/desktop/design/PACKAGING.md:276` ∥ `docs/desktop/design/MENU.md:114` ∥ `docs/desktop/design/PROJECT.md:486` |
| 2 | §3.3 ∥ MENU §3.5 全表回填（预期列 ⇒ 实读；新档 = 置实读）：PACKAGING 十二行——**46** ∥ **26** ∥ **217** ∥ **242** ∥ **158** ∥ **145** ∥ **336** ∥ **225** ∥ **25**（净 0）∥ **19** ∥ **388** ∥ **410**（盘实读）；MENU 三行——**145** ∥ **158** ∥ **336**；两表标题 ∥ 说明 ∥ 表头一并翻「实施落盘」形 | `docs/desktop/design/PACKAGING.md:264-281` ∥ `docs/desktop/design/MENU.md:106-114` |
| 2b | 机检工单齐平（行数面——doc-check「回填工单即本清单」）：声明节 §3.1 ∥ §5.1 九行走读——PACKAGING §3.1（yml ∥ check-dist ∥ package.json ∥ CHANGELOG ∥ update.mjs）∥ MENU §3.1（menu-words ∥ app-menu）∥ SHELL §5.1（main.mjs ∥ window.mjs）——差异 **10 ⇒ 1**（余 1 = 非本批，见下） | `docs/desktop/design/PACKAGING.md:233 ∥ :234 ∥ :238 ∥ :240 ∥ :242`；`docs/desktop/design/MENU.md:46 ∥ :47`；`docs/desktop/design/SHELL.md:174 ∥ :176` |
| 3 | **KD-65 ④** 重建点 五 ⇒ **六**（+更新面状态迁移径——实读 `window.mjs:111-113`）；**同族随正（补 · 一致性面）**：`SHELL.md` §2 计数同拍 | `docs/desktop/design/MENU.md:13` ∥ `docs/desktop/design/SHELL.md:125` |
| 4 | §2.8.1 手动检查段补定裁半句（下载期失败——含手动检查转入下载者 = 保留全静默；与自动面 fail-soft 同款；对话框仅覆检查期 `error`） | `docs/desktop/design/PACKAGING.md:131` |
| 补 | 随正面两处（本条失效表述——行位含于 2b）：PACKAGING §3.1 `package.json` 说明「`dependencies` 零第三方不变」⇒ `electron-updater` 首第三方运行依赖（与 §2.8.2 同源）；MENU §3.1 `app-menu.mjs` 说明「宿主自办三项」⇒ **四项**（+`update`——与 KD-65 ① 同拍） | `docs/desktop/design/PACKAGING.md:238` ∥ `docs/desktop/design/MENU.md:47` |

**机检读数（修后 · `node scripts/doc-check.mjs` @ `thincoder` 仓根）**：悬空 **0** ∥ 行宽 **0**（OK(锚) ∥ OK(行宽)）；行数面差异 **10 ⇒ 1**（余项 = `docs/desktop/design/E2E-TESTING.md:249` `.gitignore` 表 8 ⇒ 实读 9——**非本批**（本批受影响面不含 `.gitignore`；疑 #807 构建窗余项——其批未收口）——未动 · 报父侧裁）。**变更记录**：四档各一行（各标「实施后回填轮」）——`docs/desktop/design/PACKAGING.md:335` ∥ `docs/desktop/design/MENU.md:170` ∥ `docs/desktop/design/PROJECT.md:1768` ∥ `docs/desktop/design/SHELL.md:331`。

**范围外注（照报——未动）**：① 上列 E2E `.gitignore` 余项（归批请父侧裁）；② 表头残例两处——`docs/desktop/design/PACKAGING.md:247`（§3.2 块）∥ `docs/desktop/design/MENU.md:95`（§3.4 块）表头仍「现行 ⇒ 预期」（各自批块历史遗留；本批两表已翻——按「各批自身回填轮归位」惯例未越批动）；③ 本批「（拟新增）」陈标余量（`docs/desktop/design/PACKAGING.md` §2.8.1 档头 ∥ KD-71 ∥ §2.9.1 ∥ §2.9.7 等——站点件已由父侧落）——沿「陈标末笔」微轮先例，未动。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | 需求卷已落 **D40/D41**（`thincoder/docs/desktop/requirements/PACKAGING.md:3` ∥ `:14-15` ∥ `:20`），设计侧仍作「需求卷无 D 项」旧态：① `PACKAGING.md:306` 需求侧缺口注「需求卷 D 表尚无自动更新 ∥ 官网桌面面 D 项…」；② `PACKAGING.md:323` **DK ⑤**「需求卷侧待正（…无 D 项——…新 D40 二择）」；③ `PACKAGING.md:301` 需求回指未点 D40/D41；④ `PROJECT.md:898` §6.1 表头「功能点 **D1–D39**」未随需求卷（现 D1–D41）。 | 四处同拍收正：缺口注转「已落：D40 ∥ D41」；回指补 D40/D41；§6.1 表头 **D1–D39 ⇒ D1–D41** + 本批验收块/指针行（沿 #812 ∥ #817 先例）。 |
| 2 | Acceptance | 🟡 | T-DSK60 ⑥「手查三果（…断网 ⇒ **静默回转 `idle`** + 下次可重试）」（`PACKAGING.md:315`）与 §2.8.1 手动检查三果「`error` ⇒ **对话框「检查更新失败」**+ 一行原因」（`PACKAGING.md:128`）相抵——同一机制两处描述不一（本档词面「静默」= 零弹框，属自动面 fail-soft，`PACKAGING.md:134`）；且「三果」仅列两果（缺 `update-available` ⇒ 转下载态）。 | 按 §2.8.1 契约收正 T-DSK60 ⑥（手查 error 径 = 对话框；「静默回转」限定自动面），补/改述第三果。 |
| 3 | File-size | 🟡 | `window.mjs` **288 ⇒ ≈305** 越 300 顾问线（`PACKAGING.md:274` ∥ `MENU.md:110`），两处文件账均无拆分预案 / 越层在册（对照先例：`PROJECT.md:399` settings.css 304 = 「在册越线不拆 + 预案 + 消解窗口」）。 | 补拆分预案与消解窗口（或明示「越线不拆」裁定），并随 §4.1 越层段登记。 |
| 4 | Doc-ownership | 🟡 | RELEASE.md §5.8 未随桌面端/自动更新随动：步骤 1「源 = **两端** `CHANGELOG.md`（CLI / VS Code 扩展）」（`RELEASE.md:306`）与 §6.4「输入 = **三端**（…含桌面）」（`:355`）不一；步骤 2「download 页系统要求**两行**」（`:308`）未含新插入桌面行（`PACKAGING.md:186` ⇒ 三行）。 | 两处收正（源 = 三端；行数口径随新首行）。 |
| 5 | Methodology | 🟡 | MENU.md §2 未随本批（对照 #811/#817/#820 各加 §2 本批注 `MENU.md:18 ∥ 21 ∥ 24`）：`MENU.md:29` 帮助组树面行仍「[命令与快捷键… ∥ 关于 ThinCoder…]」未含新首项「检查更新…」；`MENU.md:34` 项 5 边界仍列「检查更新（#810）」于不做系列（`MENU.md:13` KD-65 ⑦ 已翻「桌面发布·阶段二批落」）。 | 补 §2 本批注 + 随正两处（沿 #817 先例）。 |
| 6 | Clarity | 🔵 | §2.5「产物校验（check-dist 续填）」断言表（`PACKAGING.md:66-76`）未补指 §2.8.2 的 **+4 断言**（`PACKAGING.md:144`）——check-dist 单源读者面易漏（§2.1 已随拍翻，`:40`）。 | §2.5 补一行指针（+4 断言 = §2.8.2）。 |
| 7 | Doc-hygiene | 🔵 | `PACKAGING.md:156`「取回核验加查询串绕缓存（**沿 §2.6 先例**）」——§2.6 失败面表（`:78-88`）无该先例条目（同做法实际出处 = `RELEASE.md:286`）。 | 指针改指或去「先例」措辞。 |
| 8 | Acceptance | 🔵 | T-DSK60 前置（`PACKAGING.md:315`）未写明 vN 须为**携更新面**版本——0.10.1（阶段一产物，`PACKAGING.md:99 ∥ 260` 零触面）不含更新器（武装门 = `:113`），装 0.10.1 跑该用例 = 零自检空跑；首测点 = 第二个携更新版本发布窗。 | 前置句明示（vN 含更新面 ∥ 或允许本地构建旧版）。 |

范围外注（无严重级）：工作区根 `AGENTS.md`「Zero third-party runtime dependencies…」句（本审查 Project Guide 现文）不在审查范围——design 的声明面三处收正 = `package.json` description ∥ `thincoder-desktop/AGENTS.md`（`PACKAGING.md:145` ∥ §3.3 行 9）∥ 本档；若根档该句欲保持全局为真，需第四处随动（归父侧裁）。

计数：🔴 0 ∥ 🟡 5 ∥ 🔵 3（共 8）。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-03 01:2x）**：**依据**（用户 2026-10-03 01:10「把更新都跑完吧」全链授权——台账 #810 ∥ #826）：① **评审**——轮 1 = **pass**（0🔴 ∥ 5🟡 ∥ 3🔵；八条全采纳——修复轮逐条落（八号 → file:line 表在 §2）+ 父侧抽验 4/4（`PROJECT.md:902` D1–D41 ∥ `PACKAGING.md:316` T-DSK60 双修 ∥ `RELEASE.md:306/:308` 三端/三行 ∥ `MENU.md:28-29/:32-33` 本批注+首项）+ 机检 悬空 0 ∥ 行宽 0）；② **修正已落地并逐条核验** ✓；③ **designToken 已签发**（轮 1 通过回执——值不落档）。**批准 = 实施轮准行**：应用/构建侧 = eng-coder（带凭证——§3.3 行 1–12：`electron-builder.yml` ∥ `package.json` ∥ `src/main/update.mjs`（新）∥ `main.mjs` ∥ `app-menu.mjs` ∥ `menu-words.mjs` ∥ `window.mjs` ∥ `scripts/check-dist.mjs` ∥ `AGENTS.md` ∥ `CHANGELOG.md` ∥ 批内件×2）∥ **站点侧（thincoder.com）= 父侧轮**（规格 = §2.9）；**发布/部署动作 = 用户门（不开）**；阶段一构建窗（UKey）= 用户门。

## §5 实施记录（eng-coder）
**状态行**：实施完成（本舱 8 档 + 批内件 ⑪ 落盘（2026-10-03）；⑫ ∥ check-dist ∥ CHANGELOG ∥ 站点仓 = 父侧面（跨批写门拒——父侧直做）；内部审计 1 轮 + 代码评审 2 轮（轮 1 changes-required → 修复轮 → 轮 2 pass 核讫））


### 落地表（本舱 8 档 + 批内件 ⑪；现行 ⇒ 实读〔2026-10-03 · 内容行数口径 = 文末换行不计〕）

| # | 档 | 现行 ⇒ 实读 | 核 |
|---|---|---|---|
| 1 | `thincoder-desktop/electron-builder.yml` | 42 ⇒ **46**（publish 契约 3 行 + 注释指针代际收正 2 行——披露①） | ✅ 实读 + scheme 校验过 |
| 2 | `thincoder-desktop/package.json` | 25 ⇒ **26**（dependencies + `electron-updater ^6.8.9` ∥ description 句收正；lockfile 随动——披露②） | ✅ |
| 3 | `thincoder-desktop/src/main/update.mjs`（新） | 无 ⇒ **217**（策略面五态状态机 ∥ 注入五缝 ∥ 零 electron/零库 import；设计估 ≈170——披露③） | ✅ 批内件腿① 6 例全绿 |
| 4 | `thincoder-desktop/src/main/main.mjs` | 203 ⇒ **242**（`createRequire` ∥ 五缝 + 词表注入 ∥ 延时自检点火 ∥ 通知落子；估 ≈235） | ✅ 冒烟实跑 |
| 5 | `thincoder-desktop/src/main/app-menu.mjs` | 143 ⇒ **158**（帮助组「检查更新…」首项 + sep ∥ `update` 注入（状态 ⇒ label ∥ enabled）） | ✅ 腿② |
| 6 | `thincoder-desktop/src/main/menu-words.mjs` | 115 ⇒ **145**（+11 键 ⇒ 键集 43 两语同集 ∥ `{version}` 占位三句） | ✅ 腿③ |
| 7 | `thincoder-desktop/src/main/window.mjs` | 288 ⇒ **336**（`setUpdateFace` 转口 ∥ 更新对话框族（确认 ∥ 结果两态）∥ `onNative` +`update` 分支；越 300 在册——册值 ≈305 须按 336 收正） | ✅ 腿⑥源扫 |
| 9 | `thincoder-desktop/AGENTS.md` | 25 ⇒ **25**（依赖句收正——净 0；设计估 ≈27） | ✅ |
| 11 | `docs/batches/2026-10-02-desktop-release-stage2.test.mjs`（新） | 无 ⇒ **388**（11 用例全绿——腿①–⑥；估 ≈250——披露③） | ✅ 11/11 |
| ⑫ | `docs/batches/2026-10-01-desktop-packaging-release.test.mjs` | 376 ⇒（**父侧面**——跨批写门拒（跨批记录族）；批中读数 = 21 用例 15/6，父侧在修） | 父侧直做 |

**父侧面件（本舱零触——写门拒跨批；已上抛父侧直做）**：⑧ `thincoder-desktop/scripts/check-dist.mjs`（190 ⇒ **225** · +4 断言——已落）∥ ⑩ `thincoder-desktop/CHANGELOG.md`（13 ⇒ **19** · `[Unreleased]` 段——已落）∥ 站点侧三脚本（`deploy-oss` prune 豁免 ∥ `gen-changelog` `--side desktop` ∥ `upload-download`——**已落**，批内件腿⑤ 源扫全绿）∥ trim 批内件（父侧已修绿 3/3）。

### 红绿读数（实跑——命令与结果）

- **批内件 ⑪**：`node --test docs/batches/2026-10-02-desktop-release-stage2.test.mjs` ⇒ **11/11 绿**（腿① 状态机替身面 6 例 ∥ 腿② 菜单映射 ∥ 腿③ 词键集 ∥ 腿④ yml 契约 ∥ 腿⑤ 站点脚本源扫 ∥ 腿⑥ 零新通道 + 装配面源扫）。
- **桌面套件**：`thincoder-desktop` `npm test` ⇒ 空清单绿（零回归）。
- **冒烟（primary · 独立 `--user-data-dir`；真 Electron 44.4.5）**：`lock:primary ∥ window:true ∥ ok:true ∥ boot:ok ∥ served:134 ∥ blocked:6 ∥ probes:9 ∥ errors:[]`；**读数键集 = 12 键零增**（`smoke/lock/window/node/sqlite/floorMet/protocol/boot/configKeys/channels/errors/ok`——冒烟读数面零增字段 ✓）；stderr = `[update] startup check not scheduled — updater not armed (dev / --smoke)`（武装门 dev 态零点火 ✓）；装配路径（真 `require("electron-updater")` + 建窗 + 菜单）过。
- **零新 IPC（实读复核）**：`EVENT_CHANNELS` = 24 ∥ `CHANNELS` = 47 ∥ `HANDLERS` 表行集 = 白名单集（腿⑥）；`preload.cjs` ∥ `ipc-registry.mjs` ∥ 渲染面全档零触。
- **dev 链**：`node scripts/dev-link.mjs --check` ⇒ **5/5 规范**（npm install 使 `thincoder-desktop:core` 物化 ⇒ `dev-link --force` 恢复 ⇒ 终态 0）。
- **语法面**：五档 `node --check` 全过（update/main/window/app-menu/menu-words）。
- **旧批内件红态（如实）**：`2026-10-02-desktop-menu-system.test.mjs` 4/4 ∥ `2026-10-02-desktop-settings-menu-upgrade.test.mjs` 6/2——两档各有在册「预期红」头注；本轮**红用例数不变**（红点前移：帮助组 ∥ 键集），零新增红用例。

### 内审 ∥ 代码评审（轮次与终态）

- **内部审计（explore · 分歧审计）**：终态 = DEVIATIONS——(1) §5 空（本段兑现）∥ (2) 设计档回填未落（父侧/设计侧）；**(b) 静默简化 = 0 ∥ (d) 越界 = 0**；零新通道 ∥ 零回归 ∥ 父侧落件无冲突（`UPDATE_URL` 单值 ∥ provider generic 三面无歧）三项复核通过。
- **代码评审（advisor · code）轮 1**：**changes-required** —— 🔴 1（§5 空——本段兑现）∥ 🟡 3（皆非 must-fix：`window.mjs` 336 册值收正 ∥ 「手动检查 ⇒ 转下载态 ⇒ 下载失败」组合全静默 = 设计留白待裁〔§2.8.1 未覆盖〕∥ 批内件 388 行越顾问线）∥ 🔵 5（行数漂移登记 ∥ yml 注释披露 ∥ 设计档回填 ∥ `js-yaml` 解析链 ∥ 生命周期注）。
- **修复轮**：① 本 §5 落地；② ⑪ `js-yaml` 解析改走 electron-updater 自身解析链（提升 ∥ 嵌套两态皆达——不再依赖 `thincoder-desktop/node_modules` 提升态）；③ `main.mjs` 生命周期注补一句（更新面不入 `closed` 收尾列之由：一次性 `unref` 定时器 + 库监听 = 进程寿命面）。其余 = 登记/报告项（父侧/设计侧裁）。

### 披露（决策透明表）

① **yml 注释指针代际收正**（`:2` ∥ `:20-22`——文档重组后 §5.x 死指针 ⇒ §2.x；comment-only ∥ 键面零动；设计派单本行只点名 publish 行）。
② **lockfile 随动**（`npm install electron-updater@6.8.9`：+8 包 ∥ 21 处嵌套 `fs-extra` 归并提升 ∥ 净 −270/+80 行；`@thincoder/core` 链被 npm 物化 ⇒ dev-link `--force` 恢复 ⇒ 5/5）。
③ **实读超设计估**（update.mjs **217** vs ≈170 ∥ window.mjs **336** vs ≈305 ∥ 批内件 ⑪ **388** vs ≈250 ∥ yml **46** vs ≈45——供设计侧 §3.3/§4.1 回填取数）。
④ **设计留白上报**（§2.8.1：手动检查径「转下载态后下载失败」组合未覆盖——现行为 = 静默回转 `idle`（与字面不冲突）；待设计侧二择：认静默（补句）∥ 认出框（实现侧区分检查来源））。
⑤ **跨批/父侧面**（⑫ ∥ `check-dist.mjs` ∥ `CHANGELOG.md` ∥ 站点仓 = 父侧；本舱零触——跨批写门拒绝在册）。

**追记（代码评审轮 2 核讫 · 2026-10-03）**：轮 2 = **pass**（三项修复逐条实读证实 ∥ 零新 🔴；余项 = 登记/回填/顾问线件，非 must-fix）。一处记录态随正：本表 ⑫ 行「批中读数 = 21 用例 15/6，父侧在修」= **批中快照**；终态以 §1 直笔三线 ③ 为准——⑫ 由父侧修绿 **21/21** ∥ trim 批内件 **3/3**（本舱落地表 ⑫ 行读数与状态以本追记收口，不再追改）。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-03 02:0x · 父侧）**

**核读（全面）**：① 应用/构建侧 8 档 + 新 `update.mjs`（217 行——策略面五态状态机 ∥ 注入五缝 ∥ fail-soft ∥ 手动三果 ∥ 通知一次/版本 ∥ 武装门）——父侧通读 §5 落地表 + `update.mjs` 全文；② 父侧直笔三线（`check-dist` +4 断言 ∥ `CHANGELOG` 未发布段 ∥ ⑫/trim 随正）标记在 §1；③ 站点侧全件（11 页导航 ∥ 桌面专页 ∥ 三脚本）+ 独立仓提交 `1be4ae0`/`0ba7700`（零部署）；④ 回填轮四处（册值 336 ∥ 全表回填 ∥ KD-65 ④ 六处 ∥ §2.8.1 定裁半句）+ 工单齐平（行数面差异 10 ⇒ 1）。

**复跑（父侧亲跑）**：⑪ `node --test docs/batches/2026-10-02-desktop-release-stage2.test.mjs` ⇒ **11/11 pass**；⑫ ⇒ **21/21** ∥ trim ⇒ **3/3**；四产品套件（core ∥ cli ∥ desktop ∥ vscode）⇒ **空清单绿**（2026-09-28 全量重置在册）；`doc-check --root .` ⇒ 悬空 0 ∥ 行宽 0 ∥ 行数面差异 1（余项 = `E2E-TESTING.md:249`，非本批——归批在册）；零新 IPC（事件 24 ∥ 白名单 47——实读复核）；`dev-link --check` 5/5。

**过程如实**：① 评审轮 1（5🟡+3🔵）→ 修复轮八条 → §4 代签 → 实施（`#3`——含跨批写门拒止的停报/裁「父侧直做」）→ 回填轮（`#4`）；② 披露：实读超设计估（update 217 ∥ window 336 ∥ ⑪ 388）——回填已收；设计留白 ④（手动径下载失败）= 父裁定裁「保留全静默」入档（`PACKAGING.md:131`）。

**残项（挂账在册）**：`#836`（E2E `.gitignore` 表计数 8⇒9——疑 #807 构建窗余项，随其收窗随正）；表头残例 ×2（PACKAGING §3.2 ∥ MENU §3.4——历史批块记录面，不追）；「（拟新增）」陈标族（沿微轮先例待末笔）；**U4 回填**（`publisherName` ∥ `latest.yml` ∥ sha512 实读 = 构建窗）；**发布/部署动作 = 用户门**（构建 UKey ∥ 站点部署 ∥ feed 上传）；根 `AGENTS.md` 依赖句第四处随动 = 用户裁。**#807 承接**：原装位重跑 ∥ 残留清理 ∥ T-DSK55③ ∥ 站点轮余项（本次已吸收）——发布窗自持。

**结算**：**收口（2026-10-03）**——记录冻结；台账 #810 ∥ #826 核销（#826 追认 + #810 两段式）；提交 = 随收口签入；设计槽 = 随签入消费。
