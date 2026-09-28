# 2026-09-28 · session-list-disk
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 04:27 走查裁定「清单不能从 manifest 选，只能从盘面实际读，让 manifest 参与清单列表是过度设计」+ 父侧走查发现（D:\teamcode 盘上 50 槽文件 · 列表仅显 2 条）。
> 台账 = #475（会话与历史面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户裁定 · 2026-09-28 04:27）**：「清单不能从 manifest 选，只能从盘面实际读，让 manifest 参与清单列表是过度设计」。起因 = 04:0x 走查实测：`D:\teamcode` 盘上 50 槽文件 · VSC 会话下拉仅显 2 条。

**发现链（父侧实读）**

- 列表链 = `panel-session.mjs:230` `listSlots(cwd)` → `session-io.mjs:57` re-export 核 → `session-slots.mjs:195-198`（`Object.entries(m.slots)`）；CLI `cmd-session.mjs:44` · 桌面 `sessions.mjs:36` 同源 ⇒ 列表 = manifest 条目集。
- **装版 0.9.7 打包核（`~\.vscode\extensions\…\node_modules\@thincoder\core`）与源码同链逐字相同** ⇒ 非近期代码回归；观感变化 = 清单数据损伤（本户条目仅 {48,50}）+ 耦合放大（条目丢 ⇒ 会话隐形）。
- 条目丢失机制（**强推断 · 未直证**）：`saveManifest` 降级路径以调用方内存对象整档写回（读失败窗口内的一次保存 ⇒ 永久缩水；全库无 `.corrupted` 现场吻合）。已排除：`cleanDeadOwners`（只删认领条）· `session-lifecycle.mjs:225` 死主条目清理（`!existsSync` 守卫——文件在则不删）· `session-gc`（只动 `.d` / 冷户整体回收；本户不在 trash）· `migrateHashLength`（守卫）。
- 设计档现状：`docs/core/design/SESSION.md:147`「列出**全部**槽位元数据」——档面意图与裁定同向；实现（清单枚举）偏离。

**改动方向（用户裁定）**：列表 = 盘面实读；manifest 与清单解耦（认领 / active / 摘要职责保留）。

**边界（本批不做）**：不改认领 / active / GC / 删除语义；三端消费面接口零改（CLI / VSC / 桌面均走核 `listSlots`——核改即三端同效）；`saveManifest` 静默整档写修复 = 另项（另立台账在册）。

**链**：§2 设计 → §3 评审（用户点火）→ §4 批准 → §5 实施 → §6 收口。需求档 F5 已落（主 agent 笔 · 2026-09-28）。

**父侧追裁（2026-09-28 04:34 · 设计轮上抛 1 · 范围微扩）**：存在性判据面随本批收正——`session-lifecycle.mjs:317`（switchToSlot）· `session-slots.mjs:229`（deleteSlot）· `:252`（usableSlot）三处「manifest 条目作存在性」⇒ 判据改盘面（`existsSync(slotPath(cwd, N))`），使「文件在盘、条目缺失」的会话**可见且可用**（否则本户 48/50 条 = 只见不开的死行）。护栏：认领 / active / 槽号分配逻辑本体零改；开槽路径若自然补写该槽 manifest 条目 = 允许（自愈），但不得新增整档写路径。用例面随设计增补（盘在+条目无 ⇒ 可开 / 可删 / 恢复候选可用）。

**父侧核验（2026-09-28 04:4x · 设计轮 §2 内容级核验）**：**通过**——F5 五判据句全覆盖（条目来源 / 取数链与读放大上界 / 排序降级 / 可达性扩展 / 消费面零改）+ 追裁（判据句 4 · T-SD11–14）并入 + 验收可机检（判定句对照表 / 读放大预算 4 MiB·256 KiB·64 KiB / 零改断言 / T-SD1–18 含性能硬线）+ 消费面新增两面（ACP `session/list` · `read_history` `cwd:` 发现面）主动清点。**上抛裁定**：② ACP 档**不另登记**（`ACP-CLIENT.md:111` 表述未失效且未重述条目集语义——单源 = 设计档 §6.22 判据句 5 已列 ACP 消费面；再写一行 = 重述，D2）× ①③④⑤ 采披露 / 登记态（存量摘要降级自愈路径 + D-SE56 二义 + 两项观察零动作）。**读数**：悬空 **47**（基线 47 · 净 0 ✓）· 行宽 **34**（设计席起手基线 35 含父侧 04:2x 落笔引入的 1 处 +1〔需求档 F5 行 317 字符〕——**父侧当场折行修复**，回 34 = 01:2x 基线）。设计**待评审**（点火权 = 用户）。

**父侧裁定（2026-09-28 05:2x · 实施舱 #16 上抛）**

- **摘要快路判据字段 = 摘要 `ts`（落盘时刻）**——实施实证：本户 slot 48/50 的 `updatedAt` 恒**早**于文件 mtime（1.5 / 107.6 ms——写入发生在其取值之后）⇒ 字面「`updatedAt ≥ mtime`」使快路**生产永不命中**（AC「fresh 摘要档 = 0 字节」只剩构造夹具可满足）；`ts` 恒**新**于 mtime（−0.38 / −0.50 ms）⇒ 判据应为「摘要 `ts` ≥ 文件 mtime」。属评审轮 `ts`→`updatedAt` 改名之误（原 `ts` 即正确字段——摘要落盘时刻 vs 会话逻辑时，两字段语义不同）。
- **设计档收正** = 随 #18（写护栏修正轮）第 1 条同笔：§6.22:729 改比 `ts` + §6.4:137 digest 列表补 `ts`（落盘时刻）与 `updatedAt`（会话逻辑时）的语义区分。
- **兜底补位裁定**：④ stat 兜底 / 读失败 / 内容档降级径 = 摘要补位**允许**（沿判据句 2 字面「盘面实读值 &gt; 摘要值（任意新鲜度）&gt; 缺省」——摘要 = 核记录值非假造）；不收窄为「纯缺省」。
- 实现面由 #16 按 `ts` 落（其余不动）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（轮次 initial · 2026-09-28 · 机制面 = docs/core/design/SESSION.md §6.22 + D-SE54–D-SE58）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与范围

