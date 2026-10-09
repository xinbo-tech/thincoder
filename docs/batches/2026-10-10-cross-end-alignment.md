# 2026-10-10 · cross-end-alignment
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令 + 清账轮批档簇Ⅶ = #821 ∥ #1011 ∥ #1046（端差归一）。
> 台账 = #821（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅶ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10「全清了」——本批 = 清账轮簇Ⅶ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 §②）；授权 = 会话全自动沿用。

**条目（3）**：
- `#821`：跨端显示面差——同一 error 记录 CLI `✓ … — err`（文本载）∥ VSC·桌面 `⏹ …`（词面）⇒ 端差归一 ∥ 明书端差判据（择一）。
- `#1011`：WEBVIEW §4 F-W16② 端差句复核——需求档「成功面不拼 (exit code 0)」 vs `render-core/tool-summary.mjs:24` 自述已归一（#677·I16b）⇒ 文档随正 ∥ 核 CLI 侧对位。
- `#1046`：CLI `/mcp` 表单 env/headers 串式 ↔ VSC/桌面行式端差——对齐评估（口径单源 `MCP.md:131-144`）。

**边界**：三端显示/表单面（CLI ∥ VSC ∥ 桌面 + render-core）；#1046 含表单交互行为面；不触他簇。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① U-A（需求档 §4 全表顺扫 · 拟文现成）归父侧笔——落讫入 §6；② U-B 台账 `#1011` evidence 坐标随正（已落）；③ U-C（CLI 写面 status:"error" 语义）→ 归批 台账 `#1175`；④ U-D 历史断言 ✓（批档冻结不上改；新批件立新断言）。

**U-A 已落（2026-10-10 · 父侧笔）**：`docs/vsc/requirements/WEBVIEW.md`——§4 端差口径段重写（`:111`）+ 十六行逐行替换（「已裁保留（类判据）」零残留）+ P2-3/P2-4半/P2-7 时态收正 + 变更记录 +1 行（`:201`）；依据 = #705 拟文（`2026-09-30-vsc-cleanup.md` §2.6①）。残留：设计档随动（`:629/:635/:127`）= 实施臂/随动轮承接。

**父裁（2026-10-10 · 评审 #74 pass 回执）**：F1（U-A 两态）⇒ 以「**父侧已落讫**」为准——实施轮零重做、只读回核（§2 行 5/行 7/U-A 的待落态作废）∥ F2（`MCP.md:131-144` 对 `:106-107`/`:193`）⇒ 实施轮按 §2 行 9 坐标复读核（若 `:131-144` 载串式语义则补随正）∥ F3 errPart 移位 = 仅 error 面 ∥ F4 拒收断言（空键/空值/无 `=`）入 L4 ∥ F5（仓套件）⇒ **Not an issue——已核：桌面 ∥ VSC `test/files.mjs` 均空清单，仓套件零涉** ∥ 🔵 F6..F9 随正/维持。**实施派工 = eng-coder #85**（token 已签 · designId `a619cca4…`；与 #84 同域冲突自动串行排队）；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（三件定形（#821 归一向裁定 + CLI 改法 ∥ #1011 随正坐标（拟文在册）∥ #1046 三端实读 + 行集化改法）；产品码零触（设计轮）；上抛 4；2026-10-10）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**一、本批条目（覆盖）**

- 台账 **#821**（tech_todo · 归批）：跨端显示面差归一——同一 error 记录：CLI `✓ … — err`（文本载）∥ VSC·桌面 `⏹ …`（词面）。本批 = **裁定归一向 + CLI 落地改法**（§三.1；方案与理由逐条）。
- 台账 **#1011**（tech_todo · 归批）：WEBVIEW §4 F-W16② 端差句复核（需求档「成功面不拼 `(exit code 0)`」vs 现盘已归一）⇒ **复核结论 + 文档随正坐标**（§三.2）。需求档笔 = 主 agent（拟文已在册、可直接落）。
- 台账 **#1046**（tech_todo · core · 归批）：CLI `/mcp` 表单 env/headers 串式端差——对齐评估（跨端形差默认消除）⇒ **三端实读 + CLI 行集化改法**（§三.3）。

**不在本批**：他簇（清账轮 Ⅰ–Ⅵ 各批面）；`#1011` 的 §4 全表顺扫（见 §九 U-A——需求笔、待父侧裁，不代行）；CLI 写面 status 词语义（§九 U-C 观察项）；GUI 两端管理面（#1036 已收口面零触）；提示词面；需求档正文（随正笔属主 agent）。

**二、证据底盘（file:line = 本设计轮实读 · as-of 2026-10-10）**

