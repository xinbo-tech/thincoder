# 发布流程(RELEASE)

> 归属:`thincoder` CLI 发布到 npm 的完整流程(规则基线参考 thincoder-vscode `docs/design/RELEASE.md`)
> 包名:`thincoder`(package.json `name` 字段)
> npm 发布者:`xinbo-tech`(已登录,`npm whoami` 验证)
> 仓库:Gitee `https://gitee.com/shanghai-xinbo/thincoder`(main 分支)

## 1. 发布前检查

- [ ] `npm view thincoder version` 记录 registry 最高已发号（版本号规则核对见 §1.5——待发号必须 = 最高 + 1）
- [ ] `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` 真实端点 smoke 通过(花真钱,publish 自动门禁之外,发版前人工跑;2026-08-30 起 env 门控)
- [ ] `CHANGELOG.md` 已更新新版本条目(Keep a Changelog 格式,中文,Added/Changed/Fixed/Removed 分节)
- [ ] `package.json` version 已 bump（**发布时才 bump——开发期不预占——见 §1.5**）

> **修复迭代纪律（2026-09-05——0.12.59 发版 3 轮全量教训；2026-09-06 R7 起跑在 publish 上）**：`npm publish` 失败 → 修复 → **局部重跑**（`node --test --test-name-pattern "<失败名>" <失败文件>`——秒级）确认修复 → **`npm publish` 终跑一次**收口。禁止每次失败都全量重跑（release-check 一轮 ~90s）。
> **发布 = 唯一门禁（2026-09-06 R7 发布单轮制——设计与记录见下方 R7 段）**：`npm publish` 的 `prepublishOnly` **自动跑 release-check 全量单轮**（lint + test:full 合并，~90s——失败详情自动提取）——门禁由 publish 自动执行，不再有独立 check 步，故上方清单不再列手动 `release:check` 行（全量只在发布时跑一次）。
> **需求登记（2026-09-06——入需求池 R7（原登记笔误 R5——2026-09-06 修正）——设计见下）**：**发布单轮制**——用户质疑"发布时有必要分几轮测吗？一次不够吗？"澄清定案：prepublishOnly 双保险（§4.4——check 全量 + publish 快层两遍）是快层 ~15s 时代的遗留——全量 ~90s 后不值。方向：prepublishOnly 改 lint + test:full（经 release-check 复用失败详情提取——或直接调 release-check），流程改为直接 `npm publish`（发布点 = 唯一门禁，无单独 check 步）；失败迭代纪律（局部重跑 → 终跑一次）保留。同步消解 TESTING §1 Phase 1 待决策项①（口径分裂）。VS Code 端（VSIX 发布）流程对照随设计批处理。

