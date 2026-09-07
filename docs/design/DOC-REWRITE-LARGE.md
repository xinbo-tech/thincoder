# 批 A 大件重写规格（SESSION/TUI/ENGINEERING-MODE/ADVISOR-CONVERGENCE）

> 板块：结构债批 A 执行（DOC-REWRITE.md 的 4 大件规格承接——explore 大纲已产出，此处锚定供 eng-coder 任务书引用）。状态：**规格已备**（2026-09-07，explore id=10/11 通读产出）。
> 权威源：`DOC-REWRITE.md`（批判据/逐字保真规则/AC）+ 本文档（每文件照抄级要点）。

## 1. 总则

每文件重写为人类可读当前态（TOOLS.md 样板）：无 >300 字符单行、markdown 结构正确、活机制正文完整保留、历史流水折叠为「变更记录」一行注、被接管主题只留指针。**逐字契约/锚句整句照抄不得改措辞**（防博弈锚 + prompts 断言）。漂移点以现码/现行语义为准（大纲标注）。未决/开放项不得折叠。

## 2. ADVISOR-CONVERGENCE.md（评审收敛权威——写错影响评审行为）

- R1 轮次表：Round1 advisor-round1.md（代码）/advisor-design.md（设计）；Round2 验 prior 为主+新问题仅限 crashes/data loss/logic errors；Round3-5 严格只验 prior（"Do NOT look for new issues"）。
- R2 cap：MAX_ADVISOR_ROUNDS=5 仅代码；第 6 次机械终止不耗 LLM；空 _touchedFiles 检查在 cap 前；**design 豁免 cap 但计数照增**。
- R3 证据：Unfixed/New 须附 read 验证 file:line（"Line numbers alone are NOT evidence"）；host-verified 机械比对 `([\w./\\-]+\.\w+):(\d+):\s*(.+)`——未过校验不能支撑打回。
- R4 通过/阻断：无🔴通过；R7e 文档矛盾不卡 pass（机制级不一致除外）。
- R5 off-by-one：`_advisorRound`=已完成次数；=0→R1/=1→R2/≥2→R3；buildAdvisorSystemPrompt 用 +1。
- R6 评审失效：`_mutatedThisRun && !_calledAdvisorThisRun && hasCodeMutations && pushbacks<MAX && round<MAX`。
- R7 响应表：表头精确 `| # | Action | Detail |`；Action∈{Fixed, Not an issue(附证据), Deferred}；round2+ #=Orig#；禁 pre-existing。
- R8 §7 R24b 权威载体：受影响文件行数标注核查。
- 权威边界指针：同步=本文档；async=AGENT-LOOP §24；铁律=AGENT-LOOP §18.10（正交）；工程模式=ENGINEERING-MODE；§7↔METHODOLOGY F-R24b 指环消除（单向化：行为语义落本文档）。
- 折叠：2026-08-30 预算批、§8 实现流水、反转史。

## 3. SESSION.md（会话/存储权威——逐字契约最密）

- 存储：~/.thincoder/sessions/{sha1}.json.*；40 位完整 sha1；Windows 盘符大写；{hash}.json.N 槽 + manifest（active + 认领表）。
- **active = 共享当前指针（D-6 修订——本端恢复依据 = end marker `{manifest}.cli|.vscode`，非 active）**——旧"active 槽就是当前会话"句作废。
- 并发安全：sessionId=pid-timestamp-random；ensureActive 认领序（空闲→文件缺失空槽→开新）；死主清理须传 deletions 参数、不以文件缺失短路；isProcessAlive（Windows tasklist）；slot 粘性永不重跑 ensureActive；ACP sameProcessPinned 绝不 _slot=null；.corrupted/.unreadable/.bak 轮转；version>2 一律轮转；saveManifest 条目级合并。
- v2 双线：{version:2, cwd, title, history(人读), contextHistory(机读), ...}；pushReal 双写；机读只进 history；**transient** 人读线过滤+机读线保留；**slimForDisplay 瘦身**（tool_calls args 截 300、tool content 截 500、多模态丢 image base64、**contextHistory 一字不动**）。
- ts：真实消息 epoch ms（pushReal 打点）；旧消息不补 ts；发送层 stripLocalMessageFields。
- applySession：_fullHistory←history；agent.history←contextHistory（缺失才回退 history 播种——机读线从完整 history 重建膨胀 283%）；v1 回退剥离截断 args（`…` 结尾→{}）。
- /new 清 _slot/_sessionStart/_engDesignToken/_osReminderInjected/_lastEngState 等；**不清 autoApprove**。
- §10 end marker：`{manifest}.cli|.vscode` 内容 {slot, updatedAt}；文件缺失=从未记录（可继承一次）；**slot:null=显式置空（绝不继承）**——两态区分；resumeSlot 三支。
- read_history：查 _fullHistory；readonly；limit 默认 50 上限 200；depth-0 only；since/until inclusive；**消歧总纲尾段逐字照抄**（检索/记忆族选哪个——read_history/recent_changes/memory/doc_search/code_search/checkpoint 互不替代）。
- GC：.corrupted/.unreadable/.bak 30 天；孤儿 .tmp 7 天；冷 cwd 90 天；裸 v1 {hash}.json 在删除集。
- 标题契约：{ok:true}/{ok:false, reason:file-missing|parse-failure|mtime-conflict|invalid-slot}。
- 折叠：§7 整节/各节核销流水。
- 漂移：active 定义 D-6 新语义。

