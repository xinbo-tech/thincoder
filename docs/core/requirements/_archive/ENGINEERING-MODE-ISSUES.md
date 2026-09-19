# 工程模式问题清单（ENGINEERING-MODE-ISSUES）

> 建档：2026-09-16 · 父侧直接执行（盘点登记，非设计条文）· 原料 = 用户会话反馈回捞（read_history 全量）+ 四域只读勘察（#40 提示词 / #41 设计档 / #42 机检脚本 / #43 批次台账）
>
> 用法：本档是问题清单（盘点），**不是修复设计**。修复 = 逐条归批（走需求→设计→评审→实施全流程）；本档条目核销后勾掉并注批号。

## 第一节 · 用户会话反馈（最高权重）

> 用户在本会话中逐条纠正过的问题。每条 = 反馈原话（节选）· 定性 · 已立条文状态。

| # | 反馈原话（节选） | 定性 | 条文状态 |
|---|---|---|---|
| F1 | 「说好的让你推进到排空」「自动跑直到排空」 | auto 档失效：可做之事挂成「等」 | ✅ 排空优先 |
| F2 | 「你马上发是什么意思」「那动啊」「做啊」 | 承诺不做：说「马上发」但同轮不发 | ✅ 收尾三态 / 欠账入清单 |
| F3 | 「怎么不动了」「17号就是死了」 | 子代理死锁不察：不查活性、不报 | ⚠️ 未立 |
| F4 | 「别瞎几把东张西望」「一会儿 hmm 一会儿 wait」「一个多小时」 | 子代理勘察过度 / 空转（designer 尤其） | ⚠️ 未立 |
| F5 | 「台账收口你都派给 eng-designer？！」 | 台账收口误派（父侧活） | ✅ 角色路由 |
| F6 | 「这种小修改以后你自己搞，不要发给 eng-designer」（说过两遍仍犯） | 小改父侧自做 | ✅ 父侧不代笔例外 |
| F7 | 「你怎么把测试又推给 eng-coder 了？！」 | 测试误派（父侧活） | ⚠️ 未立 |
| F8 | 「这种文档修正类任务为什么派给 eng-coder？」 | 文档面误派 coder | ✅ 角色路由 |
| F9 | 「能不能不要把范围不明确的任务交给 eng-coder？你让他自己勘察？那不是扯淡吗」 | 范围不钉死、让 coder 自己勘察 | ⚠️ 未立 |
| F10 | 「你定那六条之前读过提示词吗？根本不分析直接改」 | 未读依据就动手 | ⚠️ 未立 |
| F11 | 「你个傻逼别再 grep 会话历史了」「又去历史会话 grep 把自己卡死」（复犯） | grep 会话历史当手段、成本失控 | ⚠️ 未立 |
| F12 | 「你们对文档搞长度限制干什么」「留读数干什么」「别给自己加戏」 | 文档被套代码行数限制 | ✅ 批 12 已废 |
| F13 | 「写盘为什么要人工放行」「何必做这种奇怪限制」 | 写盘权限门误伤子代理（机制 bug） | ✅ 批 1 已修 |
| F14 | 「eng-designer 提示词效率实在太低」 | designer 效率低（勘察过度 / 打回太随意） | ⚠️ 未立 |
| F15 | 「eng-designer 觉得该父侧修改的就不改，这个不合理吧」 | designer 打回过宽：父侧派单面不该打回 | ⚠️ 未立 |
| F16 | 「塞满有问题吗」「为什么不是排队」 | advisor 池满硬拒 ≠ 排队 | ✅ 批 8 ED-4 |
| F17 | 「机判那条我不同意……机判不是合理的路径」 | 机判兜不住行为纪律 | ✅ 收尾三态（行为面） |
| F18 | 「为什么经常出现说要做但实际未做的情况」 | 「做」=「说」脱节 | ✅ 收尾三态 |
| F19 | 「收到 token 还不开发！」 | token 到手不立即 spawn | ⚠️ 未立 |
| F20 | 「我应该有看面板的能力，否则以后排查问题麻烦」 | 父侧缺面板视图读取 | ✅ 已登记需求池 |
| F21 | 「我已经续订过了」「我换了个模型」 | 模型降智 / 断供（deepseek-flash 夜间降智） | ⚠️ 未立（子代理模型策略） |

**根病浓缩（5 条）**：
1. auto 失效 + 承诺不做（推进纪律）
2. 角色路由乱（台账 / 测试 / 文档 / 小改误派，反复犯）
3. 范围不钉死 + 勘察失控（让 coder 勘察、designer 东张西望）
4. 未读依据就动手（改提示词不读提示词、grep 会话历史）
5. 机制误伤（文档行数 / 写盘门 / 池满 / 看面板）

## 第二节 · 机制缺陷（四域勘察）

### 域 1 · 提示词面（#40 · 12 条）

