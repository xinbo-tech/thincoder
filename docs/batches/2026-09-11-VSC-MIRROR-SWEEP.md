# VSC 同源镜像收口（群 A）· 批次记录（2026-09-11）

> 搬迁注记：本档自 CLI 仓 `thincoder/docs/batches/2026-09-11-VSC-MIRROR-SWEEP.md` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = eadf4d369a6d · 源提交 = 167f48f）。

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-11 · 来源 = 用户 16:45「都一起做了」+ VSC 未做项普查（explore #148——48 项/4 群）。

---

## §1 讨论（主 agent）

### 一、范围（群 A = 「CLI 已修/已裁、VSC 未接」同源镜像 10 项）

| # | 条目 | 来源指针 |
|---|---|---|
| A1 | VSC 请求链 600s 绝对墙钟残留（CLI 已废；VSC 唯一生产点 `provider.mjs:28/:324/:327` 实测仍在） | `batches/2026-09-11-ABORT-PROVENANCE.md:91` |
| A2 | VSC `shell` 字段无 `~` 家目录展开（`setup.mjs:232` → `shell.mjs:233` 裸透传） | `batches/2026-09-11-HOME-EXPANSION.md:131` |
| A3 | VSC `src/**` 旧锚 `§24` 残留（38 处 / 13 档——CLI 批 22 已清单端） | `TODO.md:165` + `batches/2026-09-11-DOC-HYGIENE.md:102` |
| A4 | VSC 提示词「§21」前缀残留 4 行（dn:98/:107 + de:161/:169） | `batches/2026-09-11-NORMAL-MODE-AUDIT.md:246` |
| A5 | VSC `discipline-engineering.md:213` R24 死指针（指向已退役 METHODOLOGY.md）——**已由批次二（`PORTABILITY-VSC-MIRROR` D4）承接设计——本批实施时跳过，防双改** | `batches/2026-09-11-ROLE-REDEFINITION.md:72` |
| A6 | VSC sync 记账面缺 `_advisorRefusals`（CLI 第 13 批已裁） | VSC `ADVISOR-CONVERGENCE.md:889` |
| A7 | VSC D5 下界定义句未同步（`discipline-engineering.md:110` 双源 + ENGINEERING-MODE） | VSC `ADVISOR-CONVERGENCE.md:886` |
| A8 | VSC `check-doc-width` 脚本镜像（表格行豁免 C 语义——可一句话翻转） | `batches/2026-09-11-MECH-DEBT-SWEEP.md:135` |
| A9 | VSC git commit 双层混扫镜像缺口（CLI `--only` 已修；VSC 仍 granular add + add -A） | `TODO.md:167` |
| A10 | **VSC 输入历史 / 多行编辑行为**（↑↓ 与历史回放的边界——用户 17:04 裁定；见下「A10 目标语义」） | `batches/2026-09-11-ARROW-EDITING.md:92` + webview `input.js:86-96` |
| A11 | VSC 子代理 spec 描述两行镜像（status/escalate——与 CLI 差异） | `batches/2026-09-11-TUI-SELECTION.md:96` + VSC `setup.mjs:85-86` |
| A12 | IMAGE-DOWNGRADE 跟进 ③：降级窗内 Stop（⏹）无动作——**用户裁定「修」**（② maxTurns 固定 10 观察） | `TODO.md:166` + `src/extension/image-handler.mjs:65` |
| A13 | 竞品分析 ②：Plan/Subagent/Goal 三面板说明句（新用户可理解）——**用户裁定「做」**（① 控制栏精简暂缓） | `COMPETITIVE_ANALYSIS.md:272-273` |

> A11–A13 = 用户 2026-09-11 17:08 裁定加入（非镜像类——「VSC 收口」扩展面；一并设计一并实施）。

**A10 目标语义（用户 2026-09-11 17:04 裁定——设计据此处展开）**：

1. **多行编辑与历史回放都必须可用、互不冲突**（「行首/行末」门 = 两者边界——用户原话：这才是只在行首行末能够回放历史的原因）；
2. **单行任意位置 ↑/↓ 触发历史**（用户点名希望——实现可行则做；做不到则维持现状）；
3. **历史导航连续性**：回忆后 ↑/↓ 须能继续导航（含 ↑ 上溯）——现门 `selectionStart === 0` 使上溯断裂；实现口径取「**`_historyIdx !== -1` 恒历史**」（= CLI 规则①；同时修 ↑↓ 双向——单纯把回忆后游标挪行首会使 ↓ 失效，故不取该法）；
4. **不追对称**（用户原话：终端和 web 本来就不可能完全一样）——多行段保留浏览器原生竖移；CLI 契约（批 31）**零改**；
5. **IME 守卫**（`isComposing` / 229）与**测试档**（该项现零覆盖）随修——测试为该批必交项。

### 二、边界

- **不含**可移植性 A 家族（另批：`PORTABILITY-VSC-MIRROR`）；**不含**评审链/异步残留（另批：群 B）；**不含**待裁项（#6/#42 等）；
- 双端镜像纪律：各端独立实现、语义同源；禁以任一端产物回改另一端；各条语义以**本端（VSC）原文为准**，CLI 侧只作同源参照。

### 三、状态

**讨论收敛 2026-09-11 16:50**。下一步 = §2 批次任务（eng-designer）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——9 条逐项现场勘察完毕；设计已落 VSC 设计档 8 处 + 1 doc 行预修；**含 3 项重叠/范围申报**——见文末「呈请裁定 / 申报」）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**设计权威落档位置（已落——coder 零碰）**：

- A1 → `docs/design/PROVIDER.md` §4.2（改写）+ **§4.3**（契约 / T-MA1 / AC-MA1）；
- A2 → `docs/design/SETTINGS.md` **§2.7**（T-MA2 / AC-MA2）；
- A3 → `docs/design/AGENT-LOOP.md` **§13**（41 处逐行映射表 / T-MA3 / AC-MA3）；
- A4 / A5 → `docs/design/VSC-PROMPTS.md`「指针卫生」节（A4 = 逐字表 + T-MA4/AC-MA4；A5 = 归属登记）；
- A6 / A7 → `docs/design/ADVISOR-CONVERGENCE.md` **§16**（+ §14.11 #1/#2 原位收口注）；A7 机制档落点 `docs/design/ENGINEERING-MODE.md` §6 bullet（已落）；
- A8 → `docs/design/README.md` 规则 6（表格行豁免句 + 检查器契约附则）；
- A9 → `docs/design/TOOLS.md` **§11**（T-MA9 / AC-MA9）。

### 一、逐条覆盖表（批次条目 = 设计回指条目；本批无需求档新增——9 条皆为「同源镜像/文档卫生」类，来源 = 各端登记项）

| # | 条目 | 本批内容 | 设计档（VSC） | 来源指针 |
|---|---|---|---|---|
| A1 | 请求链 600s 绝对墙钟残留 | 去绝对墙钟（`signal: signal ?? undefined`）+ 头相位保留 + 四 transport 读侧 idle 120s 补齐 | `PROVIDER（VSC 仓）§4.3`（+§4.2） | `batches/2026-09-11-ABORT-PROVENANCE.md:91` |
| A2 | `shell` 字段 `~` 无展开 | 新 `src/expand-home.mjs` + 读取点归一（`setup.mjs:232`） | `SETTINGS（VSC 仓）§2.7` | `batches/2026-09-11-HOME-EXPANSION.md:131` |
| A3 | `src/**` 旧锚 `§24` 残留 | `§24`→`§5`/`§9` 逐行重锚（13 档 39 行/40 处）+ 2 行去死指针 + doc 1 行（已落） | `AGENT-LOOP（VSC 仓）§13` | `TODO.md:165` + DOC-HYGIENE.md:102 |
| A4 | 提示词 `§21` 前缀残留 | 6 行逐字删前缀（4 src + 2 zh 镜像——申报③） | VSC-PROMPTS.md 指针卫生节 | `batches/2026-09-11-NORMAL-MODE-AUDIT.md:246` |
| A5 | R24 死指针 | **重叠——PORTABILITY 批承接（本批零改）+ 归属登记** | VSC-PROMPTS.md（登记行） | `batches/2026-09-11-ROLE-REDEFINITION.md:72` |
| A6 | sync 记账面缺 `_advisorRefused` | 六类拒绝点登记 + 记账消费 + `buildCapMessage` 单源 | `ADVISOR-CONVERGENCE（VSC 仓）§16.1` | VSC `ADVISOR-CONVERGENCE.md:889` |
| A7 | D5 下界定义句未同步 | 三落点（双源 D5 行 + ENGINEERING-MODE §6——机制档已落） | `ADVISOR-CONVERGENCE（VSC 仓）§16.2` | VSC `ADVISOR-CONVERGENCE.md:886` |
| A8 | check-doc-width 脚本镜像 | 表格行豁免谓词 + 主流程扫描单源 + 规则 6 句 | docs/design/README.md 规则 6 | `batches/2026-09-11-MECH-DEBT-SWEEP.md:135` |
| A9 | git commit 双层混扫 | `commit --only` 镜像 + 空 path 明确错误 | `TOOLS（VSC 仓）§11` | `TODO.md:167` |

