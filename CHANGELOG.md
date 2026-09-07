- fix: 子代理块 done 后定格修复批（2026-09-07 id:14）——CLI trimSubTree done 豁免 + route* done 守卫（迟到 chunk 丢弃）；VS 冻结门三处 + id 计数器跨 resume 持久化

- fix: prompts.test 折行断言折叠化收口（2026-09-07 id:3）——双侧 \s+ 归一匹配——负守卫保持负向——锚整块/落位序断言加固
# Changelog

All notable changes to ThinCoder VS Code are documented here.

## [Unreleased]

> 开发批记录段（2026-09-05 起惯例——版本号发布时才定——见 RELEASE.md：9 月首发 = 0.9.1 时本段改头）

### Changed

- **R22 子 agent 显示趋同 CLI：底部活动面板 + 冻结入流（2026-09-07——ARCHITECTURE.md R22 节）**：活动块从 #messages 迁独立固定底部面板（`webview/activity.js`——新模块：建块/块头/⏹/elapsed ticker/终态冻结）——布局四层垂直序 header/messages/#panels/#subagent-activity/toolbar，面板空时隐藏不占高、内部自滚、消息流滚动钉底不动面板；块头升级 `[▶/✓/⏹ key · async/sync · model · Ns · turn n/m] 当前工具/状态词` + 折叠 tail-3 dim（elapsed = 本地事件管理 1s ticker——CLI 同式不空转——测试假定时器 seam）；终态冻结入流（完成/stopped/error → 面板移除 + #messages 尾冻结折叠块——身份头 + 内容保留可展开 + report preview ≤8 行 dim 落流——escalate/stopped 无 preview——CLI parity）；§17 挂起例外保持（settled 驻留面板 + awaiting digestion 头部——digest done 补发/会话退出 freeze 才冻结）；行面板 #subagent-panel 保留（裁定在案）；150 裁裁定：冻结块计入 #messages 裁剪、活动面板无独立上限（池并发天然有界）。turn 降级口径实测落地（D-R22b：现有 onSubagent/状态事件不携 turn——池条目终态通知顺带 final turn/maxTurns（subagent.mjs）——冻结身份头显示；逐轮跳动需新通道不擅建——已报告）。webview 端零桥新增（subagent/toolPanel 消息面不变）。测试：ui.test.mjs R22 组 + 既有 subagent 描述改 R22 形态（38 绿）+ suspension T-S14 R22 断言 + chat-panel/advisor-webview 零回归。L0+ 验证绿——L2 全量由父侧链终验跑。

- **R17 会诊/飞刀完全异步化（AGENT-LOOP.md §25 VS Code 镜像——2026-09-06/07）**：consult_check 退役（digest 自动注入）；escalate async 化（subagent-escalate-async.mjs——other 池——async:false 保留）；T-R17a..r 镜像全绿（VS L2 1301/1301）
- **记账路径 join→resolve 双前缀修复（R-bug VS 镜像——2026-09-07）**：同款记账点 resolve 化（若镜像端存在——实测同修）
- **R19 跨会话历史检索 + 检索族消歧（2026-09-06——SESSION.md §13 双端同批——VS Code 面）**：`agent-tools/read-history.mjs` 加 `path` 参数（缺省 = 本会话零变化）：path = 完整会话文件路径 → 读目标文件 history 线 + 同 filter 面（role/keyword/tool/since/until/limit/direction——共享 queryMessages）；path = `cwd:<目录>` → 发现面（会话文件 = `~/.thincoder/sessions/<sha1(cwd)>.json.N`，与 CLI 互通——**含历史 12/16 位短哈希命名候选（只读覆盖，不触发改名迁移——NF-R19）**）——每槽摘要行含**槽号 + 完整文件路径** + title/消息数/updatedAt，时间序降序 + 两步交互引导（评审 #2 寻址字段）；单槽检索行扫护栏 **READ_HISTORY_SCAN_MAX = 200,000 行**（流式扫计数早停——超限返回定稿文案 `{"error": "session too large — refine keyword or since/until"}`，不读全文不解析）；目标文件只读（损坏/缺失错误返回不 rename——T-R19.3d）；`checkpoint` 动作面核验含 `versions`（评审 #8——族表句不改）。消歧总纲（D-R19b 逐字稿）落 read_history 描述尾段；互指尾句补 recent_changes（会话级历史用 read_history）/memory search 段（会话消息历史不在 memory——用 read_history——`memory-tool.mjs`）/doc_search + code_search（查设计决策用 doc_search——查实现用 code_search——查会话用 read_history——`tools/code.mjs`）；edit-semantics 六要素 ③ 路由表 read_history 移出 ROUTE_NA（有同行——族表句承接路由元素）。测试 read-history 家族 +8 例（T-R19.1/2/3/3b+3c/3d/7/5/6——含护栏文案逐字断言）。L0+ 验证绿（read-history 25/25 + prompts/edit-semantics 126/126）——L2 全量由父侧链终验跑。

- **R18 长输出命令先落盘纪律条款（2026-09-06——AGENT-LOOP.md §26 双端同批——VS Code 面）**：`src/prompts/system.md` 工具纪律区（Rules 段）插 D-R18 条款逐字稿（镜像锚——本端照抄一字不改——字节比对程序验证 = true）+ 日志位置/清理执行注（评审 #7——OS 临时目录或 `~/.thincoder/` 类非工作区位置、查毕删除——条款逐字文未改）。测试 prompts.test.mjs +2 例（T-R18.1 条款逐字锚 + T-R18.2 执行注锚 + 条款恰好一次）。L0+ 验证绿——L2 全量由父侧链终验跑。

- **测试分层 Phase 3：镜像转 slow + 存量清理（2026-09-06——TESTING.md §1 双端批收官——VS Code 面）**：行为镜像用例 35 案转 slow 门（scheduler/eng-delivery/subagent-async/execute——端差异面留快层）；删除迁移锁/元测试/同锚多断 9 条清单（1206→1204，差额 -2 对账）；红线收窄镜像（system.md + 根 METHODOLOGY.md）。测试 T-T4b（镜像归册 + 端差异面留存）+ T-T5。实测快层 **11.6s**（较 Phase 2 再降 4.7s），test:full 1204/1204 全绿。

- **测试分层 Phase 2：eng-coder 首次实现降 L0+（2026-09-06——TESTING.md §1 D-T3 镜像面）**：`engineering-sub.md` 同锚修订（L0+ 首次实现 / L1 收窄显式升级档 / 报告义务句——与 CLI 逐字一致）；测试 T-T4 镜像断言；ARCHITECTURE.md「测试基建 Phase 2」变更段。实测快层 16.3s 全绿 1206 用例。

- **测试分层 Phase 1：slow 门移植 + 快层归册（2026-09-06——TESTING.md §1 双端批——VS Code 镜像面）**：新建 `test/slow.mjs` + `slow-gate.mjs` + `run-fast.mjs` + `run-full.mjs` + `files.mjs`（套件清单单一来源——替代 package.json 内联 65 文件清单）——机制文件与 CLI 逐字一致（防漏拦截：未标 slow 超阈硬红）；`package.json` test → run-fast、新增 test:full；48 条 >1s/重 IO 用例归册（只加标记零删除）。**实测：npm test 74.4s → 15.5-16.2s（≤30s 达标），test:full 1205/1205 全绿**。存量 flake（subagent-async T5/T5b + suspension T-S1）与 queue-user-message 孤儿清单问题已登记 TODO。

- **拆分判据修辞防博弈加固（2026-09-06——METHODOLOGY.md 2026-09-06 变更条双端同批）**：根注入体 METHODOLOGY.md 同文同步（文件档判定表 >500 必须拆无例外 / 早期预警线-不可协商底线定位 / 相对大小封堵句 / 动机节封口句 / 反例档案新行）；`methodology-template.md` 三处替换（"fallback, not a goal" 封口 / "the primary yardstick" → "the early-warning line" / "File caps (fallback)" 段改判定表 + Relative size 封堵段——旧句零残留）。测试 T-S1/T-S2 镜像断言（prompts.test.mjs）。存量 17 个 >500 测试文件随 CLI 侧 26 个一并登记 TODO 拆分轮。

- **question 工具使用抑制 + 卡片渲染修复（2026-09-06——AGENT-LOOP.md §22 双端同批——用户实测本端过度提问/大段文字/一条多问/卡片换行折叠）**：`question.mjs` 内联描述与 CLI `question.md` 逐字全量对齐（补 "Use sparingly"、memory 提示等既有缺失 + 三条约束锚——消除两端描述漂移）+ execute 同上限机械校验（question >100 字符 / options >4 条返回错误串、不调 onQuestion——用户裁定值）；prompts 三文件镜像锚（engineering.md Questioning Style 两条 + system.md 确认门形式句 + discipline.md 反模式扩展）；`.question-text` 加 `white-space: pre-wrap` + `max-height: 40vh` 卡内滚动（多行问题不再折叠成一坨）。测试 `test/question.test.mjs` 6 例（T-Q2/3/4/5/5b/8——描述锚断言 + 超限拒绝 + 边界/非数组透传 + CSS 断言）。