**核心：落地领先正本。** `thincoder-core/prompts/`（落地）已含大量正本缺失的硬约束；`docs/core/design/prompts/`（正本）stale。

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| P1 | 🔴 | 铁律 #4「零裁量」仅落地有，正本铁律仅 3 条 | 落地 `discipline-engineering.md:8-9` ∥ 正本 `:3-6` |
| P2 | 🟡 | 「推进档位收口（C4 裁定宿主段）」仅落地有 | 落地 `:40-43` |
| P3 | 🟡 | 「设计行为纪律四维 A1/A3/A4」本体仅落地有，正本只声明归属 | 落地 `:103-119` ∥ 正本 `:76-78` |
| P4 | 🟡 | 「交付链收口」（锚#3–#6 + C2/C3）仅落地有 | 落地 `:211-232` |
| P5 | 🟡 | 「Multi-Task Parallelism」仅落地有 | 落地 `:265-292` |
| P6 | 🟡 | D5 冻结窗口「在途下界」扩展仅落地有 | 落地 `:183` ∥ 正本 `:160` |
| P7 | 🔵 | persona-engineering「Plan before building」仅落地有 | 落地 `:28-30` |
| P8 | 🔵 | persona-eng-coder「一次一文件验证」段仅落地有 | 落地 `:26` |
| P9 | 🟡 | `{{inject:eng-coder-guidelines}}` 注入仅落地有 | 落地 `persona-eng-coder.md:32` |
| P10 | 🟡 | 正本硬编码 CLI 路径 5 处，落地用 `{{inject:agent-loop-ptr-*}}`，正本未注 per-end 解析 | 正本 `discipline-engineering.md:184` 等 5 处 |
| P11 | 🔵 | R24 挂钩指针前缀差异（`src/prompts/` vs 无前缀） | 正本 `:222` ∥ 落地 `:297` |
| P12 | 🟡 | 「四维（A1/A3/A4）」标号自相矛盾：题写 A1-A4、正文只 A1/A3/A4 三段 | 落地 `:85` ∥ `:103` |

**未发现**（如实）：条文矛盾（判据 2）无；空缺（判据 3）无——收尾三态 / 角色路由 / 勘察 ≤6 均已入档；DOC-RULES / R24a 文档侧 / scripts 入域句残留无。

### 域 2 · 设计档面（#41 · 3 项 20 处）

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| D1 | 🔴 | **批 12 标「已收口」但 ②读数/③枚举残余未拔净——18 处漏网**（§N 实测行数收正 / 体量节行数收正 / 500 硬限叙述，指向已删体量节） | design 13 处 9 档：`ENGINEERING-MODE.md:354/355/358` · `BATCH-RECORD.md:249/250` · `TESTING.md:286` · `CONSULTATION.md:255` · `PROVIDER.md:384` · `TRACES.md:111` · `DOC-MIGRATION.md:328` · `DOC-CODE-RECONCILE.md:399/420/465`；requirements 5 处 2 档：`ENGINEERING-MODE-MECHANISM.md:481/484/486/487` · `ADVISOR-CONVERGENCE.md:215` |
| D2 | 🟡 | 批 12 Phase 4 未完成（`DOC-SYSTEM:332` 整句删 / C3/ACC-5 整行删 / .md 行→—） | 批 12 档 `:462` 自认 |
| D3 | 🔵 | 批 12 档 `:442` `_（待写）_` 占位未删（§5 内容已在其下） | `2026-09-16-doc-length-rule-repeal.md:442` |

**未发现**（如实）：空洞占位（待写/TODO）docs 域 0；DOC-RULES 0 引用；退役测试引用均为干净声明。

