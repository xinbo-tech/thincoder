# 2026-09-27 · 桌面首启引导 + 真机使用冒烟固化
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 16:47 人工走查报障（「完全没法输入」）+ 父侧真 Electron 实测定性（输入框未坏 · 缺陷 = 新装首启空态无引导 ✗ + 交付缺「真机使用冒烟」✗·用户明确要求「先跑实际使用冒烟再交」）。。
> 台账 = #454（`docs/desktop/requirements/PROJECT.md` · 归批）。前情 = docs/batches/2026-09-27-desktop-chat-panel-b.md §6（已收口 2026-09-27）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 条目与口径（父侧 · 2026-09-27 17:06 ✓）

**状态行** → 进行中 ✓（本批 = 新批新档 ✓——前批 `2026-09-27-desktop-chat-panel-b.md` 已收口冻结 ⇒ 新条目集 ⇒ 新批 ✓）。

**条目（四件 ✓·源 = 用户 16:47 报障 + 父侧实测）**：
- **① 首启引导** ✗：**无项目 / 无会话**两态各给**可操作引导**（能做即直连既有出口 `project:open` / `session:create` ✓·否则纯文本指引 ✓·**零假按钮** ✗）；
- **② 对话流空态分态** ✗：「**无会话**」≠「**本会话暂无消息**」✗（后者在"根本没有会话"时误导 ✓）；
- **③ 判据保留** ✓：「无会话 ⇒ 输入框 `disabled`」= 诚实态 ✓·**不削** ✓·只补引导 ✓；
- **④ 真机使用冒烟契约** ✗（**用户明确要求** ✓）：把实测序列写成**机检用例**（无会话 ⇒ `disabled` ∧ 引导在场 → 开项目 + 建会话 ⇒ `enabled` + `ready` → 键入逐字 → Enter ⇒ **通道被调**（"发送成功"不作断言 ✓）✓）。

**关键判据（父侧真 Electron 实测 · 逐步骤 ✓）**：`boot=ok` ✓ ⇒ 左列「未打开项目 / 打开目录… / 最近目录」⇒ 输入框 **`disabled=true`** ✗ ⇒ `project:open({path})` + `session:create` ⇒ **`disabled=false`** ✓ · `data-state=ready` ✓ ⇒ 键入 `"hello smoke"` 逐字 ✓ ⇒ Enter ⇒ `msg:send` 被调 ✓（回执 `provider-invalid` = 未配渠道的正确报错 ✓）⇒ **输入框本身未坏** ✓·缺 = 引导 ✗ + 交付缺真机冒烟 ✗。

**授权口径** ✓：用户 16:47 报障 + 07-27 02:18「你自动跑完吧」授权（点火 / 代签三条件自缚 ✓·**新范围 ⇒ 本批新档 ✓·不偷走前批令牌** ✓）；**用户要求入验收线** ✗：**凡改桌面可见面 ⇒ 须有一条真 Electron 使用面用例** ✓。

**依赖 / 输入** ✓：前批 B 已交付（`19dc77b9` ✓·165/165 ✓）；设计轮 #101 已落四档设计面（UI.md / RENDERER.md / PROJECT.md / E2E-TESTING.md ✓）；台账 **#454** ✓。

### 1.2 父侧两处更正与随动（2026-09-27 17:10 ✓）

**更正一（设计轮实读纠回 ✓）** ✗：§1.1 记「对话流空态文案『本会话暂无消息』在无会话时**误导**」✗ —— **与实读不符** ✓：`none` 态实为**零节点**（无该文案 ✓）；正确记法 = **无会话时对话流区零节点、零引导** ✓（「本会话暂无消息」= `no-message` 态文案，其自身无误 ✓）。**⇒ §1.1 该句以本块为准** ✓。
**随动一（需求档锚）** ✗：设计轮报「需求档无『首启空态引导』功能点 / 判据 ⇒ 回指链第三环缺位」✓ —— **已受理** ✓（父侧笔 ✓·落点 = `docs/desktop/requirements/PROJECT.md` ✓·台账 **#454** ✓）。
**裁一（其「只报不改 ③」）** ✓：**KD 编号不补** ✗ —— 四决策已在 `UI.md` §1 批 B 追加注 / `RENDERER.md` §1.1 **单源在册** ✓；KD 表 = **立批期口径** ✓ ⇒ 追加轮不占号 ✓（§2 按此写 ✓）。
**其余（② D11 漏「选工作目录」步 ✓·⑤ 真 Electron 就绪度风险 ✓·⑥ as-of 值口径 ✓）** ⇒ 随动 / 收口轮 ✓。

### 1.3 设计评审轮 1 裁定 + 修正轮（父侧 · 2026-09-27 17:35 ✓）

**评审轮 1 = `changes-required`** ✗（🔴2 · 🟡7 · 🔵5 = 14 条 ✓·发现表逐字在 §3 ✓——父侧实读复核 ✓·评审自报 §3 落档回执已验 ✓）。
**父侧复核（承宿主「0/5 引文不符」告警 ✓）** ✗：**告警为误报** ✓——承重引文经父侧逐条实读**原文在位** ✓（`docs/desktop/design/UI.md:68` · `docs/desktop/design/RENDERER.md:47/:55` · `docs/desktop/design/PROJECT.md:260/:313` · `docs/desktop/requirements/PROJECT.md:124/:177` · `docs/desktop/design/E2E-TESTING.md:95/:100/:105` ✓）；两条 🔴 的代码面承重事实亦独立复核为真 ✓（`thincoder-desktop/renderer/mount-sessions.mjs:28-39` = `project` 切片**唯一写路径** ✓ · `thincoder-desktop/renderer/app.mjs:124` 仅产品路随动 ✓ · `thincoder-desktop/src/main/ipc.mjs:95-104` 主侧零推送 ✓）。
**裁定** ✓：**14 条全数采纳** ✗——**#5 父侧自落** ✓（需求档变更记录补 D16 行 = `docs/desktop/requirements/PROJECT.md:178` ✓）；**#1–#4 / #6–#14 共 13 条 ⇒ 修正轮 #104** ✓（eng-designer · fix 轮 · 只修评审所指 ✗ · 不动产品 / 测试码 ✓ · 派单六字段规范名 ✓）。
**台账** ✗：评审域外注 §3.5 重号 ⇒ **#455**（tech_todo · 归批 ✓）。
**下一步** ✓：修正落地 ⇒ 父侧核验 ⇒ **评审轮 2** ⇒ pass ⇒ §4 代签（三条件齐备才签 ✓）⇒ 实施轮 ⇒ **真机冒烟（父侧亲跑 ✓）**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（实施后对账轮 · §2.12（设计档按盘回填 · 五档变更记录已闭合该明细指针））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批一句话**：桌面端首启空态引导（无项目 / 无会话两态可操作 · 零假按钮）+ 空态分态 + 真机使用冒烟契约 `T-DSK32`；设计落盘 = 批 B 追加轮。本节 = 覆盖条目 / 判据线 / 落点 / 文件面 / 三链回指 / 决策 / 上抛。

### 2.1 本批覆盖条目（四件）

- **① 首启引导**（口径）：新装首启（无项目 / 无会话）⇒ 对话流区给可操作引导——`no-project` ⇒ 内含 `button[data-action="project:open"]`；开项目 ⇒
  换档 `no-session` ⇒ 内含 `button[data-action="session:create"]`；每码 **动作控件在场 ⟺ 句柄在场**（零假按钮）。
  **判据线**：`[data-slot="flow"]` 内两 `data-guide` 码在场 + 内含对应动作控件；退场转场同序核（`E2E-TESTING.md` §3.5 第 3 / 5 / 6 步）。
  **单源** = `UI.md` §1 批 B 追加注项 1 · `RENDERER.md` §1.1 引导节点条。
- **② 空态分态**（口径）：`none`（无活动会话）⇒ 对话流**零节点**（不出「本会话暂无消息」误导文案）；有会话零块 ⇒ `no-message`
  **复用既有空态节点**（词 `chat.empty.hint` 不变 · 零动作控件）。
  **判据线**：`none` 帧 `data-blocks === 0` ∧ 零节点；建会话 ⇒ `data-state` `none` → `empty` ∧ `[data-guide="no-message"]` 在场。
  **单源** = 同上（判据四值 = `chatModel.guide`）。
