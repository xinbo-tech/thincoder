# 2026-09-17 · 装配门禁小修批（模式门 + 二道防线）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（台账 #30 / #33 已核销）

### 1.1 批件（两条 · 用户 2026-09-17 23:33「评估一下，分一下批，然后开始处理」授权）

| # | 条目 | 实况 |
|---|---|---|
| #30 | M1 装配钩子未见工程模式门 | `thincoder-cli/src/cli/make-agent.mjs:47-64` 的 `requireManifest` / `initManifest` 路径均无 `engineering` 门 ⇒ normal 模式 + 非仓 cwd 启动被拒（「工程模式启动拒绝」）；仓内 normal 模式无档则自动建档（疑似缺陷，父侧抽读复核） |
| #33 | 「二道防线」声明与实况不符 | 设计 `docs/core/design/MANIFEST.md:119` 表「二道防线 = M5 spawn 门 files 域排除 `PROJECT-MANIFEST.json`（子代理无法声明该路径为写域）」vs 实况 `thincoder-core/agent-tools/spawn-gates.mjs` `PROCESS_BASENAMES = new Set(["changelog.md"])`——全仓无该排除实现 |
| 文档补载 | 用户 `85a4a6b3`「拒自动建档」行为**未入设计/需求档** | 实况 = 两端钩子：`resolveProjectRoot(cwd)` 不可解析（锚非仓 ∧ 向下带 manifest 者 ≠ 1）⇒ throw「工程模式启动拒绝」**不自动建档**（`make-agent.mjs:56-60` · `setup.mjs:383-387`）；设计 `MANIFEST.md` §2.2 架构图（`:64-66`）与钩子行（`:85-86`）未载该分支；需求 `SPEC-MANIFEST` ②.3 未载先决条件 |

### 1.2 裁量点（父侧倾向 · 设计定夺）

- **#33 修法二选一**：① **代码补排除**（`PROCESS_BASENAMES` 增 `PROJECT-MANIFEST.json`——声明面成真；**父侧倾向**：声明既立 = 契约，补实现而非收回声明）② 文档收回声明（删 §2.5 该句）。设计轮给定案 + 理由 + 受影响面。
- **#30 修法面**：CLI 钩子（`make-agent.mjs`）+ VSC 对位面（`setup.mjs` 同款钩子）是否同款加门；门判据 = 工程模式标志；normal 模式语义 = 不读 manifest、不进拒循环（**禁扩大面**——设计定夺）。

### 1.3 边界

- **做**：两条各自的最小正确修 + 所属设计档条文 / 用例 / 验收；#30 含 normal 模式回归用例（非仓 cwd 启动不拒）。
- **不做**：不碰 manifest.mjs 机制本体（#36 裁撤批在途——本批零碰）· 不动 spawn 门其他族（`changelog.md` 既有面零改）· 不碰冻结批档 / `_archive/**` / 参照树。

### 1.4 父侧注记

- 2026-09-17 23:33 用户裁定「开始处理」；本批即立（装配门禁两条）。
- 2026-09-17 23:40 **追加批件（文档补载）**——承用户核档请求（「project-manifest 生成逻辑 VSC 普通模式大幅改动——核对文档同步」）：其 8 提交（20:39–21:33）中 4 个带文档改动（纯向下口径入 MANIFEST.md / 需求 v2 / persona ✓），**实缺 = 「拒自动建档」分支**（`85a4a6b3` 纯代码）未入设计/需求档；另两小债 = `manifest.mjs` 死指针族（`$anchor` `:124` / 头注 `:3`——已注：随 activeBatch coder 轮收，另案）· `MANIFEST.md` §2.5 的「需求侧待同步」注（已于 23:37 由父侧同步完成——该注现已陈旧，窗开后父侧一行收正）。
- **发布时序**（2026-09-17 23:50 更新）：id=8 已让出（其 🟡9 = `MANIFEST.md:122` 状态句 ✅ 已收正）；**`MANIFEST.md` 现被 activeBatch 核销轮（轮 2，刚点火）再次冻结** ⇒ 本批设计轮待核销轮结算后即派（批②条目 = #30 + #33 + 文档补载，同面一锅出）。
- **设计轮（id=15）交付 + 父侧核验（2026-09-18 00:12）**：三条落位——父侧实读核验 ✓（架构图/判据单源 `MANIFEST.md:90` · 两端钩子含 CLI 二调 `:93-96` / VSC 块首 `:97-98` · KD-M1-12–14 `:134-136` · AC-14–18 `:264-272` / T23–31 `:301-309` · 架构 §2.3 E2 限定句 `:215`）。六项上报逐条：① CLI 模式权威点晚于装配 → 设计已覆盖（`attachManifest` 幂等二调）✓；② **进程内翻转族 → 父侧裁定：语义 = 拒翻（fail-closed + 明示）**——**另批（台账 #41）**，本批显式不做；③ `write-gate.mjs` 注释收正 → 准（表行 5）；④ 需求侧三处 → 父侧本刻已同步（`SPEC-MANIFEST` ②.3 / AC-M1-2 / 新 AC-M1-8）✓；⑤ §2.5/§4 陈旧注 = 已由 activebatch 🟡9 收正 ✓；⑥ `bin/thincoder.mjs` 425 行 → 随评审核销轮补（criterion 8）。
- **设计评审轮 1（2026-09-18 00:18 · VERDICT: changes-required——🔴1 / 🟡4 / 🔵4）**：发现表由评审自写 §3（轮 1）。🔴1 = **「config.json 真 + 会话槽假」漏判**（装配期判据只等于 config 初值；`/eng` 只写槽不镜像 config ⇒ 该态下非仓仍抛 / 仓内仍建档；抛点早于 `applySession` ⇒ call point ② 失效）。**父侧裁决：9/9 全数接受**；**🔴#1 定案 = 方案 A（判据取会话权威值）**：装配期判据改「`resumeSlot(cwd)` 带 `engineering` 字段 ? 槽值 : config 值」；call point ② 保留为幂等重估；AC 补一格（config 真 + 槽假 → 非仓不抛 + 仓内不建档）。**→ 派 fix 轮（id=22）**；需求侧措辞（槽优先 + 钩子面限定）随 fix 定稿父侧一遍同步。
- **fix 轮（id=22）交付 + 父侧核验（2026-09-18 00:27）**：9/9 落位（§2.6 在册）——父侧抽读核验 ✓（架构图 `:64-65` 会话权威值 + 装配钩子零 manifest I/O · 判据单源 `:90-96`（取值点三处）· 钩子块 `:98-106`（`slotData` 形参 + KD-M1-15 非纯读实证 + 钩子后移后果）· AC-14 四格 `:286` · AC-16 三向 `:288`（含 🔴 直测格）· AC-18 回指 AC-M1-8 + `/Manifest file/` 片段 `:290` · KD-M1-16 口径注 `:292`）。**前提收正（如实披露）**：父侧/评审共述的「`resumeSlot` = 同进程纯读」**不成立**（`session.mjs:52-55` → `session-slots.mjs:478-497`：GC + 认领写 + 端标；实证见 KD-M1-15）——判据语义（槽优先 + config 回退）零改，**seam 改参数注入**（`slotData`，零新增读写；唯一次序变化在案 `:99`）。**上报处置**：① 需求侧措辞 → **父侧已同步**（`SPEC-MANIFEST` ②.3 / AC-M1-2：会话权威值 + 装配钩子限定）；② ✅ 已记（本条）；③ ACP 族（会话起点）→ 并入**台账 #41**；④ 下游读盘消费面 = 设计 §2.5 在册（本批零改）✓；⑤ `MANIFEST.md:7` 头注陈旧 → 随 §6 收口一行收正；⑥ VSC 侧无需改动（`agent-state.mjs:88-91` 合并值即槽优先 + config 回退 ✓）。**→ 点火核销轮（轮 2）。**
- **核销轮 1（id=25）超时未完成（2026-09-18 00:37——600s 预算耗尽 / 7 轮 / 20 调用 / 产出 457K chars / 未签发 token）**：**超时非否决**（9/9 修复声明的父侧核验不受影响）。成因：① 范围偏重（四档全量 + 引证复核）；② 父侧派单时序失误——文档债 coder（id=23）与本次评审同窗潜在同域（`MANIFEST.md` / `ENGINEERING-MODE-V2.md`；实况其本刻零落笔 touched 0）。**处置**：id=23 让出（cancel——零写损失）；预算上调 `agent.advisor.timeoutMs → 900s`；**重跑核销轮（轮 2）**；文档债实施改在批②评审结算后重派（同域串行）。
- **核销轮 2（id=26 · 2026-09-18 00:42 · VERDICT: pass）**：5 束 9 条 **全数落位**（残留 0 / 新增 0——含前提收正 KD-M1-15 与证据相合：`session.mjs:52-55` / `session-slots.mjs:490-495`）；设计 token 已签发（值不落文档——运行时凭证）。**→ §4 代签 → 派实施 coder（initial）。**

