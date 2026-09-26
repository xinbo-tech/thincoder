# 2026-09-26 · 桌面端实施批 8（agent 装配 · 值面供给）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-25 22:17「你直接自己跑完吧」（授权与自缚条件见批 3 档 §1.11）——父侧自推：批 7（活动池 + 审批呈现）收口 ⇒ 批 8 = agent 装配（值面供给落地）。
> 台账 = #353（桌面端程序 · 滚动在途 · 本批 = 第 8 段）。前情 = docs/batches/2026-09-26-desktop-impl-7.md §6（已收口 2026-09-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 22:17「**你直接自己跑完吧**」（授权射程与自缚条件 = 批 3 档 §1.11）——父侧自推：批 7（活动池 + 审批呈现）收口 ⇒ **批 8 = agent 装配（值面供给落地）**——把此前各批"契约 + 零节点"的诚实形**接上真数据**。

### 1.2 本批交付目标

1. **`src/main/agent-host.mjs`**（设计面 = `docs/desktop/design/SHELL.md` §4 · 装配三份 + **核回调桥**）：会话流驱动、回调桥、挂起表；预算 ~260 行（**预置拆分预案**：「装配 / 回调桥 / 挂起表」三段 · `PROJECT.md` §4.1 在册）。
2. **值面供给（写者落地）**：消息块流（`store` 流注 / 流段 / 尾块增量）· 回合状态 · 标题 · 位标（**`tabBadges` 写者** = `deriveTabBadge` 输入）· 会话头字段（**`sessionMeta` 写者**：provider / 模型 / 推理档位 / 工程模式 / AUTO）· **`activeSession` 写者**。
3. **审批事件面**：`ev:approval`（载荷 = `{ promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`）→ `pool.approvals` 写入 + 出站 `approval:respond` 后**待决项清除**（事件面）。
4. **回填面**：`onBackfill` 接线 + `guards`（`hasOlder` / `inFlight`）供给（批 5 / 批 6 的诚实形接通）。

### 1.3 判据（机器可核 · 待 §2 细化）

① 桥面（回调 → 切片）可脱壳直测（假核替身 / 纯函数面优先）；② **值面写入端到端**（假核事件 → 切片 / 树读数）；③ **审批链路**（事件 → 卡在 → 出站 → 清除）；④ **零回归**（69 例不红 · 新增全绿 · 三包增量零（基线相对形）· doc-check **本批新增 / 改动行零新增**（**批前**基线 = 悬空 7 / 行宽 18；批内新增须自清以回到该值））；⑤ 形态沿 `docs/desktop/design/RENDERER.md` §1.1 + 主进程侧先例（`ipc.mjs` / `projects.mjs` 模块面）。

### 1.4 边界（本批不含）

设置 / 首启向导（`settings.mjs` / `onboarding.mjs`）· 打包分发 · 主题切换面 · **核侧改进**（只消费核既有 API，不改 `thincoder-core/**`）。

### 1.5 已知事实 / 依赖 / 条件触发

- 批 7 已收口（**69/69** · 冒烟 `boot:"ok" ∧ served:18` · 白名单**十项** · `approval:respond` 处理体已落（未装配 ⇒ fail-loud））。
- **诚实形清单（本批应全部接通）**：`tabBadges` 零 writer（S1）· `sessionMeta` / `activeSession` 悬空键（P-3）· 值面零节点（三态 none/empty/flow 的 `flow` 与块面）· `onBackfill` / `guards` 零给 · 审批正例读数。
- **核入口须 §2 前实读确认**：`@thincoder/core` 的 agent 装配 API / 回调形状 / 权限请求入口（`callbacks.onPermissionRequest` ∥ `onBatchPermissionRequest`——`IPC.md` §1 行已引）。
- 设计锚：`docs/desktop/design/SHELL.md` §4（装配三份 · 回调桥 · 挂起表）· `docs/desktop/design/IPC.md`（事件族 + 通道面）· `docs/desktop/design/PROJECT.md` §4.1（`agent-host.mjs` ~260 + 拆分预案）· 需求档 §3.5（状态位面）。
- 台账 **#396 / #401 / #406 / #407 / #408** 不阻塞；**#403**（冒烟环境坑）沿用。

### 1.6 设计轮裁定 + 上抛处置（父侧 · 2026-09-26 06:09）

- **设计轮自纠记功**：`agent-host.mjs` 的「（拟新增）」标记一度误去 ⇒ **已复原**（该档盘上未落，标记必须保留）+ 记录面两行补正 ✓。
- **上抛处置（四条全收 · 登记在册）**：
  1. **端差两条**（MCP 连接随设置批 · `attachManifest`＝工程模式 M1 钩子不附着）⇒ 收（`SHELL.md` §4 端差注 + §2 补遗 ✓）；**MCP 项 = 设置批面**（在册）。
  2. **`sessionMeta` 五值字段名未验证**（`effort` / `autoApprove` 是否槽字段）⇒ 收 —— **并入实施派单的「首步实读订正」义务**（防第二口径）。
  3. **预算数为预估**（三新档 ~260 / ~160 / ~90 · `host-floor.test.mjs` 行数）⇒ 收（实施轮按盘上实态回填 · 既有惯例）。
  4. **审批卡 `changes` 缺省** ⇒ 收（在册）。
- **评审**：设计评审**已发**（#78）——通过后逐条裁定 → 修复轮（如需）→ **§4 代签** → 实施。

### 1.7 首轮评审裁定 + 修复轮（父侧 · 2026-09-26 06:15）

- **#78 = changes-required**（🔴 5 / 🟡 5 / 🔵 5 · **无 token**）——**十五条全收** ⇒ 修复轮 **#79**（§2.12 形态 · 逐号 1–15 · 修后为准）。
- **五条 🔴 口径**：
  1. **审批载荷 `shape` 值域**（§2.2(d) `"item"` ↔ 锚 `"single"`）：消费面实读（`renderer/views/approval.mjs:25-36` / `:41-43`）⇒ 表外归 `null` = **卡面 / 池面零出口按钮** ⇒ **归一到锚值**。
  2. **`batch.tools` 形态**（对象数组 ↔ 锚 = 工具名数组）：消费面非串滤除（`approval.mjs:80-83`）⇒ **批形清单消失** ⇒ 归一到锚形。
  3. **回合边界信号**：`⟦ev⟧turn` 仅 `depth > 0`（核 `agent.mjs:224-226`）；核 `onAgentTurn`（每轮无条件 · `:229`；VSC 顶层逐轮帧即用）**未入回调面** ⇒ 回合态 / 标题写者无输入 ⇒ **纳入回调面并定义起 / 尾发射点**。
  4. **`ev:error` 无生产者**：§2.2(d) 的 run 无 catch 面（只 `finally`）⇒ 补映射行 + 用例；「九回调」计数按实读面收正。
  5. **白名单作用域句**（`IPC.md:51`「本节表列全部（13 项）」vs §2 表实列 **26** 请求通道）⇒ 改「**已实给** 13 项」或直接枚举。
- **🟡 / 🔵 承 §3 表逐条收正**（U13 随动 · 池 slice / 两读数写者 · `ev:question` / `ev:task` 写者 · 签名归一 · 失效表述三处 · `ok` 判据串 · 游标零消息页 · 预算两值取一 · U91 锚点 · 两处标注随动）。
- **排程**：修复轮落 → 父侧核验（含五条 🔴 **两侧对照**）→ 评审**轮次 2** → **§4 代签** → 实施。

### 1.8 修复轮后裁定：批内自增 doc-check 项须自清（父侧 · 2026-09-26 06:32）

- **情形**：#79 实跑暴露读数为 **悬空 10 / 行宽 24**（**批前** = 7 / 18）——增量 **+3 悬空 +6 超宽**；9 项皆在 `docs/desktop/design/` 四档、皆为本批设计轮（#77）新写 / 改写的行（含变更记录行）⇒ **属本批新增**。
- **裁定 = 本批自清**：判据⑤「本批新增 / 改动行零新增」是本批验收面；#79 的「零新增」读法 = 相对其自身起点，**非相对批前基线** ⇒ 以**批前基线**为准。
- **派 #80**（修复轮续）：**拆 6 超宽行** + **修 3 悬空锚**（查明后补「（拟新增」标记 / 收正坐标）；目标 = 复跑回 **悬空 7 / 行宽 18**（全仓）。
- **§1.3 基线句澄清（父侧机械直改 · 标记）**：基线 = **批前**值；批内新增须自清以回到该值。
- **#79 finding 2**（§1.7 记「§2.12 形态」↔ 实编号 **§2.11**）= 记录在案，不回改。

### 1.9 清项轮落地 + 登记裁定（父侧 · 2026-09-26 06:43）

- **#80 九项全清**：读数 **10 / 24 → 7 / 18**（= **批前基线** ✓）；处置 = 6 超宽拆行（**字符守恒自证**：+2 / +2 / +2 / +7 / +38 / +2，全为断行符与标记 ⇒ 零字符增删）+ 3 悬空补「（拟新增）」✓；本批四档**零残留** ✓（余 22 项皆他板 / 他批面 ✓）。
- **登记裁定（四条全收）**：
  1. `RENDERER.md:29` **不补标记** = **收**（该行 `.mjs` token 落引擎豁免面（码段行跳过 · `doc-check-anchors.mjs:142`）⇒ 实态不产红；非形态缺陷）。
  2. **嵌式「（拟新增）」**（`RENDERER.md:72`）= **收**（与既有「路径后全角括号」同族 · 引擎已识别 ✓；若后续有统一形提案，随该档触碰）。
  3. **4 档变更记录 +1 行** = **收**（同轮同档改动随记 = 本仓惯例 ✓，非超程；可单行回退）。
  4. §2.12 末句「清账随各自批次」↔ §1.8 之张力 = **以 §1.8 为准**（已显式化 · 未静默择一 ✓）。
- **评审**：**轮次 2 已发**（#81）——核十五条修复 + 九项清账 + 无新引入 → 通过才发 token。

### 1.10 评审轮次 2 裁定 + 修复轮 3（父侧 · 2026-09-26 06:50）

- **#81（评审轮次 2）= pass**（token 已发 · 前轮 **15/15 核销** · 新引入 🔴 0 / 🟡 3 / 🔵 1）——**四条新项全收 ⇒ 修复轮 #82**（§2.16 形态 · 逐号 1–4 · 修后为准）。
- **四条口径**：
  1. **🟡 `IPC.md` 单源面落形**（`:23`「本表第三列 = 逐条映射（单源）」vs `:14` 产出方缺 `onAgentTurn` 行 · `:28` `ev:activity` 两形 · `:33` `ev:error` 载荷）⇒ **就地落 `IPC.md` §1**（映射行 + 载荷形；或注明与批档 §2.11 的从属关系）。
  2. **🟡 `done` / `stopped` 双生产者判别**（宿主结算 vs 内联 `⟦ev⟧done`——核 `agent-tools/async-settle.mjs:275` / `:239`）⇒ **判别式写死**（如「无 `fields` 的 `done`/`stopped` = 宿主结算面」）+ **U88 补一反例臂**（内联 `done` ⇒ 零回合尾）。
  3. **🟡 `pool.blocks` 条目键集**（消费面 `views/activity.mjs:113-114` 读 `{ tool, status }` vs §2.2(e) 块形 `{kind,id,name,…}`）⇒ 补**键映射行**（`tool` ← 工具名）+ 入 / 清点口径。
  4. **🔵 §2.2(f) 残留字面**（`:186` `historyWindow(history, before, 200)` vs `:187`「`pageSize` 不传」）⇒ ⑫ 层补一句收正或明标取代。
- **排程**：#82 落 → 父侧核验 → **§4 代签** → 实施。
- **记功**：轮次 2 的三条新 🟡 皆**真实语义判别 / 键集缺口**（非文风），且各给反例臂建议 ⇒ 收。

### 1.11 实施中裁定：设计档「（拟新增）」去标归口（父侧 · 2026-09-26 06:59）

- **情形**：实施舱（#83）报请裁——批档 §2 补正 + §2.11 ⑩ 的「去标 = 实施批落地后按盘上实态」是否把 `SHELL.md` §1 树 / `PROJECT.md` §4.1 三处去标**委派给实施舱**？
- **裁定 = 不去标（实施舱只披露）**：设计档的笔 = **eng-designer**（D1）；**先例** = 批 5 修正轮 **#62**（三处删标）· 批 6 修正轮 **#69**（四行去标）——两次皆**实施后修正轮（设计面）**执行 ✓。§2.11 ⑩ 的「实施批落地后」读作**时点**（本批落地之后），**非笔权转移**；若与 D1 相抵 ⇒ **以 D1 为准**（授权判据 ≠ 越闸）。
- **归口**：三处去标 = **实施后修正轮（#84）** 的条目（随 #83 落地后派）；实施舱在**交付报告 + §5 列明三处坐标**即可。
- **记功**：实施舱在「身份面 ↔ 批档措辞」相抵时**停下报请**（未静默择一、未硬做）✓ —— 正是要的纪律。

### 1.12 实施舱跑飞 · 止损与拆舱重派（父侧 · 2026-09-26 10:00）

- **事实**：实施舱 **#83**（batch 8 · initial）**跑飞**——耗时 **3h04m** · 轮次 **3172 / 3240** · **磁盘零改动**（`agent-host.mjs` / `events.mjs` / `mount-pool.mjs` 均不在盘 · 既有档 mtime 未变）；观测 = 近轮次全为 `read, read, read`（**无产出探索循环**）。
- **止损**：**已 cancel** —— 零改动 ⇒ **无部分改动需回收** ✓。**父侧失察**：3 小时未做状态巡检（教训 = 长舱每 ~15 分钟 `status` 一次）。
- **重派 = 拆两舱（同批同设计 · 文件域不重叠 ⇒ 可并行）**：
  - **8a 主进程侧**：`src/main/agent-host.mjs`（新）· `main.mjs` · `ipc.mjs` · `session-slots.mjs` · `src/preload/preload.cjs` · 用例 `agent-host` / `history-page`（新）+ `host-floor` / `session-contract` / `projects` 随动 · **`test/files.mjs` 十四 → 十七档（归本舱）**。
  - **8b 渲染侧**：`renderer/events.mjs`（新）· `app.mjs`（按预案拆 `mount-pool.mjs`）· `views/chat-scroll.mjs` · 用例 `events-reduce`（新）+ `store` / `views-chrome` 随动。
- **两舱派单加「首轮纪律」**：① **先落骨架再补全**（开工若干轮内必须落盘首批文件）；② **禁止无产出探索**（同批文件反复读 ≥3 次 ⇒ 停手，改 grep 定位 + 直接写）；③ **只读点名节，不整读整档**。
- **配置观察（上报用户）**：子代理 `maxTurns` 过高使「跑飞」可持续 3 小时才自然耗尽 —— 本席**不擅改全局配置**（同键约束主会话）；缓解 = **巡检 + 窄派单**；是否调整请用户裁。

### 1.13 实施中裁定：`onQuestion` 返回口径（父侧 · 2026-09-26 10:24）

- **#84 上抛**：设计面零行钉死 `onQuestion` 返回口径（U82 要求九映射在场 ∧ `ev:question` 只出站、无作答通道）⇒ 两候选：(a) `return null`（现状 · 模型收到无解释空结果）；(b) 不给回调（核 `tools/question.mjs:20` 抛 ⇒ 与 U82 九映射相抵）。
- **裁定 = 折中读法 (c)**：桥**在场**（九映射 ✓）+ 返回**核内范例风格显式信号串**。**依据（父侧实读）**：`thincoder-core/tools/question.mjs:24` = `return ctx.onQuestion(args.question, args.options ?? [])`（**回调返回值原样成工具结果** ⇒ `null` = 静默错误 ✗）；`:22-23` = `(error: …)` 风格纯串（**核内既有范例** ✓）。
- **落法（钉死）**：返回串 = `&quot;(error: question tool not supported in this context (no answer channel in this build) — ask the user in your normal reply text)&quot;` + 补一臂（返回值为该串 ∧ 九映射仍成立）。
- **归口**：设计面收正（`onQuestion` 返回口径 + `ev:question` / `ev:task` 载荷键名未定形）= **实施后修正轮**；**台账 #410** = 桌面端 question 作答通道（后续批 · 用户可见缺口）。
- **另**：8b 越层两档（`renderer/events.mjs` **340** · `test/events-reduce.test.mjs` **305**）= 已纠偏（自拆回 &lt;300；新档名由父侧转达 8a 登记 `test/files.mjs`）✓。

### 1.14 实施中裁定：会话槽装载 / 落盘（父侧 · 2026-09-26 10:31）

- **#84 上抛（其内审 🔴）**：`docs/desktop/design/SHELL.md:76`（装配取槽：provider / 模型 / 档位 / 工程模式）↔ 批档 §2.2(b) 装配枚举只取 config + §2.8 端差只列两项 ⇒ **设计面两处相抵**；实测桌面树 `applySession` / `saveSession` **双零命中** ⇒ ① 槽值不生效（**会话头显示值 ≠ 实跑值**）② 恢复会话**恒空历史** + 回合产物不落盘。
- **裁定 = A（最小形）**：
  1. **装载** = 装配取槽（`resumeSlot` + `applySession`；provider / 模型 / 档位 / 工程模式 / **history 全取槽**；槽缺 ⇒ 新建形）；
  2. **落盘** = 回合尾 `saveSession`（核侧落盘 = **调用侧职责** · CLI 先例 `thincoder-cli/src/tui/agent-turn.mjs:328` / `tool-events.mjs:443` / `tui-lifecycle.mjs:83`）——**两件一对，缺一即洞**；
  3. **尺寸**：`agent-host.mjs` 现 **295** ⇒ 触 300 ⇒ **按在册拆分预案**执行（槽 I/O + 回合落盘出档，命名由实施舱定 + 披露），拆后各档 &lt;300；
  4. 补两臂用例（装载 = 槽真值 · 回合尾落盘 = 槽含新消息）——**越清单，披露**。
