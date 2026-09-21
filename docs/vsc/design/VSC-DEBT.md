# VSC 产品树残留债清零（VSC-DEBT）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）。板块 = **VSC 产品树残留债清零**（批 7）。
> 任务书 = `docs/batches/2026-09-16-vsc-debt.md` §1（主 agent · 需求已确认）；批次任务面 = 同档 §2。
> 需求侧回指 = `docs/vsc/requirements/PROJECT.md` §6（N-P1 / N-P2 / N-P3——本部分编号域；与 CLI 树 `PROMPT-SYSTEM.md` 的 `N-P1`–`N-P3` 同号不同域，全引处须带档限定）· `docs/vsc/requirements/WEBVIEW.md` §3（N-W7）。
> 权威源（**本档不重述**——D2）：webview 消息族与协议表 = `docs/vsc/design/WEBVIEW-PROTOCOL.md`；测试入口 = `thincoder-vscode/test/run.mjs`（单入口——`slow` = 纯别名；测试门权威 = `docs/core/design/TESTING.md` §10）；文档体系判据 = `docs/core/design/DOC-SYSTEM.md`。
> 建档：2026-09-16（批 7 设计轮）。坐标 = as-of 2026-09-16 实测（行数口径 = `wc -l`）。
> 论域 = VSC 产品树（`thincoder-vscode/**`）+ 基准层文档（`docs/vsc/**`）。

## 1. 需求层承接（本批三条）

| # | 条目（承 §1 条目 1/2/3） | 判定句（验收语义） | 需求条目（回指） |
|---|---|---|---|
| **D-1** | 12 例慢例 `slow(` 归册 | 逐例**单跑**读数在案；单跑 **>500 ms** 者一律 `slow(` 归册；归册后 `npm test` 绿（单入口——`slow` 纯别名，无拦截线） | `PROJECT.md` §6 N-P1 / N-P2 |
| **D-2** | 收发面全量对表 + 死码清理 | 表逐行在位（顶级判别式 · host 发射点 · 消费位 · 处置）；复跑**零未处置**；删项后全树**零悬空引用** | `WEBVIEW.md` §3 N-W7 |
| **D-3** | 两档越 500 硬限 ⇒ 拆分 | 拆后各档（含新档）`wc -l` **≤500**；**缝保持**（既有导出名 / 调用点零改 · 既有用例零回归） | `PROJECT.md` §6 N-P3 |

## 2. 方案选型对比

### 2.1 D-1 归册判据的读数口径

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | 以**满载读数**为判据（§1 父侧初测 800.1–2267.1 ms） | 与拦截线同源；但同一用例跨跑漂移大——实测同例 `:274` 905→416 ms、`:124` 960→1240 ms | 判据不可复现 ⇒ 复跑读数红/绿漂移，无法作为验收证据 | **否决**：不可复现的判据 = 不可验收 |
| 2 | 以**单跑读数**为判据（§1 口径句；先例 = 批 2 片 1「T-CG18 单跑 450 ms ⇒ 不归册」） | 可复现（例独占进程）；与 `thincoder-vscode/test/slow.mjs:4`「单测 >500ms」同线 | 需逐例 12 次单跑（成本 ≈12 次进程启动）——本批一次性成本可接受 | **选定** |

**两线分立**（承 `thincoder-vscode/test/slow.mjs:4,16`）：**归册线 = 500 ms（单跑）** · **拦截线 = 800 ms（满载实测）**。800 ms 是**负载缓冲**（满并发下的抖动余量），**不是**归册线——二者职责不同，不得混用。 （迁移期引文——v1 慢测层两线机制；v2 已收敛为单入口）

### 2.2 D-2 对表的落点

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 新档 `WEBVIEW-PROTOCOL-AUDIT.md`（拟建名 · 已否决） | 表独立成档、体量宽裕 | 同话题两档 ⇒ 违 D2 单一权威源；协议演进时两处更新 | 否决 |
| 2 | 并入 `docs/vsc/design/WEBVIEW-PROTOCOL.md` 新增节 | 该档已是消息族 + 协议表权威源（头注 §3 · §3.1 演进纪律 · §3.2 协议增量登记） | 档体量 +≈60 行（272 → ≈330） | **选定** |
| 3 | 只记批次档 §5（一次性材料） | 施工记录天然带批次材料 | 长期可复核面缺失（协议读者看不到对表） | 否决 |

### 2.3 D-2 机检形态

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 只有人读表 + 人工复跑 | 表可读 | §1 判据「复跑零未处置」无可重跑证据 ⇒ 人读不可复现 | 否决 |
| 2 | 表内数据 + 结构机检 `thincoder-vscode/test/protocol-coverage.test.mjs`（拟新增；源码提取 ↔ 表比对） | 复跑即证据；形态对齐既有结构机检先例（`test/agent-tools-registry.test.mjs:48` 直读 `src/agent/setup.mjs` 源文本） | 新档 ≈130 行 + `test/files.mjs` 登记 +1 行 | **选定** |
| 3 | 只写测试、不落人读表 | 机检在 | 协议面不可人工复核（评审者读不到发送面清单） | 否决 |

⚠ **判据面判断（评审轮 1 已裁：成立）**：本机检**不读散文**——解析 §12 表**首列结构化单元**（消息判别式名）与源码提取集**双向对账**，**并读第④列**（取值 ∈ {`活`/`删`/`补`} 且无空——「复跑零未处置」由结构机检覆盖）；不查句子、不查子串；形态 = 结构机检（R24a 家族），非「某句在场/缺席」式散文锚。

### 2.4 D-2 `advisor` 族处置

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **删死码**（§1 已判） | 消费位在位而全树零发射点（§1 实测）；正规呈递链已存（digest / auto-turn，`thincoder-vscode/src/agent.mjs` `:29`）；架构已换代（同档 `:79`「advisor/escalate/consult 统一停靠同一容器（独立族废弃）」）；需求池同向（「并发子代理 live 只显工具名」） | 删除需精确到消息分支，且需处理直依该面的 ① 层测试 | **选定** |
| 2 | 复活 host 发射点（补生产者） | 技术可行 | = 新建独立回显面，与已定架构换代相逆（用户裁定方向相反） | 否决 |
| 3 | 保留登记、不删 | 零改动 | 悬空消费者常驻 ⇒ D4 死指针；对表恒留「未处置」⇒ 违背本批判据 | 否决 |

## 3. 设计层

### 3.1 D-1 慢例 `slow(` 归册

**范围**：`thincoder-vscode/test/edit-tool-improvement.test.mjs` 的 12 例（§1 名单：`:41`/`:49`/`:57`/`:65`/`:124`/`:188`/`:196`/`:204`/`:222`/`:234`/`:274`/`:298`，均为裸 `test(`；档行数 326）。**候选集** = 满载拦截点名集 **∪** §1 名单——**并集**内逐例施加同一单跑协议（名单外被点名者同法读数与处置，不豁免——评审轮 1 裁定）。

**测量协议（逐例，可复现）**：例独占进程、关闭并发——`node --test --test-concurrency=1 --test-name-pattern="<例名>" test/edit-tool-improvement.test.mjs`，读数取 TAP 输出的 `duration_ms`。同例如需复跑，**两次读数均入报告**（同位取大者作判定读数，口径一致）。
**转义与守卫**：例名含正则元字符（实测 `:274` 例含 `+`）——`--test-name-pattern` 按 regex 语义须转义（如 `\+`）；且**每例读数前确认恰 1 例被选中**（TAP `tests 1`；零命中 ⇒ 读数作废、改正 pattern 重跑）。
**判据**：单跑 **>500 ms** ⇒ 该例 `test(` → `slow(`（`thincoder-vscode/test/slow.mjs:24-27`——非 FULL 层自动 skip）；单跑 ≤500 ms ⇒ 保持裸 `test(`。
**不归册例的复核路径**：若某例单跑 ≤500 ms 而满载超 800 ms ⇒ 拦截红，处置 = 复跑复核：仍超 800 ms ⇒ 判为 IO 慢例归册；复跑回落 ⇒ 记录负载假红（读数入 §5），不动该例。
**归册后**：`npm test`（= `node test/run.mjs`，单入口）绿——`slow` 纯别名、全量同跑。

### 3.2 D-2 收发面对表 + 死码清理

**枚举口径（唯一，先定后提）**：只取**顶级消息判别式**——host 侧 = `postMessage` 载荷的顶级 `type` / `name`；webview 侧 = 顶级 `switch (msg.type)` / `case` 分发标签 **∪ 顶级 `name` 比较字面量**（`m.name === "<lit>"` / `m.name.startsWith("sub:")` 形态；
动态段归一口径 `sub:<role>#<id>` → `sub:*`——role 枚举复用常量 `FAMILY_ROLES`（`webview/activity-view.js:14`；`activity.js:44` 为其镜像——勿重写字面量））。方向 = **host → webview**（webview → host 的 `postMessage` 不在本表）。

**子判别式不单列**（登记为所属消息的载荷变体，避免过度计数）：`statusText.kind` 族（`webview/status-bar.js`：`busy` / `blocks` / `tokens` / `turn` / `thinking` / `model` / `modelStream` 等）· `subagent.status` 族（`webview/activity.js:298` 起 `done` / `queued` / `running` …）· `compress` 状态族 · `digest` 两型（一型 = 一条消息）。
⇒ **三处已证伪的过度计数**（前次提取把载荷内取值当 `type` 计）：`statusText` 内 kind（over-count #1）· `subagent.status` 值（over-count #2）· `digest` 两型计两条（over-count #3）。

**提取规则（含 1-hop 辅助发射点解析）**：辅助发点必须解析到其载荷构造处，否则漏计数——坐标 as-of 2026-09-16 实核：
- `emitToolPanel`（`src/extension/panel-callbacks.mjs:101`）——载荷构造单点 = `src/extension/panel-toolpanel.mjs:14`（`toolPanelPayload`）；消费缝 = `panel-callbacks.mjs:297`（`onToolPanel`）。
- `post(type, payload)` 助手——全仓唯一 = `thincoder-vscode/src/extension/ledger-surface.mjs`（`:58`；调用点 `:78`）。（前稿坐标系 `extension-panel-post.mjs` 实核**不存在**——glob 零命中，已收正。）
- `postSubagentEvent`（定义 `src/extension/panel-callbacks.mjs:135`）· `flushSubagentOutbox`（`panel-callbacks.mjs:151-159`）· `statusTextPayload`（`panel-callbacks.mjs:195-202`）。
**表内逐行 `file:line` 由提取器输出**（执行时读数）——本档正文不冻结漂移坐标，本节坐标供执行时复核；§1 已给坐标按引用（`chat.js:19`/`:294` · `streaming.js:221`）。

