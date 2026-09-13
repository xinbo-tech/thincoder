# VSC 端评审链守卫镜像（citations / messages / run）+ settings 形状面残留 · 批次记录（2026-09-11）

> 搬迁注记：本档自 CLI 仓 `2026-09-11-VSC-GUARD-MIRROR（CLI 仓）` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = 75f1b75d4f02 · 源提交 = b70c39c）。

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = 用户 10:50「**2.开**」（承接第 11 批 VSC 对位面登记 `docs/TODO.md`）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 需求来源

用户 2026-09-11 10:50「**2.开**」——承接第 11 批 designer 的 VSC 对位裁定（CLI 单端 + VSC 登记三面）与本会话夜班条款。

### 条目 A：第 11 批守卫的 VSC 对位（三处同构——第 11 批 §14 交付面）

- `thincoder-vscode/src/advisor/citations.mjs`——CLI 侧已交付候选链解析（`citations.mjs:36` 派生根 / `:53` 单引文三条件 / `:98` 失败三分 / `:107/:125` 命中根透明）；VSC 为**逐字副本**（未镜像）。
- `thincoder-vscode/src/advisor/messages.mjs:62`——signal 注入面同构点（CLI 侧自愈包裹已落 `messages.mjs:169-171`）。
- `thincoder-vscode/src/advisor/run.mjs:58/166/170`——谓词族 / 硬墙 / 透支判定同构点（CLI 侧已落：六 kind 谓词 `compaction.mjs:75-81` · 硬墙 `loop.mjs:141-143` · 墙判 partial 同判 `loop.mjs:170-181`）。
- 另：VSC 侧是否同样需要 loop/compaction 拆分 → **designer 勘察裁**（行数现状决定）。

### 条目 B：VSC 写面 `agent.subagentModels` 零约束残留（第 8 批交付 ⑤-1）

- 第 8 批 AC-S2.7 枚举 = 本端 2 键（`agent.subagentModel`/`agent.compactThreshold`）+ 跨端 3 键（`defaultModel`/`shell`/`memory.team`），**不含**同族键 `agent.subagentModels`——VSC `_SIBLING_SHAPES`（`thincoder-vscode/src/agent-tools/settings.mjs:33-37`）补第 4 条 = 设计变更（本批走设计 + 评审）。
- 依据 = W2 裁定（两端共享 `~/.thincoder/config.json`——同一缺陷完整存在）。

### 已核事实（供 designer 免重复勘察）

- 第 11 批设计权威（已交付）：`ADVISOR-CONVERGENCE（CLI 仓·设计）` §14（A–E 全量，含 §14.14 E-6 的 VSC 三处登记与 §14.10 登记项）。
- CLI 侧交付实测（父侧复验）：见上「条目 A」各锚点；测试档 `test/advisor-chain-guards.test.mjs`（CLI 仓）（21 例）为对位参照。
- VSC 仓测试范式：`thincoder-vscode/test/files.mjs` 为**显式清单**（新档必须登记——第 8/10 批同口径）。

### 范围边界（明确不做）

- 不改 CLI 侧（已交付）；不重开第 11 批已闭项；不碰 `docs/design/ADVISOR-CONVERGENCE.md` **§7（四值句）/§13（全节）**（第 9 批链）。
- 不碰 `ENGINEERING-MODE.md` / 提示词语义。
- **不得自行新建档**（用户边界指令——必须新建则停下打回主 agent）。

### 待设计裁定

1. 三处对位各自的**镜像口径**（双端独立实现纪律：语义同源、**不** byte-identical、**不**建跨仓依赖/同步脚本；各端以自身原文为准）。
2. VSC 侧是否需 loop/compaction 拆分（行数勘察；>300/500 档位结论）。
3. 条目 B 落点（`_SIBLING_SHAPES` 补第 4 条 + 计数/AC/测试同步）。
4. 测试面：新用例（VSC 仓范式 + `test/files.mjs` 登记）；是否沿用 CLI 用例编号映射或 VSC 自持编号。
5. 受影响文件全清单（当前行数 + 预计增量）+ 验收标准（逐条回指）+ 用例表。

### 状态

**已收口 2026-09-11**（用户「2.开」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——设计已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

## 一、目标与背景（为什么）

把第 11 批（CLI 单端已交付）的**评审链边缘守卫**按双端独立实现纪律镜像到 VSC 端（条目 A——三处同构），并补 VSC settings 写面 `agent.submodels` 同族键零约束残留（条目 B）。同一缺陷在 VSC 端**完整存在**（设计档 §13.2 六条现场复核，file:line 为证）——不修则：截断评审仍签发 token / 截断代码评审仍计「已覆盖」/ 声明范围引文误报 unreadable / 单次请求可吞掉全预算零输出 / 压缩吞掉 Approval Signal。

## 二、已知事实（免重复勘察——直接读）

