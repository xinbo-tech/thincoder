# 2026-09-27 · 桌面会话面板对齐（批 B · ⑤–⑧ 四件）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-26 22:25 射程裁定（「能两批都做就都做了吧」）+ 需求档 `docs/desktop/requirements/PROJECT.md` §3.5「批 B」段 + §4 D13（附件 / 复制）；台账 #428 的 B 半（⑤⑥⑦⑧ 四件）。。
> 台账 = #428（`docs/desktop/requirements/PROJECT.md` · 归批）。前情 = docs/batches/2026-09-26-desktop-chat-panel-a.md §6（已收口 2026-09-27）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批次条目与口径（父侧 · 2026-09-27 08:45 ✓）

**状态行** → 进行中 ✓（本批 = 批 B · 立批于批 A 收口之后 ✓）。

**条目（四件 · 源 = 需求档 `docs/desktop/requirements/PROJECT.md` §3.5「批 B」段 ✓）**：
- **⑤ 会话级模型 / provider 切换** ✓——现仅全局 `settings:agent { defaultModel }` ⇒ 切一处波及全部会话 ✗ ⇒ 收为**槽级**语义（对回 §3.1:47 · **D6** ✓）；
- **⑥ 推理档位枚举化** ✓——两层缺口：**无会话级档位** ✗ + 现以**自由文本**呈现 ⇒ 收为**枚举选项**形 ✓（对回 D6「effort 回执一致」✓）；
- **⑦ 状态栏 · 上下文占用读数** ✓（对回 §3.1:52 ✓）；
- **⑧ 附件 / 复制导出** ✓（**D13** ✓——贴图 / 粘贴 ⇒ 落盘 + 非视觉模型降级面 ✓·代码块 / 末条消息复制 ✓·`msg:send` 载荷须扩 `images` 维度 ✓）。

**边界** ✗：**斜杠命令族**（CLI 26 条 / VSC 亦无 ✓）——用户 2026-09-26 裁定「**斜杠命令不是必须项**」✗ ⇒ 本批**不做、也不列为后续议题** ✓。

**验收口径** ✓：**「能真聊一轮，并跑完一个带提问的任务」** ✓（批 A 已达成该口径 ✓ —— 本批 = 在此基准上补齐四件体验面 ✓·**非逐特性盘点** ✗）。

**授权口径** ✓：用户 2026-09-26 22:25 射程裁定「**能两批都做就都做了吧**」✓（批 A 已交付 ✓ ⇒ 本批在既定射程内 ✓）+ 用户 2026-09-27 02:18「**你自动跑完吧**」✓（点火 / 代签三条件自缚 ✓·新范围或口径裁决 ⇒ 停下 ✓）。

**依赖 / 输入** ✓：通道面已在（`msg:send` / `msg:interrupt` / `session:rename` / `session:delete` / 九事件订阅 ✓）；逐项对照 = 调查 **#28**（20 行 · 格级 `file:line` ✓）；台账 **#428**（在途 —— A 半已完 ✓·本批落地后一并核销 ✓）。

### 1.2 设计期两裁定（父侧 · 2026-09-27 08:53 · 承 #77 上抛 ✓）

**A. ⑤⑥ 槽写 ⇒ 取「授权核面小改」** ✓✓（#77 倾向 ✓·父侧准 ✓）：
- **事实** ✗：核现无 provider / model / effort 的槽写出口（`thincoder-core/session-slot-write.mjs` 仅四键 ✓）；`effort` **连槽字段都没有**（`saveSession` 字段表无之 ✓·桌面 `session-slots.mjs:112` 现回退 config ✓）；而桌面设计档自设边界 = 「本端不改核」✗。
- **裁定依据（层级判）** ✗：需求 **§3.1:47 逐字要求**「随会话槽持久化…**与 CLI / 扩展端同一份槽**」✓ = **已确认需求（第 2 层）** > 设计档边界（第 4 层）✗ ⇒ **低层让高层** ⇒ **非新范围**，是**把已确认需求做对** ✓。
- **授权面** ✓：新增槽字段 `effort` + 一个 `(cwd, slot)` 写出口 + `saveSession` 携带该键 ✓（**纯加法 · 老槽零行为变更** ✓）；核面改动**须记进核设计档**（`docs/core/design/SESSION.md` 一类 ✓·并入 #77 单 ✓）。

**B. D13「代码块复制」⇒ 取「块级复制 + 末条消息复制」** ✓✓（#77 倾向 ✓）：
- **事实** ✗：需求 D13 逐字含「代码块 / 末条消息复制」✓；而对话流在案 = **纯文本 `pre-wrap`、零 Markdown / 零 HTML 注入** ✓ ⇒ **界面无"代码块"实体** ✗。
- **裁定** ✓：**块级复制即忠实实现** ✓（能力语义 = 能拷一段对话 / 拷末条 ✓·零新增解析面 ✓）；**真代码块 = 另裁**（新渲染设计面 ✓）⇒ **登记不阻塞** ✓；设计档**如实记实现差异** ✓·**不弱化需求措辞** ✗。

### 1.3 设计评审一轮 + 逐条裁决（父侧 · 2026-09-27 09:25 ✓）

**评审** ✓：#78 设计评审（用户 09:20 点火 ✓）⇒ **VERDICT = changes-required** ✗（**1🔴 / 9🟡 / 5🔵** = 15 条 ✓·原文逐字入 §3 ✓）。

**逐条裁决** ✓（**除第 15 条外全部受理** ✓）：1（🔴 档位候选面缺 off 可达性数据）✓·2（null 值域措辞）✓·3（联动约束未入契约注）✓·4（`model:list` 元素形 + 消费面随动）✓·5（三测试档增量 + 事件订阅档补登）✓·6（D 号滞后 ⇒ D1–D15）✓·7（九/十通道计数）✓·8（不改核口径 vs §4.2 核改）✓·9（末条复制取文源）✓·10（失败径未闭合）✓·11–14（🔵 四小补）✓·**15 = 判据降级声明 ⇒ 不动作** ✓（父侧在案 ✓——**另注**：其"无文档地图"因我派单未含 `docs/README.md` ✗（**父侧派单缺陷** ✓）⇒ 轮 2 补入 ✓）。

**修正轮** ✓：已派 **#79**（eng-designer · fix · 按号 1–14 点修 · `SHELL.md` 并入其面 ✓）。
**🔴 处置** ✓：评审第 1 条 = 真缺口（`reasoningEffortEnum` 不含 off 记号 ⇒ 端侧无从判 off 可达性 ✓）⇒ **取①（投影补 off 可达性字段 · 判据单源 `thinkOffPath`）为父侧倾向** ✓，② 路亦可（须同笔收正 §6.21 两处 ✓）。
**审批门** ✓：🔴 未清 ⇒ **不问批准** ✓（评审 → 修正 → 核验 → 再判 ✓；修正轮在飞期间不请批准 ✓）。

### 1.4 轮 2 复核裁决（父侧 · 2026-09-27 10:30 ✓）

**结果** ✓：**轮 2 pass**（0🔴 / 4🟡 / 3🔵 ✓·报告逐字入 §3 ✓）；**轮 1 十五条：14 条在盘核实到位**（#1🔴 已解——`model:list` 元素投影 `{ id, effortEnum, thinkOff }` ✓ 判据仍单源 `thinkOffPath` ✓·`SESSION.md` 边界表第 3 行与验收回指③ 现可同真 ✓）；**#8 部分残留** ⇒ 见下 #1；**#15 = 声明不动作** ⇒ 见下 #7。
**⚠️ 机检提示** ✗：评审引用的三处坐标（`SHELL.md:90/:91` · 核档 `:138`）**内容对不上现值**（host 核 0/3 ✗）⇒ 其两条 🟡 的**坐标以父侧后核为准** ✓（**方向可信、坐标待核** ✗——**处置 = 结算轮逐点核后收正** ✓）。

**逐条裁决** ✗（七条皆 advisory ⇒ **不阻塞批准** ✓·**全部 Deferred 至收口/结算轮** ✓）：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 `SHELL.md` §3「不改核」绝对句残留（与同档「批 B 例外」相抵）——**坐标待父侧后核** ⇒ 结算轮删绝对句或改限定形 ✓ |
| 2 | Deferred | 🟡 **档位清除 / 回零两侧语义未定义**（选档 ⇒ 清 off 标记 · `null` ⇒ 回组装缺省 ✓）⇒ **父侧裁定口径 = 按 `SESSION.md` 边界表首行（回落 config / 渠道默认）落** ✓（**该口径随派单下发** ✓）；设计档收正入结算轮 ✓ |
| 3 | Deferred | 🟡 样式面未登（批 B 新增可见元素 ⇒ 样式档增量缺）⇒ 结算轮随实施实证登 ✓ |
| 4 | Deferred | 🟡 `SHELL.md` §1 树未登批 B 两新档 ⇒ 结算轮补 ✓ |
| 5 | Deferred | 🔵 §4.1 四处历史「本批」token 指代漂移 ⇒ 结算轮零语义收正 ✓ |
| 6 | Deferred | 🔵 值列计数「十二 ⇒ 十三处」与现值 14 处不符 ⇒ 结算轮核对 ✓ |
| 7 | Not an issue | 🔵 判据降级声明（射程未含地图档 ⇒ 地图比对未做 ✓）—— **根因 = 父侧派单** ✗（已记 §1.3 ✓）；坐标/行数未实读 = 射程外 ✓ ⇒ 沿用「实施后回填对账」✓ |

### 1.5 舱2b 交付核 + 随动收编（父侧 · 2026-09-27 10:46 ✓）

**核** ✓：`settings.mjs`（**175 行**）落 `modelEntry(id)` 三键投影 ✓·判据单源（`specForModel` / `thinkOffPath` ✓·端侧零族别自判 ✓）；`settings.test.mjs`（**232 行**）U99 原址扩写（整回执 deepEqual + 逐项三键闭集 + 真调链 + 三失败径 ✓）；**桌面端 134/134** ✓（其自证 ✓）；审计四类零偏差 ✓·内评 pass（0🔴 ✓）。
**父侧裁定** ✓：① 未声明枚举 ⇒ `effortEnum: []`（**键恒在** ✓）**准** ✓（依据 = 核自身同表示 + 渲染面免守卫先例 ✓·非设计改动 ✓）；② 内评 🟡#2（`model:list` 失败面 reason 文案 vs 兄弟通道闭集）⇒ **受理为设计面项 · 收口轮裁** ✓（`IPC.md:145` 失败面留白 ✓）。
**随动坐标 ⇒ 归口收编** ✗（#82 报 4 处 ✓）：① `renderer/views/settings.mjs:101` 串过滤 ⇒ **元素形落地后候选静默滤空** ✗ ⇒ **并入舱4b 面** ✓；② `renderer/views/settings-sections.mjs:121/128` 按 `name` 串取 ⇒ 舱4b ✓（原面 ✓）；③ `renderer/mount-settings.mjs:176` 原样透传 ⇒ **无需改** ✓（记录 ✓）；④ `test/views-harness.mjs:128` 假回执仍串形 ⇒ **双盲区**（视图测试不报红 + E2E 无渠道亦不报 ✗）⇒ **并入舱4a 面** ✓（同笔更新假回执为元素形 ✓）。
**报收正项 ⇒ 收口轮** ✗：`PROJECT.md:112` 值列 `settings.mjs 156 ⇒ ~160` **实读 175** ✗·`:152` `test 213 ⇒ ~217` **实读 232** ✗；`IPC.md:162` 同句坐标（`:27`）CLI 侧实指未定位（unverified ✓）。
**舱4a / 4b 已派** ✓（依赖 #84 ⇒ 排队 ✓）。

### 1.6 舱1（核面）交付核 + 域外收编（父侧 · 2026-09-27 11:14 ✓）

**核** ✓：`session-slot-write.mjs`（168 ⇒ **223** ✓·`SLOT_PREF_KEYS` + `resolveEffortPatch` + `setSlotPrefs` 四拒态 ✓·只写盘不碰内存 ✓）· `session-lifecycle.mjs`（327 ⇒ **353** ✓·施加面 = 支① 合并后判 spec ✓·off ⇒ 关思考形（族别另置 ✓）·null / 缺键 / 表外 ⇒ 不动 ✓）· `session.mjs`（携带 + **老槽禁回填** ✓）；**四包全绿**（其自证 ✓·**父侧亲跑 core 700/700 复核** ✓）；内审零偏差 ✓·代码评审两轮 pass ✓。
**其交付表 #7（❌）判定** ✓：`test/session-prefs.test.mjs` = **端侧档** ⇒ 已由**舱2a（#83）面**承接 ✓（**边界正确 · 非缺项** ✓）。
**DOC-DRIFT ⇒ 收口轮** ✗：① `SESSION.md` §6.15 `setSlot*` 清单未含 `setSlotPrefs` + 两坐标漂（`:343-345` ✓）；② **`SESSION.md:697` 末句「三端共用本施加面」与实际不符** ✗——桌面 `session-io.mjs:25` ✓ / CLI `bin/thincoder.mjs:363` ✓ 调核 `applySession`；**VSC = 端侧自有 `agent-state.mjs:90 applySlotSessionState`** ✓ ⇒ 应改「**两端共用 + VSC 端侧自有面**」✓（**须读码方可见 ⇒ 设计评审射程外 · 值此一报** ✓）。
**坐标/在册 ⇒ 收口轮** ✗：`session-lifecycle.mjs` 353（越 300 · 已在册只报 ✓）· `session-slot-write.mjs` 223（`CORE-UNIFICATION.md:1097/1109` 记 168 ⇒ 随动 ✓）。
**域外四报 ⇒ 已挂台账 #441** ✓（① `diskLonger` 不过滤盘面 · ② `{ provider: null }` 核不校值域 ⇒ 端侧契约必须拒 ✓ · ③ `token-ttl.mjs:246-266` 最小记录缺 `effort` 键 · ④ 类型脏载链可抛（**修复前即可达** ✗ ⇒ 按「非本批引入 ≠ 免修」纪律入册 ✓））。

### 1.7 舱2a 交付核 + 配对锁归口换舱（父侧 · 2026-09-27 12:16 ✓）

**核** ✓：`session:prefs` 全链落位（`ipc.mjs` 入册末位 + 转口 ✓·`agent-host.mjs` 判序 `bad-key`→`busy`→载荷两档→`slot-missing`→写盘→施加 ✓·reason 闭集五档 + **失败信封恒缺 `meta`** ✓·**只在飞键重施** ✓）；新测档 `session-prefs.test.mjs`（209 ✓·U127–U131 ✓）；套件 **137 pass / 2 fail** ✓（两红 = U74/U77 配对瞬态 ✓·差集恰 `session:prefs` 一条 ✓）；审计 clean ✓·评审 r1–r3 pass ✓。
**⚠️ 其 🔴 交回情报（关键 ✓）** ✗：补 preload 白名单须**同笔动四档** ✗ —— `preload.cjs` + `host-floor.test.mjs`（U13/U74/U77 ✓）+ **`projects.test.mjs`（U27）** + **`session-contract.test.mjs`（U37）** ✓（逐行坐标见其 §5.14 项 1 ✓）⇒ **#85 原面两档 = 窄了** ✗（切缝孤儿第 4 例）⇒ **撤 #85 · 换宽面舱 #88**（四档同笔 ✓·依赖 #83 已满足 ✓）。
**越声明披露（准 ✓）**：`test/history-page.test.mjs`（清单外 · **必改** ✗——KD-17 零回落 ⇒ 删 `loadConfig` 回落期望 ✓；不改即红 ✓）⇒ **派单文件表缺格（父侧缺陷 ✓·第 2 例）** ✗。
**只报不改 ⇒ 收口轮** ✗：`renderer/views/chrome.mjs:11` 头注指 `UI.md:19` 因增行漂（该句现落 `UI.md:16/21/23` ✓）；§2.5 三处估值随动（`ipc.mjs` 200 · `agent-host.mjs` 245 · **`renderer/session-slots.mjs` 路径笔误 ⇒ 实落 `src/main/session-slots.mjs` 154** ✓）。
**记录面限度** ✗：其评审逐轮原文因会话压缩不可复读 ⇒ §5.13 只记计数与处置（**未虚构 ✓**）——§1.24「逐字留存」条款**首例未达成**（如实披露 ⇒ 不追咎 ✓·下批再验 ✓）。

### 1.8 舱 #88 交付核 + 父侧漏抄追补（2026-09-27 12:31 ✓）

**核** ✓：四档同笔（`preload.cjs` 59 · `host-floor` 285 · `projects` 205 · `session-contract` 285 ✓）⇒ **U13/U27/U37/U74/U77 五锁全绿** ✓（定向 `28/28/0` ✓）；审计 clean ✓·代码评审 pass（0🔴/0🟡/4🔵 ✓·fix 0 ✓）。
**⚠️ 全量一红（非其面 ✓ ⇒ 当场追补 ✓）** ✗：`test/events-reduce.test.mjs:143` `handlers.size` **10 vs 9** ✗ —— 成因 = **在途 #84** 已落 `renderer/events-subscribe.mjs`（订阅表 九⇒十 ✓·12:24 ✓）而**配对三处未落** ✗（`preload.cjs` `EVENT_CHANNELS` · `host-floor` U76 · `events-reduce` 计数 ✓）。
**根因 = 父侧漏抄** ✗✗：撤 #85 / 改派 #88 时，**原派单「`EVENT_CHANNELS` 九⇒十 + U76」半句未抄入** ✗ ⇒ 该半句**悬空**（第 5 例孤儿 · **首例由父侧制造** ✗）⇒ **已追补 #84** ✓（三处并入其面 · 恢复原归属 ✓·#88 已交付笔在盘 ⇒ 禁重写 ✓）。
**#88 四条 🔵（判准不动 ✓）** ✗：`preload.cjs:11`「设置族十二项…」计数（**孪生句在 `src/main/ipc.mjs:6-7` ⇒ 须两处同笔 ⇒ 随零语义收正轮** ✓）· `host-floor:121`（批 7 段标）/`:190`（序末三）/`:2`（「本批」指代）——皆 committed 既有笔 ⇒ **改档会使本轮审计/评审证据失效** ⇒ 归**收正轮** ✓（父侧准 ✓）。
**其只报不改 ⇒ 收口轮** ✗：`PROJECT.md:103` 记 `ipc.mjs` ~197 **实读 201** ✓；§2 两处路径 token 笔误（`renderer/session-slots.mjs` · `renderer/settings.mjs` ⇒ 实落 `src/main/` ✓·**第二次报告** ✓）。

### 1.9 舱3 交付核 + 孤儿第 6 例（父侧 · 2026-09-27 12:46 ✓）

**核** ✓：八档落位（`events.mjs` 351 ✓ 归约 + `onUsage` ✓·`events-subscribe.mjs` 68 ✓ 十通道 ✓·`store.mjs` 313 ✓ `usage` 切片 · `i18n.mjs` 353 ✓ **十一键两语** · 三处配对锁（`preload.cjs` 58 ✓ / U76 恰十 ✓ / `handlers.size` 10 ✓））✓；`T-DSK29` 新例 ✓；审计 1 轮（PARTIAL 1 归因视图舱面 ✓ + OUT-OF-LIST `store.test.mjs` 强制锁披露 ✓）；代码评审 pass ✓（0🔴 ✓·fix 0 ✓）。
**残留一红 ⇒ 归口 #86** ✓：`views-chrome.test.mjs:206/:210` U51 键数（110 ⇒ **121** ✓·家族链已给 ✓）⇒ **追补发送** ✓。
**⚠️ 孤儿第 6 例（父侧舱切分漏格 ✗）** ✗：**`ev:usage` 发射端无主** ✗（#84 实读「`src/main/**` 机读零 `usage`」✓）⇒ **立舱 #89**（`agent-host.mjs` 回合尾发射 + `session-slots.mjs:97` 计数注 ✓）；**实证补充** ✓（#84 更正）：**十通道 = 九回调映射八通道 + 宿主自产两条** ✓ ⇒ 设计侧 `RENDERER.md` 类「九回调 → 九通道」表述须收正 ⇒ **收口轮** ✓。
**其更正（准 ✓）** ✗：键数账 = `104 + 3 + 3 + 11 = 121` ✓（"信息行 9→15" 为误 ✓·正 = 信息行仍 9 ✓·新增三族 = 会话头 3 + 档位 2 + 状态栏 1 ✓）。
**行数计法口径** ✗：`split("\n")` vs 内容行计法差恒 1（59/58 · 285/284 ✓）⇒ **结算轮统一口径** ✓。

### 1.10 舱 #89 交付核 + 收口清单累进（父侧 · 2026-09-27 13:03 ✓）

**核** ✓：宿主发射端落位（`agent-host.mjs` 258 ✓：`postUsage` `:149-153` + 三径调用点 `:205`/`:210` ✓·核投影直传 `historyPercent` ✓·**门 = 数字 ∧ > 0 ⇒ 发 / 否则零帧** ✓·读数域 = `agent.history` 工作史 ✓）；新测档 `agent-host-usage.test.mjs`（U132–U137 ✓·6/6 ✓）；`files.mjs` 15 ⇒ 17 ✓；**全量 146/145/1** ✓（唯一红 = U51 视图舱面 ✓）；审计 1 轮（DOC-DRIFT 3 条 ✓）·代码评审 pass（0🔴 ✓）。
**越声明披露（准 ✓）**：① 新测档 = 第五档（§2.5 未列 ✗——原址补例三档无一覆盖宿主发射端 ⇒ 按面拆档 ✓）；② `src/main/session-slots.mjs:97` 不在 §2.5 值列（宿主面 ✓·零语义 ✓）。
**射程外 ⇒ 收口轮** ✗：① **`IPC.md:41` 量纲句「0–100 整数」与核 `historyPercent` 无夹值并存** ✗ ⇒ `>100` 理论可达（宿主**不夹** = 保「端零重算」✓）⇒ **文档须补量纲真值口径** ✓（评审 🟡① ✓）；② `IPC.md:22` `ev:error` 宿主坐标 `:178` 陈旧（今 `:208-213` ✓）；③ §2.5:145 值列 `agent-host.mjs 204 ⇒ ~219` vs **实读 258** ✗；④ `U82` 题名计数待随动（舱3 已记 ✓）。
**收口清单累进（至 #89）** ✗：设计档七处（D 号族已完成 ✓ / ev 通道计数 ✓ / 不改核限定 ✓ / 末条复制 ✓ / 失败径 ✓ / `IPC.md:41` 量纲 / `IPC.md:22` 坐标）+ `SESSION.md` 两处（§6.15 清单 · 三端共用句）+ 行数账一批（`settings.mjs` 175 · `settings.test` 232 · `ipc.mjs` 201 · `agent-host.mjs` **258** · `session-slot-write` 223 · `session-lifecycle` 353 · `preload` 59/58 口径 · `host-floor` 285/284 · `projects` 205 · `session-contract` 285 · `views-chrome` 现读）+ `chrome.mjs:11` 漂注 + §2.5 路径笔误两处 + `U51` 键数（视图舱在落 ✓）。

### 1.11 设计修订轮（#90）交付核 + 复核点火（父侧 · 2026-09-27 13:24 ✓）

**核** ✓：四洞逐条给出**可实施形态** ✗ —— ① **写形 = 意图级载荷 `{ tier: { provider, model, level } }`** + 键协议统一式（先清不相容记号再按档落形 ✓）+ 两拒码 + 写后投影恒等 + 与 CLI 差**有意明记** ✓；② **现值 = `provider:list` 逐行 `effort` 离线投影** ✓ + 表外现值自成一选项 + 候选随 `model:list` + 零节点判据 ✓；③ **族别单源 = 主进程直引核导出面**（`specForModel`/`thinkOffShape`/`thinkOffPath` ✓·**禁端侧副本** ✓）⇒ 与 §1.5 收正的相抵**当场解消** ✓；④ **拆档**：`mount-settings.mjs` 458 ⇒ ~430 + 向导族拆 `mount-onboarding.mjs` ~85 + 接线 ~20 ⇒ 例外续期 ✓。
**机检** ✓：桌面域行宽 **0**（新引入 5 处已重排 ✓）·桌面域入闸红项 **0** ✓·三链同源回读在场 ✓。
**⚠️ 记录面事故（其主动披露 ✓）** ✗：**按行号批式编辑串行漂移** ⇒ `PROJECT.md` 变更记录 ⑥ 行被误覆盖 + 重复副本 ✗ ⇒ 已内容定位修复 + 去重 + 顺序归正 + 回读核验 ✓（**如实披露 = 合格处置** ✓·**教训入册**：批式编辑禁按行号跨段串行 ✗）。
**其 8 条上抛（皆披露 / 列报 ✓·无待裁 ✓）** ✗：跨面差有意（member deep-equal ∥ CLI 只清 `null` ✓ 已记）· 零新探针 · `views-settings.test.mjs` 越层（拆分预案已登记 ✓）· **两计法恒差 1**（在册口径 = 内容行数 ✓）· 值列 `settings.mjs` **174** ✓ 已落 · 引文形三处收正 ✓ 等。
**复核已点火** ✓（本修订 = 新设计内容 ⇒ 走复核 ✓；凭据值不落档 ✗）。

### 1.12 舱4b 交付核 + 孤儿第 7 例（父侧 · 2026-09-27 13:38 ✓）

**核** ✓：八档落位（`attach.mjs` **新 146** ✓·`mount-composer.mjs` **314**（越 300 advisory ✗·§2.5 估 ~282 ⇒ 随动收正 ✓）·`settings-sections.mjs` 215（`modelIdOf` 单源 ✓）·`views/settings.mjs` 295（投影 `:101` ✓）·`views-attach.test.mjs` 新 283 ✓·U51 附件两树 ✓·`files.mjs` 17 ✓·U95 +1 枚 ✓）；定向 `4/4` ✓·**全量 150/149/1** ✓（唯一红 = U51 陈旧键数 ⇒ #86 面 ✓）；审计 1 轮 + 代码评审 2 轮（pass ✓）·fix 1 轮 ✓·**clean** ✓。
**⚠️ 孤儿第 7 例（决定性 · 父侧漏格）** ✗✗：**附件的主进程半全缺** ✗（`src/main/**` 对 `images|dataURL|degraded` 零命中 ⇒ 图弃 · 降级回执不产生 ⇒ 端到端不可达 ✓）⇒ **立舱 #93** ✓（落盘 + 核 `appendImagePointer` + 非视觉 `degraded` + 上限 + 清理 ✓·逐字照 `IPC.md` §2 附件注 ✓）。
**其余披露（收口轮 / 归口）** ✗：`.id` 元素形机检缺口（`views-harness.mjs:128` 假回执仍串形 ✓ ⇒ **#86 面**（其派单已载 ✓））· `queued` 径附件不可达（设计边界 ✓·登记 ✓）· **零 CSS**（缩略图/移除键无尺寸规则 ✗ ⇒ 收口轮（与发现 3 同族 ✓））· `PROJECT.md:146/148/153` 行数估值漂移 ✓ · `U51` 九键无消费者 + 计数链两层收正（#86 ✓）。
**编号归口（准 ✓）** ✗：**U138–U141 自铸** ✓——既有号段无空位 ⇒ 准其自铸（披露 ✓·收口轮不追改 ✗）。
**⇒ #92（⑥ 落地舱）依赖已清 ⇒ 已自行启动** ✓。

### 1.13 舱 #93 交付核 + 收口舱归口（父侧 · 2026-09-27 14:04 ✓）

**核** ✓：主进程附件半落齐 ✓（`attachments.mjs` **新 125** ✓ 单点（判决/落盘/清理 ✓）·`agent-host.mjs` +13 ✓ 受理门/非视觉门/回执两形/回合尾清理 ✓·`ipc.mjs` +1 ✓ 透传；定向 `4/4` ✓·**全量 154/153/1** ✓（唯一红 = U51 ⇒ #95 面 ✓）；审计 1 轮 clean ✓·代码评审 pass ✓（0🔴 ✓）。
**越声明（准 ✓）** ✗：`src/main/attachments.mjs` **新档**（理由 = 内联即破单点 ✓）+ 其测档 + U95/`files.mjs` 登记 ✓ ⇒ 接受 ✓（§2.5「新档四」= 估列 ✓·单点优先 ✓）。
**其披露 ⇒ 收口轮** ✗：三处实现取值（非数组容器径 / `<ext>` 推据 / 阈十进制单位 ✓）· DOC-DRIFT（`IPC.md` §2 附件注项 1/2/3 三处未钉 ✓）· 值列漂移（`agent-host` **270** · `ipc` **201** ✓）· ✗ **未核实：真机 Electron 下 `.thincoder/tmp` 权限**（仅沙箱验 ✓）⇒ **人工走查 T-DSK21 项** ✓。
**U51 归口更新** ✗：#86 已撤（**686 轮零写空转** ✗·父侧舱面过大 + 派单漏纪律行 ⇒ **父侧缺陷** ✗）⇒ 重切 **#94**（视图实体半 ✓）+ **#95（机检收口舱 ✓）** ⇒ 红账归 **#95** ✓（本档前文「归 #86」统一以本块为准 ✓）。

