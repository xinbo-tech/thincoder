# 2026-09-28 · 测试按层收口·提示词落地
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 22:30-22:31 两连斥（「不要过度测试」∕「为什么不执行」）根因 = 测试策略的频次面未落运行时层；承 `docs/core/requirements/TESTING.md` §1 与 2026-09-11 TEST-DISCIPLINE-PROMPTS 既定判据。
> 台账 = #532（TESTING · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.2 用户 22:40-22:42 追加口径（主轴 = 单元 ∕ 集成；舱 = 只做单元测试）
- 用户 22:40「老子只需要单元测试和集成测试」（L0–L2 机器话不要）；22:42「eng-coder 只做单元测试！只测自己这项任务的，别跑全量！能实现吗！」
- **落点三处**（待用户一字）：
  ① `discipline-engineering.md` 测试段 = T1 文本（**替换 22:35 已落处**——其 L0–L2 口吻作废）；
  ② `persona-engineering.md` 派单验收行 = 禁「全绿」条款 + 报告义务句必须原样带；
  ③ `TESTING.md` F1–F5 主轴收正（只留单元 ∕ 集成两条；L0–L2 降为执行附注 ∕ 删）。
- 机械面：无硬闸（拦在纪律层）——硬闸如需另议，父侧不荐。

### 1.3 落地记录（父侧直接执行 · 用户 22:42 直令 · 2026-09-28 22:4x）
- **四处已落**（两运行面 + 两镜像）：
  ① `thincoder-core/prompts/discipline-engineering.md:67-69` = Gate 行（复原）+「Iteration = unit tests only（只验自己这项改动；不得逐轮跑全量）」+「Whole-suite runs = the release gate（收口恰一次 · 父侧 · 不在 eng-coder 链内）+ 报告义务句」；
  ② `docs/core/design/prompts/discipline-engineering.md:66-67` = 同义两行（CN）；
  ③ `thincoder-core/prompts/persona-engineering.md:125` = 验收行尾补（禁「逐轮全绿」式条款；全量归父侧收口）；
  ④ `docs/core/design/prompts/persona-engineering.md:124` = 同义（CN）。
- 22:35 旧落（L0–L2 口吻）已被 ① 替换（作废）。
- 在跑舱已送令（#101 ∕ #111）；排队舱启动即送。
- **口径冲突在册**：`discipline-engineering.md` D1 行「提示词 = 主 agent 内容权 + eng-coder 落笔」vs 清偿批 §2.2「提示词面 → 主 agent 内容权 + 落笔」——本批按近者（§2.2 · 主 agent 落笔）执行；D1 行收正归设计面轮。
- **仍挂用户**：`TESTING.md` F1–F5 主轴收正（只留单元 ∕ 集成；L0–L2 降为附注）——待一字。

### 1.4 需求档落定 + 设计面派单（父侧直接执行 · 2026-09-28 22:4x）
- `docs/core/requirements/TESTING.md` §2 F1–F4 收正（**L0–L2 机器分层表述退场**）：F1 = 舱内只跑单元测试（只验本任务改动；不得逐轮跑全量）· F2 = 报告义务句 · F3 = 全量 ∕ 集成归父侧（收口恰一次/端，不在 eng-coder 链内）· F4 = verify 不代跑（去「三层」字面）。
- 设计面随动 = **设计轮派单**（`docs/core/design/TESTING.md` 对齐：L0–L2 现行表述清零；与 F1–F4 语义一致）。

### 1.5 退役口径收正（父侧直接执行 · 用户 22:45「按这个落地」）
- 收正面 = 提示词的单元测试条（原「写即弃 ∕ 不搞退役台账仪式 ∕ 不逐条判」与用户口径相抵）：
  ① `thincoder-core/prompts/discipline-engineering.md:65-66`（EN live）= 批次收口逐条处置 · **默认退役（删除）** · 三条件全满足才转集成 · 退役是常态保留须举证（料在档零新增簿记）+ **收口处置行**（①②双半）；
  ② `docs/core/design/prompts/discipline-engineering.md:63-64`（CN 镜像）= 同义。
