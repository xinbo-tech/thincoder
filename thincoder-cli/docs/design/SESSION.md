# Session 持久化设计

> 板块：会话存储。状态：**当前态规格**（2026-09-07 重写为人类可读版——DOC-REWRITE 批 A；历史变更流水折叠见下方「变更记录」）。**本文件为 CLI 会话/存储权威**——写错影响存储恢复机制。
> CLI 与 VS Code 共享同一存储契约：文件格式、槽位认领、双线字段、并发防护全部一致（VS Code 侧为镜像实现，见下）。
> 权威源（CLI）：`thincoder-core/session.mjs`（saveSession/applySession/loadSlotFile 主体）、`thincoder-core/session-slots.mjs`（槽位/manifest/认领/resumeSlot/end marker primitives）、
> `thincoder-core/session-rename.mjs`（renameSlot——标题写契约）、`thincoder-core/session-gc.mjs`（残留 GC + 冷 cwd）、`thincoder-core/session-migrate.mjs`（旧短 hash 一次性迁移）。
> 装配（CLI）：`bin/thincoder.mjs`（启动恢复 + 钉 `_slot`）、`thincoder-core/context.mjs`（pushReal——消息入线 + ts 打点）、`thincoder-core/agent-tools/read-history.mjs`（read_history 工具）。
> 权威源（VS Code 镜像——同契约）：thincoder-vscode `src/extension/session-io.mjs（VSC 仓）`（读写双线）、`session-slots.mjs`（槽位/认领/marker）、`session-gc.mjs`、`session-slot-write.mjs`；装配：`panel-session.mjs` / `panel-project.mjs` / `panel-messages.mjs`。
> 关联：ARCHITECTURE.md（双结构）、CONTEXT-COMPACTION.md（压缩/机读线）、MULTI-INSTANCE-COLLAB.md（本存储层为其上游基建）、TOOLS.md（read_history 工具面——语义权威 = 本文件 §9/§13）。
> 章节号 §1-§13 沿用原档案序号（外部文档与代码注释引用稳定），内容已按机制重组为当前态。

## 变更记录

- 2026-08-22（IK9UZ8——原 §7 整节折叠）：思考型模型会话标题生成失败修复——标题请求显式禁用思考 + `max_tokens` 30→100，双端同修（机制见 §7）。
- 2026-09-02（用户问题 Q1——原 §8 流水折叠）：会话恢复时 provider/model 已不存在不再崩溃退出——loadConfig 不抛错 + `validateProvider` 标记 + TUI 弹模型重选（机制见 §8）。
- 2026-09-03（§9——9.3 测试表/9.4 受影响文件/9.5 评审处置折叠；9 项处置已并入机制文）：消息 ts（pushReal 单点打点）+ read_history 工具，双端实现。同批登记 R19 跨会话检索立项（→ §13）。
- 2026-09-05（R4——§10.3-10.6 折叠）：端分离恢复 end marker，双端同批实现——评审 5 项建议全采纳、验收 AC1-AC6 勾销、实现偏差 4 项申报核销（机制见 §10）。
- 2026-09-06（R5/R8/R9/R11 家族 + R12 同批——§11.2 折叠）：每回合 env-state transient reminder 注入，双端实现——验收 AC1-AC7 勾销；移交父侧 3 项记录在案（detectRestoredSession 闸语义、git 富注入异步化、VS Code discipline.md `action:'check'` 引用属并行批次镜像面遗漏）（机制见 §11）。
- 2026-09-06（§12——12.6/12.8 核销折叠；12.7 legacy v1 扩展同批实现）：会话目录残留 GC + 标题写契约 `{ok, reason}`，双端实现；裸 v1 `{hash}.json` 纳入冷 cwd 删除集（用户裁决）（机制见 §12）。
- 2026-09-06（R19——§13.3 测试表折叠为验收方向）：跨会话历史检索设计落节——read_history 加 path/cwd 参数 + 检索族消歧总纲；round1 评审 1🔴+6🟡+3🔵 全采纳——**复审发起权在用户**（设计见 §13）。
- 2026-09-07：本文档重写为当前态——格式正常化（无 >300 字符行、markdown 结构修正）、历史变更流水账折叠为本记录；活机制正文与逐字契约未改。
- 2026-09-10（MODEL-SELECTION 批——连带改写）：§8 D-S1「无效」判据收窄（不含"候选外"）/ D-S2 候选改运行期拉取 / D-S3 兜底改渠道默认单值——机制权威见 `PROVIDER.md` §16。
- 2026-09-11（MODEL-SELECTION 批——修正轮）：§8 D-S1 叙述措辞改用「候选成员校验」表达（R8 目标态自检配套——语义不变、被扫字面量清零）。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批）：新增 §14（长会话记录内存有界——磁盘为准 + 内存窗口：段存储 /
  选型四表 / 契约 / 决策 D-R1–D-R8 / 受影响文件 / 用例 T-RS1–T-RS11 / AC-RS1–AC-RS10 / VSC parity
  评估 / 物证回填钩）；需求 = `../requirements/SESSION.md` §14.1；批次档
  `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md`。**§3.2/§4.1/§4.3 的「人读线全量」按 §14 修订为
  「记录/落盘全量 + 内存窗口」**（正文对应段落以 §14 为准，语义面见 §14.3.5 数据流）。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批·设计评审轮次 1 修正轮——12 条全落；本节 #1/#4/#5/#6/#7/#8 +
  #12）：§14 sidecar 会话身份锚（`meta.identity` / bind 先验身份 / 轮转联动 / 孤儿拒采纳——#1）·
  `store.page` ±1 页沿 + 恢复描述符 `{history,total}` 与标签口径（#4）· read_history 匹配面 delta
  登记（#5）· 追加失败降级语义（失败即停/追赶/标记/重建——#6）· 受影响表补 session-slots /
  session-guard + 行数实测刷新（#7/#12）；需求档 F-S2 范围注 / F-S4 delta 同步（§14.1）。
- 2026-09-12（TUI-OOM-ROOTCAUSE 批·实现后同步）：§14.3.6 恢复描述符句按实载校准——实载 `{ history
  （≤201 = 尾窗 200 + ±1 页沿头一条）, total, base }`、单源 `sessionDescriptor()`（`src/session.mjs:69-78`）、
  `base` = `history[0]` 绝对序号（渲染起点；缺省 `total − len` 推导）、翻页锚复用 `state._historyTotal`
  （`_historyAnchor` 未落地——不新增状态位）；§14.5 表补 `session-segments.mjs`（交付 101——按职责拆分
  产物）行 + `session-store.mjs` 交付 442 行越 300 咨询线登记（不拆——新增档口径）。纯实现态对齐、零语义变更。

---

## 1. 存储模型

- **按 cwd 隔离**：会话目录 `~/.thincoder/sessions/{sha1}.json.*`——cwd 的 **40 位完整 sha1**（非截断）。
- **Windows 盘符大写归一化**：CLI `process.cwd()` 与 VS Code `uri.fsPath` 算出的盘符大小写不同，归一化保证两端得到同一 hash。
- **槽位制，无"当前文件"**：`{hash}.json.N` 是第 N 个槽位的完整会话；`{hash}.json.manifest` 存槽位元数据 + active 指针 + 进程认领表 `slotSessions`。
- **active = 共享当前指针**（2026-09-05 §10 D-6 修订——**不是"当前会话"**）：旧版端/ACP 的恢复依据 + 无记录端的一次性继承源 + 列表回退高亮；**本端恢复依据 = §10 的 end marker**（`{manifest}.cli|.vscode`，各端单写者），不再以 active 为第一依据。setActive 纪律（认领/新建/切换/删除）原样保留。
- **文件无上限**：槽位按需递增（`/session` 查看/切换，`/new` 开新槽）。
- **旧格式迁移**（`src/session-migrate.mjs`——从 session.mjs 拆出）：12 位短 hash（CLI 历史 `sha1(cwd).slice(0,12)`；VS Code 历史 16 位）文件**一次性**重命名为 40 位（幂等、首次访问时执行，两端算法历史兼容）；legacy `{hash}.json`（v1 单会话）读取时迁移进槽位。

目录形态：

```
~/.thincoder/sessions/
  {hash}.json.N                    # 槽位会话文件（N 从 1 递增）
  {hash}.json.manifest             # 槽位元数据 + active 指针 + slotSessions 认领表
  {hash}.json.manifest.cli|.vscode # 本端记录 end marker（§10——各端单写者）
  {hash}.json                      # legacy v1 单会话（读取时迁移进槽位）
  {hash}.json.*.tmp / .corrupted / .unreadable / .bak-* / .manifest.corrupted  # 写入与损坏现场（§2.2 / §12）
```

## 2. 并发安全（CLI ↔ VS Code 双进程）

### 2.1 认领与属主

- **sessionId**：每进程唯一 `pid-timestamp-random`，作为 manifest `slotSessions` 的认领值。
- **ensureActive 认领序**：① 当前 active 空闲 → ② **文件缺失的空槽号**（不认"最小空闲号"——死主的旧槽文件仍在，会 resume 进陌生会话且退出时覆盖）→ ③ 全被活进程占用时开新槽（新号从 max+1 起，跳过活认领号/现存文件号；max 取 `allSlots[last]` 而非 `Math.max(...)` spread——数万槽位时 RangeError 风险）。
- **死主条目清理**：`ensureActive` 开头删除 owner 已死的 `slotSessions` 条目。纪律：
  - 死主判定必须跑 `isProcessAlive`——**不能以"文件缺失"短路**：活进程在"认领→首次保存"窗口文件暂缺，误删会致双进程同槽；
  - 清理落盘**必须传 `deletions` 参数**（ensureActive 全部早退路径 + 分支 1/2/3）——saveManifest 条目级合并会把磁盘上仍存在的死条目从 fresh 复活回写，仅传 m 等于没删；
  - `deadParam` 按调用时状态过滤刚重新认领的槽，避免删掉自己的新属主。
- **isProcessAlive(pid)**：Windows `tasklist /FO CSV`（PID 列精确比对）/ Unix `kill(pid, 0)`——死进程的槽位可回收复用。ensureActive 因 slot 粘性每进程只触发几次，全量 tasklist 成本可接受。
- **slot 粘性**：`saveSession` 首次认领后缓存 `agent._slot`，**永不重跑** ensureActive（原实现每次保存重推——manifest active 被并发方翻动时会话静默迁移 → 双副本/覆盖他人）；`applySession` 清空缓存（切换后重新认领）；ACP 加载路径显式钉回目标槽。
- **ACP 同进程多会话**：`getSessionId()` 是进程级、`_slot` 是 agent 级——粒度错配曾使同进程两会话互相视为"自己"（同槽互旋 / 同槽 load 两次静默互覆盖）。现：
  - `session/new` 立即 `newSession()` 钉独立槽；
  - load/resume 钉槽前查 `sameProcessPinned`（sessions Map 内其他 session 已钉同槽则占用）→ `newSession` 显式 fork 新槽；
  - **绝不 `_slot = null` 等下次保存**（`saveSession → activeSlot → ensureActive` 分支 1 早退 `slotSessions[active] === mySessionId` 同进程恒真 → 落回同进程 active 槽即他人槽）；
  - `session/delete` 删非 active 槽时，在存会话同型立即 `newSession` 重钉（同族残留防护）。
- **slotOccupancy**：目标槽是否被**另一活进程**占用（`/session` 切换提示、ACP 钉槽前检查）——**排除本进程属主**（`owner === getSessionId()` → 视为空闲，重选当前槽不误报）；同进程双会话防护由 `sameProcessPinned` 承担。

### 2.2 写盘防护