### 二、受影响文件全清单（行数口径 = 读档 `N lines total`；as-of 2026-09-11 批前实测）

**实施域（coder——VSC 仓；22 项 = 16 改 + 4 新测档 + 1 登记 + 1 测试扩展）**：

| # | 文件 | 行数 | 预计增量 | 改动 | 条目 |
|---|---|---|---|---|---|
| 1 | `src/provider.mjs` | 433 | 净 ~−4 | :23-28 注释改写 / :324 去合成 / :31 `_anySignal` 删除 | A1 |
| 2 | `src/provider/transports/openai.mjs` | 309 | +~10 | 读循环 idle 120s | A1 |
| 3 | `src/provider/transports/anthropic.mjs` | 215 | +~10 | 同上 | A1 |
| 4 | `src/provider/transports/google.mjs` | 231 | +~10 | 同上 | A1 |
| 5 | `src/provider/transports/responses.mjs` | 385 | +~10 | 同上（reader 循环） | A1 |
| 6 | `src/agent/setup.mjs` | 463 | +2 | :232 归一（import + expandHome）+ :218/:240 重锚（0 净） | A2 / A3 |
| 7 | `src/expand-home.mjs` | 新 | ~+30 | 展开器（纯函数 + home 注入缝） | A2 |
| 8 | `src/agent-tools/advisor.mjs` | 325 | +~10 | 拒绝点置位 + cap 预检 + import；:25/:93/:183/:193/:197/:234 重锚 | A6 / A3 |
| 9 | `src/agent/execute-tools.mjs` | 483 | ±5 | ctx 提升 + 记账消费；:19/:261/:425/:443 重锚/去死指针 | A6 / A3 |
| 10 | `src/advisor/run.mjs` | 242 | +~4 | `buildCapMessage` 抽取导出（输出逐字零变）；:96/:118/:202 重锚 | A6 / A3 |
| 11 | `src/tools/git.mjs` | 392 | +~8 | commit `--only` + 描述行 | A9 |
| 12 | `scripts/check-doc-width.mjs` | 297 | ±5（**贴线 300——终态 ≤300 承诺**） | 豁免谓词 + 主流程单源 | A8 |
| 13 | `src/prompts/discipline-normal.md` | 169 | 0 | :98/:107 删 `§21 ` 前缀 | A4 |
| 14 | `src/prompts/discipline-engineering.md` | 222 | 0 | :161/:169 删前缀 + :110 D5 行尾追加 | A4 / A7 |
| 15 | `docs/design/prompts/discipline-normal.md` | 183 | 0 | :128/:136 删 `§21 ` 前缀（zh 权威） | A4 |
| 16 | `docs/design/prompts/discipline-engineering.md` | 150 | 0 | :84 D5 行尾追加（zh 权威） | A7 |
| 17 | `test/files.mjs` | 63 | +4 | 四新档登记（不登记不跑） | 批级 |
| 18 | `test/provider-timeout-semantics.test.mjs` | 新 | ~+120 | T-MA1-1–5 | A1 |
| 19 | `test/expand-home.test.mjs` | 新 | ~+80 | T-MA2-1–5 | A2 |
| 20 | `test/advisor-refusal-accounting.test.mjs` | 新 | ~+140 | T-MA6-1–9 | A6 |
| 21 | `test/git-commit-pathspec.test.mjs` | 新 | ~+100 | T-MA9-1–5（slow 归册） | A9 |
| 22 | `test/doc-consistency.test.mjs` | 174 | +~30 | T-MA8-1–2（豁免谓词 + 单源扫描） | A8 |

**A3 独立触面补充**（与上表 1/6/8/9/10 并档之外的 9 档——注释文本重锚，均 0 净行）：
`src/advisor/main.mjs`（319——7 处）· `src/advisor/messages.mjs`（296——3 处）· `src/agent/run-stages.mjs`（304——3 处）· `src/agent-tools/subagent-async.mjs`（**499——贴硬顶 ≤500：本批 0 净行，禁任何行数增量**——:314/:480 重锚）·
`src/agent-tools/subagent-escalate-async.mjs`（221——1 处）· `src/agent-tools/subagent-escalate.mjs`（219——1 处）· `src/agent.mjs`（366——2 处）· `src/extension/panel-messages.mjs`（468——1 处）· `src/extension/suspension.mjs`（363——4 处）。逐行键控以设计档 §13（b）映射表为准（as-of 行号——动手前 grep 重扫）。

**文档域（设计者已落——coder 零碰；行数 = 批前 → 批后实测）**：

| 文件 | 批前 → 批后 | 落点 |
|---|---|---|
| `docs/design/PROVIDER.md` | 403 → 463 | §4.3 + §4.2 改写 + 变更记录 |
| `docs/design/SETTINGS.md` | 130 → 177 | §2.7 + 变更记录 |
| `docs/design/AGENT-LOOP.md` | 731 → 817 | §13 + 变更记录 |
| `docs/design/VSC-PROMPTS.md` | 60 → 92 | 指针卫生节 + 变更记录 |
| `docs/design/ADVISOR-CONVERGENCE.md` | 1185 → 1291 | §16 + §14.11 收口注 + 变更记录 |
| `docs/design/ENGINEERING-MODE.md` | 211 → 217 | §6 bullet + 变更记录 |
| `docs/design/TOOLS.md` | 226 → 268 | §11 + 变更记录 |
| `docs/design/README.md` | 126 → 130 | 规则 6 + 变更记录 |
| `docs/design/ENG-TOKEN-BINDING-TUNING.md` | 115 → 115 | :80 重锚（0 净） |

**不入 files**：`docs/TODO.md` / `CHANGELOG.md`（父侧写域）；CLI 仓一切文件（本批 VSC 单端——`git status` 判据）。

### 三、验收标准（逐条——每条可机器验证；判据全文在设计档各节，不重抄）

- **AC-MA1-1..3**（A1）= T-MA1-1–5 绿（信号=用户信号 / 头相位 600s / idle 判死+零误杀成对 / 源文本 `AbortSignal.timeout(FETCH_TIMEOUT_MS)` 零命中）；
- **AC-MA2-1..2**（A2）= T-MA2-1–5 绿；`grep -rn 'startsWith("~")' src` == 1 命中（展开器单点）；`shell.mjs` 零改；
- **AC-MA3-1..3**（A3）= VSC 全仓 `§24` 零命中；41 处逐行落位（域 A 5 / A′ 1 / B 33 / C 2）；反证可复现；计数对表（D3）；
- **AC-MA4**（A4）= 6 行逐字替换；VSC 全仓 `§21` 零命中；prompts 测试族全绿；
- **AC-MA6-1..3**（A6）= 六类拒绝零记账 + 对照零回归 + builder 单源（T-MA6-1–9）；既有 guard 族全绿；
- **AC-MA7-1..3**（A7）= 双源 + ENGINEERING-MODE 固定子串在位；宽度零新增；锚族零回归（T-MA7-1–4）；
- **AC-MA8-1..2**（A8）= T-MA8-1–2 绿（>300 表格行不报 / 非表格照报；主流程零内联扫描）；规则 6 子串在位；
- **AC-MA9-1..3**（A9）= T-MA9-1–5 绿（真 git——slow 归册）；空 path 明确错误零副作用；无 path 全量零回归；
- **批级机检** = 两仓 `check-doc-width` 新增违规 0 + 新增超宽 0（**VSC 实跑基线（设计期）**：宽度 69 文件零超宽 / 一致性新增 0 · 存量 29——须不劣化）；VSC `npm test` 快层全绿；`node scripts/check-syntax.mjs` 全绿；CLI 仓零改动（`git status --porcelain -- src test` 空）。

