# 2026-10-01 · 消化行自然形·两端跟正（CLI ∥ VSC）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 08:21「CLI/VSC也跟。」（跨端裁 · 台账 #768）。
> 台账 = #768（desktop · 归批 · 跨端面）。前情 = docs/batches/2026-10-01-digest-rows-natural-form.md §1（评审中）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：跨端跟正批（独立实现面批——多实现面纪律：各面独立落地 ∥ 语义同源 ∥ 四轴互核 = 父侧验）。

**用户原话（逐字 · 唯一标尺）**
- 2026-10-01 08:21：「CLI/VSC也跟。」（答桌面批 §10 DA①「桌面自然形 ∥ CLI 行退场 ∥ VSC 元素退场——处置待裁」之问）

**背景与语义源**
- 桌面批 = `docs/batches/2026-10-01-digest-rows-natural-form.md`（设计✓ · 评审在飞）——其 §1 判据 = 本批语义源（**只读**）：① 行/元素 = 流内事件，出即留（不改 ∥ 不删 ∥ 不退场）；② 终态 = **追加一条新行/新元素**（不动原 digesting 行）；③ 零清理机器；④ 随流自然上浮；记录复列（记录序 ≡ 恢复序）。
- **冻结纪律**：桌面批之批档与设计四档正处评审冻结窗——本批**零触**；桌面档 §10 DA① 条目 = 待桌面批评审回后收正（物归原批）。

**范围**
- **CLI 端**：行退场（dropLines 族——实 survey 钉）⇒ 自然形；
- **VSC 端**：元素退场（chat-status 族——`chat-status.js:74` 新轮清 ∥ `:112-120` 终态换文，实 survey 核）⇒ 自然形；
- 两端各自设计档条款收正 + 实现落点表（本批 §2）。

**待续**：设计轮在派 → 用户点火评审 → 实施。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-01 · 四档收正读回核讫（D6）· 修复轮（评审轮 1 · 发现 1–9）已落 · 实施后随动轮（§5 遗留项：值列 ∥ 坐标收正）已落）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批任务与设计（eng-designer · 设计轮 · 2026-10-01 · 台账 #768）**

**设计单源**：桌面批 §1 判据 + `docs/desktop/design/PROJECT.md` **KD-62** ∥ `docs/desktop/design/RENDERER.md` §1.1（**只读引据**——桌面批批档与设计四档正处评审冻结窗，本批零触）。**survey 钉死（实读 2026-10-01）**：CLI 行退场 = `thincoder-cli/src/tui/suspension-drive.mjs:101`（`dropLines(state, state._digestRows)`——行集自显示行面摘除）+ 行账 `:102/:106-107/:126` + 重建截点 `thincoder-cli/src/tui/startup.mjs:19-38`（`lastDigestRoundStart`）∥ `:49/:144`（`digestCut` 闸）；VSC 元素退场 = `thincoder-vscode/webview/chat-status.js:74-75`（旧轮元素族摘除循环——**路径以实读为准：`webview/` 非 `src/`**）+ 族谱账 `:70/:84/:94/:112` + 终态换文 `:119-129`（本轮计数元素原地更新——§1 记 `:112-120` 系近似）。

**2.1 本批条目（覆盖）**

| # | 条目 | 设计落点（两档涉句已收正——见 2.3） | 判据 |
|---|---|---|---|
| 1 | **CLI 行出即留**（退场机拆：`dropLines` 调用 ∥ `_digestRows` 账 ∥ 重建截点机）——起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：不改 ∥ 不删 ∥ 不退场 | `TUI.md` §6.9「行出即留」条；实施落点 = 条目 1 表（2.2） | 机检腿 L1 ∥ L3 |
| 2 | **CLI 终态 = 追加新行**（族尾插点 `insertLineAt` ⇒ `pushLine` 到达序追加；不动原起跑行 ∥ 零就地换文） | `TUI.md` §6.9 收尾行条 | 机检腿 L2（原行逐字不变 ∥ 追加位 = 当刻流末） |
| 3 | **CLI 复列 = 全量**（截点机拆——记录序 ≡ 恢复序） | `TUI.md` §6.9 ∥ `TUI-SESSION-VIEW.md` §6 | 机检腿 L4 |
| 4 | **VSC 元素出即留**（退场机拆：元素族谱账 ∥ 摘除循环） | `WEBVIEW.md` §5.1「行/元素出即留」条 | 机检腿 V1 ∥ V3 |
| 5 | **VSC 终态 = 追加终态元素**（`.digest-status` + `digest-done` ∕ `digest-failed`；不动原计数元素 ∥ 零就地换文；`n = 0` 守判保持） | `WEBVIEW-PROTOCOL.md` §5 ∥ `WEBVIEW.md` §5.1/§5.7 | 机检腿 V2（原元素逐字不变 ∥ 终态元素 = 新元素、当刻流末） |
| 6 | **VSC 复列设计句收正**（`end` 追加 ∥ 复列 = 全量完整轮——记录序 ≡ 恢复序） | `WEBVIEW.md` §5.7 ∥ `WEBVIEW-PROTOCOL.md` §5；**实施 = #726 VSC 腿承接**（盘面无实体——上抛①） | 设计句核（V4） |
| 7 | **记录面零动**（两端记录写点 ∥ 形 ∥ 落盘节律 ∥ `clearDigest` 零动） | 两端档记录面涉句零改 | L5 ∥ V3 负向锁 |
| 8 | **产品码 = 本批零触**（设计轮——实施批承接） | 2.4 表内文件全为「预期」列 | 实施轮按 2.5 验收 |

**2.2 两端机制设计（要点——语义同源 = 桌面 KD-62；各面独立落地）**

**自然形判据（逐字引据 · 桌面批 §1）**：① 行/元素 = 流内事件，**出即留**——不改 ∥ 不删 ∥ 不退场；② 终态 = **追加一条新行/新元素**（不动原 digesting 行/元素——零就地换文）；③ **零清理机器**（无终态摘除 ∥ 无换代删除 ∥ 无复列截点）；④ 随流自然上浮（离屏 = 滚动，非删除）∥ 重启 ∥ 重载 = 按记录复列（**记录序 ≡ 恢复序**）。

**实现落点表（退场机拆 ∥ 追加径 ∥ 引调面——零新词键/新概念）**：

| 端 | 退场机拆（删） | 追加径（形） | 引调面（签名零改） |
|---|---|---|---|
| **CLI** | `dropLines` 调用 + 行账（`suspension-drive.mjs:101-102/106-107/126`）· `conversation-writer.mjs:69-102` 两件出档（`dropLines` ∥ `insertLineAt`——随拆后双死亡码 + 死 import 清）· `lastDigestRoundStart` + `digestCut` 截点机（`startup.mjs:19-38/47-49/144`） | 起跑两行 ∥ cap 行 = `pushLine`（既有）· **终态行 = `pushLine`（到达序追加于当刻流末）**；复列 = `digestTraceLines` 逐记录（零截点）；起跑窗固化块 = `freezeSubTaskLines`（落位锚 = 起跑族尾——零改） | `digestTurn`（生产唯一调用）· `driveTurn` 分支 · `historyToLines` ∥ `restoreLines` ∥ `createLoadOlder` |
| **VSC** | 元素族退场循环 + 族谱账（`chat-status.js:70/74-75/84/94/112`） | 标签 ∥ 计数 ∥ cap = `appendChild`（既有）· **`end` ⇒ 新建 `.digest-status` + `digest-done` ∕ `digest-failed` 元素 appendChild**（计数 `n` 自本轮计数元素 `dataset.n` 取；`n = 0` 轮零动作守判保持）；复列（设计面）= 逐记录（`end` ⇒ 追加——与 live 同调） | `showDigestStatus`（`chat-messages.js:191` 分派）· `_digestBoundary` 写点（start 分支——零改） |

