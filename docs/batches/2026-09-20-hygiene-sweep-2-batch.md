# 2026-09-20 · 卫生族二批（HYGIENE-SWEEP-2-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 15:2x · 来源 = 用户 15:26「**下一步**」+ 台账 **#141 / #142 / #143**（三条均为卫生族一批实施时撞见、已按纪律当日入账）。
> 本档 = **指称/残句卫生**三则（与一批同因不同面）；两车道：①②=设计档面（设计席）· ③=产品码注释面（eng-coder + token）。

## §1 讨论（主 agent）

### 1.0 用户授权（**父侧代点火 + 代批准** · 时限 **到 2026-09-20 17:00**）

**用户原话**（14:40）：「**全自动跑到下午五点**」+（15:26）「**下一步**」⇒ 授权窗口内，本批**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**。

**父侧自缚（代签条件）**：① 仅当「评审 **pass（0 🔴）** ∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备时代签；② 每次代签在 §4 写明「父侧代签（用户 14:40 授权 · 窗口至 17:00）+ 依据」；③ 窗口外（17:00 后）到达任一硬门 ⇒ **停下等用户**；④ 需**新范围**或**用户口径裁决** ⇒ 仍停下。

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目（3 条 · 三族同因：对象迁移/失效后指称与表达未收净）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#141** | **`SESSION.md §9+` 引族** | `SESSION.md` 被引至 **§9+**（core 面 **18 行** · vsc 面 **8 行**），而现行核档 `docs/core/design/SESSION.md` 节面仅 **§1–§8** ⇒ 同型死指称（与 #138 异档同因）。**注**：原清单由卫生族一批设计轮上报，**落批前须全域重扫闭合**（口径同 #138 批 ✓）。 |
| 2 | **#142** | **`TOOLS.md:363` D8 划改残句** | 边界行含 `~~不做跨仓自动发现~~` + 「已由 §6.13 落定」——**失效表达未删净**（违反 D8 口径：一个失效表达必须删除；历史归记录面）。逐处判「该句是否仍为边界（活）→ 去划改形保留断言 / 已失效 → 删句」。 |
| 3 | **#143** | **`AGENT-LOOP.md §6.10` 陈名形族** | `thincoder-core/agent-tools/advisor-async.mjs:23`/`:283`/`:371` · `thincoder-core/agent/advisor.mjs:218` · `thincoder-core/test/advisor-pool-queue.test.mjs:2` 仍绑 `AGENT-LOOP.md §6.10`（该档现无 §6.10；同族正靶 = `AGENT-LOOP-SUBAGENT.md §6.10`）⇒ 同法（删指称 / 改指正靶）。**注**：设计席曾以 `advisor-async.mjs:23/:283/:371` 为「既有同形」先例——实读为**陈名形**（真同形先例 = `advisor.mjs:167`）⇒ 一并核。 |

### 1.2 边界与硬要求

- **不触**：行为面 / 产品逻辑（③只碰注释 ✓）· `scripts/**` · 归档档内容（可引 ✓）· 已收口面条款 · 他批写域（本会话十一批均已收口 ✓）。
- **车道**：① + ② = 设计档面（设计席执行 ✓）；③ = 产品码面（fail-closed ⇒ eng-coder + token ✓）。
- **机械约束**：逐处按**内容回读定位**（坐标漂移普遍 ✓）；`.md` 面行宽 ≤300 ✓；`.mjs` 贴线档禁增行（`advisor.mjs` 481 · `advisor-async.mjs` 481 · `subagent-async.mjs` 456 等 · 硬限 500 ✓）。

### 1.3 验收（方向）

① 逐条「台账 id → 改动 file:line 或判保留理由」；② #141 落批前**全域重扫闭合读数**；③ `doc-check` 净增 0（锚 0 · 行宽 0）；④ 三包测试全绿（③车道）；⑤ D8 自查（现役规范面零修订式残句）。

### 1.4 台账

#141 / #142 / #143 → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

**轮次 = initial（修正轮 = §2.11 · 定点 · 追加制）** · 任务书 = 本档 §1 全段 · 台账 = #141 / #142 / #143 · 设计 = 本节；**不另立长驻设计档**（单批施工材料随批档承载——先例 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2 `:41`；本批零新语义）。行号一律 **as-of 本轮实读**（2026-09-20 · 坐标漂移普遍；改法均按**内容回读定位**）。

### 2.0 面判定与车道（实测路由——与 §1 车道表有一处出入，见 §2.9-①）

| 条目 | 实测面 | 处数 | 执行 |
|---|---|---|---|
| #142 D8 残句 | 设计档面 | 2 行（`TOOLS.md` §6.12）+ 变更记录 1 行 | **设计席** |
| #141 §9+ 族 | **产品码注释面** | **49 处 / 26 档**（三树） | **eng-coder + token** |
| #141 族界外同因（§7/§8 旧编号） | **产品码注释面** | **11 处 / 4 档新增**（另 2 档已计于上行——共涉 6 档） | **eng-coder + token** |
| #141 §9+ 族 | 设计档面 | 1 处（`TUI-SESSION-VIEW.md`）+ 变更记录 1 行 | **设计席** |
| #143 §6.10 陈名形 | **产品码注释面** | 5 处 / 3 档 | **eng-coder + token**（与 #141 同车）|
| #143 登记 | 设计档面 | J-1 残差块 +1 行 | **设计席** |
| #141 日志串面 | 运行期文案 | 2 处 | **判保留**（登记 · 到期条件见 §2.9-③）|

⇒ 设计席 = 3 档（3 行改 + 3 行增）；eng-coder = **65 处 / 33 档**。全批**零行为面**（只改注释 / 文档字面）；产品码面按 fail-closed 走 token 门。**禁增行**（贴线档实测见 §2.4）。

### 2.1 #141 —— `SESSION.md §9+` 死指称族：重扫闭合 + 逐处设计

**族定义**：注释 / 文档内以 `SESSION.md`（含 `docs/design/SESSION.md` 旧路径形）绑定**节号 ≥ §9** 的指称。现行核档 `docs/core/design/SESSION.md` 节面 = **§1–§8**（子节 §6.1–§6.15 —— 实读 `:10`–`:395`）⇒ §9+ **零存在** = 死指称。

**重扫闭合读数（as-of 2026-09-20 · 命令 = §2.5 V-1 · 输出逐行在案）**：

| 类 | 读数 |
|---|---|
| 三树行内命中 | **50 行**（`thincoder-core` 26 · `thincoder-cli` 13 · `thincoder-vscode` 11）|
| 跨行形补入 | **+1 实例**——`thincoder-core/agent-tools/read-history.mjs:277-278`（`SESSION.md` 与 `§14.3.7` 分跨两行 ⇒ 行内正则不命中；人工回读补入）|
| 设计档域（`docs/**` 现役面）| **1 处**——`docs/cli/design/TUI-SESSION-VIEW.md:45` |
| **合计** | **52 实例**（三树 51 + 设计档 1）|
| 对照原记 | core 18 / vsc 8 = 26 ⇒ 重扫**净增 26**（成因不作断言；候选 = 扫描域 / 行内正则 / grep 行上限截断——同 #138 批 9→12 因）|

**记录 / 归档面（判保留 · 不入改集 · 零触）**：`docs/batches/**` · `thincoder-{cli,vscode}/docs/_archive/**` · `thincoder-{cli,vscode}/CHANGELOG.md` · `docs/TODO-archive.md` · 运行日志产物（`.thincoder/tmp/*.log` · `thincoder-cli/m10-cli-fresh.log`）。

**映射表（改指靶单源 · 逐档实读核）**：

| 旧编号（源档 = 两 `_archive/design/SESSION.md`）| 现靶（`docs/core/design/SESSION.md`）| 实读依据 |
|---|---|---|
| §9 / §9.x | **§6.9** 消息时间戳与 read_history 工具 | `:161` |
| §10 / §10.x | **§6.10** 端分离恢复：本端 end marker | `:169` |
| §11 / §11.x | **§6.11** agent 运行环境自我感知（env-state reminder）| `:188` |
| §12 / §12.x | **§6.12** 会话目录残留 GC 与标题写契约 | `:199` |
| §13 / §13.x | **§6.13** 跨会话历史检索与检索族消歧 | `:208` |
| §14 / §14.3（含 .3.x）/ §14.4 | **§6.14** 长会话记录内存有界 | `:216` |
| §14.6 / §14.7 | **无活靶** ⇒ 删指称（该档 §8.2 登记 = 不并项「一次性批次材料」）| `:386` |

**改法规则**：

- **R1（改指）**：`档名 + 节号` token 按映射表替换；**其余字面逐字保留**（日期 / 描述 / 需求池号 `R19` / 旧决策·用例号 `T-S3` · `D-R4` · `D-R19a` · `D-R19b` · `T-RS8b` · `T-R19.4` / `refinement 1`）——承 #139 批「行内替换 · 其余字面零动」先例（`2026-09-20-hygiene-sweep-batch.md` §2.2）。
  - **例外（去子号 6 处 · core 4 + vsc 2）**：`D-S1` / `D-S2`——`agent/family-tools.mjs:149` · `context.mjs:172` · `context.mjs:282` · `escape.mjs:134`；vsc `src/agent/run-helpers.mjs:207` · `src/agent/setup.mjs:424`。理由 = 现核档 §6.8 的 D-S1/D-S2 是**另一决策**（启动前校验 / TUI 重选流程——实读 `:153` / `:155`）⇒ 留之必把读者引向错误决策（撞号误导 > 无对应）。
