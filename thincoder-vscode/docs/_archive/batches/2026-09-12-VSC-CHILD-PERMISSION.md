# VSC 子代理审批面对齐（child permission gate）· 批次记录（2026-09-12）

> 搬迁注记：本档自 CLI 仓 `2026-09-12-VSC-CHILD-PERMISSION（CLI 仓）` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = bb2a0768afb7 · 源提交 = cfcc621）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-12 01:20 · 来源 = 用户 01:16「G1 你觉得呢」+ 01:17「可以我也这么想」（**裁定：走 A——child 也过审批门**）。
> 勘察 = explore#29（G1——证据见下）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-12**（用户裁定 A）。下一步 = **设计**（spawn eng-designer）。

### 用户裁定（A 方案）

**child（depth>0）写操作走审批门**（ask 模式弹卡；模式继承——auto/approveAll 静默放行）。理由（父侧呈报 + 用户认可）：① 现状是**偶然的洞**（VSC 门禁 `depth === 0` → child 静默放行；回调链无 permission 通道）；② 安全语义应整树一致（ask 模式下后台 child 不该绕过授权）；③ 机制已有（VSC 权限卡 approve/approveAll/deny + 批合并行；CLI 模态带 owner key——既有）。

### 勘察事实（explore#29——逐点 file:line）

| 端 | 事实 | 证据 |
|---|---|---|
| CLI | depth>0 的 child 发审批等待前**先发** `⟦ev⟧approval` 事件 → 块头翻 `⏸` + 状态词 `等待审批: <tool>` | `src/agent/dispatch.mjs:289-299`（CLI 仓）（`depth > 0` 才发）· `src/tui/subagent-blocks.mjs:119-122` · `src/tui/subagent-panel.mjs:54/103` |
| CLI | 手动档 child 的写工具 ask 走父侧模态，**带 owner key** `${key}/${tool}`；child 块 ⏹ = deny 该 child pending 模态 | `src/agent-tools/subagent-spawn.mjs:300-324` · `src/tui/mouse.mjs:224-228` · `src/tui/key-modes.mjs:22` |
| VSC | 权限门要求 `depth === 0` → **child 永远到不了审批阶段（静默放行）** | `thincoder-vscode/src/agent/execute-tools.mjs:243-258` |
| VSC | child 的 `runAgent` callbacks **无 permission 回调**（只转发 onToken/onReasoning/onToolCall/onToolResult/onToolPanel/onAgentTurn/onComplete/onQuestion） | `thincoder-vscode/src/agent-tools/subagent-run.mjs:87-126` |
| VSC | 权限卡只有 tool/args/diff、**无发起者归属**；块头无「等待审批」态（`stateWord` 只由 chunk 驱动） | `webview/permission.js:21-67` · `webview/activity-view.js:61-65` |
| **文档矛盾** | VSC `ESCALATE.md:125` 声称 escalate「复用 coder role：写权限、**权限门（onPermissionRequest 转发）**」——与 `depth === 0` 门禁 + 无回调直接矛盾；`ENGINEERING-MODE.md:130` 同族表述。全仓 grep **无「child 免审批」裁定** | 勘察 §一 G1 |

### 需求（R1–R2）

| # | 需求 | 判定句 |
|---|---|---|
| **R1** | **child 审批门对齐 CLI**：ask 模式 → child 写操作弹卡（**带归属**：`<child key> · <tool>`）+ 复用既有批合并；auto/approveAll → 静默放行（**模式继承——不新造规则**）；块头 `⏸` + 「等待审批: <tool>」态（与活动区批 R4 字段对齐联动）；**覆盖子代理 + escalate**（ESCALATE.md 声称复用 → 真的复用）；consult 只读 → 不涉 | 用例：ask 模式 child 写操作 ⇒ 卡出现且带归属；approve 后 child 继续；deny ⇒ child 收 deny 语义（对位 CLI）；auto ⇒ 零卡直通 |
| **R2** | **文档矛盾修正**：`ESCALATE.md:125` / `ENGINEERING-MODE.md:130` 与实现对齐（或按 R1 落地后的真语义改写） | 两档改后与代码一致（机检措辞） |

### 设计约束

- 管线点：`execute-tools.mjs`（depth 门禁）· `subagent-run.mjs`（callbacks 补 permission 通道）· 权限卡 UI（归属行）· 块头态（⏸ + 状态词）· i18n 两 locale；
- ⏹ deny 本 child 的 pending 卡（CLI 有——可选做，设计给取舍）；
- VSC 单端（CLI 零改——CLI 已是目标语义）；不新造权限模式；
- 测试面：权限链用例（ask/auto × child/escalate × approve/deny）+ 归属断言；写域行数 as-of。

### 范围外

CLI 零改 · 不改权限模式集合 · 不动 VSC 顶层（depth 0）审批现有语义。

---

## §2 批次任务（eng-designer 写）

> （父侧形态更正 2026-09-12：原「_（待写——eng-designer）_」空占位行已去除——实体任务书见下；空占位 = 残留即先例）

### 批次任务（eng-designer 自写——2026-09-12）