## §2 批次任务与设计修订（eng-designer）

### 2.1 批次任务（三条 —— 逐条落位）

| # | 条目 | 设计定案（含被拒备选） | 落位 |
|---|---|---|---|
| ① | **#30** M1 装配钩子无工程模式门 | **加门**。判据（两处同一句）= `agent.config?.agent?.engineering === true`（与情境行注入判据②同源，`setup-reminders.mjs:82`）；**普通会话 = 零 manifest I/O**（不读 / 不拒 / 不建档）+ `agent.manifest = null`（清残留附着）；工程模式四态同今日（附着 / init / 拒 / fail-closed）。**钩子执行点 = 会话起点**（CLI 两处：`assembleAgent` 装配 + `bin` 启动恢复后；VSC `hydrateRun` 每轮——槽已 reconcile，已是会话起点）——因 CLI 的工程模式权威值 = 会话槽（`session.mjs:311-317`；`/eng` 槽 only `cmd-eng.mjs:61-78`），装配期（`bin:306`）早于 `applySession`（`bin:320`）。被拒备选：① 只在装配期判 config.json ② 挂核 `applySession` 内 ③ 仿 VSC 改逐回合判（CLI 启动期拒绝 UX 退化为首回合报错） | 设计档 `docs/core/design/MANIFEST.md` §2.2 模式门 + 两端钩子行 · §2.4 KD-M1-12 / KD-M1-13 · §3.1 AC-14–AC-17 · §3.2 T23–T29 / T31 |
| ② | **#33**「二道防线」声明与实况不符 | **定案 = 代码补排除**（采纳父侧倾向①——声明既立 = 契约）：`spawn-gates.mjs` 新常量 `MANIFEST_BASENAME = "project-manifest.json"` + `rejectEngineeringFilePaths` 专用分支/文案。**不入 `PROCESS_BASENAMES`**（两族理由不同：过程档 = 父侧对账职责；manifest = 写门唯主 agent——并入会把尾句「改设计档」误导到 manifest 面）；**不 import `MANIFEST_REL`**（保本模块「叶子 · 零 import」头注性质——字面量 + 指针注释）。被拒备选：收回 §2.5 声明（`files` 声明面失闸——子代理可把 manifest 声明为写域） | §2.5「实况（本批落地）」条 · §2.4 KD-M1-14 · §3.1 AC-18 · §3.2 T30 |
| ③ | **文档补载**（`85a4a6b3`「拒自动建档」未入设计/需求档） | 设计侧补载：§2.2 架构图 + 两端钩子行补「缺档 → 根可解析则 `initManifest` / 不可解析则**拒且不自动建档**」分支；架构档同口径限定句（D2：细节单源在 MANIFEST.md §2.2）。**需求侧（`SPEC-MANIFEST` ②.3 / AC-M1-2）归父侧域——本批只列清单不落笔**（见 §2.4） | `MANIFEST.md` §2.2（架构图 + 钩子行）· `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E2（`:214` 加口径限定句） |

### 2.2 受影响文件（coder 实施面 · as-of 2026-09-18 00:0x 实测（`\n` 计数）· 行号为 as-of 参考，落点以函数名为准）

| # | 文件 | 当前行数 | 变更 | 编辑点（函数级） | 增量 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/src/cli/make-agent.mjs` | 197 | 修改 | 内联 M1 钩子块（`:42-64`）抽为导出 `attachManifest(agent, { cwd })` + **块首模式门**；`assembleAgent` 在 `createAgent`（`:135`）后调用并附着（原 `manifestInit` 载体 + `:148-149` 附着行并入） | ±~15 |
| 2 | `thincoder-cli/bin/thincoder.mjs` | 425 | 修改 | `:24` import 加名 + 启动恢复块之后（`agent._slot = slot` `:330` 与 `startTUI` `:343` 之间）一行 `attachManifest(agent)`——CLI 会话权威点重估 | +2 |
| 3 | `thincoder-vscode/src/agent/setup.mjs` | 470 | 修改 | `hydrateRun` 钩子块（`:375-391`）**块首模式门**：非工程模式 → 只置 `agent.manifest = null`，其余分支不动 | ±~5 |
| 4 | `thincoder-core/agent-tools/spawn-gates.mjs` | 95 | 修改 | 新常量 `MANIFEST_BASENAME`（字面量）+ `rejectEngineeringFilePaths` 新 `else if` 分支（专用拒文案：写门唯主 agent / 二道防线） | +6 |
| 5 | `thincoder-core/agent/write-gate.mjs` | 86 | 修改 | 注释收正（`:13` / `:39-40`「壳面拦」句加**工程模式会话**口径——零语义，防注释与实况矛盾） | ±0 |
| 6 | `thincoder-core/test/spawn-gates.test.mjs` | 121 | 修改 | 新增 `T8f`（大小写 / 层深变体 + 混合收集两条文案）；`T8b`/`T8c`/`T8d` **零改** | +~15 |
| 7 | `thincoder-cli/test/make-agent-manifest-gate.test.mjs` | 0 | **新增** | `attachManifest` 直调用例组（AC-14–AC-17；T23–T29）——夹具：tmp 仓（`.git`）/ tmp 非仓 / 档合法·缺·非法三态 | +~70 |
| 8 | `thincoder-cli/test/integration/cli-prompt-entry.test.mjs` | 100 | 修改 | 新增「**normal + 非仓 cwd 启动**」用例（T31/AC-14 回归）——`mkEnv` 现 `:27` 建 `.git`，需非仓变体；复用 `runCli` + mock 端点 | +~15 |
| 9 | `thincoder-vscode/test/setup-reminders.test.mjs` | 303 | 修改 | 新增「normal 模式 `hydrateRun` 零 manifest I/O」用例——模式**显式钉死** `opts.engState = { enabled: false }`（不得依赖本机 config.json——本机 `agent.engineering = true`；三级优先见 `agent-state.mjs:88-91`） | +~15 |

