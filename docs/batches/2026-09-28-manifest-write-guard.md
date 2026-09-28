# 2026-09-28 · manifest-write-guard
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 04:55 裁定「为什么这么喜欢挂账不修」——台账 #476 直接立链（今晚会话消失事件的根因项：saveManifest 降级路径静默整档写回）。
> 台账 = #476（会话存储面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-28 04:55 裁定「为什么这么喜欢挂账不修」——台账 #476 由条件待办直接立链）**：今晚会话消失事件的**根因项**：`saveManifest` 降级路径以调用方内存对象整档写回（读失败 / 形状异常窗口内的一次保存 ⇒ manifest 永久缩水；无告警无自愈；实证 = 本户条目 50 → {48,50}，盘上文件完好）。

**范围**：① **降级写护栏**（读失败 / 形状异常 ⇒ 拒绝写或显式 loud 失败——**禁静默整档替换**）；② **自愈路径评估**（盘面 ∪ 条目对账回填——须先核 deletions 语义，不得复活已删意图）；③ 受影响面 = `thincoder-core/session-slots-manifest.mjs` 写面（+ 需要时的调用点）。

**边界**：批 #475（列表盘面实读）不在本批——已另行在途；认领 / active / GC / 槽号分配语义零改；清单面不重开。

**依据**：台账 #476 证据行（邻居四项已排除：`cleanDeadOwners` / `session-lifecycle.mjs:225` 死主清理 / `session-gc` / `migrateHashLength`）。

**链**：§2 设计 → §3 评审（用户点火）→ §4 批准 → §5 实施 → §6 收口。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（轮次 initial + 评审轮 1 修正（发现 1–7 全落 + 父侧实施实证回灌 · 2026-09-28）· 落点 = docs/core/design/SESSION.md §6.23 + D-SE59/D-SE60）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与范围

- **覆盖条目**：台账 **#476**（tech_todo · 在途）——「`saveManifest` 降级整档写静默丢失」根因项：① 降级写护栏 ② 自愈路径评估 ③ 受影响面与测试面定形。本批 = 技术债修复（#476 `req_doc` = null）⇒ 无需求档条目、需求档零改（需求档笔 = 主 agent）。
- **不在本批**：批 #475（会话列表盘面实读——另批在途，零交叠见 §2.2 (f)）· 存量损伤修复（本户 50 → {48,50}）· `loadManifest` 读面 loud 化 · 三端 / ACP 调用面（零改）。
- **轮次**：initial（设计轮）。本段 = 批次任务 + 机制设计 + 验收对照（一次性批次材料）；机制权威落点 = `docs/core/design/SESSION.md` **§6.23**（2026-09-28 落）。

### 2.2 机制设计（判据句摘要 · 权威面 = 设计档 §6.23）

**(a) 写前分类 · 两类可写情形（判据句 1）**：`saveManifest` 落盘前分类 fresh 状态——仅 ① 合法创建（路径不存在 / ENOENT ⇒ 以调用方对象建新档）与 ② 可信合并基座（可读 ∧ 可解析 ∧ 非 null 非数组对象 ∧ `slots` / `slotSessions` 缺席或为对象）两路通向 `writeSessionFile`；缺席字段按 `{}` 归一（与 `loadManifest` 宽容线同向——空基座可合并、不拒写）。

**(b) 不可信基座 ⇒ 拒绝写 · 盘面零变更（判据句 2）**：(a) 读失败（非 ENOENT：EISDIR / EPERM / EBUSY 等）⇒ 拒写 · 不改名（读不到 ≠ 损坏）；(b) 解析失败 ⇒ 拒写 · 保底改名 `.corrupted`（现场保全 + 解封下一写）；(c) 形态非法（顶层非对象 / 数组 / `slots` 非对象 / `slotSessions` 非对象）⇒ 同 (b)。总句 = 「文件存在 ∧ 基座不可信」⇒ 本次调用对盘面零字节写（除 (b)(c) 一次改名）。

**(c) loud + 返回值（判据句 3）**：拒写每次一行 `console.error`（reason 三类 + 路径；(b)(c) 附 preserved）；返回值 `true` = 已落盘 / `false` = 拒写——唯一消费点 = `releaseClaimsAll` 透传（`!== false`），其余调用点忽略（零行为变化）；拒写不回滚调用方内存态（下一次保存重试）。

