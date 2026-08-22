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
| `slotSessions` 认领表 | `ensureActive` 按优先级认领：当前 active 空闲 → 首个空闲槽 → 全被活进程占用时开新槽 |
| `isProcessAlive(pid)` | Windows `tasklist` / Unix `kill(pid,0)`——死进程的槽位可回收复用 |
| 原子写 | `writeSessionFile`：先写 `.tmp` 再 rename（跨盘失败降级 unlink+rename → 直写）；防中途崩溃产生截断 JSON |
| `.corrupted` 兜底 | 读失败的文件改名 `.corrupted` 保留现场，不覆盖 |

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
  "display":        [ /* TUI 显示行快照（WYSIWYG 恢复优先用） */ ],
  "tasks": [], "planMode": false, "autoApprove": false,
  "engineering": false, "engDesignToken": null, "goal": null,
  "advisor": { /* advisor 配置快照 */ },
  "pendingReminders": [], "sessionStart": 1754200000000
}
```

**双线写入契约**（详见 ARCHITECTURE.md §双结构 + CONTEXT-COMPACTION.md）：
- 真实消息（用户输入/assistant 回复/tool 结果/多模态图像）走 `pushReal` → 同时进 `history`（人读）与 `contextHistory`（机读）
- 机读消息（`[System reminder:`、`[User interrupt:`、压缩 note、task/plan 回注）只进 `agent.history`，**不进人读线**
- **transient 消息（编辑器上下文注入等）落盘时过滤**（`saveSession` 的 `!m.transient` + legacy 前缀清理 `LEGACY_TRANSIENT_PREFIXES`）

## 4. 保存与恢复

**saveSession(agent, display)**：`history = (_fullHistory ?? history).filter(非 transient)`、`contextHistory = agent.history.filter(非 transient)` → 写 active 槽 + 更新 manifest 摘要（`slotDigest`：messageCount/turnCount/firstMessage/activeProvider/title）。TUI 在每次回合结束增量保存（agent-turn finally），崩溃最多丢半轮。

**loadSession(cwd)**：读 active 槽（`.tmp` 备份优先回退）→ legacy 兜底 → 全部失败返回 null。

**applySession(agent, data)** 恢复语义：
```
人读线  _fullHistory ← data.history
机读线  agent.history ← data.contextHistory（缺失/为空才回退 history 播种）
title/tasks/planMode/autoApprove/goal/pendingReminders/sessionStart/advisor ← 对应字段
activeProvider ≠ 当前 → 按名切回 provider（找不到不回切）
_compressFailures/_verifyRetries 重置
```
**机读线必须从 contextHistory 恢复**而非从完整 history 重建——后者会把已压缩的中间过程塞回上下文（实测 prompt 膨胀到 283%）。`compactThresholdAuto` 时按恢复后的模型重新推导阈值（bin/thincoder.mjs）。

## 5. 切换与归档

- `/new`（`newSession`）：分配新槽并认领（manifest 指针切换，不复制文件）
- `/session`（`listSlots`）：按 updatedAt 降序列出全部槽位元数据
- `/session N`（`switchToSlot`）：只改 manifest 指针，**无文件拷贝**，返回新会话数据
- 删除：`deleteSlot` 删文件 + 清 manifest 条目（保留至少一个槽）
- 退出不归档：`/exit`/Ctrl+C 只保存当前槽——避免"打开关掉就塞满槽位"

## 6. 与 VS Code 的契约对齐点

| 契约 | CLI | VS Code |
|---|---|---|
| cwd hash | 40 位 sha1 + 盘符大写 | 同（session-io.mjs 同实现） |
| 槽位认领 | slotSessions + isProcessAlive | 同（面板绑槽后固定） |
| 双线落盘 | `history` + `contextHistory` | `saveMessages(msgDir, name, messages, contextHistory)` 同字段 |
| 旧格式回退 | 无 contextHistory → 从 history 播种 | 同（`contextHistory: null` → 播种） |
| transient 过滤 | saveSession 过滤 | `_saveLines` 落盘过滤（2026-08 修复） |
| 字段往返 | 全量覆盖写 | `...existing` 展开保留未知字段（activeModel/engineering 等） |

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