| # | 事实 | 证据 |
|---|---|---|
| 1 | render-core 冻结头错误面 = `⏹ + error` + 注记（括号外）——VSC ∥ 桌面共享核件 | `thincoder-render-core/subblocks/activity-view.mjs:69-70`（icon/verb）∥ `:84`（verb 入括号）∥ `:88-91`（注记 ` — ` 括号外）；VSC = 2 行 shim（`thincoder-vscode/webview/activity-view.js`）∥ 桌面同源消费 |
| 2 | CLI 冻结头错误面 = `✓ + done` + `— err`（括号内） | `thincoder-cli/src/tui/render-segments.mjs:88-93`（icon 三态 `:91` ∥ verb `:92` ∥ errPart 入括号 `:93`） |
| 3 | CLI 读面合成件无错误面事实（仅 `stopped` ∥ `lastError`） | `thincoder-cli/src/tui/lifecycle-records.mjs:135-159`（`:153-155`） |
| 4 | CLI 写面 status 推导 = `stopped ? stopped : lastError ? error : done`（error 记录恒携 `meta.error`） | `lifecycle-records.mjs:55` ∥ `:59` |
| 5 | §6.26 词面判据②：错误面 = `error ∥ failed` ⇒ **⏹ + error（+ 文本注记）**；同段载豁免句「CLI error 面维持文本载（显示面差在册）」 | `docs/core/design/SESSION.md:1008-1009` |
| 6 | CLI 冻结头设计（图标三态互斥 M5） | `docs/cli/design/TUI.md:340` |
| 7 | CLI 恢复合成件字段句 + 停面词判据段（#795 落笔位） | `docs/cli/design/TUI-SESSION-VIEW.md:196-198` |
| 8 | U2 源（父裁 = 在册——射程判断，非证据）+ 台账 evidence | `docs/batches/2026-10-02-record-shape-residuals.md:163`；台账 #821 |
| 9 | 「成功面不拼」活面现载（3 处——全部载体，grep 全仓穷举） | `docs/vsc/requirements/WEBVIEW.md:129` ∥ `docs/vsc/design/WEBVIEW.md:629` ∥ `:635`（余命中皆批档/测试冻结件） |
| 10 | 「② 成功面不拼」已被裁 **消**（口径归一以 CLI 标尺）且已落（#677 · I16b） | `docs/batches/2026-09-30-crossline-clearance.md:133`（裁定）∥ `:441`（I16b 实读） |
| 11 | 设计档已收正（§4.3 = 消/已落）；U-W10 ∥ U-W16 两行未随动（内张力） | `docs/vsc/design/WEBVIEW.md:127` ∥ `:133` vs `:629` ∥ `:635` |
| 12 | 需求档随正拟文在册（2026-09-30·#705——**未落盘**，本刻实读仍旧文） | `docs/batches/2026-09-30-vsc-cleanup.md:109-139`（§2.6 A/B；`:129` 行拟文 = 「卡态语义 **实证例外（宿主 + 行为证据）**；成功面 `(exit code 0)` = **消（已落——#677 · I16b）**」） |
| 13 | CLI 侧对位核（成功面恒拼 `(exit code 0)`——「CLI 摘要侧拼退出状态」句为真） | `thincoder-cli/src/tui/tool-summaries.mjs:60-68`（status 恒拼 `:63-66`） |
| 14 | VSC ∥ 桌面摘要面 = 核件直取（成功面已归一 ⇒ 「本端仅失败面拼非零状态」现为假） | `thincoder-vscode/webview/tool-summary.js:1-2`（再导出 shim）∥ `thincoder-desktop/renderer/views/chat-tool.mjs:23`（`/rc/tool-summary.mjs`）∥ 核 `thincoder-render-core/tool-summary.mjs:17` ∥ `:24` ∥ `:94-98` |
| 15 | CLI `/mcp` 表单串式：逗号切分 + 首 `=` + 成对引号剥离；`k=` 删项 ∥ `-` 清空 ∥ 空=不变 | `thincoder-cli/src/tui/cmd-mcp-form.mjs:17-29` ∥ `:138` ∥ `:141` ∥ `:151-172` |
| 16 | GUI 两端行式编辑器：行格 + 加删；提交四判据；值=字面 | VSC `thincoder-vscode/webview/settings-mcp-dialog.js:27-33` ∥ `:46-57` ∥ `:129-140`；桌面 `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs:40-52` ∥ `:123-146` |
| 17 | 口径单源现载「三端管理面输入形现不一致（CLI 串式 vs GUI 行式），端差登记在册」 | `docs/core/design/MCP.md:106-107`（§6.5 射程句）∥ `:193`（D-MC9 括注） |
| 18 | GUI 行式位阶：提交四判据 ∥ 值=字面 ∥ 零项零行 ∥ 粘贴零解析 | `docs/vsc/design/SETTINGS.md:728`（U-S17）∥ `docs/desktop/design/SETTINGS.md:32`（KD-76） |

**三、逐件设计**

**三.1 `#821` 归一向裁定 + 改法**

**裁定 = 消（端差归一，取向词面）**。归一向 = **CLI 对齐 render-core 形**（`⏹ + error` + 注记括号外）——即 CLI 增错误面分支，非 VSC/桌面退向文本载。

理由（四条）：

1. **判据向**：跨端显示面差默认 = 消，保留例外唯一凭据 = 宿主能力面证据 ∥ 行为证据（`docs/vsc/design/WEBVIEW.md:3` 档头判据句）。本面同记录、一端独异，且 CLI 终端可表达 `⏹` 与 `error`（同头 stopped 面已用 `⏹`——`render-segments.mjs:91`）⇒ 无宿主凭据，保留不受理（2026-10-02 KD-5 的「在册」= 射程判断，非证据）。
2. **事实向**：CLI 现形态与自家记录相抵——写面对 error 记录已写 `status:"error"`（`lifecycle-records.mjs:55`），显示面却读作 `✓ done`；跨端重开（VSC/桌面读该记录）已按 `⏹ error` 呈现 ⇒ CLI 是自相矛盾的唯一端（与 #795「cancelled ⇒ 误标 ✓ done」同型，该件已修，本件为其同类残面）。
3. **单源向**：render-core（`activity-view.mjs:69-70`）为共享核件、VSC ∥ 桌面两端同形 ⇒ CLI 取对齐 = 2/3 端零动。
4. **机理向**：`✓` + verb `done` 对 error 面属面类误读；「error 词随文本走」不变式（error 记录恒携文本——`:59`）使词面化零信息损失（文本注记照携）。

**改法（三条落点 + 档面随正）：**

1. **冻结事实（CLI 单点）**：`thincoder-cli/src/tui/subagent-freeze.mjs` `freezeSubTaskLines`（`:88-99` 邻域——live 块冻结唯一咽喉）补 `if (!sub.stopped && sub.lastError) sub.errored = true`（与写面 status 推导 `lifecycle-records.mjs:55` 同式）。
2. **读面事实**：`lifecycle-records.mjs` `synthSubTask`（`:141-158`）补 `errored: meta.status === "error" || meta.status === "failed"`（§6.26 词面判据②错误面词集；缺 status ∥ 未知词照 done——沿 #795 判据）。
3. **显示面**：`render-segments.mjs` `frozenSubTaskLines`（`:88-93`）——
   - `const icon = sub.approval ? "⏸" : (sub.stopped || sub.errored) ? "⏹" : "✓"`
   - `const verb = sub.stopped ? "stopped" : sub.errored ? "error" : "done"`
   - `errPart` 移出括号：`… · ${verb} ${elapsed}s${turnPart}]${errPart}`。
   - 成品形 = `[⏹ eng-coder#5 · sync · glm · error 12s · turn 3/100] — boom`——与 render-core（`:84` + `:88-91`）逐段同形（icon ∥ verb ∥ 注记位）。
