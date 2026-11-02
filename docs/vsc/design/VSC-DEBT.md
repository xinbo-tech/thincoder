# VSC 产品树残留债清零（VSC-DEBT）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）。板块 = **VSC 产品树残留债清零**。
> 需求侧回指 = `docs/vsc/requirements/PROJECT.md` §6（N-P1 / N-P2 / N-P3——本部分编号域；与 CLI 树 `docs/core/design/PROMPT-SYSTEM.md` 的 `N-P1`–`N-P3` 同号不同域，全引处须带档限定）· `docs/vsc/requirements/WEBVIEW.md` §3（N-W7）。
> 权威源（**本档不重述**——D2）：webview 消息族与协议表 = `docs/vsc/design/WEBVIEW-PROTOCOL.md`；测试入口 = `thincoder-vscode/test/run.mjs`（单入口——`slow` = 纯别名；测试门权威 = `docs/core/design/TESTING.md` §10）；文档体系判据 = `docs/core/design/DOC-SYSTEM.md`。
> 坐标 = 仓根相对路径 + `:行`。
> 论域 = VSC 产品树（`thincoder-vscode/**`）+ 基准层文档（`docs/vsc/**`）。

## 1. 需求层承接（三条）

| # | 条目（承 §1 条目 1/2/3） | 判定句（验收语义） | 需求条目（回指） |
|---|---|---|---|
| **D-1** | 12 例慢例 `slow(` 归册 | 逐例**单跑**读数在案；单跑 **>500 ms** 者一律 `slow(` 归册；归册后 `npm test` 绿（单入口——`slow` 纯别名，无拦截线） | `docs/vsc/requirements/PROJECT.md` §6 N-P1 / N-P2 |
| **D-2** | 收发面全量对表 + 死码清理 | 表逐行在位（顶级判别式 · host 发射点 · 消费位 · 处置）；复跑**零未处置**；删项后全树**零悬空引用** | `WEBVIEW.md` §3 N-W7 |
| **D-3** | 两档越 500 软线 ⇒ 拆分（主动审视结论） | 拆后各档（含新档）`wc -l` **≤500**；**缝保持**（既有导出名 / 调用点零改 · 既有用例零回归） | `docs/vsc/requirements/PROJECT.md` §6 N-P3 |

## 3. 设计层

### 3.1 D-1 慢例 `slow(` 归册

**测量协议（逐例，可复现）**：例独占进程、关闭并发——`node --test --test-concurrency=1 --test-name-pattern="<例名>" test/edit-tool-improvement.test.mjs`，读数取 TAP 输出的 `duration_ms`。同例如需复跑，**两次读数均入报告**（同位取大者作判定读数，口径一致）。

**转义与守卫**：例名含正则元字符（实测 `:274` 例含 `+`）——`--test-name-pattern` 按 regex 语义须转义（如 `\+`）；且**每例读数前确认恰 1 例被选中**（TAP `tests 1`；零命中 ⇒ 读数作废、改正 pattern 重跑）。

**判据**：单跑 **>500 ms** ⇒ 该例 `test(` → `slow(`（`thincoder-vscode/test/slow.mjs:24-27`——非 FULL 层自动 skip）；单跑 ≤500 ms ⇒ 保持裸 `test(`。

**不归册例的复核路径**：若某例单跑 ≤500 ms 而满载超 800 ms ⇒ 拦截红，处置 = 复跑复核：仍超 800 ms ⇒ 判为 IO 慢例归册；复跑回落 ⇒ 记录负载假红（读数入 §5），不动该例。

**归册后**：`npm test`（= `node test/run.mjs`，单入口）绿——`slow` 纯别名、随集成测试同跑。

### 3.2 D-2 收发面对表 + 死码清理

**枚举口径（唯一，先定后提）**：只取**顶级消息判别式**——host 侧 = `postMessage` 载荷的顶级 `type` / `name`；webview 侧 = 顶级 `switch (msg.type)` / `case` 分发标签 **∪ 顶级 `name` 比较字面量**（`m.name === "<lit>"` / `m.name.startsWith("sub:")` 形态；

动态段归一口径 `sub:<role>#<id>` → `sub:*`——role 枚举复用常量 `FAMILY_ROLES`（`thincoder-render-core/subblocks/activity-view.mjs:14`；`activity.js:44` 为其镜像——勿重写字面量））。方向 = **host → webview**（webview → host 的 `postMessage` 不在本表）。

**子判别式不单列**（登记为所属消息的载荷变体，避免过度计数）：`statusText.kind` 族（`webview/status-bar.js`：`busy` / `blocks` / `tokens` / `turn` / `thinking` / `model` / `modelStream` 等）

· `subagent.status` 族（`thincoder-render-core/subblocks/state.mjs:79-80` 起 `done` / `queued` / `running` …）· `compress` 状态族 · `digest` 两型（一型 = 一条消息）。

⇒ **三处已证伪的过度计数**（前次提取把载荷内取值当 `type` 计）：`statusText` 内 kind（over-count #1）· `subagent.status` 值（over-count #2）· `digest` 两型计两条（over-count #3）。

**提取规则（含 1-hop 辅助发射点解析）**：辅助发点必须解析到其载荷构造处，否则漏计数——坐标实核：
- `emitToolPanel`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:124`）——载荷构造单点 = `src/extension/panel-toolpanel.mjs:14`（`toolPanelPayload`）；消费缝 = `panel-callbacks.mjs:226`（`onToolPanel`）。
- `post(type, payload)` 助手——全仓唯一 = `thincoder-vscode/src/extension/ledger-surface.mjs`（`:58`；调用点 `:78`）。
- `postSubagentEvent`（定义 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:167`）· `flushSubagentOutbox`（`panel-subagent-relay.mjs:201-209`）· `statusTextPayload`（`panel-callbacks.mjs:72-79`）。
**表内逐行 `file:line` 由提取器输出**（执行时读数）——本档正文不冻结漂移坐标，本节坐标供执行时复核；§1 已给坐标按引用（`chat.js:19`/`:294` · `streaming.js:221`）。

**对表形态**（落 `WEBVIEW-PROTOCOL.md` §12，五列）：

| 列 | 内容 |
|---|---|
| ① 消息判别式 | 顶级 `type` / `name` 字面量 |
| ② host 发射点 | `file:line` / 「无」 |
| ③ webview 分发或消费位 | `file:line` / 「无」 |
| ④ 处置 | `活` / `删` / `补` |
| ⑤ 备注 | 豁免理由 / 消解期 / 关联决策号 |

**处置判定**：`活` = 双向在位；`删` = 消费位在位而发射**恒无**（死码）⇒ 删消费侧 + 清理悬空件；`补` = 发射在位而消费缺失 ⇒ **不补**，登记该行 + 转项目技术待办（带消解期；见 KD-8）。

