# 2026-10-07 · doc-cleanup
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 13:1x「攒批一起吧。」——文档清账族（各条在册触发 = 归清账批/下一文档轮）攒为一批点火。。
> 台账 = #654 ∥ #924 ∥ #953 ∥ #954 ∥ #958 ∥ #977 ∥ #983 ∥ #1000（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-07）**

### 1.1 来源与点火

- 来源 = 用户 2026-10-07 13:1x「攒批一起吧。」——文档清账族各条在册触发（「归清账批」/「下一文档轮」/「随文档清账轮」）攒为一批，与本波浏览器工具批同时点火。
- 批次面 = **文档清账**（锚债 / 回填 / 残句随正——纯文档面；产品码零触）。
- 需求档面 = 无新需求点（技术债族——条目即清单，逐条证据在台账行）；设计面 = 清账口径（逐条修法 / 判据 / doc-check 闸基线处置）入本批 §2。

### 1.2 条目（8）

| 行 | 事项（简） | 面 |
|---|---|---|
| #983 | 三批文档回填轮：行数/键数实读收正 / 预算聚合重算 / 拆档登记 / 越 500 硬线两件处置 / overview 读数校准 | server 设计/批档 |
| #924 | 文档锚债收尾：上抛 31（需求档 17 / ACP design 14）+ 表外域 16 档×94 配对 | 多档 |
| #958 | doc-check 锚闸基线破口：basename 碰撞族残引（38→65）——引用补全路径前缀等 | 老档引文面 |
| #1000 | 存量死指针三处（METHODOLOGY:61 / DOC-SYSTEM:309-310 / PROMPT-SYSTEM:158 尾指） | core |
| #953 | 「write-gate 再出口」子句族失真三处（DESIGN-TOKEN-SETTLEMENT:150 / MANIFEST:308 / ENG-TOKEN-BINDING:248） | core |
| #954 | 设计档失位两处（DOC-DISCIPLINE:466 / AGENT-PARAMS:22/:89） | core |
| #977 | 外档规范面残句随正（CONTEXT-COMPACTION / MODEL-SPECS——旧基数句族） | core |
| #654 | requirements/WEBVIEW.md 46 行坐标处置（重锚候选 ≈40）——①③④ 面（②候选源面另计） | vsc 需求档 |

### 1.3 合并扫描（点火前——依批次纪律）

- 族内八条 = 同面（文档）同窗 ⇒ 并一批 ✓。
- 不并登记：#770（设计 §6.1 补 D34——随 #761 解冻，条件未达）/ #809（slash 启封随动，条件未达）。
- 全库扫描（点火时）：「归批/清账」射程命中即上表八条；与同波浏览器工具批（#1007）= 不同交付面 ⇒ 各持一卷（不混）。

### 1.4 授权口径

- 用户 13:01「可以，自动干到落地」+ 12:25「自动跑」全链授权（自缚三条：需新范围 / 用户口径裁决 ⇒ 停；破坏性先停）——本批全链自动执行。
- 实施面注记（角色路由）：文档面（`docs/**`）= eng-designer 实施面；`scripts/**` 若确需改（如 doc-check 判面）= 父侧直执（设计可提，实施父侧）。

**§1 补（父侧笔 · 2026-10-07——评审轮 1 发现 7/9 处置）**：#954 行载 `DOC-DISCIPLINE:466` = 台账行时点值；现盘重锚行 = `:479`（§2 实读已注——两值并存不矛盾）。状态行占位注（原「（…）」）已替换为实注。

**§1 补（二 · 父侧笔 · 2026-10-07——评审发现 5 同拍）**：实施面路由扩注 = `docs/batches/*.test.mjs`（批内件）= 工程工具面 ⇒ 父侧直执（与 §2 上抛口径合一）；文档面 `docs/**`（需求/设计档）= eng-designer 实施面；`scripts/**` = 父侧直执（原 §1.4 注记的扩注，非替代）。

**§1 补（三 · 父侧笔 · 2026-10-07——父侧实施面登记 · 可 revert）**：
- **批内件拆档**（工程工具面·父侧直执）：`2026-10-06-console-provider-redo.test.mjs`（568 行）⇒ 静态面腿 ①–④ **334**（留守原档）∥ 运行面腿 ⑤–⑦ **350**（新档 `2026-10-06-console-provider-redo-runtime.test.mjs`）；`thincoder-server/package.json` 闸链 21 ⇒ **22 件**；六档 pin 随动（`server-auto-update` ∥ `provider-model-metadata` ∥ `quota-v2-member-models` ∥ `console-list-style` ∥ `console-layout` ∥ `quota-per-model`——`=21` ⇒ `=22` + 题/头注同拍）；双件复跑 **8/8** ∥ 全闸复跑 **173/173** 全绿。
- **需求档面笔（D1）**：门面 5 锚打标（`core/requirements/LOGGING.md:12`×2 ∥ `:89` ∥ `core/requirements/PROJECT.md:30` ∥ `vsc/requirements/PROJECT.md:22`——C1×2 + C3×2）⇒ 悬空 65 ⇒ **60**；#1000 两处重锚（`METHODOLOGY.md:61` ∥ `PROMPT-SYSTEM.md:158`——现家节 = `persona-engineering.md` §「台账（需求池 / 技术待办）——攒批与生命周期」）；#924 需求档子集 **16 处**打标（式 A——退场注 + 迁移期引文；档 = ADVISOR-CONVERGENCE ∥ AGENT-PARAMS ∥ CONSULTATION ∥ DESIGN-TOKEN-SETTLEMENT×4 ∥ PROVIDER ∥ TOOLS ∥ TURN-CAP-CONTINUE ∥ WEBVIEW×6）∥ RELEASE.md 跨仓坐标 = **核销零改**（声明源形——实体在站点仓根，doc-check 零判定）。
- 零产品码 ∥ `scripts/**` 零触 ∥ 逐处经手（零脚本批量改文）。

**（三·补）#654 笔落（2026-10-07）**：承探棒 #23《WEBVIEW.md 46 行现盘处置表》（46/46 逐条实读）——需求档 WEBVIEW.md 坐标收正轮落定：

- 重锚 **30 处** + 在位核销 **11** + 已处置注记 **3**（F-W12 行） + 记录面零改 **1**（:169 as-of 自持）；`:32`「待父裁」= 已裁「已处置」注记落。
- 连带收正 4 枚（N-W2 `ui.js:468-476` ⇒ `:231-239` ∥ `lib.js:27-30` 两枚 ⇒ 核 `lib.mjs:26-34` ∥ `history-window.mjs:24` 两枚 ⇒ `:29`（含 N-W4））；我笔新引入悬空 2 枚自修（:41 短路径非唯一 ⇒ 全前缀 ∥ :196 记录行裸枚 ⇒ 改写）。
- 机检复跑：该档 ✗ **0**（全仓悬空 60 不变——无新增）。变更记录双条落。
- 残留余量（域外/未核）拆账三条新登：端差句复核（F-W16② vs `tool-summary.mjs:24` 自述）∥ 未列 token 残量 16+ 枚 ∥ 设计档 §13 登记面未核。

**（三·补二）#958 残引修复轮落（eng-designer · 2026-10-07）**：20 档 60 条全处置（B 前缀补全 46 ∥ A 退场标记 13 ∥ 引文形收正 1）；父侧同式复跑 = **悬空 60 ⇒ 0 · exit 0**（悬空归零坐实——全库闸绿）。§2 实施轮块 + 逐档表已在位（列和 46+13+1=60 可复现）。

