# VSC 提示词（VSC-PROMPTS）

> 板块：VSC 端提示词（src/prompts/ 新 15 文件——本端独立实现面）。权威关系：机制语义与施工设计源自
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

## 指针卫生（群 A 批——`§21` 前缀清理 + R24 归属登记）（2026-09-11）

> 来源：批次档 `thincoder/docs/batches/2026-09-11-VSC-MIRROR-SWEEP.md` §1 条目 A4/A5
> （指针 = CLI 批 `2026-09-11-NORMAL-MODE-AUDIT.md:246`（VSC 镜像登记）/ `2026-09-11-ROLE-REDEFINITION.md:72`）。

### A4：`§21` 前缀残留清理（6 行——逐字删前缀）

背景：`§21` 是 CLI 需求档 NORMAL-MODE 的旧节号（已重排）；CLI 两档已清前缀（批 23），本端遗留 6 行：

| # | 文件:行（as-of） | 旧（逐字） | 新（逐字——仅删 `§21 ` 前缀） |
|---|---|---|---|
| 1 | `src/prompts/discipline-normal.md:98` | `(§21 F-N1.5 2026-09-05 ruling)` | `(F-N1.5 2026-09-05 ruling)` |
| 2 | `src/prompts/discipline-normal.md:107` | `(§21 F-N1.6 2026-09-05 ruling;` | `(F-N1.6 2026-09-05 ruling;` |
| 3 | `src/prompts/discipline-engineering.md:161` | `(§21 F-N1.5 2026-09-05 ruling)` | `(F-N1.5 2026-09-05 ruling)` |
| 4 | `src/prompts/discipline-engineering.md:169` | `(§21 F-N1.6 2026-09-05 ruling;` | `(F-N1.6 2026-09-05 ruling;` |
| 5 | `docs/design/prompts/discipline-normal.md:128`（zh 权威） | `（§21 F-N1.5 2026-09-05 裁定）` | `（F-N1.5 2026-09-05 裁定）` |
| 6 | `docs/design/prompts/discipline-normal.md:136`（zh 权威） | `（§21 F-N1.6 2026-09-05 裁定）` | `（F-N1.6 2026-09-05 裁定）` |

- 语义源 = CLI 批 23（两档删前缀——本端同形；不抄 CLI 其他文本）；zh 权威档 `discipline-engineering.md` 无 F-N1.x 行（零改）；
- 替换纪律：逐处替换（禁批量 sed）；括弧宽度逐字保留（不顺手归一）。

**AC-MA4**：`§21 `（带尾空格）在代码域（`src` / `test`）零命中（机检模式 = `grep -rn '§21 ' src test`——as-of = 6 处全部落位）；`F-N1.5` / `F-N1.6` 子串在两档各保留；宽度新增 0；`prompts-async-guidance` / `prompts-mirror-anchors` / `doc-consistency` 族全绿（锚零损）。

**用例**：T-MA4-1（正常：6 行逐字替换——键控=文件+行）；T-MA4-2（边界：`grep -rn '§21 ' src test` 零命中——模式含尾空格、域 = 代码域 src/test）；T-MA4-3（错误/反证：合成含 `§21 ` 行 → 断言捕获）。

**边界（同族观察——另批，本批零动）**：冻结模式 = `§21 `（含尾空格）+ 域 = `src` / `test`——同族 `§21.1` 形态**不匹配**（空格差异——自然隔离）。
残余登记：`src/agent-tools/subagent-scheduler.mjs` 10 处（:10 / :206 / :230 / :245 / :256 / :257 / :293 / :310 / :311 / :313）+ `src/agent-tools/subagent-actions.mjs:161`；
记史面 `CHANGELOG.md:37/:43/:44`（域外——不参与代码域机检）。同族观察登记，另批勘察（格式同 A3（e）边界——`AGENT-LOOP.md` §13）。

### A5：R24 死指针修复（**增补裁定——纳入本批；原「PORTABILITY 承接」登记改判**）（2026-09-11 增补）

> **修正轮再改判（2026-09-11——设计评审轮次 1 #2 后，父侧裁定）**：本行**归 `PORTABILITY-VSC-MIRROR` 批次承接**——
> 设计 = VSC `PORTABILITY.md` §4.4（a）（其修正轮 #2 已落「（CLI 侧）」逐字同文）——**本批零动（防双写）**。
> 本节以下内容（增补裁定 / 逐字表 / AC-MA5-1 / T-MA5-1..3 / 协调留痕）为史留设计稿——其「本批承接」朝向均以本注为准；
> 本批验收不含 A5′（AC / 用例随承接批执行）。

> 增补来源：父侧 2026-09-11 转告（来源注记 =「评审 #157 顺带发现」——实证：`docs/design/METHODOLOGY.md`
> 在 VSC 仓从无、thincoder 仓亦已退役入 `_archive/`）。指令 = 纳入 A4 同族（指针卫生）设计；
> 同源语义 = CLI 侧已清同族（各端独立落——**勿抄文本**）。

