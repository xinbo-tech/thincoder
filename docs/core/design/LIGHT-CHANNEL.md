# 轻通道（LIGHT-CHANNEL）· 设计

> 板块 = **工程模式机制**——细节面 ∥ 收敛面受控旁路：直改 → 实时走查 → 定版 → 收口 → 核销。
> 需求档 = `docs/core/requirements/LIGHT-CHANNEL.md`（F-LC1~6 ∥ 边界 ∥ 验收 ①–⑨ ∥ 依赖）；本档 = 机制设计（需求档明示的设计定形项 = 提示词落法 ∥ 台账挂接形 ∥ 量级阈值 ∥「必要测试」判据——§2 逐项定形）。
> 验证凭据 = 用户评语「机制是成功的」（美工场景）。
> 关联面：四步硬流程（`docs/core/requirements/METHODOLOGY.md` §2.1 F2-1）∥ 批档机制（`docs/core/design/BATCH-RECORD.md`——复用零动）∥ 台账机制（`docs/core/design/LEDGER.md`——复用零动）∥ 提示词落地（`docs/core/design/PROMPT-SYSTEM.md` §6.12）。

## 1. 定位

**定位 = 受控旁路**：为四步硬流程在细节面 ∥ 收敛面开一条**条件明确、代价明确**的旁路——

- **条件面（准入）**：三样清单命中（细节 / 美工 ∥ 缺陷修复——是缺陷即归此类 ∥ 走查当场）+ 一句边界（新机制 ∥ 大改 ⇒ 全链）——误准入交**收尾全链**兜底；
- **代价面（闭合）**：每轮次收尾**跑一次全链**（设计形式化 → 独立评审 → 修复（若有）→ 批准 → 收口核销）——旁路 ≠ 取消，收尾全链 = 对四步的补课；**收尾未落 ⇒ 不许核销**；
- **记账面**：轮次 = 批档一本 + 台账行逐笔——批档 ∥ 台账机制**复用，零新增机制**。

**设计原则**：① 落提示词层（内建机制，非会话级裁定）；② 零机械门 = **准入判断面**纪律（承「为臆想的失败逐点加限制 = 反模式」）——**核销面例外**：§2.5 标记门（实证驱动——纪律句被钻空三轮）；③ 产品码触及面 = §2.5（核销标记门——`ledger-cmd.mjs` 判据新增）+ §2.8（代码笔闸）+ §2.9（落笔通道确认提醒一行——非门、非拦）；④ 两界原则（提示词正文运行时可解析——零文档引用）。

**判据收口定形**：准入 = **三样清单 + 一句边界**（命中 = 该路值得作为选项提出，走不走由用户选定——定形记录 = §7 K15）；**误准入交收尾全链兜底**——收口时被形式化 ∥ 评审捕获。**核销面 = 机制重心**：挂账 → 收尾全链 → 核销不漏 = 第一优先级（门槛让路给「不漏」）；启动即挂账（账前笔后）照常。

## 2. 机制设计（逐项定形）

### 2.1 准入（F-LC1——三样清单 + 一句边界）

**该走的三样**（正面清单——命中 = 该路值得作为选项提出，走不走由用户选定；免「设计 → 评审 → 批准」全链——直改 → 实时走查 → 定版）：

1. **细节 / 美工**——视觉 ∥ 文案 ∥ 参数（阈值 ∥ 默认值 ∥ 长度）∥ 既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语）；

2. **缺陷修复**——**是缺陷即归此类**（实现与已有出处相抵：需求 ∥ 设计 ∥ 记录 ∥ 用户当场的话——工作 = 让实现回到出处，非新增语义）；**限代码笔**（= 产品源文件，不含提示词面）

3. **走查当场点名**的问题——按前两样归（细节类按第 1 类提请；行为类按第 2 类提请）——两类都只是「归到哪条」，**走不走仍由用户选定**。

**一句边界**：**新机制 ∥ 大改 ⇒ 全链**。其余交由**收尾全链兜底**——误准入在收口时被形式化 ∥ 评审捕获（门槛让路给「不漏」——§2.3 重心句）。

**附则**：诊断 / 探针 = 零链面（只读 + 临时区，免归类）；性能观察类 = 无结构变更 ∧ 前后读数可证；**轻通道笔 = 主 agent 直改**（选择题自带「可 revert」；大修复照旧派舱 eng-coder）。
**面界**：轻通道只作用于**代码笔 = 产品源文件（不含提示词面）**。

**判定句**：抽查任一笔，路由结论可由「三样清单 + 一句边界」复核（判定依据可回放）；「触界内容走轻通道」的记录 = 0 例（收尾全链为兜底闸）。
**行使面**：路由 = 主 agent 逐笔拟出**选择题**（A 轻通道 ∥ B 全链，可附建议与理由）、**由用户选定**（§2.2——未选定即不动）；子代理不路由、不援引本通道。

### 2.2 路由选择题（F-LC2）

- 每笔开工前，**把路由作为选择题提请**（固定格式；带**判据半句**——**命中三样①②③ ∥ 附则·性能观察**）：
  - 「本笔 **A) 轻通道**（改：__｜射程：__｜回退 = 可 revert）∥ **B) 全链**（触：__｜设计 → 评审 → 批准）——走哪个？」
  - **可附建议与理由**（主 agent 倾向 A 或 B 及原因）——**建议不是默认**；两条路平等摆出，不预设常态。
- **未选定 ⇒ 不动**——不是「默认回全链」，是等挑选；用户选定哪条就走哪条。
- **中途越界 ⇒ 停笔重提请**（禁偷渡）——重新给选择题、重新等选定；**落到提示词面 ∥ 设计档面 ∥ 需求档面 = 例外**：这三面只有全链一条路，不出 A/B 题、只报全链去向（§5 边界 ∥ §2.10 面界）。
- **零链面（诊断 / 探针）不产笔 ∥ 免提请**——只读 + 临时区、产品面零改（经产品面改动 ⇒ 回到选择题）。
- 本机制无 UI 组件面；交互面 = 选择题句（已定形，见上）。

**为什么是选择题而不是「请点头」**（同需求 §2.2）：点头是二元确认——默认采纳被提议的那条，被问的人要先想到拒绝才不默认；选择题里没有天然预设，两条路放在同一行，选的才是真选。
**判据半句的作用**：让用户当场复核建议的判据（命中三样①②③ ∥ 附则），而不是只看到结论。

### 2.3 记录在档（F-LC3 前半 ∥ F-LC4）

- **本面 = 机制重心**（用户裁）：门槛可降，**挂账 → 收尾全链 → 核销不漏 = 第一优先级**。
- 每个轻通道轮次开**一本批档**——逐笔收录 §1（选择题与选定 ∥ 改动 ∥ 走查 ∥ 定版——父侧笔）；
- **启动即挂账**：开轮（首笔开工**之前**）立即两件——① 建轮次批档（先建——写门校验 `task_book` 指针所指档存在）；② 建轮次台账行（title 携「收尾链待跑」——该标记亦为代码笔通路的闸凭据（§2.8）；`board` = 轮所在面；`task_book` = 轮次批档路径；`evidence` 记轮性质 + 钩句「收尾未落 ⇒ 不许核销」）。
- 行随开轮**连步至在途**（待讨论 → 待设计 → 在途——既有迁移表；在途必携指针 = 既有写门；携 executor = 跨会话接手判活面）——在途不可跳核销（既有源态判）= 钩的机械半幅；**账在前、笔在后——无账之笔 = 不成立**。
- 台账行逐笔照常（逐笔行可随收口核销）；
- **轮次界 = 收口**：收口前的新笔 = 本轮续笔（同轮记录）；收口后新笔另起新轮新档（承批次档生命周期「条目集变更 ⇒ 另起新批」规则）。

### 2.4 收尾一次全链（F-LC3 后半 ∥「必要测试」判据）

**触发面（时点清单——提请义务在父侧：用户未必知道需收口）**：用户说「收口」∥ 自然停顿（动作链已跑完、无下一动作在飞）∥ 话题转换（未收口而对话离题——离题前提请）∥ 收束信号（用户表达收束意图——意图为准非词表）。
提请形 = 一句、不追催（用户示意继续 ⇒ 随行——义务保留，下一时点再提请）；要素 = 轮次 ∥ 笔数 ∥ 欠的步 ∥ 一票即跑（回「收口」即跑全链）。

**跨会话接手（防亡链）**：会话启动（与「暂缓批先复核」同拍）⇒ 扫未收口轻通道轮次（轮级行未核销 ∥ 批档状态行非「已收口」）——见 ⇒ 先接手提请（要素同上）；用户一票 ⇒ 接手跑收尾全链。

序列（一次跑全）：

1. **设计**——已落改动形式化 + 文档一致化方案（eng-designer 笔——落轮次记录 §2）；
2. **评审**——独立（落码 ∥ 记录 ∥ 文档对账——落 §3）；
3. **修复**（若有）——按变更面分流落笔；
4. **批准**（§4）；
5. **收口核销**（§6——含必要测试 + 收口测试行）。

