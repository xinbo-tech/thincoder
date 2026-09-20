# 发布流程（RELEASE）· 统一发布计划

> **落点裁定（2026-09-20 用户）**：本档 = **核 / CLI / VSC 三端发布流程的统一发布计划** ⇒ 落 `docs/` 根（用户 23:18「release.md 不应该放在那个目录里，应该直接放在 docs 目录下」；23:23「明确的要求把各端的 release.md 整合成一个」⇒ **三端合一 · 单档承载 · 无第二发布档**）。
> **本档覆盖**：需求（统一 + 各端通道差异）· 操作步骤（各端）· 踩坑与回滚（各端）· 核发布面 —— **发布流程一个主题 = 本档一处**（D2 ✗ 原 CLI 链细目档已并回本档 §5 ✗ 不再外指 ✗）。
> **机制面外链（仅三处 ✗ 不重述）**：核发布机制 / S2 期口径 = `CORE-UNIFICATION.md` §2.6.1；一致性断言推导 = D-C11；提示词面完备性断言对象 = 核包 `prompts/` 15 + `tool-docs/` 24。
> 建档：2026-09-15（B 式迁移轮）· 2026-09-20 核发布面并入 + 迁根 + **三端合一**。

## 1. 总体需求

发布动作必须是**唯一门禁**：一次触发即执行完整校验链，不过即中止。
对外版本号必须**连续不跳号**。
**发布顺序恒为：核 → CLI → VSC**（产品发布恒以核已发布为前提——`CORE-UNIFICATION.md` §2.6 发布顺序硬约束）。

## 2. 功能性需求（统一）

| # | 需求 | 说明 |
|---|---|---|
| **F1** | 发布 = 唯一门禁 | 门禁由发布命令自动执行（CLI `prepublishOnly` / VSC `vscode:prepublish` / 核 `prepublishOnly`——见各端链）；无独立「发布前再跑一次检查」步 |
| **F2** | 号在发布时定 | 开发批变更记录挂 `[Unreleased]` 段（**不编号**）；发布 = 唯一定号动作（bump → Unreleased 段头改新号） |
| **F3** | 待发号推导 | 待发号 = registry 已发最高号 + 1（发布前查 registry；号不一致 → 先纠正） |
| **F4** | 发布完成判定 | 发布命令正确返回（exit 0）= 完成——不轮询、不检查上线版本（npm publish 即见 / vsce 审核队列 = 平台侧事务） |
| **F5** | 核发布面 | **核 = 独立可发布单元**（`@thincoder/core` · 非 private · 独立版本——D-C10）；核发布 = **S2 收口动作**（核先发 → 产品后发）；核包自身首发运营前置见 §6 C-F4 |

## 3. 非功能性需求（统一）

| # | 维度 | 标准 |
|---|---|---|
| **N1** | **对外编号连续不跳空**（用户裁定） | npm / marketplace 号不得跳号 |
| **N2** | **禁止一次跳多号** | 发布前核对 registry 最高号 |
| **N3** | 门禁不可绕过 | 门禁不过 = 发布中止（**有意设计**） |
| **N4** | 缺口不补 | 历史缺口（0.12.54→0.12.58，55/56/57 永缺——registry 不可回溯重写）**不补发**；规则从下一发起保证零新缺口 |
| **N5** | **版本一致性三断言 + 提示词面完备性**（D-C11） | **断言 A（仓内）** 产品声明去 `^` 后逐字等于核 `version`；**断言 B（VSC 产物）** vsix 内核 `version` 逐字等于仓内核版本；**断言 C（CLI 发布预检）** 装入版本逐字等于仓内核版本 ∧ registry 上该版本存在；**断言 D（提示词面完备性）** 核包 tarball / CLI 装机目录 / vsix 解包三处 `prompts/` 15 档 + `tool-docs/` 24 档名集合逐字相等，同档 sha256 等于仓内核档 |

## 4. 根因记录（需求来源）

变更记录在开发期预占版本号（写段即占号）而发布动作没跟上 → 发布时直接发 `package.json` 当前号 →
**实发跳号（0.12.54 → 0.12.58，55/56/57 永缺）**；tag 只在发布时打（缺号处无 tag）。
F2 / F3 是此事故的直接修复产物。

## 5. CLI 发布链（npm · `thincoder`）

> 门禁接线：`thincoder-cli/package.json`（`prepublishOnly` → `npm run release:check` → `node scripts/release-check.mjs`）。

### 5.1 门禁链（两步一链 · 实核）

| 步 | 命令 / 落点 | 说明 |
|---|---|---|
| 1 · lint | `thincoder-cli/scripts/check-syntax.mjs` | 语法检查（`node --check` 系） |
| 2 · 全量测试 | `thincoder-cli/test/run.mjs` | 全量（单元 + 集成 + slow 全跑——单入口；`docs/core/design/TESTING.md` §10） |

**输出形态**：脚本捕获完整输出，只打印摘要行（`ℹ tests / pass / fail / skipped / duration`）；失败时**自动提取失败详情段**（`✖` 行 + 每失败块 ≤24 行、最多 12 块；输出无汇总段时回退打印输出尾 40 行）。失败详情永不静默丢。

