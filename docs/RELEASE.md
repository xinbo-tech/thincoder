# 发布流程（RELEASE）· 统一面 · 需求

> 板块 = **发布流程**（npm / VS Code marketplace 发布）。**落点裁定（2026-09-20 用户）**：本档 = 跨三发布单元的**总发布计划** ⇒ 落 `docs/` 根（不再住 `core/requirements/`——原落点按 DOC-SYSTEM §5.1 P1 归 `core/`，用户裁定改根层＝与台账 / 批次档同层的流程面 ✗ 参照 P5「流程面不对半分」精神）。
> **产品面** = 三个可发布单元——**核**（`@thincoder/core`，npm）· **CLI**（`thincoder`，npm）· **VSC**（`thincoder-vscode`，vsix 双市场）。
> **CLI 链设计细目** = `docs/RELEASE-CLI.md`（原 `docs/cli/design/RELEASE.md` 同批同迁 ✗ 内容零改 ✗）——档头注：档面 = CLI 链设计；核 / VSC 链权威另有所在（核 = `CORE-UNIFICATION.md` §2.6.1 ✗ VSC = `thincoder-vscode/docs/_archive/design/RELEASE.md` 参照历史 ✓）。
> **核发布面设计权威** = `docs/core/design/CORE-UNIFICATION.md` §2.6 / §2.6.1 / D-C10–D-C12（发布顺序硬约束 / S2 期安装口径 / 核包策略与一致性断言——本档只留需求陈述，D2）。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/requirements/RELEASE.md` 内容重建入基准层 ✗ 原址 = `docs/core/requirements/RELEASE.md`；2026-09-20 迁 `docs/` 根）。

## 1. 总体需求

发布动作必须是**唯一门禁**：一次触发即执行完整校验链，不过即中止。
对外版本号必须**连续不跳号**。
**发布顺序恒为：核 → CLI → VSC**（产品发布恒以核已发布为前提——`CORE-UNIFICATION.md` §2.6 发布顺序硬约束）。

## 2. 功能性需求

| # | 需求 | 说明 |
|---|---|---|
| **F1** | 发布 = 唯一门禁（CLI） | `prepublishOnly` = `npm run release:check`——自动跑 **lint（语法检查）→ 全量测试（slow 全放行）→ 集成集（业务验收场景）**；摘要输出 + 失败详情自动提取（每失败块 ≤24 行、最多 12 块，无汇总段时回退输出尾 40 行） |
| **F2** | 号在发布时定 | 开发批变更记录挂 `[Unreleased]` 段（**不编号**）；发布 = 唯一定号动作（bump → Unreleased 段头改新号） |
| **F3** | 待发号推导 | 待发号 = registry 已发最高号 + 1（发布前查 registry；号不一致 → 先纠正） |
| **F4** | 手工检查步取消 | 不再有手动「发布前再跑一次检查」步——门禁由发布命令自动执行 |
| **F5** | 核发布面（2026-09-20 增补） | **核 = 独立可发布单元**（`@thincoder/core` · 非 private · 独立版本——`CORE-UNIFICATION.md` D-C10）；核发布 = **S2 收口动作**（核先发 → 产品后发——§2.6 硬约束）；核包门禁 = **发布顺序守卫在产品侧**（CLI 发布预检 = 断言 C【核版本已发布 + 装入版本一致】挂 `prepublishOnly`——D-C12；VSC `publish-all.mjs` 段 0 = 核版本存在性预检 + 段 1.5 = vsix 含核断言——D-C12），核包自身首发**运营前置**（`@thincoder` scope 归属 + 显式 `--access public`——§2.11 A3 ④） |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| **N1** | **对外编号连续不跳空**（用户裁定） | npm / marketplace 号不得跳号 |
| **N2** | **禁止一次跳多号** | 发布前核对 registry 最高号 |
| **N3** | 门禁不可绕过 | 门禁不过 = 发布中止（**有意设计**） |
| **N4** | 缺口不补 | 历史缺口（registry 不可回溯重写，内容已并入后一版）**不补发**；规则从下一发起保证零新缺口 |
| **N5** | **版本一致性三断言 + 提示词面完备性**（2026-09-20 增补 · `CORE-UNIFICATION.md` D-C11） | **断言 A（仓内）** 产品声明去 `^` 后逐字等于核 `version`；**断言 B（VSC 产物）** vsix 内核 `version` 逐字等于仓内核版本；**断言 C（CLI 发布预检）** 装入版本逐字等于仓内核版本 ∧ registry 上该版本存在；**断言 D（提示词面完备性）** 核包 tarball / CLI 装机目录 / vsix 解包三处 `prompts/` 15 档 + `tool-docs/` 24 档名集合逐字相等，同档 sha256 等于仓内核档 |

> **实现面**：门禁链的接线、三步顺序、失败详情提取算法与操作步骤 = `docs/RELEASE-CLI.md`；核发布顺序 / S2 期安装口径 / 锁面口径 = `CORE-UNIFICATION.md` §2.6.1；本档只留需求陈述（D2）。

## 4. 根因记录（需求来源）

变更记录在开发期预占版本号（写段即占号）而发布动作没跟上 → 发布时直接发 `package.json` 当前号 →
**实发跳号（0.12.54 → 0.12.58，55/56/57 永缺）**；tag 只在发布时打（缺号处无 tag）。
F2 / F3 是此事故的直接修复产物。

## 5. VSC 端通道面（VSC 轮并入 · 2026-09-15）

> **来源** = `thincoder-vscode/docs/requirements/RELEASE.md`（42 行 · VSC 产品档——迁移期参照历史）。本节 = 该档中「根层所缺」的 **VSC 端发布通道面**（双市场 = Marketplace + Open VSX——结构性端差，与 CLI npm 面同语义、异通道）。
> **对位注**：§2 F1 / §3 N1 / N3 的语义（唯一门禁 / 编号连续 / 门禁不可绕过）双端同源——VSC 侧同一机制在本节登记**通道差异**；设计侧操作步骤 = `thincoder-vscode/docs/_archive/design/RELEASE.md`（归档址——VSC 侧未迁入主档）——本档只留需求陈述（D2）。

| # | 需求 | 说明 |
|---|---|---|
| **V-F1** | 发布 = 唯一门禁（VSC） | `vscode:prepublish` = `npm run lint && npm test`（`thincoder-vscode/package.json`）——`vsce package` / 无参 `vsce publish` 自动执行；无独立预跑步。仓级文档机检改走**仓根域** `node scripts/doc-check.mjs`（域语义 / 取向裁定见 `docs/core/design/DOC-DISCIPLINE.md` §7） |
| **V-F2** | 双源发布一条命令 | `npm run publish:all`（`scripts/publish-all.mjs`）——一次打包、双源发同一 .vsix、全量只测一次；`--skip-marketplace` / `--skip-openvsx` 显式单源；**段 0 核版本存在性预检 + 段 1.5 vsix 含核断言**（2026-09-20 增补——F5 的 VSC 承接 ✓ 脚本已实现 ✓） |
| **V-F3** | 号在发布时定（VSC） | 开发期变更记录挂 `[Unreleased]`；发布 = 唯一定号动作；CalVer `0.<月>.<月内序号>` 月内计数重置 |
| **V-F4** | 发布完成判定（VSC） | 发布命令正确返回（exit 0）= 完成——不轮询、不检查上线版本（审核队列 = 平台侧事务）；边界 = 发布前 PAT 校验照做（显式 `--pat` / `VSCE_PAT` + `OVSX_PAT`） |
| **V-F5** | 凭据不入库（VSC） | PAT 只走环境变量 / 显式传参；仓库内零凭据（源码与发布产物同查） |

**VSC 端非功能**：V-N1 编号连续不跳空（发布前核对双源最高号 + 当前月 → 期望号公式；缺口不补）· V-N2 双远端同步（发布 commit + tag 两端 origin + github 皆推——漏推即漏发布）· V-N3 发布前清单可核（变更记录已更新 / 版本号已递增 / 双源计划在位）。

## 6. 核发布面（2026-09-20 增补 · 用户裁定「两端发版」触发实勘 + 用户问「核心需要发版吗？」）

> **结论（本节一句话）**：**核需要发版** —— 两产品 `dependencies` 已声明 `"@thincoder/core": "^0.1.0"`（真 semver 范围——契约 3 成立态），而 registry 上**无此包**（E404 实测 2026-09-20）⇒ 不发核则两端产物不可安装（消费者 E404——`CORE-UNIFICATION.md` §2.2.1 R5 同族）。开发期解析 = `npm link` 本地链接（§2.6.1）；生产期解析 = registry（核先发）。
> 设计权威 = `CORE-UNIFICATION.md` §2.6 / §2.6.1（发布顺序硬约束 + S2 期口径）/ D-C10–D-C12（核包策略 / 一致性断言 / 守卫落点）；本节 = 需求陈述 + 首发前置清单。

| # | 需求 | 说明 |
|---|---|---|
| **C-F1** | 核 = 独立发布单元 | `@thincoder/core` · 非 private · **独立版本**（不随产品版本——壳核解耦）；`files` 白名单含 `prompts/` 15 + `tool-docs/` 24（断言 D 对象）；`exports` 子路径直入（`./*` → `./*`） |
| **C-F2** | 发布顺序 = 核 → CLI → VSC | 产品发布恒以核已发布为前提（硬约束）；VSC vsix **内嵌**核（marketplace 无依赖解析——反排除行）；CLI 依赖由 registry 解析 |
| **C-F3** | 产品侧发布顺序守卫 | CLI `release-check` / VSC `publish-all.mjs` 段 0 = 核版本存在性预检（缺 = 中止）；断言 A/B/C/D 按各端落点（N5） |
| **C-F4** | 核首发前置清单（运营面） | ① `@thincoder` npm scope 归属确认（`npm whoami` + org 核对）② 首发**显式 `--access public`**（scoped 包默认 private）③ 核包 `prepublishOnly` 门禁**暂缺**（现 scripts 仅 `test`——首发前评估是否补 `test` 门；补 = 与 CLI/VSC 门禁对称原则一致） |
| **C-F5** | 核版本号规则（**参照 CLI/VSC 既有规则**——用户 2026-09-20 裁定） | **连续不跳号**（N1/N2 同源——待发号 = registry 最高 + 1）；**版本起点 = 0.1.0**（仓内现值——首发号 = registry 最高（无）+ 1 推导的**首个号**即 `0.1.0` ✓ 与仓内一致 ⇒ 无 bump）；后续递增 = semver 惯例（破坏/功能/修复）· **不采用** CLI 的年段递增形态、**不采用** VSC 的 CalVer——核版本独立（D-C10），语义化三段由核自身的破坏/功能/修复节奏承载 |

**核端非功能**：C-N1 编号连续不跳空（同 N1/N2）· C-N2 门禁不可绕过（同 N3——若补 `prepublishOnly`）· C-N3 凭据不入库（同 V-F5）· C-N4 发布完成判定 = publish exit 0（npm 面同 F4/V-F4 语义）。

## 7. 不并项与历史沿革

### 7.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/requirements/RELEASE.md`（CLI 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档档头「来源：2026-09-10 自设计档抽取」注 | 拆分来源指针 | 时点材料——需求已归位到本档 |
| 旧档档头「状态：**现行**。设计+测试见设计档」 | 时点状态行 + 迁移前设计档址 | 批次语境——本档档头已给配对档现状路径 |
| 旧档变更记录 | 逐批流水 | 历史叙述——本档自有变更记录 |

### 7.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 发布操作步骤 / 踩坑记录 / 回滚 | 命令、代理、双远端、vsce-ovsx 教训 | 设计面——`docs/RELEASE-CLI.md`（CLI 侧）· `thincoder-vscode/docs/_archive/design/RELEASE.md`（VSC 参照历史） |
| VSC 源档 §2（F1–F5 判定句的证据列）· §3（N1–N4 度量方式——`package.json` 行号 / `thincoder-vscode/CHANGELOG.md:8` / `docs/design/RELEASE.md` 节号） | VSC 实现坐标 | 时点坐标——随版本演进失真；机制面已并入 §5（只留需求陈述） |
| 核发布机制全文（S2 期口径 / 锁面 / 机检 L1–L3 / 一致性断言推导） | 机制与推导 | 设计面——`CORE-UNIFICATION.md` §2.6.1 / D-C11（本档 §2 F5 / §6 只留需求陈述——D2） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/requirements/RELEASE.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/core/requirements/`（统一面——发布流程是跨产品板块主题）；**档头注明配对设计档位置**（设计档判 CLI 面——层归属不对称已明写）；
  ② **F1 按实核收正**：门禁链补入**集成集**环（旧档 F1 只写 lint + 全量测试——设计档早已三环，需求档未同步）；
  ③ F4 措辞去「`release:check`」实现名（改为行为陈述）；④ 新增 §5 不并项与历史沿革、§6 体量。
- 2026-09-15（**VSC 轮并入 · 批 7**）：新增 §5 **VSC 端通道面**（双市场 = Marketplace + Open VSX：V-F1–V-F5 / V-N1–V-N3——唯一门禁 / 定号 / 完成判定 / 凭据不入库；CLI npm 面不重述）· 旧 §5 → §6（不并项表更新）；来源 = `thincoder-vscode/docs/requirements/RELEASE.md`（**旧档一字未改**——原地作参照历史）。
- 2026-09-20（**核发布面并入 · 主 agent**——用户 23:06「两端发版」触发实勘 + 23:08 问「核心需要发版吗？」+ 23:14「整合发布计划 + 核心发布纳入 + 核版本号规则参照 CLI/VSC」）：① 档头产品面补**核**（三发布单元）；§1 补**发布顺序恒等式**（核 → CLI → VSC）；
  ② **§2 新增 F5**（核发布面：独立单元 / S2 收口时点 / 产品侧守卫 / 首发运营前置——D-C10–D-C12 需求化）；③ §3 新增 **N5**（版本一致性三断言 + 提示词面完备性——D-C11 需求化）；
  ④ **新增 §6「核发布面」**（结论：核必须发——两产品真 semver 依赖 + registry E404 实测；C-F1–C-F5 需求行 + C-N1–C-N4；**核版本号规则 = 连续不跳号 + 起点 0.1.0 + semver 递增 + 独立版本**〔参照 CLI 连续性铁律 + VSC 定号纪律 ✗ 不采年段/CalVer 形态——D-C10 核版本独立〕）；⑤ §7 不并项补核发布机制行（D2——机制全文住 `CORE-UNIFICATION.md`）。批 = 用户直接指令（发版准备面 · 无批档）。
- 2026-09-20（**落点迁根 · 主 agent**——用户 23:18「release.md 不应该放在那个目录里，应该直接放在 docs 目录下」）：**本档 `git mv docs/core/requirements/RELEASE.md → docs/RELEASE.md`**（落点 = 流程面·根层，与台账 / 批次档 / 地图同层——用户裁定改原 P1 判 ✗；DOC-SYSTEM §5.1 P3 精神同向）；
  **CLI 链设计档同批同迁 `docs/cli/design/RELEASE.md → docs/RELEASE-CLI.md`**（内容零改 ✗ 档名加后缀避同名撞车 ✗）；档头配对注改写（不再称「配对成对」——改为总计划 + CLI 链细目两档）；实现面指针 / 不并项表 / 变更记录内引同批改指。旧址零残留（`git mv` = 移动非拷贝 ✗ 双权威源不成立 ✓）。