- **原子写**：`writeSessionFile` 先写 `.tmp` 再 rename（跨盘失败降级 unlink+rename → 直写）——防中途崩溃产生截断 JSON。
- **`.corrupted` 兜底**：读失败的文件改名 `.corrupted` 保留现场、不覆盖；**损坏的 manifest 同样改名 `.manifest.corrupted` 保留**——否则覆盖后全部槽位元数据丢失，`/session` 列表变空。
- **`.unreadable` 保留**：version/cwd/history 结构校验失败不再静默返回 null（否则新会话首次保存覆写旧文件）——改名 `.unreadable` 保留现场；**version > 2 的新版文件不动**；cwd 不匹配（别人的文件）也不动。
- **覆盖防护（.bak 轮转）**：`saveSession` 写前校验目标槽的 `sessionStart` 与本进程不符 → 先 rename 为 `.bak-{ts}` 再写（11311 条历史被新进程覆盖的实锤场景）；**version > 2 的文件无论 sessionStart 一律轮转**（loadSlotFile 对 v3 返回 null 不动，若其 sessionStart 为 null 旧版首次保存会静默覆盖）；轮转路径经返回值透出；检查按 mtime 缓存避免每次保存全量解析。
- **saveManifest 条目级合并**：写前重读按**条目级**合并（`{...fresh.slots, ...m.slots}`，slotSessions 同理）防丢失更新。纪律：
  - **删除意图经 `deletions` 参数显式表达**（deleteSlot、死项清理）——否则条目级合并把磁盘死条目从 fresh 复活回写；
  - **active 是单值**——只有显式翻指针的调用点（ensureActive 分支、newSession、switchToSlot、deleteSlot 删到 active）传 `setActive`；其余调用点（saveSession/ACP 认领）默认保留磁盘 fresh.active——否则毫秒窗口内回滚并发方刚翻的指针。

并发场景：CLI 与 VS Code 同时打开同一项目——各认领不同槽位互不覆盖；`/session` 与面板会话列表看到的 active 指针一致（切换持久化到共享 manifest）。

## 3. 会话文件内容（v2，双线结构）

### 3.1 文件结构

```jsonc
{
  "version": 2,            // 格式版本（1 = 旧单线；2 = 双线；>2 的新版文件只读不动）
  "cwd": "D:\\teamcode",   // 会话目录（hash 依据；恢复校验"是不是别人的文件"）
  "title": "…",            // 会话标题（/session 列表显示）
  "activeProvider": "deepseek",   // MODEL-MERGE-SESSION 槽双字段恒非空（有渠道即携带具体复合值——
  "activeModel": "deepseek-v4-pro", // 恢复按槽值——不看 config（defaultModel 只是新会话起点））
  "updatedAt": 1754200000000,  // epoch ms
  "history": [ /* 人读线：完整真实消息（UI 渲染 + resume 显示读它；运行期不压缩——落盘瘦身见 §3.3） */ ],
  "contextHistory": [ /* 机读线：可能已压缩的模型上下文（恢复后保留压缩收益——与 provider 前缀缓存逐字节一致） */ ],
  "tasks": [],
  "planMode": false,
  "autoApprove": false,
  "engineering": false,
  "engDesignToken": null,
  "goal": null,
  "advisor": { /* advisor 配置快照 */ },
  "pendingReminders": [],
  "sessionStart": 1754200000000  // 会话开始打点（setup.mjs 赋一次——覆盖防护依据 §2.2）
}
```

### 3.2 双线写入契约

双线语义权威：ARCHITECTURE.md（双结构）+ CONTEXT-COMPACTION.md（压缩）。

- **真实消息**（用户输入/assistant 回复/tool 结果/多模态图像）走 `pushReal` → 同时进 `history`（人读）与 `contextHistory`（机读）。
- **机读消息**（`[System reminder:`、`[User interrupt:`、压缩 note、task/plan 回注）只进 `agent.history`（机读线）——**不进人读线**。
- **transient 消息**（编辑器上下文注入等）：**人读线（history）落盘时过滤**（`saveSession` 的 `!m.transient` + legacy 前缀清理 `LEGACY_TRANSIENT_PREFIXES`）；**机读线（contextHistory）保留**——恢复必须逐字节重建 provider 前缀缓存所见的序列；丢 transient 会让每次重启在首个注入位漂移 → 首请求整前缀缓存 miss。

### 3.3 slimForDisplay（人读线落盘瘦身）

`saveSession` 写盘时对 `history` 做 **copy-on-write 映射**（**绝不原地改**——两线经 pushReal 共享对象引用，原地改会污染机读线与 provider 前缀缓存）：

- `assistant.tool_calls[].function.arguments` 截 300 字符（head + `…`）
- `tool` 消息 content 截 500 字符（head + `… (truncated for storage)`）
- 多模态 user content 数组：保留 text part，**丢弃 image_url base64 part**（显示只需 text；模型侧图像由 multimodal 通道承载）
- **`contextHistory` 一字不动**——机读线保持与 provider 前缀缓存逐字节一致（strict pairing/多轮看图全靠它）。实测 18MB 会话重存后大幅缩水（base64 + 工具结果正文占大头）

VS Code 端同款落地（session-io.mjs 同款 `slimForDisplay`）——两端写出的会话文件一致瘦身；vscode 的 historyWindow 只渲染字符串 content，瘦身后显示安全。

### 3.4 消息时间戳 ts（§9 权威）

- 每条**真实消息**带 `ts`（epoch ms——pushReal 落对象时刻，单点打点）。
- 压缩重建注入的 note/"Understood" 同刻打点（`Date.now()`——压缩时刻）。
- **旧消息（恢复自存档）不补 ts**——补近似值误导取证。
- `slimForDisplay` copy-on-write 保留 ts。
- ts 是**本地字段**：发送层剥离（`stripLocalMessageFields`——ts/transient 同规则，不进任何 provider 请求）；UI 不渲染（仅 read_history 输出/会话 JSON 可见）。

## 4. 保存与恢复

### 4.1 保存 saveSession(agent)

- `history = (_fullHistory ?? history).filter(非 transient + 非 legacy-transient)`；`contextHistory = agent.history.filter(非 legacy-transient)`（**机读线保留 transient**——逐字节重建前缀缓存的依据）。
- 写 `agent._slot`（粘性缓存，首次认领——见 §2.1）槽 + 更新 manifest 摘要（`slotDigest`：messageCount/turnCount/firstMessage/activeProvider/title）。
- 返回轮转的 `.bak` 路径或 null（§2.2）。
- `display` 参数已废弃——TUI 恢复始终从 history 重建。
- 增量保存：TUI 在每次回合结束保存（agent-turn finally）——崩溃最多丢半轮。

### 4.2 恢复入口

- **启动恢复**（TUI）：`resumeSlot(process.cwd())`（§10 D-2/D-3——三支决策 + 认领 + 写本端 marker）→ `applySession` → `agent._slot = slot`（首保存钉回恢复槽——闭合首保存迁移窗口，见 §10 D-3）。headless `thincoder chat` 不恢复（现状）。
- **loadSession(cwd)**：兼容包装（签名不变——测试兼容），数据层 = resumeSlot（legacy 单文件兜底；全部失败返回 null）。
- **loadSlotFile(cwd, slot)**：**无认领副作用**的槽文件读取器——`/session N` 切换、ACP `session/load`、恢复读槽共享同一校验（version 1/2 + history 数组 + cwd 匹配）：
  - 结构不符 → 改名 `.unreadable`（保现场）；
  - 解析失败 → `.tmp` 备份优先回退；回退成功则 `.tmp` 提升为正主（损坏主文件改名 `.corrupted` 保留）；
  - **主文件缺失时恢复孤儿 `.tmp`**（rename 前崩溃现场）。

### 4.3 applySession(agent, data) 恢复语义

```
人读线 _fullHistory ← data.history
机读线 agent.history ← data.contextHistory（缺失/为空才回退 history 播种）
title/tasks/planMode/autoApprove/goal/pendingReminders/sessionStart/advisor ← 对应字段
activeProvider ≠ 当前 → 按名切回 provider（找不到不回切）
_compressFailures/_verifyRetries 重置
_slot/_slotMtime 清空（切换后保存重新认领 manifest active——防落错槽）
```

- **机读线必须从 contextHistory 恢复**而非从完整 history 重建——后者会把已压缩的中间过程塞回上下文（实测 prompt 膨胀到 283%）。
- `compactThresholdAuto` 时按恢复后的模型重新推导阈值（bin/thincoder.mjs）。
- **v1 老文件（无 contextHistory）回退播种时剥离被 slimForDisplay 截断的 `tool_calls.arguments`**：以 `…` 结尾 → 置 `{}`——截断可劈断 `\uXXXX` 产生 400 毒载荷。

## 5. 切换与归档

### 5.1 /new（开新会话）

`newSession` + `resetSessionState`：

- 分配新槽并**立即记录所有权**（slotSessions——防并发方认领）；选号跳过 manifest 条目 / 现存文件 / 活认领号（`existsSync` + `liveClaimed`）。
- 开头清理死主条目（死主且文件缺失的槽号连 `m.slots` 条目一并删、回收复用——与 ensureActive 分支 2 语义对齐）。
- `resetSessionState` 清空：`_fullHistory` / `title` / `_sessionStart` / `_engDesignToken` / 压缩与验证计数 / `tasks` / `planMode` / `goal` / `reminders` / `_slotMtime` / `_slot` **以及进程级注入标志 `_osReminderInjected` / `_restartReminderInjected` / `_lastEngState`**（不清则 /new 后新会话永不注入 OS/cwd reminder）。
- **不清 `autoApprove`**（用户偏好跨会话保持——有意）。
- 原实现只清 `agent.history` 的缺陷（新会话首次落盘把旧会话完整人类线 + 旧标题写进新槽——实锤 `.19`/`.3` 双副本）由以上完整清空清单消除。

### 5.2 /session（列表与切换）

- **`/session`（`listSlots`）**：按 updatedAt 降序列出全部槽位元数据；**只读操作不认领**（active 缺失时全部 isActive=false，由下一次 activeSlot 正常认领）。
- **`/session N`（`switchToSlot`）**：**直接 `loadSlotFile` 读目标槽**（原经 loadSession 的 activeSlot 有认领副作用：目标槽被活进程占用时 ensureActive 分支 3 会把 active 拨到新空槽并读回 null + 劫持对方指针）。
  只改 manifest 指针、**无文件拷贝**；目标槽空闲则一并认领、被**另一活进程**占用则不认领（`slotOccupancy` 提示——下次保存经 activeSlot 自然 fork 到新槽）。
  随后 `applySession` 清空 `_slot` 缓存——切换后的保存落在目标槽。成功切换更新本端 marker（§10 D-4）。

### 5.3 删除与退出

- **deleteSlot**：删文件 + 清 manifest 条目 + `deletions` 显式删除（防合并复活）+ 删到 active 时置空 active 指针（`setActive`）；删到本端记录槽 → marker 显式置 null（文件保留——见 §10 D-2/D-4）。
- **ACP `session/delete`**：只删 archive，**在存会话立即 `newSession` 重钉新槽**（绝不 `_slot = null` 等下次保存——会落回同进程 active 槽即他人槽）。
- **退出不归档**：`/exit` / Ctrl+C 只保存当前槽——避免"打开关掉就塞满槽位"。

## 6. 与 VS Code 的契约对齐点

### 6.1 基础契约矩阵

| 契约 | CLI | VS Code |
|---|---|---|
| cwd hash | 40 位 sha1 + 盘符大写 | 同（session-io.mjs 同实现） |
| 槽位认领 | slotSessions + isProcessAlive | 同（面板绑槽后固定） |
| 双线落盘 | `history` + `contextHistory` | `saveMessages(msgDir, name, messages, contextHistory)` 同字段 |
| 旧格式回退 | 无 contextHistory → 从 history 播种 | 同（`contextHistory: null` → 播种） |
| transient 过滤 | 人读线过滤 `!m.transient`，机读线保留（前缀缓存逐字节依据） | 同（`_saveLines` 落盘过滤） |
| 本端记录（end marker，§10） | `{manifest}.cli`：{slot, updatedAt} 小文件——slot = 槽号或 null（形态逐字见 §10.2 D-1）；本端单写者；读侧损坏按缺失降级（不 rename/unlink）；`slot:null` = 删过本端记录槽（显式置空——绝不继承） | `{manifest}.vscode` 同形同语义（双端同批落地） |

### 6.2 跨端共享契约增补（2026-09-01 四模型共识）

