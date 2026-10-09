# 2026-10-10 · archived-tests-rebase
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令 + 清账轮批档簇Ⅲ = #798 ∥ #844 ∥ #1108 ∥ #1134（归档批内件重基/退场）。
> 台账 = #1108（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅲ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10「全清了」——本批 = 清账轮簇Ⅲ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 ②）；授权 = 会话全自动沿用。

**条目（4）**：
- `#798`：批内件既有红——余 = b1-host G6（runTurnLoop `promptTail` 装配写回断，深诊）+ b1-loop G4b/G4d（已转 #915）。
- `#844`：`desktop-residuals-round3` 余 8 腿（①④⑥⑩–⑬⑰）+ parity-b8-ipc 全收在案。
- `#1108`：HEAD 即红批内件组（public-repo-read ∥ memory-db-family ∥ structure-split-2）＋ carryover-c1（现 2 绿 7 红；内存门已落待解）＋ 既存红簇（channel-tier-retire/attach-file/i18n-split/M604 三处）。
- `#1134`：carryover-c1 测试件 10GB 级内存炸弹（跨例累计型）——重基须连带：弹窗面改写 + 假 DOM 补 body/modal 宿主后解除门 ∥ 巨型假树值进报告序列化路径一并收。

**关键决策项（设计轮出案）**：**逐件裁定「重基 ∥ 退场」**（价值判据：将来还会复跑 ∥ 已无对照价值）；内存门解除条件；重基件与产品面现状的对齐方式。

**边界**：只动 `docs/batches/**` 归档批内件（+ 相关批档记录）；不触产品码 ∥ 仓套件（批内件不入套件——09-28 重置口径）。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**父侧随正轮收讫（2026-10-10 · ⑧⑨⑩ 三件本刻全绿）**：`2026-10-04-desktop-channel-tier-retire.test.mjs` 8/8（腿② 判据改「读后快照逐字」；键数 59⇒62 ∥ 309⇒322——两漂同判据随盘）∥ `2026-10-05-attach-file-support.test.mjs` 16/16（VIEWS_DICT 144⇒149 ∥ HOST_DICT 314⇒322）∥ `2026-09-29-i18n-split.test.mjs` 5/5（A1 139⇒149 ∥ 自有块 85⇒83；A2 基线全量重冻 314⇒322（`…-split.baseline.json` `_note` 随记·脚本重冻）；A4 护栏 ≤420⇒≤437 ∥ views 386⇒410；A6 九档随盘重锚）。另：`.thincoder/tmp/` 旧稿副本（09-29 原版）已删——以 `docs/batches/` 归档本为唯一在盘件。父侧亲笔 · 逐件可回退；`#1108` 既存红簇归口（§2.1 ⑧⑨⑩/⑪）全部收讫。

**父裁（2026-10-10 · 评审 #81 pass 回执）**：5 🟡 ∥ 2 🔵 逐条——F1（§2 读数/归口落后）⇒ **以现盘为准**：④⑤⑥ 已落（零动作·复跑核）∥ ⑧⑨⑩⑪ 已收讫（零动作）∥ 复跑/验收范围 = ①③⑦；§2.5 `#1108` 行归口按收讫读（不再重做）∥ F2（尺寸）⇒ round3 重锚后 **≤800**（不拆）；⑦ 674 按重锚幅实记 ∥ F3（512MB 口径）⇒ 落**机跑形**（512MB 帽实跑 = 全绿 ∧ 零 OOM）∥ F4（b7-minor 转轨）⇒ **父侧明记**：前档 `:272`/:275 取「标为历史件+约定不重跑」并拒「同笔收正」；本批经全清直令改取「同笔收正」——对象 = 拆分后 `-host` 载体（G3/G4/G6/G7 已拆出——`2026-09-29-parity-b1-vsc-core.test.mjs:11`）∥ F5（parity-b8-ipc）⇒ 零动作（已收在案——沿 §1:15 文面）∥ 🔵 F6（行数表 19 档）/F7（③依据「或」二选一逐处按盘裁）随实施。**实施派工 = eng-coder #91**；产物回后进 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-10（初版——11 件处置表 + carryover-c1 专项（#1134））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2.0 本批条目与设计档落点

- **覆盖条目（4）**：`#798` ∥ `#844` ∥ `#1108` ∥ `#1134`（清账轮簇Ⅲ——来源 `docs/batches/2026-10-10-ledger-full-triage.md` §1 ②Ⅲ）。
- **设计档落点 = 本档 §2**：处置对象全部住 `docs/batches/**`（批内件 + 相关批档记录）——无产品面，无独立设计档；机制设计 = §2.1 处置表 + §2.2 专项。
- **判据口径**：批内件 = 随批归档、不入仓套件；复跑价值 = 将来核对批次时直接复跑。「将来还会复跑」⇒ 重基；「已无对照价值」⇒ 退场。
- **现状读数口径**：下表读数 = 本刻亲跑（2026-10-10 03:5x–04:2x，自 `d:\teamcode\thincoder` 仓根，`node --test`）；carryover-c1 取默认门形 + `--max-old-space-size=1024` 帽。

