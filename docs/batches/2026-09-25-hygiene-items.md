# 2026-09-25 · hygiene-items
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:57「这七批都派出去」——技术待办排批 · 批 5/7：卫生轮（条目 #295/#292/#285/#284）。
> 台账 = #295 / #292 / #285 / #284（技术待办 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（任务书指针 = 本档 §2 · 条目细节以台账 evidence 为准）：

| # | 条目 | 要点 | 面 |
|---|---|---|---|
| #295 | common.md 双源面句差 | CN 正本 `:27`「不重读验证」句 EN 运行面无对应——补译 / 删 CN 先裁 | 提示词 |
| #292 | 提示词五档漂移防线 | 零常驻锁——流程步 vs 结构级检查择一（禁散文锚） | 提示词 |
| #285 | 死指针「另族」批量 | AGENT-LOOP.md 引 §9/§12/§15/§29 等 + `webview-turnstate.test.mjs:12`（#232 射程外） | 文档 |
| #284 | WEBVIEW-PROTOCOL.md §12/§13 表列再漂 | 按 `--emit` 全表重出 | 文档 |

**边界**：文档 / 提示词面；提示词内容变更须守双源逐字一致纪律（EN 运行面 + CN 设计面同改）；禁新增散文锚。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初轮 · 4/4 条覆盖 · #284 随轮落地 · #292 冻窗顺延补写已落（§2.12）· 评审轮 1 收正已落（§2.13）· 2026-09-25）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮实勘口径**（本席 2026-09-25 实读）：条目细节 = 台账 #295/#292/#285/#284 evidence（逐字读完）；关键件实读 = 两份 `common.md` · 需求档 `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 · 需求档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-PROMPT-PIPELINE.md` ②4 · 设计档 `docs/core/design/PROMPT-SYSTEM.md`（§6.1/§6.6/§10）· `docs/core/design/AGENT-LOOP{,-SUBAGENT,-ASYNC-POOL,-UPSTREAM}.md` 节面 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12/§13 两表与两条 `--emit` 提取器 · `thincoder-vscode/test/webview-turnstate.test.mjs` 头注。**未跑**：`--emit` 两条（落地轮跑——判据 = 提取器输出为唯一权威）。

### 2.1 本批条目（覆盖）与逐条落点

| # | 条目 | 裁定 / 处置 | 落点 | 变更面 | 落地人 |
|---|---|---|---|---|---|
| #295 | common.md 双源面句差（CN `:27` 句 EN 无对应） | **补译 EN**（裁定 = §2.2.1；CN 零改） | `thincoder-core/prompts/common.md` §证据纪律节尾 +1 行（逐字 = §2.3-A） | 运行期资产面 | eng-coder |
| #292 | 提示词内容漂移防线（零常驻锁） | **择一 = ① 流程步**；② 结构级检查**否决**（散文锚禁新增 · KD-4） | `docs/core/design/PROMPT-SYSTEM.md` §6.1 变更流补条 + §7 决策表 D-PS8 + 变更记录（拟稿 = §2.3-B） | 文档面（设计档） | eng-designer |
| #285 | 死指针「另族」批量 + `webview-turnstate.test.mjs:12` 忙态旧措辞 | 按族全树复扫 + **二态处置（改指 / 改述）** + 处置表；另态「判保留 + 登记」仅限两候选不可唯一 | 码面：`thincoder-{core,cli,vscode}/**`（注释 + 测试头注）· 档面：`docs/{core,vsc}/design/**` 活体面 | 产品码面（码）+ 文档面（档） | eng-coder（码面）/ eng-designer（档面） |
| #284 | WEBVIEW-PROTOCOL.md §12/§13 表列再漂 | **按 `--emit` 全表重出**（②③ 列）+ 两条 as-of 注刷新 + 变更记录一行；行数 / 判别式集零变 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12（`:363` 起）/ §13（`:432` 起） | 文档面（设计档） | eng-designer |

**逐条回指**：本表四行 = 台账四条（`ledger_query` cwd=`D:\teamcode\thincoder` 逐字读完）；验收判据逐条见 §2.5。

### 2.2 机制设计

#### 2.2.1 #295 · 双源面句差 —— 裁定「补译 EN」

**事实基线（本席实读）**：

- CN 正本 `docs/core/design/prompts/common.md:27`：「**只对你要下的断言取证**：任务书/上下文已给过的事实直接引用，不重读验证；不预读无关代码（避免为"保险"而无限勘察）。」——本席全仓复扫：该句**唯一全文命中**在 CN 面。
- EN 运行面 `thincoder-core/prompts/common.md:27-31` 证据纪律节 = 三句（断言须验 / 断言禁式 / 记忆语义禁式），**无该句**；节尾直接进 `## 文档写作纪律`。
- 需求档 `docs/core/requirements/PROMPT-SYSTEM.md:60`（§2.3 行 5 · 证据纪律）：**「已给过的事实直接引用不重读；不预读无关代码」在案**——即需求的收面大纲已把该句列为 §5 现役范围。

**裁定**：**补译 EN**（不删 CN）。理由：① D-PS1「中文审核面 = 内容权威；英文运行面 = 翻译产物」——CN 为准、EN 缺译即 EN 缺陷；② 需求档 §2.3 行 5（主 agent 笔）已把该句收进 §5 的现役大纲 ⇒ 需求面与 CN 面同向；③ batches 未见解释性记录（台账 #295 证据在案），「疑未随译」据此判为**未随译**而非「EN 侧有意删」。

**归属判据自查（台账要求项）**：该句**不与证据纪律面重复**——主句管「什么必须验」，该句管「验到什么程度为止」（只对自己的断言取证 · 已给事实直接引用 · 不预读无关代码）；两句互不替代。与 `thincoder-core/prompts/persona-eng-designer.md:35`「Reference vs re-check」同向（该条 = 角色步级收窄，EN 面已在位）⇒ 本句 = 公共层一般形，补译后两面层级一致。

**落地面**：`thincoder-core/prompts/common.md` 证据纪律节尾**整行追加**（逐字草案 = §2.3-A）；**CN 面零改**（规范本体不受扰）。**零计数连带**（散文行追加 ⇒ `##` 块 14 守恒 · `prompts-dual-source` T-CL1 无涉）。

#### 2.2.2 #292 · 提示词内容漂移防线 —— 择一「流程步」

**问题**：五档提示词（prompt-inflight-ask 批的 persona-engineering ×2 / persona-normal ×2 / `question.md`）内容落地后**零常驻锁**——`prompts-dual-source` / `prompt-refs-zero` 锁结构面（节数 / 引用零命中 / 路径），**不锁内容与当批 §2.3 围栏块的一致性** ⇒ 后续改档者与已冻结的逐字草案可静默漂移。

**择一（① vs ②）**：

- **选定 = ① 流程步**：提示词面批次（或涉提示词档的批次）**收尾加一步一次性比对**——本批落地档 ↔ **当批设计围栏块**（逐行；输出入批档 §5）。**一次性、零常驻**：不改测试面、不新增断言、不设守卫脚本。
- **否决 = ② 结构级检查**：读非测试档、断言句子在场 = **散文锚**（2026-09-12 退役族 + 测试纪律禁新增——**KD-4 约束**；同族先例 = prompt-inflight-ask §2.8 KD-4 / 该档 §6.7「不新增断言」）。且机检总闸另有 2026-09-17 用户裁定「无限机检反感」在案。
- **补充裁定（防线寿命）**：该步守的是**当批一致性**（设计草案 → 落地），不是「永久冻结」——后续批次合法改档时，**以当批围栏块为新基线**（冻结的记录面仍可读作历史）。防线不阻止合法演进，只阻止**无记录的静默漂移**。

**落点（本席笔）**：`docs/core/design/PROMPT-SYSTEM.md`——§6.1「双面落地流程」变更流行后补一条 + §7 决策表补 **D-PS8** + 变更记录一行（拟稿逐字 = §2.3-B）。**该档正处 D5 评审冻结窗**（批 `2026-09-25-misc-four` 设计评审在飞 · 该档在被审列表）⇒ **本笔延后补写**（解冻后落；批档 §2 写入不受影响——本节即为其设计承载）。

**机检面**：**零新增**（三包用例数守恒）；在位性以**一次性对读**核（设计档 §6.1 / §7 新条实读——非常驻断言）。

#### 2.2.3 #285 · 死指针「另族」批量 —— 按族全树复扫 + 二态处置

**族界定**（承 #232 处置口径 · `docs/batches/2026-09-25-hygiene-ab.md` §5 残差 6）：对象 = **指向 `AGENT-LOOP.md` 旧编号节** 的引用（`§9`/`§12`/`§15`/`§29` 等——#232 已扫 `§17`/`§19`/`§2.20` 三族，其余同族未扫）。**判死判据**（实读口径）：现行 `docs/core/design/AGENT-LOOP.md` 顶层节面 = §1–§8（+ §2.1–2.3 / §3.1–3.2 / §6.1–6.6 / §6.13–6.18）；**§6.7–§6.12 / §6.19+ 现住拆分面三档**（`AGENT-LOOP-SUBAGENT.md` · `AGENT-LOOP-ASYNC-POOL.md` · `AGENT-LOOP-UPSTREAM.md`——节号沿用）。另：`AGENT-LOOP.md §6.x` 形若节号属拆分面（陈名形）= 同族（档名错位、节号可解析）。

**扫描面与命令（唯一枚举；实现轮复扫为准）**：

```
git grep -n -E "AGENT-LOOP(\.md)? §[0-9]" -- thincoder-core thincoder-cli thincoder-vscode docs
```

排除面（不判红 · 处置表内「照留」类）：`**/_archive/**` · `**/.thincoder/**` · 产品参照树 `thincoder-{cli,vscode}/docs/**` · 记录面 `**/CHANGELOG.md` · 批次档 `docs/batches/**` · 夹具族（`thincoder-cli/test/prompt-refs-zero.test.mjs:117/:145` · `thincoder-vscode/test/agent-tools-registry.test.mjs:96/:101`——判据样本，勿改）。

**二态处置 + 决策树**（逐处实读；承 expansion-family 批 `docs/batches/2026-09-20-expansion-family-batch.md:57` 判据树）：

1. **逐义对应唯一 ⇒ 改指**（改到现行节号 / 拆分面档名）。
2. **无对应节 ⇒ 改述**（去 `§号`、保语义句 + 日期 / 批次锚——「死指针 ⇒ 删指称，语义句保留」）。
3. **两候选不可唯一 ⇒ 判保留 + 登记**（错指 > 死指；登记落批档 §5 处置表）。

**面级差异一条（重要）**：命中若在**模型可见串**（工具说明 / 回模型错误串 / 注入模板）⇒ 处置 = **删引用**（不重指向——承 `PROMPT-SYSTEM.md` §6.6「删引用（非改址）」）；命中在**注释面** ⇒ 二态处置照上表。

**族 → 现行家映射（候选靶 · 逐处实读确认）**：