4. **档面随正**（设计档 · 3 处 + 变更行）：`docs/core/design/SESSION.md:1009` 删句「；CLI error 面维持文本载（显示面差在册）」（豁免退场 = 本件消解——D8 删除，不留史）；`docs/cli/design/TUI.md:340` 冻结头句随正（三态 ⇒ `⏸` / `⏹`（stopped ∪ error）/ `✓` + verb 三词 stopped/error/done）；`docs/cli/design/TUI-SESSION-VIEW.md:196-198` 合成件字段句补 `errored`（+1 行，格式沿 `:198` 停面词判据行）。

量级：产品码 **3 档 ≈ +5~8 行**；零新字段 ∥ 零协议 ∥ 零存储面 ∥ 写面零动。

负控：stopped 面 ∥ done 面 ∥ queued（waiting）面 ∥ awaitingDigest 面逐字不变；`⏸` 审批优先级不变；errPart 文本内容/截断零改（仅移位）。

**三.2 `#1011` 复核结论 + 文档随正坐标**

**复核结论 = 随正（② 句不实；保留理由不成立）**：该端差已裁「消」且实现已落（证据 #10）；「（CLI 摘要侧拼退出状态；本端仅失败面拼非零状态）」现为假（#14——VSC shim ∥ 桌面直取核件均含成功面拼接）；CLI 侧对位核毕（#13——成功面恒拼 `(exit code 0)`）。**保留无据**：无宿主 ∥ 行为证据可立（同一记录的摘要文本、数据面同源）⇒ 不列保留。

**随正坐标（分三层）：**

- **① 需求档（主 agent 笔——拟文现成、可直接落）**：`docs/vsc/requirements/WEBVIEW.md:129` F-W16 行——拟文 = `vsc-cleanup §2.6 B` 同行（证据 #12）：「卡态语义 **实证例外（宿主 + 行为证据）**；成功面 `(exit code 0)` = **消（已落——#677 · I16b）**」；行头「已裁保留 2026-09-25——类判据 = §6.1 首」退场（类级判据 2026-09-30 已退场）；变更记录 +1 条。
- **② 设计档（本席域——随动轮落）**：`docs/vsc/design/WEBVIEW.md:629`（U-W10）∥ `:635`（U-W16）——「成功面不拼 `(exit code 0)`」⇒「成功面拼接已归一（`(exit code 0)` 拼——#677 · I16b）」；`docs/vsc/design/WEBVIEW.md:127` 括注「#677 实施清单」⇒「已落——#677 · I16b」（与 `:133` 同式——D12 内张力收正）；变更记录 +1 条。
- **③ 同表顺扫（推荐 · 待裁——见 §九 U-A，不在本批默认射程）**：`docs/vsc/requirements/WEBVIEW.md:111` 端差口径段 + §4 全表（`:115-137`）「已裁保留（类判据 = §6.1 首）」全数退场——拟文现成 = `vsc-cleanup §2.6 A/B`（口径段重写 1 段 + 逐行结论表 16 行 + 零改行清单），零新设计工作量。

机检法：落笔后 `grep 成功面不拼` 于 `docs/vsc/requirements/WEBVIEW.md` ∥ `docs/vsc/design/WEBVIEW.md` 零命中（负向锁）；`已裁保留（类判据` 于需求档 §4 按裁定面清零（全表落 ⇒ 0；仅 F-W16 ⇒ 余 15 行留——U-A 裁项）。

**三.3 `#1046` 三端实读 + 改法（行集语义面）**

**三端实读：**

- **CLI（串式）**：`cmd-mcp-form.mjs`——提示词「(comma-separated)」（`:138` ∥ `:141`）；解析 `mergeKeyValuePairs`（`:17-29`）逗号切 + 首 `=` + 成对引号剥离（`:22`）；`k=` 删项 ∥ `-` 整串清空 ∥ 空=不变（`:151-172`）；现值显示 `k=v` 串（`:118-121`）。**缺陷同族**：值含逗号即坏（`KEY=va,lue` ⇒ 残片丢弃——与 #1036 修复前的 GUI 病灶同型；本端未修）。
- **VSC（行式）**：`settings-mcp-dialog.js`——行 = 键格 + 值格 + ✕（`:27-33`）；加行（`:129-134`）∥ 删行（`:135-139`）；提交四判据（`:46-57`：trim ∥ 空键/空值行不提交 ∥ 重复键后行胜 ∥ 全空删字段）；值=字面（零引号剥离）。位阶 = `docs/vsc/design/SETTINGS.md` §2.4 ∥ U-S17（`:728`）。
- **桌面（行式）**：`mount-settings-segments-mcp.mjs`——行令牌态 `form.kv`（`:23-38`）；加删出口 `kvAdd` ∥ `kvRemove`（`:123-146`）；提交 `kvFromForm` 四判据（`:40-52`）。位阶 = `docs/desktop/design/SETTINGS.md` §1 KD-76（`:32`）。

**改法（消——CLI 行集化）**：env/headers 字段由「整串输入」改为「**逐对行集编辑**」（终端原生载体 = 既有 `showPicker` + `askQuestion`，零新组件类）：

1. 选 `Headers`/`Env` 字段 ⇒ **行集选择器**（`showPicker`）：每行 = 一对（`k=<值/掩码>`——敏感值掩码沿 `isSensitiveKey` 单源 `:119`；父侧收正 2026-10-10 · 可 revert）；末行 `＋ Add row` ∥ `← Back`。
2. 选某对 ⇒ 问句 `… (current: <值/掩码>; '-' removes; empty keeps):`——空=不变 ∥ `-`=删该行 ∥ 值=字面设置（零引号剥离）。
3. `＋ Add row` ⇒ 问句 `key=value`——首 `=` 切；键非空 ∧ 值非空 ⇒ 追加（重复键 = 后行胜）；空键 ∥ 空值 ∥ 无 `=` ⇒ 拒 + 提示（沿 GUI「空行不提交」）。
4. 全删 ⇒ 字段删除（沿 GUI「全空 ⇒ 字段删除」）；串式半语法（comma-split ∥ 引号剥离 ∥ `-` 整串清空）退场。

**口径变化点（明示）**：① 值 = 字面（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——引号剥离退场）；② 多对粘贴不再展开为多对（粘进单问句 = 单对值——与 GUI「粘贴零解析」同取舍）；③ 清空 = 逐行删。