**目标与理由**：VSC 子代理（depth>0）写操作走审批门对齐 CLI——消除「偶然的洞」（三道闸：权限门 `depth === 0` + child 无 permission 回调 + child `autoApprove` 恒 `true`）。R1 = 机制对齐（ask 弹卡带归属 / auto·approve-all 静默 = 模式继承 / 块头 `⏸` + 等待审批 / 覆盖 escalate / 取消释放）；R2 = 文档矛盾修正（`ESCALATE.md` / `ENGINEERING-MODE.md` 与实现对齐）。

**落档位置**：需求 = `AGENT-LOOP（CLI 仓·需求）` **§17**（F-CP1/F-CP2——设计者已落）；设计与测试 = VSC 仓
`docs/design/AGENT-LOOP.md` **§18**（§18.1–§18.10——设计者已落）；门禁增量 = `TOOLS.md` §8 · 协议登记 = `WEBVIEW.md` §7.2；
R2 修正 = `ESCALATE.md` / `ENGINEERING-MODE.md` / `AGENT-LOOP（VSC 仓）§8` 同族句 · 地图注记 = `README.md` 变更记录（均已落）。**设计档 §18 = 契约全文——
本段为任务书，不另写副本；实现前先读 §18.4（C-1..C-13）与 §18.7（用例表）。**

#### 一、覆盖条目（本批条目 = 设计回指 = §1 裁定；三方一致清单）

| # | 条目 | 需求 | 设计 | 用例 | 验收 |
|---|---|---|---|---|---|
| R1 | child 审批门对齐 CLI | F-CP1 | §18 C-1..C-12 · KD-1..KD-8 · Q1–Q6 | T-CP1..T-CP16、T-CP18 | AC-CP1..AC-CP6、AC-CP8/9 |
| R2 | 文档矛盾修正 | F-CP2 | §18 C-13（**已落档**——coder 零碰） | T-CP17（机检锚） | AC-CP7 |

#### 二、实现要点（逐条——细节以 §18.4 为准）

1. **闸放开（C-1）**：`src/agent/execute-tools.mjs` 权限条件删 `depth === 0`（保留其余谓词 + `callbacks.onPermissionRequired`）；**批扫描 `:157` 保持 `depth !== 0` 短路**（children 不入批合并——Q1 裁定）；`:93-96`/`:243-256` 注释面改写为 post-R1 语义。
2. **child 通道（C-2）**：新档 `src/agent-tools/child-permission.mjs`——`makeChildPermission({ctx,id,role,model,signal})`
   （无 `ctx.callbacks.onPermissionRequired` → 返 null）+ `childOwnerLabel(role,id,model)`；顺序定死：announce
   `onSubagentApproval({id,role,model,tool})` → `onPermissionRequired(toolName,args,diffInfo,{owner,signal})` → finally `tool:null`。
   角色域：`coder`/`eng-designer` 传；`explore`/`plan`/`eng-coder` 不传。
3. **模式继承（C-3）**：`subagent-run.mjs:126` → `role === "eng-coder" ? true : (() => ctx.getAuto?.() ?? false)`；
   `subagent-escalate.mjs:170` / `subagent-escalate-async.mjs:111` → live getter。连带（KD-7）：手动档非 eng-coder child
   不再注入 AUTO 提醒句——预期行为（CLI 同态）。
4. **host 面（C-4/C-5/C-6）**：`extension/permission-gate.mjs`——回调第 4 参 `opts {owner, signal}`；队列条目
   `{id, resolve, toolName, owner}`；`promptId`（`panel._permissionSeq`）；`release(entry, verdict)` 统一出队 + resolve +
   post `permissionWithdrawn`；挂 `opts.signal` abort 与 `panel._abortController` abort。`extension/panel-messages.mjs`——
   `permissionResponse` 按 `promptId` `find`（无 id 回退队头；未知 no-op）；approveAll 分支对其余 pending 逐个 `permissionWithdrawn`。
5. **UI 面（C-7/C-8/C-12）**：`webview/permission.js`——owner 非空 → 首行 `<span class="perm-owner">{owner}</span> · <code>{tool}</code>`
   （R1 逐字格式）；卡带 `data-prompt-id`。`extension/panel-callbacks.mjs` + `onSubagentApproval`（`postSubagentEvent` 族）。
   `webview/activity.js` + `applySubagentApproval`（`blockNamesFor` 查块绝不建块；冻结丢弃）；`webview/chat.js` 路由
   `subagentApproval` / `permissionWithdrawn`。`webview/activity-view.js`——meta `approval` 初值 / `headerText` icon `⏸` /
   `stateWord` 优先 `t("sub.awaitingApproval",{tool})` / `freezeBlock` 清。locales 两档 + `sub.awaitingApproval`
   （zh `等待审批: ${tool}` / en `Awaiting approval: ${tool}`）。
6. **escalate 接线（C-9）**：sync `id: subId` / async `id: entry.id`，`role:"escalate"`，`model: tag`；owner label = `escalate <tag> #<id>`。
7. **结构拆分（C-11）**：五函数（`agentHasLiveEngSlot` / `l3TouchedPaths` / `preGateBlocked` / `isSubagentConsumeDesignAction` / `collectBatchPermission`）verbatim 迁新档 `src/agent/tool-gates.mjs`；`test/advisor-guard-completion.test.mjs:176-177` 源读改指；`executeToolBatches` 留原档（import 新档——无环）。