| 旧族（`AGENT-LOOP.md §N`） | 现行家（候选） | 依据 |
|---|---|---|
| `§15`（async spawn / D-A1/A3/A6） | `AGENT-LOOP-SUBAGENT.md §6.7.3` | #232 族映射；实读在盘 |
| `§17` / `§9`（挂起 / digest / D-S1..S9） | `AGENT-LOOP-ASYNC-POOL.md §6.8`（+ `§6.20` 中止丢弃面） | #232 族映射 + 存量先例（`suspension-drive.mjs` 已半改） |
| `§19`（subagent 动作 / 控制面） | `AGENT-LOOP-SUBAGENT.md §6.7`（`.2` 动作面） | #232 族映射 |
| `§20`（调度器 / D-SD*） | `AGENT-LOOP-SUBAGENT.md §6.9`（候选；逐处实读） | 语义对位（调度 + files/dependsOn） |
| `§20.3`（abort 来源标注） | `AGENT-LOOP-SUBAGENT.md §6.12` | 同题名节在盘 |
| `§12.1`（评审对象锚） | `AGENT-LOOP-ASYNC-POOL.md §6.18` | `AGENT-LOOP.md` §8.2 在案 |
| `§12.2`（判定铁律 R1–R7） | `AGENT-LOOP-ASYNC-POOL.md §6.19` | 同上 |
| `§12.4`（byte-identical 取消） | `PROMPT-SYSTEM.md` §6.4 | 同上 |
| `§13` / `§18.6` / `§23.3.2`（轨迹存档） | `TRACES.md`（节号实读） | `AGENT-LOOP.md` §8.1 / §8.2 登记 |
| `§14` / `§25`（会诊 / 飞刀异步） | `CONSULTATION.md` / `ESCALATE.md` | 同上（§8.1 登记） |
| `§18.7 D-TS*`（测试分层） | `TESTING.md`（§3–§4） | `AGENT-LOOP.md` §6.16 指针表 |
| `§22`（digest 注入预算） | `AGENT-LOOP.md §6.14` | 同题名节在盘 |
| `§23.3.1`（长会话内存上界 / 文本额度） | `AGENT-LOOP.md §6.15` + `TOOL-OUTPUT-LIMITS.md` | 同题名节在盘 |
| `§7.2` / `§7.2.1` / `§7.3`（子代理显示 / 面板 / 人格锚） | `docs/cli/design/TUI.md`（CLI 壳体面——未迁） | `AGENT-LOOP.md` §6.16「TUI 显示面」行（候选；不确定则走决策树 ③） |
| `§21`（Stop 钩子 / P-SL2 / F-N1.x） | `AGENT-LOOP.md §6.13`（Stop）+ 余项逐处实读 | 同题名节在盘（Stop）；余项候选 |
| `§26`（长测试先落盘） | 提示词正本（`docs/core/design/prompts/`——纪律层） | 语义为提示词条款 |
| `§24` / `§28` / `§29`（记账修复 / spawn 门 basename / mutation-seq） | **逐处实读裁定**（无同题名节 ⇒ 多走「改述」） | 决策树 ③ |

**种子命中面（本席实扫 · 非闭合清单——`.md` 面超 200 命中被工具截断，实现轮复扫为准）**：core `agent-tools/{subagent-scheduler,subagent-spawn,subagent-run,escalate-async,consult,digest-budget,spawn-gates}.mjs` · `agent/{dispatch,record-results,run-stages,suspension,spawn-child}.mjs` · `agent.mjs` · `{abort-provenance,auto-think,explore-distill}.mjs` · `provider/core.mjs`；cli `src/tui/{suspension-drive,fold-block,layout,subagent-blocks,subagent-panel,display-budget,interaction}.mjs` + `test/**`（头注族 8 档）；vscode `src/agent/{run-stages.mjs,execute-tools.mjs}` · `src/agent.mjs` · `src/extension/{panel-chat,suspension}.mjs` · `src/explore-distill.mjs` · `test/{files,eng-settlement,subagent-observe-send}.mjs`。

**附项（台账点名 · 同批并做）**：`thincoder-vscode/test/webview-turnstate.test.mjs:12-13` 头注含「**与拒发同判据**」旧口径（#228 三靶位之外）⇒ 按现口径改述（busy 提交 = 入队受理（容量 8）+ 待发送标记；满队 ⇒ 拒发 toast + 文本保留；源 = `webview/send.js:27-56`——同 #228 KD-7）。

**判据**：靶面复扫**残余 = 0**（处置集闭合——开跑读数记 §5）+ 三包套件绿 + 记录面 / 参照树 / 夹具零触 + 档位面（命中档越 300 ⇒ 登记；越 500 ⇒ 停下上报）。

#### 2.2.4 #284 · WEBVIEW-PROTOCOL.md §12/§13 表列再漂 —— `--emit` 全表重出

**程序（提取器 = 唯一权威）**：

1. `cd thincoder-vscode && node test/protocol-coverage.test.mjs --emit` ⇒ §12（收面）逐行读数；
2. `cd thincoder-vscode && node test/protocol-coverage-reverse.test.mjs --emit` ⇒ §13（发面）逐行读数；
3. 两表 **② ③ 列逐行重出**（以**判别式**为行锚——消息名 / 事件名，不按行号锚，行号即随漂移位移——承 hygiene-ab §2.13 改靶教训）；首列判别式集 / 协议语义 / 载荷字段 **零变**；
4. 两表头注 as-of 行刷新（旧注退场——失效表达不留规范面）；变更记录一行。

**已核漂移（台账 #284 evidence + 本席实读复核）**：③ 列整体 −2（`statusText` 表载 `:185` / 实 `:187`；`aborted` `:102` / `:104`；`subagent` `:219` / `:221`）；② 列多值漂移（如 `panel-turn-loop.mjs` 表载 `:154/:169` vs 实 `:150/:165`——#163 拆分后累积位移）。

**零语义红线**：行数 **53 / 51** 不变 · 判别式集恒等 · ④ 处置列与首列零动；坐标列**不参与机检判据**（先例 = 2026-09-18 vsc-key-delete-confirm 批「不重出亦合规」）——本笔只收**人读面**时效。

### 2.3 逐字草案（落地 = 逐字，不改字）

**（A）#295 · EN 补译** —— `thincoder-core/prompts/common.md`，`## 证据纪律` 节尾（`:31` 行后、空行 / `## 文档写作纪律` 前）整行追加：

```text
**Take evidence only for the assertions you are about to make**: facts the task book or context already gave you are cited as-is — no re-reading to verify them; do not pre-read unrelated code (no surveying forever "just to be safe").
```

**（B）#292 · 设计档补条（拟稿——解冻后落 `PROMPT-SYSTEM.md`）**：

- §6.1「双面落地流程」变更流行之后补：

```text
- **批次收尾核对（内容漂移防线——2026-09-25 卫生轮 · 台账 #292）**：提示词面批次收尾加一步**一次性**比对——本批**落地档 ↔ 当批设计围栏块**（逐行；输出入批档 §5）；**零常驻锁、零新增断言**（内容在场判据 = 散文锚，禁新增）。合法改档以**当批**围栏块为新基线——本步守「当批一致性」，不冻结演进。
```

- §7 决策表补一行：

```text
| D-PS8 | **漂移防线 = 流程步（批次收尾一次性比对）**——零常驻锁；否决「结构级检查」（读非测试档断言句子在场 = 散文锚 · 2026-09-12 退役族 · 测试纪律禁新增） | 零常驻 = 守当批一致性而不冻结演进；否决「落常驻锁」（散文锚禁新增 + 2026-09-17 用户裁定「无限机检反感」）·「只加核验清单一句」（清单在需求档——本笔不越笔权，见 §2.9-3） |
```

**（C）#285 · 忙态旧措辞改述目标形（`webview-turnstate.test.mjs:12-13` 头注）**：删「与拒发同判据」旧口径，改现口径句（busy 提交 = 入队受理（容量 8）+ 待发送标记；满队 ⇒ 拒发 toast + 文本保留——源 `webview/send.js:27-56`）；⑤ 尾段行为语义（Send 按钮 running 期隐藏 / susp-idle 恢复）零改。

**（D）#284 · 表列重出**：无逐字草案（逐行 = `--emit` 输出——提取器为唯一权威）；as-of 注与变更记录行随重出落（文本形 = 「坐标 as-of = 2026-09-25 hygiene-items 批 …… ② ③ 列逐行按 `node test/protocol-coverage{,-reverse}.test.mjs --emit` 读数重出（提取器为唯一权威）」）。

### 2.4 受影响文件与测试面（行数口径 = read 工具行号 · as-of 本席实读）

| # | 文件 | 现读数 | 变更 | 预计后 | 变更面 | 备注 |
|---|---|---|---|---|---|---|
| #295 | `thincoder-core/prompts/common.md` | 163 行 | +1 | 164 | 运行期资产面 | EN 运行面；CN 面（`docs/core/design/prompts/common.md`，123 行）**零改** |
| #292 | `docs/core/design/PROMPT-SYSTEM.md` | 411 行 | +3（§6.1 一条 / §7 一行 / 变更记录一行） | 414 | 文档面 | **D5 冻结窗内 ⇒ 延后补写**；零 `.mjs` / 零测试档 |
| #285 | 码面：命中档集（开跑复扫产出——**扫描面依赖**，设计轮天然不可闭合）+ `thincoder-vscode/test/webview-turnstate.test.mjs` | 命中档集 = 复扫读数；该测试档 339 行 · 头注 `:12-13` 改述 | 逐处 ±0～±1 行（改指 / 改述形态多为等长单行替换） | 逐档记（>300 登记 / >500 上报） | 产品码面 | 档面：本席种子扫描未见 `docs/{core,vsc}/design` **活体面**新增死指针（既有命中 = 沿革 / 登记表 / 域外登记说明句——记录性质，照留）——实现轮复扫为准 |
| #284 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §12 表 53 行（`:363` 起）· §13 表 51 行（`:432` 起） | ②③ 列逐行重出 + 两 as-of 注 + 变更记录一行 | **行数不变 53/51** | 文档面 | 本席随轮落地（读数落 §2.4 后注 / 批档追加） |

**测试面**：**零新增用例**（三包例数守恒——承「无限机检反感」+ 散文锚禁新增）；#295 / #285 落地后跑三包套件（core / cli / vsc）+ 两条现役提示词锁（`prompts-dual-source` / `prompt-refs-zero`）+ `node scripts/doc-check.mjs`（净增 0）。**反证针**（#285 用）：在夹具档临时投放旧形串（`(AGENT-LOOP.md §11.2)` 形态）⇒ 复扫报出 ⇒ 撤回（0 diff 复核）——窗口纪律承 prompt-inflight-ask §2.7（同窗同档 · 不与他批跑测并行）。

**实现轮次切分建议**（每轮 files 声明 = 面纯）：轮 1 = `thincoder-core/prompts/common.md`（#295 · 运行期资产面）→ 轮 2 = 码面 sweep（#285 · eng-coder）→ 轮 3 = 档面（#284 已完成随轮 / #292 待解冻）。

### 2.5 验收对照（AC——逐条回指本批条目）

| AC | 回指 | 判据（机器可验） |
|---|---|---|
| AC-1 | #295 | EN 档新行在位且与 §2.3-A **逐字全等**（一次性 UTF-8 逐行比对；引用 `prompt-refs-zero.test.mjs` 导出 `lineHits`——不复制判据字面）；行宽 <300；`##` 块数 14 守恒（`prompts-dual-source` T-CL1 绿） |
| AC-2 | #295 | CN 面零改（`git diff -- docs/core/design/prompts/common.md` = 空）· cli 套件全绿（含两提示词专项档） |
| AC-3 | #292 | 设计档 §6.1 新条 + §7 D-PS8 + 变更记录一行在位（解冻后**一次性对读**——非常驻断言）；**零新增用例**（三包例数前后逐数相等）；提示词档零改 |
| AC-4 | #285 | 靶面复扫**残余 = 0**：`git grep -n -E "AGENT-LOOP(\.md)? §[0-9]"`（域 = §2.2.3 扫描面）逐命中落入处置表三态之一（改指 / 改述 / 判保留+登记）；`webview-turnstate.test.mjs` 旧口径串（`与拒发同判据`）零命中；三包绿；越档位逐档登记（>300）/ 上报（>500） |
| AC-5 | #284 | 两表 ②③ 列逐行 = `--emit` 输出（**判别式行锚**人读对读）；行数 **53 / 51** 不变 · 判别式集恒等；两条 `--emit` exit 0；doc-check 净增 0；变更记录一行在档 |
| AC-6 | 跨条 | 记录面（`**/CHANGELOG.md` · `docs/batches/**`）· 参照树（`thincoder-{cli,vscode}/docs/**`）· `_archive/**` · `.thincoder/**` · 夹具族零触（`git status` 逐档核） |

**三链同源核对（铁律）**：§2.1 表四行 = AC-1..AC-5 五条 = 台账 #295/#292/#285/#284 四条（#295 拆 AC-1/AC-2 两条判据面；余三条各一）——同源无孤项。

