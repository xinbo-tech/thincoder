## [0.12.57] — 2026-09-02

### Added

- **subagent 异步化：真后台并行**（AGENT-LOOP.md §15，两端）：subagent 工具加 `async: true`——spawn 立即返回 `{id, status:"running"}`，主会话可继续自己的回合；新增 `subagent_check` 工具（arrival order 先完成先取 / 带 id 等待 / n 递增校验防循环 / readonly）；**槽位队列**：并发上限 4，超限入队（position 可见），running 完成即腾槽补位（不拒绝、不分批）；回合收尾自动等待全部完成并注入报告（XML 转义 + 超长预览落盘）；Ctrl+C 清空不注入、ContinueError 状态保留；async 仅 depth-0、后台撞 turn-cap 自动拒绝继续
- **approval 批确认**（AGENT-LOOP.md §16.1，两端）：同批多个非只读工具一次合并询问（approve all / one by one / deny；deny 全批拒绝无二次询问；无 handler 回退逐项；onPermissionRequest 签名不变）
- **批量形态引导**（§16.2，数据驱动——真实使用 94.6% 单条 edit / apply_patch 0 次 / 35 例手工批量）：edit 描述强化 edits 数组原子批量、apply_patch 补多文件新建场景、system.md 并行条款扩展批量句（两端 byte-identical）

### Changed

- 工程模式并发纪律上限 3 → 4（engineering.md + ENGINEERING-MODE.md FR8/决策③ 三处同步）
- VS Code 端同批对齐：escape v5 / UTF-16 安全截断 / 续写构造 / 压缩可见性（见 thincoder-vscode CHANGELOG 0.12.57）

## [0.12.56] — 2026-09-02

### Added

- **上下文压缩面板 + 压缩失败可见性**（CONTEXT-COMPACTION.md §7）：压缩开始即弹"Compressing…"面板区块（复用子 agent 面板机制：耗时 ticker + summarizing N messages）→ 完成态 `Compressed: N tokens freed → summary (Xs)` 可折叠冻结；失败态显示错误文本，连续 3 次失败后 compressFallback 截断兜底并显示降级说明；摘要正文永不进面板/会话流；headless 回调缺省 no-op
- **DeepSeek prefix 续写 400 止损**（PROVIDER.md §14）：续写请求精简历史（过滤 tool/assistant(tool_calls) 消息，保留 system + 最近 ≤8 条文本）——真机矩阵实证：thinking 模式 prefix 续写 + 工具链消息必 400（补不补 reasoning_content 分别报 Function call / reasoning_content 错误），纯文本历史 200；续写失败注入 `_warnings` 不再静默飞出；partial 模式不受影响
- **会话恢复 provider/model 缺失 → 模型重选**（SESSION.md §8）：CLI 启动校验 provider/model/baseURL 缺失 → 不再崩溃退出；TUI 首帧弹模型选择（复用 picker），Esc 仍进 TUI + 提示行；headless 可读错误 + 退出码 1；判据仅空缺失（MODEL_SPECS 未知不判无效——自定义模型保护）
- **MCP save&test 确认问句废除**（MCP.md §5 变更段）：探活成功直接保存（删 `Save? (Y/n)`）；探活失败报错回表单且无任何保存通道（save-anyway 整个废除）；取消仅剩表单 Esc
- **搜索工具优先级条款**（PROMPT-DECOUPLING.md）：discipline.md + engineering.md 行为规则——有 MCP 搜索工具优先用 MCP、websearch 仅备用；websearch 连续 2 次垃圾即切；被墙站点走镜像路径；动手抓页面前先扫工具表（两端 prompts byte-identical）

### Fixed

- **hex-escape 400 真凶根治（escape.mjs v5）**：2026-09-02 实锤——`unexpected end of hex escape` 400 的毒源**不是字面 hex 转义序列**，而是 **doc_search 预览 slice 按 UTF-16 码元截断切断了 emoji 代理对**（🔴 → 孤立高代理 D83D）→ deepseek 严格 UTF-16 解码 400。两层修复：① 发送前净化（sanitizeLoneSurrogates：孤立代理 → U+FFFD，全字段）+ hex 转义 odd-run 修复（v1-v4 的 double/替换方向全错，本版为对象层面正解）；② 源头 UTF-16 安全截断（setup.mjs doc_search 预览 + helpers.mjs offloadToolResult 截断点落高代理时向前收一个码元）。验证：真实会话 953 条（含孤立代理）重放 400→200，带 thinking:enabled 6/6 全 200
- **MCP 磁盘无 mcp 段时 remove/edit 崩溃**（code review #1/#2）：persistRaw 建段守卫（`raw.mcp ??=`）——磁盘 mcp 段被整体删除而连接保留（T23 场景）时，remove 不再 TypeError、edit 不再静默丢（"updated" 提示与落盘一致）

## [0.12.55] — 2026-09-01

### Added

- **`/mcp` edit/add 统一字段 picker 表单（v2）+ agent 代配闭环**（docs/design/MCP.md §5，CLI-only）：① **edit = 字段选择表单**——picker 列可编辑字段行（`HTTP URL https://…` / `Token d90c26bb…` 打码 / `Headers 2 items`；stdio `Command/Args/Env`；name 不可改无行）+ 末行 `✓ Save & test`；选中字段只输入该字段新值（提示 `(current: …)`——空=不变、`-`=删可选字段、`k=`=删 header/env 项、required 字段拒绝 `-`）→ 回 picker 循环连改多字段（中间 Esc 回 picker 不丢已改值）；**废除逐字段预填重问**（改 token 不再被迫路过 URL/headers）；② **add 复用同一表单**——空 entry 起、必填字段 `(required)` 标注、Save 校验必填非空（未满足提示并停留表单不落盘）、headers/env 不选即跳过、add 的 name 可编辑（重复名检查）；③ **保存前预览 + 探活 + 字段级重试合一**——`showPreview`（token 遮蔽）→ `probeMcpServer` 零副作用探活（`✓ N tools, Xms` / `✗ 错误`）→ `Save? (Y/n)`；探活失败 → `Save anyway? (y/N)` 显式 y，否则**回同一字段表单**只重输失败字段复 probe（**独立 retry 路径废除**，不重启流程；save-anyway 显式 y 保留）；④ **表单文件拆分**——新增 `src/tui/cmd-mcp-form.mjs`（fieldPicker 机制独立文件；`cmd-mcp.mjs` 499→382 行，脱离 500 硬限压线）；⑤ **列表即菜单**——主菜单 = server 行（●/○ 连接态 + tool 数）+ `+ Add server` + `↻ Refresh` + 顶部 agent 代配提示行；选中行 → per-server 子菜单（Edit/Test/Reconnect/Remove），"先选操作再选 server"双弹层与 View list 废除；⑥ **磁盘重读**——`config.mjs` 新增 `reloadMcpFromDisk()`（菜单打开边界 + Refresh）：磁盘→内存仅替换 mcp 段；畸形 config.json 回退内存态 + `⚠ disk config unreadable` 提示行；disk 删除/变更的已连接 server 连接不断 + 行尾 `⚠ disk changed` 对账标记（persistRaw 落盘后重读幂等防环）；⑦ AI 生成降 transport picker 末位（生成的 entry 同走预览+探活确认环，失败回表单补齐/修正）；`/mcp edit|test|remove|connect <name>` 直达参数路径零改动
- **MCP Streamable POST 误判修复 + `/mcp edit`/`/mcp test` + token 一等字段**（docs/design/MCP.md §4，两端落地）：① `httpTransport` 增 postOnly 标记——GET SSE 405 降级后的纯 POST 模式 `isAlive()` 不再因 `eventSource == null` 误判死（glm-websearch "reconnect failed after 4 attempts" 根因：降级后 isAlive 恒 false → ensureAlive 触发无意义重连循环；legacy SSE 流断仍正常 fireDead 重连不回归）；② `/mcp edit [name]`：逐字段预填重问（空输入保留 / `-` 删除可选字段 / `k=` 删除单个 header 项），persistRaw 原位替换保数组序，保存后自动重连（config 指纹含 token，变更自动关旧连接）；③ `/mcp test [name]`：probeMcpServer 一次性探活（initialize + tools/list 计时 → `OK — N tools, Xms` / 错误透传），零副作用（不进 session 表、不动 agent.tools、探完即关）；④ token 一等字段：config 增 `token` 字段，connect 链自动合成 `Authorization: Bearer <token>`（显式 headers 优先，不写回 config）；⑤ parseHeaders 改逗号分隔（`Authorization=Bearer abc, X-Foo=bar`——修复空格截断把 Bearer token 截成 "Bearer" 的缺陷）；⑥ VS Code 同构：http transport 同款修复 + probeMcpServer 镜像 + 面板 [Edit]/[Test] 按钮（同一表单编辑预填，token 字段 + 逗号分隔 headers 提示）+ **面板 [Reconnect] 死按钮修复**（webview 发的 `reconnectMcp` 消息在路由拆分时丢失 case，按钮此前无效）
- **memory_delete 工具**（跨端）：三层记忆条目删除——personal 行级删（embedding/FTS 随行）、project/team 文件级删；scope 与 id 前缀匹配校验，非法 scope 明确报错

