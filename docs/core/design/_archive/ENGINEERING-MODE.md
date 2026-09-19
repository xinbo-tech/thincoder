# 工程模式（Engineering Mode）· 设计

> 板块：工程模式——thincoder 的严格方法论工作流：design-before-code、纪律层槽位提示词驱动、双门禁（设计评审 + 代码评审）。
> 本档为**架构级机制文档**：功能性需求以机制目标与约束表述（架构级文档以约束替代用户故事），非功能性需求与测试层完整。
> 需求层指针 = `requirements/ENGINEERING-MODE.md`（§0 铁律 / §1 FR·NFR / §1.5 裁定清单 / §1.14 失败路径 / §2 可移植性 / §3 边界）。
> 同批兄弟档：`design/BATCH-RECORD.md`（批次档载体 + 段写入工具 + 行为纪律）· `design/DOC-DISCIPLINE.md`（文档更新纪律 + 机检对账 V1–V5）·
> `design/LEDGER.md`（台账机制）· `design/LEDGER-SELF-CONTAINED.md`（各仓自持）· `design/ADVISOR-CONVERGENCE.md`（评审收敛）· `design/ADVISOR-GUARDS.md`（评审链边缘守卫）。
> 提示词载体：纪律与逐字锚现驻 `thincoder-core/prompts/discipline-engineering.md` + `thincoder-core/prompts/persona-engineering.md`（双端各自实现）。
> 判据指针：归属与命名 = `docs/core/design/DOC-SYSTEM.md` §5.1 / §6。

## 1. 定位

普通模式靠纪律提示词约束模型；工程模式把“设计先行、评审把关、验证收尾”提升为**半机械流程**——可硬性拦截的环节一律拦截（写文件门禁、token 校验），
无法硬拦的靠纪律层槽位提示词约束。本档 = **工作流本体**：角色、主流程、机械闸、凭证生命周期、错误恢复、逐字锚清单。

依赖关系：`design/AGENT-LOOP.md`（子代理任务调度器 · 评审对象锚——本档机制经其权威源接管点注册）·
`design/ADVISOR-CONVERGENCE.md`（评审收敛权威：design 评审 cap 豁免、code 评审轮次上限、stale-context 保护）· `design/TESTING.md`（测试分层权威）。
需求侧不变量（发起权归用户 / 需求不经 advisor / 设计 = 对需求的检验）住 `requirements/ENGINEERING-MODE.md` §0 / §1.5，本档不重述（D2）。

## 2. 角色模型（三段链）

| 角色 | 职责 | 机械约束 |
|---|---|---|
| **主 agent**（父代理·顶层，`role` 未定义） | **产品经理 + 流程编排者 + 批次档作者**：需求讨论/登记/收口 · 批次档 §1/§4/§6 · **核验设计稿（内容性）** · 提醒用户发起设计评审 · 委派 eng-designer（设计）/ eng-coder（实现）· 交付验证（L2 `test:full` 每链终态 1 次）· 链终核销 consume-design。**不写**需求档/设计档（**例外 = §4.3 第 5 条三类直笔：自有写域 / 纯机械形态收正 / 小修改——三类皆须打标**）、不写实现 | 拦截型：design token 前写产品代码被拒；提示词约束：不写实现、不发起评审、等批准、验收 |
| **eng-designer**（子代理，`role="eng-designer"`） | **写稿面唯一作者**：需求档 + 设计档（含修订）+ 批次档 §2；自勘察（限 explore，预算 ≤6/批）→ 并入需求 + 体系对账 → 判定句 → 写设计 → 自检交回 | **无 token**（授权 = 需求已确认）；spawn 必传 `batchDoc`；内部 spawn 仅 explore（机械门）；不写实现/不改提示词/不发起评审 |
| **eng-coder**（子代理，`role="eng-coder"`） | 实现者：按设计实现 → **内部协议闭环**（explore 偏差审计 → 自修 → advisor 复评 → 收敛，≤5 修正轮）→ 交付（报告含审计/评审轮次 + 终态 clean/stalled；永不编辑设计文档） | 拦截型：spawn 需 token、写文件需 `_engDesignReviewed`；内部 spawn 仅 explore + 同步（机械门）；审计 ≤6 次（第 7 次机械拒绝 = stalled 信号） |

### 2.1 角色注册与提示词装配

**注册面**（枚举 + 白名单 + 错误文案 + 场景槽位映射）与**装配面**（槽位文件表 + 场景槽文件表 + 子代理 childConfig）**逐处落齐**——漏一处不报错，是**静默回退陷阱**：

- **角色枚举**：`thincoder-core/agent-tools/subagent.mjs`（schema enum）+ `thincoder-core/agent/setup.mjs`（工程模式 enum 与后缀）。
- **白名单与错误文案**：`thincoder-core/agent-tools/subagent.mjs`（`ROLES` 集合 + 错误文案的角色列举）——漏改则报错信息说谎。
- **模式门（三闸）**：工程模式禁 `coder` · 非工程模式禁 `eng-coder` · **非工程模式禁 `eng-designer`**（与 eng-coder 同族）；`thincoder-core/agent-tools/subagent.mjs` 集中实现。
- **装配映射**：`thincoder-core/prompt-overlays.mjs`（`SLOT_CONTENTS` + `SCENARIO_SLOT_FILES`）——不登记则**静默返回通用基底且零警告**；`thincoder-core/agent/setup.mjs` 的场景映射**外层谓词 + 内层选择器都要改**。
- **槽位文件**：`thincoder-core/prompts/persona-eng-designer.md`（英文落地产物）+ `docs/core/design/prompts/persona-eng-designer.md`（中文权威模板）——双源各自实现、语义同源。
- **子代 spawn 门**：父角色集合（eng-coder / eng-designer）**均只允许 spawn `explore`**；**审计预算（≤6）只计 eng-coder**（designer 勘察非审计）——designer 父路径校验通过后**必须返回 `null`**，否则审计范围块会被误注进勘察任务书。
- **受限变体**：designer 勘察变体 = **参数化复用**既有受限变体（父角色集合条件 + 描述文案分流），不并列第二个 IIFE；受限变体的动作拒绝清单**以机械门为唯一真值**（`escalate/status/cancel/panel/consume-design/observe/send`），已退役动作不得残留。

### 2.2 写域边界（提示词纪律——无机械门）

设计者的写域 = `docs/`（扣 `docs/core/design/prompts/`）。**不新增机械门**（用户裁定“不需要机械门禁”）——靠 persona 明写写域 + 主 agent 内容性核验兼底。
**已知摩擦（用户裁定“接受”）**：designer 子代理**不**拿任务域豁免，故其每次写操作走人工授权（授权弹窗可“全部授权/切自动”）——设计**不为此加任务域豁免**。