- 残余 = 三处 `.thincoder/tmp/` 陈旧副本（`core-pkg` ∕ `core-probe` ∕ `core-registry-copy`）仍携旧文——**非运行时源**，随 #416 类清理轮处置（在册）。
- 需求档 F6 ∕ F9（寿命 ∕ 处置行）原文与用户口径一致（本次零改）。

### 1.6 陈旧副本同步 + 收束（父侧直接执行 · 用户 22:46「不要再问」）
- 三处 `.thincoder/tmp/` 副本（`core-pkg` ∕ `core-probe` ∕ `core-registry-copy`）的 `discipline-engineering.md` 旧文**同步改齐**（与运行面同文）——「旧文在场 0」。
- 本线状态：提示词（运行面 ∕ 镜像 ∕ 副本）✓ · 需求档 F1–F4 ✓ · 设计档 = #123 在跑 · 派单条款 ✓。
- **行为口径（用户 22:46 直斥）**：明确意图之内 = **不再问「要不要」，一律执行到底**。

### 1.7 测试面全量盘查与清理（父侧 · 用户 22:51「彻底清理干净」要求）
- **盘查范围**：提示词（运行面 ∕ 镜像 ∕ 拼装副本）· 需求档 · 设计档 · 测试档注释 · runner ∕ package.json ∕ CI · scripts——全部实读。
- **结果**：
  ① 提示词 4 档案 = 单元 ∕ 集成轴 + 舱只跑单元 + 收口一次 + 退役纪律（22:4x 已落）· 3 处 `.thincoder/tmp` 副本已同步；
  ② 需求档：`TESTING.md` F1–F4 · `ENGINEERING-MODE-V2.md` §8.6 · `SPEC-TEST-DISCIPLINE.md` · `vsc/requirements/PROJECT.md` N-P1 ∕ `core/requirements/MEMORY.md` N6·N-M4——全部收正；
  ③ 设计档：#123 对齐轮已落（`TESTING.md` ∕ `AGENT-LOOP.md` ∕ `VERIFY-REDESIGN.md` ∕ `ENGINEERING-MODE-V2.md` §测试纪律——L0–L2 ∕ 退役台账句对齐 F1–F4 ∕ F6/F9）；
  ④ 测试档注释：共 **68 处**清正（机制断言类 15 + 描述词 45 + 补 8）——「快层 ∕ 慢层 ∕ test:full ∕ 慢门」现行表述归零；
  ⑤ 实体面：四项目 runner = 单入口 `run.mjs` + `slow.mjs` 纯别名；`package.json` ∕ CI 零 `test:full` ∕ `test:integration` ∕ `slow-gate` 残留；`publish-all.mjs` ∕ `doc-impact.mjs` 措辞已收正；
  ⑥ 残余（在册）：3 处 `.thincoder/tmp` 陈旧副本（非运行时源——随 #416 类清理轮）；批档 ∕ 归档 ∕ `TODO-archive` = 历史记录（形态合规，不动）。
- **复扫判据**：`快层|慢层|慢门|test:full|slow 层` 在 `.mjs`（除 tmp）与活面 `docs` 归零（仅历史记录面与规范否定句残留，属合规形态）。

### 1.8 集成集规模窗口（用户 22:57 裁定落档）
- 用户原话：「我认为合理的集成测试，一仓有 50–100 个足够了，超过这个数字肯定是过度测试。」
- **落点**：① 需求 `TESTING.md` 新增 **N10**（集成集规模窗口 = 一仓 50–100 用例；**超过即过度测试**；超窗须裁减回窗口内）；② 提示词两档（EN 运行面 `discipline-engineering.md:67` + CN 镜像 `:65`）集成测试条补预算句（≈50–100 —— beyond that is over-testing；裁减不增补）；③ 清点轮（#124–#127）已追令：报告增列「现集成数 vs 窗口 + 超额裁减候选」。
- **清点目标态**（联动）：集成 ≤100 ∕ 仓；单元 = 开发期、不囤积（收口逐条处置）；退候选分类照旧（开发期残留 ∕ 已完结内部锁 ∕ 机制已退役）；不确定者列「留-待核」。