**对表形态**（落 `WEBVIEW-PROTOCOL.md` §12，五列）：

| 列 | 内容 |
|---|---|
| ① 消息判别式 | 顶级 `type` / `name` 字面量 |
| ② host 发射点 | `file:line` / 「无」 |
| ③ webview 分发或消费位 | `file:line` / 「无」 |
| ④ 处置 | `活` / `删` / `补` |
| ⑤ 备注 | 豁免理由 / 消解期 / 关联决策号 |

**处置判定**：`活` = 双向在位；`删` = 消费位在位而发射**恒无**（死码）⇒ 删消费侧 + 清理悬空件；`补` = 发射在位而消费缺失 ⇒ **本批不补**，登记该行 + 转项目技术待办（带消解期；见 KD-8）。

**`advisor` 族删除边界（精确到消息分支）**：
- **删（分支）**：`webview/chat.js` 的 `advisor` 判别分支（§1 实测 `:294`；import 行 `:19` 去名；复位子句 `:185` 同删）。
- **删（态件——级联三档）**：`S._advisorBlock`——声明位 `webview/state.js:81`，复位位 `chat.js:185` / `test/activity-live-ux.test.mjs:48` / `test/async-visibility.test.mjs:319`；`_advisorScrollDirty`——`streaming.js:31` 声明 + `:44` / `:57-63` / `:190`。
- **删（渲染实现）**：`webview/streaming.js:215-235`（JSDoc + `advisorChunk`；§1 实测 `:221` 为函数行）。上列载体与三档级联（`state.js` / 两测试档）全部入 §4 清单。
- **保留判据（不动）**：共享渲染面（`.advisor-content` DOM 类 · `appendAdvisorChunk` / `buildAdvisorBlock`）**仅当**仍被非 advisor 路径（子代理 `subagentChunk`）使用 ⇒ 逐处 grep 判，保留则零改。
- **连带处置**：若保留判据**不成立**（该渲染面亦 advisor 专属）⇒ 其直依测试（`test/activity-flow.test.mjs:110`/`:314`/`:316`/`:402` · `test/activity-live-ux.test.mjs:48`/`:70`）同批处置——① 层测试 = 开发期工具，**退役为常态**（处置行落批次档 §6），改写成业务场景须三条件全满足（业务可观察 + 集成未覆盖 + 可稳定驱动）。
- **不改**：`advisor` **工具**链（核面，`thincoder-vscode/src/agent/execute-tools.mjs:348-349` · `thincoder-vscode/src/agent-tools/async-discard.mjs:98-104` advisor 池）——本批只清**回显面死码**，不动工具/池语义。

**判据（可机判）**：① 提取器复跑零未处置（`test/protocol-coverage.test.mjs` 绿——双向对账 + **第④列**处置枚举无空）② 被删标识符活代码面零命中（`grep -rn` 读数入 §5；射程 = §6 A6 注）③ `npm test` 绿 ④ `npm run doc:check` 零悬空。

### 3.3 D-3 两档越 500 硬限 ⇒ 结构拆分

**先决约束（实核，硬性）**：`test/agent-tools-registry.test.mjs:47-50` 直读 `thincoder-vscode/src/agent/setup.mjs` **源文本**并断言「必须以 `await import()` 动态载入核登记册」——⇒ **动态载入面必须留在 `setup.mjs`**（迁出即该既有结构机检红）。`W9`/`W13` 两条结构机检同理。

**档一：`thincoder-vscode/src/agent/setup.mjs`（654 → 目标 ≤500）**

| 段（as-of `wc -l` 复核；执行时逐段复验） | 行数 | 处置 | 去向 |
|---|---|---|---|
| W9 记账缝注入（`configureBatchSegment` 头注 + 调用 `:54-63`） | 10 | **迁出** | `thincoder-vscode/src/agent/setup-tooltable.mjs`（拟新增） |
| W14 三缝接线：诊断段 `vscodeDiagnosticsSection`（`JSDoc :73-75` + 函数 `:76-105`）+ 注册 `:106` · `wireAgentToolSeams`（`:108-135`） | ≈62 | **迁出** | 同左 |
| 池装配装饰 `withPool`（`:141-161`） | ≈21 | **迁出** | 同左 |
| 子代理面 `vscSubagentFace`（`:163-206`）· 终态回显族（`VSC_TERMINAL_ECHO` `:210-217` · `vscStatusTerminalEcho` `:219-231`） | ≈65 | **迁出** | 同左 |
| `modeRoleField`（`:233-260`） | ≈28 | **迁出** | 同左 |
| **迁出合计** | **≈186**（+ 段间空行/注记 ⇒ 净减 ≈200） | — | `setup.mjs` 654 → **≈455**（净减 ≥154 硬需：满足，余量 ≈46） |
| settings 工具实例 `coreSettingsTool()`（`:44-47`） | 4 | 保留 | 装配调用点在 `hydrateRun` 体内 |
| `buildTopLevelAgent`（`:262-293`） | ≈32 | 保留 | 对外缝 |
| `hydrateRun`（工具装配 `:316-333`/`:350-377` · config 读段 `:379-425` · 槽 reconcile `:427-457` · `toolSchemas` `:459-476` · 绑定/注入/system prompt 组装 `:478-647`） | ≈354 | 保留 | 本轮 opts / `engineering` 体内求值（穿缝需 8+ 每轮实参）· **动态载核面约束**（本节先决） |
| `setupAgentRun`（`:650-654`） | 5 | 保留 | 对外缝 |
| 提醒面（`push*Reminder` / `pushInjections` / `appendImagePointer`） | — | **不动** | 已迁 `setup-reminders.mjs`（`setup.mjs` 仅转口 `:42` + 调用点） |

预计：`setup.mjs` 654 → **≈455**；`setup-tooltable.mjs` ≈220（均 ≤500）。迁出实现全部走**既有静态边**（诊断缝 / 池装饰 / 子代理面 = 既有 import 面）⇒ W8 引擎楼层守卫契约②（静态闭包）零影响。

**档二：`thincoder-vscode/src/extension/panel-messages.mjs`（529 → 目标 ≤500）**

| 段 | 处置 | 去向 |
|---|---|---|
| 会话族 handler（`newSession` / `switchSession` / `deleteSession` / `renameSession` / `setProject` · 历史分页 `loadOlder` / `historyPage`） | **迁出** | 新档 `thincoder-vscode/src/extension/panel-messages-session.mjs`（拟新增） |
| 消息分发骨架 + 模型/推理选择面 | 保留 | `panel-messages.mjs` |
| 子代理取消面（as-of `:243-300` 段——与 advisor 池耦合，`cancelAsyncAdvisor` 动态 import 于 `:270`） | 保留 | `panel-messages.mjs` |

预计：`panel-messages.mjs` 529 → ≈420；`panel-messages-session.mjs` ≈110（均 ≤500）。

**缝保持（两档同法）**：迁出段的**既有导出名一个不改**——`setup.mjs` 以 `export { … } from "./setup-tooltable.mjs"`（拟新增） re-export；
`panel-messages.mjs` 内分发表仍指向同名 handler。⇒ 14 个既有消费档（`thincoder-vscode/src/agent.mjs:15` · `context-parity.test.mjs:24` ·
`expand-home.test.mjs:16` · `thincoder-vscode/test/eng-designer-role.test.mjs:28` · `async-parity.test.mjs:33` · `thincoder-vscode/test/subagent-observe-send.test.mjs:23` ·
`thincoder-vscode/test/setup-reminders.test.mjs:32` · `agent-lifecycle-singleton.test.mjs:29` · `integration/host-shape-spawn.test.mjs:30` 等）**零改**。

**命名避让（实核）**：`src/agent/` 现有 `agent-state` / `context-injections` / `execute-tools` / `run-helpers` / `run-stages` /
`setup-reminders` / `setup` / `tool-gates` ⇒ 无 `setup-tooltable.mjs`；`src/extension/` 现有 `panel-callbacks` / `panel-chat` /
`panel-index` / `panel-mcp` / `panel-messages` / `panel-project` / `panel-session` / `panel-toolpanel` ⇒ 无 `panel-messages-session.mjs`
（`panel-session.mjs` 已存在 ⇒ 命名须带 `messages-` 前缀避让）。**先例** = `panel-toolpanel.mjs` 自 `panel-chat.mjs` 拆出（同一手法）。

## 4. 受影响文件清单（R24a · 行数口径 `wc -l` · as-of 2026-09-16）

| 文件 | 当前行数 | 预计增量 | 性质 |
|---|---|---|---|
| `thincoder-vscode/src/agent/setup.mjs` | 654（§1 实测） | −≈200（迁出 ≈186 行 + 空行/注记；654 → ≈455）+ 缝 re-export 回口 | 改（拆分） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 529（§1 实测） | −≈110（迁出） | 改（拆分） |
| `thincoder-vscode/test/edit-tool-improvement.test.mjs` | 326（§1 实测） | +1（import `slow`）+ 12 处行内替换 | 改（D-1） |
| `thincoder-vscode/webview/chat.js` | 413（§1 实测） | −≈2（`advisor` 分支整行 `:294` + 去名 `:19`/`:185`） | 改（D-2） |
| `thincoder-vscode/webview/streaming.js` | 256 | −≈31（`advisorChunk` `:215-235` + `_advisorScrollDirty` `:31`/`:44`/`:57-63`/`:190`；保留面 = `appendAdvisorChunk` / `buildAdvisorBlock`） | 改（D-2） |
| `thincoder-vscode/webview/state.js` | 126 | −1（`_advisorBlock` 声明 `:81`） | 改（D-2 级联） |
| `thincoder-vscode/test/activity-live-ux.test.mjs` | 162 | −1（复位 `:48`） | 改（D-2 级联） |
| `thincoder-vscode/test/async-visibility.test.mjs` | 401 | −1（复位 `:319`） | 改（D-2 级联） |
| `thincoder-vscode/test/files.mjs` | 82（实测） | +1（登记新测试档） | 改（登记） |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 272 | +≈60（新增 §12 对表） | 改（D-2 落点） |
| `docs/vsc/design/WEBVIEW.md` | 268 | −≈1（`:174` 整行 + `:44`/`:173` 语句级） | 改（D-2 级联） |
| `thincoder-vscode/AGENTS.md` | 122 | 0（`:56` 语句级去「advisor review 块」） | 改（D-2 级联） |
| `docs/vsc/requirements/PROJECT.md` | 72 | +≈14（§6 + §5 指针） | 本轮已改 |
| `docs/vsc/requirements/WEBVIEW.md` | 95 | +2（N-W7） | 本轮已改 |
| `thincoder-vscode/src/agent/setup-tooltable.mjs`（拟新增） | 0 | +≈220 | 新 |
| `thincoder-vscode/src/extension/panel-messages-session.mjs`（拟新增） | 0 | +≈110 | 新 |
| `thincoder-vscode/test/protocol-coverage.test.mjs`（拟新增 · 结构机检） | 0 | +≈130 | 新 |
| `docs/vsc/design/VSC-DEBT.md`（本档） | 0 | +≈270（新档） | 新 |