> **不碰**：`thincoder-core/manifest.mjs` 机制本体（#36 裁撤批在途——本批零碰）· `PROCESS_BASENAMES` 既有成员与文案 · spawn 门其他族 · 冻结批档 / `_archive/**` / 参照树。
> **设计档自身**（`MANIFEST.md` §2.2/§2.3/§2.4/§2.5/§3.1/§3.2/§4 + 架构档 §2.3 E2）已由本设计轮落笔——**coder 零写设计档**。

### 2.3 验收标准 → 用例（AC 全文与输入/预期单源 = 设计档 §3.1 / §3.2——本表只做映射）

| AC | 场景（用例号） | 机判要点 |
|---|---|---|
| AC-14 | **#30 回归**：普通会话 + 非仓 cwd（T23）· 普通会话 + 仓内有档（T24）· CLI 子进程非仓启动（T31） | 不抛；`agent.manifest === null`；档不存在 / 未被读；子进程退出码 0 且 stderr 无「工程模式启动拒绝」 |
| AC-15 | 工程模式四态（T25 附着+建档 / T26 非仓拒且不建档 / T27 档非法 fail-closed / T25 合法附着） | 四态各一断言；T26 断言档**未**生成 |
| AC-16 | 会话权威重估（T28）+ `bin` 调用点在 `applySession` 之后在场 | 行为面 + 源码接线锁（`acp-channel.test.mjs:275` 同法） |
| AC-17 | 翻转清陈旧（T29） | 重调后 `agent.manifest === null` |
| AC-18 | #33 声明面（T30） | `["PROJECT-MANIFEST.json"]` / `["sub/project-manifest.JSON"]` / 混合例 → 拒；`T8b`/`T8c` 零改全绿 |

### 2.4 需求侧待同步（**父侧域——本批列清单不落笔**）

- `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` **②.3** + **AC-M1-2**：加**工程模式会话**口径限定（现文无模式限定 ⇒ 与 #30 修法后的实况不符）。
- 同档 **②.5 / AC-M1-5**：二道防线（M5 spawn 门 `files` 域排除）在规格侧**无对应条目**（缺位）——是否补一条 AC 归父侧裁定。
- 架构档 `ENGINEERING-MODE-V2.md` §2.3 E2 已由本设计轮就地加限定句（设计档域）——需求侧若改口径，回指同步归父侧。

### 2.5 本批边界 / 待裁（发现逐条上报）

1. **进程内中途翻转不重估**（KD-M1-13 执行点不含）：`/eng` ON（`cmd-eng.mjs`）· `/session` 切槽（`cmd-session.mjs:92`）· ACP 装载（`acp.mjs:249`/`:294`）· 核心 `eng` 工具（`agent-tools/eng.mjs`）。后果：① 翻转后相位行静默（`agent.manifest` 缺失）② 该会话不享 E2 启动门槛（下次启动重估）。**补这一族的前置问题属语义面**：`/eng` 翻转遇根不可解析应「拒翻」还是「放行 + 告警」——FR11（`eng` 无前提）与新门槛冲突，需父侧裁定后另批落笔（本批未自行选解）。
2. **`write-gate.mjs` 注释收正**属零语义一致性面（就地改，已列 §2.2 行 5）——如判超出本批面可直接回退该行（其余不受影响）。
3. 需求侧三处（§2.4）为父侧域，本批零碰。

### 2.6 修正轮（设计评审轮 1 落地 · eng-designer 2026-09-18）——发现 1–9 逐条

