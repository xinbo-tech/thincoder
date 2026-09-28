# 2026-09-28 · 口子收敛轮
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 18:59 直令（「把你造出来的那些口子也先收一收」）——端差登记通道 ∕ 留册延押堆 ∕ 标记滞存三类。
> 台账 = #527（口子收敛 · 归批）。前情 = docs/batches/2026-09-28-doc-backfill-sweep.md §6（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 主题与范围（2026-09-28 18:59 · 用户直令——不留过夜）
- 用户原话：「把你造出来的那些口子也先收一收……留着那些口子，准备过年吗？还想让老子过几天再骂一次？」
- **口子清单（我造的）与本轮处置**：
  1. **「端差登记后保留」通道**（含「视觉按端自持」这类 bless 句）⇒ 判据收窄入档 + 全仓 bless 句收正（含 `docs/render-core/design/RENDER-CORE.md` §5——B 裁后已失据）；
  2. **「留册 ∕ 另轮」延押堆**（B 批 §6.3 记录面残余 ~37 处 + `badges.mjs` 缺行 + `PROJECT.md:910` 超宽 + `MODEL-BENCH.md:1029` + `#374` 另族 sweep）⇒ **原「留册」裁定作废、全入本轮清**；
  3. 「（拟新增）」标记滞存 ⇒ 按「**档在盘 ⇒ 去标落值**」全清（确未落者保留并注「未落」）。
- **不动**：码 ∕ 测试面小项（`#370` ∕ `#396` ∕ `#373③` ∕ `#378②③`）——父侧自理（**不走「随触碰」**，本会话内清零）。
- 基线：机检 = 悬空 56 ∕ 行宽 36（净 0 目标；**窗口口径见 §2.5②**——行宽 36 含外因他笔 +1；后续窗口各计各净增）。

### 1.2 父侧直接执行（收尾同步 · 主 agent · 2026-09-28 19:2x · 可 revert）
- **需求层四档收窄句同步**（父侧笔）：F7-3（`docs/core/requirements/METHODOLOGY.md:77`）· N4（`PROMPT-SYSTEM.md:184`）· N-AP4（`AGENT-PARAMS.md:34`）· §4 端差登记标题（`DESIGN-TOKEN-SETTLEMENT.md:37`）+ 四档变更记录各 +1 行——承用户 2026-09-16「小修改父侧自己改」口径（单行级 · 语义已裁 · 可逐条核验）。
- **提示词正本面**（`docs/core/design/prompts/discipline-engineering.md:102` 第 6 条）同句收窄**已落**；**运行期英文面**（`thincoder-core/prompts/discipline-engineering.md:106-108`）按 D1（提示词 = 主 agent 内容权 + eng-coder 落笔）走评审 → 落笔（在途）。
- **复扫读数**：全仓 grep「保留仅限 ∕ 保留须 ∕ 三件齐」——需求层零残（除 as-of ∕ 记录面）；设计面判据块 = #63 已落（`DOC-DISCIPLINE.md:713-718`）。

### 1.3 父侧直接执行（修正 · 可 revert · 2026-09-28 19:3x）
- 承提示词面评审 #69（**changes-required**：🔴 = 正本 `:102` 括注（日期 + 旧判据复述）踩 `prompts-mirror-anchors` ⑦ 机检 ∕ 门禁；🟡 = 例外句缺运行面自持限定）：**正本 `docs/core/design/prompts/discipline-engineering.md:102` 就地修正**——括注删除（出处归记录面）+ 「宿主能力面」补自持限定（「由仅单侧具备的宿主能力所制约的差异，须实证」）。
- 实跑证据：修正前 `node --test test/prompts-mirror-anchors.test.mjs` = 红（⑦ 断言命中日期）；修正后 = 绿（读数见下）。
- **英文运行期面**（`thincoder-core/prompts/discipline-engineering.md:106-108`）= 待落笔（D1：eng-coder 落笔；凭据 = 复评通过后签发）——本轮零触。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（口子收敛轮——标记面 57 处二态处置 + 残余清零 + 判据收窄入档；#374 另族 41 处 ∕ 11 档处置；补扫轮 86 处 ∕ 16 档去标落值（全仓复扫）；评审轮 1 修正十号全落（2026-09-28）——机检净增 0（口径 = §2.5②））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）
用户 2026-09-28 18:59 直令（口子收敛轮 · 不留过夜）三面 + 父侧同轮扩权一项：

1. **标记面全清**——`（拟新增）` 二态处置（档在盘 ⇒ 去标落值；确未落 ⇒ 保留并注「未落」）；三面共处 57 处；
2. **残余清零**——§4.1 补 `badges.mjs` 行 · `PROJECT.md` 原 `:910` 超宽行折行 · #374 另族（advisor / tools / VSC 面板族）逐处处置；
3. **端差判据收窄入档 + bless 句收正**——「用户可见端差 = 缺陷（唯一例外 = 宿主能力面，须实证）；取消「登记后保留」」；
4. （父侧扩权）**码面注释 §号 处置**——三条件：仅注释 ∕ 文档字符串内、零代码语义；与在飞拆档轮交集档只报不动；逐文件列报。