- **R2（删指称 1 处）**：`thincoder-cli/test/integration/session-resume.test.mjs:158`——`——SESSION.md §14.6` 片段删（无活靶）；同句 `T-RS10（TUI-OOM-ROOTCAUSE 组 1` 保留。
- **R3（路径同轮）**：`session-segments.mjs:4` · `session-store.mjs:3` 的 `docs/design/SESSION.md` → `docs/core/design/SESSION.md`（与节号同轮）。
- **R4（机械）**：逐处**行内替换 · 行数零变**（贴线档 `context.mjs` 495 · `provider/core.mjs` 491 · vsc `setup.mjs` 495 ⇒ 禁增行）；`.md` 面改后行宽 ≤300。

**逐处清单（core 27 实例 / 28 行）**

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `agent/family-tools.mjs:149` | `SESSION.md §9 D-S2` → `SESSION.md §6.9` |
| 2 | `agent/setup-reminders.mjs:3` | `§11.1` → `§6.11` |
| 3 | `agent/setup.mjs:81` | `§11.2` → `§6.11` |
| 4 | `agent/setup.mjs:131` | `§11.1` → `§6.11` |
| 5 | `agent-tools/read-history.mjs:2` | `§9 + §13 R19` → `§6.9 + §6.13 R19` |
| 6 | `agent-tools/read-history.mjs:5` | `§13 R19` → `§6.13 R19` |
| 7 | `agent-tools/read-history.mjs:9` | `§14.3.7` → `§6.14` |
| 8 | `agent-tools/read-history.mjs:25` | `§13 D-R19a` → `§6.13 D-R19a` |
| 9 | `agent-tools/read-history.mjs:35` | `§9.5 refinement 1 + §13 T-R19.4` → `§6.9 refinement 1 + §6.13 T-R19.4` |
| 10 | `agent-tools/read-history.mjs:36` | `§13` → `§6.13` |
| 11 | `agent-tools/read-history.mjs:49` | `§13 D-R19a` → `§6.13 D-R19a` |
| 12 | `agent-tools/read-history.mjs:56` | `§13` → `§6.13` |
| 13 | `agent-tools/read-history.mjs:59` | `§13 D-R19b` → `§6.13 D-R19b` |
| 14 | `agent-tools/read-history.mjs:116` | `§13 D-R19a` → `§6.13 D-R19a` |
| 15 | `agent-tools/read-history.mjs:145` | `§13 D-R19a` → `§6.13 D-R19a` |
| 16 | `agent-tools/read-history.mjs:277-278` | `§14.3.7 / T-RS8b` → `§6.14 / T-RS8b` |
| 17 | `context.mjs:172` | `§9 D-S1` → `§6.9` |
| 18 | `context.mjs:177` | `§14.3.5` → `§6.14` |
| 19 | `context.mjs:282` | `§9 D-S1` → `§6.9` |
| 20 | `escape.mjs:134` | `§9 D-S1` → `§6.9` |
| 21 | `generate-title.mjs:107` | `§14.3.3` → `§6.14` |
| 22 | `provider/core.mjs:124` | `§9 T-S3` → `§6.9 T-S3` |
| 23 | `session-gc.mjs:2` | `§12` → `§6.12` |
| 24 | `session-segments.mjs:4` | `docs/design/SESSION.md §14.3` → `docs/core/design/SESSION.md §6.14`（R3）|
| 25 | `session-store.mjs:3` | `docs/design/SESSION.md §14.3` → `docs/core/design/SESSION.md §6.14`（R3）|
| 26 | `session-store.mjs:278` | **判保留**（日志串——§2.9-③）|
| 27 | `session-store.mjs:355` | **判保留**（日志串——§2.9-③）|

**逐处清单（cli 13 处）**

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `bin/thincoder.mjs:10` | `§12` → `§6.12` |
| 2 | `bin/thincoder.mjs:323` | `§14.3.4` → `§6.14` |
| 3 | `bin/thincoder.mjs:326` | `§11.2` → `§6.11` |
| 4 | `bin/thincoder.mjs:417` | `§12` → `§6.12` |
| 5 | `src/acp/handlers-session.mjs:148` | `§14.3.4` → `§6.14` |
| 6 | `src/acp/handlers-slots.mjs:91` | `§14.3.4` → `§6.14` |
| 7 | `src/acp/handlers-slots.mjs:147` | `§14.3.4` → `§6.14` |
| 8 | `src/tui/startup.mjs:121` | `§14.3.6` → `§6.14` |
| 9 | `test/integration/session-resume.test.mjs:158` | **删指称**（R2）|
| 10 | `test/read-history-guard.test.mjs:2` | `§13` → `§6.13` |
| 11 | `test/read-history-guard.test.mjs:17` | `§13` → `§6.13` |
| 12 | `test/session-store.test.mjs:2` | `§14` → `§6.14` |
| 13 | `test/setup-reminders.test.mjs:2` | `§11.2` → `§6.11` |

**逐处清单（vsc 11 处）**

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `src/agent/run-helpers.mjs:207` | `§9 D-S1 (CLI parity)` → `§6.9 (CLI parity)` |
| 2 | `src/agent/setup-reminders.mjs:48` | `§11.1` → `§6.11` |
| 3 | `src/agent/setup-reminders.mjs:101` | `§11.2` → `§6.11` |
| 4 | `src/agent/setup.mjs:424` | `§9 D-S2` → `§6.9` |
| 5 | `src/agent/setup.mjs:428` | `§11.2` → `§6.11` |
| 6 | `src/agent/setup.mjs:436` | `§11.2` → `§6.11` |
| 7 | `src/agent/setup.mjs:464` | `§11.1/§11.2` → `§6.11`（同节去重）|
| 8 | `src/extension/panel-session.mjs:39` | `§10 D-2` → `§6.10 D-2` |
| 9 | `src/extension/session-io.mjs:85` | `§12` → `§6.12` |
| 10 | `src/extension/session-slots.mjs:103` | `§10 D-2` → `§6.10 D-2` |
| 11 | `test/setup-reminders.test.mjs:2` | `§11.2` → `§6.11` |

**逐处清单（设计档 1 处）**

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `docs/cli/design/TUI-SESSION-VIEW.md:45` | `（§14.3.6 段）` → `（§6.14 段）` + 该档变更记录 +1 行 |

**逐处清单（族界外同因 · §7/§8 旧编号 · 已裁并入 · 11 处）**

映射：旧 §7 = 会话标题生成 ⇒ 现 `§6.7`；旧 §8 = provider/model 无效重选 ⇒ 现 `§6.8`（子号 `D-S1` / `D-S2` / `D-S4` 在 §6.8 内在位 ⇒ **保留**——与 R1 例外情形不同，无撞号）。改法 = R1 同式：行内替换 · 其余字面逐字保留 · 行数零变。

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `thincoder-cli/bin/thincoder.mjs:159` | `SESSION.md §8 D-S4（F4）` → `SESSION.md §6.8 D-S4（F4）` |
| 2 | `thincoder-cli/bin/thincoder.mjs:317` | `§8 D-S1` → `§6.8 D-S1` |
| 3 | `thincoder-cli/src/cli/make-agent.mjs:130` | `§8 D-S1` → `§6.8 D-S1` |
| 4 | `thincoder-cli/src/cli/make-agent.mjs:178` | `§8 D-S1` → `§6.8 D-S1` |
| 5 | `thincoder-cli/src/tui/index.mjs:48` | `§8 D-S2` → `§6.8 D-S2` |
| 6 | `thincoder-cli/src/tui/index.mjs:461` | `§8 D-S2` → `§6.8 D-S2` |
| 7 | `thincoder-cli/src/tui/render-frame.mjs:43` | `§8` → `§6.8` |
| 8 | `thincoder-cli/src/tui/render-frame.mjs:391` | `§8` → `§6.8` |
| 9 | `thincoder-cli/src/tui/startup.mjs:209` | `§8 D-S2` → `§6.8 D-S2` |
| 10 | `thincoder-vscode/src/extension/panel-turn-stages.mjs:114` | `§7` → `§6.7` |
| 11 | `thincoder-vscode/src/extension/panel-turn-stages.mjs:123` | `§7` → `§6.7` |

### 2.2 #142 —— `docs/core/design/TOOLS.md` D8 划改残句

**判定**：`:363` 首段的 `~~不做跨仓自动发现~~ **已由 §6.13 落定**` = 修订式残句（D8 判据 = `DOC-DISCIPLINE.md:23` 表行 + 细则 `:25-32`）。判「**该句仍为活边界**」——§6.12 今日仍不做跨仓自动发现（发现层 = §6.13 · 实读该档 `:365`–`:383`）⇒ **去划改形、保留断言**；「已由…落定」修订框架与 `2026-09-18 #62 批` 出处注随去（§6.13 节头已载 `2026-09-18 · 批 REPO-DISCOVERY · 台账 #62` —— D2 不重述）。

**改后（`:363` 首段逐字）**：

> `**边界（本节不做）**：跨仓自动发现不在本节（归 §6.13——工作区根 ⇒ 唯一带 manifest 子仓自动下钻）；本节的 fail-closed 保留为**零发现态**兜底，语义零改；`

（余段「不改工具描述（…）…非本缺陷族）」**零改**。）