## 3. 主流程（Mandatory Flow · 10 步）

工程模式任务**不分大小**全走本流程——零裁量。普通需求点先按需求池规则登记攒批（机制见 `discipline-engineering.md` 需求池攒批工作流节），不越池提前启动设计。

1. 写设计档（三层：需求/设计/测试；按业务板块组织）——**路由 eng-designer**（主 agent 出批次档 → spawn designer）。任务涉及 UI 时设计文档必须收录与用户达成的每一条 UI/交互决策（布局/流程/控件行为/状态/反馈），未定部分标 `open`、绝不静默发明。
2. 父代理呈递设计摘要 + 提醒“设计就绪，可以评审”——**等待，不自行调 advisor**。
3. 用户发起设计评审：父代理调 `advisor(type="design", documents=[涉及文档清单], object={type,target,status,reason,exclude})`。
   - 有 🔴 → 呈递发现 + 逐项修复建议 → **用户逐条拍板** → 修改 → 再提醒 → 用户发起复审；持续拒绝（>3 轮）→ 停下向用户报告未决项，不静默循环。
   - 无 🔴 → advisor 回显凭证 + designId（同 scope 复审沿用同 id）→ designId+token 入槽（会话内 Map）。
4. 用户批准设计——显式 sign-off 才解锁实现；**用户对设计内容/形态的选择只是需求确认，不是设计批准**。
5. spawn `eng-coder`：`subagent(role="eng-coder", designId, designToken, batchDoc=<本批批次档>, task)`——designId 可选（单设计省略）；**`batchDoc` 必传**（eng-designer 同门）。
   designToken 经 **PARAMETER** 传值，**绝不进任务文本**；task 按「实施委托结构化」含 Docs involved → 文件清单 → 验收标准——**默认 async**。
   spawn 声明 `files` + `dependsOn` 交调度器排序（重叠域 queued 自动启动；同步冲突报错；并发 ≤4）。
   机械校验：按 designId 定位槽比对 token，不符即 throw；通过 → child 解锁写文件 + 任务域授权。
6. eng-coder **内部交付协议**（子代理内部闭环）：实现 → 自查透明表 → explore 偏差审计（审计任务书 = 父 spawn 任务书 ∪ 实际 `_touchedFiles` **机械并集**，非自述；对照设计查四类偏差：部分实现/静默简化/文档漂移/超清单改动未报告）→ dirty 自修（修正轮 ≤5）→ clean → advisor(type="code") 复评（documents = 设计文档 + 交付文件清单）→ findings 自修 → 收敛交付。
   **现行口径**：标准链 = ③审计（LLM#1）→ ④dirty 自修（无 LLM）→ ⑤advisor 首审（LLM#2）→ ⑥findings 自修（无 LLM）→ 终审 = advisor 复评（LLM#3——验证 fix，不复跑审计）；**修正轮默认不重跑审计/复评**。eng-coder 永不编辑设计文档。
7. 交付 settle → 报告注入 → 父侧消化。子代理改动经 mergeChildMutations 合并进父代理——失效旧 verify/advisor 标记、**重置轮次计数**。父侧不再自动 spawn 审计/评审（防双重审计/误用）。
8. 父代理交付验证：对照验收标准跑测试、读改动文件——**信任 eng-coder 内部验证结果**；父侧 = **L2 全量 `test:full` 恰一次（每链终态）**，不再复跑 L1。L2 失败 → 该链终态 non-clean → 报告用户（未达验收——不静默放行）→ 可转 fix round（同凭证，docs FIRST）或用户决定。
9. 父代理 verify（对照验收标准）。
10. 完成：**验收勾销落批次档 §6**（逐条验收结论——通过/未过/未做 + 理由）；设计档只承载设计本身，**勾销不进设计档**。
    链闭合（verified + clean + 已签入）→ 父侧 `subagent(action="consume-design", designId=…)` 消费槽（§6）。

## 4. 机械强制链（拦截闸 vs 流程驱动）

> **设计原则：只拦截，不催促。** 评审由流程提示词在正确节点驱动；每轮结束的机械推回（advisor/verify guard）在工程模式下**一律关闭**（含 opt-in 配置）。拦截闸（写文件门禁、token 校验）保持机械强制。

| 闸 | 类型 | 机制 | 位置 |
|---|---|---|---|
| **Design gate — token** | 拦截 | spawn 按 designId 定位槽，校验 token 值 + 格式/TTL fail-closed；不符即拒；会话内仅一个设计时 designId 可省略，多个设计时缺 designId → 拒并要求指定 | subagent 域（CLI/VS 双端） |
| **Design gate — 产品代码变更** | 拦截 | eng-coder 未过门 → 写/删/改产品代码被拒；父代理无 design token → 产品代码写/删/改被拒（豁免仅设计产出物）；门禁覆盖全部变更形态（写/删/改） | dispatch 域（CLI/VS 双端） |
| **Code review** | 流程驱动 | **eng-coder 内部协议默认承担**：in-child advisor(type="code") 复评 → findings 自修 → 收敛 ≤5 修正轮；父侧复核保留可选（stalled/存疑/用户要求） | 纪律层提示词（双端） |
| **偏差审计** | 流程驱动 | **eng-coder 内部协议默认承担**：in-child explore 审计；dirty → 自修 → 再审计；审计 ≤6 次、第 7 次机械拒绝 = stalled 信号 | 纪律层提示词（双端） |
| **收敛上限** | 拦截 | code review 最多 5 轮（code-only）；design 评审不消耗轮次（cap 豁免）；非 LLM 自检不消耗轮次 | `thincoder-core/advisor/run.mjs`（CLI/VS 双端） |
| **冻结窗口预闸** | 拦截 | 设计评审在途时，父侧对被审文件集的写被拒（D5——见 `design/ADVISOR-GUARDS.md`） | `thincoder-core/agent/dispatch.mjs` |

**评审范围（Review Scope）**——评审对象由任务定义，不由遍历决定：

- **doc review**：`advisor(type="design")` 调用时**显式传 documents 参数**（需求 + 设计 + 引用文档路径）；advisor 只评审清单内文档，**不收集 git diff 变更集**（早期“按 diff 找文档”范围大、不准、与任务无关，还会漏掉 untracked 新文档——已废弃）。
- **object 参数必传**：评审调用必须携带对象声明 `{type, target, status, reason, exclude}`——评审对象由任务定义，与 documents 同批传入；对象声明块由 advisor 消息层机械注入（漏传 = 评审目标模糊 = 与 documents 漏传同级错误）。
- **code review**：评审范围 = task 的 Docs involved（设计文档）+ 交付文件清单/验收标准（显式化）；不遍历 git diff 找评审对象。默认由 eng-coder 内部协议承担。
- 父代理负责收集涉及文档，在设计评审（documents 参数）与 spawn（Docs involved）两处传入。