### 2.6 案例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 | #295 落地后跑 cli 套件 + 两条提示词锁 | 全绿；T-CL1 14 块守恒；例数不变；EN 行逐字 = §2.3-A |
| C2 | 正常 | #285 收尾复扫（扫描命令逐字） | 残余 = 0；处置表逐命中三态闭合；反证针红/绿两轮落 §5 |
| C3 | 正常 | #284 重出后对读两表 ↔ `--emit` | 逐行一致；行数 53/51 不变；提取器 exit 0 |
| C4 | 边界 | #285：命中落在**模型可见串**（工具说明 / 回模型串 / 注入模板） | 处置 = **删引用**（不重指向）——句义自足（§6.6 判据线三条件） |
| C5 | 边界 | #284：`--emit` 行数 ≠ 53 / 51（判别式集变动） | **停下上报**（协议面变更出本笔射程）——不就地增删行 |
| C6 | 错误 | #295 EN 行 ≥300 字符 / 含文档引用（`.md` / `§N`） | doc-check 行宽红 / `prompt-refs-zero` 红 ⇒ 修至净增 0（不就地改判据） |
| C7 | 错误 | #292 落地时若裹进常驻断言（读提示词档断句子在场） | 违 KD-4（散文锚禁族）⇒ 评审拦截面；本笔零新增 |
| C8 | 边界 | #285：两候选不可唯一（如 `§24`/`§28`/`§29` 族） | **判保留 + 登记**（错指 > 死指）——不猜改指 |

### 2.7 关键决策记录

- **KD-1 #295 裁定 = 补译 EN**（理由三件 + 归属自查，见 §2.2.1）；**否决「删 CN」**——需求档 §2.3 行 5 已把该句收进 §5 现役大纲（删 CN 须与需求档同改 = 改需求语义；且证据纪律面缺该收窄句后其「只对自己的断言取证」边界失守）。
- **KD-2 #292 择一 = ① 流程步**；**否决 ② 结构级检查**（读非测试档断言句子在场 = 散文锚 · 2026-09-12 退役族 · 测试纪律禁新增 · KD-4；另有 2026-09-17「无限机检反感」裁定）。
- **KD-3 #292 落点 = 设计档 §6.1 + §7**（不落需求档 ②4 清单）：②4 四件 = 「模板 ↔ 落地**同步**」轴；本步 = 「**当批草案 ↔ 落地**一致性」轴——两轴不同，不并（若父侧要并 ⇒ 需求档笔在主 agent——上抛 3）。
- **KD-4 #285 行锚 = 判别式**（消息名 / 事件名 / 语义 token），不按行号锚——行号随漂移位移，按行号锚会失靶（hygiene-ab §2.13 改靶教训：以漂移后行号当指称 ⇒ 新造错指）。
- **KD-5 #285 三态口径**：二态处置（改指 / 改述）+ 第三态「判保留 + 登记」**仅限两候选不可唯一**（错指 > 死指——承 expansion-family 判据树 ③）。
- **KD-6 #284 坐标列不参与机检判据**（先例 = 2026-09-18 vsc-key-delete-confirm 批「不重出亦合规」）——本笔只收**人读面**时效，不新增锁。
- **KD-7 变更面归属（派单面）**：#295 = 运行期资产面（eng-coder）· #292 = 文档面（eng-designer）· #285 = 产品码面（eng-coder）+ 文档面（eng-designer）· #284 = 文档面（eng-designer）——逐轮 files 声明不跨面。
- **KD-8 零新增机检门 / 零新增用例**（三包例数守恒）；#285 的唯一测试档改动 = **注释头注改述**（`webview-turnstate.test.mjs:12-13`），零断言改动。

### 2.8 边界（本批不做）

- 不扩提示词内容（除 #295 EN 补译一行）；CN 面逐字零改。
- #285 不触记录面 / 参照树 / `_archive` / 夹具族 / `CHANGELOG.md`；不重排文档节号。
- #284 不动协议语义 / 载荷字段 / 判别式集 / ④ 处置列；不做两表之外的表。
- 不新增机检门 / 不新增断言 / 不改既有测试判据；不改需求档（主 agent 笔）。
- `PROMPT-SYSTEM.md` 冻结窗内零触（#292 笔迹待解冻）；`docs/batches/**` 已收口档零触。

### 2.9 上抛项（请父侧裁定 / 记录）

1. **#292 落点受阻于 D5 冻结窗**：`docs/core/design/PROMPT-SYSTEM.md` 正处批 `2026-09-25-misc-four` 设计评审冻结窗 ⇒ 本席按「冻窗零触」未落笔（拟稿在 §2.3-B）；**解冻后补写**（或由父侧另行安排）。
2. **#295 CN 面零改**（规范本体）：本席未越笔；EN 逐字草案 = §2.3-A，落地归 eng-coder（D1：提示词 = 主 agent 内容权威 + coder 落地）。
3. **#292 是否并项进需求档 ②4 兑底清单（四件 → 五件）**：需求档笔 = 主 agent ⇒ 本席不动笔；若要并，须同批落（D3 计数联改）——本笔设计按「不并」（KD-3）。
4. **#285 面级差异一条**：模型可见串命中 ⇒ 删引用（非改址，承 §6.6）；若实现轮遇「删引用后句义不自足」⇒ 按判据线三条件复核后**停下上报**（不就地改述成新语义）。
5. **#284 出射程信号**：若 `--emit` 行数 ≠ 53 / 51（判别式集变动）⇒ 停下上报（属协议面变更，另批）。
6. **#285 种子清单未闭合**：本席实扫被工具 200 命中截断（`.md` 面尤甚）——实现轮以 `git grep` 复扫为唯一权威；本档种子面仅供起跑定位。

### 2.10 #284 落地读数（随轮 · eng-designer · 2026-09-25）

- **程序实跑**：两条 `--emit` exit 0（`# 提取集 53 = host 53 / webview 53 · 处置分布 活` / `# 提取集 51 = webview 51 / host 51 · 形态分布 arrow/bind/obj/ternary`）⇒ 两表 ② ③ 列逐行按**判别式行锚**重出。
- **逐行核验**（本席对读 = 提取器输出 ↔ 表体，脚本只读比对）：行集恒等 `fwd 53 / rev 51`；② ③ 与提取器**逐行同值**。
- **形式保留四则（锚可解析性优先 · 实测导出）**：`ledgerNotice` / `providerStatus` 两行 ② 列**保留** `thincoder-vscode/` 前缀形——本席先按裸包相对形归一，`doc-check` 实测 **悬空 +4**（判为不可解析）⇒ 收回前缀形复测归位；`digest` / `suspension` 两行「同文件重复路径」折 `:N/:M` 形（避 `N/src/…` 伪路径 token）。**行值 = 提取器读数**（无自造）。
- **表锚收正**：§12 表头 `:364` / 数据行 `:366`–`:418`；§13 表头 `:434` / 数据行 `:436`–`:486`（§2.4 表内「`:363` 起 / `:432` 起」= 设计轮旧读数——以此处为准）。头注两条（`:361` / `:430`）as-of 刷新为 2026-09-25 hygiene-items 批；变更记录一行（`:492`–`:494`）。文档总行数 614 → **618**（+4 = 变更记录折行）。
- **门读数（实跑）**：`node scripts/doc-check.mjs` ⇒ **悬空 18 → 14**（增量 4 = 本席中间态裸形，已收回；14 = 他批存量，本档 0 命中）· **行宽** 本档 0 命中（表行最长 <300）。
- **机检面**：坐标列不参与 `protocol-coverage{,-reverse}` 判据（先例在案）——两档用例读数落 §5（本席实跑见回报）。**协议语义 / 消息名 / 载荷字段 / 首列判别式集 / ④ 处置列零变**。

**#284 收尾实跑补记**：`cd thincoder-vscode && node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` ⇒ **tests 7 · pass 7 · fail 0**（W12-1/2/3 · T-5/A4/T-6/T-7——表 ↔ 提取集双向对账绿）。

### 2.11 #285 扫描形扩面（设计轮自纠）+ 档面首批落地（eng-designer · 2026-09-25）

**扫描形扩面（§2.2.3 收正）**：设计轮初扫命令 `AGENT-LOOP(\.md)? §[0-9]` **漏**两形——① 反引号隔断形 `` `AGENT-LOOP.md` §N ``（名称与节号间夹 `` ` `` + 空格）；② 裸形 `AGENT-LOOP §N`。**实现轮唯一枚举命令收正为**：

```
git grep -n -E "AGENT-LOOP(\.md)?[\` ]*§[0-9]" -- thincoder-core thincoder-cli thincoder-vscode docs
```

（同判据 = 逐命中二态处置；排除面不变。）**本席扩扫实测**：档面**活体面命中 = 仅 `docs/core/design/ADVISOR-CONVERGENCE.md`**（4 处 § 引 + 1 处兄弟档名录）；余命中 = 记录性质（沿革 / 不并项登记 / 域外登记说明 / 旧档来源括注）⇒ 照留；`docs/cli/design/TUI*.md` 三档 = **已收正记录**（变更记录行 `§9 → §6.8` 在案，非活指针）。

**档面首批落地（本席随轮 · 已落）**：`docs/core/design/ADVISOR-CONVERGENCE.md` 五处死指针改指——`:7` 兄弟档名录 · `:8` 权威边界（异步评审路径）· `:9` 判定铁律 R1–R7 · `:48` §2.2 实例解析权威 · `:60` §2.2 判据来源；目标 = `design/AGENT-LOOP-ASYNC-POOL.md` §6.10（异步评审池接入面）/ §6.19（判定铁律）——承 `AGENT-LOOP.md` §8.2 登记 + `DOC-DISCIPLINE.md` §3.9 先例表（`§11.2 → §6.10` 同式）。变更记录一行（`:329` 后）。**零新语义**；doc-check 复测 = 悬空 **14 持平**（本档零新增）。

**§2.2.3 内「本席种子扫描未见 docs/{core,vsc}/design 活体面新增死指针」一句 = 初扫口径下有误 —— 以本节为准**（扩扫后见 `ADVISOR-CONVERGENCE.md` 五处；已在本轮收正）。

### 2.12 #292 落点补写（fix 轮 · 冻结窗顺延项收尾 · eng-designer · 2026-09-25）

**授权**：父侧裁「按设计轮 §2.3-B 拟稿原样落地」（fix 轮 · 不重开设计）。落笔前实读现文为基——该档含 misc-four 批 fix 轮 1 在盘改动，行号以落笔后现值为准。

**落笔读数（逐字 = §2.3-B · 零改字）**：

| 项 | 落点 | len | 逐字核（只读脚本逐行比对批档 §2.3-B 原文） |
|---|---|---|---|
| §6.1 批次收尾核对条 | `docs/core/design/PROMPT-SYSTEM.md:161`（变更流行后 / 零维护者注行前） | 172 | 逐字全等 ✅ |
| §7 D-PS8 行 | 同档 `:251`（D-PS7 行后） | 199 | 逐字全等 ✅ |
| 变更记录一行 | 同档 `:349`（`## 变更记录` 首条位） | 269 | 本席笔（§2.3-B 未给逐字；按本档既有一行条 + 条间空行形） |

**机检读数（实跑 · 前后对读）**：`node scripts/doc-check.mjs` ⇒ 悬空 **14 → 14 持平**（本档命中 = 迁移期引文 · 列报不入闸 ⇒ 零净增）· 行宽 **19 行超限持平**（本档 0 命中；表行豁免 = 既有口径）· 拟新增 18 / 迁移期引文 221 持平；本档报告面行（符号·宽）集恒等（仅随行号位移）。**文档现文 420 行（`\n` 计数）· 本次净 +4** = §6.1 一条 / §7 一行 / 变更记录条 + 条间空行——§2.4 预估 +3，实 +4（差异 = 条间空行〔本档既有分隔形〕）。**零常驻锁 / 零新增断言 / 零提示词档改动**；本轮写面 = 仅该档一档。

**顺延项消解**：§2.9-1（#292 落点受阻 D5 冻结窗 ⇒ 解冻后补写）**已解**——状态行同步收正。

**上抛遗留一条（未改字面 · 供评审 / 父侧裁）**：D-PS8 理由句尾「见 §2.9-3」= 逐字拟稿原文——其指称对象是**批档 §2.9 第 3 项**（需求档 ②4 清单并项裁量；本笔权界说明），而 PROMPT-SYSTEM.md 本档无 §2.9 节 ⇒ 单看本档时该指针不解析。按逐字令**保留未动**；D4 指针形态（`doc:section`）面留评审裁量。

### 2.13 评审轮 1 fix 收正块（#1 / #2 / #3 / #4 / #6 / #7 · eng-designer · 2026-09-25）

