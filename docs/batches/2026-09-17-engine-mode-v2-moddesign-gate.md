# 工程模式 v2 · 模块设计（门禁与流程族）批次档

> 前情 = `docs/batches/2026-09-17-engine-mode-v2-specs.md`（规格批 + 模块设计·基础族）

## §1 本批目标与条目（主 agent）

**交付目标**：按 Function Spec 产出 **M3 / M4 / M5 / M6 的模块设计（Module Design）**。

**落点**：`docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-{BATCH-SEGMENT,WRITE-GATE,DELEGATION,REVIEW-CREDENTIAL}.md`

**本批条目**（4 条）：

| # | 条目 | Function Spec | 架构设计依据 |
|---|---|---|---|
| 1 | M3 批次档六段 | `...-SPEC-BATCH-SEGMENT.md` | §2.2 M3 · §2.3 E1（六段表）· E3（段白名单） |
| 2 | M4 写权门禁 | `...-SPEC-WRITE-GATE.md` | §2.2 M4 · §2.3 E3（门禁落点）· E6（微调点） |
| 3 | M5 委派与 spawn 门 | `...-SPEC-DELEGATION.md` | §2.2 M5 · §2.3 E4 · E5（带宽） |
| 4 | M6 评审凭证 | `...-SPEC-REVIEW-CREDENTIAL.md` | §2.2 M6 · §2.3 E6 · KD5 |

**模块设计五要素**：① 问题陈述 ② 方案与理由 ③ 受影响文件全清单（当前行数 + 预计增量，含两端接线面）④ 验收逐条回指规格 ⑤ 变更记录。

**范围边界**：
- 只出模块设计（精确到函数级编辑点）+ 批次档 §2；**不写实现代码**。
- 不改架构设计档 / 规格档 / v1 老档 / 代码。

**状态行**：✅ 已收口 2026-09-18（M3/M4/M6 验收完成——记录 = 甲批 §5；M5 随乙批；M8 随丁）

---

## §2 本批任务书（eng-designer）


**交付目标**：按 Function Spec 产出 M3 / M4 / M5 / M6 的模块设计（Module Design），落点四份模块设计档 + 本段 §2。已按五要素（问题陈述 / 方案与理由 / 受影响文件全清单（行数 + 增量）/ 验收逐条回指 / 变更记录）落笔。

### 覆盖条目（4 条 → 4 档）

| # | 条目 | 设计档落点 | 规格 AC 覆盖 |
|---|---|---|---|
| 1 | M3 批次档六段 | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` | AC-M3-1..4 |
| 2 | M4 写权门禁 | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` | AC-M4-1..5 |
| 3 | M5 委派与 spawn 门 | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` | AC-M5-1..6 |
| 4 | M6 评审凭证 | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` | AC-M6-1..5 |

### 显式不在本批（out-of-batch）

- **不写实现代码**（eng-coder 职责，后续批）。
- **不改架构设计档 / 规格档 / v1 老档 / 代码**。
- **M4 的 F4（台账/manifest 写命令装配）落点归 M1/M2**（架构 §2.3 E3 门禁落点表裁定），本批只在 M4 档记录承接、不实现——AC-M4-4 的实现验证随 M1/M2 批。
- **`validateDesignToken` 双源漂移**（`design-token.mjs:53` vs `advisor-async.mjs` re-export）与 **架构行数 stale**（`advisor.mjs` 记 284 vs `wc` 实测 274）为观察项，本批不动。

### 受影响文件（本批产物）

| 文件 | 动作 | 说明 |
|---|---|---|
| `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` | 新建 | M3 模块设计 |
| `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` | 新建 | M4 模块设计 |
| `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` | 新建 | M5 模块设计 |
| `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` | 新建 | M6 模块设计 |
| `docs/batches/2026-09-17-engine-mode-v2-moddesign-gate.md` | 追加 §2 | 本任务书段 |

（四份模块设计档内的「受影响文件」表另列**实现期**接线面文件 + 行数 + 增量——那是设计交付内容，非本批改动。）

### 验收标准（逐条回指规格，可机判）

| # | 验收判据 | 回指 |
|---|---|---|
| A1 | 每份模块设计档含五要素（问题陈述 / 方案与理由 / 受影响文件全清单含行数+增量 / 验收逐条回指 / 变更记录） | §1 五要素 |
| A2 | 验收标准逐条回指 Function Spec 的 AC 号（M3→AC-M3-1..4 · M4→AC-M4-1..5 · M5→AC-M5-1..6 · M6→AC-M6-1..5），每条可机判 | 三方条目一致 |
| A3 | 受影响文件表每行标 `当前行数 + 预计增量`，越档文件（近 500 硬上限）带拆分计划 | R24a |
| A4 | 设计档无 >300 字符单行，正常换行与分隔（人类可读） | 写文档纪律 |
| A5 | 本段 §2 与 §1 条目 / 四档验收回指条目三方一致（4 条 ↔ 4 档 ↔ 4 组 AC） | 三方条目一致 |