- **覆盖条目**：需求档 `docs/core/requirements/SESSION.md` §4.1 **F5**（会话列表 = 盘面实读）+ 父侧 2026-09-28 追裁的**最小判据面扩展**（可达性：盘上存在即可开 / 可删 / 可恢复——护栏三条见 §2.2（f））。台账 **#475**。
- **不在本批**：`saveManifest` 静默整档写修复（另项在册）· 认领 / active 指针 / GC / 槽号分配语义（本批只换「存在」这道门）· 摘要回填 / 存量清运 · ACP 协议面语义重定（仅登记，见 §2.6 披露 ③）。
- **轮次**：initial（设计轮）。本段 = 批次任务 + 机制设计 + 验收对照（一次性批次材料）；机制权威落点 = `docs/core/design/SESSION.md` §6.22。

### 2.2 机制设计（判据句 · 权威面 = 设计档 §6.22）

**(a) 条目来源 = 盘面实读（F5 判据句 1）**：`listSlots(cwd)` 条目集 = sessions 根下匹配 `^<40 位 hash>\.json\.(\d+)$` 且为**普通文件**者（逐条出槽号 N）；manifest `m.slots` **不参与条目集**（既不筛也不补）。前缀 = `sessionPath(cwd)` 的 basename（与 `slotPath` 同源；短哈希迁移随该调用先行）。**后缀排除闭集** = `.manifest` / `.manifest.<端名>` / `.tmp` / `.corrupted` / `.unreadable` / `.bak-<ts>` / `.d`（记录存储）/ `.stale-<ts>`——数字槽号正则全锚 + 普通文件判已全覆盖。

**(b) 元数据取数链（判据句 2）**：四级、**免费先行**——① 摘要快路（摘要在场且 `ts ≥ 文件 mtime` ⇒ 整条由摘要供给、**槽文件零字节读**）；② 小档全读（`size ≤ SCAN_FULL_MAX` = 256 KiB ⇒ 全解析）；③ 大档早键截读（头 `min(size, SCAN_HEAD_BYTES)` = 64 KiB）；④ stat 兜底（`updatedAt` = mtime）。字段优先级 = **盘面实读值 > 摘要值（任意新鲜度）> 缺省**（`""` / `0` / mtime）。
- **早键截读** = 结构感知扫描（非正则；遇顶层键 `history` 即停）：`title` / `updatedAt`（键序实测两代写者皆在 `history` 前）· `firstMessage`（窗内首个真实用户消息——谓词单源 = `thincoder-core/history-window.mjs`）· `activeProvider` / `activeModel` / `createdBy`（键序靠前时可得；老代槽该三键在 `history` 之后 ⇒ 缺席、由摘要补位）。
- **计数两类字段（`messageCount` / `turnCount`）不在 ③ 供给面**：需 `history` 长度 ⇒ 摘要补位（缺摘要 ⇒ `0`——降级，见 §2.4 ②）；盘面全读只发生在 ②。
- **实现落点**：新档 `thincoder-core/session-slot-scan.mjs`（枚举 / 早键截读 / 取数链装配；`SCAN_*` 三常量单源住该档）；`thincoder-core/session-slots.mjs` 的 `listSlots` 收敛为「组合 + 条目投影」（行形态逐字段零改）。

**(c) 排序 / 高亮 / 降级（判据句 3）**：排序 = `updatedAt` 降序（同值按槽号降序；预算耗用序 = mtime 降序）；`isActive` = 槽号 === `m.active`（**D-5 语义零改**）；**降级阶梯（入列不筛）** = 坏 JSON / 半写 / `version > 2` / 异 cwd 内容档一律入列（存在性 ≠ 可读性）——标题回退链落 `"(empty)"`、计数 `0`、日期 = mtime；点开一次（读失败改名 `.corrupted` 保留现场）后下一轮不含该条。

**(d) 可达性：存在性判据改盘面（判据句 4 —— 父侧 2026-09-28 裁定入本批 · 护栏三条）**：**盘上存在即可用**——三处存在性判据由「manifest 条目」改「盘面文件」：
① `thincoder-core/session-lifecycle.mjs:317`（`switchToSlot`）与 `thincoder-core/session-slots.mjs:229`（`deleteSlot`）：准入改 `existsSync(slotPath(cwd, N)) || m.slots[N]`——**旧分支逐字保留**（有条目无文件 ⇒ 同今日：切换经读槽返 null / 删除仍清条目），**新增唯一分支** = 盘上有文件且无条目 ⇒ 放行；
② `thincoder-core/session-slots.mjs:252`（`usableSlot`，恢复判据）：`!m.slots[slot] || !existsSync(...)` 改 **`!existsSync(...)` 单判**（去条目合取）。
③ 护栏：**认领 / active / 槽号分配逻辑本体零改**（只换「存在」这道门）；开槽 / 保存路径自然补写该槽摘要 = 允许（自愈），**不新增整档写路径**；ACP 会话装载本就直读槽文件（无条目门）——扩展与之一致。

**(e) 消费面零改（判据句 5）**：三端 + 两面全经核 `listSlots` 单源消费、字段名与类型零变 ⇒ **六面调用面代码零改**：CLI `/session`（`thincoder-cli/src/tui/cmd-session.mjs:44`）· CLI 启动提示（`thincoder-cli/src/tui/startup.mjs:234`）· VSC 面板下拉（`thincoder-vscode/src/extension/panel-session.mjs:230`，经 `session-io.mjs:57` 转口）· 桌面左列（`thincoder-desktop/src/main/sessions.mjs:34-37`）· ACP `session/list`（`thincoder-cli/src/acp/handlers-slots.mjs:44`）· `read_history` `cwd:` 发现面（`thincoder-core/agent-tools/read-history.mjs:232`）。
- **`startup.mjs:234` 用途核实（实读）**：`allSlots.length > 1` ⇒ 出「Tip: N sessions — /session to view/switch」提示行——**非列表渲染**；改前显 2、改后显 50（盘面真数）⇒ 行为随动 = 预期。
- **桌面 `ROW_FIELDS.provider` 取数核实**：= 核条目 `activeProvider`（复合串 `p:m` / 裸渠道名 / 老槽 `""`，核 `session-slots.mjs:212` 合成）——核投影零改 ⇒ 桌面零改仍成立。
- 计数两字段保持 **number** 型（降级值 `0`）：桌面渲染面 `Number.isFinite` 分支与 VSC webview `count` 模板字面均只认数（`null` 会渲染成 `nullmsgs`）——**类型稳定 = 零改的前提**。