### §2.1 逐件处置表（11 件）

**总览**（件 ∥ 裁定 ∥ 归口）：

| 件（`docs/batches/`） | 裁定 | 归口 |
|---|---|---|
| `2026-09-29-parity-b1-vsc-core-host.test.mjs` | 重基 | 本批 |
| `2026-09-29-parity-b1-vsc-core-loop.test.mjs` | 已收 · 零动作 | — |
| `2026-09-29-desktop-residuals-round3.test.mjs` | 重基 | 本批 |
| `2026-10-02-public-repo-read.test.mjs` | 重基 | 本批 |
| `2026-09-30-memory-db-family.test.mjs` | 重基 | 本批 |
| `2026-09-29-structure-split-2.test.mjs` | 退场（定档） | 本批 |
| `2026-09-29-desktop-carryover-c1.test.mjs` | 重基（专项 §2.2） | 本批 |
| `2026-10-04-desktop-channel-tier-retire.test.mjs` | 重基 | 父侧随正轮（在办） |
| `2026-10-05-attach-file-support.test.mjs` | 重基 | 父侧随正轮（在办） |
| `2026-09-29-i18n-split.test.mjs` | 重基 | 父侧随正轮（在办） |
| `2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` | 已收 · 零动作 | — |

**逐件明细**：

① `2026-09-29-parity-b1-vsc-core-host.test.mjs`（#798）
- 现状读数：2 例 2 红——G7 结构表首断（`thincoder-vscode/src/agent/run-helpers.mjs` 89⇒88）∥ G6 子进程 RESULT: PASS 37 · FAIL 1（A2 `promptTail` 装配写回断，got=undefined）。
- 裁定：重基。
- 依据：G6 断因 = B7-3b 将 `promptTail` 全链退役（`docs/batches/2026-09-29-parity-b7-minor.md:91`；该档 `:274` 已登记本锁件两断言失据，并留「标为历史件 ∕ 约定不重跑 ∕ 或同笔收正」三候选——本轮即「同笔收正」）；宿主装配环本体现役（`thincoder-vscode/src/extension/panel-turn-loop.mjs:194/:226-227` 现役 adapter 两键 `turnDomainText` ∥ `toolDecorate` 写回在位）。
- 动作：㈠ 件 `:165` 删桩写 `opts.promptTail = "TAIL-BLOCK"`；㈡ 件 `:260` A2 改退役锁（核 opts 键面无 `promptTail` + 现役两键写回照旧——A3 ∥ 裁定① 断言保持）；㈢ G7 `:56-76` 行数表 20 档全表随现盘重读。
- 验收：复跑 2/2 绿（G6 子进程 `FAIL 0`）。

② `2026-09-29-parity-b1-vsc-core-loop.test.mjs`（#798 余腿 → #915）
- 现状读数：6 例 6 绿（本刻复跑）。
- 裁定：已收 · 零动作（#915 已核销 2026-10-04，重锚 6/6）。

③ `2026-09-29-desktop-residuals-round3.test.mjs`（#844）
- 现状读数：17 例 10 绿 7 红（红 = ①④⑥⑦⑩⑫⑬；与 #1108 在册读数有差——⑪⑰转绿、⑦转红，见上抛②）。
- 裁定：重基（7 红腿逐腿重锚；10 绿腿零动）。
- 依据（逐腿）：①④ = `renderer/mount-info.mjs` 全退场（现盘 `mount-info` ∥ `info-row` ∥ `createInfoFace` 零命中；`renderer/views/settings.mjs:15` 现文已换代）——锚与注释目标文按现盘重锚或按 D8 收束；⑥ = 渲染臂语义换代（slot 权威键「零行」——`renderer/views/settings-agent.mjs:176-188`；锚形 = `data-field-name` `:171`；旧「只读行 + `data-readonly`」形整腿重写）；⑦ = #615② 现行实现重锚（`keyDraft` 落位 ∥ 四复位——`renderer/mount-settings-segments-providers.mjs` 现文）；⑩⑫⑬ = 消化行族自然形换代（行出即留 ∥ cap 尾追 ∥ 终态追加——`renderer/views/chat-digest-rows.mjs:101-110`；归约 = 全轮累积 `renderer/events-wake.mjs:61-91`）。
- 动作：① `:119`（锚④⑤⑥）∥ ④ `:88-91`（EDITS 三行目标文）∥ ⑥ `:222-257` ∥ ⑦ `:260-315` ∥ ⑩ `:408-424` ∥ ⑫ `:471-496` ∥ ⑬ `:497-530`——逐腿对现盘重写（等值 ∥ 全等断言强度保持）。
- 验收：复跑 17/17 绿。