- 设计权威（三层）= VSC 仓 `docs/design/ADVISOR-CONVERGENCE.md` **§13**（裁定摘要 §13.0 / 契约六条 §13.4 / 受影响文件 §13.5 / 用例 §13.8 / AC §13.9 / 边界 §13.10；§2 载体表已同步）。
- 需求权威 = `ADVISOR-CONVERGENCE（CLI 仓·需求）` **§8**（F18–F23 / N12–N15）+ `SETTINGS-TOOL（CLI 仓·需求）` **F-S1.7 VSC 对位行**。
- CLI 对位实测（**只读参照，不碰**）：`src/advisor/{citations,compaction,loop,run}.mjs`（CLI 仓） · `src/agent-tools/{advisor,advisor-async,advisor-settle,design-token}.mjs` · 测试 `test/advisor-chain-guards.test.mjs`（CLI 仓）（21 例）。
- VSC 现状锚点：`advisor/citations.mjs`（78 行——CLI 修复前逐字副本）· `advisor/messages.mjs:173-176`（信号只在 design round1 注入）·
  `advisor/run.mjs:58/166/170`（压缩/溢出尾）+ `:144-172`（轮间超时）· `agent-tools/advisor-async.mjs:61`（`ADVISOR_FAILURE_TEXT` `^` 锚）+
  `:330/368`（design 结算/失败判定）· `agent-tools/settings.mjs:33-37`（`_SIBLING_SHAPES` 3 条）。
- VSC 测试范式：新档必须登记 `test/files.mjs`（显式清单——不登记不跑）；快层 `npm test`（slow 门 800ms 拦截——新用例零真实等待）；长测 `npm run test:full`（**先落盘再查**）。

## 三、覆盖需求（本批条目 = 设计档 AC 回指 = 需求档条目）

| 需求条目（需求档 ID） | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| F18 未完成即不签发（VSC） | 谓词族六 kind（块首行锚）+ design sync/async 两结算面守卫（槽零写 + 未签发提示） | §13.4 契约四 · §13.4 消费点 1/2 | AC-VG4 |
| F19 凭证信号必达（VSC） | `messages.mjs` 自愈尾包（内层构建 + 外层补齐——幂等） | §13.4 契约二 | AC-VG2 |
| F20 信号全程在位（VSC） | `compactMessages(messages, pinned)` 定锚重挂 + `buildPinnedBrief`（评审参数构建） | §13.4 契约三 | AC-VG3 |
| F21 引用解析按声明范围补全（VSC） | `citations.mjs` 候选链（派生根 + 三条件 + 失败三分 + 命中根透明）+ run.mjs scope 传参 | §13.4 契约一 | AC-VG1 |
| F22 超时 / 预算守卫（VSC） | 硬墙（`AbortSignal.any/timeout`——墙判绑信号状态）+ 0.75 一次性提示 + 结构化超时尾 + 循环测试缝 `seams` | §13.4 契约五 | AC-VG6 |
| F23 同族一致性（VSC·code 守卫） | `failureVerdict` 换谓词（`ADVISOR_FAILURE_TEXT` `^` 锚定义与消费退场） | §13.4 契约四 · 消费点 3 | AC-VG5 |
| F-S1.7（VSC 对位行） | `_SIBLING_SHAPES` 第 4 条 `agent.subagentModels`（roleMap）+ `_checkShape` roleMap 分支 | §13.4 契约六 | AC-VG7 |

## 四、明确出批（不做——勿扩面）

- 不做启动断言面 / 冻结窗口 E 面 / 传输层改动 / sync 完成记账面改动（`execute-tools.mjs:432`）/ 提示词 / 评审语义判据 / 凭证机制本体（设计档 §13.10——含登记项）。
- 不碰 CLI 仓**代码与已交付面**；不碰 VSC 档 §7 / §12 与 CLI 档 §7 / §13（第 9 批链落档件）；不碰两仓 prompts / README / CHANGELOG / `docs/TODO.md`。
- 新档白名单（设计已授权，**仅此三件**）：`src/advisor/loop.mjs` · `src/advisor/compaction.mjs` · `test/advisor-chain-guards.test.mjs`——其余一律不新建（必须新建 → 停下打回）。

## 五、受影响文件全清单

**实施域 11 项 = 8 改 + 3 新**（逐文件行数注记 / 变更 / 档位 = 设计档 §13.5 表）：citations.mjs · messages.mjs · run.mjs（拆分）· loop.mjs（新）· compaction.mjs（新）·
  agent-tools/advisor.mjs · agent-tools/advisor-async.mjs · agent-tools/settings.mjs · test/advisor-chain-guards.test.mjs（新）· test/settings-tool.test.mjs · test/files.mjs（登记）。
**文档域 4 项已落**（设计者写域——coder 零碰）：CLI 需求档 ×2 · VSC 设计档 ×2。

## 六、验收标准（逐条见设计档 §13.9——每条可机器验证）

AC-VG1–AC-VG8。跑法（coder 必须实跑并在报告中给日志尾部）：
- `cd thincoder-vscode && npm test`（快层全绿——含新档；新档登记后清单 +1）
- `node --test test/advisor-chain-guards.test.mjs test/settings-tool.test.mjs`（新/改用例逐条）
- `cd thincoder-vscode && node scripts/check-doc-width.mjs`（新增违规 0 + 新增超宽 0）
- CLI 仓代码零改动（`git status`——本批不碰 CLI 实施面）

## 七、交付报告格式（回报必含）

① 逐需求透明表（F18–F23 / F-S1.7 → 文件:行 证据）；② 实测行数表（对照 §13.5 预计值——超档位须说明）；③ 测试实测（命令 + 通过数 + 日志尾部）；④ 偏差披露（设计 vs 实现差异——零静默）；⑤ §5 写入自证。

## 八、边界与纪律

- **D5**：本 §2 与设计档 / 需求档在评审在途期间零写入（改动集齐后统一入场）；实现中发现设计缺陷 → 停下报告（回设计者/父侧），不静默偏离。
- 凭证不落文档（设计档全文零 token / designId 值）；实现面零新增依赖（纯 node / 既有模块）。