**(f) 文档面落点（本批已落）**：`docs/core/design/SESSION.md` = 新增 **§6.22**（五判据句 + 边界 + 不做面）· §6.1 两条收正（manifest 改述**摘要缓存**）· §6.2 `.corrupted` 兜底行「列表变空」句收正 · §6.5 `/session` 句收正 · §6.10 D-5 收正 · §7 补 **D-SE54–D-SE58**（标题随 D-SE1–D-SE58）· §5 落点指针 · 变更记录一行；
`docs/desktop/design/IPC.md:105` 随动（`slot-missing` 三因中「清单无条目」→「槽不可得（盘面无文件 ∧ manifest 无条目）」——可达性扩展的直接导出）；
**检读结论（零改）**：`docs/cli/design/TUI.md` 零「清单=manifest」表述（§7.4 只述标题回退链——链与取值面不变）；`docs/desktop/design/IPC.md` §2 会话族注 `isActive` / 行字段 / `零新增算法（端壳不扫目录名）` 三条**语义仍成立**（扫描住核 = 单源）；`docs/desktop/design/PROJECT.md` 与 `docs/core/requirements/PROJECT.md` 零该形态表述（逐档 grep 实核）。

**(g) 关键决策（本条摘要 · 权威 = 设计档 §7）**：**D-SE54** 条目集 = 盘面实读（否决「manifest ∪ 盘面」与「盘面 ∪ manifest 补位」）· **D-SE55** 取数 = 摘要快路 + 盘面分级读（否决全读 / 仅 stat / 逐档全文计数）· **D-SE56** 计数字段 = 摘要供给、盘面不可得（降级 `0` 二义已登记）· **D-SE57** 遗留单档不入列（无槽号 ⇒ 行键空间不可表达）· **D-SE58** 可达性扩展（否决「仅改清单」半程与顺带改认领面）。

### 2.3 受影响文件与行数预算表（as-of 2026-09-28 实读）

| # | 文件 | 现值 | 预计 | Δ | 改动内容 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/session-slot-scan.mjs`（拟新增） | 0 | ≈170 | +170 | 盘面枚举 + 早键截读扫描器 + 取数链装配 + `SCAN_*` 三常量（单源） |
| 2 | `thincoder-core/session-slots.mjs` | 322 | ≈305 | −17 | `listSlots` 收敛为组合 + 投影（行形态零改）；`loadSlotMeta` 退役；`deleteSlot:229` / `usableSlot:252` 判据改盘面 |
| 3 | `thincoder-core/session-lifecycle.mjs` | 353 | 354 | +1 | `switchToSlot:317` 判据扩展（一行） |
| 4 | `thincoder-core/test/session-list-disk.test.mjs`（拟新增） | 0 | ≈200 | +200 | T-SD1–T-SD18（§2.4 表）——单层 glob 自动收集（`test/run.mjs` 收集面 = `test/*.test.mjs`，实核） |
| 5 | 消费面六档（CLI×2 / VSC×1 / 桌面×1 / ACP×1 / 核 read-history×1） | — | — | **0** | **零改**（§2.2（e）断言；唯一可选随动 = `read-history.mjs:232` 行内注释——非行为） |
| 6 | 文档面（`docs/core/design/SESSION.md` · `docs/desktop/design/IPC.md`） | — | — | — | §2.2（f）——已落 |

**行数口径注**：核档 ≤300 软线 / ≤500 硬线（AGENTS.md）；第 1、2 行均落硬线内；第 2 行减项来自 `loadSlotMeta`（18 行）退役 + `listSlots` 主体（27 → 约 14 行）。三端仓（cli / vsc / desktop）与核仓的既有测试档**零编辑**。

### 2.4 用例表（正常 / 边界 / 错误 + 输入 / 期望；一次性材料——权威判据面 = §6.22）

| # | 类 | 输入 / 装置 | 期望输出 |
|---|---|---|---|
| T-SD1 | 正常 · 盘在无条目 | 写槽文件 N（manifest 无该条目）⇒ `listSlots` | 列表含 N（title / firstMessage 由盘面供给）∧ manifest 零写 |
| T-SD2 | 正常 · 删除即消失 | T-SD1 后删槽文件 ⇒ `listSlots` | 列表不含 N |
| T-SD3 | 正常 · 回退链照旧 | 无 title 槽文件（首条真实 user 消息在头窗内） | 条目 `title === ""` ∧ `firstMessage` = 首条真实 user 消息前 80 字 |
| T-SD4 | 正常 · 摘要快路零 IO | 槽文件 + fresh 摘要 ⇒ 读计数桩 | 全字段来自摘要 ∧ **槽文件读字节 = 0** |
| T-SD5 | 边界 · 读放大上界 | N 档（含 > 256 KiB 档）⇒ 读计数桩 | Σ 槽文件读 ≤ 4 MiB ∧ 单档 ≤ 256 KiB ∧ 超档 ≤ 64 KiB |
| T-SD6 | 边界 · 计数降级 | 大档（> 256 KiB）+ 无摘要 | `messageCount === 0` ∧ `turnCount === 0`（登记二义：「未知 ∨ 真 0」） |
| T-SD7 | 错误 · 坏档入列 | 坏 JSON 的 `.json.N` | 列表含 N（title `""` · 日期 = mtime）∧ 不抛 |
| T-SD8 | 边界 · 后缀排除 | 造 `.json.N.bak-1` / `.json.N.corrupted` / `.json.N.d/` / `.manifest` | 条目集仅 {`.json.N` 普通文件}（零伪槽号、零目录误收） |
| T-SD9 | 边界 · 空 / 缺目录 | 空 sessions 根 ∥ 根不存在 | `[]`（不抛） |
| T-SD10 | 边界 · 遗留单档 | 写 `<hash>.json`（v1 单会话） | 列表不含该档（D-SE57 明裁） |
| T-SD11 | 可达性 · 可开 | 盘在 + 无条目 ⇒ `switchToSlot(cwd, N)` | 返回槽数据 ∧ active 翻 N ∧ 本端 marker 写 N |
| T-SD12 | 可达性 · 可删 | 盘在 + 无条目 ⇒ `deleteSlot(cwd, N)` | `true` ∧ 文件消失 ∧ 列表不含 N |
| T-SD13 | 可达性 · 可恢复 | 盘在 + 无条目 + marker 指 N ⇒ `resumeSlot` | `{ slot: N, data }`（判据①命中，**不落全新分配**） |
| T-SD14 | 可达性 · 负断言 | 无文件 ∧ 无条目 ⇒ 三面 | `switchToSlot` = null ∧ `deleteSlot` = false ∧ 恢复不选 N |
| T-SD15 | 零回归 · 旧分支 | 有条目 + 文件缺 ⇒ `deleteSlot` | `true`（条目清理——旧分支逐字保留） |
| T-SD16 | 零回归 · 高亮 | `m.active` = N（N 盘在无条目） | 该条 `isActive === true` |
| T-SD17 | 零回归 · 三端套件 | CLI / VSC / 桌面既有测试档 | 全绿（消费面零改文件） |
| T-SD18 | 性能 · 启动路径 | 50 档量级夹具 ⇒ `listSlots` | 同步阻塞 ≤ 50 ms（F-SL1 硬线；本户实测 3–10 ms） |

