# `settings` 工具 null 默认值类型校验失效 · 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分 · 已切除 2026-09-12）**：本档对端（VSC）份**已自本档切除**（原文不再留本仓——D11 完全态）；承载档 = VSC 仓 `docs/batches/2026-09-11-SETTINGS-NULL-DEFAULT（VSC 仓）`（逐字搬运、零改写——D10）。
> 已切除条目清单：§5 改动清单 VSC 侧（VSC 源 settings.mjs + 新档 settings-tool.test.mjs + VSC test/files.mjs 登记 = 3 文件）——条目计数（对端份 / 本仓份）= 3 / 2（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。**源档 blob SHA（切除前）= `795f8f7b14fd`**。
> 变更记录：2026-09-12——对端份经承载档逐字承接后自本档物理切除；档首注记形态收敛为「已切除」。

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = `docs/TODO.md` 登记项（父侧改用户 config 时实证）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 需求来源

用户 2026-09-11 03:25：「**修这个bug**」——针对 `docs/TODO.md` 登记项（`settings` 工具对「内置默认值为 null 的已知键」类型校验失效）。

### 缺陷（**已核——逐行实证，非推断**）

`src/agent-tools/settings.mjs`：

- `:24-32` `buildTypeMap(DEFAULTS)`：递归遍历 `DEFAULTS`，叶子记 `typeof 默认值`。
  `DEFAULTS.defaultModel = null`（`src/config.mjs:59`）→ **`typeof null === "object"`** → `TYPE_MAP["defaultModel"] = "object"`。
- `:134-140` 校验：`want = "object"` vs `got = "string"` → 抛 `settings set: "defaultModel" expects object — got string`；
  唯一放行口 = `value === null && want === "object"`（即**只能置 null**）。
- **两个方向同时坏**：

  ① **合法值被拒**（2026-09-11 实证）：`settings set defaultModel "deepseek:deepseek-flash"` → 拒绝——
  导致用户 `~/.thincoder/config.json` 的 `defaultModel` **无法经工具改值**；
  ② **非法值被收**（同源静默面）：传对象（`got === "object" === want`）→ **通过校验** → 写盘 →
  应用侧 `src/config.mjs:277`（`typeof config.defaultModel === "string"` 否则置 null）→ **静默置 null**（零提示）。
- **应用侧真形态（铁证）**：`src/config.mjs:59` 注释 = 顶层 `provider:model` 字符串复合 · `:277` 字符串判定 ·
  `config-migrate.mjs:43` 同判定。
- **影响面**：**所有 `DEFAULTS` 叶子值为 `null` 的已知键**（不止 `defaultModel`——完整清单由设计勘察枚举）。

### 需求点

1. `settings set` 对「默认值为 null 的已知键」**必须接受其真实消费形态的值**（`defaultModel` = `provider:model` 字符串），
   且**不得接受会被应用侧静默丢弃的形态**（对象/数组——除非该键真实消费形态如此）。
2. **反向静默面消除**：被接受的写入不得在下游被无声置空——**要么拒绝、要么生效，"写了等于没写"不允许存在**。
3. **不回归**：现有类型表的派生设计意图（`:7-8` 注释「类型表自动派生自 config.mjs DEFAULTS——**不手写防漂移**」）
   必须保留或**显式替代**（不得退回裸手写表而不说明取舍）。

### 范围边界（明确不做）

- **不**改 `DEFAULTS` 的语义（除非设计证明必须——须显式给理由与全影响面）。
- **不**改 `settings` 的其它行为（list/get / 敏感键脱敏 / 写盘最小化 D-F5b / 审批门 / 热应用语义）。
- **不**改任何用户配置文件（本批 = 工具面修复；改用户值是运维动作，另行处理）。
- **不**动其它工具（`/config` TUI 命令若复用同一校验 → 由设计勘察判定是否连带，连带须显式列出）。

### 待设计裁定（5 问）

1. **根因修法**：类型表对「null 叶子（无类型信息）」如何表达？候选：① 跳过（= 无约束）② 记 `"any"` 显式态
   ③ 显式形状表补丁（只对消费形态已知的键写入）——逐候选给判据与否决备选。
2. **影响面枚举**：`DEFAULTS` 中 null 叶子键的**完整清单**（含 `defaultModel`、providers 相关、agent 相关、其它），
   逐个给出**应用侧真实消费形态**与依据（代码行）。
