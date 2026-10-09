# 2026-10-09 · normal-work-management
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 台账 #1111 ∥ 需求 `docs/core/requirements/NORMAL-MODE.md` §5.6（用户 2026-10-09 10:05–10:22 连述十条——原话在档；「开始」立批令 10:22）。
> 台账 = #1111（NORMAL-MODE.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 用户裁定（2026-10-09 10:05–10:22——原话十条，全文在需求档来源行）

| 时点 | 原话摘 | 裁定 |
|---|---|---|
| 10:05 | 「普通模式也要教」 | 台账用法教学入普通模式 |
| 10:07 | 「应该跟工程模式差不多」 | 管理逻辑与工程同构 |
| 10:08 | 「普通模式也应该使用批次档」 | 批次档入普通模式 |
| 10:08 | 「工程模式和普通模式的区别不在于工作方式，而在于约束强度，管理工作的逻辑应该是一样的」 | **总纲**（单套逻辑） |
| 10:13 | 「普通模式都应该用跟工程模式轻通道类似方式，一批批落地以后收口时走文档规范化和评审」 | 落地与收口节奏 |
| 10:15 | 「普通模式没有 eng-designer，文档规范化的工作（其实 eng-designer 的全部工作）都应该由主 agent 自己做，做完了评审」 | 文档工作面 = 主 agent 全担 |
| 10:16 | 「普通模式下编码可以自己做也可以交给 coder 做」 | 实施面两可 |
| 10:19 | 「不要，要跟工程模式一致，不要搞出两套不同的逻辑来，否则一切切换模式就傻了」 | **单套逻辑**（禁旁支） |
| 10:21 | 「文档规范化的要求应该跟 eng-designer 一致……不要搞出两套不同的逻辑来」（自正 eng-coder ⇒ eng-designer） | 规范化标准同源 |
| 10:22 | 「开始」 | 立批令 |

### 1.2 登记与射程

- 需求已落 = `docs/core/requirements/NORMAL-MODE.md` §5.6（F-N2.1–F-N2.5 / N-N2.1 + 开放项三条）+ 台账 #1111（需求池 · 板 NORMAL-MODE.md）。
- **本批射程** = 该需求的设计面：① 教学面（台账用法 + 批次档用法 + 收口纪律——`discipline-normal` 双面及其随动）② 机制面（批次档段白名单「模式感知」——普通模式 §2/§5 的作者缝）③ 三开放项落定（与 F2 分档 ∥ F10 衔接 ∥ 段作者映射 ∥ 收口评审形态）④ 下游一致性核对（`docs/core/requirements/PROJECT.md` 定性表 vs「差别只在约束强度」）。
- **本批不做**：机械门不移植（设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门）∥ 不新增设计师角色 ∥ 台账机制本体零改 ∥ 工程模式现有语义零变 ∥ 需求档笔域归主 agent（设计侧只读）。

### 1.3 批前扫描（合并面 · 2026-10-09 10:2x）

- 待讨论需求池 7 条 + 技术待办在册全列扫描——**无同面可并项**（prompt 教学面 / 普通模式管理面挂账为零）。邻面 #1100（文档注入 · 声明源保底名额）不并——不同 face（注入块 ≠ 管理教学）。
- 机制缺口（设计轮补）：批次档 §2 ∥ §5 在普通模式**无作者**（段白名单按工程角色写死——`thincoder-core/agent-tools/batch.mjs`；设计档口径 = `docs/core/design/BATCH-RECORD.md` §4.1/§4.2）；`coder` 子代理无 `batch` 装配（`thincoder-core/agent/family-tools.mjs`）。

### 1.4 父侧亲验（设计轮后 · 2026-10-09 10:5x）

- **设计档实读核过**：`BATCH-RECORD.md` §4.16 全设计（模式位执行期实读 ∥ 白名单两域 ∥ coder 可选绑定 ∥ 骨架模式变体 ∥ 零变面）∥ `PROMPT-SYSTEM.md` §6.21 + D-PS29 ∥ `AGENT-LOOP-SUBAGENT.md` §6.29.1 主语随正 ∥ 批档 §2（2.1–2.9 全节）。
- **机检两条残留（均父侧笔）已收正**：`MEMORY.md:845` 裸路径 ⇒ 全路径形（锚闸复位）∥ `NORMAL-MODE.md` §5.6 折行——复跑 **doc-check exit 0**（锚 0 悬空 ∥ 行宽 OK）。
- **需求侧随动（父侧笔）**：§5.6 设计轮落定三条 + 依赖行落点三处 ∥ `PROJECT.md` §5.5 两处滞后收正 + 定性句（差别只在约束强度）。
- **设计席待裁 1（双面四档 vs 三档六文件）**：父侧裁定 = **接受三档（六文件）**——理由在册（D-PS29）；需求档依赖行已同步收正。

### 1.5 授权（用户 10:41 · 代点火 + 代签 + 排空）

用户原话：「点火」+「你直接跑完吧。」⇒ 本批链上：① 设计评审点火权（代点火——**本笔已发**）② §4 批准权（代签）③ 修正轮 ∥ 实施轮派发 ④ 收口核销 ∥ 提交 ∥ 推送 ∥ token 消费——父侧自动执行，跑到收口。

**父侧自缚三条**（先例同形）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停、只摆那一条；③ 破坏性 ∥ 不可逆 ⇒ 先停。

### 1.6 评审轮 1 裁定（父侧 · 10:5x）

- 发现 9 条（🔴2 ∥ 🟡4 ∥ 🔵3）——**逐条裁定 = 接受（9/9）**；修复轮已派 eng-designer（round=fix；批档 §3 轮次 1 表 = 修复清单）。
- 父侧笔随动：`docs/core/requirements/NORMAL-MODE.md:116` 边界措辞收口（不新增工程三门 + 携批次档绑定的实施子代理随绑定受既有批次档写门；第三门名统一「写文件门禁」——权威措辞 = `docs/core/design/ADVISOR-CONVERGENCE.md:378`）。
- 引文核：评审 host-verify 报 `docs/core/design/BATCH-RECORD.md:419` content mismatch——父侧实读 :419 = A8 行（含「段白名单枚举」）**表述相符**（host 侧解析基疑异，登记备查）。
- 评审产物核：§3 写入成功（9 行表 + 计数 + VERDICT 在档）；token 未签发（changes-required）。

### 1.7 评审轮 2 + 修复轮 2（父侧 · 10:55–11:05）

- **评审轮 2 = pass**（前轮 9 项 9 Fixed 复核在盘；新增 2 条非阻断：🟡 #10 `BATCH-RECORD.md:26` 描述生成法两说 ∥ 🔵 #11 需求档变更记录缺 fix 条目）；token 已签发（凭证不落档）。
- 裁定：#11 = **Fixed（父侧本笔落盘——`NORMAL-MODE.md` 变更记录补「设计轮落定 + 评审随动」条目）**；#10 = **Dispatched（修复轮 2 已派 eng-designer——单点收正）**。
- 修复轮 2 落地并核验后 ⇒ §4 代签（三条件）→ 派实施轮（eng-coder · initial）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮 2 落位（评审轮 2 #10 单点收正——§2.11 补记））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

> 本批 = **普通模式工作管理统一**（批次档 + 台账 + 收口——两模式同一套管理逻辑，差别只在约束强度）。
> 需求 = `docs/core/requirements/NORMAL-MODE.md` §5.6（F-N2.1–F-N2.5 / N-N2.1）；讨论 = 本档 §1；台账 = #1111。
> 设计档修订已落盘：`docs/core/design/BATCH-RECORD.md`（§4.16 等——§2.4 逐项）+ `docs/core/design/PROMPT-SYSTEM.md`（§6.21 等——§2.4 逐项）。
> 提示词实体落笔 = 本批实施轮（本 §2 = 逐字草案唯一承载面——一次性材料不混入设计档，D2）。

### 2.1 本批条目（覆盖——三向对照）