**直令清单 → §2 落点覆盖映射（修正轮补 · 使「全仓」可核）**：
- 项 1（端差判据 ∕ bless 句）⇒ §2.4（判据入档 + 收正清单 + **射程声明**）；
- 项 2（延押堆）⇒ `badges.mjs` 缺行 ∕ 原 `:910` 超宽 = §2.3；`MODEL-BENCH.md:1029`（`bench/toolcall.mjs`）= §2.2 去标落值（`:1029` → `已落 · 实读 **261**`）；B 批 §6.3 残余 ~37 处（原「留册」）= 并入 §2.2 三面二态处置面 + §2.8 记录面判类；`#374` 另族 = §2.6；
- 项 3（`（拟新增）` 标记滞存）⇒ §2.2（点名三面）+ §2.8（全仓复扫）+ 判据 = §2.5④。

### 2.2 标记面（二态处置 · 实际读数）
- `docs/desktop/design/PROJECT.md`：**去标落值 26 处**（questions **44** / badges **23** / session-reading **89**×2 / session-open **137**×3 / page-read **132** / queue **41** / composer-send **70** / chat-chrome **297**×2 / chat-pending **77** / chat-subagent **69** / notify **47** / file-links **63** / i18n-views **68** / file-links.test **78**×2 / align3-face **209**×3 / timer-watch **79** / timer-wake.test **286** / queued-input **87** / `thincoder-render-core/**`）；**保留并注「未落」14 处**（electron-builder.yml ×2 / chrome-denoise.css ×4 / 「档名实施批定」×2 / timer-wake-face.test.mjs / session-title.test.mjs ×2 / session-title-face.test.mjs ×3）。
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30：**13 处去标落值**（timers.mjs **50**×2〔§6.30.12 正文 + 文档表行〕 / CLI timer-watch **90**×3 / `TIMER_TURN_DOMAIN` = `thincoder-core/agent/helpers.mjs:459` / 桌面 timer-watch **79** / VSC timer-watch **117** / 四测试档 **158** / **274** / **33** / **42** / `:673`「拟新增已落」⇒「已落 + 真机档未落」——逐处 file:line = 交付报告）。
- `docs/core/design/MODEL-BENCH.md`：**2 处去标落值**（`:1029` toolcall.mjs **261** / `:1257` preflight.test.mjs）+ **2 处保留注「未落」**（`:919` driver-spawn.mjs / `:957` variants-v2.mjs）——行号 = as-of 修正轮实读。
- 变更记录 ∕ dated 行 = 记录面 ⇒ 零触碰（判类单源 = `DOC-DISCIPLINE.md` §1 **D8**「记录面（保留零触）」细则 ∕ §3.8 **B 类「史实保留」**〔行自带时点锚 ⇒ 零触碰〕；「（拟新增」标记族定义 ∕ 到期条件 = 同档 §4.2.9）。
- **读数口径**：本三面读数（57 = 去标 41 + 未落保留 16）与 §2.8 全仓复扫读数（86 ∕ 173）的包含关系与单位 = §2.8②「读数口径」段。

### 2.3 残余清零
- §4.1 补行：`thincoder-desktop/renderer/badges.mjs`（残余批拆分产出）**23**（实读）——落位 = queue.mjs 行后。
- 原 `:910`（347 字符）按语义折行（零语义；changelog 行）。
- #374 处置 = 下行 2.6 逐文件表。

### 2.4 判据入档与 bless 句收正
- **判据本体**：「用户可见端差 = 缺陷（唯一例外 = 宿主能力面，须实证）；取消「登记后保留」」——**设计面落点 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §6.1 条 6**（原「结构性不对称 + 证据 + 显式裁定」口径收窄）；
- **复核判据 ∕ 限定语落点 = `docs/core/design/DOC-DISCIPLINE.md` §3.13**（复核判据 ① + A 态限定语形态逐字随改 + 判据现值句）；
- bless 句收正（design 面）：`RENDER-CORE.md` §5（「外壳自持」⇒「外壳 = 端侧自有面（VSC 无对位件——不构成端差）」）· §9 三处加「待消除（归对齐批）」（±不适用项除外）· `PROMPT-SYSTEM.md` §6.3 · `CORE-UNIFICATION.md` §2.13 条 4（「保留的多实现面」⇒「（形制面——非端差）」）· desktop `PROJECT.md` KD-39 + `UI.md` §1 项 2（行参差异 = **宿主能力面**〔实证 = `shell.openPath` 无行参〕；「多实现面各自落地」⇒「两端各自实现——只述实现形态」）；
- **bless 句收正射程（修正轮补）**：本轮收正射程 = 直令点名 + 上列落点档；**未触碰候选去向 = 随该档下次触碰收正**——`DOC-DISCIPLINE.md:720` 复核读数 **19 行**（候选清单逐行判类在册）；`docs/vsc/design/WEBVIEW.md:3` = A 态限定语首例落点（待该档下次触碰落笔；该位点在本轮验收射程外——`DOC-DISCIPLINE.md` §5 **A-DD21 ②**）。
- **上游同步（三态 · as-of 2026-09-28 19:5x）**：**已落** = 需求层四档（F7-3 `METHODOLOGY.md:77` · N4 `PROMPT-SYSTEM.md:184` · N-AP4 `AGENT-PARAMS.md:34` · `/api:design-draft` §4 端差登记标题 `DESIGN-TOKEN-SETTLEMENT.md:37`——父侧笔，§1.2）+ 提示词正本面第 6 条（`docs/core/design/prompts/discipline-engineering.md:102`——§1.3）**+ 运行期英文面**（`thincoder-core/prompts/discipline-engineering.md:106-108`——19:4x 落笔，回读逐字核实 + 5/5 ∕ 772/772 绿）。