**残余载体差（登记实证例外——附证据）**：逐对「选择+问句」序（TUI 表单机制——F3/F3b ∥ UI 决策 #3）∥ GUI 同屏行格；键原地改名 = 删+加两步（GUI 可原地改键）。判据 = 功能两端在位（行 = 一对 ∥ 加/删/改齐 ∥ 提交四判据同 ∥ 值字面）；证据 = 两实现树坐标（本段实读 ∥ KD-76 ∥ U-S17）；先例 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1「功能两端在位 + 载体差」两行（滚动 `:228` ∥ 输入提示 `:229`）。**备选（须业主裁项）**：若要求残差归零 ⇒ CLI 全屏多行行格编辑器（新组件类——成本量级另议）；本设计推荐不为（成本 ≫ 收益）。

**口径单源随正**：`docs/core/design/MCP.md:106-107`（§6.5 射程句）∥ `:193`（D-MC9 括注）——「三端管理面输入形现不一致（CLI 串式 vs GUI 行式）」⇒「三端行集语义同源：CLI = 逐对（选择+问句载体）∥ GUI = 行格；残余 = 载体差（登记）」。

量级：产品码 **1 档** `cmd-mcp-form.mjs`（203）≈ **+60~90 / −15**；`cmd-mcp.mjs` ∥ GUI 两端 ∥ 落盘形（仍对象）∥ 载荷形零触。

**四、逐条落地表（动作 ∥ 目标 file:line ∥ 期望 ∥ 机检法）**

| # | 动作 | 目标 file:line（现读） | 期望 | 机检法 |
|---|---|---|---|---|
| 1 | `#821` 冻结事实 | `thincoder-cli/src/tui/subagent-freeze.mjs:88-99`（`freezeSubTaskLines`） | `!stopped && lastError` ⇒ `sub.errored=true`（与 `:55` 同式） | 批内件 L1：桩 sub 过冻结 ⇒ 事实在场 ∥ 纯 done ⇒ 零事实 |
| 2 | `#821` 读面事实 | `thincoder-cli/src/tui/lifecycle-records.mjs:141-158`（`synthSubTask`） | `errored = status ∈ {error, failed}` | L1 直测：error ∥ failed ⇒ true；stopped ∥ done ∥ 缺省 ∥ 未知 ⇒ false |
| 3 | `#821` 显示面 | `thincoder-cli/src/tui/render-segments.mjs:88-93`（`frozenSubTaskLines`） | `[⏹ … · error Ns · turn t/m] — err`（注记括号外） | L2 成品形（`historyToLines`+`frozenSubSeg` 直驱，沿 #795 批件 L3 先例）∥ L3 跨端对拍（同 meta：CLI 折叠头 vs 核件 `refreshBlock` ⇒ `.sub-hdr`——icon ∥ verb ∥ 注记位三段对齐；happy-dom 真链，沿 #794 批件 L2 先例；禁复制字面） |
| 4 | `#821` 档面随正 | `docs/core/design/SESSION.md:1009` ∥ `docs/cli/design/TUI.md:340` ∥ `docs/cli/design/TUI-SESSION-VIEW.md:196-198` | 豁免句删 ∥ 冻结头句随正 ∥ 合成件补 `errored` 行 | 落笔后逐处读回；`grep 文本载`（SESSION.md §6.26 域）零命中 |
| 5 | `#1011` 需求档随正（主 agent 笔） | `docs/vsc/requirements/WEBVIEW.md:129`（+变更记录） | 拟文 = #12 同行（② 停载 = 消（已落）∥ 行头退场） | `grep 成功面不拼` 该档零命中 |
| 6 | `#1011` 设计档随正 | `docs/vsc/design/WEBVIEW.md:629` ∥ `:635` ∥ `:127`（+变更记录） | 「不拼」⇒「归一已落」；「实施清单」⇒「已落」 | `grep 成功面不拼` 该档零命中 ∥ `:127` 与 `:133` 同式读回 |
| 7 | `#1011` 同表顺扫（推荐·待裁 U-A） | `docs/vsc/requirements/WEBVIEW.md:111 + :115-137` | 全表按 `vsc-cleanup §2.6 A/B` 拟文替换 | 落笔后 `已裁保留（类判据` 该档零命中 |
| 8 | `#1046` CLI 行集化 | `thincoder-cli/src/tui/cmd-mcp-form.mjs`（`:17-29` ∥ `:118-121` ∥ `:133-146` ∥ `:151-172` ∥ `:177-203`） | 逐对行集编辑（§三.3 改法 1–4） | 批内件 L4：stub-ctx 直驱 `fieldPicker`——值含逗号存取往返保真 ∥ 加/删/改三操作 ∥ 四判据 ∥ 串式半语法零残留 |
| 9 | `#1046` 口径单源随正 | `docs/core/design/MCP.md:106-107` ∥ `:193`（+变更记录） | 射程句改述（行集语义同源 + 载体差登记） | 落笔后读回 |
| 10 | 批内件新档 | `docs/batches/2026-10-10-cross-end-alignment.test.mjs` | L1–L4 腿 | `node --test docs/batches/2026-10-10-cross-end-alignment.test.mjs` 全绿 |

执行面（沿先例）：产品码 + 批内件 = eng-coder；设计档随动（#4 设计档部分 ∥ #6 ∥ #9）= eng-designer 随动轮；需求档（#5 ∥ #7）= 主 agent 笔。

**五、受影响文件与测试面（行数 = 内容行数口径 · 文末换行不计 · as-of 2026-10-10 实读）**

产品码（4 档）：

| 档 | 现行 | 改动面（估） |
|---|---|---|
| `thincoder-cli/src/tui/render-segments.mjs` | 170 | ±3（icon/verb/注记位） |
| `thincoder-cli/src/tui/lifecycle-records.mjs` | 207 | +1~2（`errored`） |
| `thincoder-cli/src/tui/subagent-freeze.mjs` | 248 | +1（冻结单点事实） |
| `thincoder-cli/src/tui/cmd-mcp-form.mjs` | 203 | +60~90 / −15（行集化） |
| — 零触 | — | `cmd-mcp.mjs` ∥ `tool-summaries.mjs` ∥ 核件 `tool-summary.mjs`/`activity-view.mjs` ∥ `subagent-panel.mjs` ∥ `subagent-blocks.mjs` ∥ GUI 两端全树 ∥ 落盘/记录形/协议/载荷 |