**零新词键/新概念**：i18n 键 = 核字典既有七键零增（`digest.done` ∕ `digest.aborted` ∥ `digest.start` ∥ 两档标签 ∥ cap 两档）；VSC 终态元素 = 既有类族复用（`activity.js` `isDigestRow` ∥ `base.css` `.digest-status.digest-done/failed` ∥ 既有选择器零改）；CLI 行 = 既有行面零新增；无新机制名。

**三端互核（四轴）**：**同裁**（出即留 ∥ 终态追加 ∥ 零清理 ∥ 记录序 ≡ 恢复序——语义单源 = 桌面判据）；**同判据**（终态后原行/元素在场且逐字不变 + 追加位 = 当刻流末——2.5 腿 L2/V2）；**同形边界**（CLI = 行数组面 ∥ VSC = DOM 元素面——载体差在册）；**差异** = 无新开（未结轮重放口径三端各异 = 既有差异——上抛②）。

**归档落位（保持面——#754 裁 A 机制零改）**：起跑窗时点 ∥ 块落位（CLI = 起跑族尾显式锚 ∥ VSC = `insertAfter` 边界行）∥ `reclaim` = 兜底幂等；本批只收正表述（终态行/元素 = 到达序追加——不入落位锚面；「本族末元素之后」旧表述删）。

**2.3 设计档落点与档面清单（端 × 需求档 ∥ 设计档——实 survey）**

| 端 | 需求档（本批零改——笔权 = 主 agent） | 设计档（本批收正——已落 + 读回 D6） | 测试面 |
|---|---|---|---|
| CLI | `docs/cli/requirements/TUI.md`（F18「痕 = 按记录位次复列」与自然形同向；**设计回指占位未补节号**——上抛③） | `docs/cli/design/TUI.md` §6.9（`:535` 收尾行 ∥ `:538` 只留当轮条 ⇒ 行出即留 ∥ `:539` 归档落位句）+ 变更记录 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6（`:191` 复列 = 全量）+ 变更记录 | `thincoder-cli/test/`（全清后零 `.test.mjs`——本批腿 = 批内件） |
| VSC | `docs/vsc/requirements/WEBVIEW.md`（F-W1 ∥ I-7——零改；恢复面承诺实施在 #726 腿——上抛①） | `docs/vsc/design/WEBVIEW.md` §5.1（`:209` 归档表行 ∥ `:225` 只留当轮条 ⇒ 行/元素出即留 ∥ `:226` 裁 A 落位句）+ §5.7（`:471` 复列句 ∥ `:472` 块落点句）+ 变更记录 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5（`:202` 边界取面 ∥ `:204` end 契约 ∥ `:209` 跨轮句）+ 变更记录 | `thincoder-vscode/test/files.mjs`（清单空——本批腿 = 批内件） |

**收正后读回（D6）**：四档逐处 edit 回显 + 定向 grep 复核 ✓——**规范面旧式句零残留**（`终态行到达入族` ∥ `同页本轮元素…原地更新` ∥ `页内只产末轮` ∥ `S._digestBoundary = 标签行` 全域零命中；余存 = 批档 ∥ 各档变更记录 = 历史面——照旧）；**新式句在位**（`行出即留` ∥ `到达序追加` ∥ `落位 = 当刻流末` ∥ `复列 = 全量/全量完整轮` ∥ `追加终态元素` ∥ `记录位次原位（零配对）`——读数见交付报告）。**附带一致性收正（发现⑦）**：`WEBVIEW-PROTOCOL.md:202` 边界取面旧字面（`= 标签行`）对盘收正为「计数元素 ∥ 无 ⇒ 标签元素」（与 `WEBVIEW.md:224` ∥ `chat-status.js:100` 同源——#754 期漂移）。

**2.4 受影响文件与测试面（现行 ⇒ 预期 · 实读 2026-10-01——内容行数口径（文末换行不计））**

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/suspension-drive.mjs` | **262 ⇒ ≈250**（退场调用 ∥ 行账 ∥ 终态插点拆；注文收正） | 行族面 |
| 2 | `thincoder-cli/src/tui/conversation-writer.mjs` | **102 ⇒ ≈72**（`dropLines` ∥ `insertLineAt` 双死亡码拆 + 死 import 清） | 写入面 |
| 3 | `thincoder-cli/src/tui/startup.mjs` | **344 ⇒ ≈322**（截点机拆——**越 300 在册**；拆分预案（恢复族出档）不触发——本批净删，触发 = 该档下次实质改动） | 恢复面 |
| 4 | `thincoder-vscode/webview/chat-status.js` | **133 ⇒ ≈128**（退场账 ∥ 循环拆；`end` 改追加——注文收正） | 元素面 |
| 5 | `thincoder-vscode/webview/activity.js` | **188 ⇒ 188**（`isDigestRow` 类族复用零改；归档注文随动） | 归档面 |
| 6 | 批内件 | `docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs`（拟新增——CLI 腿 L1–L5 + VSC 腿 V1–V4）；随批留存 · 不进仓套件 | 全批 |
| 7 | 前批件（测试面） | `docs/batches/2026-10-01-digest-row-current-only.probe.mjs`（两端臂断言随本批翻——改 ∥ 标注，归实施轮）∥ `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（复跑核——其腿不含截点断言，预期保持） | 测试面 |
| 8 | 设计档 | 四档（见 2.3）+ 各变更记录 | 全批 |

行数口径 = 内容行数；≈ = 预期估读，实施轮按盘收正（沿 as-of 政策）。

**2.5 验收对照（回指本任务书 ①–④）**