### 1.9 清点轮读数（CLI 仓 · #125 首单）
- 总量：117 文件 = **107 测试档**（单元 98 ∕ 集成 9）+ 10 支撑档；用例 **≈895**（单元 **863** + 集成 **32**）。
- **集成 32 例 = 在 50–100 窗口内（低于下沿 −18，超额裁减候选 = 无）**——上千的是**单元层 863**（每批写、从未退过）。
- 分桶：结构锁 14 档 ∕ 110 例 · 真行为回归 64 档 ∕ 584 例 · 留-待核 9 档 ∕ 101 例；**明确退候选 11 档 ∕ 68 例**（绑内部实现、无业务可观察面）。
- 附带发现（册）：① `prompts-async-guidance.test.mjs:9,36` 指向 `test/doc-consistency.test.mjs` T75——**该档不在盘上**（悬空指针，随处置轮对读）；② 用例级候选：`home-expansion:191` 读 README 字面（散文锚形态）、`cmd-config-effort:46` 源锚等——随处置单逐条裁。
- 处置方向（待另三仓 + 处置单）：退候选先清；单元层大头按 F6/F9（默认退 ∕ 三条才转集成 ≤100）逐条裁。

### 1.10 清点轮读数（Desktop 仓 · #127）+ 一处冲突裁（机检面档）
- 总量：**59 档 ∕ 271 例**（单元 261 + 集成 10）；**集成 10 = 未超窗**（超额裁减候选 = 空）。
- 分桶：结构锁 4 档 ∕ 19 例（另 17 档含在册锁例 ≈24 例）· 真行为 22 档 ∕ 125 例 · **明确退候选 7 档 ∕ 37 例**（绑内部实现；含 `store` ∕ `events-reduce` ∕ `views-chat-scroll` 等）· 留-待核 16 档 ∕ 80 例。
- **裁（承 #127 上抛「单元默认退 vs 设计档在册机检面」冲突）**：**在册机检面档 = 按结构机检类「留」**——其撤面须先改设计档改指（不静默撤注册面）；**无在册依据的纯内部绑定档 = 退候选**（照枚举②）。此裁与已批政策一致（结构机检面属允许面），非新语义。
- 待齐：core（#124）· vsc（#126）→ 总表 + 处置单（Phase 1 = 明确退候选即清；Phase 2 =「真行为回归」逐档三条判据复核）。

### 1.11 清点轮读数（VSC 仓 · #126）
- 总量：**130 档 ∕ 1053 例**（单元 986 + 集成 67）；**集成 67 = 在窗内**（+17 ∕ −33；超额裁减候选 = 无）。
- 分桶：结构锁 12 档 ∕ 79 例 · 真行为 92 档 ∕ 817 例 · **明确退候选 6 档 ∕ 40 例**（`eng-settlement` ∕ `subagent-id-counter` ∕ `permission-gate-seam` ∕ `loop-sampler` ∕ `trace-cleanup` ∕ `provider-timeout-semantics`）· 留-待核 7 档 ∕ 50 例。
- 出界册（随处置单对读）：① `test/files.mjs` 清单注释 as-of 漂移多处；② 疑似散文锚残留 4 处（`activity-closure` T-CL6 ∕ `activity-flow` T-R7 ∕ `digest-visibility` T-D8 ∕ `status-line` T-CL21a-3——属 F15–F22 射程）。
- 待齐：core（#124）→ 总表 + 处置单。

