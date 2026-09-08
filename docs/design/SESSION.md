# VS Code 会话持久化与恢复（SESSION）

> 板块：会话存储（VS Code 端实现）。状态：**当前态规格**（2026-09-08 由
> ARCHITECTURE §4 迁出并对照 `src/extension/` 会话模块核实写全——DOC-REORG-VSC 批 3）。
> 与 CLI `SESSION.md` 同名对应同一"会话持久化与恢复"机制板块——各端独立实现，
> 内容以本端代码为准（用户裁定：两端文档各自独立完整，不互指、不复制共享正文）。
> VS Code 与 CLI 共享同一磁盘存储契约（文件格式/槽位/并发防护），本档是 VSC 端
> 权威源。
> 权威源（VS Code）：`src/extension/session-slots.mjs`（manifest/认领/端 marker/
> resumeSlot/claimSlot/allocateFresh 原语）、`session-io.mjs`（槽文件读写/slimForDisplay/
> listSlots/switchToSlot/newSlot/saveSessionToSlot/historyWindow——重导出）、
> `history-window.mjs`（懒历史窗口/配对/isRealUserMsg——SESSION-RESTORE-PARITY 拆分）、
> `session-gc.mjs`
> （残留 GC + 冷 cwd 原语）、`session-slot-write.mjs`（会话级标志位写面）。
> 装配（VS Code）：`src/extension/panel-session.mjs`（面板会话持久化/分页/切换）、
> `panel-project.mjs`（项目切换重绑）、`panel-messages.mjs`（消息路由/打开历史会话/
> 手动改名）、`chat-panel.mjs` / `panel-chat.mjs` / `panel-callbacks.mjs`（turn 槽
> 捕获与回合尾保存）。
> 关联：ARCHITECTURE.md（§2 整体架构/§3 模块地图——ARCHITECTURE 2026-09-08 瘦身收官，源节已删）、
> CONTEXT-COMPACTION.md（压缩/机读线）、ENGINEERING-MODE.md（eng slot 字段、
> engDesignToken 多槽表写入）。

## 变更记录

- 2026-09-09：§9 懒历史节改写——SESSION-RESTORE-PARITY 交付（恢复链对齐 CLI：assistant
  帧容器模型 + 嵌套工具卡/配对跨页/reminder 剔除/turnStart 可见前驱/首窗 200/ts 兼容
  读/首屏 welcome 移除——权威源不滞后）。
- 2026-09-09：§7 标题触发时机修订——A2（SESSION-FLOW-A 方案 Y——用户裁）：标题生成
  上移回合尾 finally 忙态归位之前（标题窗口 = running——路由守卫排队 + webview Stop
  显——修无池首回合并发/有池首回合消化劫持；错误不外抛——归位恒执行）。
- 2026-09-08：DOC-REORG-VSC 批 3——从 ARCHITECTURE §4 迁出正文，对照 VSC
  src/ 会话模块（session-io/session-slots/session-gc/session-slot-write/panel-session）
  核实实现细节写全本端独立文档。ARCHITECTURE §4 不删（留后续瘦身批）。历史变更
  流水（2026-08-22 ~ 2026-09-07 的 12 位 hash 迁移/会诊 F1-F6/.bak 轮转/端分离 R4/
  残留 GC §12/懒历史）已按机制并入对应章节，折叠为本记录。


## 需求段（2026-09-08 用户裁定——agent 生命周期对齐 CLI——快车道设计入口）

> 状态：需求定稿（2026-09-08——评审 #1：状态指针修正）。设计正文在 AGENT-LOOP.md §11（评审通过待 sign-off）——本段为需求记录，不再另建 §12。

### 总体需求

VSC 顶层 agent 生命周期从"每轮 runAgent 重建 + opts.engState/agentState 每轮进出搬运"改为 **CLI 式"面板会话级单例复用"**——一次创建、跨回合复用同一 agent 对象、状态内存携带、回合尾落盘。砍掉 VSC 因"每轮重建"被迫背的补丁链（opts 状态搬运/回合尾 agentState 序列化/多槽 merge/restore 恢复），消除"内存有盘上无/盘有内存无"类跨实例状态漂移（2026-09-08 批 1 异步评审 token 未注册实证——根因即 per-run 重建 + 落盘链复杂）。

### 功能性需求（As a… I want… so that…）

- **F1（会话级单例）**：As a VSC 面板用户, I want 同一面板会话的顶层 agent 只在首轮创建、后续回合（含 Ctrl+I/Continue 续跑）复用同一对象, so that agent 内存状态（_engDesignTokens/_tasks/guard 标记等）跨回合天然携带——不因回合边界丢失或漂移。
- **F2（状态零搬运）**：As a 开发者, I want 砍掉「每轮经 opts 把状态搬进全新对象」的搬运（opts.engState/agentState 进出 + setup 恢复读侧——评审 #8 修正：onComplete 落盘链保留——见 N3）, so that 状态只有一份内存源（agent）+ 回合尾盘同步——消除双载体不一致。
- **F3（盘权威保留）**：As a 开发者, I want 保留每回合尾盘同步 + 会话切换/新会话/换项目/退出落盘, so that VS Code 扩展进程被杀/崩溃/重载不丢状态（VSC 进程生命周期不可控——不能完全 CLI 式只退出存）。
- **F4（生命周期边界）**：As a 开发者, I want 会话切换/新会话/删除/换项目时销毁常驻 agent（agent 内存态随之清理）, so that 不串会话（agent 不跨 session 复用）。

