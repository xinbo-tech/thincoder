# 2026-09-25 · 槽位端参数化与创建端字段
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 16:40 裁定「两条一起做」——桌面端设计批（docs/batches/2026-09-25-desktop-design.md）上抛 A / E 合并为一个核侧槽位面小批：marker 端参数化 + 创建端字段；台账 #371 / #372。
> 台账 = #371 / #372（槽位端参数化与创建端字段 · 归批）。前情 = `docs/batches/2026-09-25-desktop-design.md` §10 上抛 A / E（该批在飞）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 16:40 裁定「**两条一起做**」——桌面端设计批（`docs/batches/2026-09-25-desktop-design.md` §10）上抛的 A / E 两条，合并为**一个核侧小批**（同一块代码区域，一轮评审摊薄成本）。

### 1.2 两条是什么（父侧实读坐标）

- **E · marker 面端参数化**：核 `thincoder-core/session-slots.mjs:94` = `export const END = "cli"`（**编译期常量**）⇒ `endMarkerPath` / `readEndMarker` / `writeEndMarker` 全用它 ⇒ 核 `resumeSlot` 一跑即写 `.cli` marker；端壳若直接消费核 `resumeSlot` = 以 CLI 身份写 marker = **跨端互写**（破坏 NF1「本端记录 = 本端单写者文件」）。**现状绕过** = 扩展端自持副本（`thincoder-vscode/src/extension/session-slots.mjs:60` `END = "vscode"` + 自有 marker 读写），并在同档档头 `:24-26` 登记该核缺口（「候选核内笔 = `resumeSlot(cwd, { end })`」）；桌面端照此将是**第三份副本**。
- **A · 创建端字段**：端 marker 内容仅 `{ slot, updatedAt }`（同档 `:103-112` 读写面）= 「本端最后使用的槽号」（端分离恢复用），**不含「创建端」**；槽元数据面亦无端名字段 ⇒「这个会话是哪个端建的」**数据不存在**。**旁证（不得混称）**：`thincoder-core/peer-instances.mjs` 的端字段 = 「**当前占用端**」，与「创建端」不同义。

### 1.3 裁定与范围（用户 2026-09-25）

**一个核侧小批，两条一起做**。交付 = ① 核 marker 面**端参数化**（`resumeSlot(cwd, { end })` 形态）⇒ 各端零副本；② 核新增**创建端字段**（建槽时记一次）+ 老槽缺该字段的读数语义。
**连带面**：扩展端删副本 · CLI / 扩展端 / 桌面端接口随动 · marker 三态 / 继承 / 端分离恢复的测试随动 · 桌面端设计档 §10 上抛 A/E 收口 · 桌面端需求档 §3.5 项 3（会话行「来源端」标注）解禁。

### 1.4 边界

- 本批 = **核 + 端壳接口面**（产品代码面）；不改提示词 · 不碰桌面端五档拆分批写域（`docs/desktop/design/**`）。
- **老槽兼容**：缺创建端字段 ⇒ 读数面给「**未知**」；**禁止猜测**（不得拿占用端冒充、不得回填编造）。
- **NF1 不动**（本端记录 = 本端单写者文件）——参数化后仍须保持。
- 需求档 §3.5 项 3 的收正 = **父侧笔**（随批落地后改）。

### 1.5 批级判据

① 三端**零 marker 副本**（扩展端副本删除；核参数化后各端只传端名）；② **端分离恢复零回归**（CLI / VSC 各自恢复自己的槽；desktop 语义新增）+ 三态语义不破；③ 老槽无创建端字段 ⇒ 读数给「未知」，**零猜测**；④ 三包测试全绿 + `node scripts/doc-check.mjs` 零新增闸态失败。

### 1.6 设计轮落地后的收口面（父侧 · 2026-09-25）

**时点依赖**：本批**实施落地后**（核 marker 面端参化 + `createdBy` 在盘）须同轮收正下列现述（此前它们为真，**不得提前改**）：

- `docs/desktop/design/PROJECT.md:40`（KD-5「自持 `END = "desktop"` 第三份副本」）
- `docs/desktop/design/SHELL.md:22` / `:54` / `:60`（端侧副本 · 「不改核」行）

**同轮可结案**：桌面端设计批 §10 上抛 **A / E**（两条均已由用户裁定成本批，落地即销项）；桌面端设计评审（`docs/batches/2026-09-25-desktop-design.md` §3 轮次 1）发现 8 的 Deferred 项亦随之销。

**依据** = 本批设计轮发现 1（该批 §2 · 设计者已如实上报）。
**另案（不在本批）**：观察项 4 —— `thincoder-vscode/src/extension/session-io.mjs:210-224`（`deleteSlotAndUpdate`）与核 `session-slots-manifest.mjs`（`deleteSlot`）主体逻辑重复；本批零触碰。

### 1.11 实施轮上抛裁定（父侧 · 2026-09-25 18:27）

- **冲突裁定**：实施轮 AC② 与设计单源相抵——派单写「端副本删除后全仓 `END = "vscode"` **零命中** ∥（`END` 删或降缺省）」，而设计单源（本档 §2.3「保留 `END`」· §2.9 发现 1「加 `setSessionEnd(END)`」· `docs/core/design/SESSION.md` §6.20 判据句 1「`END` 仅模块级初值」· §6.15 端壳款① 转口形态 `(cwd) => coreX(cwd, END)`）**明令保留**端壳 `END` 常量与绑定转口形态 ⇒ **裁定 = 按设计单源实现**（端壳 `END = "vscode"` + `setSessionEnd(END)` + 四项传参转口，**不动**）；「端壳零副本」的判据面 = **零算法副本**。
- **派单缺陷认账（父侧）**：AC② 的「零命中 ∥ 删常量」= 父侧派单措辞缺陷（凭摘要外推、未逐字对设计单源）——**作废**。收正后判据 = ① 端壳**无** marker 读/写**算法实现**（四项调用全经核函数 + 传参形态）；② **端名声明源全仓恰两处**（核缺省 `"cli"` ∧ 端壳 `END = "vscode"`），端壳消费形态 = 传参（无自算）。
- **表外新档认**：`thincoder-core/test/session-end-param.test.mjs` = 设计 §2.9 发现 5「越 500 硬限拆分预案」的**实测触发**（并例后 358+143=501 > 500 硬线）⇒ 按预案拆 **认**，如实披露 ✓。

### 1.12 实施轮遗留处置（父侧 · 2026-09-25 18:47）

- **设计档漂移（实施轮报告）处置 = 记入 §6**（不另起设计修正轮）：§2.3 行数预估 vs 实读 · §2.9 T11 引坐标 · 三处归属偏差——逐处实值**以 §6 为准**（批档 append-only；§6 = 法定收口面）。
- **§2.8 父侧项**：**U1**（`docs/desktop/design/PROJECT.md:40` + `SHELL.md:22/:54/:60` 的「端侧副本 / 不改核」表述已不成立）→ **并入桌面端实施后修正轮**（同面 `docs/desktop/**`；该轮已排 R-2 表/树同步 + R-5 回填 + 轮 2 三条 🔵）；**U2**（桌面需求档 `:74` 依赖解除）→ **父侧当轮落**；**U3**（跨仓契约 2 行：启动点 `setSessionEnd("desktop")` + 读 `listSlots[].createdBy`〔缺键不标注 · 禁以占用端冒充〕）→ 随 U1 同轮转达设计面；**U4** 知悉 ✓（端名闭集 = cli / vscode / desktop）；**U5** → 于 §6 核销。
- **遗留 🔵 入账**：#385（`session-guard.mjs:42` 单值缓存 `_slotMtime` 多槽同进程复用待复核）· #386（`MULTI-INSTANCE-COLLAB.md:90` 端域第二档零探测——设计档漂移观察）。`END` 双语义命名 · AC① 端壳腿（人读核验）→ §6 记观察（不排期）。

### 1.13 编号收正（父侧 · 2026-09-25 18:52）