**(d) 相邻面零改（判据句 4）**：`loadManifest` 降级读不改（写面收口——读面不伤盘）；`writeSessionFile` 零改；`.corrupted` 命名与槽面同形；认领 / active / 删除 / GC / 槽号分配零改。

**(e) 自愈明裁：不做（判据句 5）**：① `deletions` 语义冲突——删除意图唯一表达 = `deletions`（D-SE4），删文件 best-effort（`thincoder-core/session-slots.mjs:232`）⇒ 盘面回填会复活已删意图；② 收益已被 §6.22 解耦消解（摘要面自然自愈——D-SE58 + `thincoder-core/session.mjs:173-177`）；③ `slotSessions` / `active` 无盘面证据（回填即发明）。

**(f) 与 #475 零交叠（判据句 6）**：文件面零重叠（本批 = `thincoder-core/session-slots-manifest.mjs`；#475 = `thincoder-core/session-slots.mjs` / `thincoder-core/session-lifecycle.mjs` + 新档 `thincoder-core/session-slot-scan.mjs`（拟新增））；机制面 = 写面 ∥ 读 / 列表面，判据互不引用、落地前后同真值；方向同向（只减少写、不新增写路径）。

**(g) 关键决策摘要（权威 = 设计档 §7）**：**D-SE59**（不可信基座 ⇒ 拒绝写 + loud；否决「仅 loud 照写」/「合成重读再写」/「维持现状」）· **D-SE60**（不做自愈——只做护栏；理由同上）。

**(h) 文档面落点（本批已落）**：`docs/core/design/SESSION.md` 新增 **§6.23** · §6.2 两处收正（`.corrupted` 兜底行 / `saveManifest` 条目级合并条）· §7 补 **D-SE59 / D-SE60**（标题随 **D-SE1–D-SE60**）· §5 落点指针 · 变更记录一行。其余邻面检读结论 = §2.6。

### 2.3 受影响文件与行数预算表（as-of 2026-09-28 实读）

| # | 文件 | 现值 | 预计 | Δ | 改动内容 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs` | 324 | ≈364 | +40 | `saveManifest` 写前分类 + 拒写 / loud / 返回值；`releaseClaimsAll` 透传返回值（1 行） |
| 2 | `thincoder-core/test/manifest-write-guard.test.mjs`（拟新增） | 0 | ≈130 | +130 | G1–G11（§2.4）——`thincoder-core/test/run.mjs` 收集面 = `test/*.test.mjs` 单层 glob（自动收集，实核） |
| 3 | 消费面（`thincoder-core/session.mjs` / `session-lifecycle.mjs` / `session-rename.mjs` / `session-slot-write.mjs` / `token-ttl.mjs` / `peer-instances.mjs` / ACP 两档） | — | — | **0** | **零改**——新增返回值仅 `releaseClaimsAll` 消费；其余调用点忽略 |

**行数口径注**：核档 ≤300 软线 / ≤500 硬线（AGENTS.md）——第 1 行 324 → ≈364 **落硬线内 · 无档位拆分需要**（>300 软线承既有形态：本档 324 已是软线外存量，本批增量不改变拆分判定）；第 2 行 = 独立新档（不触既有测试档）。

### 2.4 用例表（G1–G11 · 正常 / 边界 / 错误 + 输入 / 期望；一次性材料——权威判据面 = §6.23）