### 2.5 验收对照

**F5 判定句对照表（需求档 §4.1 F5）**

| 判定句（逐字来源 = 需求档） | 设计落点 | 机检 |
|---|---|---|
| 存在「文件在盘 ∧ manifest 无条目」的槽 ⇒ 列表含该条（回退链照旧） | §6.22 判据句 1 + 2 + 3 | T-SD1（含）· T-SD3（回退链） |
| 槽文件删除 ⇒ 列表即消失 | §6.22 判据句 1 | T-SD2 |
| 盘上存在的会话文件必须在列表可见，不因 manifest 条目缺失而隐形 | §6.22 判据句 1 | T-SD1 · T-SD10（遗留单档例外——无槽号不入列，D-SE57 明裁） |
| （**实义扩展** · 父侧 2026-09-28 追裁）可见**且可用**——盘上存在即可开 / 可删 / 可恢复 | §6.22 判据句 4 | T-SD11–T-SD14 |

**读放大边界（可机检数）**：单次 `listSlots` 调用槽文件读 ≤ **4 MiB**（`SCAN_BUDGET_BYTES`）∧ 单档 ≤ **256 KiB**（`SCAN_FULL_MAX`，超档仅读 ≤ **64 KiB** 头窗）∧ fresh 摘要档 = **0 字节**（T-SD4 / T-SD5 桩断言）。
**实测读数**（本户 50 档 / 312 MB · 2026-09-28）：枚举 + 50 × stat = **3 ms** · 头窗 50 × 64 KiB = **2.75 MB / 6 ms** · 小档全读 6 档 ≈ 1 ms；对照 = 全读 50 档 = **312 MB / 1,844 ms**（1.8 s 同步阻塞 ⇒ 否决依据）。