- **③ 判据保留**（口径）：输入框 `disabled` 恒 ⟺ 无活动会话——引导在场**不**解除禁用。
  **判据线**：无会话 ⇒ `disabled` 真；建会话 ⇒ 撤（`E2E-TESTING.md` §3.5 第 4 / 8 步）。
  **单源** = 输入区两态口径（`UI.md` §1 输入区行）。
- **④ 真机使用冒烟契约**（口径）：`T-DSK32` 十一序常驻用例（真 Electron · 零 provider · 零出网）。
  **判据线**：`test/integration/first-run-smoke.test.mjs` 全绿——十一序逐步断言 + `pageerror` 空 + 输入值逐字保留 + `data-blocks === 0`。
  **单源** = `E2E-TESTING.md` §3.5 · `PROJECT.md` §7 `T-DSK32` 行。

### 2.2 不在本批（边界）

- **真实模型回路「发送成功」面**——零 provider 面即判据（发送必败）；不出网、不押真实模型（`E2E-TESTING.md` §3.5 边界段）。
- **引导面不另立样式档**——视觉沿用现盘 `.chat-empty` 面（零新样式体系）。
- **需求档补条目** = 父侧随动项（已落 ⇒ 见 2.6 / 2.8）。
- **`T-DSK27b–d`**（E2E 边界 / 错误三例）存量不做。

### 2.3 设计档落点（本批 · 已落盘）

| 档 | 落点 |
|---|---|
| `docs/desktop/design/UI.md` | §1「批 B 追加注」（引导三码 · 控件在场律 · 空态分态 · 词键两枚 + 计数随动）+ 四行就地指针 + 档头 D 号随动 |
| `docs/desktop/design/RENDERER.md` | §1.1 引导节点条（位次 · 判据四值 · 在场律 · 挂载键 `project`）+ 关标签随动收正 + 档头 D 号随动 |
| `docs/desktop/design/E2E-TESTING.md` | §3.5（用例 2 · 十一序）/ §3.4（同径注）/ §4（新档行）/ §6（`T-DSK32` 行）/ §7（按批限定） |
| `docs/desktop/design/PROJECT.md` | §4.1（值列收正 + 新档三行）/ §6.1（**D16 回指行** + 表头 `D1–D16`）/ §7（`T-DSK32`）/ §8 / §9 / §10 Z / §4.2 |
| `docs/desktop/design/IPC.md` | **零新通道**（引符号不引行号）+ 档头 D 号随动 |
| `docs/desktop/design/SHELL.md` | 档头 D 号随动（D16 补锚同笔） |

### 2.4 机制五项 + 词键账

1. **节点位次**（`RENDERER.md` §1.1）：`none` 帧 = 根**唯一子** · `empty` 帧 = **首子** · `flow` 帧 = 不在场；零 `data-block-id` ⇒ 不入块序（根子序与 `data-blocks` 不变式不受影响）。
2. **判据四值纯函数**（`chatModel.guide`）：无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
3. **动作控件在场律**：`onOpenDir` / `onNewSession` 缺 ⇒ 整控件缺席（比接线形通则更严——零假按钮）。
4. **接线**：`app.mjs` 重挂键集增 `"project"`；`chat.mjs` 只出判据 + 引调（构树出档 `views/chat-guide.mjs`）；输入框 `disabled` 判据不动。
5. **词键账**：新增 `chat.guide.noProject` / `chat.guide.noSession`（两语各一 · 共 2 键）；总键 **122 ⇒ 124** · 对话流桶 **8 ⇒ 10**——单源 =
   `test/views-chrome-vocab.test.mjs`（用例名 / 分项串 / 全消费断言 / 单词表四处同笔）。

### 2.5 文件与测试面（估值口径 · 实施期实读为准）

新档三（待实施）：`renderer/views/chat-guide.mjs` 0 ⇒ **~50**（内容行数 · 零 `store.mjs` import · 句柄注入）·
`test/views-chat-guide.test.mjs` 0 ⇒ **~70** · `test/integration/first-run-smoke.test.mjs` 0 ⇒ **~140**（集成域 · `T-DSK32`）。

| 受影响文件 | 现值 ⇒ 估后 | 要点 |
|---|---|---|
| `thincoder-desktop/renderer/views/chat.mjs` | **292 ⇒ 290** | 净 −2（空态构树外提）· 贴 300 层余 10 |
| `thincoder-desktop/renderer/app.mjs` | **243 ⇒ 247** | 挂载键集增 `"project"` |
| `thincoder-desktop/renderer/i18n.mjs` | **356 ⇒ 360** | 增两键（两语）· 越 300 在册（预案见设计档 §4.1） |
| `thincoder-desktop/test/files.mjs` | **19 ⇒ 21** | 两新档登册 + 两向自检 |
| `thincoder-desktop/test/views-chrome-vocab.test.mjs` | **291** | 词表计数四处同笔（122 / 124 · 8 / 10） |

用例模块 **三十四 ⇒ 三十五档**（计数与列举同笔 · 单源 = 设计档 §4.1）。

### 2.6 验收回指（三链同源）

| 本批条目 | 需求档条目 | 设计档回指行 | 用例 |
|---|---|---|---|
| ①②③ | `docs/desktop/requirements/PROJECT.md` §4 **D16**（首启空态引导）；③ 另锚 §3.3 首启链（选工作目录 ⇒ 可用） | `PROJECT.md` §6.1 **D16 行**（本轮补锚）+ **D11** 行 | `T-DSK32` · `test/views-chat-guide.test.mjs` |
| ④ | 需求 §4 **D16** 末句（凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例）+ **D14** | `PROJECT.md` §6.1 **D14 / D16** 行 · §7 `T-DSK32` 行 | `T-DSK32`（十一序） |

### 2.7 关键决策（单源 = `UI.md` / `RENDERER.md` 现文；KD 编号不补号——立批期口径 · 父侧裁）

1. **引导落点 = 对话流区节点**（非左列 / 非模态向导）。被否：左列加引导（左列已是项目 / 会话面 · 职责重）· 模态向导（阻断流面 · 与 D11 向导面混淆）。
2. **`no-message` 复用既有空态节点**（词 `chat.empty.hint` 不变 · 零动作控件）。被否：另立 `chat.guide.noMessage` 新键（词键账虚增 · 语义重复）。
3. **输入框 `disabled` 判据不动**（恒 ⟺ 无活动会话）。被否：引导在场解除禁用（造「能键入不能发」的假可操作面）。
4. **引导动作走既有通道**（`project:open` / `session:create` · 零新 IPC）。被否：引导专用通道（第二消费面 · 破单一权威源）。
5. **判定 = 四值纯函数**（非状态机 / 非事件驱动）。被否：状态机（携状态 · 与单状态树重复）。

### 2.8 上抛与报告项

1. **D16 回指锚补（本轮已落 · 父侧裁定）**：需求档 D16 与设计 §6.1 行数差 ⇒ 补 **D16 行** + 表头 `D1–D16`；**同族书证随动**（D 号口径「诸处同改」）＝
   `PROJECT.md` 档头 `:6` · §4.2 `IPC.md` 行 `:218` · 另四档档头（`IPC.md` / `RENDERER.md` / `SHELL.md` / `UI.md`）——零新语义 · 单 token 可逆。
2. **台账 #454**：需求档 D16 已落 ⇒ `req_doc` 仍 `null`、状态仍 `待讨论`（台账写面 = 父侧）⇒ 待父侧随动收正。
3. **`SHELL.md` 模块树 / 计数未含两枚拟新增档**（`renderer/views/chat-guide.mjs` · `test/views-chat-guide.test.mjs`；**在盘 34 档 ∥ 设计档 §4.1 含待实施 35 档**）——
   口径差 · 本轮**未改**（非本批笔面）⇒ 建议随实施后收正轮同步。
4. **行数与计数 = 估值口径**：`~50` / `~70` / `~140` · `292 ⇒ 290` / `243 ⇒ 247` / `356 ⇒ 360` / `19 ⇒ 21` / `122 ⇒ 124` / `34 ⇒ 35` 皆立批期读数，实施期实读为准。
5. **unverified**：`views-chrome-vocab.test.mjs` 词表「四处同笔」的逐处落点未逐行复核（实施期按现文四扫）· `T-DSK32` 用例档 `~140` 行为预算非实读。

### 2.9 机检收尾（行宽切行 · 锚面归属核实 · 零语义）

**判明**：本批在途行两机检面全清——**闸态类零新增**（全仓闸态悬空 48 条与行宽余量 34 行全在域外 `docs/core` / `docs/vsc`；桌面域自身 0 条闸态项）。