| 契约 | CLI | VS Code | 破坏场景（修复前） |
|---|---|---|---|
| `sessionStart` 打点 | `setup.mjs` `_sessionStart ??=` 赋一次 | `saveLines` `existing.sessionStart ?? new Date().toISOString()` 赋一次 | VS Code 恒 null → F2 条件永不触发（无覆盖防护）；CLI 加载 VS Code 槽后打自己的 start → 跨端保存必轮转对方现场（"先占者赢"自伤） |
| legacy transient 过滤 | `isLegacyTransient`（读 loadSlotFile + 写 saveSession 双点） | 同（session-io.mjs 移植，读 loadSlot + 写 keepReal/keepMachine） | 旧注入在 VS Code 进 UI / 进播种机器线 / 保存永久回写（CLI 的清污被重新污染） |
| 机读线判定 | `contextHistory.length > 0` 才当机读线 | 同（activeLines） | `contextHistory: []` + history 非空 → VS Code 恢复空机器线（静默丢全部上下文） |
| v1 回退剥离截断 args | `stripTruncatedToolArgs`（F6） | 同（session-io.mjs 移植） | 旧 v1 文件恢复后把 `…` 半截 arguments 发向网关 → 400 hex-escape |
| 同会话并发追加检测 | F1 粘性 + 每保存重读磁盘（天然低风险） | `saveSessionToSlot` 磁盘 history 比待写快照长 → 轮转 .bak | 面板 turn 快照写回覆盖 CLI 并发追加的消息（静默丢失） |
| `activeModel` 双向 | 写 + 恢复时设置 provider.model | `saveLines` 写 `extra.activeModel ?? existing.activeModel` | VS Code 不写 → CLI resume 读到 VS Code 改模型前的旧值（单向不共享） |
| manifest 死主清理 | `newSession` 传 `deletions`（与 ensureActive deadParam 同型） | `newSlot` 同 | 仅传 m 等于没删（条目级合并把磁盘死条目从 fresh 复活）——清理永不持久化 |
| `loadManifest` 容错 | `!m.slots` → `{}` | 原有 | 损坏的 `{}` manifest → `newSession` 抛 TypeError |
| 读校验顺序 | cwd 先行（"别人的文件不动"优先于结构校验） | cwd 先行（原有） | 异 cwd + 坏 version 的文件被改名 .unreadable（违反"别人的文件不动"） |

**新字段双端同步条款**：CLI `saveSession` 全量覆盖写、VS Code `saveLines` `...existing` 保留未知字段——两端字段集必须同步演进；任何一端新增槽内字段（如 activeModel/engineering）须在同一变更中落档本节并双端实现，否则 CLI 保存会静默删除 VS Code 侧新字段。

## 7. 会话标题生成（IK9UZ8——已实现）

标题请求**显式禁用思考**（OpenAI 兼容 body 加 `thinking:{type:"disabled"}`；anthropic/google 分支不传即不思考）且 **`max_tokens` 30→100**，双端同修（CLI `thincoder-core/generate-title.mjs` 单一 fetch 直拼 body + VS Code `requestTitle` 独立 fetch 三分支）——读取逻辑（`choices[0].message.content`）、标题规范（≤40 字符、无引号）、超时 10s 与失败静默降级均不变。

## 8. 会话恢复 provider/model 无效 → 模型重选 + 复合语义（已实现——MODEL-MERGE-SESSION 同步）

触发场景：会话保存时用的 provider A（或模型）已不存在，CLI 重进时 config 里已无 A——曾直接 throw → uncaughtException 报错退出、进不了 TUI。现改为引导 UI 重选。

- **模型 = 显式复合 "provider:model"（MODEL-MERGE-SESSION）**：config 顶层 `defaultModel` 是**新会话起点**（会话槽恢复后即被槽值取代）；
  会话槽 `activeProvider`+`activeModel` 双字段恒非空（裁定 a）——恢复 = 槽值（F-4——不看 config）。
  config 的 activeProvider/activeModel 两旧层已删（老配置 load 时经 config-migrate.mjs 迁移：`models[]` / active* 老形态 → 单值默认模型 +
  defaultModel 复合 + 写回失败不阻断——`PROVIDER.md` §16 M7；2026-09-10 起 `providers[].model` 回归为**单值默认模型**字段）。
- **D-S1 启动前校验**：`loadConfig` 对 defaultModel 缺失/无效**不再抛错**——runtimeProvider 置空对象 `{}` + `providerInvalidReason`
  （"无效"判据收窄为三类：空值 / 缺冒号或段残缺 / 未知 provider——**不含"候选外"**：候选成员校验已随清单 provider 化废除，见 `PROVIDER.md` §16；
  严格双段解析见 model-ref.mjs parseModelRef——不复用旧 findProvider 宽松三态）；`findProvider` 的 throw 契约保留（advisor/run.mjs 等直接调用方仍依赖）。
  `make-agent.mjs` `assembleAgent` 末尾调用 `validateProvider(agent)`（幂等：有效时清标记；**判据不变**——仅 model/baseURL/name 缺失判 invalid——spec 表不是 allowlist）——`provider.model`/`baseURL` 缺失 → 打 `agent._providerInvalid = true` + `_providerInvalidReason`（defaultModel 原因优先覆盖——更有指导性）。
  - **model 无效判据**：仅当解析后 `provider.model` **为空/缺失**时判 invalid——**不得用 MODEL_SPECS 成员资格判无效**（自定义端点模型不在 MODEL_SPECS 是常态；spec 表不是 allowlist；未知模型 = 受支持场景）。
  - 不抛错、不退出：空 provider 不再流入 runAgent——TUI 路径在 startTUI 前置 `agent.provider = null`，由启动逻辑触发模型选择。
- **D-S2 TUI 重选流程**：`startTUI` 首帧前检查 `_providerInvalid`（或 `!agent.provider`）→ 先弹模型选择 picker（`openModelPicker`——会话级两级面：L1 provider → L2 运行期拉取候选（清单 provider 化，2026-09-10——`PROVIDER.md` §16 M2））→ 选定后继续正常启动（`promptProviderIfInvalid(agent, openModelPicker, pushLine)`）。
  取消（Esc）→ **仍进入 TUI** + 提示行——引导 A（F-6）：空槽（data:null）+ defaultModel 未设 + 有渠道 → 提示 /config → 默认模型（新会话起点）；无渠道 → 原 /model 提示。绝不因无 provider 拒绝进入。
- **D-S3 恢复优先级（applySession 两支 + 删旧支）**：① 槽 `activeProvider` 在 providers[] 存在 → provider/model **按槽值设**
  （legacy 槽 activeModel null/缺省 = 无 override → 回该渠道默认模型 `providers[].model`——2026-09-10 起为单值）
  + 重算 compactThreshold（auto 时——阈值跟模型走——原 bin 的 switched 分支收拢进 applySession）+ 返回 switched；
  ② 槽 provider 没了 → **静默保持现状**（不报错不纠正——config defaultModel 有效则有效——**仅当两方都无效**才弹）；
  applySession 后 bin 复验一次 `validateProvider`（会话中的有效 provider 修复 defaultModel 错误后清除标记）。
  **删旧支**："activeModel==null 清 stale override 回渠道默认"——双字段恒非空（槽写入恒非空）故不可能触发；渠道兜底已由 D-S3 ① 的单值回落（`providers[].model`）承担。
- **D-S4 headless**（`thincoder chat`）：遇无效 defaultModel → `console.error` 可读消息（文案引 defaultModel + /config → 默认模型 指引）+ `exitSoon(1)`——不弹 UI、明确退出码。
- **关键决策**：检测后置 provider=null（空对象流入下游是崩溃源——让选择流程从干净状态开始）；校验点收敛到 assembleAgent 之后一处（TUI/chat 两路径同源）；否决了：启动即退出打印"请编辑 config"（用户要 UI 重选）、静默回退第一个可用 provider（可能 unaware 换错模型）、自动用 defaultModel 覆盖会话槽模型（用户上次明确选的模型不能静默丢）。

## 9. 消息时间戳与 read_history 工具（已实现，双端）

动机：advisor 并行取证困境——会话消息无 ts → 历史无法回溯工具执行时序。用户拍板：消息级时间戳 + 查会话历史的 readonly 工具（带时间窗 since/until——取证完整）。

### 9.1 消息 ts——pushReal 单点

`context.mjs` `pushReal(agent, msg)`（唯一消息入口——`_fullHistory` 与 `agent.history` 同 push）内统一 `if (msg.ts === undefined) msg.ts = Date.now()`——所有调用点（user/assistant/tool 消息）自动带 ts。规则：

- 压缩重建注入消息（applyCompression 手写 note/"Understood" 对象——不经 pushReal）同规则补 ts（压缩时刻）；
- 恢复路径旧消息无 ts——**不补**（补近似值误导取证——容忍）；
- 机读（`[System reminder:`）/transient 消息无 ts 属设计（容忍）；
- 渲染/上下文零变化：ts 不进 provider 请求（发送层字段白名单——`stripLocalMessageFields`）；
- UI 不渲染 ts——仅 read_history 输出/会话 JSON 可见。

### 9.2 read_history 工具语义

- 描述：查本会话消息历史（`agent._fullHistory`——压缩不丢——审计完整）——回忆之前说过/做过的事（决策/工具时序/过去裁定）。
- 筛选：role / keyword（content 子串）/ tool（工具消息 name）/ since / until（epoch ms——配合消息 ts）/ limit（**默认 50——上限 200**，超限钳制 200）/ direction（oldest/newest——默认 newest）。
- 时间窗：**since/until inclusive-inclusive**（ts == since 或 until 的边界消息含）；since > until → 空结果；排序按数组序（ts 仅过滤不重排——同 ms 相等 ts 合法，Date.now() 分辨率）。
- 返回：JSON 数组——`{ts, role, name?, tool_call_id?, content 截断, tool_calls 概要}`；tool_calls 概要 = 工具名列表（assistant——不展开 arguments）；内容逐条截断（~500 字符 + truncated 标记——全文看会话文件）；multimodal content 数组匹配文本 part（数组串化摘要）、截断按文本；无 ts 消息：不匹配时间窗 + 返回 `ts: null` 标记。
- 数据源：`agent._fullHistory`——readonly: true（planMode 放行/免审批/explore 只读集自动）。
- 注册：agent-tools.mjs 聚合 + setup.mjs——**depth-0 only**（子代理各自上下文——查父历史语义混淆）。
- VS Code 镜像（agent 结构同——两端同批注册）。
- 跨会话检索（path/cwd 参数面）设计见 §13——本会话缺省零变化。

## 10. 端分离恢复：本端 end marker（R4——已实现，双端）

> 解决的问题：CLI 与 VS Code 面板同开同一项目时，共享 manifest 的 active 指针两端互写——退出重进恢复进"另一个不是退出前"的会话。用户裁定：① 完全各记各的（CLI 重启回 CLI 自己最后的会话；面板回面板自己的——`/session` 手动切换保留）；② 迁移一次性继承（无本端记录时继承共享 active 的死主槽**一次**——记录写下后永久分离）。

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/SESSION.md`。

### 10.2 设计

**D-1 记录形态（end marker 独立文件）**：

- 路径：`{manifest}.cli`（CLI）/ `{manifest}.vscode`（VS Code），即 `~/.thincoder/sessions/{hash}.json.manifest.cli|.vscode`——manifest 旁的独立小文件，**非 manifest 内嵌字段**（NF1）。
- 内容：`{"slot": <number|null>, "updatedAt": <epoch ms>}`。
- **文件缺失 = 从未记录**（迁移窗口，可继承一次）；**`slot: null` = 显式置空**（删过本端槽）——两者必须区分。**读侧降级**：文件缺失或 JSON 解析失败（损坏）一律按"缺失"处理——不 rename 不 unlink（幂等、不误伤），可能触发一次继承；`slot: null`（显式置空）除外——**绝不继承**。
- 写者：仅本端（CLI 只写 .cli，VS Code 只写 .vscode）——零跨端写竞争；旧版端不认识、永不触碰该文件（版本安全）。
- 端常量：CLI 仓 `END = "cli"`；VS Code 仓 `END = "vscode"`。

**D-2 恢复决策**（`resumeSlot(cwd) → {slot, data}`）：

```
m = loadManifest(cwd)
1. 本端记录可用？slot ≠ null 且 slot ∈ m.slots 且槽文件在盘 且属主 空/死/本进程
   → 认领（claimSlot：slotSessions[slot] = 本进程 + saveManifest setActive）
   → loadSlotFile 读槽
2. 本端记录缺失（文件不存在——从未记录 = 迁移窗口）→ 一次性继承：
   m.active 在且 ∈ m.slots 且文件在盘 且属主 空/死
   → claimSlot(active) + 写记录 = active → 读槽
3. 其余一切（slot:null / 槽已被删 / 属主为活外人 / 继承失败）
   → 全新分配（allocateFresh——ensureActive 分支 2/3 语义抽取：先回收"文件缺失+空闲"
     的 manifest 槽号，否则 max+1 起跳过活认领号/现存文件号）→ 写记录 = 新槽 → data = null