**更正（D6 回读核验）**：上文第一段 `agent.submodels` 为 `agent.subagentModels` 笔误（段写入 append-only 不可改，以此更正为准）；正确键名与形态以设计档 §13.4 契约六为准。另注：本段正文前残留占位行 `_（待写——eng-designer）_`（工具 append 语义不删既有行）——以「状态：任务书就绪」行起为有效内容。

**修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文冲突时以本追加为准）**

**背景**：设计评审（轮次 1）**pass**（0🔴 · 2🟡 · 6🔵——发现表见 §3 `### 轮次 1`）。父侧裁决：**6 条落地 + 1 条 Deferred（#5）+ 1 条无动作（#8）**。本轮 = 修正轮（**只改文档、不碰实现**；未新建档；§1 零碰；同链同 token——修复后父侧核验 → 用户批准；本设计者不发起评审）。

**逐条落点（# = §3 发现表编号；行号 = 修正后态）**：

| # | 修复 | 落点（file:line） |
|---|---|---|
| 1 🟡 | 映射列措辞统一为「回指需求条目——CLI 对位经 §13.1 对位列」（全档无第二读法） | VSC 设计档 §13.0 #4（`:329`）· D-VG4（`:548`） |
| 2 🟡 | async 消费点补 N14 三面同源句（digest / prior 均取清洗后 `entry.report`——同源传导、无需另设清洗；带 as-of 锚） | VSC 设计档 §13.4 消费点 2（`:461-466`） |
| 3 🔵 | D-VG6 枚举补 pin 首行 + 注明边界（共五处——未签发提示 · 预算提示 · 结构化尾 · 报告候选链段 · 契约三 pin 首行）；预算提示 / 结构化尾补逐字抄写源（CLI file:symbol——D2 不重述） | VSC 设计档 D-VG6（`:550`）· 契约五（`:488-495`） |
| 4 🔵 | W2/W3 所指注明（W2 = 第 8 批待裁定项「VSC 镜像是否纳入」——裁定 = 纳入；W3 = 待裁定项「`agent.subagentModels` 同族」——该批 CLI 面落地、VSC 面本批补） | VSC 设计档 §13.1 表下注（`:347-349`）· VSC TOOLS（`:120` / `:223-224`） |
| 5 🔵 | **Deferred（不修——父侧已裁）**：行数注记 `52（实落）` 与实测差 = 他批（第 13 批）内容；该档冻结 + §5 实测复写流程已定 | 零动 |
| 6 🔵 | 计数口径统一：六 = kind 计（站点另注）；「三要素」= 统计行（rounds / tool calls / review text produced）+ budget 行（本档各处置同一口径） | VSC 设计档 §13.2 #4（`:365-367`）· 契约四表注（`:453-454`）· 契约五（`:488-492`）· T-VG12（`:583`）· T-VG13（`:584`）· AC-VG6（`:603`） |
| 7 🔵 | 术语 / 措辞 / 可机判：「收集合」→「接受集」（对齐 F-S1.8）；越线 = 新增 advisory 债（非存量档）；AC-VG3 grep 判据改可机判三式；CLI 侧需求档核对 = 术语一致 → 零改 | VSC 设计档 AC-VG7（`:604`）· §13.5 行 2（`:516`）· AC-VG3（`:600`）；CLI 需求档零改 |
| 8 🔵 | 无动作（pass 判定不依赖实施域代码数字） | 零动 |

**口径 / 计数同步（D3——声明处与列表同改）**：① 六 kind 口径自洽（§13.2 #4「现行各一站点」↔ 契约四表注「条 = kind；生成点列站点」）；②「三要素」全档统一（= 统计行；budget 独立行）；③ D-VG6 枚举「五处」与列表同改。

**纪律**：写域四档 = VSC 设计档 · VSC TOOLS · 本档 §2 · CLI 需求档（核对后零改）；**禁写面零触碰**（第 13 批评审冻结六档——`git status` 自证）；两仓 `node scripts/check-doc-width.mjs`：新增超宽 0 · 新增一致性违规 0（存量在基线内）；不新建档；不 commit；不发起评审。

**补记（同日——行数注记随修正轮复写；透明披露，非新范围）**：§13.5 文档域表两行行数注记随本轮改动复写为终值——VSC 设计档 625 → **641（修正轮后终值）** · VSC TOOLS 225 → **226（修正轮后终值）**（零语义改动）；SETTINGS-TOOL 行按 #5 Deferred 零动。终跑复验：VSC 仓宽度 OK + 新增违规 0；CLI 仓新增超宽 0（本档不在 >300 列表）+ 新增违规 0。

**交付同步（eng-designer · 2026-09-11——设计档与交付实测态对齐；本追加与上文本冲突时以本追加为准）**

**背景**：实现已交付 + 父侧复验通过（终态 clean；VSC 全量 408/407/0；新/改用例 23/23；11 文件全落、零越界；D1 偏差按父侧注入落 `combineSignals`）。本追加 = VSC 设计档（`docs/design/ADVISOR-CONVERGENCE`）与交付实测态的**交付后同步**（D1–D5 五项——链收口前最后一步、同链），**只改文档、实现零触碰**；append 机制——上文各行零改，冲突处以本块为准。

**同步项（5 项——逐项落点；行号 = 同步后态）**：

