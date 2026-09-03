# Session 持久化设计（thincoder/src/session.mjs）

> 状态：2026-08 回补。**CLI 与 VS Code 共享同一存储契约**——文件格式、槽位认领、双线字段全部一致（VS Code 侧实现见 thincoder-vscode/src/extension/session-io.mjs，同一契约的镜像）。

## 1. 核心模型

- **按 cwd 隔离**：会话目录 `~/.thincoder/sessions/{sha1}.json.*`——cwd 的 **40 位完整 sha1**（非截断；Windows 盘符大写归一化，保证 CLI `process.cwd()` 与 VS Code `uri.fsPath` 算出同一 hash）。
- **槽位制，无"当前文件"**：`{hash}.json.N` 是第 N 个槽位的完整会话；`{hash}.json.manifest` 存槽位元数据 + active 指针 + 进程认领表。**active 槽位就是当前会话**——没有独立 current 文件。
- **文件无上限**：槽位按需递增（`/session` 查看/切换，`/new` 开新槽）。
- **旧格式迁移**：12 位短 hash 文件一次性重命名为 40 位（幂等）；legacy `{hash}.json`（v1 单会话）读取时迁移进槽位。

## 2. 并发安全（CLI ↔ VS Code 双进程）

| 机制 | 说明 |
|---|---|
| `sessionId` | 每进程唯一：`pid-timestamp-random`，写入 manifest 的 `sessionId` |
| `slotSessions` 认领表 | `ensureActive` 按优先级认领：当前 active 空闲 → **文件缺失的空槽**（2026-08-31 会诊 F4：不再认领"最小空闲号"——死主的旧槽文件仍在，会 resume 进陌生会话且退出时覆盖）→ 全被活进程占用时开新槽（新号从 max+1 起跳过活认领号/现存文件号，2026-09-01 会诊 kimi 🟡；max 取 `allSlots[last]` 而非 `Math.max` spread——数万槽位时 RangeError 风险） |
| 死主条目清理 | 2026-08-31 会诊 F4 + 2026-09-01 会诊 deepseek/kimi 🔴：`ensureActive` 开头删除 owner 已死的 `slotSessions` 条目（死主判定必须跑 `isProcessAlive`；ensureActive 因 F1 粘性每次进程只触发几次，全量 tasklist 成本可接受；不能以"文件缺失"短路——活进程在"认领→首次保存"窗口文件暂缺，误删会致双进程同槽）。**清理落盘必须传 `deletions` 参数**（早退 + 分支 1/2/3 全部）——saveManifest 条目级合并会把磁盘上仍存在的死条目从 fresh 复活回写，仅传 m 等于没删（advisor N1 只修早退路径，会诊抓到三分支复活）；`deadParam` 按调用时状态过滤刚重新认领的槽，避免删掉自己的新属主 |
| `isProcessAlive(pid)` | Windows `tasklist /FO CSV`（PID 列精确比对）/ Unix `kill(pid,0)`——死进程的槽位可回收复用 |
| slot 粘性 | 2026-08-31 会诊 F1：`saveSession` 首次认领后缓存 `agent._slot`，**永不重跑** ensureActive（原实现每次保存重推，manifest active 被并发方翻动时会话静默迁移 → 双副本/覆盖他人）；`applySession` 清空缓存（切换后重新认领 manifest active），ACP 加载路径显式钉回目标槽 |
| ACP 同进程多会话 | 2026-09-01 会诊 kimi/glm 🔴：`getSessionId()` 是**进程级**、`_slot` 是 **agent 级**——粒度错配使同进程两会话互相视为"自己"（两次 `session/new` 拿同一槽 → F2 互旋；同槽 load 两次 → 静默互覆盖）。修复：`session/new` 立即 `newSession()` 钉独立槽；load/resume 钉槽前查 `sameProcessPinned`（sessions Map 内其他 session 已钉同槽），占用则 `newSession` 显式 fork 新槽——**绝不 `_slot = null` 等下次保存**（`saveSession → activeSlot → ensureActive` 分支 1 早退 `slotSessions[active] === mySessionId` 同进程恒真 → 落回同进程 active 槽即他人槽）；`session/delete` 删非 active 槽时在存会话同型立即 `newSession` 重钉（advisor round2 🔴 同族残留） |
| `slotOccupancy` | 目标槽是否被**另一活进程**占用（/session 切换提示、ACP 钉槽前检查）：**排除本进程属主**（`owner === getSessionId()` → 空闲，2026-09-01 advisor 🟡——/session 重选当前槽不误报）；同进程双会话防护由 ACP `sameProcessPinned` 承担 |
| 原子写 | `writeSessionFile`：先写 `.tmp` 再 rename（跨盘失败降级 unlink+rename → 直写）；防中途崩溃产生截断 JSON |
| `.corrupted` 兜底 | 读失败的文件改名 `.corrupted` 保留现场，不覆盖；**损坏的 manifest 同样改名 `.manifest.corrupted` 保留**（2026-09-01 advisor 🟡——否则覆盖后全部槽位元数据丢失，/session 列表变空） |
| `.unreadable` 保留 | 2026-08-31 会诊 F2：version/cwd/history 结构校验失败不再静默返回 null（否则新会话首次保存覆写旧文件）——改名 `.unreadable` 保留现场；**version > 2 的新版文件不动**；cwd 不匹配是别人的文件也不动 |
| 覆盖防护（.bak 轮转） | 2026-08-31 会诊 F2 + 2026-09-01 会诊 deepseek 🟡：`saveSession` 写前校验目标槽的 `sessionStart` 与本进程不符 → 先 `rename` 为 `.bak-{ts}` 再写（11311 条历史被新进程覆盖的实锤场景）；**version > 2 的文件无论 sessionStart 一律轮转**（loadSlotFile 对 v3 返回 null 不动，若其 sessionStart 为 null 旧版首次保存会静默覆盖）；轮转路径经返回值透出；检查按 mtime 缓存避免每次保存全量解析 |
| `saveManifest` 合并 | 2026-08-31 会诊 kimi/deepseek 🟡 + 2026-09-01 三家 🟡：写前重读按**条目级**合并（`{...fresh.slots, ...m.slots}`、slotSessions 同理）防丢失更新；**删除意图经 `deletions` 参数显式表达**（deleteSlot、死项清理）；**active 是单值——只有显式翻指针的调用点（ensureActive 分支、newSession、switchToSlot、deleteSlot 删到 active）传 `setActive`**，其余调用点（saveSession/ACP 认领）默认保留磁盘 fresh.active，否则毫秒窗口内回滚并发方刚翻的指针 |