| # | 类 | 输入 / 装置（故障注入） | 期望输出 |
|---|---|---|---|
| G1 | 正常 · 首建 | 无 manifest ⇒ `saveManifest(m)` | 档建 ∧ 内容 = m ∧ 返回 true |
| G2 | 正常 · 合并零改 | 盘 50 条 + m 1 条 ⇒ `saveManifest` | 51 条（读-合并-写零改；`deletions` / `setActive` 回归面） |
| G3 | 错误 · 读失败注入 | manifest 路径置**目录**（读取 ⇒ EISDIR）⇒ `saveManifest` | **零写**（路径仍为目录）∧ 不改名 ∧ stderr 一行 read-failed ∧ 返回 false |
| G4 | 错误 · 解析失败注入 | 写坏 JSON（`{oops`）⇒ `saveManifest` | 原字节改名 `.corrupted`（逐字节一致）∧ 原路径不存在（未重建）∧ stderr 一行 parse-failed ∧ false |
| G5 | 错误 · 形态非法注入 | 写 `[1,2,3]` ∥ `{"slots":42}` ⇒ `saveManifest` | 同 G4（shape-invalid） |
| G6 | 边界 · 空基座 | 写 `{}` ⇒ `saveManifest`（m 有 2 条） | 正常合并写（2 条落地）∧ 零告警（`{}` = 合法空基座） |
| G7 | 边界 · 解封后首建 | G4 之后再 `saveManifest`（原路径已空） | 创建新档（内容 = m）∧ true |
| G8 | 边界 · 信号 / 透传 | G2 / G3 后各调 `releaseClaimsAll` | true / **false**（拒写透传；认领残留 → 恢复走探测面——F-XR1 容错形态） |
| G9 | 零回归 · 认领链 | `claimSlot` / `ensureActive` / `switchToSlot` 正常路径 | 档面与现行为逐字节等价（合并 / setActive / release 三判据） |
| G10 | 零回归 · 退出释放 | `releaseClaimsAll` 正常（可读档） | true ∧ 认领清零（既有断言语义保持） |
| G11 | 零回归 · 槽文件面 | 槽文件解析失败 ⇒ `loadSlotFile` | `.json.N.corrupted` 保全 + 目标档照写（既有用例 `thincoder-core/test/session-slot-write.test.mjs:134` 保持——护栏只管 manifest） |

**故障注入面说明**：G3–G5 三面（读 / 解析 / 形态）全部用真实文件系统手段注入（目录占位 / 坏字节 / 异形 JSON），不加 fs 桩；G1–G2 / G6–G11 为反向面（可写情形 + 零回归锚）。

### 2.5 验收对照（批档 §1 验收标准 → 本批判据）

| # | §1 验收标准 | 落点 | 机检形式 |
|---|---|---|---|
| 1 | 护栏判据（可机检） | 设计档 §6.23 判据句 1–3 | G1–G8：盘面零变更 ∧ stderr 行 ∧ 返回值 |
| 2 | 自愈边界 or 明裁不做 | 设计档 §6.23 判据句 5（含 `deletions` 语义核实） | 明裁「不做」+ 三理由（不涉代码断言） |
| 3 | 用例面（护栏触发 + 故障注入） | §2.4（G1–G11） | 全表 |
| 4 | 与 #475 零交叠 | 设计档 §6.23 判据句 6 | 文件面零重叠（§2.3 第 1 行 vs #475 §2.3） |
| 5 | 行数尺度 | §2.3 + 设计档尺度结论 | 324 → ≈364，≤ 500 硬线 |
| 6 | doc-check 净增 0 悬空 + 0 行宽（新行 ≤300 字符） | 本档 + 批档 | 读数 = §2.6 尾行 |

### 2.6 上抛项（只报不写）与读数

1. `loadManifest` 降级读静默返空——本批不改（判据句 4 理由）；若要求读面 loud（与写面 loud 对偶）= 另议。
2. 存量损伤户（本户 manifest 50 → {48,50}）不修：摘要无源可复原（lost digests 无盘面证据）；#475 落地后 48 槽可见可用；「48 槽摘要重建」如需 = 另项（逐档全读 ≈1.8 s / 50 档量级、无消费刚需）。
3. `.corrupted` 单槽位 last-wins（改名覆盖旧现场）与首建 TOCTOU（ENOENT 检出后他进程创建 ⇒ 其新档被覆盖）——既有窗口、本批不改（设计档 §6.23 边界情形登记）。
4. 拒写对外可观察面 = stderr 一行 + 返回值；如需用户可见告警（状态行 / 面板）= 新面另议。
5. 需求档 / 台账侧零改（#476 `req_doc` = null）——#476 行状态流转（在途 → 待核销）与 §6 收口 = 主 agent / 父侧面。

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：本席起手基线 = 悬空 **48** / 行宽 **34**；设计档落笔后 = 悬空 **47** / 行宽 **32**（本批 authored 行零悬空——该档悬空行 33 / 37 / 304 / 963 / 991 均非本批笔迹；本批新行逐行 ≤300 字符，最长 = D-SE60 行 281）。两读数之间他批在途笔迹致候选 +32 行——漂移归因同 #435 在册现象（不猜因、不改数）。