3. **反向静默**：对象/数组传入 → 拒绝（推荐？）还是按形态接受？依据 = 应用侧消费代码。
4. **测试面**：`settings` 工具的既有测试档在哪；本批用例如何机器断言（null 键的接受 / 拒绝 / 无静默丢弃三面）。
5. **工具描述同步**：`:98` 的「Known keys are type-checked against the built-in defaults」表述是否需补 null 例外。

### 状态

**已收口 2026-09-11**（用户"修这个bug"= 快车道单点全链）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——设计已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 `docs/requirements/SETTINGS-TOOL.md` §2（F-S1.7/F-S1.8）+ §3（N-S1.5）· 设计 `docs/design/SETTINGS-TOOL.md` §8（设计层）/ §5.1（测试层）/ §6（AC-S2）/ §7.2（D-S2 决策）/ 第 8 批受影响文件表 · VSC 镜像 `TOOLS（VSC 仓）`（agentTools 节——⚑ W2 条件项）。

**一、覆盖条目（三方一致清单——本 §2 = 设计档 AC 回指 = 需求档条目）**

| 需求条目 | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| §2 **F-S1.7**（null 默认值键形状约束） | 4 个 null 叶子键 + 同族 `agent.subagentModels` 按真实消费形态校验（接受形态 ∪ null；拒绝折叠形态） | §8.3 / §8.4 | AC-S2.1（T-S2.1–12） |
| §2 **F-S1.8**（无静默写入） | 接受集 == 应用侧非折叠集 ∧ 拒绝集 == 折叠集（表驱动 + 真读取器） | §8.5 | AC-S2.2（T-S2.13） |
| §3 **N-S1.5**（护栏表防漂移） | 非 null 叶子派生零变 + null 叶子显式形状表 + 完备性机械锁 | §8.2 / §8.3 | AC-S2.3（T-S2.14/15） |
| §2 F-S1.5（派生条款·承接） | 非 null 叶子语义逐字保留（仅 null 叶子改道） | §8.3 第 2 条 | AC-S2.3 ② |
| §3 N-S1.2（错误文本零明文——既有条款合规化） | 校验器统一构造消息；敏感键值位遮罩 | §7.2 D-S2.4 | AC-S2.5（T-S2.22） |
| §3 N-S1.4（描述纪律） | 工具描述整句替换（逐字新句） | §8.6 | AC-S2.4（T-S2.24） |
| 零回归（既有工具面行为） | 回归网：list/get/set/未知键/类型拒绝/遮罩/D-F5b | §5.1 T-S2.16–T-S2.23 | AC-S2.5 |

**二、不在本批（明确排除）**——设计档 §8.7：`DEFAULTS` 键集与语义零改 · 读取侧零改 · `/config`·`/shell`·`/submodel` TUI 与 VSC 面板写面零改 · list/get、遮罩语义（除 D-S2.4 合规化）、D-F5b、审批门、热应用零改 · 不校验渠道/模型/可执行文件存在性与角色名 · 不改 `parseValue` 引号行为（D-S2.8 登记观察） · 数组默认值键维持既有豁免 · 不改任何用户配置文件内容。

**三、受影响文件**——见设计档「第 8 批受影响文件」表（8 条 + 父侧 1 条）：

- CLI：`src/agent-tools/settings.mjs`（153→~200）· `test/settings.test.mjs`（NEW，~160 行 / 24 例）· 两份 CLI 文档（本批已落——eng-designer）
- VSC（W2）：`src/agent-tools/settings.mjs` · `test/settings-tool.test.mjs`（NEW）· `test/files.mjs`（登记）· `docs/design/TOOLS.md`（已落）
- 父侧：`docs/TODO.md` / `CHANGELOG.md` = 主 agent 核销记账（不入 coder files 域）；**`src/config.mjs` 本批零改动**（487 行近硬限——不碰）

**四、验收标准**——AC-S2.1–AC-S2.6（CLI 面，逐条见设计档 §6）；AC-S2.7 = W2 条件项。跑法：`cd thincoder && node --test test/settings.test.mjs` · `npm test`（快层）· `node scripts/check-doc-width.mjs`（新增超宽 0）。

**五、待用户裁定（2 项）**
1. **W2（VSC 镜像）纳入 or 移出**：VSC 端同一缺陷的②静默面完整存在（`defaultModel`/`shell`/`memory.team` 零条目零约束 + `agent.subagentModel` 被跳过 ⇒ 无约束），且 config.json 双端共享（共享落盘 = CLI 读侧静默折叠）；设计已备（同源节 + T-S2.30–35）。移出则本批只做 CLI 面（AC-S2.7 不出，转登记项）。
2. **W3（`agent.subagentModels` 同族）保留 or 剔除**：非「null 叶子」字面（默认 `{}`）但同属静默面（实证字符串被静默忽略）；按 F-S1.8 一般表述纳入，可独立剔除（1 条目 + 2 用例）。

