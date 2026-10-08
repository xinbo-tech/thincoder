# 2026-10-08 · manifest-agent-tool
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 用户 2026-10-08 三令（15:47「project-manifest在内核中有管理代码，但是没有开放工具给agent」∥ 15:50 两场景「有些仓没有project-manifest需要创建／有些仓需要引用公共仓，需要在project-manifest里标记」∥ 15:52「我实际是需要project-manifest的各节点都能被agent读写」）；需求档落 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7 + ③ 边界三句 + ④ AC-M1-10–12 + ⑤（2026-10-08 主 agent 落）；台账 #1098。
> 台账 = #1098（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>


**来源与口径（用户 2026-10-08 三令 · 逐字）**：15:47「使用中发现点问题：project-manifest在内核中有管理代码，但是没有开放工具给agent」∥ 15:50「有些仓没有project-manifest需要创建，还有就是有些仓需要引用公共仓，需要在project-manifest里标记。」∥ 15:52「我实际是需要project-manifest的各节点都能被agent读写。」⇒ 口径 = **全键读写**。

**取证（父侧实读）**：内核齐备——`thincoder-core/manifest.mjs`（`readManifest:154` ∥ `writeManifest:252`——落盘前校验 + `writer==='main'` 写门 ∥ `initManifest:270`）+ `manifest-schema.mjs`（八键；三族声明键 `codePaths` / `index.{codeExtensions,docExtensions,publicRepos}` / `advisor.{docMap,standardsDoc}`）；agent 侧 = **零工具**（唯一写点 = `agent-tools/eng.mjs:81` 翻转建默认档）；CLI 零子命令。

**需求档（已落 · 硬口径）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7（读/建/写全键族 + 目标面 + 权限面）∥ ③ 边界三句 ∥ ④ AC-M1-10–12 ∥ ⑤。

**设计轮并案观察项**：`docs/core/design/MANIFEST.md:306`「非锚项目缺档 ⇒ 动作侧报明/建档（留后续批）」——与本工具面天然衔接，判明关系或明确零动。

**批设计前合并扫描**：池内无同批对象（#1098 单点）；#1097（450 族 vsc + MANIFEST 同形块族）——450 族 = vsc 面（不同面不并）；块题半属文档卫生面，留原行。

**流程**：设计正式化（eng-designer 在跑）→ 设计评审（用户点火）→ §4 批准 → 实施（eng-coder）→ §6 收口。

**授权（用户 2026-10-08 16:10）**：用户原话「那个评审先做了，自动跑完吧。」= **本批全链授权（代点火 + 排空模式）**：射程 = 本批（#1098 manifest 工具面）——设计评审点火 / §4 代签 / 修正轮与实施轮派发 / 收口核销 / 提交推送 / token 消费，父侧自动执行不必逐次请点。
**父侧自缚三条（本仓惯例）**：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）；每次代签在 §4 写明「父侧代签（用户 16:10 授权）+ 三条件依据」；② 需要**新范围**（射程外条目点火）或**用户口径裁决** ⇒ 停、只摆那一条；③ 破坏性 / 不可逆动作 ⇒ 先停。
**相邻面一处已裁（射程内 · 父侧依新令裁）**：`PROMPT-SYSTEM.md:402`「不造新工具」半句 —— **用户 2026-10-08 新令（造 `manifest` 工具）覆盖该半句**（判据 = 指令优先级：用户本轮新令 > 既有文档句；§6.15 余句不受影响）；实施轮连带收正该半句。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 修正已落（2026-10-08 fix 轮 · eng-designer）——设计档 = docs/core/design/MANIFEST.md §2.10 + 连带）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖——台账 #1098）**：需求 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` —— **②.7**（agent 工具面：读 / 建 / 写全键族 / 目标面 / 权限面）+ **③ 边界三句** + **④ AC-M1-10–12**；**⑤** 依赖（工具面两行）父侧已落。

**并案观察项判定**（§1）：`docs/core/design/MANIFEST.md:306`「非锚项目缺档 ⇒ 动作侧报明 / 建档（留后续批）」——判 = **并入本格**：本工具面 = 该登记的「动作侧报明 / 建档」首格实现（`read` 五态报明 ∥ `init` 建档）；余消费面（写门 / 台账 / 机检）仍留后续批。落点 = 设计档 `:306` 承接句 + §2.5 新条。