#### 三、受影响文件全清单（行数 as-of 2026-09-12 实测；口径 `split("\n").length` 含末行；源档守 500 / 新档 ≤300）

| # | 文件 | as-of | 预计 | 要点 |
|---|---|---|---|---|
| 1 | `src/agent/execute-tools.mjs` | 506 | ~385 | C-1 + C-11 拆出（净减） |
| 2 | `src/agent/tool-gates.mjs`（新） | — | ~155 | C-11 verbatim 迁入 |
| 3 | `src/agent-tools/child-permission.mjs`（新） | — | ~55 | C-2 |
| 4 | `src/agent-tools/subagent-run.mjs` | 190 | ~206 | C-2/C-3 |
| 5 | `src/agent-tools/subagent-escalate.mjs` | 219 | ~233 | C-9 |
| 6 | `src/agent-tools/subagent-escalate-async.mjs` | 226 | ~240 | C-9 |
| 7 | `src/extension/permission-gate.mjs` | 71 | ~115 | C-4/C-6 |
| 8 | `src/extension/panel-callbacks.mjs` | 186 | ~190 | C-8 回调 |
| 9 | `src/extension/panel-messages.mjs` | 485 | ~492（<500——余量薄，只许增量逐行） | C-5 |
| 10 | `webview/activity.js` | 354 | ~372 | C-8 |
| 11 | `webview/activity-view.js` | 157 | ~172 | C-8 |
| 12 | `webview/permission.js` | 108 | ~122 | C-7 |
| 13 | `webview/chat.js` | 355 | ~363 | C-8/C-6 路由与移除 |
| 14 | `locales/en.json` + `locales/zh.json` | 248 ×2 | +1 ×2 | C-12 |
| 15 | `test/child-permission.test.mjs`（新） | — | ~380 | T-CP1..T-CP18 |
| 16 | `test/advisor-guard-completion.test.mjs` | — | ±1 | C-11 源读改指 |
| 17 | `test/files.mjs` | 75 | +1 | 新测档登记 |

**拆分评估注**：`execute-tools` 506→~385（越硬限归位）；`panel-messages` 485→~492（薄余量）；`activity.js`/`chat.js` 越 300 咨询线——本批不拆（登记结构债候选）。
**排程（父侧）**：活动区批 `2026-09-12-VSC-ACTIVITY-CLOSURE` 与本批文件域重叠（#4/#8/#10/#11/#13/#14）——调度器按 `files` 排队；后落动手前**重读文件对表**（其 §14 亦动 activity-view 头词/stateWord——字段面独立、文本面近邻）。
**不入 files**：`docs/TODO.md` / `CHANGELOG.md` / 批次档（父侧）；设计档（设计者已落——coder 零碰）；CLI 仓一切代码。

#### 四、验收标准（逐条回指——判据全文 = §18.8，不重抄）

- **AC-CP1**（F-CP1/机制）= T-CP1/T-CP2/T-CP3/T-CP5：卡 + 归属逐字 + approve/deny 语义 + approve-all 连带；
- **AC-CP2**（F-CP1/模式继承）= T-CP4/T-CP5：AUTO 零卡；轮中翻转后续零卡；
- **AC-CP3**（F-CP1/角色域零回归）= T-CP10/T-CP11/T-CP12/T-CP15：eng-coder/explore/plan/无通道零卡；depth-0 零回归；
- **AC-CP4**（F-CP1/escalate）= T-CP6/T-CP7：sync/async ask + 归属 + 取消释放；
- **AC-CP5**（F-CP1/块头）= T-CP1/T-CP13/T-CP16：`⏸` + 态词、冻结丢弃、两 locale；
- **AC-CP6**（F-CP1/路由释放）= T-CP8/T-CP9/T-CP14：promptId 匹配 + 回退 + 逐项形态；
- **AC-CP7**（F-CP2）= T-CP17：三处措辞锚逐字在位；
- **AC-CP8**（N-CP2/结构）= T-CP18 + 行数实测表：`execute-tools` ≤500、新档 ≤300、`check-doc-width` 零新增；
- **AC-CP9**（N-CP1/零回归协议）= VSC 快层全绿；CLI 仓 `git status` 零代码改；`WEBVIEW.md` §7.2 协议增量四行在位。

#### 五、用例（18 条——输入/预期全文 = §18.7）

正常：T-CP1 ask 弹卡带归属 + 块头 ⏸ · T-CP2 approve 继续 · T-CP3 deny 语义 · T-CP4 AUTO 直通 · T-CP5 轮中 approve-all · T-CP6 escalate sync · T-CP7 escalate async + ⏹ 释放；
边界：T-CP8 双卡 promptId 路由 · T-CP9 陈旧/无 id 响应 · T-CP10 eng-coder 零卡 · T-CP11 explore/plan 零卡 · T-CP12 depth-0 零回归 · T-CP13 冻结块迟来事件 · T-CP14 child 多写逐项两卡 · T-CP16 态词清除 + i18n；
错误：T-CP15 无通道静默（headless） · T-CP17 R2 措辞锚 · T-CP18 结构对表。
**测试族写法**：host 直驱（`permission-gate`/`panel-messages` + panel 假体——`chat-panel-messages.test.mjs` 模式）+ happy-dom 面（`installChatFixture`——`activity-flow.test.mjs` 模式）+ fs 直读（i18n/文档锚）。