**六、父侧核销提示**：`docs/TODO.md:73` 现为 status=在途（设计落档中）——设计已落档，建议推进为「待设计评审」；`CHANGELOG.md` 交付后记账；**D-S2.8 发现**（CLI `parseValue` 保留引号 vs VSC 返回解析值——两端不一致）需登记 TODO 另办；设计档两处失真陈述（§4.6 "null 叶子无约束" / §5 "settings.test 11/11"）已在本批更正（§4.6 更正注 / §5 更正注），并实证 `test/settings.test.mjs` **从未落地**（本次 T-S2 落地补齐回归网）。

**补记：W2/W3 裁定结果（2026-09-11——用户原话「可以」）**

第五节两条待裁定项，用户 2026-09-11 03:40 回复「可以」——两问均按设计建议收口；本补记 = 裁定结果。上文条件性措辞（落档位置句「⚑ W2 条件项」·「四、验收标准」句「AC-S2.7 = W2 条件项」· 第五节两条的「待裁定」态）由本补记取代（本档 append-only——历史行保留，状态以本补记为准）：

1. **W2（VSC 镜像）= 纳入**：本批做 VSC 面——AC-S2.7 为**确定项**（无「未获纳入则不出」前置条件）；受影响文件表 VSC（W2）四行全部保留。
2. **W3（`agent.subagentModels` 同族）= 保留（一并修）**：不剔除——W3 条目与用例保留（T-S2.12 正控 + T-S2.13 表驱动含 W3 行）。

**同步规范化落点**（eng-designer 2026-09-11 已落）：设计档 §6 AC-S2.7 · §7.2 D-S2.7 · 需求档 §2 F-S1.7 同族条 · VSC 镜像档 `TOOLS（VSC 仓）` 护栏节首句。**编号不变**：AC-S2.1–AC-S2.7 / T-S2.1–T-S2.24·T-S2.30–T-S2.35 / D-S2.1–D-S2.8 编号集合零变化。

**修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文冲突时以本追加为准）**

**背景**：设计评审（轮次 1）**changes-required**（1🔴 · 4🟡 · 2🔵——发现表见 §3）。父侧裁决：**7 点全部采纳**（docs FIRST——同一链内；修复已落档，复审前不再动稿）。本追加 = 任务书层面的同步点（编号与计数变更集——逐条修复详文在设计档「变更记录」行）。

**逐条落点**：

| # | 落点 | 结果 |
|---|---|---|
| 1 🔴 | 设计档 §8.3（两表拆分）+ T-S2.14/T-S2.33/AC-S2.3①/§8.4/§8.2/D-S2.1 + 需求档 N-S1.5/F-S1.7 同族条 + 镜像档 TOOLS.md:123-126 | `_NULL_LEAF_SHAPES`（相等面：CLI 4 / VSC 2）+ `_SIBLING_SHAPES`（存在性面：CLI 1 / VSC 3）；断言形态逐字见设计档 §8.3 第 7 条 |
| 2 🟡 | 设计档 §8.3 列名/T-S2.13/§8.5/AC-S2.2 + 需求档 F-S1.7 :24/:28、F-S1.8 :30/:31 | 「折叠集」→「不可消费形态」类表述；逐键消费判据（含 `model-ref.mjs:25-36` 形态面 + 夹具串——D-S2.5） |
| 3 🟡 | 设计档 §8.6 VSC 句 + T-S2.32 | `defaultModel` 归 `"provider:model"` 形态；T-S2.32 扩为两形态（+无冒号串负例；VSC 例数不变） |
| 4 🟡 | 镜像档 TOOLS.md:124/125 | `defaultModel` 移入跨端键；本端键集 = `agent.subagentModel` + `agent.compactThreshold`（VSC 2 键口径不变） |
| 5 🟡 | 设计档 §5.1 新增 T-S2.17b + 覆盖映射段 + AC-S2.5 | get 成功用例补入；`config.test.mjs` 虚指声明删除（如实：未纳入/不在本批改动面） |
| 6 🔵 | 设计档 §5.1 测试缝段 | 双缝并用说明（写侧 `settingsTool({ configPath })` + 读侧 `config.mjs _setConfigPathForTest`）+ VSC 缝列明 |
| 7 🔵 | 设计档 受影响文件表文档行 | 改注「批次前 → 本批落档后」（design 121→325 · requirements 22→49 · VSC TOOLS 213→222） |