**「必要测试」判据（定形）**：① 改动面定向核读（视觉 ∥ 交互细部笔 = 真机走查实测读数——走查即验收读数本）；② 触及可执行行为面的笔 = 单元测试档（随轻通道批档存 · 实施者写与跑）+ 复跑读数；③ 集成面零增补（承测试纪律）；④ 收口测试行照报。

**收敛面笔（判据收口定形）**：其「必要测试」= **先红后绿的复现对 ∥ 读数前后对**——笔时捕获、§1 录、收口核（记录面件——不作入口条件）；不另立单元测试档义务（可执行面的复现脚本〔如有〕随批档存）。

**收敛面笔逐笔形式化模板（收尾轮 §2 设计面）**：逐笔一行——类 ∥ 出处（目标行为坐标：`file:line` ∥ 用户原话）∥ 相抵/读数（红态 ∥ 绿态；性能笔 = 前读数 ∥ 后读数）∥ 落地（改动 `file:line`）∥ 文档一致化去向（出处 = 需求/设计档 ⇒ 实现向档对齐、**逐笔期档面零改**〔坐标随动除外〕；出处 = 当场的话/记录 ⇒ 收口落档；无文档面 ⇒ 记「无需」）。

### 2.5 核销挂接（核销前置 = 机械门）

- 轮次行：在途 → **收尾全链 pass** → 待核销 → 已核销（两步迁移照常——迁移表零动；前置 = **机械门**，见下）。
- **收尾未落 ⇒ 不许核销**（批档 ∥ 轮次行挂住——防「文档滞后永久化」）的**机械牙**：凡把行写入 `已核销` 的台账动作，**结果行标题携「收尾链待跑」⇒ 拒**，报错说明为什么并给修法。
- **判据 = 标记在不在，别无其他**：不查批档内容、不查评审是否真跑——父侧清标记 = 收尾跑完的声明，声明的责任在父侧（标记 = 该声明的机械代理）。
- **门径 = 写入 `已核销` 的全部三径**（只门 close 会把 update 迁移留成同类旁路）：
  - `ledgerClose` 单行（勾销 ∥ 追认同判）∥ `ledgerCloseBatch`（批量径拒 = 该行落 `skipped` 逐行点名，`why` = 拒文原文）——落点 = 逐行共函数 `applyRowClose`（`thincoder-core/ledger-cmd.mjs`），判序 = 源态判之后、值计算之前；
  - `ledgerUpdate` 迁移（含 `ledgerUpdateBatch` 携 status 径）——落点 = 逐行共函数 `applyRowUpdate`，判序 = 迁移表判之后、executor / evidence 值计算之前；判**结果标题**（`patch.title ?? row.title`——一笔 update 同携清标记 `title` + `status=已核销` ⇒ 放行）。
- **撤回（→ 已废弃）不拦**——撤回不是核销。
- **标记单源**：`ROUND_MARKER` 自 `agent/light-round.mjs:25` 迁 `ledger-db.mjs` 常量区（与 `PENDING_STATUSES` 同栏）；`light-round.mjs` 经既有动态 `import("../ledger.mjs")` 解构消费（W8 契约②零新静态边）；`ledger.mjs` re-export 增名保公共面。
- **拒文（逐字——机检断言面）**：`ledgerClose：行标题仍携「收尾链待跑」——收尾链未跑完，不许核销（先跑收尾全链，再由父侧清标记）`；update 径前缀 `ledgerUpdate：`、余同（承同档既有门拒文案形 `ledgerClose：…（现态 X）`）。
- 判定句 = 「收尾未落而核销」= 0 例——机械门在场后，拒记本身可核（工具报错 ∥ 批量 `skipped` 名单）。
- **行自开轮在盘**（启动即挂账——§2.3）：轮次行自开轮在途；未核销轮级行 = 跨会话接手扫描对象（与批档状态行同源）；收口链 pass ⇒ **先清标记**、两步迁移照常。

**新名三问**：`ROUND_MARKER`——`existing: thincoder-core/agent/light-round.mjs:25 · name: "ROUND_MARKER" · consumers: lightRoundOpen（同档谓词）` ⇒ 沿用（单源迁址 `ledger-db.mjs`，消费面不变名）。

测试档名 `ledger-close-marker-gate.test.mjs`——`existing: test/integration/unbooked-pen.test.mjs`（仓根；命名形 = 机制名 kebab；同名单元档已随其批收口删除——测试纪律）⇒ 对齐。

**先例行**：台账写门 `assertTaskBookGate`（同档同层判据新增——判位与迁移表判同层，`ledger-cmd.mjs:149-160`）∥ 源态拒（`applyRowClose` 既有门，`:259`）；偏离 = 判据读标题字面（非指针存在性）。

**勘察行**：查过 `thincoder-core/ledger-cmd.mjs`（close / update / 批量三径）∥ `agent/light-round.mjs` ∥ `ledger.mjs` re-export 面 ∥ `docs/core/design/LEDGER.md` §3 / §3.1；公共源 = §2.9 勘察行结论（`index.publicRepos: []`——无公开源仓，无相关）。

**受影响文件（本件 · 现量 = 本席实读 2026-10-25）**：

| 文件 | 现量 | Δ（估值） | 形态 / tier |
|---|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | 431 行 | +~12（两共函数各一判 + import + 头注句）→ ~443 | 判据新增（结构零改）；低于 500 硬线（`docs/core/requirements/ENGINEERING-MODE-V2.md:647`）⇒ 不触发拆分评审；超 300 软线 = 既有存量，非本批新增 |
| `thincoder-core/ledger-db.mjs` | 266 行 | +3（`ROUND_MARKER` 常量 + 注释）→ ~269 | 常量区增员 |
| `thincoder-core/ledger.mjs` | 159 行 | ±0（re-export 行内增名） | 公共面形零改 |
| `thincoder-core/agent/light-round.mjs` | 67 行 | −3 / +1（删本地常量、动态 import 解构增名）→ ~65 | 消费面改源 |
| `thincoder-core/tool-docs/ledger.md` | — | close 条 +1 句 ∥ update 条 +半句（拒面登记） | 工具描述同步（提示词面——实施轮 eng-coder 落笔） |
| `thincoder-core/prompts/persona-engineering.md` | — | 轻通道块 +1 行（逐字 EN 见下） | 提示词面（实施轮 eng-coder 落笔） |
| `docs/batches/2026-10-25-closeout-marker-gate.test.mjs` | 新档 | ~110 行（M1–M7） | 单元测试档（随批档住、收口删除——测试纪律；落点经父裁收正——`thincoder-core/test/` 被 runner SC-1 判错位） |

**提示词面逐字 EN**（`thincoder-core/prompts/persona-engineering.md` 轻通道块「The round ledger row's title carries …」行后 +1 行——实施席照此落笔）：

```text
The same marker is also the settlement gate credential: settling the row (close or migration to 已核销) is mechanically refused while the title still carries 「收尾链待跑」 — clear the marker only after the closeout chain has run.
```

**用例表（正常 / 边界 / 错误——驱动形 = 直驱核函数；夹具 = 临时项目根〔`PROJECT-MANIFEST.json` + 在盘批档充 `task_book` 所指〕+ `_setLedgerDirForTest` 库目录隔离〔既有注入面〕）**：

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| M1 | 错误 · 携标记核销（需求验收正例） | 行标题携「收尾链待跑」、现态 `待核销` ⇒ `ledgerClose → 已核销` | 拒；报错含「收尾链待跑」；行状态不变 |
| M2 | 正常 · 清标记后核销（需求验收对称例） | 同行先 update 清标题标记，再 close | 通过（`已核销`） |
| M3 | 错误 · 迁移径旁路 | 携标记行 `update status=已核销`；另笔同携清标记 `title` + `status=已核销` | 前者拒（报错含标记）；后者放行（判结果标题） |
| M4 | 边界 · 撤回 | 携标记行 `close → 已废弃` | 通过（撤回不拦） |
| M5 | 边界 · 批量径 | 批内一携标记行 + 一无标记行 ⇒ `ledgerCloseBatch` | 携标记行落 `skipped`（`why` 含标记）；无标记行 `applied` |
| M6 | 正常 · 无标记回归 | 无标记行 close → 已核销 | 通过（不带标记的行照常） |

**边界（本件不做）**：不查批档内容 ∥ 不查评审是否真跑（判据只认标题标记）；不门 `已废弃`；团队台账（`team-ledger.mjs`）不入本门（标记语义属本机台账轻通道机制）；不改迁移表 ∥ 写门 ∥ 六态 CHECK；零配置键。

### 2.6 轮次记录 §段复用形（收尾全链）

| 段 | 作者 | 轻通道轮次内容 |
|---|---|---|
| §1 | 父侧 | 轮次性质 + 逐笔收录（选择题与选定 ∥ 改动 ∥ 走查 ∥ 定版 ∥ 台账行；收敛面笔 + 出处 ∥ 红绿对/读数对） |
| §2 | eng-designer（收尾轮） | 设计形式化 + 文档一致化方案（收敛面笔按 §2.4 模板逐笔） |
| §3 | 评审子代理（收尾轮） | 独立评审（落码 ∥ 记录 ∥ 文档对账）+ VERDICT |
| §4 | 父侧（收尾轮） | 用户批准记录 |
| §5 | —— | **不适用**（无 eng-coder 实施段——轻通道笔 = 父侧直改，记录住 §1；收尾修复按变更面落笔——记录住 §6） |
| §6 | 父侧（收尾轮） | 收口 + 核销 + 收口测试行 + **收尾修复收录**（若有——逐处：改动 `file:line` ∥ 变更面） |