**`advisor` 族删除边界（精确到消息分支）**：
- **删（分支）**：`webview/chat.js` 的 `advisor` 判别分支（§1 实测 `:294`；import 行 `:19` 去名；复位子句 `:185` 同删）。
- **删（态件——级联三档）**：`S._advisorBlock`——声明位 `webview/state.js:81`，复位位 `chat.js:185`；`_advisorScrollDirty`——`streaming.js:31` 声明 + `:44` / `:57-63` / `:190`。
- **删（渲染实现）**：`webview/streaming.js:215-235`（JSDoc + `advisorChunk`；§1 实测 `:221` 为函数行）。上列载体与级联档（`state.js`）全部入 §4 清单。
- **保留判据（不动）**：共享渲染面（`.advisor-content` DOM 类 · `appendAdvisorChunk` / `buildAdvisorBlock`）**仅当**仍被非 advisor 路径（子代理 `subagentChunk`）使用 ⇒ 逐处 grep 判，保留则零改。
- **连带处置**：若保留判据**不成立**（该渲染面亦 advisor 专属）⇒ 其直依测试同批处置——① 层测试 = 开发期工具，**退役为常态**，改写成业务场景须三条件全满足（业务可观察 + 集成未覆盖 + 可稳定驱动）。
- **不改**：`advisor` **工具**链（advisor 池）——只清**回显面死码**，不动工具/池语义。

**判据（可机判）**：① 被删标识符活代码面零命中（`grep -rn` 读数入 §5；射程 = §6 A6 注）② `npm test` 绿 ③ `npm run doc:check` 零悬空。

### 3.3 D-3 两档越 500 软线 ⇒ 结构拆分

**先决约束（硬性）**：**动态载入面（`await import()` 动态载核登记册）必须留在 `setup.mjs`**——迁出即破该结构约束。

**档一：`thincoder-vscode/src/agent/setup.mjs`（654 → 目标 ≤500）**

| 段（`wc -l` 复核；执行时逐段复验） | 行数 | 处置 | 去向 |
|---|---|---|---|
| W9 记账缝注入（`configureBatchSegment` 头注 + 调用 `:54-63`） | 10 | **迁出** | `thincoder-vscode/src/agent/setup-tooltable.mjs` |
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
| 会话族 handler（`newSession` / `switchSession` / `deleteSession` / `renameSession` / `setProject` · 历史分页 `loadOlder` / `historyPage`） | **迁出** | 新档 `thincoder-vscode/src/extension/panel-messages-session.mjs`（**114** 行） |
| 消息分发骨架 + 模型/推理选择面 | 保留 | `panel-messages.mjs` |
| 子代理取消面（`:243-300` 段——与 advisor 池耦合，`cancelAsyncAdvisor` 动态 import 于 `:270`） | 保留 | `panel-messages.mjs` |

预计：`panel-messages.mjs` 529 → ≈420；`panel-messages-session.mjs` ≈110（均 ≤500）。

**缝保持（两档同法）**：迁出段的**既有导出名一个不改**——`setup.mjs` 以 `export { … } from "./setup-tooltable.mjs"` re-export；
`panel-messages.mjs` 内分发表仍指向同名 handler。⇒ 既有消费档（`thincoder-vscode/src/agent.mjs:15` 等）**零改**。

**命名避让（实核）**：`src/agent/` 现有 `agent-state` / `context-injections` / `execute-tools` / `run-helpers` / `run-stages` /
`setup-reminders` / `setup` / `tool-gates` ⇒ 无 `setup-tooltable.mjs`；`src/extension/` 现有 `panel-callbacks` / `panel-chat` /

`panel-index` / `panel-mcp` / `panel-messages` / `panel-project` / `panel-session` / `panel-toolpanel` ⇒ 无 `panel-messages-session.mjs`
（`panel-session.mjs` 已存在 ⇒ 命名须带 `messages-` 前缀避让）。**先例** = `panel-toolpanel.mjs` 自 `panel-chat.mjs` 拆出（同一手法）。


## 5. 关键决策记录

| # | 决策 |
|---|---|
| KD-1 | 归册线 = 单跑 500 ms；拦截线 = 满载 800 ms，两线分立（合并为一线 ⇒ 判据不可复现） |
| KD-2 | 对表落 `WEBVIEW-PROTOCOL.md` §12（该档即消息族与协议表单源；另开新档违 D2） |
| KD-3 | 枚举口径 = 顶级判别式；子判别式登记不单列（计入载荷取值 ⇒ 过度计数） |
| KD-4 | `advisor` 族 = 删死码，不复活回显面（复活逆架构换代；保留登记 = 死指针常驻） |
| KD-5 | 动态载核登记册面**留在** `setup.mjs`（迁出 ⇒ 既有结构机检红） |
| KD-6 | 缝 = re-export（导出名零改；逐处改指 14 个消费档，改动面 14 倍且无收益） |
| KD-7 | 机检新档 `thincoder-vscode/test/protocol-coverage.test.mjs` 解析**表首列 + 第④列**结构化单元（非句子子串） |
| KD-8 | 对表 `补` 行（host 缺发射）**不补**，登记 + 转技术待办（补 ⇒ 新增协议语义，越 §1 边界①） |
| KD-9 | 不改慢用例门本身（阈值 / runner 形态）（改机制 ⇒ 须另走设计） |

**例外登记（带消解期）**：对表 `补` 行的消解路径 = 转 `docs/TODO.md` 技术组条目（触发 = 认账不排期）；到期条件 = 相关消息族下次被触碰时 / 下批收口前。

## 6. 验收标准（逐条回指需求条目 · 可机判）