**超档检查**：全部改/新档预计 ≤500 ⇒ 无需拆分规划。

## 5. 关键决策记录（含否决备选）

| # | 决策 | 否决备选与理由 |
|---|---|---|
| KD-1 | 归册线 = 单跑 500 ms；拦截线 = 满载 800 ms，两线分立 | 合并为一线 ⇒ 判据不可复现（§2.1） |
| KD-2 | 对表落 `WEBVIEW-PROTOCOL.md` §12 | 新档（违 D2）· 只记批次档（不可复核） |
| KD-3 | 枚举口径 = 顶级判别式；子判别式登记不单列 | 计入载荷取值 ⇒ 三处过度计数（§3.2） |
| KD-4 | `advisor` 族 = 删死码，不复活回显面 | 补生产者（逆架构换代）· 保留登记（死指针常驻） |
| KD-5 | 动态载核登记册面**留在** `setup.mjs` | 迁出 ⇒ 既有结构机检红（§3.3 先决约束） |
| KD-6 | 缝 = re-export（导出名零改） | 逐处改指 14 个消费档（改动面 14 倍，无收益） |
| KD-7 | 机检新档 `thincoder-vscode/test/protocol-coverage.test.mjs`（拟新增）解析**表首列 + 第④列**结构化单元（非句子子串） | 纯人读表（无证据）· 只写测试（无人读面） |
| KD-8 | 对表 `补` 行（host 缺发射）本批**不补**，登记 + 转技术待办 | 本批补 ⇒ 新增协议语义 / 新功能，越 §1 边界① | 
| KD-9 | 本批不改慢层机制本身（阈值 / runner 形态） | 改机制 ⇒ 判据面变更，须另走设计 |

**例外登记（带消解期）**：对表 `补` 行的消解路径 = 转 `docs/TODO.md` 技术组条目（触发 = 认账不排期）；到期条件 = 相关消息族下次被触碰时 / 下批收口前。

## 6. 验收标准（逐条回指需求条目 · 可机判）

| # | 验收标准 | 机判命令 / 读数 | 回指 |
|---|---|---|---|
| A1 | 12 例逐例单跑读数在案（ms，含复跑读数） | 报告表逐例一行（§3.1 测量协议） | `PROJECT.md` §6 N-P2 |
| A2 | 单跑 >500 ms 者已 `slow(` 归册 | `grep -n "slow(" thincoder-vscode/test/edit-tool-improvement.test.mjs` | `PROJECT.md` §6 N-P1 |
| A3 | 归册后 `npm test` 绿（单入口——无拦截线） | `cd thincoder-vscode && npm test` ⇒ exit 0 | `PROJECT.md` §6 N-P1 |
| A4 | 对表逐行在位（五列无空） | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 | N-W7 |
| A5 | 复跑零未处置 | `cd thincoder-vscode && node --test test/protocol-coverage.test.mjs` ⇒ pass | `WEBVIEW.md` §3 N-W7 |
| A6 | 删项后零悬空引用 | `grep -rn -e "_advisorBlock" -e "_advisorScrollDirty" -e "advisorChunk" thincoder-vscode/src thincoder-vscode/webview thincoder-vscode/test thincoder-vscode/AGENTS.md`（大小写敏感——`appendAdvisorChunk`/`buildAdvisorBlock` 保留不误伤）⇒ 0 命中 | `WEBVIEW.md` §3 N-W7 |
| A7 | 拆后各档 ≤500 | `wc -l` 逐档读数（`setup.mjs` / `panel-messages.mjs` / 两新档） | `PROJECT.md` §6 N-P3 |
| A8 | 缝保持（既有用例零回归） | `npm test` 全绿；`agent-tools-registry.test.mjs` 绿 | `PROJECT.md` §6 N-P3 |
| A9 | 门禁全绿 + 文档锚零悬空 | `npm run lint` → `npm test`；`npm run doc:check` | 全部 |

> **A6 射程口径**：grep 面 = 产品树活代码面（`src` / `webview` / `test`）+ 端壳登记档 `AGENTS.md`；`thincoder-vscode/docs/**`（冻结参照历史——含 `design/WEBVIEW.md` `:1265-1266`/`:1377`/`:1385`/`:1784` · `requirements/AGENT-LOOP.md` `:229`/`:257`/`:264` 等）与本批批次档**命中不判悬空**（B 式迁移前旧档 + 批材料，原地一字不改）。

## 7. 用例表（正常 / 边界 / 错误）

| # | 类型 | 输入 | 期望输出 | 映射 |
|---|---|---|---|---|
| T-1 | 正常 | 逐例单跑 12 例 | 12 行读数在案，超阈者 `slow(` | D-1 |
| T-2 | 边界 | 单跑 495 ms 例（≤500） | 保持裸 `test(`，`npm test` pass | D-1 |
| T-3 | 边界 | 单跑 505 ms 例（>500） | `slow(` 归册（纯别名——不 skip，单入口仍跑） | D-1 |
| T-5 | 正常 | 提取器跑全量 | 提取集 ↔ §12 表首列集双向零差 ⇒ pass | D-2 |
| T-6 | 边界 | 某 type 仅 host 发射、webview 零消费 | 表内登记为 `补` 行（非 `未处置`）⇒ pass | D-2 |
| T-7 | 错误 | 源码新增 type 未登记 | 测试红并点名该 type | D-2 |
| T-8 | 正常 | 删 `advisor` 族后全树 grep | 被删标识符零命中 | D-2 |
| T-9 | 正常 | `wc -l` 四档 | 各 ≤500 | D-3 |
| T-10 | 边界 | 迁出段边界（同档内唯一导出名） | re-export 在位 ⇒ 既有 import 面零改、用例零回归 | D-3 |
| T-11 | 错误 | `setup.mjs` 动态载核面被误迁 | `agent-tools-registry.test.mjs` 红（点名 `await import()` 缺失） | D-3 |

## 8. 边界（本批不做）

1. 不改 VSC 既有**行为语义**——除死码删除（D-2）与结构搬移（D-3）。
2. 不动 CLI 树 / 核树（除镜像面确证必需）；不动批 1–6 已收口内容。
3. 不新增协议语义；不给 host 缺失发射点补生产者（KD-8）。
4. 不做需求池「并发子代理 live 只显工具名」本条（另案）。
5. 不动慢层机制本身（阈值 / runner / 脚本形态）。
6. 不做协议表**全量重排**或历史节回改（§3.2 增量登记纪律：只增不改）。
7. 不做「补」行消解（转技术待办）；不补 F-W4 活卡面用例（`WEBVIEW.md` N-W5 既有消解路径，另批）。

## 9. UI/交互决策落档

| # | 决策 | 用户可见变化 | 状态 |
|---|---|---|---|
| U-1 | `advisorChunk` 专用回显块**不复活**（呈递走 digest / auto-turn 正规链） | 无新增可见面；`advisor` 专用块不再出现（本就无生产者 ⇒ 现网零变化） | 已定（§1 裁定） |
| U-2 | 活动区块形态 / 类名（含 `.advisor-content`）**保持不变** | 零变化（保留判据成立时） | 已定（§3.2 保留判据） |
| U-3 | 拆分为纯结构搬移 | 零变化（导出名与调用点不变） | 已定 |
| U-4 | 对表 `补` 行（host 缺发射）后续是否补建 | 待定 | `open`（转技术待办后另批定） |

## 10. 三方条目一致（硬规则）

| 批次档 §2 条目 | 设计档验收回指 | 需求档条目 |
|---|---|---|
| D-1 | A1 / A2 / A3 | `PROJECT.md` §6 N-P1 · N-P2 |
| D-2 | A4 / A5 / A6 | `WEBVIEW.md` §3 N-W7 |
| D-3 | A7 / A8 / A9 | `PROJECT.md` §6 N-P3 |

同一来源 = §1「本批条目」1/2/3；无增项、无缺项。

## 12. 四档结构拆分（2026-09-18 批 · 越档面处理）

> 任务书 = `docs/batches/2026-09-18-vsc-large-file-split.md` §1（父侧 · 需求已确认）；本批条目 = 该档 §1.2 条目①（N-P3 四档拆分）。
> 读数口径 = `wc -l`（= 换行符数）。**本刻实测 as-of 2026-09-18 22:3x**——父侧给出值以本表为准（逐档复测已在案）。
> 判据源 = `docs/vsc/requirements/PROJECT.md` §6 **N-P3**（产品树任一档 ≤500 行；越档 ⇒ 结构拆分并保持对外缝）。本批建议线 = **主档 ≤300**（批次档 §1.2）。

### 12.1 触发与实测读数

| 档 | 父侧给读数 | 本刻实测 | 距 500 硬限 | 越 300 咨询线 |
|---|---|---|---|---|
| `panel-chat.mjs` | 426 | **499** | **1 行** | 是 |
| `panel-messages.mjs` | 487 | **487** | 13 行 | 是 |
| `panel-callbacks.mjs` | 未测 | **385** | 115 行 | 是 |
| `panel-session.mjs` | 356 | **355** | 145 行 | 是 |

**F-1（发现项 · 读数不符）**：父侧给 `panel-chat.mjs` = 426，实测 **499**（差 73）——疑与 `chat-panel.mjs`（425 行）读数混淆。
⇒ 本档实为**四档中唯一贴线者**（499；下一次触碰即越 500）——实施次序中列为最后一步 + 首要回归对象（12.5）。

**本批范围外的越档面（登记 · 不处理）**：`chat-panel.mjs` **441** · `settings.mjs` **409**（均 >300 咨询线、≤500 硬限；读数 = 2026-09-19 复测——init-block 批后 `wc -l`）；`suspension.mjs` 读数见下行「上行通道批读数收正」块（本批已触碰——读数归该块单源）。
上述越档面（`chat-panel.mjs` / `suspension.mjs` / `settings.mjs` 三档）不在批次档 §1.2 范围内 ⇒ 本批不动，留后续批（触发 = 下次触碰；触线判据 = 块内**逐档触线（单源）**行）。

**上行通道批（2026-09-19-upstream-channel-availability）读数收正（2026-09-20 · 实现轮实核；口径 `find /c /v ""` ≡ `wc -l`）**：
`thincoder-vscode/src/extension/suspension.mjs` **397 → 406**（>300 咨询线、≤500 硬限；本批净增 = 开轮谓词 + 旗标 + 日志载荷）；
`thincoder-vscode/src/agent.mjs` **485 → 492**（**逼近 500 硬限（余 8 行）**——N-P3 口径；本批净增 = 端壳 drain 消费点 + 载体表 12 → 14 款 + 旗标 + 域文本组合调用；
**拆分计划已落地** = 域文本常量族外提 `thincoder-vscode/src/agent/turn-domains.mjs`（本批新增档，该档净移出 8 行））。