> append-only 追加，不回改上方 §2.1–§2.5 任何既有行。**零新语义 / 零新范围**：只落批档 §3 发现 1–9（父侧裁定 9/9 全数接受）的直接导出项。
> **判据单源 = 设计档**（`docs/core/design/MANIFEST.md` §2.2 / §2.4 / §2.5 / §3.1 / §3.2）。据此，上方以下三处**已被本修正轮取代**（保留为落档时快照，不得再作契约引用）：
> ① §2.1 行①「判据 = `agent.config?.agent?.engineering === true`」句 → 现为「**会话权威值**：槽优先 + config 回退」；
> ② §2.4「需求侧待同步」两条 → **需求侧已落**（父侧 2026-09-18 落笔）；
> ③ §2.5 第 1 条（进程内翻转族含 ACP）→ 现**两分记**（会话起点 ACP / 进程内翻转）。

| # | 级别 | 处置（定稿） | 落点（file:line） |
|---|---|---|---|
| 1 | 🔴 | 装配期判据改**会话权威值**（`恢复槽带 engineering 字段 ? 槽值 : config`）；**读点 = 参数注入**（`bin` TUI 分支 `resumeSlot` 前移 + `slotData` 形参）；call point ② 保留为幂等重估；AC-16 补反向格；受影响文件表行 1/2 改写 | `MANIFEST.md:64-65` · `:90-96` · `:99-106` · `:146-149`（KD-M1-12/13/15）· `:288`（AC-16）· `:112-113` · `:328-331`（T28/T28b/T28c/T28d） |
| 2 | 🟡 | 三处「待同步 / 缺位」改指已落状态（②.3 / AC-M1-2 / AC-M1-8） | `MANIFEST.md:157` · `:374`；本表下方「§2.4 收正」 |
| 3 | 🟡 | AC-18 回指补 `AC-M1-8`（AC-M1-5 保留作写门主门回指） | `MANIFEST.md:290` |
| 4 | 🟡 | 措辞限定「**装配钩子**零 manifest I/O」+ 下游读面单列（本批零改）+ AC-14「不读」退为**可观测断言**（新 KD-M1-16） | `MANIFEST.md:65` · `:92` · `:146` · `:156` · `:158-159` · `:286` + `:292` · `:150`（KD-M1-16）· `ENGINEERING-MODE-V2.md:215` |
| 5 | 🟡 | AC-14 矩阵四格逐格可点；§3.2 补「仓内 + 无档」直测格 | `MANIFEST.md:286` · `:321-324`（T23/T24/T24b/T24c） |
| 6 | 🔵 | 钩子行补「钩子后移的可观察后果」半句（拒 / 建档晚于 memory sync + MCP 连接；功能等价） | `MANIFEST.md:106` |
| 7 | 🔵 | 家族两分记：会话起点（ACP——含整场无附着 / 无 E2 门槛 / 无下次重估）+ 进程内翻转（照旧待裁） | `MANIFEST.md:109` · `:160-164` |
| 8 | 🔵 | 拒文案钉稳定片段 `/Manifest file/`（句首锚，沿用 `spawn-gates.test.mjs:92-98` 锚法） | `MANIFEST.md:148`（KD-M1-14）· `:290`（AC-18）· `:333`（T30） |
| 9 | 🔵 | >300 行三行（#2 425 · #3 470 · #9 303）补「不拆」理由（增量微、无跨档）+ 行数债登记 | `MANIFEST.md:124-125` |

**§2.4 收正（发现 2）**：需求侧三处**已落**（父侧 2026-09-18 落笔）——`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:15`（②.3 已带「工程模式会话」口径 + 拒自动建档）· `:32`（AC-M1-2 已带普通会话半句）· `:38`（AC-M1-8 二道防线专条）。原「本批列清单不落笔」作废；**本批零碰需求档**（派单明确）。

**前提收正（评审员与父侧均述「`resumeSlot` = 同进程纯读」——实证不成立）**：`thincoder-core/session.mjs:52-55` → `session-slots.mjs:478-497` 逐行实证该函数含 `scheduleSessionGC` + `claimSlot`（写 `slotSessions` / 翻共享 `active`）+ `writeEndMarker`（写盘）。故**不在钩子内调用**（否则 `thincoder chat` / ACP 装配路径会凭空认领 / 分配槽并翻共享活跃指针）——设计选**参数注入** seam，父侧定案的「槽优先 + config 回退」语义零改（KD-M1-15）。另：`bin` TUI 分支 `resumeSlot` **前移**为同进程同一调用 ⇒ 零新增写动作；时序提前（装配失败路径下槽已认领）= 唯一的次序变化，已记 `MANIFEST.md:99`。

**计数（D3）**：AC-14–AC-18 = **5 条**（数量不变，内容改写）· §3.2 T23–T31 = **14 行**（新增 T24b · T24c · T28b · T28c · T28d）· KD-M1-12–M1-16 = **5 条**（新增 M1-15 · M1-16）· 变更记录 +1 条（`MANIFEST.md:375-384`）。

**机检读数（`node scripts/doc-check.mjs` · 本批写域 = 两份设计档）**：悬空 **836**（基线 837——**零新增**；顺手收正 1 条既有裸锚 `setup.mjs:96` → 全路径）· 行宽 **3**（= 基线；迭代中两处新增超宽行已拆分）· 全仓其余 FAIL 项与本批写域零交集。

**需求侧已落 + 父侧收正（2026-09-18 01:00——**父侧直改** · 可 revert）**：`SPEC-MANIFEST.md:15` / `:32` 已带「装配钩子」限定 + 会话权威值口径 ✓；ACP 族（会话起点）→ 已并入**台账 #41**（已裁另批：拒翻语义 + 会话起点面）。