**评审时机（Review Timing）**：

- **设计评审**：仅由**用户发起**——父代理呈递设计就绪并提醒，用户发话才调 advisor；打回后每轮呈递发现 + 修复建议、用户逐条拍板再改、再提醒复审（**修订落档经 eng-designer**）；持续拒绝时停下报告。
- **交付 code review**：流程节点自动、不问用户——默认由 eng-coder 内部协议承担；父侧复核保留可选——stalled/存疑才复核。
- **系统推回**：工程模式下 advisor/verify guard 推回**一律关闭**，如未来启用也只作提示用户之用。
- **advisor 失败/中断**：停止重试，向用户报告原因。

### 4.1 变更面分流（产品代码 ∥ 工程工具 ∥ 文档面）

**问题**：提示词只规定「产品代码走全流程」，未区分**工程工具面**（只影响本仓开发/CI 的变动）——为把 `docs/core` 纳入两扫描器的扫描目录（两行常量改动）走了完整 eng-coder 链（token + 审计 + advisor）= 授权过度（2026-09-15 实证）。本节的机制 = **动手前先判变更面**。需求回指 = `requirements/ENGINEERING-MODE-MECHANISM.md` §1.21。

| 变更面 | 域（枚举） | 授权路径 |
|---|---|---|
| **产品代码面** | `thincoder-core/**` · 两产品 `{src,bin,webview,test}/**` · **产品文本面**（产品仓内对外文本：两产品 `README.md` / `package.json` / `.vscodeignore` / 仓根与产品 `AGENTS.md`） | 需求 → 设计 → 评审 → eng-coder（全流程；token 门照常） |
| **工程工具面** | 仓根 `scripts/**` · 两产品 `scripts/**` · `.thincoder/**` · CI 配置 `.github/**` · `package-lock.json` | 父侧可直改（不 spawn、不需 designToken）+ 门禁为准 + 显式路径提交 |
| **文档面** | `docs/**`（需求 / 设计 / 批次 / 台账 / 提示词） | 写权按 D1 矩阵（提示词 = 主 agent 内容权 + 落笔） |

- **默认归类（补枚举缺口）**：**未列入工程工具面与文档面的路径一律按产品代码面处理**（fail-closed——宁可走流程，不得默认直改）。产品文本面**单列**的理由：它是出厂产物、用户可见的对外契约（README 漂移已在台账在案），**不属于工程工具面**。
- **工程工具面直改三条硬约束**：① 机械改 ⇒ 直改 + **改完实跑报读数**；② **改判据语义的**（抽取谓词 / 阈值 / 什么算违规）⇒ **仍走设计**；③ 凡直改 ⇒ 报告记明「父侧直接执行」+ 单笔可 revert。
- **授权判据 ≠ 绕过门禁**：分流给的是**授权判据**；门禁（`thincoder-core/agent/dispatch.mjs` 的 token 门 / 产品代码写门）**判定为准**——两者不一致 ⇒ **停下上报**，不得以分流为由绕过。

**已知机械面冲突（登记——本批不改实现；按父侧裁定 O2 不写进提示词正文）**：

| # | 冲突 | 现状（机械面） | 消解路径 | 到期条件 |
|---|---|---|---|---|
| C1 | **产品文本档机械免门** | `.md`（不含 `src` 段）被判 doc ⇒ 免门（`thincoder-core/conventions.mjs` 分类 + `thincoder-core/agent/dispatch.mjs` 父侧工程门）⇒ 产品文本面改动不经门禁，与「产品代码走全流程」判据不一致 | 分类器单列**产品文本面**类目并纳入门禁（判据 = 路径枚举 + 仓根归属） | 分类器下次被触碰时；不晚于「变更面分流」首次实跑后的下一条链 |
| C2 | **工程工具面被拦** | `scripts/**` · `.github/**` · `.thincoder/**` · `package-lock.json` 判 code ⇒ 直改被拒，与「工程工具 ⇒ 父侧可直改」冲突 | 门禁加**工程工具面**放行类目（路径前缀枚举 ∪ 默认产品面） | 同上 |

**判定句**：未列入枚举的路径 ⇒ 按产品代码面走全流程（fail-closed）；工程工具面机械改 ⇒ 直改 + 实跑 + 报告「父侧直接执行」。**条文草稿 = 本节**（措辞审定权归主 agent）；落点节名 = 批次档 §2 ACC-1。用例 EM-8 / EM-9。
**可落子集（供落笔）**：三分面表 + 默认归类 + 三条硬约束 + 授权判据句 + 判定句；**「已知机械面冲突」登记表 = 设计内部材料，不进条文**。

### 4.2 批次档生命周期（界 / 护栏 / 闭合 / 接续 / 判定权）

**问题**：旧批次档 `docs/batches/2026-09-13-CORE-UNIFICATION.md`（≈6900 行）自代码面迁移一路用到文档面迁移 ⇒ ① 所有子代理在其上串行排队 ② 档过长使父侧注意力下降（漏项 / 误报的机制性根因）。本档载**判据句 = 落条文本面**（提示词落笔用语；与 §5.1 双述同步——落条面需成句文本、指针不可落笔）；机制细则（越界动作与用例）= `design/BATCH-RECORD.md` §5.1**唯一详述面**。需求回指 = `requirements/ENGINEERING-MODE-MECHANISM.md` §1.22。

1. **一次实现轮的界**：一批 = 一个交付目标 + 一组同批条目 + 一份批次档；**任一命中即另起新批新档**——① 交付目标变更（主题词变）② 阶段跨越 ③ 本批条目集变更（新增条目不属原批范围 / 原批条目已全部核销）——**属范围者 ⇒ 同批继续**（需求档 §1.15「同批继续」；边界判别权归主 agent）。
2. **长度 · 轮次护栏**：单档 **>1000 行** = 越界信号 ⇒ 必须另起新批；**§5 修正轮上限 5 轮**（触顶 ⇒ 本批已到自然边界 ⇒ 后续另起新批）；**§3 设计评审无轮次上限**（cap 豁免——`design/ADVISOR-CONVERGENCE.md` §3.2）——触达既有停止判据（持续拒绝 **>3 轮**，本档 §3）⇒ **停下上报**。
3. **闭合 / 退役动作**：§6 收口完成 ⇒ 状态行改「已收口 <日期>」+ **整档冻结**（不再回改）；冻结档**不迁移不删**（外部记忆）。
4. **新档 ↔ 旧档接续**：新批 §1 顶部**前情指针**，规范形态 `前情 = docs/batches/<旧档> §N（已收口 <日期>）`——替代父侧现编。
5. **判定权**：上述五条的判定权 = **主 agent**（唯一对话面）；子代理撞到批边界 ⇒ **停下打回主 agent**（不得自行新开批、不得自行延用已收口旧档）。
**非追溯（适用范围）**：只判**本批及后续新档**；存量旧档**只判收口状态、不回改内容**（承接 `requirements/ENGINEERING-MODE-MECHANISM.md` §1.22 范围边界）。