承本档 §3 轮次 1（🔴0 · 🟡5 / 🔵3 · pass）；父侧裁定 = #1 / #2 / #3 / #4 / #6 / #7 接受并收正（#5 / #8 不在本席笔面）。§2 append-only ⇒ **本块为收正载体**（不改既有行；与上文冲突时以本块为准）。

**#1 · AC-4 复扫命令字面收正**：AC-4（`:174`）所引 `git grep -n -E "AGENT-LOOP(\.md)? §[0-9]"` = 初扫形；**实现轮复扫唯一口径 = §2.11 `:237` 收正形**：

```
git grep -n -E "AGENT-LOOP(\.md)?[\` ]*§[0-9]"
```

（域 = §2.2.3 扫描面不变。）§2.4 `:163` 反证针串改用**扩面覆盖形**（如 `` `AGENT-LOOP.md` §11.2 ``）——机读：旧形对反引号邻接形零匹配、收正形匹配（单空格裸形与 `(AGENT-LOOP.md §11.2)` 旧形本已可匹配 ⇒ 作针无鉴别力）。

**#2 · §2.12 逐字声明 vs 落盘的时点归属**：`PROMPT-SYSTEM.md:251` 尾限定形（「见**批档 `docs/batches/2026-09-25-hygiene-items.md`** §2.9-3」）系**父侧直接执行笔**（2026-09-25 13:31——非本席设计轮笔迹；合「文档:节」引用形态）。§2.12 `:250` / `:254`–`:256`「零改字 / 逐字全等」= 落笔时点口径（基线 = §2.3-B 稿）；与现文之字面差由该笔造成（非静默漂移）。§2.12 `:262` 上抛遗留条款 = **已由父侧该笔收束**（指针现态可解析——`PROMPT-SYSTEM.md:251` → 批档 §2.9-3 在档）。

**#3 · ② 列例句-行对判（两条 `--emit` 实跑 · exit 0）**：`aborted` 行 ② = `src/extension/panel-turn-loop.mjs:154/:169`——表 `:366` 行值 = 提取器同值 ⇒ **行无误**；§2.2.4 `:124` 例句所称「实 `:150/:165`」= 与盘不符（源证：`:154` / `:169` 两处 `postMessage({ type: "aborted" })` 实读在位；`:150` / `:165` 非发射点）⇒ **以本块收正**（例句读数误）。
**§2.10 `:224`「逐行同值」随实况补正**：§12 全表 53/53 同值；§13 = 45/51 同值——六行 ② 值于本席本轮先后复读之间位移（首读 = 与表行逐行同值；复读 = 六行新值——文件 mtime 13:43〔本机时〕），**因他批在途改动**（`thincoder-vscode/webview/{model-picker,settings-agent,settings-state}.js` 工作区未提交改动 = `spec-effort` 批〔`docs/batches/2026-09-25-spec-effort.md` · #330 面〕在飞）——**非本批重出漏项**。位移后现读：`addProvider` `model-picker.js:25` · `removeProvider` `:26` · `saveAgentSettings` `settings-agent.js:146` · `selectModel` `:131/:81` · `selectReasoning` `:132/:65` · `setKey` `:28`。**复出建议** = 该批落定后（或本批验证轮）一次性机械重出；坐标列不参与机检判据（KD-6），两表 as-of 注语义不变。

**#4 · `thincoder-vscode/test/webview-turnstate.test.mjs` 档位处置**：现读 **339 行**（read 口径）> 300 ⇒ 主动审视结论 = **结构不变（不拆）**：单场景单夹具——6 用例（①–⑥）共享同一 happy-dom 装配（`setupWebview` + `installChatFixture`）与 `resetBusy` 复位，拆档须复制夹具或引出 helper（成本 > 收益）；339 < 500 硬顶（判据 = `ADVISOR-CONVERGENCE.md:274`「>300 主动审视 / >500 必须拆」）。后续追加触 >500 ⇒ 必须拆（按用例组拆 + 夹具下沉 helper）。#285 扫面命中档集 = 实现轮复扫清单**逐档同此收口**（>300 记理由 / >500 停报）。

**#6 · 夹隔形成类登记**：**夹隔形**（名称与节号间夹非〔反引号 / 空格〕字符——如 `` `AGENT-LOOP.md` 的 §N `` · `` `AGENT-LOOP` 指针（§N） `` · `` `AGENT-LOOP` 节号错位（§11.2 ↔ §9） `` · `` 旧 §12.4 ``）= **记录性质 · 照留（类登记）**；复扫正则不宽（父侧裁）。同类先例 = `WEBVIEW-PROTOCOL.md:327`（迁移期口径，已登记）。本席实读判：点名六处（`PROMPT-SYSTEM.md:96` / `:97` / `:106` / `:115` / `:137` / `:183`）全属记录性质（双源比对读数 / 分歧成因 / 已裁决议行 / 旧档来源注）——**零活指针**（后续另见活指针形 ⇒ 报父侧，勿强登记）。

**#7 · 记录面标签 / 理据收正**：(a) §2.11 `:242`「`:60` §2.2 判据来源」= **误标**——实读：`:60` 住 §2.4（`ADVISOR-CONVERGENCE.md:56` 起；`:48` 才是 §2.2）；同误（`ADVISOR-CONVERGENCE.md:330`「§2.2 两行」）随轮**直接改** = 「§2.2 / §2.4 各一行」（该档零语义改动 · 可 revert）。(b) §2.11 `:234`「初扫漏两形」之 ②（裸形 `AGENT-LOOP §N`）归类不确——单空格字面初扫本已匹配；**真缺形 = 反引号邻接形**（`` `AGENT-LOOP{,.md}` §N ``——名称与节号间夹反引号〔+ 空格〕）；收正形 = 超集、命令零变。

**附 · 域外注② 顺检（登记 · 未行改笔）**：`WEBVIEW-PROTOCOL.md` §3.2 `:102` 载 `panel-index.mjs:27`——提取器现读 `:29`（`postIndexProgress` `:28` / 发射行 `:29`）⇒ **实漂（+2）**；§5 `:206` 载 `suspension.mjs:324`（起跑）/ `:336`（收尾）/ `:322`（tier 判据）——提取器现读 `:335` / `:347` /（`:333`）⇒ **实漂（+11）**。两处与 §12 对应行（`:400` / `:375`）现读不一致；**登记在案、报父侧**——处置（后续 sweep / 另批）出本批射程。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批档 §2（4/4 覆盖 + #292 冻窗顺延项已落）+ 随批落地面（`PROMPT-SYSTEM.md` §6.1/§7 · `WEBVIEW-PROTOCOL.md` §12/§13 · `ADVISOR-CONVERGENCE.md` 五处死指针改指）+ CN 正本 `common.md`（参照面）。五档全文实读；标注数值 / 引用坐标按在盘逐项抽验。

**已核通过（抽验）**：#295 参照面（CN `common.md:27` 句逐字相符；CN 档 123 行 = 表标注；`##` 节 14）；#292 落地（§6.1 新条 `PROMPT-SYSTEM.md:161` ↔ §2.3-B 稿 `:141` 逐字全等；变更记录 `:349` + §2.12 的 +4 算术自洽）；#284 落地（§12 行 53 = `:366`–`:418` · §13 行 51 = `:436`–`:486`；表头 `:364`/`:434`；两 as-of 头注 `:361`/`:430`；变更记录 `:492`–`:494`；前缀保留形 / 折 `:N/:M` 与 §2.10 记载一致）；#285 档面（`ADVISOR-CONVERGENCE.md` `:7`/`:8`/`:9`/`:48`/`:60` 五处在盘、档内自洽；变更记录 `:330`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | **AC-4 的复扫命令字面 = 已收正的初扫形**：AC-4（批档 `:174`）引 `git grep -n -E "AGENT-LOOP(\.md)? §[0-9]"`；§2.11（`:234`–`:237`）明定实现轮「唯一枚举命令」= `AGENT-LOOP(\.md)?[\` ]*§[0-9]`（超集）。按 AC-4 字面复扫与收正形不等价 ⇒「残余 = 0」两口径不同义；`:163` 反证针亦只投基础形串。 | AC-4 命令字面改指 §2.11 收正形（新形为超集，判据更强）；反证针串改用扩面覆盖形（如 `` `AGENT-LOOP.md` §11.2 ``）。批档 append-only 下以追加节收口亦可。 |
| 2 | Acceptance criteria（落地核验面） | 🟡 | **#292 落地件与记录不符**：§2.12（`:248`/`:250`/`:254`–`:256`）声明「按 §2.3-B 拟稿原样落地」「零改字」「逐字全等 ✅」，但 D-PS8 行：稿（`:147`）尾 =「见 §2.9-3）」vs 落盘（`PROMPT-SYSTEM.md:251`）=「见**批档 `docs/batches/2026-09-25-hygiene-items.md`** §2.9-3）」——多出限定串；§2.12 上抛条（`:262`）按「裸形…保留未动」描述，与在盘不符（在盘为限定形，指称对象可解析 ⇒「单看本档时不解析」前提不成立）。 | 按在盘实况收口：落地方 = 限定形（合「文档:节」引用形态 `common.md:107`，无需改档）；修正 `:254`–`:256` 的逐字/零改字声明与 `:262` 的裸形描述；若限定形系 §2.12 之后另笔引入，补记时点/来源。 |
| 3 | Document ownership（内部张力） | 🟡 | **② 列漂移例与落地表冲突**：§2.2.4（`:124`）记 `panel-turn-loop.mjs` 表载 `:154/:169` vs 实 `:150/:165`；落盘 §12 `aborted` 行（`WEBVIEW-PROTOCOL.md:366`）② 列 = `:154/:169`（= 被标为「表载（旧）」者），而 §2.10（`:224`）声明 ②③ 列「与提取器逐行同值」。二者必有一非：(a) 提取器 = `:150/:165` ⇒ 该行漏重出、AC-5 不成立；(b) 提取器 = `:154/:169` ⇒ 例句读数误。同句三处 ③ 例均已按「实」值落盘（`:366`/`:400`/`:402`），异常集中于 ② 例。 | 实跑 `node test/protocol-coverage.test.mjs --emit`（声明唯一权威）当场对判；留行或留例句，二择一收口（另一侧按「失效表达即删」处置）。 |
| 4 | Affected-file size annotations | 🟡 | 受影响文件表（`:160`）对唯一在列测试档 `thincoder-vscode/test/webview-turnstate.test.mjs` 标注 339 行（>300 档）+ 改述点 `:12-13` + 增量「逐处 ±0～±1 行」，但档位处置仅「逐档记（>300 登记 / >500 上报）」——无 >300 档所需**主动拆分审视 / 拆分规划**（档位判据 = `ADVISOR-CONVERGENCE.md:274`「>300 主动审视 / >500 必须拆——封口语义，无豁免通道」；核查维度 `:273`「超档拆分规划是否在」）；扫面命中档集亦仅「登记/上报」。 | 为该 339 行档补记档位处置（「结构不变 + 不拆理由」或拆分规划）；扫面档集以实现轮复扫清单逐档同上收口（>300 记 / >500 停）。 |
| 5 | Scope / coordination | 🟡 | **协调项**（设计已自抛 = §2.9-3 · KD-3）：新增 `PROMPT-SYSTEM.md` §6.1「批次收尾核对」与需求档 ②4「兑底核对清单四项」（`:280` 指针）在「批次收尾如何核」同面双载；设计以两轴不同立论判「不并」，需求侧（四项）未随之更新 ⇒ 两清单是否成两权威源待裁。 | 父侧出裁并记录：维持两轴 ⇒ 任一侧留「与 ②4 不相交」声明；并项 ⇒ 需求档同批改（计数联改）。 |
| 6 | Requirements coverage（族闭合 vs 枚举） | 🔵 | 「残余 = 0」为**枚举相对**：两式均要求名称与节号间仅反引号/空格 ⇒ **夹隔形**不被匹配；本批评审档面内即有 ≥5 处（`PROMPT-SYSTEM.md:96`/`:97`/`:106`/`:115`/`:137`/`:183`——`AGENT-LOOP.md` 的 §18 · `AGENT-LOOP` 指针（§18 / §25）· `AGENT-LOOP` 节号错位（§11.2 ↔ §9）· 旧 §12.4），既未入 §2.11 处置、亦不在 §2.2.3 排除面（对照：`WEBVIEW-PROTOCOL.md:327` 同类引用已按迁移期口径登记照留）。 | 二择一：分隔符放宽（如 `.{0,8}`）令复扫可见并逐处落三态；或以「夹隔形 = 记录性质」成类登记（照留 + 理由）入 §5 处置表。 |
| 7 | Doc hygiene | 🔵 | 两处记录面标签 / 理据不确：(a) §2.11（`:242`）把 `:60` 标作「§2.2 判据来源」——该行实住 §2.4（`ADVISOR-CONVERGENCE.md:56` 起；`:48` 才是 §2.2）；同误见 `ADVISOR-CONVERGENCE.md:330`「§2.2 两行」。(b) §2.11（`:234`）「初扫漏两形」之 ②「裸形 `AGENT-LOOP §N`」在初扫式下本已匹配（单空格字面）——真缺形 = 反引号邻接形；收正形为超集，扫描面无损。 | (a) `:60` 改标 §2.4（批档与 `ADVISOR-CONVERGENCE.md:330` 两处同改）；(b) 重述缺形归类（命令不变）。 |
| 8 | Doc hygiene（状态残留） | 🔵 | §2.9-1（`:214`）与 §2.4 #292 行（`:159`）仍以「未落笔…解冻后补写 / D5 冻结窗内 ⇒ 延后补写」在盘，而 §2.12（`:260`）已记解消（状态行已收正）——开放项清单缺收口标记（append-only 机制下只能后节收口）。 | 父侧在 §4/§6 落一笔「§2.9-1 已解 / 撤回」标记，免已死项被重当活办。 |