**偏离项裁定（父侧 · 同轮）**：**接受**——`WEB-QUICKCHECK.md:57` 引文内 `./app.mjs` 不取补全形（补全态会写伪引文内 src 的解析语义、非同一链路）；取等义形 `src="app.mjs"`（同 URL 解析、机制陈述零改、碰撞消解）。已验（该档 ✗ 0）。

**漂移 3 族 ∥ 报告面残项** → 拆账两条新登（**#1014** ∥ **#1015**——本笔不重锚 / 不清理，按批口径只报告）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初版 8 条目 + 修轮块 + #958 实施轮块 + 余六条目实施块（#953 ∥ #954 ∥ #977 ∥ #1000-② ∥ #983 ∥ #924——设计档面）全部落盘；复跑 悬空 0 · 行宽 OK · exit 0（2026-10-07））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-07）**

**本批条目（覆盖 · 8 条——台账行 #654 ∥ #924 ∥ #953 ∥ #954 ∥ #958 ∥ #977 ∥ #983 ∥ #1000）**

清账批：全部条目 = 文档面在册技术债（无新需求点；条目即清单，证据链 = 台账行 + 各条起源批档）。逐条修法/落点/判据见下；验收对照见段末。

**基线读数（#958 · 本设计轮实跑 ×2 一致）**

命令 = `node scripts/doc-check.mjs`（thincoder 根）。读数：候选 51425 · **悬空 66** · 注记豁免 331 · 拟新增 50 · 迁移期引文 305 · 声明源缺位 0 · 行宽 OK · 行数面差异 13（报告态）· exit 1。
（§1.2 载「38→65」= 点火/前时点读数；现盘 66——差 1 = `docs/core/requirements/BROWSER-TOOL.md:52`〔浏览器批在飞〕。本批以 66 为基线。）

**#958 根因与机制（实读）**

- 根因：`docs/batches/2026-10-06-prompt-three-layer.md:271` 载当刻 exit 0（10-06 09:0x）；其后 `thincoder-server` 树新增同名件破「唯一 basename 回退」唯一性（`scripts/doc-check-anchors.mjs:186-196`）⇒ 碰撞族旧式残引群体翻转（38 → 58 → 62 → 65 → 66）。碰撞集（全）= **7 个 basename**：`config.mjs` ∥ `log.mjs` ∥ `providers.mjs` ∥ `errors.mjs` ∥ `app.mjs` ∥ `presets.mjs` ∥ `provider-admin.mjs`——后三 = 本批族表 20/4/3 族重复件（`thincoder-server/public/app.mjs` ∥ `thincoder-server/src/ops/presets.mjs` ∥ `thincoder-server/src/gateway/provider-admin.mjs`，均在 server 树）。
- 修法 = **引用补全路径前缀**；`scripts/**` 零触（§1.4）。
- 处置动词全集 = A 退场注+标记（对象已消 ∥ 史实句）∥ B 改活指针 ∥ C 改述去锚 ∥ 记录面零改 ∥ 核销（承 10-04 轮三式先例，零新术语）。

**66 条三分（修 / 上抛 / 留）**

| 面 | 条 | 处置 | 笔 |
|---|---|---|---|
| design 档：cli/design 5 ∥ core/design 29 ∥ desktop/design 25 ∥ render-core/design 1 | **60** | 本批修（B 为主，少数 A/C——逐行读认定型） | 本批（文档面 §1.4） |
| core/requirements 5 ∥ vsc/requirements 1 | 6 | 上抛父侧笔（需求档面）；其中 `BROWSER-TOOL.md:52` = 在飞面**留** | 主 agent |
| 计 | 66 | | |

**族别 → 落点（标 ✓ = 本设计轮实读在盘；「文档面（条）」= 各条目所在档的分布——列和复现「66 条三分」）**

| 族 | 条 | 文档面（条） | 动作 | 目标 |
|---|---|---|---|---|
| `renderer/app.mjs` 族（含 `app.mjs:*` ∥ `./app.mjs`） | 20 | desktop/design 19 + render-core/design 1 | B 前缀补全 | `thincoder-desktop/renderer/app.mjs` ✓ |
| `providers.mjs:*` ∥ `src/main/providers.mjs` | 5 | desktop/design 5 | B | `thincoder-desktop/src/main/providers.mjs` ✓ |
| 桌面 `config.mjs:49`（UI:673） | 1 | desktop/design 1 | 逐行读认（B ∥ A） | 桌面临档或 `thincoder-core/config.mjs` |
| core `src/config.mjs` ∥ `config.mjs:*` | 15 | core/design 14 + cli/design 1 | 逐行读认（B ∥ A） | `thincoder-core/config.mjs` ✓ |
| presets 族（`src/extension/presets.mjs` ∥ `presets.mjs:*`） | 4 | core/design 3 + cli/design 1 | 逐行读认（B ∥ A） | `thincoder-vscode/src/extension/presets.mjs` ✓ ∥ 余按句义 |
| log 族（`src/log.mjs` ∥ cli/vsc 旧路径） | 8 | core/design 5 + core/requirements 3 | 逐行读认（B ∥ A） | `thincoder-core/log.mjs` ✓；cli/vsc 旧路径不在盘 ⇒ A 或改指核 |
| `src/provider/errors.mjs` | 1 | core/design 1 | B | `thincoder-core/provider/errors.mjs` ✓ |
| provider-admin 族（`src/tui/…` ∥ `provider-admin.mjs:88`） | 3 | cli/design 3 | B | `thincoder-cli/src/tui/provider-admin.mjs` ✓ |
| `thincoder-cli/src/config.mjs` 残引 | 5 | core/design 4 + core/requirements 1 | 逐行读认（B 改指核 ∥ A 史实） | 目标不在盘（cli 树实读无此档） |
| `thincoder-vscode/src/config.mjs` 残引 | 3 | core/design 2 + vsc/requirements 1 | 同上 | 目标不在盘 |
| `docs/design/browser.md`（BROWSER-TOOL:52） | 1 | core/requirements 1（在飞面留） | 留（在飞批面） | — |

列和核对：cli/design 5（1+1+3）∥ core/design 29（14+3+5+1+4+2）∥ desktop/design 25（19+5+1）∥ render-core/design 1 ∥ core/requirements 5（3+1+1）∥ vsc/requirements 1——合计 66 = 60 + 6（档面分布经本修轮复跑复核）。

**受影档（本批施打 = 20 档）**：`cli/design`：ACP-CLIENT ∥ CLI-DEBT ∥ TUI-COMMANDS；`core/design`：AGENT-LOOP ∥ CONFIG ∥ CORE-UNIFICATION ∥ DOC-CODE-RECONCILE ∥ LOGGING ∥ PROVIDER；`desktop/design`：ACTIVITY ∥ CHAT ∥ COMPOSER ∥ IPC ∥ PANEL-READBACK ∥ PROJECT ∥ RENDERER ∥ SETTINGS ∥ UI ∥ WEB-QUICKCHECK；`render-core/design`：RENDER-CORE。

**归零口径与目标读数**：每受影档复跑悬空 = 0（注记 ∥ 迁移期引文 ∥ 拟新增列报面除外）；**修后总悬空目标 = 6**（= 上抛 5 + 留 1；父侧笔同轮落 ⇒ 5 → 0，在飞面落 ⇒ 归零）；exit 1 保持至双面收口。附：`ACP-CLIENT` 的 10-04 轮「零触约束」= 历史注记——实施轮开工按避让表复核一次（防与他批写域相撞）。

**#953（「write-gate 再出口」子句族失真三处）**

