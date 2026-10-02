# 2026-09-30 · VSC 贴图件清理
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #735（源 = pairfix 设计轮 §2 F-1 上抛）∥ 用户 2026-09-30 18:24「挂账那些也都处理掉」。事实：`docs/core/design/PROVIDER.md:271` ∥ `thincoder-core/attachments.mjs:16-17` 声称的「VSC offloadToolResult mtime 扫除兜底（paste-* 在扫除面内）」与实码不符——offload 已迁 `~/.thincoder/tool-results`，VSC 源码零扫除调用 ⇒ **VSC 贴图件无自动清理（累积）**；parity-b4 §2.3「保留」裁定之「无落盘累积」结论对 VSC 不成立。**父侧裁 = 接线**（VSC 侧补清理——对位面：桌面族 `TOOL-OUTPUT-LIMITS.md:44` 3 天窗 ∥ 随族清理形；实现形待设计）。。
> 台账 = #735（VSC · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 #735（源 = pairfix 设计轮 §2 F-1 上抛）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」。

**事实**：`docs/core/design/PROVIDER.md:271` ∥ `thincoder-core/attachments.mjs:16-17` 声称的「VSC offloadToolResult mtime 扫除兜底（paste-* 在扫除面内）」与实码不符——offload 已迁 `~/.thincoder/tool-results`，VSC 源码零扫除调用 ⇒ **VSC 贴图件无自动清理（累积）**；parity-b4 §2.3「保留」裁定之「无落盘累积」结论对 VSC 不成立。

**父侧裁 = 接线**（VSC 侧补贴图件清理；形态待设计：mtime 窗 ∥ 会话边界 ∥ 随族——对位面 = `TOOL-OUTPUT-LIMITS.md:44`〔3 天窗 · 写时自清理〕）。需求侧锚 = 设计轮定位（缺口上抛）；doc-code 收正（声称 vs 实）= 随设计处置。

**下一手**：设计轮 → 评审 → 批准 → 实施（VSC 码面）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（首设轮 · 2026-09-30——现状实读 ∥ 写时扫除定形 ∥ 落点表 ∥ L1–L4 + 真机 R1–R3 ∥ 收正终形（写者序已裁） ∥ 需求锚建议（§2.2–2.9））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 ∥ 不覆盖）

> 需求面 = 台账 #735（tech_todo）+ §1 父侧裁定「接线」——非需求档五要素条目；本批按派单必答五问（事实 ∥ 机制 ∥ 收正 ∥ 锚 ∥ 验收）设计，逐项落于 §2.2–§2.5。
> **设计档落点** = `docs/core/design/PROVIDER.md` §6.18（`:271` 句收正 + 变更记录行）∥ 产品码注释 `thincoder-core/attachments.mjs:15-17`（短句 + 机制单源指针）——终形文本见 §2.6。

**覆盖**：

1. **VSC 贴图件清理接线**——VSC 侧补「贴图落盘写时 mtime 扫除」（3 天窗 · 核 `cleanupOldToolResults` 单源复用），落点 = 薄壳 `image-handler.mjs`（VSC 全部贴图落盘唯一咽喉）。消灭 `PROVIDER.md:271` ∥ `attachments.mjs:15-17` 声称 vs 实的漂移；parity-b4 §2.3 ⑤「无落盘累积」结论对 VSC 恢复成立。
2. **doc-code 收正（两处 · 随本批落——实施后收正轮）**——终形文本见 §2.6。
3. **需求侧锚定位（定位 + 建议；笔权 = 父侧）**——见 §2.7。

**不覆盖**（逐项 + 由）：

- CLI 侧贴图落盘 ∥ 清理（#733 · pairfix 批在飞——本批零触）；
- 桌面侧（回合尾 `cleanupTurn` = 在册契约零改）；
- `<cwd>/.thincoder/tmp` 存量清扫（不追——族形惰性：超龄件随下次贴图扫除自然回收）；
- `TOOL-OUTPUT-LIMITS.md:111` 退役坐标复锚 ∥ API-CONTRACT 行号漂移 ∥ MODEL-SPECS 疑似陈旧坐标（机检轮——见 §2.9 U3）；
- 各批档 ∥ `_archive` ∥ 记录面（冻结零触）。

### 2.2 现状实读（必答①——VSC 贴图落盘现状 · 两侧）

> 两侧 = ① webview ∕ 采集侧（dataURL 生产者 · 零 fs）② extension 侧（落盘 ∥ 生命周期 ∥ 清理归属）。坐标 = as-of 2026-09-30 设计轮实读。

**① webview 侧（零 fs）**：粘贴 ∕ 拖拽 ∕ 附加 → 核 composer 采集 dataURL；提交入口 = `thincoder-vscode/webview/send.js:10-12`（提交逻辑已搬核 `composer/panel.mjs`——两入口同门）；协议形 = `userMessage / queuedUserMessage { … images? }`（dataURL 串数组——`docs/vsc/design/WEBVIEW-PROTOCOL.md:28`）。

**② extension 侧（落盘）**：`routeUserTurn`（`panel-messages.mjs:128`）三处调用点——`:154`（susp 在飞）· `:159`（忙队列入槽）· `:180`（idle ∕ susp 直发）——均经薄壳 `image-handler.mjs:20-22` `savePastedImages`（fs 注入缝 `:13` ∕ `:21`）→ 核 `attachments.mjs:65` 落 `<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>`（目录懒建 `:75` · 命名 `:92`；空表早退 `:67` ∥ 无效 cwd 弃项 `:71-74`）。