并发场景：CLI 与 VS Code 同时打开同一项目——各认领不同槽位互不覆盖；`/session` 与面板会话列表看到的 active 指针一致（切换会持久化到共享 manifest）。

## 3. 会话文件内容（v2，双线结构）

```jsonc
{
  "version": 2,
  "cwd": "D:\\teamcode",
  "title": "…", "activeProvider": "deepseek", "activeModel": null,
  "updatedAt": 1754200000000,
  "history":        [ /* 人读线：完整真实消息，永不压缩（UI 渲染 + CLI resume 显示读它） */ ],
  "contextHistory": [ /* 机读线：可能已压缩的模型上下文（恢复后保留压缩收益） */ ],
  "tasks": [], "planMode": false, "autoApprove": false,
  "engineering": false, "engDesignToken": null, "goal": null,
  "advisor": { /* advisor 配置快照 */ },
  "pendingReminders": [], "sessionStart": 1754200000000
}
```

**双线写入契约**（详见 ARCHITECTURE.md §双结构 + CONTEXT-COMPACTION.md）：
- 真实消息（用户输入/assistant 回复/tool 结果/多模态图像）走 `pushReal` → 同时进 `history`（人读）与 `contextHistory`（机读）
- 机读消息（`[System reminder:`、`[User interrupt:`、压缩 note、task/plan 回注）只进 `agent.history`，**不进人读线**
- **transient 消息（编辑器上下文注入等）**：**人读线（history）落盘时过滤**（`saveSession` 的 `!m.transient` + legacy 前缀清理 `LEGACY_TRANSIENT_PREFIXES`）；**机读线（contextHistory）保留**——恢复必须逐字节重建 provider 前缀缓存所见的序列（2026-08-16 cache-hit 报告；丢 transient 会让每次重启在首个注入位漂移 → 首请求整前缀缓存 miss）
- **人读线落盘瘦身（`slimForDisplay`，2026-08-30 会诊 3/3 设计、deepseek 方案）**：`saveSession` 写盘时对 `history` 做 copy-on-write 映射（**绝不原地改**——两线经 pushReal 共享对象引用，原地改会污染机读线与 provider 前缀缓存）：
  - `assistant.tool_calls[].function.arguments` 截 300 字符（head + `…`）
  - `tool` 消息 content 截 500 字符（head + `… (truncated for storage)`）
  - 多模态 user content 数组：保留 text part，**丢弃 image_url base64 part**（显示只需 text；模型侧图像由 multimodal 通道承载）
  - **`contextHistory` 一字不动**——机读线保持与 provider 前缀缓存逐字节一致（strict pairing/多轮看图全靠它）。实测 18MB 会话重存后大幅缩水（base64 + 工具结果正文占大头）
  - VS Code 端同批落地（session-io.mjs 同款 `slimForDisplay`）——两端写出的会话文件一致瘦身；vscode 的 historyWindow 只渲染字符串 content，瘦身后显示安全

## 4. 保存与恢复

**saveSession(agent)**（2026-08-31：`display` 参数已废弃——TUI 恢复始终从 history 重建；返回轮转的 `.bak` 路径或 null）：`history = (_fullHistory ?? history).filter(非 transient + 非 legacy-transient)`、`contextHistory = agent.history.filter(非 legacy-transient)`（**机读线保留 transient**——逐字节重建前缀缓存的依据，2026-08-16 cache-hit 报告）→ 写 `agent._slot`（粘性缓存，首次认领）槽 + 更新 manifest 摘要（`slotDigest`：messageCount/turnCount/firstMessage/activeProvider/title）。TUI 在每次回合结束增量保存（agent-turn finally），崩溃最多丢半轮。