**机制层端差批（2026-09-20-mechanism-parity-batch）读数收正（实现轮实核 · 2026-09-20；口径 `find /c /v ""` ≡ `wc -l`）**：
`thincoder-vscode/src/agent.mjs` **现盘 494**（触发线 **>495**——**未触** · 距 500 硬限 **6** 行；拆分候选在册 = 响应后处理段 → `agent/response-stages.mjs`（拟新增））；
`thincoder-vscode/src/agent/run-stages.mjs` **现盘 403**（>300 咨询线、≤500 硬限）；
`thincoder-vscode/src/agent/execute-tools.mjs` **现盘 418**（同上）；
`thincoder-vscode/src/agent/setup.mjs` **现盘 495**（触发线 **>497**——**未触** · 距 500 硬限 **5** 行；拆分候选在册 = 配置读段 → `agent/setup-config.mjs`（拟新增））；
`thincoder-vscode/src/extension/permission-gate.mjs` **109 → 117**（+8：门体改经核 `askPermission` 的 `io.ask` 缝；<300 咨询线）；
`thincoder-vscode/test/files.mjs` **现势回填 120**（+3 = `vsc-stream-rules.test.mjs` / `scoped-rules.test.mjs` / `nested-token-relay.test.mjs` 登记）。
**触发线未触（as-of 2026-09-20 复测）**：`agent.mjs` 494（线 >495）· `setup.mjs` 495（线 >497）；距 500 硬限 **6 / 5** 行。
**逐档触线（单源）**：`agent.mjs` **>495** · `setup.mjs` **>497** · `run-stages.mjs` / `execute-tools.mjs` **>450**（源 = `docs/batches/2026-09-20-vsc-rules-retry-batch.md` §2.4 / §5.8）；未列档触发 = 触碰时复核（拆分候选按 §12.2 各档）——§12.1 各行「触发」口径以此为准（`:265` 同指）。
本批新增用例档（均 <300 咨询线）：`test/lifecycle-hooks.test.mjs` **264** · `test/dispatch-hooks.test.mjs` **217** · `test/permission-gate-seam.test.mjs` **102**。
**测试档越线登记（续）**：`thincoder-vscode/test/ledger.test.mjs` **324**（`wc -l`；>300 咨询线——本批 T-LQ 组追加后；≤500 硬限，无拆分义务）。

**批后新档（2026-09-19 · init-block 批）**：`provider-probe-window.mjs` **122**——`settings.mjs` 探针窗口族外提产物（N-P3 体量拆分 · 缝 = re-export；≤300 咨询线，无拆分义务）。

**测试档越线登记（2026-09-19 · init-block 批后）**：`thincoder-vscode/test/session-boot.test.mjs` **440**（`wc -l`——>300 咨询线、≤500 硬限）；逐项登记，**非全量普查**（端面其余 >300 档 = 普查面，见批次档 §2）。

**主档越线登记（2026-09-21 · SIGNAL-LINES 批后 · 父侧小项收正 · 可 revert）**：`thincoder-vscode/webview/chat.js` **449**（`wc -l` 口径——>300 咨询线、≤500 硬限；本批净增 +4 = digest 标签两档取键 + `n > 0` 计数元素规则）；逐项登记，**非全量普查**。
**主档越线登记（2026-09-21 · vsc-no-folder-guard 批后 · 父侧小项收正 · 可 revert）**：
`thincoder-vscode/src/extension/panel-messages.mjs` **300 → ≈303** · `thincoder-vscode/src/extension/panel-session.mjs` **299 → ≈307**（均本批**首次**越 >300 咨询线、≤500 硬限；增量 = 无工作区守卫接线；无拆分义务，触发 = 下次实质触碰）；
`thincoder-vscode/webview/chat.js` **449 → 451**（读数复测——存量越线，本批 +2）。逐项登记，**非全量普查**；结论载荷 = 批次档 `docs/batches/2026-09-21-vsc-no-folder-guard.md` §2 跨文件限段。
**实施后实测补记（2026-09-21 · #53）**：`panel-messages.mjs` **305**（304）· `panel-session.mjs` **313**（312）· `chat-panel.mjs` **487**（486——距 500 硬限 ≈13 行，无拆分义务在册）· `webview/chat.js` **452**（**451** ✓）· 新档 `workspace-guard.mjs` **59**（<300 ✓）✗ `test/workspace-guard.test.mjs` **487**（<500 ✓，超设计估计不阻塞）。

### 12.2 逐档方案（职责分面 · 六新档）

#### 12.2.1 `panel-chat.mjs`（499 → ≈240）—— 回合驱动面

| 迁出面 | 行段（as-of 实测） | 行数 | 去向 |
|---|---|---|---|
| 回合执行循环 + controller 工厂 | `newTurnController` 43-65 · `runTurnLoop` 385-498 | 137 | `panel-turn-loop.mjs`（拟新增） |
| 回合阶段：provider / 模型解析 | `runPanelChatImpl` 内 178-235 | 58 | `panel-turn-stages.mjs`（拟新增） |
| 回合阶段：收尾落盘与状态归位 | finally 体 311-350 | 40 | 同上 |
| 回合阶段：挂起会话接管 | 352-382 | 31 | 同上 |

新档职责（一句话）：`panel-turn-loop.mjs` ≈157 行 = **回合执行循环面**（runAgent 续跑 / ContinueError / Ctrl+I 中断续跑 + 回合 controller 工厂）；
`panel-turn-stages.mjs` ≈154 行 = **回合阶段函数面**（`panel-callbacks.mjs` 头注既立的「骨干—细节两层」细节层：provider/模型解析 · 收尾落盘 · 挂起接管）。

**保留（不得迁出 · 硬约束）**：`runPanelChatImpl` 入口守卫段 112-177 —— `test/engine-floor-guard.test.mjs:152-154` 直读本档源文本，断言
「`ensurePanelAgent(panel, turnSlot)` 之后在本档内出现 `ensureMemoryHandle()`」（句柄创建点同址）；该段迁出 ⇒ 既有结构机检红。
另保留：行加载 + 回调装配段 236-310 · `runPanelChat` 包装 · `agentSlotMatches` / `ensurePanelAgent`。

**搬运契约 · 段 A（provider / 模型解析段 178-235 → `panel-turn-stages.mjs`）**——评审轮 1 发现 #2 补：

三处提前 `return`（`:214` 无 provider · `:221` buildProvider 抛错 · `:223` `!p`）**均在 impl 外层 `try`（`:154`）内**，语义 = 退出 `runPanelChatImpl` **并触发 finally**（`:311`）；迁入 helper 后 `return` 只退 helper ⇒ 必须**判别式回传 + 调用侧翻译**：

| # | 项 | 规则（逐项） |
|---|---|---|
| A-1 | 控制流翻译 | helper 回传 `{ done: true }`（三段早退之一——该路径原已发 `error` 消息即返回）/ `{ done: false, providerName, p, slotStamp, slotData }`；调用侧 `const stage = await resolveTurnStage({ … })` 后 `if (stage.done) return`——**翻译位必须留在 try（`:154`）内**（落 try 外 ⇒ finally 段不执行 ⇒ 落盘 / 标题 / 忙态归位 / `loading:false` 全缺 = 语义变更） |
| A-2 | 回传面（消费位实测） | `providerName`（`:272` prefs · `:290` callbacks deps）· `p`（`:272` · `:290` · `:310`）· `slotStamp`（`:290` · `:329`）· `slotData`（`:244` `panel._autoApprove`）；**`slotRef` 不入面**（`:196` / `:227` 段内消费尽） |
| A-3 | 入参面 | `panel` · `turnSlot` · `providerName`（初值 = `opts` 解构 `:112`）· `modelOverride` · `reasoning`；随迁 import = `getKey` / `providerNames` / `buildProvider`（`presets.mjs`）· `resolveProviders`（`config-io.mjs`）· `resolveTurnModelAndStamp`（`turn-model.mjs`）· `resolveReasoningMode`（`reasoning-mode.mjs`）· `specForModel`（`specs.mjs`）· `t`（`i18n.mjs`） |
| A-4 | 槽读取次数不变 | `slotData = panel._activeData(turnSlot)` **每回合单次读**（`:185`；单次读理由见 `:242-243`）——不得为回传而重读 |
| A-5 | 发射位随迁 | `:214` / `:220` / `:223` 三处 `postMessage({ type: "error", … })` 随段迁出（`error` 判别式他档亦有发射位 ⇒ 提取集不变；坐标列漂移见 §12.12 上抛 3） |

**搬运契约 · 段 B（挂起会话接管段 352-382 → `panel-turn-stages.mjs`）**——同发现 #2 / #3 补：

段内无提前 `return`，唯一出口 = 段尾自然结束 ⇒ 直搬 + 参数化（无需判别式）。

| # | 项 | 规则（逐项） |
|---|---|---|
| B-1 | 入参面 | `panel` · `turnSlot` · **`distillSlot`**（`:366` 读——**finally 段参数清单（`:388`）不含此项**，今须单列）· `history` / `fullHistory`（`:371` lines 双键 + `poolLive(history)` `:359`）· `skipSession` · `susp` · `_cwd`（`:361`）· `suspensionSession` / `poolLive`（`suspension.mjs`） |
| B-2 | **回调注入项（防环）** | `runTurn` 闭包（`:362-364`）调 `runPanelChat`（定义于 `panel-chat.mjs:92`）⇒ 该函数**列为注入项**：调用侧传 `deps.runChat = runPanelChat`，helper 内 `await deps.runChat(panel, { … 实参逐字照搬 … })` ⇒ 新档**不 import 主档** |
| B-3 | 机判判据 | `grep -n 'from "./panel-chat.mjs"' thincoder-vscode/src/extension/panel-turn-stages.mjs` ⇒ **零命中**（命中即产生 §12.5 环清单外的 `panel-chat ⇄ panel-turn-stages` 环） |

**两段共性纪律**：逐字搬迁（注释一并随迁）· 闭包变量**参数化入 deps**（与 `runTurnLoop`（`:396`）/ finally 段（`:388`）同形）· 不新增分支 / 不改判据。

#### 12.2.2 `panel-messages.mjs`（487 → ≈245）—— 消息分发面