### 四、用例（三态——正常 / 边界 / 错误）

T-MA1-1–5（A1）· T-MA2-1–5（A2）· T-MA3-1–4（A3）· T-MA4-1–3（A4）· T-MA6-1–9（A6）· T-MA7-1–4（A7）· T-MA8-1–2（A8）· T-MA9-1–5（A9）——**共 37 例**；输入/预期全文在设计档各节（PROVIDER §4.3 / SETTINGS §2.7 / AGENT-LOOP §13 / VSC-PROMPTS 指针卫生 / ADVISOR-CONVERGENCE §16 / README 规则 6 / TOOLS §11）。

### 五、明确不在本批（不扩面）

- **群 B**（VSC 评审链/异步残留 B1–B5——另批 `2026-09-11-VSC-REVIEW-ASYNC-SWEEP`：池中止孤儿 / 结算面 launchRefused / 合入面盲区 / CJK 估算 / 注入预算）；
- **PORTABILITY-VSC-MIRROR**（A 家族镜像——另批；含 A5 的 R24 行 = 其 VP-7 附项）；
- VSC 镜像**标注/合成面**（abort provenance 的 `entry.error` 死亡行合成族——后续批）；
- `§24` 同族旧锚全清（`§15`/`§18`/`§19.x`/`§20`、prompts 内 `§11.1 R14`/`§18 D-E1a`/`§28 R26`——同族观察，另批勘察）；
- CLI 仓一切（含 CLI E-6 #1 的 CLI 两镜像——CLI 侧另批）；`docs/TODO.md` / CHANGELOG / 需求池（父侧）。

### 六、纪律与边界（coder 须知）

- **D5 检查（设计期已跑——无阻断）**：本批 9 目标档无在途评审冻结——在飞邻批 PORTABILITY / 群 B 均在 §2 阶段（无 §3 评审在途）；PORTABILITY §2 红线② 明示不碰 VSC `ENGINEERING-MODE.md` / `ADVISOR-CONVERGENCE.md`；
- **文件重叠申报（调度用）**：① 与 PORTABILITY-VSC-MIRROR 同触 `src/prompts/discipline-engineering.md`（本批编辑点 :110/:161/:169；PORTABILITY :45/:60/:74/:172/:178/:182/:213/:216）与 `docs/design/prompts/discipline-engineering.md`（本批 :84；PORTABILITY :37/:126/:132/:136/:142-143）
  ——两批 coder 须**串行**（files 重叠自动排队）或父侧合流；
  ② 与群 B 同触 `ADVISOR-CONVERGENCE.md`（本批 §16/§14.11 注；群 B 承接 #4/#5）与 `AGENT-LOOP.md`（本批 §13；群 B B1 §12.8）——节域不相交，写入串行避让；
- **提示词 = 主 agent 内容权 + coder 机械落笔**：A4/A7 的提示词文本照设计档逐字（不得自行润色）；zh 权威 ↔ en 落地两侧各落各笔（不 byte 对齐）；
- **A3 替换纪律**：逐处替换（禁批量 sed/脚本一把梭）；`subagent-async.mjs` 499 行贴硬顶——本批 0 净行；替换仅改锚文本，其余逐字不动；
- 不 commit（改动留工作区）；凭证不落档；越出声明写域 → 停下报告；**回读核实（D6）** + 行数对表入 §5。

### 七、呈请裁定 / 申报（父侧 3 项）

1. **A5 归属重叠**：已由在飞批 PORTABILITY-VSC-MIRROR（VP-7 附项——设计档 VSC `PORTABILITY.md` §1.4/§4.4/§2 D4 已逐字定稿）承接——**建议维持**（本批零改，防双写；本批仅登记回指）；若父侧要本批回收，请明示（需与 PORTABILITY 去重协调）；
2. **A1 范围申报**：设计纳入「四 transport 读侧 idle 120s 补齐」（理由 = 去绝对墙钟后直连静默流无显式守卫；CLI 对位面 = `sse.mjs`/`google.mjs` 同 120s 语义）——超 §1 字面最小面（`:324`/`:327`）一步；如父侧认为超面，可剪为「仅去 :324 + 注释/文档」（剪后直连仅余 undici 隐式默认——不推荐）；
3. **A4 范围 +2 行申报**：勘察新发现 zh 镜像 `docs/design/prompts/discipline-normal.md:128/:136` 同款 `§21 ` 残留（§1 只列 src 4 行）——纳入同修（同族、代价 0）；如父侧要求严格照 §1 字面，可剪 2 行。

**就绪待评审**（发起权在用户/父侧）。

### 增补轮批次任务（A10–A13 + A5 改判）——eng-designer（2026-09-11 增补）

> 前轮 A1–A9 设计不重做（必要处仅回指）。本轮 = 用户 17:04 裁定 A10（输入历史/多行编辑）+ 17:08 裁定 A11–A13 + 父侧增补（R24 死指针纳入——A5 改判）。
> **设计权威落档 4 处（已落——coder 零碰）**：A10 + A13 → `docs/design/WEBVIEW.md` **§11**（§11.1 / §11.2；变更记录顺延 §12）· A11 → `docs/design/AGENT-LOOP.md` **§14** + §8 两处就地同步 · A12 → `docs/design/IMAGE-DOWNGRADE-VISION.md` **「跟进修复」节** · A5′ → `docs/design/VSC-PROMPTS.md` **A5 节改判**。

#### 一、逐条覆盖表（批次条目 = 设计回指条目；本批无需求档新增——用户裁定/竞品登记/指针卫生类，来源 = §1 及增补）

| # | 条目 | 本批内容 | 设计档（VSC） | 来源指针 |
|---|---|---|---|---|
| A10 | VSC 输入历史 / 多行编辑 | ↑/↓ 契约 C-MA10-1..6（历史态恒历史 + 单行任意位置 + 多行边界门 + IME 守卫）+ 测试档（新——必交） | `WEBVIEW（VSC 仓）§11.1` | §1 A10 语义五条（用户 17:04） |
| A11 | 子代理 spec 描述两行 | 受限通道动作清单同步（6 动作——VSC 无 panel）+ 逐字片段表 | `AGENT-LOOP（VSC 仓）§14 + §8` | `2026-09-11-TUI-SELECTION.md:96` |
| A12 | 降级窗内 Stop 无动作 | 修复契约 C-MA12-1..6（定向 abort + 启动即中止）+ ② maxTurns 观察登记 | IMAGE-DOWNGRADE-VISION.md 跟进节 | `docs/TODO.md:166`（用户 17:08 裁定） |
| A13 | 三面板说明句 | 现状核对（Task/Goal 已在——登记）+ Subagent 首块 `.sub-desc`（新） | `WEBVIEW（VSC 仓）§11.2` | `COMPETITIVE_ANALYSIS.md:272-273`（用户 17:08 裁定） |
| A5′ | R24 死指针（增补） | 纳入本批修复（EN 对齐本端 CN 现形态——仅句尾一句替换） | VSC-PROMPTS.md A5 节 | 父侧增补（评审 #157 发现） |

#### 二、受影响文件全清单（实施域 = coder——VSC 仓；行数口径 = `split("\n").length` 含末行；as-of 2026-09-11 实测）