### 非功能性需求

- N1（对齐 CLI 模型）——agent 会话级单例 + 回合复用（CLI：make-agent 建一次 → state._agent → agent-turn 复用）；续跑循环同 agent 只重建 abort controller。
- N2（状态一致性）——单内存源 + 回合尾盘同步；消除内存/盘双载体漂移（批 1 实证类）。
- N3（对话持久化不退化——2026-09-08 澄清：每轮 saveLines 是**对话持久化刚需**（fullHistory/contextHistory——CLI 回合尾 saveSession 同款），非"防 agent 状态丢"保险——agent 常驻后照样每轮写，与本改造无关。engDesignTokens 专门落盘（settle 当场）run 外触发——同样不受 agent 生命周期影响）。
- N4（子代理不动）——子代理本是一次性 runAgent（非面板常驻）——本次只改顶层（depth-0 面板会话 agent）。
- N5（per-run 字段语义保持）——_advisorRound/_verifiedThisRun 等回合级计数器语义不因 agent 复用而错（回合边界重置逻辑需显式化——CLI 侧同款）。

### 待设计澄清（设计时定）

- 首轮 setup 与后续轮的字段复位清单（哪些 per-run 字段回合尾要清、哪些会话级保留）
- runAgent/setupAgentRun 签名改造（复用 agent 的入口形态）——新增常驻 agent 后 setup 只做首轮
- panel._agent 持有 + loadSession/新会话/切换/项目重绑的销毁接线
- 回合尾落盘保留形态（agent 内存 → 盘同步——复用现有 saveLines 通道还是简化）

---

---

## 1. 存储模型与目录形态

- **按 cwd 隔离**：会话目录 `~/.thincoder/sessions/{sha1(cwd)}.json.*`——目录键 =
  cwd 的**完整 40 位 sha1**（非截断），`cwdHash` 以 `normalizeCwd(cwd)` 为输入。
- **Windows 盘符大写归一化**：`normalizeCwd` 把 `d:\…` 归一为 `D:\…`——扩展的
  `uri.fsPath` 会小写盘符，直接 hash 会与 CLI 的 `process.cwd()` 算出不同 hash，
  归一化保证两端得到同一目录键。
- **槽位制，无"当前文件"**：`{hash}.json.N` 是第 N 个槽位的完整会话；
  `{hash}.json.manifest` 存槽位元数据 + active 指针 + 进程认领表 `slotSessions`。
- **文件无上限**：槽位按需递增（面板新建/打开历史会话按需分配新号）。
- **旧短 hash 一次性迁移**（`session-slots.mjs migrateHashLength`）：历史 hash 算法
  双端各不同（CLI 曾 `sha1(cwd).slice(0,12)`、VS Code 曾 16 位、盘符大小写各别），
  迁移候选组合 5 个（原 cwd/小写 cwd 各取 12/16 + full 前 12）逐一遍历重命名到完整
  40 位 hash；幂等（首访执行，已迁移 hash 记入 Set 短路——防每次 slotPath 都重跑
  5 候选 × 后缀的系统调用）。
- legacy `{hash}.json`（v1 单会话）/ 旧 `messages/` 目录已废弃（见 §11）。

目录形态（与 CLI 同）：

```
~/.thincoder/sessions/
  {hash}.json.N                    # 槽位会话文件（N 从 1 递增）
  {hash}.json.manifest             # 槽位元数据 + active 指针 + slotSessions 认领表
  {hash}.json.manifest.vscode      # 本端记录 end marker（§3——本端单写者）
  {hash}.json.manifest.cli         # CLI 侧 marker（VSC 端只读不写）
  {hash}.json                      # legacy v1 单会话（读取时迁移进槽位）
  {hash}.json.N.tmp / .corrupted / .unreadable / .bak-* / .manifest.corrupted
```

## 2. manifest：槽位元数据与并发防护

### 2.1 manifest 结构

`loadManifest`/`saveManifest`（session-slots.mjs）管理单一 manifest 文件：

```jsonc
{
  "slots": { "1": { "ts": 1754200000000, "messageCount": 12, "turnCount": 4,
                    "firstMessage": "…", "activeProvider": "deepseek",
                    "updatedAt": 1754200000000, "title": "…" } },
  "active": 1,                  // 共享当前指针（跨端回退高亮/旧版/ACP——见 §3.3）
  "sessionId": "pid-ts-rand",   // 进程认领身份（slotSessions 属主值来源）
  "slotSessions": { "1": "pid-ts-rand", "2": "pid-ts-rand2" }
}
```