- **不取 B 的理由**：B（登记端差）会 ship「恢复会话 = 空历史 + 默认 provider」= 对批 5 `session:resume` 面的**可见破坏** ⇒ 非端差，是功能洞 ✗。
- **设计档随动**（`SHELL.md:76` 口径 · §2.2(b) · §2.3 文件表 · §2.8 端差清单）= **实施后修正轮（designer）** ✓（实施舱只披露）。
- **归属澄清**：`test/files.mjs` = **8a 域**（「勿动」是给 8b 的 ⇒ 8b 已照办 ✓）⇒ 十八档登记 + U52 清单两向断言随动 = **8a 落**（已回令）。
- **同刻收下**：`sessionMeta` 两布尔槽 ON/OFF 词形（沿核 `cmd-eng.mjs:72` / `cmd-auto.mjs:9`）✓ · onQuestion 折中读法 + 臂 ✓。

### 1.15 渲染舱（8b）交付核验（父侧 · 2026-09-26 10:39）

- **#85 交付**：8 ✅ / 4 ❌（四项**皆跨域**：`test/files.mjs` 登记 + U95 渲染侧行数臂 = **8a 域**（已转达 ✓）；设计档两新档登记（`RENDERER.md:29` / §4.1 / `SHELL.md` / 批档 §2 档列）= **designer 域**；两条 advisor 🔵（`pool.blocks` 无清点 / 窗限口径 · `subKey` 无渲染侧消费者）= **设计未定口径**需裁定）⇒ 越域项**全数只报不改** ✓（纪律正确）。
- **父侧亲跑**：`node --test test/events-reduce.test.mjs test/events-page.test.mjs` ⇒ **tests 6 / pass 6 / fail 0** ✓；行数实读：`renderer/events.mjs` **295** · `renderer/events-subscribe.mjs` **61** · `test/events-reduce.test.mjs` **162** · `test/events-page.test.mjs` **172** · `renderer/app.mjs` **297** ⇒ **拆档达标（全 &lt;300）** ✓。
- **交付质量记功**：**变异抽检自证判据**（判据回退为按值 ⇒ U89 **真红**；抹 `stopped` ⇒ U88 / U89 各自红）✓ —— 证明新判别臂**真咬**（非摆设）；清单外改动 = 0 ✓；一处前轮描述自纠（`RENDERER.md:29` 已无「（拟新增）」字样）✓。
- **全量红 = 登记缺口**（`test/files.mjs` 缺 `test/events-page.test.mjs` ⇒ `test/run.mjs:33-34` 清单反查拦停 · 3 条迁移用例暂未执行）⇒ **8a 落**（已回令 ✓）。
- **现场观察（机制实证）**：**#84 于本刻自然撞帽**（`maxTurns` **180 → 360** · turn 195）——**静默自动续期在真实运行中发生**（= 本批 #409 要修的那条路径）；旧机制下唯一可见痕 = `status` 面 `maxTurns` 跳变。父侧按巡检继续盯（**有产出 ⇒ 不干预**）✓。

### 1.16 两舱交付核验 + 修正轮派发（父侧 · 2026-09-26 10:58）

- **#84 交付**（8a 主进程侧）：§1.14 ①–⑤ + §1.15 ①② **全落**；**父侧亲跑**：`npm test` ⇒ **tests 91 · pass 91 · fail 0**（8b 遗留清单红已闭 ✓）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:21` ✓。
- **父侧实读**：`src/main/session-io.mjs`（38 行）逐行 ✓ —— **重钉 `_slot`** 的论证成立（`applySession` 按切换语义清 `_slot`（核 `session-lifecycle.mjs:132`），而 `saveSession` 取槽走 `_slot ??= activeSlot(cwd)`（**共享**活动指针）⇒ 不重钉则多标签 / 跨端切槽后**本键回合落错槽** ✗）；`loadSlotFile` 代 `resumeSlot` 的**实现层替换**（后者含认领写 / end-marker / GC 调度 ⇒ 对已知槽号为错）✓；落盘不抛沿 CLI 先例 ✓。`agent-host.mjs:126/129`（`assembleAndLoad`——假 `assemble` 注入同走装载 ✓）· `:172` / `:176`（**落盘先于终局事件** · 三路同序 ✓）✓。
- **#85 交付**（8b 渲染侧）：早前独立核验（6/6 · 拆档达标 ✓）。
- **越清单 14 项（两舱合计）= 全披露且各有依据** ✓（`files.mjs` 登记 +2 · U95 扩 · 三拆档 · `slot-sandbox.mjs` · 三包既有用例随动）。
- **修正轮 #91 已派**（designer · 实施后修正轮 · 依 #404 纪律：**修正轮落地核验后才 close**）：六新档登记 / 档数三处（**19**）/ **去标 13 处**（沿 §1.11 裁定——设计档之笔在 designer）/ `SHELL.md` §1 树补六行 + 三拆档树行 / U96–U97 凭据行 / §2.2(d) `shape` 值域与 `IPC.md:18` 对齐注 / **§1.13 + §1.14 两条父侧裁定的设计面落形** / 两舱 advisor 议题逐条裁定（`pool.blocks` 清点口径 · `subKey` 消费面 · 三条在册非阻塞）。
- **父侧自面随动**：本档 §1.12 六档清单与档数（我的笔）⇒ 随 #91 一并收正（§1.17）。
- **风险备忘**：跨会话（pid 17904 在途面）· **桌面交付仍未入 git**（待用户「提交」）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（批 8 · #91 实施后修正轮落盘——五设计档定点 + §2.17 收正段）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2 批次任务与设计（eng-designer）

**§2.0 前置：核入口实读确认（§1.5 要求，「核入口须 §2 前实读」）**

装配面（核出口，逐条实读）：

- `createAgent({...})` — `thincoder-core/agent.mjs:62`
- `runAgent(agent, input, callbacks = {}, opts)` — `agent.mjs:101`；opts 面含 `signal` / `autoTurn` / `extraTools` / `suspDriven` 等（中断 = `signal.abort()`，先例 `thincoder-cli/src/tui/agent-turn.mjs:159`）
- `assembleBuiltinTools({ memory, cwd, projectDir, author, team, model })` — `thincoder-core/tools/index.mjs:57`；`model` **必传**（漏传 ⇒ `read_image` 对所有模型静默消失，判据 = `specForModel(model)?.multimodal`，见 `thincoder-cli/src/cli/make-agent.mjs:8-9`）
- 家族段（subagent/skill/goal/verify 等）**由核内装配**：`agent/setup.mjs:163-170` 两段式 `[...agent.tools, ...familyTools, ...(extraTools)]` ⇒ **壳只供静态表 + 每回合注入面（`extraTools`）**；家族矩阵单源 = `agent/family-tools.mjs`
- `loadConfig` / `configDir` — `thincoder-core/config.mjs`；`createMemory` / `syncDir` — `thincoder-core/memory.mjs`；`discoverRules` — `thincoder-core/rules.mjs`；`injectProxy` — `thincoder-core/proxy.mjs`（动态 import，先例 `make-agent.mjs:30`）

回调面（九签名，逐条实读；坐标 = 核）：

- `onToolCall(name, args, id)` — `agent/dispatch.mjs:264`（只读/免问路径）· `:321`（问后路径）
- `onPermissionRequest(name, args)` → 布尔 — `dispatch.mjs:303`（逐项门；`depth>0` 时先出 `⟦ev⟧approval\x1e{turn}\x1e{max}\x1eapproval\x1e{tool≤40}`，`:301`）
- `onBatchPermissionRequest({ tools: [{name, args}], count })` → `"approveAll" | "deny" | 其它`（其它 = 回落逐项）— `dispatch.mjs:281-289`
- `onToolOutput(name, chunk, id)`（经 `toolCtx.onOutput`）— `dispatch.mjs:399`
- `onToolResult(name, result, id, subagentKey?)` — `dispatch.mjs:445`
- `onToken(text)` — 主循环增量文本（`⟦ev⟧` 内联事件同走此道）
- `onQuestion` — `dispatch.mjs:400`（`toolCtx.onQuestion`）
- `onTaskUpdate` — `setup.mjs:173`（`agent._onTaskUpdate` 同写）
- `agent.autoApprove` = 免问短路字段（`dispatch.mjs:258` 判据）⇒ 「always」作用域的落点

会话/页单源：`loadSlotFile(cwd, slot)` — `thincoder-core/session.mjs:187`（含 version/cwd 校验与 `.tmp` 回退）· `historyWindow(history, before, pageSize)` — `thincoder-core/history-window.mjs`（尾页判据 `before = null`，`pageSize` 缺省 200 条）。

先例（**形参照，不共享代码**）：CLI `assembleAgent` — `thincoder-cli/src/cli/make-agent.mjs:24-138` · 注入缝 `createAcpSession({ run = runAgent })` — `thincoder-cli/src/acp/session.mjs:20` · VSC 端 `buildTopLevelAgent`（SHELL.md §4 项 1 表列）。

**§2.1 批次任务条目表**（条目 ↔ 用例 ↔ 验收 三链同源）

| # | 条目 | 出处（§1） | 用例 |
|---|---|---|---|
| 1 | 单向推面：`ev:*` 九通道 —— preload 订阅面（`on(name, cb)` + 退订）+ 主侧 `send` 出站 | §1.2① 前置（`preload.cjs:31` 现仅 `{invoke}`）；IPC.md §1 九行既有 | U76–U78 |
| 2 | `src/main/agent-host.mjs` 装配段：核装配三份（本端自持） | §1.2① | U79–U81 |
| 3 | 回调桥段：九回调 → `ev:*` 出站；`⟦ev⟧` 分流（含 relay 前缀剥离） | §1.2① | U82–U83 |
| 4 | 挂起表段 + 回合驱动（`msg:send` / `msg:interrupt` 主侧本体） | §1.2① | U84–U86 |
| 5 | 值面写者：块流 / 回合态 / 标题 / `tabBadges` / `sessionMeta` / `activeSession` | §1.2② | U87–U90 |
| 6 | 审批事件面：`ev:approval` → `pool.approvals` → 出站 respond → 两侧清除 | §1.2③ | U91–U92 |
| 7 | 回填面：`history:page` 薄处理体 + `onBackfill` 接线 + `guards{hasOlder,inFlight}` | §1.2④ | U93–U95 |

**§2.2 逐面契约**

**(a) 通道面**

- 推面（主 → 渲染，单向）：九通道 `ev:token` · `ev:activity` · `ev:tool-call` · `ev:tool-output` · `ev:tool-result` · `ev:approval` · `ev:question` · `ev:task` · `ev:error`。preload 增 `on(name, cb)`：白名单校验（表外 ⇒ **throw**，不静默）· 单参 payload · 返回退订函数（`removeListener`）。主侧出站 = 注入的 `emit(channel, payload)`（装配点 `main.mjs` 内实现为 `win.webContents.send`）⇒ **`agent-host.mjs` 零 `electron` 导入**。
- 白名单 10 → **13**：+ `msg:send` · `msg:interrupt` · `history:page`。三行载荷/回执定形落 `IPC.md` §1/§2（§2.3 落点表）。

**(b) 装配面（`agent-host.mjs` 装配段）**

导出：`createAgentHost({ emit, run = runAgent, assemble = assembleFor, deps = {…核缺省}, projects })` → `{ ensure(key, slot), send(text), interrupt(), respond({promptId, verdict}), dispose(key), table }`。

`assembleFor({ cwd, slot })` 序（照 `make-agent.mjs:24-137` 逐项，端差写明）：

1. `deps.loadConfig()` → provider / providersList；`injectProxy(providers, config)` + `provider.proxyUri` 同步（`make-agent.mjs:30-33`）
2. `deps.createMemory({ dbPath })`；`config.embedding?.apiKey` 在场 ⇒ 挂 embedder（动态 import）
3. **cwd = 项目根**（`projects.mjs` 单一持有点）——端差①（CLI 用 `process.cwd()`）
4. `discoverRules(cwd)` 合并 `config.agent.streamRules`（文件规则优先）；`memory.codeOrigin = cwd`；project 层 `syncDir`；team 层有则 `ensureClone` + `syncDir`
5. `assembleBuiltinTools({ memory, cwd, projectDir, author, team, model })`（`model` 必传）
6. `createAgent({ provider, tools, config, cwd, memory })`；`agent.providers = providers`；`agent.activeProvider` / `agent.activeModel`
7. `validateProvider` 语义端差②：记 `agent._providerInvalid(_Reason)`（CLI `make-agent.mjs:185-198` 同字段），**消费方式 = 本端 fail-loud**（见 (d)）——不弹重选（设置批未到）
8. **不做的两项（显式端差）**：MCP 连接（决策 D8-3）· `attachManifest` 工程模式 M1 钩子（决策 D8-2）

装配实例：`agents: Map<key, agent>`（键 = 会话键；懒装配于首次开页 / 首回合）；同键复用（开关页不重装配）；`dispose(key)` 随 `session:close` 清除（防泄漏）。

**(c) 桥面（回调 → 出站映射表）**

| 核回调（坐标） | 出站 | 载荷 |
|---|---|---|
| `onToken(text)` | `ev:token` | `{ key, text }` — **先过 `⟦ev⟧` 分流**，协议行不入文本面 |
| `⟦ev⟧…` 内联事件 | `ev:activity` | `{ key, event, fields }` |
| `onToolCall(name, args, id)` | `ev:tool-call` | `{ key, id, name, argsSummary }` |
| `onToolOutput(name, chunk, id)` | `ev:tool-output` | `{ key, id, chunk }` |
| `onToolResult(name, result, id, subKey)` | `ev:tool-result` | `{ key, id, ok, result, subKey? }` |
| `onPermissionRequest` / `onBatchPermissionRequest` | `ev:approval` | 见 (d) 两形 |
| `onQuestion` | `ev:question` | 直通（`{ key, ...}`） |
| `onTaskUpdate` | `ev:task` | 直通（`{ key, ...}`） |
| 回合事件（`⟦ev⟧turn` / `settled` / `done` / `stopped` / `error`） | `ev:activity` + 值面（(e)） | `{ key, event, n?, max? }` |

`⟦ev⟧` 分流单源（本档定形）：正则 `/^⟦ev⟧([^\x1e]+)(?:\x1e(.*))?$/s` → `{ event, fields }`；**relay 前缀**（`${relayPrefix}⟦ev⟧…`，relayPrefix 形如 `advisor#id/`）先剥离再解析（解析先例 `escalate-async.mjs:212` · `subagent-run.mjs:129`）。事件名闭集（实读集）：`turn` · `queued` · `async` · `settled` · `stopped` · `done` · `cancelled` · `approval`；表外事件名 ⇒ 仍进 `ev:activity`（**不丢**，字段原样）。

`argsSummary` 供给（决策 D8-7）：本端展示面自持小函数（按工具挑关键参数的单行摘要，形仿 CLI 单源 `thincoder-cli/src/tui/tool-args.mjs:18`）；**不引 CLI 模块**（跨端依赖禁），核内无此单源（判据：`thincoder-core/advisor/loop.mjs:67` — 摘要属展示面不进核）。

**(d) 挂起表段 + 回合驱动**

- 挂起表 = `Map<promptId, { kind: "item" | "batch", key, resolve }>` —— **主进程单一持有点**（渲染面只呈现，零副本）；`promptId` = `crypto.randomUUID()`（零生成态）。
- 逐项门：登记 → `emit("ev:approval", { key, promptId, shape: "item", tool, argsSummary })` → 等 `approval:respond` → `resolve(verdict === "once" || verdict === "always")`；`always` 额外置 `agent.autoApprove = true`（作用域 = 本 app 装配实例，决策 D8-6）→ **表项即删**。
- 批门：登记 → `emit(..., { key, promptId, shape: "batch", batch: { count, tools: [{ name, argsSummary }] } })` → resolve 值映射：`approveAll` → `"approveAll"` · `deny` → `"deny"` · `oneByOne` → `"oneByOne"`（核 `dispatch.mjs:281-289` 三值闭集）。
- verdict 六值闭集（`once` · `always` · `reject` · `approveAll` · `deny` · `oneByOne`）**逐字透传，只在本段映射**：跨形误值（批形收 `once`/`always`/`reject`）与表外值 ⇒ `{ ok: false, reason: "bad-verdict" }` 且**不 resolve**（挂起项保留）。
- `respond({ promptId, verdict })`：未命中 `promptId` ⇒ `{ ok: false, reason: "unknown-prompt" }`；未装配 ⇒ **fail-loud**（throw，`{ ok: true }` 字面零现）。
- 回合驱动：`send(text)` → 懒装配 → `agent._providerInvalid` ⇒ `{ ok: false, reason: "provider-invalid" }`（零假回合）→ 建 `AbortController` → `run(agent, text, callbacks, { signal })`（**不回执等待**：`{ ok: true }` 立即回，长回合不阻塞 IPC；回合终局经 `ev:activity`）→ `finally` 清 controller。在飞再 `send` ⇒ `{ ok: false, reason: "busy" }`（单驱动器，禁双 `runAgent` 竞态——先例注释 `agent-turn.mjs:288-289`）。`interrupt()` ⇒ `controller.abort()`（无在飞 ⇒ `{ ok: false, reason: "idle" }`）。

**(e) 值面写者**（写者全在渲染侧 `renderer/events.mjs` —— store 属渲染进程；主侧只产事件/回执）