| # | 项 | 设计档落点 | 结果摘要 |
|---|---|---|---|
| D1 | 硬墙信号组合——交付实现形态（偏差同步） | §13.4 契约五 硬墙 bullet（`:479-486`） | `AbortSignal.any` 不可直接依赖 ⇒ **特征检测 + 本地兜底** `combineSignals`（`loop.mjs:29-38`；形态同形 `mcp/http.mjs:14-22`）；语义零变（任一 abort 即触发、reason 透传） |
| D2 | 墙判 ②2 防御分支注 | §13.4 契约五 墙判 bullet 下新增（`:491-495`） | `interrupted` 返回仅 Ctrl+I 置位（四传输层同判 `reason.interrupt`）——②1 先命中（`loop.mjs:176` → `:179` 顺序敏感）⇒ ②2 可达性存疑（实施前核验 id=7 结论）；**保留** + 用例经 seams（T-VG13） |
| D3 | §13.5 尾注第 2 例校正 | §13.5 尾注（`:537-542`） | `batch-segment.test.mjs:20` **直连** `src/advisor/tools.mjs`（不经 run.mjs）；`advisor-chain-guards.test.mjs:18` 经 `run.mjs:25` re-export——拆分保留 re-export 即可（消费面零改） |
| D4 | 实施域行数注记 → 交付实测 + 文档域复写 | §13.5 表头（`:519`）· 表 11 行（`:523-535`）· 表下注（`:543-546`）· 文档域行（`:554`） | 右值 = 交付实测：citations 143 · messages 296 · run 221 · loop 278 · compaction 160 · advisor 321 · advisor-async 463 · settings 261 · 测试档 427/192 · files 54；加「实测 vs 预计」行；设计档自注 641 → **660（同步后终值）** |
| D5 | 收敛路径残留登记 | §13.10 登记项新增一行（`:627-629`） | `buildAdvisorFollowUp`（round ≥2 + prior）不含 Approval Signal——契约二未覆盖；本批不做、归后续批评估 |

**行数（`N lines total` 口径——disk 实测）**：11 实施项全部 ≤ 各档位；贴线项 `messages.mjs` = **296**（≤300 未越线——零新增 advisory 债）；正偏差最大 +28（loop 278）· 负偏差最大 −29（run 221）。

**与实测零冲突声明**：除上述 5 项外未发现设计档与交付实测的其它冲突；as-of 证据面（§13.2 问题陈述等）按口径保留批次前 file:line（不改写历史）。遗留（零动）：§3 轮次 1 #5——SETTINGS-TOOL 行数注记 `52（实落）` vs 现实测 57（差 = 他批第 13 批内容）——Deferred 维持，未随本轮复写。

**纪律**：改动面 = VSC 设计档（`thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md`——§13.4 / §13.5 / §13.10 + 文档域行数）+ 本档 §2（本追加）；实现面（两仓 `src/**` / `test/**`）零触碰；§1/§3/§4 零碰；不 commit；不发起评审；不新建档。本设计者实跑 `node scripts/check-doc-width.mjs`（VSC）：`OK(宽度)` 67 文件 · 新增违规 0 · 新增超宽 0；CLI 仓复跑结果随本块后收口（父侧复验可并入 §6）。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

范围：VSC 设计档 §13 · CLI 需求档 §8 / SETTINGS-TOOL F-S1.7 对位行 · VSC TOOLS §5 · 批次档 §2（重发轮——稳定态复核）。文档域实测：ADVISOR 需求 197✓ · VSC 设计 625✓ · VSC TOOLS 225✓ · SETTINGS-TOOL 见 #5。全档 >300 字符单行零命中（grep 抽验）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 可追溯性（检查②） | 🟡 | §13.0 #4（:329）与 D-VG4（:532）称「映射列回指 CLI 对位用例」；§13.8 映射列实为需求号（F18–F23 / F-S1.7），全档 T-CG 用例号零出现（grep）——CLI 映射仅 F 级（经 §13.1 对位列） | 改措辞为「映射列回指需求条目（CLI 对位经 §13.1 对位列）」或补一列 CLI 用例号 |
| 2 | 凭证卫生 N14 | 🟡 | sync 消费点已明示 prior 清洗（:452-453 `_lastAdvisorOutput` 覆写），async 消费点（:454-455）未具名 prior 通道清洗、亦无 prior 零 token 断言；若 async prior 与 entry.report 同源则无损，否则 N14「报告/digest/prior」留缝 | 明示 async prior 等价清洗或补断言（T-VG4 扩一条） |
| 3 | 镜像登记完备性（检查①） | 🔵 | D-VG6（:534）枚举 4 处同文字面，未含契约三 pin 首行（:430）；预算提示 / 尾主体（:475-479）声明同文但未逐字入 VSC 档 | 注明枚举边界或补列 pin 首行；补逐字锚或抄写源（CLI file:symbol） |
| 4 | 编号一致性（检查④） | 🔵 | W2（需求 SETTINGS :32 · 批次 :25 · VSC TOOLS :120「裁定先例」）与 W3（设计 :345 · VSC TOOLS :224「镜像 CLI」）并存，所指未注明 | 回对第 8 批条目号；或注明 W2=裁定 / W3=CLI 条目（避免读成编号漂移） |
| 5 | 行数注记（检查⑥） | 🔵 | 文档域 SETTINGS-TOOL 注记「52（实落）」（:521）与实测不符（现内容至 :56 + 尾空行 ≈57）——差 = 他批（第 13 批）F-S1.3 补充块（SETTINGS-TOOL :18-22，本评审已除外该内容） | 交付批 §5 复写实测值；评审在途不做写改（D5） |
| 6 | 计数口径（检查⑥） | 🔵 | 「本端六条宿主尾」列 6 锚（:361-362：:146/:155/:159/:170/:210/:462）vs 契约四表 :445（:146 / :176 双锚 = 7 处）；「机读统计三要素」（:479）vs 四项列举（T-VG12 :567 / F22 需求 :178） | 统一口径（条=kind 或 site；要素 3/4）或注明 |
| 7 | 文档卫生 | 🔵 | AC-VG7（:588）「收集合」疑为「接受集」（F-S1.8 :36 术语）；§13.5 行 2（:500）「越线按 >300 存量记」——越线系**新增** advisory 债（对比 :504 advisor.mjs 存量档）；AC-VG3（:584）grep 判据非可执行形态 | 术语 / 措辞同步；AC-VG3 改可机判形态 |
| 8 | 复核边界（unverified） | 🔵 | 实施域 11 项代码行数注记与代码锚点（78/285/468/310/460/250/149/53 等）未独立复核——实现代码在评审范围外；pass 判定不依赖之（设计已定 §5 实测流程） | 交付批 §5 按注记口径复写实测 |