- **条目级合并写**（saveManifest，2026-09-01 CLI 同步）：写前重读磁盘，按
  `{...fresh.slots, ...(m.slots)}`、slotSessions 同理合并——原实现整对象写回在
  CLI/扩展双进程并发时窗口内对方的变更被覆盖抹除（被抹认领的槽变"文件在、无属主"→
  第三方可认领 → 双属主）。
- **删除意图经 `deletions` 显式表达**：deleteSlotAndUpdate/死主清理（cleanDeadOwners）
  把待删键经 `deletions` 参数传给 saveManifest——否则条目级合并把磁盘死条目从 fresh
  复活回写，仅传 m 等于没删。
- **active 是单值**：只有显式翻指针的调用点（ensureActive 分支、allocateFresh、
  claimSlot、newSlot、switchToSlot、删除 active）传 `setActive`；其余调用点
  （saveSessionToSlot 摘要更新、会话级标志位写）默认保留磁盘 fresh.active——否则
  毫秒窗口内回滚并发方刚翻的指针。

### 2.2 认领与属主

- **sessionId**：每扩展宿主进程唯一 `pid-timestamp-random`（getSessionId），作为
  manifest `slotSessions` 的认领值。
- **activeSlot（CLI parity 保留导出，VSC 面板不直调——内部经 ensureActive）**：认领序分三支
  ——① 当前 active 空闲/本进程/死主 → 复用；② **文件缺失的空槽号**（不认"最小空闲
  号"——死主旧槽文件仍在会 resume 进陌生会话且覆盖）；③ 全被活进程占用时开新槽（新号
  从 max+1 起，跳过活认领号/现存文件号；max 取 `allSlots[last]` 而非 `Math.max`
  spread——数万槽位时 RangeError 风险）。VSC 面板的恢复/绑定一律经 resumeSlot
  （§3）——ensureActive 的分支 ②/③ 语义抽取为 **allocateFresh**（resumeSlot 全新分配
  复用，§3.2 步骤③）；activeSlot/allocateFresh/claimSlot 保留导出仅供 CLI parity 与
  测试（ensureActive 为 session-slots 私有函数；VSC src/ 无面板直调点）。
- **死主条目清理**（cleanDeadOwners——ensureActive 与 resumeSlot 直接调用，后者把
  deadParam 下传 claimSlot/allocateFresh）：
  删除 owner 已死的 slotSessions 条目。纪律：死主判定必须跑 `isProcessAlive`——
  不能以"文件缺失"短路（活进程在"认领→首次保存"窗口文件暂缺，误删会致双进程同槽）；
  清理落盘必须传 deletions（deletions 过滤刚重新认领的槽——防删掉自己的新属主）。
- **isProcessAlive(pid)**：Windows `tasklist /FO CSV /FI "PID eq {pid}" /NH`，按 CSV
  第 2 列（PID）精确比对（避免旧 includes 对镜像名含"数字+空格"的贪婪误判）；
  Unix `kill(pid, 0)`。
- **slot 粘性**：面板 `_slot` 在打开/切换时**绑定一次**，之后所有读写不再重读共享
  manifest 的 active 指针（可被并发运行的 CLI 改动）——保证首认领槽固定、内容不因
  并发方翻 active 静默迁移。
- **slotOccupancy(cwd, slot)**：目标槽是否被**另一活进程**占用——**排除本进程属主**
  （owner === getSessionId() → 视为空闲）；面板在"打开历史会话"钉槽前检查（§5.1）。

### 2.3 写盘防护（原子写 + 现场保全）

- **原子写**（writeFile）：先写 `.tmp` 再 rename——跨盘失败降级 unlink+rename → 直写
  ——防中途崩溃产生截断 JSON。
- **`.corrupted` 兜底**：读失败的槽文件改名 `.corrupted` 保留现场不覆盖；解析失败的
  manifest 在 saveManifest 时改名 `.manifest.corrupted` 保留——否则覆盖后全部槽位
  元数据丢失，会话列表变空。
- **`.unreadable` 保留**：version/history/cwd 结构校验失败改名 `.unreadable` 保留
  （否则绑定槽后下次保存直接覆写）；**version > 2 的新版文件不动**；cwd 不匹配
  （别人的文件）也不动（loadSlot——见 §4.1）。
- **孤儿 .tmp 恢复**：主文件缺失时读 `.tmp` 回退（rename 前崩溃现场——loadSlot）。

## 3. 端分离恢复：本端 end marker + resumeSlot 认领

> 机制镜像 CLI SESSION §10（双端同批落地）。CLI 与 VS Code 面板同开同一项目时，共享
> manifest 的 active 指针两端互写——退出重进会恢复进"不是退出前"的会话。每端自己的
> 恢复目标 = 自己的端 marker 文件；`manifest.active` 保留为共享指针（旧版端/ACP 语义
> + 列表回退高亮），不再作本端恢复第一依据。

### 3.1 端 marker（D-1）

- **路径**：`{manifest}.vscode`（VS Code）——本文件 `END = "vscode"` 常量
  （session-slots.mjs）；CLI 写 `.cli`，本端**只写 `.vscode`**、永不触碰 `.cli`。