**生命周期**：路径交 `_chat` → 尾附 `[Attached images: …]` 指引（核 `agent/setup-reminders.mjs:248` `appendImagePointer`；VSC 施用点 `src/agent/setup.mjs:286`）→ 模型 `read_image` 读取；忙队 ∥ 挂起队条目持路径跨回合等待送达；非视觉降级窗读图亦用同路径（`image-handler.mjs:35-51`）。**清理面 = 无**：`thincoder-vscode/src` 全 grep 实读（`cleanup|扫除|unlink|rmSync`）——命中皆他面（`panel-index.mjs:239` 索引迁移 ∥ `session-io.mjs:214-215` 删槽）——`<cwd>/.thincoder/tmp` 零扫除调用。

**声称 vs 实（双证）**：offload 现体 = 核 `agent/helpers.mjs:156`（默认目录 `~/.thincoder/tool-results`）——① 目录不同（贴图件在 `<cwd>/.thincoder/tmp`）② 触发面不同（offload 仅 >64K 工具结果写时触发，且只扫自身目录——`:134` 传参）⇒ `PROVIDER.md:271` ∥ `attachments.mjs:15-17` 的「paste-* 在其扫除面内」不成立。

**谁该清理**：端侧时序面（核零回合生命周期——parity-b4 §2.3 ⑤ 在册句「回收面 = 端侧时序面」）。VSC 侧唯一写该目录的产品径 = 上述薄壳 ⇒ **咽喉点 = `image-handler.mjs` `savePastedImages`**（三调用点唯一汇合处）。

### 2.3 机制设计（必答②）

**定形 = 写时 mtime 扫除 · 3 天窗 · 族形复用**（对位面 = `TOOL-OUTPUT-LIMITS.md:44` ∥ 核 offload 写时自清理；与 CLI 接线〔pairfix §2.3 案②-2，`cleanupOldToolResults` 同函数〕同形同窗）。

| 面 | 定形 | 判由 |
|---|---|---|
| **触发点** | VSC 贴图**落盘写时**——薄壳入口处、核落盘调用**之前**发起（三调用点唯一咽喉，零调用点改动） | 累积产生点即触发点（VSC 唯一写该目录的产品径）；零回合生命周期知识 ⇒ 无漏径（idle ∥ 忙队 ∥ 挂起 ∥ 降级窗 ∥ 中止全不依赖） |
| **窗** | **3 天**——核 `TMP_RETENTION_MS`（`helpers.mjs:80`）单源，不新造常量；语义 = `now − mtime > 窗` 才删（older-than 边界，等值保留） | 族单源；VSC 无「读后即删」语义 ⇒ 跨回合重读窗口保留 |
| **归属** | VSC 端侧接线（核件零改——复用核 `cleanupOldToolResults` `helpers.mjs:134`） | 「接线」= 补端侧时序面；核函数已是族单源（offload ∥ CLI ∥ 本批 VSC 同用） |
| **面域** | `<cwd>/.thincoder/tmp` **目录内文件**（子目录不触 `helpers.mjs:132`；不限于 `paste-*` 前缀） | 族形（原 VSC offload 扫除面即整目录——`_archive/TOOL-OUTPUT-LIMITS-TUNING.md` §2.4）；与 CLI 接线同形；收窄为 `paste-*` 模式 = 造第二判据（另发明） |
| **形态** | **fire-and-forget**（同步薄壳内发起、不 await；失败全静默 = 核函数逐层 catch + 外层 `.catch(() => {})` 防御） | `routeUserTurn` 起跑不变量：busy 锁「任何 await 之前」纪律（`panel-chat.mjs:124` 注释 ∥ C' 忙锁不变量）——await 会在空闲径开 await 窗 ⇒ 二次提交穿越忙门（idle 径）∥ 两载体投递乱序（susp 径）；扫除只删超龄件 ⇒ 与本次落盘零干扰（新件 mtime 恒新鲜） |
| **闸** | 仅当 **非空 `dataUrls` ∧ 有效 `cwd`**（非空串）才发起 | 空表 = 零 fs 触（沿核件「空表先于缝校验早退」契约——`attachments.mjs:67`）；无效 cwd = 核件弃项径（`:71-74`）——不扫（防相对路径误扫他处） |
| **失败** | 扫除任何失败 ⇒ 静默继续落盘（出口零变；贴图面不因清理受影响） | 族纪律「cleanup must not affect offload」（`helpers.mjs:132` 同向） |

**候选对比（含被否）**：

- **A（取）= 写时 mtime 扫除（3 天窗）**——判由：族形 ∥ 触发=累积点 ∥ 零生命周期依赖 ∥ 修复「声称 vs 实」的**最小忠实形**（原声称即「mtime 扫除兜底」）。
- **B（否）= 逐回合显式清（桌面 `cleanupTurn` 形——`thincoder-desktop/src/main/attachments.mjs:101`）**：① VSC 落盘点 ×3 + 送达路 ×4（idle ∥ 忙队 ∥ 挂起队 ∥ 降级窗）⇒ 清理须挂全结算点（桌面自身挂 5 处：`turn-face.mjs:192` ∥ `turn-input.mjs:82/:89` ∥ `turn-chain.mjs:87` ∥ `suspension-drive.mjs:124/:162`）——漏径即残留；② **跨回合重读**为 VSC 在册语义（历史指针持路径可再读 ∥ 降级描述注文持路径）——逐回合清 = 把后续读变死路径（与 #733 实伤同族）；③ 桌面形 = 桌面契约（`IPC.md` §2 项 6），非 VSC 在册形。
- **C（否）= 会话 ∕ 激活边界清**：非族形（另造触发面）；触发与累积面不对应；与「接线（禁另发明）」判据相抵。**尾窗注**：写时形下「此后不再贴图 ⇒ 末尾残留不再收敛」——与核 offload 同尾窗（族固有，不补额外触发）。
- **形态对比（awaited vs fire-and-forget）**：见上表「形态」行——取 fire-and-forget（核 offload 能 await 因其写面本身异步；VSC 写面 = 同步缝，异步发起为自然对位 ∥ 免开 await 窗）。
- **面域对比（整目录 vs `paste-*` only）**：取整目录（族形 ∥ 与 CLI 同形）；`paste-*` only = 第二判据面（否）。