| 迁出面 | case 行段（as-of 实测） | 行数 | 去向 |
|---|---|---|---|
| 设置 / provider / guard / MCP 族（28 case：saveProviderKey … testProxy） | 327-416 · 451-485 | 125 | `panel-messages-settings.mjs`（拟新增） |
| 回合交互族（10 case：abort / cancelSubagent / interrupt / openFile / openDiff / questionResponse / setAutoApprove / atComplete / permissionResponse / batchPermissionResponse） | 167-272 · 274-326 | 159 | `panel-messages-turn.mjs`（拟新增） |

新档职责：`panel-messages-settings.mjs` ≈160 行 = **设置类消息 handler 面**（渠道 / 密钥 / MCP / Shell / 代理 / guard / 计划模式）；
`panel-messages-turn.mjs` ≈189 行 = **回合交互 handler 面**（中止 / 子代理取消 / 问答 / 权限 / approve-all / 编辑器动作）。

手法 = `panel-messages-session.mjs` 既定先例（case 体逐字搬出为 `handleXxx(panel, msg)` 导出；case 包裹大括号去除 · 中途 `break` → `return` · 尾 `break` 去除）。
**分发表骨架 + 全部 case 标签留主档**（转发行 `case "x": await handleX(panel, msg); break`）——保证 case 标签集合零变化（对表机检的提取集不动）。

⚠ **命名约束（实测 · 硬）**：`test/protocol-coverage-reverse.test.mjs:33` `HOST_DISPATCH = "panel-messages"` —— 该机检只扫 `src/extension/panel-messages*.mjs` 的顶级 `case` 标签。
⇒ 两新档名**必须以 `panel-messages` 前缀**（`panel-messages-settings` / `panel-messages-turn` 合规；命名 `panel-settings.mjs` 之类 ⇒ case 标签逸出扫描域 ⇒ 机检红）。

留主档：`_cwd` / `setProjectFolder` / `clearProjectOverride` / `routeUserTurn` / `handlePanelMessage` 骨架 + `webviewReady` + `userMessage` / `selectModel` / `selectReasoning` / `retry` / 会话族转发。

#### 12.2.3 `panel-callbacks.mjs`（385 → ≈255）—— 回调装配面

| 迁出面 | 行段（as-of 实测） | 行数 | 去向 |
|---|---|---|---|
| relay 中继面（事件 token + 内容 chunk + `emitToolPanel`） | 23-124 | 102 | `panel-subagent-relay.mjs`（拟新增） |
| 任务可见性投递队列（`WV_OUTBOX_MAX` / `postSubagentEvent` / `flushSubagentOutbox`） | 126-159 | 34 | 同上 |

新档职责：`panel-subagent-relay.mjs` ≈158 行 = **子代理 → webview 投递面**（核 relay 前缀 token/chunk 转换 + 暗窗口投递队列）。
留主档：`makeAskInPanel` / `statusTextPayload` / `postDigestCap` / `buildPanelCallbacks`（回调工厂——本档核心职责）。

⚠ **RELAYS 登记与 1-hop 解析面（实测 · 硬 · 评审轮 1 发现 #1 修正）**：`test/protocol-coverage.test.mjs:31-35` RELAYS 表 —— 该机检遇 `postMessage(<裸标识符>)` 且非本地绑定时 **fail-closed 断言「该档必须有 RELAYS 登记（按档名精确匹配）」**；命中后 `relayLiterals(code, relay.fn)`（`:107-114`）**只在同档**扫 `fn(` 调用点取载荷 `type:` 字面量（解析序 `:177-181`）。

**1-hop 解析面成立的结构约定（逐项）**——`subagent` / `subagentApproval` 两判别式的 host 提取面在搬移后仍非空（`subagent` 另有直发位 `thincoder-vscode/src/extension/suspension.mjs:108`——不依赖本面；**`subagentApproval` 的 host 面本面独有 ⇒ 本 🔴 的实质风险面**）：

| # | 项 | 规则 |
|---|---|---|
| R-1 | 持 RELAYS 行的档 | **新档 `panel-subagent-relay.mjs`（拟新增）**——补登**一行**，行格式与既有两行**逐字同形**（先例 = `test/protocol-coverage.test.mjs:33-34`：无 `thincoder-vscode/` 前缀、无注记）：`{ file: "src/extension/panel-subagent-relay.mjs", fn: "postSubagentEvent" }`。依据 = 查找系**精确等值**（`RELAYS.find((r) => r.file === rel)` · `test/protocol-coverage.test.mjs:177`；`rel` = `relOf` 产出的相对 VSC 根形式 `src/...` · 同档 `:91`）⇒ 照字面带前缀 ∕ 带注记 ⇒ 零匹配 ⇒ `:178` fail-closed 红 ⇒ A13 红 |
| R-2 | 该档的裸标识符发射位 | 随迁的 `postSubagentEvent` 定义体 `postMessage(payload)`（原 `panel-callbacks.mjs:137`）+ `flushSubagentOutbox` 的 `postMessage(payload)`（原 `:155`）——**该档全部裸标识符位（唯二）**，均在 R-1 行覆盖下 |
| R-3 | 字面量构造面**必须同档**（契约核心） | `relayLiterals` 只扫本档 ⇒ 新档须有携带字面量的 `postSubagentEvent(` 调用点：① `relaySubagentEventToken` 的 `emit`（原 `:51`——随 relay 面迁出，含 `type: "subagent"`）；② **两处新转口**（本契约新增 · 零语义）：`postSubagentStatus(panel, info)` → `postSubagentEvent(panel, { type: "subagent", …info })` · `postSubagentApproval(panel, info)` → `postSubagentEvent(panel, { type: "subagentApproval", …info })`（载荷构造逐字承原调用点 · 返回值原样 `return`） |
| R-4 | 原调用点（留主档 · 改委托） | `panel-callbacks.mjs:257` / `:260` 两行改 `onSubagent: (info) => postSubagentStatus(panel, info)` · `onSubagentApproval: (info) => postSubagentApproval(panel, info)`——`buildPanelCallbacks` 其余装配面零改（本档核心职责，留主档） |
| R-5 | 原 RELAYS 行处置（**判据收正**） | `{ file: "src/extension/panel-callbacks.mjs", fn: "postSubagentEvent" }` **删除**——搬移后主档零裸标识符发射位 ⇒ 该行**成为死登记**（原记「保留态无害，且承载 onSubagent / onSubagentApproval 发射点解析」**与机检实读不符**）。兜底 = 主档若再现裸标识符位，fail-closed 断言（`:178`）立即点名要求重新登记——安全网在机制内，不靠保留死行 |
| R-6 | 机判（A13 覆盖面） | ① `cd thincoder-vscode && node --test test/protocol-coverage.test.mjs` ⇒ exit 0；② `node test/protocol-coverage.test.mjs --emit` ⇒ 输出含 `subagent` / `subagentApproval` 两行且 host 列**非「无」**；③ `grep -n 'file: "src/extension/' test/protocol-coverage.test.mjs` ⇒ **恰两行**（`src/extension/ledger-surface.mjs` · `src/extension/panel-subagent-relay.mjs`），**无** `src/extension/panel-callbacks.mjs`（换位后按 R-5 已删；模式须取 `src/extension/` 全形——`panel-` 前缀命中不了 ledger 行）；④ `WEBVIEW-PROTOCOL.md:366` 该行**处置列**仍 = `活` 成立（消费位 `thincoder-vscode/webview/chat.js:285` 不动；T-6 `wrongDisp` 空 = `:339-341`） |

**失败形态（两个方向都不静默）**：新档无字面量构造点 ⇒ `relayLiterals` 空 ⇒ `:180` 断言红；只漏 `subagentApproval` 一半 ⇒ 该判别式退出 host 提取集 ⇒ T-6 `wrongDisp` 红（表记 `活` ∕ 实得 `删`）。

#### 12.2.4 `panel-session.mjs`（355 → ≈259）—— 会话装配面

| 迁出面 | 行段（as-of 实测） | 行数 | 去向 |
|---|---|---|---|
| 槽写装配面 `saveLines`（字段往返契约） | 64-138 | 75 | `panel-session-write.mjs`（拟新增） |
| 标题写面 `generateTitle` | 256-278 | 23 | 同上 |

新档职责：`panel-session-write.mjs` ≈122 行 = **会话写面**（双线落盘装配 + 标题生成）。
留主档：`ensureSlot` / `activeData` / `activeHistory` / `activeLines` / `loadModelPrefs` / `loadSession` / `loadOlder` / `sendHistoryPage` / `newSession` / `deleteSession` / `pushSessions` / `openSessionContent` / `status`（读面 + 会话操作面）。

### 12.3 对外缝清单（既有导出名 · 零改判据）

**判据（唯一）**：12.3 表内每个 `档 → 导出名` 的**外部消费点 import 语句逐字不变**（迁移段实行 re-export 转口；KD-12）。

| 档 | 导出名 | 外部消费点（as-of 实测） | 保持方式 |
|---|---|---|---|
| `panel-messages.mjs` | `_cwd` | `chat-panel.mjs:16` · `thincoder-vscode/src/extension/ledger-surface.mjs:19` · `panel-index.mjs:21` · `panel-messages-session.mjs:19` · `panel-project.mjs:8` · `panel-session.mjs:20` · 测试 `agent-lifecycle-singleton:34` · `async-visibility:26` · `compaction-echo:20` · `session-boot:19` | 定义留主档 |
| | `setProjectFolder` | `chat-panel.mjs:16` · `panel-project.mjs:8` · `image-downgrade.test:14` · `memory-index-face.test:25` | 同上 |
| | `clearProjectOverride` | `chat-panel.mjs:16` · `image-downgrade.test:14` · `memory-index-face.test:25` | 同上 |
| | `routeUserTurn` | `chat-panel.mjs:16` · `image-downgrade.test:14` | 同上 |
| | `handlePanelMessage` | `chat-panel.mjs:16` · 测试 12 档（`async-parity:37` · `async-visibility:26` · `chat-panel.test:26` · `chat-panel-messages:23` · `child-permission:22` · `config-io-panel:17` · `image-downgrade:14` · `session-boot:19` · `settings-empty-no-write:20` · `settings-open-snapshots:20` · `webview-permission-batch-release:19` · integration 3 档） | 同上（case 标签集合零变化） |
| `panel-chat.mjs` | `runPanelChat` | `chat-panel.mjs:17` · `chat-panel.test:27` | 定义留主档 |
| | `newTurnController` | `chat-panel-messages.test:24`（+ 本档内 **4** 调用点：`panel-chat.mjs:283`（留主档 · impl 内）+ `:436` / `:445` / `:462`（随 `runTurnLoop` 迁出）） | 迁出 + re-export |
| | `agentSlotMatches` / `ensurePanelAgent` | `agent-lifecycle-singleton.test:33` | 定义留主档（同址机检约束） |
| `panel-callbacks.mjs` | `buildPanelCallbacks` | `panel-chat.mjs:41` · `subagent-content-relay.test:16` · integration 2 档 | 定义留主档 |
| | `makeAskInPanel` | `panel-chat.mjs:41` · `chat-panel-messages.test:25` · integration `scenario-05:19` | 同上 |
| | `postDigestCap` | `panel-chat.mjs:41` · `digest-visibility.test:14` | 同上 |
| | `statusTextPayload` | `status-line.test:17` | 同上 |
| | `relaySubagentEventToken` | `panel-messages.mjs:28` · `chat-panel-messages.test:388`（动态） · `subagent-content-relay.test:16` | 迁出 + re-export |
| | `postSubagentEvent` | `thincoder-vscode/src/extension/suspension.mjs:27` · `async-visibility.test:24` | 迁出 + re-export |
| | `flushSubagentOutbox` | `panel-messages.mjs:28` · `async-visibility.test:24` | 迁出 + re-export |
| | `WV_OUTBOX_MAX` | `async-visibility.test:24` | 迁出 + re-export |
| | `emitToolPanel` / `relaySubagentContentChunk` | 外部零消费（本档内 + 文档注释） | 迁出 + 主档 import（re-export 亦无害） |
| `panel-session.mjs` | `saveLines` | `chat-panel.mjs:20` · `agent-lifecycle-singleton.test:36` · `config-io-panel.test:84`（动态） · `provider-model-guard.test:175/184/194`（动态） | 迁出 + re-export |
| | `generateTitle` | `chat-panel.mjs:20` · `at-refs-restore.test:19` | 迁出 + re-export |
| | 其余 **13** 名（`ensureSlot` / `activeData` / `activeHistory` / `activeLines` / `loadModelPrefs` / `loadSession` / `loadOlder` / `sendHistoryPage` / `newSession` / `deleteSession` / `pushSessions` / `openSessionContent` / `status`） | `chat-panel.mjs:20` · `panel-chat.mjs:25` · `panel-messages.mjs:11` · `panel-project.mjs:9` · 测试 3 档 | 定义留主档 |