| 切片 | 写者（事件 / 回执 → 纯动作） |
|---|---|
| `blocks` | `ev:token`（同 id 续写 `streaming` 态；回合首增量起块）· `ev:tool-call`（tool 块入：`{kind:"tool", id, name, argsSummary, status}`）· `ev:tool-output`（结果文本累积）· `ev:tool-result`（`status` / `durationMs` / `result` 收束）· `ev:error`（error 块）· 页应用（回填 prepend） |
| 回合态 | `⟦ev⟧turn` → ① `tabBadges[key] ⊇ { running }` ② `sessionMeta[key].turn` **不入**（会话头槽序单源 = `views/chrome.mjs:7` 五槽，零新槽 —— 边界项） |
| 标题 | 回合收尾（`settled` / `done` / `stopped`）⇒ 渲染侧 re-invoke `sessions:list`（**既有读通道**）刷新 `sessions[]` 行（标题 / 计数随动）；**零新通道** |
| `tabBadges` | 码集（闭集 `running` / `approval` / `done`）按会话键维护：`running` 置 = 回合起、清 = 回合尾；`approval` 置 = 审批门开、清 = 出站 respond；`done` 置 = 回合尾、清 = 该键激活（`session:switch` 接线点）。写者 = 归约器；读者 = `requestClose`（`app.mjs:183`）/ `statusModel` / `tabbarModel` |
| `sessionMeta` | 开页 / 切换时由 `history:page` 回执的 `meta` 写：`sessionMeta[key] = { provider, model, effort, engineering, autoApprove }` — **只落非空串**（`views/chrome.mjs:8-9` 判据：非串 / 空串 ⇒ 零节点；零字段 ⇒ `data-meta="none"`）；值 = 供给串原样（数据面非词表） |
| `activeSession` | 该键有活动会话 ⇒ 置键（对话流 `live` 判据 `views/chat.mjs:33` / `views/activity.mjs:37` / 重挂键 `app.mjs:46`）；关页 / 无会话 ⇒ `null` |

帧出口不变：切片经 `store.set` ⇒ `paintChat`（`app.mjs:17-20` 既有七键判据）；本批新增的实只有**写者**，帧机制零改。

**(f) 回填面 + 页**

- `history:page { key, before }` 薄处理体（`session-slots.mjs`）：`loadSlotFile(cwd, slotOf(key))` → `historyWindow(history, before, 200)`（**核单源转口，零算法副本**）→ 回执 `{ ok: true, messages, hasOlder, next, meta }`；`before = null` ⇒ 尾页（PAGE1）；`next` = 本页首条全局 `idx`（下一页游标；`hasOlder === false` ⇒ `next = null`）。槽缺 / 不可读 / 键不在当项目 ⇒ `{ ok: false, reason }`（fail-loud，零空页假象）。
- 页量（决策 D8-5）：`pageSize` **不传**（核缺省 200 条 = 单源）；**条 ≠ 块**（一条 message 可归约多块）⇒ 渲染窗限口径独立：`MAX_RENDER_BLOCKS = 200`（块）不变，回填增长 = `nextWindow` 沿**本页归约后实际块数**收束（禁写死 `HISTORY_PAGE` 换算）。
- 回执应用（`renderer/events.mjs` 的 `applyPage`）：首屏（`before === null`）⇒ 非空则先摘空态页、`blocks` 整置 + 回底（`following = true` / `pendingNew = 0`）；回填（`before != null`）⇒ 前插 + 高度补偿（`settleFrame` 六步既有）；两路径皆落 `history.hasOlder = hasOlder` · `history.page = next`。
- `onBackfill` + `guards{hasOlder, inFlight}` **实接线**（RENDERER.md §1.1 回填口径条）：`guards` 读 `history.hasOlder` / `history.inFlight`；触发三步判据沿用 §3（顶 ≤ 48px ∧ `hasOlder` ∧ 无在途）；在途置位 = `beginBackfill`、清位 = 回执落态（成败皆清 —— finally 语义）。

**(g) 渲染接线形态**

- 新档 `renderer/events.mjs`：`reduce(state, ev)`（纯函数，零 DOM）+ `attachEvents({ on })`（订阅九通道 + 退订句柄）+ `applyPage(state, receipt)` + `blockOfMessage(msg)`（页 → 块归约，五型闭集 `user|assistant|reasoning|tool|error`，决策 D8-8）。
- `app.mjs`：订阅接线 + 回填控件接线 + `history:page` 调用点 + `guards` 消费；**297 行 + 接线 ⇒ 触发在册预案**：池面一族（`paintPool` 及其挂载）出档 `renderer/mount-pool.mjs`。
- 渲染面纪律：零 `node:` / 零裸包 import（既有）；文案一律 `t()`；两态落形（handler 给 / 缺 = 诚实非死控）。

**§2.3 受影响文件表 + 设计档落点**

| 文件 | 现行行数 | 预期 Δ | 说明 |
|---|---|---|---|
| `src/main/agent-host.mjs`（新） | 0 | ~260 | 装配 + 桥 + 挂起表 + 回合驱动三段；**触发线 300** ⇒ 拆 `agent-bridge.mjs`（桥）/ `suspensions.mjs`（挂起表）—— 拆分预案在册，预算内预期不触发 |
| `renderer/events.mjs`（新） | 0 | ~160 | 归约器 + 页应用 + 订阅接线（纯函数面可 node 直测） |
| `renderer/mount-pool.mjs`（新） | 0 | ~90 | 池面接线（`app.mjs` 在册预案拆出） |
| `src/main/main.mjs` | 83 | +~45 | host 装配 + `emit` 闭包 + 3 通道注册 + 9 通道出站接线 |
| `src/main/ipc.mjs` | 100 | +~15 | 白名单 10 → 13（新三行） |
| `src/main/session-slots.mjs` | 83 | +~40 | `history:page` 薄处理体 + `meta` 五值串化 |
| `src/main/preload.cjs` | 31 | +~30 | `on(name, cb)` 订阅面 + 白名单校验 + 退订 |
| `renderer/app.mjs` | 297 | −~60 / +~25 | 池面出档 + 事件/回填接线 ⇒ 拆后 < 300 |
| `renderer/views/chat-scroll.mjs` | 90 | +~20 | `guards` 实给 + 增长按实并入块数 |
| `test/host-floor.test.mjs` | （批内首步实读） | ±~10 | U74 白名单计数 10 → 13 + 末位项随动（**落地用例随动，非新增回归面**） |
| `test/agent-host.test.mjs`（新） | 0 | ~200 | 装配 / 桥 / 挂起表 / 回合驱动（脱壳：假 `assemble` + 假 `run` + 假 `emit`） |
| `test/events-reduce.test.mjs`（新） | 0 | ~180 | 九通道归约 + 值面写者 + 审批清除 + 页应用 |
| `test/history-page.test.mjs`（新） | 0 | ~120 | 薄处理体（真槽文件 → 窗口页 / 游标 / `meta`） |
| `test/files.mjs` | 9 | +~3 | 用例档 14 → 17 |

设计档落点（本 §2 落形后同刻改，**同源**）：

- `docs/desktop/design/SHELL.md` §1 表行（`agent-host.mjs` 去「（拟新增）」记）· §4 项 5 尾句（挂起表供给 = 本批）落形
- `docs/desktop/design/IPC.md` §1（余八行 `ev:*` 载荷定形 + 白名单 13）· §2（`history:page` / `msg:send` / `msg:interrupt` 三行行列实给）
- `docs/desktop/design/RENDERER.md` §1.1（回填口径条：`guards` 实接线态）· §2（窗限增长 = 按实并入块数）· §4 行 4（首屏页应用口径）
- `docs/desktop/design/PROJECT.md` §4.1（预算实读回填 + `mount-pool.mjs` 拆档登记）· §7（用例随动）

**§2.4 用例表**（U76–U95；档 = 文件名，全部 node 平测 / 零网 / 零 electron）

| U# | 用例名 | 面（输入） | 断言（期望） | 档 |
|---|---|---|---|---|
| U76 | 推面订阅（preload） | `on`：表内 / 表外 / 退订×2 | 表内 ⇒ 订阅成功 + 回调收单参 payload；表外 ⇒ **throw**（零静默返回）；退订 ⇒ `removeListener` 收同一 handler 引用；二次退订零抛 | host-floor |
| U77 | 白名单两向 ≡ | `preload.cjs` `CHANNELS` / `ipc.mjs` `HANDLERS` | 键集两向相等 ∧ **13 项** ∧ 含三新行；未装配处理体 ⇒ throw（零 `{ok:true}` 字面） | host-floor |
| U78 | 脱壳面纪律 | `agent-host.mjs` 源面 + 假 emit | 源面零 `electron` import（正则零命中）· 假 emit 收序 = 事件序 | agent-host |
| U79 | 装配段调用序 | 假 deps（`loadConfig`/`createMemory`/`createAgent`/`assembleBuiltinTools` 替身） | 调用序 = §2.2(b) 1–7；`model` 必传（替身收非空）；`cwd` = 注入项目根（**非** `process.cwd()`）；零 MCP / 零 `attachManifest` 调用 | agent-host |
| U80 | 装配形 + provider 判定 | 假 deps 产物（有效 / 无效 provider） | `agent.providers` / `activeProvider` / `activeModel` 在场；无效 ⇒ `_providerInvalid === true` ∧ reason 非空 | agent-host |
| U81 | 装配实例生命周期 | `ensure` 同键两次 / `dispose` 后 | 同键复用（`createAgent` 恰一次）· dispose 后重装配（恰二次）· 表清 | agent-host |
| U82 | 桥面九映射 | 假 agent 逐回调直调 | 九回调 → 九通道逐条（载荷键集按 §2.2(c)）· `onToolResult` 第 4 参 subKey 透传 | agent-host |
| U83 | `⟦ev⟧` 分流 | 串矩阵：纯 `turn` / 多字段 / relay 前缀 / 普通文本 / 表外事件名 | `turn` ⇒ `{event:"turn", n, max}`；relay 前缀剥离后解析成立；普通文本 ⇒ 全量进 `ev:token`；表外事件名 ⇒ 进 `ev:activity`（**不丢**）；**协议行零进文本面** | agent-host |
| U84 | 挂起表两形 | 逐项门 / 批门触发 → emit + 表读数 | emit 载荷 = §2.2(d)（item：`tool`+`argsSummary`；batch：`batch.count`+`tools[]`）· 表恰一项 · `promptId` 互异 | agent-host |
| U85 | verdict 映射与即删 | 六值 × 两形矩阵 + 表外值 + 未知 `promptId` | 逐项 `once`/`always` ⇒ resolve true（`always` 另置 `autoApprove === true`）· `reject` ⇒ false；批形三值逐字；跨形 / 表外 ⇒ `{ok:false, reason:"bad-verdict"}` ∧ 表项**保留**；命中 ⇒ 表项即删；未知 id ⇒ `unknown-prompt` | agent-host |
| U86 | 回合驱动与中断 | `send` 三态（无 provider / 在飞再发 / 正常）· `interrupt` 两态 | 无 provider ⇒ `{ok:false,"provider-invalid"}` ∧ `run` 零调用；在飞 ⇒ `busy`；正常 ⇒ `run(agent,text,cb,{signal})` 收到 ∧ 立即回 `{ok:true}`；`interrupt` ⇒ `signal.aborted === true`；无在飞 ⇒ `idle` | agent-host |
| U87 | 块流写者 | `reduce`：token 续写 / 工具三事件 / error 块 | 同 id 续写（`streaming` 态）· 新回合起块 · tool 块键集收束（`status` / `durationMs` / `result`）· error 块五型内 | events-reduce |
| U88 | 回合态 + 位标码集 | `⟦ev⟧turn` / 回合首尾 / 审批开合 / 键激活 | `running` / `approval` / `done` 三码置清四组 · 码集 ⊆ 闭集 · 他键零影响 · `sessionMeta` **零 turn 键** | events-reduce |
| U89 | 标题刷新 + `sessionMeta` | 收尾事件 → 假 invoke；页回执 `meta` 五行矩阵 | 收尾 ⇒ `sessions:list` 恰一次（参数逐字）；`meta` 五键原样写入；空串 / 非串 ⇒ 该键不落；全缺 ⇒ `{}` | events-reduce |
| U90 | `activeSession` + 页应用 | 开 / 关页 · 首屏页（空 / 非空）· 回填页 | 开页置键、关页 `null`；首屏非空 ⇒ 先摘空态 + 整置 + 回底（`following` / `pendingNew`）· 首屏空 ⇒ 零块；回填 ⇒ 前插 + `hasOlder`/`page` 落态；`next === null` ⇔ `hasOlder === false` | events-reduce |
| U91 | 审批入卡入池 | `ev:approval` 两形 → 切片 + `chatModel` / `poolModel` 树读数 | `pool.approvals` 恰一项（键集 = `views/activity.mjs:108-125` 读取集，**零新键**）· chat 帧尾卡在 · 池面该族一项 · `shape` 两形判别 | events-reduce |
| U92 | 出站后清除 | `respondApproval`（假 host 成功 / 拒绝） | 成功 ⇒ 两侧同清（切片摘项 ∧ 表删项）∧ 载荷 = `("approval:respond", {promptId, verdict})` 逐字；拒绝 ⇒ `console.error` 在场 ∧ **零乐观摘除** | events-reduce |
| U93 | 页处理体（真槽文件） | 临时 cwd + 真槽（尾页 / 中页 / 首页 / 空历史） | 回执 = `{ok:true, messages, hasOlder, next, meta}`；`before=null` ⇒ 尾页；`next` = 页首全局 `idx`；`hasOlder=false` ⇒ `next=null`；源面零自算切片（核窗口单源） | history-page |
| U94 | 页负例 | 槽不存在 / 键不在当项目 / 坏档 | `{ok:false, reason}` 逐例（fail-loud）· 零抛过通道边界 | history-page |
| U95 | 显形与行数 | 新档行数 / 渲染 import 面 | 新档 ≤ 300（触发线检查）；`renderer/**` 零 `node:` / 零裸包；`agent-host.mjs` 零 `electron`；`app.mjs` 拆后 < 300 | host-floor |

**§2.5 验收对照**（§1.3 五判据 ↔ 用例）

| §1.3 判据 | 覆盖 | 说明 |
|---|---|---|
| ① 桥面脱壳直测（假核替身） | U78–U86 | 假 `assemble` + 假 `run` + 假 `emit`（`loadConfig` 可注入）⇒ 零网 / 零 electron / 零用户目录，node 平测 |
| ② 值面端到端（假核事件 → 切片 / 树读数） | U87–U90 | `reduce` 纯函数 + `*Model` / `mount*` 树读数；真回合链路（真核 + 网络）**不入自动判据** |
| ③ 审批链路（事件 → 卡在 → 出站 → 清除） | U84–U85 · U91–U92 | 主侧（登记 / 映射 / 即删）+ 渲染侧（入 / 摘）；两侧同清 |
| ④ 零回归 | U74 随动 | 69 例不红 · 三包增量零 · doc-check 新增/改动行零新增（基线 = 悬空 7 / 行宽 18） |
| ⑤ 形态 | U78 · U95 | `RENDERER.md` §1.1 + 主进程处理体先例（`ipc.mjs` / `projects.mjs` / `sessions.mjs`） |

**§2.6 决策**（直给 + 理由）

- **D8-1** `msg:send` / `msg:interrupt` **入本批**（主侧本体 + 入册）：依据 = SHELL.md §4 项 4「回合驱动与中断」+ §1.2① 「会话流驱动」；无回合入口的装配 = 死装配（装配面唯一消费者 = 回合入口）。UI 输入区 / 中断键**不入本批**（`UI.md` 全文零「输入 / 发送 / composer」——grep 零命中）⇒ 主侧可达性由 U86 脱壳直测覆盖，不以人工走查冒充实机链路。
- **D8-2** `attachManifest`（工程模式 M1 钩子）**不入本批** —— 与 CLI 装配的显式端差（CLI `make-agent.mjs:129` 装配即 attach）；本批 `agent.manifest` 不附着、不建档（零假档），工程模式 manifest 面随台账 #403 段。
- **D8-3** MCP 连接**不入本批**：SHELL.md §3 工具行枚举 = 静态表 + 家族段；MCP 随设置批与 `mcp:*` 通道同批（避免「有连接无管理」半面）。
- **D8-4** `history:page` 回执**携带 `meta`**（会话头五值）：页加载 = 会话开面，一次往返供给块面 + 头面；**不改会话族信封**（批 5 已落契约）。
- **D8-5** 页量 = 核缺省 200 条（`pageSize` 不传）；窗限增长 = 按**本页归约后实际块数**（条 ≠ 块 ⇒ 禁写死换算）。
- **D8-6** `always` 作用域 = 本 app 装配实例（`agent.autoApprove = true`；跨会话不持久 —— 槽文件零写）。
- **D8-7** `argsSummary` = 本端展示面自持小函数（核内无此单源，判据 `thincoder-core/advisor/loop.mjs:67`；CLI 单源 `thincoder-cli/src/tui/tool-args.mjs:18` 仅形参照，**不引 CLI 模块**）。
- **D8-8** 页 → 块归约 = 渲染面 `blockOfMessage`（五型闭集）；活事件面 / 页归约面两块来源，一致性判据 = 五型闭集 + 键集（字节一致不保证 ⇒ §2.8 登记）。

**§2.7 边界**（不做）

沿用 §1.4：设置 / 首启 / 打包 / 主题 / `thincoder-core/**` 改动。另本批不做：UI 输入区与中断键（视图批）· MCP 连接 · 工程模式 manifest 附着 · 审批卡 `changes` 摘要供给（核无参数摘要单源 ⇒ 本批 `undefined`，视图防御读在册 `views/approval.mjs:93-99`）· 多实例 / peer 面 · 跨端同步面 · 真回合自动判据（需网络）。

**§2.8 上抛与登记**