§1.12 与 §6.4 所记遗留债编号 = 父侧**预先写号**（未经查册）有误，实号 +1 —— 收正：§1.12 的「#385（`session-guard` 缓存）」⇒ **#386** · 「#386（`MULTI-INSTANCE` 漂移）」⇒ **#387**。**以本条为准。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-25 · eng-designer initial 轮）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

设计轮 · initial · eng-designer（承 §1 用户 2026-09-25 裁定「两条一起做」）。

**设计档落点** = `docs/core/design/SESSION.md` **§6.20**（新增：机制判据句 5 / 取值链四分支 / 边界情形 6 / 端差注销 1 / 验收回指）+ **§7 D-SE50–D-SE52** + §5 本批落点指针 + §6.10 D-1 / D-4 两处收正。
**一次性材料（本段承载）** = 条目表 / 明确不在本批 / 受影响文件表 / 用例表 / AC 对照 / 关键决策索引 / 上抛项。

### 2.1 本批条目（覆盖）

| # | 条目 | 来源 | 判据单源（设计档） |
|---|---|---|---|
| 1 | 核 marker 家族**端参数化**：`endMarkerPath(cwd, end = END)` / `readEndMarker(cwd, end = END)` / `writeEndMarker(cwd, slot, end = END)`；`resumeSlot` / `switchToSlot` / `deleteSlot` 加 `{ end = END }`；新增 `setSessionEnd(e)` / `sessionEnd()` | §1.2 E · 台账 #371 | §6.20 判据句 1 / 2 · D-SE50 |
| 2 | 扩展端**删 marker 副本**，改端壳一行绑定转口（调用点零改） | §1.3 ① / §1.5 ① | §6.20 判据句 3 |
| 3 | 新增**创建端字段 `createdBy`**（本端首物化该槽数据文件时记一次；两条写面） | §1.2 A · 台账 #372 | §6.20 判据句 4 · D-SE51 / D-SE52 |
| 4 | `createdBy` **读面**：`slotDigest` / `digestFromStore` + `listSlots` 条目 | §1.3 ② | §6.20 判据句 4 读面 |
| 5 | **老槽缺键 ⇒ 「未知」零猜测**（禁回填、禁以占用端冒充） | §1.4 | §6.20 判据句 4 写面 + 边界情形行 1 |
| 6 | **零回归**：端分离恢复 / marker 三态（缺失 / `slot: null` / 有值）/ 一次性继承 | §1.5 ② | §6.20 判据句 1 / 2（缺省 `END = "cli"` ⇒ CLI 侧全调用点零改） |

**字段语义（用户裁定，§1.4 为准）**：`createdBy` = **本端为该槽数据文件的首次物化者**；异会话现场轮转后重物化 ⇒ 记为本次物化端（轮转前的创建端随 `.bak` 现场保留——边界情形行 3）。

### 2.2 明确不在本批

- 端名校验 / 端名闭集机检（核不校验端名——§6.20「不做」+ 边界情形行 4）。
- marker 内容形态任何变更（`createdBy` **不进** marker——NF1，§1.4）。
- 桌面端设计档五档（`docs/desktop/**`）与桌面端需求档收正 = **父侧笔**（§1.4）。
- 核 ACP 显式钉槽面（不经 marker ⇒ 零随动）、提示词面（§1.4）。
- **观察项（另案）**：`thincoder-vscode/src/extension/session-io.mjs:210-224 deleteSlotAndUpdate` 与核 `session-slots-manifest.mjs` 的 `deleteSlot` 主体逻辑重复（非 marker 副本，且带端差解析缓存）——本批不动。
- 本批**无 UI / 交互决策**（核 + 端壳接口面）；桌面端会话行「来源端」标注的 UI 决策 `open` 归桌面端批（本批只给数据面）。

### 2.3 受影响文件（现况行数 → 预计增量）

| 文件 | 现况 | 改动 | 预计 |
|---|---|---|---|
| `thincoder-core/session-slots.mjs` | 299 | `setSessionEnd` / `sessionEnd` 两导出（模块级 `_end`，缺省 `END = "cli"` 保留）；marker 三式 + `resumeSlot` 加端参 | +18 → 317 |
| `thincoder-core/session-slots-manifest.mjs` | 322 | `listSlots` 逐字段挑选加 `createdBy`（缺键 ⇒ `""`） | +1 |
| `thincoder-core/session.mjs` | 245 | `slotDigest` 加 `createdBy`（有值才带）；`saveSession` 守卫后注入 `fields.createdBy`；`digestFromStore` 同 | +4 |
| `thincoder-core/session-lifecycle.mjs` | 319 | `switchToSlot` / `deleteSlot` 端参随动 + 其 marker 写点传参 | +2 |
| `thincoder-core/session-guard.mjs` | 60 | 解析分支顺带解析 `createdBy` → `agent._slotCreatedBy`（四分支） | +10 |
| `thincoder-core/session-slot-write.mjs` | 169 | `newSlotData` 加 `createdBy`；`saveSlotData` 补「入参无键且槽文件不在盘 ⇒ 本端名」 | +4 |
| `thincoder-core/token-ttl.mjs` | 286 | `persistEngTokens` 全新分支加 `createdBy`（既有文件分支读盘自带 ⇒ 零改） | +1 |
| `thincoder-vscode/src/extension/session-slots.mjs` | 137 | **删副本**（marker 三式 + `usableSlot` + `resumeSlot` 本体）；保留 `END` / `sessionsDir` 等；加 `setSessionEnd(END)` + 绑定转口四项 | −60 → ~77 |
| `thincoder-vscode/src/extension/session-io.mjs` | 247 | 调用点零改（转口同名同形）；档头注释随动（副本登记 → 转口登记） | ±0 |
| `thincoder-vscode/src/extension/panel-session-write.mjs` | 145 | `saveLines` 保持 `...existing` 往返；全新分支由核 `saveSlotData` 补戳 ⇒ 本档零改 | ±0 |
| `thincoder-vscode/src/extension/panel-session.mjs` | 313 | 零改（`readEndMarker` 同名同形） | 0 |
| `thincoder-cli/**` | — | **零改**（缺省端名 = `"cli"`；`thincoder-cli/src/tui/cmd-session.mjs:52` 等全调用点零动） | 0 |
| 桌面端（跨仓，本批不写其仓） | — | 契约 2 行：启动点 `setSessionEnd("desktop")` + 消费 `listSlots` 条目 `createdBy` | — |

**行限**：核 `session-slots.mjs` 299 → 317 超 300 咨询线（远低于 500 硬限）⇒ 不拆。**备选分档计划（仅当实施中可读性受损）**：端名缝（`END` + `setSessionEnd` + `sessionEnd`，~15 行）拆为核内新档 `session-end.mjs`，marker 家族与守卫从该档 import（该档零 import ⇒ 无环）。

### 2.4 用例表（新增用例；既有用例随动见 2.5）