**§2.6 补注（同轮追加）**：上方 §2.3 的「AC → 用例」映射表 = 设计轮快照，本轮扩展后**以设计档 §3.1 / §3.2 为准**——AC-14 四格 = T23（非仓+无档）/ T24（仓内+有档）/ T24b（仓内+无档）/ T24c（非仓+有档）+ T31（子进程面）；AC-16 三向 = T28（槽真 config 假）/ T28b · T28c（槽假 config 真，两 cwd 夹具）/ T28d（重估幂等）；AC-15 = T25–T27、AC-17 = T29、AC-18 = T30 不变。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核验口径**：只读本批四档 + 抽读被引代码点（行数抽检：`make-agent.mjs` 197 · `spawn-gates.mjs` 95 · `write-gate.mjs` 86 逐字相符；`bin/thincoder.mjs` / `setup.mjs` / 测试档按声明口径复算相符；功能级锚点 `:24` `:306` `:320` `:330` `:343` · `setup.mjs:242-246`/`:375-391` · `make-agent.mjs:42-64`/`:135`/`:148-149` · `cli-prompt-entry.test.mjs:27` 逐条命中）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 / 可行性 | 🔴 | 「config.json 真 + 会话槽假」状态下 #30 两症状全留：装配期钩子判据 = `agent.config?.agent?.engineering`（`MANIFEST.md:90`），而该值在装配期只等于 config.json 初值（`bin/thincoder.mjs:306` → `loadConfig()`；初值源 `thincoder-core/config.mjs:51`），槽值要到 `applySession`（`bin/thincoder.mjs:320`）才写回；`/eng` 只写槽、不镜像 config.json（`thincoder-cli/src/tui/cmd-eng.mjs:61-77` 逐字「config.json is just the initial default, no mirror write」；`thincoder-core/session.mjs:311-313`「the slot value is the CLI session's authority」）⇒ 用户一旦 `/eng off`，config.json 仍为 true（批档 `:53` 自注「本机 `agent.engineering = true`」）。此时装配期门通过：非仓 cwd 抛「工程模式启动拒绝」（`MANIFEST.md:96`），抛点早于 `applySession`（`bin/:306` 的抛出不属 `:344-356` 的 try，落 `:90-91` 进程级 fatal）⇒ call point ②（`MANIFEST.md:95`）永不执行，「重估即纠正」在该状态下失效；仓内无档则自动建档（`MANIFEST.md:96` 初始化分支），档残留。AC-14/AC-16 只覆盖反方向（槽真 / config 假——`MANIFEST.md:268`/`:270`），§2.5 披露清单（`:144-146`）只列「进程内翻转 / ACP」，本状态不在任何披露或 AC 内；KD-M1-13 已判「只在装配期判 config.json」为被拒备选①（`MANIFEST.md:135`），而该被拒判据仍是装配期的实际判据。 | 令装配期判据取会话权威值：装配前先取槽（`resumeSlot(cwd)` 是同进程纯读——`bin/:315` 已在用），判据改「槽带 `engineering` 字段 ? 槽值 : config 值」；或把装配期的「拒 / 建档」两个致命动作推迟到会话应用之后（装配期只保留合法档的非致命附着）。AC 补一格：config.json `engineering:true` + 恢复槽 `engineering:false` → 非仓 cwd 不抛、仓内无档不建档。 |
| 2 | 文档归属 / 状态一致性 | 🟡 | 需求侧已落锚，设计与批档仍写「待同步 / 缺位」：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:15`（②.3 已带「工程模式会话」口径 + 拒自动建档）、`:32`（AC-M1-2 已带普通会话半句）、`:38`（AC-M1-8 二道防线已存在）vs `MANIFEST.md:143`「需求侧口径待同步…二道防线在规格侧无对应 AC（缺位）——本批列清单不落笔」· `MANIFEST.md:349`「⑤ 需求侧待同步…二道防线 AC 缺位」· 批档 `:70-72`「本批列清单不落笔」。 | 三处改指已落状态：`MANIFEST.md:143` 去「待同步 / 缺位」句改指「需求侧已同步（②.3 / AC-M1-2 / AC-M1-8）」；`:349` ⑤ 同改；批档 `:70-72` 改记「需求侧已落（本刻同步）」——与 `SPEC-MANIFEST.md:38` 保持同口径单源。 |
| 3 | 需求覆盖 | 🟡 | AC-18 回指漏挂已落的需求锚：`MANIFEST.md:272` 回指列 = 「台账 #33 · AC-M1-5 二道防线」，而需求侧专条 = `SPEC-MANIFEST.md:38` AC-M1-8（判据逐字对位本 AC）；本档其余 AC 一律回指同号规格 AC（AC-14→AC-M1-2 等）⇒ 该条断链，机检 / 评审对不上号。 | AC-18 回指补 `AC-M1-8`（保留 AC-M1-5 作写门主门回指）。 |
| 4 | 清晰性 / 验收可机判 | 🟡 | 「零 manifest I/O」措辞超出本改动可保证范围：`MANIFEST.md:91`/`:134`（KD-M1-12）/`:142` 与已落规格 `SPEC-MANIFEST.md:15`/`:32` 均把「不读」写成普通会话的整体性质，但读 manifest 的消费面不按模式分叉——`thincoder-core/agent-tools/advisor.mjs:122` → `thincoder-core/agent/write-gate.mjs:47 readManifest(cwd)`、`thincoder-core/agent-tools/batch-segment.mjs:81 readManifest(base)`、`thincoder-core/ledger-db.mjs:31 resolveProjectRoot(cwd)` 任何模式照读（写门面 `thincoder-core/agent/dispatch.mjs:230-236` 亦无模式门）；同时 AC-14/T24 机判只断言 `agent.manifest === null` + 档不存在（`MANIFEST.md:268`/`:302`），「未被读」无判据 ⇒ 判据句↔实况、判据句↔机判两头不齐。 | 措辞限定到钩子面（「装配钩子零 manifest I/O」），并单列下游仍读盘的既有消费面（或登记为后续批）；AC-14 若保留「不读」，落一条读面探针（fs 读计数 seam），否则退为可观测断言。 |
| 5 | 验收覆盖 | 🟡 | AC-14 声明矩阵 = 「仓内 / 非仓 × 有档 / 无档」（`MANIFEST.md:268`），§3.2 只落两格：T23（非仓 + 无档）· T24（仓内 + 有档）；缺「仓内 + 无档」——恰为批档 `:11` 记的第二症状（「仓内 normal 模式无档则自动建档」）的直测格。 | §3.2 补一行（普通会话 + 仓内无档 → 不建档 / `agent.manifest === null`），AC-14 矩阵改为四格逐格可点。 |
| 6 | 清晰性 | 🔵 | 钩子体在 `assembleAgent` 内由 `createAgent` 前（`make-agent.mjs:42-64`）后移到其后（`MANIFEST.md:105`），工程模式的「拒 / 建档」因此晚于工具装配、MCP 连接与 memory sync（`make-agent.mjs:87-133` 段）发生——功能等价（仍不进正常循环），但失败路径工作量 / 耗时变化未在设计记一句。 | §2.2 钩子行补半句「钩子后移的可观察后果」；或保留前置（判据改读传入 `config` 而非 `agent`）。 |
| 7 | 边界标注 | 🔵 | ACP 装载被并入「进程内中途翻转不重估」家族（`MANIFEST.md:144`），但 ACP 装载是会话起点而非中途翻转（`bin/:395-399` → `runAcpServer`）；后果大于「相位行静默」：config.json 无 `engineering` 的 ACP 工程会话整场无附着、无 E2 启动门槛，且不走 `bin` 的 TUI 分支故无「下次启动重估」。 | §2.5 该家族两分记：「会话起点（ACP 装载）」与「进程内翻转（`/eng` · `/session` · 核心 `eng` 工具）」，后者照旧待裁。 |
| 8 | 验收可机判 | 🔵 | T30/AC-18 的「专用文案」未钉可匹配片段（`MANIFEST.md:272`/`:308`），而同族既有用例一律锚稳定片段（`thincoder-core/test/spawn-gates.test.mjs:92` `/engineering tool path/`、`:98` `/Parent-side maintained file/`）⇒ 新用例断言基准留白，实现者可自证。 | 设计里钉一句稳定片段（沿用既有锚法），用例按该片段断言。 |
| 9 | 受影响文件尺寸 | 🔵 | 表内 3 行处于 >300 行建议带（`bin/thincoder.mjs` 425 · `setup.mjs` 470 · `setup-reminders.test.mjs` 303），未带拆分说明；本轮增量为 +2 / ±~5 / +~15，三行均未跨 500 硬限（无跨档）。 | 三行各补一句「不拆」理由（增量微、无跨档）或登记行数债；本项不阻放行。 |

**体外注（不评、不设级）**：既有测试面对本门无回归——全仓测试零处断言「工程模式启动拒绝」；VSC 两档把 manifest 钩子当副产物守卫（`thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:40-41`/`:79-81` · `test/setup-reminders.test.mjs:41-44`），加门后 normal 分支仅少写一个档、清理变 no-op，无断言依赖；`cli-prompt-entry.test.mjs` 系统提示面不随 `agent.manifest` 变动（相位行另受模式门 ② 拦）。

**计数**：🔴 1 · 🟡 4 · 🔵 4

VERDICT: changes-required

### 轮次 2（评审子代理）

**核销轮（轮 2 重跑——收敛口径）**：只读本批四档 + KD-M1-15 证据抽读（`session.mjs:52-55` / `session-slots.mjs:478-497`）；只核 5 束修复声明逐条落位 + 前提收正与证据相合 + 必要性掠扫；不穷举复核引证、不重评设计全量。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/MANIFEST.md` | 🔴 | Fixed | 判据改会话权威值：`:90`「判据单源——会话权威值优先」+「槽优先 + config 回退」；`slotData` 形参 `:98`；装配期取槽值 = `resumeSlot` 前移 `:99`；AC-16② `:288`「槽假 config 真」；T28/T28b/T28c/T28d `:328-331`；KD-M1-15 `:149` |
| 2 | 1-前提 | `thincoder-core/session.mjs` · `thincoder-core/session-slots.mjs` | 🔴 | Fixed（证据相合） | `session.mjs:52-55` resumeSlot = `scheduleSessionGC(cwd)` + 委派；`session-slots.mjs:490` `if (slot !== null) claimSlot(cwd, slot, m, deadParam)` · `:491` `else slot = allocateFresh(cwd, m, deadParam)` · `:495` `writeEndMarker(cwd, slot)`——「非纯读」成立 ⇒ 参数注入 seam 与证据相合 |
| 3 | 2 | `docs/core/design/MANIFEST.md` | 🟡 | Fixed | `:157`「需求侧已同步（2026-09-18 父侧落笔·评审轮 1 发现 2 收正）」；`:374` ⑤「修正轮收正」 |
| 4 | 2 | `docs/batches/2026-09-17-assembly-gate-fixes.md` §2.6 | 🟡 | Fixed | 取代注：`:89`「§2.4「需求侧待同步」两条 → **需求侧已落**」+ `:104`「§2.4 收正（发现 2）……已落」；原「列清单不落笔」作废（append-only 纪律下取代注） |
| 5 | 3 | `MANIFEST.md` + `SPEC-MANIFEST.md` | 🟡 | Fixed | `:290`「台账 #33 · **AC-M1-8**（主门回指 AC-M1-5）」；`SPEC-MANIFEST.md:38` AC-M1-8 在 |
| 6 | 4 | `MANIFEST.md` · `ENGINEERING-MODE-V2.md` · `SPEC-MANIFEST.md` | 🟡 | Fixed | 三处限定「装配钩子零 manifest I/O」（`:65`/`:95`/`:146`）；§2.5 读面边界条 `:158-159`（下游三消费面照读、本批零改）；KD-M1-16 `:150`；AC-14 口径注 `:292`；架构档 `:215` 口径限定；SPEC `:15`/`:32` 已带限定（父侧已落） |
| 7 | 5 | `docs/core/design/MANIFEST.md` | 🟡 | Fixed | AC-14 四格 `:286`（含「仓内 + 无档：**不建档**」）+ T24b/T24c `:323-324` |
| 8 | 6 | `docs/core/design/MANIFEST.md` | 🔵 | Fixed | `:106`「钩子后移的可观察后果（评审轮 1 发现 6）」 |
| 9 | 7 | `docs/core/design/MANIFEST.md` | 🔵 | Fixed | `:109` 两族两分记 + `:160-164`（会话起点 ACP / 进程内翻转） |
| 10 | 8 | `docs/core/design/MANIFEST.md` | 🔵 | Fixed | `/Manifest file/` 稳定片段：KD-M1-14 `:148` · AC-18 `:290` · T30 `:333` |
| 11 | 9 | `docs/core/design/MANIFEST.md` | 🔵 | Fixed | `:127-128` 三行 >300 不拆理由 + 「行数债随下次触碰该档时评估」 |