**设计档落点（全部实落）**：`docs/core/design/MANIFEST.md`（M1 属主档）——

- 新增 **§2.10**（agent 工具面：工具形 / 目标面 / 装配落法 file:line / 报告面 / 边界 / 需求侧锚 / 登记）；
- **§1.2 F8**（功能点回指 ②.7 + AC-M1-10–12）· **§1.4** 边界句；
- **§2.3** 行 **50–56**（受影响文件 + Δ 上界 + 相邻面登记块——「十批并列」计数随动）；
- **§2.4 KD-M1-38–M1-40** · **§2.5** 新条（既有面零碰 + `PROMPT-SYSTEM.md:402` 口径核对 + `:306` 承接句）；
- **§3.1 AC-40–AC-43** · **§3.2 T63–T69** · **§4** 落点指针 + 变更记录一行。

**机制设计（摘要——全量 = §2.10）**：

1. 工具形 = 新档 `thincoder-core/agent-tools/manifest.mjs`（`manifest` 工具；动作 `read` / `init` / `write`）；**写 = 点改**（`key` 点分路径 + `value`，单键单次）；写面白名单 = 全键族（判据单源 = `MANIFEST_SCHEMA`）；白名单外 ⇒ 拒。
2. `value` 解析沿 settings 先例（JSON.parse 优先 / 失败取字面串）；`"null"` ⇒ `null`（`docRoot.*` 本面无——KD-M1-37）。
3. 写路径复用：落盘恒经 `writeManifest` / `initManifest`；`writer` 恒显式 `'main'`；零新写路径。
4. 目标面：`read` = `projectView`（五态报明）；`init` / `write` = `projectRootView`（歧义 ⇒ 拒 + 候选全列）；**init 不覆盖**（已带档 ⇒ 拒）；**write 不建档**（缺档 ⇒ 拒 + 引导 init）。
5. 装配：登记册 `agent-tools.mjs` +1 导出；`family-tools.mjs` depth-0 段挂载（**两模式同挂**——需求未设模式门）；子代理五段零挂；分类面 `dispatch-gates.mjs` 补 `read` 只读格；描述档 `tool-docs/manifest.md`（拟新增）+ `check-vsix.mjs` `EXPECT["tool-docs"]` 48 ⇒ 49。
6. 报告面 = **随动零改**（③b mtime 门控覆盖工具写盘；不新增内存同步通道——KD-M1-40）。

**受影响文件与测试面**：产品码 5 档（新 2 / 改 3）+ VSC 检查档 1 + 批内件 1 —— 逐档行数与 Δ 上界 = 设计档 §2.3 行 50–56。测试面 = 批内件 `docs/batches/2026-10-08-manifest-agent-tool.test.mjs`（T63–T69 对应；不进仓套件——实施轮落 + 跑）。仓套件面 = `thincoder-core/test/` 现为空清单（全清重置态）——本批不动。

**验收对照**：AC-M1-10 ⇒ **AC-40** · AC-M1-11 ⇒ **AC-41** · AC-M1-12 ⇒ **AC-42** · 工具形 / 分类 / 描述登记 ⇒ **AC-43**（逐条判法 = 设计档 §3.1 表）。

**关键决策**：KD-M1-38（点改 ∥ 写面白名单——被否：整档写 / raw 基底 / 无白名单）· KD-M1-39（判据复用零新解析器 ∥ init 不覆盖 ∥ write 不建档）· KD-M1-40（报告面随动——被否：工具 → 内存值直写）。

**零触披露**：产品码零触（设计轮）· 需求档零触 · 台账零触 · `docs/core/design/MANIFEST.md` 以外零触 —— **相邻面登记**（在册设计档 §2.3 Δ 块 + §2.5 条，待父侧裁）：`TOOLS.md` §6.2 / §6.7（+`manifest`；既存漂移 = `notify_parent` ∥ `ledger` 未列）· `ENGINEERING-MODE-V2.md` §2.2 M1 行（工具面半句）· `PROMPT-SYSTEM.md:402`「不造新工具」半句收正（口径裁 = 用户 2026-10-08 新令覆盖该半句；§6.15 余句不受影响）。