| 需求条目（`NORMAL-MODE.md` §5.6） | 本批任务 | 验收回指 |
|---|---|---|
| **F-N2.1** 台账用法教学 | `discipline-normal.md` **双面新增节**「工作管理（批次档 + 台账 + 收口）」——「台账用法（何时动账）：登记 / 推进 / 挂账 / 收口核销」子节 | §2.6 AC-1；逐字 = §2.3-A |
| **F-N2.2** 批次档（一交付目标 = 一批档；过程记档；收口冻结） | 同节「批次档用法」子节（界定 / 建档触发 / 过程记档 / 作者席 / 护栏）+ 机制面作者缝（§4.16） | §2.6 AC-2 ∥ AC-5；逐字 = §2.3-A |
| **F-N2.3** 落地与收口（轻通道式：一批批落地；收口一次走文档规范化 + 独立评审（+ 必要测试）→ 核销；收口未落 ⇒ 不许核销；路由判据与工程同源） | 同节「收口纪律」子节（落地 / 提请触发 / 五步链 / 未落不核销 / 跨会话接手） | §2.6 AC-3；逐字 = §2.3-A |
| **F-N2.4** 文档工作面（不设设计师角色——全部工作主 agent 自担；完成后走评审；标准与 eng-designer 同套） | `persona-normal.md` **双面**身份句（无设计师角色 + 管理面自担）+ 同节「作者席」句 | §2.6 AC-4；逐字 = §2.3-B |
| **F-N2.5** 实施面（主 agent 直做 ∥ 交 coder——按任务大小自选） | 机制面：coder §5 记录通道（**可选绑定**——不移植强制门）+ 同节「过程记档」句（未绑定 ⇒ 代记打标） | §2.6 AC-5；机制 = §2.4 |
| **N-N2.1** 单套逻辑（普通专属管理旁支 = 缺陷；每条对到工程同源或明标约束强度差异） | §2.2 同源对照表（逐条对位）；教学文本 = 工程同构改写 | §2.6 AC-6 |

**边界（本批不做）**：不加机械拦截（§5.3 N1 现行不变）· 设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门——不移植 · 不新增设计师角色（**无新角色 / 无新工具 / 无新机械门**）· 台账机制本体零改 · 工程模式现有语义零变（白名单 / 冻结门 / F11 族 / create·close 身份判据逐字不变）。

### 2.2 机制设计（模式感知作者缝——概要；精读 = `BATCH-RECORD.md` §4.16）

**问题**：段白名单按工程角色写死 ⇒ 普通模式 §2 ∥ §5 无作者。**判据** = 管理逻辑一套（N-N2.1）；**缝形** = 模式位**执行期实读**（`ctx.agent.config?.agent?.engineering`——翻转安全；装配期传位否决）。

**逐字文案 deltas（英文面——实现按此落）**：

| 面 | 现文（要点） | 新文 |
|---|---|---|
| `batch.mjs` execute——depth-0 append 域 | §1/§4/§6（模式无关） | 模式键：工程 = §1/§4/§6（**逐字零变**）；普通 = §1/§2/§4/§5/§6 |
| `batch.mjs` execute——depth-0 append 拒文案 | `batch: §N is not yours to write — depth-0 append writes §1/§4/§6 only (一段一作者: §2 = eng-designer, §3 = design review, §5 = eng-coder).` | 工程面零变；普通面新串：`batch: §N is not yours to write — in normal mode depth-0 append writes §1/§2/§4/§5/§6 (一段一作者: §3 = design review only). Nothing was written.` |
| `batch-lifecycle.mjs`——depth-0 status 域 | §1 | 模式键：工程 = §1（零变）；普通 = §1/§2/§5（`segment` 缺省 = §1；写域仍「调用者自己段」） |
| `batch-lifecycle.mjs`——depth-0 status 拒文案 | `batch: §N is not yours to write — status writes YOUR OWN section §M only (一段一作者: eng-designer → §2, design review → §3, eng-coder → §5, main agent → §1).` | 工程面零变；普通面新串：`batch: §N is not yours to write — in normal mode status writes §1/§2/§5 only (一段一作者: §3 = design review; §4/§6 carry no status word list). Nothing was written.` |
| `batch.mjs`——`segment` 参数描述 | `…main agent: append §1/§4/§6 · status §1 — D-BR21; eng-designer §2; design review §3; eng-coder §5…` | 主 agent 段补普通面：`…main agent: append §1/§4/§6 · status §1 (engineering) / append §1/§2/§4/§5/§6 · status §1/§2/§5 (normal); eng-designer §2; eng-coder §5; normal-mode coder with a batchDoc binding §5; design review §3…` |
| `subagent.mjs`——`batchDoc` 参数描述 | `REQUIRED for role='eng-coder'/'eng-designer': …Refused when absent or when the path does not resolve to a readable file…` | 句尾补：`role='coder' (normal mode): optional — binds this spawn's §5 record-write channel (unbound ⇒ the main agent records §5 on its behalf); when provided the path must resolve to a readable file.` |
| `tool-docs/batch.md`——段白名单句 | `main agent (depth 0) — append §1/§4/§6, status §1 only, create/close; eng-designer — §2; eng-coder — §5; design review (review binding) — §3.` | `main agent (depth 0) — create/close; append/status domains are mode-dependent: engineering — append §1/§4/§6, status §1; normal — append §1/§2/§4/§5/§6, status §1/§2/§5 (the main agent holds the designer seat and records direct implementation); eng-designer — §2; eng-coder — §5; a normal-mode coder bound via batchDoc — §5; design review (review binding) — §3.` |

**行为 deltas（代码面）**：

1. `batch-skeleton.mjs`——`SEGMENT_BY_ROLE_NORMAL = { "coder": 5 }`（**工程面 `SEGMENT_BY_ROLE` 表零字面改**；合并查只在普通模式腿）+ depth-0 两集模式键常量（append / status）+ `batchSkeleton({mode})` 普通变体（四处替换 = §4.10 普通变体块；工程产出逐字不变）。
2. `batch.mjs` / `batch-lifecycle.mjs`——execute 期读模式位按域取集；`create` 传 mode 给 skeleton；**`batch_segment:` 迁移面串 / 冻结门 / F11 族 / close 零改**。
3. `family-tools.mjs`——coder 分支：`agent?._batchDoc` 在场 ⇒ 追加 `batchTool`（未绑定不挂载——语法面不可达；eng 两分支零改）。
4. `subagent-spawn.mjs`——角色门补 coder 可选臂：`role === "coder" && batchDoc` ⇒ 同族可读性探测（不过 ⇒ 拒，文案同族）；`child._batchDoc = batchDocAbs` 绑定；spawn 固块行 `Batch record (batchDoc): <abs>` 同推（绑定 coder 要能读到本档；eng 面零改）。
5. **随带效果（披露——非新增门）**：携绑定 coder 落入 `§6.29.1` 批次档写门 containment（键 = `_batchDoc` 在场——判据零改）：写他批档被拒 ∥ 写自身档 / 自身批次伴随件放行。

**同源对照（N-N2.1 判据——每条对到工程同源）**：

| 本批条 | 工程同源 | 差异性质 |
|---|---|---|
| 台账四事件（登记 / 推进 / 挂账 / 收口核销） | `persona-engineering.md`「台账」节攒批与生命周期 + 台账治理五条（§6.20）∥ `LEDGER.md` | **零差异**（同文本结构、按普通模式单位改写） |
| 批次界定 / 零链面 / 收口冻结 | `BATCH-RECORD.md` §5.1（L1–L8）∥ `LIGHT-CHANNEL.md` | **零差异**（同判据） |
| 收口五步链（文档规范化 → 独立评审 → 修复 → 批准 → 收口核销） | `LIGHT-CHANNEL.md` §2.4 收尾全链 | **零差异**（同链序） |
| 建档触发 = complex 档 | 工程「批点火」（批设计 → 用户批准） | **约束强度差异**（工程 = 批准门；普通 = 任务确认即开批） |
| 段作者缝（§2/§5 无作者） | `BATCH-RECORD.md` §4.1/§4.16 | **约束强度差异**（工程 = spawn 强制绑定机械门；普通 = 可选绑定 + 纪律） |
| 收口评审 = 交付物级（落码 ∥ 记录 ∥ 文档对账） | `LIGHT-CHANNEL.md` §2.4 + ADVISOR 机制（同工具通道） | **零差异**（同通道同落档 §3） |

### 2.3 教学面逐字草案（CN 正本语义——EN 按 M9 翻译回写；落笔 = 实施轮）