**同段同族 +1 处（超台账点名 1 行 · 提请评审确认）**：`:361` 尾句「`——原「修复落地前…可临时以 workdir 绕行」句**已退役**（#55 落地 + #62 发现面落地）。`」= 「原记 X ⇒ 收正 Y」禁形，对象已不在档 ⇒ **删该尾句**；留前文 `…已自带仓发现（**缺省 = 发现的项目仓根**，显式 \`workdir\` 优先）`。零信息丢失（退役史归批档记录面；「#55 已落地」时点锚在句首保留）。

**变更记录**：`docs/core/design/TOOLS.md` +1 行（`:539`）——「2026-09-20（**卫生族二批 · 台账 #142 · eng-designer**）：§6.12 两处修订式残句清理（边界行去划改形保断言 + 对账口径行退役句删）；**零新语义**。」

### 2.3 #143 —— `AGENT-LOOP.md §6.10` 陈名形（5 处 · 改指）

**族与靶实核**：token 族现盘 = **恰 5 处**（V-2 实跑 `TOTAL=5` · 三树全域 · 与台账一致）；`docs/core/design/AGENT-LOOP.md` 节面 = §6.1–§6.6 + §6.13–§6.18 ⇒ **无 §6.10**（实读 §2）；正靶 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` `## 6.10 回合外事件后台化统一模型（分域池 + async advisor）`（实读 `:183`）；真同形先例 = `thincoder-core/agent-tools/advisor.mjs:167` 的 `(AGENT-LOOP-SUBAGENT.md §6.10)`。

**改法（改指 · 行内替换 · 零行变）**：

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor-async.mjs:23` | `AGENT-LOOP.md §6.10` → `AGENT-LOOP-SUBAGENT.md §6.10` |
| 2 | `thincoder-core/agent-tools/advisor-async.mjs:283` | 同 |
| 3 | `thincoder-core/agent-tools/advisor-async.mjs:371` | 同 |
| 4 | `thincoder-core/agent-tools/advisor.mjs:218` | 同 |
| 5 | `thincoder-core/test/advisor-pool-queue.test.mjs:2` | 同 |

**坐标收正（两处 · 如实登记）**：① 台账 #143 记 `thincoder-core/agent/advisor.mjs:218` —— 盘上**无** `agent/advisor.mjs`（`agent/` 目录无该档）；实址 = **`thincoder-core/agent-tools/advisor.mjs:218`**（内容逐字即 ED-4 行 ✓）⇒ 按实址执行。② §1 贴线读数「`advisor.mjs` 481」与实读不符（详见 §2.9-⑧）。

**登记（承台账 #143 消解径「J-1 残差补录」）**：`docs/core/design/DOC-DISCIPLINE.md` §3.9 J-1 残差块 **+1 行**——落点 = 块内既有 2026-09-20 登记行**之后**（该行含「§11 子族（全形 · 注释面）已处置」——执行轮按该句**内容回读定位**），逐字：

> `- **登记（2026-09-20 · 卫生族二批 · 台账 #143）**：**§6.10 陈名形子族（5 处 · 注释面）已处置**（批档 docs/batches/2026-09-20-hygiene-sweep-2-batch.md §2）；该子族出 #139 族界（§6.10 陈名形 vs §11 紧邻形），坐标 as-of 2026-09-18 = advisor-async.mjs :23 / :281 / :367 · advisor.mjs :215 · advisor-pool-queue.test.mjs :2；余面仍在册，随扩面轮。零新语义。`

### 2.4 受影响文件表（实读行数 as-of 2026-09-20 · Δ = 本批行数变化）

**设计席（3 档）**

| 档 | 现行数 | Δ | 内容 |
|---|---|---|---|
| `docs/core/design/TOOLS.md` | 538 | **+1** | §6.12 两处残句清理 + 变更记录 1 行 |
| `docs/core/design/DOC-DISCIPLINE.md` | 1308 | **+1** | §3.9 J-1 登记 1 行 |
| `docs/cli/design/TUI-SESSION-VIEW.md` | 220 | **+1** | `:45` 节号收正 + 变更记录 1 行 |

**产品码面（eng-coder · 33 档 · 全为行内替换 ⇒ Δ=0）**

| 档 | 行数 | 档 | 行数 |
|---|---|---|---|
| `thincoder-core/agent/family-tools.mjs` | 174 | `thincoder-cli/bin/thincoder.mjs` | 440 |
| `thincoder-core/agent/setup-reminders.mjs` | 199 | `thincoder-cli/src/acp/handlers-session.mjs` | 240 |
| `thincoder-core/agent/setup.mjs` | 234 | `thincoder-cli/src/acp/handlers-slots.mjs` | 196 |
| `thincoder-core/agent-tools/read-history.mjs` | 309 | `thincoder-cli/src/tui/startup.mjs` | 297 |
| `thincoder-core/context.mjs` | **495**（距限 5）| `thincoder-cli/test/integration/session-resume.test.mjs` | 259 |
| `thincoder-core/escape.mjs` | 152 | `thincoder-cli/test/read-history-guard.test.mjs` | 83 |
| `thincoder-core/generate-title.mjs` | 123 | `thincoder-cli/test/session-store.test.mjs` | 389 |
| `thincoder-core/provider/core.mjs` | **491**（距限 9）| `thincoder-cli/test/setup-reminders.test.mjs` | 331 |
| `thincoder-core/session-gc.mjs` | 248 | `thincoder-vscode/src/agent/run-helpers.mjs` | 268 |
| `thincoder-core/session-segments.mjs` | 99 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 138 |
| `thincoder-core/session-store.mjs` | 441 | `thincoder-vscode/src/agent/setup.mjs` | **495**（距限 5）|
| `thincoder-core/agent-tools/advisor-async.mjs` | 481 | `thincoder-vscode/src/extension/panel-session.mjs` | 295 |
| `thincoder-core/agent-tools/advisor.mjs` | 280 | `thincoder-vscode/src/extension/session-io.mjs` | 221 |
| `thincoder-core/test/advisor-pool-queue.test.mjs` | 219 | `thincoder-vscode/src/extension/session-slots.mjs` | 136 |
| — | — | `thincoder-vscode/test/setup-reminders.test.mjs` | 321 |
| `thincoder-cli/src/cli/make-agent.mjs` | 214 | `thincoder-cli/src/tui/index.mjs` | 482 |
| `thincoder-cli/src/tui/render-frame.mjs` | 408 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 177 |

全为 `.mjs` ⇒ 拆分计划：**豁免**（行内替换 · 结构未变 · 批内 Δ=0——消解条件 = 该档下次实质改动时）；**advisory 登记**：**12 档越 300 咨询线**（495 / 495 / 491 / 482 / 481 / 441 / 440 / 408 / 389 / 331 / 321 / 309），无一越 500 硬限；无新增档。

### 2.5 验收标准（逐条回指 §1.3）与可跑命令（cwd = 仓根 · 全 ASCII）

| # | 判据 | 命令（逐字可跑） | 期望 |
|---|---|---|---|
| **V-1** | #141 死形零命中 | `node -e "const fs=require('fs'),path=require('path');const re=/SESSION[.]md[^\n]{0,120}\u00a7\s*(9|1[0-4])(?![0-9])/;let n=0;const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(['node_modules','.git','_archive','.thincoder'].includes(e.name))continue;walk(p);}else if(/[.](mjs|cjs)$/.test(e.name)){fs.readFileSync(p,'utf8').split('\n').forEach((l,i)=>{if(re.test(l)){n++;console.log('HIT '+p+':'+(i+1));}});}}};['thincoder-core','thincoder-cli','thincoder-vscode'].forEach(walk);console.log('TOTAL='+n);"` | `TOTAL=2` ∧ 命中 ⊆ {`session-store.mjs:278` · `:355`}（判保留集）|
| **V-2** | #143 死名零命中 | 同上骨架，正则换 `/AGENT-LOOP[.]md\s*\u00a7\s*6[.]10/` | `TOTAL=0` |
| **V-3** | #142 文档面正反判 | `node -e "const t=require('fs').readFileSync('docs/core/design/TOOLS.md','utf8');console.log('TILDE='+(t.split('~~').length-1),'OLD='+t.includes('\u4e0d\u505a\u8de8\u4ed3\u81ea\u52a8\u53d1\u73b0'),'NEW='+t.includes('\u8de8\u4ed3\u81ea\u52a8\u53d1\u73b0\u4e0d\u5728\u672c\u8282'),'TAIL='+t.includes('\u4fee\u590d\u843d\u5730\u524d'))"` | `TILDE=0 OLD=false NEW=true TAIL=false` |
| **V-4** | 机检净增 0（锚 / 行宽）| `node scripts/doc-check.mjs` | 尾部 `OK(锚): 0 条悬空` ∧ `OK(行宽)`（基线 = 本轮实跑：悬空 0 · 行宽 0 · 候选 18529 · 迁移期引文 211）|
| **V-5** | 行数零变（贴线档）| 逐档 `read` 尾计数（或等价 node 计数）| = §2.4 表值（`context.mjs` 495 · `provider/core.mjs` 491 · vsc `setup.mjs` 495 不变）|
| **V-6** | 套件级 | 三包 `npm test`（core / cli / vscode）| 全绿；失败集合 ⊆ 批前基线（口径 = A-MS6）|
| **V-7** | TUI 档面 | `node -e "const t=require('fs').readFileSync('docs/cli/design/TUI-SESSION-VIEW.md','utf8');console.log('NEW='+t.includes('\u00a76.14 \u6bb5'),'OLD='+t.includes('\u00a714.3.6'))"` | `NEW=true OLD=false` |
| **V-8** | #141 族界外（§7/§8）死形零命中 | `node -e "const fs=require('fs'),path=require('path');const re=/SESSION[.]md[^\n]{0,120}\u00a7\s*[78](?![0-9A-Za-z])/;let n=0;const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(['node_modules','.git','_archive','.thincoder'].includes(e.name))continue;walk(p);}else if(/[.](mjs|cjs)$/.test(e.name)){fs.readFileSync(p,'utf8').split('\n').forEach((l,i)=>{if(re.test(l)){n++;console.log('HIT '+p+':'+(i+1));}});}}};['thincoder-core','thincoder-cli','thincoder-vscode'].forEach(walk);console.log('TOTAL='+n);"` | `TOTAL=0`（基线：改集前实测 `TOTAL=11` = 改集全部 11 处）|

