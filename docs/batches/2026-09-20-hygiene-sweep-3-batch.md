# 2026-09-20 · 卫生族三批（HYGIENE-SWEEP-3-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 18:3x · 来源 = 用户 18:34「**可以，继续吧**」+ 台账 **#144 / #145 / #146**（三条为今晚卫生族扫出的收尾族）。
> 本档 = **死指称/残句收尾**三则；**#147 不并入**（含提示词/模型可见串面 ⇒ 需用户口径 ⇒ 保持独立在册 ✓）。

## §1 讨论（主 agent）

### 1.0 用户授权（**父侧代点火 + 代批准** · 时限 **跑到干完**）

**用户原话**（14:40 → 17:03）「**全自动跑到下午五点**」→「**自动跑到干完吧**」+（18:34）「**可以，继续吧**」⇒ 授权沿用于本批：设计评审点火权 + §4 用户批准权均**委托父侧自动执行**，直到本批收口 ✓。

**父侧自缚（代签条件）**：① 仅当「评审 **pass（0 🔴）** ∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备时代签；② 每次代签在 §4 写明依据；③ 需**新范围**（本批之外）或**用户口径裁决** ⇒ 停下 ✓。

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目（3 条）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#144** | **双死指称 1 处** | `thincoder-cli/src/tui/generate-title.mjs:64` 引 `docs/design/SESSION.md §IK9UZ8-D`——**路径前缀不在现行树**（现行 = `docs/core/design/` ✗）**+ 节号非节号形** ✗（疑 UI 元素 ID ✓）。同因（对象迁移后指称未收）不同形 ⇒ 出 #141 族界 ✓。 |
| 2 | **#145** | **D8 划改/挂尸形域外族（4 处 / 2 档）** | ① `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:217` / `:224`（`~~…~~` + 「已 …」句 ✗）② `docs/vsc/design/WEBVIEW.md:312`–`:313`（「覆旧…判定 / 旧判定…退场」式 ✗ · §5.3 规范面）。**判例已钉**：协议消息面（`WEBVIEW-PROTOCOL.md:548`）**不动** ✓ · 记录面（`:591`「原记」）**照留** ✓。 |
| 3 | **#146** | **裸形残差坐标族** | 同档**无档名裸形**旧节号：`setup-reminders.mjs:6`/`:8`/`:13` · `read-history.mjs:36` 行首 · `session-gc.mjs` ~15 处 · `session-store.mjs` ~12 处 · `context.mjs:42` 等。**判据升级（已裁）**：下轮用**档级绑定**口径（行内正则看不见裸形/跨行形 ✗）。 |

### 1.2 边界与硬要求

- **不触**：行为面 / 产品逻辑（注释与文档字面 ✓）· `scripts/**` · 归档档内容（可引 ✓）· 已收口面条款 · 他批写域 · **#147 族**（另册 ✓）。
- **车道**：① + ②（`VSC-MIGRATION-INVENTORY` / `WEBVIEW` = 设计档面 ✓）· ③（产品码注释面 = eng-coder + token ✓）—— #144 若判属产品码注释面 ⇒ 随 ③ 车 ✓。
- **机械约束**：逐处按**内容回读定位** ✓；`.md` 行宽 ≤300 ✓；`.mjs` 贴线档禁增行 ✓（硬限 500 ✓）。

### 1.3 验收（方向）

① 逐条「台账 id → 改动 file:line 或判保留理由」；② **#146 按档级绑定口径**给出逐档读数（替代行内正则 ✗）；③ `doc-check` 净增 0（锚 0 · 行宽 0）；④ 三包全绿（③车道）；⑤ D8 自查。

### 1.4 台账

#144 / #145 / #146 → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

**轮次 = initial**（修正轮 = 定点 · 追加制）· 任务书 = 本档 §1 全段 · 台账 = **#144 / #145 / #146** · 设计 = 本节；**不另立长驻设计档**（单批施工材料随批档承载——先例 = `2026-09-20-hygiene-sweep-batch.md` §2 · `2026-09-20-hygiene-sweep-2-batch.md` §2；本批零新语义）。行号一律 **as-of 2026-09-20 本轮实读**（坐标漂移普遍；改法均按**内容回读定位**）。

### 2.0 面判定与车道（实测路由）

| 条目 | 实测面 | 处数 / 档数 | 执行 |
|---|---|---|---|
| #144 双死指称 | **产品码注释面**（`thincoder-core/generate-title.mjs`） | 2 处 / 1 档（另 1 处判保留） | **eng-coder + token**（③ 车）|
| #145 D8 划改/挂尸形 | **设计档面**（`docs/vsc/design/` 2 档） | 4 处 / 2 档 + 变更记录 2 行 | **设计席** |
| #146 裸形残差 | **产品码注释面**（三树 · 承 sweep-2 改集 33 档） | **改集 88 处 / 14 档**（族 A 62 · 族 B 12 · 族 C 9 · 族 D 5）· 判保留 ~40 · 登记 4 族 | **eng-coder + token**（③ 车 · 与 #144 同车）|

⇒ 产品码面合计 = **90 处 / 15 档**（#144 的 2 处 + #146 的 88 处——generate-title 为两族共档）。全批**零行为面**（只改注释 / 文档字面）；产品码面按 fail-closed 走 token 门。**禁增行**（贴线档实测见 §2.4）。

### 2.1 #144 —— `generate-title.mjs` 双死指称（1 处 + 同因 1 处）

**坐标收正（实读）**：台账坐标 `thincoder-cli/src/tui/generate-title.mjs:64` **盘上无此档**（`thincoder-cli` 全树无 `generate-title`）；实存两档 = `thincoder-core/generate-title.mjs`（核实现）∥ `thincoder-vscode/src/extension/generate-title.mjs`（端壳转口）。台账句内容逐字 = **`thincoder-core/generate-title.mjs:64`** ⇒ 按实址执行。

**真义实读（台账「疑 UI 元素 ID」不确——见 §2.9-2）**：`:61`–`:64` 注释 = 「max_tokens 100 = ~2.5x headroom」的**设计决策指称**；`IK9UZ8` = **变更号**（实证：`thincoder-cli/CHANGELOG.md:354` / `thincoder-vscode/CHANGELOG.md:270`「IK9UZ8 思考型模型标题生成」），`§IK9UZ8-D` = 归档档旧节号（`thincoder-cli/docs/_archive/design/SESSION.md:234`「## 7. 会话标题生成（IK9UZ8——已实现）」）与变更号的混合陈名形 ⇒ **双死**（路径前缀 + 节号形）。

**改法（改指 · 行内替换 · 行数零变）**：

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1 | `thincoder-core/generate-title.mjs:64` | `docs/design/SESSION.md §IK9UZ8-D` → `docs/core/design/SESSION.md` §6.7 |
| 2 | `thincoder-core/generate-title.mjs:74` | `PROVIDER.md §21` → `PROVIDER.md §6.17`（同因发现 · 提请评审确认并入——见 §2.9-3）|

**改指靶实核**：`docs/core/design/SESSION.md` §6.7「会话标题生成」= `:144`–`:146`（「标题请求**显式禁用思考**…且 **`max_tokens` 30→100**，双端同修」——与 `:61`–`:64` 注释逐义对应 ✓）；`docs/core/design/PROVIDER.md` §6.17「请求头装配（`provider.headers`）」= `:241`（旧号 §21 实证 = 归档 `PROVIDER.md:1099`「## 21. 请求头装配」）。**IK9UZ8 变更号随句去**（两 CHANGELOG 在册 · 无活注册面——D8：失效表达删除）。

**判保留（1 处）**：`:5` `§2.5 #163 并入` —— 绑定档 = `CORE-UNIFICATION.md`（`§2.5` 在档 `:260` · 活号）⇒ 保留。

### 2.2 #145 —— D8 划改/挂尸形（4 处 / 2 档）

**判据** = `DOC-DISCIPLINE.md` §3.9 D8 行：「现役规范面禁修订式残句；一个失效表达必须删除；历史归记录面」。**判例（不动 · 实读确认）**：`WEBVIEW-PROTOCOL.md:548` = 协议消息面（活 · 非同物）· `WEBVIEW.md:591`「原记」= 变更记录行（记录面）——**均零触** ✓。

| # | 坐标 | 判 | 改法（活断言 → 去划改形保留断言） |
|---|---|---|---|
| 1 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:217` | **去划改形** | 目标列 `⚠ ~~归属疑变~~ → **D3 裁定（2026-09-15）：维持现状**` → `**D3 裁定（2026-09-15）：维持现状**`（裁定句 = 活断言 ✓；该行「本行销项不并」理由列零改）|
| 2 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:224` | **去划改形** | 目标列 `⚠ ~~归属疑变~~ → **D2 裁定（2026-09-15）：VSC 专有面**` → `**D2 裁定（2026-09-15）：VSC 专有面**`（同上；「另落 `docs/vsc/requirements/FEATURES.md`」零改）|
| 3 | `docs/vsc/design/WEBVIEW.md:312` | **去修订框架 · 保活断言** | 节头 `**射程收正（2026-09-19 · 本批——覆旧「键含模型段 ⇒ 不可单源重建」判定）**` → `**射程（2026-09-19）**`；冒号后正文（端侧键 = `sub:<role>#<id>` 可单源重建 ⇒ 纳入补桩射程）**逐字保留** |
| 4 | `docs/vsc/design/WEBVIEW.md:313` | **删句**（无活命题） | 整行删——「旧判定『键含模型段』= 误按 CLI / TUI 形态 …⇒ 双块风险不成立；`skip-key-unrebuildable` 痕随之退场」= 修订式残句；其活事实已双载：① 正面陈述 = 改后 `:312`（可单源重建）② 痕退场 = `:303` kind 族「**退场一类**：`skip-key-unrebuildable`」在册（D2 单源）⇒ 零信息丢失 |

**变更记录**：`WEBVIEW.md` +1 行（`:551` 变更记录节）；`VSC-MIGRATION-INVENTORY.md` 改 → 变更记录**落主档** `VSC-MIGRATION.md:163`（该档头注 `:6` 声明「变更记录住主档」）**+1 行**。两行内容 = 「2026-09-20（卫生族三批 · 台账 #145 · eng-designer）：D8 划改/修订式残句清理（2 处去划改形保裁定 + 2 处去修订框架/删残句）；**零新语义**。」

### 2.3 #146 —— 裸形残差坐标族（档级绑定 · 逐档闭合读数）

#### 2.3.1 口径（档级绑定 —— 替代行内正则）

- **族定义**：**无档名（裸形）`§N` 指称**（含跨行形），其目标文档按**档级绑定**判定——即按**改集档所属机制**绑定到该机制的权威文档（档头注 / 域），再看该文档**现行节面**是否含该号；ⓐ 旧号（死）→ 入改集；ⓑ 活号 → 判保留；ⓒ 属已在册他族（如 §3.9 J-1 残差）→ 登记（另轮）。
- **读数域** = **sweep-2 ③ lane 改集 33 档**（承台账「本次改过的同档」——逐档闭合实读，非抽样）；域外档不在本批射程（登记）。
- **判类**：**改指**（行内替换 · 其余字面逐字保留 · 行数零变——承 sweep-2 R1/R4）· **删指称**（仅限无活靶；**本批 0 处**——族内全部有活靶）· **判保留 + 理由** · **登记**（另轮）。
- **绑定档与映射**：族 A = `docs/core/design/SESSION.md`（映射承 sweep-2 §2.1 表：§10→§6.10 · §11.x→§6.11 · §12.x→§6.12 · §13.x→§6.13 · §14.x→§6.14）；族 B = `docs/core/design/CONTEXT-COMPACTION.md`（§8→§6.9 · §9→§6.4④ · §9.5→§6.4④ · §6 note→§6.4③ · §7 D-C1/D-C2→§6.8——逐靶实读见下）；族 C = `docs/core/design/PROVIDER.md`（§12→§6.12 · §13→§6.13 · §14.x→§6.14 · §15→§6.15 · §16→§6.16——旧号实证 = 归档 `PROVIDER.md` 逐节实读）；族 D = `docs/cli/design/TUI-SESSION-VIEW.md`（TUI 旧 §15.3.x → §5.3/§5.4——实读 `:138` / `:146` 逐义对应）。
- **子号去留**：承 sweep-2 KD-2——无撞号者保留（D-V1 / review #N / T3/T12 / D-R4 / R19 / 事实 4 等）；**同节两 token 去重**（先例 = sweep-2 vsc `setup.mjs:464`「§11.1/§11.2 → §6.11（同节去重）」）。

#### 2.3.2 逐档闭合读数（as-of 本轮实读 · 处数口径 = 裸形 `§N` token 数，同 token 复现按次计）