| # | 验收标准 | 机判命令 / 读数 | 回指 |
|---|---|---|---|
| A1 | 12 例逐例单跑读数在案（ms，含复跑读数） | 报告表逐例一行（§3.1 测量协议） | `docs/vsc/requirements/PROJECT.md` §6 N-P2 |
| A2 | 单跑 >500 ms 者已 `slow(` 归册 | `grep -n "slow(" thincoder-vscode/test/edit-tool-improvement.test.mjs` | `docs/vsc/requirements/PROJECT.md` §6 N-P1 |
| A3 | 归册后 `npm test` 绿（单入口——无拦截线） | `cd thincoder-vscode && npm test` ⇒ exit 0 | `docs/vsc/requirements/PROJECT.md` §6 N-P1 |
| A4 | 对表逐行在位（五列无空） | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 | N-W7 |
| A5 | 复跑零未处置 | `cd thincoder-vscode && node --test test/protocol-coverage.test.mjs` ⇒ pass | `WEBVIEW.md` §3 N-W7 |
| A6 | 删项后零悬空引用 | `grep -rn -e "_advisorBlock" -e "_advisorScrollDirty" -e "advisorChunk" thincoder-vscode/src thincoder-vscode/webview thincoder-vscode/test thincoder-vscode/AGENTS.md`（大小写敏感——`appendAdvisorChunk`/`buildAdvisorBlock` 保留不误伤）⇒ 0 命中 | `WEBVIEW.md` §3 N-W7 |
| A7 | 拆后各档 ≤500 | `wc -l` 逐档读数（`setup.mjs` / `panel-messages.mjs` / 两新档） | `docs/vsc/requirements/PROJECT.md` §6 N-P3 |
| A8 | 缝保持（既有用例零回归） | `npm test` 全绿；`agent-tools-registry.test.mjs` 绿 | `docs/vsc/requirements/PROJECT.md` §6 N-P3 |
| A9 | 门禁全绿 + 文档锚零悬空 | `npm run lint` → `npm test`；`npm run doc:check` | 全部 |

> **A6 射程口径**：grep 面 = 产品树活代码面（`src` / `webview` / `test`）+ 端壳登记档 `AGENTS.md`；`thincoder-vscode/docs/**`（冻结参照历史）与批次档**命中不判悬空**（B 式迁移前旧档 + 批材料，原地一字不改）。

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

## 8. 边界（不做）

1. 不改 VSC 既有**行为语义**——除死码删除（D-2）与结构搬移（D-3）。
2. 不动 CLI 树 / 核树（除镜像面确证必需）；不动批 1–6 已收口内容。
3. 不新增协议语义；不给 host 缺失发射点补生产者（KD-8）。
4. 不做需求池「并发子代理 live 只显工具名」本条（另案）。
5. 不动慢用例门本身（阈值 / runner / 脚本形态）。
6. 不做协议表**全量重排**或历史节回改（§3.2 增量登记纪律：只增不改）。
7. 不做「补」行消解（转技术待办）；不补 F-W4 活卡面用例（`WEBVIEW.md` N-W5 既有消解路径，另批）。

## 9. UI/交互决策落档

| # | 决策 | 用户可见变化 | 状态 |
|---|---|---|---|
| U-1 | `advisorChunk` 专用回显块**不复活**（呈递走 digest / auto-turn 正规链） | 无新增可见面；`advisor` 专用块不再出现（本就无生产者 ⇒ 现网零变化） | 已定（§1 裁定） |
| U-2 | 活动区块形态 / 类名（含 `.advisor-content`）**保持不变** | 零变化（保留判据成立时） | 已定（§3.2 保留判据） |
| U-3 | 拆分为纯结构搬移 | 零变化（导出名与调用点不变） | 已定 |
| U-4 | 对表 `补` 行（host 缺发射）后续是否补建 | 零新增可见面（表内 `补` 行现零——结清 = 复跑对表机检） | 已定 |

## 10. 三方条目一致（硬规则）

| 条目 | 设计档验收回指 | 需求档条目 |
|---|---|---|
| D-1 | A1 / A2 / A3 | `docs/vsc/requirements/PROJECT.md` §6 N-P1 · N-P2 |
| D-2 | A4 / A5 / A6 | `WEBVIEW.md` §3 N-W7 |
| D-3 | A7 / A8 / A9 | `docs/vsc/requirements/PROJECT.md` §6 N-P3 |

同一来源 = §1「条目」1/2/3；无增项、无缺项。

## 12. 四档结构拆分（越档面处理）

> 判据源 = `docs/vsc/requirements/PROJECT.md` §6 **N-P3**（产品树限源 / 测试档，任一档 ≤800 行；越档 ⇒ 结构拆分并保持对外缝）。软线 = **500 行**（>500 主动审视，无拆分义务）。

### 12.1 越线登记（现行读数 · 口径 `wc -l`）

**触发判据（单源）**：软线 **500 行**（>500 主动审视）/ 硬限 **800 行**（>800 必须拆）（判据源 = `docs/vsc/requirements/PROJECT.md` §6 **N-P3**——产品树限源 / 测试档，任一档 ≤800 行；越档 ⇒ 结构拆分并保持对外缝）。
**逐档触线（单源）**：`agent.mjs` · `setup.mjs`——**行数超线（拆分）复核触发**；未列档触发 = 触碰时复核（拆分候选按 §12.2 各档）。

| 档 | 现行读数 | 越线状态 |
|---|---|---|
| `thincoder-vscode/src/extension/chat-panel.mjs` | **426** | 在 500 软线内——触发未到 |
| `thincoder-vscode/src/extension/panel-messages.mjs` | **357** | 同上（越线登记在册） |
| `thincoder-vscode/src/extension/panel-session.mjs` | **322** | 同上（越线登记在册） |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | **311** | 同上（首登）——**触发式（未预拆）**：候选线 = 循环外适配 ∕ 绑定族（`newTurnController` ∕ `bindPanelAgent` ∕ `bindCarrierFace`〔+ 载体表〕∕ `attachToolDrivenLegs`——`:35-143` ≈109 行）出档〔新档名实施批定〕；消解窗口 = 该档下次结构性触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计） |
| `thincoder-vscode/src/extension/settings.mjs` | **409** | 在 500 软线内——触发未到 |
| `thincoder-vscode/webview/ui.js` | **494** | 同上——触发 = 下次实质触碰 ∨ 余量 ≤5（未到） |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | **250** | ≤500 软线 ⇒ 不入本登记 |
| `thincoder-vscode/src/extension/panel-chat.mjs` | **260** | 同上 |
| `thincoder-vscode/src/agent/setup.mjs` | **298** | 触发线 **>497**——未触 |
| `thincoder-vscode/src/extension/suspension.mjs` | **290** | **越线登记关闭** |
| `thincoder-vscode/src/agent.mjs` | **9** | **越线登记关闭**（主循环归核） |
| `thincoder-vscode/webview/chat.js` | **147** | **越线登记关闭** |
| 其余现行读数（均 ≤500 软线 ⇒ 无拆分义务） | — | `thincoder-vscode/src/agent/run-helpers.mjs` **88** · `thincoder-vscode/src/agent/setup-reminders.mjs` **41** · `thincoder-vscode/src/agent/tool-table.mjs` **181** · `thincoder-vscode/src/agent/turn-domains.mjs` **37** · `thincoder-vscode/src/agent/agent-state.mjs` **158** · `thincoder-vscode/src/extension/skills.mjs` **5** · `thincoder-vscode/src/extension/peer-claims.mjs` **34** · `thincoder-vscode/src/extension/peer-domains.mjs` **32** · `thincoder-vscode/src/extension/peer-instances.mjs` **20** · `src/extension/image-handler.mjs` **51** · `src/extension/panel-settings-push.mjs` **119** · `src/extension/provider-probe-window.mjs` **122** · `src/extension/panel-messages-settings.mjs` **205** · `src/extension/panel-messages-turn.mjs` **215** · `src/extension/panel-subagent-relay.mjs` **270** · `src/extension/panel-session-write.mjs` **144** · `webview/chat-messages.js` **238**（≤500 软线 ⇒ 不入本登记——值随 `WEBVIEW.md` §3 文件表同拍） · `webview/settings-tools.js` **212**（拆档已落 = §13.3） |
| CLI 面（登记载体 = 本档 §12.1——KD-26） | — | `thincoder-cli/src/tui/suspension-drive.mjs` **210**（核驱动装配 + 壳） |
| CSS 类记录值（零拆分计划——引既有裁定「CSS 不入门」：N-P3 模块缝语义 + 评审先例「按既有裁定不升级、不重开」） | — | `thincoder-vscode/webview/chat.css` **514** · `webview/controls.css` **658** |