**A. `discipline-normal.md`（CN ∥ EN 双面）——新增节**「工作管理（批次档 + 台账 + 收口）」（插入锚 = 「`## 任务边界` 节前」；as-of 2026-10-09 实读 CN `:84` ∥ EN `:84`）：

```md
## 工作管理（批次档 + 台账 + 收口）

与工程模式**同一套管理逻辑**——批次档 + 台账 + 收口；差别只在约束强度：那边靠机械门兜底，这边靠纪律自持。三条用法：

### 台账用法（何时动账）

台账（工具 `ledger`；命令面 `/ledger`）= 项目待办簿：需求池 + 技术待办，跨会话持久；**写 = 主 agent 独属**（子代理读得到、写不了——新发现在报告里上抛）。六态：待讨论 → 待设计 → 在途 → 待核销（未决四态）· 已核销 / 已废弃（归档）。**四个动账时点**：

- **登记**——用户提出一条真需求（complex 档工作：3+ 步 / 新功能）⇒ 入需求池一行（`title` = 需求名、`board` = 归属板块）；登记前先扫同面既有行——同类并入，否则注记关系。
- **推进**——任务确认、建档开批 ⇒ 行连步至**在途**（待讨论 → 待设计 → 在途），`task_book` 指批次档；**账在笔前**：建档、挂行之后才动第一笔。
- **挂账**——工作中发现新缺陷 / 欠账 / 文档漂移 ⇒ **当天**入账（技术待办）；`trigger` 三值任选一：`归批`（批名写进 `evidence`）· `条件`（条件句写进 `evidence`）· `认账不排期`；绝不只活在报告散文或代码注释里。
- **收口核销**——批收口链跑完 ⇒ 行两步迁移（在途 → 待核销 → 已核销；在途不可跳核销），结账依据写进 `evidence`（批次档节 / 落点坐标 / 提交号）；**收口未落 ⇒ 不许核销**。

### 批次档用法

**一交付目标 = 一批档**（界定规则与工程同源）：交付目标变更（主题词变）∥ 阶段跨越 ∥ 条目集变更 ⇒ 另起新批新档。**建档触发 = complex 档**（3+ 步 / 新功能）；诊断 ∥ 只读探查不建档（零链面——不建档不挂账）；中小改动照旧：所属文档回填 + `task`。

- **建档**（主 agent 独属）：`batch` 的 create——六段骨架一次预齐；**账在笔前**：先建档，再挂台账行（行 `task_book` 指该档），然后动第一笔。
- **过程记档**：逐笔记 `§1`（改动坐标 ∥ 走查读数 ∥ 台账行）；`§2` = 批次任务与设计；`§5` = 实施记录——**实施者自写**（工程同源）：你直做 ⇒ 你写；交 coder 承办 ⇒ 派单时传 `batchDoc`，它自己写；飞刀等未携绑定的承接 ⇒ 你按它的报告与复核代记、注明来源。冻结后不回改——改 = 新批新档。
- **作者席**：普通模式没有设计师角色——`§1` / `§2` / `§4` / `§5` / `§6` 的笔都在你手里（§2 的设计师席并入）；`§3` = 独立评审。
- **护栏**（与工程同判）：单档 >1000 行 = 越界信号 ⇒ 另起新批；已写内容不回改；判权 = 主 agent；子代理撞到批边界 ⇒ 停下打回。

### 收口纪律

**落地**：一批批落地——细节 ∥ 缺陷 ∥ 现场点名的问题直接改（不逐笔走设计 → 评审门）；路由判据与工程同源、不另立：新机制 ∥ 大改 ⇒ 先设计后动手；其余直接落、由收口兜底。

**收口一次跑全链**（触发时点——提请义务在你）：用户说「收口」∥ 自然停顿 ∥ 话题转换 ∥ 收束信号——提请形 = 一句：批 ∥ 笔数 ∥ 欠的步 ∥ 回一句即跑，不追催。

1. **文档规范化**（你自担——与工程设计师同套标准）：已落改动逐处形式化落 `§2`（类 ∥ 出处 ∥ 落地坐标 ∥ 文档一致化去向）；文档与实现对账至一致。
2. **独立评审**：`advisor`（`type:"design"`，携落点文档集 + 本档 `batchDoc`）——对账 = 落码 ∥ 记录 ∥ 文档；发现表与 VERDICT 由评审写进 `§3`。
3. **修复（若有）**：逐条处置——你修 ∥ 打回。
4. **批准**：用户确认记录落 `§4`。
5. **收口核销**：`§6` 记收口 + 必要测试与收口测试行；台账行两步迁移至已核销；`batch` 的 close 冻结本档。

**收口未落 ⇒ 不许核销**（台账行挂住不给过）。**跨会话接手**：会话开局扫未收口批（`§1` 状态行非「已收口」∥ 台账行未核销）——见 ⇒ 先提请收口。
```

**B. `persona-normal.md`（双面）——身份句**（「能力边界」节内，「主代理角色——…」行后；EN 面插 `## Main-agent role` 节内同位）：

```md
**管理面你自担**：普通模式没有设计师角色——需求整合 ∥ 设计文本 ∥ 收口文档规范化由你自己做（标准与工程模式的设计师同套），做完走独立评审；批次档 ∥ 台账 ∥ 收口全归你写。
```

**C. `common.md`（双面）——六段全图行换写**（「批次档常识」节内；同节其余行零改）：

```md
**六段全图（一段一作者）**：§1 讨论 = 主 agent · §2 批次任务与设计 = eng-designer（工程）∥ 主 agent（普通）· §3 设计评审发现表 = 评审子代理（advisor）· §4 用户批准 = 主 agent · §5 实施记录 = eng-coder（工程）∥ 实施者（普通——主 agent 直做 ∥ coder 承办）· §6 验证与收口 = 主 agent（子代理侧称父代理）。
```

### 2.4 设计档落点（本设计轮已落盘）

| 档 | 本批笔 |
|---|---|
| `docs/core/design/BATCH-RECORD.md` | §4.1 段白名单行（模式感知）· §4.2 coder 可选绑定 bullet + 两道门行收正 · §4.3 挂载表 +coder 行 · **§4.16 新增**（普通模式作者缝——全设计：模式位读点 / 白名单表 / coder §5 归属 / 骨架模式化 / 零变面 / 常量面 / 否决备选）· §4.8 **BR-46–BR-53** · §4.10 骨架普通变体块 · §4.11 骨架取形句 · §5 纪律表「六段自写」行 · §7 **D-BR26 ∥ D-BR27** · §8 边界 10 · §2 门禁表角色域行 + D-BR3 补注 · 变更记录 +1 |
| `docs/core/design/PROMPT-SYSTEM.md` | **§6.21 新增**（普通模式工作管理统一·普通侧三档——来源 / 机制 / 分层归属（四问）/ 形态 / 落点 / 计数连带 / 机检面 / 边界）· §6.1 应用实例清单 +1 条 · §7 **D-PS29** · §10.2 行 8 复算（21/21 ⇒ 25/25——收口轮复算）· 变更记录 +1 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.29.1 判据行主语收正（「工程角色子代理」⇒「携绑定的子代理」——随动；门本体零改）+ 变更记录 +1 |
| 零触（已核） | `TOOLS.md`（§6.15.2 ∥ §6.20 均不承载段白名单枚举——零改）· `LEDGER.md`（台账机制本体零改）· `ENGINEERING-MODE-V2.md`（工程语义零变）· 需求档（主 agent 笔——U 项见 §2.8） |

### 2.5 受影响文件与测试面（实施轮）