**① 切行台账（本轮 4 处 · 一次批量 edit · 仅断行 + 续行缩进 ⇒ 零 token 增删）**：

| 档 | 现位 | 原长 ⇒ 两行（切后实测） | 续行样式 |
|---|---|---|---|
| `docs/desktop/design/PROJECT.md` | 175–176 | 492 ⇒ 214 / 280 | 2 空格缩进 |
| `docs/desktop/design/RENDERER.md` | 46–47 | 328 ⇒ 142 / 188 | 2 空格缩进 |
| `docs/desktop/design/E2E-TESTING.md` | 108–109 | 379 ⇒ 248 / 133 | 2 空格 + `∧` 续行 |
| `docs/desktop/design/E2E-TESTING.md` | 197–198 | 386 ⇒ 232 / 155 | 2 空格 + `·` 续行 |

行宽读数：**38 ⇒ 34 行**（桌面域 **15 ⇒ 11**）。

**② 行宽面归属（桌面域余 11 行 · 存量 · 只报不动）**：

| 档 | 行（长） | 判据 |
|---|---|---|
| `docs/desktop/design/IPC.md` | 24(325) · 178(437) · 229(393) · 230(330) | 在途 diff 仅档头一行 ⇒ 四行皆存量 |
| `docs/desktop/design/PROJECT.md` | 330(480) · 518(545) · 519(347) | `git blame` 逐行实核 = 已提交（`:330` = 批 B 用例号归属行 · `:518/:519` = 批 B 收口轮记录行） |
| `docs/desktop/design/SHELL.md` | 46(353) · 58(302) · 59(338) · 158(497) | 同 `IPC.md`（在途仅档头） |

**③ 锚面归属（桌面域悬空 20 条 · 全数带「（拟新增）」标记 ⇒ 列报 · 不入闸）**：

- 在途 **6 行 7 条**（本批内容 · `git blame` / 在途 diff 实核）：`PROJECT.md` `:130` / `:152`（chat-guide）· `:167`（queue）· `:520`×2（见观察 1）· `RENDERER.md` `:59` · `UI.md` `:66`。
- 存量 **13 条**（已提交 · 只报不动）：`PROJECT.md` `:97` · `:129` · `:166` · `:232` · `:404` · `:449`×2 · `:453` · `:492` · `SHELL.md` `:118` · `:131`×2 · `:139`。
- 口径注：`PROJECT.md:156`（`test/views-chat-guide.test.mjs`）属**用例号类**、本轮无悬空行——与「用例号类全仓悬空 0」一致。

**④ 报告面（不入闸 · 只报不动）**：符号·宽桌面域 35 条（含本批新号 `T-DSK32` 9 条）；符号·窄全仓悬空 1 条 = `docs/core/design/MODEL-SPECS.md:323`（域外）。

**⑤ 观察（只报不动）**：

1. `PROJECT.md:520` 的 `test/files.mjs` token 盘上存在（`thincoder-desktop/test/files.mjs`）却判悬空——成因 = 三档同名（`thincoder` / `thincoder-desktop` / `thincoder-vscode` 各有 `test/files.mjs`）⇒ 解析不唯一；该行带标记 ⇒ 列报不入闸；消解选项 = 改带路径全名（零语义 · 随下次触碰该档的轮次落地）。
2. 域外存量（`docs/core` / `docs/vsc`）：闸态悬空 48 条 + 行宽 19 / 4 行 ⇒ 本批不动，供父侧排程。

**⑥ 读数（本轮实核 · 全量跑 + log 过滤）**：候选 27538 · 悬空 48 · 注记豁免 82 · 拟新增 34 · 迁移期引文 216 · 行宽 34 · EXIT 1（域外存量所致）。

### 2.10 修正轮（#104）逐号落点 —— 设计评审 §3 轮次 1 十四条（父侧全裁采纳）

**#5 = 父侧自落**（需求档变更记录 D16 行；§1.3 已记）⇒ 本侧落地 **13 条**（#1–#4、#6–#14）。下表 = 逐号落点（引符号不引行号；四档同刻迭代）：