- **subagent action:'check' 删除（2026-09-06——AGENT-LOOP.md §19.8 D-CH1..4——用户裁定"check 是冗余 API"）**：VS 面子代理工具由五动作降为四动作（spawn/status/cancel/escalate）——subagentCheck/MAX_ASYNC_CHECKS/wakeOnAsyncSettle/purgePending 退役（subagent-actions.mjs）；subagent-spec.mjs 枚举删 "check" + 删 n 参数 + Async spawn 段尾部以 D-CH2 锚句逐字替换 §19.7 D-A2（fail-when-unchanged——两端各自内容断言）；subagent.mjs 派发/只读分类/错误文案同步；check 等待者池唤醒循环清理（subagent-async.mjs——自动通道 collectSettledAsync/pending 注入/consumed 墓碑保留——§20 dependsOn consumed 终态语义不变）；n 计数持久化删除（agent.mjs/run-stages.mjs——_asyncCheckN 零残留）；main.md :21 改写自动送达口径（no polling 引导——删除后指向不存在动作会复现阻塞场景）；调度/授权/工具注释的 check 引用同步。测试：check 域用例删 16 条（T3/T4/T12-14/T-M2..M4/T-M10/T-F1/T-F1b/T-SD14 改自动通道/T-SL2 两处 check 断言/advisor 处置守卫测试/advisory#3 check 半段/子依赖项——见交付报告逐条），依赖 T-SD14 改自动送达消费（consumed 墓碑语义经 collectSettledAsync 保留验证）；D-A2 断言在位改为 D-CH2（新增旧锚句零残留断言）；T-M7/T-M8/T-F2/advisor#1 改自动通道消费；edit-semantics 描述锚（⑤ 阻塞性）改同步 spawn 口径。
- **subagent 工具描述两端对齐 + async 收尾引导（2026-09-06——AGENT-LOOP.md §19.7 D-A1..A4）**：VS 侧 description 以 CLI 权威版（§19.7 D-A1——CLI 2026-09-05 完整版）逐段对齐——统一 "ONE tool, FIVE actions" 头部（动作行/Async spawn 段/§20 调度段/§19.5.6 touched-files 措辞照权威版逐字）；仅保留有意差异：无 panel action（§19.6 AC-P4——保持五动作）；Async spawn 段尾部插入 D-A2 逐字锚句（回合自然收尾、unchecked 结果自动到达——防模型自发 status/check 轮询挂起——D-A4 防再发：两端各自内容断言）。测试：subagent-tool.test.mjs T-M12/T-E16 措辞同步权威版 + 新增 D-A2 锚句逐字断言（fail-when-unchanged）+ edit-semantics.test.mjs 两处描述锚更新。
- **design token 防伪层删除（2026-09-06——ENGINEERING-MODE.md 2026-09-06 段，用户裁定"安全剧场"）**：advisor.mjs 删 createHmac/TOKEN_SECRET（HMAC 签名/验签/默认密钥）——token 改无签名流程凭证 `uuid:expiresAt`（TTL fail-closed 保留、槽位匹配 `_engDesignTokens.get(designId) === token` 不变、持久化零变更——存储语义不动）；存量 3 段签名 token 一次性失效（格式错拒绝→需重新评审——已接受迁移代价）。测试：advisor.test.mjs 删防伪断言（2 段格式通过/旧 3 段格式错拒绝/错槽 token 拒绝/TTL 窗口 2 段构造/回显正则 2 段）；subagent-tool/subagent-async/eng-delivery 测试辅助 signedToken → unsignedToken；AC-TO1/2 零残留；授权链（评审→签发→spawn 解锁写）回归绿。

- **会话"当前槽位"按端分离（R4——2026-09-05——SESSION.md §10 引用，CLI 同批）**：本端 end marker `{manifest}.vscode`——面板恢复决策改 resumeSlot（本端记录/一次性继承/全新分配——ensureSlot/status/onProjectChanged 同点）；会话列表高亮按本端记录（D-5）；newSlot/switchToSlot/pick/delete 维护 marker（删记录槽置空、重绑幸存槽写回）。行为差异：无 CLI legacy 单文件兜底；全新目录首用不预写空会话文件（claim 先行、首保存落盘）。L2 1196/1196。
- **edit 空白差异自动落点镜像 + 编辑纪律三条（2026-09-05——CLI TOOLS.md §14.2 P15.11 + AGENT-LOOP §21 扩展注 2 镜像）**：edit not-found 唯一空白差异窗口自动落点 + note；discipline.md 三条纪律（新鲜读/hash 来源/重试上限）。测试 P15.11a-d + T-N1.8。
- **git 工具 add/rm/commit 多路径（2026-09-05——CLI parity）**：`path` 空格分隔多路径（git add a b c）——git.mjs 三分支 split(/\s+/) + path 描述尾注（保原子串断言）；镜像测试用例（add/rm/commit 多路径覆盖——git.test 21/21）。

### Changed

- **settings 工具镜像（2026-09-05——CLI SETTINGS-TOOL.md 双端同批）**：settings list/get/set——共享 ~/.thincoder/config.json 写盘 + 热应用；敏感遮罩；类型表自动派生（config-io 收拢 AGENT_DEFAULTS/TRACES_DEFAULTS 单一来源——loadAgentSettings 去内联默认——方案 A）；isReadonlyAction 动作分类。测试 T-S1.*v 6 例 + config-io 48/48。
- **P-SL2 停滞机械检测镜像（2026-09-05——CLI AGENT-LOOP §21.1 扩展注 P-SL2 双端同批）**：subagent-scheduler.mjs `detectStall`/`stallErrorText`——混合边环形等待停滞（无 running + queued blocker 闭包无外逃）→ check/status 守卫明确报错列阻塞链（cancel 破环引导）；判据收窄零误报（queued ≥2 + 每 queued ≥1 blocker + depc 排除）；正常路径输出逐字不变。测试 T-SL2 ①-⑥ 追加（scheduler 19/19 + 全量 1135/1135）。
- **普通模式两段式镜像（2026-09-05——CLI AGENT-LOOP §21 F-N1.5/F-N1.6）**：main.md 规模批次默认委托 coder 锚（T-N1.9）+ 任务书七字段标准锚（T-N1.10）。

### Changed (追加——2026-09-04 后半批)

- **advisor 角色定位锚（AGENT-LOOP.md §12.1 镜像）**：四模板插"Your role"段（独立评审者/证据纪律/边界/中立——与 CLI 同锚）。
- **子代理人格锚（AGENT-LOOP.md §7.3 镜像）**：coder.md（IMPLEMENTER）+ consult-base.md（证据纪律）——与 CLI 同锚。
- **审计范围引导（AGENT-LOOP.md §18.13 镜像）**：auditTaskBook 加机械预算句 + engineering-sub.md 审计 quick 档。
- **工具输出预览保头保尾（CLI §5 镜像）**：run-helpers.mjs buildHeadTailPreview——与 CLI 同语义。

### Changed

- **子代理零 git（AGENT-LOOP.md §18.5）**：VS Code 端与 CLI 对齐——explore/plan 描述“Receives git context auto-injected”删除，改为“No git context injected—evidence from read/glob/grep and the task book”（本端实现从未注入，现与承诺一致）；explore.md 删除 git 注入声明/命令承诺；审计任务书（auditTaskBook）追加零 git 范围权威声明（`_touchedFiles` 为审计范围——工作区未列改动不作超清单依据）。

### Added

- **subagent 异步化 + 批确认（AGENT-LOOP.md §15/§16）**：async spawn（槽位队列 / subagent_check / 上限 4）+ approval 合并询问（approveAll/oneByOne/deny 三选项 webview UI）
- **deepseek 400 对齐（PROVIDER.md §14.7）**：escape v5（sanitizeLoneSurrogates 孤立代理 → U+FFFD + arguments/reasoning_content 覆盖 + hex odd-run 修复）；UTF-16 安全截断 5 处（context doc 注入 / code.mjs 预览 / offloadToolResult / compact 序列化）；续写构造对齐（prefix 过滤工具消息 + ≤8 文本 + reasoning_content 回传继续而非跳过 + 失败 _warnings）
- **压缩可见性（CONTEXT-COMPACTION.md §7 D-C3）**：onCompressStart/onCompressFail 回调 + webview 压缩状态行（Compressing context… → Compressed: N tokens freed (Xs) / failed；3 次失败降级说明）
- **批量形态引导**：edit/apply_patch 描述批量句（两端 parity）+ system.md/engineering.md/main.md 同步
- **开发体验三项（TOOLS.md §10 / PROVIDER.md §15）**：① lint 零依赖化（eslint 全套删除 → check-syntax 197 文件，workflow/vscodeignore 同步）；② 工具作用域限制移除（execute/git 边界断言删除，描述同步）；③ 模型上下文可配置（settings.json providers[].context K 单位——providerSpec 拷贝覆盖、压缩阈值/状态栏跟随、migrate 透传）
### Added

- **MCP Streamable POST 误判修复（CLI parity，MCP.md §4）+ 面板 [Edit]/[Test]**：http transport 增 postOnly 标记——GET SSE 405 降级后的纯 POST 模式 `isAlive()` 不再误判死（glm-websearch 类 server 的 reconnect failed 根因，与 CLI 同构）；`probeMcpServer` 镜像导出（一次性探活 initialize + tools/list，零副作用）；MCP 面板每行新增 [Edit]/[Test] 按钮——edit 复用添加表单（name 锁定、逐字段预填、token 字段、headers 逗号分隔提示 `k=v, k2=v2`），test 结果（工具数/延迟/错误透传）渲染到服务器行下；config-io 增 `updateMcpServer` 原位更新（数组序保持）；**[Reconnect] 死按钮修复**——webview 一直在发 `reconnectMcp` 消息但路由表无 case（路由拆分时丢失），面板重连按钮此前完全无效；token 一等字段（connect 链合成 `Authorization: Bearer <token>`，显式 headers 优先）随面板 token 表单字段一并落地

### Changed

- **multi-design 并行令牌（designId slots）**（CLI parity）：eng-coder 子 agent 多设计并行 spawn 各带 `{designId, token}` 互不覆盖
- **memory_delete 工具**（CLI parity）：三层记忆条目删除

### Added

- **MCP Streamable POST 误判修复（CLI parity，MCP.md §4）+ 面板 [Edit]/[Test]**：http transport 增 postOnly 标记——GET SSE 405 降级后的纯 POST 模式 `isAlive()` 不再误判死（glm-websearch 类 server 的 reconnect failed 根因，与 CLI 同构）；`probeMcpServer` 镜像导出（一次性探活 initialize + tools/list，零副作用）；MCP 面板每行新增 [Edit]/[Test] 按钮——edit 复用添加表单（name 锁定、逐字段预填、token 字段、headers 逗号分隔提示 `k=v, k2=v2`），test 结果（工具数/延迟/错误透传）渲染到服务器行下；config-io 增 `updateMcpServer` 原位更新（数组序保持）；**[Reconnect] 死按钮修复**——webview 一直在发 `reconnectMcp` 消息但路由表无 case（路由拆分时丢失），面板重连按钮此前完全无效；token 一等字段（connect 链合成 `Authorization: Bearer <token>`，显式 headers 优先）随面板 token 表单字段一并落地

### Changed

- **multi-design 并行令牌（designId slots）**（CLI parity）：eng-coder 子 agent 多设计并行 spawn 各带 `{designId, token}` 互不覆盖
- **memory_delete 工具**（CLI parity）：三层记忆条目删除

## [0.8.9] — 2026-09-01

### Added

- **Checkpoint 镜像（与 CLI 存储统一）**：VS Code checkpoint 从 git stash 改为全量副本（`~/.thincoder/checkpoints/{cwdHash12}/`，cwdHash 归一化——跨端快照互通）；git 工具补齐 11 个 action（clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv）；commit 后清空该项目 checkpoint；bash guard 对齐 CLI（宽匹配 + 全量副本 + rewind 指引）

### Changed