| 文件 | 现况（as-of 2026-10-09 实读） | 预期 Δ | 备注 |
|---|---|---|---|
| `thincoder-core/agent-tools/batch.mjs` | 323 行 | +20 −8 ⇒ ≈335 | execute 模式位 + depth-0 append 域取集 + 拒文案 + `segment` 描述面 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 354 行 | +12 −4 ⇒ ≈362 | depth-0 status 域取集 + 拒文案 + create 传 mode |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 200 行 | +24 −4 ⇒ ≈220 | `SEGMENT_BY_ROLE_NORMAL` + depth-0 两集常量 + 骨架模式变体 |
| `thincoder-core/agent/family-tools.mjs` | 190 行 | +2 −1 ⇒ ≈191 | coder 分支挂载臂（`agent?._batchDoc` 在场才挂） |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 398 行 | +8 −2 ⇒ ≈404 | coder 可选臂（探测 + 绑定 + 固块行推入） |
| `thincoder-core/agent-tools/subagent.mjs` | 414 行 | ±0（句内换写） | `batchDoc` 参数描述补 coder 可选句 |
| `thincoder-core/tool-docs/batch.md` | 1 行（单段文本） | ±0（句换写） | 段白名单句（§2.2 表） |
| `thincoder-core/prompts/discipline-normal.md`（EN） | 218 行 | +≈38 ⇒ ≈256 | 新增节（§2.3-A） |
| `thincoder-core/prompts/persona-normal.md`（EN） | 45 行 | +1 ⇒ 46 | 身份句（§2.3-B） |
| `thincoder-core/prompts/common.md`（EN） | 197 行 | ±0（行换写） | 六段全图行（§2.3-C） |
| `docs/core/design/prompts/discipline-normal.md`（CN） | 214 行 | +≈38 ⇒ ≈252 | 同文（正本） |
| `docs/core/design/prompts/persona-normal.md`（CN） | 40 行 | +1 ⇒ 41 | 同文（正本） |
| `docs/core/design/prompts/common.md`（CN） | 152 行 | ±0（行换写） | 同文（正本） |
| `docs/batches/2026-10-09-normal-work-management.test.mjs` | 新档 | ≈150–200 | 单元件（实施者写并跑——随批档归档；案例 = §2.6 AC-5 / AC-7） |

**测试面**：无存活单测树（2026-09-28 全清在册）——本批单元件 = 上表新档（一批一档、随批档归档）；集成面零新增（纯机制 + 提示词面——前端入口不可见）。行数面：全部 ≤500 硬限；`batch.mjs` / `batch-lifecycle.mjs` / `batch-skeleton.mjs` 均 <500（拆分评估 = 下批触发制，随本批改动实测复核）。

### 2.6 验收对照（机器可验证——实施轮 + 收口轮）

| # | 判据 | 回指 |
|---|---|---|
| AC-1 | 落地档 ↔ §2.3-A 围栏块一次性比对相符（四面）——`##` 块 7 ⇒ 8 · 标题节点 25/25（CN ∥ EN 复算） | F-N2.1 |
| AC-2 | 「批次档用法」块在场（界定 / 建档触发 / 过程记档 / 作者席 / 护栏五件齐） | F-N2.2 |
| AC-3 | 「收口纪律」块在场：五步链 + 「收口未落 ⇒ 不许核销」+ 跨会话接手句 | F-N2.3 |
| AC-4 | `persona-normal.md` 双面身份句在场（比对 §2.3-B） | F-N2.4 |
| AC-5 | 新档单测：普通 depth-0 append §2 ∥ §5 成功 + §3 拒 · status §2 成功 + §3/§4/§6 拒 · coder 携绑定 §5 成功 · coder 未绑定（工具表不含 `batch`）· create 普通骨架四处替换形 · 模式翻转即时生效（同会话 eng→normal 后 §2 可写） | F-N2.5 · §4.16 |
| AC-6 | 同源对照表零悬空（每条对到工程同源或明标差异）· `common.md` 六段行已模式分辨（比对 §2.3-C）· `scripts/doc-check.mjs` exit 0（设计档面无新增悬空；CN 新行 ≤300） | N-N2.1 |
| AC-7 | 工程面逐字零变回归：`SEGMENT_BY_ROLE` 表 · 工程拒文案 · 工程骨架产出 · 既有 `batch_segment:` 面——单测断言 | 边界（§2.1） |

### 2.7 关键决策（指针）

- **D-BR26**（段白名单模式感知——执行期读模式位）∥ **D-BR27**（coder §5 = 可选绑定自写）——`BATCH-RECORD.md` §7；否决备选在册。
- **D-PS29**（普通模式管理教学 = 普通侧三档）——`PROMPT-SYSTEM.md` §7；否决备选在册。
- 教学面三条时点落定（需求开放项 ①②③）：① 建档触发与分档衔接 = complex 档（§2.1 表 + §2.3-A）；② 段作者映射 = §4.16；③ 收口评审形态 = 交付物级 `advisor(type:"design")`（对账 = 落码 ∥ 记录 ∥ 文档——§2.3-A 收口步 2）；**F7（逐笔代码评审）零改、不替代**——两评审对象不同（单笔 ⇄ 交付物整体）。

### 2.8 上抛项（父侧裁量——本设计不动）

1. **[待裁]** 需求档依赖行「提示词**双面四档**（EN 核内 + CN 正本）」（`NORMAL-MODE.md:119`）与本设计落点「双面三档 = 六文件」（`discipline-normal` 双面 + 随动 `persona-normal` 双面 + `common` 双面）口径差——我的判读：教学主体 2 档（F-N2.1 判定句钉面）+ 随动 2 项；**保留两者之理由**：F-N2.4（角色边界）归人格层、`common` 六段行不修即与普通面现实互斥（加载层间矛盾）；若须严格收四档，裁掉项 = `persona-normal` 或 `common` 之一（建议不裁）。U 项 = 父侧知悉 / 需求档按需收正（主 agent 笔）。
2. 需求档 §5.6 **开放项三条已在设计中落定**（去向 = §2.7）——括注「（设计轮收口）」可更新（主 agent 笔）。
3. `PROJECT.md` §5.5 定性表两处滞后（勘察发现）：① 「质量靠什么」行把「独立评审」归工程专属——普通模式现已同套（收口链含独立评审）；② 行 1 普通侧未含批次档 / 收口。**拟文本上抛**（本批不动需求档；具体措辞与落点 = 主 agent 定）。
4. 边界注记（非阻断）：未移植项 = 会话开局台账**池面**自查（工程治理块既有——普通侧候补，随台账治理面另议）；教学文本按普通模式单位改写（工程侧旁路术语未引入——普通无旁路可言，路由判据以同源口径书写）。

### 2.9 设计轮机检读数（2026-10-09 · doc-check · 本批面）

**本批自修（一致性面——语义零改，已复核 ≤300）**：本设计轮 4 条新增超宽行就地折行——`docs/core/design/AGENT-LOOP-SUBAGENT.md:780`（§6.29.1 判据行）· `docs/core/design/PROMPT-SYSTEM.md` §6.21 机制行 ∥ 落点行 + 变更记录行。

**当前残留 2 条（均非本批笔——已核零触）**：

| # | 读数 | 归属 | 处置建议（非本批执行） |
|---|---|---|---|
| 1 | `docs/core/design/MEMORY.md:845` 坐标 `setup.mjs:111` **悬空**（闸态——阈值 0） | 他批落点（本批零触 MEMORY.md） | 坐标补全路径或就地收正（谁落谁修——跨批语义，本批不代修） |
| 2 | `docs/core/requirements/NORMAL-MODE.md:102` 行宽 352 字符（来源引述行） | 主 agent 笔（需求档） | 折行（引述内容零改）——父侧处置 |

**本批设计档面**：零新增悬空（本批新增坐标逐条实核在案）；符号面 `SEGMENT_BY_ROLE_NORMAL` 等 = 新设计导出名（实施轮落地——拟新增态列报不入闸）。**§2.6 AC-6 机检面读数以本表为准**（exit 0 依赖上表 2 条收口——非本批笔）。

### 2.10 修复轮落位（评审轮 1 · 发现 1–9——2026-10-09 · 执行人 = eng-designer）

**本补记 = 终形（现文以本补记为准；被取代项清单见末尾）。** 父侧裁定 = 9/9 接受；逐号落点（号 → 改动；坐标 = as-of 本补记）：