### 2.7 落地形（直改—走查—定版）

- **执行者 = 父侧直改**（细节面 ∥ 收敛面两类**代码笔（= 产品源文件，不含提示词面）**——单点直改；分钟级回路；大修复照旧派舱 eng-coder；eng-coder 因 token 门无法承接无设计笔——`thincoder-core/agent-tools/subagent-spawn.mjs` 门禁）；改完实跑走查、报读数（收敛面笔 = 红绿对/读数对）；
- **收敛面笔**（成形 ∥ 去噪 · 本会话的对话面）——§2.8 谓词为真时（轻通道轮在盘）⇒ 父侧直改；否则引擎门拦断、走常规链。**面界 = 判断面，闸面零分类**——§2.8 谓词为真时闸体整跳、不判笔的归属，三面目标的放行由本判断面拒绝。
- 走查读数须取无缓存干扰的真实渲染（试运行教训——机制面不落具体刷新技巧，交项目面处理）。

### 2.8 代码笔通路（F-LC5——闸认轻通道在盘）

**机制**：轻通道笔落点为代码文件（产品代码面）时，父侧直改受工程模式父侧门（`thincoder-core/agent/dispatch.mjs:99-132`——无任一活设计槽 ⇒ 代码写全拒）拦断 ⇒ 本件 = 给该通路一条与机制咬合的机械口：**闸认轻通道轮在盘即放行**。

**信号形（闸读判据——两件双在盘才算）**：

| # | 在盘状态 | 判据 | 读取点 |
|---|---|---|---|
| ① | 轮次台账行 | `status = 在途`（查询过滤）∧ `title` 携「收尾链待跑」（§2.3 开轮形既有标记）∧ `task_book` 非空 | 逐候选 `ledgerQuery({ cwd: <候选>, status: "在途" })`——候选面 = 会话锚 + 直接子目录一层；动态 import 面 = `thincoder-core/ledger.mjs`（W8 契约②） |
| ② | 轮次批档 | §1 状态行含「进行中」（`readBatchStatusLine === "open"`——与批档机制「在飞」判定同源） | ①行 `task_book` **以各候选为基**按台账写门同式解析（基式 = `resolveProjectRoot(候选) ?? resolve(候选 ?? ".")`；`resolveDeclaredRef`——`thincoder-core/declaration.mjs`）⇒ 读该档（判定器 `thincoder-core/agent-tools/batch-skeleton.mjs:122`） |

**闸读点**：只读谓词 `lightRoundOpen(agent)`（在盘——`thincoder-core/agent/light-round.mjs`）；读法 = **候选面**（会话锚 + 直接子目录一层——候选枚举单源 = `ledgerChildren`）。

逐候选查行 ∥ 以各候选为基解析指针；工作区候选（`projectRootView` 判 `workspace`——如工作区锚自身）⇒ 跳过、照查其余；候选读错 ∥ 不可判 ⇒ 停本候选（净效果只减命中面——开路凭据仍是「两件校验全过」）；外层异常（枚举 ∥ import）⇒ `false`（照拦——fail-closed；被拦时文案不因读错而变）。

调用点 = `thincoder-core/agent/dispatch.mjs:99-102` 条件式**末位合取项** `&& !(await lightRoundOpen(agent))`（短路序在 `anyLiveDesignSlot` ∥ `FILE_MUTATORS` 之后——有活槽会话无新增 I/O）。

**防伪最小锚**：两件**双在盘**才算——轮档独在（全链批 ∥ 随手档）不放行；行独在（无标记 ∥ 无指针 ∥ 指针失据）不放行；档已收口 ∥ 行离在途 ⇒ 信号消失（收口自闭 ∥ 核销自闭）。
**语义**：开门动作 ≡ 开轮两件落盘（「启动即挂账」本体）——不存在独立于账的开门面（无裸口可开）；开门 = 上账，两件即收尾机器（§2.3 ∥ §2.4 ∥ §2.5）盯住的同一对象——机械面造不出脱离收尾链的开口。

**轮型判别**：标记「收尾链待跑」= 闸凭据（§2.3 既有开轮形升格）——全链批的行无此标记 ⇒ 不构成信号（全链笔语义零变）；缺标记的在盘轮 = 照拦 + 拒文半句给修法（见下）。

**咬合面**：

- 启动即挂账（账在前、笔在后）：闸开时刻 = 两件落盘之后——「无账之笔 = 不成立」获机械半幅（纪律句照旧）；
- 收尾未落 ⇒ 不许核销：轮次行停「在途」直到收尾全链 pass ⇒ 闸在整轮（含收尾窗）开放、**收口即自闭**——信号生命周期 = 账生命周期，零额外撤销动作（无「忘撤」漂移面）；
- 轮次界 = 收口：收口后新笔另起新轮新两件；旧信号随收口自然熄灭（零跨轮残留）。

**边界**：

- 非轻通道代码写仍拦：无在盘轻通道轮时，闸判据逐字同前（辖域 ∥ 分类 ∥ 保守拦截 ∥ 全链笔语义零变——talk-then-code 零弱化）；
- 机械面不判笔的归属：轮内一笔是否属轮（三样清单 ∥ 一句边界 ∥ 选择题与选定）仍为判断面——误用交收尾全链兜底（判据收口原理不变）；谓词为真时闸体整跳（含逐目标分类）⇒ 全目标放行。
- 不动面：eng-coder 角色门 ∥ spawn 门 ∥ D5 冻结窗 ∥ 批档写门 ∥ 分类器 ∥ 辖域 ∥ 端面——零改。
- **命中面 = 会话锚辖域**：轮的查找面 = 会话锚 + 直接子目录一层——辖域外（兄弟 ∥ 祖先层 ∥ 他项目）的轮不构成信号；门开后的放行面 = 全目标（含跨项目目标——闸体整跳）。

**实证判据（两笔机检 · 用例 J1–J5 · 直驱 `executeToolCalls` + auto-approve 夹具）**（单元测试档——在盘）：

- ①在盘放行（J1）：工程 agent（depth 0 · 零活槽）+ 两件在盘 ⇒ 写代码目标**无「engineering design gate」拒**（到达执行段）；
- ②无盘仍拒（J2）：同夹具撤两件 ⇒ 拒；三反例同判（J3 无标记 ∥ J4 行非在途 ∥ J5 档已收口）⇒ 逐形仍拒（回指需求 §2.5 F-LC5 判定句 ② ∥ ③）。
- **候选面实证用例** = W1–W4（工作区锚放行 ∥ 缺席仍拒 ∥ 缺一件仍拒 ∥ 坏档候选并存）。

**提示词面**：persona 双档增两句——父侧定句（开轮挂账 ⇒ 直改放行 ∥ 无盘 ⇒ 先挂账再笔 ∥ 被拒 ⇒ 停笔报告、禁静默转全链）+ 轮次行标记半句；逐字 = 轮次记录 §2 围栏块（落笔 = 实施轮 · eng-coder；内容依据 = 机制文档）。
**闸拒文**：`thincoder-core/agent/dispatch.mjs:128` hint 轻通道句（现文逐字）：

`If this is a light-channel code pen: the gate looks for the round from the session anchor and its direct subdirectories — book the round first (an in-flight batch record plus a 在途 ledger row carrying 「收尾链待跑」 pointing at the record); code pens pass once that is on disk.`

**取**（① 拒绝时刻 = 最需修法指引的时刻，承「hint 指名修法」先例；② 条件冠句防全链笔误读；③ 与提示词句互补：提示词 = 事前知会，拒文 = 事发指引）。

### 2.9 落笔通道确认提醒（F-LC6——回执一行，零拦截）

**机制一句话**：每会话**首次**由主 agent 落下**产品源文件**笔时，在**工具回执末尾**追加一行提醒——落笔前确认通道（轻通道 ⇒ 轮次两件先落盘）。只提示：不拦、不放行、不改任何判据。

**与 §2.3 的关系（半句划界）**：§2.3「无账之笔 = 不成立」是**纪律面判据**（该不该这么干）；本件处理的是该判据**已被违反之后**的一次回执提醒（兜底面）——不改判据，也不把违规常态化为允许。

**问题坐标**：规则挂在「决定走轻通道」那一刻（`thincoder-core/prompts/persona-engineering.md:218-222` 启动即挂账 ∥ 账在笔先），实际动作是「看到 bug 就改」——两个时刻之间不经过入口。本件把提示点挪到「手放到笔上」的那一刻：笔落下的同一份回执里出现一行通道确认。

**触发面（四合取 + 一闩，全中才提示）**：