- **内容**：`{"slot": <number|null>, "updatedAt": <epoch ms>}`。
- **三态读语义**（readEndMarker）：文件缺失 → null（从未记录 = 升级/首用迁移窗口，
  可触发一次性继承）；JSON 解析失败/结构非法（损坏）→ 按"缺失"降级——**不 rename
  不 unlink**（幂等、不误伤），可能触发一次继承；`slot: null` = 显式置空（删过本端
  记录槽——**绝不触发继承**）。
- **写**（writeEndMarker）：原子 `.tmp`+rename（复用 writeFile），失败容忍（NF2——
  写失败按无记录路径降级，不影响会话数据）。
- **写者**：仅本端——零跨端写竞争；旧版端不认识、永不触碰该文件（版本安全）。

### 3.2 resumeSlot 恢复决策（D-2）

面板每次打开/切换/新建项目后 `_slot` 为 null，经 `resumeSlot(cwd)`（session-slots.mjs）
解析一次并钉槽。判据：

```
m = loadManifest(cwd)；死主清理（cleanDeadOwners）；rec = readEndMarker(cwd)
① rec.slot ≠ null 且 slot ∈ m.slots 且槽文件在盘 且属主 空/死/本进程
   → claimSlot(rec.slot)
② rec === null（文件缺失 = 从未记录——迁移窗口）：
   ②a m.active 属主 = 本进程（同进程重入——ensureActive 早退语义镜像：认领后
       尚未写 slots 条目/文件的窗口）→ 直接沿用；
   ②b 否则一次性继承 manifest.active（同判据；属主为活进程绝不继承 → 全新槽起步）
③ 其余一切（slot:null 显式置空 / 槽被删 / 属主为活外人 / 继承失败）
   → allocateFresh（全新分配）
每次落点都写本端记录；claim 后读槽失败（.corrupted/.unreadable——loadSlot 既有
改名保全语义）→ 保持已 claim 槽 + data:null——不回滚认领、不改 marker——下次保存
原地重建该槽，旧现场以 .corrupted/.unreadable 保留。
```

- **claimSlot(cwd, slot)**：置 `slotSessions[slot] = 本进程` + `m.active = slot` +
  saveManifest setActive（认领即翻共享指针）。
- **`slot:null` 绝不继承** 的理由：用户删除自己会话后重开 = 全新起步，不继承对方
  遗留、不复活被删会话。
- 全新目录首用**不再预写空会话文件**——claim 先行，文件在首保存落盘（与 CLI 语义
  对齐）。

### 3.3 marker 维护点（D-4/D-5）

- **写点**：`resumeSlot`（D-2 每步结尾写）；`newSlot`（面板新建）；`switchToSlot`
  （面板"打开历史会话"成功——跟随"最后查看的槽"）；`deleteSlotAndUpdate` 删到本端
  记录槽 → `writeEndMarker(cwd, null)`（文件保留、slot 置空——不 unlink）。
- **非写点**：日常保存（面板 `_slot` 粘性已定——保存永不参与 marker 竞争）。
- **列表本端高亮**（pushSessions D-5）：会话列表本端高亮以本端记录槽为准
  （● = 记录槽 ∈ 列表 ? 记录槽 : manifest active 回退——含"记录槽已被对端删除"的
  守卫）；listSlots 的 manifest active 语义保留（跨端回退高亮 + 旧版/ACP 零变化）。

## 4. 会话文件读写

### 4.1 loadSlot（读校验与现场保全）

共享读槽校验（恢复/切换/打开历史共用），无认领副作用：

- cwd 先行——`data.cwd.toLowerCase() !== cwd.toLowerCase()` → null（别人的文件，
  **不动**——优先于结构校验）。
- `version` 非 1/2：`version > 2`（新版 CLI 文件）→ null 不动；否则改名 `.unreadable`。
- `history` 非数组 → 改名 `.unreadable`。
- 读时过滤 legacy transient 注入（`isLegacyTransient`——`[System reminder: working
  directory snapshot:` / `[Relevant memories from previous sessions` 开头 user 消息）
  ——旧 CLI 写入的机器注入残留不得进面板 UI/播种机器线。
- 解析失败：`.tmp` 回退优先；回退成功则主文件改名 `.corrupted`、`.tmp` 提升为正主；
  主文件缺失时恢复孤儿 `.tmp`（rename 前崩溃现场）。

### 4.2 会话文件内容（v2 双线）

```jsonc
{
  "version": 2,            // 格式版本（1 = 旧单线；2 = 双线；>2 的新版文件只读不动）
  "cwd": "D:\\teamcode",   // 会话目录（hash 依据；恢复校验"是不是别人的文件"）
  "title": "…",            // 会话标题（会话列表显示；自动标题见 §7）
  "activeProvider": "deepseek",
  "activeModel": null,
  "updatedAt": 1754200000000,  // epoch ms
  "history": [ /* 人读线：完整真实消息（UI 渲染 + 恢复显示读它） */ ],
  "contextHistory": [ /* 机读线：可能已压缩的模型上下文（恢复后保留压缩收益） */ ],
  "tasks": [],
  "planMode": false,
  "autoApprove": false,
  "engineering": false,        // slot 为工程模式权威源（§6）
  "engDesignToken": null,
  "engDesignTokens": null,     // 多槽表 {designId: token}（async 评审 settle 记账）
  "advisor": { "guard": false },
  "pendingReminders": [],
  "sessionStart": 1754200000000  // 会话身份打点（覆盖防护依据 §4.4）
}
```