1. `docs/core/design/BATCH-RECORD.md` §4.12（`:241-244` 参数面三件登记——`segment` 补登记：声明核对 / 取段两面 + 越段拒面 ∥ `:247` 主 agent 写域句模式限定）；§4.1 / §4.3 核对 = 无落差（零笔）。
2. `BATCH-RECORD.md` §4.16（`:320-322` 新增「描述面处置」——模式无关措辞；否决模式化装饰 ∥ `:328` 零变面列表收正——增「非零变（换写面）」句；A8 / A2 锚面随动判定在段内）。
3. `BATCH-RECORD.md` §4.16（`:312` 新增「随带效果」句）∥ `:500-501` §8 边界 10 收口（不新增三门 + 携绑定随绑定受既有批次档写门——第三门名统一「写文件门禁」）；`docs/core/design/PROMPT-SYSTEM.md` §6.21 边界行同拍（`:548`）。
4. `BATCH-RECORD.md` §4.16（`:314-315` 新增「收口评审对接口」——`type:"design"` + `batchDoc` ⇒ §3 工具轮次行 ⇒ V3 同判零假阳）+ §4.5 调用侧句同径（`:103`）；`PROMPT-SYSTEM.md` §6.21 副指针（`:533`）。
5. `PROMPT-SYSTEM.md` §6.21（`:534` 新增段 ②——路由判据承载 = 教学块「收口纪律 · 落地」，同源指针形）。
6. `BATCH-RECORD.md` §4.16（`:324-325` 新增「VSC 锚面随动判定」——VSC 侧须同步 ∥ 差异零 ∥ 落笔归 VSC 轮；理由三条）。
7. `PROMPT-SYSTEM.md` §6.21（`:535` 新增段 ③——F-N2.4「同套标准」句面登记：教学双处）。
8. `BATCH-RECORD.md` §4.16（`:318` 「骨架模式化」补「已知边界（骨架取形时点）」句）。
9. `docs/core/design/AGENT-LOOP-SUBAGENT.md`（`:1037` 来源指针收正——`§2` ⇒ `§2.2` 精确形）。

**变更记录行随动**：三档各 +1 条（`BATCH-RECORD.md:608-611` ∥ `PROMPT-SYSTEM.md:853-854` ∥ `AGENT-LOOP-SUBAGENT.md:1039`）。
**行随动（现文以本补记为准）**：① §2.1 边界句「设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门——不移植」收口为「不新增工程三门 + 携批次档绑定的实施子代理随绑定受既有批次档写门（非新增门）」（第三门名统一「写文件门禁」；父侧已同步需求侧 `NORMAL-MODE.md:116`）；② §2.4 表三档行随动（BATCH-RECORD 行 + §4.12 ∥ §4.5 ∥ §4.16 五段 ∥ §8#10；PROMPT-SYSTEM 行 + §6.21 一段；AGENT-LOOP 行 + 指针对核）；③ §2.9 机检读数行随动（残留 2 条父侧已收正——§1.4；本修复轮复跑 `scripts/doc-check.mjs` = exit 0——锚 0 悬空 ∥ 行宽清零）。
**AC 面**：零随动（九条 = 契约面补全 / 登记 / 措辞——AC-1–AC-7 判据面零变）。
**被取代项清单（防重开）**：§2.1「写文件门——不移植」∥「普通面零机械强制」⇒ 不新增三门 + 随绑定受既有门；§2.9「当前残留 2 条」表 ⇒ 父侧收正 + 本轮复跑读数。
**零触面（显式）**：工程面判定字面（§1/§4/§6 ∥ §1 ∥ `SEGMENT_BY_ROLE` ∥ review→§3）逐字不变 · §2.2 文案表本体（本次仅补登记承载地位）· 需求档零笔（父侧）· 提示词实体零笔（实施轮）· `ENGINEERING-MODE-V2.md` ∥ `LEDGER.md` ∥ `TOOLS.md` ∥ `ADVISOR-CONVERGENCE.md` 零触 · §3 评审产物不回写。

### 2.11 修复轮 2 落位（评审轮 2 · 发现 #10——2026-10-09 · 执行人 = eng-designer）

**口径**：单点收正——裁定 §4.16:320 为准（语义零改）；改 `docs/core/design/BATCH-RECORD.md:26` 半句，使两处收口一致（同一 `subagent.mjs` 描述属性面——描述生成法两说 ⇒ 单说）。

**#10 → 改动 `docs/core/design/BATCH-RECORD.md:26`**（§2 门禁表「参数 schema」行）——逐字改动句：`模型面描述文案 = **模式无关措辞**（两模式分支同列、不随会话模式变动——§4.16「描述面处置」）`（原半句「按**角色集**（eng-coder / eng-designer）参数化」= 失效表述，已删）。

**同族核面（§2 门禁表逐行——只收同族）**：描述生成法面仅「参数 schema」行承载——其余六行零笔（「越界文案」/「注入」= 错误文案 ∥ 固块行面，非描述面；余四行 = 门判据 / 落点 / 解析 / 变体面）。