设计档（随动 · 6 处 + 变更行）：`docs/core/design/SESSION.md:1009` ∥ `docs/cli/design/TUI.md:340` ∥ `docs/cli/design/TUI-SESSION-VIEW.md:196-198` ∥ `docs/vsc/design/WEBVIEW.md:127/:629/:635` ∥ `docs/core/design/MCP.md:106-107/:193`；需求档 `docs/vsc/requirements/WEBVIEW.md:129`（+:111/表 待裁）。

批内件：`docs/batches/2026-10-10-cross-end-alignment.test.mjs`（新档 ≈180~260 行 · 四腿 L1–L4；随批留存 · 不进仓套件）。

**六、验收对照（回指三件——逐条机检）**

- **AC-1（对 #821）**：CLI error 记录折叠头 = `[⏹ … · error Ns · turn t/m] — err`（icon ∥ verb ∥ 注记位三段与核件同形）；负控 = stopped/done/queued/awaitingDigest 面逐字不变（L1–L3）。
- **AC-2（对 #1011）**：复核结论（随正、无保留）在册；随正坐标 + 拟文在位（可直落）；CLI 侧对位读数在册（#13）；机检 = 落笔后「成功面不拼」两档零命中（AC 面 = 落笔轮）。
- **AC-3（对 #1046）**：行集化后——值含逗号存取往返保真 ∥ 加/删/改三操作在位 ∥ 提交四判据同 GUI ∥ 串式半语法零残留（L4）。
- **AC-4（负控）**：三端写面词表 ∥ 记录形 ∥ 协议 ∥ GUI 两端 ∥ 落盘形零触；批内件独立可跑；零越档（产品码仅列 4 档；设计档仅列 6 处）。
- **AC-5（量级）**：产品码净增 ≤ ≈+100 行；无一档近 500 硬限（最大 `cmd-mcp-form.mjs` ≤ ≈280）。

**七、关键决策（含否决）**

- **KD-1 `#821` 归一向 = CLI 对齐词面**（`⏹ + error`）。否决：① VSC/桌面退向文本载（2/3 端 + 共享核件返工）；② 维持「在册」（无证据 + 与自家写面 status 相抵）。
- **KD-2 `#821` 注记位 = 括号外**（与核件 `:88-91` 整形对齐）。否决：仅改 icon/verb 保括号内（同记录仍留形差，未达「取一致」）。
- **KD-3 `#821` 读面判据 = status 词（error ∥ failed）**。否决：继续以「lastError 文本在场」推断（他端无文本的 error 记录将误读 ✓ done）。
- **KD-4 `#1011` = 随正（不列保留）**。拟文沿 `vsc-cleanup §2.6`（零新设计）。否决：以「历史在册」维持（类判据已退场 + 实现已消 + 保留无据）。
- **KD-5 `#1046` = CLI 行集化（逐对 + 既有 picker/问句载体）**。否决：① 全屏行格编辑器（新组件类——成本 ≫ 收益，列为备选待裁）；② 保持串式 + 登记（违默认消，且逗号缺陷同族未除）。
- **KD-6 `#1046` 提交语义 = 沿 GUI 四判据**（trim ∥ 空行丢 ∥ 重复后胜 ∥ 全空删字段——判据同源 = KD-76/U-S17 面）。

**八、边界（不做）**

- 产品码零触面：GUI 两端（VSC ∥ 桌面）全树；核件（render-core）；`tool-summaries.mjs` ∥ `cmd-mcp.mjs`；未列 CLI 档；写面词表 ∥ 记录形 ∥ 协议 ∥ 载荷 ∥ 落盘节律。
- 需求档正文（主 agent 笔——本设计只出坐标与拟文）；提示词面；他簇（清账轮 Ⅰ–Ⅵ）；U-A 裁前 §4 全表顺扫不落。
- 设计轮零写（本 §2 外零文件）；实施 = 批准后另派；越档扩改禁止。

**九、上抛 / 发现（报告——不夹带）**

- **U-A（`#1011` 同表顺扫 · 待裁）**：需求档 §4 全表 16 行 + `:111` 口径段的「已裁保留（类判据 = §6.1 首）」为 2026-09-30 裁定后未落残句（拟文在 `vsc-cleanup §2.6 A/B`，含逐行证据与零改行清单）；本批 = 该表触碰窗口，不落 ⇒ 表半新半旧（F-W16 行新、余行旧）。**请裁**：全表同拍落 ∥ 仅 F-W16 行（本设计推荐前者——零新设计 + 同类残句一次清）。笔 = 主 agent。
- **U-B（台账坐标漂移 · 披露）**：`#1011` evidence 载「需求档 §4『TUI N5–N6』端差行」——「② 成功面不拼」实际载体 = `:129` F-W16 行（`:127` N5–N6 行载另一端差——「省略 N 行」体系）。本 §2 按实读坐标；台账笔 = 主 agent（记录面披露，不代改）。
- **U-C（`#821` 邻面观察 · 非本批）**：CLI 写面 status 推导（`lifecycle-records.mjs:55`）将 turn-cap ∥ interrupted 消息（`tool-events.mjs:221/:249` ∥ `subagent-freeze.mjs:211`）一并落 `status:"error"`——与 VSC 侧「done 面 + note（X6/X11）」语义有别（既有、跨批）；本批零动写面。归一会使这些记录显示随写面词面化（`⏹ error` + 注记）——显示更贴记录字面；**建议另立条目裁**（写面语义 vs 显示面），本批不做。
- **U-D（批内件断言代际 · 披露）**：`docs/batches/2026-10-02-record-shape-residuals.test.mjs` 的 L3/L5 断言（error = `✓` + 括号内 `— err`）为「在册」时代产物——本批归一后成为**历史断言**（批档冻结、不上改）；新批件立新断言。防「旧断言在盘 = 活判据」误读。
- **对账零出入**：三件台账行 ∥ 派发文 ∥ 本 §2 实读四方一致（唯 U-B 一处坐标漂移、U-C/U-D 两处披露，均不夹带动作）。