**注**：扫除为异步完成——「超龄件已清」的断言以有界轮询锁读数（§2.5 L1）。

### 2.4 落点表 + 受影响文件与测试面

**落点表（可派）**：

| 序 | 落点 file:line | 动作 | Δ |
|---|---|---|---|
| ①-1 | `thincoder-vscode/src/extension/image-handler.mjs:13-17`（import 区） | `+ { join }`（`node:path`）· `+ { cleanupOldToolResults }`（`@thincoder/core/agent/helpers.mjs`） | +2 行 |
| ①-2 | `thincoder-vscode/src/extension/image-handler.mjs:20-22`（薄壳） | 加写时扫除（闸 = 非空表 ∧ 有效 cwd；核落盘前发起；fire-and-forget + `.catch` 防御） | +4~5 行 |
| ①-3 | `docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs`（新档 · 批内件） | L1–L4 落地件（§2.5） | 新增 ≈90 行 |
| ②-1 | `docs/core/design/PROVIDER.md:271` | 句收正（终形 = §2.6-①） | 替换 1 行 |
| ②-2 | `thincoder-core/attachments.mjs:15-17` | 头注 ⑤ 句收正（终形 = §2.6-②） | ±1 行 |
| ②-3 | `docs/core/design/PROVIDER.md` 文末变更记录 | +1 行（草稿 = §2.6-③） | +1 行 |

**注**：①-1 ∕ ①-2 行号 = as-of 本设计轮（档 51 行）；实施轮以盘面为准。② 组 = 实施后收正轮落笔（防「文档先行于码」）

**受影响文件表（现行行数 + Δ；计法 = `split("\n")−1`）**：

| 档 | 现行 | Δ | 档位 ∕ 理由 |
|---|---|---|---|
| `thincoder-vscode/src/extension/image-handler.mjs` | 51 | ≈+7（⇒ ≈58） | ≤300 软线内——零拆分 |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 354 | **0（有意零改）** | >300 咨询线——本批**零触**（fire-and-forget 形免改三调用点）；未来该档实质改动时按在册结构拆分计划处理（本批不触发） |
| `thincoder-core/attachments.mjs` | 125 | 0 净（注释句替换） | 注释行替换——零行为改 |
| `docs/core/design/PROVIDER.md` | 492 | ≈+2（⇒ ≈494） | 文档档（N-P3 判据域外——限源 ∕ 测试档）；核 500 线内 |
| `docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs` | 新档 | ≈90 | 批内件（不进仓套件） |

**测试面**：批内件 = 唯一新增（§2.5）；VSC 集成档 = 空清单（2026-09-28 全清重置）⇒ **无集成场景受影响**（收口行如实报）；`thincoder-vscode/test/files.mjs` 单源清单**不登记**（批内件惯例）。

**跨档零触证明面**：核 `helpers.mjs` ∥ `attachments.mjs`（除注释）∥ 桌面 ∥ CLI 全零改——「他端零触」；三调用点零改（对照 ①-2 单点接线）。

### 2.5 验收（必答⑤：机检腿 + 真机项）

**机检腿**（批内件 = `docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs`）：

