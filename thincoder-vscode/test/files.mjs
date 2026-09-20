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
  "test/config-merge.test.mjs", // MODEL-SELECTION（2026-09-10）：迁移 v2 双端同规则 VSC 面（形态 A/B→单值、幂等/失败不阻断/凭据不丢、磁盘无 models 键）+ 预设 21 条单值 + resolveDefaultModel 新回退链（复合→渠道默认单值→null）
  "test/provider-admission.test.mjs", // MODEL-SELECTION（2026-09-10）：VSC 渠道准入——三 format 拉取/翻页（T1–T4/T26/T27）+ M9 配置阶段两态（T23/T24——含 fullStatus 拉取失败=不可选）+ 运行期零探测（T25）+ 面板行 `不可用` 标注（happy-dom）；W10（2026-09-15）改判：list-models/proxy 实现面迁核（`@thincoder/core/provider/list-models.mjs`）——面板行为断言原文保留；init-block 批（2026-09-18）F-W19：T-W19a 失败分类三档落账（malformed/timeout/hostBusy + 统一 ts）+ 双向词档（词 ⇔ 落账单源）· T-W19b 重试成功拍三清除（落账/available 载荷/展示回绿）· T-W19c 重试 ≤2 耗尽 · T-W19d 宿主忙闸零重试 · T-W19e 在飞去重（SETTINGS.md §2.12）
  "test/model-picker-fallback.test.mjs", // MODEL-SELECTION v2 范围追加（2026-09-11）：M10/T29——面板候选未命中不写会话槽（零 selectModel/selectReasoning post + 显示与状态回落会话槽复合 prefs 复合）+ 命中分支同值回写正控（happy-dom 直驱 handleModelsMessage）
  "test/config-io-panel.test.mjs", // MODEL-MERGE-SESSION（2026-09-09）：defaultModel 面板键白名单 + selectModel 消息 = 写会话槽（内容字节断言——config 零写——槽播种 + digest p:m）
  "test/subagent-observe-send.test.mjs",
  "test/subagent-id-counter.test.mjs", // SUBAGENT-ID-COUNTER-AGENT（2026-09-09）：id 计数器载体 = agent 本体——压缩换线后 spawn id 仍递增 + 两池 poolMax 兜底
  "test/smoke-settings.mjs",
  "test/verify-redesign.test.mjs",
  "test/prompts-async-guidance.test.mjs", // AGENT-LOOP §7.7.1（2026-09-08）：escalate/advisor/spawn 顶层一律异步——async:false 同步引导内容断言（CLI 对拍同款）
  "test/agent-lifecycle-singleton.test.mjs", // agent 生命周期单例（2026-09-08）：resetRunState/reconcile/applySlot 映射/绑定判定
  "test/setup-reminders.test.mjs", // SESSION §11.2（2026-09-08）：env-state slot 字段 + resumed 按会话跟踪 + 注入句解耦
  "test/session-boot.test.mjs", // SESSION-FLOW-B B2（2026-09-09）：会话打开原子化——webviewReady 单向 boot（四件握手+快段全量/sessions 恰一次红线）+ resolve 零内容 + 快慢段分离（openSessionContent/status）——F-B2a~c + N2（组 ⑪⑫——评审 #2：chat-panel.test.mjs 近 500 不再追加）+ ⑬（SESSION-RESTORE-PARITY——真实形状 >200 消息 fixture 首窗 200/hasOlder + loadOlder 越页配对）
  "test/history-window.test.mjs", // SESSION-RESTORE-PARITY ①（2026-09-09）：historyWindow 直驱——turnStart 可见前驱矩阵/C reminder 剔除/B 配对（乱序全配+args 透传+无结果 null）/E reasoning ?? 兼容/F ts 三形态+idx+hasOlder/窗口跨页配对+孤儿 skip/HISTORY_PAGE_SIZE===200
  "test/history-restore.test.mjs", // SESSION-RESTORE-PARITY ③（2026-09-09）：webview DOM——applyHistoryPage 直驱（G welcome 移除/空保留/assistant 帧序 label→thinking→bubble→嵌套卡/data-idx 仅外层/工具卡 args/Error 红 open/user ts/F 缺失不显/孤儿 tool 顶层保底）
  "test/trace-store.test.mjs", // TRACE-STORE-VSC（2026-09-09）：VSC 轨迹存档同构——recordChatTrace 字段集/脱敏/fire-and-forget/seq/清理/禁用/写失败/保留边界 + per-caller 形状 + chat() 出口采集
  "test/subagent-audit-summary.test.mjs", // A2-SUMMARY-PARITY（2026-09-09）：A2 摘要对齐 CLI——auditTaskBook seam 驱动 _engTaskInput fixture——flat inline 兜底/结构化节摘/marker 缺失 (not found)/单可保留节无整书回退
  "test/read-dual-end.test.mjs", // DUAL-END-TRUNCATION F-1（2026-09-09）：read 双端——大文件头+省略注+尾 / K=0 无假注 / 重叠不重复 / ≤阈值零变化 / hashes——CLI 镜像
  "test/config-pool.test.mjs", // POOL-CONFIG-UNIFIED（2026-09-09）：耦合锁三键 4/4/4 + advisor 读取器 + 容量拒/scope 守卫 + 白名单 + 落盘——纯单元（拒发路径——config 测试缝隔离）+ 面板显示面（2026-09-11 扫① 合档：settings-panel 并入——agentSettings() 快照回退 + agentCardHtml() 三数字框 + poolAdvisor 双语）
  "test/config-softfail.test.mjs", // ISSUE-FIX-BATCH F-4（2026-09-09，IKCDMR）：consultModels 软失败（读面过滤 + 一次性警告——CLI 同规则双端锁步）+ 面板写路径对齐 + removeProvider 级联清理（consultModels/subagentModels/advisor.provider）
  "test/settings-tool.test.mjs", // SETTINGS-TOOL 第 8 批 + 第 12 批（2026-09-11）：settings 工具形状护栏 VSC 面——本端 null 叶子 2 键 + 跨端 3 + 同族 1 = 4 键 + 防漂移锁 + 描述句逐字（T-S2.30–T-S2.37）；登记即跑（清单为显式列表）
  "test/provider-model-guard.test.mjs", // MODEL-400-FIX/QUICKFIX-BATCH-2（2026-09-09）+ MODEL-SELECTION（2026-09-10）：双端 guard 镜像——F-1 model 缺失可读 throw + F-2b advisor 跨渠道渠道默认单值（无则父兜底——T28）+ F-1 byName 单值/父兜底；W10（2026-09-15）改判：F-1 经核 chat 真路驱动（原 buildRequest 直驱面随删档）
  "test/image-downgrade.test.mjs", // IMAGE-DOWNGRADE-VISION（2026-09-09）：非视觉贴图自动降级视觉子代理——F-1 描述注入/images 清空 + F-2 fallback 三态 + AC-2 视觉零回归 + runner seam 缺省回落生产（mock 跑者/keyless 短路——零网络）
  // VSC 端镜像（2026-09-11 第 5 批——端侧 eng-designer 角色与工程模式面；新档一律入册，否则接线没活）
  // W13（2026-09-15）退役：`test/batch-doc-gate.test.mjs`——其断言对象 = 端侧工具 `ctx.runAgent` 缝下
  // 的两路门（镜像删旧后不存在；同门恒等面由 CLI 侧 `thincoder-cli/test/batch-doc-gate.test.mjs`
  // 直驱核 `buildSpawnChild` 覆盖——两路/角色域/可读性矩阵同表）。
  "test/batch-segment.test.mjs", // 批次档段写入工具 VSC 面（VSC 端镜像批（2026-09-11 · 第 5 批）；现行权威 = BATCH-RECORD.md §4）：工具契约 + 只读面零变更 + rv 实例键不串档（T59/T60/T66）
  "test/eng-designer-role.test.mjs", // eng-designer 运行期八处（VSC 端镜像批（2026-09-11 · 第 5 批）；枚举面现行权威 = AGENT-LOOP-SUBAGENT.md §6.24）：白名单/模式门/子代门/装配/枚举/场景/webview/勘察通道（T57/T57b/T57c/T58）
  // 2026-09-18 清单收正：doc-consistency / ledger-check / doc-anchors / reconcile-lookup 四档随 M8 机检重写批
  // （b9f439c9）删除，条目随删除勾销（残条目让清单虚报套件组成）；其中 doc-consistency 属 2026-09-11 第 5 批入册的五新档之一——该族计数以现值为准。
  // 「5 新档全入册」之第五档（面② 的锚句断言档——文件域属面②，入册归本表）
  "test/prompts-mirror-anchors.test.mjs", // 提示词双源镜像锚（VSC 端镜像批（2026-09-11 · 第 5 批）；双源/端特有段现行权威 = PROMPT-SYSTEM.md §6）：A1-A8/A11/A12 逐字 + 双源 15 档集合 + 端特有段（T62/T65）
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
  "test/engine-floor-guard.test.mjs", // W8 前置笔（2026-09-15）：引擎下限护栏（A8 裁定）——版本闸 22.13 + node:sqlite 探针 + 低于下限提示/记忆面停用/不抛（批次档 §2 W8「门 1」）
  "test/agent-tools-registry.test.mjs", // W9（2026-09-15）：登记册 14 名装配断言（引核册——核 agent-tools.mjs 名集 / 端侧转口面同集 / setup.mjs 动态装配 14 名；CORE-UNIFICATION §2.13.4 #83）+ W8 契约②形态面（静态闭包零 node:sqlite 扫描在 `test/engine-floor-guard.test.mjs`）
  "test/memory-index-face.test.mjs", // W8（2026-09-15）：索引面归一核面专项验收——A-K12（反向判零 + 检索 = 核面 FTS 回退非空 + 面板读数 = 核库计数）· A-K13（相位序列 scan→index→done + 完成提示 = 核读数 + 模型变更零手动重建/懒回填）· A-K14（旧目录清退：告示一次 + 显式删除 + 零自动删除路径）· VP-9 可见化核面承接（快层：A-K12 反向判零 + A-K14 两档；慢档：真 fs/sqlite 四档——A-K12 检索 / A-K13 相位 / A-K13 懒回填 / VP-9 可见化）
  "test/subagent-content-relay.test.mjs", // VSC 子代理面板通道恢复批（2026-09-16）：端壳内容中继面——子代内容 chunk（核 relay 前缀）四路分流 → `toolPanel` `sub:<role>#<id>` 频道（T1–T7：块内命中 / 主流零命中 / 嵌套子标 / 无前缀正控 / 事件面零回归 / escalate·consult 同族 / 误伤形态锁定）
  "test/protocol-coverage.test.mjs", // VSC 产品树残留债清零批（2026-09-16）：§12 收发面全量对表机检——首列 ↔ 源码提取集双向对账（含 `sub:*` 归一并集）+ ④ 处置闭区间 + 错误路径点名（夹具树零污染）——T-5/T-6/T-7/A4（WEBVIEW-PROTOCOL.md §12；VSC-DEBT.md §2.3/§3.2）
  "test/compaction-echo.test.mjs", // ENGINE-DEBT ED-1（2026-09-16）：恢复面回声归并 VSC 调用点——activeLines 真槽落盘/读盘链（病态零违例/健康零回归/链式/会话档零改写）——T-V1~T-V4 + 接线机检（CONTEXT-COMPACTION.md §6.10 #8）
  "test/tool-display-sync.test.mjs", // #45 工具驱动变更→端显示同步（2026-09-18 模式联动批）：`syncToolDrivenDisplayState` 两判据（模式腿 `_engShown` 已展示基线 / 参数腿 `_settingsTouched` 读后复位）+ hydrateRun 基线置值 + 深度>0 no-op（WEBVIEW-PROTOCOL.md §3.3 判据①②；批档 AC-D）
  "test/advisor-guard-rounds.test.mjs", // 顾问面治理批（2026-09-18 · 撤 cap）：端侧 guard 不以轮次停推（`maybeGuardPushbacks` 直驱桩 agent——`_advisorRound=6` 仍推回 + `MAX_ADVISOR_PUSHBACKS` 仍限 3）——T-AF7（ADVISOR-CONVERGENCE.md §3.1）
  // VSC 配置页接线修复批（2026-09-18 · 台账 #89——F-W8/F-W9/F-W10/F-W11/F-W12 + N-W8）
  "test/settings-open-snapshots.test.mjs", // F-W8 设置面快照打开必达（W8-1/W8-2/W8-3——回批固定序 + 建面真值 + 250ms 回落；桩 ChatPanel 原型 + 真 chat.js/settings.js；SETTINGS.md §2.8）+ F-W18 静默判据①②（W8-4 注入 800ms 伪探测 ⇒ 逐序 + 相邻两拍 < 2s + Promise.all 并发 + memo/在飞去重；W8-5 探测链零同步形态扫描 + 扫描域完整性 fail-closed——SETTINGS.md §2.11）
  "test/settings-empty-no-write.test.mjs", // F-W10 空值不得静默清除（W10-1…W10-7——基线判据 + 逐字段载荷 + 空值路径册 + handleSetProviderProxy 覆盖；AC-W3/AC-W8）
  "test/settings-refill.test.mjs", // F-W9 + F-W11 回填半（W9-1…W9-5——代理/Shell/检索/索引四点控件级回填 + 跳过聚焦 + 行级重绘；SETTINGS.md §2.8/§2.9）
  "test/protocol-coverage-reverse.test.mjs", // F-W12/N-W7 发面全量对表机检（W12-1…W12-3——§13 表 ↔ webview 发射集 + 分发档 case 双向对账 + 四形态提取 + fail-closed 点名）
  // VSC 会话界面接线修复批（2026-09-18 · 台账 #90——F-W13/F-W14/F-W15/F-W16）
  "test/webview-permission-batch-release.test.mjs", // F-W13 批权限卡必可释放（W13-1…W13-7——批卡携 promptId 并族 + id 精确匹配 + 孤儿回写 + 释放即刷；WEBVIEW-PROTOCOL.md §4.6 · WEBVIEW.md §4.1）
  "test/webview-model-busy-gate.test.mjs", // F-W14 忙态门（W14-1…W14-4——判据非 idle 的禁用派生 + 两入口守卫 + idle 零回归；WEBVIEW.md §4.2）
  "test/at-refs-restore.test.mjs", // F-W15 恢复面 @ 引用清洗（W15-1…W15-5——显示边界剥离 fail-closed + 标题源同源剥离；WEBVIEW.md §4.4）
  "test/webview-tool-failure-signal.test.mjs", // F-W16 工具失败信号（W16-1…W16-11——判据单源 + 摘要含退出状态 + 反例面 + 恢复卡同判据 + spawn 失败/超时两真产形；WEBVIEW.md §4.3 · 批档 2026-09-18-tool-failure-spawn-form §2.4）
  "test/shell-spawn-failure.test.mjs", // 工具失败判据同族残项批（2026-09-18 · 台账 #11 消解）：宿主 bash 产者形态收正——C-3 spawn 失败（诊断行 + `(spawn failed)`）/ C-4 超时冒号形 / C-6 输出超容 / C-5 既有退出面锚（WEBVIEW.md §4.3 · §6 D-W19）
  // VSC 不可复得类删除二次确认批（2026-09-18 台账 #92 密钥类 · 2026-09-18 台账 #93 MCP 行 · 2026-09-19 台账 #95 provider 行——F-W17）
  "test/settings-secret-delete-confirm.test.mjs", // F-W17 不可复得类删除二次确认（密钥/嵌入 key 组 + provider 行组——W17-1…W17-15 / W17-17 / W17-18 + W17-26…W17-30（W17-14/15/17 于 provider 行批同号改判·W17-17 于模型菜单批域扩 **9 档**——+`webview/model-picker.js` 入口 6）——点击不再即发 / 确认门 / 四条取消路径 / 单例·连点·重绘闭包 / i18n 双源 / 结构对账 fail-closed；MCP 组 / 模型菜单组已析出→下行两档；SETTINGS.md §2.10）
  "test/settings-mcp-delete-confirm.test.mjs", // F-W17 MCP server 行组（2026-09-19 provider 行批自主档析出——触发 = 实现轮末实读 505 ≥ 500；W17-16 / W17-19…W17-25——点击不再即发 / 确认门 / 取消两路径 / 跨入口单例 / 在位整表重绘 / i18n 双源 / 多行取目标；SETTINGS.md §3 拆分条）
  "test/model-menu-delete-confirm.test.mjs", // F-W17 模型菜单 footer 组（入口册 **#6**——2026-09-19 模型菜单批 · 台账 #97）：W17-31…W17-34——点击不再即发 / 确认门 / 端到端删盘 + apiKey 原文消失 / 取消零发值 ∧ 盘面逐字节不变 / 宿主选定取消恒绿锚；跨面夹具 = 真 webview 点击 → 逐条喂回真宿主分发 + tmp config（先例 settings-empty-no-write.test.mjs）；SETTINGS.md §2.10
  "test/activity-live-visibility.test.mjs", // VSC 子代理 live 块可见性批（2026-09-19 · 台账 #94）：出生闸去门/冻结键接管 + 出生可见性计数钮 + 内容面同口入队 + 痕七类与上行 + 窄缝四件 + 心跳/源新鲜度——T-A16–T-A32（含反例）+ 移交件面（WEBVIEW.md §5.3/§5.5）
  "test/loop-sampler.test.mjs", // init-block 批（2026-09-18）F-W19：扩展宿主事件循环采样器——常量 100/1000/1000 + 窗口起止 + 阈值边界（999/1000）+ 起停幂等 + 未启动 fail-open + 注入缝复位 + 端侧装配（probeFailureOf/overrideAdmissionIfHostBusy）+ 零 exec·I/O 扫描 + activate/deactivate 挂点——LS-1…LS-8（SETTINGS.md §2.12）
  "test/upstream-parity.test.mjs", // 批 2026-09-19-upstream-channel-availability（2026-09-20）：上行通道 VSC 对位面（F-UC7）——T-VS-U1–U7（开轮三元组 / 注入非空 / 唤醒端到端 / note 不唤醒 / 结构机检 / 回复可达 / 组合同规；§6.27.12.12）
  "test/zero-sync-exec.test.mjs", // init-block 批（2026-09-18）F-MI7 判据① 端侧半：端侧探测面两档（session-slots.mjs / peer-instances.mjs）零 child_process 直调扫描 + 域外正证 + 探测面消费者闭包 fail-closed——MULTI-INSTANCE-COLLAB.md §3.1 条①（核半 = core test/process-probe.test.mjs；N3 门禁 ⇒ 域不交）
  // 端差·显示面消差批（2026-09-20 · `docs/batches/2026-09-20-display-parity-batch.md` · 批 1 = VSC 工具卡/摘要/状态行）
  "test/webview-tool-interrupted.test.mjs", // M1 回合尾清扫未结算工具卡（CLI `sweepToolBlocks` 对位）：`finish(true)`/`finish(false)` 双路径 + 已结算卡零改写 + 跨块同清扫 + 刷新两路径不复活（先红 = 永停 running）
  "test/context-percent-parity.test.mjs", // M2 `context%` 单口径：`ctxPercentForHistory` ∥ CLI `render-frame.mjs:388-389` 公式逐字复算对拍（含对端源锚）+ `onUsage` 调用点载荷 + 渲染两路径同值（先红 = prompt_tokens 口径）
  "test/tool-output-payload.test.mjs", // M3 `[object Object]` 现场探针 A（三段链：`parseRelayPath` 不命中 ∧ relay 未认领 ∧ 直通载荷归一为串——CLI `tool-events.mjs:322-324` 先例）+ async 路对照（先红 = 对象入载荷）
  "test/advisor-card-header.test.mjs", // X2 评审轮次/模型可见：载荷 `round`/`model`（核 resolver 同源）+ 卡头 `(round N · model)` + 状态行 CLI `:145` 字面 + 降级形 / 非 advisor 零字段（先红 = 两处皆无）
  "test/tool-summary-parity.test.mjs", // X3+X7 摘要族：advisor/read/write/grep/glob/bash/默认分支 ∥ CLI `formatToolSummary` 纯函数对拍等值 + 活卡/恢复卡两路径同源 + 端差②与射程边界（verify）显式断言（先红 = 全走通用末行摘要）
  "test/tool-result-truncation.test.mjs", // X5 >64KB 截断提示：宿主事实旗标（65K/恰 64K/falsy `0`）+ 活卡旗标驱动双标记 + 恢复卡同字面（先红 = 两形皆零标记）
  // 端差·显示面消差批（2026-09-20 · `docs/batches/2026-09-20-display-parity-batch.md` · 批 2 = VSC 活动块/协议面）
  "test/subagent-note-parity.test.mjs", // X6+X11 块头注记：宿主 subKey 判据（核 child-marks 锚）⇒ done 载荷 `note` + relay `⟦ev⟧stopped` **零注记**（CLI 标尺——verb 已 stopped，无重复词）+ 承面 `— <note>`（done/interrupted——`meta.note` 单载体）+ X11 宿主真值源（先红 = 零注记面）
  "test/sync-block-stop.test.mjs", // X10 sync 块 ⏹：核 registry 只读 ⇒ 载荷 `syncLive` + 门控支 + 点击载荷（与 async 同形）+ 宿主取消路由（`cancelSyncChild` 单源）+ 零回归；#133 序修后出生面升级**真序夹具**（T-S1a 装配面零发射 ∧ T-S1b 宣告时刻 registry 已在位 = 真序两面夹 · T-S1d 链路形状 · T-S1e/T-B1/T-B2 接线机检——sync 可达性批 §2.5）
  // 端差·机制层端差批（2026-09-20 · `docs/batches/2026-09-20-mechanism-parity-batch.md` · 车道 2 = VSC）
  "test/lifecycle-hooks.test.mjs", // §2.16 端侧 Stop 钩子 + advisor-run 收口（T-LH1–T-LH9；先红 = 端侧零 `runHooks` + 零收口）
  "test/dispatch-hooks.test.mjs", // §2.17 派发面 hooks 四调用点（T-DH1–T-DH7；先红 = 零调用点/零阻断文案）
  "test/permission-gate-seam.test.mjs", // §2.20 VSC 半——门改经核 `io.ask` 缝（T-PT6–T-PT8；先红 = 核 `permission.mjs` 零 importer）
  "test/vsc-stream-rules.test.mjs", // VSC 行为/能力两则批（2026-09-20 · 台账 #130）：A 面 stream 规则在 VSC 端生效——T-A1…T-A4（装配合并/abort 端到端/子回合继承/warn 文案逐字；批档 §2.5）
  "test/scoped-rules.test.mjs", // 同批 B 面 `.cursor/rules` 作用域规则：T-B1…T-B4（三分类按序判定/JIT 注入+去重/[4] 层尾块零改/CLI 零对位；批档 §2.5）
  "test/subagent-queued-payload.test.mjs", // §2.22 同族事件载荷机检锚（T-QP1–6）：载荷逐 kind 对表 + 缓存单源 + 五路作废点（含 `⟦ev⟧stopped`——§2.29 #7c）+ 重生投影同形（先红后绿 = 收口轮变异探针——停用 stopped 路 `forgetQueued` ⇒ T-QP5 恰该路红）
  "test/nested-token-relay.test.mjs", // 嵌套 token 显示面批（2026-09-20 · 台账 #137 · `docs/batches/2026-09-20-nested-token-batch.md` §2）：内层链事件不路由（`panel-subagent-relay.mjs` 嵌套守卫——判据收窄 `nested ∧ rest 起于 ⟦ev⟧／[model]` + `ev:substrip` 留痕）——T-N2–T-N7（T-N6 = 宽判据反例锁；真链 = 真装配 `buildSpawnChild` + 真宣告 `armSyncChildAbort` + 真 webview 闭路）
  "test/render-granularity.test.mjs", // 渲染粒度对齐批（2026-09-20 · 台账 #148 · `docs/batches/2026-09-20-render-granularity-batch.md` §2）：内容行合并粒度（CLI `pushBlock` 对齐——WEBVIEW.md §5.6）——T-G1–T-G7 段数断言（tool 面按「工具名 + sub 同」并入末行 · RAW 零分隔符 / 调用行恒新行 / 降级恒新行 / kind 缺省归 text）
  // STARTUP-LATENCY 批（2026-09-21 · `docs/batches/2026-09-21-startup-latency.md` §2 · 台账 #173）：F-SL3 目录级清理判据（TRACES.md §6.4）+ F-SL2 端侧命令面（SESSION.md §6.17 D-SE38）
  "test/trace-cleanup.test.mjs", // T-SL3.1/3.2/3.4：目录级三段梯（整删零逐 .jsonl stat——计数注入 / 当天跳过 / 含 .txt 逐文件）+ 每写节流（同窗 3 连写 ⇒ 扫描 ≤1 + 在飞合并）+ 缩比存量整删幂等（T-SL3.3 语义保真 = 既有 trace-store.test.mjs D-TR10 用例零改动保绿）
  "test/session-gc-command.test.mjs", // T-VSC-SG1/SG2：`thincoder.sessionGc` 处理体（空候选/确认/驳回零删除 + 模态门 + 删除期变活拒绝行 + 汇总跳过计数）+ 命令注册/直调点机检（不消费 runSessionGc）

]