- **跨端会话共享一致性（会诊 4 模型收敛）**：sessionStart 打点（saveLines 只赋一次）；F2 写前磁盘校验（同会话并发追加 → 轮转 .bak 保留）；legacy transient 读+写双点过滤；contextHistory 机读线判定（length>0）；listSlots 懒加载元数据
- **提示词同步**：`system.md` 追加操作并行化纪律条款（Parallelize aggressively——独立只读调用批并行 / `edits` 数组多文件编辑 / 独立子项目拆分子 agent（F7 触发条件：不共享文件 + 无交叉依赖 + 各自有测试）+ 不并行边界（同文件写入 / 依赖链 / 审批风暴 / 同仓库并发 git / 有状态操作）+ 微操作不并行）——与 CLI byte-identical

### Fixed

- **发送前 hex-escape 中和缺失（deepseek-v4-flash 400 "unexpected end of hex escape"）**：主 agent 发送路径（provider.mjs chat()）此前只做 stripImages/normalizeToolPairing/stripLocalMessageFields，缺 CLI core.mjs 的 `escapeMessages` 防御——历史 tool 输出含字面 `\\x`/`\\u` 不足位序列（如 "neutralizes invalid literal \\x/\\u sequences"）时，严格网关（Kimi/DeepSeek v4-flash 实测）把 content 二次解码 → 整请求 400，会话不可用。修复：新建 `src/escape.mjs`（CLI parity，与 CLI `src/escape.mjs` 同构），`chat()` 发送前统一应用 `escapeMessages`（strip + double）；advisor 的 `escapeLiteralEscapes` 副本迁移至该模块（re-export 兼容）。真机会话数据验证：1184 条历史 48 处毒序列全部中和，请求体 JSON 合法。

### Fixed

- **发送前 hex-escape 中和缺失（deepseek-v4-flash 400 "unexpected end of hex escape"）**：主 agent 发送路径（provider.mjs chat()）此前只做 stripImages/normalizeToolPairing/stripLocalMessageFields，缺 CLI core.mjs 的 `escapeMessages` 防御——历史 tool 输出含字面 `\x`/`\u` 不足位序列（如 "neutralizes invalid literal \x/\u sequences"）时，严格网关（Kimi/DeepSeek v4-flash 实测）把 content 二次解码 → 整请求 400，会话不可用。修复：新建 `src/escape.mjs`（CLI parity，与 CLI `src/escape.mjs` 同构），`chat()` 发送前统一应用 `escapeMessages`（strip + double）；advisor 的 `escapeLiteralEscapes` 副本迁移至该模块（re-export 兼容）。真机会话数据验证：1184 条历史 48 处毒序列全部中和，请求体 JSON 合法。

## [0.8.8] — 2026-08-31

### Added

- **edit 数组形态**（CLI parity）：`edits: [{path, old_string, new_string, replace_all?}, ...]` 一次多文件原子替换（先全量检查所有替换可执行，任一失败全不写）；与单文件参数互斥

### Changed

- **历史懒加载单页 50→20 条**（CLI parity）：向上滚到会话顶加载更早一页的粒度更平顺，两端同节拍
- **RELEASE.md**：发布后轮询确认残留清理（2026-08-31 用户裁定废止——Marketplace/Open VSX 审核队列天然滞后，publish 正确返回即发布完成）

### Tests

- 804/804 全绿（edit 数组原子性/互斥 +3）
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.8.7] — 2026-08-31

### Fixed

- **模型菜单飞出层实时过滤（GitHub #4，CLI picker 同语义）**：provider 飞出层加过滤框（大小写不敏感子串）——输入即收窄，↑↓ 高亮、Enter 选中、无匹配提示；**点击已展开的 provider 行不再误关飞出层**（此前"点了没反应"体感）。新 i18n 键 `model.filterPlaceholder` / `model.noMatch`；happy-dom 3 用例（收窄到一/无匹配提示/点击不关闭）

### Changed

- **提示词同步**：`system.md` task 跟踪条款升级为 "EVERY tier — even Small"（与 CLI byte-identical）

### Tests

- 786/786 全绿；eslint globals 增补 webview 测试环境（Event/MouseEvent/KeyboardEvent）

## [0.8.6] — 2026-08-30

### Changed

- **会话人读线落盘瘦身（与 CLI 0.12.51 同款 `slimForDisplay`）**：`saveLines` 写入时对人类线 `history` 做 copy-on-write 映射——tool args 截 300 字符、tool 结果截 500、多模态图剥 base64 只留 text part；**机读线（contextHistory）一字不动**（provider 前缀缓存/配对零风险，与 CLI 逐字节同契约）；`historyWindow` 只渲染字符串 content（从不解析 arguments），瘦身后 webview 显示安全
- **提示词同步**：`engineering.md` / `eng-coder.md` 与 CLI 端 byte-identical（含工程模式 UI/交互决策全链路落档条款、测试文档口径）

### Tests

- 新增 `_saveLines` 瘦身断言：人类线 args 301 / 结果 526 / 图剥除；机器线 args 3000+ / 结果 2000 / 图保留（786/786 全绿）

## [0.8.5] — 2026-08-29

### Fixed

- **工程模式下模型仍委托 role='coder'（跨端污染，用户实测）**：engineering 的事实源曾是全局 config.json `agent.engineering`，CLI 端 `/eng` toggle 也写同一字段 → 两端互相翻转对方的工程模式（CLI 关掉一次 /eng，VS Code 工程会话立即降级为普通模式、subagent schema 回到 coder 枚举）。现 **engineering 与 advisor.guard 均为会话级（slot 权威）**：面板 ENG/GUARD toggle 先写当前会话槽位（`setSlotEngineering`/`setSlotAdvisorGuard`），config.json 保留为 CLI 兼容镜像（slot 写失败不阻断镜像写）；setup 读取优先级 slot 显式值 > config 兜底 > false（旧槽位无字段才回退 config，兼容锁定）；`eng` 工具翻转后经 `engPersist: { cwd, slot }` 通道持久化槽位（top-level run 专属，subagent 不携带）；`agentState()` 每轮把 live engineering/advisorGuard 随 `saveLines` 落盘（advisor 兄弟键 provider/model 往返保留；abort/finally 保存不伪造字段——legacy 槽位保持无字段状态以维持 config 回退）；设置面板快照 `agentSettings(session)` 合并槽位值，ENG/GUARD 按钮回显会话态而非全局态。CLI 侧同构改造见 CLI 0.12.50

### Changed

- **METHODOLOGY 三缺口修复**（与 CLI 0.12.50 同步）：需求文档三层结构落地（总目标/功能用户故事/非功能标准）；交付评审补测试文档口径（无覆盖=评审不通过）；METHODOLOGY.md 缺失警告点名后果（引用悬空+硬流程失效），删除 "eng tool's write mode" 陈旧指引
- **工程模式 UI/交互决策全链路落档**（用户报告"agent 无视讨论过的 UI 设计"）：设计文档要素扩项——涉及界面时必须收录与用户达成的每条 UI/交互决策（布局/流程/控件行为/状态反馈），未定标 open 不静默发明；eng-coder 任务书必须复述这些决策（或指向设计文档具体章节）——子代理零上下文，留在聊天里的决策永远到不了它；`eng-coder.md` 执行侧闭合——缺失的界面决策停下报告，不自行发明。与 CLI 0.12.50 byte-identical

### Tests

- 新增 `test/eng-session.test.mjs`（18 断言组）：slot setter 往返（含 advisor null→对象升级、兄弟键保留、未知槽位安全 false）；panel-messages 双写（slot+config、slot 失败不阻断）；**核心回归锁定——slot engineering=true + config false → eng-coder 枚举组**（THE reported bug）、slot 无字段 + config true → 回退（compat lock）、slot 显式 false 压过 config true；agentState→saveLines 持久化（含 abort 保存不 pin false）；eng 工具 engPersist 通道（含 subagent 无通道仍翻活态）；agentSettings 快照合并（含无 session/坏槽位回退）

## [0.8.4] — 2026-08-29

### Fixed

- **设置面板整包回写清空 advisor 配置（GitHub #3，数据丢失）**：面板数据源是 webviewReady 时推送的旧快照（CLI `/advisor` 写盘后扩展无感知），任意控件 change 触发整包保存时 advisor 槽位为空 → 合并层把 `saveAgentSettings` 的对象级替换误当"缺省=不合并"，CLI 写入的 advisor provider/model/thinking/reasoningEffort 被静默清空。三层修复：① wire 层空槽位发显式 `null`（postMessage JSON 序列化丢弃 undefined 键——"槽位缺失"与"显式清空"必须可区分）；② 合并层 advisor 改字段级合并（缺键从磁盘回填、`null`/`''`= 清空删除、timeoutMs 透传保留手写值）；③ 面板打开即拉新（`openSettings` → `getAgentSettings` → 扩展重读盘推送 `agentSettings` → 落地后渲染，250ms 超时回退）。测试矩阵锁定（缺键保留/显式清空/全量替换/盘值直达 DOM）
- **静态 effort 档位静默不保存**（交付评审发现）：`#adv-effort` 与会诊行 `.consult-effort` 由 innerHTML 静态渲染、不在任何绑定路径——只有 model 选过之后替换出的 select 才带监听，用户只改档位不保存。修复：build 后统一补绑 + 回归测试
- **粘贴图片发送后 AI 收不到（GitHub thincoder#3）**：两个 bug 叠加——① `webview/send.js` 用 `ctx._pastedImages = []` 重新赋值，孤儿化了 chat.js 按引用共享给 autocomplete 的原数组（UI 标签照常渲染、send 却读到新空数组），webview 生命周期内只有第一次粘贴+发送带图；② `savePastedImages` 零调用者 + 注入块取 history 末尾当用户消息（实际是 transient 时间提醒），图挂错消息且每轮重发。改为方案 B（文件通路）：webview 传 dataURL → 扩展端落盘 `<cwd>/.thincoder/tmp/paste-*.<ext>` → 用户消息文本追加 `[Attached images: …]` 指针 → 模型调 `read_image` 走工具通路带图进载荷；send 原地清空保引用身份，注入块改挂在 pushReal 返回的用户消息引用上（不碰 transient）。测试 image-paste.test.mjs 11 例
- **设置按钮双绑定**（交付评审发现）：settings.js 与 chat.js 各绑一次 → 打开面板每次触发两遍。修复：单点绑定（chat.js 工具栏接线）
- **撞轮数墙后拒绝继续会丢整轮**（发布后复评发现，CLI agent-turn.mjs parity 缺口）：ContinueError 弹"Continue?"卡后用户选 Stop 的退出路径跳过了 catch 块的落盘保存——用户输入 + N 轮工作只存在内存，切会话/重载即丢失。修复：finally 块无条件落盘保存（对齐 CLI finally 无条件 `saveSession`），回归测试锁定（maxTurns=2 + 选 Stop → 会话文件含用户输入与部分产出）