**loadSession(cwd)**：读 active 槽（`.tmp` 备份优先回退）→ legacy 兜底 → 全部失败返回 null。

**loadSlotFile(cwd, slot)**（2026-08-31 会诊 deepseek 🟡 抽取）：**无认领副作用**的槽文件读取器，`loadSession`（active 槽）/`switchToSlot`/ACP `session/load` 共享同一校验——version 1/2 + history 数组 + cwd 匹配；结构不符改名 `.unreadable`、解析失败 `.tmp` 回退成功后提升为正主（损坏主文件改名 `.corrupted` 保留）、**主文件缺失时恢复孤儿 `.tmp`**（rename 前崩溃现场，2026-09-01 advisor 🔵）。

**applySession(agent, data)** 恢复语义：
```
人读线  _fullHistory ← data.history
机读线  agent.history ← data.contextHistory（缺失/为空才回退 history 播种）
title/tasks/planMode/autoApprove/goal/pendingReminders/sessionStart/advisor ← 对应字段
activeProvider ≠ 当前 → 按名切回 provider（找不到不回切）
_compressFailures/_verifyRetries 重置
_slot/_slotMtime 清空（2026-08-31 advisor：切换后保存重新认领 manifest active，防落错槽）
```
**机读线必须从 contextHistory 恢复**而非从完整 history 重建——后者会把已压缩的中间过程塞回上下文（实测 prompt 膨胀到 283%）。`compactThresholdAuto` 时按恢复后的模型重新推导阈值（bin/thincoder.mjs）。**v1 老文件（无 contextHistory）回退播种时剥离被 slimForDisplay 截断的 `tool_calls.arguments`**（以 `…` 结尾 → 置 `{}`；2026-08-31 会诊 F6——截断可劈断 `\uXXXX` 产生 400 毒载荷）。

## 5. 切换与归档

- `/new`（`newSession` + `resetSessionState`，2026-08-31 会诊 F3 + 2026-09-01 会诊/advisor）：分配新槽并**立即记录所有权**（slotSessions，防并发方认领）；选号跳过 manifest 条目 / 现存文件 / 活认领号（`existsSync` + `liveClaimed`，2026-09-01 会诊 deepseek/kimi 🟡）；**开头清理死主条目**（死主且文件缺失的槽号连 `m.slots` 条目一并删、回收复用，与 ensureActive 分支 2 语义对齐，advisor 🔵）；`resetSessionState` 清空 `_fullHistory/title/_sessionStart/_engDesignToken/压缩与验证计数/tasks/planMode/goal/reminders/_slotMtime/_slot` **以及进程级注入标志 `_osReminderInjected/_restartReminderInjected/_lastEngState`**（2026-09-01 会诊 glm 🟡——不清则 /new 后新会话永不注入 OS/cwd reminder）；不清 `autoApprove`（用户偏好跨会话保持，有意）——原实现只清 `agent.history`，新会话首次落盘把旧会话完整人类线 + 旧标题写进新槽（实锤 `.19`/`.3` 双副本）
- `/session`（`listSlots`）：按 updatedAt 降序列出全部槽位元数据；**只读操作不认领**（active 缺失时全部 isActive=false，由下一次 activeSlot 正常认领，2026-09-01 会诊 🟢）
- `/session N`（`switchToSlot`）：**直接 `loadSlotFile` 读目标槽**（2026-08-31 会诊 deepseek 🔴——原经 loadSession 的 activeSlot 有认领副作用，目标槽被活进程占用时 ensureActive 分支 3 会把 active 拨到新空槽并读回 null + 劫持对方指针），只改 manifest 指针，**无文件拷贝**；目标槽空闲则一并认领、被**另一活进程**占用则不认领（`slotOccupancy` 提示——下次保存经 activeSlot 自然 fork 到新槽）；随后 `applySession` 清空 `_slot` 缓存——切换后的保存落在目标槽
- 删除：`deleteSlot` 删文件 + 清 manifest 条目 + `deletions` 显式删除（防合并复活）+ 删到 active 时置空 active 指针（`setActive`）；ACP `session/delete` 只删 archive，**在存会话立即 `newSession` 重钉新槽**（2026-09-01 advisor round2 🔴——清 `_slot` 等下次保存会落回同进程 active 槽即他人槽）
- 退出不归档：`/exit`/Ctrl+C 只保存当前槽——避免"打开关掉就塞满槽位"

## 6. 与 VS Code 的契约对齐点

| 契约 | CLI | VS Code |
|---|---|---|
| cwd hash | 40 位 sha1 + 盘符大写 | 同（session-io.mjs 同实现） |
| 槽位认领 | slotSessions + isProcessAlive | 同（面板绑槽后固定） |
| 双线落盘 | `history` + `contextHistory` | `saveMessages(msgDir, name, messages, contextHistory)` 同字段 |
| 旧格式回退 | 无 contextHistory → 从 history 播种 | 同（`contextHistory: null` → 播种） |
| transient 过滤 | 人读线过滤 `!m.transient`，机读线保留（前缀缓存逐字节依据） | 同（`_saveLines` 落盘过滤，2026-08 修复） |