- 事实（本设计轮实读）：`resolveReviewDocPaths` 宿主 = `thincoder-core/agent-tools/review-facts.mjs:72`；消费 = `advisor.mjs:16`/`:121` ∥ `advisor-async.mjs:56`/`:399`（**直引** review-facts.mjs）；`agent/write-gate.mjs:44` 再出口仅 `REVIEW_ROOT_KEYS` + `resolveReviewRootsFor`（无 `resolveReviewDocPaths`）⇒ 三处「write-gate 同名再出口保指针面」谓词对本名失真。
- 修法：三处子句删「write-gate 同名再出口」；同句涉 `REVIEW_ROOT_KEYS`/`resolveReviewRootsFor` 的再出口谓词 = 现盘真，逐字保留。落点：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（~:150）∥ `docs/core/design/MANIFEST.md`（~:308）∥ `docs/core/design/ENG-TOKEN-BINDING.md`（~:248）——逐处读认后落笔。
- 判据/验收：三处 `resolveReviewDocPaths` 邻域 = 零 write-gate 再出口主张 ∥ 两符号谓词保留 ∥ 产品码零触（父侧若反裁补再出口 ⇒ 另批）。

**#954（设计档失位两处）**

- **a**：`docs/core/design/DOC-DISCIPLINE.md` 残差表 loop.mjs 行（现 :479——载 `:217 §18.7`）：残句已由更早批次处置（10-05 批实读在册 + 本设计轮复读：`thincoder-core/advisor/` 全树 `§18.7` 零命中）⇒ **核销行**（删行 + 变更记录一行）。判据 = 该表 loop.mjs 行零在。
- **b**：`docs/core/design/AGENT-PARAMS.md`「run.mjs re-export」谓词与陈旧坐标全清（逐点列）：谓词点 `:22`/`:89`（+ §6.1 表 `:69` 同族）⇒ 删谓词；坐标 `compaction.mjs:37` ⇒ `:42`（另见该档 `:31`/`:57`；实读 = `export const REVIEW_TIMEOUT_MS = 600_000`）；坐标 `loop.mjs:103` ⇒ `:104`（另见该档 `:23`/`:57`/`:70`；核内消费唯一 = `advisor/loop.mjs:104`——可补真消费点）。判据 = 该档零陈旧坐标残留（`compaction.mjs:37` ∥ `loop.mjs:103` 逐处）∥ 该档该名落点与现盘一致 ∥ 零「run.mjs」谓词残留。

**#977（外档规范面残句随正——源 = `2026-10-06-advisor-budget-reserve.md:44`）**

- 面：`docs/core/design/CONTEXT-COMPACTION.md` `:61`（本设计轮已读 = 「auto = `specForModel(model).context × 0.6`」）∥ `:196` ∥ `:674`（旧基数公式）+ `:62` 理由句（部分被取代）；`docs/core/design/MODEL-SPECS.md` `§12.4` `:1071`「压缩阈值」行「读什么」列补 `maxOutput`。
- 修法：收正为**可用窗口**口径（窗 − 完成预留；比例链 `limit`/`compactAt` 随 `advisorContextBudget`/`resolveCompactThreshold` 现盘）；逐处读认后落笔。
- 判据/验收：三处公式句实读 = 可用窗口口径 ∥ 该两档零「窗口 × 0.6」旧式残句（或仅剩史实注记行）∥ MODEL-SPECS 行含 `maxOutput` ∥ 复跑零新增。

**#1000（存量死指针三处——重锚至现家）**

- 现家实读：攒批工作流 = `docs/core/design/prompts/persona-engineering.md` §「台账（需求池 / 技术待办）——攒批与生命周期」`:160`–`:165`（五条）+ 运行期落地档 `thincoder-core/prompts/persona-engineering.md` 同节；`discipline-engineering.md:169` 现 = 文档更新纪律 D1 行。
- 三处处置（重锚 → `doc:section` 形、弃旧行号锚）：
  1. `docs/core/requirements/METHODOLOGY.md:61`（F5-1 指针列）——「`discipline-engineering.md` `:169`（攒批工作流）」⇒ 改指现家节。（需求档面——父侧笔）
  2. `docs/core/design/DOC-SYSTEM.md` `:309`/`:310`（§10.3 落点表「现第 176 行」/「现第 220 行」）+ `:312` 同族句 ⇒ 同拍改指现家节名。（设计档面——本批笔）
  3. `docs/core/requirements/PROMPT-SYSTEM.md:158` 尾指（「机制权威 = `docs/core/design/LEDGER.md`」）⇒ 分轴收正：攒批工作流/附属纪律正本 = `persona-engineering.md` 台账节；台账机制权威 = `LEDGER.md`（在盘 987 行）可留——逐读定形。（需求档面——父侧笔）
- 判据/验收：三处不再指 `discipline-engineering.md` 攒批工作流旧落点 ∥ 新指针节名实读在位（五条）∥ 复跑零新增。

**#983（三批文档回填轮——R29/R34/R36 在册）**

- 落点：`docs/server/design/PROJECT.md`（320 行——预算/聚合面）∥ `docs/server/design/webui/WEBUI.md`（531——§5 行数表/小计 + §2.2 键族登记）∥ `docs/server/design/gateway/API.md`（232——`:111`/`:112` 两档标记）。
- **测法命令（设计给定——实施轮照跑照填）**：
  1. 源档行数（口径 = 内容行数 ∥ 文末换行不计）：`node -e "const fs=require('fs');const s=fs.readFileSync(F,'utf8');console.log(s.split('\n').length-(s.endsWith('\n')?1:0))"`（逐档跑；与 read 末行号存 ±1 边界差时以 read 为准——沿 `2026-10-06-console-list-style.md:72` 口径注记）。
  2. i18n 键数/行数：`node --input-type=module -e "const m=await import('file:///<repo>/thincoder-server/public/i18n-zh.mjs');console.log(Object.keys(m.ZH).length)"`（en 对称 `m.EN`；导出名实施轮读头核一次）。本设计轮读数：i18n-zh 350 ∥ i18n-en 353（行）。
  3. 预算聚合重算：逐档实读后按表内口径回填，聚合 = 成员之和（复算对拍）。
- 子项处置：
  - 行数/键数实读收正（「拟新增」⇒ 已落盘 ∥ 设计估 ⇒ 实读）；
  - 预算聚合重算（`PROJECT.md:138` 子项和与聚合不自洽〔≈+196 vs ≈+179〕+ 修正块已披露「聚合 ≈2840 ∥ ≈6940 未随重算」；`WEBUI.md:352` 小计同型）；
  - 拆档登记（U7：`-models-config.test.mjs` **270** ∥ `-models-config-ui.test.mjs` **493**（增量 ±0——登记面零改；距 500 硬线余量 **7** 行）——件名+双行数入设计档；`package.json` 已落勿重添）；
  - **>300 档档位结论（`-models-config-ui.test.mjs` · 493）**：**不拆**——本批零改该件 ∥ 493 ≤ 500 硬线（余量 7 行）；触发阈值 = 任一后续净增使其 > 500 ⇒ 先拆后改（沿「>500 不允许诞生」硬线）∥ 该档下次结构改动先到即拆（沿 10-04 拆分复核先例）；窗口 = 该件下次触及批（回填轮复读同核）。
  - 越 500 硬线两件：① 首版 657 已拆 = 承上登记；② `-console-provider-redo.test.mjs` **568**（修轮实读；`2026-10-06-console-provider-redo.md:131`/`:159` 载 561 = 时点值）⇒ 处置 = **拆分 ∥ 停下上报**（二择——「不可切则认账登记」退路删，与「批内件全件 ≤500」验收自洽）；拆分面 = 原件退场 ⇒ 两件逐件 ≤500（拆分搬移；各行数以实施轮读件收正；切点 = 静态面腿 ①–④ ∥ 运行面腿 ⑤–⑦）；双件入闸复跑须全绿；
  - overview 读数校准（`gateway/API.md` `:111`「`embedding-admin.mjs`」∥ `:112`「`overview.mjs`」仍「拟新增」+设计估 ⇒ 盘面实读收正）。