- 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs`——实施舱自跑 ∥ 复跑同令；若遇写门（#545 先例）⇒ 暂存 `.thincoder/tmp/` 同名件、父侧收位。
- **L1 写时扫除（正常 + 首贴 + 接线证明——生产入口直驱）**：建临时 cwd——① 首贴（tmp 目录不存在）⇒ 落盘成 ∧ 扫除静默（readdir 失败吞）；② 置超龄件（mtime 回拨 3 天 + 1h）+ 未超龄件 + 子目录内超龄件 ⇒ 调薄壳 `savePastedImages([png], cwd)` ⇒ 有界轮询（≤2s）内：超龄件**消** ∥ 未超龄件**在** ∥ 子目录件**在** ∥ 本次新件**在** ∧ 返 `paths` 含新件（fire-and-forget ⇒ 轮询锁读数）。
- **L2 边界窗（严格 older-than）**：mtime = now−3d+1h 留 ∥ now−3d−1h 删。
- **L3 闸**：`savePastedImages([], cwd)` ⇒ 短静置后超龄哨兵仍在（零扫除）∧ 零新件；`savePastedImages([png], "")` ⇒ `{paths: [], dropped: 1}` ∧ 零抛 ∧ 哨兵不受影响。
- **L4 面域与零回归**：非贴图超龄件（`tool-x.txt`）同被回收（族形锁）；核返形 `{paths, dropped}` ∥ 命名 `paste-<id>-<i>.<ext>` ∥ 超阈弃（>15MB）语义零变（照核件基线）。

**用例表（normal ∥ boundary ∥ error）**：

| 类 | 输入 | 期望输出 | 腿 |
|---|---|---|---|
| 正常 | 有效 cwd · 1×dataURL · tmp 内超龄 + 新鲜件 | 新件落盘（`paths` 含之）· 超龄件 ≤2s 内回收 · 新鲜件保留 | L1 |
| 正常（首贴） | tmp 目录不存在 | 扫除静默 · 落盘建目录成 | L1① |
| 边界 | mtime = now−3d±1h | 超窗删 ∥ 未超窗留 | L2 |
| 边界 | `[]` 空表 ∥ `cwd=""` | 零扫除（超龄哨兵留存）· 零抛 · 弃项计数如实 | L3 |
| 错误 | 扫除失败（目录不可读 ∥ 竞态） | 静默继续——落盘出口零变（核函数逐层 catch） | L1① 面 + 码面实读 |

**真机项（父侧义务）**：

- R1 贴图正常链回归：真实 VSC 会话贴图 ⇒ `<cwd>/.thincoder/tmp/paste-*` 在场 ∧ 模型 `read_image` 可读。
- R2 扫除实证：`paste-*` 件 mtime 回拨 ≥4 天 ⇒ 再贴一张 ⇒ 老件被清 ∥ 新件在场。
- R3 族形目视：目录内非贴图超龄件同被回收；子目录不在动。

**验收对照（必答①–⑤ → 面）**：

| 必答 | 落点 | 验收 |
|---|---|---|
| ① 现状实读 | §2.2 | 证据行（file:line——设计轮实读） |
| ② 机制设计 | §2.3 ∕ §2.4 | L1–L4 + R1–R3 |
| ③ doc-code 收正 | §2.6 | 收正落位读回核对（逐字以 §2.6 终形为准；不建 prose-anchor 测试） |
| ④ 需求锚 | §2.7 | 父侧笔（建议 + 草案已给） |
| ⑤ 验收 | 本节 | 机检 L1–L4 ∥ 真机 R1–R3 |

### 2.6 doc-code 收正（必答③——处置：随本批落 · 落实时点 = 实施后收正轮）

**处置**：两处**随本批收正**——文本本设计定稿；落笔与实施同批、**实施后**落（防「文档先行于码」失实窗）。**本句收正时点 = 本批接线落地后。**

**写者序裁决（父侧 2026-09-30 · 已入设计）**：判据 = **写时点现状**（禁预写未落机制）——① pairfix 实施时按其彼时真值收正（VSC 子句未接线 ⇒ 如实写「未接（留存）」）；② 本批随动轮把**整句**收成终形（以本节定稿为准）；同日互序按写时点现状定（本批先行 ⇒ pairfix 可直接写终形，免二次触）。

**① `docs/core/design/PROVIDER.md:271`**——替换「文件随 offload 写时自清理」句（该句双证失实——offload 目录 ∥ 触发面皆不同；证据 = §2.2）。终形（定稿）：

> 贴图临时件清理 = 端侧时序面（核件零回收）：桌面 = 回合尾 `cleanupTurn` ∥ CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗——核 `agent/helpers.mjs` `cleanupOldToolResults` 单源）。

**② `thincoder-core/attachments.mjs:15-17`**——⑤ 清理面句替换。终形（短句 + 机制单源指针——防「同句双全文」漂移面）：

> ⑤ 清理面 = **端侧时序面**（本档不回收——半失败写入的孤儿件无回收面）：桌面 = 逐回合显式清（`cleanupTurn`）· CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗）；机制单源 = `docs/core/design/PROVIDER.md` §6.18。

**③ 变更记录**（`docs/core/design/PROVIDER.md` 文末）+1 行，草稿：

> - 2026-09-30（**VSC 贴图件清理批**）：§6.18 「文件随 offload 写时自清理」句收正——临时件清理 = 端侧时序面（桌面 = 回合尾 `cleanupTurn` ∥ CLI ∥ VSC = 贴图落盘写时 mtime 扫除〔3 天窗〕）；VSC 侧接线落地（`thincoder-vscode/src/extension/image-handler.mjs` 写时扫除）。

### 2.7 需求侧锚（必答④——定位 + 建议；笔权 = 父侧）

- **core 需求档（主锚）**：`docs/core/requirements/PROVIDER.md` §4.5「VSC 端图片输入与贴图降级条目」（`:120-133`——F-IDG-1–3 ∥ N-IDG-1–2；来源注 `:122` 载「VSC 端面条目——终收批并入」）。**建议**：新增一条 **N-IDG-3**（文本草案）：

> N-IDG-3 VSC 贴图临时件有界：贴图落盘写时对 `<cwd>/.thincoder/tmp` 执行 mtime 扫除（窗 = 3 天；核 `cleanupOldToolResults` 单源，与 CLI 同形）。判定句：置超龄件（mtime > 3 天）后经一次贴图落盘 ⇒ 超龄件被回收 ∧ 未超龄件保留 ∧ 落盘出口 `{paths, dropped}` 零变。

- **VSC 需求档**：`docs/vsc/requirements/PROJECT.md` 实读 = 零贴图 ∕ 附件承载面（§2 决策表 ∥ §3 待设计节无命中）。**建议**：不另立（D2 单源——贴图族需求在终收批已并 core §4.5；如需 VSC 档可见指针，父侧可裁登记行）。
- 备用锚（未取）：`docs/desktop/design/IPC.md` §2 附件注 = 桌面契约面（桌面零改，不作锚）。

### 2.8 关键决策（含被否） + 边界

- **D-1** 机制形 = 写时 mtime 扫除（3 天窗）——否：逐回合清 ∥ 会话边界清（§2.3 候选 B ∕ C）。
- **D-2** 形态 = fire-and-forget——否：awaited（起跑不变量 ∥ 投递序；§2.3）。
- **D-3** 面域 = 整目录文件——否：`paste-*` only（族形 ∥ 与 CLI 同形）。
- **D-4** 实现面 = VSC 薄壳复用核函数（核零改）——否：核件内嵌（触他端行为面）∥ VSC 自实现第二份扫除（双实现漂移面）。
- **D-5** 收正时点 = 实施后收正轮 + 写者序判据 = 写时点现状（父侧 2026-09-30 裁决——§2.6）——否：设计轮即改（文档先行于码）∥ 不改正（漂移留存）。

**边界（不做）**：不改核 `cleanupOldToolResults` ∥ `TMP_RETENTION_MS`；不改 `routeUserTurn` 三调用点（有意零改——fire-and-forget 形）；不设读后删（跨回合可读维持）；不做存量清扫；桌面 ∥ CLI 零触；**UI ∕ 交互 = 无新增**（open 项：无）。

**行数面**：`image-handler.mjs` 51 ⇒ ≈58（≤300 内，零拆分）；`PROVIDER.md` 492 ⇒ ≈494（文档档——N-P3 域外；核 500 线内）；其余零变。

### 2.9 上抛与发现

**上抛（3）**：

- **U1 跨批同句写者序——已裁（父侧 2026-09-30 · 准则 = 写时点现状 · 禁预写未落机制）**：pairfix 收正轮按其彼时真值写（VSC 未接 ⇒ 如实「未接（留存）」）；本批随动轮收整句终形（§2.6 定稿）；同日互序按写时点现状（本批先行 ⇒ pairfix 可直写终形，免二次触）。设计已按此固化（§2.6）——**零阻塞**。
- **U2 需求侧笔（父侧）**：§2.7 建议（N-IDG-3 新增 ∥ VSC 档零承载面不另立）——文本草案已给；落否请裁。
- **U3 机检随动（非阻塞 · 一次性告知）**：① `docs/core/design/TOOL-OUTPUT-LIMITS.md:111` 行引 VSC `run-helpers.mjs:167` 等退役坐标（pairfix F-3 已登记机检轮）② `docs/core/design/API-CONTRACT.md:2416` `image-handler.mjs:20` 行号随本批实施漂移（机检轮）③ `docs/core/design/MODEL-SPECS.md:217` `image-handler.mjs:110` 疑似陈旧坐标（现档 51 行——无该行；机检轮复核）。

**发现（表外 · 非阻塞）**：

- VSC 集成测试面 = 空清单（2026-09-28 全清重置——`thincoder-vscode/test/files.mjs`）⇒ 本批无集成场景受影响（收口行如实报）。
- 原声称的旁证面 `TOOL-OUTPUT-LIMITS.md` §6.3 ∥ `_archive/TOOL-OUTPUT-LIMITS-TUNING.md` §2.4 的 VSC offload 坐标已随主循环退役（记录面照旧；机检轮统一处置——见 U3①）。

### 收正轮 1（评审五号点修 · 2026-09-30）

> 来源 = §3 轮次 1（VERDICT: pass · 0🔴 ∥ 4🟡 ∥ 2🔵）；本块逐号处置 🟡2 ∥ 🟡3 ∥ 🟡4 ∥ 🔵5 ∥ 🔵6——🟡1（跨批同句写面）由父侧跨批追补另行对齐，不在本块射程。
> 机制本体零改（只按号收正）；**本块各条 = 对应处终形 ∕ 口径——与本节前文不一致时以本块为准。**

**🟡2（写时点现状）→ §2.6-② 追补「落句时点与两端真值绑定」句**（统摄 §2.6-①② 终形之 CLI ∥ VSC 子句）：

> 落句时点与两端真值绑定：随动轮落笔前逐端核码——某端彼时未接线 ⇒ 该端子句如实标「未接（留存）」，或整句延至该端落地后收终形；终形逐字仅两端皆落时适用。任一端未落 ⇒ 禁按终形预写该端（判据同 §2.6——写时点现状 · 禁预写未落机制）。

**🟡3（闸判据精度）→ 闸判据同形收正 + L3 追补非字符串腿**（覆盖 §2.3「闸」行 ∥ §2.4 ①-2 ∥ §2.5 L3 描述与用例表 L3 行——以本收正为准）：

> 闸 = 仅当 **非空 `dataUrls` ∧ 有效 `cwd`** 才发起扫除；有效 `cwd` 判据与核件同形 = `typeof cwd === "string" && cwd !== ""`（核 `thincoder-core/attachments.mjs:71`）——**非字符串 cwd ∥ 空串 ⇒ 不发起扫除**（落盘走核弃项径 `:71-73`）。
>
> **L3 追补非字符串腿**（直系本号）：`savePastedImages([png], undefined)` ⇒ 扫除零发起（超龄哨兵仍在）∧ `{ paths: [], dropped: 1 }` ∧ 零抛。

**🟡4（收正定稿措辞）→ §2.6-② 终形文本替换**（逐字终形；括注射程收正——孤儿件判由限桌面面，免与新族扫除〔按龄回收〕相抵）：

> ⑤ 清理面 = **端侧时序面**（本档不回收）：桌面 = 逐回合显式清（`cleanupTurn`——仅删本回合在册路径；半失败写入的孤儿件无回收面〔此判仅桌面面成立〕）· CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗——目录内超龄件（含孤儿件）按龄回收）；机制单源 = `docs/core/design/PROVIDER.md` §6.18。

**🔵5（面域副作用登记）→ 相互作用登记 + 明示接受**（挂 §2.3 面域行 ∥ §2.8 D-3；面域裁定 = 整目录不变）：

> 相互作用：面域 = `<cwd>/.thincoder/tmp` 整目录文件 ⇒ 扫除生效后（任一端接线落地 ∧ 该 cwd 发生贴图落盘），**非贴图存量 ∥ 在册依赖**同样按 3 天窗回收。
> 本仓实害面（§3 轮次 1 #5 抽检实读）：该目录 = 本仓批次停车场（直接层数百件 ∥ ≥3 天龄件如 `arbiter-after.txt`〔2026-09-18〕· `baseline-doccheck.txt`〔2026-09-22〕）；
> 落档件装载期依赖 = `docs/batches/2026-09-29-parity-b7-minor.test.mjs:34,37,46` import `.thincoder/tmp/2026-09-29-parity-b7-w2-baseline-*.mjs`（该批自认「清 tmp ⇒ 装载期报错」）。
> **裁决 = 明示接受**（不设存量豁免 ∥ 不设在册依赖保全机制）：① 族形固有——原 VSC offload 扫除面即整目录（归档先例 `thincoder-vscode/docs/_archive/design/TOOL-OUTPUT-LIMITS-TUNING.md:44`）；② 收窄为 `paste-*` = 第二判据（§2.3 已否）。后果面如实登记：上述在册依赖被回收后，其消费方（parity-b7 系列批内件）装载期即报错——接受。

**🔵6（坐标颗粒）→ 坐标收正（两处）**：

> ① §2.2「且只扫自身目录——`:134` 传参」⇒ 收正为「且只扫自身目录——调用点传参 `:159`（缺省目录 `:156`）」（`:134` = `cleanupOldToolResults` 定义行；`:159` = `offloadToolResult` 内调用点；缺省 `dir` = 签名 `:156`）。
> ② §2.3 形态行「`panel-chat.mjs:124` 注释」⇒ 收正为「`panel-chat.mjs:115-123` 注释」（`:124` = 语句行）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面** = 设计（#735 VSC 贴图件清理）· 对象 = `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2（设计）× 落点文档 `docs/core/design/PROVIDER.md`（§6.18 `:271` ∥ 变更记录）× `thincoder-core/attachments.mjs:15-17`。