| # | 类型 | 输入 | 期望输出 |
|---|---|---|---|
| T1 | 正常 | `setSessionEnd("vscode")` 后 `writeEndMarker(cwd, 3)` | 落 `{hash}.json.manifest.vscode`；`readEndMarker(cwd)` 读回 3；`.cli` 文件零创建 |
| T2 | 正常 | `setSessionEnd("vscode")` + `writeEndMarker(cwd, 4, "cli")` | 落 `.cli`（显式参 > 进程端名） |
| T3 | 零回归 | 无 `setSessionEnd` 调用（CLI 态）+ `resumeSlot(cwd)` | 写 / 读 `.cli`；三态语义逐条不变 |
| T4 | 正常 | 全新槽首保存（核 `saveSession` ∥ VSC `saveSessionToSlot`） | 槽文件含 `createdBy` = 该端名（`"cli"` ∥ `"vscode"`） |
| T5 | 边界 | 手造槽文件无 `createdBy` + 本端保存 | 写后**仍无**该键（禁回填）；`listSlots` 该条目 `createdBy === ""` |
| T6 | 边界 | 盘上键 = `"desktop"`、本端 = `"vscode"` 保存 | 写后键仍 `"desktop"`（透传，不自改） |
| T7 | 边界 | 盘上文件 `sessionStart` 不符（触发 `.bak` 轮转）后保存 | 写后 `createdBy` = 本端名（轮转 ⇒ 本端重物化） |
| T8 | 边界 | 认领后槽文件被删 ⇒ 首保存 | `createdBy` = 本端名；其余字段不变 |
| T9 | 错误 | `setSessionEnd("vsc")` + `writeEndMarker(cwd, 5)` | 落 `.vsc`（核不校验）；`readEndMarker(cwd, "vscode")` = null（该端退化「缺失」） |
| T10 | 三态不破 | marker 缺失 / `slot: null` / 有值 | 与现行为逐条一致（`slot: null` 绝不继承） |
| T11 | 端差注销 | 端壳 `resumeSlot` 遇槽文件不在盘（legacy 单文件） | 得核 legacy 兜底（原端壳副本无此项） |

### 2.5 测试面随动

| 测试文件 | 现况 | 随动 |
|---|---|---|
| `thincoder-core/test/session-slot-write.test.mjs` | 359 | **零改**（核导出缺省 `"cli"`——`readEndMarker(CWD)` / `writeEndMarker(CWD, slot)` / `resumeSlot(CWD)` 原形不变）+ 新增 T1–T11 |
| `thincoder-core/test/session-gc-stale.test.mjs` | — | 零改（`resumeSlot(cwd)` 缺省） |
| `thincoder-cli/test/tui-exit-cleanup.test.mjs` | 206 | 零改（核导出缺省） |
| `thincoder-cli/test/integration/session-resume.test.mjs` | — | 零改 |
| `thincoder-vscode/test/session-boot.test.mjs` | 491 | 零改（`readEndMarker` 经端壳转口同名同形） |
| `thincoder-vscode/test/session-exit-release.test.mjs` | 81 | 零改（直连核导出 ⇒ 缺省 `"cli"`，写临时目录） |
| `thincoder-vscode/test/session-release-shell.test.mjs` | — | 零改（端壳转口） |
| `thincoder-vscode/test/setup-reminders.test.mjs` | — | **核查项**：`:108` 用例标题含 `END=vscode`（env-state 模板面）——实施时确认本批不触该模板（预期零改） |

> 口径：`thincoder-core/test/session-*.test.mjs` 走核导出**缺省端名** ⇒ 无需传 `end`、无需 `setSessionEnd`；VSC 侧测试若直连核导出（非端壳），一律缺省即 `"cli"`（临时目录，无跨端后果）。`.thincoder/tmp/core-probe/**` = 打包副本（含同形测试与 `END = "cli"`），**非源** ⇒ 实施与测试一律以 `thincoder-core/**` 为准，副本零改。

### 2.6 AC 对照（§1.5 → 机检面）

| AC | 机检面 |
|---|---|
| ① 三端零 marker 副本 | 端壳 `session-slots.mjs` 只剩绑定转口（无 marker 实现符号）；核 `setSessionEnd` / `sessionEnd` 各一处定义 |
| ② 端分离恢复零回归 + 三态不破 | 三包 `npm test` 全绿（T3 / T10 在场） |
| ③ 老槽无字段 ⇒ 未知零猜测 | T5（写后无键）+ T6（透传）+ `listSlots` 条目 `createdBy === ""` |
| ④ 三包测试全绿 + `node scripts/doc-check.mjs` 零新增闸态失败 | 两处读数（设计轮读数见 eng-designer 报告） |

### 2.7 关键决策索引（单源 = §7）

D-SE50 端名 = 进程级单值 + marker 家族逐函数显式端参（显式 > 进程默认）· D-SE51 `createdBy` 落槽数据文件 + 透传 + 老槽「未知」· D-SE52 取值链 = 守卫解析缓存（盘为真值；无文件 / 轮转后 ⇒ 本端名）。否决备选与理由见 §7 同行。

### 2.8 上抛项

| # | 项 | 处置 |
|---|---|---|
| U1 | `docs/desktop/design/PROJECT.md:40`（KD-5 第三份副本）· `SHELL.md:22 / :54 / :60` 仍写端侧副本与「不改核」——本批后不成立 | 父侧收口（非本批写域）；`docs/batches/2026-09-25-desktop-design.md` §10 上抛 A / E 可随之结案 |
| U2 | 桌面端需求档 `docs/desktop/requirements/PROJECT.md:74`「来源端」标注的依赖已由本批落地 | 父侧收正（§1.4：需求档 = 父侧笔） |
| U3 | 跨仓契约（桌面端 2 处）：启动点 `setSessionEnd("desktop")` + 读 `listSlots` 条目 `createdBy`（缺键 ⇒ 不标注，禁以占用端冒充——与需求档 :74 同义） | 父侧转达桌面端设计批 |
| U4 | 端名闭集 = `"cli"` / `"vscode"` / `"desktop"`（与 `docs/desktop/design/PROJECT.md:40`、`SHELL.md:22` 既用值一致） | 已在 §6.20 声明；父侧知悉 |
| U5 | `docs/core/design/SESSION.md` §5 `:113` 登记的端壳未决项「无裸 v1 单文件兜底」= 本批**端差注销**（扩展端获得核兜底） | 已在 §6.20 登记；父侧可在收口时核销 |

### 2.9 设计评审修正轮 1 收正块（承 §3 轮次 1 发现 1–9 · 父侧裁定「采纳」）

**效力**：本段为一次性收正材料——§2.1–§2.8 原位表述与本段冲突处，以本段为准。设计档 `docs/core/design/SESSION.md` 已同批收正（发现 1–3、6 直改；发现 4、5、7、8、9 以本段落定）。发现 10（评审上下文缺文档地图 / 标准档——按先例判定的口径）父侧裁 **Not an issue**，不动。

**发现 1（🔴 端壳 marker 层存废单源）**：`docs/core/design/SESSION.md` §6.15 端壳面已收正——A9 原保留款「end marker 层」改**端差注销**（端壳 `session-slots.mjs` 副本 marker 三式 + `usableSlot` / `resumeSlot` 本体归核 ⇒ 零副本转口 `(cwd) => coreX(cwd, END)`；四维护落点 `session-io.mjs:88/:123/:175/:199` 经端壳绑定核同名件、**调用点零改**；裸 v1 单文件兜底差异随副本注销）；端差保留余 **一款**（token 台账三式；A9 三件删「end marker 端字面」）；§6.18 端壳镜像理由行随动（marker 端差 / `resumeSlot` 算法端差已注销）。

**发现 2（🟡 缺省语义双名）**：判据句 1 / 2 统一为「**缺省取值 = 进程端名 `sessionEnd()`**；`END` 仅模块级初值」——`setSessionEnd("vscode")` 后 `writeEndMarker(cwd, 3)` 落 `.vscode`（与 T1 一致）；§6.20 验收回指 ② · §7 `D-SE50` 同词收正。

**发现 3（🟡 写点枚举缺 `newSession`）**：判据句 2 随动行按 §6.10 D-4 维护点集对齐——**显式端参** = `resumeSlot` / `switchToSlot` / `deleteSlot`；**进程端名** = `newSession`（D-4「成功后」写点——零改；§2.3 `session-lifecycle.mjs` 增量仍 +2）/ `saveSession` / `persistEngTokens`；补兜底句「**未列写点一律走进程端名**」。VSC 进程内 `newSession` 落 `.vscode`（进程端名解析）。

**发现 4（🟡 T1–T12 逐条落档）**：