### Changed

- `config-io.mjs` 超出 500 行硬限（新增合并逻辑后 516 行）→ 拆分：preset 表 `config-presets.mjs`（零依赖）、迁移核心 `config-migrate.mjs`；`config-io.mjs` re-export 保持全部 import 站点兼容
- **非光栅图片收图时拒绝**（评审收尾）：粘贴/附件入口改光栅白名单（png/jpeg/gif/webp），svg/heic/bmp 当场 toast 提示（`paste.unsupportedFormat`）——不再产生"chip 显示但发送后静默消失"的路径
- `agent/setup.mjs` 超出 300 行建议线（337 行）→ 运行期 user reminder 组装（AUTO/permission、时间注入、编辑器注入、图片指针）抽到 `agent/setup-reminders.mjs`（setup.mjs 264 行）

## [0.8.3] — 2026-08-28

### Changed

- System prompt: added two constraints — (1) decide what's right before deciding what's smallest; (2) expose approach tradeoffs when confirming understanding. Targets the "smallest change" shortcut habit.

### Fixed

- **Ctrl+F 会话搜索白屏**：长会话搜索时每次击键全量扫描 + 强制布局（10 万字符 × 高频词实测 166ms/键、爆出 4000 个高亮节点）→ 主线程阻塞呈白屏。修复三件套：150ms 防抖、mark 上限 500（计数 N/500+）、搜索不自动滚动（仅跳转时滚动）；顺带补 `search.*` locale 键（此前显示裸键名）；回归测试 4 例（search.test.mjs）
- **会话运行中切换的三重竞态（GitHub #2/#5）**：① switchSession/newSession/deleteSession 运行中放行 → 旧 turn 的 stream/complete 灌进新会话视图（"思考串台"）；② 保存链每次取当前 slot → 切换后 A 的整轮内容写进 B 槽（"输出写错会话文件"）；③ 中间态只存 webview DOM → 切回展示丢失。修复：三处运行中守卫（warning 拒绝，对齐项目切换模式）+ `saveLines`/`_generateTitle` 加 slotOverride（turn 启动时绑定槽位，纵深防御对标 onDistilled 既有模式）；守卫测试 3 例（真实慢 turn + 跨槽零污染断言）

## [0.8.2] — 2026-08-28

### Fixed

- **edit 工具 CRLF 偏移坐标系错位**：编辑器路径用 LF 域偏移调 doc.positionAt（期望 CRLF 原文偏移），错位量随行号线性增长，导致行粘连/截断/重复。改用 lfOffsetToRaw 偏移映射，并顺带修 6 处同族隐患（replace_all 丢 CRLF、read/hashline_edit 哈希域不一致、BOM 双写、getOpenDoc 大小写 split-brain、insert_after 混合 EOL 注入、write 编辑器分支行尾还原）

## [0.8.1] — 2026-08-28

### Added

- **GLM-5.3-Flash 模型支持**：智谱 2026-08-26 发布的原生多模态 Flash 档位模型——1M 上下文 + 128K 输出 + 文本/图片输入，模型选择器可选（不改默认预设）
- **版本号切 CalVer**：`年份.月份.月内计数`（2026=0、8月=8、月内第1版）——从 0.1.52 切到 0.8.1（0.1→0.8 前进，规范见 RELEASE.md）

## [0.1.52] — 2026-08-27

### Fixed

- **checklist 工具坐标系断裂**：`add` 返回任务 ID、`mark` 却只收列表位置 index——agent 拿 ID 定位不到条目、只能猜 index，误标无关条目（线上事故）。修复：`mark` 加 `id` 参数（优先于 index）；auto-ID 按「最大根号+1」分配（含 `checklist-done.md` 双文件扫描，归档 ID 恒占位不复用）；历史重复 `T[\d.]+:` 前缀读入即归一；标记父任务 done 时子任务非全 done 则拒绝（防静默丢弃子树），全 done 则递归归档整棵子树

## [0.1.51] — 2026-08-26

### Fixed

- **编辑工具 CRLF 行尾写回丢失**：`apply_patch` / `insert_after` 在 Windows CRLF 文件上写回全部被转成 LF——现按"首个换行符类型"检测原文件行尾并原样恢复；`edit` / `hashline_edit` 对含 CRLF 的 `new_string`/`new_content` 先归一化再转换，杜绝 `\r\r\n`（edit 的行尾恢复本版已有，本版补齐归一化缺口）
- **`old_string not found` 黑盒报错**：失败时返回相似度最高的 top 3 候选行（行号+预览+LCS 相似度，阈值 0.5，多行 old_string 只对首行并标注 `old_string line 1:`）
- **advisor 块标题显示实际使用的模型**：面板消息桥 `onToolPanel` 转发 postMessage 时补透传 `model` 字段（0.1.46 起发射端/渲染端已实现、桥丢失致标题模型恒空的断链修复）；补桥字段回归测试与 webview 标题渲染测试

### Added

- **`read` 工具 `hashes` 参数**（CLI 对齐）：返回行 SHA256 哈希——此前 hashline_edit 引导"先 hashes=true 读"但本端 read 不支持，该工具实际不可用；现恢复
- **`write` 行尾语义**：覆盖既有文件按原行尾恢复；新建文件默认 LF，同目录多数派为 CRLF 时跟随
- **`hashline_edit` 编码损坏探测**：文件含 U+FFFD 时结果追加警告，不阻断

### Changed

- 候选相似度 LCS 计算复用模块级 DP 缓冲

## [0.1.50] — 2026-08-25

### Fixed

- **安全修复：subagent 变形 role 绕过工程模式门禁**——`role="Coder"/" coder"` 等非精确字符串穿透两个模式门禁（精确比较），fallthrough 到全工具/无 overlay 子代理，绕过设计评审与 design token 拿到完整写权限。修复：execute 入口 ROLES 白名单，未知 role 直接 throw（fail-closed）；防回归测试锁定 7 种变形值 × 两种模式
- IK9UZ8 思考型模型标题生成失败：三格式禁思考（openai thinking / anthropic thinking / google thinkingConfig）+ max_tokens 30→100——思考不再吃光输出预算致标题为空（CLI 3c1815e 对齐）

### Docs

- Settings 6 份历史批次文档合并为 `SETTINGS.md` 现行权威源；文档状态修复（13 处"待评审"→"已实现"）

## [0.1.49] — 2026-08-25

（vsce publish patch 自动 bump 版本；内容同 0.1.48——含评审超时配置/64K/蒸馏异步 send 按钮修复/sleep 删除）

## [0.1.48] — 2026-08-25

### Added

- **评审超时可配置**：`agent.advisor.timeoutMs`（默认 600s，原固定 300s）——运行期读取，非法值回退默认；设置面板保存 advisor 字段时不再丢弃手写 timeoutMs
- **主 agent 轮次上限默认 100 → 200**；**explore 子 agent 去掉 30 轮硬帽**（直接用 `subagentTurns`）

### Changed

- **工具输出限制全链路 16K → 64K（65536）**：落盘阈值/preview、advisor 内部截断、实时显示（20K→64K）、历史页工具卡（2K→64K）全部对齐——大输出不再被过早落盘/截断
- **轮末探索蒸馏异步化——send 按钮立即恢复**：`onComplete` 先于蒸馏发出（不再等第二次静默 LLM 调用）；蒸馏异步完成（专用 distillSignal，仅 dispose/会话切换中断），下一轮开头 await，压缩版经 `onDistilled` 落盘（slot 校验防串会话）

### Removed

- **`sleep` 工具删除**：编程场景零真实使用，且工具说明误导模型在同步工具（advisor/subagent）后 sleep 空等——白耗 10-300 秒；等待需求改走 bash 内联命令；内部速率限制/重试退避不受影响

## [0.1.47] — 2026-08-24

### Changed

- **工程模式发起权归用户（对齐 CLI v0.12.42）**：设计评审仅用户发起（agent 只准备+提醒「设计就绪」，不自行调 advisor）；评审打回后每轮呈递发现+修复建议、用户逐条拍板；交付 code review 改为 eng-coder 返回后的自动流程节点

## [0.1.46] — 2026-08-23

### Added

- **git 工具最全扩充** + `workdir`（对齐 CLI）
- **execute `scriptFile` + `nodeArgs`**：跑 workspace `.mjs` 文件
- **子agent/advisor 显示使用的模型**（webview 面板 + advisor 块标题）
- **工具调用参数 hover 完整显示**（title 属性 = 完整 args）
- 反向路由 + discipline「Tool routing」全工具总表

### Fixed

- `runGit` trim 剥 porcelain 前导空格（status 误分类）；`snapshotBefore` 破坏性 stash → 非破坏

## [0.1.45] — 2026-08-23

### Fixed

- 轮末探索蒸馏边界只在压缩**真重建**时重置（shrink 路径误重置 → 长度检测区分重建/收缩）
- `keepCount` 去掉冗余双重 40% cap

## [0.1.44] — 2026-08-23

### Added

- **主 agent 委托策略** + **历史卫生**（轮末探索摘要 + 压缩 `SUMMARIZE_PROMPT` 保真两清单）：与 CLI 0.12.39 同步
- **编码纪律**：`discipline.md` 工作流程 + 调试策略要求 `task`；「改码前读文档」「中/小改后更新文档」嵌入 Workflow 箭头序列

### Fixed

- `SUMMARIZE_PROMPT` 补齐 D12 的「COMPLETED vs IN-PROGRESS」句（历史移植缺口）
- 轮末探索摘要边界在压缩重建后 stale → 重置

## [0.1.43] — 2026-08-23

### Added

- **对齐 thinworker 编程工具集**：新增 `file_ops`/`process`/`get_current_time`/`sleep`/`tree` 内置工具；`grep` 加 `literal`/`ignoreCase`，`ls` 加 `filter`，`bash` 加 `filter`，`verify` 加 `filter`/`workdir`
- **`execute` 工具重做**：由同步 vm 沙箱改为 `node --input-type=module --eval` 子进程——支持顶层 `await`、动态 `import()`（加载项目 `.mjs`）、原生 `console`，新增 `workdir`/`filter`，保留 killable 超时；`exec-prelude.mjs` 提供 readFile/writeFile/glob/grep/log/require（路径隔离 workspace）
- **consult 指定子集模型** + **模型规格更新**（glm-5.3 等；gpt-5.6/claude-5 `thinking=false`）

### Fixed

