# Session 持久化设计（thincoder/src/session.mjs） > 状态：2026-08 回补。**CLI 与 VS Code 共享同一存储契约**——文件格式、槽位认领、双线字段全部一致（VS Code 侧实现见 thincoder-vscode/src/extension/session-io.mjs，同一契约的镜像）。 ## 1. 核心模型 - **按 cwd 隔离**：会话目录 `~/.thincoder/sessions/{sha1}.json.*`——cwd 的 **40 位完整 sha1**（非截断；Windows 盘符大写归一化，保证 CLI `process.cwd()` 与 VS Code `uri.fsPath` 算出同一 hash）。
- **槽位制，无"当前文件"**：`{hash}.json.N` 是第 N 个槽位的完整会话；`{hash}.json.manifest` 存槽位元数据 + active 指针 + 进程认领表。**active = 共享当前指针**（2026-09-05 §10 D-6 修订）：旧版端/ACP 的恢复依据 + 无记录端的一次性继承源 + 列表回退高亮——**本端恢复依据 = §10 的 end marker**（`{manifest}.cli|.vscode`，各端单写者），不再以 active 为第一依据；setActive 纪律（认领/新建/切换/删除）原样保留。
- **文件无上限**：槽位按需递增（`/session` 查看/切换，`/new` 开新槽）。
- **旧格式迁移**：12 位短 hash 文件一次性重命名为 40 位（幂等）；legacy `{hash}.json`（v1 单会话）读取时迁移进槽位。 ## 2. 并发安全（CLI ↔ VS Code 双进程） | 机制 | 说明 |
|---|---|
| `sessionId` | 每进程唯一：`pid-timestamp-random`，写入 manifest 的 `sessionId` |
| `slotSessions` 认领表 | `ensureActive` 按优先级认领：当前 active 空闲 → **文件缺失的空槽**（2026-08-31 会诊 F4：不再认领"最小空闲号"——死主的旧槽文件仍在，会 resume 进陌生会话且退出时覆盖）→ 全被活进程占用时开新槽（新号从 max+1 起跳过活认领号/现存文件号，2026-09-01 会诊 kimi 🟡；max 取 `allSlots[last]` 而非 `Math.max` spread——数万槽位时 RangeError 风险） |
| 死主条目清理 | 2026-08-31 会诊 F4 + 2026-09-01 会诊 deepseek/kimi 🔴：`ensureActive` 开头删除 owner 已死的 `slotSessions` 条目（死主判定必须跑 `isProcessAlive`；ensureActive 因 F1 粘性每次进程只触发几次，全量 tasklist 成本可接受；不能以"文件缺失"短路——活进程在"认领→首次保存"窗口文件暂缺，误删会致双进程同槽）。**清理落盘必须传 `deletions` 参数**（早退 + 分支 1/2/3 全部）——saveManifest 条目级合并会把磁盘上仍存在的死条目从 fresh 复活回写，仅传 m 等于没删（advisor N1 只修早退路径，会诊抓到三分支复活）；`deadParam` 按调用时状态过滤刚重新认领的槽，避免删掉自己的新属主 |
| `isProcessAlive(pid)` | Windows `tasklist /FO CSV`（PID 列精确比对）/ Unix `kill(pid,0)`——死进程的槽位可回收复用 |
| slot 粘性 | 2026-08-31 会诊 F1：`saveSession` 首次认领后缓存 `agent._slot`，**永不重跑** ensureActive（原实现每次保存重推，manifest active 被并发方翻动时会话静默迁移 → 双副本/覆盖他人）；`applySession` 清空缓存（切换后重新认领 manifest active），ACP 加载路径显式钉回目标槽 |
| ACP 同进程多会话 | 2026-09-01 会诊 kimi/glm 🔴：`getSessionId()` 是**进程级**、`_slot` 是 **agent 级**——粒度错配使同进程两会话互相视为"自己"（两次 `session/new` 拿同一槽 → F2 互旋；同槽 load 两次 → 静默互覆盖）。修复：`session/new` 立即 `newSession()` 钉独立槽；load/resume 钉槽前查 `sameProcessPinned`（sessions Map 内其他 session 已钉同槽），占用则 `newSession` 显式 fork 新槽——**绝不 `_slot = null` 等下次保存**（`saveSession → activeSlot → ensureActive` 分支 1 早退 `slotSessions[active] === mySessionId` 同进程恒真 → 落回同进程 active 槽即他人槽）；`session/delete` 删非 active 槽时在存会话同型立即 `newSession` 重钉（advisor round2 🔴 同族残留） |
| `slotOccupancy` | 目标槽是否被**另一活进程**占用（/session 切换提示、ACP 钉槽前检查）：**排除本进程属主**（`owner === getSessionId()` → 空闲，2026-09-01 advisor 🟡——session 重选当前槽不误报）；同进程双会话防护由 ACP `sameProcessPinned` 承担 |
| 原子写 | `writeSessionFile`：先写 `.tmp` 再 rename（跨盘失败降级 unlink+rename → 直写）；防中途崩溃产生截断 JSON |
| `.corrupted` 兜底 | 读失败的文件改名 `.corrupted` 保留现场，不覆盖；**损坏的 manifest 同样改名 `.manifest.corrupted` 保留**（2026-09-01 advisor 🟡——否则覆盖后全部槽位元数据丢失，/session 列表变空） |
| `.unreadable` 保留 | 2026-08-31 会诊 F2：version/cwd/history 结构校验失败不再静默返回 null（否则新会话首次保存覆写旧文件）——改名 `.unreadable` 保留现场；**version > 2 的新版文件不动**；cwd 不匹配是别人的文件也不动 |
| 覆盖防护（.bak 轮转） | 2026-08-31 会诊 F2 + 2026-09-01 会诊 deepseek 🟡：`saveSession` 写前校验目标槽的 `sessionStart` 与本进程不符 → 先 `rename` 为 `.bak-{ts}` 再写（11311 条历史被新进程覆盖的实锤场景）；**version > 2 的文件无论 sessionStart 一律轮转**（loadSlotFile 对 v3 返回 null 不动，若其 sessionStart 为 null 旧版首次保存会静默覆盖）；轮转路径经返回值透出；检查按 mtime 缓存避免每次保存全量解析 |
| `saveManifest` 合并 | 2026-08-31 会诊 kimi/deepseek 🟡 + 2026-09-01 三家 🟡：写前重读按**条目级**合并（`{...fresh.slots, ...m.slots}`、slotSessions 同理）防丢失更新；**删除意图经 `deletions` 参数显式表达**（deleteSlot、死项清理）；**active 是单值——只有显式翻指针的调用点（ensureActive 分支、newSession、switchToSlot、deleteSlot 删到 active）传 `setActive`**，其余调用点（saveSession/ACP 认领）默认保留磁盘 fresh.active，否则毫秒窗口内回滚并发方刚翻的指针 | 并发场景：CLI 与 VS Code 同时打开同一项目——各认领不同槽位互不覆盖；`/session` 与面板会话列表看到的 active 指针一致（切换会持久化到共享 manifest）。 ## 3. 会话文件内容（v2，双线结构） ```jsonc
{ "version": 2, "cwd": "D:\\teamcode", "title": "…", "activeProvider": "deepseek", "activeModel": null, "updatedAt": 1754200000000, "history": [ /* 人读线：完整真实消息，永不压缩（UI 渲染 + CLI resume 显示读它） */ ], "contextHistory": [ /* 机读线：可能已压缩的模型上下文（恢复后保留压缩收益） */ ], "tasks": [], "planMode": false, "autoApprove": false, "engineering": false, "engDesignToken": null, "goal": null, "advisor": { /* advisor 配置快照 */ }, "pendingReminders": [], "sessionStart": 1754200000000
}
``` **双线写入契约**（详见 ARCHITECTURE.md §双结构 + CONTEXT-COMPACTION.md）：
- 真实消息（用户输入/assistant 回复/tool 结果/多模态图像）走 `pushReal` → 同时进 `history`（人读）与 `contextHistory`（机读）
- 机读消息（`[System reminder:`、`[User interrupt:`、压缩 note、task/plan 回注）只进 `agent.history`，**不进人读线**
- **transient 消息（编辑器上下文注入等）**：**人读线（history）落盘时过滤**（`saveSession` 的 `!m.transient` + legacy 前缀清理 `LEGACY_TRANSIENT_PREFIXES`）；**机读线（contextHistory）保留**——恢复必须逐字节重建 provider 前缀缓存所见的序列（2026-08-16 cache-hit 报告；丢 transient 会让每次重启在首个注入位漂移 → 首请求整前缀缓存 miss）
- **人读线落盘瘦身（`slimForDisplay`，2026-08-30 会诊 3/3 设计、deepseek 方案）**：`saveSession` 写盘时对 `history` 做 copy-on-write 映射（**绝不原地改**——两线经 pushReal 共享对象引用，原地改会污染机读线与 provider 前缀缓存）： - `assistant.tool_calls[].function.arguments` 截 300 字符（head + `…`） - `tool` 消息 content 截 500 字符（head + `… (truncated for storage)`） - 多模态 user content 数组：保留 text part，**丢弃 image_url base64 part**（显示只需 text；模型侧图像由 multimodal 通道承载） - **`contextHistory` 一字不动**——机读线保持与 provider 前缀缓存逐字节一致（strict pairing/多轮看图全靠它）。实测 18MB 会话重存后大幅缩水（base64 + 工具结果正文占大头） - VS Code 端同批落地（session-io.mjs 同款 `slimForDisplay`）——两端写出的会话文件一致瘦身；vscode 的 historyWindow 只渲染字符串 content，瘦身后显示安全
- **消息 ts（§9 权威，2026-09-03）**：每条**真实消息**带 `ts`（epoch ms——pushReal 落对象时刻，单点打点）；压缩重建注入的 note/"Understood" 同刻打点（Date.now()——压缩时刻）；**旧消息（恢复自存档）不补 ts**——补近似值误导取证（D-S3 容忍）；`slimForDisplay` copy-on-write 保留 ts。ts 是**本地字段**：发送层剥离（`stripLocalMessageFields`——ts/transient 同规则，不进任何 provider 请求），UI 不渲染（仅 read_history 输出/会话 JSON 可见） ## 4. 保存与恢复 **saveSession(agent)**（2026-08-31：`display` 参数已废弃——TUI 恢复始终从 history 重建；返回轮转的 `.bak` 路径或 null）：`history = (_fullHistory ?? history).filter(非 transient + 非 legacy-transient)`、`contextHistory = agent.history.filter(非 legacy-transient)`（**机读线保留 transient**——逐字节重建前缀缓存的依据，2026-08-16 cache-hit 报告）→ 写 `agent._slot`（粘性缓存，首次认领）槽 + 更新 manifest 摘要（`slotDigest`：messageCount/turnCount/firstMessage/activeProvider/title）。TUI 在每次回合结束增量保存（agent-turn finally），崩溃最多丢半轮。 **loadSession(cwd)**：读 active 槽（`.tmp` 备份优先回退）→ legacy 兜底 → 全部失败返回 null。 **loadSlotFile(cwd, slot)**（2026-08-31 会诊 deepseek 🟡 抽取）：**无认领副作用**的槽文件读取器，`loadSession`（active 槽）/`switchToSlot`/ACP `session/load` 共享同一校验——version 1/2 + history 数组 + cwd 匹配；结构不符改名 `.unreadable`、解析失败 `.tmp` 回退成功后提升为正主（损坏主文件改名 `.corrupted` 保留）、**主文件缺失时恢复孤儿 `.tmp`**（rename 前崩溃现场，2026-09-01 advisor 🔵）。 **applySession(agent, data)** 恢复语义：
```
人读线 _fullHistory ← data.history
机读线 agent.history ← data.contextHistory（缺失/为空才回退 history 播种）
title/tasks/planMode/autoApprove/goal/pendingReminders/sessionStart/advisor ← 对应字段
activeProvider ≠ 当前 → 按名切回 provider（找不到不回切）
_compressFailures/_verifyRetries 重置
_slot/_slotMtime 清空（2026-08-31 advisor：切换后保存重新认领 manifest active，防落错槽）
```
**机读线必须从 contextHistory 恢复**而非从完整 history 重建——后者会把已压缩的中间过程塞回上下文（实测 prompt 膨胀到 283%）。`compactThresholdAuto` 时按恢复后的模型重新推导阈值（bin/thincoder.mjs）。**v1 老文件（无 contextHistory）回退播种时剥离被 slimForDisplay 截断的 `tool_calls.arguments`**（以 `…` 结尾 → 置 `{}`；2026-08-31 会诊 F6——截断可劈断 `\uXXXX` 产生 400 毒载荷）。 ## 5. 切换与归档 - `/new`（`newSession` + `resetSessionState`，2026-08-31 会诊 F3 + 2026-09-01 会诊/advisor）：分配新槽并**立即记录所有权**（slotSessions，防并发方认领）；选号跳过 manifest 条目 / 现存文件 / 活认领号（`existsSync` + `liveClaimed`，2026-09-01 会诊 deepseek/kimi 🟡）；**开头清理死主条目**（死主且文件缺失的槽号连 `m.slots` 条目一并删、回收复用，与 ensureActive 分支 2 语义对齐，advisor 🔵）；`resetSessionState` 清空 `_fullHistory/title/_sessionStart/_engDesignToken/压缩与验证计数/tasks/planMode/goal/reminders/_slotMtime/_slot` **以及进程级注入标志 `_osReminderInjected/_restartReminderInjected/_lastEngState`**（2026-09-01 会诊 glm 🟡——不清则 /new 后新会话永不注入 OS/cwd reminder）；不清 `autoApprove`（用户偏好跨会话保持，有意）——原实现只清 `agent.history`，新会话首次落盘把旧会话完整人类线 + 旧标题写进新槽（实锤 `.19`/`.3` 双副本）
- `/session`（`listSlots`）：按 updatedAt 降序列出全部槽位元数据；**只读操作不认领**（active 缺失时全部 isActive=false，由下一次 activeSlot 正常认领，2026-09-01 会诊 🟢）
- `/session N`（`switchToSlot`）：**直接 `loadSlotFile` 读目标槽**（2026-08-31 会诊 deepseek 🔴——原经 loadSession 的 activeSlot 有认领副作用，目标槽被活进程占用时 ensureActive 分支 3 会把 active 拨到新空槽并读回 null + 劫持对方指针），只改 manifest 指针，**无文件拷贝**；目标槽空闲则一并认领、被**另一活进程**占用则不认领（`slotOccupancy` 提示——下次保存经 activeSlot 自然 fork 到新槽）；随后 `applySession` 清空 `_slot` 缓存——切换后的保存落在目标槽
- 删除：`deleteSlot` 删文件 + 清 manifest 条目 + `deletions` 显式删除（防合并复活）+ 删到 active 时置空 active 指针（`setActive`）；ACP `session/delete` 只删 archive，**在存会话立即 `newSession` 重钉新槽**（2026-09-01 advisor round2 🔴——清 `_slot` 等下次保存会落回同进程 active 槽即他人槽）
- 退出不归档：`/exit`/Ctrl+C 只保存当前槽——避免"打开关掉就塞满槽位" ## 6. 与 VS Code 的契约对齐点 | 契约 | CLI | VS Code |
|---|---|---|
| cwd hash | 40 位 sha1 + 盘符大写 | 同（session-io.mjs 同实现） |
| 槽位认领 | slotSessions + isProcessAlive | 同（面板绑槽后固定） |
| 双线落盘 | `history` + `contextHistory` | `saveMessages(msgDir, name, messages, contextHistory)` 同字段 |
| 旧格式回退 | 无 contextHistory → 从 history 播种 | 同（`contextHistory: null` → 播种） |
| transient 过滤 | 人读线过滤 `!m.transient`，机读线保留（前缀缓存逐字节依据） | 同（`_saveLines` 落盘过滤，2026-08 修复） |
| 本端记录（end marker，§10） | `{manifest}.cli`：`{"slot": <number|null>, "updatedAt": <epoch ms>}`；本端单写者；读侧损坏按缺失降级（不 rename/unlink）；`slot:null` = 删过本端记录槽（显式置空——绝不继承） | `{manifest}.vscode` 同形同语义（2026-09-05 双端同批） | **2026-09-01 会诊 4 模型（glm/deepseek/kimi/qwen）共识——跨端共享会话契约增补**： | 契约 | CLI | VS Code | 破坏场景（修复前） |
|---|---|---|---|
| `sessionStart` 打点 | `setup.mjs` `_sessionStart ??=` 赋一次 | `saveLines` `existing.sessionStart ?? new Date().toISOString()` 赋一次（2026-09-01 补） | VS Code 恒 null → F2 条件永不触发（无覆盖防护）；CLI 加载 VS Code 槽后 setup 打自己的 start → 跨端保存必轮转对方现场（F2 自伤，"先占者赢"） |
| legacy transient 过滤 | `isLegacyTransient`（读 loadSlotFile + 写 saveSession 双点） | 同（session-io.mjs 移植，读 loadSlot + 写 keepReal/keepMachine，2026-09-01 补） | 旧注入在 VS Code 进 UI/进播种机器线/保存永久回写（CLI 的清污被重新污染） |
| 机读线判定 | `contextHistory.length > 0` 才当机读线 | 同（activeLines，2026-09-01 补） | `contextHistory: []` + history 非空 → VS Code 恢复空机器线（静默丢全部上下文） |
| v1 回退剥离截断 args | `stripTruncatedToolArgs`（F6） | 同（session-io.mjs 移植，2026-09-01 补） | 旧 v1 文件恢复后把 `…` 半截 arguments 发向网关 → 400 hex-escape |
| 同会话并发追加检测 | （F1 粘性 + 每保存重读磁盘，天然低风险） | `saveSessionToSlot` 磁盘 history 比待写快照长 → 轮转 .bak（2026-09-01 补） | 面板 turn 快照写回覆盖 CLI 并发追加的消息（静默丢失） |
| `activeModel` 双向 | 写 + 恢复时设置 provider.model | `saveLines` 写 `extra.activeModel ?? existing.activeModel`（2026-09-01 补） | VS Code 不写 → CLI resume 读到 VS Code 改模型前的旧值（单向不共享） |
| manifest 死主清理 | `newSession` 传 `deletions`（2026-09-01 补，与 ensureActive deadParam 同型） | `newSlot` 同（2026-09-01 advisor round2） | 仅传 m 等于没删（条目级合并把磁盘死条目从 fresh 复活）——清理永不持久化 |
| `loadManifest` 容错 | `!m.slots` → `{}`（2026-09-01 补） | 原有 | 损坏的 `{}` manifest → `newSession` 抛 TypeError |
| 读校验顺序 | cwd 先行（"别人的文件不动"优先于结构校验，2026-09-01 补） | cwd 先行（原有） | 异 cwd + 坏 version 的文件被改名 .unreadable（违反"别人的文件不动"） | > **新字段双端同步条款**：CLI `saveSession` 全量覆盖写、VS Code `saveLines` `...existing` 保留未知字段——两端字段集必须同步演进；任何一端新增槽内字段（如 activeModel/engineering）须在同一变更中落档本节并双端实现，否则 CLI 保存会静默删除 VS Code 侧新字段。 ## 7. Issue 变更段（2026-08-22 · 需求层） > 来源：Gitee #IK9UZ8。两端同修（CLI `src/generate-title.mjs` + VS Code `src/extension/generate-title.mjs`）；本文件为权威源，VS Code 端 `docs/design/ARCHITECTURE.md` 变更段引用（不复制）。 ### IK9UZ8 · 思考型模型会话标题生成失败 **总体需求**：思考型模型（DeepSeek `thinking:{type:"enabled"}`、GLM 等）下会话自动标题生成成功。根因已验证：标题请求 `max_tokens: 30` 全部被 `reasoning_content` 消耗，`content` 为空 → 标题 null → 回退首条消息前 40 字（多个会话同名，无法区分）。 **功能性需求**：
- F1 使用思考型模型的用户，每个会话仍有自动标题，`/session` 列表可区分会话。
- F2 修复：标题请求**显式禁用思考**（OpenAI 兼容格式 body 加 `thinking:{type:"disabled"}`；provider 不接受的字段由其忽略）+ 提高 `max_tokens`（30→100，设计层定值）。
- F3 两端同修：CLI `generate-title.mjs`；VS Code `generate-title.mjs` 的 `requestTitle` 独立 fetch 不走 buildRequest 的 spec 思考注入，需在 body 显式处理。
- **范围边界**：标题规范（≤40 字符、无引号）与失败静默降级语义不变；anthropic/google 格式的思考型模型影响（设计层确认是否需要同样处理）。 **非功能性需求**：
- NF1 超时 10s、失败静默降级不变。
- NF2 成本：标题请求 token 上限适度，不随会话长度增长。 ### IK9UZ8-D · 设计层 **方案**：标题请求显式禁用思考 + 提高输出上限；两端同修。已否决：从 `reasoning_content` 里提取标题——reasoning 是思考过程不是标题，读出的是推理片段而非标题文本；禁用思考后 content 正常返回，无需兜底读取。 **CLI `src/generate-title.mjs`**：
- body 增加 `thinking: { type: "disabled" }`；`max_tokens: 30` → `100`
- 读取逻辑不变（`choices[0].message.content`）；provider 不支持 thinking 字段的按未知字段忽略处理（OpenAI 兼容 API 惯例）
- **CLI 仅 OpenAI 兼容格式**：`generate-title.mjs` 单一 fetch 直拼 body（无 format 分派，无 anthropic/google 分支）——anthropic/google 格式标题请求仅存在于扩展端，CLI 侧无需对应处理 **VS Code `src/extension/generate-title.mjs` `requestTitle`**（其独立 fetch 不走 buildRequest 的 spec 注入，需显式处理）：
- openai 格式分支：body 加 `thinking: { type: "disabled" }` + `max_tokens: 100`
- anthropic 格式分支：`max_tokens: 30` → `100`（anthropic 扩展思考默认关闭，不传 thinking 即不思考，无需禁用字段）
- google 格式分支：`generationConfig.maxOutputTokens: 30` → `100`（thinkingConfig 不传即不思考） **受影响文件**：`thincoder/src/generate-title.mjs`、`thincoder-vscode/src/extension/generate-title.mjs`、新增 `thincoder/test/generate-title.test.mjs`、修改 `thincoder-vscode/test/unit.test.mjs`（generate-title describe 内追加）。 **关键决策**：禁用思考而非提取 reasoning（见方案）；max_tokens 100 是 40 字符标题（≈60-80 token）的 2.5 倍余量，思考禁用后 30 也够，但 100 防御意外空转；标题规范（≤40 字符、无引号）与静默降级不变。 **测试用例表**： | # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | CLI：mock fetch，断言请求 body | body 含 `thinking:{type:"disabled"}` 且 `max_tokens:100`；返回正常 content → 标题提取正确 | F2 |
| T2 | CLI：响应 content 为空 | 返回 null（静默降级不变） | 边界 |
| T3 | CLI：HTTP 400 / 网络错误 | 返回 null，不抛出 | 错误条件 |
| T4 | vscode：mock fetch 断言 openai 分支 body | 含 `thinking:{type:"disabled"}` + `max_tokens:100` | F3 |
| T5 | vscode：anthropic 分支 body | `max_tokens:100`，无 thinking 字段 | 范围边界 |
| T6 | vscode：google 分支 body | `maxOutputTokens:100` | 范围边界 |
| T7 | 回归：标题 ≤40 字符截断、无引号 | 不变 | 范围边界 | --- ## 8. 会话恢复 provider/model 缺失 → 模型重选（2026-09-02，用户问题 Q1） > **状态：已实现（2026-09-02）**。用户问题批 Q1（docs/TODO.md）：CLI 退出重进时，会话引用的 provider 或 model 已不存在 → 直接报错退出进不了 TUI；期望给用户界面重新选择模型。验收标准逐条核对通过（T1-T7 + T1b/T6b，`test/session.test.mjs` + `test/tui.test.mjs`）。 ### 8.1 问题与根因 **症状**：会话保存时用了 provider A（如某个自定义 provider 或已删模型），重进时 config 里已无 A → CLI 报错退出。 **根因链**（代码已核；2026-09-02 实现时修正第 1 环——`findProvider` 实际是 **throw** 而非返回空对象）： 1. `loadConfig`（config.mjs 的 `runtimeProvider` 构造处——`findProvider(providers, activeProvider)`）：`activeProvider` 在 `providers[]` 不存在且名字非空 → **throw**（`activeProvider "ghost" not in providers list`）→ loadConfig 整体抛错 → `assembleAgent` 抛错 → bin 的 uncaughtException → 报错退出。**已修：loadConfig 对缺失 activeProvider 不再抛错**——runtimeProvider 置空对象 `{}`（不抛错但无 model/baseURL/apiKey），providers 列表与 activeProvider 原值保留；findProvider 的 throw 契约保留（advisor/run.mjs 等直接调用方仍依赖，integration-provider 测试断言不变）。
2. `assembleAgent`（make-agent.mjs 的 `provider.proxyUri` 注入处）：`provider = config.provider`（空对象）→ 后续 `provider.proxyUri` 赋值 OK（空对象可加属性）。
3. **崩溃点**：空 provider 流入 `runAgent` → `chat()` → `provider.model` undefined → body 缺 model → **网关 400**；或 `provider.baseURL` undefined → `fetch("undefined/chat/completions")` → **TypeError "Failed to parse URL"** → uncaughtException → 进程退出。TUI 首帧若解引用 `agent.provider.name` 同崩。
4. `applySession`（session.mjs 的 `if (p)` 回切分支）对不存在 provider **静默跳过**（`if (p)` 不成立 → return false）——**不报错也不纠正**，空 provider 继续流。 ### 8.2 需求 - F1：会话恢复后若**当前 provider 无效**（会话与 config 的 activeProvider 均不存在，或 model 缺失）→ **不退出**，进入 TUI 后引导用户重新选择模型（复用既有 `/model` picker 机制）。**会话 provider 缺失但 config 有有效 provider → 静默用 config 的 provider（不弹重选——D-S3 优先级）**。
- F2：config 的 `activeProvider` 本身无效（无会话恢复场景，纯配置错误）→ 同样不退出，TUI 启动即弹选择。
- F3：无任何可用 provider → 明确提示（进入配置向导或提示 `/provider add`），不崩溃。
- F4：headless（`thincoder chat`）无 TUI → 报可读错误 + 退出码（不弹 UI）；`--auto` 场景同。 ### 8.3 设计 **D-S1 启动前校验（bin/thincoder.mjs + make-agent.mjs + config.mjs）**： - `loadConfig`（config.mjs）：activeProvider 缺失不再抛错（见 8.1 修正）——runtimeProvider 空对象，providers 列表保留。
- `assembleAgent` 后、`applySession` 前：校验 `agent.provider?.model` 与 `agent.provider?.baseURL` 存在；缺失 → 打标记 `agent._providerInvalid = true`（附原因 `_providerInvalidReason`：provider 不存在 / model 缺失 / 缺少 baseURL）——实现为 make-agent.mjs 导出的 `validateProvider(agent)`（幂等：有效时清标记），assembleAgent 末尾调用。
- **model 无效判据（评审 #1 修正）**：仅当 `provider.model` **为空/缺失**时判 invalid——**不得用 MODEL_SPECS 成员资格判无效**（未知模型 = 受支持场景，PROVIDER.md:84 "未知模型保守 128K + 警告"；自定义端点模型不在 MODEL_SPECS 是常态，误判会让自定义模型用户每次恢复都弹重选，违反 AC4 零回归）。
- 不抛错、不退出；空 provider 不再流入 runAgent——**TUI 路径在 startTUI 前清空无效 provider**（`agent.provider = null`），由 TUI 启动逻辑触发模型选择。
- **model 退役场景（评审 #2 修正）**：provider 存在但 `provider.model` 空（如 config 里 model 字段被删）→ 判 invalid 引导重选（默认选中该 provider 默认模型）。**MODEL_SPECS 未知不视为退役**——退役只能从"model 字段缺失"或"provider 自身消失"判断，客户端无法可靠区分"模型从 spec 表退役"与"自定义模型"（spec 表不是 allowlist）。
- **D-S3 补全（bin 复验）**：applySession 后若标记仍置位则复验一次 `validateProvider`——applySession 可能已用会话中的有效 provider 修复（config 无效 + 会话有效），修复后清除标记，仅当两者都无效才弹重选。 **D-S2 TUI 重选流程**（src/tui/index.mjs 启动 + pickers.mjs 复用）： - `startTUI` 首帧前检查 `agent._providerInvalid`（或 `!agent.provider`）→ **先弹模型选择 picker**（复用 `openModelPicker`/`selectModel`，展示当前可用 providers）→ 用户选定后继续正常启动（`agent.provider` 已更新为有效值）。实现为 index.mjs 导出的 `promptProviderIfInvalid(agent, openModelPicker, pushLine)`。
- 选择取消（Esc）→ 仍进入 TUI（显示提示行"未配置有效 provider，可用 /model 选择或 /provider 配置"）——**绝不因无 provider 拒绝进入**。提示行后 showStartup 的既有 no-key 触发条件（`!agent.provider?.apiKey`，已加 `?.` 守卫）会让 wizard 弹出——其 provider 菜单列出已存在 providers（可选中恢复）与 presets，符合 F3"进入配置向导或提示"；空 provider 下渲染路径（renderHeader/renderStatus 的 `agent.provider?.model`）已加可选链守卫，屏幕不再冻结。
- `/model` 在无有效 provider 时行为不变（picker 列出可用项）。 **D-S3 会话恢复与 provider 缺失的优先级**： - 若会话的 `activeProvider` 无效但 config 的 `activeProvider` 有效 → **用 config 的有效 provider**（会话切换失败 = 静默保持现状，已有行为）——仅当**两者都无效**才弹重选。
- 会话的 `activeModel` 无效（provider 存在但模型退役）→ 弹重选（默认选中该 provider 的默认模型——`selectModel` 现成行为）。 **D-S4 headless**（F4）：`thincoder chat` 路径（bin/thincoder.mjs 的 chat 命令分支）遇无效 provider → `console.error` 可读消息（"会话引用的 provider 'X' 不存在，请运行 thincoder 进入 TUI 重新选择，或编辑 config.json"）+ `exitSoon(1)`——不弹 UI、不崩溃（明确退出码）。 ### 8.4 测试 **受影响文件**（实现后勾销）：`src/config.mjs`（loadConfig 对缺失 activeProvider 不抛错）、`bin/thincoder.mjs`（tui/chat 两路径的启动校验接入 + applySession 后复验）、`src/cli/make-agent.mjs`（assembleAgent 后校验点 `validateProvider` + `_providerInvalid` 标记）、`src/session.mjs`（applySession 不变——校验在调用侧）、`src/tui/index.mjs`（startTUI 首帧检查 + 弹选择，`promptProviderIfInvalid`；设计稿的 `src/tui.mjs` 是 re-export hub，实现落在 index.mjs）、`src/tui/startup.mjs` + `src/tui/render-frame.mjs`（空 provider 渲染守卫——T7 必需）、`src/tui/pickers.mjs`（复用 openModelPicker/selectModel——无导出改动，仅调用）、`test/session.test.mjs`（**新增**，T1-T7 + T1b/T6b 恢复场景）、`test/tui.test.mjs`（T2 启动弹选择 + T7 取消）、`docs/design/SESSION.md`（本节）、`CHANGELOG.md`（父代理统一更新）。 | # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T1 | 会话+config 均无此 provider | mock：会话 activeProvider="ghost"；config.activeProvider="ghost"（均不存在） | 启动不退出；`agent._providerInvalid=true`；TUI 首帧弹模型选择 | F1/D-S1 |
| T1b | 会话 provider 缺失 + config 有效（D-S3 静默分支） | 会话 activeProvider="ghost"；config.activeProvider="deepseek"（有效） | 不弹重选；静默用 config 的 provider；`_providerInvalid` 不置位 | F1/D-S3 |
| T2 | config activeProvider 无效 | config activeProvider 指向不存在 provider | 启动不退出；`_providerInvalid=true`；TUI 首帧弹模型选择 | F2/D-S1 |
| T3 | 无可用 provider | providers 为空 | 明确提示（向导/提示行），不崩溃 | F3/D-S2 |
| T4 | headless | `thincoder chat "x"` + 无效 provider | 可读错误 + 退出码 1，无 UI | F4/D-S4 |
| T5 | 会话 provider 有效 | 正常恢复 | 行为不变（回归） | D-S3 |
| T6 | activeModel 缺失（model 字段被删） | provider 存在但会话 model 为空 | 弹重选，默认该 provider 默认模型 | F2/D-S1 |
| T6b | 自定义模型（MODEL_SPECS 未知） | provider.model="my-custom-model"（不在 MODEL_SPECS） | **不判 invalid**；正常恢复不弹重选（评审 #1 回归） | F2/D-S1 |
| T7 | 选择取消 | 弹 picker 后 Esc | 仍进 TUI + 提示行，不退出 | D-S2 | **验收**：AC1 = 任意无效 provider/model 场景 CLI 不再崩溃退出（T1-T4）；AC2 = TUI 内可完成模型重选（T1/T2/T6）；AC3 = headless 明确报错+退出码（T4）；AC4 = 正常恢复零回归（T5）+ CLI 全量 + lint 绿。 ### 8.5 关键决策 - **清空而非修补空 provider**：空对象 `{}` 流入下游是崩溃源——检测后置 `null`，让 TUI 选择流程从干净状态开始（避免"半有效 provider"的隐晦错误）。
- **校验点收敛到 assembleAgent 之后**：一处检测覆盖 TUI/chat 两路径（F1-F4 同源）；不散落多处判断。
- **loadConfig 不抛错而非容忍 throw**（2026-09-02 实现修正）：findProvider 的 throw 击穿 loadConfig → assembleAgent，TUI/chat 都进不来——校验点无从执行；改在 loadConfig 调用侧捕获（runtimeProvider 空对象），findProvider 的 throw 契约保留给直接调用方（advisor）。
- **复验而非二次校验点**：applySession 可能用会话中的有效 provider 修复 config 的错误（config 无效 + 会话有效）——bin 在 applySession 后复验同一 `validateProvider`（幂等清标记），维持"仅两者都无效才弹重选"（D-S3）而不散落新判据。
- **Esc 后渲染守卫**：provider=null 时 renderHeader/renderStatus/showStartup 的解引用必须可选链（否则 T7"仍进 TUI"在首帧即崩/冻结）；showStartup 的 no-key 触发会带出 wizard（其菜单列出已存在 providers，可选中恢复——符合 F3，非拒绝进入）。
- **否决**：a) 启动即退出并打印"请编辑 config"（用户已明确要 UI 重选——体验差）；b) 静默回退到第一个可用 provider（用户可能 unaware 换错模型——必须显式选择）；c) 自动用 config.activeProvider 覆盖会话 provider（用户上次明确选的模型不能静默丢）。 ## 9. 消息时间戳 + read_history 会话查询工具（2026-09-03 · 用户补救拍板——需求层 + 设计层） > 状态：设计批准（2026-09-03 round1 通过——0🔴——9 refinement 处置注见 §9.5——designToken 已签发）。触发：用户补救拍板——"① 会话消息加上时间戳；② 工具里加一个查会话历史的工具，应该能够查找筛选过滤"（教训源：advisor 并行取证困境——会话消息无 ts——历史无法回溯工具执行时序——只能靠 UI 观察）。用户裁定：read_history 带时间窗（since/until——配合 ts 新能力——取证完整）。 ### 9.1 需求 - F-S1：**消息级时间戳**——每条消息落对象时打 `ts`（epoch ms——UTC）——历史可回溯执行时序（工具何时调用/结果何时落）
- F-S2：**read_history 工具**（模型工具面——readonly）——查本会话历史——筛选过滤：role/keyword/tool/**since/until（时间窗）**/limit/direction
- F-S3：旧消息（无 ts）容忍——读取/恢复/渲染零变化——时间窗只匹配有 ts 消息（无 ts 显示无时间戳标记）
- F-S4：两端一致（消息格式契约两端共享——read_history 工具两端注册） ### 9.2 设计 **D-S1 消息 ts——pushReal 单点**：`context.mjs pushReal(agent, msg)`（L171——唯一消息入口——_fullHistory + history 同 push）内统一：`if (msg.ts === undefined) msg.ts = Date.now()`——所有调用点（agent.mjs 的 user/assistant/tool 消息/record-results）自动带 ts——**一处改全生效**。
- 压缩重建注入消息（applyCompression L187-189 手写 note/Understood 对象——不经 pushReal）——同规则补 ts（Date.now()——压缩时刻）
- 恢复路径（startup 从存档读入 history）——旧消息无 ts——**不补**（补近似值误导取证——D-S3 容忍）
- 渲染/上下文零变化（ts 是附加字段——**发送层消息字段白名单——ts 不进 provider 请求**——实现时自查 core.mjs 消息发送形态——防多余字段污染请求） **D-S2 read_history 工具**（新 `src/agent-tools/read-history.mjs`）：
- 描述：查本会话消息历史（_fullHistory——压缩不丢——审计完整）——回忆之前说过/做过的事（决策/工具时序/过去裁定）——筛选：role/keyword（content 子串）/tool（工具消息 name）/since/until（epoch ms——配合消息 ts）/limit（默认 50——上限 200）/direction（oldest/newest——默认 newest）——返回匹配消息含 ts——内容逐条截断（~500 字符 + truncated 标记——全文看会话文件）
- 数据源：`agent._fullHistory`（全量）——readonly: true（planMode 放行/免审批/explore 只读集自动）
- 返回：JSON 数组——{ts, role, name?, tool_call_id?, content 截断, tool_calls 概要（assistant——工具名列表不展开 arguments）}
- 注册：agent-tools.mjs 聚合 + setup.mjs——**depth-0 only**（子代理各自上下文——查父历史语义混淆——保守——评审定）
- VS Code 镜像（两端同批——agent 结构同） **D-S3 兼容**：旧存档/旧消息无 ts——读取容忍（session-io 不动）——saveSession 序列化原样（有 ts 的带出）——恢复后 ts 保留——read_history 无 ts 消息：不匹配时间窗 + 返回 ts: null 标记 ### 9.3 测试（用例表） | # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T-S1 | pushReal 带 ts | 跑回合（mock） | 每条消息 ts = 落对象时刻（数值——递增） | F-S1 |
| T-S2 | 旧消息兼容 | 手工构造无 ts 消息入 history | 读写/发送/渲染不崩 | F-S3 |
| T-S3 | 发送剥离 | mock chat 捕获请求体 | 请求消息无 ts 字段（不污染 provider） | D-S1 |
| T-S4 | read_history 全量 | 无筛选 | 返回最新 50 条（默认）——含 ts/role/name | F-S2 |
| T-S5 | role/keyword/tool 筛选 | role=assistant + keyword=X + tool=read | 交集匹配 | F-S2 |
| T-S6 | 时间窗 | since/until 圈定一段 | 只返回窗内 ts 消息——无 ts 被排除 | F-S2 |
| T-S7 | limit/direction | limit=5 + oldest | 最旧 5 条 | F-S2 |
| T-S8 | 截断 | tool 结果 10K | 500 字符 + truncated 标记 | D-S2 |
| T-S9 | readonly 特性 | planMode 下调 | 放行（readonly 机制自动） | D-S2 |
| T-S10 | 压缩后全量 | 触发压缩后查 | _fullHistory 含压缩前消息（审计完整） | D-S2 |
| T-S11 | depth 门 | 子代理内调 | 拒绝/不可用 | D-S2 | **验收**：AC-S1 = 全消息带 ts（T-S1——含压缩注入）；AC-S2 = read_history 筛选面全生效（T-S4..S8）；AC-S3 = 兼容与零污染（T-S2/S3）；AC-S4 = 两端（VS Code 镜像测试） ### 9.4 受影响文件 | 端 | 文件 |
|---|---|
| CLI | `src/context.mjs`（pushReal 加 ts + applyCompression 注入补 ts）、新 `src/agent-tools/read-history.mjs`、`src/agent-tools.mjs`（聚合）、`src/agent/setup.mjs`（depth-0 注册）、发送层自查（core.mjs 消息字段剥离——若需）、新 `test/read-history.test.mjs` + context 相关测试、SESSION.md 本节 |
| VS Code | 同构镜像（pushReal 对应 + read-history 工具 + 测试） |
| 文档 | SESSION.md（本节权威——v2 双线结构 §3 消息格式同步补 ts 字段）、两端 AGENTS 模块表 | **今日场景价值**：ts 落盘后——4 advisor 时序取证 = `read_history tool=advisor since=<评审开始>`——各 tool 消息 ts 一目了然——串行/并行硬数据（不再靠 UI 观察或猜测）。 ### 9.5 round1 评审处置（2026-09-03——0🔴 通过——9 项） 1. **depth 门裁决 (b)**：保持 depth-0 only——"今日场景价值"改写 = **主代理取证**（主代理 read_history tool=advisor since=… 拿时序——附 advisor 评审上下文——advisor 不自查父史——D-S2 语义自洽）
2. **行号 → 符号锚**：D-S1 改 pushReal(agent, msg)（context.mjs）+ applyCompression 注入点——去 L171/L187-189
3. **跨文档同步（实现时确认）**：ARCHITECTURE.md §双结构消息形态 + TOOLS.md 工具目录——ts 字段/read_history 条目同批落——单源纪律
4. **AC-S5 补**：治理面 = readonly 放行（T-S9）+ depth 门（T-S11）+ 压缩后 _fullHistory 全量可查（T-S10）
5. **since/until 语义**：inclusive-inclusive（ts == since/until 边界含）——since > until → 空结果——limit > 200 钳制 200——T-S6 补边界用例
6. **T-S1 非递减**：同 ms 相等 ts 合法（Date.now() 分辨率）——排序按数组序（ts 仅过滤不重排）
7. **措辞收窄**：AC-S1 = 双线真实消息（pushReal）+ 压缩注入带 ts——机读（[System reminder:）/瞬态消息无 ts 属设计（D-S3 容忍）
8. **multimodal content 数组**：keyword 匹配文本 part（数组串化摘要）——截断按文本——补 multimodal 用例
9. **UI 显示**：ts 仅 read_history 输出/会话 JSON 可见——TUI/VS Code 显示不在本 scope——后续立项（用户确认中） > **R19 登记注（2026-09-06——需求池 R19——跨会话历史检索——§13 设计已落——本注为需求阶段考古）**：用户确认 read_history 仅本会话后裁定"跨会话也希望有"。需求 = 模型工具面 readonly 检索**任意会话**历史（按 cwd/slot——role/keyword/tool/时间窗/limit/direction——read_history 参数面同型扩展——本会话 = 默认域）。关联：session-state 诊断 TODO（2026-09-06——AUTO 排查手工扫 7383 slot 文件——同族动机：会话状态/历史无机器可读视图）。**裁定（🅰）已落 §13.2：read_history 加 path 参数（本会话 = 默认）——消歧总纲并入**。状态：已设计待评审。 ## 10. 端分离恢复——本端 marker 记录最后使用槽位（2026-09-05 · 需求层 + 设计层 · 需求池 R4） > 状态：**已评审（2026-09-05 round1——0🔴 通过）——用户裁决 A（5 项建议全部采纳修订）——已批准——**已实现（2026-09-05 双端同批——CLI+VS L2 全绿——核销见 §10.6）**。来源：用户实测报告（双端同开场景）：CLI 与 VS Code 面板同时打开同一项目时，共享 manifest 的 `active` 指针两端互写；退出 CLI 重开，恢复进"另一个不是退出前"的会话（空白新槽，或对方端遗留的空面板会话）——恢复决策只读共享 active + 属主生死，**没有"本端最后用的槽"记忆**，另一端最后一次翻指针即决定本端重启落点。用户裁定：①**A 完全各记各的**（CLI 重启回 CLI 自己最后的会话；面板回面板自己的——取消跨端自动接续，`/session` 手动切换保留）；②**A 迁移一次性继承**（无本端记录时继承共享 active 的死主槽一次——否则升级后第一次打开就恢复不了现有会话——记录写下后永久分离）。 ### 10.1 需求 **总体需求**：同一项目下 CLI 与 VS Code 并存时，任一端退出重进都回到**本端**上次的会话；两端对"当前会话"的记录不再互相覆盖、互不干扰。 **功能性需求**：
- F1：CLI TUI 重启（同项目 VS Code 面板同时开着/刚开过）→ 恢复 CLI 自己退出前的会话；不因另一端翻动共享指针而进入空白新槽或对方会话。恢复依据 = CLI 本端持久记录。
- F2：迁移一次性继承——本端从无记录（升级 / 该项目首用）时：共享 active 指向的槽若属主已死/无属主且文件存在 → 认领继承**一次**并写下本端记录；属主为活进程 → 绝不继承（全新槽起步）。此后本端记录恒在，不再读共享指针。
- F3：VS Code 面板同构（F1/F2 镜像）：面板重启回面板自己最后的会话（CLI 开着也不抢）。
- F4：用户显式选择跟随本端记录：`/new`、`/session N`、面板"打开历史会话" → 更新本端记录；删除本端记录指向的槽 → 记录**显式置空**，下次启动全新起步（不继承他人遗留、不复活被删会话）。 **范围边界**：
- ACP 会话（session/load|resume|new|delete——显式钉槽 + 同进程守卫）：行为不变、**不读本端记录**（恢复决策不经 marker；经共享 newSession/deleteSlot 调用点的 marker 写属预期副作用——D-8"端内最后认领者"语义——无行为回归）；其 manifest active 写入对新型恢复逻辑无影响（继承仅在"本端无记录"窗口读一次 active，且活属主一律拒绝）。
- 混合版本：旧版另一端仍按共享指针认领（无 marker 概念）——新版端行为局部退化（10.2 D-7 矩阵），**数据安全不变**；完整效果需两端同步升级。
- 手动跨端接续保留：`/session` 与面板会话列表列出全部槽位，任一端可手动打开另一端留下的会话（活槽占用提示不变）。
- 数据零丢失：本变更只改"恢复目标选择"；槽文件内容与 F2 sessionStart 轮转、.bak/.corrupted/.unreadable 防护全部不变。 **非功能性需求**：
- NF1 不新增跨端共享可变字段——本端记录是本端**单写者**文件（manifest 条目级合并只认识已知字段、旧版整对象写会丢未知字段——记录进 manifest = 重开跨端丢失更新窗口）。
- NF2 记录写入原子（.tmp+rename）且失败容忍：写失败 → 本次启动按无记录路径降级，不影响会话数据。
- NF3 启动成本不增：恢复决策的存活探测次数与现状 ensureActive 同量级。
- NF4 跨端并发语义不回归：活槽绝不双写（认领/继承先过属主生死；F1 槽粘性不变）。 ### 10.2 设计 **D-1 记录形态（end marker 独立文件）**：
- 路径：`{manifest}.cli`（CLI）/ `{manifest}.vscode`（VS Code），即 `~/.thincoder/sessions/{hash}.json.manifest.cli|.vscode`——manifest 旁的独立小文件，**非 manifest 内嵌字段**（NF1）。
- 内容：`{"slot": <number|null>, "updatedAt": <epoch ms>}`。**文件缺失 = 从未记录**（迁移窗口）；**`slot: null` = 显式置空**（删过本端槽）——两者必须区分（D-2）。**读侧降级**：文件缺失或 JSON 解析失败（损坏）一律按"缺失"处理——不 rename 不 unlink（幂等、不误伤），可能触发一次继承（数据安全——T-M13）；`slot: null`（显式置空）除外——绝不继承。
- 写者：仅本端（CLI 只写 .cli，VS Code 只写 .vscode）——零跨端写竞争；旧版端不认识、永不触碰该文件（版本安全）。
- 端常量：CLI 仓 `END = "cli"`；VS Code 仓 `END = "vscode"`。 **D-2 恢复决策**（新导出 `resumeSlot(cwd) → {slot, data}`；CLI session-slots.mjs + VS Code 同构镜像）： ```
m = loadManifest(cwd)
1. 本端记录可用？slot ≠ null 且 slot ∈ m.slots 且槽文件在盘 且属主 空/死/本进程 → 认领（claimSlot：slotSessions[slot]=本进程 + saveManifest setActive）→ loadSlotFile 读槽
2. 本端记录缺失（文件不存在——从未记录 = 迁移窗口）→ 一次性继承： m.active 在且 ∈ m.slots 且文件在盘 且属主 空/死 → claimSlot(active) + 写记录 = active → 读槽
3. 其余一切（slot:null / 槽已被删 / 属主为活外人 / 继承失败）→ 全新分配 （allocateFresh——ensureActive 分支 2/3 语义抽取：先回收"文件缺失+空闲"的 manifest 槽号， 否则 max+1 起跳过活认领号/现存文件号）→ 写记录 = 新槽 → data = null
每次落点都写本端记录；**claim 后读槽失败（解析失败/.unreadable——既有改名保全语义）→ 保持已 claim 槽 + data:null——不回滚认领、不改 marker——下次保存原地重建该槽，旧现场以 .corrupted/.unreadable 保留（T-M15）**；legacy 单文件兜底与现状 loadSession 平移（仅 data 层——不改变 claim 落点）
``` - 实现形态：session-slots.mjs 抽取 `claimSlot`（现 ensureActive 分支 1 主体）与 `allocateFresh`（现分支 2/3 主体）；`ensureActive`/`activeSlot` **保留**给无记录进程路径（ACP、cmd-eng/cmd-advisor 内嵌调用——分支 1"active 空闲即取"行为不变，ACP 语义零变化）；`resumeSlot` 供 TUI 启动与面板 resolve 使用。
- **missing → 继承、null → 全新**的区分理由：删槽后置 null（文件保留）使"删过"可辨认——用户删除自己会话后重开 = 全新起步，不继承对方遗留、不复活被删会话（T-M4/T-M5）。 **D-3 启动钉 _slot（闭合首保存迁移窗口）**：bin/thincoder.mjs TUI 启动改 `const { slot, data } = resumeSlot(process.cwd())` → `applySession` 之后 `agent._slot = slot`。理由：现实现 loadSession 认领后 applySession 清 `_slot`，若 VS Code 面板在首回合前翻 active，**首次保存**会经 ensureActive 分支 3 静默迁移到新槽（F1 只治了重复保存，首保存窗口仍在）——恢复确定性要求首保存必落恢复槽。`/new` 后 resetSessionState 清 `_slot` 语义保留（newSession 已认领 + 写记录）；headless `thincoder chat` 不恢复（现状不变）。 **D-4 marker 维护点**（每次落点原子写，失败容忍 NF2）：
- CLI：`resumeSlot`（D-2 每步）；`saveSession` 首认领（`agent._slot` 为 null 时的 `??= activeSlot` 之后——覆盖"/session 切换后首保存"与"查看对方活槽 → 保存 fork 新槽"的落盘槽跟随）；`newSession` 成功后；`switchToSlot` 成功后（跟随"最后查看的槽"）；`deleteSlot` 删到本端记录槽 → `writeEndMarker(cwd, null)`（文件保留、slot 置空——不 unlink）。
- VS Code：ensureSlot/status 恢复决策（D-2 镜像）；newSlot 后；面板"打开历史会话"后；deleteSlotAndUpdate 删到本端记录槽 → 置 null。
- 非维护点：日常保存（F1 粘性 `_slot` 已定，不写 marker——保存永不参与竞争）。 **D-5 listSlots 高亮按端**：`listSlots(cwd)` 保持 manifest active 语义（ACP session/list 零变化）；TUI `/session` 与面板会话列表的本端高亮改以本端记录槽为准（isActive = 记录槽 ∈ 列表 ? 记录槽 : m.active——含"记录槽已被对端删除"的守卫（T-M5 同款）——调用侧最小侵入）。manifest active 保留为跨端回退高亮。 **D-6 manifest.active 定位修订**：认领/新建/切换/删除的 setActive 纪律**原样保留**（旧版端互操作 + ACP + 继承读取 + 列表回退）；仅新型恢复决策不再以它为第一依据。§1"active 槽位就是当前会话"修订为：active = 共享当前指针——旧版端/ACP 的恢复依据 + 无记录端的一次性继承源；本端恢复依据 = 本节 end marker。§6 契约对齐表补 marker 行（路径/内容/写者/置空语义双端一致）。 **D-7 混合版本矩阵**： | 组合 | 行为 |
|---|---|
| 新版 CLI + 新版 VS Code | 完整分离（目标态） |
| 新版 CLI + 旧版 VS Code | 旧版仍翻 active/抢死槽；CLI 重启时若 marker 槽被旧版活占 → 全新起步（退化为现状形态，数据安全）；旧版退出后可取回。建议同步升级 |
| 旧版 CLI + 新版 VS Code | 对称 |
| 旧版 + 旧版 | 现状 | > **升级过渡首日**：双端同批升级后均无 marker——仅先启动端能继承共享 active 死槽（另一端遇活属主拒 → 全新槽），且先启动端可能继承的是**对端**旧槽并永久写入本端 marker——数据不丢（列表 /session 可手动找回）——用户裁定 ②A 一次性继承的固有代价，过渡后不再发生。 **D-8 已知限制**：同端多活进程（两个 CLI 终端 / VS Code 多窗口同项目）时 marker 为"端内最后认领者"语义——活进程各自粘性写自己槽（F1），后启动者覆盖 marker；交错重启时先者的会话需 `/session` 手动找回（与现状同量级，且不再跨端互扰）。ACP 不经 marker（显式钉槽不变）。 **被否方案**：① manifest 内嵌 `cliLast/vscodeLast` 字段——双端写同一文件（正是本 bug 类）+ 合并/旧版写会丢未知字段；② 恢复目标 = updatedAt 最新槽——列表字段、跨端每次保存互触、语义不符；③ 取消一次性继承（无迁移通道）——升级后第一次打开即触发本 bug，违反用户裁定 ②A；④ 只修 CLI 不修 VS Code——面板 resolve 仍翻 active/抢死槽，CLI marker 槽被"活外人"占用后回到 bug（F3 必须双端同批）。 ### 10.3 测试（用例表） | # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T-M1 | 双端同开 CLI 重进 | slot1=CLI 死主 + slot2=活外人（active=2）+ CLI marker=1 | resumeSlot → 认领 slot1 恢复（不进 slot2/新槽） | F1 |
| T-M2 | 迁移继承一次 | 无 marker + active=死主槽 | 继承认领 + marker=active；再次 resumeSlot（模拟重启）仍回该槽 | F2 |
| T-M3 | 继承拒绝活槽 | 无 marker + active=活外属主 | 全新槽 + marker=新；绝不写活槽 | F2/NF4 |
| T-M4 | 删过本端槽 | marker 文件在、slot:null + active=死主槽 | 全新槽（不继承） | F4 |
| T-M5 | 记录指向的槽被删 | marker=2 但槽 2 无文件 | 全新槽（不复活） | 边界 |
| T-M6 | 全新目录首用 | 无 manifest | 槽 1 起步 + marker=1；第二端无 marker → active=1 活属主拒 → 新槽 | F3 |
| T-M7 | 首保存钉槽回归 | resume 后模拟并发方翻 active | 首保存仍在恢复槽（不迁移新槽） | D-3 |
| T-M8 | 显式切换跟随 | /new、/session N、删 marker 槽 | marker 分别 = 新槽 / N / null（文件在） | F4 |
| T-M9 | VS Code 镜像 | 面板 resolve（CLI 活于他槽）/ newSlot / pick / delete | 恢复面板槽；marker 维护逐点一致 | F3 |
| T-M10 | legacy 兜底回归 | 无槽 + v1 单文件 | 恢复不变 | 回归 |
| T-M11 | 既有套件零回归 | loadSession 兼容包装 | session 相关测试全绿 | AC5 |
| T-M12 | parity 镜像断言 | CLI↔VS Code 新导出 | cross-repo-parity / session-io-parity 绿 | AC5 |
| T-M13 | marker 损坏 | marker JSON 解析失败（存在 active 死主槽） | 按缺失降级不崩（可走继承/全新路径）；损坏文件不 rename/unlink；数据不受影响 | NF2/边界 |
| T-M14 | marker 写失败 | 模拟 .tmp+rename 失败 | 按无记录路径降级启动；会话数据不受影响 | NF2 |
| T-M15 | claim 后读槽失败 | marker 槽文件损坏（.corrupted 改名） | 保持已 claim 槽 + data:null；下次保存原地重建；.corrupted 保现场 | D-2 | **验收**：AC1 = T-M1/T-M2/T-M3/T-M6（恢复目标端分离 + 迁移继承）；AC2 = 面板镜像（T-M9）；AC3 = 删除/置空语义（T-M4/T-M5）；AC4 = marker 跟随 + 首保存钉槽（T-M7/T-M8）；AC5 = 双端既有 L2 全绿 + parity 绿 + lint（T-M10/T-M11/T-M12 回归 + 新增降级用例 T-M13/T-M14/T-M15）；AC6 = 无数据丢失回归（sessionStart 轮转等既有防护测试零回归）。 ### 10.4 受影响文件 | 端 | 文件 |
|---|---|
| CLI | `src/session-slots.mjs`（marker primitives + `resumeSlot` + `claimSlot`/`allocateFresh` 抽取 + `deleteSlot` marker 维护 + END="cli"）、`src/session.mjs`（`loadSession` 平移为 resumeSlot 数据包装（签名不变——测试兼容）；`saveSession` 首认领写 marker；`newSession`/`switchToSlot` 写 marker；re-export 新增导出）、`bin/thincoder.mjs`（resumeSlot + applySession 后钉 `_slot`）、`src/tui/cmd-session.mjs`（列表高亮按本端记录）——cmd-eng/cmd-advisor/ACP 零改动；新增 `test/session-endmarker.test.mjs`（T-M 表主场景）+ `test/cross-repo-parity.test.mjs`（镜像断言更新） |
| VS Code | `src/extension/session-slots.mjs`（同构镜像——END="vscode"）、`src/extension/panel-session.mjs`（ensureSlot/status 恢复决策 + 列表高亮 + delete 置空）、`src/extension/session-io.mjs`（newSlot/pick 写 marker）、`src/extension/panel-project.mjs`（认领点改 resumeSlot）——`test/chat-panel.test.mjs` + `test/session-io-parity.test.mjs` 补 T-M9 类用例 |
| 文档 | SESSION.md 本节（权威）+ §1 active 定义修订 + §6 契约表补 marker 行；VS Code `docs/design/ARCHITECTURE.md` 变更段（引用不复制）；两端 AGENTS.md 模块表（session-slots 描述）；CHANGELOG.md（交付时父侧统一） | ### 10.5 评审处置（2026-09-05 · round1——0🔴 通过——） advisor 判定 0🔴 通过并签发 token；5 项 🟡/🔵 澄清建议按用户裁决 A **全部采纳修订**（本节已落）：① ACP 边界句——不读 marker、共享调用点写入属预期副作用；② marker 读侧损坏 = 按缺失降级（T-M13）+ 写失败降级用例（T-M14）；③ claim 后读槽失败目标态（T-M15）；④ D-5 高亮加记录槽 ∈ 列表守卫；⑤ D-7 补升级过渡首日说明。机制未变——修订不触发重评。 ### 10.6 实现核销（2026-09-05 · eng-coder id:2 clean——修正轮 2/5——分歧审计 1 轮 CLEAN——advisor code review 2 轮 0🔴） **验收勾销**：AC1 ✔（T-M1/T-M2/T-M3/T-M6——CLI test/session-endmarker.test.mjs + VS 镜像用例）、AC2 ✔（T-M9——session-io-parity end-marker describe + chat-panel flows，含面板 delete 重绑幸存槽写 marker：review 🟡#1 修复）、AC3 ✔（T-M4/T-M5）、AC4 ✔（T-M7/T-M8）、AC5 ✔（双端 L2：CLI 1485 tests/1437 pass/48 slow-skip/0 fail + lint 264 文件 OK；VS Code 1196/1196/0 fail + lint 219 文件 OK；parity 双绿——父侧独立 L2 复跑同数）、AC6 ✔（sessionStart 轮转/.bak/.corrupted/.unreadable 既有防护测试零回归）。 **实现偏差记录（出清单改动——交付报告逐项申报、父侧核销接受）**：
1. 5 个既有测试文件（session.test/session-safety/session-compaction/session-eng-advisor/slash-commands）的 teardown 清理后缀表补 `.manifest.cli`（个别补 `.manifest.cli.tmp`/槽位损坏名）——saveSession/newSession 现在会写 marker，不补则每次测试运行在真实 ~/.thincoder/sessions 留下永久垃圾；改动止于清理行、零断言改动。教训：受影响文件表应含"会写新文件的既有测试清理面"。
2. resumeSlot 的 data 层读经 session-slots ↔ session.mjs（VS：session-slots ↔ session-io）单点静态环 import——500 行硬限约束下 loadSlotFile/loadSlot 不迁移；函数声明期环安全（仅函数体内运行时使用），代码头注释 + ARCHITECTURE.md 变更段声明。
3. CLI session-slots.mjs 恰 500 行零余量（review 🔵 接受为已知债——D-1 区后续扩写需拆文件）。
4. 清理补丁前的两轮测试运行在真实 ~/.thincoder/sessions 残留少量孤儿 `{tmp-cwd}.json.manifest.cli`（几十字节/个、tmp 目录已删、无害）——日后随手清理即可，无需专项。 **遗留**：CHANGELOG 双端已记（父侧）；git 提交未做（父侧——待用户确认分批）。 ## 11. agent 运行环境自我感知（2026-09-06 · 需求落档 · 需求池 R5/R8/R9/R11 家族） > 状态：**待设计**（池 R5/R8/R9/R11——2026-09-06 登记，设计启动权在用户，阈值触发提醒）。
> 家族构成：R5（进程重启感知）+ R8（运行身份感知）+ R9（工程模式自感知）+ R11（模型自感知）——同一主题"agent 对自己运行环境的自我认知"，合并设计。 ### 已注入基线（2026-09-06 盘点——agent 已感知的，家族设计不得重复） | 感知项 | CLI | VS Code | 机制 |
|---|---|---|---|
| OS/工作目录/会话开始 | ✅ | ✅ | history push / systemPrompt |
| 当前时间 | ✅ | ✅ | time reminder（回合注入，避 prefix 缓存） |
| AUTO/权限模式 | ✅ | ✅ | AUTO_REMINDER |
| 工程模式 ON/OFF | ✅ | ✅ | ENG_ON/OFF_REMINDER |
| plan mode | ✅ | ✅ | `agent._planMode` 注入 |
| git context | ✅ | ❌ **缺** | CLI history push（VS Code 无） |
| **进程重启** | ✅ | ❌ **缺** | CLI `process restarted at...`（L116）——VS Code 无 |
| repo outline | ✅ | ✅ | OUTLINE_INJECT | **盘点结论**：CLI 的"进程重启注入"（setup.mjs L116）是 R5 的**现成参考实现**——家族设计时 VS Code 侧补同款即可（git context 同理）。VS Code 缺 git context + process restarted = **两端不一致缺口**（R5 的 VS Code 侧具体落点）。 ### R5 — agent 进程重启感知 **需求句**：agent 会话经 slot 持久化可跨进程重启恢复（改代码 → 重启 CLI/扩展 → 会话历史还在），但 agent **不知道自己刚经历了一次进程重启**——感知不到"进程是新启动的、运行时内存态已清空、自我修改已生效"。需求 = agent 能感知"本会话是恢复的 / 进程是新起的"，并在行为上体现（如恢复时核对依赖内存态的状态：design token / async 注册表 / guard 标记等）。 **来源**：2026-09-06 人机并行作业实测（用户改 VS Code 扩展代码后重启，agent 无感续跑——暴露"无重启感知"缺口）。 **VS Code 侧现状缺口（盘点核实）**：CLI 已有 `process restarted at...` 注入（setup.mjs L116），**VS Code 无**——重启感知在 CLI 已部分实现、VS Code 是空白。家族设计参考 CLI 现成实现补 VS Code 同款（连同缺失的 git context 注入一并补）。 **验收方向（待设计细化）**：本端恢复会话时注入/携带"本会话为恢复会话（进程新起）"的信号，agent 可据此核对运行时内存态（如 designToken 等进程级状态已随旧进程消失，不应假设仍在）。 ### R8 — agent 运行身份感知 **需求句**：agent **不知道自己跑在哪个环境**——CLI 还是 VS Code。现状：两端 system.md 逐字相同（"You are ThinCoder, a coding agent"），**无身份注入**。需求 = agent 知道自己运行在 CLI / VS Code（用于**行为适配**：环境特有工具集、UI 通道、扩展 API 可用性的正确推断）。 **来源**：2026-09-06 人机并行作业实测（用户发现 agent 不清楚自己身份，影响其对环境特有行为的判断）。 **验收方向（待设计细化）**：系统提示/注入携带运行身份（如 "Running in: ThinCoder VS Code extension" 或 "ThinCoder CLI"），agent 可据此推断环境差异（如 VS Code 的 vscode API、面板通道；CLI 的 TUI/bash 通道）。 ### R9 — agent 工程模式自感知 **需求句**：agent **不能随时自感知当前是否工程模式**。现状：有 `ENG_ON_REMINDER`/`ENG_OFF_REMINDER` 注入（setup-reminders.mjs），但只在**特定时机**注入（回合首轮/模式切换，resumed session re-notifies on turn 1）——agent 无法主动查询/随时确认当前模式，用户实测"要靠他告诉我"。需求 = agent 能自感知当前工程模式状态（及模式历史），不依赖用户口头告知。 **来源**：2026-09-06 人机并行作业实测（用户指出 agent 对 eng-coder 开关/工程模式状态不自知）。 **验收方向（待设计细化）**：模式状态可自查询（agent 侧只读状态获取），或在每回合可靠注入；agent 对"当前是否工程模式"的回答不依赖用户。 ### R11 — agent 模型自感知 **需求句**：agent **不知道自己当前跑在哪个模型上、模型何时被切换**。现状：`activeModel` 跨会话持久且恢复时应用（session.mjs L114/L338），但**无注入**——提示/历史不含"你当前运行在 model X"，agent 无法感知模型、更无法感知切换。需求 = agent 自知当前模型名并感知切换（用于**行为适配**：如切到弱模型时自觉降低任务复杂度/减少并行，切到强模型时可承担更复杂任务）。 **来源**：2026-09-06 人机并行作业实测（用户指出"切换模型，agent 也是不知道的"）。 **验收方向（待设计细化）**：注入/携带当前模型名（回合或切换时）；agent 对"我现在用哪个模型"的回答不依赖猜测；模型切换时 agent 自知并可调整行为。 ### §11.1 设计——每回合统一环境状态 reminder（2026-09-06 · 需求池 R5/R8/R9/R11 合并设计 · **已实现**） > 状态：**已实现**（2026-09-06，eng-coder 交付 clean——修正轮 1/5——审计 1 轮 + advisor 2 轮 0🔴——双端测试绿；实现核销见 §11.2）。 **设计骨架（用户裁定）**：每回合注入**一个统一的"环境状态" transient reminder**（与 AUTO/时间 reminder 同通道、同可变形态）——一次注入覆盖家族四项；变更在下回合自然感知（不需要"变更时专门注入"）。 **设计**： 1. **注入形态与内容**： - 每回合注入一行 `env-state` transient reminder（现状 setup-reminders 的 transient user reminder 通道——避 prefix 缓存），内容： ``` [System reminder: env: {cli|vscode}, mode: {eng|normal}, model: {model-id}, resumed: {yes|no}] ``` - 字段映射： - `env` → R8 身份（§10 D-1 END 常量先例——CLI 仓 END="cli" / VS Code 仓 END="vscode"——静态常量，不做 cmdline 判别） - `mode` → R9 工程模式（`agent.config?.agent?.engineering` 现状字段） - `model` → R11 模型（`agent.activeModel ?? provider.model`） - `resumed` → R5 重启感知（会话是 slot 恢复 = resumed: yes；CLI 已有 `process restarted` 注入 L116——VS Code 补同款） - **git 不入 env-state 行**（audit Q1 消歧——CLI 已有富 git context 注入 branch/commits/uncommitted，env-state 行不重复 clean|dirty 摘要；VS Code 补同款富注入） 2. **变更感知机制**：变更（模式切/模型切/重启）不专门注入——**每回合注入当前状态**，下回合 reminder 反映变更。R5 重启 = resumed: yes 仅在恢复后的**首个回合**注入一次（不重复——CLI 同款 `transient` 注入）。 3. **R5 VS Code 补齐**：VS Code 侧补 `process restarted at...` 注入（CLI setup.mjs L116 同款——会话恢复时注入，仅首回合）。 4. **R8 身份补齐**：两端 system.md 逐字相同——**不改 system.md**（避免两端漂移），改为 env-state reminder 的 `env` 字段携带身份（注入比改 system.md 低侵入）。 5. **R9 模式自感知**：`mode` 字段 = 每回合工程模式状态（覆盖"特定时机注入"的缺口——现状只在回合首轮注入 ENG_ON_REMINDER；env-state 每回合注入当前 mode，变更下回合感知）。 **受影响文件（家族部分）**：
| 文件 | 端 | 动作 | 内容 |
|---|---|---|---|
| `src/agent/setup-reminders.mjs` | 双端 | MODIFY | 新增 env-state transient reminder（每回合注入——含 env/mode/model/resumed/git 字段） |
| `src/agent/setup.mjs` | 双端 | MODIFY | env-state 注入接线（R5 VS Code 补 process restarted；git context VS Code 补富注入同款） |
| `src/prompts/system.md` | 双端 | MODIFY | env-state reminder 说明（字段含义 + **resumed=yes 消费指导：进程级内存态已随旧进程消失——designToken 等不假设仍在**——**不改 system.md 身份文本**） |
| `src/prompts/system.md` | 双端 | MODIFY | R12 连带——async 指导语更新（"默认阻塞"→"depth-0 默认 async"——§15 D-A5 遗留，见 D-E1a #6） | **测试（家族部分）**：
| # | 用例 | 预期 |
|---|---|---|
| T-E1 | env-state reminder 每回合注入（含 6 字段） | 注入成功，字段完整 |
| T-E2 | env=cli（CLI 进程）/ env=vscode（扩展宿主） | 身份正确 |
| T-E3 | mode=eng（工程模式开）/ mode=normal（关） | 状态正确 |
| T-E4 | model 字段 = activeModel ?? provider.model | 模型名正确 |
| T-E5 | 恢复会话首回合 resumed=yes；后续回合 resumed=no | 重启感知仅首回合 |
| T-E6 | git context 注入（CLI + VS Code 双端） | 两端一致 |
| T-E7 | peers = 同 cwd 活实例数（多实例同开时 >0） | 同伴计数正确 |
| T-E8 | 模式切换后下回合 mode 反映变更 | 变更感知 |
| T-E9 | 模型切换后下回合 model 反映变更 | 变更感知 |
| T-E10 | 双端零回归（全量套件） | 无破坏 |
| T-E11 | 错误：git 不可用/非 git 仓库 | git 字段安全降级（空/静默跳过，不报错） |
| T-E12 | 错误：activeModel 为 null | model 字段回退 provider.model |
| T-E13 | 错误：slotSessions 不可读（R10 peers 场景——本批 peers 已移除，仅 git/session 数据源需健壮） | 注入不崩，字段降级 | **验收标准聚合（review 补齐）**： | AC | 验收 | 回指 |
|---|---|---|
| AC1 | env-state reminder 每回合注入，字段完整（env/mode/model/resumed——git 不入行，富注入承载） | T-E1 |
| AC2 | env 身份正确（cli/vscode 各自端） | R8 → T-E2 |
| AC3 | mode/model/resumed 状态正确 | R5/R9/R11 → T-E3/T-E4/T-E5 |
| AC4 | git context 双端一致（富注入） | T-E6 |
| AC5 | 变更感知（模式/模型切换下回合反映） | T-E8/T-E9 |
| AC6 | 错误路径安全降级（git/model/slot 不可读不崩） | T-E11/T-E12/T-E13 |
| AC7 | 双端零回归 | T-E10 | ### §11.2 实现核销（2026-09-06 · eng-coder id:2 clean——修正轮 1/5——审计 1 轮 + advisor 2 轮 0🔴） **验收勾销**：AC1 ✔（env-state 每回合注入，env/mode/model/resumed 字段完整——git 不入行，富注入承载）、AC2 ✔（env=cli/vscode——END 静态常量）、AC3 ✔（mode/model/resumed 状态正确）、AC4 ✔（git context 双端富注入——branch/commits/uncommitted）、AC5 ✔（变更感知下回合反映）、AC6 ✔（错误路径安全降级）、AC7 ✔（双端零回归——CLI 1511/1401/0 fail + VS Code 1234/1149/0 fail）。 **R12（AGENT-LOOP.md §18 D-E1a）同步实现**：双端 `asyncFlag = asyncArg ?? ((ctx.depth ?? 0) === 0)`——depth-0 全角色缺省 async、depth>0 缺省 sync、async:false 逃逸口、depth>0 async:true 拒绝；schema description + main.md 指导语双端改深度门控；§15 T7/AC5 supersede（旧措辞零残留）。 **实现偏差记录（出清单改动——交付报告申报、父侧核销接受）**：
1. CLI 无独立 subagent-spec.mjs（schema 内联于 subagent.mjs）——清单该项落在 subagent.mjs，已覆盖（VS Code 有独立 subagent-spec.mjs）。
2. VS Code detectRestoredSession 进程级一次性闸——主路径（进程重启直接恢复）两端正确；中途切换会话拿不到 resumed:yes（按会话跟踪语义完善——记 TODO，见下）。
3. VS Code git 富注入 = 3×execSync 每回合同步（最坏 ~15s 阻塞事件循环）——CLI 同款先例，接受（CLI parity）+ 记 TODO（异步优化——非本批）。 **移交父侧裁决项**（实现时上报，未动代码/文档）：
- 🔵 VS Code `src/prompts/discipline.md:79` 仍含 `action:'check'` 引用（CLI 端已删）——属 §19.8 并行批次镜像面遗漏，不在本批清单，未触碰。 **父侧裁决记录（2026-09-06）**：见会话记录（detectRestoredSession 闸语义完善 + git 富注入异步优化——均记 TODO；discipline.md check 引用——并行批次镜像面，非本批）。 **范围注记**：R9 的"模式历史"（需求句附带）**本批不做**——设计只覆盖"当前模式"注入（满足验收方向"或每回合可靠注入"分支）；模式历史记录留给后续。 ### 家族设计关联 三者同属"agent 自我认知"——共享注入通道（setup-reminders/inject*），设计时统一考虑：注入时机、可查询性、跨端一致性（CLI/VS Code 双端）。与 §10（end marker 端分离）相邻：§10 是存储层"哪个槽"，§11 家族是认知层"agent 自知处境"。 ## 12. 会话目录残留 GC + 标题写显性化（2026-09-06 · 需求 + 设计层 · 双端） > 状态：**已实现**（2026-09-06，eng-coder 交付 clean——修正轮 2/5——审计 1 轮 + advisor 2 轮 0🔴——双端 L1/L2 各绿；实现核销见 §12.6）。
> 范围：CLI（thincoder）+ VS Code（thincoder-vscode）双端——共享 `~/.thincoder/sessions/` 目录，机制必须双端同步（lockstep）。
> 需求池关联：非池内（技术债/审计发现升级——用户直接批准处理）；T-M TODO 组已挂（CLI TODO.md 会话目录残留 GC 组）。 ### 12.1 需求（Requirements） **总体目标**：治理会话目录的长期残留累积（损坏现场/备份/端 marker/manifest 只增不减）与会话元数据写失败的静默性——让目录可长期使用而不膨胀到不可维护，让元数据写失败可见。 | # | 功能需求（用户故事） | 验收语义 |
|---|---|---|
| F1 | 作为长期用户，我希望 `.corrupted`/`.bak-*`/`.unreadable` 残留不无限累积 | 按保留期自动清理过期残留；活跃/近期残留保留 |
| F2 | 作为长期用户，我希望停止使用的 cwd 的 manifest + end marker 不永久占用 | 冷 cwd（长期无活动）可清理；近期/活跃 cwd 保留 |
| F3 | 作为用户，我希望会话标题写失败不再静默 | renameSlot/setSlotTitle 返回可观测结果（成功/失败原因） | **非功能需求**： | # | 维度 | 标准 |
|---|---|---|
| N1 | 安全性 | **自动**清理只碰**确认的残留**（后缀匹配 + 非活跃槽 + 保留期外）；自动路径绝不碰活跃会话的数据文件/manifest 主文件。手动 `session gc --confirm`（冷 cwd 整前缀清空）为**例外**——经 dry-run + 二次确认 + 重校验冷态后放行（见 12.2.4） |
| N2 | 可逆性 | 清理前可预览（dry-run）；首版保守（长保留期） |
| N3 | 双端一致 | CLI/VS Code 清理语义同源；不双写冲突（任一端触发即可，另一端不重复） |
| N4 | 性能 | 清理触发不阻塞主流程；目录扫描有界（不过度全量） | ### 12.2 设计（Design） **12.2.1 方案选型** | 候选 | 方案 | 判定 |
|---|---|---|
| A 残留 GC | 触发点：进程启动时（ensureSlot/resumeSlot 前）对当前 cwd 的 sessions 目录做一次轻量扫描清理 | 采纳——复用项目既有"按 mtime 保留期清理"先例（log.mjs 1 天轮转 / run-helpers TMP_RETENTION_MS） |
| B 冷 cwd | 不自动删 manifest（保守——无法判断 cwd 是否"永久弃用"）；提供 dry-run 手动命令 | 采纳——自动清理 manifest 风险高（可能误删用户想留的历史）；手动/半自动 |
| C 标题写 | renameSlot/setSlotTitle 文件缺失时：CLI/VS Code 统一 `{ok, reason}` 契约（四种失败原因可区分——file-missing/parse-failure/mtime-conflict/invalid-slot） | 采纳——统一双端契约（§12.2.5 裁决 B：扩展返回原因），调用方适配 | **12.2.2 残留分类与保留期（A）** | 残留类型 | 后缀 | 保留期（建议） | 理由 |
|---|---|---|---|
| 损坏现场 | `.corrupted` / `.unreadable` | 30 天 | 供排查近期损坏；太旧无价值 |
| manifest 损坏现场 | `.manifest.corrupted`（manifest 主文件损坏时改名保留，见 §2） | 30 天 | 同上——与槽文件损坏现场同类处理（后缀匹配自然覆盖，此处显式分类） |
| 并发轮转备份 | `.bak-*` | 30 天 | 同上（保留被覆盖的对方现场） |
| 孤儿 .tmp | `.json.*.tmp`（无对应主文件） | 7 天 | 崩溃现场恢复窗口 | **12.2.3 清理触发与范围（A/D）** - 触发：CLI 启动 / VS Code 激活时（对当前 cwd hash 的目录做清理）+ 可选手动命令（`thincoder session gc --dry-run`）
- 范围：`sessionsDir()` 下**当前 cwd 的 hash 前缀**文件（`.corrupted`/`.bak-*`/`.unreadable`/孤儿 `.tmp`）——不跨 cwd 扫描（性能 + 安全）
- 排除：活跃槽对应文件的任何现场后缀保留；manifest 主文件 / end marker 主文件不自动删（N2） **12.2.4 冷 cwd（D——review 补齐：判定 + 报告 + 删除三步，v1 手动确认）** F2 的机制分三步，全部经手动命令（不自动删 manifest——保守：无法判断 cwd 是否"永久弃用"，自动删除风险高）： 1. **判定标准（冷 cwd）**：某 cwd hash 下**无任何活跃数据文件**（`.json.N` 主文件不存在 或 全部属死主进程）**且** manifest mtime 距今 > **90 天** → 候选冷 cwd。（90 天保守——正常开发会频繁触碰；端 marker `.manifest.cli/.vscode` 写 null 后文件保留是 §10 设计，单独看 marker mtime 无意义，以 manifest mtime 为准。）
2. **报告（dry-run）**：`session gc --dry-run` 枚举 **sessionsDir 全目录**（跨 cwd——报告面不受 12.2.3 删除面限制），列出候选冷 cwd 的 hash/路径/manifest mtime/数据文件数，**不删除**。
3. **删除（确认）**：`session gc --confirm <hash>`（或 `--all`）显式删除**指定冷 cwd hash 前缀下的全部文件**：manifest + end marker + 该前缀的 `.json.N` 槽数据文件（死主）+ 裸 v1 文件（`{hash}.json`——历史遗留，eng-coder 移交裁决 **纳入**）+ 残留（.corrupted/.bak/.unreadable/.tmp）——整个前缀清空。 - 为何含数据文件：冷 cwd 判定允许"数据文件全部属死主"（12.2.2 F2 判据 b）——若只删 manifest 而留数据文件，会制造**孤儿数据**（无 manifest 引用、listSlots/resumeSlot 不可达、却仍占盘）——正是本节的累积问题本身。整前缀清空才真正释放空间。 - **删除前警告**（N2 可逆）：confirm 输出将删的文件清单 + "此操作永久删除该 cwd 的全部会话历史"确认提示；`--all` 同型逐 cwd 警告。 - 删除前**重校验冷态**（TOCTOU 防护，T12）：confirm 执行时重跑冷 cwd 判定——若期间该 cwd 变活跃（有新属主/数据文件），拒绝。 > 12.2.3 的"不跨 cwd 扫描"约束仅适用于**自动触发**的残留 GC（防启动阻塞——N4）；手动命令的**报告面**跨 cwd 枚举是必要的（冷 cwd 无从"当前 cwd"发现），二者不矛盾。 **VS Code 侧 F2 执行面**（review #7 决策）：VS Code 扩展无 shell 子命令通道——冷 cwd 的报告/删除（F2）由 **CLI `thincoder session gc` 统一提供**（共享同一 `~/.thincoder/sessions/` 目录，CLI 可清 VS Code 弃用的 cwd）；VS Code 端只实现自动残留 GC（F1）与标题契约（F3），不做 F2 手动面。N3 双端一致不受影响——清理语义同源（session-gc.mjs 双端同构），F2 仅执行入口在 CLI。 **12.2.5 标题写契约统一（C——review 裁决 B：扩展返回原因）** - 双端 renameSlot/setSlotTitle 返回契约从裸 boolean 改为 **`{ ok: true }` / `{ ok: false, reason: "file-missing" | "parse-failure" | "mtime-conflict" | "invalid-slot" }`**——调用方可知失败原因（F3 验收语义"成功/失败原因"落实）。
- CLI `renameSlot`：当前返回 boolean（false = 文件缺失/解析失败/mtime 冲突）→ 改 `{ok, reason}`，区分四种失败原因（含 invalid-slot）。调用方 `src/tui/cmd-session.mjs` 同步适配。
- VS Code `setSlotTitle`：`undefined` → `{ok, reason}` 同构。调用方 `panel-messages`/`panel-session` 同步适配。
- reason 枚举与既有内部判定一一对应（文件缺失/解析失败/mtime 冲突/槽号非法），不含用户文本——文本渲染由调用方决定。
- 兼容注：返回形态改变是显式契约升级——受影响文件表含全部调用方；无外部 API 消费者（内部工具）。 ### 12.3 受影响文件（Affected Files） > **拆分规划（review #1 采纳）**：残留 GC 是独立决策（"何时清何种残留"），不塞进 session-slots.mjs——CLI 该文件已在 500 行硬限零余量（实测 501 行），加逻辑必超限。GC 逻辑入**新模块 `session-gc.mjs`**（CLI `src/` + VS Code `src/extension/`，双端同构），从 session-slots/io import 原语，启动钩子只加一行调用。
> **注意**：CLI `session-slots.mjs` 的 renameSlot 契约改（boolean → {ok,reason}）也在该 501 行文件内——若改动使其进一步超限，实现时须**一并拆出** renameSlot（或整体维持 ≤500 的行内替换——契约改是行内 return 变化，优先行内不增行；eng-coder 实现时若 >500 则按 §10.6 偏差 3 先例拆文件）。 | 文件 | 端 | 动作 | 内容 |
|---|---|---|---|
| `src/session-gc.mjs` | CLI | **ADD** | 残留 GC + 冷 cwd 报告/删除（12.2.3/12.2.4）+ dry-run 模式 |
| `src/extension/session-gc.mjs` | VS Code | **ADD** | 同上（与 CLI 同源移植） |
| `src/session.mjs` | CLI | MODIFY | 启动钩子触发 GC（一次调用，不膨胀） |
| `src/extension/session-io.mjs` | VS Code | MODIFY | setSlotTitle 契约改 `{ok, reason}`（12.2.5）；启动钩子触发 GC（一次调用） |
| `src/session-slots.mjs` | CLI | MODIFY | renameSlot 契约改 `{ok, reason}`（12.2.5）；GC 用内部原语零暴露或最小（slotPath/sessionsDir 已导出） |
| `src/extension/session-slots.mjs` | VS Code | MODIFY | 同 CLI——零改动或最小暴露 |
| `src/tui/cmd-session.mjs` | CLI | MODIFY | renameSlot 调用方适配 `{ok, reason}`（TUI `/session` 改标题路径） |
| `bin/thincoder.mjs` | CLI | MODIFY | 新增 `case "session"` 子命令分发：`thincoder session gc --dry-run` / `--confirm <hash>`（接线到 session-gc.mjs） |
| `src/extension/panel-messages.mjs` / `panel-session.mjs` | VS Code | MODIFY | setSlotTitle 调用方适配 `{ok, reason}` |
| `docs/design/README.md` | 双端 | MODIFY | 变更记录（SESSION.md §12 归位，地图无需新增板块） |
| `test/session-gc.test.mjs` | CLI | **ADD** | GC + 标题契约测试（T1-T12，见 12.4） |
| `test/session-gc.test.mjs` | VS Code | **ADD** | 同上（双端镜像，VS Code test/ 平铺目录） | ### 12.4 测试（Testing） | # | 用例 | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|---|
| T1 | 正常：清理过期 .corrupted | 目录含 31 天前 .corrupted + 今天 .corrupted | 旧的删、新的留 | F1/N1 |
| T2 | 边界：保留期内的 .bak 不清 | 29 天前 .bak | 保留 | F1 |
| T3 | 错误：活跃槽的现场后缀不清 | 活跃槽 1 有 .corrupted | 保留（N1 安全） | N1 |
| T4 | 正常：孤儿 .tmp 清理 | 超过 7 天（如 8 天前）的孤儿 .tmp | 删（mtime < now−7d） | F1 |
| T5 | dry-run 不真删 | 手动命令 --dry-run | 只列不删 | N2 |
| T6 | 标题契约：双端 setSlotTitle/renameSlot 文件缺失 | 不存在槽 | 返回 `{ ok: false, reason: "file-missing" }`（原 undefined/false） | F3 |
| T7 | 标题成功 | 存在槽 | 返回 `{ ok: true }` + 标题落盘 | F3 |
| T7a | 标题失败原因区分 | mtime 冲突 / 解析失败 文件 | `reason: "mtime-conflict"` / `"parse-failure"` 各自区分 | F3 |
| T7b | 标题失败原因：槽号非法 | 槽号 0 / 负数 / 非整数 | `{ ok: false, reason: "invalid-slot" }` | F3 |
| T8 | 双端回归 | 清理后会话正常保存/恢复 | 零回归（全量套件） | N3/N4 |
| T9 | F2 正常：dry-run 列冷 cwd | 冷 cwd A（无活跃数据文件 + manifest 91 天前）+ 活跃 cwd B | 报告列 A 不列 B；零删除 | F2 |
| T10 | F2 边界：近期 cwd 不列 | 冷 cwd 候选 manifest 30 天前 | 不列入（<90 天阈值） | F2/N1 |
| T11 | F2 删除：confirm 清空指定冷 cwd | `gc --confirm <hash-A>` | A 前缀全部文件删（manifest+marker+.json.N 数据+残留）；活跃 cwd 不动 | F2/N1 |
| T12 | F2 安全：删活跃 cwd 被拒 | `gc --confirm <活跃hash>` | 拒绝（有活跃数据文件/属主活） | N1 | **活跃槽判定（T3/T12 的操作定义）**：某 slot 的 `.json.N` 主文件存在 且 其 manifest `slotSessions[N]` 属主进程存活（`isProcessAlive`）→ 活跃，其现场后缀（.corrupted/.bak/.unreadable）与目录一律保留。属主死/无记录 → 非活跃，残留可按保留期清理。 **验收标准聚合（review #6 补齐）**： | AC | 验收 | 回指 |
|---|---|---|
| AC1 | 过期残留（.corrupted/.unreadable/.bak-*/孤儿 .tmp）按保留期清理，活跃/近期保留 | F1 → T1-T4 |
| AC2 | 冷 cwd 可经 `session gc --dry-run` 报告、`--confirm` 删除；活跃 cwd 拒绝 | F2 → T9-T12 |
| AC3 | 标题写返回 `{ok, reason}`，四种失败原因可区分（file-missing / parse-failure / mtime-conflict / invalid-slot） | F3 → T6/T7/T7a/T7b |
| AC4 | 双端实现后零回归（全量套件 CLI + VS Code 各绿） | N3/N4 → T8 | **保留期边界语义（review #7 补齐）**：判定用 **mtime < now − retention** 即删（`older-than`），恰好等于保留期的文件**保留**（`>=` 边界不清，故 T4 输入用"超过 7 天如 8 天前"而非"7 天前"）。测试用 mtime 回拨（`utimesSync`）造老化文件——测试 seam 明确。`.unreadable` 与 `.corrupted` 同保留期（30 天），T1 覆盖 .corrupted、同逻辑适用于 .unreadable（补一断言）；`.manifest.corrupted` 同 30 天（补一断言）。 **启动性能（review #8 采纳）**：自动触发 GC **延后到进程启动完成后**（async 空闲时/首轮后）执行，不阻塞启动路径（N4）；扫描先按后缀预过滤（只 stat `.corrupted/.bak*/.unreadable/.tmp` 候选），再对候选做活跃槽判定——避免全量 listing 开销。sessionsDir 只扫当前 cwd hash 前缀（12.2.3）；冷 cwd 枚举仅手动命令触发。 ### 12.6 实现核销（2026-09-06 · eng-coder id:1 clean——修正轮 2/5——审计 1 轮 + advisor 2 轮 0🔴） **验收勾销**：AC1 ✔（T1-T4——双端过期残留按 older-than 清理、活跃保留）、AC2 ✔（T9-T12 + T11b——CLI 命令面冒烟实测：dry-run 报告 / confirm 警告+整前缀删除 / 活跃拒绝）、AC3 ✔（T6/T7/T7a/T7b——双端四原因可区分、调用方适配）、AC4 ✔（L1：CLI 1400/0 fail + VS Code 1119/0 fail；L2 父侧终端：CLI 1511/1401/0 fail + VS Code 1234/1149/0 fail——双端零回归）、N4 ✔（setImmediate 空闲 + 后缀预过滤）。 **实现偏差记录（出清单改动——交付报告申报、父侧核销接受）**：
1. `src/session-rename.mjs`（CLI 新建）——renameSlot 自 session-slots.mjs 拆入（501 行超限，§12.3 注意句预授权拆分）；session-slots.mjs 降至 475 行 ✓。
2. `src/extension/session-slot-write.mjs`（VS Code 新建——**非本批**：接手时已有，属 AUTO bug 修复任务拆分；与 §12 交集仅是使 session-io.mjs 保持 469 行 ≤500——归属 AUTO bug 修复，非本批交付）。 **移交父侧裁决项**（实现时上报，未动代码/文档）：
- 🟡 legacy `{hash}.json` 裸 v1 文件盲区——冷 cwd 整前缀删除不含它（`startsWith(prefix + ".")`）；设计"整前缀清空防孤儿"理由有张力，但 §12.2.4 删除枚举未含它——**父侧裁决**（见下）。
- 🔵 `session gc` shell completion 子层（gc/--dry-run/--confirm 不可补全）——设计未要求，不做。 **父侧裁决记录（2026-09-06）**：legacy `{hash}.json` 裸 v1 文件**纳入**冷 cwd 删除集（用户裁决——v1 是历史遗留死数据，整前缀清空的意图就是释放空间，留 v1 矛盾——实现时 eng-coder 按此扩展删除集）。见会话记录。 ### 12.7 变更记录：legacy v1 扩展删除集代码同步（2026-09-06 · CLI 端实现） > 状态：**已实现（2026-09-06——eng-coder id:1 clean——审计 1 轮 CLEAN + advisor 1 轮 0🔴 零修正轮——模块测试 18/18（既有 14 + T-V1a..d 4）——父侧 L2 核销见 §12.8）**。评审 2026-09-06 0🔴 通过（/）——用户批准 2026-09-06。 **gap 实证**（读码 2026-09-06）：`session-gc.mjs` `deleteColdCwd` 区域的冷 cwd 整前缀文件集 filter = `entries.filter(e => e.startsWith(prefix + "."))`——裸 `{hash}.json`（v1 死数据）**不在集合**；文档（§12.2.4 步骤 3 + §12.6 裁决）已含——文档-代码漂移，代码未跟裁决。 **需求（F-V1）**： - **F-V1**：冷 cwd `--confirm <hash>` / `--all` 删除集 = 既有全集 + **裸 `{hash}.json`**（v1 死数据）——整前缀清空语义完整兑现（§12.2.4 意图：释放空间，留 v1 矛盾）。
- **NF-V1**：dry-run 报告同样列出裸 v1（用户确认前可见）；删除前警告清单含之；TOCTOU 重校验语义不变（v1 存在不改变"冷态"判定——判定看 .json.N 活跃与 manifest mtime）。
- **NF-V2**：范围 = **CLI 端**——F2 手动执行面仅 CLI（§12.2.4 下注：VS Code 不做 F2），v1 清理随 CLI 统一覆盖共享 sessions 目录。 - **D-V1（`src/session-gc.mjs`）**：冷 cwd 删除集扩展——`deleteColdCwd` 与 dry-run 报告共用的文件集合 filter 补 `|| e === prefix`（裸 `${hash}.json`）；`files`/报告/警告三处同源（共用集合变量——不各写各的）。`classifyResidue`（残留 GC 面）**不动**——v1 属冷 cwd 手动删除面，自动残留 GC 不碰 manifest/v1（§12.2.3 排除语义不变）。 - **D-V2（`test/session-gc.test.mjs` CLI）**：补 T-V1 系列——构造冷 cwd（manifest >90 天 + 无活跃 + **裸 v1 文件在位**）→ dry-run 列出含 v1 → confirm 删除后 v1 消失 + 整前缀清空；--all 同型；活跃 cwd（裸 v1 在位但 .json.N 活跃）→ confirm 拒绝（TOCTOU 不回归）。
- **D-V3（文档）**：本记录 + §12.2.4 步骤 3 已含（不重复）——CHANGELOG 父侧交付时落。 **验收（AC-V1）**：AC-V1 = T-V1 全绿（dry-run 报告含 v1 / confirm 删除 v1 / `--all` 同型 / 活跃 cwd 拒绝——D-V2 四场景全映射）；AC-V2 = 既有 session-gc 全量用例零回归（T1-T12 语义不变——残留 GC 面零触碰）。 **受影响文件**：CLI `src/session-gc.mjs` + `test/session-gc.test.mjs` + 本文件（已落）——VS Code 端零改动（F2 面仅在 CLI）。 ### 12.8 实现核销（2026-09-06 · eng-coder id:1 clean——审计 1 轮 CLEAN + advisor 1 轮 0🔴 零修正轮） **验收勾销**：AC-V1 ✔（T-V1a..d 四场景——模块测试 18/18 绿：dry-run 含 v1 / confirm 删 v1 + 整前缀清空 / --all 同型 / 活跃拒绝 TOCTOU 不回归）；AC-V2 ✔（既有 T1-T12/T9-T11b 语义零触碰——18/18 全含）。 **父侧 L2**：CLI test:full **1543/1543** 全绿（215.8s——含批 2 wait_for 双端产物同批回归）。 **真实目录核查（评审 🔵#3）**：`session gc --dry-run` 对真实 sessions 目录（14731 项）→ 0 冷候选/0 残留候选；形态扫描——裸 40 位 hash v1 0 个、12 位孤儿 0 个、仅裸 v1 无 manifest 0 个——**无候选集外孤儿类——范围问题零上报**。fixture 形态（旧 manifest + 裸 v1）为命名体系一致性下的可达形态，活数据当前无实例可实证（记录在案——机制就绪，待真实数据出现时生效）。 **CHANGELOG**：已落（父侧）。 ## 13. 跨会话历史检索 + 检索族消歧（2026-09-06 · R19——快车道合批——用户裁定 🅰 read_history 加参数 + 消歧总纲） > 状态：**设计（2026-09-06——澄清裁定：🅰 = read_history 加 cwd/slot 参数（本会话 = 默认域——单工具扩展——非新工具）——设计落本节——评审发起权在用户）**。 ### 13.1 需求 **F-R19a（跨会话检索）**：As an agent, I want 检索任意会话（本 cwd 或指定目录）的消息历史，so that 跨会话找回裁定/决策/过去讨论（read_history 本会话外延）。现状：read_history 仅本会话（§9——depth-0 only）——跨会话无工具——AUTO 排查曾手工扫 7383 个 slot 文件（session-state 诊断 TODO 同源）。 **F-R19b（检索族消歧）**：As an agent, I want 检索/记忆族工具描述互指消歧（何时用哪个），so that "查历史"不命中 5 个工具选错。现状：27 工具仅 6 个有 Use when 引导——read_history/recent_changes/memory/doc_search/code_search 无互指总纲。 **NF-R19**：readonly；depth-0 only（同 read_history——子代理查"本会话"无意义域外）；会话文件为只读检索对象（不写不改）；性能 = v1 逐文件流式读（无索引——会话文件行读 + keyword 预筛）；隐私 = 本机会话文件（同 read_history 无额外门禁）。 ### 13.2 设计 **D-R19a（read_history 参数扩展——🅰）**：
- 新参数 `path`（可选——默认本会话）：目标会话文件路径（显式）或 `cwd:` 前缀指定目录（自动发现该 cwd 的会话槽——manifest/slotSessions 结构既有）；跨会话查询 = path 指定 → 读目标文件 history 线 → 同 filter 面（role/keyword/tool/since/until/limit/direction）应用
- 本会话缺省 = 零行为变化（向后兼容——既有调用全不传 path）
- 发现面（path = cwd:xxx——**评审 #2 修正：v1 决策定死 = 列全部槽 + 时间序——不做死槽过滤**）：列该 cwd 的槽（manifest/slotSessions 结构既有）——每槽摘要行 = **槽号 + 完整文件路径 + title/消息数/updatedAt**（**评审 #2——摘要必须含寻址字段：模型无法自行算 sha1(cwd) 拼文件名——第二步深查 = path=<摘要行的完整文件路径> 重调**——两步交互与 memory search 同型）
- 检索护栏（**评审 #3——N1 标签删——具体化**）：单槽检索设行扫上限 **READ_HISTORY_SCAN_MAX = 200,000 行**——超限返回 `{error: "session too large — refine keyword or since/until"}`（超限提示文案定稿——不再读全文——行扫 + keyword 预筛在前——T-R19.7 断言该文案）；返回条数沿用 §9.5 #5 limit clamp（>200 → 200） **D-R19b（消歧总纲——read_history 描述尾段逐字定稿）**：
> 检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；查**别的会话/项目**旧对话 → read_history 带 path/cwd 参数；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识/约定**（memory）→ memory search；查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint cat/versions。read_history 只查会话消息——文件级改动用 recent_changes——知识与约定用 memory——互相不替代。 消歧段补进各工具描述（互指尾句——最小改动）：read-history.mjs（尾段——含 cwd 参数说明 + 族表）、recent-changes.mjs（尾句"会话级历史用 read_history"）、memory 工具描述（search 段补"会话消息历史不在 memory——用 read_history"——memory 在 agent-tools？查归属——若 CLI 工具描述独立文件——同批）、doc_search/code_search（"查设计决策用 doc_search——查实现用 code_search——查会话用 read_history"——doc/code 描述已有互指——补 read_history 引用）。 ### 13.3 测试 | # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T-R19.1 | 缺省 = 本会话 | 不传 path | 既有行为零变化（回归） | F-R19a |
| T-R19.2 | 跨会话单槽 | path = 指定会话文件 + keyword | 命中旧会话消息（含 ts） | F-R19a | | T-R19.3 | cwd 发现 | path = "cwd:xxx" | 槽摘要列表（**槽号 + 完整文件路径** + title/消息数/时间） | F-R19a |
| T-R19.3b | 错误：未知 cwd | path = "cwd:nonexistent" | 错误返回（明确文案——无该 cwd 会话目录） | F-R19a |
| T-R19.3c | 边界：cwd 无槽 | path = "cwd:空目录" | 空列表 + 提示（无会话） | F-R19a |
| T-R19.3d | 错误：目标文件缺失/损坏 | path = 不存在的 .json.N / 损坏文件 | 错误返回（不崩——§9 错误处理同型） | F-R19a |
| T-R19.4 | 子代理拒 | depth>0 | 拒（同 read_history） | NF |
| T-R19.5 | 消歧描述锚 | read_history 描述 | 含族表尾段（锚断言） | F-R19b |
| T-R19.6 | 消歧补句 | recent_changes/memory 等描述 | 互指尾句在（锚断言） | F-R19b |
| T-R19.7 | 大会话护栏 | 超大文件（>200,000 行） | 错误提示文案（不读全文——评审 #3 定稿文案） | NF | **验收**：AC-1 = T-R19.1..7 绿（双端镜像——CLI + VS Code read-history 同构）；AC-2 = 零回归（read_history 既有调用全绿——缺省不变）；AC-3 = 描述锚测试绿（消歧段双端一致）。 ### 受影响文件（评审 #5——从"初步"定稿）
CLI + VS Code：`agent-tools/read-history.mjs`（path 参数 + 描述尾段族表 + 护栏——实现面主文件）、`agent-tools/recent-changes.mjs`（互指尾句——描述区改）、检索族描述面（`doc_search`/`code_search`/`memory` 工具描述补互指句——**实现批逐个点名验证实际描述文件位置（tools/*.md 或 .mjs 内联——含 read.md 类路由句若存）——清单外新增以报告为准**）、双端测试镜像（read-history 家族测试——含新错误用例）、SESSION 本节 + 双端 CHANGELOG。**checkpoint "versions" 核验（评审 #8）**：总纲句的 "checkpoint cat/versions"——实现批先核验 git 工具动作面是否含 versions——不含则总纲句改 "checkpoint（cat/list——按实际动作面）" 再定稿。 ### 变更记录
- 2026-09-06：R19 立项（用户"跨会话也希望有"——工具族评估发现消歧缺口——并入消歧总纲）——澄清裁定 🅰（read_history 加参数）——设计落本节。 > **评审处置注（2026-09-06 round1）**：1🔴 + 6🟡 + 3🔵 全采纳——#1（§26 byte-identical）落 AGENT-LOOP §26；#2 寻址缺口修（摘要含槽号+完整文件路径——v1 死槽过滤决策定死列全部）；#3 护栏具体化（READ_HISTORY_SCAN_MAX 200,000 行 + 提示文案定稿——N1 悬空标签删）；#4 错误路径用例（T-R19.3b/c/d）；#5 受影响文件定稿（实现批点名验证描述位置）；#8 checkpoint versions 实现前核验注。**复审发起权在用户**。