### 2.7 设计评审轮 1 修正（fix · 2026-09-28）

承 §3 轮次 1 发现 1–7（父侧逐条裁定接受）+ 父侧实施实证回灌（发现 1 同笔：快路比较字段 = 摘要 **`ts`**，非 `updatedAt`）。处置全落设计档 `docs/core/design/SESSION.md`（下表行号 = 修正后 · as-of 2026-09-28），**零新语义**（均为发现 / 裁定直接导出项；§6.23 判据句 1–6 与 D-SE59 / D-SE60 语义未动）：

| 发现 | 处置 | 落点 |
|---|---|---|
| 1 字段枚举 + 比较口径 | §6.3 补 `effort` / `createdBy`；§6.4 `slotDigest` 补 `updatedAt`（会话逻辑时）/ `ts`（摘要落盘时刻）/ `activeModel` / `createdBy` + 字段单源指针；§6.22 判据句 2 ① 比较字段收正为 **`ts`**（`updatedAt` 恒早于 mtime ⇒ 按它比快路生产永不命中——实施实证本户 slot 48/50）+ 新增「快路比较口径（单源）」条（打点时机 / 同值 = 新鲜 / 退级形态） | `:133-134` · `:143-144` · `:737` · `:739-741` |
| 2 §1 归属与范围 | 补「口径 / as-of」行 + 现行模块清单指针（§6 各节）+ `read-history` 现行路径 | `:19-21` |
| 3 尺度覆盖 | §6.22 尺度结论补 `thincoder-core/session-lifecycle.mjs`（352 行 · ≤ ±1）；§6.24 尺度结论补 `thincoder-core/session.mjs`（254 行 · ≈ +1）与桌面端壳 `thincoder-desktop/src/main/session-slots.mjs`（154 行 · ≤ +20） | `:774` · `:850` |
| 4 修订式表达 | §6.2 / §6.8 / §6.19 三处删（历史归记录面；§6.8 以现态「触发场景」改述） | `:112` · `:186` · `:646` |
| 5 §6.11 值域 / 来源 | `env` 值域 = 端名闭集（含 `desktop`）+ 来源 = `sessionEnd()`（`END` 仅模块级初值）+ 模板字面归属注 + 桌面链 unverified 标注；§6.1 目录示意改 `<端名>` 形 | `:228-231` · `:93` |
| 6 拆档审视 | §6.23 / §6.24 尺度结论各补「拆档审视：承既有形态（既有裁定）」 | `:821` · `:849` |
| 7 变更记录顺序 | 分段口径（上段 = 拆档后各批 · 倒序累积 / 下段 = 建档期升序）+ 下段边界标记；**全量重排未做**（同日跨批相对序不可判 ⇒ 重排须臆造；dispatch 允许的分段标注回退路径） | `:959` · `:961-963` · `:998` |

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：修正前 = 悬空 **47** / 行宽 **32**；修正后 = 悬空 **47** / 行宽 **31**（净增 0 悬空 · 行宽 −1——原 `:137` 超宽行随重排消解；本批新行逐行 ≤300）。

**本席上抛（只报不写）**：① §6.11 模板字面枚举仍为 `{cli|vscode}`（提示词面内容——桌面端是否入列 / 是否走该注入链归主 agent 判定）；② §6.22 尺度结论的 `session-slots.mjs` 现读 **322 行** vs 本席实测 **321 行**（归 #475 在途读数面，本席未改）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