### Changed

- **multi-design 并行令牌（designId slots）**：eng-coder 子 agent 支持 `{designId, token}` 多槽并行 spawn——各设计独立令牌互不覆盖，复审不通过的设计不挤占既有槽（CLI 与 VS Code 镜像）

### Fixed

- **edit 数组形态同文件串行**：同一文件多条 edit 的 raw 域快照随条目推进，第二条不再漂移（编辑器 CRLF 路径 + 磁盘路径双修复）
- **MCP tools/list 分页超时约束**（MCP.md §4 评审 #8）：每页同受 INIT_TIMEOUT_MS 约束——probe 延迟统计有界
- **MCP 握手失败 transport 泄漏**（评审 #7）：GET SSE 降级成功但 POST initialize 失败时关闭 transport，不留悬挂流
- **hex-escape 毒载荷 400 根治（escape.mjs v3）**：v2 的 lookbehind 单字符判定与 hex 窗口越界缺陷在长会话（讨论转义主题）下漏中和 → deepseek 等网关二次解析报 "unexpected end of hex escape"；v3 数反斜杠 run 奇偶 + 窗口越界修复（`\\x/\\u` 相邻双写）+ 孤立代理对（`\\uD83D` 无配对 strict JSON 解析拒绝）预 double；真实会话 74 处毒点全量中和为 0，11 个 case 锁定（含 v1 行为兼容回归）

## [0.12.54] — 2026-09-01

### Added

- **Checkpoint 事故恢复闭环（CLI ↔ VS Code 两端）**：git 工具破坏性操作（checkout -- / restore / reset --hard / clean / rebase）前自动快照 + schema 描述含 rewind 恢复指引；`checkpointAction=list` 输出尾部提示行；**commit 后清空该项目 checkpoint**（commit = 安全点；懒兜底覆盖外部 git/IDE commit）；每 cwd 快照上限 100（最旧淘汰）；git 工具补齐 11 个 action（clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv）；`/restore` 改为两级 picker 逐文件恢复；bash guard 保留并对齐（宽匹配 + 全量副本 + rewind 指引，与 VS Code 同构）
- **TUI 子 agent 运行中面板固定化**：运行中子 agent 活动从会话流内联改为固定底部面板（会话与 todo 之间，不随会话滚动）；完全自适应高度；默认折叠（头部 + tail 3，⏸ = 等待审批）；完成仍冻结进会话流（✓ 头可展开）
- **TUI 渲染鲁棒性**：wrap-off 硬截断（Ambiguous 宽度字符防软折行污染）；启动/退出序列抽取（tui-lifecycle.mjs）

### Changed

- **跨端会话共享一致性（会诊 4 模型收敛）**：sessionStart 打点（跨端同槽不再 F2 互轮转）；F2 写前磁盘校验（同会话并发追加 → 轮转 .bak 保留）；legacy transient 双端过滤；contextHistory 机读线判定（length>0）；activeModel 双向；cwd 先行校验；newSession 死主清理落盘（deletions）
- **checkpoint cwdHash 归一化**：`sha1(normalizeCwd(cwd)).slice(0,12)`——CLI/VS Code 快照跨端互通（存量旧路径孤儿化不迁移）
- **操作并行化纪律提示词条款**（2026-09-01 用户需求）：system.md "How you work — while coding" 段在既有并行条款后追加 "Parallelize aggressively"——独立只读调用一次发起多个（执行器批并行）、多文件编辑用 `edits` 数组（原子一次往返）、独立子代理/独立子项目一次 spawn 多个（F7 触发条件：不共享待改文件 + 无交叉依赖 + 各自有独立测试）；明确不并行边界（同一文件写入/依赖链/bash 审批命令 = 审批风暴/同仓库并发 git/有状态操作）与收益判断（大操作并行、<1s 微操作不并行）。两端 system.md byte-identical，测试同步断言

### Fixed

- **hex-escape 毒载荷 400**（deepseek-v4-flash 实测）：发送前统一中和字面 `\\x`/`\\u` 不足位序列（escape.mjs，VS Code 同构）

## [0.12.52] — 2026-08-31
## [0.12.53] — 2026-08-31

### Added

- **TUI 展开块内滚动**（2026-08-31 用户需求）：折叠区块 60% 高度封顶保留，正文改为滚动视口——`state._foldScroll` 记每块窗口起点；**滚轮命中块内容行 → 块内 ±3 行**（未命中走会话滚动），▲/▼ 控制行点击翻窗（step=winH 快速跳转）；**穿出语义**：块顶滚上/块底滚下 → 交还会话滚动（会话顶懒加载可达）；锚定补偿：暂停流式跟随期间内容增长按 convLen 增量补偿 scroll（读的位置不漂移）。**滚动读全文、永不截断**
- **流式跟随尾部**：`state._followTail` 默认 true——输出活动期间渲染前钉底；用户上滚（PgUp/滚轮）暂停跟随，PgDn/滚回底部/新提交消息恢复
- **工具顺手度**（2026-08-31）：① insert_after 精确判定（本 session 写入记录受影响区，未受影响区直接插入不逼重 read、受影响区拒绝保护栏）；② edit 数组形态 `edits: [{path, old_string, new_string}, ...]` 一次多文件原子替换；③ dispatch 拦截工具执行期间 console.log/console.error 回显给模型（异常路径同样回显）；④ 写入工具返回带上下文窗口（edit/insert_after/hashline_edit 返回写入点 ±3 行带行号——模型自检行号语义，防"行号漂移死循环"）

### Changed

- **懒加载滚动到头自动加载**（2026-08-31 用户约定修复）：恢复会话向上滚动到会话顶部自动加载更早一页（原只挂 PgUp 键=违约）；`HISTORY_PAGE_MESSAGES` 50→20（单页更平顺，vscode parity）
- **三层渲染缓存**（懒加载卡顿根治）：行级 wrapRowsCached + 段级 _lineSegCache（覆盖普通行/工具块/frozenSubTask/frozenAdvisor）——loadOlder 后 rebuild 111ms→5-8ms 平坦（不随已加载历史增长）
- **折叠 key 身份化**（会诊三家共识）：`long-${i}`/`fold-${foldCounter++}`/`advisor-done-${i}` 位置键全部改 `_lineId` 派生（loadOlder unshift 后展开态/块内滚动 offset 不串位）
- **视口数学单源** `convViewport`（渲染+鼠标命中共用）：短会话顶部补 pad 后命中整体偏移的存量 bug 修复（点击折叠头/滚轮落空或错行）