VERDICT: pass

计数：🔴 0 · 🟡 2 · 🔵 6（共 8 条）。

## §4 用户批准（主 agent 记）

**2026-09-11 11:43 用户批准**（原话「批准」）——**评审 + 修正轮 + 父侧逐条核验后的正式签字**（严格序）。

- **设计评审（轮次 1）pass**（0🔴 · 2🟡 · 6🔵——发现表见 §3 轮次 1；**重发轮**：首轮实例因在途子代理写 `requirements/SETTINGS-TOOL.md`（11:23:06）被判陈旧，父侧取消后于稳定态重发）；
- 8 条发现经父侧裁决：**6 条落地**（#1 映射措辞 · #2 async prior 同源句 · #3 字面登记/抄写源 · #4 W2/W3 消歧 · #6 计数口径 · #7 术语/可机判形态）· **1 条 Deferred**（#5 SETTINGS-TOOL 行数注记——他批内容 + 冻结中 + §5 实测复写流程）· **1 条无动作**（#8 复核边界声明）；
- 修正轮落地（id=6）经父侧逐条实文核验：**6/6**（含 #2 同源分支实据 `advisor-async.mjs:438-447/:399-400`；禁写六档 mtime 自证零触碰 ✓；两仓 lint 新增违规 0 / 新增超宽 0 ✓）；
- **批准范围**：VSC §13 全节（11 小节 · 契约六条 · 用例 17 · AC 8）+ 需求 §8（F18–F23 / N12–N15）+ F-S1.7 VSC 对位行 + TOOLS §5（3→4 键）+ 修正轮 6 条；**不含**：两处未纳登记（VSC F12 启动断言面 / 冻结窗口 E dispatch 面——登记在案后补批）+ 🔵 #5（交付 §5 实测复写）；
- **令牌**：设计评审 token 已持有（pass 轮签发；交付链开放——修正轮复用同链）；
- 下一步 = spawn eng-coder（实施域 11 文件）。

---

## §5 实施记录（eng-coder 自写）

> **父侧代笔（打标——非 eng-coder 自写）**：本链 §4 批准后**未 spawn eng-coder**（池全程空、无 spawn 记录）；
> 实施由**并行会话**落盘（本目录另有 2 个活跃实例；本侧零写入）。故本节由父侧依实测代笔记录，
> **不代表实施者自报**；`Done / Simplified / Not done` 自评栏**空缺**（无自报可引——不伪造）。

### 改动落盘（实测窗口 2026-09-11 11:46–11:51 HKT——11 项 = 8 改 + 3 新）

| # | 文件（VSC 仓） | 行数（终值） | 内容证据（file:line） |
|---|---|---|---|
| 1 | `src/advisor/citations.mjs` | 143 | 契约一 F21 候选链（`:9` 第 12 批注；失败三分在位） |
| 2 | `src/advisor/compaction.mjs` | 160（新） | 契约三 `compactMessages(messages, pinned)`（`:43`）· 契约四六 kind 谓词族 |
| 3 | `src/advisor/loop.mjs` | 278（新） | 契约五 F22 硬墙（`:141-149` `AbortSignal.any`/`timeout`）· 提示接线（`:120`） |
| 4 | `src/advisor/run.mjs` | 221（468 拆分后） | `:68` `buildPinnedBrief` · `:157/:160` pinned 传参 |
| 5 | `src/advisor/messages.mjs` | 296 | 契约二 F19 自愈尾包（`:267-275` 幂等补齐逐字字面） |
| 6 | `src/agent-tools/advisor.mjs` | 321 | design 结算面守卫（消费点 1） |
| 7 | `src/agent-tools/advisor-async.mjs` | 463 | async 结算 / 失败判定（消费点 2/3） |
| 8 | `src/agent-tools/settings.mjs` | 262 | 契约六 roleMap（`:35-40` `_SIBLING_SHAPES` 4 条 + `:116-117` 分支） |
| 9 | `test/advisor-chain-guards.test.mjs` | 423（新） | T-VG1–T-VG15 |
| 10 | `test/settings-tool.test.mjs` | 192 | T-S2.36 / T-S2.37 |
| 11 | `test/files.mjs` | 53 | `:52` 新档登记（显式清单 39 条） |