审查对象 = `thincoder/docs/core/design/SESSION.md`（全档 1041 行 · as-of 2026-09-28；无对象声明附加项 ⇒ 目标 = 评审 scope 全档）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state / 字段枚举（R7a） | 🟡 | 两处字段集枚举未随 §6.20 / §6.21 收正：§6.3 `:129` 槽文件「字段集」缺 `effort`（§6.21 `:698` 明列槽顶层字段）与 `createdBy`（§6.20 `:659` 明列槽顶层字段）；§6.4 `:137` 的 `slotDigest` 列表缺 `updatedAt`（§6.19 `:577` · §6.22 `:729`/`:739` 均按摘要携带 `updatedAt` 取数）与 `createdBy`（§6.20 `:675` 明述摘要带 `createdBy`）；§6.22 `:729` 的「摘要 `updatedAt` ≥ 文件 mtime」比较口径（打点时机 / 同值边界）未钉定——直接关系 AC「fresh 摘要档 = 0 字节」（`:733`）的可满足性。判为枚举滞后 + 口径未钉定（非机制面两述冲突：§6.22 `:765` 声明「不改槽文件与 manifest 形态」⇒ 这些键应已在现行形态内）。 | 以单点定义收敛字段集（或把 `effort` / `createdBy` / `updatedAt` 回写 `:129` / `:137`），并钉定摘要 mtime 比较口径。 |
| 2 | Doc-state（R7a） | 🟡 | §1「归属与范围」`:10-17` 模块图未覆盖 §6 已收编的现行模块（`thincoder-core/session-lifecycle.mjs` `:421`/`:745` · `session-slots-manifest.mjs` `:490` · `session-stale.mjs` `:237`/`:426` · `session-index*.mjs` `:562` · `fts-text.mjs` `:565` · 拟新增 `session-slot-scan.mjs` `:735`），且与 §6「现状路径」口径（`:73`）混用旧路径形（`:17` `src/agent-tools/...`），未标注口径 / as-of。 | 刷新 §1（补行或加指针到完整模块清单），或显式标注其口径与时点，避免被读作现行全图。 |
| 3 | Affected-file annotations（评审标准 8） | 🟡 | 尺度 / 落点覆盖不全：(a) §6.22 明示将改 `thincoder-core/session-lifecycle.mjs`（`:745`；§6.23 `:801` 同述），但该节尺度结论（`:760`）只标 `session-slots.mjs`（322→≈305）与拟新增档；(b) §6.24 尺度结论（`:835`）只标 `session-lifecycle.mjs`（352→≈386），同批将改的 `thincoder-core/session.mjs`（re-export，`:817`）与桌面端壳（`:827`）无行数 / 增量。（逐档落点总表 = 批档 §2——本评审 scope 外，是否已覆盖 unverified。） | 在尺度结论行补全被改档的读数 / 增量，或注明「逐档表见批档 §2」并保持齐备。 |
| 4 | Doc hygiene | 🟡 | 规范面残留修订式表达：`:108`「（原实现每次保存重推——…）」· `:638`「（父侧收正 2026-09-22 · 可 revert）」· `:179`「曾直接 throw…现改为…」同型；本档既有实践 = `:994`「删修订式表达」（历史归记录面）。 | 删除修订式表述（或移入变更记录）；保留问题背景者以现态「触发场景」陈述即可。 |
| 5 | Clarity / Doc-state | 🔵 | §6.11 `:221-222` env-state 行模板值域仍为 `{cli|vscode}`、来源写「仓常量 `END`」，与 §6.10 `:202` 端名闭集（含 `desktop`）及 §6.20 `:654` 端名机制（`END` 仅初值、缺省 = `sessionEnd()`）未对齐；§6.1 `:89` 目录示意亦只列 `.cli|.vscode`。桌面端是否走该注入链 unverified；行模板本体归属注在 §8.2 `:928`。 | 收正值域 / 来源表述或加指针（若归提示词板块，注明）。 |
| 6 | Affected-file size（R3 债） | 🔵 | 两个 >300 档在本档两批继续增长且档内无拆档审视记录：`session-lifecycle.mjs` 352→≈386（`:835`）· `session-slots-manifest.mjs` 324→≈364（`:807`，处置 = 「>300 软线承既有形态」）。均未越 500 硬线。 | 沿用既有裁定即可；建议在收口轮记一次拆档审视结论（防「承既有形态」成默认豁免）。 |
| 7 | Methodology（变更记录） | 🔵 | `:942-1041` 变更记录顺序非单调——首段 09-28→09-22 降序 + 后段 09-13→09-27 升序（末条 = 09-27 收口轮）⇒ 定位「最后变更」需两处扫。 | 归一为单一顺序（新在前）。 |