- **对①（用户裁可对：两端 = 行/元素不消失 ∥ 终态追加新行/元素 ∥ 零清理）**：CLI——行出即留 ∥ 终态行 = 到达序追加 ∥ 零清理（退场机全拆）；VSC——元素出即留 ∥ 终态元素 = 追加 ∥ 零清理。对照 = 条目 1–5。
- **对②（两端设计档通读一致 ∥ 规范面零「换文/退场/删旧」残留）**：四档收正已落 + 读回；残留扫读数见 2.3（历史面照旧）。
- **对③（机检腿 + 真机一条）**：
  - **CLI 机检腿**（批内件；驱动 = 真 `digestTurn` + 真 `conversation-writer` 写入面——沿 #726 批内件 `turnFixture` 先例）：
    - **L1 行出即留**：两轮串行 `digestTurn` ⇒ 两轮行全量在场（旧轮行零摘除——行对象引用仍在 `state.lines`）。
    - **L2 终态 = 追加新行（本任务书点名腿）**：**终态后原起跑两行在场且逐字不变**（`digest.turnLabel` ∥ `digest.start` 文本逐字）∥ 终态行 = 新行对象（非复用）∥ 追加位 = 当刻流末。
    - **L3 零清理负向锁**：`suspension-drive.mjs` 零 `dropLines` ∥ 零 `_digestRows` 写点（源面结构断言）+ 多轮串行后零摘除面触发。
    - **L4 复列全量**：混序记录（两完整轮 + 一尾残轮）⇒ `historyToLines` 逐轮痕行按记录序出（旧轮零截 ∥ 终态行 `n` 回扫保持）。
    - **L5 记录面负向锁**：写点三处 `pushRecord` 调用 ∥ 记录三型形零变（对照 #726 腿 C1 判据）。
  - **VSC 机检腿**（批内件；假 DOM 直驱真 `showDigestStatus`——沿 #754 探针先例）：
    - **V1 元素出即留**：三轮串行 ⇒ 标签 ×3 ∥ 计数 ×3 ∥ 终态元素 ×2 全量在场（旧轮零摘除——`remove()` 零调用）。
    - **V2 终态 = 追加终态元素（本任务书点名腿）**：**终态后原计数元素在场且逐字不变**（`digest.start` 文本 ∥ 类恒 `digest-status`）∥ 终态元素 = 新建元素（`.digest-status.digest-done` ∕ `.digest-failed`——终态文本逐字）∥ 追加位 = 当刻流末；`ok:false` 档同判。
    - **V3 零清理负向锁**：`chat-status.js` 零 `remove()` ∥ 零 `_digestRoundEls`（源面结构断言）；多轮后 `#messages` 子树零元素移除（假 DOM 移除调用计数 = 0）。
    - **V4 复列设计腿（文面）**：§5.7 复列句 = 全量完整轮（记录序 ≡ 恢复序）∥ 机检腿落建 = 随 #726 VSC 腿实施（本批以设计句核 + live 面重放同调为据——上抛①）。
  - **真机一条**（父侧闭合 · 沿 D16）：**CLI 真 TUI 两轮串行消化 + VSC 面板多轮串行**——终态后原行/元素在场 ∥ 新终态行/元素出现（流末）∥ 新轮起跑旧轮行/元素仍在上方 ∥ 重载后各轮行组复列。
- **对④（每处改动读回核讫）**：四档改动逐处 edit 回显 + 定向 grep 复核（新式句在位 ∥ 旧式句零残留——file:line + 读数见交付报告）。

**2.6 关键决策（含否决）**

- **D1 CLI 终态行落点 = 到达序追加（`pushLine`——当刻流末）**（否：保留族尾插点（`insertLineAt`）——判由：语义源「终态 = 追加一条新行」+ 桌面批 §2 腿「追加位 = 当刻流末」；「行 = 流内事件——出生 = 到达序」；插点机随拆 = 零携债）。
- **D2 VSC 终态元素 = 既有类族复用**（`.digest-status` + `digest-done` ∕ `digest-failed`）（否：新类名 ∥ 新 data 锚——类族复用使 `isDigestRow` ∥ 样式 ∥ 既有选择器 ∥ 词键零改——零新概念达标）。
- **D3 VSC 复列设计句本批收正**（否：留待 #726 实施轮——规范面错句随时实施即错；收正零成本）。
- **D4 两端复列 = 全量（记录序 ≡ 恢复序）**；CLI 未结末轮照现 = 沿现行口径（否：本批改未结轮口径——非「退出/换文」类句 ∥ 三端口径差异列报待裁——上抛②）。
- **D5 记录面零动**（写点 ∥ 形 ∥ 节律 ∥ `clearDigest` 零改——「记录照留」判据保持）。
- **D6 归档落位保持 #754 裁 A 机制**（起跑窗 ∥ CLI 起跑族尾 ∥ VSC `insertAfter` 边界行 ∥ `reclaim` 兜底幂等——本批只收正表述）。

**2.7 上抛项**

| # | 项 | 归 |
|---|---|---|
| 1 | **VSC 恢复面盘面无实体**：§5.7 写读重建（`recordAppend` ∥ `{records:true}` ∥ `record-restore.js`）全树零位——#726 VSC 腿未实施（#754 审计已列报）；本批设计句已收正，实施归 #726 承接（或另批） | 父侧 ∕ 主 agent |
| 2 | **未结轮重放口径三端各异**（桌面「末轮无 `end` 不产」∥ CLI「尾残轮照现」∥ VSC「半轮零元素」）——处置待裁（统一方向候选 = 全量重放 ∥ 完整轮专出） | 用户 ∕ 父侧 |
| 3 | **CLI F18 设计回指占位未补节号**（「本批设计定形后补节号」——现成节 = `docs/cli/design/TUI-SESSION-VIEW.md` §6）——需求档笔权 = 主 agent | 主 agent |
| 4 | **ask-only 轮（`n = 0`）终态行/元素有无**：两端守判（零终态）∥ 桌面 KD-62 未设守句——跨端判据待核 | 桌面批评审回 ∥ 后续批 |
| 5 | **桌面档涉两端句**（KD-62 ∥ §10 DA①「差异重开」）——本批以「两端随正」兑现（用户 08:21 裁）；桌面档收正 = 物归原批（评审回后） | 桌面批（本批零触） |

**2.8 明确不在本批**

- **桌面零触**（批档 + 设计四档 = 评审冻结窗）；**需求档零写**（笔权 = 主 agent——上抛③为报告项）；**VSC 恢复面实施**（#726 VSC 腿——本批只收正设计句）；**未结轮口径**（上抛②待裁）；**记录面 ∥ 核包 ∥ 协议载荷 ∥ 落盘节律**（零动）；**前批件处置**（probe 改/标注 ∥ 复跑核——归实施轮）；**仓套件 ∥ 全清令面**（不写 ∥ 不改 ∥ 不跑——收口轮父侧唯一一次）。

**设计轮完成 · 产品码零触 · 记录面零动 · 桌面零触。**

**机检读数（doc-check 单引擎 · 单次 · 交付前 · 2026-10-01）**：`node scripts/doc-check.mjs`（cwd = `thincoder/`）⇒ **FAIL(锚) 108 条悬空 ∥ FAIL(行宽) 258 行超 300 字符**——**全域既有债**（台账在册「M8 遗留：…悬空锚文档债 + 行宽 + 计数收正」——触发 = 退役批后 / 文档债修复批；主贡献面 = 桌面档族与 core 档族）。**本批 delta**：① **新增悬空锚 = 0**（四档涉句行零 ✗——定向核讫）；② 涉句行超宽 = 6 处（303–649 字符；`TUI.md:539` ∥ `WEBVIEW.md:471` 为既有宽行随改，余 4 处随正新写）——形态与邻行及桌面同源档一致（同族既有行 400–1400 字符）；全域折行归文档债修复批（触发在册），本批不夹带（桌面面 = 冻结窗）。证据日志 = `_doccheck-cli-vsc.log`（仓根——沿 `_*.log` 惯例留档）。