| 用例 | 落档测试档 | 说明 |
|---|---|---|
| T1–T10 · T12 | `thincoder-core/test/session-slot-write.test.mjs`（核档新增） | 核导出面：缺省 / 显式端参 / `createdBy` 全链 / 读面直断言（T12） |
| T11 | 同核档（直断言） | 核 `resumeSlot` 槽文件不在盘 + 裸 v1 `{hash}.json` 在盘 ⇒ data 非空（`session-slots.mjs:293-295`）——端壳腿经核同名件同一实现，不另立端壳用例 |
| T4 第二支（VSC `saveSessionToSlot`） | 同核档（T4 同断言覆盖） | `session-io.mjs:58` = `saveSlotData as saveSessionToSlot` 重命名转口 ⇒ 同一函数体 |

（合计新增 **12 例**（T1–T12），与下条行数预估同底；端壳侧零新增用例档 = 口径「端壳面由核同名件同一实现承接」。）

**发现 5（🟡 测试档行数标注）**：`thincoder-core/test/session-slot-write.test.mjs` 现况 **359** → 预计 **~470**（12 例 × ~9 行）。档位结论：现况即过 300 咨询线（远低于 500 硬限）⇒ 不拆；**越 500 硬限拆分预案** = 新档 `thincoder-core/test/session-end-param.test.mjs`（端名参数化 + `createdBy` 面整体外移，核档只留存量用例）。§2.5 该格「零改 + 新增 T1–T11」矛盾列以本段为准：**既有用例零改；新增 = T1–T12**。

**发现 6（🟡 端壳未决项指针）**：§6.20 端差注销行「登记于本档 §5 未决」已收正 → 指向 **§6.15 端壳保留款①**（该端壳项的原登记点）；U5 的「§5 `:113`」以本段为准（`:113` 属 §6.2 ACP 释放面，与端壳未决项无关——本批端差注销后该未决项由 §6.15 收口）。

**发现 7（🔵 备选分档计划触发条件补 import 向 / 环）**：触发条件 = ① 实施中可读性受损；**或** ② 端名取值点需在**模块实例化期 / 顶层**求值。满足 ② 或需环外节点形态 ⇒ **直接采用零 import 端名档**（`session-end.mjs`：端名缝 `END` + `setSessionEnd` + `sessionEnd` 外移——该档零 import = 环外节点）。
证据：新增边 = `session-guard.mjs`（现仅 import `node:` + `session-store.mjs` 的 `RECORD_DIR_SUFFIX`，`:12-15`）→ `session-slots.mjs`；环成立 = `session-slots.mjs:33` → `session.mjs` + `session.mjs:26` → `session-guard.mjs`。环安全前提 = `session-slots.mjs:29-32` 头注纪律「函数体内运行时使用」——**本设计默认形态即此（取值点全在函数体内）⇒ 按现状实现不触发 ②**。

**发现 8（🔵 AC ① 逐端验证面）**：

| 端 | 验证面 |
|---|---|
| CLI | 直连核导出：核内 `setSessionEnd` / `sessionEnd` 各一处定义；CLI 侧零 marker **实现**（`thincoder-cli/src/tui/cmd-session.mjs:52` 调核 `readEndMarker`——调用点在、实现符号零） |
| VSC | 端壳 `thincoder-vscode/src/extension/session-slots.mjs` 无 marker 实现符号（`readEndMarker` / `writeEndMarker` / `usableSlot` / `resumeSlot` 仅绑定转口）；既有 VSC 用例（`session-boot` / `session-exit-release` / `session-release-shell`，全绿）承接端壳腿回归 |
| desktop | **跨仓承接**：本批不写其仓（§2.3）——本批验证止于 U3 契约 2 行登记（启动点 `setSessionEnd("desktop")` + 读 `listSlots` 条目 `createdBy`），落地验证归桌面端设计 / 实施批 |

**发现 9（🔵 读面直断言）**：新增 **T12** —— 已物化槽（带 `createdBy`）⇒ `slotDigest(data)` / `digestFromStore(fields, counters)` 均带 `createdBy`；老槽（无该键）⇒ 不带（**有值才带**，同 `activeModel` 先例）；`listSlots` 条目缺键 ⇒ `""`（T5 已覆盖——`:105`）。

**计数对账（本收正块口径）**：用例 T1–T12（12 例）· 核档新增 12 例 · 端壳新增用例档 0 · 端差保留款 1（token 台账三式）· 端差注销款 1（end marker 层）。

### 2.10 设计评审修正轮 2 收正块（2026-09-25 · eng-designer）

承 §3 轮次 2 新增发现 11 / 12（均 🔵 · 不阻塞 · 父侧裁定「采纳」）。**效力**：本段为一次性收正材料——§2.1–§2.9 原位表述与本段冲突处，以本段为准；设计档 `docs/core/design/SESSION.md` 已同批收正（含变更记录一行）。

**发现 11（复核归属口径混号）落法** —— §6.15 两行按「原登记批 / 复核批」两角色分述（依据 = 行头原登记批 + misc-four 变更记录 `:789` + `b19fcb9b^` diff 实读：`:321` / `:322` 行块 = misc-four 落盘，SLOT-END-PARAM 未复核该项 ⇒ 不写「本轮复核」）：

- `SESSION.md:280` → 「端壳保留 = 端差一款（已裁保留 · A9——**原登记 = 2026-09-15 W11 批**；**台账 #185 复核 = 2026-09-25 misc-four 批**；**本轮复核 = 2026-09-25 SLOT-END-PARAM 批**）」——消「misc-four 台账号 ⊕ 本批批名」并列（W11 = 端差登记本体，见 `:287` / `:809`；misc-four = `:789`）；
- `SESSION.md:321` → 「状态：已裁保留（A9——**原登记 = 2026-09-19 init-block 批**；**台账 #185 复核 = 2026-09-25 misc-four 批**）」；`:322`（同项 ③ 尾）→ 「……+ **2026-09-25 misc-four 批确认**」——同行块内「本批」两义就地消除（依据 = §6.7 行头 2026-09-19 + `:789`）。

**发现 12（指针用词与目标现状词相左）落法** —— `SESSION.md:685`（§6.20 端差注销行）「端壳项登记 = §6.15 端壳保留款①」→「§6.15 **端壳款①（端差注销 · 零副本转口）**」——与 §6.15 `:281` 款名 / 状态词一致（该款不计入保留款数）。

**报告项（本轮未动 · 写域外）** —— 同型「2026-09-25 本批 / 本批确认」措辞残留 9 处（跨 4 档；2026-09-25 波内批落盘，同日 ≥7 批并行 ⇒ 措辞两义）：`SESSION.md:170`（§6.7 另一端差项）· `TUI.md:11 / :382 / :597 / :692` · `TUI-COMMANDS.md:7` · `TUI-SESSION-VIEW.md:7` · `CLI-DEBT.md:40 / :41`。本席写域 = `SESSION.md` + 本段 ⇒ 跨档同口径收正（建议 = 逐处指名落笔批）待父侧一并裁。

**闸** —— `node scripts/doc-check.mjs` 实跑：悬空 4 / 行宽 18 = 与基线一致（零新增；18 行宽命中全在他档，4 悬空含 `SESSION.md:850` 既有项——非本批引入）。

**未动范围（遵守）** —— `docs/desktop/**` · DOC-DISCIPLINE.md · 需求档 / 提示词 / 产品代码 · 批档既有段（§1 / §2.1–§2.9 / §3）；§6.20 判据句与 §6.15 机制语义零改。

## §3 设计评审（评审子代理）
**状态行**：评审完成（轮次 2 核验：轮 1 发现 1–10 全消解（🔴 已消）· 新增 🔵 ×2 · VERDICT: pass）



### 轮次 1（评审子代理）

