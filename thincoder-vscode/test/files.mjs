/**
 * files.mjs — 测试清单单一来源（npm test 快层与 test:full 全量共用）。
 *
 * 2026-09-07 大规模清理：从 68 项收敛为真实冒烟/核心行为集（原锚/时序/UI/内部细节
 * 测试全部删除——AI 提示词锚测试与内部实现锁属于过度工程，见 METHODOLOGY 铁律）。
 * 新增测试文件：在此登记。
 */
export default [
  // 2026-09-09 SESSION-FLOW-C C1 清单修复：agent-core/config-io/execute/git/provider/
  // edit-eol/edit-semantics 在 3b974ae「测试清空」中删除且从未恢复——条目随删除勾销
  // （git 核验——残条目让清单虚报套件组成）。chat-panel.test.mjs 为 C1 重建（本行保留）。
  "test/activity-flow.test.mjs", // SESSION-FLOW-B B1（2026-09-09）：子代理块流内出生/原地冻结/resetActivity/150 计入/⏹ 规则/parseChannel——F-B1a~f + N3 无 DOM move（happy-dom——helpers/webview-env.mjs）
  "test/async-visibility.test.mjs", // 第 10 批条目 A（2026-09-11）：VSC live 块出生可靠性——投递队列/flush/溢出留痕·新代接管·终态补桩成员表·清屏恢复（pool+⏹+位置）——T-V1~V8 + AC-A1~A8（WEBVIEW.md §5.1）
  "test/wait-for-advisor-pool.test.mjs", // 第 10 批条目 B（2026-09-11）：`advisor settled` 判据 = 评审池真实态（红→绿——双载体）——T-B4/T-B5（CLI AGENT-LOOP.md §18.6）
  "test/chat-panel.test.mjs", // 真实模块直驱面（2026-09-09；2026-09-12 拆分）：turn 句柄保底（④ F-C1a/H-B）/ atComplete seq（⑥ F-C1c/H-A）/ A2 标题回合内（⑨⑩ F-A2）/ 模型·stamp 决策（⑪ MODEL-MERGE-SESSION）——真 runPanelChat + 真 atComplete + resolveTurnModelAndStamp（面板入口组已迁 chat-panel-messages.test.mjs；切点判据 = LEDGER-SELF-CONTAINED.md D18 四条）
  "test/chat-panel-messages.test.mjs", // 面板入口（消息/控制/状态）面（2026-09-12 拆分自 chat-panel.test.mjs——500 行硬限无豁免）：桩面板驱动（stubPanel 夹具自持——零跨档 import）——拒收（①）/ 控制直通（②）/ 启动闩（③）/ 响应器匹配（⑤）/ 忙态状态机（⑦）/ sendMessage（⑧）/ _chat 单槽（⑪）/ F-2 取消路由（⑫）
  "test/webview-turnstate.test.mjs", // SESSION-FLOW-C C2 webview reducer 组（2026-09-09）：_turnState 枚举转换/renderStatusBar 单 writer/Stop susp 常显/_suspCounts 不陈旧——F-C2a~e（happy-dom——helpers/webview-env.mjs）
  "test/edit-tool-improvement.test.mjs",
  "test/memory-tool.test.mjs",
  "test/eng-settlement.test.mjs",
  "test/config-merge.test.mjs", // MODEL-SELECTION（2026-09-10）：迁移 v2 双端同规则 VSC 面（形态 A/B→单值、幂等/失败不阻断/凭据不丢、磁盘无 models 键）+ 预设 20 条单值 + resolveDefaultModel 新回退链（复合→渠道默认单值→null）
  "test/provider-admission.test.mjs", // MODEL-SELECTION（2026-09-10）：VSC 渠道准入——三 format 拉取/翻页（T1–T4/T26/T27）+ M9 配置阶段两态（T23/T24——含 fullStatus 拉取失败=不可选）+ 运行期零探测（T25）+ 面板行 `不可用` 标注（happy-dom）；W10（2026-09-15）改判：list-models/proxy 实现面迁核（`@thincoder/core/provider/list-models.mjs`）——面板行为断言原文保留
  "test/model-picker-fallback.test.mjs", // MODEL-SELECTION v2 范围追加（2026-09-11）：M10/T29——面板候选未命中不写会话槽（零 selectModel/selectReasoning post + 显示与状态回落会话槽复合 prefs 复合）+ 命中分支同值回写正控（happy-dom 直驱 handleModelsMessage）
  "test/config-io-panel.test.mjs", // MODEL-MERGE-SESSION（2026-09-09）：defaultModel 面板键白名单 + selectModel 消息 = 写会话槽（内容字节断言——config 零写——槽播种 + digest p:m）
  "test/subagent-observe-send.test.mjs",
  "test/subagent-id-counter.test.mjs", // SUBAGENT-ID-COUNTER-AGENT（2026-09-09）：id 计数器载体 = agent 本体——压缩换线后 spawn id 仍递增 + 两池 poolMax 兜底
  "test/smoke-settings.mjs",
  "test/verify-redesign.test.mjs",
  "test/prompts-async-guidance.test.mjs", // AGENT-LOOP §7.7.1（2026-09-08）：escalate/advisor/spawn 顶层一律异步——async:false 同步引导内容断言（CLI 对拍同款）
  "test/agent-lifecycle-singleton.test.mjs", // AGENT-LOOP §11（2026-09-08）：agent 生命周期单例——resetRunState/reconcile/applySlot 映射/绑定判定
  "test/setup-reminders.test.mjs", // SESSION §11.2（2026-09-08）：env-state slot 字段 + resumed 按会话跟踪 + 注入句解耦
  "test/session-boot.test.mjs", // SESSION-FLOW-B B2（2026-09-09）：会话打开原子化——webviewReady 单向 boot（四件握手+快段全量/sessions 恰一次红线）+ resolve 零内容 + 快慢段分离（openSessionContent/status）——F-B2a~c + N2（组 ⑪⑫——评审 #2：chat-panel.test.mjs 近 500 不再追加）+ ⑬（SESSION-RESTORE-PARITY——真实形状 >200 消息 fixture 首窗 200/hasOlder + loadOlder 越页配对）
  "test/history-window.test.mjs", // SESSION-RESTORE-PARITY ①（2026-09-09）：historyWindow 直驱——turnStart 可见前驱矩阵/C reminder 剔除/B 配对（乱序全配+args 透传+无结果 null）/E reasoning ?? 兼容/F ts 三形态+idx+hasOlder/窗口跨页配对+孤儿 skip/HISTORY_PAGE_SIZE===200
  "test/history-restore.test.mjs", // SESSION-RESTORE-PARITY ③（2026-09-09）：webview DOM——applyHistoryPage 直驱（G welcome 移除/空保留/assistant 帧序 label→thinking→bubble→嵌套卡/data-idx 仅外层/工具卡 args/Error 红 open/user ts/F 缺失不显/孤儿 tool 顶层保底）
  "test/trace-store.test.mjs", // TRACE-STORE-VSC（2026-09-09）：VSC 轨迹存档同构——recordChatTrace 字段集/脱敏/fire-and-forget/seq/清理/禁用/写失败/保留边界 + per-caller 形状 + chat() 出口采集
  "test/subagent-audit-summary.test.mjs", // A2-SUMMARY-PARITY（2026-09-09）：A2 摘要对齐 CLI——auditTaskBook seam 驱动 _engTaskInput fixture——flat inline 兜底/结构化节摘/marker 缺失 (not found)/单可保留节无整书回退
  "test/read-dual-end.test.mjs", // DUAL-END-TRUNCATION F-1（2026-09-09）：read 双端——大文件头+省略注+尾 / K=0 无假注 / 重叠不重复 / ≤阈值零变化 / hashes——CLI 镜像
  "test/advisor-truncation.test.mjs", // DUAL-END-TRUNCATION F-2（2026-09-09）：advisor 截断双端化——超 64K 头尾保/中段注/offset 提示/K=0 透传——truncate.mjs 直驱——CLI 镜像（byte-identical）
  "test/config-pool.test.mjs", // POOL-CONFIG-UNIFIED（2026-09-09）：耦合锁三键 4/4/4 + advisor 读取器 + 容量拒/scope 守卫 + 白名单 + 落盘——纯单元（拒发路径——config 测试缝隔离）+ 面板显示面（2026-09-11 扫① 合档：settings-panel 并入——agentSettings() 快照回退 + agentCardHtml() 三数字框 + poolAdvisor 双语）
  "test/config-softfail.test.mjs", // ISSUE-FIX-BATCH F-4（2026-09-09，IKCDMR）：consultModels 软失败（读面过滤 + 一次性警告——CLI 同规则双端锁步）+ 面板写路径对齐 + removeProvider 级联清理（consultModels/subagentModels/advisor.provider）
  "test/settings-tool.test.mjs", // SETTINGS-TOOL 第 8 批 + 第 12 批（2026-09-11）：settings 工具形状护栏 VSC 面——本端 null 叶子 2 键 + 跨端 3 + 同族 1 = 4 键 + 防漂移锁 + 描述句逐字（T-S2.30–T-S2.37）；登记即跑（清单为显式列表）
  "test/provider-model-guard.test.mjs", // MODEL-400-FIX/QUICKFIX-BATCH-2（2026-09-09）+ MODEL-SELECTION（2026-09-10）：双端 guard 镜像——F-1 model 缺失可读 throw + F-2b advisor 跨渠道渠道默认单值（无则父兜底——T28）+ F-1 byName 单值/父兜底；W10（2026-09-15）改判：F-1 经核 chat 真路驱动（原 buildRequest 直驱面随删档）
  "test/image-downgrade.test.mjs", // IMAGE-DOWNGRADE-VISION（2026-09-09）：非视觉贴图自动降级视觉子代理——F-1 描述注入/images 清空 + F-2 fallback 三态 + AC-2 视觉零回归 + runner seam 缺省回落生产（mock 跑者/keyless 短路——零网络）
  // VSC 端镜像（2026-09-11 第 5 批 · ENGINEERING-MODE.md §2.22/§2.23——新档一律入册，否则接线没活）
  "test/batch-doc-gate.test.mjs", // batchDoc spawn 门（§2.22.3）：两路各一调用点 + 校验逻辑单份 + 角色域（T54/T55/T55b/T56）
  "test/batch-segment.test.mjs", // 批次档段写入工具 VSC 面（§2.22.5）：工具契约 + 只读面零变更 + rv 实例键不串档（T59/T60/T66）
  "test/eng-designer-role.test.mjs", // eng-designer 运行期八处（§2.22.4）：白名单/模式门/子代门/装配/枚举/场景/webview/勘察通道（T57/T57b/T57c/T58）
  "test/doc-consistency.test.mjs", // 文档一致性 V1/V2/V3 + 基线 + 接线（§2.22.6）：零新增、V1「（CLI 侧）」豁免、V3 三态零假阳（T61/T63/T64）
  // 「5 新档全入册」之第五档（面② 的锚句断言档——文件域属面②，入册归本表）
  "test/prompts-mirror-anchors.test.mjs", // 提示词双源镜像锚（§2.22.2/§2.22.7）：A1-A8/A11/A12 逐字 + 双源 15 档集合 + 端特有段（T62/T65）
  "test/advisor-chain-guards.test.mjs", // 第 12 批（2026-09-11）：VSC 评审链边缘守卫镜像——谓词族六 kind + 双结算面不签发 + 信号自愈 + 压缩定锚 + 引文候选链 + 硬墙/提示/结构化尾（T-VG1–T-VG15；ADVISOR-CONVERGENCE.md §13）
  "test/advisor-guard-completion.test.mjs", // 第 18 批（2026-09-11）：VSC 守卫收尾——启动断言 + 异步结算消费（launchRefused 不计覆盖）+ 冻结窗口冲突 helper/预闸拦截/回执冻结句 + 收敛信号两形态锁定（T-VG16–T-VG21；ADVISOR-CONVERGENCE.md §14——同族档 427 行已满，独立成档 D-VGC8）
  "test/advisor-context-budget.test.mjs", // 第 26 批（2026-09-11）：评审上下文预算 VSC 镜像——120K 常量退场 + providerSpec 派生两档（limit/compactAt）+ 循环两处消费 + 静态锚（T-CB1–T-CB6；ADVISOR-CONVERGENCE.md §15——镜像口径语义同源、本端原文自持）
  "test/config-watch.test.mjs", // 第 21 批（2026-09-11）：外部 config.json 写盘感知 B5——watcher 注册形状/去抖合并/自写基线回填抑制/稳态零推送/create·delete/dispose/降级（T-S1~T-S6；SETTINGS.md §2.6）
  "test/digest-visibility.test.mjs", // 第 21 批（2026-09-11）：消化轮起跑可见指示 B6——起止两态+ok 旗标时序（host）+ #digest-status 三态渲染与幂等（真 chat.js——happy-dom）（T-D1~T-D5；WEBVIEW.md §7.4）
  "test/turn-across-segments.test.mjs", // 第 19 批（2026-09-11）：跨段累计编号 VSC 面——turnFrame 帧向量/不变式扫描 + applyTurnFrame 消费助手 + webview 冻结头消费累计值 + 真 runAgent 直驱段间断言/真 runChild 接线 + 种子源码锚（T1–T11；TURN-CAP-CONTINUE.md §19）
  "test/webview-input-enter.test.mjs", // 第 28 批（2026-09-11）：VSC 输入面 Enter 语义——组合期归输入法（三路）/ @ 下拉与 send 协调（含打开态判据硬化）/ busy 拒发可见 toast（T-B2-1~T-B2-7；WEBVIEW.md §9）
  "test/async-parity.test.mjs", // 第 35 批（2026-09-11）：VSC async 子代理保真（GitHub #6）——spawn ack 契约锁 + 类型守卫 + 只清已死（丢弃提醒/墓碑/ev:discarded）+ status 四终态回显 + dependsOn depc 停靠 + digest 轮 AbortError 容忍 + 症状1 现状锁（T-D1~T-D10；AGENT-LOOP.md §12）
  "test/md-render-escape.test.mjs", // 第 34 批（2026-09-11）：VSC webview 行内代码字面量契约 + 转义回归（GitHub #7）——行内代码不被后续替换二次处理（esc-first 保持）+ 转义面钉死——T-H1~T-H15 + AC-H5 接线（WEBVIEW.md §10）
  // 批次二（可移植性 VSC 镜像面——2026-09-11）：VP-1–VP-12 落地机判面（PORTABILITY.md §6/§7）
  "test/portability-vsc-classification.test.mjs", // T-V01–T-V06 + AC-V01/V02/V03：分类唯一权威（嵌套/声明/损坏回退）+ 门禁拒绝与声明切换 + 静态副本扫描
  "test/portability-vsc-advisor-context.test.mjs", // T-V07–T-V13 + AC-V04/V05/V09/V11：注入在场/三条降级句/声明优先/非 git 降级 + 文档门禁校验 + 两条文案 + 拆分兑现
  // 2026-09-15 W8（索引面归一核面）：`portability-vsc-index.test.mjs` 随文件制索引删旧退役（测试纪律①）——unlisted 可见化等业务面按核面承接重述入 `test/memory-index-face.test.mjs`（D3 计数同步）
  "test/provider-timeout-semantics.test.mjs", // 群 A 批 A1（2026-09-11）· W10 改判（2026-09-15）：保留 2 例——调用面 signal 原样/零合成 + 相位参数（经核 chat）；退役 3 例——镜像 parseStream idle 缝随删档（不可稳定驱动）/ 静态源文本断言（PROVIDER.md §4.3）
  "test/expand-home.test.mjs", // 群 A 批 A2（2026-09-11）：`shell` 字段 `~` 展开——形态矩阵（前缀/裸/尾分隔/非分隔符/类型护栏）+ setup 读取点接线与只读归一——T-MA2-1–5（SETTINGS.md §2.7）
  "test/advisor-refusal-accounting.test.mjs", // 群 A 批 A6（2026-09-11）：同步记账面拒绝登记——六类拒绝置位 + 记账零写 + builder 单源 + 对照零回归——T-MA6-1–9（ADVISOR-CONVERGENCE.md §16.1）
  "test/git-commit-pathspec.test.mjs", // 群 A 批 A9（2026-09-11）：commit `--only` 镜像——列文件提交（他批 staged 不混入）+ 空/空白 path 明确错误 + 无 path 全量零回归（真 git 子进程——slow 归册；TOOLS.md §11）
  "test/webview-input-history.test.mjs", // 群 A 批 A10（2026-09-11）：↑/↓ 契约——连续上溯/↓ 回落+草稿恢复/单行任意位置/多行边界门零劫持/IME 守卫/下拉让位——T-MA10-1..8（WEBVIEW.md §11.1）
  "test/context-parity.test.mjs", // VSC-CONTEXT-PARITY 批（2026-09-11）：会话上下文注入面对齐——块序/尾块/缓存契约/plan 节律/响应提醒/skill 形态——T-CI-1~T-CI-11（14 条；AGENT-LOOP.md §17）
  "test/tool-descriptions.test.mjs", // VSC-CONTEXT-PARITY 批（2026-09-11）：工具描述外部装载 25 档 .md 迁移——DESC 装载逐字/文件在位/内联零残留（全量）/打包面——T-TD-1~T-TD-4（TOOLS.md §12）
  "test/activity-live-ux.test.mjs", // VSC-LIVE-UX 批（2026-09-12）：live 块流式跟滚 + 内容区高度 60px——块级 follow（近底 24px 让位/复钉 + 两层独立）+ 脏集 rAF 帧应用（节流重排不丢）+ 折叠/已移除 no-op + CSS 静态断言——T-LU1~T-LU6（WEBVIEW.md §13）
  "test/activity-closure.test.mjs", // 活动区收口批（2026-09-12）：终态清退+归档落流（awaitingDigest 驻留/回收边界前/即时尾追/退出全归档/接管吞守卫/补桩直归档/reset 收窄）+ 块头字段（queued 位置·tool+cmd·turn 帧·elapsed 不设门）——T-CL1~T-CL8/T-CL10~T-CL13/T-CL17~T-CL19（WEBVIEW.md §14）
  "test/status-line.test.mjs", // 活动区收口批（2026-09-12）：状态行字段级对齐——statusText 五 kind 两 locale/✦reasoning/turn N/M（旧段退役）/端差（scrolled 不做·ctx pct）+ onWait/索引/transport 发射点机检——T-CL21~T-CL24（WEBVIEW.md §14）
  "test/child-permission.test.mjs", // 子代理审批面对齐批（2026-09-12）：child 审批门——ask 弹卡带归属/approve-deny 语义/AUTO 直通/轮中 approve-all/escalate sync+async（⏹ 与 Stop 两路释放）/promptId 路由/角色域零卡/无通道静默/depth-0 零回归/块头 ⏸+态词+i18n/结构对表——T-CP1..T-CP19（AGENT-LOOP.md VSC §18；2026-09-12 拆分：引擎接线组 6 例 → child-permission-wiring.test.mjs）
  "test/child-permission-wiring.test.mjs", // child-permission 引擎接线组（2026-09-12 拆分自 child-permission.test.mjs——500 行硬限无豁免）：escalate sync/async 通道接线 + ⏹ / Stop 两路释放 + runChild 角色域零卡/无通道静默——T-CP6/T-CP7/T-CP19/T-CP10/T-CP11/T-CP15（AGENT-LOOP.md VSC §18；夹具自持——零跨档 import）
  "test/ledger.test.mjs", // LEDGER-SURFACE 批（2026-09-12）：台账可见面 VSC 面——语义同源单元组 + 跨端去重键 + item 形态（T107）+ webview 渲染（T108）+ post/送达门 + 接线机检 + 慢层 git 老化界值（T102）（ENGINEERING-MODE.md §2.30）
  "test/ledger-check.test.mjs", // LEDGER-SELF-CONTAINED 批（2026-09-12；S4 单仓化）：台账机检 L1–L4——正常（本域指针全解析）+ 错误（越出根证据 / 越根绝对路径 → [L4] + 退出码 1；跨仓段 T-VS2/T-VS3 随 S4 删）+ 边界（零假阳 / 非空基线即 FAIL——必须保持为空）（T-VS1/T-VS4–T-VS6 + T-VS35 + L2/L3 面；设计档 §7.3）
  "test/slow-gate.test.mjs", // D-T6 机制自验（2026-09-12 收尾轮 9 补建——原引用悬空修复）：红/绿两端 + 文件级合成条目跳过分支（slow() 门控：快层 skip、test:full 跑）
  "test/doc-anchors.test.mjs", // DOC-CODE-RECONCILE 批·期 1（2026-09-12；S4 单仓化）：V5 文档锚一致性机检——A1/A2/A3 三类锚存在性 + 假阳八类零报 + 注记 + 射程边界 + 报告态/阻断态（T-DC1–T-DC14；跨仓域外 / 自指段已随 S4 删；设计档 §4/§10）
  "test/reconcile-lookup.test.mjs", // DOC-CODE-RECONCILE 批·期 1（2026-09-12）：层 3 反查——变更 token → 设计/需求档清单；只读不阻断 + 零写 + 抽取器单源（T-DC15；设计档 §5）
  "test/engine-floor-guard.test.mjs", // W8 前置笔（2026-09-15）：引擎下限护栏（A8 裁定）——版本闸 22.13 + node:sqlite 探针 + 低于下限提示/记忆面停用/不抛（批次档 §2 W8「门 1」）
  "test/agent-tools-registry.test.mjs", // W9（2026-09-15）：登记册 14 名装配断言（引核册——核 agent-tools.mjs 名集 / 端侧转口面同集 / setup.mjs 动态装配 14 名；CORE-UNIFICATION §2.13.4 #83）+ W8 接线契约机判（静态闭包零 node:sqlite）
  "test/memory-index-face.test.mjs", // W8（2026-09-15）：索引面归一核面专项验收——A-K12（反向判零 + 检索 = 核面 FTS 回退非空 + 面板读数 = 核库计数）· A-K13（相位序列 scan→index→done + 完成提示 = 核读数 + 模型变更零手动重建/懒回填）· A-K14（旧目录清退：告示一次 + 显式删除 + 零自动删除路径）· VP-9 可见化核面承接（快层：A-K12 反向判零 + A-K14 两档；慢档：真 fs/sqlite 四档——A-K12 检索 / A-K13 相位 / A-K13 懒回填 / VP-9 可见化）
]
