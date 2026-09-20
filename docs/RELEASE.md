# 发布流程（RELEASE）· 统一发布计划

> **落点裁定（2026-09-20 用户）**：本档 = **核 / CLI / VSC 三端发布流程的统一发布计划** ⇒ 落 `docs/` 根（用户 23:18「release.md 不应该放在那个目录里，应该直接放在 docs 目录下」；23:23「明确的要求把各端的 release.md 整合成一个」⇒ **三端合一 · 单档承载 · 无第二发布档**）。
> **本档覆盖**：端到端发布流程（§5——一步步走）· 版本号规则（§4——CalVer 三端同制）· 需求（统一 + 各端通道差异）· 各端门禁接线与踩坑 —— **发布流程一个主题 = 本档一处**（D2）。
> **机制面外链（仅两处 ✗ 不重述）**：核发布机制 / S2 期口径 = `CORE-UNIFICATION.md` §2.6.1；一致性断言 A/B/C/D 全文 = D-C11。
> 建档：2026-09-15（B 式迁移轮）· 2026-09-20 核发布面并入 + 迁根 + 三端合一 + **流程章重构**。

## 1. 总体需求

发布动作必须是**唯一门禁**：一次触发即执行完整校验链，不过即中止。
对外版本号规则 = **CalVer**（§4——三端同制）。
**发布顺序恒为：核 → CLI → VSC**（产品发布恒以核已发布为前提——`CORE-UNIFICATION.md` §2.6 发布顺序硬约束）。
**端到端流程 = §5**（四阶段一步步走——本节是索引，流程本体在 §5）。

## 2. 功能性需求（统一）

| # | 需求 | 说明 |
|---|---|---|
| **F1** | 发布 = 唯一门禁 | 门禁由发布命令自动执行（CLI `prepublishOnly` / VSC `vscode:prepublish` / 核 `prepublishOnly`——见各端链）；无独立「发布前再跑一次检查」步 |
| **F2** | 号在发布时定 | 开发批变更记录挂 `[Unreleased]` 段（**不编号**）；发布 = 唯一定号动作（bump → Unreleased 段头改新号） |
| **F3** | 待发号推导 | 待发号推导规则 = §4.2（当月最高 + 1 / 月切换 = `0.<当月>.1`） |
| **F4** | 发布完成判定 | 发布命令正确返回（exit 0）= 完成——不轮询、不检查上线版本（npm publish 即见 / vsce 审核队列 = 平台侧事务） |
| **F5** | 核发布面 | **核 = 独立可发布单元**（`@thincoder/core` · 非 private · 独立版本——D-C10）；核发布 = **S2 收口动作**（核先发 → 产品后发）；核包首发运营前置 = §8 C-F4 |

## 3. 非功能性需求（统一）

| # | 维度 | 标准 |
|---|---|---|
| **N1** | **对外编号连续不跳空**（用户裁定） | npm / marketplace 号不得跳号 |
| **N2** | **禁止一次跳多号** | 发布前核对当月最高号（§4.2） |
| **N3** | 门禁不可绕过 | 门禁不过 = 发布中止（**有意设计**） |
| **N4** | 缺口不补 | 历史缺口（0.12.54→0.12.58，55/56/57 永缺——registry 不可回溯重写）**不补发**；越月预占号**作废**（0.8.11 先例）；规则从下一发起保证零新缺口 |
| **N5** | **版本一致性三断言 + 提示词面完备性**（D-C11） | **断言 A（仓内）** 产品声明范围与核版本相容（caret 语义）；**断言 B（VSC 产物）** vsix 内核 `version` 逐字等于仓内核版本；**断言 C（CLI 发布预检）** 装入版本逐字等于仓内核版本 ∧ registry 上该版本存在；**断言 D（提示词面完备性）** 核包 tarball / CLI 装机目录 / vsix 解包三处 `prompts/` 15 档 + `tool-docs/` 24 档名集合逐字相等，同档 sha256 等于仓内核档。**发版同步**：两产品 `dependencies` 现声明 `^0.1.0`——核首发 `0.9.1` 后同步收正为 `^0.9.1`（声明面与实发对齐） |