1. **活 / 页两面块形一致性**（D8-8）：无自动判据 ⇒ 随 T-DSK17/18 实机批核对（登记不隐）。
2. **端差登记（desktop ⇄ CLI 装配）**：MCP 连接 · `attachManifest` · `validateProvider` 消费方式（fail-loud vs 只置标记）⇒ 随设置批 + 台账 #403 收口；三差皆显式，无静默降级。
3. **`sessionMeta` 五值字段名**：以核槽记录 / config 为单一权威源（本档不重述）；实施首步实读订正（`effort` / `autoApprove` 若非槽字段 ⇒ 以 config 回退），订正须在 §5 报明。
4. **`test/host-floor.test.mjs` U74 计数随动** = 落地用例随动（10 → 13），非新增回归面。
5. **`changes` 摘要供给缺失面** = 登记，随工具卡 / 视图批收口。

**§2.9 三链一致**（§2.1 条目 ↔ §2.4 用例 ↔ 需求档 T-DSK）

| §2.1 条目 | 用例 | 需求档 |
|---|---|---|
| 1 单向推面 | U76–U78 | PROJECT.md §7 T-DSK4 · T-DSK5 |
| 2 装配段 | U79–U81 | T-DSK1 |
| 3 回调桥 | U82–U83 | T-DSK4 · T-DSK5 · T-DSK6 |
| 4 挂起表 + 回合驱动 | U84–U86 | T-DSK4（流式 / 中断）· T-DSK6 |
| 5 值面写者 | U87–U90 | T-DSK4 · T-DSK7 · T-DSK18 |
| 6 审批事件面 | U91–U92 | T-DSK6 |
| 7 回填面 | U93–U95 | T-DSK17 · T-DSK19 |

（T-DSK 行号以 `PROJECT.md` §7 为单一权威源；本表 = 映射，不重述验收内容。）

**§2.10 设计档落形与闸态**

四档随动（落点见 §2.3）在评审通过后落形；闸态 = 待 advisor 设计评审（**本设计档不自行触发**）；§2 写入面 = `batch append`（本段）。

### §2 补遗（键面 / 映射补正 / 文档随动 · 与本节同权）

- **键面收束（单一权威 = 本段）**：会话键 `key = String(slot)`（十进制槽号串；键面成于渲染面开标签——实读 `thincoder-desktop/renderer/app.mjs:131` / `:157` / `:172`）。host 面方法签名 = `ensure(key, slot)` · `send(key, text)` · `interrupt(key)` · `respond({ promptId, verdict })`；通道载荷 = `msg:send { key, text }` · `msg:interrupt { key }` · `history:page { key, before }`；九 `ev:*` 载荷皆携 `key`；主侧装配表 / 挂起表项 / 渲染侧切片键（`tabs` / `tabBadges` / `sessionMeta` / `activeSession`）同值同源；主侧由键解槽号，不合规键 ⇒ `{ ok: false, reason: "bad-key" }`（不静默兜底）。
- **映射补正**：条目 7（回填面）↔ **T-DSK17 / T-DSK18 / T-DSK19**（T-DSK18 = 「历史回填」主例；§2.5 表内该行以本条为准）。
- **端差两条（登记 = `docs/desktop/design/SHELL.md` §4 端差注）**：MCP 连接随设置批 · `attachManifest` 工程模式 M1 钩子不附着（CLI「装配即 attach」不作本端先例）。
- **设计档随动（四档 · 本批落）**：`SHELL.md` §1 树（`agent-host.mjs` 去标记 + `events.mjs` / `mount-pool.mjs` 两行 + 用例模块十七档）· §4 项 4 / 项 5 收为已落口径 + 端差注；`IPC.md` §1 增载荷键集 / 会话键面 / 订阅面三段 + §2 `history:page` / `msg:send` / `msg:interrupt` 定形 + 白名单 13 项段；`RENDERER.md` §1.1 事件归约面条 + 回填接线口径改**接线态** + §2 / §3 页量口径（条 ≠ 块）+ §4 行 4 页应用口径；`PROJECT.md` §4.1（两新档行 · 五行使预算随动 · 用例模块十四 → 十七档 · `app.mjs` 拆分预案落形）+ §8 新增本批不做行 + §10 增 G / H / I / J 四行。
- **一致性面修正（随手上报）**：`PROJECT.md` §8 旧「本批不做：产品代码 · 打包脚本 · `thincoder-desktop/` 实体目录…」行系批 1 设计批射程、与现状相反 ⇒ 删去已失效三项，保留贯穿项（改核机制 · 需求档与提示词面）。

**§2 补正（本补遗内一处）**：上段「设计档随动（四档 · 本批落）」中「`SHELL.md` §1 树（`agent-host.mjs` 去标记…）」措辞有误——该档盘上未落（`thincoder-desktop/src/main/*.mjs` 枚举无此项）⇒「（拟新增）」标记**保留**（`docs/desktop/design/SHELL.md` §1 树与 `docs/desktop/design/PROJECT.md` §4.1 两处同项一致）；新增两档 `events.mjs` / `mount-pool.mjs` 同带该标记。实施批落地后由实施舱按盘上实态去标（既有惯例）。

**§2 补正（闸态）**：§2.10 末行「四档随动…在评审通过后落形」以本批实际执行为准——**四档随动已随本批落形**（设计档 = 评审对象）；评审后只按评审发现做定点修订（D5 冻结窗：评审期内不再改档）。

**§2.11 修复轮（#79 · 评审轮次 1 十五条逐号收正 · 修后为准）**

编号说明：本节 = §2 append-only 追加块（评审轮次 1 十五条逐号收正）。**凡 §2 内（§2.1–§2.10 及两条补正段，含面清单「回调面」枚举）与本节冲突处，一律以本节为准**；被收正的原行按 append-only 原文在场，其规范效力随本节而止。本节以「号 → 收正后口径」直书（号 = §3 轮次 1 findings 编号）。

**① `ev:approval` 形值归锚** —— 值域 = `"single"` ∥ `"batch"`，单源 = `docs/desktop/design/IPC.md:18`。

- 逐项门 emit：`emit("ev:approval", { key, promptId, shape: "single", tool, argsSummary })`；挂起表表项键 `kind` 同取该值域（同一区分不设第二套词）。
- 值域外 `shape` ⇒ 消费面零出口：`thincoder-desktop/renderer/views/approval.mjs:41-43` 回 `null` ⇒ 卡面零按钮 ∧ 池面零操作区（账目仍在 `data-prompt-id`——`views/activity.mjs:96-106`）。
- U84 断言标签 = `single`：`tool` + `argsSummary`；`batch`：`batch.count` + `tools[]`。

**② 批形 `tools` = 工具名串数组**（单源 = `IPC.md:18`；先例键形 `thincoder-cli/src/tui/interaction.mjs:104`）。

- 批门 emit：`emit("ev:approval", { key, promptId, shape: "batch", batch: { count, tools } })`——`tools` 逐项为**串**，与门内清单同序同值。
- 消费面判据：`views/approval.mjs:79-83` 逐项滤非串（`hasText`）⇒ 对象项全滤除、`batchCount` 回退 0（`:85-88`）⇒ 批卡假空；故载荷侧只出串。
- 逐工具参数摘要**不入本批**（登记 = §2.8 项 5 同面；如需 ⇒ `IPC.md` 增键 + 同步消费面）。
- U84 加臂：`batch.tools` 逐项 `typeof === "string"` ∧ 非空。

**③ 回合边界信号（`onAgentTurn` 入桥）**

- 回调面 = **九回调 + 一字段**：`onToken` · `onToolCall` · `onToolOutput` · `onToolResult` · `onPermissionRequest` · `onBatchPermissionRequest` · `onQuestion` · `onTaskUpdate` · **`onAgentTurn(turn, maxTurns)`**（第九）；`agent.autoApprove` = 装配实例字段（非回调）。坐标 = `thincoder-core/agent.mjs:229`（每轮无条件调用）。
- 桥面映射（§2.2(c) 表尾三行以本段为准）：`onAgentTurn(turn, max)` → `ev:activity { key, event: "turn", n, max }`（**depth0 唯一回合起信号**）；`⟦ev⟧…` 内联事件 → `ev:activity { key, event, fields }`（`⟦ev⟧turn` 仅 `depth>0`——`thincoder-core/agent.mjs:224-226`，不作回合起判据）。
- 回合尾 = 宿主 run 结算 ⇒ `ev:activity { key, event: "done" }` ∥ `{ key, event: "stopped" }`（映射见 ④）。
- 值面随动（§2.2(e)）：`tabBadges[key] ⊇ running` 置 = `ev:activity` `turn`、清 = 回合尾；标题刷新（re-invoke `sessions:list`）= 回合尾 `done` / `stopped`；`sessionMeta` 零 turn 键（不变）。
- U82 断言补 `onAgentTurn` 槽位；U88 四组置清改由 `ev:activity`（`turn` / `done` / `stopped`）与 `ev:approval` 驱动。

**④ run 结算 → `ev:error` 映射（回合驱动行收正）**

- `send(key, text)`：懒装配 → `_providerInvalid` ⇒ `{ ok: false, reason: "provider-invalid" }`（零假回合）→ 建 `AbortController`（**按 `key` 存**——每键单飞）→ `run(agent, text, callbacks, { signal })`（立即回 `{ ok: true }`）→ 结算映射三条：resolve ⇒ `emit("ev:activity", { key, event: "done" })`；拒绝 ∧ `signal.aborted` ⇒ `emit("ev:activity", { key, event: "stopped" })`；拒绝 ∧ 非 abort（provider 错 / 流错等）⇒ `emit("ev:error", { key, message: String(err?.message ?? err) })`（消费面 = 错误卡块型 `error`）。`finally` 清本键 controller。
- `busy` / `idle` 按键判：同键在飞再发 ⇒ `{ ok: false, reason: "busy" }`（禁同键双 `runAgent` 竞态——先例注释 `thincoder-core/agent/agent-turn.mjs:288-289`）；`interrupt(key)` = 本键 `controller.abort()`（同键无在飞 ⇒ `{ ok: false, reason: "idle" }`）。
- U86 加臂：假 `run` rejected（非 abort）⇒ `ev:error` 恰一次 ∧ `message` 非空；abort ⇒ `stopped` 恰一次 ∧ 零 `error`；同键在飞 ⇒ `busy` ∧ `run` 零二次调用；两键各一路（controller 两枚）。
- U82 加臂：`onToolResult` 收 `"Error: …"` ⇒ `ok === false`；非该前缀 ⇒ `ok === true`（判据见 ⑪）。

**⑤ 白名单面收正（`IPC.md:51` 就地改）**

- 白名单 = **已实给 13 项** = 十项（`config:read` · `project:open` · `project:recent` · `sessions:list` · `session:create` · `session:switch` · `session:rename` · `session:delete` · `session:resume` · `approval:respond`）+ 三新（`history:page` · `msg:send` · `msg:interrupt`）。
- 追加序 = 第 11–13 项按上列；既有十项序锁定（第 10 项 = `approval:respond`）；`IPC.md` §2 表其余通道随各自批次入册。
- 落点 = `thincoder-desktop/src/main/ipc.mjs` 处理体表 ≡ `thincoder-desktop/src/preload/preload.cjs` 暴露表（两向相等 = 用例机检面）；表外 ⇒ 拒绝（零静默兜底）。

**⑥ 随动面补 U13（含括注）**

- `test/host-floor.test.mjs` 随动 = **U13 + U74 两例**：U13 = `deepEqual([...CHANNELS], …)`（实读 `thincoder-desktop/test/host-floor.test.mjs:80-88`，括注 `:87`）· U74 = 计数（`:108`）+ 末位断言（`:109`）。
- 两例计数 = **13**（三新入册后的白名单长）；U13 列举数组末位追加三新（序同 ⑤）；U74 末位断言 = 「第 10 项 = `approval:respond` ∧ 计数 13」。
- §2.5 ④ 与 §2.8 项 4 的行文随动 = U13 / U74 两例（非仅 U74）。

**⑦ 池切片与两读数写者**

- `pool.approvals`：写者 = `ev:approval`（门开入项；键集 = `promptId` · `shape` · `tool?` · `argsSummary?` · `batch?`——读取面 `views/activity.mjs:96-106` + `views/approval.mjs:79-99`，**零新键**）；出站 `approval:respond` 成功 ⇒ 摘项（失败零摘除——U92）。
- 两读数（读者 `views/activity.mjs:50-51`；非数 ⇒ 零节点 `:24-25`）：`pool.approval` = 待审批项数（门开 +1 / 摘项 −1）；`pool.running` = 运行中活动块数（`pool.blocks` 内 `status === "running"` 条数——状态码域单源 = `thincoder-desktop/renderer/views/chat-tool.mjs:19-25`）。
- `pool.blocks` 写者 = §2.2(e) 行 1 同源（入 / 收束同点，读数随之刷）；`pool.queue` 本批零写者（登记 = 随队列面批）。
- U91 补断言：两读数在场（`pool.approval` = 1 ∧ `pool.running` = 0，皆**数**——落 `0` 读数）；U92 补：出站成功 ⇒ `pool.approval` = 0。

**⑧ `ev:question` / `ev:task` = 订阅不写切片（登记）**

- 归约面口径 = **九通道订阅 · 七通道写切片**（`ev:token` · `ev:tool-call` · `ev:tool-output` · `ev:tool-result` · `ev:approval` · `ev:activity` · `ev:error`）；`ev:question` / `ev:task` 订阅在场、不丢，呈现面随视图批（提问卡 / 任务面）。
- `test/events-reduce.test.mjs` 档描述 = 「九通道订阅 · 七通道归约 · 值面写者 · 审批清除 · 页应用」（§2.3 该行与 §2.4 U87–U92 覆盖面不变）。

**⑨ 签名统一（单源 = §2 补遗「键面收束」）**

- §2.2(b) 导出面 = `{ ensure(key, slot), send(key, text), interrupt(key), respond({ promptId, verdict }), dispose(key), table }`；§2.2(d) 内文同步 `send(key, text)` / `interrupt(key)`；载荷 `msg:send { key, text }` / `msg:interrupt { key }`（单源 = `docs/desktop/design/IPC.md:40`）。

**⑩ 三处失效表述收正**

- §2.5 行 7：回填面 ↔ 需求档 = **T-DSK17 · T-DSK18 · T-DSK19**（T-DSK18 = 历史回填主例；单源 = §2 补遗「映射补正」）。
- §2.10 末行：四档随动**已随本批落形**（落点 = §2.3）；闸态 = **评审轮次 2**；§2 写入面 = `batch append`（本追加块 = §2.11）。
- §2 补遗留档行：`SHELL.md` §1 树随动 = `agent-host.mjs`「（拟新增）」标记**保留** + `events.mjs` / `mount-pool.mjs` 两行（同带标记）——去标 = 实施批落地后按盘上实态（既有惯例）。

**⑪ `ok` 判据串（`IPC.md:25` 就地改 + §2.2(c) `onToolResult` 行）**

- `ok = !String(result).startsWith("Error:")`——与核内工具出口同源（实读 `thincoder-core/agent/dispatch.mjs:370` / `:422` / `:428` / `:440`）；本端不另立判据、不解析正文。

**⑫ 页游标（`IPC.md:39` 就地改 + §2.2(f)）**

- `next` = 窗下界：`end = before == null ? 源历史条数 : Math.max(0, Math.min(before, 源历史条数))` · `next = Math.max(0, end − HISTORY_PAGE_SIZE)`——与核窗界同式（`thincoder-core/history-window.mjs:111-112`）；页首条在场时与「本页首条全局 `idx`」同值。
- **零消息页**（窗口内可视 0 条 ∧ `hasOlder` 真）同走该式 ⇒ 游标必推进；`HISTORY_PAGE_SIZE` 核单源（`thincoder-core/history-window.mjs:24`——宿主 `import`，零字面量）；无更早页 ⇔ 窗下界 `0` ⇒ `next = null`（`history-window.mjs:178`）。
- U93 加臂：零消息页 ⇒ `{ messages: [], hasOlder: true, next > 0 }`（构造「窗内全不可视 ∧ 窗下界 > 0」）；首页 ⇒ `next === null`。

**⑬ 三新用例档预算（`PROJECT.md:117` 就地改）**

- 三值 = `test/agent-host.test.mjs` ~200 · `test/events-reduce.test.mjs` ~180 · `test/history-page.test.mjs` ~120（单源 = §2.3 表）；该行同刻同步。判据 = 贴 300 层即触发拆分评审 ⇒ 预算留余地。

**⑭ U91 锚收正**

- 断言锚 = `thincoder-desktop/renderer/views/activity.mjs:96-106`（待审批条目读取面）+ `thincoder-desktop/renderer/views/approval.mjs:79-99`（`promptId` / `shape` / 两形摘要片 / 键位面）；键集 = `promptId` · `shape` · `tool?` · `argsSummary?` · `batch?`（零新键）。`views/activity.mjs:108-125` = 活动块 / 队列条目面（不涉审批键集）。

**⑮ `host-floor` 实读 + `main.mjs` 预算（`PROJECT.md:83` 就地改）**

- §2.3 该行现行行数 = **123**（实读 `thincoder-desktop/test/host-floor.test.mjs`）。
- `PROJECT.md:83`（`main.mjs`）预算 = **~128**（§2.3 = 83 + ~45；两处同刻同步）。

**零回归基线（as-of 本修复轮 · 取全读数）**：doc-check 失败集 = 悬空 **10** · 行宽 **25**（本域 7 行 = `IPC.md:25` / `:89` · `PROJECT.md:302` · `RENDERER.md:29` / `:89` · `SHELL.md:39` / `:103`）；本节收正后失败集**无新增**（`IPC.md:25` 拆条 ⇒ 计数内消）。§2.5 ④ 所引「悬空 7 / 行宽 18」为早期读数，以本行为准（§1.3 面属父侧——随动登记）。