**发现登记（上抛·知会）**：`promptsLanding` 校验面 = `validateManifest` 零形态校验；消费面 = 核内未见读取方（2026-10-08 实读）⇒ 写面可落任意形态且当下无消费方感知。既有状态（非本批引入）；补校验 / 补消费面 = 另裁（登记落设计档 §2.10）。

**机检读数（设计轮 · 门禁一次）**：`node scripts/doc-check.mjs` ⇒ **EXIT 0**（0 悬空 ∥ 0 行宽）。过程如实：首轮机检暴露 **9 处本批新增悬空锚**（拟新增档引用 4 · 歧义 basename 4 · 谓词-宿主符号锚 1）——已按既有两族标记（「拟新增」）+ 全路径形收正；终轮 0。行数面差异 1 条（`docs/desktop/design/SHELL.md`——既有、非本批面）。

**上抛项**：无阻塞项（待设计评审）。

**设计评审轮 1 修正块（fix 轮 · 2026-10-08 · eng-designer）**——承 §3 轮次 1（0🔴 · 4🟡 · 8🔵）；设计面 11 项逐号收正（#12 = 需求档计数 = 父侧已落，本席零触）：

1. 发现 1 → `docs/core/design/MANIFEST.md:216`（行 55）∥ `:619`：`EXPECT["tool-docs"]` 48 ⇒ **50**（断言 D 硬等口径——仓内侧现盘实读 49 档 + 本批 +1；`prompts: 16` 实读复核无漂移）。
2. 发现 2 → `MANIFEST.md:600-601`（§2.10）：写面白名单**谓词钉死**（`keys` 中非 `nestedKeys` 父键者 + `nestedKeys` 子键；四族整键写 ⇒ 拒）；AC-41②（`:696`）∥ AC-43①（`:698`）补「四族整键写」拒例。
3. 发现 3 → `docs/core/design/PROMPT-SYSTEM.md:402-403`：半句收正（declared-sources 维护面限定 + 例外句——`manifest` 工具）；`MANIFEST.md:326` 登记句 ⇒ 「已落」。
4. 发现 4 → `MANIFEST.md:349`（§2.5）：读面边界枚举补 `manifest` 工具行（任何模式可读 / 可写——装配钩子面零 I/O 口径零改）。
5. 发现 5 → `MANIFEST.md:780-783`（§3.2）：补 **T70–T73** 四行；AC-43 可机判列（`:698`）挂 T70–T73。
6. 发现 6 → `MANIFEST.md:695`（AC-40）：判据限「**已知键**」；`:776`（T66）登记「未知键丢 / 缺键补默认 = `readManifest` 回写收敛语义（KD-M1-11）」。
7. 发现 7 → `MANIFEST.md:299`（KD-M1-29）：建档站点枚举补第三格（工具 `init`——动作侧显式调用、非自动建档）。
8. 发现 8 → `MANIFEST.md:209-210`（行 48/49）：现盘 `\n` 计数回填（`manifest-schema.mjs` **178** ∥ `manifest.mjs` **272**）。
9. 发现 9 → `MANIFEST.md:264`：峰值句 = 「既有档 ≤191 ∥ 新增工具档 ≤260（均 <300）」。
10. 发现 10 → `MANIFEST.md:698`（AC-43 回指）：F15 补档名（`docs/core/requirements/TOOLS.md` §4.2 `:69`——实读）。
11. 发现 11 → `docs/core/design/TOOLS.md:175`（§6.2）∥ `:251-253`（§6.7）：+`manifest` + 既有漂移两行（`notify_parent` ∥ `ledger`）。

**一致性随动（同链导出——披露）**：`MANIFEST.md:265`（相邻面登记改实况：`TOOLS.md` / `PROMPT-SYSTEM.md:402` 已落 ∥ `ENGINEERING-MODE-V2.md` §2.2 M1 行在册）；三档 changelog 各 +1 行（fix 轮惯例——`MANIFEST.md:803` ∥ `TOOLS.md:1360` ∥ `PROMPT-SYSTEM.md:659`）。

**零触披露**：产品码零触 · 需求档零触（#12 父侧已落）· 批档 §1/§3/§5/§6 零触 · 他批零触。