```

- 每次落点都写本端记录；**claim 后读槽失败**（解析失败/.unreadable——既有改名保全语义）→ **保持已 claim 槽 + data:null**——不回滚认领、不改 marker——下次保存原地重建该槽，旧现场以 .corrupted/.unreadable 保留。
- legacy 单文件兜底与 loadSession 平移（仅 data 层——不改变 claim 落点）。
- 实现形态：session-slots.mjs 抽取 `claimSlot`（现 ensureActive 分支 1 主体）与 `allocateFresh`（分支 2/3 主体）；`ensureActive`/`activeSlot` **保留**给无记录进程路径（ACP、cmd-eng/cmd-advisor 内嵌调用——分支 1"active 空闲即取"行为不变，ACP 语义零变化）。
- **missing → 继承、null → 全新**的区分理由：删槽后置 null 使"删过"可辨认——用户删除自己会话后重开 = 全新起步，不继承对方遗留、不复活被删会话。

**D-3 启动钉 _slot（闭合首保存迁移窗口）**：bin/thincoder.mjs TUI 启动 `resumeSlot` → `applySession` 之后 `agent._slot = slot`——否则若并发方在首回合前翻 active，首次保存会经 ensureActive 分支 3 静默迁移到新槽（F1 只治重复保存，首保存窗口仍在）——恢复确定性要求**首保存必落恢复槽**。`/new` 后 resetSessionState 清 `_slot` 语义保留（newSession 已认领 + 写记录）。

**D-4 marker 维护点**（每次落点原子写，失败容忍 NF2）：

- CLI：`resumeSlot`（D-2 每步）；`saveSession` 首认领（`agent._slot` 为 null 时的 `??= activeSlot` 之后——覆盖"/session 切换后首保存"与"查看对方活槽 → 保存 fork 新槽"的落盘槽跟随）；`newSession` 成功后；`switchToSlot` 成功后（跟随"最后查看的槽"）；`deleteSlot` 删到本端记录槽 → `writeEndMarker(cwd, null)`（文件保留、slot 置空——不 unlink）。
- VS Code：ensureSlot/status 恢复决策（D-2 镜像）；newSlot 后；面板"打开历史会话"后；deleteSlotAndUpdate 删到本端记录槽 → 置 null。
- 非维护点：日常保存（F1 粘性 `_slot` 已定，不写 marker——保存永不参与竞争）。

**D-5 listSlots 高亮按端**：`listSlots(cwd)` 保持 manifest active 语义（ACP session/list 零变化）；TUI `/session` 与面板会话列表的本端高亮改以本端记录槽为准（isActive = 记录槽 ∈ 列表 ? 记录槽 : m.active——含"记录槽已被对端删除"的守卫）。manifest active 保留为跨端回退高亮。

**D-6 manifest.active 定位修订**：认领/新建/切换/删除的 setActive 纪律**原样保留**（旧版端互操作 + ACP + 继承读取 + 列表回退）；仅新型恢复决策不再以它为第一依据。§1 相应修订为：active = 共享当前指针——旧版端/ACP 的恢复依据 + 无记录端的一次性继承源；本端恢复依据 = 本节 end marker。§6 契约对齐表补 marker 行（路径/内容/写者/置空语义双端一致）。

**D-7 混合版本矩阵**：

| 组合 | 行为 |
|---|---|
| 新版 CLI + 新版 VS Code | 完整分离（目标态） |
| 新版 CLI + 旧版 VS Code | 旧版仍翻 active/抢死槽；CLI 重启时若 marker 槽被旧版活占 → 全新起步（退化为现状形态，数据安全）；旧版退出后可取回。建议同步升级 |
| 旧版 CLI + 新版 VS Code | 对称 |
| 旧版 + 旧版 | 现状 |

> **升级过渡首日**：双端同批升级后均无 marker——仅先启动端能继承共享 active 死槽（另一端遇活属主拒 → 全新槽），且先启动端可能继承的是对端旧槽并永久写入本端 marker——数据不丢（/session 可手动找回）——一次性继承的固有代价，过渡后不再发生。

**D-8 已知限制**：同端多活进程（两个 CLI 终端 / VS Code 多窗口同项目）时 marker 为"端内最后认领者"语义——活进程各自粘性写自己槽，后启动者覆盖 marker；交错重启时先者的会话需 `/session` 手动找回（与现状同量级，且不再跨端互扰）。ACP 不经 marker（显式钉槽不变）。

**被否方案**：① manifest 内嵌 `cliLast/vscodeLast` 字段——双端写同一文件（正是本 bug 类）+ 合并/旧版写丢未知字段；② 恢复目标 = updatedAt 最新槽——列表字段、跨端每次保存互触、语义不符；③ 取消一次性继承（无迁移通道）——升级后第一次打开即触发本 bug；④ 只修 CLI——面板 resolve 仍翻 active/抢死槽，CLI marker 槽被"活外人"占用后回到 bug（必须双端同批）。

## 11. agent 运行环境自我感知（env-state reminder——R5/R8/R9/R11 家族，已实现双端）

> 非存储机制（归属 setup-reminders/提示词面，因 R5 的"会话 slot 持久化跨进程"语境落档本节）。与 §10 相邻：§10 = 存储层"本端哪个槽"，本节 = 认知层"agent 自知处境"。

**机制**：每回合注入**一条统一的"环境状态" transient reminder**（与 AUTO/时间 reminder 同通道、同可变形态——避 prefix 缓存）——一次注入覆盖家族四项；变更在下回合自然感知（不需要"变更时专门注入"）：

```
[System reminder: env: {cli|vscode}, mode: {eng|normal}, model: {model-id}, slot: {N|null}, resumed: {yes|no}.]
```

**字段映射**：

- `env` → 运行身份（R8）——CLI 仓 `END="cli"` / VS Code 仓 `END="vscode"` 静态常量（§10 D-1 同口径），不做 cmdline 判别；
- `mode` → 工程模式（R9）——`agent.config?.agent?.engineering` 现状字段；
- `model` → 模型（R11）——`agent.activeModel ?? provider.model ?? "unknown"`（MODEL-MERGE-SESSION：activeModel = 会话复合具体值恒非空——回退链仅 legacy 形态兜底）；
- `slot` → 当前会话槽（粘性——N2：CLI `agent._slot` / VSC `_engPersist.slot`——非 manifest active 共享指针）——无绑定窗口（全新会话首回合/直连）如实 `slot: null`（N3——不读 active 回退）；
- `resumed` → 会话恢复感知（R5——§11.2 按会话跟踪）——有历史的会话被恢复（进程重启 resume / 切槽到有历史槽）→ 恢复后首个回合 `resumed: yes` 一次，后续回合 no；无恢复事件（全新会话 / 空历史恢复）恒 no。

**规则**：

- **git 不入 env-state 行**——CLI 已有富 git context 注入（branch/commits/uncommitted），VS Code 补同款富注入，env-state 行不重复 clean|dirty 摘要；
- **不改 system.md 身份文本**（两端 system.md 逐字相同——避免两端漂移）——身份经 env 字段携带；
- 消费指导：`resumed: yes` → 进程级内存态已随旧进程消失——designToken / async 注册表 / guard 标记等不假设仍在；
- 错误路径安全降级：git 不可用/非 git 仓库 → git 字段空/跳过不报错；activeModel 为 null → model 字段回退 provider.model（亦缺失 → `"unknown"`，T-E12）；slotSessions 不可读 → 注入不崩、字段降级。

**未决/限制**（后续项，非本批）：

- VS Code `detectRestoredSession` 为进程级一次性闸——中途切换会话拿不到 `resumed: yes`（按会话跟踪语义待后续完善）；
- ~~git 富注入 = 3×execSync 每回合同步（最坏 ~15s 阻塞事件循环）~~——**2026-09-09 核销**（GIT-ASYNC L21——双端同改：collectGitContext → async——3×execFile 并行（Promise.all——最坏单次 5s）+ all-or-nothing + 失败冷却 30s（Map<cwd,ts> 惰性清）——本节 §11.1 注入语义/字节 parity 不变——设计档 VSC 仓 `docs/design/GIT-ASYNC.md（VSC 仓）`）；
- ~~**env-state 缺当前会话 slot（2026-09-08 用户需求点登记——SESSION §11 env-state 行无 slot）**~~——**已交付核销**（2026-09-08 快车道批——§11.1/§11.2：双端 setup-reminders envStateLine 加 `slot: {N}` + 本 §11 字段映射 slot 行 + 双端 system.md:24 slot 字段——本条作废，TODO Requirement Pool 登记项勾销；该档已退役——PROMPT-SYSTEM 施工①③）。
- R9 的"模式历史"（agent 自查询模式历史）本批不做——设计只覆盖"当前模式"注入；
- R12（async 深度门控：depth-0 缺省 async、depth>0 缺省 sync）与本节同批实现——权威 = AGENT-LOOP.md §18。

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/SESSION.md`。


### 11.2 设计段（2026-09-08——F1-F3 + N1-N6 全纳入——勘察 explore 一手——**已交付核销**——bba68df/0bf02b0 + VSC 7e7d90a/ec1e4c4——consume 554b6251）

> 需求：§11.1 F1-F3 + N1-N6（用户 2026-09-08 确认"都纳入"）。现状勘察：explore 双端源码核实（file:line 见下）——envStateLine 双端无 slot 参数、resumed 双端机制不同源、CLI 有 `_sessionStart` 推断伪触发既有缺陷。
> 评审 #6（2026-09-08）：🔴 1 项（N6/AC4 双信号未设计——已修复：process restarted 句保留进程级信号——VSC 模块级闸不迁 + CLI 启动专用标记——resumed 用会话级信号）+ 🟡 2 + 🔵 3——🔴 修复后待重评审。

**slot 注入**（F1）：
- CLI：`pushEnvStateReminder(agent)`（setup-reminders.mjs:33-39）调用点 setup.mjs:179-182——作用域内
  agent 全量可用——`agent._slot` 直接可取。envStateLine 加 `slot` 参数——push 内传 `agent._slot`。
  **null 窗口**（从未落盘新会话首回合 / applySession 清槽 / resetSessionState）→ 字段如实 `slot: null`
  （N3——不读 manifest active 共享指针——避免 ACP 多会话张冠李戴——粘性 `_slot` 才是"本 agent 之槽"）。
- VSC：hydrateRun（setup.mjs:229）内 slot = `bind?.slot`（opts.engPersist = {cwd, slot: turnSlot}——`src/extension/panel-chat.mjs:348`（VSC 仓） 回合入口捕获）——pushEnvStateReminder 签名加 `slot` 透传（沿用解构风格）。无槽绑定（直连/非面板）→ slot null 降级（同 model "unknown" 降级族）。
- 行位：`env: {END}, mode, model, slot: {N}, resumed`——slot 在 model 后 resumed 前。

**resumed 按会话跟踪**（F2）：
- **VSC（评审 🔴 修复——双信号分离）**：resumed 按会话跟踪用**新 agent 级字段**
  （如 `agent._resumedPending`——只在 agent 新建且 restore:true factory 路径、fullHistory 载入非空时
  武装——agent 每 (面板×slot) 绑定销毁重建（ensurePanelAgent `src/extension/panel-chat.mjs:60`（VSC 仓；至 63 行）——换槽即
  `panel._agent = null`；runAgent 缺省 factory 新建 agent.mjs:85-92）——每次槽恢复进新 agent
  天然得一次 resumed:yes——同绑定复用不武装。判定 `fullHistory?.length > 0`（N5）。
  **模块级 `restartDetectionDone`（:69）保留不迁**——它是 process-restarted 句的进程级闸
  （extension host 重启后模块级重置——进程内切槽不重置——N6 需）——`_resetRestartDetectionForTests`
  （:72）保留。两信号独立：resumed = agent 级每恢复；process restarted 句 = 模块级每进程一次。
- **CLI**：现 setup.mjs:101-121 内联 `_sessionStart != null` 推断 + `agent._restartReminderInjected` 闸
  ——**改显式恢复事件**：恢复落点收敛 `applySession(agent, data)`（`src/session.mjs:261-325`——启动 bin:291
  + /session cmd-session:92 + ACP acp:229/276 全汇于此）——applySession 内 `data.history?.length > 0`
  时武装待发标记 + 去 `_sessionStart` 推断 + 闸改由 applySession 复位——prepareRun :115-121 消费标记。
  **顺带修复 F3 伪触发**（全新会话 turn 2 不误报——无恢复事件不武装）。/new 与空历史槽切换不武装。