限域说明：未声明项目标准档 / 文档地图 ⇒ Document ownership 标准降级核（本档内放置与复制面已核：增量为本子系统档内收编、§5 指针不复制批档材料，未见新建档分片）；需求档 / 批档 / 源码均在评审 scope 外 ⇒ 需求符合性与坐标行号未逐条核验（本档 `:73` 自述行号未逐条复核）。

**VERDICT: pass**（无 🔴；🟡 4 · 🔵 3，全部不阻塞）

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-28 05:12「都自动跑吧」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass**：轮 1 = 0🔴 / 4🟡 / 3🔵（评审 14）——护栏本体（§6.23 判据句 1–6 + 自愈明裁）过审；
- ② **修正落地核验** ✓：修正轮 #18 七条 + 父侧补充裁定（快路字段 `ts`——实施实证回灌）同笔落；父侧逐点复读核验（`SESSION.md:133-134` · `:143-144` · `:737` · `:739-742` · `:228-231` · 规范面修订式残留归零）· doc-check 净增 0 悬空 / 行宽 −1；
- ③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：§2 定稿设计（拒写不可信基座 + 三分类处置 + `releaseClaimsAll` 透传 + G1–G11）；实施写域 = `thincoder-core/session-slots-manifest.mjs` + `thincoder-core/test/manifest-write-guard.test.mjs`（拟新增）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（审计 1 轮 clean（四类偏差 0）· 代码评审 2 轮 pass（轮 1 = 0🔴 + 1🟡 report-only + 5🔵；轮 2 = 4/4 修复声明核实）· fix 轮 1（4 项 🔵 已修：2 注释 + 2 断言）· core 套件 745/745 全绿 · 终态 clean）

### 5.1 交付摘要（落点 = 两档 · as-of 2026-09-28 实读）

| # | 文件 | 现值（`wc -l` 口径） | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs` | 324 → **366** | `saveManifest` 写前分类 + 拒写三径 + 返回 `true`/`false`（+ 模块私有 `isTrustedBase` / `preserveScene` / `refuseManifestWrite`）；`releaseClaimsAll` 返回值透传（`return saveManifest(...) !== false`） |
| 2 | `thincoder-core/test/manifest-write-guard.test.mjs`（新增） | 0 → **228** | G1–G11（批档 §2.4 全表）+ G8 内透传直证 / G9 内逐字节等价断言 |

- **判据句 1**：`fresh = JSON.parse(readFileSync(p, "utf8"))` ⇒ ① `err?.code === "ENOENT"` 首建（写调用方对象）；② `isTrustedBase(fresh)` 可信基座 ⇒ 读-合并-写。合并块四判据（条目级合并 / `deletions` / `setActive` / `opts.release`）与改前形态逐行同形；缺席字段按 `{}` 归一（假值 ⇒ 缺席，判据线单源 = `loadManifest` 的 `!m.slots → {}`）。
- **判据句 2**：非 ENOENT 读失败 ⇒ 拒写 · **不改名**；`SyntaxError`（解析失败）⇒ 拒写 + 保底改名 `{manifest}.corrupted`（原字节逐字节保全）；`!isTrustedBase`（形态非法）⇒ 同解析失败径。三条拒写径**零 `writeSessionFile` 调用**（`refuseManifestWrite` 只发 loud 行 + 返回 false）。
- **判据句 3**：loud 行 `[session] saveManifest: write refused (reason=<read-failed|parse-failed|shape-invalid>) path=<p>`（(b)(c) 附 ` preserved=<p>.corrupted`）；返回值 `true` = 已落盘 / `false` = 拒写；**唯一消费点 = `releaseClaimsAll` 透传**（全仓 `saveManifest(` 调用点已逐条核 = 裸语句，零返回值消费）。
- **判据句 4 / 6**：`loadManifest`（静默降级读）/ `writeSessionFile` / 认领 / active / `deletions` / 槽号分配 / GC 语义零改；写面仅本档一档，与 #475 文件面零重叠。

**命令读数（改后复跑）**：