### Fixed

- **块内滚动穿出缺陷**：滚到块顶/块尾后滚轮永远命中该块、穿不出 → 会话顶/懒加载不可达（"经过展开块滚不到顶"）——显式边界判定穿出
- **懒加载只挂 PgUp 键**（小键盘无 PgUp 用户等于无入口）——滚轮滚到会话顶同样触发

### Fixed

- **sanitizeDisplay 吞正文（用户报障）**：正文含字面 `⟦ev⟧` 时（如讨论 ACP 桥剥除语义的结果表），D5 残段剥除 `/⟦ev⟧[^RS-GS]*/` 按字符类语义"吞到行尾"——该格到回复末尾全没了。真 token = 哨兵+字母 phase 词，收窄为 `/⟦ev⟧[A-Za-z]*/`：裸哨兵正文合法保留，live token 照剥（防伪不破，旧语义断言随测试反转）
- **窗口拖小不生效**：双次相同确认规则（ConPTY 防御）在"拖动只收一个 resize 事件"的场景永不触发，UI 停在旧大宽度溢出；真 resize 事件 400ms settle 后提交（growth 仍立即、untrusted 采样防御不动）
- **dims 误诊机器拆除**：ConPTY stale 假说整套机构（双确认/settle/看门狗/启动收敛/turn 采样/sawValid）建立在对折叠块 cols=80 的误诊上——全部删除（dims 98→45 行）；现行铁律 = 渲染只读 get()、refresh() 仅事件钩子（seed/resize）、任何 sane 采样立即提交

### Changed

- **头部显示版本号**：`ThinCoder 0.12.52 │ model │ cwd`（logo 右侧 dim，模块级读 package.json）
- **提示词**：system prompt "task tracks work for **EVERY tier — even Small**"（注意力层级对齐，修 Small 漏建 task）

### Refactor

- **model-specs.mjs**（TODO #1）：MODEL_SPECS + specForModel 抽出，config.mjs 358→266；re-export 保证 23 个 importer 零改动
- **provider/normalize.mjs**（TODO #2）：stripImagesForTextModel + normalizeToolPairing（发送前载荷净化）抽出，core.mjs 420→350
- **config.schema.json 删除**（TODO #8，用户裁定）：从未闭环（线上 URL 未部署/代码零消费/25 键缺 20）；saveConfig 不再注入 $schema
- **死代码清理**：15 处死 import + 9 无用转义 + 17 control-regex 注明有意；lint warnings 86→44
- **test/ 纳入 lint**（TODO #7）：62 条存量清零，`eslint src test`

### Perf

- 慢测试修复（TODO #10）："原子写不残留 .tmp" 断言曾 readdirSync 扫 `~/.thincoder/sessions/` 全目录（3 万文件时单次 18s）——改 O(1) existsSync 直探本槽位，session 往返用例 16.4s→28ms（仅测试基建，不影响运行时）

### Tests

- read_image × glm-5.3-flash 直接用例（PROVIDER.md §11 T2 落自动化）；TOOLS.md §6/§7 用例表回补（T-g-1..12 / T-w / T-e，对齐 §8）
- 812/812 全绿；lint 0 errors（44 warnings 均为 C 类 parity 锚点）

## [0.12.51] — 2026-08-30

### Added

- **折叠系统大修（0.12.7 单框化的终章）**：公共折叠组件 `src/tui/fold-block.mjs`（147→168 行）——所有可折叠区块（思考/工具/子agent/advisor/长消息/连续 dim）统一：折叠态 = 命名头 + tail 3 行；展开态 = 空行 + ▼ 控制行 + 60% 屏幕封顶（触顶时底部第二个 ▼ 控制行必在视口内）。主输出（C.text）**永不折叠**；思考**无条件折叠**（阈值思路三次真机失败后废弃）；工具摘要（C.dim）>12 行折叠。`/fold off` 全关
- **工具调用单框化**：`_toolBlock` 载体——头 = `❯ name 参数摘要 · running|耗时·摘要`，体 = 参数 pretty JSON + 流式输出 + 结果（dim）。旧四段式（标题/_live 滚动/done 行）废除
- **会话文件瘦身（deepseek 会诊方案，`slimForDisplay`）**：写入时人读线截断（tool args 300 字符 / tool 结果 500 / 多模态图剥 base64 只留 text part），机读线（contextHistory）一字不动（provider 前缀缓存/配对/多轮看图零风险）；copy-on-write 绝不原地改（两线共享对象引用）；VS Code 端同款
- **会诊（consult）体验修复**：consult_check/consult_stop 新增递增 `n` 参数（连续调用参数集不同，绕开循环检测器误报）；会诊结束**会话级结算**（finishSubTasksByRole 全量冻结 N 块，单块 finishSubTask 曾留 N-1 个 running 幽灵）；单条回复按 model 精确收尾（尾段归一化——`[model]` 裸名 vs `r.model` provider:model 曾是死代码）；冻结墓碑防 abort 尾部 token 复活块
- **终端尺寸单源（`dims.mjs`）**：Windows ConPTY 的 columns/rows 不稳定（启动 falsy、输出活动期报 stale 小值）——sample-and-hold 缓存 + 事件驱动采样（启动收敛重试/resize/空闲看门狗/turn-start/turn-finally），渲染路径纯读缓存；非对称接受（变大立即提交、变小需连续两次确认）
- **主输出呼吸空行**：主输出段前后各空一行（渲染期插入，不写 state.lines）；streaming 与落盘路径一致（首版漏 streaming 分支，用户实测"生成时不空落盘后才空"）
- **任务面板顶部分隔线** + **子agent 运行区块段首分隔线**（`─` dim，与上方会话区切分；小终端压缩时 task 分隔线先让位）
- **会诊四轮**：P0（搜索缓存键/中断清扫/tool_call_id 贯穿）、P1（死代码/缓存维度/增量行数/restore 守卫/foldKey 稳定化）、P3（multimodal flag 驱动 offload/日志截断/事件语法单源）——第三轮会诊（ConPTY）与窄屏真根因（组件漏传 cols）分别独立成条

### Fixed

- **流式窄屏真根因**：`renderExpandedBlock`/`renderFoldedHead` 三处调用漏传 `cols` → 组件按默认 80 wrap（280 列终端"生成中左边一小块、落盘后宽"）；全文扫尾 + 组件 cols 纪律入文档
- **窄屏误诊链清理**：ConPTY 采样不再每帧 refresh（输出活动期 stale 80 污染缓存）；启动收敛跑满窗口（sawValid 曾提前掐断）；turn-start/turn-finally 采样点
- **会诊残留双根因**：finishSubTask 单块语义（N-1 幽灵 + interrupted 误标）+ 无墓碑（迟到 token 复活块）
- **subagent/escalate/advisor 成功调用误标 "(interrupted)"**（settleToolBlock 收尾）；Ctrl+I 中断时 tool_calls 悬空（合成占位 tool 结果，strict provider 400）；main 输出空行 streaming 路径缺失
- **搜索高亮被缓存吃掉**（convCacheKey 补 search 维度）；[model] token 后头部不刷新（subSig 补 model）；并行同名工具输出/耗时错配（toolCallId 贯穿）
- **generate-title proxy 路径 bug**（动态 import 相对路径从 src/ 解析到仓库根——静默 ERR_MODULE_NOT_FOUND 被 catch 吞，代理用户标题自创建起失效；静态导入 + 测试缝）