**本轮不加机检**（守护 = 双面逐字 + 评审核验 + 三机检零回归）；阈值机检登记为候选扩展、不入本批。**条文草稿 = 本节**；落点节名 = 批次档 §2 ACC-2；**可落子集 = 五条判据句 + 非追溯句**；**机制细则唯一详述面 = `design/BATCH-RECORD.md` §5.1**（越界动作 / 用例 / 机检登记——非落条材料）。用例 BR-10 – BR-14。

### 4.3 父侧轮次与提交纪律（派发 / 收尾 / 提交）

**问题**：对提示词正本 15 档全文扫描 + 拿实际失败逐条对照 ⇒ 10 条纪律 5 条在案（D/E/G/H/J）——走样主因 = **既有规则未执行**；**真缺四条**（B/C/F/I）。本项 = 四条显式化 + **追加三条**（第 4 条 派单三句 · 第 5 条 父侧不代笔 · 评审侧 `Suggestion` 形态——2026-09-16 用户追加范围「甲」）。需求回指 = `requirements/ENGINEERING-MODE-MECHANISM.md` §1.23。

| 条 | 内容 | 落点（提示词双面） |
|---|---|---|
| **B 派发如实** | 凡陈述「已派 / 在跑 / 已提交」⇒ **必须同轮发出调用**；队列状态**只能抄工具回执**（不得凭记忆 / 推断陈述） | 新节（节名 = 批次档 §2 ACC-1；条文草稿 = 本节 §4.3） |
| **C 禁止零文本收尾** | 每轮收尾必须给出**面向用户文本**或**显式进等待态**——零文本收尾（「No response requested.」）= 违规 | 同新节 |
| **F 写域声明** | `files` 只列**内容产物**（源 / 测试 / 设计档）；**工程工具（`scripts/**` 等）不入域**——入域只产生假冲突、拖慢全队 | 既有 `## 实施委托结构化（任务书结构 + file 域语义）` 追加一句 |
| **I 提交纪律** | ① 提交**路径限定**（`--only <paths>`）② **不代提交**用户 / 他人的档 ③ 归因先想「可能是用户在写」（异常差异先假设对方在场） | 同新节 |
| **第 4 条 修正轮派单必写三句**（用户追加「甲」） | 派修正轮时**必须明写三句**：㈠ `Suggestion` 列 = 评审员建议、**处置执行人 = 你**（父侧已逐条裁定接受）；㈡ 按发现号 `1..N` 逐条改、报告给「号 → 改动 `file:line`」；㈢ 明写「**本轮不做**」清单。**判据句**：缺任一句 ⇒ **派单不合规** | 同新节 |
| **第 5 条 父侧不代笔**（用户追加「甲」） | 父侧**不做**设计 / 需求档落笔——凡该改的**一律派修正轮**给 eng-designer；例外**三类**：① 自有写域（批次档 §1/§4/§6 · 台账）② 纯机械形态收正（折行 / 指针形态 / 计数）③ **小修改**（单行 / 表格级 · 无新语义 · 可逐条核验——用户 2026-09-16 裁定「小修改以后你自己搞，不要发给 eng-designer」）——**三类皆须打标**（注明「父侧直接执行」+ 可 revert）。**判据句**：父侧对被派单面内容性落笔且未派修正轮 ⇒ 判违规；机械形态收正未打标 ⇒ 判违规 | 同新节 |
| **评审侧 `Suggestion` 列形态**（派发协议上游 · 非本节落点） | 发现表 `Suggestion` 列**只写改法、不写执行人**——禁「由主 agent / 父侧收正」式归属句（下游读到即判「不归我干」⇒ **整张发现表绕开**）；处置归属由父侧派单时定。**判据句**：`Suggestion` 列出现归属句 ⇒ 判违规 | 评审侧提示词发现表格式行（英 `thincoder-core/prompts/advisor-design.md:14` · 中 `docs/core/design/prompts/advisor-design.md:29`） |

- **不重述既有五条**（D/E/G/H/J——D2 单一权威源）；**不登记逐字锚**（禁新写散文锚）——守护 = 双面逐字 + 评审核验。
- 用例 EM-10 / EM-11（B / C 条）+ EM-12 – EM-14（第 4 / 5 条与评审侧形态）。
**可落子集（供落笔）**：B / C / I 三条 + 第 4 / 5 条 + 评审侧 `Suggestion` 形态句 + F 追加句；**「不重述既有五条」声明 / 落点选型表 / 用例指针 = 设计内部材料，不进条文**。

**落点选型（本批四条落点——新节 / 并入 / 追加句）**：

| 规则 | 落点形态 | 选定理由 | 否决备选 |
|---|---|---|---|
| ③ 变更面分流 | **新节**（「铁律」后 / 「基本流程」前） | 判据面独立；且是「动手前第一判」——序位须在流程节之前 | 否决「并入基本流程节」（判据与流程混节）· 否决「并入文档规范节」（语义错位） |
| ① 批次档生命周期 | **并入**既有「批次档与执行者纪律（第 2 批行为纪律）」节 | 同族规则单一权威源（D2）；读者面一致 | 否决「新建节」（同族机制两处分家 ⇒ 漂移） |
| ② B / C / I 三条 | **新节**「父侧轮次与提交纪律（派发 / 收尾 / 提交）」（批次档纪律节后 / 文档规范节前） | 三条同族（父侧行为），与既有节零重叠 | 否决「逐条挂到各自相关节」（分散 ⇒ 难核验） |
| F 写域声明 | **追加一句**入既有「实施委托结构化（任务书结构 + file 域语义）」节 | 语义同族（`files` 域语义）；一句话不立节 | 否决「新节」（一句话立节 ⇒ 结构失真） |

- 面间一致性：四条落点由**中文正本与运行期落地两面同批同改**（父侧裁定 O4）——节名逐字相同，面间差异仅限语言与既存端特有段。

### 4.4 设计者接单与交付时序纪律（提示词面 · 2026-09-16 用户追加）

**问题**：2026-09-16 凌晨 **7 路 designer 连续「勘察耗尽回合、零落盘」**（#1 86 回合 · #6 / #7 各 100 回合撞顶，每路 ≈25 min；改「先落盘后补正」后批 2 在 **19 回合**落完三件）
＋ 批 4 / 批 3 两路修正轮**整表绕开**（读到 §3 却一条不改，转做机检格式类工作）。根因 = 提示词只写「该怎么干活」（设计行为纪律 A1–A4），**没写「交付时序与接单边界」**。需求回指 = `requirements/ENGINEERING-MODE-MECHANISM.md` §1.24。

