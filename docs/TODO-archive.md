# 项目待办 · 归档（TODO Archive —— thincoder 合并仓）

> 台账归档档（FR18——形态权威 = `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.13）：**已核销 / 已废弃条目自同目录 `TODO.md` 移入本档**。
> 活文件只留未决；组计数 = 未决数。本档条目保留原指针与状态（历史可追溯）。
> **单仓单账（2026-09-13 台账单仓化）**：本档 = 合并仓唯一归档档——原两产品归档档（`thincoder/docs/TODO-archive.md` · `thincoder-vscode/docs/TODO-archive.md`）内容已原样并入（下两节按来源分段保留；路径为并入时点的原样字面）。

---

## 一、来源：原 CLI 归档档（`thincoder/docs/TODO-archive.md`——并入 2026-09-13）

## 需求池（归档 20 条——含勾销 1；VSC 端条目已迁本仓 VSC 归档档）

- [x] **`settings` 工具对「内置默认值为 null 的已知键」类型校验失效**（用户"修这个bug"——快车道单点全链）→ 需求 `thincoder-cli/docs/requirements/SETTINGS-TOOL.md` §2 · 任务书 `thincoder-cli/docs/batches/2026-09-11-SETTINGS-NULL-DEFAULT.md` §2 · （含 null 叶子键清单 4+1）· status=已核销
- [x] **批次档 = 任务书**（2026-09-10 用户裁定）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.12 · 任务书 `thincoder-cli/docs/batches/2026-09-10-ENGINEERING-MODE.md` §2 · status=已核销
- [x] **批次档段写入工具（C）**（2026-09-10 用户裁定）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.16/FR22 · 任务书 `thincoder-cli/docs/batches/2026-09-10-BATCH-SEGMENT-TOOL.md` §2 · （26 文件交付 · 324/324 全绿 · AC29–AC36/T43–T53 过）· status=已核销
- [x] **文档目录结构重组**（2026-09-10 用户裁定——设计已批准）→ 实施档 `thincoder-cli/docs/design/_archive/DOC-REORG.md` · （**已全部完成**：35 档入 `_archive/` · requirements 34 档 · L2 280/280 全绿；后续项见技术组）· status=已核销
- [x] **提示词公共层扩容**（2026-09-10 用户裁定——需求已收口）→ 需求 `thincoder-cli/docs/requirements/PROMPT-SYSTEM.md` §2.5 + §4（common.md 4 节 → 10 节）· 任务书 `thincoder-cli/docs/batches/2026-09-11-COMMON-LAYER.md` §2 · （双面交付：CLI 18 档 + VSC 18 档；定向 56/56 + 54/54 · 快层 421/2（他链）+ 414/0 · T75 守恒 56=42+14）· status=已核销
- [x] **工程模式可移植性 FR10-FR15**（2026-09-10 用户裁定——含 FR11/FR12 活 bug）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §2 · 任务书 `thincoder-cli/docs/batches/2026-09-11-PORTABILITY.md` §2 · （CLI 面交付：18 源含新档 3 + 6 提示词 + 4 新测试；定向 134/134 · 快层 449/2（他链）；两轮评审收敛）· status=已核销
- [x] **工程模式角色重定义**（2026-09-10 用户裁定——需求已收口）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.3 FR9 + §1.5 裁定清单 · 任务书 `thincoder-cli/docs/batches/2026-09-11-ROLE-REDEFINITION.md` §2 · status=已核销（勾销——ROLE-REDEFINITION §6 全过 + AC61–AC66 过 + token 消费）
- [x] **模型清单 provider 化 + 去候选否决权**（2026-09-10 用户裁定——范围升格版）→ 任务书 `thincoder-cli/docs/batches/2026-09-10-MODEL-SELECTION.md` §2 · （CLI 331 · VSC 358 全绿）· status=已核销
- [x] **DeepSeek V4.1-Flash 接入（两端 MODEL_SPECS + 预设）**（用户 03:10 验收）→ 任务书 `thincoder-cli/docs/batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §2 · （CLI 5/5 · VSC 361/360 · AC-11..AC-17 过）· status=已核销

- [x] **测试生命周期与集成集（三层来源 + 收口处置 + 发布门）**（用户 2026-09-11「开」）→ 需求 `thincoder-cli/docs/requirements/TESTING.md` §2（F6–F14/N7–N9）· 任务书 `thincoder-cli/docs/batches/2026-09-11-TEST-LIFECYCLE.md` §2 · （三面交付：CLI 建 22/22 · VSC 28/28 · CLI 扫① 9 退/3 并/T75–T76 防回潮锚；父侧 L2 `release:check` 561/562——唯一红为他链 T41①；令牌消费）· status=已核销

- [x] **FR18 需求池指针台账（POOL-LEDGER——两池收拢 + 机检）**（FR16/FR17/FR19 已核销——本行只指 FR18）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `thincoder-cli/docs/batches/2026-09-11-POOL-LEDGER.md` §2 · （两仓收拢（活 30+9 / 归档 40+11）+ 归档档 ×2 + `scripts/check-ledger.mjs` 240 行（基线降报告）；父侧实跑 EXIT 0——0 新增 + 5 存量；令牌消费）· status=已核销
- [x] **需求池条目格式收拢**（2026-09-10 §1.13 规则定立——既有条目按指针格式收拢）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `thincoder-cli/docs/batches/2026-09-11-POOL-LEDGER.md` §2 · （D3 组计数 / 指针解析 / 六态机检上线；归属修订「记录 + 状态推进 + 物理落笔 = 主 agent」同步）· status=已核销

- [x] **评审注入路径硬编码项目约定**（2026-09-10 用户裁定）→ 需求 `thincoder-cli/docs/requirements/ADVISOR-CONVERGENCE.md` §5.1 · 任务书 `thincoder-cli/docs/batches/2026-09-11-PORTABILITY.md` §2（**批次一 CLI**——`messages.mjs` 注入面去硬编码；批次二 VSC 镜像份已迁本仓 VSC 归档档）· status=已核销

- [x] **台账提醒/可见面（两池·分池显示）**（2026-09-12 用户发现「从未见过任何提醒」——裁定：启动提示 + 收口检查点 + 状态行单标记，两池分显·按项目分行·状态行极简·VSC tooltip 增量）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.13 · 任务书 `thincoder-cli/docs/batches/2026-09-12-LEDGER-SURFACE.md` §2 · （§6 收口——AC 全过 + 令牌消费）· status=已核销
- [x] **机制纪律落地提示词系统**（2026-09-11 用户裁定——测试体系 v3 三层/发布门/退役 + 旧句改写 + 待办台账维护机制）→ 需求 `thincoder-cli/docs/requirements/PROMPT-SYSTEM.md` §10 · 任务书 `thincoder-cli/docs/batches/2026-09-11-TEST-DISCIPLINE-PROMPTS.md` §2 · （§6 收口——CLI 21/21 + VSC 12/12 · 机检 34/34 + 令牌消费）· status=已核销
- [x] **CLI TUI 长会话堆 OOM（静默崩溃）——次生：崩溃后鼠标序列飞出**（2026-09-11 用户同事实测）→ 需求 `thincoder-cli/docs/requirements/CRASH-REPORTS.md` §1（F3/N1-N4 取证波）· `thincoder-cli/docs/requirements/SESSION.md` §14.1（根因波）· 任务书 `thincoder-cli/docs/batches/2026-09-11-TUI-OOM-FORENSICS.md` §2 + `thincoder-cli/docs/batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §2 · （两波 §6 均收口 + 令牌消费）· status=已核销
- [x] **文档自审四处混乱**（2026-09-10 主 agent 自审——适用范围：文档维护也走流程）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.6 · 任务书（未派工）· status=已废弃（2026-09-12 用户裁定——诉求与本轮「各仓自持 + 提示词层承载」两批高度重叠，不再单独立批）

- [x] **散文锚测试退役（含双端提示词镜像锚；结构机检保留）**（2026-09-12 用户裁定）→ 需求 `thincoder-cli/docs/requirements/TESTING.md` §5（F15–F22 / N10–N12）· 任务书 `thincoder-cli/docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md` §2 · （§6 收口 2026-09-12 06:37——CLI 快层 **647 → 576（−71 == 整删 71）** · 三环 = lint ✓ / 快层绿（1 项他链红）/ 全量 ✓ / 集成 PASS · **守恒锁同步 `SPLIT_CASES = { async: 14, dual: 4 }`** · 令牌消费）· status=已核销

- [x] **文档体系各仓自持：需求档 + 设计档 + 批次档 + 台账一律各仓记各仓，禁跨仓写需求与跨仓指针；缺的层补齐**（2026-09-12 用户裁定——含 04:21 R6 / 04:23 R7、10:57「全部啊！」、10:58「全部啊1」、11:06「残留即先例」、11:40「用先例破规则是模型骨子里的训练」）→ 需求 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.13/§1.19（**F11–F14 入规**）· 任务书 `thincoder-cli/docs/batches/2026-09-12-LEDGER-SELF-CONTAINED.md` §2 · （**收口 2026-09-12**：36 档对位逐行判定（① 0 遗留 · ③ 2 登记理由）· 跨仓工作内容面 **0**（V4 枚举外 0，反证可复现）· 先例作依据 **0**（74 档 / 275 处）· 最小改动类 **0**（31 档 / 54 处）· 存量阈值 **0**（两仓基线空 + fail-closed + 台账基线空）· 拆档守恒（`child-permission` 18=12+6 · `chat-panel` 17=8+9）· 文档↔实装漂移当晚清 250+ 处 · 全门禁全绿（CLI full 593/593 · VSC 608/608 · 集成 23/23+28/28 · V1–V4 0/0 · 台账 0））· status=已核销
- [x] **文档↔实装对账：全量清理 + 防回潮**（DOC-CODE-RECONCILE——2026-09-12 用户 22:54「可以啊，我希望完整的全面清理解决」+ 23:37「a 批准」· 端差选 A）→ 需求 本仓 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md` §1.20（FR26 · F1–F10 / N1–N5）+ §1.19（F15–F17）· 任务书 本仓 `thincoder-cli/docs/batches/2026-09-12-DOC-CODE-RECONCILE.md` §2 · （**收口 2026-09-13**：V5 装置（三锚 + 假阳十类 + 注记闭枚举 + 两态）· **清账 347 → 0** · 反查 `doc-impact` + 常驻 T-V5-15②（`test:full` 内 ⇒ 再出现即红）· **F20 派单与写域纪律 = 提示词两副本**（byte-identical + 与设计逐字 4/4 全等）· 语义巡检机制入设计 §2.32.5.3 · 门禁全绿（**full 611/611** · 集成 23/23 · V1–V4 0/0 · 台账 0 · **V5 悬空 0**）· 签入 `dd01ab6` 双远端）· status=已核销

