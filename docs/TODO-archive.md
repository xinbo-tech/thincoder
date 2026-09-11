# 项目待办 · 归档（TODO Archive）

> 台账归档档（FR18——`requirements/ENGINEERING-MODE.md` §1.13 修订，2026-09-11）：**已核销 / 已废弃条目自 `docs/TODO.md` 移入本档**。
> 活文件只留未决；组计数 = 未决数。本档条目保留原指针与状态（历史可追溯）。

---

## 需求池（归档 18 条——含勾销 1；VSC 端条目已迁本仓 VSC 归档档）

- [x] **`settings` 工具对「内置默认值为 null 的已知键」类型校验失效**（用户"修这个bug"——快车道单点全链）→ 需求 `docs/requirements/SETTINGS-TOOL.md` §2 · 任务书 `batches/2026-09-11-SETTINGS-NULL-DEFAULT.md` §2 · （含 null 叶子键清单 4+1）· status=已核销
- [x] **批次档 = 任务书**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.12 · 任务书 `batches/2026-09-10-ENGINEERING-MODE.md` §2 · status=已核销
- [x] **批次档段写入工具（C）**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.16/FR22 · 任务书 `batches/2026-09-10-BATCH-SEGMENT-TOOL.md` §2 · （26 文件交付 · 324/324 全绿 · AC29–AC36/T43–T53 过）· status=已核销
- [x] **文档目录结构重组**（2026-09-10 用户裁定——设计已批准）→ 实施档 `docs/design/_archive/DOC-REORG.md` · （**已全部完成**：35 档入 `_archive/` · requirements 34 档 · L2 280/280 全绿；后续项见技术组）· status=已核销
- [x] **提示词公共层扩容**（2026-09-10 用户裁定——需求已收口）→ 需求 `docs/requirements/PROMPT-SYSTEM.md` §2.5 + §4（common.md 4 节 → 10 节）· 任务书 `batches/2026-09-11-COMMON-LAYER.md` §2 · （双面交付：CLI 18 档 + VSC 18 档；定向 56/56 + 54/54 · 快层 421/2（他链）+ 414/0 · T75 守恒 56=42+14）· status=已核销
- [x] **工程模式可移植性 FR10-FR15**（2026-09-10 用户裁定——含 FR11/FR12 活 bug）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §2 · 任务书 `batches/2026-09-11-PORTABILITY.md` §2 · （CLI 面交付：18 源含新档 3 + 6 提示词 + 4 新测试；定向 134/134 · 快层 449/2（他链）；两轮评审收敛）· status=已核销
- [x] **工程模式角色重定义**（2026-09-10 用户裁定——需求已收口）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.3 FR9 + §1.5 裁定清单 · 任务书 `batches/2026-09-11-ROLE-REDEFINITION.md` §2 · status=已核销（勾销——ROLE-REDEFINITION §6 全过 + AC61–AC66 过 + token 消费）
- [x] **模型清单 provider 化 + 去候选否决权**（2026-09-10 用户裁定——范围升格版）→ 任务书 `batches/2026-09-10-MODEL-SELECTION.md` §2 · （CLI 331 · VSC 358 全绿）· status=已核销
- [x] **DeepSeek V4.1-Flash 接入（两端 MODEL_SPECS + 预设）**（用户 03:10 验收）→ 任务书 `batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §2 · （CLI 5/5 · VSC 361/360 · AC-11..AC-17 过）· status=已核销

- [x] **测试生命周期与集成集（三层来源 + 收口处置 + 发布门）**（用户 2026-09-11「开」）→ 需求 `docs/requirements/TESTING.md` §2（F6–F14/N7–N9）· 任务书 `batches/2026-09-11-TEST-LIFECYCLE.md` §2 · （三面交付：CLI 建 22/22 · VSC 28/28 · CLI 扫① 9 退/3 并/T75–T76 防回潮锚；父侧 L2 `release:check` 561/562——唯一红为他链 T41①；令牌消费）· status=已核销

- [x] **FR18 需求池指针台账（POOL-LEDGER——两池收拢 + 机检）**（FR16/FR17/FR19 已核销——本行只指 FR18）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `batches/2026-09-11-POOL-LEDGER.md` §2 · （两仓收拢（活 30+9 / 归档 40+11）+ 归档档 ×2 + `scripts/check-ledger.mjs` 240 行（基线降报告）；父侧实跑 EXIT 0——0 新增 + 5 存量；令牌消费）· status=已核销
- [x] **需求池条目格式收拢**（2026-09-10 §1.13 规则定立——既有条目按指针格式收拢）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `batches/2026-09-11-POOL-LEDGER.md` §2 · （D3 组计数 / 指针解析 / 六态机检上线；归属修订「记录 + 状态推进 + 物理落笔 = 主 agent」同步）· status=已核销

- [x] **评审注入路径硬编码项目约定**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ADVISOR-CONVERGENCE.md` §5.1 · 任务书 `batches/2026-09-11-PORTABILITY.md` §2（**批次一 CLI**——`messages.mjs` 注入面去硬编码；批次二 VSC 镜像份已迁本仓 VSC 归档档）· status=已核销