- 判据/验收：回填值 = 命令实读逐值相等 ∥ 聚合自洽（成员和 = 小计/总账）∥ 「拟新增」零残留（凡已落盘）∥ 批内件全件 ≤500 ∥ 复跑零新增。

**#654（vsc/requirements/WEBVIEW.md 46 行 + 吸收项——重锚口径 · 逐行读认流程）**

- 源 = `2026-09-29-doc-check-face.md:753-757`（§2.19 分类表）+ 吸收项：`SPEC-MACHINE-CHECK:39` ∥ `#469` requirements 12 档 24 行 ∥ vsc-carryover U2/U3（`vsc/requirements/WEBVIEW.md:66`/`:85`）∥ `core/requirements/PROJECT.md:30`（21→22 计数句——现盘悬空 1）。前缀指针 = `2026-09-29-doc-sync-carryover` ∥ `2026-09-29-vsc-carryover` ∥ `2026-10-04-provider-config-family`；逐项原文实施轮取。
- 四类动作（沿设计档同口径）：假阳/已在位 4（`:34` 半 ∥ `:39` 半 ∥ `:117` 半 ∥ `:179`）⇒ 核销（零改）；记录面 1（`:169`）⇒ 零改；需裁定 1（`:32`——F-W12 四死 handler 已退场、坐标对象已消）⇒ 「已处置」注记（不重锚）；重锚候选 ≈40 ⇒ 逐行重锚现位（跨档迁移为主：webview 族 → 核 ∕ `chat-messages.js`）；自注「原证据坐标 = 修复前时点值」行按注口径收正。
- 流程（逐行读认）：① 取清单（§2.19 原表 + 吸收项）→ ② 逐行现盘读（目标 `file:line`）→ ③ 动作判（活 ⇒ B ∥ 消 ⇒ A/改述 ∥ 记录面 ⇒ 零改 ∥ 假阳 ⇒ 核销）→ ④ 落笔（**父侧笔**——需求档面，D1）→ ⑤ 回读抽核 ≥5 行 → ⑥ 复跑该档 ✗ = 0。
- 判据/验收：`vsc/requirements/WEBVIEW.md`（196 行）悬空归零（记录面零改除外）∥ 在册行全部有终态（重锚/核销/注记）∥ 清单外零动（不扩面）。
- 行注口径：「①③④ 射程 ∥ ②另计」——本设计按 §2.19 四类全列动作；②类（记录面）处置 = 零改保全；若父侧「②」别指他面，以父裁分解（四类动作已备映射）。

**#924（三式处置选形——31 项 + 94 配对维持裁）**

- 面 = `docs/batches/2026-10-04-doc-cleanup-round.md` §5.4 在册 31 项（17 需求档 ∥ 14 ACP 面）；复跑已见部分项带「迁移期引文」标（前轮部分处置）。
- 流程：① 取 31 项 → ② 逐项现盘读（已带注/标记 ⇒ 核销；未处置 ⇒ 选形）→ ③ 选形：A 退场注+标记 ∥ B 改活指针（目标可定且在盘）∥ C 改述去锚（句义仍立、去旧锚）→ ④ 落笔（需求档面父侧 ∥ 设计档面本批笔）→ ⑤ 复跑核销。
- 94 配对（16 档 × 94 = 补针扩面）：**维持** 10-04 §6「不扩面」裁（补针成本 ≫ 收益；主面已由「拟新增/迁移期引文」机制覆盖）；存续声明入本批 §6 观察；父侧欲扩面另轮。
- 判据/验收：31 项逐项终态（A/B/C ∥ 核销）∥ 复跑零新增 ∥ 94 面零新落笔。

**受影响文件清单（行数 = 本设计轮读数〔批内件三行 = 修轮实读〕；增量：行内改为主 = ±0，加注行 +1/处为限）**

| 面 | 档（行数） | 条目 |
|---|---|---|
| 设计·cli | ACP-CLIENT 795 ∥ CLI-DEBT 124 ∥ TUI-COMMANDS 228 | #958 |
| 设计·core | AGENT-LOOP 643 ∥ CONFIG 236 ∥ CORE-UNIFICATION 2076 ∥ DOC-CODE-RECONCILE 473 ∥ LOGGING 164 ∥ PROVIDER 632 | #958 |
| 设计·core（机制面） | DESIGN-TOKEN-SETTLEMENT 243 ∥ MANIFEST 914 ∥ ENG-TOKEN-BINDING 312 ∥ DOC-DISCIPLINE 1678 ∥ AGENT-PARAMS 141 ∥ CONTEXT-COMPACTION 800 ∥ MODEL-SPECS 2091 ∥ DOC-SYSTEM 440 | #953 ∥ #954 ∥ #977 ∥ #1000 |
| 设计·desktop | ACTIVITY 476 ∥ CHAT 258 ∥ COMPOSER 337 ∥ IPC 554 ∥ PANEL-READBACK 222 ∥ PROJECT 1854 ∥ RENDERER 552 ∥ SETTINGS 389 ∥ UI 814 ∥ WEB-QUICKCHECK 203 | #958 |
| 设计·render-core | RENDER-CORE 604 | #958 |
| 设计·server | PROJECT 320 ∥ webui/WEBUI 531 ∥ gateway/API 232 | #983 |
| 需求档（父侧笔） | core/requirements：METHODOLOGY 121 ∥ PROMPT-SYSTEM 287 ∥ LOGGING 91 ∥ PROJECT 173 ∥ BROWSER-TOOL 56（留）∥ vsc/requirements：PROJECT 84 ∥ WEBVIEW 196 | #958 ∥ #1000 ∥ #654 ∥ #924 |
| 批内件（工程工具面） | `2026-10-06-console-provider-redo.test.mjs` **568**（增量：拆分搬移——两件逐件 ≤500；拆分 ∥ 停下上报）∥ `-models-config.test.mjs` **270**（增量 ±0——登记面零改）∥ `-models-config-ui.test.mjs` **493**（增量 ±0——登记面零改；距 500 硬线余量 **7**） | #983 |

**测试面**：本批零测试档新增（纯文档面）；验证 = `node scripts/doc-check.mjs` 复跑读数 + 逐档读回。批内件面（#983）见上表。

**关键决策记录（含否决项）**

1. #958 修 = 引用补全（选）vs 改 checker 唯名回退（拒——`scripts/**` 零触；引用自足才是本）。
2. #953 = 收正文档（选）vs 产品码补再出口（拒——产品码零触 + 零需求面消费者）。
3. #983-568 = 拆档（选，沿 models-config 先例）∥ 不可切 ⇒ 停下上报（认账退路删——与「批内件全件 ≤500」验收互斥）。
4. #924-94 = 维持不扩面（选）vs 补针（拒——成本收益）。
5. #654 = 父侧笔 + 逐行读认（D1 归口）。
6. 处置动词 = A/B/C + 零改 + 核销（承 10-04 轮，零新术语）。

**边界（本批不做）**：产品码零触（含 write-gate 再出口；run.mjs 谓词若需代码面另批）∥ `scripts/**` 零触 ∥ 提示词档零触 ∥ 需求档零笔（只给口径/流程/判据）∥ 94 配对不扩面 ∥ 行数面差异 13（桌面域声明面）非本批条目（列报）∥ 他批在飞（browser）零触 ∥ 禁脚本批量改文（逐处经手——承 10-04 §6）。