### 1.14 孤儿第 8 例（接线半）+ 复制面两裁定（父侧 · 2026-09-27 14:41 ✓）

**⚠️ 孤儿第 8 例（父侧重切时脱落 ✗）** ✗：视图实体半已落，但**产品内无 handler 供给者** ✗（`renderer/app.mjs:99` `mountHead(root, state)` **无第三参** ⇒ 三 `select` 恒 `disabled` · `lastCopyNode` **全仓零引调** ✗）——撤 #86 重切时只余「视图半 + 收口舱」⇒ **接线半脱落** ✗ ⇒ **裁定：并入 #94 面** ✓（+= `renderer/app.mjs` · `renderer/mount-composer.mjs` 的 `lastCopyNode` 引调 ✓·后者为已收口档 ⇒ 写前重读 + 只加引调行 ✓）。
**裁定②** ✓：**复制控件沿接线形通则两态**（`RENDERER.md:42` ✓：有 handlers ⇒ `onClick` · 缺 ⇒ `disabled:true` ✓）——`UI.md` 项 4 的 `clipboard.writeText` = **出口效应**（由注入 handler 实现 ✓）✗ ≠ 自接线授权 ✓ ⇒ **`test/views-chat.test.mjs:226` 断言不改** ✓；**#94 审计判 🔴（自接线违通则）= 判对** ✓ ⇒ 按其收 ✓。
**累计** ✗：孤儿 8 例（**4 例父侧制造** ✗：漏抄 / 漏格×2 / 脱落×1）——**全部由子代实读拦下 ✓**。

### 1.15 舱 #92（⑥ 落地）交付核 + 评审补轮（父侧 · 2026-09-27 15:05 ✓）

**核** ✓：⑥ 主体落齐（`tierAgent` 二择一 + 拒码序 ✓·`provider:list` 行 `effort` 离线投影 ✓·`tierFace`/`tierOptions` ✓·`setTier` 零乐观写 ✓·+`settings.model.tier` 一键 ✓）；**全量 160/160 绿** ✓（其实跑 ✓）。
**⚠️ 其自标 `stalled`（如实 ✓）** ✗：**内部审计 + 代码评审未跑** ✗（承父侧"收口优先"令 ✓）⇒ **补轮已派 #97** ✓（fix 轮 · 只做"审计 → 评审 → 点修 → 收敛" ✓·不扩面 ✗）。
**键数冲突闭合** ✓：**122 = 对**（#92 实读 ✓——差 1 因 = **`settings.model.tier` 为本设计面漂移的新键** ✗（批档记 121/设置 48 ⇒ 实读 **122/49** ✓）= 收口轮设计面收正项 ✓）；#96 收口舱以实读对账 ✓。
**其余 ⇒ 收口轮** ✗：设计未明写点「非活动渠道行 `spec` 绑定条目自身 `model`」（#92 自主 ✓）· 越声明清单（`test/views-chrome.test.mjs` / `renderer/i18n.mjs` 面外 ✓ / 三档设计面内 ✓）。
**并发写手事件闭合** ✓：实测写手 = **本会话 #92**（非第三方 ✓·`pid 17904` 无涉 ✓）⇒ #92/#94 均已停手该档 ✓·#96 接管 ✓。

### 1.16 舱4a 收绿 + 「原址补例 ⇒ 新档」裁定（父侧 · 2026-09-27 15:11 ✓）

**#94 终态（其自证 ✓）** ✓：`test/views-chrome.test.mjs` **收绿即止** ✓·全量 **161/161 绿** ✓（U49b ✓ U51 ✓ U52 ✓ U118 ✓）；**键数 = 两语各 122** ✓（自 `renderer/i18n.mjs` 实测 ✓·族链逐项：左列 13 + 标签条 4 + 对话流 8 + 活动池 7 + 审批卡 7 + 提问卡 3 + **设置 49** + 向导 10 + 信息行 9 + 输入区 6 + 会话头 3 + 档位 2 + 状态栏 1 = **122** ✓）⇒ **与 #92 的 122 互证 ✓**（差 1 因 = `settings.model.tier` ✓ 已闭合 ✓）；其超额披露 ✓（`test/views-locks.test.mjs` 补 `sessionMetaOf` 导出面锁 ✓ = 越声明 ✓）。
**裁定（承其 (a)/(b) 上抛 ✓）** ✓：**取 (b) —— 落新档 `test/views-head.test.mjs`** ✓（读数两态 + 会话头回执刷行 + off 缺席 + `mount-head` 写路/`sync` 刷行 ✓）；**`views-chrome.test.mjs` 仍归 #96** ✗（**理由 = 碰撞后刚收绿 ⇒ 不再招双写** ✓·同批先例 = §5.25 项 5 ✓）。
**⇒ 收口轮设计面随动** ✗：§2.5:197「原址补例」**实落新档**（该句须收正 ✓·**非实施舱缺口** ✓）。
**纠误** ✗：其指「审计『不写进 views-chrome』为误报」✗ —— 该句在**其派单任务书**（非批档 ✓）；**U49b = 挂载供给面 ≠ 读数/刷行例 ⇒ 实无相抵** ✓（不追责 ✓）。

### 1.17 舱 #97（⑥ 评审补轮）交付核（父侧 · 2026-09-27 15:13 ✓）

**核** ✓：**两轮补跑完成** ✓（审计 = DEVIATIONS（六类 findings 全落「行数账 / 值列 / 指针」面 ✓·**零 PARTIAL / 零静默简化 / 零未申报越清单** ✓）·代码评审 = **pass**（5🟡 + 9🔵 · **无 🔴** ✓）；**唯一实修** = `settings-sections.mjs:210` 注释纠偏 ✓（取纠偏不补锚 ✓——`settings:tier` 全仓 1 命中（注释自身 ✓）⇒ 补锚即造新语义 ✓·**判断准确** ✓）；全量 **165/165 绿** ✓；**终态 = `converged`（射程内 ✓·未计假 pass ✓）**。
**其两处裁决（准 ✓）** ✗：① `views-settings.test.mjs` **447 行**不拆 ✓（**U95 机检例外臂**在册三向断言 `>300 ∧ ≤500 ∧ 不入 fresh` 现绿 ✓ + 拆分预案两处 ✓ ⇒ 消解窗口 = 下次触碰批 ✓）；② 「`settings.test.mjs` 301 越 1 行」**不成立** ✓（口径 = **内容行**（文末换行不计 ✓·`host-floor` 自身同口径 ✓）⇒ 实读 **300 = 恰线上合规** ✓）。
**⇒ 收口轮清单新增（其 out-of-scope ✓）** ✗：`§4.1` 值列按盘回填（`src/main/settings.mjs` **253** · `providers.mjs` **150** · `settings-sections.mjs` **290**（贴层）· `views/settings.mjs` 296 ✓ · `mount-onboarding.mjs` 88 ✓）· `IPC.md:146`「两缺 ⇒ `invalid-patch`」**自相抵**（读法待裁 ✓）· 活动行两键不同源 ✓ · `SHELL.md` 树补 `mount-onboarding.mjs` ✓（**与设计评审发现 3 同项** ✓）· `U146` 号段与 `PROJECT.md:313` 记 U98–U102 不符 ✓ · `i18n` 键数 **122 / 设置 49** 设计面随动 ✓。
**⇒ 待落** ✗：**#94**（新档 `views-head.test.mjs` ✓）· **#96**（夹具元素形 + 全绿保持 ✓）⇒ 落定 ⇒ **父侧亲跑 ⇒ 收口轮（全清单打包）⇒ §6** ✓。

### 1.18 舱4a 二轮交付核 + 硬限拆档（父侧 · 2026-09-27 15:18 ✓）

**核** ✓：新档 `test/views-head.test.mjs`（**299** ✓·U147–U150 自铸 ✓）承载三面（会话头三 `select` 候选面 / 写路与回执刷行 / 状态栏读数两态 ✓）；清单随动两档（`files.mjs` · `host-floor` fresh +2 ✓）；全量 **165/165 绿** ✓（其自证 ✓）；审计 1 轮（四类零偏差 ✓·另处置一观察项 ✓）·代码评审 pass（0🔴 ✓）·fix 1 ✓·**clean** ✓。
**裁定（其 🟡#1）** ✓：**现值恒在场**（**「off 选项缺席」只管可选集** ✗——现值 = 读事实、**不可吞** ✓·与「表外现值自成一选项」同源 ✓）⇒ **实现正确** ✓·**设计档补句 = 收口轮** ✓（`UI.md` 补「现值恒在场（含不可选态）」✓）。
**⚠️ 硬限（其只报 · 决定性）** ✗✗：`test/views-chrome.test.mjs` **537 行** ⇒ **越 500 硬限**（须拆 ✓）且**机检无网** ✗（U95 臂 = **码面池**（测试档不入池 ✓）⇒ 测试档尺寸零捕获 ✗）⇒ **立拆档轮 #98** ✓（按族切：视图族 ∥ **词表族 `views-chrome-vocab.test.mjs`** ✓·只搬不改 ✗·两档各 ≤300 ✓·依赖 #96 ✓）。**⇒ 收口轮新增** ✗：**测试档尺寸网**（U95 臂是否扩及测试档 ⇒ 设计面裁 ✓）。
**其四披露（准 ✓）** ✗：① **首次 §5 append 2540 字未落盘** ✗（其实读发现 + 全文重写 5776 字 + 读回 ✓——**处置正确** ✓·工具落盘失败面记观察 ✓）；② §5 段号 5.37 撞号 ⇒ **自纠己行为 5.38** ✓（披露免读成覆盖 ✓）；③ 引文二处改指（标 as-of ✓）；④ 读数时刻标注（收口前 ✓）。

### 1.19 收口舱（#96）零写交付核（父侧 · 2026-09-27 15:27 ✓）

**核** ✓：**零写收尾 + 实读对账**（前提失效 ⇒ 不造无谓改写 ✓·**准** ✓）——对账三条：① **U51 锁真闭合**（`:272` 计数式 = 13+4+8+7+7+3+**49**+10+9+6+3+2+1 ✓·`:275` 两语相等 ✓·`:391` 双向等式 ✓·`:287` 哨兵注入 ✓·`:365-377` 手工白名单 ⇒ **无逃生口** ✓）；② **本批十一键全有真实消费点**（逐处 `file:line` ✓·**无缺树** ✓）；③ 夹具元素形在盘 ✓（非其笔 ✓·只读证 ✓）；**全量 165/165** ✓；审计 1 轮 + 代码评审 pass（0🔴 ✓）·fix 0 ⇒ **clean** ✓。
**其 🔵 ⇒ 收口轮** ✗：① `views-harness.mjs:9`「消费面」注释只列 2 档（import 面实 7 ✓）；② **`renderer/attach.mjs` 不在任何零 CJK 机检面** ✗（枚举式 `../renderer/views/${name}` ✓ ⇒ **根下档构造性漏网** ✗·实读无现行违规 ✓）⇒ **登记为机检结构缺口** ✓；③ `i18n.mjs:7`「本舱七」token 待带舱号 ✓；④ 122/49 在册 ✓。
**其披露（准 ✓）** ✗：① 绿读数**无第三方独立复现**（两轮复核无执行面 ✓）⇒ **父侧亲跑 = 闭合点** ✓（本块记：§1.17 后全量读数均来自实施舱 · **父侧终跑待 #99 后执行** ✓）；② **派单描述补正**：`views-chrome.test.mjs:152` 向导串形 `models` **非「零消费」径** ✗（`settings-sections.mjs:8` 经 `modelChoicesTree` 复用 ⇒ 容差径可达 ✓）⇒ 收正理由应为「**形面统一**」而非「惰性无消费」✓（记录面 ✓）。

### 1.20 全舱落定 + 父侧终跑（2026-09-27 15:45 ✓）

**#99 交付核** ✓：拆档落形（537 ⇒ **258 / 291** 两档 ✓·只搬不改（helper 127/127 逐字 ✓·基线丢失 13 行逐条归属 = 档头/import/U51 两行 ✓）✓·清单 +1 ✓）；附加面（零 CJK 15 ⇒ 16 ✓）✓；审计 1 + 评审 pass（0🔴 ✓）+ fix 2（皆 comment-only ✓ ⇒ 未复跑评审 ✓·如实披露 ✓）·**clean** ✓。
**父侧终跑（本块 = 闭合点 ✓）** ✓：`cd thincoder-desktop && node test/run.mjs` ⇒ **tests 165 / pass 165 / fail 0 / exit 0**（4.0s ✓）——**机检面闭合** ✓（新用例全数在场：U127–U131 / U132–U137 / U138–U141 / U142–U145 / U146 / U147–U150 / T-DSK29+31 ✓·U74 二十七项 ∧ U76 恰十 ∧ U77 ✓·U49/U49b/U51（**122 键 / 十六视图档** ✓）✓）。
**⚠️ 本档越守卫线（自评 ✓）** ✗：本批次档行数 **~1900** ✗（>1000 守卫线 ✓）——成因 = **舱数十二 + 每舱 §5 全块** ✓ ⇒ **教训入册**：**单批批档应按"§5 汇总 / 分节"控制体量** ✗（本批**不拆** ✓——一个交付目标一轮实施 ✓·下批起执行 ✓）。
**⇒ 收口轮已派** ✓（设计舱 · 逐块读 §1.3–§1.19「⇒ 收口轮」条 + 各舱 §5「只报不改 / 报父侧」块 ⇒ 一次性收正 ✓）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（收口轮 · 续——实施后随动收正七档（数值 / 坐标对盘 · 零新语义）+ 活面残留同收五处（「拟新增」去标四处 + 数值一处）· 2026-09-27）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（本批四件 · 源 = 需求档 `docs/desktop/requirements/PROJECT.md` §3.5「批 B」段）

| # | 本批条目 | 需求锚 | 判据线（机检面） | 用例 |
|---|---|---|---|---|
| ⑤ | 会话级模型 / provider 切换（原仅全局 `settings:agent { defaultModel }` ⇒ 收为槽级） | §3.1:47 · D6 | `session:prefs` 通道往返：`provider` / `model` 落该槽 `sessionMeta` 且回执一致；改一处只波及本槽（他槽 `model` 不变）；改 `provider` 须同送 `model` | T-DSK28 |
| ⑥ | 推理档位枚举化（原零会话级档位 + 自由文本呈现 ⇒ 枚举） | D6（effort 回执一致） | 会话头三 `select` 候选 ∈ 逐模型 `effortEnum`（`model:list` 投影）+ `provider:list`；表外值 ⇒ 该键不动；`null` 仅 `effort`（未设）；老槽零回填 | T-DSK28 |
| ⑦ | 状态栏 · 上下文占用读数 | §3.1:52（需求 §3.5 项 7） | 回合尾 `ev:usage` 有效读数 ⇒ 读数节点在场且按会话 `key` 写切片；未至 / 非正数 ⇒ 零节点（禁假造） | T-DSK29 |
| ⑧ | 附件 / 复制导出 | D13（+ `msg:send` 载荷扩 `images`） | 附件：贴图 / 粘贴 ⇒ 随 `msg:send.images` 以 `dataURL` 发出（渲染面零 fs）；非视觉模型 ⇒ 回执携 `degraded` 且提示行在场；上限 15MB。复制：代码块 / 末条 ⇒ 控件在场 + `clipboard.writeText` 取块文本逐字；空文本 ⇒ 零控件 | T-DSK30 |

### 2.2 不在本批（明确排除）

- **斜杠命令族**（CLI 26 条 / VSC 亦无）——用户 2026-09-26 裁定「不是必须项」⇒ 不做、也不列为后续议题（需求档 §3.5 边界）。
- **真代码块面**（围栏切分 / 语言高亮 / 代码块级出口）——新渲染设计面，另裁（§10 Y）；本批复制面 = 块级 + 末条。
- **端侧自建落盘与图片指针格式**——落盘径 = 核（`appendImagePointer`），端侧零 fs。
- 主题 / 通知面 · 用量面板（状态栏读数以外）· CI 接线（随三平台 CI 批）。
- **需求档两处随动**（§10 AA）——归需求侧：§3.1:47 槽字段列举补 `effort` · §3.5 项 7 补 D 号或明示表外。

### 2.3 设计档落点（单源指针）

- 核面单源 = `docs/core/design/SESSION.md` §6.21（判据句 1–5 + 立/破表 + 验收回指 + 不做 + 端侧契约指针）
- 端契约 = `docs/desktop/design/IPC.md` §1 / §2（批 B 契约：`ev:usage` · `session:prefs` · 会话级偏好注 · 附件注 · 白名单 **27** · 需求侧行 `D1–D14` · `model:list` 补逐模型 `effortEnum` 投影）
- 形态 = `docs/desktop/design/UI.md` §1（批 B 注四项 + 存量行内「（批 B 落）」标注 · 形态行 / 工艺行数不变）
- 本档 = §2 KD-17…22 · §4.1 值列（十二处 + 新档四 + 用例模块计数 **30**）· §4.2 核三档 + 三文档行 · §6.1 D13 / D14 + 表外一项 · §7 T-DSK28-30 + 批 B 注 · §8 本批不做 · §9 落形指针 · §10 J 再订 + X ② 转已落 + Y / Z / AA

### 2.4 机制设计（KD-17 … KD-22 · 详见本档 §2）

- **KD-17 `effort` 入槽顶层字段**：`null` = 未设；`saveSession` 字段表须携 `effort`（`thincoder-core/session.mjs:120-138` 现无该键 ⇒ 缺之则下一次保存整对象抹除）；`newSlotData:40` 产 `effort: null`；老槽零回填；写出口 `setSlotPrefs` + `resolveEffortPatch` 住核 `session-slot-write.mjs`（复用 `writeFlag:125`，同形先例 `setSlotAutoApprove:134`）；施加面唯一 = `session-lifecycle.mjs:77` `applySession`。
- **KD-18 档位枚举双面**：设置面 = 全局默认（`settings:agent`）∥ 会话头 = 会话级；枚举单源 = 核 `specForModel(model).reasoningEffortEnum`（逐模型）；端侧候选 = `model:list` 补 `effortEnum` 投影 + `provider:list`；表外值 ⇒ 该键不动；`null` 仅 `effort`；`provider` 变更须同送 `model`。
- **KD-19 施加径**：写盘 → 重施（`loadAgentSlot`）单点；在飞（`flights.has(key)`）⇒ 拒 `busy` 零写。
- **KD-20 占用读数**：回合尾 `ev:usage` 推；未至 / 非正数 ⇒ 零节点；归约面按会话 `key` 写切片。
- **KD-21 附件零 fs**：`dataURL` 随 `msg:send.images` → 主进程落盘 + 核 `appendImagePointer`（零核改）；非视觉前置门 ⇒ `degraded`；上限 15MB。
- **KD-22 复制**：块级 + 末条；`clipboard.writeText`；空文本 ⇒ 零控件；成败零布局变化。

### 2.5 受影响文件与测试面

**码面（端 · 值列随动十二处 · 行数为估值，实施后随动收正）**：
`thincoder-desktop/src/main/ipc.mjs` `195 ⇒ ~197` · `agent-host.mjs` `204 ⇒ ~219` · `renderer/session-slots.mjs` `~135 ⇒ ~137` · `renderer/settings.mjs` `156 ⇒ ~160` · `preload.cjs` `57 ⇒ 58` · `renderer/events.mjs` `338 ⇒ ~344` · `renderer/store.mjs` `310 ⇒ ~313` · `renderer/views/chat.mjs` `289 ⇒ ~291` · `renderer/views/chrome.mjs` `101 ⇒ ~129` · `renderer/views/settings-sections.mjs` `206 ⇒ ~215` · `renderer/mount-composer.mjs` `262 ⇒ ~282` · `renderer/i18n.mjs` `317 ⇒ ~327`。

**新档四（拟新增 · 不越 300）**：`thincoder-desktop/renderer/attach.mjs`（~90）· `thincoder-desktop/renderer/views/chat-copy.mjs`（~40）· `thincoder-desktop/test/session-prefs.test.mjs`（~140）· `thincoder-desktop/test/views-attach.test.mjs`（~160）；`thincoder-desktop/test/files.mjs` `15 ⇒ 17`；`host-floor` U95 臂清单随动 = 码面池（批 B 新档两档）。

**核面三档（授权 = 批档 §1.2 A「授权核面小改」· 纯加法 · 老槽零行为变更）**：`thincoder-core/session-slot-write.mjs`（增 `setSlotPrefs(cwd, slot, patch)` + `resolveEffortPatch(level, model)` · `newSlotData:40` 产 `effort: null`）· `thincoder-core/session.mjs`（`saveSession` 字段表携 `effort`）· `thincoder-core/session-lifecycle.mjs`（`applySession:77` 在模型合并支之后应用 `data.effort`）。

**文档四档**：`docs/core/design/SESSION.md`（§6.21 核面单源）· `docs/desktop/design/IPC.md`（批 B 契约）· `docs/desktop/design/UI.md`（§1 批 B 注 + 落形标注）· `docs/desktop/design/PROJECT.md`（本档九项落笔）。

**测试面（机检）**：新建 `test/session-prefs.test.mjs`（通道往返 / 键闭集 / 在飞拒 `busy` 零写 / 表外值该键不动 / 老槽零回填）· 新建 `test/views-attach.test.mjs`（附件条目构树 / 空条零节点 / 两 `degraded` 提示行 / 复制控件与取文面）；原址补例 = `test/settings.test.mjs`（`model:list` 回执逐模型 `effortEnum` 投影）· `test/events-reduce.test.mjs`（`ev:usage` 归约：按会话 `key` 写切片 · 未至 / 非正数 ⇒ 零节点）· `test/views-chrome.test.mjs`（读数节点两态 + 会话头三 `select` 与回执刷行）。真粘贴事件 / 真剪贴板写 / 真落盘后图片指针 = 人工走查（T-DSK21 面）。

### 2.6 验收回指（三链同源）

| 需求锚 | 设计档 §6.1 回指行 | 用例 |
|---|---|---|
| §3.1:47 · D6（会话级模型 / provider） | D6 行（补批 B 落点） | T-DSK28 |
| D6（档位枚举 / effort 回执一致） | D6 行 | T-DSK28 |
| §3.1:52（需求 §3.5 项 7 · 占用读数） | 表外一项（需求档未编 D 号） | T-DSK29 |
| D13（附件 / 复制） | D13 行 | T-DSK30 |
| D14（E2E · 补登记） | D14 行 | T-DSK27 |

### 2.7 关键决策（被否候选一并记）

| 决策 | 裁定 | 被否候选 |
|---|---|---|
| ⑤⑥ 槽读写出口 | **授权核面小改**（新增槽字段 `effort` + 一个 `(cwd, slot)` 写出口 + `saveSession` 携该键）——需求 §3.1:47 逐字要求「与 CLI / 扩展端同一份槽」（第 2 层）> 设计档「不改核」边界（第 4 层）⇒ 低层让高层 ⇒ 非新范围 | 端侧另立存储 / 端侧直读核内表（破「同一份槽」） |
| D13 代码块复制 | **块级 + 末条**（对话流纯文本 `pre-wrap` ⇒ 界面无「代码块」实体 ⇒ 块级复制即忠实实现） | 本轮建 Markdown / 围栏解析面（新渲染设计面，另裁 · §10 Y） |
| 附件落盘 | **主进程落盘 + 核 `appendImagePointer`**，端侧零 fs | 端侧自建落盘与图片指针格式（第二存储面） |
| 占用读数 | **回合尾 `ev:usage` 推 · 未至 / 非正数 ⇒ 零节点**（禁假造） | 常驻估值 / 百分比假造 |
| 档位枚举源 | **核 `specForModel(model).reasoningEffortEnum`（逐模型）** | 端侧硬编码档位表（与核漂移） |

### 2.8 上抛与报告项

- **D14 补缺**：需求档 §4 此前无 D14 行 ⇒ 本档补 D14 行（= E2E 真 Electron，覆盖 T-DSK27）；D6 行补批 B 落点。
- **`model:list` 投影缺口**：端现仅回 `{ ok, models }`（`thincoder-desktop/src/main/ipc.mjs` · `settings.mjs:118-129`）⇒ 须补逐模型 `effortEnum` 投影（KD-18）。
- **`null` 仅 `effort`**：`provider` / `model` 无「未设」态（缺键 ⇒ 不动）；仅 `effort` 有 `null` 语义。
- **`provider` / `model` 同送**：改 `provider` 须携 `model`（避 provider 有效模型集不含旧 `model` 的悬空）。
- **需求档两处陈旧（§10 AA ⇒ 需求侧收正）**：① §3.1:47 槽字段列举缺 `effort`；② §3.5 项 7（占用读数）在 §4 未编 D 号——本档按需求自身锚登记为表外一项，**不代需求侧编号**。
- **agent 参数段自由文本键行 = 全量键回显面**（保留不动）。
- **核面小改须记进核设计档** = `docs/core/design/SESSION.md` §6.21（已落）。
- **unverified**：`applySession` / `saveSession` 具体置法 · 活槽重施副作用（`_compressFailures` 归零等）未跑码验证；§4.1 批 B 值列多为 `~` 估值（实施后随动收正）。

### 2.9 修正轮（设计评审 §3 · 十五条逐号点修 · 2026-09-27）

授权 = 派单（fix 轮）· 射程 = §3 十五条 + 机检归因；**点修不携新语义**（仅评审派生 + 形式面收正）。

| # | 严重度 | 处置 | 落点（单源指针） |
|---|---|---|---|
| 1 | 🔴 | **受理**：落法①——`model:list` 元素投影补 `thinkOff`（判据仍单源 = 核 `thinkOffPath`；不可 `off` ⇒ off 选项缺席）；被否候选②「候选面恒含 off」明记不采 | `docs/desktop/design/IPC.md` §2 `model:list` 行 · `PROJECT.md` §2 KD-18 / §4.1 / §6.1 D6 行 · `UI.md` §1 |
| 2 | 🟡 | 受理：值形句限定「`null` 仅 `effort`」+ `provider` / `model` 非空与同送约束 | `IPC.md` §2 契约注（值形句） |
| 3 | 🟡 | 受理：联动约束入契约注 + 违例 reason `model-required`；候选刷新落点（逐 `provider` 取清单）+「只送 `provider`」验收例 | `IPC.md` §2 · `UI.md` §1 批 B 注项 1 · `PROJECT.md` §7 T-DSK28 |
| 4 | 🟡 | 受理：元素形 `{ id, effortEnum, thinkOff }` 定形 + 两消费面登入值列与增量 | `IPC.md` §2 · `PROJECT.md` §4.1 / §7 批 B 注 |
| 5 | 🟡 | 受理：三测试档补估增（`settings` +~4 · `events-reduce` +~4 · `views-chrome` +~6）；`events-subscribe.mjs` 补登值列 **68 ⇒ ~70** | `PROJECT.md` §4.1 / §7 批 B 注 |
| 6 | 🟡 | 受理：D 号口径收正 **D1–D15**（诸处同改：档头 / §4.2 / §6.1 / §10）+ 表外一项 ⇒ **D15 行**（原说明行删）· §10 AA ① ② 转**已随动** | `PROJECT.md` 档头 / §4.2 / §6.1 / §10 · `UI.md` 档头 |
| 7 | 🟡 | 受理：ev 通道计数九 ⇒ **十**（三处同改） | `PROJECT.md` §4.1 三处 |
| 8 | 🟡 | 受理：「不改核」补限定——不改核**机制语义**；本批纯加法三处（授权 = §1.2 A）在案 | `PROJECT.md` §4.2 A4 / §8 批级判据 ④ · `SHELL.md` §3 不改核行 |
| 9 | 🟡 | 受理：末条复制取文源 = 末 `assistant` 块；零块 ⇒ 控件缺席 | `UI.md` §1 批 B 注项 4 · `PROJECT.md` §7 T-DSK30 ④ |
| 10 | 🟡 | 受理：失败径闭合——reason 闭集 `invalid-patch` / `model-required` / `bad-key` / `slot-missing` / `busy`；成功携 `meta` · 失败缺 `meta` 键 | `IPC.md` §2 会话级偏好注 · `PROJECT.md` §7 T-DSK28 |
| 11 | 🔵 | 受理：`percent` 量纲 = 0–100 整数 | `IPC.md` §1 `ev:usage` 行 |
| 12 | 🔵 | 受理：附件累计上限 30MB（超 ⇒ 余弃 `"partial"`）+ 回合尾清理口径 | `IPC.md` §2 附件注 |
| 13 | 🔵 | 受理：表外值「该键不动」归一读法明示（= 归一 `null`）+ 验收例 | `IPC.md` §2 · `PROJECT.md` §7 T-DSK28 ⑤ |
| 14 | 🔵 | 受理：`ev:approval` 载荷字段集并列 `key` | `IPC.md` §1 载荷定形行 |
| 15 | 🔵 | **不动作**（评审方判据降级声明——非设计缺陷；地图档到位后一次核过） | —— |