- [x] **台账提醒/可见面（两池·分池显示）**（2026-09-12 用户发现「从未见过任何提醒」——裁定：启动提示 + 收口检查点 + 状态行单标记，两池分显·按项目分行·状态行极简·VSC tooltip 增量）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `batches/2026-09-12-LEDGER-SURFACE.md` §2 · （§6 收口——AC 全过 + 令牌消费）· status=已核销
- [x] **机制纪律落地提示词系统**（2026-09-11 用户裁定——测试体系 v3 三层/发布门/退役 + 旧句改写 + 待办台账维护机制）→ 需求 `docs/requirements/PROMPT-SYSTEM.md` §10 · 任务书 `batches/2026-09-11-TEST-DISCIPLINE-PROMPTS.md` §2 · （§6 收口——CLI 21/21 + VSC 12/12 · 机检 34/34 + 令牌消费）· status=已核销
- [x] **CLI TUI 长会话堆 OOM（静默崩溃）——次生：崩溃后鼠标序列飞出**（2026-09-11 用户同事实测）→ 需求 `docs/requirements/CRASH-REPORTS.md` §1（F3/N1-N4 取证波）· `docs/requirements/SESSION.md` §14.1（根因波）· 任务书 `batches/2026-09-11-TUI-OOM-FORENSICS.md` §2 + `batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §2 · （两波 §6 均收口 + 令牌消费）· status=已核销
- [x] **文档自审四处混乱**（2026-09-10 主 agent 自审——适用范围：文档维护也走流程）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.6 · 任务书（未派工）· status=已废弃（2026-09-12 用户裁定——诉求与本轮「各仓自持 + 提示词层承载」两批高度重叠，不再单独立批）

- [x] **散文锚测试退役（含双端提示词镜像锚；结构机检保留）**（2026-09-12 用户裁定）→ 需求 `docs/requirements/TESTING.md` §5（F15–F22 / N10–N12）· 任务书 `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md` §2 · （§6 收口 2026-09-12 06:37——CLI 快层 **647 → 576（−71 == 整删 71）** · 三环 = lint ✓ / 快层绿（1 项他链红）/ 全量 ✓ / 集成 PASS · **守恒锁同步 `SPLIT_CASES = { async: 14, dual: 4 }`** · 令牌消费）· status=已核销

## 技术待办（归档 55 条——含勾销 1；VSC 端条目已迁本仓 VSC 归档档）

- [x] **`parseValue` 两端不一致 + CHANGELOG 历史失真（D-S2.8 / 父侧项）**：① CLI `settings` 保留引号 vs VSC 返回解析值（同 key 两端写入语义不同）② `CHANGELOG.md:42` 记「测试 T-S1.1-11」但测试档从未落地 → 证据 `src/agent-tools/settings.mjs:196`（去引号落地）· status=已核销（第 13 批条目 E——档 `batches/2026-09-11-MECH-DEBT-SWEEP.md`）
- [x] ~~**`docs/design/TUI.md` §1 地图行存量漂移**~~（第 7 批回写时观察）→ 证据 `docs/design/TUI.md:19`（§1 地图表）· status=已核销（第 14 批 id=13 全表实测回写——15 行改 + 表头口径注；`:25` 另有 pickers 行文字注）
- [x] **跨批依赖：T75 守恒锁计数（第 14 批 ↔ COMMON-LAYER ↔ 第 16 批）**：第 14 批 T75 锁 `53 = 42 + 11`；COMMON-LAYER 落 3 例 → `56 = 42 + 14`；**第 16 批落 2 例（AC61/AC64）→ `58 = 42 + 16`**——守恒值已同步（2026-09-11 §6 父侧核销）
- [x] **F16 同步面残留**（第 11 批 coder ⑤-1——父侧裁定转后续）：sync 记账无「未完成尾」判定 ⇒ 以截断尾收尾的 sync 代码评审仍计「已覆盖」；与需求 F16 行文字面有差（收录窄 vs 扩实现两路）→ 证据 `src/agent/record-results.mjs:117`（sync 记账门）· status=已核销（第 13 批条目 A 交付——T-SG1–6 绿）
- [x] **跨仓引用在 V1 恒判 unknown-doc**（第 10 批 §3:141 实证）：跨仓档「档名 + `.md` + 节号」写法 → 恒判 `unknown-doc`（如 VSC 仓 WEBVIEW 档；加仓前缀也无效）；即时处置 = 去 `.md` 后缀 + 仓别注记（写「名称（仓别）§N」）→ 证据 `docs/README.md:88`（§3.7 规范）· status=已核销（第 13 批条目 B——规范落 README；检查器零改）
- [x] **评审发现表宽度 vs 表格结构**（第 13 批条目 C——宽度规则豁免表格行）：单行 >300 与 markdown 表格行不可折行结构性冲突（as-of 实测 37 命中 = 表格行 24 + 非表格 13）→ 证据 `docs/README.md:88`（§3.7 双层豁免）· status=已核销（豁免落地：规范 + `isTableRow`；宽度 37→13、新增 0）
- [x] **`src/advisor/messages.mjs`（413 行 >300 advisory）拆分债**：第 11 批设计 §14.10#4 登记——第 13 批裁定**不拆 + 拆分计划登记** → 证据 `docs/design/ENGINEERING-MODE.md:1090`（§2.26.3 D-1）· status=已核销（零改——412≤500；计划在档）
- [x] **评审实例作废窗口 = 到 digest 验证为止**（第 10 批 id=20 实证——父侧自重失误）：评审进程 done 后、digest 落定前改动被审文档 → 宿主判 stale、整轮实例作废（D5 冻结窗口下界）→ 证据 `src/agent-tools/advisor-settle.mjs:56`（stale 判定）· status=已核销（第 11 批条目 E——§14.14 + E-6 登记；11:23 实况首演坐实）
- [x] **`test/prompts-async-guidance.test.mjs`（CLI）562 行 >500 硬限——拆分项**（第 9 批 coder 提出；批前即 512–513 存量）→ 证据 `docs/design/ENGINEERING-MODE.md:1090`（§2.26.3 D-2）· status=已核销（第 13 批交付——562→418 + 新档 174；守恒 53 = 42 + 11）
- [x] **设计评审 600s 超时、零输出**（第 10 批首轮实证——评审成本白耗 + 链停摆）：无发现表 / 无 verdict / 无 token / 无可回收部分结果 → 证据 `docs/design/AGENT-LOOP.md:728`（§18 后台评审池——第 10 批设计）· status=已核销（第 11 批条目 D——硬墙/预算提示/结构化尾已交付）
- [x] **宿主 cite 校验对「无仓前缀路径」误报**（父侧两处实证：`docs/design/TOOLS.md:124` · `docs/design/AGENT-LOOP.md:714`——实文核验存在且正确）：疑校验器未按仓前缀补全候选 → 修复 = 候选链解析（按声明前缀 / 双仓试解）→ 证据 `docs/design/TOOLS.md:124`（误报样本）· status=已核销（第 11 批条目 C——候选链解析已交付）
- [x] **设计评审 context 溢出仍发 token**（第 8 批轮次 2 实证——123099 tokens，评审自报 incomplete 但宿主以 Approved 收尾）：口径建议 = 溢出即 changes-required / 缓发或标注 → 证据 `src/agent/record-results.mjs:114`（评审判定面）· status=已核销（第 11 批条目 A——判定族 + 三消费点已交付）
- [x] **设计评审 approval-signal 未注入**（第 7 批评审实证——VERDICT pass 但 token/designId 为未填占位符 ⇒ token 链断裂）：修正轮落地后重发取 token；机制面建议 = 启动器 approval-signal 注入路径守卫 → 证据 `src/agent-tools/design-token.mjs:75`（token 语义——失败复评不撤销）· status=已核销（第 11 批条目 B——构建自愈 + 启动断言已交付）
- [x] **「评审后修正轮 ⇄ 用户批准」时序未定义 + `Fixed` 语义漂移**（用户实况发现——第 6 批：修正轮在途时就请了批准）：链上补「修正轮落地并核验 → 才请批准」；`Fixed` 保「已落地」+ 新增 `Dispatched` → 证据 `src/prompts/discipline-engineering.md:135`（锚#3 修正轮 docs FIRST）· status=已核销（第 9 批交付——严格序；提示词 12 改 + 测试 4；用户 10:53 验收）
- [x] **提示词「内容权」口径三条裁定互相抵牾**（第 9 批评审范围外注记）→ 证据 `docs/requirements/ENGINEERING-MODE.md:126` · status=已核销（勾销——ROLE-REDEFINITION RF-2 / AC62 收口，§2.7 #13 已改述）
- [x] **🔵 五项不修登记（父侧知悉——已核查：裁定留痕在 git/批次档；如需设计档登记面另行迁移）**：**CLI 侧两项** = CLI guard 文案无 async 补注 / CLI T-24b1 墙钟断言（**VSC 侧三项**已迁本仓 VSC 归档档）· （已知不修，留档）
- [x] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（**已实落（key-handler.mjs:107-122 + AGENT-LOOP:506-507 同述）**；原注：回合 abort 无条件清池连坐杀后台——首按 = interrupt 不清池 + 3s 二按 = 清池）→ 证据 `src/tui/key-handler.mjs:80`（武装窗口）
- [x] **混合边环形等待残留**（**已实落（scheduler:171-190 D-SL2 停滞检测 + STALL_NOTE 接线）**；原注：dependsOn 边 + 文件域边混合链——建议停滞检测候选）→ 证据 `src/agent-tools/subagent-scheduler.mjs:171`（混合边环形等待停滞检测——D-SL2）
- [x] **check-doc-width 扫描域缺口**（**已废弃——用户 2026-09-11 裁定维持三域（T6 不采纳）**）（DOC-REORG 实施发现）：现域 = `docs/{design,requirements,batches}`（`scripts/check-doc-width.mjs:32`）——缺口 = `docs/TODO.md` / `docs/README.md`；DOC-REORG §10.3 提议新增批尾项 T6（域改 `docs`）→ **用户 2026-09-11 裁定：维持三域（T6 不采纳——台账类不纳入）** · status=已废弃
- [x] **子块「已省略 N 行」计数虚高**（2026-09-10 用户报告——主 agent 两轮实验实证：稳态显示 ≈ 真实隐藏行 ×2）→ 证据 `src/tui/subagent-children.mjs:28`（dropCarrierLines）· status=已核销（第 7 批 N6 修复交付——条件消解：用户裁「1 做了 2 就没意义了」）
- [x] **子代理内 spawn explore 的显示与其它工具不一致**（**已交付——第 7 批 SUBAGENT-TAIL（12:00 用户真机 smoke 过 + token 已消费）**；原注：用户报告 + 澄清："子代理中 eng-coder 中再调用 explore"）——口径 C：嵌套 explore 活动行直接进父块 tail → 证据 `src/tui/subagent-panel.mjs:66` · status=已核销
- [x] **subagent status touched 显示不准**（**已实落（subagent-actions:59-66/:254 实时读 `_touchedFiles`）**；原注：用户实证——已写入却显示"—（尚无改动）"）：修 = touched 从真实写入记录实时取 → 证据 `src/agent-tools/subagent-actions.mjs:59`（touchedSummary 实时读点）· status=已核销
- [x] **advisor 评审状态查询假空**（**已实落（ops.mjs:180-198 双载体真判据）**；原注：用户判定平台 bug——池实有跑者查询返空）：修 = status 聚合纳入 advisor 池真实条目 → 证据 `src/tools/ops.mjs:181`（双池汇总面）· status=已核销
- [x] **子代理 id 复用**（**已实落（nextSubagentId scheduler:370-391）**；原注：用户观察——平台 bug——§27.1 F4 修复洞）：真因 = `_subIdCounter` 挂 history expando、压缩随旧数组被抹 → 池空时 spawn 回 #1；已落地（2026-09-10——载体改 agent 本体 ±4 行/端；VSC clean；CLI 端在途）；遗留 = `src/agent-tools/subagent.mjs:293-294` 注释述旧前提 → 证据 `src/agent-tools/subagent-scheduler.mjs:380`（nextSubagentId）· status=已核销
- [x] **advisor 进行中评审不可取消**（**已实落（subagent.mjs:121 cancel + cancelAsyncAdvisor AGENT-LOOP:754）**；原注：用户反馈——平台 bug）：对象漂移需杀旧重发——无 cancel 通道（同 scope 重发被拒）→ 证据 `src/agent-tools/advisor-async.mjs:254`（"settle 后逐个发起"拒绝文案）· status=已核销
- [x] **AGENTS.md 文档地图陈旧**（**已销账——实测 VERIFY-DOCONLY/ENGINEERING-WORKLOOP 零命中；:14 明载不逐档裸列**）；原注：:17 仍列 VERIFY-DOCONLY.md（归档后悬空）+ 整体含早已归档档（ENGINEERING-WORKLOOP 等）——父侧立项整体清扫 → 证据 `AGENTS.md:17` · status=已核销

- [x] **`src/agent-tools/subagent.mjs` 受限变体 schema 补 cancel 词**（描述层同步）→ 证据 `src/agent-tools/subagent.mjs:142`（action enum）· status=已核销（第 20 批 TUI-SELECTION §5 A2 Done + §6 收口 · 令牌消费）
- [x] **普通模式偏差审计 + 会话上下文轮**（F-N1.1..6 逐条处置；D2 会话上下文轮退役）→ 任务书 `batches/2026-09-11-NORMAL-MODE-AUDIT.md` §2 · status=已核销（第 23 批 §6 收口——AC-NA1–NA8 8/8 + 令牌消费；原 status 取值「设计已落（待评审/批准）」非六态——随本次核销归一）
- [x] **`src/tools/read_image.md:8` 描述漂移**（第 6 批达成 vision 后描述与实现矛盾）→ 证据 `src/tools/read_image.md:8` · status=已核销（第 22 批 DOC-HYGIENE §5 C1 Done——替句已在位）
- [x] **快层慢门 flake：`test/eng-designer-role.test.mjs` 未标 `slow`**（818.5ms 撞 D-T6）→ 证据 `test/eng-designer-role.test.mjs` · status=已核销（第 20 批 TUI-SELECTION §5 A3 Done——`slow(` 已注册 · 令牌消费）
- [x] **需求档同步（第 4 批 C 遗留 ②——① 第 5 批已销账 · ③ 已作废）**（② 需求档 4 项同步——eng-designer 写域）→ 证据 `docs/design/ENGINEERING-MODE.md:454` · status=已核销（第 22 批 DOC-HYGIENE §5 C5 五点位已落 + §6 链终）
- [x] **子代理 abort 无来源标注——死亡不可诊断**（用户反馈——平台可观测性缺陷）→ 证据 `src/provider/core.mjs:70` · 任务书 `batches/2026-09-11-ABORT-PROVENANCE.md` §2 · status=已核销（第 24 批 §6 收口——AC-AP1–AP8 全绿 + 令牌消费）
- [x] **TUI 开放项**（① picker item.note 渲染 bug ② question/wizard/picker 三套选择 UI 统一）→ 证据 `src/tui/model-picker.mjs:109` · status=已核销（第 20 批 TUI-SELECTION §5 A1/A4 Done + §6 收口 · 令牌消费）
- [x] **digest 注入预算扩面**（consult 族——CLI 面）→ 任务书 `batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §2（群 B 批 §5 B5 双端 21 档含 consult 族 + §6 收口；**VSC 各族注入器份**已迁本仓 VSC 归档档）· status=已核销
- [x] **`.thincoder/index/` DB 化前死产物**（勘察外另立）→ status=已核销（第 22 批 DOC-HYGIENE §6 C6「三证齐后已删（GONE）」+ 父侧实测目录不存在）
- [x] **`src/tui/wrapped-spawn.mjs:1` 注释断链**（勘察外另立——指向已归档档）→ 证据 `src/tui/wrapped-spawn.mjs:1` · status=已核销（第 22 批 DOC-HYGIENE §5 C4 Done——归档路径串已去）

> 2026-09-12 用户裁定：**技术待办条目全部清空**（活档不再保留）——以下 22 条标已废弃入档（原状态随行注）。

- [x] **`src/tui/index.mjs` `startTUI` 单函数 400 行（L72–471）**——越函数档线（≥300 行）；单点增量不触拆分 → 拆分债 → 证据 `src/tui/index.mjs:72` · status=已废弃（原状态=待讨论）
- [x] **需求档 FR13 行「现况」子句陈旧**（句称 `src/prompts/discipline-engineering.md:182` 教跑 `scripts/check-doc-width.mjs`——实测 `src/prompts/**` 对 `scripts/`/`check-doc-width` 零命中）→ 证据 `docs/requirements/ENGINEERING-MODE.md:723` · status=已废弃（原状态=待讨论）
- [x] **`/undo` 快照栈字节无界**（条数封顶 50、无尺寸守卫）→ 证据 `src/tui/cmd-undo.mjs:12`（`MAX_UNDO`）· `src/agent/dispatch.mjs:357-358`（快照读整档）· status=已废弃（原状态=待讨论）
- [x] **`_advisorRuns` 实例无逐实例删除**（仅模式切换整体重置）→ 证据 `src/agent-tools/advisor-async.mjs:104-137` · status=已废弃（原状态=待讨论）
- [x] **小容器族无上界**（`_asyncTombstones`/`_turnControllers`/`_frozenSubKeys`/`expandedBlocks`；capturedConsole 拼接可突破 64K）→ 证据 `src/agent/async-settle.mjs:138-139` · `src/agent/dispatch.mjs:428-432` · status=已废弃（原状态=待讨论）
- [x] **`verify-redesign` T-V4 偶触 slow 门**（820–1031ms vs 800ms；干净 HEAD 复现/隔离跑 ~120ms）→ 证据 `test/verify-redesign.test.mjs:87` · status=已废弃（原状态=待讨论）
- [x] **跨会话同批档案并发写风险**（两会话父侧同写批次档；无会话级写权分片）→ 证据 `src/agent-tools/batch-segment.mjs:130` · status=已废弃（原状态=待讨论——用户 2026-09-11 曾裁定暂不开批）
- [x] **第 13 批收口遗留**（① T75/T76 无测试宿主 ② `test/settings.test.mjs` 480/500 ③ AC54 注行号 +1 ④ 存量非表格超宽 5 行）→ 证据 `docs/design/ENGINEERING-MODE.md:1406` · status=已废弃（原状态=在途（第 14 批））
- [x] **第 9 批后续登记面（设计 §13.9）**（① 设计档新时序规则登记面 ② 双源不对称是否补镜像）→ 证据 `src/prompts/discipline-engineering.md:135` · status=已废弃（原状态=在途（第 13 批条目 F））
- [x] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度（低优先）→ 证据 `docs/design/AGENT-LOOP.md:655` · status=已废弃（原状态=无 status）
- [x] **CLI 侧自用首验（batchDoc 门 + 新角色）**：需 CLI 会话内真 spawn 一次验证 → 证据 `src/agent-tools/subagent.mjs:151` · status=已废弃（原状态=待讨论）
- [x] **档位 B：subagent 工具 description 动态矩阵**（工具集变化时自动跟随）→ 证据 `src/agent-tools/subagent.mjs:114` · status=已废弃（原状态=无 status）
- [x] **既有文档超宽行清理**（设计档侧余 5 行：`docs/design/AGENT-LOOP.md` :510/:572/:574 · `SESSION.md` :524 · `SUBAGENT-ID-COUNTER-AGENT.md` :53）→ 证据 `batches/2026-09-11-SWEEP-FOLLOWUP.md` §2 · status=已废弃（原状态=在途（第 14 批））
- [x] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌 → 证据 `src/session.mjs:2`（slot-based 模型）· status=已废弃（原状态=无 status）
- [x] **deepseek-v4-pro 视觉能力复检 + 发布注记**（触发 = 2026-09-14 12:00 路由生效后 / V4.1 Pro 到货——复核 `multimodal` 翻转）→ 证据 `test/read-image-guide.test.mjs:20` · status=已废弃（原状态=触发=条件）
- [x] **advisor 池状态不可查询 + 不可取消**（用户反馈——平台机制缺陷，已实证三次）→ 证据 `src/tools/ops.mjs:195` · status=已废弃（原状态=待讨论（owner=平台））
- [x] **§24→§11 旧锚全仓清理**（CLI src 面 28 行已落（DOC-HYGIENE C2）；VSC 面另议）→ 证据 `src/tui/suspension-drive.mjs:30` · status=已废弃（原状态=待核销）
- [x] **RESIZE 交付建议**（恢复序列字面量三源 → `CLEANUP_REST` 常量收拢）→ 证据 `src/tui/tui-lifecycle.mjs:19`（writeCleanupSequence）· status=已废弃（原状态=待讨论）
- [x] **INPUT-LOCK-BEHAVIOR 交付注——CLI 侧项 ②**（key-handler busy 门禁注释措辞 + `:271` tab 死条件；① VSC §7 机制正文份已迁本仓 VSC 归档档）· status=已废弃（原状态=待讨论（① 已落；② 仍待））

---

### 产品可移植性缺陷登记（2026-09-10 全面勘察）——已废弃

> 2026-09-12 用户裁定：**技术待办及其块一并清空**（活档不再保留）。本块 = `src/` 全量“硬编码项目约定”扫描的存量债基线（按任意用户项目视角判定）——**逐条明细原样入档**。
> 需求依据 = `requirements/ENGINEERING-MODE.md` §2（FR10-FR15）+ `requirements/PROJECT.md`。分级：🔴 = 静默失效 · 🟡 = 降级可见/噪声 · 🔵 = 无害/仅信息。

#### 🔴 静默失效（10 项）

| # | file:line | 硬编码 | 不符约定时的静默后果 |
|---|---|---|---|
| P1 | `src/advisor/messages.mjs:253` | 文档地图 = `docs/README.md` / `docs/design/README.md` | 探不到 → 静默跳过——“文档归属”评审维度失去对照物 |
| P2 | `src/advisor/messages.mjs:236,349` | 项目方法论 = 项目根 `METHODOLOGY.md` | 不存在 → 空 catch 静默不注入，评审仍按“方法论合规”打分 |
| P3 | `src/advisor/messages.mjs:265,267,269` | 指令文本要求“Read METHODOLOGY.md” | 与 P2 独立——即使未注入也要求读不存在文件（白耗轮次/凭空判断） |
| P4 | `src/prompts/advisor-design.md:9,18,24` | `docs/README.md` + 示例 `docs/design/AGENT-LOOP.md:180` | 任意项目工程模式下被要求读不存在的文件 |
| P5 | `src/prompts/discipline-engineering.md:32,47,61` | `docs/design/<TOPIC>.md` 树形状 | 代理会在用户项目里创建 ThinCoder 形状的 docs 树 |
| P6 | `src/prompts/discipline-engineering.md:141,142,147,151,170,171` | `docs/TODO.md` / `CHANGELOG.md` / checklist 边界 | 用户项目没有这些文件也要“先入池” |
| P7 | `src/prompts/discipline-engineering.md:182` | `docs/requirements/`+`docs/design/`+**`node scripts/check-doc-width.mjs`** | **自指脚本**——该脚本只在本仓存在，用户项目跑必失败 |
| P8 | `src/memory/code-sync.mjs:112-124` | `git rev-parse --show-toplevel` 失败 → 返回 `[]` | **非 git 项目：代码/文档索引全空**（表现为“无索引源”） |
| P9 | `src/memory/schema.mjs:18,20,23-32` | 代码/文档扩展名白名单 + SKIP_DIRS + 体积上限 | 白名单外扩展名**完全不可检索**（.fs/.clj/.dart/.lua/.cs 等代码；.org/.wiki 等文档），无提示 |
| P10 | `src/agent/dispatch.mjs:199` + `src/advisor/repos.mjs:168` | `^src[\\/]` **字符串锚定** | 嵌套布局（`packages/foo/src/x.md`）被当文档 → **静默绕过设计门禁**；非 `src/` 布局则全部文件都当产品代码 |

#### 🟡 降级可见 / 噪声（18 项）

| # | file:line | 内容 | 影响 |
|---|---|---|---|
| P11 | `src/prompts/discipline-normal.md:13,32,213` | `docs/README.md` 地图（:32 有降级子句） | 13/213 无降级 |
| P12 | `src/prompts/persona-engineering.md:12` | “需求+设计文档（docs/）” | 提示层假设 |
| P13 | `src/agent-tools/advisor.mjs:104-114` | documents 校验限 `docs/` 前缀或文档扩展名 | 用 `.org/.wiki/.html/.tex` 记设计的项目被硬拒 |
| P14 | `src/tui/cmd-eng.mjs:31,35-46` | 工程模式门禁要求项目根 `METHODOLOGY.md`；“从模板创建”指向**已不存在**的 `methodology-template.md` | **自相矛盾 + 活 bug**——选项必炸；与本仓“METHODOLOGY 已退役”冲突 |
| P15 | `src/agent/dispatch.mjs:204`、`src/agent-tools/eng.mjs:59` | 提示文本写死 "in docs/" | 模型可见错误提示带本仓布局 |
| P16 | `src/advisor/messages.mjs:35-57` | 项目根判据 = 存在 `AGENTS.md`（唯一） | monorepo 子项目无 AGENTS.md → P1/P2 查错目录 |
| P17 | `src/agent/helpers.mjs:321-327` | 项目指令仅读 cwd 的 AGENTS.md / project_rules.md | 缺失时返回空、**无提示**；不向上走；不认 `.cursor/rules`/`CLAUDE.md` |
| P18 | `src/advisor/repos.mjs:22-41` 等 | 以 `.git` 判仓库根/评审范围/快照 | 非 git 项目范围采集为空 |
| P19 | `src/tui/clipboard.mjs:142` → `src/tools/file.mjs:192` | 粘贴图片落盘 `<cwd>/.thincoder-paste-<ts>.png` | 未读则该文件**留在用户仓库根**（污染） |
| P20 | `src/tools/repomap.mjs:138-145` | 只解析 JS/TS + Python 的 import/export | 其他语言静默缺依赖信息 |
| P21 | `src/tools/linter.mjs:43-46,119-128` | 语言→linter 表 | 表外语言“no linter available”（可见） |
| P22 | `src/tools/linter.mjs:61,92` | 配置只看**当前 cwd**（tsconfig.json / Cargo.toml） | monorepo 子包（配置在上级）→ 静默视为无 linter |
| P23 | `src/agent-tools/subagent-scheduler.mjs:52-54` | 父侧维护文件黑名单 = basename `todo.md`/`changelog.md`/`checklist*`（任意层级） | 用户项目恰有同名文件 → eng-coder **无法声明它**（fail-closed 可见） |
| P24 | `src/agent-tools/verify.mjs:38-58` | 项目根 = 含 package.json/.git 的最近祖先 | 无锚点 → 退化为松散全局匹配 |
| P25 | `src/advisor/repos.mjs:146` vs `src/agent-tools/advisor-async.mjs:170` | 同一条“src 是不变量”**两种正则**（组件匹配 vs 锚定） | 语义分叉 |
| P26 | `src/tools/shared.mjs:20` | `IGNORED_DIRS={node_modules,.git,dist,build,.turbo,coverage}` | 源码在 `build/`/`dist/` → 搜不到（文案有声明） |
| P27 | `src/tools/tree.mjs:13` | SKIP_DIRS 另含 `bin,obj` 等 | 源码在 `bin/`（Go/脚本项目）→ 树中消失 |
| P28 | `src/memory/code-sync.mjs:61,141,345` | 任意 `.` 开头路径段一律跳过 | 源码在 `.github/scripts/` 等 → **永不入索引** |

#### 🔵 无害 / 仅信息（7 项）

`cmd-init.mjs:12,24-58`（类型探测，双配置项目误判 Node）· `completion.mjs:81`+`verify.mjs:71,175,283`（措辞层）· `.thincoder/` 命名空间（产品自命名空间，非对用户项目的假设）· `~/.thincoder/` · `.mcp.json`（跨工具约定）· `verify.mjs:197-216`（JS node --check，advisory）· `helpers.mjs:264,271,286`（隐藏项有计数行）

#### 一致性债务（“整明白”时要一起裁的）

1. **`src/` 判据有 4 种实现**：`^src/` 锚定 `dispatch.mjs:199`+`repos.mjs:168` vs 组件匹配 `repos.mjs:146`+`advisor-async.mjs:170` vs 根锚定 `verify.mjs:38-58` vs 注释里的 `isProductCode`（**该函数不存在**，仅注释概念——`repos.mjs:151`、`verify.mjs:184`）
2. **“项目根”有两个互不相干的定义**：AGENTS.md 版（`messages.mjs:35`）vs package.json+.git 版（`verify.mjs:38`）
3. **文档/临时文件判定**：扩展名白名单（`repos.mjs:100,116`），不参考任何项目自述
4. **已有“让项目自己说”的先例**（改造样板）：`.thincoder/advisor.md`（有默认回退的覆盖）· advisor `documents=[…]` 参数（显式声明，但按次不持久）· verify 的自然语言验证法（**明确拒绝硬编码测试命令**——证明本产品既有设计取向）

#### 已核实“不受影响”（防重复勘察）

顶层 `README.md` 从不被读取 · **无任何代码执行用户项目的测试命令**（verify 明确不自跑）· 无构建/发布假设（`package.json` 仅读 ThinCoder 自身）· `test/` 目录假设零命中 · `.vscode/` 仅作端标识后缀 · `prepublishOnly` 用户侧零命中。