### 1.12 收口推进（父侧）
- **#532 追认核销**：测试策略「按层收口」未落提示词层之缺口 = 今晚四档落定（EN 运行面 + CN 镜像：单元 ∕ 集成轴 + 舱只跑单元 + 收口一次 + 退役纪律 + 集成窗口 N10）⇒ 证据闭环（本档 §1.1–§1.8 + 提示词实读回执）。
- **`TESTING.md:4` 收正**（承 #123 待裁项）：『§3 测试生命周期 = v1 历史（v2 由 §10 F4 替代）』→『§3 = **现行**（口径 = 需求 F6–F14——退役纪律 2026-09-28 复确认；§10 F4 只涉台账仪式面）』（**父侧直接执行** · 单行 · 可回退）。
- 待齐：core 清点（#124）→ 总表 + 处置单；随后本批 §6 收口（含测试处置行）。

### 1.13 四仓清点汇总（#124–#127 全齐）
- **总量**：四仓 **390 档 ∕ 3030 例**（core 94 ∕ 811 · cli 107 ∕ 895 · vsc 130 ∕ 1053 · desktop 59 ∕ 271）。
- **分桶合计**：
  · **集成 = 109 例**（core 0 · cli 32 · vsc 67 · desktop 10）——**四仓全部在 N10 窗口内，超额裁减候选 = 空**；
  · **结构锁 = 58 档 ∕ 452 例**（core 28∕244 · cli 14∕110 · vsc 12∕79 · desktop 4∕19——另有 ≈24 例混装于他档）；
  · **退候选 = 36 档 ∕ 213 例**（core 12∕68 · cli 11∕68 · vsc 6∕40 · desktop 7∕37）——第一刀；
  · 留-待核 = 38 档 ∕ 277 例（不硬判）；真行为 = 226 档 ∕ 1979 例（收口逐条处置对象）。
- **处置序（待用户裁）**：① 退候选 213 例即清（删除清单制）；② 结构锁 58 档单列一栏待用户一刀（留 ∕ 部分留 ∕ 全退）；③ 真行为档按 F6 ∕ F9 三条判据复核（Phase 2）。

### 1.14 处置执行（退候选第一刀 · 用户 23:03「先这么做」）
- **删除 36 档**（退候选全数）：core 12（advisor-convergence ∕ advisor-history ∕ advisor-truncate ∕ file-links ∕ history-window ∕ live-beat ∕ log ∕ queued ∕ reasoning-echo-live ∕ text-budget ∕ think-off ∕ wait-status）· cli 11（advisor-provider ∕ advisor-truncation ∕ advisor-sync-accounting ∕ advisor-context-budget ∕ config-pool ∕ heap-watch ∕ memory-wal-hygiene ∕ trace-bounds ∕ turn-across-segments ∕ memory-scan-bounds ∕ cmd-config-effort）· vsc 6（eng-settlement ∕ subagent-id-counter ∕ permission-gate-seam ∕ loop-sampler ∕ trace-cleanup ∕ provider-timeout-semantics）· desktop 7（views-attach ∕ views-chat-scroll ∕ views-chat-text ∕ store ∕ events-reduce ∕ events-subagent ∕ agent-bridge-subagent）。
- **清单对账**：`vsc/test/files.mjs`（摘 6 行）· `desktop/test/files.mjs`（摘 7 项）· core ∕ cli = glob 自动收（零登记面）。
- **复跑读数（父侧）**：core **745/745 exit 0**（≈811 −66）· cli **825/825 exit 0**（≈895 −70）· vsc **1012/1012 exit 0**（1053 −41；修一处死引用锁：`session-gc-command.test.mjs:124` 摘已删档登记断言 ⇒ 复跑绿）· desktop 留待 R13-B（#101）落定后的收口跑（其 `host-floor` ≤300 臂清单含 3 项已删档——已 steer #101 顺带摘行，兜底 = 父侧收尾）。
- **附带**：vsc 两处注释死引用收正（`agent-lifecycle-singleton` ∕ `vsc-stream-rules`）；`#101` 已送测试纪律令（单元-only ∕ 不刷绿 ∕ 清单先重读再写）。
- **下一步**：锁处置（58 档 ∕ 452 例 ⇒ 目标 = 每仓一档卫生表 ∕ 只收复发实绩条目）+ 真行为档三条判据复核（Phase 2）；desktop 复跑并入 R13 收口。