### 2.6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 场景 | 期望 |
|---|---|---|---|
| T1 | 正常 | V-1 复跑 | `TOTAL=2` ∧ 命中 ⊆ 判保留集（日志串 2 处）|
| T2 | 正常 | V-2 复跑 | `TOTAL=0` |
| T3 | 正常 | V-3 / V-7 正反判 | 划改形零命中 ∧ 改后句在场 |
| T4 | 边界 | 跨行形实例 `read-history.mjs:277-278` | 两行回读分别含 `§6.14` 与 `T-RS8b` |
| T5 | 边界 | 判保留面（记录 / 归档 / 日志串）| `git diff` 对 `_archive/**` · 两 `CHANGELOG.md` · `docs/batches/**` 既有行**零 hunk**；`session-store.mjs:278` / `:355` 零 diff |
| T6 | 边界 | 贴线三档（495 / 491 / 495）| 行数不变（V-5）|
| T7 | 错误 | 改指靶拼写漂移（如误写 `§6.15`）| 判违规——落笔前目标锚存在性回读（映射表逐条实读核）|
| T8 | 错误 | 改后 V-1 / V-8 出现新 HIT | 判违规（引入新死指称）|
| T9 | 正常 | V-8 复跑 | `TOTAL=0` |

### 2.7 边界（本批不做）

行为面 / 产品逻辑 · 提示词面 · `scripts/**` · 归档档内容 · 冻结批档 · 需求档（主 agent 笔）· 他批写域 · **裸形面**（无档名 `§NN` —— 承 J-1「另轮读数域」）· 日志 / 模型可见文案面（仅登记 2 处）· §2.9 域外面（`§IK9UZ8-D` 路径形〔§2.9-⑤〕· 他档 D8 残句〔§2.9-⑥〕）。

### 2.8 关键决策记录（含否决）

- **KD-1 改指 ≠ 删指称**：族内绝大多数有活靶（同档 §6.x 重编号）⇒ 改指 + 其余字面零动；唯 `§14.6` 无活靶（该档 §8.2 判「不并」）⇒ 删指称。
- **KD-2 子号去留两分**：以字面零动为原则；**去** 仅限撞号（`D-S1` / `D-S2` —— 现核档 §6.8 占用同名，留之引向错误决策）；无对应者（`T-S3` · `D-R4` · `D-R19a` · `T-RS8b` 等）**留**（可在归档源档解析；去之徒增改写面、无防误导收益）。
- **KD-3 车道**：产品码注释面 fail-closed ⇒ eng-coder + token（与 #143 同车）——不因「只改注释」降级为设计席直改。
- **KD-4 #142 判活**（去划改形 · 保断言）——非删句：§6.12 的「不做发现」**今日仍真**（发现层 = §6.13），失效的只是划改形与「已由…落定」框架。
- **KD-5 已否方案**：① 全族一刀切删指称（否决——多数有活靶，删则丢信息）；② 整行重写（否决——改写面大 · 易带新语义）；③ 日志串同轮改（否决——越「只碰注释」边界）；④ 补 `§9` 节面使指称复活（否决——补节 = 复活已废结构，同 `WORKSPACE.md` / `LOGGING.md` 先例口径）。

### 2.9 不一致 / 域外发现（报告面 · 逐条）

1. **§1 车道表 ∥ 实测面**：#141 记「设计档面（设计席执行）」——实测 = **产品码注释面 49/50 处**（设计档面仅 1 处）⇒ 执行路由按 fail-closed 改判（§2.0）；范围不变，只改车道。
2. **台账 #143 坐标**：`thincoder-core/agent/advisor.mjs:218` 无此档 ⇒ 实址 `thincoder-core/agent-tools/advisor.mjs:218`（内容相符）。
3. **日志串 2 处判保留**（`session-store.mjs:278` / `:355` 含 `SESSION.md §14.4 D-R4`）：越「只碰注释」边界 ⇒ 登记；**到期条件** = 运行期文案面独立裁定轮（改法已备 `§14.4` → `§6.14`）。
4. **族界外同因 · §7/§8 旧编号 11 处**（cli 9：`bin/thincoder.mjs:159` `§8 D-S4` · `:317` `§8 D-S1` · `src/cli/make-agent.mjs:130` / `:178` · `src/tui/index.mjs:48` / `:461` · `src/tui/render-frame.mjs:43` / `:391` · `src/tui/startup.mjs:209`；vsc 2：`src/extension/panel-turn-stages.mjs:114` / `:123` `§7`）——同根因，但 §7/§8 在现核档**可解析（指向另一节）**⇒ 出 §9+ 族界。**已裁（父侧 · 2026-09-20）：并入本批改集**——同法 `§7` → `§6.7` · `§8` → `§6.8`（映射对盘实核：旧档 §7 = 会话标题生成 ⇒ 现 §6.7；旧档 §8 = provider/model 无效重选 ⇒ 现 §6.8——子号在位保留）；逐处清单 = §2.1 族界外同因表 · 档数 = §2.4 · 机判 = V-8。
5. **同因异形 1 处**：`thincoder-core/generate-title.mjs:64` 引 `docs/design/SESSION.md §IK9UZ8-D`（旧路径形 + 旧决策号 · 非节号形）⇒ 出族界，报不动。
6. **D8 他档残句（域外）**：`docs/vsc/design/VSC-MIGRATION-INVENTORY.md:217` / `:224` 含 `~~归属疑变~~ → D3 裁定…维持现状` 形；`docs/core/design/TUI.md:198` 的 `~~` = markdown 语法描述（D8 豁免族 ⓑ ✓ 合规）；`_archive/**` 与 D8 正文 = 豁免族 ⓐⓓ ✓。**本批 D8 自查面（触档）零残留**；域外 2 处建议另轮。
7. **原读数偏小**：§1 记 core 18 / vsc 8 ⇒ 本轮闭合 52 实例（净增 26）；成因不作断言（候选见 §2.1）。
8. **§1 贴线读数不符**：「`advisor.mjs` 481」实读 = `agent-tools/advisor.mjs` **280** / `thincoder-core/advisor.mjs` **281**（481 仅 `advisor-async.mjs`）；本批触档全为行内替换 ⇒ 贴线风险零。

### 2.10 设计轮自检（D6 回读 + 机检读数 + 计数收正 + 可读性登记）

- **D6 回读**：§2 两段落档（6832 + 9031 字符）逐段复读完成；改法坐标全按**内容回读定位**（含跨行形 1 处）。
- **机检读数（本轮实跑 · cwd = 仓根 · 2026-09-20）**：`node scripts/doc-check.mjs` ⇒ **悬空 0 · 行宽 0**（候选 18529 · 迁移期引文 211 · 与批前基线同值）⇒ 设计轮**零新增**。族扫描实测：V-1 `TOTAL=50`（三树行内形）· V-2 `TOTAL=5`（与台账一致）。
- **计数（D3 · 单源校核）**：设计席 = 3 档（**3 行改**〔`TOOLS.md` `:361` / `:363` · `TUI-SESSION-VIEW.md:45`〕**+ 3 行增**〔两档变更记录 + J-1 登记〕）；eng-coder = **65 处 / 33 档**（§2.0 与 §2.4 同值——含族界外同因 11 处 / 4 档新增）。
- **可读性登记**：§2 内 >300 字符行 = 命令行（§2.5 V-1 / V-3 / V-8——命令不可折行，折行即不可跑）与记录 / 表行（注记长句）——判**可接受**（`docs/batches/**` 不在机检行宽域 ⇒ 闸态不受影响）。
- **设计席 D8 自查**：本节无修订式残句（「旧 → 新」表 = 变换规格；差异叙述均带 as-of / 日期锚；无 `~~` / 「已作废」挂尸）。
- **遗留**：§2.9-③ 日志串 2 处判保留（到期条件在册）。

### 2.11 设计评审修正轮（§3 轮次 1 · 6 条逐条落 · 2026-09-20 · eng-designer）

**轮次** = fix（定点 · 追加制）。**依据** = 本档 §3 轮次 1 发现表（评审 id=71 · **VERDICT = changes-required** · 🔴 1 / 🟡 1 / 🔵 4）——父侧逐条裁定**接受**（`Suggestion` 列 = 处置建议 · 处置执行 = 本席）。**改动形态** = ① 被点名处**就地收正**（不留划改残迹——旧值可经 git 历史逐字复核）② 本节 = 追加制逐条记录。**本轮零新语义**（落点 = 发现表直接导出项 + 父侧已裁「⑤-4 并入本批」）；零产品码 · 零需求档 · 零 `scripts/**` · 零他批写域；§1 / §3–§6 = 他人段零触。