### 12.2 逐档方案（职责分面 · 六新档）

#### 12.2.1 `panel-chat.mjs`（目标 ≈240）—— 回合驱动面

| 迁出面 | 行段（实测） | 行数 | 去向 |
|---|---|---|---|
| 回合执行循环 + controller 工厂 | `newTurnController` 43-65 · `runTurnLoop` 385-498 | 137 | `panel-turn-loop.mjs`（**186**） |
| 回合阶段：provider / 模型解析 | `runPanelChatImpl` 内 178-235 | 58 | `panel-turn-stages.mjs`（**240**） |
| 回合阶段：收尾落盘与状态归位 | finally 体 311-350 | 40 | 同上 |
| 回合阶段：挂起会话接管 | 352-382 | 31 | 同上 |

新档职责（一句话）：`panel-turn-loop.mjs` ≈157 行 = **回合执行循环面**（runAgent 续跑 / ContinueError / Ctrl+I 中断续跑 + 回合 controller 工厂）；
`panel-turn-stages.mjs` ≈154 行 = **回合阶段函数面**（`panel-callbacks.mjs` 头注既立的「骨干—细节两层」细节层：provider/模型解析 · 收尾落盘 · 挂起接管）。

**保留（不得迁出 · 硬约束）**：`runPanelChatImpl` 入口守卫段 112-177 —— 单元测试档用例 B（单元测试树重建时回迁端侧单元测试档）直读本档源文本，断言
「`ensurePanelAgent(panel, turnSlot)` 之后在本档内出现 `ensureMemoryHandle()`」（句柄创建点同址）；该段迁出 ⇒ 既有结构机检红。
另保留：行加载 + 回调装配段 236-310 · `runPanelChat` 包装 · `agentSlotMatches` / `ensurePanelAgent`。

**搬运契约 · 段 A（provider / 模型解析段 178-235 → `panel-turn-stages.mjs`）**：

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
| B-2 | **回调注入项（防环）** | `runTurn` 闭包（`thincoder-vscode/src/extension/panel-turn-stages.mjs:204`）调 `runPanelChat`（定义于 `panel-chat.mjs:71`）⇒ 该函数**列为注入项**：调用侧传 `deps.runChat = runPanelChat`，helper 内 `await deps.runChat(panel, { … 实参逐字照搬 … })` ⇒ 新档**不 import 主档** |
| B-3 | 机判判据 | `grep -n 'from "./panel-chat.mjs"' thincoder-vscode/src/extension/panel-turn-stages.mjs` ⇒ **零命中**（命中即产生 §12.5 环清单外的 `panel-chat ⇄ panel-turn-stages` 环） |

**两段共性纪律**：逐字搬迁（注释一并随迁）· 闭包变量**参数化入 deps**（与 `runTurnLoop`（`:396`）/ finally 段（`:388`）同形）· 不新增分支 / 不改判据。

#### 12.2.2 `panel-messages.mjs`（目标 ≈245）—— 消息分发面

| 迁出面 | case 行段（实测） | 行数 | 去向 |
|---|---|---|---|
| 设置 / provider / guard / MCP 族（28 case：saveProviderKey … testProxy） | 327-416 · 451-485 | 125 | `panel-messages-settings.mjs`（**205**） |
| 回合交互族（10 case：abort / cancelSubagent / interrupt / openFile / openDiff / questionResponse / setAutoApprove / atComplete / permissionResponse / batchPermissionResponse） | 167-272 · 274-326 | 159 | `panel-messages-turn.mjs`（**215**） |

新档职责：`panel-messages-settings.mjs` ≈160 行 = **设置类消息 handler 面**（渠道 / 密钥 / MCP / Shell / 代理 / guard / 计划模式）；
`panel-messages-turn.mjs` ≈189 行 = **回合交互 handler 面**（中止 / 子代理取消 / 问答 / 权限 / approve-all / 编辑器动作）。

手法 = `panel-messages-session.mjs` 既定先例（case 体逐字搬出为 `handleXxx(panel, msg)` 导出；case 包裹大括号去除 · 中途 `break` → `return` · 尾 `break` 去除）。
**分发表骨架 + 全部 case 标签留主档**（转发行 `case "x": await handleX(panel, msg); break`）——保证 case 标签集合零变化（对表机检的提取集不动）。

⚠ **命名约束（硬）**：两新档名**必须以 `panel-messages` 前缀**（`panel-messages-settings` / `panel-messages-turn` 合规）。

留主档：`_cwd` / `setProjectFolder` / `clearProjectOverride` / `routeUserTurn` / `handlePanelMessage` 骨架 + `webviewReady` + `userMessage` / `selectModel` / `selectReasoning` / `retry` / 会话族转发。

#### 12.2.3 `panel-callbacks.mjs`（目标 ≈255）—— 回调装配面

| 迁出面 | 行段（实测） | 行数 | 去向 |
|---|---|---|---|
| relay 中继面（事件 token + 内容 chunk + `emitToolPanel`） | 23-124 | 102 | `panel-subagent-relay.mjs`（**270**） |
| 任务可见性投递队列（`WV_OUTBOX_MAX` / `postSubagentEvent` / `flushSubagentOutbox`） | 126-159 | 34 | 同上 |

新档职责：`panel-subagent-relay.mjs` ≈158 行 = **子代理 → webview 投递面**（核 relay 前缀 token/chunk 转换 + 暗窗口投递队列）。
留主档：`makeAskInPanel` / `statusTextPayload` / `postDigestCap` / `buildPanelCallbacks`（回调工厂——本档核心职责）。