| # | 文件 | 行数 | 预计增量 | 改动 | 条目 |
|---|---|---|---|---|---|
| 1 | `webview/input.js` | 146 | +6 ± 3 | ↑/↓ 分支合流（判定顺序 + IME 守卫） | A10 |
| 2 | `test/webview-input-history.test.mjs` | 新 | +110 ± 30 | T-MA10-1..8 | A10 |
| 3 | `test/files.mjs` | 62 | +1 | 新档登记（不登记不跑） | A10 |
| 4 | `src/agent/setup.mjs` | 463 | ±2（零净行） | :85/:86 两行 description 片段替换（逐字见 §14(a)） | A11 |
| 5 | `src/extension/panel-messages.mjs` | 468 | +10 ± 4 | 窗 controller 上挂/清理 + abort case 分支 + `_chat` 后置闩 | A12 |
| 6 | `src/extension/image-handler.mjs` | 81 | +7 ± 3 | `runVisionReader` signal 参数 + 桥接 | A12 |
| 7 | `test/image-downgrade.test.mjs` | 158 | +45 ± 15 | T-MA12-1..3 | A12 |
| 8 | `webview/activity.js` | 298 | +8 ± 3 | `buildBlock` 首块说明行（298→≤306 越 300 软线——≤500 硬限内不拆） | A13 |
| 9 | `webview/chat.css` | 470 | +5 ± 2 | `.sub-desc` 规则 | A13 |
| 10 | `webview/state.js` | 122 | +1 | `S._subDescShown` 字段声明 | A13 |
| 11 | `locales/en.json` | 247 | +1 | `sub.desc` | A13 |
| 12 | `locales/zh.json` | 247 | +1 | `sub.desc` | A13 |
| 13 | `test/activity-flow.test.mjs` | 292 | +18 ± 6 | T-MA13-1..3（292→~310 同带——不拆） | A13 |
| 14 | `src/prompts/discipline-engineering.md` | 222 | 0（零净行） | :213 句尾一句替换（逐字 = 本端 CN 现形态） | A5′ |

**文档域（设计者已落——coder 零碰）**：`docs/design/WEBVIEW.md` 891→1029（§11 + 变更记录顺延 §12）· `docs/design/AGENT-LOOP.md` 817→860（§8 两处 + §14 + 变更记录行）· `docs/design/IMAGE-DOWNGRADE-VISION.md` 79→130（跟进节 + 变更记录行）· `docs/design/VSC-PROMPTS.md` 92→111（A5 节改判 + 变更记录行）。

**不入 files**：`docs/TODO.md` / `CHANGELOG.md`（父侧写域）；CLI 仓一切文件。

#### 三、验收标准（逐条——可机验；判据全文在设计档各节）

- **AC-MA10-1..7**（A10）= `WEBVIEW（VSC 仓）§11.1.6`：T-MA10-1..8 绿（连续上溯 / ↓ 回落 / 单行中段 / 多行不劫持零 preventDefault / IME 两分支 / 下拉让位 / 边界门）；Enter 面零回归（`webview-input-enter` 族绿）；新档在册 + 宽度新增 0；
- **AC-MA11-1..2**（A11）= `AGENT-LOOP（VSC 仓）§14(c)`：grep `no action parameter` 恰 2 处 + 6 动作名全含 + 旧串 `no action:'status'/'escalate'` 零命中；快层绿；
- **AC-MA12-1..3**（A12）= IMAGE-DOWNGRADE-VISION.md 跟进节：T-MA12-1（abort 命中 + `_chat` 被调 + 闩落位）/ T-MA12-2（无窗零回归）/ T-MA12-3（缝兼容）；既有 image-downgrade 全族零回归；
- **AC-MA13-1..3**（A13）= `WEBVIEW（VSC 仓）§11.2.5`：T-MA13-1（首块 `.sub-desc` + 一次性）/ T-MA13-2（resetActivity 后不重复）/ T-MA13-3（Task/Goal 说明句回归 + locale 双键）；
- **AC-MA5-1**（A5′）= VSC-PROMPTS.md A5 节：旧串 `见 \`docs/design/METHODOLOGY.md\` R24 节` 零命中 + 新句 `代码结构判据节` 恰 1 处（含 `（CLI 侧）`）+ EN/CN 两档该行同文 + prompts 锚族全绿；
- **批级机检** = VSC 快层全绿；`node scripts/check-doc-width.mjs` 本批 14 项源/测试档 + 4 设计档新增超宽 0（**设计期实测**：设计落档后本批四档零超宽——AGENT-LOOP.md 一处表格长行已就地修正为列表式；当前唯一超宽 = `TESTING.md:80`（350 字符——**他批在写观察值**，非本批写域，披露））；CLI 仓零改动（`git status --porcelain -- src test` 空）。

#### 四、用例（三态——机跑；输入/预期全文在设计档各节）

T-MA10-1..8 · T-MA11-1..3 · T-MA12-1..3 · T-MA13-1..3 · T-MA5-1..3（已撤——归 PORTABILITY-VSC-MIRROR 承接，不计）——**共 17 例**。

#### 五、明确不在本批（不扩面）

- 折行（软换行）单行文本的视觉竖移（A10 边界——另案）；历史态编辑丢弃（覆盖式 `_draft`——CLI 批 31 同族既有行为）；
- 降级窗内 Ctrl+I（interrupt）面（A12 边界——同族观察）；maxTurns 伸缩改（A12 ②——观察登记）；
- Task / Goal 面板改动（A13——已有说明句，只回归锁）；
- A1–A9 前轮设计面；PORTABILITY / 群 B 批面；`§24` 同族旧锚全清；CLI 仓一切；`docs/TODO.md` / CHANGELOG（父侧）。

#### 六、纪律与边界（coder 须知 + 父侧事项）

- **D5 检查（设计期已跑——无阻断）**：本增补轮四个目标档（WEBVIEW / AGENT-LOOP / IMAGE-DOWNGRADE-VISION / VSC-PROMPTS）无在途评审冻结——PORTABILITY 批评审已 settle（修正轮完成）、群 B 批处 §2 阶段、本批 §3 尚无评审轮次记录；**并行写者观察**：设计期间 `TESTING.md:80` 出现超宽行（非本批写域——如实披露，供父侧核查）。
- **文内重叠申报（增补新增面）**：① A5′ 与 PORTABILITY-VSC-MIRROR 设计档 §4.4(a):271 / T-V18 同行同动作重叠——**本批（增补后）承接该行**；请父侧协调 PORTABILITY 批撤下其 `:213` 编辑点（防双写）或另裁——**二选一呈请**；
  ② 本增补轮与 A1–A9 实施面同档新增：`src/agent/setup.mjs`（A11 :85/:86，与 A2 同档）、`webview/activity.js`+locales（A13——A1–A9 未触）；
  ③ `src/prompts/discipline-engineering.md` 本批编辑点 :110/:161/:169（A4/A7）+ :213（A5′）——与 PORTABILITY 批同档（其 :45/:60/:74/:172/:178/:182/:216）——coder 串行或父侧合流（files 重叠自动排队）。
- **逐字纪律**：A11 两行 / A5′ 句尾 / A13 的 en/zh 文案——照设计档逐字（不得润色）；A10 为门限重构（语义按契约 C-MA10-1..6）；A12 为接线（照 C-MA12-1..6）。
- **替换纪律**：逐处替换（禁批量 sed）；`:213` 只动句尾一句（节结构零动——R24a 编号引用零波及）。
- 不 commit（改动留工作区）；凭证不落档；越出声明写域 → 停下报告；**回读核实（D6）** + 行数对表入 §5。
- **呈请裁定（父侧）**：A5′ 去重二选一（本批承接 / PORTABILITY 承接——本批默认承接）；其余无待裁。

### 修正轮（2026-09-11——设计评审轮次 1 后；8 条全修——🟡 2 + 🔵 6；零新语义；本追加与上文冲突处，以本追加为准）

**背景**：设计评审轮次 1 VERDICT = pass（🔴 0 · 🟡 2 · 🔵 6——发现表见 §3 轮次 1）；父侧裁决 8 条全修。本轮只改文档（设计档 + 本档），`src/**` 零改动、零提示词落笔、未发起评审、未 commit。

**落点表（发现 → 落修——设计档行号 as-of 修正轮落修后 2026-09-11）**：