| # | 级 | 处置 | 落点 | 断言 / 预期读数 |
|---|---|---|---|---|
| 1 | 🔴 | ⑤-4 族界外 11 处并入改集：① §2.0 新增行（11 处 / 4 档新增）+ 总口径改 65 处 / 33 档 ② §2.1 新增「族界外同因」逐处表（11 行 · `§7` → `§6.7` · `§8` → `§6.8`）③ §2.4 补 4 档（`make-agent.mjs` 214 · `tui/index.mjs` 482 · `render-frame.mjs` 408 · `panel-turn-stages.mjs` 177）④ §2.5 新增 V-8 + §2.6 新增 T9 ⑤ §2.7 / §2.9-④ / §2.10 状态句改按已裁口径（失效表述删净） | §2.0 · §2.1（尾表）· §2.4 · §2.5 · §2.6 · §2.7 · §2.9-④ · §2.10 | A-1（V-8）⇒ 改集前 `TOTAL=11`（= 改集全部 11 处）· 实施后判 `TOTAL=0`；新表 11 行 |
| 2 | 🟡 | §2.0 两处计数就地改正（档数 → **26 档**；总口径 → **65 处 / 33 档** · 行改增口径 → **3 行改 + 3 行增**）；§2.4 表头 / §2.10 计数行去修订框架（「以本行为准」），改直陈当前值 | §2.0 · §2.4 · §2.10 | A-2 ⇒ `P26=true P65=true P33=true` |
| 3 | 🔵 | 例外注记「去子号 **4 处**」→ **6 处**（core 4 + vsc 2）并补 vsc 两坐标（`src/agent/run-helpers.mjs:207` · `src/agent/setup.mjs:424`） | §2.1 R1 例外行 | A-2 ⇒ `P6=true` |
| 4 | 🔵 | §2.4 表注：收窄「豁免」为**拆分计划豁免** + 补 **advisory 登记**——评审列 9 档，本席按 §2.4 表实核 **12 档**越 300 咨询线（漏列 `agent-tools/advisor-async.mjs` 481；并入面新增 2 档 482 / 408）· 无一越 500 · 批内 Δ=0 | §2.4 表注行 | A-2 ⇒ `P12=true`；12 档读数 = 495 / 495 / 491 / 482 / 481 / 441 / 440 / 408 / 389 / 331 / 321 / 309 |
| 5 | 🔵 | 无需改（证据边界——V-4 / V-6 由实施 / 收口轮实跑补证）；本轮已实跑补 V-4 读数 | — | `node scripts/doc-check.mjs --root .` ⇒ 悬空 0 · 行宽 0（候选 18529 · 迁移期引文 211） |
| 6 | 🔵 | 无需改（确认项：§2.2 `:361` 同族 +1 处确在射程——评审已对盘确认） | — | — |

**V-8 设计注（发现 1-③）**：正则 = `SESSION[.]md[^\n]{0,120}\u00a7\s*[78](?![0-9A-Za-z])`（域 / 排除面 / 骨架同 V-1）；尾部排除位含 `A-Za-z`——防 `§8B` 形误报（实证 = `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:76` / `:114` 的该档自引 `§8B-*`：扫三树零命中 · 扫 docs 面为误报族）。三树实测：改集前 `TOTAL=11` = 改集全部 11 处；实施改指后判 `TOTAL=0`。

**计数复核（D3 · 三处同口径）**：#141 = 60 处 / 30 档（§9+ 49 处 / 26 档 + 族界外 11 处 / 4 档新增）· #143 = 5 处 / 3 档 ⇒ **eng-coder = 65 处 / 33 档**；设计席 = 3 档（3 行改 + 3 行增）。§2.0 表 ∥ §2.4 表 ∥ V-8 覆盖面三处一致。

**D8 自查**：就地收正后，本节现役面零修订式残句——失效表述（§2.7 的「§7/§8 旧编号」不做项 · §2.9-④ 的「未列改集，待裁」· §2.10 的「待裁」与「以本行为准」修订框架 · §2.4 表头笔误注）已删净；改点均为直陈句；「原值 ⇒ 新值」史归本节 / git 历史（§3 内评审引用旧值 = 评审记录面，零触）。

**C2 断言命令（全 ASCII · cwd = 仓根）**：

- **A-1**（发现 1）= §2.5 V-8 逐字命令 ⇒ `TOTAL=0`（改集前实测 `TOTAL=11`）。
- **A-2**（发现 2 / 3 / 4 正形）：`node -e "const t=require('fs').readFileSync('docs/batches/2026-09-20-hygiene-sweep-2-batch.md','utf8');console.log('P26='+t.includes('49 \u5904 / 26 \u6863'),'P65='+t.includes('65 \u5904 / 33 \u6863'),'P33='+t.includes('3 \u884c\u6539 + 3 \u884c\u589e'),'P6='+t.includes('\u53bb\u5b50\u53f7 6 \u5904'),'P12='+t.includes('12 \u6863\u8d8a 300 \u54a8\u8be2\u7ebf'))"` ⇒ 本轮实跑 `P26=true P65=true P33=true P6=true P12=true`。
- **A-3**（发现 2 负形 · 现役面限定）：`node -e "const t=require('fs').readFileSync('docs/batches/2026-09-20-hygiene-sweep-2-batch.md','utf8');const live=t.split('### 2.11')[0];const d=['27 \u6863','54 \u5904','30 \u6863','4 \u884c\u6539 + 2 \u884c\u589e','\u4ee5\u672c\u884c\u4e3a\u51c6','\u672a\u5217\u6539\u96c6','\u5f85\u88c1'];console.log('DEAD='+d.filter(s=>live.includes(s)).length);"` ⇒ `DEAD=0`（旧值残余命中全在 §3 评审记录面 + 本节记录面——他人段零触）。

**机检读数（修正轮实跑 · cwd = 仓根 · 2026-09-20）**：`node scripts/doc-check.mjs --root .` ⇒ **悬空 0 · 行宽 0**（候选 18529 · 迁移期引文 211——与设计轮同值）⇒ **净增 0**（本档在源域外 · 按构造零移动；复跑同值坐实）。族扫描：V-1 `TOTAL=50` · V-2 `TOTAL=5` · V-8 `TOTAL=11`（后两者 = 改集前基线）。

**补记（本轮自捕获 · 1 处 · eng-designer）**：§2.10 可读性登记行原文的「两条命令行 >300」（V-8 增入后实为 **3**：V-1 / V-3 / V-8）与「本节其余行 ≤300」（§2.3 靶实核等记录长行本即 >300）两处陈述与实测不符 ⇒ **就地收正为无计数表述**（判「可接受」口径与「`docs/batches/**` 在机检行宽域外」依据不变）。属本席自捕获（非评审发现），登记在此。

### 2.12 设计档面实施记录（eng-designer · 2026-09-20 · 承 §4 批准「设计档面 → eng-designer」）

**范围** = #142（`TOOLS.md` `:361` / `:363` + 变更记录）· #141 设计档 1 处（`TUI-SESSION-VIEW.md:45` + 变更记录）· J-1 登记（`DOC-DISCIPLINE.md` §3.9 + 变更记录）；**零产品码 · 零需求档 · 零 `scripts/**` · 零他批写域**。**笔法** = 逐处落 + 行内替换 / 单句删 / 追加；`.md` 行宽 ≤300（新增四行实测 98 / 180 / 286 / 173 字符）。

**逐条「设计点 → 改动 file:line」（行号 = 落笔后实读）**

| # | 设计点 | 改动 file:line |
|---|---|---|
| 1 | #142 边界行去划改形保断言（§2.2 逐字） | `docs/core/design/TOOLS.md:363` |
| 2 | #142 对账口径行尾修订式残句删（前文零改） | `TOOLS.md:361` |
| 3 | #142 变更记录 +1 行 | `TOOLS.md:539` |
| 4 | #141 机制契约节号收正（`§14.3.6 段` → `§6.14 段`） | `docs/cli/design/TUI-SESSION-VIEW.md:45` |
| 5 | #141 该档变更记录 +1 行 | `TUI-SESSION-VIEW.md:206` |
| 6 | J-1 残差块 +1 行（§2.3 逐字） | `docs/core/design/DOC-DISCIPLINE.md:498` |
| 7 | 该档变更记录 +1 行 | `DOC-DISCIPLINE.md:1310` |

**验收读数（写后实跑 · cwd = 仓根 · 2026-09-20）**：**V-3** = `TILDE=0 OLD=true NEW=true TAIL=false`（`OLD` 逐值说明见下）· **V-7** = `NEW=true OLD=false` ✓ · **V-4** `node scripts/doc-check.mjs` = **exit 0 · 悬空 0 · 行宽 OK**（候选 18532〔设计基线 18529 · +3——成因不作断言〕· 迁移期引文 211 · 拟新增 8 · 注记豁免 43）· **V-1** = `TOTAL=2`（命中 = `session-store.mjs:278` / `:355` = 判保留集）· **V-2** = `TOTAL=0` · **V-8** = `TOTAL=0`（三者 = 产品码车道现读数，已到终态值；V-5 / V-6 属产品码车道，非本席车道）。**D6 回读**：三档逐处落盘后回读到位；J-1 行与 §2.3 引文**逐字节比对 = true**；`git diff` 复核 = 4 处落点 + 3 档变更记录行，恰 7 处、无附带改动。**D8 自查**：改后段落 / 窗口扫 `~~` / 「已退役 / 已作废」= **0**；`TOOLS.md` 全档 `~~` = 0；档内其余「已退役」= 既有行（`TOOLS.md:105` / `:196` / `:473` · `DOC-DISCIPLINE.md` 规则 / 历史面 9 处）——非本批改集，未触。**行数 Δ（实测）**：`TOOLS.md` +1 · `TUI-SESSION-VIEW.md` +2 · `DOC-DISCIPLINE.md` +2。