| # | 合取项 | 判据 | 依据 |
|---|---|---|---|
| ① | 身份 = 主 agent | `agent._role == null`（`thincoder-core/agent.mjs:52-59` 建 agent 时 `_role: role`；主会话装配 `thincoder-core/agent/assemble.mjs:106` 不传 role，各子代理 spawn 面传角色） | 子代理写有各自 `_batchDoc` 绑定，不属本提醒对象（任务书边界） |
| ② | 工具 = 笔集 | `PEN_TOOLS` = `FILE_MUTATORS`（`thincoder-core/agent/helpers.mjs:86`）**减** `delete`——现存五支 `{write, edit, insert_after, apply_patch, hashline_edit}` | 既有集合单源复用（减式派生——不另起第二份硬编码清单）；`delete` 不入集——删产品源文件需 `force`，是显式动作，本批无场景（K20） |
| ③ | 执行成功 | 工具结果 `ok === true` | 被拒的笔没有落盘，提醒无对象 |
| ④ | 目标 = 产品源文件 | 逐目标 `resolve(cwd, p)` → `declarationForTarget(abs)` → `isCodePath(abs, conv)`（分类器单源 `thincoder-core/conventions.mjs:162`；与父侧门 `thincoder-core/agent/dispatch.mjs:111-118` 同式） | 文档 ∥ 批档 ∥ `.thincoder/tmp/` ∥ aux（test/scripts）不触发——这些面本就不需轮账 |
| 闩 | 每会话一次 | `agent._unbookedPenNotified` 置位后不再判（不按轮、不按文件） | 用户裁定 B（2026-10-24）：每会话首次笔提示一次 |
| — | **不看在途轮** | 触发面不含「有无在途批档」 | 裁定 B：A（零在途批档才提示）覆盖不到实况——`anyLiveDesignSlot` 让别批次设计槽放行本批笔（`thincoder-core/agent/dispatch.mjs:99-102`）；覆盖不到所述场景的机制不如不做。与需求 §2.6 触发面同口径（`docs/core/requirements/LIGHT-CHANNEL.md` §2.6：会话内首次写产品源文件，不看当时有无在途轮次） |

**新名三问（逐名一行——existing ∥ none found ∥ existing but unusable）**：

- `PEN_TOOLS`：`existing: thincoder-core/agent/helpers.mjs:86` · `name: "FILE_MUTATORS"`（6 支 = 本集 + `delete`）· `consumers: thincoder-core/agent/record-results.mjs:87` ∥ `:162`。取 **existing but unusable（整集）**：`delete` 对本提醒是不该触发的成员（须 `force`、显式动作，本批无场景）⇒ 集形 = `FILE_MUTATORS` 减 `delete`，减式派生而非第二份清单。
- `_unbookedPenNotified`：**none found**——查过实例面既有闩（`_mutatedThisRun` ∥ `_calledAdvisorThisRun` ∥ `_verifiedThisRun`，`thincoder-core/agent/record-results.mjs:94-97`；`_zeroWriteAlerted`，`thincoder-core/agent-tools/zero-write-watch.mjs:48`）。
  全部是「本轮 / 单次运行」语义，无「每会话一次提示」闩 ⇒ 新名字沿用同前缀形，住在 agent 实例（`thincoder-core/agent.mjs:59`）。
- `unbookedPenText()`：**none found**——最近形 = `zeroWriteAlertText` ∥ `advisorAlertText`（`thincoder-core/agent-tools/zero-write-watch.mjs:24` ∥ `:29`，纯函数 + 标量入参）；名字对齐该形，无现成「无账之笔」文案件可引。标签 `[pen check]` 同形对齐 `[zero-write watchdog]`（同档 `:25`）。

**文案（单源 = `unbookedPenText()`，一行）**：

~~~text

[pen check] first product-source write this session — confirm the channel before it lands: a light-channel pen needs its round booked first (batch record + an in-flight ledger row pointing at the record); a full-chain pen goes to eng-coder. A pen with no account is invisible at closeout, so the ledger settlement misses it.

~~~
（不是指控句——轮内合法笔同样会收到提示；末句给后果：收口看不见、核销会漏。）

**落点**：单点挂接 = `thincoder-core/agent/record-results.mjs:87-90`（`pushReal` 之前——`ok` ∧ 工具在场才判），算得后缀拼在 `result` 末尾再入史。

**承载模块 = 新叶 `thincoder-core/agent/unbooked-pen.mjs`**（`PEN_TOOLS` `:19` ∥ `unbookedPenText()` `:22-24` ∥ `unbookedPenNotice()` `:40-62`）：`PEN_TOOLS`（`FILE_MUTATORS` 减 `delete`）∥ `unbookedPenText()`（文案单源）∥ `unbookedPenNotice(agent, toolCall, ok, tool)`（四合取 + 闩判定——命中返后缀行，未中返空串）。

第 4 参 `tool` = 工具对象（`thincoder-core/agent/record-results.mjs:55` 已按名取好），是触发面的**必需项**：

目标提取走单源谓词 `toolTouchPaths(tool, args)`（`thincoder-core/agent/helpers.mjs:104`），其钩子面 `touchedPaths(args)`（`thincoder-core/agent/helpers.mjs:106`）才是 `apply_patch` 真 diff 解析（`thincoder-core/tools/patch.mjs:183`）与批量 `edit` 多目标（`thincoder-core/tools/file.mjs:252`）的目标来源。

无钩子工具按单参 `path` 兜底（`thincoder-core/agent/helpers.mjs:109`）；缺 `tool` ⇒ 判定直接返空串（`thincoder-core/agent/unbooked-pen.mjs:42`），`apply_patch` ∥ 批量 `edit` 永不触发。

该叶 import 四条（`thincoder-core/agent/unbooked-pen.mjs:11-14`）：`resolve`（`node:path`）∥ `FILE_MUTATORS`（`thincoder-core/agent/helpers.mjs:86`）+ `toolTouchPaths`（`thincoder-core/agent/helpers.mjs:104`）。

另两条：`declarationForTarget`（`thincoder-core/declaration.mjs:367`）∥ `isCodePath`（`thincoder-core/conventions.mjs:162`，分类两步同表 ④ 行）。
**只被 `record-results.mjs` import**（叶不向回引——无环）。

不改 `prepared` ∥ 不改 dispatch 门 ∥ 零文件扫描 ∥ 零 DB 访问。

**受影响文件（现量 + Δ · tier 判定；`.md` 档按豁免不列）**：

| 文件 | 现量 | Δ（实现读数） | 形态 | tier |
|---|---|---|---|---|
| `thincoder-core/agent/unbooked-pen.mjs` | 62 行 | 新档 | 谓词叶（`PEN_TOOLS` ∥ `unbookedPenText()` ∥ `unbookedPenNotice()`） | 新档——免拆分 |
| `thincoder-core/agent/record-results.mjs` | 199 行（挂接点 `:29-30` ∥ `:87-90`） | +5 | 结构不变（不拆函数、不增导出） | 低于 300 软线 ∥ 500 硬线（`docs/core/requirements/ENGINEERING-MODE-V2.md:647`）⇒ 不触发拆分评审 |
| `thincoder-core/test/unbooked-pen.test.mjs` | 112 行 | 新档（8 例） | 单元测试档（收口删除——测试纪律） | 新档——免拆分 |
| `test/integration/unbooked-pen.test.mjs`（仓根） | 264 行 | 新档（3 例：I1–I3） | **常驻集成档**（收口不删）——与上一行是两个对象：单元档随批删、集成档常驻 | 新档——免拆分 |

**不改面**：轻通道准入判据（§2.1）· 代码笔闸（§2.8）· 全链放行 · 提示词面（规则已在 persona-engineering:218-222，本件只装触发点）· 批档 ∥ 台账机制本体 · 无新配置键。

**边界**：

- **B 的代价（如实记）**：同一会话里已经提示过一次后，后续再不挂账地改**不会再提示**——每会话一次就是覆盖上限。
- 不覆盖「有在途批档但笔不属于该轮」——笔的轮归属仍是判断面（§2.8 边界既有句）。
- 不判模式位：normal 模式下同样按四合取触发；文案为条件句（「a light-channel pen …」），不主张所有笔都要建批档。
- 不建账 ∥ 不写台账 ∥ 不劝停笔：只把「先确认通道」在笔落下的同一份回执里说一次。
- **身份判据的宽松面（如实记）**：`agent._role == null` 判主 agent——主会话装配不传 role（`thincoder-core/agent/assemble.mjs:106`），子代理 spawn 面统一传 role（`thincoder-core/agent-tools/subagent-spawn.mjs:297-304`）⇒ 现装配面之外无实际误判面。若将来某 spawn 路径漏传 role，该子代理也会收到提醒：后果仅多一行回执，不误伤放行面、不改任何判据——本批不为未出现的输入加白名单分支。
- **相邻洞不在本批**：`anyLiveDesignSlot` 让别的批次的活槽为本批产品码笔放行（`thincoder-core/agent/dispatch.mjs:99-102`）——独立问题，按用户裁定另记台账、不扩本批射程。