**注入句解耦**（N6——评审 🔴 修复——双信号分离）:
- **VSC**：process restarted 句继续用模块级 `restartDetectionDone` 一次性闸（:69 保留不迁——
   extension host 重启后模块级重置；进程内切槽/换槽不重置——真重启语义）——resumed 用 agent 级
   `_resumedPending`（每槽恢复）——两信号独立——切槽发 resumed:yes 不发 process restarted 句。
- **CLI**：process restarted 句用**进程启动专用标记** `agent._processRestartPending`——仅 TUI
   启动 resume 路径（bin:291 resumeSlot→applySession 恢复盘上会话）设一次；/session 切换与 ACP
   加载不设（同一 applySession 收敛——但调用点区分：启动路径带进程重启标记——切换路径不带）。
   resumed 用 applySession 武装的 `_envResumed`（每恢复一次）——两信号独立。
- 消费：prepareRun 内——`_processRestartPending` 真 → 发 process restarted 句 + 清（进程内一次）；
   `_envResumed` 真 → resumed:yes + 清（每次恢复一次）——互不绑门。

**测试**（双端新建——现零测试——explore 确认）：
- `test/setup-reminders.test.mjs`（双端各建）：envStateLine 模板（slot 字段/null 降级/resumed yes-no）
  + CLI `_envResumed` 消费即清 + VSC `_resumedPending` agent 级载体（评审 #7 点名——新 agent+
  非空历史→首 run true 次 run false/换槽新建→再 true/depth>0·resume·autoTurn→false）
  + CLI applySession 恢复事件（有历史→下回合 yes 一次→再切槽→再 yes——无恢复事件恒 no——F3 防伪触发回归）
- VSC `test/agent-lifecycle-singleton.test.mjs`（VSC 仓） 补"换槽销毁重建 → resumed 事件随绑定新生"用例

**受影响文件**（双端）：
| 文件 | 端 | 改动 |
|---|---|---|
| src/agent/setup-reminders.mjs | CLI | envStateLine 加 slot + push 传 agent._slot + 恢复事件消费改标记 |
| src/agent/setup.mjs | CLI | prepareRun 恢复判定改显式事件（去 _sessionStart 推断）+ 注入句解耦 |
| src/session.mjs | CLI | applySession 武装恢复事件（data.history 非空） |
| bin/thincoder.mjs | CLI | 启动 resume 路径设 `_processRestartPending`（评审 🔴 补——句的进程级信号） |
| src/agent/setup-reminders.mjs | VSC | envStateLine 加 slot + push 签名 + resumed 改 agent 级 `_resumedPending`（**模块级闸保留不迁——评审 #7——process restarted 句不变**） |
| src/agent/setup.mjs | VSC | hydrateRun 传 slot + 注入句解耦（resumedSession 与 process restarted 分门） |
| test/setup-reminders.test.mjs | 双端新 | 上述用例 |
| test/agent-lifecycle-singleton.test.mjs（VSC 仓） | VSC | 换槽重建 resumed 用例 |

**验收**：
- AC1 env-state 行含 `slot: {N}`（双端——无绑定显式 null）
- AC2 切槽到有历史槽 → resumed:yes 一次（VSC 新 agent 武装 + CLI applySession 事件——双端）
- AC3 CLI 全新会话无恢复事件 → 恒 no（F3 伪触发消除）
- AC4 注入句解耦——切槽不发 process restarted（N6——评审 🔴 修复：双信号分离——VSC 模块级闸保留/CLI 启动专用标记）
  ——测试：启动恢复发句一次 + 切槽 resumed:yes 无句 + 进程内多次切槽句不再发
- AC5 测试绿（双端 setup-reminders.test.mjs + 既有不回归）

### 11.3 描述同步变更段（2026-09-08——用户裁 A + system.md 漂移修正——小改快车道）

> 需求：SESSION §11.2 实现后 system.md:24 描述漂移（缺 slot 字段 + resumed 语义窄化为"process restarted only"）。用户裁 A：**接受实现语义 = 每次会话恢复发 yes（含进程内切槽到有历史槽）**——改描述匹配实现（非改实现）。快车道（用户明确指令——"A"）。（system.md 已退役——PROMPT-SYSTEM 施工①③）
> 状态：**已交付核销**（2026-09-08——CLI 6910be1 / VSC 752c127——AC1-AC4 字节断言绿——双端 L2 待跑——consume 278e7612——上报待裁项见 §11.3 变更记录）。

**改**（双端 system.md:24——模板行 + 语义描述；该档已退役——PROMPT-SYSTEM 施工①③）：
1. 模板行 `[System reminder: env: cli|vscode, mode: eng|normal, model: <id>, resumed: yes|no.]` → 加
   `slot: <N|null>`（model 后 resumed 前——与实现 envStateLine 一致——无绑定显式 null——
   评审 #4：占位符沿用 <…> 风格——与 model <id> 一致——AC1 断言字面同步）
2. resumed 语义描述："yes only on the first turn after the process restarted with a restored session" →
   "**yes on the first turn after a session with prior history was restored (a process restart that
   resumed it, or a slot switch to it)**"——（评审 #1 + #3：引号内为 system.md 逐字英文内容——
   重启分支也限 prior history——空历史恢复不发 yes——与 §11.2 武装条件 data.history 非空一致）每次会话恢复一次
3. 保留 design token 段（CLI）/ mode-model 段——不改

**受影响文件**：CLI src/prompts/system.md、VSC src/prompts/system.md（模板行 + 语义句——两档已退役：PROMPT-SYSTEM 施工①③；各行
   ~900 字符内子串替换——行数不变）+ SESSION.md §11 自身模板记录 :351/:359 同步补 slot
   （评审 #2——避免本档自身无 slot 描述与同步后 system.md 打架——同批 doc-only 改）

**验收**：
- AC1 双端 system.md:24 模板行含 `slot: <N|null>`（model 后 resumed 前——评审 #4 占位符 <…> 风格；system.md 两档已退役——PROMPT-SYSTEM 施工①③）
- AC2 resumed 语义描述 = 每次会话恢复（含切槽）——非 process restarted only
- AC3 实现零触碰（只改描述——envStateLine 输出/setup-reminders 不动）


## 12. 会话目录残留 GC 与标题写契约（已实现，双端）

> 目标：治理会话目录长期残留累积（损坏现场/备份/端 marker/manifest 只增不减）与会话元数据写失败的静默性——目录长期可用 + 元数据写失败可见。

### 12.1 残留分类与保留期

| 残留类型 | 后缀 | 保留期 | 理由 |
|---|---|---|---|
| 损坏现场 | `.corrupted` / `.unreadable` | 30 天 | 供排查近期损坏；太旧无价值 |
| manifest 损坏现场 | `.manifest.corrupted`（manifest 主文件损坏时改名保留，§2.2） | 30 天 | 与槽文件损坏现场同类 |
| 并发轮转备份 | `.bak-*` | 30 天 | 保留被覆盖的对方现场 |
| 孤儿 .tmp | `.json.*.tmp`（无对应主文件） | 7 天 | 崩溃现场恢复窗口 |

### 12.2 自动残留 GC（F1）

- **触发**：进程启动完成后的空闲期（setImmediate——不阻塞启动路径，N4）+ 可选手动命令（`thincoder session gc --dry-run`）。
- **范围**：sessionsDir 下**当前 cwd 的 hash 前缀**文件（.corrupted / .bak-* / .unreadable / 孤儿 .tmp）——不跨 cwd 扫描（性能 + 安全）；扫描先按后缀预过滤，只 stat 候选，再对候选做活跃槽判定。
- **排除**：活跃槽对应文件的任何现场后缀保留；manifest 主文件 / end marker 主文件**不自动删**（保守——冷 cwd 手动面见 12.3）。
- **保留期边界语义**：判定用 **mtime < now − retention** 即删（older-than）——恰好等于保留期的文件**保留**。

### 12.3 冷 cwd 清理（F2——手动命令，CLI 提供）

不自动删 manifest——无法判断 cwd 是否"永久弃用"，自动删风险高。分三步全经手动命令：

1. **判定（冷 cwd）**：某 cwd hash 下**无任何活跃数据文件**（`.json.N` 主文件不存在或全部属死主进程）**且** manifest mtime 距今 > **90 天** → 候选。以 manifest mtime 为准（marker 写 null 后文件保留——单独看 marker mtime 无意义）。
   - 活跃槽判定（操作定义）：某 slot 的 `.json.N` 主文件存在且 manifest `slotSessions[N]` 属主进程存活（`isProcessAlive`）→ 活跃，其现场后缀与目录一律保留。
2. **报告（dry-run）**：`session gc --dry-run` 枚举 sessionsDir **全目录**（跨 cwd——报告面不受 12.2 删除面限制），列出候选冷 cwd 的 hash/路径/manifest mtime/数据文件数，**不删除**。
3. **删除（确认）**：`session gc --confirm <hash>`（或 `--all`）显式删除**指定冷 cwd hash 前缀下的全部文件**：manifest + end marker + `.json.N` 槽数据文件（死主）+ **裸 v1 `{hash}.json`**（历史遗留——用户裁决纳入删除集：整前缀清空意图即释放空间）+ 残留（.corrupted/.bak/.unreadable/.tmp）。
   - 为何含数据文件：冷 cwd 判定允许"数据文件全部属死主"——只删 manifest 而留数据文件会制造**孤儿数据**（无 manifest 引用、listSlots/resumeSlot 不可达、却仍占盘）——正是本节要治理的累积问题本身。
   - **删除前警告**：confirm 输出将删文件清单 + "此操作永久删除该 cwd 的全部会话历史"确认提示；`--all` 同型逐 cwd 警告。
   - **删除前重校验冷态**（TOCTOU 防护）：confirm 执行时重跑冷 cwd 判定——若期间该 cwd 变活跃（有新属主/数据文件）→ 拒绝。
- VS Code 侧执行面：扩展无 shell 子命令通道——冷 cwd 报告/删除由 CLI 统一提供（共享同一 sessions 目录，CLI 可清 VS Code 弃用的 cwd）；VS Code 只实现自动残留 GC（12.2）与标题契约（12.4），不做 F2 手动面。清理语义双端同源（session-gc.mjs 双端同构）。

### 12.4 标题写契约（F3）

双端 renameSlot/setSlotTitle 返回契约从裸 boolean 改为：

- **`{ ok: true }`**（成功）
- **`{ ok: false, reason: "file-missing" | "parse-failure" | "mtime-conflict" | "invalid-slot" }`**——四种失败原因可区分；reason 与既有内部判定一一对应，**不含用户文本**（文本渲染由调用方决定）

CLI `renameSlot`（src/session-rename.mjs）+ VS Code `setSlotTitle`（session-io.mjs）同契约；调用方（TUI `/session` 改标题、panel-messages/panel-session）同步适配。返回形态改变是显式契约升级——无外部 API 消费者（内部工具）。

### 12.5 模块与实现约束

- GC 逻辑入**独立模块 session-gc.mjs**（CLI `src/` + VS Code `src/extension/` 同构）——不塞 session-slots.mjs（500 行硬限，CLI 该文件曾 501 行零余量）；启动钩子只加一行调用。
- renameSlot 自 session-slots.mjs 拆入 session-rename.mjs（同因超限拆分，session-slots.mjs 降至 475 行）；VS Code 侧 session-slot-write.mjs 承接（session-io.mjs 保持 ≤500 行）。
- 残留 GC（12.2）与冷 cwd（12.3）共用文件集合判断（12.2 的 classifyResidue 不动——v1 属冷 cwd 手动删除面，自动残留 GC 不碰 manifest/v1）。

## 13. 跨会话历史检索与检索族消歧（R19——设计，待评审）