**机检归因与形式面直修**（`scripts/doc-check.mjs` 全量跑 · workdir = `thincoder`；修正轮内两轮）：

- 桌面五档首轮命中 14 处（锚 6 · 行宽 8），逐行取证：**均落本批自著行**（非跨批存量）⇒ 定为形式面直修（零语义）。
- 锚 6 处（`PROJECT.md` 检出坐标 :129 / :145 / :322 / :483×2 / :488）——5 行补 `（拟新增` 标记；:488 行改全路径 `thincoder-desktop/renderer/views/settings.mjs`（该档实存 ⇒ 不再产锚）。
- 行宽 8 处折行（`IPC.md` :94 / :104 · `PROJECT.md` 五处〔:481-483 / :488 / :489 检出坐标〕· `SHELL.md` :90）。
- 复跑终态：**桌面五档零入闸红项**（余 = 拟新增列报 · 报告面符号——均豁免）；全仓 悬空 **54 ⇒ 48** · 行宽 **30 ⇒ 22**（余项全为跨批存量：core / vsc 历史档——列报）。

**边界观察（只报 · 本轮不动）**：

1. `thincoder-desktop/test/views-chrome.test.mjs` **437** 越 300——在册预案（批 A 已登记拆分点；本批只报）。
2. `docs/core/design/PROVIDER.md:381`「零静默改写」与桌面「表外值归一 `null`」的对读——跨档观察（判据面归核档；本批不判）。
3. 盘上 `thincoder-desktop/renderer/views/chrome.mjs` 现无 `model:list` 消费——实施面待落（设计已点名）。
4. `SHELL.md` §3 内「（拟新增）」标记一处（载体档未在盘）——列报保留，不动作。
5. `SHELL.md` :96 死坐标（悬指改直指）随轮修正——形式面，同报。
6. 需求档 `docs/desktop/requirements/PROJECT.md` :176 属记录面——本批不动（D15 编号笔域 = 主代理）。

### 2.10 ⑥ 设置面档位控件（设计修订轮 · 四洞裁定落档 · 2026-09-27）

授权 = 派单（⑥ 修订轮）· 射程 = 四洞裁定（① 写形 / ② 现值与候选 / ③ 族别单源 / ④ 拆档）+ 复核派生点修（六处微修，零新语义 + 形式面收正）。

**覆盖条目**（三链同源）= **T-DSK31**（设置面档位控件——正常 / 边界）——需求锚 = `docs/desktop/requirements/PROJECT.md` §3.5 项 6 + D6 行（需求档只读；回指 = `docs/desktop/design/PROJECT.md` §7 T-DSK31 行）。

**不在本批**：会话头档位读侧（既有「会话头」行——只读 `null`，无表外态）· `"none"` 独立档（语义由 `"off"` 承载）· CLI 写协议统一（与 CLI 的差有意——勿统一）。

**四洞裁定落档**（单源指针）：

| 洞 | 裁定 | 落点 |
|---|---|---|
| ① 写形 | `settings:agent` 增 `{ tier: { provider, model, level } }`（与 `{ patch }` 二择一；两俱 / 两缺 ⇒ `invalid-patch`）；写协议 = 先清不相容记号再按档落形（`auto` 删两键 / `off` 落 `thinkOffShape(spec)` + 删 `reasoningEffort` / member 仅当 `thinking` deep-equal `thinkOffShape(spec)` 时删 + 置 level）；`"none"` 不作独立档；写后投影恒等 | `docs/desktop/design/IPC.md` §2「档位控件注」 |
| ② 现值 / 候选 | 现值 = `provider:list` 逐行 `effort` 离线投影（零探针）；表外现值 ⇒ 自成一选项（不吞 · 零改写 · 仅设置面）；候选随 `model:list`（`effortEnum` + `thinkOff`）；`defaultModel` 缺 / 模型段空 ⇒ 控件零节点 | `docs/desktop/design/IPC.md` §1 / §2 · `docs/desktop/design/UI.md` §1 批 B 注项 5 |
| ③ 族别单源 | 主进程直引核导出面（`specForModel` / `thinkOffShape` / `thinkOffPath`）——禁端侧副本（KD-18 扩 ⑥） | `docs/desktop/design/PROJECT.md` §2 KD-18 |
| ④ 拆档 | `mount-settings.mjs` 458 ⇒ ~430（向导族拆 `mount-onboarding.mjs` ~85 + 接线 ~20）⇒ 例外续期（距 500 硬限 ~70） | `docs/desktop/design/PROJECT.md` §4.1 / §3 例外段 |

**受影响文件**（估增 · 值列单源 = `docs/desktop/design/PROJECT.md` §4.1）：实施三档 = `thincoder-desktop/src/main/settings.mjs`（174 ⇒ ~205）· `thincoder-desktop/src/main/providers.mjs`（128 ⇒ ~140）· `thincoder-desktop/renderer/mount-settings.mjs`（458 ⇒ ~430）；测试三档 = `thincoder-desktop/test/settings.test.mjs`（+~10）· `thincoder-desktop/test/providers.test.mjs`（+~3）· `thincoder-desktop/test/views-settings.test.mjs`（+~5）；设计面 = `docs/desktop/design/IPC.md` · `docs/desktop/design/UI.md` · `docs/desktop/design/PROJECT.md`（§2 / §4.1 / §6.1 / §7 / §9 / 变更记录各按上文落点）。

**验收回指**（机检三档 · 三链同源）= T-DSK31 六例：① 写三径 + 写后投影恒等（`settings.test.mjs`——tier 三径与两 reason）② 表外现值自成一选项（`views-settings.test.mjs`——现值投影 / 选项集）③ 陈旧面两拒 `bad-level` ∥ `unknown-provider`——两径零写 + 控件回退回执前值 ④ 档位控件零节点 ⑤ 不可 `off` 模型 ⇒ off 选项缺席 ⑥ `mtime-conflict` 直传 + 零写 + 回退；行 `effort` 投影两向 = `providers.test.mjs`。

**上抛与报告项**：

1. **跨面差有意（判据面）**：本端 member 径取 deep-equal `thinkOffShape(spec)` 判据 ∥ CLI 只清 `null` 字面（`thincoder-cli/src/tui/cmd-think.mjs:111-142`）——不统一，已在 `docs/desktop/design/IPC.md` §2 明记。
2. **候选面零新探针**（对读先例 = VSC 端离线投影）：现值走 `provider:list` 离线投影；枚举随 `model:list` 既有探针——零新增探针依赖。
3. **`views-settings.test.mjs` 越层**：补 +~5 后落值越 300 ⇒ 拆分预案已登记（`docs/desktop/design/PROJECT.md` §4.1——只登记、不建新档）。
4. **两计法恒差 1**（披露 · 非缺陷）：行数两计法系统差 1（例 = `mount-settings.mjs` 459 ∥ 458 · `views-settings.test.mjs` 300 ∥ 299 · `providers.test.mjs` 245 ∥ 244）；在册口径 = 内容行数。
5. **值列收正**：`settings.mjs` **174** 按盘实读收正（`docs/desktop/design/PROJECT.md` §4.1 已落）。
6. **形式面**：`views-settings.test.mjs` 行尾括号净不配一处随本轮删（零语义）。

**形式面回流（本轮尾 · 零语义）**：

1. **行宽收正** = 五处重排（`docs/desktop/design/PROJECT.md` §3 例外续期行 + 变更记录 ⑥ 行 · `IPC.md` §2 项 9 · `UI.md` §1 批 B 注项 5——`lineWidth=300` 口径）：本域命中 0；存量 22 项 = core 18 / vsc 4（跨批，不在本批射程）。
2. **引文形收正** = 三处（`IPC.md` §2 项 9 · `UI.md` §1 设置面行 / 注项 5）：「需求 §3.5:94」⇒ 项号形（档位两面句 ⇒「项 6」；设置面行含模型 / provider 面 ⇒「项 5 / 项 6」）。原 :94 = 项 5 行（模型 / provider），档位锚 = 项 6（`:95`）。
3. **事故与修复**（记录面）：按行号批式多改一次串行漂移（`PROJECT.md` 变更记录 ⑥ 行被误覆盖 + 留重复副本）⇒ 已内容定位修复（D6 行复原 + 去重 + 顺序归正），终态回读核验。教训 = 同文件多改一律内容定位（old_string），勿用行号。

### 2.11 收口轮 · 续（实施后随动收正 · 数值 / 坐标对盘 · 2026-09-27）

**本轮性质**：批 B 实施后（`§5` 已录）设计面随动收正——口径 = **内容行数**（noTrail），零新语义；覆盖 / 不在本批条目**不变**（= §2.1 / §2.2）；不触发新评审。

**收正面（七档）**：

| 档 | 处数 | 要点 |
|---|---|---|
| `docs/desktop/design/PROJECT.md` | 全表 | §4.1 行预算按批 B 末实读回填 · 越层段重写 · §4.2 补登四行 + 行内描述收准 · §6.1 坐标收正 · §7 补批 B 用例号归属 |
| `docs/desktop/design/SHELL.md` | 9 | §1 树补五新行 + 值收正 + `views/` 行补两档 + 十通道口径 |
| `docs/desktop/design/UI.md` | 6 + 1 | 批 B 注口径收正（「四件」⇒ 四件 + 设置面档位一件 · 五项）+ 行内标注 |
| `docs/desktop/design/RENDERER.md` | 3 | §1 单状态树行补 `usage` 切片 · §1.1 归约面条 `ev:usage`（KD-20 指针）· 变更记录 |
| `docs/desktop/design/IPC.md` | 4 | 需求侧 spec 绑定句三处 + 变更记录 |
| `docs/core/design/SESSION.md` | 3 | `session-slot-write.mjs` 写面坐标 / 施正面口径 / 变更记录 |
| `docs/core/design/CORE-UNIFICATION.md` | 2 | §2.8.1 主表行 13 `session-slot-write.mjs` 读数 **168 → 222** + 变更记录 |

细则（PROJECT 档）：

- 新增行五 = `mount-head.mjs` **147** · `attach.mjs` **146** · `views/chat-copy.mjs` **133** · `views-chrome-vocab.test.mjs` **291** · `agent-host-usage.test.mjs` **183**；文件清单 **三十四档**；贴层 `views/chat.mjs` **292**。
- 越 300 段重写 = **十档** = 例外一 `mount-settings` **426**（距硬限 74）+ 越层九：`styles.css` **340** · `events.mjs` **351** · `i18n.mjs` **356** · `store.mjs` **313** ·
  `mount-composer.mjs` **348** · `views-settings.test.mjs` **446** · `views-question.test.mjs` **359** · `store.test.mjs` **334** · `views-tabbar-close.test.mjs` **317**（`views-chrome.test.mjs` 拆档后 **258** 除名）。
- §6.1 坐标收正 = `session-slot-write.mjs` `:140` / `:131` / `:46` · `session-lifecycle.mjs` `:81`（档位支 `:176-:190`）。
- §7 批 B 用例号归属 = **U127–U150**（U127–131 `session-prefs` · U132–137 `agent-host-usage` · U138–141 `views-attach` · U142–145 `attachments` · U146 `settings` · U147–150 `views-head`）。
- 值抽盘复核（本轮终态 · 2026-09-27）：`mount-settings` **426** · `app.mjs` **243** · `mount-composer` **348** · `chat-copy` **133** · `mount-onboarding` **88** · `views/chat.mjs` **292** · `store` **313** · `i18n` **356** · `events` **351** · `views-chrome.test` **258** —— 全数对盘一致。

**活面残留同收（consistency 面 · 零语义 · glob / 实读实证）**：

- 「拟新增」去标四处（已落档）：`docs/desktop/design/PROJECT.md` §4.1 注 `mount-composer` / `mount-cards`（`:193`）· 批 A 拆 / 增档两档（`:197`）· T-DSK26 机检面（`:198`）· T-DSK24 机检面 `views-question.test.mjs`（`:329`）。
- 数值残留一处：`fresh` 清单口径句 `mount-settings.mjs` 458 ⇒ **426**（`:195`）。
- 反向留存（标记 / 值正确）：`questions.mjs` / `queue.mjs` / `store-queue.test.mjs` / `electron-builder.yml`（`:97` / `:123` / `:129` / `:164` / `:165` / `:168` / `:228`）；`app.mjs` 行与拆分落形（批 9）两历史句（`:122` / `:177`）及变更记录内 dated 历史 = 记录面性质，留档不改（沿 `:417` 判例）。

**受影响文件与测试面**：值列单源 = `docs/desktop/design/PROJECT.md` §4.1（本轮全表按批 B 末实读回填；实施面 / 测试面 / 测试面三分落点同表内）。

**验收回指（三链同源 · 不变）**：§2.1 四件（⑤⑥⑦⑧）+ §2.10 第 ⑥ 档位件 ⇒ `T-DSK28` / `T-DSK29` / `T-DSK30` / `T-DSK31`；批 B 用例号归属 U127–U150 已落 `docs/desktop/design/PROJECT.md` §7，与 `thincoder-desktop/test/files.mjs` 现值同源。

**上抛与报告项（只报 · 未写）**：

1. **`mount-composer.mjs`（348）越 300 无成文预案**——全仓无拆分预案（批次档 `§5.31` 项 3：「拆档 = 结构改动 · 归父侧裁」）⇒ `docs/desktop/design/PROJECT.md` 越层表按 `预案 = 待定〔在册——越线随批补登〕` 登记；拆族候选（附件条挂载族 / 末条复制控件族）待裁后补。
2. **同档行数未入任一机检池**（批次档 `:1059` 已记）——`host-floor` U95 臂清单纯代码面池，未含本档行数臂；待裁。
3. **`views-chrome-before.mjs` 基线副本**（拆档比对件）在盘——待父删。
4. **`i18n.mjs`（356）键数无计数句**——词表键数未登计数句；报请裁。
5. **R3#6 `deleteKeyPath` 漂移登记**（批次档 §5 记录面）——待裁是否入册。
6. **VSC 侧 effort 施加面未验**——`thincoder-vscode` 侧 `agent-state.mjs:90` 仅验函数头，`:103` 以下 effort 施加面 `unverified`（不得断言「VSC 无施加面」）；`docs/core/design/SESSION.md` 施正面口径按「桌面 ∥ CLI 同径 + VSC 自有面」收正。
7. **判据修正一则**：上轮记「`:192` / `:455` = 批 A 记录面」；本轮上下文复读改判——`:192`（现值 `:193`）属 §4.1 活面注 ⇒ 依约去标；`:455`（现值 `:462`）确属变更记录（记录面）⇒ 留档不改。

## §3 设计评审（评审子代理）
**状态行**：评审完成（轮次 1 · 1🔴 / 9🟡 / 5🔵 · verdict changes-required）



### 轮次 1（评审子代理）

评审射程 = 批 B 设计（⑤ 会话级模型/provider · ⑥ 档位枚举化 · ⑦ 占用读数 · ⑧ 附件/复制）；设计档 = `docs/desktop/design/{PROJECT,IPC,UI}.md` + `docs/core/design/SESSION.md` §6.21 + `docs/desktop/requirements/PROJECT.md`。计数 = **1🔴 / 9🟡 / 5🔵** · VERDICT: changes-required。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求覆盖 / 文档所有权 | 🔴 | 档位「候选面与写面同判据」不可成立：`SESSION.md:706`（§6.21 边界表第 3 行说明「判据单源 = `thinkOffPath`——与端侧候选面同判据」）+ `:711`（验收回指③「候选面与写面同判据」）要求端侧候选面用 `thinkOffPath`；而候选面单源 = `model:list` 的 `effortEnum` 投影（`PROJECT.md:56` ·`IPC.md:141`），`SESSION.md:771`（D-SE53）明记该枚举**不含** off 记号（「`off` 不折为枚举字面…枚举无 `none`」）⇒ 端侧无从判定 off 可达性（type 族可 `{type:"disabled"}` 关思考而枚举无 `none`；`thinkAlwaysOn` 族不可关 —— `:706` 两族在候选面上不可区分）。连带需求 D6 判据「effort 菜单与回执一致」（`requirements/PROJECT.md:114`）对不可 off 的模型不可达：选 off ⇒ 槽值归 `null`（`SESSION.md:696`） | 二择一并写实：① `model:list` 投影补 off 可达性字段（判据仍单源 = 核 `thinkOffPath`）；或 ② 明示「候选面恒含 off、不可达模型写后归一为 `null`（读数面示 Auto）」，并把 `SESSION.md` §6.21 边界表第 3 行说明与验收回指③ 的「与端侧候选面同判据」收正为与该落法一致；另补一条「不可 off 模型」验收例 |
| 2 | 文档所有权 / 契约一致性 | 🟡 | 同一通道值域两处表述不一：`IPC.md:59` 值形句「值形 = 串（`null` = 清该键、回落配置面）」把 `effort` 的 null 语义写成三键通用，而 `PROJECT.md:56` 明定「`null` 仅允许 `effort` 一键」+「`provider` 变更须同送 `model`（槽双字段恒非空）」；`SESSION.md:694`（判据句 1）的 null 亦只属 `effort` ⇒ 按契约注实现者可接受 `{ provider: null }` | 契约注值形句限定为「`null` 仅 `effort`（未设 ⇒ 回落配置面）」，并列明 `provider` / `model` 的取值约束（非空 + 同送） |
| 3 | 清晰度 | 🟡 | provider/model 联动写约束未落契约注：`PROJECT.md:56` 要求「`provider` 变更须同送 `model`」，但载荷/回执单源（`IPC.md:59` · 会话级偏好注 `:100-106`）未载该约束与违例 reason 档；`UI.md:42`（批 B 注项 1）候选面未点「改 provider ⇒ 模型候选取数与刷新」的落点；`PROJECT.md:302`（T-DSK28）无单键提交例 ⇒ 「只送 provider」的期望行为（拒 / 接受 / 候选刷新）无判据 | 该约束落到契约注（含违例 reason 档）· 点名模型候选的取数点与刷新口径（逐 provider 取 `model:list` · 持句柄面）· 补「只送 provider」与「改 provider 后模型候选随动」两条验收例 |
| 4 | 清晰度 | 🟡 | `model:list` 回执形未定 + 既有消费面随动未登：`IPC.md:141`「`models` 逐项携 `effortEnum`」未定元素形（串 ⇒ 对象 ∥ 并列字段）；既有消费面（`PROJECT.md:139` `views/settings-sections.mjs` 的 `modelHeadNode` / `modelChoicesTree` + 向导复用 · `store` 的 `settings` 切片）随动未登、值列无增量（`PROJECT.md:128`） | 定形元素（或并列字段）并登两向：受影响旧消费面入 §4.1 值列 + 增量；机检面补「回执形两向」例 |
| 5 | 行数标注 | 🟡 | 受影响文件标注缺项：三档「原址补例」无预期增量（`test/events-reduce.test.mjs` 249 · `test/views-chrome.test.mjs` 437 · `test/settings.test.mjs` 213——`PROJECT.md:152` · 批 B 注 `:321-322`）；`renderer/events-subscribe.mjs`（`PROJECT.md:123`「九通道表」——`ev:usage` 须入订阅表，`IPC.md:49`）既无值列增量、亦未列为随动档。`events-reduce.test.mjs` 现 249 贴 300 层，增量未给 ⇒ 是否跨层不可判 | 四处补登：三测试档补 `≤±N`；`events-subscribe.mjs` 补行（现值 68 + 增量；若跨 300 层须带拆分预案） |
| 6 | 文档状态 | 🟡 | D 号口径滞后：需求档已补 D15 与 §3.1:47 的 `effort` 注（`requirements/PROJECT.md:123` / `:47` / `:176`），设计侧仍称「需求档未编 D 号」——`PROJECT.md:245`（表外一项）· `:247`（其说明）· `:369`（§10 AA ① ②）；且 §6.1 表头 `:227` 与 §4.2 `:210` 仍写 `D1–D14`（现值 D1–D15）；同族滞后 `UI.md:4` 档头仍 `D1–D12` | 六处收正为 D1–D15；表外一项改 D15 行并与 §10 AA 同步（AA ① ② 两半已由需求档落定 ⇒ 改「已随动」） |
| 7 | 文档状态 | 🟡 | ev 通道计数未随 `ev:usage` 收正：`IPC.md:49` 已定「白名单 = 本表十通道」（`:209` 记「九事件 → 十事件」），而 `PROJECT.md:116`（preload 行「白名单九通道」）· `:122`（events.mjs 行「`ev:*` 九通道」）· `:123`（events-subscribe 行「九通道表」）仍九 | 三处按十收正（计数与 `IPC.md` §1 同源） |
| 8 | 文档状态 | 🟡 | 「不改核」口径与 §4.2 核档改动相抵：`PROJECT.md:256`（A4「本端不改核、不触另两端源码」）+ `:329`（§8 贯穿不做「改核机制」）vs §4.2 `:206-208`（本批改三核档，授权 = 批次档 §1.2）；`SESSION.md:690` 自述 = 「授权核面小改 · 纯加法」⇒ 按 A4 会读成「本批零核改动」 | A4 与 §8 边界补限定（「不改核机制语义；本批纯加法三处，授权在案」），回指面（`SHELL.md` §3「不改核」行）同收 |
| 9 | 验收判据 | 🟡 | 末条复制控件取文源 / 缺席条件未定形 ⇒ 验收不可判：`UI.md:52` 只给锚（`data-action="chat:last"`）与「纯文本取块文本逐字」，未点「末条」指哪一块（末块 / 末 assistant 块 / 末 user 条），亦无零块缺席判据（对照逐块控件「块文本空 ⇒ 零控件」）；`T-DSK30` ④（`PROJECT.md:304`）对末条控件沿用「收到块文本逐字」⇒ 无对应源块可判 | 点名取文源（哪一块 ∥ 哪一切片）与零块缺席判据，并让 T-DSK30 ④ 的期望与之对齐 |
| 10 | 验收判据 | 🟡 | `session:prefs` 失败径未闭合：契约注（`IPC.md:59` · `:100-106`）只写成功态「同回带 `meta` ⇒ 就地刷会话头」；槽不可读 ⇒ `setSlotPrefs` 返 `false`（`SESSION.md:695`）时回执 `reason` 名未入闭集（会话族闭集 `IPC.md:95` 无本通道路径），`meta` 在失败时的形（缺 ∥ `null` ∥ 旧值）未定；`T-DSK28`（`PROJECT.md:302`）仅覆盖在飞 `busy` | 补失败径定形（`reason` 名 + `meta` 形）与验收例（槽不可读 / `bad-key` / `busy` 三者并列） |
| 11 | 清晰度 | 🔵 | `percent` 量纲未写：`IPC.md:41` 仅「`percent` = 本会话上下文占用百分数」，而端侧门（「非正数 ⇒ 零节点」`UI.md:50`）与 ≥ 80% 警示阈（`UI.md:21` · `:78`）实按 0–100 口径 ⇒ 量纲（0–100 ∥ 0–1）不明则可实现错 | `ev:usage` 行写明量纲与取值域（并即位点明「有效读数」的数值形） |
| 12 | 范围 / 清晰度 | 🔵 | 附件临时文件生命周期与多图总量上限未定形：`IPC.md:112-113` 给落盘径（`<cwd>/.thincoder/tmp/paste-<ts>-<i>.<ext>`）与单项 15MB 上限，未给清理口径（何时清 / 谁持）与累计上限（多张近阈图可累计发出） | 补清理口径（发送后 / 回合尾 / 定期任选其一）与累计上限，或明示「有意不设」 |
| 13 | 清晰度 | 🔵 | 「表外值 ⇒ 该键不动」（`PROJECT.md:56` · `IPC.md:106` · `T-DSK28` ⑤ `PROJECT.md:302`）与 `SESSION.md:696`（判据句 3「不含 / 无枚举 ⇒ `null`」）+ `:705`（边界表第 2 行）在该键**原已有值**时期望不同（保留原值 vs 置 `null`） | 明示一读：「该键不动」= 归一为未设（`null`），并指明原值非 `null` 时的期望，或补一条该情形验收例 |
| 14 | 契约一致性 | 🔵 | `ev:approval` 字段集未列 `key`：`IPC.md:26` 段头与 `:46` 会话键面段皆称十通道一律携 `key`、渲染侧按键分片，但 `:18` 的「载荷定形（消费面最小字段集）」未含 `key`，`:36` 该条又写「定形 = 本表该行」⇒ 该通道键面读法不一 | 该行字段集并列 `key`（或注明键面另见会话键面段），免「最小字段集」被读成不含 `key` |
| 15 | 判据降级声明 | 🔵 | 无文档地图、无项目标准档 ⇒ 判据 7（文档所有权）按各档头自述板块 + 「单一权威源」指针核对（未做全仓地图比对）；判据 8 按表内自洽 + 层级核算，盘上源码行数与 `file:line` 坐标未实读复核（只读射程内五档） | 地图档到位后把 §1 批 B 注 / §2 KD-17–22 / §6.21 的归属一次核过；§4.1 行数值的权威口径沿用实施后回填对账 |

VERDICT: changes-required
计数 = 1🔴 / 9🟡 / 5🔵（🔴 = #1）

### 轮次 2（评审子代理）

轮 2（修正后复核 · 2026-09-27）——复核对象 = 轮 1 十五条的修复声明；射程 = `docs/desktop/design/{PROJECT,IPC,UI,SHELL}.md` + `docs/core/design/SESSION.md` + `docs/desktop/requirements/PROJECT.md`（修复声明载体 = 批档 §2.9 / §2；盘上源码与 `file:line` 坐标射程外）。