### 域 3 · 机检脚本面（#42 · 21 条：10🔴/10🟡）

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| S1 | 🔴 | 三机检「源域」全硬编码本仓目录；声明面 `.thincoder/docs-face.json` 已设计未实现——换项目整套失效 | `check-doc-width-core.mjs:15` · `doc-anchors-v5.mjs:24` · `doc-anchors-targets.mjs:20-42` |
| S2 | 🔴 | 域→引擎映射写死 basename 字面量，改目录名即失效 | `doc-anchors.mjs:69` |
| S3 | 🔴 | 「参照历史面」豁免族硬编码产品路径（本仓布局专属） | `doc-anchors-v5.mjs:55` |
| S4 | 🔴 | `LEDGER_MODULES` 写 `thincoder`、实为 `thincoder-cli`——永不命中（已登记 `DOC-SYSTEM.md:253` #1） | `check-ledger.mjs:61-64` |
| S5 | 🔴 | 本仓历史常量 `V3_ERA_START` 写死 | `check-doc-width-core.mjs:20` |
| S6 | 🟡 | 判据面写死不可声明：`PLATFORM_API_TERMS` / `NOTE_MARKERS` / `PLACEHOLDERS` / `MERGED_SCRIPTS` | `doc-anchors-core.mjs:68-103` 等 |
| S7 | 🔴 | 三机检「源域」枚举三套互不一致（9 元素 ∥ 8 元素 ∥ 整树） | `check-doc-width-core.mjs:15` ∥ `doc-anchors-v5.mjs:24` ∥ `doc-anchors-targets.mjs:20-42` |
| S8 | 🔴 | 遍历跳过集 `SKIP_DIRS` 四处定义三种内容 | `doc-anchors-targets.mjs:15` · `-v5.mjs:53` · `check-doc-width-core.mjs:22` · `check-ledger.mjs:78` |
| S9 | 🟡 | 用例号正则两套不一致（已登记） | `doc-anchors-core.mjs:44` ∥ `-v5.mjs:40` |
| S10 | 🟡 | 裸 `.md` 档名两引擎口径相反：VSC 判、V5 不判 | `doc-anchors-core.mjs:49` ∥ `-v5.mjs:160` |
| S11 | 🟡 | 台账两档路径双份定义 | `doc-anchors-targets.mjs:17` ∥ `check-ledger.mjs:56-59` |
| S12 | 🔴 | `check-ledger-core` ↔ `check-ledger` 循环 import；L4 定位判序落入口档非判据核 | `-core.mjs:13-17` ∥ `check-ledger.mjs:42/:95-177` |
| S13 | 🟡 | 段号提取逻辑双份同义未单源 | `check-doc-width-core.mjs:75-92` ∥ `check-ledger.mjs:80-92` |
| S14 | 🟡 | 宽度判据分居两面（`checkDocWidths` 入口档 ∥ V1-V3 core）；主流程对 widthFiles/widthHits 各扫一遍 | `check-doc-width.mjs:45/:69-70` |
| S15 | 🟡 | basename 计数三份实现未单源 | `check-ledger.mjs:116/:170` · `doc-anchors-v5.mjs:127` |
| S16 | 🔴 | VSC 引擎 A3 路径解析只用本域根，仓根相对路径被误判（已登记 `DOC-SYSTEM.md:254` #2） | `doc-anchors-core.mjs:228` |
| S17 | 🟡 | 编号引用 `F\d+/AC\d+/N\d+/FR\d+/D\d+` 无存在性判据（**未登记缺口**） | `doc-anchors-v5.mjs:40` |
| S18 | 🟡 | 注记标记集缺「计划产物」类（已登记） | `doc-anchors-v5.mjs:26-29` |
| S19 | 🟡 | 多坐标尾逗号/空格分隔形态不消费（**未登记缺口**） | `doc-anchors-core.mjs:114` · `-v5.mjs:37-38` |
| S20 | 🟡 | 「符号·宽」报告态仅 V5 有，两引擎覆盖不对称（未登记） | `doc-anchors-v5.mjs:176` |
| S21 | 🟡 | 各档头注「R24a 拆分——各档 ≤300 行」陈旧注释（仅注释、无机检生效） | `doc-anchors-core.mjs:8` 等 6 处 |

**未发现**（如实）：「>500 行」机检判据 0（批 12 已废干净）；「300」仅存字符/行宽判据（仍有效）与陈旧注释。

### 域 4 · 批次档 + 台账面（#43 · 4 项：0🔴/2🟡/2🔵）

| # | 严重度 | 问题 | 证据 |
|---|---|---|---|
| B1 | 🟡 | **5 档已收口但状态行未收正**（仍「设计轮待发」）；`cli-async-discard` §3 评审表 yellow #3 自己点名过、父侧未兑现 | `check-tooling-debt.md:7` · `cli-async-discard.md:7` · `core-defect-fixes.md:7` · `doc-contract-reconcile.md:7` · `eng-discipline-prompts.md:7` |
| B2 | 🟡 | `embedding-utf16-truncation.md` 重复 §6 段头（`:301` + `:304`），一段一锚被破坏 | 同档 |
| B3 | 🔵 | 归档节内部注记「以下 22 条」vs 实有 19 条（3 条已拆入 VSC 归档节，历史注记未回改） | `TODO-archive.md:80` |
| B4 | 🔵 | 6 条归档项缺规范 `status=` 标记（用「已实落」「已达成」等非规范措辞） | `TODO-archive.md:44/:58/:59/:211/:212/:213` |

**未发现**（如实）：组计数=实条目（19/3 · 20/55/8/33 全对，check-ledger 0 违规）；指针可解析；台账无仓外绝对路径指针。

## 第三节 · 待裁清单（裁决面，不定方向）

| # | 待裁 | 涉及 |
|---|---|---|
| T1 | **提示词正本 vs 落地，谁为权威？** 落地已系统性领先正本（铁律 #4 等 12 处）——回写正本 or 改认落地为权威？ | P1–P12 |
| T2 | 未立条文的用户反馈 11 条（F3/F4/F7/F9/F10/F11/F14/F15/F19/F21 等）——哪些该立条文、立在哪？ | 第一节 |
| T3 | 声明面 `.thincoder/docs-face.json` 引擎化（S1 根）——对应需求池「工程模式机制与『本仓布局』解耦」条目，归批？ | S1–S6 |
| T4 | 批 12「已收口」但 18 处残余 + Phase 4 未完成——开新批清账 or 原地补？ | D1/D2 |

## 核销记录

（批号 → 核销条目：待修复批落笔后回填）