**抽检核证通过面**（逐条实读）：受影响文件读数逐档实核（`thincoder-vscode/src/extension/image-handler.mjs` 51 · `panel-messages.mjs` 354 · `thincoder-core/attachments.mjs` 125 · `PROVIDER.md` 492——计法 `split("\n")−1` 与设计一致）；`cleanupOldToolResults` 复用语义（3 天窗 `helpers.mjs:80` · 子目录不触 `:143` · 严格 older-than `:146` · 逐层静默 `:137-149`）与设计逐条一致；三调用点坐标（`panel-messages.mjs:154/:159/:180`）与咽喉点（`image-handler.mjs:20-22`）实读一致；面域归档先例实锤（`thincoder-vscode/docs/_archive/design/TOOL-OUTPUT-LIMITS-TUNING.md:44` = 原 VSC 面即 `.thincoder/tmp` 整目录含 paste-*）；需求锚 N-IDG-3 已在位（`docs/core/requirements/PROVIDER.md:132`，与 §2.7 草案逐字一致）；L1–L4 直驱可行（`thincoder-vscode/node_modules/@thincoder/core` 联结在位 + 同法批内件先例在册）；零触面核证（VSC src 全 grep 无该目录扫除调用；桌面 5 结算点坐标实读相符）。

**局限**：Project Standards 未声明 ∥ Document Map 未提供 ⇒ 方法论合规 / 文档归属按设计自载指针与批内惯例判定（降级）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Scope coordination（跨批同句 · R5） | 🟡 | 同句跨批写面方向互抵：pairfix §2.5-②/④（`docs/batches/2026-09-30-core-tools-pairfix.md:148`/`:152`）把 `PROVIDER.md:271` 收成**指针句**、清理面事实单源 = `attachments.mjs:16-17` 头注（「本句单源」）；本批 §2.6（`docs/batches/2026-09-30-vsc-paste-cleanup.md:151`/`:155`）方向相反（§6.18 载族形态整句 + 头注短句指回 §6.18）。U1 已裁「以本节定稿为准」，但 pairfix 记录仍载其形（其设计评审已 pass）⇒ 两舱各照自设计落笔将互覆 | 按 U1 口径对齐同句终形归属（如在 pairfix §2.5 行加「终形以 vsc-paste-cleanup §2.6 为准」标注），避免两次落笔互覆 |
| 2 | Requirement state（写时点现状） | 🟡 | 终形句 CLI 子句存在先于码落句风险：CLI 实码零 `cleanupOldToolResults` 调用（全树 grep 仅核/批次面命中）；#733 pairfix 处「设计完成 · 停手待裁」（`docs/batches/2026-09-30-core-tools-pairfix.md:31-33`）——§2.6-② 要求本批随动轮「整句收成终形」，彼时若 CLI 未落即预写未落机制（与 §2.6 自设判据「写时点现状」相抵） | 落句时点与 CLI 真值绑定：CLI 未接则如实标「未接」或延至 pairfix 落地后成终形 |
| 3 | Clarity（闸判据精度） | 🟡 | 扫除闸「非空 `dataUrls` ∧ 有效 `cwd`（非空串）」与核件有效性判据不同形（核 = `typeof cwd !== "string" || cwd === ""`，`thincoder-core/attachments.mjs:71`）；按字面实现（仅 `cwd !== ""`）时非字符串 cwd 会行进到 `join(cwd,…)` 并在**同步段**抛 ⇒ 破壳面「落盘出口零抛」契约（L3 只覆盖 `""`） | 闸判据与核件判据同形（字符串 ∧ 非空串），或注明「非字符串 cwd 不发起扫除」 |
| 4 | Document ownership（收正定稿措辞） | 🟡 | §2.6-② 终形保留括注「半失败写入的孤儿件无回收面」在扫除落地后不再是全域事实：`<cwd>/.thincoder/tmp` 内**任何**超龄文件（含孤儿件）在下次贴图落盘按龄回收（核扫面 = 目录内全部文件，`thincoder-core/agent/helpers.mjs:134-151`）；该判由仅桌面面成立（`cleanupTurn` 只删本回合在册路径，`thincoder-desktop/src/main/attachments.mjs:99-107`） | 括注限定射程或改述为「本档不回收」的判由，避免新句自带「声称 vs 实」残面 |
| 5 | Scope（面域副作用登记） | 🔵 | 面域 = 整目录文件将回收 `.thincoder/tmp` 非贴图存量：本仓该目录为批次停车场（直接层数百件、含 ≥3 天龄件：`.thincoder/tmp/arbiter-after.txt`〔2026-09-18〕· `baseline-doccheck.txt`〔2026-09-22〕），且落档件依赖其中文件（`docs/batches/2026-09-29-parity-b7-minor.test.mjs:34,37,46` 装载期 import `.thincoder/tmp/2026-09-29-parity-b7-w2-baseline-*.mjs`——该批自认「清 tmp ⇒ 装载期报错」）；面域有归档先例（`thincoder-vscode/docs/_archive/design/TOOL-OUTPUT-LIMITS-TUNING.md:44`）⇒ 非新造风险，但设计未登记该相互作用 | 登记相互作用并明示接受（或裁定对存量/在册依赖的保全）；面域裁定本身不必改 |
| 6 | Evidence（坐标颗粒） | 🔵 | 两处引证坐标可更精确：① `docs/batches/2026-09-30-vsc-paste-cleanup.md:50` 引 `helpers.mjs:134`「传参」——`:134` = 函数定义行，调用点传参在 `:159`（默认目录 `:156`）；② 同档 §2.3 引 `panel-chat.mjs:124`「注释」——注释块在 `:115-123`、`:124` 为语句行 | 机检轮顺带收正（不影响判据） |