**机检读数（fix 轮 · 门禁一次）**：`node scripts/doc-check.mjs` ⇒ 涉档零新 ✗（三涉档 0 悬空 ∥ 0 行宽）；全局 1 悬空 = `docs/core/requirements/AGENT-LOOP.md:340`（他批在飞面——非涉档，报备）。

**上抛·知会（未动报备）**：① `TOOLS.md` §6.11「49 档随包发布」——本批实施后应 = 50（与发现 1 同链）；② `PROMPT-SYSTEM.md` `:21` ∥ `:23` ∥ `:164` ∥ `:206` ∥ `:315`「48 档工具描述」——既有漂移（10-07 起实读 49；本批后 = 50；`:332` 复测注记 = 同拍既有读数）。两处未指名未动，供父侧裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance / 数值前提 | 🟡 | 行 55（`MANIFEST.md:216`）与 §2.10（`MANIFEST.md:617`）把 `check-vsix.mjs:37` 的 `EXPECT["tool-docs"]` 目标值定为 49（48 ⇒ 49）；但断言 D 是**硬等**（`thincoder-vscode/scripts/check-vsix.mjs:94` `repo.size === EXPECT[dir]`，仓内侧计数面 = `:49`），而 `thincoder-core/tool-docs/*.md` 现盘逐一枚举 = **49 档** ⇒ 现值 48 已差 1；本批入 `tool-docs/manifest.md` 后仓内侧 = **50**，按设计写 49 ⇒ 断言 D 仍拒 | 按现盘实读钉死目标值：现盘 49 ⇒ 入档后 **50**（一次改到 50）；并复核 `prompts: 16`（`:37`）是否同源漂移 |
| 2 | Clarity / 判据单源 | 🟡 | §2.10「写面白名单」枚举列与所声明单源表达式不等价：枚举 = `version` / `phase` / `promptsLanding` / `codePaths` 整键 + 四族**子键**（`MANIFEST.md:599`），而 `MANIFEST_SCHEMA.keys = Object.keys(DEFAULT_MANIFEST)`（`thincoder-core/manifest-schema.mjs:60`）含 `docRoot` / `checkConfig` / `index` / `advisor` 四个**父键** ⇒ 字面并集 `keys` + `nestedKeys` 多出「四族整键写」四条路径，白名单谓词两读 | 钉死谓词（父键整写：受理 ∥ 拒——如取「`keys` 中非 `nestedKeys` 父键者 + `nestedKeys` 子键」），并同步 AC-41② / AC-43① 的白名单外例 |
| 3 | Document ownership / Doc-state | 🟡 | `docs/core/design/PROMPT-SYSTEM.md:402`「不造新工具 ∥ 不加机械门」半句与需求 ②.7（新增 `manifest` 工具）仍**并存于盘**——本档 §2.5 已登记该半句被覆盖（`MANIFEST.md:326`）且收正在册，但跨档相抵当下仍在 | 收正 `PROMPT-SYSTEM.md:402` 半句（限定到 declared-sources 维护面 / 加指向本批 ②.7 的例外句），使两档口径一致 |
| 4 | Doc-state / 消费面边界 | 🟡 | §2.5「普通会话的读面边界」条（`MANIFEST.md:347`）声明范围 = 装配钩子面，并以**枚举**列出「任何模式照读」的消费面（`MANIFEST.md:348`）；本批新增的 `manifest` 工具是**任何模式可读、且可写**的新面（`MANIFEST.md:614` 两模式同挂），未入该枚举 ⇒ 该条被当全称口径读时漏一格 | 在该条枚举补一行（`manifest` 工具 = 任何模式可读 / 可写；装配钩子面零 I/O 口径不变） |
| 5 | Acceptance criteria / 回指 | 🔵 | AC-43 四组断言（参数面 / 分类谓词 / 描述逐字节 / 三值解析）无用例行——T63–T69 只对手 AC-40–42（`MANIFEST.md:693-696`），该 AC 无 T 号可点 | 补一行用例（或把 T 号挂进 AC-43 的方法列） |
| 6 | Acceptance criteria / 口径 | 🔵 | AC-40 判据句「`read` 回读逐键相等 + 非目标键逐字零变」（`MANIFEST.md:693`）在**含缺键 / 未知键**的档上不成立——`write` 走「读现档 → 设节点 → 落盘」= `readManifest` 补默认 + 丢未知键（KD-M1-11 回写收敛）；T66 只登记缺键一格（`MANIFEST.md:774`） | 把 AC-40 判据限定为「已知键值逐键相等」，「未知键丢 / 缺键补默认」作为收敛语义显式登记 |
| 7 | Doc-state / 站点枚举 | 🔵 | KD-M1-29 站点枚举 = 「壳面入口（会话起点钩子 + 翻转面）」（`MANIFEST.md:299`）；本批把工具 `init` 立为第三个（显式、非自动）建档入口，§2.5 以「零改」带过（`MANIFEST.md:325`）⇒ 按枚举读易得「工具 init 越权」 | 在 KD-M1-29 站点枚举补第三格（工具 `init` = 动作侧显式调用、非自动建档） |
| 8 | Doc-state / 数值 | 🔵 | 行 48 / 49 的 as-built 计数（`MANIFEST.md:209-210` = 176 ∥ 270）与本轮读盘不符：`manifest-schema.mjs` 显示 179 行 · `manifest.mjs` 末行居 `:273`（`initManifest` 体 `:270-272`）⇒ 按本档口径注 ≈178 ∥ ≈272，差 ~2 行（两档均非本批触碰档） | 下次触碰该两档时按现盘实读回填 |
| 9 | Doc-state / 数值 | 🔵 | 本批 Δ 块判定句「本批触碰档增量后峰值 ≤191——均 <300」（`MANIFEST.md:264`）未计行 50 新档上界 260（`MANIFEST.md:211`） | 峰值句改写为「既有档 ≤191 ∥ 新增工具档 ≤260（均 <300）」 |
| 10 | Clarity / 回指 | 🔵 | AC-43 回指列写 `F15（描述面）`（`MANIFEST.md:696`）未带档名——本档 F 命名空间止于 F8，须跨档解析（= `docs/core/requirements/TOOLS.md:69` F15「工具 schema 上下文占用优化（描述外置统一 + 瘦身）」） | 补档名（或改挂档内锚），与同列其他回指体例一致 |
| 11 | Doc-state / 相邻登记 | 🔵 | `TOOLS.md` §6.2 元工具清单与 §6.7 要旨行本批后仍不含 `manifest`（已登记为本批零触的相邻面，`MANIFEST.md:265`；清单既有漂移 = `notify_parent` ∥ `ledger` 亦未列） | 下次触碰该两处时随拍补行（含既有漂移两行） |
| 12 | Requirements / 计数 | 🔵 | 需求档 ②.7 写「四项：」但实列五项（读 / 建 / 写 / 目标面 / 权限面——`SPEC-MANIFEST.md:29-34`） | 计数收正为「五项」（或并项叙述） |