#### 六、开放设计问选型（Q1–Q6——全文 §18.3）

| 问 | 选定 | 否决候选（理由） |
|---|---|---|
| Q1 child 弹卡形态 | 逐项卡（复用既有权限机制；批合并保留 depth-0） | child 批合并（CLI 无此前例——新语义 + 扩面；候选扩展登记） |
| Q2 归属载体 | 回调 opts 显式 `{owner,signal}` | 名称内嵌 `${owner}/${tool}`（i18n/aria 劣化 + 取消反查需结构 id） |
| Q3 取消释放 | ask 绑定 child signal（一机制覆盖三路） | 面板队列反查（只覆盖 UI ⏹ 一路） |
| Q4 块头通知 | 新回调 + `subagentApproval` 消息 | ⟦ev⟧ token 复用 / 并入 `subagent` status 族（污染） |
| Q5 越硬限 | 机械拆 gate 层 | 只登记不拆（506>500 再增行坐实债） |
| Q6 响应匹配 | promptId 精确匹配 | 队头 shift（并发卡错 resolve） |

#### 七、明确不在本批（不扩面）

- 不做 CLI 端；child 批合并不做；question 面 child 卡释放不做（登记）；批卡协议（`batchPermissionRequest` 无 promptId/owner）不动；
- 不动 depth-0 顶层审批语义；不新造权限模式/对话框；不改 prompts/提示词文件；不改其他在途批档节。

#### 八、纪律与边界（coder 须知 + 父侧事项）

- **D1 写权**：coder 写实施域（§三表 #1–#17）；**文档域 = 设计者已落（含 R2 与 §18）——coder 零碰**；发现文档需改 → 回报，不自行改。
- **逐字纪律**：卡归属格式 `{owner} · {tool}`；态词 zh `等待审批: ${tool}`；deny 串沿用既有 `Denied by user (permission mode).`（顶层同串——不改字面）；协议消息名/字段名逐字（`permissionWithdrawn` / `subagentApproval` / `promptId`）。
- **协议只增不改**（`WEBVIEW.md` §7.2 四行登记即契约）；既有消息名/字段/行为零改。
- **语义红线**：eng-coder 写路径保持「零弹卡」（D-E3——不得顺手统一）；explore/plan 只读集不动；`approveAll` 顶层语义（全队列放行 + AUTO 置位）不动。
- **冲突即停**：实现中发现设计缺口 / 与 CLI 语义对不上 / 越出声明写域 → **停下报告**（不静默偏离、不自行扩面）。
- 不 commit（改动留工作区）；凭证不落档；D6 写入后回读；长测试先落盘再查。
- **父侧登记项（批后核销）**：§16 F-R4/N-CL4「审批态无数据源」理由句同步（两批核销时）；`docs/TODO.md` 需求池状态推进；`docs/design/README.md` 已补注记（设计者已落）。

**状态：任务书就绪**（2026-09-12——需求+设计+测试三层已落档；待设计评审）。实施者 = eng-coder（设计 token 门）。

### 修正轮（2026-09-12——设计评审轮次 1 后；7 条全修——🟡 5 + 🔵 2；零新语义；本追加与上文冲突处，以本追加为准）

**背景**：设计评审轮次 1 VERDICT = pass（🔴 0 · 🟡 5 · 🔵 2——发现表见 §3 轮次 1）。父侧裁决：7 条全修。本轮 = 修正轮（**只改文档、不碰实现**——两仓源码/测试零改、提示词实体零碰；未新建档、未发起评审、未 commit——待父侧核验）。

**落点表（发现 → 落修——行号 as-of 修正轮落修后实测 2026-09-12；VSC 设计档 = `docs/design/AGENT-LOOP.md`——下称设计档）**：