逐条核对结论：**14 / 15 修复在盘核实到位**——#1（🔴）已解（`model:list` 元素投影 `{ id, effortEnum, thinkOff }`（`IPC.md:145` · `PROJECT.md:56` · `UI.md:30` / `:43` · `T-DSK28` 例）⇒ `SESSION.md:706`「判据单源 = `thinkOffPath`——与端侧候选面同判据」与 `:711` 验收回指③ 现与投影口径可同真；被否候选②「候选面恒含 off」已明记不采）；#2–#7、#9–#14 落点均存在且表述自洽（`null` 仅 `effort` + 同送约束 · `model-required` + 候选刷新 + 验收例 · 元素形 + 两消费面入值列 · 三测试档增量 + `events-subscribe` 补登 68 ⇒ ~70 · D1–D15 六处 · 十通道三处 · 末 `assistant` 块 + 零块缺席 · reason 五档 + `meta` 两向 · 0–100 整数 · 30MB + 回合尾清理 · 归一 `null` + 原值例 · `key` 并列）；**#8 = 部分残留**（见发现 1）；#15 = 声明不动作（判据降级延续——见发现 7）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档状态（#8 残留） | 🟡 | `SHELL.md:90` 首句「本端设计面**无一处**要求核新增 / 修改能力」与同档 `:91`「批 B 例外（授权在案）= 核面纯加法三处（槽字段 `effort` + `setSlotPrefs` 写出口 + `saveSession` 携带）」相抵——限定语「不改核机制语义」已补，绝对句未随收（`PROJECT.md:254` / `:327` 已带限定；唯一残留在此） | 该句改限定形（如「除本批授权三处（批次档 §1.2 A）外，本端设计面不要求核新增 / 修改能力」） |
| 2 | 清晰度 / 设计缺口 | 🟡 | `SESSION.md:697`（§6.21 判据句 4）只给三支写入，未定义**清除 / 回零两侧**：①「选档 ⇒ 清 off 标记」缺；② `null` 支「**不动**（沿用既有 config 链）」与 `:704` 边界表首行「不设档位（**回落 config / 渠道默认**）」＋ `SHELL.md:97`「`effort` 未设（`null`）⇒ 回落**渠道默认**」在「同进程内先应用过 off / 档位的槽 ⇒ 切到 `effort = null` 的槽」情形不可同真（模型合并支是否复位未点名；核行为未实读 = unverified） | 判据句 4 补两侧语义（选档 ⇒ 清 off 标记；`null` ⇒ 回组装缺省），或边界表首行明示「不动 = 保留现值（跨槽继承为有意）」；顺带点名 `resolveEffortPatch` 调用点（写出口内）；验收面补一例（A 设 off ⇒ 切未设槽 ⇒ 运行态无 off） |
| 3 | 行数标注（判据 8） | 🟡 | 批 B 新增可见元素的**样式面未登**：§4.1 无任何样式档批 B 增量（`styles.css` `PROJECT.md:118` / `chat.css` `:119` / `pool.css` `:120` / `settings.css` `:149` 皆无批 B 标记），亦无「样式零改动」明示——而附件条（缩略图 / 移除控件 · `UI.md:46`）· 会话头三 `select`（`:41`）· 读数节点「≥ 80% ⇒ 警示色（class 切换）」（`:51`）· 复制控件（`:53`）均需样式落点 | 补登样式档与增量（含警示色规则落点），或明示「全复用既有类 ⇒ 零样式改动」 |
| 4 | 文档状态（跨档滞后） | 🟡 | `SHELL.md` §1 树（`:38-:52`）未登批 B 两新档：`renderer/attach.mjs` · `renderer/views/chat-copy.mjs`（`PROJECT.md:147` / `:148` 已列）——`views/` 行尾止于 `onboarding.mjs`；批 A（树增卡族两行）/ 批 9（树增 `mount-settings.mjs`）先例 = 新档当批入树 | §1 树补两行（（拟新增 · 批 B）），与 §4.1 同源 |
| 5 | 文档卫生 | 🔵 | §4.1 历史「本批」token 指代漂移（当前批 = 批 B）：`PROJECT.md:118`「批 A 修正轮入**本批**面」· `:129` · `:137` · `:139`「**本批**补登」——同族先例 = `UI.md:117`（「三处『本批』⇒『批 A』」） | 四处改带批号（零语义） |
| 6 | 文档卫生（计数） | 🔵 | `PROJECT.md:491`「`views/settings.mjs` **295 ⇒ ~296**（批 B 值列十二 ⇒ **十三处**）」与 §4.1 现值面不符——现含批 B 值改动的码面行 **14 处**（§2.5 十二 + 修复轮补登 `events-subscribe.mjs` `:123` + `views/settings.mjs` `:138`） | 核对该计数（十四处，或说明计数口径） |
| 7 | 判据降级声明 | 🔵 | 判据 7（文档所有权）仍按各档头自述板块 + 指针自洽核对：射程未含 `docs/README.md`（批档 §1.3 曾记「轮 2 补入」）⇒ 地图比对未做；盘上源码行数与 `file:line` 坐标未实读复核（射程外 = unverified），§4.1 数值沿用「实施后回填对账」口径 | 地图档入射程后把 §1 批 B 注 / §2 KD-17–22 / §6.21 归属一次核过 |

**射程外登记（批档 = 修复声明载体，不派发）**：批档 §2.5 两处路径 token 与 §4.1 不一致——`renderer/session-slots.mjs` ⇒ 实为 `thincoder-desktop/src/main/session-slots.mjs`；`renderer/settings.mjs` ⇒ 实为 `thincoder-desktop/src/main/settings.mjs`（§4.1 两行正确；实施侧以 §4.1 为准）。

计数 = 0🔴 / 4🟡 / 3🔵
VERDICT: pass

### 轮次 3（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity | 🟡 | 「现值投影」条 `thinkOffShape(spec)` 的 `spec` 未绑定（IPC.md:178）：行投影取哪一模型的 spec（行条目 `model` 字段 ∥ `defaultModel` 模型段）未点名，且行条目 `model` 为可选（IPC.md:141 `model?`）⇒ 无 `model` 条目无判据；与写协议（spec = tier 载荷 `model`，IPC.md:174-176）不同源时会出现「写后读回 ≠ 所选档」，与自设硬要求「写后投影恒等」（IPC.md:176）冲突 | 在「现值投影」条把 `spec` 绑定写死（点名模型来源与条目无 `model` 时的回落口径），并与控件现值取数（UI.md:58「该段当前所选模型」）对齐 |
| 2 | Clarity | 🟡 | `"none"` 三处口径未闭合：level 校验收 `reasoningEffortEnum` 表内字面串（IPC.md:174）而「`"none"` 不作独立档」，投影又把 `"none"` 归一 `"off"`（IPC.md:178）；若枚举含 `"none"`，候选面会出一个与 `off` 同义重复的独立选项，且 level=`"none"` 写后读回 `"off"`（破坏写后投影恒等） | 点名「候选面 + 写面校验」对 `"none"` 的单一处置（过滤 ∥ 归一 `off`），并说明 `reasoningEffortEnum` 是否含 `"none"` |
| 3 | Document ownership | 🟡 | `SHELL.md` §1 树未随 ⑥ 拆档随动：树内无 `mount-onboarding.mjs`（PROJECT.md:145 已入 §4.1）· `mount-settings.mjs` 行仍写「拆分预案」（SHELL.md:44）；同类存量两处：`attach.mjs` / `views/chat-copy.mjs`（PROJECT.md:148-149）树内亦无行——PROJECT.md:176 点名「SHELL.md §1 树」为拆分随动面 | §1 树补三行（含「（拟新增）」标记 + 一行职责）；`mount-settings.mjs` 行改「拆分落形（批 B · ⑥）」口径 |
| 4 | Document ownership | 🟡 | §4.2 `IPC.md` 行枚举（PROJECT.md:213）未回登 ⑥ 三项增量（`provider:list` 行 `effort` 投影 · `settings:agent` `{ tier }` · 设置族注项 9——IPC.md:141/:146/:171-181）；同表 `UI.md` 行「§1 批 B 注四项」（PROJECT.md:214）字面与注内现五项待一处口径 | §4.2 两行按 ⑥ 后实态补登（或改指针式枚举，防逐轮补登） |
| 5 | Size annotations | 🔵 | §4.1 用例模块行数值不自洽：`settings.test.mjs` 值列 `213 ⇒ ~217`（+4）与同行注 `+~10`（PROJECT.md:153）不符；`providers.test.mjs`（注 +~3）· `views-settings.test.mjs`（注 +~5，落值越 300 层）两处值列未标增量；`views-settings` 亦未入「越 300 层段合计九档」枚举（PROJECT.md:161-165） | 三处值列按注内增量重算（如 `~223`）或注明值列口径；估越档收录口径（估越 vs 实读越）写明 |
| 6 | Methodology | 🔵 | 主进程局部 `deleteKeyPath`（镜像核 `setKeyPath`——PROJECT.md:112）是「零算法副本」纪律的窄口子；KD-18 被否候选列（PROJECT.md:56）未登记替代路径（核加删键出口 = 需核改授权）· 无漂移观察项 | 补一条被否候选或 §10 漂移观察（镜像只做点分路径删键；核 `setKeyPath` 口径变化即随动点） |
| 7 | Clarity | 🔵 | 现值取数「行缺失」态未点名：`defaultModel` 的 provider 段在 `provider:list` 无对应行（provider 已删 / 陈旧面）时的现值取值与控件可选性无判据；写面有 `unknown-provider`（IPC.md:180），读面仅能由「模型段空 ⇒ 零节点」（IPC.md:179）间接覆盖（推理链，未点名） | 补读面同源判据一行（行缺 ⇒ 零节点 ∥ 禁写 + 明示） |

VERDICT: pass

发现计数：7（🔴 0 · 🟡 4 · 🔵 3）

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-09-27 02:18 授权「你自动跑完吧」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（#80 轮 2 · 0🔴 / 4🟡 / 3🔵 · 报告逐字入 §3 ✓；轮 1 = changes-required ⇒ 修正轮 #79 十四条落位 ✓）；② **修正轮落地并核验** ✓（父侧抽验 `IPC.md:145` = `{ id, effortEnum, thinkOff }` 逐模型投影 + 判据单源 `thinkOffPath` ✓·即 ①路 ✓）；③ **token 已签发** ✓（**凭据值不落档** ✗——沿纪律 ✓）。
**代签依据** ✓：用户 09:20 点火（本批设计评审 ✓）+ 02:18 自动授权 ✓（新范围 / 口径裁决的停手自缚未触发 ✓——本轮七条发现皆 advisory ✓，无新范围 ✗）。
**裁定** ✓：七条 🟡/🔵 **不阻塞批准** ✓·处置 = 全部 Deferred 至收口/结算轮（§1.4 表 ✓）；其中 **#2 的口径（`null` ⇒ 回组装缺省）随实施派单下发** ✓。
**⇒ 设计冻结** ✓：实施按本档 **§2 任务书**拆舱（舱切分与依赖见 §2 ✓）。

### 4.2 父侧代签（设计修订轮 · ⑥ 设置面档位 · 用户 2026-09-27 02:18 授权 ✓）

**三条件齐备** ✓：① **复核 pass** ✓（#91 · 0🔴 / 4🟡 / 3🔵 ✓·报告入 §3 ✓）；② 本轮**无修正轮**（评审即 pass ✓）⇒ 条件② = N/A ✓；③ **token 已签发** ✓（**凭据值不落档** ✗）。
**代签依据** ✓：四洞裁定（写形意图级载荷 / 现值离线投影 / 族别单源主进程直引核面 / 拆档落形 ✓）**经独立复核立住** ✓；射程内无新范围 ✗（= 批 B ⑥ 的缺口补齐 ✓）。
**裁决** ✓：4🟡 / 3🔵 = 披露 / 措辞级 ⇒ **不阻塞** ✓（处置随收口轮 ✓）。
**⇒ ⑥ 落地舱已派** ✓（主进程 settings 写径 + 视图控件 + **拆档**（`mount-settings.mjs` 458 ⇒ ~430 + 向导族拆 `mount-onboarding.mjs`）✓·依赖舱4b（同档冲突 ✓））。

## §5 实施记录（eng-coder）
**状态行**：实施完成（舱 #98 见 5.40 节：硬限拆档两档（258 / 291 行）+ files.mjs 登记行 · 审计 1 轮零偏差 · 评审 1 轮 pass（0🔴 · 🟡1 / 🔵2 已逐条处置）· fix 2 轮（comment-only）· 全量 165/165；前舱 5.1–5.39 在册）


### 5.1 交付摘要（舱 2b · 面 = 两档）

- `thincoder-desktop/src/main/settings.mjs`（175 行）：`model:list` 成功面 = 核 `listModels(provider)` 逐模型**元素投影** `{ id, effortEnum, thinkOff }`——新增模块私有 `modelEntry(id)`（`:124-127`，docstring `:117-123`）：`effortEnum = specForModel(id).reasoningEffortEnum ?? []`、`thinkOff = thinkOffPath(specForModel(id))`；body（`:143`）改 `.map((id) => modelEntry(id))`；失败面（`:140` 查无渠道 / `:145` 非 2xx）键面不变 = `{ ok:false, models:[], reason }`。新增两核导入（`specForModel` / `thinkOffPath`）。
- `thincoder-desktop/test/settings.test.mjs`（232 行）：U99 原址扩写（`:99-139`）——假 HTTP 夹具真名三行（`glm-5.3` thinkAlwaysOn ／ `kimi-k3` effort 无 `none` ／ `qwen3.7-flash` effort 含 `none`）+ 未登记两名 `m-a`/`m-b` + 非串两项；成功面整回执 deepEqual（`:113-119`）+ 逐项三键闭集环（`:123-125`，自陈「回执形两向：逐项在场」）；`:126` 真调核链路读数；`:128-138` 三失败径（非 2xx 状态入串 / 查无渠道两名含空名）。

**命令读数（改后复跑，双双实绿）**：

- `thincoder-desktop: node --test test/settings.test.mjs` ⇒ tests 5 / pass 5 / fail 0。
- `thincoder-desktop: node test/run.mjs` ⇒ tests 134 / pass 134 / fail 0（含 T-DSK27 真 Electron e2e ✓）。

### 5.2 决策透明表

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 未声明枚举 ⇒ `effortEnum: []`（三键恒在） | 设计未明写该形；核自身同一表示（`thincoder-core/think-off.mjs:24` 同式 `?? []`）；渲染面免守卫（先例 = VSC 空枚举零渲染，`docs/core/design/MODEL-SPECS.md:1470`） | 实现面裁定，已披露；非设计改动 |
| 2 | 未登记模型 ⇒ 走核 `specForModel` 的 `DEFAULT_SPEC` 径（一次性 `console.warn`） | KD-18「判据单源、端侧零族别自判」 | 测试台两行 warn 已实证无害（`run.mjs` stdio inherit，不致红） |
| 3 | 失败面 `models: []`（键面恒在） | `IPC.md:145` 回执形 | 与 U99 `:130` 断言对齐 |
| 4 | 评审后修正 1 处化石注释（`settings.mjs:42`） | 实读核：CLI 闸 = `thincoder-cli/src/acp.mjs:39-41`（`!!loadConfig().provider?.apiKey?.trim()`）＝ key 可解析；`thincoder-core/config.mjs:96` 实为空行（全档零 `isConfigured`）；同事实的干净形已在 `thincoder-desktop/src/main/ipc.mjs:52-56` | 零行为（注释）；处置见 5.3 |

### 5.3 审计与代码评审轮次与终态

- **内部偏离审计**（explore 只读）1 轮：四类偏差（PARTIAL ／ SILENT-SIMPLIFICATION ／ DOC-DRIFT ／ OUT-OF-LIST）**全无**；输出随动坐标 a–e（并入 5.4）。终态 = **clean**（fix 轮 0）。
- **内部代码评审**（advisor `type=code`，同步）1 轮：**VERDICT: pass** —— 0🔴 · 2🟡 · 2🔵，无 must-fix。逐条处置：🟡#1（`settings.mjs:42` 化石注释）**采纳并已修**（见 5.2 #4，零行为，复跑读数见 5.1）；🟡#2（查无渠道文案 vs 兄弟通道闭集码 `unavailable`，`providers.mjs:123` ／ `IPC.md:144`）**不动**——属设计面（`IPC.md:145` 未定 `model:list` 失败面），上报父侧；🔵#3（`effortEnum` 直引核表共享数组）**接受风险**——IPC 结构化克隆隔离渲染侧 + 核不可变契约（`model-specs.mjs:312-313`），且设计口号「零副本」下引 `[...]` 反增误读；🔵#4（夹具名 `m-a`/`m-b` 前缀假设）**接受残余**——失配即可见红，注释已标「未登记两名」。
- **fix round**：1/5（仅上述注释一行为），复跑见 5.1。
- **审计自身限度**：只读审计舱无执行面 ⇒ 其 AC ② 以本舱读数为准（5.1 两条命令为本舱实跑）。

### 5.4 随动坐标（交父侧登记 · 非本舱面）

① `thincoder-desktop/renderer/views/settings.mjs:101`：串过滤 ⇒ 对象被**静默滤空** ⇒ 模型段候选零渲染（真机瞬态；设计已派单 = `PROJECT.md:138`「逐项 `.id`，随动一行」）。② `renderer/views/settings-sections.mjs:121/128`：仍按 `name` 串取（`data-model` / `model.current === provider:name`）。③ `renderer/mount-settings.mjs:176`：`listOf(receipt.models)` 原样透传（无串滤，随动面在视图侧）。④ 夹具随动 `test/views-harness.mjs:128`（假回执仍串形）⇒ 双盲区：视图测试不报红、E2E 无渠道亦不报红。

### 5.5 报父侧收正项

- `PROJECT.md:112` ／ `:152` 值列仍为实施前估值：`settings.mjs` **156 ⇒ ~160**（实读 **175** 行）· `settings.test.mjs` **213 ⇒ ~217**（实读 **232** 行）——档面自定口径 = 实施后随动收正，归父侧结算轮。
- `IPC.md:162` 同句坐标（`:27`）我未能在 CLI 侧定位实指（实判据 = `thincoder-cli/src/acp.mjs:39-41`）——请父侧一并核（未穷举，标 unverified）。

### 5.6 交付摘要（舱 1 · 核面三档 · 2026-09-27）

**面 = 核面三档**（授权 = §1.2 A「授权核面小改」· 纯加法 · 老槽零行为变更）；设计单源 = `docs/core/design/SESSION.md` §6.21（判据句 1–5 + 边界表 + 验收回指）。

| 档 | 落点（本轮终态实读） |
|---|---|
| `thincoder-core/session-slot-write.mjs`（223 行） | 档头 `:4` 记三键；`newSlotData` 产 `effort: null`（`:50`，docstring `:43`）；新增 `SLOT_PREF_KEYS` `:185`；`resolveEffortPatch(level, model)` `:197`（`:199` 非串 `model` 按未登记归一——不抛）；`setSlotPrefs(cwd, slot, patch)` `:213`（`:214-216` 非对象 / 数组 / 零键 / 表外键 ⇒ `false`；`:217-221` 写体：只写盘不碰内存 · `provider`→`activeProvider` · `model`→`activeModel` · `effort` 取 `patch.model ?? d.activeModel` 归一 `:220`、值置 `null` 不删键） |
| `thincoder-core/session-lifecycle.mjs`（353 行） | `:138-141` `_slotEffort` 携带（缺键 ⇒ `undefined`；键在值 `null` ⇒ `null`）；`:175-191` 支①内·合并后 model 判 spec 的施加块（`:181` 非串 `model` 归一）：`"off"` ⇒ `thinkOffShape`（形 `null` ⇒ 另置 `reasoningEffort:"none"` `:186`）；枚举含 ⇒ 直置 `:189`；`null` / 缺键 / 表外 ⇒ 不动；支②零施加 |
| `thincoder-core/session.mjs`（255 行） | `:161-165` 保存携带：`agent._slotEffort !== undefined` ⇒ `fields.effort`（老槽 ⇒ 键不落盘，禁回填） |

**逐句自查**（均实读在盘）：句 1 槽字段 / 值闭集 ✓（读侧容忍表外串 = 边界表第 2 行）；句 2 写出口 ✓（`false` 四面 = 非对象·数组 / 零键 / 表外键 / 槽不可读）；句 3 纯函数 ✓（含非串 `model` 不抛——见 5.8 fix 轮）；句 4 施加 ✓（支①内·合并后判 spec；`null` 不动；支②不施加）；句 5 携带 ✓（`undefined` 与 `null` 两态分治）。

**命令读数（最终 · 2026-09-27 复跑）**：

- `cd thincoder-core && npm test` ⇒ `tests 700 / pass 700 / fail 0`。
- 下游回归：`thincoder-cli` 865 / `thincoder-vscode` 1010 / `thincoder-desktop` 134 —— 三包均 `fail 0`。
- 运行时矩阵（一次性脚本，未落盘为测试档）36/36 PASS：16 id × 13 层逐例对照修前逻辑零漂移 · 非串 `model` 七形不抛 · 写面五拒态 · 施加面七态 · 老槽无键零回填。
- 三档 `node --check` = Syntax OK。

### 5.7 决策透明表（舱 1）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 非串 `model` 归一取 `""`（落 `DEFAULT_SPEC` 径），不抛不报错 | 判据句 3「纯函数、不抛」；与外端脏载 / 手工档的现实面一致 | fix 轮新增（见 5.8）；advisor 轮 2 核验 pass |
| 2 | `effort` 归一 `null` = **值置 `null` 不删键** | 与 `newSlotData` 规范结构同源（`:50`） | 键在值 `null` 与老槽缺键两态在保存面分治（5.6） |
| 3 | 施加块放支①内·合并后 model 判 spec；支②零施加 | 设计判据句 4 逐字 | 支② = 槽 provider 失效静默保持现状（既有语义，零触碰） |
| 4 | 老槽 `_slotEffort === undefined` ⇒ 键不落盘 | 判据句 5 + 边界表首行（老槽零行为变更） | 同 `createdBy` 先例 |
| 5 | AC② 核面永久测试未落盘 | 测试档归 `thincoder-desktop/test/session-prefs.test.mjs`（端侧档，不在本舱文件列表）⇒ 本舱以运行时矩阵 + 四包回归覆盖 | 已报父侧（5.9） |
| 6 | 运行时矩阵脚本一次性（不落盘） | 测试纪律：单元测试 = 开发期工具 | 读数见 5.6 |

### 5.8 审计与代码评审轮次与终态（舱 1）

- **内部偏离审计**（explore 只读）1 轮：核面（本舱射程）**零偏差**（无 PARTIAL / 无 SILENT-SIMPLIFICATION / 无 OUT-OF-LIST）；报出设计档面 DOC-DRIFT 两处（5.9，只报不改）。
- **内部代码评审**（advisor `type=code`，同步）**轮 1**：VERDICT **pass**（0🔴 · 2🟡 可选 · 1🟡 行数 · 1🟡 覆盖 · 3🔵）。
- **fix 轮 1/5**：`resolveEffortPatch` 对非串 `model` 抛错（违判据句 3「纯函数、不抛」）⇒ 两处归一：`session-slot-write.mjs:199`、`session-lifecycle.mjs:181`；复跑读数见 5.6。
- **轮 2（仅核修复声明）**：VERDICT **pass** —— 两处修复实读在盘；「非串不抛」成立；「字符串 `model` 径逐字零变」by construction 等价（归一值落回同一 `specForModel` 径）；剩余仅沿轮 1 的 🔵 可选（不阻塞）+ 声明排除项（未复开）。
- **终态 = clean**（审计 1 轮 · 评审 2 轮 · fix 1 轮 · 零 🔴 遗留）。

### 5.9 报父侧（漂移 / 坐标 / 只报不改 · 舱 1）

1. **DOC-DRIFT ①**：`docs/core/design/SESSION.md` §6.15 的 `setSlot*` 写面清单（`:343-345`）未含新出口 `setSlotPrefs`；且该行列内坐标部分已漂（`setSlotEngineering` 档记 `:136`、实读 `:150`；`setSlotAdvisorGuard` 档记 `:141`、实读 `:155`）。设计档归 eng-designer——只报不改。
2. **DOC-DRIFT ②**：`SESSION.md:697`（判据句 4 末句）「**三端共用本施加面**（桌面 `thincoder-desktop/src/main/session-io.mjs:25` · VSC · CLI resume 同径）」与盘上事实不符：桌面 `session-io.mjs:25` ✓、CLI `bin/thincoder.mjs:363` ✓（两者均调核 `applySession`）；**VSC 恢复面 = 端侧自有 `thincoder-vscode/src/agent/agent-state.mjs:90 applySlotSessionState`**（旁证：`thincoder-core/agent-tools/plan.mjs:46` 记「两恢复（CLI `applySession` / VSC `applySlotSessionState`）」）⇒ 应为「两端共用 + VSC 端侧自有面」。只报不改。
3. **验收面归属**：AC②（核面三键的永久测试）落 `thincoder-desktop/test/session-prefs.test.mjs`（端侧档，不在本舱 §2.5 列表）⇒ 本舱未落盘，需端侧舱承接。
4. **只报不改（射程外观察）**：① `diskLonger` 未过滤盘面（`session-slot-write.mjs:74`）vs 保存面 `data.history` 已过滤（`session.mjs:209`）；② `{ provider: null }` 整 patch 通过仍 `true`（核不校值域——设计「值形句」限定在端侧契约面）；③ `token-ttl.mjs:246-266` 最小记录缺 `effort` 键（注释称与 `newSlotData` 形状同源）；④ 类型脏载在更早一行无守卫（`session-lifecycle.mjs:172-173` → `config.mjs:109`），修复前即可达——非本批引入。
5. **坐标随动**：`session-lifecycle.mjs` 327 ⇒ **353 行**（越 300 建议档——在册只报，未拆分）；`session-slot-write.mjs` 168 ⇒ **223 行**（`docs/core/design/CORE-UNIFICATION.md:1097/1109` 记 168，归父侧结算轮随动收正）。

### 5.10 审计自身限度（舱 1）

- 一次性运行时矩阵脚本未落盘 ⇒ 该读数不可由后续轮次复跑复现（命令读数 = 本舱自述；四包回归命令可由父侧复跑复核）。
- `modify` 面外我未触碰任何他舱文件；工作树内其余 108 处未暂存改动属在途批（`env-config-purge` 等），非本舱面。

### 5.11 交付摘要（舱 2a · 面 = 端「会话级偏好写面」· 2026-09-27）

面 = `thincoder-desktop` 端面（通道 `session:prefs` 全链 + 期望随动）；设计单源 = `docs/desktop/design/IPC.md` §2 `session:prefs` 行（`:59` · 位次 27「追加末位」`:84`）+ §2「会话级偏好注」项 1–7（`:101-110`）+ 同族例外（`:95`）；任务书 = 本档 §2.5（新档 `test/session-prefs.test.mjs` + 码面随动）。**零核面改动**（核三键 = 舱 1 已落，见 5.6）· **零 preload 改动**（配对面 = 父侧，清单见 5.14 项 1）——载荷面 / reason 五档 / 施加住端，写盘与值归一引核：**零算法副本**。

| 档 | 落点（终态实读 · 行数 = 内容行） |
|---|---|
| `src/main/session-slots.mjs` | 154 行。`slotMeta:104-121`（`effort` 出串 `:116` —— **只取槽字段、不回落 config**，`:107` 头注已收正）；`pageHistory` 的 `meta` 同源 `:138`；**新增** `writeSlotPrefs(cwd, slot, patch)` `:148-154`（写盘单源 = 核 `setSlotPrefs`；回读 `loadSlotFile` ⇒ `meta` 与 `history:page` 同一 `slotMeta` 投影；写已发生而档不可读 ⇒ 显式抛，fail-loud） |
| `src/main/agent-host.mjs` | 245 行。`PREF_KEYS` 键闭集 `:63-65`（单源 = `docs/core/design/SESSION.md` §6.21）；表验 `prefsPatchFailure(patch)` `:71-81`（`invalid-patch` / `model-required`）；`setPrefs(key, patch)` `:220-233` —— 判序 `bad-key` → `busy`（在飞零写）→ 载荷两档 → `cwd` 无源 ⇒ `slot-missing` → 写盘（失败 ⇒ `slot-missing`）→ 施加（只对已装配键 `loadAgentSlot`）；出表 `:244` |
| `src/main/ipc.mjs` | 200 行。`HANDLERS` 入册 `:92`（白名单**末位**）；转口 `sessionPrefs(payload)` `:127-129`（载荷 `key` / `patch` 两键；成功 = 宿主回执原样 = 信封五键 `{ok,reason,cwd,slot,meta}`；失败 = 宿主信封 = 四键**恒无 `meta` 键**）；档头 27 + 「`question:respond` 末位」表述卸下（收正见 5.14 项 4） |
| `test/session-prefs.test.mjs`（新 · 209 行） | U127 往返（`:59`：三形 patch 活动槽「落盘 ≡ 回执 `meta` ≡ 内存施加」+ 非活动槽只写盘且不隐式装配）· U128 拒态零写（`:98`：五档 reason 逐例 + 每例断档文不变 + 失败键集恰四键 + 在飞 `busy` 真径 + `cwd` 无源 ⇒ `slot-missing` 而信封 `cwd:null`）· U129 老槽零回填 + 表外归一（`:144`）· U131 档位三记号（`:169`：`off` 照落 ∈ 槽值域 / 表外串于**原非 `null`** 槽亦置 `null` / `Auto` = 清键形 `{effort:null}` ⇒ 未设）· U130 ipc 源面（`:202`：入册行 + 末位 + 转口体字样——本档不 import `ipc.mjs`，沿 U112 源面先例） |
| `test/files.mjs` | 16 行：清单 +1（`test/session-prefs.test.mjs`）—— §2.5:123 在列（`15 ⇒ 17`） |
| `test/history-page.test.mjs`（**清单外 · 必改**） | 105 行：KD-17 零回落 ⇒ 旧 `meta` 期望即红；期望随动 = `effort` 键。属语义随动（非选项）——披露见 5.12 #8 / 5.14 项 3 |