| # | 发现 | 落点（设计档——VSC 仓） |
|---|---|---|
| 1 | 🟡 AC-MA4 机检模式/域未冻结 | `docs/design/VSC-PROMPTS.md:75`（AC-MA4 = `§21 ` 含尾空格 + 域 src/test）+ `:77`（T-MA4-2 同步）+ `:79-81`（同族观察边界登记——新增行）；本档操作面见 ① |
| 2 | 🟡 A5′ 待撤协调 | 同档 `:85-88`（A5 节顶注再改判——归 PORTABILITY-VSC-MIRROR 承接）+ `:112-113`（修正轮注——漂移补记）；本档见 ② |
| 3 | 🔵 A6 契约 #6 措辞 | `docs/design/ADVISOR-CONVERGENCE.md:1191`（位置 = async 分支之后、sync 启动之前——sync-only）+ `:1208`（T-MA6-8 async 对照——新增） |
| 4 | 🔵 A6 AC 六类覆盖 | 同档 `:1209`（T-MA6-9 类 #1——新增）+ `:1213`（AC-MA6-1 覆盖闭口）+ `:1261`（计数 11→13） |
| 5 | 🔵 A10 单行中段 ↓ 用例缺 | `docs/design/WEBVIEW.md:907`（T-MA10-8——新增）+ `:893` / `:896`（用例集 1..8）+ `:918`（AC-MA10-2 回指） |
| 6 | 🔵 A13 tailLines 射程核 | 同档 `:973-975`（核验注——射程 = `.advisor-content` 子元素；`.sub-desc` 不在内，tail-3 不受扰） |
| 7 | 🔵 files.mjs 数值漂移 | 同档 `:894`（统一 63）+ 本档见 ③ |
| 8 | 🔵 14→15 文件 | `docs/design/VSC-PROMPTS.md:3`（`src/prompts/` 实测 15 档）；三档变更记录已随更 |

**§2 操作面更正（任务书增量——coder 以本追加为准）**：

① **AC-MA4 冻结**（§2 首轮表 AC 行与 :72 条目行，以本追加为准）：机检模式 = `§21 `（含尾空格）+ 域 = `src` / `test`——「VSC 全仓」口径作废。
同族观察（另批处置，本批零动）：`§21.1` 残余 = `src/agent-tools/subagent-scheduler.mjs` 10 处（:10 / :206 / :230 / :245 / :256 / :257 / :293 / :310 / :311 / :313）+ `src/agent-tools/subagent-actions.mjs:161`；记史面 `CHANGELOG.md:37/:43/:44`（域外）。

② **A5′ 撤出**（§2 增补表 :179 / :198 / :210 / :215 / :231 各处，以本追加为准，不删史）：归 PORTABILITY-VSC-MIRROR 承接（其批 §4 已批准、实施在途）——**本批零动**：`src/prompts/discipline-engineering.md` 该句不碰（本批同档编辑点仍 = :110 / :161 / :169——A4/A7）；T-MA5-1..3 不计本批验收。
行号漂移补记（修正轮实测）：目标句现落 :217（CN 侧 `docs/design/prompts/discipline-engineering.md:142`）——字符串键控为准，承接批动手前重扫。

③ **`test/files.mjs` 口径统一**（:101 与 :187，以本追加为准）：复核实测 = **63**——读档回读「63 lines total」+ `split("\n").length` = 63（两声明口径同数）；:187 的 62 = 内容行计数口径（尾换行不计——与全表其余行口径不符，不采用）。设计档 `docs/design/WEBVIEW.md:894` 已统一 63。

④ **用例计数重算**（D3）：首轮表 35 → **37**（A6 +2：T-MA6-8 / T-MA6-9）；增补轮 19 → **17**（A5′ −3：T-MA5-1..3 归承接批；A10 +1：T-MA10-8）——两轮合计 54 不变。

⑤ **并行写者观察（复核附记——供父侧核查）**：`src/prompts/discipline-engineering.md` 现测 226 行（两表记 222）· `docs/design/prompts/discipline-engineering.md` 现测 153 行（表记 150）——两档 mtime 17:34-17:36 另有落笔痕迹（非本批写域，本批零动）；:161 / :169 目标行仍原位。
  设计档修正后行数（as-of 2026-09-11 18:18 现读复测——含并行链落笔）：VSC-PROMPTS.md 124 · ADVISOR-CONVERGENCE.md 1426（群 A/群 B 双批共写）· WEBVIEW.md 1257（活动区回归批共写）。

⑥ **CLI 侧 lint 对照（修正轮实跑——供父侧）**：`thincoder` 仓 `check-doc-width` 现报本档 5 行超宽（:108 · :153 · :227——§2 文本；:241 · :254——§3 文本）与 V1 引用 6 条（§2 覆盖表裸形跨仓 `X.md §N` 引用）；均非修正轮新增（追加前后逐项对照一致）。处置（回改 / 入基线）由父侧定。

**自检**：8 条落点设计档回读核验全部在位；VSC `node scripts/check-doc-width.mjs` 实跑——宽度 0 超宽（69 文件）· 一致性新增违规 0（存量 26）；零代码 · 零提示词落笔 · 未发起评审。

**折行说明（lint 微修轮 2026-09-11）**：:108→3 行 · :153→3 行 · :227→3 行（行号 = 折行前 as-of）——纯折行：文字零增删、语义不变（断点取既有 `；`/`·`/`——` 边界；列表续行 2 空格缩进）；其后行号按折行点累计（:108 后 +2 · :153 后 +4 · :227 后 +6）。另：6 条裸跨仓引用已按 `docs/README.md` 3.7 节归一为「名称（VSC 仓）§N」形态（去 `.md` 后缀 + 仓别注记）。

**跨仓引用归一补全 + 政策注（轮次 2 残项微修 · 2026-09-11）**：同形裸跨仓引用另 6 处（:71 · :74 · :75 · :77 · :180 · :211）已按 `docs/README.md` 3.7 节归一为「名称（VSC 仓）§N」；无 `.md` 节名族（:72 · :73 · :142 尾注 · :181 · :183 · :212 · :214）**维持原样**（非 §N 归一形态、V1 域外——避免半程反复）。另：:268 现读复测注更新后折行为 2 行（句界断点、仅增换行；:268 后 +1）。

## §3 设计评审（评审子代理）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

### 设计评审结论（群 A·VSC 同源镜像收口 A1–A13）

核验口径：全部关键 file:line 锚（A3 39 行 src 重锚点 / A4 6 行 §21 行 / A5′ R24 行 / A1 provider.mjs:28/:31/:324/:327 /
  A6 advisor.mjs:197/:213/:223/:240 + execute-tools.mjs:447-457 + run.mjs:120-135/:153 / A9 git.mjs:200-219 /
  A10 input.js:88-89/:92-93/:142 / A11 setup.mjs:71/:85-86 / A12 panel-messages.mjs:80-89/:201-222 + panel-chat.mjs:55-64/:129
  + image-handler.mjs:64-65/:77 / A13 activity-view.js:83-108）逐条磁盘实测核对——绝大多数与设计一致；下述为偏差项。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / AC 可机验（A4） | 🟡 | AC-MA4「VSC 全仓 `§21` 零命中」（`docs/design/VSC-PROMPTS.md:75`；批次档 §2:131）按字面不可达成：src 内现余 `§21.1` 11 行（`src/agent-tools/subagent-scheduler.mjs:10/:206/:230/:245/:256/:257/:293/:310/:311/:313` + `src/agent-tools/subagent-actions.mjs:161`），另 `CHANGELOG.md:37/:43/:44` 与 VSC-PROMPTS.md 自身引用；仅按「`§21 `（带空格）+ 代码域（src/test）」读法可达成（T-MA4-3 用的是带空格形态——`VSC-PROMPTS.md:77`）——grep 模式与域未冻结 | 冻结 grep 模式（含空格）与域（src/test）；比照 A3（e）边界（`AGENT-LOOP.md:818`）把 `§21.1` 残余登记为同族观察（另批）——否则机检必红 |