**随动**：设计档变更记录 +1 条（`BATCH-RECORD.md` 档尾——fix 轮 2）；机检 = `node scripts/doc-check.mjs` exit 0（2026-10-09 复跑——锚 0 悬空 · 行宽 0 超宽）。
**零触面（显式）**：工程面判定字面（§1/§4/§6 ∥ `SEGMENT_BY_ROLE`）· §4.16:320 语义 · 需求档 · 提示词实体 · 代码 · §3 评审产物——全部零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审范围（设计评审 · 普通模式工作管理统一批）：`docs/core/design/BATCH-RECORD.md` §4.16 + §4.8 BR-46–BR-53 · `docs/core/design/PROMPT-SYSTEM.md` §6.21 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29.1 收正行 · `docs/core/requirements/NORMAL-MODE.md` §5.6。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | `status` 契约面同档两处登记不一致：`docs/core/design/BATCH-RECORD.md:241` 参数面只列 `value` 与「`path`（可选——仅 depth-0」，`:244` 写域句作「主 agent → §1（**轮 2 裁定 #3**：写域收为 §1 单段」且无模式限定；而 `:303` 的普通面 status 写域 = §1/§2/§5 并以「`segment` 缺省 = §1」取段，BR-47（`:175`）输入形态亦为「`segment` 指明」——普通模式按 §4.12 读即失实（主 agent 实可写 §2/§5），按 §4.16 读则该取段参数在契约面/ schema 面无登记（含越段拒绝面与文案）。 | 在 §4.12 参数面登记取段参数（缺省 §1、两模式取值面、越段拒绝面），并把 `:244` 写域句做模式限定或加 §4.16 指针；同步核对 A2（`:413`）/ A8（`:419`）锚面与工具 schema 面是否随动。 |
| 2 | Clarity | 🔴 | 模式感知段白名单未处置 `batch` 工具的**描述面**（模型可见面）：A8（`docs/core/design/BATCH-RECORD.md:419`）登记描述文案含「段白名单枚举」且为跨仓 grep 逐字锚；白名单改按模式（`:302`–`:305`）后该面文案要么失实要么需改，而 §4.16 零变面（`:311`）只列错误文案 / 冻结门 / F11 族 / 凭证剥除 / 来源戳 / `MAX_TEXT_CHARS`，对描述面**零处置句**；D-BR26（`:469`）已否决「装配期传位」，描述面（装配期生成）在会话中途翻转下如何保持正确亦无裁。 | 增登记描述面处置（模式无关措辞 ∥ 模式化装饰及其陈旧面处置），并同步 A8 / A2 锚面随动判定；若文案归主 agent 内容权，按「逐字文本 = 批档 §2」路径登记。 |
| 3 | Scope | 🟡 | 边界措辞与写门扩面张力：`docs/core/requirements/NORMAL-MODE.md:116`「设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门——工程模式专属，不移植」＋ `docs/core/design/BATCH-RECORD.md:483`「普通面零机械强制」，与 `docs/core/design/BATCH-RECORD.md:77`「携绑定的子代理（工程角色 ∥ 普通面 coder——§4.16）直写他批档被拒」并 `docs/core/design/AGENT-LOOP-SUBAGENT.md:780`（§6.29.1 判据）相抵——携绑定的普通面 coder 实际受机械写门；且该「工程第三门」两处名称不同（`NORMAL-MODE.md:116` 作「写文件门」∥ `BATCH-RECORD.md:483` 作「设计前写门」）。 | 收口边界措辞：把「零机械强制」限定为「不新增工程三门」，并明示「携绑定即随绑定受既有 containment 门」；统一第三门名称或标注两名同物。 |
| 4 | Acceptance criteria | 🟡 | 普通面收口评审与 §3 / V3 判据对接未登记：需求 F-N2.3（`docs/core/requirements/NORMAL-MODE.md:111`）＋设计轮落定 ③（`:118`「交付物级独立评审」）未定通道；`batch` 仅对「`reviewType === "design"` 且 batchDoc 已绑定」挂载（`docs/core/design/BATCH-RECORD.md:87`），V3 触发于「§4 或 §6 有实质内容」并只认 §3 的工具写入轮次行（`:110`）——普通批收口必有 §4/§6 实质内容，若收口评审走代码评审通道则 §3 无工具轮次行 ⇒ V3 判违规（假阳面）。 | 登记普通面收口评审的 `reviewType` 归宿与 `batchDoc` 传参纪律（§4.5 调用侧句覆盖），或明示 V3 对普通批的处置。 |
| 5 | Requirements | 🟡 | F-N2.3 尾句「轻径 ∥ 全链的路由判据与工程同源、不另立」（`docs/core/requirements/NORMAL-MODE.md:111`）无落点：教学面三块（`docs/core/design/PROMPT-SYSTEM.md:529`）与设计轮落定三项（`NORMAL-MODE.md:118`）均未含该路由判据的承载声明。 | 登记该路由判据的承载面（同源指针 ∥ 逐字入 `discipline-normal` 新节），或明示其由工程同源档承载、普通侧只留指针。 |
| 6 | Document ownership | 🟡 | VSC 镜像面随动未登记：A1 / A2 / A8（`docs/core/design/BATCH-RECORD.md:412` / `:413` / `:419`）为「VSC 侧宿主逐字相同（grep 断言）」文本锚，其中 A2 / A8 明载「段白名单枚举」；本次改段白名单 + 六段作者行模式分辨（`PROMPT-SYSTEM.md:531`），设计未登记该锚面随动 / 差异判定（§6.3 端特有段处置要求逐项登记）。 | 补登记锚面随动判定（VSC 侧同步 ∥ 差异登记 ∥ 归 VSC 轮），或写明本批不改锚面文本的理由。 |
| 7 | Requirements | 🔵 | F-N2.4「规范化要求 = 与 eng-designer 同套标准（不另立第二套）」（`docs/core/requirements/NORMAL-MODE.md:112`）在设计面的承载句未登记（`docs/core/design/PROMPT-SYSTEM.md:529` 三块清单 ∥ `:533` 分层归属均未含该句面）。 | 在教学块 / 落点清单登记该句面，或明示其逐字入批档 §2。 |
| 8 | Scope | 🔵 | 骨架取形时点未登记已知边界：骨架按 create 时模式位取形（`docs/core/design/BATCH-RECORD.md:309` ∥ `:313`），会话中途翻转（BR-52，`:180`）后标签（§2 作者 ∥ §5 实施者）不随，翻转前取形结果原样留存。 | 登记为已知边界（骨架取形 = 建档时点、翻转不重写骨架），或补一句翻转面处置。 |
| 9 | Methodology | 🔵 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:1037` 来源指针作「承批档 … §2」，同档其他设计轮条目作 §1（如 `:1035` / `:1033`）；批档 §2 不在本评审范围，无法核验是否为笔误。 | 核对批档对应节并统一来源指针形态。 |

计数：🔴 2 · 🟡 4 · 🔵 3（共 9 条），域外注 2（受影响文件行数表归批档 §2 · 不在评审范围，未核；`ENGINEERING-MODE-V2.md` 六段作者面随动未登记，该档不在评审范围）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 验证表（normal-work-management 设计评审 · 逐字）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/BATCH-RECORD.md | 🔴 | Fixed | `status` 契约面已补全：:241 参数面登记 `segment`（`segment`（可选——段声明 / 取段；schema 实装 = `thincoder-core/agent-tools/batch.mjs` 的 `segment` 属性，as-of 2026-10-09 实读））；:242 补「**取段逻辑**：普通面 depth-0（§4.16）= 取段——写域集 §1/§2/§5、缺省 §1、越出集合 ⇒ 拒；其余身份（工程面 ∥ 子代理 ∥ 评审——写域 = 身份段）= **声明段核对**」；:243 越段拒面；:247 写域句已模式限定（「**工程面**：写域收为 §1 单段」「**普通面（§4.16——2026-10-09）：主 agent → §1/§2/§5**」）——与 §4.16:306 表一致。fix 轮记录 = :608–611。 |
| 2 | 2 | docs/core/design/BATCH-RECORD.md | 🔴 | Fixed | 描述面已处置：§4.16:320「**描述面处置（模型可见文案——与白名单同步）**：工具描述文案 ∥ 参数描述面（`tool-docs/batch.md` ∥ `batch.mjs` / `subagent.mjs` 描述属性）**换写为模式无关措辞**」；:321 否决「模式化装饰」；:322「**锚面**：A8（工具描述文案）换写后仍为逐字锚；A2（工程 persona 写入手段句）本批零触、锚文本零变」；:328 非零变（换写面）登记。 |
| 3 | 3 | docs/core/requirements/NORMAL-MODE.md ∥ docs/core/design/BATCH-RECORD.md | 🟡 | Fixed | 边界措辞已收口：NORMAL-MODE.md:116「不新增工程三门（设计令牌 ∥ spawn 强制 `batchDoc` ∥ 写文件门禁——工程模式专属，不移植）；携批次档绑定的实施子代理随绑定受既有批次档写门（随绑定面生效，非新增门）」；BATCH-RECORD.md:500–501 边界 10 去「零机械强制」、补 containment 句 + 第三门名统一「写文件门禁」（权威措辞指针 = `ADVISOR-CONVERGENCE.md:378`）；PROMPT-SYSTEM.md:548 同拍。 |
| 4 | 4 | docs/core/design/BATCH-RECORD.md ∥ docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | 收口评审通道已登记：§4.16:314「**收口评审对接口（V3 假阳面消解）**：普通面收口评审 = **设计评审通道**（`advisor` `type:"design"`——对账对象 = 交付物整体：落码 ∥ 记录 ∥ 文档，与工程收口链同径）」+ :315 否决代码评审通道；§4.5:103「**普通面收口评审同径**（`type:"design"`——§4.16）——传参纪律同本句」；PROMPT-SYSTEM.md:533 同拍。 |
| 5 | 5 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | 路由判据承载已登记：:534「② **路由判据承载**（F-N2.3 尾句）= 教学块「收口纪律 · 落地」——**同源指针形**：判据句直书（「新机制 ∥ 大改 ⇒ 先设计后动手；其余直接落、由收口兜底」）、细则不复制（工程承载 = 轻通道机制块——`docs/core/design/LIGHT-CHANNEL.md` ∥ `discipline-engineering.md`「基本流程」节）」。 |
| 6 | 6 | docs/core/design/BATCH-RECORD.md | 🟡 | Fixed | VSC 锚面随动已登记：§4.16:324（本批触动文本三处 ∥ 工程侧 A1/A2 宿主面本批零触）+ :325「判定 = **VSC 侧须同步**（语义同源文本——非端特有，不设差异登记）；**落笔归 VSC 轮**（跨仓——本批笔域外；P2 归轮惯例——§9）」+「**登记备查**（VSC 轮随本批文本同步）」。 |
| 7 | 7 | docs/core/design/PROMPT-SYSTEM.md | 🔵 | Fixed | 「同套标准」句承载已登记：:535「③ **「同套标准」句承载**（F-N2.4）= 教学双处——收口步 1「与工程设计师同套标准」∥ 身份句「标准与工程模式的设计师同套」（逐字 = 批档 §2.3）；标准本体 = 工程设计师工作标准（不另立第二套）」。 |
| 8 | 8 | docs/core/design/BATCH-RECORD.md | 🔵 | Fixed | 骨架取形时点已知边界已登记：§4.16:318「**已知边界（骨架取形时点）**：骨架按 create 时模式位取形（建档即固）；模式翻转不回写既有骨架——§2/§5 标签留存原形、新批按新位取形；append / status 白名单 = 执行期实读（翻转即时生效——BR-52），两者解耦」。 |
| 9 | 9 | docs/core/design/AGENT-LOOP-SUBAGENT.md | 🔵 | Fixed | 来源指针已收正并留因：:1037「承批档 `docs/batches/2026-10-09-normal-work-management.md` §2.2 · 台账 #1111」；:1039「上条来源指针收正——`§2` ⇒ **`§2.2`**（精确形——机制来源 = §2.2 行为 deltas「随带效果」行）。**零新语义**（指针形态收正）」。 |
| 10 | (new) | docs/core/design/BATCH-RECORD.md | 🟡 | New | 同一描述面两说并存：`docs/core/design/BATCH-RECORD.md:26: 「；模型面描述文案按**角色集**（eng-coder / eng-designer）参数化」`（门禁表「参数 schema」行——角色集参数化生成法）与 `docs/core/design/BATCH-RECORD.md:320: 「**换写为模式无关措辞**——两模式分支同列、文本不随会话模式变动（翻转安全；逐字 = 批档 §2.2 文案表）」` 相抵（同一 `subagent.mjs` 描述属性面）——按本仓 ⑫「同一机制两处不一致 ⇒ 显式收口」应补指针 / 收正 §2:26 半句。判为文档态不一致（描述文本生成法面——非机制层），报告不阻断。 |
| 11 | (new) | docs/core/requirements/NORMAL-MODE.md | 🔵 | New | 需求档变更记录未见本批 fix 轮条目：末条 `docs/core/requirements/NORMAL-MODE.md:181: 「- 2026-10-09（**工作管理统一 · 主 agent 落笔**）：新增 §5.6（F-N2.1–F-N2.5 / N-N2.1）」` 只记设计轮新增；§5.6 范围边界行（:116）本次措辞收口（不新增三门 / 随绑定受既有门 / 门名统一）在档内无对应记录行——同批其余三档均落了 fix 轮条目（`BATCH-RECORD.md:608` ∥ `PROMPT-SYSTEM.md:853` ∥ `AGENT-LOOP-SUBAGENT.md:1039`）。建议补一行或注明该行随 fix 轮收口。 |

计数：前轮 9 项 = 9 Fixed（🔴 2 / 🟡 4 / 🔵 3 全闭）；本轮新发现 = 🟡 1 · 🔵 1；未决 🔴 = 0。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 代签（父侧代签——用户 10:41 授权「点火」+「你直接跑完吧」）

**三条件核（父侧自缚）**：① 评审 pass 0🔴 ✓——批档 §3 轮次 2 = `VERDICT: pass`（前轮 9 项 = 9 Fixed 复核在盘；新增 2 条非阻断均已收口：#11 父侧落盘 ∥ #10 修复轮 2 落盘）；② 修正轮落地并逐条核验 ✓——修复轮 1（9/9 逐号实读核）+ 修复轮 2（#10 单点实读核）；③ token 已签发 ✓（凭证按纪律不落档）。

**批准结论**：设计批准——普通模式工作管理统一批进入实施轮（eng-coder · initial · §2.5 受影响文件面 14 件）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-09 · eng-coder——14 件落盘 ∥ 批内件 9/9 绿（红读 9/9 红——对 HEAD 净树）∥ doc-check exit 0 ∥ 偏差审计 0/4 ∥ 顾问评审 pass）


**实施摘要（本批条目 = 台账 #1111——机制面 + 描述面 + 教学面 + 批内件，14 件）**：

机制面（`thincoder-core/`）：
- `agent-tools/batch-skeleton.mjs`（219 行）——常量面单源：`SEGMENT_BY_ROLE_NORMAL = { "coder": 5 }`（:50）∥ `DEPTH0_SEGMENTS` 两集模式键（append：工程 [1,4,6] ∥ 普通 [1,2,4,5,6]；status：工程 [1] ∥ 普通 [1,2,5]——:55-58）∥ `batchSkeleton({…, mode})` 普通变体**四处替换**（:197-215；`mode` 缺省 = "engineering" ⇒ 工程产出 ∥ 4 参旧调用形逐字零变）。
- `agent-tools/batch.mjs`（333 行）——模式位**执行期实读**（`ctx.agent.config?.agent?.engineering`——:164，同款先例 = `task.mjs` execute 门）；depth-0 append 域按模式取集 + 普通面拒串（:176-182）；`segment` 参数描述换写（:258）；`allowedSegment` 普通模式腿合并 coder 增表（:99-102）。
- `agent-tools/batch-lifecycle.mjs`（372 行）——depth-0 status 域：普通面 = **取段**（写域集 §1/§2/§5、缺省 §1、越出 ⇒ 拒——:298-320）+ create 按模式位取形（:166-169）。
- `agent/family-tools.mjs`（193 行）——coder 分支**携绑定追加** `batchTool(batchDoc)`（未绑定不挂载 = 语法面不可达——:178）。
- `agent-tools/subagent-spawn.mjs`（413 行）——coder **可选臂**：同族可读性探测（不过 ⇒ 拒）+ `child._batchDoc` 绑定 + 固块行同推（:215-223 ∥ :322-323 ∥ :361；eng 两分支零改）。
- `agent-tools/subagent.mjs`（415 行）——`batchDoc` 参数描述句尾补 coder 可选句（:151）。
- `tool-docs/batch.md`——段白名单句换写为模式无关措辞（逐字 = 批档 §2.2 文案表）。

教学面（双面六件——EN 按 M9 翻译回写、非 cp）：
- `docs/core/design/prompts/discipline-normal.md`——新增节「工作管理（批次档 + 台账 + 收口）」（三子节：台账用法 / 批次档用法 / 收口纪律；插入锚 = `## 任务边界与范围外注记` 节前）；`##` 块 7⇒8 · 标题节点 21⇒25；EN 同构同计数（8/25）。
- `docs/core/design/prompts/persona-normal.md` 身份句「管理面你自担」（能力边界节内；EN 同位 `## Main-agent role` 节内）∥ `docs/core/design/prompts/common.md` 六段全图行按模式分辨（EN 同拍）。
- 批内件 `docs/batches/2026-10-09-normal-work-management.test.mjs`（255 行——T1–T8 + T4b 共 9 用例 = AC-5 全部列举情形 + AC-7 工程面零变回归；不进仓套件、随批留存）。