| 条 | 条文语义（供落笔） | 形态 | 落点（提示词双面——英 / 中同名档） |
|---|---|---|---|
| **A′ 引用 vs 复核**（收窄既有 step 1） | 你写的坐标**必须带 `file:line`**（既有证据纪律不变）；**评审员 / 父侧已给的坐标按引用处理、不再复读**；只有**新写坐标各实读一次**；**不废自己勘察**（step 1 既有义务不变——只免复读他人已给坐标） | **收窄**既有「五步工作流」step 1（不新建节） | `persona-eng-designer.md` 节「五步工作流（survey → …）」step 1——英 `thincoder-core/prompts/persona-eng-designer.md:29` · 中 `docs/core/design/prompts/persona-eng-designer.md:29` |
| **B′ 回合预算 + 落盘时序** | **先出草稿再补正**——禁把「全部核实完」当落盘前置；**首版 ≤15 回合 / 单档修正 ≤10 回合**；回合**过半**（首版 >7 / 单档修正 >5 回合）仍未落盘 ⇒ **降级交付**（骨架 + 未决清单） | **新增**（与既有「≤6 次 explore spawn / 批」**并列记账、不替换**） | 同档 step 1 末——既有勘察预算句旁（英 / 中 `:29`） |
| **C′ 闸纪律** | 三机检闸**只在交付前各跑一次**；中途不逐轮复跑 | **新增** | 同档 step 5「自检 + 交回」——英 `:35` · 中 `:33` |
| **D′ 接单纪律** | `Suggestion` 列 = 处置建议，**执行人 = 本角色**；**归属句（「由主 agent / 父侧……」）= 派单方向，不是免做令**；不得因某行写归属句而跳过整表；按发现号逐条回报（号 → 改动 `file:line` / 或不成立理由） | **新增** | 同档节「发现即报告 / 修 vs 打回」——英 / 中 `:23`–`:26` |
| **E′ 不自选未派的活** | 派单已限定本轮任务面 ⇒ **不得**改做相近但未派的工作（尤其「机检折行 / 计数订正 / 收口陈述」类——前几轮已做者） | **新增** | 同档节「产出两件」/「交回」附近——英 `:37` / `:59` · 中 `:35` / `:57` |
| **报告形态**（用户 06:18 追加） | **报告只给结论 + `号 → 改动 file:line`**；**不写过程自述 / 不复述推理链 / 不写「hmm、等等、让我想想」式旁白**（过程 = 内部事，不进报告）——证据纪律只要求**结论带 `file:line`** | **新增** | 同档「交回」附近——英 `:59` · 中 `:57` |

- **落笔口径**：**六条**实体条文归**实施轮 eng-coder 落笔**（同 §4.3 口径——设计轮只给条文语义 + 落点 + 锚；**措辞审定权归主 agent**）；两档**同批同改**；落点按**各面同名节**定位——**不新建节、不改既有节名**（persona 双面既有节名已按语言分叉）。
- **断言口径**：**不登记逐字锚**（禁新写散文锚）；行为面无机检 ⇒ 验收 = 落笔逐字 + 评审核验（同 `requirements/ENGINEERING-MODE-MECHANISM.md` §1.19 先例）。
- **行号为 as-of 2026-09-16**（双面档实读：英 **60** 行 / 中 **58** 行，`wc -l` 口径；「勘察预算 ≤6 次 explore spawn / 批」两句同在 `:29`）——实体落笔前由落笔人以**节名**复核。
- **可落子集（供落笔）**：§4.4 表六行的**条文语义列**；本表「形态」列 / 落笔口径 / 断言口径 / 行号锚 = 设计内部材料，不进条文。
- **设计内部材料（不进条文）**：本表「落点」列的行号 / 「形态」列 / 落笔口径 / 断言口径。
- 用例 EM-15 – EM-19（D′ = EM-13 · EM-19 = 报告形态；与本档 §4.3 侧共享）。

## 5. Token 生命周期（链终消费制）

背景：token 只存不废 = 复用洞（父代理跳过审核、未呈方案即直接复用旧 token spawn 的实证）。裁定：**spawn eng-coder 整链完成（首 spawn + 全部中间修复轮走完 → 父端验收核销）后从父端消费掉 designToken**。

- **F1（链终消费——机械）**：subagent 工具提供 `action: "consume-design"`（参数 designId——单设计会话可省略）——父侧验收核销时显式调用。实现：读槽值 → 移除该 slot（**单值镜像已退役——consume 只删槽 Map 项**）→ 消费后同 designId 再 spawn = 槽 not found **机械拒**。**新改动（含新偏差修复）一律新评审新 token**。未知 designId 与重复消费 = 同款 no-op 提示（幂等——不报错）。
- **F2（链中复用不受影响——docs FIRST）**：fix round（同 designId——首 spawn 后、验收前）仍可 spawn（slot 未消费）——消费点仅在父侧核销时（非交付 digest 时——否则 fix round 无 slot 可用）。修正轮的 findings + planned changes **必须先落所属设计文档再** spawn eng-coder；跳档 = 文档漂移，等同静默改动；**落档动作经 eng-designer**（写稿权唯一）。
- **F3（提示词义务句——两则英文锚逐字，落点各注；锚测试 fail-when-unchanged）**：

  - 链终消费锚（落点：纪律层交付链收口节——双端）——逐字文本：

    > **Chain-terminal token consumption**: after the delivery is verified and the chain closes out,
    > call `subagent` with `action:'consume-design'` for this designId — the slot is consumed; a
    > further spawn for the same designId is mechanically rejected, and any new work (including new
    > deviation fixes) requires a fresh design review and token. Leaving a consumed-out token in the
    > slot is the reuse hole.

  - 修正轮句的逐字文本（双端）：

    > Fix rounds reuse the same designToken — but docs FIRST, and only while the chain is open (same designId, before parent-side close-out); once the chain terminal state is reached, every further spawn — including deviation fixes — goes through a fresh design review and token.

  - 执行判据（主 agent）：**链中不疑 token**（多次 spawn/fix round 复用同一 token 是正常态，非 bug）；**链终必清 slot**（delivery verified + clean + 已签入 = 链闭合 → 立即 consume）；**未闭合不消费**（stalled / L2 非 clean / fix round 在途 → 同 token 继续）；**重评审只在真新链需要**。
- **F4（边界）**：stalled 交付不消费——fix round 续用；L2 非 clean 不消费；用户放弃该设计 → consume-design 作废；跨会话恢复的持久化槽同受消费管理；consume-design 幂等；**多槽隔离（消费 A 不动 B）**。

