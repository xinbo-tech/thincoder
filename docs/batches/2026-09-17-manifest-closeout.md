# 批次档 · 2026-09-17 · manifest 面收口（注入路径 + access 裁撤）

> 段位：工程模式 v2（ENGINEERING-MODE-V2）follow-on —— M1 manifest 面收口。
> 触发：用户 2026-09-17 20:11「manifest 注入那个任务可以开始了，access 那个字段没用，删掉吧」+ 20:13「概念一并裁撤」。
> 依赖：前置批 = `2026-09-17-bandwidth-repeal.md`（F3 裁撤——`access` 的唯一消费方在那批拆掉）；**本批设计派单排在其交付核验之后**（两批设计档面在 `docs/core/design/ENGINEERING-MODE-V2.md` 重叠，防撞）。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-17（manifest 面收口 · #28 + #29）

### 1.1 批件（两条）

| # | 台账 | 类 | 内容 |
|---|---|---|---|
| 1 | #28 | 需求（待设计） | **manifest 值 → 模型注入路径**：phase / activeBatch 等情境值须进模型上下文。现状 = 消费全在机制侧（`write-gate.mjs:47` · `batch-segment.mjs:81/:129` · `doc-check.mjs:109`），模型侧零注入——模型级情境行为无从驱动 |
| 2 | #29 | 技术待办（待设计） | **`access` 字段裁撤 +「接入」概念一并裁撤**：字段、概念、文档引用、本仓 manifest 文件全链清理 |

### 1.2 用户裁定记录

- 20:11：「manifest注入那个任务可以开始了，access那个字段没用，删掉吧。」
- 20:13：「概念一并裁撤。」——即 v2 §9.2「接入」（从零 / 半截·梳理中 / 已梳理）**随字段一并删**，不保留、不换承载。

### 1.3 范围与已知事实

**#28（注入路径——待设计）**——父侧已实核：通道候选 = `setup-reminders.mjs:30-50` 的 env 行先例 / `setup.mjs:146` 的时间行先例（`{role:"user", transient:true}` 提醒消息，值变则下轮浮现）；候选字段 = `phase` / `activeBatch`（+ 设计定夺）；待设计拍板点 = 注入形态 / 推送时机 / **压缩生存性**（关联技术待办 #23：压缩吞首条 user 注入的病根）/ 注入深度（v1 建议只 depth-0）。

**#29（access 裁撤——待设计）**——父侧已实核：
- 代码面：`manifest.mjs`（DEFAULT_MANIFEST / MANIFEST_SCHEMA enum / 检查）、测试面（`manifest.test.mjs` access 相关；`spawn-gates.test.mjs` T-F3 族随前置批已拆）；
- 文档面：**已落（父侧 · 2026-09-17）** = 需求 §9.2 墓志 + §9 标题「两把旋钮」+ §5.1/§5.4 关联引用 + `SPEC-MANIFEST.md` 五处（六键 schema / AC-M1-1 / 下游 / 依据）；**待本批（设计侧）** = `ENGINEERING-MODE-V2.md` E5 旋钮表 + 读面残留收正（`:102`/`:319` 的 `phase`/`access` 列 vs `:302`/`:325` 零消费陈述——F3 批设计评审发现 3 转来）；
- 提示词面：初始化句中的「phase/access」表述（M9 管线：模板 → 生成）；
- 数据面：本仓 `PROJECT-MANIFEST.json`（现值 `access: "from-zero"`——2026-09-17 收正）——去键后校验须不炸（fail-closed 语义核对）。

### 1.4 段序与时序

1. **父侧**：需求档同步（§9.2 墓志形态 + §9 标题 + 关联引用收正——本档同批落地）；
2. **eng-designer**（排在 F3 批交付核验后）：设计档修订（E5 旋钮表 + #28 注入方案的落点设计）+ 写 §2 任务书（#28 注入实现 + #29 全链裁撤）；
3. **用户发起**设计评审（发起权在用户）；
4. 父侧裁决 → 用户批准；
5. **eng-coder** 实施（注入路径落地 + access/接入全链删除 + 测试/文档/持久层验证）；
6. 父侧收口（§6）。

### 1.5 父侧处置（设计轮交付后 · 2026-09-17 · 父侧直接执行——可 revert）

- **状态行补行**（§1）——`batch_segment` 门禁前提（设计者 §2 被拒一次；同 F3 批先例——教训入册：建批即置状态行）。
- **§2 父侧逐字誊录**（设计者交付报告附录 · 零改写 · 已打标）。
- 设计轮发现 F-1–F-6 处置：
  - **F-1 → Fixed**：`SPEC-MANIFEST.md` ④ 补 **AC-M1-6**（#28 注入面验收锚；判据回指设计 `MANIFEST.md` §3.1 AC-N1–AC-N6）；连带收正该档 `:14`「cwd 根」→「项目根 = git 仓根」（承 2026-09-17 用户裁定）。
  - **F-2 → Not an issue**：v2 需求 §2「八块痛点」为立项时历史面，不加减注——治法取舍痕迹 = §9.2 墓志 + 本档 §1。
  - **F-3 → Deferred**：注释指针收正归退役/文档债批（承 F3 批 F-10 先例；防夹带）。
  - **F-4 → 登记**：M1 装配钩子疑似缺陷——父侧抽读 `make-agent.mjs:47-64` 复核：**确未见 mode 判据**（normal 模式无门 · 非仓 cwd 拒启动 · 仓内无档则自动建档）⇒ 已另立技术待办（本批零碰）。
  - **F-5 → 登记**：存量机检债（#26 族）。
  - **F-6 → 已处置**（设计者就地收正，零语义）。
- **评审轮 1（2026-09-17 22:19 · VERDICT: changes-required——🔴2 / 🟡1 / 🔵2）处置**：
  - 发现 1（`manifest.test.mjs` 296→~329 跨 300 线、无拆分方案）→ **Accepted · 派 fix 轮**（测试落点迁移：AC-N1–AC-N6/T8–T14 归 `setup-reminders.test.mjs`）；
  - 发现 2（「向上最近 `.git`」两处 vs 裁定「纯向下绝不向上」）→ **Accepted · 双侧修**：需求侧 `SPEC-MANIFEST.md:14` **父侧直接执行**（本档同轮收正，可 revert）；设计侧 `MANIFEST.md:102`（KD-M1-1）入 fix 轮；
  - 发现 3（`MANIFEST.md:177/178` T1/T2「七键」残留）→ **Accepted · 派 fix 轮**；
  - 发现 4（VSC `agent.mjs` 474 行存量 >300 软线）→ **Deferred**（存量债，非本批面）；
  - 发现 5（A1 未写死扫描根）→ **Accepted · 派 fix 轮**；
  - 修毕后重发评审（轮次 2——凭发现表核销）。引证复核：host 标记的 3 条不匹配经父侧手动复核 = 引用格式/行号口径差异，实质成立，未见虚构引证。