| 2 | Scope coordination（A5′） | 🟡 | 评审对象声明已裁定 A5′ 归 `PORTABILITY-VSC-MIRROR`，但本批 §2 增补仍列 A5′ 实施落点（批次档 :179/:198/:210/:215/:231「本批默认承接」+ `VSC-PROMPTS.md:79-101` A5 改判节）；`PORTABILITY.md:273` / T-V18 持同一 `:213` 编辑（双写风险） | 按声明标注为「待撤」并完成与 PORTABILITY 的去重（二选一由父侧落）——本行不重复计缺陷 |
| 3 | Clarity（A6） | 🔵 | 契约 #6「位置 = sync 分叉前」（`ADVISOR-CONVERGENCE.md:1191`）措辞有歧义；同谓词读全局 `_advisorRound`，而 async cap 按实例判定（同档 :118-119）——若被读成「async 分支之前」，全局轮次 ≥5 时会误拒 fresh async 评审 | 措辞定为「async 分支之后、sync 启动之前（sync-only）」并补一例 async 对照 |
| 4 | Acceptance（A6） | 🔵 | AC-MA6-1「六类拒绝」（同档 :1211）由 T-MA6-1–5 支撑——类 #1（depth>0 async 拒）无对应用例（属既有「通常跳过」路径） | 补一例，或把 AC 措辞改为 5 类 + 既有跳过行为 |
| 5 | Acceptance（A10） | 🔵 | C-MA10-3 的「单行 ↓ = 吞键 + no-op」（`WEBVIEW.md:869`）无对应用例：T-MA10-1..7（§11.1.5）未覆盖单行中段 ↓ | 补一断言（值不变 + preventDefault + 零载入） |
| 6 | Acceptance（A13） | 🔵（unverified） | C-MA13-1「说明行不被擦」已核 `refreshBlock` 只重挂 summary（`activity-view.js:83-108`）✓；但 `tailLines`（冻结/折叠 tail-3 行提取）对块内文本行的扫描射程未逐行核验（unverified）——若扫全块文本，`.sub-desc` 可能混入 tail-3 呈现，且 T-MA13-1..3 无 tail-3 断言 | 落地前核 `tailLines` 射程 + 用例补「tail-3 不受扰」断言 |
| 7 | Doc hygiene（数值漂移） | 🔵 | 同批两表对 `test/files.mjs` 现值不一致：63（批次档 :101，标「读档 `N lines total`」）vs 62（:187，标 `split("\n").length`）；磁盘读档实测 62 行——其一为口径错标 | 统一口径复核 +N 基线后定稿 |
| 8 | Doc hygiene（数值漂移） | 🔵 | `docs/design/VSC-PROMPTS.md:3` 仍写「src/prompts/ 新 14 文件」（同档 :107 写 15）；glob 实测 `src/prompts/` 与 `docs/design/prompts/` 各 15 档——第 5 批 14→15 后登记滞后 | 文档层顺手同步（非本批实施写域） |

已核验一致（不列缺陷）：A3 41 行映射表 39 处 src 锚逐行吻合；A4 6 行目标行吻合；A5′ 新句目标节实存（`docs/design/prompts/discipline-normal.md:49` + `src/prompts/discipline-normal.md:31-32` Code structure）；
A1/A2/A9/A10/A11/A12 契约锚全部吻合；受影响文件行数抽查（provider 433 / git 392 / input 146 / activity 298 / panel-messages 468 / image-handler 81 /
  advisor 325 / run 242 / execute-tools 483 / setup 463 / check-doc-width 297）全部对表。未逐项核验（标 unverified）：A9「slow 归册」落地机制（TESTING.md 不在本审范围）、
  `setup.mjs:232` / `shell.mjs:233` / `git.mjs:38` 三处单行锚、locales / state.js / chat.css / 测试档行数（未逐档开卷）。

**计数（D3）**：发现 8 项 = 🟡 2（AC 模式/域冻结 + A5′ 待撤协调）· 🔵 6（含 1 项 unverified）· 🔴 0。

VERDICT: pass

> 〔父侧代笔：折行——§3 轮次 1 的「核验口径」与「已核验一致」两条超宽行（原单行 422/534 字符）按空白归一逐字折行，零增删；父侧落笔打标（六段纪律父侧代笔规则）。〕

### 轮次 2（评审子代理）

**轮次 2 核验口径（单轮校验 8 件修正 + 1 件 lint 微修；锚点区间 ±10 行；批次档全档回读）**：逐件结论——① `VSC-PROMPTS.md:75`（AC-MA4 = `§21 ` 含尾空格 + 域 src/test）/ `:77`（T-MA4-2）/ `:79-81`（同族观察登记，10+1 处与批次档 ① 逐字同列）✓ ·
② `:85-88`（顶注再改判归 PORTABILITY 承接，本批零动）/ `:112-113`（修正轮注 + 行号漂移补记）✓ · ③ `ADVISOR-CONVERGENCE.md:1191`（async 分支之后、sync 启动之前——sync-only）/ `:1208`（T-MA6-8）✓ ·
④ `:1209`（T-MA6-9 类 #1）/ `:1213`（AC-MA6-1 六类闭口——与类清单 :1176-1181 逐一对上）/ `:1261`（13 = T-MA6-1–9 + T-MA7-1–4）✓ ·
⑤ `WEBVIEW.md:907`（T-MA10-8——回指 C-MA10-3，与 :875 契约一致）/ `:893` / `:896`（集 1..8）/ `:918`（AC-MA10-2 回指随更）✓ · ⑥ `:973-975`（tail-3 射程核验注——与 C-MA13-1 :949「details 直接子」一致）✓ ·
⑦ `:894`（63——WEBVIEW §11.1.4 / 变更记录 :1177 / 批次档 ③ 三处同数）✓ · ⑧ `VSC-PROMPTS.md:3`（15 文件）+ 三档变更记录已随更（VSC-PROMPTS:116 / ADVISOR:1424 / WEBVIEW:1177）✓ ·
⑨ 折行后表外超宽 0（实测仅 :291 表格行、豁免）+ `:274` 折行说明（+2/+4/+6 偏移与 :155-157、:231-233 落点对位）+ §3 父侧打标 `:309` ✓。**D3 对账**：35→37 / 19→17 / 合计 54 不变——算术与各档枚举吻合。域外未开卷（unverified）：`test/files.mjs`=63 绝对值 · `activity-view.js:68-78` tailLines 射程断言 · :217/:142 行号漂移值。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene（lint 残遗·跨仓引用形态） | 🟡 | ⑨「6 条归一」已核：6 处「（VSC 仓）§N」形态在场（批次档 :69/:70/:179/:182/:210/:213）——但同形裸跨仓 `X.md §N` 引用另有 6 处未归一：:71 `AGENT-LOOP.md §13` · :74 `ADVISOR-CONVERGENCE.md §16.1` · :75 `§16.2` · :77 `TOOLS.md §11` · :180 `AGENT-LOOP.md §14 + §8` · :211 `AGENT-LOOP.md §14(c)`；三 basename 与 CLI 本仓档同名（＝`docs/README.md` 3.7 点名的「以错档通过」类，V1 不报）；同块内 :210/:213 已归而 :211 未归 | 补归一（同 :69 形态）或显式入基线（§6 收口注）——勿停在半程；无 `.md` 裸名族（:72/:73/:142 尾注/:181/:183/:212/:214）可一并定策 |
| 2 | Doc hygiene（D3 数值） | 🔵 | ⑤ 记「ADVISOR-CONVERGENCE.md 修正后 1423 行」——本轮读档实测 1426（+3），其余两档 124 / 1227 吻合；该档群 A/群 B 双批共写（群 B 修正轮条目 :1425、§17 另有补笔）——漂移方向与并行写者相符（归因未定；⑤ 自标「供父侧核查」） | §6 收口重测一次或加注归属（若系他批落笔所致，注明即消解） |
| 3 | Doc hygiene（D3 用例枚举残留） | 🔵 | ④ 计数重算已落（35→37 / 19→17 / 合计 54；ADVISOR:1261 = 13 核 ✓），但 §2 内 5 处用例枚举未随更：:104 / :134 / :142「T-MA6-1–7」→ 应 1–9；:190 / :210「T-MA10-1..7」→ 应 1..8（④ 只改计数未点名枚举行；仅受「以本追加为准」笼统条款覆盖） | §5 行数对表 / §6 收口时顺带对齐，或补一行显式枚举更正——防验收误按旧集取绿 |

