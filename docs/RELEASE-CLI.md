# 发布流程（RELEASE）· CLI 链 · 设计

> 板块 = **发布流程**——`thincoder` CLI 发布到 npm 的链路设计与操作细节（**总发布计划在 `docs/RELEASE.md`**——本档 = CLI 链细目 ✗ 落点裁定 2026-09-20 用户：总计划落 `docs/` 根 ✗ 本档同批自 `docs/cli/design/` 同迁入根 ✗ 内容零改）。
> **总计划档 = `docs/RELEASE.md`**——三发布单元（核 / CLI / VSC）· 发布顺序恒等式（核先发 ✗）· 核发布面需求与版本号规则均住彼 ✗ 本档只留 CLI 链细目。
> **三发布单元与顺序**：核（`@thincoder/core`）→ CLI → VSC（核先发硬约束——`CORE-UNIFICATION.md` §2.6；核发布面需求 = `docs/RELEASE.md` §2 F5 / §6；核发布机制 = `CORE-UNIFICATION.md` §2.6.1——本档不重述）。
> 对位档 = `thincoder-vscode/docs/_archive/design/RELEASE.md`（**已归档**——VSC 产品树设计档降格后整体入 `_archive/design/`，参照历史、保留 ≠ 维护；vsix / Marketplace / Open VSX 链的踩坑与门禁归该档。as-of 2026-09-20 实核）。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/design/RELEASE.md` 内容重建入基准层 ✗ 原址 = `docs/cli/design/RELEASE.md`；2026-09-20 迁 `docs/` 根并更名 `RELEASE-CLI.md`）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与唯一门禁

- 包名 = `thincoder`（`thincoder-cli/package.json:2`）；仓库 = 合并仓的 CLI 子目录 `thincoder-cli/`（原 CLI 仓原地下移一层）。
- **发布 = 唯一门禁**：`npm publish` 触发 `prepublishOnly`，一次即跑完整校验链，不过即中止。**不再有**独立的发布前手动 check 步。
- 门禁不过 ⇒ 发布中止——这是**有意设计**，不得绕过。

## 2. 发布链（两步一链 · 实核）

| 步 | 命令 / 落点 | 说明 |
|---|---|---|
| 1 · lint | `thincoder-cli/scripts/check-syntax.mjs` | 语法检查（`node --check` 系） |
| 2 · 全量测试 | `thincoder-cli/test/run.mjs` | 全量（单元 + 集成 + slow 全跑——单入口；`docs/core/design/TESTING.md` §10） |

**接线**：`thincoder-cli/package.json`（`prepublishOnly` → `npm run release:check`）→（`release:check` → `node scripts/release-check.mjs`）→ 顺序编排见 `thincoder-cli/scripts/release-check.mjs:66-74`（lint）· `:76-78`（全量测试）。

**输出形态**：脚本捕获完整输出，只打印摘要行（`ℹ tests / pass / fail / skipped / duration`）；失败时**自动提取失败详情段**（`✖` 行 + 每失败块 ≤24 行、最多 12 块；输出无汇总段时回退打印输出尾 40 行）。失败详情永不静默丢。

**修复迭代纪律**：`npm publish` 失败 → 修复 → **局部重跑**（`node --test --test-name-pattern "<失败名>" <失败文件>`——秒级；集成档同法）确认修复 → **`npm publish` 终跑一次**收口。禁止每次失败都全链重跑。

**发布完成判定**：publish 命令 **exit 0 = 发布完成**——不轮询、不查上线版本（npm 无审核队列，publish 即见）。此判定**只针对 npm**；ovsx / vsce 的无 TTY 静默 exit 0 陷阱见对位档，勿把本判定推广过去。

## 3. 版本号规范（连续性 + CalVer）

### 3.1 连续性铁律（2026-09-05 实证）

CHANGELOG 开发期预占版本号而发布动作没跟上，会造成**实发跳号**（0.12.54 → 0.12.58，55/56/57 永缺；tag 只在发布时打，缺号处无 tag）。用户裁定：**对外编号连续不跳空**。

- **号在发布时定，开发期不预占**：开发批 CHANGELOG 记录挂 `[Unreleased]` 段（不编号）；发布 = 唯一定号动作（bump → Unreleased 段头改新号）。
- **待发号 = registry 已发最高号 + 1**：发布前查 `npm view thincoder version`；`package.json` ≠ 期望号 → 先纠正再走流程（**禁止一次跳多号**）。
- **缺口不补**：已成缺口（registry 历史不可回溯重写）不补发；规则从下一发起保证零新缺口。

### 3.2 CalVer（三段：年份段 / 月份段 / 月内计数段）

| 段 | 含义 | 规则 |
|---|---|---|
| 第一段 | 年份 | 2026 = 0，2027 = 1，每年 +1 |
| 第二段 | 月份 | 1 = 1 月 … 12 = 12 月 |
| 第三段 | 月内发布计数 | **每月从 1 重置**，月内逐次 +1 |

**CLI 切换规则（方案 B）**：保持 `0.12.x` 递增到 2026 年底（第二段「12」是历史乱号，把 12 当年度号，不倒退）；**2027-01-01 起切 `1.1.0`** 走规范（第一段 0 → 1 是前进，npm 接受）。2026 年内**不**套用「月份段 = 当前月」映射（否则是倒退，npm 拒绝）。

**硬约束**：版本号必须单调递增；任何切换都不得低于已发布版本（npm / vsce 均拒绝倒退）。切换前先 `npm view thincoder version` 确认当前号。

## 4. 操作步骤

发布前检查：

- `npm view thincoder version` 记录 registry 最高已发号（待发号 = 最高 + 1）；
- `CHANGELOG.md` 已更新新版本条目（Keep a Changelog 格式，中文，Added / Changed / Fixed / Removed 分节）；
- `package.json` version 已 bump（**发布时才 bump**——开发期不预占）；
- 真实端点 smoke 通过（`THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs`——花真钱，在 publish 自动门禁之外，发版前人工跑）。

发布命令：

```bash
cd thincoder-cli
# bump：待发号 = registry 最高 + 1（禁止跳号 / 预占）
# 手动改 package.json 的 version 字段 + CHANGELOG [Unreleased] 段头改新号
git add package.json CHANGELOG.md
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
# 双远端：origin（gitee）+ github 两个 remote 都要推（2026-08-30 实测教训：只推 origin 会漏 github）
git -c http.proxy=http://10.2.2.112:3128 push github main
git -c http.proxy=http://10.2.2.112:3128 push github vX.Y.Z