| # | 档 | 裸形读数 | 改集 | 判保留 | 登记 | 备注 |
|---|---|---|---|---|---|---|
| 1 | `thincoder-core/agent/setup-reminders.mjs` | 10 | **6** | 4 | 0 | 保留 = §2.6/§2.5/架构 §2.4（MANIFEST/ARCHITECTURE 活号）|
| 2 | `thincoder-core/agent/setup.mjs` | 9 | 0 | 9 | 0 | 保留 = §6.10 修法 B（MEMORY.md 活）+ §2.3D/§2.3F + 蓝图 §3.1–§3.4（PROMPT-SYSTEM 活）|
| 3 | `thincoder-core/agent/family-tools.mjs` | 13 | 0 | 6 | 7 | 登记 = §18×3 / §19×5 / §25（J-1 残差族）|
| 4 | `thincoder-core/agent-tools/read-history.mjs` | 4 | **4** | 0 | 0 | — |
| 5 | `thincoder-core/context.mjs` | 17 | **12** | 3 | 2 | 保留 = §6.14×3（活）；登记 = §18.6 + §6 note 待核 1（见下②）|
| 6 | `thincoder-core/escape.mjs` | 0 | 0 | 0 | 0 | 唯一引用已 bound 且活 ✓ |
| 7 | `thincoder-core/generate-title.mjs` | 3 | **2** | 1 | 0 | 见 §2.1 |
| 8 | `thincoder-core/provider/core.mjs` | 17 | **8** | 4 | 5 | 登记 = §18.6×4 / §20.3（J-1 族）|
| 9 | `thincoder-core/session-gc.mjs` | 18 | **18** | 0 | 0 | 台账记 ~15 ⇒ 实读 18 |
| 10 | `thincoder-core/session-segments.mjs` | 3 | **3** | 0 | 0 | — |
| 11 | `thincoder-core/session-store.mjs` | 14 | **12** | 2 | 0 | 保留 = `:278`/`:355` 日志串（承 sweep-2 §2.9-③）|
| 12 | `thincoder-core/agent-tools/advisor-async.mjs` | 20 | 0 | 8 | 12 | 登记 = §11.2/§17/§17.5/§20.3/§29/§29.1/§8 等（J-1 族 + 批内部号）|
| 13 | `thincoder-core/agent-tools/advisor.mjs` | 15 | 0 | 5 | 10 | 同族；§6.10/§6.21 活号保留 |
| 14 | `thincoder-core/test/advisor-pool-queue.test.mjs` | 0 | 0 | 0 | 0 | 已 bound ✓ |
| 15 | `thincoder-cli/bin/thincoder.mjs` | 3 | **1** | 2 | 0 | 保留 = `:376` 待核（见下②）+ `:406`（ACP-CLIENT 活）|
| 16 | `thincoder-cli/src/acp/handlers-session.mjs` | 8 | 0 | 8 | 0 | 绑定 = ACP-CLIENT.md §11.x（活号）|
| 17 | `thincoder-cli/src/acp/handlers-slots.mjs` | 5 | 0 | 5 | 0 | 同上（§11.3/§6.1/§2.2）|
| 18 | `thincoder-cli/src/tui/startup.mjs` | 10 | **9** | 1 | 0 | 保留 = `:170`（TUI-SESSION-VIEW §5.5 活）|
| 19 | `thincoder-cli/src/tui/index.mjs` | 9 | 0 | 0 | 9 | 登记 = TUI 旧号 §14.3/§15.3.x 其余面 + §2.30.3.x（他族）|
| 20 | `thincoder-cli/src/tui/render-frame.mjs` | 11 | 0 | 0 | 11 | 同族登记 |
| 21 | `thincoder-cli/src/cli/make-agent.mjs` | 2 | 0 | 1 | 1 | 登记 = `:13` §12.3⑤（批内部号待核）|
| 22 | `thincoder-cli/test/setup-reminders.test.mjs` | 4 | **4** | 0 | 0 | — |
| 23 | `thincoder-cli/test/read-history-guard.test.mjs` | 0 | 0 | 0 | 0 | bound 且活 ✓ |
| 24 | `thincoder-cli/test/session-store.test.mjs` | 0 | 0 | 0 | 0 | 同上 |
| 25 | `thincoder-cli/test/integration/session-resume.test.mjs` | 0 | 0 | 0 | 0 | 同上（TESTING.md §5.4 活）|
| 26 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 7 | **5** | 2 | 0 | 保留 = §6.27.12.5（AGENT-LOOP-SUBAGENT 活）|
| 27 | `thincoder-vscode/src/agent/setup.mjs` | 20 | 0 | 12 | 8 | 登记 = §11.x/§11.2.1 族（VSC 归档面绑定待核 · 见下③）|
| 28 | `thincoder-vscode/src/agent/run-helpers.mjs` | 8 | 0 | 1 | 7 | 登记 = §5 D-4.1 / §11.7 / §19.3 等 |
| 29 | `thincoder-vscode/src/extension/panel-session.mjs` | 6 | **2** | 3 | 1 | 登记 = `:135` §5.1.4（批内部号）|
| 30 | `thincoder-vscode/src/extension/session-io.mjs` | 6 | **2** | 4 | 0 | 保留 = bound 活号 |
| 31 | `thincoder-vscode/src/extension/session-slots.mjs` | 6 | 0 | 5 | 1 | 登记 = `:24` §5 未决（端档内部号）|
| 32 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 6 | 0 | 5 | 1 | 登记 = §17 D-S2 族 |
| 33 | `thincoder-vscode/test/setup-reminders.test.mjs` | 4 | **2** | 0 | 2 | 登记 = `:91` §11 / `:299` §17.7 |

**闭合合计**：改集 **88 处 / 14 档**（族 A 62 · 族 B 12 · 族 C 9 · 族 D 5）；判保留 ~40；登记 4 族（见下）；零改集档 8（含 3 个 test 档读数 0）。

#### 2.3.3 逐处改集清单（旧 → 新 · 全为行内替换 · Δ=0）

**族 A —— SESSION.md 旧号（62 处）**

| # | 坐标 | 旧 → 新 |
|---|---|---|
| 1–6 | `agent/setup-reminders.mjs` `:6` / `:8` / `:13` / `:34` / `:45` / `:46` | `§10 D-1`→`§6.10 D-1` · `§11.2`→`§6.11`（×4）· `§11.1`→`§6.11` |
| 7–10 | `agent-tools/read-history.mjs` `:36` / `:171` / `:200` / `:293` | `§13 R19`→`§6.13 R19` · `§13 D-R19a`→`§6.13 D-R19a`（×2）· `§14.3.7`→`§6.14` |
| 11–28 | `session-gc.mjs` `:14` `:17` `:32` `:36` `:41` `:54` `:78` `:100` `:111` `:124` `:127` `:164` `:171` `:172` `:182` `:193` `:196` `:216` | `§12.x`→`§6.12`（尾随 token 逐字保留：D-V1 / review #N / T3/T12 / 步骤 3）· `§14.3.8`→`§6.14`（`:182`）· `:196` 复合形 `§12.2.3/12.2.4`→`§6.12` |
| 29–40 | `session-store.mjs` `:5` `:22` `:27` `:38` `:49` `:63` `:161` `:226` `:268` `:360` `:381` `:415` | `§14.3.x` / `§14.4`→`§6.14`（尾随 token 逐字保留：单点 / 表 3 候选 1 / 规则 2 / D-R4① / ②③）|
| 41–43 | `session-segments.mjs` `:5` `:11` `:32` | `§14.5`→`§6.14`（×2）· `§14.3.2`→`§6.14` |
| 44 | `thincoder-cli/bin/thincoder.mjs:308` | `§10（R4）`→`§6.10（R4）` |
| 45–47 | `thincoder-cli/src/tui/startup.mjs` `:159` / `:172` / `:228` | `§14.1 事实 4 / §14.3.6`→同节去重为 `§6.14 事实 4`（其余字面保留）· `§14.3.6`→`§6.14`（×2）|
| 48–51 | `thincoder-cli/test/setup-reminders.test.mjs` `:6` / `:73` / `:106` / `:163` | `§11.2`→`§6.11`（×4）|
| 52–56 | `thincoder-vscode/src/agent/setup-reminders.mjs` `:50` `:52` `:57` `:64` `:65` | `§10 D-1`→`§6.10 D-1` · `§11.1`→`§6.11` · `§11.2`→`§6.11`（×3）|
| 57–58 | `thincoder-vscode/test/setup-reminders.test.mjs` `:7` / `:104` | `§11.2 测试段`→`§6.11 测试段`（×2）|
| 59–60 | `thincoder-vscode/src/extension/session-io.mjs` `:193` / `:197` | `§14.3.8`→`§6.14`（×2）|
| 61–62 | `thincoder-vscode/src/extension/panel-session.mjs` `:217` / `:250` | `§10 D-5`→`§6.10 D-5` · `§10 D-2`→`§6.10 D-2` |

**族 B —— CONTEXT-COMPACTION.md 旧号（12 处 · `context.mjs`）**

| # | 坐标 | 旧 → 新 | 靶实读 |
|---|---|---|---|
| 1 | `:42` | `§9 D-T1/D-T2` → `§6.4④ D-T1/D-T2` | D-T1/D-T2 定义 = §6.4④（`:85`–`:96`）|
| 2–3 | `:43` / `:46` | `§8` → `§6.9` | 摘要 ≤1K（D13）= §6.9（`:127`–`:134`）|
| 4 | `:47` | `§9 D-T2` → `§6.4④ D-T2` | 同上 |
| 5–6 | `:56` | `§9 D-T1` → `§6.4④ D-T1` · `（B 口径 §9.5）` → `（B 口径 §6.4④）` | B 口径定义 = §6.4④ F1（`:88`）|
| 7 | `:99` | `§9 D-T1` → `§6.4④ D-T1` | 同上 |
| 8 | `:114` | `§9 D-T1` → `§6.4④ D-T1` | 同上 |
| 9 | `:147` | `§9 D-T1` → `§6.4④ D-T1` | 同上 |
| 10 | `:150` | `(§6 note)` → `(§6.4③)` | 配对保护 = §6.4③（`:83`）|
| 11 | `:361` | `§7 D-C1` → `§6.8 D-C1` | D-C1 定义 = §6.8（`:121`）|
| 12 | `:396` | `CONTEXT-COMPACTION.md §7 D-C1/D-C2` → `…§6.8 D-C1/D-C2` | 同上 |

**族 C —— PROVIDER.md 旧号（9 处 · `provider/core.mjs` 8 + `context.mjs` 1）**

| # | 坐标 | 旧 → 新 | 靶实读 |
|---|---|---|---|
| 1–4 | `provider/core.mjs` `:67` / `:286` / `:310` | `§14.2 设计值`→`§6.14` · `§14.3 失败可见性`→`§6.14` · `:310` 同节两 token（§14.3 / §14.2）→ 去重 `§6.14` | 旧 §14.2/§14.3 实证 = 归档 `PROVIDER.md:373` / `:384`；现靶 §6.14（`:214`）|
| 5 | `provider/core.mjs:120` | `PROVIDER.md §15`→`PROVIDER.md §6.15` | 旧 §15 = 归档 `:425` → 现 §6.15（`:219`）|
| 6 | `provider/core.mjs:153` | `PROVIDER.md §13`→`PROVIDER.md §6.13` | 旧 §13 = 归档 `:301` → 现 §6.13（`:203`）|
| 7 | `provider/core.mjs:221` | `PROVIDER.md §12`→`PROVIDER.md §6.12` | 旧 §12 = 归档 `:277` → 现 §6.12（`:182`）|
| 8 | `provider/core.mjs:360` | `PROVIDER.md §16 M1`→`PROVIDER.md §6.16 M1` | 旧 §16 = 归档 `:445` → 现 §6.16（`:225`）|
| 9 | `context.mjs:52` | `PROVIDER.md §15 T-C2`→`PROVIDER.md §6.15 T-C2` | 同上 |

**族 D —— TUI 旧号（5 处 · `thincoder-cli/src/tui/startup.mjs`）**

| # | 坐标 | 旧 → 新 | 靶实读 |
|---|---|---|---|
| 1 | `:6` | `TUI.md §15.3.3` → `TUI-SESSION-VIEW.md §5.3/§5.4` | §5.3 落点表「恢复 / 翻页」行（`:138`）+ §5.4 总量对账（`:146`）|
| 2–3 | `:135` / `:182` | `§15.3.3` → `§5.3` | 同上 |
| 4 | `:147` | `§15.3.4` → `§5.4` | 同上 |
| 5 | `:193` | `§15.3.3` → `§5.3` | 同上 |

#### 2.3.4 判保留（理由分列）

- **日志 / 运行期串面**（越「只碰注释」边界 ⇒ 不改）：`session-store.mjs:278` / `:355`（含 `SESSION.md §14.4 D-R4`——承 sweep-2 §2.9-③ 在册，改法已备）。
- **活号裸形（绑定档在档 · 号活）**：`setup-reminders.mjs` 的 §2.6/§2.5/架构 §2.4 · `setup.mjs` 的 §6.10 修法 B（MEMORY.md §6.10 `:382`）+ §2.3D/§2.3F + 蓝图 §3.1–§3.4（PROMPT-SYSTEM.md）· `provider/core.mjs` 的 §6.9/§6.12/§9.6/§9.9（MODEL-SPECS §9.6 `:532` / §9.9 `:632`）· `context.mjs` 的 §6.14×3 · 各档 ACP-CLIENT §11.x（§11 节面在档 `:406`–`:627`）· `startup.mjs:170` §5.5 · `thincoder-mjs:406` §11.2 改法 4（ACP-CLIENT）等。
- **绑定档未能唯一裁定（不改——错指 > 死指；登记待核）**：`bin/thincoder.mjs:376`（`§11.2 交付行数债`——会话批 §11.2 ∥ ACP-CLIENT §11.2 两读不可唯一裁定）· `context.mjs:150`（已按 §6.4③ 改指——hmm 见 2.3.3 #10，本项移出）· `panel-session.mjs:135` §5.1.4 等批内部号（各档登记表在册）。

#### 2.3.5 登记（另轮 · 不入本批改集）

- **① J-1 残差族（AGENT-LOOP.md 旧号 · 带前缀 + 裸形同域）**：`family-tools.mjs` §18/§19/§25 · `provider/core.mjs` §18.6×4 · §20.3 · `context.mjs:405` §18.6 · `advisor-async.mjs` / `advisor.mjs` 的 §11.2/§17/§20.3/§29 等 —— 已在 `DOC-DISCIPLINE.md` §3.9 J-1 残差块在册（消解径 = 扩面轮；到期条件 = `docs/core/design/` 下次板块级 sweep）⇒ **本批只登记不复述**。
- **② VSC 侧 §11.x/§12.x/§17 族（绑定待核）**：`thincoder-vscode/src/agent/setup.mjs`（§11.2 A/D · §11.2.1 · §11.1②）· `run-helpers.mjs`（§11.7/§11.2.1/§5 D-4.1）· `panel-turn-stages.mjs`（§17 D-S2）· `test/setup-reminders.test.mjs`（§17.7）——实读两候选绑定（SESSION §6.11 ∥ VSC 归档 AGENT-LOOP 面）**不可唯一裁定** ⇒ 登记（下一产品码注释轮按档级绑定逐档实核）。
- **③ TUI 旧号其余面**：`tui/index.mjs`（§14.3 / §15.3.1/§15.3.2 / TUI.md §6 / §2.30.3.x）· `tui/render-frame.mjs`（§14.3 族 / §7.2.1 / §15）——本批只实核 `startup.mjs` 两 sub 靶（§5.3/§5.4）⇒ 余面登记。
- **④ 域外档**：改集 33 档之外的裸形面（三树其余档 + `docs/**`）不在本批射程（台账「同档」界）⇒ 登记。