**验证**：本链实跑见 §6。

### 第 12 批实施记录（eng-coder 自写 · 2026-09-11）

**交付摘要**：VSC 仓 11 项（8 改 + 3 新）全部落地——① `src/advisor/compaction.mjs`（新：限额 / 压缩定锚 / 谓词族 / 文案 / 结构化尾）；
② `src/advisor/loop.mjs`（新：工具循环 + 硬墙 / 0.75 提示 / 结构化尾接线 + seams）；③ `src/advisor/run.mjs` 拆分后保 re-export 面 + `buildPinnedBrief` + 引文 scope 传参；
④ `src/advisor/citations.mjs` 候选链 + 失败三分 + 命中根透明；⑤ `src/advisor/messages.mjs` 信号自愈尾包（内层 + 外层）；⑥ `src/agent-tools/advisor.mjs` sync design 未完成守卫；
⑦ `src/agent-tools/advisor-async.mjs` async 守卫 + code 守卫换谓词（旧 `^` 锚正则退场）；⑧ `src/agent-tools/settings.mjs` 形状表第 4 条 + roleMap 分支；
⑨ `test/advisor-chain-guards.test.mjs`（新：T-VG1–T-VG15）；⑩ `test/settings-tool.test.mjs`（T-S2.33 扩 4 键 + T-S2.36/T-S2.37）；⑪ `test/files.mjs` 登记新档。
CLI 仓代码零改动（`src/` 与 `test/` 在 spawn 后 mtime 全扫 0 命中）。

**① 逐需求透明表（F18–F23 / F-S1.7 → 证据 file:line）**

| 需求 | 落点（证据） |
|---|---|
| F18 未完成即不签发（sync + async） | 谓词 + 提示：`src/advisor/compaction.mjs:98-124` · `:126-131`；sync：`src/agent-tools/advisor.mjs:276-285`（剥回显 + 提示 + 槽零写 + prior 清洗覆写；F2h 登记保留 `:275`）；async：`src/agent-tools/advisor-async.mjs:325-329` / `:382-385`（passed=false · D1 台账零写 · report=剥后+提示；stale 优先） |
| F19 凭证信号必达（构建面自愈） | `src/advisor/messages.mjs:267-276`（外层尾包；内层分支 `:86` 零改；幂等） |
| F20 信号全程在位（压缩定锚） | `src/advisor/compaction.mjs:43-66`（`compactMessages(messages, pinned)` 同 splice 重挂）；`src/advisor/run.mjs:68-80`（buildPinnedBrief 评审参数构建）+ `:157`；`src/advisor/loop.mjs:120`（调用点） |
| F21 引用解析按声明范围补全 | `src/advisor/citations.mjs:38-56`（citationRoots）· `:58-88`（resolveCitation 三条件 + 三分）· `:101` / `:120`（opts 签名向后兼容）；`src/advisor/run.mjs:171`（scope 传参） |
| F22 超时 / 预算守卫 | `src/advisor/loop.mjs:100-143`（轮间墙 + remaining + 0.75 一次性提示 + 复合信号）· `:165-181`（墙判定绑信号状态四分支）；`src/advisor/compaction.mjs:134-160`（nudge 纯函数 + 文案 + 结构化尾三要素 + budget 行） |
| F23 同族一致性（code 守卫） | `src/agent-tools/advisor-async.mjs:363-371`（failureVerdict 换同谓词；`ADVISOR_FAILURE_TEXT` 定义 / 消费零残留——grep 自证） |
| F-S1.7（VSC 对位行） | `src/agent-tools/settings.mjs:39`（第 4 条 roleMap）· `:115-123`（分支）· `:31` 与 `:8-10`（两处计数 3→4 同步）；测试 `test/settings-tool.test.mjs:152` / `:169` |

**② 实测行数表（口径 = 文件总行数，与 §13.5 注记同口径）**

| 文件 | §13.5 预计 | 实测 | 档位 |
|---|---|---|---|
| `src/advisor/citations.mjs` | 78 → ~140 | 143 | ≤300 ✓ |
| `src/advisor/messages.mjs` | 285 → ~297 | 296 | ≤300 ✓（贴线） |
| `src/advisor/run.mjs` | 468 → ~250 | 221 | ≤300 ✓ |
| `src/advisor/loop.mjs` | 新 → ~250 | 278 | ≤300 ✓ |
| `src/advisor/compaction.mjs` | 新 → ~140 | 160 | ≤300 ✓ |
| `src/agent-tools/advisor.mjs` | 310 → ~324 | 321 | <500 ✓ |
| `src/agent-tools/advisor-async.mjs` | 460 → ~476 | 463 | <500 ✓ |
| `src/agent-tools/settings.mjs` | 250 → ~262 | 261 | ≤300 ✓ |
| `test/advisor-chain-guards.test.mjs` | 新 → ~400 | 427 | ≤500 ✓ |
| `test/settings-tool.test.mjs` | 149 → ~205 | 192 | — |
| `test/files.mjs` | 53 → 54 | 54 | ✓ |

**③ 测试实测（先落盘再查——日志尾）**