### 待主 agent 确认的观察项（本批未自行裁决）

1. **AC-M4-4 归属**：✅ 已裁（2026-09-17）——规格 ②.4/AC-M4-4 已写「装配点在 M1/M2，M4 只承接 · 验证随 M1/M2 批」，与架构一致，观察项作废。
2. **`validateDesignToken` 双源漂移**：`design-token.mjs:53` 与 `advisor-async.mjs`（经 `advisor.mjs:27` re-export）两处实现，未经核验是否漂移——M6 实现期核验（Deferred 登记）。
3. **架构行数 stale**：✅ 已裁——架构已收正 `advisor.mjs` 274（父侧收正），观察项作废。

**状态行**：🔄 进行中（模块设计·门禁与流程族）——§2 已落笔，待评审。

### 修正轮任务书（评审修正轮 1 · eng-designer 自写）

- 范围：按 §3 发现 #1/#2/#3/#4/#6/#7/#9/#10/#11/#12/#17 逐条落地（#5/#8/#13/#14/#15/#16 归主 agent 处置）。
- 落点：M3/M4/M5/M6 四份模块设计档（逐条已钉 `file:line`，见交付报告）；三方条目（§2 条目 ↔ 设计档 AC 回指 ↔ 需求档条目）不变。
- 处置执行人 = eng-designer（本段作者）；不新增语义、不新增范围。

待主 agent 确认清单（语义缺口——本轮未自行裁决，零裁量）：
1. AC-M3-4「机检红」腿落点：M8 规格 ②.5 只覆盖 D5「评审在途」窗口，无「已收口档回改」检面 → M8 补面 / spec 收窄，二选一。
2. AC-M4-5 规格侧缺口：spec ④ 有 AC-M4-5，② 功能点无对应条（②.1-②.4）→ 补 ②.5 / 收窄，二选一。
3. M5 带宽数值阈值：六格枚举映射已定结构，数值 = 占位符 `<待定>`——实现前主 agent 确认并回写 M5 §2.2 附表（硬前置条件，未回写不进入实现）。
4. M4 拆出新文件 `write-gate.mjs`（无条件拆分）——架构 §2.2 M4 行文件列 + §2.4 M6→M4 边同步（归主 agent，同 #14）。
5. M3 spec ② 无「冻结档回改拒」功能点（AC-M3-4 无对应）且 ②.4 有「咬合并」误字；M4 spec ② 缺「修≠绕」——需求档修订待派单。

## §3 设计评审记录（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