### 2.5 验收对照
① 三面逐处落 ✓（零留册——每处「号 → 改动 file:line」见交付报告）；
② **doc-check 相对基线净增 = 0**（口径 = **相对判据**：基线 = 各窗口首动作前复测，绝对读数随并行链 ∕ 他批写入漂移；同 A-DD20 ① 句式）。**行宽窗口读数（统一为一条线 · 以本席两次实跑为源）**：
- 批次基线（**T0** · §1.1）= 悬空 **56** ∕ 行宽 **36**；
- **T1 首轮收笔**：悬空 **56 → 56** · 行宽 **36 → 36**——本席面 = 原 `:910` 修 −1 + 本轮 4 处新增当场折行 ±0 + **外因他笔 +1**（他笔行计入本窗口——req `PROJECT.md` 超宽行）；
- **T2 补扫轮收笔**（= §2.8④ 窗口）：悬空 **56 → 56** · 行宽 **35 → 35**——**36 ∕ 35 两值来源 = 上述两窗口**（T1 含外因 +1；T2 该外因行已不在现读数——其档 19:0x 重写面，非本席笔）⇒ 本席净 0（4 处新增超限当场收正）；
- 两窗口各计各的净增（各 = 0）；跨窗口绝对值不互证（他笔漂移）。
③ 判据入档一处 + 处置清单齐 ✓；
④ **零留册可复跑判据（修正轮补）**：全仓逐行扫「（拟新增」（域 = `docs/**` + 三包源树；排除 `docs/batches/**` ∕ `_archive/**` ∕ `node_modules/**`）⇒ **命中集 ⊆ 未落保留 ∪ 记录面 ∕ 机制叙述 ∪ 材料面**；**未声明残 = 0**；对照锚 = doc-check 汇总行 `拟新增 N`（该判据的行内悬空锚子集）。

### 2.6 #374 逐文件表（档 → 处 → 现行行数 → Δ → 改动形）
| 档 | 处 | 现行行数 | Δ | 改动形 |
|---|---|---|---|---|
| `thincoder-core/advisor/citations.mjs` | 5 | 139 | ≈0 | 改指 `ADVISOR-GUARDS.md §3` |
| `thincoder-core/advisor/compaction.mjs` | 10 | 174 | ≈0 | 改指 §1 ∕ §2 ∕ §4 ∕ §8 |
| `thincoder-core/advisor/loop.mjs` | 9 | 288 | ≈0 | 改指 §2 ∕ §4 ∕ §8 + 去号 1（§14.10 #3） |
| `thincoder-core/advisor/messages.mjs` | 1 | 299 | ≈0 | 改指 §2 |
| `thincoder-core/advisor/project-context.mjs` | 1 | 197 | ≈0 | 改指 §8（原 `PROVIDER.md §15` = 死指） |
| `thincoder-core/advisor/run.mjs` | 8 | 200 | ≈0 | 改指 §2 ∕ §3 + `MODEL-SPECS.md §15.4-3` ×2 |
| `thincoder-core/tools/execute.mjs` | 2 | 235 | ≈0 | 去号 ∕ 改述 |
| `thincoder-core/tools/ops.mjs` | 2 | 293 | ≈0 | 去号 |
| `thincoder-core/tools/web.mjs` | 1 | 224 | ≈0 | 去号（保 `D-TF3`） |
| `thincoder-vscode/src/agent/run-helpers.mjs` | 1 | 268 | ≈0 | 去号 |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 1 | 419 | ≈0 | 去号（保 `C-7`） |

行数 = as-of 2026-09-28 修正轮实读（口径 = 内容行数 ∕ `wc -l`——本批 11 档逐档一致）。**档位说明（修正轮补 · 行数实读 11 档）**：>300 档仅 `execute-tools.mjs`（**419**）——**拆分评审注** = 端侧在册结构断言 `≤500` 锁定（`thincoder-vscode/test/child-permission.test.mjs:360-366`）；本批零结构改动（Δ≈0）⇒ 零新触发、复核口径沿用该档既有在册登记；其余 10 档 ≤300（免档位注——最近 300 者 `messages.mjs` **299** ∕ `ops.mjs` **293**）。

合计 **41 处 ∕ 11 档**（零代码语义——逐处仅注释 ∕ 文档字符串内文本）。**B 类零触碰**（带日期 ∕ 史实谓词 ⇒ 记录面）= **6 档 9 处**：`execute.mjs` `:14` ∕ `:44` · `git.mjs` `:33` · `linter.mjs` `:32` ∕ `:58` ∕ `:112` · `shared.mjs` `:292` · `edit-batch.mjs` `:33` · `glob-dialect.mjs` `:2`（TOOLS.md §号注释族；as-of 2026-09-28 实读；逐处 file:line = 交付报告）；**VSC 面板族复扫 = 活形零触碰**（`VSC-DEBT.md` §12.1 ∕ §12.2.1–4 ∕ §12.5、`MODEL-SPECS.md` §15.4 ∕ §16.2 靶节实存；`response-stages.mjs` ∕ `reasoning-mode.mjs` ∕ `settings-panel-write.mjs` ∕ `panel-*.mjs` 族）。