**验收对照（回指条目——机检形）**

| # | 验收 | 收口来源 |
|---|---|---|
| #958 | 复跑悬空 = 6（修后）∥ 20 受影档逐档 ✗ = 0（列报面除外）；修去条数 = 60 | 本批自笔（修去 60——可自证）∥ 上抛项笔（需求档 5）∥ 在飞批（`BROWSER-TOOL:52` 留 1——修轮复跑已不在悬空列；实读以 §6 当刻为准） |
| #953 | 三档 `resolveReviewDocPaths` 邻域零「write-gate 同名再出口」∥ 两符号谓词保留 | 本批自笔 |
| #954 | a = 该表 loop.mjs 行零在；b = AGENT-PARAMS 零「run.mjs」谓词 ∥ 零 `compaction.mjs:37`/`loop.mjs:103` 残留（逐处）∥ 坐标 `:42` ∥ 消费点 `loop.mjs:104` | 本批自笔 |
| #977 | 三公式句实读 = 可用窗口口径 ∥ MODEL-SPECS `:1071` 含 `maxOutput` | 本批自笔 |
| #1000 | 三处新指针节名/条数实读在位（五条）∥ 零旧落点 | 本批自笔（DOC-SYSTEM `:309`/`:310` 同族）∥ 上抛项笔（`METHODOLOGY:61` ∥ `PROMPT-SYSTEM:158`——需求档面） |
| #983 | 回填值逐值 = 命令实读 ∥ 聚合自洽 ∥ 批内件全件 ≤500 ∥ 「拟新增」零残留 | 本批自笔（三档回填）∥ 上抛项笔（批内件拆档 = 工程工具面·父侧直执） |
| #654 | WEBVIEW 悬空归零 ∥ 在册行终态全 ∥ 清单外零动 | 上抛项笔（需求档面·父侧笔——#654 全族） |
| #924 | 31 项终态全 ∥ 94 维持裁 | 本批自笔（设计档子集 14）∥ 上抛项笔（需求档子集 17）；94 面 = 零落笔 |

**上抛项（父侧笔 / 其他面）**：需求档面修 5（`LOGGING.md:12`×2 ∥ `:89` ∥ `PROJECT.md:30` ∥ `vsc/requirements/PROJECT.md:22`）∥ #654 全族 ∥ #1000 两处（METHODOLOGY:61 ∥ PROMPT-SYSTEM:158）∥ #924 需求档子集 ∥ `BROWSER-TOOL:52`（在飞批——修轮复跑已不在悬空列）∥ 批内件拆档（`docs/batches/*.test.mjs` = 工程工具面 ⇒ 父侧直执；§1.4 文件类同拍扩写 = 待父侧笔）∥ ACP-CLIENT 零触约束历史注记（实施轮复核）。

**变更记录**：2026-10-07 — §2 初版（8 条目设计；基线 = 本设计轮 doc-check 实跑）∥ 2026-10-07 — 修轮 1（评审轮 1 发现 7 条逐号落地——见修轮块）。

**修轮块（评审轮 1 发现逐号落地 · 2026-10-07）**

评审轮 1 = pass（0🔴 ∥ 🟡 6 ∥ 🔵 4；§3 在档）。父侧裁决：发现 1–6 ∥ 8 = 本笔落地（7 条）；发现 7 ∥ 9 = 父侧笔（§1 补记 ∥ 状态行——已落）；发现 10 = 上下文声明（不入批）。

| 发现 | 修改位置 | 修法（一句） |
|---|---|---|
| 1 | `:130` ∥ `:132` ∥ `:151` ∥ `:162` | 批内件三档行数刷新为修轮实读（568 ∥ 270 ∥ 493）+ 逐档增量标注（登记面 ±0；568 = 拆分搬移面）；493 档标距 500 硬线余量 7 行 |
| 2 | `:131`（新增档位结论条）∥ `:132`（退路删）∥ `:170`（决策记录同拍） | 「不可切则认账登记」退路删（留「拆分 ∥ 停下上报」）；493 档补显式档位结论（不拆 + 窗口 + 触发阈值） |
| 3 | `:60` | 碰撞集补全 = 7 个 basename（+ `app.mjs` ∥ `presets.mjs` ∥ `provider-admin.mjs`——族表 20/4/3 族重复件，均在 server 树） |
| 4 | `:103` ∥ `:183` | 陈旧坐标逐点列全（`compaction.mjs:37`→`:42` 另见 `:31`/`:57`；`loop.mjs:103`→`:104` 另见 `:23`/`:57`/`:70`）；判据补「该档零陈旧坐标残留（逐处）」 |
| 5 | `:190` | 批内件路由明写文件类（`docs/batches/*.test.mjs` = 工程工具面 ⇒ 父侧直执）；§1.4 文件类同拍扩写 = 待父侧笔（§1 非本笔） |
| 6 | `:179`–`:188` | 验收表逐行加「收口来源」列（本批自笔 ∥ 上抛项笔 ∥ 在飞批） |
| 8 | `:72`–`:88` | 族表加「文档面（条）」列 + 列和核对行（60/6 拆分可由表复现） |

零动面：§1 ∥ §3 ∥ 需求档 ∥ `scripts/**` ∥ 产品码——未触（本笔 diff 面 = §2）。

观察（七号外——报父侧）：修轮复跑 = 悬空 **65**（设计基线 66——`BROWSER-TOOL.md:52` 已不在悬空列，原「在飞面留 1」项）；同跑：候选 51608 ∥ 拟新增 60 ⇒ 「修后 = 6」实读链以 §5/§6 当刻实读为准；基线链如需重切 = 父侧另笔裁。

**§2 实施轮块（#958 设计档面残引修复 · 落盘 · eng-designer · 2026-10-07）**

承 §2「族别 → 落点」表 + §4 派单（设计档面 = eng-designer 实施面）。射程 = 20 档 60 条闸态悬空引。

**读数**（`node scripts/doc-check.mjs --root .`，thincoder 根；开工 ∥ 收笔同式）：
- 开工基线 = 悬空 **60**（exit 1——与设计「修去条数 = 60」精确重合）。
- 收笔终值 = 悬空 **0** ∥ **exit 0** ∥ 行宽 OK ∥ 汇总 = 候选 51624 · 注记豁免 331 · 拟新增 51 · 迁移期引文 **323**（310 + 13 = 本笔新增标记数，逐笔对得上）· 声明源缺位 0。
- 与设计目标（修后 = 6）的差 = 需求档 5 + 在飞 1 已由父侧笔 ∕ 在飞批同轮落位 ⇒ 全库归零（超预期，方向一致）。

**落笔分式（60 = 46 + 13 + 1）**：B 前缀补全 **46** ∥ A 退场标记 **13**（逐条携史实谓词——已删 ∕ 已迁核 ∕ 旧址）∥ 引文形收正 **1**（`WEB-QUICKCHECK.md:57`——见偏离项）。

**逐档落笔（20 档 · 条数 = 该档计）**