⚠ **RELAYS 登记与 1-hop 解析面（硬）**：持 RELAYS 行的档须自带字面量构造点——`relayLiterals` **只在同档**扫 `fn(` 调用点取载荷 `type:` 字面量。

**1-hop 解析面成立的结构约定（逐项）**——`subagent` / `subagentApproval` 两判别式的 host 提取面在搬移后仍非空（`subagent` 另有直发位 `thincoder-vscode/src/extension/suspension.mjs:117`——不依赖本面；**`subagentApproval` 的 host 面本面独有 ⇒ 本 🔴 的实质风险面**）：

| # | 项 | 规则 |
|---|---|---|
| R-1 | 持 RELAYS 行的档 | **`panel-subagent-relay.mjs`**——补登**一行**，行格式与既有两行**逐字同形**（无 `thincoder-vscode/` 前缀、无注记）：`{ file: "src/extension/panel-subagent-relay.mjs", fn: "postSubagentEvent" }`。依据 = 查找系**精确等值**（`RELAYS.find((r) => r.file === rel)`；`rel` = `relOf` 产出的相对 VSC 根形式 `src/...`） |
| R-2 | 该档的裸标识符发射位 | 随迁的 `postSubagentEvent` 定义体 `postMessage(payload)`（`panel-subagent-relay.mjs:169`）+ `flushSubagentOutbox` 的 `postMessage(payload)`（`:205`）——**该档全部裸标识符位（唯二）**，均在 R-1 行覆盖下 |
| R-4 | 原调用点（留主档 · 改委托） | `panel-callbacks.mjs:163` / `:166` 两行改 `onSubagent: (info) => postSubagentStatus(panel, info)` · `onSubagentApproval: (info) => postSubagentApproval(panel, info)`——`buildPanelCallbacks` 其余装配面零改（本档核心职责，留主档） |
| R-6 | 机判 | `panel-turn-stages.mjs` 零 import 主档（§12.2.1 段 B B-3）· `WEBVIEW-PROTOCOL.md` §12 该行（**`subagentApproval`**）**处置列** = `活`（消费位 `thincoder-vscode/webview/chat-messages.js:224` 不动） |

**失败形态（两个方向都不静默）**：新档无字面量构造点 ⇒ `relayLiterals` 空 ⇒ `:180` 断言红；只漏 `subagentApproval` 一半 ⇒ 该判别式退出 host 提取集 ⇒ T-6 `wrongDisp` 红（表记 `活` ∕ 实得 `删`）。

#### 12.2.4 `panel-session.mjs`（目标 ≈259）—— 会话装配面

| 迁出面 | 行段（实测） | 行数 | 去向 |
|---|---|---|---|
| 槽写装配面 `saveLines`（字段往返契约） | 64-138 | 75 | `panel-session-write.mjs`（**144**） |
| 标题写面 `generateTitle` | 256-278 | 23 | 同上 |

新档职责：`panel-session-write.mjs` ≈122 行 = **会话写面**（双线落盘装配 + 标题生成）。
留主档：`ensureSlot` / `activeData` / `activeHistory` / `activeLines` / `loadModelPrefs` / `loadSession` / `loadOlder` / `sendHistoryPage` / `newSession` / `deleteSession` / `pushSessions` / `openSessionContent` / `status`（读面 + 会话操作面）。

### 12.3 对外缝清单（既有导出名 · 零改判据）

**判据（唯一）**：12.3 表内每个 `档 → 导出名` 的**外部消费点 import 语句逐字不变**（迁移段实行 re-export 转口；KD-12）。

| 档 | 导出名 | 外部消费点（实测） | 保持方式 |
|---|---|---|---|
| `panel-messages.mjs` | `_cwd` | `chat-panel.mjs:15` · `thincoder-vscode/src/extension/ledger-surface.mjs:19` · `panel-index.mjs:21` · `panel-messages-session.mjs:19` · `panel-project.mjs:11` · `panel-session.mjs:20` | 定义留主档 |
| | `setProjectFolder` | `chat-panel.mjs:15` · `panel-project.mjs:11` | 同上 |
| | `clearProjectOverride` | `chat-panel.mjs:15` | 同上 |
| | `routeUserTurn` | `chat-panel.mjs:15` | 同上 |
| | `handlePanelMessage` | `chat-panel.mjs:15` · 测试 12 档（`async-parity:37` · `async-visibility:26` · `chat-panel.test:26` · `chat-panel-messages:23` · `child-permission:22` · `config-io-panel:17` · `image-downgrade:14` · `session-boot:19` · `settings-empty-no-write:20` · `settings-open-snapshots:20` · `webview-permission-batch-release:19` · integration 3 档） | 同上（case 标签集合零变化） |
| `panel-chat.mjs` | `runPanelChat` | `chat-panel.mjs:17` | 定义留主档 |
| | `newTurnController` | 本档内 **4** 调用点：`panel-chat.mjs:224`（留主档 · impl 内）+ `:436` / `:445` / `:462`（随 `runTurnLoop` 迁出）） | 迁出 + re-export |
| `panel-callbacks.mjs` | `buildPanelCallbacks` | `panel-chat.mjs:36` | 定义留主档 |
| | `makeAskInPanel` | `panel-chat.mjs:36` | 同上 |
| | `postDigestCap` | `thincoder-vscode/src/extension/panel-turn-loop.mjs:32` | 同上 |
| | `relaySubagentEventToken` | `panel-messages-turn.mjs:24` | 迁出 + re-export |
| | `postSubagentEvent` | `thincoder-vscode/src/extension/suspension.mjs:38` | 迁出 + re-export |
| | `flushSubagentOutbox` | `panel-messages.mjs:35` | 迁出 + re-export |
| | `emitToolPanel` / `relaySubagentContentChunk` | 外部零消费（本档内 + 文档注释） | 迁出 + 主档 import（re-export 亦无害） |
| `panel-session.mjs` | `saveLines` | `chat-panel.mjs:25` | 迁出 + re-export |
| | `generateTitle` | `chat-panel.mjs:25` | 迁出 + re-export |
| | 其余 **13** 名（`ensureSlot` / `activeData` / `activeHistory` / `activeLines` / `loadModelPrefs` / `loadSession` / `loadOlder` / `sendHistoryPage` / `newSession` / `deleteSession` / `pushSessions` / `openSessionContent` / `status`） | `chat-panel.mjs:25` · `panel-chat.mjs:25` · `panel-messages.mjs:11` · `panel-project.mjs:9` | 定义留主档 |

### 12.4 零语义判据（命令级）

