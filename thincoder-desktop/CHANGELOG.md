# Changelog

All notable changes to ThinCoder Desktop are documented here.

## [0.10.3] — 2026-10-04

> 0.10.2 → 0.10.3（月内 +1——发布时定号）

### Added

- **Linux 产物支持（AppImage ∥ deb）**：`electron-builder.yml` linux ∥ deb 段落定——AppImage = 免安装单文件 · 自动更新单元（官网 feed `latest-linux.yml`）；deb = 系统包管理器手动升级（无自动更新）；产物校验扩 Linux 臂（`check-dist` 平台分臂 +9）；官网下载面 = 随构建机窗（L1–L5）。详见 `../docs/desktop/design/PACKAGING.md` §2.11。
- **子代理面板实况回读（#891/#892）**：完成块恒归位（不再停「等待消化」）+ 返回路径补口 + 桌面冻结阀。
- **菜单文案：「项目」⇒「工作目录」（#888）**：双语言面。

### Changed

- **核依赖升级**：`@thincoder/core` `^0.10.2` → `^0.10.3`。
- **模型切换解锁（#918）**：模型 ∥ 推理按钮**随处可切**（任意忙态可点；选定下一回合生效；写面 = 三键单写者 + 在飞受理顺延）。
- **渠道档位退役（#902）**：设置面渠道档位控件 ∥ tier 写径 ∥ effort 行投影全退（净删 −191）。
- **泛化编辑器退役（#903）**：设置面 agent 段纯具名行（泛化兜底行退场）。
- **流尾台账行退役（#913）**：「属主已死」行组去掉（状态行计数与明细 hover 保留）。
- **会话选定写回（#880）**：会话内选定 ⇒ 默认模型随动（新会话自动采用）。
- **fallback 提示文案（#879）**：补「— 正在使用可用渠道」澄清半句（与 VSC 同构）。
- **台账族合计（#882）**：歧义根下状态行台账段按族合计。

### Fixed

- **排队满 8 拒发卡死（#911）**：影子计数器退役——直读宿主镜像（多次使用后粘住的「满 8 拒发」修复）。
- **消化回填错位（#910）**：上滚多次后回填插错位——回填改全量重建（记录序）+ 视口补偿（旧包仍旧行为——本包生效）。

## [0.10.2] — 2026-10-03

> 0.10.1 → 0.10.2（月内 +1——发布时定号）

### Changed

- **provider 态归一（#841）**：核统一解析单源——composer 明示行（`fallback` ⇒ 一行明示、`ok` ⇒ 零节点）；发送 ∕ 页读 ∕ 设置写回执携 `providerState`（三刷新点）；`providerKind` 判据换源（「有持 key 渠道」）。
- **核依赖升级**：`@thincoder/core` `^0.9.5` → `^0.10.2`（声明面与实发对齐）。

### Fixed

- **首跑渠道提示修复（#840）**：已配渠道与 key 却误报「未配置 API 密钥」——真因分类出档（准确词面）；保存渠道时缺失的默认模型自动补写（仅缺失时）；修完配置免重启即生效（装配后槽复验）。

## [0.10.1] — 2026-10-01

> 首发（桌面端新号段 —— CalVer 各端同制，单源 = `../docs/RELEASE.md` §4）

### Added

- **Windows 安装包（NSIS · x64）**：`electron-builder.yml` 打包链落定——`prepackage` 两核包物化（`scripts/materialize-deps.mjs`）→ `electron-builder` → `postpackage` 产物校验（`scripts/check-dist.mjs`= 闸）；产物名 = `ThinCoder-Setup-0.10.1.exe`（版本单源 = `package.json`）。
- **签名就绪**：证书（GlobalSign EV · eToken 5300）在位 ⇒ 构建期实签（PowerShell `Set-AuthenticodeSignature` 主载体 ∥ `signtool` 备 · RFC3161 取时）；缺席 ⇒ 跳过并明示（构建零失败）。
- **自动更新（Windows）**：启动后自动检查更新——新版本后台静默下载（不打断会话），下载完成在菜单「帮助 → 检查更新」重启安装，或下次退出应用时自动完成安装；手动下载覆盖安装兜底（配置与会话不丢）。更新源 = 官网 `downloads/`（generic feed）；不自动发布——上传恒走发布窗小件。详见 `../docs/desktop/design/PACKAGING.md` §2.8（本版随列——重发窗 2026-10-03；号 = 发布窗定号）。
- **图标资产**：`build/icon.ico`（16 ∕ 32 ∥ 48 ∥ 256 多尺寸）——零依赖生成器 `scripts/make-icon.mjs`（圆角方块 `#2563eb` + `</>` 白字形，与站点 favicon 同品牌）。