| 档 | 条 | 落法（行号:式） |
|---|---|---|
| cli/design · ACP-CLIENT | 2 | 374:B ∥ 576:B |
| cli/design · CLI-DEBT | 2 | 79:B ∥ 122:B |
| cli/design · TUI-COMMANDS | 1 | 207:B |
| core/design · AGENT-LOOP | 2 | 24:A ∥ 65:A |
| core/design · CONFIG | 5 | 17:B ∥ 19:B ∥ 44:A ∥ 45:A ∥ 47:A |
| core/design · CORE-UNIFICATION | 10 | 746:B ∥ 830:B ∥ 888:B ∥ 1245×4:B（改指核）∥ 1361:A ∥ 1730:A ∥ 1750:A |
| core/design · DOC-CODE-RECONCILE | 1 | 240:B |
| core/design · LOGGING | 2 | 49:A ∥ 155:A |
| core/design · PROVIDER | 9 | 19:A ∥ 39:A ∥ 365:A ∥ 434×2:B ∥ 453:B ∥ 463:B ∥ 466:B ∥ 620:B |
| desktop/design · ACTIVITY | 1 | 352:B |
| desktop/design · CHAT | 1 | 142:B |
| desktop/design · COMPOSER | 3 | 210:B ∥ 233:B ∥ 324:B |
| desktop/design · IPC | 1 | 540:B |
| desktop/design · PANEL-READBACK | 1 | 63:B |
| desktop/design · PROJECT | 6 | 387:B ∥ 480:B ∥ 516:B ∥ 711:B ∥ 1633:B ∥ 1694:B |
| desktop/design · RENDERER | 4 | 253:B ∥ 326:B ∥ 463:B ∥ 464:B |
| desktop/design · SETTINGS | 2 | 52:B ∥ 235:B |
| desktop/design · UI | 3 | 369:B ∥ 673:B ∥ 703:B |
| desktop/design · WEB-QUICKCHECK | 3 | 57:形收正 ∥ 76:B ∥ 202:B |
| render-core/design · RENDER-CORE | 1 | 24:B |

计数核对：B = 46 ∥ A = 13 ∥ 形 = 1 ⇒ 合计 60（列和逐档可复现）。

**偏离项（1 · 请核）**：`WEB-QUICKCHECK.md:57` 的 `./app.mjs`（html 引文内相对 token）未按「B 前缀补全」体例处理——引文语境里补全形会改写 `src` 的解析语义（渲染根相对 ⇒ 另一条链路）、把引文写伪；取**等义形收正** = `src="./app.mjs"` ⇒ `src="app.mjs"`（同一 URL 解析、机制陈述零改、消唯一性碰撞）。已验（复跑该档 ✗ 0）。如需改回 ∕ 另形，父侧裁后可 revert。

**漂移观察（坐标不收——按批口径只报告）**：
- `WEB-QUICKCHECK.md:57` 引文宿主坐标 `index.html:54`：现盘实读脚本行在 `:55`（`:54` = `<div data-slot="settings">`）——off-by-one，未重锚。
- `PROVIDER.md:365` 四坐标（`thincoder-vscode/src/config.mjs:106 ∥ :142 ∥ :183 ∥ :166`）：宿主档已删；活体已迁核——例 `isBailianHost` 实读 = `thincoder-core/config.mjs:121`——未重锚（该条已打档已删标记）。
- `ACP-CLIENT.md:374` ∥ `CONFIG.md:17 ∥ :19` 同引 `thincoder-vscode/src/extension/presets.mjs`：书写坐 `:30 ∥ :64 ∥ :94`，实读实体在 `:31 ∥ :66 ∥ :96`（外一行为注释）——未重锚。

**零触面**：产品码 ∥ `scripts/**` ∥ 需求档 ∥ 提示词 = 零触；diff 面 = `docs/**` 20 档（逐处经手，零脚本批量改文）。ACP-CLIENT 避让复核 = 落笔时点该档零他批在飞写。

**报告面观察（不入闸 · 非本笔引入）**：标记冗余 6 处（`docs/core/requirements/TURN-CAP-CONTINUE.md` ×5 ∥ `docs/vsc/design/VSC-DEBT.md` ×1——需求档面 ∕ 他档面，本笔零触）；行数面差异 13 条（在册，非本批条目）。

**余项（本笔射程外——批内余条目 ∕ 余面）**：#953×3 ∥ #954a ∥ #954b ∥ #977 ∥ #1000 ∥ #983 ∥ #654（父侧笔）∥ #924 ——本笔零触。

**变更记录**：2026-10-07 — §2 实施轮块（#958 二十档残引修复落盘；复跑 悬空 60 ⇒ 0）。

**§2 实施轮块（余六条目 · 设计档面 · 落盘 · eng-designer · 2026-10-07）**

承 §2「余项」清单（上轮 #958 修复轮后余项）：本笔射程 = 设计档面六条目 + #924 设计档子集；#654 需求档全族 = 父侧笔（已在位）。逐处读认落笔（零脚本批量改文）；产品码 ∥ `scripts/**` ∥ 提示词 ∥ 需求档 = 零触。

**逐条落点（12 档）**

| 条目 | 档 | 落笔（要点） |
|---|---|---|
| #953 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（`:151`/`:226`）∥ `MANIFEST.md`（`:308`/`:725`）∥ `ENG-TOKEN-BINDING.md`（`:248`/`:295`） | 「write-gate 同名再出口」失真子句**六处删**（`resolveReviewDocPaths` 现盘零再出口——单源 = `review-facts.mjs`）；`REVIEW_ROOT_KEYS` / `resolveReviewRootsFor` 再出口谓词 = 现盘真，逐字保留 |
| #954a | `docs/core/design/DOC-DISCIPLINE.md` | §3.9 J-1 残差表 loop.mjs 行**核销**（`:479` 删——该档 `§18.7` 零命中）；表 45 ⇒ **44 档**（`:463` 计数同拍） |
| #954b | `docs/core/design/AGENT-PARAMS.md` | 陈旧坐标全清：`compaction.mjs:37` ⇒ `:42`（五处）∥ `loop.mjs:103` ⇒ `:104`（三处）∥「`run.mjs` re-export」谓词删（`:22`/`:89` 行名同去——现盘零 re-export） |
| #977 | `docs/core/design/CONTEXT-COMPACTION.md`（`:61`/`:62`/`:196`/`:674`）∥ `MODEL-SPECS.md`（`:1071`） | 阈值公式三处收正 = **可用窗口 × 0.6**（可用窗口 = 窗口 − 完成预留——显式 `maxTokens` 否则 `maxOutput`）；`:62` 理由句随正；MODEL-SPECS「读什么」列补 `maxOutput` + 核侧坐标 ⇒ `:137-144`（现读） |
| #1000-② | `docs/core/design/DOC-SYSTEM.md`（`:309`/`:310`/`:312`） | §10.3 落点表两行重锚现家节（`persona-engineering.md` §「台账（需求池 / 技术待办）——攒批与生命周期」∥ 运行期落地档同节——旧行号锚弃）；「为何落这里」句随正 |
| #983 | `docs/server/design/PROJECT.md` ∥ `webui/WEBUI.md` ∥ `gateway/API.md` | 批内件实读 = **497** ∥ **473** ∥ **334 ∥ 350**（拆档双件）∥ **270 ∥ 493**（距 500 余量 7——不拆 + 窗口/阈值）∥ **238**；注②⑥⑦⑧⑨ 施行回填核销；§9 R29/R34/R36 部分已办；「拟新增」零残留（凡已落盘——含预算段两枚）；i18n 实读 行 **350 ∥ 353** ∥ 键 **306 ∥ 311**；API 逐档实读和 = 小计 **1362**（自洽） |
| #924 | `docs/cli/design/ACP-CLIENT.md` | 式 A 四锚退场注 + 迁移期引文标（`:338`/`:404`/`:618`/`:619`——2026-09-28 测试树全清）；跨仓坐标十锚去前缀改述（裸页名——站仓 = 表头单源；体裁判例 = `docs/desktop/design/PACKAGING.md` §6 行式） |

**变更记录**：逐档一行已落（12 档——顺序随各档体例：倒序档插顶 ∥ 升序档追尾）。