**先例行**：`thincoder-core/agent-tools/zero-write-watch.mjs`（同形 = 谓词叶 + 文案函数 + 闩 + 非阻塞；对齐）。偏离 = 送达面：上游 note 通道 → 工具回执——`pushChildUpstream` 只服务子代理，而本提醒的收件人就是刚落笔的主 agent。

**勘察行**：查了 `docs/core/design/LIGHT-CHANNEL.md`（§2.8 闸）、`thincoder-core/agent/dispatch.mjs:99-132`、`thincoder-core/agent/record-results.mjs:85-184`、`thincoder-core/conventions.mjs:151-164`、`thincoder-core/agent-tools/zero-write-watch.mjs`；`index.publicRepos: []`（无公开源仓），无相关公开文档。

**验收（机检形）**：见 §4 ⑨。

### 2.10 路由选择题落提示词面（F-LC2）

**落点两档**：`thincoder-core/prompts/persona-engineering.md`（轻通道块整段 = bullet 头起 8 行 + 两处指代）∥ `thincoder-core/prompts/discipline-engineering.md`（六处句内改：首句 + 同行收尾句 ∥ 缺陷类分类义 ∥ 走查点名归类 ∥ 附则指代 ∥ 轮次形指代 ∥ 行使线）。提示词面 = 产品代码面（D1）⇒ **落笔 = 实施轮 eng-coder**；本段给逐字锚，实施席照此落笔、不另行改写。

提示词面 ∥ 设计档面 ∥ 需求档面笔不入轻通道（三面各有唯一作者——§5 边界；同档 `:224` 既有句）⇒ 提请句限定 **code pen**：这三面只有全链一条路，不出一条无 A 项可选的选择题（需求 §2.1 面界）。

**逐字 EN（`thincoder-core/prompts/persona-engineering.md`——落笔块 = 轻通道块 bullet 头起 8 行（原 7 行 + 第 6 行按句界拆出的一行，文字零改）：轻通道块 bullet 头 `**Light channel (detail-face ∥ convergence-face pens — hit one of the three ⇒ walk)**` 及其后七行；`**Start-up booking**` 块起不动。旧头随整行删除，不叠新头）**：

```text
- **Light channel (detail-face ∥ convergence-face pens — hit one of the three ⇒ put it up as a choice)**: before each **code** pen, put the route to the user as a **choice question** — both routes on the same line, nothing preset:
  - "**This pen — A) light channel** (change: __ | reach: __ | rollback = revertable) **∥ B) full chain** (touching: __ | design → review → approval) — which one?"
  A **recommendation and its reason** may ride along (which route you lean to and why) — **a recommendation is not a default**, and neither route is the normal case.
  The question carries the criterion half-sentence — which of the three items ①②③ was hit ∥ annotation item · performance observation.
  **No pick ⇒ nothing moves** — not "default back to the full chain": wait for the choice.
  **Crossing the boundary mid-pen ⇒ stop, report, and re-ask** — no smuggling: a pen that outgrows the picked route goes back to the choice question (a pen that has landed on the prompt face ∥ the design docs ∥ the requirement docs takes the full chain instead: stop, report the destination, and put up no question).
  **Diagnostics / probes (zero-chain) produce no pen and need no question** — read-only + temp area, product face unchanged (touching the product face ⇒ back to the choice question).
```

**逐字 EN（`thincoder-core/prompts/persona-engineering.md`，两处指代——行号为落笔前坐标；旧步骤名 `disclosure` 系清扫，行数 ±0）**：

- `:223` —— `swap out the disclosure's "this pen = light channel"` ⇒ `swap out the pick's "A) light channel"`；
- `:227` —— `(disclosure · change · walkthrough · freeze;` ⇒ `(the choice question and the pick · change · walkthrough · freeze;`。

**逐字 EN（`thincoder-core/prompts/discipline-engineering.md`，六处句内改；`:97` 首句按句界拆为两行 ⇒ +1 行，文字零改）**：

- `:97` 轻通道块首句 + 同行收尾句（整行改写）—— 首句 `hit one of the three ⇒ walk; bypass ≠ cancellation` ⇒ `hit one of the three ⇒ put it up as a choice, the user picks; bypass ≠ cancellation`；行末 `— walks this channel.` ⇒ `— is put up as a choice question; it moves only after the pick.`；
- `:102` 缺陷类分类义 —— `**a defect ⇒ walk**` ⇒ `**a defect ⇒ goes up as item 2**`；括号内定义半句原样保留（`(the implementation contradicts an existing source: requirement ∥ design ∥ record ∥ the user's words on the spot — the work = bringing the implementation back to the source, not adding semantics)`）—— 路由语改分类语，与 `:104` 新句 `whether to walk is still the user's pick` 同向；A2 以 `⇒ walk` = 0 捕获；
- `:104` 走查点名归类 —— `routed by the first two (detail class straight through by default; behavior class = defect fix)` ⇒ `routed by the first two (detail class goes up as item 1; behavior class goes up as item 2 — either way it only settles which item it is routed to; whether to walk is still the user's pick)`；
- `:110` 附则指代 —— `(the disclosure carries "revertable"` ⇒ `(the choice question carries "revertable"`；
- `:112` 轮次形指代 —— `(per-pen entries: disclosure · change · walkthrough · freeze)` ⇒ `(per-pen entries: the choice question and the pick · change · walkthrough · freeze)`；
- `:117` 行使线 —— `routing = the main agent judges per pen and discloses per pen (the user can overrule)` ⇒ `routing = the main agent proposes the route per pen as a choice question (both routes side by side, a recommendation allowed but not a default) and the user picks; nothing moves before the pick`。

**为什么是选择题而不是点头**（同需求 §2.2）：点头是二元确认——默认采纳被提议的那条，被问的人要先想到拒绝才能不默认；选择题里没有天然预设，两条路放在同一行，选的才是真选。

**受影响文件（现量 = 本席实读 2026-10-25；行数口径 = 内容行数，不含末尾空行——同档 `split(/\r?\n/).length` 因末尾换行各 +1 = 460 ∥ 350）**：

| 文件 | 现量 | Δ | 形态 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 459 行 | 轻通道块 7 行 → 8 行（bullet 头起整段改写）+ 两处句内改 ⇒ +1 行（第 6 行按句界拆为两行，文字零改） | 提示词面——实施轮 eng-coder 落笔 |
| `thincoder-core/prompts/discipline-engineering.md` | 349 行 | 六处句内改（首句 + 同行收尾句 ∥ `:102` 归类 ∥ `:104` 归类 ∥ 附则 ∥ 轮次形 ∥ 行使线）⇒ +1 行（`:97` 首句按句界拆为两行，文字零改） | 提示词面——实施轮 eng-coder 落笔 |
| `docs/core/design/LIGHT-CHANNEL.md` | 474 行（含本批落笔） | §1 定位 / §2.1 / §2.2 / §2.10 / §3 两处 / §4 ② / §7 K4 / §8 | 设计档——本席笔（本批） |
| `docs/core/design/PROMPT-SYSTEM.md` | 4,402 行 | §6.12 分层归属一句（改为选择题形） | 设计档——本席笔（本批） |

**行宽门会强制拆行（写逐字块即须预见）**：提示词面逐行裸判 300 字符、无结构豁免（`docs/core/design/DOC-DISCIPLINE.md:949-952`）⇒ 逐字块里写入超长句必撞门（`doc_check(mode:"gate")` = REFUSED），实施席只能按句界拆行：文字零改、每档 +1 行。故标「±0 行」前先核块内每行 ≤ 300 字符——本块两行超限（persona 第 6 行 316 字符 ∥ discipline `:97` 首句 336 字符）。

**验收（本批 AC · 回指需求）**：

| # | 回指 | 判法 / 读数 |
|---|---|---|
| A1 | 需求 §4 ②、§2.2 判定句 | 实施后两档逐档 `grep -c "disclose-then-go"` = 0、`grep -c "hit one of the three ⇒ walk"` = 0；`persona-engineering.md` 含 `both routes on the same line` 恰 1、`choice question` = 4（落笔块内三处 + `:228` 指代句一处）、`No pick ⇒ nothing moves` 恰 1、`a recommendation is not a default` 恰 1；四处旧指代串各 = 0（persona：`the disclosure's "this pen = light channel"` ∥ `per-pen entries in §1 (disclosure`；discipline：`(the disclosure carries "revertable"` ∥ `(per-pen entries: disclosure`）；`discipline-engineering.md` 的 `disclos` 全档 = 0；`persona-engineering.md` 的 `disclos` 余 2 行 3 处（`:44` 交付缩减面 ∥ `:347` 文件域声明面——轻通道块内 = 0）；**面界断言**：`grep -c "the design docs ∥ the requirement docs"` 同档 = 1（落笔后例外句三面齐；= 0 ⇒ 需求档面漏，即本轮补的那一面） |
| A2 | 需求 §2.1 边界句 | `grep -c "the user can overrule" thincoder-core/prompts/discipline-engineering.md` = 0；同档 `straight through` = 0、`⇒ walk` = 0（同捕 `:97` 首句与 `:102` 路由语）、`walks this channel` = 0、含 `nothing moves before the pick` 恰 1、含 `put it up as a choice` 恰 1、含 `a defect ⇒ goes up as item 2` 恰 1 |
| A3 | 需求 §1 模块目标 | `grep -n -e "交底即行" -e "用户可改判" docs/core/design/LIGHT-CHANNEL.md` 的命中行集 = 仅本行（两串 = 本行的扫描字面）；其余任何一行命中 ⇒ 红。另一维：§2.1 行使面 ∥ §2.2 皆述「未选定即不动」（实读核对） |