**V-3 `OLD=true` 说明（判据 ∥ 盘面相抵 · 上报）**：`OLD` 命中单源 = `TOOLS.md:522`（2026-09-18 #62 批**变更记录**行内史实指称「不做跨仓自动发现」）——行属记录面、`DOC-DISCIPLINE.md:311`「B 史实保留 = 变更记录行**零触碰**」⇒ 本批不动；**现役规范面零命中**（`:363` 已去）。V-3 期望 `OLD=false` 系全档口径与 B 类行相抵 ⇒ 判据建议收窄至现役面（留复核 / 收口轮裁定）。

**偏离声明（上报）**：① **Δ 计数**——§2.4 Δ 列记 +1 / +1 / +1；实测 **`TOOLS` +1 / `TUI-SESSION-VIEW` +2 / `DOC-DISCIPLINE` +2**：`DOC-DISCIPLINE` +2 = §2.4 未计的**同档变更记录 1 行**（承上批 §3 轮次 1 发现 5 口径「§3.9-only 登记类改动亦配变更记录行」+ 本批派单明示「+ 变更记录 +1 行」）、`TUI` +2 = 变更记录 1 行 + 条目间空行 1（该档 `:204`–`:206` 空行分隔体例）。② `:361` 删尾句时**存句句末 `。` 保留**（长句终止符归存句；零语义差）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：`docs/batches/2026-09-20-hygiene-sweep-2-batch.md` §2 全段（§2.0–§2.10）+ 受影响文件表 + V-1~V-7；评审对象声明（⑤-1 / ⑤-4 已裁 · ⑤-5 / ⑤-6 已另行入账除外）为准。
**抽验（按判据对盘实读/实扫）**：V-1 正则实扫三树 = core 26 + cli 13 + vsc 11 = **50 行命中**、跨行形 +1（`read-history.mjs:277-278`）⇒ 与「52 实例 / 改 50 留 2」逐数吻合；映射靶（`docs/core/design/SESSION.md` §6.9–§6.14 = `:161`/`:169`/`:188`/`:199`/`:208`/`:216`）逐条吻合；#143 陈名形族实扫**恰 5 处**（与改集一致）、正靶 `AGENT-LOOP-SUBAGENT.md` `## 6.10` 在 `:183`、真同形先例 `advisor.mjs:167` 实核在位；#141 缺 `agent/advisor.mjs` · 实址 `agent-tools/advisor.mjs` 成立；`TOOLS.md` `~~` 仅 `:363` 一处、`:361` 退役句与 §2.2 描述逐字相符；J-1 落点（`DOC-DISCIPLINE.md:497` 之后）确在残差块内；行宽域实核（`PROJECT-MANIFEST.json` checkConfig scanDirs=["docs"] · exclude=["_archive","batches"]）⇒ `docs/batches/**` 确在行宽闸外。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Scope coverage | 🔴 | 已裁项 ⑤-4（「族界外 11 处=并入本批」）未落进 §2：`docs/batches/2026-09-20-hygiene-sweep-2-batch.md:256`（§2.7）仍把「§2.9 域外面（§7/§8 旧编号…）」列为**本批不做**；`:271`（§2.9-④）与 `:284`（§2.10 遗留）仍写「未列改集，待裁」；改集（`:207` 29 档 / 54 处）无该 11 处坐标入列，受影响文件表缺 `thincoder-cli/src/cli/make-agent.mjs` · `thincoder-cli/src/tui/index.mjs` · `thincoder-cli/src/tui/render-frame.mjs` · `thincoder-vscode/src/extension/panel-turn-stages.mjs` 4 档；V-1（正则仅 §9–§14）/ V-2（仅 `§6.10`）对该面**零验收覆盖** ⇒ 按现文实施将漏做已裁决面。 | 把该 11 处并入改集（坐标已在 `docs/batches/2026-09-20-hygiene-sweep-2-batch.md:271`；映射 §7→§6.7 / §8→§6.8 对盘实核成立）、受影响文件表补 4 行并同步总计数、补一条覆盖 §7/§8 形的机判（或扩 V-1 正则并更新期望命中集）、§2.7 / §2.9-④ / §2.10 三处状态句改为已裁口径。 |
| 2 | 计数纪律（D3）/ Doc hygiene | 🟡 | §2.0 失效计数仍在位：`docs/batches/2026-09-20-hygiene-sweep-2-batch.md:47`「49 处 / **27 档**」、`:53`「4 行改 + 2 行增」「54 处 / **30 档**」；更正只在下游 `:207` / `:281`（「以本行为准」）⇒ 现役面留失效值 + 下游修订式修正（批内列表已改、计数未就地同改）。 | §2.0 / `:53` 就地改正三处计数（并在 ⑤-4 并入后复核总口径）；下游 as-of 说明可留。 |
| 3 | 一致性（注记计数） | 🔵 | `docs/batches/2026-09-20-hygiene-sweep-2-batch.md:86`「例外（去子号 **4 处**）」与实况不符——实为 **6 处**（core 4 + vsc `thincoder-vscode/src/agent/run-helpers.mjs:207` · `thincoder-vscode/src/agent/setup.mjs:424`，见 `:145` / `:148`）；逐处表权威 ⇒ 不阻塞实施。 | 注记改为「6 处（core 4 + vsc 2）」。 |
| 4 | Affected-file size annotations | 🔵 | 抽验通过：`thincoder-core/context.mjs` **495** · `thincoder-core/provider/core.mjs` **491** · `thincoder-vscode/src/agent/setup.mjs` **495** · `docs/core/design/TOOLS.md` 538 · `docs/core/design/DOC-DISCIPLINE.md` 1308 · `docs/cli/design/TUI-SESSION-VIEW.md` 220 · `thincoder-core/agent-tools/advisor.mjs` 280 · `agent-tools/advisor-async.mjs` 481 均与盘吻合；全 Δ=0、无一越 500。惟 `:227`「尺寸标注（面别 / 拆分计划）豁免（行数零变）」宽于判据豁免面（判据仅豁免纯 .md）——9 档越 300 咨询线（495 / 491 / 495 / 441 / 440 / 389 / 331 / 321 / 309）无拆分 advisory 注记。 | 补一句 advisory 登记（越 300 咨询线 · 无一越 500 · 批内 Δ=0，同一批口径），或收窄「豁免」字样为拆分计划豁免。 |
| 5 | Evidence boundary（非缺陷） | 🔵 | 本评审环境无 shell：V-4（基线「悬空 0 · 行宽 0 · 候选 18529 · 迁移期引文 211」）与 V-6（三包 `npm test`）未独立复跑；已独立核实其域前提：`PROJECT-MANIFEST.json` checkConfig（scanDirs ["docs"] · exclude ["_archive","batches"]）⇒ `docs/batches/**` 确在行宽域外，`§2.5` 两条 >300 字符命令不触 V-4 闸。 | 实施 / 收口轮按原命令实跑补证。 |
| 6 | 确认项（评审应答） | 🔵 | `:173`（§2.2）提请确认的 `:361` 同族 +1 处**确在射程**：属 D8 禁形（「已退役」挂尸——`docs/core/design/DOC-DISCIPLINE.md:23` + 细则 `:27` 逐字禁「已作废 / 裁撤」挂尸）；KD-4（`:363` 判活）对盘实核成立（§6.12 仍不做发现，发现层 = `docs/core/design/TOOLS.md:365`–`:383` §6.13）。 | 无（确认项）。 |