| 发现 | 级别 | 落点 |
|---|---|---|
| 1 TOOLS 扫尾残留 | 🟡 | ① VSC `TOOLS.md:178-180` 改写为「免逐写询问：权限询问阶段整体跳过…」（同 C-13 族句——行尾注「修正轮 #1」）；② 设计档 §18.4 C-13 扩列（新增 `TOOLS.md:178-180` 条；三处→四处——`:1459-1460`）；③ §18.7 T-CP17 扩为四处锚（`:1523`）；④ §18.2 文档矛盾表 +TOOLS 行（`:1372`）；⑤ 需求 F-CP2 清单加 `TOOLS（VSC 仓）:178-180`（`:641`） |
| 2 C-6 ② Stop 面 | 🟡 | ① 设计档 §18.4 C-6 ② 钉死（触发/判定 deny/子代去向/F-6 关系——按父侧裁定「Stop 为合法释放触发」；`:1417-1424`）；② §18.7 新增 T-CP19（Stop 释放——选「加用例」而非「① 等价注记」：② 接线（`panel._abortController` 监听）与 ①（child signal）不同，注记不足机判；`:1525`）；③ AC-CP4 扩为 T-CP6/T-CP7/T-CP19（`:1538`）；④ 需求 §17.1 取消清单 +Stop（`:632-634`）、F-CP1（`:640`）、N-CP3（`:649`）同步 |
| 3 拆分文档面 | 🟡 | ① 设计档 §1 模块地图加两行（`tool-gates.mjs` / `child-permission.mjs`——`:75` / `:89`）+ execute-tools 行改写（`:74`）；② 变更记录加 §18 行（`:41`）；③ VSC `ENGINEERING-MODE.md:144` 锚改指 `src/agent/tool-gates.mjs`；④ §18.9 遗留登记收口（§1 已补；外层面父侧——`:1555`） |
| 4 ≤300 口径 | 🟡 | ① 设计档 §18.6 注④ 修（源新档 ≤300；测试档按登记口径 = 不拆分——`:1499`）；② #15 行登记（~380 测试档；`:1493`）；③ AC-CP8 注明（`:1542`）；④ 需求 N-CP2 注明（`:648`） |
| 5 KD-7 与需求边界 | 🟡 | ① 需求 §17.1「审批面」澄清（`:633-634`）、F-CP1 边界（`:640`）——连带已登记、确认接受；② 设计档 §18.4 C-3 连带句（`:1406`）+ §18.5 KD-7 行（`:1472`）注 |
| 6 D-E3 悬空 | 🔵 | ① 设计档 §18.2 可写面句改指 C-3/KD-2（`:1364`）；② §18.7 T-CP10 改指 C-3/KD-2（`:1516`）；③ §18.9 旧标出处行（`:1556`——源注释旧锚；同族观察登记见 §13 边界 (e)） |
| 7 #16 as-of | 🔵 | 设计档 §18.6 #16 补 `339`（`test/advisor-guard-completion.test.mjs`；口径 = `split("\n").length`；`:1494`） |

**计数同步（与上文冲突处以此为准）**：用例 18 → 19（§18.7 新增 T-CP19；需求 N-CP3 同步）· T-CP17 锚 三处→四处（+TOOLS）· AC-CP4 = T-CP6/T-CP7/T-CP19 · 其余计数不变（契约 13 / KD 8 / Q 6 / AC 9 / 实施域 17 档）。**设计 token 不落档（运行时凭证）。**

**自检（D6 回读 + 宽度/一致性）**：VSC 仓 `check-doc-width` = 宽度 OK + 一致性新增违规 0；本次触碰四档零新增违规。CLI 仓既有失败为批外存量（批次档历史宽行等）；另评审段（§3）内一处自我指称（「本档」+ 节号）被 CLI 侧 V1 记 no-section——语指 VSC 仓 AGENT-LOOP 交付协议节，§3 = 评审段不改，父侧核销时修字面或入基线。

**状态**：修正轮已落（7/7——只动文档：VSC 仓 `docs/design/AGENT-LOOP.md` / `TOOLS.md` / `ENGINEERING-MODE.md` + `AGENT-LOOP（CLI 仓·需求）`）；两仓源码/测试零改；未 commit。待父侧核验 + 评审轮次 2。

## §3 设计评审（评审子代理写）


---

### 轮次 1（评审子代理）