## 发现表（M3–M6 模块设计评审）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements | 🟡 | M3：F5「前情指针形态」在需求表列出（MODULE-BATCH-SEGMENT.md:27，规格 ②.5），但设计层/测试层零落点——无机制、无编辑点、无 AC 回指（规格 ④ 自身也无 AC 覆盖 ②.5） | 在 §1.4/§2.5 登记其判据归属（M8 锚检查 D4 指针纪律 / 主 agent §1 写纪律），或从 F 表移除并标「模板住需求档」 |
| 2 | Requirements | 🟡 | M3：N3 声明「批次档落点读 manifest docRoot.batches」（:35），但设计层无机制——resolveBatchDocPath 列继承零改（:72），受影响文件表无 docRoot 接线编辑点；架构 E2 明确把「批次档落点」列为声明面覆盖对象（ENGINEERING-MODE-V2.md:211） | 补编辑点（resolveBatchDocPath 改读 docRoot.batches / 装配层 configureBatchSegment 喂 manifest 路径），或显式登记该接线归 M1 装配层 |
| 3 | Clarity | 🟡 | M3：状态行解析语法未定——实际形态含 emoji 与括号自由文本（批次档 :26「**状态行**：🔄 进行中（…）」），KD-M3-3 只写「两态」（:89），未给容忍装饰的匹配规则，也未定「状态行缺失/不可解析」时写入路径的行为（fail-closed 方向未声明） | 给判定句（「已收口」关键字+日期正则、emoji/括号剥离）与缺行行为（缺状态行 → 拒写 or 按进行中放行，明示其一） |
| 4 | Requirements | 🟡 | M3：「整档冻结」宣称（:15）vs 机制只覆盖 batch_segment 写入路径——§1/§4/§6 主 agent 普通文档写，收口后回改无 M3 机械拦截；AC-M3-4「机检红」腿依赖 M8（需检测已收口档内容变更，本模块 helper 只判状态行↔activeBatch），该交接未登记 | §2.5 登记「普通写路径回改已收口档 → M8 机检红」交接并限定「拒」腿只覆盖 batch_segment，或收窄问题陈述宣称 |
| 5 | Doc ownership | 🟡 | M4：§2.5「F4 归属（规格 vs 架构）冲突」（MODULE-WRITE-GATE.md:85）已不存在——现行规格 ②.4 已写「M4 只承接」（SPEC-WRITE-GATE.md:14）、AC-M4-4 已写「验证随 M1/M2 批」（:29）；批次档 §2 观察项 #1（:75）同样过时 | 改写为「已与规格一致」的承接记录，删「需主 agent 确认」表述；批次档观察项 #1 同步勾销 |
| 6 | Requirements | 🟡 | M4：AC-M4-5「修≠绕：分流与门禁不一致 → 停下上报」无设计层机制——N3 声明（:29）+ T6 用例（:109）有，§2.1/§2.2/§2.3 无实现落点（哪个函数做分流一致性判据、放哪）；若继承 v1 行为须明示锚点；另规格自身无 ② 功能点对应 AC-M4-5 | 补落点一句（继承 v1 判据名 / 或新增检查点+编辑点行）；规格侧缺口列入待确认项 |
| 7 | Clarity | 🟡 | M4：拆分计划写成条件式「若增量后超 500」（:73），但 490 + 最低 20 = 510 > 500，拆分必然触发；且 M6 复用 resolveReviewTargetPaths 将引入 advisor.mjs → dispatch.mjs 反向 import（dispatch 已 import advisor-async），有循环依赖风险；架构 §2.4 未登记 M6→M4 新边 | 拆分改无条件，resolveReviewTargetPaths 落 write-gate.mjs 供 M6 直接 import；架构 §2.4 补 M6→M4 代码依赖行 |
| 8 | Clarity | 🔵 | M4：AC-M4-3「grep 硬编码路径 → 零命中」（:96）未限定 grep 范围；KD-M4-1 保留 conventions 分类作「代码路径判定」（:79），若该面仍含 docs/ 字面量会假红 | 限定 grep 范围为评审目标解析函数及其消费点，排除保留面 |
| 9 | Scope | 🟡 | M5：带宽阈值裁定空窗——架构 E5 明确「具体带宽阈值到模块设计定」（ENGINEERING-MODE-V2.md:282），本档 KD-M5-4 再递延「实现前与主 agent 确认」（MODULE-DELEGATION.md:92），resolveBandwidth 枚举映射缺失，F3「越带宽→拒」不可直接实现；且 §2.1 第 3 行「阈值到本档定死为枚举映射」（:49）与 KD-M5-4「不定数值」自相矛盾 | 补枚举映射表（phase×access → 带宽档 + 越带宽拒的触发条件）；或把「实现前主 agent 确认并回写本档」写成硬前置条件；统一两处措辞 |
| 10 | Clarity | 🟡 | M5：round 参数传递链未标注——新 spawn 参数 round 需工具 schema 收字段 + buildSpawnChild 调用点/调度器传播同步；受影响文件表 subagent.mjs 编辑点只列角色 enum（:79），round 的 schema 落点缺失；「工程角色必带」的集合未枚举（eng-designer/eng-coder？advisor/explore 是否必带） | 补 round 的 schema 编辑点与调用点清单（或声明只经 buildSpawnChild 参数不进 schema），枚举必带 round 的角色集合 |
| 11 | Clarity | 🔵 | M5：F4 判据表述拉扯——「已实证」（:92 KD-M5-2）vs「若 marker 不可判则标 open 待实现期定」（:97）；§2.3 编辑点「fies 拦截」拼写（:77） | 实现前先核 marker 可判性并统一表述；修 typo |
| 12 | Affected-file size | 🔵 | M5：buildSpawnChild 现 241 行（:77），若 +40~+70 全内联则函数逼近/超过 300 行单函数（函数层级判据）；拆分计划只保证文件层级回落 ~470 | 明确新增门禁逻辑全部落 spawn-gates.mjs，buildSpawnChild 自身增量 ≤10 行（只加调用） |
| 13 | Doc ownership | 🟡 | M6：§2.5 观察项「架构 §2.2 记 advisor.mjs 284 行」（MODULE-REVIEW-CREDENTIAL.md:84）与现行架构不符——架构 §2.2 M6 行现为 274（ENGINEERING-MODE-V2.md:69），与实测一致，观察项已过时；批次档 §2 观察项 #3（:77）同 | 删/改写该观察项为「已一致」；批次档 #3 同步勾销 |
| 14 | Doc ownership | 🟡 | M6：token-ttl.mjs / design-token.mjs 本档标「零改（继承）」（:68-69），架构 §2.2 M6 行（ENGINEERING-MODE-V2.md:69）与接线表（:92）均标「修改」——两侧变更标签不一致（机制本身两档同意零改）；另架构 M5 行未列 subagent.mjs（本档新增锚定） | 父侧同步架构：M6 行两文件改「零改」、M5 行补 subagent.mjs、§2.4 补 M6→M4 边；本档可加观察项记录差异 |
| 15 | Clarity | 🟡 | M6：F4 行「token / designId 值永落档（只记 review passed）」（:21）与行首「凭证值不落文档」及规格 ②.5、KD-M6-3「永不落文档」语义相反，系「永不落档」笔误——门禁族设计里意义反转型笔误 | 改为「永不落档」 |
| 16 | Doc ownership | 🟡 | 批次档 §2 观察项 #1（2026-09-17-engine-mode-v2-moddesign-gate.md:75）已被规格现行文本回答（AC-M4-4「验证随 M1/M2 批」），待确认事项已无待确认内容；#3 同 #13 | 主 agent 核验时勾销 #1/#3，仅留 #2（validateDesignToken 双源，unverified 需实核） |
| 17 | Clarity | 🔵 | 批次档 §2 尾部出现第二条状态行（:79「**状态行**：🔄 进行中…」），与 KD-M3-3「状态行住 §1」形态并存——构成 M3 解析器的真实边界样例（§2 内状态行字样不得干扰 §1 解析） | M3 用例表补一例：§2 内出现「状态行」字样时冻结判定仍读 §1 行 |

