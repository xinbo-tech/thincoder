# 发布流程(RELEASE)

> 归属:`thincoder-vscode` 发布到 VS Code Marketplace 的完整流程
> 发布者 ID:`xinbo-tech`(package.json `publisher` 字段,必须一致)
> 工具:`@vscode/vsce`(devDependencies 已有,零全局安装)
> 首次发布:2026-08-13 已发布 `0.1.0` 到 **VS Code Marketplace + Open VSX** 两边(Owner: Bo Wang;发布执行人: li.wei)

## 1. 一次性准备

### 1.1 注册发布者(已完成)

- 发布者 `xinbo-tech` 已由同事用机构身份创建(https://marketplace.visualstudio.com/manage/createpublisher )
- 对应 Azure DevOps 组织:`https://dev.azure.com/xinbo-tech`

### 1.1b 机构发布:加入发布者成员(关键,先做)

发布者是机构账号创建的,但**发布动作用的是你自己的账号**。你的微软账号必须先被加入发布者成员并授予发布权限,否则发布会报 `403 Forbidden`:

1. 请创建者(同事)登录 https://marketplace.visualstudio.com/manage/publishers/xinbo-tech
2. 进入 Members / Permissions,添加你的微软账号,授予 **Contributor** 权限(能管理扩展/发布)
   - 旧权限模型:在 https://dev.azure.com/xinbo-tech 组织设置里把你的账号加为成员
3. 你用**自己的微软账号**登录 https://marketplace.visualstudio.com/manage ,确认能看到 `xinbo-tech` 发布者

### 1.2 创建 PAT(Personal Access Token)

- 地址:https://dev.azure.com/xinbo-tech/_usersSettings/tokens (用你自己的账号登录)
- Organization:**指定 `xinbo-tech` 这个具体组织 —— 不要选 "All accessible organizations"**(全局 PAT 自 2026-12-01 起停止支持)
- Scope:Marketplace → **Acquire** + **Manage**(新版 publisher 权限模型为 Marketplace → **Publish**)
- 有效期:90 天;过期只影响登录,重新 `vsce login` 即可

### 1.2b 验证 PAT 权限(强烈建议先跑)

```bash
cd thincoder-vscode
npx @vscode/vsce verify-pat xinbo-tech --pat <你的PAT>
# 或:set VSCE_PAT=<你的PAT> 之后直接跑 verify-pat(不需要 --pat)
# 成功输出:"The Personal Access Token verification succeeded"
```

⚠️ **必须显式传 `--pat`(或设 `VSCE_PAT` 环境变量)**。在无 TTY 的环境(CI/脚本/本 agent 的 bash 工具)里,vsce 的交互式读 PAT 会直接返回字符串 `'y'`(util.js:`!process.stdout.isTTY → resolve('y')`),导致误报 TF400813 匿名用户错误 —— 2026-08-13 实测踩坑。

诊断端点(verify-pat 实际调用的):`https://marketplace.visualstudio.com/_apis/securityroles/scopes/gallery.publisher/roleassignments/resources/xinbo-tech?api-version=5.0-preview.1`
Header:`Authorization: Basic base64("OAuth:" + PAT)`。返回 200 且 value 里有你的账号 = 权限已就绪。

| 报错 | 含义 | 处理 |
|------|------|------|
| `401` | PAT 无效/过期 | 重建 PAT |
| `403` / `TF400813`(用真 PAT 打上面端点也失败) | 账号不在发布者权限列表 | 回到 §1.1b,让 Owner 在 marketplace 发布者 Permissions 里加你(角色 Contributor 及以上) |
| `TF400813` + anonymous GUID(非交互环境) | vsce 把 PAT 读成了 `'y'` | 用 `--pat` / `VSCE_PAT` 显式传 |

### 1.3 登录 vsce(可选;凭据存入 Windows 凭据管理器)

```bash
cd thincoder-vscode
npx @vscode/vsce login xinbo-tech
# 粘贴 PAT(注意:login 命令没有 --pat 选项,只能在交互终端里做)
```

非交互环境跳过 login 即可 —— `publish` 直接带 `--pat`(见 §3),不依赖登录态。

## 2. 发布前检查

- [ ] `npm test` 全绿
- [ ] `npm run lint` 无错误
- [ ] `CHANGELOG.md` 已更新(市场页 Changelog 标签内容来源)
- [ ] 版本号已递增 —— 同一版本号**不可重复发布**；**连续性核对见 §5.2 执行注（月切换——9 月首发 = `0.9.1`）**
- [ ] 扩展改动已实际跑过(项目纪律:没有「写了没跑」的代码)
- [ ] **双源发布已计划**(2026-08-29 漏发事故):`vsce publish` 只进微软 Marketplace,**Cursor/VSCodium/Windsurf 用户连的是 Open VSX**——每次发版必须两个 registry 都发(见 §3 与 §5b),缺一即未完成

## 3. 发布

```bash
cd thincoder-vscode

# 交互终端(已 vsce login):
npm run publish

# 非交互/CI(无需 login,直接带 PAT;也可设 VSCE_PAT 环境变量代替 --pat):
npx @vscode/vsce publish --pat <你的PAT>

# 之后按语义化递增(同样可加 --pat):
npx @vscode/vsce publish patch   # 0.1.0 → 0.1.1
npx @vscode/vsce publish minor   # 0.1.1 → 0.2.0
npx @vscode/vsce publish major   # 0.2.0 → 1.0.0
```

`vsce publish` 自动执行:`vscode:prepublish`(lint + test，check-syntax)→ 打包 → 上传。
首次发布会经过市场验证扫描(通常几分钟),通过后即可搜索 "ThinCoder",安装 ID 为 `xinbo-tech.thincoder-vscode`。
**发完这里只是完成了一半**——必须继续 §5b 的 `ovsx publish`(同一 vsix),两个 registry 都成功才算发布完成(2026-08-29 0.8.4 漏发 Open VSX,Cursor 用户滞留旧版)。

**推荐方式(2026-08-29 机械化,1be4bcf)**:`npm run publish:all` —— 一条命令完成双源发布（不含轮询确认——完成判定见下裁定）；`--skip-marketplace` / `--skip-openvsx` 可显式跳过单源(两个都跳则中止)。凭据走 env:`VSCE_PAT` + `OVSX_PAT`。

> **2026-08-31 用户裁定——轮询确认已废止**：Marketplace 与 Open VSX 的新版本都要经审核/病毒扫描队列，上线天然滞后数分钟到更久，**不值得在线等**。发布完成的判定 = **publish 命令本身正确返回**（exit 0、`DONE Published`）；审核队列是平台侧事务，随时间自然消化，无需当场确认。`publish:all` 的 LIVE 轮询随之退役——直接分别跑 `vsce publish` 与 `ovsx publish` 即可，两个都正确返回 = 发布完成。历史教训保留价值：open-vsx 报 "already published" 时先查 API——上一条命令可能**已成功**（本版 0.8.7 实例：60s 超时的 publish 实际已把包发上去，重复 publish 报 already published，API 查询确认 0.8.7 已生效）。

## 4. 本地验证(不发布)

```bash
npm run package            # 产物 thincoder-vscode-<version>.vsix
code --install-extension thincoder-vscode-0.1.0.vsix   # 本地安装验证
```

`.vscodeignore` 已排除:`.vscode/`、`test/`、`docs/`、`node_modules/`、`*.vsix`、锁文件、配置等（eslint 全套 2026-09-02 §10.2 删除）。

## 5. 回滚 / 问题

- **回滚版本**:vsce 不支持撤销已发布版本。修正后发布补丁版本(如 0.1.1),或联系 Marketplace 支持下架
- **登录失效**:`npx @vscode/vsce ls-publishers` 验证当前登录状态;失效则重新执行 §1.3

### 5.1 踩坑记录(2026-08-27 补)

- **Marketplace 延迟(已知,每次发布都会遇到)**:`vsce publish` 报 `already exists` 但 `vsce show` 仍显示旧版本 —— **通常是发布其实已成功、市场查询索引有缓存延迟**,不是失败。先 `vsce show xinbo-tech.thincoder-vscode --json` 确认新版本是否在 `versions` 列表里(往往过几分钟就刷出);真失败会报 `Invalid access token` 或明确错误,而不是 `already exists`。
- **PAT 在环境变量里(会忘)**:发布用的 PAT 常存于环境变量(`VSCE_PAT` / `OVSX_PAT`),但无 TTY 环境(如 agent 子进程)下环境变量可能没继承或 CLI 静默 exit 0 假装成功。**发布前先验证**:`npx @vscode/vsce ls-publishers`(marketplace)、`npx ovsx verify-pat xinbo-tech --pat $env:OVSX_PAT`(open-vsx);拿不准就显式 `--pat` 传。
- **版本 bump 别用 PowerShell `Set-Content -Encoding UTF8`**:Windows PowerShell 5.1 的 `-Encoding UTF8` 会给文件写入 BOM(`EF BB BF`),导致 JSON 解析失败、`prepublish` 测试崩。改 `package.json` 用 JSON.parse→改字段→JSON.stringify(无 BOM),或用 `-Encoding utf8NoBOM`。
- **两端门禁要对称**:`vscode:prepublish` 是最后一道门,必须同时跑 `lint && test`(历史上一端只 lint、一端只 test,导致对方缺的那道门漏拦)。已统一为 `npm run lint && npm test`。

### 5.2 版本号规范(CalVer,2026-08-27 用户拍板)

**格式**:`年份段.月份段.月内计数段`,三段。

| 段 | 含义 | 规则 |
|---|---|---|
| 第一段 | 年份 | 2026=0,2027=1,每年 +1 |
| 第二段 | 月份 | 1=1 月 … 12=12 月 |
| 第三段 | 月内发布计数 | **每月从 1 重置**,月内逐次 +1 |

**VS Code 切换规则(方案 B)**:现状 0.1.52——第二段"1"是乱号。**从下个版本起直接套用规范**:2026-08 的下个版本 = `0.8.1`(年份段 0、月份段 8、月内计数重置为 1),之后月内递增 0.8.2、0.8.3…,2027-01 起 `1.1.0`。0.1→0.8 是前进,vsce 接受。

**硬约束**:版本号必须单调递增,任何切换都不得低于已发布版本(vsce/ovsx 均拒绝倒退)。切换前先 `npx vsce show xinbo-tech.thincoder-vscode --json` 确认当前号。

**判据对照**(本端现状):`0.1.52` = 年份段 0(2026)、月份段 1(乱号)、计数段 52(历史累计)——**下个版本直接改为 `0.8.1`**(0.1→0.8 前进,合法),之后严格走规范。

**执行注（2026-09-05 用户裁定——“对外编号连续不跳空，不要跳号”）**：
1. **号在发布时定，开发期不预占**——开发批 CHANGELOG 记录挂 `[Unreleased]` 段（不编号）；发布 = 唯一定号动作（bump → Unreleased 段头改新号）；
2. **月切换硬规则**：新月份第一次发布 = `0.<当月>.1`（月内续发 +1——计数每月重置，CalVer 语义）——发布前先查当前月；
3. **缺口/越月号不补**：0.8.11 系 9 月预占的越月号作废（9 月内容归 `0.9.1`——2026-09-05 实证：CHANGELOG 预占 [0.8.11] 段于 9-04 开出——违反月切换——作废为 Unreleased）；双源（Marketplace/Open VSX）同一 vsix 版本天然一致——不另列；
4. 发布前核对：查双源当前最高版 + 当前月 → 期望号 = `0.<月>.<月内序号>`；package.json ≠ 期望号 → 先纠正再 `publish:all`。

**当前状态**：双源最高 = **0.8.10**（package.json 已同步）——下次发布 = **0.9.1**（把 CHANGELOG `[Unreleased]` 段改 `[0.9.1]`——段头再不带日期乱号）。

## 5b. Open VSX 发布(Cursor / VSCodium / Windsurf 用户可见)

> 微软 Marketplace 与 Open VSX 是两个独立注册表。微软的服务条款禁止非官方 VS Code 衍生版使用其市场,Cursor 等 fork 的扩展面板连的是 **Open VSX**(open-vsx.org)。要让 ThinCoder 在 Cursor 里被搜到,必须两边都发。2026-08-13 已发布 0.1.0 到两边。

### 一次性准备

1. 用 GitHub 账号登录 https://open-vsx.org
2. claim namespace `xinbo-tech`(https://open-vsx.org/user-settings/namespaces;已被占用则换名,但 vsix 的 `publisher` 字段只有一个 —— 两市场最好同名)
3. 生成 Access Token:https://open-vsx.org/user-settings/tokens

### 发布

**凭据环境变量（权威名）**：`VSCE_PAT`（Marketplace）/ `OVSX_PAT`（Open VSX，格式 `ovsxat_*`）。两变量均已在本机环境配置；CLI 用法 `npx @vscode/vsce publish` / `npx ovsx publish --pat %OVSX_PAT%`（vsce 也可不传 --pat 直接读 VSCE_PAT）。**没有别的别名**——2026-08-31 实测曾误用 `%OPEN_VSX_PAT%` 报 Invalid access token；正确名以本节为准。

```bash
cd thincoder-vscode

# 验证 token 对命名空间的发布权限:
npx ovsx verify-pat xinbo-tech --pat %OVSX_PAT%
# 成功输出:🚀 PAT valid to publish at xinbo-tech

# 发布(ovsx 已加入 devDependencies):
npx ovsx publish --pat %OVSX_PAT%          # 现场打包并发布当前版本
npx ovsx publish thincoder-vscode-0.1.0.vsix --pat %OVSX_PAT%   # 直接发已有 vsix
```

- 发布后可查:https://open-vsx.org/extension/xinbo-tech/thincoder-vscode (API:`https://open-vsx.org/api/xinbo-tech/thincoder-vscode`,新版本/搜索索引可能延迟数分钟)
- `publishedBy` 是发布者的 GitHub 账号(实测:eprom2006),与 marketplace 的 Azure DevOps 身份无关
- **发布后必须回查 API 确认 `version` 已翻转**~~（2026-08-29 教训:0.8.4 首次 `ovsx publish` 输出 🚀 但版本进入 inactive 队列——API 仍返回旧版、新版本端点 404,属静默假成功)。轮询 `GET /api/xinbo-tech/thincoder-vscode` 直到 `version` 变为刚发的版本;此时重复 publish 会明确报 "already published, but currently isn't active",只能等队列消化,不可误判为成功后不管~~ **2026-08-31 用户裁定：不再要求发布后回查/轮询**——新版本经审核队列上线是常态（数分钟到更久），publish 正确返回即发布完成，API 翻转交给时间。回查仅在 publish 报错需要诊断时做一次（如区分 "already published" 是重复发还是上条已成功）。
- Cursor 用户兜底:任何 vsix 都能在 Cursor 里 "Install from VSIX" 手动安装

## 6. 发布者职责

- 发布是外发操作 —— 每次发布前确认 CHANGELOG、版本号、README 一致
- package.json 的 `publisher`、`repository`、`homepage` 保持准确,市场页直接展示
- **双远端 push(2026-08-30 实测)**:仓库有 `origin`(gitee)+ `github`(github.com/xinbo-tech/thincoder-vscode)两个 remote,**发布 commit + tag 两端都要推**,只推 origin 会漏 github。本机 GitHub 直连被墙时走代理:

```bash
git -c http.proxy=http://10.2.2.112:3128 push github master
git -c http.proxy=http://10.2.2.112:3128 push github v0.8.6
```

- **发布后双源确认(轮询版,首选 `npm run publish:all`)**:~~marketplace + Open VSX 各自 `version` 已翻转才算完成;open-vsx 报 "already published, but currently isn't active" = 在扫描队列,不可误判为成功。~~ **2026-08-31 用户裁定废止轮询**——发布判定 = 两条 publish 命令正确返回(exit 0);两市场审核各有队列,不在线等。仅当 publish 报错（如 Invalid access token）才需要处理；报 "already published" 先查 API 再判断（可能是上一条命令实际已成功的信号，§3 末尾 0.8.7 实例）。