### Changed

- **agent.mjs 拆分**：工具结果提交/记账抽 `src/agent/record-results.mjs`（多模态延迟注入、FILE_MUTATORS 失效链、touchedFiles + reindex）；`_maxTurns` 引用 DEFAULT_MAX_TURNS；escalate 删手写 onToken/output（runWithContinue 统一 capture）；AUTO_REMINDER/ensureAutoReminder 单源（helpers）；魔法数字具名（tool-events caps / consult 默认值）；事件语法分支列表单源（EVENT_PHASE/EVENT_TYPE）
- **行语法统一**：三个行生产者（live flushStream / 恢复 historyToLines / 注入行）统一打 `_kind` 标记（thinking/text/tool），buildConvLines 读标记不再从颜色猜
- **live/restore 逐行对齐**：同一载体、同一渲染路径；恢复结果守卫与 live 共享（`slimToolResultForDisplay`：read_image base64 剥离 + 400 行封顶）
- **折叠 key 稳定化**：工具块 fold key 用行级 `_lineId`（loadOlder unshift 不再错绑展开态）
- **文档同步**：TUI.md / TUI-TOOL-OUTPUT.md / CONSULTATION.md / SESSION.md / AGENT-LOOP.md 与今日全部机制更新对齐

### Tests

- 812 全量（今日新增：折叠组件、dims 单源（sampler 注入 + 守卫 grep 断言）、会诊残留/精确收尾/墓碑、streaming 空行路径、subagent 分隔线、中断配对、工具块 ids、会话瘦身等 30+ 用例）
- 会诊四轮评审全部落地并回归锁定：P0/P1/P3 + ConPTY 硬度 + ByModel 生产格式（自洽世界假绿被二次会诊实锤后改用生产报文断言）



### Changed

- **engineering 与 advisor.guard 改为会话级（跨端污染修复）**：旧设计里 engineering 只存 config.json 全局（`agent.engineering`），CLI `/eng` 与 VS Code 面板都写它 → 两端互相翻转对方的工程模式（"VS Code 工程模式下模型仍委托 role='coder'"）。现事实源是当前会话槽位文件（`engineering` 字段 + `advisor.guard`），config.json 降为 CLI 兼容/可见性镜像（双写保留：slot 先、config 后，slot 失败不阻断）。改动：`/eng` toggle 双写 slot（`cmd-eng.mjs` persistEngineering）；`/advisor` guard 切换双写 slot（`cmd-advisor.mjs` persistGuard，model/thinking 仍 config-scoped）；`saveSession`/`applySession` 往返 slot 值（无字段旧槽位回退 config，兼容锁定）；启动恢复链 `bin/thincoder.mjs` applySession 时 slot 覆盖 config 播种值。权威文档：`docs/design/ENGINEERING-MODE.md` §5 重写
- **METHODOLOGY 三缺口修复**（核对工程模式提示词时发现）：① 需求文档三层结构（总目标/功能用户故事/非功能标准）落地进 METHODOLOGY.md 与 methodology-template.md——engineering.md 的 "three layers per METHODOLOGY" 引用此前悬空；② engineering.md 交付评审补测试文档口径（METHODOLOGY 存在时每条用户故事须有测试用例覆盖正常/边界/异常，无覆盖=评审不通过）——与三文档硬流程对齐；③ METHODOLOGY.md 缺失警告点名后果（引用悬空+硬流程失效+恢复路径），不再静默降级
- **工程模式 UI/交互决策全链路落档**（用户报告"agent 无视讨论过的 UI 设计"）：设计文档要素扩项——涉及界面时必须收录与用户达成的每条 UI/交互决策（布局/流程/控件行为/状态反馈），未定标 open 不静默发明；eng-coder 任务书必须复述这些决策（或指向设计文档具体章节）——子代理零上下文，留在聊天里的决策永远到不了它；`eng-coder.md` 执行侧闭合——缺失的界面决策停下报告，不自行发明。两端 prompts byte-identical；`ENGINEERING-MODE.md` §7 变更记录

### Tests

- 新增 `test/session-eng-advisor.test.mjs`：/eng 双写断言（slot+config）、applySession slot 恢复（true/false/显式 false 压过 config true）、旧槽位无字段回退 config 锁定、saveSession 每 turn 往返、/advisor guard 双写（model 等仍 config-scoped）

## [0.12.49] — 2026-08-29

### Added

- **Qwen enable_thinking 全链路**（CLI + VS Code 0.8.4 双端 parity）：`resolveEnableThinking` 按"模型前缀 qwen*（排除 qwen3-coder*）+ 百炼域名"白名单注入 `enable_thinking`——`thinking === null` 即显式 off（区别于未设置=ON）；`/think off` 真正关闭百炼强制思考（真实端点冒烟验证：off 1.0s 无 reasoning / 档位有思考）；PROVIDER.md §12 权威文档

### Fixed

- **opencode 400 残余排查**：`stripLocalMessageFields` 补齐 provider 载荷净化（Gitee IKBGX4 follow-up，与 VS Code 端 parity 测试互锁）

### Changed

- **subagent 工具描述升级**：角色能力矩阵 + Mode filtering 段（修复 role 参数 description 被运行期覆盖点的死文本）；read_image 多模态模型清单修正（补 GLM-5.3-Flash、移除纯文本 Qwen3.7）

## [0.12.48] — 2026-08-28

### Fixed

- **opencode/LiteLLM 严校验端点 400 "Extra inputs are not permitted"（Gitee IKBGX4）**：本地标记 `transient` 泄漏进发送载荷——`escapeMessages` 发送前剥离整消息本地字段（新增 `stripLocalMessageFields`），云端不再拒绝 `messages[i].transient`；VS Code 端口同修（provider.mjs 净化链，函数体 parity）
- **Ctrl+I 注入框粘贴落主输入框（Gitee IKBU3J）**：`insertPastedText` 目标选择缺 `interruptPrompt` 分支——粘贴直接进 `state.input`、Esc 后残留主输入框；补分支（去换行，与按键路径同语义）
- **/think 交互异常卡死 TUI（Gitee IKBNUI）**：命令 handler 异常（如 config 写盘失败）一路冒泡击穿 submit 主循环→面板卡死回不了输入框；`handleSlash` 包 try/catch，异常转错误行、UI 保持存活

### Changed

- **系统提示词加两条约束**：①「先定正确再谈实现」——动手前先回答"正确应该是什么"（每个入口/视图/边界），再谈怎么实现，实现规模是"正确"的结果、不是决策标准；②「确认时暴露方案权衡」——确认理解时列出选的做法、为什么它对（绝不是"改动最小"）、考虑过但没选的替代方案。治"最小改动"偷懒病根

## [0.12.47] — 2026-08-28

### Added

- **GLM-5.3-Flash 模型支持**：智谱 2026-08-26 发布的原生多模态 Flash 档位模型——1M 上下文 + 128K 输出 + 文本/图片输入，`/model glm:glm-5.3-flash` 即可选用（不改默认预设）

## [0.12.46] — 2026-08-27

### Fixed

- **checklist 工具坐标系断裂**：`add` 返回任务 ID、`mark` 却只收列表位置 index，agent 拿 ID 定位不到条目、只能猜 index——误标无关条目（线上事故）。修复：`mark` 加 `id` 参数（优先于 index）；auto-ID 按「最大根号+1」分配（含 `checklist-done.md` 双文件扫描，归档 ID 恒占位不复用）；历史重复 `T[\d.]+:` 前缀读入即归一；标记父任务 done 时子任务非全 done 则拒绝（防静默丢弃子树），全 done 则递归归档整棵子树
- **子 agent/advisor 模型显示补录**（TUI.md 文档欠账，功能此前已实现）