1. `cd thincoder-vscode && npm test`（= `node test/run.mjs`，单元 + 集成清单）⇒ **exit 0**，用例计数 ≥ 基线（本晚 661+；实现轮先记录基线读数，再逐步对齐）。
2. `cd thincoder-vscode && npm run lint`（`scripts/check-syntax.mjs`）⇒ exit 0。
3. **缝核**（逐条 grep，零改判据）：
   `grep -rn "panel-\(messages\|chat\|callbacks\|session\)\.mjs" thincoder-vscode/src thincoder-vscode/test --include=*.mjs`
   ⇒ 既有 import 行**逐字不变**（只允许新增行——新档间的 import；既有行的路径 + 符号名集合零改）。
4. **行数读数**（口径 = `wc -l` = 换行符数；Windows 无 `wc` 时用等价 node 式）：
   四主档：`cd thincoder-vscode/src/extension && wc -l panel-messages.mjs panel-chat.mjs panel-callbacks.mjs panel-session.mjs`

   六新档：`cd thincoder-vscode/src/extension && wc -l panel-messages-settings.mjs panel-messages-turn.mjs panel-turn-loop.mjs panel-turn-stages.mjs panel-subagent-relay.mjs panel-session-write.mjs`

   （Windows 无 `wc` 时用等价式自拟——口径 = 换行符计数；读数逐档入表。）
   ⇒ 十档逐档 ≤500（软线）。
5. `node scripts/doc-check.mjs --root .`（在 `thincoder/` 根）⇒ **判据 = 按档归属零新增**（改动档 = `docs/vsc/design/VSC-DEBT.md`：零新增悬空 ∕ 零新增超宽行）。

   > 口径提示：行宽判据**豁免表格行**（`scripts/doc-check-width.mjs:56-62` + 谓词 `isTableRow` `:40`）⇒ 本档宽表行不触发该门。

### 12.5 实施次序（依赖 · 由叶到根）

**依赖图（相关边；箭头 = import 方向）**
- 既有：`chat-panel → {panel-messages, panel-chat, panel-session}` · `panel-messages → {panel-session, panel-messages-session, panel-callbacks}` · `panel-session → panel-messages`（环 · B2 先例）· `panel-chat → {panel-messages, panel-session, panel-callbacks}`
- 新增（消息面）：`panel-messages → {panel-messages-settings, panel-messages-turn}`（两新档反向 import `_cwd`——与 `panel-messages-session.mjs` 同形环）
- 新增（回合面 / 投递面 / 会话面）：
  `panel-chat → {panel-turn-loop, panel-turn-stages}`（**无环**——`panel-turn-stages.mjs` 不 import 主档：
  接管段的 `runTurn` 闭包调 `runPanelChat`（`thincoder-vscode/src/extension/panel-turn-stages.mjs:204`）已列为**注入项**，否则即构成 `panel-chat ⇄ panel-turn-stages` 环；

  契约与机判见 §12.2.1 段 B B-2 / B-3）
  · `panel-callbacks → panel-subagent-relay`（**无环**）· `panel-session → panel-session-write`（环 1 处：新档 import `pushSessions`）

**环安全判据（承 B2 先例 · 逐档核）**：环上两模块顶层**只 import 绑定、零跨环读取**；全部解引用在函数体内（延迟解引用）⇒ 环安全（模块加载期不触达对端绑定）。

| 步 | 动作 | 门禁 |
|---|---|---|
| 1 | `panel-session.mjs` → `panel-session-write.mjs`（依赖最少） | `npm test` + `npm run lint` |
| 2 | `panel-callbacks.mjs` → `panel-subagent-relay.mjs` | 同上 |
| 3 | `panel-messages.mjs` → `panel-messages-settings.mjs` + `panel-messages-turn.mjs` | 同上 |
| 4 | `panel-chat.mjs` → `panel-turn-loop.mjs` + `panel-turn-stages.mjs`（最敏感：回合驱动 + 收尾 finally 体） | 集成测试（`npm test` + `npm run lint` + `doc-check`） |

**第 4 步附加纪律**：收尾 `finally` 体（311-350）整段迁出 = **最敏感搬移**——逐字搬迁（注释一并随迁）、捕获变量参数化（`turnSlot` / `history` / `fullHistory` / `slotStamp` / `isFirstMessage` / `susp` / `skipSession`），异常传播语义等价（async 函数内抛异常 ≡ 原 finally 内抛异常——均覆盖 try 内异常）；该步单独 diff 审查后再跑门禁。

### 12.7 关键决策记录（续 KD-9）

| # | 决策 | 理由 |
|---|---|---|
| KD-10 | 六新档**同批**拆出（非逐档零敲碎打） | 逐档单拆 ⇒ 同一回归集跑四遍（成本同量级、收敛慢）；四档同族（端壳面板层）一次做完 |
| KD-11 | 消息两新档名以 `panel-messages` 前缀 | 其他前缀 ⇒ case 标签逸出 `protocol-coverage-reverse` 扫描域（`HOST_DISPATCH = "panel-messages"`）⇒ 机检红 |
| KD-12 | 缝 = re-export（导出名零改） | 消费点 30+ 处（§12.3）⇒ 改动面 30 倍且无收益（承 KD-6） |
| KD-13 | `newTurnController` 随回合循环迁出（re-export 保缝） | 留主档 ⇒ 新档反向 import 主档（平白多一环）；且它与 `runTurnLoop` 的 controller 重建语义同族 |
| KD-14 | `panel-turn-stages.mjs` 合并「准备 + 收尾」两面（不拆两档） | 拆两档 ⇒ 各 ≈60-80 行碎片档；两面同属「impl 阶段细节层」（`panel-callbacks.mjs` 头注既立手法） |
| KD-15 | 收尾 `finally` 体**迁出**（非保留） | 保留 ⇒ 主档 ≈277；迁出后主档 ≈240 |
| KD-16 | **不动**范围外三越档（`chat-panel.mjs` / `suspension.mjs` / `settings.mjs`——读数与登记 = §12.1，D2 单源） | 越范围 ⇒ 属"改需求面"；登记 §12.1（触发条件同 N-P3） |
| KD-17 | 投递面两转口（`postSubagentStatus` / `postSubagentApproval`）随 relay 面入新档；原 `onSubagent` / `onSubagentApproval` 改委托 | `relayLiterals` 只扫**同档** ⇒ 字面量构造面必须同在持 RELAYS 行的档（副本 = 重复构造点，违 D2） |
| KD-18 | 段 B 的 `runPanelChat` 回调**注入**（`deps.runChat`），不登记环 | 注入零语义且免一条环登记（登记环 = 平白多一环） |
| KD-19 | 文档档（`.md`）行数**不承载**拆分 / 标注义务 | 依据 = 用户裁定 + `docs/core/design/DOC-DISCIPLINE.md` §3.7（文档行数规则废除——给本档补拆分规划即违该裁定） |