- `cd thincoder-vscode && npm test` → `ℹ tests 408 · ℹ pass 407 · ℹ fail 0 · ℹ cancelled 0 · ℹ skipped 1 · ℹ duration_ms 12618`；slow 门零拦截（唯一 skip = 既有 `slow()` 归册用例，非本批）。
- `node --test test/advisor-chain-guards.test.mjs test/settings-tool.test.mjs` → `ℹ tests 23 · ℹ pass 23 · ℹ fail 0`（T-VG1–T-VG15 + T-S2.30–T-S2.37；最慢用例 363ms < 800ms 快层门）。
- `cd thincoder-vscode && node scripts/check-doc-width.mjs` → `OK(宽度): 扫描域全部 .md 无 >300 字符单行（67 文件）` + `一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）34 条`。
- CLI 仓：`src/` 与 `test/` 在本批 spawn（11:44）后写入 0 命中（mtime 全扫）；CLI docs 面 11:49 后写入 = 他批（第 13 批）在途，非本批。

**④ 偏差披露（零静默）**

1. **`AbortSignal.any` 不可直接依赖**（全仓无裸调在案；`src/provider.mjs:31` 的 polyfill 为非导出局部 const）→ 硬墙信号 = 「特征检测 + 本地兜底」`combineSignals`
   （`src/advisor/loop.mjs:29-38`，形态同形 = `src/mcp/http.mjs:14-22`）——语义同契约五（用户信号 × deadline 无条件复合传入）。设计档 §13.4 契约五括号句措辞由父侧后置同步（本端不改文档）。
2. **sync 结算面测试经本地 127.0.0.1 SSE fake server 直驱真 `chat()`**（T-VG3 / T-VG5）——零外网、零真实 LLM、零长等待；设计 §13.8「单测零网络」口径按「无外网依赖」理解，此处如实登记。
3. **残留登记（本批不做、非缺陷）**：design 评审走 `buildAdvisorFollowUp`（round ≥2 且有 prior 的收敛路径）不含 Approval Signal——契约二只覆盖 `buildAdvisorUserMessage` 的三个出口（设计 §13.4 明确范围）；
   该面与启动断言面（§13.10 登记）同族，归后续批评估。
4. **本端自持字面**：`empty` 尾 = `Advisor: (empty response`（D-VG7 已登记）；非 throw 中止返回 = `interrupted` 字段（D-VG5 已登记）——不追赶 CLI 字面。
5. `src/advisor/compaction.mjs:146`（budgetNudgeText 单行 304 字符）为逐字同文契约句；源码行宽无仓规约束（宽度门只扫 .md）——如实登记。

**⑤ §5 写入自证**：本段经 `batch_segment({segment:"5"})` 写入（唯一一次写入 + 写入后回读核实）；段内零凭证值；未碰他段。

**内部自审与代码评审（交付协议 §18——本会话内闭环）**

- 内部 explore 偏差审计（只读，单轮）：部分实现 0 · 静默简化 0 · 越出文件清单 0 · 文档漂移 1（🔵——§13.5 行数注记仍为预计值 + 本段当时为占位）→ 本段写入后闭合。
- 内部 advisor 代码评审（轮次 1）：**pass**（🔴 0 · 🟡 0 · 🔵 4）。
- 修正轮 1（3 条 Fixed + 1 条 Deferred）：#2 `settings.mjs` parseValue 死分支收敛（`return JSON.parse(s)`——语义零变）· #3 `test/files.mjs:42` 登记注释同步（4 键 + T-S2.30–T-S2.37）·
  #4 `test/advisor-chain-guards.test.mjs` 源码切片边界加断言 + 新增 EOL 归一 `readSrc`（防 CRLF 切片退化）· #1 `combineSignals` fallback 监听器累积 = Deferred（逐字沿用既有形态 + 有界 ≤100 轮 + `.any` 路径零影响；统一治理须连同既有形态，本批不动）。
- 修正轮后复跑：聚焦档 23/23 绿 · 全量快层 408/407/0 绿（零回归）。

## §6 验证与收口（父代理自写）

### 父侧验证（L2 全量结果 + verify）

| 命令 | 结果 |
|---|---|
| `cd thincoder-vscode && npm test`（快层） | **tests 408 · pass 407 · fail 0 · cancelled 0 · skipped 1**（exit 0） |
| `node --test test/advisor-chain-guards.test.mjs test/settings-tool.test.mjs` | exit 0（两靶档全绿） |
| 靶用例逐条 | **T-VG1–T-VG15 + T-S2.36 / T-S2.37 = 17 / 17 绿** |
| VSC `node scripts/check-doc-width.mjs` | OK(宽度)：67 档无 >300 行 · 新增违规 0 · 存量 34 |
| CLI `node scripts/check-doc-width.mjs` | 新增违规 0 · 新增超宽 0（本批档不在 >300 列表；存量 13 行属他批/基线） |
| 机检判据三式 | `citations.mjs` 全盘扫描（`readdir|glob`）= 0 命中 · VSC `src/advisor` `ADVISOR_FAILURE_TEXT` = 0 命中 · `_SIBLING_SHAPES` = 4 键 |
| CLI 仓代码零改动 | CLI 对位档 mtime = 05:1x–05:23 HKT（批 11 交付态）；本批窗口 11:46–11:51 **零触碰** |

### 逐条验收结论（AC 全文 = VSC 设计档 §13.9）

