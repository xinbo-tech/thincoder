# 发布流程（RELEASE）— 需求

> 板块：发布流程（npm / VS Code marketplace 发布）。需求层文档（`docs/requirements/`）。
> 来源：2026-09-10 自 `../design/RELEASE.md` 抽取需求陈述（§2 唯一门禁 / §4 版本号规范）。
> 状态：**现行**。设计+测试见 `../design/RELEASE.md`（含操作步骤与踩坑）。

## 1. 总体需求

发布动作必须是**唯一门禁**：一次触发即执行全量校验，不过即中止。对外版本号必须**连续不跳号**。

## 2. 功能性需求

| # | 需求 | 说明 |
|---|---|---|
| F1 | 发布 = 唯一门禁 | `prepublishOnly` = `npm run release:check`——自动跑 lint（check-syntax）→ 全量测试（`test/run-full.mjs`，slow 全放行），摘要 + 失败详情自动提取（每失败块 ≤24 行、最多 12 块） |
| F2 | 号在发布时定 | 开发批 CHANGELOG 挂 `[Unreleased]` 段（**不编号**）；发布 = 唯一定号动作（bump → Unreleased 段头改新号） |
| F3 | 待发号推导 | 待发号 = registry 已发最高号 + 1（发布前查 `npm view thincoder version`；package.json ≠ 期望号 → 先纠正） |
| F4 | 手工检查步取消 | 不再有手动 `release:check` 步——门禁由 `npm publish` 自动执行 |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | **对外编号连续不跳空**（用户裁定） | npm / marketplace 号不得跳号 |
| N2 | **禁止一次跳多号** | 发布前核对 registry 最高号 |
| N3 | 门禁不可绕过 | 门禁不过 = 发布中止（**有意设计**） |
| N4 | 缺口不补 | 历史缺口（npm 0.12.55/56/57——registry 不可回溯重写，内容已并入 58）**不补发**；规则从下一发起保证零新缺口 |

## 4. 根因记录（需求来源）

CHANGELOG 开发期预占版本号（写段即占号）而发布动作没跟上 → 发布时直接发 package.json 当前号 →
**实发 0.12.54 → 0.12.58（55/56/57 永缺）**；tag 只在发布时打（缺号处无 tag）。
F2/F3 是此事故的直接修复产物。