**命令读数（改后复跑 · 终态）**：`cd thincoder-desktop && node test/run.mjs` ⇒ **tests 139 / pass 137 / fail 2**；两红 = `host-floor` U74 / U77，差集**恰 `session:prefs` 一条**（`HANDLERS` 27 ≡ `CHANNELS` 26 未配对 —— 属配对瞬态，见 5.14 项 1，非本舱缺陷）；本舱 U127–U131 五例全绿。`npm test` 读数 = `node test/run.mjs`（实读 `package.json:9`）。

**T-DSK28 ①–⑦ 本舱面回指**（端到端用例跨舱——本表只列写面/回执面可归本舱者）：① 落本槽 + 回执 `meta` = U127（「就地刷本行」= 渲染面，他舱）；② 各自槽值 = U127 非活动槽例；③ 改 A 不改 B = U127 `agents.size` 断言；④ 三拒零写 + 失败缺 `meta` 键 = U128；⑤ 表外 ⇒ `null`（原非 `null` 亦置）+ 余键照改 = U129 / U131；⑥ `effort` 随 `saveSession` 落盘 + 老槽零回填 = U129（落盘字段表 = 舱 1）；⑦ 只送 `provider` ⇒ `model-required` 零写 = U128（候选随动 = T-DSK7 / 他舱）。

### 5.12 决策透明表（舱 2a）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 归一致 `null` 的判定住核（`resolveEffortPatch`）；端侧**零枚举过滤**、档位字面串原样透传 | `IPC.md:108` 项 5「零算法副本」（写面取字面串）；KD-18 枚举单源 = 核 `specForModel`，表外 ⇒ 核归一 `null` | 端侧唯一形判 = 「串 / `null` 白名单」（`agent-host.mjs:71-81`）——不涉枚举成员判定 |
| 2 | `busy` 判在**载荷表验之前**（在飞 ⇒ 即便载荷合法亦拒，恒零写） | 设计判序（「会话级偏好注」项 4 / 项 7：在飞 ⇒ 零写）；`busy` 为独立理由档 | 同族先例 = `send` / `interrupt` 键先于态判；U128 逐 reason 断零写 |
| 3 | `cwd` 无源（未开项目）⇒ 归 `slot-missing`（不新造理由档） | reason 闭集恰五档（`IPC.md:110` 项 7），无 `no-project` 档；判序在载荷之后 ⇒ 合法载荷唯余「槽不可达」一因 | U128 `:134-136` 明例；失败信封 `cwd:null`（项 7） |
| 4 | 写已发生而档不可读（回读 `null`）⇒ **直抛** fail-loud，不吞、不外映射为成功 | 矛盾态（核写口 `true` ∧ 档不可读）无设计口径；静默吞 = 假成功（IPC.md 族「零假成功」） | 不可确定性触发 ⇒ 不设专项用例；形 = `session-slots.mjs:151-152` 显式判 + 注释 |
| 5 | 施加只对**已装配**键（`agents.has(key)`）；未装配 ⇒ 只写盘，不隐式装配 | `IPC.md:107` 项 4：活动 ⇒ 内存即生效 ∥ 非活动 ⇒ 只写盘 | U127 `:85-90` 断「装配表尺寸不变」 |
| 6 | 成功 `meta` 直取宿主回执（`written.meta`），转口层不二次投影；写面与 `pageHistory` 共用同一 `slotMeta` | `IPC.md:59`「回执 = 信封 + `meta`」+ 项 5 零副本；同源同形免两通道口径分叉 | `session-slots.mjs:143-153`；U127 `:69` 按 `history:page` 同源形断言 |
| 7 | 失败信封 `slot:null` · `cwd` 有源取源值 / 无源 `null` · **恒无 `meta` 键** | `IPC.md:95` + 项 7（失败缺 `meta` 键） | U128 `:106/:109/:126/:136` |
| 8 | `test/history-page.test.mjs` 期望加 `effort` 键（**清单外 · 必改**） | KD-17 零回落 ⇒ `meta` 五值投影多一键；不改则原期望即红 = 语义随动不可免 | 已披露（5.11 表 + 5.14 项 3） |
| 9 | `ipc.mjs` 档头 26 ⇒ 27 + 「`question:respond` 白名单末位」表述卸下（改指 `session:prefs`） | `IPC.md:84` 位次 27 = 追加末位；档头计数/枚举与白名单须同动（D3） | 本舱自留收正 —— 配对线（preload）勿再动此档头（5.14 项 4） |

### 5.13 审计与代码评审轮次与终态（舱 2a）

- **内部偏离审计**（explore 只读子代理，阻塞式）：**1 轮 —— clean**（四类偏差全无：无部分实现 AC / 无静默简化 / 无设计档漂移 / 无未披露的清单外改动）；结论随交付报文。审计提出的随动坐标（`preload` / 测试档）并入 5.14（配对面 = 父侧，本舱不动）。
- **内部代码评审**（advisor `type=code`，同步）：**3 轮** —— r1 全量评审 → r2 复核修复 → r3 仅核修复声明；终态 **pass**（无 must-fix 遗留）。
- **fix 轮**：**1 轮**（评审后零语义收正 —— 5 处注释节名「会话族注」⇒「会话级偏好注」项 2/4/7：`agent-host.mjs:215` · `session-slots.mjs:141` · `:146` · `session-prefs.test.mjs:3` · `:106`；**零行为改动**）；改后 `node test/run.mjs` 复跑读数不变（见 5.11）。
- **终态**：converged（审计 clean + 评审 pass + fix 1/5）；实现面收敛，遗留事项**全数**为配对/派单（5.14），本舱无未决缺陷。
- **记录面限度（如实声明）**：本段撰写时，评审各轮的逐条原文与两条非阻塞观察的原文已随本会话压缩不可复读 ⇒ 只记**计数与处置**（轮数 / 终态 / 有无 must-fix / 未改码条数），不复述丢失内容、不虚构。两条非阻塞观察的处置 = **计数 2 · 均未改码**（其一为档位值串「空白边界」口径：端侧 `trim` 判非空 vs 串原样透传 —— 与 `IPC.md:108`「写面取字面串」同向，未改；其二为备忘录性质观察，只记计数）。
- 设计评审 = 父侧发起（本档 §3），不计入本舱轮次。

### 5.14 报父侧（配对承接 · 随动坐标 · 清单外 · 只报不改）

**① 配对面（本舱禁动 · 派单面 = 父侧）：`preload.cjs` 白名单 26 ⇒ 27 —— 必须同笔完成，否则恒两红。** 本舱已实读坐标（写于本段时点 · 写前复核）：

- `src/preload/preload.cjs`（58 行 · 4 处）：`:7` 档头「二十六项 = …」⇒ 二十七项；`:9`「（`question:respond` … 白名单**末位**）」让位；`:12-16` 定序串（`:16`「`batch:status` → `question:respond`」）末补 `→ session:prefs`；`:26` `CHANNELS` 数组行尾追加 `"session:prefs"`（数组 = `:20-27`，**末位**）。
- `test/host-floor.test.mjs`（285 行 · 3 处）：`:6` 档头「`CHANNELS` 二十六项」；**U13** `:88-99`（`:96` 枚举 +1 · `:98` 消息串）· **U74** `:116` 题名 · `:119` `assert.equal(channels.length, 26)` ⇒ 27（消息串同步）· `:122-130`（`:127` 枚举 +1 · `:129` 注「第 14–26 项」⇒ 14–27）· **U77** `:182` 题名。
- `test/projects.test.mjs`（205 行 · 2 处）：**U27** `:159` 题名 · `:173` 枚举 +1 · `:175` 消息串。
- `test/session-contract.test.mjs`（285 行 · 3 处）：`:4` 档头 · **U37** `:148` 题名 · `:158` 枚举 +1 · `:160` 消息串「末十三项 = …」⇒ 末十四项。
- 现红读数 = **恒两红**（U74 / U77 —— 皆断 `HANDLERS(27) ≡ CHANNELS(26)` 两向，差集**恰 `session:prefs` 一条**）。**只动 preload ⇒ U13 / U27 / U37 即转红**（各有全枚举 `deepEqual`）⇒ 上列 **4 档须同笔**；完成后 `node test/run.mjs` 应全绿（本舱无他红）。
- 本舱自留面已收正、**勿再动**：`src/main/ipc.mjs:2` 已「二十七项」· `:7` 已补 `session:prefs`（末位）· `:92` 入册末位。

**② 行数估值随动（只报 —— §2.5 估值 vs 终态实读）**：`ipc.mjs`（§2.5:121）估 `195 ⇒ ~197`，实 **200** · `agent-host.mjs` 估 `204 ⇒ ~219`，实 **245**（含他舱在途改动）· §2.5「`renderer/session-slots.mjs` `~135 ⇒ ~137`」**路径笔误** —— 落点实 = `src/main/session-slots.mjs`（`renderer/` 无此档），实 **154** · `test/session-prefs.test.mjs` 估 `~140`，实 **209**（< 300 行 ✓）。

**③ 清单外改动（已披露 · 随动而非选项）**：`test/history-page.test.mjs`（105 行）—— KD-17 零回落 ⇒ `history:page` 的 `meta` 期望须含 `effort` 键（不改则旧期望即红）；改因 = 本舱改 `session-slots.mjs` `slotMeta` / 回读面，同源期望面须随动。另 `test/files.mjs`（16 行）+1 = §2.5:123 在列。

**④ 只报不改（射程外 · 未动）**：`renderer/views/chrome.mjs:11` 头注指 `UI.md:19` 为「同源同词」句源 —— 现读 `UI.md:19` = 对话流行（该句现落 `UI.md:16/21/23`，疑似 `UI.md` 增行致漂）。舱界外。

**⑤ 交付结论 / 边界**：本舱完成定义 = 代码面全落（U127–U131 绿）+ ① 配对笔落 ⇒ 全套 `node test/run.mjs` 全绿。本舱**不再动** `preload.cjs` / `host-floor` / `projects` / `session-contract` / 渲染面 / 核 / 设计档。工作树含他舱未提交改动 ⇒ **提交动作交父侧**（本舱不做 git 操作）。

### 5.15 记录面更正（舱 2a · 对 5.11 / 5.12 / 5.14 两处表述的实读收正）

1. **`test/history-page.test.mjs` 期望随动方向 = 删回落面（非「加 `effort` 键」）** —— 5.11 表行 / 5.12 #8 / 5.14 项 3 中「期望加 `effort` 键」表述**作废**，实读 diff 为准：删 `loadConfig` import + 三处期望删 `...effortNode`（配置回落面）⇒ U93 槽 4 / 槽 5 期望 = 4 键 / 2 键（无 `effort`）、槽 6 期望 = `{}`，`:64` 消息补「`effort` 不回落配置面」。收益附带 = 该档期望不再依赖本机真实 config（去一处环境耦合）。**必改性不变**（旧期望 spreads 本机配置回落值 ⇒ 与本舱 KD-17 零回落实现相斥即红）。
2. **5.12 #2 依据措辞收正**：「设计判序」宜读作「**档间先后 = 实现选择**（设计无明文序）；设计明文 = 五档闭集 + 在飞 ⇒ **零写**」（`IPC.md:110` 项 7）。选 `busy` 先于载荷表验 = 与「在飞零写」同向且零写不变（仅回执 reason 分档不同），已入 U128 逐 reason 断言。

### 5.16 交付摘要（舱 #88 · 面 = 配对锁舱四档（26 ⇒ 27 同笔）· 2026-09-27）

**面 = 四档**（派单 = 5.14 项 1 配对承接 —— 撤 #85 窄面、换宽面舱 #88 四档同笔；依赖 #83 已满足 · 批档 §2:84）；
设计单源 = `docs/desktop/design/IPC.md` §2（`:79` 二十七项 · `:84` 位次 27 = 追加末位 · `:86` 两向相等 = 用例机检面）。
零核面改动（核三键 = 舱 1，见 5.6）；零主侧注册改动（`HANDLERS` = 舱 2a，见 5.11）。

| 档（实施后实读行数） | 落点（本轮终态实读） |
|---|---|
| `thincoder-desktop/src/preload/preload.cjs`（59 行） | 档头 `:7` 二十七项（`:12` = 本批新行「会话级偏好写面 · 末位」）· 定序串 `:13-17`（`:17` 末补 `→ session:prefs`）· `CHANNELS` `:21-28`（`:27` 末位追加 `"session:prefs"`）。同档另载前序舱笔（`question:respond` 行 `:8-9`/`:24`，非本舱） |
| `thincoder-desktop/test/host-floor.test.mjs`（285 行） | 档头 `:6` 二十七项 · U13 `:96` 枚举 / `:98` 消息 · U74 `:116` 题名 / `:119` 计数 / `:122-130`（`:127` 枚举 · `:129` 注）· U77 `:182` 题名 |
| `thincoder-desktop/test/projects.test.mjs`（205 行） | U27 `:159` 题名 · `:165-176` 枚举（`:173` 末位 `"session:prefs"` · `:175` 消息） |
| `thincoder-desktop/test/session-contract.test.mjs`（285 行） | 档头 `:4`（名面）· U37 `:148` 题名 · `:150-161` 枚举（`:158` 末位 · `:160` 消息） |

**命令读数（12:27 复跑 · 本舱实跑）**：

- 四档语法面：`node --check` × 4 ⇒ 全 OK。
- 本舱四档定向：`node --test test/host-floor.test.mjs test/projects.test.mjs test/session-contract.test.mjs` ⇒ `tests 28 / pass 28 / fail 0`。
- 全量：`node test/run.mjs` ⇒ `tests 139 / pass 138 / fail 1` —— **唯一红非本舱面**（`test/events-reduce.test.mjs:129` U89，`handlers.size` 实 10 / 期 9；成因 = 在途他舱笔，详见 5.19 项 1）。本舱不作全绿声明。

### 5.17 决策透明表（舱 #88）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 四档同笔：计数 / 枚举 / 消息 / 定序四类落点齐改 | 设计 `IPC.md`:79/:84/:86；5.14 项 1「同笔」判据 | U13 / U27 / U37 / U74 / U77 五例交叉锁 —— 单档漏改即红 |
| 2 | `session:prefs` 居**末位**（不插中段） | `IPC.md:84`「追加末位」；`preload.cjs:17`/`:27` 串尾 | 既有十三项序锁定（U74 `:120`） |
| 3 | 不动 `renderer/**`（`session:prefs` 端侧零消费点） | 白名单面 = 本舱交付面；消费点属 4a/4b 面（射程外） | 见 5.19 项 2 |
| 4 | 不动 `src/main/ipc.mjs` | `HANDLERS` 注册已由舱 2a 落地（5.11）⇒ U74 两向已绿 | 本舱零主侧 / 零核面改动 |

### 5.18 审计与代码评审轮次与终态（舱 #88）

- **内部偏离审计**（explore 只读）1 轮：**clean** —— PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST 四类全无（任务书四档 vs 实际触碰面一致）。
  定源手段 = `git blame` + `git diff`：四档未提交笔 = 本舱 26 ⇒ 27 计数面；`host-floor.test.mjs:258`/`:271`（U95 fresh 清单）属批 A 笔；
  `:2`/`:114`/`:121`/`:180`/`:190` 与 `preload.cjs:11` 属 committed `05c0624f8` 既有内容 ⇒ 4 条 🔵 全不在本舱 diff 内。
- **内部代码评审**（advisor `type=code`，同步）1 轮：VERDICT **pass** —— 0🔴 · 0🟡 · 4🔵（零行为面）；fix round = 0/5。
- **4 条 🔵 逐条处置**（均**不动**；均已核为既有笔或跨档孪生句）：

| # | 项 | 处置依据 |
|---|---|---|
| ① | `preload.cjs:11`「设置族十二项（…）与项目级信息两项」（加总读 = 14 ≠ 27；正字 = 设置族十 + 项目级信息二） | 孪生句在 `src/main/ipc.mjs:6-7`（射程外）⇒ 须两处同笔；属「本批」token 零语义收正类（批档 §3 已登记）⇒ 随设计档 / 父侧收正轮 |
| ② | `host-floor.test.mjs:121` 消息「（批 7 段）」（该三项居位次 11–13；设计 `IPC.md:81` 记「批 8 及以前 13」） | committed `05c0624f8` 既有笔，非本舱 diff |
| ③ | `host-floor.test.mjs:190` 消息「（§2.11 ⑤ 序末三）」（现位次 11–13，非序末三；「序末三」全库仅此一处） | 同上；改档会使本轮审计 / 评审证据失效 |
| ④ | `host-floor.test.mjs:2`「本批」指代不可解（同 token 另见 `:114`/`:180`/`:257`/`:282`） | 同上 |

- **终态 = clean**（审计 1 轮 · 评审 1 轮 · fix 0 轮 · 0🔴 遗留）。
- **审计自身限度**：审计舱只读无执行面 ⇒ 命令读数为本舱实跑；5.16 的全量红系本轮在途他舱笔（时点耦合，随后续轮次变化，非本舱可复现的定态）。

### 5.19 报父侧（舱 #88 · 披露 / 只报不改）

1. **🔴 全量非绿披露（非本舱面）**：`node test/run.mjs` ⇒ 138/139；红 = `test/events-reduce.test.mjs:129`（U89）其 `:143` `assert.equal(handlers.size, 9, "九通道全订阅")` 实读 10。
   成因 = **在途他舱笔**：`renderer/events-subscribe.mjs`（本地 12:24 写入；订阅表 `:17-21` 九 ⇒ 十，含 `ev:usage`）+ `renderer/events.mjs:176-178`/`:241` `onUsage` 在场；
   未同笔面 = `preload.cjs:18` 注释「九条」+ `:29-33` `EVENT_CHANNELS`（仍九条）+ `host-floor.test.mjs:7`「恰九」（U76 `:148`）+ `test/events-reduce.test.mjs:143` 计数 9。
   设计归属 = 批 B §2:137（原址补例）+ `:223`/`:225`（评审定「`ev:usage` 须入订阅表 · 三处计数九 ⇒ 十」）⇒ 属 ev:usage / 占用读数舱面。
   **本舱零触碰、未改此红**；已上行 note 预警**同档覆盖风险**（该舱落地须动 `preload.cjs` 与 `host-floor.test.mjs`，请序化写入以免丢本舱 27 计数笔）。
2. **射程外（只报不改）**：① `renderer/**` 无 `session:prefs` 消费点（4a/4b 面）；② `PROJECT.md:103` 记 ipc.mjs ~197 行、实读 **201 行**（归父侧结算轮）；③ 批档 §2:254 两处路径 token 笔误（舱 2a 已报，见 5.14）。
3. **随动坐标**（本舱四档实施后行数）：`preload.cjs` **59** · `host-floor.test.mjs` **285** · `projects.test.mjs` **205** · `session-contract.test.mjs` **285**（归父侧结算轮随动收正）。

### 5.20 交付摘要（舱 3 · 面 = 状态栏上下文占用读数 `ev:usage` + 批 B 十一词键 · 2026-09-27）

面 = 契约面（订阅表 / 归约 / 槽位 / 词表 / preload 白名单）+ **三处计数配对锁同笔**（派单 = 父侧 12:31；依赖 #88 已满足 —— 5.19 项 1 的归因面即本舱）。
设计单源 = `docs/desktop/design/IPC.md` §1（`ev:usage` 行「有效读数〔数字且 > 0〕⇒ 发 · 否则不发」· 白名单 = 本表十通道）+ 批档 §2:107（条目 ⑦ 判据线）+ §2:130（KD-20）+ `docs/desktop/design/UI.md` §1（状态栏读数节点行）。
**视图面不在本舱**（读数节点构树 / 会话头三 `select` / 词表键数账）—— 归因见 5.23 项 1。

| 档（实施后实读行数 · 内容行计法） | 落点（本轮终态实读） |
|---|---|
| `renderer/events.mjs`（351） | `onUsage` `:181-186`（门 `:183` = 非数 ∨ 非正 ⇒ 原引用 · 同值 `:184` 原引用 · 写 `:185` 按 `ev.key` 写切片）· `reduce` `:241` `case "ev:usage"` · 计数注 `:2` / `:4` / `:84` 九 ⇒ 十 |
| `renderer/events-subscribe.mjs`（68） | `CHANNELS` `:17-21`（`:20` 含 `"ev:usage"`）· 注 `:2` / `:6` / `:17` / `:28` 九 ⇒ 十（**零增量** —— 原地改形） |
| `renderer/store.mjs`（313） | `initialState` `:46` `usage: {}` · 槽位登记注 `:32-33`（写者 = `ev:usage` 归约 · 消费面随视图舱） |
| `renderer/i18n.mjs`（353） | 十一键 × 两语：en `:67-68` / `:80-82` / `:165-170`；zh `:197-198` / `:210-212` / `:295-300` |
| `src/preload/preload.cjs`（58） | 头注 `:18` 十条 · `:29`「八通道 = 九回调映射 · `ev:usage` / `ev:error` 宿主自产」注 · `EVENT_CHANNELS` `:30-33`（九 ⇒ 十 · `ev:usage` 插 `ev:task` 与 `ev:error` 间） |
| `test/host-floor.test.mjs`（284） | 档头 `:7` 恰十 · U76 `:148` 题名 / `:151` 计数（十项 · 注 = 九回调映射八通道 + 宿主自产两条）/ `:154-155` 枚举 |
| `test/events-reduce.test.mjs`（285） | `:145` `handlers.size` = 10 · T-DSK29 `:253-285`（按 key 写切片 / 门五值判原引用 / 同值原引用 / 他键零写 / 十通道接线与十路全退） |
| `test/store.test.mjs`（334） | **清单外（强制随动锁）**：U75 键集 `:240` 含 `"usage"` · `:246` 槽位在册断言 |
| `renderer/app.mjs`（222） | **清单外（计数注同笔）**：`:15` / `:209`「九通道订阅」⇒ 十 |

**命令读数（本轮复跑 · 本舱实跑）**：

- 语法面：全档 `node --check` ⇒ OK。
- 全量：`cd /d d:\teamcode\thincoder\thincoder-desktop && node test\run.mjs` ⇒ `tests 140 / pass 139 / fail 1`。
  唯一红 = `test/views-chrome.test.mjs:206`（U51 · 断言 `:210` `keys.length` 期 **110** / 实读 **121**）—— **本舱面外**（词表键数账 = 视图舱面；账与收正要见 5.23 项 1）。本舱判据行面全绿：T-DSK29 · U76 · U75 · U89 皆 pass。

### 5.21 决策透明表（舱 3）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 门 = 非数 ∨ 非正 ⇒ 原引用（含 `NaN` / 零 / 负数）；**零上界判** | `IPC.md` §1 `ev:usage` 行（有效读数 = 数字且 > 0）· 同行量纲句（0–100 由核直传 ⇒ 本档零重算） | `Infinity` 过门不裁 —— 评审 🔵 ①（见 5.22）；门口径已在码内注 `:178-180` |
| 2 | 同键同值 ⇒ 原引用（零重绘） | 本仓归约面既有习语（`store.mjs` `set` 逐键比较 · U28） | 判据句未禁；T-DSK29 机检在册 |
| 3 | 槽位 = `usage: {}` 顶层注册（非 `null`） | 切片定形惯例（`sessionMeta` / `questions` 同形）+ U75 键集锁 | 写者 = `ev:usage` 归约；消费面（读数节点）归视图舱 |
| 4 | 十一词键两语同笔（22 行 · 同族逐位同序） | 需求 §3.5（复制 / 附件 / 会话头 / 档位 / 占用读数）· U44 / U51「两语键集相等」 | 机读：宿主键数 121（= 110 + 11） |
| 5 | `ev:usage` 插 `EVENT_CHANNELS` **`ev:task` 与 `ev:error` 间**（非末位） | 序 = 桥面表（`preload.cjs:29` 注：八通道序 + 宿主自产两条） | 与 U76 枚举逐位对位 |
| 6 | 三处计数配对锁同笔（`preload.cjs` 十条 / U76 恰十 / 归约面 `handlers.size` 10） | 批档 §2:225（评审定「`ev:usage` 须入订阅表 · 三处计数九 ⇒ 十」） | 三处交叉锁 —— 单处漏改即红 |
| 7 | 不动 `src/main/**`（含 `session-slots.mjs:97`「九条 `ev:*`」） | 宿主发射端不在本舱面 ⇒ 只报不改（5.23 项 2） | 机读：`src/main/**` 零 `usage` 接线 |

### 5.22 审计与代码评审轮次与终态（舱 3）

- **内部偏离审计**（explore 只读 · 阻塞）1 轮：**DEVIATIONS** —— PARTIAL 1（全量 U51 红 · 归因视图舱面）· OUT-OF-LIST 1（`test/store.test.mjs:240/:246` U75 键集随动 = 强制锁 · 已披露）· SILENT-SIMPLIFICATION **无** · DOC-DRIFT **本舱面无**。
- **内部代码评审**（advisor `type=code` · 同步）1 轮：VERDICT **pass** —— 0🔴 · 2🟡 · 5🔵，**无 must-fix**；fix round = **0/5**。
- 🟡 两条处置：① `RENDERER.md:19` / §1.1 未登记 `usage` 切片 ⇒ 设计档 doc 层（归父侧收正轮，本舱零文档改动）；② 四档 >300 行（`events.mjs` 351 · `store.mjs` 313 · `i18n.mjs` 353 · `store.test.mjs` 334）⇒ 三档在册有预案 · `store.test.mjs` 为测试档（非新档）⇒ 不扩面。
- 🔵 五条处置（**一律不扩面** · 均在本舱任务书机检面外）：① 门语义（`Infinity` 过门 / 非正数留旧值 —— 与 KD-20 字面「未至 / 非正数 ⇒ 零节点」存在解释差）⇒ 按 `IPC.md` §1 行字面落形并在码内注口径；若父侧要改（非正数留旧值 / 上界裁）须先改设计档字面。② 两表名集互等缺独立断言（`EVENT_CHANNELS` vs `CHANNELS`）· ③ U33 只断长度 ⇒ 属既有用例面，子代理不扩面（父侧要加可另派）。④ `preload.cjs:11`「设置族十二项」加总读 ≠ 27 ⇒ 既有笔（与 5.18 项 ① 同源）。⑤ 行数账 ⇒ 见下「行数计法说明」。
- **行数计法说明（收正 5.16–5.19 与本舱读数之差）**：本档既有「行数」= `split("\n")` 计法（含尾换行行）；本舱用**内容行**计法（= `split` 值 − 1）。两计法差恒 1 ⇒ 5.16「`preload.cjs` 59」/ 5.19「`host-floor` 285」与本舱「58 / 284」**同为真读数**（非笔误）。建议后续随动收正统一为内容行计法或明确标注计法。
- **终态 = clean**（审计 1 轮 · 评审 1 轮 · fix 0 轮 · 0🔴 遗留）。

### 5.23 报父侧（舱 3 · 披露 / 只报不改）

1. **全量残留红（本舱面外 · 归因视图舱）**：`node test\run.mjs` ⇒ `140 / 139 / 1`；红 = `test/views-chrome.test.mjs:206` U51（`:210` 断言 `keys.length` 期 110 / 实读 **121**）。
   账：**110 + 11 = 121 ✓** —— 本批十一键 = `chat.action.copy` / `chat.action.copyLast` 2 + `composer.attach.remove` / `nonvision` / `partial` 3 + `head.field.provider` / `model` / `effort` 3 + `effort.auto` / `off` 2 + `status.usage` 1。
   家族链重算（合 121 · 与本批十一键逐族对位）：左列 13 + 标签条 4 + **对话流 8**（6 + 2）+ 活动池 7 + 审批卡 7 + 提问卡 3 + 设置 48 + 首启向导 10 + 信息行 9 + **输入区 6**（3 + 3）+ **会话头 3**（新）+ **档位 2**（新）+ **状态栏 1**（新）= 121。
   收正要求（视图舱同笔）：断言字面收 121 + 用例题名与消息的家族链同收（现值 110 与「对话流 6 / 输入区 3」为陈旧账）。
   本舱**零触碰** `views-chrome.test.mjs`（偏离审计 `git diff` 归因确认）。