VERDICT: pass

计数：🔴 0 · 🟡 4 · 🔵 8（共 12 条）。基准抽读（设计自述坐标 / 行数现盘核）：`MANIFEST.md:210`（`manifest.mjs` `:66` / `:154` / `:252` / `:270`）、`:200`（`manifest-discovery.mjs:115`）、`:212`（`agent-tools.mjs` 29 行 · `engTool` `:15`）、`:213`（`family-tools.mjs` 187 行 · `depthOnly` `:141-149` · `ledgerTool` `:145` · 动态 import `:29`）、`:214`（`dispatch-gates.mjs` `isSubagentReadonlyAction` `:64` · settings 先例 `:75`）、`:215`（`check-vsix.mjs` 100 行）、`:599`+`:611`（`manifest-schema.mjs:55-67` · `shared.mjs:19`）、`:598`（`settings.mjs:216-228`）、`:597`+`:613`（`eng.mjs:81` · `tool-schema-size.mjs:35-41` / `:70`）——除发现 1 / 8 外逐条相符。范围限定：本上下文未声明文档地图与项目标准档 ⇒ 判据 7（文档归属）与「方法论合规」按 AGENTS.md 判定。

## §4 用户批准（主 agent）

**父侧代签批准（用户 2026-10-08 16:10 授权「那个评审先做了，自动跑完吧」——射程含 §4 代签）**