**计数**：🔴 0 · 🟡 0 · 🔵 0 —— 9/9 修复声明全数落位；残留 0 / 新增 0。

VERDICT: pass

## §4 用户批准（主 agent）

**代签 2026-09-18 00:42**（承用户 23:33「开始处理」授权）：设计评审轮 1 changes-required → fix 轮（id=22，9/9）→ 核销轮 1 超时（id=25）→ **核销轮 2 PASS（id=26）**；设计 token 已签发（值不落文档——运行时凭证）。**实施面** = 设计档 §2.3 表（批档 §2.2 同域以设计为准）+ §2.6 收正（行 1/2 判据改写 + `slotData` seam）——9 档 + 新增档；AC-14–AC-18 / T23–T31（含 T24b/c · T28b/c/d）全量。**需求侧已同步**（SPEC ②.3 / AC-M1-2 / AC-M1-8）。**→ 派 coder（initial 轮）。**

## §5 实施记录（eng-coder）

**轮次**：initial。**开工复读**：`git status`（36 M + 2 untracked——他批在飞；本批写域 9 档无并发冲突，逐档复读行数后逐档落笔）。

### 5.1 交付摘要（9 档 —— 与设计 `MANIFEST.md` §2.3 表逐行同构）

| # | 文件 | as-of → 交付 | 变更要点（file:line 为交付后行号） |
|---|---|---|---|
| 1 | `thincoder-cli/src/cli/make-agent.mjs` | 197 → 223 | 内联钩子块抽为导出 `attachManifest(agent, { cwd, slotData })`（`:140-184`）；块首模式门（判据 = 「槽带 `engineering` 字段 ? 槽值 : config」——`:160-161`，在场判据与 `applySession`（`session.mjs:314`）同款）；`assembleAgent({ excludeTools, slotData })` 在 `createAgent` 后调用附着（`:129`） |
| 2 | `thincoder-cli/bin/thincoder.mjs` | 425 → 432 | ① `:24` import 加名；② TUI 分支 `resumeSlot` 调用前移至装配之前（`:313`）+ `assembleAgent({ slotData: data })`（`:314`）；③ `agent._slot = slot` 后一行 `attachManifest(agent)`（`:337`——重估点，`applySession` `:323` 之后） |
| 3 | `thincoder-vscode/src/agent/setup.mjs` | 470 → 475 | `hydrateRun` 钩子块（`:371-396`）块首模式门：`agent.config.agent.engineering !== true` → 只置 `agent.manifest = null`（`:378-380`）；工程模式四支路（含 `depth === 0` 初始化）逐字保留 |
| 4 | `thincoder-core/agent-tools/spawn-gates.mjs` | 95 → 107 | 新常量 `MANIFEST_BASENAME = "project-manifest.json"`（字面量·`:84`，不 import `MANIFEST_REL`——保叶子零 import）+ `rejectEngineeringFilePaths` 新 `else if`（`:102-104`，文案句首锚 `Manifest file`）；`PROCESS_BASENAMES` 成员与文案零改 |
| 5 | `thincoder-core/agent/write-gate.mjs` | 86 → 87 | 注释收正（`:14` / `:40-41` 加「**工程模式会话**口径（KD-M1-12）」）——零语义 |
| 6 | `thincoder-core/test/spawn-gates.test.mjs` | 121 → 141 | 新增 `T8f（设计 §3.2 T30）`（`:125-141`：大小写 / 层深 / 绝对路径变体 + 混合收集两文案 + 近名不误伤 + `normalizeFileList` 通道）；T8b/c/d/e 零改 |
| 7 | `thincoder-cli/test/make-agent-manifest-gate.test.mjs` | 0 → 184 | **新增**：`attachManifest` 直调组——T23/T24/T24b/T24c（`:37-69`）· T25/T26/T27（`:73-103`）· T28/T28b/T28c/T28d（`:107-155`）· T29（`:159-168`）· AC-16 接线锁（`:172-184`，`bin` 源码序） |
| 8 | `thincoder-cli/test/integration/cli-prompt-entry.test.mjs` | 100 → 115 | `mkEnv` 加 `{ repo = false }` 非仓变体（既有两例语义零改）+ 新增 T31（`:105-115`：非仓 + normal 子进程——退出码 0 / stderr 无拒绝 / 不建档） |
| 9 | `thincoder-vscode/test/setup-reminders.test.mjs` | 303 → 321 | 新增模式门用例（`:191-205`：normal 钉 `engState`——不附着 + 不建档；工程附着；翻转清陈旧 + 档零写） |

