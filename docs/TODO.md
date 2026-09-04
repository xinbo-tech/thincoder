# 项目待办（Project TODO）

> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示）汇总于此，不散落在设计文档中。
> 设计文档只承载设计本身——待办变更不应触发设计文档变更（避免不必要的 doc review）。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。

### 并行化优化批（2026-09-02，来源：用户并行化缺陷评估 + 工具使用数据审计）——**已实现（2026-09-02，两端落地 + 测试全绿 + code review 通过）**

- [x] ~~subagent 异步化（AGENT-LOOP.md §15：async + subagent_check + 槽位队列 + 收尾等待 + 上限 4）~~——两端实现，CLI 1046/1002 + VS Code 871/871
- [x] ~~approval 批确认 + 批量形态引导（§16：onBatchPermissionRequest + edit/apply_patch 描述 + system.md 批量句）~~——两端实现 + code review 修复轮（touchedPaths/原子性/isDirty）
- [x] ~~VS Code deepseek 400 对齐（PROVIDER.md §14.7：escape v5 / UTF-16 截断 5 处 / 续写构造）~~——VS Code 落地
- [x] ~~VS Code 压缩可见性（CONTEXT-COMPACTION.md §7 D-C3：回调 + webview 状态行）~~——VS Code 落地

## 待办（Open）

### 工程模式 · 模式感知 + 自切换（2026-08-01）

- [x] 每轮工程模式状态提醒——已实现（ENG_ON_REMINDER 注入 + exit 时 OFF 提醒）
- [x] engTool——已实现（src/agent-tools/eng.mjs，enter/exit + persistState）
- [x] 关闭时状态声明——已实现（exit 分支注入 OFF reminder）

（2026-08-25 核对销账：三条均已落地）

### 轨迹存档 · VS Code 同构 + 清理机制（2026-09-04，来源：用户需求 — AGENT-LOOP.md §18.6 D-TR6/D-TR7）

- [ ] VS Code 端轨迹存档同构实现（chat() 入口 — thincoder-vscode/src/provider.mjs:130 — 需求：完整轨迹落盘；本设计 CLI only，端差异见 AGENT-LOOP.md §18.6 问题 3/D-TR6；需要用户明确"也要 VS Code"才启动）
- [ ] 轨迹目录清理机制（按天/会话 GC 配置 — 生命周期未定，分析周期未知，用户定清理策略后再做）

### 模块拆分轮 · 超 500 行文件（2026-09-04，来源：§18.5/§18.6 交付 advisor 4🔴——既有债务）

- [ ] **CLI 8 个文件超 500 行硬限**（HEAD 即超限，非本次引入——现有 8 个先例）：subagent.mjs **690**（R2 后——619 记录已过期——CLI 交付披露）/ agent.mjs 530 / context.mjs 524 / core.mjs 555 / subagent-async.mjs **以拆分轮启动时实测为准**（历史快照 946/896/649 混排——不同时点）等——按 AGENTS.md 硬限应拆，需独立技术债批次（模块拆分=新建文件+改导入面），完成时在 §18.6.2 处勾销
- [ ] VS Code 侧同款：subagent.mjs 512 / subagent-async.mjs **以拆分轮启动时实测为准**（历史快照 896/529/189 混排）——ARCHITECTURE.md:596 已记录并入拆分轮


### 轨迹存档 · auto-think 开关残留（2026-09-04，来源：§18.6 fix round1 advisor 🟡——父侧裁决随 R2 实现批）

- [x] ~~**auto-think.mjs:84 补 logCtx 全字段**（traces/session/cwd/role/depth/kind——当前仅 {stage,turn,child}——traces.enabled:false 时该点仍落盘，违反 D-TR6"关=不落盘"）——父侧裁决：**并入 R2 实现批**（重启后同批实现；同 designId+token 已失效——随 R2 新 token 派发）~~——**已随 R2 交付（2026-09-04——ENGINEERING-MODE §7 R2 条：auto-think.mjs D-TS12 开关闭环——L2 1330/1330）**



### TUI · 工具输出统一（2026-08-01，长期改进）【2026-08-29 核对销账（round2 #1）：三条均已落地，规格以 TUI-TOOL-OUTPUT.md 为准（N 行滚动非三行、`│ …` 折叠非截断）】

- [x] ~~所有工具输出统一为**行间区块**格式~~——已落地（见 TUI-TOOL-OUTPUT.md §1.1/§2.1，面板区已废除）
- [x] ~~区块内容包括执行中实时输入/输出预览~~——已落地（TUI-TOOL-OUTPUT.md FR2）
- [x] ~~历史中保留完整结果（截断落盘机制复用）~~——已落地（TUI-TOOL-OUTPUT.md FR4，64K 落盘）

### TUI · 工具输出面板优化（2026-08-01）

- [x] ~~`renderOutput` 面板标题行~~——条目过时：面板区架构已废除（全部内联块渲染，见 TUI-TOOL-OUTPUT.md）；完成行 `❯ name — done(ms) → summary` 已实现（agent-turn.mjs）
- [x] ~~关闭规则统一~~——同上，面板废弃后不适用；内联块随会话历史持久化

### R2 · L0 语义缺口（2026-09-04，来源：advisor 轨迹分析 #15 挖掘——L0 依赖 verify 的 git-diff 语义问题）

- [x] ~~**L0（修正轮 verify 默认粒度）依赖 `git diff` 找改动文件**~~——**已处置（2026-09-04 fix round1——D-TS1 修订已落:接受超集语义(安全方向,相关测试超集不伤验收)+ 映射明确时按 _touchedFiles 定向——engineering-sub.md 已知语义注 + 7 断言绿——L2 1330/1330）**
- [x] ~~**trace-store.mjs:146-149 注释过时**~~——**已刷新（2026-09-04 fix round1——'auto-think 仍是残留点'注释已更新为'已闭环 D-TS12'——事实核对属实）**
- [ ] **VS Code subagent.mjs:327-329 注释过时**（2026-09-04——R2 VS Code 交付披露——"verbatim _engTaskInput" 注释与行为（已改 A2 机械摘要）不一致——not in 授权清单未动——父侧合批时更新）
- [ ] **subagent-async.mjs A2 摘要触发条件**（2026-09-04——VS Code 交付 🔵#5——仅任务书用 `##` 节标题时生效；无标记回退全量——真实 spawn 任务书格式若扁平式则 A2 不触发——父侧观察后按 B3 惯例再议）
- [ ] **auto-think depth 恒 0**（2026-09-04——R2 交付披露——agent 状态无 depth 戳、调用点 agent.mjs 不在授权清单未传；语义对顶层正确（auto-think 仅顶层 turn 0 触发）——子代理启用时补传；记 TODO）

### advisor 裁决模板 + 轨迹分析结论（2026-09-04，来源：轨迹数据分析——355 条/输出时长实证）

### 修正根因：verify L0 失效——eng-coder cwd 错位（2026-09-04，来源：用户观察"VS Code 端多跑测试"深挖）

- [ ] **verify 的 L0（git-diff 定位改动文件）在"CLI 会话改子目录项目"场景失效——根因链（一手实证）**：
  1. eng-coder 是 CLI 主会话 spawn 的子代理——`agent.cwd` **继承主会话 cwd = `D:\teamcode`**（workspace 根——不是 git 根——git 根在 `thincoder/`、`thincoder-vscode/` 子目录）；
  2. CLI `verify.mjs:78` git-diff 锚定 `ctx.agent.cwd`（= `D:\teamcode`——本身非 git repo）→ "not a git repo or git unavailable" → changedFiles 空 → **L0 失效**；
  3. **`workdir` 参数不解决**（verify.mjs:69 注释明示："workdir only relocates WHERE tests live — changed-file resolution (git diff) stays anchored to the project root"——git cwd 不变）；
  4. **VS Code 端 verify.mjs（109 行）本身无 git-diff 段**（与 CLI 不同构——L27 execute 直接走 node --check/test——无 changedFiles 检测）；
  5. 结果：eng-coder 只能 `npm test` 全量兜底（多次——18:46/18:48 两次全量 + flake 复检全量）——**用户观察"多跑很多遍测试" = 此根因直接后果**。
  - **修复方向（设计已落——AGENT-LOOP.md §18.12——2026-09-04 评审 0🔴 批准——token a3e7aa20/designId 1ab6cf3e——待实现（#2/#4/#7 项随 §18.11 批——§18.11 双端已交付））**：①verify git-diff 从 `_touchedFiles`/显式 repo 根推导（不依赖 agent.cwd——**D-VR1 定稿：_touchedFiles ∪ git diff（testCwd→cwd 尝试）**）；②或 eng-coder spawn 时 cwd 指向任务书工作目录——**被 D-VR4 否决**（影响所有子代理基线——风险 > 收益）；③VS Code verify.mjs 对齐 CLI 补 git-diff 段（D-VR2）



### §18.8/§18.10 生效复核口径（AC-OA4——2026-09-04 落——重启安全）