> 状态：**设计已落本节（2026-09-06）——round1 评审 1🔴+6🟡+3🔵 全采纳——复审发起权在用户**。澄清裁定 🅰：read_history 加 cwd/slot 参数（本会话 = 默认域——单工具扩展，非新工具）。
> 来源：用户确认 read_history 仅本会话后裁定"跨会话也希望有"——AUTO 排查曾手工扫 7383 个 slot 文件（同族动机：会话状态/历史无机器可读视图）。

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/SESSION.md`。

### 13.2 设计

**D-R19a（read_history 参数扩展）**：

- 新参数 `path`（可选——默认本会话）：目标会话文件路径（显式）或 `cwd:` 前缀指定目录（自动发现该 cwd 的会话槽——manifest/slotSessions 结构既有）；跨会话查询 = path 指定 → 读目标文件 history 线 → 同 filter 面（role/keyword/tool/since/until/limit/direction——§9 语义）应用。
- 本会话缺省 = 零行为变化（向后兼容——既有调用全不传 path）。
- 发现面（path = `cwd:xxx`）：**列全部槽 + 时间序——不做死槽过滤**（v1 决策）。每槽摘要行 = **槽号 + 完整文件路径 + title/消息数/updatedAt**——摘要必须含寻址字段：模型无法自行算 sha1(cwd) 拼文件名，第二步深查 = `path = <摘要行的完整文件路径>` 重调（两步交互与 memory search 同型）。
- 检索护栏（**双保险**——L24 2026-09-09 消息数预算补充，评审 #2 钉阈值）：单槽检索设**行扫第一道** **READ_HISTORY_SCAN_MAX = 200,000 行**（流式计数——超限不再读全文）+ **消息数第二道** parse 后 `history.length` 超 **READ_HISTORY_MAX_MESSAGES = 50,000** 即拒（JSON 单行槽行扫不设防）
  ——两道超限均返回同一逐字定稿文案 `{error: "session too large — refine keyword or since/until"}`（双端同常量同文案——描述口径 "over 50,000 messages or 200,000 lines is refused"）；返回条数沿用 §9 limit 语义（>200 → 200）。

> 〔eng-designer 折行 2026-09-11 13:10：单行 392 字符 → 纯折行（批 14 候选 2；文字零增删、语义不变）〕
- 错误路径：未知 cwd → 明确错误返回（无该 cwd 会话目录）；cwd 无槽 → 空列表 + 提示；目标文件缺失/损坏 → 错误返回不崩（§9 错误处理同型）。

**D-R19b（消歧总纲——read_history 描述尾段逐字定稿，实现时并入各工具描述）**：

> 检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；查**别的会话/项目**旧对话 → read_history 带 path/cwd 参数；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识/约定**（memory）→ memory search；
> 查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint cat/versions。read_history 只查会话消息——文件级改动用 recent_changes——知识与约定用 memory——互相不替代。

消歧段补进各工具描述（互指尾句）：read-history.mjs（尾段——含 cwd 参数说明 + 族表）、recent-changes.mjs（尾句"会话级历史用 read_history"）、memory 工具描述（search 段补"会话消息历史不在 memory——用 read_history"）、doc_search/code_search（"查设计决策用 doc_search——查实现用 code_search——查会话用 read_history"——已有互指补 read_history 引用）。双端一致。

### 13.3 验收方向与实现提示

- **AC-1** = 跨会话检索用例全绿（缺省回归 / path 单槽 / cwd: 发现——摘要含槽号+完整文件路径 / 错误路径三型 / 超限护栏断言定稿文案 / depth 门）；**AC-2** = 零回归（read_history 既有调用全绿——缺省不变）；**AC-3** = 描述锚测试绿（消歧段双端一致，锚断言）。
- 实现批提示：实现面主文件 = 双端 `thincoder-core/agent-tools/read-history.mjs`（path 参数 + 描述尾段族表 + 护栏）；逐个点名验证检索族描述实际位置（tools/*.md 或 .mjs 内联——含 read.md 类路由句若存），清单外新增以交付报告为准；**checkpoint "versions" 核验**：总纲句含 "checkpoint cat/versions"——实现前先核验 git 工具动作面是否含 versions——不含则总纲句改 "checkpoint（cat/list——按实际动作面）" 再定稿。


---

## 14. 长会话记录内存有界：磁盘为准 + 内存窗口（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 需求：`../requirements/SESSION.md` §14.1（F-S1–F-S6 / N-S1–N-S6）。
> 来源：批次档 `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §1（事故 + 勘察 C1 + 用户 23:49 裁定
> 方向「磁盘为准 + 内存窗口（懒加载下沉到内存层）」）。方向已定——本节做实现级选型与契约。

### 14.1 问题陈述（证据 as-of 2026-09-11）

| # | 事实 | 证据（file:line） |
|---|---|---|
| 1 | 人读线 `_fullHistory` 永不压缩、全量常驻：pushReal 双线写入后压缩只重建 `history` | `thincoder-core/context.mjs:163-180`（pushReal）· `:183-200`（applyCompression——只 `agent.history`） |
| 2 | 落盘投影（`.json.N` 的 `history`）即全量人读线（slim 后）；恢复把它整体读回内存 | `src/session.mjs:109-171`（saveSession `history = (_fullHistory ?? history)…`）· `:292`（applySession `_fullHistory = [...full]`） |
| 3 | TUI 懒加载只懒「渲染」，分页源 `full` = 内存全量数组；翻页把行 unshift 进 `state.lines` 且无淘汰 | `src/tui/startup.mjs:142-170`（`createLoadOlder`——`full.length − loaded − PAGE`）· `:119-136`（restoreLines） |
| 4 | 活消息增长使翻页锚点漂移（`full.length` 增长而 `_historyLoaded` 只记恢复/翻页量）——错位隐患 | `src/tui/startup.mjs:147`（`start = full.length − loaded − HISTORY_PAGE_MESSAGES`） |
| 5 | 人读线内存消费者全清单：本会话检索 / 观察摘要 / 标题生成 / 保存 / 恢复 / 翻页（无第七方） | `thincoder-core/agent-tools/read-history.mjs:290` · `src/agent-tools/subagent-actions.mjs:194` · `thincoder-core/generate-title.mjs:72` · `thincoder-core/session.mjs:114` · `:292` · `:415` · `src/tui/startup.mjs:145` |
| 6 | 槽 JSON 的跨端读面（VSC/ACP/列表）依赖 `history` 为**全量数组** | VSC：`thincoder-vscode` `src/extension/session-io.mjs:104`（VSC 仓） / `src/extension/panel-session.mjs:87`（VSC 仓）（本仓不引用——评估面）· ACP `src/acp.mjs:260` · 列表 `thincoder-core/session-slots.mjs:141`/`:359` |

事故形态：19 分钟会话 ≈ 8GB 堆（爬升型）；C1 为结构性无界之一（其余见架构批设计）。

### 14.2 方案选型对比（方向既定——实现级四表）

**表 1：记录存储形态**（判据：内存有界 / 翻页可读 / 崩溃完整 / VSC 兼容 / 复杂度）

| # | 候选 | 评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 槽 JSON 内窗口化 + 无 sidecar | 翻页无法按页读 JSON（须全量 parse）；`history` 变窗口 → VSC/ACP/列表破坏 | 不可行 | 否决 |
| 2 | 单 JSONL 文件 + 内存 offset 索引 | 可按页读；但索引重建须全文件扫描 / 驻留 offset 表；追加序列化点单一 | 索引形态复杂化 | 否决（见候选 3） |
| 3 | **定长分段 JSONL sidecar + 算术索引**（段 = 100 条，段内行序 = 消息序） | 绝对序号 → （段号, 行号）纯算术；无索引文件；已写段只读；追加 = 单文件 append | 段边界处续写须处理空末段/半行（契约见 §14.3） | **选定** |
| 4 | 段按字节触发 + 清单文件记账 | 段大小均匀；但清单与段双写需同步（损坏面 ×2）、实现更重 | 收益低 | 否决 |
| 5 | 全量落盘档 + 内存保尾（不分段） | 翻页须按 offset 扫全档（或全量 parse）——未解决「按页读」 | 不满足 F-S3 | 否决 |

**表 2：内存窗口口径**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **条数窗口 = 200**（与 `INITIAL_HISTORY_MESSAGES` 同值——首屏即窗口，单一概念） | 上界 = 200 条；最坏 200×64K 预览 ≈ 13MB、典型 ≪1MB；observe（≤20 回合）/标题回退覆盖充分 | **选定** |
| 2 | 条数窗口 = 500 / 1000 | 更宽裕但上界 ×2.5/×5；消费者均已改走存储，无需求 | 否决 |
| 3 | 字节窗口（如 8MB） | 更严格；驱逐边界计算复杂（须逐条测长）、与首屏口径脱节 | 否决 |
| 4 | 不设窗口（仅存储） | 消费者（observe/标题/后续未知面）全部依赖存储读——耦合面大、退化风险高 | 否决（保留窗口 = 安全带 + 快路径） |

**表 3：落盘投影（槽 JSON `history`）生成**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **流式拼接段文件**（`[` + 各段原文（已逐字节同形） + `]`——无需重序列化） | O(1) 内存（单段读入即写出）；与既有形态逐字节同构；实现 ~30 行 | **选定** |
| 2 | 物化数组再 `JSON.stringify` | 峰值 ≈ 记录全量（数百 MB 级记录再现——违背本批目的） | 否决 |
| 3 | 投影降级为「窗口 + 计数」 | VSC/ACP/列表/跨端接续破坏（version 2 契约） | 否决（红线） |

**表 4：追加时点**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **pushReal 同步追加**（单点；失败独立 try/catch） | 崩溃保留最大化；读路径恒新鲜（read_history/翻页无「未刷窗口」合并逻辑）；成本 = 每消息一次 append（典型 ≤KB 级） | **选定** |
| 2 | 保存点批量追加 | 崩溃丢自上次保存；读路径须合并「未刷盘尾部」（复杂） | 否决 |
| 3 | 周期定时刷盘 | 崩溃丢窗口 + 定时器新增（无必要） | 否决 |

### 14.3 契约（实现对象——逐条）

**14.3.1 存储形态与目录**

- sidecar 目录：`{slot 文件路径}.d/`（如 `{hash}.json.3.d/`——与槽文件同目录同前缀）。VSC 侧不可见
  （其 GC 后缀表 / 发现正则 / 迁移重命名均不匹配 `.d`——VSC 勘察 Q6；本批零改动）。
- `meta.json`：`{ "v": 1, "segSize": 100, "identity": <sessionStart|null> }`——段粒度保险 + **会话身份锚**
  （防跨会话采纳——§14.3.4 身份核验）+ 降级标记（`degraded: true`——§14.4 D-R4）；创建时写入一次，
  身份补写/降级置位时重写（小文件；.tmp+rename 原子——修正轮 #1/#6）。
- 段文件：`seg-000001.jsonl`、`seg-000002.jsonl`…（六位零填充，序从 1 递增；只追加、不回改）。
- 行 = 一条消息：`JSON.stringify(slimForDisplay(m))`——与槽 JSON `history` 元素**逐字节同形**
  （投影零转换）。（`slimForDisplay` 自 `session.mjs` 迁入本模块——§14.5 文件表。）
- 追加过滤（与 saveSession 同源）：跳过 `m.transient` 与 legacy-transient 前缀。

**14.3.2 索引与常量（单源 = `src/session-store.mjs`）**

| 常量 | 值 | 语义 |
|---|---|---|
| `RECORD_SEG_MESSAGES` | 100 | 每段消息数（除末段）；绝对序号 i → 段 `seg-{floor(i/100)+1}`、行 `i%100` |
| `RECORD_WINDOW_MESSAGES` | 200 | 内存窗口（条数——与首屏同值） |
| `RECORD_DIR_SUFFIX` | `.d` | sidecar 目录后缀 |

- 总条数 `total`：`(段文件数−1)×segSize + 末段行数`；**末段空文件按 0 行计**（轮转后崩溃的现场）。
- 半行容忍：末段最后一行 JSON 解析失败 → 视为未写完、忽略（读路径逐行容错；不自动修复）。
- 段不可变不变式：仅末段可追加；轮转 = 末段满 segSize 后下一次追加新建下一段（崩溃在「满未轮转」
  与「轮转未写」之间都安全——读侧按上述计数规则还原）。

**14.3.3 store 接口（agent 挂载点 = `agent._recordStore`）**

```
bindRecordStore(agent, { slotFile, identity, baseHistory })  // 绑定 + 身份核验/对账（§14.3.4）——绑定后置 _historyWindow = 200
store.append(msg)          // pushReal 调用（同步；独立 try/catch——尽力面；失败置 _degraded + 停写）
store.total()              // 条数（已落盘）
store.tail(n)              // 尾部 n 条（恢复窗口：只读末段）
store.page(start, end, { margin = 1 })  // 区间取页 + ±1 页沿（§14.3.6）——返回 { messages, base }
store.iterate(dir)         // 方向流式迭代（'newest'|'oldest'——read_history 用）
store.firstUserMessage()   // 标题回退（首条真实 user——段 1 首扫一次并缓存）
store.counters()           // {total, userReal, firstMessage}
saveProjectedSlot(agent, p, fields, contextHistory)  // 流式投影 + 原子写（.tmp+rename；语义同 §2.2）；降级态先追赶（D-R4）
unlinkRecordStore(slotFile)  // 删槽联动（deleteSlot 调用——§14.3.8）
```