## 4. 版本号规则（CalVer · **三端同制**——用户 2026-08-27 拍板）

### 4.1 格式：`年份段.月份段.月内计数段`

| 段 | 含义 | 规则 |
|---|---|---|
| 第一段 | **年份** | 2026 = 0，2027 = 1，每年 +1 |
| 第二段 | **月份** | 1 = 1 月 … 12 = 12 月 |
| 第三段 | **月内发布计数** | **每月从 1 重置**，月内逐次 +1 |

> **号反映发布时间，不反映语义**——semver 语义递增（patch/minor/major 按功能跳段）已废（2026-09-06 R7 勘误）。

### 4.2 定号纪律

1. **号在发布时定，开发期不预占**：开发批 CHANGELOG 记录挂 `[Unreleased]` 段（不编号）；发布 = 唯一定号动作（bump → Unreleased 段头改新号）。
2. **待发号 = 当月已发最高号 + 1**；发布前查当月双源最高 + 当前月（期望号 = `0.<当月>.<月内序号>`；package.json ≠ 期望号 → 先纠正）。
3. **月切换硬规则**：新月份第一次发布 = `0.<当月>.1`（月内计数每月重置，CalVer 语义）。
4. **缺口 / 越月号不补**：历史缺口（0.12.54→0.12.58，55/56/57 永缺——registry 不可回溯重写）**不补发**；0.8.11 类越月预占号**作废**（0.8.11 先例——9 月内容归 0.9.1）；规则从下一发起保证零新缺口。
5. **三端独立号段**：核（`@thincoder/core`）· CLI（`thincoder`）· VSC（`thincoder-vscode`）各自独立计数，互不挤占（包名不同，版本各算）。

### 4.3 三端现算（as-of 2026-09-20）

| 端 | 下一号 | 推导 |
|---|---|---|
| **核**（首发） | **`0.9.1`** | 2026-09 当月 + registry 无号 ⇒ 当月首发 = `0.<当月>.1` |
| **CLI** | **`0.12.63`** | 2026 年内 `0.12.x` 连续递增（第二段 "12" = 历史乱号当年度号，不倒退；**2027-01-01 起切 `1.1.0`**） |
| **VSC** | **`0.9.3`** | 9 月已发 0.9.1 / 0.9.2，+1 |

> **历史根因（2026-09-05 实证）**：开发期预占版本号而发布没跟上 → 实发 0.12.54 → 0.12.58（55/56/57 永缺）；tag 只在发布时打。F2 / §4.2 是此事故的直接修复产物。**VSC 越月先例**：0.8.11 系 9 月预占号，违反月切换 → 作废为 Unreleased，9 月内容归 0.9.1。

### 4.4 版本一致性断言（发版同步面）

两产品 `dependencies` 现声明 `"@thincoder/core": "^0.1.0"`——核首发 `0.9.1` 后应**同步收正为 `^0.9.1`**（caret 兼容，声明面与实发对齐）；一致性断言 A/B/C/D 全文 = `CORE-UNIFICATION.md` D-C11（此处不重述）。

## 5. 发布流程（端到端 · 一步步走）

### 5.1 总览

```
发布顺序恒等式：核 → CLI → VSC（任一端失败即停；修复后从失败端重跑——已发端不重发，号已占）

[阶段 0 · 发布前置]（三端通用——§5.2）
      ↓
[阶段 1 · 发核  ]  npm publish --access public          ← 自动门禁：prepublishOnly（若已补）
      ↓
[阶段 2 · 发 CLI]  smoke（人工·花真钱）→ npm publish    ← 自动门禁：prepublishOnly = release:check
      ↓
[阶段 3 · 发 VSC]  verify-pat → npm run publish:all     ← 自动门禁：vscode:prepublish + 核守卫（段 0/1.5）
      ↓
[阶段 4 · 收尾  ]  tag + push（CLI origin；VSC 双远端）→ 完成判定 exit 0（§5.6）
```