> **R7 发布单轮制设计（2026-09-06 · 需求池 R7——设计层）**：
>
> **状态：已批准（2026-09-06——评审 0🔴 通过（token 8fcffc12…/designId d5ac21a0）——4🟡+1🔵 处置表用户全采纳——修正已落本节（评审修正注））**。
>
> **需求（F-R7）**：
> - **F-R7a**：发布点 = 唯一门禁——`npm publish` 自动跑 **lint + test:full 全量单轮**（prepublishOnly 改调 release-check——失败详情提取既有）。
> - **F-R7b**：废"check 再 publish"双保险——发布前检查清单删手动 `release:check` 行（publish 自动执行）。
> - **F-R7c**：失败迭代纪律保留——`publish` 失败 → 局部重跑确认修复（test-name-pattern 秒级）→ `publish` 终跑一次收口。
> - **F-R7d**：VS Code 端对照（VSIX 双源发布）——`vscode:prepublish` 改 lint + test:full 全量（用户裁定定稿：双源一起发、全量只测一次——见 D-R7d）。
> - **F-R7e（裁定固化——勿再问）**：发布完成判定 = **publish 命令 exit 0 即可——不轮询、不检查上线版本**（VS Code 双市场审核/病毒扫描队列上线滞后是市场的业务——2026-08-31 裁定 + 2026-09-06 重申"只要发布没报错就行了"）。CLI npm 无审核队列 publish 即见，`npm view` 核验保留（即时可见非轮询）。
>
> **设计（D-R7）**：
> - **D-R7a（CLI package.json）**：`prepublishOnly: "npm run release:check"`（release-check.mjs = lint + test:full 合并 + 摘要/失败详情提取——2026-09-05 已建，直接复用——不再双写脚本）。现 `lint && node --test "test/*.test.mjs"` 退役（直 glob 中量口径——run-full 统一入口为准）。
> - **D-R7b（本文件 §1/§2/§4.4）**：§1 检查清单删 release:check 行（注：由 publish 自动跑——清单留 npm view/CHANGELOG/smoke/version 四行）；**§1 L17「prepublishOnly 双保险注」整段改写**（评审修正 #1——原"publish 快层是最后防线/接受 ~2 分钟总开销"随双保险一并废除——新句："publish = 唯一门禁——prepublishOnly 自动跑 release-check 全量单轮——不再有独立 check 步"）；§2 发布命令注释更新（**含版本号刷新："本次 = 0.12.59" → 0.12.60——评审修正 #5**——与 §1.5 现态对齐）；§1 修复迭代纪律句改"publish 失败 → 局部重跑 → publish 终跑"；§4.4 prepublishOnly 双保险注改写为单轮制（发布 = 唯一门禁——全量 ~90s 时代两遍不值——**含 F-R7e 裁定句落点**）。
> - **D-R7b2（AC 残留扫描词扩——评审修正 #1）**：实现后全文扫"先 check 再 publish / 双保险 / 快层是最后防线 / 两遍"——零残留（不只扫单一措辞）。
> - **D-R7c（TESTING.md 口径）**：§1 无 release 口径残留（2026-09-06 复核——已随 Phase 1/release:check 合并消解）——实现时再复核一次，若有残留顺带清理（报告即可）。
> - **D-R7d（VS Code 端——用户裁定定稿 2026-09-06）**：①`vscode:prepublish` 改 `npm run lint && npm run test:full`（全量门禁 ~72s——测试在打包/首发时跑）；②**双源只测一次**（"双源都是一起发的，不必测两次"）——publish-all 流程 = 先 `vsce package` 一次（prepublish 全量仅此 1 次）→ 双源发同一 .vsix（vsce publish -i + ovsx publish <vsix>——已打包文件不再触发第二次测试）；③**发布后零检查**（exit 0 = 完成——不等不查不轮询——publish-all.mjs 头注释已载 2026-08-31 裁定——**裁定落档点（评审修正 #4）：CLI 落本文件改写后的 §4.4 注 + §2 发布命令注释；VS Code 落 thincoder-vscode/docs/design/RELEASE.md §2/§4 勘误 + publish-all.mjs 头注**——不再每次问）；④失败详情可见性：实现批本地 `vsce package` 实测（stdio 直通则无需机制；若详情被吞——VS Code RELEASE.md 加"失败时本地 npm run test:full 复跑"提示行，**不引入新脚本**）；⑤**边界句（评审修正 #2）**："零检查"只针对市场审核/病毒扫描**激活滞后**——§4.3 调用级前置（显式 --pat/发布前 verify-pat）与 ovsx 静默 exit 0 陷阱仍有效（其失败模式 = exit 0 但什么都没发）——勘误落档处一并写明，防后续读者把"exit 0 = 完成"误推广到跳过 PAT 校验。
>
> **验收（AC-R7）**：AC-R7a = ①**值断言（评审修正 #3）**：`scripts.prepublishOnly === "npm run release:check"` 且旧串 `lint && node --test "test/*.test.mjs"` 零残留（交付报告 diff 行）②绿跑：`npm run release:check` 全量通过（门禁内容证明）；AC-R7b = §1 清单/§1 双保险注/L17/§2/§4.4 文案同步（零残留扫描：先 check 再 publish/双保险/快层是最后防线/两遍 + F-R7e 裁定句在位——CLI §4.4 注 + VS Code RELEASE.md §2/§4 双落点）；AC-R7c = 双端全量回归绿 + VS Code 端对照落地（prepublish 全量 + 双源一测 + vsce package 实测报告 + §4.3 边界句在勘误记录）。

### 1.5 版本号连续性规则（2026-09-05 用户裁定——“不要跳号，npm/marketplace 对外编号连续不跳空”）

**根因（2026-09-05 实证）**：CHANGELOG 开发期预占版本号（写段即占号——[0.12.55/56/57] 段在开发期开出）而发布动作没跟上 → 发布时直接发 package.json 当前号 → **npm 实发 0.12.54 → 0.12.58（55/56/57 永缺）**。tag 只在发布时打（缺号处无 tag——一致）。