三条件核对：① 设计评审 pass——§3 轮次 1 = **0🔴 · 4🟡 · 8🔵**（无 🔴）；② 修正轮 **11/11 已落地并逐条核验**——落点 = §2 修正块（`:66-86`），父侧读盘逐条复核 ✓（行 55 ⇒ **50** ∥ 白名单谓词钉死（四族整键写 ⇒ 拒）∥ `PROMPT-SYSTEM.md:402-403` 限定句 + 例外句 ∥ `MANIFEST.md:349` 枚举补行 ∥ T70–T73 ∥ AC-40 已知键限定 ∥ KD-M1-29 第三格 ∥ 行 48/49 回填 **178/272** ∥ `:264` 峰值句 ∥ F15 补档名 ∥ `TOOLS.md:175`/`:251-253`）；③ 设计 token 已签发（本批设计槽——凭证值不入档）。

**追加事实（父侧 grep 实读）**：「不造新工具」半句全仓仅存于 `PROMPT-SYSTEM.md:402`（+引用面/账面）——**无提示词实体档副本**，收正面完整。

⇒ 批准成立——进入实施轮（eng-coder · 设计 token 绑定 · 任务书 = §2）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-08 · eng-coder——产品码 4 档（新 2 / 改 2）+ 批内件；批内件 11/11 绿 · check-vsix 断言 B+D+E+F 全过 · 探针含 manifest（3,363 字符））


**实施摘要（本批条目 = 台账 #1098——②.7 五项 / ③ 边界三句 / ④ AC-M1-10–12）**：

- 新档 `thincoder-core/agent-tools/manifest.mjs`（193 行）——`manifest` 工具：`read`（`projectView` 五态报明——ok 附 manifest JSON + `missingKeys` / `unknownKeys` / `errors` 行；非 ok 态不抛）/ `init`（缺档建默认档；已带档 ⇒ 拒——不覆盖闸）/ `write`（点改——`key` 点分路径 + `value`；白名单外 / 四族整键写 / 编辑结果非法 / 缺档 / 歧义 ⇒ 拒；成功回执含 `path`）。拒面统一前缀 `manifest <action>: refused — …`；落盘恒经 `writeManifest` / `initManifest`（`writer: "main"` 字面量，零新写路径）。
- 新档 `thincoder-core/tool-docs/manifest.md`（16 行 · 2,235 字节）——描述单源（`DESC("manifest")` 逐字节——T72）。
- 改档三：`thincoder-core/agent-tools.mjs:16`（登记册 +1 导出）∥ `thincoder-core/agent/family-tools.mjs:29`（动态名面）+ `:146-148`（depth-0 段挂载——两模式同挂；子代理各段零挂）∥ `thincoder-core/agent/dispatch-gates.mjs:79-83`（`read` 只读格；`init` / `write` 保持侧效门）。
- 批内件 `docs/batches/2026-10-08-manifest-agent-tool.test.mjs`（357 行——T63–T73 十一格 + AC-40–43 逐格对位；不进仓套件）。

**决策透明表（实施判格——设计未逐格钉死处）**：

| # | 判格 | 取值 | 依据 |
|---|---|---|---|
| 1 | `write` 遇**现档非法**（可解析但校验不过） | 照常点改（编辑结果仍过落盘前 `validateManifest`——非法 ⇒ 拒 + 盘零变）；坏 JSON / 顶层非对象（无可编辑对象）⇒ 拒 | 设计 §2.10 写行原文流「读现档 → 设节点 → 落盘前 `validateManifest`」字面（该行未列「现档非法 ⇒ 拒」）；安全面 = 落盘前校验兜底不破（非法结果照拒） |
| 2 | `write` 缺 `key` / `value` | invocation error（无 `refused` 前缀） | 设计拒面枚举（AC-41）未含此格；`settings` 先例同形（顾问评审 🔵 项，保持） |
| 3 | 三段以上点分路径 | 一律拒（`checkConfig.anchors.{domain,exclude}` 经整对象写 `checkConfig.anchors` 可达） | 设计 §2.10:600 谓词钉死形（顾问评审 🔵 项，登记） |
| 4 | 原型链名键（`__proto__.*` / `constructor.*` / `toString.*`） | 落 `refused` 拒面（`Array.isArray` 守卫——不得 TypeError 直出） | 内部偏差审计发现 2（修 + 用例锁：T67② 三例红 → 绿） |