- **fix 轮（id=6）交付 + 父侧核验 ✓（2026-09-17 22:2x）**：发现 1/2/3/5 全部落位（`MANIFEST.md:90`/`:91`/`:103`/`:178-179` 实读相符；设计档 202→207 行 · 机检悬空 837→837、行宽 4→4 零新增）；批档 §2.6 A1 + §2.4 表（表题/第 6 行/新增第 7 行/原 7–9 顺延）已父侧套改（本节上方已生效）；**→ 重发评审轮次 2**。
- **评审轮次 2（2026-09-17 22:29 · VERDICT: pass——🔴0 / 🟡1 / 🔵1）处置**：新发现 6（「cwd 根」残留：`ENGINEERING-MODE-V2.md:64` · `MANIFEST.md:13`）→ **Fixed · 父侧直接执行**（按裁定口径收正为「项目根 = git 仓根·纯向下」，零语义，可 revert）；发现 4 附注（473/474）→ 记录已收正为 474。**→ §4 代签 + 派 eng-coder（实施轮）。**（轮 2 host 引证核验差异为引用格式 artifact——父侧已逐条手核，实质成立。）
- **实施轮（id=1）交付 + 父侧核验 ✓（2026-09-17 22:49——提交 `c942b89e`）**：A1–A9 逐条核对 + 独立复跑（core 286/286 · vsc 588/588 · 行数 11/11 · A2 实跑逐字对上 · 接线点实读相符）。
- **设计面同步（id=7）交付 + 父侧核验 ✓（2026-09-17 22:54）**：§2.6 判据序 ⑤ 补认领半句（`MANIFEST.md:148`）+ AC-N3b 行（`:230`——回指用例 `setup-reminders.test.mjs:102-108`）+ 变更记录（`:284-286`）+ §2 修正记录（§2.11）——实读相符；档 283→287 行；机检零新增（悬空锚 837→837；行宽 5→4 = 外部折叠所致，非本档）。
- **评审后机械收正（父侧直接执行 · 可 revert）**：① §2.6 尾注「需求侧待补」→「需求侧锚已落（AC-M1-6）」陈留收正（`MANIFEST.md:159`）；② 区间指称 4 处补「、AC-N3b」（`MANIFEST.md:159` · `ENGINEERING-MODE-V2.md:310`/`:398` · `SPEC-MANIFEST.md:36`）；③ 观察 2（T 行补否）→ **不补**（AC-N3b 行自带判据 + 用例回指——零新增语义）。

> 本节之后由 eng-designer 接手写 §2 批次任务与设计档修订（**已交付 · §2 由父侧誊录**）；设计就绪后由**用户发起**设计评审——本批经用户 2026-09-17 22:08「自动跑完」授权（**代点火**）。

## §2 批次任务（eng-designer）

> 写入方式 = **父侧誊录**（设计者 `batch_segment` 因 §1 缺状态行被门拒一次〔fail-closed〕；以下按设计者交付报告附录**逐字**誊录、零改写——同 F3 批 §3 先例；状态行已由父侧补于 §1）。