### 12.4 零语义判据（命令级）

1. `cd thincoder-vscode && npm test`（= `node test/run.mjs`，单元 + 集成清单）⇒ **exit 0**，用例计数 ≥ 基线（本晚 661+；实现轮先记录基线读数，再逐步对齐——批次档 §1.5 判据 1）。
2. `cd thincoder-vscode && npm run lint`（`scripts/check-syntax.mjs`）⇒ exit 0。
3. **缝核**（逐条 grep，零改判据）：
   `grep -rn "panel-\(messages\|chat\|callbacks\|session\)\.mjs" thincoder-vscode/src thincoder-vscode/test --include=*.mjs`
   ⇒ 既有 import 行**逐字不变**（本批只允许新增行——新档间的 import；既有行的路径 + 符号名集合零改）。
4. **行数读数**（口径 = `wc -l` = 换行符数；Windows 无 `wc` 时用等价 node 式）：
   四主档：`cd thincoder-vscode/src/extension && wc -l panel-messages.mjs panel-chat.mjs panel-callbacks.mjs panel-session.mjs`
   六新档：`cd thincoder-vscode/src/extension && wc -l panel-messages-settings.mjs panel-messages-turn.mjs panel-turn-loop.mjs panel-turn-stages.mjs panel-subagent-relay.mjs panel-session-write.mjs`
   （Windows 无 `wc` 时用等价式自拟——口径 = 换行符计数；读数逐档入表。）
   ⇒ 十档逐档 ≤500（硬限），四主档 ≤300（建议线）。
5. `node scripts/doc-check.mjs --root .`（在 `thincoder/` 根）⇒ **判据 = 按档归属零新增**（本批改动档 = `docs/vsc/design/VSC-DEBT.md`：零新增悬空 ∕ 零新增超宽行）。全档读数（悬空总数 ∕ 行宽总数）只作**过程记录**——他档存量与他席在途增量**不计入本批门禁**（批 §1.5 判据 3 原文即「按档归属零新增」）。

   > 读数构成（as-of 2026-09-18 22:50 复跑 · 本修正轮实测）：悬空 **5**（`docs/cli` 2 · `docs/core` 3）+ 行宽 **11**（均在 `docs/core/**`）——两项皆为**存量**，不在本批改动面。
   > 交付时点曾录行宽 **13** = 基线 11 + **他席在途档** `docs/vsc/design/WEBVIEW.md:105` / `:118` 两行（该档 mtime 22:45 已收正 ⇒ 本刻复跑回落 11）；**构成在案**：他席 2 行不属本批归属 ⇒ 不构成门禁。
   > 口径提示：行宽判据**豁免表格行**（`scripts/doc-check-width.mjs:56-62` + 谓词 `isTableRow` `:40`）⇒ 本档宽表行不触发该门。
6. 两条协议机检 ⇒ pass：`cd thincoder-vscode && node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs`（提取集零变化 + RELAYS 登记后 fail-closed 满足）。

### 12.5 实施次序（依赖 · 由叶到根）

**依赖图（本批相关边；箭头 = import 方向）**
- 既有：`chat-panel → {panel-messages, panel-chat, panel-session}` · `panel-messages → {panel-session, panel-messages-session, panel-callbacks}` · `panel-session → panel-messages`（环 · B2 先例）· `panel-chat → {panel-messages, panel-session, panel-callbacks}`
- 新增（消息面）：`panel-messages → {panel-messages-settings, panel-messages-turn}`（两新档反向 import `_cwd`——与 `panel-messages-session.mjs` 同形环）
- 新增（回合面 / 投递面 / 会话面）：
  `panel-chat → {panel-turn-loop, panel-turn-stages}`（**无环**——`panel-turn-stages.mjs` 不 import 主档：
  接管段的 `runTurn` 闭包调 `runPanelChat`（`panel-chat.mjs:363`）已列为**注入项**，否则即构成 `panel-chat ⇄ panel-turn-stages` 环；
  契约与机判见 §12.2.1 段 B B-2 / B-3）
  · `panel-callbacks → panel-subagent-relay`（**无环**）· `panel-session → panel-session-write`（环 1 处：新档 import `pushSessions`）

**环安全判据（承 B2 先例 · 逐档核）**：环上两模块顶层**只 import 绑定、零跨环读取**；全部解引用在函数体内（延迟解引用）⇒ 环安全（模块加载期不触达对端绑定）。

| 步 | 动作 | 门禁 |
|---|---|---|
| 1 | `panel-session.mjs` → `panel-session-write.mjs`（依赖最少） | `npm test` + `npm run lint` |
| 2 | `panel-callbacks.mjs` → `panel-subagent-relay.mjs`（+ RELAYS 一行） | 同上 + 协议两机检 |
| 3 | `panel-messages.mjs` → `panel-messages-settings.mjs` + `panel-messages-turn.mjs` | 同上 |
| 4 | `panel-chat.mjs` → `panel-turn-loop.mjs` + `panel-turn-stages.mjs`（最敏感：回合驱动 + 收尾 finally 体） | 全量：`npm test` + `npm run lint` + 协议两机检 + `doc-check` |

**第 4 步附加纪律**：收尾 `finally` 体（311-350）整段迁出 = 本批**最敏感搬移**——逐字搬迁（注释一并随迁）、捕获变量参数化（`turnSlot` / `history` / `fullHistory` / `slotStamp` / `isFirstMessage` / `susp` / `skipSession`），异常传播语义等价（async 函数内抛异常 ≡ 原 finally 内抛异常——均覆盖 try 内异常）；该步单独 diff 审查后再跑门禁。

### 12.6 受影响文件表（R24a · 行数口径 `wc -l` · as-of 2026-09-18 实测）

| 文件 | 现读数 | 预估拆后 | 性质 |
|---|---|---|---|
| `thincoder-vscode/src/extension/panel-chat.mjs` | 499 | ≈240（−259） | 改（拆分） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 487 | ≈245（−242） | 改（拆分） |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | 385 | ≈255（−130） | 改（拆分） |
| `thincoder-vscode/src/extension/panel-session.mjs` | 355 | ≈259（−96） | 改（拆分） |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs`（拟新增） | 0 | ≈157 | 新 |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs`（拟新增） | 0 | ≈154 | 新 |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs`（拟新增） | 0 | ≈160 | 新 |
| `thincoder-vscode/src/extension/panel-messages-turn.mjs`（拟新增） | 0 | ≈189 | 新 |
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs`（拟新增） | 0 | ≈158 | 新 |
| `thincoder-vscode/src/extension/panel-session-write.mjs`（拟新增） | 0 | ≈122 | 新 |
| `thincoder-vscode/test/protocol-coverage.test.mjs` | 384 | 0（RELAYS 表换位：加 `panel-subagent-relay.mjs` 行 ∕ 删 `panel-callbacks.mjs` 死行——§12.2.3 R-1 / R-5） | 改（机检登记） |
| `docs/vsc/design/VSC-DEBT.md`（本档） | 252 → **483**（设计轮）→ **547**（评审轮 1 修正轮落笔后 · `wc -l` 实测；252 = 批前 HEAD） | —（**文档档**：行数规则已废 ⇒ 无拆分义务；读数仅作过程记录，见本表下方超档检查） | 改（设计落点 · §12 节） |

**命名避让（实测）**：`src/extension/` 现无 `panel-turn-*` / `panel-messages-settings` / `panel-messages-turn` / `panel-subagent-relay` / `panel-session-write` ⇒ 六新档名可用。
**超档检查（射程收正——评审轮 1 发现 #4）**：**源 / 测试档（四主档 + 六新档）**预计全部 ≤300（最大 ≈259）⇒ 无需二次拆分规划；**零档越 500 硬限**。
**文档档（`.md`）不适用行数规则**——>300 软线 ∕ >500 硬限只约束**程序代码**，文档不受行数限制（**用户 2026-09-16 裁定**「300 行 500 行那是对程序代码的限制」；单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.7）⇒ 本档（及 `WEBVIEW-PROTOCOL.md`）**无拆分义务**、本表文档行读数只作过程记录；批 7 在本档 `:168` 留的「>300 软线 ⇒ 随档补一行拆分规划」义务句随规则废止**删除**（同轮收正，见 §12.13）。

### 12.7 关键决策记录（续 KD-9）