④ `2026-10-02-public-repo-read.test.mjs`（#1108）
- 现状读数：文件级红（1 例 0 绿）——导入期 `SyntaxError: … does not provide an export named 'embedTolerant'`（消费点 `thincoder-core/memory/core.mjs:9`；件内 embedding 桩缺该口）。
- 裁定：重基。
- 依据：缺口在桩面（非机制换代）——现职导出 = `thincoder-core/embedding.mjs:60` `embedTolerant(embedder, texts, { signal } = {})` ⇒ `{ vectors, skipped }`；对象面（声明投影 ∥ 同步展开 ∥ 读面集 ∥ 引用三态 ∥ 写门 T46）现役。
- 动作：㈠ 件 `:36-42` 桩补 `embedTolerant`（语义镜像核实现）；㈡ 复跑后余红逐腿对现盘重锚（④ 腿 doc-check 面族按现盘字段）。
- 验收：复跑 exit 0（全绿；读数入 §5）。

⑤ `2026-09-30-memory-db-family.test.mjs`（#1108）
- 现状读数：文件级红（同因——桩 `:27-33` 缺 `embedTolerant`）。
- 裁定：重基。
- 依据：同④（缺口在桩面）。
- 动作：件 `:27-33` 桩补口；复跑后余红逐腿对现盘重锚（T1–T21）。
- 验收：复跑全绿。

⑥ `2026-09-29-structure-split-2.test.mjs`（#1108 ∥ #1130）
- 现状读数：5 例 1 绿 4 红——A 行数 ∥ B sha ∥ C 导出集 ∥ D 拓扑（E 缝绿）。
- 裁定：**退场（定档）**。
- 依据：㈠ B 腿前提灭（「迁出块逐字」= 09-29 拆分一次性验收；冻结对象已被 #738 ∥ #747 ∥ #765 ∥ #768 ∥ #910 等后续批持续改写——重算即自证）；㈡ C/D 腿对象换代（`renderer/views/chat-digest.mjs` 已退场 ⇒ 现 `chat-digest-rows.mjs`；导出面与拓扑整体改写）；㈢ A 腿 = as-of 快照（10-04 同类重锚 6 日内再漂——b1-host G7 ∥ i18n-split 同证）；㈣ 件头注 `:3` 已定性「断代失效 · 留档参考 · 勿按红态排障」——本裁定 = 收为正式处置，消除「红态待处置」悬空。
- 动作：件头注 `:3` 改写为「已退场（2026-10-10 · 本批定档）——不再复跑 ∥ 红态不再受理」；依据入批档 §5。
- 验收：头注文本在位 + 本表在册（复跑口径零列入）。

⑦ `2026-09-29-desktop-carryover-c1.test.mjs`（#1134 ∥ #1108）
- 现状读数：9 例——默认门形 2 绿 1 红 6 跳过（M-652e `:668` 源形断言漂）；全量（10-09 父侧）= 2 绿 7 红；内存 = 跨例累计型（两例 ≈10GB）。
- 裁定：重基——专项见 §2.2。
- 验收：全 9 例绿 + 单跑峰值 ≤512MB + 门删净。

⑧ `2026-10-04-desktop-channel-tier-retire.test.mjs`（#1108 既存红簇）
- 现状读数：8 例 6 绿 2 红——腿② `:105` 写形（现盘 config 写 = 缩进 2 + 尾换行；断言按种子逐字 + mtime）∥ 腿⑤ `:172` `SETTINGS_DICT` 59⇒62。
- 裁定：重基。
- 依据：对象现役（档位退役验证面）；两红 = 后续批计数 ∥ 写形漂移（非机制换代）。
- 动作：腿② 零写盘判据改「读后快照逐字」（语义不变——拒收仍须零写）；腿⑤ 键数随盘（62）+ 注同源。
- 验收：复跑 8/8 绿。
- 归口：父侧随正轮（在办）——本批只出设计面，实施不双写；如父侧轮未收，随本批实施臂收（判据同一）。

⑨ `2026-10-05-attach-file-support.test.mjs`（同上）
- 现状读数：16 例 15 绿 1 红（AC-7 `:341-366` 词面计数链：VIEWS_DICT 144⇒149 等；两跑同集定稳）。
- 裁定：重基（计数链随盘重锚）。
- 验收：复跑 16/16 绿。
- 归口：父侧随正轮（在办）——同⑧。

⑩ `2026-09-29-i18n-split.test.mjs`（同上）
- 现状读数：5 例 1 绿 4 红——A1 `:57`（`VIEWS_DICT` 139⇒149）∥ A2 `:80`（基线漂——10-04 冻 314 条）∥ A4 `:91`（`i18n.mjs` 432 > 420）∥ A6 `:129`（行数 398⇒437）。
- 裁定：重基。
- 依据：10-04 重锚先例（台账 #889）同法；对象（词表分档）现役。
- 动作：A1/A4/A6 计数随盘重锚；A2 基线全量重冻（`docs/batches/2026-09-29-i18n-split.baseline.json`）。
- 验收：复跑 5/5 绿。
- 归口：父侧随正轮（在办）——同⑧。