## [0.12.45] — 2026-08-26

### Fixed

- **编辑工具 CRLF 行尾写回丢失**：`edit` / `apply_patch` / `hashline_edit` / `insert_after` 在 Windows CRLF 文件上写回全部被转成 LF（normalize 后直接落盘）——现按"首个换行符类型"检测原文件行尾并原样恢复，diff 不再整文件重写；`new_string`/`new_content` 含 CRLF 时先归一化再转换，杜绝 `\r\r\n`
- **`old_string not found` 黑盒报错**：失败时返回相似度最高的 top 3 候选行（行号+预览+LCS 相似度，阈值 0.5，多行 old_string 只对首行并标注 `old_string line 1:`）——从盲猜变导航

### Added

- **`write` 行尾语义**：覆盖既有文件按原行尾恢复；新建文件默认 LF，同目录多数派为 CRLF 时跟随（≤20 文件嗅探）
- **`hashline_edit` 编码损坏探测**：文件含 U+FFFD（替换符）时结果追加警告（编码可能已损坏、哈希寻址可能不可靠），不阻断

### Changed

- 候选相似度 LCS 计算复用模块级 DP 缓冲（大文件失败路径不再有每行分配的 GC 压力）

## [0.12.44] — 2026-08-25

### Fixed

- **安全修复：subagent 变形 role 绕过工程模式门禁**——`role="Coder"/" coder"` 等非精确字符串穿透两个模式门禁（精确比较），fallthrough 到全工具/无 overlay 子代理，绕过设计评审拿到完整写权限。修复：execute 入口 ROLES 白名单，未知 role 直接 throw（fail-closed）；防回归测试锁定 7 种变形值 × 两种模式
- IK9UZ8 思考型模型标题生成（vscode 端同修对齐）
- 文档状态/TODO 销账（24+13 处"待评审"→"已实现"；TODO 7 条已实现条目核对关闭）
- TUI.md 章节号重编号（## 4-10 顺延，无重复）

### Added

- **ESLint 引入**（规则基线对齐 vscode 端）：lint script + 21 个 error 清零（死赋值/cause 补全）
- **跨端同构模块语义锚点比对测试**：14 个跨仓库契约（advisor 收敛协议、蒸馏语义、64K 阈值）两端必须一致——单边漂移立即红
- **RELEASE.md**：npm 发布流程 + 4 条踩坑记录（vsce 自动 bump、Open VSX 异步激活、ovsx 无 TTY 静默失败、prepublishOnly）

### Docs

- 文档债收口：6 处"待合并"全部处理（真碎片合并/归档/独立保留定性）

## [0.12.43] — 2026-08-25

### Added

- **评审超时可配置**：`agent.advisor.timeoutMs`（默认 600s，原固定 300s）——运行期读取，非法值（0/负数/字符串）回退默认；长评审不再被固定墙钟截断
- **主 agent 轮次上限默认 100 → 200**：大任务（多文件重构、修复-验证循环）不轻易撞墙

### Changed

- **工具输出限制全链路 16K → 64K（65536）**：落盘阈值 `TOOL_RESULT_OFFLOAD_LIMIT`/`TOOL_RESULT_PREVIEW`、advisor 内部截断 `MAX_RESULT_CHARS` 全部放宽——大输出（advisor 评审、大文件读取）不再被过早落盘/截断
- **轮末探索蒸馏异步化**：回合结束信号先行（TUI 状态栏立即恢复，不再等第二次静默 LLM 调用）；蒸馏 promise 挂 `agent._pendingDistill`，下一轮开头 await（摘要必在下一轮 LLM 调用前落位），退出前 bounded flush（≤5s）；`onDistilled` 回调触发压缩版落盘

### Removed

- **`sleep` 工具删除**：编程场景零真实使用（会话历史 0 次调用），且工具说明误导模型在同步工具（advisor/subagent）后 sleep 空等——白耗 10-300 秒；等待需求改走 bash 内联命令；内部速率限制/重试退避（`_rateHooks.sleep`）不受影响

### Fixed

- 工具输出落盘失败回退截断对齐 64K；旧阈值残留自动化断言（`MAX_RESULT_CHARS` 导出 + import 断言、helpers/run.mjs 边界匹配无残留）

## [0.12.42] — 2026-08-24

### Changed

- **工程模式发起权归用户**：设计评审只能由用户发起——agent 准备设计后只呈递+提醒「设计就绪」，不再自行调 advisor（此前 agent 可自行判断"讨论完了"直接提交评审并开发，属越权）；评审打回后每轮呈递发现+修复建议、用户逐条拍板再改，不再自行修完重送
- **交付 code review 改为自动流程节点**：eng-coder 返回后自动评审（不问用户）；工程模式下 guard 推回维持关闭
- 提示词注意力优化：核心规则开头立纲 + 结尾钉死 + 状态表补「Review fix loop」态；设计文档 ENGINEERING-MODE/WORKLOOP/PROMPT-DECOUPLING 同步

## [0.12.41] — 2026-08-23

### Added

- **git 工具最全扩充**：add（分文件）/push（带 remote/ref/tags）/tag/branch/checkout/restore/stash/fetch/pull/reset/revert/merge/cherry-pick + `workdir`（子目录/多 repo）；破坏性操作先非破坏快照
- **execute `scriptFile` + `nodeArgs`**：跑 workspace `.mjs` 文件（`node <script>` / `node --test` / `node --check`），不再只能 inline
- **子agent/advisor 显示使用的模型**（subagent/escalate/consult/advisor）
- 反向路由：git/execute/grep/ls/read/delete 描述 + discipline「Tool routing」全工具总表

### Changed

- `codemode.mjs` → `execute.mjs`（`codeModeTool` → `executeTool`，与 VS Code 对齐）

### Fixed

- `runGit` `.trim()` 剥掉 porcelain 前导空格导致 unstaged 被误分类成 staged
- VS Code `snapshotBefore` 破坏性 stash → 非破坏 `git stash create`+`store`

## [0.12.40] — 2026-08-23

### Fixed

- **`shrinkOversized` 数据丢失**：原地改共享消息对象会污染持久化的人读线（巨型粘贴内容被永久截断）——改为复制-on-write（机器线替换、人读线不动）
- 轮末探索蒸馏边界只在压缩**真重建**时重置（shrink 路径不再误重置）
- `createAgent` 补 `_emptyRetries` 初始化；删 advisor 分支无用 JSON.parse

## [0.12.39] — 2026-08-23

### Added

- **主 agent 委托策略**：`main.md` 把「广度探索 → explore 子代理（隔离上下文，逐步读/搜不进主历史）」「仅当即将立刻编辑时才自己 read」「coder 验证 = 读改动文件 + 跑测试」从建议升级为明确规则
- **历史卫生**：轮末 `summarizeRunExplorations` 把一轮内连续探索结果（read/grep/glob/ls/code_search/doc_search/repo_outline）LLM 蒸馏为 `[Exploration summary]`（机器线收缩、人读线全量不变）；压缩 `SUMMARIZE_PROMPT` 加「已改动文件清单 + 未决点/待办」两清单
- **编码纪律**：`discipline.md` 工作流程 + 调试策略要求用 `task` 跟踪；「改码前读文档」「中/小改后更新文档」嵌入 Workflow 各 tier 箭头序列

### Fixed

- 轮末探索摘要边界 `_runStartHistoryLen` 在压缩重建机器线后变 stale → 重置到 tail 起点

## [0.12.38] — 2026-08-23

### Added