| # | 决策 | 否决备选与理由 |
|---|---|---|
| KD-10 | 六新档**同批**拆出（非逐档零敲碎打） | 逐档单拆 ⇒ 同一回归集跑四遍（成本同量级、收敛慢）；四档同族（端壳面板层）一次做完 |
| KD-11 | 消息两新档名以 `panel-messages` 前缀 | 其他前缀 ⇒ case 标签逸出 `protocol-coverage-reverse` 扫描域（`HOST_DISPATCH = "panel-messages"`）⇒ 机检红（§12.2.2 实测） |
| KD-12 | 缝 = re-export（导出名零改）——逐处改指调用方否决 | 消费点 30+ 处（§12.3）⇒ 改动面 30 倍且无收益（承 KD-6） |
| KD-13 | `newTurnController` 随回合循环迁出（re-export 保缝） | 留主档 ⇒ 新档反向 import 主档（平白多一环）；且它与 `runTurnLoop` 的 controller 重建语义同族 |
| KD-14 | `panel-turn-stages.mjs` 合并「准备 + 收尾」两面（不拆两档） | 拆两档 ⇒ 各 ≈60-80 行碎片档；两面同属「impl 阶段细节层」（`panel-callbacks.mjs` 头注既立手法） |
| KD-15 | 收尾 `finally` 体**迁出**（非保留） | 保留 ⇒ 主档 ≈277（余量 23 行，下一批在 panel-chat 增行即逼近建议线）；迁出后主档 ≈240（余量 60） |
| KD-16 | 本批**不动**范围外三越档（`chat-panel.mjs` / `suspension.mjs` / `settings.mjs`——读数与登记 = §12.1，D2 单源） | 越批次档 §1.2 范围 ⇒ 属"改需求面"；登记 §12.1，留后续批（触发条件同 N-P3） |
| KD-17 | 投递面两转口（`postSubagentStatus` / `postSubagentApproval`）随 relay 面入新档；原 `onSubagent` / `onSubagentApproval` 改委托 | 评审轮 1 #1 修正：`relayLiterals` 只扫**同档** ⇒ 字面量构造面必须同在持 RELAYS 行的档。否决备选：① 投递队列留主档（机检免动，但主档 ≈283、投递面与回调装配面职责混叠）② 主档留字面量副本（重复构造点 = 双源，违 D2） |
| KD-18 | 段 B 的 `runPanelChat` 回调**注入**（`deps.runChat`），不登记环 | 评审轮 1 #3 修正。否决备选：登记 `panel-chat ⇄ panel-turn-stages` 环 + 顶层零跨环读取判据（可行但平白多一环；注入零语义且免一条环登记） |
| KD-19 | 文档档（`.md`）行数**不承载**拆分 / 标注义务——本档读数只作过程记录 | 评审轮 1 #4 修正。依据 = 用户 2026-09-16 裁定 + `docs/core/design/DOC-DISCIPLINE.md` §3.7（文档行数规则废除）。否决备选：给本档补一行拆分规划（承批 7 旧软线句——规则已废，补即违用户裁定） |

### 12.8 验收标准（续 A9 · 逐条回指需求条目 · 可机判）

| # | 验收标准 | 机判命令 / 读数 | 回指 |
|---|---|---|---|
| A10 | 四主档 + 六新档逐档 `wc -l` ≤500，四主档 ≤300 | §12.4 第 4 条读数命令（十档逐行输出） | `PROJECT.md` §6 N-P3 |
| A11 | 对外缝零改（§12.3 表逐条） | §12.4 第 3 条 grep ⇒ 既有 import 行逐字不变 | N-P3（既有导出名 / 调用点零改） |
| A12 | 零语义：`npm test` 全绿、计数不降 | `cd thincoder-vscode && npm test` ⇒ exit 0 | 批次档 §1.5 判据 1 |
| A13 | 协议两机检绿（提取集零变化 + RELAYS fail-closed 满足 + **1-hop 解析面成立**） | `node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` ⇒ exit 0；**#1 闭合面四条**（§12.2.3 R-6）：① `--emit` 含 `subagent` / `subagentApproval` 且 host 非「无」 ② `grep -n 'file: "src/extension/' test/protocol-coverage.test.mjs` ⇒ 恰两行（`ledger-surface.mjs` · `panel-subagent-relay.mjs`）且无 `panel-callbacks.mjs`——同 §12.2.3 R-6③ 口径 ③ `WEBVIEW-PROTOCOL.md:366` 该行**处置列**仍 = `活`（T-6 `wrongDisp` 空） ④ `panel-turn-stages.mjs` 零 import 主档（§12.2.1 段 B B-3） | N-P3（保持对外缝） |
| A14 | `doc-check` **按档归属零新增** | `node scripts/doc-check.mjs --root .` ⇒ 本批改动档（`docs/vsc/design/VSC-DEBT.md`）零新增悬空 ∕ 零新增超宽行；全档读数为过程记录（构成见 §12.4 第 5 条：13 = 11 + 他席在途 2） | 批次档 §1.5 判据 3 |
| A15 | 行数读数逐档留档（四主档 + 六新档） | 实施轮读数表（批次档 §5） | 批次档 §1.5 判据 2 |

### 12.9 用例表（正常 / 边界 / 错误 · 续 T-11）

| # | 类型 | 输入 | 期望输出 | 映射 |
|---|---|---|---|---|
| T-12 | 正常 | 拆分后全量 `npm test` | 全绿（计数 ≥ 基线） | A12 |
| T-13 | 正常 | 逐个导出缝 grep（§12.3 逐条） | 既有 import 行逐字不变 | A11 |
| T-14 | 边界 | 主档行数贴建议线（300）场景 | 十档（四主档 + 六新档）逐档 `wc -l` 读数入表 ⇒ ≤500（硬限）· 四主档 ≤300（建议线）——**与 A10 同一条**（文档档不列行数读数） | A10 |
| T-15 | 边界 | 环 import（messages ↔ messages-settings ↔ session；session ↔ session-write） | 两模块顶层零跨环读取 ⇒ 加载即通过（测试绿） | A12 |
| T-16 | 错误 | re-export 漏项（如 `saveLines` 未转口） | 消费档 import 失败 ⇒ `npm test` 红并点名该档 | A11 |
| T-17 | 错误 | 新档含裸标识符 `postMessage(payload)` 而 RELAYS 未登记 | `protocol-coverage.test.mjs` 红（fail-closed 点名该档） | A13 |
| T-18 | 错误 | `panel-chat.mjs` 入口守卫段误迁（`ensurePanelAgent` / `ensureMemoryHandle` 异址） | `engine-floor-guard.test.mjs` 红（"句柄创建点在 ensurePanelAgent 同址"） | A12 / A13 |

### 12.10 边界（本批不做）

1. 不改**任何行为 / 协议 / 消息类型**——纯结构搬移 + 既有导出 re-export（零语义变更）。
2. 不动四档之外的越档面（`chat-panel.mjs` · `suspension.mjs` · `settings.mjs`——读数与登记 = §12.1，D2 单源）。
3. 不改需求档 `docs/vsc/requirements/PROJECT.md`（§5/§6 读数同步 = 父侧笔——本档给待同步读数）。
4. 不新增测试档（本批只给 `thincoder-vscode/test/protocol-coverage.test.mjs` 补一行 RELAYS 登记；`thincoder-vscode/test/files.mjs` 零改）。
5. 不改 `_archive/**`、不改已收口批档（`docs/batches/2026-09-16-*.md` 等）。
6. 不做"顺手优化"（不合并 / 不改名既有导出、不改注释语义、不清理既有死码）。

### 12.11 UI/交互决策落档（续 U-4）

| # | 决策 | 用户可见变化 | 状态 |
|---|---|---|---|
| U-5 | 四档拆分 = 纯结构搬移（既有导出名与调用点不变） | 零可见变化 | 已定（批次档 §1.3） |

### 12.12 三方条目一致（本批）

| 批次档 §2 条目 | 设计档验收回指 | 需求档条目 |
|---|---|---|
| ① N-P3 四档拆分（六新档 · 保对外缝） | A10 / A11 / A12 / A13 / A14 / A15 | `PROJECT.md` §6 **N-P3** |

同一来源 = 批次档 §1.2 条目①；无增项、无缺项。

**上抛项（写域外 · 待父侧裁）**