**计数**：🔴 0 · 🟡 5 · 🔵 3 · 域外注 2（无级）——不阻断通过。

**边界与限制**：EN 运行面 `thincoder-core/prompts/common.md` 按声明排除 ⇒ #295 事实前提（EN 无该句 / 163→164 行）本评审未验；域外未验 = 需求档 `docs/core/requirements/PROMPT-SYSTEM.md:60`（KD-1 依据）· `prompt-refs-zero.test.mjs` 导出 `lineHits` · `prompts-dual-source` T-CL1 · 两条 `--emit` 提取器与输出 · 改指靶 `AGENT-LOOP-ASYNC-POOL.md` §6.10/§6.19 · `webview-turnstate.test.mjs` 339 行读数；无项目标准档声明 / 无文档地图 ⇒ 方法论合规与 owning-doc 判据降级（按 AGENTS.md + 档内规范判）。

**域外注（无级）**：① AC-2 的 `git diff -- docs/core/design/prompts/common.md` = 空判据与排除面 `(notify_parent)` 微注同档——核验须排除该 hunk；② #284 射程 = §12/§13，邻接坐标面未扫（§3.2 `WEBVIEW-PROTOCOL.md:102` 载 `panel-index.mjs:27` vs §12 `:400` 载 `:29`；§5 `:206` 载 digest 起跑/收尾 `suspension.mjs:324`/`:336` vs §12 `digest` 行 `:375` 载 `:335/:347`）——未对提取器验，若实漂属后续 sweep 或应登记。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代执行 · 2026-09-25 全链授权口径）**

- **授权口径** = 2026-09-25「这七批都派出去」= 全链；代执行自缚三条件逐项核验：
  - ① 设计评审 **pass（轮 1 · 0🔴 / 5🟡 / 3🔵）** ✓；
  - ② 修正轮六项 **全落并读盘核验** ✓（§2.13 `:264-287`：AC-4 口径收正 · §2.12 时点归属（父侧笔补记）· ② 列行-例句对判（**行无误 · 例句收正**）· 档位处置 · 夹隔形类登记 · 标签更正——`ADVISOR-CONVERGENCE.md:330` 收正本席实读 ✓）；
  - ③ designToken **在效** ✓。
- **父侧裁决（两条）**：
  - **#5 协调项 → 维持两轴（不并）**：②4「兑底核对清单」= 模板 ↔ 落地同步轴；§6.1 新条 = 当批草案 ↔ 落地一致性轴——两不相交；**本行即声明面**（不改需求档、不改 §6.1）。
  - **#8 §2.9-1 收口标记**：该条已随 §2.12 解消（`:260` 在档）——**本行即撤回标记**（§2.9-1 / §2.4 `:159` 的「解冻后补写」不再作为活项）。
- **验证口径补记**：实施轮任何涉及 `docs/core/design/prompts/common.md` 的 `git diff` 空判据，须排除父侧 `(notify_parent)` 微注 hunk（2026-09-25 · 零语义）——以「本批引入面」为准。
- **域外实漂登记（承 §2.13 附 `:287`）**：`WEBVIEW-PROTOCOL.md` §3.2 `:102`（+2）/ §5 `:206`（+11）实漂确认——出本批射程，随后续 sweep 面处置。
- 据上：批⑤ 进入实施（eng-coder · 轮 1 = #295 EN 行 · 轮 2 = #285 码面 sweep；§5 实施记录由该档写）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（轮 1 #295 + 轮 2 #285（码面 + 档面活体指针 · fix 1 · 2026-09-25））

### 轮 1（#295 · CN 正本句补译 EN 一行 · eng-coder · 2026-09-25）

**交付摘要**：`thincoder-core/prompts/common.md` `## 证据纪律` 节尾整行追加（逐字 = §2.3-A）；CN 面（`docs/core/design/prompts/common.md`）零改。
落地读数：新行 `:32`（`:31` 节末句后 · `:33` 空行 · `:34` `## 文档写作纪律` 前）；档 163 → **164** 行；`##` 块 **14** 守恒。
本轮写面 = 该一档（+ 批档 §5 本段）；#285 码面 sweep = 轮 2，另行派单，本轮未做。

**逐条读数（实跑 · 现盘）**：

| 判据 | 命令 / 手段 | 读数 | 结论 |
|---|---|---|---|
| ① 逐字 = §2.3-A | 逐行 UTF-8 字节比对（现盘 `:32` ↔ 批档 `:133` 围栏稿） | 字节级全等（233 字符） | ✅ |
| ② 行宽 < 300 | 同上一并机读 | 233 < 300 | ✅ |
| ③ `##` 块 14 守恒 | `prompts-dual-source` T-CL1（`startsWith("## ")` 计数） | 14 | ✅ |
| ④ 两提示词锁 | `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs test/prompts-dual-source.test.mjs` | **tests 13 · pass 13 · fail 0** | ✅ |
| ⑤ CN 面零改 | `git diff -U0 -- docs/core/design/prompts/common.md` | 仅父侧 `(notify_parent)` 微注 hunk（`@@ -52 +52 @@`）——**排除后为空**；CN 档 123 行 / 14 块 / `:27` 母句在位 | ✅ |
| ④ 补 · cli 套件（§2.5 AC-2） | `cd thincoder-cli && npm test` | **tests 850 · pass 850 · fail 0**（48.2s） | ✅ |
| ⑥ doc-check 零新增红 | 入场对照 ↔ 复跑（`fc` 逐行比对） | **no differences encountered**（悬空 4 / 行宽 18 前后持平；本档零命中） | ✅ |
| ⑥ 补 · 记录面 / 参照树 / 夹具族零触 | `git status --porcelain`（CHANGELOG / `docs/batches` / `thincoder-{cli,vscode}/docs` / 夹具两档） | 夹具与参照树零命中；记录面仅本批/他批未跟踪批档 | ✅ |

**改动清单**：`thincoder-core/prompts/common.md:32`（+1 行 · 逐字 = §2.3-A）；`docs/core/design/prompts/common.md` 零改；`git diff -- thincoder-core/prompts/common.md` = 本轮 +1 行 hunk + 父侧预存 `(notify_parent)` hunk（非本轮）。

**审计与代码评审轮次（终态 = clean）**：

- **内部漂移审计（explore · 只读 · 1 轮 · 0 fix）**：四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**均无**——①逐字双侧锚定各 1 命中（EN `:32` ↔ 批档 `:133`）；②位置正确、节内三句零改；③CN 面本轮未触（mtime 早于本轮改写 · 123 行 / 14 块 / `:27` 在位）；④`##` 恰 14 · 164 行；⑤`lineHits` 谓词逐条零命中 · 行宽 ∈ [230,240)；⑥§2.4 影响表口径与实际相符。
- **内部代码评审（advisor · type=code · 同步 · 1 轮 · 0 fix）**：in-scope 问题 **0** · **VERDICT = pass**；域外注 3 条（见下）。

**域外注（登记 · 本席不改）**：

1. `doc-check` 行宽扫描域 = `checkConfig.scanDirs`（`PROJECT-MANIFEST.json` = `["docs"]`）⇒ **提示词运行面不在其射程**：§2.6 C6 的「EN 行 ≥300 ⇒ doc-check 行宽红」一支在现配置下不触发（`.md` 引用一支走 `prompt-refs-zero` 成立）——故 AC-1「行宽 <300」实为一次性核验判据，非常驻门。
2. `thincoder-cli/test/prompts-dual-source.test.mjs:44` / `:49` 把 `docs/_archive/design/prompts/persona-eng-designer.md` 标作「中文权威位」，而现行 CN 权威位 = `docs/core/design/prompts/`——既有标签滞后，供轮 2（#285 码面 sweep）参考。
3. CN 面零改的独立复核受限（实施工具面无 `git diff` 之外的手段亦无余量）——以 123 行 + `:27` 母句在位作弱证，与 §4 声明面一致。
4. 证据用临时档（未跟踪 · 不入交付面 · 供父侧 §6 复核或清理）：`.tmp-hyg-doccheck-{baseline,after}.txt` · `.tmp-hyg-prompt-tests.txt` · `.tmp-hyg-cli-suite.txt`。

### 轮 2（#285 死指针「另族」批量 · 码面 + 档面活体指针 sweep · eng-coder · 2026-09-25）

**交付摘要**：按 §2.2.3 扫描面 + §2.11 收正形命令全树复扫（域 = `thincoder-core` / `thincoder-cli` / `thincoder-vscode` / `docs`），逐命中三态处置（就地）；点名的 `thincoder-vscode/test/webview-turnstate.test.mjs` 忙态旧措辞按 §2.3-C 收正；命中档集逐档档位收口。**零行为变化**（纯注释 / 测试标题 / 档面指针行；零断言改动 / 零新增用例 / 零新增机检门）。

**复扫读数（唯一口径命令 = 收正形 `git grep -n -E "AGENT-LOOP(\.md)?[\` ]*§[0-9]"`）**

| 时点 | 原始命中 | 扣排除面后 | 命中档数 |
|---|---|---|---|
| 开跑 | **725 行** | **194 行 / 200（行×节）对** | 89 |
| 收尾复扫 | **651 行** | **120 行 / 126 对** | 53 |

- 排除面开跑读数（照留 · 不判红）：批次档 216 行 · `**/_archive/**` 279 · `**/CHANGELOG.md` 33 · 产品参照树 1 · 夹具行 2 = **531 行**（= 725 − 194 自洽）。
- **处置差量**：命令可见面净减 **74 行 / 74 对**；另有 **13 对**改指后仍命中（新靶 = 现档活节 §6.13 / §6.14 / §6.15 / §6.18）⇒ 计入收尾读数、属「活指针」类。合计处置命中 **87 对**。
- **残余 = 0（死指针口径）**：收尾 126 对逐处核为——活指针（靶节在盘）/ 登记沿革行（映射表 / 不并项登记 / 变更记录 / J-1 残差登记）/ 归档档指向 / 参照树指向；**唯一登记保留 1 处**（`thincoder-core/agent-tools/subagent-run.mjs:168`，两候选不可唯一——见下）。裸形（无档名）旧编号面 = **族外**（承 `DOC-DISCIPLINE.md` §3.9 J-1「裸形面 = 另轮读数域」），本轮不并入判据、随本段登记。