## 4. TUI.md（TUI 权威——定稿值密集）

- §1 模块地图按现文件结构回写（结构性快照纪律）。
- _kind 行语法：三生产者（live/restore/注入）都打 _kind 标记；新增生产者必须打（自查项）；**逐行对齐白名单**（done 行 `❯ name — done (耗时)` 为 live 独有，历史不存耗时——恢复管道无此行）。
- Ctrl+C 分支：picker 取消→武装窗口二按统一全停（suspAbortArmed 状态路由前统一检查）→processing 首按 abort+3s 武装→挂起两级→空闲双确认；Ctrl+I interruptPrompt 注入 [User interrupt:]。
- 渲染：帧序 header→对话→子 agent 面板→todo→输入→状态栏；对话行管道 highlightSearch→sanitize→math+markdown（先 math）→formatTables→wrap→折叠。
- sync/async 折叠头 `[▶ eng-coder#2 · async · …]`；⏹ 停止标记（running+SUBAGENT_ROLES+async，右缘内收一列）；R23 子块；waiting/queued 块。
- **折叠交互（定稿值）**：统一折叠=默认三行 tail 展开封顶 60%（floor(rows×0.6)）；主输出永不折叠（foldable=l.color!==C.text）；思考无条件折叠（阈值思路废弃）；连续 dim>8 折叠；工具摘要>12 折叠；**折叠无例外（_autoExpand 连根删除不得写回）**；_followTail 默认 true+锚定补偿；**cols 必传纪律**（renderFoldedHead/renderExpandedBlock/renderBlockTimeline 漏传=80 列分裂——窄屏教训）。
- 恢复：history 重建唯一路径（display 快照已废弃）；INITIAL_HISTORY_MESSAGES=200/PAGE=20；三层缓存（rebuild 5-8ms）。
- 回合：runAgentTurn 7 步；§17 挂起决策指针 AGENT-LOOP。
- 命令层：submodel 4 role 优先级链（工具 model 参数>类型级>全局>继承父）；shell chcp 65001 前缀；wizard Custom format 步；pickers 两级。
- 折叠：§10 全节 Issue 流水；§9 as-of。
- 漂移：display 快照废弃表述。

## 5. ENGINEERING-MODE.md（工程模式权威——锚句最多，逐字保真最高）

- 头部 2026-08-24 决策（铁律）：设计评审仅用户发起；打回后逐条呈递用户拍板；交付 code review 自动；guard 工程模式关闭。
- FR1-FR8/NFR1-NFR6 逐字保留（FR8 调度器口径现行：overlapping domains are queued by the scheduler, never hand-serialized 锚句；并发 ≤4）。
- 角色模型/主流程 10 步（R2 现行口径：LLM 3 次/链——③审计→④自修→⑤advisor首审→⑥自修→终审复评；修正轮默认不重跑）。
- 机械强制链：**只拦截不催促**；token 无签名（`uuid:expiresAt`，防伪层已删——**不得写 HMAC**）；isProductCode；design cap 豁免。
- 评审对象锚：documents + **object 必传** {type,target,status,reason,exclude}。
- **Token 生命周期 F1-F4（2026-09-07 定稿）**：链终 consume-design 消费；fix round 链中复用；stalled/L2 非 clean 不消费；多槽隔离；幂等。F3/F4 英文锚逐字。
- **凭证不落文档锚逐字**：`Credential values stay out of documents: never write token or designId VALUES into design docs…`。
- 提示词锚清单（逐字，各注双端落点）：零裁量（Task sizing is NOT your call…）/docs FIRST（Fix-round re-spawns are docs FIRST too…）/用户拍板≠批准（A user ruling on design content is requirements confirmation — NOT design approval…）/需求池三规则/链终消费/凭证不落文档。
- 信任模型：门禁豁免仅 docs/**+根级；src/ 全为产品码（含 prompts）；METHODOLOGY 缺失降级 D-M1/M2。
- §5 会话级：engineering/advisor.guard 会话级（slot 事实源>config 镜像>false）；双写。
- §7 变更记录折叠（但每条已硬约束的锚提炼进正文）。
- 漂移：HMAC 字样删、as-of 批记录勿当契约。

## 变更记录

- 2026-09-07：4 大件 explore 大纲（id=10/11）锚定成文。供最后一批 eng-coder 任务书引用。