2. **射程外（只报不改）**：① `src/main/session-slots.mjs:97`「九条 `ev:*` 通道」⇒ 应十；② `test/agent-host.test.mjs:129-130` U82 题名「九回调 → 九通道」⇒ 依 `agent-bridge.mjs:56-75`（九回调产出**八**通道：`ev:activity` / `ev:token` / `ev:tool-call` / `ev:tool-output` / `ev:tool-result` / `ev:task` / `ev:approval`〔经 `askSingle` / `askBatch`〕/ `ev:question`〔经 `askQuestion`〕）+ 宿主自产两条 = 十；③ 主侧零 `ev:usage` 发射端（机读 `src/main/**` 无 `usage`）⇒ 推面归主侧舱。
3. **随动坐标（本舱九档实施后 · 内容行计法）**：`renderer/events.mjs` **351**（§2.5 估 ~344）· `renderer/events-subscribe.mjs` **68**（§2:231 现值 68 ⇒ 零增量）· `renderer/store.mjs` **313**（§2.5 估 ~313 ✓ 命中）· `renderer/i18n.mjs` **353**（§2.5 值列 317 ⇒ ~327 · 超估值 26）· `src/preload/preload.cjs` **58**（§2.5 值列 57 ⇒ 58 ✓ 命中）· `test/host-floor.test.mjs` **284**（值列外 · 配对锁面）· `test/events-reduce.test.mjs` **285**（§2:231 记 249 ⇒ +36 · 未跨 300 层）· `test/store.test.mjs` **334**（清单外边）· `renderer/app.mjs` **222**（清单外边）。
4. **文档面（归父侧 / 设计侧）**：`docs/desktop/design/RENDERER.md` §1.1 未登记 `usage` 切片（评审 🟡①）· `docs/desktop/design/PROJECT.md` 三处「九通道」计数待收十（§2:233 项 7 已在册）—— 本舱零文档改动。

**补记（读数核对 · 供 5.23 项 1 收正）**：U51 断言序 = 先长度 `:210` 后两语键集相等 `:211` ⇒ 现值下 `:211` 及以下**不可达**（长度断言先红中止）。
两语键集相等的**活证** = `test/views.test.mjs:148`（U44 · 本轮 pass ✓）：`[...Object.keys(HOST_DICT.en)].sort() ≡ [...Object.keys(HOST_DICT.zh)].sort()` ⇒ 键集两语相等**已机检为真**；`en` 键数 **121** = U51 实读值。
⇒ 视图舱收正只动 `:206` / `:210` 的题名与家族链字面即可（键集 / 哨兵各断随长度过门后自然复跑）。

### 5.24 交付摘要（舱 #89 · 面 = 状态栏占用读数 `ev:usage` 宿主发射端 · 2026-09-27）

派单 = 条目 ⑦ 的**产出侧**（舱 3 = 消费侧 · 见 5.20–5.23）：核读数 `historyPercent` 直传 + 回合尾出帧；舱 3 登记的射程外项 ①（`src/main/session-slots.mjs:97` 计数）本舱一并收正。
设计单源 = `docs/desktop/design/IPC.md`:21（产出方「宿主回合尾结算 · 与回合尾三径同点 · 读数单源 = `thincoder-core/token-window.mjs:160`」）· `:24`（`ev:usage` 非回调映射 · 宿主自产）· `:26`（十通道一律携 `key`）· `:41`（载荷 `{key,percent}` = 核直传 · 端零重算 · 门「数字 ∧ > 0 ⇒ 发」）· `:46`（键面 = `String(slot)`）；批档 §2:115（条目 ⑦ 判据线）+ §2:138（KD-20）。

| 判据（条目 ⑦ · KD-20） | 落点（终态实读） | 机检 |
|---|---|---|
| 回合尾发射 · 与三径同点（落盘后 · 终局帧前） | `src/main/agent-host.mjs:149-153` `postUsage` + 调用点 `:205`（done）/ `:210`（stopped · error） | U133（三径各恰一帧）· U97（落盘序） |
| 值 = 核投影（端零重算 · 无夹值） | `:150` `historyPercent(agent?.history ?? [], agent?.provider)` | U132 · U137 |
| 门 = 数字 ∧ `> 0` ⇒ 发；否则零帧（禁假造） | `:151` `typeof percent !== "number" \|\| !(percent > 0)` ⇒ `return` | U134（空史 0 ⇒ 零帧）· U135（在飞 ⇒ 零帧） |
| 载荷 `{key,percent}` · 键面 = `String(slot)` | `:152` `post("ev:usage", { key, percent })` | U132 · U136（逐回合各一帧 · 值随本回合） |
| 读数域 = `agent.history`（工作史 · 非 `_fullHistory` 记账面） | `:150` 取 `agent.history` | U137（判别臂：二史分歧 39 vs 10 ⇒ 值随工作史） |

**命令读数（本轮复跑 · 本舱实跑）**：

- 单档：`cd /d d:\teamcode\thincoder\thincoder-desktop && node --test test\agent-host-usage.test.mjs` ⇒ `pass 6 / fail 0`（U132–U137）。
- 全量：同目录 `node test\run.mjs` ⇒ `tests 146 / pass 145 / fail 1`；唯一红 = `test/views-chrome.test.mjs:210`（U51 · 期 110 / 实读 121 键）—— **本舱面外**（视图舱陈旧键数账 · 账与收正见 5.23 项 1 与 5.23 补记）。
- 语法面：四档 `node --check` ⇒ OK（本舱 3 处注释收正后复跑同绿）。

**档面（内容行计法 = `split("\n") − 1`）**：`src/main/agent-host.mjs` **258**（§2.5 值列 `204 ⇒ ~219` ⇒ 超估 · 未越 300）· `src/main/session-slots.mjs` **154** · `test/agent-host-usage.test.mjs` **183**（新档 · 不越 300）· `test/files.mjs` **16**（`split` 值 17 ≡ §2.5 值列 `15 ⇒ 17` ✓）。
**清单两向**：`test/files.mjs` 31 项 ≡ 盘上测试档 31（助手四档 `fake-dom` / `run` / `slot-sandbox` / `views-harness` 与 `files.mjs` 自身不入清单）；全量 U52「清单两向」pass 为活证。

### 5.25 决策透明表（舱 #89）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | `postUsage` **零本地守卫 · 零夹值**（不 try/catch · 不上界裁） | `IPC.md`:41 字面「核读数直传 · 端零重算」—— 夹值 / 兜底 = 第二口径（舱 3 消费侧同理） | 不抛前提入注 `:148`（= `agent.history` 恒数组：核 `agent.mjs:64` 装配缺省 · `session-lifecycle.mjs:108` 接续恒置）；评审 🔵③ |
| 2 | 门**只管下界**；窗口超限 ⇒ `> 100` 理论可达 ⇒ 本舱不裁 | `:41` 门字面（数字 ∧ > 0）+ 核 `historyPercent` 无夹值（`token-window.mjs:160-161`） | 量纲句「0–100 整数」与核无夹值的张力 = **文档层面**（5.27 项 1①；宿主夹值 ⇒ 破「端零重算」故不做） |
| 3 | 评审判定后落 **3 处零语义注释收正** | 评审 🔵②③④ 受理 —— 均在本舱**已触行**上 | 收正项：`session-slots.mjs:97` 键面枚举补 `session:prefs` · 档头 ④ 补读数面 · `postUsage` 注补不抛前提；零行为面 ⇒ 全量复跑为证 |
| 4 | 两调用点**只在 `send` 三径**（`ensure` / `setPrefs` 径零发射） | KD-20「回合尾」+ `IPC.md`:21「与回合尾三径同点」 | U135 反向锁（在飞 ⇒ 零帧）；「门后不发」≠「永不发」（U134 两判据分立） |
| 5 | 新档独立成 `test/agent-host-usage.test.mjs`（不寄靠 `agent-host.test.mjs`） | §2.5:153 原址补例三档（`settings` / `events-reduce` / `views-chrome`）无一覆盖宿主发射端 ⇒ 按面拆档（U132–U137 · 六例） | **声明面外**（§2.5:147 新档四未列）⇒ 5.27 项 2① 已披露 |

### 5.26 审计与代码评审轮次与终态（舱 #89）

- **内部偏离审计**（explore 只读 · 阻塞）1 轮：PARTIAL **无** · SILENT-SIMPLIFICATION **无**（五判据逐条在场）· OUT-OF-LIST **无**（文件面 = §2.5 声明面 + 新档一枚 · 5.27 项 2 披露）· DOC-DRIFT 3 条 🔵（值列 / 坐标 / 登记面 · 只报不改 ⇒ 5.27 项 1 / 项 3）。
- **内部代码评审**（advisor `type=code` · 同步）1 轮：VERDICT **pass** —— 0🔴 · 1🟡 · 3🔵 · **无 must-fix** ⇒ 不跑轮 2。
- **响应表（4 行 · 逐行受理 · 无驳回）**：

| # | 级 | 评审发现 | 处置 |
|---|---|---|---|
| ① | 🟡 | `IPC.md:41` 量纲句「0–100 整数」vs 核无夹值 ⇒ `> 100` 可达；宿主直传合规，张力归文档层 | **受理 · 只报不改**（宿主不夹值 · 见 5.25 项 2 ⇒ 5.27 项 1①） |
| ② | 🔵 | `session-slots.mjs:97` 键面消费方枚举漏 `session:prefs` | **受理 · 已收正**（同行补一枚 · 零语义） |
| ③ | 🔵 | `postUsage` 无本地守卫 ⇒ 抛错将吃掉终局帧（现链不可达） | **受理 · 注面收正**（不抛前提入注 · 守卫不加 · 见 5.25 项 1） |
| ④ | 🔵 | 档头「五职责」未登记 `ev:usage` 自产面 | **受理 · 已收正**（④ 行内补读数面 · 零语义） |

- **评审坐标校验器误报（本舱复核）**：评审自带校验器报「5 条 `IPC.md` 引用与现档不符」；本舱逐条重读 ⇒ `:21` / `:24` / `:26` / `:41` / `:49` / `:59` 引文与盘面**逐字相符**；校验器所列片段（`" | ` / `"- ` 等）系抽取残片而非引文 ⇒ 判误报（真坐标 = 5.24「设计单源」行）。
- **fix round（共 1 轮 · 上限 5）**：审计 nit 2 处（U132 断言改 `deepEqual`〔读数帧 ≡ 终局帧 ⇒ 零再写〕· 新增 U137 判别臂）+ 评审后零语义注释 3 处（5.25 项 3）。
- **终态 = clean**（审计 1 轮 · 评审 1 轮 · 0🔴 遗留 · 本舱判据行全绿）。

### 5.27 报父侧（舱 #89 · 披露 / 只报不改）

1. **文档面漂移（只报不改 · 归父侧 / 设计侧）**：① `IPC.md`:41 量纲句「0–100 整数」与核 `historyPercent` 无夹值并存 ⇒ `> 100` 可达；显示面（`UI.md` §1 状态栏行）无 `> 100` 判据句 ⇒ 归父侧裁（评审 🟡①）—— 本舱零文档改动。② `IPC.md`:22 `ev:error` 行宿主坐标 = `agent-host.mjs:178` ⇒ 现值 = `send` 注行（结算分支今在 `:208-213`）⇒ 陈旧坐标。③ §2.5:145 值列 `agent-host.mjs 204 ⇒ ~219` 与实读 258 行差 ⇒ 随动收正（值列为估值 · 非缺陷）。
2. **声明面外（已披露）**：① 新档 `test/agent-host-usage.test.mjs`（第五档 · §2.5:147 新档四未列）—— 归口理由见 5.25 项 5。② `test/files.mjs` 登记新档 ⇒ **在声明面内**（§2.5:147 `15 ⇒ 17`），实读 16 内容行（`split` 17 ✓）。③ `src/main/session-slots.mjs:97` 计数注九 ⇒ 十 —— **§2.5 值列未列本档**（值列只有 `renderer/session-slots.mjs`）；理由 = 第十通道（`ev:usage`）使该注陈旧 · 舱 3 已按射程外登记（5.23 项 2①）· 本舱为宿主面 ⇒ 一并收正（零语义）。
3. **登记面（只报不改 · 非缺陷）**：① `test/host-floor.test.mjs:253-264` U95 `fresh` 臂清单 = **码面池**（新档 ≤ 300 行约束面）⇒ 测试档天然不入池；本舱新档 183 行（不越 300）。② `test/agent-host.test.mjs:130` U82 题名「九回调 → 九通道」与他舱面计数账不严格对账（舱 3 已按射程外登记 · 5.23 项 2②）—— 本舱零触碰该档。

### 5.28 交付摘要（舱 4b · 面 = 附件渲染面（采集 / 条 / 出口）+ 元素形 `.id` 随动 · 2026-09-27）

派单 = 条目 ⑧（D13）**渲染面半** + §1.5 随动收编（`renderer/views/settings.mjs:101` 串过滤 ⇒ 元素形投影）。复制渲染面（`views/chat-copy.mjs`）· 主侧落盘 / `degraded` 回执（`src/main/**`）**不在本舱** ⇒ 见 5.31 项 1 / 项 6。

设计单源 = `docs/desktop/design/UI.md` §1 输入区行「批 B 注」· `docs/desktop/design/IPC.md` §2「附件注」；批档 §2:131（条目 ⑧ 判据线）· §2:154（KD-21）· §2:162（新档四）· §2:168（测试面）。

> **行内引用一律 unverified**：本舱自读行对（下表「落点」列）为实读；评审行内引文经机检 10/10 均不符盘面 ⇒ 不复述（见 5.30 末行）。

| 判据（条目 ⑧ 渲染面半 · KD-21） | 落点（终态实读） | 机检 |
|---|---|---|
| 粘贴采集：图像项入列；非图**零动作**（不 `preventDefault` · 不吞事件）；`kind!=="file"` / 空项零动作 | `renderer/attach.mjs:41-50` `pasteImages` | U138 |
| 读面 = `FileReader` → `dataURL`（唯一 IO · 零落盘 / 零 `node:` 引入） | `attach.mjs:53-64` `fileToDataURL`（`:61` 原错保真） | U138 · U5（渲染面零 `node:` 闭包） |
| 采集汇总**零拒绝面**（读失败 = 一行诊断 + 已收项返回；`pasteImages` 同步抛 ⇒ 收进 try 区） | `attach.mjs:69-88` `collectImages`（`:75` 诊断行 · `:66-68` 头注记前提） | U138（环境缺 `FileReader` ⇒ 拒绝 · 已收项保留） |
| 逐项三件 = 缩略图（`img.composer-attach-thumb`）+ 文件名（**有给才落** · 零伪造）+ 移除键（`data-action="attach:remove"` 携 `data-attachment-id`） | `attach.mjs:103-124` `itemNode`（`:107` / `:109-111` / `:112-122`） | U139（两态） |
| 条根锚 `data-attachments` 住 `[data-slot="composer"]` 内直子；空 ∥ 非数组 ⇒ `null`（零节点） | `attach.mjs:127-135` `attachmentBar` | U139（空条零节点 · 子序）· U51（附件两树 + `data` 串） |
| 出口 `toImages` **恰形** `{name,mime,dataURL}`（`id` 不出面 · 零项 ⇒ 零键） | `attach.mjs:91-100` `toImages` | U140 |
| 降级**闭集两值**（`non-vision` / `partial`）· 表外 ⇒ `null` + 一行诊断 | `attach.mjs:138-146` `degradedNotice` · `mount-composer.mjs:258-265` `onReceipt` | U139（两值 + 表外 null 臂） |
| 清条判据：**仅 `outcome==="sent"` 清条**（`queued` 清文本留图 · 失败 ⇒ 文本 + 图皆留） | `mount-composer.mjs:270-281`（`:277` 清条 · `:276` 早返） | U141（三径） |
| 条目号源（`a1…` 会话内自增）· 移除出口（锚键 ⇒ 过滤 · 树锚与条目 `id` 同源） | `mount-composer.mjs:229-232` `nextAttachmentId` · `:252-255` `onRemoveAttachment` | U141 |
| `.id` 随动（`model:list` 元素形 ⇒ 投影取 `id` · `null` 过滤） | `renderer/views/settings-sections.mjs:112` `modelIdOf`（单源导出）+ `renderer/views/settings.mjs:101` 投影（`:19` 引入；向导经 `settingsModel` 自动覆盖） | **无元素形机检**（见 5.31 项 2） |

**命令读数（本轮实跑）**：

- 单档：`cd /d d:\teamcode\thincoder\thincoder-desktop && node --test test\views-attach.test.mjs` ⇒ `pass 4 / fail 0`（U138–U141 · 修复后复跑）。
- 全量：同目录 `node test\run.mjs` ⇒ `tests 150 / pass 149 / fail 1`；唯一红 = `test/views-chrome.test.mjs:211`（U51 · 期 110 / 实读 121 键）—— **本舱面外**（陈旧键数账 · 归口台账 #86 · 账见 5.23 项 1 与补记）。
- 语法面：五档 `node --check` ⇒ OK。

**档面（内容行计法 = `split("\n") − 1`）**：`renderer/attach.mjs` **146**（§2.5 新档估值 ~90 ⇒ 超估 · 不越 300）· `renderer/mount-composer.mjs` **314**（§2.5 值列 `262 ⇒ ~282` ⇒ 超估 32 · 越 300 advisory ⇒ 5.31 项 3）· `renderer/views/settings-sections.mjs` **215**（§2.5 值列 `206 ⇒ ~215` ⇒ 命中）· `renderer/views/settings.mjs` **295**（值列外边 · §1.5 随动收编面）· `test/views-attach.test.mjs` **283**（新档 · 不越 300）· `test/views-chrome.test.mjs` **444**（值列外边 · 存量）· `test/files.mjs` **17**（§2.5 值列 `15 ⇒ 17` 命中）· `test/host-floor.test.mjs` **286**（本舱笔 = U95 `fresh` 臂清单 +1 枚 · 码面池随动）。

### 5.29 决策透明表（舱 4b）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 采集只管图像项；非图**不 `preventDefault`** ⇒ 文本照粘贴 | 条目 ⑧ 判据线「非图零动作」+ 不吞键纪律 | U138 反证（零 `preventDefault` 调用）；`items.length===0` ⇒ 零重绘 |
| 2 | 读失败 = **零拒绝面**（收进 try · 已收项返回 · 一行诊断） | 拒收面会漏到 `mount-composer.mjs:244` 无 `.catch` 的 `.then` 链 | fix 轮自评审 🔵 采纳后定形 ⇒ 该链自洽 |
| 3 | `reader.error` **原错保真**（`?? new Error("read failed")`）· 仅窄判 `instanceof` | 评审 🔵：包裹错误碎调用方归因 | `attach.mjs:61` |
| 4 | 降级条目**零移除键**（只读态 · 面板尾注恒在 · 两值同形） | `UI.md` §1 输入区「批 B 注」+ KD-21 | U139 两值臂 |
| 5 | 附件条 = **树描述符**（零 DOM 构建 · 复用 `wire` / `withKey`）；条根锚 = 槽内直子 | 既有 `composerTree` 形态（U119 接线面同源） | U139 子序臂 |
| 6 | `toImages` = 出口投影单源；**入队径不携图**（无 `id` 键 ⇒ 载不了附件） | 通道只认恰形；入队条目载不了附件 | U140 恰形臂 · U141 失败 / 忙态留图臂 |
| 7 | 清条 = **sent-only**；`queued` 清文本留图；失败两留 | 「宁留不丢」+ 派单口径 | `:267-269` 注记判据 |
| 8 | `modelIdOf` = `settings-sections.mjs` **单源导出**（设置面 + 向导同覆盖） | §1.5 随动收编 + 单源纪律 | 向导经 `settingsModel`（`onboarding.mjs:32`）自动覆盖 · 零第二处形判 |
| 9 | **零 CSS**（缩略图 / 移除键无尺寸规则） | CSS 面归样式档（本舱零样式档改动） | **设计缺口披露**（5.31 项 5） |
| 10 | `collectImages` 无注入面（测里桩 `globalThis.FileReader`） | 既有 `mount-composer` 假宿主先例 | U138 桩面 · 平 node 可跑 |

### 5.30 审计与代码评审轮次与终态（舱 4b）

- **内部偏离审计**（explore 只读 · 阻塞）1 轮：SILENT-SIMPLIFICATION **无**（判据逐条在场）；3 只报项 = ① 临时探针档（**已在盘删** · 非交付面）② `mount-composer.mjs` 314 行（越 300 advisory ⇒ 5.31 项 3）③ `PROJECT.md:146/148/153` 行数估值漂移（登记面 · 只报不改 ⇒ 5.31 项 7）。
- **内部代码评审**（advisor `type=code` · 同步）**2 轮**：r1 VERDICT **pass**（0🔴 · 4🟡 · 4🔵 · **无 must-fix**）；r2 fix-claims VERDICT **pass**（机检 13/19 匹配；6 处不匹配 = 评审自引其修复前旧文 ⇒ 正确陈旧归因 · 零新缺陷）。
- **响应表（已采纳 · 逐条可核）**：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| ① | 🔵 | `collectImages` 拒绝面会把异常漏进无 `.catch` 的 `.then` 链 | **受理 · 已修**：try 收口 + 返回已收项（`attach.mjs:69-88`） ⇒ 零拒绝面 |
| ② | 🔵 | 读失败包成新错误 ⇒ 碎归因 | **受理 · 已修**：原错保真（`attach.mjs:61`） |
| ③ | 🟡/🔵 余项 | （注面 / 只报面） | **受理**：注面收正随修落盘；只报项归 5.31 |

- **评审行内引文一律 unverified**：其行内坐标机检 **0/10** 匹配盘面 ⇒ 本档不复述其引文（真坐标 = 5.28「设计单源」行与本档行对）。
- **fix round（共 1 轮 · 上限 5）**：两处（5.29 项 2 / 项 3）；临时探针档已删 · 临时改动的 U51 `:211` 计数行**已还原原文**。
- **终态 = clean**（审计 1 轮 · 评审 2 轮 · 0🔴 遗留 · 本舱判据行全绿；唯一全量红 = 面外陈旧账 #86）。

### 5.31 报父侧（舱 4b · 披露 / 只报不改）

1. **主侧附件面**全缺**（面外 · 决定性）**：`src/main/**` 对 `images|dataURL|degraded` **零命中** ⇒ ① `msg:send.images` 无消费者（图被丢弃）② 降级回执不产生 ③ `IPC.md` §2「附件注」2/3/4/6 无实现（落盘 / 指针 / 门 / 回执）。本舱仅渲染面半 ⇒ 端到端不可达（T-DSK30 走查面）。
2. **`.id` 元素形机检缺口**：`test/views-harness.mjs:128` 假回执仍**串形** ⇒ 投影面零元素形用例；归口舱 4a（其声明面）—— 本舱只落单源 + 投影，**不加例**（避重复面）。
3. **`mount-composer.mjs` 314 行**（§2.5 估 ~282 ⇒ 超 32 · 越 300 advisory）—— 估值漂移 + 跨层 ⇒ 只报不改（拆档 = 结构改动 · 归父侧裁）。
4. **队列 + 附件缺口**：入队条目载不了附件 ⇒ `queued` 径附件不可达（留图 = 缓解，非功能）。
5. **零 CSS**：缩略图 / 移除键无尺寸规则 ⇒ 条面形未定（设计缺口 · 归样式档）。
6. **`views-attach.test.mjs` 覆盖边界**：**不含复制面**（`views/chat-copy.mjs` = 他舱面）· 无真粘贴事件 / 真剪贴板（人工走查面）。
7. **登记面（只报不改 · 非缺陷）**：① `PROJECT.md:145` 等行数登记 = **估值**（§2.5 表头自注）② `docs/desktop/design/PROJECT.md:146/148/153` 估值漂移（审计 ③）③ 设置面档位 `select`（⑥ 消费面）未落 —— 本舱零触碰，状态归 ⑥ 舱 ④ U51 **九键无消费者** + 计数链陈旧（`:65` 注 / `:211` 断言 = 110 vs 实读 121）+ 新增覆盖不可达（`:321` 全等断言在 `:211` 红下不可达）—— 两层收正须一并做 · 归 #86。
8. **用例号自铸**：U138–U141（既有号段无空位 · 已核 `views-chat` / `views-attach` 两档占用面）—— 披露求编号归口。

### 5.32 交付摘要（舱 #93 · 面 = 附件**主进程半**（受理门 / 落盘 / 交核 / 非视觉门 / 回执 / 清理）· 2026-09-27）

派单 = 条目 ⑧（D13）**主进程半**（§5.31 项 1「主侧附件面全缺」收口 · 立舱源 = §1.12:123）。
设计单源 = `docs/desktop/design/IPC.md` §2「附件注」项 1–6（:112-119）+ §2:61（`msg:send` 行 · 回执三形）；批档 §2:139（条目 ⑧ 判据线）· §2:162（KD-21）· §2:168（测试面）。

| 判据（项 1–6 · KD-21） | 落点（终态实读） | 机检 |
|---|---|---|
| 受理门（项 1）：`images` 逐项 `{name,mime,dataURL}`；缺省 / 空数组 ⇒ **无附件径**（文本原样 · 零落盘零注入） | `src/main/attachments.mjs:104-107` `prepareTurnAttachments` | U142 |
| 非视觉门（项 4）：`specForModel(model).multimodal` 假 ⇒ **不落盘不注入** + 文本尾一行说明（词键面 = 渲染面词表 · 语言经核归一）；门**先于**阈 | `attachments.mjs:108-110` + 词面读数 `:46-52` `noticeText` | U143 |
| 落盘（项 2）：`<cwd>/.thincoder/tmp/paste-<ts>-<i>.<ext>` ⇒ 交核 = **绝对路径数组**；指引行同核函数（`appendImagePointer` ⇒ 零分歧） | `attachments.mjs:63-96` `writeImages` · `:113` 交核 · `:21` import | U144（命名形 / 绝对路径序 / 指引行） |
| 阈与弃（项 3）：单项超 `IMAGE_MAX_BYTES` 弃 · 合计超 `TURN_MAX_BYTES` 的**超出部分**弃 · 落盘失败弃 —— 皆不阻断 ⇒ `degraded:"partial"` | `attachments.mjs:29,:31` 常量 · `:81-95` 预算式循环 | U144（弃项五源） |
| 回执（项 5）：`{ok:true}` ∥ `{ok:true, degraded}`（闭集两值）；坏径（`bad-key` / `busy` / `provider-invalid`）**先于**装配 ⇒ 图零落盘 | `src/main/agent-host.mjs:188-206` 坏径段 · `:209-211` 装配 · `:228` 回执 | U145（挂点序 · 坏径零落盘） |
| 清理（项 6）：回合尾（三径同一 `.finally`）清**本回合**件；先释放锁再清理；失败 `console.error`（不阻断结算） | `agent-host.mjs:224-227` · `attachments.mjs:119-125` `cleanupTurn` | U144（只删本回合件）· U145（三径同清理） |
| 透传（§2:61 载荷形）：`msg:send` 第三参 `images` 转口宿主 + JSDoc 三形回执 | `src/main/ipc.mjs:134` `msgSend`（`:131-133` 注） | U74 / U77（源面白名单机检） |

**命令读数（本轮复跑）**：
- 单档：`cd /d d:\teamcode\thincoder\thincoder-desktop && node --test test\attachments.test.mjs` ⇒ `tests 4 / pass 4 / fail 0`（U142–U145）。
- 全量：同目录 `node test\run.mjs` ⇒ `tests 154 / pass 153 / fail 1`；唯一红 = `test/views-chrome.test.mjs:211`（U51 · 期 110 / 实读 121 键）—— **本舱面外**（渲染面词表陈旧账 · 归口 #86 · 同 5.28 记载）。
- 语法面：三档 `node --check` ⇒ OK。

**档面（内容行计法 = `split("\n") − 1`）**：`src/main/attachments.mjs` **125**（**新档** · §2.5「新档四」**无此档** ⇒ 越声明披露 · 见 5.35 项 1）· `src/main/agent-host.mjs` **270**（§2.5 值列 `204 ⇒ ~219` ⇒ 漂移 · **跨舱合计笔**）· `src/main/ipc.mjs` **201**（值列 `195 ⇒ ~197` ⇒ 漂移 · 跨舱合计笔）· `test/attachments.test.mjs` **247**（新档 · 不越 300）· `test/host-floor.test.mjs` **287**（本舱笔 = U95 `fresh` 清单 +1 行）· `test/files.mjs` **17**（§2.5 值列 `15 ⇒ 17` 命中）。