### 4.3 双线写入契约 + slimForDisplay

装配点 `saveLines`（panel-session.mjs，经 chat-panel `_saveLines` 由回合尾
onComplete/finally 调用）以 `...existing` 展开式透传不认识的字段、仅覆盖扩展自己
拥有的字段（字段往返完整见 §6）。双线过滤：

- `keepReal = !m.transient && !isLegacyTransient`（人读线 history——editor context
  /time reminder 等 transient 注入落盘时过滤）；
- `keepMachine = !isLegacyTransient`（机读线 contextHistory——**transient 保留**：
  恢复必须逐字节重建 provider 前缀缓存所见的序列；丢 transient 会让每次重启在首个
  注入位漂移 → 首请求整前缀缓存 miss）。

`saveLines` 对 history 做 `slimForDisplay`（copy-on-write 映射——**绝不原地改**，
两线经 pushReal 共享对象引用，原地改污染机读线与 provider 前缀缓存）：

- `assistant.tool_calls[].function.arguments` 截 300 字符（head + `…`）；
- `tool` 消息 content 截 500 字符（head + `… (truncated for storage)`）；
- 多模态 user content 数组：保留 text part，丢弃 image_url base64 part；
- **`contextHistory` 一字不动**——与 provider 前缀缓存逐字节一致（实测 18MB 会话
  重存大幅缩水）。historyWindow 只渲染字符串 content，瘦身后显示安全。

### 4.4 saveSessionToSlot（保存 + .bak 轮转防护）

回合尾 `saveLines` 汇聚双线后落 `saveSessionToSlot(cwd, slot, data)`：

- 置 `data.updatedAt = Date.now()`。
- **写前 .bak 轮转**（mtime 缓存门控——slotMtimeCache，避免每保存全量解析多 MB 槽）：
  mtime 变了才重读磁盘快照，然后任一以下条件 → 先把磁盘文件 rename 为 `.bak-{ts}`
  再写（返回 `.bak` 路径透出）：
  - 磁盘文件 `version > 2`（loadSlot 对 v3 返回 null 不动，若其 sessionStart 为 null
    首次保存会静默覆盖——新版文件一律轮转）；
  - 磁盘 `sessionStart` 与本进程会话不符（`diskStart && diskStart !== myStart`）——
    另一进程/会话的现场；
  - **磁盘 history 比待写快照长**（`diskLonger`）——turn 启动读槽快照、回合末写回，
    期间另一进程（CLI）追加了消息：sessionStart 相同 → 放行 → 旧快照整体覆盖对方
    最新消息。磁盘比待写长 = 外部写入 → 轮转保留对方现场，不静默覆盖。
- 解析失败也轮转（损坏现场改名 `.corrupted` 不覆盖）。
- 写后更新 manifest 摘要（`slots[slot] = { ts, ...extractSlotMeta }`——messageCount/
  turnCount/firstMessage/activeProvider/title）。
- **sessionStart**：`existing.sessionStart ?? new Date().toISOString()` 赋一次——与
  CLI `_sessionStart ??=` 同语义。此前 VS Code 恒 null → diskStart 恒 null → F2 轮转
  永不触发（纯 VS Code 会话无覆盖防护）；更糟：CLI 加载 VS Code 槽时打上 CLI 自己的
  start → 跨端保存必轮转对方现场（"先占者赢"自伤）。赋一次使两端打点一致，F2 放行。

### 4.5 v1 回退播种

`activeLines`（panel-session）：`contextHistory` **length > 0 才当机读线**
（`contextHistory: []` 是"无机读线"而非空机器线——空机器线会静默丢全部上下文）；
v1 老文件（无 contextHistory/空）从 history 播种，且剥离被 slimForDisplay 截断的
`tool_calls.arguments`（`stripTruncatedToolArgs`——以 `…` 结尾 → 置 `{}`，防半截
`\\uXXXX` 400 毒载荷）。

## 5. 会话切换、删除与绑定

**运行中禁止切换**（会话切换竞态修复——VS 实现注）：`newSession`/`deleteSession`/
`switchSession`（webview loadSession）/项目切换三处 `_turnActive` + `_susp.active`
守卫（warning 拒绝，对齐 applyProjectSwitch 模式）——运行中放行会让旧 turn 的
stream/complete/标题灌进新会话视图（"思考串台"）、内容落错槽。