**编号与计数同步（D3——逐处已落）**：用例集合变化 = **+T-S2.17b**（CLI）——CLI **24→25 例** · VSC 6 例不变 · **总 30→31**。

同步点：设计档 §5.1 测试档行（25/6）· §5.1 表（新行）· §5.1 覆盖映射 · AC-S2.5 区间（T-S2.16–T-S2.23 + T-S2.17b）· 受影响文件表测试行（~160→~163、24 例→25 例）。

**编号集合**（取代上文「编号集合零变化」）：AC-S2.1–7 · T-S2.1–T-S2.24 **+ T-S2.17b** · T-S2.30–35 · D-S2.1–8。

**纪律**：只改四文件（设计档/需求档/镜像档/本批次档 §2）；实现代码零触碰；两仓 `node scripts/check-doc-width.mjs` 已跑——VSC 仓宽度 OK + 新增违规 0；CLI 仓设计档/需求档宽度 0 超限 + 新增违规 0（批次档存量超宽 7 行全在 §3 评审发现表，非本次追加）。

**行数注记补正（同日）**：上方「逐条落点」#7 行括号内为超宽行拆分前的测量；终值以设计档「第 8 批受影响文件」表为准——design 121→329 · requirements 22→50 · VSC TOOLS 213→222（设计 +4 行 / 需求 +1 行 = 本次拆分 4 处超宽行所致——零语义改动）。

**交付同步（2026-09-11——设计档与实测态对齐；本追加与上文冲突时以本追加为准）**

**背景**：实现已交付并父侧验收通过（CLI 25/25 · VSC 6/6 全绿 · CLI 全量 377/0 · VSC 全量 372/0；锁断言逐字复核通过）。本追加 = 设计档（`docs/design/SETTINGS-TOOL.md`）与交付实测态对齐的落档（coder §5 ⑦ 所列同步项 + 父侧核验新增的导出面一项），**只改文档、实现零触碰**。

**同步项（4 项——逐项落点）**：

| # | 项 | 设计档落点 | 结果 |
|---|---|---|---|
| 1 | 测试缝导出 5 → **6** | §8.3 第 6 条 | 补 `_checkShapeCompleteness`（导出面 `src/agent-tools/settings.mjs:263`；T-S2.14 唯一机械缝——`test/settings.test.mjs:284-290` 直用；VSC 同导出于 `src/agent-tools/settings.mjs:249`（VSC 仓）） |
| 2 | VSC 锁断言形态：设计字面 → 实测 | §8.3 第 7 条 + T-S2.33 行 | `_nullLeafPaths({ agent: AGENT_DEFAULTS })`（实测 `test/settings-tool.test.mjs:106`（VSC 仓））；原字面产出裸名集合、与形状表键集不可同时满足——旁注理由已落 |
| 3 | VSC 派生表键空间显式化 + 连带行为增量 | §8.4 + T-S2.34 行 | `_DEFAULTS_ROOT`（`src/agent-tools/settings.mjs:39-40`（VSC 仓））入档；增量 = `agent.*` 非 null 叶子开始受校验、裸名键按未知键原样——如实记录 |
| 4 | 受影响文件行数注记：估计 → 实测 | 第 8 批受影响文件表 | 口径 =「批次前 → 交付态·实测」；CLI 工具 153→263（+110）· 新档 433 · VSC 工具 147→249（+102）· VSC 新档 148 |

**与实测零冲突声明**：除上述 4 项外，设计档与需求档未发现与交付实测的其他冲突。一处按实测精度修正：同步项 3 所据表述「`agent.*`/`traces.*` 非 null 键开始受校验」——实测 `traces.*` 旧实现已带前缀（批次前源码 `:33`），键空间归一不影响其校验面；设计档按 `agent.*` 面如实入档。

**纪律**：本次只改设计档 + 本批次档 §2（本追加）；实现/测试/批次档 §5 零触碰；未 commit；未发起评审；未新建档。`node scripts/check-doc-width.mjs` 复跑：本次追加新增超宽 0 / 新增一致性违规 0（存量 34 行超宽与另一在飞批次档的外因 1 条不变）。