**族 → 现行家映射（本轮实读确认后落用）**：§7.x → `AGENT-LOOP-SUBAGENT.md` §6.7.2 / §6.7.3 / §6.7.5 / §6.7.6（D-M6/D-M7/D-A1 等决策编号作标签保留）· §9 / §17 → `AGENT-LOOP-ASYNC-POOL.md` §6.8（+ §6.20）· §10 / §20 / §21.1 / §28 R26 → 同档 §6.9（调度器 / 停滞检测 / 父侧文件拦截同节）· §11.1 / §11.2 → 同档 §6.10 · §18 → 同档 §6.11 · §12.1/§12.2 → 同档 §6.18/§6.19 · §13 / §18.6 / §23.3.2 → `TRACES.md` §6.1 / §6.2 / §7 · §14 / §25 → `CONSULTATION.md` §6.2/§6.3 ∥ `ESCALATE.md` §5 · §19 → `AGENT-LOOP.md` §6.17（门文案面 = §6.7.2，既有先例在案）· §20.3 → §6.12 · §21 → §6.13 · §22 → §6.14 · §23 / §23.3.1 → §6.15 · §7.2 / §7.2.1（显示 / 面板面）→ `docs/cli/design/TUI.md` §6.8 · §16 / §18.14 / §24 / §29 / §7.7.1（无同题名节或批材料面）→ 改述。

**处置表 A（改指 / 改述 · 逐处：file:line → 态 → 依据）**

*CLI 面（10 处）*

| file:line | 态 | 依据（一句话） |
|---|---|---|
| `thincoder-cli/src/tui/display-budget.mjs:6` | 改指 | §23.3.1（文本额度单源）→ `AGENT-LOOP.md` §6.15（同题名节：`capText`/`appendCappedText` 单源句在盘） |
| `thincoder-cli/src/tui/fold-block.mjs:10` | 改指 | §7.2 D4（子 agent 活动区块）→ `docs/cli/design/TUI.md` §6.8（显示契约现行家） |
| `thincoder-cli/src/tui/interaction.mjs:83` | 改述 | §16 D-B1 = 批权限询问（现档无 §16）⇒ 去档名 + §号，保 `D-B1` 标签 |
| `thincoder-cli/src/tui/layout.mjs:8` | 改指 | §7.2.1（固定底部面板）→ `TUI.md` §6.8 |
| `thincoder-cli/src/tui/layout.mjs:11` | 改述 | 同行裸形 §7.2 D4/D6（同注释块同指）⇒ 去指称（留「unchanged / abolished」语义） |
| `thincoder-cli/src/tui/subagent-blocks.mjs:2` | 改指 | §7.2 D4 → `TUI.md` §6.8 |
| `thincoder-cli/src/tui/subagent-panel.mjs:2` | 改指 | §7.2.1 D1/D2 → `TUI.md` §6.8 |
| `thincoder-cli/src/tui/subagent-panel.mjs:8` | 改述 | 同行裸形 §7.2 D4（同注释块同指）⇒ 去指称 |
| `thincoder-cli/src/tui/suspension-drive.mjs:7` | 改述 | §9 D-S1..S9 = 旧决策编号（无现行家）⇒ 去之，保 `AGENT-LOOP-ASYNC-POOL.md` §6.8（同行已在位）+ 日期 `2026-09-02` |
| `thincoder-cli/src/tui/suspension-drive.mjs:12` | 改指 | 「状态机行表」§9.2 → `AGENT-LOOP-ASYNC-POOL.md` §6.8（状态机行表在盘） |

*CLI 测试面（12 处）*

| file:line | 态 | 依据 |
|---|---|---|
| `thincoder-cli/test/abort-provenance.test.mjs:3` | 改述 | §20.7（用例表 = 批材料，未迁）⇒ 去之，保「第 24 批…T-AP1–T-AP8」批次锚 |
| `thincoder-cli/test/async-settle.test.mjs:115` | 改指 | §10（调度器）→ `AGENT-LOOP-SUBAGENT.md` §6.9（补位 / 释放槽语义在盘） |
| `thincoder-cli/test/helpers/long-report.mjs:2` · `memory.mjs:2` · `mock-llm.mjs:2` · `wait-for.mjs:2` | 改述 | §18.14 D-T1.6（无该节、无该决策编号）⇒ 去指称，保「shared test helper + 出现次数」语义 |
| `thincoder-cli/test/hooks-stop.test.mjs:2` | 改指 | §21（Stop 钩子）→ `AGENT-LOOP.md` §6.13（同题名节） |
| `thincoder-cli/test/prompts-async-guidance.test.mjs:53` | 改指（路径） | 标题旧路径 `docs/design/AGENT-LOOP.md` 在盘不存在 ⇒ 改指 `docs/_archive/design/AGENT-LOOP.md` §14.2（与测试体 `:54` 实读同址；§14.2 在归档档在盘） |
| `thincoder-cli/test/subagent-memory-bounds.test.mjs:2` | 改指 | §23（子代理族内存上界）→ `AGENT-LOOP.md` §6.15 |
| `thincoder-cli/test/subagent-observe-send.test.mjs:204` | 改指 | §18（advisor 池接入面）→ `AGENT-LOOP-ASYNC-POOL.md` §6.11 |
| `thincoder-cli/test/trace-bounds.test.mjs:2` | 改指 | §23.3.2（轨迹面契约）→ `TRACES.md` §6.2（写入代价形态） |
| `thincoder-cli/test/wait-for-advisor-pool.test.mjs:4` | 改指 | §18.3/§18.6/§18.7（契约 / 用例表 / AC 表）→ `AGENT-LOOP-ASYNC-POOL.md` §6.11（接入面；用例 / AC = 批材料面去之） |
| `thincoder-cli/test/wait-for-advisor-pool.test.mjs:5` | 改指（路径） | 需求档 `docs/requirements/AGENT-LOOP.md` §4（F-B2）→ `docs/core/requirements/AGENT-LOOP.md` §4（F-B2 在盘 :68） |

*CORE 面（33 处）*