**用例表（正常 / 边界 / 错误）**：本批零可执行面（提示词正文 + 设计档）⇒ 无单元测试档；读数形 = 上表三条 grep（收口行报读数）。

| # | 场景 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 · 细节面笔 | 主 agent 拟出选择题 + 建议 A | 用户回「A」⇒ 开工；建议不被当成默认 |
| C2 | 边界 · 用户不选 | 选择题已出，用户未回 | 不动（不自行开工、也不静默转全链） |
| C3 | 错误 · 先在轻通道开工后补问 | 未出选择题就落笔 | 违规（需求 §4 ②）；该笔按全链重跑（触界内容不经轻通道） |
| C4 | 边界 · 中途越界 | 轻通道笔做到一半发现改的是**面界三面之一**（提示词面 ∥ 设计档面 ∥ 需求档面） | 停笔、报；该面只有全链一条路 ⇒ **不出 A/B 题**、只报全链去向，按全链处置（§2.10 面界 = 三面 ∥ §2.2 越界限定） |

**边界（本段不做）**：不改三样清单本体（准入判据仍 = §2.1）· 不改收尾全链（§2.4）· 不改核销机械门（§2.5）· 不改代码笔通路（§2.8）· 不改 `scope` 等参数面 · 不加机械门 / 不加配置键 · 不改判据半句成分（命中三样①②③ ∥ 附则）。

**先例行**：同机制同落点 = 本档 §3 落点表（`thincoder-core/prompts/persona-engineering.md` 「派发与收尾纪律」节内——同一清单行，本批只换句法：交底句 → 选择题句）；逐字锚交实施席落笔之形 = 本档 §2.8「提示词面」条。**对齐**。**偏离 = 无**。

**勘察行**：查过 `docs/core/requirements/LIGHT-CHANNEL.md`（§1 / §2.1 边界句 / §2.2 / §4 ②——本席本轮实读）∥ `thincoder-core/prompts/persona-engineering.md:211-228` ∥ `thincoder-core/prompts/discipline-engineering.md:97-118` ∥ `docs/core/design/PROMPT-SYSTEM.md:361`；`index.publicRepos: []`（无公开源仓）⇒ 无相关公开文档。

**UI / 交互决策**：无界面面——本批只改模型可见提示词文本与设计档。

## 3. 提示词落点清册（段落 → 档 → 节）与咬合处置

**落点（EN × 两模式 = 2 档）**：

| 段落 | 档 | 节 | 形态 |
|---|---|---|---|
| 准入三样清单 ∥ 一句边界 ∥ 附则 ∥ 轮次形（含启动即挂账）∥ 收尾形 ∥ 行使面 ∥ 边界 | `thincoder-core/prompts/discipline-engineering.md`（EN） | 「基本流程」节内（步 4 后） | 既有节内增列 |
| 路由选择题句（两条路由 ∥ 判据半句 ∥ 建议非默认）∥ 未选定即不动 ∥ 零链免提请 ∥ 越界停笔重提请（面界例外 = 三面回全链、不出题）∥ 记账（含启动即挂账）∥ 代码笔通路句（开轮挂账 ⇒ 直改放行；含轮次行标记半句）∥ **轮次界 = 收口** ∥ 收口触发（提醒时点）∥ 跨会话接手 ∥ 核销对接 | `thincoder-core/prompts/persona-engineering.md`（EN） | 「派发与收尾纪律」节内（实施轮角色路由 后） | 既有节内增列 |

**咬合处置（既有条款 → 处置）**：

| 既有条款 | 处置 |
|---|---|
| 铁律一（四步不跳）∥ 铁律四（零裁量） | **不改写**——机制块内含咬合句「旁路 ≠ 取消」（收尾全链 = 补课；准入 = 三样清单 + 一句边界）——默认面不弱化 |
| 铁律二（错结构就地修） | **不改写**——铁律二 = 全链的活（语义零损）；误准入（含撞错结构）交收尾全链兜底捕获（判据收口） |
| 变更面分流（产品代码面 = 全流程） | **不改写表行**——轻通道例外由机制块承载（条件 = 三样清单 + 一句边界；代价 = 收尾全链显式） |
| 确认与批准门（写文件前先确认） | **不改写**——轻通道笔免例行「复述 + 等确认」步，由**路由选择题**一次选定承担（A/B 平等摆出 + 用户选定 ⇒ 该笔放行）；分钟级目标不变 |
| 「父侧不代笔」（轻通道笔的执行形态） | **不改写**——轻通道笔 = 父侧直改，由本档机制块承载（条件 = 三样清单 + 一句边界 + 路由选择题与用户选定 + 走查/读数 + 收尾全链闭合）；**打标义务即满足**——选择题 A 项「回退 = 可 revert」+ 轮次记录 §1「父侧笔」逐笔收录（「父侧直接执行」随逐笔选择题与选定、§1 留痕明示，不另加注） |
| 批次档生命周期（五条） | **不改写**——轮次 = 批档一本（§2.6 复用形）；轮次界 = 收口 |
| 台账生命周期（事件 → 动作） | **不改写**——核销前置 = 机械门（§2.5——`ledger-cmd.mjs` 判据新增；迁移表 ∥ 写门 ∥ 六态零动）；启动即挂账 = 既有迁移表连步（待讨论 → 待设计 → 在途）+ 在途不可跳核销（既有源态判） |
| 测试纪律（收口测试行 ∥ 单元测试档） | **不改写**——「必要测试」判据按同轴定形（§2.4） |
| 「暂缓批先复核」 | **不改写**——轻通道接手 = 同拍扫描（会话启动一次、对象各异：暂缓批 = 带「暂缓 · 复核条件」标记者；未收口轮次 = 轮级行未核销 ∥ 批档状态行非「已收口」）；两查互不替代、不并句 |
| 「改判据语义 ⇒ 仍走设计」（工程工具面直改硬约束） | **撤**——管辖面并入一句边界（新机制 ∥ 大改 ⇒ 全链）；改判据语义笔按三样清单归口；直改硬约束 = **2 条** |

**代码笔通路随动面**：`DESIGN-TOKEN-SETTLEMENT.md`（§4 D3 ∥ §5 ∥ §6.1）∥ `PROMPT-SYSTEM.md`（§6.12 + §6.1 补登 + §8.2 读数——实施轮）∥ 提示词 persona 两档（增句逐字 = 轮次记录 §2）。

## 4. 验收映射（回指需求档 §4 ①–⑨ + 核销标记门增量 ⑩）

| # | 需求验收 | 可核形态 | 守法（内容测试禁令） |
|---|---|---|---|
| ① | 机制文本落提示词层，判据表可逐条核 | 实施轮一次性比对（落地四档 ↔ 轮次记录 §2 围栏块）+ 评审对照（准入三样逐条 ↔ 落地文本） | 一次性比对——禁新增散文锚 |
| ② | 会话记录可抽查**选择题与选定**——每笔开工前均有（两条路由 + 改面 + 射程 ∥ 回退）；无「未出选择题即开工」 | 行为面观察项：会话抽查（选择题句 + 用户选定 + 轮次记录 §1 收录可回溯） | 观察项——不落机检断言 |
| ③ | 收口闭合可查：≥1 轮完整「逐笔入档 → 收尾全链（含评审）→ 核销」；「收尾未落即核销」= 0 例；在途轮次的收口提请（提醒时点 ∥ 跨会话接手）可抽查 | 记录面核读：（首轮）收口全链完整性 + 台账查询（0 例）∥ 承接面观察项：会话抽查在途轮次的收口提请 | 记录面核读 ∥ 观察项 |
| ④ | 演练两笔（越界停笔 + 重给选择题 + 重分类 ∥ 边界出局——入口不中 ∥ 触界 ⇒ 回全链） | 演练记录两笔（落批档 ∥ 台账）——时点 = 上线后首轮 ∥ 父侧在收口轮安排 | 记录面样本 |
| ⑤ | 扩容增量（收敛面准入——现行 = §2.1 三样清单 ∥ 启动即挂账——§2.3）落 EN 后按 ①–④ 同构核 | 实施轮一次性比对（落地四档 ↔ 轮次记录 §2 围栏块——含三样清单 ∥ 启动即挂账句）+ 评审对照（启动即挂账三件：时机 ∥ 两件 ∥ 钩） | 一次性比对（沿 ① 守法） |
| ⑥ | 收正增量（「轮次界 = 收口」——§2.3 新增条 ∥ 提示词新增行）落需求后按 ①–④ 同构核 | 实施轮一次性比对（落地档 ↔ 轮次记录 §2 围栏块）+ 评审对照（续笔两半句逐字） | 一次性比对（沿 ① 守法） |
| ⑦ | 判据收口增量（「三样清单 + 一句边界」——§2.1 ∥ §3 + 核销不漏面——§2.3 重心句）落需求 ∥ 提示词后按 ①–④ 同构核——**加核：核销不漏面**（挂账 → 收尾全链 → 核销可抽查、0 漏） | 实施轮一次性比对（落地四档 ↔ 轮次记录 §2 围栏块——含三样清单 ∥ 一句边界 ∥ 附则）+ **删面核读**（落地档无残留 ⇔ 轮次记录 §2 删面清单）+ 评审对照（三样逐条 ↔ 落地文本；核销不漏面三件可回溯：挂账 ∥ 收尾 ∥ 核销） | 一次性比对（沿 ① 守法） |
| ⑧ | 代码笔通路（F-LC5——§2.5 落需求 ∥ 设计 ∥ 实施后按 ①–④ 同构核）——**加核：通路实证两笔**（在盘放行 ∥ 无盘仍拒） | §2.8 实证判据（单元测试档 J1–J5——两笔 + 三反例）+ 实施轮一次性比对（落地四档 ↔ 轮次记录 §2 围栏块） | 单元测试档读数（随轮次记录存——非常驻）；一次性比对（沿 ① 守法） |
| ⑨ | 落笔通道确认提醒（本批增量；需求出处 = 台账 #1753；回指 `docs/core/requirements/LIGHT-CHANNEL.md` §2.6 判定句 ①–④） | 单元测试档读数 + 门控零变读数（细目见下） | 单元测试档 + diff 读数（随批档存——非常驻） |
| ⑩ | 核销标记门（核销前置升格机械门——§2.5；需求出处 = 台账 #1780；需求档判定句补登 = 父侧笔） | 单元测试档 M1–M6 读数（用例表 = §2.5） | 单元测试档（随批档存——收口即删；零常驻断言） |