**复跑口径补正（同日）**：上方「纪律」行复跑数字为写入时点快照（9 文件 / 34 行超宽、外因 1 条）。随后复跑（04:40 快照）为 10 文件 / 38 行、外因 2 条——增量全部来自在飞批次档 `2026-09-11-REVIEW-CHAIN-GUARDS.md` 的并发写入（4 行超宽 + 其第 202 行 V2 一条；mtime 04:39，落于本会话两跑之间），**与本次追加零关系**。本次两文件零新增复核：设计档 0 超宽 0 违规；批次档超宽仍 7 行（§3 评审发现表存量）、§2 无新增违规。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

**第 8 批设计评审——发现表**（评审对象 = `docs/design/SETTINGS-TOOL.md` §8/§5.1/§6/§7.2 + `docs/requirements/SETTINGS-TOOL.md` §1–§4 + `TOOLS（VSC 仓）` settings 护栏节 + 批次档 §2；全部行号对当轮磁盘态核验）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🔴 | 完备性锁键集双读矛盾：§8.3（design:214）把 `_NULL_LEAF_SHAPES` 定义为含 W3 的 5 行形状表（:218-222，第 5 行 = `agent.subagentModels`），:236 按此名导出测试缝；但 T-S2.14（:125）断言 `Object.keys(_NULL_LEAF_SHAPES)` == `_nullLeafPaths(DEFAULTS)` =「当前 4 键」，AC-S2.3①（:156）与 N-S1.5（requirements:40）复述该等式——4≠5：实现取 5 则 T-S2.14/AC-S2.3 必红；取 4 则 §8.3 表标题失真、且 W3 的拒收语义（T-S2.13 :124 要求生效）失去手写载体。VSC 同型：VSC TOOLS.md:126 写「null 叶子键集 == 形状表键集」，而该表须含跨端三键（T-S2.33 :139 计「本端 2 键」+ 跨端声明）。 | 明确拆分：完备性锁仅对 null 叶子集成立（`_NULL_LEAF_SHAPES` = 4/2 键），同族/跨端条目放进有名字的兄弟结构（或显式声明清单），并在锁断言中显式声明其存在；同步 §8.3/§8.4/N-S1.5/AC-S2.3/T-S2.14/T-S2.33 与 VSC TOOLS.md:126。 |
| 2 | Requirements | 🟡 | 「拒绝集 == 应用侧折叠集」措辞与所引判据不完全对应（方向已逐键核验正确：护栏拒绝集 ⊇ 真实静默折叠集、单调性成立）：`defaultModel` 无冒号串/尾段空串（:218）在 `src/config.mjs:277` 处**保留**（仅运行期经 `providerInvalidReason` 报无效——`src/model-ref.mjs:30-37`——非静默）；`shell` 空串（:220）是行为改变（设计行注自认「与 `null` 语义不同」；`src/tools/bash.mjs:261→131`：`"" ?? true` → 空串 → 关闭 shell 包裹）；`agent.subagentModel` 对象/数字/布尔（:219）是 spawn 期 TypeError（`subagent-spawn.mjs:241` → `subagent-async.mjs:147`）——响亮失败而非折叠。且 T-S2.13（:124）/§8.5（:250）为 defaultModel 指定的判据（`loadConfig()`）若按「保留即非折叠」直读，无法重现 §8.3 的拒绝集（该测试要么红、要么改用未记载判据）。 | 判据谓词统一按「形状层是否可被应用侧按写入值消费」表述（defaultModel 需含 provider 解析无效面，并以夹具 provider 避开存在性层——D-S2.5）；或把「折叠形态」列名与等式措辞改为「不可消费形态」；F-S1.7/F-S1.8 判定句同步对齐。 |
| 3 | Clarity | 🟡 | §8.6 VSC 新句（:267）把 `defaultModel` 归入「non-empty string」，与 VSC TOOLS.md:124（`defaultModel` = `"provider:model"` 串）及同源契约（CLI §8.3 :218）不符；T-S2.32（:138）仅覆盖 `'{}'` 拒绝，发现不了该差异——描述句要么错述待实现语义（若按 non-empty string 实现则违同源/跨端一致），要么漏述形态校验。 | 对齐两处：描述句按 provider:model 形态改写（或明确 VSC 端只做非空串——但那与同源契约及 VSC TOOLS.md:124 冲突，须一并裁定）；可顺手补一条无冒号串的 VSC 负例。 |
| 4 | Clarity | 🟡 | VSC TOOLS.md 内部归类矛盾：:122 称 `defaultModel`/`shell`/`memory.team` 为「跨端三键」，:124 又把 `defaultModel` 列入「本端键集」；AC-S2.7（:160）与 T-S2.33（:139）按「本端 null 叶子 2 键 + 跨端三键」计数——实现者若按 :124 归类建本端集（3 键），T-S2.33 的「相等（当前 2 键）」不成立。 | 统一归类（`defaultModel` 归跨端三键），使 VSC TOOLS.md:124、AC-S2.7、T-S2.33 三处一致。 |
| 5 | Acceptance criteria | 🟡 | 回归网覆盖声明不实 + AC 与用例表不一致：§5（:143）称 T-S1.2/T-S1.6/T-S1.9/T-S1.10「其验证面由 `test/config.test.mjs` + dispatch 测试覆盖」——实证 `test/config.test.mjs:21-45` 仅覆盖 `reloadMcpFromDisk` 的 mcp.servers 畸形回退，与 settings 工具的 get/解析/门禁面无交集；`thincoder-cli/test/**` 全目录无 settings 分类断言（`test/subagent-observe-send.test.mjs:181` 只覆盖子代理分支）。同时 AC-S2.5（:158）把「get 成功」列为由 T-S2.16–T-S2.23 佐证的面，但该区间无 get 成功态用例（唯一 get 用例 T-S2.17 :128 为缺失键错误态；get 成功恰是未纳入的 T-S1.2）。 | 二选一并如实改文：(a) 补一条 get 成功用例（如 `get agent.maxTurns`）（可选：settings 的 list/get 分类断言）；或 (b) 从 AC-S2.5 删去「get 成功」、并把 §5 覆盖声明改为「未覆盖（不在本批改动面）」而非虚指他档。 |
| 6 | Clarity | 🔵 | 测试缝标注不完整：§5.1（:106）把 `config.mjs _setConfigPathForTest` 标为「（T-S2.13 用）」，但 T-S2.1/T-S2.2/T-S2.3/T-S2.5（:112-116）的「`loadConfig()` 读回」断言同样需要它（`settingsTool` 默认写导出常量 `configPath`——`settings.mjs:90`；`loadConfig` 读覆盖路径——`config.mjs:26-30/253-255`——两缝须并用，只用其一会造成对真实用户配置的读写）；VSC 面（T-S2.30–35）的注入缝（`src/config-io.mjs:35`（VSC 仓） `_setConfigPathForTest`）与形状表 `_` 导出未在 W2 节/§5.1 列明。 | 补一句双缝并用的说明（CLI）；列明 VSC 测试缝（config-io 注入 + `_` 导出）。 |
| 7 | Affected-file size annotations | 🔵 | 受影响文件表文档行注记口径陈旧：`docs/design/SETTINGS-TOOL.md` 标「121」（现 313）、`docs/requirements/SETTINGS-TOOL.md` 标「22」（现 49）、`TOOLS（VSC 仓）` 标「213」（现 223）——.md 豁免行数要求，属注记问题（自称「当前行数」实为批次前状态，且 +~130 估计与实际 ~+190 有差）。 | 改注为「批次前」或更新数字，避免 coder 对账混淆（纯口径，不影响验收）。 |