**审计与代码评审轮次与终态**：
- **内部偏差审计（read-only explore）轮 1** ⇒ 2 条 🔵：① 设计档 `MANIFEST.md:217`（行 56）「批内件（T63–T69 对应用例）」与 §3.2 / AC-43 / 交付件「T63–T73」口径不一（设计档非本席写域——报明，不修）；② 原型链名键 `TypeError` 直出（已修）。**终态 = 已收敛**。
- **内部顾问代码评审轮 1** ⇒ **VERDICT pass**（0🔴 · 2🟡〔行 56 口径滞后 = report-only；写盘不入 `FILE_MUTATORS` / 无 `touchedPaths` 钩子 = 协调项非 must-fix〕· 4🔵 信息项：前缀 / 三段路径 / `ctx.cwd` 措辞 / 未知键丢）。**终态 = clean**。
- **fix 轮（1 轮）**：`isWritableKey` 双段支路 `Array.isArray` 守卫（批内件 T67② 补三例——红〔TypeError 直出〕→ 绿）。

**机检读数（实施轮——全量终读）**：
- ① `node --test docs/batches/2026-10-08-manifest-agent-tool.test.mjs` ⇒ **11/11 绿**（exit 0；先红 = `ERR_MODULE_NOT_FOUND` 整档红——工具档未建时）。**仅跑本件**；仓套件未跑（收口面归父侧）。
- ② `node --check` 五涉改档全 **OK**（`agent-tools/manifest.mjs` · `agent-tools.mjs` · `agent/family-tools.mjs` · `agent/dispatch-gates.mjs` · 批内件）。
- ③ `npm run package`（thincoder-vscode）⇒ 新鲜 vsix 打包成功（508 条目）+ `check-vsix` **断言 B + D + E + F 全过**（D/tool-docs：仓内 **50** 档 = 口径 50、档名集合逐字相等、sha256 逐档相同）。
- ④ `node scripts/tool-schema-size.mjs` ⇒ 探针含 **`manifest`（meta · 3,363 字符 ≤8,000）**；超 8,000 者 = 既有 `browser` / `subagent`（非本批面）。
- 行数（`\n` 计数；设计 Δ 上界内）：`agent-tools/manifest.mjs` **193**（≤260）· `family-tools.mjs` **190**（≤191）· `dispatch-gates.mjs` **148**（≤148）· `agent-tools.mjs` **30**（+1）· 批内件 357（界外自持）。

**零触披露**：`thincoder-vscode/scripts/check-vsix.mjs`（父侧机械档）零触 · 设计 / 需求档零触 · 批档 §1–§4/§6 零触 · 他批零触；代码面零碰 = `validateManifest` 判据 / `writeManifest` writer 闸 / `spawn-gates` 二道防线 / 既有装配侧调用点（翻转 ∥ 情境行 ∥ 钩子）/ CLI 子命令 / 新增键。

**上抛项**：
- `[上抛·待裁]` 设计档 `docs/core/design/MANIFEST.md:217`（行 56）「批内件（T63–T69 对应用例）」⇒ 收口轮回填「T63–T73」（设计档非本席写域；顾问评审同报）。
- `[上抛·待裁]` 变更记账面**登记或豁免**：本工具写盘不入 `FILE_MUTATORS` / 无 `touchedPaths` 钩子 ⇒ `_touchedFiles` / mutation-seq / peer 写重叠面不见该档（设计只登记报告面 KD-M1-40）——二选一归父侧。
- `[上抛·知会]` `check-vsix.mjs:11` 档头注释仍写「48 档」（父侧机械档，与 `:37` EXPECT 50 不同步）；`docs/core/design/TOOLS.md:175` / `:251`「（拟新增）」待收口轮回填。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-08）**

**链条**：§1 讨论（用户要求 + 全链授权）→ §2 设计（eng-designer）→ §3 评审轮 1 pass（0🔴 · 4🟡 · 8🔵 → 修正轮 11/11 落核）→ §4 代签（用户 2026-10-08 16:10「自动跑完吧」全链授权）→ §5 实施（eng-coder）→ 本节父侧验收 → 收口。