- **对齐 thinworker 编程工具集**：新增 `file_ops`（move/copy/rename）、`process`（列进程）、`get_current_time`、`sleep` 四个内置工具，及 `tree`（递归目录树 + `depth`，对齐 thinworker `repomap`）；各工具描述带「Route to X instead of bash」反向路由
- **内部能力对齐 thinworker**：`grep` 加 `literal`/`ignoreCase`；`ls` 加 `filter`（通配符）；`bash` 加 `filter`（正则行过滤）；`git` 加 `show`/`rm`/`commit`/`push` 子命令 + `filter`；`verify` 加 `filter`/`workdir`
- **`execute` 工具重做**：由同步 vm 沙箱改为 `node --input-type=module --eval` 子进程——支持顶层 `await`、动态 `import()`（直接加载项目 `.mjs`）、原生 `console`/`fetch`，新增 `workdir`/`filter` 参数，保留 killable 超时（无限循环可被终止）；`exec-prelude.mjs` 提供 readFile/writeFile/glob/grep/log/require（路径隔离 workspace）
- **consult 指定子集模型**：`consult_start` 新增 `models` 选择器（`provider:model`/裸 provider/裸 model，大小写不敏感、去重保序）
- **模型规格更新**：新增 glm-5.3、deepseek-v4-flash-vision-exp；gpt-5.6/claude-5 收敛 `thinking=false`

### Fixed

- **apply_patch 多 hunk 错位**：同一文件多个 hunks 因前一段改变行数而错位应用、静默损坏——改为重扫上下文 + splice
- **git 写操作吞错**：`commit`/`push`/`rm` 改用 `runGitStrict` 返回 stderr + exit code，失败不再伪装成功；`show` 补 ref 校验（防 `-` 开头注入选项）
- **tool 补齐项加固**：`get_current_time` 补 weekday；`sleep` 防 NaN；`tree` 深度/计数校验、省略号单次、根目录报错；`log` 非法 count 回退默认

### Docs

- `TOOLS.md` 注册表计数同步（含 ops/tree）
- Changelog backfill 0.12.36 / 0.12.33

## [0.12.37] — 2026-08-22

### Fixed

- **advisor 标签还原**：状态栏徽标与 /advisor 菜单项由 "GUARD" 显示名还原为 "ADVISOR"（内部配置字段 `advisor.guard` 不变，仅显示名）
- **SSE 流式 tool_calls 防御性合并**（PROVIDER.md §10）：跳过 null/畸形元素并计数，按 index/id/name/tail 合并、补齐缺失 id、计数丢弃
- **Windows 剪贴板 BOM 防御**：UTF-8 输出后剥离前导 `\uFEFF`（IK9UWM 后续）
- **上下文压缩空安全**：`t.function?.name` 防 tool name 缺失

### Refactor

- **session.mjs 拆分**：`migrateHashLength` 抽到 `session-migrate.mjs`，文件回到 ≤500 行硬限内
- **/config embedding 保存重构**：`embeddingPatch()` 抽取 + `DEFAULTS` 导出（供单测）

### Prompt

- **确认纪律 carve-out**：system.md 补 doc/code 一致性例外——"改动前确认"门禁不适用于已确认任务的既有义务（文档跟码一致、记录刚做的决策、关闭 advisor 标记的文档缺口）

## [0.12.36] — 2026-08-22

### Docs & advisor

- **文档归属纪律 + advisor 设计评审增强**（规格 AGENT-LOOP.md §12）：新建 `docs/design/README.md` 文档地图（板块→文档映射表 + 存量碎片"待合并（TODO）"标注 + 归属规则）；system.md 补文档归属纪律条款（写文档前先查地图定位所属板块——找到就改、不得为既有板块新建文件；确无归属才新建并登记；同一机制只在一处详述权威源、其余引用不复制）；advisor-design.md 加第 7 维 **Document ownership**（与现有文档矛盾 🔴、该并入却新建/重复描述 🟡）与引用纪律（引用原文用精确 file:line、未核实标注 unverified）；design 提示词 fallback 删除转硬加载（`loadPrompt` 同 round1/2/3 待遇，缺失即抛错——静默降级会丢 Approval Signal 规则致评审无法批准）；messages.mjs design 分支 Instructions 补 Methodology compliance 维度、存在文档地图时注入 Document Map 段供归属检查对照。两端 prompts 保持 byte-identical、测试同步覆盖

## [0.12.35] — 2026-08-21

### Changed

- **advisor 开关语义重构**：评审能力恒启用——`advisor` 工具任何模式都可调用（删除 `advisor.enabled` gate，不再返回 "not enabled"）；开关语义收敛为 guard——收尾推回仅当 `advisor.guard === true`（默认 OFF，评审自愿调用，打开才强制）。工程模式行为不变（评审恒可用、guard 豁免）
- **`advisor.enabled` 废弃**：字段不再读写，存量配置不迁移——旧 `{ enabled: true }` 用户升级后不再强制评审（pre-release 约定，CHANGELOG 说明即可）；/advisor 菜单删除 "Advisor ON/OFF" toggle，Guard 成为唯一开关

### Prompt system

- **提示词借鉴增量（kimi-code 对照）**：explore.md 新增 Thoroughness levels 三档（quick 单点定向 / medium 默认适度并行 / thorough 全面分析且报告须列出搜索过什么与没找到什么）；main.md Delegate well 补委派 explore 时在 task 描述中指定彻底度（未指定走默认）；system.md 确认理解句补 "including the most important acceptance criteria"；subagent 工具 description 同步补彻底度说明。两端 15 个 prompt 文件保持 byte-identical（新增 CLI 侧比对测试防漂移）
- **开工前计划确认纪律**：system.md 追加无豁免纪律——任何写文件动作（write/edit/apply_patch/insert_after/delete/hashline_edit 及一切写文件的 bash）前必须纯文字复述理解+计划要点并等待用户明确确认（未确认/沉默/用户回复新问题或新要求 → 一律不动手；"这太明显了不用问"不是跳过理由；用户的新问题不是确认；需求变化后重新复述重新确认）；engineering.md 澄清完成后、写需求/设计文档前同样须把理解+计划文字化并等待确认。两端 15 个 prompt 文件保持 byte-identical（两端测试断言关键句）

## [0.12.34] — 2026-08-18

### Added

- **/rename 命令** — 改会话标题（renameSlot 双写，与 VS Code 共享）

### Fixed

- **/config 候选池 effort picker 显示真实枚举** — 从固定 min/low/medium/high/max 改为动态读 specForModel(model).reasoningEffortEnum；无枚举的模型跳过 effort 步
- **question 工具 options 防御** — LLM 误传对象时取 label 字段，避免渲染 [object Object]

## [0.12.33] — 2026-08-17

### Changed

- **撞轮数墙可无限继续**：subagent/飞刀/会诊统一经 continue 面板无限续（resume 保留 history，会诊继续重置墙钟；去掉 MAX_RESUMES）
- **MiMo 预置 provider**：按量付费(api.xiaomimimo.com/v1) + Token Plan(token-plan-cn.xiaomimimo.com/v1)，模型规格 mimo-v2.5-pro/mimo-v2.5（1M 上下文 / 128K 输出 / 深度思考）
- **环境变量配置源彻底移除**：THINCODER_* 回退全部删除，config.json 唯一配置源；空配置不再合成 deepseek 默认 provider
- **effort 枚举钳制 + qwen3.8-max spec 修正**（consult/escalate）

## [0.12.32] — 2026-08-16

### Fixed