**⑨ 读数细目（驱动形 + 四项）**：

- **驱动形**：直驱结果入史函数 `recordToolResults(agent, toolByName, results)`（`thincoder-core/agent/record-results.mjs:45`）——构造 `{ toolCall, result, ok }` 结果集 + 最小假 agent（`cwd` ∥ `_role` + `pushReal` 所需历史容器，测试档内自建；既有用例未覆盖该函数），不起 `executeToolCalls` 全链（本件不改门，无需真工具执行）。
- **① 命中**：主 agent（`_role` 缺省）+ `write` + 产品源文件 + `ok=true` ⇒ 回执含提示行**恰一次**且以之结尾，逐字含 `confirm the channel` ∥ `ledger settlement misses it`。
- **② 反例逐项零提示**：`_role="eng-coder"` ∥ `read` ∥ `docs/*.md` ∥ `.thincoder/tmp/*` ∥ `test/*` ∥ `ok=false`。
- **③ 闩两态**：同实例第二笔产品码笔零提示 ∥ 新实例再命中。
- **④ 放行条件零变（机判）**：门控代码零改 = `git diff --stat <基线 sha>..HEAD -- thincoder-core/agent/dispatch.mjs` 为空 ∧ `grep -n unbooked thincoder-core/agent/dispatch.mjs` 零命中；同一输入下门读数不变 = 上一条的蕴含（门体字节未变 ⇒ 同输入同结论）——不为已蕴含的结论再设夹具。

**零常驻断言**（承测试纪律「不因单次改动而增补」+ 内容锚禁令）：① ∥ ② ∥ ③ = 一次性单元测试档读数，④ = 一次性 diff 读数，四者随批档存、收口即随测试档删除；① 的常驻守卫 = 集成面的业务可观察用例（§8）。

## 5. 边界（本机制不做）

- 不做：边界外内容走通道 ∥ 免收口 ∥ 以本机制替代全链（机制自身 ∥ 大改仍全链）；**提示词面 ∥ 设计档面 ∥ 需求档面不入轻通道直改，轻通道只作用于代码笔（代码笔 = 产品源文件，不含提示词面）**——三面各有唯一作者（写权矩阵 D1，拥有档 = `DOC-DISCIPLINE.md` §1：提示词 = 产品代码面、内容依据 = 机制文档、落笔 = eng-coder；设计档 = eng-designer；需求档 = 主 agent）。**面界 = 判断面，闸面零分类**——§2.8 谓词为真时闸体整跳、不判笔的归属，三面目标的放行由本判断面拒绝。
- 机制本面：准入判断面零机械门（代码笔通路件（§2.8）= 机械**开路**〔免拦放行〕，非**设槛**〔不新增准入限制〕）；**核销面例外** = §2.5 标记门（设槛——实证驱动）∥ 产品码触及面 = §2.5（`ledger-cmd.mjs` 两共函数判据新增）+ §2.8（谓词件 + 闸条件合取项）+ §2.9（回执提醒一行：零拦截 ∥ 零扫描 ∥ 零判据改动）∥ 批档机制本体零动；台账机制 = 判据新增一条（迁移表 ∥ 写门 ∥ 六态 CHECK 零动）∥ 子代理零新义务。
- 提示词面：铁律 ∥ 分流表 ∥ 确认与批准门不改写（例外入机制块载明）；工程工具面直改硬约束 = 两条（判据收口定形）；零文档引用（两界原则）。

## 6. 依赖

- 批档机制（`docs/core/design/BATCH-RECORD.md`——§段形复用；`batch` 工具段白名单不动）；
- 台账机制（`docs/core/design/LEDGER.md`——六态 ∥ 核销两源复用）；
- 评审链与设计 token 链（advisor ∥ spawn 门）· 测试纪律（`docs/core/design/TESTING.md` §3–§4）。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| K1 | 落点 = 机制规则入纪律层「基本流程」节内 + 父侧行使入人格层「派发与收尾纪律」节内 | 归属四问：机制面 = 怎么干活（纪律层）；父侧动作 = 写权独属（人格层——台账判例同轴） |
| K2 | 准入 = **三样清单 + 一句边界**（新机制 ∥ 大改 ⇒ 全链）；量级界 = 一句边界（细数无） | 判据收口：入口从简——兜底 = 收尾全链 |
| K3 | 轻通道轮次 §5 = 不适用（实施面 = 父侧直改，记录住 §1） | eng-coder 段白名单机械锁（父侧工具面不可写 §5）+ 无 eng-coder 实施段；记录面完整（§1 逐笔 + §6 修复） |
| K4 | 路由 = **选择题 + 用户选定**（A 轻通道 ∥ B 全链平等摆出，建议非默认；未选定即不动）——免的是「设计 → 评审 → 批准」全链，不是用户裁定 | 判的人不握放行票（实证 = 2026-10-25 当日六笔轻通道中两笔越界，`operand-count-sync` 明知有疑仍走——判者同时握票）；选择题优于点头：点头默认采纳被提议项，选择题无天然预设；**本裁取代需求档来源行「走查反馈明示轻通道」原话的直通义**——走查点名仍按三样清单归口，走不走由用户选定（现行义 = 需求 §2.2） |
| K5 | 收尾修复（若有）按变更面分流落笔（父侧 ∥ eng-designer）；触界 ⇒ 回全链 | 修复多为文档面 ∥ 细节面——不引入新链；收尾全链兜底 |
| K6 | 不改写铁律 ∥ 分流表 ∥ 确认门——例外由机制块承载 | 默认面不弱化（零裁量语义零损） |
| K8 | 收口提醒 = 触发面时点清单（自然停顿 ∥ 话题转换 ∥ 收束信号）+ 提请形（一句 ∥ 要素四项 ∥ 不追催） | 亡链防面：话题转换 ∥ 收束信号 = 用户最可能「以为干完」的时点（现文仅自然停顿一面）；要素四项使提请可行动（一票即跑）+ 欠账可见（承「欠账入清单」） |
| K9 | 跨会话接手 = 会话启动与「暂缓批先复核」同拍扫描（对象各异——互不替代、不并句） | 防重复扫描义务：两族同在会话启动点火——对象（暂缓批 = 带标记者 ∥ 未收口轮次）与处置（复启 ∥ 提请收口）各异 ⇒ 一查两扫 |
| K10 | 准入（三样清单 + 一句边界 + 附则）落法 = 同块内正面清单（纪律层「基本流程」节内——受众含收尾轮评审 ∥ 设计面，承 K1/D-PS12 分流同式） | 判据收口：入口即正面清单（命中 = 该路值得作为选项提出，走不走由用户选定——判据可回放） |
| K11 | 启动即挂账挂接形 = 开轮两件（先批档后台账行——写门指针存在性定序）+ 轮次行连步至在途 | 在途不可跳核销（既有源态判）= 钩的机械半幅（纪律半幅 = 钩句）；进在途携 executor = 跨会话接手判活面 |
| K12 | 收敛面笔「必要测试」= 红绿复现对/读数前后对（笔时捕获 · §1 录 · 收口核）——不另立单元测试档义务 | 红绿/读数对 = 可回放的**记录面**材料（判据收口——不作入口条件）；分钟级目标与失败代价决定不扩测试覆盖 |
| K13 | 性能观察类 = **附则件**（无结构变更 ∧ 前后读数可证） | 判据收口定形：附则持有（入口从简——兜底 = 收尾全链） |
| K14 | 「轮次界 = 收口」入文 = 需求 §2.3 新增条 ∥ 提示词「派发与收尾纪律」节内新增行（EN） | 续笔归属需明文 |
| K15 | **判据收口（入口重定）**：准入 = 三样清单 + 一句边界；核销面（挂账 ∥ 收口 ∥ 接手 ∥ 未核销不关轮）= 机制重心（第一优先级）；工程工具面直改硬约束 ② 撤——管辖面并入一句边界 | 用户五裁（bugfix 路由指正 ∥「简单明确」批评 ∥「没必要把门槛设置得那么高」∥ 分流句复核撤 ∥「开始」）；兜底原理 = 收尾全链自然捕获误准入 |
| K16 | **代码笔通路 = 闸认轻通道在盘（两件双在盘：轮次行 `在途` 携「收尾链待跑」+ 指针指向「进行中」轮档）**；新增只读谓词 `lightRoundOpen`（在盘——`thincoder-core/agent/light-round.mjs`）+ 父侧门条件式末位合取项（§2.8）；候选面 = 会话锚 + 直接子目录一层（候选枚举单源 = `ledgerChildren`） | 信号 = 既有「开轮两件」（零新记账面）；生命周期 = 账生命周期（收口自闭——零撤销动作 ∥ 零漂移面）；轮型标记防全链批误开（§2.3 既有形升格）；读错 fail-closed 照拦 |
| K17 | 触发面 = **每会话首次产品源文件笔**（不看在途轮）——用户裁定 B | A（零在途批档才提示）在实况里不响：`anyLiveDesignSlot` 让别批次设计槽放行本批笔（`thincoder-core/agent/dispatch.mjs:99-102`）；覆盖不到所述场景的机制不如不做 |
| K18 | 不拦：只在工具回执末尾加一行 | 正常调试（临时插桩、试一行）本就该直改；拦 ⇒ 被绕过，绕过后连提醒都没有 |
| K19 | 去噪 = 每会话一次闩（不按轮、不按文件） | 轮内合法笔也会收到提示——重复出现即噪音；用户一句「这只是调试」后不必再提 |
| K20 | 笔集 = 任务书五支（`delete` 不入集）；不判模式位 | 任务书点名；删产品源文件带 `force` = 显式动作，无场景不设分支；模式位 = 为未出现的输入加分支 |
| K21 | 提醒落工具回执，不落 System reminder ∥ 上游通道 | 回执与那笔写同一条消息，因果相邻；上一轮才到的 System reminder 到来时笔已落完；上游通道只服务子代理 |
| K22 | **核销前置升格 = 机械门**：写入 `已核销` 的全部三径（close 单行 ∥ close --batch ∥ update 迁移）同判——结果行标题携「收尾链待跑」⇒ 拒；判据只认标题标记；标记单源迁 `ledger-db.mjs` | 纪律句被钻空的实证（同日三轮收尾评审未跑即核销——用户裁「看来还不得不做这一步」）；只门 close 会把 update 迁移留成同类旁路；标记 = 父侧「收尾已跑」声明的机械代理，声明责任在父侧 |