- **advisor 推回渲染错位**：机器推回（advisor/verify/pending-task guard）后，下一子回合的 reasoning/内容不再串进上一块——host 新增显式 `turnBreak` 子回合边界（覆盖思考/非思考模型），webview 复位前先 flush 防丢尾巴
- **apply_patch 多 hunk 错位**：移植 CLI 重扫上下文算法（原按 `@@` 行号定位会错位、静默损坏）
- **delete 命令注入**：`git ls-files` 改 `execFileSync` 数组参数（路径不再拼进 shell）
- **git 写操作假成功**：`commit`/`push`/`rm` 改用 `runGitStrict` 返回错误，不再伪装成功
- **ls filter 顺序**、**process 非阻塞**（`runInterruptible`）、tree 深度/计数校验等

### Changed

- **语义索引系列修复**：索引重建按 mtime、git 状态漂移检测、空 chunk 过滤、manifest-only 重建、multi-root 路径、memory 语义索引接线、chunk 重叠 EOF 尾部、嵌入端点保留等

## [0.1.42] — 2026-08-22

### Fixed

- **advisor 标签还原**：工具栏按钮 "GUARD" → "ADVISOR"（title/aria-label 同步），i18n `toolbar.guard` → `toolbar.advisor`
- **i18n 占位符修复**：`advisor.round` 与 `settings.connOk` 由单括号 `{round}`/`{count}` 改为 `${round}`/`${count}`（`t()` 仅做 `${name}` 插值，此前原样显示 `{round}`）
- **飞刀/会诊串块修复**：escalate/consult 流式块名加 per-invocation id（`#${subId}`/`#${id}`），第二次调用不再续接上一次建的块；consult 的 collapse 查找同步带 `#${sessionId}`

### Refactor

- **文件超限清零**：chat.js（1654→247）、settings.js（1079→87）、chat-panel.mjs（656→275）拆分为多模块，共享状态集中到 `webview/state.js`；agent.mjs 抽 `setup.mjs`
- **SSE tool_calls 防御性合并**：openai transport + compact.mjs 与 CLI 对齐（PROVIDER.md §10）

### Prompt

- **确认纪律 carve-out**：system.md 补 doc/code 一致性例外（与 CLI 同步）

## [0.1.41] — 2026-08-22

### Fixed

- **subagent 活动流唯一块**：同一 turn 多次调用同一角色时，后续调用的活动流不再续接第一个块（panel 通道名 `sub:${role}` → `sub:${role}#${subId}`）；eng-coder 块补 token/reasoning 流式输出

### Docs & advisor

- **文档归属纪律 + advisor 设计评审增强**（doc map、design 提示词硬加载、citation rules）

## [0.1.40] — 2026-08-21

### Fixed

- **subagent 活动流修复（2026-08-22）** — ① 同一 turn 多次调用 eng-coder 时，后续调用的活动流不再续接第一个块：面板通道名 `sub:${role}` → `sub:${role}#${subId}`（webview 按 name 建块的复用是根因；标题自动显示 `eng-coder#N`，resume 续跑 subId 不变、块不重复）；② eng-coder 块此前只有工具调用输出：`baseOpts` 补 `streamOutput: true`（agent.mjs onToken depth gate 豁免，escalate 同款），onToken 改为累加 + 转发 panel kind=text，新增 onReasoning 转发 panel kind=think（无 gate，传了就流）

### Changed

- **advisor 开关语义重构（对齐 CLI）** — 评审能力恒启用：`advisor` 工具任何模式都可调用（删除 `advisor.enabled` gate，不再返回 "not enabled"）；开关语义收敛为 guard——收尾推回仅当 `advisor.guard === true`（默认 OFF，评审自愿调用，打开才强制）。工程模式行为不变（评审恒可用、guard 豁免）
- **`advisor.enabled` 废弃**：字段不再读写，存量配置不迁移（pre-release 约定）；工具栏 ADVISOR 按钮改为 GUARD（消息 `setAdvisorEnabled` → `setAdvisorGuard`），设置面板删除 Enabled 开关、保留 Guard 开关（默认未勾选）

### Prompt system

- **提示词借鉴增量（kimi-code 对照，对齐 CLI）**：explore.md 新增 Thoroughness levels 三档（quick 单点定向 / medium 默认适度并行 / thorough 全面分析且报告须列出搜索过什么与没找到什么）；main.md Delegate well 补委派 explore 时在 task 描述中指定彻底度（未指定走默认）；system.md 确认理解句补 "including the most important acceptance criteria"；subagent 工具 description 同步补彻底度说明。两端 15 个 prompt 文件保持 byte-identical
- **开工前计划确认纪律（对齐 CLI）**：system.md 追加无豁免纪律——任何写文件动作（write/edit/apply_patch/insert_after/delete/hashline_edit 及一切写文件的 bash）前必须纯文字复述理解+计划要点并等待用户明确确认（未确认/沉默/用户回复新问题或新要求 → 一律不动手；"这太明显了不用问"不是跳过理由；用户的新问题不是确认；需求变化后重新复述重新确认）；engineering.md 澄清完成后、写需求/设计文档前同样须把理解+计划文字化并等待确认。两端 15 个 prompt 文件保持 byte-identical（两端测试断言关键句）

### Docs & advisor

- **文档归属纪律 + advisor 设计评审增强（对齐 CLI，规格见 CLI AGENT-LOOP.md §12）**：新建 `docs/design/README.md` 文档地图（板块→文档映射表 + Settings 板块 6 文档"待合并（TODO）"标注 + 归属规则）；system.md 补文档归属纪律条款（写文档前先查地图定位所属板块——找到就改、不得为既有板块新建文件；确无归属才新建并登记；同一机制只在一处详述权威源、其余引用不复制）；advisor-design.md 加第 7 维 **Document ownership**（与现有文档矛盾 🔴、该并入却新建/重复描述 🟡）与引用纪律（引用原文用精确 file:line、未核实标注 unverified）；design 提示词 fallback 删除转硬加载（`loadPrompt` 同 round1/2/3 待遇，缺失即抛错——静默降级会丢 Approval Signal 规则致评审无法批准）；messages.mjs design 分支 Instructions 补 Methodology compliance 维度、存在文档地图时注入 Document Map 段供归属检查对照。两端 prompts 保持 byte-identical、测试同步覆盖

## [0.1.39] — 2026-08-21

### Fixed

- **非工程模式不再暴露 eng-coder 角色** — subagent 工具的 role 枚举按工程模式覆盖（对齐 CLI）：普通模式 schema 只列 explore/plan/coder，模型看不到 eng-coder，无法自主走 eng(enter)→advisor design token→派生 eng-coder 的解锁链盗用实现通道。运行期互斥门禁原样保留（schema 过滤是第一道防线，运行期校验兜底）

## [0.1.38] — 2026-08-20

### Fixed

- **webview 输入卡顿治本补全：窗口化裁剪** — 顶层消息/工具卡超过 150 个时删最旧的（DOM 有界）；live 消息本地续接 `data-idx`，向上滚动经 `loadOlder` 仍能拉回被裁历史。补齐 0.1.37 遗留的核心补丁

## [0.1.37] — 2026-08-20

### Fixed

- **webview 输入越用越卡（中文 IME 尤其明显）** — 根因是消息 DOM 无界增长 × 输入路径强制 reflow。修复：`adjustInputHeight` 缓存高度不变跳过、`scrollTop` 改用 `MAX_SAFE_INTEGER` 免读布局、`.message/.tool-call` 加 `content-visibility` 隔离离屏渲染、`#messages` 去 `aria-live`、工具输出限长 64KB 入 DOM、流式渲染降频 ≥50ms/次（2026-08-20 用户报告）

## [0.1.36] — 2026-08-19

### Added

- **context 工具** — 按需收集 IDE 状态（光标位置、打开标签、hover、diagnostics、未提交变更），返回片段，不进 system prompt 省 token
- **focus 工具** — agent 主动打开文件并移动光标到行/列，实现双向交互（用户能看到 agent 指向哪）

### Fixed

- **turn-cap 继续确认卡死** — 满 100 轮的"继续确认"从会消失的通知 toast 改为面板持久提问卡片，长时间未响应不再静默中止（2026-08-19 用户报告）

## [0.1.35] — 2026-08-18

### Fixed

- **question 工具 options 防御** — LLM 误传对象（{label,description}）时取 label/text/title 字段兜底，不再渲染成 [object Object]（panel 内联卡 + QuickPick 回退两处）


## [0.1.34] — 2026-08-17

### Changed

- **撞轮数墙可无限继续**：主 agent 改循环（修第二次撞墙静默异常）+ subagent/飞刀/会诊统一弹继续提示（unlimited，resume 保留 history，会诊继续重置墙钟）
- **MiMo 预置 provider**：按量付费(api.xiaomimimo.com/v1) + Token Plan(token-plan-cn.xiaomimimo.com/v1)，mimo-v2.5-pro/mimo-v2.5 规格
- **多根工作区「当前项目」切换**：会话栏 📁 按钮 + QuickPick 选择工作区根，会话/索引/@补全/agent cwd 全跟随，可选跟随活动文件，运行中禁止切换
- **环境变量配置源彻底移除**：resolveProviders/resolveKey 不再读 THINCODER_* 环境变量，config.json 唯一配置源

## [0.1.33] — 2026-08-17

### Changed

- **空配置不再合成 deepseek 默认条目** — resolveProviders 直接反映磁盘真实状态（providers 为空就是空）。首次安装走向欢迎界面，18 个预设全部可选（DeepSeek 第一个）。与 CLI 行为一致

## [0.1.32] — 2026-08-17

### Fixed

- **首次安装欢迎界面缺 DeepSeek** — 空配置时运行时会把 deepseek 当作默认条目（CLI 兼容行为），但这个合成条目被误当成"用户已添加"，导致欢迎界面 / 配置 [+ Add] / 模型下拉的添加列表里都没有 DeepSeek。改为重复检查和预设列表只看磁盘上真实存在的条目，首次安装可正常选择并添加 deepseek

## [0.1.31] — 2026-08-17

### Fixed

- **添加 provider 后配置面板立即显示** — 添加/删除/改 key/proxy 后扩展会回推 providerStatus，但面板只在打开时渲染，新 provider 必须关掉重开面板才出现。改为：面板打开期间，每次 providerStatus 推送都原地重建 Providers 卡片（只重建这一张卡片，不碰其他卡片正在编辑的内容）；内容无变化的推送不重建；重建后重新绑定 [+ Add] 表单按钮

## [0.1.30] — 2026-08-17

### Fixed