**计数（D3 复核——轮次 2）**：修正 8 件 + lint 微修 1 件全部落点核验在位；发现 = 🔴 0 · 🟡 1 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent 记）

> 〔父侧代笔：折行——§3 轮次 2「核验口径」超宽行（原单行 1003 字符）按空白归一逐字折行，零增删；父侧落笔打标。〕

**2026-09-11 19:10 父侧代签**——用户 16:40 授权窗口；五条件齐备：轮次 1 pass（🟡2·🔵6）→ 修正轮 8/8 → lint 微修（#174）→ 轮次 2 pass（0🔴·0🟡·3🔵——1 项 Not an issue（A13 登记）· 2 项经 #181 落修收敛）+ **token 已签发**（值不落档）。

**父侧裁定（轮次 2 三 🔵）**：① 跨仓引用半程残遗——**已落修**（#181：6 处归一 + 无 `.md` 族政策注 `:277`）；② 行数快照——**已落修**（#181：1423→1426 / 1227→1257 + 归属注）；③ 枚举残留——**已落修**（#181：T-MA6-1–9 ×3 + T-MA10-1..8 ×3 + 计数 37/17；外扩 `:219` 父侧**照准**）。

**批准范围**：群 A（A1–A13）——实施面以 §2 影响文件表为准（VSC 仓）；实施者 = eng-coder（设计 token 门）。

**遗留**：commit 待父侧随批提交。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：A1–A13 实现完成 · 内部偏差审计 + 内部代码评审双环节收敛 · 不 commit（改动留工作区）**（2026-09-11——eng-coder 自写；设计评审未发起（发起权在用户）——本轮两环节 = 交付协议内自动环节）

### 一、逐条交付摘要（判据 = §2 覆盖表；行数口径 = 现读 `split("\n").length`；测试档均以 `test/files.mjs` 登记）

| 条 | 落点（VSC 仓） | 实测证据 |
|---|---|---|
| A1 | `src/provider.mjs`（:315 `signal: signal ?? undefined`；:318/:319 相位参数保留）+ 四 transport 读侧 idle（各 `READ_IDLE_MS = 120_000` + `idleMs` 缝 + `SSE idle timeout` TimeoutError） | 新档 `test/provider-timeout-semantics.test.mjs` T-MA1-1–5 全绿；源文本 `AbortSignal.timeout(FETCH_TIMEOUT_MS)` / `_anySignal` 零残留 |
| A2 | 新 `src/expand-home.mjs`（22 行）+ `src/agent/setup.mjs` 读取点单点归一（只读——磁盘原文保留） | 新档 `test/expand-home.test.mjs` T-MA2-1–5 全绿；`startsWith("~")` 全 src 恰 1 命中；`src/tools/shell.mjs` 零改 |
| A3 | 13 档注释锚重锚（域 A 5 / A′ 1 / B 32 src + doc 1 / C 2）+ 2 处死指针短语删除（保 `2026-09-06`） | code 域（src/test/webview/locales）`§24` 零命中；「尾修复注」零残留；`subagent-async.mjs` 零净行 |
| A4 | 6 行逐字删 `§21 ` 前缀（src 4 + zh 2；全角/半角括弧逐字保留） | `§21 `（含尾空格）src/test 零命中；`F-N1.5`/`F-N1.6` 四档在位 |
| A5/A5′ | **零动**（修正轮改判——归 PORTABILITY-VSC-MIRROR 批） | 承接批已落新句式；本批未碰该行；T-MA5-1..3 不计本批验收 |
| A6 | toolCtx 提升 + 记账守卫（:469）+ 六类拒绝置位 + `buildCapMessage` 单源导出 | 新档 `test/advisor-refusal-accounting.test.mjs` T-MA6-1–9 全绿；guard 族（chain-guards / guard-completion / eng-settlement）零回归 |
| A7 | 双源 D5 行尾追加（`src/prompts` :110 / `docs/design/prompts` :84）+ ENGINEERING-MODE §6 bullet（设计者已落） | 双档该行同文；宽度新增 0 |
| A8 | `scripts/check-doc-width.mjs`（299 行）表格行豁免谓词单源 + 主流程单源调用 | `test/doc-consistency.test.mjs` T-MA8-1–2 全绿；实跑 0 超宽（69 文件）/ 一致性新增 0 |
| A9 | `src/tools/git.mjs` commit `--only` + 空 path 逐字错误 + 描述行同步 | 新档 `test/git-commit-pathspec.test.mjs` T-MA9-1–5 全绿（slow 归册——真 git 子进程） |
| A10 | `webview/input.js` ↑/↓ 判定序重构（C-MA10-1..6） | 新档 `test/webview-input-history.test.mjs` T-MA10-1..8 全绿；`webview-input-enter` 族零回归 |
| A11 | `src/agent/setup.mjs` 两行 description 逐字替换 | `no action parameter` 恰 2 处 + 6 动作名全含 + 旧串零命中；eng-designer-role / subagent 族绿 |
| A12 | `src/extension/panel-messages.mjs` 窗 controller 上挂 + abort 定向 + 后置闩；`image-handler.mjs` signal 缝 | `test/image-downgrade.test.mjs` 含 T-MA12-1..3 全绿（11/11） |
| A13 | `webview/activity.js` 首块 `.sub-desc` + `state.js` 字段 + locales 双键 + `chat.css` 规则 | `test/activity-flow.test.mjs` 含 T-MA13-1..3 全绿（17/17） |

### 二、批级机检（实跑——VSC 仓）

- `npm test`（快层）= **553 pass / 0 fail / 14 slow-skip**（含本批 5 新档；A9 档 slow 归册，快层 skip）。
- `node scripts/check-syntax.mjs` = **273 JS 档 OK**。
- `node scripts/check-doc-width.mjs` = **宽度 0 超宽（69 文件）· 一致性新增 0（存量 26）**。
- 定向核验 = `§24` code 域零命中 · `§21 ` src/test 零命中 · `startsWith("~")` src 恰 1 命中 · `_anySignal` 零残留。

### 三、行数对表（现读实测；设计表数值多处为批前 as-of——含并行批共写漂移，可归因项已注）

| 档 | 设计 as-of | 现读 | 归因注 |
|---|---|---|---|
| `src/provider.mjs` | 433（净 ~−4） | 424 | 本批 −9（注释改写 + polyfill 删除 + :315 单行） |
| `src/provider/transports/openai.mjs` | 309 | 347 | 本批 +~38（看门狗块 + 缝参数 + 群 A 前序批次已含部分） |
| `src/provider/transports/anthropic.mjs` | 215 | 248 | 同上 |
| `src/provider/transports/google.mjs` | 231 | 264 | 同上 |
| `src/provider/transports/responses.mjs` | 385 | 415 | 同上（reader 形态） |
| `src/agent/setup.mjs` | 463（+2） | 464 | 本批 +1（import）+ A11 零净行 |
| `src/expand-home.mjs` | 新（~+30） | 22 | 新档 |
| `src/agent-tools/advisor.mjs` | 325（+~10） | 346 | 本批 +~21（六类置位 + cap 预检 + 缝 + 注释） |
| `src/agent/execute-tools.mjs` | 483（±5） | 506 | 动手前 497（群 B B3 已落）+ 本批 A6 净 +9 |
| `src/advisor/run.mjs` | 242（+~4） | 250 | 本批 +8（builder 抽取） |
| `src/tools/git.mjs` | 392（+~8） | 402 | 本批 +10 |
| `scripts/check-doc-width.mjs` | 297（±5，≤300 承诺） | 299 | 终态 ≤300 达成（审计 #1 回修后） |
| `webview/input.js` | 146（+6±3） | 160 | 本批 +14（判定序重构 + 注释——越 ±3 估计但单点改动可归因） |
| `webview/activity.js` | 298（+8±3） | 309 | 本批 +11（说明行块）——超 `≤306` 设计行，仍 ≪500 硬限不拆 |
| `webview/chat.css` | 470（+5±2） | 477 | 本批 +7（.sub-desc 规则 + 注释） |
| `webview/state.js` | 122（+1） | 123 | 本批 +1 |
| `locales/en.json` / `zh.json` | 247（各 +1） | 248 / 248 | 本批各 +1 |
| `src/extension/panel-messages.mjs` | 468（+10±4） | 485 | 本批 +17（窗上挂/清理/定向/闩 + 注释）——越 ±4 估计 |
| `src/extension/image-handler.mjs` | 81（+7±3） | 87 | 本批 +6 |
| `src/agent-tools/subagent-async.mjs` | 499（**0 净行**） | 467 | 本批零净行（行内文本替换）；467 漂移先于本批（动手前读档即 467） |
| `test/image-downgrade.test.mjs` | 158（+45±15） | 206 | 本批 +48（含 T-MA12-1..3） |
| `test/activity-flow.test.mjs` | 292（+18±6） | 343 | 本批 +51（T-MA13-1..3 断言更详尽——超估不超范围） |
| `test/doc-consistency.test.mjs` | 174（+~30） | 196 | 本批 +22（T-MA8-1–2） |
| `test/files.mjs` | 63（+1×轮） | 72 | 本批 +6（5 新档登记 + 增补轮 1） |
| 新档 | — | provider-timeout 163 · expand-home 92 · advisor-refusal 239 · git-commit 111 · webview-input-history 170 | 5 新档 |