**修复迭代纪律**：`npm publish` 失败 → 修复 → **局部重跑**（`node --test --test-name-pattern "<失败名>" <失败文件>`——秒级；集成档同法）确认修复 → **`npm publish` 终跑一次**收口。禁止每次失败都全链重跑。

### 5.2 操作步骤

发布前检查：

- `npm view thincoder version` 记录 registry 最高已发号（待发号 = 最高 + 1——§2 F3）；
- `CHANGELOG.md` 已更新新版本条目（Keep a Changelog 格式，中文，Added / Changed / Fixed / Removed 分节）；
- `package.json` version 已 bump（**发布时才 bump**——开发期不预占）；
- 真实端点 smoke 通过（`THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs`——**花真钱**，在 publish 自动门禁之外，发版前人工跑）。

发布命令：

```bash
cd thincoder-cli
npm publish
```

发布完成判定：publish **exit 0 = 发布完成**（不轮询——npm 无审核队列）。发版 commit + tag（`v<号>`）随发布提交推 origin。

### 5.3 踩坑记录（CLI 面）

- **版本 bump 别用 PowerShell `Set-Content -Encoding UTF8`**：Windows PowerShell 5.1 会写入 BOM（`EF BB BF`）导致 JSON 解析失败、prepublish 测试崩。改 `package.json` 用 JSON.parse → 改字段 → JSON.stringify（无 BOM），或 `-Encoding utf8NoBOM`。
- **门禁对称**：两端发布门必须同时跑 `lint && test`（历史上一端只 lint、一端只 test ⇒ 对方缺的那道门漏拦——2026-09-12 四环统一收正）。

## 6. VSC 发布链（vsix 双市场 · `thincoder-vscode`）

> 门禁接线：`thincoder-vscode/package.json`（`vscode:prepublish` = `npm run lint && npm test`——vsce package / 无参 publish 自动执行；无独立预跑步）。仓级文档机检不进发布门（走仓根 `node scripts/doc-check.mjs`——发布门不挂文档债 ✗ 2026-09-20 收正）。

### 6.1 双源发布（一条命令）

**`npm run publish:all`**（`scripts/publish-all.mjs`）——一次打包、**双源发同一 .vsix**（Microsoft Marketplace + Open VSX——Cursor/VSCodium/Windsurf 用户连 Open VSX ✗ 缺一即未完成 · 2026-08-29 漏发事故）；全量只测一次；`--skip-marketplace` / `--skip-openvsx` 显式单源。
**核守卫（2026-09-20 增补 ✓ 脚本已实现 ✓）**：段 0 = 核版本存在性预检（registry 查无 = 中止）· 段 1.5 = vsix 含核断言（解包校验——断言 B）。

### 6.2 操作步骤

- `CHANGELOG.md` 已更新（市场页 Changelog 标签内容来源）· 版本号已递增（CalVer `0.<月>.<月内序号>`——同一版本号不可重复发布）· 双源计划在位；
- PAT 校验照做（显式 `--pat` / `VSCE_PAT` + `OVSX_PAT`——**PAT 只走环境变量 / 显式传参 ✗ 零入库**）；
- `npx @vscode/vsce ls-publishers`（marketplace）/ `npx ovsx verify-pat xinbo-tech`（open-vsx）先验凭据——**无 TTY 环境下环境变量可能未继承，CLI 可能静默 exit 0 假装成功**（npm 的 exit-0 判定**不可**推广到 vsce/ovsx）；
- 执行 `npm run publish:all`。

发布完成判定：publish 命令 exit 0 = 完成（不轮询不查上线版本——审核队列 = 平台侧事务）。发版 commit + tag（`v<号>`）**双远端皆推**（origin + github——漏推即漏发布）。

### 6.3 踩坑记录（VSC 面）

- **Marketplace 延迟**：`vsce publish` 报 `already exists` 但 `vsce show` 仍旧版——通常**发布已成功、市场索引缓存延迟**（先 `vsce show ... --json` 确认 versions 列表；真失败报 `Invalid access token` 或明确错误）。
- **PAT 在环境变量里（会忘）**：agent 子进程无 TTY ⇒ 环境变量可能没继承 ⇒ 静默假成功——发布前先 `ls-publishers` / `verify-pat` 显式验证。

## 7. 核发布面（`@thincoder/core`）

> **结论**：**核需要发版** —— 两产品 `dependencies` 已声明 `"@thincoder/core": "^0.1.0"`（真 semver 范围），而 registry 上**无此包**（E404 实测 2026-09-20）⇒ 不发核则两端产物不可安装（消费者 E404——`CORE-UNIFICATION.md` §2.2.1 R5 同族）。开发期解析 = `npm link` 本地链接（§2.6.1）；生产期解析 = registry（核先发）。
> 机制权威 = `CORE-UNIFICATION.md` §2.6 / §2.6.1（发布顺序硬约束 + S2 期口径）/ D-C10–D-C12（核包策略 / 一致性断言 / 守卫落点）——本节只留需求与操作。