- `cd thincoder-core && node test/manifest-write-guard.test.mjs` ⇒ tests **11** / pass **11** / fail 0。
- `cd thincoder-core && node test/run.mjs` ⇒ tests **745** / pass **745** / fail 0（含 G1–G11；并行 #475 批的 T-SD1–T-SD18 亦在其中）。
- `node scripts/doc-check.mjs --root .` ⇒ 悬空 **47** / 行宽 **31**（＝ §2.6 设计落笔后读数 ⇒ 本批零净增；本批未写文档）。
- 行数：源档 366 行（≤500 硬线 ✓；>300 软线承既有形态 + `SOFT_LINE_REGISTRY` 在册）· 新测档 228 行（<300 ⇒ 无需登记）；两档均零 >300 字符行。
- 越域：本批实际写面 = 上表两档；`git status` 内 `session-slots.mjs` / `session-lifecycle.mjs` / `session-slot-scan.mjs` / `test/session-list-disk.test.mjs` = 并行 #475 在途笔迹（非本批）。

### 5.2 决策透明表（本批判断点 / 设计未明写处）

| # | 决定 | 依据 | 备注 |
|---|---|---|---|
| 1 | (b)(c) 的 `preserved=` **无条件**输出（即使改名失败） | 设计 `SESSION.md:801` 字面 = (b)(c) 附 `preserved=<p>.corrupted`（无"成功才附"条件）；评审轮 1 #3 提"日志读者无法区分保成/未保成" ⇒ 走**注释路径**：`preserveScene` 注明返回值为**改名目标路径 · 非存在性保证**（失败面 = `.corrupted` 缺席自证） | 行字面零改（G4/G5/G8 逐字断言钉住） |
| 2 | `slots` / `slotSessions` 的「假值（`0` / `""` / `false` / null）⇒ 按缺席归一」 | 设计 (a) 明写"与 `loadManifest` 宽容线同向"（`!m.slots → {}`）⇒ 判据取假值线；真值非对象（`42` / `"x"`）与数组 ⇒ 不可信（G5 覆盖） | 注释已钉死判据线与单源（评审 #2 🔵 处置） |
| 3 | G8 内**追加**「透传直证」（读面可读 ∧ 写面形态非法 ⇒ `releaseClaimsAll` false） | G8 表内 ② 走目录占位：`loadManifest` 降级读 ⇒ 认领不可见 ⇒ 走**早退面** false（不辨透传）；直证夹具才落到 `!== false` 透传本体 | 表内 ①② 照落，③ = 判据句 3 的直证（审计观察 3 / 评审同向） |
| 4 | G9 追加**真逐字节**断言（原 deepEqual 标签改"语义等价"） | 表 G9 期望 = "档面与现行为**逐字节**等价"；deepEqual 只证语义等价 | 断言确定性：`seed` 全定值 + `sessionId` 进程内稳定 + 键序 = fresh 继承序 + 整数键升序（评审轮 2 已核） |
| 5 | `m.sessionId = getSessionId()` 前那行 `if (m.sessionId) merged.sessionId = m.sessionId` **保留**（死行） | 既有死行（打包旧快照同形两行）；删它 = 越"四判据零改"最小差面 | 登记待下次触碰顺手清（评审 #6 🔵 ⇒ 不修） |
| 6 | `.corrupted` 命名未自创 | 设计给定 `{manifest 路径}.corrupted` = `<hash>.json.manifest.corrupted`（§6.1 后缀族 / 槽文件面同形） | — |

### 5.3 审计与代码评审轮次与终态