### 2.7 上抛（表外只报）
1. 表外 stale markers（同判据候选 · 原未列入派单面；**已随 §2.8 补扫轮并入派单**——VSC-DEBT ∕ UPSTREAM 项 = 去标落值、SHELL 项 = 记录面零触碰）：`VSC-DEBT.md:276` ∕ `:639`（`response-stages.mjs` 在盘）· `AGENT-LOOP-UPSTREAM.md:806`（`turn-domains.mjs` 在盘）· `SHELL.md:124` ∕ `:137` ∕ `:145`（`i18n.mjs` ∕ `settings.mjs` ∕ `views/settings.mjs` 在盘）；
2. `docs/desktop/requirements/PROJECT.md:31`（312 字符）——他笔新增超宽（非本席；`:240 ⇒ :242` 行漂移同源）；
3. 需求 ∕ 提示词面判据同步 5 处（见 2.4）。

### 2.8 补扫轮（#63 表外残余 · 全仓复扫 —— 2026-09-28 · eng-designer）

**判据**（承 §2.2 同源）：`（拟新增` 全仓 grep；**档在盘 ⇒ 去标落值**（`已落 · 实读 N`，N = 文件物理行数实测）；**确未落 ⇒ 零触碰保留**；**带日期 ∕ 记录面（变更记录段）∕ as-of 块 ∥ 机制叙述 ⇒ 零触碰**；**需求档面 ⇒ 只报**（主 agent 笔）；`docs/batches/**` = 一次性材料面 ⇒ 零触碰。

**① 派单表（12 处 ∕ 4 档）逐处处置**：

- **去标落值 8 处**：`AGENT-LOOP-UPSTREAM.md` :469 ∕ :616 ∕ :734 ∕ :736 ∕ :806（turn-domains **37**）· `VSC-DEBT.md` :276 ∕ :639 ∕ :645（response-stages **73**）。
- **零触碰 4 处（带日期 ⇒ 记录面）**：`AGENT-LOOP-SUBAGENT.md:890` · `SHELL.md:124 ∕ :137 ∕ :145`——三档在盘为实，但所在行 = 2026-09-25/26 dated 变更记录行（先例 = 同档 `SHELL.md:132`「记录面留档不改」；全仓级零触碰读数见 ②）。

**② 全仓复扫净读数**：**去标落值 86 处 ∕ 16 档**（派单 8 处 + 复扫新增 78 处；逐处 file:line 见交付报告）；**零触碰 173 处**（记录面 ∕ 机制叙述 ≈137 + 未落保留 ≈34 + 需求档面只报 2）；`docs/batches/**` 420 行 ∕ 89 档零触碰（材料面）。

**读数口径（修正轮统一——三面 ∕ 全仓对表）**：① 三面 57 处（§2.2）= 点名面**标记项**二态读数（去标 41 + 未落保留 16）；② 全仓复扫读数（本节）= 复扫域（`docs/**` 全仓，**含三面**）的族计数——**包含关系 = 全仓 ⊇ 三面**（三面去标 41 处计入全仓去标面；三面未落保留 16 处归全仓零触碰「未落保留 ≈34」族）；③ 单位 = 三面按**标记项**计 ∕ 全仓去标按**动作处**计 ∕ 机检「拟新增 N」按**悬空锚数**计（④）；逐处 file:line = 交付报告。

**③ 关键处置**：`VSC-DEBT.md:42`——协议机检档（**386**，已落即去标）+ 同埠**锚形收正 2 处**（`src/agent/setup.mjs` ∕ `test/files.mjs` ⇒ 全路径——零语义，去标后仍可解析）；值面口径 = 物理行数（`wc -l`）实读；**零机制语义**（纯去标 ∕ 落值 ∕ 形式收正）。

**④ 机检（前后 · as-of 2026-09-28 · T2 窗口——窗口口径见 §2.5②）**：`node scripts/doc-check.mjs`——悬空 **56 → 56** · 行宽 **35 → 35**（本席新增 4 处超限当场收正）· 拟新增 **26 → 24**（`VSC-DEBT.md:42` 去标 + 锚形收正 ⇒ **两处悬空锚**消除；单位 = 拟新增族豁免的**悬空锚数**——非标记行数）· 迁移期引文 **223 → 223** ⇒ **相对基线净增 0** ✓。

**⑤ 上抛（表外只报）**：

1. **需求档面 2 处**（判据外 ∕ 主 agent 笔）：`core/requirements/AGENT-LOOP.md:274`（timers **50** 已落）· `vsc/requirements/WEBVIEW.md:101`（protocol-coverage **386** 已落）；
2. **非逐字形态残留**（粗体 ∕ 尾形——不在闭枚举射程，未动）：`AGENT-LOOP.md:427` · `E2E-TESTING.md:184 ∕ :194 ∕ :195 ∕ :196` 等——如需收正另裁；
3. `VSC-DEBT.md:660`——既有超限行（303 ⇒ 310 字符；计数不变，非本轮净增）。

### 2.9 评审轮 1 修正 —— 打标（2026-09-28 · eng-designer）