**读回注记（D6）**：§2 落笔后读回核讫（本段）。产品码触面 = 4 档（实施轮另派）；设计档 6 处随动；批内件 1 档四腿；需求档随正 = 主 agent 笔（拟文/坐标在册）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象：`docs/batches/2026-10-10-cross-end-alignment.md` §2（设计轮）· 范围限本档全文；跨档证据按在册坐标引用、未重读处标 unverified；无项目标准档 ∥ 无文档地图（方法学按 AGENTS.md + 评审标准判；文档归属项降级为摆放面核验）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state | 🟡 | 需求档动作两态并存：§1 述「十六行逐行替换（「已裁保留（类判据）」零残留）」（`d:\teamcode\thincoder\docs\batches\2026-10-10-cross-end-alignment.md:24`，记「U-A 已落」），而 §2 以未落为基面——证据 #12「本刻实读仍旧文」（`:53`）、行 5「`#1011` 需求档随正（主 agent 笔）」（`:132`）、U-A「不落 ⇒ 表半新半旧（F-W16 行新、余行旧）」（`:182`）、「需求笔、待父侧裁，不代行」（`:36`）；两态不能同真，实施轮易重做 ∥ 错跳 | 择一收正：若已落 ⇒ 行 5/行 7 与 U-A 改记「已落核讫」、机检（`:99` ∥ `:132`）按现刻可跑重述；若未落 ⇒ 更正 `:24` 的「已落」表述（附实读坐标） |
| 2 | Requirements | 🟡 | `#1046` 口径单源坐标两版：§1 指「口径单源 `MCP.md:131-144`」（`:16`）；§2 随正集仅「`docs/core/design/MCP.md:106-107`（§6.5 射程句）∥ `:193`（D-MC9 括注）」（`:120`、行 9 `:136`）——`:131-144` 未现于 §2 任何落点，若该区间载串式/输入形语义则随正漏点 | 核 `MCP.md:131-144` 载何：载串式 ∥ 输入形语义 ⇒ 补入随正集（行 9）；不载 ⇒ 把 `:16` 坐标口径收正为 `:106-107`/`:193` |
| 3 | Acceptance | 🟡 | errPart 移位条件未明：「`errPart` 移出括号」（`:81`）按模板对成品形无条件成立；负控却称「负控：stopped 面 ∥ done 面 ∥ queued（waiting）面 ∥ awaitingDigest 面逐字不变」（`:87`）。写面优先式「`stopped ? stopped : lastError ? error : done`」（`:45`）暗示 stopped ∧ lastError 并存可能——若 stopped 面可携 errPart，移位必变其形，负控自抵 | 明示 errPart 出现条件与移位范围（如仅 error 面移位）；或按实况改写负控（「仅 error 面移位，余面逐字不变」）并同步 L2/L3 断言 |
| 4 | Acceptance | 🟡 | `#1046` 新错路未入验证：「空键 ∥ 空值 ∥ 无 `=` ⇒ 拒 + 提示」（`:113`）为使新行为，而 L4 机检仅「加/删/改三操作 ∥ 四判据 ∥ 串式半语法零残留」（`:135`）——拒收路径无对应断言（AC-3 `:161` 同缺） | L4 补拒收断言（空键 ∥ 空值 ∥ 无 `=` 各一），并入 AC-3 机检清单 |
| 5 | Affected files | 🟡 | 受影响面未含既有仓套件用例：§五/§六仅列产品码 4 档 + 设计档 + 批内件（「随批留存 · 不进仓套件」`:155`），无任何既有仓套件测试档；若仓套件覆盖所改档（旧串式解析 ∥ 旧冻结头 `✓`+括号内 err 形），改后必红且未列行数/增量——本评审范围无法核，**unverified** | 核仓套件覆盖：有 ⇒ 补入受影响表（现行行数 + 增量）并加回归跑测条；无 ⇒ 在 §五显式写「仓套件零涉」作已核事实 |
| 6 | Numeric drift | 🔵 | 计数与枚举不符：「设计档（随动 · 6 处 + 变更行）」（`:153`）后缀枚举实为 8 个坐标（SESSION.md:1009 ∥ TUI.md:340 ∥ TUI-SESSION-VIEW.md:196-198 ∥ WEBVIEW.md:127/:629/:635 ∥ MCP.md:106-107/:193），AC-4 复述「设计档仅列 6 处」（`:162`）——零越档核验按此计数易误 | 重数并统一：写 8 个坐标，或明示计数口径（按档 ∥ 按点） |
| 7 | Annotations | 🔵 | 行数标注齐备（170/207/248/203 + 增量；`:147-150`，口径「行数 = 内容行数口径 · 文末换行不计 · as-of 2026-10-10 实读」`:141`），但本评审范围限本档，数值**未核（spot-check 未做）**；另 `+60~90 / −15` 未明净/毛口径——毛增口径（203+90）则超 AC-5「最大 `cmd-mcp-form.mjs` ≤ ≈280」（`:163`） | 跑测时顺带核对现行行数（落差显著则回记）；`+`/`−` 口径一句话写明（净增 ≤ ≈+100 与 ≤ ≈280 对齐） |
| 8 | Clarity | 🔵 | 字面值 `-` 不可达：编辑问句以 `-` 作删行哨符（「`-`=删该行 ∥ 值=字面设置（零引号剥离）」`:112`），与「① 值 = 字面（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——引号剥离退场）」（`:116`）及「提交四判据同 ∥ 值字面」（`:118`）窄边相抵——CLI 无法存入字面 `-`（GUI 行格可），且未入残余载差登记 | 提示语/口径注明「`-` 保留为删行哨符」，或把该窄差补入残余载差登记 |
| 9 | Clarity | 🔵 | 「零新字段 ∥ 零协议 ∥ 零存储面 ∥ 写面零动」（`:85`）与两处新增 `errored`（`:76` `if (!sub.stopped && sub.lastError) sub.errored = true` ∥ `:77` `errored: meta.status === "error" \|\| meta.status === "failed"`）字面相抵读——易被实施读作「禁添字段」 | 措辞明示「显示层瞬时事实——记录形/载荷零触」（与 AC-4 口径一致） |

**计数**：🔴 0 · 🟡 5 · 🔵 4

**VERDICT: pass**

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（产品码 4 档 + 批内件（14/14 绿）+ 设计档随正 5 档；内审 advisor 终态 clean；两条上抛待 §6 处置）



### 实施记录（eng-coder · 2026-10-10 · 实施轮）