### 5.2 阶段 0 · 发布前置（三端通用）

1. **定号**（§4.2）：查当月最高已发号 + 当前月 → 期望号；`package.json` ≠ 期望号 → 先纠正再走流程。
2. **CHANGELOG**：`[Unreleased]` 段头改为新号（Keep a Changelog 格式，中文，Added / Changed / Fixed / Removed 分节；VSC 侧 = 市场页 Changelog 标签内容来源）。
3. **version bump**：`package.json` 改到期望号（**JSON.parse → 改字段 → JSON.stringify**——禁 PowerShell `Set-Content -Encoding UTF8`，BOM 坑见 §6.3）。
4. **依赖核对**：两产品 `@thincoder/core` 声明与本次核版本对齐（§4.4——本次首发后收正 `^0.9.1`）。

### 5.3 阶段 1 · 发核（`@thincoder/core`）

首发一次性前置：① `npm whoami` + `@thincoder` scope 归属确认；② 核包门禁若已补（`prepublishOnly` = `npm test`）会自动执行。

```bash
cd thincoder-core
npm publish --access public    # scoped 包默认 private——首发必须显式 public
```

完成判定：exit 0；复核 `npm view @thincoder/core version` = 本次号。

### 5.4 阶段 2 · 发 CLI（`thincoder`）

1. **smoke**（人工 · **花真钱** · 在自动门禁之外）：`THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs`——不过不发。
2. **发布**：

```bash
cd thincoder-cli
npm publish                    # prepublishOnly 自动跑 release:check（lint → 全量 → 集成，§6.1）
```

3. **失败处置**：修复 → **局部重跑**（`node --test --test-name-pattern "<失败名>" <失败文件>`——秒级）确认 → **再 `npm publish` 终跑一次**收口（禁每次失败全链重跑——§6.1）。

### 5.5 阶段 3 · 发 VSC（`thincoder-vscode`）

1. **凭据预验**（防无 TTY 静默假成功——npm 的 exit-0 判定**不可**推广到 vsce/ovsx）：`npx @vscode/vsce ls-publishers`（marketplace）+ `npx ovsx verify-pat xinbo-tech`（open-vsx）；PAT 走 `VSCE_PAT` / `OVSX_PAT` 或显式传参，**零入库**。
2. **发布**：

```bash
cd thincoder-vscode
npm run publish:all            # vscode:prepublish 自动跑 lint+test；核守卫段 0（registry 查核）+ 段 1.5（vsix 含核断言）；双市场同发（§7.1）
```

3. **完成判定**：exit 0 = 完成；`already exists` 假报 = 市场索引延迟，先 `vsce show ... --json` 核对（§7.3）。

### 5.6 阶段 4 · 发布后收尾

1. **发版 commit + tag**（`v<号>`）：CLI / 核推 origin；VSC **双远端皆推**（origin + github——漏推即漏发布）。
2. **验证**：npm 侧 `npm view <包名> version`；VSC 侧 `vsce show <扩展> --json` 看 versions 列表（市场索引延迟 ≠ 发布失败）。
3. **失败总原则**：任一端失败即停 → 修复 → **从失败端重跑**（已发端不重发——号已占，重发会被 registry 拒）。

## 6. CLI 发布链（npm · `thincoder`——门禁接线与踩坑）

> 门禁接线：`thincoder-cli/package.json`（`prepublishOnly` → `npm run release:check` → `node scripts/release-check.mjs`）。流程步骤 = §5.4（此处不重述）。

### 6.1 门禁链（两步一链 · 实核）