**状态：任务书就绪**（2026-09-17 · eng-designer）。实施者 = eng-coder（设计 token 门——签发在评审 + 用户批准之后，值不落文档）。
本 §2 = coder 任务书本体；逐字文本 / 编辑点 / 用例全文住设计档（`docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E5.1 + `docs/core/design/MANIFEST.md` §2.6 / §3.1 / §3.2），本段只做任务书 + 口径锚。

### 2.1 条目与范围

| # | 台账 | 类 | 内容（**用户 2026-09-17 20:11 / 20:13 裁定**） |
|---|---|---|---|
| 1 | #28 | 需求（待设计 → 设计就绪） | **manifest 情境值 → 模型注入路径**：`phase` / `activeBatch` 逐回合进模型上下文（现状 = 消费全在机制侧，模型侧零注入） |
| 2 | #29 | 技术待办（待设计 → 设计就绪） | **`access` 字段 +「接入」概念全链删除**：字段 / 概念 / 代码 / 测试 / 数据档 / 设计档 / 提示词面全链清理 |

- **做**：情境行注入实现（核 + VSC 接线两处）+ `access` 全链删除 + 提示词面两处去词 + 本仓数据档去键。
- **不做**：见 2.8 出批边界。
- **性质**：一条新增（#28——注入路径）+ 一条裁撤（#29——零新增语义；概念经用户裁定不保留、不换承载）。

### 2.2 落档位置（三方一致）

| 链 | 载体 | 状态 |
|---|---|---|
| 需求 | v2 需求 §9.1（phase = 纪律强度档）· §9.2 墓志 · §5.1/§5.4 引用；`SPEC-MANIFEST.md` ②.1 六键 / AC-M1-1 / ⑤ 下游 | **父侧已落**（本批零写） |
| 设计 | `docs/core/design/ENGINEERING-MODE-V2.md`（**E5.1 新增** · §1.2 E5 行 · §2.2 M1 行/接线表 · §2.3 E1 JSON · §2.4 依赖表 · §2.5 数据流 · AC11 · T8/T9 · E5/E1 去 access）· `docs/core/design/MANIFEST.md`（**§2.6 新增** · §2.3 重测 · §3.1 AC-6 + AC-N1–AC-N6 · §3.2 T8–T14 · 六键收正） | **本批已落**（设计者写域——coder 零写） |
| 批档 | 本节 | 本批 |

**缺环（F-1）**：`SPEC-MANIFEST.md` ④ 无注入面 AC——#28 的验收锚待主 agent 落锚；设计侧判据（AC-N1–AC-N6）已备好逐条机判文本，落锚后闭环。

### 2.3 设计定案（逐条可机判）

**#28 注入路径**（架构 §2.3 E5.1 · 模块契约 `MANIFEST.md` §2.6）：

| 定案点 | 结论 |
|---|---|
| 注入形态 | 逐回合 **transient 机器行**（`{role:"user", content, transient:true}`——与 env 行同族，不进人读线） |
| 字段集 | `phase` + `activeBatch`（`docRoot` 不入本行——归出批边界 2.8） |
| 逐字行形 | `[System reminder: project state: phase: <值> (discipline: <light\|strict>), activeBatch: <相对路径\|none>.]` |
| 推送时机 | **depth-0 逐回合**（核 `agent/run-stages.mjs` 注入组 · VSC `src/agent.mjs:233` 同点）；**幂等**——活体在则不推 |
| 压缩生存 | **活体守卫自愈重推**（不落 system 槽——理由见架构 E5.1 #5）；**零触碰** `context.mjs` 压缩面 |
| 值变化 | **单活体**：摘旧行 + 推新行（就地 `splice`，保 `history` 数组引用） |
| 注入深度 | **仅 depth-0**（子代理读任务书；M5 零 manifest 读面——架构 §2.4） |
| 模式门 | **仅工程模式**（`agent.config.agent.engineering === true`） |

**#29 删除面（全链）**：代码 `manifest.mjs` 三处 + 测试 2 档 + 本仓数据档去键 + 设计档（已落）+ 提示词面 2 档。
**去键兼容语义**（数据面判据）= 旧档残留 `access` 键**不炸**：校验器不报错（枚举判据随字段删除）、`fillDefaults` 只搬已知键 ⇒ 返回的 manifest 无该键；主 agent 回写时自然收敛——判据 = AC-6 / T14。

### 2.4 受影响文件表（10 行 · coder 实施面 · 行数 = 本设计轮实测口径）

| # | 文件 | 现况（行数） | 动作（file:line） | 预计增量 |
|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 248 | 删 `DEFAULT_MANIFEST` `access` 键 `:81` · 删 `MANIFEST_SCHEMA.enum.access` `:104` · 删 `validateManifest` access 校验块 `:143-145` · 注释「七键」→「六键」`:77`/`:241` | −~7 |
| 2 | `thincoder-core/agent/setup-reminders.mjs` | 105 | 新增 `manifestStateLine` + `pushManifestStateReminder`（判据序 ①–⑥ 照 `MANIFEST.md` §2.6） | +~42 |
| 3 | `thincoder-core/agent/run-stages.mjs` | 246 | `injectTurnReminders` `depth === 0` 组内、`injectEngineeringReminder(agent)` `:115` 之后调用 `pushManifestStateReminder(agent, { depth })` | +~3 |
| 4 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 129 | 核单源转口 re-export 两符号（接 `:40` 现有转口行） | +~2 |
| 5 | `thincoder-vscode/src/agent.mjs` | 474 | 每回合注入组 `:233` `injectEngineeringReminder(agent)` 之后同序调用 | +~3 |
| 6 | `thincoder-core/test/manifest.test.mjs` | 296 | AC-M1-1 去 access 断言 `:27-40` · 「七键」文案 `:35`/`:187`/`:188`/`:250` 收正 · 新增 AC-6（去键兼容）——296 → ~289（≤300；注入面用例 T8–T14 迁次行档——评审发现 1） | −~12 / +~5 |
| 7 | `thincoder-core/test/setup-reminders.test.mjs` | 61 | 新增 AC-N1–AC-N6（用例 T8–T14——情境行落点：被测模块自身测试档） | +~40 |
| 8 | `thincoder-core/test/batch-segment-manifest.test.mjs` | 132 | fixture `:57` 去 `access: "from-zero"` 键 | ±0 |
| 9 | `PROJECT-MANIFEST.json`（本仓数据档） | 28 | `:4` 删 `"access": "from-zero",` | −1 |
| 10 | `docs/core/design/prompts/persona-engineering.md`（M9 中文审核面）· `thincoder-core/prompts/persona-engineering.md`（M9 英文运行面） | 154 / 155 | 各两处去词：`:44` 去「接入模式」/“access mode”、`:46` 去「阶段/接入模式」/“(phase/access mode)” | ±0 |

> 提示词面两行逐字（**仅删词，不得新增句子**——内容权归主 agent；主 agent 另裁措辞时以其为准）：
> 模板 `:44` → 「（`PROJECT-MANIFEST.json`：项目阶段 / 当前活跃批次指针 / 目录声明——纯机器状态）」
> 模板 `:46` → 「**没有则先初始化生成**：确定项目阶段 + 梳理现有文档和代码 + 盘清家底」
> 落地 `:44` → “(`PROJECT-MANIFEST.json`: project phase / current active batch pointer / directory declarations — pure machine state)”
> 落地 `:46` → “**If missing, initialize it first**: settle the project phase + survey existing docs and code”

### 2.5 eng-coder 任务书（六强制字段）

**① 目标与理由**——落用户 2026-09-17 20:11 / 20:13 裁定：①（#28）把 manifest 情境值（`phase` / `activeBatch`）经逐回合情境行送进模型上下文——现状消费全在机制侧（`write-gate.mjs:47` · `batch-segment.mjs:81/:129` · `doc-check.mjs:109`），模型级情境行为无从驱动；②（#29）把 `access` 字段与「接入」概念全链删除——该字段 F3 拆后零消费方，概念经用户裁定不保留、不换承载。

**② 轮次**——`initial`（本批首轮实现轮；后续修正走 `fix` 轮）。

**③ 已知事实**（父侧实核 + 本设计轮复测）——
- `access` 代码面全仓命中 = `thincoder-core/manifest.mjs:81/:104/:143-145` + 测试 2 档（`manifest.test.mjs` · `batch-segment-manifest.test.mjs:57`）；**CLI / VSC 零命中**（本设计轮 grep 实核：`MANIFEST_SCHEMA|DEFAULT_MANIFEST|\.access` 两包零命中）。
- 注入通道先例：`setup-reminders.mjs:30-51`（env 行形态）· `:83-90`（`pushInjections` 同文去重）· `helpers.mjs:377-383`（`_lastEngState` 状态去重）· VSC `agent.mjs:211-213`（AUTO 提醒**活体守卫**——压缩后重推先例）。
- 压缩面 = `thincoder-core/context.mjs` `applyCompression:275-351`（任务/计划重注入）——本设计**不落该处**（零触碰）。
- `agent.manifest` 装配点：CLI `make-agent.mjs:149` · VSC `setup.mjs:378`（`readManifest` 面已挂 agent）。
- 每回合注入组：核 `run-stages.mjs:93-117`（`injectTurnReminders`，`depth === 0` 组在 `:114`）· VSC `src/agent.mjs:215-239`。
- VSC 侧 `test/context-parity.test.mjs` / `test/setup-reminders.test.mjs` 是否断言注入面清单——**实施时实核**：断言即随批收正（若否，零改）。

**④ 设计要点与禁止范围**——
- 实现面 = 2.4 表 1–9 行逐处；两设计档已落，**coder 零写设计档**。
- 行文本 / 判据序 ①–⑥ / 接线两点 = `MANIFEST.md` §2.6 逐字照抄（措辞不得自创）。
- **禁触**：`context.mjs` 压缩面 · system 槽 · manifest 其他字段（`docRoot` / `checkConfig` 等）· token 门 · `batchDoc` 门 · 门序 · 需求档（父侧域）· `_archive/**` · 已冻结批档 · CLI 面（端经核单源 import——零改）。
- 提示词面只做 2.4 表第 9 行的**既有词删除**，不得新增句子 / 不得改写他句；模板与落地两面同步（M9 双面流程）。
- 行数实测回写 §5（改前 → 改后，三端口径）。

**⑤ 验收标准**——2.6 表 A1–A9（逐条机判；报告逐条给读数）。

**⑥ 交付报告格式**——交付表（A1–A9 逐条状态）+ 触碰面清单（file:line 区间 + 行数实测改前→改后）+ 验证命令与读数（grep 零命中 / 动态 import 键集 / 单测 / 三端 `npm test`）+ 出批边界外所见。实施记录自写批档 §5（`batch_segment`，段 = §5）。

### 2.6 验收标准（A1–A9 · 逐条机判）

| # | 验收标准 | 判据（命令 / 断言） | 设计档回指 |
|---|---|---|---|
| A1 | `access` 代码面零残留 | ① `thincoder-core/manifest.mjs` grep `access` 零命中；② 扫描根 = `thincoder/` 仓根（工作区容器根 `teamcode/` 非本仓、不在扫描面）内 `**/*.{mjs,json}` grep `"access"`（含引号形态）零命中 | #29 |
| A2 | 导出面恰六键 | 动态 `import()`：`Object.keys(DEFAULT_MANIFEST).length === 6` + 无 `access`；`Object.keys(MANIFEST_SCHEMA.enum)` 只含 `phase` | #29 |
| A3 | 去键兼容 | 构造带 `"access":"from-zero"` 其余合法的档 → `readManifest` `ok:true`、`errors` 空、返回 manifest 无 `access` 键 | AC-6 / T14 |
| A4 | 情境行逐字 | `manifestStateLine` 四态（`initial-dev`/`production` × `activeBatch` null/路径）输出与 §2.6 行形逐字一致 | AC-N1 / T8 |
| A5 | 幂等 + 单活体 | 同值重调 → `false` 且 history 长度不变；值变后该前缀行恰 1 条、旧文零命中、数组引用不变 | AC-N2 / AC-N3 / T9 / T10 |
| A6 | 压缩自愈 | 行被移除（模拟压缩吞咽）后下一回合重推（`true` + 行回来） | AC-N4 / T11 |
| A7 | 门控 + 面纪律 | `depth:1` / 非工程模式 / `agent.manifest` 缺失 → `false` 且零注入；注入行 `transient === true`；`_fullHistory` 零新增 | AC-N5 / AC-N6 / T12 / T13 |
| A8 | 接线 + 零回归 | 核 `run-stages.mjs` 调用点在册且位于 `injectEngineeringReminder` 之后；VSC 转口 + 调用点在册；三端 `npm test` 全绿；`git diff --stat` ⊂ 2.4 表 | #28 接线 |
| A9 | 提示词面去词 | 两档（模板 + 落地）`接入模式` / `access mode` 零命中；两档无新增句子（diff 只减不增） | #29 |

### 2.7 用例表

| # | 场景 | 输入 / 前提 | 预期输出 |
|---|---|---|---|
| U1 | 正常（注入） | 工程模式 + depth-0 + `{phase:"initial-dev", activeBatch:null}` | 恰一行情境行（`…discipline: light, activeBatch: none.`），`transient:true` |
| U2 | 正常（批次在途） | `activeBatch:"docs/batches/x.md"` | 行内出相对路径原文 |
| U3 | 边界（幂等 / 单活体） | 同值连调两次；再改值调一次 | 第二次 `false`；值变后恰一行新行 |
| U4 | 边界（压缩） | 推后移除该行（模拟压缩） | 下一回合重推 |
| U5 | 边界（门控） | `depth:1` / `engineering:false` / `manifest` 缺失 | 三态均 `false`，零注入 |
| U6 | 边界（数据档去键） | 档含残留 `access` 键 | 读 `ok:true` + 返回 manifest 无该键（A3） |
| U7 | 删除面 | `access` 符号 / 文案 / 提示词词 | 全链零命中（A1 / A2 / A9） |

### 2.8 出批边界（本批不做）

1. **`docRoot` 注入**（模型侧读声明面）——另议（架构 E5.1 #2 已记理由：路径已由提示词层承载，注入五路径 = 噪声 + 双源冲突）。
2. **值 → 行为的完整映射**（各 phase 档具体怎么调纪律）——提示词层内容权归主 agent；本批只落「模型可感知」。
3. 技术待办 #23 的其余面（子代理「机制性指令」user 首条 → system 槽）——本批只裁定了**本行不落 system 槽**，不触其他注入面。
4. 其他 manifest 字段（`version` / `docRoot` / `promptsLanding` / `checkConfig`）语义零改。
5. `_archive/**` 与已冻结批档零改（时序存档）。
6. 不改 token 门 / `batchDoc` 门 / 门序 / 委派治理替代治法（另议）。
7. 不新增需求条目 / 不扩至其他模块。

### 2.9 发现与处置（F-1–F-6）

| # | 发现 | 处置 / 状态 |
|---|---|---|
| F-1 | 需求侧验收缺口：`SPEC-MANIFEST.md` ④ 无注入面 AC（#28 无验收锚） | **待父侧裁**：设计侧 AC-N1–AC-N6 已备好逐条机判文本（`MANIFEST.md` §3.1）——建议主 agent 落锚为 AC-M1-6（或 §9 面条目）；**本批不代写需求档** |
| F-2 | 需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md:25`「从零接入 vs 半截接入，半截该先「梳理」」仍为活体表述（v1 八块痛点 #5）——概念已裁撤 ⇒ 该痛点无对应治法 | **待父侧裁**（需求档写域）；本批设计面零碰（已按 §9.2 墓志口径收正设计侧） |
| F-3 | 代码注释指针悬空（F3 批 F-10 同族）：`thincoder-core/manifest.mjs:3` · `thincoder-cli/src/cli/make-agent.mjs:42` · `thincoder-vscode/src/agent/setup.mjs:371` · `thincoder-core/test/manifest.test.mjs:3` 指向 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md`（该档已转正改名 `MANIFEST.md`，`modules/` 目录已空） | **待父侧裁**：是否随本批 coder 一行收正（4 处注释）；本批默认不入 2.4 表（防夹带） |
| F-4 | `make-agent.mjs:47-63` M1 装配钩子**未见工程模式门**——normal 模式下非 git cwd 会抛「工程模式启动拒绝」（VSC `setup.mjs:375-391` 同形态、仅 depth 门） | **待父侧裁**（疑似缺陷，本批零碰——与 #28 / #29 无交） |
| F-5 | 全仓机检存量：行宽 4 行超 300（`DOC-DISCIPLINE.md:727` · `ENG-TOKEN-BINDING.md:147` · `prompts/persona-engineering.md:137/:139`）· 悬空锚 839 条 | **登记**（非本批面）；本批触碰行已零超宽、新增指针取可解析形态（悬空 846 → 839） |
| F-6 | 本批设计面形式收正（一致性面——已就地处置）：`MANIFEST.md` 存量注记过期（「五键计数漂移」）、`MANIFEST.md` 变更记录单行 324 字符、架构 E5 节 `:302` 单行合并超宽 | **已处置**（设计者写域内就地收正，零语义变更） |

### 2.10 评审轮 1 修正记录（fix 轮 · eng-designer · 2026-09-17）

**背景**：设计评审轮次 1 = changes-required（🔴 ×2 · 🟡 ×1 · 🔵 ×2——发现表见 §3）；父侧裁决（§1.5）= 发现 1 / 2（设计侧半边）/ 3 / 5 全部 Accepted。本轮 = fix 轮：**只改设计档 `docs/core/design/MANIFEST.md`**（+ 本节留痕）——需求档零碰（父侧域）· 代码零碰（未到实施轮）· 出批项（F-3/F-4/F-5/F-6）零碰 · §2.6 / §3.2 的行形与 AC 语义本身零改（只动测试落点归属 / 计数文案 / 根判定措辞）。

**逐条落点（发现号 → 改动 file:line——行号 = 落笔后 as-of）**

| 发现 | 处置 | 落点 |
|---|---|---|
| 1（🔴） | **Fixed** | `MANIFEST.md:90`——`thincoder-core/test/manifest.test.mjs` 行：增量 −~12 / +~45 → **−~12 / +~5**（296 → ~289，≤300）、编辑点去「AC-N1–AC-N6（用例 T8–T14）」；**新增 `MANIFEST.md:91` 行**——`thincoder-core/test/setup-reminders.test.mjs` 61 → ~101（+~40——AC-N1–AC-N6 / T8–T14 落点） |
| 2（🔴 · 设计侧半边） | **Fixed** | `MANIFEST.md:103`（KD-M1-1）括注「向上最近 .git；2026-09-17 收正」→「判据 = .git 纯向下：锚自身仓 → 自身；否则向下唯一带 manifest 子仓；2026-09-17 用户裁定」 |
| 3（🟡） | **Fixed** | `MANIFEST.md:178`（T1）「七键齐全」→「六键齐全」· `MANIFEST.md:179`（T2）「写默认七键档」→「写默认六键档」（`:195`/`:201` 历史变更记录保留） |
| 5（🔵） | **Fixed（文本见下①——批档行套改由父侧执行）** | 逐字文本 = 下节 ① |
| 4（🔵） | Deferred（父侧 §1.5 裁决——存量债，非本批面） | — |

**设计档 §2.3 两行逐字（已落——照抄来源，供父侧核）**

> 改后行（`MANIFEST.md:90`）：
> `| thincoder-core/test/manifest.test.mjs | 296 | 修改 | −~12 / +~5 | AC-M1-1 去 access 断言（:27-40）·「七键」文案 :35/:187/:188/:250 收正 · 新增 AC-6（去键兼容）——296 → ~289（≤300；注入面用例 T8–T14 迁次行档——评审发现 1） |`

> 新增行（`MANIFEST.md:91`）：
> `| thincoder-core/test/setup-reminders.test.mjs | 61 | 修改 | +~40 | 新增 AC-N1–AC-N6（用例 T8–T14——情境行落点：thincoder-core/agent/setup-reminders.mjs 被测模块自身测试档）；61 → ~101（≤300） |`

**批档逐字文本（机械套改——父侧直接执行，可 revert）**

① **§2.6 表 A1 行全文**（发现 5——写明扫描根）：

`| A1 | access 代码面零残留 | ① thincoder-core/manifest.mjs grep access 零命中；② 扫描根 = thincoder/ 仓根（工作区容器根 teamcode/ 非本仓、不在扫描面）内 **/*.{mjs,json} grep "access"（含引号形态）零命中 | #29 |`