**修复轮（评审轮 1 · 发现 1–9 逐号处置 · 2026-10-01 · eng-designer）**

依据 = §3 轮次 1（VERDICT pass——0🔴 / 4🟡 / 6🔵；发现 10 = 父侧笔——不在本轮）。**本块 = 对 §2.1–§2.5 的修复轮修订**——涉句以本块为准（原文照留作过程记录）；设计档侧 = 三档收正 + 变更记录同拍（`TUI.md` ∥ `WEBVIEW.md` ∥ `TUI-SESSION-VIEW.md`——各一条 2026-10-01 修复轮，已在盘读回）。**零新语义**（只落评审发现与逐条处置——无夹带）。

**逐号处置与读回**

| # | 处置 | 落点 ∥ 读回值 |
|---|---|---|
| 1 | §2.4 表补**下游随动行**（`docs/core/design/API-CONTRACT.md`） | 见下「§2.4 补行」——生成区 `:157-158` 两登记行随拆重生成 |
| 2 | 规范面修订式括注清理（两档） | `TUI.md:538` ∥ `WEBVIEW.md:225`——括注已删（读回 = 口径句尾直入「被否」清单） |
| 3 | §2.4 行 6 ∥ 行 7 补注记 | 见下「§2.4 补注」 |
| 4 | 真机条按端分列 | §2.5 对③（见下）——CLI 面含重载复列 ∥ VSC 面重载项随 #726 |
| 5 | V1 腿注第三轮投递态 | §2.5 V1（见下）——第三轮 = 起跑已投 ∥ 终态未投 |
| 6 | CLI 补 L6 aborted 形腿 | §2.5（见下）——L6 新补 |
| 7 | V1/V3 断言面限定痕元素族 | §2.5 V1 ∥ V3（见下） |
| 8 | 撤「拟新增」标记 | `TUI-SESSION-VIEW.md:23` ∥ `:189`（读回 = 标记已去——实读在盘） |
| 9 | 落位句补迟到面限定 | `TUI.md:539` ∥ `WEBVIEW.md:226`（读回见下） |

**§2.4 补注（#3——接原表行 6 ∥ 行 7）**：
- 行 6（批内件——拟新增）：规模 **≈350 行估读**（CLI 腿 L1–L6 + VSC 腿 V1–V4 + 夹具；先例 = #726 批内件 602 行 ∥ #754 探针 256 行）。
- 行 7（前批件——probe）：`docs/batches/2026-10-01-digest-row-current-only.probe.mjs` **现 256 ⇒ ≈256**（两端臂断言随本批翻 + 标注——估读）。

**§2.4 补行（#1——增第 9 行）**：
- 9 ｜ `docs/core/design/API-CONTRACT.md` ｜ 生成区 `:157-158`（`dropLines` ∥ `insertLineAt` 登记行）——**下游随动**：删码同批重生成（`node scripts/api-contract.mjs --write`——生成器唯一笔 · 父侧直接执行面；`--check` = 漂移判据），两登记行随拆消失 ｜ 接口登记面。

**§2.5 修订（#4–#7——涉句以本块为准）**：
- **对③ 真机条（按端分列——#4）**：**CLI 面**——真 TUI 两轮串行消化：终态后原行在场 ∥ 新终态行出现（流末）∥ 新轮起跑旧轮行仍在上方 ∥ **重载后各轮行组复列**（`historyToLines` 逐记录——在盘径）；**VSC 面**——面板多轮串行：终态后原元素在场 ∥ 终态元素追加（流末）∥ 新轮起跑旧轮元素仍在上方；**重载复列项 = 随 #726 VSC 腿承接**（恢复面盘面无实体——上抛①；本批不列 VSC 重载实机项）。
- **V1（#5 ∥ #7）**：三轮串行（**第三轮 = 起跑已投 ∥ `end` 未投——半轮**）⇒ 标签 ×3 ∥ 计数 ×3 ∥ 终态元素 ×2 全量在场；旧轮零摘除——**痕元素族**无 `remove()` 调用（假 DOM 移除计数 = 0）。
- **V3（#7）**：**断言面 = 痕元素族区段**（`showDigestStatus` ∥ 族谱账同址行）：区段零 `remove()` ∥ 零 `_digestRoundEls`（源面结构断言——他族 `clearStatusText` ∥ `handleStatusText` ∥ `showCompressStatus` 有合法移除亦不入断言面，防假红）；多轮后 `#messages` 子树零元素移除（假 DOM 移除调用计数 = 0）。
- **CLI 腿补 L6（#6）**：**L6 aborted 形**——`outcome ≠ "ok"`（中止/失败同判）⇒ 终态行 = `digest.aborted` 文本（`消化中断（Xs）`）∥ 追加位 = 当刻流末 ∥ 原起跑行逐字不变（对位 VSC V2 `ok:false` 档）。

**设计档收正读回（#2 ∥ #8 ∥ #9——D6）**：
- `TUI.md:538`：括注清理 ✓（读回尾段 = 「…「CLI/VSC也跟。」；被否 = 「只留当轮」恢复 ∥ 旧轮痕行退场 ∥ 复列末轮痕。」）；`TUI.md:539`：落位句 = 「落位 = 当刻流末（起跑刻语义）」+「迟到面落位 = settle 锚位（无显式锚 ⇒ `_freezeAt`（settle 刻流位置）∥ 无锚 ⇒ 流末）」✓——**同句附带收正**：`reclaim` 坐标 `suspension-drive.mjs:182 ⇒ :224`（实读——reclaim 接线行）；机制锚句改「锚 = 显式锚（起跑族尾）∥ `_freezeAt` ∥ 流末」。
- `WEBVIEW.md:225`：括注清理 ✓；`WEBVIEW.md:226`：迟到面 = 族锚位（消化回收 `done` ⇒ `atBoundary`——边界行之后 ∥ 边界失效/无 ⇒ 尾追；会话退出 flush = 尾追——核 `subblocks/state.mjs` `:238` ∥ `:300-304`）✓。
- `TUI-SESSION-VIEW.md:23` ∥ `:189`：撤「拟新增 / 新档」标记 ✓（实读：`thincoder-cli/src/tui/lifecycle-records.mjs` 在盘——191 行；写点三处 + 恢复面——import 接线在位（`suspension-drive.mjs:32` ∥ `agent-turn.mjs:28` ∥ `subagent-freeze.mjs:17` ∥ `startup.mjs:11`））。
- 变更记录 = 三档各一条在盘（`TUI.md:900` ∥ `WEBVIEW.md:780` ∥ `TUI-SESSION-VIEW.md:229`——各携史实迁入：原「只留当轮」系转写失真（承桌面批判据 07:54 ∥ 07:58 直斥）且已作废之叙述——规范面不再载）。
- **零触面**：`WEBVIEW-PROTOCOL.md` 本轮零改（无涉句发现）；`docs/core/design/API-CONTRACT.md` 本批零改（登记行随删码批重生成——见上补行）；产品码 ∥ 记录面 ∥ 桌面 ∥ 需求档 ∥ §1 ∥ §3 零触。