**收笔读数**（`node scripts/doc-check.mjs`，thincoder 根）：**悬空 0** ∥ **行宽 OK** ∥ **exit 0**；汇总 = 候选 51756 · 注记豁免 331 · 拟新增 51 · 迁移期引文 323 · 声明源缺位 0。分段：用例号悬空 0 ∥ 路径/坐标悬空 0 ∥ 符号·窄悬空 0。

**自引入两点**（当场自修，复跑复核）：MODEL-SPECS 变更记录裸坐标 `config.mjs:104-110`（⇒ 全前缀）∥ ACP-CLIENT `:619` 加注后 315 字符（⇒ 折行）。

**验收对照（回指）**：#953 三档零失真主张（`resolveReviewDocPaths` 邻域）✓ ∥ #954a 表行零在（44 档）✓ ∥ #954b 该档零陈旧坐标（逐处）✓ ∥ #977 三公式句 = 可用窗口口径 ✓ ∥ #1000-② 新指针节名在位 ✓ ∥ #983 回填值 = 实读 ∥ 聚合自洽 ∥「拟新增」零残留（凡已落盘）✓ ∥ #924 十四锚终态全 ✓。

**报告面观察（不入闸 · 非本笔引入）**：行数面差异 13（桌面域声明——报告态）∥ 符号·宽报告面 ∥ 标记冗余 6（需求档 ∥ 他档）——本笔零触。

**变更记录**：2026-10-07 — §2 实施轮块（余六条目设计档面落盘；复跑 悬空 0 · 行宽 OK · exit 0）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**范围**：评审对象 = 本批 §2（设计面 · 8 条目）∥ 未扩面（源档旁读仅用于抽查核验）。判据降级声明：本评审上下文未提供项目标准档与文档地图（见发现 10）。

**实读核验（抽查）**：#958 引文 `2026-10-06-prompt-three-layer.md:271` 在（exit 0 @10-06 09:0x ∥ 4 basename ∥ 38 悬空）；检查器规则 `scripts/doc-check-anchors.mjs:186-197`（唯一 basename 回退）与修法（引用前缀补全）一致；#953 全数核真（宿主 `thincoder-core/agent-tools/review-facts.mjs:72` ∥ 消费 `advisor.mjs:16`/`:121` ∥ `advisor-async.mjs:56`/`:399` ∥ `agent/write-gate.mjs:44` 再出口仅 `REVIEW_ROOT_KEYS` + `resolveReviewRootsFor`）；#954a 核真（`thincoder-core/advisor/` 全树 `§18.7` 零命中；残差表行在 `docs/core/design/DOC-DISCIPLINE.md:479`）；#954b 核真（`thincoder-core/advisor/compaction.mjs:42` = `export const REVIEW_TIMEOUT_MS = 600_000` ∥ 核内消费唯一 `loop.mjs:104` ∥ 核内零 run.mjs 再出口）；#977 两落点在盘（`CONTEXT-COMPACTION.md:61` ∥ `MODEL-SPECS.md:1071` 行「读什么」列现仅 `context`）；20 受影档全在盘。行数抽查（口径 = 内容行 ∥ 文末空行不计，与 #983 命令同）：server/PROJECT 320 ✓ ∥ gateway/API 232 ✓ ∥ webui/WEBUI 531 ✓ ∥ AGENT-PARAMS 141 ✓ ∥ DOC-DISCIPLINE 1678 ✓ ∥ CONTEXT-COMPACTION 800 ✓ ∥ vsc WEBVIEW 196 ✓ ∥ i18n-zh 350（行）✓；批内件三档 ✗（见发现 1）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 受影响文件标注（criterion 8 抽查） | 🟡 | 批内件三档行数与本盘不符（表头声明「行数 = 本设计轮读数」，`2026-10-07-doc-cleanup.md:146`）：载「`2026-10-06-console-provider-redo.test.mjs` **561**」（`:157`；该值本身引自旧档——`:128` 注「（`2026-10-06-console-provider-redo.md:131`/`:159`）」），实读 = **568**；`-models-config.test.mjs` 载 267 实读 **270**；`-models-config-ui.test.mjs` 载「`-models-config-ui.test.mjs` **462** 件名+双行数入设计档」（`:126`）实读 **493**。三档均无逐档增量（`≤±N`/「结构不变」）标注。 | 按 #983 给定命令重读三档，回填现值 + 逐档增量（`≤±N`）；对 493 行档同时标出距 500 硬线余量（约 7 行），供拆分决定用。 |
| 2 | 文件体积档位处置 | 🟡 | >500 硬线件处置含免检退路「∥ 不可切则认账登记（带窗口）」（`:128`）——与本批验收「批内件全件 ≤500」（`:129`）/「批内件 ≤500」（`:181`）互斥；>300 档（实读 493）仅「拆档登记」（`:126`），无主动拆分复核。 | 对 >300 档补一条显式档位结论（拆分计划 ∥ 不拆理由 + 窗口 + 触发阈值）；>500 档删「认账」退路（保持「拆分 ∥ 停下上报」二择），或让验收句明写该例外。 |
| 3 | 根因面（#958） | 🟡 | 根因句只点「`thincoder-server` 树 4 个 basename」（`:58`：`config.mjs` ∥ `log.mjs` ∥ `providers.mjs` ∥ `errors.mjs`），但 66 条按族表（`:74`–`:84`）跨 **7** 个碰撞 basename——`renderer/app.mjs` 族（20，`:74`）∥ presets 族（4，`:78`）∥ provider-admin 族（3，`:81`）的重复件同在 server 树（实读：`thincoder-server/public/app.mjs` ∥ `thincoder-server/src/ops/presets.mjs` ∥ `thincoder-server/src/gateway/provider-admin.mjs`）。「4」易被读作当前碰撞面。 | 补出完整碰撞集（7 个 basename）或逐簇起爆时点/增量步（38→58→62→65→66 各步触发件）；修法（前缀补全）与检查器规则一致，不受影响。 |
| 4 | #954b 落点覆盖 | 🟡 | 落点列名 `:22`/`:89`（+ §6.1 表 `:69` 同族）（`:99`），判据为「坐标 `:42` ∥ 消费点 `loop.mjs:104`」（`:178`）；同档其余位点仍载旧坐标（实读：`compaction.mjs:37` 另见 `AGENT-PARAMS.md:31`/`:57`；`loop.mjs:103` 另见 `:23`/`:57`/`:70`）——按名列举施工会漏 2–3 处，判据则暗示全档清。 | 把该名的全部陈旧坐标逐点列入设计（或判据改写为「该档逐处 `:37`/`:103` 零残留」），保留已核的 `:42` / `loop.mjs:104` 值。 |
| 5 | 角色路由一致性 | 🟡 | §1.4 路由只给 `scripts/**` 父侧直执、`docs/**` 归设计面（`:39`：「文档面（`docs/**`）= eng-designer 实施面」∥「`scripts/**` 若确需改（如 doc-check 判面）= 父侧直执」），而 §2 上抛把批内件（在 `docs/batches/`，见 `:157`）归「工程工具面——§1.4 父侧直执面」（`:185`）——同一路径两条规则口径不一。 | 把 §1.4 路由措辞扩到文件类（明写 `docs/batches/*.test.mjs` 属工程工具面），使两条规则对同一路径不发散。 |
| 6 | 验收面（收口协调） | 🟡 | 验收表（`:172`–`:183`）未区分可本批自笔收口与依赖上抛项/在飞批的判据：#958「修去条数 = 60」（`:176`）可自证；#654「WEBVIEW 悬空归零」（`:182`）、#924「31 项终态全」（`:183`）、#1000 两处（`:180`）依赖「需求档面修 5」（`:185`）与 `BROWSER-TOOL:52` 在飞批同轮落位。 | 给验收表逐行加收口来源标（本批自笔 ∥ 上抛项笔 ∥ 在飞批），使 §5 实施记录与 §6 收口段各自对源核对，不留悬空行。 |
| 7 | 记录内坐标漂移 | 🔵 | §1.2 记 `DOC-DISCIPLINE:466`（`:26`），§2 实读为「现 :479」（`:98`）——盘面 = 479（该行载 `:217` `§18.7`）。 | §1 坐标随 §2 现读收正，或加「§1 坐标 = 台账行时点值」注。 |
| 8 | 面别计数可追性 | 🔵 | 面别拆分「cli/design 5 ∥ core/design 29 ∥ desktop/design 25 ∥ render-core/design 1」（`:66`）无法由族表（`:72`–`:84`）复现——族表有「目标」列、无文档面列（如「桌面 `config.mjs:49`（UI:673）」（`:76`）归属在「桌面临档或 `thincoder-core/config.mjs`」间未定；unverified：其实际面别不可由本档判定）。 | 族表加一列文档面（或逐档条目数），使 60/6 拆分可审。 |
| 9 | 记录卫生 | 🔵 | §1 状态行仍留未填占位注：「**状态行**：🔄 进行中（…）」（`:6`）。 | 填充或删除该注（§1/§2 模板占位行按批次记录约定合法，可留）。 |
| 10 | 方法学（判据降级声明） | 🔵 | 本评审上下文未提供项目标准档与文档地图，方法学/文档归属两项按已给材料判定：如 `:135`「④ 落笔（**父侧笔**——需求档面，D1）」的 D1 内容、四步工作流口径均无源可核（unverified）。 | 后续评审上下文附标准档/文档地图指针；本批受影响处（如 D1 归口）实施轮按在盘纪律档复核一次。 |