> **目的**：改造生效后复核"advisor 还纠结不纠结"——对照口径已定——防新旧轨迹混分。

- **改造前基线（before）**——3 次外部设计评审（round1/2/3——铁律/对象锚未生效——轨迹文件与密度）：
  - `38478126a2c4-530.jsonl`（round1——72K 推理——信号密度 1.48/1K）
  - `38478126a2c4-593.jsonl`（round2——52K——2.29/1K）
  - `38478126a2c4-636.jsonl`（round3——75K——1.82/1K）
  - 基线密度均值 ≈ **1.86/1K**（信号 = wait/hmm/actually/hold on/let me reconsider/拉锯——正则同本章分析口径）
- **改造生效 T** = id:4/id:5 **交付 + 双端 L2 核销通过**的时刻（此处记录：**2026-09-04 05:06——CLI 1344 测/1298 pass 0 fail（46 skip 慢测）+ VS Code 1043/1043——含修正轮 id:6(id:7)——T 至此定）**
- **改造后样本（after）** = T 之后**首次"干净"外部设计评审/代码评审**的轨迹（注意：**id:4/id:5 内部 explore 审计/advisor 复评不算**——它们跑的时候模板可能未落定——mixed 样本不用）
- **判据（AC-OA4）**：after 样本信号密度 / 基线 1.86 —— **≤ 0.70（降 ≥30%）= 达成**；未达 = 复核报告呈用户（门缓冲设计：">30% 降幅为交付后观测——非交付门禁"——round3 裁决）
- **统计脚本**：`node -e` 扫轨迹 JSON：reasoning 匹配 `/(\bwait\b|\bhmm\b|\bactually\b|\bhold on\b|let me reconsider|on second thought)/gi` 命中数 / reasoning 字数 × 1000——与基线同法（口径一致）

### §18.8/§18.10 交付后收尾（2026-09-04——id:5 VS Code 交付 clean——父侧核销通过后）

### engineering.md A-裁定同类残留（2026-09-04——id:6/id:7 修正轮上报——**用户已拍：1=并入批 / 2=保留 / 3=记录**）

- [x] ~~**engineering.md:107**——父侧审计描述 "changes outside the approved file list" **缺 "AND not reported" 限定**——与 A 裁定口径偏宽——**F1 同类残留**——**用户拍板：修——并入 prompt 同步批**~~——**已随 §18.11 批修复（2026-09-04——:107 → "AND not reported in the delivery report"——两端 + T-BI3 断言——见 AGENT-LOOP §18.11 D-BI3）**
- [ ] **engineering.md:295**——架构师侧 Hard Rules 旧句 "Do NOT modify any file not listed in the approved design."——父代理约束（FR6 方向一致——非矛盾）——**用户拍板：保留**（不作修改——确认非矛盾——阅读混淆风险接受；如日后要加 "as the parent agent" 限定词——随 prompt 同步批顺手）
- [ ] **A-裁定句三处复制**（engineering-sub.md :9/:19/:34——设计接受）——日后改措辞须三处同步——**用户拍板：记录**（可选补 "三处逐字一致" 断言——并入 prompt 同步批——低优先）——**as-of 注（2026-09-04）：:9/:19 已由 id:6 修正轮同步为 A-裁定句（防回归断言已补）——现行三处均为 A-裁定句——本条仅留"日后措辞三处同步"提醒**


### 铁律生效后观察：修正轮纠结密度（2026-09-04——分析发现——等首批铁律后新任务复核）

- [ ] **修正轮密度 2.20/1K > 评审基线 1.86/1K（+18%）> 主面实现 1.63/1K（+35%）**——（20:54:30+ 窗口 56 条/207K/456 信号——id:6 2.28 / id:7 2.17）——"纠结"不只发生在 advisor 评审——**eng-coder 修正轮更重**（A 裁定 vs 任务书边界仲裁 29K/65 信号 = 主因）——**AC-OA4（评审信号降 30%）可能低估受益面**——观察方法：下次"铁律后"eng-coder 修正轮/A 裁定类任务——同口径密度——应回落至 ≤1.3（目标——基线 1.86×0.7×修正轮系数——先记录现状——等样本）


- [ ] **AC-OA4 统计脚本**（可选——仓库开发工具——`thincoder/scripts/`——§18.9 先例——非 agent 机制）：按「§18.8/§18.10 生效复核口径」段的正则统计轨迹 JSON 评审信号密度——供 after 样本复核用
- [ ] **run.mjs 495 行挂债**（VS Code——>300 advisory 既有——R3 挂债不重复——记入模块拆分轮候选项）
- [ ] **§18.8/§18.10 实现批次状态同步**（待 id:4 CLI 交付——本节补双端实现记录 + T 时刻填入复核口径段）——**已填 T（05:06）——本节 DONE（双端核销 1298/1043——待下表勾销）**

**分析结论（一手数据——2026-09-04 355 条轨迹）**：
1. **实测时间模型修正**：advisor 单轮耗时 ≈ 输出 reasoning 生成（无缓存）——prompt cache 命中率 **78.9%**（3.5M 命中/0.94M 未命中）——**输入上下文不是时间大头**（缓存已覆盖），R2 B1（批并行）主要省文件读 latency/轮数网络往返，非 token 成本；
2. **最大单项 = 最终裁决轮**：#15 单轮输出 **12,433 reasoning tokens ≈ 126s**（39K 字推理——自我协商 🔴/🟡/归属）；#36 输出 ~20K+——**一轮顶 5 轮工具轮**；
3. **纠结分布**：advisor/advisor 1.79 信号/1K 字（最高——裁决类）；explore/sub 0.86（低——审计器不拉锯，深读为主）；eng-coder 1.58（方案/约束）；
4. **扫描模式**：advisor 是"一次并行扫描 + 增量深挖"（每轮 2-4 工具并行已生效），**不是步骤 1-2-3-4 重复跑**——多轮 = 渐进验证（有值），非重复。
5. **纠结点全量统计（2026-09-04——272 条有推理轨迹——参考存档，暂未立项）**：全局主题排行——方案选择 56.6% / 对齐镜像 40.8% / 文档状态矛盾 25.4% / 机制可行 25.4% / 严重级裁决 21.7% / 目标范围 18.0% / 日志残留 14.7% / 该不该修 14.3%；**角色画像**——顶层 advisor? 目标范围 73%（"评谁"锚定）+ 机制可行 47%；eng-coder/adv 开发内部评审：对齐镜像 69% + 方案选择 61% + 严重级 58%；eng-coder 开发：方案选择 49% + 镜像 40%；explore 审计：方案 51% + 镜像 46%（但拉锯低——深读为主）。**可能措施优先级（观察，未立项）**：①评审对象锚（目标范围 73%——顶层评审最大）②镜像对齐优化（40-69%）③裁决模板（严重级 21-58%——低一档）④方案选择辅助（低——自然工程判断）。

- [ ] **advisor 裁决模板立项**（治 #15/#36 单轮 126s+——输出 reasoning 自我协商）——设计方向：评审提示词注入"裁决三步法"（先看用户明确要求→再判实现 vs 意图→最后标 🔴/🟡）+ 结论表格先行（减少自我协商式推理）；**注意与 R2 B2（范围收缩）正交——B2 减读什么，本项减怎么判**；实现含提示词/两端断言——需设计 → 评审 → 实现（候选，等用户定时机）

### 本仓库开发工具 · 镜像同步脚本候选（2026-09-04，来源：§18.9 撤销降级——通用 agent 原则）

> **定位（用户原则纠正）**：thincoder 是通用 coding agent——** agent 机制层不得锁死本项目关联**——镜像对齐（thincoder ↔ thincoder-vscode 提示词 15 对 byte-identical）是**本仓库开发杂务**,不是 agent 能力。agent 不内置"我知道这两个仓库镜像"——由**项目任务书/设计文档声明**（agent 只执行通用复制/比对）。

- [x] ~~**镜像同步脚本（仓库内工具——可选）**：`thincoder/scripts/sync-prompts.mjs`（CLI 权威复制 VS Code + 15 对清单 + 镜像报告 + package.json `sync:prompts`）——**仅作为本仓库开发脚本**（像构建脚本一样），不进 agent 设计文档——改动提示词时"任务书提及可运行"；当前漂移已修复（2026-09-04 fix round1——5269/5269 一致）~~——**已取消（2026-09-04——§18.11 byte-identical 约束取消——脚本无必要——见 8 点批 #1 进一步裁定）**

### 8 点纠结点处置批（2026-09-04——**8 点全部已拍**——来源:轨迹分析 8 主题全量统计）

> **批次定位**：8 个纠结主题（对齐镜像 976K / 方案选择 870K / 机制可行 779K / 严重级 769K / 文档状态 729K / 目标范围 632K / 日志残留 630K / 该不该修 510K——纠结字数）逐点处置——用户逐个拍板（此批记为用户裁定）。