### 5.33 决策透明表（舱 #93）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 词面单源 = 主进程直引渲染面词表 `renderer/i18n.mjs` `HOST_DICT`（本档为 `src/**` 唯一 main→renderer 边）；locale 经核 `normalizeLocale` 归一；解析式 = 归一表 ?? 缺省表 ?? 键名 | 项 4「词键面 = 渲染面词表」+ 零第二词表 | `attachments.mjs:22,:25,:49-51`；**零二次 `loadConfig`**（locale 取装配实例配置）⇒ 评审 🔵 观察见 5.35 项 5 |
| 2 | 非视觉判据 = `specForModel(model).multimodal !== true`（**零硬编码模型名单**；与核 `!spec.multimodal` 逐值等价 —— `MODEL_SPECS` 取值无一是非 `true` ∧ `DEFAULT_SPEC` 无该键） | 项 4 + 同源核 `setup-reminders.mjs:251` | `attachments.mjs:108`；U143 反证门先于阈 |
| 3 | **非数组容器 ⇒ 无附件径**（`null` / `{}` / 串 / 数 并入「无附件径」） | 设计**未钉**（项 1 只写「缺省 / 空数组」）⇒ 实现取值 | 与「弃项 ⇒ partial」不同面（载荷非本形 ⇒ 不主张弃项）；生产**不可达**（渲染面出口 `renderer/attach.mjs:91-100` `toImages` 恒数组 · 零项不落键）；评审 🟡#1 = 同点（**可选 · 不阻塞**）⇒ 保留 + 本处披露；VSC 侧无 `images` 容器先例可援引（`grep images thincoder-vscode/src` 零命中） |
| 4 | `<ext>` 只认 **dataURL 媒体类型**（`jpeg`⇒`jpg` · 栅格四型闭集）；载荷 `mime` 字段不参与 | 项 2「`<ext>` 由 `mime` 推」+ 先例同判据（VSC `image-handler.mjs:34-63`） | 实践等价（渲染面 `mime` = `file.type` = dataURL 媒体类型）；读载荷 `mime` = 造第二判据 ⇒ 不读 |
| 5 | 阈取**十进制**：`IMAGE_MAX_BYTES = 15_000_000` · `TURN_MAX_BYTES = 30_000_000` | 项 3 未写单位 ⇒ 取核口径（同值 = `thincoder-core/tools/file.mjs:26` `MAX_IMAGE_BYTES`；核**未导出**该常量 ⇒ 端侧自持同值） | `attachments.mjs:29,:31` |
| 6 | 模块 = **新档** `src/main/attachments.mjs`（判决 + 落盘 + 清理单点） | §2.5「新档四」**无此档** ⇒ **越声明**（同 U95 `fresh` +1 行） | 结构理由：`ipc.mjs` / `agent-host.mjs` 判决面内联即破单点（二者各 201 / 270 行）；披露见 5.35 项 1 |

### 5.34 审计与代码评审轮次与终态（舱 #93）

- **内部偏离审计**（explore 只读 · 阻塞）**1 轮**：**代码面四类零偏差**（PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST 三项已核**无**）；2 项 = **DOC-DRIFT**（① 设计句未随实现取值收正 ② §2.5 未建新档行）⇒ 归本舱披露（5.35 项 1 / 项 3），**设计档 = eng-designer 面 · 本舱零改**。
- **内部代码评审**（advisor `type=code` · 同步）**1 轮**：VERDICT **pass**（**0🔴** · 1🟡 · 8🔵 · 零 must-fix）。
- **响应表（逐条可核）**：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| ① | 🟡 | 非数组 `images` 与「无附件」同径（丢图零痕迹） | **保留 + 披露**（5.33 项 3）—— 可达性实测为零（渲染面出口恒数组）⇒ 不加码（零🔴 · 评审自列「可选 · 不阻塞」） |
| ②–⑨ | 🔵 | 八项（解码先于阈判定 · main→renderer 边 · locale 快照 · `run` 同步抛不入 try · 指针件不持久 · 无恰达边用例 · §2.5/§4.1 值列漂移 等） | **不改码**（零🔴 面 · 逐项择要入 5.35 披露）—— 改码会使其评审面失效 ⇒ 以披露结案 |

- **fix round（共 0 轮 · 上限 5）**：自实现至收敛零返工（定向 4/4 + 全量唯面外红首次即达）；评审后**零码改**（决策 = 保留 + 披露，见上表）。
- **终态 = clean**（审计 1 轮 · 评审 1 轮 · 0🔴 遗留 · 本舱判据行全绿；唯一全量红 = 面外陈旧账 #86）。

### 5.35 报父侧（舱 #93 · 披露 / 只报不改）

1. **越声明面（结构）**：新档 `src/main/attachments.mjs`（§2.5「新档四」无此档）+ `U95` `fresh` 清单 +1 行 —— 理由 = 判决面单点；**未在授权文件表内** ⇒ 请父侧登记（同族 = 5.31 项 7）。
2. **三处实现取值**（设计未钉 · 上表 5.33 项 3/4/5）：非数组容器径 · `<ext>` 判据（dataURL 媒体类型，载荷 `mime` 不参与）· 阈单位（十进制 / 同核值）。
3. **设计未钉（DOC-DRIFT · 设计档 = eng-designer 面 ⇒ 只报不改）**：`docs/desktop/design/IPC.md` §2「附件注」三句未随实现收正 —— ① 项 1 句未含「非数组容器」径 ② 项 2 未写 `<ext>` 推据 = dataURL 媒体类型 ③ 项 3 未写阈单位（十进制 · 同核 `MAX_IMAGE_BYTES`）。
4. **§2.5 值列漂移（跨舱合计笔）**：`agent-host.mjs 204 ⇒ ~219` 实读 **270** · `ipc.mjs 195 ⇒ ~197` 实读 **201** —— 本舱净增仅装配段 / `.finally` / 回执 / 注记（余笔归 ④⑤⑥ 舱）。
5. **locale 快照面**（评审 🔵）：词面语言取自 `createAgent` 装配实例配置（零二次 `loadConfig` 之代价）⇒ `config:write` 改语言后，本键词面在下一次装配前不变（设计未钉 ⇒ 登记，非缺陷）。
6. **未核实面**：① `.thincoder/tmp` 于**真机 Electron 主进程**下的实际权限（本舱仅在测试沙箱内验证「创建 / 写入 / 清理 + 失败弃项」三径）② U51 红之归口（#86）据本档 5.28 / 5.31 记载 —— 本舱**未独立复核**该归口。

### 5.36 补记（舱 #93 · 本舱净增**实测** —— `git diff -U0` 逐 hunk 归属 · 收正 5.35 项 4 的归属表述）

- `src/main/agent-host.mjs`：本舱净增 **+13**（`:31-32` +2 附件 import · `:182-186` +3 `send` JSDoc 附件段 · `:207-212` +5 装配段 · `:224-228` +3 `.finally` 清理 + 回执三形）⇒ 其余 +53 归 ④⑤⑥ 舱。
- `src/main/ipc.mjs`：本舱净增 **+1**（`msgSend` JSDoc 两行 ⇒ 三行 + 第三参透传；同 hunk 内 `sessionPrefs` 块 = ⑤ 舱笔）。
- **口径声明**：差值 = 工作树 vs `HEAD`，而**本批未提交**（⇒ 差面含批 A 在途笔）⇒ 归属只按**单 hunk 内容**判（上二数是逐 hunk 实测，非估值）。
- ⇒ 5.35 项 4 的「本舱净增仅装配段 / `.finally` / 回执 / 注记」按本条**收正**为两个实数（+13 / +1）；值列漂移其余部分归 ④⑤⑥ 舱（逐舱净值待各舱自记）。

### 5.x 舱 ⑦ 设置面档位控件（批 B · §2.10 T-DSK31 六例）

**交付摘要（面 = 三实施档 + 一词表档 + 四测试档）**：

- `thincoder-desktop/src/main/settings.mjs`：档位写径（`settings:agent` 写形 `{ tier:{ provider, model, level } }`，与 `{ patch }` **二择一**——两俱 / 两缺判据在 `settingsAgent`）。拒码序 = **形态 → provider 存在 → level 合法**（`invalid-patch` / `unknown-provider` / `bad-level`），**三拒皆零写**；``"none"`` 与 `"off"` 同径（`thinkOffPath(spec)` 假 ⇒ `bad-level`）；写协议统一式 = 先清不相容记号再按档落形（`auto` ⇒ 删 `thinking`+`reasoningEffort`；off 族 ⇒ `thinking = thinkOffShape(spec)` + 删 `reasoningEffort`；member ⇒ **仅当** `thinking` deep-equal `thinkOffShape(spec)` 才删 + 落 `reasoningEffort`）；写内新鲜读发现渠道条目消失（跨进程改档微窗口）⇒ 私记号 `VANISHED` ⇒ `unknown-provider` 零写；成功 ⇒ 写后回读 `fields`（写后投影恒等）。
- `thincoder-desktop/src/main/providers.mjs`（`effortOf`）：`provider:list` 逐行 `effort` = **离线**现值投影（零探针）——`reasoningEffort` 串 ⇒ 直出且 `"none"` ⇒ `"off"`；否则 `thinking` 键在场且 deep-equal `thinkOffShape(spec)` ⇒ `"off"`；否则 ⇒ `"auto"`；表外现值（含空串）照字面出（不吞）。
- `thincoder-desktop/renderer/views/settings-sections.mjs`（`tierFace` / `tierOptions` + 档位 `select` 节点）：现值 = `defaultModel` **渠道段**渠道条目 `effort`；不可解（`defaultModel` 缺 / 段空 / 该模型无候选元素）⇒ `null` ⇒ **控件零节点**（禁造假候选）；选项集 = `Auto`(`"auto"`) → `off`（`thinkOff` 严格真时在场）→ 逐模型枚举（滤空串 / `"none"`、去重）→ **表外现值自成一选项**（禁吞 · 零改写）。
- `thincoder-desktop/renderer/views/settings.mjs`：段体取用 `tierFace`（批 9 段体分派不动）。
- `thincoder-desktop/renderer/mount-settings.mjs`（`setTier`）：载荷 `{ tier:{ provider, model, level } }`；`level` 非串 ⇒ **零发送**；失败 ⇒ 段级失败面 + `console.error`（经 `report`）+ **零乐观写**（控件值随读档面重绘**回退回执前值**）；成功 ⇒ 重取行面现值 `loadProviders({ models:false })`（候选面保留）。
- `thincoder-desktop/renderer/i18n.mjs`：+ `settings.model.tier`（`Tier` / `档位`，两语键数相等 = 122）；消费既有 `effort.auto` / `effort.off` 两特值词。
- 测试档：`test/views-settings.test.mjs`（T-DSK31 五例：现值与选项集 / 两拒 + 回退 / 零节点 / off 缺席 / `mtime-conflict` 直传 + 零写 + 回退）· `test/settings.test.mjs`（U146：三径落形 + 写后投影恒等 + 两拒零写 + 形拒）· `test/providers.test.mjs`（U99 `model:list` 元素投影 / U103 行 `effort` 现值投影）· `test/views-chrome.test.mjs`（U49 会话头三值 `select` 控形臂 / U51 键数锁 110 → 122 / U119 期望切片 +`blocks` / 夹具两处消费面补）。

**命令读数（实跑）**：

- `thincoder-desktop: node test/run.mjs` ⇒ tests 160 / pass 160 / fail 0（含 T-DSK27 真 Electron e2e）。
- `thincoder-desktop: node --test test/views-chrome.test.mjs` ⇒ tests 6 / pass 6 / fail 0。

**决策透明表**：

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | `"none"` 与 `"off"` 同径（不作独立档） | `docs/desktop/design/IPC.md` §2 档位控件注项 9 逐字「`"none"` 不作独立档（其语义由 `"off"` 承载）」 | 现值投影同判（`"none"` ⇒ `"off"`） |
| 2 | 非活动渠道行的 spec 绑定 = 条目自身 `model` | 设计未明写（活动行绑定 `defaultModel` 模型段是「写后投影恒等」硬要求） | 实现面裁定，已披露 |
| 3 | 表外现值（含空串）照字面出并自成一选项 | IPC.md 项 9「表外现值 ⇒ 自成一选项（不吞 · 零改写）」 | 视图面单点 |
| 4 | U51 键数锁由字面 110 改**家族求和式**（13+4+8+7+7+3+49+10+9+6+3+2+1 = 122） | 新增两键须可核；字面锁无家族可审 | 非设计改动 |
| 5 | `settings-sections.mjs` 删一行行尾中文注释 | CJK 机检门（视图档源零 CJK）判红 —— 零语义变化（块注已载同义） | 自检修正 |

**审计与代码评审轮次与终态**：内部差异审计（explore 审计轮）= **未跑**；advisor 代码评审 = **未跑**；fix round = 0（自检修正 3 处 = 行尾 CJK 注释删除 / U51 message 链同步 / 数据串分组归位）。**终态 = `stalled`**（父侧硬底线令「已落面先收口」，未跑审计与评审即收口 —— 如实登记，非 pass）。

**未落项与缺口（逐条）**：

1. 审计轮 / 代码评审轮未跑（硬底线收口优先）——本舱终态 `stalled`，待父侧另派。
2. `test/views-chrome.test.mjs` 归属未定（父侧另定 · 已令停手）：该档内 4 处改动**已落盘且自跑绿**，此后我零写该档。
3. 账实差 1：批档记「121 键 / 设置 48」，实读「122 / 49」（差额 = 新增 `settings.model.tier`）——设计面（批档 / UI.md / IPC.md 计数）漂移，**只报不改**。
4. 他舱面：⑤ 的 `sessionMetaOf` 导出已由 ⑤ 侧自同步（U52 现绿）；本舱全量套件当前 160/160。

**out-of-list 变更（如实披露）**：`test/views-chrome.test.mjs`（不在本舱派单面 —— U49/U51/U119 三臂 + 夹具；已于其上第 2 项登记）· scratch 档 `.thincoder/tmp/chrome-keys-probe.mjs`（探针，**已删**）。

### 实施记录（eng-coder · 批 B ④ 输入区复制面 + 会话头供给取面）

#### 交付摘要
本舱落两面：「对话流逐块复制 + 输入区末条复制」，并修一处会话头真缺陷（供给取面错位）。

- `renderer/views/chat-copy.mjs`（新档）：`copyBlockNode`（逐块控件 · 块文本空 ⇒ 零控件）· `lastCopyNode`（末 `assistant` 块 ⇒ 输入区尾控件）· `patchTextBlock`（帧尾就地改文 + 控件缺席补）· `acceptCopy`（event 空 ⇒ 静默 return）· 复制出口由写口注入。
- `renderer/views/chat.mjs`：文本块 / 工具卡挂机读锚 `data-block-id`；文本块随带复制控件。
- `renderer/mount-composer.mjs`：`COMPOSER_KEYS += "blocks"`（末条控件取文源 = 末 `assistant` 块）+ `writeText` 单点注入 + 末条控件窄口 `syncLastCopy`（仅控件态变时动 DOM，防流式帧全树重建）。
- `renderer/app.mjs`：`writeText` 供给单点（`clipboard:write` 通道）；`onRepaint` 回退径；meta 回执。
- `renderer/views/chrome.mjs`：新增导出 `sessionMetaOf(state)`（pure：表 / 本键 / 无活动标签缺 ⇒ `null`）并让 `mountHead` 改用它 —— 修「会话头恒 `data-meta="none"`」真缺陷（原径把 `state.sessionMeta` 整表当一份供给）。`renderer/mount-head.mjs`（新档）薄挂载同源消费。
- `renderer/i18n.mjs`：档头计数修正（**122 键** / 十三项分解 —— 原档头分项和与总数自相矛盾，D3 计数纪律）。
- 测试面：`test/views-chat.test.mjs`（U62 复制锚改窄：按 `data-action="chat:copy-block"` 过滤后取 `data-block-id` —— 工具卡根亦带 `data-block-id`）· `test/views-chrome.test.mjs`（U51 用词面入量补两树 · U118 末条控件结构断言 · U49b 薄挂载新增）· `test/views-locks.test.mjs`（chrome 导出面锁 +`sessionMetaOf`）。

#### 决策透明表
| 决策点 | 取舍 | 依据 |
|---|---|---|
| 逐块控件机读锚 | `data-action="chat:copy-block"` 与 `data-block-id` 双锚，取锚须按 `data-action` 过滤 | 工具卡根另有 `data-block-id` ⇒ 整树取锚会误命中 |
| 复制出口接线 | `handlers.writeText` 注入；缺 ⇒ `disabled: true`（不落 `onClick`） | 两态通则（未接线不得静默死控） |
| 机检裸调 | `acceptCopy(event, …)`：event 空 ⇒ 静默 return `false` | 机检面裸调不得落诊断 / 起写 |
| 末条取文源 | 取模型末 `assistant` 块文本（非 DOM 现读）；文本空 ⇒ 零控件 | 末条控件不在块内，DOM 读无源；禁假造 |
| 会话头供给取面 | 新增 `sessionMetaOf` 单源，`mountHead` 与 `mount-head.mjs` 同用 | 供给取面不出二源；整表 ≠ 一份供给 |
| U51 入量补两树 | 补 `status.usage` 消费面树（属状态栏面，非本舱面，但计数锁是共享断言） | 锁红即整舱不绿；越面即披露 |

#### 越声明披露（改动超出原声明文件面）
- **新建`renderer/mount-head.mjs`**：会话头薄挂载自 `app.mjs` 迁出（薄挂载一档一宿主所需）；已在报告通道报备。
- `test/views-chrome.test.mjs` 的 U51 补量触及 **非本舱面**（状态栏读数 `status.usage`），目的 = 解共享计数锁；越面但披露。
- `test/views-locks.test.mjs` / `test/files.mjs` / `test/host-floor.test.mjs`：清单与导出面锁随动（新档入册、导出面 +1 段）。

#### 实跑读数（`node test/run.mjs`）
- 161 用例 / pass 160 / fail 1。**原两红已转绿**：U51（用词面计数 122）· U52（chrome 导出面锁）。
- 唯一红 = 本舱新落 `U49b`，断言写错（期望字段面 `[provider, model]`，实现实际 `[provider, model, effort]` —— 有 `model` 时档位面恒在 = Auto，与 U49 既有判据一致；**非实现缺陷**）。

#### 停手令
- 父侧 14:56 裁定：`test/views-chrome.test.mjs` **停手**（该档另有未知并发写手，mtime 06:53:13Z / 06:54:03Z 非本会话所出；同区域先 +37 行后被回退，行号在 359↔323 间跳）。
- 事实披露：本舱对该档的 5 处编辑（import 两行 · 档头「不触真 DOM」· U49b 新增 · U51 补 `status.usage` 树 · U118 末条控件断言）**在停手指令到达前一刻已落盘**；此后未再写该档。U49b 的一处断言修正已请裁。

### 5.37 修复轮（舱 #97 · ⑦ 块补跑两轮 + findings 逐条处置）

**起因与射程**：⑦ 块（`:880` / `:884` 项 1）自记「审计 / 代码评审未跑 ⇒ 终态 `stalled`，待父侧另派」⇒ 本舱只做三件：补跑两轮 · findings 逐条处置 · 复跑。禁扩面 / 禁新语义 / 禁改设计档 / 零触碰 #96（`test/views-chrome.test.mjs` · `test/views-harness.mjs` · `renderer/views/chrome.mjs`）与 #94（`renderer/i18n.mjs`）在途面。

**两轮轮次与终态**：

- 内部差异审计（explore）= **已跑**，verdict = **DEVIATIONS**：六类 findings 全落「行数账 / 值列 / 指针」面 —— 零 PARTIAL、零静默简化、零 out-of-list（除 ⑦ 块 `:889` 已自陈的 `test/views-chrome.test.mjs`）。
- advisor 代码评审 = **已跑**，verdict = **pass**（14 行：🟡5 + 🔵9；无 🔴、无 must-fix；射程外注记 1 条）。表尾「host 校 0/4 引用」= 裸档名解析假警（`IPC.md` / `UI.md` 未带目录前缀 ⇒ 解析不到文件），非事实不符。
- 复跑：`thincoder-desktop: node test/run.mjs` ⇒ **tests 165 / pass 165 / fail 0**（含真 Electron T-DSK27；本舱实读 —— ⑦ 块 `:867` 的 160/160 = as-of 其舱时点）。

**fix round（1 处已落 · 注释纠偏，不补锚）**：`thincoder-desktop/renderer/views/settings-sections.mjs:210` 原注释自称「锚名逐字 `settings:tier`」，而 `tierRowNode` 实为**零 `data-action`**（接线经 `onChange`）—— 注释与代码相抵（评审 #1）。

- 依据：`settings:tier` 全仓 **1 命中**（= 该注释自身）⇒ 无设计源、零消费方；`select` 族用自有标记（同会话头 `data-field` 例）⇒ 取**纠偏注释**，不新增无源锚。
- 改后逐字（`:210`）：「档位行：名 + 档位控件（`select` —— 零 `data-action`（非点击型：接线经 `onChange`）；行标 = `data-tier`、可及名 = `aria-label` 词键；非表单控件 ⇒ 零 `name`；缺 handler ⇒ `disabled`）。」行数不变（内容行 290）。

**findings 逐条处置**（修 / 不采纳（记依据）/ 上抛 —— 逐条闭合）：

| # | finding（源） | 处置 | 依据 / 证据 |
|---|---|---|---|
| 1 | 🔴 `test/views-settings.test.mjs` 实读 447 行 · 拆分预案未执行（审计） | **不采纳（本舱不拆）+ 上抛值列回填** | 该档在 **U95 机检例外臂**在册：`thincoder-desktop/test/host-floor.test.mjs:279` 例外面三向断言（`> 300` ∧ `≤ 500` ∧ 不入 `fresh`）现绿；拆分预案两处在册（`docs/desktop/design/PROJECT.md:153`「落值越 300 层 ⇒ 拆分预案 = 用例面拆出」〔括注「档名实施批定」〕+ `host-floor.test.mjs:278` 同行注）⇒ 消解窗口 = 该档下次被触碰的批。本舱射程禁建新档 ⇒ 拆档非本舱动作。（本舱口径实读 = 内容行 **446** / 总行 447；口径 = `host-floor.test.mjs:251`「内容行数（文末换行不计）」） |
| 2 | 🟡 `test/settings.test.mjs` 301 行「越 1 行」（审计） | **裁决不成立（非 finding）** | 口径 = 内容行数（文末换行不计 —— `host-floor.test.mjs:252` 实现 + `:285` 注「含线上 —— 恰 300 合规」）⇒ 本舱实读 **300** = 恰线上合规；该档在 `fresh` 清单内（`host-floor.test.mjs:262`）且 U95 现绿。审计读数 301 = 计入文末换行。 |
| 3 | 🟡 值列未按盘回填（审计 A3/A4/A5 + 评审 #10） | **上抛（设计档面 —— D1 禁改）** | 本舱口径实读：`src/main/settings.mjs` **253**（值列 `174 ⇒ ~205`）· `src/main/providers.mjs` **150**（`128 ⇒ ~140`）· `renderer/views/settings-sections.mjs` **290**（`206 ⇒ ~235`）· `renderer/views/settings.mjs` **296**（`295 ⇒ ~296` ✓）· `renderer/mount-onboarding.mjs` **88**（`~85` ✓）。三档越估值但**均 ≤300**；`settings-sections.mjs` 290 距触发线 10 行（贴层 —— 同 `PROJECT.md:480` 对 `views/chat.mjs` 289 的贴层记账法）⇒ 回填时须带贴层标记。 |
| 4 | 🟡 i18n 键数 122 vs 121 · 设置 49 vs 48（审计 + 评审 #12） | **不采纳（无本舱动作）+ 上抛** | 已在册：⑦ 块 `:886` 项 3（「只报不改」）；本舱实读 122 键两语相等（U51 家族求和式锁绿）。`renderer/i18n.mjs` = #94 在途面 ⇒ 零触碰。 |
| 5 | 🟡 `IPC.md:146` 同格「读 = `{}`」与「两俱 / 两缺 ⇒ `invalid-patch`」自相抵（评审 #3） | **上抛待父裁（设计档面）** | 本舱实测：读径**活调用** = `renderer/mount-settings.mjs:182` `const receipt = await ask("settings:agent", {})`（同档 `:179` 注「`settings:agent` 读 = `{}`」）⇒「两缺 ⇒ `invalid-patch`」若为真，该读径当场死 ⇒ 实现取读面正确、档面须限定其域（建议「非空载荷而 `patch` / `tier` 皆无」）。 |
| 6 | 🟡 活动行「投影绑定模型」与对外 `model` 键不同源 ⇒ 该态下「写后投影恒等」不成立（评审 #2；源缺口已在册：批档 §3 轮次 3 #1 · 父侧 §4.2 裁「不阻塞 · 处置随收口轮」） | **不采纳（本舱）+ 上抛收口轮** | 改形涉跨面消费（`src/main/providers.mjs:84` 投影绑定 ↔ 渲染面复合串两向）⇒ 随收口轮一并动。可复现径（本舱实读）：`test/providers.test.mjs:57` `defaultModel: "local:qwen3.7-flash"` + `:60` 条目 `model: "m-a"` ⇒ `:95` 期望表 `local: "off"`；同档 `:92` 自陈「取自身 model 会得 auto」。 |
| 7 | 🟡/在册 行数：`renderer/mount-settings.mjs` 实读 427（评审 #14）· `renderer/i18n.mjs` 357（评审 #4） | **不采纳（在册例外 / 在途面）** | `mount-settings.mjs` = U95 在册例外（`host-floor.test.mjs:279`，`limit 500`），本舱实读内容行 **426** ⇒ 距硬限 74 ✓；`i18n.mjs` 在 `PROJECT.md:163` 越 300 段在册（预案 = 词族按视图面拆第二档）+ #94 在途面。 |
| 8 | 🔵 观察组（评审 #6 双读档 · #7 行缺 ⇒ 空串选项 · #8 两导出零消费方 · #11 `effort.auto` 注面单侧） | **不采纳（本舱）+ 上抛（#7 待设计面点名两子态）** | 零正确性影响的观察（#11 属 #94 面）；#7 与批档 §3 轮次 3 #7「行缺 ⇒ 零节点」建议不一致 ⇒ 归设计面裁定（零节点 ∥ 明确空串选项覆盖行缺态）。 |
| 9 | 🔵 指针 / 号段面：评审 #9 IPC 三处指针漂移 · #13 `U146` 未入 §4.1 号段（+ 审计：`SHELL.md` 树缺 `mount-onboarding.mjs`） | **上抛（设计 / 批档面 —— D1 禁改）** | #13 实证：`PROJECT.md:313` 记「设置族 … = **U98–U102**」，而 `U146` 已落（`thincoder-desktop/test/settings.test.mjs:239`；本批号段见 `test/views-head.test.mjs:7`「本批末位 `U146`」）；`SHELL.md` 树行 = ⑥ 拆档新档未入树。 |

**本舱净改动**：仅上述一行注释（`thincoder-desktop/renderer/views/settings-sections.mjs`）；无新档、无删档、无越声明变更。

**终态 = `converged`（本舱射程内 · 非假 pass）**：两轮已跑（审计 DEVIATIONS ⇒ 逐条处置后无代码缺陷；评审 pass）+ fix round 1 处已落 + 全量复跑 165/165。审计 🔴 的**实质**（`views-settings.test.mjs` 拆档执行）与 #3 / #5 / #6 / #9 均**非本舱可修面**（设计档 D1 禁改 / 跨面改形 / 禁扩面），逐条带依据上抛，**不计作「已解决」**。

**上抛清单（父侧 · 设计面收口轮）**：

1. §4.1 值列按盘回填（`src/main/settings.mjs` 253 · `src/main/providers.mjs` 150 · `renderer/views/settings-sections.mjs` 290〔贴层〕· `renderer/views/settings.mjs` 296 ✓ · `renderer/mount-onboarding.mjs` 88 ✓）+ `test/views-settings.test.mjs` 拆档窗口。
2. `IPC.md:146`「两俱 / 两缺 ⇒ `invalid-patch`」裁权威读法（读径 `{}` 活调用在盘 ⇒ 该句须限定其域）。
3. 活动行「`model` 键 ↔ 投影绑定模型」两键同源改形（随收口轮；父裁「不阻塞」在册）。
4. `SHELL.md` 树补 `renderer/mount-onboarding.mjs`（⑥ 拆档产物）。
5. `U146` 号段 + IPC 三处指针按盘重指；`i18n` 键数 122 / 49 设计面随动。

### 5.38 舱 #94 —— 新档 `test/views-head.test.mjs`（会话头三 `select` 候选面 · 写路回执刷行 · 状态栏读数两态）