**评审对象** = `docs/core/design/SESSION.md` §6.20（+ §6.10 D-1/D-4 · §7 D-SE50–D-SE52 · §5 落点指针）+ 批档 `docs/batches/2026-09-25-slot-end-param.md` §2。**校验基线**：判据句 1–5 / 取值链四分支 / 边界情形 6 行 / 读面三处 / 端差注销 / 验收回指均在位；`createdBy` 不入 marker（NF1）成立；三处行数标注抽检属实（`thincoder-core/session-slots.mjs` 299 · `thincoder-core/test/session-slot-write.test.mjs` 359 · `thincoder-vscode/src/extension/session-slots.mjs` 137）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 | 🔴 | 端壳 marker 层的存废在两处相反：§6.15:280–286 仍裁「端壳保留 = 端差两款（已裁保留 · A9）」——把 `readEndMarker`（`:69`）/`writeEndMarker`（`:82`）与「端壳无核 `resumeSlot` 的裸 v1 单文件兜底」（`:284`）列为**保留**项、并以「§6.10 D-4（VSC 镜像）」为证据（`:286`）；而 §6.20:651 判据句 3 明令端壳内不得再有 marker 读写实现、§6.20:683 把该兜底差异**注销**，且被引作证据的 D-4 行本题已收正为「VSC 落点」（`:205`）。§6.18:509 亦以「marker 端差与 resumeSlot 算法」为现存理由。批档 §1.6（:38–39）/§2.2（:72）只登记 `docs/desktop/**` 的落地后收口面，未覆盖本档 §6.15 / §6.18。 | 把 §6.10 D-1/D-4 同款收正（或 §1.6 落点登记）延伸到 §6.15:280–286（A9 ①）与 §6.18:509——使端壳 marker 层的存废在档内单源。 |
| 2 | 清晰度 | 🟡 | 端名缺省有两名：§6.20:648 把 `END` 定义为 `"cli"` 常量、§6.20:649/650 的缺省参数写 `end = END`，而批档 :81 说状态是**模块级 `_end`**（`END = "cli"` 保留）。按字面实现（缺省取冻结常量）则 `setSessionEnd("vscode")` 后 `writeEndMarker(cwd, 3)` 仍写 `.cli`——与批档 :101 的 T1、与判据句 2「显式参 > 进程端名」（:649）相反，恰是本批要消的跨端互写。 | 统一缺省名并写明解析规则（缺省取进程声明值 `sessionEnd()`，`END` 仅作初值），或把 `_end`/`END` 的读写关系写进判据句 1。 |
| 3 | 清晰度 | 🟡 | 判据句 2（§6.20:650）把「写 marker 的核入口随动」枚举为 `resumeSlot` / `switchToSlot` / `deleteSlot` + `saveSession` / `persistEngTokens`，**漏 `newSession`**——§6.10 D-4（`:204`）把「`newSession` 成功后」列为 CLI marker 维护点；批档 §2.3（`:84`）该档增量亦只覆盖 `switchToSlot` / `deleteSlot`。该写点在 VSC 进程内是否落 `.vscode` 取决于缺省解析（见 #2）。 | 按 §6.10 D-4 的 marker 维护点集对齐枚举，或补一句「未列写点一律走进程端名」。 |
| 4 | 清晰度 | 🟡 | 用例表（批档 :99–111 的 T1–T11）不给落档；§2.5:117 把 T1–T11 挂在 `thincoder-core/test/session-slot-write.test.mjs` 且该格写「零改」，而 T11（:111）主体是**端壳** `resumeSlot`、T4（:104）第二支是 VSC `saveSessionToSlot`；VSC 四档（:121–124）全标「零改」⇒ 端壳侧既无新增落档、也无「端壳面经核同名件同一实现验证」的口径声明。 | 逐条标落档，或明写端壳面由核同名件同一实现承接（用例落核档）。 |
| 5 | 受影响文件行数标注 | 🟡 | 将新增 T1–T11 的 `thincoder-core/test/session-slot-write.test.mjs`（现况 359——抽检属实）同格既写「零改」又写「+ 新增 T1–T11」：无预计增量标注、无 >300 档审视结论、无 500 硬限拆分预案（+11 用例后可能越线）。同批对 `session-slots.mjs` 299→317 已给「超 300 咨询线 ⇒ 不拆 + 备选分档计划」（批档 :81/:95），测试档缺同款处置。 | 补「现况 → 预计」两栏与档位结论（>300 审视 + 越 500 时的拆分预案）。 |
| 6 | 交叉引用 | 🟡 | §6.20:683「登记于本档 §5 未决」与批档 U5（:149）「§5 `:113`」在档内不成立：§5 = `:55–62` 仅落点指针行；该端壳未决项的实际登记点是 §6.15:284（「端壳无核 `resumeSlot` 的裸 v1 单文件兜底——差异登记见批次档 §5」），`:113` 属 §6.2 ACP 释放面。U5 是收口核销依据，指针悬空。 | 指针改指 §6.15:284（或 W11 批档 §5）。 |
| 7 | 可行性 | 🔵 | 取值链要求 `session-guard.mjs` 在「文件不在盘 / 轮转后」分支取进程端名（§6.20:659/:661）⇒ 新增 `session-guard → session-slots` 依赖边；现存环 `session-slots → session.mjs → session-guard`（`thincoder-core/session-slots.mjs:293` 注「环 import 见文件头」；抽读 `session-guard.mjs:12–15` / `session.mjs:26`）。备选分档计划（`session-end.mjs` 零 import，批档 :95）实为该环的正解，但设计只以「可读性受损」为触发条件（环的实际严重性未验——标 unverified）。 | 把 import 向 / 环列入备选分档计划的触发条件，或预先采用零 import 的端名档。 |
| 8 | 验收 | 🔵 | AC ①（批档 :132）「三端零 marker 副本」的机检面只覆盖核 + VSC 端壳；desktop 端不在本仓（§2.3 :93「本批不写其仓」）⇒ 该腿无验证落点（U3 :147 只登记契约）。 | AC ① 逐端列验证面，或注明 desktop 腿由跨仓契约承接。 |
| 9 | 验收 | 🔵 | 条目 4 列读面三处（`slotDigest` / `digestFromStore` / `listSlots`——§6.20:668、批档 :62），实测只有 `listSlots` 有条目断言（T5 :105）；`slotDigest` → manifest 摘要一路无直接断言（仅经 `listSlots` 间接覆盖）。 | T4 / T5 补一条 manifest 摘要（`slotDigest`）断言。 |
| 10 | 范围与依据 | 🔵 | 评审上下文未声明文档地图与项目标准档 ⇒「文档归属 / 标准符合性」按 AGENTS.md + 同档先例判定（本批「判据留设计档 + 一次性材料留批档 §2」与 §6.16–§6.19 先例一致）；需求档不在评审范围，需求覆盖按批档 §1.3–§1.5 口径核。行数标注为抽检（3 档，均符）；其余标注未验。 | 评审上下文补文档地图 / 标准档，或注明按先例判定的口径。 |

**计数**：🔴 ×1（#1）· 🟡 ×5（#2–#6）· 🔵 ×4（#7–#10），共 10 项。

VERDICT: changes-required

### 轮次 2（评审子代理）