### 12.8 验收标准（续 A9 · 逐条回指需求条目 · 可机判）

| # | 验收标准 | 机判命令 / 读数 | 回指 |
|---|---|---|---|
| A10 | 十档（四主档 + 六新档）逐档 `wc -l` ≤500（软线） | §12.4 第 4 条读数命令（十档逐行输出） | `docs/vsc/requirements/PROJECT.md` §6 N-P3 |
| A11 | 对外缝零改（§12.3 表逐条） | §12.4 第 3 条 grep ⇒ 既有 import 行逐字不变 | N-P3（既有导出名 / 调用点零改） |
| A12 | 零语义：`npm test` 全绿、计数不降 | `cd thincoder-vscode && npm test` ⇒ exit 0 | §12.4 第 1 条 |
| A13 | 对外缝保持（1-hop 解析面成立） | §12.2.3 R-6 两条 | N-P3（保持对外缝） |
| A14 | `doc-check` **按档归属零新增** | `node scripts/doc-check.mjs --root .` ⇒ 改动档（`docs/vsc/design/VSC-DEBT.md`）零新增悬空 ∕ 零新增超宽行 | §12.4 第 5 条 |
| A15 | 行数读数逐档留档（四主档 + 六新档） | 实施轮读数表 | §12.4 第 4 条 |

### 12.9 用例表（正常 / 边界 / 错误 · 续 T-11）

| # | 类型 | 输入 | 期望输出 | 映射 |
|---|---|---|---|---|
| T-12 | 正常 | 拆分后集成测试（`npm test`） | 全绿（计数 ≥ 基线） | A12 |
| T-13 | 正常 | 逐个导出缝 grep（§12.3 逐条） | 既有 import 行逐字不变 | A11 |
| T-14 | 边界 | 主档行数贴 500 软线场景 | 十档（四主档 + 六新档）逐档 `wc -l` 读数入表 ⇒ 逐档 ≤500（软线）——**与 A10 同一条**（文档档不列行数读数） | A10 |
| T-15 | 边界 | 环 import（messages ↔ messages-settings ↔ session；session ↔ session-write） | 两模块顶层零跨环读取 ⇒ 加载即通过（测试绿） | A12 |
| T-16 | 错误 | re-export 漏项（如 `saveLines` 未转口） | 消费档 import 失败 ⇒ `npm test` 红并点名该档 | A11 |
| T-17 | 错误 | 新档含裸标识符 `postMessage(payload)` 而 RELAYS 未登记 | 该档注册行缺失 ⇒ 机检点名该档 | A13 |
| T-18 | 错误 | `panel-chat.mjs` 入口守卫段误迁（`ensurePanelAgent` / `ensureMemoryHandle` 异址） | 单元测试档用例 B 红（“句柄创建点在 ensurePanelAgent 同址”；单元测试树重建时回迁端侧单元测试档） | A12 / A13 |

### 12.10 边界（不做）

1. 不改**任何行为 / 协议 / 消息类型**——纯结构搬移 + 既有导出 re-export（零语义变更）。
2. 不动四档之外的越档面（`chat-panel.mjs` · `suspension.mjs` · `settings.mjs`——读数与登记 = §12.1，D2 单源）。
3. 不改需求档 `docs/vsc/requirements/PROJECT.md`（§5/§6 读数同步 = 父侧笔——本档给待同步读数）。
4. 不新增测试文件（新档注册行落 `test/` 既有登记面；`thincoder-vscode/test/files.mjs` 零改）。
5. 不改 `_archive/**`、不改已收口批档。
6. 不做"顺手优化"（不合并 / 不改名既有导出、不改注释语义、不清理既有死码）。

### 12.11 UI/交互决策落档（续 U-4）

| # | 决策 | 用户可见变化 | 状态 |
|---|---|---|---|
| U-5 | 四档拆分 = 纯结构搬移（既有导出名与调用点不变） | 零可见变化 | 已定 |

### 12.12 三方条目一致

| 条目 | 设计档验收回指 | 需求档条目 |
|---|---|---|
| ① N-P3 四档拆分（六新档 · 保对外缝） | A10 / A11 / A12 / A13 / A14 / A15 | `docs/vsc/requirements/PROJECT.md` §6 **N-P3** |

同一来源 = 条目①；无增项、无缺项。

**上抛项（写域外 · 待父侧裁）**

1. `docs/vsc/requirements/PROJECT.md` §5 / §6 读数同步（父侧笔）：§5 越档面指针节 + §6 N-P3 判定句不变；建议 §5 补实测读数行（§12.1 表）。
2. `thincoder-vscode/AGENTS.md:53` 模块地图行——六新档名是否同步（该档 = 产品文本面，不在写域）。

**文档档零行数义务**：本档（及 `WEBVIEW-PROTOCOL.md`）**无拆分义务**——`.md` 档不适用程序代码的尺寸档位线；判据单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.7。

## 13. 文件档位轮：设置面拆分与超限档拆分

> 行数口径 = `wc -l`（= `split("\n").length - 1`，同 §12 口径注）；本节 = 拆分设计。

### 13.1 执行集合与总则

- **执行（拆分落地）**：`chat-panel.mjs` · `thincoder-vscode/src/agent.mjs`（拆分设计见 §13.2 ∥ §13.4）。
- **零执行（登记）**：`settings.mjs` · `settings-tools.js`（计划重锚 = §13.3）· `ui.js` · 其余注册档（= §12.1）。
- **零行为变化判据（五条）**：① 对外缝零改（既有导出名 / 调用点零改）；② 纯结构搬移（逐字搬迁 · 注释随迁 · 零改名 / 零新分支 / 零顺手优化）；③ 用例零改（例外 = 点名锚档 §13.6）；④ 协议面零改（`postMessage` 形态 / 判别式集不变）；⑤ 全绿（`npm test` + 计数不降）。
- **UI / 交互决策**：零变更（纯结构搬移——用户可见面零动）；**open 项 = 0**。

### 13.2 `chat-panel.mjs`（目标 ≤430）——Settings 段外提 · `panel-settings-push.mjs`

**拆点**：

| 迁出面 | 行段 | 行数 | 去向 |
|---|---|---|---|
| 设置委派族 | `:334-373`（`_providerStatus` :336 · `_saveProviderKey` :337 · `_deleteProviderKey` :338 · `_saveMcpServer` :339 · `_deleteMcpServer` :340 · `_setAutoApprove` :342-350 · `_setPlanMode` :359-368 · `_engineeringOn` :371-373） | ≈40 | `src/extension/panel-settings-push.mjs`（**119**） |
| 设置推送链 | `:375-408`（`_pushStatus` :375-377 · `_pushSettingsLight` :385-396 · `_pushSettings` :398-408） | ≈34 | 同上 |
| 会话访问器 | `:413-418`（`_agentSettingsSession`） | ≈6 | 同上 |

