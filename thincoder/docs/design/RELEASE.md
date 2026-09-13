# 发布流程（RELEASE）

> 归属：`thincoder` CLI 发布到 npm 的完整流程（规则基线参考对位档 `RELEASE（VSC 仓）`）。
> 包名：`thincoder`（package.json `name` 字段）。npm 发布者：`xinbo-tech`（已登录，`npm whoami` 验证）。
> 仓库：Gitee `https://gitee.com/shanghai-xinbo/thincoder`（main 分支）+ GitHub 镜像远端 `github`。
> 状态：发布 = 唯一门禁（R7 单轮制已落地）——`npm publish` 的 `prepublishOnly` 自动跑 lint + test:full + test:integration 单轮。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/RELEASE.md`——本档保留设计与测试细节。

## 1. 发布前检查

- [ ] `npm view thincoder version` 记录 registry 最高已发号（待发号必须 = 最高 + 1——见 §4.3）；
- [ ] `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` 真实端点 smoke 通过（花真钱——publish 自动门禁之外，发版前人工跑；2026-08-30 起 env 门控）；
- [ ] `CHANGELOG.md` 已更新新版本条目（Keep a Changelog 格式，中文，Added/Changed/Fixed/Removed 分节）；
- [ ] `package.json` version 已 bump（**发布时才 bump——开发期不预占——见 §4.2**）。

> 不再有手动 `release:check` 步——全量 + 集成集门禁由 `npm publish` 自动执行（见 §2），此处不列。

## 2. 发布 = 唯一门禁（单轮全量制）

`package.json` 的 `prepublishOnly` = `"npm run release:check"`——`scripts/release-check.mjs` 自动跑 **lint（check-syntax）→ 全量测试（test/run-full.mjs，slow 全放行）→ 集成集（test/run-integration.mjs，业务验收场景）合并一键**（实测 2026-09-11：全量 ~16s + 集成集 ~4s）。
摘要输出 + 失败详情自动提取（每个失败块 ≤24 行，最多 12 块；输出无 `failing tests:` 汇总段时回退输出尾 40 行）。门禁不过发布中止——这是有意设计，不要绕过。集成集的语义与场景表见 `TESTING.md` §3–§5。

**发布 = 唯一门禁**：全量 + 集成集只在 `npm publish` 自动跑一次（prepublishOnly 单轮），不再有独立 check 步、发布前不再手动分轮跑。流程 = 直接 `npm publish`（发布点 = 唯一门禁，无单独 check 步）。

**修复迭代纪律**：`npm publish` 失败 → 修复 → **局部重跑**（`node --test --test-name-pattern "<失败名>" <失败文件>`——秒级；集成档同法 `node --test test/integration/<档>`）确认修复 → **`npm publish` 终跑一次**收口。禁止每次失败都全链重跑（release-check 一轮 ~20s）。

### 发布命令

```bash
cd thincoder
# bump：待发号 = registry 最高 + 1（§4.3——本次 = 0.12.60；禁止跳号/预占）
# 手动改 package.json 的 version 字段 + CHANGELOG [Unreleased] 段头改新号
git add package.json CHANGELOG.md
git commit -m "release: vX.Y.Z"          # 历史惯例：release commit 消息格式 "release: v0.12.43"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
# 双远端：本项目有 origin（gitee）+ github 两个 remote，都要推（2026-08-30 实测教训：
# 只推 origin 会漏 github；且本机 GitHub 直连被墙，推送需走代理，见 §5.2）
git -c http.proxy=http://10.2.2.112:3128 push github main
git -c http.proxy=http://10.2.2.112:3128 push github vX.Y.Z