- **会诊触发条款重构**（两轮会诊驱动的修复）：触发规则从飞刀段移入会诊段且自包含——功能请求语义（"会诊一下"触发、"consult the docs"不触发）+ 用户请求覆盖自主判断；consult_start 描述补对称触发句；飞刀段补 fly-in/口语变体
- **飞刀三个真实断链**（会诊发现，此前"代码在但真实跑必翻车"）：
  - 删墙钟看门狗——固定墙钟误杀正常但慢的手术（实测两个 max-effort 顾问读 5 个文件即撞 10min 墙）；完全依赖 turns + FETCH_TIMEOUT + 用户 Stop 直传
  - effort 枚举钳制——池 effort 越界不再让候选"起飞即死"，回退预设并标注
  - AUTO 传导对齐 subagent——headless 嵌入下父 autoApprove 正确放行子 agent 写操作
- **config 加载校验**：consultModels 池 provider 名必须存在于 providers[]，条目形状校验——静默运行时失败改为启动即报错
- **撞墙可继续（kimi-k3 飞刀）**：escalate 子 agent 撞 turn 上限后弹"继续?"（复用 onPermissionRequest，TUI 同款 y/n 面板），resume:true 续跑不重复注入任务、预算重置，上限 2 次；顺带修复 ContinueError e.turns → e.turn（原来打印 "undefined turns"）
- consult 死代码补 precheck（无 key 时明确失败回复而非原始 401）

### Docs

- CLI CONSULTATION.md / ESCALATE.md 文档地图收录、FEATURES.md 功能全览补齐（7→11 个）、README 会诊别名、checklist T2-T6 验收

## [0.12.31] — 2026-08-16

### Fixed