**逐字（EN 档 `src/prompts/discipline-engineering.md:213`——仅句尾一句替换；行数零净变）**：

| 位置 | 文本 |
|---|---|
| 旧（`:213` 句尾） | `动机与完整机制见 \`docs/design/METHODOLOGY.md\` R24 节。` |
| 新（`:213` 句尾） | `动机与完整机制见纪律层 \`src/prompts/discipline-normal.md\` 代码结构判据节（原 \`docs/design/METHODOLOGY.md\`（CLI 侧）已于 2026-09-10 退役入 \`_archive/\`）。` |

- 语义源 = **本端 CN 现形态**（`docs/design/prompts/discipline-engineering.md:139`——逐字对齐，消 EN/CN 漂移）；CN 档零改；
- `（CLI 侧）` 事实限定保留（该方法论文件属 CLI 侧——本端从无）；
- **节结构零动**（保留 R24 挂钩节——两档本体内引「R24a」（:51/:68）编号引用零波及；不取 CLI 的「整删节」路径——本端独立落）；
- **与 PORTABILITY 批去重（呈请父侧）**：`2026-09-11-PORTABILITY-VSC-MIRROR` 设计档 §4.4(a):271 / T-V18 已含同行同动作修法（「EN 对齐 CN 现形态」）——本批（增补后）承接该行；请父侧协调 PORTABILITY 批撤下其 `:213` 编辑点（防双写），或另裁。

**AC-MA5-1**：`grep -rn "docs/design/METHODOLOGY.md" src/prompts/discipline-engineering.md` 命中仅新句退役注形态（`（CLI 侧）` 在位）；旧串 `见 \`docs/design/METHODOLOGY.md\` R24 节` 零命中；EN/CN 两档 R24 行同文；`prompts-async-guidance` / `prompts-mirror-anchors` 族全绿。

**用例**：T-MA5-1（正常：句尾替换落位——文件+串键控）；T-MA5-2（边界：EN/CN 同文——两档该行 diff 断言）；T-MA5-3（回归：旧串零命中 + 锚族绿）。

**协调留痕**：原「PORTABILITY 批承接——本批零改」句（本条前一版）随增补改判；文件行域避让维持（本批 A4/A7 编辑点 :110/:161/:169 + 本条 :213）。

**修正轮注（同上——以顶部改判注为准）**：本批编辑点 = `:110` / `:161` / `:169`（A4 / A7）；`:213` 不再属本批（归 PORTABILITY 批——本批零动并防双写）。
行号 as-of 漂移补记（修正轮实测）：目标句现落 `:217`（CN 侧 `docs/design/prompts/discipline-engineering.md:142`）；`:161` / `:169` 仍原位——字符串键控 = 旧句 ``动机与完整机制见 `docs/design/METHODOLOGY.md` R24 节。``（承接批动手前重扫）。

## 变更记录
- 2026-09-11（修正轮——设计评审轮次 1 #1/#2/#8 落修）：A4 节 AC-MA4 冻结机检模式（`§21 ` 含尾空格 + 域 src/test）+「同族观察」边界登记（`§21.1` 残余——另批零动）；A5 节顶注再改判＝归 `PORTABILITY-VSC-MIRROR` 承接（本批零动——协调留痕随更）；`:3`「14 文件」→ 15。纯口径冻结与归属登记、零语义。
- 2026-09-11（增补）：A5 改判——R24 死指针纳入本批修复（逐字 = 本端 CN 现形态；原 PORTABILITY 承接登记改判 + 去重呈请——见 A5 节「协调留痕」）。
- 2026-09-11：群 A 批——新增「指针卫生」节（A4 `§21` 前缀清理 6 行——逐字表 + AC/用例；A5 R24 行归属登记——PORTABILITY 批承接、本批零改）。
- 2026-09-09：建档（用户裁定 VSC 端须有提示词设计文档——多实现面纪律下各端独立——本档承载本端
  15 文件现行形态 + 端特有差异 + 与 CLI 权威档的关系——批 1/批 2 已交付/批 3-5 待做如实记录）。
- 2026-09-10：PROMPT-SYSTEM 施工①②③双端同批——本档重写为 14 文件槽位化现行态（旧三件套/子代理
  拼装表/METHODOLOGY 降级链描述随退役作废；装配机制节换四槽位表驱动；端特有差异表按新宿主更新）。
- 2026-09-11：「提交即走」（spawn 排队）纪律句落档——本端落点 = `src/prompts/discipline-engineering.md` 调度段 + `src/prompts/persona-engineering.md` 对位段（各 +1 条）；语义同源（CLI 侧落点与逐字全文见 `thincoder/docs/design/PROMPT-SYSTEM.md` 变更记录）。