VERDICT: pass · 计数 = 0🔴 / 4🟡 / 2🔵

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30）**：依据 = 用户 18:28「自动跑完」授权 + **设计评审通过**（0🔴 ∥ 4🟡 ∥ 2🔵——五号全采纳、修复轮落定于 §2.9〔父侧核验 ✓〕；🟡1 跨批同句已由 pairfix 侧追补对齐）+ 需求锚 N-IDG-3 已在位（父侧笔 · `docs/core/requirements/PROVIDER.md` §4.5）。

**实施舱**：eng-coder（单舱 · 设计Token 已签发——值不入档）。**实施范围** = §2.5 落点表：①-1 ∥ ①-2（`thincoder-vscode/src/extension/image-handler.mjs`——写时扫除接线，闸 = 非空 `dataUrls` ∧ cwd 与核件同形判据〔§2.9 🟡3〕）· ①-3（批内件新档 · L1–L4）· ②-1 ∥ ②-2 ∥ ②-3（doc-code 收正——**按 §2.6-② + §2.9 🟡2 写时点口径**：落笔前逐端核码，未接端如实标「未接（留存）」）。

**验收** = §2.5 L1–L4（批内件机检）全绿 + R1–R3（真机三径 · 父侧走查闭合）。

**显性提点（代签即背书）**：面域裁定「整目录 ⇒ 非贴图存量 ∥ 在册依赖按 3 天窗回收」= **明示接受**（§2.9 🔵5）；异议可随时复核。