**已拍（✅）**：
1. **对齐镜像**——§18.9 撤销升为仓库工具（通用原则——agent 机制不锁项目）+ 两端 AGENTS.md 声明（2026-09-04）+ 同步脚本 TODO——**进一步裁定（2026-09-04 11:11——用户："取消二者二进制一致约束"）——改为设计锚为准**：两端提示词**不再强制 byte-identical**——设计文档**逐字定稿镜像锚（保留——权威源不变）**——两端各自照抄实现——差异靠**设计评审+交付审计发现**——不再机械断言字节相同（替代方案 A——用户拍板）；**连带**：①15 文件比对断言（agent.test.mjs:4254 等）改为"各端含设计锚句"内容断言；②同步脚本候选**取消**（字节约束没了脚本无必要）；③两端 AGENTS.md 镜像声明更新；④METHODOLOGY 多实现面条款更新（镜像锚保留逐字定稿——但"逐字一致断言/byte-identical 同步"删）。**现状**：15 对文件当前仍一致（末次维护 2026-09-04）——未来允许漂移、允许各端独立演进——对错以设计锚+评审为准。
2. **目标范围**——§18.8 对象锚（设计就绪——评审时父侧传 object 参数注入对象声明块）；
3. **日志残留**——已处理（R2 fix 清注释——剩余两处注释待合批）；
4. **该不该修/授权边界**——**A 裁定（2026-09-04）**：去掉"文件清单外不可改"硬约束——清单外改动**允许**（交付必要），但**必须逐项报告中说明**（透明）；审计"out-of-list"判据改"**改了且未报告=偏差**（静默越权）；已报告=透明可接受；
5. **机制可行**——A（L0/verify 语义已定——§18.7 D-TS1 fix round1 已调和）= 已解决；**B（测试缝句）**/**C（授权边界句）**（已含上条裁定）/**D（镜像并行句）**——**D 已拍（2026-09-04）**：byte-identical 测试失败 ≠ 你错——可能对端未同步——检测漂移不判对错——交付时说明（通用语义句——不锁项目）；

**5 号已拍（2026-09-04——文档状态——固化 R7 裁决）**：**文档状态**——它（advisor）实际判定统计（7 轮）一致且正确——**固化 R7 裁决铁律**（不再每次想）：
- **R7a**:文档状态矛盾/跨文件滞后 = 🟡——报出、不改（评审只读）；
- **R7b**:内容矛盾时——**设计层(D) > 需求层(F) > 记录(TODO)**——以较高层为准（#15: "design chooses L0 + fallback"）；
- **R7c**:数字漂移/TODO 未勾销/文档卫生 = 🔵——轻微不阻塞（#36(7)、#432(2)）；
- **R7d**:语义悬空 = 🟡——报设计缺口（父侧补）；
- **R7e**:从不因文档状态矛盾卡"通过"——矛盾=🟡 报出即过（7 轮全 passes）。

**2 号已拍（2026-09-04——方案选择——固化 R6 测试缝判定）**：**方案选择**——主要子类（测试缝发明 ~60%）是**健康工程判断**（它自己解决了——加 seam）——不压制；但**其发明过程可固化为 R6 判定铁律**（下次不用重走 A→B→C→D→E）：
- **R6（测试缝判定）**：测试需 mock 内部工具集/慢工具时——若工具集由循环内硬编码获取（不可注入）——**不要试** 真实慢工具/FIFO/大文件（不确定）/观察 onTool（不足以区分串并行）/mock LLM 返回真实工具（太快观察不到交错）——**唯一路径 = 加测试 seam**：setter（`_setXxxForTest`）或参数 override + `??` 默认兜底（默认 null → 生产零变化——审计确认）——测试 finally 恢复 null——**两端镜像同法**（CLI `_runAdvisorToolLoop` toolsOverride 7 参 / VS Code `_setAdvisorToolSetForTest`）。
- **A2 格式脆弱观察**（子类 20%——非本点错——A2 对任务书格式不一致脆弱）——记观察——等实际任务书格式（TODO）。

**4 号已拍（2026-09-04——固化判定模板——样本 7 轮）**：**严重级裁决——固化它已经做对的结果**（7 轮最终评审实际判定提取——诚实标注：样本 7 轮——同批次 R2 环境——固化为参考模板，待样本扩大复核）：
- **R1** 文档矛盾/状态不一致 = 🟡（不是🔴——报出即修——父侧文档层；**注（2026-09-04 D-10.1 权威句）：例外——同一机制两处不同描述 = Document ownership 🔴——维持 advisor-design.md 约定——不降级——以 AGENT-LOOP.md §18.10 D-10.1 为准**）；
- **R2** 实现偏离设计（验收未达/静默简化）= 🔴（必须修）；
- **R3** 已有先例裁决（挂债——如文件尺寸） = 🟡/🔵 不再升级——不重复纠结；
- **R4** 测试脆弱（墙钟/依赖序列化形态） = 🔵 + 建议改确定性；
- **R5** 范围协调（父侧待办） = 🟡 "协调项"（不报缺陷）。

**固化落点**：评审提示词注入"判定铁律表"（上述 5 条——替换/辅助现有裁决模板）——咨询模板 + 结论表格先行（先给表再详述）——**实现层待设计（§18.10 批）**——固化基于 7 轮观察（非绝对规则——标注样本量）。

**落点**：全部拍完后 → 设计（§18.10 轨迹分析优化批——对象锚 §18.8 已独立就绪——其余并入批设计）→ 评审 → 实现。

- [x] 状态栏实时显示当前工具名——已实现（`render-frame.mjs` `state.currentTool` → 状态栏 toolHint）

### 工程模式 · code review 评审范围显式化（2026-08-01）

- [x] code review 评审范围改为 task 的 Docs involved + 验收标准——2026-08-25 核对关闭（ENGINEERING-MODE.md FR4：eng-coder 返回后父代理自动 advisor(type=code)，范围=Docs involved+验收标准）
- [x] setup.mjs 提示词解耦——已实现（PROMPT-DECOUPLING.md 定稿后落地，工程提示词独立组装）
- [x] 多设计并行 token 映射化（单值 token → designId 槽集合）——**2026-09-01 已实现销账**（ENGINEERING-MODE.md §FR3/FR8 + 变更记录）：08-31 否决的是"文档锚 `{designPath: token}`"（文档改名/回写失效）——落地采用 **08-31 预留的"评审实例表"路线**（评审调用生成随机 designId + 父代理 `_engDesignTokens` Map，文档仅审计不参与校验），非文档锚。触发场景真实发生：memory_delete + §14 并行 spawn，单值覆盖致 §14 首 spawn 失败。实现：advisor 通过结果回显 designId（评审 #1）、token 入 Map 槽 + 保留 `_engDesignToken` 单槽兼容镜像（关键决策 ②）；spawn 增可选 `designId` 参数按槽定位（单设计省略/多设计必带，T16 不误取）；复审失败不入槽不清槽（评审 #2 方案 ②）；engineering.md 注入并行化纪律 + designId 并行调用形态；两端镜像 + T15-T17/T19 测试。

### Issue 批量（2026-08-22，来源：Gitee/GitHub issue 巡检）

- [x] IK9IXD 数学公式渲染——已实现（`src/tui/math.mjs` LaTeX→Unicode，commit 127130a）——2026-08-25 核对销账
- [x] IK9UWM Windows 中文粘贴乱码——已实现（clipboard UTF-8 + BOM 剥离，commit 5c72ec2）——2026-08-25 核对销账
- [x] GitHub thincoder#1 embedding 三件套——已实现（cmd-config.mjs embeddingPatch 补写 baseURL/model，引用 DEFAULTS）——2026-08-25 核对销账
- [x] IK9UZ8 思考型模型标题生成失败——CLI 已实现（commit 3c1815e）；vscode 侧状态见 vscode TODO 同名条目
- [x] GitHub thincoder#2 GLM tool_calls 畸形解析——已实现（openai.mjs droppedToolCalls 防御合并 + agent.mjs 丢弃提醒，0.12.37；vscode 端 128464b normalizeToolPairing）——2026-08-25 核对销账
- [x] TUI.md 章节号重编号——已修（2026-08-25，## 4-## 10 顺延，无重复）
### TUI · 子agent/advisor 模型显示测试（2026-08-26，来源：模型显示审计）【2026-08-30 核对销账：`[model]` 解析剥离已有专项单测锁定，见下条划线注记】

- [x] ~~`[model]` token 解析剥离补自动化测试（agent-turn.mjs 解析 / render-frame.mjs header）~~——2026-08-30 核对销账：已随 §7.2 D4 落地锁定（实现拆分至 subagent-blocks.mjs routeSubToken；header 渲染随窄带退役迁至 render-conversation.mjs）——`test/subagent-blocks.test.mjs` 专项单测（[model] 元数据只记录一次、后续 [model] 开头内容不吞；T2 无 token 降级由 ensureSubTask 默认态 model=undefined 保证）+ `test/agent-turn.test.mjs` 端到端用例多处（T-A/T-E 等）；契约见 TUI.md §10.4D 测试用例表 T1-T3

### 工具 · checklist 文档完备性（2026-08-27，来源：交付评审）【2026-08-31 销账：§6/§7 用例表已补】

### 工具输出预览保头保尾（2026-09-04——用户"A"——源码实证 + 观察——设计已落 TOOL-OUTPUT-LIMITS-TUNING.md §5）

- [ ] **C 方案：read 读回 offload 文件防炸**——read 工具对 tool-results 落盘文件返回"头+尾"（非全文）——防模型为看尾部读回 1MB 再炸——**独立后续**（A 方案已含尾部预览——多数场景无需读回——C 堵剩余回路——设计 §5 记 TODO）——待 A 方案落地后评估
- [ ] **advisor 截断方向另议**——`advisor/run.mjs:316-333` line-aware 前缀（头向）截断——同一"尾部结果被切"问题——§5 范围注 #6（本批不碰）——另议
- [ ] **陈旧旁路文档修正**——ARCHITECTURE.md:254（"超 16k…只见 2k 预览…硬截断"）+ TOOLS.md:58（"预览 2K 字符足够"）仍是 2026-08-24 前描述——随文档修正轮更新（§5 id:11 审计观察）



- [x] ~~TOOLS.md §6（git 工具扩充）/§7（workdir/scriptFile）测试是散文总结，非用例表（§8/§8.1 已有完整表）——补成 输入/预期 用例表，与 §8 对齐~~——2026-08-31 回补：§6 补 T-g-1..12（add 分文件/push 远端/tag 三态/branch/checkout 快照/stash/reset hard/revert/参数校验/workdir/反向路由/status porcelain），§7 补 T-w-1..2（workdir 子仓库/越界）+ T-e-1..6（scriptFile/nodeArgs --check/越界/缺参/禁 flag/路由描述），格式对齐 §8（输入/预期/对应需求）。

### 测试 · test/ 纳入 lint（2026-08-30 来源 CLI-LINT-TUNING §2.4；2026-08-31 销账）

- [x] ~~CLI `test/` 目录纳入 lint（对齐 vscode 端 lint 含 test 的做法）~~——2026-08-31 落地：eslint.config.mjs 加 test 段（globals 补 Event/require——webview 事件 dispatch 与集成测试清理守卫）、lint script 改 `eslint src test`、存量 62 条清零（38 unused：args 改 `_` 前缀 + 死 import/死解构删除；18 control-regex 加 disable 注明"断言 ANSI 转义"；4 regex-spaces 改 `{2}` 精确量词；2 no-undef 由 globals 声明）。教训沉淀：删 unused 解构时**同名变量可能在不同 test 作用域各有声明**（texts/mkdir/writeFile 各踩一次），逐处验证用途再删，不能按符号名全局替换。

### TUI · agent-turn.mjs 超 500 行硬限（2026-08-30，来源：TUI 文档质量审计）【同日销账：已拆】

- [x] ~~`src/tui/agent-turn.mjs` 534 行已超 500 行硬限（AGENTS.md 🔴 级约束；§7.2 路由接线与冻结逻辑扩张所致）~~——2026-08-30 拆分落地：工具事件回调 + flushStream 迁出至 `src/tui/tool-events.mjs`（344 行，新模块）、完成冻结三函数归位 `subagent-blocks.mjs`（253 行，数据层本位，并消除 onToolResult 三处重复冻结循环 → freezeDoneSubTasks/freezeAllSubTasks）、标题生成段下沉 `generate-title.mjs` `ensureSessionTitle`；agent-turn 余 174 行（纯回合驱动器）。787/787 全绿，行为零变化（既有测试全锁定）。

### 模型 · GLM-5.3-Flash 交付评审遗留（2026-08-28，来源：交付评审）

- [x] ~~`src/config.mjs` 约 328 行超 300 行阈值——建议把 MODEL_SPECS / PROVIDER_PRESETS 表格抽到独立 spec 模块~~——2026-08-31 落地：MODEL_SPECS + specForModel 抽至 `src/model-specs.mjs`（config.mjs 358→266 行回到建议线内；config **re-export** specForModel——23 个既有 importer 零改动；PROVIDER_PRESETS 仅 23 行留下不抽）；COMPACT_RATIO 归 config（压缩阈值概念本位）。PROVIDER.md §11 T2 用例仍缺（下条）
- [x] ~~PROVIDER.md §11 测试表 T2（read_image 对 glm-5.3-flash 不拒绝）未直接写成自动化用例，仅靠 multimodal=true 断言间接覆盖——择机补 readImageTool.execute 用例~~——2026-08-31 销账：`test/tools.test.mjs` "read_image: glm-5.3-flash 多模态放行（PROVIDER.md §11 T2，2026-08-31 补自动化）"——直接调用 readImageTool.execute 断言不抛拒绝且返回 data:image/png 结果（agent.test.mjs:407 T1 spec 断言同在）
### Provider · core.mjs 拆分（2026-08-28，来源：Qwen enable_thinking 交付评审 #4）【2026-08-31 销账：normalize 抽出】

- [x] ~~`src/provider/core.mjs` 419 行超 300 建议线（接近 500 硬限）——body 组装（含 enable_thinking 注入段）或 stripImages/normalizeToolPairing 抽独立模块~~——2026-08-31 落地：`stripImagesForTextModel` + `normalizeToolPairing`（发送前载荷净化，纯函数、无 chat/重试内部依赖）抽至 `src/provider/normalize.mjs`（82 行）；core.mjs 420→350 行（chat 主流程 + 重试/列表为不可再分的调用核心，345± 为该职责的体量下限，记录为现状）；core **re-export** 两函数——provider/index.mjs 与 tool-pairing.test.mjs 引用零改动。非本轮引入，择机条目按期销账。

### 测试 · 慢测试 fs 优化候选（2026-08-30，来源：测试分层改造）【2026-08-31 销账：真因不在 saveSession】

- [x] ~~`agent.test.mjs` "session: 保存/恢复/新建 往返" 单测 16.4s、checkpoint 回滚 7.6s——疑似临时目录 fs 抖动/全量副本策略~~——2026-08-31 定位并修复：**真因是"原子写不残留 .tmp"断言扫描了 `~/.thincoder/sessions/` 全目录**（readdirSync 实测 18s——用户机上 31123 个文件、含 22MB 大会话，Defender 干扰放大；独立复现 saveSession/loadSession 全序列仅 16ms，用例其余逻辑 <15ms）。修复：改为 existsSync 直探本槽位 `.tmp` 路径（O(1)），断言语义不变。16.4s→**17ms**。checkpoint 7.6s 属 git 子进程真实成本，保留 slow 层。


### 记忆 · memory_delete 边缘容错（2026-09-01，来源：delivery review #8）

- [ ] `deleteByUid` 对畸形 uid（如 `personal:5:extra`）静默删目标 id（rest[0] 通过且 trailing 段被忽略）——工具生成的 id 均规范（实际不可达），低优先级加固：rest 长度校验或 strict 解析

### MCP · readMcpSection servers 非数组静默当空（2026-09-01，来源：MCP §5 交付审计 #4）

- [ ] `config.mjs readMcpSection`：`mcp.servers` 存在但非数组（如 `"x"`）→ 返回 `ok:true, servers:[]` 被当"disk 为空"——未连接的内存 server 从菜单消失且无 ⚠ 提示（比 JSON 解析失败更隐蔽）。改判 `ok:false` 走畸形回退（方向见本条；MCP.md §5 补记仅留指针——评审 #3 设计文档不承载待办，实现待补）

### MCP · 面板消息路由测试缺口（2026-09-01，来源：MCP §4 交付审计）

- [ ] `src/extension/panel-messages.mjs` 路由层无测试触达（reconnectMcp/editMcp/testMcp 三 case 零覆盖）——VS Code [Reconnect] 死按钮正是「webview 发消息 + 路由缺失」这种无测试接缝处的复发实例；补最小路由断言（消息 → 对应 handler 调用），防同类回归

### TUI · 渲染/回调模块 300+ 行 advisory 存档（2026-08-30，来源：agent-turn 拆分评审）【2026-09-01 更新：render-conversation 573 行超 500 硬限，见下条】

- [ ] `src/tui/render-conversation.mjs` **573 行（超 500 硬限，2026-09-01 §7.2.1 后实测）**——组件化后自 630 降 573（runningSubs 段迁出 subagent-panel.mjs），仍超硬限——剩余主体 frozenSubTask/advisor/tool-block 折叠装配；建议后续拆分（frozen/tool-block 段渲染独立模块）。附：frozen 头 `▶ [✓ …]` 未做宽度截断（§7.2.1 评审 #1 标注存量）——顺手一并处理
- [ ] `src/tui/tool-events.mjs` 344 行超 300 建议线——状态栏分支（onToolCall 的 name→status 映射表）可表驱动压缩；刚随拆分落成，观察增长再动


### 子agent · 活动输出统一（2026-08-29，来源：需求澄清；需求定稿见 AGENT-LOOP.md §7.2）

- [ ] ACP 桥结构化映射（评审 #1 方案 a 已裁定：`⟦ev⟧` 事件剥除随 §7.2 本轮落地（D7）；对 ACP 的结构化映射为 tool_call_update 留本条后续做）
- [x] ~~outputPanels 死代码清理~~——已随 §7.2 D6 落地（2026-08-30，layout/render-frame/render-loop 三处删除；`test/render-loop.test.mjs` 源码回归断言全仓无写入方）
- [~] VS Code 端跟进项已移除（2026-08-30 用户裁定）：跨项目待办不入本项目 TODO——thincoder 与 thincoder-vscode 各自独立流程，将来做时在 vscode 项目内立自己的需求/TODO（含 webview 宿主侧 advisorChunk/subagentChunk 路由合并）

### Subagent · 角色能力矩阵动态化（2026-08-28，来源：kimi/opencode 对照研究）

- [ ] 档位 B：subagent 工具 description 按模式+调用方 allowlist 动态装配"角色×工具"矩阵（对标 kimi buildProfileDescriptions / opencode registry 动态渲染）——工具集变化时描述自动跟随；2026-08-28 已落档位 A（静态充实版 description + 防泄漏断言，两端对齐），B 留待工具集真频繁变化时再动（round3 #7：Done 区残骸已并入本条，不再双处维护）

### 文档完备性补挂（2026-08-30，来源：文档全量扫描发现的漏挂项）

- [x] ~~PROVIDER §12 `thinking_budget`（限思考 token 上限）——决策表注明"记 TODO"但未入本清单，补挂（独立增值项，与本轮 enable_thinking 正交）~~——2026-08-31 用户终裁：**否掉（评估后过度工程）**。理由：①现有兜底链已覆盖真实痛点（maxTokens 调大/reasoningEffort 降档/Partial Mode 续写/DeepSeek prefix 续写——真实案例均非"兜底失效"而是"参数未配"）；②支持面窄（2026-08-31 核实矩阵：仅百炼 extra_body.thinking_budget 与 Claude budget_tokens（≥1024 且 <max_tokens 有坑）原生支持；DeepSeek官方/GLM/Kimi/MiniMax/Doubao 均无 budget；deepseek 预设走官方端点即不支持）；③业界趋势收敛回 effort 档位（Claude 新模型 adaptive+effort、Gemini 3+ thinkingLevel），token 预算接口在退场。**临界条件**：若将来出现"百炼用户 maxTokens 拉满仍空响应（思考吃光预算）且调档位不解决"的真实案例，按 30 行内百炼-only 注入（extra_body.thinking_budget，enable_thinking 同注入点）随手补，不欠账。
- [x] ~~CLI `test/` 目录纳入 lint~~——已销账，见上节（2026-08-31）
- [x] ~~config.schema.json 同步机制~~——**2026-08-31 用户裁定：彻底删除**（非放弃维护）。核实其从未闭环：①线上 URL（saveConfig 注入的 `https://thincoder.dev/schemas/config.json`）从未部署——thincoder.com 仓库无 schemas 目录；②代码从不消费该文件；③DEFAULTS 顶层 25 键仅覆盖 5，providers 层 20 键从未进 schema——维护成本 > 价值。处理：删 `docs/schemas/`、删 saveConfig 的 `$schema` 注入（今后写出的 config.json 不再带该字段，存量字段无害残留）、README 失实宣传行删除。ROADMAP-0.9.0 的历史计划条目按快照规范保留。

### 压缩调优遗留（2026-09-02，来源：压缩目标调优 code review）

- [ ] **文件行数拆模块**（code review #3/#4，advisory 非阻塞）：CLI `src/context.mjs` 499 行 + VS Code `src/compact.mjs` 496 行——均超 300 行 advisory、距 500 硬限 ≤4 行。拆法：探索蒸馏段（CLI L360-499 / VS Code L363-495：EXPLORE_TOOLS/EXPLORE_SUMMARY_PROMPT/distillExplorations/summarizeRunExplorations 系）拆为独立模块（如 `context-explore.mjs`），压缩主路径留在原文件回到 ~360 行。拆前过设计评审（模块归属 CONTEXT-COMPACTION.md §5/ARCHITECTURE.md §5）。

### 开发体验三项（2026-09-02，来源：用户需求批——**已实现（2026-09-02 两端落地）**，设计落点见各条）

- [x] **开发① 删 eslint 全套改 node --check**（TOOLS.md §10.2：devDependencies + eslint.config.mjs 删除，lint script 改 node scripts/check-syntax.mjs；CLI-LINT-REQUIREMENTS/TUNING.md 标记被取代）
- [x] **开发② 工具工作目录作用域限制全部移除**（TOOLS.md §10.1：resolveInCwd 去断言；git workdir/execute scriptFile 越界检查一并移除；工具描述同步）
- [x] **开发③ 模型上下文长度可配置（K 单位）**（PROVIDER.md §15：providers[].context 覆盖 spec；providerSpec 全链路跟随；CLI /model + VS Code settings 配置界面）

### 用户问题批（2026-09-02，来源：用户口头提出 5 条——**已实现（2026-09-02 落地）**，设计落点见各条）

- [x] **Q1 会话恢复 provider/model 缺失**——**已实现（2026-09-02）**：SESSION.md §8 落地——validateProvider + TUI 首帧重选 + headless 退出码 1；测试 session.test.mjs 14 用例 + tui.test.mjs 5 用例：CLI 退出重进时，会话引用的 provider 或 model 已不存在 → 直接报错退出进不了 TUI；期望给用户一个界面重新选择模型。**设计已定稿：SESSION.md §8**（D-S1 判据改空判据——MODEL_SPECS 未知不判无效，评审 #1/#2 已修正）
- [x] **Q2 压缩进度感知**——**已实现（2026-09-02）**：CONTEXT-COMPACTION.md §7 落地——压缩面板（子 agent 区块机制）+ 三态状态机；测试 agent.test.mjs T1-T4 + subagent-blocks.test.mjs T5：上下文压缩时 LLM 摘要耗时长 → TUI 无"压缩中"反馈像僵死；现状 `onCompress` 是**压缩完成后**才触发（agent.mjs:187/196），TUI 只打一行 `[context] Context too long...` warn（tool-events.mjs:402）。期望：压缩**开始**即提示 + 压缩会话像子agent 面板那样显示（可见进度/完成）。**设计已定稿：CONTEXT-COMPACTION.md §7**（D-C2 压缩面板——复用 subagent-blocks 区块机制，用户要求形态）
- [x] **Q3 压缩失败静默飞出**——**已实现（2026-09-02）**：三根因全落地——① prefix 续写止损（PROVIDER.md §14.2/14.3，buildContinuationMessages，真机矩阵实证）② reasoning_content 回传（续写构造规范化一并覆盖；03:11 偶发后未复现）③ hex escape（PROVIDER.md §14.6，escape v5 + UTF-16 安全截断，真机 400→200）；失败可见性（压缩面板失败态）：压缩出错（尤其 deepseek）→ 程序直接飞出零提示。**三根因**：① **prefix 续写 400（Function call should not be used with prefix）**——deepseek 系列 `prefixMode: true`，截断触发续写发 `/beta` + `prefix:true` + 全量历史（含 tool_calls）→ 网关 400（Kilo/dify issue 同款）。**设计已定稿：PROVIDER.md §14.2/14.3（止损：prefix 续写精简历史——过滤工具消息，保留 ≤8 条文本；根治：buildContinuationMessages + 失败可见性）——已实现（CLI，2026-09-02）**；VS Code 端待实现见 PROVIDER.md §14.7；② **reasoning_content 回传 400**——thinking 模式历史 reasoning 未回传；03:11 复现一次后无法再复现（疑服务端临时状态），续写构造规范化（14.2/14.3）一并覆盖——**已实现（CLI，2026-09-02）**；③ **hex escape 400——已修（2026-09-02）**：真凶 = doc_search 预览 slice 截断切断 emoji 代理对 → 孤立 UTF-16 代理 → deepseek 严格解码 400。落地：escape.mjs v5 sanitizeLoneSurrogates + setup.mjs/helpers.mjs safeSliceUTF16 源头修复（详见 PROVIDER.md §14.6，真机 200 验证）；另：压缩失败静默（agent.mjs:183 catch 无 console.error）→ 补可见性（CONTEXT-COMPACTION.md §7 设计已定稿）——**已实现（CLI，2026-09-02，压缩面板失败态）**；VS Code 端待实现见 §7 D-C3。escape v3 已修 hex escape 类（本问题另一独立根因）。
- [x] **Q4 MCP save&test 确认问句废除**——**已实现（2026-09-02）**：MCP.md §5 变更段落地——probe ✓ 直接保存 / ✗ 回表单零保存通道；测试 T16'/T17'/T18'/T25 + T23b/T23c：刚刚 §5 v2 的 `Save? (Y/n)`（探活成功）/`Save anyway? (y/N)`（失败）问句——用户裁定**不需要问**：保存时直接探活 → 正常即保存；失败报错让用户改。**用户 2026-09-02 终裁：探活失败不提供任何保存通道（save-anyway 整个废除——"探活失败还存干嘛"）**。**设计已定稿：MCP.md §5 变更段**（D-Q1 confirmLoop 重构——probe ✓ 直接保存、✗ 报错回表单；T16/T16c/T17 重写 + T25 新增）
- [x] **Q5 搜索工具优先级引导**——**已实现（2026-09-02）**：PROMPT-DECOUPLING.md 变更段落地——discipline.md + engineering.md 行为规则（两端 byte-identical）；测试 T1/T4 断言：提示词应把 websearch（Bing）定位为**纯备选**——有 MCP 搜索服务（glm-websearch_web_search_prime 等）时必须优先用 MCP，Bing 只在其不可用/失败时兜底。现状：discipline.md:72-73 工具表已标注（"weak for technical; MCP search tool first" / "primary when available"）但只是**表格罗列，非强制规则**。**设计已定稿：PROMPT-DECOUPLING.md 变更段**（D-P1 discipline.md 行为规则：MCP 优先/websearch 备用/连续 2 次垃圾即切/镜像路径优先/动手前扫工具表）




## 已关闭（Done）

- [x] **read_pdf 工具（2026-08-27 立项；TOOLS.md §11 设计 2026-09-03 评审 0🔴 + 用户拍板决策点）——已实现销账（CLI v1，2026-09-03）**：9 段解析管线落地——`pdf-parse-xref.mjs`（xref 经典表 + XRef 流 + PNG 预测器、ObjStm、Flate/ASCIIHex/85 + LZW 拒、inflate 上限 + 链式守卫、/Encrypt 拒绝）+ `pdf-parse-text.mjs`（页树、内容流操作符（后缀操作数）、ToUnicode CMap bfchar/bfrange + 编码回退（WinAnsi/Standard/MacRoman + /Differences，表对 Unicode.org/pdf.js 交叉验证）、ActualText ligature、(x,y) 布局 + 轻量 x 聚类分栏 + 段落）+ `pdf.mjs` 工具壳（multimodal:true 扫描页 {text,images} 回传——DCT JPEG 直提/Flate 灰阶转 PNG——视觉门降级文字提示；pages "1-3,5" 50 页上限坏规格报错；readonly）。同步面：index.mjs 注册（24→25 工具）、read_pdf.md DESC、read.md 路由行、双端 discipline.md 工具表 byte-identical、TOOLS.md §1/ARCHITECTURE.md/FEATURES.md。测试 test/pdf.test.mjs（fixture 运行时生成 + Chrome 打印 golden base64 交叉验证）。VS Code 镜像后续立项。
- [x] 语义一致化 4 项（hasCodeMutations src/ 判定、dispatch 未知路径保守、isDocOnlyChange src/ 排除、直接单测）
- [x] Verify 文档改动快路径（VERIFY-DOCONLY.md）
- [x] Token 不消费——已确认（二次 spawn 测试锁死，T14）
- [x] 门禁豁免收紧（isProductCode，含 src/prompts/*.md）
- [x] 评审范围显式化——doc review 端已实现（documents 参数）
- [x] 父代理 code review 回归主代理发起（eng-coder 自评裁定不可行，已回滚）
- [x] ENGINEERING-MODE.md 三层结构补全（需求/非功能/测试用例/错误恢复等）
- [x] METHODOLOGY.md 剥离平台实施细则，重写为用户级方法论
- [x] Project TODO 机制（docs/TODO.md）+ 方法论规范

（本节已并入上方 Open 区同名条目，round3 #7 清理——此处不再保留）

### async settle 挂起缺陷（2026-09-02，来源：用户实测——待复现定位）

- [ ] **同回合两个 async 子代理——第二个完成后主 agent 长期 processing（十几分钟）卡住**（用户两次 Ctrl+C 均因此）：第一个正常注入，第二个"已完成（区块输出完毕）但主 agent 收不到"。候选卡点 A-D：digest LLM 挂起（600s fetchTimeout）/ runAgent 开头 await 上轮 \`_pendingDistill\`（distill LLM 挂起）/ digest 触发压缩摘要挂起 / settle 唤醒丢失。**诊断插桩已撤除（2026-09-02——[diag] 干扰正常显示）**——复现时按插桩点清单重加（曾落于 eea8fcc，可 git show eea8fcc 取 diff 恢复）：① context.mjs distillExplorations/summarizeRunExplorations/compressIfNeeded chat 前后（chatStart/chatDone/chatFail）② agent.mjs runAgent 开头 _pendingDistill await 前后 ③ subagent.mjs settle 回调（id/耗时/suspended/waiters 数）④ agent-turn.mjs digestTurn enter/exit + suspensionSession 每轮迭代/进 wait。**复现**：同回合派两个 async → 第二个卡住时（先别 Ctrl+C）复制终端 [diag] 行。**判读**：digestTurn:enter 无 exit → 看 runAgent:awaitPendingDistill / compressIfNeeded:chatStart 有无 chatDone（B/C），皆无则 A（600s 后 chatFail 证实）；asyncSubagent:settle 有但 suspensionSession:wait exit 无 → D。复现后：定位修复 → 全量验证。


### §19 遗留硬化（2026-09-03——来源：§19 交付 advisor 发现——归 §15/§17 后续轮）

- [ ] **并行 check 双消费竞态**（subagent-async.mjs check——同批两个无 id check 并行可能双消费同一条目——§15 遗留特性：旧 subagent_check 同为 readonly 可批并行——修复需牵动 settle 回调挂起记账）
- [ ] **挂起期阻塞 check 双投**（LOW-3——挂起态 check 与 settle 记账交互——同归 §17 硬化）


### §19.5 交付跟进（2026-09-03——来源：id:9 交付报告 + advisor 🟡——父代理裁量）

- [x] ~~**index.mjs 545 行 / render-conversation.mjs 576 行超 500 硬限**（既有债——基线 524/573——cancelSubagent/mouse ctx 装配可迁 mouse.mjs——拆分轮立项）~~——2026-09-03 TUI.md §10.7 拆分轮落地（行数实测）：index.mjs 447 / render-conversation.mjs 425 / key-handler.mjs 393（D-S4 同批纳入）；迁入方 mouse.mjs 207 / startup.mjs 262；新模块 update-notice.mjs 73 / render-segments.mjs 163 / key-modes.mjs 163——npm test 全量绿、零测试改动（导出面 re-export 保证：upgradeFailureText/pendingNoticeReady 经 index 转发）
- [ ] **sync（阻塞）spawn 区块 ⏹ 语义裁决**：面板无池信号无法区分 sync/async——sync 运行中 ⏹ 可见但不可中止（已实现"可操作指引"提示 Ctrl+C）——彻底方案（⏹ 按池成员门控）需跨 TUI 数据流改造——用户裁决后立项
- [ ] **setup.mjs 受限变体 schema 描述补 cancel 词**（工具层错误信息已含——描述层同步）


### 平台执行问题（2026-09-03——来源：用户实测观察）

- [x] ~~**advisor 并行调用实为串行**~~——研究结论 v3（2026-09-03——**矛盾未解**）：仓内证据全指并行（dispatch 批并行——mock 日志实测 tA/tB 同刻 2011ms 完成；chat 并发实测 130-266ms 间隔；用户 CLI = 0.12.58 新版含批并行）——但**用户直接观察 = 4 advisor 块严格逐个出现（事实）**——矛盾 = 验证链盲区（模型响应与 CLI 执行间未知环节）——**处置：①多设计评审改逐个发起（绕开批量）②LOGGING 落地后（llm:start/done + tool:call/done 时间戳）下次批量调用日志自动取证定论——不再插桩/猜测**


### §17 settle 时序缺陷（2026-09-03——来源：用户复现——"前端忙时后端 eng-coder 完成——丢 digest——没看到交付后处理"）

- [ ] **settle 完成队列改造**（用户建议方向——正确）：settle 无条件入完成队列（不按 _suspended 分流）——空闲（回合尾/挂起/digest 轮）逐个消费注入——根治"回合尾 collect 直注入"的时序缝隙（settle 窗口与 collect/digest 判定错位——报告滞留池——digest 不触发——交付"丢"）——诊断 explore 已派——收尾链完整时序定位后落设计（§17 硬化轮——与"4 explore 主回合未消化"同族）


### §7.2 sync spawn 回收缺陷（2026-09-03——来源：用户实测——"主 agent 同步 explore 完成后未从面板回收"）

- [ ] **sync spawn 完成精确冻结**（根因已确认：finishSubTask "最早 started"启发式——async eng-coder 与 sync explore 并存面板时——explore 完成误冻 eng-coder 块——explore 残留面板）——方案 e：subagent execute ctx 留 _subagentKey（relayPrefix）→ dispatch onToolResult 传 subKey → TUI finishSubTaskKey 精确冻——启发式降级兜底——async 路径不动（⟦ev⟧done 已精确）——设计落 AGENT-LOOP §7.2（待当前批交付后）


### 子 agent 任务调度器（2026-09-03——来源：用户提议——"评审好了就 spawn——实际执行由调度器安排——能并发则并发、该等则等、按依赖顺序排队"）

- [x] ~~**依赖感知调度层**（根治父代理手动调度：冲突检查/并行串行/cancel 重派全靠脑内——id:13/14 同文件并发失误为实证）——机制级设计（§15 池已管并发槽 4 + FIFO 队列——**缺 = 文件域冲突检测 + 依赖序**）~~——**已实现（2026-09-03——AGENT-LOOP.md §20——文件域冲突检测/依赖序/排队——id:3/id:4 排队实证 2026-09-04：spawn 声明 files+dependsOn → 调度器自动排队 position 1/2（域冲突+等待依赖）——依赖完成自动启动——零手动）**—落 AGENT-LOOP §15.x/新机制段


### Ctrl+C processing 态误杀后台（2026-09-03——来源：用户两次实测被坑——"输错半句一 Ctrl+C 把 eng-coder#14 杀了"）

- [ ] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（根因：① agent.mjs:457-463——回合 abort（非 interrupt）无条件清池——连坐杀全部后台；② key-handler:79-84——processing 态第一按无武装直接 abort（无 reason.interrupt——命中①）——挂起/空闲态有双确认而 processing 没有——三态不一致）——修复：processing Ctrl+C 第一按 = interrupt 语义（abort({interrupt:true})——停回合不清池——后台保留——提示再按全停）——3s 内第二按 = 显式清池全停——与挂起/空闲同构——受影响：key-handler.mjs + agent.mjs 清池条件核对（interrupt 路径是否已安全）+ 测试（processing Ctrl+C 首按不清池/次按清池）


### 重启交接（2026-09-03——用户重启 CLI——已批 designToken 全部失效——未实现设计需重新评审后重派）

> 背景：designToken/designId 存于会话内存态——重启后失效——以下"已批未实现"设计重启后**重新走 advisor 设计评审**（拿新 token/designId）再派实现。已交付提交的不受影响（LOGGING/T129/T128/SESSION§9/read_pdf——已落地）。

- [ ] **§7.2.3 sync spawn 精确冻结**——已批（token 9505071c/designId 126fd7be——**未重启仍有效**）——id:13 曾 cancel——§17.5 已交付（blocks 稳定）——id:15 交付后即可重派（无需重评审——token 活）
- [x] ~~**§17.5 settle 完成队列**——已批（token ced16654/a8db8329）——**2026-09-03 16:09 交付完成（id:12——双端 clean——CLI 1242/0 + VS Code 1034/0）——真相：id:12 一直存活（15:08 查池误判被杀——id:14 是重复实例被 Ctrl+C 杀——原实例幸存）——工作区 §17.5 文件 = id:12 完整交付（非残留——无需清理）**——待提交（等 id:15 交付后合批）~~
- [x] ~~**§19.5 控制面扩展**（status 增强/cancel/UI 停止/嵌套前缀）——已批（9505071c 批内——作废）——未实现——重启后重评审~~——**已交付**（见重启交接 2 §19.5 已实现行）
- [ ] **§19.6 panel 检查工具**——已批（旧 token 73ff0a6d/designId 87c40452——作废）——未实现——重启后重评审
- [x] ~~**§20 任务调度器**——已批（旧 token 8a85b23d/designId a9ac6bca——作废）——未实现（依赖 §19.5 cancel 基础）——重启后重评审~~——**已交付**（见重启交接 2 id:2 已实现行——CLI 5f9748f + VS Code 8f1acb4）
- [x] ~~**§17.6 Ctrl+C 武装化**——2026-09-03 16:27 交付提交（id:15——5d500c4——三态武装/agent-turn 区分——CLI 1238/0）~~
- 设计文档现状（重评审的依据不变）：AGENT-LOOP.md §7.2.3/§17.5/§17.6/§19.5/§19.6/§20 全部设计定稿批准状态在文档内——重评审即按文档再评一轮


### agent-turn.mjs 超 500 硬限（2026-09-03——来源：§17.6 交付 stalled 项——§17.5/§17.6 叠加至 535 行）

- [ ] **agent-turn.mjs 535 行拆分**（HEAD 433 → §17.5（collectSettled suspDriven + inSessionTurn 守卫）+ §17.6（interrupt 区分/垃圾回滚/exitArmed 解除）叠加 +102——超 500 硬限）——拆分建议（§17.6 交付注）：挂起驱动段迁出（tool-events/render-conversation L93 先例——agent-turn 174 行先例）——**当前代码已稳定提交（5d500c4）——可拆**——立项排轮（小拆——零行为变化——测试零改动或断言归位）


### prompts 调度器条款升级（2026-09-03——来源：§20 交付后提示词同步缺口——用户指出）

- [x] ~~**main.md Delegation 段升级**：L17 旧条款（"Never give parallel subagents tasks that edit the same files"——否定式手动避让）→ 调度器条款（§20 能力：spawn 声明 files 写域 + dependsOn 依赖——冲突/顺序交调度器（自动 queued——冲突清自动启动）——同文件任务可并行派——不用手动预判/串行等待）——engineering.md 并行段同款——两端~~——**全部落地（2026-09-04——main.md 已升级（T-PS1 绿）；engineering.md 旧句已由 §20.7 修正轮删除——id:5（CLI）交付 clean（删 :212-213 + T-PS2 补断言 + :4014 正→零残留 + 测试标题 🔵 修订——agent.test.mjs 209 pass + L1 1347/1299/0 fail）；id:6（VS Code）镜像交付——父侧核销确认）**



- [ ] **超 500 行文件合并拆分轮**（§20 交付后实测——2026-09-03 id:2 落）：CLI subagent-async.mjs 947 / subagent-blocks.mjs 625（冻结家族抽 freeze.mjs——re-export 保 API——回落 ~460）/ subagent.mjs 611 / subagent-panel.mjs 超限待测 / agent-turn.mjs 535（挂起驱动段迁出）/ tool-events.mjs 537——**VS Code 登记**：subagent-async.mjs 885 / subagent.mjs 510——先例：cmd-mcp 499→382 / agent-turn 534→174——排独立拆分轮（避免同文件并发）——**2026-09-04 §18.12 交付新增登记：verify.mjs 332→429（>300 advisory——429 < 500 硬限——随拆分轮处理）**


### §19.6 交付跟进（2026-09-03——id:17 交付）

- [x] ~~§19.6 panel 检查工具——已实现（aeff441——CLI 1268/0——镜像/门控/降级/分类四表）~~——文档 19.6.5 已落
- [ ] **tool-args 块标题兜底**（§19.6 交付 🔵 残留——tool-args.mjs:44-47——action-only subagent 调用（panel/check/status/cancel）块标题光秃 "❯ subagent"——建议 a.action 兜底显示——非本批清单——后续小轮
- [x] ~~**§19.5 控制面扩展**——早前已实现（CLI db408d2 + VS Code 70f3f8f——重启前）——重启后重评审（54e3e5f5）+ 处置 #4 对齐轮交付（8e9adbc + 50bffd2——⟦ev⟧async 缓冲/⏹ 测试——CLI 1224 + VS Code 1006 全绿）~~


### 重启交接 2（2026-09-03 19:21——用户重启——§12 待评审 + id:2 处置）

- [ ] **TOOLS.md §12 execute prelude 退役**——设计已落（eca6dc8——纯净 node 子进程——删两端 exec-prelude.mjs + 描述重写 + 测试改写 T-E1）——**重启后评审**（拿新 token）→ 派 eng-coder（两端同步——用户裁定"可以，两端同样处理"）
- [x] ~~id:2（§20 调度器）——2026-09-03 19:49 交付提交（CLI 5f9748f + VS Code 8f1acb4——1288/1243 + 1019/1019）~~


- [ ] **doc-sweep 旧名残留**（2026-09-03——§6 交付上报）：FEATURES.md 工具表现列三旧名、ARCHITECTURE.md:378/462、AGENT-LOOP.md:50、ARCHITECTURE-v2.md:115、ENGINEERING-WORKLOOP.md:73、VS Code CAPABILITY_GAP.md:17-18/49——memory 旧裸工具名——独立 doc-sweep（FEATURES/CAPABILITY_GAP 优先）
- [ ] **子代理 memory search 行为侧注**（2026-09-03——§6 交付上报）：memory 单工具 readonly:false——从只读子代理工具表消失（旧 memory_search readonly:true 在内）——如需 explore/plan/consult 内 search 需 allowed 集动作感知——列后续
- [x] ~~**engineering.md 旧手动避让句残留清理**（2026-09-03——advisor #4 交付轮 🟡 + §20.7 实现期已报）：Delegation 段 "Never assign two parallel eng-coders edits to the same file"（§15 前存句——§20.7 设计范围外保留）与调度器条款（同文件 async spawn + files 声明安全——§20.7 D-PS1）矛盾——清理 = 删除或改指向调度条款~~——**已落地（2026-09-04——§20.7 修正轮：id:5（CLI）交付 clean——删 :212-213 + T-PS2 补断言 + :4014 改零残留；id:6（VS Code）镜像交付——父侧核销）**
- [ ] **setup.mjs:295-298 knife-edge 注记过期**（2026-09-03——id:4 报告——评审 #2 从池移回技术组）："adjusted to 12500" 已过时（T3b 重校准 14000）——随下个 setup 触碰轮
- [x] ~~**cancel status 增强**（2026-09-03——personal:58 第 5 点——**2026-09-04 用户"A"立项**）：status 条目带 touched files 摘要——杀子代理前看得见代价~~——**已落地（2026-09-04——设计 §19.5.6 评审 0🔴（token 8578c8cc——6🟡+3🔵 建议项全处置）——实现：CLI id:7（clean——L1 1353/1305/0）+ VS Code id:8（clean——L1 1047/1047——out-of-list setup.mjs/subagent.mjs 已报告补登）——父侧 L2 核销：CLI 1353/1353·0 fail + VS Code 1047/1047·0 fail）**


---


### 重启交接 3（2026-09-04——用户预告重启——待核销 §18.5/§18.6 + R2 设计待启动）

> 用户计划：等 fix round（id:4——§18.6 四项修正：开关透传/删 round/加 isContinuation/本地日期）交付完成后重启 CLI，重启后开始 R2（§18.7）设计。以下状态为重启前落档：

- [x] **§18.5 + §18.6 实现核销完成（工作区未提交）**——VS Code 侧 1025/1025（id:3 clean）；CLI 首轮 1318/1318 + 9 条轨迹实测（id:2——终态 stalled 于 500 行债，实现本身达标）；CLI fix round（id:4——四项修正）洁净交付——**L2 全量 1321/1321 核销通过**；四项修正代码面验证通过（localDateStr/isContinuation/round 删除/三处开关透传）。改动未 commit——重启不影响工作区文件。designToken（c6038d55…——§18.5/§18.6 已签发）**重启后失效**——后续 fix 须重新评审拿新 token。
- [x] **CHANGELOG + VS Code ARCHITECTURE.md 引用段已补**（父侧职责——2026-09-04 重启前完成）：CLI CHANGELOG 0.12.59 条目（§18.5/§18.6）+ VS Code CHANGELOG 0.8.11 条目（§18.5）+ VS Code ARCHITECTURE.md §3 引用段（子代理零 git 镜像——权威源 AGENT-LOOP.md §18.5）；两端 CHANGELOG 版本号与 package.json 未核对（无发版需求——仅记录）
- [ ] **500 行技术债已挂**（模块拆分轮——§18.6.2 #1 + TODO 本清单"模块拆分轮"段）——重启后不变
- [x] **R2 需求定稿 + 设计层已落**（AGENT-LOOP.md §18.7——三级粒度/D 父侧收口/A LLM 收紧/重复层映射——用户已接受——**设计层已写 + round1/round2 两轮评审通过（0🟡）——token d57b0fa0 已签发——待用户批准**——**as-of 注（2026-09-04）：后已批准 + 双端实现 + 核销通过——见 §18.7 状态行/ENGINEERING-MODE §7**；预期涉及 engineering-sub.md/engineering.md 两端 + 断言三件套 + ENGINEERING-MODE.md 引用段——现已全部在 §18.7 受影响文件）

### 重启交接 4（2026-09-04 11:06——用户重启 CLI——§18.8/§18.10 双端已完成——AC-OA4 复核待 after 样本）

> **分界线时刻**：2026-09-04 11:06 本地（03:06 UTC）——**改造生效 T=05:06（双端核销）之后**——`ts > T` 的轨迹 = after 样本窗口（与「§18.8/§18.10 生效复核口径」段一致——b7db45cd token 后启动的评审才是干净 after——本会话无评审发生——窗口空置中）。

**§18.8 + §18.10 实现批已收官（重启前）——4 eng-coder 全部交付**：
- id:4 CLI 主面（stalled——F1 上报非缺陷）→ id:6 CLI 修正轮 **clean**（engineering-sub.md :9/:19 A-裁定同步 + 防回归断言）
- id:5 VS Code 主面 **clean** + 核销 1042/1042 → id:7 VS Code 镜像轮 **clean**（eng-coder.md/:32 同步 + T-10.2b/T-10.4 6 文件）
- **双端 L2 核销通过**：CLI 1344 测/1298 pass/0 fail（46 skip 慢测）+ VS Code 1043/1043；byte-identical 15 文件对绿
- 对象锚（advisor object 参数→messages.mjs 机械注入英文声明块）+ 判定铁律（R1-R7 4 模板字节一致 + 机制三句 engineering-sub.md）——**设计文档全落**（§18.10.1/2/3 + D-10.2 同步注 + D-OA2 英文化 + D-10.4 统一 + ENGINEERING-MODE FR6/T11/§2.7 + ADVISOR-CONVERGENCE 指注）

**重启后待办（技术组——重启不变）**：
- [ ] **engineering.md:107/:295 A-裁定同类残留**（id:6/id:7 上报——:107 审计描述缺 "AND not reported"（建议修——prompt 同步批）；:295 父代理 Hard Rules 旧句（建议保留——非矛盾）——**待用户裁决**（见「engineering.md A-裁定同类残留」段）
- [ ] **verify L0 失效根因修复**（cwd 错位——已记根因——新设计点——设计→评审→实现）
- [ ] **审计范围引导（2026-09-04——用户观察"审计 explore 跑非常久"——量化结论：无现有数据可答（观测缺口）——用户裁定"别补可观测——调试完成就删"——只修引导）**——设计已落 AGENT-LOOP §18.13（quick 档 + 机械预算句——10 轮/超时报 PROBLEM）——**待评审→实现**——**登记于 TODO 而非需求池（技术 backlog——审计协议部——非用户需求点）**
- [ ] **§18.8/§18.10 复核**（AC-OA4——after 样本 = T 后首次干净外部评审——密度 ≤0.70×1.86=1.30 达成——未达呈报）
- [x] 既有 TODO **question 光标**——**已实现（2026-09-03/04——代码 layoutAnswer/key-modes.mjs + T-Q1..Q11 全绿 + T-C1/C2/C5 wizard format 步——D-Q1/D-C1/D-C2/D-S4 全部落地——本行从清单拿掉）**；其余既有 TODO 不变：read_pdf/AppendMessage name/500 行拆分/VS Code 4 项/thincoder-desktop 第三副本/镜像同步脚本

**重启生效范围**：designToken（b7db45cd——本批已消费完——无需重评审）；工作区 30+ 文件未 commit（本批 + R2 前批——交接记录已覆盖）。


## 需求池（2026-09-03 建——需求点攒批——登记 = 澄清 + 板块需求文档已更新 + 本组一行——设计启动权在用户——阈值：同板块≥2 或全局≥3 提醒——快车道：用户说"急"走单点不入池——生命周期：实现后行勾销 + 指向板块文档引用（评审 #7））

- [x] **R1**（2026-09-03 · 工程模式耗时优化——需求池攒批机制本身——用户裁定 C+E）——机制设计已落三 METHODOLOGY 载体（项目版/根模板/methodology-template 双端）——**评审三轮收敛 0🔴 通过（round3）+ token eb58941f 签发——实现批完成 2026-09-03：engineering.md 三分句逐字锚 + T-R1 断言 + ENGINEERING-MODE 变更段已落**——板块：方法论（实现记录 = ENGINEERING-MODE.md §7 2026-09-03 R1 条）

- [x] ~~**R2**（2026-09-04 · 工程模式验证链收口——用户裁定：①机械测试 = **D·父侧收口**；②LLM 验证 = **A·修正轮收紧**（3 次/链）；③修正轮粒度 = **L0**（相关测试秒级）；④审计 explore 效率 = **A1/A2/A3**（并入 R2）；⑤advisor code review = **B1 批并行（执行层）+ B2 范围收缩（提示词）**——B3 预算暂不动（20 轮保持，实测后再议）——用户批准 2026-09-04——双端实现 + fix round1 核销（CLI L2 1330/1330 + VS Code 1031/1031——实现记录见 ENGINEERING-MODE.md §7 2026-09-04 R2 条））~~

- [x] ~~**R3'**~~（2026-09-04 · bash 工具重定向护栏**删除**——用户裁定方向变更——**已实现（子代理 id:13 clean——L1 1360/1312/0 fail——设计 TOOLS.md §13——round2 复审 0🔴 token d6f6bd3a——父侧 L2 核销 2026-09-04 1360/1360）**）


