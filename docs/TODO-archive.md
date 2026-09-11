# 项目待办 · 归档（TODO Archive）

> 台账归档档（FR18——`requirements/ENGINEERING-MODE.md` §1.13 修订，2026-09-11）：**已核销 / 已废弃条目自 `docs/TODO.md` 移入本档**。
> 活文件只留未决；组计数 = 未决数。本档条目保留原指针与状态（历史可追溯）。

---

## 需求池（归档 15 条——含勾销 1）

- [x] **`settings` 工具对「内置默认值为 null 的已知键」类型校验失效**（用户"修这个bug"——快车道单点全链）→ 需求 `docs/requirements/SETTINGS-TOOL.md` §2 · 任务书 `batches/2026-09-11-SETTINGS-NULL-DEFAULT.md` §2 · （含 null 叶子键清单 4+1）· status=已核销
- [x] **批次档 = 任务书**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.12 · 任务书 `batches/2026-09-10-ENGINEERING-MODE.md` §2 · status=已核销
- [x] **批次档段写入工具（C）**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.16/FR22 · 任务书 `batches/2026-09-10-BATCH-SEGMENT-TOOL.md` §2 · （26 文件交付 · 324/324 全绿 · AC29–AC36/T43–T53 过）· status=已核销
- [x] **VSC 端镜像（FR23——第 5 批）**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.17/FR23 · 任务书 `batches/2026-09-10-VSC-MIRROR.md` §2 · （两面并行 · VSC 353 + CLI 341 全绿 · AC37–AC44/T54–T66 过）· status=已核销
- [x] **文档目录结构重组**（2026-09-10 用户裁定——设计已批准）→ 实施档 `docs/design/_archive/DOC-REORG.md` · （**已全部完成**：35 档入 `_archive/` · requirements 34 档 · L2 280/280 全绿；后续项见技术组）· status=已核销
- [x] **提示词公共层扩容**（2026-09-10 用户裁定——需求已收口）→ 需求 `docs/requirements/PROMPT-SYSTEM.md` §2.5 + §4（common.md 4 节 → 10 节）· 任务书 `batches/2026-09-11-COMMON-LAYER.md` §2 · （双面交付：CLI 18 档 + VSC 18 档；定向 56/56 + 54/54 · 快层 421/2（他链）+ 414/0 · T75 守恒 56=42+14）· status=已核销
- [x] **工程模式可移植性 FR10-FR15**（2026-09-10 用户裁定——含 FR11/FR12 活 bug）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §2 · 任务书 `batches/2026-09-11-PORTABILITY.md` §2 · （CLI 面交付：18 源含新档 3 + 6 提示词 + 4 新测试；定向 134/134 · 快层 449/2（他链）；两轮评审收敛）· status=已核销
- [x] **工程模式角色重定义**（2026-09-10 用户裁定——需求已收口）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.3 FR9 + §1.5 裁定清单 · 任务书 `batches/2026-09-11-ROLE-REDEFINITION.md` §2 · status=已核销（勾销——ROLE-REDEFINITION §6 全过 + AC61–AC66 过 + token 消费）
- [x] **VSC 端守卫收尾（F12 启动断言面 + 冻结窗口 E 对位 + 收敛路径信号面）**（2026-09-11 用户裁定「开」）→ 需求 `docs/requirements/ADVISOR-CONVERGENCE.md` §9（F24–F26/N16–N18）· 任务书 `batches/2026-09-11-VSC-GUARD-COMPLETION.md` §2 · （三面交付：6 文件 + 改 + 新测档 6 例 + 快层 414/413/0 · 修正轮 3+1 · §6 收口 + 令牌消费）· status=已核销
- [x] **模型清单 provider 化 + 去候选否决权**（2026-09-10 用户裁定——范围升格版）→ 任务书 `batches/2026-09-10-MODEL-SELECTION.md` §2 · （CLI 331 · VSC 358 全绿）· status=已核销
- [x] **DeepSeek V4.1-Flash 接入（两端 MODEL_SPECS + 预设）**（用户 03:10 验收）→ 任务书 `batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §2 · （CLI 5/5 · VSC 361/360 · AC-11..AC-17 过）· status=已核销

- [x] **测试生命周期与集成集（三层来源 + 收口处置 + 发布门）**（用户 2026-09-11「开」）→ 需求 `docs/requirements/TESTING.md` §2（F6–F14/N7–N9）· 任务书 `batches/2026-09-11-TEST-LIFECYCLE.md` §2 · （三面交付：CLI 建 22/22 · VSC 28/28 · CLI 扫① 9 退/3 并/T75–T76 防回潮锚；父侧 L2 `release:check` 561/562——唯一红为他链 T41①；令牌消费）· status=已核销

- [x] **FR18 需求池指针台账（POOL-LEDGER——两池收拢 + 机检）**（FR16/FR17/FR19 已核销——本行只指 FR18）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `batches/2026-09-11-POOL-LEDGER.md` §2 · （两仓收拢（活 30+9 / 归档 40+11）+ 归档档 ×2 + `scripts/check-ledger.mjs` 240 行（基线降报告）；父侧实跑 EXIT 0——0 新增 + 5 存量；令牌消费）· status=已核销
- [x] **需求池条目格式收拢**（2026-09-10 §1.13 规则定立——既有条目按指针格式收拢）→ 需求 `docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `batches/2026-09-11-POOL-LEDGER.md` §2 · （D3 组计数 / 指针解析 / 六态机检上线；归属修订「记录 + 状态推进 + 物理落笔 = 主 agent」同步）· status=已核销