### 1.15 单元测试 = 批次本地件（用户 23:1x 直令落档）
- 用户原话：「以后单元测试跟着批次档，文件名就跟着批次档的文件名，一个批次档跟一个或者几个测试文件，就放在批次目录里。」
- **落点**（本笔 = 父侧直接执行）：① 需求 `TESTING.md` §1 总纲 + F6 行 + N1 作用域（三处收正：批次本地件——一档一至几个文件 · 名随批次档 · 住批次目录 `docs/batches/` · 随批同生共退 · 收口默认退役）；② 提示词两档（EN 运行面 `discipline-engineering.md` + CN 镜像）单元测试条补「batch-local files」句。
- **机制后果（自带，零新增机械面）**：批次本地测试档住 `docs/batches/` ⇒ 四仓 runner 收集面（`test/*.test.mjs` 各仓 glob ∕ files.mjs 清单）天然不收——**不入常驻套件**；运行 = 直跑 `node --test docs/batches/<batch>.test.mjs`（F5 精神）；退役 = 随批次档收口处置（F9 行）。
- 存量 `test/` 树不受此令（"以后" = 前行）；存量处置（退候选 213 已落 ∕ 锁与真行为 Phase 2）照旧。

### 1.16 处置执行（第二刀 · 锁类纯档）
- **删除 10 档**（规格表锁 ∕ 计数+白名单锁 ∕ golden 冻结 ∕ 协议对位——用户 23:0x 批准类目）：core 8（model-specs ×5 = 62 ∕ config-presets = 8 ∕ i18n = 5 ∕ core-hygiene = 5）· vsc 2（protocol-coverage = 4 ∕ protocol-coverage-reverse = 3）。
- **复跑（父侧）**：core **665/665 exit 0**（745 −80）· vsc **1005/1005 exit 0**（1012 −7）。
- **随刀清理**：vsc `files.mjs` 摘 2 行；**死引用注释 12 处**收正（vsc 源 4 档 5 处 ∕ queue-visible-vsc ∕ render-core composer ∕ core 6 处）——零语义（父侧直接执行 · 可回退）。
- **余量**：锁 58 档 ∕ 452 例 → **48 档 ∕ 365 例**；待续 = 剩余锁逐档判（U 系单源族留并 ∕ 其余退）+ 真行为档三条判据复核（Phase 2）。

### 1.17 全清重置执行（用户 23:18 令「干脆全清干净以后再建」）
- **删除**：五仓测试树全量——core ∕ cli ∕ vsc ∕ desktop ∕ render-core 的 `*.test.mjs` + 集成域 + helpers ∕ fixtures ∕ mocks ∕ harness（**≈489 档**，含前两刀 46 档；用例量约 2900）。**每仓 runner 骨架保留**（`run.mjs` ∕ `slow.mjs` ∕ `rc-resolve.mjs`）+ 手工 smoke 脚本（不入套件）。
- **清单重置**：vsc ∕ desktop `files.mjs` → 空（含重建规则注）；vsc `integration/files.mjs` 重建为空。
- **runner 守卫**：五仓 `run.mjs` 补「空清单守卫」（零用例即绿；拦截 `node --test` 自动发现——vsc 首跑曾误收 smoke 档触发假红）。
- **复跑**：五仓 `npm test` **全 exit 0**（`test manifest is empty — zero tests = green`）。
- **重建规则（即日生效）**：单元 = 批次本地件（名随批次档、住 `docs/batches/`）；集成 = 业务设立（窗口 50–100 ∕ 仓 · N10）。前文三刀计划（退候选 ∕ 锁 ∕ 真行为）**随全清令并完**——后两刀取消（被全清覆盖）。
- **残留（在册）**：① docs ∕ 源码注释中指向已删测试档的死引用（批量扫描收正——随文档面轮）；② `desktop/test/artifacts/`（gitignore 截图）与个别空目录剩留（无害）。