**决策透明表（实施判格——设计未逐格钉死处）**：

| # | 判格 | 取值 | 依据 |
|---|---|---|---|
| 1 | 常量命名/形态（设计只给字面 + 「depth-0 两集模式键常量（append / status）」描述） | `DEPTH0_SEGMENTS = { append: { engineering, normal }, status: { engineering, normal } }`（`Object.freeze`） | §4.16 常量面；命名直述、与骨架共址单源 |
| 2 | `batchSkeleton` 的 `mode` 缺省值 | `"engineering"`（值域 `engineering` / `normal`） | 「4 参旧调用形输出零变」为既有判据 ⇒ 缺省取工程腿 = 零回归 |
| 3 | depth-0 普通面 status 传**不可解析** `segment`（如 `"x"`） | 按缺省处理 ⇒ §1（与工程面既有 `declared === null` 同构） | 设计「`segment` 缺省 = §1」；顾问评审 🔵 #2 登记（见上抛） |
| 4 | coder spawn 拒句文案（设计只要求「同族」） | `batchDoc for role='coder' — …; when provided it must resolve to a readable file (omit batchDoc to spawn without the §5 record-write binding).` | §2.2 行为 delta 4「探测（不过 ⇒ 拒，文案同族）」；句式 = eng 族同构（同路径示例 + 同解析序句） |
| 5 | 绑定/固块两处同判提为单点谓词 | `const batchBound = engineeringRole \|\| (role === "coder" && !!batchDocAbs)` | 设计「绑定 + 固块行同推」两处同判 ⇒ 单点表达（防两处漂移） |

**审计与代码评审轮次与终态**：
- **内部偏差审计（read-only explore）轮 1** ⇒ **四类偏差 0/4**（PARTIAL 0 · SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0）；触及面 = §2.5 表 14 件逐一相等、零表外文件；观察 3 条（信息级 2 + 证据限制 1——审计装配无执行面、机检未复跑；其中「工程 status 拒串无批前快照可证」一条已由 `git diff` 面消解：该串在 diff 中为零改动上下文行 ⇒ 可证）。**终态 = clean**。
- **内部顾问代码评审轮 1** ⇒ **VERDICT pass**（0🔴 · 1🟡 非阻断 · 6🔵）。处置见下响应表。**终态 = clean**。
- **fix 轮（1 轮）**：① `family-tools.mjs:25` 参数注记补 coder 腿（评审 🔵 #3——注释面）；② 本节（§5）落盘（评审 🔵 #7——记录面）。fix 后机检复跑 = 批内件 9/9 绿。