| 步 | 命令 / 落点 | 说明 |
|---|---|---|
| 1 · lint | `thincoder-cli/scripts/check-syntax.mjs` | 语法检查（`node --check` 系） |
| 2 · 全量测试 | `thincoder-cli/test/run.mjs` | 全量（单元 + 集成 + slow 全跑——单入口；`docs/core/design/TESTING.md` §10） |

**输出形态**：脚本捕获完整输出，只打印摘要行（`ℹ tests / pass / fail / skipped / duration`）；失败时**自动提取失败详情段**（`✖` 行 + 每失败块 ≤24 行、最多 12 块；输出无汇总段时回退打印输出尾 40 行）。失败详情永不静默丢。

### 6.3 踩坑记录（CLI 面）

- **版本 bump 别用 PowerShell `Set-Content -Encoding UTF8`**：Windows PowerShell 5.1 会写入 BOM（`EF BB BF`）导致 JSON 解析失败、prepublish 测试崩。改 `package.json` 用 JSON.parse → 改字段 → JSON.stringify（无 BOM），或 `-Encoding utf8NoBOM`。
- **门禁对称**：两端发布门必须同时跑 `lint && test`（历史上一端只 lint、一端只 test ⇒ 对方缺的那道门漏拦——2026-09-12 四环统一收正）。

## 7. VSC 发布链（vsix 双市场 · `thincoder-vscode`——门禁接线与踩坑）

> 门禁接线：`thincoder-vscode/package.json`（`vscode:prepublish` = `npm run lint && npm test`——vsce package / 无参 publish 自动执行；无独立预跑步）。仓级文档机检不进发布门（走仓根 `node scripts/doc-check.mjs`——发布门不挂文档债，2026-09-20 收正）。流程步骤 = §5.5（此处不重述）。

### 7.1 双源发布（一条命令）

**`npm run publish:all`**（`scripts/publish-all.mjs`）——一次打包、**双源发同一 .vsix**（Microsoft Marketplace + Open VSX——Cursor/VSCodium/Windsurf 用户连 Open VSX，缺一即未完成 · 2026-08-29 漏发事故）；全量只测一次；`--skip-marketplace` / `--skip-openvsx` 显式单源。
**核守卫（2026-09-20 增补，脚本已实现）**：段 0 = 核版本存在性预检（registry 查无 = 中止）· 段 1.5 = vsix 含核断言（解包校验——断言 B）。

### 7.3 踩坑记录（VSC 面）

- **Marketplace 延迟**：`vsce publish` 报 `already exists` 但 `vsce show` 仍旧版——通常**发布已成功、市场索引缓存延迟**（先 `vsce show ... --json` 确认 versions 列表；真失败报 `Invalid access token` 或明确错误）。
- **PAT 在环境变量里（会忘）**：agent 子进程无 TTY ⇒ 环境变量可能没继承 ⇒ 静默假成功——发布前先 `ls-publishers` / `verify-pat` 显式验证。

## 8. 核发布面（`@thincoder/core`——需求与门禁）

> **结论**：**核需要发版** —— 两产品 `dependencies` 已声明 `"@thincoder/core": "^0.1.0"`（真 semver 范围），而 registry 上**无此包**（E404 实测 2026-09-20）⇒ 不发核则两端产物不可安装（消费者 E404——`CORE-UNIFICATION.md` §2.2.1 R5 同族）。开发期解析 = `npm link` 本地链接（§2.6.1）；生产期解析 = registry（核先发）。流程步骤 = §5.3。
> 机制权威 = `CORE-UNIFICATION.md` §2.6 / §2.6.1（发布顺序硬约束 + S2 期口径）/ D-C10–D-C12（核包策略 / 一致性断言 / 守卫落点）——本节只留需求。