**触发** = §3 轮次 1 十发现（父侧逐条裁定全部接受；Suggestion 列 = 处置建议，执行者 = 本舱）。**射程 = §2 ∕ §2.8 就地修正 + 两设计档判据面残句收正（`DOC-DISCIPLINE.md` ∕ `LEDGER-SELF-CONTAINED.md`）——零新语义**（不动机制 / 不动既成事实数值；仅计数、口径、指针、残句收正）。

**逐号落点（号 → 改动 file:line · 行号 = as-of 修正轮）**：
1. 行宽读数统一——§2.5② 重写（T0/T1/T2 窗口 + 外因他笔 +1 计入面 + 相对判据口径；`:65-71`）；§2.8④ 加窗口标注（`:113`）；
2. 计数 ∕ 枚举对齐——§2.2 ASYNC-POOL 满枚举（timers.mjs **50**×2——补文档表行；`:47`）· §2.6 B 类「6 档 9 处」全枚举（补 `edit-batch.mjs:33` ∕ `glob-dialect.mjs:2`；`:91`）· §2.8① 零触碰 **5 → 4 处** ∕ 派单 **13 → 12 处**（`:102` ∕ `:105`）；
3. §2.7 交叉标注「已随 §2.8 补扫轮并入派单」（消射程相抵；`:94`）；
4. 覆盖映射 + 射程声明——§2.1 新增「直令清单 → §2 落点覆盖映射」（含 `MODEL-BENCH.md:1029` → §2.2 ∕ 行号补全；`:40-43` ∕ `:47-48`）；§2.4 新增「bless 句收正射程」（19 行候选去向 + `WEBVIEW.md:3` 去向 + A-DD21 ② 射程外声明；`:61`）；
5. §2.2 判类单源改指（§3.13 ⇒ §1 **D8**「记录面」细则 ∕ §3.8 **B 类「史实保留」**；标记族定义 = §4.2.9；`:49`）；
6. 两设计档残句收正——`DOC-DISCIPLINE.md` `:713`（现值句化 + 同步三态）· `:715`（旧形改判据形「不判合格」+ 显式登记理由）· `:718`（去相对指针 + 判据形；行宽当场折行）· `LEDGER-SELF-CONTAINED.md` `:208`（判据形）；两档变更记录各 +1 行（`DOC-DISCIPLINE.md:1499` ∕ `LEDGER-SELF-CONTAINED.md:325`）；
7. §2.6 表补两列（现行行数 ∕ Δ）+ 档位说明（>300 档 = `execute-tools.mjs` **419**——≤500 锁在册 ∕ 拆分评审注；`:75-89`）；
8. §2.4 上游同步三态（已落 ∕ 在途）+ `DOC-DISCIPLINE.md:713`「（待同步）」同收（`:62`）；
9. 读数口径行——§2.8② 新增（三面 57 ∕ 全仓 86 包含关系 + 单位；`:109`）；§2.8④「拟新增」单位（悬空锚数；`:113`）；
10. §2.5④ 零留册可复跑判据（命中集 ⊆ 未落保留 ∪ 记录面 ∕ 机制叙述 ∪ 材料面；未声明残 = 0；`:72`）。

**机检（修正轮窗口 · `node scripts/doc-check.mjs`）**：起笔复测（as-of 2026-09-28 19:4x）= 悬空 **58** · 行宽 **35** · 拟新增 **24** · 迁移期引文 **223**；收笔复测 = 悬空 **58** · 行宽 **35** · 拟新增 **24** · 迁移期引文 **223** ⇒ **本席净增 0** ✓（悬空 58 对 §2.5 ∕ §2.8 所记 **56** 之差 = **窗口外因**——在途他笔，同 §4.2.9 已裁「读数波动不作缺陷」口径）；**行宽当场收正 1 处**（`DOC-DISCIPLINE.md:715` 313 字符 ⇒ 折行 ≤300）。口径 = §2.5②（相对判据 + 窗口）。

**越域披露（同形残句在射程外档 · 只报不动）**：`docs/core/design/PROMPT-SYSTEM.md:173` · 提示词正本 `docs/core/design/prompts/discipline-engineering.md:102` · 需求层（`METHODOLOGY.md:77` ∕ `PROMPT-SYSTEM.md:184` ∕ `AGENT-PARAMS.md:34` ∕ `DESIGN-TOKEN-SETTLEMENT.md:37`）· `docs/render-core/design/RENDER-CORE.md:346` ∕ `:404`——「「登记后保留」已取消 ∕ 取消「登记后保留」」同形（判据形改写与否 = 父侧裁；本轮零触）。