### 1.18 集成域分布（用户 23:22 裁落档）
- 用户原话：「以后集成测试不用测两个核心仓，只需要从 cli/vsc/desktop 三个前端测就可以，测前端自然会带到后端。」
- **落点**：① 需求 `TESTING.md` 新增 **N11**（集成集只住三个前端；核仓 `thincoder-core` ∕ `thincoder-render-core` 不设集成集）；② 提示词两档（EN + CN）集成测试条尾补同句。
- 设计面同步（`design/TESTING.md` §4 承载与执行节）归本批收口时对读（在册）。
- 重建口径合计（三条用户裁）：单元 = 批次本地件（`docs/batches/`）· 集成 = 三前端、窗口 50–100 ∕ 仓 · 核仓零集成。

### 1.19 单元测试「谁写 ∕ 谁跑」显式钉定（用户 23:25 问）
- **归属**（与既有落点一致，今回显式化）：**写 = 改动实施者本人**（eng-coder 舱；父侧直改 = 父侧）；**跑 = 同一方只跑本任务这几件定向单测**（不代跑 ∕ 不逐轮复跑）；**全量 ∕ 集成 = 父侧收口恰一次**（发布门）；**退役 = 父侧收口处置行**（§6）。
- **落点**：提示词两档单元测试条尾补显式句（EN「the change&apos;s implementer writes them and runs exactly those (nobody else, no per-round re-runs)」+ CN 镜像同句）。
- 文件形态不动（批次本地件、名随批次档、住 `docs/batches/`——§1.15 在册）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（四档对齐落定（TESTING · AGENT-LOOP · VERIFY-REDESIGN · ENGINEERING-MODE-V2）· 待评审）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）
- **B1**（派单）：`docs/core/design/TESTING.md` 与需求新口径对齐——L0 ∕ L0+ ∕ L2 现行表述退场；改引需求 `requirements/TESTING.md` §1 总纲 + §2 F1–F4（舱内单元 ∕ 链终全量收口）；新增 A-TS13 回指。轮 = initial（初轮）。
- **B2**（父侧裁定追加 · 声明外）：同判据活面残余两处——`docs/core/design/AGENT-LOOP.md:395` 指针表行标签 · `docs/core/design/VERIFY-REDESIGN.md:75` 提示词面括号（+ 同行「verify 三层都」去旧轴字面，见 §2.6 D3）。
- 需求依据 = `docs/core/requirements/TESTING.md` 2026-09-28 22:4x 收正（F1 舱内只跑单元测试 · F2 报告义务句 · F3 全量 ∕ 集成归父侧 · F4 verify 不代跑）。
- **明确不在本批**：需求档（主 agent 笔权——只对读）· 提示词档（两运行面 + 两镜像 22:4x 已落——不触）· runner ∕ slow 门 ∕ 集成集机制 ∕ §10 门禁事实（零改）。