**计数**：🔴 0 ∥ 🟡 6 ∥ 🔵 4。
**VERDICT: pass**（无 🔴；🟡/🔵 非阻断项见上表）。

## §4 用户批准（主 agent）

**§4 用户批准（代签 · 2026-10-07）**

**授权依据**：用户本日全链授权（「自动跑」→「可以，自动干到落地」→ 13:1x「攒批一起吧」——本批在攒批列内）。

**代签自缚三条（缺一不复签）**：① 评审通过（§3 轮次 1 = VERDICT pass）✓；② 修轮落地并核验（§2 修轮块七号——父侧逐点核验在案：`:60` 7-basename 齐全 ∥ 族表面列列和 66 = 60 + 6 复算 ✓ ∥ `:103` 陈旧坐标逐点 ∥ `:131`/`:132`/`:170` 档位处置自洽 ∥ `:151`/`:162` 行数 = 修轮实读 ∥ `:179`–`:188` 收口来源列 ∥ `:190` 路由明写）✓；③ 令牌在手（会话槽）✓。**评审后零范围变更**。

**批准面**：§2 全表（八条目）+ 修轮块——实施三面分工：**设计档面（25 档）= eng-designer 实施面** ∥ **需求档面 = 主 agent 笔**（上抛项在案）∥ **批内件拆档等工程工具面 = 父侧直执**。基准读数 = 修轮复跑 悬空 **65**（`BROWSER-TOOL:52` 已收正——原基线 66 含在飞 1）；修后目标以 §5 当刻实读为准（观察条在案）。

**已派**：eng-designer（设计档面——逐行读认）；父侧笔同轮（需求档面 + 批内件拆档）。§1.4 路由扩注已落（§1 补二）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-07）**

**链条**：点火（用户「攒批一起吧」）→ §2 设计（三段落 + 修轮 7 条落）→ §3 评审轮 1 pass → §4 代签（全链授权在案）→ 实施（**双面**：设计档面 = eng-designer 两轮——#958 段 20 档 + 余六条目段 12 档；需求档面 + 批内件拆分面 = 父侧直执）→ 本节收口。

**八条目验收（回指 §2 验收对照表 :199-208）**：

| # | 落 | 父侧读数 / 证据 |
|---|---|---|
| #958 | 20 档 60 条（B 46 ∥ A 13 ∥ 形 1） | 悬空 **60 ⇒ 0 · exit 0**（父侧自跑；#28 轮复跑同值） |
| #953 | 三档六处失真子句删 + 变更记录 | 现盘零再出口实读（§2 实施块） |
| #954 | a 行核销 + 计数 45⇒44 ∥ b 坐标收正（5+3）+ 谓词删 | 逐处实读在案 |
| #977 | CONTEXT-COMPACTION 四锚（阈值 = 可用窗口 × 0.6）∥ MODEL-SPECS `:1071` `maxOutput` | 逐处实读在案 |
| #1000 | ①③ 需求档（前轮）∥ ② DOC-SYSTEM `:309`/`:310`/`:312` 重锚现家节 | 五条实读在位 |
| #983 | 三档回填（497/473/334∥350/270∥493/238 ∥ 行 350∥353·键 306∥311 ∥ 小计 1362 自洽） | 逐值实读在案 |
| #654 | WEBVIEW 46/46 + 连带 4 + 自修 2 | 该档 ✗ 0（与全库归零同拍） |
| #924 | 31 项全收（需求档 17 ∥ ACP 14） | 标记/改述逐条在案（`ACP-CLIENT.md` 变更记录 `:797`）；94 配对 = 维持不扩面（边界 `:195`） |

**批内件拆分面（父侧直执 · 工程工具面）**：`-console-provider-redo.test.mjs` 568 ⇒ **334** + **350**（`-runtime` 新档）；闸链 21 ⇒ **22**；六档 pin 随动（`=21`⇒`=22` + 题/头注）；server 真闸复跑 **173/173**（22 件链 · fail 0——父侧）。

**父侧验证（亲跑 · 全链）**：`node scripts/doc-check.mjs` ⇒ **悬空 0 · exit 0 · 行宽 OK**（汇总：候选 51756 · 注记豁免 331 · 迁移期引文 323 · 声明源缺位 0）；server 真闸 **173/173 · fail 0**。

**结算同步清单**：

- 角色表：§1 父 ∥ §2 eng-designer ∥ §3 评审子代理 ∥ §4 父（代签）∥ §5 **不适用**（本批无 eng-coder 段——实施面 = eng-designer 两轮 + 父侧直执）∥ §6 父。
- 状态行 → **已收口 2026-10-07**（紧随 close 冻结）。
- 计数 / 指针：本 §6 表 8 行；目标档变更记录 = 需求档 21 行 + 设计档 12 行（在档）；§2 三段在案。
- **前批遗留互核**：同轮旧档扫尾——补闭 4 档（doc-check-face ∥ reopen-last-project ∥ window-maximize ∥ provider-model-metadata）+ core-release 落「暂缓 · 复核条件」标 + packaging-release ∥ slash-commands 维持开（真实用户门余项）；残量条目化（#1017）。
- **台账核销 8 行**：**#654 ∥ #924 ∥ #953 ∥ #954 ∥ #958 ∥ #977 ∥ #983 ∥ #1000**（随本节；settlement line = 会话 `/ledger` 面）。
- 暂缓批复核：无新增可启（条件均未满足）。

**测试面两行**：① 本批单测文件 = 拆分产出两档（334 + 350——随 `2026-10-06-console-provider-redo` 批档存档）+ 六档 pin 随动；本批无新增单测（文档面为主）② 集成场景面 = 无影响（文档面 + 闸链件数随动）。

**收口判词：已收口 2026-10-07**（doc-cleanup 批——八条目全落 → 父侧复跑 悬空 0 · exit 0 ∥ 行宽 OK ∥ server 闸 173/173 → 本节 → 冻结）。
