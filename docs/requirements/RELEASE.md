# 发布流程（RELEASE）— 需求

> 板块：发布流程（VS Code Marketplace + Open VSX 双源发布）。需求层文档（`docs/requirements/`）。
> 定位：本仓发布流程的**需求层登记**——门禁 / 定号 / 双源 / 完成判定；操作步骤与踩坑 = `docs/design/RELEASE.md`（202 行，操作权威）。
> 对位注记：与对端同名需求档 `RELEASE（CLI 仓·需求）`**语义同源**（发布 = 唯一门禁 / 号在发布时定 / 门禁不可绕过）；发布通道各端独立（本端 = 双市场，对端 = npm）。
> 状态：**现行**。

## 1. 总体需求

发布动作必须是**唯一门禁**：一次触发即执行全量校验，不过即中止。对外版本号必须**连续不跳号**、单调递增；
双市场（VS Code Marketplace / Open VSX）发同一构建产物。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证——证据均为本仓实测） |
|---|---|---|
| F1 | 发布 = 唯一门禁 | `vscode:prepublish` = `npm run lint && npm run doc:check && npm run test:full && npm run test:integration`（`package.json:114`）——`vsce package` / 无参 `vsce publish` 自动执行；无独立预跑步（`docs/design/RELEASE.md` §2 / §3） |
| F2 | 双源发布一条命令 | `npm run publish:all`（`package.json:118` → `scripts/publish-all.mjs`，106 行）——一次打包、双源发同一 .vsix、全量只测一次；`--skip-marketplace` / `--skip-openvsx` 显式单源 |
| F3 | 号在发布时定 | 开发期 CHANGELOG 挂 `[Unreleased]`（不编号）；发布 = 唯一定号动作；CalVer `0.<月>.<月内序号>`、月内计数重置（`docs/design/RELEASE.md` §5.2）——现态 `[0.9.1]` 已定号（`CHANGELOG.md:8`） |
| F4 | 发布完成判定 | publish 命令正确返回（exit 0）= 发布完成——不轮询、不检查上线版本（审核队列 = 平台侧事务）；边界 = 发布前 PAT 校验照做（显式 `--pat` / `VSCE_PAT` + `OVSX_PAT`） |
| F5 | 凭据不入库 | PAT 只走环境变量 / 显式传参；仓库内零凭据（源码与发布产物同查） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| N1 | 编号连续不跳空 | 发布前核对双源最高号 + 当前月 → 期望号公式；缺口不补（registry 不可回溯改写——规则从下一发起保证零新缺口） |
| N2 | 门禁不可绕过 | 门禁失败 = 发布中止；失败 → 修复 → 局部重跑确认 → 发布一次收口（双源同一产物全量只测一次） |
| N3 | 双远端同步 | 发布 commit + tag 两端（origin + github）皆推——漏推即漏发布 |
| N4 | 发布前清单可核 | CHANGELOG 已更新 / 版本号已递增 / 双源计划在位（`docs/design/RELEASE.md` §2 清单） |

## 4. 范围边界（不做）

- 不写操作步骤 / PAT 申请流程 / 踩坑记录（操作权威 = `docs/design/RELEASE.md`）。
- 不做发布后轮询回查（已裁定废止——完成判定 = 命令返回）。
- 不承诺已发布版本的撤销回滚（vsce 不支持撤销——修正走补丁版本）。
- npm 侧发布面属对端（CLI 仓）——本档只辖本仓扩展发布。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 C 轮——异层者建档；内容 = 既有流程实况登记，零新需求语义）。