### 2.2 设计档落点（逐处 · 落定后行号）
| # | 落点 | 改动 |
|---|---|---|
| 1 | `TESTING.md:4` | 首部状态行——「工作分工 L0 ∕ L0+ ∕ L2」→「收口分工：舱内单元 ∕ 链终全量」 |
| 2 | `TESTING.md:10` | 关联行——「§1 是分层纪律的权威叙述」→「§1 分层纪律口径源 = 需求 F1–F4（只引用不重述）」；实现侧正文指针改指 22:4x 实落两档（`discipline-engineering.md` 测试纪律节 · `persona-engineering.md` 派单验收行）+ CN 正本面 |
| 3 | `TESTING.md:17-25` | §1.1——旧三层分工表退场 → 舱内 ∕ 链终收口两面表（口径 = 需求 F1 ∕ F3）；报告义务句 ∕ verify 改引用（F2 ∕ F4） |
| 4 | `TESTING.md:55` | §3 术语注——「验证层级（L0/L0+/L2）」→「收口分工（舱内单元 ∕ 链终全量；口径 = 需求 F1–F4）」 |
| 5 | `TESTING.md:224` | §7 新增 A-TS13（回指 F1–F4；旧分层表述仅存变更记录面） |
| 6 | `TESTING.md:382-383` | 变更记录——新增 2026-09-28 行（含日期） |
| 7 | `AGENT-LOOP.md:395` | §6.16 指针表行标签「测试分层 L0 / L1 / L2」→「测试收口（舱内单元 ∕ 链终全量）」（指针不变） |
| 8 | `AGENT-LOOP.md:504` | 变更记录——新增 2026-09-28 行 |
| 9 | `VERIFY-REDESIGN.md:75` | §5 提示词面括号——「（L0 即时验证 / L1 项目快测试 / L2 全量）」→「（迭代期只跑本任务面单元测试；全量 ∕ 集成 = 收口恰一次、父侧——见 `requirements/TESTING.md` §2 F1–F4）」；同行「verify 三层都」→「verify 只」 |
| 10 | `VERIFY-REDESIGN.md:144-145` | 变更记录——新增 2026-09-28 行 |

### 2.3 机制设计
- 口径链 = 需求档（规范源 F1–F4）→ 设计档（设计侧映射 + 实现指针，只引用不重述——D2 单一权威源）→ 提示词面（22:4x 已落）。
- 主轴切换：旧 L0 ∕ L0+ ∕ L2 工作分工退场 → 舱内（eng-coder · 单元验证）∕ 链终收口（父侧 · 全量含集成）两面 + verify 面。
- 历史面：旧字面仅存三档变更记录面（+ 日期）；活面零残留。

### 2.4 受影响文件与测试面
| 文件 | 读时行数 | 落定行数 | Δ |
|---|---|---|---|
| `docs/core/design/TESTING.md` | 417 | 419 | +2 |
| `docs/core/design/AGENT-LOOP.md` | 591 | 593 | +2 |
| `docs/core/design/VERIFY-REDESIGN.md` | 145 | 148 | +3 |

- 纯文档改动——零源码 ∕ 零测试档触碰；验证面 = `node scripts/doc-check.mjs --root .`（锚 + 行宽）+ 行面 grep（复跑命令与读数见 §2.5）。

### 2.5 验收对照（回指需求 F1–F4）
| # | 判据（机器可验） | 落定读数 | 回指 |
|---|---|---|---|
| G1 | 三档活面（变更记录面外）零 `L0` ∕ `L0+` ∕ `L1` ∕ `L2` 现行表述 | grep：TESTING.md 活面 7 → **0** · AGENT-LOOP 活面 1 → **0** · VERIFY-REDESIGN 活面 1 → **0**；残余全部在记录面（含日期） | 派单验收 1 |
| G2 | 语义与需求 F1–F4 一致（舱内单元 ∕ 链终全量 ∕ verify 不代跑） | §2.2 表落点 1–5、7、9 逐处对读通过 | 需求 F1–F4 |
| G3 | 新增 ∕ 改动指针 `文档:节` 形态可解析 | doc-check 锚面：悬空 56 = 基线（Δ 0——零新增悬空） | 派单验收 3 |
| G4 | 无 >300 字符单行 | doc-check 行宽：**OK 0 命中**（基线 0）；本批改动行全部 ≤300（表行改动 ≤127） | 派单验收 4 |