**落点表（号 → 收正落点）**

| 号 | 落点 |
|---|---|
| ① · ② · ③ · ④ · ⑥ · ⑦ · ⑧ · ⑨ · ⑩ · ⑭ | 本节对应条（§2 相应行以本节为准） |
| ⑤ / ⑪ / ⑫ | `docs/desktop/design/IPC.md:51` / `:25` / `:39`（就地改；档尾变更记录一行） |
| ⑬ / ⑮ | `docs/desktop/design/PROJECT.md:117` / `:83`（就地改；档尾变更记录一行） |

**§2.12 收尾读数（§2.11 收正落盘后 · 终态重跑）**

- 命令 = `node scripts/doc-check.mjs`（`thincoder/`），失败集 = 悬空 **10** · 行宽 **24**。较 §2.11 基线（悬空 10 / 行宽 25）为**悬空持平 · 行宽净减 1**（`IPC.md:25` 拆条内消）；`IPC.md:110` = 基线 `:89` 位移（同文同长 405），非新增。
- 本域行宽六行（皆基线成员或其位移）= `IPC.md:110` · `PROJECT.md:302` · `RENDERER.md:29` / `:89` · `SHELL.md:39` / `:103`；本域悬空三项 = `RENDERER.md:71` / `:89` · `SHELL.md:79`（皆基线成员，未动——清账随各自批次）。
- §2.11 在 `IPC.md` 档尾新写的变更记录行长首读逾限（337 > 300）；已按同文件行宽收正先例就地拆为三行（83 / 145 / 113，语义零变，条目仍为一条）⇒ §2.5 ④「本批新增 / 改动行零新增」成立。

**§2.13 编号对照（登记 · 供轮次 2 评审对齐）**

- 本档实编号：`§2.11` = 修复轮 #79 块（十五条逐号收正 · 修后为准）· `§2.12` = 收尾读数；§2.10 之后的「补遗 / 两条补正」段未占号。§1.7（:48）所记「修复轮 #79（§2.12 形态）」即本档 `§2.11` 块之预期位——两侧号差 1，以本档实编号为准（§1 行随动属父侧）。

**§2.14 落点坐标复核（就地改后行号位移 · 供轮次 2 评审）**

- §2.11 ⑤/⑪/⑫ 与落点表所记 `IPC.md:51` / `:39` / `:25` = 评审时坐标（改写前）；就地改后实际行号 = 白名单面 `IPC.md:67-72`（原 `:51` 句扩为段）· 页游标注 `IPC.md:61-65`（原 `:39` 行改指，行本体现 `:49`）· `ok` 判据 `IPC.md:31`（段首 `:25` 未移）。`PROJECT.md:83` / `:117` 两点为单行就地改，行号未移。语义零变，仅行号位移。

**§2.15 doc-check 清项轮（#80 · 六超宽 + 三悬空 · 依 §1.8 裁定「本批新增 · 本批自清」）**

**任务面**：清本批设计轮引入的 doc-check 9 项 = 拆 6 超宽行 + 修 3 悬空锚；目标 = 全仓复跑回批前基线 **悬空 7 / 行宽 18**。射程 = 只此 9 项 · 零语义变更；不碰代码面 / 需求档 / 他批档 / `docs/vsc` / 批 1–7 冻结档。

**落点表（项 → 处置 → 落盘后实读字符数）**

| 项 | 类型 | 原行 → 处置 | 落盘后 |
|---|---|---|---|
| ① | 超宽 | `IPC.md:110`（405）→ 断于「表外 throw · 返回退订）；」后 | 227 / 180 |
| ② | 超宽 | `PROJECT.md:302`（478）→ 两断：「（拟新增）·」/「池面拆分落形）·」后 | 128 / 218 / 134 |
| ③ | 超宽 | `RENDERER.md:29`（328）→ 断于「工具 / 错误）。」后 | 272 / 58 |
| ④ | 超宽 | `RENDERER.md:89`（349）→ 补「（拟新增）」+ 断于「）；」后 | 166 / 190 |
| ⑤ | 超宽 | `SHELL.md:39`（312）→ 断于「用例模块十七档」后（续行 38 空格对齐 `run.mjs` 列） | 83 / 267 |
| ⑥ | 超宽 | `SHELL.md:103`（443）→ 两断：「保留）·」/「（未落口径）·」后 | 111 / 95 / 239 |
| ⑦ | 悬空 | `RENDERER.md:71` → 嵌式补「（拟新增）」（token 后 · 原 `）` 前） | 拟新增 ✓ |
| ⑧ | 悬空 | `RENDERER.md:89` → 同 ④（标记 + 拆分 = 一行两判） | 拟新增 ✓ |
| ⑨ | 悬空 | `SHELL.md:79` → 标记并入原括注 =「（拟新增 · 唯一持有点）」 | 拟新增 ✓ |

**前后读数**（命令 = `cd thincoder && node scripts/doc-check.mjs`）

- 悬空 **10 → 7** · 行宽 **24 → 18** · 拟新增 **34 → 37**（+3 = 三处标记入册）· 注记豁免 43 不变 · 迁移期引文 215 不变。
- 悬空 7 = 批前基线 7 项原样（`MODEL-SPECS.md:323` / `:1372` / `:1465` · `SESSION.md:850` · `VSC-DEBT.md:302` · `WEBVIEW.md:393` / `:420`——他板块面，未动）；行宽 18 全在 `CORE-UNIFICATION` / `MODEL-BENCH` / `MODEL-SPECS` / `VSC-DEBT` / `WEBVIEW`（需求档）域——本批四档零残留。
- 判据⑤「本批新增 / 改动行零新增」成立。

**零语义变更自证（字符守恒 · 断点处「空格」换「换行 + 缩进」）**

| 站点 | 原行 | 落盘后合计 | 差值归因 |
|---|---|---|---|
| `IPC.md:110` | 405 | 407 | +2 = 断点 1 处（插入 `\n` + 2 空格） |
| `PROJECT.md:302` | 478 | 480 | +2 = 断点 2 处 × 1（空格 → `\n` + 2 空格） |
| `RENDERER.md:29` | 328 | 330 | +2 = 断点 1 处 |
| `RENDERER.md:89` | 349 | 356 | +7 = 断点 2 + 标记「（拟新增）」5 |
| `SHELL.md:39` | 312 | 350 | +38 = 树续行缩进 38 空格 |
| `SHELL.md:103` | 443 | 445 | +2 = 断点 2 处 × 1 |

- 逐站点 join 还原：断点处拼接（去续行缩进）回原文 ⇒ 零字符增删 ✓；另 4 档档尾各补变更记录一行（射程外自愿披露——同轮同档改动随记，随本批先例）。

**登记（形态 / 裁定）**

- `RENDERER.md:29`：`.mjs` token 落引擎可见面外——「平 node 直测」夹在 `` `reduce(state, ev)` `` 与 `` `attachEvents({ on })` `` 之间，朴素反引号配对令 `isExecutableLine`（`scripts/doc-check-width.mjs:45`）判为码段行 ⇒ 整行跳过（`scripts/doc-check-anchors.mjs:142`）；**不补标记**（守「只此 9 项」射程）——形态意外在册（该行不产悬空亦不产超宽，实态无红）。
- 嵌式标记「`（拟新增）` 嵌在 token 后、与原括注共用收尾（`））`）」：无本仓先例，形态自定——供评审定形。
- 读数面：§2.12 末句「本域悬空三项……清账随各自批次」按 §1.8 裁定归本批清账（本块即其落盘）；悬空 7 / 行宽 18 以 §1.8 + 本块读数为准。

**§2.16 修复轮 #82（设计评审 §3 轮次 2 新 17 / 18 / 19 / 20 · 逐号 1–4 · 依 §1.10 裁定 · 修后为准）**

**任务面**：射程 = 四条收正 + 三条随动（§2.2(e) 两行 · §2.2(f) 一行 · §2.4 U88 行）；零用例号新增（U88 = **扩臂**）· 零代码面 / 需求档 / 他批档触碰。落点 = `docs/desktop/design/IPC.md` §1 就地改四处（`:14` / `:21` / `:23` / `:28` 一行拆四行 + `:33`）+ 档尾变更记录两行；批档面以本段收正（同 §2.11 优先级先例）。

**① 号 1 —— `IPC.md` 单源面落形（`:14` / `:21` / `:23` 就地改）**

- `:14` `ev:activity` 产出方 = **三面全列**：`callbacks.onAgentTurn`（实读 `thincoder-core/agent.mjs:229`——每轮无条件）· `callbacks.onToken` 内联 `⟦ev⟧` 事件（`thincoder-core/agent/dispatch.mjs:301`；`done` / `stopped` 发射点 `thincoder-core/agent-tools/async-settle.mjs:275` / `:239`）· 宿主结算（`thincoder-desktop/src/main/agent-host.mjs`（拟新增））。
- `:21` `ev:error` 产出方 = **宿主结算拒绝分支**（非 abort——同档（拟新增）面）；语义列原文「工具错误 / 回合错误」**不动**（守 `UI.md:19`「错误卡 = 回合级错误块（工具级错误 = 工具块 `status=\"error\"`）」双支表述），加尾注「工具级错误 = 工具块 `status=\"error\"`（**不经本通道**）」。
- `:23` 映射句补「逐条带实读坐标，宿主面 = `agent-host.mjs`（拟新增）」+「`ev:activity` 三形判别单源 = 载荷键集段（同本档）」⇒ 单源面成立。
- 随动收口（残项）：§2.2(c) 表尾行事件名括注含 `error` —— 核内 `⟦ev⟧error` / `ev:error` **零发射点**（全核 grep 零命中），该名不入内联闭集（八名 `turn` / `queued` / `async` / `settled` / `stopped` / `done` / `cancelled` / `approval`）；「表尾三行以 §2.11 ③ 为准」已覆盖，本行补明闭集无 `error` ⇒ `ev:error` **生产者唯一** = 宿主结算拒绝分支。

**② 号 2 —— `ev:activity` 三形 + 双生产者判别（`IPC.md:28` 拆四行 · §2.2(e) 随动 · U88 扩臂）**

- 三形写死：`{ key, event: \"turn\", n, max }`（宿主回合起——`onAgentTurn`；**无 `fields`**）· `{ key, event, fields }`（内联形——`⟦ev⟧` 事件族，`fields` = `\x1e` 分隔原样；事件名表外仍进本通道，不丢）· `{ key, event: \"done\" }` ∥ `{ key, event: \"stopped\" }`（宿主结算——**无 `fields`**）。
- **判别（写死）**：`fields` 键在场 ⇒ 内联形（子代理 / 池条目面——**零回合尾**、不作回合起）；无 `fields` 的 `done` / `stopped` = **宿主结算面**（**唯一回合尾**）。
- 随动（§2.2(e) 两行收正）：标题行触发集 = **宿主结算形 `done` / `stopped`**（原文「（`settled` / `done` / `stopped`）」**被取代**——`settled` 与内联同名形零触发）；回合态行「`⟦ev⟧turn`」收正为「`ev:activity` `turn`（`onAgentTurn`）——`⟦ev⟧turn` 仅 `depth>0`，不作回合起」（同 §2.11 ③）。
- U88 = **扩臂**（不新增用例号）：四组置清改由宿主结算形驱动 + 新增反例臂「**内联形 `done`**（子代理 / 池 settle）⇒ `tabBadges` **不清** ∧ `sessions:list` 零重调」。

**③ 号 3 —— `pool.blocks` 键映射（随动 §2.11 ⑦）**

- 消费键复名（实读 `thincoder-desktop/renderer/views/activity.mjs:113-114`：`:113` 读 `block.status` · `:114` 读 `block?.tool`）↔ 块形（§2.2(e) 行 1：`{ kind:\"tool\", id, name, argsSummary, status }`）映射：**`tool` ← `name`**（工具名——D4 名在场）· **`status` ← `status`**（状态码域单源 = `thincoder-desktop/renderer/views/chat-tool.mjs:19-25`）；入 / 清点与读数刷新同点（§2.11 ⑦ 原文不动——本行补键映射，§2.11 ⑦ 面以本段为准）。

**④ 号 4 —— §2.2(f) 字面被取代**

- §2.2(f) 的 `historyWindow(history, before, 200)` 字面 = **被取代**：`pageSize` 不传（核缺省 200 条 = 单源）∧ 核窗界常量由宿主 `import`（零字面量）——与同节 `pageSize` 行 / §2.11 ⑫ / `IPC.md` §2 页游标注段同值化。

**落盘后读数（#82 复跑）**：命令 = `cd thincoder && node scripts/doc-check.mjs` ⇒ 悬空 **7** · 行宽 **18** · 拟新增 **37 → 40**（+3 = `IPC.md:14` / `:21` / `:23` 宿主面「（拟新增）」三处入册）· 注记豁免 43 · 迁移期引文 215（皆不变）。本批四档行宽零新增（`IPC.md` 改动行全 < 300）。行位移：`:28` 一行 → 四行 ⇒ 其后 +3（`ev:error` 载荷行 = `IPC.md:36` · 页游标注段 = `:66-67`·白名单面段 = `:67-72` 不变）。

**本段为准**：凡 §2 内与本段涉及的 `IPC.md` 四处（`:14` / `:21` / `:23` / `:28` 面 + `:36` 载荷行）及三条随动（§2.2(e) 两行 · §2.2(f) 一行 · §2.4 U88 行）相异者，一律以本段为准。

**§2.17 修正轮 #91（实施后修正轮 · 依 §1.16 派单 · 逐号 1–12 · 修后为准）**

**任务面**：射程 = §1.16 派单逐条（六新档登记 / 档数 / 去标 / `SHELL.md` §1 树 / U96–U97 凭据行 / `shape` 值域 / §1.13 + §1.14 设计面落形 / 两舱 advisor 议题裁定）+ §1.14「设计档随动」四项（`SHELL.md` §4 项 1 口径 · §2.2(b) · §2.3 文件表 · §2.8 端差清单）。零代码面 · 零需求档 · 零他批档触碰；设计档之笔在本席（沿 §1.11 裁定）。落点 = `docs/desktop/design/` 五档（`PROJECT.md` / `SHELL.md` / `IPC.md` / `RENDERER.md` / `UI.md`，含各档尾变更记录行）+ 批档面本段（append 收正，沿 §2.11 / §2.16 优先级先例）。**编号注**：本段号 ①–⑫ 为段内自编号（与 §1.16 行序非一一对应）——对齐以本段标题为准。

**① 六新档登记（三面同源）**

- `PROJECT.md` §4.1 增四行：`agent-bridge.mjs` **79**（`:89`）· `suspensions.mjs` **76**（`:90`）· `session-io.mjs` **37**（`:91`——三档自 `agent-host.mjs` 拆出）· `events-subscribe.mjs` **61**（`:104`——自 `events.mjs` 拆出）；`agent-host.mjs` 行（`:88`）去「（拟新增）」改实读 **203** 并记三出档。
- `test/` 行（`:120`）补两共享助手注（`fake-dom.mjs` **217** · `slot-sandbox.mjs` **25**——非清单档）；用例模块行（`:121`）补 `session-io`。
- `SHELL.md` §1 树：`src/main/` 块（`:22-25`）与 `renderer/` 块（`:36`）补四新档行 + `agent-host` 行记三出档；`test/` 行（`:43-45`）两测试档（`test/session-io.test.mjs` · `test/slot-sandbox.mjs`）入名列 / 助手注。
- 拆档背景 = 触 300 层落形（§1.14 ③ 授权 · `agent-host.mjs` 拆前实读 **296**——§1.14 ③ 记 295 = 换行计法差 1，触线结论不变；`events-subscribe.mjs` = 渲染侧订阅面出档）。

**② 档数收正（十九档）**

- 三处值改：`SHELL.md:43-44`（树 `test/` 行 十七 → 十九档 + 名列补 `session-io` / `events-page`）· `PROJECT.md:121`（用例模块行 十九档——名序与值列 = `test/files.mjs` 现值**同序同值**）· `PROJECT.md:128`（在册例外行「清单十七档」→ 十九档）。
- 随动值：`PROJECT.md:127`（300 层段：`views-locks` 实读 **110**）；变更行登记 = `PROJECT.md:316`（同段 `:315` 计数词收正：去「六」——回填列值以括注枚举为准，D3）。
- 判据单源 = `thincoder-desktop/test/files.mjs`（十九名与值 · 权威）；行数口径 = 「文末换行不计」（见 ⑫）。

**③ 去标（十五处）**

- 面分布：`IPC.md` 3（`:14` / `:21` / `:23`）· `SHELL.md` 6 · `PROJECT.md` 4 · `RENDERER.md` 2 —— 共 **15 处**「（拟新增）」去标（所标档已落盘 ⇒ 标记失效）。
- 机器对账：doc-check 拟新增读数 **40 → 25**（−15 ✓，见 ⑫）；派单记「13 处」= 父侧估数，实读 15。
- 余标记 = 未来批面，不动：`PROJECT.md:82` / `:96` / `:117` / `:118` / `:129` / `:158`（`electron-builder.yml` · `settings.mjs` ×2 · `onboarding.mjs` · `tabbar.mjs`）· `SHELL.md:15` / `:30` / `:41`。
- 记录面历史行内「（拟新增）」照留不改（先例 = `SHELL.md:103` 等档尾变更记录）。

**④ `SHELL.md` §4 落形（§1.13 / §1.14 设计面）**