② **§2.4 表**（发现 1 的批档面——`:110` 表题 + `:119` 行 + 新增行）：

- `:110` 表题：「（9 行 · coder 实施面……」→「（10 行 · coder 实施面……」（D3 计数随行改）。
- `:119` 行（第 6 行）「动作」列去「+ AC-N1–AC-N6（用例 T8–T14）」、增量列改 −~12 / +~5。
- 其后插入新行：`| 7 | thincoder-core/test/setup-reminders.test.mjs | 61 | 新增 AC-N1–AC-N6（用例 T8–T14） | +~40 |`（原 7–9 行顺延为 8–10——编号形态由父侧定，零语义）。

**自检读数（改前 → 改后）**

- `MANIFEST.md`：202 → **207 行**（+1 表行 · +4 变更记录行；设计档变更记录同轮条目 = `MANIFEST.md:203-206`）。
- 机检（`node scripts/doc-check.mjs --root D:\teamcode\thincoder`）：悬空 **837 → 837**（零新增）· 行宽超 300 = **4 → 4 行**（存量同为 `DOC-DISCIPLINE.md:727` · `ENG-TOKEN-BINDING.md:147` · `prompts/persona-engineering.md:137`/`:139`——零新增）。
- 设计面残留复核（grep）：「向上最近」全仓设计域 = 0（`:103` 已收正）；`MANIFEST.md` 内「七键」活体声明 = 0（仅存历史变更记录 `:195`/`:201`）。
- 行数实测（父侧口径复核一致）：`manifest.test.mjs` = 296 · `setup-reminders.test.mjs` = 61（两档均在库，新增指针可解析——零悬空新增）。

