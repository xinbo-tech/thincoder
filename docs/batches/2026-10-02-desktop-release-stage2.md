# 2026-10-02 · 桌面发布·阶段二（官网与自动更新）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 21:39 三项需求（发布流程加桌面 ∥ 官网加桌面介绍 ∥ 自动更新落地）+ 台账 #810（自动更新在册）+ #807 站点轮余项承接。
> 台账 = #810 ∥ #826（桌面发布 · 归批）。前情 = docs/batches/2026-10-01-desktop-packaging-release.md §1（进行中——阶段二承接其「站点轮」余项）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**需求登记（用户 2026-10-02 21:39 · 父侧笔录）**：
1. **发布流程加桌面端**——口径：先 Windows 下载版；Linux/mac ∥ 应用商店 = 后加。**现状核**：`docs/RELEASE.md` §5.6「阶段 3b · 发桌面（Windows 安装包 · 阶段一）」已在（2026-10-01 打包批落笔——定号/CHANGELOG/物化/打包/签名/上传/官网挂载 ∥ §6 站点面设计在档）⇒ 本批动作 = **缺口核**（全对齐 ⇒ 零改；含自动更新入流程与否）。
2. **官网加桌面介绍**——形态（父侧建议 · 用户「开始」＝采用）：照 `cli.html`/`vscode.html` 先例建 **desktop 专页** + `download.html` 桌面下载卡 + index/导航触点 + 系统要求/更新段 + changelog 桌面节（RELEASE.md §6 已在设计）+ **更新 feed 托管面**（与 3 咬合）。**路由注**：站点 = `d:\teamcode\thincoder.com`（**独立仓**）⇒ 子代理禁跨仓写——**站点实现 = 父侧直做**（设计仍入本批设计档；评审同批视检）。
3. **桌面自动更新落地**——口径照台账 **#810** 在册案：应用侧 electron-updater（**启动自检 ∥ 静默下载 ∥ 提示重启**——不打断会话）∥ 构建侧 publish 配置（generic feed ⇒ `latest.yml` + `app-update.yml` + blockmap——**开封 `publish: null`**）∥ 站点侧 feed 托管。路由：应用侧/构建侧 = 仓内（eng-coder）；站点侧 = 父侧。

**承接（#807 打包批余项）**：站点轮 ⇒ 本批；原装位重跑 ∥ 残留清理 ∥ T-DSK55③ ⇒ 发布窗自持（#807 批档面——发布 = 用户门）。**边界**：Linux/mac ∥ 商店 = 不做；更新通道只此一条（generic feed）；零新事件通道；不改三端既有发布链。**设计轮已派发**（eng-designer）。

**站点侧记录已建（用户 21:43 令「在 thincoder.com 那边也建批档」）**：`thincoder.com/docs/batches/2026-10-02-desktop-download-page.md`（**父侧直笔**——站点仓无批工具基根（跨仓 fail-closed 已实测）⇒ 普通记录档，形沿用六段语义；**设计单源仍 = 本批**，站点档只记执行与读数）；站点仓缺 docs 层 ⇒ 就地补建 `docs/batches/`（首档）。

**站点仓 manifest 已落（用户 21:48 令「该创建就要创建」）**：`thincoder.com/PROJECT-MANIFEST.json`——经 `writeManifest(writer:'main')` 专权写门（schema 校验 OK）：`docRoot.batches = docs/batches` ∥ `codePaths = ["www","scripts"]` ∥ phase = initial-dev。**边界复核**：跨仓 create 仍拒（基根按**会话锚**解析——站点 manifest 不在本会话判定面）⇒ 站点侧记录维持普通档（父侧直笔）；**锚在站点仓的会话**可得六段全机制。**⚠ 双项目并存副作用**：工作区锚下现有两个带档目录（thincoder ∥ thincoder.com）⇒ 机制「不猜」——批档/台账诸写面**一律显式路径**（本笔即以绝对路径落笔为准）。在飞：设计轮 #35 继续。

**设计轮核读 + 需求卷 U1 兑现（父侧 · 2026-10-02 22:0x）**：设计落点实读——`docs/desktop/design/PACKAGING.md` **331 行**（KD-71 自动更新三件面 §2.8.1/§2.8.2/§2.8.3 ∥ KD-72 官网规格 §2.9.1–2.9.7 ∥ §2.10 承接表 ∥ T-DSK60）；`docs/RELEASE.md` **403 行**七处收正（图行 feed 三件 ∥ §5.6 指针 ∥ 步 4 `upload-download` ∥ §6.3 桌面行——抽核 ✓）；`MENU.md`/`PROJECT.md` 指针随动 ✓；批档 §2 在册（状态行 = 设计完成）。**需求卷兑现（主 agent 笔 · U1）**：**D40**（自动更新）∥ **D41**（官网桌面面）落 `requirements/PACKAGING.md`（卷计 4 条）+ 总览索引/计数随动（九卷 40 + D14 = **41（D1–D41）**）+ 九卷头像句随动 + 两档变更行。**设计就绪——候用户点火设计评审。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（落点 = docs/desktop/design/PACKAGING.md §1 KD-71 ∥ KD-72 · §2.8–§2.10 · §4.3 · §5 T-DSK60 · §6 DK；机检锚 0 ∥ 行宽 0（2026-10-02））
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

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