- 项 1（`:81`）：装配取槽 = provider / 模型 / 档位 / 工程模式**槽值优先**（槽缺 ⇒ 新建形）；**`effort` 无槽字段 ⇒ 回退 config `provider.reasoningEffort`**（坐标 `thincoder-desktop/src/main/session-slots.mjs:112`）。
- 项 4（`:84`）：回合尾落盘 = 三路终局（done / stopped / error）同序 `saveAgentSlot`，**先落盘再出终局事件**（坐标 = `thincoder-desktop/src/main/session-io.mjs`）。
- 项 5（`:87-88`）：挂起表供给已落——唯一持有点 `promptId → { kind, key, resolve }` · verdict 闭集两套 · 表清两时点。

**⑤ `PROJECT.md` / `UI.md` / `RENDERER.md` 落形（清点口径与留白登记）**

- §10 增 K / L / M 三行（`:256` / `:257` / `:258`）：池切片窗限 / 归档 **open** · `ev:tool-result` `subKey` 消费面**留白** · `ev:question` 作答通道（出站已落 · 作答归台账 #410）。
- §10 J 行（`:255`）**已订正**：`effort` 回退 config · `autoApprove` / `engineering` = 布尔槽（`ON`/`OFF` 词形）槽值优先（报明 = §5.8）；变更行 = `:317`。
- `UI.md:29` / `:37`（§2 项 4 / 项 1：池窗限 open + 清点口径 = 全量在场）· 变更行 `:77`；`RENDERER.md:32`（§1.1 池切片清点口径条：`ev:tool-call` 入 · `ev:tool-result` 只收束 ⇒ 收束不摘除）· 变更行 `:95`。

**⑥ §2.2(b) 收正（批档面 · 原字面被取代处）**

- 装配序：第 6 与第 7 步之间插**取槽装载**——`loadAgentSlot`（取槽值面：provider / model / 档位 / 工程模式 / history 全取槽；槽缺 ⇒ 新建形）**+ `_slot` 重钉**（`applySession` 按切换语义清 `_slot` ⇒ 不重钉则多标签 / 跨端切槽后本键回合落错槽；两入口 = 新建装配 `thincoder-desktop/src/main/agent-host.mjs:103` · 既有槽装载 `thincoder-desktop/src/main/session-io.mjs:26`）。
- 回合尾：`saveAgentSlot` 三路（done / stopped / error）同序、**先落盘再出终局事件**；落盘失败 = **静默不抛**（恰一行 stderr）。
- 实现层替换：§1.14 ① 字面 `resumeSlot` ⇒ **实落 `loadSlotFile`**（理由：`resumeSlot` 槽面副作用三项〔认领写 / end-marker 写 / GC 调度〕对桌面已知槽号为错——`thincoder-core/session-lifecycle.mjs:43-46`）。
- 签名 `send(key, text)` / `interrupt(key)` = 单源 §2.11 ⑨（不重述）。

**⑦ §2.2(d) `shape` 值域对齐（批档面）**

- `shape` 值域 = **`"single"` ∥ `"batch"`**（权威 = `IPC.md:18`；实锤 = `thincoder-desktop/src/main/suspensions.mjs:33`（`shape:"single"`）· 渲染面同值 = `renderer/views/approval.mjs` 的 `SHAPE_ACTIONS`）——§2.2(d) 原字面 `"item"` **效止本段**。

**⑧ §2.3 表收正（单一权威源 · 批档面）**

- §2.3 受影响文件表：行数与落形**以 `PROJECT.md` §4.1（#91 收正后）为单一权威源**——表内 8a 三档行（`agent-host` / `events` / `mount-pool`）与 `test/files.mjs` 行「14 → 17」**皆被取代**（实态 = 四源新档 + 两测试新档，见 ①）；判据 = `test/files.mjs` 十九档。

**⑨ §2.8 端差在册（本批零随动）**

- §2.8 项 2 端差三（MCP 连接 · `attachManifest` · `validateProvider` 消费方式）**在册不变**；`validateProvider` reason 不分档 = §5.8 在册非阻塞（**只报**，设计面不动作）。

**⑩ §2.4 表尾续行 + §2.9 映射（批档面补行）**

| U# | 用例名 | 面（输入） | 断言（期望） | 档 |
|---|---|---|---|---|
| U96 | 槽装载取真值 | 真槽文件 + 装配入口两处 | 取槽值（provider / model / 档位 / 工程模式 / history——非 config 缺省）· `_slot` = 本键槽号（重钉）· 槽缺 / 异 cwd ⇒ `false` 且**零盘面副作用**（异 cwd 档原地保留） | session-io |
| U97 | 回合尾落盘 | 真回合三路 + 失败臂 | 三路皆 `saveAgentSlot` · **先落盘再出终局事件**（断言非恒真——探针证）· 失败 ⇒ 不抛 ∧ 恰一行 stderr | session-io |

- §2.4 标题「U76–U95」**效止**（改读 U76–U97）；§2.9 映射补两行：U96 → 条目 2（装配段）· U97 → 条目 4（回合驱动）；用例档 = `thincoder-desktop/test/session-io.test.mjs`（实读 110——文末换行不计）。

**⑪ 只报清单（只报不动）**

- `cwd` 空串 TypeError（§5.8 在册非阻塞）：记于 `thincoder-desktop/src/main/session-slots.mjs:68`，现盘 `:68` 为注释行——站点疑位移（`process.cwd()` 读取点现 `:59`）；记录面历史不追改。

**⑫ 读数与口径（#91 落盘后）**

- **行数双口径**（在册 · 非矛盾）：设计档（`PROJECT.md` §4.1）= **文末换行不计**（沿批 3 先例）；§5 读数 = **含末行** ⇒ 同档差恒 1——`agent-host` **203 / 204** · `agent-bridge` 79 / 80 · `suspensions` 76 / 77 · `session-io` 37 / 38 · `test/session-io.test.mjs` 110 / 111。
- doc-check（命令 = `cd thincoder && node scripts/doc-check.mjs`）：候选 **25826**（上跑 25820）· 悬空 **32**（±0——全为域外 / 迁移期列报项，**桌面域非豁免悬空 = 0**）· 拟新增 **40 → 25**（−15）· 注记豁免 43 · 迁移期引文 216（±0）。行宽 = 上跑 **18**（本跑尾部输出截断未读到 = **unverified**；本批四档改动行全 < 300）。
- 两舱 advisor 议题处置：`pool.blocks` 清点 = **全量在场**（收束不摘除——落 `RENDERER.md:32` / `PROJECT.md` §10 K / `UI.md` 项 1）· 窗限 / 归档 = **open**（K 行）· `subKey` 消费 = **留白**（L 行）· 三条在册非阻塞维持（`dispose()` 零生产调用者 · `cwd` 空串 TypeError · `validateProvider` reason 不分档——只报）· 记录面坐标漂移见 ⑪。

**本段为准**：凡 §2 内（§2.1–§2.16 全部块）与本段涉及之点（§2.2(b) 装配序 · §2.2(d) `shape` 字面 · §2.3 表行数落形 · §2.4 用例面与标题 · §2.8 端差项）相异者，一律以本段为准。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象：批档 §2（七条目契约 / 逐面契约 / 四档落点 / U76–U95 / 键面补遗 / 两补正）↔ 设计锚（`IPC.md:25`/`:29`/`:39`/`:40`/`:51` · `SHELL.md:22`/`:73` · `RENDERER.md:29`/`:30`/`:44`/`:52`/`:71` · `PROJECT.md:88-89`/`:94`/`:99-100`/`:116-117`/`:126`/`:248-251`）。

**证据面（本轮实读核码）**：锚行全部在位；受影响文件表现行行数抽检全对（`ipc.mjs` 100 · `preload.cjs` 31 · `main.mjs` 83 · `session-slots.mjs` 83 · `app.mjs` 297 · `views/chat-scroll.mjs` 90 · `test/files.mjs` 9 · `test/host-floor.test.mjs` 123）；`preload.cjs:13-17` 白名单现盘**十项**（与 §1.5 同）；`make-agent.mjs` 装配序（:25-:138）与 §2.2(b) 1–7 逐项对得上；`agent/setup.mjs:163-170`/`:173`、`dispatch.mjs:264`/`:281-289`/`:301`/`:303`/`:399`/`:445`、`⟦ev⟧` 事件名闭集（turn/queued/async/settled/stopped/done/cancelled/approval）均与 §2.0/§2.2(c) 一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/Contract | 🔴 | 审批载荷 `shape` 值域与锚不一致：§2.2(d)（批档 :135）逐项门 `emit("ev:approval", { …, shape: "item", … })`；锚 `IPC.md:18`（`:25` 复指「定形 = 本表该行」）= `"single"` ∥ `"batch"`；消费面 `renderer/views/approval.mjs:25-36`（`SHAPE_ACTIONS` 键 = single/batch）+ `:41-43`（表外形 ⇒ `null`）⇒ `approvalExits` 回 `null` ⇒ **卡面与池面零出口按钮**、`verdictOfKey` 恒 `null`（键位零动作）；U84/§2.4 会把该值写进断言 | 把 §2.2(d) 与 U84 的 `shape` 值改为锚定值 `"single"`（改值域则须同改 IPC.md 与消费面 —— 不建议） |
| 2 | Requirements/Contract | 🔴 | 批形 `batch.tools` 形态与锚不一致：§2.2(d)（:136）= `batch: { count, tools: [{ name, argsSummary }] }`；锚 `IPC.md:18`（:25 复指）= `tools` = **工具名数组**；消费面 `approval.mjs:80-83`（`hasText` 非串滤除）⇒ 对象项**全滤空** ⇒ 批形卡面/池面**工具名清单消失**、`batchCount` 回落清单长 0 | 按锚发射工具名串数组；若确需逐工具参数摘要，须在 `IPC.md` 增键并同步消费面（单一权威面） |
| 3 | Feasibility/Requirements | 🔴 | 回合边界信号在 depth 0 不存在：`⟦ev⟧turn` 仅 `depth > 0` 发射（`thincoder-core/agent.mjs:224-226`）；`settled/done/stopped/cancelled` 皆池条目/子代理面发射（`agent-tools/async-settle.mjs:273`/`:275` · `subagent.mjs:374` · `consult.mjs:249`）；核已有结构化回调 `callbacks.onAgentTurn(frame.turn, frame.maxTurns)`（`agent.mjs:229`，每轮无条件；VSC 顶层逐轮帧即用它 —— `thincoder-vscode/src/extension/panel-callbacks.mjs:170`）**未入 §2.0 回调面**。⇒ §2.2(e) 回合态（`tabBadges` running/done 置清，:146）、标题刷新触发（:147）、回合态写者三处无输入 ⇒ §1.5 所列 S1 诚实形不可接通；U82「九回调 → 九通道」、U88 的 `⟦ev⟧turn` 输入面与实际核不符 | 把 `onAgentTurn` 纳入回调面并定义回合起/尾事件的发射点与载荷（核回调 ∨ 宿主 run 结算），U82/U88 输入面按实收正 |
| 4 | Requirements | 🔴 | `ev:error` 无生产者映射：锚 `IPC.md:21` 产出方 = 主循环错误分支，但 §2.2(c) 桥表无该行、§2.2(d)（:139）只 `run(...)` + `finally` 清 controller，未定义拒绝路径（AbortError/ContinueError/provider 错误 —— 先例 `thincoder-cli/src/tui/agent-turn.mjs:162-258`；核 `dispatch.mjs:457` abort 重抛）⇒ 错误卡面无供给 + 未处理拒绝面；§2.2(c)「回合事件（… / `error`）」行在核内无 `⟦ev⟧error` 发射点（闭集 :128 亦不含 `error`）；§2.0「回调面九签名」实为 8 回调 + `agent.autoApprove` 字段（:64-72） | 补「run 结算/拒绝 → `ev:error`（中断 ⇒ stopped 分流）」映射行 + 一条假 `run` 拒绝用例；收正「九回调」计数 |
| 5 | Document ownership | 🔴 | 白名单成员域两处描述不同：`IPC.md:51`「渲染 → 主请求通道 = **本节表列全部**（13 项）」；§2 表实列 **26** 个请求通道名（13 行 —— `IPC.md:37-49`，含 `config:write` / `provider:*` / `mcp:*` / `model:list` / `settings:agent` / `memory:status` / `ledger:read` / `batch:status` 等未实给面），而批档 §2.2(a)（:95）与 U77（:198）的 13 = 现盘十项（`preload.cjs:13-17`；U74 断言 10 —— `test/host-floor.test.mjs:105-108`）+ 三新行 | 该句改为「白名单 = **已实给** 13 项（现有十项 + `msg:send` / `msg:interrupt` / `history:page`）；§2 表其余通道随各自批次入册」或直接枚举 13 项 |
| 6 | Clarity | 🟡 | 随动断言面只列 U74：`test/host-floor.test.mjs:80-88`（U13 `deepEqual([...CHANNELS], [十项…])`）同样锁白名单内容 ⇒ 10 → 13 必红；U74 计数括注「数据面四项 + 会话族五项 + 审批出口一项」（:87）亦须随动 | 该行随动面（§2.3 / §2.5 ④）补 U13 与 U74 括注计数两项 |
| 7 | Requirements | 🟡 | §2.2(e) 值面写者表（:143-150）无 `pool.approvals` 行（正文 §1.2③ / §2.1 条 6 有）；且 `pool.running` / `pool.approval` 两读数（消费面 `views/activity.mjs:50-51`，非数 ⇒ 零节点）无写者、无用例断言 —— §1.5（:31）明列「审批正例读数」为本批应接通项 | 补写者行（`ev:approval` ⇒ 切片 + 两读数；出站 respond ⇒ 递减）与一条机检断言，或显式登记为不做 |
| 8 | Clarity | 🟡 | `ev:question` / `ev:task` 渲染面写者缺：§2.2(e) 表无行、U87–U90 无断言，而 §2.2(g)（:163）声明 `attachEvents` 订阅九通道、`test/events-reduce.test.mjs` 描述为「九通道归约」（:182） | 补两行写者（或明写「本批订阅但不写切片（登记）」），用例档描述按实收窄 |
| 9 | Clarity / Doc hygiene | 🟡 | host 面方法签名两形并存：§2.2(b)（:99）`send(text)` / `interrupt()` 与 §2.2(d)（:139）`send(text)` 无 `key`；补遗键面收束（:271）为 `send(key, text)` / `interrupt(key)`（并自称单一权威），通道载荷 `{ key, text }`（`IPC.md:40`） | 就地收正 §2.2(b)/(d) 签名行，规范面只留一形（旧形留记录面） |
| 10 | Doc hygiene | 🟡 | 三处失效表述仍留规范面、补正只在段末并存：§2.5 行 7（:261）「T-DSK17 · T-DSK19」已被补遗（:272）改指 T-DSK17/18/19；§2.10 末行（:267）「四档随动…评审通过后落形」已被闸态补正（:279）改写；补遗随动行（:274）「`SHELL.md` §1 树（`agent-host.mjs` 去标记…）」已被标记补正（:277）改写 | 三处就地改（改指 / 改态），补正文字与轮次历史只留记录面 |
| 11 | Clarity | 🔵 | `ev:tool-result` 的 `ok` 无生产规则：核回调只传结果串（`agent-tools/dispatch.mjs:445` · `:376`），核内既有约定 = `!String(result).startsWith("Error:")`（`dispatch.mjs:370` / `:422` / `:428` / `:440`）但未落单源；U82 按 §2.2(c) 键集断言 | 在 §2.2(c) / `IPC.md:25` 键集段写明 `ok` 判据串（与核约定同源） |
| 12 | Clarity | 🔵 | `history:page` 游标分支未定：「窗口内可视条目为 0 ∧ `hasOlder` 真」时核回 `messages: []`（`thincoder-core/history-window.mjs:109`/`:178`），§2.2(f)（:156）只给「`next` = 本页首条全局 `idx`；`hasOlder === false` ⇒ `next = null`」，U90（:211）断言 `next === null ⇔ hasOlder === false` ⇒ 该分支落 `undefined` | 补「零消息页」口径（推进游标 ∨ 明写取值）并加一例 |
| 13 | Note | 🔵 | 数值不一致：`PROJECT.md:117` 三新档预算 `~300 / ~200 / ~150` vs §2.3（:181-183）`~200 / ~180 / ~120`（取前值则 `agent-host.test.mjs` ~300 恰贴「300 行 = 主动拆分层」⇒ 应带拆分预案） | 取一为准并同步两处 |
| 14 | Note | 🔵 | 引用行号失准：U91（:212）「键集 = `views/activity.mjs:108-125` 读取集」实指活动块/队列条目读取（`activity.mjs:108-126`）；审批条目读取在 `:96-106` + `views/approval.mjs:80-99` | 锚点改指审批条目读取处 |
| 15 | Note | 🔵 | 两处标注随动缺：`test/host-floor.test.mjs` 未标现行行数（写「批内首步实读」，而 `PROJECT.md:117` 已给 123；实测 123 + ±10 无层问题）；`PROJECT.md:83` `main.mjs` 预算 `~80` 未随本批 +~45 动（§2.3 :174 列 83 → ~128） | 直填现行行数；§4.1 该行预算随动 |

计数：🔴 5 · 🟡 5 · 🔵 5（共 15 条）
VERDICT: changes-required

### 轮次 2（评审子代理）

**§3 轮次 2（评审子代理）—— 核十五条修复 + 九项清账 + 新引入面**

对象：批档 §2.11–§2.15 修复主张 ↔ 设计档实改面（`IPC.md` 载荷键集段 / 页游标注段 / 白名单面段 · `PROJECT.md` §4.1 两行 · `RENDERER.md` / `SHELL.md` 各四处）+ 消费面与核实读坐标。
本轮实读（全新）：批档全文 · 四档全文 · `renderer/views/approval.mjs` · `renderer/views/activity.mjs` · `test/host-floor.test.mjs` · `renderer/views/chat-tool.mjs` · 核 `agent.mjs` / `history-window.mjs` / `agent/dispatch.mjs` / `agent-tools/async-settle.mjs`。