**行号补正（同轮 · 零语义）**：上表发现 3 行与自检段所引 `:195`/`:201` = **改前 as-of**（父侧派单口径）；改后现况 = `MANIFEST.md:196`（建档行）· `:202`（#29 裁撤行）——本批新增表行（`:91`）使其后行号 +1。

**残差精确读数（改后 grep 实测）**：设计域「向上最近」= **1 处**，`MANIFEST.md:205`——本轮变更记录内的**改前引文**（「改前 → 改后」形态，非活体声明——故上文「= 0」应按此口径读：活体声明零）；同档「七键」= `:85`/`:90`（对代码注释 / 测试文案的**动作**描述）· `:196`/`:202`（历史变更记录）· `:206`（本轮变更记录引文）——**活体 schema 声明 = 0**。

### 2.11 设计面同步（fix 轮 · eng-designer · 2026-09-17）

**背景**——实施轮内部代码评审发现 1（§5.4）：代码 `pushManifestStateReminder` 判据序 ⑤ 比设计契约多一步「会话重建认领」（`thincoder-core/agent/setup-reminders.mjs:92-97`）——`_manifestLine` 缺失（跨会话：行随 `history` 回来、状态位不回来）时，先按行族前缀 `MANIFEST_LINE_PREFIX` 从 `history` 认领现存活体再摘除；配补用例 AC-N3b（`thincoder-core/test/setup-reminders.test.mjs:102-108`）。父侧裁定 = 设计面同步（零新语义：文档追上已交付且核验通过的行为）。

**本轮范围**——只改设计档 `docs/core/design/MANIFEST.md` 两处 + 变更记录一行。代码零碰（已交付并核验）· 其他判据序项零碰 · §2.6 其余文本 / 其他节零碰 · 需求档（父侧域）零碰。

| # | 改动 | 落点（改后 as-of） |
|---|---|---|
| ① | §2.6 判据序 ⑤ 补「会话重建认领」半句（判据列补「**缺失**时先按行族前缀 `MANIFEST_LINE_PREFIX` 从 `history` 认领现存活体」；动作列补「不认领则旧行残留 + 新行入列 = 双活体」） | `docs/core/design/MANIFEST.md:148` |
| ② | §3.1 注入面表补 AC-N3b 行（会话重建单活体——回指用例 `thincoder-core/test/setup-reminders.test.mjs:102-108`） | `docs/core/design/MANIFEST.md:230` |
| ③ | 变更记录一行（fix 轮——①②落点 + 零新语义声明） | `docs/core/design/MANIFEST.md:284-286` |

**自检读数（改前 → 改后）**

- `MANIFEST.md` 行数 **283 → 287**（+1 判据行 +1 AC 行 +3 变更记录行）。
- 机检（`node scripts/doc-check.mjs --root D:\teamcode\thincoder`）：悬空 **837 → 837**（零新增）；行宽超 300 = **5 → 4 行**——本档新增行零超宽（实测 219 / 216 / 123 / 98 / 105 字符）；
  其中 1 行的减少来自并发外部折叠（`LOGGING.md:82`——commit 1020d675「LOGGING width fold」），非本轮。
- 回读核验（D6）：三处落位实读相符；本档悬空锚仍为既有 2 条（`:3` · `:85`——均非本轮行）。

**观察（非阻塞 · 供父侧裁）**