1. `docs/vsc/requirements/PROJECT.md` §5 / §6 读数同步（父侧笔）：§5 越档面指针节 + §6 N-P3 判定句不变；建议 §5 补本批实测读数行（§12.1 表）。
2. `thincoder-vscode/AGENTS.md:53` 模块地图行——六新档名是否本批同步（该档 = 产品文本面，不在本批写域）。
3. `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 / §13 表内 host 发射点坐标将随搬移漂移（表由 `protocol-coverage.test.mjs --emit` **执行时读数**产出）——是否本批用 `--emit` 复跑刷新（写域外）。

### 12.13 评审轮 1 修正（8 项逐条 · 2026-09-18）

> 依据 = 批次档 `docs/batches/2026-09-18-vsc-large-file-split.md` §3 轮次 1（🔴 1 · 🟡 3 · 🔵 4；VERDICT: changes-required）；`Suggestion` 列 = 评审建议，处置执行 = 本席。
> 本轮**只改设计面**（不改实现面代码 ∕ 需求档 ∕ 已收口批档）；**零新语义** = 补搬运契约 + 收正读数 ∕ 判据口径。

| # | 发现（严重级） | 处置 · 落点 |
|---|---|---|
| 1 | 🔴 1-hop 解析面断裂（搬移后 `subagentApproval` 退出 host 提取集 ⇒ T-6 `wrongDisp` 红） | 补 **§12.2.3 R-1–R-6** 结构约定（持 RELAYS 行的档 = 新档 · 该档裸标识符位唯二 · 字面量构造面同档 = `relaySubagentEventToken.emit` + 两转口 · 原行判「死登记」删除 · 机判四条）+ §12.8 **A13** 判据句覆盖该面 + KD-17 |
| 2 | 🟡 两段回合阶段缺搬运契约 | 补 **§12.2.1「搬运契约 · 段 A / 段 B」**——段 A：`done` 判别式 + 翻译位在 try 内 + 回传 4 项 + 入参 5 项 + 单次读槽；段 B：入参 7 项（含 `distillSlot`）+ 注入项 + 机判 grep |
| 3 | 🟡 「无环」断言不成立（接管段闭包调 `runPanelChat`） | `runPanelChat` 列为**注入项**（§12.2.1 段 B B-2/B-3）⇒ `panel-chat → panel-turn-stages` 仍单向；§12.5 依赖行同步；环清单维持 4 处（**不新增环**）+ KD-18 |
| 4 | 🟡 本档读数失真 + 本档未入超档检查 | §12.6 本档行读数收正（**252 → 483 → 547** · `wc -l`；原记 253 +≈190 = 两种口径混用且失真）+ 超档检查**射程收正**（文档档不适用行数规则 · 用户 2026-09-16 裁定 · `DOC-DISCIPLINE.md` §3.7）+ 批 7 义务句（`:168`）删除 + KD-19 |
| 5 | 🔵 `newTurnController` 本档调用点计数 | §12.3 行改 **4**（`:283` 留档 · `:436` / `:445` / `:462` 随 `runTurnLoop` 迁出——逐位标出） |
| 6 | 🔵 `panel-session` 留档导出名计数 | §12.3 行改 **13** 名（枚举本身完整：15 导出 − 迁出 2） |
| 7 | 🔵 机检档读数 | §12.6 行改 **384**（`wc -l` 口径；原记 385 = split 式含末行空段） |
| 8 | 🔵 T-14 与 A10 不一致 | §12.9 T-14 期望输出按 **A10** 收正（十档 ≤500 · 四主档 ≤300） |

**待裁项（写域外 · 同规则面残留）**：文档行数规则旧口径在本档其余位置的残留——`:34`（KD-2 候选评估栏「272 → ≈330 … 随档给拆分规划行」）与 §4 受影响文件表五处文档行读数（`WEBVIEW-PROTOCOL.md` ∕ `WEBVIEW.md` ∕ `AGENTS.md` ∕ 需求档两处）；本轮**只收正 #4 点名的规则源句（`:168`）与 §12.6 本档行**，其余登记待父侧裁。

### 12.14 评审轮 2 修正（3 项逐条 · 2026-09-18）

> 依据 = 批次档 `docs/batches/2026-09-18-vsc-large-file-split.md` §3 轮次 2（🟡 3 · VERDICT: pass）；`Suggestion` 列 = 评审建议，处置执行 = 本席。
> 本轮**只收正格式 ∕ 机判模式 ∕ 判据口径**（不改实现面 ∕ 需求档 ∕ 已收口批档）；🔵 5 条按父侧裁「登记不改」——本轮未动。

| # | 发现（严重级） | 处置 · 落点 |
|---|---|---|
| 1 | 🟡 RELAYS 新行带 `thincoder-vscode/` 前缀（照字面补登 ⇒ 精确等值查找零匹配 ⇒ `:178` fail-closed 红 ⇒ A13 红） | §12.2.3 **R-1** 收正：行格式与既有两行**逐字同形**——去 `thincoder-vscode/` 前缀与「（拟新增）」注记（**行字面单源 = R-1 行内码段**，本处不复制）+ 补依据句（查找系精确等值 · `test/protocol-coverage.test.mjs:177`）；R-6③ ∕ A13② 同点对齐 |
| 2 | 🟡 R-6③ ∕ A13② 机判模式命中面与预期不符（`panel-` 前缀命中不了 `ledger-surface` 行 ⇒ 换位后按字面仅 1 命中而预期写两行） | 模式改 **`grep -n 'file: "src/extension/'`**（换位后恰两行 = `ledger-surface.mjs` + `panel-subagent-relay.mjs` · 无 `panel-callbacks.mjs`——与预期同义）；两处**同点对齐**（§12.2.3 R-6③ ∕ §12.8 A13②） |
| 3 | 🟡 行宽基线不一致（A14 ∕ §12.4#5 记 11 · 交付时点实测 13 ⇒ 实施轮按字面必红） | 判据改写为 **「按档归属零新增」**（= 批 §1.5 判据 3 原文）+ 登记构成 **13 = 基线 11 + 他席在途 2 行**（`WEBVIEW.md:105` / `:118`）+ 行宽豁免表格行口径提示；两处同步（§12.4#5 ∕ §12.8 A14） |

## 11. 变更记录

- 2026-09-16：建档（批 7 设计轮）——需求承载 + 选型对比（D-1/D-2/D-3 各节）+ 受影响文件清单（R24a）+ 关键决策 KD-1–KD-9 + 验收 A1–A9 + 用例 T-1–T-11 + 边界 + UI 决策（U-1–U-4，含 `open` 1 条）+ 三方一致表。

- 2026-09-16（**批 7 · 评审轮 1 修正轮**）：按批次档 §3（轮次 1）落地——D-2 级联三档补入 §4（`state.js` / `activity-live-ux` / `async-visibility`；`activity.js` 行实核撤除——零改）+ 文档级联（`docs/vsc/design/WEBVIEW.md` `:44`/`:173`/`:174` · `thincoder-vscode/AGENTS.md:56`）+ A6 射程口径（活面三树 + `AGENTS.md`；`docs/**` 冻结参照豁免）。
  同轮：协议档 §10 行数口径收正（273 → 272，`wc -l` 实核；`split` 式计数含末行空段）· 提取规则坐标收正（`panel-toolpanel.mjs:14` / `thincoder-vscode/src/extension/ledger-surface.mjs:58`）· 判据①扩读第④列 · D-3 档一逐段清单（迁出 ≈186 ≥ 154 硬需）· `files.mjs` 现行数 82 · 测量协议转义/单例守卫 · `N-P*`/`N-W7` 全引处加档限定。

- 2026-09-18（**VSC 四档结构拆分批 · 设计轮**）：本档 §12 建档——任务书 = `docs/batches/2026-09-18-vsc-large-file-split.md` §1；越档四档本刻实测（`panel-chat.mjs` **499** · `panel-messages.mjs` **487** · `panel-callbacks.mjs` **385** · `panel-session.mjs` **355**）。
  内容 = 逐档职责分面 ⇒ **六新档**方案 + 对外缝清单（§12.3）+ 零语义判据（命令级 · §12.4）+ 实施次序四步（§12.5）+ 受影响文件表（§12.6）+ 决策 KD-10–KD-16 + 验收 A10–A15 + 用例 T-12–T-18 + 边界 + U-5 + 三方一致表。
  同轮发现：**F-1** 父侧给 `panel-chat.mjs` 读数 426 与实测 **499** 不符（差 73 · 疑与 `chat-panel.mjs` 425 混淆）——该档为四档中唯一贴线者（距硬限 1 行）；另登记范围外三越档（`chat-panel.mjs` 425 · `suspension.mjs` 397 · `settings.mjs` 384）。上抛 3 项见 §12.12。

- 2026-09-18（**VSC 四档结构拆分批 · 评审轮 1 修正轮** · eng-designer——承批次档 §3 轮次 1 八项）：补 §12.2.1 两段搬运契约（段 A `done` 判别式 + 回传 ∕ 入参逐项 · 段 B 入参含 `distillSlot` + `runPanelChat` 注入项）；
  §12.2.3 RELAYS 与 1-hop 解析面结构约定（R-1–R-6，含原 `panel-callbacks.mjs` 行判「死登记」收正）· A13 判据句覆盖该面 · T-14 按 A10 收正；
  读数收正：本档 252 → 483（设计轮）→ **547**（本轮落笔后 `wc -l` 实测）· 机检档 384 · `newTurnController` 调用点 4 · 留档导出名 13；新增 KD-17–KD-19 + §12.13 修正记录。**零语义**：不改实现面 ∕ 需求档 ∕ 已收口批档。

- 2026-09-18（**VSC 四档结构拆分批 · 评审轮 2 修正轮** · eng-designer——承批次档 §3 轮次 2 三条 🟡）：§12.2.3 **R-1** RELAYS 行格式收正（去 `thincoder-vscode/` 前缀与「（拟新增）」注记 ⇒ 与既有两行同形）+ 依据句；
  **R-6③ ∕ A13②** 机判模式改 `grep -n 'file: "src/extension/'`（换位后恰两行——`ledger-surface.mjs` + `panel-subagent-relay.mjs`，无 `panel-callbacks.mjs`；两处同点对齐）；
  **§12.4#5 ∕ A14** 判据改写为「**按档归属零新增**」+ 登记构成 **13 = 基线 11 + 他席在途 2 行**（`docs/vsc/design/WEBVIEW.md:105` / `:118` · 该档 mtime 22:45 已收正 ⇒ 本刻复跑 11）+ 行宽豁免表格行口径提示；新增 §12.14。**零新语义**：不改实现面 ∕ 需求档 ∕ 已收口批档 ∕ 🔵 五条（父侧裁「登记不改」）。
- 2026-09-19（**init-block 批 · fix 轮 5** · eng-designer——承批次档 §6 第 9 项）：§12.1 三越档读数复测（`chat-panel.mjs` **441** · `suspension.mjs` **397** · `settings.mjs` **409**——2026-09-19 `wc -l`）+ **批后新档登记**（`provider-probe-window.mjs` **122**）；KD-16 / §12.10#2 的三档读数复述改 §12.1 指针（D2 单源）。**零新语义**。
- 2026-09-19（**init-block 批 · fix 轮** · eng-designer——承批次档 §6）：§12.1 补**测试档越线登记**（`test/session-boot.test.mjs` **440** · `wc -l` 口径——>300 咨询线、≤500 硬限；逐项登记非全量普查）。**零新语义**。
- 2026-09-20（**P2 机制层端差批 · 车道 3 设计档落笔轮 · eng-designer**——承 `docs/batches/2026-09-20-mechanism-parity-batch.md` §2.1 / §2.15 车道 3 行）：§12.1 增本批读数收正块
  （`agent.mjs` 483 → 478 · `run-stages.mjs` 377 → 402 · `execute-tools.mjs` 393 → 407 · `setup.mjs` 481 → 489 · `permission-gate.mjs` 109 → 117 · `files.mjs` 116）+ **`agent.mjs` 拆分触发条件更新**（触发 = 净增越 490）
  + 测试档越线续登记（`ledger.test.mjs` **324**）。**零新语义**。
- 2026-09-20（**库存清账批 · v1 测试门词面收正 · eng-designer**——承 `docs/batches/2026-09-20-residual-sweep-batch.md` §2 · 台账 #128）：§1 D-1 行 · §2.1 两线分立段 · §3.1 标题与归册后句 · §6 A3 / A8 / A9 · §7 T-2 / T-3 收正为 v2 单入口词面（`slow` 纯别名）；
  T-4（`slow-gate` 拦截面）随机制撤除**整行删**；权威源行收正（`thincoder-vscode/test/run.mjs` 单入口 + `TESTING.md` §10）。**零新语义**。
- 2026-09-20（**卫生族批 · 台账 #140 · eng-designer**——承 `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2）：§12.1 机制层端差批读数块按现盘刷新
  （`agent.mjs` **494** · `run-stages.mjs` **403** · `execute-tools.mjs` **418** · `setup.mjs` **495** · `files.mjs` **120**）+ **触发线未触**注
  + **逐档触线（单源）**句（源 = vsc-rules-retry 批 §2.4 / §5.8）+ 越档面触发句改指块内单源行。**零新语义**。
- 2026-09-21（**vsc-no-folder-guard 批 · 父侧小项收正 · 可 revert**）：§12.1 主档越线登记补本批三档（`panel-messages.mjs` ≈303 · `panel-session.mjs` ≈307——首次越线；`webview/chat.js` 451——存量复测），结论载荷 = 批次档 §2 跨文件限段。**零新语义**。