| # | 落点 | 改动 |
|---|---|---|
| 1 | `docs/desktop/design/E2E-TESTING.md` §3.5 | **驱动面重定**（十一序 ⇒ **十二序**）：桥直调两段（`project:open` 直调 + `no-session` 断言）删除。新序 = ①夹具（临时家 + `PROJ` + **预置会话槽族档一枚**〔40 位哈希族 · `cwd`=PROJ；形式单源 = 核写面物化形 · 族判据 = `GROUP_RE`；读面口径 = `docs/desktop/design/IPC.md` §2 项目面注项 4——位次 = 最近写入 · 零新存储；先例 = `thincoder-desktop/test/projects.test.mjs` 手写族档〕）②boot 等落位 ⇒ 断言 `ok` + 骨架三锚 ③**向导退场真点**（零配置 ⇒ 向导占 `[data-slot="settings"]` 槽；退场控件 = `button[data-action="settings:close"]`）④`no-project` + 含 `project:open` 控件 + 输入框 `disabled` ⑤等左列最近目录项（`[data-slot="projects"] [data-action="project:open"][data-path]`）⑥**真点**最近目录项（产品路 = `openDir` + `resumeOpened`）⇒ 实落 **`no-message`** + enabled（对「续会话 / 新分配」两况皆稳）⑦引导换档断言（`no-message` 零动作控件）⑧**真点**关唯一标签 ⇒ **`no-session`** + disabled（零位标 ⇒ 直关）⑨**真点**引导面 `session:create`（可操作旁证）⇒ `no-message` + enabled ⑩键入 + Enter ⑪console `provider-invalid` + 值逐字 + `data-blocks=0` ⑫close + 零 pageerror；**作用域限定必需**（同页多枚 `project:open`）成文 · 边界段补「无 `data-path` 形走原生对话框 ⇒ 维持在场断言」 |
| 2 | `docs/desktop/design/PROJECT.md` §6.1 **D16 行** | `none` 态记法 ⇒「**零块节点 + 引导节点**（`data-guide`）」+ 机检面补 `thincoder-desktop/test/views-chat-guide.test.mjs`（拟新增）与集成用例 |
| 3 | 失效表达收正（四档） | `docs/desktop/design/PROJECT.md` §7 ⑥件机检面（`none` ⇒ 零块节点 + 引导节点 `data-guide="no-session"`）· `docs/desktop/design/RENDERER.md` §1.1 帧尾态刷条（`none` 态零块节点不破）· `docs/desktop/design/UI.md` 批 B 追加注前言（`none` 态**无引导节点**〔零块节点〕）——同族残留，扫出即修 |
| 4 | `docs/desktop/design/PROJECT.md` §8 不做行 | 「需求档补条目（…只登记不改）」⇒「**已落**（需求档 **D16**）」 |
| 6 | `docs/desktop/design/PROJECT.md` §4.1 用例模块行 | 说明列补随动两笔：`views-chrome-vocab.test.mjs` **291 ⇒ ~297**（零 CJK 扫描名单增 `views/chat-guide.mjs` · 用例名档数同笔 · 夹具补 `chatModel` 两码态树入量）· `host-floor.test.mjs` **292 ⇒ ~294**（`fresh` ≤300 臂清单增该档） |
| 7 | 同上（`host-floor` 笔） | 同 #6 行内（`fresh` 臂清单 +1 ⇒ 292 ⇒ ~294；新档 ≤300 ⇒ 无需例外注册） |
| 8 | `docs/desktop/design/RENDERER.md` §1.1 帧尾态刷条 | 成员点名**引导节点**（判据 = `model.guide` 空否；`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘）——与「`flow` 帧不在场」不再相抵 |
| 9 | `docs/desktop/design/E2E-TESTING.md` §3.5 第 2 步 | 按本档就绪判据改写：等 `dataset.boot ∈ {ok, error}` **落位** ⇒ 再断言 `=== "ok"` |
| 10 | 同上（#1 重写内） | `IPC.md` 行号引注消解 ⇒ 引符号不引行号（载荷形单源 = `docs/desktop/design/IPC.md` §2 项目面注） |
| 11 | `docs/desktop/design/E2E-TESTING.md` §3.4 | 「只读既有契约面…零新 DOM 锚」⇒「**零新通道**；断言只读既有契约面 + **本批登记锚** `data-guide`」 |
| 12 | `docs/desktop/design/PROJECT.md` §4.1 `views/chat.mjs` 行 | 值列「290（…余 10 行）」⇒「**292**（批 B 末实读；改动后仍不越 300）」；说明尾「净 −2 ⇒ 避越 300」⇒「空态构树外提——不越 300」 |
| 13 | `docs/desktop/design/E2E-TESTING.md` §3.5 第 9 步 | 引导面 `session:create` 真点（旁证）；`project:open` 无 `data-path` 形维持在场断言 |
| 14 | `docs/desktop/design/PROJECT.md` §6.1 D16 行 | 同 #2（验证面补 `views-chat-guide.test.mjs`） |

四档变更记录各追加**修正轮一行**（记录面只追加）。

**被取代条目覆盖声明**（本轮修正对 §2 前块的取代；旧行保留不改）：

- **§2.1 ①**（口径「开项目 ⇒ 换档 `no-session`」）⇒ 由本块覆盖：真点产品路开项目**实落 `no-message`**（续会话 / 新分配两况同落）；`no-session` 改由**关唯一标签路**核（新序第 8 步）。
- **§2.3 落点表**（E2E §3.5 十一序）⇒ 以本块 #1 为准（十二序）。
- **§2.5 行**（`views/chat.mjs`「净 −2 / 余 10 行」方向断言）⇒ 以本块 #12 为准。

**修正轮新增设计事实（三 · 实施者须依此）**：

1. **向导退场** = 零配置 fixture 下向导树占 `[data-slot="settings"]` 槽（窗口级 `position: fixed` 覆盖层面）⇒ 真点前必须**真点**退场控件 `button[data-action="settings:close"]`（退场旗 `dismissed` 归状态树 · 关后不回占）；**不改零配置 fixture**。
2. **夹具族档** = 预置 40 位哈希族档一枚（`cwd` = `PROJ`；零新存储 / 零新核缝）⇒ 左列最近目录项在场 ⇒ 真点最近项即走**渲染面产品路**开项目（`openDir` + `resumeOpened`）。
3. **关唯一标签 = 直关**（零位标 ⇒ `needsCloseConfirm` 不命中 ⇒ 无确认面）——真机可行。

**同族残留两笔（一致性面 · 扫出即修 · 记录于此）**：

- `docs/desktop/design/PROJECT.md` §4.1 用例模块行：**名序错位**——`views-chat-guide` 混排在名序中段，而值列按 `thincoder-desktop/test/files.mjs` 登记序（新档末位）排 ⇒ 名序与值列错位一格（证据 = `views-question` **359** / `settings` **300** / `providers` **263** / `views-settings` **446** 四值仅在「新档归末位」下同落）；已把该档名移回末位（**值列表零改**），「名序 = `files.mjs` 同序」恢复。
- 同行 `views-chrome-vocab.test.mjs`「本档落 258」与 §4.1 收口轮实读 **291** 相抵 ⇒ 收正为 291。

### 2.11 注记修正轮（#106）—— 设计评审 §3 轮次 2 注记三条（N1–N3 · 父侧受理）

**范围**：设计面就地收正（N1 两处 / N2 / N3）+ 本档 append-only ⇒ 本块覆盖（§2.1 ④ / §2.6 内旧行保留不改）；三条皆注记级——不涉实施契约、不阻塞实施（§4 裁定）。

**被取代条目覆盖声明**（本块对 §2 前块的取代）：

- **§2.1 ④ / §2.6** 内「十一序」记法（「`T-DSK32` 十一序常驻用例」「十一序逐步断言」「`T-DSK32`（十一序）」）⇒ 由本块覆盖：**一律读作「十二序」**——单源 = `docs/desktop/design/E2E-TESTING.md` §3.5（用例 2 的执行序 · 十二序）。
- **§2.3 落点表**（E2E §3.5 十一序）⇒ 由 §2.10 块覆盖（以该块 #1 为准）——本块不重复覆盖。

**设计面就地收正（三条落点）**：

- **N1**：`docs/desktop/design/PROJECT.md` §4.1 集成行「形态与**十二序**断言单源」· §4.2 `E2E-TESTING.md` 行「§3.5 T-DSK32 **十二序**」（单源 = 同上）。
- **N2**：同档 §4.1 贴 300 层行数值收正 = **292**（`thincoder-desktop/renderer/views/chat.mjs` · 批 B 末实读）。
- **N3**：`docs/desktop/design/E2E-TESTING.md` §3.2 fixture 行加用例面限定——「唯一预置内容」= **用例 1 面；用例 2 见 §3.5**。
- 两档变更记录各补一行（#106——记录面只追加）。

**记录口径一致**：`docs/desktop/design/PROJECT.md` 变更记录「集成行『十一序 ⇒ 十二序』」声明项 ⇒ 实文随上对齐（声明与实文一致）。

**机检读数**（`node scripts/doc-check.mjs --root .` · 落笔前 ⇒ 落笔后）：候选 27564 ⇒ 27569 · 悬空 51 ⇒ 51 · 行宽 35 ⇒ 35——本批面（#106）零新增。
**观察（只报不动）**：桌面域闸态三条（`docs/desktop/design/E2E-TESTING.md` §3.5 第 4 步 · `docs/desktop/design/PROJECT.md` 用例模块行两处——均指拟新增档 `chat-guide.mjs` 引注）——非本舱（#106）引入；只报不动（修法 = 三处补「（拟新增）」标记 ⇒ 列报 · 不入闸；或实施后该档在盘自消解）。

**不涉**：产品码 / 测试码 / 需求档零触碰；零新语义。

**扫面同族残留一笔（一致性面 · 扫出即修 · 记录于此）**：§2.2 随动四档表内「§3.5（用例 2 · 十一序）」（N1 / §4 五处名单外的同族残留）⇒ 由本块覆盖：同读作「十二序」（同 §2.11 覆盖口径）。

### 2.12 实施后对账轮（#107）—— 设计档按盘回填 · 机检复跑 · 零语义收尾

**范围**：设计面五档（`docs/desktop/design/PROJECT.md` / `SHELL.md` / `RENDERER.md` / `UI.md` / `E2E-TESTING.md` 变更记录）+ 本档 append-only。产品码 / 测试码 / 需求档零触碰。
**动因**：§5 披露「out-of-scope 三笔」前两笔（设计档数值列 / `SHELL.md` 模块树）+ 批 B 追加轮实施落盘后档面与盘上实读的口径差（父侧发起 · 本舱执行）。

**逐项落点（定点五件）**：

1. **`docs/desktop/design/PROJECT.md` §4.1 值列按盘回填**：`thincoder-desktop/renderer/app.mjs` **247** · `thincoder-desktop/renderer/i18n.mjs` **363** · `thincoder-desktop/renderer/views/chat.mjs` **299**（批 B 末 292）· 集成行 `thincoder-desktop/test/integration/first-run-smoke.test.mjs` **171** · 新档两行去「（拟新增）」（`views/chat-guide.mjs` **54** / `test/views-chat-guide.test.mjs` **110**）· `thincoder-desktop/test/files.mjs` **19**（两新档名打包入既有行 ⇒ 净 0）· 随动两笔（`views-chrome-vocab.test.mjs` **298** · `host-floor.test.mjs` **294**）· 另触碰三档入表（`views-chat.test.mjs` 265 / `views-chat-frame.test.mjs` 185 / `views-tabbar-close.test.mjs` 317）· 越 300 段表头（:165）改 as-of 口径「批 B 追加轮实读（未触碰者承批 B 末实读）」· §6.1 D16 行与 §7 T-DSK32 / T-DSK3 注机检面标记收正。值口径 = 行计数（`wc -l` 同径）——逐项按盘复验命中。
2. **`docs/desktop/design/SHELL.md` §1 树补档 + 计数**：`views/` 行补 `chat-guide.mjs`（**54**——追加轮实读）· `test/` 行用例模块 **三十四 ⇒ 三十五档**（名单补 `views-chat-guide`——名序同 `thincoder-desktop/test/files.mjs` 现值 · 逐名核对）· 集成域两行并一处。
3. **`docs/desktop/design/PROJECT.md` §7 U 账**：补批 B 追加轮用例号归属 **U151**（引导面用例族 = `thincoder-desktop/test/views-chat-guide.test.mjs`——自铸披露）· U 账段行拆三行（480 ⇒ ≤300，零语义）。
4. **本块（§2.12）落档**——五档变更记录所指「明细 = 本批 §2.12」由本块闭合。
5. **doc-check 复跑**（`node scripts/doc-check.mjs` · thincoder 根）：本轮起点 **悬空 48 · 拟新增 29 · 行宽 35** ⇒ 主编辑后 49 / 29 / 33 ⇒ 收尾后 **悬空 48 · 拟新增 28 · 行宽 31**（候选 27580 三读恒定 · exit 1 不变——闸态 = 存量面，见列报）。**桌面域闸态悬空归零**。

**覆盖声明（append-only · 对 §2 前块取代 · 收编 §5 out-of-scope ①）**：

- **§2.1 ②** 内「`none` ⇒ 对话流零节点」旧记法 ⇒ 由本块覆盖：**一律读作「零块节点（`data-blocks === 0`）∧ 引导节点在场」**——单源 = `docs/desktop/design/RENDERER.md` §1.1 引导节点条 · `docs/desktop/design/UI.md` §1 批 B 追加注项 1/2（判据四值 = `thincoder-desktop/renderer/views/chat.mjs` 的 `chatModel.guide`）。

**收尾零语义修正三笔（超出定点五件 · 逐笔列报）**：

- `docs/desktop/design/SHELL.md:160`（本轮新增变更记录行 · 330 字符）⇒ 分句拆两行（:161 / :162）；
- `docs/desktop/design/SHELL.md:59`（用例名单条 · 316 字符）⇒ 三分句（:59 / :60——名序不变）；
- `docs/desktop/design/PROJECT.md:532` / `:524` 裸 `test/files.mjs` ⇒ 全路径 `thincoder-desktop/test/files.mjs`（§2.9 观察 1 已裁消解法 · 随本触碰轮落地——闸态悬空由此归零）。
  三笔皆零语义（行式 / 引注形态）。

**列报（只报不动）**：

- 桌面域存量行宽 8 行（本轮未触碰面）：`IPC.md` :24 / :178 / :229 / :230 · `PROJECT.md` :522 / :523 · `SHELL.md` :46 / :159。
- 报告面符号条（不入闸）：`E2E-TESTING.md` :160 / :167 · `RENDERER.md` :28–30 · `UI.md` :96 等（符号·宽——报告面）。
- 桌面域「拟新增」列报 13 条（不入闸）：`PROJECT.md` :97 / :129 / :166 / :167 / :232 / :408 / :453 / :457 / :496 · `SHELL.md` :119 / :132 / :132 / :140。
- 仓库全量：悬空 48（主为 `docs/core/**` 存量 · 非本舱面）· 行宽 31 · 拟新增 28。
- 需求档 P4 面 = 归主代理（本轮零触碰）。

**不涉**：产品码 / 测试码 / 需求档零触碰；零新语义。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（对象 = 桌面端首启空态引导四件 + 真机使用冒烟契约 T-DSK32）** · 证据面 = 评审文档面四档 + 需求档 + 本批档；代码面仅按「受影响文件行数抽核 + 机制可达性核」读取；无 Project Standards 档、无文档地图（两处判据降级已声明）。

抽核结果（现值注解）：`renderer/views/chat.mjs` 292 ✓ · `renderer/app.mjs` 243 ✓ · `renderer/i18n.mjs` 356 ✓ · `test/files.mjs` 19 ✓ · `test/views-chrome-vocab.test.mjs` 291 ✓（皆内容行数口径）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance · Feasibility | 🔴 | E2E §3.5 第 5–6 步（`docs/desktop/design/E2E-TESTING.md:103-104`）以「桥直调 `project:open` ⇒ 等 `[data-guide="no-session"]` 在场」为判据，但渲染面 `project` 切片唯一写者 = `refreshRail()`（`thincoder-desktop/renderer/mount-sessions.mjs:28-39`，读 `project:recent`），`project:open` 之后调它的只有产品路 `openDir()`（`thincoder-desktop/renderer/app.mjs:120-129`）；主侧处理体只改内存 cwd 并回执（`thincoder-desktop/src/main/ipc.mjs:95-104` · `thincoder-desktop/src/main/projects.mjs:114-117`），无推送；订阅白名单十通道无项目面事件（`thincoder-desktop/src/preload/preload.cjs:30-32` · `thincoder-desktop/renderer/events-subscribe.mjs:18-21`）⇒ `page.evaluate` 直调不留任何随动（零切片写、零重绘），`data-guide` 仍 `no-project`，第 6 步断言必红——D16 唯一机检面（`docs/desktop/design/PROJECT.md:260` · `:319`）落不了地。 | 重定该步驱动面：或走渲染面出口的那一路（可注入路径）并以「无活动会话」前置构造该态；或经「关唯一标签 ⇒ 页随动」路核 `no-session`（`docs/desktop/design/PROJECT.md:313` T-DSK26 ②）；若要保留桥直调步，须同笔给出「`project:open` ⇒ 项目面刷新」的接线落点与归口档。另：产品正路 `openDir(path)` 紧跟 `resumeOpened()`（`thincoder-desktop/renderer/app.mjs:125` · `thincoder-desktop/renderer/mount-sessions.mjs:90-97`）⇒ 首启开项目实际落 `no-message`，与批档 §2.1 ① 「开项目 ⇒ 换档 `no-session`」口径须一并对齐。 |
| 2 | Document ownership | 🔴 | 同一机制两处两说法：`docs/desktop/design/PROJECT.md:260`（D16 行）写「空态分态（`none` ⇒ 零节点 …）」，而同档 `:313`（T-DSK26 ②）与 `docs/desktop/design/UI.md:19` · `docs/desktop/design/RENDERER.md:47` 均写「`none` ⇒ 零块节点 + 引导节点」——本批正是把 `none` 帧由「零节点」改为「零块 + 引导节点」，D16 验收行留旧记法，实施 / 复核面可据此把引导节点从 `none` 帧删回缺口态。 | 按形态单源（`docs/desktop/design/UI.md` §1 批 B 追加注项 1）把 D16 行收正为「`none` ⇒ 零块节点 + 引导节点（`data-guide`）」，与 `:313` 同形；同族残留同笔（见下条）。 |
| 3 | Doc hygiene | 🟡 | 被本批作废的记法仍留规范面：`docs/desktop/design/PROJECT.md:201`（「关唯一 ⇒ 关页 `none` 零节点」）· `docs/desktop/design/RENDERER.md:55`（「`none` 态零节点化不破」）。旧表述留在规范面会被当活判据读。 | 两处收正为「零块节点（+ 引导节点）」；沿 `:313` 已收正同笔，旧记法规范面删除。 |
| 4 | Document ownership | 🟡 | 边界行陈述已不成立：`docs/desktop/design/PROJECT.md:351` 记「需求档补条目…需求侧无『首启空白态引导』功能点——只登记不改」，而 `docs/desktop/requirements/PROJECT.md:124` 已有 **D16**（批档 §1.2 记「已受理 · 父侧笔」）⇒ 读该行会判需求侧仍无此条目。 | 该分句改述为「需求档 D16 已落」或删；与批档 §2.2「需求档补条目 = 已落」口径对齐。 |
| 5 | Document ownership | 🟡 | `docs/desktop/requirements/PROJECT.md:177` 变更记录只记 D15 入册（括注「D 表 = D1–D15」），D16 落笔无记录条目，而表内 `:124` 已含 D16 ⇒ 记录面与规范面不一致（读记录面会判 D16 未入册）。 | 需求档变更记录补 D16 入册条目（含 D 表范围口径随动），与设计档 §6.1 D16 行同源。 |
| 6 | Affected-file annotations | 🟡 | `thincoder-desktop/test/views-chrome-vocab.test.mjs` 行（批档 §2.5）只给现值 291 无增量（判据要求 `≤±N` / 「结构不变」），且随动面写少——该档还硬编码 视图档零 CJK 扫描名单（`thincoder-desktop/test/views-chrome-vocab.test.mjs:282-287` · 用例名 `:157`「十六视图档」）与全消费断言（`:280`）：新增 `renderer/views/chat-guide.mjs` 与两新键后，名单漏挂 ⇒ 漏扫；两新键无树消费 ⇒ `:280` 全消费断言必红。 | 该行补增量并点名三处随动：扫描名单增 `chat-guide.mjs` · 用例名档数同改 · 夹具补 `chatModel` 两码态（`no-project` / `no-session`）树入量。 |
| 7 | Affected-file annotations | 🟡 | 受影响文件表漏 `thincoder-desktop/test/host-floor.test.mjs`（U95 `fresh` ≤300 臂；该档自述「新增码面档一律入 ≤300 臂读数」= `thincoder-desktop/test/host-floor.test.mjs:264-270`）——本批新增渲染档 `renderer/views/chat-guide.mjs` 按此惯例须入臂，表中无此行、无增量（§2.8 仅点名 SHELL.md 模块树）。 | 表中补该行（现值 + `≤±N`）；或将其登记为随动项，与 SHELL.md 模块树同列。 |
| 8 | Clarity（机制未点名） | 🟡 | `flow` 帧「引导节点不在场」的判据已给（`docs/desktop/design/RENDERER.md:57`），但帧尾态刷成员表（`docs/desktop/design/RENDERER.md:55`）只有 根锚四 + 摘要块 + 药丸（+卡）⇒ `empty → flow` 走增量帧（重挂键只有 `activeSession` / `locale`：`thincoder-desktop/renderer/views/chat-stream.mjs:67`；尾段插点 = 首个卡 / 药丸之前、两锚皆缺 ⇒ 末位：`thincoder-desktop/renderer/views/chat.mjs:212-215` · `:225-232`）时无人摘引导节点 ⇒ 不变量不成立（现盘 `.chat-empty` 节点同患：`:117` · `syncChrome` 只刷摘要 / 卡 / 药丸 `:156-178`）。 | 在态刷面点名引导节点的在场刷新成员（判据 = `model.guide` 空否），并说明 `none` / `empty` 帧由重挂面建、`flow` 帧由态刷面摘。 |
| 9 | Clarity（自相抵） | 🟡 | `docs/desktop/design/E2E-TESTING.md:100` 第 2 步写「等 `dataset.boot === "ok"`」，与本档 §1 就绪判据（`docs/desktop/design/E2E-TESTING.md:27-29`）及 §3.3 第 2 步（先等 `∈ {ok, error}` 落位再断言）相抵 ⇒ 引导失败面会被报成超时。 | 第 2 步按本档就绪判据改写（等落位 ⇒ 再断言 `=== "ok"`）。 |
| 10 | Doc hygiene | 🔵 | `docs/desktop/design/E2E-TESTING.md:103` 引 `docs/desktop/design/IPC.md:70`（行号），与仓内「引符号不引行号」口径相抵（`docs/desktop/requirements/PROJECT.md:80` · 批档 §2.3 IPC.md 行）。 | 改引符号（`IPC.md` §2 `project:open` 行）。该行内容未核——`IPC.md` 不在本评审计面。 |
| 11 | Clarity | 🔵 | `docs/desktop/design/E2E-TESTING.md:95`「零新 DOM 锚」与本批产品面新增锚 `data-guide`（`docs/desktop/design/UI.md:64`）相抵，实施面可误读为「无须登记锚」。 | 表述改为「零新通道；断言只读既有锚 + 本批登记的 `data-guide`」。 |
| 12 | Affected-file annotations | 🔵 | 「净 −2」（`docs/desktop/design/PROJECT.md:130` · 批档 §2.5）方向存疑：`chatModel` 增 `guide` 判据 + `chatTree` 两分支各补引导节点、仅删 1 行（现形 `thincoder-desktop/renderer/views/chat.mjs:36-51` · `:113-123`）⇒ 实为净增（估 +3…+5）；结论「不越 300」不受影响。 | 估值改记「净增（估 ≤+6）」或只留「≤300」判据不给方向；「余 10」勿当读数用。 |
| 13 | Acceptance | 🔵 | 引导面自身动作控件从未被真机点（`docs/desktop/design/E2E-TESTING.md:105` 第 7 步有意点左列入口以免自证）⇒ ① 的「可操作」面在真机只有在场断言 + 同出口。 | 可选：补一次真机点引导面 `session:create` 控件（无对话框面、可平跑）作旁证；`project:open` 控件因原生对话框不适机检，维持在场断言。 |
| 14 | Acceptance | 🔵 | D16 回指行验证面只列 `T-DSK32`（`docs/desktop/design/PROJECT.md:260`），而「动作控件在场 ⟺ 句柄在场（零假按钮）」的机检面是 `thincoder-desktop/test/views-chat-guide.test.mjs`（批档 §2.6 已列）⇒ 设计行用例列不全。 | D16 行验证面补该用例档名（与批档 §2.6 同源）。 |

**计数**：🔴 2 · 🟡 7 · 🔵 5（合计 14）。

**域外注（不计分）**：`docs/desktop/design/IPC.md` · `docs/desktop/design/SHELL.md`（批档 §2.3 记本轮随动）不在本评审计面 ⇒ 未核；需求档 §3.5 重号（`docs/desktop/requirements/PROJECT.md:70` 与 `:76`）为存量、非本批笔面。

**VERDICT: changes-required**

### 轮次 2（评审子代理）

**设计评审 · 轮次 2（复验轮）** — 对象 = 桌面端首启空态引导四件 + 真机使用冒烟契约 `T-DSK32`；证据面 = 六档全文实读（修正轮 #104 落位）+ 代码面按「新序可达性 / 受影响文件行数」抽核。限制：无 Project Standards 档被声明 ⇒ 方法论合规按仓内口径判；未提供文档地图 ⇒ 归属判据降级为措辞自洽性。行数抽核（内容行数）：`renderer/views/chat.mjs` 292 ✓ · `renderer/app.mjs` 243 ✓ · `renderer/i18n.mjs` 356 ✓ · `test/files.mjs` 19 ✓ · `test/views-chrome-vocab.test.mjs` 291 ✓。

**轮次 1 十四条复验（逐条实读当前文）**

| # | 原级 | 状态 | 证据（本轮实读） |
|---|---|---|---|
| 1 | 🔴 | 已修 | E2E §3.5 重写为十二序、桥直调步删除：第 5 步等左列最近目录项、第 6 步真点（`renderer/views/sessions.mjs:126-131` 项携 `data-path` ⇒ `renderer/app.mjs:120-129` `openDir` ⇒ `mount-sessions.mjs:28-39` refreshRail + `:91-97` resumeOpened）⇒ `no-message` + enabled 可达；第 8 步关唯一标签直关经 `store.mjs:131-134` `needsCloseConfirm`（零位标）✓ |
| 2 | 🔴 | 已修 | `docs/desktop/design/PROJECT.md:260` D16 行「空态分态（`none` ⇒ 零块节点 + 引导节点〔`data-guide`〕· `no-message` ⇒ 复用既有空态节点）」= 与 `:313` / `UI.md:19` / `RENDERER.md:47` 同形 |
| 3 | 🟡 | 已修 | `design/PROJECT.md:201`「关唯一 ⇒ 关页 `none` 态（零块节点 + 引导节点 `data-guide="no-session"`）· `RENDERER.md:55`「`none` 态零块节点不破」· `UI.md:62` 前言「无引导节点（零块节点）」三处同族收正 |
| 4 | 🟡 | 已修 | `design/PROJECT.md:351`「需求档补条目 ⇒ **已落**（需求档 **D16** = 首启空态引导）」 |
| 5 | 🟡 | 已修 | `docs/desktop/requirements/PROJECT.md:178` D16 入册行（「自本行起 D 表 = D1–D16」） |
| 6 | 🟡 | 已修 | `design/PROJECT.md:156`「`views-chrome-vocab.test.mjs` **291 ⇒ ~297**（零 CJK 扫描名单增 `views/chat-guide.mjs` · 用例名档数同笔 · 夹具补 `chatModel` 两码态树入量）」 |
| 7 | 🟡 | 已修 | 同行「`host-floor.test.mjs` **292 ⇒ ~294**（`fresh` ≤300 臂清单增 …——新增码面档入臂惯例）」 |
| 8 | 🟡 | 已修 | `RENDERER.md:55` 帧尾态刷成员点名**引导节点**（判据 = `model.guide` 空否；`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘） |
| 9 | 🟡 | 已修 | `E2E-TESTING.md:102` 第 2 步 = 等 `dataset.boot ∈ {ok, error}` 落位 ⇒ 再断言 `=== "ok"` |
| 10 | 🔵 | 已修 | §3.5 行号引注消解（改符号：`IPC.md` §2 项目面注项 4；夹具先例引代码档） |
| 11 | 🔵 | 已修 | `E2E-TESTING.md:95`「**零新通道**；断言只读既有契约面 + **本批登记锚** `data-guide`」 |
| 12 | 🔵 | 已修 | `design/PROJECT.md:130`「**292**（批 B 末实读；批 B 追加轮改动后仍不越 300）」（「净 −2 / 余 10」删） |
| 13 | 🔵 | 已修 | `E2E-TESTING.md:113` 第 9 步**真点**引导面 `session:create`（旁证；`project:open` 无 `data-path` 形维持在场断言） |
| 14 | 🔵 | 已修 | `design/PROJECT.md:260` 机检面补 `thincoder-desktop/test/views-chat-guide.test.mjs`（拟新增）+ 集成用例 |

**轮次 2 新增（修正引入 / 未扫净的残留 · 3 条）**

| # | 类别 | 级别 | 发现 | 建议 |
|---|---|---|---|---|
| N1 | 文档状态（序数残留 · 跨档滞后） | 🟡 | 十二序重写后四处仍记「十一序」：`docs/desktop/design/PROJECT.md:158`「形态与十一序断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 / §6」· `:223`「批 B 追加轮落定（§3.5 T-DSK32 十一序 …）」· 批档 `:59`「`T-DSK32` 十一序常驻用例」/`:60`「十一序逐步断言 + `pageerror` 空 …」· 批档 `:110`「`T-DSK32`（十一序）」；权威面 = `E2E-TESTING.md:97`「（即用例 2 的执行序 · 十二序）」+ `design/PROJECT.md:319`「十二序断言单源」。§2.10 被取代条目声明只覆盖 §2.1 ① / §2.3 / §2.5 ⇒ 以上四处未被覆盖；又 `design/PROJECT.md:526` 变更记录已声称「集成行『十一序 ⇒ 十二序』」落地（与实文不符） | 四处收正为「十二序」（或把 §2.1 ④ / §2.6 / §4.2 行并入取代声明）；`:526` 声明与实文对齐 |
| N2 | 数值漂移（#12 同族残留） | 🔵 | `docs/desktop/design/PROJECT.md:171`「**贴 300 层未越** = `thincoder-desktop/renderer/views/chat.mjs`（**290**——预案 = 卡构树拆出）」与权威值 §4.1 `:130` = **292** 相抵 | 收正为 292（或删该读数） |
| N3 | 文档措辞（隔离契约未按用例限定） | 🔵 | `docs/desktop/design/E2E-TESTING.md:74` fixture 行仍记「（**唯一预置内容**）」，而 §3.5 第 1 步已预置会话槽族档一枚（且有意不预置 config）——差异已在 §3.5 边界 / §6 行登记，但 §3.2 契约行未限定 | 该行加「（用例 1 面；用例 2 见 §3.5）」类限定 |

**计数**：轮次 1 十四条 = **14 已修（🔴2 · 🟡7 · 🔵5 全数消解）**；轮次 2 新增 = 🟡1 · 🔵2（合计 3，无阻塞项）。
**结论**：两枚 🔴 已切实消解（新十二序在产品路可达、D16 行与单源同形），修正未引入 🔴。

**VERDICT: pass**

## §4 用户批准（主 agent）

**2026-09-27 17:58 · 父侧代签**（用户 17:04「**你自动跑完吧。**」⇒ 本批点火权 + §4 批准权委托父侧 ✓；自缚三条件在册 ✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（轮 1 = changes-required（🔴2 · 🟡7 · 🔵5）⇒ 修正轮 #104 落地 ⇒ **轮 2 = pass**（🔴 0 ✓·新增 🟡1 · 🔵2 均不阻塞 ✓）；§3 两轮逐字在档 ✓）；② **修正轮已落地并逐条核验** ✓（13 条逐号落位 = §2.10 ✓·父侧实读核验 ✓ + 轮 2 逐条复验 **14/14 已修** ✓）；③ **token 已签发** ✓（**值不落档** ✗）。
**轮 2 新增三条裁定** ✓：**N1**（「十一序」残留五处：`docs/desktop/design/PROJECT.md:158` / `:223` · 本档 `:59` / `:60` / `:110`）= **受理 ⇒ 注记修正轮 #106** ✓（设计档就地收正 · 本档 append-only ⇒ §2.11 覆盖块 ✓）；**N2**（`docs/desktop/design/PROJECT.md:171` 陈旧 **290**）= 同轮收正 ✓；**N3**（`docs/desktop/design/E2E-TESTING.md:74` 契约行未按用例限定）= 同轮加限定 ✓。**三条均不阻塞实施** ✓（注记级 · 不涉实施契约 ✓）。
**批准范围** ✓：**本批四项**（①首启引导 ②空态分态 ③判据保留 ④真机使用冒烟契约）+ ⑤词键账随动 ⇔ 设计面单源 = `docs/desktop/design/{UI,RENDERER,E2E-TESTING,PROJECT}.md` ✓；**实施 = 单舱 #107** ✓。
**用户侧验收线（D16）** ✗：**凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例**；**父侧亲跑 = 闭合点** ✓（**不再只靠假 DOM** ✗）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（全量 167/167 绿 · T-DSK32 真跑通过 · advisor 两轮 pass · 终态 clean）



**实施摘要（单舱 #107 · eng-coder · 2026-09-27）**

**交付面（五件全落）**：① 首启引导两码（`no-project` / `no-session` + 动作控件在场律「控件在场 ⟺ 句柄在场」）· ② 空态分态（`none` ⇒ **零块节点 + 引导节点**；`no-message` ⇒ 复用既有空态节点 · 零动作控件）· ③ 判据保留（输入框 `disabled` 恒 ⟺ 无活动会话 · 引导不解除禁用）· ④ 真机使用冒烟契约 `T-DSK32`（**十二序** · 真 Electron · 零 provider · 零出网 · 零截图）· ⑤ 词键账随动（`chat.guide.noProject` / `chat.guide.noSession` · 两语总键 **124** · 对话流桶 **10**）。

**文件面（实读口径 = `test/host-floor.test.mjs:252` 同函数：`replace(/\n$/,"").split("\n").length`）**：

| 档 | 设计估 | 实读 | 改点 |
|---|---|---|---|
| `renderer/views/chat-guide.mjs` | ~50 | **54** | 新档：`guideOf` 四值判据 · `guideNode` 构树（表外码 / 非串 ⇒ `null`）· `syncGuide` 帧尾态刷（**只摘不插**） |
| `renderer/views/chat.mjs` | 292（批 B 末实读） | **299** | `chatModel.guide` 判据 + `chatTree` 帧尾引调 + `syncChrome` 增引导成员（`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘）；不越 300（余 1 行） |
| `renderer/app.mjs` | 243 ⇒ 247 | **247** | 重挂键集增 `"project"` + 引导句柄（`onOpenDir` ⇒ `project:open` · `onNewSession` ⇒ `session:create`） |
| `renderer/i18n.mjs` | 356 ⇒ 360 | **363** | 两语各增 1 键（越 300 **在册** · 预案 = 设计档 §4.1） |
| `test/views-chat-guide.test.mjs` | ~70 | **110** | 新档 U151：判据四值 / 构树两向 + 表外零树 / 帧尾态刷四径（假根） |
| `test/integration/first-run-smoke.test.mjs` | ~140 | **171** | 新档 T-DSK32 十二序（真点链 · 作用域限定 · 零文案匹配 · `pageerror` 判空） |
| `test/files.mjs` | 19 ⇒ 21 | **19** | 两新档登册——**打包入既有行**（本档既有形 = 一行多录）⇒ 净 0 行 |
| `test/host-floor.test.mjs` | 292 ⇒ ~294 | **294** | `fresh` ≤300 臂增两行（`chat-guide.mjs` + 其用例档） |
| `test/views-chrome-vocab.test.mjs` | 291 ⇒ ~297 | **298** | 计数四处同笔（**124** 键 / 对话流 **10**）· 零 CJK 扫描名单增 `views/chat-guide.mjs`（十七视图档）· 夹具补两码态树入量 |
| `test/views-chat.test.mjs` | — | **265** | `chatModel.guide` 判据单源断言（`:80-81`） |
| `test/views-chat-frame.test.mjs` | — | **185** | 子序 `[引导?]` + `none` / `empty` 帧断言（`:60` · `:69` · `:73`） |
| `test/views-tabbar-close.test.mjs` | — | **317** | U120 页随动：关唯一 ⇒ `none` 零块节点 + 引导节点（`:157` · `:173` · `:187`）；越层**在册**（非本批新越） |

**决策透明表**：

| # | 决策 | 依据 / 理由 |
|---|---|---|
| 1 | 引导动作控件 class = `chat-backfill`（复用既有 CSS）· 键 `data-action` | 设计未点名 class；复用既有样式面 ⇒ 零新 CSS、不另立样式档 |
| 2 | `syncGuide` 归 `renderer/views/chat-guide.mjs`（设计未定归属） | 判据 / 构树 / 态刷三件同档 = 单源；`chat.mjs` 只引调 |
| 3 | 新单测号 = **U151**（自铸） | 批次档未给该档用例号；号段顺延（U150 之后） |
| 4 | `chat.mjs` 实施中一度 **301** 行（越 300）⇒ 修至 **299** | ≤300 硬线；修后 `node --check` 绿 + 全量复跑绿 |
| 5 | 集成域新档不进 `host-floor` `fresh` 臂（如实披露） | 既有口径 = 集成域档不入臂（先例 `test/integration/settings-panel.test.mjs` 不在清单）；父侧若要入臂 ⇒ 收正轮随动 |

**审计与评审轮次 · 终态**：

- **内部 explore 审计**（设计对照 · 一次）：A–J 各面符合；唯一 🟡 = `chat.mjs` 301 行 ⇒ 自修至 299（见决策表 #4）。
- **advisor `type:"code"` 轮 1 = pass**：0 must-fix；2 🟡（`renderer/i18n.mjs` 363 · `test/views-tabbar-close.test.mjs` 317 —— 皆**在册越层**）；4 🔵；out-of-scope 若干（已列报告）。
- **fix 轮（轮 1 ⇒ 轮 2 前 · 纯注释三处）**：① `chat.mjs:162` 词面收正（旧「零节点化」⇒「零块节点化」）· ② `chat-guide.mjs:16-17` 判据注释点名「缺」= 缺 / 空串 / 非串 · ③ `first-run-smoke.test.mjs:59-61` 注释点名 `pageerror` 收集起点 = 窗口取得。三档 `node --check` 绿 · 全量复跑 **167/167** 绿。
- **advisor 轮 2 = pass**（仅校 fix 声 · 三处逐条核验通过）；附宿主机检注记「**0/3 引证匹配**」（两条 = 相对路径不可读 · 一条 = 内容比对本机检报不一致）⇒ **直读复核 `chat.mjs:162` 原文在位** ⇒ 判机检假阴性（同型先例 = §1.3 宿主告警经父侧实读判误报）。码面无未清项。
- **终态 = `clean`**（0 must-fix 未清 · 零反复自修轮）。

**验证（本舱实跑）**：`node test/run.mjs`（清单两向自检 + `node --test` 全册）⇒ **167 / 167 pass · 0 fail · 0 cancelled** —— 含 `T-DSK32`（真 Electron 真跑 · 3184ms · 零 `pageerror`）与 `T-DSK27`（真 Electron）；注释三修正后复跑同绿。

**披露（只报不动 · 供父侧收正轮取用）**：

- **估值漂移**（设计面为估值 · 实施期实读为准）：`files.mjs` 19 ⇒ **19**（非 21 —— 打包入行）· `views-chat-guide.test.mjs` **110**（估 ~70）· `first-run-smoke.test.mjs` **171**（估 ~140）· `chat-guide.mjs` **54**（估 ~50）· `i18n.mjs` **363**（估 360）· `views-chrome-vocab.test.mjs` **298**（估 ~297）· `chat.mjs` **299**（292 基线 · 不越 300）。
- **out-of-scope 三笔**（父侧设计档面 · 未动）：① 批次档 §2.1 ②「`none` ⇒ 对话流零节点」旧记法未被 §2.10 / §2.11 覆盖声明收编；② 设计档 §4.1 数值列未回填本批实读、三触碰档（含 `host-floor.test.mjs`）未入表；③ `docs/desktop/design/SHELL.md` §1 模块树未含两枚新档。

**补记（§5 落档后终验复跑）**：同工作树再跑 `node test/run.mjs` ⇒ **167 / 167 pass · 0 fail · 0 cancelled**（`T-DSK32` 2362ms · `T-DSK27` 2103ms · 两真 Electron 用例同绿）—— 与上记读数一致（用例耗时随机器负载浮动，非断言面）。

## §6 验证与收口（父代理）

**验证与收口（父侧 · 2026-09-27 19:12 ✓）**

### 6.1 交付与验收（**父侧亲跑 = 闭合点** ✓）

- **交付** ✓：**四项**（①首启引导 ②空态分态 ③判据保留 ④真机使用冒烟契约）+ **⑤词键账随动**；**十二档**（新三 + 改九 ✓）；**链**：设计轮 #101 ⇒ 评审轮 1 = changes-required（🔴2 · 🟡7 · 🔵5）⇒ 修正轮 #104 ⇒ **评审轮 2 = pass** ⇒ §4 代签（三条件 ✓）⇒ 实施舱 #107（内审 + 代码评审两轮 pass ✓）⇒ 注记轮 #106 ⇒ 结算轮 #108 ✓。
- **父侧亲跑（闭合点 ✓）** ✗：① `cd thincoder-desktop && node test/run.mjs` ⇒ **tests 167 / pass 167 / fail 0**（含 **T-DSK32** 真 Electron 6.3s + T-DSK27 ✓）；② **父侧亲手驱动真应用**（自写探针 · 零配置首启）⇒ 读数：`boot=ok` ⇒ 引导码 **`no-project`** ∧ 文案「No project open — open a folder to start」∧ 真按钮「Open folder…」（挂 `project:open` ✓）∧ 输入框 **`disabled=true`** ⇒ **真点最近目录** ⇒ 引导码 **`no-message`** ∧ 输入框 **`disabled=false`** ⇒ **键入 + 回车** ⇒ 值逐字留存 ∧ 控制台 `[composer] msg:send failed: provider-invalid`（零渠道正确报错 ✓ · 零出网 ✓）；③ 取证 PNG：`thincoder-desktop/test/artifacts/first-run-guide.png` / `first-run-ready.png`（gitignored ✓·父侧人工可直开 ✓）。
- **D16 验收线** ✓：**凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例** —— 本批 **T-DSK32 = 该线首例常驻守卫** ✓。

### 6.2 结算（D7 清单 ✓）

- **文档面** ✓：设计档四档收正 + `SHELL.md` 树补档（§2.10 / §2.11 / §2.12 落档 ✓·**桌面域机检悬空归零** ✓）；需求档 **D16** + 变更记录 ✓（父侧笔 ✓）。
- **台账** ✓：**#454 核销** ✓；新增 **#455**（需求档 §3.5 重号）· **#456**（设计档行数账改机检——**承用户「流程太慢」裁定** ✓）· **#449 / #450 / #453** 在册 ✓。
- **本档冻结** ✓（§1 状态行 ⇒ 已收口）· 设计槽消费 ✓（本批 876b72f5 + 前批两枚 ✓）· 提交 = 紧接一笔（**本档含冻结态一并入仓** ✓）。
- **未决（在册 ✓）**：① doc-check 桌面域存量 8 行宽 + 13 条「拟新增」列报（**未触碰面** ✓·随各自触碰轮 ✓）；② 仓库全量悬空 48 / 行宽 31 = `docs/core/**` 存量（非本批 ✓）；③ 需求档 §8 **P4**（CI 三平台矩阵）待实施（原有在册 ✓）；④ **真实模型回路下的发送成功面**（零渠道环境不覆盖 ✓·设计边界 ✓）；⑤ 父侧实读抽查面：外来的 `docs/batches/2026-09-27-desktop-visible-face-fix.md`（**他会话在飞** ⇒ 本批提交不触碰 ✓）。

### 6.3 结语

**一句话** ✓：**用户 16:47 的报障（新装「完全没法输入」）已修并亲测** —— 现在新装打开 = **一句可操作的话 + 一个点得动的按钮** ✓；点开 ⇒ 输入框亮 ⇒ 打字回车通 ✓（**父侧亲手跑 · 两张图在档** ✓）。
**过程账** ✗：父侧接缝漏格再 **+2**（「零节点」旧记法 / 「十一序」残留 ✓——**全由评审轮 2 与修正轮实读捕回** ✓·零流入成品 ✓）；**用户两条裁定入册** ✗：① **冒烟测试 / 测试档不走设计流程**（18:31 ✓·已入项目记忆 ✓）；② 前批「批次档体量」教训续用 ✓。