**顾问评审响应表（1🟡 + 6🔵）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | `batch.mjs:172` depth-0「未知/缺段」拒文案模式无关（普通面仍报 §1/§4/§6）——**设计面漏点**（§2.2 文案表未列此串；修则超表 = 越界）⇒ 上抛父侧裁。 |
| 2 | Deferred | `batch-lifecycle.mjs:311/313` 取段面非法 `segment` 静默 = §1（append 面同输入 = 拒）——工程面既有行为、非本批引入；修则超本批逐字表 ⇒ 登记待裁。 |
| 3 | Fixed | `family-tools.mjs:25` 参数注记补 coder 腿（「eng 角色恒挂 ∥ 普通面 coder 携绑定挂」）。 |
| 4 | Deferred | `tool-docs/subagent.md:18` coder 角色行未提可选 `batchDoc`（参数描述面已载）——补充 = 超 §2.2 七条 deltas ⇒ 父侧裁（可选补登记）。 |
| 5 | Not an issue | `common.md` EN 相对路径解析括注 ∥ CN 无——归属实证 = **非本批笔**（`git diff --numstat` = 各 1+/1−，仅六段行）⇒ 交付面零涉。 |
| 6 | Deferred | 批档 §2.5 Δ 预测与实测漂移（batch-lifecycle 372 vs ≈362 ∥ subagent-spawn 413 vs ≈404 ∥ 批内件 255 vs ≈150–200）——§2 非本席写域 ⇒ 收口轮 §6 记实测。 |
| 7 | Fixed | 本节落盘（§5 实施记录——含机检读数与轮次终态）；批内件自载「红读/绿读在 §5」的载体面就此补齐。 |

**机检读数（实施轮——终读；命令 + 读数）**：
- ① 红读：`git worktree add <tmp> HEAD`（HEAD = 0233be77）后在该净树跑 `node --test docs/batches/2026-10-09-normal-work-management.test.mjs` ⇒ **9 用例 9 红（exit 1）**（净树无本批改动 ⇒ 普通面行为/新导出全缺）；跑毕 worktree 即移除（`git worktree list` = 仅主树）。（批内件为对位代码落盘后成文——红读 = 对 HEAD 净树，如实记。）
- ② 绿读（主树 · 终读）：同命令 ⇒ **9/9 绿（exit 0 · duration ≈467ms）**。**仅跑本件**；仓套件未跑（收口面归父侧）。
- ③ `node scripts/doc-check.mjs` ⇒ **exit 0**（锚 0 悬空 · 行宽 0 超宽 · 行数差异 0 = 报告态）。CN 新增节 ↔ 批档 §2.3-A 围栏块**逐行逐字相符（35/35 行机检对读在案）**；B/C 两块围栏逐字核在案。
- ④ `node scripts/prompt-refs-check.mjs` ⇒ **exit 0**（提示词面 82 档 · 代码面 438 档 · 命中 0）。
- ⑤ `node --check` 六涉改码档全 OK（batch.mjs ∥ batch-lifecycle.mjs ∥ batch-skeleton.mjs ∥ family-tools.mjs ∥ subagent-spawn.mjs ∥ subagent.mjs）。
- 行数（`\n` 计数）：`batch.mjs` **333** · `batch-lifecycle.mjs` **372** · `batch-skeleton.mjs` **219** · `family-tools.mjs` **193** · `subagent-spawn.mjs` **413** · `subagent.mjs` **415**（±0 句内换写）· 批内件 **255**；全部 ≤500 硬限。

**零触披露**：设计档（`BATCH-RECORD.md` ∥ `PROMPT-SYSTEM.md` ∥ `AGENT-LOOP-SUBAGENT.md`）零触 · 需求档零触 · 台账本体零触 · `ENGINEERING-MODE-V2.md` ∥ `LEDGER.md` ∥ `TOOLS.md` ∥ `ADVISOR-CONVERGENCE.md` 零触 · 工程面判定字面零改（`SEGMENT_BY_ROLE` 表 ∥ 工程两拒串 ∥ `batch_segment:` 迁移面全串 ∥ create/close 身份判据 ∥ 冻结门/F11 族/凭证剥除）· 他批零触。

**上抛项**：
- `[上抛·待裁]` 评审 #1：`batch.mjs:172`「未知/缺段」拒文案模式无关（普通面失实）——设计面漏点；改则超本批 §2.2 逐字表 ⇒ 二选一：挂账（技术待办）∥ 补逐字另轮修。
- `[上抛·待裁]` 评审 #2：取段面非法 `segment` 静默 = §1（与 append 面不一致）——超表 ⇒ 挂账或明示语义。
- `[上抛·待裁]` 评审 #4：`tool-docs/subagent.md:18` 角色行补可选绑定半句——可选补登记，超 §2.2 ⇒ 父侧裁。
- `[上抛·知会]` 评审 #5：`common.md` EN ∥ CN 相对路径解析括注不对称——归属实证 = 非本批笔（`git diff --numstat` 单行证据在案）；CN 是否补齐 = 双面同步面另议。
- `[上抛·知会]` 评审 #6：§2.5 Δ 预测漂移三处——收口轮 §6 记实测。
- `[上抛·知会]` 范围外：`agent/write-gate.mjs:135` 残句仍作「工程角色子代理」（门本体零改；设计已把主语收正到 `AGENT-LOOP-SUBAGENT.md` §6.29.1）——该档非本批表内，归后续笔。

## §6 验证与收口（父代理）

### 6.1 父侧复核与收口（2026-10-09 · 主 agent）

**验证读数（父侧亲跑——非转述）**：① 批内件 `node --test docs/batches/2026-10-09-normal-work-management.test.mjs` = **9/9 绿 exit 0**（父侧手跑）；红读 = 实施轮对 HEAD（0233be77）净树 9/9 红（§5 在案）。② `node scripts/doc-check.mjs` = **exit 0**（锚 0 悬空 · 行宽 0 超宽）；`node scripts/prompt-refs-check.mjs` = **exit 0**（82 档 ∥ 438 档 · 零命中）。③ **仓套件**（收口轮唯一一次）：`cd thincoder-cli; npm test` = **空清单绿**（「zero tests = green」2026-09-28 制度态——真实判据 = 批内件）。④ 关键落点父侧实读：骨架两表/两集 ∥ `family-tools.mjs:178` 绑定制 ∥ `batch.mjs:176-182` 模式域 ∥ `batch-lifecycle.mjs:304-316` 取段 ∥ CN 教学节 + EN 节头 ∥ `tool-docs/batch.md` 换写 ∥ `subagent.mjs:151` 描述补句——逐处相符。

**混档处置（提交面）**：工作树含他流未提交笔（`2026-10-08-code-limit-500-800` 等）；本批提交 `74163e89` **精确限径 20 件**——`AGENT-LOOP-SUBAGENT.md` 经 hunk 级选择性暂存（`git apply --cached`），**仅本批 2 hunk 入台**（6+/1−——§6.29.1 主语 + 变更记录 ×2），他流 hunk 零夹带；其余 19 件逐档 diff 核毕 = 全本批笔。

**上抛处置（实施轮 §5 上抛——父侧逐条裁）**：① #1 未知段拒文案模式无关 ⇒ **挂账 #1115**；② #2 非法 `segment` 静默 ⇒ **挂账 #1116**；③ #4 `tool-docs/subagent.md:18` ⇒ **挂账 #1117**；④ 范围外 `write-gate.mjs:135` 注释残句 ⇒ **挂账 #1118**；⑤ #5 EN/CN 括注不对称（非本批笔——实证）⇒ **挂账 #1119**；⑥ #6 §2.5 Δ 预测漂移 ⇒ 本期如实记：`batch-lifecycle.mjs` **372**（预测 ≈362）∥ `subagent-spawn.mjs` **413**（预测 ≈404）∥ 批内件 **255**（预测 150–200）——均 ≤500 硬限、无碍。

**收口测试行**：① 本批单元文件 = `docs/batches/2026-10-09-normal-work-management.test.mjs`（9 用例 · 随批归档 · 不进仓套件——零处置）；② 集成场景影响 = **无**（集成资产零触；prompt-refs ∥ doc-check 双 exit 0 复跑在案）。

**结算**：台账 #1111 两步迁移（在途 → 待核销 → 已核销）+ evidence（本 §6 ∥ 提交 `74163e89` ∥ 收口笔）。**暂缓批复核：无**。

**冻结**：本档收口——此后不回改；改 = 新批新档。