**VSC 子代理审批面对齐设计（需求 AGENT-LOOP §17 / VSC AGENT-LOOP §18——R1 机制 + R2 文档矛盾修正）——设计评审发现**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | R2 扫尾残留：`TOOLS（VSC 仓）` :179 仍为同族失准句「写豁免仅限 onPermissionRequest 阶段」——C-13（VSC AGENT-LOOP :1445-1451）已对 ESCALATE 4 处 / EM / AGENT-LOOP.md §8 改写为「权限询问阶段整体跳过」，TOOLS.md §8 本批在改（:181 新增 child 审批条）却未列 :178-180；T-CP17（:1514）只读三处文本，检查过后该句仍存 | 将 TOOLS.md:178-180 纳入 C-13/T-CP17（改写或登记有意保留——「豁免仅限该阶段」vs「阶段整体跳过」粒度差异说明） |
| 2 | Clarity | 🟡 | C-6 ②（VSC AGENT-LOOP :1415——`panel._abortController` abort，自注「既有 Stop 面」）触发面与判定未钉死：轮级 Stop（F-6：不停后台池——:336）下子代存活、其 pending ask 是否即判 deny、子代去向如何——设计与需求均未落句；需求取消清单为 ⏹/模型 cancel/会话中止（需求 :639），Stop 不在列；用例表无 ② 的用例（T-CP7 :1504 只覆盖 ①） | 补 ② 触发/判定/子代去向一句并与 F-6 关系对齐；加用例或注明 ① 等价覆盖（可引 TOOLS.md:182 既有 abort→deny 处置）——考清 Stop 是否为合法释放触发 |
| 3 | Document ownership / Methodology | 🟡 | C-11 拆分与新模块的文档面不完整：本档 §1 模块地图（:65-89）无 `child-permission.mjs` / `tool-gates.mjs` 行且 execute-tools 行（:71）仍全包「门禁」（同规：§15/§16 落档均带 §1 行）；变更记录（:38 起）无 §18 行；`ENGINEERING-MODE.md:144` 锚「execute-tools.mjs `preGateBlocked`」在符号迁 `tool-gates.mjs`（:1438-1441）后失准而 EM 本批在改；§18.9（:1545）只把「模块图登记」笼统推父侧 | 补 §1 两行新模块 + 修 execute-tools 行；落 §18 变更记录行；EM §6 锚改指 `agent/tool-gates.mjs`（或 §18.9 明列） |
| 4 | Acceptance criteria | 🟡 | 结构口径自相矛盾：拆分评估注④「新档均 ≤300」（:1490）与 §18.6 #15 `test/child-permission.test.mjs` 预计 ~380（:1484）冲突；AC-CP8「新档 ≤300」（:1532）与需求 N-CP2（需求 :647）未声明测试档口径——~380 新档越 300 线且无登记/拆分说明 | 按测试档登记口径（:1251-1254「测试档登记口径 = 不拆分」）登记该档并修④措辞；或补拆测试档 |
| 5 | Requirements | 🟡 | KD-7 连带（:1402 / :1463：手动档「非 eng-coder child」不再注入 AUTO 提醒句——按该口径含 explore/plan）与需求 F-CP1 边界列「consult/explore/plan/eng-coder 零行为」、§17.1「不受影响」（需求 :639/:633）存在字面张力——连带已登记，需求侧未同步 | 需求侧澄清「零行为/不受影响」口径 = 审批面（或确认连带接受）——协调项（父侧） |
| 6 | Clarity | 🔵 | 标签「D-E3」（:1361、T-CP10 :1507）在审查范围三份文档内无定义（他档/批次档是否定义 = unverified——范围外未核） | 改指 C-3/KD-2 或补定义/出处 |
| 7 | File-size annotations | 🔵 | §18.6 #16 `test/advisor-guard-completion.test.mjs` 未给 as-of 行数（:1485 列「—」），仅 ±1——受影响文件表当前行数标注不完整 | 补当前行数（口径同表内其他行） |

**范围外注（无严重级）**：`ESCALATE.md:100`「aborted（会话/全停——controller 链中止）→ 出池丢弃（中止清池不注入）」措辞粗于 §12 现行语义（只清已死 + 整批提醒 + `discarded` 墓碑——VSC AGENT-LOOP :617/:632-643）与 §15；escalate 池条目是否被 §12 覆盖 = **unverified**（代码面不在本审查范围）——父侧核销时顺验，勿直接当任务派。

**审读口径**：五份范围内文档全读；源档行数无法对照实测（源文件不在审查范围），仅核内部一致性；VSC AGENT-LOOP.md 审读期间发生一次小幅行位移（§18 内容未变，引用行号以最终读取为准）。

**计数**：发现 7 条（🟡 5 · 🔵 2）+ 范围外注 1。

VERDICT: pass

### 轮次 2（评审子代理）

**VSC 子代理审批面对齐设计（轮次 2——修正轮核验；只验修正不追新）——设计评审发现**

方法：五份范围内文档全读；以修正轮落点表（批次档 §2 修正轮块）逐条对核当前盘面；引用行号 = 本轮最终读取实测（VSC 设计档 = `docs/design/AGENT-LOOP.md`；需求档 = `AGENT-LOOP（CLI 仓·需求）`）。

| # | 轮次 1 项（级别） | 核验 | 证据（file:line） |
|---|---|---|---|
| 1 | TOOLS 扫尾残留（🟡） | 已落修 | `TOOLS.md:178-180` 改写为「免逐写询问：权限询问阶段整体跳过…」+ 行尾「修正轮 #1」；C-13 扩列 `:1459`；T-CP17 四处锚 `:1523`；§18.2 矛盾表 +TOOLS 行 `:1372`；需求 F-CP2 加 `TOOLS（VSC 仓）:178-180`——需求档 `:641` |
| 2 | C-6 ② Stop 面（🟡） | 已落修 | C-6 ② 钉死（触发/deny/子代去向/F-6）`:1417-1424`；T-CP19 `:1525`；AC-CP4 = T-CP6/T-CP7/T-CP19 `:1538`；需求 §17.1 取消清单 +Stop `:632-634`、F-CP1 `:640`、N-CP3 `:649` |
| 3 | 拆分文档面（🟡） | 已落修 | §1 模块地图两行 `:75`/`:89` + execute-tools 行 `:74`；变更记录 §18 行 `:41`；`ENGINEERING-MODE.md:144` 锚改指 `src/agent/tool-gates.mjs`；§18.9 收口 `:1555` |
| 4 | ≤300 口径（🟡） | 已落修 | §18.6 注④ `:1499`；#15 登记 `:1493`；AC-CP8 `:1542`；需求 N-CP2 `:648` |
| 5 | KD-7 需求边界（🟡） | 已落修 | 需求 §17.1「审批面」澄清 `:633-634` + F-CP1 `:640`；C-3 连带句 `:1406` + KD-7 行 `:1472` |
| 6 | D-E3 悬空（🔵） | 已落修 | §18.2 可写面改指 C-3/KD-2 `:1364`；T-CP10 `:1516`；§18.9 旧标出处 `:1556` |
| 7 | #16 as-of（🔵） | 已落修 | §18.6 #16 补 `339` `:1494` |