**2026-09-01 会诊 4 模型（glm/deepseek/kimi/qwen）共识——跨端共享会话契约增补**：

| 契约 | CLI | VS Code | 破坏场景（修复前） |
|---|---|---|---|
| `sessionStart` 打点 | `setup.mjs` `_sessionStart ??=` 赋一次 | `saveLines` `existing.sessionStart ?? new Date().toISOString()` 赋一次（2026-09-01 补） | VS Code 恒 null → F2 条件永不触发（无覆盖防护）；CLI 加载 VS Code 槽后 setup 打自己的 start → 跨端保存必轮转对方现场（F2 自伤，"先占者赢"） |
| legacy transient 过滤 | `isLegacyTransient`（读 loadSlotFile + 写 saveSession 双点） | 同（session-io.mjs 移植，读 loadSlot + 写 keepReal/keepMachine，2026-09-01 补） | 旧注入在 VS Code 进 UI/进播种机器线/保存永久回写（CLI 的清污被重新污染） |
| 机读线判定 | `contextHistory.length > 0` 才当机读线 | 同（activeLines，2026-09-01 补） | `contextHistory: []` + history 非空 → VS Code 恢复空机器线（静默丢全部上下文） |
| v1 回退剥离截断 args | `stripTruncatedToolArgs`（F6） | 同（session-io.mjs 移植，2026-09-01 补） | 旧 v1 文件恢复后把 `…` 半截 arguments 发向网关 → 400 hex-escape |
| 同会话并发追加检测 | （F1 粘性 + 每保存重读磁盘，天然低风险） | `saveSessionToSlot` 磁盘 history 比待写快照长 → 轮转 .bak（2026-09-01 补） | 面板 turn 快照写回覆盖 CLI 并发追加的消息（静默丢失） |
| `activeModel` 双向 | 写 + 恢复时设置 provider.model | `saveLines` 写 `extra.activeModel ?? existing.activeModel`（2026-09-01 补） | VS Code 不写 → CLI resume 读到 VS Code 改模型前的旧值（单向不共享） |
| manifest 死主清理 | `newSession` 传 `deletions`（2026-09-01 补，与 ensureActive deadParam 同型） | `newSlot` 同（2026-09-01 advisor round2） | 仅传 m 等于没删（条目级合并把磁盘死条目从 fresh 复活）——清理永不持久化 |
| `loadManifest` 容错 | `!m.slots` → `{}`（2026-09-01 补） | 原有 | 损坏的 `{}` manifest → `newSession` 抛 TypeError |
| 读校验顺序 | cwd 先行（"别人的文件不动"优先于结构校验，2026-09-01 补） | cwd 先行（原有） | 异 cwd + 坏 version 的文件被改名 .unreadable（违反"别人的文件不动"） |

> **新字段双端同步条款**：CLI `saveSession` 全量覆盖写、VS Code `saveLines` `...existing` 保留未知字段——两端字段集必须同步演进；任何一端新增槽内字段（如 activeModel/engineering）须在同一变更中落档本节并双端实现，否则 CLI 保存会静默删除 VS Code 侧新字段。

## 7. Issue 变更段（2026-08-22 · 需求层）

> 来源：Gitee #IK9UZ8。两端同修（CLI `src/generate-title.mjs` + VS Code `src/extension/generate-title.mjs`）；本文件为权威源，VS Code 端 `docs/design/ARCHITECTURE.md` 变更段引用（不复制）。

### IK9UZ8 · 思考型模型会话标题生成失败

**总体需求**：思考型模型（DeepSeek `thinking:{type:"enabled"}`、GLM 等）下会话自动标题生成成功。根因已验证：标题请求 `max_tokens: 30` 全部被 `reasoning_content` 消耗，`content` 为空 → 标题 null → 回退首条消息前 40 字（多个会话同名，无法区分）。

**功能性需求**：
- F1 使用思考型模型的用户，每个会话仍有自动标题，`/session` 列表可区分会话。
- F2 修复：标题请求**显式禁用思考**（OpenAI 兼容格式 body 加 `thinking:{type:"disabled"}`；provider 不接受的字段由其忽略）+ 提高 `max_tokens`（30→100，设计层定值）。
- F3 两端同修：CLI `generate-title.mjs`；VS Code `generate-title.mjs` 的 `requestTitle` 独立 fetch 不走 buildRequest 的 spec 思考注入，需在 body 显式处理。
- **范围边界**：标题规范（≤40 字符、无引号）与失败静默降级语义不变；anthropic/google 格式的思考型模型影响（设计层确认是否需要同样处理）。

**非功能性需求**：
- NF1 超时 10s、失败静默降级不变。
- NF2 成本：标题请求 token 上限适度，不随会话长度增长。

### IK9UZ8-D · 设计层

**方案**：标题请求显式禁用思考 + 提高输出上限；两端同修。已否决：从 `reasoning_content` 里提取标题——reasoning 是思考过程不是标题，读出的是推理片段而非标题文本；禁用思考后 content 正常返回，无需兜底读取。