计数：🔴 1 · 🟡 4 · 🔵 2（共 7 条）

VERDICT: changes-required

## §4 用户批准（主 agent 记）

**2026-09-11 04:08 用户批准**（原话："批准"）——**两轮评审 + 修正轮 + 父侧核验后的正式签字**（严格序）。

- **轮次 1**：changes-required（**1🔴** · 4🟡 · 2🔵——发现表见 §3 轮次 1）；
- 7 条发现经主 agent 裁决**全部采纳**（🔴 两表拆分 / 🟡 判据对齐 · VSC 描述句 · VSC 归类 · 覆盖声明+补 get 用例 / 🔵 双缝 · 行数注记）；
- 修正轮落地（id=14）经父侧核验：**7/7 落地** + **代跑评审员未完成的补充检查**（三档宽度 **0 行 >300** ✓ · 行数标注差 1 = 读取口径（`N lines total` 含末尾空行）· cite 六处全中：`model-ref.mjs:25-36/38-43` · `settings.mjs:90/:134-140` · `config.mjs:26-30/:253-255` · `config-io.mjs:35`）；
- **轮次 2**：**Approved** + **token 已签发**（值不落档——运行时凭证）；
- 机制面观察已登记：`docs/TODO.md:78`（评审 context 溢出仍发 token——建议机制链加守卫）。