### 2.3.6 前段（§2.0–§2.3）自捕获收正（本席 · 落笔后复读所得）

1. **§2.3.4 第 3 条为草稿残留**（含未定标记）⇒ 以本行为准（覆写）：**绑定档未能唯一裁定（不改——错指 > 死指；登记待核）**：`bin/thincoder.mjs:376`（`§11.2 交付行数债`——会话批 §11.2 ∥ ACP-CLIENT §11.2 两读不可唯一裁定）· 批内部号若干（`panel-session.mjs:135` §5.1.4 · `make-agent.mjs:13` §12.3⑤ · `test/setup-reminders.test.mjs:91` §11 · `session-slots.mjs:24` §5）。**`context.mjs:150` 不在本条**——已按 §6.4③ 入改集（§2.3.3 族 B #10）。
2. **计数收正（口径统一 = token）**：§2.0 车道表与 §2.3.2/§2.3.3 的合计数收正为 **改集 89 处**（族 A **63**——原记 62：`startup.mjs:159` 双 token 去重行按 2 处计）· **产品码面合计 = 91 处 / 15 档**（#144 2 + #146 89）；`#146 改集 = 89 处 / 14 档`。
3. **§2.3.2 行 5（`context.mjs`）收正**：读数 **16** · 改集 **12** · 判保留 **3**（`§6.14`×3）· 登记 **1**（`§18.6`）。

### 2.4 受影响文件表（行数口径 = `read` 末行含末行；as-of 2026-09-20——sweep-2 收口实读 + 本轮抽读复核）

**设计档面（3 档）**