- **输入框中文延迟** — 中文 IME 输入时，每敲一个拼音字母都触发 input，每次都强制算 `scrollHeight` 再改 `style.height`（强制重排），中文组合次数多所以特别卡。改为：IME 组合期间（compositionstart/end）完全跳过高度调整，组合结束才调一次；且高度调整改用 rAF 节流（每帧最多重排一次），不再每次 input 都强制重排

## [0.1.29] — 2026-08-16

### Fixed

- **Stop 卡顿（渲染积压）** — 思考中长按 Stop 停不下来：reasoning/token 每来一个 chunk 就全文 markdown 重渲染 + DOM 重建 + 强制布局，O(n²) 累积淹没 webview 主线程，Stop 点击事件排在积压渲染后。改为 rAF 节流——token 到达只做 O(1) 字符串追加，每帧最多渲染一次，主线程始终留有空闲响应 Stop；finish 时同步 flush 最后一帧不丢
- **advisor/subagent 滚动也纳入节流** — 活动流内容本就是增量追加，但每 chunk 的 scrollTop=scrollHeight 强制布局一并折入 rAF
- **consult/escalate effort 枚举钳制** — 越界 effort 改为丢弃（而非保留 preset 默认残留），对齐 CLI 0.12.32+；qwen3.8-max 等越界候选不再"起飞即死"

## [0.1.28] — 2026-08-16

### Fixed

- **escalate turn-cap continue (CLI 0.12.32 parity)** — 飞刀撞 turn 上限后经面板问题卡弹"继续?"（主 agent 同款），用户选 Continue 则从子 agent 自身 history 续跑（agent.mjs 新增子 agent history 传入/回传支持），预算重置，上限 2 次；放弃/headless 退回 partial work 报告
- **escalate wall-clock watchdog removed** — 固定墙钟误杀正常但慢的手术（实测两个 max-effort 顾问读文件即撞 10min 墙），改为完全依赖 turn 帽 + FETCH_TIMEOUT + 用户 Stop 直传
- **escalate effort enum clamp** — 池里 effort 不在模型 reasoningEffortEnum 时回退预设并标注（此前该候选每次 chat 必抛错，"起飞即死"）

## [0.1.27] — 2026-08-16

### New

- **Plan-mode toolbar toggle (PLAN button)** — parity with AUTO/ADVISOR/ENG quick switches. Plan mode is now session-level persistent (stored in the slot like autoApprove), not turn-scoped; the button and the model's own plan tool stay in sync across turns

### Prompt system

- **Attention optimization + cross-end consistency**: split over-long sentences in main.md / discipline.md / advisor-round1/2/3; fixed an escalate-timing contradiction (up-front ability judgment, not post-failure); unified Review discipline + advisor rounds across both ends — all 15 prompt files now byte-identical with the CLI
- consult_start + main.md carry the 会诊 Chinese alias (parity with the 飞刀 alias)

## [0.1.26] — 2026-08-16

### Fixed

- **Turn-cap exhaustion now offers Continue, not retry-only** — at the 100-turn limit the panel showed a generic error (retry from scratch) instead of the CLI's "Continue?" (resume from the current context). panel-chat now catches ContinueError and shows a native Continue / Stop prompt; Continue re-runs with resume=true from the same history with a fresh turn budget. CLI parity (2026-08-16 user report).

## [0.1.25] — 2026-08-16

### Terminology unification (user decision: one word for one thing)

- **"surgeon" removed — everything is "escalate"**: the tool name and the spawned sub-agent's role were two words for one thing (escalate / 飞刀 / surgeon), and models confused them — kimi's first real run looked for a "surgeon" tool (it was a role, not a tool) and fell back to ad-hoc code; a main agent imported the escalate module instead of calling it. Now: role "surgeon" → "escalate", report/panel labels unified, ESCALATE.md glossary rewritten (escalate = the only technical name; 飞刀 = Chinese alias)

### Fixed

- **Coder sub-agents (subagent + escalate) get verify + advisor** — their system prompt names both tools but the tool table only gave them to depth-0 and eng-coder; the escalate surgeon hit "unknown tool verify" and self-verified via bash node --check/npm test. Diagnosed by a real deepseek escalate run
- **Consult cards showed FAILED (red) after user Stop** — read as "stop didn't work". cleanupConsultSessions now marks stopped before aborting so children settle as TERMINATED (clean grey), not FAILED
- Escalate description + main.md: direct-call guard (call the tool, never script the module)

## [0.1.24] — 2026-08-16

### Cache-hit-rate fixes (user-reported low hit rate, both reports diagnosed via consultation)

- **Time reminder moved to the END of the message sequence** (after the user input) — it was pushed before the input, and since the plugin reloads the machine line from disk each run (transient dropped on persist), its position drifted run-to-run → every run's first request had a different prefix → provider prefix caches never hit. Tail position can never disturb a prefix
- **Machine line keeps transient messages on persist** — reloading a slot / window reload / session switch must rebuild a byte-identical machine line or the whole prefix misses (same mechanism as the CLI report)
- The misplaced time push had also silently disabled the fresh-machine-line injections (context docs, MCP list, skills, AUTO/permission reminders) — restored

### Tool-call pairing 400 on strict providers (hit live during the first escalate run)

- Ported normalizeToolPairing: tool results reinserted right after their assistant, missing results filled with a placeholder, orphan tool messages dropped; compact gained reverse tail protection (assistant whose tool results were cut now pulls them back into the tail)

### Escalate (飞刀) gap batch (three-way review, flown to kimi-k3)

- Fresh code from a surgeon resets the parent's verify/advisor convergence budget (no more bypassing the gates); engineering mode fails closed pointing at eng-coder
- AbortError propagates (user Stop not swallowed); wall-clock watchdog; model-pick tolerates the " (effort)" suffix; no-API-key precheck
- Surgeon rows show the model name; reasoning + output stream into the panel; returns carry Touched files; ContinueError reads as partial work
- 飞刀 hook checkbox removed — every consult model is a surgeon candidate (fewer knobs); tool descriptions now list the current candidate pool so the model knows who it can pick

### Fixed

- Markdown tables: escaped pipe \| no longer splits the cell
- Design docs synced with implementation (status + current values)

## [0.1.23] — 2026-08-15

### Consultation panel shows the FULL process (consult-UI review)

- Reasoning streams live into each consultant's block as dimmed thinking text; output text streams as merged chunks — no more "tool calls only, where's the thinking?"
- Blocks auto-collapse when that consultant settles (answered / terminated / failed): the box folds to its title line, stays reopenable, content preserved
- Sub-blocks capped at 180px content height (advisor reviews stay 320px) with dimmer titles
- `onToken`'s depth gate now exempts `role === "consult"` (other subagents unchanged); a stale garbled comment from a bad merge cleaned

### Not done (consultation verdict, archived)