| # | 需求 | 说明 |
|---|---|---|
| **C-F1** | 核 = 独立发布单元 | `@thincoder/core` · 非 private · **独立版本**（不随产品版本——壳核解耦 D-C10）；`files` 白名单含 `prompts/` 15 + `tool-docs/` 24（断言 D 对象）；`exports` 子路径直入（`./*` → `./*`） |
| **C-F2** | 发布顺序 = 核 → CLI → VSC | 产品发布恒以核已发布为前提（硬约束）；VSC vsix **内嵌**核（marketplace 无依赖解析）；CLI 依赖由 registry 解析 |
| **C-F3** | 产品侧发布顺序守卫 | CLI `release-check` / VSC `publish-all.mjs` 段 0 = 核版本存在性预检（缺 = 中止）；断言 A/B/C/D 按各端落点（N5） |
| **C-F4** | 核首发前置清单（运营面） | ① `@thincoder` npm scope 归属确认（`npm whoami` + org 核对）② 首发**显式 `--access public`**（scoped 包默认 private）③ 核包 `prepublishOnly` 门禁**暂缺**（现 scripts 仅 `test`——首发前评估是否补 `test` 门；补 = 与 CLI/VSC 门禁对称原则一致） |
| **C-F5** | 核版本号规则（参照 CLI/VSC 既有规则——用户裁定） | **连续不跳号**（N1/N2 同源）；**起点 = 0.1.0**（仓内现值——registry 无号 ⇒ 首个推导号即 `0.1.0` ⇒ 无 bump）；后续递增 = semver 惯例（破坏/功能/修复）· **不采用** CLI 年段形态、**不采用** VSC CalVer——核版本独立（D-C10） |

操作：`cd thincoder-core && npm publish --access public`（首发显式；门禁若补 = `prepublishOnly` 挂 `npm test`）。发版 commit + tag（`v<号>`）随发布提交推 origin。
**核端非功能**：C-N1 连续不跳空（同 N1/N2）· C-N2 门禁不可绕过（若补 prepublishOnly）· C-N3 凭据不入库（同 V-F5）· C-N4 发布完成判定 = exit 0（npm 面同 F4）。

## 8. 不并项与历史沿革

| 旧档面 | 内容 | 何故不并（去向） |
|---|---|---|
| VSC 源档 §2（F1–F5 判定句的证据列）· §3（N1–N4 度量方式） | VSC 实现坐标 | 时点坐标——随版本演进失真；机制面已并入 §6（只留需求与操作） |
| 核发布机制全文（S2 期口径 / 锁面 / 机检 L1–L3 / 一致性断言推导） | 机制与推导 | 设计面——`CORE-UNIFICATION.md` §2.6.1 / D-C11（本档 §7 只留需求与操作——D2） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/requirements/RELEASE.md` 内容重建入基准层（落点原 = `docs/core/requirements/`）；门禁链补**集成集**环（旧档 F1 未同步）· F4 去实现名（行为陈述）。
- 2026-09-15（**VSC 轮并入 · 批 7**）：新增 **VSC 端通道面**（双市场 V-F1–V-F5 / V-N1–V-N3）——旧 `thincoder-vscode/docs/requirements/RELEASE.md` 原地作参照历史。
- 2026-09-20（**核发布面并入 · 主 agent**——用户 23:06「两端发版」触发实勘 + 23:08 问「核心需要发版吗？」+ 23:14「整合发布计划 + 核心发布纳入 + 核版本号规则参照 CLI/VSC」）：档头产品面补**核**（三发布单元）· §1 发布顺序恒等式（核 → CLI → VSC）· **F5 核发布面** · **N5 版本一致性三断言 + 断言 D** · **§7 核发布面**（结论：核必须发——registry E404 实测；C-F1–C-F5 + C-N1–C-N4）；
  核版本号规则 = 连续不跳号 + 起点 0.1.0 + semver 递增 + 独立版本。批 = 用户直接指令（发版准备面 · 无批档）。
- 2026-09-20（**落点迁根 · 主 agent**——用户 23:18「release.md 不应该放在那个目录里，应该直接放在 docs 目录下」）：本档迁 `docs/` 根（流程面·根层 ✗ 用户裁定改原 P1 判 ✗ DOC-SYSTEM §5.1 P3 精神同向）。
- 2026-09-20（**三端合一 · 主 agent**——用户 23:23「明确的要求把各端的 release.md 整合成一个」）：**CLI 链设计档（原 `docs/cli/design/RELEASE.md` 同日迁根件）并回本档 §5**（门禁链 / 操作步骤 / 踩坑）✗ **单档承载 ✗ 无第二发布档** ✗；档头改「统一发布计划」✗ 撤「总计划 + 链细目两档」形 ✗ 实现面外指撤 ✗；§8 不并项相应收窄 ✗（踩坑与操作已内并 ✗ 仅机制推导仍外链 `CORE-UNIFICATION.md` ✓）。