**结论**：前轮十五条**全部已消**（五条 🔴 两侧同值逐一成立）；#80 九项清账结构面到位（六拆 + 三标；读数 7 / 18 为批档自报——本轮无 bash 未复跑）；新引入 = 🔴 0 · 🟡 3 · 🔵 1。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批档 §2.11 ① / `IPC.md:18` / `views/approval.mjs` | 🔴 | Fixed | ①「逐项门 emit：`emit("ev:approval", { key, promptId, shape: "single", tool, argsSummary })`」· IPC.md:18「`shape` = `"single"` ∥ `"batch"`」· 消费面 `approval.mjs:42`「`return Object.hasOwn(SHAPE_ACTIONS, shape) ? SHAPE_ACTIONS[shape] : null`」（表键 :26 `single` / :31 `batch`）⇒ 两侧同值 ✓ |
| 2 | 2 | 批档 §2.11 ② / `IPC.md:18` / `approval.mjs:80-83` | 🔴 | Fixed | ②「`tools` 逐项为**串**，与门内清单同序同值」· IPC.md:18「`tools` = 工具名数组」· 消费面「`return Array.isArray(tools) ? tools.filter((name) => hasText(name)) : []`」⇒ 归锚形 ✓ |
| 3 | 3 | 批档 §2.11 ③ / 核 `agent.mjs:229` | 🔴 | Fixed | ③「回调面 = **九回调 + 一字段**：…**`onAgentTurn(turn, maxTurns)`**（第九）…坐标 = `thincoder-core/agent.mjs:229`（每轮无条件调用）」；核实读 `agent.mjs:229`「`callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)`」· `:224`「`if (depth > 0 && callbacks.onToken) {`」⇒ 起（onAgentTurn）/ 尾（宿主 run 结算）发射点成对 ✓（判别面残留见新 2） |
| 4 | 4 | 批档 §2.11 ④ / `IPC.md:21` | 🔴 | Fixed | ④「resolve ⇒ `emit("ev:activity", { key, event: "done" })`；拒绝 ∧ `signal.aborted` ⇒ `…"stopped"`；拒绝 ∧ 非 abort ⇒ `emit("ev:error", { key, message: String(err?.message ?? err) })`」+ U86 三臂 ⇒ `ev:error` 有生产者；「九回调」计数已按实读收正 ✓（载荷单源面见新 1） |
| 5 | 5 | 批档 §2.11 ⑤ / `IPC.md:67-72` | 🔴 | Fixed | IPC.md:67「白名单 = **已实给 13 项**」· :69 既有十项（第 10 项 = `approval:respond`）· :70 三新（序 = `history:page` · `msg:send` · `msg:interrupt`）· :71「本表其余通道…随各自批次入册」⇒ 与 §2.11 ⑤ 同列同序，作用域句收正 ✓ |
| 6 | 6 | 批档 §2.11 ⑥ / `test/host-floor.test.mjs:80-88` / `:108-109` | 🟡 | Fixed | ⑥ 点名 **U13 + U74**：U13「`assert.deepEqual([...preload.CHANNELS], [十项…], "白名单 = 十项（数据面四项 + 会话族五项 + 审批出口一项 · 顺序锁定）")`」（:80-88 · 括注 :87）· U74「`assert.equal(channels.length, 10, …)`」（:108）+ 末位（:109）⇒ 随动面补全 ✓ |
| 7 | 7 | 批档 §2.11 ⑦ / `views/activity.mjs:24-25` / `:50-51` | 🟡 | Fixed | ⑦：`pool.approvals` 写者 + 两读数定义 + U91/U92 补臂；消费面 `readingOf`（:25「`(Number.isFinite(value) ? value : null)`」）· 读者（:50-51）· 状态码域 `chat-tool.mjs:19-26`（`STATUS_WORD` 含 `running`）✓（键集残留见新 3） |
| 8 | 8 | 批档 §2.11 ⑧ | 🟡 | Fixed | ⑧「归约面口径 = **九通道订阅 · 七通道写切片**」+「`ev:question` / `ev:task` 订阅在场、不丢」+ 用例档描述随动 ✓ |
| 9 | 9 | 批档 §2.11 ⑨ | 🟡 | Fixed | ⑨「§2.2(b) 导出面 = `{ ensure(key, slot), send(key, text), interrupt(key), … }`；§2.2(d) 内文同步」⇒ 与 §2 补遗「键面收束」/ IPC.md:50 载荷同形 ✓ |
| 10 | 10 | 批档 §2.11 ⑩ | 🟡 | Fixed | ⑩ 三处逐条收正（§2.5 行 7 = T-DSK17/18/19 · §2.10 末行改态 = 评审轮次 2 · 补遗留档行标记保留）；append-only 面以 §2.11 优先级声明（:313「凡 §2 内…一律以本节为准」）收 ⇒ 规范效力单源 ✓ |
| 11 | 11 | 批档 §2.11 ⑪ / `IPC.md:31` | 🔵 | Fixed | IPC.md:31「`ok = !String(result).startsWith("Error:")`…实读 `thincoder-core/agent/dispatch.mjs:370` / `:422` / `:428` / `:440`」——四坐标逐一实读成立（:370 `const routedOk = !String(routed.result).startsWith("Error:")` 等）✓ |
| 12 | 12 | 批档 §2.11 ⑫ / `IPC.md:61-65` | 🔵 | Fixed | ⑫「`end = before == null ? 源历史条数 : Math.max(0, Math.min(before, 源历史条数))` · `next = Math.max(0, end − HISTORY_PAGE_SIZE)`」= 核 `history-window.mjs:111`/`:112` 同式；`:24`「`export const HISTORY_PAGE_SIZE = 200`」；`:178`「`return { messages, hasOlder: start > 0 }`」⇒ 零消息页分支收口 + U93 加臂 ✓ |
| 13 | 13 | 批档 §2.11 ⑬ / `PROJECT.md:117` | 🔵 | Fixed | PROJECT.md:117 三值 = `~200 / ~180 / ~120`（与 §2.3 表 `test/agent-host`/`events-reduce`/`history-page` 同值）✓ |
| 14 | 14 | 批档 §2.11 ⑭ / `views/activity.mjs:96-106` | 🔵 | Fixed | ⑭ 锚改指：`activity.mjs:96-106`（`approvalItemNode` 读 `promptId` / `approvalTitle` / `approvalExits`）+ `approval.mjs:79-99` ⇒ 键集 = `promptId` · `shape` · `tool?` · `argsSummary?` · `batch?` 零新键 ✓ |
| 15 | 15 | 批档 §2.11 ⑮ / `PROJECT.md:83` | 🔵 | Fixed | PROJECT.md:83 = **~128** ✓；`test/host-floor.test.mjs` 实读 **123** 行 ✓（§2.3 该行 :210 仍书「（批内首步实读）」⇒ 以 ⑮ 为准 · append-only 面） |
| 16 | #80 | 四档 | 🔵 | Fixed | 结构面抽检：① `IPC.md:110-111`（断「；」后）· ② `PROJECT.md:302-304` · ③ `RENDERER.md:29-30` · ④ `RENDERER.md:90-91`（含「（拟新增）」）· ⑤ `SHELL.md:39-40` · ⑥ `SHELL.md:104-106`；三标 = RENDERER.md:72 嵌式「（拟新增））」· RENDERER.md:90 · SHELL.md:80「（拟新增 · 唯一持有点）」⇒ 九项在盘；读数 7 / 18 未复跑（批档自报） |
| 17 | new | `IPC.md:14` / `:23` / `:28` / `:33` | 🟡 | New | ③④ 未落 IPC.md §1：(a) :23「本表第三列 = 「核回调 → IPC 通道」逐条映射（单源）」但 :14 产出方仍只列「`callbacks.onToken` 的 `⟦ev⟧` 内联事件」（缺 `onAgentTurn` 行）；(b) :28「`ev:activity { key, event, fields }`」vs ③ 的「`ev:activity { key, event: "turn", n, max }`」（无 `fields`）与结算两形——同一事件名两形；(c) :33「`ev:error { key, …错误字段原样 }`」vs ④ 的「`{ key, message: … }`」 |
| 18 | new | 批档 §2.11 ③（:332-333）/ 核 `async-settle.mjs:275` / `:239` | 🟡 | New | `done` / `stopped` 双生产者同名未定判别：③「回合尾 = 宿主 run 结算 ⇒ `ev:activity { key, event: "done" }` ∥ `{ key, event: "stopped" }`」+「清 = 回合尾；标题刷新…= 回合尾 `done` / `stopped`」；而核回合中经「`ctx?.callbacks?.onToken?.(\`${entry.relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e\`)`」（:275；:239 `⟦ev⟧stopped`）同事件名入 `ev:activity`（§2.2(c) 内联行 = `{ key, event, fields }`）⇒ 归约器按裸名判「回合尾」会在子代理 / 池 settle 时误清 `running` 并误刷 `sessions:list`（U88 无该臂） |
| 19 | new | 批档 §2.11 ⑦（:359）/ `views/activity.mjs:113-114` | 🟡 | New | ⑦ 新增「`pool.blocks` 写者 = §2.2(e) 行 1 同源（入 / 收束同点…）」未定条目键集：消费面读 `{ tool, status }`（:113「`"data-status": word === null ? undefined : block.status`」· :114「`labelNode([block?.tool, word])`」）而 §2.2(e) 行 1 的块形 = `{kind:"tool", id, name, argsSummary, status}` ⇒ 同源 ≠ 同形；直用则池面活动块无工具名（D4 要求名在场） |
| 20 | new | 批档 §2.2(f)（:186-187） | 🔵 | New | 残留字面：同节两行并存——「`historyWindow(history, before, 200)`」（:186）vs「`pageSize` **不传**（核缺省 200 条 = 单源）」（:187），且 ⑫ / IPC.md:64 为「宿主 `import`，零字面量」（§2.11 优先级已覆盖 ⇒ 非阻塞） |

计数：前轮 **15/15 已消**（🔴 5 归一两侧同值 · 🟡 5 · 🔵 5）· #80 九项到位 · 新引入 **🔴 0 / 🟡 3 / 🔵 1**

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-25 22:17「你直接自己跑完吧」授权）

- **三条件齐备**：① 设计评审 = **通过**（轮次 1 = changes-required（🔴 5）→ 修复 **#79**（15/15）→ 清项 **#80**（9/9 · 读数回 7/18）→ **轮次 2 = pass**（15/15 核销 · 新 🟡3 / 🔵1）→ 修复 **#82**（4/4：`IPC.md` 单源面落形 · `done`/`stopped` 判别式 + U88 反例臂 · `pool.blocks` 键映射 · §2.2(f) 残留字面取代））；② 修复主张经父侧核验（五条 🔴 **两侧对照**读毕 · `IPC.md` §1 单形单义 · 门 = **悬空 7 / 行宽 18** 基线同值）；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审轮次 1 + 轮次 2（§3）· §1.6–§1.10 · §2.11–§2.16（**修后为准**）。
- **批准射程** = §2 十节 + §2.11–§2.16「修后为准」全部条目（**E-1…E-7** · **U76–U95** · 受影响面 + 新档 3）；**不含**：设置 / 首启 · 打包 · 台账族在册项（#396–#408）· **核侧改动**（只消费）。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）

### 5.1 实施面（改动档 + 拆分登记）

- **拆档（300 行触发层落形，单向 import 无环）**
  - `renderer/events.mjs` 293 → **295**（归约核心）拆出 **`renderer/events-subscribe.mjs`（61）**——九通道表 · `attachEvents` · 回合尾标题刷新；import 方向 `events-subscribe → events`。
  - `test/events-reduce.test.mjs` 160 → **162** 拆出 **`test/events-page.test.mjs`（172）**。
- 其余改动档：`renderer/app.mjs`（297）· `renderer/mount-pool.mjs`（36）· `renderer/views/chat-scroll.mjs`（91）· `renderer/store.mjs`（205，**仅注释**）· `test/views-locks.test.mjs` · `test/views-chat-scroll.test.mjs`。
- 行数面：全部 < 300（最大 = `renderer/app.mjs` 297）。

### 5.2 关键判据落形

- **回合尾判据单源** = `renderer/events.mjs:159` `isTurnTail`：通道 `ev:activity` ∧ **`fields` 键不在场** ∧ `event ∈ {done, stopped}`。判据**按「键在场」判**（`"fields" in ev`），设计字面 = `IPC.md:31`（「`fields` 键在场 ⇒ 内联形」）；两条调用面（值面 `onActivity` `:168` / 订阅面标题刷新）**同用此判据，判据串不双写**。
- **`ok` 旁路回退已删**：`renderer/events.mjs:120`「→ `const ok = ev.ok === true`」——缺键 ⇒ 不判成功（U87 两臂：`ok:true` + 正文 `Error:` ⇒ done／缺键 ⇒ error）。

### 5.3 变异抽检（自证「单源」与「臂有效」）

1. 抹去 `isTurnTail` 的 `stopped` ⇒ **U88 / U89 两档各自红**（单源已证）；已回退。
2. 判据回退为按值判（`ev.fields !== undefined`）⇒ **U89 红**（新判别臂 `test/events-reduce.test.mjs:142-143` + 合并断言 `:147` 咬住：`fields: undefined` 被误判内联 ⇒ `refreshTitles()` ⇒ 调用数 2→3）；回退后 6/6 绿。
3. 判别臂非冗余落点：值面（`onActivity`）两版判据**皆返回零写** ⇒ 臂须落在**订阅面**（刷新是否发生）方具判别力 —— 故早期拟置于 U88 的同形臂已撤，改置 U89。

### 5.4 跨舱缝（本轮不改 · 报 8a / 父侧）

- `test/files.mjs` 现 **17 档**，**无** `test/events-page.test.mjs`（`test/events-reduce.test.mjs` 在 `:4`）⇒ `test/run.mjs` 反查必失败（U52 清单两向）。该红**确由本轮新档所致**（非「非本轮引入」），**修复归属 = 8a**；已 `notify_parent`（note）。
- U95（`test/host-floor.test.mjs`）渲染侧行数臂**无承载**（归 8a）。
- **DOC-DRIFT（eng-designer 面，只报不改）**：`RENDERER.md:29` 仍把 `attachEvents({ on })` 归在 `renderer/events.mjs` 名下（拆分后跨档滞后；该行已无「（拟新增）」字样）；`RENDERER.md:72` / `:90` 本轮未复核；`SHELL.md` · `PROJECT.md` · 批档 §2 档列均未登记两新档。

### 5.5 内部审计 / 评审轮次与终态

- **内部 explore 分歧审计**：0 静默简化 · 0 清单外改动 · 唯一机械红 = 清单未登记（8a 面）。
- **advisor 代码评审 第 1 轮 = pass**（4 条 🔵，无 🔴/🟡）：① 判据按值 vs 按键在场 · ② `off` 非函数之注释 · ③ `pool.blocks` 无界 · ④ `subKey` 无消费者。
- **advisor 代码评审 第 2 轮（仅核 fix claims）= pass**：① **已改已验**（判据按键在场 + 判别臂，回退推演必红）· ② **已改注释**（理由经 `IPC.md:42`「返回退订函数」核为成立，不补诊断）· ③ ④ **未改码**（设计未定口径，改即偏离），口径缺口**由本段登记**。
- **终态 = clean**。修正轮次合计：自修 5 轮 + 判据字面化 1 轮。

### 5.6 遗留缺口与仅报告项

- **③ `pool.blocks` 只入不摘、无界增长**（`renderer/events.mjs:102` 只入 · `:134-136` 仅改 `status`）——设计未定池切片的**清点 / 窗限口径** ⇒ 未改码；**登记 = 本段**，请父侧在设计面补口径后方可动码。
- **④ `subKey` 无渲染侧消费者**（`:109` / `:124` 仅按 `ev.id` 定位）——验收面只钉宿主侧透传（§2.4 U82 行）；**登记 = 本段**。
- 仅报告项：`store.mjs` 仅注释 · 池切片无会话键口径 · 位标键源两源 · `live-N` id 派生 · 导出面略宽 · `ev:question` / `ev:task` 无消费者。

### 5.7 未复核项与收敛说明

- 第 1 轮曾有两处引文被审阅侧 host 标为 content mismatch / 不可读（`IPC.md:34` · `agent-host.mjs:39`）；**本轮已由本席直读逐字复核一致**：`agent-host.mjs:39`（`fields: hit[2] ?? null`）· `:205`（内联恒带键）· `:208`（`turn` 无该键）· `:249` / `:251`（**结算形 `{ key, event: "done" | "stopped" }` 无该键**——判据前提）· `IPC.md:31` / `:34`。
- `scratch/tmp-events-page.test.mjs` 探针未落盘（ENOENT）；其待验项已被 §5.3-2 的 U89 判别臂取代，**不再作为待办**。

### 5.8 8a 主进程侧实施记录（会话槽装载 / 落盘 · eng-coder 自写）

**舱面**：8a = 主进程侧（`src/main/**` + 主进程测试面）。任务书 = 本档 §1.14 ①–⑤（① 装载 ② 落盘 ③ 尺寸拆分 ④ 补两臂用例 ⑤ 归属澄清）+ §1.15 转达两项（`test/files.mjs` 登记 · U95 渲染侧行数臂 = 8a 域）。**五项全落**（对照见下逐条）。

**改动档**（行数口径 = `readFileSync(...).split("\n").length`，与 U95 同式、含尾行）：