**批准范围**：**8 条**——CLI 2（`src/agent-tools/settings.mjs` +40~50 · 新档 `test/settings.test.mjs` ~163）
+ VSC 3（`src/agent-tools/settings.mjs` +~35 · 新档 `test/settings-tool.test.mjs` ~110 · `test/files.mjs` 登记）
+ 文档 3（已由 designer 落毕）+ 父侧 1（TODO/CHANGELOG 核销记账）。
**不含**：`src/config.mjs`（**零改动**——487 行近硬限，设计明示不碰）· 提示词面 · D-S2.8（`parseValue` 两端差异——留档登记）。
**验收**：AC-S2.1–AC-S2.7（CLI **25 例** T-S2.1–24 + T-S2.17b · VSC 6 例 T-S2.30–35，总 31）。

**下一节点**：eng-coder（5 文件写域）→ 交付 → 父侧实跑 → 用户验收 → §6 收口 + 令牌消费。

## §5 实施记录（eng-coder 自写）


**SETTINGS 形状护栏实施（2026-09-11——CLI + VSC 双端同批）**

**① 交付摘要**：5 文件落地——两表结构（`_NULL_LEAF_SHAPES` 相等面 / `_SIBLING_SHAPES` 存在性面）+ 校验器两表都查（形状优先、派生表兜底）+ 完备性锁（测试断言 + 运行期一次性警告）+ 描述句逐字替换 + `_` 测试缝导出。
实跑：CLI 25/25 · VSC 6/6 全绿；VSC 全量 fail 0；CLI 全量 387/388（唯一红 = 外因 T41——见 ④-5）。

**② 改动清单（file:line——行号为交付后态）**

- CLI `src/agent-tools/settings.mjs`（153→263 行）：形状层 `:29`（null 叶子 4 键）/`:38`（同族 1 键）· 派生 `:44-58` · `_nullLeafPaths :61` · `_checkShapeCompleteness :72` + 装载自检 `:81` · 错误构造与形状校验 `:84-127` · `_checkKnownKeyValue :130` · 描述句 `:209` · 校验调用点 `:245` · 导出 `:263`。
- CLI `test/settings.test.mjs`（NEW——433 行 / 25 例）：T-S2.1–T-S2.24 + T-S2.17b；锁断言逐字形态在 T-S2.14；表驱动 T-S2.13（16 行）；回归网 T-S2.16–T-S2.23；双缝并用（写侧 `settingsTool({configPath})` + 读侧 `_setConfigPathForTest`）。

**③ 逐需求透明表**

| 需求条目 | 状态 | 证据 |
|---|---|---|
| F-S1.7（null 默认值键形状约束） | Done | CLI 四键 + 同族一键（`:29`/`:38`）；VSC 本端两键 + 跨端三键（`:26`/`:33`）；接受/拒绝/零变化 = T-S2.1–T-S2.12 · T-S2.30–T-S2.32 |
| F-S1.8（无静默写入） | Done | T-S2.13 表驱动逐行「工具接受 == 应用侧可消费」（真读取器 `loadConfig`/`effectiveSubagentModel`/`teamConfig`/`parseModelRef` 形态面）；拒绝行磁盘/内存零变化 |
| N-S1.5（护栏表防漂移） | Done | 完备性锁 T-S2.14 · T-S2.33；派生对拍 T-S2.15 · T-S2.34；运行期一次性警告双端落地（`_checkShapeCompleteness`） |
| N-S1.2（敏感键错误文案零明文） | Done | 统一消息构造器值位遮罩（D-S2.4）；T-S2.21 · T-S2.22 |
| N-S1.4（描述纪律） | Done | 两句逐字（T-S2.24 · T-S2.35——另与设计原文程序化比对一致） |
| 零回归（既有工具面） | Done | T-S2.16–T-S2.23 + T-S2.17b（AC-S2.5） |

**④ 与设计的偏差（逐条——全部披露）**

1. `_checkShapeCompleteness` = 第 6 个 `_` 测试缝导出（设计 §8.3 第 6 条列 5 个）——T-S2.14「一次性警告列出键名」的唯一机械缝；代码注释回指该条。
2. VSC 派生表键空间归一（裸名 → `agent.*`/`traces.*` 全路径）：设计 T-S2.34 例与镜像档键集均用全路径。连带面如实披露——`agent.*` 非 null 键在 VSC 开始受校验（T-S2.34 已补断言锁住）、裸名键不再有条目（按未知键原样）。交付前实跑探针：`set maxTurns "abc"` 拒 / `set agent.maxTurns "abc"` 收（本会话实证，非推断）。
3. VSC 锁断言写作 `_nullLeafPaths({ agent: AGENT_DEFAULTS })`：设计字面形态产出裸名集合、与形状表键集不可同时满足；交付形态为唯一可满足式（语义不变 = 相等面锁）。
4. T-S2.23 冲突触发 = mutate 窗口内 `args.key` 读取推进 mtime（`writeConfigAtomic` t0/t1 门控）——整秒递增确定性触发，非竞态；与实现读取顺序耦合（重构会响亮失败）。
5. CLI 全量唯一红 = T41 文档一致性（V1）——外因：另一在飞批次档 `docs/batches/2026-09-11-VSC-ASYNC-VISIBILITY.md` 引入新增违规（对 VSC 仓 WEBVIEW 文档的 §5 引用——unknown-doc，mtime 20:28Z）；本批零触碰 docs/。