> 记录面补记：本舱**首次 §5 append（2540 字）未落盘**（实读档内无该段 ⇒ 亦无半截）——本条为重写；写入手段 = `batch` append，无路径参数。

#### 交付摘要

- **新档 `thincoder-desktop/test/views-head.test.mjs`（299 行）**：承「会话头三 `select` 候选面 + 写路回执刷行 + 状态栏读数两态」三面，用例号自铸 **U147–U150**（先例 U138–U141）。
  - U147（`:18-97`）会话头三 `select` 候选面：候选 ∪ {现值}（`or`/`orphan` 现值缺于候选 ⇒ 追加 · 禁吞）· `thinkOff` 假 ⇒ off 缺席（现值 `"off"` 时不追加，同断言钉住现值可见性位）· `"none"` 滤词 · 候选面缺该模型 ⇒ Auto ∪ {现值} · **无 `candidates` 面 ⇒ 三面退「仅现值」** · 两态（handler 缺 ⇒ `disabled` + 零 `onChange`；handler 给 ⇒ 出口）· `mountHead` 落点（真树 `data-field` 锚内嵌 `select` · `selected` 位标 · `data-meta="present"`）。
  - U148（`:99-199`）写路与回执刷行：载荷 `{ key, patch }` · `provider` 变更同送 `model`（首候选）· 回执 `meta` ⇒ 切片就位 + **零乐观写** · 三径回退（`busy` / 抛 / 回执缺 `meta`）+ 诊断行 · 「无活动会话 ⇒ 零通道」· `attachHead({})` 零宿主 ⇒ 恰一行 `preload bridge missing` · `sync` 两通道各一行诊断。
  - U149（`:201-248`）候选面随动：两件取件序 · 同 `provider` 零重取 · 落地刷行一次 · 失败 ⇒ 空面 + 重试。
  - U150（`:256-299`）状态栏读数两态：在读 ⇒ 读数串节点 · `>= 80` 转警示（class 面）· 未至 / 非正数 / 无 `usage` ⇒ 零读数节点（零残留）· 节点序 = 读数 → 告警 · 告警位取值 = 非活动标签位标码（同源同词）· `mountStatus(null, {})` 早返。
- `test/files.mjs`（`:9`）：显式清单 +1 行 `"test/views-head.test.mjs",`（chrome 族组）。
- `test/host-floor.test.mjs`（`:267-270`）：U95 `fresh` 清单 +2 行 = `"renderer/views/chat-copy.mjs",` 与 `"renderer/mount-head.mjs", "test/views-head.test.mjs",`（三档读数 133 / 148 / 299，皆 ≤ 300 层触发线）。

#### 命令读数（实跑 · 本舱）

- `thincoder-desktop: node --test test/views-head.test.mjs` ⇒ tests 4 / pass 4 / fail 0。
- `thincoder-desktop: node test/run.mjs` ⇒ tests **165 / pass 165 / fail 0**（含 T-DSK27 真 Electron e2e；读数时刻 = 本舱收口前，同批他舱在途笔不排除）。

#### 决策透明表

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | 用例号自铸 **U147–U150** | 父侧派单许可 + 同批先例 U138–U141（§1.16:151 授权） | 收口轮归入 §2.5 用例册 |
| 2 | 落点面断言走 **`mountHead` 真树**（机读锚 + `selected` 位标 + `data-meta`），描述符面只判值与两态 | 设计「锚 / 落形」条款落在真树；纯描述符判据测不到锚 | 两向自证：描述符值 + 宿主树锚 |
| 3 | 为守 ≤300 行（U95 判据 `n <= 300`）删减 4 处断言 | 行数触发线 = 机检硬线，本舱 299 行 | 删项与替代臂 → 下表 |
| 4 | `attachHead({})` 零宿主径入 U148⑧（而非 `sync` 面） | 该径 = 装配缺位（桥缺），非随动面 | 与 `mount-head.mjs:35` 诊断串逐字对齐 |
| 5 | 本档**不再写** `test/views-chrome.test.mjs` | 父侧停手令（§1.16:147–152 已载：写手实测 = 本会话 #92 ⇒ 该档归 #96，不再招双写） | 该档面仍归 #96 |

**删断言 ↔ 替代臂（逐条，审计已核）**：

| 删项 | 替代臂 | 判定 |
|---|---|---|
| 描述符级 `props.selected` 现值位标 | 本档落点面 `:94`（真树 `selected`）+ `views-chrome.test.mjs` U49 既有直证 | 非简化 |
| `bare`（无 `candidates`）下档位面选项 | —（首轮唯一收窄项）⇒ 审计 1 轮后**已恢复** `:69` `档位面 = Auto ∪ {现值}` | 已闭合（299 行） |
| `onChange(undefined)`（事件缺位）臂 | 两态互斥臂 `:73-74` 在位；无设计条款 | 非简化（实现守卫 `valueOf(event)` 仍被 `:84` 非串臂覆盖） |
| `mountStatus` 返回值断言 | 设计未立该条款（实现自注 `chrome.mjs:227`）；同族 `mountHead` 返回值另有锁 | 非简化 |

#### 越声明披露（改动超出原声明文件面 ⇒ 如实登记）

1. `test/files.mjs` · `test/host-floor.test.mjs` 两档**不在 §2.5 声明面**——随动登记（新档入册 + ≤300 层臂入清单），零语义；审计已核「与设计口径一致（`fresh` 层段口径 · 越层档不入 `fresh`）」。
2. 两档既有档头注释原写「消费点 = 三档各一次」——**未改**（非本舱面，只报置「只报不改」第 6 条）。

#### 审计与代码评审轮次与终态

- **内部偏离审计**（explore 只读 · 阻塞）**1 轮**：**四类偏差全无**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）——给出「设计条款 → 用例臂 → `file:line`」17 行映射齐备；8 条诊断串断言 ↔ 实现逐字一致（无自铸判据）；无散文锁（全档零 `node:fs`、零「文档句子在场」断言）；清单外改动未检出（mtime 证据：本轮三档 07:06Z，禁改两档 06:50Z < 07:06Z）。
- **审计观察项**（非四类）**1 项已处置**：`bare` 面档位直证缺（覆盖等价收窄）⇒ 本舱**恢复该臂**（`:69`），行数 298 → 299（仍 ≤ 300）。其余 4 项（并发写手 mtime · §5 未见（即本条）· §2.5 随动归收口轮 · 模块图待登记）**只报不改**，逐条入「只报不改」。
- **内部代码评审**（advisor `type=code` · 同步 · 射程 = 本舱三档）**1 轮**：VERDICT **pass**（**0🔴** · 1🟡 报告项 · 6🔵 · 零 must-fix）。评审自身实读了实现侧对照档（`chrome.mjs` / `chat-copy.mjs` / `dom.mjs` / `fake-dom.mjs` / `views-harness.mjs`）并逐条给出在盘引文；工具面 `[host-verified] 0/16 citations match` = **宿主引用核对路径解析失败**（`file unreadable`），非引文不存在 —— 逐条引文已由评审自身实读确认，本舱复核其中三处（`chrome.mjs:111` / `:112` / `chat-copy.mjs:32`）一致。
- **响应表**：

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| ① | 🟡 | `chrome.mjs:146`/`:131` 现值回填与 `UI.md:43`「不可 `off` 者不占位」② 读法未闭合，且本舱新档 `:59` 已把该语义钉为判据 | **报告项 · 不改码不阻塞**（设计档缺口 · 一句话裁定即可）——入「只报不改」第 1 条 |
| ②–⑦ | 🔵 | 六项：`chrome.mjs:112` 缺 handler 形无动作锚 · `chrome.mjs:111` 事件面未入设计档 · `chat-copy.mjs:32` 空文本 ⇒ `null` 未入设计档 · `chat-copy.mjs` 未入零 CJK / 导出面锁（**行数臂已由本舱 `host-floor:268` 闭合**）· `mount-composer.mjs` 348 行越 300 未入越层枚举 + 值列漂移 | **不改码**（零🔴 面 · 逐项入「只报不改」）——改码会使本轮评审证据失效 |

- **fix round（共 1 轮 · 上限 5）**：审计观察项处置 1 处（恢复 `bare` 档位面直证 + ④ 注释「两面退」改回「三面退」）；评审 0🔴 ⇒ 零修复。
- **终态 = clean**（审计 1 轮 · 评审 1 轮 · fix 1 轮 · 0🔴 遗留 · 全量 165/165 · 本舱三档清单两向自检可过）。

#### 只报不改（本舱观测 · 交父侧 / 收口轮）

1. **`UI.md:43` 现值可见性 vs off 缺席**（评审 🟡）：`chrome.mjs:131`/`:146` 无条件回填现值；设计逐字 `UI.md:43`「off 在场判据 = 该模型 `thinkOff`（假 ⇒ off 选项缺席）」。**本舱新档 `:59` 已把现值追加钉为判据** ⇒ 裁一句（补例外句 或 收窄 `"off"` ∧ `thinkOff` 假 不追加）后两面对齐。
2. **`chrome.mjs:111` 事件面（`change`）未入设计档**（评审 🔵）· **`:112` 缺 handler 形无动作锚**（评审 🔵）——`UI.md:41` 只给控形与字段锚；两处零语义（补一句 或 控件补锚）。
3. **`chat-copy.mjs:32`** 空文本 ⇒ `null` 与「不回退更早块」两支未入 `UI.md:53`（评审 🔵）。
4. **`chat-copy.mjs` 未入零 CJK 名单（`views-chrome.test.mjs:394` 十五名）与导出面锁（`views-locks.test.mjs:42-47`）**（评审 🔵）——行数臂已闭合；另 `views-chrome.test.mjs` 537 行越 500 硬限且不入 `fresh` 亦不在越层枚举 ⇒ 机检漏网（归 #96 / 设计侧）。
5. **`mount-composer.mjs` 348 行 > 300**：`PROJECT.md:146` 登记 `262 ⇒ ~282`、`:160` 越层枚举「合计九档」未含本档、`host-floor.test.mjs:279` 在册例外面亦不含 ⇒ **越层面不被任一机检捕获**（评审 🔵）；同族值列漂移 = `PROJECT.md:136` `chrome.mjs 101 ⇒ ~129` 实读 240 · `:149` `chat-copy.mjs ~40` 实读 133。
6. **§2.5 随动**：`§2.5:211`（as-of）「原址补例 = `test/views-chrome.test.mjs`（读数节点两态 + 会话头三 `select` 与回执刷行）」与实落（新档）不符 —— §1.16:153 已明裁归**收口轮**；本舱原定面即该原址，父侧裁定改落新档（§1.16:151–152），**新档语义 = 会话头 / 状态栏域（原住 `views-chrome`）⇒ 归 chrome 族（`files.mjs:9`）**。
7. **`renderer/mount-head.mjs` 未入设计模块图 / 受影响文件表**（上轮既有项 · 审计观察）——随动登记，避免漂移累积。
8. **并发写手**：审计观测 `renderer/views/settings-sections.mjs` mtime 07:08Z（晚于本舱落盘 07:06Z）——非本舱面；`test/views-chrome.test.mjs` 停手令继续生效（§1.16:152）。
9. **未核实面**：本舱命令读数取于收口前，同批他舱在途笔不排除 ⇒ `165/165` 为**该时刻**读数；审计舱无执行面，其四类结论 = 静态核对（断言 ↔ 实现逐条），非执行证据（执行证据 = 本条实跑两条）。

### 5.39 交付摘要（舱 #95/#96 · 面 = 机检收口舱 · **零写** · 实读对账 · 2026-09-27）

**派单四件**：① U51 键表锁 / 两档（`test/views-chrome.test.mjs` · `test/views-harness.mjs`）落位读回 ② 本批十一新键须全部有树消费 ③ 夹具 `model:list` 假回执元素形 ④ 本舱面零 doc 新增。

**结论：任务书两前提均已失效 ⇒ 零写收尾**（父侧 15:22 裁定「准 ✓」）—— 不造无谓改写。**本舱改文件数 = 0**（本段 §5 为批档记录面，属必写）。

**四条实证（实读 / 实跑）**

1. **全量绿**：`cd thincoder-desktop && node test/run.mjs` ⇒ `tests 165 / pass 165 / fail 0`（含 U51）；`node --test test/views-chrome.test.mjs` ⇒ 7 / 7 pass。**限度如实**：两轮独立复核（explore 审计 / advisor 评审）装配皆无执行面 ⇒ 绿读数未获第三方独立复现（父侧 §1.17 已规划亲跑）。
2. **U51 锁在盘且真闭合**：`test/views-chrome.test.mjs:272` 计数式 = `13 + 4 + 8 + 7 + 7 + 3 + 49 + 10 + 9 + 6 + 3 + 2 + 1`；`:275` 两语键集相等断言；`:391` 双向等式 `deepEqual([...used].sort(), [...keys, ...CORE_WORD_KEYS].sort())`（无未消费键 ∧ 无多余项）；哨兵注入 `:287`；`data` 白名单 `:365-377` 为手工登记 ⇒ 无「存在即放过」逃生口。
3. **键数实读对账 = 122（设置 49）**：逐族 = rail+origin 13（`renderer/i18n.mjs:44-56`）· tab 4（`:57-60`）· chat 8（`:61-66,:68-69`）· pool 7（`:70-76`）· composer 6（`:77-79,:81-83`）· approval 7（`:84-90`）· question 3（`:92-94`）· settings 49（`:96-144`；细分 title1 + close1 + lang2 + section4 + state2 + reason12 + providers15 + agent2 + model4 + mcp6）· wizard 10（`:146-155`）· info 9（`:157-165`）· head 3（`:167-169`）· effort 2（`:170-171`）· status 1（`:172`）= **122**；zh 块 `:174-304` 键序逐位同；与本档 `:5-8` 族链分解自洽。**121 → 122 差 1 因 = `settings.model.tier`**（`:138` / `:269` ⇒ 该键 = 设计面滞后，收口轮）。
4. **夹具两形辨析（非本舱笔 · 只读证）**：`test/views-harness.mjs:129` `model:list` 假回执**已是元素形** `{ id, effortEnum, thinkOff }` ✓；`:128` `provider:list ⇒ providers: held.rows`（行对象面 —— 与 `model:list` 异形面，非缺陷）；`:121` / `:132` `provider:verify ⇒ models: ["a","b"]`（串形 = **生产同形** —— `test/providers.test.mjs:228` 断言同形 ⇒ 非缺陷）。

**十一新键消费面（实读引文）**：`composer.attach.remove` → `renderer/attach.mjs:117` · `composer.attach.nonvision` / `partial` → `renderer/attach.mjs:19/20`（降级词表）· `chat.action.copy` / `copyLast` → `renderer/views/chat-copy.mjs:88/105` · `head.field.provider|model|effort` → `renderer/views/chrome.mjs:110`（模板拼键 ⇒ 静读无字面量，须树消费方可锁）· `effort.auto` / `off` → `renderer/views/chrome.mjs:139/140` + `renderer/views/settings-sections.mjs:194/195` · `status.usage` → `renderer/views/chrome.mjs:210` · `settings.model.tier` → `renderer/views/settings-sections.mjs:212/219`。⇒ 十二新键**全有树消费/真实消费点**，无缺树。

**决策透明表**

| # | 决策点 | 取舍 | 依据 |
|---|---|---|---|
| 1 | 目标态已在盘 ⇒ 是否补一笔形式改写 | **不写**（零写收尾） | 不造无谓改写；改写会动 #98 拆档轮在途面（父侧 15:22 准 ✓） |
| 2 | 零 CJK 名单补 `chat-copy.mjs` | **不动作**（转 #98） | 本舱纪律「不改断言语义」（补名单 = 覆盖语义面）；父侧 15:22 判「不归你 ✓」 |
| 3 | `views-chrome.test.mjs` 537 行越 500 硬限 | **不动作**（已立 #98） | 只搬不改 · 按族切；两轮复核一致判「在册不重报」 |
| 4 | 121 / 122 计数冲突 | **以实读为准 = 122 / 49** | 逐族机器复核 + 族链逐项；差因单键 `settings.model.tier` |
| 5 | 评审 4 项 🔵 是否落笔 | **不写**（零写裁定） | 皆 Style / 覆盖建议 · 非本舱面或 #98 面；可选修复项跳过不阻塞交付 |

**审计与代码评审轮次与终态**：审计 **1 轮**（explore · **PROBLEM / inconclusive**：②③④ 静态实读一致 ✓；① 实跑因该装配无执行面未自跑 = 如实拒冒读数）+ 代码评审 **1 轮**（advisor `type=code` · **VERDICT: pass** · 0 🔴 / 0 🟡 / 4 🔵）+ fix **0 轮** ⇒ **终态 `clean`**（零写收尾）。

**评审 4 🔵 与处置**：① `test/views-harness.mjs:9` 「消费面」只列 2 档（评审实读 import 面 = 7 档：host-floor:23 · views-attach:24 · views-head:17 · views-question:35 · views-settings:16 · views-onboarding:15 · views-tabbar-close:18）⇒ 建议按 import 面补登 · **不处置**（零写）。② `renderer/attach.mjs` 不在任何零 CJK 机检面（`views-chrome.test.mjs:399` 固定按 `../renderer/views/${name}` 枚举 ⇒ 根下档构造性覆盖不到）—— 本舱实读其正文用户文案皆经 `t()`、CJK 仅在注释 ⇒ **无现行违规、仅机检漏网** ⇒ 建议并入 #98 一句话。③ `renderer/i18n.mjs:7` 「本舱七」token 无舱号前缀，后读不可解指代（同族 token 已在册）⇒ 建议带舱号 · 不处置。④ 122 / 49 与设计档 121 / 48 之差 = **在册**（批档 `:900` 「批档记「121 键 / 设置 48」，实读「122 / 49」…只报不改」）⇒ 无新动作。

**越声明**：**零**（本舱零写；文件面零触碰）。

### 5.40 交付摘要（舱 #98 · 面 = 硬限拆档两档 + `test/files.mjs` 登记行 · 2026-09-27）

**派单（任务书）**：`test/views-chrome.test.mjs` **537 行**越 500 硬限（§1.18:167）⇒ 按族切：视图族留原档、**词表族（U51）入新档 `test/views-chrome-vocab.test.mjs`**；**只搬不改**；两档各 ≤300；清单随动（`files.mjs`）；依赖 #96（§5.39）。

**文件面（3 档 · 零产品码）**

| 档 | 行数（口径同 `test/host-floor.test.mjs`：`replace(/\n$/,'')` 后计行） | 内容 |
|---|---|---|
| `test/views-chrome-vocab.test.mjs`（新） | **291** | U51 全链 + 词表夹具（helper 块 · 13 族键表 · 哨兵注入 · 枚举零 CJK 臂）+ 档头枚举面一句话 |
| `test/views-chrome.test.mjs` | 537 ⇒ **258** | 视图族留驻（U49 / U49b / U118 / U119 / U126）+ 档头重写 + import 裁为 8 行 |
| `test/files.mjs` | **+1 行** | `"test/views-chrome-vocab.test.mjs",`（登记 = 会被执行） |

`renderer/**` 零触碰（产品码零改动）。

**纯搬移证明（机械对账 · 基线 `.thincoder/tmp/views-chrome-before.mjs` = 拆前 537 行全文）**

- 逐块对账：helper 块 **127/127 行逐字同**；U51 块**仅两处行级差** = 下述两笔披露的附加面；视图族保留段 **240 行 mismatches 0**；基线非空行「丢失」13 行逐条归属 = 档头重写 / import 裁剪 / U51 两行 ⇒ **零代码丢失 · 除两笔附加面外零断言语义变更**。
- 实跑（本舱 · 复跑于 fix 2 轮之后）：`node --test test/views-chrome.test.mjs` ⇒ **6/6 pass**；`node --test test/views-chrome-vocab.test.mjs` ⇒ **1/1 pass**；`node test/run.mjs` ⇒ `tests 165 / pass 165 / fail 0`（新档在册被收集 ✓ · U95 ≤300 臂不红 ✓）。

**决策透明表**

| # | 决策点 | 取舍 | 依据 |
|---|---|---|---|
| 1 | U51 零 CJK 名单 15 ⇒ 16（补 `renderer/views/chat-copy.mjs`）+ 题面「十五 ⇒ 十六」 | **落笔**（本舱唯一非纯搬移面 · 显式披露） | §5.39 行 2 转办（该舱判「不动作 → 转 #98」；父侧 15:22「不归你 ✓」）+ 本舱派单授权；补齐后名单 = `renderer/views/` 目录全集（更强口径 · 目录 16 档 ≡ 名单 16 名实读核 ✓） |
| 2 | 原档头自述「面不变、判据不变」与被改判据（覆盖面 +1）口径不一 | **收正档头**（限定为「同笔唯 U51 零 CJK 名单补 `chat-copy.mjs`：15 ⇒ 16」） | 自述须与交付一致（= 评审 🟡#1 同一指向）；comment-only |
| 3 | §5.39 行 1085 的 🔵②「根下渲染档不在零 CJK 枚举面」 | **落一句话**（新档头记：枚举面 = `renderer/views/` 档集 ⇒ 根下档如 `renderer/attach.mjs` 构造性不在面内 · 已登记） | 父侧该条建议「并入 #98 一句话」；comment-only |

**审计与代码评审轮次与终态**

- 内部背离审计（explore · 只读）**1 轮** ⇒ 总判 **准**：7 例 = 7 例 ✓ · **零越界**（无清单外档）· **零降级** · **零半实施**；唯 2 行 🔵 = 设计档 / 跨档指针随动 ⇒ 归**父侧收口轮**。
- 代码评审（advisor `type=code`）**1 轮** ⇒ 🔴 **0** / 🟡 1 / 🔵 2 · **VERDICT: pass**。
  - 🟡#1（口径差：轮次令「只搬不改」× §5.39 行 2 转办 × 档头自述）= 决策 1 ⇒ **处置** = 决策 2 收正 + 本段登记转办来源（授权双证 = 派单 + 记录面）。
  - 🔵#2（枚举式构造性漏网）= 决策 3 落地。
  - 🔵#3（新档 291 行距 300 触发线 9 行 = 贴层）= **不处置** ⇒ 报收口轮（设计档行预算登记时带贴层标记 · 记账法同 `PROJECT.md:480`）。
- fix **2 轮**（皆 comment-only：原档头限定句 · 新档头枚举面句）⇒ 复跑全量 **165/165** 绿；**未复跑评审**（两笔零断言语义 · 评审轮 1 已 pass ⇒ 复核按本段 + 读数；欲第三方复看，父侧收口轮可点）。

**只报不改（交父侧 / 收口轮）**

1. **跨档指针滞后 6 处**（皆「U51 住 `views-chrome.test.mjs`」旧指）：`test/views-harness.mjs:38` · `test/views-onboarding.test.mjs:8` · `test/views-settings.test.mjs:8` · `test/views-attach.test.mjs:16` · `test/views-locks.test.mjs:6` · `test/views.test.mjs:7`。
2. **设计档随动**：`docs/desktop/design/PROJECT.md`:153 / :164（§4.1 档行预算值列与名序：537 ⇒ 258 + 新档 291 登记）；:176 / :186（U51 宿主档指）。
3. **U95 `fresh` 清单**（`test/host-floor.test.mjs:270`）未含新档 —— 无反向校验 ⇒ 不红；测试档尺寸网归设计面裁（§1.18:167 已立）。
4. `renderer/views/chat-copy.mjs` 仍未入 `test/views-locks.test.mjs` 导出面锁（名单面在册）。
5. **对账基线副本保留**：`.thincoder/tmp/views-chrome-before.mjs`（36.7KB · gitignored）—— HEAD 内 `test/views-chrome.test.mjs` 仅 **296** 行 ⇒ 拆前 537 行态**不可由 git 复原**，故本舱不删（承本仓 `.thincoder/tmp/` 存基线的既有惯例）；父侧收口核毕可删。

**越声明披露**：文件面 = 声明三档（两测试档 + `files.mjs` 登记行）✓；同一位内两笔附加面（决策 1 / 3）逐条披露 ✓；产品码零改动 · 设计档零改动 ✓（D1：设计档 = eng-designer 面）。

## §6 验证与收口（父代理）

**验证与收口（父侧 · 2026-09-27 16:45 ✓）**

### 6.1 交付与验收（父侧亲跑 = 闭合点 ✓）

- **交付** ✓：**十二舱**（核面 / 2a 通道 / 2b 投影 / 3 归约 / 4a 视图 / 4b 附件 / ⑤ 锁舱 / ⑥ 落地 + **⑥ 评审补轮** + **4a 二轮** + **拆档轮** + **收口轮** ✓）·**前置**：设计两轮评审 pass ⇒ 复核 pass（⑥ 修订 ✓）⇒ §4 代签两次 ✓。
- **父侧终跑** ✓（**本块 = 闭合点** ✓·承 #96 自述「绿读数无第三方复现」✗）：`cd thincoder-desktop && node test/run.mjs` ⇒ **tests 165 / pass 165 / fail 0 / exit 0**（4.0s ✓）——机检面闭合 ✓（U127–U150 全数在场 ✓·U74 二十七项 ∧ U76 恰十 ∧ U77 ✓·U49/U49b/U51（**122 键 / 十六视图档** ✓）✓）。
- **逐条目** ✓：**⑤** 槽级模型/provider（核 3 + 通道 4 + 投影 2 ✓）·**⑥** 档位枚举（核 + 通道 + 候选 + 设置面四洞落地 ✓）·**⑦** 占用读数全链（核投影 → 宿主发射 → 归约 → 切片 → 节点 ✓）·**⑧** 附件（渲染半 + 主进程半全链 ✓）+ 复制（块级 + 末条 ✓）✓；**边界** = 斜杠命令族不做 ✓（用户裁定 ✓）。

### 6.2 结算（D7 清单 ✓）

- **提交** ✓：`19dc77b9`（`feat: desktop chat panel (A+B) + e2e harness + env config purge` ✓·**144 档 · +11214 / −1489** ✓·**四批一笔** ✓）——**纳入核验** ✓：提交前实读集合、剔除**他会话**在途档（timer-wake / escalation-canon ✓·用户令其先签入 ✓）与他档 EOL 空改 ✓；**排除** `bench/results/2026-09-25-roster-29-v6-rejudged.pdf`（遗留产物 · 与本批无关 ✓）。
- **台账** ✗：**#428 核销**（A ∥ B 两半俱完 ✓·两步迁移 ✓）；新增 **#449**（`mount-composer` 348 拆族候选待择一 ✓）· **#450**（测试档尺寸机检缺网 ✓）· **#451**（VSC 侧 `effort` 施加面未验 ✓）；**#441 / #439 / #435** 等在册 ✓。
- **本档冻结** ✓；状态行 / 计数 / 指针随动 ✓（§1 二十块 + §2 十一块 + 各舱 §5 ✓）。
- **未决项（在册 ✓）** ✗：① `mount-composer` 348 与「测试档尺寸网」= **设计面预案待补**（#449 / #450 ✓·窗口 = 各自下次触碰批 ✓）；② VSC `effort` 施加深度**未验**（#451 ✓·**不得断言** ✓）；③ **T-DSK21 人工走查**（真粘贴 / 真剪贴板 / 真落盘后图片指针 / 真机 `.thincoder/tmp` 权限 ✓）待用户 ✓；④ 设计档 `i18n` 键数句 **不设**（父侧裁 ✓·键数活锁 = U51 ✓·**防第二处漂源** ✓）；⑤ 批档体量 ~1900 行（越 1000 守卫线 ✗·**教训已入册**：下批 §5 汇总化 ✓）。
- **设计槽** ✓：两枚（`d7a32a47…` B 原版 · `4c134550…` ⑥ 修订版）⇒ 链终 `consume-design` 消费 ✓。

### 6.3 结语

**一句话** ✓：**桌面端从「能聊」走到「能管、能调、能贴图」** ✓ —— 会话各记各的模型与档位 ✓·状态栏真的显示占用 ✓·贴图能发、非视觉模型有降级提示 ✓·**165/165 全绿（父侧亲跑 ✓）** ✓。
**过程账** ✗（如实 ✓）：**孤儿格 8 例**（其中 **5 例父侧制造** ✓：漏抄 / 漏格 ×3 / 脱落 ✓）·**同档双写风险 3 次**（全拦截 ✓）·**空转舱 1 例**（#86 · 686 轮零写 ⇒ 用户发现 ⇒ 撤 + 重切 ✓）·**父侧误报 1 次**（「已落盘」✗ ⇒ 子代实读纠回 ✓）——**零流入成品** ✓。