| AC | 需求 | 结论 | 判据 |
|---|---|---|---|
| AC-VG1 | F21 | **通过** | T-VG9 / T-VG10 / T-VG11 绿；`citations.mjs` 无全盘扫描（0 命中）；报告注明解析路径（T-VG9 断言） |
| AC-VG2 | F19 | **通过** | T-VG7 绿（自愈 + 幂等复测） |
| AC-VG3 | F20 | **通过** | T-VG8 绿；三式全真：`buildPinnedBrief`（`run.mjs:68`）+ 体内 `documents`/`object`/`designToken` 各 ≥1 + `compactMessages(messages, pinned)`（`loop.mjs:120`） |
| AC-VG4 | F18 | **通过** | T-VG3 / T-VG4 绿（零 token 字面 + 槽/台账零写 + 提示串）；T-VG5 零回归绿 |
| AC-VG5 | F23 | **通过** | T-VG6 绿；`ADVISOR_FAILURE_TEXT` 定义/消费 0 命中（六 kind 覆盖，旧六形态语义零丢） |
| AC-VG6 | F22 | **通过** | T-VG12 / T-VG13 / T-VG14 / T-VG15 绿（族前缀逐字 + 统计行三要素 + budget 行；0.75 一次性；时钟注入零真实等待） |
| AC-VG7 | F-S1.7 | **通过** | T-S2.36 / T-S2.37 绿；`_SIBLING_SHAPES` = 4 键（`defaultModel` / `shell` / `memory.team` / `agent.subagentModels`） |
| AC-VG8 | N15 | **通过** | 快层 407 pass / 0 fail；新档登记在位；档位：loop 278 / compaction 160 / run 221 ≤300 · advisor-async 463 ≤500 · 新测档 423 ≤500；两仓新增违规 0；CLI 代码零改动 |

**总判**：验收标准 **AC-VG1–AC-VG8 全数通过（8 / 8）**——需求 F18–F23 + F-S1.7 本批覆盖面达标。

### 需求池核销

- `docs/TODO.md:91`（VSC 三处同构镜像）→ **已核销**（第 12 批交付）。
- `docs/TODO.md:84`（VSC 写面 `agent.subagentModels` 零约束残留）→ **已核销**（第 12 批交付）。
- `docs/TODO.md:78`（两处未纳登记：F12 启动断言面 / 冻结窗口 E 的 VSC dispatch 面）→ **保留登记**（本批明示不在范围）。

### 核销同步清单（逐项核）

- **角色表**：无变更（本批不涉角色）。
- **状态行**：§1「已收口」+ 本 §6 = **交付收口**；§5 代笔打标说明见上。
- **计数**：实施域 11（8 改 + 3 新）· AC 8 · 用例 17（T-VG1–15 + T-S2.36/37）——与设计 §13.7 D3 行一致。
- **指针**：无新增跨界指针；`docs/TODO.md:84` / `:91` 由「在途」改「已核销」（D4 形态未变）。
- **变更记录**：VSC 设计档 `ADVISOR-CONVERGENCE.md:638` 第 12 批条已在位（designer 写域——零改）。
- **待办勾销**：两条已勾销（见上）。

### 遗留项

1. **实施归属不属本链**：实施由并行会话落盘，本链无 eng-coder 产出（§5 代笔打标）——跨会话同批档案写入风险已登记，后续须定唯一所有者。
2. **本链设计 token 未消费（链终态动作如实记录）**：`consume-design` 拒答「本会话有 5 个已批准设计，须传 designId」
   ——而 §4 依「**凭证不落文档**」纪律未记 designId，本档无从取值 ⇒ **本次不消费**（不猜 id，避免误闭他链槽位）。
   处置：由**实际签发该 token 的会话**（其 digest 含 designId）执行消费，或提供 designId 后由本会话补做。
3. 两处未纳登记（`docs/TODO.md:78`）：本批不做，登记保留。
4. **第 8 批（POOL-LEDGER）两仓台账收拢仍未落**（与第 12 批无关，另行处置）。

### §6 补记（本链签发会话 · 父侧——2026-09-11 12:05 对账）

**跨会话收口对账**：本档 §5 前段「父侧代笔」块（`:177`–`:197`）与 §6 前段由**并行会话**（本目录另两活跃实例之一）写入——其**验证结论有效**（与本会话独立复跑一致），归属判断**待正**：

1. **链归属澄清**：本批链 = **本会话（slot 30）**——评审 id=4 本会话点火（11:22 首轮陈旧取消 → 11:24 重发）；**token 由本会话签发**；eng-coder **id=9 由本会话 11:44 spawn**（携带 designId/token/batchDoc——即 §5 `:199`+ 自写记录的产出者）。并行会话「本链未 spawn eng-coder／实施归属不属本链」**仅对其本侧成立**（其池内确实无 spawn 记录），对全局不成立。
2. **§5 双记录关系**：`:177`–`:197`（并行会话代笔，行数 = **核验时点值**：settings 262 / 测档 423 / files 53）＜ `:199`+（**eng-coder 自写**，修正轮后终值：261 / 427 / 54）——**以 `:199`+ 为准**（其内文自标「修正轮后的终值见 §5 表」）。
3. **验证结论复核**：本会话独立复跑一致（快层 **408/407/0** · 靶档 23/23 · AC-VG1–8 **8/8**）——**收口成立**；TODO `:84`/`:91` 核销翻转抽查属实（D4 形态 ✓）。
4. **遗留项 2 闭合**：设计 token 由**签发会话**（本会话）消费——`consume-design` 回执「design slot consumed」·**链终** ✓（并行会话「不猜 id」的保守处置，动作正确）。
5. **跨会话同批档案写入风险**（两会话均已登记）：同一批次档被两会话父侧并发写 = 真实风险面（与「子代理合入写入面」同族）——处置方向 = **会话-批次单一所有者**（`docs/TODO.md` 已登记）。