**计数：🔴 ×1 · 🟡 ×1 · 🔵 ×4**（🔴 未清 ⇒ 本轮不签 token）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 复核（评审子代理）**——复核对象 = §2.11 修正轮 6 条落点（🔴×1 / 🟡×1 / 🔵×4）；方法 = 本轮 fresh 读批档全段 + 三树正则实扫 + 受影响档尾计数对盘；**不重开全量评审**。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/batches/2026-09-20-hygiene-sweep-2-batch.md | 🔴 | Fixed | ⑤-4 并入五项**全落**：①改集行 `:48`「**11 处 / 4 档新增**（另 2 档已计于上行——共涉 6 档）」+ `:54`「eng-coder = **65 处 / 33 档**」②新表 `:164`–`:180`（11 行）③§2.4 `:245`/`:246` 补 4 档（`thincoder-cli/src/cli/make-agent.mjs` **214** · `thincoder-cli/src/tui/index.mjs` **482** · `thincoder-cli/src/tui/render-frame.mjs` **408** · `thincoder-vscode/src/extension/panel-turn-stages.mjs` **177**——本轮尾计数逐值吻合）④V-8 `:261` + T9 `:275` ⑤状态句 `:279`（§2.7 已去「§7/§8 旧编号」不做项）· `:294`（§2.9-④ 改「**已裁（父侧 · 2026-09-20）：并入本批改集**」）· `:304`/`:307`（§2.10 直陈计数 · 遗留只余 §2.9-③）。**机判实证（本轮实扫）**：V-8 正则实扫三树 = 恰 11 命中、逐条 = 新表 11 行（cli 9 + vsc 2 · core 0；如 `thincoder-cli/bin/thincoder.mjs:159`: "// SESSION.md §8 D-S4（F4）+ MODEL-MERGE-SESSION：headless 无 TUI —— 可读错误 + 退出码 1，"）⇒ 基线「TOTAL=11 = 改集全部 11 处」成立、改后 0 可达（改后形 = `§6.7`/`§6.8`，不触 `§\s*[78]`）；映射实核 = `docs/core/design/SESSION.md:144`: "### 6.7 会话标题生成" · `:148`: "### 6.8 会话恢复时 provider/model 无效 → 模型重选"，保留子号在 `:153`/`:155`/`:157` 在位（`:157`: "- **D-S4 headless**（`thincoder chat`）：遇无效 defaultModel → `console.error` 可读消息 + `exitSoon(1)`（不弹 UI、明确退出码）。"）⇒ 无撞号主张成立；V-1 实扫仍 = 26+13+11 = 50、V-2 实扫仍 = 5（`thincoder-core/agent-tools/advisor.mjs:218`: "// ED-4（2026-09-16 · AGENT-LOOP.md §6.10）：排队 ack——模型可见状态如实 queued +"）；全域 §7/§8 另 1 命中 = `thincoder-cli/CHANGELOG.md:152`（记录面 · 在扫描域外） |
| 2 | 2 | docs/batches/2026-09-20-hygiene-sweep-2-batch.md | 🟡 | Fixed | `:47`「**49 处 / 26 档**（三树）」· `:54`「（3 行改 + 3 行增）；eng-coder = **65 处 / 33 档**」；旧值（27 档 / 4 行改 + 2 行增 / 54 处 / 30 档 / 以本行为准 / 未列改集 / 待裁）在现役面（§2.0–§2.10）零命中；`:226`（§2.4 表头）与 `:304`（§2.10 计数行）直陈值 |
| 3 | 3 | docs/batches/2026-09-20-hygiene-sweep-2-batch.md | 🔵 | Fixed | `:87`「**例外（去子号 6 处 · core 4 + vsc 2）**：…vsc `src/agent/run-helpers.mjs:207` · `src/agent/setup.mjs:424`」✓ |
| 4 | 4 | docs/batches/2026-09-20-hygiene-sweep-2-batch.md | 🔵 | Fixed | `:248`「拆分计划：**豁免**（行内替换 · 结构未变 · 批内 Δ=0——消解条件 = 该档下次实质改动时）；**advisory 登记**：**12 档越 300 咨询线**（495 / 495 / 491 / 482 / 481 / 441 / 440 / 408 / 389 / 331 / 321 / 309），无一越 500 硬限」——12 值 = §2.4 表 >300 全量（逐值相符）；9→12 差额说明（+481/+482/+408）成立 |
| 5 | 5 | — | 🔵 | Maintained（非缺陷） | 证据边界无需改：V-4/V-6 本环境无 shell 不可独立复跑；`:334` 已记修正轮实跑读数（悬空 0 · 行宽 0 · 候选 18529 · 迁移期引文 211） |
| 6 | 6 | — | 🔵 | Maintained（确认项） | §2.11 行 6 记「无需改」✓ |
| 7 | (new) | docs/batches/2026-09-20-hygiene-sweep-2-batch.md | 🔵 | New（非阻塞 · 可选收正） | `:334`「族扫描：V-1 `TOTAL=50` · V-2 `TOTAL=5` · V-8 `TOTAL=11`（后两者 = 改集前基线）」——三值同为改集前读数，括注仅覆盖「后两者」易被读成 V-1=50 为改后读数（V-1 期望 = `TOTAL=2` ∧ 命中 ⊆ 判保留集，见 `:254`）⇒ 建议括注覆盖三者或删括注 |

**计数**：🔴 0（原 🔴1 已清）· 🟡 0（原 🟡1 已清）· 🔵 2 已清 + 1 新增（非阻塞）· 2 维持（非缺陷 / 确认项）——6/6 落点逐条复核完毕，修正未引入 🔴。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 15:5x 父侧代签** —— 用户 14:40「**全自动跑到下午五点**」+ 15:26「**下一步**」⇒ 本批**设计评审点火权 + §4 批准权**均在授权射程内（窗口 → 17:00）。

**三条件核验**：① 评审 **pass**（id=71 changes-required 🔴1 → 修正轮 id=72 **6/6** → **复核 id=73 pass**：🔴 五项（改集行 `:48` · 新表 `:164`–`:180` · §2.4 补 4 档 · V-8 实证 **TOTAL=11** · 三处状态句）逐项对盘实核 ✓）② 修正轮已落地并经父侧逐条核验 ✓；③ **token 已签发**（值不落档——运行时凭证）✓。

**批准范围**：本批全量。**实施分两面**：**设计档面**（`TOOLS.md` `:361`/`:363` D8 残句 · `TUI-SESSION-VIEW.md:45` 指称 · `DOC-DISCIPLINE.md` J-1 登记 + 2 档变更记录）→ **eng-designer** ✓；**产品码注释面**（**65 处 / 33 档**：三树 §9–§14 改指 + 族界外 §7/§8 并入 11 处 + #143 陈名形 5 处）→ **eng-coder + token** ✓。两路皆已派发 ✓。
## §5 实施记录（eng-coder）

**轮次 = initial（2026-09-20 · cwd = 仓根 `D:\teamcode\thincoder`）** · 车道 = **产品码注释面**（eng-coder + token）· 改法 = **行内替换 · 其余字面逐字保留 · 行数零变**（R1/R2/R3/R4）· **全落点均为 `//` / `*` 注释**（含 `bin/thincoder.mjs:10` = JSDoc 入口块，非 USAGE 串）⇒ 零行为面。

### 5.1 交付摘要（逐族 · 处数 → file:line 区间 → Δ）

| 族 | 处数 | 档数 | file:line 区间 | Δ |
|---|---|---|---|---|
| **#141 三树 §9–§14 改指**（§2.1 三表） | **49** | 26 | **core 25**：`agent/family-tools.mjs:149` · `agent/setup-reminders.mjs:3` · `agent/setup.mjs:81`/`:131` · `agent-tools/read-history.mjs:2`/`:5`/`:9`/`:25`/`:35`/`:36`/`:49`/`:56`/`:59`/`:116`/`:145`/`:278`（跨行形第二行）· `context.mjs:172`/`:177`/`:282` · `escape.mjs:134` · `generate-title.mjs:107` · `provider/core.mjs:124` · `session-gc.mjs:2` · `session-segments.mjs:4` · `session-store.mjs:3` | **0** |
| | | | **cli 13**：`bin/thincoder.mjs:10`/`:323`/`:326`/`:417` · `src/acp/handlers-session.mjs:148` · `src/acp/handlers-slots.mjs:91`/`:147` · `src/tui/startup.mjs:121` · `test/integration/session-resume.test.mjs:158`（**删指称 · R2**）· `test/read-history-guard.test.mjs:2`/`:17` · `test/session-store.test.mjs:2` · `test/setup-reminders.test.mjs:2` | | 
| | | | **vsc 11**：`src/agent/run-helpers.mjs:207` · `src/agent/setup-reminders.mjs:48`/`:101` · `src/agent/setup.mjs:424`/`:428`/`:436`/`:464` · `src/extension/panel-session.mjs:39` · `src/extension/session-io.mjs:85` · `src/extension/session-slots.mjs:103` · `test/setup-reminders.test.mjs:2` | |
| **#141 族界外同因**（§7→§6.7 · §8→§6.8） | **11** | 4 档新增（共涉 6 档） | **cli 9**：`bin/thincoder.mjs:159`/`:317` · `src/cli/make-agent.mjs:130`/`:178` · `src/tui/index.mjs:48`/`:461` · `src/tui/render-frame.mjs:43`/`:391` · `src/tui/startup.mjs:209` ／ **vsc 2**：`src/extension/panel-turn-stages.mjs:114`/`:123` | **0** |
| **#143 陈名形改指**（`AGENT-LOOP.md §6.10` → `AGENT-LOOP-SUBAGENT.md §6.10`） | **5** | 3 | `agent-tools/advisor-async.mjs:23`/`:283`/`:371` · `agent-tools/advisor.mjs:218` · `test/advisor-pool-queue.test.mjs:2` | **0** |
| **合计** | **65** | **33** | — | **0** |

**坐标漂移**：逐处按**内容回读定位**——65 处坐标实读与 §2.1/§2.2 表**零漂移**（坐标收正 1 处：台账 #143 记 `agent/advisor.mjs`，实址 `agent-tools/advisor.mjs` 按 §2.3 执行 ✓）。

### 5.2 机判读数（先红 → 后绿 · 本席实跑）

| 判据 | 改集前 | 改集后 | 期望 | 判 |
|---|---|---|---|---|
| **V-1** #141 死形 | `TOTAL=50`（core 26 · cli 13 · vsc 11）| **`TOTAL=2`** —— 命中恰 `session-store.mjs:278`/`:355` ⊆ 判保留集 | `TOTAL=2` ∧ ⊆ 判保留集 | ✅ |
| **V-2** #143 死名 | `TOTAL=5` | **`TOTAL=0`** | `TOTAL=0` | ✅ |
| **V-8** 族界外 §7/§8 | `TOTAL=11`（= 改集全部 11 处）| **`TOTAL=0`** | `TOTAL=0` | ✅ |
| **V-4** 机检净增 | 悬空 0 · 行宽 0 | **悬空 0（闸态——阈值 0）· 行宽 0（源域全部 .md 无 >300 字符单行）** | 净增 0 | ✅ |
| **V-5** 行数零变 | — | `git diff --numstat` **33/33 档全 N/N**（增=删）；贴线档 `context.mjs` 495 · `provider/core.mjs` 491 · vsc `setup.mjs` 495 悉数未变 | = §2.4 表值 | ✅ |
| **V-6** 三包 | — | **core 447/447 · cli 745/745 · vsc 854/854**（fail 0 · cancelled 0 · skipped 0）| 全绿 | ✅ |
| **V-7** TUI 档面（设计席车道 · 顺手核）| — | `NEW=true OLD=false`（`TUI-SESSION-VIEW.md:45` = `（§6.14 段）`）| `NEW=true OLD=false` | ✅ |
| **V-3** #142 文档面（设计席车道 · 顺手核）| — | `TILDE=0 · NEW=true · TAIL=false`；**`OLD=true` 系 §2.5 V-3 期望过宽**——命中处 = `TOOLS.md:522` **变更记录行**（历史面合法保留旧措辞），现役 `:363` 已去划改形、无该短语 | `TILDE=0 OLD=false NEW=true TAIL=false` | ⚠️ 见 5.5-⑥ |