| 档 | 现行数 | Δ | 内容 |
|---|---|---|---|
| `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | 494 | 0 | `:217` / `:224` 目标列去划改形（行内替换）|
| `docs/vsc/design/WEBVIEW.md` | 614 | **0**（`:313` 删行 −1 ∧ 变更记录 +1）| §5.3 两处修订式残句清理 + 变更记录 1 行 |
| `docs/vsc/design/VSC-MIGRATION.md` | 200 | **+1** | 变更记录 1 行（INVENTORY 改的登记落主档——该档头注 `:6` 声明「变更记录住主档」）|

**产品码面（15 档 · 全为行内替换 ⇒ Δ=0）**

| 档 | 行数 | 档 | 行数 |
|---|---|---|---|
| `thincoder-core/agent/setup-reminders.mjs` | 199 | `thincoder-cli/bin/thincoder.mjs` | 441 |
| `thincoder-core/agent-tools/read-history.mjs` | 309 | `thincoder-cli/src/tui/startup.mjs` | 297 |
| `thincoder-core/session-gc.mjs` | 248 | `thincoder-cli/test/setup-reminders.test.mjs` | 331 |
| `thincoder-core/session-store.mjs` | 441 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 138 |
| `thincoder-core/session-segments.mjs` | 99 | `thincoder-vscode/test/setup-reminders.test.mjs` | 321 |
| `thincoder-core/context.mjs` | **496**（`read` 口径；`find` 口径 495）| `thincoder-vscode/src/extension/session-io.mjs` | 221 |
| `thincoder-core/provider/core.mjs` | **491** | `thincoder-vscode/src/extension/panel-session.mjs` | 295 |
| `thincoder-core/generate-title.mjs` | 123 | — | — |

全为 `.mjs` ⇒ 拆分计划：**豁免**（行内替换 · 结构未变 · 批内 Δ=0——消解条件 = 该档下次实质改动时）；**advisory 登记**：**7 档越 300 咨询线**（496 / 491 / 441 / 441 / 331 / 321 / 309），**无一越 500 硬限**；无新增档。

### 2.5 验收标准（逐条回指 §1.3）与可跑命令（cwd = 仓根 · 全 ASCII）

| # | 判据 | 命令（逐字可跑） | 期望 |
|---|---|---|---|
| **V-1** | #144 死指称零命中（正反判）| `node -e "const t=require('fs').readFileSync('thincoder-core/generate-title.mjs','utf8');console.log('OLD='+t.includes('\u00a7IK9UZ8-D'),'NEW='+t.includes('docs/core/design/SESSION.md'),'S67='+t.includes('\u00a76.7'),'P21='+t.includes('PROVIDER.md \u00a721'),'P617='+t.includes('PROVIDER.md \u00a76.17'))"` | `OLD=false NEW=true S67=true P21=false P617=true` |
| **V-2** | #145 D8 正反判 | `node -e "const fs=require('fs');const a=fs.readFileSync('docs/vsc/design/VSC-MIGRATION-INVENTORY.md','utf8'),b=fs.readFileSync('docs/vsc/design/WEBVIEW.md','utf8');console.log('TILDE1='+(a.split('~~').length-1),'TILDE2='+(b.split('~~').length-1),'N1='+a.includes('\u5f52\u5c5e\u7591\u53d8'),'F1='+b.includes('\u8986\u65e7'),'O2='+b.includes('\u65e7\u5224\u5b9a'),'D3='+a.includes('D3 \u88c1\u5b9a\uff082026-09-15\uff09'),'D2='+a.includes('D2 \u88c1\u5b9a\uff082026-09-15\uff09'),'SHEJI='+b.includes('\u5c04\u7a0b\uff082026-09-19\uff09'))"` | `TILDE1=0 TILDE2=0 N1=false F1=false O2=false D3=true D2=true SHEJI=true` |
| **V-3** | #146 旧号零命中（改集 15 档闭合）| `node -e "const fs=require('fs');const files=['thincoder-core/agent/setup-reminders.mjs','thincoder-core/agent-tools/read-history.mjs','thincoder-core/session-gc.mjs','thincoder-core/session-store.mjs','thincoder-core/session-segments.mjs','thincoder-core/context.mjs','thincoder-core/provider/core.mjs','thincoder-core/generate-title.mjs','thincoder-cli/bin/thincoder.mjs','thincoder-cli/src/tui/startup.mjs','thincoder-cli/test/setup-reminders.test.mjs','thincoder-vscode/src/agent/setup-reminders.mjs','thincoder-vscode/test/setup-reminders.test.mjs','thincoder-vscode/src/extension/session-io.mjs','thincoder-vscode/src/extension/panel-session.mjs'];const re=/\u00a7\s*1[0-4](?![0-9])/g;let n=0;for(const f of files){fs.readFileSync(f,'utf8').split('\n').forEach((l,i)=>{const m=l.match(re);if(m){n+=m.length;console.log('HIT '+f+':'+(i+1)+' '+m.join(','));}});}console.log('TOTAL='+n);"` | `TOTAL=3` ∧ 命中 ⊆ 判保留白名单（`session-store.mjs:278` / `:355` · `bin/thincoder.mjs:376`）|
| **V-4** | 机检净增 0（锚 / 行宽）| `node scripts/doc-check.mjs` | 尾部 `OK(锚): 0 条悬空` ∧ `OK(行宽)` ∧ exit 0（基线 = 设计轮实跑：候选 18576 · 注记豁免 43 · 拟新增 8 · 迁移期引文 211）|
| **V-5** | 行数零变（贴线档）| `node -e "const fs=require('fs');for(const f of ['thincoder-core/context.mjs','thincoder-core/provider/core.mjs','thincoder-core/session-store.mjs','thincoder-vscode/src/agent/setup.mjs'])console.log(f+'='+fs.readFileSync(f,'utf8').split('\n').length)"` | = 落笔前实读基线（设计表值 496 / 491 / 441 / 495——Δ=0）|
| **V-6** | 套件级 | 三包 `npm test`（core / cli / vscode）| 全绿；失败集合 ⊆ 批前基线（口径 = A-MS6）|

**靶存在性前置门（T7 判据）**：落笔前逐靶 `grep -c` ≥1（`SESSION.md` §6.10/§6.11/§6.12/§6.13/§6.14 · `CONTEXT-COMPACTION.md` §6.4④/§6.8/§6.9 · `PROVIDER.md` §6.12–§6.17 · `TUI-SESSION-VIEW.md` §5.3/§5.4）——任一缺失 ⇒ 判违规（错指比死指更坏）。

### 2.6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 场景 | 期望 |
|---|---|---|---|
| T1 | 正常 | V-1 复跑 | `OLD=false NEW=true S67=true P21=false P617=true` |
| T2 | 正常 | V-2 复跑 | `TILDE1=0 TILDE2=0 N1=false F1=false O2=false` ∧ 三个正形在场 |
| T3 | 正常 | V-3 复跑 | `TOTAL=3` ∧ 命中 ⊆ 白名单 |
| T4 | 边界 | 复合 / 跨行形三例：`session-gc.mjs:196`（`§12.2.3/12.2.4`）· `session-store.mjs:381`（长括注）· `read-history.mjs:36`（行首裸形）| 改后逐处回读 = §2.3.3「新」列逐字 |
| T5 | 边界 | 判保留面（日志串 2 · 待核 1 · J-1 族 · 域外档）| `git diff` 对白名单面**零 hunk**；advisor 两档零 diff |
| T6 | 边界 | 贴线档（496 / 491 / 441 / 495）| V-5 同值（行数不变）|
| T7 | 错误 | 改指靶拼写漂移（如 `§6.14` 误写 `§6.1`）| 判违规——落笔前目标锚存在性回读（前置门）|
| T8 | 错误 | 改后 V-3 出现白名单外命中 | 判违规（引入新死形）|
| T9 | 正常 | V-4 复跑 | 悬空 0 · 行宽 0（净增 0）|

### 2.7 边界（本批不做）

行为面 / 产品逻辑（③只碰注释、②只碰文档字面）· **提示词面 / 模型可见串面**（#147 族 ⇒ 另册）· `scripts/**` · 归档档内容（`_archive/**` 可引不触）· 冻结批档 · 需求档（主 agent 笔）· 他批写域 · **§3.9 J-1 残差族**（含模型可见位点——在册另轮，本批只登记）· **VSC §11.x/§12.x 族 / TUI 旧号余面**（绑定待核——登记）· 记录 / 归档面（两 CHANGELOG · 批档 · 日志串）· 改集 33 档之外的域外档。

### 2.8 关键决策记录（含否决）

- **KD-1 档级绑定口径**（判据单源）：裸形 `§N` 的靶按**档所属机制**绑定（档头注 / 域），再对靶档现行节面判死活——**行内正则判据被否**（台账已裁：看不见裸形 / 跨行形；本批实证 = `read-history.mjs:36` 行首形 · `session-gc.mjs:196` 复合形）。
- **KD-2 改指优先 · 改写面最小**：行内替换 + 其余字面逐字保留（含尾随 token：D-V1 / review #N / T3/T12 / D-R4 / R19 等——承 sweep-2 KD-2 子号去留两分）；**本批 0 处删指称**（族内全部有活靶）。
- **KD-3 车道 = fail-closed**：产品码注释面 ⇒ eng-coder + token——不因「只改注释」降级（承 sweep-2 KD-3）。
- **KD-4 他族不越界**：J-1 在册族 / 绑定未裁定族 ⇒ **登记不改**——错指比死指更坏；判保留承「只碰注释」边界（日志串 / 模型可见串零触）。
- **KD-5 已否方案**：① 全仓裸形 sweep（否决——跨族爆炸 + J-1 在册 + 台账「同档」界）② 只改台账点名 5 档（否决——闭合读数要求改集全档；点名仅为抽样例）③ 泛化行内正则判据（否决——见 KD-1）④ 给全部裸形补档名（否决——改写面大、增噪声）⑤ 判保留项一并改（否决——越边界）⑥ 补节面使旧号复活（否决——承 `WORKSPACE.md` / `LOGGING.md` 先例口径）。

### 2.9 不一致 / 域外发现（报告面 · 逐条）

1. **台账 #144 坐标不在盘**：`thincoder-cli/src/tui/generate-title.mjs` 全树无该档 ⇒ 实址 = `thincoder-core/generate-title.mjs:64`（内容逐字相符）；同族另存端壳档 `thincoder-vscode/src/extension/generate-title.mjs`（其 `:7` 引 `§2.5 #163 / §2.13.4 #163` = CORE-UNIFICATION.md 活号 ⇒ 判保留）。
2. **#144 台账「疑 UI 元素 ID」不确**：`IK9UZ8` = **变更号**（两 CHANGELOG 实证）；`§IK9UZ8-D` = 归档档旧 §7 节号与变更号的混合陈名形 ⇒ 按「改指现行核档对应节」处置（§2.1）。
3. **超台账点名的同因项（提请评审 / 父侧确认并入——默认并入 · 可独立撤销）**：`generate-title.mjs:74` `PROVIDER.md §21`（旧号）· `provider/core.mjs` 带档名旧号 4 处（§12/§13/§15/§16）· `context.mjs:52` `PROVIDER.md §15`——均属「对象迁移后指称未收」同因；先例 = 卫生族二批「族界外同因 11 处 · 已裁并入改集」。
4. **#145 台账描述与实读一处不符**：台账记「`~~…~~` + 「已 …」句」——实读 `:217` / `:224` = `~~归属疑变~~` + **裁定句**（无「已 …」）；同表「已并入（批 N）」状态族（`:200`–`:223` 各行）= **状态记录非修订式** ⇒ 判不动（台账所言「已 …」句若指此族 ⇒ 按本判据处置）。
5. **#146 台账读数 vs 实读（净增）**：`session-gc.mjs` 记 ~15 ⇒ 实读 **18** · `setup-reminders.mjs` 记 3 ⇒ **6**（补 `:34` / `:45` / `:46`）· `read-history.mjs` 记 1 ⇒ **4**（补 `:171` / `:200` / `:293`）· `session-store.mjs` 记 ~12 ⇒ **12 改集 + 2 判保留**——成因不作断言（候选 = 扫描域 / 行内正则 / grep 行上限——同 #138/#141 类）。
6. **域外登记（另轮 / 待核）**：J-1 残差族（`advisor-async` / `advisor` / `family-tools` / `provider/core` §18.6/§20.3 / `context.mjs:405`）· VSC §11.x/§12.x 族（`src/agent/setup.mjs` · `run-helpers.mjs` · `agent-state.mjs`——实读两候选绑定：SESSION §6.11 ∥ VSC 归档 AGENT-LOOP 面）· TUI 旧号余面（`tui/index.mjs` · `render-frame.mjs`）· 改集 33 档之外档。
7. **观察项（判保留 + 登记）**：`docs/vsc/design/VSC-MIGRATION.md:155` 节头「（D4——**批 5 已裁定并执行**）」= 修订式**框架**同因异档（台账点名 2 档之外）——判：**状态陈述**（非失效表达）⇒ 保留；提请评审确认是否随同因族另行处置。
8. **机检基线（本轮实跑）**：`node scripts/doc-check.mjs` ⇒ 悬空 **0** · 行宽 **0** · exit 0（候选 18576 · 注记豁免 43 · 拟新增 8 · 迁移期引文 211）——设计轮零新增；`WEBVIEW.md` 全域 `~~` 实读 = 0（D8 残形在该档以「覆旧 / 旧判定」措辞存在，非 `~~` 形 ✓）。
9. **贴线读数收正**：`context.mjs` **496**（`read` 口径）/ `provider/core.mjs` **491** / `bin/thincoder.mjs` **441**——本批全为行内替换 ⇒ 零贴线风险（硬限 500）。

### 2.10 设计轮自检（D6 回读 + 机检读数 + 计数收正 + 可读性登记）

- **D6 回读**：§2 两段落档后逐段复读完成；§2.3.6 收正块 = 复读所得（自捕获 3 项）。
- **机检读数**：见 §2.9-8（净增 0）。
- **计数（D3 · 三处同口径）**：改集 **89 处 / 14 档**（族 A 63 · 族 B 12 · 族 C 9 · 族 D 5）· 产品码面 **91 处 / 15 档**（+ #144 2 处）· 设计档面 4 处 / 2 档 + 变更记录 2 行 —— §2.0 · §2.3.2 · §2.3.3 三处一致（§2.3.6 已收正）。
- **可读性登记**：本节 >300 字符行 = 命令行（§2.5 V-1/V-2/V-3/V-5——命令不可折行，折行即不可跑）与记录长行；本档在机检行宽域外 ⇒ 判可接受。
- **设计席 D8 自查**：本节无修订式残句（「旧 → 新」表 = **变换规格**；差异叙述均带 as-of / 日期锚；无 `~~` / 无「已作废」挂尸；§2.3.6 = 收正块非划改形）。
- **遗留**：判保留 3（日志串 2 + 待核 1）· 登记 4 族（§2.3.5）· §2.9-3 提请确认项 · §2.9-7 观察项。

### 2.11 机判基线实跑 + V-3 期望收正（追加制 · 本席）

**实跑（2026-09-20 · cwd = 仓根 · pre-fix 基线）**：

- **V-3**（§2.5 逐字命令）⇒ **`TOTAL=77`** 命中，逐行清单 77 条在案（会话内实跑输出）。
- **V-1**（§2.5 逐字命令）⇒ `OLD=true S67=false P21=true`（死形与旧号现行在位 ✓ 判据可跑）。
- **V-4**（§2.5 逐字命令）⇒ 悬空 **0** · 行宽 **0** · exit 0（候选 18576 · 注记豁免 43 · 拟新增 8 · 迁移期引文 211）。

**V-3 期望收正（以求值口径 · 前段 §2.5 所记 `TOTAL=3` 为未跑基线时的估值 ⇒ 本条为准）**：

- **改后期望 = `TOTAL=8`** ∧ 命中 ⊆ 白名单 **8 命中**（余项不存在的判据 = 改集全落）：
  1. `thincoder-core/session-store.mjs:278` — 日志串（判保留 · 承 sweep-2 §2.9-③）
  2. `thincoder-core/session-store.mjs:355` — 同上
  3. `thincoder-cli/bin/thincoder.mjs:376` — `§11.2 交付行数债`（绑定待核 · §2.3.4）
  4. `thincoder-cli/bin/thincoder.mjs:406` — `§11.2 改法 4`（ACP-CLIENT §11.2 活号 ⇒ 保留）
  5. `thincoder-vscode/test/setup-reminders.test.mjs:91` — `§11 hydrate`（待核 · §2.3.5-②）
  6. `thincoder-vscode/src/extension/panel-session.mjs:10` — `VSC-DEBT §12.2.4`（bound 活号 ⇒ 保留）
  7. `thincoder-vscode/src/extension/panel-session.mjs:28` — 同上
  8. `thincoder-vscode/src/extension/panel-session.mjs:105` — `§11.2.1`（待核 · §2.3.5-②）
- **对账（D3）**：77 = 改集 **69**（regex 射程面 = §10–§14；即 §2.3.3 族 A 63 + 族 C 的 §12/§13/§14 六处）+ 保留/登记 **8**（上列白名单）✓。
- **射程外项（V-3 不覆盖 · 由 T7 靶存在性门 + 逐处回读覆盖）**：族 B 12 · 族 C 的 §15/§16 三处 · 族 D 5 —— 改后逐处回读判据 = §2.3.3 表「新」列逐字。
- **计数复核**：改集 89 = 69（V-3 射程）+ 12（族 B）+ 3（族 C §15/§16）+ 5（族 D）✓（三处同口径：§2.0 / §2.3.2 / §2.3.3 / 本节）。

### 2.12 §3 发现表逐条落地（**修正轮 1** · eng-designer · 定点 · 追加制）

**任务书** = 本档 §3 发现表 10 条（🔴×1 / 🟡×5 / 🔵×4；父侧逐条裁定接受 · `Suggestion` 列 = 处置建议，执行人 = 本席）· 行号一律 **as-of 2026-09-20 本轮实读**（内容回读定位）· 零新语义（除「§2.4 登记档补入」与「`DOC-DISCIPLINE.md` 登记行/变更记录规划」——均为评审已裁项）。

#### 发现 1（🔴）—— V-2 期望两条不可达 ⇒ **改期望值 + 逐条注明命中来源**

**实读（本轮）**：`docs/vsc/design/VSC-MIGRATION-INVENTORY.md:186` 逐字含「归属疑变」（`承主档 §7.2 D4 归属疑变的父侧裁定`——**跨档历史指称 · 记录面 · 不在改集**：改集仅 `:217`/`:224`）；`docs/vsc/design/WEBVIEW.md:604` 逐字含「覆旧」（`终态补桩**射程含 consult / escalate**（覆旧登记）` = 2026-09-19 批**变更记录行** · 记录面）⇒ 原期望 `N1=false` / `F1=false` 与盘相抵（**不可达**）；**不为凑判据改 `:186` / `:604`**（越界 ⇒ 否决）。

- **§2.5 V-2 期望（本条为准 · 取代表内该行期望列）**：`TILDE1=0 TILDE2=0 N1=true F1=true O2=false D3=true D2=true SHEJI=true`
- **命中来源注记（不计判红）**：`N1=true` ← `VSC-MIGRATION-INVENTORY.md:186`（跨档历史指称 · 记录面）· `F1=true` ← `WEBVIEW.md:604`（变更记录行 · 记录面）。
- **§2.6 用例 T2 期望（同轮同步 · 同口径）**：`TILDE1=0 TILDE2=0 N1=true F1=true O2=false` ∧ 三个正形在场（`D3=true` / `D2=true` / `SHEJI=true`）。

**机检断言（全 ASCII）**：

`node -e "const fs=require('fs');const a=fs.readFileSync('docs/vsc/design/VSC-MIGRATION-INVENTORY.md','utf8'),b=fs.readFileSync('docs/vsc/design/WEBVIEW.md','utf8');const L=a.split('\n'),M=b.split('\n');console.log('TILDE1='+(a.split('~~').length-1),'TILDE2='+(b.split('~~').length-1),'N1='+a.includes('\u5f52\u5c5e\u7591\u53d8'),'F1='+b.includes('\u8986\u65e7'),'O2='+b.includes('\u65e7\u5224\u5b9a'),'SRC186='+L[185].includes('\u5f52\u5c5e\u7591\u53d8'),'SRC604='+M[603].includes('\u8986\u65e7'))"`

**期望读数**：`TILDE1=0 TILDE2=0 N1=true F1=true O2=false SRC186=true SRC604=true`（后两项 = 命中来源定位判 · 与前述注记同源）。

#### 发现 2（🟡）—— 逐行补判据/坐标 + `panel-session.mjs:105` 归类统一 + 行 27 交叉引用收正

**统一口径（本条立 · 补 §2.3.1）**：逐档三桶（改集 / 判保留 / 登记）**计入面 = 机制档指称（裸形或带档名）+ 在册他族 token**；**不计入 = 记录面指称（批档 / CHANGELOG / 归档档）**——逐档计入面见下表（D3：列值与逐项枚举同轮）。

| 行 | 档 | 判保留（**承 §2.3.4 第 2 类 · 活号** · 逐项坐标） | 计入面 | 同轮收正（读数/登记列） |
|---|---|---|---|---|
| 3 | `thincoder-core/agent/family-tools.mjs` | **6** = 裸 `§2.15`（`:157`）· `§2.20.3`（`:159`）· `§2.20.2`（`:160`）· `§1`/`§4`/`§6`（`:160`） | 裸形 | 登记 **7→8**（`§19`×5：`:64`/`:81`/`:83`/`:89`/`:131` + `§18`×2：`:78`/`:156` + `§25`×1：`:133`——J-1 族）· 读数 **13→14** · 备注枚举「§18×3」收正为 **×2** |
| 12 | `thincoder-core/agent-tools/advisor-async.mjs` | **8** = 裸 `§6.10`×6（`:238`/`:314`/`:320`/`:332`/`:406`/`:443`）· `§6.9`（`:330`）· `§6.21`（`:439`） | 裸形 | 登记 **12→16**（`§11.2`×6：`:113`/`:175`/`:188`/`:355`/`:361`/`:375` · `§17`（`:7`）· `§17.5`（`:54`）· `§20.3`×3（`:260`/`:401`/`:419`）· `§29.1`（`:132`）· `§29`（`:433`）· `§8`（`:161`）· `§6.11`×2（`:216`/`:226`））· 读数 **20→24** |
| 27 | `thincoder-vscode/src/agent/setup.mjs` | **12** = `:331`（AGENT-LOOP.md §19.5.6）· `:341`（蓝图 §3.1）· `:342`/`:383`/`:389`（蓝图 §3.4）· `:343`（蓝图 §3.3）· `:391`（PROMPT-SYSTEM §3.4）· `:402`（MANIFEST.md §2.2）· `:424`（SESSION.md §6.9）· `:428`/`:436`/`:464`（SESSION.md §6.11） | 含带档名 | 登记 **8** = `§11.x` 族 7 token（`:11`×2 · `:72` · `:76` · `:105` · `:114` · `:245`——VSC 归档面绑定待核）+ 批内部号 1（`:131` §2.10.1）· 读数 20（= 12+8）· **备注交叉引用「见下③」→「见下②」** |
| 28 | `thincoder-vscode/src/agent/run-helpers.mjs` | **1** = `:207`（SESSION.md §6.9——带档名活号） | 含带档名 | 登记 **7→12**（`§5 D-4.1`×5：`:77`/`:78`/`:79`/`:104`/`:126` · `§11.7`×2：`:225`/`:243` · `§19.3`×2：`:24`/`:33` · `§11.2.1`（`:228`）· `§17.3`（`:260`）· `§14.6`/`§14.7`（`:89`——同节计 1））· 读数 **8→13** |
| 29 | `thincoder-vscode/src/extension/panel-session.mjs` | **3** = `:10`/`:28`（VSC-DEBT §12.2.4——带档名活号）+ `:22`（§5.1.4 第 4 条——引用面） | 含带档名 | **`:105` 归类统一 ⇒ 登记**（`§11.2.1`——与 §2.3.5-② 同族：VSC 归档面绑定待核）；登记 **1→2**（`:105` + `:135` §5.1.4——登记面）· 读数 **6→7** |
| 31 | `thincoder-vscode/src/extension/session-slots.mjs` | **5** = `:9`/`:56`/`:103`（SESSION.md §6.10——带档名活号）+ `:17`（MULTI-INSTANCE-COLLAB §3.1）+ `:113`（本档 §5——引用面） | 含带档名 | 登记 **1**（`:24`——本档 §5 未决登记面）· 读数 6（= 5+1） |
| 32 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | **5** = `:114`/`:123`（SESSION.md §6.7——带档名活号）+ `:3`/`:5`/`:12`（VSC-DEBT.md §12.2.1——带档名活号） | 含带档名 | 登记 **1** = `§17`×2（`:104`/`:146`——同节去重计 1 · J-1 族）· 读数 6（= 5+1） |

**判据句（同族共用）**：上表 保留 全部为「**绑定档在档 · 号活**」类（承 §2.3.4 第 2 类）——判保留 = 指向现行节的活指称（非失效表达 ⇒ 不属 D8 射程）；登记 = 属在册他族（J-1 残差 / VSC 归档面绑定待核 / 批内部号）。

**机检断言（坐标存在性 · 全 ASCII）**：

`node -e "const fs=require('fs');const ch=[['thincoder-core/agent/family-tools.mjs',[157,159,160,64,81,83,89,131,78,156,133]],['thincoder-core/agent-tools/advisor-async.mjs',[238,314,320,332,406,443,330,439,113,175,188,355,361,375,7,54,260,401,419,132,433,161,216,226]],['thincoder-vscode/src/agent/setup.mjs',[331,341,342,343,383,389,391,402,424,428,436,464,11,72,76,105,114,245,131]],['thincoder-vscode/src/agent/run-helpers.mjs',[207,77,78,79,104,126,225,243,24,33,228,260,89]],['thincoder-vscode/src/extension/panel-session.mjs',[10,28,22,105,135,217,250]],['thincoder-vscode/src/extension/session-slots.mjs',[9,56,103,17,113,24]],['thincoder-vscode/src/extension/panel-turn-stages.mjs',[114,123,3,5,12,104,146]]];let bad=0;for(const [f,ls] of ch){const t=fs.readFileSync(f,'utf8').split('\n');let n=0;for(const x of ls){if(t[x-1].includes('\u00a7'))n++;else{bad++;console.log('MISS '+f+':'+x)}}console.log(f+' ok='+n+'/'+ls.length)}console.log('BAD='+bad)"`

**期望读数**：七档逐一 `ok=<逐项数>/<逐项数>`（11 / 24 / 19 / 13 / 7 / 6 / 7）∧ 末行 `BAD=0`。

#### 发现 3（🟡）—— 行 5（`context.mjs`）与行 3（`family-tools`）列值以逐处清单为准回改

- **行 5 收正（逐项为准）**：**读数 17 · 改集 13 · 判保留 3 · 登记 1** —— 改集 13 = 族 B 12 处（§2.3.3 族 B #1–#12）+ 族 C #9（`:52`）；判保留 3 = 裸 `§6.14`×3（`:388`/`:391`/`:415`——活号）；登记 1 = 裸 `§18.6`（`:405`——J-1 族）⇒ **17 = 13+3+1** ✓（取代 §2.3.6-3 的「16 · 12 · 3 · 1」）。
- **行 3 收正**见发现 2 表（登记 7→8 · 读数 13→14 · 备注枚举 ×3→×2）。
- **§2.10 / §2.11 同轮复核**：改集 **89 处 / 14 档**（族 A 63 · 族 B 12 · 族 C 9 · 族 D 5）· 产品码面 **91 处 / 15 档** —— §2.0 / §2.3.2 / §2.3.3 / §2.10 / §2.11 同值 ✓（本收正只动「判保留 / 登记」分列与读数，**改集列与闭合合计零变**）。

#### 发现 4（🟡）—— 总账口径收正

**§2.3.2 闭合合计 / §2.0 的「判保留 ~40」⇒ 本条为准**：**判保留 = 表列和 = 91**（逐档「判保留」列列值之和；口径 = 发现 2 所立三桶 + 逐档计入面标注）。原记「~40」= 未闭合估值 **非**表列和 ⇒ 不留。

#### 发现 5（🟡）—— 判例坐标超 EOF 收正（`WEBVIEW-PROTOCOL.md`）

**实读**：该档**共 540 行**（read 口径）⇒ 原判例坐标 `:548` **超 EOF**（盘上无可读行 · 与「实读确认」相抵）。**改指（本条为准）**：**`docs/vsc/design/WEBVIEW-PROTOCOL.md:402`** —— §12 收面表「方向口径」注，逐字含 `原 \`mcpReconnected\` 行随其发射点删除一并退场（…无消费者推送处置 = 删；…原悬空指针随之消失）`：含「退场 / 原…」措辞**而属现役处置口径**（活 · 非同物）⇒ **判不动** ✓。候选同类 = `:468`（§13 方向口径句「删除落地 ⇒ 源零位 ⇒ 表行同步退场」）；`:487` = 变更记录行（记录面——第二判例 `WEBVIEW.md:591`「原记」同形）。

**机检断言（全 ASCII）**：

`node -e "const t=require('fs').readFileSync('docs/vsc/design/WEBVIEW-PROTOCOL.md','utf8').split('\n');console.log('LINES='+t.length,'L402='+t[401].includes('\u9000\u573a'),'L468='+t[467].includes('\u9000\u573a'),'OOB548='+(t.length<548))"`

**期望读数**：`LINES=540 L402=true L468=true OOB548=true`。

#### 发现 6（🟡）—— `DOC-DISCIPLINE.md` 登记面更新（本批落点规划 · 逐字文本）

**先例实读**：卫生族一批 = §3.9 J-1 残差块内**登记行** `:497` ∧ **变更记录行** `:1309`；二批 = `:498` ∧ `:1310` ⇒ 先例形 = **两处各 +1 行**（发现原文「+1 行」按先例实读收正为 **Δ=+2**）。**本批同形照落**（落点 = 设计档面 · 设计席）：

① **§3.9 J-1 残差块内登记行 +1**（逐字文本）：

`- **登记（2026-09-20 · 卫生族三批 · 台账 #146）**：**裸形 §10–§14 子族（89 处 / 14 档 · 三树源码面）已处置**（批档 \`docs/batches/2026-09-20-hygiene-sweep-3-batch.md\` §2）；域外裸形面（改集 33 档之外）与 VSC §11.x/§12.x/§17 待核族 · TUI 旧号余面仍在册，随扩面轮。零新语义。`

② **变更记录 +1 行**（逐字文本）：

`- 2026-09-20（**卫生族三批 · 登记轮 · eng-designer**——承 \`docs/batches/2026-09-20-hygiene-sweep-3-batch.md\` §2）：§3.9 J-1 残差块 +1 行登记——**裸形 §10–§14 子族（89 处 / 14 档 · 三树源码面）已处置**；余面仍在册，随扩面轮。**零新语义**。`

⇒ **§2.4 设计档面补第 4 行**：`docs/core/design/DOC-DISCIPLINE.md` | **1311** | **+2** | §3.9 J-1 登记行 1 行 + 变更记录 1 行（承 `:497`/`:498` · `:1309`/`:1310` 形；该档 J-1 残差块口径明载「裸形面 = 另轮读数域」⇒ 本批登记**只收窄裸形域**，不改该块族定义）。

**机检断言（全 ASCII）**：

`node -e "const t=require('fs').readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8').split('\n');console.log('L23D8='+t[22].includes('D8'),'L25D8='+t[24].includes('D8'),'L497='+t[496].includes('\u5df2\u5904\u7f6e'),'L498='+t[497].includes('\u767b\u8bb0'),'L1309='+t[1308].includes('J-1'),'L1310='+t[1309].includes('J-1'))"`

**期望读数**：`L23D8=true L25D8=true L497=true L498=true L1309=true L1310=true`（先例两处形在档 ⇒ 本批同形可落）。

#### 发现 7（🔵）—— §2.2 判据出处改指

**本条为准**：D8 判据出处 = **`docs/core/design/DOC-DISCIPLINE.md:23`**（§1 纪律表 **D8 行**——「失效表达必删｜现役规范面…历史归记录面」）+ **细则块 `:25`–`:33`**（行号 as-of 本轮实读）；§2.2 所引条文的表述 = **转述**（非逐字引文——逐字单源以该档 `:23` + `:25`–`:33` 为准）。

#### 发现 8（🔵）—— 条件期望句（并入项可撤销）+ 族 C 并入项标注

**族 C 表并入项标注（§2.3.3 族 C 逐项）**：**并入项（§2.9-3 组 2 · 可撤回）= #5（`provider/core.mjs:120`）· #6（`:153`）· #7（`:221`）· #8（`:360`）· #9（`context.mjs:52`）**；#1–#4（`provider/core.mjs` `:67`/`:286`/`:310`）= #146 固有点名项（不可撤回）。另 #144 车道并入项 = `generate-title.mjs:74`。

**条件期望句（本条为准 · 补 §2.5 V-3 / §2.11）**：

- **整组撤回**（上列 5 处全退）⇒ **V-3 期望改 `TOTAL=10`**（= 白名单 8 命中 + 射程内留 2 处：`provider/core.mjs:153` 的 `§13` ∧ `:221` 的 `§12`——V-3 regex 射程 = `§1[0-4]`）· **计数改 改集 84 / 产品码面 86**。
- **分项撤回**（如仅 `generate-title.mjs:74`（`§21`）或仅 `context.mjs:52`（`§15`））⇒ **V-3 期望不变**（`TOTAL=8`——两项 ∉ 射程）· 计数 **−1**（改集 88 / 产品码面 90）。
- 撤回的判据 = 父侧裁定（本设计不自行撤回；撤回后须同步改 §2.0 / §2.3.2 / §2.3.3 / §2.4 / §2.11 计数——D3）。

**机检断言（并入项在位 · 全 ASCII）**：

`node -e "const t=require('fs').readFileSync('thincoder-core/provider/core.mjs','utf8').split('\n');console.log('V15='+t[119].includes('\u00a715'),'V13='+t[152].includes('\u00a713'),'V12='+t[220].includes('\u00a712'),'V16='+t[359].includes('\u00a716'),'C52='+require('fs').readFileSync('thincoder-core/context.mjs','utf8').split('\n')[51].includes('\u00a715'))"`

**期望读数**：`V15=true V13=true V12=true V16=true C52=true`（5 项在位 ⇒ 撤回面逐项可定位）。

#### 发现 9（🔵）—— §2.3.1 明写子号口径

**本条为准（补 §2.3.1 · 承 KD-2）**：主号收正后，**旧档条目名 / 子号（`D-V1` · `review #N` · `T3/T12` · `步骤 3` · `表 3 候选 1` · `事实 4` · `D-R4①` · `R19` · `D-R19a` 等）随旧档术语保留、不作新档解析承诺**——**不属死指称**（本批判据只判**主号**；T7 靶存在性门亦只判主号在档）——**防下轮按死指称计数**（子号面若需收正 = 另轮另判，不在本批射程）。

**机检断言（子号实证在位 · 全 ASCII）**：

`node -e "const fs=require('fs');const g=fs.readFileSync('thincoder-core/session-gc.mjs','utf8'),r=fs.readFileSync('thincoder-core/agent-tools/read-history.mjs','utf8');console.log('DV1='+g.includes('D-V1'),'T3T12='+g.includes('T3/T12'),'R19='+r.includes('R19'))"`

**期望读数**：`DV1=true T3T12=true R19=true`（⇒ 子号随主号共存 · 口径必要）。

#### 发现 10（🔵）—— V-5 第 4 档补入 §2.4

**§2.4 产品码面表补 1 行**：`thincoder-vscode/src/agent/setup.mjs` | **495** | **0** | **登记档（0 改集 · 本批零触）——V-5 第 4 档校验靶**（防误触）。⇒ 表内 **16 行**；**改集档数仍 15**（D3：**表行数 ≠ 改集档数**——二者分列，判据面各自成立）。「设计表值」出处 = 本轮实读（read 末行含末行口径）。

**机检断言（全 ASCII）**：`node -e "console.log('LINES='+require('fs').readFileSync('thincoder-vscode/src/agent/setup.mjs','utf8').split('\n').length)"` ⇒ **期望读数 `LINES=495`**（与 §2.5 V-5 第 4 档期望同值）。

#### 2.12.1 本轮机检读数（C3 · `node scripts/doc-check.mjs --root .` · cwd = 仓根）

`汇总：候选 18576 · 悬空 0 · 注记豁免 43 · 拟新增 8 · 迁移期引文 211` ∧ `OK(锚): 0 条悬空（闸态——阈值 0）` ∧ `OK(行宽): 源域全部 .md 无 >300 字符单行。` ∧ **exit 0** —— 与设计轮读数**逐数相同** ⇒ **净增 0**（本轮写域 = 本档 §2 追加 · 产品码 / 设计档 / 需求档 / `scripts/**` 零触）。

#### 2.12.2 D8 自查（本席）

本块无修订式残句：无 `~~划改~~` · 无「原记 X ⇒ 收正 Y」式**挂尸**（收正一律带 as-of / 日期锚 = 记录面形态 · §2.3.6 与 §2.11 同形先例）；「旧 → 新」表 = 变换规格；失效期望值（`N1=false`/`F1=false`）**不留现役面**（以「本条为准」的期望页整体取代，不留尸体条目）。

#### 2.12.3 不一致 / 域外发现（报告面 · 逐条 · 不改）

1. **同族异判**（潜在漏项 · 提请父侧裁定）：`thincoder-vscode/src/agent/run-helpers.mjs:89` 的 `PROVIDER.md §14.6/§14.7` 与族 C（`provider/core.mjs` 的 §12/§13/§14.x/§15/§16）**同族**（PROVIDER 旧号）——本批按「VSC 侧绑定待核」列登记、未改 ⇒ 同批同族判类不一；并入与否属 **#146 域内扩面**，本轮不自行扩面（父侧裁定）。
2. **发现 6 计数收正**：原文「+1 行」；先例实读 = **两处各 +1**（`:497`/`:498` + `:1309`/`:1310`）⇒ 本批同形 = **Δ=+2**（见发现 6 · 机检先例行在档为凭）。
3. **判保留 / 登记分列的存在性**：本轮 7 行收正不涉「判保留」列值（**表列和 = 91 零变**）——只动 `读数` 与 `登记` 两列（发现 2 表）；`§2.11` 白名单 8 命中与 `TOTAL` 判据零变。

### 2.13 C4 同口径确认 + §2.4 档数收正（修正轮 1 · 续 · 本席）

- **V-2 期望（三处同口径 · 唯一副本 = §2.12 发现 1 · D2）**：§2.5 V-2 行与 §2.6 T2 行**同取本条**——`TILDE1=0 TILDE2=0 N1=true F1=true O2=false D3=true D2=true SHEJI=true`（T2 = 前五项 + 三个正形在场句）；断言命令与期望读数逐字见 §2.12 发现 1（不复制）。

- **计数五处同口径（D3 · §2.0 / §2.3.2 / §2.3.3 / §2.10 / §2.11 / §2.12 同值）**：

| 面 | 计数（本条为准） | 说明 |
|---|---|---|
| 产品码改集 | **89 处 / 14 档**（族 A 63 · B 12 · C 9 · D 5） | #146 改集 · 逐处清单 = §2.3.3 |
| 产品码面合计 | **91 处 / 15 档** | + #144 2 处（`generate-title.mjs` 两族共档） |
| 判保留 | **表列和 = 91** | 逐档列值本轮零变（§2.12 发现 4） |
| 设计档面 | **4 档** = 改集 2（`VSC-MIGRATION-INVENTORY.md` 494 · `WEBVIEW.md` 614——`:313` 删行 −1 ∧ 变更记录 +1 ⇒ Δ=0）+ 记录面 1（`VSC-MIGRATION.md` 200 · Δ=+1）+ **登记面 1（`DOC-DISCIPLINE.md` 1311 · Δ=+2）** | 处数 4 + 变更记录 2 行 + 登记面 2 行 |
| 产品码 §2.4 表 | **16 行**（改集 15 + 登记 1） | 表行数 ≠ 改集档数（§2.12 发现 10） |

- **§2.4 文案收正（本条为准）**：① 「设计档面（**3 档**）」→「设计档面（**4 档**）」；② 「产品码面（**15 档** · 全为行内替换 ⇒ Δ=0）」→「产品码面 §2.4 表 **16 行**（改集 **15** 档 + 登记 **1** 档 · 全为行内替换 ⇒ Δ=0）」；③ 产品码表补行 `thincoder-vscode/src/agent/setup.mjs` | **495** | **0**（登记档——V-5 第 4 档靶）。
- **§2.10 计数行同口径**：设计档面读数 = **4 档**（承上）；其余值零变。

**D6 回读**：§2.12 / §2.13 两落入档后逐段复读完成（本轮全部改动 = 本档 §2 追加，`file` 面孔仅本档）。

### 2.14 行数口径裁定 + 逐处收正 + 实跑记录（修正轮 1 · 续 · 本席）

**口径裁定（本条立 · 单源）**：本批「行数」口径 = **`read` 口径 = `String.split('\n').length`**（含末行空串——read 工具报数与之**逐数相同**，本轮五档实测）。**实测（本轮）**：`context.mjs` **496** · `provider/core.mjs` **492** · `session-store.mjs` **442** · `thincoder-vscode/src/agent/setup.mjs` **496** · `bin/thincoder.mjs` **441**（后者 = §2.4 表值 ✓）。

**收正（D3 · 计数与列表同轮）**：

| # | 处 | 原记 → 收正 | 依据 |
|---|---|---|---|
| 1 | §2.4 行 `thincoder-core/provider/core.mjs` | 491 → **492** | read 实读；贴线判定零变（>300 咨询线 ∧ <500 硬限） |
| 2 | §2.4 行 `thincoder-core/session-store.mjs` | 441 → **442** | 同上 |
| 3 | §2.9-9 贴线读数行 `provider/core.mjs` | 491 → **492**（`context.mjs` 496 ✓ · `bin/thincoder.mjs` 441 ✓ 不变） | 同上 |
| 4 | §2.12 发现 10 补行值 + 断言期望 | 495 → **496**（断言逐字不变，仅期望读数收正） | read 实读 ∧ V-5 命令实跑同值 |
| 5 | §2.5 V-5 期望（4 档） | `496 / 491 / 441 / 495` → **`496 / 492 / 442 / 496`** | V-5 逐字命令**实跑**（见下） |

**V-5 实跑（本轮 · 逐字命令）**：`node -e "const fs=require('fs');for(const f of ['thincoder-core/context.mjs','thincoder-core/provider/core.mjs','thincoder-core/session-store.mjs','thincoder-vscode/src/agent/setup.mjs'])console.log(f+'='+fs.readFileSync(f,'utf8').split('\n').length)"` ⇒ **`496 / 492 / 442 / 496`**（原表值 **3 处 off-by-one** ⇒ **判据假红风险已消**）。

**评审 #10 附注收正**：该发现载「盘上末行实读 = 495（数值本身无误）」——与本轮 read 实读（**496**）∧ V-5 命令实跑（**496**）**相抵**；按本条口径裁定收正为 **496**（两法今同值 ⇒ 判据可跑）。

**本轮实跑记录（C2 凭据 · 逐条断言与其读数）**：

| 发现 | 断言读数（实跑） | 判 |
|---|---|---|
| 1 | `TILDE1=4 TILDE2=0 N1=true F1=true O2=true SRC186=true SRC604=true` | `TILDE1=4` / `O2=true` = **改前在位态**（`:217`/`:224` 两对划改 + `:313` 旧判定句）⇒ 改后期望（`TILDE1=0` / `O2=false`）为**差量判**（预判据成立 ✓）；命中来源两项 ✓ |
| 2 | 逐档 `ok=11/11 · 24/24 · 19/19 · 13/13 · 7/7 · 6/6 · 7/7` ∧ `BAD=0` | 与期望**逐数相符** ✓ |
| 5 | `LINES=540 L402=true L468=true OOB548=true` | 逐数相符 ✓ |
| 6 | `L23D8=true L25D8=true L497=true L498=true L1309=true L1310=true` | 先例两处形 + 判据行在档 ✓ |
| 8 | `V15=true V13=true V12=true V16=true C52=true` | 并入项 5 处逐项在位 ✓ |
| 9 | `DV1=true T3T12=true R19=true` | 子号共存实证 ✓ |
| 10 | `LINES=496` | 收正后相符 ✓ |
| C3 | 悬空 **0** · 行宽 **0** · exit **0** · 候选 18576 · 注记豁免 43 · 拟新增 8 · 迁移期引文 211 | 净增 **0** ✓ |

**域外发现（报告面 · 追加）**：4. 行数口径**混用**（本轮实测：`provider/core.mjs` / `session-store.mjs` / `vscode/src/agent/setup.mjs` 三处按「内容行」记、`context.mjs` 按 read 记）⇒ 已按 §2.14 裁定统一；**实现轮复读须同口径**（判据 = `split('\n').length`），防再次 off-by-one 假红。

**附（D3 收口）**：§2.13 ③ 内 `thincoder-vscode/src/agent/setup.mjs | 495` **同受 §2.14 #4 收正 ⇒ 取值 496**（该档全批同口径：read = `split('\n').length`）——本档内该数字现值一律 496，别无二说。

**附（§2.14 域外发现 4 收正 · 防低估）**：该条「三处」= 最低列举；实况 = **§2.4 产品码面多数行按「内容行」（= `split('\n').length − 1`）记**（read 口径下逐行 +1：如 `read-history.mjs` 309→**310** · `session-gc.mjs` 248→**249** · `startup.mjs` 297→**298** · `panel-session.mjs` 295→**296** · `session-io.mjs` 221→**222** · cli test `331`→**332** · vsc test `321`→**322** · `setup-reminders.mjs` 199→**200**（core）/ `138`→**139**（vsc）· `session-segments.mjs` 99→**100**），`generate-title.mjs` 123（无末行换行）· `bin/thincoder.mjs` 441 两行本即同值。**判据承载面零风险**：① V-5 四档已按 read 口径收正（§2.14 #5）② advisory 判（**7 档越 300 咨询线 · 无一越 500 硬限**）**零变**（+1 后仍 >300 ∧ <500）③ 全批 Δ=0（行内替换）⇒ 无判据依赖这些基值；实现轮以本条口径复读即同源。

### 2.15 设计档面落盘记录（实施轮 · eng-designer · 2026-09-20）

**落盘（8 行项 / 4 档 · file:line = 落盘后实读）**：

| # | 条目 | 改动 file:line |
|---|---|---|
| 1 | #145-① | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:217` 去划改形（保裁定句 `**D3 裁定（2026-09-15）：维持现状**`） |
| 2 | #145-② | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:224` 去划改形（保裁定句 `**D2 裁定（2026-09-15）：VSC 专有面**`） |
| 3 | #145-③ | `docs/vsc/design/WEBVIEW.md:312` 节头改 `**射程（2026-09-19）**`（冒号后正文逐字保留） |
| 4 | #145-④ | `docs/vsc/design/WEBVIEW.md` 原 `:313` 整行删（删后 `:313` = 前置判据行） |
| 5 | #145·变更记录 | `docs/vsc/design/WEBVIEW.md:613` +1 行（节尾追加——承 库存清账 / 渲染粒度 两批先例） |
| 6 | #145·变更记录 | `docs/vsc/design/VSC-MIGRATION.md:164` +1 行（节头后首条——该档 newest-first 先例） |
| 7 | #146·登记行 | `docs/core/design/DOC-DISCIPLINE.md:499` +1 行（承 `:497`/`:498` 链尾 · 逐字 = §2.12 发现 6-①） |
| 8 | #146·变更记录 | `docs/core/design/DOC-DISCIPLINE.md:1312` +1 行（承 `:1310`/`:1311` 链尾 · 逐字 = §2.12 发现 6-②） |

**行数（read 口径 = `split('\n').length`）**：INVENTORY **494**（Δ0）· WEBVIEW **614**（Δ0：`:313` 删 −1 ∧ 变更记录 +1）· VSC-MIGRATION **201**（+1）· DOC-DISCIPLINE **1313**（+2）——与 §2.4 / §2.13 计数面同值 ✓

**实跑读数（2026-09-20 · cwd = 仓根）**：V-2 = `TILDE1=0 TILDE2=0 N1=true F1=true O2=false D3=true D2=true SHEJI=true`（期望逐数相符）· V-1 = `OLD=false NEW=true S67=true P21=false P617=true`（期望逐数相符——产品码面读数，供父侧交叉核验）· `node scripts/doc-check.mjs --root .` = **悬空 0 · 行宽 0 · exit 0**（候选 **18578**（+2 = 新增行的坐标 token 计入）· 注记豁免 43 · 拟新增 8 · 迁移期引文 211 ⇒ 净增 0）。

**D6 回读**：四处改动区落盘后逐处实读 ✓（INVENTORY `:214`–`:226` · WEBVIEW `:310`–`:315` + 节尾 `:607`–`:614` · VSC-MIGRATION `:160`–`:167` · DOC-DISCIPLINE `:495`–`:501` + `:1308`–`:1313`）。

**D8 自查（改后扫描 · 规范面）**：`~~` = 0（两档）· 「旧判定」= 0 · 「覆旧」余 **1**（`WEBVIEW.md:603`——记录面 · §2.12 发现 1 声明来源）· 「归属疑变」余 **1**（`VSC-MIGRATION-INVENTORY.md:186`——跨档历史指称 · 同声明）⇒ 规范面零命中 ✓。

**落点口径说明（报告面）**：① 用户摘要未列 `WEBVIEW.md` 变更记录 +1——按任务书 §2 全段（§2.2 / §2.4 / §2.13「变更记录 2 行」）两行均落；② 登记行落点 = `:498` **后**（承 批→二批→三批 时序链尾；与变更记录 `:1310` 后同构）；③ `VSC-MIGRATION.md` 插入 = `:163` 节头行后（无附加空行 ⇒ Δ=+1 保真）；④ 坐标漂移 = `WEBVIEW.md` 原 `:604`（覆旧行）→ **`:603`**（`:313` 删行所致；内容零触 · §2.12 发现 1 的 `:604` 为设计轮 as-of 值）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：本档 §2 全段（§2.0–§2.11）+ §1.1 三条 focus（① #144 改指靶可解析性 · ② #146 判保留/登记可判性 · ③ §2.9-3 并入项可撤销性）。**抽验（对盘实读/实扫）**：① #144 靶在档且逐义吻合——`docs/core/design/SESSION.md` §6.7 `:144`（标题生成 + max_tokens 30→100 + 双端同修）/ `docs/core/design/PROVIDER.md` §6.17 `:241`（请求头装配；消费点表含 `generate-title.mjs` `:245`）；源文 `thincoder-core/generate-title.mjs:64` / `:74` / `:5` 旧形逐字相符；`:5` 判保留靶 `CORE-UNIFICATION.md` §2.5 = `:260` 活号 ✓。② 族 A–D 改指靶**全在档**：SESSION §6.10 `:169` / §6.11 `:188` / §6.12 `:199` / §6.13 `:208` / §6.14 `:216`；CONTEXT-COMPACTION §6.4③ `:83` / §6.4④ `:85`–`:96` / §6.8 `:121` / §6.9 `:127`–`:134`；PROVIDER §6.12 `:182`–§6.17 `:241`（逐节行号与设计所载一致）；TUI-SESSION-VIEW §5.3 `:138` / §5.4 `:146`；子号实存抽核：§6.10 `D-5` `:182` ✓。③ V-3 独立复算（逐 token 实扫，非实跑）：15 档 §10–§14 token = **77**（= §2.11 pre-fix 读数逐数吻合）；按改集扣除后余集 = 白名单 8 条（`session-store.mjs:278`/`:355` · `bin/thincoder.mjs:376`/`:406` · vsc test `:91` · `panel-session.mjs:10`/`:28`/`:105`）**逐条吻合**；`panel-session.mjs:10`/`:28` 绑定靶 `VSC-DEBT.md` §12.2.4 = `:373` 活号 ✓。④ 行数抽验：`provider/core.mjs` 491 · `session-store.mjs` 441 · `bin/thincoder.mjs` 441 · `read-history.mjs` 309 · `panel-session.mjs` 295 · `vscode/src/agent/setup.mjs` 495 · `generate-title.mjs` 123 · INVENTORY 494 · WEBVIEW 614 · VSC-MIGRATION 200 均与表吻合；#146 行级读数抽核 6 档（provider/core 17 = 8+4+5 逐 token 复算成立；setup-reminders 6 / read-history 4 / session-gc 18 / session-store 14 / session-segments 3 / startup 9 各吻合）。⑤ #145 靶文逐字：INVENTORY `:217`/`:224`（`~~归属疑变~~ → 裁定句`）· WEBVIEW `:312`/`:313` + `:303`「退场一类」在册句；变更记录落点 `WEBVIEW.md:551` / `VSC-MIGRATION.md:163`（INVENTORY 无变更记录节 ✓ 落主档口径成立）。**未独立复跑（本环境无 shell）**：V-1 / V-4 / V-6；归档档与两 CHANGELOG 实证（#144「IK9UZ8」来源）未读 ⇒ unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🔴 | **V-2 期望值两条不可达（对盘实测）**：`N1=false` 要求 INVENTORY 全档无「归属疑变」——但 `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:186`（§8A 行「承主档 §7.2 D4 **归属疑变**的父侧裁定」）不在改集（改集仅 `:217`/`:224`）⇒ 改后 `N1=true`；`F1=false` 要求 WEBVIEW 全档无「覆旧」——`:604`（变更记录行「（**覆旧**登记）」· 记录面照留）留在档 ⇒ 改后 `F1=true`。⇒ 按现设计实施后 V-2 必红（§2.6 用例 T2 期望同误），#145 验收门按现文不可通过。 | 二选一：① 收窄判据域（如仅判改集两行 / 仅判现役规范面）并同步期望值；② 期望改 `N1=true F1=true` 并逐条注明命中来源（`:186` = 跨档历史指称 · `:604` = 记录面），T2 同轮同步。 |
| 2 | Clarity（focus ②：可判性） | 🟡 | 判保留/登记**类级判据齐**（§2.3.4 三条 · §2.3.5 四族各带判据），**逐项可判性不全**：多行「判保留」计数无逐项坐标/理由——行 3 `family-tools` 保留 6 · 行 12 `advisor-async` 保留 8 · 行 27 `vscode/src/agent/setup.mjs` 保留 12 · 行 32 `panel-turn-stages` 保留 5 · 行 31 `session-slots` 保留 5 · 行 28 `run-helpers` 保留 1；`panel-session.mjs:105` 分类两处不一（行 29 按差额入判保留；§2.11 记「待核 · §2.3.5-②」，而 §2.3.5-② 未列该档）；行 27 备注「见下③」与 VSC 族实际所在 §2.3.5-**②** 不符。 | 每行补「判据 + 逐项坐标/枚举」（或注明「承 §2.3.4 第 2 类」）；统一 `:105` 归类；改行 27 交叉引用为 ②。 |
| 3 | Methodology（D3 计数） | 🟡 | 行 5（`context.mjs`）经 §2.3.6-3「收正」为「读数 16 · 改集 12 · 保留 3 · 登记 1」——与 §2.3.6-1（`:150` 入改集）+ §2.3.3 族 B 12 处（#1–#12，含 `:150`）+ 族 C #9（`:52`）相抵（实为 **13** 处改集，读数应为 17），§2.11 总账（89 = 69+12+3+5）亦要求 13 ⇒ §2.10「三处同口径」在逐档行层面不成立。另行 3（`family-tools`）列值「登记 7」与其备注枚举「§18×3 / §19×5 / §25」= **9** 不自洽。 | 以逐处清单为准回改行 5（17/13/3/1）与行 3 拆分，§2.10 同轮复核。 |
| 4 | Methodology（口径） | 🟡 | §2.0 / §2.3.2 总账「判保留 **~40**」与逐档「判保留」列逐行之和（本席实算 = **91**）不符；另 §2.3.1 声明处数口径 = 裸形 token，而行 8（`provider/core` 读数 17）实含带档名 token 计入（逐 token 实读 = 17）⇒ 口径与行值不可互推。 | 总账改为「= 表列和」或注明「~40 = §2.3.4 逐项列示面」；逐档标注计入面（裸形 / 含带档名）。 |
| 5 | Clarity（focus ① 延伸：判例可解析） | 🟡 | 判例钉「协议消息面 `WEBVIEW-PROTOCOL.md:548` 不动（实读确认）」**坐标超 EOF**——该档实存共 **540 行**（read 口径，`:548` 无可读行），「实读确认」与盘面相抵（同批主题即死指称收尾）。 | 核对并改指实存行（同档含「退场」措辞候选 = `:402` / `:468` / `:487`），或去坐标只留判据文字。 |
| 6 | Requirements / Scope coordination | 🟡 | #146 处置（89 处 / 33 档域）未计划 `docs/core/design/DOC-DISCIPLINE.md` 登记面更新——先例：卫生族一批（`DOC-DISCIPLINE.md:1309` 残差块 +1 行）与二批（`:1310` + 二批档受影响表明列该档 +1 行）；且域外裸形面（`thincoder-core/advisor/**` · `tools/**` · `memory/**` 等实存 §10–§14 裸形）仍依赖「余面仍在册」句保持属实。 | §2.4/§2.9 补该登记行（+1 行 · 给逐字文本），或在 §2.7 边界明示「本批不写」。 |
| 7 | Clarity | 🔵 | §2.2 判据出处「`DOC-DISCIPLINE.md` §3.9 D8 行」——盘上 D8 行 = `DOC-DISCIPLINE.md:23`（§1 纪律表；§3.9 = 条目 J），引文亦为压缩转述（二批同判据写法 = 「`:23` 表行 + 细则 `:25`–`:32`」）。 | 出处改指 `:23` + 细则块（或标「转述」）。 |
| 8 | Scope（focus ③：可撤销性） | 🔵 | §2.9-3 三项**足供退回**（`generate-title.mjs:74` · `provider/core.mjs` `:120`/`:153`/`:221`/`:360` · `context.mjs:52`——坐标 + 旧→新逐项在册）；惟退回缺条件期望：「默认并入」与 V-3 期望（`TOTAL=8`）及计数（89 / 91）绑定——撤回组 2（§12/§13 ∈ V-3 射程）时 `TOTAL` 应为 **10**，设计未载。 | 补条件期望句；族 C 表内标注哪几行 = 并入项（现需交叉 §2.3.3 反查）。 |
| 9 | Clarity | 🔵 | 子号去留（KD-2）保留旧档条目名（`D-V1` / `T3/T12` / `步骤 3` / `表 3 候选 1` / `事实 4` / `D-R4①` 等），主号收正后于目标节多不可解析（实读：SESSION §6.12 无 `D-V1`/`T3/T12`；§6.14 无「事实 4」）；T7 门只判主号在档。 | 属已声明口径；§2.3.1 明写「子号随旧档术语保留、不作新档解析承诺」，防下轮按死指称计数。 |
| 10 | Acceptance criteria | 🔵 | V-5 第 4 档 `thincoder-vscode/src/agent/setup.mjs`（期望 495）不在 §2.4 表内，「设计表值」出处不成立（盘上末行实读 = 495 ✓，数值本身无误）。 | 该档行数补入 §2.4 或注明来源（登记档 · 0 改集 · 防误触校验）。 |

**计数：🔴 ×1 · 🟡 ×5 · 🔵 ×4**（🔴 未清 ⇒ 本轮不签 token）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**本轮范围（轮 2 · 缩范围复核）**：只验 §2.12–§2.14 修正轮 10 条的**落点声明自洽**（落点行存在 + 与 §3 轮 1 建议方向一致）＋ **D3 同口径三处**（§2.5 V-2 期望 / §2.6 T2 / §2.10 计数）。手段 = 本档全文 fresh read（行 1–524）。按声明：**禁实读代码** · 不展开全量 · 不重开已裁项（§2.12.3-1 同族异判 · 已裁维持登记——未触）；盘面外部断言（各条机检读数）按声明不在本轮复核范围。

**核查表（10 条逐条 + D3 三处）**：

| # | 承接（§3 轮 1） | 状态 | 落点/证据（本档 fresh read） |
|---|---|---|---|
| 1 | 🔴 V-2 期望两条不可达 | ✓ Fixed | §2.12 发现 1（`:317`–`:329`）：`:321` = 「本条为准 · 取代表内该行期望列 ⇒ `N1=true F1=true`」；`:322` 命中来源注记（`:186` 跨档指称 · `:604` 记录面）；`:323` §2.6 T2 同轮同步；`:327` 新断言（SRC186/SRC604 索引 185/603 正确）；期望可达（`:484` 实跑 `N1=true F1=true` = 改前在位态）⇒ 建议②逐点全落 |
| 2 | 🟡 逐项判据缺 + `:105` + 行 27 引用 | ✓ Fixed | §2.12 发现 2（`:331`–`:351`）：7 行逐项坐标（`:335`–`:343`）；`:341` `:105` 归类统一 ⇒ 登记；`:339` 行 27「见下③」→「见下②」；`:351` 期望 `ok=11/24/19/13/7/6/7 ∧ BAD=0` 与 `:485` 实跑逐数相符 |
| 3 | 🟡 行 5（context）/ 行 3（family-tools） | ✓ Fixed | §2.12 发现 3（`:353`–`:357`）：`:355` = 17/13/3/1 并「取代 §2.3.6-3 的 16·12·3·1」；行 3 经 发现 2 表收正（登记 7→8 · 读数 13→14 · 「§18×3」→×2）⇒ 列值与枚举同轮相合 |
| 4 | 🟡 「判保留 ~40」总账 | ✓ Fixed | §2.12 发现 4（`:359`–`:361`）：`:361`「⇒ 本条为准：判保留 = 表列和 = 91」 |
| 5 | 🟡 判例坐标 `:548` 超 EOF | ✓ Fixed | §2.12 发现 5（`:363`–`:371`）：`:365` 改指 `WEBVIEW-PROTOCOL.md:402`（本条为准）+ `:468` 同类候选 / `:487` 记录面分辨；`:371` 期望 `LINES=540 L402=true L468=true OOB548=true` |
| 6 | 🟡 `DOC-DISCIPLINE.md` 登记面 | ✓ Fixed | §2.12 发现 6（`:373`–`:391`）：`:379`/`:383` 两处逐字文本（登记行 + 变更记录行）；`:375` 「+1 行」按先例收正为 Δ=+2；`:385` §2.4 补第 4 行（1311 / +2）；§2.13 `:454` 计数表并入「登记面 1」 |
| 7 | 🔵 D8 出处 | ✓ Fixed | §2.12 发现 7（`:393`–`:395`）：出处改指 `DOC-DISCIPLINE.md:23` + 细则 `:25`–`:33`，并标「转述」 |
| 8 | 🔵 条件期望 + 族 C 并入项标注 | ✓ Fixed | §2.12 发现 8（`:397`–`:411`）：`:399` 并入项 #5–#9 + `generate-title.mjs:74` 标注；`:403` 整组撤回 ⇒ `TOTAL=10` / 计数 84·86，`:404` 分项撤回 ⇒ `TOTAL=8` 不变 / 计数 −1——射程判定（§13/§12 ∈ `§1[0-4]`；§15/§21 ∉）与 §2.11 白名单一致；`:409` 断言索引 119/152/220/359/51 与坐标相符 |
| 9 | 🔵 子号口径 | ✓ Fixed | §2.12 发现 9（`:413`–`:421`）：`:415` §2.3.1 明写「随旧档术语保留、不作新档解析承诺 · 不属死指称」 |
| 10 | 🔵 V-5 第 4 档 | ✓ Fixed | §2.12 发现 10（`:423`–`:427`）+ §2.13③（`:457`）；值 495 经 §2.14 #4 收正 ⇒ **496**（`:473` · `:495`「该数字现值一律 496，别无二说」）；V-5 新期望 `496 / 492 / 442 / 496`（`:474`）与 `:476` 实跑同值 |
| D3 | §2.5 V-2 期望 / §2.6 T2 / §2.10 计数 同口径 | ✓ 成立 | 单源 = §2.12 发现 1（`:321`–`:323`）；§2.13 `:445`「§2.5 V-2 行与 §2.6 T2 行同取本条 · 唯一副本」；计数同值表 `:447`–`:455`；§2.10 `:285` 的设计档面读数经 §2.13 `:458` 收正为 4 档（与 §2.4 补行同轮）——三处无互抵值（取值一律以追加链末端为准，见 N1） |

**新增（本轮 · 非阻塞）**：

| # | Severity | Issue | Note |
|---|---|---|---|
| N1 | 🔵 | **追加式覆盖残留**（机制性 · 已声明）：§2.12 头注（`:313`「修正轮 1 · 定点 · 追加制」）⇒ 非就地改写：§2.5 V-2 行（`:235`）与 §2.6 T2 行（`:248`）原文仍载 `N1=false F1=false`；§2.10（`:285`）仍载「设计档面 4 处 / 2 档」；§2.0（`:48`）/§2.3.2 闭合合计（`:130`）/§2.3.3 族 A 头（`:134`）仍载 88·62·~40；§1.1（`:21`）仍载 `WEBVIEW-PROTOCOL.md:548`；§2.13③（`:457`）仍载 495。均已被显式「本条为准 / 同受收正」链覆盖（无未覆盖项）⇒ 不阻塞；实现 / 收口轮取值须取链末端（`:321`/`:323`/`:361`/`:365`/`:458`/`:473`/`:495`）。 | 非阻塞备注 |

**计数：🔴 ×0 · 🟡 ×0 · 🔵 ×1（新增备注）——上轮 🔴 已清 · 10/10 落点声明自洽 · D3 三处同口径成立**

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 19:0x 父侧代签** —— 用户 17:03「**自动跑到干完吧**」+ 18:34「**可以，继续吧**」⇒ 本批**设计评审点火权 + §4 批准权**均在授权射程内（跑到干完 ✓）。

**三条件核验**：① 评审 **pass**（id=9 changes-required 🔴1/🟡5/🔵4 → 修正轮 id=10 **10/10** → **复核 id=11 pass**：10 条落点逐条自洽 ✓ · D3 三处同口径成立 ✓ · 1🔵 非阻断（覆盖链残留·取值点已列 ✓））② 修正轮已落地并经复核逐条核验 ✓；③ **token 已签发**（值不落档——运行时凭证 ✓）。

**批准范围**：本批全量。**实施两路**：**设计档面**（`VSC-MIGRATION-INVENTORY.md` `:217`/`:224` 去划改形 · `WEBVIEW.md` `:312`/`:313` 修订框架收正 · `VSC-MIGRATION.md` 变更记录 +1 · `DOC-DISCIPLINE.md` 登记行 +1 + 变更记录 +1 = Δ+2）→ **eng-designer** ✓；**产品码面**（**91 处 / 15 档** —— #144 2 处 + #146 89 处 · 族 A–D · 全行内替换 Δ=0）→ **eng-coder + token** ✓。两路皆已派发 ✓。
## §5 实施记录（eng-coder）

**轮次** = initial · 车道 = **产品码注释面**（#144 2 处 + #146 族 A–D 89 处 = **91 处 / 15 档**）· 依据 = 本档 §2 全段（取值一律取收正链末端：§2.3.6 / §2.11 / §2.12 / §2.13 / §2.14）· 改法 = 逐处**内容回读定位**的行内替换（行数零变）。

### 5.1 交付摘要

- **#144（2 处）**：`thincoder-core/generate-title.mjs:64` `docs/design/SESSION.md §IK9UZ8-D` → `docs/core/design/SESSION.md §6.7`；`:74` `PROVIDER.md §21` → `PROVIDER.md §6.17`；`:5`（§2.5 #163 = CORE-UNIFICATION.md 活号）**判保留零改** ✓。端壳同族档 `thincoder-vscode/src/extension/generate-title.mjs:7`（§2.5/§2.13.4 #163 活号）= **判保留零改** ✓。
- **#146（89 处 / 14 档）**：全行内替换（Δ=0）· **0 处删指称** · 判保留/登记面零触 ✓。
- 落盘后逐档回读（D6）✓ · 贴线档未增行（context.mjs 496 / provider/core.mjs 492 · 硬限 500 ✓）。

### 5.2 逐族回报（族 → 处数 → file:line → Δ）

| 族 | 处数 | 档 → file:line | Δ |
|---|---|---|---|
| **A**（SESSION 旧号） | **63** | `thincoder-core/agent/setup-reminders.mjs` 6 — `:6`/`:8`/`:13`/`:34`/`:45`/`:46`；`thincoder-core/agent-tools/read-history.mjs` 4 — `:36`/`:171`/`:200`/`:293`；`thincoder-core/session-gc.mjs` 18 — `:14`/`:17`/`:32`/`:36`/`:41`/`:54`/`:78`/`:100`/`:111`/`:124`/`:127`/`:164`/`:171`/`:172`/`:182`/`:193`/`:196`/`:216`；`thincoder-core/session-store.mjs` 12 — `:5`/`:22`/`:27`/`:38`/`:49`/`:63`/`:161`/`:226`/`:268`/`:360`/`:381`/`:415`；`thincoder-core/session-segments.mjs` 3 — `:5`/`:11`/`:32`；`thincoder-cli/bin/thincoder.mjs` 1 — `:308`；`thincoder-cli/src/tui/startup.mjs` 3 处（4 token，`:159` 双 token 同节去重）— `:159`/`:172`/`:228`；`thincoder-cli/test/setup-reminders.test.mjs` 4 — `:6`/`:73`/`:106`/`:163`；`thincoder-vscode/src/agent/setup-reminders.mjs` 5 — `:50`/`:52`/`:57`/`:64`/`:65`；`thincoder-vscode/test/setup-reminders.test.mjs` 2 — `:7`/`:104`；`thincoder-vscode/src/extension/session-io.mjs` 2 — `:193`/`:197`；`thincoder-vscode/src/extension/panel-session.mjs` 2 — `:217`/`:250` | 0 |
| **B**（CONTEXT-COMPACTION 旧号） | **12** | `thincoder-core/context.mjs` — `:42`/`:43`/`:46`/`:47`/`:56`（2 token）/`:99`/`:114`/`:147`/`:150`/`:361`/`:396` | 0 |
| **C**（PROVIDER 旧号） | **9** | `thincoder-core/provider/core.mjs` 8 — `:67`/`:286`（各 1）· `:310`（2 token 去重）· `:120`/`:153`/`:221`/`:360`；`thincoder-core/context.mjs` 1 — `:52` | 0 |
| **D**（TUI 旧号） | **5** | `thincoder-cli/src/tui/startup.mjs` — `:6`/`:135`/`:147`/`:182`/`:193` | 0 |
| **#144** | **2** | `thincoder-core/generate-title.mjs` — `:64`/`:74` | 0 |

合计 = 63 + 12 + 9 + 5 = **89**（#146）· **91**（产品码面 15 档）✓ 与 §2.0/§2.3.2/§2.3.3/§2.10/§2.11 同口径。

### 5.3 决策透明表（实施期判定 · 逐条可复核）

| # | 决策点 | 取值 | 依据 / 已评估替代 |
|---|---|---|---|
| 1 | 族 C `provider/core.mjs:67` / `:286` 尾随中文描述符（`设计值` / `失败可见性`） | **保留** ⇒ `§6.14 设计值：…` · `§6.14 失败可见性：…` | KD-2（§2.8）「行内替换 + 其余字面逐字保留」＋ §2.12 发现 9（旧档条目名随术语保留 · 不作新档解析承诺）＋ 同表同式先例（`§16 M1`→`§6.16 M1` 保留 `M1`）。**替代读法**（按「新」列字面删描述符）已评估：与 KD-2 及「零删指称」姿态相抵 ⇒ 未取；**请父侧收口时一言定案**（如需删，3 处内可复改）。 |
| 2 | `provider/core.mjs:310` 同行两 token 去重 | 保留首 token（`（§6.14）`），第二个 ref `§14.2` 连同其引接符 `——` 一并去 ⇒ `（deepseek /beta 网关对含工具链历史必 400，真机矩阵）` | 设计明令「去重 `§6.14`」（§2.3.3 族 C #3–4）＋ 先例形（sweep-2 `vsc setup.mjs:464`：`§11.1/§11.2`→`§6.11`，连接符随被去 ref 走）＋ 本批 `startup.mjs:159` 同式（` / §14.3.6` 随去重落）。 |
| 3 | 其余 87 处 | 纯 token 位替换，尾随 token 逐字保留（`D-V1` / `review #N` / `T3/T12` / `D-R4①` / `②③` / `单点` / `表 3 候选 1` / `规则 2` / `事实 4` / `测试段` / `步骤 1/2` / `步骤 3` / `M1` / `T-C2` / `D-C1/D-C2` / `D-T1/D-T2` / `D-5` / `D-2` / `R19` / `D-R19a` / `顺带修复` 等） | KD-2 · 落盘后逐处回读核验在盘。 |
| 4 | 判保留 / 登记面 | **零触**（日志串 2 · 待核 1 · J-1 族 · VSC §11.x 族 · 域外档） | KD-4（错指 > 死指）· §2.3.4/§2.3.5 逐项。 |

### 5.4 机检读数（先红后绿 · 全 ASCII 命令）

| 判据 | 改前（本席实跑） | 改后（本席实跑） | 期望 | 判 |
|---|---|---|---|---|
| **V-1**（#144） | `OLD=true NEW=false S67=false P21=true P617=false` | `OLD=false NEW=true S67=true P21=false P617=true` | 同改后 | ✓ |
| **V-3**（#146 · 15 档） | `TOTAL=77`（逐行 77 命中在案） | **`TOTAL=8`** ∧ 命中 = 白名单 8 条逐条相符 ∧ `outsideWhitelist=NONE` ∧ `whitelistMissing=NONE` | `TOTAL=8` ⊆ 白名单 | ✓ |
| **V-4** | 候选 18576 · 悬空 0 · 行宽 0 · exit 0 | 候选 **18578** · **悬空 0** · `OK(锚)` · `OK(行宽)` · exit 0 | 悬空 0 ∧ 行宽 0（净增 0） | ✓（候选 +2 = **设计档平行车道**的 `.md` 落笔所致；本车道 0 个 `.md` 触） |
| **V-5**（贴线 4 档） | 496 / 492 / 442 / 496 | 496 / 492 / 442 / 496 | Δ=0 | ✓ |
| **T7 靶存在性门** | — | SESSION §6.7/§6.10–§6.14 · CONTEXT-COMPACTION §6.4③/§6.4④/§6.8/§6.9 · PROVIDER §6.12–§6.17 · TUI-SESSION-VIEW §5.3/§5.4 **全在档** | 逐靶 ≥1 | ✓ |
| **Δ=0（15 档行数）** | — | 200 / 310 / 249 / 442 / 100 / 496 / 492 / 123 / 441 / 298 / 332 / 139 / 322 / 222 / 296 与 §2.4（§2.14 收正口径）**逐档相符** | 相符 | ✓ |

**V-6（三包实跑 · cwd = 各包）**：`thincoder-core` **447 tests / 447 pass / 0 fail** · `thincoder-cli` **745 / 745 / 0 fail**（12 suites）· `thincoder-vscode` **862 / 862 / 0 fail** ⇒ **全绿** ✓（基线 = 本实现轮实测）。语法：15 档 + 登记靶档 `thincoder-vscode/src/agent/setup.mjs` 共 16 档 `node --check` **全过** ✓。

### 5.5 fix round（1 轮 · 自捕获落地）

- **R1**：首轮落笔 15 档中 17/18 处正确 ⇒ V-3 首跑 `TOTAL=9` ∧ `outsideWhitelist=session-gc.mjs:182`（设计 §2.3.3 清单含该处 `§14.3.8`→`§6.14`，属本席批次编辑遗漏）⇒ **定点补改**（1 处）后复跑 V-3 = **`TOTAL=8` ⊆ 白名单** ✓。0 处回滚；其余 14 档首轮即全中。

### 5.6 审计与代码评审（本轮次 · 终态）

- **内审（explore · 只读 divergence audit · 1 轮）**：**VERDICT = clean** —— 91 处逐坐标全落（族 A/B/C/D 逐处实读 + 全文扫描）· 8 判保留在位 · 15 档行数与设计逐数相同 · KD-2 字面保留逐项对表（唯二删除 = 设计明示的两处去重）· 旧号残留恰 8（⊆ 白名单 · 无第 9 处）· **无设计档漂移**；两项解释口径（族 C 描述符保留 · `:310` 去重形）判「**可辩护（非偏差）**」。
- **代码评审（advisor · type=code · 1 轮）**：**VERDICT = pass**（🔴×0 · 🟡×2 非阻塞 · 🔵×1 报告面）—— ① 批档记录面 `panel-session.mjs:22`（判保留 · 引用面）与 `:135`（登记 · 批内部号）同引「2026-09-11 第 10 批 §5.1.4 第 4 条」而分桶不一（本席独立复读两行实态确认存在；零代码影响 · R7e 不阻塞）；② 7 档越 300 行咨询线（advisory · 已登记 · 无一越 500）；③ `generate-title.mjs:6/:43/:51` 残留 `IK9UZ8` 改号标签（非 `§N` 指称 · 不入本批改集）。
- **终态 = `clean`（收敛 · 1 内审轮 + 1 评审轮 + 1 自修正轮）**。

### 5.7 上抛项（父侧裁定 / 收口）

1. **§2.9-3 并入项**已按「默认并入」落地（族 C #5–#9 + `generate-title.mjs:74`）；如父侧撤回，按 §2.12 发现 8 条件期望重跑即可（整组撤 ⇒ V-3 期望 `TOTAL=10` · 计数 84/86；分项撤 ⇒ `TOTAL=8` 不变 · 计数 −1）——逐处旧形与坐标均在册（§2.3.3），回退为 1 轮内动作。
2. **族 C 描述符读法**（5.3 决策 1）请父侧一言定案（保留 = 现行态；删 = 定点 3 处）。
3. **`IK9UZ8` 口径**（审判据窄读成立：V-1 只判 `§IK9UZ8-D` ∧ #144 计数 = 2 处；`generate-title.mjs:6/:43/:51` 的改号标签非节号指称 ⇒ 不入本批）——如后续按「失效表达」口径统一清扫，另轮。
4. **记录面不自洽项**（5.6 ①：`panel-session.mjs:22` 归类）属设计档层/父侧写域，本席零触。
5. **域外残留（登记不改 · 非本车）**：`thincoder-vscode/src/agent/run-helpers.mjs:89`「`PROVIDER.md §14.6/§14.7`」（族 C 同族 · §2.12.3-1 已提父侧裁定）· `thincoder-core/memory/core.mjs:65`「`MEMORY.md §10.3`」（改集 33 档之外 ⇒ §2.3.5-④ 登记面）。

## §6 验证与收口（父代理）

**2026-09-20 19:2x 父侧收口**

**交付核验（两面四道）**：设计（#8：档级绑定口径 ⇒ #146 实得 89 处。台账 ~30 处 ✗）✓ · 评审（id=9 changes-required 🔴1）→ 修正轮（#10 10/10 + 行数口径裁定）→ 复核（id=11 **pass** · 10/10 落点自洽 + D3 三处同口径成立）✓ · **实施两路**：**设计档面（#12）**✓——8/8 落（INVENTORY 去划改形 · WEBVIEW `:312`/`:313` · 变更记录 2 行 · DOC-DISCIPLINE 登记面 Δ+2）；**产品码面（#13）**✓——**91/91 处 / 15 档**（族 A 63 · B 12 · C 9 · D 5 · #144 2）· 自捕 1 处遗漏并定点补改 ✓

**读数（先红 → 后绿）**：**V-3 77 → 8**（白名单 8 条逐条相符 · 越界 0 · 缺项 0 ✓）· **V-1** `OLD=false NEW=true S67=true P21=false P617=true` ✓ · **V-2** `TILDE1=0 TILDE2=0 N1=true F1=true O2=false …` ✓ · V-4 `doc-check` exit 0 · 锛 0 · 行宽 0 ✓ · V-5 四档 `496/492/442/496` Δ=0 ✓ · V-4′ 15 档行数逐档相符 ✓ · **T7 靶门全在档** ✓ · 三包 **core 447 / cli 745 / vscode 862** 全绿 ✓ · 禁改面零触（含 `:186` / `:603`(原 604) 两处已声明来源 ✓）✓

**父侧裁定与采纳**：① ⑤-1 描述符读法 = 按 KD-2 逐字保留 ✓ 确认；② ⑤-2 `:310` 去重形 = 确认 ✓；③ #12 ④-3 变更记录 2 行 = **保留** ✓（我 §4 摘要漏列 ✗ · 非它多落 ✓）；④ #12 ④-2 `:604`→`:603` 坐标漂移 + ⑤-5 记录面分桶不自洽（`§2.3.2 行 29` vs `§2.12 发现 2`）⇒ 收口轮随改 ✓；⑤ 域外 `memory/core.mjs:65`（`MEMORY.md §10.3` ✗）⇒ 入册 ✓

**台账**：**#144 / #145 / #146 → 已核销** ✓

**遗留（显式）**：① 收口轮小笔（坐标漂移 `:603` · 分桶不自洽 · `SRC604` 断言 as-of）② 扩面族（VSC §11.x/§12.x ✓ · `run-helpers.mjs:89` ✓ 已裁维持登记 · 新增 `memory/core.mjs:65` ✓）。

**提交**：待入库（本笔 + 后批）。