- **内部审计（explore · 只读偏离审计）轮 1 = clean**：四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**0 命中**；5 条 🔵 观察项（→ 4 项已处理、1 项登记：见 5.4）。
- **代码评审（advisor · code）轮 1 = pass**：0🔴；1🟡 = 源档 >300 软线 + `SOFT_LINE_REGISTRY` 触发句（`core-hygiene.test.mjs:72`）与实际动作未对账（**report-only · 不修**：软线机检绿（`:118` 在册）· 设计 `SESSION.md:821` 已裁「承既有形态（既有裁定）」· 改登记表/设计 = 越本批写域）；5🔵 = 见 5.4。
- **fix 轮 1（4 项）**：`isTrustedBase` 注释钉假值归一（`:66-69`）· `preserveScene` 注释钉"返回值 = 改名目标路径"（`:76-78`）· G5 补 `lines.length === 1`（测 `:130`）· G9 补真逐字节断言 + 标签改"语义等价"（测 `:189-193`）。复跑 11/11 绿。
- **代码评审轮 2（只验修复声明） = pass**：4/4 声明核实（注释逐句对代码 / 行数断言同族同强 / 字节断言经写轴 `session-slots.mjs:152` `JSON.stringify` 实核 + 确定性核）；**新问题 0** ⇒ **终态 clean**。
- **引用核实备注**：评审轮 1–2 的 3 条 `file:line` 被工具面标 unreadable（评审侧无 shell / 路径形缺前缀）——本席逐条实读复核**全部成立**：`thincoder-cli/src/acp/handlers-session.mjs:129` = `saveManifest(cwd, m, null, { release: keep })` · `thincoder-core/session-lifecycle.mjs:268` = `saveManifest(cwd, m, deletions, opts.releaseStale ? {...} : {...})` · `thincoder-core/test/core-hygiene.test.mjs:118` 含 `"session-slots-manifest.mjs"`（触发句**行号收正**：在 `:72` 非 `:73`）。

### 5.4 上抛项（只报不写）

1. 🟡（评审轮 1 · report-only）：`SOFT_LINE_REGISTRY` 该档触发句「越 500 硬限或**下次触碰该档的批**随批拆出认领面」（`test/core-hygiene.test.mjs:72`）与本批"触碰未拆"（324 → 366）未对账，设计侧记「承既有形态」。归父侧 doc 层二选一：① 登记注补「本批触碰未拆 · 触发顺延」；② 下次触碰时按登记句拆出认领面（`claimSlot` / `staleClaims` / `releaseClaimsAll` 族）。**本席不改**（跨文件 + 改设计裁定）。
2. 🔵（评审 #6 · 登记不修）：`session-slots-manifest.mjs` 既有死行（`if (m.sessionId) merged.sessionId = m.sessionId`，恒被 `m.sessionId = getSessionId()` 覆盖；打包旧快照同形）——非本批引入，留待下次触碰该函数顺手清。
3. 测试档规模：设计预估 ≈130 行 ⇒ 实交 228 行（新增用例含 G8 透传直证 / G9 逐字节断言；<300 ⇒ 无登记义务）。供父侧 §6 收口回灌读数。
4. 运行证据边界：本席复跑读数（745/745 · 11/11）为实施侧自报；内部审计与代码评审子代理均无 shell ⇒ 未独立复跑（其结论基于实读 + 静态推演，已在评审报告内如实登记）。

## §6 验证与收口（父代理）

**验证（父侧亲跑 · 2026-09-28 05:4x）**：① `cd thincoder-core && node --test test/manifest-write-guard.test.mjs` = **11/11 pass / 0 fail**（G4 注入现场 `.corrupted` 提示行 = 预期）；② 源档结构复读：`isTrustedBase:70` · `preserveScene:79` · `refuseManifestWrite:87` · `saveManifest:92`（三径 = `:125` read-failed ∥ `:127` parse-failed ∥ `:130` shape-invalid）+ `releaseClaimsAll:351` 透传——与设计 §6.23 判据句 1–3 逐条对位 ✓；③ 全仓读数（实施侧复跑）= core **745/745** · 净增 **0 悬空 / 行宽 31**（= §2.6 基线）。

**上抛处置（四项）**：① 注册句对账 = **父侧直接执行〔可 revert〕**——`test/core-hygiene.test.mjs:72` 补「承既有形态（§6.23 裁定）⇒ 认领面族拆分**顺延**〔台账 #484 · 专门批〕」（随本批提交）；② 源档死行（`if (m.sessionId) …` 恒被覆盖）= 既有存量，留下次触碰顺手清；③ 测试档读数回灌（≈130 ⇒ 228）= 受理（<300 无登记义务）；④ 证据边界（子代理无 shell）= 受理（父侧已复跑关键面）。

**提交与推送**：`9575263c`（fix: refuse manifest writes on untrusted base——含 G1–G11 档 + 注册句收正）· 双远端已推（gitee `origin` ∥ github）· 推送后核验 = `rev-list --count` 双零。

**结算（D7）**：台账 #476 → 待核销 → 已核销（evidence = 本 §6 + 提交号）· 设计槽已消费（链终态）。