| file:line | 态 | 依据 |
|---|---|---|
| `thincoder-core/abort-provenance.mjs:2` · `:15` · `:68` | 改指 | §20.3（abort 词汇表 / 死亡行）→ `AGENT-LOOP-SUBAGENT.md` §6.12（同题名节：trigger 表 / 死亡行形态在盘） |
| `thincoder-core/abort-provenance.mjs:5` · `:75` | 改述 | 同行 / 同注释块裸形 §20.3（形态③ / ④）⇒ 改指同靶（防半改致歧） |
| `thincoder-core/advisor/loop.mjs:207` | 改述 | §18.7 D-TS7（无该节 / 该编号）⇒ 去指称，保 `B1` 批锚 + 语义句 |
| `thincoder-core/advisor/messages.mjs:18` · `:19` | 改指 | §18.8（评审对象锚）→ `AGENT-LOOP-ASYNC-POOL.md` §6.18（机械声明块在盘）；D-OA2 随死指称去 |
| `thincoder-core/agent-tools/async-settle.mjs:196` | 改指 | §10（补位不变式）→ `AGENT-LOOP-SUBAGENT.md` §6.9 |
| `thincoder-core/agent-tools/consult.mjs:4` | 改指 | §25 D-R17a（会诊工具）→ `CONSULTATION.md` §6.3（工具契约） |
| `thincoder-core/agent-tools/consult.mjs:135` | 改指 | §25（R17 settle 路由）→ `CONSULTATION.md` §6.2（R17 现行机制） |
| `thincoder-core/agent-tools/digest-budget.mjs:2` | 改指 | §22（digest 预算语义源）→ `AGENT-LOOP.md` §6.14 |
| `thincoder-core/agent-tools/escalate-async.mjs:2` | 改指 | §25 D-R17b（飞刀）→ `ESCALATE.md` §5（async 现行机制） |
| `thincoder-core/agent-tools/escalate-async.mjs:151` | 改指 | §15 D-A1（async 取号先例）→ `AGENT-LOOP-SUBAGENT.md` §6.7.3 |
| `thincoder-core/agent-tools/spawn-gates.mjs:71` | 改指 | §28 R26（父侧维护文件黑名单）→ `AGENT-LOOP-SUBAGENT.md` §6.9（同节含 R26 行） |
| `thincoder-core/agent-tools/subagent-run.mjs:42` | 改指 | §15 D-A1/D-A6（async 分支）→ §6.7.3 |
| `thincoder-core/agent-tools/subagent-run.mjs:47` | 改指 | 裸形 §11.1 D-24a/R14（分域池）→ `AGENT-LOOP-ASYNC-POOL.md` §6.10（防半改） |
| `thincoder-core/agent-tools/subagent-run.mjs:83` | 改指 | §20 D-SD2（域元数据）→ `AGENT-LOOP-SUBAGENT.md` §6.9 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs:4` | 改指 | §20 / §21.1（调度器 / 停滞检测与环形死锁）→ §6.9（两题同节） |
| `thincoder-core/agent-tools/subagent-scheduler.mjs:27` | 改指 | §20（调度器节标题）→ §6.9；旧子项「20.4 处置注」随去 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs:45` | 改指 | §28（R26 英文模板）→ §6.9「父侧文件拦截（R26）」 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs:179` | 改指 | §21.1 P-SL2（停滞检测）→ §6.9 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs:365` | 改指 | §15 / §20 / §11.1（补位三源）→ §6.7.3 / §6.9 / `ASYNC-POOL` §6.10 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs:2` · `:6` · `:38` · `:41` · `:42` · `:367` · `:369` | 改述 | 同档裸形旧编号（§20 / §21.1 / §20.8 / §28 F-R26b / §11.1）⇒ 去指称（同档已改指，防半改） |
| `thincoder-core/agent-tools/subagent-spawn.mjs:20` · `:342` | 改指 | §23.3.1 → `AGENT-LOOP.md` §6.15 |
| `thincoder-core/agent-tools/subagent-spawn.mjs:177` | 改指 | §20 D-SD1/D-SD3（准入）→ §6.9 |
| `thincoder-core/agent-tools/subagent-spawn.mjs:184` | 改述 | 同档裸形 §20（准入函数头注）⇒ 去指称 |
| `thincoder-core/agent-tools/subagent-spawn.mjs:405` | 改指 | §7.2 D3（relay 管线）→ `AGENT-LOOP-SUBAGENT.md` §6.7.2（承死名批先例映射） |
| `thincoder-core/agent-tools/subagent-spawn.mjs:408` | 改指 | §15 D-A1（取号）→ §6.7.3 |
| `thincoder-core/agent-tools/subagent.mjs:303` | 改指 | §7.2（机制文）→ §6.7.2 |
| `thincoder-core/agent.mjs:120` | 改指 | §23.3.1 消费点② → `AGENT-LOOP.md` §6.15 |
| `thincoder-core/agent.mjs:220` | 改指 | §7.2（⟦ev⟧turn 发射点）→ §6.7.2 |
| `thincoder-core/agent/dispatch.mjs:15` · `:121` · `:18` · `:119` | 改述 | §29（mutation-seq 记账修复——现档无该节）⇒ 去档名 + §号，保 `fix A` 标签 + 日期 `2026-09-07` |
| `thincoder-core/agent/dispatch.mjs:296` | 改指 | §7.2（等待审批广播）→ §6.7.2 |
| `thincoder-core/agent/record-results.mjs:81` | 改述 | §29（同上）⇒ 去指称 + 保日期 |
| `thincoder-core/agent/run-stages.mjs:22` | 改指 | §21（Stop 钩子）→ `AGENT-LOOP.md` §6.13 |
| `thincoder-core/agent/run-stages.mjs:167` | 改指 | §25 D-R17a（会诊跨回合）→ `CONSULTATION.md` §6.2 |
| `thincoder-core/agent/run-stages.mjs:174` | 改指 | §15 D-A3 → `AGENT-LOOP-SUBAGENT.md` §6.7.3 |
| `thincoder-core/agent/spawn-child.mjs:2` | 改指 | §7.2 D3（统一生成管线）→ §6.7.2 |
| `thincoder-core/agent/spawn-child.mjs:38` | 改指 | §18 D-E3（工程子代理内部 spawn 门）→ `AGENT-LOOP-SUBAGENT.md` §6.7.6（受限通道条在盘） |
| `thincoder-core/agent/spawn-child.mjs:181` | 改指 | §23.3.1（捕获额度）→ `AGENT-LOOP.md` §6.15 |
| `thincoder-core/agent/suspension.mjs:146` | 改指 | §9 / §7（状态机行表来源）→ `AGENT-LOOP-ASYNC-POOL.md` §6.8 |
| `thincoder-core/auto-think.mjs:84` | 改指 | §18.7（logCtx 字段集 = 轨迹面）→ `TRACES.md` §6.1（元数据字段） |
| `thincoder-core/explore-distill.mjs:2` | 改述 | §13（轨迹存档——与蒸馏题不符、无同题节）⇒ 去之，保 `CONTEXT-COMPACTION.md` §6.9 H1（已同行在位）+ 日期；两行并一行（−1 行） |
| `thincoder-core/provider/core.mjs:81` | 改指 | §18.6（轨迹采集点唯一）→ `TRACES.md` §6.1（采集点唯一句在盘） |
| `thincoder-core/text-budget.mjs:2` | 改指 | §23.3.1 → `AGENT-LOOP.md` §6.15 |
| `thincoder-core/traces/trace-store.mjs:2` | 改指 | §18.6（完整轨迹存档 + D-TR*）→ `TRACES.md` §6 机制 + §7 决策 D-TR1–TR8 |

*VSC 面（16 处）*

| file:line | 态 | 依据 |
|---|---|---|
| `thincoder-vscode/src/agent/execute-tools.mjs:264` | 改述 | §29（mutation-seq 记账）⇒ 去档名 + §号，保 `fix A` + 日期 `2026-09-07` |
| `thincoder-vscode/src/agent/run-stages.mjs:333` | 改指 | §15 D-A3（回合尾处理）→ `AGENT-LOOP-SUBAGENT.md` §6.7.3 |
| `thincoder-vscode/src/explore-distill.mjs:4` | 改述 | §13（同 core：与蒸馏题不符）⇒ 去之，保 `CONTEXT-COMPACTION §5` |
| `thincoder-vscode/src/extension/panel-chat.mjs:5` | 改述 | §7 D-S1..S9（旧决策编号）⇒ 去之，保 `AGENT-LOOP-ASYNC-POOL.md` §6.8（同行在位）+ 日期 |
| `thincoder-vscode/src/extension/suspension.mjs:2` | 改述 | §7 D-S2/D-S9 ⇒ 去之，保 §6.8（同行在位） |
| `thincoder-vscode/src/extension/suspension.mjs:7` | 改指 | 「状态机行表」§7 → `AGENT-LOOP-ASYNC-POOL.md` §6.8 |
| `thincoder-vscode/test/async-parity.test.mjs:3` · `:4` · `:5` | 改述 + 改指 | §12 / §15（VSC 档保真 / advisor 池中止；内容 = 批材料——§8.2 已登记）⇒ 去死指针；机制现行面改指 `AGENT-LOOP-SUBAGENT.md` §6.7.3 / `AGENT-LOOP-ASYNC-POOL.md` §6.20；批次档指针原样保留 |
| `thincoder-vscode/test/child-permission.test.mjs:3` | 改指 | §18（child permission gate，VSC 档）→ `docs/core/design/AGENT-LOOP.md` §6.18（VSC 接线面 child gate 行） |
| `thincoder-vscode/test/child-permission-wiring.test.mjs:6` | 改指 | 同上 |
| `thincoder-vscode/test/eng-settlement.test.mjs:311` | 改指 | §16 D-DG2（digest 预算四族接线）→ `AGENT-LOOP.md` §6.14 |
| `thincoder-vscode/test/md-render-escape.test.mjs:4` | 改述 | CLI 仓 `docs/requirements/AGENT-LOOP.md` §10（在盘不存在；F-H* 无现行家）⇒ 去之，保需求编号 F-H1~F-H4 / N-H1~N-H4（批材料标） |
| `thincoder-vscode/test/files.mjs:14` | 改述 | §18.6（CLI 对拍——用例表面）⇒ 去之，保「第 10 批…T-B4/T-B5」 |
| `thincoder-vscode/test/files.mjs:33` | 改指 | §7.7.1（顶层一律异步）→ `AGENT-LOOP-SUBAGENT.md` §6.7.5（同题名节） |
| `thincoder-vscode/test/files.mjs:62` | 改述 | §12（async 保真 = 批材料）⇒ 去之，保「第 35 批…T-D1~T-D10」 |
| `thincoder-vscode/test/subagent-observe-send.test.mjs:193` | 改指 | §18 → `AGENT-LOOP-ASYNC-POOL.md` §6.11 |
| `thincoder-vscode/test/wait-for-advisor-pool.test.mjs:4` · `:5` | 改指 | §18.3/§18.6/§18.7 → §6.11；需求档路径 → `docs/core/requirements/AGENT-LOOP.md`（与 CLI 侧同形） |
| `thincoder-vscode/test/webview-turnstate.test.mjs:12-14` | 改述 | **点名项**：删「与拒发同判据」旧口径，改现口径 = busy 提交入队受理（容量 8）+ 待发送标记；满队（第 9 条）⇒ 拒发 toast + 文本保留（源 `webview/send.js:32-56` 实读）；⑤ 尾段行为语义零改（Send 按钮 running 期隐藏 / susp-idle 恢复 flex） |

*档面（9 处 · live 指针）*

| file:line | 态 | 依据 |
|---|---|---|
| `docs/core/design/CONSULTATION.md:99` | 改指 | 「机制本体 → 本层 `AGENT-LOOP.md` §6.7.3 / §6.8」→ 现住档 `AGENT-LOOP-SUBAGENT.md` §6.7.3 / `AGENT-LOOP-ASYNC-POOL.md` §6.8 |
| `docs/core/design/CONSULTATION.md:187` | 改指 | 同上（§6.7.3） |
| `docs/core/design/DOC-MIGRATION.md:34` | 改指 | 「机制结论已全文入 … §6.7.3」→ 现住档 `AGENT-LOOP-SUBAGENT.md` |
| `docs/core/design/DOC-MIGRATION.md:64` | 改指 | 「契约正文已入 … §6.7.2」→ 同上 |
| `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:44` · `:78` · `:94` · `:149` · `:150` | 改指 | 五处「机制结论 / 契约正文已由 … §6.7.3 / §6.7.2 承载」→ 现住档 `AGENT-LOOP-SUBAGENT.md`（旧档行号括注随去） |

**处置表 B（照留类 · 收尾 126 对逐处归属）**

| 类 | 处数 | file:line（收尾读数） | 依据 |
|---|---|---|---|
| 活指针（靶节在盘） | ~93 | 代码 / 档面：`AGENT-LOOP.md` §2.3 / §6.2 / §6.3 / §6.13–§6.18 · `AGENT-LOOP-SUBAGENT.md` §6.7.2 / §6.9 / §6.23 / §6.29.x · `AGENT-LOOP-ASYNC-POOL.md` §6.8 / §6.10 / §6.20 · `AGENT-LOOP-UPSTREAM.md` §6.27 · `TRACES.md` §6.15 · 需求档 §4.x（含 F-B2 / F-UC7 / F-UC8） | 靶节实读在盘（§2.2.3「判死判据」反面）——不入族 |
| 登记 / 沿革行（定义性引用行） | ~24 | `DOC-DISCIPLINE.md:371` / `:392` / `:403`–`415`（J-1 射程表）/ `:1047` / `:1105`（J-1 残差块 + 处置表）· `AGENT-LOOP-SUBAGENT.md:449` / `:515`（域外登记）· `CONSULTATION.md:236` / `:249` · `ESCALATE.md:151` / `:158` · `TRACES.md:128` / `:135` / `:143` · `docs/core/requirements/TRACES.md:67` / `:75` · `CONTEXT-COMPACTION.md:722` · `CORE-UNIFICATION.md:1846` / `:1850`–`:1852` · `TUI-INPUT-BOX.md:373` / `TUI-SESSION-VIEW.md:218` / `TUI.md:744` · `ADVISOR-CONVERGENCE.md:330` · `DOC-MIGRATION.md:31` / `:43` | 映射表 / 不并项登记 / 变更记录行（父侧「不触定义性引用行」令）——旧 §N 在此为**被定义对象**，改写即毁映射语义 |
| 归档档 / 参照树指向 | ~8 | `docs/TODO-archive.md:171`–`:173`（VSC 参照树需求档）· `docs/vsc/requirements/WEBVIEW.md:45`（`_archive` 来源注）· `thincoder-cli/test/prompts-async-guidance.test.mjs:53`（`docs/_archive/design/AGENT-LOOP.md` §14.2 = 测试实读对象）· `ESCALATE.md:151`（CLI 树旧档引例） | 指向 `_archive` / 产品参照树（排除面）——靶在盘可解析 |
| 夹隔形（类登记 · 父侧已裁「照留」） | 抽样 | `thincoder-vscode/test/files.mjs:77` / `:78`（`AGENT-LOOP.md VSC §18`）· `PROMPT-SYSTEM.md:96` / `:97` / `:106` / `:115` / `:137` / `:183`（§2.13 #6 已裁） | 名与节号间夹非〔反引号 / 空格〕字符——收正形正则不匹配；复扫正则不宽（父侧裁）+ 类登记在案 |
| 裸形旧编号（族外 · 登记 · 另轮读数域） | ~60 行 / ~20 档 | 抽样：`thincoder-cli/src/tui/suspension-drive.mjs:45` / `:69` / `:75` / `:89` / `:300` · `thincoder-cli/test/hooks-stop.test.mjs:6` / `:70` / `:86` / `:99` · `thincoder-core/abort-provenance.mjs:19` / `:78` / `:96` / `:111` · `thincoder-core/agent-tools/subagent-scheduler.mjs:3` / `:105` / `:134` / `:162` / `:188` / `:242` / `:274` / `:275` / `:277` / `:295` / `:307` / `:340` · `subagent.mjs:14` / `:17` / `:74` / `:105` / `:107` / `:275` / `:286` / `:389` / `:405` · `consult.mjs:32` / `:36` / `:186` / `:222` / `:285` / `:289` / `:302` / `:467` 等 | 「同行 / 同档裸 §」不含档名 ⇒ **不入本轮唯一口径**；`DOC-DISCIPLINE.md` §3.9 J-1 明定「裸形面 = 另轮读数域」（先例：死名批改指后仍留裸形 token）。本轮只收正**同注释块内**裸形同指（13 处，防半改致歧）；余面登记，随族扩面轮 |

**处置表 C（判保留 + 登记 · 1 处）**

| file:line | 态 | 依据 |
|---|---|---|
| `thincoder-core/agent-tools/subagent-run.mjs:168` | 判保留 + 登记 | `AGENT-LOOP.md §2`（「2026-09-02 unified rule」）：两候选不可唯一——① 现行 §2「核模块裁决行」∥ ② 旧 §2（runAgent 主循环）→ 现行 §6.2；按 KD-5「两候选不可唯一 ⇒ 判保留 + 登记」（错指 > 死指），**不猜改指** |

**档位收口（命中档集 · 源码 / 测试档；文档档零标注义务——`ADVISOR-CONVERGENCE.md:273` 明文「文档档零标注义务」）**

- **>500 = 0 档**（源码 / 测试面；最接近 = `thincoder-core/agent/dispatch.mjs` 499 行——**他批在飞档**（guard-scheduler 批面，余量 1 行），本席零行数增删 ⇒ 未越硬限，无需停报；其拆分计划已在 `docs/batches/2026-09-25-guard-scheduler.md` §2 在册）。
- **>300 档 19 档 · 逐档「不拆理由」**：`core` = `agent-tools/{subagent.mjs 419, subagent-spawn.mjs 438, consult.mjs 471, escalate-async.mjs 302, subagent-scheduler.mjs 445}` · `agent/{dispatch.mjs 498, agent.mjs 442}` · `provider/core.mjs 491`；`cli` = `src/tui/{subagent-blocks.mjs 453, suspension-drive.mjs 341}` · `test/{subagent-observe-send.test.mjs 330, async-settle.test.mjs 411}`；`vscode` = `src/agent/{execute-tools.mjs 419, run-stages.mjs 421}` · `src/extension/suspension.mjs 447` · `test/{async-parity.test.mjs 492, child-permission.test.mjs 367, eng-settlement.test.mjs 336}`。
  **统一不拆理由**：① 本轮对诸档**零行数变更**（逐行替换，行数守恒）——拆分属「结构变更」，出 #285 纯指针 sweep 射程（§2.8「不新增机检门 / 不改既有判据」同向）；② 各档 <500 硬限，且多数已在既有登记面（`thincoder-core/**` 之 >300 档在 `core-hygiene.test.mjs` `SOFT_LINE_REGISTRY` 在册；VSC / CLI 侧为 advisory）；③ 拆分触发口径沿用既有「触发式 · 不预拆」（越 500 或下次实质触碰）。
- 点名档 `thincoder-vscode/test/webview-turnstate.test.mjs` **339 行**（read 口径）——本轮已触（头注改述）；档位处置承 §2.13 #4 收口 = **结构不变（不拆）**（单场景单夹具，6 用例共享同一 happy-dom 装配；拆档须复制夹具或引 helper，成本 > 收益）；339 < 500 ⇒ 未触拆分义务。

**域外注（登记 · 本席不改）**

1. **同族邻面（`TUI.md` 旧编号）**：`thincoder-core/text-budget.mjs:2` / `thincoder-cli/src/tui/display-budget.mjs` 等 8+ 档引 `TUI.md §15.x`（旧 TUI 档节号）——现行 `docs/cli/design/TUI.md` 为 §1–§8，诸靶不可解析；**非本批族**（非 AGENT-LOOP 引用）⇒ 出本笔射程，建议另族 sweep（台账候选）。
2. **`docs/TODO-archive.md:263` 档名错位**：该行载 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20——§6.20 实住 `AGENT-LOOP-ASYNC-POOL.md`（名错位）；因 `-SUBAGENT` 紧邻 ⇒ 唯一口径命令不匹配（族外），且该档 = 归档记账面 ⇒ 照留 + 报父侧。
3. **`docs/TODO.md:50` 行坐标漂移**：`AGENT-LOOP.md §6.3:215/226` —— 节号活（§6.3 在盘），但行坐标 as-of 今读约 `:233` 起 ⇒ 指针可用于节号、不可用于行号（登记）。
4. **临时证据档（未跟踪 · 不入交付面 · 供父侧复核或清理）**：`.tmp-hyg2-scan-initial.txt` · `.tmp-hyg2-scan-after.txt` · `.tmp-hyg2-scan-final.txt` · `.tmp-hyg2-kept.json` · `.tmp-hyg2-mydiff.txt` · `.tmp-hyg2-core-test.txt` · `.tmp-hyg2-cli-test.txt` · `.tmp-hyg2-cli-test2.txt` · `.tmp-hyg2-vsc-test.txt` · `.tmp-hyg2-vsc-test2.txt` · `.tmp-hyg2-wt-test.txt` · `.tmp-hyg2-doccheck.txt`。

**审计与代码评审轮次（终态 = clean）**

| 轮 | 类型 | 结果 | 处置 |
|---|---|---|---|
| 1 | 内部偏离审计（explore · 只读） | **2 项 PARTIAL**：① 点名项 `webview-turnstate.test.mjs:12-13` 本轮未触（🔴）· ② `prompts-async-guidance.test.mjs:53` 标题旧路径死指针未处置（🟡）；另 1 类 D 面（裸形半更新）与 1 项记录面（§5 未写）如实报告 | 当轮修：① 按 §2.3-C 逐字口径改述（源 `send.js:32-56` 实读核对）· ② 改指 `docs/_archive/design/AGENT-LOOP.md` §14.2（与测试体同址）；D 面 = 登记（族外·另轮读数域）；§5 = 本段 |
| 2 | 内部代码评审（advisor · type=code · 同步） | 见下「代码评审」小节 | 见下 |

**代码评审（advisor · type=code）读数（后补）**：〔由本段后续追加 / 或见父侧 §6〕

**fix 轮 1（审计 / 评审驱动 · eng-coder · 2026-09-25 · 上限 5 内）**

触发 = 内部偏离审计（explore · 1 轮）+ 内部代码评审（advisor · `type=code` · 1 轮，**VERDICT: pass**）。逐项处置：

| # | 来源 | 发现 | 处置 |
|---|---|---|---|
| 1 | 审计 🔴 | 点名项 `thincoder-vscode/test/webview-turnstate.test.mjs:12-13` 本轮未触 | **已修**：按 §2.3-C 改述（旧串「与拒发同判据」删；现口径 = busy 提交入队受理（容量 8）+ 待发送标记 · 满队（第 9 条）⇒ 拒发 toast + 文本保留；源 `webview/send.js:32-56` 实读核对）；⑤ 尾段行为语义零改 |
| 2 | 审计 🟡 | `thincoder-cli/test/prompts-async-guidance.test.mjs:53` 标题路径死指针（`docs/design/AGENT-LOOP.md` 在盘不存在） | **已修**：改指 `docs/_archive/design/AGENT-LOOP.md` §14.2（与测试体 `:54` 实读同址；§14.2 在归档档在盘） |
| 3 | 评审 🟡 | `thincoder-core/traces/trace-store.mjs:2` 改指后带入**目标档不存在的决策编号区段**——`TRACES.md` §7 实为 D-TR1–4 · D-TR6 · D-TR10–13（`:109`–`:116` 逐行实读），`D-TR5` / `D-TR7` / `D-TR8` 全仓零定义 | **已修**：`D-TR1–TR8` → `D-TR1–4 / D-TR6 / D-TR10–13`（本行 = fix 轮唯一改字处） |
| 4 | 评审 🟡 | §2.6 C2 明定「反证针红/绿两轮落 §5」——动作已做、**记录面缺项** | **已补**：见下「反证针读数」 |
| 5 | 评审 🔵 | 表 B「活指针」行误标 `TRACES.md` §6.15（该档 §6 仅至 §6.4；全仓无命中指向该靶） | **收正**（本块）：`TRACES.md:50` / `:137` 两行为在盘活指针，其靶 = **`AGENT-LOOP.md` §6.15**（非 TRACES.md 本档节号）——表 B 该处**档名归属误**，靶节以本块为准 |
| 6 | 评审 🔵 | 记录面行数基准漂移（表内 `dispatch.mjs 498` 与同行文 499 自相矛盾；点名档记 339 / 现读 340；全表普遍 +1） | **收正**（本块）：行数现读口径 = read 工具（表内诸值 **+1**）；`thincoder-core/agent/dispatch.mjs` **499**（他批在飞档，余量 1）· `thincoder-vscode/test/webview-turnstate.test.mjs` **340**。阈值面零变化（全部 <500；>300 集合不变） |
| 7 | 评审 🔵 | 族外残留（`thincoder-vscode/test/md-render-escape.test.mjs:3` 产品参照树死路径 · `thincoder-core/abort-provenance.mjs:19` / `thincoder-vscode/src/extension/suspension.mjs:12` 裸形同指） | **登记照留**（族外：前者非 AGENT-LOOP 引用、后者属裸形面 = 另轮读数域）——随本段域外注并案交下轮 |

**反证针读数（§2.6 C2 补齐 · 2026-09-25）**

- **针法**：夹具档 `thincoder-vscode/test/agent-tools-registry.test.mjs` 末行临时投放**扩面覆盖形**串（§2.13 #1 收正形；非初扫形）：`// needle（临时反证针——扫描灵敏度核验后即撤回）: \`AGENT-LOOP.md\` §11.2`（插入后 = 该档 `:107`）。
- **红轮**（投放后复扫 · 收正形命令）：报出 `thincoder-vscode/test/agent-tools-registry.test.mjs:107: … \`AGENT-LOOP.md\` §11.2` ⇒ **扫描非空转**（反引号邻接形可匹配）。
- **绿轮**（撤回后）：`git status --porcelain -- <该档>` = **空** · `find /c /v ""` 回 **106** 行 · `grep needle` 零命中 ⇒ **0 diff**（夹具判据样本 `:96/:101` 全程未动）。

**fix 轮后复验读数**

| 项 | 读数 |
|---|---|
| 复扫（收正形 · 收尾终读） | 原始 **651** 行 · 扣排除面 **120 行 / 126 对 / 53 档**（与 fix 前逐值一致——收正字零计数连带） |
| 三包套件 | core **663/663** · cli **850/850** · vsc **987/987**（fail 0 · cancelled 0） |
| 定点复验 | `node --test thincoder-vscode/test/webview-turnstate.test.mjs` ⇒ **6/6 · fail 0**；本轮改动档 `node --check` 全绿 |
| doc-check | 悬空 **4** / 行宽 **18**（本席改动行零命中——两数为存量 B 类，与轮 1 读数持平；row-level 归因已逐条核） |
| 记录面 / 参照树 / 夹具族 / `_archive` / CHANGELOG | `git status --porcelain` **零命中**（除父侧未跟踪批档） |
| 谱系读数 | 起跑 725 行 → 收尾 651 行；排除面 531 行（批次档 216 · `_archive` 279 · CHANGELOG 33 · 参照树 1 · 夹具行 2） |

**留父侧（本笔未行 / 待裁）**：① 裸形面（~60 行 / ~20 档 · 族外）与「TUI.md 旧编号族」（域外注 1）= 下轮 sweep 候选（本笔按 `DOC-DISCIPLINE.md` §3.9 J-1「裸形面 = 另轮读数域」照留）；② `docs/TODO-archive.md:263` 档名错位（域外注 2）与 `docs/TODO.md:50` 行坐标漂移（域外注 3）——两处族外、登记在案；③ #292（D-PS8）与 #284 表列 = 设计侧面，本笔未触。

（回填：本段上方「代码评审（advisor · type=code）读数（后补）」占位行 = 已由「fix 轮 1」块回填——VERDICT: pass + 逐项处置见该块。终态 = **clean**：审计 1 轮 / 代码评审 1 轮 / fix 轮 1（上限 5 内），无未修 must-fix、无 🔴。）

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#35`（轮 1 = #295 EN 行）· `#37`（轮 2 = #285 码面 / 另族 sweep；审计 1 轮 + 代码评审 pass + fix 轮 1；§5 处置表 A/B/C + 映射 + 反证针，4 次 append 读回核验）。
- **本席复核（读盘抽验 + 实跑）**：轮 1——`thincoder-core/prompts/common.md:32` 逐字在位（= §2.3-A 全等）· CN 零改 · 164 行 / `##` 14 ✓；轮 2——`thincoder-cli/src/tui/display-budget.mjs:6`（§23.3.1 → **§6.15**）✓ · `thincoder-core/agent-tools/subagent-scheduler.mjs`（§20 / §21.1 / §28 / §15 → **`AGENT-LOOP-SUBAGENT.md` §6.9 / §6.7.3 / §6.7.5 / §6.21 + `AGENT-LOOP-ASYNC-POOL.md` §6.10**）✓ · `thincoder-vscode/test/webview-turnstate.test.mjs:12`（旧「与拒发同判据」→ 入队受理现口径）✓；**doc-check 本席实跑 = 悬空 4 / 行宽 18**（与轮 1 持平——零净增 ✓）。
- 读数（交付）：复扫 725 → 651 行（扣排除面 194 → 120 行 / 200 → 126 对）；87 处处置（56 码档 + 3 档面）+ 裸形同指 13 处 + 判保留 1 处（`subagent-run.mjs:168`，KD-5）；三包 core 663/663 · cli 850/850 · vsc 987/987；定点 6/6；反证针红/绿两轮在档。

**披露登记（承交付 · 父侧裁）**
- **流程漏项（如实）**：轮 2 的 doc-check **入场对照未先存**（AC 括号要求）——替代口径 = 逐命中行级归因 + 与轮 1 读数比对（本席实跑复核 4/18 成立）⇒ **结论成立、基线证据弱于要求**；登记（不返工）。
- **面级边界（接受）**：① 档面 9 处指针 = 轮 2 就地落（原 §2.4 归 eng-designer）——纯指针零语义、可 revert ⇒ **接受**；② 在他批在飞档内注释行落笔（`dispatch.mjs` / `record-results.mjs` / `agent.mjs` / `subagent-*` / `execute-tools.mjs` / `files.mjs`）——逐行替换 · 行数守恒 · 零行为，且限于 sweep 命中面 ⇒ **接受**。
- 表外面 = 仅代码注释 / 档面指针（无行为面）✓。

**域外登记（另轮）**：① 裸形旧编号面（~60 行 / ~20 档）· ② `TUI.md §15.x` 旧编号族（8+ 档）· ③ `TODO-archive.md:263` / `TODO.md:50` 漂移 · ④ `DOC-DISCIPLINE.md` J-1 残差块销项（设计档笔）——**已并 #347**。

**收口**：§1 置「已收口」· 记录冻结；台账 #295 / #292 / #285 / #284 → 待核销 → 已核销；designToken 消费（链终止）。