### 5.2 决策透明表（实施期判断，逐条）

| # | 判断点 | 处置 | 依据 |
|---|---|---|---|
| 1 | 「槽带 `engineering` 字段」的机械判据 | `slotEng !== undefined`（= `applySession`（`session.mjs:314`）同款；槽值 `null` 视作在场 ⇒ `false`） | 设计 §2.2`:90` 逐字 + 「与 `applySession` 同款」自注；使装配期判据与 `applySession` 将写入的取值恒同 |
| 2 | `assembleAgent` 内 `attachManifest` 调用位 | 置于 `agent._mcpWarnings = mcpWarnings` 后（原 `:148-149` 附着位并入——createAgent 之后） | 设计 §2.3 行 1「`createAgent`（`:135`）后调用并附着」；钩子后移后果已在设计 §2.2`:106` 在册 |
| 3 | 两处陈旧模块档指针（`docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md`——该路径已不存在） | 在本批改写的两块注释内就地收正为 `docs/core/design/MANIFEST.md`（零语义） | 该两行属本批改写行；陈旧指针与实况矛盾（形式合规） |
| 4 | `attachManifest` 的返回值 | `object \| null`（附着后 manifest / 普通会话 null） | 便于用例直断；设计未规定返回值（接口约定零冲突） |
| 5 | T28d「重估点幂等」复刻真实调用形态 | 用 `process.chdir(dir)` + `try/finally` 复刻 `bin` 的 `attachManifest(agent)`（缺省 cwd） | 设计 §3.2 T28d 输入逐字 = `attachManifest(agent)`；测试进程内 chdir 复原保证零外溢 |
| 6 | VSC 四格 / AC-16① 子格补测 | AC-16① 括注（缺档 / 非仓）在 T28 内补齐（design §3.2 输入不变、断言增强）；VSC 端四格其余三格**不补**（设计 §2.3 行 9 只要求一条 VSC 用例——见 5.3 评审 🔵4 未采纳理由） | 验收对齐设计 §3.1/§3.2；不扩审批面 |
| 7 | 临时日志落点（`D:\teamcode\*.log` / 仓内 `.tmp-core-test.log`） | 已全部删除（零残留）；**如实披露**：测试日志曾写到仓外 `D:\teamcode\` 三处（壳层重定向，非文档 / 代码产物） | 报告纪律：超声明面如实披露 |

### 5.3 审计与代码评审（轮次与终态）

- **内部探索审计（只读 explore）×1**：9 档 + 设计档 + 批档逐条对账——**四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）全数未成立**（AC-14–AC-18 / T23–T31 逐条可点、判据与实现同一语义、改动面 ≡ 批准清单）。非偏差披露 4 条：批档 §5 待写（本段）· AC-16① 子格未直测（→ 已采纳，T28 增强）· 槽在场判据 CLI/VSC 微差（不可达，保留）· 绿态未由其复现。
- **内部代码评审（advisor·type=code，轮 1 full）×1：VERDICT: pass**——🔴 0 · 🟡 1 · 🔵 3。
  - 🟡1（三档 >300 行：`bin` 432 · `setup.mjs` 475 · `setup-reminders.test.mjs` 321）：**非阻塞**——设计 `MANIFEST.md:127-128` 已登记「不拆」理由与行数债，属已裁定债（R3 不重审）⇒ 零动作。
  - 🔵2（接线锁以源码字面串定位）：设计明定手法（AC-16 接线锁），保留。
  - 🔵3（两端拒文案逐字重复——漂移风险）：设计未要求文案单源（单源面 = 判据）；提质项，本批零动作，已透传父侧。
  - 🔵4（VSC 端四格仅覆盖格②+翻转）：设计 §2.3 行 9 只要求一条用例 ⇒ 非验收缺口；静态可判（`:378-380` 提前 return 零 fs）⇒ 本批不扩面。
- **fix 轮**：评审**无必改项** ⇒ 0 轮（T28 增强系审计建议的自定加固，非评审返修）。

### 5.4 验证读数（本机 2026-09-18）

- **三端全量**：`thincoder-core` **298/298 pass**（fail 0）· `thincoder-cli` **628/628 pass**（fail 0）· `thincoder-vscode` **591/591 pass**（fail 0）；定向复跑：`make-agent-manifest-gate` 13/13 · `spawn-gates` 15/15 · `cli-prompt-entry` 3/3 · `setup-reminders` 16/16。
- **断言非空转实证**（同夹具双向）：`agent.engineering` 缺省 + 非仓 cwd → 子进程退出码 **0**、stderr 无「工程模式启动拒绝」；`agent.engineering=true` + 非仓 cwd → 退出码 **1** + 「工程模式启动拒绝」在 stderr ⇒ 门开 / 门关两向均可观测。
- **判据端到端实证**（真槽记录）：`/eng off` 形态（槽 `engineering:false` + config 真）——非仓不抛、仓内不建档；`applySession` 后 config 被订正回槽值 ⇒ 重估幂等。
- **机检**（`node scripts/doc-check.mjs --root .`）：本批写域 9 档全为代码 / 测试（`docs/**` 零碰）⇒ **锚 / 行宽零新增**；全仓读数 悬空 **758** · 行宽 **4**（4 条 = `AGENT-PARAMS.md:136` · `ENG-TOKEN-BINDING.md:147` · `persona-engineering.md:137` / `:139`——均他批在改档，与本批写域零交集，读数漂移同因）。
- **行号漂移（设计 §2.2/§2.5 as-of 参考的落点变化，D4 口径：落点以函数名为准）**：`bin` `resumeSlot` `:315→:313` · `assembleAgent` `:306→:314` · `applySession` `:320→:323` · `agent._slot` `:330→:330` · `attachManifest` 新 `:337`；9 档行数见 5.1。

### 5.5 未落 / 待父侧

- 设计 §2.2`:109` / §2.5 在册的两族（会话起点 ACP · 进程内翻转）= **本批显式不做**（ACP → 台账 #41；翻转族待父侧裁定后另批）——零动作（如实声明，非静默简化）。
- 评审 🔵3 / 🔵4 为提质项，本批零动作（理由见 5.3）——父侧若要求可另批落。

## §6 验证与收口（父代理）

### 6.1 父侧实施核验（2026-09-18 01:00——实读 + 实跑，非转录）

- **实读**：`make-agent.mjs:159-184` `attachManifest(agent, { cwd, slotData })`（判据 `:160-161` 槽在场 ? 槽值 : config；普通会话 → `agent.manifest = null`；工程四态含根不可解析拒 + `initManifest`）✓ · `bin/thincoder.mjs:312-337`（`resumeSlot` 前移 `:313` → `assembleAgent({ slotData: data })` `:314` → `applySession` `:323` → 重估 `attachManifest(agent)` `:337`）✓。
- **实跑（父侧复跑）**：core `spawn-gates` **15/15** · CLI `make-agent-manifest-gate` + `cli-prompt-entry` **16/16** · VSC `setup-reminders` **16/16**（fail 0）✓；全量读数（coder 轮）：**298/298 · 628/628 · 591/591**；AC-14–AC-18 / T23–T31（含 T24b/c · T28b/c/d）全绿。

### 6.2 披露项处置

- 超声明面日志（仓外三处 + 仓内一处）→ coder 自清 ✓（零残留）。
- 行号漂移（as-of 参考）：`bin:306→:314` · `resumeSlot :315→:313` · `applySession :320→:323` · 重估点新 `:337` → 设计档条文下次触碰时收口（eng-designer 域）——本处登记。
- 设计增量估计漂移（`+~85` vs 实测 184）→ 登记（设计档自身估值，非判据）。
- 批档 §2.6 «待父侧» 注 → **父侧直改**（本刻 · 可 revert）：需求档已落 + ACP 并入 #41。
- 显式不做（在册）：进程内翻转族 / ACP 会话起点（台账 #41）· `manifest.test.mjs:3` 旧模块指针族（台账 #42）✓。

### 6.3 收口

- 交付提交 = **60fec0e4**（11 档；+536 / −47）；设计档 `MANIFEST.md` / `ENGINEERING-MODE-V2.md` 的批② 落笔**随 doc-debt 批提交**（同域在写中，防半态入库）——本档 §6 随收口提交 · 台账 **#30 / #33**：已核销 ✓ · 凭证槽 consume ✓。