**缝** = 类内薄委托：`ChatPanel` 保留同名方法（一行委托）；外档调用点逐字零改——`_pushSettingsLight` 11 处 · `_pushSettings` 7 处 · `_pushStatus` ≥4 处 · `_agentSettingsSession` 2 处（+ 档内自用 3 处）。`_pushSettings` 内对 `_pushMcpStatus` / `_pushIndexStatus` 经 panel 实例直呼（零注入 / 零环）。

**硬约束（留档 · 不得迁出）**：`_chat`（:433-480）· `resolveWebviewView`（:156-202）· 构造器两处 vscode 监听块（:84-144——含 `workspaceFolders` 的源档集合必须 = 现行四档）。

**锚检查更新（恰一处）**：`test/settings-open-snapshots.test.mjs` 链集常量换位（`chat-panel.mjs` → `panel-settings-push.mjs`）。
**验收**：≤430 ∧ 新档 ≤300 ∧ 消费面文件零 diff ∧ VSC `npm test` 绿。

### 13.3 `settings.mjs` / `settings-tools.js` 计划重锚（`settings-tools.js` 拆档已落 ∥ `settings.mjs` 零执行）

拆点区间按现读（本节 = 现行单源）：

| 档 | 现读数 | 拆点（现读区间 → 目标档 · 缝） | 触发（未到） |
|---|---|---|---|
| `thincoder-vscode/src/extension/settings.mjs` | **409** | 环境面七件 = `shellCandidates` :88-115 · `proxySettings` :224-227 · `websearchSettings` :230-233 · `saveWebsearchKeyFromPanel` :236-243 · `deleteWebsearchKeyFromPanel` :246-252 · `saveProxySettingsFromPanel` :276-287 · `testProxyConnection` :291-314（≈91 行）→ `settings-env.mjs`（缝 = re-export） | 净增 ≥40 ∨ 下次触碰（代理 / 检索面） |
| `thincoder-vscode/webview/settings-tools.js` | **212** | MCP 面 = `renderMcpList` ∥ `updateMcpTools` ∥ `updateMcpTestResult` ∥ `parseHeadersLike` ∥ `openMcpForm` ∥ `kvToInput` ∥ `bindToolsControls` MCP 段 ∥ `toolsCardHtml` 表单段（≈170 行）→ `settings-mcp.js`（缝 = `mcpFormHtml()` ∥ `bindMcpControls()`） | **拆档已执行**（判定口径 = KD-20） |

两档：`settings.mjs` 触发未到 —— 零执行；`settings-tools.js` —— **拆档已落**（判定口径 = KD-20）：本档 **212** ∥ 新档 `settings-mcp.js` **126**。

### 13.4 `thincoder-vscode/src/agent.mjs`（目标 ≤460）——响应后处理段外提

**拆点**：

| 段 | 行段 | 去向 |
|---|---|---|
| `traceStop` + 内置工具结果本地化 | :300-313 | 同上 |
| interrupt 提交 | :315-324 | 同上 |
| usage 记账 | :326-334 | 同上 |
| 流规则 abort 消费 | :336-340 | 同上 |
| 响应提醒注入 | :342-344 | 同上 |

**搬运契约（控制流保真）**：interrupt 提交段的 `throw`（helper 内抛 ⇒ 随栈传播——调用点必须在主 `try`（:182-478）内）；流规则 abort 的 `continue` ⇒ helper 回传判别式 `{action:"continue"}`、调用侧翻译（先例 = §12.2.1 段 A `{done:true}` 式）；字段写点（`agent._lastPromptTokens` / `_usageAtLen`）随迁。

**import 面与环**：该档 import 面 = `run-helpers.mjs`（`pushReal`）· `rules-face.mjs`（`applyRuleTriggered`）· `stop-trace.mjs`（`traceStop`）· `run-stages.mjs`（`injectResponseReminders`）；

其中 `run-stages.mjs`（`:42`）自 `agent.mjs` import `ContinueError` ⇒ 环 = `agent.mjs` ⇄ `run-stages.mjs` ⇄ `response-stages.mjs` 三节点（既有两节点环的扩展）。

环安全按 §12.5 判据——环上各档顶层只 import 绑定、零跨环读取（解引用全在函数体）；机判 = 该档顶层零解引用（顶层语句集 = import 声明 ∪ 函数声明——静态可扫）。

**残余留档**：`:346-409` 提交分支 ⇒ 该档下一轮候选；触发句「行数超线（拆分）复核触发」保持（§12.1 单源行）。
**锚**：`test/upstream-parity.test.mjs` / `test/integration/reasoning-echo-live.test.mjs` 两计数锚**零改**（本次搬移不触其计数面——`assistantToolCallMessage(` 单点住 :400 留档）。
**验收**：≤460 ∧ 新档 ≤300 ∧ 两锚零破 ∧ VSC `npm test` 绿。

### 13.6 验收（可机检）与锚检查

| # | 判据 | 机检 |
|---|---|---|
| V13-1 | 行数：13.2 / 13.4 各档逐档达标（≤430 / ≤460 ∧ 新档 ≤500） | §13.6 命令族（仓根跑） |
| V13-2 | 缝零改：消费面文件 `git diff --stat` = 空 + 调用点数守恒 | §12.4 第 3 条 grep |
| V13-4 | `cd thincoder-vscode && npm test` ⇒ exit 0 | §12.4 第 1 条 |
| V13-5 | 锚检查：允许更新恰一处（§13.2 链集常量）；其余锚零改 | `node scripts/doc-check.mjs --root .` |
| V13-6 | `thincoder-vscode/test/files.mjs` 新档登记在盘 | grep 点名 |

### 13.7 关键决策（摘要）

- KD-20 执行集合判定口径（越 500 ∨ 触发已到 ∨ 登记「下批执行」三类才执行）；KD-21 chat-panel 拆点扩为 Settings 段整段；KD-22 CSS 维持不入门；KD-23 测试文件「用例族 + 夹具自持」且用例号零改；KD-24 agent.mjs 拆分面与残余留档；KD-25 读数口径与「批内实测为最终值」；KD-26 CLI 登记落本档 §12.1、不新造册。

### 13.8 上抛（本节相关项）

1. `chat.css` / `controls.css` —— 维持「CSS 不入门」（零拆分）；推翻须新裁定。
2. `thincoder-vscode/AGENTS.md:56` 模块地图行并入两新档名（产品文本面——**批档 §2** 在册）。
3. `WEBVIEW-PROTOCOL.md` §12 ② 列 chat-panel 面坐标随拆漂移——不修、实施轮零触该档。

