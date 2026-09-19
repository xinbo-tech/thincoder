# 批次档 · 2026-09-17 · docRoot 多根数组支持（docroot-multiroot）

> 段位：工程模式 v2 机制面（M1 manifest · M4 评审根判定）。
> 触发：用户 2026-09-17 22:28「那只能支持多根数组了。」——裁定机制缺口修法（承父侧 22:2x 上报：`docs/cli` · `docs/vsc` 部分层未纳入 docRoot ⇒ 部分层设计档评审点火被拒）。
> 授权：自动链（代点火）——同 22:08 约定；要接管说一声。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-17（docRoot 多根 · 部分层评审根）

### 1.1 问题（实况）

- 2026-09-17 22:24 实核：评审根判定 = manifest `docRoot` 五键值（`thincoder-core/agent/write-gate.mjs:33` `REVIEW_ROOT_KEYS` 固定；`:43-56` 解析——基数 = 项目根，2026-09-17 修复在案）；五键**单路径**形态，本仓现值仅覆盖 `docs/core/**` + `docs/batches`。
- canonical 部分层（2026-09-15 建：`docs/cli/design/**` · `docs/cli/requirements/**` · `docs/vsc/design/**` · `docs/vsc/requirements/**`——登记见 `docs/README.md:14`）**不在任何评审根内** ⇒ 部分层设计档（如 `docs/cli/design/TUI.md`）无法作为评审对象（zero-block 批实测被拒）。
- 参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**` = 迁移期参照历史——`docs/README.md:3-4`）**不应**入评审根——本批零碰。

### 1.2 裁定（用户 2026-09-17 22:28）

`docRoot` 值支持**多根数组**（向后兼容：单串照旧）。形态例：

`"design": ["docs/core/design", "docs/cli/design", "docs/vsc/design"]`

### 1.3 父侧 recon（待设计轮实核细化）

- `thincoder-core/manifest.mjs`：`DEFAULT_MANIFEST.docRoot`（五键单串）· `fillDefaults`（子键逐个补默认）· `validateManifest`（docRoot 判据）——数组形态的补默认 / 校验语义待定。
- `thincoder-core/agent/write-gate.mjs`：`resolveReviewTargetPaths`——数组展开（去重）语义待定；基数 = 项目根（修复在案，勿回退）。
- **docRoot 消费面全仓 grep 实核**（设计轮任务）：`batch-segment.mjs`（`docRoot.batches` 第二基底）· `doc-check.mjs`（`:109` 引用面）· 两端装配 / 机检脚本——逐处列出 + 兼容策略定案。
- 本仓数据档 `thincoder/PROJECT-MANIFEST.json`：批内改多根（`requirements` / `design` 各加 cli/vsc 部分层路径；`batches` 不动）。

### 1.4 边界（本批不做）

- 不动 `REVIEW_ROOT_KEYS` 五键集合（只管**值形态**）；不新增键。
- 不纳入参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）。
- 不动其他 manifest 字段（`phase` / `access` 面 = manifest-closeout 批已处置）。
- 不顺手改评审机制其他面（token 门 / 批档门 / 门序）。

### 1.5 段序

1. 设计（eng-designer）：数组语义定案（解析 / 去重 / 补默认 / 校验 / 兼容）+ 全消费面清单 + §2 任务书；
2. 设计评审（**自动链：代点火**——沿用用户授权）；
3. 父侧裁决 → §4（父侧代签）；
4. eng-coder 实施；
5. 父侧收口（§6）+ 台账 #32 核销。

**下游指针**：zero-block 批（`docs/batches/2026-09-17-subagent-zero-block.md`）为本机制的首个消费者——本批落定后其评审可点火（其设计重落 canonical 由 fix 轮 id=7 完成）。

**父侧注（2026-09-17 22:28 · 派单阻塞实录）**：设计者首轮派单被 **F3 带宽门拒**（原文：`bandwidth full: 1 engineering implementation batch(es) already in flight — caps at 1 concurrent (manifest access 带宽档) … §2.2 F3`）——该门 = 本晚刚拆（F3 裁撤批：提交 `e746f7ad`）；运行进程启动早于拆除落盘 ⇒ 内存中仍为旧模块。**处置**：等 id=7 落定后重试；仍拒 → 用户重启使拆除生效，随即重派 + 顺带验证门消失（拆除的活体验证一例）。

**父侧注二（2026-09-17 22:40 · 设计轮发现处置）**：F1（并发写面——closeout 实施轮与本批同碰 `manifest.mjs` / `PROJECT-MANIFEST.json`）→ **父侧裁定：两批实施串行**（closeout 先、本批后——本批 coder 待 closeout 收口后派）；F2（需求锚缺）→ **Fixed**（父侧落锚：`SPEC-MANIFEST.md` ②.7 + AC-M1-7，回指设计 AC-7–AC-13）；F3（「二道防线」声明 vs 实况）→ **另立技术待办 #33**（本批零碰）；F7（机检基线红口径）→ **父侧裁定：按「零新增」判**（承 #26 存量债）；F4/F5/F6 → 接受「零改」判定。

**评审轮次 1（2026-09-17 22:47 · VERDICT: pass——🔴0 / 🟡3 / 🔵1）处置**：发现 1/2/3/4 全部 **Accepted · 派 fix 轮**——①「缺环 / 待落锚」四处文本 → 回指已落锚（`SPEC ②.7 + AC-M1-7`）；② A8 机检腿 → 改「零新增」口径 + 记基线读数（悬空锚 837 / 行宽 4）；③ 数组「元素非空」→ 复述 trim 口径 + AC-11/T20 补空白串元素拒例；④ §2.3 第 7 行 `access` 归属 → 收正为 `manifest.test.mjs`。修毕 + 父侧核验后 → §4 代签 + 派 coder（**受 F1 串行约束：待 manifest-closeout 批收口**）。引证说明：host 核验 0/6 为引用格式 / 解析 artifact（同历轮）——父侧已逐条实读复核，实质成立。

**fix 轮（id=6）交付 + 父侧核验 ✓（2026-09-17 22:52）**：发现 1–4 全部落位（`MANIFEST.md:76`/`:97`/`:123`/`:171`/`:172`/`:201`/`:219`/`:258` · 批档 `:76`/`:80`/`:147`/`:149`/`:152` 实读相符；变更记录 `:279-282`）；机检基线实测复核 = 悬空锚 **837** · 行宽 **5**（父侧自跑复现；其中 +1 系父侧 `LOGGING.md:82` 插句——已同轮折行收正至 **4**；存量净值 = 4，零新增判定成立）。上报点处置：(2) 历史条目 `MANIFEST.md:276` 措辞保留 → **接受**（零语义）· (3) `:3`/`:85` 悬空 = 排除面 ✓ · (4) F1 实施面实质解除（closeout 已提 `c942b89e`、同碰文件无未提交改动）——coder 仍以 closeout §6 收口为闸。
- **实施轮（id=8）交付 + 父侧核验 ✓（2026-09-17 23:08——端到端 8 根全出）**：A1–A8 全 ✅（core **294/294** 独立复跑 · 谓词/端到端父侧实跑逐态对上 · 机检零新增 837/4 · 行数 271/85/296/177/35 逐对）；§5 决策 D1–D3 → **接受**；观察 ①–⑤ → 登记（① 预计增量 = 量级参考，不追改）。

> 本节之后由 eng-designer 接手写 §2 批次任务与设计档修订。

## §2 批次任务（eng-designer）

**状态：任务书就绪**（2026-09-17 22:5x · eng-designer）。实施者 = eng-coder（设计 token 门——签发在评审 + 用户批准之后，值不落文档）。
本 §2 = coder 任务书本体；逐字语义 / 编辑点 / 用例全文住设计档（`docs/core/design/MANIFEST.md` §2.7 / §3.1 / §3.2 + `docs/core/design/ENGINEERING-MODE-V2.md` E1/E2），本段只做任务书 + 口径锚。

### 2.1 条目与范围

| # | 台账 | 类 | 内容（**用户 2026-09-17 22:28 裁定**） |
|---|---|---|---|
| 1 | #32 | 技术待办（待设计 → 设计就绪） | **`docRoot` 值形态扩为「单串 \| 多根数组」**：canonical 部分层（`docs/cli/**` · `docs/vsc/**`）纳入评审根——部分层设计档评审点火被拒的机制缺口 |

- **做**：值域扩展（串 \| 非空串数组）+ 形态判据 / 解析单源（M1 两新导出）+ 两消费点接线（M4 评审根解析 · M3 批次档第二基底）+ 本仓数据档改多根。
- **不做**：见 2.7 出批边界。
- **性质**：值形态扩展——零新增键、零改判据本体，单串语义零变（向后兼容）。

### 2.2 落档位置（三方一致）

| 链 | 载体 | 状态 |
|---|---|---|
| 需求（源） | 批次档 `2026-09-17-docroot-multiroot.md` §1.2（用户裁定）+ 台账 #32 | **本批需求源** |
| 需求（档面） | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`） | **已落**（2026-09-17 22:40 父侧落锚——F2 = Fixed；AC-M1-7 逐条回指设计 AC-7–AC-13） |
| 设计 | `MANIFEST.md`（**§2.7 新增** · §1.2 F7 · §1.4 · §2.1#5 · §2.2 接口 · §2.3 表 · §2.4 KD-M1-6–M1-9 · §2.5 · §3.1 AC-7–AC-13 · §3.2 T15–T22）· `ENGINEERING-MODE-V2.md`（E1 两行 + E2 一行 + 变更记录） | **本批已落**（设计者写域——coder 零写） |
| 批档 | 本节 | 本批 |

**需求锚已落**（2026-09-17 22:40 父侧落锚——F2 = Fixed）：需求档 ②.7（`SPEC-MANIFEST.md:19`）+ AC-M1-7（`:37`，逐条 = 设计档 AC-7–AC-13）——三方（需求源 → 档面 → 设计）闭环。

### 2.3 设计定案（逐条可机判）

| 定案点 | 结论 |
|---|---|
| 值域 | 非空字符串 \| 非空数组（元素皆非空字符串）；空串 / 空数组 / 混入非串 / 非串非数组 → **非法** |
| 语义 | 串 = 该键取此路径；数组 = 该键取这些路径（**完整声明**——不与默认合并、不追加默认） |
| 补默认 | 缺子键 → 补默认**单串**（`DEFAULT_MANIFEST` 五键保持单串） |
| 非法值 | **校验拒**（`validateManifest` errors 含 `docRoot.<键>`；`readManifest` `reason:'invalid'`；`writeManifest` 拒落盘）——不静默跳过 |
| 解析 | `docRootPaths(value, cwd)` → 绝对路径数组：展开 → `trim` + `\` 归一 → 基数 = 项目根（`docRootBase`）→ 去重保序 |
| 判据单源 | 谓词 `isValidDocRootValue` / 解析 `docRootPaths` 落 `thincoder-core/manifest.mjs`；校验面与消费面共用（两新导出，勿第二实现） |
| M4 接线 | `resolveReviewTargetPaths`：逐键 `docRootPaths(v, cwd)`（跨键去重保留末尾 `Set`） |
| M6 | **零改**（消费已解析绝对路径列表） |
| M3 接线 | `resolveBatchDocPath` 第二基底：逐基底按序复判（首个可读者胜；全不可读 → throw 不变）；第一基底（cwd）零变 |
| 本仓数据档 | `requirements` / `design` 改三根数组（core + cli + vsc）；`specs` / `modules` / `batches` 保持单串（部分层无此目录——不预造惰性根） |

### 2.4 受影响文件表（coder 实施面 · 行数 = 设计轮实测口径）

| # | 文件 | 现况（行数） | 动作（函数级 + as-of 行号） | 预计增量 |
|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 243 | 新增导出 `isValidDocRootValue` / `docRootPaths`（`docRootBase` `:67` 邻位）· `validateManifest` 的 `nestedKeys` 循环 `:128-137` 内加 `docRoot` 子键值形态校验 | +~28 |
| 2 | `thincoder-core/agent/write-gate.mjs` | 87 | `resolveReviewTargetPaths` `:50-55` 改走 `docRootPaths`；import `:25` 加两符号 | +~4 / −2 |
| 3 | `thincoder-core/agent-tools/batch-segment.mjs` | 294 | `resolveBatchDocPath` 第二基底 `:80-86` 改逐基底复判；import `:28` 改引 `docRootPaths` | +~4 / −3 |
| 4 | `thincoder-core/agent-tools/advisor.mjs` | 280 | 零改（分类消费点 `:121-131`） | ±0 |
| 5 | `scripts/doc-check.mjs` · `doc-check-anchors.mjs` · `doc-check-width.mjs` | 121 / 299 / 66 | 零改（读 `checkConfig` / `MANIFEST_REL`，不读 `docRoot`） | ±0 |
| 6 | `thincoder-core/test/docroot-multiroot.test.mjs` | ——（**新档**） | 新增 AC-7–AC-13 / T15–T22 | +~130 |
| 7 | `thincoder-core/test/manifest.test.mjs` · `batch-segment-manifest.test.mjs` | 303 / 132 | 零改（兼容性由「零改即绿」证明） | ±0 |
| 8 | `PROJECT-MANIFEST.json`（本仓数据档） | 28 | `requirements` / `design` 两键改三根数组（**直改数据档**——`writeManifest` 的 `writer:'main'` 是机制 API 门，非文件编辑面；同 `manifest-closeout` 批 §2.4 第 9 行先例） | +2 |

> **并发提醒**：`manifest-closeout` 实施轮同碰第 1 / 8 行文件——两批**串行实施**（同文件并发写 = 丢改风险）；行号为 as-of 参考，落点以函数名为准（D4）。

### 2.5 eng-coder 任务书（六强制字段）

**① 目标与理由**——落用户 2026-09-17 22:28 裁定（台账 #32）：`docRoot` 值支持**多根数组**，使 canonical 部分层（`docs/cli/**` · `docs/vsc/**`）纳入评审根；现状 = 五键单路径（`write-gate.mjs:33` `REVIEW_ROOT_KEYS` + `:53` 单值判定）⇒ 部分层设计档（如 `docs/cli/design/TUI.md`）作评审对象被 M6 分类拒。

**② 轮次**——`initial`（本批首轮实现轮；后续修正走 `fix` 轮）。

**③ 已知事实**（设计轮实核）——
- 值形态消费点全仓 grep = **7 处**（清单 + 逐处策略见 `MANIFEST.md` §2.7）：**改 2**（`write-gate.mjs:43-56` · `batch-segment.mjs:80-86`）+ **零改 4**（`advisor.mjs` · 三机检档 · 两壳面） + **本仓数据档 1**。
- 基数 = 项目根（`manifest.mjs:67` `docRootBase`；2026-09-17 修复在案——**不得回退**）。
- `fillDefaults`（`manifest.mjs:159-174`）子键**原样搬值**（无形态转换）——数组天然透传，无需改；拒面加在 `validateManifest`。
- 壳面对非法档已就位：`make-agent.mjs:51-52`（`reason:'invalid'` → 抛「拒进正常循环」）· `setup.mjs:380` 同款——本批零改。
- 既有测试 fixture 全为合法单串（两档实读）——新校验不破既有用例。
- 提示：本设计轮与前批实施轮并发（`manifest.mjs` 正被改）——**开工前先 `git status` 复读当前行数**，以函数名定位。

**④ 设计要点与禁止范围**——
- 实现面 = 2.4 表 1–3 / 6 / 8 行逐处；两设计档已落，**coder 零写设计档**。
- 判据 / 语义 / 管线 = `MANIFEST.md` §2.7 逐字照抄（措辞不得自创）；导出符号名 = `isValidDocRootValue` / `docRootPaths`。
- **禁触**：`REVIEW_ROOT_KEYS` 键集 · 新增 manifest 键 · 默认档五键值形态 · 其他 manifest 字段（`phase` / `version` / `activeBatch` / `promptsLanding` / `checkConfig`）· M4/M6 判据本体 · `readManifest` 整档回退语义 · token 门 / 批档门 / 门序 / 冻结窗口 · 需求档（主 agent 域）· `_archive/**` · 参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）· 已冻结批档。
- 行数实测回写 §5（改前 → 改后）。

**⑤ 验收标准**——2.6 表 A1–A8（逐条机判；报告逐条给读数）。

**⑥ 交付报告格式**——交付表（A1–A8 逐条状态）+ 触碰面清单（file:line 区间 + 行数实测改前→改后）+ 验证命令与读数（新档单测 / core + cli + vsc 三端 `npm test` / `node scripts/doc-check.mjs` / 端到端读取值原文）+ 出批边界外所见。实施记录自写批档 §5（`batch_segment`，段 = §5）。

### 2.6 验收标准（A1–A8 · 逐条机判）

| # | 验收标准 | 判据（命令 / 断言） | 设计档回指 |
|---|---|---|---|
| A1 | 单串零变（既有档零改即绿） | 既有 `manifest.test.mjs` / `batch-segment-manifest.test.mjs` **零改**跑绿 + 新档单串用例 | AC-7 / T15 |
| A2 | 数组展开（基数 = 项目根，顺序 = 声明序） | 新档：`resolveReviewTargetPaths` 含全部声明根（绝对路径） | AC-8 / T16 |
| A3 | 去重（键内 + 跨键，保序） | 新档：重复声明 → 结果唯一 | AC-9 / T17 |
| A4 | 补默认单串 / 数组不合并 | 新档：缺子键 = 默认串；给数组 = 数组原值（不含默认路径） | AC-10 / T19 |
| A5 | 非法形态拒（不静默） | 新档：`""` / `[]` / `["a",42]` / `123` / `{}` / `null` → `validateManifest` `ok:false` + errors 含 `docRoot.<键>`；`readManifest` `reason:'invalid'`；`writeManifest` 拒 | AC-11 / T20 |
| A6 | M3 第二基底逐基底复判 | 新档：数组第 2 基底命中 → 返回该路径；全不可读 → throw | AC-12 / T21 |
| A7 | 端到端（本仓部分层入根） | `node -e` 读本仓：`resolveReviewTargetPaths` 含 `docs/cli/design` · `docs/vsc/design` · `docs/cli/requirements` · `docs/vsc/requirements` | AC-13 / T22 |
| A8 | 三端回归 + 机检（**零新增**口径——父侧裁定，承 #26 存量债） | `cd thincoder-core && npm test` · `cd thincoder-cli && npm test` · `cd thincoder-vscode && npm test` 全绿；`node scripts/doc-check.mjs` **读数 ≤ 基线**（as-of 2026-09-17 22:5x 设计 fix 轮实测：悬空锚 **837** · 行宽 **5**）= 零新增 | 全局 |

### 2.7 出批边界（本批不做）与需求锚

- **出批**：`REVIEW_ROOT_KEYS` 键集 / 新增 manifest 键 / 其他 manifest 字段 / 评审机制其他面（token 门 / 批档门 / 门序 / 冻结窗口）/ 参照树纳入 / 其他 docRoot 消费面重构（`conventions.mjs` 面）。
- **需求锚**：需求源 = 批次档 §1.2 用户裁定 + 台账 #32；档面锚 = 需求档 ②.7（`SPEC-MANIFEST.md:19`）+ AC-M1-7（`:37`，逐条 = 设计档 AC-7–AC-13）——2026-09-17 22:40 父侧落锚，三方闭环。
- **并发**：`manifest-closeout` 实施轮同碰 `manifest.mjs` / 本仓数据档——串行实施（建议先 closeout 收口，再本批实施）。
- **设计轮附带发现（本批零碰，报主 agent）**：`MANIFEST.md` §2.5「二道防线 = M5 spawn 门 files 域排除 `PROJECT-MANIFEST.json`」**与实况不符**——`spawn-gates.mjs:74` 的 `PROCESS_BASENAMES` 仅 `["changelog.md"]`（族已随 M2 收窄），全仓 grep 无该排除实现；**未就地改**（改动的是纪律声明，属语义面——处置权归主 agent）。

### 2.8 §2 补注（行数二次复测 · 2026-09-17 23:0x）

`manifest-closeout` 实施轮在设计轮期间并发推进，两行实测已漂移——**以本补注为准**（落点仍以函数名为准）：

- 2.4 表第 7 行：`thincoder-core/test/manifest.test.mjs` **303 → 300**（`batch-segment-manifest.test.mjs` = 132 不变）；两档仍为**零改**面。
- 2.4 表第 8 行：`PROJECT-MANIFEST.json` **28 → 27**（该批已去 `access` 键）；本批改点 = `requirements`（现 `:6`）/ `design`（现 `:8`）两键 → 三根数组。
- 其余各行（`manifest.mjs` 243 · `write-gate.mjs` 87 · `batch-segment.mjs` 294 · `advisor.mjs` 280 · `doc-check.mjs` 121 / `doc-check-anchors.mjs` 299 / `doc-check-width.mjs` 66）复测不变。
- 数据档现键集已复核 = 六键（`version` / `phase` / `activeBatch` / `docRoot` / `promptsLanding` / `checkConfig`）· `docRoot` 五键齐全——本批在其上做值形态扩展，零键集变更。

### 2.9 §2 修正记录（设计评审轮 1 落修 · fix 轮 · 2026-09-17 22:5x · eng-designer）

> 评审轮次 1（§3）发现 1–4 全部 Accepted 后落修——**§2 上方各行已就地校正**（下引 file:line 为现读数）；设计档（`docs/core/design/MANIFEST.md`）同轮落修。实施仍归 eng-coder（**待 manifest-closeout 收口**——F1 串行）。

**1. 逐条落地表（发现 → 落点）**

| # | 发现（§3 轮次 1） | 落修（file:line = 现读数） |
|---|---|---|
| 1 🟡 | 「缺环 / 待落锚」四处文本已过时（锚已落） | 批档 `:76`（§2.2 落档位置表）· `:80`（§2.2 锚注）· `:149`（§2.7 标题）· `:152`（§2.7 锚条）→ 回指已落锚 `SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`）；设计档 `MANIFEST.md:123`（§2.5 末条）· `:201`（§2.7 末条）同改 |
| 2 🟡 | A8 机检腿「`doc-check` exit 0」与「零新增」裁定冲突 | 批档 A8（`:147`）→「三端 `npm test` 全绿 + `node scripts/doc-check.mjs` **读数 ≤ 基线**（悬空锚 **837** · 行宽 **5**——as-of 22:5x 实测）= 零新增」（三端腿不变） |
| 3 🟡 | 数组元素「非空」口径只靠词面继承（未复述 trim） | 设计档 `MANIFEST.md:76`（§2.2 谓词句）· `:171`（值表数组行）复述「`trim` 后非空（口径与单串同款）」；`:172`（值表非法行）· `:219`（AC-11）· `:258`（T20 输入集）补「空白串（`trim` 后为空）元素 → 拒」——**编号零变**（并入 T20 输入集，T15–T22 区间与 2.4 表第 6 行引用保持成立——D3） |
| 4 🔵 | §2.3 第 7 行 `access` 归属指向错误 | 设计档 `MANIFEST.md:97` 括注改指**前者** `manifest.test.mjs:36-45`（即 AC-6 / T14「去键兼容」用例，保留不动），删「随 closeout 批收正」字样 |

**2. 自检读数**（`node scripts/doc-check.mjs`，落修后 vs 基线）

- 悬空锚 **837**（基线 837）= 零新增；行宽 **5**（基线 5）= 零新增；exit ≠ 0 = 存量红（承 #26 存量债——按父侧「零新增」口径判）。
- 新增候选 +7（用例号 3 / 路径·坐标 2 / 符号·宽 2）**全部可解析**（悬空计数不变即证）。
- **基线读数更正**：派单记「行宽 4」，本 fix 轮两次实测均为 **5**——多出的两行 = `docs/core/design/prompts/persona-engineering.md:137` / `:139`（507 / 416 字符；`git show HEAD` 逐字比对：HEAD 同值，**非本批新增**；该档不在本批触碰面）。A8 判据行按实测写 5，判定口径仍为「读数 ≤ 基线」。

**3. 未落面（报父侧，本段零碰）**

- 设计档 `MANIFEST.md:276`（**docRoot 多根批**首轮历史变更条）仍含「需求侧待补」字样——历史条目按惯例保留（零语义；本轮新条 `:279-282` 已记去措辞）。
- 批档 §1 `:52` / §3 `:175` 保留「缺环 / 待落锚」原句——他段作者（主 agent / 评审子代理）的处置记录，本段零碰。
- §2.7 末条已记「设计轮附带发现（二道防线 vs 实况）」——按 §1 父侧注二裁定另立台账 #33，本批零碰。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

## 设计评审 · docRoot 多根批（发现表 + 计数 + VERDICT）

**评审基线**：四档全文实读（`MANIFEST.md` · `ENGINEERING-MODE-V2.md` · `SPEC-MANIFEST.md` · 本批档）；§2.3 受影响文件表 10 条行数注记逐条对盘实核（243 / 87 / 294 / 280 / 121 / 299 / 66 / 300 / 132 / 27）与编辑点（`docRootBase` :67 · `nestedKeys` 环 :128-137 · write-gate :33/:25/:43-56/:55 · batch-segment :28/:80-86 · advisor :121-131）全部相符；消费面 7 处清单经全仓 grep 复核无漏（`scripts/**` 零 `docRoot` 读取、两壳面零引用、无第二实现）。限制：本评审无项目标准档与文档地图可依——方法学合规按 AGENTS.md + 在评档自身规范判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | 需求侧锚已落（`SPEC-MANIFEST.md:19` ②.7 + `:37` AC-M1-7；本批档 `:50` 父侧注二记 F2 = Fixed），但设计/任务书四处仍写「缺环 / 待落锚」——`MANIFEST.md:123`（§2.5 需求侧锚缺）· `MANIFEST.md:201`（§2.7 需求侧待补）· 批档 `:74`（§2.2 落档位置表）· 批档 `:150`（§2.7 缺环） | 四处文本回指已落锚的 `SPEC-MANIFEST.md` ②.7 + AC-M1-7（回指设计 AC-7–AC-13），去「缺环 / 待落锚」措辞——三方链（需求源 → 档面 → 设计）闭合 |
| 2 | Acceptance | 🟡 | A8 机检腿要求 `node scripts/doc-check.mjs` exit 0（批档 `:145`），与本批档 §2 父侧注二 F7 裁定「按『零新增』判（承 #26 存量债）」（批档 `:50`，与本次评审声明的排除口径一致）冲突——基线红下该判据按字面不可满足，实施轮将报「A8 未达」或误撞存量修复面 | A8 机检腿改写为「零新增（相对基线读数）」并把基线读数（悬空锚 / 行宽计数）写入 A8 判据行；三端 `npm test` 全绿腿不变 |
| 3 | Clarity | 🟡 | 数组元素「非空」口径只靠词面继承：值表数组行（`MANIFEST.md:171`）未复述单串行的「`trim` 后非空」限定，§2.2 谓词句（`:76`）亦同；AC-11（`:219`）/T20（`:258`）非法集无空白串元素一例（T18 `:256` 只覆盖「带首尾空白（非空白）元素」）——实现若取裸非空，空白串元素通过校验且解析落回基数（评审根 = 项目根，M6 分类对全仓 .md 放行） | 「元素非空」口径明确为与单串同款（trim 后非空）；AC-11/T20 非法集补一条「空白串元素 → 拒」断言 |
| 4 | Clarity | 🔵 | `MANIFEST.md:97`（§2.3 第 7 行注）「后者含 `access` 钥匙」指向错误：`access` 残留 fixture 实在 `manifest.test.mjs:36-45`（前者）；`batch-segment-manifest.test.mjs` 全档（含 case-insensitive）零 `access`（且该用例即设计自列 AC-6/T14 的「去键兼容」自觉用例，「随 closeout 批收正」与 AC-6 口径相抵） | 括注改指 `manifest.test.mjs`（前者），并删/改「随 closeout 批收正」字样使其与 AC-6/T14 口径一致 |

**范围外注记（不给严重度）**：
- 本批触碰面的代码注释仍指已退役的模块设计路径 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md`（`thincoder-core/manifest.mjs:3` · `thincoder-core/test/manifest.test.mjs:3`；`batch-segment.mjs:12/:266` 指 `…MODULE-BATCH-SEGMENT.md`）——该目录现为空、档已归 `docs/core/design/_archive/modules/**`；指针刷新属 `_archive` 面，评审声明已排除，本批零涉。
- `SPEC-PROMPT-PIPELINE.md:14-15`（范围外档）把提示词模板根推导写作 `docRoot.design` + `/prompts`——数组形态下该推导歧义（今日无代码消费点）；M9 面被触碰时值得补一句口径。

**计数**：🔴 0 · 🟡 3 · 🔵 1（另 2 条范围外注记，不带严重度）

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-17 22:53 · 父侧代签**（用户 2026-09-17 22:08「自动跑完」授权——代签承 2026-09-11 先例）——批准范围：

1. **设计**：`docRoot` 值形态扩展（单串 | 多根数组——`MANIFEST.md` §2.7 + AC-7–AC-13 + T15–T22 + KD-M1-6–M1-9；架构 E1/E2 两行；需求锚 `SPEC-MANIFEST.md` ②.7 + AC-M1-7）；设计评审轮次 1 **PASS**（🔴0 / 🟡3 / 🔵1）——发现 1–4 已 fix 轮（id=6）落位并父侧核验；
2. **实现**：spawn `eng-coder`（任务书 = 本节 §2；设计凭证已签发——值不落档，运行时凭证）；
3. **实施面 = §2.4 表 1–3 / 6 / 8 行**（+ 第 7 行「零改即绿」证明）；出批边界 = §2.7。**时序**：受 F1 串行约束——待 `manifest-closeout` 批 §6 收口后派单。

## §5 实施记录（eng-coder）

**状态：实施完成（clean）**（2026-09-17 23:0x · eng-coder）。任务书 = 批档 §2.4 表 1–3 / 6 / 8 行；设计 = `docs/core/design/MANIFEST.md` §2.7 + §3.1 AC-7–AC-13 + §3.2 T15–T22（逐字照抄，零自创）；设计档零写。

### 5.1 交付表（A1–A8 · 逐条读数）

| # | 状态 | 判据读数 |
|---|---|---|
| A1 | ✅ | 单串零变：新档 AC-7/T15 用例通过；既有 `manifest.test.mjs`（300 行）/ `batch-segment-manifest.test.mjs`（132 行）**零改即绿**（`git status` 无其改动；core 全绿即证） |
| A2 | ✅ | AC-8/T16：三根按**声明序**、基数 = 项目根（`docRootPaths` 展开） |
| A3 | ✅ | AC-9/T17：键内重复 + 跨键同值 → 去重保序、集合无重复、跨键同值恰一次 |
| A4 | ✅ | AC-10/T19：缺子键 = 默认单串（`missingKeys` 含 `docRoot.specs`）；给数组 = 该数组原值（不含默认 `docs/design`）；默认档五键仍皆为串 |
| A5 | ✅ | AC-11/T20：`""` / `"   "` / `[]` / `["a",42]` / `["a"," "]` / `123` / `{}` / `null` / `["docs/a",null]` / `[[]]` / `["docs/a",""]` 共 11 例全部 `ok:false` + `errors` 含 `docRoot.design`；`docRootPaths` 对非法值 → `[]`（判据单源）；`readManifest` `reason:'invalid'`；`writeManifest` 拒落盘（含 `writer:'main'`） |
| A6 | ✅ | AC-12/T21：数组第 2 基底命中 → 返回该路径；两基底全不可读 → `throw`（fail-closed 不变）；无 manifest → v1 单基底 throw 不变 |
| A7 | ✅ | 端到端读数原文见 5.3 |
| A8 | ✅ | `cd thincoder-core && npm test` = tests 294 / pass 294 / **fail 0**；`cd thincoder-cli && npm test` = tests 603 / pass 603 / **fail 0**；`cd thincoder-vscode && npm test` = tests 588 / pass 588 / **fail 0**；`node scripts/doc-check.mjs` = 悬空锚 **837**（基线 837）· 行宽 **4**（基线 5、父侧记净值 4）= **零新增**（exit ≠ 0 = 存量红，承 #26 存量债） |

### 5.2 触碰面（行数实测改前 → 改后，`\n` 计数）

| # | 文件 | 改前 → 改后 | 变更（函数级） |
|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 243 → 271（净 +28 = 设计预估 +~28） | 新增导出 `isValidDocRootValue` / `docRootPaths`（`docRootBase` 邻位）；`validateManifest` 的 `nestedKeys` 循环内加 `docRoot` 子键值形态校验 |
| 2 | `thincoder-core/agent/write-gate.mjs` | 87 → 85 | `resolveReviewTargetPaths` 逐键改走 `docRootPaths`（跨键 `Set` 保留）；随接线失效移除 `resolve` / `docRootBase` import |
| 3 | `thincoder-core/agent-tools/batch-segment.mjs` | 294 → 296 | `resolveBatchDocPath` 第二基底改逐基底按序复判；import 改引 `docRootPaths` |
| 4 | `thincoder-core/test/docroot-multiroot.test.mjs` | 新档 → 177 | AC-7–AC-13 / T15–T22 八用例 |
| 5 | `PROJECT-MANIFEST.json` | 27 → 35 | `requirements` / `design` 两键改三根数组；`specs` / `modules` / `batches` 单串不动 |
| — | `thincoder-core/agent-tools/advisor.mjs` · 三机检档 · 两端壳面 · 既有两测试档 | ±0 | 零改（设计消费面「零改」判定成立） |

### 5.3 验证读数原文（A7 · 端到端）

```text
readManifest(thincoder) ok = true | errors = []
design       = ["docs/core/design","docs/cli/design","docs/vsc/design"]
requirements = ["docs/core/requirements","docs/cli/requirements","docs/vsc/requirements"]
specs/modules/batches = ["docs/core/requirements","docs/core/design/modules","docs/batches"]
resolveReviewTargetPaths(cwd = thincoder) →
  D:\teamcode\thincoder\docs\core\requirements
  D:\teamcode\thincoder\docs\cli\requirements
  D:\teamcode\thincoder\docs\vsc\requirements
  D:\teamcode\thincoder\docs\core\design
  D:\teamcode\thincoder\docs\cli\design
  D:\teamcode\thincoder\docs\vsc\design
  D:\teamcode\thincoder\docs\core\design\modules
  D:\teamcode\thincoder\docs\batches
```

（部分层四根入评审根；`docs/cli/design/TUI.md` 过评审根分类。）

### 5.4 决策透明 / 出批披露

- **数据档数组形态**：`requirements` / `design` 用**多行数组**（与本档既有 `JSON.stringify(…, null, 2)` 序列化一致——`writeManifest` 回写即此形态，避免下次写入产生格式翻动）；行数 +8 而非设计预估 +2（预估为量级参考，零语义）。
- **`write-gate.mjs` 行数 87 → 85**：设计预估「+~4 / −2」的量级差 = 原单值解析行连同其 `resolve` / `docRootBase` import 随接线一并失效（−2 行净额），零行为面遗留；审计已复核该档两个单点（评审目标解析 / 冻结窗口）与 `normAbs` re-export 均完整。
- **一轮出批改动（已披露）**：顾问评审轮 1 发现 1（🟡）——`manifest.mjs` 的 `resolveProjectRoot` 头上挂了两段互斥 JSDoc（旧段「向上到仓根」vs 定案段「纯向下，绝不向上」，与实现矛盾）→ 删除陈旧 8 行（删前 279 → 271）。该块非本批引入（closeout 批口径收正未同步注释），按「注释须与代码一致」直接修 + 单列披露；纯注释删除，行为面零变，core 复跑 294/294/0 不变。
- **顾问轮 2 三项 🔵 逐条 declined**（详见 5.5 响应表；均为非阻塞卫生项，不涉本批语义）。

### 5.5 审计与代码评审轮次与终态

| 轮次 | 类型 | 结果 |
|---|---|---|
| 内部偏差审计（explore · 只读） | 1 轮 | 唯一发现 = §5 未写（即本段）；**spec-conformance / scope / silent-simplification / single-source 四类均 no finding**（AC-7–AC-13 逐条对盘、出批边界逐项实核、全仓无第二实现） |
| 顾问代码评审 | 轮 1（全量） | VERDICT: **pass** · 🔴0 / 🟡1 / 🔵3 |
| fix 轮 | 1 轮 | 🟡（陈旧互斥 JSDoc）→ 已删；core 复跑 tests 294 / pass 294 / fail 0 |
| 顾问代码评审 | 轮 2（fix 核验） | VERDICT: **pass** · 修复 ✅ 已验证（−8 行号一致迁移、无隐藏改动）；三项 🔵 维持（未漂移）；无新增问题 |

**响应表（轮 1 发现 → 处置）**：

| # | 原# | 严重度 | 问题 | 处置 | 证据 |
|---|---|---|---|---|---|
| 1 | 1 | 🟡 | `manifest.mjs` 两段互斥 JSDoc（旧段「向上到仓根」 vs 定案段「纯向下」） | **采纳 · 已修**（删陈旧 8 行） | 现档 `manifest.mjs:35` / `:39` 单段定案口径 + `:45` 实现一致；轮 2 复核行号一致 −8、行为零变 |
| 2 | 2 | 🔵 | `docRootBase` / `writeRoot` 同式两份（基数判据） | **拒绝**（非阻塞卫生项；KD-M1-8 只要求「值形态判据 / 解析」单源——已满足；两者暂无漂移） | `manifest.mjs:62-63` / `:97-98` |
| 3 | 3 | 🔵 | 退役模块设计路径引用（头注 / `$anchor` / 数据档 `modules` 根） | **拒绝**（批档 §3 范围外注记 + §2.9 已报父侧；本批零碰） | `manifest.mjs:3` / `:124` · `PROJECT-MANIFEST.json:17`；`docs/core/design/modules/**` 无文件 |
| 4 | 4 | 🔵 | 测试档镜像 M6 谓词（真消费点漂移时不红） | **拒绝**（M6 本批零改；镜像已在用例注明「M6 分类同源口径」；真消费点本轮实读未漂移） | `test/docroot-multiroot.test.mjs:176` vs `agent-tools/advisor.mjs:125` |

**终态：clean**（无未决项、无 must-fix；本段即 §5 交付记录）。

## §6 验证与收口（父代理）

**父侧核验（不采信自述——读码 + 复跑）**：

- **端到端实跑**（A7）`:resolveReviewTargetPaths({cwd: thincoder})` = **8 根全出**：`docs/core/{requirements,design}` · `docs/cli/{requirements,design}` · `docs/vsc/{requirements,design}` · `docs/core/design/modules` · `docs/batches`（部分层入根 = 本批目标达成）。
- **谓词实跑**：`isValidDocRootValue` 单串/数组 ✅ · 空白串/空白元素/空数组/非串非数组 ❌（逐态对上）；`docRootPaths` 单串/数组/非法（→`[]`）逐态对上；`validateManifest` 对空白串元素 `ok:false` + `errors` 含 `docRoot.design` ✓。
- **读码**：`write-gate.mjs`（85 行）逐键 `docRootPaths` + 跨键 `Set` 去重 ✓ · `REVIEW_ROOT_KEYS` 零变 ✓ · `manifest.mjs` 两新导出（`:73-77` / `:88-93`）判据单源 ✓ · `batch-segment.mjs:84-88` 逐基底按序复判（首个可读者胜）✓。
- **复跑**：core **294/294 · 0 fail**（286 + 新档 8）· cli 603 / vsc 588（采信交付——两包零改面）· 机检：悬空锚 **837** · 行宽 **4**（= 基线，零新增；父侧自跑）。
- **行数逐档实核**：271 / 85 / 296 / 177（新） / 35——与交付清单相符。

**验收逐项（A1–A8）**：全 ✅（读数 = §5 交付 + 父侧实跑 / 实读；A8 机检按「零新增」口径达标）。

**决策处置（§5）**：D1 数据档多行形态（+8 行——与 `writeManifest` 回写形态一致，零语义）→ **接受**；D2 `write-gate` 净 −2（随接线失效的 import 一并移除）→ **接受**；D3 删陈旧互斥 JSDoc 8 行（顾问发现 1 🟡——「向上到仓根」旧段与纯向下定案矛盾，属收敛而非夹带）→ **接受**；内部评审三项 🔵 拒绝理由 → **接受**（均属批外面）。

**出批观察（登记，本批零碰）**：① 设计档 §2.3 预计增量与实测漂移（「预计增量 = 量级参考」惯例，实测以 §5 为准，不追改）· ② 退役模块路径引用（`manifest.mjs:3`/`:124` `$anchor` · 数据档 `modules` 根指向空目录——F-3 族）· ③ 容器根 manifest 存量（非本仓）· ④ M9 `SPEC-PROMPT-PIPELINE` 歧义（已记）· ⑤ `manifest.test.mjs` = 300 恰在软线（下次触及须先拆分或迁用例）。

**状态**：**已收口 2026-09-17**。本档冻结（不再回改）。

**尾巴指针**：台账 #32 核销；设计凭证链 = 交付核验后终结（值不落档）；**下游 = 零块批**（`docs/batches/2026-09-17-subagent-zero-block.md`——部分层入根后其设计评审可点火）。