## 8. 集成测试设计（F34）

**判定 = 本批触及业务行为**（两条，均可观察）：

1. **模型面工具回执变了**：提醒行拼进入史的工具回执正文（`thincoder-core/agent/record-results.mjs:89-90` 的 `content: penNotice ? result + penNotice : result`）——脚本化 provider 下一请求里那笔 `tool_result` 的正文多出一行。
   **会话流正文不含提醒**：会话流的工具块取 `thincoder-core/agent/dispatch-run.mjs:155` 的 `resultForModel`（渲染 = `thincoder-cli/src/tui/tool-events.mjs:280` 的 `block.result = slimToolResultForDisplay(result)`），而该值在 `record-results.mjs:89-90` 拼接之前就已发出 ⇒ 断言面 = **模型面工具回执**，不是会话流工具块。
2. **模型可见行为**：回执是模型下一步动作的输入——本机制的目的就是让模型在落笔后确认通道。放行条件零变 ≠ 行为零变：模型收到的输入变了。

**场景表（常驻档 = `test/integration/unbooked-pen.test.mjs`（仓根），收口不删）**：

| # | 入口（业务可观察点） | 判据（断言什么） | 回指 |
|---|---|---|---|
| I1 | 从 CLI 入口起一个会话（脚本化 provider：本机 Anthropic Messages/SSE 假端点，同模板 `test/integration/anthropic-tool-roundtrip.test.mjs`，零外网），主 agent 对产品源文件 `src/x.mjs` 执行 `write`，看脚本化 provider 记录的请求体里该笔 `tool_result` 正文 | 该笔回执正文以 `[pen check]` 行结尾且恰出现一次，逐字含 `confirm the channel` 与 `ledger settlement misses it`；文件已写入、工具照常成功（零拒绝） | 需求 §2.6 判定句 ① ∥ 设计 §2.9 触发面 ①–④ |
| I2 | 同一会话紧接第二笔产品源文件 `write` | 第二笔回执正文零 `[pen check]` 行 | 需求 §2.6 判定句 ③ ∥ 设计 §2.9 闩行 |
| I3 | 另一会话：先写一份文档（`docs/x.md`），紧接着写产品源文件 | 文档笔零提示、且不消耗闩——随后的产品码笔仍有提示 | 需求 §2.6 判定句 ② ∥ 设计 §2.9 触发面 ④ |

**夹具形**：真子进程（承 `docs/core/requirements/TESTING.md` §6.1 F23——不 import 业务模块）；会话级 AUTO 放行工具调用；夹具 workspace 带项目声明（`declarationForTarget` 可解析、`src/` 判为 codePath），否则触发面 ④ 恒不成立。

**模式位**：I1–I3 在 normal 模式会话里跑——工程模式父侧门会先拒无账产品码笔（`thincoder-core/agent/dispatch.mjs:99-132`，`ok=false` ⇒ 触发面 ③ 不成立），那测的是 §2.8 闸、不是本件；本件的可观察结果与模式位无关（§2.9 边界「不判模式位」）。

**身份项不进集成表**：子代理零提示由单元面覆盖（§4 ⑨ ② 的 `_role="eng-coder"` 反例）——集成表入口 = 主 agent 会话；子代理面的可观察差异只是「子块里少一行」的负断言，再驱动一个脚本化子会话不产生新的业务结论。

**窗口读数（实读 2026-10-25）**：集成集现量 **7 档 22 例**（`anthropic-tool-roundtrip` 3 ∥ `browser-start-window` 3 ∥ `unbooked-pen` 3 ∥ `web-backend-404` 3 ∥ `advisor-timeout-hot` 3 ∥ `review-doc-scope` 4 ∥ `batch-close-gate` 3）——现住仓根 `test/integration/`。

复测 = 仓根 `node test/run.mjs`（收集面 = 仓根 `test/run.mjs` 的单层 glob `test/integration/*.test.mjs`）；窗口读数由父侧收口行报表（`docs/core/requirements/TESTING.md` F9 ②）。

**核销标记门批（2026-10-25）判定 = `none`**：RTM 索引 = `test/RTM.md`（仓根，在盘——CLI 端 7 个故事节 22 例）。逐行对账：无行断言本批改动对象（22 例断言面 = 工具结果回放 ∥ [pen check] 提醒 ∥ fetch 回落 ∥ 浏览器窗口 ∥ 评审超时 ∥ 评审文档范围 ∥ 收口档范围——无一台账核销面断言）⇒ 破行 0 ∥ 冗余行 0 ∥ 新增 0。

理由：组件之间的交互零改（改动面 = `ledger-cmd.mjs` 判据新增一条 + 常量迁址；装配面 ∥ 工具层参数管道 ∥ 接线零改），拒放行走路径 = 既有工具拒文通道（故事 1 回放面已覆盖）；核销拒放由 §4 ⑩ 单元档直驱核函数覆盖（承台账写门族先例）。

**路由选择题批（2026-10-25）判定 = `none`**：改动面 = 提示词两档正文（§2.10）+ 设计档两档——零代码档、零门、零装配面。

RTM 索引 = `test/RTM.md`（仓根，在盘——本席实读：7 个 CLI 故事节 + VS Code ∥ Desktop ∥ 异常与更正 ∥ 签署面）。

逐节对账：故事 1 工具回放 ∥ 2 未立项写产品码提醒 ∥ 3 网页抓取故障 ∥ 4 浏览器等待窗口 ∥ 5 评审超时 ∥ 6 设计评审文档范围（6-1~6-4 断言 `documents` 受理 ∥ 三种拒发）∥ 7 收口档范围（7-1~7-3 断言收口 doc-check 门的范围判）——**无一节断言路由问句 ∥ 提示词正文**；破行 0 ∥ 冗余 0 ∥ 新增 0。

理由：组件之间的交互零改（只改模型可见文本），既有用例所断言的业务可观察结果零改；本机制的可观察面（模型是否先问再动）属会话行为，落在 §4 ② 的观察项与收尾轮会话抽查，不构成可跑用例。