**turnSlot / slotOverride（纵深防御）**：`saveLines`/`_saveLines`/`generateTitle` 带
slotOverride——runPanelChat（panel-chat.mjs）回合入口捕获 `turnSlot`，onComplete/
abort/finally 的保存与标题一律落 `turnSlot` 而非面板当前 `_slot`——运行中即便并发
切换，旧 turn 流也不灌新会话视图、内容不落错槽。

### 5.1 新建与打开

- **面板新建**：`newSession` → `newSlot(_cwd())` 分配新槽（跳过 manifest 条目/现存
  文件/活认领号；开头清理死主条目且文件缺失的槽号连 `m.slots` 条目一并删、回收复用；
  立即记录所有权 + setActive + 写 end marker）→ `panel._slot = newSlot` → loadSession。
- **打开历史会话**（webview loadSession 消息 → panel-messages）：先
  `switchToSlot(cwd, slot)`——读目标槽成功才翻 active + 写 marker（文件缺失/损坏
  返回 null 且不产生幻影指针）；然后 `slotOccupancy` 检查——目标槽被**另一活进程**
  占用 → 不钉槽（`panel._slot = null`，loadSession 立即经 ensureSlot 认领新槽）+ 提示；
  空闲则 `panel._slot = slot` 绑定 → `_loadSession()`。

### 5.2 删除

- `deleteSession` → `deleteSlotAndUpdate(cwd, slot)`：删文件 + 清 manifest 条目 +
  `deletions` 显式删除（防合并复活）+ 删到 active 时置空指针（不替面板选"最小剩余号"
  ——可能指向另一活进程的槽）+ **删到本端记录槽 → marker 显式置空**（文件保留 +
  slot:null）。
- 若删的是面板绑定槽：`panel._slot = newActive`；newActive 非 null 且原记录槽被删时
  重写 marker = 幸存槽（删后立即重绑 = 一个落点——与 CLI ACP"删后 newSession 重钉"
  同语义，marker = 端内最后使用槽位）；newActive null 时保持置空，下次 ensureSlot 经
  resumeSlot 认领新槽并写记录。
- **保留至少一个会话**：`listSlots` 长度 ≤ 1 时拒绝删除。

### 5.3 绑定入口（本端接线）

`_slot` 为 null 时经 `ensureSlot(panel)`（panel-session）一次 `resumeSlot(cwd)` 解析
并钉槽；三处进入 resumeSlot：面板 `status`（激活启动）、`onProjectChanged`
（panel-project——项目切换/多根 `setProjectFolder` 后 `panel._slot = null` 再重绑）、
`ensureSlot`（惰性首保存）。`session-io.resumeSlot` 包装器在恢复入口顺带触发一次残留
GC 调度（scheduleSessionGC——§8）。项目切换经 `applyProjectSwitch` 守卫运行中拒绝 +
`setProjectFolder` 校验 + `onProjectChanged` 重绑，per-cwd UI（历史/会话列表/
autoApprove/planMode/索引状态）随 `_cwd()` 刷新。

## 6. 字段往返完整与会话级状态

- **全量覆盖写 + `...existing` 透传**：槽位文件全量覆盖写，`saveLines` 以展开式透传
  不认识字段、仅覆盖扩展自己拥有的字段——CLI 写入的 `activeModel`/`engineering`/
  `engDesignToken(s)` 等字段在 VS Code 侧往返不丢（往返透传是契约——漏一字段即永久
  丢失）。
- **key-presence 写（v2 语义）**：`engDesignToken`/`engDesignTokens` 用
  `"key" in extra ? extra.key : existing.key ?? null`——显式 null（清盘）必赢、缺席
  保留槽值：R16 TTL 过期后 restore 清盘、turn 尾 agentState 携显式 null 必须 pin
  （否则 ?? 把显式 null 当"缺失"→ 下轮保存复活过期槽值）；abort/finally 保存无
  agentState → 缺席保留槽值不误清。
- **`engineering` 是 slot 权威源**（2026-08-29，ENGINEERING-MODE 面）：config.json 的
  `agent.engineering` 仅为 CLI-compat 镜像；slot 字段写则 pin、缺席保留；读侧 slot 无
  字段才回退 config。`!== undefined` 语义——legacy 无字段槽在 run 未发言时保持
  field-less（硬写 false 会把会话钉关、杀死 config 回退，compat 契约见测试）。
- **advisor.guard / autoApprove / planMode / goal / pendingReminders 会话级**：回合尾
  agentState 携 live guard 合并到现有 advisor 对象（legacy null 升级为对象）；run 未
  发言则原样保留。面板开关（AUTO/planMode 按钮）经 session-slot-write 的 setSlot*
  直写槽文件。
- **setSlot* 写面（session-slot-write.mjs，Parnas 拆分）**：setSlotAutoApprove/
  setSlotPlanMode/setSlotEngineering/setSlotAdvisorGuard/setSlotEngDesignTokens +
  newSlotData。loadSlotForWrite 对"无文件但本进程刚 claim 的槽"返回 newSlotData 默认
  记录——否则 setSlot* 落在"claim 先行、首保存落盘"的新槽时 `if (!data) return false`
  静默丢标志（AUTO-bug 修复）；version>2/异 cwd/损坏/未知槽返回 null（新版 CLI 文件
  不属本端覆盖——v3 interop 前保守姿态）。