- Responses API transport: verified support matrix first-hand (OpenAI official + Qwen bailian complete; DeepSeek stateless stub; Kimi no endpoint) and consulted — decided NOT to implement: zero user benefit (the three differentiating capabilities are exactly the ones we don't use or already have) against real dual-repo continuation-loop coupling. Archived as a ready-to-trigger contingency with restart signals.

## [0.1.22] — 2026-08-15

### Escalate (飞刀) — hand intractable work to a stronger model

- New `escalate(task, model?)` tool: a flown-in expert surgeon gets WRITE access and does the implementation itself (reads, edits, runs tests), returning a post-op report the main agent reviews
- **Surgeon hooks**: consult rows carry a 飞刀 checkbox — hooked models form the candidate pool; the status line shows "consult N · surgeon M"; empty pool → tool not registered
- Reuses the coder subagent path: permission gate, activity stream in the conversation panel, mutations merged into the parent's verify/advisor bookkeeping
- Free-discretion trigger: early or late, the model's own judgment (no hard gates — one expert run costs about the same as doing it itself); user can also fire it manually
- Depth guard (a surgeon cannot fly in another surgeon) via `ctx.depth`, now exposed to all tools

### Consult boundaries liberalized

- The first-failure / simple-error / in-context bans are gone: when to consult is the model's judgment; the clause describes what benefits from independent perspectives and states the cost for the model to weigh itself. Mechanized hooks (verify-exhaust/stall) stay as entrance hints for consult (judgment gaps); escalate deliberately has none — it is a PRIOR ability assessment

### Fixed

- Time injection moved out of the system prompt into a transient per-run user reminder — system prompts fully static again (provider prefix caches hit across hours, not minutes); local time + IANA zone at second precision, covers all agent depths

## [0.1.21] — 2026-08-15

### Subagent & consultation visibility (user-requested)

- **Children stream live**: subagents (explore/plan/coder) and consultants forward their tool calls/results to an in-conversation collapsible panel — the user watches WHAT each child reads/runs instead of a status dot
- Consultation progress counter in the subagent panel header (👥 X/Y answered)
- Consult cards linger 60s (were 3s — the reply preview is the consultation's output) and the preview is 8KB (was 2KB)
- Consultation budget on the panel: turn limit + timeout (minutes) in the Consult & Advisor card; both were dead config before (agent.mjs never assembled them — panel edits did nothing)

### Consultation hardening round 2 (live regression findings)

- Consultants run on a lean consult-base.md system prompt (no main-agent persona conflict, budget guidance with concrete numbers)
- `question` excluded from ALL subagents — a background child must never prompt the user and hang
- Watchdog timeouts settle as "timed out after Nmin" (was indistinguishable from a provider crash); default raised 5→10 min
- consult_check description warns against batching with dependent calls

### Fixed

- **Proxy settings silently deleted**: the 0.1.20 "binding fix" never landed (CRLF-missed replace) — `|| document` fallback survived and re-posted proxy from an empty field on ANY input blur. Now bound per-control
- adv-enabled/adv-guard stopped persisting after the 7→5 card reorg (fell outside the change-to-save binding)
- Shell card wiring, effort dropdowns missing on open (spec-enum fallback), subagent ✕ wiping the advisor effort dropdown — from the earlier consultation batch
- bash tool description is platform-aware: cmd.exe semantics for the isolated child, PowerShell 5.1 warning (no &&) for terminal modes — models trained on bash emitted broken commands for both
- Local time + timezone injected into every system prompt (main, subagents, consultants, advisor) on both extension and CLI

## [0.1.20] — 2026-08-15

### Settings panel reorganization (consultation-derived design)

- **7 cards → 5**: the Agent junk drawer split into Agent (run parameters + subagent model assignments) and Consult & Advisor; MCP/Web Search/Semantic Index merged into Tools & Services; Proxy+Shell merged into Environment
- Three copy-paste implementations consolidated into shared keyRowEdit / buildEffortSelect components
- Key-row cancel restores the row in place instead of rebuilding the whole panel — in-progress edits elsewhere survive
- Delete is single-click (the 2.5s two-step armed timer is gone); save feedback unified to one card-level badge

### Consultation hardening (the feature reviewed itself)

- consult_stop'd children settle as terminated and no longer flood the reply queue with fake-failure notes
- Wall-clock watchdog per consultant (`agent.consultTimeoutMs`, default 5 min) + turn budget cut to 15 (`agent.consultTurns`)
- Consultants run as their own `consult` role — consult.md overlay, no explore-persona conflict, read-only tools
- Stall detection no longer false-fires on consult_check loops; stall / verify-exhaustion reminders suggest consult_start when configured
- main_history hardened: base64 images omitted, assistant tool calls surfaced, 60KB byte budget
- Panel: consult cards show the model name; answered/terminated/failed get proper colors + localized labels (was: everything red + raw English)
- Effort default prefers the model's official default and falls back to the LOWEST tier (was: highest)

### Fixed (five live bugs found by the consultation)

- Shell card was dead — no change listeners, selections silently dropped
- Proxy binding fell through to `document` and bound autoSaveProxy to EVERY input in the panel
- Light settings push stripped the shell value and never carried providerStatus (per-provider proxy checkboxes reverted)
- Clearing a subagent slot also wiped the Advisor effort dropdown
- Consult/advisor effort dropdowns missing on panel open (the enum depended on network-probe timing)


## [0.1.19] — 2026-08-15

### Added

- **Unified model picker** — every model selection (main panel, subagent slots, advisor, consult rows) now uses ONE two-level hover menu component, rebuilt on the overlay paradigm: full-screen fixed backdrop + viewport-rect positioning, up/left flips, zero style inheritance, no clipping possible.
- **Consultation + advisor effort levels** — per-model thinking-effort dropdown (spec-driven enums, official defaults preselected: DeepSeek high, GLM/Kimi max, qwen3.8 xhigh); persisted explicitly as {provider, model, effort} and injected into consult/advisor sub-requests.
- **MCP tools expander** — each server row has a Tools button that lists the server's exposed tools (name/description/params) inline; doubles as a connectivity test.
- **Follow-scroll pin** — scrolling up during streaming pauses auto-scroll (read history without fighting the stream); scrolling back to the bottom or the floating button re-pins.
- **qwen3.8-max effort enum** — xhigh (official default) / medium / low.

### Changed

- **Settings cards are change-to-save** — Agent/Consult, Proxy, and Shell cards save immediately on change (submit buttons removed); form-style dialogs (API keys, add-provider, MCP) keep their confirm buttons.
- **Settings panel rebuilds only on open** — the whole push-driven rebuild machinery (rebuildIfIdle, echo suppression, dirty windows, debounce) is deleted; saves write config.json and never repaint the panel under your hands.

### Fixed

- Consult models lost on window reload (the read path dropped the field).
- Consult rows vanishing after add/pick (preselect-created half-filled row blocked every save).
- Cleared subagent/advisor values resurrecting (undefined never survives postMessage; clears now send explicit null).
- Model picker: popup clipped by cards, flyout dying under a stationary pointer, flyout never reopening, backdrop wheel killing in-flyout scrolling, long provider descriptions blowing the menu width.
- Advisor pick not repainting the trigger; consult status line not updating after adding a model.

## [0.1.18] — 2026-08-14

### Fixed

- **Consult model settings UX rebuilt**: the model dropdown now always offers the provider entry's current model as an offline fallback (no more dead-end empty dropdown when the model-list probe failed); half-filled rows block the save flagged red with a status hint (never silently dropped); the sole configured provider is preselected in new rows; a status line shows whether consultation is active (N models) or off.

## [0.1.17] — 2026-08-14

### Fixed

- **Consult "Add consult model" produced an empty row** — dynamically added rows passed the full provider-status object where the providers map was expected, so the provider dropdown listed nothing (looked like a dead button). Binding also moved outside the save-button guard so upstream failures can no longer silently disable it, with console diagnostics.

## [0.1.16] — 2026-08-14

### Fixed

- Removed a stray empty file that slipped into the 0.1.15 package (shell-escaping artifact; no functional change).

## [0.1.15] — 2026-08-14

### Added

- **glm-code provider preset** — the Zhipu GLM Coding Plan endpoint (`https://open.bigmodel.cn/api/coding/paas/v4`, glm-5.2, same key as the standard GLM entry; note: that endpoint forces thinking server-side and ignores `thinking: disabled`).

### Fixed

- **GLM/Kimi never thought unless the provider entry said so** — thinking-capable models now default `thinking: {type: "enabled"}` when the entry omits the field (zhipu-plan entries are created without one). Explicit values, including the panel's off, always win.
- **The panel's reasoning "off" button never actually disabled thinking** — the UI sends `"none"` (the effort enum's lowest level) but the wiring only recognized the literal `"off"`; both now map to a true off. (Endpoints that force thinking server-side — e.g. the Zhipu coding plan — will still emit reasoning regardless.)
- **Model specs synced with official vendor docs (verified 2026-08)** — kimi-k3/k3 maxOutput 128K→131072 + cache auto; qwen3.x maxOutput→131072 (qwen-plus was 32K) and 3.7/3.8-max flagged thinking; DeepSeek v4-flash context 256K→1M and thinking→true, effort enum +low, cache auto.
- **Retired models dropped** — kimi-k2, moonshot v1, deepseek-chat, deepseek-reasoner (per vendor shutdown announcements; unknown IDs fall back to the 128K default spec).

### Changed

- Repository/homepage/bugs URLs → github.com/xinbo-tech/thincoder-vscode.

## [0.1.14] — 2026-08-14

### Added

- **Multi-model consultation (会诊)**: configure up to 5 models (new Settings UI: ⚙ → Agent card → Consultation models). When stuck, the agent — or you, via "发起会诊" — runs `consult_start` to analyze the problem across all models in parallel. Replies are read one at a time as they arrive (`consult_check`); you/the agent verify with your own tools; `consult_stop` aborts the rest early. Consultants are read-only and can pull the main session's failure trail via `main_history`. The mechanism does zero judging — that stays with the main agent.
- **Stop trace observability**: opt-in setting `thincoder.stopTrace` logs every abort hop (click → rate gate → request → stream → tool batches → unwind → UI released) with timestamps to the "ThinCoder Stop Trace" output channel, to diagnose "Stop during reasoning output does nothing".

### Fixed

- **Stop hung on question/permission cards**: aborting while the agent waited for an answer never resolved the promise — the UI stayed "running" until the (now irrelevant) card was answered. Both now release immediately (question → cancelled, permission → denied).
- **Retry backoff / rate-limit sleeps ignored Stop**: backoff (up to 60s) and rate-gate waits were bare sleeps; aborts now break them immediately.
- **edit failed on every CRLF file**: the model writes LF in old_string but files were read raw — EOL is now normalized on read and the file's original line-ending style preserved on write.
- **Reasoning output rendered as plain text**: thinking blocks now go through the markdown renderer (headers/code/bold), with scaled-down styles.

## [0.1.13] — 2026-08-14

### Added

- **Clickable file paths in tool cards**: workspace-real paths (fs-verified) in tool output become links that open in the editor at the referenced line.
- **Native diff viewer for large permission prompts**: diffs over 12 changed lines get a "View in editor" button opening vscode.diff (virtual documents; the real file is never touched).
- **Completion notification when unfocused**: a turn that finishes while the window is unfocused raises a system notification with a View action. Silent while focused.
- **Live bash output streaming**: long commands stream their output into the running tool card (opens while streaming, auto-collapses on success).

### Fixed

- **bash silent-output defect**: the exit-grace timer raced the exec callback and reported a hardcoded "(empty)", discarding real output. Incremental capture (CLI parity) with stream decoders (multi-byte UTF-8 chunk-safe, GBK fallback), ANSI sanitize, 2MB per-stream caps; abort and grace paths now return the collected partial output.
- **Collapsed bash card summary** no longer shows "→ (exit code 0)" — wrapper lines are skipped so the meaningful last line shows.
- **eng-coder design-token gate rejected valid approvals**: the token regex matched only the uuid segment while the advisor echoes the full signed token — the VS Code port carried a stale regex the CLI had already fixed.
- **edit tool corrupted files containing ## [0.1.12] — 2026-08-14/$1**: string-form replace interpolated JS replacement patterns into new_string; function replacers now (CLI parity).

## [0.1.12] — 2026-08-14

### Added

- **bash terminal modes**: `terminal: "visible"` runs a command in the user's own terminal via shell integration (inherits their shell state — cwd, activated venv/conda, env vars); `terminal: "inject"` fills the command for the user to review without executing. Stop/timeout send Ctrl+C; falls back to the isolated child process when shell integration is unavailable.

### Fixed

- **@ file references never worked**: the trigger read the character BEFORE the just-typed @ (off-by-one), so the autocomplete dropdown never activated. Works mid-line and at line start; whitespace closes it.
- **Restored tool cards showed "tool"** instead of the tool name: tool result messages were persisted without a name, so restored history had nothing to display. The name now rides on the tool message at write time.
- **Status bar / tool-error labels showed raw i18n keys** (status.currentTool / status.turns / status.elapsed / tool.error): the keys were referenced but missing from both locales. Added en+zh; also removed 20 dead locale entries and locked the contract with a completeness test.
- **First-run welcome silently failed to render**: showWelcomePanel touched four ctx fields that were never mapped, so it threw before displaying. Mapped them; the panel now actually shows.

### Changed

- **A send with no configured provider re-opens the welcome panel** (even after Skip) so the user lands on configuration instead of a dead-end error banner.
- **Agent edits refresh the Markdown preview**: writing a .md file now fires markdown.preview.refresh (the preview was caching stale content).
- **Session switching already preserved the input draft** (baseline claim was wrong); locked with a regression test.

## [0.1.11] — 2026-08-14

### Changed

- **Tool cards auto-collapse on completion**: a successful tool call folds to one line — name, elapsed time, and the → last-line summary in the header (CLI outputPanel parity). Errors stay expanded so failures are visible without a click. Session-restored cards already behaved this way; live and restored states now match.

## [0.1.10] — 2026-08-13

### Fixed

- **Editor dual-channel data loss**: file tools edited open documents via WorkspaceEdit but never saved, leaving the buffer dirty while disk stayed stale — the next edit self-locked on the isDirty guard and external writes raced the user's later save. Edits now save immediately after applying.
- **SVG images bricked the whole session** (Kimi 400 "unsupported image format" on every subsequent request): a read_image on an .svg put an `image_url` part into history that raster-only vision APIs reject, and it was re-sent on every turn. Image parts are now sanitized per-format at send time — non-png/jpeg/gif/webp data URLs become text placeholders, history untouched, so already-poisoned sessions recover on the next send. (CLI 0.12.23 parity)

### Changed

- **read_image**: svg files return their text source instead of an image part (svg is markup — any model can read it, no vision support needed); bmp is rejected with a convert-to-PNG hint (no mainstream vision API accepts it).

## [0.1.9] — 2026-08-13

### Added

- **CLI keyboard parity**: Ctrl+C stops a running turn (a text selection still copies), Ctrl+I opens an interrupt-and-inject prompt (partial output committed, message injected, turn resumes on a rebuilt controller — full CLI interrupt semantics), Ctrl+F opens in-conversation search (live highlight + match counter + navigation), Ctrl+U clears the input line.

### Fixed

- **Stop actually stops**: bash long-running commands now kill the whole process tree on Stop (CLI killProcessTree parity), and tool-execution AbortErrors propagate out of the batch instead of being swallowed into "Error:" tool results — the "clicked stop, kept running, stopped a few turns later" bug.
- **Input-history ↑ never worked**: navigateInputHistory computed -1 + (-1) = -2 which clamped back to -1, so ArrowUp at the top could never recall a prior message. Fixed to CLI semantics (draft → newest, walk older).
- **Error banner**: shows a friendly first line with URLs stripped; full detail + provider/model folds into Details.

### Changed

- **Add-provider flow**: a custom provider's model is now PICKED from a /models-probed dropdown (validates baseURL+key — no more silent hand-typed typos); preset adds also verify the connection right after save and surface failures in the settings error banner.

## [0.1.8] — 2026-08-13

### Fixed

- **Tool output scroll follow**: `finishTool` auto-expanded the card's output but never scrolled the conversation, so long results sat below the fold. Now scrolls into view on completion.
- **Cache-hit % missing for non-DeepSeek providers**: Kimi/OpenAI report the cache hit as `prompt_tokens_details.cached_tokens` while the status bar read DeepSeek's `prompt_cache_hit_tokens`. Usage is now normalized so the cache-hit % renders for Kimi/OpenAI-style providers too (miss derived as prompt_tokens − hit).

### Changed

- **Bash output renders inline in the conversation tool card** — the side tool panel push was removed (it duplicated what `finishTool` already renders and lingered after completion); tool-result cap raised 2000→20000 chars (the card scrolls). The now-unused side tool panel (container + render logic + CSS) is removed.
- **Settings panel**: advisor provider/model and all subagent model overrides (global + explore/plan/coder/eng-coder) are dropdowns listing known providers/models instead of free-text. New **Web Search** card to configure the optional Tavily key.

## [0.1.7] — 2026-08-13

### Fixed

- **Settings panel layout collapse**: cards were shrinking into tiny clipped stubs — `.settings-card`'s `overflow: hidden` zeroed its flex min-height inside the `.panel-body` flex column, so tall content got compressed and truncated. Cards now keep their natural height (`flex-shrink: 0`) and the panel scrolls.
- **Session deletion confirmation**: deleting a session now asks for inline confirmation (native `window.confirm` is inert in the webview sandbox). Previously an irreversible whole-session delete fired with no guard.

### Security

- **SSRF guard for `fetch`** (CLI parity): the VS Code port shipped `fetch` without the private-host check the CLI has. Now blocks loopback / cloud-metadata / RFC1918 / IPv6-private targets, and refuses redirects (a 3xx could bounce a public URL into a private host via native fetch auto-follow).

### Added

- **Tavily structured search** (optional): set `websearch.apiKey` in the shared config.json and `websearch` returns clean JSON via the Tavily API instead of scraping Bing HTML. No key → silent Bing fallback.

## [0.1.6] — 2026-08-13

### Fixed

- **Repeated "❯ ThinCoder:" labels**: live streaming painted one label per LLM-response segment (every tool batch started a fresh block, each with its own label); history restore painted one per message. Both now render ONE label per turn — live via a turn-level guard, history via a `turnStart` flag computed in `historyWindow` from the raw predecessor (correct across lazy pages).

### Added

- **In-conversation advisor block**: advisor output now streams into a reasoning-style details block INSIDE the conversation flow — full content in a scrolling region, never truncated (was: hard-capped at 20k chars in the side tool panel), with the round number in the summary ("Advisor Review (Round N)").
- **Question cards always accept free-text answers**: cards with preset options now also show an input — users can supplement or correct the AI's choices instead of being forced to pick.

### Changed

- **Removed per-message action buttons** (copy / delete / edit) — never-requested over-engineering; historical messages are now clean label + content. Code-block copy buttons are kept.
- **Engineering-mode prompt**: open-ended questioning style (free-text by default, options only for finite enumerations, one question at a time) + five review fixes (requirements-first step, designToken via parameter only, advisor findings in sign-off, clarification done-criteria, 3-round advisor retry cap).

## [0.1.5] — 2026-08-13

### Fixed

- **TUI/CLI session divergence** ("TUI shows far fewer messages"): the extension never updated the CLI's `display` WYSIWYG snapshot, so returning to the TUI resumed a STALE snapshot and hid every message added in VS Code. The extension now clears `display` on write — the CLI (deprecated the field entirely) rebuilds from history, and rebuilds lazily (latest 200 messages + PgUp pages).
- **Test-quality issues** (advisor-reviewed): an always-true assertion in advisor tests, a vacuous proxy assertion, smoke-provider preset drift (deepseek/minimax endpoints diverged from config-io), and a missing `format` propagation that sent claude/gemini through the OpenAI transport in the smoke tool.

### Added

- **First-run onboarding**: when no provider has a key, the panel opens a guided setup — pick a preset, paste the API key, Save & Start. Closes itself once a key lands; Skip defers; Full settings hands off to the complete settings panel.
- **Webview automated coverage** (happy-dom): message/tool rendering, settings-panel cards and switches, the save flow, diff-preview line classification, and the welcome panel — the webview went from zero coverage to DOM-level regression tests.

## [0.1.4] — 2026-08-13

### Fixed

- **i18n lost on Reload Window**: labels showed raw keys like "msg.user" after a window reload — the extension pushed i18n right after setting webview.html, but the webview loads asynchronously and the message was dropped. The webview now handshakes `webviewReady` and the extension re-pushes initial state.

### Changed

- **Settings panel redesign**: sections are now cards with titles, provider rows show a status dot + name + actions (model·url aligned below, proxy as a switch), all booleans are switch toggles, unified label style, removed dead CSS and hardcoded spacing.
- **execute tool — no fake sandbox**: `require()`/Node API access is now available (the bash tool already reached it, so blocking require only misled the model). Removed the dynamic-import block and SSRF private-host rejection; kept timeout, cwd confinement, and output caps as engineering guards.

## [0.1.3] — 2026-08-13

Repackaged release — 0.1.2 shipped with a stray temporary file in the vsix; `.vscodeignore` now excludes scratch files.

## [0.1.2] — 2026-08-13

### Fixed

- **Stop now actually stops** (the bug reported since 0.1.0): the SSE read loops never watched the abort signal — clicking Stop mid-response drained the whole stream, then tool calls kept running. All three transports now check the signal per chunk AND race an abort promise, so even a silent stream breaks. Verified end-to-end against a real HTTP server (~0.6s).
- **"object is not iterable" on send**: with an active editor inside the workspace, the editor-context injection (a single message object) was iterated as an array on EVERY message — sending always failed. Now accepts object or array.
- **Stop interrupts lint/verify runs**: `execSync` froze the extension-host event loop (the abort message could not even be delivered). lint and verify now run via an interruptible spawn that kills the child on Stop.
- **Settings panel feedback gaps**: add-provider errors were silently dropped (no webview handler), MCP save/delete never refreshed the list, index build left the panel stuck on "Building…". All fixed, plus two-step delete confirmation, save-button feedback, tooltips on advanced controls, form edits surviving status pushes, and full i18n.

### Added

- **ADVISOR / ENG toolbar switches** next to AUTO — quick toggles for advisor review and engineering mode, mirrored with the settings panel.
- **Status-bar run indicator**: ThinCoder status in the window status bar (idle / running / waiting for your input) — click to focus the panel.
- **apply_patch approval preview**: multi-file patches now render in the permission prompt with +/- coloring instead of blind approval.
- **Tool-panel output follows the stream** (no more output hidden below the fold) and a **scroll-to-bottom button** for lazy-loaded history.
- **Engineering debt**: CI runs the full test suite on Node 24, subagent questions render inline in the panel, the legacy `thincoder.mcpServers` setting and migration code removed.

## [0.1.1] — 2026-08-13

### Fixed

- **Repeated approval prompts**: clicking "Approve All" (or toggling AUTO) kept prompting for every later tool in the SAME turn. `autoApprove` is now session-level (stored in the shared slot file, CLI parity) and the agent loop reads it live — a mid-turn flip takes effect immediately.
- **"The operation was aborted due to timeout"**: the request ceiling was 2 minutes; reasoning models on long contexts legitimately think longer. Raised to 10 minutes (CLI parity).
- **Wrong context % in the status bar**: read a non-existent spec field and fell back to 128K — 1M-context models showed absurd values like 137%. Now divides by the real context window and warns in yellow at ≥80%.
- **Compaction parity**: `KEEP_HEAD=0` (earliest messages go into the summary — no stale-task anchoring), pure-estimation path now counts the tools-schema overhead, multimodal message text is extracted into the summary serialization.

### Added

- **Lazy history loading**: long sessions load only the last page on open; scrolling to the top loads earlier messages automatically (scroll position preserved).
- **Inline question prompts**: the `question` tool now renders inside the chat panel (option buttons / text input) instead of VS Code's native popup at the window top.

## [0.1.0] — 2026-08-13

- Initial public release.

### Features

- Side-panel chat UI (`ctrl+alt+t` / `cmd+alt+t`) with full agent loop — multi-turn tool calling, parallel tool batching, subagents, plan mode, task tracking, long-term memory
- Sessions shared on-disk with the ThinCoder CLI (`~/.thincoder/sessions/`) — both ends read/write the same slots
- Provider config shared with the CLI (`~/.thincoder/config.json`) + in-panel settings UI with proxy support
- Tool approval mode: file-modifying tools require confirmation unless `thincoder.autoApprove` is on
- 20+ tools: file ops, bash, glob, grep, git, web fetch/search, checkpoints, read_image
- MCP client (stdio + HTTP transports)
- Zero npm runtime dependencies — pure Node.js standard library + VS Code API, no build step