**验收对照（本任务书 ①–④）**：① 发现 1–9 逐条有落点 + 读回（见上；发现 10 = 父侧笔）；② 定向 grep「已作废 ∥ 转写失真」四档**规范面零命中**（余存 = 变更记录区 = 历史面——读数见交付报告）；③ 真机条按端分列 ∥ 与 V4 ∥ 上抛① 同调（VSC 重载项 = 随 #726——两处同述）；④ 变更记录三档同拍 + 本块在册。

**修复轮完成 · 产品码零触 · 记录面零动 · 桌面零触 · 需求档零写。**

**机检读数（修复轮 · 2026-10-01 · eng-designer）**：`node scripts/doc-check.mjs`（cwd = `thincoder/`）⇒ **悬空 108（= 设计轮基线 108——修复轮 delta 0）**；过程中自查捕获 1 处并修正：`TUI.md:900` 初稿简写坐标 `suspension-drive.mjs:182` = basename 不唯一（另有 `thincoder-desktop/src/main/suspension-drive.mjs`——实读在盘）⇒ 悬空 +1；改全路径后复核回落 108。**行宽 261（= 基线 258 + 3）**：`TUI.md:900` ∥ `WEBVIEW.md:780`（本轮新增变更记录行）∥ `WEBVIEW.md:226`（迟到面句随增越线 250 ⇒ 327）——其余涉句行 = 既有宽行随增/随减（`TUI.md:538` 387 ⇒ 340 ∥ `TUI.md:539` 649 ⇒ 813 ∥ `WEBVIEW.md:225` 488 ⇒ 440）；形态同邻行（同族既有行 400–1400）——全域折行归文档债修复批（沿既有口径，本批不夹带）。

**实施后文档面随动轮（2026-10-01 · eng-designer · 承 §5 遗留项「文档面数值漂移」逐处收正）**

**纯坐标/值收正——零新语义 ∥ 零正文改写。** 三档变更记录各一行同拍。