**三端（+两面）零改断言**：① 六面调用面代码零改（实现轮以 `git diff --name-only` 断言六档不在改动集）；② 字段名 / 类型逐字段零变（`slot` / `isActive` / `timestamp` / `date` / `messageCount` / `turnCount` / `firstMessage` / `activeProvider` / `updatedAt` / `updatedDate` / `title` / `createdBy`——行形态 = 设计档 §6.5 现状投影）；③ 三端既有套件全绿（T-SD17）。
**文档面机检**：`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 悬空 **47**（开工基线 47——净增 **0**；本批唯一新增锚 = 新档路径，已带「拟新增」标记 ⇒ 列报不入闸）· 行宽 **35**（开工基线 35——净增 **0**）。**读数为本席执行实读**（2026-09-28）。
**设计前检**：四问全过——① 需求五要素可设计（F5 五要素齐 + 判定句三条）；② 受影响文件全清单 + 行数（§2.3）；③ 验收逐条回指需求（上表）；④ UI / 交互决策全落（列表面与高亮语义显式零改；无新增交互）。

### 2.6 上抛项与披露（逐条）

| # | 类 | 事项 | 处置建议 |
|---|---|---|---|
| ① | **披露 · 存量摘要缺失** | 本户 manifest 摘要仅 {48,50}——本批让 48 条可见可用，但**标题 / 计数**在未触碰的槽上仍降级（打开并保存一次即自愈单槽，属开槽 / 保存自然补写——护栏③允许面） | 不另立批；随「`saveManifest` 整档写修复」项（另项在册）或用户实际触碰自愈；如需一次性回填另裁 |
| ② | **披露 · ACP 面语义随动** | `session/list` 条目集随盘面扩大（外部 ACP 客户端可见条目数变化）——符合 F5 裁定方向，但**协议面语义变化**未在需求档 F5 的端列表中（F5 只列 CLI / VSC / 桌面） | 本批不改 `docs/cli/design/ACP-CLIENT.md:111`（其表述「`session/list`：`listSlots(cwd)` → 字段集」仍成立、未被失效）；如需登记「条目集 = 盘面」，请父侧裁（一行） |
| ③ | **披露 · 计数降级二义** | 缺摘要槽的 `messageCount` / `turnCount` = `0`（消费面既有 `?? 0` 口径；「未知 ∨ 真 0」不可区分）——类型稳定优先（`null` 会在 VSC webview 渲染成 `nullmsgs`） | 维持；已登记 D-SE56 |
| ④ | **观察 · `.d` / `.stale-*` 清运** | 记录存储目录与隔离现场不在残留清运后缀表（§6.19 已登记另案） | 不在本批，零动作 |
| ⑤ | **观察 · 分配面候选池** | `allocateFresh` 候选池仍取 `m.slots` 键（回收仅限文件缺失者）+ `newSession` 选号已含 `existsSync` 判据 ⇒ 盘上独有槽**不会**被复用/覆盖（零改正确） | 零动作（已核，无需改） |

### 2.7 本席未动项（边界确认）

未写实现码（`thincoder-core/**` 与三端仓零触碰）· 未碰需求档（F5 由主 agent 笔）· 未碰提示词与 `src/**` · 未动 `saveManifest` / 认领 / active / GC / 删除语义（除本批裁入的三处**存在性判据**）· 未点火评审（评审发起权在父侧 / 用户）。

### 2.8 段内勘误（同段指针 · append-only 追加）

- §2.1「护栏三条见 §2.2（f）」→ 应为 **§2.2（d）**（可达性护栏在该条 ③ 行）。
- §2.1 不在本批项内「ACP 协议面语义重定（仅登记，见 §2.6 披露 ③）」→ 应为 **§2.6 披露 ②**（③ = 计数降级二义）。
- §2.2（b）「缺摘要 ⇒ `0`——降级」句尾「见 §2.4 ②」→ 应为 **§2.6 披露 ③ / T-SD6**。

### 2.9 设计评审修正轮 1 收正块（承 §3 轮次 1 发现 1–8 · 父侧逐点核验通过 · 2026-09-28）

**效力**：本段为一次性收正材料——§2.1–§2.8 原位表述与本段冲突处，以本段为准。八条发现已同批落设计档（`docs/core/design/SESSION.md` · `docs/desktop/design/IPC.md`），逐号落点如下——复核轮以本表逐号追溯。

| # | 落点（file:line） | 改动（一句） |
|---|---|---|
| 1 | `docs/core/design/SESSION.md:202-203` | D-2① 去 `∈ m.slots` 合取（新落 D-2 存在性判据行：①② 门 = 盘面单判 · manifest 条目不作门 · 属主判据不变）——与 §6.22 判据句 4 同口径 |
| 2 | `docs/core/design/SESSION.md:757` / `:760-761` | §6.22 补落点与测试面行（file 级落点表 + 用例表 = 批档 §2.3 / §2.4 承载——本档不复制）+ 验收回指段（四组判定句 → 用例组映射） |
| 3 | `docs/core/design/SESSION.md:758` | 尺度结论行：`thincoder-core/session-slots.mjs` 现读 322 行（as-of 2026-09-28）· 本批净增量 ≈ −17 ⇒ 落 ≈305——500 硬线内 · 无档位拆分需要 |
| 4 | `docs/desktop/design/IPC.md:62` / `:100-102` | `sessions:list` 行运行标记载荷断言去（= 渲染面位标面 · 不经本载荷）+ 会话族注项 4 收为**已落实形态**（来源面 · 消费面三项 · 左列行位标未落） |
| 5 | `docs/core/design/SESSION.md:727` | 摘要快路判据字段名 `ts` ⇒ `updatedAt`（与同节 :736 同词；`ts` 既有语义 = 消息时间戳） |
| 6 | `docs/desktop/design/IPC.md:244` | 变更记录一行（同笔载发现 4 / 6 / 7）：`:105` 可达性扩展引用补录（2026-09-28 设计轮落 · 本轮入账——零新语义） |
| 7 | `docs/desktop/design/IPC.md` 九行十一处 | 规范面「本批」⇒ 批号收正（对齐重定位批十处 / 批 9 一处；变更记录面留档不动） |
| 8 | `docs/core/design/SESSION.md:753` | 可观察面登记（需求 §2.2 F12 口径）：ACP `session/list` + `read_history` `cwd:` 发现面 = 条目集随盘面扩大的可观察面（两面调用面代码零改） |

**用例面指针形体（本批统一）**：设计档 §6.22 的用例引用一律 = 「用例组 1–18 + 批档 §2.4」两段式（用例表本体 = 批档 §2.4 承载——本档不复制）；裸 `T-SD` 号不入设计档（检查器按悬空锚计——已避）；批档不入锚域（`checkConfig.anchors.exclude` 含 `batches`——锚 + 行宽同域）⇒ 本段内点名安全。

**随附收尾笔（发现 4 同面清理 · 一致性面）**：`docs/desktop/design/UI.md:28`（左列会话行）「运行 / 待审批位标面随对话流批」待落口径 ⇒ **实况两分句**——已落面逐项（渲染面状态源 `thincoder-desktop/renderer/events.mjs` 置 / 清位〔码 `running` / `approval` / `done`〕 · 标签位标 `thincoder-desktop/renderer/views/tabbar.mjs` · 状态栏跨会话告警位 `thincoder-desktop/renderer/views/statusline.mjs` · 关闭确认判据 `thincoder-desktop/renderer/store.mjs` `needsCloseConfirm`）∥ 未落面 = 左列会话行位标（`thincoder-desktop/renderer/views/sessions.mjs` 只落 `data-active`）——与 IPC.md 会话族注项 4 收口同源（零新语义）；UI.md 变更记录尾随一行。

**范围说明**：§3 轮次 1 共 9 条——本段登记 1–8（改面全落设计档）；发现 9（需求档行数读数 as-of）改面 = 需求档（主 agent 笔），不在本段。

**闸**：`cd thincoder && node scripts/doc-check.mjs --root .` 本席实跑（2026-09-28 04:5x）= 悬空 **48**（分项 = 路径/坐标 **47** + 符号·窄 **1**）· 行宽 **34**。**本轮两笔贡献 = 0 悬空 / 0 行宽**——UI.md 零 ✗ 行（改点引用 `docs/desktop/design/IPC.md` 与各码档路径全解析）；批档不入机检域。与 §1 记录值 **47** 的 **+1** 非本轮所出——本批面三档（SESSION.md / IPC.md / UI.md）候选集零新增，该差位于本批面之外（同卷多批在途未提交；归口以复核轮 / 收口轮逐行核为准）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = SESSION-LIST-DISK 批文档集（`docs/core/requirements/SESSION.md` + `docs/core/design/SESSION.md` + `docs/desktop/design/IPC.md` 三档全文）。范围限定：不读源档 / 不查 git；无 Document Map 与项目标准档（归属判据按跨档一致性降级执行）；源档 file:line / 行数读数未复核（按档内 as-of 采信）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | `docs/core/design/SESSION.md:202`（§6.10 D-2①：记录槽可用 =「slot ≠ null 且 **∈ m.slots** 且槽文件在盘 且属主 空/死/本进程」）与 `:743`（§6.22 判据句 4：「恢复可用判据……**去条目合取**、改盘面文件单判」）/ `:740`（「恢复可用 = 盘面单判」）对同一谓词给出两种活描述；本批变更记录（`:857-859`）只收正 D-5、未动 D-2。同一机制两处异述 ⇒ 实现面将产出两套门。 | 收正两处到同一口径（推荐 D-2① 去 `∈ m.slots` 合取、对齐 §6.22 判据句 4 / D-SE58 用户裁定方向），并顺带钉定 D-2② 继承路径（`:202` 同合取存留）口径。 |
| 2 | Acceptance criteria | 🟡 | `:64`（§5 落点指针）列明「本档 §6.22 承载……**验收回指**」，但 §6.22（`:716-755`）无验收回指段（仅判据句 1 判定句 + 判据句 2「读放大上界（可机检）」）；同族 §6.16–§6.21 均携验收回指（`:408` / `:474` / `:529` / `:641` / `:685` / `:712`）。 | 补 §6.22 验收回指（判定句 / 读放大上界 / 降级阶梯 / 可达性扩展 → 机检面映射 + 用例面指针），或收正 `:64` 列项。 |
| 3 | Affected-file size annotations | 🟡 | §6.22 未给所改档的行数 / 预期增量 / >300 档结论——改点含 `thincoder-core/session-slots.mjs`（`:742-743`）、`thincoder-core/session-lifecycle.mjs:317`（`:742`）、新档 `session-slot-scan.mjs`（`:732`「拟新增」）；同族 §6.16 `:405-406` 有此形体（「file 级落点表（行数 / 预期增量 / >300 档审视）……无档位拆分需要」），且 §6.12 `:234` 以「500 行硬限」为 `session-slots.mjs` 既有约束。声明承载面（`docs/batches/2026-09-28-session-list-disk.md` §2）不在本次评审范围 ⇒ 数值不可核验。 | 设计面补一行尺度结论（`session-slots.mjs` 现读数 + 增量 + 拆分判定），或引批档 §2 并转抄关键读数。 |
| 4 | Doc hygiene / state | 🟡 | `docs/desktop/design/IPC.md:62`（§2 行：「列表含**运行标记**」）与 `:100`（会话族注 4：「运行标记」……**随对话流 / 审批批落地**，本行字段随之增补；在此之前位标面 = `isActive`）未对齐——所指批次（批 7 `:201` · 批 A `:224`）已落而注 4 无收口登记，读者无法判定现态。 | 钉定现态：已落 ⇒ 注 4 收为已落实形态；未落 ⇒ `:62` 行口径收正（去「含运行标记」）。 |
| 5 | Clarity | 🔵 | `:726` 摘要快路判据用 `ts`（「manifest 摘要在场且 `ts ≥ 文件 mtime`」），而本档 `ts` 既有语义 = 消息时间戳（`:131` / `:569` / `:618`）；§6.4 摘要字段表无 `ts`，同节 `:736` 承载摘要值者为 `updatedAt`。 | 钉定字段名（如 `updatedAt`），与 `:736` 同词。 |
| 6 | Methodology / traceability | 🔵 | IPC.md `:105` 已含 2026-09-28 语义引用（「可达性扩展后条目不再单独成门，见 §6.22 判据句 4」），但本档变更记录最近条目（`:241` = R3 §1）未记该行改动——规范面改动无对位记录。 | 收口轮补一条变更记录（或说明该行改动归属）。 |
| 7 | Methodology / hygiene | 🔵 | IPC.md 规范面残留相对指称「本批」（`:14` / `:16` / `:23` / `:26` / `:29` / `:67` / `:74` / `:85` / `:91`）——同档既有纪律 = 收口轮改批号（`:229`「「本批」⇒「批 A」」· `:236`「全档「本批」⇒ 批号收正十一处」）。 | 收口轮统一改批号（批 8 / 批 9 / 对齐重定位批）。 |
| 8 | Scope / registration | 🔵 | 需求 `:105`（§4.1 F5）枚举消费面 = 三端列表；设计判据句 5（`:746-751`）另有 ACP `session/list` + `read_history` `cwd:` 发现面为「零改」消费方——其**条目集随本批扩大**（可观察面），未单独登记。 | 在判据句 5 / D-SE54 补一句可观察 delta 登记（需求 §2.2 F12 口径）。 |
| 9 | Numeric drift | 🔵 | 需求 `:158` 行数读数（400 / 437 / 339 行）无 as-of 标记，且所涉档已被 2026-09-25/26/27 多批触及；`:159` 用例面则标「2026-09-21 实测」。（本次评审不读源档 ⇒ 不可核验） | 补 as-of 标记或收口刷新。 |

VERDICT: changes-required
计数：🔴 1 · 🟡 3 · 🔵 5（共 9）

### 轮次 2（评审子代理）

**复评（轮次 2）· 范围 = `docs/core/requirements/SESSION.md` · `docs/core/design/SESSION.md` · `docs/desktop/design/IPC.md`（三档全文复读；对象 = SESSION-LIST-DISK 批（2026-09-28）文档集）**

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | design/SESSION.md | 🔴 | Fixed | `:204` D-2①/② 去 `∈ m.slots`；`:205` 新增「D-2 存在性判据（盘面单判）：①② 的门 = 槽文件在盘（**manifest 条目不作门**——2026-09-28 可达性扩展，§6.22 判据句 4）」——与 `:746`「去条目合取、改**盘面文件单判**」同口径；全文 `∈ m.slots` 归零（仅 `:950` 变更记录留档）。 |
| 2 | 2 | design/SESSION.md | 🟡 | Fixed | `:762` 补「**验收回指（需求档 §4.1 F5）**」：① 判定句 → 判据句 1（用例组 1–3）· ② 读放大上界 → 判据句 2（4 / 5——读计数桩）· ③ 降级阶梯 → 6–10 · ④ 可达性扩展 → 11–16；§5 `:64` 承载列项（含「验收回指」）兑现。 |
| 3 | 3 | design/SESSION.md | 🟡 | Fixed | `:759` 补「落点与测试面（清单承载）：file 级落点表（行数 / 预期增量 / >300 档审视）与用例表（18 条）= **批档 §2.3 / §2.4**」+ `:760` 尺度结论 = `session-slots.mjs` 现读 **322 行**（as-of 2026-09-28）· 净 **≈ −17** ⇒ ≈305 · 500 硬线内 · 无档位拆分需要；新档 ≈170 行。 |
| 4 | 4 | IPC.md | 🟡 | Fixed | `:62` 行改「运行标记 / 待审批位 = **渲染面位标面**（**不经本载荷**——「会话族注」项 4）」；注 4 `:100` 改「**位标面（运行标记 / 待审批位）已落（批 7 / 批 A）**……**不经本行载荷字段**；左列会话行位标面未落」——行 / 注口径对齐。 |
| 5 | 5 | design/SESSION.md | 🔵 | Fixed | `:729` 摘要快路字段名 `ts` ⇒ `updatedAt`（「摘要在场且 `updatedAt ≥ 文件 mtime`」）；全文无 `ts ≥` 残留。 |
| 6 | 6 | IPC.md | 🔵 | Fixed | 变更记录 `:256` 补录：「`:105` 可达性扩展引用**补录**（2026-09-28 设计轮落、本轮入账——零新语义）」——记录面缺项闭合。 |
| 7 | 7 | IPC.md | 🔵 | Fixed | `:256` 载「规范面「本批」⇒ 批号收正九行十一处（对齐重定位批十处 / 批 9 一处；变更记录面留档不动）」；抽验 `:14`「（**对齐重定位批增**）」· `:16`「（对齐重定位批增 · D20 单源）」· `:23`「**载荷扩（对齐重定位批）**」· `:85`「**白名单面（批 9 落 · 批 A 追加 · 批 B 追加 · 对齐重定位批追加）**」——均为批号点名形。 |
| 8 | 8 | design/SESSION.md | 🔵 | Fixed | `:755` 补「**可观察面登记（需求 §2.2 F12 口径）**：ACP `session/list` 与 `read_history` 的 `cwd:` 发现面 = **条目集随盘面扩大的可观察面**……逐条登记于此」。 |
| 9 | 9 | requirements/SESSION.md | 🔵 | Fixed | `:158` 坐标改「实核 · 2026-09-28 复读」＝ 76 / 246 / 312 / 21 行；`:159` 用例面 490·8 / 192·8 / 236·9 / 141·5；变更记录 `:185` 对位（「评审轮 1 发现 #9 处置」）。 |

**新发现**：无（三档交叉复核未见本轮修正引入新矛盾；无崩溃 / 数据丢失 / 逻辑错误级新问题）。
**计数**：prior 9 项 = Fixed 9 · Unfixed 0 · New 0（🔴 0 · 🟡 0 · 🔵 0 未决）。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-28 05:12「都自动跑吧」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass**：轮 1 = changes-required（1🔴/3🟡/5🔵）→ 修正轮 #4（8 条）+ 尾账 #5（§2.9 收正块 + `UI.md:28` 口径）→ **轮 2 = pass（9/9 Fixed · 0 新项）**；
- ② **修正落地核验** ✓：父侧逐点复读（`SESSION.md:202-205` · `:729` · `:755` · `:759-763` · `IPC.md:62` · `:100-102` · `:256` · 需求档 `:158-159`）；
- ③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：§2 定稿设计（清单盘面实读 + 可达性扩展 + 用例组 1–18）；实施写域 = `thincoder-core/session-slot-scan.mjs`（新）+ `thincoder-core/session-slots.mjs` + `thincoder-core/session-lifecycle.mjs`（`:317` 判据）+ 新测试档（§2.3 表）

## §5 实施记录（eng-coder）

**状态行**：实施完成（四档落点 · 核 745/745 全绿（含 T-SD1–18）· 三端 884/1033/192 全绿 · 审计终态 clean · advisor 轮 1 pass）

### 5.1 交付摘要

- **落点四档 = §2.3 表（`git status` 实核：2 改 + 2 新，零表外）**：`thincoder-core/session-slot-scan.mjs`（新 · **299** 行 ≤300）· `thincoder-core/session-slots.mjs`（322 → **309** 行 ≤320 · 净 −13）· `thincoder-core/session-lifecycle.mjs`（354 行 · `switchToSlot:317` 处 +1 行判据 +2 行注释）· `thincoder-core/test/session-list-disk.test.mjs`（新 · 258 行 · T-SD1–18）。
- **判据落地**：§6.22 判据句 1（盘面枚举：`sessionPath` 前缀 + 数字槽号全锚 + 普通文件判；manifest 不入条目集）· 2（四级取数链 + `SCAN_*` 三常量单源新档 + 预算 4 MiB 按 mtime 降序耗用、越预算退 ④）· 3（降级阶梯：内容档可用性 = `version ∈ {1,2}` ∧ `history` 数组 ∧ cwd 一致；计数降级 `0` 且类型 number）· 4（三处准入：`switchToSlot` / `deleteSlot` = 盘面 ∨ 条目〔旧分支逐字保留〕、`usableSlot` = 盘面单判；认领 / active / 槽号分配零改）· 5（行形态逐字段零改——12 字段名 / 次序 / 类型；消费面六档零改）。
- **实测读数**：核 `node test/run.mjs` = **745/745 全绿**（含新增 18 例）· CLI 884/884 · VSC 1033/1033 · 桌面 192/192（三端=T-SD17 面，本席实跑）。**真机实证**（本户 `D:\teamcode` 盘面）：列表 **2 → 50 条**（48 条「文件在盘 ∧ manifest 无条目」全数入列）· 读放大 48 档 / **2,819,542 B ≤ 4 MiB** · 摘要快路命中 2（slot 48/50）· 桩 = `_scanStats`（`{calls, bytes, fastPath, reads}`）。
- **活体观察（报告 · 非阻塞）**：真机 `listSlots` 冷启 143.7 ms / 暖 77–137 ms，成本构成 = `readdirSync`（共享 sessions 根 **1781** 条目）≈60 ms + 50×stat ≈4 ms + 44×64 KiB 头窗读 ≈19 ms + 扫描 ≈20 ms；同机对照 = `.thincoder`（35 条目）readdir 0.3 ms ⇒ 枚举单价 ≈30–40 µs/条目（本机目录过滤/盘速）。**同根 1781 条目即越 F-SL1 50 ms 线**（设计档 §6.22 边界行「`stat` = 唯一 O(N) 成本」未计 readdir 全部条目面——归设计档，已随本段报父侧）。

### 5.2 决策透明表

| # | 决策 | 依据 | 说明 |
|---|---|---|---|
| 1 | 摘要快路比较字段 = 摘要 **`ts`**（非批前设计档字面 `updatedAt`） | 父侧 2026-09-28 裁定（本舱上抛 + 实读：本户 slot 48/50 `updatedAt` 恒早于 mtime +1.5 / +107.6 ms、`ts` 恒新 −0.38 / −0.50 ms）+ §6.22:738/740 已收正 | 代码注释标注裁定来源；设计档收正另派（#18） |
| 2 | ④ stat 兜底 / 读失败 / 内容档降级径：摘要补位**允许**，`updatedAt` 取 mtime | 父侧裁定 ②（不须收窄为纯缺省）+ §6.22 判据句 2 ④ 行 + 判据句 3「日期 = mtime」 | 其余字段走「盘面 > 摘要 > 缺省」；无盘面数据径 `updatedAt` 恒 = mtime（① 快路仍取摘要 `updatedAt`） |
| 3 | 新档导出 `_scanStats` / `_resetScanStats` 测试缝 | 用例表 T-SD4 / T-SD5 的「读计数桩」断言面（ESM 具名 import 不可打桩）；核内先例 `_storeStats` / `_releaseStats` | 生产零消费；`reads` 逐次记 `{slot, bytes, window}` |
| 4 | ③ 内容档可用性 = 「`history` **键值以 `[` 起**」 | §6.22 判据句 3 降级阶梯（② 面 = `Array.isArray` 的等价物） | 背离审计发现 1 收正：非数组 `history` 大档 ⇒ 退缺省 + mtime（T-SD7 补断言） |
| 5 | 行时间标 `timestamp` / `date` 基准 = 摘要 `ts` > 数字形旧条目值 > mtime | 行形态零改（旧实现 `ts` 语义）+ 无摘要档合理降级 | 无摘要档由 `0`（1970）改善为 mtime；六消费面实核无一读 `date` / `timestamp`（CLI 用 `updatedAt` / `turnCount` · VSC 用 `updatedAt` / `count` / `provider` · 桌面用 `updatedAt` / `messageCount` / `activeProvider`） |

### 5.3 审计与代码评审轮次与终态

- **内部探索式背离审计（自跑 · 只读 · 轮 1）**：6 条发现全 🔵。**已修 3**：`history` 数组判据（③ 面）· `resumeSlot` 头注 `∈ m.slots` 残留收正 · 新档头注「设计档收正另派」→「已收正为 `ts` 单源」。**报告 3**：④ 日期口径（父侧已裁，见 5.2 #2）· 设计档「拟新增」标记与行数标注漂移（归 eng-designer）· T-SD17 编号错位（见 5.4）。**终态 = clean**。
- **内部 advisor 代码评审（code 面 · 轮 1）**：**VERDICT = pass**。3 🟡（`session-slots.mjs:309` 越 300 软线——设计档 §6.22:773 已裁承既有形态 · T-SD18 夹具未覆盖**污染根**（真机 60 ms 越线面）· T-SD17 交付内容对批档 §2.4 声明的替换未登记）+ 3 🔵（槽号正则前导零 / `0` 死行面〔设计档正则即 `\d+`，**未改**〕· 读失败径预算 / 计数口径差〔保守方向〕· T-SD8 目录谓词覆盖缺口〔**已补夹具**〕）。**零 🔴、零 must-fix ⇒ 未触发修正轮；终态 = clean**。
- **fix round**：轮 1 = 审计发现 1 / 3a / 3c + T-SD7 / T-SD8 断言补强（纯测试面加固，零语义变更）；advisor 面零 must-fix。

### 5.4 对位与披露

- **T-SD17 内容替换（披露）**：批档 §2.4 的 T-SD17 = 「三端既有套件全绿」；核内该号落成**行形态 / 类型契约**断言（12 字段名 / 次序 / 类型，含降级行计数仍为 number——承 §2.5 零改断言 ②；三端套件无法在核档内机检）。三端全绿以**实跑读数**承载：CLI 884/884 · VSC 1033/1033 · 桌面 192/192（见 5.1）。
- **设计档漂移（报告 · 未改）**：`session-slot-scan.mjs` 现已落地，设计档四处仍以「拟新增」指称、§6.22 尺度结论预估 ≈170 行（实读 299）；`docs/desktop/design/IPC.md` 若需随动归 eng-designer。另 `thincoder-core/session-slots-manifest.mjs:30` 注释仍点名已退役的 `loadSlotMeta`（该档归 #476 批在途，本批零动）。
- **本席零动项**：消费面六档（CLI×2 / VSC×1 / 桌面×1 / ACP×1 / read-history×1）· manifest 写面 · 认领 / active / GC / 槽号分配语义 · 任何文档（设计档 / 批档 / 需求档 —— 收口归父侧与 eng-designer）。

## §6 验证与收口（父代理）

**验证（父侧亲跑 · 2026-09-28 05:5x）**：① 目标用例 `cd thincoder-core && node --test test/session-list-disk.test.mjs` = **18/18 pass / 0 fail**（含 T-SD5 读放大上界 · T-SD11–14 可达性正负断言 · T-SD18 50 档性能线）；② 真机实证（实施侧 §5.1——父侧采信，用户面症状闭合）：本户列表 **2 → 50 条**（48 条「文件在盘 ∧ manifest 无条目」全数入列）· 读放大 2,819,542 B ≤ 4 MiB · 摘要快路命中 2；③ 三端回归读数（实施侧实跑）：核 745/745 · CLI 884/884 · VSC 1033/1033 · 桌面 192/192；④ 设计档读数回填（**父侧直接执行〔可 revert〕**）：§6.22 尺度结论按实施后实读收正——`session-slots.mjs` 落 **309 行** · 新档 `session-slot-scan.mjs` **已落 · 299 行** · `session-lifecycle.mjs` **354 行**。

**上报处置（三项）**：① 活体观察（readdir 全条目面 ≈60 ms ⇒ 冷启 143.7 ms 越 F-SL1 50 ms 线；设计档 §6.22 边界行「stat = 唯一 O(N) 成本」未计 readdir 面）⇒ **记账 #485**（归批——消解候选 = sessions 根目录布局收窄 ∥ 阈值复审）；② §5.4 设计档漂移（「拟新增」指称 + 行数预估 vs 实读）⇒ 随上 ④ 回填；`IPC.md` 无需随动（「端壳不扫目录名」语义仍真）；③ T-SD17 内容替换披露（行形态契约断言替代「三端套件」号）＝ 受理——三端全绿以实跑读数承载。

**提交与推送**：`620846d0`（fix: list sessions by scanning disk slots——四档）· 双远端已推 · 推送后核验 = `rev-list --count` 双零。

**结算（D7）**：台账 #475 → 待核销 → 已核销（evidence = 本 §6 + 提交号）· 设计槽已消费（链终态）。