**对象** = `docs/core/design/SESSION.md` §6.20（+ §6.10 D-1/D-4 · §6.15 · §6.18 · §7 D-SE50–D-SE52 · §5）+ 批档 `docs/batches/2026-09-25-slot-end-param.md` §2（含 §2.9 修正轮块）。**核验口径**：轮 1 发现 1–10 逐号以现文件实读复核（文档全覆盖：SESSION.md 1–861 行 + 批档全 219 行）；§2.9 内的码面坐标断言（如 `session-io.mjs:58`、`session-slots.mjs:33/:26`、`session-guard.mjs` import 面）属该段实读记录，本轮未独立复验（码文件不在本次评审范围）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/SESSION.md` | 🔴 | **Fixed** | §6.15 端壳面已单源收正：`:280` 已改「**端壳保留 = 端差一款（已裁保留 · A9——复核 = 台账 #185 · 2026-09-25 SLOT-END-PARAM 批）**：」；`:281` 「① **end marker 层 = 零副本转口**（**端差注销 · 不计入保留款数**——2026-09-25 SLOT-END-PARAM 批；判据单源 = §6.20 判据句 3）：」；`:284` 「端壳副本原无的裸 v1 单文件兜底差异随副本注销（端壳消费核 `resumeSlot` 后获得核兜底——§6.20 端差注销）；」；`:286` A9 三件①已去「end marker 端字面」、`:287` ③ 归 SLOT-END-PARAM 批确认；§6.18:510 「端壳镜像按端差必要性判定：marker 层 / `resumeSlot` 算法端差已注销（2026-09-25 SLOT-END-PARAM 批——§6.20 判据句 3）；本面谓词 = `getSessionId` 字符串比较（零探测零束）⇒ 无镜像必要。」——轮 1 的「两处相反处置」消解，档内只剩一处权威表述。 |
| 2 | 2 | `docs/core/design/SESSION.md` | 🟡 | **Fixed** | §6.20:649 「**缺省取值 = 进程端名 `sessionEnd()`**（`END` 仅模块级初值——CLI 进程零声明即得 `"cli"`）」；`:650` 三式缺省参数均改 `end = sessionEnd()`；`:683` 验收回指②与 §7 `D-SE50`（`:742`「`END` 仅模块级初值；**缺省取值 = 进程端名**」）同词收正 ⇒ 与 T1 / 判据句 2「显式参 > 进程端名」自洽，字面实现不再与 T1 相反。 |
| 3 | 3 | `docs/core/design/SESSION.md` | 🟡 | **Fixed** | §6.20:651-652 写点枚举按 §6.10 D-4 维护点集对齐：「进程端名 = `newSession`（D-4「成功后」写点——零改）/ `saveSession` / `persistEngTokens`；**未列写点一律走进程端名**（枚举遗漏不致跨端互写）。」 |
| 4 | 4 | `docs/batches/2026-09-25-slot-end-param.md` §2.9 | 🟡 | **Fixed** | 发现 4（`:161-169`）逐条落档表：T1–T10 · T12 落核档；T11 同核档（「端壳腿经核同名件同一实现，不另立端壳用例」）；T4 第二支同核档（`session-io.mjs:58` = `saveSlotData as saveSessionToSlot` 重命名转口 ⇒ 同一函数体）；口径句「端壳侧零新增用例档」在位（`:169`）。 |
| 5 | 5 | `docs/batches/2026-09-25-slot-end-param.md` §2.9 | 🟡 | **Fixed** | 发现 5（`:171`）：「现况 **359** → 预计 **~470**（12 例 × ~9 行）……**越 500 硬限拆分预案** = 新档 `thincoder-core/test/session-end-param.test.mjs`」——359+12×9=467 与 ~470 自洽；档位结论 + 越限预案均在；§2.5「零改 + 新增 T1–T11」矛盾列以效力条款收正。 |
| 6 | 6 | `docs/core/design/SESSION.md` / 批档 §2.9 | 🟡 | **Fixed** | §6.20:685 改指：「（端壳副本原无此项——端壳项登记 = §6.15 端壳保留款①）」；批档发现 6（`:173`）以效力条款收正 U5 的「§5 `:113`」（`:113` 属 §6.2 ACP 释放面）。 |
| 7 | 7 | `docs/batches/2026-09-25-slot-end-param.md` §2.9 | 🔵 | **Fixed** | 发现 7（`:175-176`）触发条件补 ②（端名取值点需模块实例化期 / 顶层求值）+ 环证据（新边 `session-guard.mjs` → `session-slots.mjs`；环 = `session-slots.mjs:33` → `session.mjs` + `session.mjs:26` → `session-guard.mjs`；安全前提 = `session-slots.mjs:29-32` 头注「函数体内运行时使用」，本设计默认形态即此）。 |
| 8 | 8 | `docs/batches/2026-09-25-slot-end-param.md` §2.9 | 🔵 | **Fixed** | 发现 8（`:178-184`）逐端验证面表：CLI（调用点在、实现符号零）/ VSC（端壳无 marker 实现符号 + 既有三档承接）/ desktop（跨仓承接，本批验证止于 U3 契约 2 行）。 |
| 9 | 9 | `docs/batches/2026-09-25-slot-end-param.md` §2.9 | 🔵 | **Fixed** | 发现 9（`:186`）新增 **T12**（「已物化槽（带 `createdBy`）⇒ `slotDigest(data)` / `digestFromStore(fields, counters)` 均带 `createdBy`；老槽（无该键）⇒ 不带」）；计数对账（`:188`）与发现 4/5 的 T1–T12 口径自洽。 |
| 10 | 10 | — | 🔵 | **Not an issue（父侧裁定）** | 理由成立：该条为评审上下文限制陈述（未声明文档地图 / 标准档、行数标注抽检口径），非设计缺陷；§2.9:153 记录「父侧裁 **Not an issue**，不动」。 |
| 11 | (new) | `docs/core/design/SESSION.md:280` | 🔵 | **New** | 复核归属口径混号（修正轮引入）：`:280`「**端壳保留 = 端差一款（已裁保留 · A9——复核 = 台账 #185 · 2026-09-25 SLOT-END-PARAM 批）**：」把 misc-four 批的台账号与本批批名并列（`:789`「…`docs/batches/2026-09-25-misc-four.md` §2 · 台账 #185）：端差登记项三处二态落定…」）；同节 `:321` 同型行仍作「**状态：已裁保留（A9——复核 = 台账 #185 · 2026-09-25 本批）**：① 结构性不对称 = 两侧各为其机制本体（…」⇒ 同节两行归属口径不一。建议以「原登记批 / 本轮复核批」两角色分述。 |
| 12 | (new) | `docs/core/design/SESSION.md:685` | 🔵 | **New** | 指针用词与目标现状词相左（修正轮引入）：`:685`「…端壳副本原无此项——端壳项登记 = §6.15 端壳保留款①）…」，而 §6.15 该项现标 `:281`「① **end marker 层 = 零副本转口**（**端差注销 · 不计入保留款数**——2026-09-25 SLOT-END-PARAM 批…）：」——指向位置正确，但「保留款①」与该款「不计入保留款数」状态词相左。建议改称「端壳款①」或直引行号。 |

**计数（轮次 2）**：轮 1 十项全消解——🔴 ×1 → 消；🟡 ×5 → 全消；🔵 ×4 → 处置完毕（#10 父侧裁 Not an issue）。**新增 🔵 ×2**（#11 复核归属混号 · #12 指针用词与目标状态词相左——均不阻塞）。本轮 **0 🔴 · 0 🟡**。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 设计批准（用户 · 2026-09-25 17:59）

**依据**：用户 2026-09-25 17:59「**批**」（四条清单第 2 条）。**此前置**：设计评审两轮（§3 轮次 1 changes-required → 轮次 2 **pass** · 🔴 已消）+ 收尾两条措辞已核。

**批准射程** = 本批设计（核 marker 端参数化 + 会话「创建端」字段）⇒ **派 eng-coder 实施**（designToken 见评审回执——**按凭据纪律不入档**）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-25）

**实施者** = eng-coder。**任务书** = 本档 §2（效力序 **§2.10 > §2.9 > §2.1–§2.8**），兼采 §1.11 父侧实施轮裁定（18:27 · AC② 措辞缺陷作废 · 表外新档认账）。
**设计单源** = `docs/core/design/SESSION.md` §6.20（:645–683）+ §7 D-SE50 / D-SE51 / D-SE52 + §6.15 端壳款①。

### 5.1 交付摘要

六条目全部落地（零简化、零近似）；三包测试全绿；`doc-check` 本席写域**零**新增闸态命中。端壳算法副本注销为四项绑定转口；端名声明源全仓 = 恰两处（核缺省 `"cli"` ∧ 端壳 `END = "vscode"`），端壳消费形态 = 传参（无自算）——与 §1.11 收正后的判据面逐条一致。

| 条目（§2.1） | 落点（交付态实读） |
|---|---|
| 1 核 marker 家族端参数化 + 端名缝 | `session-slots.mjs:99`（`END = "cli"`）· `:105`（`_end = END`）· `:107`（`setSessionEnd`）· `:109`（`sessionEnd`）· `:114`（`endMarkerPath(cwd, end = sessionEnd())`）· `:120`（`readEndMarker` 同形）· `:133`（`writeEndMarker` 同形）· `:225`（`deleteSlot(cwd, slot, { end = sessionEnd() })`）· `:300`（`resumeSlot` 同形）· `session-lifecycle.mjs:43`（核内 `resumeSlot` re-export 同签名）· `:289`（`switchToSlot` 同形）。全档零端名分支（值仅由缺省参数解析） |
| 2 端壳改绑定转口 | `thincoder-vscode/src/extension/session-slots.mjs`（137 → **77** 行）：`:46` `END = "vscode"` · `:51` `setSessionEnd(END)` · `:63/:68/:72/:76` 四项 `(cwd) => coreX(cwd, END)`；marker 三式 + `usableSlot` + `resumeSlot` 本体 + 探测消费全注销 |
| 3 `createdBy` 两条写面 | 核：`session.mjs:161`（`saveSession` 守卫**之后**注入 `fields.createdBy` ← `agent._slotCreatedBy`）· `session-slot-write.mjs:46`（`newSlotData`）· `:99`（`saveSlotData` 条件补戳）· `token-ttl.mjs:265`（`persistEngTokens` 全新分支）。取值链单源 = `session-guard.mjs:38`（不在盘）/ `:58`（轮转）/ `:71`（损坏）⇒ `sessionEnd()`；`:62`（解析通过）⇒ `disk?.createdBy ?? null`；`:42`（mtime 命中）⇒ 不动 |
| 4 读面 | `session.mjs:94`（`slotDigest` 有值才带）· `session-slots-manifest.mjs:51` + `session-slots.mjs:184`（`digestFromStore` 同判据）· `session-slots.mjs:217`（`listSlots` 缺键 ⇒ `""`） |
| 5 老槽禁回填 | 三面同判据：`:62` 的 `?? null` ∧ `session.mjs:161` 的 `!= null` 短路（null ⇒ 不落键）∧ `session-slot-write.mjs:99` 的 `undefined && !existsSync(p)` 双条件 |
| 6 零回归 | 缺省端名 = `sessionEnd()` ⇒ CLI / 桌面调用点零改（`thincoder-cli/**` 实读零 diff）；marker 三态语义未动（T10 直断言） |

**NF1 守持**：`createdBy` 只落槽数据文件 / manifest 条目，**恒不进 marker**（T2 / T10 直断言 marker 恒 `{slot, updatedAt}` 两键）。

### 5.2 用例与测试面

新增 `thincoder-core/test/session-end-param.test.mjs`（**245** 行）承载 **T1–T12**（§2.9 发现 4 全表 + 发现 9 的 T12）：标题逐条回指设计判据句 / 边界行 / 端差注销款。

### 5.3 决策透明表（本席权限内自决 · 逐条披露）

| # | 情形 | 决策与依据 |
|---|---|---|
| 1 | 表外新档 `test/session-end-param.test.mjs` | 12 例并入 `session-slot-write.test.mjs` 后 358 + 143 = **501 > 500 硬线** ⇒ 按 §2.9 发现 5 拆分预案拆档；已获 §1.11 父侧**认账** |
| 2 | 表外 `test/core-hygiene.test.mjs` 登记 `session-slots.mjs`（321） | 核卫生闸 `unregistered` 断言（`:174` ∧ `:177-180`）明令「>300 未登记即红」⇒ 登记是闸通过的必要数据面，非可选 |
| 3 | 表外 `thincoder-vscode/test/zero-sync-exec.test.mjs` 消费者名册 3 → 2 | 该用例 `consumers` 走 deepEqual 钉死域完整性（`:68-75` fail-closed）；端壳注销探测消费后不同步即红 ⇒ 随动必需（已留批注：域内该档仍在 §3.1 条① 端域，扫描面不变） |
| 4 | 实读行数 / 坐标与 §2.3 预估偏差 | `session-slots.mjs` **321**（预 317）· `session-slots-manifest.mjs` **325** · `session-lifecycle.mjs` **327** · `session.mjs` **250**；§2.9 T11 引的 `session-slots.mjs:293-295` 实为 **:317-318**（legacy 兜底）。均行内漂移，机制零偏；321 > 300 已有设计预裁「不拆」（远低于 500 硬限），已在 `core-hygiene.test.mjs:87-93` 登记拆分预案与触发条件 |
| 5 | §2.3 三处归属偏差（设计表所列档 ≠ 现状实现档） | `listSlots` 实落 `session-slots.mjs:195` · `slotDigest` / `digestFromStore` 实落 `session-slots-manifest.mjs:48` · `deleteSlot` 实落 `session-slots.mjs:225`（设计表分别列在 manifest 档 / `session.mjs` / `session-lifecycle.mjs`）。按现状就地改（未迁移档位——迁移属越批重构，本批不做） |
| 6 | 初版顶层路径常量缺陷 | 实现初版曾在模块顶层求值核路径常量（与「取值点全在函数体内」的环安全前提相左）⇒ 本席**自查自修**回函数体内；零真实损害（未进任何测试路径、无运行期异常）。交付态 = `session-slots.mjs:112` 头注纪律 + 取值点全在函数体内 |
| 7 | 顾问 🟡「`session.mjs:38–43` re-export 未含 `setSessionEnd` / `sessionEnd`」 | 定性 **非缺陷**、零改：该档 re-export 纪律 = 保**既有** import 面（`:12-13` / `:37` / `:44-53`），新符号无既有路径可保；先例 = 端壳 / VSC 侧一律从 `@thincoder/core/session-slots.mjs` 直导入 ⇒ U3 桌面端契约宜指名同一路径（报告观察项） |
| 8 | 🔵 遗留（不阻塞 · 报告披露） | `session-guard.mjs:42` 缓存绑单值 `_slotMtime`（多槽同进程复用需复核）· `END` 双语义（核常量名 vs 端壳常量名）· 批档行数 / 坐标漂移（见 #4）· AC① 端壳腿无自动断言（人读核验，见 5.5）· `MULTI-INSTANCE-COLLAB.md:90` 端域第二档零探测（设计档漂移观察） |

### 5.4 审计与代码评审轮次与终态

- **内部 explore 分歧审计**：1 轮（只读，对账设计 vs 实现）。发现 4 条（四类面：部分实现 / 静默简化 / 档漂移 / 表外改动）+ 2 条非四类；逐条处置闭环。
- **advisor 代码评审**（`type=code`）：1 轮；**VERDICT: pass**（🔴 0 · 🟡 1 · 🔵 5）。🟡 一条经复读先例定性非缺陷（见 5.3 #7，零代码变更）；🔵 五条落报告披露面（#8）。
- **终态**：**clean**（顾问 pass ∧ 其后零代码变更 ⇒ 评审轮 2「修复核验面」无对象）。
- **fix round**：审计发现 4 + 2 条均在实现轮内自修完成，未超 5 轮上限；末轮之后至交付**零写盘**（仅只读复读 + 重跑验证）。

### 5.5 AC 对照（机检面实读）

| AC（§2.6） | 交付态读数 |
|---|---|
| ① 三端零 marker 副本 | 核 `session-slots.mjs:99/105/107/109` = 端名单点定义（各恰一处）；端壳仅 `:46` 常量 + `:51` 声明 + `:63/:68/:72/:76` 传参转口（marker **实现符号零**）；全仓端名声明源 = 恰两处 ✓ |
| ② 端分离恢复零回归 + 三态不破 | 三包全绿（T3 / T10 在场）✓ |
| ③ 老槽无字段 ⇒ 未知零猜测 | T5（写后无键）· T6（透传不自改）· T12（读面「有值才带」）· `listSlots` 缺键 `""` ✓ |
| ④ 三包全绿 + `doc-check` 零新增闸态 | 见 5.6 表 ✓ |

### 5.6 验证读数（交付前重跑）

| 腿 | 命令 | 读数 |
|---|---|---|
| core | `cd thincoder-core && node test/run.mjs` | pass **691** / fail **0** |
| vsc | `cd thincoder-vscode && node test/run.mjs` | pass **1006** / fail **0** |
| cli | `cd thincoder-cli && node test/run.mjs` | pass **863** / fail **0** |
| doc-check | `cd thincoder && node scripts/doc-check.mjs --root .` | 候选 25232 · **悬空 8** · 注记豁免 43 · 拟新增 48 · 迁移期引文 215 · **行宽 18** |

**doc-check 归因**（负面过滤逐条核对）：8 悬空 = `MODEL-SPECS.md:323 / :1372 / :1465` + `SESSION.md:850`（既有项，设计轮即在场）+ `WEBVIEW.md:35 ×2 / :76 / :79`；18 行宽 = `CORE-UNIFICATION.md ×2` + `MODEL-BENCH.md ×6` + `MODEL-SPECS.md ×6` + `VSC-DEBT.md ×3` + `WEBVIEW.md:80`。**本席改动 12 档在闸态面零命中**（仅出现在「迁移期引文 / 拟新增——列报 · 不入闸」行）；`docs/**` 本席零触碰。
core 本轮为交付前第三次重跑，三次同值 691/0（早前 1 例疑 flaky 未复现，三次零红 ⇒ 判为环境噪声，非本批缺陷）。

### 5.7 本席文件清单（12 档 · 全在声明面内，表外三档见 5.3 #1–#3）

核：`session-slots.mjs` · `session-guard.mjs` · `session-slot-write.mjs` · `session-slots-manifest.mjs` · `session.mjs` · `session-lifecycle.mjs` · `token-ttl.mjs` · `test/core-hygiene.test.mjs`（表外，闸必需）· `test/session-end-param.test.mjs`（新增，表外已认账）。
端：`src/extension/session-slots.mjs`（重写）· `src/extension/session-io.mjs`（档头注释）· `test/zero-sync-exec.test.mjs`（名册 3 → 2，表外，闸必需）。

**未动范围（遵守）**：`docs/**`（含本档任务书段与设计档）· `thincoder-cli/**` · `thincoder-desktop/**` · 提示词面 · 桌面端跨仓（U3 契约只登记不落地）· `.thincoder/tmp/**` 打包副本（非源）。
**out-of-scope 观察（不动作）**：桌面端跨仓隐患（U3 契约未落地前，桌面端缺省端名仍解析为 `"cli"`——落地验证归桌面端批）· `.thincoder/tmp/core-probe/**` 副本与源树同形漂移面。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧实读 · 2026-09-25 18:47）

| 面 | 核验 | 结果 |
|---|---|---|
| 核 marker 端参化 | 实读 `thincoder-core/session-slots.mjs` | ✓ `:99 END = "cli"`（模块级初值）· `:105 _end = END` · `:107 setSessionEnd` · `:109 sessionEnd` · 三式缺省 `end = sessionEnd()`；**核内零端名分支** |
| 端壳零副本 | **全档实读**（77 行） | ✓ `:46 END = "vscode"` + `:51 setSessionEnd(END)` + `:63/:68/:72/:76` 四项 `(cwd) => coreX(cwd, END)`；原 marker 三式 / `usableSlot` / `resumeSlot` 本体 / 探测消费**全注销** ⇒ **零算法副本**（判据面 = §1.11 收正后） |
| AC① 端名源恰两处 | 全仓扫描 | ✓ 仅核 `session-slots.mjs:99` ∧ 端壳 `:46`（其余命中 = 测试注释/断言/xfail 面） |
| `createdBy` 两条写面 | 实读 | ✓ `session-slot-write.mjs:46`（`newSlotData`）· `:99`（`saveSlotData` 条件补戳）· `session.mjs:161`（守卫之后注入）· `token-ttl.mjs:265`；读面 = `session-slots.mjs:184/:217` · `session-slots-manifest.mjs:51` · `session.mjs:94` |
| 老槽禁回填（三面同判据） | 实读 + 测试 | ✓ `session-guard.mjs:62`（`?? null`）· `session.mjs:161`（`!= null` 短路）· `session-slot-write.mjs:99`（`undefined && !existsSync`）；T5–T8 断言在位 |
| NF1（`createdBy` 恒不进 marker） | 测试实读 | ✓ `test/session-end-param.test.mjs:113/:203-206`（marker 恒两键）— 含 `"desktop"` 端名透传两态 |
| 三包测试 | 子代理实跑（父侧未复跑——「交付已内审」纪律） | core **691** / vsc **1006** / cli **863** · fail 0（三次同值） |
| 机检 | 子代理实跑 | 悬空 8 / 行宽 18（他档在途所致 · 本席 12 档零命中） |
| 表外 3 档 | 父侧裁定 | ✓ 拆分档（§1.11 裁认）· `core-hygiene.test.mjs` 登记（闸必需）· `zero-sync-exec.test.mjs` 名册 3→2（闸必需） |

### 6.2 §2.3 预估 vs 实读（**以本节为准**）

| 档 | §2.3 预估 | 实读 | 处置 |
|---|---|---|---|
| `session-slots.mjs` | 317 | **321** | >300 已预裁「不拆」（`core-hygiene.test.mjs:87-93` 登记拆分预案 + 触发条件）✓ |
| `session-slots-manifest.mjs` | — | 325 | 同族既有登记面 |
| `session-lifecycle.mjs` | — | 327 | 同族既有登记面 |
| `session.mjs` | — | 250 | ✓ |

**坐标收正**：§2.9 T11 引 `session-slots.mjs:293-295` ⇒ 实为 **`:317-318`**（legacy 兜底），以本节为准。
**三处归属偏差（实现按现状就地 · 未迁移档位）**：`listSlots` → `session-slots.mjs:195` · `slotDigest`/`digestFromStore` → `session-slots-manifest.mjs:48` · `deleteSlot` → `session-slots.mjs:225`。

### 6.3 §2.8 父侧项逐条

- **U1** → 并入桌面端实施后修正轮（`docs/desktop/**` 笔 = eng-designer · 已排定）✓
- **U2** → 父侧当轮落：`docs/desktop/requirements/PROJECT.md:74`「来源端」依赖解除（核侧支持已落地；**实现**随桌面端视图批）
- **U3** → 随 U1 同轮转达设计面（契约 2 行：启动点 `setSessionEnd("desktop")` + 读 `listSlots[].createdBy`；缺键不标注 · 禁以占用端冒充）
- **U4** → 知悉 ✓（端名闭集 = `"cli"` / `"vscode"` / `"desktop"`）
- **U5** → **核销**：`SESSION.md` §5 `:113` 的端壳未决项 = 本批**端差注销**（登记面 = §6.15 端壳款①；§2.9 发现 6 已收正指针）✓

### 6.4 核销同步清单（D7）

角色表 ✓（§1 父侧 · §2 eng-designer · §3 评审子代理 · §5 eng-coder · §6 父侧）· 状态行 ✓（§5 = 实施完成）· 计数 / 指针 ✓（§1.9 + §1.11 收正后权威形；§6.2 为实读权威值）· 变更记录 ✓（设计档两档随轮）· **待办勾销 ✓：台账 #371 / #372 → 已核销**；新债入账 **#385 / #386** · 台账可见面 ✓ · 前批遗留核对 ✓（前情 = 无；桌面端 A/E 上抛的处置 = U1/U3）。

### 6.5 验收

§2.1 **六条目 ✅ 全落**（逐条见 §5 交付表）· **AC①–④** 全部有实读证据（① 端名源恰两处 · ② 零算法副本〔§1.11 收正后判据面〕· ③ 三包全绿 · ④ 机检零新增）· **§6.20 判据句 1–5** 逐条成立（值仅由缺省参数解析 / NF1 两键 / 三态语义单源 / 禁回填 / `createdBy` 不进 marker）。