- **依赖方向（修正轮 #7）**：store 零项目内依赖（仅 `node:` 内置）——路径以 `slotFile` 参传入，
  `session.mjs` / `session-slots.mjs` 单向引 store（`deleteSlot → unlinkRecordStore` 不构成依赖环）。

**14.3.4 绑定与时点（各调用点）**

| 调用点 | 传入 | 说明 |
|---|---|---|
| 启动恢复（TUI） | `applySession(agent, data, { slot })`（内部 bind：`slotFile = slotPath(cwd, slot)`、`identity = data.sessionStart`） | bin 已钉槽（`bin/thincoder.mjs:297-310`——`resumeSlot` 恒返槽） |
| `/session` 切换 | `applySession(agent, data, { slot: e.slot })`——**仅未被他人活进程占用时**；占用 → 不传（模式 F，首保存 fork 后补绑） | `src/tui/cmd-session.mjs:84-100`（含描述符/标签——§14.3.6） |
| `/new` | `bindRecordStore(agent, { slotFile: slotPath(cwd, slot), identity: agent._sessionStart, baseHistory: [] })`（`newSession` 返回槽后——identity 此时为 null = 待固化） | `src/tui/cmd-new.mjs:9-22` |
| ACP load/new | 同启动恢复/新建（钉槽路径） | `src/acp.mjs:234/281` · `src/acp/session.mjs:18`（save 走同一 saveSession） |
| 首保存补绑 | `saveSession` 内 `agent._slot ??= activeSlot(...)` 之后——若未绑定且有槽 → 绑定（baseHistory = 当前 `_fullHistory` 全量；identity = 当前 `agent._sessionStart`） | 兜底所有未覆盖路径 |

**对账规则**（bind 时——**先验身份、后比计数**；修正轮 #1/#6）：

1. **身份核验（先）**：`meta.identity`（会话身份 = `sessionStart`）vs **现场身份**（= `agent._sessionStart`
   ——恢复/切换后与槽 JSON `sessionStart` 同值；`/new` 后为 null）。两侧**均非空且相等** → 同源进 2；
   **一侧非空一侧为空、或两侧非空不等** → 陈旧/孤儿 sidecar——**不得采纳**：原目录改名
   `{slot 文件路径}.d.stale-<epochms>`（现场保留——与 `.bak`/`.corrupted` 同族），按现场重建
   （物化 `baseHistory`）；两侧**均空**（未固化态）→ 采纳并继续（残余边缘见 §14.8）。
2. **计数对账（后）**：`meta.degraded` 在场 → **以 JSON 为准重建**（清标记——§14.4 D-R4）；否则段总
   条数 < `baseHistory.length` → 以 JSON 为准重建整个 sidecar（rm 目录 → 重新物化；覆盖「VSC 端追加
   过」与「sidecar 缺失」两类）；段总条数 ≥ JSON 条数 → 以段为准（崩溃后未保存消息可见）；两者皆空
   → 新目录（懒创建）。
3. **身份固化**：sidecar 创建时写 `meta.identity` = 现场身份（可为 null）；每次 `saveProjectedSlot`
   时若 `meta.identity` 为空且 `agent._sessionStart` 非空 → 补写。

**14.3.5 数据流（改动后的读写路径）**

```
写：pushReal(msg) → _fullHistory.push + 窗口驱逐(>200) + agent._recordStore?.append(msg)（磁盘）
                 → agent.history.push（机器线——不变）
存：saveSession → 绑定？ → saveProjectedSlot（history = 段流式拼接；contextHistory = 内存）
                 ；未绑定（模式 F）→ 既有全量物化路径（零回归）
恢复：loadSlotFile(JSON) → applySession(agent, data, {slot}) → 绑定（身份核验+对账） → _fullHistory = store.tail(200)
读：read_history（本会话）→ store.iterate（流式，方向/limit 语义不变）
   TUI 恢复 → store.tail(200) + store.total()（描述符）；翻页 → store.page(绝对区间)
```

**14.3.6 TUI 分页契约（TUI 侧同源修正——`TUI.md` §7 + §15；修正轮 #4）**

- 恢复描述符（两调用点统一形态——实现后同步 2026-09-12）：`{ history: <尾窗 ≤200 + ±1 页沿头一条
  （≤201）>, total, base }`——单源 `sessionDescriptor()`（`src/session.mjs:69-78`；两调用点同源）；
  ①启动路径 `bin/thincoder.mjs:338`（`restored`）→ `startup.mjs:226-230`；②`/session` 切换
  `cmd-session.mjs:96-104`。`restoreLines(state, desc)` 读 `desc.history` 建窗（头一条 = ±1 页沿——
  供跨页回合标签判定、不渲染；渲染起点经 `base` 定位 = `history[0]` 绝对序号，缺省按 `total − len`
  推导）、`desc.total` 记 `_historyTotal`；**「N messages」标签口径 = `total`**（非窗口长度；落点
  `startup.mjs:228-230` / `cmd-session.mjs:104`）；未绑定回退传全量数组 + `base: 0`（模式 F）。
- 翻页：锚 = `state._historyTotal`（恢复时点 total；实现复用既有字段——`_historyAnchor` 未落地，
  不新增状态位；coder 披露 #2）；页区间 = `[anchor − loaded − 20, anchor − loaded)`。
  **页沿上下文（±1 边界消息）**：`store.page(start, end, { margin = 1 })` 返回 `{ messages, base }`——
  `messages` = 绝对区间 `[max(0, start−1), min(total, end+1))` 的连续切片、`base` = 切片首条绝对序号；
  渲染层以局部索引 `historyToLines(messages, start−base, end−base)` 复用既有签名——页前一消息供跨页
  回合标签判定（`startup.mjs:26-29`）、页后一消息供 tool_result 配对（`:67-69`）；缺 ±1 = 回归
  「❯ ThinCoder: 标签重复」与页沿工具结果失配。`margin:0` = 精确区间。
- **顺带修复**：活消息增长不再使 `full.length − loaded` 漂移（§14.1 事实 4）。
- 页大小 / 滚轮与 PgUp 双入口 / 滚动补偿 / 三层缓存逐条不变（`HISTORY_PAGE_MESSAGES` 20、
  `INITIAL_HISTORY_MESSAGES` 200）。

**14.3.7 read_history 契约**

- 本会话（无 `path`）：`store.iterate` 流式匹配（`matches` 谓词逐条复用）；`direction=newest` 自尾
  向前、取满 limit 即止（不物化全量）；输出构造/字段/limit 默认值/上限 200 逐字不变（省略数 N 的
  语义面见下方 delta 登记）。
- 跨会话（`path=` / `cwd:`）：**逐字保持**读槽 JSON（投影全量）+ 既有护栏（`READ_HISTORY_SCAN_MAX`
  200k 行 / `READ_HISTORY_MAX_MESSAGES` 50k）——零改动。
- **语义 delta 登记**（修正轮 #5——原「逐字不变」的隐藏面）：匹配基准 = **存储文本（slim 后）**——
  ① 工具结果 >500 字符、工具参数 >300 字符的尾段被 slim 丢弃（`src/session.mjs:88-98`）——落于丢弃段
  的 keyword 不再命中（旧实现匹配未瘦身 `_fullHistory`——`thincoder-core/agent-tools/read-history.mjs:290`）；② 输出截断省略数
  N 按存储文本长度计（`thincoder-core/agent-tools/read-history.mjs:78-84` 的 `t.length − end`）——对已带 `truncated for storage`
  标记者 N ≈ 存储标记长，不反映原始丢弃量。修输出层（剥离存储标记/携带原长）需另存原长或回读槽
  JSON——收益低，**登记不修**；真实丢弃量以存储全文为准。
- 未绑定（测试/模式 F）：回退内存 `_fullHistory` 过滤（既有实现保留）。

**14.3.8 生命周期与移植**

- 删除：`deleteSlot` → `unlinkRecordStore`（`rmSync(dir, {recursive, force})`——`thincoder-core/session-slots.mjs:400-415`）。
- **轮转/改名路径的 sidecar 处理（修正轮 #1）**：① `.bak` 轮转（`guardForeignSlotFile`——
  `session-guard.mjs:29-35`）对**非本会话活动绑定面**联动改名 sidecar（`{p}.d → {bak}.d`，若存在；
  「本会话活动绑定面」判据 = `agent._recordStore?.dir === {p}.d`——该情形跳过，防拔掉活动存储）；
  ② `.corrupted`/`.unreadable` 改名（`session.mjs:186-230`）**不联动**——现场原地保留，该槽 sidecar
  由身份核验在槽号回收/复用时拒采纳（§14.3.4）；③ **孤儿 sidecar**（对端删除留下的——VSC 不可见/
  零改动）在 bind 身份核验处被拒并改名 `.stale-*`；stale 在冷目录随 GC。
- 冷项目 GC：`deleteColdCwd` 对目录项用 `rmSync`（现 `unlinkSync` 对目录静默跳过——`thincoder-core/session-gc.mjs:151-159`）；
  `listColdCwds` 的 `files` 仍只计文件（数据文件判定不变）。
- `/rename`：只改标题（`session-rename.mjs:16-38`）——sidecar 零动作。
- 目录/阈值无机器特定常量（N-S5）；`_setSessionsDirForTest` 缝可注入测试目录。

### 14.4 关键决策记录（含否决备选）

- **D-R1 存储 = 定长分段 JSONL sidecar**（表 1 候选 3）：`{hash}.json.{N}.d/` + `seg-*.jsonl` +
  `meta.json`；已写段只读、末段追加。否决：JSON 内窗口化 / 单文件 offset 索引 / 字节触发清单 /
  全档 offset（表 1）。
- **D-R2 窗口 = 200 条**（表 2）：与首屏同值；驱逐 = 入窗即 shift。否决 500/1000、字节窗、无窗。
- **D-R3 投影 = 流式拼接**（表 3）：段行逐字节同形 → 免重序列化；原子写语义与 `writeSessionFile`
  同族（本模块自带实现 + 指针注释——不引 session-slots 依赖环）。
- **D-R4 追加 = pushReal 同步；失败 = 降级（失败即停 + 标记 + 追赶）**（表 4；修正轮 #6——原
  「下次保存对账自愈」表述不成立：投影源 = store，两侧同缺无修复路径）。① append 失败 → `_degraded`
  置位 + **追加停写**（store 恒为连续前缀——杜绝中段缺口破坏段/行算术与 total 口径）；② store 维护
  `_memTotal`（pushReal 计数——含未落盘条）：保存时若 `_memTotal > store.total()` 且缺口 ⊆ 窗口容量
  → 先从窗口**追赶重试**追加（成功即完全恢复）；窗口已滑过缺口 → 不补写（宁停写不写洞）；③ 追赶
  失败 → 降级保存：投影照 store 前缀 + `meta.degraded` 标记 + stderr 一行诊断；④ 恢复面对账见标记
  → 以 JSON 为准重建（清标记）。内存窗口外未落盘条不可恢复（尽力面——N-S6；如实登记 §14.8）。
- **D-R5 投影保持全量（VSC 红线）**：`version` 2 / `history` 全量数组 / `contextHistory` 逐字节
  保持——VSC 零改动（§14.9）。
- **D-R6 模式 F（未绑定）零回归**：`_fullHistory` 全量数组 + `saveSession` 旧路径逐字保留——
  `thincoder chat` / 测试 / 未覆盖路径行为不变。窗口仅在「绑定」或「depth>0 子代理」
  （子代理面见 `AGENT-LOOP.md` §23）时启用。需求侧范围注同此（`../requirements/SESSION.md` §14.1
  F-S2 判定句——修正轮 #8）。
- **D-R7 对账 = 计数比较**（段 vs JSON）：不做逐条校验（成本高、收益低）；同长异容的退化面
  如实登记（§14.8 边界）。