补充核验：旧措辞（「豁免仅限」/「豁免粒度仅 onPermissionRequest 阶段」）五档现行正文 grep 零命中（仅设计档 C-13/§18.2 作改写对照引旧句——预期）；计数同步在位（用例 19 条 `:1569`、F-CP2 四处、AC-CP4 三用例、契约 13/KD 8/Q 6/AC 9）。范围外注（轮次 1——`ESCALATE.md:100` 措辞粗于 §12 现行语义）状态不变：维持父侧核销顺验（非本批 7 条之一）。

**计数**：核验 7 条（🟡5 + 🔵2）= 7/7 落修 · 新增发现 0（🟡0 · 🔵0）· 范围外注 1（延续，无严重级）。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 02:06 父侧代签**——用户 01:17「可以我也这么想」（裁定 A）+ 23:43「自动推进到排空」授权；条件齐备：轮次 1 pass（5🟡 · 2🔵，0🔴）→ **修正轮 7/7 落地**（#36）→ **轮次 2 核验 pass**（7/7 落位、新增 0）→ token 已签发（值不落档）。

**批准范围**：R1 机制（child 审批门——闸放开 / `child-permission.mjs` 通道 / 模式继承 / owner+promptId 路由 / 信号绑定释放含 ⏹/Stop / 卡归属行与块头 ⏸ / escalate sync+async 接线 / execute-tools 越硬限拆分）+ R2 文档矛盾修正（四处同族句）；实施者 = eng-coder（设计 token 门）。

**遗留**：① 写域与活动区批重叠（subagent-run/panel-callbacks/activity/locales）——调度器串行；② `ESCALATE.md:100` 措辞（轮次 1 范围外注——父侧核销顺验）；③ commit 随「扫」批。

---

## §5 实施记录（eng-coder 自写）


---

**状态：交付完成（2026-09-12 · 实施者 = eng-coder · 设计 token 门（值不落档）· 终态 = clean）**
——内层 explore 背离审计 **2 轮**（轮次 1：1 条 🟡 = T-CP14 缺测 → 补测；轮次 2 只读复核 = clean 零新增）；
**advisor 代码评审未发起**（任务书红线「不发起评审」——归父侧流程节点；如需父侧可补跑）。

**交付摘要（R1/R2 逐条）**

| 条目 | 落地 | 机判 |
|---|---|---|
| R1 child 审批门 | C-1 闸放开（execute-tools 权限条件删 `depth === 0`）· C-2 通道新档 `child-permission.mjs` · C-3 三处 live getter · C-4/C-5/C-6 owner+promptId+三路释放 · C-7 卡归属行 · C-8 块头 ⏸/态词/冻结丢弃 · C-9 escalate sync+async · C-11 拆分 · C-12 i18n | T-CP1..T-CP16/T-CP18/T-CP19（19/19 绿） |
| R2 文档矛盾修正 | 设计者已落档（coder 零碰）；四处措辞锚 + WEBVIEW 协议四行核验在位 | T-CP17 绿 |

**文件（实施域 17 档 + 测试 3 档——与设计 §18.6 逐档对应，零表外）**

| 文件 | 落地后行数 | 要点 |
|---|---|---|
| `src/agent/execute-tools.mjs` | 364（≤500） | C-1 条件/注释 + 拆出后 import 新档 |
| `src/agent/tool-gates.mjs`（新） | 160（≤300） | 五函数 verbatim（agentHasLiveEngSlot/l3TouchedPaths/preGateBlocked/isSubagentConsumeDesignAction/collectBatchPermission） |
| `src/agent-tools/child-permission.mjs`（新） | 39 | makeChildPermission / childOwnerLabel |
| `src/agent-tools/subagent-run.mjs` | 206 | C-2 通道（coder/eng-designer）+ C-3 autoApprove |
| `src/agent-tools/subagent-escalate.mjs` | 226 | C-9 sync + C-3 |
| `src/agent-tools/subagent-escalate-async.mjs` | 233 | C-9 async + C-3 |
| `src/extension/permission-gate.mjs` | 107 | releasePermission 三路 + promptId/owner |
| `src/extension/panel-callbacks.mjs` | 210 | onSubagentApproval（outbox 同通道） |
| `src/extension/panel-messages.mjs` | 496（<500 余量 4 行） | promptId find / 队头回退 / 未知 no-op / approve-all 连带 |
| `webview/activity.js` | 425 | applySubagentApproval（查块不建块）+ meta.approval + freeze 清态 |
| `webview/activity-view.js` | 183 | headerText ⏸ / stateWord 首判 |
| `webview/permission.js` | 118 | 归属行 `{owner} · {tool}` + data-prompt-id + 响应携 promptId |
| `webview/chat.js` | 411 | subagentApproval / permissionWithdrawn 路由 |
| `locales/en.json` + `locales/zh.json` | +1 ×2 | `sub.awaitingApproval`（zh 与 CLI 逐字） |
| `test/child-permission.test.mjs`（新） | 533 | T-CP1..T-CP19（测试档登记口径——不拆分） |
| `test/advisor-guard-completion.test.mjs` | ±3 | C-11 源读改指 tool-gates |
| `test/files.mjs` | +1 | 新测档登记 |