## §5 实施记录（eng-coder）

**状态行**：实施完成（initial 轮 · L1–L4 全绿（4/4 · 复跑 4 次）∥ 审计 CLEAN ∥ 评审轮 1 pass + fix 轮 1 + 轮 2 pass ∥ 终态 clean · 2026-09-30）

### 5.1 交付摘要（落点逐项 · file:line = 实施后实读）

| 落点 | 落位（实测 · 行数 = `split("\n")−1` 计法） | 要点 |
|---|---|---|
| ①-1 | `thincoder-vscode/src/extension/image-handler.mjs:13-19`（import 区） | `+ import { join } from "node:path"` ∥ `+ import { cleanupOldToolResults } from "@thincoder/core/agent/helpers.mjs"`——跨包联结（junction）同模块实例（批内件 `:25-26` 断言） |
| ①-2 | 同档 `:21-29`（薄壳；档 **51 → 58 行**） | 写时扫除：闸 = 非空 `dataUrls` ∧ `typeof cwd === "string" && cwd !== ""`（与核 `thincoder-core/attachments.mjs:71` 同形）；**核落盘调用 `:28` 之前**发起；fire-and-forget（无 await 窗）+ `.catch` 防御 |
| ①-3 | `docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs`（新档 **106 行**） | L1–L4（含 §2.9 🟡3 非字符串 cwd 腿 `:88-90`） |
| ②-1 | `docs/core/design/PROVIDER.md:271` | 「文件随 offload 写时自清理」⇒ 端侧时序面句（§2.6-① 终形 + 🟡2 写时点口径） |
| ②-2 | `thincoder-core/attachments.mjs:15-17`（档 125 → 125 · 净 ±0） | ⑤ 句 ⇒ 🟡4 终形 + CLI 未接标注 |
| ②-3 | `PROVIDER.md:493-494`（档 492 → 494） | 变更记录 +1 条（折行 2 行——行宽闸） |

**零触面自证**：核 `agent/helpers.mjs` ∥ `TMP_RETENTION_MS` 零改；三调用点 `panel-messages.mjs:154/:159/:180` 零改；桌面 ∥ CLI 零写；`thincoder-vscode/test/files.mjs` 零登记（批内件惯例）。

### 5.2 验收读数（机检腿 · 实施舱自跑）