| # | 落点 | 收正（旧 ⇒ 实读 · 对盘 2026-10-01） |
|---|---|---|
| 1 | `docs/cli/design/TUI.md:539` | `reclaim` 坐标 `thincoder-cli/src/tui/suspension-drive.mjs:224 ⇒ :212`（净删后接线行现位） |
| 2 | `docs/cli/design/TUI-SESSION-VIEW.md:184-185` | §6 写点坐标——起跑 `:90-91 ⇒ :101` ∥ 收尾 `:99-100 ⇒ :116`（同档 `thincoder-cli/src/tui/suspension-drive.mjs`——起跑/终态痕行 push 行现位；记录 push 行 = `:102`/`:117` 同点后行） |
| 3 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:198 ∥ :208` | `thincoder-vscode/webview/chat-status.js:69 ⇒ :71`（两处引用同拍——`showDigestStatus` 定义行现位；漂移非本批引入） |

**§2.4 值列回填（实读 · 内容行数口径——文末换行不计）**：`suspension-drive.mjs` ≈250 ⇒ **250** ∥ `conversation-writer.mjs` ≈72 ⇒ **62**（估读偏高 10——#754 增量为纯追加、全拆回落原档）∥ `startup.mjs` ≈322 ⇒ **321** ∥ `chat-status.js` ≈128 ⇒ **126** ∥ `activity.js` 188 ⇒ **188** ✓ ∥ 批内件（行 6）≈350 ⇒ **493**（§5 记 492 = ±1 口径——以盘读为准）。

**机检读数**：`node scripts/doc-check.mjs`（cwd = `thincoder/`）⇒ **悬空 108（= 前读数 108——delta 0）∥ 行宽 263**（前读数 261——差额逐文件归因 = `docs/desktop/design/PROJECT.md` +1 ∥ `docs/desktop/requirements/PROJECT.md` +1——非本批三档；本批三档零新增宽行：新写三行 255 ∥ 262 ∥ 266 字符均 <300）。日志 = `_doccheck-cli-vsc-post.log`（仓根）。

**零触面** = 产品码 ∥ 需求档 ∥ 桌面档族 ∥ 本批他档 ∥ 批档 §1 ∥ §3。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审域**：声明对象（四档涉句 + 本批档）∥ 对象状态 = 待评审 ∥ 程序 = 逐处对盘核读 + 定向 grep 复核（只读）。

**核读结论（先记属实项）**：批档所引四档坐标逐处命中（`TUI.md:535/538/539` ∥ `TUI-SESSION-VIEW.md:191` ∥ `WEBVIEW.md:209/225/226/471/472` ∥ `WEBVIEW-PROTOCOL.md:202/204/209`）；D6 零残留清单在四档内复核属实（`终态行到达入族` ∥ `同页本轮元素…原地更新` ∥ `页内只产末轮` ∥ `S._digestBoundary = 标签行`——规范面零命中）；四档变更记录各一条（2026-10-01）在位；新旧口径（行出即留 ∥ 到达序追加 ∥ 复列全量/全量完整轮 ∥ end 追加终态元素 ∥ 边界取面）逐句在位、彼此一致。受限：① 产品码不在评审域 ⇒ §2.4 现行行数（262/102/344/133/188）未能对盘抽核（unverified）；② 无 document map ⇒ 文档归属判据按 Project Guide + 档内单源句降级判断；③ 无项目标准档 ⇒ 方法学对照仅按 AGENTS.md。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（受影响面完整性） | 🟡 | 批档 §2.4 受影响文件表未列 `docs/core/design/API-CONTRACT.md`——该档 `:157-158` 把本批要拆的两件（`dropLines` = `conversation-writer.mjs:69` ∥ `insertLineAt` = `:91`）登记为导出 API（仓内检索实据；该档不在声明评审域内，作外围实据引用）⇒ 删码后登记行悬空（跨档滞后） | 受影响文件表补该档行（或列入下游随动清单），删码与登记行同批收正 |
| 2 | Doc hygiene | 🟡 | 规范面特征句带修订/作废叙述：`TUI.md:538` ∥ `WEBVIEW.md:225` 均载「…「只留当轮」转写失真已作废，非行/元素删除授权」——与失效表达纪律（`TUI.md:867` 用户 2026-09-18 裁定）相抵：规范面只留现行口径，史实归记录面 | 该句史实移入变更记录/批档；规范句保留「口径 = 用户 2026-10-01 08:21」+「被否」清单 |
| 3 | Affected-file size annotations | 🟡 | 2.4 表第 7 行前批件 `docs/batches/2026-10-01-digest-row-current-only.probe.mjs`（**改**）无现值/增量注记；第 6 行拟新增测试件无规模估（纯 `.md` 豁免口径不覆盖二者） | 补两件行注（现值 ⇒ 预期，或 ≈N 估读） |
| 4 | Acceptance criteria | 🟡 | 真机条（§2.5 对③）含「**重载后各轮行组复列**」，与 V4 ∥ 上抛①「VSC 恢复面盘面无实体（#726 VSC 腿未实施）」相抵——VSC 侧重载项本批不可满足 | 真机条按端分列：重载复列项限 CLI 面；VSC 侧重载项标注随 #726 承接 |
| 5 | Clarity | 🔵 | V1 腿「三轮串行 ⇒ 标签 ×3 ∥ 计数 ×3 ∥ 终态元素 ×2」未交代第三轮投递态（须末轮无 `end` 才得 ×2）——期望数不可唯一推出 | 腿内注明第三轮 = 起跑已投 ∥ 终态未投（或改全收尾 ×3 + 独立半轮腿） |
| 6 | Acceptance criteria | 🔵 | CLI 腿 L1–L5 未覆盖 `digest.aborted`（中止/失败）形态的终态行落点（VSC 侧 V2 有 `ok:false` 档） | 补一条 aborted 形腿，或注明由既有腿承接 |
| 7 | Clarity | 🔵 | V1/V3 负向锁以整档口径断言（`chat-status.js` 零 `remove()` ∥ 零 `_digestRoundEls`）——该档含 `clearStatusText` / `handleStatusText` 等他族（`WEBVIEW.md:47`），若他族有合法移除调用即假红（码面不在评审域——unverified） | 断言面限定到痕元素族（摘除循环同址行） |
| 8 | Clarity | 🔵 | `TUI-SESSION-VIEW.md:23 ∥ :189` 仍标 `lifecycle-records.mjs`「拟新增 · #726」；批档 §2.2 却按「记录面零动 ∥ 复列 = `digestTraceLines` 逐记录」引用其承接（CLI 腿实施现状未标——unverified） | 明确该档现态：已落 ⇒ 撤「拟新增」标记；未落 ⇒ 补依赖/腿注 |
| 9 | Clarity | 🔵 | `TUI.md:539` ∥ `WEBVIEW.md:226`「落位 = 当刻流末」与同句保留的机制锚（CLI = 起跑族尾锚）在 reclaim/迟到面上不相邻——该面实际落位未点明 | 同句补迟到面限定（迟到/reclaim ⇒ 族锚位），或把「当刻流末」限定为起跑刻语义 |
| 10 | Methodology compliance | 🔵 | 批档 §1 状态行 `🔄 进行中（…）` 带占位（批档面卫生；§2 已「设计完成」） | 状态行占位随父侧落定填实或去占位 |

**域外注记（不给严重度；声明域外实据，供父侧文档层调度）**：
① `docs/core/design/AGENT-LOOP-UPSTREAM.md`（本批 `TUI.md:537` 定其为「可见面口径单源」= §6.27.12.13 ①–③）两处仍载旧元素形态：`:984`（T-SL-V2 ② 期望「计数元素在场 + end 原地更新」）∥ `:887`（D-SL2 理由「VSC 亦得 `digest.done` 收尾更新」）。该节 ⑥（`:845-846`）已声明元素级契约单源 = `WEBVIEW.md` §5.1 / `WEBVIEW-PROTOCOL.md` §5（「本节不重述」）⇒ 判为从属材料跨档滞后（非机制级两述相抵），未计严重度；建议父侧文档层随本族收正一并定向核（用例行 + 其载体 `thincoder-vscode/test/digest-visibility.test.mjs`）。
② 声明排除项本轮零判：未结轮重放口径三端差异（已立账 #771）∥ 桌面批文档（物归原批）。

**计数：🔴 0 ∥ 🟡 4 ∥ 🔵 6**
**VERDICT: pass**（无 🔴；🟡/🔵 不阻断）

### 轮次 2（评审子代理）

**评审域**：声明对象（四档涉句 + 本批档）∥ 对象状态 = 待复审 ∥ 程序 = 逐处对盘核读 + 定向 grep 复核（只读）∥ 本轮 = 核验 §3 轮次 1 前表（发现 1–9）。

**核读结论（先记属实项）**：发现 1–9 逐条对盘核验——**九条全数落地**：
- ①（F1）§2.4 增第 9 行（`docs/core/design/API-CONTRACT.md` 生成区 `:157-158`——下游随动 + 重生成机制）在册；
- ②（F2）规范面修订式括注已删——`TUI.md:538` ∥ `WEBVIEW.md:225` 现载「口径 = 用户 2026-10-01 08:21」+「被否」清单，史实入变更记录（`TUI.md:900` ∥ `WEBVIEW.md:780`）；定向 grep「转写失真 ∥ 已作废」四档**仅变更记录命中**（规范面零残留——与批档读数一致）；
- ③（F3）§2.4 行 6 / 行 7 补注在册（批内件 ≈350 估读 ∥ probe 现 256 ⇒ ≈256）；
- ④（F4）真机条按端分列——VSC 重载项 = 随 #726（与 V4 ∥ 上抛① 同述）；CLI 面含重载复列；
- ⑤（F5）V1 腿注第三轮投递态（起跑已投 ∥ `end` 未投——半轮）；
- ⑥（F6）L6 aborted 形新补（`digest.aborted` 文本 ∥ 追加位 = 当刻流末 ∥ 原起跑行不变——对位 V2 `ok:false` 档）；
- ⑦（F7）V1/V3 断言面限定痕元素族（他族合法移除明示不入断言面）；
- ⑧（F8）`TUI-SESSION-VIEW.md:23 ∥ :189` 撤「拟新增 / 新档」标记（规范面零残留；余存 = `:229` ∥ `:233` 变更记录）；
- ⑨（F9）`TUI.md:539` ∥ `WEBVIEW.md:226` 迟到面限定在册；`reclaim` 坐标全路径 `thincoder-cli/src/tui/suspension-drive.mjs:224` 对盘收正。
另核：批档所引四档坐标逐处仍在位（`TUI.md:535/538/539` ∥ `TUI-SESSION-VIEW.md:191` ∥ `WEBVIEW.md:209/225/226/471/472` ∥ `WEBVIEW-PROTOCOL.md:202/204/209`）；三档修复轮变更记录各一条（`TUI.md:900` ∥ `WEBVIEW.md:780` ∥ `TUI-SESSION-VIEW.md:229`）在盘；`WEBVIEW-PROTOCOL.md` 修复轮零改属实（末条 = 设计轮 `:518`）；四档新旧口径逐句自洽（行出即留 ∥ 到达序追加 ∥ 复列 = 全量 ∥ end 追加终态元素 ∥ 边界取面）。
受限：① 产品码 ∥ 行数读数 ∥ 符号名实读不在评审域（unverified——§2.4 现行/预期行数、`_digestRoundEl` 实符号、测试树清单均未对盘）；② 无 document map ⇒ 文档归属判据按 Project Guide + 档内单源句降级判断；③ 无项目标准档 ⇒ 方法学对照仅按 AGENTS.md。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria（腿面 `n` 维） | 🔵 | V1 腿（修复后）已注第三轮投递态，但期望数「计数 ×3 ∥ 终态元素 ×2」共同预设三轮 `n > 0`（守判 = `n > 0` 建计数元素 ∥ `n = 0` ⇒ end 零动作——`WEBVIEW.md:223` ∥ `WEBVIEW-PROTOCOL.md:202`/`:205`）——`n` 维未显式钉值 | 腿内补注夹具三轮均携 `n > 0`（或注明断言前提即夹具取值） |
| 2 | Acceptance criteria（`n = 0` 档覆盖） | 🔵 | 两端 `end` 落点本轮收正（就地换文 ∥ 族尾插点 ⇒ 追加）——`n = 0`（ask-only）零动作守判（同一分支内）无腿：CLI L2/L6 与 VSC V2 均为 `n > 0` 形 | 补 `n = 0` 负向一腿（end ⇒ 零新行/零新元素），或注明该档由既有用例/上抛④承接 |
| 3 | Clarity（符号名） | 🔵 | V3 腿断言面符号 `_digestRoundEls`（批档 §2.5）在四档规范面零出现——四档只用 `_digestRoundEl`（单数——`WEBVIEW.md:47` ∥ `:223` · `WEBVIEW-PROTOCOL.md:202`）；两名若同物 ⇒ 结构断言恒绿（假负）；码面不在评审域（unverified） | 腿内注明两名关系（族谱账删除面 ∥ 本轮元素引用保留面），或按盘上实读符号钉名 |

**域外注记（不给严重度；声明域外实据，供父侧文档层调度）**：
① 批档 §1 状态行现记「修复轮（发现 1–9）在派」，与 §2「修复轮已落」+ 本轮已开一拍滞后（发现 10 系父侧笔——本轮不判；`<§1 模板占位…>` 行 = 工具语义合法模板行）；状态行随本轮收口同拍推进即可。
② 声明排除项本轮零判：新面扩检 ∥ 产品码（实施批承接）∥ 未结轮三端差异（#771）∥ 桌面批文档（物归原批）。

**计数：🔴 0 ∥ 🟡 0 ∥ 🔵 3**
**VERDICT: pass**（前表发现 1–9 全数落地、无 🔴；🔵 不阻断）

## §4 用户批准（主 agent）

**代签（2026-10-01 · 承用户 08:21「CLI/VSC也跟。」+ 08:26 ∥ 08:29 全链授权——代签 ∥ 代派）**

**三条件齐备 ✓**：
1. **设计评审 pass** ✓（§3 轮次 1 = 0🔴 / 4🟡 / 6🔵；修复轮（发现 1–9）全落；**§3 轮次 2 = 0🔴 / 0🟡 / 3🔵 · VERDICT pass**——前表九条逐条核验落地）；
2. **修复轮已落地并核验** ✓（#18 九条全落；父侧抽检三处原文读回：`thincoder/docs/cli/design/TUI.md:538-539`（括注已删 ∥ 迟到面 = settle 锚位居位 ∥ `reclaim` 坐标全路径）∥ `thincoder/docs/vsc/design/WEBVIEW.md:225-226`（括注已删 ∥ 迟到面 = 族锚位居位）——与修复轮读回一致；**轮次 2 🔵×3 处置 = 随实施自洽**（V1 夹具注 `n > 0` ∥ 补 `n = 0` 负向腿 ∥ V3 断言符号按盘上实读钉名——腿内落，在册））；
3. **设计令牌已签发** ✓（**凭据值不落档**——沿纪律）。

**授权依据** = 用户 2026-10-01 08:21 + 08:26 ∥ 08:29 全链授权；**三自缚在册**（真分叉停 ∥ 新范围停 ∥ 破坏性停）。

**实施面** = §2.4：五产品档（`thincoder-cli/src/tui/{suspension-drive,conversation-writer,startup}.mjs` ∥ `thincoder-vscode/webview/{chat-status,activity}.js`）+ 批内件（L1–L6 ∥ V1–V4）+ 前批件 probe（改 ∥ 标注）；**下游随动** = `docs/core/design/API-CONTRACT.md` 重生成（`node scripts/api-contract.mjs --write`——生成器唯一笔 · **父侧直接执行面**，随实施落盘后同笔落）。**代签即派 eng-coder**（令牌入槽）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-10-01 · 内审 1 轮（divergence-found→已处置）+ 代码评审 1 轮（pass 0🔴/3🟡/4🔵）· 终态 = clean · 批内件 11/11 绿）

**交付摘要**：CLI ∥ VSC 两端自然形跟正落盘——两端退场机拆 ⇒ 行/元素**出即留**（不改 ∥ 不删 ∥ 不退场）；CLI **终态行 = `pushLine` 到达序追加于当刻流末**（族尾插点随拆 ∥ 零就地换文）；VSC **`end` = 新建 `.digest-status` + `digest-done`/`digest-failed` 元素 `appendChild`**（不动原计数元素 ∥ `n` 自本轮计数元素 `dataset.n` 取 ∥ `n = 0` 零动作守判保持）；CLI **复列 = 全量**（截点机拆——记录序 ≡ 恢复序）。记录面零动 ∥ i18n 零新键 ∥ 桌面/协议载荷/`clearDigest` 零触。

**逐档落点与行数对账（现行 ⇒ 实读 · 内容行数口径）**

| 档 | 现行 ⇒ 实读 | 落点 |
|---|---|---|
| `thincoder-cli/src/tui/suspension-drive.mjs` | 262 ⇒ **250** | `dropLines` 调用 ∥ `_digestRows` 行账 ∥ `insertLineAt` 插点拆；起跑行 `pushLine`（`:101`）∥ 终态行 `pushLine`（`:116`）到达序追加；注文收正 |
| `thincoder-cli/src/tui/conversation-writer.mjs` | 102 ⇒ **62** | `dropLines` ∥ `insertLineAt` 两件死亡码拆 + 死 import 清（`releaseLine`） |
| `thincoder-cli/src/tui/startup.mjs` | 344 ⇒ **321** | 截点机拆（`lastDigestRoundStart` ∥ `digestCut`）——复列逐记录（`:117-123`）；`historyToLines`/`restoreLines`/`createLoadOlder` 签名零改 |
| `thincoder-vscode/webview/chat-status.js` | 133 ⇒ **126** | 族谱账（`_digestRoundEls`）∥ 摘除循环拆；终态元素新建追加（`:111-123`）；`_digestBoundary` 写点 ∥ 取面零改 |
| `thincoder-vscode/webview/activity.js` | 188 ⇒ **188** | 注文随动（归档落位句 = 当刻流末（起跑刻语义）；`isDigestRow` 三族 class 注——逻辑零改） |
| 批内件 `docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs` | 新建 **492** | L1–L6 ∥ V1–V4 + `n = 0` 合并腿（L7 ∥ V5） |

**实跑命令与读数**（cwd = `thincoder/`）

- `node --test docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs` ⇒ **tests 11 ∥ pass 11 ∥ fail 0 ∥ 421ms**（L1–L6 ∥ V1–V4 ∥ L7∥V5）；读数留档 = `_nat_test_out.txt`（仓根，刷新于修复轮后）。
- 前批件复跑核（`docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`）：K1–K7 ∥ C1a ∥ C1c ∥ **C2**（本批收正后绿——旧轮痕行全量复列）∥ C3b ∥ C4 ∥ C5 绿；**C1b 挂起**（ContinueError 类身份跨解析路径分裂——`@thincoder/core` 经 node_modules 解析盘符与夹具 file-URL 大小写不一 ⇒ `instanceof` 恒 false ⇒ 落 retry 询问 await；夹具缺陷）；**C3 红**（同测试两段共享记录对象：段① `_startN` 预解析注记污染段②「无读口」负向断言；夹具缺陷）。两红均与本批 diff 无关（`agent-turn.mjs` ∥ `resolveSplitTerminalNs` 本批零触）。
- 源面零残留（定向 grep · CLI+VSC 全域）：`dropLines` ∥ `insertLineAt` ∥ `_digestRows` ∥ `lastDigestRoundStart` ∥ `digestCut` ∥ `_digestRoundEls` 零命中。
- **仓套件未跑**（沿批档 §2.8：父侧收口唯一一次）。

**审计与评审轮次（终态）**

| 轮 | 类型 | 读数 | 处置 |
|---|---|---|---|
| 内审 1 | explore 只读分歧审计（对设计单源逐项） | divergence-found（4 行：2🟡+2🔵——全在文档面/腿面；产品语义面 clean ∥ 零超范围） | R4 已闭（L5 扩记录四型形）；R1–R3 + 域外注记入报告 |
| 评审 1 | advisor 代码评审 | **pass**（🔴 0 ∥ 🟡 3（均非 must-fix）∥ 🔵 4） | 🟡#1 已修（L1 期望值取错记录）；#2/#3 在册债（越 300 建议线）；#4 日志刷新；#5–#7 登记 |

**fix round（自修 · 3 处）**

1. 内审 R4：腿 L5 由「记录两型」扩至**四型形零增键**（cap ∥ subagent 走 `lifecycle-records.mjs` 纯构造面——规避 #726 C1b 挂起面）⇒ 复跑 11/11 绿。
2. 评审 🟡#1：腿 L1 末轮期望值改取**末**条 end 记录（修前 `endRecOf` 取首条 ⇒ 第 2 轮期望秒值来自轮 1、墙钟不等即假红）⇒ 复跑 11/11 绿。
3. 评审 🔵#4：`_nat_test_out.txt` 刷新为现行 11 腿读数（原为 5 腿旧版）。

**决策透明表（实施轮自决——均在批档/设计授权内）**

| 决策 | 处置 | 依据 |
|---|---|---|
| L6 中止形夹具 | 中止径（`AbortError` ⇒ `outcome="stopped"`）替代 ContinueError 撞帽径 | 撞帽径类身份分裂 ⇒ 夹具级挂起（实测）；判据「outcome ≠ ok ⇒ aborted」不看因 |
| `n = 0` 负向腿 | 合并一腿（L7 ∥ V5——两端同判） | 修复轮 §3 轮次 2 发现② |
| V4 文面条款 | 不作散文锚断言；= live 面重放腿 + 报告定向 grep 读数 | 测试纪律（禁新散文锚）+ 批档 V4 本义 |
| 探针翻档 | 未动（跨批写闸拒 ⇒ 上抛；父侧裁「父侧代改」接手） | 机械闸 + 父侧回令 |

**遗留/上抛（父侧或后续批）**

- `docs/core/design/API-CONTRACT.md` 重生成：`:157-158` 两登记行（`dropLines` ∥ `insertLineAt`）随拆待删 ∥ `digestTurn` 登记坐标随漂——父侧直接执行面（`node scripts/api-contract.mjs --write`）。
- 文档面数值漂移：`TUI-SESSION-VIEW.md` §6 写点坐标（`:90-91`/`:99-100`）对盘现为 `suspension-drive.mjs:101`/`:116`；批档 §2.4 `conversation-writer` ≈72 ⇒ 62 ∥ 批内件 ≈350 ⇒ 492（其余四档兑现：250 ✓ ∥ 321 ✓ ∥ 126 ✓ ∥ 188 ✓）——按盘收正（文档层）。
- VSC 恢复面零实体（`record-restore` 零命中）——「复列 = 全量」于 VSC 为设计面，实施归 #726（批档上抛①）。
- 「零清理」限定：通用行预算裁（5000 行）仍可整体裁消化行（既存债，非本批引入）。

## §6 验证与收口（父代理）

**验证与收口（主 agent · 2026-10-01）**

**批内件（本批单元证据）**：`docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs`（493 行）——**11/11 绿**（父侧复跑实读 · 396ms）：L1 行出即留 ∥ L2 终态追加（点名腿）∥ L3 零清理负向锁 ∥ L4 复列全量 ∥ L5 记录面负向锁 ∥ L6 aborted 形 ∥ V1 元素出即留 ∥ V2 终态元素追加（点名腿）∥ V3 零清理负向锁 ∥ V4 复列重放 ∥ L7∥V5 `n = 0` 负向锁。

**跨批复核（父侧跑）**：`docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` ——收正两夹具后 **15/15 绿**：C1b = ContinueError 类身份分裂（盘符大小写 ⇒ ESM 双键——经 CLI 侧 junction 取类收正）∥ C3 = 段间回扫注记 `_startN` 污染（段② 独立副本 + 剥注记收正）——两处均**预先存在**、与本批 diff 无关（父侧直接执行；可 revert）。

**探针**：`docs/batches/2026-10-01-digest-row-current-only.probe.mjs` 四臂翻档（父侧代改——跨批写闸面）——实跑全绿（① ∥ ①b ∥ ①d ∥ ③ 自然形读数；①c ∥ ② ∥ ②b 保持）。

**工程面**：`docs/core/design/API-CONTRACT.md` 重生成——**OK**（2760 条 · 614 档 · 骨架零漂移；`--check` 绿——`createInfoFace` 两登记行随拆消解）。

**行数对账（实读回填）**：`suspension-drive.mjs` **250** ∥ `conversation-writer.mjs` **62**（估读 ≈72 偏高 10——#754 增量为纯追加、全拆后回落原档）∥ `startup.mjs` **321** ∥ `chat-status.js` **126** ∥ `activity.js` **188** ∥ 批内件 **493**——逐档实读在册（§2 随动块）。

**文档面**：实施后随动轮（eng-designer）——`TUI.md` ∥ `TUI-SESSION-VIEW.md` ∥ `WEBVIEW-PROTOCOL.md` 三处坐标对盘收正 + §2.4 值列回填（读回在册）；桌面档族随本批的收正（UI.md 对话流 digest 句 ∥ RENDERER.md 消化行规则）在设计轮在册。

**设计评审**：两轮 pass（§3 在册）；§4 授权 = 全链自动授权（用户 2026-10-01 令——代签在册）。

**零触面确认**：记录面（写点三处四调用点不动 ∥ 记录四型形零增键——腿 L5 机检）∥ 核件（`thincoder-core`）零改 ∥ 桌面码零改 ∥ 集成套件零触。

**收口测试线**：① 本批单元件 = 批内件（随本记录留存——零处置）；② 集成面 = 无新增 ∥ 无修订（真机观测 = 用户侧观察——沿三端先例）。

**遗留（另账在册）**：① VSC 恢复径实施归 #726（上抛①在册——「复列 = 全量」于 VSC 为设计面）；② `_nat_test_out.txt`（仓根日志——出清单项披露在册）；③ `digest.turnLabelAsk` VSC 字典缺键 → 台账 #775。

**状态行** → 已收口（本记录冻结）。