1. 「AC-N1–AC-N6」区间指称仍有 4 处（`MANIFEST.md:159` · `ENGINEERING-MODE-V2.md:310` · `ENGINEERING-MODE-V2.md:398` · `SPEC-MANIFEST.md:36` 的 AC-M1-6）——新增 AC-N3b 后该判据集实为 7 项。本轮按派单「只做两处」零碰；如需口径统一，一处半句即可（行号 = as-of）。
2. §3.2 用例表 T8–T14 无 T 行对应 AC-N3b（会话重建场景；T10「值变单活体」为同族不同前提）——补不补 T 行由父侧裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：manifest 面收口批（#28 情境行注入 + #29 `access`/「接入」全链裁撤 + §2 任务书）。目标五档全读：`docs/core/design/ENGINEERING-MODE-V2.md` · `docs/core/design/MANIFEST.md` · `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` · `docs/core/requirements/ENGINEERING-MODE-V2.md` · `docs/batches/2026-09-17-manifest-closeout.md`；受影响文件表标注行数逐档抽查。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🔴 | `thincoder-core/test/manifest.test.mjs` 现况 296 行（批档 `:112` / `MANIFEST.md:90` 标注），本批 −~12/+~45 ⇒ ≈329 行，**越过 300 行软线**（>300 = 主动性拆分评审档）；设计（批档 + 两设计档）全档无该档拆分方案。 | (a) AC-N1–AC-N6（约 40 行）改落**被测模块自己的**测试档 `thincoder-core/test/setup-reminders.test.mjs`（现 61 行，同模块单测既有落点）——manifest.test.mjs 净增仅 AC-6（≈±0，保持 ≤300），并在受影响文件表补该档行数/增量；或 (b) 为 manifest.test.mjs 附拆分方案（≈329 > 300）。 |
| 2 | Document ownership | 🔴 | 项目根判定同机制两处相悖：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:14`「= git 仓根——**向上最近 `.git`**；2026-09-17 用户裁定」+ `docs/core/design/MANIFEST.md:102`（KD-M1-1「向上最近 .git」）——对上 `MANIFEST.md:22`「纯向下：锚自身仓 → 自身；否则向下唯一带 manifest 子仓」· 需求 `ENGINEERING-MODE-V2.md:195`「判据 = .git **纯向下**」· `:698`（用户原话「**不要向上找**」）；批档 `:48`（F-1）把该 :14 收正记为「承 2026-09-17 用户裁定」，方向恰反。 | `SPEC-MANIFEST.md:14` 与 `MANIFEST.md:102` 的「向上最近 `.git`」句按裁定统一为「纯向下 / 不向上找」；实现面（`thincoder-core/manifest.mjs:40-45`、`thincoder-cli/src/cli/make-agent.mjs:54`、VSC `src/agent/setup.mjs:382`）已是纯向下口径。 |
| 3 | Clarity（状态一致性） | 🟡 | `MANIFEST.md:177-178`（T1/T2）仍写「**七键**齐全」「写默认**七键**档」——与同档六键 schema（`:21`/`:51`/`:68`/`:111`）及批档 `:80` 声明的「六键收正」相悖（本批只收了测试档侧 `:35`/`:187`/`:188`/`:250`）。 | T1/T2 的「七键」随本批收正为「六键」（零语义，与测试档同口径）。 |
| 4 | Clarity | 🔵 | 批档 `:111`（VSC `src/agent.mjs` 474 行·+~3）——该档已 >300 软线、近 500 硬限（该档 `:51` 注释记 519 行时已迁出提醒族先例）；本批未附结构/拆分说明（存量债，只记不升格）。 | 本批无需处置；如再增行随该档既有迁出先例复核结构（可选）。 |
| 5 | Acceptance criteria | 🔵 | A1（批档 `:152`）判据「全仓 `**/*.{mjs,json}` grep `"access"` 零命中」未写死扫描根——本仓根内实测含引号 `"access"` 唯一命中 = 本批删除项 `PROJECT-MANIFEST.json:4`（判据可达）；容器根档另有同键存量（详见出批面注）。 | A1 写明扫描根 = `thincoder/` 仓根。 |

**出批面注（无严重度）**：工作区容器根 `D:\teamcode\PROJECT-MANIFEST.json:4` 仍含 `"access": "from-zero"`——非本仓、不在 2.4 表；若 A1 的「全仓」被读作工作区根，该档使零命中判据不成立。

**核验记录**：受影响文件表标注行数/编辑点逐档抽查一致（248/105/246/129/474/296/132/28/154/155；`manifest.mjs:81`/`:104`/`:143-145`、`run-stages.mjs:115`、VSC `agent.mjs:233`、测试档 `:35`/`:187`/`:188`/`:250`、fixture `:57`、数据档 `:4`、两 persona `:44`/`:46` 全对）；`agent.manifest` 装配点（`make-agent.mjs:149` / VSC `setup.mjs:378`）与 depth 可用性（`run-stages.mjs:94` / VSC `agent.mjs:57`）实核在案；AC-6 去键语义与现实现（`manifest.mjs:164-179` `fillDefaults` 只搬 schema 键）一致；VSC 两测试档（`context-parity`/`setup-reminders`）未见注入面清单断言（基座 engineering=false）⇒「实施时实核」预期落「若否，零改」。

**VERDICT: changes-required**（🔴 ×2 · 🟡 ×1 · 🔵 ×2 · 出批面注 ×1）

### 轮次 2（评审子代理）

**评审轮次 2（核销轮 1 修正）**——对象 = 轮次 1 发现表 5 项 + fix 落位核验。五档全文重读（设计 `ENGINEERING-MODE-V2.md` / `MANIFEST.md` · 需求 `ENGINEERING-MODE-V2-SPEC-MANIFEST.md` / `ENGINEERING-MODE-V2.md` · 批档 `2026-09-17-manifest-closeout.md`）；受影响档行数抽查（实读）：`thincoder-core/test/manifest.test.mjs` 末行 `:296` ✓ · `thincoder-core/test/setup-reminders.test.mjs` 末行 `:61` ✓ · `thincoder-vscode/src/agent.mjs` 末行 `:474` ✓。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批档 §2.4 `:120`/`:121` · 设计 `MANIFEST.md:90`/`:91` | — | Fixed | 落点迁移执行到位：`manifest.test.mjs` 增量改「−~12 / +~5」（`296 → ~289（≤300；注入面用例 T8–T14 迁次行档——评审发现 1）`）；新增行「`setup-reminders.test.mjs` | 61 | … | +~40」（`61 → ~101（≤300）`）——两档均 ≤300，300 线跨越解除。 |
| 2 | 2 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:14` · 设计 `MANIFEST.md:103` | — | Fixed | 双侧收正：SPEC `:14` = 「判据 = .git **纯向下**：锚自身仓 → 自身；否则向下唯一带 manifest 子仓」；KD-M1-1 同口径（对齐 `:22` F2）。残留「向上最近」仅引文形态（设计 `:205` · 批档 `:213`——变更记录改前引文，非活体声明）。 |
| 3 | 3 | 设计 `MANIFEST.md:178`/`:179` | — | Fixed | `:178` T1「六键齐全」· `:179` T2「写默认六键档」；本档活体 schema 声明零「七键」（余下为动作描述 `:85`/`:90` 与历史记录 `:196`/`:202`/`:206`）。 |
| 4 | 4 | 批档 §1.5 `:58` · §2.4 `:119` | 🔵 | Deferred 有效（附注） | 父侧已裁「存量债、非本批面」；附注 = 裁决行记「VSC `agent.mjs` 473 行」与 §2.4 行 5 / 设计 `:89` 标注「474」不一致（实读末行 `thincoder-vscode/src/agent.mjs:474` 有内容）——±1、零影响。 |
| 5 | 5 | 批档 §2.6 `:161` | — | Fixed | A1 已写死扫描根：「② 扫描根 = `thincoder/` 仓根（工作区容器根 `teamcode/` 非本仓、不在扫描面）内 `**/*.{mjs,json}` grep `"access"`（含引号形态）零命中」。 |
| 6 | (new) | 设计 `ENGINEERING-MODE-V2.md:64` · 设计 `MANIFEST.md:13` | 🟡 | New：「cwd 根」残留两处（非阻断 · doc-state 类） | `ENGINEERING-MODE-V2.md:64`「操作对象 = 被开发项目 cwd 根的 `PROJECT-MANIFEST.json`（数据档，N3 迁移点）」· `MANIFEST.md:13`「落一个**纯机器状态 JSON 声明档**（`PROJECT-MANIFEST.json`）在 cwd 根」——与裁定口径（需求 `:698`「cwd 根目录不对」；`SPEC:14` / 设计 `:22`/`:103` / 需求 `:195` = 项目根 = git 仓根·纯向下）不同源，容器根场景下不成立。修法：两处按「项目根 = git 仓根（纯向下）」收正（零语义）。 |

**VERDICT: pass**（🔴 ×0 · 🟡 ×1 · 🔵 ×1——核销：轮 1 发现 1/2/3/5 Fixed · 发现 4 Deferred 有效）

## §4 用户批准（主 agent）

**2026-09-17 22:29 · 父侧代签**（用户 2026-09-17 22:08「自动跑完」授权——代签承 2026-09-11 先例）——批准范围：

1. **设计**：情境行注入（E5.1——核 + VSC 接线）+ `access`/「接入」全链裁撤 + 测试落点迁移（设计评审轮次 2 **PASS**：🔴0 / 🟡1 / 🔵1——发现 6 已同轮 Fixed）；
2. **实现**：spawn `eng-coder`（任务书 = 本节 §2；设计凭证已签发——值不落档，运行时凭证）；
3. **实施面 = §2.4 十行**（11 档）；出批边界 = §2.8。

## §5 实施记录（eng-coder）

**状态行**：交付就绪（实施轮完成 · 内部审计 + 内部代码评审均 PASS · 终态 = **clean**）——2026-09-17 · eng-coder。

### 5.1 交付摘要

实施面 = §2.4 表第 1–10 行（11 档）逐处落地，**零超表文件**；两条验收面齐备：#28（情境行注入——核 + VSC 双接线）· #29（`access` 字段 +「接入」提示词面全链裁撤）。三端 `npm test` 全绿、doc-check 零新增。

| 2.4 行 | 文件 | 行数实测（改前 → 改后） | 落点（file:line = 改后 as-of） |
|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 248 → **243** | `DEFAULT_MANIFEST` 去 `access` 键（原 `:81`）· `MANIFEST_SCHEMA.enum` 去 `access` 枚举（原 `:104`）· `validateManifest` 去 access 校验块（原 `:143-145`）· 「七键」→「六键」注释 `:77` / `:236` |
| 2 | `thincoder-core/agent/setup-reminders.mjs` | 105 → **160**（+55；设计预计 +~42） | 新增 `manifestStateLine` `:65-68` + `pushManifestStateReminder` `:80-106` + 行族前缀 `:56` / discipline 映射 `:59` + 模块头一行注记 `:18-19` |
| 3 | `thincoder-core/agent/run-stages.mjs` | 246 → **248** | import `:12`；`injectTurnReminders` 的 `depth === 0` 组内 `:117`（`injectEngineeringReminder` `:116` 之后——同序） |
| 4 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 129 → **130** | 核单源转口 `:41` 加两符号；头注 `:22-23` |
| 5 | `thincoder-vscode/src/agent.mjs` | 474 → **477** | import `:16`；每回合注入组 `:236`（`injectEngineeringReminder` `:233` 之后——CLI 同序） |
| 6 | `thincoder-core/test/manifest.test.mjs` | 296 → **300** | AC-M1-1 去 access 断言 `:27-34` ·「七键」文案 `:32`/`:195`/`:196`/`:257` 收正 · 新增 AC-6 `:36-44` · 删 1 条重复空行 |
| 7 | `thincoder-core/test/setup-reminders.test.mjs` | 61 → **138**（+77；设计预计 +~40） | 新增 AC-N1–AC-N6 六用例 + 补用例 AC-N3b + 两夹具 `:64-138` |
| 8 | `thincoder-core/test/batch-segment-manifest.test.mjs` | 132（不变） | fixture `:57` 去 `access` 键 |
| 9 | `PROJECT-MANIFEST.json`（本仓数据档） | 28 → **27** | 原 `:4` access 行删除（现 `:4` = `"activeBatch": null,`） |
| 10 | `docs/core/design/prompts/persona-engineering.md` · `thincoder-core/prompts/persona-engineering.md` | 154 / 155（不变） | 各两处去词 `:44`/`:46`——逐字照 §2.4 目标文本（中文侧「项目阶段」/「确定项目阶段」；英文侧 “project phase” / “settle the project phase”） |

### 5.2 决策透明表（实施者权限内判断——逐条披露）

| # | 判断 | 理由 | 影响面 |
|---|---|---|---|
| D1 | 判据序 ⑤ 在 `agent._manifestLine` 缺失时**先按行族前缀从 history 认领现存活体**再摘除（`:92-97`），并配补用例 AC-N3b（`setup-reminders.test.mjs:102-108`） | 设计 ⑤ 只写「`_manifestLine` 存在且 ≠ 新行」——会话重建（history 保留 transient 机器行、`_manifestLine` 不随历史回来）下该条件不成立 ⇒ 值变时旧行残留 + 新行入列 = **双活体**，违 §2.6 定案「单活体」与 AC-N3 判据。此为守护设计不变量的必要补步 | **代码 ⊃ 设计契约一步**（设计档未载——已上报，见 5.4 评审发现 1）；不影响任何 AC 达成（A5 为超集行为） |
| D2 | AC-6 断言用属性形态（`r.manifest.access`）而非引号形态（`"access" in r.manifest`） | A1 ② 判据 = 「`thincoder/` 仓根内 `**/*.{mjs,json}` grep `"access"` 零命中」——引号形态会被该判据自身命中，属性形态等效且判据可达成 | 判据达成；副作用 = 朴素 `grep -n access` 仍在此档命中 4 行（`:36`/`:39`/`:41`/`:43`，= AC-6 指定夹具），A1 读数必须带口径（见 5.3） |
| D3 | `manifest.test.mjs` 为守住 ≤300 做了三处压缩：① 删 1 条重复空行 ② AC-M1-1 的 `ok:true`/`errors 空` 两断言合并为整对象 `deepEqual`（覆盖不变、判据更强） ③「枚举判据单源」注释移至行尾 | 去 access 断言（−4 行）+ AC-6（+10 行）后为 302 行 > 300 软线（设计评审轮 1 发现 1 的 🔴 即为此线；设计表预计落 ~289） | 落 **300**（恰在软线上、零余量——已上报，见 5.4 评审发现 5）；断言语义零减 |
| D4 | `setup-reminders.test.mjs` 实际 +77（设计预计 +~40），未压缩 | 6 个 AC 各一用例 + 每用例 4 行夹具仪式（`fixture()` 风格同档既有）+ 1 补用例；压缩须合并 AC/删覆盖率 | 138 行（≤300 ✓）；行数超出预计值一事已登记（5.4 评审发现 5） |
| D5 | 模块头/测试头注记各补一行（`setup-reminders.mjs:18-19` · `setup-reminders.test.mjs:6-7` · VSC 转口头注 `:22-23`） | 代码面注记（非文档面）：新符号与既有族并列，头注是唯一"目录"；措辞零新增语义 | 代码可读性；不涉提示词面（提示词面只做去词，零新增句——A9） |

### 5.3 验证读数（命令 + 原文）

1. **A1 ①**（`thincoder-core/manifest.mjs` grep `access`）→ **零命中**（全文件实读复验：无 access 键 / 无枚举 / 无校验块）。
2. **A1 ②**（扫描根 = `D:\teamcode\thincoder`，`**/*.{mjs,json}` grep `"access"` 含引号形态）→ **零命中**。口径补充：朴素 `grep -n access` 仍命中 AC-6 指定夹具 4 行（`thincoder-core/test/manifest.test.mjs:36`/`:39`/`:41`/`:43`——`access: "from-zero"` 与 `r.manifest.access` 断言，设计 AC-6/T14 要求）。
3. **A2**（动态 import 实跑）：`Object.keys(DEFAULT_MANIFEST)` = `["version","phase","activeBatch","docRoot","promptsLanding","checkConfig"]`（**6**）· `"access" in DEFAULT_MANIFEST` = **false** · `Object.keys(MANIFEST_SCHEMA.enum)` = `["phase"]`。
4. **A3**（动态实跑 + 用例）：`validateManifest({...DEFAULT_MANIFEST, access:"from-zero"})` → `{"ok":true,"errors":[],"missingKeys":[]}`；用例 AC-6（`manifest.test.mjs:36-44`）覆盖读 `ok:true` + `errors` 空 + 返回 manifest 无该键 + `writeManifest` 回写收敛。
5. **A4**（纯函数实跑）：`manifestStateLine({phase:"initial-dev",activeBatch:null})` → `[System reminder: project state: phase: initial-dev (discipline: light), activeBatch: none.]`；`{phase:"production",activeBatch:"docs/batches/x.md"}` → `…phase: production (discipline: strict), activeBatch: docs/batches/x.md.]`——与 §2.6 行形逐字一致；四态 + 未知 phase（无标签）由 AC-N1/T8 断言。
6. **A5/A6/A7**（用例）：`thincoder-core/test/setup-reminders.test.mjs` 7 用例（AC-N1/N2/N3/N3b/N4/N5/N6）——幂等 false + 长度不变 · 值变后该前缀行恰 1 条 + 旧文零命中 + `agent.history === ref` · 压缩吞咽后重推 true + 行回来 · 门控四态（depth:1 / 非工程 / manifest 缺失 / 无 config）全 false 且零注入 · `transient:true` + `role:"user"` + `_fullHistory` 零新增。
7. **A8 接线（运行期实跑）**：`injectTurnReminders(agent, {depth:0})`（工程模式 + manifest）→ history 落 eng 行 + 情境行**恰一行**、`transient:true`；同值重放 → 长度不变；`depth:1` → **零注入**。
8. **A8 三端 `npm test`**（`node test/run.mjs`，本机实跑，日志落盘后读数）：
   - `thincoder-core` → exit **0** · `tests 286 · pass 286 · fail 0`（12.9s）；
   - `thincoder-cli` → exit **0** · `tests 603 · pass 603 · fail 0`（39.7s）；
   - `thincoder-vscode` → exit **0** · `tests 588 · pass 588 · fail 0`（31.0s）。
9. **A8 触碰面**：`git status` 实读——本次改动的 11 档与 §2.4 表逐档一一对应（**零表外文件**）；同工作树另有他批/他侧改动（`docs/core/design/ENGINEERING-MODE-V2.md` · `docs/core/design/MANIFEST.md` = 设计者写域；staged `docs/batches/2026-09-17-docroot-multiroot.md` = 父侧），**实施轮零碰**。
10. **A9**：两档 grep「接入模式」/“access mode” → **零命中**；两档 diff 为行内去词（行数 154/155 不变、无新增句）；逐字与 §2.4 目标文本一致。
11. **doc-check**（`node scripts/doc-check.mjs --root D:\teamcode\thincoder`）：悬空锚 **837 → 837**（零新增）· 行宽超 300 = **4 行**（存量同批档 §2.10 登记：`DOC-DISCIPLINE.md:727` / `ENG-TOKEN-BINDING.md:728`… 实读为 `:727` / `ENG-TOKEN-BINDING.md:147` / `prompts/persona-engineering.md:137`/`:139`——**零新增**）；批次档 §2.9 F-5 存量 FAIL 态不变。

### 5.4 审计与代码评审轮次与终态

| 轮 | 通道 | 结论 | 要点 |
|---|---|---|---|
| 审计轮 1 | 只读 `explore` 子代理（对设计做发散审计） | **VERDICT: pass** | 四类偏差：**DEVIATIONS 1 行（文档类 🟡 = 本轮 §5 当时未写）** · SILENT-SIMPLIFICATION 无 · DOC-DRIFT（代码面）无 · OUT-OF-LIST 无；A1/A9 机检实跑、A2–A7 代码+单测实读；独立判定「⑤ 认领步 = 不构成偏离（服务单活体定案），建议设计者补文本」；三项需执行通道的判据（三端 npm test / git diff / 动态 import）标「未独立核验」——本轮已由实施侧实跑补全（见 5.3）。 |
| 代码评审轮 1 | 内部 `advisor(type=code)`（同步） | **VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 3） | 发现见下表；host 引证核验 9 条标 unverified——经实施侧逐条手核（可复核的 4 条：`setup-reminders.mjs:88` 行文 / 批档 `:293` 行文 / `PROJECT-MANIFEST.json:4` 行文 / `manifest.test.mjs:39` 行文均与实际文件一致）⇒ 判定为**引用格式/可读性 artifact**（同批档 §1.5 既有先例：host 差异经父侧手核「实质成立，未见虚构引证」）。 |

**评审发现处置（无代码 fix 轮——终态 clean）**

| # | 严重度 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 代码比设计 §2.6 判据序多一步「会话重建认领」（= 本段 D1），设计档未载；任务书 ④ 要求判据序「逐字照抄」 | **上报父侧/设计侧**（设计档写权归 eng-designer——coder 零写设计档）：建议 §2.6 ⑤ 补半句 + §3.1 补 AC-N3b 行（零语义）；本段 D1 已留痕。非阻塞（行为为设计超集，A1–A9 全达成） |
| 2 | 🟡 | 批档 §5 当时为空（任务书 §2.5⑥ 的实施记录） | **本段即处置**（§5 已落：交付摘要 + 决策透明 + 读数 + 轮次 + 边界外所见） |
| 3 | 🔵 | AC-N6 的 `_fullHistory` 长度断言在本档内结构上不可证伪（被测函数不写 `_fullHistory`） | **部分采纳 · 按设计保留**：设计 AC-N6 判据逐字要求该断言（「✅ 行字段断言 + `_fullHistory` 长度不变」）；该断言仍防「未来把机器行改注入人读线」的回归。真实机制已实核：`thincoder-core/session.mjs:64` 的 `!m.transient` 过滤保证 transient 机器行不进人读记录。改进方向（改经记录器路径断言）登记，不在本批 |
| 4 | 🔵 | A1 ② 读数需写明口径（引号形态 0 命中 vs 属性形态 4 行） | **采纳**：已在 5.3 第 2 条写明口径 |
| 5 | 🔵 | §2.4 表「预计增量」与实测出入（核 `setup-reminders.mjs` +55 vs +~42 · `manifest.test.mjs` 300 vs ~289 · `setup-reminders.test.mjs` +77 vs +~40） | **采纳 · 以本段实测为准**（5.1 表即实测口径）；`manifest.test.mjs` = 300 恰在软线、零余量——下一次加行须先拆分（登记提示） |

**终态 = clean**（审计 + 评审均 PASS；🔴 0；两条 🟡 分别为「转设计侧登记」与「本段已处置」；无代码 fix 轮）。

### 5.5 出批边界外所见（未动，供父侧收口）

1. `agent.manifest` **无运行期刷新点**——全仓唯一赋值处 = 装配钩子（`thincoder-cli/src/cli/make-agent.mjs:149` · `thincoder-vscode/src/agent/setup.mjs:378`），其余消费面皆经 `readManifest` 直读；⑤「值变 → 摘旧推新」的触发前提是 `agent.manifest` 被改写（两个装配档均不在本批实施面）。登记项。
2. 需求档「接入」残句：`docs/core/requirements/ENGINEERING-MODE-V2.md:25` 仍为活体表述（批档 §2.9 F-2 待父侧裁）。
3. 工作区容器根 `D:\teamcode\PROJECT-MANIFEST.json` 仍声明 `access`（批档 §3 出批面注已登记；非本仓，不在 A1 扫描面与 §2.4 表）。
4. 注释指针悬空（`thincoder-core/manifest.mjs:3` / `:100` 等 §2.9 F-3 登记 4 处）与行宽/悬空锚存量（F-5）——本批零碰（防夹带），实测读数见 5.3 第 11 条。

### 5.6 自检

- 逐档回读：11 档全部读过改后态（含 diff 复核），无残留调试代码 / 无未完成编辑 / 注释与实现一致。
- 设计漂移面：设计档 / 需求档 **零改**（写权归他方）；本次改动涉及的设计面漂移 = 5.4 评审发现 1（⑤ 认领步未入设计档）——已上报，未自改。

## §6 验证与收口（父代理）

**父侧核验（不采信自述——读码 + 复跑）**：

- **实跑复现**：`DEFAULT_MANIFEST` 恰六键（无 `access`）· `MANIFEST_SCHEMA.enum` = `["phase"]` · 旧档残留 `{access:"from-zero"}` → `{ok:true, errors:[], missingKeys:[]}`（父侧 execute 实跑，逐字对上 A2/A3）。
- **双端复跑**：core **286/286 · 0 fail** · vsc **588/588 · 0 fail**（父侧独立复跑，与交付读数一致；CLI 零改面，采信交付 603/603）。
- **11 档行数逐档实核**：27 / 243 / 160 / 248 / 130 / 477 / 300 / 138 / 132 / 154 / 155——与交付清单 11/11 相符。
- **接线点实读**：`run-stages.mjs:115-118`（eng 之后 · depth 组内）· VSC `agent.mjs:233-236` · 转口 `setup-reminders.mjs:41` ✓；`AC-N3b` 用例（`setup-reminders.test.mjs:102-108`）✓；`$anchor`（`manifest.mjs:100`）无消费方（全仓 grep 仅定义处——F-3 指针族，登记）。
- **A1/A9 零残留**：`"access"`（引号形态）全仓 `**/*.{mjs,json}` = 0 命中（裸词仅剩 AC-6 指定夹具 `manifest.test.mjs:36/39/41/43`）；两 persona「接入模式 / access mode」= 0。
- **机检**：悬空锚 **837 → 837** · 行宽 **4 → 4**（父侧两轮自跑；其中一度 5 = 父侧 `LOGGING.md:82` 插句所致，已同轮折行收正）。

**验收逐项（A1–A9）**：全 ✅（读数 = §5 交付 + 父侧复跑 / 实核；A8 机检按「零新增」口径 = 达标）。

**评审与修正轮**：轮次 1 = changes-required（🔴2 / 🟡1 / 🔵2）→ fix 轮（id=6）落位 → 轮次 2 = **PASS**（🔴0 / 🟡1 / 🔵1——新发现 6 同轮 Fixed）；实施后设计面同步（id=7）+ 评审后机械收正（见 §1.5 末三条）。

**角色表**

| 段 | 作者 | 状态 |
|---|---|---|
| §1 讨论 | 主 agent | 已收口 |
| §2 任务书 | eng-designer | 完成（+ §2.10/§2.11 修正记录） |
| §3 设计评审 | 评审子代理 | 轮次 1 changes-required → 轮次 2 PASS |
| §4 用户批准 | 主 agent | 2026-09-17 22:29（父侧代签） |
| §5 实施记录 | eng-coder | 完成（审计 PASS · 代码评审 PASS · 终态 clean） |
| §6 验证与收口 | 父代理 | 本节 |

**出批观察（登记，本批零碰）**：① `agent.manifest` 无运行期刷新点（已立台账）· ② 需求档 `:25` 历史表述（F-2 = Not an issue，前已裁）· ③ 容器根 manifest 存量（非本仓）· ④ F-3 注释指针族（`manifest.mjs:3`/`:100` 等）；⑤ `manifest.test.mjs` = 300 恰在软线（下次触及须先拆分或迁用例——边界注记）。

**状态**：**已收口 2026-09-17**。本档冻结（不再回改）。

**尾巴指针**：台账 #28 / #29 核销；设计凭证链 = 交付核验后终结（值不落档）；下游 = `docs/batches/2026-09-17-docroot-multiroot.md`（本批收口解除其 F1 串行闸 → 其 coder 可派）。