- 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs`
- 末次读数：`✔ L1 写时扫除`（128ms）· `✔ L2 边界窗`（31ms）· `✔ L3 闸`（785ms · 三腿）· `✔ L4 面域 ∥ 零回归`（54ms）⇒ `tests 4 / pass 4 / fail 0`（复跑 4 次同绿）。
- doc-check（`node scripts/doc-check.mjs`）：锚悬空 **59 = 开跑基线**（零新增；`agent/helpers.mjs` 两处曾引入悬空，经全限定 `thincoder-core/agent/helpers.mjs` 收正——见 D1）；行宽基线 165（本批触碰行全部 <300；当期为 166，增量 = 并行会话 `docs/desktop/design/RENDERER.md`，不归本批）。
- R1–R3（真机三径）= 父侧义务，不属本舱（§2.5 既定）。

### 5.3 决策透明表（超任务书披露）

| # | 决策 | 处置 | 依据／代价 |
|---|---|---|---|
| D1 | §2.6 终形 `agent/helpers.mjs` → 全限定 `thincoder-core/agent/helpers.mjs`（`PROVIDER.md:271` ∥ `:494` 两处） | 采纳（文本微差 · 如实披露） | doc-check 锚解析（悬空闸阈值 0）+ `docs/core/design` 核文件全路径惯例；语义中性（同一档） |
| D2 | CLI 子句 = **未接（留存）**（`PROVIDER.md:271` ∥ `attachments.mjs:16`） | 采纳 | §2.9 🟡2 写时点口径；落笔前全树 grep 实核（CLI 零 `cleanupOldToolResults` 调用） |
| D3 | 自伤自纠：首批编辑行号漂移误吞 `ensureMemoryHandle` import 行 | 当场复原（`image-handler.mjs:19`） | git diff 读回自证（测试前发现）——该 import = `visionReaderFor` 依赖，缺失将静默破非视觉降级径 |
| D4 | 头注 ① 补写时扫除括注 + JSDoc 闸判据补「同形对位 = 核 `attachments.mjs:71`」 | 采纳（评审轮 1 🔵③ ∥ 🔵④ 修复） | 自述一致性 + 判据漂移防护 |
| D5 | `PROVIDER.md:268-269` 同段陈旧坐标（`routeUserTurn`（`:59`）· `savePastedImages`（`:82`）——实为 `:128` ∥ `:154/:159/:180`） | 不修（登记） | 范围纪律（落点表仅 :271）+ U3 机检轮在册；评审轮 1 同判 🔵 |

### 5.4 审计与代码评审轮次与终态

- **分歧审计**（explore · 只读 · 1 轮）：**CLEAN**——四类偏差（验收腿 / 静默简化 / 面外改动 / doc 漂移）全零；L1–L4 逐断言核过；out-of-list 零。
- **代码评审轮 1**（advisor · code）：**VERDICT pass**（0🔴 · 1🟡 · 3🔵）——🟡 = §5 记录滞后（本段消解）；🔵 = D5 ∥ D4 两项。**fix 轮 1**：D4 落修、D5 登记不修。
- **代码评审轮 2**（fix 复核）：在途——D4 两项落修 + §5 落档已就绪（结果随轮 2 落笔追补）。

**轮 2 追补（fix 复核 · advisor）**：**pass**（0🔴）——D4 两项注释落修经复读确认（`image-handler.mjs:5` ∥ `:23` 引文核对 + `attachments.mjs:71` 同形对位交叉核对为实）；D5 维持登记不修（评审复核提示：「U3 机检轮在册」为宽口径引用——U3 `:188` 三项枚举未列 `PROVIDER.md:268-269`，父侧派机检轮时带上 D5 两坐标即可消解）；§5 落档消解 🟡；新面零。**终态 = clean**（审计 1 轮 CLEAN ∥ 评审轮 1 pass + fix 轮 1 ∥ 轮 2 pass；R1–R3 真机 = 父侧闭合）。

## §6 验证与收口（父代理）

**实施舱回执** = §5 在盘（eng-coder 自写：交付摘要 + 决策透明表 D1–D5 + 审计/评审轮次）；终态 = **clean**（审计 1 轮 CLEAN ∥ 代码评审轮 1 pass + fix 1 ∥ 轮 2 pass）。

**父侧核验（2026-09-30 19:0x）**：① 批内件独立复跑 = **4/4 绿**（`node --test docs/batches/2026-09-30-vsc-paste-cleanup.test.mjs`——L1 130ms ∥ L2 14ms ∥ L3 785ms ∥ L4 40ms）；② 判定句（N-IDG-3）= **机检满足**（超龄回收 ∧ 未超龄保留 ∧ 出口 `{paths, dropped}` 零变）；③ doc-code 收正实读 = `docs/core/design/PROVIDER.md:271`（CLI = 未接（留存））∥ `thincoder-core/attachments.mjs:15-17`（同口径 + 孤儿件判由限桌面）= 写时点现状口径落实 ✓；④ 改动面 = `image-handler.mjs` 51 ⇒ 58 ∥ 批内件 106 行 ∥ 提交 `933fa7d6`。

**收口核对（D7）**：角色表 §1–§6 ✓ ｜ §2/§3/§5 状态行在盘 ✓ ｜ 计数（L1–L4 四腿 ∥ 改动四档）✓ ｜ 指针（§2.6 ∥ §2.9 ∥ §4 ∥ §5）✓ ｜ 变更记录（PROVIDER.md +1 条）✓ ｜ **台账 #735 → 待核销**（R-腿见遗留）✓。

**遗留（如实）**：① **R1–R3 真机 = 待办**（VSC 环境：真实 VSC 会话贴图 ⇒ `paste-*` 在场 ∧ read_image 可读；候 VSC 使用时核——**不阻收口**，单列）；② `PROVIDER.md:268-269` 陈旧坐标（机检轮在册 · §5.3 D5）；③ CLI 端子句（未接）待 pairfix 落地后由彼批随动收终形（写者序裁 · §2.6）。

**收口结论**：验收 = L1–L4 全绿 + 判定句机检满足；**本批冻结候 R-腿**——R-腿核过即 close（当前 §1 维持「进行中」）。

**收口轮追补（父侧 · 2026-10-01）**：① **R1–R3 真机三径 = 用户 2026-10-01 13:25 VSC 走查通过**（父侧清单：提问卡摘除 ∥ 贴图清理面——无问题）；② 台账核销：`#735 → 已核销`（2026-10-01 13:26——结算依据 = 本档 §6 + §5 复跑 4/4 + 用户走查）；③ D7 结算对账：角色表 §1–§6 ✓ ∥ 状态行 ✓ ∥ 计数（4/4 ∥ 批内件 106 行 ∥ 提交 933fa7d6）✓ ∥ 指针（相邻批档 flat-followups ∥ cross-end-digest-recovery 无悬挂）✓；④ 遗留 = 无（D5 登记不修二坐标随 U3 机检轮在册——非本档口）。**收口完成 ⇒ 冻结。**