- [x] **评审注入路径硬编码项目约定**（2026-09-10 用户裁定）→ 需求 `docs/requirements/ADVISOR-CONVERGENCE.md` §5.1 · 任务书 `batches/2026-09-11-PORTABILITY.md` §2（批次一 CLI + **批次二 VSC 镜像**）· （批次一：`messages.mjs` 注入面去硬编码；批次二：VP-1–11 + VP-12——`conventions.mjs`/`project-context.mjs` 新档 + 六档提示词 + T-V01–19；VSC 快层 511/502/0）· status=已核销

## 技术待办（归档 29 条——含勾销 1）

- [x] **`parseValue` 两端不一致 + CHANGELOG 历史失真（D-S2.8 / 父侧项）**：① CLI `settings` 保留引号 vs VSC 返回解析值（同 key 两端写入语义不同）② `CHANGELOG.md:42` 记「测试 T-S1.1-11」但测试档从未落地 → 证据 `src/agent-tools/settings.mjs:196`（去引号落地）· status=已核销（第 13 批条目 E——档 `batches/2026-09-11-MECH-DEBT-SWEEP.md`）
- [x] ~~**`docs/design/TUI.md` §1 地图行存量漂移**~~（第 7 批回写时观察）→ 证据 `docs/design/TUI.md:19`（§1 地图表）· status=已核销（第 14 批 id=13 全表实测回写——15 行改 + 表头口径注；`:25` 另有 pickers 行文字注）
- [x] **跨批依赖：T75 守恒锁计数（第 14 批 ↔ COMMON-LAYER ↔ 第 16 批）**：第 14 批 T75 锁 `53 = 42 + 11`；COMMON-LAYER 落 3 例 → `56 = 42 + 14`；**第 16 批落 2 例（AC61/AC64）→ `58 = 42 + 16`**——守恒值已同步（2026-09-11 §6 父侧核销）
- [x] **F16 同步面残留**（第 11 批 coder ⑤-1——父侧裁定转后续）：sync 记账无「未完成尾」判定 ⇒ 以截断尾收尾的 sync 代码评审仍计「已覆盖」；与需求 F16 行文字面有差（收录窄 vs 扩实现两路）→ 证据 `src/agent/record-results.mjs:117`（sync 记账门）· status=已核销（第 13 批条目 A 交付——T-SG1–6 绿）
- [x] **VSC 写面 `agent.subagentModels` 零约束残留**（第 8 批交付 ⑤-1——coder 提出）：`_SIBLING_SHAPES` 补第 4 条 = 设计变更（需设计 + 评审）→ 证据 `thincoder-vscode/src/agent-tools/settings.mjs:35`（`_SIBLING_SHAPES`）· status=已核销（第 12 批交付——T-S2.36/T-S2.37 绿）
- [x] **跨仓引用在 V1 恒判 unknown-doc**（第 10 批 §3:141 实证）：跨仓档「档名 + `.md` + 节号」写法 → 恒判 `unknown-doc`（如 VSC 仓 WEBVIEW 档；加仓前缀也无效）；即时处置 = 去 `.md` 后缀 + 仓别注记（写「名称（仓别）§N」）→ 证据 `docs/README.md:88`（§3.7 规范）· status=已核销（第 13 批条目 B——规范落 README；检查器零改）
- [x] **评审发现表宽度 vs 表格结构**（第 13 批条目 C——宽度规则豁免表格行）：单行 >300 与 markdown 表格行不可折行结构性冲突（as-of 实测 37 命中 = 表格行 24 + 非表格 13）→ 证据 `docs/README.md:88`（§3.7 双层豁免）· status=已核销（豁免落地：规范 + `isTableRow`；宽度 37→13、新增 0）
- [x] **`thincoder-vscode` 评审链守卫镜像**（第 11 批 VSC 对位面——designer 裁定 CLI 单端，父侧接受·可翻转）：VSC 三处同构（`citations.mjs` · `messages.mjs:62` · `run.mjs:58/166/170`）→ 证据 `thincoder-vscode/src/advisor/run.mjs:58` · status=已核销（第 12 批交付——AC-VG1–AC-VG8 全过 8/8）
- [x] **`src/advisor/messages.mjs`（413 行 >300 advisory）拆分债**：第 11 批设计 §14.10#4 登记——第 13 批裁定**不拆 + 拆分计划登记** → 证据 `docs/design/ENGINEERING-MODE.md:1090`（§2.26.3 D-1）· status=已核销（零改——412≤500；计划在档）
- [x] **评审实例作废窗口 = 到 digest 验证为止**（第 10 批 id=20 实证——父侧自重失误）：评审进程 done 后、digest 落定前改动被审文档 → 宿主判 stale、整轮实例作废（D5 冻结窗口下界）→ 证据 `src/agent-tools/advisor-settle.mjs:56`（stale 判定）· status=已核销（第 11 批条目 E——§14.14 + E-6 登记；11:23 实况首演坐实）
- [x] **`test/prompts-async-guidance.test.mjs`（CLI）562 行 >500 硬限——拆分项**（第 9 批 coder 提出；批前即 512–513 存量）→ 证据 `docs/design/ENGINEERING-MODE.md:1090`（§2.26.3 D-2）· status=已核销（第 13 批交付——562→418 + 新档 174；守恒 53 = 42 + 11）
- [x] **设计评审 600s 超时、零输出**（第 10 批首轮实证——评审成本白耗 + 链停摆）：无发现表 / 无 verdict / 无 token / 无可回收部分结果 → 证据 `docs/design/AGENT-LOOP.md:728`（§18 后台评审池——第 10 批设计）· status=已核销（第 11 批条目 D——硬墙/预算提示/结构化尾已交付）
- [x] **宿主 cite 校验对「无仓前缀路径」误报**（父侧两处实证：`docs/design/TOOLS.md:124` · `docs/design/AGENT-LOOP.md:714`——实文核验存在且正确）：疑校验器未按仓前缀补全候选 → 修复 = 候选链解析（按声明前缀 / 双仓试解）→ 证据 `docs/design/TOOLS.md:124`（误报样本）· status=已核销（第 11 批条目 C——候选链解析已交付）
- [x] **设计评审 context 溢出仍发 token**（第 8 批轮次 2 实证——123099 tokens，评审自报 incomplete 但宿主以 Approved 收尾）：口径建议 = 溢出即 changes-required / 缓发或标注 → 证据 `src/agent/record-results.mjs:114`（评审判定面）· status=已核销（第 11 批条目 A——判定族 + 三消费点已交付）
- [x] **设计评审 approval-signal 未注入**（第 7 批评审实证——VERDICT pass 但 token/designId 为未填占位符 ⇒ token 链断裂）：修正轮落地后重发取 token；机制面建议 = 启动器 approval-signal 注入路径守卫 → 证据 `src/agent-tools/design-token.mjs:75`（token 语义——失败复评不撤销）· status=已核销（第 11 批条目 B——构建自愈 + 启动断言已交付）
- [x] **「评审后修正轮 ⇄ 用户批准」时序未定义 + `Fixed` 语义漂移**（用户实况发现——第 6 批：修正轮在途时就请了批准）：链上补「修正轮落地并核验 → 才请批准」；`Fixed` 保「已落地」+ 新增 `Dispatched` → 证据 `src/prompts/discipline-engineering.md:135`（锚#3 修正轮 docs FIRST）· status=已核销（第 9 批交付——严格序；提示词 12 改 + 测试 4；用户 10:53 验收）
- [x] **eng-designer 角色 / 行为纪律批的 VSC 镜像**（**已销账——第 5 批 VSC-MIRROR 收口，VSC 实测全在位（setup.mjs:156/163 + spawn-gate:16-19 + discipline:28-30）**；原注：设计档：只改了 CLI——`thincoder` 仓；VSC 端无版型门禁 / batchDoc 门 / 新角色——需镜像时同步 `thincoder-vscode`）→ 证据 `docs/design/ENGINEERING-MODE.md:670`（§2.22 VSC 镜像设计面）· status=已核销
- [x] **提示词「内容权」口径三条裁定互相抵牾**（第 9 批评审范围外注记）→ 证据 `docs/requirements/ENGINEERING-MODE.md:126` · status=已核销（勾销——ROLE-REDEFINITION RF-2 / AC62 收口，§2.7 #13 已改述）
- [x] **🔵 五项不修登记（父侧知悉——已核查：裁定留痕在 git/批次档；如需设计档登记面另行迁移）**：VS sync design 轮次不递增 / VS guard cap 读全局轮 / CLI guard 文案无 async 补注 / VS depth-undefined 缺省 async / CLI T-24b1 墙钟断言 → 证据 `thincoder-vscode/src/agent-tools/subagent-async.mjs:375`（VSC 预算入口）· （已知不修，留档）
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