| 档 | 态 | 行数 |
|---|---|---|
| `src/main/session-io.mjs` | 新 | 38 |
| `src/main/agent-bridge.mjs` | 新 | 80 |
| `src/main/suspensions.mjs` | 新 | 77 |
| `src/main/agent-host.mjs` | 重写 | 204 |
| `test/slot-sandbox.mjs` | 新（共享助手） | 26 |
| `test/session-io.test.mjs` | 新（U96 / U97） | 111 |
| `test/agent-host.test.mjs` | 改（模块级沙箱 + 替身补字段） | 298（本轮净增 +5） |
| `test/history-page.test.mjs` | 改（改采共享沙箱） | 109 |
| `test/files.mjs` | 改（登记两项） | 11 行 / **19 档** |
| `test/host-floor.test.mjs` | 改（U95 扩） | 213 |
| `test/guard-closure.test.mjs` | 改（U5 正控 +3 名） | 104 |

**①–⑤ 对照**：① 装载 = 装配取槽（`loadAgentSlot`；取槽值面逐条实读见下「实现层替换」）· ② 落盘 = 回合尾 `saveAgentSlot`（三路 done / stopped / error 同序调用，**先落盘再出终局事件**）· ③ 拆分三名落形（下）· ④ U96 / U97 两臂落形（`test/session-io.test.mjs`）· ⑤ `test/files.mjs` 登记 + U52 清单两向断言随动（本舱落）。

**拆分理由 + 三名**（§1.14 ③ · 依据 §2.3 在册预案）：`agent-host.mjs` 拆前实读 **296**（§1.14 ③ 记「现 295」= 换行计法差一行，触线结论不变）⇒ 触 300 层 ⇒ 出档三名：`agent-bridge.mjs`（核回调 → IPC 九通道桥）· `suspensions.mjs`（挂起表 item ∥ batch 两形 + verdict 映射 + `summarizeArgs`）· `session-io.mjs`（槽装载 / 落盘）。import 方向**单向** `agent-host → 三档`（零环）；拆后各档 204 / 80 / 77 / 38 皆 < 300。

**实现层替换：`loadSlotFile` 代 `resumeSlot`**（§1.14 ① 字面 = `resumeSlot` + `applySession`）：`resumeSlot` 的槽面副作用三项 —— **认领写 / end-marker 写 / 会话 GC 调度**（`thincoder-core/session-lifecycle.mjs:43-46`）——在桌面端**皆为错**：桌面端本键槽号由 `/session:<n>` 键已知（`src/main/session-slots.mjs:95` `slotOfKey`），装载不得另起认领竞争。取槽值面**等价无缺**（逐条实读）：provider / model（`session-lifecycle.mjs:149-162`）· engineering（`:117-119`）· history 人读线 + 机读线（`:84` / `:103-104`）· title / tasks（`:105-106`）。**`_slot` 重钉**：`applySession` 按切换语义清 `_slot`（`session-lifecycle.mjs:132`），而回合尾 `saveSession` 取槽走 `agent._slot ??= activeSlot(cwd)`，`activeSlot` = manifest **共享**活动指针 ⇒ 不钉则多标签 / 跨端切槽后本键回合落错槽（`src/main/session-io.mjs:6-9` / `:26`）。

**越清单披露（7 项 · 逐条理由）**：

1. `test/files.mjs` **+2 登记** —— (a) `test/events-page.test.mjs` = 8b 拆档遗留的清单红（§1.15 明记「8a 落」）；(b) `test/session-io.test.mjs`（§1.14 ④ 授权的新臂档）。清单 17 → **19 档**，`test/run.mjs` 反查两向瞬时闭。
2. `test/host-floor.test.mjs` **U95 扩**（§1.15 转达「U95 渲染侧臂 = 8a 域」）：新档 ≤300 清单补**渲染侧三新档**（`events` / `events-subscribe` / `mount-pool`）+ `test/events-page.test.mjs` + `test/slot-sandbox.mjs`；新增 `renderer/app.mjs < 300` **严格臂**（`app.mjs` 实读 298）；**渲染 import 零 `node:` / 零裸包臂不复制 walker**（U5 单源）。
3. `test/guard-closure.test.mjs:62` **U5 正控清单 +3 渲染新档名** —— 使 U95 的 import 面确有承载：U5 闭包自 `renderer/app.mjs` 静态递归走边，三档逐档在位才绿（若档名错 / 档不可达 ⇒ 该档 U5 判红）。
4. `test/agent-host.test.mjs` **模块级沙箱 + 替身补 `cwd` / `history` / `_fullHistory`**（净增 +5）：装配取槽落地后，旧替身无 `cwd` ⇒ 槽路径无源（新增字段即「零测力」面的必要条件）。
5. `test/history-page.test.mjs` **改采共享助手**（删本地 `sandbox()` + 随之无用的 import）—— 前批档，属**重构**（同沙箱缝单源化）。
6. `test/slot-sandbox.mjs`（新 · 26）—— 共享槽沙箱助手（非 `.test.mjs` ⇒ **不入** `test/files.mjs` 清单）；adopter = 本批三档（`session-io` / `agent-host` 模块级 / `history-page`）；`projects` / `session-contract` **不动**（前批档自建沙箱，仅报告）。
7. `src/main/{agent-bridge,suspensions,session-io}.mjs` **三名** = §1.14 ③ 授权「命名由实施舱定 + 披露」（§2.3 文件表原只有 `agent-host.mjs` 一行 ⇒ 三拆档行请 designer 补）。

**副作用与静默面**（核既有语义，非本档新增）：

- 装载可能**物化 `.d/` 段**（`applySession` 绑记录存储 —— `thincoder-core/session-store.mjs:73-76` 计数对账路径）；sidecar 身份不符 ⇒ `_quarantine()` 改名 `.stale-<ms>`。**槽缺 / 异 cwd ⇒ `false` 且零盘面副作用**（`loadSlotFile` 三因同出口回 `null`），异 cwd 档**原地保留**（**非** `.unreadable` 改名）——U96 ②③ 两臂逐条咬住。
- 落盘失败 = **静默不抛**（一处 stderr 行 `[agent-host] session save failed: `）：回合已跑完，写盘失败不得把回合掀成 error 面（CLI 先例 = `thincoder-cli/src/tui/agent-turn.mjs:326-331` 回合 finally 尾部 `try { saveSession(agent) } catch {}`）——U97 失败臂咬「不抛 ∧ 恰一行 stderr」。
- **`effort`（档位）无槽字段** ⇒ `slotMeta` 回退 config `provider.reasoningEffort`（`src/main/session-slots.mjs:103` / `:112`）——§2.8.3 已授权「若非槽字段 ⇒ 以 config 回退，**订正须在 §5 报明**」= 本段即报；`provider` / `model` 两键仍**槽值优先**（`str(data.activeProvider)` / `str(data.activeModel)`）。

**U95 扩法与覆盖等价**：四判据齐（新档 ≤300 · `app.mjs < 300` · 宿主档零 `electron` · 渲染 import 面）。渲染 import 面**不重复走边**（U5 单源）——`test/guard-closure.test.mjs` 的闭包自 `renderer/app.mjs` 递归，本批三渲染新档逐档可达（内部审计逐条实读）⇒ **无覆盖窗**；U95 档内注释指向该单源。

**证据面（本席亲跑 · 非转述）**：

- `npm test`（= `node test/run.mjs`）⇒ **tests 91 / pass 91 / fail 0**；新登记 `test/events-page.test.mjs` 三例（U90 / U91 / U92）**首次入跑**；8b 遗留的清单未登记红**已闭**。
- 定点：`node --test test/session-io.test.mjs` ⇒ 2/2 · `test/agent-host.test.mjs` ⇒ 9/9（零 stderr）· `test/host-floor.test.mjs test/guard-closure.test.mjs` ⇒ 12/12（U95 + U5 正控新名逐档绿）。
- **U96 / U97 非空性证**（inline execute 探针 · 不落仓内文件）：`pushReal` 之后、结算之前**槽文件根本不存在**；`emit done` 当场文件在且含 `MARK1` ⇒「先落盘再出事件」断言**非恒真**；写盘确随沙箱根（ `slotPath(s.cwd, …)` 命中）。

**内部审计（explore 分歧审计）= DEVIATIONS · 代码缺陷 0**：四类 7 项 —— 🔴 1 = 本段缺席（记录面，本段即闭）· 🟡 2 = 两个「见批档 §5」死指针（`src/main/session-io.mjs:13` · `src/main/session-slots.mjs:103`，本段补齐即闭）· 🟡 1 = 实现层替换（上「实现层替换」段已披露）· 🟡 1 = U96 / U97 无 §2.4 凭据行（设计面，见下漂移）· 🟡 1 = 档列 / 档数漂移（见下）· 🟡 1 = 越清单未披露（本段披露即闭）。审计自陈限制：其舱无 shell 面 ⇒ `npm test` 未能自跑（由本席读数替）；未读两项（`history-page` 重构 / 沙箱清理语义）由本席补核：`cleanup` = `_resetSessionsDirForTest()` + `rmSync(dir, { recursive, force })`（`test/slot-sandbox.mjs:19-22`）、`history-page` 已全采共享助手（本地沙箱零残留）。

**记录面缺口 / 设计漂移（只报不改 —— designer 域 + 父侧域）**：

1. §2.4 用例表止 **U95** ⇒ **U96 / U97 无设计凭据行**（本席沿「表尾续号」自标，待 designer 补行）。
2. §2.2(d) 记逐项形 `shape: "item"` ↔ **`IPC.md:18` 值域 = `"single"` ∥ `"batch"`**：实现取 **IPC.md**（通道契约档为权威单源；`src/main/suspensions.mjs:33` `shape:"single"`；渲染面同值 —— `renderer/views/approval.mjs` 的 `SHAPE_ACTIONS`）⇒ §2.2(d) 字面待 designer 收正。
3. 档数 / 档列陈数：本档 `:99` 8a 档列缺本批六档（三拆档 + `test/session-io.test.mjs` + `test/slot-sandbox.mjs` + `test/guard-closure.test.mjs`）；本档 `:122`「十八档」vs 盘上 `test/files.mjs` **19 档**；`SHELL.md:39`「用例模块十七档」· `PROJECT.md:117` / `:124`「十七档」同为陈数。
4. 「（拟新增）」标记已落未去：`SHELL.md:22`（`agent-host.mjs`）· `:32` / `:33`（`events.mjs` / `mount-pool.mjs`）· `:74` / `:80` · `IPC.md:14` / `:21` / `:23` · `PROJECT.md:88` / `:100` / `:101` · `RENDERER.md:90`。
5. `SHELL.md` §1 树缺行：`src/main/{agent-bridge,suspensions,session-io}.mjs` · `renderer/events-subscribe.mjs` · `test/{slot-sandbox,session-io.test}.mjs`。
6. `SHELL.md:76` 项 1（「provider / 模型 / 档位 / 工程模式取自会话槽」）= §1.14 ① 的设计落点，实现取槽面等价（档位 = config 回退，见上）⇒ 该行口径已成立（处置请 designer 裁）。

**在册非阻塞项（只报）**：`cwd` 空串 ⇒ `session-slots.mjs:68` TypeError（防御面未定）· `validateProvider` reason 不分档（§2.8.2 端差在册）· `dispose()` 零生产调用者 · `pool.blocks` 无界增长 / `subKey` 无渲染侧消费者（8b 侧在册）· 工具面观察（`grep` 传 glob + 目录参数会漏）与交付无关，另记。

**5.8 补记（审计 / 评审轮次 · 终态 · 一处口径收正）**

- **内部审计（explore 分歧审计）· 轮次 1 · DEVIATIONS（代码缺陷 0）**：四类 7 项，逐项见上段「内部审计」；🔴 1 = 本段（§5.8）缺席 ⇒ **本段落盘即闭**；🟡 2 = 「见批档 §5」死指针（`src/main/session-io.mjs:13` · `src/main/session-slots.mjs:103`）⇒ 本段即其所指，**闭**。
- **内部代码评审（advisor · `type=code`）· 轮次 3 · 终态 pass**：核本舱 6 条 fix claims 逐条**成立** —— ① `loadSlotFile` 代 `resumeSlot` 必要且取槽值面无缺 · ② `_slot` 重钉必要 · ③ U96 / U97 臂非空 · ④ U95 扩法无覆盖空窗 · ⑤ 越清单 7 项已逐条披露 · ⑥ save 失败不吞；另点名两处（挂起表 verdict 映射闭集 · `_slot` 语义）= **无缺陷**。前轮条目 9 条：**Fixed 5**（前轮 🔴「装配未接槽 / save 零调用」+ 布尔槽 ON/OFF 词形 + `onQuestion` 信号串 + `effort` 披露落档）· **Unfixed 3 皆在册非阻塞**（`dispose()` 零生产调用者 · `cwd` 空 ⇒ `session-slots.mjs:68` TypeError · `validateProvider` reason 不分档 —— 三者同列 `:734`「在册非阻塞项（只报）」）· **射程外 1**（`PROJECT.md` 预算回填 = designer 域）。**无 must-fix。**
  - 一致性留痕：评审舱 13 条引证因路径前缀缺失（未带 `thincoder/`）被判「file unreadable」⇒ 本席**逐条自核承重引证**（`session-io.mjs:19` / `:23` / `:25` / `:26` / `:33-35` · `agent-host.mjs:59` / `:195`），结论与评审一致（以盘上读数为准，非采信转述）。
- **口径收正（一处）**：`_slot` 钉槽在**两条入口路径**各一处 —— 新会话装配 = `src/main/agent-host.mjs:103: agent._slot = slot`（`assembleFor` 内，装配期即钉）· 既有槽装载 = `src/main/session-io.mjs:26`（`loadAgentSlot` 内，`applySession` 清空后钉）。上段只举后者，此处补全（同机制 · 两入口，非重复缺陷）。
- **终态 = clean**：代码缺陷 0 · 无未披露越清单项 · 无未定分歧 · 未决项 3 条皆在册非阻塞（列 `:734`）。

- **口径补充（越清单项 6 的边界）**：上「越清单披露」项 6 的「`projects` / `session-contract` 不动」= **本轮沙箱重构的 adopter 面不动**（两档自建沙箱、不引共享助手 —— 实测两档零 `slot-sandbox` 引用）；但两档**本批早前轮次已随动**（与白名单 10 → 13 同批，mtime 同刻），其随动面归 §2.3 在册域（`:99` 已登记「`host-floor` / `session-contract` / `projects` 随动」），非本轮新增，此处点明以免误读为「本批未动」。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-26 10:58）

- **#84 主进程侧**：`npm test` ⇒ **tests 91 · pass 91 · fail 0** ✓；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:21` ✓；`src/main/session-io.mjs`（38 行）逐行实读 ✓（**重钉 `_slot`** 的必要性成立：`applySession` 清 `_slot` ∧ `saveSession` 取**共享**活动指针 ⇒ 不重钉则多标签 / 跨端切槽后本键回合**落错槽** ✗）；`agent-host.mjs:126/129`（假 `assemble` 注入同走装载）· `:172` / `:176`（落盘先于终局事件 · 三路同序）✓。
- **#85 渲染侧**：独立核验（6/6 · 拆档达标 ✓）。
- **越清单 14 项（两舱合计）= 全披露且各有依据** ✓。

### 6.2 修正轮核验（父侧 · 2026-09-26 11:35）

- **#91 九项全落** ✓；**名集三面同值**：`thincoder-desktop/test/files.mjs` ⇄ `docs/desktop/design/PROJECT.md:121` ⇄ `docs/desktop/design/SHELL.md:43` = **十九档** ✓；**去标实读 15 处**（纠正父侧估数 13 ✓）；四新档行 + 三拆档行 ✓；U96 / U97 凭据行 ✓；两舱 advisor 议题逐条处置 ✓（清点 = 全量在场落盘 · 窗限 / 归档 = open · `subKey` = 留白 · 三条非阻塞 = 只报）。
- **doc-check 本批四档 = 0 闸面项** ✓（余两类皆不入闸：未落档「（拟新增）—列报」= `settings.mjs` / `onboarding.mjs` / `electron-builder.yml` / `tabbar.mjs`（设置批 / 打包批 / 预案档 ✓）；记录面历史标 = 沿批 5 #62 先例留档 ✓）。
- **记录面处置裁定 = 收**：历史行内「（拟新增）」照留（先例 ✓）· `cwd` TypeError 站点漂移（§5.8 记 `session-slots.mjs:68` ↔ 疑 `:59`）记档不追改 ✓ · 三处行数引文差（`sessions.mjs` / `projects.mjs` / `session-slots.mjs`）记档 ✓。

### 6.3 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.11–§2.18 designer · §3 评审（**轮次 1 + 轮次 2**）· §5 coder（**两舱子块**） |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 交付 **19 档**（含新档 9）· 用例 **U76–U97**（总 **91/91**）· 条目 E-1…E-7 |
| 指针 | 台账 **#353** 在途（桌面端程序 · 滚动）· **#410** 待讨论（question 作答通道）· #396–#408 在册 |
| 变更记录 | 无（程序首发行前不设 CHANGELOG） |
| 待办勾销 | 无独立行；三条在册非阻塞（`dispose()` 零生产调用者 · `cwd` 空 TypeError · `validateProvider` reason 不分档） |
| 台账可见面 | 已查 ✓ |
| 跨面四轴 | 设计档四面随动（`PROJECT` / `SHELL` / `IPC` / `RENDERER` + `UI`）✓ |

### 6.4 结论

批 8（**agent 装配 + 值面供给**）**收口**：装配桥（`agent-host.mjs` 204 + 三出档 `agent-bridge` / `suspensions` / `session-io`）· 事件归约（`events.mjs` + `events-subscribe.mjs`）· 通道 **13 项** · **会话槽装载 / 落盘**（含 `_slot` 重钉）· 回填接线 · **91/91** + 冒烟 `boot:"ok"` 全绿；**评审两轮**（🔴5 → 修复 15/15 → 清项 9/9 → pass）· 两舱内审 + advisor 全留痕；**修后收口序（#404）五度守住**。