**⑤ 测试证据**

- `cd thincoder && node --test test/settings.test.mjs` → tests 25 / pass 25 / fail 0。
- VSC 仓 `node --test test/settings-tool.test.mjs` → tests 6 / pass 6 / fail 0。
- 全量（先落盘再读）：`thincoder-cli/_t-settings-cli.log`（tests 388 / pass 376 / fail 1 / skipped 11——见 ④-5）· `_t-settings-vsc.log`（VSC 仓）（tests 372 / pass 371 / fail 0 / skipped 1）。
- VSC 首跑曾触发 slow-gate 阈值抖动误红（`test/smoke-settings.mjs` 875ms > 800ms 拦截线）——重跑绿，非本批用例。

**⑥ 内部审计与代码评审（本会话）**

- explore 分歧审计：0🔴 · 0 越界 · 0 静默简化；测试加强建议已当场落地（T-S2.16 list 全键集合断言 / T-S2.17 顶层缺失形态）；文档同步建议转父侧。
- advisor 代码评审：**pass**（0🔴；3 🟡 + 2 🔵 全非阻塞）；其中「VSC 非 null 校验归一生效」建议已当场补断言（T-S2.34）。

**⑦ 未完成/存疑（转父侧）**

- VSC 写面 `agent.subagentModels` 零约束残留（AC-S2.7 枚举 2+3 键之外；若按 W3 延伸双端需设计更新）。
- 设计档同步项：§8.3 第 7 条 VSC 断言形态 · §8.4 裸名改全路径 · 行数注记（测试实测 433 行 vs 设计估 ~163）。
- 日志产物 `thincoder-cli/_t-settings-cli.log` · `_t-settings-vsc.log`（VSC 仓）留工作树（验证证据，收口时可清理）。

**终态：converged**（交付面 clean——无 🔴、无越界、无静默简化；文档同步项与范围确认项已披露转父侧）。

## §6 验证与收口（父代理自写）

**2026-09-11 10:53 用户验收**（原话「都验收」——含本批）。

- **交付面**：5 文件——CLI `src/agent-tools/settings.mjs` 153→263 · 新档 `test/settings.test.mjs` 433 行/25 例 · VSC `src/agent-tools/settings.mjs` 147→249 · 新档 `test/settings-tool.test.mjs` 148 行/6 例 · VSC `test/files.mjs` 登记。
  双表结构（`_NULL_LEAF_SHAPES` 相等面 4/2 + `_SIBLING_SHAPES` 存在性面 1/3）+ 完备性自检 + 形状校验 + 描述句逐字。

> 〔父侧代笔 2026-09-11 12:58：单行 301 字符 → 纯折行〕
- **父侧实跑（验收时态）**：CLI 25/25 · VSC 6/6 · CLI 全量 388/377/0 · VSC 全量 372/371/0；锁断言逐字复核 ✓（CLI `test/settings.test.mjs:278-279` · VSC `test/settings-tool.test.mjs:106-107`）。
- **验收后同步轮**（id=24）：设计档 ↔ 交付实测 4 项（测试缝导出 5→6 · VSC 锁断言实测形态 · `_DEFAULTS_ROOT` 键空间入档 + 行为增量如实记录 · 行数注记改「批次前 → 交付态·实测」）——父侧逐项核验 ✓。
- **偏差裁定**：第 6 个 `_` 导出/键空间归一/锁断言实测形态/`_` 更正披露——**均接受**（理由见批次 §2 修正轮同步块）。
- **遗留转后续**：VSC 写面 `agent.subagentModels` 零约束残留 → **第 12 批**（`docs/TODO.md` 在案）。
- **状态行刷新**：设计档完成态与需求档 F-S1.7/F-S1.8/N-S1.5 实现状态行 → 随下次该档设计轮刷新（不另开轮）。
- **令牌链**：设计评审 token **已消费**（`consume-design`——链终）。

---