## 技术待办（归档 55 条——含勾销 1；VSC 端条目已迁本仓 VSC 归档档）

- [x] **`parseValue` 两端不一致 + CHANGELOG 历史失真（D-S2.8 / 父侧项）**：① CLI `settings` 保留引号 vs VSC 返回解析值（同 key 两端写入语义不同）② `CHANGELOG.md:42` 记「测试 T-S1.1-11」但测试档从未落地 → 证据 `thincoder-core/agent-tools/settings.mjs:196`（去引号落地）· status=已核销（第 13 批条目 E——档 `thincoder-cli/docs/batches/2026-09-11-MECH-DEBT-SWEEP.md`）
- [x] ~~**`thincoder-cli/docs/design/TUI.md` §1 地图行存量漂移**~~（第 7 批回写时观察）→ 证据 `thincoder-cli/docs/design/TUI.md:19`（§1 地图表）· status=已核销（第 14 批 id=13 全表实测回写——15 行改 + 表头口径注；`:25` 另有 pickers 行文字注）
- [x] **跨批依赖：T75 守恒锁计数（第 14 批 ↔ COMMON-LAYER ↔ 第 16 批）**：第 14 批 T75 锁 `53 = 42 + 11`；COMMON-LAYER 落 3 例 → `56 = 42 + 14`；**第 16 批落 2 例（AC61/AC64）→ `58 = 42 + 16`**——守恒值已同步（2026-09-11 §6 父侧核销）
- [x] **F16 同步面残留**（第 11 批 coder ⑤-1——父侧裁定转后续）：sync 记账无「未完成尾」判定 ⇒ 以截断尾收尾的 sync 代码评审仍计「已覆盖」；与需求 F16 行文字面有差（收录窄 vs 扩实现两路）→ 证据 `thincoder-cli/src/agent/record-results.mjs:117`（sync 记账门）· status=已核销（第 13 批条目 A 交付——T-SG1–6 绿）
- [x] **跨仓引用在 V1 恒判 unknown-doc**（第 10 批 §3:141 实证）：跨仓档「档名 + `.md` + 节号」写法 → 恒判 `unknown-doc`（如 VSC 仓 WEBVIEW 档；加仓前缀也无效）；即时处置 = 去 `.md` 后缀 + 仓别注记（写「名称（仓别）§N」）→ 证据 `thincoder-cli/docs/README.md:88`（§3.7 规范）· status=已核销（第 13 批条目 B——规范落 README；检查器零改）
- [x] **评审发现表宽度 vs 表格结构**（第 13 批条目 C——宽度规则豁免表格行）：单行 >300 与 markdown 表格行不可折行结构性冲突（as-of 实测 37 命中 = 表格行 24 + 非表格 13）→ 证据 `thincoder-cli/docs/README.md:88`（§3.7 双层豁免）· status=已核销（豁免落地：规范 + `isTableRow`；宽度 37→13、新增 0）
- [x] **`thincoder-cli/src/advisor/messages.mjs`（413 行 >300 advisory）拆分债**：第 11 批设计 §14.10#4 登记——第 13 批裁定**不拆 + 拆分计划登记** → 证据 `thincoder-cli/docs/design/ENGINEERING-MODE.md:1090`（§2.26.3 D-1）· status=已核销（零改——412≤500；计划在档）
- [x] **评审实例作废窗口 = 到 digest 验证为止**（第 10 批 id=20 实证——父侧自重失误）：评审进程 done 后、digest 落定前改动被审文档 → 宿主判 stale、整轮实例作废（D5 冻结窗口下界）→ 证据 `thincoder-cli/src/agent-tools/advisor-settle.mjs:56`（stale 判定）· status=已核销（第 11 批条目 E——§14.14 + E-6 登记；11:23 实况首演坐实）
- [x] **`thincoder-cli/test/prompts-async-guidance.test.mjs`（CLI）562 行 >500 硬限——拆分项**（第 9 批 coder 提出；批前即 512–513 存量）→ 证据 `thincoder-cli/docs/design/ENGINEERING-MODE.md:1090`（§2.26.3 D-2）· status=已核销（第 13 批交付——562→418 + 新档 174；守恒 53 = 42 + 11）
- [x] **设计评审 600s 超时、零输出**（第 10 批首轮实证——评审成本白耗 + 链停摆）：无发现表 / 无 verdict / 无 token / 无可回收部分结果 → 证据 `thincoder-cli/docs/design/AGENT-LOOP.md:728`（§18 后台评审池——第 10 批设计）· status=已核销（第 11 批条目 D——硬墙/预算提示/结构化尾已交付）
- [x] **宿主 cite 校验对「无仓前缀路径」误报**（父侧两处实证：`thincoder-cli/docs/design/TOOLS.md:124` · `thincoder-cli/docs/design/AGENT-LOOP.md:714`——实文核验存在且正确）：疑校验器未按仓前缀补全候选 → 修复 = 候选链解析（按声明前缀 / 双仓试解）→ 证据 `thincoder-cli/docs/design/TOOLS.md:124`（误报样本）· status=已核销（第 11 批条目 C——候选链解析已交付）
- [x] **设计评审 context 溢出仍发 token**（第 8 批轮次 2 实证——123099 tokens，评审自报 incomplete 但宿主以 Approved 收尾）：口径建议 = 溢出即 changes-required / 缓发或标注 → 证据 `thincoder-cli/src/agent/record-results.mjs:114`（评审判定面）· status=已核销（第 11 批条目 A——判定族 + 三消费点已交付）
- [x] **设计评审 approval-signal 未注入**（第 7 批评审实证——VERDICT pass 但 token/designId 为未填占位符 ⇒ token 链断裂）：修正轮落地后重发取 token；机制面建议 = 启动器 approval-signal 注入路径守卫 → 证据 `thincoder-cli/src/agent-tools/design-token.mjs:75`（token 语义——失败复评不撤销）· status=已核销（第 11 批条目 B——构建自愈 + 启动断言已交付）
- [x] **「评审后修正轮 ⇄ 用户批准」时序未定义 + `Fixed` 语义漂移**（用户实况发现——第 6 批：修正轮在途时就请了批准）：链上补「修正轮落地并核验 → 才请批准」；`Fixed` 保「已落地」+ 新增 `Dispatched` → 证据 `thincoder-cli/src/prompts/discipline-engineering.md:135`（锚#3 修正轮 docs FIRST）· status=已核销（第 9 批交付——严格序；提示词 12 改 + 测试 4；用户 10:53 验收）
- [x] **提示词「内容权」口径三条裁定互相抵牾**（第 9 批评审范围外注记）→ 证据 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md:126` · status=已核销（勾销——ROLE-REDEFINITION RF-2 / AC62 收口，§2.7 #13 已改述）
- [x] **🔵 五项不修登记（父侧知悉——已核查：裁定留痕在 git/批次档；如需设计档登记面另行迁移）**：**CLI 侧两项** = CLI guard 文案无 async 补注 / CLI T-24b1 墙钟断言（**VSC 侧三项**已迁本仓 VSC 归档档）· （已知不修，留档）
- [x] **processing 态 Ctrl+C 武装化 + 回合 abort 与池解耦**（**已实落（key-handler.mjs:107-122 + AGENT-LOOP:506-507 同述）**；原注：回合 abort 无条件清池连坐杀后台——首按 = interrupt 不清池 + 3s 二按 = 清池）→ 证据 `thincoder-cli/src/tui/key-handler.mjs:80`（武装窗口）
- [x] **混合边环形等待残留**（**已实落（scheduler:171-190 D-SL2 停滞检测 + STALL_NOTE 接线）**；原注：dependsOn 边 + 文件域边混合链——建议停滞检测候选）→ 证据 `thincoder-core/agent-tools/subagent-scheduler.mjs:171`（混合边环形等待停滞检测——D-SL2）
- [x] **check-doc-width 扫描域缺口**（**已废弃——用户 2026-09-11 裁定维持三域（T6 不采纳）**）（DOC-REORG 实施发现）：现域 = `thincoder/docs/{design,requirements,batches}`（`scripts/check-doc-width.mjs:32`）——缺口 = `thincoder/docs/TODO.md` / `thincoder/docs/README.md`；DOC-REORG §10.3 提议新增批尾项 T6（域改 `docs`）→ **用户 2026-09-11 裁定：维持三域（T6 不采纳——台账类不纳入）** · status=已废弃
- [x] **子块「已省略 N 行」计数虚高**（2026-09-10 用户报告——主 agent 两轮实验实证：稳态显示 ≈ 真实隐藏行 ×2）→ 证据 `thincoder-cli/src/tui/subagent-children.mjs:28`（dropCarrierLines）· status=已核销（第 7 批 N6 修复交付——条件消解：用户裁「1 做了 2 就没意义了」）
- [x] **子代理内 spawn explore 的显示与其它工具不一致**（**已交付——第 7 批 SUBAGENT-TAIL（12:00 用户真机 smoke 过 + token 已消费）**；原注：用户报告 + 澄清："子代理中 eng-coder 中再调用 explore"）——口径 C：嵌套 explore 活动行直接进父块 tail → 证据 `thincoder-cli/src/tui/subagent-panel.mjs:66` · status=已核销
- [x] **subagent status touched 显示不准**（**已实落（subagent-actions:59-66/:254 实时读 `_touchedFiles`）**；原注：用户实证——已写入却显示"—（尚无改动）"）：修 = touched 从真实写入记录实时取 → 证据 `thincoder-core/agent-tools/subagent-actions.mjs:59`（touchedSummary 实时读点）· status=已核销
- [x] **advisor 评审状态查询假空**（**已实落（ops.mjs:180-198 双载体真判据）**；原注：用户判定平台 bug——池实有跑者查询返空）：修 = status 聚合纳入 advisor 池真实条目 → 证据 `thincoder-core/tools/ops.mjs:181`（双池汇总面）· status=已核销
- [x] **子代理 id 复用**（**已实落（nextSubagentId scheduler:370-391）**；原注：用户观察——平台 bug——§27.1 F4 修复洞）：真因 = `_subIdCounter` 挂 history expando、压缩随旧数组被抹 → 池空时 spawn 回 #1；已落地（2026-09-10——载体改 agent 本体 ±4 行/端；VSC clean；CLI 端在途）；遗留 = `thincoder-cli/src/agent-tools/subagent.mjs:293-294` 注释述旧前提 → 证据 `thincoder-core/agent-tools/subagent-scheduler.mjs:380`（nextSubagentId）· status=已核销
- [x] **advisor 进行中评审不可取消**（**已实落（subagent.mjs:121 cancel + cancelAsyncAdvisor AGENT-LOOP:754）**；原注：用户反馈——平台 bug）：对象漂移需杀旧重发——无 cancel 通道（同 scope 重发被拒）→ 证据 `thincoder-core/agent-tools/advisor-async.mjs:254`（"settle 后逐个发起"拒绝文案）· status=已核销
- [x] **AGENTS.md 文档地图陈旧**（**已销账——实测 VERIFY-DOCONLY/ENGINEERING-WORKLOOP 零命中；:14 明载不逐档裸列**）；原注：:17 仍列 VERIFY-DOCONLY.md（归档后悬空）+ 整体含早已归档档（ENGINEERING-WORKLOOP 等）——父侧立项整体清扫 → 证据 `AGENTS.md:17` · status=已核销

- [x] **`thincoder-cli/src/agent-tools/subagent.mjs` 受限变体 schema 补 cancel 词**（描述层同步）→ 证据 `thincoder-core/agent-tools/subagent.mjs:144`（action enum）· status=已核销（第 20 批 TUI-SELECTION §5 A2 Done + §6 收口 · 令牌消费）
- [x] **普通模式偏差审计 + 会话上下文轮**（F-N1.1..6 逐条处置；D2 会话上下文轮退役）→ 任务书 `thincoder-cli/docs/batches/2026-09-11-NORMAL-MODE-AUDIT.md` §2 · status=已核销（第 23 批 §6 收口——AC-NA1–NA8 8/8 + 令牌消费；原 status 取值「设计已落（待评审/批准）」非六态——随本次核销归一）
- [x] **`thincoder-cli/src/tools/read_image.md:8` 描述漂移**（第 6 批达成 vision 后描述与实现矛盾）→ 证据 `thincoder-cli/src/tools/read_image.md:8` · status=已核销（第 22 批 DOC-HYGIENE §5 C1 Done——替句已在位）
- [x] **快层慢门 flake：`thincoder-cli/test/eng-designer-role.test.mjs` 未标 `slow`**（818.5ms 撞 D-T6）→ 证据 `thincoder-cli/test/eng-designer-role.test.mjs` · status=已核销（第 20 批 TUI-SELECTION §5 A3 Done——`slow(` 已注册 · 令牌消费）
- [x] **需求档同步（第 4 批 C 遗留 ②——① 第 5 批已销账 · ③ 已作废）**（② 需求档 4 项同步——eng-designer 写域）→ 证据 `thincoder-cli/docs/design/ENGINEERING-MODE.md:454` · status=已核销（第 22 批 DOC-HYGIENE §5 C5 五点位已落 + §6 链终）
- [x] **子代理 abort 无来源标注——死亡不可诊断**（用户反馈——平台可观测性缺陷）→ 证据 `thincoder-core/provider/core.mjs:70` · 任务书 `thincoder-cli/docs/batches/2026-09-11-ABORT-PROVENANCE.md` §2 · status=已核销（第 24 批 §6 收口——AC-AP1–AP8 全绿 + 令牌消费）
- [x] **TUI 开放项**（① picker item.note 渲染 bug ② question/wizard/picker 三套选择 UI 统一）→ 证据 `thincoder-cli/src/tui/model-picker.mjs:109` · status=已核销（第 20 批 TUI-SELECTION §5 A1/A4 Done + §6 收口 · 令牌消费）
- [x] **digest 注入预算扩面**（consult 族——CLI 面）→ 任务书 `thincoder-cli/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §2（群 B 批 §5 B5 双端 21 档含 consult 族 + §6 收口；**VSC 各族注入器份**已迁本仓 VSC 归档档）· status=已核销
- [x] **`.thincoder/index/` DB 化前死产物**（勘察外另立）→ status=已核销（第 22 批 DOC-HYGIENE §6 C6「三证齐后已删（GONE）」+ 父侧实测目录不存在）
- [x] **`thincoder-cli/src/tui/wrapped-spawn.mjs:1` 注释断链**（勘察外另立——指向已归档档）→ 证据 `thincoder-cli/src/tui/wrapped-spawn.mjs:1` · status=已核销（第 22 批 DOC-HYGIENE §5 C4 Done——归档路径串已去）

> 2026-09-12 用户裁定：**技术待办条目全部清空**（活档不再保留）——以下 22 条标已废弃入档（原状态随行注）。

- [x] **`thincoder-cli/src/tui/index.mjs` `startTUI` 单函数 400 行（L72–471）**——越函数档线（≥300 行）；单点增量不触拆分 → 拆分债 → 证据 `thincoder-cli/src/tui/index.mjs:72` · status=已废弃（原状态=待讨论）
- [x] **需求档 FR13 行「现况」子句陈旧**（句称 `thincoder-cli/src/prompts/discipline-engineering.md:182` 教跑 `scripts/check-doc-width.mjs`——实测 `thincoder-cli/src/prompts/**` 对 `scripts/`/`check-doc-width` 零命中）→ 证据 `thincoder-cli/docs/requirements/ENGINEERING-MODE.md:723` · status=已废弃（原状态=待讨论）
- [x] **`/undo` 快照栈字节无界**（条数封顶 50、无尺寸守卫）→ 证据 `thincoder-cli/src/tui/cmd-undo.mjs:12`（`MAX_UNDO`）· `thincoder-cli/src/agent/dispatch.mjs:357-358`（快照读整档）· status=已废弃（原状态=待讨论）
- [x] **`_advisorRuns` 实例无逐实例删除**（仅模式切换整体重置）→ 证据 `thincoder-core/agent-tools/advisor-async.mjs:104-137` · status=已废弃（原状态=待讨论）
- [x] **小容器族无上界**（`_asyncTombstones`/`_turnControllers`/`_frozenSubKeys`/`expandedBlocks`；capturedConsole 拼接可突破 64K）→ 证据 `thincoder-core/agent-tools/async-settle.mjs:138-139` · `thincoder-cli/src/agent/dispatch.mjs:428-432` · status=已废弃（原状态=待讨论）
- [x] **`verify-redesign` T-V4 偶触 slow 门**（820–1031ms vs 800ms；干净 HEAD 复现/隔离跑 ~120ms）→ 证据 `thincoder-cli/test/verify-redesign.test.mjs:87` · status=已废弃（原状态=待讨论）
- [x] **跨会话同批档案并发写风险**（两会话父侧同写批次档；无会话级写权分片）→ 证据 `thincoder-core/agent-tools/batch-segment.mjs:130` · status=已废弃（原状态=待讨论——用户 2026-09-11 曾裁定暂不开批）
- [x] **第 13 批收口遗留**（① T75/T76 无测试宿主 ② `thincoder-cli/test/settings.test.mjs` 480/500 ③ AC54 注行号 +1 ④ 存量非表格超宽 5 行）→ 证据 `thincoder-cli/docs/design/ENGINEERING-MODE.md:1406` · status=已废弃（原状态=在途（第 14 批））
- [x] **第 9 批后续登记面（设计 §13.9）**（① 设计档新时序规则登记面 ② 双源不对称是否补镜像）→ 证据 `thincoder-cli/src/prompts/discipline-engineering.md:135` · status=已废弃（原状态=在途（第 13 批条目 F））
- [x] **AC-OA4 统计脚本（可选仓库工具）**：统计轨迹 JSON 评审信号密度（低优先）→ 证据 `thincoder-cli/docs/design/AGENT-LOOP.md:655` · status=已废弃（原状态=无 status）
- [x] **CLI 侧自用首验（batchDoc 门 + 新角色）**：需 CLI 会话内真 spawn 一次验证 → 证据 `thincoder-core/agent-tools/subagent.mjs:151` · status=已废弃（原状态=待讨论）
- [x] **档位 B：subagent 工具 description 动态矩阵**（工具集变化时自动跟随）→ 证据 `thincoder-core/agent-tools/subagent.mjs:114` · status=已废弃（原状态=无 status）
- [x] **既有文档超宽行清理**（设计档侧余 5 行：`thincoder-cli/docs/design/AGENT-LOOP.md` :510/:572/:574 · `SESSION.md` :524 · `SUBAGENT-ID-COUNTER-AGENT.md` :53）→ 证据 `thincoder-cli/docs/batches/2026-09-11-SWEEP-FOLLOWUP.md` §2 · status=已废弃（原状态=在途（第 14 批））
- [x] **session-state 诊断工具候选**：只读诊断命令 dump 当前 cwd 会话槽全貌 → 证据 `thincoder-core/session.mjs:2`（slot-based 模型）· status=已废弃（原状态=无 status）
- [x] **deepseek-v4-pro 视觉能力复检 + 发布注记**（触发 = 2026-09-14 12:00 路由生效后 / V4.1 Pro 到货——复核 `multimodal` 翻转）→ 证据 `thincoder-cli/test/read-image-guide.test.mjs:20` · status=已废弃（原状态=触发=条件）
- [x] **advisor 池状态不可查询 + 不可取消**（用户反馈——平台机制缺陷，已实证三次）→ 证据 `thincoder-core/tools/ops.mjs:195` · status=已废弃（原状态=待讨论（owner=平台））
- [x] **§24→§11 旧锚全仓清理**（CLI src 面 28 行已落（DOC-HYGIENE C2）；VSC 面另议）→ 证据 `thincoder-cli/src/tui/suspension-drive.mjs:30` · status=已废弃（原状态=待核销）
- [x] **RESIZE 交付建议**（恢复序列字面量三源 → `CLEANUP_REST` 常量收拢）→ 证据 `thincoder-cli/src/tui/tui-lifecycle.mjs:19`（writeCleanupSequence）· status=已废弃（原状态=待讨论）
- [x] **INPUT-LOCK-BEHAVIOR 交付注——CLI 侧项 ②**（key-handler busy 门禁注释措辞 + `:271` tab 死条件；① VSC §7 机制正文份已迁本仓 VSC 归档档）· status=已废弃（原状态=待讨论（① 已落；② 仍待））

---

### 产品可移植性缺陷登记（2026-09-10 全面勘察）——已废弃

> 2026-09-12 用户裁定：**技术待办及其块一并清空**（活档不再保留）。本块 = `thincoder-cli/src/` 全量“硬编码项目约定”扫描的存量债基线（按任意用户项目视角判定）——**逐条明细原样入档**。
> 需求依据 = `requirements/ENGINEERING-MODE.md` §2（FR10-FR15）+ `requirements/PROJECT.md`。分级：🔴 = 静默失效 · 🟡 = 降级可见/噪声 · 🔵 = 无害/仅信息。

#### 🔴 静默失效（10 项）

| # | file:line | 硬编码 | 不符约定时的静默后果 |
|---|---|---|---|
| P1 | `thincoder-cli/src/advisor/messages.mjs:253` | 文档地图 = `thincoder-cli/docs/README.md` / `thincoder-cli/docs/design/README.md` | 探不到 → 静默跳过——“文档归属”评审维度失去对照物 |
| P2 | `thincoder-cli/src/advisor/messages.mjs:236,349` | 项目方法论 = 项目根 `METHODOLOGY.md` | 不存在 → 空 catch 静默不注入，评审仍按“方法论合规”打分 |
| P3 | `thincoder-cli/src/advisor/messages.mjs:265,267,269` | 指令文本要求“Read METHODOLOGY.md” | 与 P2 独立——即使未注入也要求读不存在文件（白耗轮次/凭空判断） |
| P4 | `thincoder-cli/src/prompts/advisor-design.md:9,18,24` | `thincoder-cli/docs/README.md` + 示例 `thincoder-cli/docs/design/AGENT-LOOP.md:180` | 任意项目工程模式下被要求读不存在的文件 |
| P5 | `thincoder-cli/src/prompts/discipline-engineering.md:32,47,61` | `thincoder-cli/docs/design/<TOPIC>.md` 树形状 | 代理会在用户项目里创建 ThinCoder 形状的 docs 树 |
| P6 | `thincoder/src/prompts/discipline-engineering.md:141,142,147,151,170,171` | `thincoder/docs/TODO.md` / `CHANGELOG.md` / checklist 边界 | 用户项目没有这些文件也要“先入池” |
| P7 | `thincoder-cli/src/prompts/discipline-engineering.md:182` | `thincoder-cli/docs/requirements/`+`thincoder-cli/docs/design/`+**`node scripts/check-doc-width.mjs`** | **自指脚本**——该脚本只在本仓存在，用户项目跑必失败 |
| P8 | `thincoder-cli/src/memory/code-sync.mjs:112-124` | `git rev-parse --show-toplevel` 失败 → 返回 `[]` | **非 git 项目：代码/文档索引全空**（表现为“无索引源”） |
| P9 | `thincoder-cli/src/memory/schema.mjs:18,20,23-32` | 代码/文档扩展名白名单 + SKIP_DIRS + 体积上限 | 白名单外扩展名**完全不可检索**（.fs/.clj/.dart/.lua/.cs 等代码；.org/.wiki 等文档），无提示 |
| P10 | `thincoder-cli/src/agent/dispatch.mjs:199` + `thincoder-cli/src/advisor/repos.mjs:168` | `^src[\\/]` **字符串锚定** | 嵌套布局（`packages/foo/src/x.md`）被当文档 → **静默绕过设计门禁**；非 `thincoder-cli/src/` 布局则全部文件都当产品代码 |

#### 🟡 降级可见 / 噪声（18 项）

| # | file:line | 内容 | 影响 |
|---|---|---|---|
| P11 | `thincoder-cli/src/prompts/discipline-normal.md:13,32,213` | `thincoder-cli/docs/README.md` 地图（:32 有降级子句） | 13/213 无降级 |
| P12 | `thincoder-cli/src/prompts/persona-engineering.md:12` | “需求+设计文档（thincoder-cli/docs/）” | 提示层假设 |
| P13 | `thincoder-cli/src/agent-tools/advisor.mjs:104-114` | documents 校验限 `thincoder-cli/docs/` 前缀或文档扩展名 | 用 `.org/.wiki/.html/.tex` 记设计的项目被硬拒 |
| P14 | `thincoder-cli/src/tui/cmd-eng.mjs:31,35-46` | 工程模式门禁要求项目根 `METHODOLOGY.md`；“从模板创建”指向**已不存在**的 `methodology-template.md` | **自相矛盾 + 活 bug**——选项必炸；与本仓“METHODOLOGY 已退役”冲突 |
| P15 | `thincoder-cli/src/agent/dispatch.mjs:204`、`thincoder-cli/src/agent-tools/eng.mjs:59` | 提示文本写死 "in thincoder-cli/docs/" | 模型可见错误提示带本仓布局 |
| P16 | `thincoder-cli/src/advisor/messages.mjs:35-57` | 项目根判据 = 存在 `AGENTS.md`（唯一） | monorepo 子项目无 AGENTS.md → P1/P2 查错目录 |
| P17 | `thincoder-cli/src/agent/helpers.mjs:321-327` | 项目指令仅读 cwd 的 AGENTS.md / project_rules.md | 缺失时返回空、**无提示**；不向上走；不认 `.cursor/rules`/`CLAUDE.md` |
| P18 | `thincoder-cli/src/advisor/repos.mjs:22-41` 等 | 以 `.git` 判仓库根/评审范围/快照 | 非 git 项目范围采集为空 |
| P19 | `thincoder-cli/src/tui/clipboard.mjs:142` → `thincoder-cli/src/tools/file.mjs:192` | 粘贴图片落盘 `<cwd>/.thincoder-paste-<ts>.png` | 未读则该文件**留在用户仓库根**（污染） |
| P20 | `thincoder-cli/src/tools/repomap.mjs:138-145` | 只解析 JS/TS + Python 的 import/export | 其他语言静默缺依赖信息 |
| P21 | `thincoder-cli/src/tools/linter.mjs:43-46,119-128` | 语言→linter 表 | 表外语言“no linter available”（可见） |
| P22 | `thincoder-cli/src/tools/linter.mjs:61,92` | 配置只看**当前 cwd**（tsconfig.json / Cargo.toml） | monorepo 子包（配置在上级）→ 静默视为无 linter |
| P23 | `thincoder-cli/src/agent-tools/subagent-scheduler.mjs:52-54` | 父侧维护文件黑名单 = basename `todo.md`/`changelog.md`/`checklist*`（任意层级） | 用户项目恰有同名文件 → eng-coder **无法声明它**（fail-closed 可见） |
| P24 | `thincoder-cli/src/agent-tools/verify.mjs:38-58` | 项目根 = 含 thincoder-cli/package.json/.git 的最近祖先 | 无锚点 → 退化为松散全局匹配 |
| P25 | `thincoder-cli/src/advisor/repos.mjs:146` vs `thincoder-cli/src/agent-tools/advisor-async.mjs:170` | 同一条“src 是不变量”**两种正则**（组件匹配 vs 锚定） | 语义分叉 |
| P26 | `thincoder-cli/src/tools/shared.mjs:20` | `IGNORED_DIRS={node_modules,.git,dist,build,.turbo,coverage}` | 源码在 `build/`/`dist/` → 搜不到（文案有声明） |
| P27 | `thincoder-cli/src/tools/tree.mjs:13` | SKIP_DIRS 另含 `bin,obj` 等 | 源码在 `bin/`（Go/脚本项目）→ 树中消失 |
| P28 | `thincoder-cli/src/memory/code-sync.mjs:61,141,345` | 任意 `.` 开头路径段一律跳过 | 源码在 `.github/scripts/` 等 → **永不入索引** |

#### 🔵 无害 / 仅信息（7 项）

`cmd-init.mjs:12,24-58`（类型探测，双配置项目误判 Node）· `completion.mjs:81`+`verify.mjs:71,175,283`（措辞层）· `.thincoder/` 命名空间（产品自命名空间，非对用户项目的假设）· `~/.thincoder/` · `.mcp.json`（跨工具约定）· `verify.mjs:197-216`（JS node --check，advisory）· `helpers.mjs:264,271,286`（隐藏项有计数行）

#### 一致性债务（“整明白”时要一起裁的）

1. **`thincoder-cli/src/` 判据有 4 种实现**：`^thincoder-cli/src/` 锚定 `dispatch.mjs:199`+`repos.mjs:168` vs 组件匹配 `repos.mjs:146`+`advisor-async.mjs:170` vs 根锚定 `verify.mjs:38-58` vs 注释里的 `isProductCode`（**该函数不存在**，仅注释概念——`repos.mjs:151`、`verify.mjs:184`）
2. **“项目根”有两个互不相干的定义**：AGENTS.md 版（`messages.mjs:35`）vs thincoder-cli/package.json+.git 版（`verify.mjs:38`）
3. **文档/临时文件判定**：扩展名白名单（`repos.mjs:100,116`），不参考任何项目自述
4. **已有“让项目自己说”的先例**（改造样板）：`.thincoder/advisor.md`（有默认回退的覆盖）· advisor `documents=[…]` 参数（显式声明，但按次不持久）· verify 的自然语言验证法（**明确拒绝硬编码测试命令**——证明本产品既有设计取向）

#### 已核实“不受影响”（防重复勘察）

顶层 `README.md` 从不被读取 · **无任何代码执行用户项目的测试命令**（verify 明确不自跑）· 无构建/发布假设（`thincoder-cli/package.json` 仅读 ThinCoder 自身）· `thincoder-cli/test/` 目录假设零命中 · `.vscode/` 仅作端标识后缀 · `prepublishOnly` 用户侧零命中。

---

## 二、来源：原 VSC 归档档（`thincoder-vscode/docs/TODO-archive.md`——并入 2026-09-13）

## 需求池（归档 8 条）

- [x] **`eng(enter)` 加用户同意门**（2026-09-08 用户裁不处理——设计如此：模型自主翻转 + 持久化是设计意图；工程模式进出权在模型，无机械同意门）→ status=已废弃
- [x] **design token 签发后置 pending 需用户批准门**（2026-09-08 用户裁不处理——approval 保持 prompt 散文层；评审链人控点 = sign-off 流程本身）→ status=已废弃

- [x] **GitHub #6 async 子代理保真**（中止丢弃静默 / 孤儿报告丢失 / 终态误读）→ 需求 本仓 `thincoder-vscode/docs/requirements/AGENT-LOOP.md` §9（本仓需求档——2026-09-12 建档）· 任务书 本仓 `thincoder-vscode/docs/batches/2026-09-11-VSC-ASYNC-PARITY.md` §2 · 设计 本仓 `thincoder-vscode/docs/design/AGENT-LOOP.md` §12 · （§6 收口——AC-G1–G7 / AC-N1–N4 全绿 · 全量 477/477/0 + 令牌消费）· status=已核销
- [x] **VSC 活动区收口（R1–R6：清退+落流 / digest 可读性 / 待消化提示 / 块标题字段 / Send 按钮 / 状态行字段）**（2026-09-12 用户走查六发现）→ 需求 本仓 `thincoder-vscode/docs/requirements/AGENT-LOOP.md` §12（本仓需求档；修订）· 任务书 本仓 `thincoder-vscode/docs/batches/2026-09-12-VSC-ACTIVITY-CLOSURE.md` §2 · （§6 收口 2026-09-12 02:26——VSC 快层 624/609/1（唯一红为他链）· 令牌消费）· status=已核销
- [x] **VSC 子代理审批面对齐 CLI（child permission gate）**（2026-09-12 用户裁定 A——ask 弹卡带归属 / auto 继承静默）→ 需求 本仓 `thincoder-vscode/docs/requirements/AGENT-LOOP.md` §17（本仓需求档）· 任务书 本仓 `thincoder-vscode/docs/batches/2026-09-12-VSC-CHILD-PERMISSION.md` §2 · （§6 收口 2026-09-12 02:50——VSC 快层 643/627/2（两红均批外）· 令牌消费）· status=已核销

- [x] **散文锚测试退役（含双端提示词镜像锚；结构机检保留）**（2026-09-12 用户裁定「这种类型的测试都不要做」——判据：该类锚收益无实证、成本 ≈本仓 suite 50%、锚红后动作 = 把字改回去而非修缺陷；保留面 = 引用可解析 / 组计数 / 六态取值 / 行宽 / slow 门）→ 需求 本仓 `thincoder-vscode/docs/requirements/TESTING.md` §5（F15–F22 / N10–N12）· 任务书 本仓 `thincoder-vscode/docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md` §2 · （§6 收口 2026-09-12 06:37——VSC 快层 **653 → 592（−61 == 整删 61）** · 三环 = lint ✓ / 集成 28/28 ✓ / 全量 2 项批前既存红 · **本仓 `thincoder-vscode/docs/requirements/TESTING.md` 首建** · 令牌消费）· status=已核销

- [x] **文档体系各仓自持（本仓侧）：需求档 + 设计档 + 批次档 + 台账各仓记各仓，禁跨仓写需求与跨仓指针；本仓缺的层补齐；约束落提示词层**（2026-09-12 用户裁定——含 10:57「全部啊！」② 桶全部补建）→ 需求 本仓 `thincoder-vscode/docs/requirements/ENGINEERING-MODE.md` §1.3（**F11 · F12 · F13 · F14**）· 任务书 本仓 `thincoder-vscode/docs/batches/2026-09-12-LEDGER-SELF-CONTAINED.md` §2 · （**收口 2026-09-12**：**需求树 17 → 34 档**（① 0 遗留 · 17 档三层写法 + 判定句 + 本仓实测证据 file:line · 对位 E1 形态）· 跨仓形态 **0**（V4 枚举外 0）· 先例作依据 **0** · 最小改动类 **0** · 存量阈值 **0**（基线空 + fail-closed）· 拆档守恒（`child-permission` 18=12+6 · `chat-panel` 17=8+9；两档各 ≤500）· 文档↔实装漂移清 250+ 处 · 全门禁全绿（full 608/608 · 集成 28/28 · V1–V4 0/0 · 台账 0））· status=已核销
- [x] **文档↔实装对账：全量清理 + 防回潮（本仓侧）**（DOC-CODE-RECONCILE——2026-09-12 用户 22:54「可以啊，我希望完整的全面清理解决」+ 23:37「a 批准」· 端差选 A）→ 需求 本仓 `thincoder-vscode/docs/requirements/ENGINEERING-MODE.md` §1.3（F15–F20）/ §1.4（N6–N9）· 任务书 本仓 `thincoder-vscode/docs/batches/2026-09-12-DOC-CODE-RECONCILE.md` §2 · 设计 本仓 `thincoder-vscode/docs/design/DOC-CODE-RECONCILE.md` · （**收口 2026-09-13**：装置（`check-doc-anchors` + `reconcile-lookup` + 两测档）· **清账 323 → 0** → **外审抳出 🔴（A3 排除取反）修复后新显形 25 处 → 0** · 双向判别夹具 + 零值锁 · 端差 7 项（#9–#15）登记 · 门禁全绿（**full 627/627** · 集成 28/28 · V1–V4 0/0 · 台账 0 · **V5 悬空 0**）· 签入 `bc5be73` 双远端 · **遗留 = 用户 ④ 待裁（见技术待办）**）· status=已核销

## 技术待办（归档 33 条）

> 以下 13 条为 2026-09-12 **跨仓条目回位**（原 CLI 仓归档档——按「台账各仓自持」迁入本仓；9 条整迁 + 4 条拆分入本仓份）。

- [x] **VSC 端镜像（FR23——第 5 批）**（2026-09-10 用户裁定）→ 任务书 `thincoder-vscode/docs/batches/2026-09-10-VSC-MIRROR.md` §2 · （两面并行 · VSC 353 + CLI 341 全绿 · AC37–AC44/T54–T66 过）· status=已核销

- [x] **VSC 端守卫收尾（F12 启动断言面 + 冻结窗口 E 对位 + 收敛路径信号面）**（2026-09-11 用户裁定「开」）→ 任务书 `thincoder-vscode/docs/batches/2026-09-11-VSC-GUARD-COMPLETION.md` §2 · （三面交付：6 文件 + 改 + 新测档 6 例 + 快层 414/413/0 · 修正轮 3+1 · §6 收口 + 令牌消费）· status=已核销

- [x] **VSC 写面 `agent.subagentModels` 零约束残留**（第 8 批交付 ⑤-1——coder 提出）：`_SIBLING_SHAPES` 补第 4 条 = 设计变更 → 证据 `thincoder-core/agent-tools/settings.mjs:38`（`_SIBLING_SHAPES`；原 VSC 面已随 W16 迁核 · 2026-09-15）· status=已核销（第 12 批交付——T-S2.36/T-S2.37 绿）

- [x] **评审链守卫镜像**（第 11 批 VSC 对位面——designer 裁定 CLI 单端，父侧接受·可翻转）：三处同构（`thincoder-vscode/src/advisor/citations.mjs` · `thincoder-vscode/src/advisor/messages.mjs:62` · `thincoder-vscode/src/advisor/run.mjs:58/166/170`）→ 证据 `thincoder-vscode/src/advisor/run.mjs:58` · status=已核销（第 12 批交付——AC-VG1–AC-VG8 全过 8/8）

- [x] **eng-designer 角色 / 行为纪律批的 VSC 镜像**（已销账——第 5 批 VSC-MIRROR 收口，实测全在位（setup.mjs:156/163 + spawn-gate:16-19 + discipline:28-30））→ 证据 `thincoder-vscode/docs/design/ENGINEERING-MODE.md` §2.22（VSC 镜像设计面）· status=已核销

- [x] **VSC 两处未纳登记**（第 12 批 designer 披露）→ 证据 `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md`（§13.10 登记项 + 收口 §14）· 任务书 `thincoder-vscode/docs/batches/2026-09-11-VSC-GUARD-COMPLETION.md` §2 · status=已核销（第 18 批 §6 收口——三面交付 · AC-VG9–12 全过 · 令牌消费）

- [x] **live 块显示不可靠**（用户反馈——根因 ① 出生靠窗口 ② 快照兜底不全 ③ 终态对 never-born no-op）→ 证据 `thincoder-vscode/src/extension/panel-callbacks.mjs:81` · status=已废弃（原状态=待设计——修复方向待用户裁）

- [x] **IMAGE-DOWNGRADE 跟进项 ②③**（② runVisionReader maxTurns 固定 10 ③ Stop 在降级 await 窗口内 no-op）→ 证据 `thincoder-vscode/src/extension/image-handler.mjs:65` · status=已废弃（原状态=设计权在用户）

- [x] **git 工具 commit 镜像缺口**（granular add + 整索引 commit 双层混扫）→ 证据 `thincoder-vscode/src/tools/git.mjs:200` · status=已废弃（原状态=待讨论（设计权在用户））

- [x] **评审注入路径硬编码项目约定——VSC 镜像份**（原 CLI 归档拆分迁入）→ 任务书 `thincoder-vscode/docs/batches/2026-09-11-PORTABILITY-VSC-MIRROR.md` §2（批次二：VP-1–11 + VP-12——`conventions.mjs`/`project-context.mjs` 新档 + 六档提示词 + T-V01–19；VSC 快层 511/502/0）· status=已核销

- [x] **🔵 五项不修登记——VSC 侧三项**（原 CLI 归档拆分迁入；父侧知悉，裁定留痕在 git/批次档）：sync design 轮次不递增 / guard cap 读全局轮 / depth-undefined 缺省 async → 证据 `thincoder-vscode/src/agent-tools/subagent-async.mjs:375`（VSC 预算入口）· （已知不修，留档）

- [x] **digest 注入预算扩面——VSC 各族注入器绕过**（原 CLI 归档拆分迁入）→ 证据 `thincoder-vscode/src/agent-tools/async-settle.mjs:54` · 任务书 `thincoder-vscode/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §2 · status=已核销（群 B 批 §5 B5 双端 21 档含 consult 族 + §6 收口）

- [x] **INPUT-LOCK-BEHAVIOR 交付注——VSC 侧项 ①**（§7 机制正文补同步；原 CLI 归档拆分迁入）→ 证据 `thincoder-vscode/docs/design/AGENT-LOOP.md:290` · status=已废弃（原状态=待讨论（① 已落））

- [x] **收紧拒绝文案**——2026-09-08 核销（src+prompts grep "解锁" 0 命中——现拒绝文案均单行通用——前提已消失）→ 证据 `thincoder-vscode/src/agent-tools/eng.mjs:1`（工程模式求值/门禁面）· status=已核销
- [x] **模块图补录**（**已达成（AGENTS.md:56-61 + ARCHITECTURE.md:119 全表）**）：`thincoder-vscode/src/extension/panel-chat.mjs` / `thincoder-vscode/webview/streaming.js` / `thincoder-vscode/webview/panels.js` / `thincoder-vscode/webview/state.js` 未入 AGENTS.md 模块图与 ARCHITECTURE——既有漂移 → 证据 `thincoder-vscode/docs/design/ARCHITECTURE.md:92`（§3 模块地图）
- [x] **VSC agent/setup.mjs 500 行整**——2026-09-08 核销（agent-state.mjs 三函数已建——setup.mjs 拆后 422 行，核销时实测）→ 证据 `thincoder-vscode/src/agent/agent-state.mjs:1`（拆分产物）· status=已核销
- [x] **GitHub #1 embedding 三件套、IK9IXD 公式渲染、IK9UWM 中文粘贴**（bug 修复/关闭状态需核）→ 证据 `thincoder-vscode/src/embedding.mjs:1`（embedding 面——其余两条为外部 Issue）· **已核销（2026-09-11 live 巡检：三条均不在 open 列表——已修复/已关）**
- [x] **Gitee open 巡检（2026-09-11 live——13 条）triage 完成**（用户 13:36「都可以」）——**已开批 7 条**：
      #IKEV9I+#IKEV9H（ACP 修整·第 27 批）· #IKEZ1C+#IKALHO离线面（输入面·第 28 批）· #IKETT1（`~` 展开·第 29 批）·
      #IKD5XY（Stop 钩子·第 30 批·裁定：`Stop`/每回合/仅主会话）· #IKC6IX（方向键·第 31 批·裁定：多行竖移/单行历史）·
      #IKDWH7铺开（headers 全通路·第 32 批）· #IKDCVV②④（护栏+attention·第 33 批）——批档均在 CLI 仓（历史 triage 记录——本仓无对应接收面）；
      **已修可关** = #IKE85W（ISSUE-FIX-BATCH F-1·待发版核销）· #IKCDMR（sanitizeConsultModels）——**已关闭 + 回复**（父侧 2026-09-11 代处理：GITEE_TOKEN 环境令牌可用）；
      **待外部回复** = #IKEI3M（已评：索端点文档）· #IKDWH7（已评：索网关响应体）· #IKALHO（已评：索 mac 环境）· #IKEOO0（已评：索现场数据）· #IKDCVV（已评：索提示原文）；
      **待现场数据** = #IKEOO0（崩溃日志/槽体积/贴图占比 → 后开设计批）· status=已核销（triage 完成）
- [x] **indexer 系列修复补 changelog 条目**——2026-09-08 核销（`CHANGELOG.md:309`「语义索引系列修复」条目——mtime 重建/git 漂移/空 chunk/manifest-only/multi-root/memory 接线等——与修复面吻合）→ 证据 `CHANGELOG.md:309` · status=已核销
- [x] **glob 方言缺口 / indexer 拆分 / 方向决策 A/B / ui.test 拆分 / slow-gate 归册**——2026-09-08 核查已勾销（search.mjs 已实现 brace 展开/!排除/扩展报错（不再静默）；indexer 拆分已完成（index-discover.mjs 独立）；快路径方案已定型实现（commit 预筛 + dirty 集 + mtime 兜底 + memory 目录特判）；测试 >500 债随测试全删消解）→ 证据 `thincoder-vscode/src/index-discover.mjs:12`（拆分产物）· status=已核销
- [x] **eng-coder 标题栏末尾总显示 thinking**——2026-09-08 核销（activity.js:150-154 stateWord CLI currentTool parity + :262-274 chunk 级 think→thinking/tool→行尾 state word + chat.js:138-139/status-bar.js:31 `_currentTool` 实时清/置——固定 thinking 误导已消除）→ 证据 `thincoder-vscode/webview/activity.js:150`（状态词分支）· status=已核销
- [x] **system.md:24 env-state 描述未含 slot**（**已销账（双端 discipline-normal 明写 slot；system.md 双端已不存在）**；原注：SESSION §11.2 实现后漂移——双端逐字同步——与 CLI TODO 同项）→ 证据 `thincoder-vscode/src/agent/setup-reminders.mjs:27`（env-state 注入面）

- [x] **git 快路径 gitignore 盲区（窄化版）**（gitignored 的非 memory 可索引文件增删改不触发重建 → 索引静默过期）→ 证据 `thincoder-vscode/src/indexer.mjs`（dirty 集检查点）· status=已核销（第 21 批 VSC-INDEX-PERCEPTION §5 B2 Done + §6 收口——B1–B6 全过 · 令牌消费）
- [x] **`listMemoryFiles` 只看 `.thincoder/memory/` 顶层 vs `discoverFiles` 递归**（嵌套 memory 反复判 file-removed 死循环）→ 证据 `thincoder-vscode/src/index-discover.mjs` · status=已核销（同批 §5 B3 Done——单一 walk 同源）
- [x] **reason 串失配**（`file-changed` vs `file-changes`，另 added/removed/missing 未统一）→ 证据 `thincoder-vscode/src/indexer.mjs` · status=已核销（同批 §5 B4 Done——统一 `file-changed`，旧串零残留）
- [x] **`loadIndex` / `searchIndex` 不校验 `vector_dim === decode.dim` 与 `embed_model`**（切换模型静默全 0 得分）→ 证据 `thincoder-vscode/src/indexer.mjs` · status=已核销（同批 §5 B1 Done——头一致性 + 双闸）
- [x] **config.json FileSystemWatcher**（外部写盘后扩展端实时感知）→ 证据 `thincoder-vscode/src/extension/chat-panel.mjs:316` · status=已核销（同批 §5 B5 Done——新档 `thincoder-vscode/src/extension/config-watch.mjs`）

> 2026-09-12 用户裁定：**技术待办条目全部清空**（活档不再保留）——以下 5 条标已废弃入档。

- [x] **`thincoder-vscode/src/extension/panel-messages.mjs` 499 行（距 500 硬限 1 行）**——下批触碰前先核余量/先拆 → 证据 `thincoder-vscode/src/extension/panel-messages.mjs:1` · status=已废弃（原状态=待讨论）
- [x] **`thincoder-vscode/src/extension/panel-messages.mjs` `handlePanelMessage` 单函数 378 行（L107–484）**——越函数档线（≥300 行）→ 拆分债 → 证据 `thincoder-vscode/src/extension/panel-messages.mjs:107` · status=已废弃（原状态=待讨论）
- [x] **发布排期（VSC 0.8.11）——用户 2026-09-11 17:16 裁定挂起等指示**：webview 转义 #7 / async 保真 #6 / 输入面 / 死键等修复仍在工作树；流程 = 备包（版本号 + CHANGELOG + 构建 vsix）→ 用户测试 → 发布 → 证据 `thincoder-vscode/docs/design/RELEASE.md` · status=已废弃（原状态=待讨论（挂起））
- [x] **VSC 文档补 NFR 小节**（design round2 提示词 · ARCHITECTURE 补 NFR · 原则 2 改述 · PROVIDER_PRESETS 静态镜像说明 · 模块小节补 memory/repomap/specs/extension/prompts · §6§3§4 补懒历史·双通道·Ctrl+I·readSSE · runAgent 签名 input→text · §4 补 thinkEnabledValue·noUsageStream · advisor 工具补 lsp）→ 证据 `thincoder-vscode/docs/design/ARCHITECTURE.md:34`（§1）· status=已废弃（原状态=无 status）
- [x] **qwen 请求 thinking 未设置时携带 `thinking:{type:"enabled"}`**（智谱式参数，GLM 修复引入的通用 spec 默认注入；百炼兼容性属 Qwen `enable_thinking` 范畴——知悉观察）→ 证据 `thincoder-core/provider/core.mjs:193`（原 VSC 面已随 W10 迁核 · 2026-09-15）· status=已废弃（原状态=无 status）
- [x] **对端仓不可达口径待裁（用户 ④）**（DOC-CODE-RECONCILE · 2026-09-13）→ 用户 07:52 裁定 **B′**（域外标记、不阻断）· 链路 = 设计改（#99）+ 评审 #101 pass + 修正轮 #102 + 实施轮 #103 · 实证（真仓）= 缺仓 ⇒ 域外 37 条 + exit 0 ✓ · 自指（含异体大小写 d:\…\THINCODER-VSCODE）⇒ exit 1 ✓ · 自指判定盘符大小写 bug 已于实施轮发现并修正 · 发布门 `--strict` 已接线（`thincoder-vscode/package.json:123`）· 两端口径自此一致（对端 CLI 已注销其 §2.32.8 端差条）· status=已核销

---

## 三、单仓化时归档（2026-09-13 台账单仓化）

- [x] **VSC 检查器 412 行 > 300 软线**（DOC-CODE-RECONCILE 实施轮后实测 · 2026-09-13）——**已核销（载体退役）**：其载体 `thincoder-vscode/scripts/check-doc-anchors.mjs` 于批 2（S4）随六档产品脚本一并退役（`thincoder-cli/docs/design/TWO-REPO-MERGE.md` §2.14）；统一版脚本的行数面改按该档 §2.14「统一脚本行数预估与拆分计划」注复核，现测 `scripts/check-doc-width.mjs` 374 · `scripts/check-ledger.mjs` 384 · `scripts/doc-anchors-core.mjs` 353 · `scripts/doc-anchors.mjs` 326——**均超 300 软线、未达该注「各文件目标 ≤300 行」**（拆分补做归批 2 收尾轮）· status=已核销（原状态=待核销）

---

## 四、单仓化后核销（2026-09-13 起）

- [x] **两仓合并招牌数字不可复现（102 / 12 / 0.24）**（2026-09-13 成果盘点暴露：档内引作实测依据，但口径未写明、脚本未入库）——**已核销**：① 度量脚本入库 = `scripts/mirror-divergence.mjs`（171 行；口径逐字写于档头：同路径成对 / 去首尾空白 + 丢空行后**行集合 Jaccard** / 另报 sha256 逐字节）；② 档内数字收正 = 需求档 §1 改写为可复现形态（口径 + 实测值 + 复现命令），设计档 §2.2.1 / §2.13 两处衍生引用同步改指；旧值仅存于两档变更记录（「不可复现 → 已由实测值取代」留痕）。终态读数 = 同路径 **107** 对 · 逐字节 **29** 对 · ≥0.9 者 **39** 对 · 全体中位 **0.6494**（父侧独立复算逐位一致）· status=已核销
- [x] **两仓合并：以 CLI 仓为基础，CLI/VSC 移入子目录，VSC 仓退役**（2026-09-13 用户提案——需求点）——**已核销**（phase 1 目录合并**全闭**：S0–S7 八步四批逐批带 §6 收口 · 设计档 §3 全表 28 行逐项 ✅ · 两产品全量测试 + 全域机检 + 双产物生成（`npm pack` / `vsce package`）+ 发布链演练全绿 · 证据 = 批次档 `thincoder-cli/docs/batches/2026-09-13-TWO-REPO-MERGE.md` §6 四段）；**phase 2（核心统一）未立项**——独立需求 · status=已核销（原状态=在途）
- [x] **VSC devDep 链 4 条安全告警（dev-only）**（2026-09-13 合并仓推送后 GitHub Dependabot 报出；旧 VSC 仓同源 5 条随退役失效）——**已核销**：`npm audit fix` 实跑 `changed 4 packages` → **`found 0 vulnerabilities`**（`brace-expansion` / `fast-uri` / `js-yaml` / `qs`，全部 `dev=true`；VSC 运行时 `dependencies` 为空，`.vsix` 只收包根内文件 ⇒ 本就不随发布物出去）；提交 `72ec017d`（只动 `thincoder-vscode/package-lock.json`，12 增 12 删）+ 推两远端；**门禁复跑全绿** = lint 293 档 OK · `doc:check` V5 命中 0 · 快层 622/581/0/41 · 全量 622/622/0 · 集成 28/28/0 · status=已核销
- [x] **硅基流动 embedding 400/20015：内容截断把 emoji 切成孤立代理对（`slice(0, 2000)` 码元切）**（2026-09-15 网友报告〔经用户转达〕+ 父侧实核根因）——**已核销**：三处送 embed 文本改走核级单源 `safeSliceUTF16`（`thincoder-core/memory/core.mjs` · `thincoder-core/memory/docs.mjs` · `thincoder-core/memory/code-sync.mjs`）+ 新档 `thincoder-core/test/memory-embed-utf16.test.mjs` 8 例（修前红 → 修后绿 · 兜底复验）· 核回归 191/191/0 · 提交 `9e4bd132` · 任务书 `docs/batches/2026-09-15-embedding-utf16-truncation.md` §2（§3 评审 pass · §6 收口）· status=已核销
- [x] **两端 agent 工具装配「家族逻辑」单源化（L2——不两边各一份）**（2026-09-15 22:46 用户裁定：「可以，如果考虑了这个，那我觉得应该整合，不要两边各一份」）——**已核销**：L1 契约归一（VSC `agent.tools` = 基础集）+ L2 归核（核新档 `thincoder-core/agent/family-tools.mjs` `assembleFamilyTools` 159 行；核 `agent/setup.mjs` 355 → 246 · VSC `src/agent/setup.mjs` 683 → 645 · 死支删除）· 反证闭环（改前基线 → L1 反证 4 红〔`Tool names must be unique` 逐字〕→ L2 反证 → 全绿）· 核 183/183/0 · 集成 34/34/0 · 提交 `cc908b7d` · 任务书 `docs/batches/2026-09-15-vsc-tool-table-dup.md` §2（§3 评审轮 2 pass · §6 收口）· status=已核销（原状态=在途）
- [x] **子代理内容面 chunk 通道无 host 侧生产者**（2026-09-15 VSC 壳接线批 W15 §5 未决 ①·评审 🟡；2026-09-16 用户实测触发 + 归因 + 修复）——**已核销**：端修 `thincoder-vscode/src/extension/panel-callbacks.mjs`（单点发射 + relay 文法分流回 `sub:<role>#<id>` 四路；核零改）+ 新测档 T1–T7（修前 5 红 → 全绿）· VSC 快/全量 560/560/0 · 集成 34/34/0 · 提交 `2c6b17f2` · 任务书 `docs/batches/2026-09-16-vsc-subagent-panel-channel.md` §2（§3 评审 pass · §6 收口）· status=已核销（原状态=在途）
- [x] **子代理压缩后推理链回传断裂 ⇒ provider 400（凡触发上下文压缩的子代理必死——两宿主同病）**（2026-09-16 用户 00:33「可以，另开一批」+ VSC 5 个设计轮全灭实证）——**已核销**：选型 B 落地（`thincoder-core/context.mjs` `applyCompression` 并入分支——`tail[0]` 为 assistant 时占位 copy-on-write 并入，`_runStartHistoryLen = head.length + 1`）+ 反证面 T0–T3（修前 2 红〔T1 ✖ · T3 ✖〕→ 全绿）· 核 191/191/0 → **195/195/0** · 提交 `8653f5d2` · 任务书 `docs/batches/2026-09-16-subagent-reasoning-echo.md` §2（§3 评审 pass · §6 收口）· 残余 = 技术待办「机器线残留」条 · status=已核销（原状态=待设计）
- [x] **VSC 顶层 `agent.autoApprove` 字段缺失 ⇒ 核侧读点恒按「非 AUTO」判（同链第 5 处）**（2026-09-16 用户 01:47「修一下错位」+ 01:49 批准建批）——**已核销**：A′ 访问器（`thincoder-vscode/src/agent/setup.mjs:480-489`——hydrateRun B 块 live 闭包、无 setter）+ F2 注释收正 · 反证三段（集成 **47/37/10 → 47/42/5 → 47/47/0**）· 终态 快/全 560/* · 集成 **48/48/0** · lint 197 · 核 195/195/0 · 提交 `a0813b3b` · 任务书 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2（§3 评审两轮 pass · §6 收口）· status=已核销（原状态=待设计）
- [x] **VSC spawn 工具 ctx 缺 `onPermissionRequest` ⇒ 手动档子代理写盘恒拒且不出卡（同链第 6 处）**（2026-09-16 F1 勘察所得；用户 02:23「一起修」并入上批）——**已核销**：F1 两点式（`thincoder-vscode/src/extension/panel-callbacks.mjs:333-359` 供给 · `thincoder-vscode/src/agent/execute-tools.mjs:217` 透传；核零改）+ T5–T9 机判 · 覆盖面 10 环表 8 闭 · 2 残环登记（另批候选）· 提交 `a0813b3b` · status=已核销（原状态=待讨论）
- [x] **子代理面板覆盖面两残环（⏹ 定向取消不释放已开权限卡 · escalate/continue 询问卡归属标签不闭）**（2026-09-16 用户 03:14「这两个问题也都修了吧」）——**已核销**：① 端侧供给接回条目级 signal（`thincoder-vscode/src/extension/panel-callbacks.mjs:348-377`——键形解析单点 + 池条目两读）⇒ ⏹ 即经既有链释放已开卡；② 核侧名形态 `escalate#<id>/<tool>`（`thincoder-core/agent-tools/escalate-async.mjs:231`）+ sync 包装 + continue 键形归一（`subagent-actions.mjs:429/441/446` · `consult.mjs:320`）+ model 池条目供给（B5 闭）· 反证三段（RED 核 4 + 端 4 逐字 → GREEN 全绿）· 核 **199/199/0** · VSC 集成 **53/53/0** · CLI 全链 612/611/1（存量基线）· 提交 `752fe592` · 任务书 `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2（§3 评审 pass · §6 收口）· **覆盖面 10 环全闭** · status=已核销（原状态=在途）
- [x] **子代审批卡归属标签缺 model 分支（供给未传 `model` ⇒ `childOwnerLabel` 模型分支不可达——B5）**（2026-09-16 AUTOAPPROVE 批代码评审 B5）——**已核销**：同上面残环批（端侧供给按池条目取 `entry?.model`——`panel-callbacks.mjs:369-370`；`<model>` 分支对 async 飞刀实态可达）· 提交 `752fe592` · status=已核销（原状态=待讨论）
- [x] **TUI 显示额度裁头把可见历史清到近空（`... [earlier messages trimmed — 1 lines remaining]`）+ 历史“又回来”且视口落在很前面**（2026-09-16 00:52 用户实测；03:14 建批）——**已核销**：保底 `LINES_TRIM_FLOOR = 200` + 最小步进裁剪（`thincoder-cli/src/tui/display-budget.mjs` 185→198）——旧算法 1001×2000 只留 2 行 ⇒ 现留 1000；2501 行场景旧裁 1000 行 ⇒ 现裁 7 行 · 三点裁定（阈值保底 200 · 恢复记账不绕过〔反证〕· 单层可见历史〔alt screen 反证〕）· 反证原样（R1 `removed 1000 ≠ 2` / 收据「1 lines remaining」等逐字 → GREEN 14/14）· CLI 快层 612/553/0 · 集成 25/25/0 · full 612/611/1（存量基线）· 核心 199/199/0 · 提交 `4262f9a4` · 任务书 `docs/batches/2026-09-16-tui-history-trim.md` §2（§3 评审 pass · §6 收口）· 残余 = 技术待办「loadOlder 占位行记账漂移」条 · status=已核销（原状态=在途）
- [x] **VSC 宿主 subagent spawn 全链断裂——`agent.tools` 未装配（`agent.tools is not iterable`）**（2026-09-15 父侧实证：5 个 eng-designer 设计轮全数同错终止、零落笔；用户 21:46「这个红要挂」）——**已核销**：VSC 顶层 agent 工厂从未提供 `agent.tools`（`thincoder-vscode/src/agent/setup.mjs` 的 `buildTopLevelAgent` 无该字段），而核 spawn 读 `parent.tools`（`thincoder-core/agent-tools/subagent-spawn.mjs:287-292`）⇒ 子代装配展开 `[...agent.tools]` 即 TypeError（`thincoder-core/agent/setup.mjs:293`）；修复 = `hydrateRun` 「B 类 run 绑定」块加回 `agent.tools = tools`（提交 `9a0ec8e4`）· 反证用例 `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（T1–T4，含 eng-designer 角色面与真跑 sync spawn——4/4 绿）· 真机复测坐实（2026-09-16 00:29 子代理 `running` · turn 7 · 达 7+ 回合）· 任务书 `docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md` §2（§1–§6 收口）· status=已核销（原状态=待讨论）




---

## 五、单仓化后废弃（2026-09-15 起）

- [x] **S3b 的「不可逆」定性与平台事实不符**（2026-09-13 用户提问触发实核）→ 设计档 §2.15 S3b 行标「**不可逆**」，但两平台官方口径均支持恢复：GitHub「您可以存档仓库…**你也可以取消存档已经存档的仓库**」；Gitee「暂停 / 关闭」为**可改回**的状态（help.gitee.com 仓库状态功能说明——**该页表格与正文对「暂停态能否查看/Pull」自相矛盾**）⇒ S3b 实为「对外退役信号 + 期间不可写」，**非不可逆数据损失** · 证据 `thincoder-cli/docs/design/TWO-REPO-MERGE.md:327` · **判废弃（2026-09-15 用户「可以」批准——父侧台账分类轮提出、用户同批批准）**：修正对象**已不在维护面** —— ① 权威新档 `docs/core/design/TWO-REPO-MERGE.md:182` 已把「旧档 §2.15 迁移步骤与回滚点 S0–S7」登记为**一次性材料 · 不并**（理由行 = 实施已完成）；② 旧副本档性 = **迁移期参照历史（保留 ≠ 维护）**（`docs/README.md:4`），且同档 `:202` 明记「旧档一字未改、原地作参照历史」 ⇒ 改它反违「旧档不批量搬 · 原地保留」政策（`docs/README.md:19`）；③ 迁移已完成 ⇒ 该条对现行机制零影响。原消解路径（「该档下次触碰时收正措辞 + 补『可逆』说明 + 补『退役说明须先于归档推送』的顺序纪律」）**无适用对象** · status=已废弃（原状态=触发=条件（该面下次被触碰时））