**CLI `src/generate-title.mjs`**：
- body 增加 `thinking: { type: "disabled" }`；`max_tokens: 30` → `100`
- 读取逻辑不变（`choices[0].message.content`）；provider 不支持 thinking 字段的按未知字段忽略处理（OpenAI 兼容 API 惯例）
- **CLI 仅 OpenAI 兼容格式**：`generate-title.mjs` 单一 fetch 直拼 body（无 format 分派，无 anthropic/google 分支）——anthropic/google 格式标题请求仅存在于扩展端，CLI 侧无需对应处理

**VS Code `src/extension/generate-title.mjs` `requestTitle`**（其独立 fetch 不走 buildRequest 的 spec 注入，需显式处理）：
- openai 格式分支：body 加 `thinking: { type: "disabled" }` + `max_tokens: 100`
- anthropic 格式分支：`max_tokens: 30` → `100`（anthropic 扩展思考默认关闭，不传 thinking 即不思考，无需禁用字段）
- google 格式分支：`generationConfig.maxOutputTokens: 30` → `100`（thinkingConfig 不传即不思考）

**受影响文件**：`thincoder/src/generate-title.mjs`、`thincoder-vscode/src/extension/generate-title.mjs`、新增 `thincoder/test/generate-title.test.mjs`、修改 `thincoder-vscode/test/unit.test.mjs`（generate-title describe 内追加）。

**关键决策**：禁用思考而非提取 reasoning（见方案）；max_tokens 100 是 40 字符标题（≈60-80 token）的 2.5 倍余量，思考禁用后 30 也够，但 100 防御意外空转；标题规范（≤40 字符、无引号）与静默降级不变。

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | CLI：mock fetch，断言请求 body | body 含 `thinking:{type:"disabled"}` 且 `max_tokens:100`；返回正常 content → 标题提取正确 | F2 |
| T2 | CLI：响应 content 为空 | 返回 null（静默降级不变） | 边界 |
| T3 | CLI：HTTP 400 / 网络错误 | 返回 null，不抛出 | 错误条件 |
| T4 | vscode：mock fetch 断言 openai 分支 body | 含 `thinking:{type:"disabled"}` + `max_tokens:100` | F3 |
| T5 | vscode：anthropic 分支 body | `max_tokens:100`，无 thinking 字段 | 范围边界 |
| T6 | vscode：google 分支 body | `maxOutputTokens:100` | 范围边界 |
| T7 | 回归：标题 ≤40 字符截断、无引号 | 不变 | 范围边界 |


---

## 8. 会话恢复 provider/model 缺失 → 模型重选（2026-09-02，用户问题 Q1）

> **状态：已实现（2026-09-02）**。用户问题批 Q1（docs/TODO.md）：CLI 退出重进时，会话引用的 provider 或 model 已不存在 → 直接报错退出进不了 TUI；期望给用户界面重新选择模型。验收标准逐条核对通过（T1-T7 + T1b/T6b，`test/session.test.mjs` + `test/tui.test.mjs`）。

### 8.1 问题与根因

**症状**：会话保存时用了 provider A（如某个自定义 provider 或已删模型），重进时 config 里已无 A → CLI 报错退出。

**根因链**（代码已核；2026-09-02 实现时修正第 1 环——`findProvider` 实际是 **throw** 而非返回空对象）：

1. `loadConfig`（config.mjs 的 `runtimeProvider` 构造处——`findProvider(providers, activeProvider)`）：`activeProvider` 在 `providers[]` 不存在且名字非空 → **throw**（`activeProvider "ghost" not in providers list`）→ loadConfig 整体抛错 → `assembleAgent` 抛错 → bin 的 uncaughtException → 报错退出。**已修：loadConfig 对缺失 activeProvider 不再抛错**——runtimeProvider 置空对象 `{}`（不抛错但无 model/baseURL/apiKey），providers 列表与 activeProvider 原值保留；findProvider 的 throw 契约保留（advisor/run.mjs 等直接调用方仍依赖，integration-provider 测试断言不变）。
2. `assembleAgent`（make-agent.mjs 的 `provider.proxyUri` 注入处）：`provider = config.provider`（空对象）→ 后续 `provider.proxyUri` 赋值 OK（空对象可加属性）。
3. **崩溃点**：空 provider 流入 `runAgent` → `chat()` → `provider.model` undefined → body 缺 model → **网关 400**；或 `provider.baseURL` undefined → `fetch("undefined/chat/completions")` → **TypeError "Failed to parse URL"** → uncaughtException → 进程退出。TUI 首帧若解引用 `agent.provider.name` 同崩。
4. `applySession`（session.mjs 的 `if (p)` 回切分支）对不存在 provider **静默跳过**（`if (p)` 不成立 → return false）——**不报错也不纠正**，空 provider 继续流。

### 8.2 需求

- F1：会话恢复后若**当前 provider 无效**（会话与 config 的 activeProvider 均不存在，或 model 缺失）→ **不退出**，进入 TUI 后引导用户重新选择模型（复用既有 `/model` picker 机制）。**会话 provider 缺失但 config 有有效 provider → 静默用 config 的 provider（不弹重选——D-S3 优先级）**。
- F2：config 的 `activeProvider` 本身无效（无会话恢复场景，纯配置错误）→ 同样不退出，TUI 启动即弹选择。
- F3：无任何可用 provider → 明确提示（进入配置向导或提示 `/provider add`），不崩溃。
- F4：headless（`thincoder chat`）无 TUI → 报可读错误 + 退出码（不弹 UI）；`--auto` 场景同。