- **D-R8 本会话检索走存储、跨会话保持 JSON**：`path=` 换轨收益低（JSON 仍有护栏），并避免
  「外部 slot 的 sidecar 解释权」扩展面。否决「统一走存储」。

### 14.5 受影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11；交付实测行注 = 2026-09-12）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `thincoder-core/session-store.mjs` | 新 → 442（交付实测） | +280 ± 40 | 全新模块：段 IO / 索引 / 窗口 / 绑定对账 / 投影写 / 流式迭代 / 生命周期。实现后同步（2026-09-12）：越 300 咨询线——登记、不拆（新增档口径——见拆分结论） |
| `thincoder-core/session-segments.mjs` | 新 → 101（交付实测） | —（拆分产物） | 段 IO 原语 + 人读线条目形态（`slimForDisplay`/`isLegacyTransient`/`shouldAppend`/`isRealUserMsg`）+ `_storeStats`；store 越 500 硬限后按职责拆出——公开名 re-export、调用面零改（实现后同步 2026-09-12） |
| `thincoder-core/session.mjs` | 476 | +8 / −26 → ~458 | `slimForDisplay`/`isLegacyTransient` 迁出（re-export）；saveSession 分支；applySession `{slot}`（bind：`slotFile` + identity——修正轮 #1）；reset 解绑；首保存补绑 |
| `thincoder-core/session-slots.mjs` | 490 | +~3 | `deleteSlot` → `unlinkRecordStore`（删除联动——修正轮 #7） |
| `thincoder-core/session-guard.mjs` | 48 | +~5 | `.bak` 轮转时 sidecar 联动改名（非活动绑定面——§14.3.8；修正轮 #1） |
| `thincoder-core/context.mjs` | 382 | +12 | pushReal：窗口驱逐 + `store.append`（独立 try/catch） |
| `thincoder-core/session-gc.mjs` | 215 | +8 | `deleteColdCwd` 目录 `rmSync`（递归删除 sidecar） |
| `thincoder-core/agent-tools/read-history.mjs` | 295 | +35 → ~330（越 300 软线——登记；不拆） | 本会话走 `store.iterate`；未绑定回退保留 |
| `thincoder-core/generate-title.mjs` | 83 | +4 | 首条 user 回退 `store.firstUserMessage()` |
| `bin/thincoder.mjs` | 406 | +8 | `applySession(…, {slot})`；`restored` 描述符（尾窗+total） |
| `src/tui/startup.mjs` | 266 | +25 → ~291（近 300——登记） | `restoreLines(state, desc)`（`desc = {history, total, base}`——§14.3.6）；`createLoadOlder` 存储读 + 绝对锚 + ±1 页沿（修正轮 #4） |
| `src/tui/index.mjs` | 455 | +4 | 接线（描述符/初始值） |
| `src/tui/cmd-session.mjs` | 103 | +6 | 切换绑定（占用分支不绑）+ 描述符 `{history, total, base}` 与标签 total（§14.3.6；修正轮 #4） |
| `src/tui/cmd-new.mjs` | 34 | +3 | `/new` 绑定空 base |
| `src/acp.mjs` | 448 | +6 | load/new 绑定（钉槽路径） |
| `test/session-store.test.mjs` | 新 | +280 ± 40 | 用例表 1:1（快层——temp 目录注入） |
| `test/integration/session-resume.test.mjs` | 156 | +30 | 端到端：恢复→翻页→检索→保存 往返 |

> 拆分结论：全部触碰档 ≤500 硬限；`read-history.mjs`（~330）与 `startup.mjs`（~291）越 300 咨询线
> ——单点追加、不拆（同口径 §12.3）。`session-store.mjs`（交付 442——实现后同步 2026-09-12）越 300
> 咨询线——登记、不拆（新增档口径：本批新档单点开档、职责单一；越 500 硬限时已按职责拆出
> `session-segments.mjs`（交付 101），余部为 store 核心）。`session-slots.mjs`（490）**+~3**——仅
> `deleteSlot` 一行 `unlinkRecordStore` 调用（删除联动——修正轮 #7）；**原子写实现仍放 store 模块内**
> （store 零项目内依赖——路径经 `slotFile` 传入，避免依赖环；语义指针注明同族）。

### 14.6 用例表（正常 / 边界 / 错误——映射需求号）

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T-RS1 | 快层 unit | 追加与计数 | 空 store 追加 250 条（3 段） | `total()==250`；`seg-000001` 100 行、`seg-000003` 50 行；`tail(200)` = 第 51–250 条且逐条相等 | F-S1/F-S2 |
| T-RS2 | 快层 unit | 窗口驱逐 | 模拟 pushReal 300 条 | `_fullHistory.length == 200` 且为最新 200；`store.total()==300` | F-S2/N-S1 |
| T-RS3 | 快层 unit | 取页（含 ±1 页沿） | total=250：`page(30,50)`（默认）/ `margin:0` 变体 | 默认：含 ±1 页沿的连续切片（第 29–50 条、`base=29`）；`margin:0`：第 30–49 条（跨段边界正确） | F-S3 |
| T-RS4 | 快层 unit | 重建对账（JSON 更长） | sidecar 50 条 + baseHistory 120 条 | 目录重建；total==120；旧段文件不再存在 | F-S5 |
| T-RS5 | 快层 unit | 对账（段更长） | sidecar 130 条 + baseHistory 120 条 | 不重建；total==130；恢复窗口 = 段尾部 | F-S5 |
| T-RS6 | 快层 unit | 半行容忍 | 末段尾行截断的 JSON | 读取忽略尾行；total 少 1；不抛 | F-S5（错误） |
| T-RS7 | 快层 unit | 投影逐字节 | 与旧实现同输入的对照 | `history` 数组内容与旧实现（slim 全量）逐条相等；`version==2` | N-S3 |
| T-RS8 | 快层 unit | 流式检索 | total=500，keyword 命中 3 条（含窗口外） | newest：恰 3 条、序正确；oldest：同集反序；limit 语义不变 | F-S4 |
| T-RS8b | 快层 unit | 长内容检索（delta 登记） | 工具结果 2,000 字符：keyword 仅在 900 字符处（>500）／仅在 100 字符处 | 900 处：不命中（存储文本截断——delta 登记）；100 处：命中（省略数 N 按存储文本计） | F-S4（delta） |
| T-RS9 | 快层 unit | 删除联动 | `deleteSlot` | sidecar 目录不存在；`session gc --confirm` 清冷前缀后不存在 | F-S6 |
| T-RS10 | 集成 | 恢复→翻页→检索→保存 | 真实槽文件 + 200+ 条 | 恢复尾窗 200 + 标签 = total（非窗口长）；翻页至最早（跨页回合标签不重复、页末 tool_result 配对不破）；read_history 命中窗口外；保存后 JSON `history` 全量、sidecar total 不缩 | F-S3/F-S4/S5 |
| T-RS11 | 快层 unit | 未绑定模式 F | 无 store 的 agent | pushReal 全量数组 + 旧保存路径逐字（负断言：无 sidecar 写入） | D-R6/N-S2 |
| T-RS12 | 快层 unit | 身份核验（陈旧/孤儿拒绝） | sidecar `meta.identity=S1`（含段）+ 现场身份 S2（或 null） | 不采纳：total = JSON 条数；原目录改名 `{slot}.d.stale-<ts>`；旧内容零进入（修正轮 #1） | F-S5 |
| T-RS13 | 快层 unit | 身份固化 | 全新 sidecar + 首次保存（`agent._sessionStart=S1`） | `meta.identity` 补写 = S1；再 bind（现场 S1）→ 采纳对账（段≥JSON 语义不变——修正轮 #1） | F-S5 |
| T-RS14 | 快层 unit | 降级（失败即停/追赶/标记/重建） | 只读目录注入 append 失败 → 恢复可写；另组持续失败 | 失败不抛 + `_degraded` + 段内容冻结（无新行——负断言）；保存→追赶成功（`_degraded` 清）；持续失败→ `meta.degraded`；bind 见标记 → 以 JSON 为准重建（清标记——修正轮 #6） | N-S6 |

### 14.7 验收标准（逐条回指需求——每条可机器验证）

| AC | 回指 | 判据（机验） |
|---|---|---|
| AC-RS1 | F-S1 | T-RS1 绿（段/行结构 + append-only 不变式）；pushReal 为唯一追加点（grep：`append(` 单调用点）——该判据面已退场（整删，删除记录 = `TESTING.md` §11.3） |
| AC-RS2 | F-S2/N-S1 | T-RS2 绿；`RECORD_WINDOW_MESSAGES` 单源且 = 200 |
| AC-RS3 | F-S3 | T-RS3/T-RS10 绿（含 ±1 页沿与滚动补偿）；翻页只经 `store.page`（grep startup.mjs 无 `full.length`） |
| AC-RS4 | F-S4 | T-RS8/T-RS8b/T-RS10 绿；跨会话 path= 分支零 diff（对照既有 read-history 用例） |
| AC-RS5 | F-S5 | T-RS4/T-RS5/T-RS6/T-RS12/T-RS13 绿（身份核验先于计数对账） |
| AC-RS6 | F-S6 | T-RS9 绿 |
| AC-RS7 | N-S2 | 既有族全绿：`test/integration/session-resume.test.mjs` + `test/read-history-guard.test.mjs` + `test/acp-channel.test.mjs` + 快层全量 |
| AC-RS8 | N-S3 | T-RS7 绿 + `version`/`contextHistory` 字段断言（VSC 兼容面） |
| AC-RS9 | N-S4 | T-RS10 中恢复只读末段（注入计数：bind 后段读次数 ≤ 2） |
| AC-RS10 | N-S5/N-S6 | 常量 grep 单源；T-RS14 绿（失败即停/追赶/标记/重建四断言——修复路径 = 追赶重试或 bind 重建，非「下次保存对账自愈」；修正轮 #6） |

### 14.8 边界（本批不做）与登记项

- 不做：机器线跨保存点的崩溃恢复（机器线仍受保存时点约束——如实边界）；sidecar 的压缩/清理
  策略（与槽文件同生命周期；`session gc` 兜底）；同长异容对账（D-R7）；跨端 sidecar 协议；
  `thincoder chat` 的会话化。
- 登记（修正轮 #1/#6）：身份均空（未固化）× 人为删槽文件的残余边缘——孤儿 sidecar 无法与「本会话
  未保存现场」区分（按采纳处理）；stale/孤儿目录在活跃目录保留现场（冷目录随 GC——`deleteColdCwd`）；
  降级后内存窗口外未落盘条不可恢复（尽力面——D-R4④）。
- 登记项（转 `docs/TODO.md` 技术待办——主 agent 落档）：C5 `/undo` 快照字节上限；C6 `_advisorRuns`
  逐实例回收；C7 小容器族（`_asyncTombstones`/`turnControllers`/`frozenSubKeys`/capturedConsole）。

### 14.9 VSC parity 影响评估（本批 CLI 单端——评估非改动）

- **读面**：VSC `loadSlot` 读 `history`/`contextHistory` 全量——本批 CLI 投影保持全量数组与
  version 2 → **零可见变化**；sidecar 不进入 VSC 枚举面（GC 后缀表 / 发现正则 / 迁移重命名均
  不匹配——VSC 勘察 Q6）。
- **写面**：VSC 继续全量覆写槽 JSON（F2 轮转守卫 `disk.history.length > data.history.length`）——
  CLI 侧对账规则（§14.3.4）保证下次 CLI 绑定时：身份匹配 → 以更长者为基准（采纳或重建）；
  身份不匹配（对端新会话占用同槽）→ 拒采纳重建（sidecar 随现场改名——修正轮 #1）。
- **登记（另案）**：VSC 若日后要共享同一「磁盘为准 + 窗口」机制，其读面须改 sidecar 协议；
  本批不做（`MULTI-END` 级变更）。

### 14.10 物证回填钩（同事报告到达后归因回填——写明落点）

- 物证 = 同事回传的 Node 诊断报告 JSON（`report.*.json`）+ `tui-stderr-*.log`（取证批已固化）。
- **回填落点**：① 本节 §14.1 表追加「物证归因」行——判定主导项（爬升型 = C1/C2 类结构性无界；
  尖峰型 = C4 类在途拷贝；两型并存则排序）；② 若主导项超出本批 A/B 档设计面 → 以该行证据打回
  主 agent 立项（C 档扩容或新批）；③ 批次档 §6 收口行同步（父侧）。
- 回填时机：物证到达当日（Docs Capture the Conversation）。