**规则**：
1. **号在发布时定，开发期不预占**——开发批 CHANGELOG 记录挂 `[Unreleased]` 段（不编号）；发布 = 唯一定号动作（bump → Unreleased 段头改新号）；
2. **待发号 = registry 已发最高号 + 1**——发布前 `npm view thincoder version` 查最高；package.json ≠ 期望号 → 先纠正再走流程（禁止一次跳多号）；
3. **缺口不补**：npm 0.12.55/56/57 缺口已成（registry 历史不可回溯重写——对应批次内容已并入 58）——**不补发**——规则从下一发起保证零新缺口（用户 2026-09-05 确认）；
4. 编号体系：§4.6 CalVer（2026 年内 0.12.x 连续递增 → 2027-01-01 起 1.1.0）。

**当前状态**：registry 最高 = **0.12.59**（package.json 已同步）——下次发布 = **0.12.60**（把 CHANGELOG `[Unreleased]` 段改 `[0.12.60]`）。

## 2. 发布

```bash
cd thincoder

# bump:规则号 = registry 最高 + 1(§1.5——本次 = 0.12.60;禁止跳号/预占)
# 手动改 package.json 的 version 字段 + CHANGELOG [Unreleased] 段头改新号

git add package.json CHANGELOG.md
git commit -m "release: vX.Y.Z"      # 历史惯例:release commit 消息格式 "release: v0.12.43"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z

# 双远端:本项目有 origin(gitee) + github 两个 remote,都要推(2026-08-30 实测教训:
# 只推 origin 会漏 github;且本机 GitHub 直连被墙,推送需走代理,见 §4.8)
git -c http.proxy=http://10.2.2.112:3128 push github main
git -c http.proxy=http://10.2.2.112:3128 push github vX.Y.Z

npm publish                          # prepublishOnly 自动跑 release-check 全量单轮(lint + test:full)——exit 0 = 发布完成(F-R7e:不轮询不查上线;npm view 核验保留,见 §3)
```

## 3. 验证

```bash
npm view thincoder version           # 应显示新版本
npm view thincoder time --json       # 发布时间戳确认
```

## 4. 踩坑记录

### 4.1 vsce 的 patch 自动 bump(2026-08-25,vscode 端教训,CLI 同样适用)

`vsce publish patch` 会**自动再 bump 一次**版本——手动 bump 到 0.1.48 后执行 `publish patch` 实际发布 0.1.49,还自动创建了 bump commit,导致 tag 与 release commit 错位。
**规则:手动 bump + 直接 `vsce publish`(不带 patch/minor/major)**,让版本号完全由人控制。

### 4.2 Open VSX 异步激活(2026-08-25,vscode 端教训)

ovsx publish 返回 `🚀 Published` 后,**版本处于"已发布未激活"状态**(API 仍显示旧版本)。Open VSX 服务端异步扫描 malware,通过后自动激活——通常几分钟,**不是发布失败**。
诊断口诀:报错 "already published, but currently isn't active and not visible" = 扫描进行中,等待即可;真失败会报 Invalid access token 或明确错误。

### 4.3 ovsx 无 TTY 静默失败(2026-08-25)

`ovsx verify-pat` / `publish` 在无 TTY 环境下**输出被吞且 exit 0**——看起来成功实则什么都没做(与 vsce 的 `'y'` PAT 读取坑同源,见 vscode RELEASE.md §1.2b)。
**规则:ovsx 操作必须显式传 `--pat`**(真实 token 从环境变量 `OVSX_PAT` 读,不是 `OVSX_TOKEN`),并用 `execute`(node 直调 ovsx 内部 API)或事后 API 查询确认结果,不信任 CLI 的静默 exit 0。

### 4.4 prepublishOnly = 发布唯一门禁（单轮全量制——2026-09-06 R7）

`npm publish` 自动执行 `prepublishOnly`——**现为 `npm run release:check`**（release-check = lint + test:full 合并一键，~90s，摘要输出 + 失败详情自动提取——2026-09-05 建；R7 起作为发布自动门禁，不再双写脚本）。门禁不过发布中止，这是有意设计，不要绕过——**发布 = 唯一门禁**：全量只在 `npm publish` 自动跑一次（prepublishOnly 单轮），不再有独立 check 步、发布前不再手动分轮跑。publish 失败 → 局部重跑（test-name-pattern，秒级）确认修复 → publish 终跑一次收口（纪律见 §1 修复迭代句）。