## 6. 凭证不落文档

背景：真实 token/designId 值曾被写进设计文档状态行/变更记录（运行时凭证落文档 = 死值污染 + 诱导后续评审员“照格式模仿”自编）；“脱敏占位”同样是废话——**根本不要记录**。

- **F1（提示词纪律——逐字锚，双端一致；锚测试 fail-when-unchanged）**：

  > **Credential values stay out of documents**: never write token or designId VALUES into design docs, change records, or status lines — credentials are runtime state. A review passing is recorded as "review passed"; nothing else. No values, no placeholders.

- **F2（文档面）**：值记载清理是父侧文档层持续义务（已清一轮；此后新增值残留由巡检把关并报父侧清理——不背书存量零残留现状，以巡检结果为准）。
- **巡检**：值形态正则钉死为「参数名（token/designId）+ 空白 + uuid 形 hex + 可选冒号 epoch 后缀」；巡检范围 = `docs/**/*.md` + `thincoder-core/prompts/**/*.md` + 根级变更记录。
- **验收**：锚断言绿（双端）+ 巡检绿（`test:full`）+ 既有 prompts 家族零回归。

## 7. 错误与恢复

| 场景 | 行为 |
|---|---|
| eng-coder 中途失败/中断 | 父代理可重新 spawn（同一 token——链中未消费）；或在报告中说明 |
| 实现中设计变更（用户反馈） | eng-coder 停下报告；**转 eng-designer 更新设计档** → 请求用户重新确认 → 必要时重新评审 |
| advisor 工具失败/中断 | 停止重试，向用户报告 |
| merge 冲突/异常 | mergeChildMutations 为纯内存操作，冲突不可能（单线程）；异常向上抛，父代理见错误结果 |
| 并发 spawn（同一或不同 designId） | 允许（token 链终前不消费）；各 eng-coder 携自己 designId+token 独立实现，父代理分别验收 |
| 会话恢复/重进 | token 随 slot 持久化（TTL 7 天 fail-closed）——重进 TTL 内恢复；过期/换槽才需重新设计评审；持久化槽同受链终消费管理 |

失败路径的九条清单（L2 不过 / 轮次用尽 / 评审不收敛 / 否决设计 / 撤回废弃 / 退出模式 / token 过期 / 依据缺失 / 崩溃）= `requirements/ENGINEERING-MODE.md` §1.14（需求侧权威，本档不重述）。

## 8. 提示词锚清单（逐字契约——双端一致）

下列逐字锚是工程模式纪律层的落地契约。**字节源 = prompts 落地文本本身**（本档不收录压缩改写版本）；锚测试均为 fail-when-unchanged 断言。
机制语义权威源：需求池 = `discipline-engineering.md` 需求池攒批工作流节；调度器 = `design/AGENT-LOOP.md` §10；评审对象锚 = `design/AGENT-LOOP.md` §12.1；内部协议完整文本 = 本档 §3 step 6。

- **锚#1 零裁量**（落点：纪律层「Mandatory Flow (every task, no skipping)」标题下、step 1 之前——双端；顶层工程模式生效，普通模式零触碰）：

  > Task sizing is NOT your call — every user request in this mode runs the full Mandatory Flow
  > regardless of size. "The task is too small / it is just a tweak" is never a reason to skip or
  > compress a step, and no change is exempt from being recorded in the design docs. If you find
  > yourself weighing whether the flow applies, the answer is always the full flow — the user's
  > decision to be in engineering mode was the sizing decision.

- **锚#2 需求池三规则**（落点：纪律层需求池攒批工作流节——双端）：

  > 1. **Pool routing** — "ordinary requirement statements register in the owning board's requirements doc and the project docs/TODO.md「Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane)."
  > 2. **Threshold reminder** — "same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start — the user still fires the review and approval."
  > 3. **Fast lane** — "the user saying this is urgent / do it now skips the pool: single-point full flow (design → review → implementation — no step cut)."

- **锚#3 修正轮 token 复用 + docs FIRST**：修正轮逐字锚见 §5 F3 引文。配套指针句（落点：纪律层交付链收口节——双端）：

  > Fix-round re-spawns are docs FIRST too — the deviation record / change note lands in the owning design doc BEFORE the eng-coder spawn (full rule: the eng-coder delivery bullet under Then handle the message).

  语义：修正轮 findings + planned changes 必须先落档再 spawn；“代码变更都必须落文档”对修正轮无豁免——跳档 = 文档漂移；同设计修正轮是唯一合法 token 复用——超出设计文件清单 = 新任务，需自有流程与新 token。

- **锚#4 用户拍板 ≠ 设计批准**（落点：纪律层交付链收口节——双端；step 5「User sign-off」指针句同文随迁）：

  > A user ruling on design CONTENT (form/shape/option choice) is requirements confirmation — NOT
  > design approval. New scope — including extensions to an already-approved design — still runs the
  > full review chain: design ready → user-initiated advisor review → user approval → implementation.
  > Approving a form ("B", "可以") never shortcuts past review. Only the explicit sign-off after the
  > advisor review unlocks eng-coder.

  step 5 指针句（逐字）：

  > A user ruling on design form/shape/option choice is NOT this sign-off — scope extensions (incl. extensions to an already-approved design) still run the full review chain (full rule: the eng-coder delivery bullet under Then handle the message).

- **锚#5 链终消费**：逐字锚见 §5 F3 引文——落点纪律层交付链收口节——双端。
- **锚#6 凭证不落文档**：逐字锚见 §6 F1 引文——落点纪律层交付链收口节——双端；配套巡检正则与范围见 §6。
- **锚#7 调度器句**：字节源 = Multi-Task Parallelism 节调度器条款段；机制权威 = `design/AGENT-LOOP.md` §10：“overlapping domains are queued by the scheduler, never hand-serialized”。
- **锚#8 设计行为纪律四维（A1–A4）**：字节源 = 纪律层「设计行为纪律四维」节（A2 改写形态 = 同档方案选型对比节）；机制语义权威 = 纪律层文档规范节（三层模板 / 方案选型对比表 / 多实现面纪律——本档不收录压缩改写版本）。断言：各端自身驻留 fail-when-unchanged。
  - **A1 勘察 checklist**、**A2 方案选型对比**、**A3 评审前预检**、**A4 实践沉淀**——四维的逐字文本住 prompts 落点（本档只登记锚位与断言口径）。

## 9. 配置与会话恢复

**engineering 与 advisor.guard 都是会话级**——事实源是当前会话槽位文件（`engineering` 字段与 `advisor.guard`），`config.json` 的对应项降级为 **CLI 兼容/可见性镜像**，不再是事实源。
背景（跨端污染 bug）：旧设计里 engineering 只存 config.json 全局，两端设置面板都写它 → 两端互相翻转对方的工程模式——会话级化后两端会话各自独立，互不影响。

