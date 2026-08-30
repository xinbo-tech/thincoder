# 发布流程(RELEASE)

> 归属:`thincoder` CLI 发布到 npm 的完整流程(规则基线参考 thincoder-vscode `docs/design/RELEASE.md`)
> 包名:`thincoder`(package.json `name` 字段)
> npm 发布者:`xinbo-tech`(已登录,`npm whoami` 验证)
> 仓库:Gitee `https://gitee.com/shanghai-xinbo/thincoder`(main 分支)

## 1. 发布前检查

- [ ] `npm test` 快层全绿(30 个 slow 测试自动 skip;`test/slow.mjs` 门控,2026-08-30)
- [ ] `npm run test:full` 全量全绿(slow 全放行;发版必跑,快层 skip 不代表通过)
- [ ] `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` 真实端点 smoke 通过(花真钱,双层之外,发版前人工跑;2026-08-30 起 env 门控)
- [ ] `npm run lint` 0 error(warning 允许)
- [ ] `CHANGELOG.md` 已更新新版本条目(Keep a Changelog 格式,中文,Added/Changed/Fixed/Removed 分节)
- [ ] `package.json` version 已 bump

## 2. 发布

```bash
cd thincoder

# bump(patch/minor 自行判断;本次改动含新功能用 minor,纯修复用 patch)
# 手动改 package.json 的 version 字段

git add package.json CHANGELOG.md
git commit -m "release: vX.Y.Z"      # 历史惯例:release commit 消息格式 "release: v0.12.43"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z

# 双远端:本项目有 origin(gitee) + github 两个 remote,都要推(2026-08-30 实测教训:
# 只推 origin 会漏 github;且本机 GitHub 直连被墙,推送需走代理,见 §4.8)
git -c http.proxy=http://10.2.2.112:3128 push github main
git -c http.proxy=http://10.2.2.112:3128 push github vX.Y.Z

npm publish                          # prepublishOnly 自动跑全套测试
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

### 4.4 npm prepublishOnly 是最后一道门

`npm publish` 自动执行 `prepublishOnly`——**现为 `lint && test` 双门禁**(2026-08-27 起;此前只跑 test,lint 错误漏拦),两者不过发布中止,这是有意设计,不要绕过。

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