**发布完成判定（F-R7e 裁定固化——勿再问）**：publish 命令 **exit 0 = 发布完成**——不轮询、不查上线版本。CLI npm 无审核队列 publish 即见；`npm view` 核验保留（即时可见，非轮询——见 §3）。此判定只针对 npm 发布本身——ovsx/vsce 的无 TTY 静默 exit 0 陷阱见 §4.3（其失败模式 = exit 0 但什么都没发——PAT 校验不能省，勿把 "exit 0 = 完成" 推广到 ovsx/vsce）。

### 4.5 版本 bump 别用 PowerShell Set-Content -Encoding UTF8(2026-08-27)

Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 **BOM**(`EF BB BF`),污染 `package.json` 导致 JSON 解析失败、`prepublishOnly` 崩。改版本号用 JSON.parse→改字段→JSON.stringify(无 BOM),或 `-Encoding utf8NoBOM`。判断:发布前 `npm view` 能读到旧版本但 publish 报解析错,先查 package.json 首三字节是否 `EF BB BF`。

### 4.6 版本号规范(CalVer,2026-08-27 用户拍板)

**格式**:`年份段.月份段.月内计数段`,三段。

| 段 | 含义 | 规则 |
|---|---|---|
| 第一段 | 年份 | 2026=0,2027=1,每年 +1 |
| 第二段 | 月份 | 1=1 月 … 12=12 月 |
| 第三段 | 月内发布计数 | **每月从 1 重置**,月内逐次 +1 |

**CLI 切换规则(方案 B)**:现状 0.12.46——第二段"12"是历史乱号。**保持 0.12.x 递增到 2026 年底**(把"12"当年度号,不倒退),**2027-01-01 起切 `1.1.0`** 走规范(第一段 0→1 是前进,npm 接受)。2026 年内**不**套用"月份段=当前月"的映射(否则 0.12→0.8 是倒退,npm 拒绝)。

**硬约束**:版本号必须单调递增,任何切换都不得低于已发布版本(npm/vsce 均拒绝倒退)。切换前先 `npm view thincoder version` 确认当前号。

**判据对照**(本端现状):`0.12.46` = 年份段 0(2026)、月份段 12(乱号,实际已到年底)、计数段 46(历史累计,非月内计数)——从 2027-01 起才真正套用规范,届时月内计数从 1 起。

### 4.7 marketplace 延迟 + PAT 环境变量(2026-08-27,与 vscode 端同源)

- **marketplace 延迟**:`vsce publish` 报 `already exists` 但 `vsce show` 仍显示旧版本——通常是已成功、查询索引缓存延迟。先 `vsce show` 确认新版本是否已进 `versions` 列表,别急着重试(重试会撞"已存在")。
- **PAT 在环境变量里会忘**:无 TTY 环境(agent 子进程)环境变量可能没继承、CLI 静默 exit 0 假装成功。发布前先 `npm whoami` / `ovsx verify-pat` 显式验证,拿不准就显式传 token。
### 4.8 GitHub 双远端 + 被墙走代理(2026-08-30)

- **本仓库有两个 remote**:`origin`(gitee.com/shanghai-xinbo/thincoder)+ `github`(github.com/xinbo-tech/thincoder)。**发版要两端都推**(分支 + tag),只推 origin 会漏 github(0.12.51 实测)。
- **本机 GitHub 直连被墙**(`Failed to connect to github.com:443` 超时),ghproxy 只能下载不能 push。可用公司 HTTP 代理:`http://10.2.2.112:3128`。推送时临时带 `-c http.proxy` 即可,不改全局配置:

```bash
git -c http.proxy=http://10.2.2.112:3128 push github main
git -c http.proxy=http://10.2.2.112:3128 push github vX.Y.Z
```

- 发布前检查:若某次发版漏了 github 远端,`git log github/main -1` 对比本地 main 即可发现(main 领先于 github/main 即未推)。

## 5. 回滚 / 问题

- **npm 不支持撤版**:发布后发现问题,修复后发补丁版本(如 0.12.44),或 `npm deprecate thincoder@X.Y.Z "message"` 标记废弃
- **发布失败重试**:npm publish 网络中断后可直接重试(同版本号已存在会报错,说明其实已成功——先 `npm view` 确认)