### 2.6 关键决策
| # | 决策 | 被否决 ∕ 理由 |
|---|---|---|
| D1 | 旧三层分工表**整表退场**（不降附注） | 附注形态仍属现行表述——用户明文「L0–L2 机器话不要」 |
| D2 | 报告义务句 ∕ verify 细节改**引用**（F2 ∕ F4） | 逐字复述 = 漂移源（旧句已与需求新句不一：`full-suite point` vs `full-run point`） |
| D3 | VERIFY-REDESIGN 同行「verify 三层都」一并去旧轴字面 | 「三层」= 被替换括号的指代对象（悬空引用）；同判据直接派生——如不合裁可单点回退 |
| D4 | A-TS13 初稿含 L0–L2 字样后**去除**（改「旧分层表述」） | AC 自身含字面 ⇒ 与「活面零字面」判据自我指涉相抵；字面归记录面承载 |

### 2.7 上抛项
- 无未决项（原两处同族残余 U1 ∕ U2 已经父侧裁定并入 B2 落地）。
- 观察（非本批 · 不阻断）：① `TESTING.md` 变更记录内 2026-09-26 条位置在 09-15 ∕ 09-16 条之后（历史案卷次序漂移，未动）；② `AGENT-LOOP.md` as-of 行数注记未随本笔刷新（随触碰批）。

### 2.8 父侧追加裁定（第二轮 · 退役台账「砍」义复确认 · 声明外追加 · 父侧已裁）
（承 §2.2 表续）

| # | 落点 | 改动 |
|---|---|---|
| 11 | `ENGINEERING-MODE-V2.md:279` | 「砍掉：… · 测试退役台账」→「… · 独立退役台账仪式（处置仍按需求 `requirements/TESTING.md` §2 F6 ∕ F9——批次收口逐条，2026-09-28 复确认）」 |
| 12 | `ENGINEERING-MODE-V2.md:532` | 变更记录——新增 2026-09-28 行 |
| 13 | `TESTING.md:259` | §10 定位段——「『测试退役三选一』流程」→「『测试退役三选一』的**独立台账仪式**」+ 尾注「退役处置仍按需求 `requirements/TESTING.md` §2 F6 ∕ F9（批次收口逐条——2026-09-28 复确认）」 |
| 14 | `TESTING.md:268` | §10 F4 行——「砍测试退役台账 ∕ 不做…流程（§3 生命周期 = v1 历史）」→「砍**独立**退役台账仪式——退役处置仍按需求 §2 F6 ∕ F9（批次收口逐条；2026-09-28 复确认）」 |
| 15 | `TESTING.md:382-384` | 变更记录行——补「§10 复确认收正」子行（承本批既有 2026-09-28 行） |

- **受影响文件追加**：`docs/core/design/ENGINEERING-MODE-V2.md`（593 → 595 · Δ+2）· `TESTING.md`（419 → 420 · Δ+1）——两档变更记录行同笔落定（各档本地惯例 = newest-at-top）。
- **读数（复跑）**：doc-check 锚悬空 56 = 基线（Δ 0）· 行宽 OK 0 命中；本批追加行 288 ∕ 122 ∕ 165 ∕ 127 ∕ 97（TESTING）· 250 ∕ 245（ENG-V2）全部 ≤300；活面 L0–L2 grep = 0（四档）。
- **口径**：退役处置 = 需求 F6 ∕ F9 仍在册（批次收口逐条，默认退役）——本轮收正只限定「砍」义 = **独立台账仪式**。
- **上抛（需裁）**：`TESTING.md:4` 首部状态行「§3 测试生命周期 = v1 历史（v2 由 §10 F4 替代）」句——F4 已收正（仅砍独立台账仪式；退役处置仍按 F6 ∕ F9）⇒ 该句失去依据、与 F6 ∕ F9 在册相抵；本笔未触（派单未及），建议随裁收正。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