- **/config consult model picker**: adding a consult model now uses pickModelForSlot (provider AND model are both OPTION pickers, reusing /model's async-fetched model list) — was free-text for the model name
- **Prompt adaptation**: CLI main.md was missing the consult (会诊) + escalate (飞刀) sections — the CLI main agent did not know "会诊" meant consult_start. Ported both + added the 会诊 alias to consult_start's tool description

### Prompt system

- Attention optimization + cross-end consistency: split over-long sentences, fixed an escalate-timing contradiction (up-front ability judgment), unified Review discipline + advisor rounds — all 15 prompt files byte-identical with the plugin

### Docs

- CONSULTATION.md + ESCALATE.md design docs (CLI implementation differences vs the plugin)

## [0.12.30] — 2026-08-16

### New: 会诊 (consult) + 飞刀 (escalate) — full VS Code plugin parity

- `consult_start` / `consult_check` / `consult_stop`: several configured models run as parallel independent read-only consultants — each with its own TUI activity card, `main_history` access to the failure trail, arrival-order reply queue, stopped/terminated settle states, wall-clock watchdog
- `escalate`: fly in a stronger model for one expert implementation run — coder role, full write path, permission gate, mutations merge into the parent's verify/advisor guards, turn-cap reads as partial work, timeout reads as timeout
- Config: `agent.consultModels` ([{ provider, model, effort? }], up to 5, validated), `agent.consultTurns` (40), `agent.consultTimeoutMs` (600000)
- **/config now manages the consult pool**: list / add / remove models; per-model reasoning-effort is an OPTION picker (none/min/low/medium/high/max); consultTurns + consultTimeoutMs (entered in minutes)

### Discipline

- UI rule added: fixed-choice values must be OPTIONS (picker/menu), never free-text — free-text only for genuinely open-ended input

## [0.12.29] — 2026-08-16

### Fixed

- **Coder sub-agents (subagent role=coder) get verify + advisor** — CLI parity with the plugin's escalate diagnosis: the system prompt names both tools but the tool table only gave them to eng-coder; a coder sub-agent hit unknown-tool and self-verified via bash
- **Cache-audit follow-ups**: OS/cwd reminder injected once per process (was every run); interrupt-resume now re-grounds the time (was stuck on the pre-interrupt time); skills scan sorted deterministically (filesystem-dependent readdir order could byte-change the system prompt with zero content change)

## [0.12.28] — 2026-08-16

### Cache-hit-rate fix (user-reported low hit rate on session start)

- **Machine line (contextHistory) now keeps transient messages on persist** — every CLI invocation is a new process; the previous reals-only reload plus fresh re-injections (git/OS/outline/doc/memory/time) diverged at index ~1 → whole-prefix cache miss on the first request of every session. Resume now rebuilds a byte-identical machine line; new injections append at the tail
- Time reminder moved to the END of the message sequence (after the user input) — aligned with the plugin fix, robust against any future machine-line disk reload

### Fixed

- normalizeToolPairing early-return hole: toolById empty must not skip placeholder filling when assistant tool_calls are declared (dangling tool_calls 400 otherwise)

## [0.12.27] — 2026-08-15

- Time injection moved OUT of the system prompt into a transient per-run user reminder — system prompts fully static again (prefix caches hit across hours, not minutes); local time + IANA timezone at second precision; now covers ALL agent depths (subagents previously had no time grounding at all)

## [0.12.26] — 2026-08-15

### ACP extensions for thincoder-desktop (proposals ①②③④, all implemented)

- **① Session persistence**: every ACP turn end (success/cancel/failure — finally semantics) writes the session archive via saveSession; session/list / load / resume now have a real data source. Save is injectable and failures never break the queue
- **② Checkpoints**: checkpoint/create / checkpoint/list / checkpoint/restore ACP handlers; NON-git cwds now snapshot by full-directory copy (v2 layout, nongit meta) instead of silently returning null
- **③ Memory**: memory/list / memory/remove ACP handlers over the shared ~/.thincoder store
- **④ Custom provider headers**: provider.headers object in config.json merges into every LLM request (chat + /models); Authorization cannot be overridden; non-string values sanitized out

### Fixed

- Time injection vs prefix-cache conflict: system-prompt "Current time" is now MINUTE precision — byte-identical within the same minute so DeepSeek prefix caches still hit (was: seconds precision broke the cache every run)

## [0.12.25] — 2026-08-15

- Local time + timezone injected into every system prompt (main agent, subagents, advisor) — prepareRun appends `Current time: <local> (<IANA zone>)`; sessionStart was ISO/UTC and session-scoped, subagents had nothing
- bash.md Windows guidance corrected: the shell is cmd.exe (NOT Git Bash) — &&/|| work, cmd built-ins, NUL not /dev/null, prefer node -e for complex logic

## [0.12.24] — 2026-08-14

### Added

- **glm-code provider preset** — the Zhipu GLM Coding Plan endpoint (`https://open.bigmodel.cn/api/coding/paas/v4`, glm-5.2, same key as GLM; server-side forced thinking).

### Fixed

- **Model specs synced with official vendor docs (verified 2026-08)** — DeepSeek v4 duals effort enum +low and cacheMode→auto; qwen3.x/max/plus maxOutput→131072 (qwen-plus was 32K).
- **Retired models dropped** — deepseek-chat/reasoner, kimi-k2, moonshot v1 (vendor shutdowns; unknown IDs fall back to the 128K default spec).

### Changed

- Repository URL → github.com/xinbo-tech/thincoder.

## [0.12.23] - 2026-08-13

- **修复** svg 图片毒化会话——read_image 读 svg 后以 image_url 进历史，Kimi 等视觉 API（全部仅支持位图）此后每轮请求 400 "unsupported image format"，会话永久卡死；现在发送时按格式净化：非 png/jpeg/gif/webp 的 image part 替换为占位文本，净化上移至 format dispatch 之前覆盖 openai/anthropic/google 全部通路，历史本身不改写（切回支持的模型/格式可恢复）
- **改进** read_image 对 svg 返回文本源码（svg 本是文本标记，任何模型可读，绕过 vision gate）；bmp 拒绝并提示转 PNG（无主流视觉 API 支持）

## [0.12.22] - 2026-08-13

- **修复** 缓存命中率对 Kimi 显示——usage 缓存字段归一化：Kimi/OpenAI 风格 `prompt_tokens_details.cached_tokens` 映射为 DeepSeek 风格 `prompt_cache_hit_tokens`，miss 由 prompt_tokens − hit 推导（此前 Kimi 的命中率永不显示）
- **安全** fetch 重定向目标做 SSRF 检查——3xx 可把公网 URL 跳进内网（重定向绕过）；相对 URL 正确解析、仅 http/https、私网/元数据拦截
- **新增** Tavily 结构化搜索（可选）——config 配 `websearch.apiKey` 后 `websearch` 走 Tavily API（稳定 JSON，不再依赖 Bing 页面结构）；无 key 回退 Bing 抓取，零门槛不破坏

## [0.12.21] - 2026-08-13

- **修复** 恢复会话大量重复 "❯ ThinCoder:" 标签——history 按每次 LLM 调用存一条 assistant 消息（一个 turn 多段），恢复时每段都渲染了标签；现在只在 turn 开始渲染一次，跨页懒加载边界状态正确保留
- **改进** 恢复保真度：完整工具结果（不再一行摘要）+ reasoning 思考流以 dim 行恢复（超长自动折叠）——恢复后的会话与退出前基本一致；首帧渲染实测约 50ms

## [0.12.20] - 2026-08-13

- **修复** TUI 恢复旧 display 快照导致"看不到最新消息"——display 字段彻底废弃（saveSession 不再写、loadSession 不再读），恢复永远从 history 重建；配合 VS Code 端 0.1.5 的清空，跨端会话漂移根治
- **新增** TUI 懒加载历史恢复：启动只物化最近 200 条消息（8000+ 条会话不再冻结启动），PgUp 到顶按 50 条/页加载更早历史，scroll 补偿保持视觉位置
- **新增** question 选项列表末尾追加"✍ Custom answer…"——选中切自由输入，用户可补充/修正 AI 的预设选项
- **重构** execute 工具移除假沙箱：require()/process 全可用（bash 本就能触达任意 Node API，拦 require 只会误导模型）；移除动态 import 拦截与 SSRF 私网拒绝；保留 timeout / cwd 约束 / 输出上限等工程保护
- **改进** 工程模式 prompt：新增提问风格指引（默认开放式自由文本，选项仅用于有限枚举）；审查修复 5 处（需求优先步骤、designToken 仅走参数、用户审批呈现 advisor 发现、澄清完成判据、advisor 重试 3 轮上限）

## [0.12.19] - 2026-08-11

- **重构** bash 工具安全模型：移除全部破坏性命令文本拦截（rm -rf / DROP TABLE 等）——文本匹配是安全剧场（恶意模型可绕过、误伤正常操作），真实防线 = 审批层（autoApprove）+ 快照（gitGuardSnapshot / checkpoint），与 env 透传、git"快照后放行永不拦截"统一
- **新增** 危险命令标注（detectDanger，参考 kimi-code）：recursive-delete / sudo / pipe-to-shell / dd / mkfs / 裸设备 / chmod 777 / fork bomb 在 TUI 与 ACP 审批面板红色标注——只提示不拦截，帮人做审批决策；引号感知（commit message 等纯文本不误标，反引号内容保留）
- **文档** TOOLS.md 安全边界同步（零文本拦截 + 危险标注）

## [0.12.18] - 2026-08-10

- **修复** Qwen 路由等代理的模型 ID（如 `kimi/kimi-k3`）跳过 `reasoning_effort` 参数——路由可能误处理该参数导致空回复

## [0.12.17] - 2026-08-10

- **修复** `kimi/kimi-k3`（Qwen 路由前缀 ID）模型规格匹配 — 正确继承 kimi-k3 的 1M 上下文 / 131K 输出 / 多模态

## [0.12.16] - 2026-08-10

- **修复** 非 SSE JSON 响应被误判为错误（HTTP 200 + tool_calls 的合法 JSON 响应现在正确解析，而非报 "Response is not SSE"）
- **改进** API 错误信息可读性：非 SSE 错误响应包含 HTTP 状态码 + 具体错误原因

## [0.12.15] - 2026-08-10

- **改进** API 错误信息可读性：非 SSE 响应预拦截，提取 HTTP 状态码 + 具体错误原因（替代原来模糊的 "Response is not SSE"）

## [0.12.14] - 2026-08-10

- **修复** 小终端 permission 面板挤出输入框（layout 溢出补偿新增 permission 压缩）
- **修复** iTerm2 Ctrl+C 键盘协议序列泄漏（stdin 剥离未处理的 CSI u 序列）
- **修复** eng 模式 advisor token 正则错配（改用完整 token 构建正则，与 prompt 格式一致）
- **修复** 输入框 ↑ 键历史导航草稿丢失（进入/编辑历史模式时扩容草稿保护）
- **重构** key-handler 拆分搜索模块（key-handler-search.mjs）
- **文档** 架构文档计数/模块/状态同步更新

## [0.12.13] - 2026-08-08

评审机制全面重构（用户驱动的三轮决策）：

- **prior 硬解析移除**：收敛轮注入上一轮评审的完整原文（模型直接理解），删除表头匹配与 all-clear 短语两类"字符串解析 LLM 输出"的脆弱机制
- **评审触发范围收缩**：评审只跟代码修改绑定——bash/git 等副作用工具不再触发多余评审轮（评审后读日志/清理临时文件不再要求重复评审）
- **AGENTS.md 文档地图**：需求基线声明（REQUIREMENTS.md + 设计文档 + 对话背景）+ docs/design/ 27 份文档分组清单，评审者按地图定位需求文档
- **项目根发现**：多项目工作区从评审范围定位子项目 AGENTS.md（工作区元地图不遮蔽）；修复混合路径分隔符误判
- **收敛体共享模块**：round 2+ 消息构建单一来源；空回复/纯工具输出不再冒充评审记录

## [0.12.12] - 2026-08-07

- advisor 记录按真实时序落盘（timeline）、markdown 表格 render-before-measure 对齐修复（含 heading 多行/双重粗体）、requirements 兜底、评审结论可用性提示
- 双线消息历史（人读线 + 机读线）、压缩只作用于机读线、机读消息不进人读线
- 临时文件（tmp-*）不触发 advisor guard；config.mjs 加固（spec 预排序、providers 守卫、saveConfig 写副本）
- VS Code 扩展发布准备（marketplace 元数据、.vscodeignore、vscode-mock 依赖修复）

## [0.12.11] - 2026-08-05

- subagent 按类型配置模型（`/submodel` + `subagentModels`）
- 可配置 bash shell（`/shell platform` 切换）
- 其他稳定性与体验改进

## [0.12.10] - 2026-08-05

- 代码质量梳理：清理未使用的导出、advisor 计时器与静态导入修复、复评不再因旧会话数据误报

## [0.12.9] - 2026-08-04

- 提示词体系质量梳理：移除工程模式与 advisor 的冲突、交付评审语义修正

## [0.12.8] - 2026-08-04

- pending-task 推回最多触发一次（消除无界完成循环）

## [0.12.7] - 2026-08-03

- 折叠可读性修复（主输出/思考永不折叠）、窄终端宽表格裁剪

## [0.12.6] - 2026-08-02

- checkpoint v2、git 破坏性命令保护、鼠标支持、长消息折叠、bash 行为约束

## [0.12.5] - 2026-08-01

- 行内代码下划线样式

## [0.12.4] - 2026-08-01

- 压缩统一规范、Kimi For Coding、Ctrl+C 双重确认、空响应重试、markdown 渲染修复

## [0.12.3] 及更早

v0.12.x 早期版本、v0.11.x、v0.8.x、v0.7.x 与 v0.2–v0.6 系列——完整历史见 [git 提交记录](https://gitee.com/shanghai-xinbo/thincoder/commits/main)。