**透明表（偏差 / 归属修正 / 观察——零静默）**

| # | 类 | 内容 |
|---|---|---|
| 1 | 归属修正（零语义） | 设计 C-8 把 meta 初始化（buildBlock）与 freeze 清态标在 `webview/activity-view.js`；两函数实驻 `webview/activity.js`（叶/编排分工）。按语义落地：meta 增 `approval` 与 freeze 清态在 activity.js，headerText/stateWord 在 activity-view.js——行为与 C-8 逐字一致 |
| 2 | as-of 漂移（并发批） | 设计 §18.6 的 activity.js 354 / chat.js 355 系落笔前口径；因并发的活动区收口批已增长，本批落地后实测 425 / 411（>300 咨询线、<500 硬限——结构债候选登记维持）。其余：execute-tools 364（预计 ~385）、panel-messages 496、tool-gates 160、child-permission 39 |
| 3 | 观察（非偏差） | 通道 abort 监听（`{once:true}`）在用户正常应答后不解绑——随 controller 生命周期收敛（每回合/每条目重建）；设计未要求解绑，登记观察 |
| 4 | 观察（设计边沿） | C-2 角色域未限深度：depth≥2 的写权孙代（coder child 再 spawn coder）同样挂通道、owner 用其自身 label——与 C-2 字面一致（未限深度），如实登记 |
| 5 | 流程 | 未发起 advisor 代码评审（任务书红线）；交付代码评审归父侧节点 |

**验证（真跑——长测试先落盘再查）**

| 命令 | 结果 |
|---|---|
| `node --test test/child-permission.test.mjs` | 19 / 19 绿（T-CP1..T-CP19 全覆盖） |
| `node test/run-fast.mjs` | 643 用例 627 绿 2 红：T-CI-2a（批外既有——context-parity 批：config-io 于 HOME 覆盖前固化真实 config 路径 + 本机 config `agent.engineering=true`，已独立复现，与本批无关）；T-MA1-4（负载敏感抖动——单跑 5/5 绿、前次全量绿） |
| `node test/run-full.mjs` | 642 用例 641 绿 1 红（同 T-CI-2a 批外既有） |
| `npm run lint` | check-syntax 282 档 OK |
| VSC 仓 `node scripts/check-doc-width.mjs` | 宽度 OK（69 文件）+ 一致性新增违规 0 |
| CLI 仓 `node scripts/check-doc-width.mjs` | 批外存量（20 文件 35 宽行 + 7 条新增一致性，均为他批档/评审段既有）——本批零文档面写入（R2 由设计者落） |

**fix round**：审计轮次 1 唯一发现 → 补 T-CP14（child 多写逐项两卡 + 批合并零进入；`test/child-permission.test.mjs`）→ 轮次 2 只读复核 9/9 已修、新增 0、VERDICT clean。零设计偏离、零提示词面改动、零 CLI 代码改动（CLI 仓仅他批在途改动）。

## §6 验证与收口（父代理自写）

**2026-09-12 02:50 收口（父侧核验）**

- **真跑**：VSC 快层 643 / 627 过 / 2 fail（两红均批外：T-CI-2a config-io 配置面 + T-MA1-4 阈值抖动——单跑 5/5）、全量 642/641/1；定向 `child-permission` **19/19**；lint 282 档 OK；`check-doc-width` 新增 0；`depth === 0` 残留两项核讫（:104 改写注释 / :322 advisorAsync 默认——均合法）；
- **交付**：18 档（`execute-tools` 506→**364** 硬限归位 · `tool-gates.mjs` 160 · `child-permission.mjs` 39 · 两 locale +1 · 测试新档 533）；契约 C-1..C-12 静态逐条核验一致；
- **评审**：内层背离审计 2 轮 clean（T-CP14 补测）→ **代码评审（父侧补跑 #46）VERDICT = pass**（0🔴 · 4🟡 全 optional · 2🔵）；
- **裁决（4🟡+2🔵）**：① Stop 释放跨 controller 窄窗口（ask 携已 abort controller → 零卡 deny；旧 controller 于下一回合入口中止释卡）→ **接受现状**（保守 deny、无悬挂）+ 登记设计注候选；②/③/④ 文件规模（execute-tools 364 / panel-messages ~496 / 测试 533）→ 登记不拆（后者按测试档登记口径）；⑤ owner label 尖括号（`escalate <tag> #id`）→ **裁定保留字面**（需求文本同形 + 测试锁定 + 零功能影响）；
  ⑥ 监听不解绑 → 登记（警告出现时再清）；
- **范围外**：`activity.js`/`chat.js`/`locales`/`files.mjs` 声明外事实抽查在位（撤卡/路由/键/登记）；
- **链终**：design 链令牌已消费（值不落档）——再动需新评审。