**交付面** = 产品码 4 档（CLI）+ 批内件 1 档 + 设计档随正 5 档；需求档零写（读回核）。**token = 已签（父侧 · 评审 #74 后）**；零触面（GUI 两端全树 ∥ `cmd-mcp.mjs` ∥ tool-summaries ∥ 记录形载荷协议）实读未动。

**产品码（4 档 · `node --check` 全 OK）**

| # | 落点 | 档:行 | 改动 |
|---|---|---|---|
| ¹ | #821 冻结单点 | `thincoder-cli/src/tui/subagent-freeze.mjs:95` | `if (!sub.stopped && sub.lastError) sub.errored = true`（与写面 status 推导 `lifecycle-records.mjs:55` 同式） |
| ² | #821 读面 | `thincoder-cli/src/tui/lifecycle-records.mjs:157` | `errored: meta.status === "error" \|\| meta.status === "failed"`（§6.26 判据②词集）+ 档头字段句 |
| ³ | #821 显示面 | `thincoder-cli/src/tui/render-segments.mjs:96-99` | icon `⏸` > `⏹`(stopped ∪ errored) > `✓` ∥ verb 三词 stopped/error/done ∥ errPart **仅 error 面**移出括号（`errored ? head}]${errPart}` : 原式） |
| ⁴ | #1046 行集化 | `thincoder-cli/src/tui/cmd-mcp-form.mjs:28-65` | `mergeKeyValuePairs` 删 ⇒ `editPairs` 行集编辑（行集 picker：逐对 `k=<值/掩码>` + 末两行 `＋ Add row` ∥ `← Back`；行值问句 ∥ 加行问句；拒收三判据 + 提交四判据 + 敏感掩码沿 `isSensitiveKey`）；提示语随正（`PROMPT_BASES` 两行删） |

行数读数：`render-segments` 177 ∥ `lifecycle-records` 211 ∥ `subagent-freeze` 254 ∥ `cmd-mcp-form` 227（净 ≈ +41 ≤ +100；最大 227 ≤ ≈280——AC-5 ✓；均 ≪ 500）。