**验收表（逐件 · 父侧实读）**

| # | 项 | 读数 / 证据 |
|---|---|---|
| 1 | 工具档 `thincoder-core/agent-tools/manifest.mjs`（193 行） | 逐字符复读通过：三动作 `read` / `init` / `write`；点改；写面白名单 = `keys` 父键（非 nestedKeys 者）+ `nestedKeys` 子键；四族整键写 ⇒ 拒；`value` 先 JSON.parse 失败取字面串 · `"null"` ⇒ `null`；`read` 五态（ok / missing / invalid / ambiguous / no-project）不抛；`init` 不覆盖 ∥ `write` 不建档；`writer` 恒显式 `'main'`；拒前缀 `manifest <action>: refused — …` |
| 2 | 描述单源 `thincoder-core/tool-docs/manifest.md` | 在档（50 档计数的第 50） |
| 3 | 挂载 ∥ 分类 | `thincoder-core/agent/family-tools.mjs`（depthOnly · 两模式同挂 · 子代理零挂）∥ `thincoder-core/agent/dispatch-gates.mjs`（`read` 只读格） |
| 4 | 批内件 | `docs/batches/2026-10-08-manifest-agent-tool.test.mjs` **11/11 绿**（父侧亲跑） |
| 5 | check-vsix | 断言 **B+D+E+F 全过**（EXPECT 50 = 现盘 50） |
| 6 | 探针 | manifest 工具载入 **3,363 字符** ✓ |
| 7 | doc-check | **exit 0 · 悬空 0 · 行宽 OK · 行数差异 0**（父侧复跑；收口笔两处裸名碰撞消解后归零） |
| 8 | 四仓套件读数 | core ∥ cli ∥ vscode ∥ desktop 四处 `node test/run.mjs` 皆报「test manifest is empty — zero tests = green（2026-09-28 full reset）」——零测试 = 绿 |

**§5 上抛三条处置**：① T63–T69 ⇒ T73（MANIFEST.md §2.3 行 56）——收口笔落地 ✓；② manifest 写盘不入 mutation 台账通道（登记或豁免）——**入册技术待办 #1106**（trigger = 条件）✓；③ `check-vsix.mjs` 档头 48 ⇒ 50 ∥ TOOLS.md `:175` / `:251`「（拟新增）」退场——收口笔落地 ✓。

**结算同步清单**

- 角色表：§1 父 ∥ §2 eng-designer ∥ §3 评审子代理 ∥ §4 父（代签——用户全链授权在案）∥ §5 eng-coder ∥ §6 父。
- 状态行 → **已收口 2026-10-08**（紧随 close 冻结）。
- 计数 / 指针：工具数 **50** 三处同拍（`check-vsix.mjs` EXPECT ∥ TOOLS.md §6.11 ∥ PROMPT-SYSTEM.md）；设计档变更记录三档在案（MANIFEST ∥ TOOLS ∥ PROMPT-SYSTEM）；需求档两面随落（`ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ∥ `AGENT-LOOP.md` §4.17——#1100 立案）。
- 前批遗留互核：无（独立批——前情 = 无）。
- 台账核销：**#1098**（随本节；settlement line = 会话 `/ledger` 面读数）；上抛② 新行 **#1106** 在册。
- 暂缓批复核：无新增可启。
- 提交面：受限路径 commit+push——**`AGENT-LOOP.md` 未入本笔提交**（载并行实例在飞改动——按「不代他批提交」避让，其内容随该面后续提交落）。

**测试面两行**：① 本批单测文件 = `docs/batches/2026-10-08-manifest-agent-tool.test.mjs`（11 件——随本档存档，复核即直跑）；② 集成场景面 = **无影响**（新增工具；既有业务场景零涉及）。

**收口判词：已收口 2026-10-08**（manifest 工具批——四步全链（需求 → 设计 → 评审 pass → 实施）→ 父侧复跑 doc-check exit 0 ∥ 批内件 11/11 ∥ check-vsix 全过 ∥ 探针 ✓ → 本节 → 冻结）。