**补证（非 §2.5 判据 · 本席附加）**：改指靶存在性实核 = `docs/core/design/SESSION.md` `### 6.7`:144 · `### 6.8`:148 · `### 6.9`:161 · `### 6.10`:169 · `### 6.11`:188 · `### 6.12`:199 · `### 6.13`:208 · `### 6.14`:216（= 映射表逐值）；`docs/core/design/AGENT-LOOP-SUBAGENT.md:183` = `## 6.10 回合外事件后台化统一模型（分域池 + async advisor）`；`AGENT-LOOP.md` 顶层节面 = §1–§8（`## ` 实读）⇒ 原 token `AGENT-LOOP.md §6.10` 确为死名。`docs/core/design/SESSION.md:386`「§14.6 … §14.7 …**一次性批次材料**」⇒ R2 删指称有据。

### 5.3 决策透明表

| # | 情形 | 处置 | 依据 |
|---|---|---|---|
| 1 | 65 处坐标与设计表逐处相符 | 按表逐处落（未自造改法） | §2.1 R1/R2/R3/R4 + 映射表 |
| 2 | `read-history.mjs:36` 同句双 `§13`——仅 `SESSION.md §13` 属「档名+节号」 token | 只改档名绑定处；行首裸形 `§13 R19` 判保留 | §2.7 裸形面（无档名 §NN）· 族定义 |
| 3 | `session-store.mjs:5` `§14.3.1` · `session-segments.mjs:5` `§14.5` · `setup-reminders.mjs:6`/`:8` 等裸形旧号 | 零触（另轮读数域）→ 坐标清单上抛（5.5-①） | §2.7 · `DOC-DISCIPLINE.md:431` |
| 4 | 判保留面：`session-store.mjs:278`/`:355` 日志串 · `_archive/**` · 两 `CHANGELOG.md` · 批档既有行 | 零触（实读实测：保留面 `git diff --stat` = 仅他批档记录，`_archive`/CHANGELOG **零 hunk**）| §2.1 判保留面 · §2.9-③ |
| 5 | 设计席车道（`TOOLS.md` · `TUI-SESSION-VIEW.md` · `DOC-DISCIPLINE.md`） | 未触；实读其已由设计席落盘 | §2.0 / §4 车道表 |
| 6 | V-5 判据给「read 尾计数**或等价** node 计数」 | 取 `git diff --numstat` N/N（等价且更强：直接证增删行数相等） | §2.5 V-5 |
| 7 | 贴线档禁增行 | 65 处全为行内替换，**零增行**（numstat 佐证） | §2.1 R4 |

### 5.4 审计与评审轮次 / 终态

- **内部分歧审计（`explore` · 只读 · 1 轮）**：**VERDICT = clean** —— 65/65 **全量**对盘（非抽样）、§2.4 集合 ⟷ 触档集合**相等**（无列表外档）、6 处去子号例外与保号面逐处在位、判保留面在位、无自造改法；其工具边界（无 shell）留下的 git 半面由本席实跑补：`numstat` 33/33 全 N/N + 保留面零 hunk。
- **内部 advisor 代码评审（`type=code` · 33 档 + 4 档文档 · 1 轮）**：**VERDICT = pass** —— 🔴×0；🟡×2（裸形残差坐标入册 · 12 档越 300 咨询线，**均标「非阻塞/不重开裁定」**）；🔵×4。其 `[host-verified] 0/2 citations` 系**路径基准差**（审计侧用仓根相对路径、host 从工作区根解析 ⇒ 报 `file unreadable`）；两处引文经本席实读复核为真（`thincoder-cli/test/read-history-guard.test.mjs:2` · `thincoder-vscode/src/agent/setup.mjs:436`）。
- **fix round = 0**（无 🔴 / 无 must-fix；🟡/🔵 全部指向**下一轮范围裁定**或已登记项，不构成本轮返工依据）。
- **终态 = `clean`**。

### 5.5 上抛项（父侧裁）

1. 🟡 **#141 裸形残差坐标入册**：本次改过的同档同段仍余**裸形旧号**（`agent/setup-reminders.mjs:6` `§10 D-1` · `:8` `§11.2` · `:13` `§11.1`；`agent-tools/read-history.mjs:36` 行首 `§13 R19`；`session-gc.mjs` 约 15 处 `§12.x`；`session-store.mjs` 约 12 处 `§14.3.x`；`context.mjs:42` `§9 D-T1/D-T2`；vsc `src/agent/setup-reminders.mjs:52` 等）。§2.7 已判「另轮读数域」⇒ 非本轮返工依据；**建议**在批档 §2.9 或 `DOC-DISCIPLINE.md` §3.9 残差块补一行 #141 坐标清单，并把下轮 sweep 判据从「行内正则」改「**档级绑定**」（按档内最后出现的档名归属）——V-1/V-8 行内正则天然看不见裸形/跨行绑定。
2. 🟡 **12 档越 300 咨询线**（495/495/491/482/481/441/440/408/389/331/321/309 · 无一越 500）——§2.4 已登记 ⇒ 维持，不重开裁定。
3. 🔵 `session-store.mjs:278`/`:355` 判保留文案（用户可见诊断行仍带死指称）——到期条件在册（运行期文案面独立裁定轮）。
4. 🔵 `generate-title.mjs:64` `docs/design/SESSION.md §IK9UZ8-D`（**死路径 + 旧决策号** · 产品码全域唯一残留）——建议下轮并入。
5. 🔵 **域外同因 `AGENT-LOOP.md §11.x`**：`advisor-async.mjs:369` 与 `advisor.mjs:50`（运行期/模型可见串）+ `advisor.mjs:6`/`:153`/`:171`（裸形）+ 域外档 `subagent-async.mjs:116`——实读 `AGENT-LOOP.md` 顶层节面无 §11 ⇒ 同根因未收净（#143 族仅覆盖 `§6.10` 形，故 V-2 判 0 合规）；建议下轮扩面（正靶候选 = `AGENT-LOOP-SUBAGENT.md §6.10`）。
6. 🔵 **V-3 判据口径**：现跑 `OLD=true` 命中 `TOOLS.md:522` **变更记录行**（历史面 · 合规保留）⇒ 建议 §2.5 V-3 期望收窄至**现役段**（或在判据中排除 `## 变更记录` 之后的记录面），否则该判据在任何「变更记录如实记述旧措辞」的正确实现上都会误红。

## §6 验证与收口（父代理）

**2026-09-20 16:1x 父侧收口**

**交付核验（两面四道）**：设计（#70 · 重扫 52 实例）✓ · 评审（id=71 changes-required 🔴1）→ 修正轮（#72 6/6 + V8=11 实证）→ 复核（id=73 **pass**）✓ · **实施两路**：**设计档面（#74）**✓——7/7 落（`TOOLS.md` `:361`/`:363` + 变更记录 · `TUI-SESSION-VIEW.md:45` + 变更记录 · `DOC-DISCIPLINE.md:498` + 变更记录）；**产品码面（#75）**✓——**65/65 落 / 33 档全 N/N**（#141 49 + 族界外 11 + #143 5）· 零修正轮 ✓

**读数（先红 → 后绿）**：**V-1 50 → 2**（= 判保留集 ✓）· **V-2 5 → 0** ✓ · **V-8 11 → 0** ✓ · V-4 `doc-check` exit 0 · 锛 0 · 行宽 0 ✓ · V-5 numstat **33/33 N/N**（贴线档 495/491/495 未变 ✓）· V-6 三包 **core 447 / cli 745 / vscode 854** 全绿 ✓ · V-7 NEW=true OLD=false ✓ · 禁止范围零触 ✓

**父侧裁定与采纳**：① 两车道**并行交叉验证**（设计档面跑出产品码车道的终态值——互为独立取证 ✓）；② **V-3 口径收窄**（`OLD` 命中 `TOOLS.md:522` 变更记录行史实指称 = 记录面合规保留 ✓ 不为凑判据改记录面 ✓）⇒ 收口轮随改；③ Δ 计数 as-built 差异（`+1 / +2 / +2`）⇒ 随行收正

**台账**：**#141 / #142 / #143 → 已核销** ✓

**遗留（显式）**：① 新族入账：裸形残差坐标册（**#146**）· 域外同因 `AGENT-LOOP.md §11.x`（**#147**）；② 收口轮随改：V-3 期望收窄至现役段 · §2.4 Δ 列 as-built 收正；③ 12 档越 300 咨询线维持登记 ✓。

**提交**：待入库（本笔 + 后批）。