npm publish    # prepublishOnly 自动跑 release-check（lint + test:full + test:integration 单轮）
```

**发布完成判定（F-R7e 裁定固化）**：publish 命令 **exit 0 = 发布完成**——不轮询、不查上线版本。CLI npm 无审核队列，publish 即见；`npm view` 核验保留（即时可见非轮询，见 §3）。此判定只针对 npm 发布本身——ovsx/vsce 的无 TTY 静默 exit 0 陷阱见 §5.3（其失败模式 = exit 0 但什么都没发——PAT 校验不能省，勿把 "exit 0 = 完成" 推广到 ovsx/vsce）。

## 3. 验证

```bash
npm view thincoder version    # 应显示新版本
npm view thincoder time --json  # 发布时间戳确认
```

## 4. 版本号规范（连续性 + CalVer）

### 4.1 根因（2026-09-05 实证）

CHANGELOG 开发期预占版本号（写段即占号）而发布动作没跟上 → 发布时直接发 package.json 当前号 → **npm 实发 0.12.54 → 0.12.58（55/56/57 永缺）**。tag 只在发布时打（缺号处无 tag）。用户裁定："不要跳号，npm/marketplace 对外编号连续不跳空"。

### 4.2 号在发布时定，开发期不预占

开发批 CHANGELOG 记录挂 `[Unreleased]` 段（不编号）；发布 = 唯一定号动作（bump → Unreleased 段头改新号）。

### 4.3 待发号 = registry 已发最高号 + 1

发布前 `npm view thincoder version` 查最高；package.json ≠ 期望号 → 先纠正再走流程（**禁止一次跳多号**）。

### 4.4 缺口不补

npm 0.12.55/56/57 缺口已成（registry 历史不可回溯重写，对应批次内容已并入 58）——**不补发**——规则从下一发起保证零新缺口。

### 4.5 编号体系总览

2026 年内 `0.12.x` 连续递增（把第二段"12"当年度号，不倒退）；2027-01-01 起切 `1.1.0`。规则 1-3 是连续性铁律，本节以下的 CalVer（§4.6）定义号段语义。

### 4.6 CalVer（2026-08-27 用户拍板）

**格式**：`年份段.月份段.月内计数段`，三段。

| 段 | 含义 | 规则 |
|---|---|---|
| 第一段 | 年份 | 2026=0，2027=1，每年 +1 |
| 第二段 | 月份 | 1=1 月 … 12=12 月 |
| 第三段 | 月内发布计数 | **每月从 1 重置**，月内逐次 +1 |

**CLI 切换规则（方案 B）**：保持 `0.12.x` 递增到 2026 年底（第二段"12"是历史乱号，把"12"当年度号，不倒退）；**2027-01-01 起切 `1.1.0`** 走规范（第一段 0→1 是前进，npm 接受）。2026 年内**不**套用"月份段 = 当前月"的映射（否则 0.12→0.8 是倒退，npm 拒绝）。

**硬约束**：版本号必须单调递增，任何切换都不得低于已发布版本（npm/vsce 均拒绝倒退）。切换前先 `npm view thincoder version` 确认当前号。

## 5. 踩坑记录

### 5.1 版本 bump 别用 PowerShell Set-Content -Encoding UTF8（2026-08-27）

Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 **BOM**（`EF BB BF`），污染 package.json 导致 JSON 解析失败、prepublishOnly 崩。改版本号用 JSON.parse → 改字段 → JSON.stringify（无 BOM），或 `-Encoding utf8NoBOM`。判断：发布前 `npm view` 能读到旧版本但 publish 报解析错，先查 package.json 首三字节是否 `EF BB BF`。

### 5.2 GitHub 双远端 + 被墙走代理（2026-08-30）

- **本仓库有两个 remote**：`origin`（gitee.com/shanghai-xinbo/thincoder）+ `github`（github.com/xinbo-tech/thincoder）。**发版要两端都推**（分支 + tag），只推 origin 会漏 github（0.12.51 实测）。
- **本机 GitHub 直连被墙**（`Failed to connect to github.com:443` 超时），ghproxy 只能下载不能 push。可用公司 HTTP 代理：`http://10.2.2.112:3128`。推送时临时带 `-c http.proxy` 即可，不改全局配置：

```bash
git -c http.proxy=http://10.2.2.112:3128 push github main
git -c http.proxy=http://10.2.2.112:3128 push github vX.Y.Z
```

- 发布前检查：若某次发版漏了 github 远端，`git log github/main -1` 对比本地 main 即可发现（main 领先于 github/main 即未推）。

### 5.3 vsce/ovsx（VS Code 端）教训——CLI 不适用，但发布团队须知

以下为 VS Code 端发布（vsce/ovsx）教训，详细见对位档 `RELEASE（VSC 仓）`。CLI 侧只需记住核心结论，勿把它们推广到 npm（npm 无审核队列、无 silent-exit-0）：

- **vsce patch 自动 bump**（2026-08-25）：`vsce publish patch` 会自动再 bump 一次——手动 bump 后执行 `publish patch` 会再跳一号，还自动建 bump commit，tag 与 release commit 错位。**规则：手动 bump + 直接 `vsce publish`（不带 patch/minor/major）**。
- **Open VSX 异步激活**（2026-08-25）：ovsx publish 返回 `🚀 Published` 后，版本处于"已发布未激活"（API 仍显示旧版本）——服务端异步扫描 malware，通过后自动激活，通常几分钟，**不是发布失败**。诊断口诀：报错 "already published, but currently isn't active and not visible" = 扫描进行中，等待即可；真失败会报 Invalid access token 或明确错误。
- **ovsx 无 TTY 静默失败**（2026-08-25）：无 TTY 环境下输出被吞且 exit 0，看起来成功实则什么都没做（与 vsce 的 `'y'` PAT 读取坑同源）。**规则：ovsx 操作必须显式传 `--pat`**（真实 token 从环境变量 `OVSX_PAT` 读，不是 `OVSX_TOKEN`），并事后 API 查询确认，不信任 CLI 的静默 exit 0。
- **marketplace 延迟 + PAT 环境变量**（2026-08-27）：`vsce publish` 报 `already exists` 但 `vsce show` 仍旧版本 = 查询索引缓存延迟（通常已成功）；PAT 放环境变量在无 TTY 子进程可能没继承、静默 exit 0 假装成功——发布前 `npm whoami` / `ovsx verify-pat` 显式验证，拿不准就显式传 token。

## 6. 回滚 / 问题

- **npm 不支持撤版**：发布后发现问题，修复后发补丁版本（如 0.12.44），或 `npm deprecate thincoder@X.Y.Z "message"` 标记废弃；
- **发布失败重试**：npm publish 网络中断后可直接重试（同版本号已存在会报错，说明其实已成功——先 `npm view` 确认）。

## 变更记录

- 2026-09-05：版本号连续性规则（§4）立项（0.12.59 发版 3 轮全量教训）；release-check 合并脚本建（lint + test:full 一键 + 失败详情自动提取）。
- 2026-09-06：**发布单轮制（R7）落地**——prepublishOnly 改调 release-check（lint + test:full 全量单轮）；发布 = 唯一门禁，废"check 再 publish"双保险；失败迭代纪律保留（局部重跑 → publish 终跑一次）；发布完成判定固化（exit 0 = 完成，不轮询不查上线）；VS Code 端对照（vscode:prepublish 全量 + 双源一测）随设计批处理。
- 2026-09-07：本文档随格式债清理批 A 重写为当前态。
- 2026-09-11（TEST-LIFECYCLE 批——CLI 面）：发布门加集成步骤——`release-check.mjs` 顺序 = lint → test:full → **test:integration**（业务验收场景）；§1/§2/发布命令/修复迭代纪律同步（TESTING.md §4.3）。