### 8.3 设计

**D-S1 启动前校验（bin/thincoder.mjs + make-agent.mjs + config.mjs）**：

- `loadConfig`（config.mjs）：activeProvider 缺失不再抛错（见 8.1 修正）——runtimeProvider 空对象，providers 列表保留。
- `assembleAgent` 后、`applySession` 前：校验 `agent.provider?.model` 与 `agent.provider?.baseURL` 存在；缺失 → 打标记 `agent._providerInvalid = true`（附原因 `_providerInvalidReason`：provider 不存在 / model 缺失 / 缺少 baseURL）——实现为 make-agent.mjs 导出的 `validateProvider(agent)`（幂等：有效时清标记），assembleAgent 末尾调用。
- **model 无效判据（评审 #1 修正）**：仅当 `provider.model` **为空/缺失**时判 invalid——**不得用 MODEL_SPECS 成员资格判无效**（未知模型 = 受支持场景，PROVIDER.md:84 "未知模型保守 128K + 警告"；自定义端点模型不在 MODEL_SPECS 是常态，误判会让自定义模型用户每次恢复都弹重选，违反 AC4 零回归）。
- 不抛错、不退出；空 provider 不再流入 runAgent——**TUI 路径在 startTUI 前清空无效 provider**（`agent.provider = null`），由 TUI 启动逻辑触发模型选择。
- **model 退役场景（评审 #2 修正）**：provider 存在但 `provider.model` 空（如 config 里 model 字段被删）→ 判 invalid 引导重选（默认选中该 provider 默认模型）。**MODEL_SPECS 未知不视为退役**——退役只能从"model 字段缺失"或"provider 自身消失"判断，客户端无法可靠区分"模型从 spec 表退役"与"自定义模型"（spec 表不是 allowlist）。
- **D-S3 补全（bin 复验）**：applySession 后若标记仍置位则复验一次 `validateProvider`——applySession 可能已用会话中的有效 provider 修复（config 无效 + 会话有效），修复后清除标记，仅当两者都无效才弹重选。

**D-S2 TUI 重选流程**（src/tui/index.mjs 启动 + pickers.mjs 复用）：

- `startTUI` 首帧前检查 `agent._providerInvalid`（或 `!agent.provider`）→ **先弹模型选择 picker**（复用 `openModelPicker`/`selectModel`，展示当前可用 providers）→ 用户选定后继续正常启动（`agent.provider` 已更新为有效值）。实现为 index.mjs 导出的 `promptProviderIfInvalid(agent, openModelPicker, pushLine)`。
- 选择取消（Esc）→ 仍进入 TUI（显示提示行"未配置有效 provider，可用 /model 选择或 /provider 配置"）——**绝不因无 provider 拒绝进入**。提示行后 showStartup 的既有 no-key 触发条件（`!agent.provider?.apiKey`，已加 `?.` 守卫）会让 wizard 弹出——其 provider 菜单列出已存在 providers（可选中恢复）与 presets，符合 F3"进入配置向导或提示"；空 provider 下渲染路径（renderHeader/renderStatus 的 `agent.provider?.model`）已加可选链守卫，屏幕不再冻结。
- `/model` 在无有效 provider 时行为不变（picker 列出可用项）。

**D-S3 会话恢复与 provider 缺失的优先级**：

- 若会话的 `activeProvider` 无效但 config 的 `activeProvider` 有效 → **用 config 的有效 provider**（会话切换失败 = 静默保持现状，已有行为）——仅当**两者都无效**才弹重选。
- 会话的 `activeModel` 无效（provider 存在但模型退役）→ 弹重选（默认选中该 provider 的默认模型——`selectModel` 现成行为）。

**D-S4 headless**（F4）：`thincoder chat` 路径（bin/thincoder.mjs 的 chat 命令分支）遇无效 provider → `console.error` 可读消息（"会话引用的 provider 'X' 不存在，请运行 thincoder 进入 TUI 重新选择，或编辑 config.json"）+ `exitSoon(1)`——不弹 UI、不崩溃（明确退出码）。

### 8.4 测试

**受影响文件**（实现后勾销）：`src/config.mjs`（loadConfig 对缺失 activeProvider 不抛错）、`bin/thincoder.mjs`（tui/chat 两路径的启动校验接入 + applySession 后复验）、`src/cli/make-agent.mjs`（assembleAgent 后校验点 `validateProvider` + `_providerInvalid` 标记）、`src/session.mjs`（applySession 不变——校验在调用侧）、`src/tui/index.mjs`（startTUI 首帧检查 + 弹选择，`promptProviderIfInvalid`；设计稿的 `src/tui.mjs` 是 re-export hub，实现落在 index.mjs）、`src/tui/startup.mjs` + `src/tui/render-frame.mjs`（空 provider 渲染守卫——T7 必需）、`src/tui/pickers.mjs`（复用 openModelPicker/selectModel——无导出改动，仅调用）、`test/session.test.mjs`（**新增**，T1-T7 + T1b/T6b 恢复场景）、`test/tui.test.mjs`（T2 启动弹选择 + T7 取消）、`docs/design/SESSION.md`（本节）、`CHANGELOG.md`（父代理统一更新）。

| # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T1 | 会话+config 均无此 provider | mock：会话 activeProvider="ghost"；config.activeProvider="ghost"（均不存在） | 启动不退出；`agent._providerInvalid=true`；TUI 首帧弹模型选择 | F1/D-S1 |
| T1b | 会话 provider 缺失 + config 有效（D-S3 静默分支） | 会话 activeProvider="ghost"；config.activeProvider="deepseek"（有效） | 不弹重选；静默用 config 的 provider；`_providerInvalid` 不置位 | F1/D-S3 |
| T2 | config activeProvider 无效 | config activeProvider 指向不存在 provider | 启动不退出；`_providerInvalid=true`；TUI 首帧弹模型选择 | F2/D-S1 |
| T3 | 无可用 provider | providers 为空 | 明确提示（向导/提示行），不崩溃 | F3/D-S2 |
| T4 | headless | `thincoder chat "x"` + 无效 provider | 可读错误 + 退出码 1，无 UI | F4/D-S4 |
| T5 | 会话 provider 有效 | 正常恢复 | 行为不变（回归） | D-S3 |
| T6 | activeModel 缺失（model 字段被删） | provider 存在但会话 model 为空 | 弹重选，默认该 provider 默认模型 | F2/D-S1 |
| T6b | 自定义模型（MODEL_SPECS 未知） | provider.model="my-custom-model"（不在 MODEL_SPECS） | **不判 invalid**；正常恢复不弹重选（评审 #1 回归） | F2/D-S1 |
| T7 | 选择取消 | 弹 picker 后 Esc | 仍进 TUI + 提示行，不退出 | D-S2 |

**验收**：AC1 = 任意无效 provider/model 场景 CLI 不再崩溃退出（T1-T4）；AC2 = TUI 内可完成模型重选（T1/T2/T6）；AC3 = headless 明确报错+退出码（T4）；AC4 = 正常恢复零回归（T5）+ CLI 全量 + lint 绿。

### 8.5 关键决策

- **清空而非修补空 provider**：空对象 `{}` 流入下游是崩溃源——检测后置 `null`，让 TUI 选择流程从干净状态开始（避免"半有效 provider"的隐晦错误）。
- **校验点收敛到 assembleAgent 之后**：一处检测覆盖 TUI/chat 两路径（F1-F4 同源）；不散落多处判断。
- **loadConfig 不抛错而非容忍 throw**（2026-09-02 实现修正）：findProvider 的 throw 击穿 loadConfig → assembleAgent，TUI/chat 都进不来——校验点无从执行；改在 loadConfig 调用侧捕获（runtimeProvider 空对象），findProvider 的 throw 契约保留给直接调用方（advisor）。
- **复验而非二次校验点**：applySession 可能用会话中的有效 provider 修复 config 的错误（config 无效 + 会话有效）——bin 在 applySession 后复验同一 `validateProvider`（幂等清标记），维持"仅两者都无效才弹重选"（D-S3）而不散落新判据。
- **Esc 后渲染守卫**：provider=null 时 renderHeader/renderStatus/showStartup 的解引用必须可选链（否则 T7"仍进 TUI"在首帧即崩/冻结）；showStartup 的 no-key 触发会带出 wizard（其菜单列出已存在 providers，可选中恢复——符合 F3，非拒绝进入）。
- **否决**：a) 启动即退出并打印"请编辑 config"（用户已明确要 UI 重选——体验差）；b) 静默回退到第一个可用 provider（用户可能 unaware 换错模型——必须显式选择）；c) 自动用 config.activeProvider 覆盖会话 provider（用户上次明确选的模型不能静默丢）。


## 9. 消息时间戳 + read_history 会话查询工具（2026-09-03 · 用户补救拍板——需求层 + 设计层）

> 状态：设计批准（2026-09-03 round1 通过——0🔴——9 refinement 处置注见 §9.5——designToken 已签发）。触发：用户补救拍板——"① 会话消息加上时间戳；② 工具里加一个查会话历史的工具，应该能够查找筛选过滤"（教训源：advisor 并行取证困境——会话消息无 ts——历史无法回溯工具执行时序——只能靠 UI 观察）。用户裁定：read_history 带时间窗（since/until——配合 ts 新能力——取证完整）。

### 9.1 需求

- F-S1：**消息级时间戳**——每条消息落对象时打 `ts`（epoch ms——UTC）——历史可回溯执行时序（工具何时调用/结果何时落）
- F-S2：**read_history 工具**（模型工具面——readonly）——查本会话历史——筛选过滤：role/keyword/tool/**since/until（时间窗）**/limit/direction
- F-S3：旧消息（无 ts）容忍——读取/恢复/渲染零变化——时间窗只匹配有 ts 消息（无 ts 显示无时间戳标记）
- F-S4：两端一致（消息格式契约两端共享——read_history 工具两端注册）

### 9.2 设计