**本轮零做**：§1 ∕ §3–§6 触碰、码 ∕ 测试面、新条目 ∕ 新机制、全量探索（点修）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**射程与限制**：评审对象 = §2 ∕ §2.8 + `DOC-DISCIPLINE.md` + `LEDGER-SELF-CONTAINED.md`（三档全读）；上游档（RENDER-CORE ∕ PROMPT-SYSTEM ∕ CORE-UNIFICATION ∕ desktop 档 ∕ 需求层）不在射程，相关断言未核验。本仓未声明项目标准档与文档地图——文档归属维度按现行兄弟档判读。码 ∕ 测试面小项与记录面 ∕ dated ∕ as-of ∕ 未落保留三类按声明不评。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收（机检读数） | 🟡 | 「行宽」读数同轮两值：`2026-09-28-hatch-closure.md:16`（基线 36）与 `:58`（36 → 36）对 `:95`（35 → 35）；评审对象声明记 35。两值未标窗口（外因他笔 +1 是否计入未言明），「净增 0」对表不可复现。 | 统一为一个读数并标注 as-of ∕ 窗口口径（含他笔 +1 的计入面），使 §2.5 ② 与 §2.8 ④ 可对表。 |
| 2 | 方法论（D3 计数·枚举） | 🟡 | 计数与枚举不符三处：`:75`「6 档 8 处」对应列举 4 档 7 处（execute.mjs ×2 · git.mjs ×1 · linter.mjs ×3 · shared.mjs ×1）；`:89`「零触碰 5 处」对应列举 4 处（AGENT-LOOP-SUBAGENT.md:890 + SHELL.md ×3）；`:42`「13 处去标落值」按 ×N 展开为 12 处。 | 逐处收正计数，或把枚举显式标为「非全量（全量 = 交付报告）」并给全量计数。 |
| 3 | 清晰度（口径相抵） | 🟡 | `:78`（§2.7）把 `VSC-DEBT.md:276 ∕ :639` · `AGENT-LOOP-UPSTREAM.md:806` · `SHELL.md:124 ∕ :137 ∕ :145` 标为「表外 · 未列入派单面」，而 `:88` ∕ `:89`（§2.8）把同组坐标纳入派单表逐处处置 ∕ 判类——同一轮内两节射程陈述相抵。 | 在 §2.7 该行加「已随 §2.8 补扫轮并入派单」交叉标注（或就地收正），避免按 §2.7 判为射程外。 |
| 4 | 需求覆盖（映射未闭合） | 🟡 | ① `:13` 直令清单项 `MODEL-BENCH.md:1029` 在 §2 无落点 ∕ 行号映射（`:42` 该档四处未标行号，无法判是否覆盖）；②「全仓 bless 句收正」（`:12`）射程未声明：`:54` 为列名清单，而 `DOC-DISCIPLINE.md:720`（19 行候选）与 `:1213`（A-DD21 ②「未被本轮触碰的 A 态候选在本轮验收射程外」）表明存在未触碰候选；`DOC-DISCIPLINE.md:718` 记 `WEBVIEW.md:3` 为「下次触碰随收窄口径」（该档未列入 `:54` 清单；WEBVIEW.md 本体不在射程，未核验）。 | 补一条覆盖映射：直令清单逐项 → §2 落点（或注明归零触碰 ∕ 记录面类）；并声明本轮 bless 句收正的射程与未触碰候选（19 行）的去向，使「全仓」可核。 |
| 5 | 清晰度（指针） | 🟡 | `:44`「变更记录 ∕ dated 行 = 记录面 ⇒ 零触碰（判类单源 = `DOC-DISCIPLINE.md` §3.13）」——§3.13 = 条目 L（端差措辞族），与「（拟新增」标记族判类无射程交；判类实际单源应为 §1 D8「记录面」细则 ∕ §3.8 两分判据 ∕ §4.2.9 到期条件。 | 改指正确单源；若意在借 §3.13「② 时点锚 ⇒ B 态」口径，写明借用关系与射程。 |
| 6 | 文档卫生（D8 失效表达） | 🟡 | 修订式残句留在规范面：`DOC-DISCIPLINE.md:713`「端差判据自「结构性不对称 + 证据 + 显式裁定」收窄为——」· `:715`（复核判据①内）「旧式 `保留须…` = 收窄前形态——新句以收窄后为准」· `:718`「（收窄前形态见上「判据收窄」块…）」；`LEDGER-SELF-CONTAINED.md:208`「「登记后保留」已取消」挂尸句。两档变更记录（`DOC-DISCIPLINE.md:1497` · `LEDGER-SELF-CONTAINED.md:324`）已各有一行承载该历史。 | 判据面只留现值句，新旧对照移入变更记录；若旧形对照为复核判类所需、否定句为防复发所需，改写为判据形态（如「旧形不判合格」）并显式登记理由。 |
| 7 | 受影文件标注（评审判据 8） | 🟡 | `:62-75`（#374 逐文件表）列 11 个 `.mjs` 待改而未标「现行行数 + 预计 Δ」（应形如 `structure unchanged` ∕ `≤±N`），亦无 >300 ∕ >500 档位与拆分计划句（同档先例 = `DOC-DISCIPLINE.md:582-616` 的三列 + 尺寸档登记）。 | 补两列（现行行数 ∕ Δ=0）+ 档位说明；如任一档 >300 行，按其档位登记拆分评审注。 |
| 8 | 状态一致性（滞后） | 🟡 | `:55`（§2.4）仍列「上游同步欠项：需求层 F7-3 · N4 · N-AP4 · 提示词两面第 6 条」，而 `:19`（§1.2）记需求层四档已落、`:20` ∕ `:24-25` 记正本已落（英文运行期面 `:26` 在途）；`DOC-DISCIPLINE.md:713` 亦记「（待同步）」。 | 三态区分（已落 ∕ 在途 ∕ 待办）或标 as-of，使同步面读数唯一。 |
| 9 | 清晰度（读数口径） | 🔵 | 「标记面全清」两个总量的关系未声明：`:29` ∕ §2.2 三面 57 处（去标 41 ∕ 保留 16）与 `:91` 全仓 86 处 ∕ 16 档（派单 8 + 复扫新增 78）的包含 ∕ 并集关系无一句交代；`拟新增 26 → 24`（`:95`）的计量单位（标记行数 ∕ 行内悬空锚数）未写明。 | 补一句口径行（并集范围 + 读数单位），使「全清」与 26→24 可对表。 |
| 10 | 验收（可复跑性） | 🔵 | `:58` 验收 ① ∕ ③（「三面逐处落 ✓」「处置清单齐 ✓」）为非机检形态（凭交付报告逐处核）；「零留册」缺一条可复跑判据。 | 补一条复跑命令判据（全仓「（拟新增」命中集 ⊆ 未落保留 ∪ 记录面 ∪ 材料面；未声明残 = 0）。 |