- **读取优先级（两端一致）**：slot 显式值 > config.json 兜底 > false。slot 无字段（旧槽位）→ 回退 config.json（兼容锁定）；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
- **写入路径**：CLI `/eng`（persistEngineering）与 eng(enter/exit) 工具 = **slot-only**（`config.json` 只是初值默认，不再镜像写）；
  CLI `/advisor` guard 切换 + VS Code 设置面板 toggle = **双写**（slot 先、config 镜像后——slot 写失败不阻断 config 写）；VS Code eng 工具经 `engPersist` 通道随每轮把 live 状态带入槽位。
- **初值链**：CLI `assembleAgent()` 从 config.json 播种 → `applySession` 时 slot 值覆盖；VS Code `setupAgentRun` 每轮从 engState（panel-chat 从槽位读）注入。
- **guard 存槽 ≠ 工程模式机械推回**：guard 状态存槽只是会话级配置事实；工程模式下 guard 推回一律关闭（§4 设计原则），存槽不改变这一点。
- **resume** 保留 run 状态（mutation 追踪/收敛预算）——guard 跨续跑生效、cap 不可重置；design token **随 slot 持久化**（TTL 7 天 fail-closed）。
- **角色互斥**：工程模式禁用 `coder`，普通模式禁用 `eng-coder` 与 `eng-designer`（schema 枚举 + 运行期硬门禁双保险）。

## 10. 已知取舍

1. 父代理无全面写文件门禁——必须能写设计产出物；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活——保守缺口，已接受（链终消费制收口后：仅链中存活，链终消费）。
3. token 持久化边界——单值随 slot 持久化、多槽同构序列化；TTL fail-closed 兜底，过期重评；**无签名格式下防伪不声称**——门禁可经工程模式开关绕过，防伪无实际安全边界。
4. multi-repo 时 advisor cwd 取 `repos[0]`——`_touchedFiles` 绝对路径缓解，已知限制。
5. 架构级文档以机制约束替代用户故事——架构级机制文档的既定形式。
6. designer 的每次写操作走人工授权（弹窗需人点“全部授权/切自动”）——用户裁定接受，不加任务域豁免。
7. **分流判据无机械执行者**——三分面授权是**判据**，机械面（分类器 / 门禁）尚未按面归类（§4.1 冲突 C1 / C2）；过渡期靠「不一致 ⇒ 停下上报」+ 评审核验兜底，**不声称机械面已对齐**。

## 11. 验收标准（逐条回指需求）

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| A-EM1 | 三角色均在册且可 spawn：枚举 + 白名单 + 错误文案 + 装配映射四处齐；非工程模式 spawn `eng-designer` 被拒 | FR9 · NFR4 |
| A-EM2 | 主流程 10 步在档且与需求 §1.6/§1.9 口径一致（step 1 路由 designer / step 10 勾销落批次档 §6） | FR1 · FR9 |
| A-EM3 | token 门禁：spawn 不符即 throw；`consume-design` 后同 designId 再 spawn 机械拒；消费幂等 | FR3 · NFR3 |
| A-EM4 | 链终消费锚 / 修正轮 docs FIRST 锚 / 拍板≠批准锚 / 凭证不落文档锚——四处逐字锚驻留断言绿（双端） | FR3 · FR21 |
| A-EM5 | designer 勘察通道：内 spawn `explore` 允、`coder` 拒；勘察预算 ≤6 且不计入审计预算 | FR9 #7 |
| A-EM6 | 会话级事实源：slot 显式值优先；工程模式 guard 推回关闭 | NFR6 · FR21 |
| A-EM7 | `docs/core/design/ENGINEERING-MODE.md` 各节坐标全为**现状路径**且经实核（零迁移前 `src/**` 形） | FR4 · N4 |
| A-EM8 | 三机检（锚域悬空 0 · 宽度零新增 · 台账 0 违规）全绿 | N3 |
| A-EM9 | 变更面分流：三分面判据 + 默认归类（未列入 ⇒ 产品面）在档；两条机械面冲突已登记（含消解路径 + 到期条件） | FR27 · §1.21 |
| A-EM10 | 父侧轮次与提交纪律 B / C / F / I 四条 + **追加三条**（第 4 条 派单三句 · 第 5 条 父侧不代笔 · 评审侧 `Suggestion` 形态）在档且落点明确；「工程工具不入 `files` 域」句在位（`## 实施委托结构化` 节） | FR29 · §1.23 |
| A-EM11 | 批次档生命周期五条判据（界 / 护栏 / 闭合 / 接续 / 判定权）在档；细则指针 → `design/BATCH-RECORD.md` §5.1 | FR28 · §1.22 |
| A-EM12 | 设计者接单与交付时序**六条**（A′ 引用 vs 复核 · B′ 回合预算 + 落盘时序 · C′ 闸纪律 · D′ 接单纪律 · E′ 不自选未派的活 · **报告形态**）在档且落点 / 锚明确；B′ 与既有「≤6 次 explore spawn / 批」并列记账 | FR30 · §1.24 |