### 四、决策透明表（设计原稿 vs 落笔取法——偏差逐条披露）

| # | 位置 | 设计原稿 | 落笔取法 | 理由 |
|---|---|---|---|---|
| 1 | A1 释放面 | `response.body.destroy(...)` | `destroy` 优先、无则 `cancel`；判死经 `idlePromise` race（TimeoutError 逐字同源） | Node 24 实测 undici 直连 body 无 destroy——见下条展开注 |
| 2 | A1 缝 | `idleMs` 参数 | + `idleMs ≤ 0` = 关闭保护 | 防 0 值瞬间判死脚枪；不增生产面 |
| 3 | A6 缝 | 「seam 覆写」 | 新增 `ctx?.runAdvisorReview ?? runAdvisorReview`（镜像 advisor-async 同款缝） | sync 启动拒正常链不可达（防御纵深）——T-MA6-3 / T-MA6-6 需驱动；生产缺省零变 |
| 4 | A6 载体路径 | 「记账块改读 `toolCtx._advisorRefused`」 | `toolCtx` 经 `meta` 传递；`let toolCtx` 声明于 try 外（返 meta 点可达） | 作用域约束（try 内 const 不可达返回点）——首版即被自测捕获并修正 |
| 5 | A12 快速失败 | 仅 signal 桥接 | + `signal?.aborted → return null` 短路 | T-MA12-3①「预 aborted → 不等 60s」确定性（不跑 runAgent setup 期） |
| 6 | A4 第 6 行 | 旧文标注 `（§21 F-N1.6 2026-09-05 裁定）` | 实际文本为 `…裁定；`（后随分号）——按「仅删前缀」语义替换 | 设计表该项漏标分号；替换语义不变（逐字前缀删除） |
| 7 | A3 手法 | 逐处替换（禁批量脚本） | 逐文件 edit；同文件内 token 形态唯一时用 replace_all；每档 grep 复核 | 无 sed / 无跨文件盲替换；删除/新增逐处受控 |
| 8 | A13 现态 | 与活动区回归批 files 域重叠（调度器排队） | 按**现态**叠加（activity.js 仍为 `#messages` 流尾形态时落笔） | 该批未先落；重叠面已由调度器排队语义覆盖 |
| 9 | A9 描述行 | 中文逐字摘要 | 英文等效句（该文件 description 全英文——保持本档语言） | 逐字语义保留：`git commit --only <paths>` + 工作树取列文件 + 无 path → add -A 全量 |

> 展开注（上表 #1 A1 释放面）：仅 destroy 则 T-MA1-3 不可达（for-await 锁定时 `body.cancel()` 抛 locked）；代理路径（PassThrough）destroy 生效；responses 持显式 reader → `reader.cancel` 真达；物理释放在直连路径退化为 undici 隐式 bodyTimeout（CLI 同形态——差异登记）。
> 〔自我折行注：本节 #1 行原为单行 379 字符，按 ≤300 格式规折为「短行 + 本展开注」——零增删（eng-coder 自披露）〕

**声明外写入 = 零**：本批实际触碰 41 档，全部落于 §2 两轮文件表内（含 A3 独立触面 9 档与增补轮 14 档）；CLI 仓零写入（本批 VSC 单端）。

### 五、内审与代码评审（轮次 · 终态）

- **内部偏差审计**（explore 只读，1 轮）：发现 2 项 🔵——① `check-doc-width.mjs` 读档 301 行（越 ≤300 承诺）→ **已修**（299 行，doc-consistency 复跑 8/8 绿）；② `subagent-async.mjs` / `execute-tools.mjs` 行数漂移归因 → 见上「行数对表」。无 🔴；终态 = 收敛。
- **内部代码评审**（advisor type=code，1 轮）：**0 🔴 · 0 🟡 · 3 🔵 · VERDICT: pass**。三项处置：①「声明开卷文档不存在」= 评审请求 documents 清单笔误路径（我侧，两仓零引用、无实物缺失）→ Not an issue；②行数对表漂移 → 本 §5「行数对表」按实测重记 + 归因注（Fixed）；③A4/A11 判据为 grep 机检（设计即如此、无在册测试档）→ Not an issue（如需回归硬化 = 后续批范围）。
- **fix round**：1 轮（审计 #1 回修 + 复审绿）。无 stalled。

### 六、边界与未做（如实）

- 未 commit（改动留工作区）；未发起设计评审；未碰 A5/A5′ 与 CLI 仓；未扩面至群 B / PORTABILITY / `§24` 同族旧锚全清（`§15`/`§18`/`§19.x`/`§20`、prompts 内 `§11.1 R14`/`§18 D-E1a`/`§28 R26` 均保持原样——同族观察登记）。
- CLI 侧 `check-doc-width` 现存报告（14 档 25 行超宽 + 6 条新增）均属并行批在写产物（清单内无本批批次档）——非本批写入，供父侧核查。
- 测试档超设计估量项（activity-flow +51 vs +18±6 等）为断言详尽度差异，非范围扩张；A10 测试需真 `textarea`（共享 fixture 的 `#input` 为 div）——在该档内就地替换元素（fixture 零改）。

## §6 验证与收口（父代理自写）

**2026-09-11 20:15 · 父侧收口**

- **交付核验**（父侧抽核）：VSC 快层 **553 pass / 0 fail / 14 slow-skip**（含 5 新档）；`check-syntax` 273 档 OK；`check-doc-width`（VSC）0 超宽 · 一致性新增 0；定向：code 域 `§24` 零命中 · `§21 ` 零命中 · `startsWith("~")` 恰 1 · `_anySignal` 零残留；面：A1–A13 全落——**41 档全部位于 §2 两轮文件表内（声明外写入 = 0）**；A5/A5′ 零动 ✓ · CLI 仓零写 ✓。
- **AC 核销**：AC-MA1..AC-MA13 + 锚回归按 §5 逐条过（含 AC-MA4 冻结模式机检 / T-MA11-1 grep 输入）。
- **内部评审**：审计 1 轮（2 🔵 处置）+ 代码评审 1 轮 pass（3 🔵）+ fix round 1 → clean。
- **父侧裁定**：① A12 设计表第 6 行漏标分号偏差（按「仅删前缀」语义替换）——**接受**（披露在案）；② A4/A11 回归硬化 = **新范围**（登记可选——须另行走链；本批不上）；③ 行数实测 vs 设计估计：以 §5 对表为准（设计档表 = as-of 估计，不回改）。
- **核销同步清单**（D7）：状态行——无独立需求池条目（A 家族源自勘察登记——见 §1）；计数——A1–A13 / AC 与 §2 一致；指针——设计档 §11/§13/§14/§16 可达；变更记录——各档在档。
- **令牌**：链终——consume-design 已消费（本批**全链路闭环 ✓**）。
- **遗留**：① A4/A11 硬化（可选·另链）；② VSC 文档面数字为 as-of 估计（§5 对表为实测权威）；③ commit 随「扫」批。