## 7. 标题生成与写契约

- **自动标题**：新会话首条消息所在回合尾触发（panel-chat isFirstMessage →
  `generateTitle(panel, turnSlot)` → generate-title.mjs `generateTitle(userContent,
  activeProvider)`）——从槽文件取首条 user 消息（`(type ?? role) === "user"`）+ 持久化
  activeProvider（runAgent 不给 history 条目打 provider/model）；`setSlotTitle` 写回，
  失败打印 `{reason}` 不再静默。
- **触发时机（A2——SESSION-FLOW-A 方案 Y——2026-09-09 用户裁）**：标题 await 在回合尾
  finally **忙态归位之前**（stream 完成即触发——panel-chat.mjs 归位分支前）：期间
  `_turnState` 仍 running——标题窗口 = busy——webview Stop 显（state≠idle 派生）+ 路由
  守卫 running→排队（修 R3 无池首回合并发——归位 idle 后标题的旧序会让窗口内新消息直开
  并发回合与标题 LLM 调用赛跑；有池首回合同理——标题跨释放窗口延后消化入口——新序
  「标题在归位 susp 前完成」——释放窗口不延）。错误路径（评审 #2）：`generateTitle`
  内部全 try/catch 吞错 + 调用点兜底 try/catch——**归位恒执行**（_publishTurnState +
  loading:false 照发——标题抛错不卡永久 busy）。标题期消息入队 `_suspQueue`（routeUserTurn
  running 分支直入队——同队列同排空——零丢失）。
- **IK9UZ8（标题生成质量）**：LLM 标题请求**显式禁用思考**（openai body 加
  `thinking:{type:"disabled"}`、anthropic `thinking:{type:"disabled"}`、google
  `thinkingConfig:{thinkingLevel:"none"}`——防 reasoning_content 吃掉整个输出预算把
  content 留空）+ **`max_tokens` 30→100**（40 字符标题要 ~60-80，100 是余量）；
  超时 10s、失败静默降级（返回 null）；标题规范 ≤40 字符无引号（system 提示）。
- **写契约 {ok, reason}（§12 F3，2026-09-06）**：`setSlotTitle` 返回
  `{ ok: true }` 或 `{ ok: false, reason: "file-missing" | "parse-failure" |
  "mtime-conflict" | "invalid-slot" }`——四失败可区分，reason 不含用户文本（渲染由
  调用方决定）。**mtime 门控**：读→改→整文件写回窗口内并发方保存会被旧数据覆盖（丢
  消息）——读与写之间 mtime 变即放弃本次重命名（下次重试）。手动改名（webview
  renameSession → panel-messages `setSlotTitle`）同契约、失败弹 `{reason}` 可见。
  CLI renameSlot 同契约（机制 CLI SESSION §12.4 镜像）。

## 8. 会话目录残留 GC（与 CLI 同源）

- **触发**：激活空闲期一次——`resumeSlot` 包装（session-io）调 `scheduleSessionGC`，
  内部 setImmediate 空闲执行 + 每进程每前缀去重（resumeSlot 可多次进入不重复跑）；
  不阻塞激活路径。
- **范围**：当前 cwd hash 前缀文件；扫描先按后缀预过滤、只 stat 残留候选，再对候选
  做活跃槽/孤儿/保留期判定（不跨 cwd 扫描）。
- **保留期（mtime < now − retention 才删——等于保留期保留，older-than 边界）**：
  `.corrupted` / `.unreadable` / `.manifest.corrupted` / `.bak-*` 30 天；孤儿 `.tmp`
  7 天（主文件存在则非孤儿，跳过）。
- **排除**：活跃槽（主文件在 + manifest slotSessions[N] 属主活）的现场一律保留；
  manifest 主文件 / end marker / 数据主文件**永不进入候选**（后缀预过滤只匹配残留）。
- **冷 cwd 原语**（listColdCwds/deleteColdCwd——COLD 90 天、无活跃数据文件）与 CLI
  同构（cleanup 语义双端同源，测试镜像）：**手动执行面仅 CLI 提供**（扩展无 shell
  子命令通道，共享同一 sessions 目录，CLI 可清 VS Code 弃用的 cwd）；本端只接线自动
  残留 GC 启动钩子，不做冷 cwd 手动面。TOCTOU：删除前重校验冷态。

## 9. 懒加载历史分页

- **不整读**：`historyWindow(history, before)`（src/extension/history-window.mjs——
  SESSION-RESTORE-PARITY 拆分；`HISTORY_PAGE_SIZE = 200`——首窗对齐 CLI 200，用户裁
  2026-09-09）——`before == null` 取**末页**（首屏只发末页）；否则取 `before` 前结束的
  一页 `[s, e)`（半开区间——loadOlder 页不重渲染边界消息）。`idx` 为**全局** history
  下标——分页永不重编号消息。