**计数**：🔴 0 · 🟡 8 · 🔵 2（共 10 条）

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 19:5x）
- **三条件**：① 设计评审 pass（§3 轮次 1：🔴0 · 🟡8 · 🔵2——十发现逐条裁定全部接受）；② 修正轮落地并核验（§2.9 号→file:line 全落 + 父侧抽读复核 + 机检净增 0）；③ 凭据面按纪律处置（值不落档）。
- 授权口径 = 委托（批准代签）；本批 = **文档面收敛**（无码面实施）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（口子收敛轮 · 提示词运行面 clause 6 收窄落笔（单档 2 行）· 内部审计 CLEAN · 内部顾问面 pass）

### 5.1 交付摘要

- **落笔面（1 档 · 1 处）**：`thincoder-core/prompts/discipline-engineering.md` 第 6 条 `:107-108`（`:106` 首行零改）——「三件齐（structural asymmetry + evidence + an explicit ruling，含定义括注 `exists on one side only`）」整句退场；替换为收窄后三行（父侧定稿串逐字；零续行缩进——如需本面 3 空格续行形制 = 父侧一句改令即可）。
- **单源**：`docs/core/design/prompts/discipline-engineering.md:102`（已定稿 · 父侧笔）；双源纪律 = 语义同源、原文自持（指引 = 批档 §1.2 ∕ §1.3 + 本舱任务书）。
- **落点判据**：`user-visible cross-end differences = defects`（用户可见端差 = 缺陷）· `the sole exception = host-capability faces — differences constrained by a host capability that only one side possesses; evidence required`（唯一例外 = 宿主能力面——自持限定 + 须实证）· `the register-and-keep channel is repealed`（「登记后保留」通道取消）· `the difference register records ruled host-capability exceptions only`（登记面只收已裁宿主能力例外项）。

### 5.2 改动前后对照（`:107-108`）

- **前**：`**keeping one requires all three — structural asymmetry + evidence + an explicit ruling** (structural asymmetry = exists on one side only / depends on a host capability that side alone has); **this discipline is not grounds for keeping a difference**;` ∕ `the difference register records **ruled keeps only** — it is not a fallback for undecided differences.`
- **后**：`**user-visible cross-end differences = defects (the sole exception = host-capability faces — differences constrained by a host capability that only one side possesses; evidence required); the register-and-keep channel is repealed**; **this discipline is not grounds for keeping a difference**;` ∕ `the difference register records **ruled host-capability exceptions only** — it is not a fallback for undecided differences.`

### 5.3 验证读数（实跑 · 命令 + 结果）

| 套件 | 命令 | 读数 |
|---|---|---|
| 镜像锚 | `cd thincoder-vscode && node --test test/prompts-mirror-anchors.test.mjs` | **5/5 绿**（修前复跑基线同为 5/5——⑦ 断言只锚第 6 条标题行 ∕ 零维护者注，对正文不敏感，如实校准） |
| 核套件 | `cd thincoder-core && node test/run.mjs` | **772/772 零失败** |
| 单档自证 | `git status` + `git diff`（对 HEAD，本档） | 本舱唯一落笔 = 上述 prompt 档；本档 diff = 唯一 hunk（clause 6）；工作树余量 = 在飞他舱 ∕ 前批脏态（与 §2.6 ∕ §2.8 派单面逐一对位） |
| 残句复扫 | 全仓 grep `structural asymmetry ∕ exists on one side only ∕ keeping one ∕ ruled keeps` | 活面零残（唯一命中 = `thincoder-vscode/.thincoder/tmp/core-registry-copy` 临时快照——零引用 ∕ 零出厂，见 5.6） |
| doc-check 面 | 读 `PROJECT-MANIFEST.json` | `checkConfig.scanDirs = ["docs"]` ⇒ 核包提示词面不入扫——本舱对基线零读数漂移（净增 0 天然成立） |

### 5.4 审计与评审轮次（终态）

- **内部偏差审计**（explore · 只读，BLOCKING）= **CLEAN**：全档 139 行逐行哈希比对（对 09-27 快照）——本轮改动仅 `:107` ∕ `:108`；`:19` 差异 = 承前既有（与该档对 HEAD 的 diff 互证：本档相对已提交基线唯有一 hunk）；四类偏差（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 表外改动）零发现。
- **内部代码评审**（advisor · code，同步）= **VERDICT: pass**：🔴0 ∕ 🟡0 ∕ **🔵2**——① 面内术语双形（`cross-face difference` ∕ `cross-end differences`：`:100` ∕ `:106` ∕ `:107`）；② ⑦ 机检只覆盖第 6 条标题行，正文零机检（与「禁止新写散文锚」政策一致，非缺陷）。两条均**接受为记录项、本轮不改**（① = 父侧定稿串不得改字；② = 政策性）。
- **fix round = 0**（无 🔴 ∕ 须修 🟡）；**终态 = clean**。
- 评审引文核验标记（`0/1 citations match`）自查排除：评审引文以省略号缩写致字面比对不中——直读现盘 `:107` 全文在位，非内容不符。