npm publish    # prepublishOnly 自动跑 lint → npm test（全量——单入口）
```

## 5. 验证

```bash
npm view thincoder version        # 应显示新版本
npm view thincoder time --json    # 发布时间戳确认
```

## 6. 踩坑记录

### 6.1 版本 bump 别用 PowerShell `Set-Content -Encoding UTF8`

Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 **BOM**，污染 `package.json` 导致 JSON 解析失败、`prepublishOnly` 崩。改版本号用 `JSON.parse` → 改字段 → `JSON.stringify`（无 BOM），或用 `-Encoding utf8NoBOM`。判断：发布前 `npm view` 能读到旧版本但 publish 报解析错，先查 `package.json` 首三字节是否 `EF BB BF`。

### 6.2 GitHub 双远端 + 被墙走代理

- 合并仓有两个 remote：`origin`（gitee）+ `github`。**发版要两端都推**（分支 + tag）——只推 origin 会漏 github。
- 本机 GitHub 直连被墙；ghproxy 只能下载不能 push。可用公司 HTTP 代理 `10.2.2.112:3128`，推送时临时带 `-c http.proxy` 即可（不改全局配置）。
- 发布前检查：若某次发版漏了 github 远端，`git log github/main -1` 对比本地 main 即可发现。

### 6.3 VS Code 端发布教训（对位档，CLI 不适用）

vsce / ovsx 的坑（`vsce publish patch` 自动再 bump、Open VSX 异步激活、ovsx 无 TTY 静默 exit 0 等）归 `thincoder-vscode/docs/_archive/design/RELEASE.md`（**已归档**——参照历史、保留 ≠ 维护；as-of 2026-09-20 实核）。CLI 侧只需记住：**npm 无审核队列、无 silent-exit-0**——勿把 vsce / ovsx 的失败模式推广到 npm。

## 7. 回滚 / 问题

- **npm 不支持撤版**：发布后发现问题 → 修复后发补丁版本，或 `npm deprecate thincoder@X.Y.Z "message"` 标记废弃；
- **发布失败重试**：网络中断后可直接重试（同版本号已存在会报错——说明其实已成功，先 `npm view` 确认）。

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/RELEASE.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档档头状态行 | 「发布 = 唯一门禁（R7 单轮制已落地）」时点状态 | 批次语境——现行态已入 §1–§2 |
| 旧档变更记录 | 逐批流水 | 历史叙述——本档自有变更记录 |
| 旧档 §4.1 / §4.4 的根因叙述 | 具体跳号事故（0.12.54 → 0.12.58）的时点细节 | 规则本体已入 §3.1；事故编号属历史证据 |
| 旧档发布命令注中的具体待发号（如「本次 = 0.12.60」） | 时点号值 | 号值随时点失效——§4 只留推导规则 |
| 旧档「npm 发布者：`xinbo-tech`」 | 账号身份值 | 身份值不落档——从 `npm whoami` 现取 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| VS Code 端发布教训全文（旧档 §5.3） | vsce / ovsx 逐条教训 | 对位档 = `thincoder-vscode/docs/_archive/design/RELEASE.md`（**已归档**——参照历史、保留 ≠ 维护）——本档只留一句边界（§6.3） |
| 门禁脚本内部实现细节 | 输出摘要 / 失败块提取算法 | 实现面——落点 `thincoder-cli/scripts/release-check.mjs`（本档只留行为契约） |

## 变更记录

- 2026-09-20（**核发布面并入 · 主 agent**——用户 23:14「整合 CLI/VSC 发布计划文件 + 把核心发布加进去」）：档头补**三发布单元与顺序**（核 → CLI → VSC · 核先发硬约束 `CORE-UNIFICATION.md` §2.6）；核发布面需求 = 需求档 §2 F5 / §6，机制 = §2.6.1——本档不重述（D2）。CLI 链零改（本档口径不变）。
- 2026-09-20（**一致性同步批 · 设计评审修正轮 1 · eng-designer**——评审 id=13 发现 #7 / #12）：
  ① 补本轮变更条（D7）——§2 两行死入口名（`run-full.mjs` / `run-integration.mjs` → 单入口 `thincoder-cli/test/run.mjs`）与标题「三步一链」→「两步一链」收正 = 本批条目 #116 落地（同族发现 F-4 · 就地修）。变更记录 = **时点记录面**：2026-09-15 建档条的「三环」叙辞为该轮谱系，正文已按 v2 单入口收正（§2 · §4）。
  ② 三处「VSC 侧未迁」指针收正（§2 对位档 · §6.3 · §8.2）：原址 `thincoder-vscode/docs/design/RELEASE.md` 已不在盘（该产品树设计档整体入 `_archive/design/`）⇒ 改指归档址 + 标 as-of 2026-09-20——与本批 `docs/core/design/ARCHITECTURE.md` 同判据。

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/design/RELEASE.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/`（P2：npm 发布链结构性只属 CLI；P5 冲突序）；**档头注明配对需求档位置**（需求档判统一面——层归属不对称已明写）；
  ② §2 门禁链按实核收正（三环：lint → 全量 → **集成集**——旧档 §2 未含集成环）；③ 坐标改现状路径；④ 操作步骤 / 踩坑 / 回滚为现行态；⑤ §8 新增不并项与历史沿革。