| # | 需求 | 说明 |
|---|---|---|
| **C-F1** | 核 = 独立发布单元 | `@thincoder/core` · 非 private · **独立版本**（不随产品版本——壳核解耦 D-C10）；`files` 白名单含 `prompts/` 15 + `tool-docs/` 24（断言 D 对象）；`exports` 子路径直入（`./*` → `./*`） |
| **C-F2** | 发布顺序 = 核 → CLI → VSC | 产品发布恒以核已发布为前提（硬约束）；VSC vsix **内嵌**核（marketplace 无依赖解析）；CLI 依赖由 registry 解析 |
| **C-F3** | 产品侧发布顺序守卫 | CLI `release-check` / VSC `publish-all.mjs` 段 0 = 核版本存在性预检（缺 = 中止）；断言 A/B/C/D 按各端落点（N5） |
| **C-F4** | 核首发前置清单（运营面） | ① `@thincoder` npm scope 归属确认（`npm whoami` + org 核对）② 首发**显式 `--access public`**（scoped 包默认 private）③ 核包 `prepublishOnly` 门禁**暂缺**（现 scripts 仅 `test`——首发前评估是否补 `test` 门；补 = 与 CLI/VSC 门禁对称原则一致） |
| **C-F5** | 核版本号规则 | **= §4（CalVer 三端同制）**——首发号 `0.9.1`（§4.3）；本表不重述（D2） |

**核端非功能**：C-N1 连续不跳空（同 N1/N2）· C-N2 门禁不可绕过（若补 prepublishOnly）· C-N3 凭据不入库（同 §5.5）· C-N4 发布完成判定 = exit 0（npm 面同 F4）。

## 9. 不并项与历史沿革

| 旧档面 | 内容 | 何故不并（去向） |
|---|---|---|
| VSC 源档 §2（F1–F5 判定句的证据列）· §3（N1–N4 度量方式） | VSC 实现坐标 | 时点坐标——随版本演进失真；机制面已并入 §7（只留需求与操作） |
| 核发布机制全文（S2 期口径 / 锁面 / 机检 L1–L3 / 一致性断言推导） | 机制与推导 | 设计面——`CORE-UNIFICATION.md` §2.6.1 / D-C11（本档 §8 只留需求——D2） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/requirements/RELEASE.md` 内容重建入基准层（落点原 = `docs/core/requirements/`）；门禁链补**集成集**环（旧档 F1 未同步）· F4 去实现名（行为陈述）。
- 2026-09-15（**VSC 轮并入 · 批 7**）：新增 **VSC 端通道面**（双市场 V-F1–V-F5 / V-N1–V-N3）——旧 `thincoder-vscode/docs/requirements/RELEASE.md` 原地作参照历史。
- 2026-09-20（**核发布面并入 · 主 agent**——用户 23:06「两端发版」触发实勘 + 23:08 问「核心需要发版吗？」+ 23:14「整合发布计划 + 核心发布纳入 + 核版本号规则参照 CLI/VSC」）：档头产品面补**核**（三发布单元）· §1 发布顺序恒等式（核 → CLI → VSC）· F5 核发布面 · N5 版本一致性三断言 + 断言 D · 核发布面章（结论：核必须发——registry E404 实测）；核版本号规则 = CalVer（与 CLI/VSC 同制——首发 0.9.1）。
- 2026-09-20（**落点迁根 · 主 agent**——用户 23:18）：本档迁 `docs/` 根（流程面·根层）。
- 2026-09-20（**三端合一 · 主 agent**——用户 23:23）：CLI 链设计档并回本档（单档承载 ✗ 无第二发布档）。
- 2026-09-20（**版本号规则升格成章 + 流程章重构 · 主 agent**——用户 23:31「版本号跟发布时间的关系」+ 23:35/23:38「没有清晰明确的表述」）：**§4 版本号规则独立成章**（CalVer 三段定义 + 定号纪律 + 三端现算 + 一致性断言）；**新增 §5「发布流程（端到端）」**——四阶段一步步走（前置 → 发核 → 发 CLI → 发 VSC → 收尾），各端原「操作步骤」并入流程章，各端章只留门禁接线与踩坑（D2 去重）；C-F5 收窄为指针（= §4，不重述）。