**D-S1 消息 ts——pushReal 单点**：`context.mjs pushReal(agent, msg)`（L171——唯一消息入口——_fullHistory + history 同 push）内统一：`if (msg.ts === undefined) msg.ts = Date.now()`——所有调用点（agent.mjs 的 user/assistant/tool 消息/record-results）自动带 ts——**一处改全生效**。
- 压缩重建注入消息（applyCompression L187-189 手写 note/Understood 对象——不经 pushReal）——同规则补 ts（Date.now()——压缩时刻）
- 恢复路径（startup 从存档读入 history）——旧消息无 ts——**不补**（补近似值误导取证——D-S3 容忍）
- 渲染/上下文零变化（ts 是附加字段——**发送层消息字段白名单——ts 不进 provider 请求**——实现时自查 core.mjs 消息发送形态——防多余字段污染请求）

**D-S2 read_history 工具**（新 `src/agent-tools/read-history.mjs`）：
- 描述：查本会话消息历史（_fullHistory——压缩不丢——审计完整）——回忆之前说过/做过的事（决策/工具时序/过去裁定）——筛选：role/keyword（content 子串）/tool（工具消息 name）/since/until（epoch ms——配合消息 ts）/limit（默认 50——上限 200）/direction（oldest/newest——默认 newest）——返回匹配消息含 ts——内容逐条截断（~500 字符 + truncated 标记——全文看会话文件）
- 数据源：`agent._fullHistory`（全量）——readonly: true（planMode 放行/免审批/explore 只读集自动）
- 返回：JSON 数组——{ts, role, name?, tool_call_id?, content 截断, tool_calls 概要（assistant——工具名列表不展开 arguments）}
- 注册：agent-tools.mjs 聚合 + setup.mjs——**depth-0 only**（子代理各自上下文——查父历史语义混淆——保守——评审定）
- VS Code 镜像（两端同批——agent 结构同）

**D-S3 兼容**：旧存档/旧消息无 ts——读取容忍（session-io 不动）——saveSession 序列化原样（有 ts 的带出）——恢复后 ts 保留——read_history 无 ts 消息：不匹配时间窗 + 返回 ts: null 标记

### 9.3 测试（用例表）

| # | 场景 | 输入 | 预期 | 映射 |
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
| T-S11 | depth 门 | 子代理内调 | 拒绝/不可用 | D-S2 |

**验收**：AC-S1 = 全消息带 ts（T-S1——含压缩注入）；AC-S2 = read_history 筛选面全生效（T-S4..S8）；AC-S3 = 兼容与零污染（T-S2/S3）；AC-S4 = 两端（VS Code 镜像测试）

### 9.4 受影响文件

| 端 | 文件 |
|---|---|
| CLI | `src/context.mjs`（pushReal 加 ts + applyCompression 注入补 ts）、新 `src/agent-tools/read-history.mjs`、`src/agent-tools.mjs`（聚合）、`src/agent/setup.mjs`（depth-0 注册）、发送层自查（core.mjs 消息字段剥离——若需）、新 `test/read-history.test.mjs` + context 相关测试、SESSION.md 本节 |
| VS Code | 同构镜像（pushReal 对应 + read-history 工具 + 测试） |
| 文档 | SESSION.md（本节权威——v2 双线结构 §3 消息格式同步补 ts 字段）、两端 AGENTS 模块表 |

**今日场景价值**：ts 落盘后——4 advisor 时序取证 = `read_history tool=advisor since=<评审开始>`——各 tool 消息 ts 一目了然——串行/并行硬数据（不再靠 UI 观察或猜测）。


### 9.5 round1 评审处置（2026-09-03——0🔴 通过——9 项）

1. **depth 门裁决 (b)**：保持 depth-0 only——"今日场景价值"改写 = **主代理取证**（主代理 read_history tool=advisor since=… 拿时序——附 advisor 评审上下文——advisor 不自查父史——D-S2 语义自洽）
2. **行号 → 符号锚**：D-S1 改 pushReal(agent, msg)（context.mjs）+ applyCompression 注入点——去 L171/L187-189
3. **跨文档同步（实现时确认）**：ARCHITECTURE.md §双结构消息形态 + TOOLS.md 工具目录——ts 字段/read_history 条目同批落——单源纪律
4. **AC-S5 补**：治理面 = readonly 放行（T-S9）+ depth 门（T-S11）+ 压缩后 _fullHistory 全量可查（T-S10）
5. **since/until 语义**：inclusive-inclusive（ts == since/until 边界含）——since > until → 空结果——limit > 200 钳制 200——T-S6 补边界用例
6. **T-S1 非递减**：同 ms 相等 ts 合法（Date.now() 分辨率）——排序按数组序（ts 仅过滤不重排）
7. **措辞收窄**：AC-S1 = 双线真实消息（pushReal）+ 压缩注入带 ts——机读（[System reminder:）/瞬态消息无 ts 属设计（D-S3 容忍）
8. **multimodal content 数组**：keyword 匹配文本 part（数组串化摘要）——截断按文本——补 multimodal 用例
9. **UI 显示**：ts 仅 read_history 输出/会话 JSON 可见——TUI/VS Code 显示不在本 scope——后续立项（用户确认中）