- **输出模型**（规则集：SESSION-RESTORE-PARITY §1——恢复链对齐 CLI historyToLines）：
  user{kind,text,timestamp,idx} / assistant{kind,text,reasoning,timestamp,idx,turnStart,
  tools:[{id,name,args,result}]} / tool{kind,name,text,timestamp,idx}（仅**真孤儿**保底
  ——全历史无主的 tool 条目）。assistant = 帧容器：一帧一条消息、工具卡**嵌套** tools[]
  随帧下发（DOM 嵌容器内，非顶层独立条目）——被消费 tool 条目不独立产消息
  （防跨页双显——窗口内无主但全历史有主的条目在窗口内 skip，随其帧页渲染）。timestamp
  读 `ts ?? timestamp ?? null`（pushReal 打点 ts / 老文件 timestamp / 更老缺失——字段名
  零改名，webview 不变）。
- **规则**：① user skip = ¬(isRealUserMsg ∧ content.trim() ≠ "")（reminder/非 string/
  空白三态）；② assistant 帧全保留（content null 不丢——纯工具回合帧靠卡渲染）——
  仅幽灵帧（无文本 ∧ 无 tool_calls ∧ 无 reasoning）skip；③ 帧 tool_calls 与紧随 tool
  条目**滚动配对**（tool_call_id 次序——并行批乱序完成全配；未配调用 result:null）；
  ④ 配对跨窗口末界照常消费（任何帧的未配调用均可吃界后紧邻条目）——孤儿判定对全历史；
  ⑤ turnStart = assistant 且上一条**可见**消息为 user 或无可见前驱——从 i-1 回扫跳过
  条目（skip 不重置回合——CLI inTurn 语义）；⑥ reasoning = reasoning_content ??
  reasoning（echo 帧恢复为 thinking 块）。
- **首屏与回滚**：loadSession 只发末页 `{ messages, hasOlder }`；webview 滚近顶部经
  `loadOlder { before }` 取旧页（scroll 补偿前置）。`before` = webview 最小已渲染
  `data-idx`（只外层 .message 带 idx——嵌套卡不带——被消费条目无 DOM 不锚定）——
  live 流消息无 idx，可永不腐蚀窗口；完整回合落盘不会重复。非空首屏插入前移除
  .welcome（空历史保留——G，SESSION-RESTORE-PARITY）。实现与寄存器见
  AGENTS.md「Lazy history loading」。
- **发送清洗**（sendHistoryPage）：user 消息剥离 editor-context 注入
  （`stripEditorInjection`——机器只读注入不得出现在 UI）；孤儿 tool 消息 text 截 64K；
  assistant 嵌套 tools[].result 截 64K（防未 slim 老文件超大结果进 webview）。
- **turnStart 判定**（规则 ⑤）：可见前驱扫描基于全历史（跨页一致）——assistant 帧画
  "❯ ThinCoder:" 标签恰一次/回合；assistant/tool 后续段是回合内延续，不重复画标签。
- **loadSession 同步会话级 UI**：_autoApprove/planMode 从槽字段同步面板标志 + 工具条
  按钮 + clearMessages + 发末页 + pushSessions。

## 10. 会话上下文注入序（富注入，CLI 同款演进）

面板每回合重建上下文线（activeLines → contextHistory 或回退播种）后，会话级注入按
固定序落在机读线：

```
disk 历史重放（保序打头——provider 前缀缓存主体）
  ↓
git / env-state / process-restarted transient 注入（落在重放后、最新 user 前）
  ↓
time 注入 = 恒为该轮最后一条（位置契约由测试独立锁定——2026-08-16 事故防复发）
```

- 重放主体必须与存盘机读线逐字节一致（§4.3 双线契约）——否则 prefix 缓存 miss。
- git/env/process-restarted 均为 transient（人读线落盘过滤、机读线保留——§4.3），
  变更下回合自然感知。

## 11. 废弃方案（pre-release，无迁移）

- `context.workspaceState` 的 `thincoder.sessions.<base64(workspacePath).slice(0,32)>`。
- legacy `messages/` 目录 + base64 文件名 + Memento 索引。
- 旧 12/16 位短 hash 文件（首访改名迁移，见 §1）。

---

## 验收对照（DOC-REORG-VSC 批 3）

- 无 >300 字符单行：`node scripts/check-doc-width.mjs`。
- markdown 结构正确；锚句自 ARCHITECTURE §4 逐字迁出（机制句 byte-exact）。
- 历史变更流水折叠为本记录（§变更记录）。
- AC6 本端接线：本档含 VSC 特有符号——resumeSlot/claimSlot/allocateFresh/
  cleanDeadOwners/END="vscode"/endMarkerPath/slotOccupancy/saveLines/turnSlot/
  historyWindow/HISTORY_PAGE_SIZE/slimForDisplay/isLegacyTransient/
  stripTruncatedToolArgs/saveSessionToSlot/.bak- 轮转/scheduleSessionGC/
  setSlotTitle/session-slot-write 写面/loadSlotForWrite/newSlotData——均为
  `src/extension/` 实际模块导出或装配点，非指针空壳。
