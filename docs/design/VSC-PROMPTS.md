# VSC 提示词（VSC-PROMPTS）

> 板块：VSC 端提示词（src/prompts/ 新 14 文件——本端独立实现面）。权威关系：机制语义与施工设计源自
> CLI 仓 `thincoder/docs/design/PROMPT-SYSTEM.md`（分层模型/命名法/装配矩阵/编写纪律权威蓝图）及三施工
> 档（PROMPT-IMPL-1-TEXT/2-CODE/3-TEST-MIGRATE）——**本端文本以本端原文为准**（多实现面纪律——
> byte-identical 已废——端特有段各端保留）。状态：**槽位化现行态已落地**（2026-09-10 施工①②③双端
> 同批——旧 10 文件退役）。注入路径：`src/agent/setup.mjs` assemblePrompt 场景装配。

## 加载拼装机制（施工②四槽位装配——setup.mjs + prompt-overlays.mjs）

### 场景→槽位链（蓝图 §3.2 装配矩阵——`src/prompt-overlays.mjs` SCENARIO_SLOT_FILES）

| 场景 | 装配链 |
|---|---|
| 主会话·工程 | persona-engineering.md → common.md → discipline-engineering.md |
| 主会话·普通 | persona-normal.md → common.md → discipline-normal.md |
| 子代理·eng-coder | persona-eng-coder.md → common.md → discipline-engineering.md |
| 子代理·explore/coder/plan | persona-{role}.md → common.md → discipline-normal.md |
| 特殊·consult | consult-base.md（自含——不入主链） |
| 特殊·advisor | advisor-design.md / advisor-round{1,2,3}.md（setup 不拼装——advisor/main.mjs 独立注入） |

### 降级链（蓝图 §3.4——setup.mjs + prompt-overlays.mjs）

- 人格/纪律/common 槽文件缺失 → 该槽空缺跳过 + 醒目警告（`slotWarning`——depth 0 才注入 history——不
  fallback 其他槽——层间隔离）。
- AGENTS.md 缺失 → 项目层空缺静默跳过（本端 [4] 层由调用面承担——无警告需求）。
- consult-base.md 缺失 → consultation module 不可用报错（不自降级——setup.mjs 收口）。

## 端特有差异（本端独有——保留面）

| 差异 | 位置 | 说明 |
|---|---|---|
| §11.1 R14 池规则段 | persona-engineering.md Multi-Task 节 + discipline-engineering.md 尾部节 | per-role-domain pools（4+4 + agent.poolLimits 覆盖）——CLI 无此段（施工③随迁时 CLI 不引入——端注声明） |
| persona-engineering.md Multi-Task/分工界面扩段 | persona-engineering.md | 端内调度元数据声明细节——各端原文自持 |
| persona-eng-coder.md 授权链扩段 | persona-eng-coder.md | 本端版含验证义务细述（CLI 版更紧凑）——语义同源 |

## 纪律（多实现面）

- 各端独立实现语义同源——不加双端同步依赖；实现面互不追赶（乒乓已实证）；差异如实上报；
  端特有段各端保留（R14 等）。
- 语义锚断言：`test/prompts-async-guidance.test.mjs`（本端）fail-when-unchanged——施工③重写后锚网
  全绿（退役旧件零残留 + 装配矩阵 + 降级链 + 编写纪律巡检）。

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 注入 | engineering 模式回合 | assemblePrompt("engineering") 按 §3.2 矩阵拼三槽 |
| 开关段生效 | 用户叫停（停/先别/别急） | manual 档——每步呈现等 go（persona-engineering 推进档位段 + de 收口段驱动） |
| 端特有保留 | 对照 CLI | R14 段仅本端有——不丢失 |
| 槽缺失 | 删任一槽文件 | 空缺 + 警告（不 fallback）——§3.4 |
| 锚断言 | prompts-async-guidance 测试 | 施工③重写后全绿 |

## 变更记录
- 2026-09-09：建档（用户裁定 VSC 端须有提示词设计文档——多实现面纪律下各端独立——本档承载本端
  15 文件现行形态 + 端特有差异 + 与 CLI 权威档的关系——批 1/批 2 已交付/批 3-5 待做如实记录）。
- 2026-09-10：PROMPT-SYSTEM 施工①②③双端同批——本档重写为 14 文件槽位化现行态（旧三件套/子代理
  拼装表/METHODOLOGY 降级链描述随退役作废；装配机制节换四槽位表驱动；端特有差异表按新宿主更新）。