⑪ `2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（同上）
- 现状读数：8 例 8 绿（本刻亲跑）。
- 裁定：已收 · 零动作（父侧随正轮已收）。

### §2.2 carryover-c1 专项（#1134——内存门连带处置）

**病灶三源**（件头注 `:18-27` 在册 + 本刻实读）：
1. **弹窗面换代**：两形常显表单退场（`renderer/views/settings.mjs:25`）——provider 表单住 `settingsModalTree(…, "providerAdd", …)` 弹窗（组名 `ADD_MODAL_GROUP = "providerAdd"`，`views/settings.mjs:55`），宿主挂 `document.body`（`renderer/settings-modal.mjs:37-46`）；测试台假 DOM 无 body/modal 宿主 ⇒ 清空 ∥ 收形 ∥ 取消 ∥ 失败径四用例红。
2. **宿主无关读**：`cancelKeyEdit` ∥ `saveProviderKey` 读 `document.querySelectorAll("[data-provider-key-input]")`（`renderer/mount-settings-segments-providers.mjs` 现文）——测试台 `querySelectorAll: () => []`（件 `:278`）恒空返。
3. **巨型假树值 × 失败报告序列化 = 跨例累计**（10GB 级；父侧 512MB 帽复跑死于 M-652c→d 交界）。

**改法（五件 + 一门）**：
1. **假 DOM 补宿主**：`document.body`（FakeNode 根，含 append）+ `document.querySelectorAll` ∥ `querySelector` 接真树（沿档内 `FakeDocument` `:188` 现成 walk 实现，弃 `() => []` 桩）——文档序语义（末位 = 交互面）随之真切。
2. **四用例弹窗面改写**：渠表单断言改卡内查询（经 `renderSettingsModal(settingsModalTree(state, "providerAdd", handlers))` 生产同径 ∥ `settingsModalNode()` 卡根读面）；键行面随文档序验证（两宿主同取）。
3. **巨型值序列化收**：断言对象一律改「摘取值投影」（文本 ∥ 属性 ∥ 计数 ∥ 键名集——小形）；禁对整棵假树 deepEqual ∥ 断言消息内插大树；在场判据只取节点引用（`!== null`）。
4. **M-652e 源形重锚**：`:668` 重锚现盘形（`const inputs = typeof document?.querySelectorAll === "function" ? …`；`data-draft-scope` 面同点）。
5. **M-652d OOM 定位**：d 例（键入 ∥ 焦点 ∥ 光标区间保真）先隔离实跑定位膨胀点，随 1–3 收口。

**门解除条件（三条同时）**：① `TC_HEAVY_TESTS=1 node --max-old-space-size=1024 --test <件>` 全 9 例绿；② 全程单例峰值 ≤512MB（父侧 512MB 帽口径——单例隔离先例）；③ 零 OOM 崩（进程无异常退出）。
达成后：`TC_HEAVY_TESTS` 门（件 `:41`）与六处 `skip` 标记**删净**（D8——不留死门）；档头 `:18-21` 内存警示改写为收口记录（重基已收 ∥ 重跑命令 ∥ 内存读数）。

### §2.3 内存安全（重跑预算 ∥ 重型例门控）

- 单件单跑、**异进程串行**：重载件（carryover-c1）不得与任何件并跑（10-09 事故形 = 整批并跑连带整机窒息）。
- carryover-c1 单轮复跑预算 ≤2 次（前 ∥ 后，均携 `--max-old-space-size=1024`）；其余件按需单跑。
- 复跑读数逐件记入 §5（件 ∥ 例数绿/红 ∥ 内存观测）；实施期任一件出现 GB 级内存 ⇒ 立即停跑上报。

### §2.4 受影响文件清单（现读行数 ∥ 预计 Δ）

| 件 | 现读行数 | 预计 Δ |
|---|---|---|
| `2026-09-29-parity-b1-vsc-core-host.test.mjs` | 342 | ±5 内（1 行删 + 断言改 + 表值改） |
| `2026-09-29-desktop-residuals-round3.test.mjs` | 729 | ±80 内（七腿重锚） |
| `2026-10-02-public-repo-read.test.mjs` | 393 | ±10 内 |
| `2026-09-30-memory-db-family.test.mjs` | 566 | ±5 内 |
| `2026-09-29-structure-split-2.test.mjs` | 220 | ±3 内（头注定档） |
| `2026-09-29-desktop-carryover-c1.test.mjs` | 674 | ±120 内（harness + 四用例 + 断言面） |
| `2026-10-04-desktop-channel-tier-retire.test.mjs` | 189 | ±6 内 |
| `2026-10-05-attach-file-support.test.mjs` | 366 | ±6 内 |
| `2026-09-29-i18n-split.test.mjs` | 133 | ±10 内 + 基线重冻 |
| `2026-09-29-i18n-split.baseline.json` | 45 762 B | 全量重冻 |

**测试面**：本批零仓套件（`test/**`）改动；批内件复跑即验证面（测试纪律在册）。

### §2.5 验收对照（回指条目）

| 条目 | 验收判据（机器可验） |
|---|---|
| `#798` | b1-host 复跑 2/2 绿（子进程 `RESULT: … FAIL 0`）∥ b1-loop 6/6 保持 |
| `#844` | round3 复跑 17/17 绿 |
| `#1108` | public-repo-read exit 0 ∥ memory-db-family exit 0 ∥ structure-split-2 退场定档（头注 + 本表在册）∥ 既存红簇归口父侧在办（M604 已收 8/8 零动作） |
| `#1134` | carryover-c1 全 9 例绿 ∧ 峰值 ≤512MB ∧ 门与 skip 标记零残留 |
| 全程 | 触面 = `docs/batches/**` 仅（产品码 ∥ 仓套件 ∥ 设计/需求档零触） |

### §2.6 关键决策记录（含被否）

1. **structure-split-2 裁定 = 退场（非重基）**——依据见 §2.1⑥；被否「全量重基」（#1130 曾注「全量重基 = 归批动作」）：B 腿重算即自证 ∥ C/D 重锚 = 现值快照非原批语义 ∥ 后批再漂——维护成本 > 对照价值。
2. **退场形 = 定档（件保留 + 头注定性 + 批档录依据），非物理删除**——依据 = 批档指针面（各批档 §5/§6 引该件）+ 档案面；被否「删件」：批档引注失据 ∥ 复跑核对载体消失。
3. **重基口径 = 面向现役语义重建（强度不减）**——重锚均保持原判据强度（等值 ∥ 全等断言照旧，仅目标对象换代）；被否「退订红腿换绿」。
4. **b1-host A2 改「退役锁」而非整行删**——退役机制负向锁在册（防复活）。
5. **既存红簇 4 件归口 = 父侧随正轮**（本批出设计面、实施不双写）——依据 = §1「父侧随正轮在办」+ 本刻复跑（M604 已收）。

### §2.7 上抛项

- [知会]①：#844 条目路径「`docs/batches/2026-09-30-desktop-residuals-round3`」现盘不存在——实件 = `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs`（批档同 `2026-09-29-desktop-residuals-round3.md`）；本设计按实件坐标。
- [知会]②：round3 现状读数与 #1108 在册读数有差（本刻 10 绿 7 红：⑪⑰转绿 ∥ ⑦转红；在册 = 9 绿 8 红）；本设计按本刻亲跑，`#1108` evidence 收口时随正。
- [知会]③：既存红簇归口按 §1 口径 = 父侧随正轮（本批只出设计面）；如口径需改（并入本批实施），请裁。

### §2.8 边界（不做什么）∥ 零触确认

- 不触：产品码（`thincoder-*/**`）∥ 仓套件（`test/**`）∥ 设计档 ∥ 需求档 ∥ 他簇（Ⅳ–Ⅶ）。
- 不改已收项（b1-loop ∥ M604）；不重开退场件红腿断言（退场语义：红态不再受理）。
- 不新增测试设施（除件内 harness 修复）；全项裁定落定，无 open 项。
- 零触确认：本设计轮零写任何文件（除本段）；实施轮触面以 §2.4 表为上限。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审口径**：对象 = 本档 §2（待评审）∥ 核验面 = §1 与设计所指受影响文件（`docs/batches/**` 在盘件，criterion 8 抽核）；未跑测试 ∥ 未读产品码（设计对产品码的引注不在此次评审判定）。限制：本评审无 document map ∥ 无项目标准档 ⇒ Document ownership 与 methodology 合规按 AGENTS.md + 批档六段约定判定。

**核验通过项（不列发现）**：① 三处件内锚逐点在盘（`:165` = `opts.promptTail = "TAIL-BLOCK";` ∥ `:260` = A2 断言 ∥ `:56-76` 行数表）；b7-minor `:91` 引注成立（「3b promptTail 载位退役【做，同波】」）；carryover-c1 `:41` 门 ∥ `:188` walk ∥ `:278` 桩 ∥ `:668` M-652e 锚逐点在盘；上抛①（`#844` 路径）与在盘件名一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state（R1/R7a） | 🟡 | §2 读数/归口落后于已落状态：§2.1⑧ 归口仍写「父侧随正轮（在办）」（`:108`），§2.5 `#1108` 行仍写「既存红簇归口父侧在办」（`:174`）；§1 已记「三件本刻全绿」∥「全部收讫」（`:25`）。在盘核：`2026-09-29-i18n-split.test.mjs:87` 已「2026-10-10 重冻」、`:58` 为 62/149/28、`:94`「main <= 437」；`2026-10-05-attach-file-support.test.mjs:363`「HOST_DICT 合并表 en = 322」；④⑤⑥ 已在盘——`2026-09-29-structure-split-2.test.mjs:3`「已退场（2026-10-10 · 本批定档」、`2026-10-02-public-repo-read.test.mjs:42` ∥ `2026-09-30-memory-db-family.test.mjs:33` 均含「export async function embedTolerant(embedder, texts, opts = {})」。§2.4 四行读数随漂：public-repo-read 394（表记 393，`:157`）∥ memory-db-family 567（记 566，`:158`）∥ channel-tier-retire 190（记 189，`:161`）∥ i18n-split.baseline.json 47 241 B（记「45 762 B」，`:164`）。 | 在 §2 追加随正记录（⑧⑨⑩⑪ 已收讫 ∥ ④⑤⑥ 已落在盘 ∥ §2.5 `#1108` 行归口改收讫），§2.4 四行读数随盘刷新；复跑/验收范围据此收窄到未落项（①③⑦），已落项以复跑复核而非设计期读数为凭据。 |
| 2 | Affected-file size annotations | 🟡 | §2.4 档位：round3 现读 729（`:156`）∥「±80 内」⇒ 上界 ≈809 越过 800 硬限；carryover-c1 674（`:160`）、memory-db-family 566（`:158`）已在 500 建议线上——三件均无拆分评审/拆分计划栏。 | 为三件补一行拆分评审判词（不拆的理由 ∥ 拆法），并把 round3 重锚幅度限在 ≤800 内；若 800 口径不适用批内件，写明该豁免依据。 |
| 3 | Acceptance criteria | 🟡 | 门解除条件②「全程单例峰值 ≤512MB」（`:142`）观测口径未定：① 复跑用「--max-old-space-size=1024」（`:142`），先例 = 「父侧 512MB 帽」实跑；峰值观测法（帽实跑 ∥ 采样 ∥ 读数位）缺 ⇒ §2.5 的「峰值 ≤512MB」（`:175`）不可机跑。 | 把②落成可机跑形（如「512MB 帽下全程零 OOM」或指定采样命令 + 读数记录位），与 §2.5 判据同一形。 |
| 4 | Document ownership | 🟡 | ① 依据（`:61`）称该锁件「并留「标为历史件 ∕ 约定不重跑 ∕ 或同笔收正」三候选——本轮即「同笔收正」」；被引档实为已写定：「三择一写定：取「标为历史件 + 约定不重跑」；备选拒：同笔收正」（`2026-09-29-parity-b7-minor.md:272`）∥「同笔收正 = 回改已收口批归档件且削冻结面——不取」（`:275`）；`:274` 对象 = 「B1 批级归档锁 `docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`」（G3 ∕ G4 ∕ G6 ∕ G7 已拆出——该件 `:11`；G6/G7 载体 = 本批①件）。⇒ 前档拒「同笔收正」→ 本轮取之的转轨未明记。 | 在 §2.1① 依据处明记转轨（前档取「标为历史件+约定不重跑」∕ 拒「同笔收正」⇒ 本批经全清直令改取「同笔收正」，对象 = 拆分后 `-host` 载体），使依据面与在册裁定一致。 |
| 5 | Requirements coverage | 🟡 | `#844` 并列项 `parity-b8-ipc`（§1 `:15`「+ parity-b8-ipc 全收在案」）在 §2 全段零登记——11 件表 ∥ §2.5 验收对照均无；「全收在案」若指已闭合，缺一行零动作登记。 | 在 §2.1 表或 §2.5 补 `parity-b8-ipc` 一行（零动作 · 收讫日期 ∥ 或其重锚条目），闭合 #844 覆盖。 |
| 6 | Clarity（数值漂移 R7c） | 🔵 | ① 动作㈢「行数表 20 档全表随现盘重读」（`:62`）——`2026-09-29-parity-b1-vsc-core-host.test.mjs:57-75` 实列 19 档（`:54-55` 注「原行数行撤」）。 | 读数改 19 档（随盘重读以实数登记）。 |
| 7 | Clarity | 🔵 | ③ 依据 ①④ 写「锚与注释目标文按现盘重锚或按 D8 收束」（`:72`）为二选一未定，与 §2.8「全项裁定落定，无 open 项」（`:196`）相抵。 | 二选一落定并写出所取形的验收判据（或明写该取舍留待实施期按现盘裁定，并同步 §2.8 措辞）。 |

**计数**：🔴 0 ∥ 🟡 5 ∥ 🔵 2（共 7）

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**写门披露（非越权）**：三件均属他批伴随件，`write`/`apply_patch` 机械拒（`thincoder-core/agent/write-gate.mjs:148-171`「cross-batch batch-record write」；未绕）⇒ 按父侧回执（Ⅲ）批准改走暂存：成品落 `.thincoder/tmp/<原名>`（两层深 = 与终位 `docs/batches/` 同形，就地复跑即等价验收）；**收位（源→目标同名覆盖）= 父侧动作**，逐件收位表见交付报告。

### 件① `2026-09-29-parity-b1-vsc-core-host.test.mjs` → 暂存稿 345 行
- ㈠ G7 表六档齐平：run-helpers 89⇒88 ∥ tool-table 191⇒188 ∥ 端 suspension 329⇒338 ∥ panel-turn-loop 304⇒307 ∥ suspension-drive 255⇒262 ∥ 核 suspension 327⇒352（余 13 档不动；表头加 2026-10-10 重锚注行）。
- ㈡ 桩删 `opts.promptTail = "TAIL-BLOCK"`；桩头注「三键写回」⇒「两键写回——B7 3b：promptTail 已退役」（轻级随碰）。
- ㈢ A2 断言改退役锁：`eq(…, "TAIL-BLOCK")` ⇒ `ok(…, !("promptTail" in core.opts))`（A3 ∥ 裁定① 两断言零动）。
- 读数：`node --test .thincoder/tmp/2026-09-29-parity-b1-vsc-core-host.test.mjs` ⇒ **2/2 绿**；子进程直跑 ⇒ `RESULT: PASS 38 · FAIL 0`（原读数 37+1）。

### 件③ `2026-09-29-desktop-residuals-round3.test.mjs` → 暂存稿 725 行（≤800）
- ① 锚④⑤⑥ ⇒ mount-info **缺席锁**（原在盘断言撤；沿 b1-host rules-face 先例）；out 行随正。
- ④ EDITS 13⇒12 处，逐处裁定（父裁 F7）：#539 ④「`renderer/mount-info.mjs`（本档」⇒ **D8 收束**（该注面净删、零目标文可锚；旧文零残留另由 ① 四扫式覆盖）；#539 ⑤ ⇒ 重锚现文「`views/onboarding.mjs` 向导挂载取用本表」（现盘 `settings.mjs:417`）；#539 ⑥b ⇒ 重锚现文「`views/onboarding.mjs`（向导）。」（现盘 `settings.css:8`）。
- ⑥ 重写：slot 权威键「零行」判定 + 旧只读锚负向锁 + 拒写词映射/词值在册 + 普通布尔键可编辑（checkbox∕onChange∕非 disabled）+ 单键 patch 实证。
- ⑦ 桩重锚：`document.querySelectorAll("[data-provider-key-input]")` 单件桩（宿主无关读语义）。
- ⑩ 改全轮累积语义：（start 追加 ∥ cap 就末轮保 n ∥ end 全等保 n ∧ 保 cap + ok∕ms∕unsettled ∥ 旧轮零清理 ∥ 归一）。
- ⑫⑬ 重锚行族语义（`[data-digest-label]` ∥ `[data-digest-cap]` ∥ `[data-digest-end]`；终态行 = `digest.done`；对照 ∥ 自愈 ∥ 换代臂随新口径）。
- 读数：`node --test …round3.test.mjs` ⇒ **17/17 绿**。

### 件⑦ `2026-09-29-desktop-carryover-c1.test.mjs` → 暂存稿 692 行
- ① 假 DOM 补宿主：`body` 根 + `querySelectorAll` 接真树（文档序末位语义真切）；slot 挂 body。
- ② 四例弹窗面改写：清空腿（弹窗卡 + 开框/切自定形 + 宿主关框断言 + 跨域对照组）∥ M-652b（失败留框 + 草稿存续；腿 1 补 name ⇒ 失败径走**回执** `invalid-key`）∥ M-652c（两宿主两草稿存续）∥ M-652d（键入∕焦点∕光标区间保真——焦点断言投影）。
- ③ 断言投影化：节点相等断言改布尔投影（弃整树序列化）——两处焦点/身份断言（`input2 !== input` ∥ `doc.activeElement === input2`）。
- ④ M-652e 两处重锚（取消径现读 ∥ 单骨 `add:provider`）+ **一处追加**（钥行标记面源 = `views/settings-sections-providers.mjs`——原 `-sections.mjs` 已转 re-export 面；设计 §2.2 ③ 只列两处，此为同腿同面第三处，随跑实测发现，披露在案）。
- ⑤ 门 ∥ skip 删净（`HEAVY` ∥ `TC_HEAVY_TESTS` ∥ 六处 skip 零残留——grep 验证）；档头内存警示改写为重基收口记录（含 512MB 读数）。
- 实施期另修（承重、非设计条目）：缺省回执表补 `model:catalog` —— 缺 ⇒ 每次装面落假失败通知 ⇒ 通知节点进出改树形 ⇒ 结构路径焦点回退错位（M-652d 实测捕获）；补后零假通知。
- 读数：`node --max-old-space-size=512 --test …carryover-c1.test.mjs` ⇒ **9/9 绿 ∧ 零 OOM**（1GB 帽同读数）。

**跨件读数**：`node --check` ×3 绿；`node scripts/doc-check.mjs` ⇒ 锚 0 悬空（存量行宽 FAIL 一处 = `docs/core/requirements/AGENT-LOOP.md:340`，与本批零关）。

**未定位提示披露**：父侧随入句「组 tag⇒组键；`:41` 注释」全仓+git 史零命中（round3 `:41` 现文 = `const read…`；tmp 旧稿亦无）——未臆改，报告如实说明。

### 审计与评审轮次（终态：clean）· 读数更正

- **读数更正**：件③ 暂存稿行数 = **724**（首记 725 系档头收正前读数——⚠ 旧警示三行 ⇒ 重基记录两行，净 −1）；件⑦ = **695**（首记 692 —— advisor 圆1 后补 `prevWindow` 捕获/还原 +3 行）；件① = 345 不变。三件皆 ≤800 硬限。
- **内部 explore 审计（1 圆 · 只读分歧审计；该装配无执行面 ⇒ 复跑读数未独立复现，以现盘静态对证为限）**：分歧 1 项——round3 `:3` 仍载「⚠ 断代失效…重跑必红为预期」旧警示（与重基后全绿相抵，D8 面）⇒ 已修；低注 1 项——carryover `:15` 跑法行指终位（收位即消，不修）；机制注记 1 项——⑥ 腿「零行」归因措辞（转 advisor 圆1 处置）。机械四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）零命中。
- **自修 1（审计后）**：round3 `:3`/`:4` 收正（重基记录替换断代红警示 + 跑法行归终位口径兼暂存位说明）。
- **内部 advisor 代码评审（圆1 · 全量面）**：裁定 **pass**；findings 3 条 + 尺寸列报 1 条——[🟡 optional] ⑥ 腿零行断言的机理措辞与现盘不符（渲染面零 `slotAuthority` 门，判据 = 具名表缺席；同族 `agent.advisor.guard` 经 `SELF_FACED_KINDS` 照出行）；[🔵] round3 `:3` 条目误引（`#1134` 属 carryover 件 ⇒ `#844`）；[🔵] carryover `globalThis.window = {}` 未随 `restoreDom` 还原；[🟡 尺寸仅列报] round3 724 ∥ carryover 695 > 500 顾问线（父裁 F2 已处置——不重开）。
- **自修 2（评审后 · 3 处）**：① round3 `:3` 条目校正 `#844 ∥ #1108`；② round3 `:227` 机理措辞收正（表缺席非门拦 ∥ guard 照出 ∥ 写面拒码归 ⑤）；③ carryover `:246`/`:253`/`:284` window 对称还原。
- **内部 advisor 复评（圆2 · 修复主张面）**：裁定 **pass**（三主张逐条 Fixed；新引入问题未见；尺寸项 Accepted）。（圆2 机械引用核验报 `file unreadable` = 评审侧引用路径未解析式误报，非内容不符；三主张另由自证坐标复核——round3 `:3`/`:227` ∥ carryover `:246`/`:253`/`:284`，机理面实读佐证 `settings-agent.mjs:24`/`:59`/`:182-186`。）
- **修复后复跑**：round3 **17/17 绿** ∥ carryover **9/9 绿 @512MB 零 OOM**；`node --check` ×2 绿；件① 读数不变（**2/2 绿**）。
- **终态：clean**（0 未决；尺寸面按父裁 Accepted；doc 侧零关项记于交付报告 out-of-scope 注）。

## §6 验证与收口（父代理）

**交付物**：6/6 ✅（eng-coder #91——原三件属他批伴随件，机械写门拒原位 ⇒ tmp 暂存 ∥ 收位 = 父侧）—— ① `parity-b1-vsc-core-host`（345 行）：G7 六档行数重锚 + 桩删 `promptTail` + A2 退役锁 ∥ ③ `desktop-residuals-round3`（724 行）：七腿对现盘重锚 + EDITS 13→12 + 三处目标文逐处裁定（D8 收束 ×1 ∥ 重锚 ×2）∥ ⑦ `desktop-carryover-c1`（695 行）：假 DOM 补 body+真树 ∥ 四例弹窗面改写 ∥ 断言投影化 ∥ M-652e 两处重锚 ∥ HEAVY 门与 6 处 skip 删净。

**父侧收位 + 终位复跑读数**：三件归位 `docs/batches/`（同名覆盖）—— ① **2/2**（子进程 `RESULT: PASS 38 · FAIL 0`）∥ ③ **17/17** ∥ ⑦ **9/9**（`--max-old-space-size=512` · 零 OOM）。

**跑法注（父侧实证 · 重要）**：③ 的 ⑪/⑰ 两腿 = `ContinueError` `instanceof` 敏感——**小写盘符跑法（`d:\…`）假红 15/17**（双实例：junction realpath `D:` vs 直路 `d:`——#774 同族）；**大写盘符跑法（`D:\…`）17/17 绿**（1.57s）。终位复跑以大写入径为准（已入账）。

**随碰/承重披露**：ⓐ 缺省回执表补 `model:catalog`（缺 ⇒ 装面假失败通知 ⇒ 焦点回退错位——M-652d 实测捕获）∥ ⓑ M-652e 同腿同面第三处重锚（`settings-sections-providers.mjs`——设计 §2.2③ 只列两处，随跑实测）∥ ⓒ M-652b 腿 1 补 name ⇒ 失败径走回执 `invalid-key`。

**评审终态**：advisor 代码评审 2 圆皆 pass（圆 1：🟡1 已收正 ∥ 🔵2 已改 ∥ 尺寸列报 = 父裁 F2 处置）；探索审计 1 圆（1 分歧已收正）；终态 = clean。

**上抛处置**：`settings-agent.mjs:177` 注漂移（`slotAuthority` 门不在实盘）⇒ 新债入账（随桌面面批次）；§2 F7 逐处裁定已落；⑦ 内存炸弹解除（9/9@512MB——#1134 判据达成）。

**结算**：#798 ∥ #844 ∥ #1108 ∥ #1134 ⇒ 核销（evidence = 本档 + 终位复跑读数）。**待办**：波尾 scoped commit；无未决项。