**VERDICT: pass** — 无 🔴。计数：🟡 13 · 🔵 4 · 🔴 0。

评审面限制：无 Project Standards 文档声明、无 Document Map（Document ownership 判据降级为对照架构目录约定——四档落点 docs/core/design/modules/ 与架构 E2 约定一致）；源代码级行号引用（dispatch.mjs:139 等）不在评审范围内、未经核验，文件级行数与架构 §2.2 交叉核对一致（除 #13/#14 所记差异）。

## §4 核验与裁决（主 agent）

**#61 修正轮打回点裁定（2026-09-17）**：

| # | 打回点 | 裁定 |
|---|---|---|
| ① | M8「已收口档回改」检面缺口 | **spec 收窄**：M8 不扩该检面（需快照/哈希 = 过度工程）；「机检红」腿 = D5 评审在途窗口（M8 AC-7），已收口回改由写纪律兑底——已落 M3 档 §2.5/AC-4 |
| ② | M4 规格缺「修≠绕」功能点 | ✅ 已补 spec ②.5（父侧） |
| ③ | M5 带宽数值待确认 | **推迟到实施前**（派 M5 实施批时主 agent 确认回写——设计档硬前置生效，未回写不进入实现） |
| ④ | 架构 M4 行文件列 + M6→M4 边 | ✅ 已补（父侧：M4 行加 `write-gate.mjs`；§2.4 补 M6→M4 边，保留 M4→M6） |
| ⑤ | M3/M4 需求档修订 | ✅ 已落（M4 spec ②.5 + ① 收窄） |

## §5 实施记录（eng-coder）

**验收记录（2026-09-18 · 甲批——explore id=56 只读核验；20 项逐条见 `docs/batches/2026-09-18-m346-acceptance.md` §5）**：

- M3/M4/M6 全部 AC **成立或按裁撤不适用**；唯二「部分成立」= AC-M4-5 / AC-M5-6（机械面在位、缺具名直测——登记不改）。
- 代码面 = 已被后续批交付（M3 `60fec0e4` 族 · M4 `f5df4d18` 族 · M5 随乙批 · M6 `f5df4d18` 族）；本批验收为**只读核验**，零代码 diff。
- 两处缺口确认：`freezeWindowConflict` 批次档腿无用例（登记不改）· `validateDesignToken` 双源不属实（观察项关闭）。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：M3/M4/M6 验收完成（记录 = 甲批 §5）；M5 收口随乙批（`2026-09-18-m-family-sweep.md`）；M8 随丁（前置 = #40 判据面——已实施并提交 `224ecbdd`）。本档状态行 = **已收口 2026-09-18**。