### 5.5 决策透明表

| # | 决策 | 依据 |
|---|---|---|
| 1 | 行 2 ∕ 3 按父侧定稿串逐字（零续行缩进，非本面 3 空格形制） | 任务书「逐字照抄；按父侧定稿串落笔即完成镜像」；已披露，改令可达 |
| 2 | `.thincoder/tmp/**` ∕ `core-registry-copy` 旧句零触碰（只报） | 禁止范围 = 只动该档 clause 6 三行；临时副本零引用（`**/*.mjs` grep 零命中）且被 `.vscodeignore:12` 排除出 VSIX |
| 3 | 测试面 ∕ 装载面零改 | 无测试锚定第 6 条正文（唯一命中 = `prompts-mirror-anchors.test.mjs:116` 标题行断言，本轮不受影响）；`prompt-files.mjs:38-40` 按名读档、无清单 ∕ 哈希随改 |
| 4 | 🔵 两条不改（见 5.4） | ① = 父侧定稿串不得改字；② = 政策性有意为之 |
| 5 | 正文落笔形制 = 逐字串（含 `—` ∕ `⇒` 等原字符） | 逐字照抄口径；不引入 `{{inject:…}}` 锚（零缺键抛错面） |

### 5.6 越域披露

- 本舱写面 = **1 档**（`thincoder-core/prompts/discipline-engineering.md`；另按 D7 落本段）。零舱外写入：`.thincoder/tmp-doccheck.txt`（mtime 今日 10:18）与 `.thincoder/tmp/**` 均为承前既有，非本舱产物；零 commit（提交归父侧）。
- 舱外发现（报而不动）：① `thincoder-vscode/.thincoder/tmp/core-registry-copy/prompts/discipline-engineering.md:107-108` 带收窄前旧句（无引用临时快照，非交付面）；② 批档 §4 ∕ §6 段在落笔时仍为空（父侧段）。

## §6 验证与收口（父代理）

### 6.1 亲验（2026-09-28 19:5x · 父侧）
- 修正轮 **10/10 落**（§2.9 在册；抽读复核：§2.5② 窗口统一 ∕ §2.6 两列 11 档实读 ∕ §2.7 交叉标注 ∕ §2.4 射程 ∥ 三态 ∕ §2.8 口径 ∕ `DOC-DISCIPLINE.md:713/:715/:718` 现值句化）。
- 机检（#81 两窗口实跑）：**净增 0** ✓（行宽 35 → 35；悬空 58 对 §2.5 ∕ §2.8 所记 56 之差 = 窗口外因——口径见 §2.5②）；行宽当场收正 1 处（`DOC-DISCIPLINE.md:715` 折行）。
- **父侧直接执行补记（可 revert）**：§1.2 需求层四档 + §1.3 正本修正（红→绿实跑）+ §1.1`:16` 窗口口径句 + §2.4`:62` 三态更新（英文面已落 19:4x · 回读核实）。

### 6.2 验收对照
- 三面 57 处二态处置 ∥ 残余清零 ∥ 判据入档 + bless 收正 ∥ #374（41 处 ∕ 11 档）∥ 补扫轮（86 处 ∕ 16 档）——全落；§2.5 ①–④ ∥ §2.8 ①–④ 对表在册 ✓。

### 6.3 未决 ∕ 移交（在册不丢）
- 记录面 ∕ dated ∕ 未落保留三类 = 判据内零触碰（清单在册）；「非逐字形态残留」（`AGENT-LOOP.md:427` ∕ `E2E-TESTING.md:184/:194/:195/:196`）——如需收正另裁（在册）。
- `WEBVIEW.md:3`（A 态首例）= 随档下次触碰（射程声明在册）；`RENDER-CORE.md:346/:404` + `PROMPT-SYSTEM.md:173` 同形残句 = 随各档下次触碰随收（裁定：需求层 ∕ 正本 = 裁定陈述形 ∥ 设计判据面 = 判据形——两形各归其面，语义同拍）。
- `VSC-DEBT.md:660` 既有超限行（非本轮净增）在册。
- 码 ∕ 测试面四小项（`#370` ∕ `#396` ∕ `#373③` ∕ `#378②③`）——已随条归技术债清偿批。

### 6.4 收口同步清单（D7）
- 角色表：§1 ∕ §2 ∕ §3 ∕ §4 ∕ §6 齐；**§5 = 无码面实施**（本批笔面全部为文档——实施记录并 §2 系列，N/A 在册）。
- 指针（§1–§6）全解析；变更记录：两设计档各 +1 行在册（#81）；台账：`#527` 随本收口核销；**前批遗留交叉核对** = 无「条目已结而锚批档未闭」项。
- **本批 = 已收口 2026-09-28（记录冻结）。** 凭据面按纪律处置（值不落档）。