**用例表（正常 / 边界 / 错误）**：

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| EM-1 | 正常 | 工程模式 spawn `eng-designer`（带可用 `batchDoc`） | 放行；装配工程纪律槽；工具集含 `batch_segment`、不含 advisor |
| EM-2 | 错误 | 非工程模式 spawn `eng-designer` | throw（与 eng-coder 门同族） |
| EM-3 | 错误 | spawn `eng-coder` 不带 designToken / token 不符 | throw（零 spawn） |
| EM-4 | 边界 | 链终 consume 后同 designId 再 spawn | 机械拒（槽 not found）；重复 consume 幂等 |
| EM-5 | 边界 | designer 内 spawn `explore` / `coder` | 前者允、后者拒 |
| EM-6 | 边界 | slot 显式 `false` + config `true` | 判 false（slot 压过 config） |
| EM-7 | 错误 | 文档内出现 token 值形态 | 巡检报红（`test:full`） |
| EM-8 | 正常 | 工程工具面机械改（如 `scripts/**` 内阈值常量） | 父侧直改 + 实跑报读数 + 报告「父侧直接执行」；不 spawn、不需 designToken |
| EM-9 | 边界 | 改动面未列入两枚举（如仓根新增 `tools/x.mjs`） | 按产品代码面走全流程（fail-closed）；不得默认直改 |
| EM-10 | 错误 | 父侧轮次零文本收尾（「No response requested.」类） | 判违规（C 条）；合规收尾 = 面向用户文本**或**显式进等待态 |
| EM-11 | 错误 | 父侧陈述「已派 eng-coder」而本轮无对应调用 / 队列状态与工具回执不符 | 判违规（B 条）；队列状态以**工具回执**为准 |
| EM-12 | 错误 | 修正轮派单缺「三句」任一句（如未写「本轮不做」清单） | 判**派单不合规**（第 4 条）——执行者撞到即打回补派 |
| EM-13 | 错误 | 修正轮派单的 `Suggestion` 列写「由主 agent 收正」，设计者据此跳过整表 | 判违规（D′ / §1.24 0-4）——**归属句 = 派单方向，不是免做令**；处置执行人 = eng-designer（D1 唯一写者） |
| EM-14 | 错误 | 父侧自行落笔设计 / 需求档（非自有写域、未派修正轮） | 判违规（第 5 条）——合规路径 = 派修正轮给 eng-designer；纯机械形态收正须打标 |
| EM-15 | 边界 | 首版 >15 回合 / 单档修正 >10 回合仍未落盘 | **降级交付**（骨架 + 未决清单）——不得以「核实未完」推迟落盘（B′） |
| EM-16 | 错误 | 派单已限定本轮任务面，设计者改做未派的相近工作（机检折行 / 行数订正 / 收口陈述） | 判违规（E′）——交付里有活、无修正 |
| EM-17 | 正常 | 设计者新写坐标 / 引用评审员 · 父侧已给的坐标 | 前者**各实读一次**并带 `file:line`；后者按**引用**处理、不逐条复读（A′） |
| EM-18 | 边界 | 修正轮中途（落盘前）复跑三机检闸 | 判违规（C′）——闸**只在交付前各跑一次** |
| EM-19 | 边界 | 交付报告含过程自述 / 复述推理链 / hmm 式旁白 | 判违规（**报告形态**条——§1.24 0-7）——报告只含结论 + `号 → file:line` |
> **覆盖面说明**：EM-8–EM-11 未覆盖 §1.21 0-3② / 0-4 与 §1.23 F / I；EM-12 – EM-19 覆盖 §1.23 追加三条与 §1.24 六条——两类行为面均无机检，验收 = 落笔逐字 + 评审核验（同 `requirements/ENGINEERING-MODE-MECHANISM.md` §1.19 先例）。

## 12. 不并项与历史沿革

| 面 | 内容 | 何故不并 |
|---|---|---|
| 逐批设计记录（原 §2.11–§2.32 的批次小节） | 每批的「问题陈述 / 方案选型 / 受影响文件 as-of 快照 / 关键决策」 | 一次性批次材料——机制结论已提炼入本档正文；流水归 `docs/batches/` + git 历史 |
| 受影响文件 as-of 快照表 | 原 §2.14 / §2.18 / §2.21 / §2.23 / §2.25 等「不得当契约引用」的行数表 | 快照（as-of 数字不作契约）；现状行数以工具实测为准 |
| 用例表与验收标准的历史编号集（T25–T112 / AC10–AC90 / T-V5-*） | 逐批用例与 AC 明细 | 批次验收材料；**机制级不变量与判定句**已并入各落点档的验收标准节 |
| 状态行与落笔流水 | 「实现未启动 / 待用户发起评审 / 已落 / 待 coder」类状态句 | 运行时状态；单笔改动通知 = 变更记录行 + git |
| 已退役机制 | METHODOLOGY 携带/缺失降级（D-M1/D-M2）· 旧 `engineering.md` / `engineering-sub.md` / `methodology-template.md` 载体 · 无签名 token 的防伪层 | 已退役/已迁——语义保留处已并入正文（载体改指纪律层双源） |
| VSC 专有面实现坐标（§2.22 / §2.23 的 VSC 仓文件路径与行数） | VSC 仓逐文件落点表 | **P2 产品面**——按 P5 归 VSC 轮；本档只保留机制原则（语义同源·原文自持 / 镜像锚 / 两处各落）与需求指针（`requirements/ENGINEERING-MODE-MECHANISM.md` §1.17） |
| 勘察与分析快照 | 评审轮次逐条处置、审计 id 记录、行数剖析 | 一次性材料 |

## 变更记录

- 2026-09-15（**迁移批 · 第 4 批 · 大档拆分实迁** · eng-designer）：自 `thincoder-cli/docs/design/ENGINEERING-MODE.md`（3030 行）按 B 式重建并拆分入 `docs/core/design/`——落点判据 = `design/DOC-SYSTEM.md` §5.1 P1；
  本档承载工作流本体（原 §2.1–§2.10 + §5 + §6 + §2.15 角色面）；批次档机制 / 文档纪律 / 台账机制切出为兄弟档；逐批设计与用例表入「不并项与历史沿革」；坐标全量改现状路径。
- 2026-09-16（**批3 ENG-DISCIPLINE-PROMPTS** · eng-designer）：增补 §4.1 变更面分流（产品代码 ∥ 工程工具 ∥ 文档面——含两条机械面冲突登记与消解路径 / 到期条件）· §4.2 批次档生命周期判据面（细则 → `design/BATCH-RECORD.md` §5.1）· §4.3 父侧轮次与提交纪律（B/C/F/I）；
  §10 增第 7 项已知取舍；§11 增 A-EM9–A-EM11；用例表增 EM-8–EM-11；§13 实测行数收正；需求回指 = `requirements/ENGINEERING-MODE-MECHANISM.md` §1.21–§1.23。
- 2026-09-16（**批3 评审 §3 修正轮** · eng-designer）：评审十条发现落盘——§4.2 护栏语义收正（§3 无轮次上限 / cap 豁免 ⇒ 触达停止判据 ⇒ 停下上报；与 §1.22 / `design/BATCH-RECORD.md` §5.1 三处同步）· §4.1–§4.3 增「可落子集」标注 · §4.2 增非追溯句 · §11 EM-11 后增覆盖面说明 · §4.2 用例指针展至 BR-10 – BR-14 · §4.2 载面自述收正（判据句 = 落条面 ∥ 细则 = §5.1 唯一详述面）；§13 行数收正。
- 2026-09-16（**批3 评审 §3 修正轮 · 追加轮次** · eng-designer）：§4.3 增第 4 / 5 条与评审侧 `Suggestion` 形态（用户追加范围「甲」）；
  新增 §4.4 设计者接单与交付时序纪律（A′–E′ 五条 + 报告形态 = 六条：条文语义 + 落点 + 行号锚）；§11 增 A-EM12 与用例 EM-15 – EM-19（D′ = EM-13，与 §4.3 侧共享——覆盖面说明同步）；
  §13 实测行数收正（**362 行**、**已越 350 拆分触发线**——处置归主 agent）；需求回指 = `requirements/ENGINEERING-MODE-MECHANISM.md` §1.23（追加三条）/ §1.24。