**批内件**：`docs/batches/2026-10-10-cross-end-alignment.test.mjs`（326 行 · 五腿）
- 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-10-cross-end-alignment.test.mjs` ⇒ **14 pass / 0 fail**。
- L1 事实（冻结单点 ∥ 合成件 ∥ 记录往返同判）∥ L2 成品形 + 负控四面（stopped ∥ done ∥ waiting ∥ ⏸）∥ **L2b U-C 披露面**（interrupted/turn-cap 随写面词面化 ⇒ `⏹ error` + 括号外注记——把 U-C 披露转成可验断言）∥ L3 跨端对拍（实测读数 `CLI ≡ 核件 = [⏹ eng-coder#5 · sync · glm · error 1s · turn 2/100] — boom`）∥ L4 行集（往返保真 ∥ 四判据 ∥ 拒收三判据 ∥ 掩码 ∥ 源扫零残留 ∥ **L4-6 桩守卫自证**）。
- 禁复制字面：L3 两侧均以实件直出对拍（核件链 = desktop `blockOfMessage` ⇒ `subagentNode`/`fillSubagentEcho` ⇒ `.sub-hdr`；happy-dom 真链，沿 #794/#795 批内件先例）；词面经核 i18n 单实例注入（canonical 词面），未硬编码对侧字面。

**设计档随正（5 档 8 坐标 + 5 变更行）**：`docs/core/design/SESSION.md:1010`（删豁免半句）+ `:1153` ∥ `docs/cli/design/TUI.md:340-341`（三态 + 三词 + 注记位；顺手拆超 300 字行 ⇒ 两行）+ `:780` ∥ `docs/cli/design/TUI-SESSION-VIEW.md:197/:199` + `:240` ∥ `docs/vsc/design/WEBVIEW.md:127/:629/:635` + `:706` ∥ `docs/core/design/MCP.md:106-107/:193` + `:253`。

**机检读数（本刻实跑）**
- `grep 文本载` `docs/core/design/SESSION.md` **全档 0**（变更行不引旧句——避免自污机检）∥ `grep 显示面差在册` **0**。
- `grep 成功面不拼`：`docs/vsc/design/WEBVIEW.md` **0** ✓；`docs/vsc/requirements/WEBVIEW.md` **1**（`:171` 变更记录 2026-09-18 史实行——父侧笔档，本轮零写；**披露见下**）。
- `grep 逗号分隔` `docs/core/design/MCP.md` 仅 `:252`（2026-10-07 历史变更行）；产品码 `mergeKeyValuePairs|comma-separated|clears all|split(",")` **0**。
- 旧批件 `docs/batches/2026-10-02-record-shape-residuals.test.mjs` 复跑 = **4 pass / 2 fail**——恰为 U-D 预告两条历史断言（`:206` L3「error = 文本载」∥ `:241` L5「T3 CLI 读面类」）；按 U-D 裁判不上改（该档 mtime = 2026-10-02，未动）。

**决策透明表**

| 决策 | 依据 | 备选 / 代价 |
|---|---|---|
| errPart 移位经 `errored` 门（非无条件移位） | §3 评审 F3 裁定「仅 error 面」+ §三.1 负控句 | 无条件移位 ⇒ stopped/done/waiting/⏸ 四面逐字变（违反负控） |
| `errored` 两处写（冻结单点 + 合成件），渲染端零推导 | §三.1 改法 1/2（与写面 status 推导同式） | 渲染端自推 ⇒ 判据散点、可与写面口径漂 |
| CLI 行集拒收 = **拒 + 提示**（非静默跳过） | §三.3 改法 3（沿 GUI「空行不提交」） | 静默跳过 ⇒ 终端行流面无反馈；载体差登记已载（MCP.md:107） |
| 值 = 字面；`-` 保留为删行哨符 | §三.3 改法 2/4（评审核对项 #8） | 支持字面 `-` ⇒ 需另设哨符；窄差已在问句提示语披露（另一半「登记」见上抛） |
| 变更行不引被删旧句（SESSION.md） | §四 行 4 机检「`grep 文本载` 零命中」 | 引用旧句 ⇒ 机检自污假红 |
| 设计档只改 §2 列 8 坐标（评审 🟡#1/#2 未落） | 越档扩改禁止（§2 结语） | 新增残差登记 = 设计新内容（非本批射程）⇒ 上抛 |

**审计与代码评审轮次与终态**
- **内审 explore（read-only 背离审计）**：FINDINGS 5（🟡1「中断清场/turn-cap 随写面词面化」= U-C 已披露面 ∥ 🔵4）——**0 项实现偏离 ∥ 0 项静默简化**。处置：U-C 面转 L2b 可验断言；`failed` 零产者 ∥ 长注记截断差 ∥ 段缓存签名 ∥ 桩脚本脆性 = 披露/评审面。
- **内审 advisor（code review · round 1）**：**VERDICT: pass**（0 🔴）。🟡2（均 optional）：① stopped 面注记承面跨端仍异且未登记（CLI 括号内 + 携文本 ∥ 核件 cancelled 面零文本——`activity-view.mjs:74` 只读 `meta.note`）② 注记内容整形（空白折叠 + 140 上限）未归一（仅短单行注记下「逐字同头」为真）。🔵4：`failed` dormant ∥ `fSig` 未含新显示字段 ∥ L4 桩脚本静默降级 ∥ 行值 `-` 窄差未登记。
- **fix round = 1（round 1 后）**：采纳 🔵「L4 桩脚本」项——脚本耗尽改**响亮失败** + 流程尾显式 `null` 收 + 行集 picker 取值改零位次依赖 + 新增 L4-6 守卫自证（14/14 复跑绿）。未采纳项：🟡#1/#2（设计档新增登记 = 8 坐标射程外 ⇒ 上抛父侧）、🔵`fSig`（评审自注「本批不必动」）、🔵`failed`（零产者，无动作）、🔵`-` 窄差（提示语已披露，登记项已上抛）。
- **终态 = `clean`**（0 🔴 ∥ 0 must-fix；批内件 14/14 ∥ 产品码语法全绿 ∥ 机检读数如上）。

**上抛（供 §6 处置 · 不夹带动作）**
- `[上抛·知会]` 需求档 `docs/vsc/requirements/WEBVIEW.md:171` 变更记录载旧句「…成功面不拼 `(exit code 0)`」⇒ §四 行 5 机检法「该档零命中」字面不成立（记录面历史行；本轮零写）。请裁：收正该行 ∥ 按「历史变更行保 as-of」惯例豁免。
- `[上抛·待裁]` 评审 🟡#1/#2 两条同族跨端残差（stopped 面注记**承面** ∥ 注记**内容**整形）建议登记（体例 = `MCP.md` §6.5「载体差（登记）」）或另立条目裁——本批射程外，未落。
- `[上抛·知会]` 旧批件两条历史断言复跑红（读数如上）——按 U-D 不上改，防「旧断言在盘 = 活判据」误读。

**行数读数更正（自更正 · 追加）**：上表行数按「含末行换行符」口径多记 1 ⇒ 更正（实读 `split("\n").length − 1`）：`render-segments` **176**（基线 170 · +6）∥ `lifecycle-records` **210**（207 · +3）∥ `subagent-freeze` **253**（248 · +5）∥ `cmd-mcp-form` **226**（203 · +23）——**净 +37**（≤ +100——AC-5 ✓）；最大 226 ≤ ≈280 ✓。批内件 = **329 行**（原记 326——round 1 修复后追加 L2-2 awaitingDigest 负控 + L4-6 桩守卫自证）。

## §6 验证与收口（父代理）

**交付物**：5/5 ✅（eng-coder #85）—— `#821` CLI 冻结头 error 面归一（`⏹` + `error` + 注记居括号外；负控四面逐字不变）∥ `#1011` 设计档随正 5 档 8 坐标 ∥ `#1046` CLI `/mcp` headers/env 行集化（逐对 + `＋ Add row`/`← Back`；拒收三判据 + 提交四判据沿 GUI；敏感掩码沿 `isSensitiveKey`）∥ 批内件 329 行 = **14/14**。

**父侧验证读数**：批内件 **14/14 绿**（父侧实跑 · 780ms；含 L1 事实 ∥ L2 成品形+负控 ∥ L3 跨端对拍 `CLI ≡ 核件` ∥ L4 行集 ∥ L4-6 桩守卫）∥ 产品码 `node --check` ×4 全 OK ∥ 量级净 +37（≤ 门）。

**评审发现处置（逐号）**：① 发现 1（Doc-state 两态并存）⇒ **U-A 实为已落**——证据 = `docs/vsc/requirements/WEBVIEW.md:201` 变更行（U-A 顺扫落笔 · 主 agent · 2026-10-10；§4 十六行逐行替换、「已裁保留（类判据）」族零残留）；§2 以未落为基面 = 设计期时点差，本行收正 ∥ ② 发现 2（MCP.md:131-144 坐标）⇒ 实读核讫：`:131-144` = §6.7/§6.8（探活 + 配置交互），**零串式/输入形语义**——随正集无需扩列（消）∥ ③ 发现 4（拒收断言）⇒ 实施已落（L4-3 拒收三判据腿绿）。

**上抛裁定（父侧）**：① `docs/vsc/requirements/WEBVIEW.md:171` 变更记录旧句（「成功面不拼 `(exit code 0)`」）⇒ **豁免**——记录面历史行不翻改（D8：历史归记录面）；AC-2 机检口径 = 规范面零命中（记录面除外）∥ ② 两条同族跨端残差（冻结面注记承面 ∥ 注记整形）⇒ **另立条目**（已入账）∥ ③ §2 措辞 `k  <值/掩码>` ⇒ `k=<值/掩码>`（父侧收正 · 可 revert）∥ ④ 批内件 329 行超设计估（≈180–260）= L2b 披露面 + L4 硬化所致；AC-5 只管产品码 ⇒ 不视为偏差（在案）。

**U-D 红在册**：旧批件 `docs/batches/2026-10-02-record-shape-residuals.test.mjs` 4/2 红（`:206` ∥ `:241`）= 设计预告两条历史断言（批档冻结不上改——新批件立新断言）。

**评审终态**：内审 advisor（code · 圆 1）= pass（0🔴 ∥ 🟡2 optional ∥ 🔵4）；fix 轮 1（L4 桩响亮失败 + L4-6 守卫）；探索审计 5 发现（0 偏离 / 0 静默简化）；终态 = **clean**。

**结算**：#821 ∥ #1011 ∥ #1046 ⇒ 核销（evidence = 本档 + 14/14 读数）。**待办**：波尾 scoped commit；无未决项。
